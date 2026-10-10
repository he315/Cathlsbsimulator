// ---------------------------------------------------------------------------
// Coronary physiology engine (pressure wire).
//
// Each stenosis loses pressure according to Gould's relation
//     ΔP = A·Q + B·Q²
// where A is viscous (Poiseuille) loss along the narrowed segment and B is the
// separation/expansion loss at the exit. Coefficients come from the lesion's
// minimal lumen area, the reference area and its length. Flow is set by the
// driving pressure and the microvascular resistance:
//     Pa − Pv = Q·Rmicro + Σ ΔP_i(Q)
// At rest the microcirculation autoregulates to hold resting flow constant
// until its vasodilator reserve is exhausted. Hyperaemia drops Rmicro to its
// minimum. Coronary flow is phasic (mostly diastolic), so the distal pressure
// trace and the wave-free-period ratio come from the same physics as FFR.
//
// Branched cases (physiology-left-main-and-ostial): a left main feeding the
// LAD and the circumflex in parallel. At each instant the junction pressure Pj
// satisfies, for every branch i,
//     Pa − Pv = LM loss(Q_total) + branch loss_i(Q_i) + Q_i·Rmicro_i
// solved by a safeguarded (damped) Newton iteration on Pj with an iteration
// cap (solveJunction). A branched case is read through a branch view: a
// CoronaryCase for the path ostium → left main → one branch, so the pressure
// wire session, the console and the pullback work on it unchanged. Downstream
// disease in one branch lowers the flow the left main carries and so hides
// left main severity in both (Brilakis 17.12, lesson cp-left-main-assess).
//
// A guide seated in a diseased ostium (aorto-ostial or ostial left main) is an
// obstruction in series with the lesion: it limits hyperaemic flow and damps
// the guide pressure, so FFR reads falsely high until the guide is
// disengaged (Brilakis 12.3, lesson cp-ostial-assess). Its size is a fit to
// the study Brilakis cites (module cp-ostial: mean FFR 0.87 engaged against
// 0.83 disengaged without side holes, 0.85 against 0.83 with them), not a
// measured geometry: see MP_OSTIAL_GUIDE and MP_SIDE_HOLE_SCALE.
//
// Post-PCI physiology (physiology-post-pci-handover): cases with a stented
// segment (CoronaryCase.stent), four presets for the branches of Brilakis's
// post-PCI algorithm, the algorithm itself and a builder of a post-PCI case
// from a deployed stent; see the section at the end of this file.
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent, TipVessel } from "../content/lab/tips";
import type { LabRaises } from "../content/lab/raisable/waiting";
import { normal, rngFrom, type RngState } from "./pci/rng";

export interface Lesion {
  id: string;
  /** position along the vessel, 0 = ostium, 1 = distal end */
  pos: number;
  /** diameter stenosis, 0–1 */
  ds: number;
  lengthMm: number;
  /**
   * The diameter stenosis the angiogram shows, when it differs from the lumen that sets the pressure
   * loss (a jailed side-branch ostium looks worse than it is: lesson pm-physiology-after-pci, Koo).
   * Display only; the physics uses ds.
   */
  looksDs?: number;
  /** How the lab names the lesion ("left main", "proximal LAD"); the id when absent. Display only. */
  label?: string;
}

export interface CoronaryCase {
  id: string;
  title: string;
  vessel: string;
  brief: string;
  refDiamMm: number;
  lengthMm: number;
  lesions: Lesion[];
  /** diffuse atheroma: extra viscous loss per mm, relative units (0 = none) */
  diffuse: number;
  /** maximal achievable flow increase with a normal epicardial vessel (CFR potential) */
  cfrPotential: number;
  /** mean aortic pressure, mmHg */
  map: number;
  /** guide catheter causes damping/obstruction if left engaged during hyperaemia */
  guideObstructs?: boolean;
  /** sensor drift that develops over the study (mmHg, positive = reads high) */
  drift?: number;
  /**
   * Resting flow this vessel carries (mL/s). Optional: defaults to RESTING_FLOW (1.0 mL/s). Set by
   * patient/coronaryFlow.ts when a case is built from the rendered tree, so branches of different
   * size autoregulate to their own flow.
   */
  restFlow?: number;
  /**
   * Venous (right atrial) pressure, mmHg: the zero-flow pressure of the coronary circulation.
   * Optional: defaults to PV (5 mmHg). A high value lowers the hyperaemic driving pressure, so Pd/Pa
   * under-reads the lesion; the corrected FFR is (Pd − Pv)/(Pa − Pv) (ffrVenousCorrected).
   */
  pv?: number;
  /**
   * The guide sits in a diseased ostium (an aorto-ostial or ostial left main lesion): while engaged
   * and guideObstructs is set, its obstruction is MP_OSTIAL_GUIDE (fitted) instead of the deep-seat
   * GUIDE_WEDGE.
   */
  ostialGuide?: boolean;
  /** the guide has side holes: blood enters the guide and bypasses part of its obstruction (MP_SIDE_HOLE_SCALE) */
  guideSideHoles?: boolean;
  /** set on a branch view: this case is the path from the ostium through the left main into one branch */
  branched?: BranchRef;
  /** what the learner should decide */
  decision: CaseDecision;
  /** other decisions the module text also supports for this case (graded as acceptable, not as the preferred one) */
  alsoAccepted?: readonly CaseDecision[];
  /** a post-PCI case (physiology-post-pci-handover): the segment the stent covers. Display and grading only; the physics uses the lesions. */
  stent?: StentSegment;
  teaching: string;
}

/**
 * The decision a case asks for. "imaging": physiology cannot settle this lesion (downstream disease
 * masking the left main, or high filling pressures), so assess it with intravascular imaging.
 */
export type CaseDecision = "treat" | "defer" | "treat-first-then-remeasure" | "microvascular" | "imaging" | PostPciDecision;

/**
 * The decisions of a post-PCI study (physiology-post-pci-handover), Brilakis's post-PCI algorithm as
 * lesson pm-physiology-after-pci gives it (Brilakis Fig 12.1): a loss inside the stent, post-dilate or
 * add a stent; a focal step outside it, stent it; a diffuse fall outside it, no further treatment; a
 * final value above the cut-off, accept the result.
 */
export type PostPciDecision = "post-dilate" | "treat-edge" | "accept-diffuse" | "accept-result";
export const POST_PCI_DECISIONS: readonly PostPciDecision[] = ["post-dilate", "treat-edge", "accept-diffuse", "accept-result"];

/** The stented segment of a post-PCI case, as positions along the vessel (0 ostium … 1 distal). */
export interface StentSegment {
  from: number;
  to: number;
}

/** The vessel geometry a pressure loss is computed over (a CoronaryCase or a left main segment). */
export type Segment = Pick<CoronaryCase, "refDiamMm" | "lengthMm" | "lesions" | "diffuse">;

const PV = 5; // venous / zero-flow pressure, mmHg
const RESTING_FLOW = 1.0; // mL/s
const MMHG = 133.322;
const MU = 0.0035; // Pa·s
const RHO = 1050; // kg/m³
const KEXP = 1.4; // exit loss coefficient
/**
 * Calibration of idealised circular geometry to clinical lesions (eccentric,
 * tapering, with an entrance region): viscous and separation losses scaled
 * separately so that typical lesions reproduce the familiar relationship
 * between FFR, resting Pd/Pa and the wave-free ratio.
 */
const GEOM_A = 1.25;
const GEOM_B = 0.22;

export interface LesionCoeffs {
  A: number; // mmHg·s/mL
  B: number; // mmHg·s²/mL²
}

export function lesionCoeffs(l: Lesion, refDiamMm: number): LesionCoeffs {
  const rN = refDiamMm / 2000; // m
  const rS = (refDiamMm * (1 - l.ds)) / 2000;
  const An = Math.PI * rN * rN;
  const As = Math.PI * rS * rS;
  const L = l.lengthMm / 1000;
  const aPa = (8 * Math.PI * MU * L) / (As * As); // Pa·s/m³
  const bPa = 0.5 * RHO * KEXP * Math.pow(1 / As - 1 / An, 2); // Pa·s²/m⁶
  return { A: (GEOM_A * aPa * 1e-6) / MMHG, B: (GEOM_B * bPa * 1e-12) / MMHG };
}

/** Viscous loss of the whole vessel (normal epicardial resistance plus diffuse disease), per mL/s. */
function vesselA(c: Segment, toPos = 1): number {
  const base = 0.02 * (c.lengthMm / 100) * (3 / c.refDiamMm) ** 4;
  return (base + c.diffuse * c.lengthMm * 0.05) * toPos;
}

function totalCoeffs(c: Segment, upTo = 1, extra?: LesionCoeffs): LesionCoeffs {
  let A = vesselA(c, upTo);
  let B = 0;
  for (const l of c.lesions) {
    if (l.pos < upTo) {
      const k = lesionCoeffs(l, c.refDiamMm);
      A += k.A;
      B += k.B;
    }
  }
  if (extra) {
    A += extra.A;
    B += extra.B;
  }
  return { A, B };
}

/** Solve drive = Q·R + A·Q + B·Q² for Q ≥ 0. */
function solveQ(drive: number, R: number, k: LesionCoeffs): number {
  return solveQAB(drive, R, k.A, k.B);
}

/** solveQ with the coefficients passed separately (no object on the render path). */
function solveQAB(drive: number, R: number, A: number, B: number): number {
  if (drive <= 0) return 0;
  const a = B,
    b = R + A;
  if (a < 1e-9) return drive / b;
  return (-b + Math.sqrt(b * b + 4 * a * drive)) / (2 * a);
}

/** Guide catheter wedged in the ostium behaves like an extra ostial obstruction. */
const GUIDE_WEDGE: LesionCoeffs = { A: 12, B: 7 };

/**
 * A guide seated in a diseased ostium (aorto-ostial RCA, ostial left main): the extra obstruction it
 * adds in series with the lesion, mmHg·s/mL and mmHg·s²/mL². MODEL PARAMETER, a fit: chosen so that
 * over the intermediate reference lesions of physiology.leftMain.test.ts (OSTIAL_REFERENCE_LESIONS) the
 * mean falsely high FFR with the guide engaged is about 0.04, as in the study Brilakis cites (module
 * cp-ostial, lesson cp-ostial-assess: Patel and colleagues, 25 patients, IV adenosine, FFR 0.87
 * engaged against 0.83 disengaged with a guide without side holes). Mostly separation loss (B), so
 * the guide pressure dips in diastole when the flow peaks (a damped trace).
 *
 * The fit is per vessel. In a left main the guide carries the flow of both branches, so the network
 * takes the coefficients per branch (A/n, B/n², see netOf). Even so, the falsely high FFR of the
 * 'ostial-lm-damped' preset is about 0.06, against about 0.045 for 'ostial-rca-engaged': a model
 * extrapolation beyond the cited study, which gives only the mean (0.04), not a left main figure.
 * With the guide seated the resting flow is not re-autoregulated (see resistances()), so the resting
 * indices also read high, as the module text says.
 */
export const MP_OSTIAL_GUIDE: LesionCoeffs = { A: 2, B: 14 };

/**
 * Side holes let aortic blood into the guide past its seated tip: the guide's obstruction is scaled by
 * this factor. MODEL PARAMETER, a fit: the mean falsely high FFR of the reference lesions is then about
 * 0.02 (same study: 0.85 engaged against 0.83 disengaged with a side-hole guide).
 */
export const MP_SIDE_HOLE_SCALE = 0.25;

/** The obstruction an engaged guide adds when the case says it obstructs the ostium. */
export function guideCoeffs(c: Pick<CoronaryCase, "ostialGuide" | "guideSideHoles">): LesionCoeffs {
  const base = c.ostialGuide ? MP_OSTIAL_GUIDE : GUIDE_WEDGE;
  if (!c.guideSideHoles) return base;
  return { A: base.A * MP_SIDE_HOLE_SCALE, B: base.B * MP_SIDE_HOLE_SCALE };
}

const pvOf = (c: Pick<CoronaryCase, "pv">) => c.pv ?? PV;

// ---------------------------------------------------------------------------
// Phasic flow
// ---------------------------------------------------------------------------
export const HR = 70;
const T = 60 / HR;
/** Wave-free period window (fraction of the cycle): mid-to-late diastole. */
export const WFP: [number, number] = [0.56, 0.95];
const NPH = 120;

/** Aortic pressure shape around the given mean. */
export function aorticPressure(map: number, phase: number): number {
  const q = ((phase % 1) + 1) % 1;
  const pulse = 45;
  let s: number;
  if (q < 0.12) s = q / 0.12;
  else if (q < 0.34) s = 1 - (q - 0.12) * 1.1;
  else if (q < 0.38) s = 0.758 - (q - 0.34) * 4;
  else if (q < 0.42) s = 0.598 + (q - 0.38) * 1.5;
  else s = 0.658 * Math.exp(-(q - 0.42) * 1.55);
  return map + pulse * (s - 0.47);
}

/**
 * Intramyocardial compression: microvascular resistance is high in systole
 * (vessels squeezed by contracting myocardium) and lowest in diastole, which
 * is why left coronary flow is mostly diastolic.
 */
export function compression(phase: number): number {
  const q = ((phase % 1) + 1) % 1;
  if (q < 0.06) return 1 + (q / 0.06) * 1.6;
  if (q < 0.38) return 2.6;
  if (q < 0.46) return 2.6 - ((q - 0.38) / 0.08) * 1.85;
  return 0.75;
}

function meanFlow(c: CoronaryCase, Rbase: number, k: LesionCoeffs): number {
  const pv = pvOf(c);
  let s = 0;
  for (let i = 0; i < NPH; i++) {
    const ph = i / NPH;
    s += solveQ(aorticPressure(c.map, ph) - pv, Rbase * compression(ph), k);
  }
  return s / NPH;
}

/** Find the baseline resistance at which `meanAt` gives the target mean flow (monotonic → bisection). */
function bisectR(meanAt: (R: number) => number, target: number): number {
  let lo = 0.5,
    hi = 2000;
  for (let i = 0; i < 50; i++) {
    const mid = Math.sqrt(lo * hi);
    if (meanAt(mid) > target) lo = mid;
    else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

/** Find the baseline resistance that gives a target mean flow (monotonic → bisection). */
function resistanceFor(c: CoronaryCase, target: number, k: LesionCoeffs): number {
  return bisectR((R) => meanFlow(c, R, k), target);
}

const NORMAL: LesionCoeffs = { A: 0, B: 0 };
const rCache = new Map<string, { rHyp: number; rRest: number }>();

function caseKey(c: CoronaryCase, guide: boolean) {
  return JSON.stringify([c.map, c.cfrPotential, c.refDiamMm, c.lengthMm, c.diffuse, c.lesions, guide && c.guideObstructs ? guideCoeffs(c) : false, c.restFlow ?? RESTING_FLOW, pvOf(c)]);
}

/** The guide's obstruction while engaged, or undefined when it does not obstruct this ostium. */
const wedgeOf = (c: CoronaryCase, guideEngaged: boolean) => (guideEngaged && c.guideObstructs ? guideCoeffs(c) : undefined);

/**
 * Microvascular resistances for this vessel: the hyperaemic minimum is set by
 * the microcirculation (a normal epicardial vessel would reach cfrPotential ×
 * resting flow); at rest the microcirculation autoregulates to keep resting
 * flow, until its reserve is used up. For a branch view, the resistances of
 * its branch, solved with the other branches of the left main.
 */
export function resistances(c: CoronaryCase, guideEngaged = false): { rHyp: number; rRest: number } {
  if (c.branched) {
    const net = netOf(c, guideEngaged);
    const r = netResistances(net);
    return { rHyp: r.rHyp[net.sel], rRest: r.rRest[net.sel] };
  }
  const key = caseKey(c, guideEngaged);
  const hit = rCache.get(key);
  if (hit) return hit;
  const rest = c.restFlow ?? RESTING_FLOW;
  const rHyp = resistanceFor(c, rest * c.cfrPotential, NORMAL);
  // the resting microcirculation is set by the disease, not by a guide seated in an ostial lesion:
  // flow falls while the guide obstructs, so the resting indices read falsely high as well
  // (Brilakis 12.3, lesson cp-ostial-assess). A deep-seated guide (GUIDE_WEDGE) keeps its behaviour.
  const k = totalCoeffs(c, 1, c.ostialGuide ? undefined : wedgeOf(c, guideEngaged));
  const rRest = Math.max(rHyp, resistanceFor(c, rest, k));
  const out = { rHyp, rRest };
  rCache.set(key, out);
  return out;
}

export interface FlowState {
  /** baseline microvascular resistance (mmHg·s/mL, before systolic compression) */
  rMicro: number;
  /** mean coronary flow (mL/s) */
  q: number;
}

/** Mean flow for hyperaemia fraction h (0 rest … 1 maximal). For a branch view: the flow of its branch. */
export function flow(c: CoronaryCase, h: number, guideEngaged = false): FlowState {
  if (c.branched) {
    const net = netOf(c, guideEngaged);
    const Rs = netR(net, h);
    const rMicro = Rs[net.sel];
    return { rMicro, q: netMeanFlows(net, Rs)[net.sel] };
  }
  const { rHyp, rRest } = resistances(c, guideEngaged);
  const R = rRest - h * (rRest - rHyp);
  const k = totalCoeffs(c, 1, wedgeOf(c, guideEngaged));
  return { rMicro: R, q: meanFlow(c, R, k) };
}

/** Pressure loss from the ostium to sensor position `x` at flow q (an unbranched vessel). */
export function lossTo(c: CoronaryCase, x: number, q: number): number {
  const k = totalCoeffs(c, x);
  return k.A * q + k.B * q * q;
}

export interface WireReading {
  pa: number;
  pd: number;
  q: number;
}

/**
 * Instantaneous Pa (guide tip) and Pd (sensor) at time t.
 * `offset` is sensor drift/equalisation error (mmHg).
 * For a branch view, `x` runs along the path ostium → left main → branch and q is the branch's flow.
 */
export function reading(c: CoronaryCase, t: number, x: number, h: number, guideEngaged: boolean, offset: number): WireReading {
  const ph = (((t / T) % 1) + 1) % 1;
  if (c.branched) return readingNet(netOf(c, guideEngaged), ph, x, h, offset);
  const { rHyp, rRest } = resistances(c, guideEngaged);
  const R = (rRest - h * (rRest - rHyp)) * compression(ph);
  const wedge = wedgeOf(c, guideEngaged);
  const k = totalCoeffs(c, 1, wedge);
  const aortic = aorticPressure(c.map, ph);
  const qi = solveQ(aortic - pvOf(c), R, k);
  const pa = wedge ? aortic - wedge.A * qi - wedge.B * qi * qi : aortic;
  const pd = pa - lossTo(c, x, qi) + offset;
  return { pa, pd, q: qi };
}

// ---------------------------------------------------------------------------
// Branched left main (physiology-left-main-and-ostial)
// ---------------------------------------------------------------------------

/** One branch of a branched case: its own vessel from the bifurcation (lesion positions 0..1 along it). */
export interface CaseBranch {
  id: string;
  /** the branch's name on the screen (generic: LAD, LCx) */
  label: string;
  case: CoronaryCase;
}

/**
 * A left main feeding its branches in parallel. The branches' own map, pv and guide fields are not
 * used: the branched case's apply. Lesion ids are unique across the left main and the branches.
 */
export interface BranchedCase {
  id: string;
  title: string;
  vessel: string;
  brief: string;
  /** mean aortic pressure, mmHg */
  map: number;
  pv?: number;
  /** the left main (lesion positions 0 = ostium … 1 = bifurcation) */
  lm: Segment;
  branches: CaseBranch[];
  /** the branch a study starts in (default the first) */
  defaultBranch?: string;
  guideObstructs?: boolean;
  ostialGuide?: boolean;
  guideSideHoles?: boolean;
  decision: CaseDecision;
  alsoAccepted?: readonly CaseDecision[];
  teaching: string;
}

/** Set on a branch view: the branched case and the branch the path runs into. */
export interface BranchRef {
  model: BranchedCase;
  branch: string;
}

/** Iteration cap of the junction solver. */
export const JUNCTION_MAX_ITER = 60;
/** Convergence tolerance of the junction solver: the pressure balance, mmHg. */
export const JUNCTION_TOL_MMHG = 1e-9;

export interface JunctionSolution {
  /** junction pressure above venous, mmHg (Pj − Pv) */
  u: number;
  /** flow of each branch, mL/s */
  q: number[];
  qTotal: number;
  iterations: number;
  converged: boolean;
}

/** The working state of one junction solve; the branch flows are written into q (no allocation per solve). */
interface JunctionScratch {
  q: Float64Array;
  u: number;
  qTotal: number;
  iterations: number;
  converged: boolean;
}

const newScratch = (n: number): JunctionScratch => ({ q: new Float64Array(n), u: 0, qTotal: 0, iterations: 0, converged: true });

/** Every branch's flow at junction pressure u (above venous), written into q; returns the total. */
function fillFlows(u: number, R: ArrayLike<number>, ks: readonly LesionCoeffs[], q: Float64Array): number {
  let t = 0;
  for (let i = 0; i < q.length; i++) {
    q[i] = solveQ(u, R[i], ks[i]);
    t += q[i];
  }
  return t;
}

/**
 * Solve one instant of the branched network: drive = Pa − Pv; `up` is everything upstream of the
 * bifurcation (an engaged guide's obstruction and the left main); branch i has microvascular
 * resistance R[i] and epicardial coefficients ks[i]. Finds u = Pj − Pv with
 *     drive − u = up.A·Qt + up.B·Qt²,   Qt = Σ Q_i(u),   u = R_i·Q_i + A_i·Q_i + B_i·Q_i²
 * by Newton's method on u, safeguarded by a bisection bracket (the balance is monotonic in u, so a
 * step that leaves the bracket is replaced by its midpoint), with an iteration cap. One branch is a
 * series chain and is solved in closed form, exactly as the unbranched vessel is.
 */
export function solveJunction(drive: number, up: LesionCoeffs, R: readonly number[], ks: readonly LesionCoeffs[], guess?: number): JunctionSolution {
  const s = newScratch(R.length);
  junctionInto(drive, up, R, ks, s, guess);
  return { u: s.u, q: Array.from(s.q), qTotal: s.qTotal, iterations: s.iterations, converged: s.converged };
}

/** solveJunction into the caller's scratch (the render path: reading() of a branch view). */
function junctionInto(drive: number, up: LesionCoeffs, R: ArrayLike<number>, ks: readonly LesionCoeffs[], s: JunctionScratch, guess?: number): void {
  const n = s.q.length;
  s.iterations = 0;
  s.converged = true;
  if (n === 1) {
    const q = solveQAB(drive, R[0], up.A + ks[0].A, up.B + ks[0].B);
    s.q[0] = q;
    s.u = drive - (up.A * q + up.B * q * q);
    s.qTotal = q;
    return;
  }
  if (drive <= 0) {
    s.q.fill(0);
    s.u = drive;
    s.qTotal = 0;
    return;
  }
  if (up.A === 0 && up.B === 0) {
    s.qTotal = fillFlows(drive, R, ks, s.q);
    s.u = drive;
    return;
  }
  let lo = 0,
    hi = drive;
  let u = guess !== undefined && guess > 0 && guess < drive ? guess : 0.9 * drive;
  for (let it = 1; it <= JUNCTION_MAX_ITER; it++) {
    const qt = fillFlows(u, R, ks, s.q);
    const g = drive - u - (up.A * qt + up.B * qt * qt);
    if (Math.abs(g) <= JUNCTION_TOL_MMHG || hi - lo <= JUNCTION_TOL_MMHG * 1e-3) {
      s.u = u;
      s.qTotal = qt;
      s.iterations = it;
      return;
    }
    if (g > 0) lo = u;
    else hi = u;
    let dq = 0;
    for (let i = 0; i < n; i++) dq += 1 / (R[i] + ks[i].A + 2 * ks[i].B * s.q[i]);
    const dg = -1 - (up.A + 2 * up.B * qt) * dq;
    let next = u - g / dg;
    if (!(next > lo && next < hi)) next = 0.5 * (lo + hi);
    u = next;
  }
  const qt = fillFlows(u, R, ks, s.q);
  const g = drive - u - (up.A * qt + up.B * qt * qt);
  s.u = u;
  s.qTotal = qt;
  s.iterations = JUNCTION_MAX_ITER;
  s.converged = Math.abs(g) <= 1e-6;
}

/** The solver's view of a branch view: effective lesions, coefficients and the selected branch. */
interface Net {
  key: string;
  map: number;
  pv: number;
  lm: Segment;
  lmLen: number;
  /** each branch as a case at the network's MAP and venous pressure */
  branches: CoronaryCase[];
  sel: number;
  /** the engaged guide's obstruction, or null */
  guide: LesionCoeffs | null;
  lmFull: LesionCoeffs;
  /** upstream of the bifurcation: guide and left main */
  up: LesionCoeffs;
  /** upstream for the resting autoregulation: without a guide seated in an ostial lesion (see resistances()) */
  restUp: LesionCoeffs;
  ks: LesionCoeffs[];
  /** scratch for the render path: baseline resistances at hLast, compressed resistances, the junction solve */
  hLast: number;
  rBase: Float64Array;
  rScaled: Float64Array;
  sol: JunctionScratch;
  /** scratch for the cycle means (netMeanFlows) */
  rMean: Float64Array;
  mean: JunctionScratch;
}

const NET_CACHE = new WeakMap<CoronaryCase, { on?: Net; off?: Net }>();

function netOf(c: CoronaryCase, guideEngaged: boolean): Net {
  const slot = NET_CACHE.get(c) ?? {};
  const hit = guideEngaged ? slot.on : slot.off;
  if (hit) return hit;
  const ref = c.branched!;
  const m = ref.model;
  const sel = m.branches.findIndex((b) => b.id === ref.branch);
  if (sel < 0) throw new Error(`physiology: branched case ${m.id} has no branch ${ref.branch}`);
  // the view's lesions are authoritative for its own path (a session drops the treated ones)
  const present = new Set(c.lesions.map((l) => l.id));
  const pv = pvOf(c);
  const lm: Segment = { ...m.lm, lesions: m.lm.lesions.filter((l) => present.has(l.id)) };
  const branches = m.branches.map((b, i): CoronaryCase => ({ ...b.case, map: c.map, pv, branched: undefined, guideObstructs: false, lesions: i === sel ? b.case.lesions.filter((l) => present.has(l.id)) : b.case.lesions }));
  const n = branches.length;
  const seated = guideEngaged && c.guideObstructs ? guideCoeffs(c) : null;
  // MP_OSTIAL_GUIDE was fitted on single vessels. In a left main the guide carries the flow of every
  // branch, so its coefficients are taken per branch (A/n, B/n²): the loss is the fitted loss at the
  // mean flow of one branch, and the falsely high FFR stays near the cited 0.04 instead of growing
  // with the square of the total flow. One branch (an unbranched vessel) is unchanged.
  const guide = seated && c.ostialGuide && n > 1 ? { A: seated.A / n, B: seated.B / (n * n) } : seated;
  const lmFull = totalCoeffs(lm, 1);
  const up = guide ? { A: guide.A + lmFull.A, B: guide.B + lmFull.B } : lmFull;
  const restUp = guide && c.ostialGuide ? lmFull : up;
  const ks = branches.map((b) => totalCoeffs(b, 1));
  const key = JSON.stringify([c.map, pv, lm.refDiamMm, lm.lengthMm, lm.diffuse, lm.lesions, branches.map((b) => [b.refDiamMm, b.lengthMm, b.diffuse, b.lesions, b.cfrPotential, b.restFlow ?? RESTING_FLOW]), guide, restUp === up]);
  const net: Net = {
    key,
    map: c.map,
    pv,
    lm,
    lmLen: m.lm.lengthMm,
    branches,
    sel,
    guide,
    lmFull,
    up,
    restUp,
    ks,
    hLast: NaN,
    rBase: new Float64Array(n),
    rScaled: new Float64Array(n),
    sol: newScratch(n),
    rMean: new Float64Array(n),
    mean: newScratch(n),
  };
  NET_CACHE.set(c, guideEngaged ? { ...slot, on: net } : { ...slot, off: net });
  return net;
}

/** Mean flow of every branch over a cycle at baseline resistances Rs (before systolic compression), with upstream `up`. */
function netMeanFlows(net: Net, Rs: ArrayLike<number>, up: LesionCoeffs = net.up): number[] {
  const n = net.branches.length;
  const sums = new Array<number>(n).fill(0);
  const rs = net.rMean;
  const s = net.mean;
  let guess: number | undefined;
  for (let i = 0; i < NPH; i++) {
    const ph = i / NPH;
    const cmp = compression(ph);
    for (let j = 0; j < n; j++) rs[j] = Rs[j] * cmp;
    junctionInto(aorticPressure(net.map, ph) - net.pv, up, rs, net.ks, s, guess);
    guess = s.u;
    for (let j = 0; j < n; j++) sums[j] += s.q[j];
  }
  return sums.map((v) => v / NPH);
}

/** Gauss-Seidel sweeps of the resting autoregulation: cap and tolerance (relative change). */
const NET_SWEEPS = 12;
const NET_SWEEP_TOL = 1e-9;
const netCache = new Map<string, { rHyp: number[]; rRest: number[] }>();

/**
 * The branches' microvascular resistances. Hyperaemic: each branch's own, set as for an unbranched
 * vessel (a normal epicardial tree carries cfrPotential × resting flow, and with no epicardial loss
 * the branches do not interact). Resting: each branch autoregulates to hold its resting flow with
 * the disease and the other branches as they are, solved jointly by Gauss-Seidel sweeps of the
 * one-branch bisection (one branch reduces to resistances() exactly). A guide seated in an ostial
 * lesion is left out of the resting solve, as in resistances().
 */
function netResistances(net: Net): { rHyp: number[]; rRest: number[] } {
  const hit = netCache.get(net.key);
  if (hit) return hit;
  const rHyp = net.branches.map((b) => resistanceFor(b, (b.restFlow ?? RESTING_FLOW) * b.cfrPotential, NORMAL));
  const R = rHyp.slice();
  for (let sweep = 0; sweep < NET_SWEEPS; sweep++) {
    let change = 0;
    for (let i = 0; i < R.length; i++) {
      const target = net.branches[i].restFlow ?? RESTING_FLOW;
      const r = Math.max(
        rHyp[i],
        bisectR((ri) => {
          const trial = R.slice();
          trial[i] = ri;
          return netMeanFlows(net, trial, net.restUp)[i];
        }, target)
      );
      change = Math.max(change, Math.abs(r - R[i]) / R[i]);
      R[i] = r;
    }
    if (change < NET_SWEEP_TOL) break;
  }
  const out = { rHyp, rRest: R };
  if (netCache.size > 200) netCache.clear();
  netCache.set(net.key, out);
  return out;
}

/** Baseline resistances of every branch at hyperaemia fraction h (the net's scratch buffer, reused while h is unchanged). */
function netR(net: Net, h: number): Float64Array {
  if (h !== net.hLast) {
    const { rHyp, rRest } = netResistances(net);
    for (let i = 0; i < rRest.length; i++) net.rBase[i] = rRest[i] - h * (rRest[i] - rHyp[i]);
    net.hLast = h;
  }
  return net.rBase;
}

/** Pressure loss from the ostium to path position x (0..1 over left main + branch). */
function netLossTo(net: Net, x: number, qt: number, qi: number): number {
  const b = net.branches[net.sel];
  const pathLen = net.lmLen + b.lengthMm;
  const xmm = x * pathLen;
  if (net.lmLen > 0 && xmm <= net.lmLen) {
    const k = totalCoeffs(net.lm, xmm / net.lmLen);
    return k.A * qt + k.B * qt * qt;
  }
  const lmLoss = net.lmFull.A * qt + net.lmFull.B * qt * qt;
  const xb = net.lmLen === 0 ? x : (xmm - net.lmLen) / b.lengthMm;
  const kb = totalCoeffs(b, xb);
  return lmLoss + (kb.A * qi + kb.B * qi * qi);
}

function readingNet(net: Net, ph: number, x: number, h: number, offset: number): WireReading {
  const cmp = compression(ph);
  const base = netR(net, h);
  const rs = net.rScaled;
  for (let i = 0; i < rs.length; i++) rs[i] = base[i] * cmp;
  const aortic = aorticPressure(net.map, ph);
  const s = net.sol;
  junctionInto(aortic - net.pv, net.up, rs, net.ks, s);
  const qt = s.qTotal;
  const qi = s.q[net.sel];
  const g = net.guide;
  const pa = g ? aortic - g.A * qt - g.B * qt * qt : aortic;
  const pd = pa - netLossTo(net, x, qt, qi) + offset;
  return { pa, pd, q: qi };
}

/**
 * Solve the resistances of a case now (a branched case's network solve takes some milliseconds), so
 * that the first trace sample after loading a preset, switching branch or stenting does not. Optional.
 */
export function warmPhysiology(c: CoronaryCase): void {
  resistances(c, false);
  if (c.guideObstructs) resistances(c, true);
}

/** A branched case with these lesions removed (treated), wherever they are. */
export function withoutLesions(bc: BranchedCase, ids: readonly string[]): BranchedCase {
  if (!ids.length) return bc;
  const keep = (l: Lesion) => !ids.includes(l.id);
  return {
    ...bc,
    lm: { ...bc.lm, lesions: bc.lm.lesions.filter(keep) },
    branches: bc.branches.map((b) => ({ ...b, case: { ...b.case, lesions: b.case.lesions.filter(keep) } })),
  };
}

/**
 * The path ostium → left main → branch as a CoronaryCase (a branch view): lesion positions are along
 * the whole path, the length is the left main's plus the branch's, and reading/indices/flow/pullback
 * solve the whole network for it. `treated` removes lesions anywhere in the tree.
 */
export function branchView(bc: BranchedCase, branchId: string = bc.defaultBranch ?? bc.branches[0].id, treated: readonly string[] = []): CoronaryCase {
  const model = withoutLesions(bc, treated);
  const b = model.branches.find((x) => x.id === branchId);
  if (!b) throw new Error(`physiology: branched case ${bc.id} has no branch ${branchId}`);
  const lmLen = model.lm.lengthMm;
  const L = lmLen + b.case.lengthMm;
  const lesions: Lesion[] = [
    ...model.lm.lesions.map((l) => ({ ...l, pos: (l.pos * lmLen) / L })),
    ...b.case.lesions.map((l) => ({ ...l, pos: lmLen === 0 ? l.pos : (lmLen + l.pos * b.case.lengthMm) / L })),
  ];
  return {
    id: `${bc.id}:${b.id}`,
    title: bc.title,
    vessel: bc.vessel,
    brief: bc.brief,
    refDiamMm: b.case.refDiamMm,
    lengthMm: L,
    lesions,
    diffuse: b.case.diffuse,
    cfrPotential: b.case.cfrPotential,
    map: bc.map,
    ...(bc.pv !== undefined ? { pv: bc.pv } : {}),
    ...(b.case.restFlow !== undefined ? { restFlow: b.case.restFlow } : {}),
    ...(bc.guideObstructs ? { guideObstructs: true } : {}),
    ...(bc.ostialGuide ? { ostialGuide: true } : {}),
    ...(bc.guideSideHoles ? { guideSideHoles: true } : {}),
    branched: { model, branch: b.id },
    decision: bc.decision,
    ...(bc.alsoAccepted ? { alsoAccepted: bc.alsoAccepted } : {}),
    teaching: bc.teaching,
  };
}

/** An unbranched vessel as a branched case with a left main of zero length (gives identical results). */
export function toBranched(c: CoronaryCase): BranchedCase {
  return {
    id: c.id,
    title: c.title,
    vessel: c.vessel,
    brief: c.brief,
    map: c.map,
    ...(c.pv !== undefined ? { pv: c.pv } : {}),
    lm: { refDiamMm: c.refDiamMm, lengthMm: 0, lesions: [], diffuse: 0 },
    branches: [{ id: c.vessel, label: c.vessel, case: c }],
    ...(c.guideObstructs ? { guideObstructs: true } : {}),
    ...(c.ostialGuide ? { ostialGuide: true } : {}),
    ...(c.guideSideHoles ? { guideSideHoles: true } : {}),
    decision: c.decision,
    ...(c.alsoAccepted ? { alsoAccepted: c.alsoAccepted } : {}),
    teaching: c.teaching,
  };
}

/** Where the bifurcation lies along a branch view's path (0..1), or null for an unbranched vessel. */
export function bifurcationPos(c: CoronaryCase): number | null {
  if (!c.branched) return null;
  return c.branched.model.lm.lengthMm / Math.max(1e-9, c.lengthMm);
}

/** The same case with or without a side-hole guide (a branch view keeps its branch). */
export function withSideHoles(c: CoronaryCase, on: boolean): CoronaryCase {
  if (!c.branched) return { ...c, guideSideHoles: on };
  const model = { ...c.branched.model, guideSideHoles: on };
  return { ...c, guideSideHoles: on, branched: { model, branch: c.branched.branch } };
}

export interface Indices {
  pdpa: number;
  wfpRatio: number;
  q: number;
}

/** Whole-cycle Pd/Pa and the wave-free-period ratio at hyperaemia fraction h. */
export function indices(c: CoronaryCase, x: number, h: number, guideEngaged = false, offset = 0): Indices {
  const N = 200;
  let sa = 0,
    sd = 0,
    wa = 0,
    wd = 0,
    sq = 0;
  for (let i = 0; i < N; i++) {
    const ph = i / N;
    const r = reading(c, ph * T, x, h, guideEngaged, offset);
    sa += r.pa;
    sd += r.pd;
    sq += r.q;
    if (ph >= WFP[0] && ph <= WFP[1]) {
      wa += r.pa;
      wd += r.pd;
    }
  }
  return { pdpa: sd / sa, wfpRatio: wd / wa, q: sq / N };
}

export function ffr(c: CoronaryCase, x = 1, guideEngaged = false, offset = 0): number {
  return indices(c, x, 1, guideEngaged, offset).pdpa;
}

export function restingIndices(c: CoronaryCase, x = 1, offset = 0) {
  const r = indices(c, x, 0, false, offset);
  return { pdpa: r.pdpa, nhpr: r.wfpRatio };
}

/** Pullback curve: hyperaemic Pd/Pa (h > 0.5) or resting wave-free ratio, distal → ostium. */
export function pullback(c: CoronaryCase, h: number, steps = 60): { x: number; ratio: number }[] {
  const out: { x: number; ratio: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = 1 - i / steps;
    const ix = indices(c, x, h);
    out.push({ x, ratio: h > 0.5 ? ix.pdpa : ix.wfpRatio });
  }
  return out;
}

/** Pd/Pa and the wave-free ratio in one branch of a branched case, at path position x (0 ostium … 1 distal branch). */
export function indicesBranched(bc: BranchedCase, branchId: string, x: number, h: number, guideEngaged = false, offset = 0): Indices {
  return indices(branchView(bc, branchId), x, h, guideEngaged, offset);
}

/** Pullback from the distal branch through the left main to the ostium (hyperaemic Pd/Pa or resting wave-free ratio). */
export function pullbackBranched(bc: BranchedCase, branchId: string, h: number, steps = 60): { x: number; ratio: number }[] {
  return pullback(branchView(bc, branchId), h, steps);
}

/**
 * FFR corrected for venous pressure, (Pd − Pv)/(Pa − Pv), from the cycle means at maximal hyperaemia
 * (lesson cp-left-main-assess: Brilakis gives the correction and advises avoiding functional assessment
 * with a high right atrial pressure and LVEDP).
 */
export function ffrVenousCorrected(c: CoronaryCase, x = 1, guideEngaged = false, offset = 0): number {
  const N = 200;
  let sa = 0,
    sd = 0;
  for (let i = 0; i < N; i++) {
    const r = reading(c, (i / N) * T, x, 1, guideEngaged, offset);
    sa += r.pa;
    sd += r.pd;
  }
  const pv = pvOf(c);
  return (sd / N - pv) / (sa / N - pv);
}

// ---------------------------------------------------------------------------
// Thermodilution (CFR, IMR)
// ---------------------------------------------------------------------------
/** Distribution volume giving a resting mean transit time ≈ 0.8 s at resting flow. */
const TD_VOLUME = 0.8;

/**
 * Injection-level thermodilution (physiology-anoca-cft). Without options the result is the exact
 * means, as it always was (the pressure-wire session and every other caller). With `injections` each
 * state gets that many transit times, each drawn around the true mean with the scatter of the
 * technique (tdTransitTime), and Tmn, CFR and IMR come from the mean of the last three of each.
 */
export interface ThermoOptions {
  /** injections per state (the learner's count); 0 or absent: the exact means */
  injections?: number;
  /** the same volume and force each time (default true): see tdScatterCv */
  consistent?: boolean;
  /** seed of the draws (default the case id) */
  seed?: string | number;
}

export interface Thermodilution {
  tmnRest: number;
  tmnHyp: number;
  cfr: number;
  imr: number;
  imrCorr: number;
  ffr: number;
  /** the transit times of each injection, s (only with ThermoOptions.injections) */
  injections?: { rest: number[]; hyp: number[] };
}

export function thermodilution(c: CoronaryCase, opts?: ThermoOptions): Thermodilution {
  const rest = indices(c, 1, 0);
  const hyp = indices(c, 1, 1);
  const ix = indices(c, 1, 1);
  const pa = c.map;
  const pd = pa * ix.pdpa;
  let tmnRest = TD_VOLUME / rest.q;
  let tmnHyp = TD_VOLUME / hyp.q;
  let injections: Thermodilution["injections"];
  if (opts?.injections && opts.injections > 0) {
    const r = rngFrom(opts.seed ?? c.id);
    const consistent = opts.consistent ?? true;
    const draw = (tmn: number) => Array.from({ length: opts.injections! }, () => tdTransitTime(tmn, consistent, r));
    injections = { rest: draw(tmnRest), hyp: draw(tmnHyp) };
    tmnRest = tdSeriesMean(injections.rest);
    tmnHyp = tdSeriesMean(injections.hyp);
  }
  const imr = pd * tmnHyp;
  // Yong's correction for collateral flow when the epicardial stenosis is significant
  const imrCorr = pa * tmnHyp * Math.min(1, 1.35 * ix.pdpa - 0.32);
  const out: Thermodilution = { tmnRest, tmnHyp, cfr: tmnRest / tmnHyp, imr, imrCorr, ffr: ix.pdpa };
  if (injections) out.injections = injections;
  return out;
}

/** The exact mean transit time of the distal vessel at hyperaemia fraction h, s (the mean the injections scatter around). */
export function tdMeanTransit(c: CoronaryCase, h: number, guideEngaged = false): number {
  return TD_VOLUME / indices(c, 1, h, guideEngaged).q;
}

/**
 * Saline per injection, mL: 3-4 mL of room-temperature saline, briskly, from a 5 mL syringe (lesson
 * pm-physiology-microvascular, protocol step 5, UK consensus).
 */
export const TD_SALINE_ML = { min: 3, max: 4 } as const;
/** Three transit times agree when they lie within 10% of each other (lesson pm-physiology-microvascular, step 5). */
export const TD_AGREEMENT = 0.1;
/** Injections whose mean is the value (the same step: "until three transit times lie within 10%"). */
export const TD_SERIES_N = 3;
/** Coefficient of variation of one transit time with the same volume and force each time — MODEL PARAMETER. */
export const MP_TD_CV = 0.03;
/** ... with a varying volume or a slow push (the module's "scattered curves from inconsistent saline injections") — MODEL PARAMETER. */
export const MP_TD_CV_INCONSISTENT = 0.15;
/** Two injections have "the same volume" within this, mL — MODEL PARAMETER. */
export const MP_TD_SAME_VOLUME_ML = 0.5;

/** The scatter of one injection's transit time for a technique (coefficient of variation). */
export function tdScatterCv(consistent: boolean): number {
  return consistent ? MP_TD_CV : MP_TD_CV_INCONSISTENT;
}

/** Whether an injection matches the protocol and the series' first injection: brisk, 3-4 mL, the same volume as the first. */
export function tdInjectionConsistent(inj: { volumeMl: number; brisk: boolean }, first?: { volumeMl: number } | null): boolean {
  if (!inj.brisk || inj.volumeMl < TD_SALINE_ML.min || inj.volumeMl > TD_SALINE_ML.max) return false;
  return !first || Math.abs(inj.volumeMl - first.volumeMl) <= MP_TD_SAME_VOLUME_ML;
}

/** The shortest a scattered transit time can be, as a share of the true mean — MODEL PARAMETER (keeps a far-tail draw positive). */
export const MP_TD_MIN_FACTOR = 0.3;

/** One injection's mean transit time, s: the true mean scattered by the technique (draws from `r`, advancing it). */
export function tdTransitTime(tmn: number, consistent: boolean, r: RngState): number {
  return tmn * Math.max(MP_TD_MIN_FACTOR, 1 + normal(r, 0, tdScatterCv(consistent)));
}

/** The last TD_SERIES_N transit times of a series (fewer when the series is shorter). */
export const tdLastThree = (times: readonly number[]): number[] => times.slice(-TD_SERIES_N);

/** Mean of the last three transit times, s (NaN for an empty series). */
export function tdSeriesMean(times: readonly number[]): number {
  const t = tdLastThree(times);
  return t.length ? t.reduce((a, b) => a + b, 0) / t.length : NaN;
}

/** Spread of the last three transit times: (max − min) / min (0 for fewer than two). */
export function tdSpread(times: readonly number[]): number {
  const t = tdLastThree(times);
  if (t.length < 2) return 0;
  return (Math.max(...t) - Math.min(...t)) / Math.min(...t);
}

/** Three transit times that lie within TD_AGREEMENT of each other. */
export function tdAgree(times: readonly number[]): boolean {
  return times.length >= TD_SERIES_N && tdSpread(times) <= TD_AGREEMENT + 1e-12;
}

// ---------------------------------------------------------------------------
// Thresholds (commonly used cut-offs)
// ---------------------------------------------------------------------------
export const CUTOFF = {
  ffr: 0.8,
  nhpr: 0.89, // iFR / RFR / dPR
  pdpa: 0.91,
  cfr: 2.0,
  imr: 25,
  drift: 0.02, // acceptable Pd/Pa deviation from 1.00 at the guide tip
  // coronary function test in ANOCA (physiology-anoca-cft): sources in CUTOFF_SOURCES
  cfrUk: 2.5, // CFR abnormal below this in the UK consensus (CorMicA: below cfr, 2.0)
  cftDrift: 0.03, // UK protocol: a drift of 0.03 or more at the ostium means re-equalise and repeat
};

/** Where the cut-offs of the coronary function test come from (lesson pm-physiology-microvascular). */
export const CUTOFF_SOURCES = {
  cfr: "pm-physiology-microvascular, table 'What is measured': CFR abnormal below 2.0 (CorMicA); COVADIS allows 2.0 or 2.5",
  cfrUk: "pm-physiology-microvascular, table 'What is measured' and 'The thresholds differ': below 2.5 (UK consensus)",
  imr: "pm-physiology-microvascular, table 'What is measured': IMR 25 or more (CorMicA)",
  ffr: "pm-physiology-microvascular, protocol step 3 and 6: FFR above 0.80 confirms no epicardial lesion",
  cftDrift: "pm-physiology-microvascular, protocol step 7: the UK protocol re-equalises and repeats when the drift is 0.03 or more",
} as const;

// ---------------------------------------------------------------------------
// Hyperaemia markers (physiology-anoca-cft)
//
// Lesson pm-physiology-microvascular, protocol step 6: before the hyperaemic
// injections, confirm that hyperaemia is real: the patient feels the systemic
// effects of the drug, the distal waveform ventricularises and loses its
// dicrotic notch, and the mean aortic and distal pressures separate. The
// systemic signs of IV adenosine are those of tip pci-phys-iv-hyperaemia-signs
// (Brilakis 12.2, Oxford ch 8): systolic pressure falls by about 10 mmHg and
// the heart rate rises by 5-10 beats/min. How the waveform changes with the
// hyperaemia fraction is a MODEL PARAMETER (no source gives a curve).
// ---------------------------------------------------------------------------

/** Systolic fall at full IV adenosine hyperaemia, mmHg (pci-phys-iv-hyperaemia-signs: about 10). */
export const IV_ADENOSINE_SYSTOLIC_FALL_MMHG = 10;
/** Heart-rate rise at full IV adenosine hyperaemia, beats/min (the same tip: 5-10; the midpoint). */
export const IV_ADENOSINE_HR_RISE_BPM = 7.5;
/**
 * Hyperaemia fraction at which the distal waveform begins to change — MODEL PARAMETER. Chosen with
 * MP_MARKER_ON so that ventricularisation and the lost notch appear at hyperaemia 0.9, the pressure-wire
 * session's submaximal threshold (pwSession.ts MP_SUBMAXIMAL_H): markers that read as confirmed mean
 * the hyperaemia is maximal for the study, so a learner who injects on the markers is not penalised.
 */
export const MP_WAVE_MARKER_H0 = 0.75;
/** Strength of the waveform change (0..1) at which ventricularisation and the lost notch count as present — MODEL PARAMETER (reached at hyperaemia 0.9). */
export const MP_MARKER_ON = 0.6;
/** Early-diastolic dip of a fully ventricularised distal trace below the aortic, mmHg — MODEL PARAMETER. */
export const MP_VENT_DIP_MMHG = 6;
/** Hyperaemia fraction at which the patient feels the systemic effects of IV adenosine — MODEL PARAMETER. */
export const MP_SYSTEMIC_H = 0.5;
/**
 * The mean pressures count as separated once Pa − Pd has risen by this share of its rise from rest to
 * maximal hyperaemia — MODEL PARAMETER (in a vessel without a stenosis the separation is small, a few
 * mmHg or less, so an absolute threshold would never be met in microvascular disease).
 */
export const MP_SEPARATION_SHARE = 0.6;

/** How far the distal waveform has changed at hyperaemia fraction h (0 none … 1 full). */
export function waveformChange(h: number): number {
  return Math.max(0, Math.min(1, (h - MP_WAVE_MARKER_H0) / (1 - MP_WAVE_MARKER_H0)));
}

/** Mean Pa − Pd at the distal sensor at hyperaemia fraction h, mmHg. */
export function pressureSeparation(c: CoronaryCase, h: number, guideEngaged = false): number {
  return c.map * (1 - indices(c, 1, h, guideEngaged).pdpa);
}

export interface HyperaemiaMarkers {
  /** the patient feels the systemic effects of the drug (IV adenosine only) */
  systemic: boolean;
  ventricularised: boolean;
  notchLost: boolean;
  /** mean Pa − Pd now, mmHg */
  separationMmHg: number;
  separated: boolean;
  /** all four: hyperaemia is confirmed */
  confirmed: boolean;
}

/** The markers of hyperaemia at fraction h; `systemicAgent` is true while IV adenosine is the agent. */
export function hyperaemiaMarkers(c: CoronaryCase, h: number, systemicAgent: boolean, guideEngaged = false): HyperaemiaMarkers {
  const w = waveformChange(h);
  const s0 = pressureSeparation(c, 0, guideEngaged);
  const s1 = pressureSeparation(c, 1, guideEngaged);
  const sep = pressureSeparation(c, h, guideEngaged);
  const systemic = systemicAgent && h >= MP_SYSTEMIC_H;
  const ventricularised = w >= MP_MARKER_ON;
  const notchLost = w >= MP_MARKER_ON;
  const separated = s1 - s0 > 1e-9 && sep - s0 >= MP_SEPARATION_SHARE * (s1 - s0);
  return { systemic, ventricularised, notchLost, separationMmHg: sep, separated, confirmed: systemic && ventricularised && notchLost && separated };
}

/** The dicrotic notch of aorticPressure: the incisura between these phases (its piecewise shape). */
const NOTCH: [number, number] = [0.32, 0.44];

/**
 * One beat of the aortic and distal traces (n samples) at hyperaemia fraction h, for display: the
 * physics of `reading`, with the distal trace's dicrotic notch filled in and an early-diastolic dip
 * (ventricularisation) in proportion to waveformChange(h) — the display part is a MODEL PARAMETER.
 */
export function distalBeat(c: CoronaryCase, h: number, n = 80, offset = 0, guideEngaged = false): { pa: number[]; pd: number[] } {
  const w = waveformChange(h);
  const pa: number[] = [];
  const pd: number[] = [];
  const at = (ph: number) => reading(c, ph * T, 1, h, guideEngaged, offset);
  const a0 = at(NOTCH[0]).pd;
  const a1 = at(NOTCH[1]).pd;
  for (let i = 0; i < n; i++) {
    const ph = i / n;
    const r = at(ph);
    let d = r.pd;
    if (ph > NOTCH[0] && ph < NOTCH[1]) {
      const lin = a0 + ((ph - NOTCH[0]) / (NOTCH[1] - NOTCH[0])) * (a1 - a0);
      d = d + w * (lin - d);
    }
    // early diastole: the distal trace falls below the aortic, like a ventricular trace, then rejoins it
    if (ph >= NOTCH[1] && ph < 0.75) d -= w * MP_VENT_DIP_MMHG * Math.sin((Math.PI * (ph - NOTCH[1])) / (0.75 - NOTCH[1]));
    pa.push(r.pa);
    pd.push(d);
  }
  return { pa, pd };
}

// ---------------------------------------------------------------------------
// Teaching cases
// ---------------------------------------------------------------------------
export const PHYSIOLOGY_CASES: CoronaryCase[] = [
  {
    id: "lad-intermediate",
    title: "Intermediate mid-LAD lesion",
    vessel: "LAD",
    brief: "62-year-old man, CCS class II angina on two agents. Angiography: 60% mid-LAD stenosis, 12 mm long, in a 3.0 mm vessel.",
    refDiamMm: 3.0,
    lengthMm: 110,
    lesions: [{ id: "mid", pos: 0.45, ds: 0.6, lengthMm: 12 }],
    diffuse: 0.1,
    cfrPotential: 3.6,
    map: 92,
    decision: "treat",
    teaching:
      "A focal lesion with an abnormal FFR and a sharp step on pullback is the ideal PCI target: stenting removes most of the gradient.",
  },
  {
    id: "rca-negative",
    title: "Moderate mid-RCA lesion",
    vessel: "RCA",
    brief: "58-year-old woman with atypical symptoms. 50% mid-RCA stenosis, 8 mm long, 3.5 mm vessel.",
    refDiamMm: 3.5,
    lengthMm: 120,
    lesions: [{ id: "mid", pos: 0.4, ds: 0.5, lengthMm: 8 }],
    diffuse: 0.05,
    cfrPotential: 3.6,
    map: 90,
    decision: "defer",
    teaching:
      "Angiographically moderate lesions are often not flow-limiting. Deferring PCI when FFR is above 0.80 (or iFR above 0.89) is safe with medical therapy.",
  },
  {
    id: "tandem",
    title: "Tandem LAD lesions",
    vessel: "LAD",
    brief: "67-year-old man, typical angina. Two moderate LAD lesions: proximal 55% (10 mm) and mid 60% (12 mm).",
    refDiamMm: 3.2,
    lengthMm: 115,
    lesions: [
      { id: "proximal", pos: 0.2, ds: 0.55, lengthMm: 10 },
      { id: "mid", pos: 0.55, ds: 0.62, lengthMm: 12 },
    ],
    diffuse: 0.08,
    cfrPotential: 3.6,
    map: 92,
    decision: "treat-first-then-remeasure",
    teaching:
      "Serial lesions interact: each one limits flow through the other, so FFR of a single lesion cannot be read in isolation. Use the pullback to find the larger step, treat it, then re-measure the remaining lesion.",
  },
  {
    id: "diffuse",
    title: "Diffusely diseased LAD",
    vessel: "LAD",
    brief: "71-year-old diabetic man. Long LAD with diffuse irregular narrowing and no dominant focal stenosis.",
    refDiamMm: 2.8,
    lengthMm: 120,
    lesions: [{ id: "mild", pos: 0.35, ds: 0.35, lengthMm: 8 }],
    diffuse: 1.25,
    cfrPotential: 3.2,
    map: 92,
    decision: "defer",
    teaching:
      "A gradual decline in Pd/Pa along the whole vessel without a step means diffuse disease. Stenting one segment will not restore normal physiology; optimise medical therapy and consider the whole-patient revascularisation strategy.",
  },
  {
    id: "anoca",
    title: "Angina with no obstructive coronary disease",
    vessel: "LAD",
    brief: "54-year-old woman with exertional angina and a positive stress test. Angiography: smooth coronaries, mild LAD irregularity.",
    refDiamMm: 3.0,
    lengthMm: 110,
    lesions: [{ id: "mild", pos: 0.4, ds: 0.25, lengthMm: 6 }],
    diffuse: 0.05,
    cfrPotential: 1.6,
    map: 94,
    decision: "microvascular",
    teaching:
      "Normal FFR does not exclude an ischaemic cause. A low CFR with a high IMR indicates coronary microvascular dysfunction; vasospasm testing with acetylcholine completes the assessment of ANOCA/INOCA.",
  },
  {
    id: "guide-wedge",
    title: "A pitfall: the deeply seated guide",
    vessel: "LAD",
    brief: "Same-sitting physiology after a diagnostic study. 65% proximal LAD stenosis. The guide is sitting deep in a short left main.",
    refDiamMm: 3.2,
    lengthMm: 115,
    lesions: [{ id: "proximal", pos: 0.25, ds: 0.615, lengthMm: 10 }],
    diffuse: 0.08,
    cfrPotential: 3.6,
    map: 92,
    guideObstructs: true,
    decision: "treat",
    teaching:
      "A guide wedged in the ostium damps the aortic trace and limits hyperaemic flow, so FFR reads falsely high. Disengage the guide during hyperaemia and use IV adenosine for a steady state.",
  },
  {
    id: "drift",
    title: "A pitfall: sensor drift",
    vessel: "LCx",
    brief: "Borderline 55% obtuse marginal lesion in a 2.8 mm vessel. The wire has been in for some time.",
    refDiamMm: 2.8,
    lengthMm: 90,
    lesions: [{ id: "om", pos: 0.45, ds: 0.555, lengthMm: 10 }],
    diffuse: 0.1,
    cfrPotential: 3.5,
    map: 90,
    drift: 4,
    decision: "treat",
    teaching:
      "Always pull the sensor back to the guide tip at the end. If Pd/Pa there is outside 0.98–1.02, the sensor has drifted: re-equalise and repeat the measurement.",
  },
];

export const PHYS_BY_ID: Record<string, CoronaryCase> = Object.fromEntries(PHYSIOLOGY_CASES.map((c) => [c.id, c]));

// ---------------------------------------------------------------------------
// Left main and aorto-ostial presets (physiology-left-main-and-ostial)
//
// Lessons pm-physiology-subsets, cp-left-main-assess and cp-ostial-assess:
// measure an intermediate left main from both branches with pullback (Brilakis
// 12.3, 17.12); downstream disease hides left main severity; resting and
// hyperaemic indices often disagree in the left main and are then decided on
// the clinical presentation; avoid FFR with a high right atrial pressure and
// LVEDP (the venous correction exists; imaging is the module's inference); a
// guide seated in an ostial lesion damps the trace and raises FFR until it is
// disengaged; after a cross-over stent the jailed circumflex is deferred above
// 0.80 and treated at 0.80 or less (Brilakis 17.12.2, 16.2.10.1).
//
// The anatomy (left main 4.5 mm and 10 mm long, LAD 3.5 mm, LCx 3.2 mm, a
// resting flow of 1 mL/s in each branch) and every lesion size below are
// MODEL PARAMETERS chosen so that each preset shows its teaching point
// (physiology.leftMain.test.ts checks each one); none is a measured value.
// Titles do not give the answer away.
// ---------------------------------------------------------------------------

/** Left main dimensions of the presets — MODEL PARAMETER (the session's MP_LM_LENGTH_MM is also 10 mm). */
const LM_SEG: Segment = { refDiamMm: 4.5, lengthMm: 10, lesions: [], diffuse: 0 };

const branchCase = (vessel: "LAD" | "LCx", lesions: Lesion[]): CoronaryCase => ({
  id: vessel.toLowerCase(),
  title: vessel,
  vessel,
  brief: "",
  refDiamMm: vessel === "LAD" ? 3.5 : 3.2,
  lengthMm: vessel === "LAD" ? 110 : 90,
  lesions,
  diffuse: 0.05,
  cfrPotential: 3.6,
  map: 92,
  decision: "defer",
  teaching: "",
});

type LmModelSpec = { id: string; title: string; brief: string; lm: Lesion[]; lad?: Lesion[]; lcx?: Lesion[]; cfr?: number; decision: CaseDecision; teaching: string } & Partial<Omit<BranchedCase, "lm">>;

const lmModel = (o: LmModelSpec): BranchedCase => {
  const { lm, lad = [], lcx = [], cfr, ...rest } = o;
  const br = (v: "LAD" | "LCx", ls: Lesion[]) => ({ ...branchCase(v, ls), ...(cfr !== undefined ? { cfrPotential: cfr } : {}) });
  return {
    vessel: "LM",
    map: 92,
    ...rest,
    lm: { ...LM_SEG, lesions: lm },
    branches: [
      { id: "LAD", label: "LAD", case: br("LAD", lad) },
      { id: "LCx", label: "LCx", case: br("LCx", lcx) },
    ],
  };
};

/** One left main or aorto-ostial preset: the branched case (null for an unbranched vessel) and the case a study starts with. */
export interface LeftMainPreset {
  id: string;
  /** the title in the lab and the practice list (does not give the answer away) */
  title: string;
  brief: string;
  model: BranchedCase | null;
  /** the case a study starts with: the default branch's view, or the vessel itself */
  case: CoronaryCase;
  /** the branches the wire can be placed in (empty for an unbranched vessel) */
  branches: readonly { id: string; label: string }[];
  /** case properties raised for the whole study (tip vocabulary) */
  events: readonly LabEvent[];
}

const LM_TEACH_BOTH =
  "Measure an intermediate left main from both branches, each with a pullback, and see where the step is: a significant left main lowers both branches and shows its step in the left main on both pullbacks; a normal value in one branch with an abnormal one in the other points away from the left main (Brilakis 12.3, 17.12).";

export const LEFT_MAIN_MODELS: readonly BranchedCase[] = [
  lmModel({
    id: "lm-significant",
    title: "Distal left main stenosis",
    brief: "66-year-old man, CCS class III angina on two agents. Angiography: an intermediate distal left main stenosis; the LAD and the circumflex have no other disease.",
    lm: [{ id: "lm", label: "left main", pos: 0.6, ds: 0.7, lengthMm: 6 }],
    decision: "treat",
    teaching: `${LM_TEACH_BOTH} Here both pullbacks step up across the left main and both branches are abnormal: the left main is significant.`,
  }),
  lmModel({
    id: "lm-ostial-lcx",
    title: "Distal left main and LCx ostium narrowing",
    brief: "61-year-old woman with exertional angina. Angiography: a moderate distal left main narrowing and a narrowed circumflex ostium; the LAD is smooth.",
    lm: [{ id: "lm", label: "left main", pos: 0.6, ds: 0.45, lengthMm: 6 }],
    lcx: [{ id: "lcx-ostium", label: "ostial circumflex", pos: 0.03, ds: 0.66, lengthMm: 6 }],
    decision: "treat",
    teaching: `${LM_TEACH_BOTH} Here the LAD is normal with no left main step and the circumflex loses its pressure at its own ostium: the left main is not significant, and the target is the circumflex ostium.`,
  }),
  lmModel({
    id: "lm-masked-by-lad",
    title: "Distal left main with proximal LAD disease",
    brief: "70-year-old man, CCS class II angina. Angiography: an intermediate distal left main stenosis and a severe proximal LAD stenosis.",
    lm: [{ id: "lm", label: "left main", pos: 0.6, ds: 0.68, lengthMm: 6 }],
    lad: [{ id: "lad-proximal", label: "proximal LAD", pos: 0.12, ds: 0.74, lengthMm: 10 }],
    decision: "imaging",
    alsoAccepted: ["treat-first-then-remeasure"],
    teaching:
      "A stenosis further down the LAD limits the maximal flow through the left main, so the distal pressure reads higher and the left main looks less severe than it is (Brilakis 17.12). The circumflex value cannot clear the left main here: intravascular imaging is the alternative in the left main (lesson pm-physiology-subsets), and the lumen area it measures does not depend on the flow the LAD lesion limits. Treating the LAD and measuring again applies the serial-lesion rule (Brilakis 12.2.7, lesson pm-physiology-pullback); the module does not state it for the left main.",
  }),
  lmModel({
    id: "lm-jailed-lcx-075",
    title: "Left main cross-over stent: the jailed side branch 1",
    brief:
      "68-year-old man after a provisional stent from the left main into the LAD. The circumflex ostium now looks narrowed, by about 75%, with TIMI 3 flow and no dissection; intracoronary nitroglycerin has been given.",
    lm: [],
    lcx: [{ id: "lcx-jailed", label: "jailed circumflex ostium", pos: 0.02, ds: 0.68, looksDs: 0.75, lengthMm: 5 }],
    defaultBranch: "LCx",
    decision: "treat",
    teaching:
      "The eye overestimates a jailed ostium, so measure it. With FFR 0.80 or less the circumflex needs treatment (Brilakis 17.12.2). Follow the stepwise sequence: rewire through a distal strut, kiss and repeat the POT, and add a second stent only if the result is still inadequate (Brilakis 16.2.10.1, the sequence lesson cp-left-main-distal uses).",
  }),
  lmModel({
    id: "lm-jailed-lcx-085",
    title: "Left main cross-over stent: the jailed side branch 2",
    brief:
      "64-year-old woman after a provisional stent from the left main into the LAD. The circumflex ostium now looks narrowed, by about 75%, with TIMI 3 flow and no dissection; intracoronary nitroglycerin has been given.",
    lm: [],
    lcx: [{ id: "lcx-jailed", label: "jailed circumflex ostium", pos: 0.02, ds: 0.61, looksDs: 0.75, lengthMm: 5 }],
    defaultBranch: "LCx",
    decision: "defer",
    teaching: "The eye overestimates a jailed ostium. With FFR above 0.80 the circumflex needs no further treatment; routine kissing has not been shown to help (Brilakis 17.12.2).",
  }),
  lmModel({
    id: "lm-discordant",
    title: "Left main stenosis with typical angina",
    brief:
      "57-year-old man with diabetes and typical exertional angina at one flight of stairs despite two agents. Angiography: an intermediate distal left main stenosis in a large left main; the LAD and the circumflex have no other disease.",
    lm: [{ id: "lm", label: "left main", pos: 0.6, ds: 0.66, lengthMm: 6 }],
    cfr: 4.2,
    decision: "treat",
    teaching:
      "Resting and hyperaemic indices disagree in about 14% of lesions, most often in large arteries such as the left main and the proximal LAD and in diabetes; Brilakis then decides on the clinical presentation. Limiting angina despite medical therapy here favours treatment.",
  }),
  lmModel({
    id: "lm-high-ra",
    title: "Left main stenosis in a breathless patient",
    brief:
      "74-year-old woman with heart failure, breathless on minimal exertion, raised jugular venous pressure. Right atrial pressure 22 mmHg, LVEDP 28 mmHg. Angiography: an intermediate distal left main stenosis.",
    pv: 22,
    lm: [{ id: "lm", label: "left main", pos: 0.6, ds: 0.66, lengthMm: 6 }],
    decision: "imaging",
    teaching:
      "With a high right atrial pressure and LVEDP, FFR is affected: it can be corrected, FFR = (Pd − Pv)/(Pa − Pv), but Brilakis advises avoiding functional assessment in such patients. IVUS area does not depend on pressures (this module's inference, lesson cp-left-main-assess).",
  }),
  lmModel({
    id: "ostial-lm-damped",
    title: "Ostial left main narrowing",
    brief: "63-year-old man with exertional angina. Angiography: an intermediate ostial left main narrowing; the guide is a 6 Fr extra-support guide without side holes.",
    lm: [{ id: "lm-ostium", label: "ostial left main", pos: 0.05, ds: 0.68, lengthMm: 6 }],
    guideObstructs: true,
    ostialGuide: true,
    decision: "treat",
    teaching:
      "An ostial left main lesion is an aorto-ostial lesion: equalise with the sensor and the guide in the ascending aorta, and measure with the guide disengaged (adenosine into the artery and then disengage, or IV adenosine). A seated guide damps the trace and makes FFR read falsely high (Brilakis 12.3). In the study he cites the error averaged about 0.04 in single vessels; it varies from lesion to lesion, and in this model the left main, which carries the flow of both branches, reads about 0.06 high. Then measure both branches.",
  }),
  lmModel({
    id: "lm-intermediate",
    title: "Intermediate left main stenosis",
    brief:
      "65-year-old man with stable angina. IVUS of the distal left main gave a minimal lumen area in the grey zone, and physiology is requested. Angiography: an intermediate distal left main stenosis; the LAD and the circumflex have no other disease.",
    lm: [{ id: "lm", label: "left main", pos: 0.6, ds: 0.62, lengthMm: 6 }],
    decision: "defer",
    teaching: `${LM_TEACH_BOTH} Here both branches stay above 0.80, with the same modest step across the left main on each pullback: deferral is reasonable.`,
  }),
];

/** The aorto-ostial RCA: an unbranched vessel with a guide seated in a diseased ostium. */
export const OSTIAL_RCA: CoronaryCase = {
  id: "ostial-rca-engaged",
  title: "Ostial RCA narrowing",
  vessel: "RCA",
  brief: "59-year-old man with exertional angina. Angiography: an intermediate aorto-ostial RCA narrowing in a 3.5 mm vessel; nitroglycerin has not changed it.",
  refDiamMm: 3.5,
  lengthMm: 120,
  lesions: [{ id: "ostium", pos: 0.02, ds: 0.66, lengthMm: 8 }],
  diffuse: 0.05,
  cfrPotential: 3.6,
  map: 90,
  guideObstructs: true,
  ostialGuide: true,
  decision: "treat",
  teaching:
    "Damping makes FFR and resting indices artificially high, so a seated guide underestimates an aorto-ostial lesion (Brilakis 12.3; in the study he cites, about 0.04 higher with a guide without side holes and about 0.02 with side holes). Equalise in the aorta and measure with the guide off the ostium, and repeat the final assessment the same way after stenting.",
};

const LM_BRANCHES = [
  { id: "LAD", label: "LAD" },
  { id: "LCx", label: "LCx" },
] as const;

const PRESET_EVENTS: Record<string, readonly LabEvent[]> = {
  "ostial-lm-damped": ["left-main-lesion", "aorto-ostial-lesion"],
  "lm-jailed-lcx-075": ["left-main-lesion", "side-branch-compromise"],
  "lm-jailed-lcx-085": ["left-main-lesion", "side-branch-compromise"],
};

export const LEFT_MAIN_PRESETS: readonly LeftMainPreset[] = [
  ...LEFT_MAIN_MODELS.map(
    (m): LeftMainPreset => ({ id: m.id, title: m.title, brief: m.brief, model: m, case: branchView(m), branches: LM_BRANCHES, events: PRESET_EVENTS[m.id] ?? ["left-main-lesion"] })
  ),
  { id: OSTIAL_RCA.id, title: OSTIAL_RCA.title, brief: OSTIAL_RCA.brief, model: null, case: OSTIAL_RCA, branches: [], events: ["aorto-ostial-lesion"] },
];

export const LEFT_MAIN_PRESET_BY_ID: Readonly<Record<string, LeftMainPreset>> = Object.fromEntries(LEFT_MAIN_PRESETS.map((p) => [p.id, p]));

/** The view of a preset in the chosen branch (the vessel itself for an unbranched preset), with treated lesions removed. */
export function presetView(p: LeftMainPreset, branchId?: string, treated: readonly string[] = []): CoronaryCase {
  if (!p.model) return treated.length ? { ...p.case, lesions: p.case.lesions.filter((l) => !treated.includes(l.id)) } : p.case;
  return branchView(p.model, branchId ?? p.model.defaultBranch ?? p.model.branches[0].id, treated);
}

// ---------------------------------------------------------------------------
// Post-PCI physiology (physiology-post-pci-handover)
//
// Lesson pm-physiology-after-pci (Brilakis 12.1, Fig 12.1): after a stent,
// measure the final FFR. When it is 0.80 or less (or the iFR 0.89 or less),
// pull back through the stent and find where the pressure is still lost:
// inside the stent, post-dilate or add a stent; a focal step outside it, stent
// it; a diffuse fall outside it, no further treatment. Above 0.91 has been
// linked with the best outcomes (an observational link, as the lesson says).
//
// Four presets, one per branch of the algorithm (an in-stent step, a focal
// step beyond the distal edge, diffuse loss beyond the stent, a final value
// above 0.91), and a builder that makes a post-PCI case from a deployed
// stent (the IVUS and OCT bench's StentResult, mapped by
// src/ui/bench/AssessPanel.tsx): the residual narrowing inside the stent
// comes from its expansion, the residual narrowing beside it from the native
// lumen the stent left uncovered. Every geometry below (vessel size and
// length, stent position, lesion sizes, diffuse disease) is a MODEL
// PARAMETER chosen so that each preset shows its teaching point
// (src/simulation/physiology/postPci.test.ts checks each one); none is a
// measured value. The cut-offs are CUTOFF's (sourced above) and
// POST_PCI_GOOD_FFR (Brilakis 12.1). Titles do not give the answer away, and
// the briefs share one setting that claims nothing about the angiogram (two
// presets leave a narrowing angiography would show) or the vessel beyond the
// stent. docs/realism/facts/pkg-physiology-post-pci-handover.md lists the
// parameters.
// ---------------------------------------------------------------------------

/** Final FFR above which a post-PCI result has been linked with the best outcomes (Brilakis 12.1, lesson pm-physiology-after-pci). */
export const POST_PCI_GOOD_FFR = 0.91;

/** Which branch of the algorithm a post-PCI case shows. */
export type PostPciVariant = "instent" | "edge" | "diffuse" | "good";

/** The decision each variant asks for. */
export const POST_PCI_VARIANT_DECISION: Readonly<Record<PostPciVariant, PostPciDecision>> = {
  instent: "post-dilate",
  edge: "treat-edge",
  diffuse: "accept-diffuse",
  good: "accept-result",
};

/** One post-PCI preset: a case with its stented segment, and the case properties raised for the whole study. */
export interface PostPciPreset {
  id: string;
  /** the title in the lab and the practice list (does not give the answer away) */
  title: string;
  brief: string;
  variant: PostPciVariant;
  /** the case, with `stent` set */
  case: CoronaryCase;
  /** case properties raised for the whole study (tip vocabulary); what the pullback shows is raised by postPciEvents */
  events: readonly LabEvent[];
}

/** Where the pressure is lost in a post-PCI case, from its hyperaemic pullback (Pd/Pa units). */
export interface PostPciLosses {
  /** distal hyperaemic Pd/Pa (the final FFR) */
  ffr: number;
  /** distal resting wave-free ratio */
  wfp: number;
  /** lost from the guide tip to the stent's proximal edge */
  proximal: number;
  /** lost across the stent */
  inStent: number;
  /** lost from the stent's distal edge to the distal end */
  distal: number;
  /** the largest single focal step outside the stent (a lesion's step), and where it is (null when there is none) */
  focalOutside: number;
  focalAt: number | null;
  /** the rest of the loss outside the stent: the gradual (diffuse) part */
  diffuseOutside: number;
}

/** Hyperaemic Pd/Pa at sensor position x. */
const hypRatio = (c: CoronaryCase, x: number) => indices(c, x, 1).pdpa;

/** Where a step at a lesion is read: just proximal and just distal to its position (lesions act at their position). */
const STEP_EPS = 1e-6;

/** The losses of a post-PCI case: across the stent, beside it, and its largest focal step outside it. */
export function postPciLosses(c: CoronaryCase): PostPciLosses {
  const s = c.stent;
  if (!s) throw new Error(`physiology: ${c.id} is not a post-PCI case (no stent segment)`);
  const at0 = hypRatio(c, 0);
  const atFrom = hypRatio(c, s.from);
  const atTo = hypRatio(c, s.to);
  const ffr = hypRatio(c, 1);
  const proximal = Math.max(0, at0 - atFrom);
  const inStent = Math.max(0, atFrom - atTo);
  const distal = Math.max(0, atTo - ffr);
  let focalOutside = 0;
  let focalAt: number | null = null;
  for (const l of c.lesions) {
    if (l.pos >= s.from && l.pos <= s.to) continue;
    const step = Math.max(0, hypRatio(c, l.pos) - hypRatio(c, Math.min(1, l.pos + STEP_EPS)));
    if (step > focalOutside) {
      focalOutside = step;
      focalAt = l.pos;
    }
  }
  const diffuseOutside = Math.max(0, proximal + distal - focalOutside);
  return { ffr, wfp: restingIndices(c, 1).nhpr, proximal, inStent, distal, focalOutside, focalAt, diffuseOutside };
}

/** A post-PCI value as the screen shows it (two decimals): the cut-offs are compared on this, so a value shown as 0.91 is never called above 0.91, nor one shown as 0.80 above 0.80. */
export const postPciShown = (v: number): number => Number(v.toFixed(2));

/** Whether a final FFR, as shown, is above POST_PCI_GOOD_FFR. */
export const postPciAboveGood = (ffrValue: number): boolean => postPciShown(ffrValue) > POST_PCI_GOOD_FFR;

/** Whether the post-PCI value asks for a pullback: FFR 0.80 or less, or the wave-free ratio 0.89 or less (Brilakis Fig 12.1), as shown. */
export function postPciLow(l: Pick<PostPciLosses, "ffr" | "wfp">): boolean {
  return postPciShown(l.ffr) <= CUTOFF.ffr || postPciShown(l.wfp) <= CUTOFF.nhpr;
}

/**
 * Brilakis's post-PCI algorithm applied to a case: accept the result when the final value does not ask
 * for a pullback; otherwise the largest of the loss across the stent, the largest focal step outside it
 * and the gradual loss outside it decides (post-dilate, treat the edge, accept the diffuse disease).
 * Comparing the three parts is this model's reading of "find where the remaining pressure is lost".
 */
export function postPciAlgorithm(c: CoronaryCase, losses: PostPciLosses = postPciLosses(c)): PostPciDecision {
  if (!postPciLow(losses)) return "accept-result";
  const m = Math.max(losses.inStent, losses.focalOutside, losses.diffuseOutside);
  if (m === losses.inStent) return "post-dilate";
  if (m === losses.focalOutside) return "treat-edge";
  return "accept-diffuse";
}

/** The largest step between neighbouring points of the hyperaemic pullback, and where it lies. */
export function largestPullbackStep(c: CoronaryCase, steps = 220): { x: number; drop: number; inStent: boolean } {
  const pts = pullback(c, 1, steps);
  let best = { x: 1, drop: 0 };
  for (let i = 0; i + 1 < pts.length; i++) {
    const drop = pts[i + 1].ratio - pts[i].ratio;
    if (drop > best.drop) best = { x: (pts[i].x + pts[i + 1].x) / 2, drop };
  }
  const s = c.stent;
  return { ...best, inStent: !!s && best.x >= s.from && best.x <= s.to };
}

/**
 * Events a post-PCI study raises once the pullback has been done: a low final value with the loss inside
 * the stent raises stent-underexpanded (an undersized or underexpanded stent is among the causes Brilakis
 * lists for a disappointing post-PCI FFR, 12.1.2; telling it from an undersized stent needs imaging).
 */
export function postPciEvents(c: CoronaryCase, done: { pulledBack: boolean }): LabEvent[] {
  if (!done.pulledBack || !c.stent) return [];
  return postPciAlgorithm(c) === "post-dilate" ? ["stent-underexpanded"] : [];
}

/**
 * The tip context of a post-PCI study: the PCI lab's optimisation step (phase "optimise", where the
 * request's tip pci-phys-post-pci-pullback is drawn), the vessel, the events raised for the run and those
 * the pullback raised. The phase "physiology" is not added: its set-up tips (zero, introduce, equalise)
 * do not apply to a wire already across the stent, and with them the post-PCI tips fall out of a short
 * list.
 */
export function postPciTipContext(c: CoronaryCase, done: { pulledBack: boolean }, extra: readonly LabEvent[] = []): LabContext {
  const events = [...new Set<LabEvent>([...extra, ...postPciEvents(c, done)])];
  const ctx: LabContext = { lab: "pci", phase: "optimise", events };
  if ((TIP_VESSEL_IDS as readonly string[]).includes(c.vessel)) ctx.vessel = c.vessel as TipVessel;
  return ctx;
}

// local copy of TIP_VESSELS so the engine does not import the curriculum registry
const TIP_VESSEL_IDS: readonly TipVessel[] = ["LM", "LAD", "LCx", "RCA", "SVG", "LIMA", "RIMA", "radial-graft"];

/**
 * What a post-PCI study can report, for a lab that runs one (the physiology lab and the PCI lab's
 * pressure-wire console are to merge it into their own declarations). Held back: no lab merges it yet,
 * and postPciTipContext is not yet the context of any live screen (physiologyTips.ts and the PCI lab's
 * console belong to a follow-up), so the tip integration is declared here but not live.
 */
export const POST_PCI_RAISES: LabRaises = { lab: "pci", phases: ["optimise"], events: ["stent-underexpanded"] };

const POST_PCI_ALGORITHM_NOTE =
  "When the post-PCI FFR is 0.80 or less (iFR 0.89 or less), pull back through the stent: a loss inside it means post-dilate or add a stent, a focal step outside it means a stent, a diffuse fall outside it means no further treatment (Brilakis Fig 12.1).";

/** The teaching shown after the decision, for the decision the algorithm gives (and, for accept-result, whether the value is above 0.91). */
export function postPciTeaching(decision: PostPciDecision, ffrValue: number): string {
  switch (decision) {
    case "post-dilate":
      return `The final value is low and the pullback shows the pressure lost across the stent itself: post-dilate, or add a stent. An undersized or underexpanded stent is among the causes Brilakis lists for a disappointing post-PCI FFR (12.1.2). ${POST_PCI_ALGORITHM_NOTE}`;
    case "treat-edge":
      return `The final value is low, there is little loss across the stent, and the pullback shows a focal step outside it: stent the focal step. Incomplete coverage, a geographic miss and an edge dissection are among the causes Brilakis lists (12.1.2). ${POST_PCI_ALGORITHM_NOTE}`;
    case "accept-diffuse":
      return `The final value is low, but the pressure falls gradually along the vessel outside the stent, with no step: no further treatment. Post-dilating a stent with no gradient across it treats the wrong segment, and a long stent over the diffuse disease is the treatment the manual avoids. ${POST_PCI_ALGORITHM_NOTE}`;
    case "accept-result":
      return postPciAboveGood(ffrValue)
        ? `The final FFR is above ${POST_PCI_GOOD_FFR}, the value Brilakis links with the best outcomes after PCI (an observational link): accept the result. The pullback algorithm applies only when the post-PCI FFR is 0.80 or less, or the iFR 0.89 or less.`
        : `The final value is above the cut-off (FFR above 0.80, iFR above 0.89), so the algorithm does not ask for a pullback: accept the result. Brilakis links values above ${POST_PCI_GOOD_FFR} with the best outcomes; in TARGET-FFR, further FFR-guided optimisation did not significantly increase the share reaching 0.90 or more.`;
  }
}

/** The vessel of the presets: a mid LAD, 3.0 mm, 110 mm long, stented from 0.30 to 0.50 (22 mm) — MODEL PARAMETERS. */
const POST_PCI_LAD = { vessel: "LAD", refDiamMm: 3.0, lengthMm: 110, cfrPotential: 3.6, map: 92 } as const;
const POST_PCI_STENT: StentSegment = { from: 0.3, to: 0.5 };

const POST_PCI_SETTING =
  "A stent has just been deployed in the mid LAD, a 3.0 mm vessel; a final pressure-wire measurement is part of the lab's routine after stenting. The pressure wire used for the measurement before the stent is still across it, the sensor in the distal vessel; it was equalised at the guide tip.";

const postPciPreset = (id: string, title: string, who: string, variant: PostPciVariant, lesions: Lesion[], diffuse: number): PostPciPreset => {
  const decision = POST_PCI_VARIANT_DECISION[variant];
  const brief = `${who} ${POST_PCI_SETTING}`;
  const c: CoronaryCase = { id, title, brief, ...POST_PCI_LAD, lesions, diffuse, stent: POST_PCI_STENT, decision, teaching: "" };
  return { id, title, brief, variant, case: { ...c, teaching: postPciTeaching(decision, ffr(c)) }, events: [] };
};

/** The four post-PCI presets, one per branch of the algorithm. Lesion sizes and diffuse disease are MODEL PARAMETERS. */
export const POST_PCI_PRESETS: readonly PostPciPreset[] = [
  postPciPreset(
    "post-pci-instent-step",
    "Post-stent physiology 1: mid LAD",
    "67-year-old man with exertional angina on two agents.",
    "instent",
    // the stent narrowed over 8 mm at its middle (a waist that did not open): residual diameter stenosis 0.61
    [{ id: "in-stent", label: "within the stent", pos: 0.4, ds: 0.61, lengthMm: 8 }],
    0.05
  ),
  postPciPreset(
    "post-pci-focal-edge",
    "Post-stent physiology 2: mid LAD",
    "63-year-old woman with exertional angina on two agents.",
    "edge",
    // a small residual narrowing inside the well-expanded stent, and a focal lesion 3 mm beyond its distal edge
    [
      { id: "in-stent", label: "within the stent", pos: 0.4, ds: 0.1, lengthMm: 10 },
      { id: "distal-edge", label: "beyond the distal edge", pos: 0.53, ds: 0.62, lengthMm: 8 },
    ],
    0.05
  ),
  postPciPreset(
    "post-pci-diffuse",
    "Post-stent physiology 3: mid LAD",
    "71-year-old man with diabetes and exertional angina on two agents.",
    "diffuse",
    [],
    1.45
  ),
  postPciPreset(
    "post-pci-good",
    "Post-stent physiology 4: mid LAD",
    "59-year-old man with exertional angina on two agents.",
    "good",
    [{ id: "in-stent", label: "within the stent", pos: 0.4, ds: 0.1, lengthMm: 10 }],
    0.05
  ),
];

export const POST_PCI_PRESET_BY_ID: Readonly<Record<string, PostPciPreset>> = Object.fromEntries(POST_PCI_PRESETS.map((p) => [p.id, p]));

/** The preset of each variant (what a hand-over names when it chooses by variant). */
export const POST_PCI_PRESET_FOR: Readonly<Record<PostPciVariant, string>> = Object.fromEntries(POST_PCI_PRESETS.map((p) => [p.variant, p.id])) as Record<PostPciVariant, string>;

// --- a post-PCI case from a deployed stent ------------------------------------------------------

/** A deployed stent and the segment around it, in mm along the treated segment (the bench's pullback). */
export interface PostPciStentInput {
  vessel: string;
  /** the coronary part of the segment (an ostial pullback starts in the aorta) */
  segmentFromMm: number;
  segmentToMm: number;
  stentFromMm: number;
  stentToMm: number;
  /** the achieved stent diameter along the stent, mm */
  stentProfile: readonly { x: number; d: number }[];
  /** the worse-half expansion: minimal stent area against its nearest reference lumen area, % */
  expansionPct: number;
  /** native lumen diameter at a position of the segment, mm (read outside the stent) */
  nativeLumen: (x: number) => number;
  /** reference lumen diameters proximal and distal to the stent, mm */
  proxRefMm: number;
  distRefMm: number;
}

/** Normal vessel proximal to the treated segment in a case built from a stent, mm — MODEL PARAMETER. */
export const MP_POST_PCI_SEGMENT_OFFSET_MM = 20;
/** Shortest vessel a case built from a stent has, mm (the teaching cases' LAD length) — MODEL PARAMETER. */
export const MP_POST_PCI_VESSEL_MM = 110;
/** Normal vessel kept distal to the treated segment, mm — MODEL PARAMETER. */
export const MP_POST_PCI_DISTAL_MM = 30;
/** Diffuse disease of a case built from a stent (the teaching cases' near-normal value) — MODEL PARAMETER. */
export const MP_POST_PCI_DIFFUSE = 0.05;
/** CFR potential and mean aortic pressure of a case built from a stent (the teaching cases' values) — MODEL PARAMETERS. */
export const MP_POST_PCI_CFR = 3.6;
export const MP_POST_PCI_MAP = 92;
/** Shortest in-stent waist, mm — MODEL PARAMETER. */
export const MP_WAIST_MIN_MM = 2;
/** A native narrowing beside the stent counts as a residual lesion from this diameter stenosis against its side's reference — MODEL PARAMETER. */
export const MP_EDGE_RESIDUAL_MIN_DS = 0.2;
/** Shortest residual edge lesion, mm — MODEL PARAMETER. */
export const MP_EDGE_MIN_MM = 1;
/** Sampling step of the native lumen beside the stent, mm — MODEL PARAMETER. */
const EDGE_STEP_MM = 0.5;

/**
 * The residual narrowing inside a deployed stent, as one lesion at the stent's narrowest point: diameter
 * stenosis 1 − √(expansion), the narrowest diameter against the reference lumen its expansion was judged
 * by (the plan's "minimum stent diameter to residual ds"), over the waist's Poiseuille-equivalent length
 * at that diameter, ∫ (d_min / d)⁴ dx along the part of the stent narrower than that reference, at least
 * MP_WAIST_MIN_MM. Both are labelled model choices: a tapering waist loses as much by viscosity as this
 * length at its narrowest diameter, and its exit loss is taken once, at the narrowest point.
 */
export function inStentResidual(inp: Pick<PostPciStentInput, "stentProfile" | "expansionPct" | "stentFromMm" | "stentToMm">): { atMm: number; ds: number; lengthMm: number } | null {
  const pts = inp.stentProfile;
  if (!pts.length) return null;
  const frac = Math.sqrt(Math.max(0, Math.min(100, inp.expansionPct)) / 100);
  const ds = 1 - frac;
  if (ds <= 0) return null;
  let k = 0;
  for (let i = 1; i < pts.length; i++) if (pts[i].d < pts[k].d) k = i;
  const dMin = pts[k].d;
  const ref = frac > 0 ? dMin / frac : Infinity;
  let lengthMm = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (p.d >= ref || p.d <= 0) continue;
    const dx = i + 1 < pts.length ? pts[i + 1].x - p.x : i > 0 ? p.x - pts[i - 1].x : 0;
    lengthMm += (dMin / p.d) ** 4 * Math.max(0, dx);
  }
  const atMm = Math.max(inp.stentFromMm, Math.min(inp.stentToMm, pts[k].x));
  return { atMm, ds, lengthMm: Math.max(MP_WAIST_MIN_MM, lengthMm) };
}

/**
 * The residual native narrowings beside the stent: on each side, the narrowest native lumen between the
 * segment's end and the stent edge, when its diameter stenosis against that side's reference reaches
 * MP_EDGE_RESIDUAL_MIN_DS, over the stretch that keeps at least half of it (and at least that threshold).
 * A stent that left the lesion uncovered (a geographic miss) leaves its lesion here.
 */
export function edgeResiduals(inp: PostPciStentInput): { side: "proximal" | "distal"; atMm: number; ds: number; lengthMm: number }[] {
  const out: { side: "proximal" | "distal"; atMm: number; ds: number; lengthMm: number }[] = [];
  const side = (which: "proximal" | "distal", from: number, to: number, ref: number) => {
    if (to - from < EDGE_STEP_MM || ref <= 0) return;
    const xs: number[] = [];
    for (let x = from; x <= to + 1e-9; x += EDGE_STEP_MM) xs.push(x);
    const dsAt = xs.map((x) => 1 - inp.nativeLumen(x) / ref);
    let k = 0;
    for (let i = 1; i < xs.length; i++) if (dsAt[i] > dsAt[k]) k = i;
    const ds = dsAt[k];
    if (ds < MP_EDGE_RESIDUAL_MIN_DS) return;
    const keep = Math.max(MP_EDGE_RESIDUAL_MIN_DS, ds / 2);
    let a = k,
      b = k;
    while (a > 0 && dsAt[a - 1] >= keep) a--;
    while (b + 1 < xs.length && dsAt[b + 1] >= keep) b++;
    out.push({ side: which, atMm: (xs[a] + xs[b]) / 2, ds, lengthMm: Math.max(MP_EDGE_MIN_MM, xs[b] - xs[a]) });
  };
  side("proximal", inp.segmentFromMm, inp.stentFromMm - EDGE_STEP_MM, inp.proxRefMm);
  side("distal", inp.stentToMm + EDGE_STEP_MM, inp.segmentToMm, inp.distRefMm);
  return out;
}

/**
 * A post-PCI case from a deployed stent: the treated segment placed MP_POST_PCI_SEGMENT_OFFSET_MM into a
 * vessel of at least MP_POST_PCI_VESSEL_MM, with the stent's residual waist (inStentResidual) and the
 * native narrowings beside it (edgeResiduals) as lesions, near-normal diffuse disease, and the decision
 * Brilakis's algorithm gives for it (postPciAlgorithm), so the grading follows the physics of this stent.
 */
export function postPciCaseFromStent(inp: PostPciStentInput, id = "post-pci-from-stent"): CoronaryCase {
  const segLen = Math.max(0, inp.segmentToMm - inp.segmentFromMm);
  const L = Math.max(MP_POST_PCI_VESSEL_MM, MP_POST_PCI_SEGMENT_OFFSET_MM + segLen + MP_POST_PCI_DISTAL_MM);
  const pos = (x: number) => Math.max(0, Math.min(1, (MP_POST_PCI_SEGMENT_OFFSET_MM + (x - inp.segmentFromMm)) / L));
  const lesions: Lesion[] = [];
  const waist = inStentResidual(inp);
  if (waist) lesions.push({ id: "in-stent", label: "within the stent", pos: pos(waist.atMm), ds: waist.ds, lengthMm: waist.lengthMm });
  for (const e of edgeResiduals(inp)) lesions.push({ id: `${e.side}-edge`, label: e.side === "proximal" ? "proximal to the stent" : "beyond the distal edge", pos: pos(e.atMm), ds: e.ds, lengthMm: e.lengthMm });
  const stent: StentSegment = { from: pos(Math.max(inp.segmentFromMm, inp.stentFromMm)), to: pos(Math.min(inp.segmentToMm, inp.stentToMm)) };
  const base: CoronaryCase = {
    id,
    title: `Post-stent physiology: ${inp.vessel}`,
    vessel: inp.vessel,
    brief: `The stent you deployed on the bench, measured with a pressure wire across it, the sensor in the distal vessel.`,
    refDiamMm: (inp.proxRefMm + inp.distRefMm) / 2,
    lengthMm: L,
    lesions,
    diffuse: MP_POST_PCI_DIFFUSE,
    cfrPotential: MP_POST_PCI_CFR,
    map: MP_POST_PCI_MAP,
    stent,
    decision: "accept-result",
    teaching: "",
  };
  const losses = postPciLosses(base);
  const decision = postPciAlgorithm(base, losses);
  return { ...base, decision, teaching: postPciTeaching(decision, losses.ffr) };
}

/** The variant a post-PCI case shows, from the decision the algorithm gives for it. */
export function postPciVariantOf(c: CoronaryCase): PostPciVariant {
  const d = postPciAlgorithm(c);
  return (Object.keys(POST_PCI_VARIANT_DECISION) as PostPciVariant[]).find((v) => POST_PCI_VARIANT_DECISION[v] === d) ?? "good";
}

/** What the learner has done in a post-PCI study. */
export interface PostPciStudyState {
  measured: boolean;
  pulledBack: boolean;
  decision: CaseDecision | null;
}

export const initialPostPciStudy = (): PostPciStudyState => ({ measured: false, pulledBack: false, decision: null });

/** A post-PCI study graded: the decision against the case's (or one it also accepts), and the pullback when the value was low. */
export function scorePostPciStudy(c: CoronaryCase, s: PostPciStudyState): { decisionCorrect: boolean; expected: CaseDecision; pullbackNeeded: boolean; passed: boolean } {
  const decisionCorrect = s.decision !== null && (s.decision === c.decision || !!c.alsoAccepted?.includes(s.decision));
  const pullbackNeeded = postPciLow(postPciLosses(c));
  return { decisionCorrect, expected: c.decision, pullbackNeeded, passed: s.measured && decisionCorrect && (!pullbackNeeded || s.pulledBack) };
}
