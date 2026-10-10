// ---------------------------------------------------------------------------
// Contrast transport along the coronary tree.
//
// 1. Mixing at the ostium. The injected flow Q_inj (from the hand-injection
//    trace, simulation/injection.ts) meets the native phasic coronary flow
//    Q_n(t) = Q_rest x phasicFlow(beat phase) x flowScale (S9 coronaryFlow.ts).
//    A share `capture` of the jet enters the ostium (coaxial, seated tip near 1;
//    a tip pointing at the sinus wall much less). If the captured jet exceeds
//    what the coronary takes, the excess refluxes into the sinus, unless the tip
//    seals the ostium (`seal`), which overdrives coronary flow instead:
//      Q_c = Q_n + seal x max(0, capture Q_inj - Q_n)
//      f   = min(1, capture Q_inj / Q_c)        (strength entering the artery)
//      Q_reflux = Q_inj - min(capture Q_inj, Q_c)
//    With a weak push f follows the phasic flow (diastolic dilution bands).
// 2. Flow time. Downstream of the ostium every branch carries a fixed share of
//    the ostial flow (S9's resting distribution, lesions included through the
//    region supplies), so the whole tree runs on one clock per side:
//    s(t) = integral of Q_c / Q_rest dt. A sample's nominal transit time theta
//    is the integral of area / flow along its path from the ostium (seconds at
//    mean resting flow): fast in a stenosis, slow beyond a stenosis only when it
//    limits antegrade resting flow (haemodynamically significant: its antegrade
//    maximal capacity falls below resting demand), slow in collaterals. A chronic
//    non-occlusive stenosis keeps TIMI 3 flow with a frame count raised by about
//    a third (CHRONIC_RESERVE_ANTEGRADE); acute lesions keep S9's antegrade share.
//    Live modifiers (TransportMods): a balloon occlusion stops antegrade contrast
//    beyond it, hyperaemia speeds it, regional no-reflow slows it, and the
//    patient's live flow over rest per vessel (flowScale, pci-patient-coupling)
//    scales the flow of the regions it supplies: the front then reaches each
//    sample later in proportion (an arrest without compressions all but stops
//    it; the push itself still drives contrast in).
// 3. 1D advection-dispersion. The cross-section-averaged response of a sample
//    to a unit step of ostial strength is a blend of a dispersed plug
//    (Gaussian in flow time, sigma growing with theta) and laminar streaming
//    (Poiseuille profile without diffusion: 1 - theta / (2 tau) once tau >
//    theta / 2, which gives the early thin leading edge and the long washout
//    tail of contrast left at the wall). A weak jet mixes poorly, so its share
//    of laminar streaming is larger and the column is patchy (streaks that
//    travel with the blood). The strength at a sample is the Duhamel sum of the
//    ostial history over this kernel.
// 4. Myocardial blush: a compartment fed by the strength reaching the
//    arteriolar ends, cleared with its own time constant (TMP grade 3: minimally
//    persistent after three beats of washout). Reflux: a sinus compartment fed
//    by the refluxing jet and cleared by aortic flow.
// 5. Collaterals (diag-lesion-morphologies). Contrast moves along a collateral
//    channel at the speed its Werner grade gives (coronaryTree COLLATERAL), so
//    the channel's end is reached at the donor's transit time to the channel
//    origin plus the channel's own transit. From each channel's entry it
//    spreads through the recipient bed (forwards and backwards, across branch
//    points, only where the Rentrop grade lets it fill) at RETRO.spreadMmS.
//    The recipient's strength is the donor's ostial history delayed by that
//    lag, as plug flow with a dispersion growing with the lag (no laminar
//    streaming: a slow, thin channel mixes completely), times the channel's
//    gain: late, faint, and washing out late (ContrastField.late).
//    A SCAD false lumen is a slowly exchanging compartment beside the lumen
//    (ContrastField.retained): it fills slowly and holds contrast after the
//    lumen has cleared.
// 6. Anatomy variants (diag-anatomy-variants). A fistula (coronaryGrowth
//    FISTULA_VESSEL) is a sink: contrast runs through it at its flow and
//    leaves into the pulmonary artery, so its end feeds no blush
//    (TransportNet.sinks records where it drains). An artery with its own
//    ostium in the injected sinus other than the engaged one (an anomalous
//    circumflex from the right sinus) fills from the contrast refluxing into
//    the sinus, SINUS_FED.delayS later and at SINUS_FED.share of the strength
//    the engaged ostium receives (VesselNet.share, inletShareOf: the scene
//    multiplies the vessel's concentration by it), so it outlines faintly on
//    the RCA run. rootInjectionShares gives the share of a non-selective sinus
//    injection or an aortogram that reaches each ostium.
// Constants: docs/realism/facts/I1.md (step 2); the collateral and retention
// constants are model parameters (RETRO below), as are the anatomy-variant ones.
// ---------------------------------------------------------------------------

import type { Lesion } from "../../types";
import type { CoronaryTree, TreeVessel } from "./coronaryTree";
import type { FlowRegion } from "../../simulation/patient/coronaryFlow";
import { coronaryFlowFor, supplyFor, vesselFlowProfile, phasicFlow } from "../../simulation/patient/coronaryFlow";
import type { InjectionTrace } from "../../simulation/injection";
import type { Vec3 } from "../../types";

// ---- model parameters (facts/I1.md) -------------------------------------------
/** Laminar-streaming share of the response with a well-mixed (strong) jet, and with a weak jet. */
export const LAMINAR_SHARE = { mixed: 0.25, weak: 0.85 } as const;
/** Dispersion of the plug part: sigma = sigma0 + kappa x theta (s, flow time). */
export const DISPERSION = { sigma0: 0.04, kappa: 0.15 } as const;
/** A jet weaker than this share of native flow mixes poorly; at the upper value it mixes fully. */
export const MIXING_JET = { poor: 0.3, full: 1.0 } as const;
/** Patchiness of a poorly mixed column (0..1 depth of the streaks). */
export const STREAK_DEPTH = 0.45;
/** Myocardial blush: clearance time constant (s, flow time) and iodine at full strength (mg/mL of myocardium). */
export const BLUSH = { tauS: 1.2, mgPerMl: 8 } as const;
/** Sinus (reflux) cloud: local mixing flow (mL/s) and clearance time constant (s). */
export const SINUS = { mixMlS: 60, tauS: 0.25 } as const;
/** Contrast spread speed in collateral channels (mm/s), the earlier model's value; a channel drawn from a CollateralChannel carries its own speed (TreeVessel.channel). */
export const COLLATERAL_SPEED_MM_S = 30;
/**
 * Retrograde filling through collaterals and retention (MODEL PARAMETER, diag-lesion-morphologies; not
 * from a source): contrast spreads through the recipient bed at spreadMmS; the delayed copy of the donor's
 * inlet disperses with sigma = sigma0 + kappa x lag (s, flow time); a SCAD false lumen exchanges with the
 * lumen with the time constant retentionTauS (s).
 */
export const RETRO = { spreadMmS: 80, sigma0: 0.25, kappa: 0.12, retentionTauS: 2.5 } as const;
/**
 * Chronic, non-occlusive stenosis: share of the resting flow that S9 credits to its rest reserve
 * (MP_CHRONIC_REST_RESERVE: "recruited collaterals or reduced demand") that still arrives antegrade, and so
 * carries the injected contrast. S9's antegrade capacity (wireFlow, with the expansion loss of a severe
 * narrowing) falls below resting demand from about 75 % and to almost nothing at 90 % (0.47 at 80 %, 0.17 at
 * 85 %, 0.04 at 90 %, case 0 LAD), which would make every stable severe stenosis a TIMI 1 vessel; stable
 * non-occlusive lesions show TIMI 3 flow with a moderately raised frame count. Antegrade share used for the
 * transport = a + (1 - a) x this, with a = S9's antegrade maximal capacity over resting demand (capped at 1).
 * Calibrated so the model's TIMI frame count beyond an 80-90 % stenosis is about a third longer than without
 * it, the difference Li et al. 2021 report between flow-limiting and non-flow-limiting vessels (corrected TIMI
 * frame count 28.56 vs 21.64; facts/I1.md). Acute (thrombotic) lesions and occlusions keep S9's raw antegrade
 * share: no time to adapt, TIMI 0-2.
 */
export const CHRONIC_RESERVE_ANTEGRADE = 0.57;
/** A region whose flow a device occlusion (balloon) cuts below this share of its resting flow carries no antegrade contrast. */
export const BLOCKED_SHARE = 0.02;
/** Slowest contrast speed in a patent vessel (mm/s): the floor for terminal samples whose modelled flow is ~0. */
export const MIN_SPEED_MM_S = 20;
/**
 * Contrast transit gain: nominal transit times are the S9 resting flow divided into the rendered lumen
 * area, divided by this gain. Calibrated so the model's TIMI frame count analogue (contrast filling the
 * proximal artery to arrival at the distal landmark, standard injection) matches Gibson et al. 1996's
 * normal LAD, circumflex and RCA counts (facts/I1.md). It absorbs the injection's augmentation of flow
 * and the scale of the model's resting flows and lumen areas.
 */
export const TRANSIT_GAIN = 1.2;
/** Longest nominal transit time kept (s). */
export const THETA_MAX_S = 12;
/** Ostial history step (s). */
export const HISTORY_DT = 1 / 60;
/** Name of the fistula vessel (coronaryGrowth.ts FISTULA_VESSEL; repeated here so the transport does not import the growth code). */
export const FISTULA_NAME = "FISTULA";
/**
 * An artery with its own ostium in the injected sinus that is not the engaged one fills from the contrast refluxing
 * into the sinus: its transit starts `delayS` later (s, flow time) and it receives `share` of the strength the engaged
 * ostium receives (the seat's capture goes to the engaged artery; the neighbouring ostium takes only part of the
 * reflux). MODEL PARAMETERS (diag-anatomy-variants): Oxford describes the anomalous circumflex as faintly filled on the
 * RCA run (pm-interpreting-anomalies); no source gives a delay or a share. A circumflex from the proximal RCA is a true
 * RCA branch and keeps share 1.
 */
export const SINUS_FED = { delayS: 0.6, share: 0.3 } as const;
/**
 * Non-selective injection into a sinus and aortogram (diag-anatomy-variants), MODEL PARAMETERS: the share of a sinus
 * injection that reaches an ostium falls off with the ostium's distance from the catheter tip over `falloffMm`
 * (about a sinus radius) and is at most `sinusMax`; an aortogram through a pigtail (Brilakis: usually 60 mL over 3 s,
 * pm-engaging-fail) opacifies the whole root and reaches every ostium with `aortogram`.
 */
export const ROOT_INJECTION = { falloffMm: 18, sinusMax: 0.35, aortogram: 0.3 } as const;
/** Brilakis's aortogram, as pm-engaging-fail quotes it: 60 mL over 3 seconds through a pigtail. */
export const AORTOGRAM = { volumeMl: 60, durationS: 3 } as const;

/**
 * Share of a non-selective root injection that reaches each ostium (0..1), keyed by the ostium's name. With a tip
 * position (a sinus injection) the share falls off with the ostium's distance from the tip; an aortogram reaches
 * every ostium alike. A scene draws an ostium's arteries with this share as the seat's capture.
 */
export function rootInjectionShares(ostia: readonly { name: string; pos: Vec3 }[], tip: Vec3 | null, aortogram = false): Map<string, number> {
  const out = new Map<string, number>();
  for (const o of ostia) {
    if (aortogram || !tip) {
      out.set(o.name, aortogram ? ROOT_INJECTION.aortogram : 0);
      continue;
    }
    const d = Math.hypot(o.pos.x - tip.x, o.pos.y - tip.y, o.pos.z - tip.z);
    out.set(o.name, ROOT_INJECTION.sinusMax * Math.exp(-d / ROOT_INJECTION.falloffMm));
  }
  return out;
}

/** Engagement defaults when a scene says nothing: coaxial seated catheter. */
export const DEFAULT_SEAT: Seat = { capture: 1, seal: 0.3 };

/**
 * Development only: window.__contrastTune overrides the model parameters above for calibration runs
 * (A/B captures); production builds always use the constants.
 */
export interface ContrastTune {
  laminarMixed?: number;
  laminarWeak?: number;
  sigma0?: number;
  kappa?: number;
  streak?: number;
  blushTau?: number;
  blushMg?: number;
  sinusMix?: number;
  sinusTau?: number;
  transitGain?: number;
  chronicAntegrade?: number;
}
export function contrastTune(): Required<ContrastTune> {
  const dev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ? (globalThis as { __contrastTune?: ContrastTune }).__contrastTune : undefined;
  return {
    laminarMixed: dev?.laminarMixed ?? LAMINAR_SHARE.mixed,
    laminarWeak: dev?.laminarWeak ?? LAMINAR_SHARE.weak,
    sigma0: dev?.sigma0 ?? DISPERSION.sigma0,
    kappa: dev?.kappa ?? DISPERSION.kappa,
    streak: dev?.streak ?? STREAK_DEPTH,
    blushTau: dev?.blushTau ?? BLUSH.tauS,
    blushMg: dev?.blushMg ?? BLUSH.mgPerMl,
    sinusMix: dev?.sinusMix ?? SINUS.mixMlS,
    sinusTau: dev?.sinusTau ?? SINUS.tauS,
    transitGain: dev?.transitGain ?? TRANSIT_GAIN,
    chronicAntegrade: dev?.chronicAntegrade ?? CHRONIC_RESERVE_ANTEGRADE,
  };
}

export interface Seat {
  /** share of the jet that enters the ostium (0..1) */
  capture: number;
  /** how far the tip occludes the ostium (0 free … 1 wedged): an occluding tip overdrives coronary flow */
  seal: number;
}

// ---------------------------------------------------------------------------
// flow network (per tree and lesion set)
// ---------------------------------------------------------------------------

export interface VesselNet {
  /** nominal transit time from the ostium at each base sample (s at mean resting flow) */
  theta: Float32Array;
  /** resting flow at each base sample (mL/s) */
  q: Float32Array;
  /**
   * Recipients beyond a chronic occlusion: lag (s, flow time) from the donor ostium to each base sample
   * through the collateral channels; Infinity where the sample does not fill (TreeVessel.retro).
   */
  lag?: Float32Array;
  /**
   * Share (0..1) of the engaged ostium's strength that reaches this vessel's inlet: SINUS_FED.share for an artery fed
   * by the sinus reflux (an anomalous circumflex with its own right-sinus ostium) and everything it gives off; absent
   * (1) for every other vessel. inletShareOf reads it.
   */
  share?: number;
}

export interface TransportNet {
  vessels: Map<string, VesselNet>;
  /** resting ostial flow per side (mL/s) */
  rest: { left: number; right: number };
  /** largest theta per side (s) */
  thetaMax: { left: number; right: number };
  /** median theta of terminal samples per side: arrival at the arteriolar ends (s) */
  thetaEnd: { left: number; right: number };
  /** 10th, 30th, 50th, 70th and 90th centiles of the terminal thetas per side (blush input spread) */
  thetaEndQ: { left: number[]; right: number[] };
  /** share of each side's resting demand (by region) whose antegrade flow the live modifiers cut or slow (0..1) */
  impaired: { left: number; right: number };
  /** largest finite retrograde lag per donor side (s; 0 without collateral filling) */
  lagMax: { left: number; right: number };
  /** fistulae: the vessel, its side and the transit time to its drainage (s); absent when the tree has none */
  sinks?: { vessel: string; side: "left" | "right"; theta: number }[];
}

/**
 * Live flow conditions from the lab or the patient engine (S9 FlowModifiers semantics where they exist).
 * - occlusions: balloon or device occlusions (tree vessel name, param 0..1, fraction of lumen closed); a region
 *   cut below BLOCKED_SHARE of its resting flow receives no antegrade contrast.
 * - hyperaemia: per side, 0 rest ... 1 maximal (S9 supplyFor: flow rises towards the lesion-limited capacity).
 * - noReflow: microvascular obstruction beyond a point (tree vessel name and param): the resting flow of every
 *   region beyond it is multiplied by `scale` (slow flow / no-reflow after an intervention).
 */
export interface TransportMods {
  occlusions?: { vessel: string; param: number; fraction: number }[];
  hyperaemia?: { left: number; right: number };
  noReflow?: { vessel: string; param: number; scale: number } | null;
  /**
   * The patient's live coronary flow over its flow at rest, per tree vessel name (pci-patient-coupling: the
   * patient engine's coronaryFlowScale, so a fall in perfusion pressure, an arrest or a wedged guide slows the
   * contrast and hyperaemia speeds it). A region takes the scale of the nearest vessel on its path from the
   * ostium that has one; regions with none keep their flow. Absent: resting flows, as before.
   */
  flowScale?: Record<string, number>;
}

const netCache = new WeakMap<CoronaryTree, Map<string, TransportNet>>();

/** S9's antegrade maximal capacity of a region over its resting demand (capped at 1). */
export function rawAntegradeShare(r: FlowRegion, cfr: number): number {
  if (!r.lesionIdx || r.lesionIdx.length === 0) return 1;
  return Math.max(0, Math.min(1, r.hypFactor * (1 - (r.collateral ?? 0)) * cfr));
}

/**
 * Share of a region's resting flow that arrives antegrade and carries the contrast: S9's raw antegrade share
 * for acute lesions and occlusions; for chronic non-occlusive stenoses the reserve S9 credits to collaterals is
 * partly antegrade (CHRONIC_RESERVE_ANTEGRADE).
 */
export function antegradeShare(r: FlowRegion, cfr: number, lesions: Lesion[], chronic = contrastTune().chronicAntegrade): number {
  const a = rawAntegradeShare(r, cfr);
  if (a >= 1 || !r.lesionIdx) return a;
  const ls = r.lesionIdx.map((i) => lesions[i]).filter((l): l is Lesion => !!l);
  const acute = ls.some((l) => l.kind === "thrombotic");
  const occluded = ls.some((l) => l.severity >= 99 || (l.kind === "cto" && l.severity >= 95));
  if (acute || occluded) return a;
  return a + (1 - a) * Math.max(0, Math.min(1, chronic));
}

/** The region lies beyond a point on a vessel (S9 dynamicFactor's rule). */
function regionBeyond(r: FlowRegion, vessel: string, param: number): boolean {
  const pp = r.path.find((p) => p.vessel === vessel);
  if (!pp) return false;
  return pp.vessel === r.vessel ? r.p1 >= param : pp.param >= param;
}

/** The transport network of a tree (S9 resting flows with the lesions' resting supply, and live modifiers). Cached. */
export function transportNet(tree: CoronaryTree, lesions: Lesion[] = [], mods: TransportMods = {}): TransportNet {
  const P = contrastTune();
  const gain = P.transitGain;
  const key = JSON.stringify([gain, P.chronicAntegrade, mods, ...lesions.map((l) => [l.vessel, l.position, l.severity, l.kind, l.lengthMm ?? 0])]);
  let m = netCache.get(tree);
  if (!m) netCache.set(tree, (m = new Map()));
  const hit = m.get(key);
  if (hit) return hit;
  const fm = coronaryFlowFor(tree, lesions);
  // antegrade flow of each region: what it receives through its upstream lesions (antegradeShare), so contrast
  // slows only beyond a haemodynamically significant stenosis; collateral supply does not carry the injected
  // contrast. Live modifiers (balloon occlusion, hyperaemia, no-reflow) act on top (S9 supplyFor).
  const live = { occlusions: mods.occlusions, hyperaemia: mods.hyperaemia };
  const restQ = fm.regions.map((r) => supplyFor(r, fm, {}).q);
  const impairedDemand = { left: 0, right: 0 };
  const demand = { left: 0, right: 0 };
  const liveQ = fm.regions.map((r) => supplyFor(r, fm, live).q);
  // device occlusion: regions cut to (almost) nothing carry no antegrade contrast at all
  const blockedQ = fm.regions.map((_, i) => (mods.occlusions?.length && restQ[i] > 0 && liveQ[i] < restQ[i] * BLOCKED_SHARE ? 1 : 0));
  const fsOf = (r: FlowRegion): number => {
    const fsm = mods.flowScale;
    if (!fsm) return 1;
    for (let k = r.path.length - 1; k >= 0; k--) {
      const x = fsm[r.path[k].vessel];
      if (x !== undefined && Number.isFinite(x)) return Math.max(0, x);
    }
    const own = fsm[r.vessel];
    return own !== undefined && Number.isFinite(own) ? Math.max(0, own) : 1;
  };
  const regionQ = fm.regions.map((r, i) => {
    let q = liveQ[i] * antegradeShare(r, fm.cfr, lesions, P.chronicAntegrade) * fsOf(r);
    let impaired = blockedQ[i] === 1;
    const nr = mods.noReflow;
    if (nr && regionBeyond(r, nr.vessel, nr.param)) {
      q *= Math.max(0, Math.min(1, nr.scale));
      impaired = true;
    }
    demand[r.side] += r.demand;
    if (impaired) impairedDemand[r.side] += r.demand;
    return q;
  });
  const byName = new Map(tree.vessels.map((v) => [v.name, v]));
  const vessels = new Map<string, VesselNet>();
  const rest = { left: 0, right: 0 };
  // parents before children: resolve recursively
  const visit = (v: TreeVessel): VesselNet => {
    const done = vessels.get(v.name);
    if (done) return done;
    const n = v.samples.length;
    const theta = new Float32Array(n);
    const q = new Float32Array(n);
    let t0 = 0;
    let share = 1;
    if (v.parent && byName.has(v.parent.name)) {
      const pn = visit(byName.get(v.parent.name)!);
      t0 = pn.theta[Math.min(pn.theta.length - 1, v.parent.index)];
      share = pn.share ?? 1;
    } else if (v.side === "right" && v.name === "LCx") {
      // an anomalous circumflex with its own ostium in the right sinus: filled, late and faint, by the sinus reflux of
      // a right injection
      t0 = SINUS_FED.delayS;
      share = SINUS_FED.share;
    }
    const prof = fm.vessels[v.name] ? vesselFlowProfile(fm, v.name, regionQ) : null;
    // samples whose downstream regions are all cut off by a device occlusion (and that carried flow at rest)
    const restProf = prof && blockedQ.some((x) => x) ? vesselFlowProfile(fm, v.name, restQ) : null;
    const openProf = restProf ? vesselFlowProfile(fm, v.name, restQ.map((x, i) => (blockedQ[i] ? 0 : x))) : null;
    theta[0] = t0;
    for (let i = 0; i < n; i++) q[i] = prof && prof.length === n ? prof[i] : 0;
    if (!prof && v.parent && byName.has(v.parent.name)) {
      // collateral channels (at their Werner grade's speed) and anything outside the flow map: fixed slow spread
      const speed = v.channel?.speedMmS ?? COLLATERAL_SPEED_MM_S;
      for (let i = 1; i < n; i++) theta[i] = Math.min(THETA_MAX_S, theta[i - 1] + (v.pathMm[i] - v.pathMm[i - 1]) / speed);
    } else {
      for (let i = 1; i < n; i++) {
        if (restProf && openProf && restProf[i] > 1e-6 && openProf[i] <= 1e-6) {
          theta[i] = THETA_MAX_S; // beyond an inflated balloon: no antegrade contrast
          continue;
        }
        const dl = Math.max(0, v.pathMm[i] - v.pathMm[i - 1]);
        const r = 0.5 * (v.radii[i] + v.radii[i - 1]);
        const area = Math.PI * r * r; // mm^2
        const flow = 0.5 * (q[i] + q[i - 1]) * 1000; // mm^3/s
        const u = Math.max(MIN_SPEED_MM_S, flow > 0 ? (gain * flow) / Math.max(area, 1e-3) : 0);
        theta[i] = Math.min(THETA_MAX_S, theta[i - 1] + dl / u);
      }
    }
    if (!v.parent || !byName.has(v.parent.name)) rest[v.side] += q[0];
    const out: VesselNet = { theta, q };
    if (share < 1) out.share = share;
    vessels.set(v.name, out);
    return out;
  };
  for (const v of tree.vessels) visit(v);
  const thetaMax = { left: 0.1, right: 0.1 };
  const ends: { left: number[]; right: number[] } = { left: [], right: [] };
  let sinks: TransportNet["sinks"];
  for (const v of tree.vessels) {
    const vn = vessels.get(v.name)!;
    const last = vn.theta[vn.theta.length - 1];
    // samples beyond an inflated balloon (THETA_MAX_S) never fill: keep them out of the grid and the blush input
    let open = last;
    for (let i = vn.theta.length - 1; i >= 0 && open >= THETA_MAX_S - 1e-3; i--) open = vn.theta[i];
    if (open < THETA_MAX_S - 1e-3) thetaMax[v.side] = Math.max(thetaMax[v.side], open);
    // a fistula ends in the pulmonary artery, not in arterioles: it feeds no blush
    if (v.name === FISTULA_NAME) {
      (sinks ??= []).push({ vessel: v.name, side: v.side, theta: last });
      continue;
    }
    if (v.kind !== "collateral" && last < THETA_MAX_S - 1e-3) ends[v.side].push(last);
  }
  const quant = (a: number[], q: number) => {
    if (!a.length) return 1;
    const s = [...a].sort((x, y) => x - y);
    return s[Math.min(s.length - 1, Math.floor(q * s.length))];
  };
  const med = (a: number[]) => quant(a, 0.5);
  const qs = (a: number[]) => [0.1, 0.3, 0.5, 0.7, 0.9].map((q) => quant(a, q));
  // a side without a modelled ostial flow (should not happen) gets the earlier model's nominal 1 mL/s
  if (rest.left <= 0) rest.left = 1;
  if (rest.right <= 0) rest.right = 1;
  const impaired = {
    left: demand.left > 0 ? impairedDemand.left / demand.left : 0,
    right: demand.right > 0 ? impairedDemand.right / demand.right : 0,
  };
  const lagMax = retroLags(tree, vessels);
  const net: TransportNet = { vessels, rest, thetaMax, thetaEnd: { left: med(ends.left), right: med(ends.right) }, thetaEndQ: { left: qs(ends.left), right: qs(ends.right) }, impaired, lagMax };
  if (sinks) net.sinks = sinks;
  if (m.size > 8) m.clear();
  m.set(key, net);
  return net;
}

/**
 * Lags of the retrograde filling (VesselNet.lag): each channel's entry is reached at the channel's last
 * transit time plus the entry's delay; from there contrast spreads both ways along each recipient vessel
 * and across its branch points at RETRO.spreadMmS, over the samples that can fill (from `retro.from`).
 * Returns the largest finite lag per donor side.
 */
function retroLags(tree: CoronaryTree, vessels: Map<string, VesselNet>): { left: number; right: number } {
  const max = { left: 0, right: 0 };
  const R = tree.vessels.filter((v) => v.retro);
  if (!R.length) return max;
  const speed = RETRO.spreadMmS;
  const lags = new Map<string, Float32Array>();
  for (const v of R) {
    const lag = new Float32Array(v.samples.length).fill(Infinity);
    for (const e of v.retro!.entries) {
      const ch = vessels.get(e.channel);
      if (!ch) continue;
      const t0 = ch.theta[ch.theta.length - 1] + v.retro!.delayS;
      if (!(t0 < THETA_MAX_S)) continue;
      let k = v.retro!.from;
      for (let i = v.retro!.from; i < v.samples.length; i++) if (Math.abs(v.pathMm[i] - e.entryMm) < Math.abs(v.pathMm[k] - e.entryMm)) k = i;
      lag[k] = Math.min(lag[k], t0);
    }
    lags.set(v.name, lag);
  }
  // relax along vessels and across branch points until nothing changes (the recipient bed is a tree)
  for (let pass = 0; pass < 64; pass++) {
    let changed = false;
    for (const v of R) {
      const lag = lags.get(v.name)!;
      const from = v.retro!.from;
      for (let i = from + 1; i < lag.length; i++) {
        const x = lag[i - 1] + Math.abs(v.pathMm[i] - v.pathMm[i - 1]) / speed;
        if (x < lag[i] - 1e-6) {
          lag[i] = x;
          changed = true;
        }
      }
      for (let i = lag.length - 2; i >= from; i--) {
        const x = lag[i + 1] + Math.abs(v.pathMm[i + 1] - v.pathMm[i]) / speed;
        if (x < lag[i] - 1e-6) {
          lag[i] = x;
          changed = true;
        }
      }
      const pl = v.parent ? lags.get(v.parent.name) : undefined;
      const pv = v.parent ? R.find((u) => u.name === v.parent!.name) : undefined;
      if (pl && pv && v.parent!.index >= pv.retro!.from && from === 0) {
        const j = v.parent!.index;
        if (pl[j] < lag[0] - 1e-6) {
          lag[0] = pl[j];
          changed = true;
        }
        if (lag[0] < pl[j] - 1e-6) {
          pl[j] = lag[0];
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  for (const v of R) {
    const lag = lags.get(v.name)!;
    const vn = vessels.get(v.name);
    if (vn) vn.lag = lag;
    for (const x of lag) if (Number.isFinite(x)) max[v.retro!.side] = Math.max(max[v.retro!.side], x);
  }
  return max;
}

/**
 * Share (0..1) of the engaged ostium's strength that reaches a vessel (VesselNet.share; 1 for a vessel the net does
 * not mark). The scene multiplies the vessel's concentration, ContrastField.at(theta), by it.
 */
export function inletShareOf(net: TransportNet, name: string): number {
  return net.vessels.get(name)?.share ?? 1;
}

/** Retrograde lag at each render-path sample (dense paths interpolate the base samples; Infinity where none fills). */
export function lagOnPath(net: TransportNet, v: TreeVessel, n: number, baseIndex?: number[]): Float32Array {
  const lag = net.vessels.get(v.name)?.lag;
  const out = new Float32Array(n).fill(Infinity);
  if (!lag) return out;
  const m = lag.length - 1;
  for (let i = 0; i < n; i++) {
    const x = Math.max(0, Math.min(m, baseIndex ? baseIndex[i] : i));
    const k = Math.min(Math.max(0, m - 1), Math.floor(x));
    const f = x - k;
    const a = lag[k],
      b = lag[Math.min(m, k + 1)];
    out[i] = Number.isFinite(a) && Number.isFinite(b) ? a * (1 - f) + b * f : f < 0.5 ? a : b;
  }
  return out;
}

/** Nominal transit time at each render-path sample (dense paths interpolate the base samples). */
export function thetaOnPath(net: TransportNet, v: TreeVessel, n: number, baseIndex?: number[]): Float32Array {
  const vn = net.vessels.get(v.name);
  const out = new Float32Array(n);
  if (!vn) return out.fill(THETA_MAX_S);
  if (!baseIndex) {
    out.set(vn.theta.subarray(0, Math.min(n, vn.theta.length)));
    return out;
  }
  const m = vn.theta.length - 1;
  for (let i = 0; i < n; i++) {
    const x = Math.max(0, Math.min(m, baseIndex[i]));
    const k = Math.min(m - 1, Math.floor(x));
    const f = x - k;
    out[i] = m <= 0 ? vn.theta[0] : vn.theta[k] * (1 - f) + vn.theta[k + 1] * f;
  }
  return out;
}

// ---------------------------------------------------------------------------
// ostial history and the strength field
// ---------------------------------------------------------------------------

export interface TransportInput {
  net: TransportNet;
  side: "left" | "right";
  trace: InjectionTrace;
  /** seconds since the press (trace time) */
  t: number;
  /** beat phase now (0..1) and RR (s): the past phases are counted back at this rate */
  phase: number;
  rr: number;
  /** native flow scale (1 normal; below 1 slow flow / no-reflow) */
  flowScale?: number;
  seat?: Seat;
}

export interface ContrastField {
  /** flow time now (s) */
  S: number;
  /** strength (fraction of full-strength contrast, 0..1) at nominal transit time theta */
  at(theta: number): number;
  /** patchiness multiplier for a parcel at theta in a vessel with this hash (1 = uniform) */
  streak(theta: number, hash: number): number;
  /**
   * Strength (0..1) of the ostial inlet delayed by `lag` seconds of flow time through collateral paths (plug
   * flow, dispersion RETRO.sigma0 + RETRO.kappa x lag, compact support so nothing arrives early). 0 for an
   * infinite lag. Computed on first use.
   */
  late(lag: number): number;
  /** Strength (0..1) of a slowly exchanging compartment beside the lumen at theta (a SCAD false lumen), time constant RETRO.retentionTauS. Computed on first use. */
  retained(theta: number): number;
  /** myocardial blush strength (0..1) */
  blush: number;
  /** sinus cloud strength (0..1 of full-strength contrast) */
  sinus: number;
  /** time (s since the press) the ostial strength first reached 10%, or null */
  arrival: number | null;
  /** push end (s since the press), or null while pushing */
  pushEnd: number | null;
  /** mean ostial strength over the push (0..1) */
  meanInlet: number;
  /** instantaneous values (now) */
  now: { qInj: number; qCoronary: number; qReflux: number; inlet: number };
  /** true while contrast is flowing out of the tip */
  injecting: boolean;
}

const N_THETA = 96;

/** erf-based normal CDF (Abramowitz-Stegun 7.1.26, |error| < 1.5e-7). */
export function normCdf(x: number): number {
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

/** Cross-section-averaged response at nominal transit time theta, flow-time lag tau, laminar share m. */
export function stepResponse(tau: number, theta: number, m: number, sigma0: number = DISPERSION.sigma0, kappa: number = DISPERSION.kappa): number {
  if (tau <= 0) return 0;
  const sigma = sigma0 + kappa * theta;
  const plug = normCdf((tau - theta) / sigma);
  const lam = tau > theta / 2 ? 1 - theta / (2 * tau) : 0;
  return (1 - m) * plug + m * lam;
}

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Smooth 1D value noise in [0, 1]. */
function vnoise(x: number, seed: number): number {
  const h = (i: number) => {
    const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return h(i) * (1 - u) + h(i + 1) * u;
}

/** The contrast strength field of one injection at time t. */
export function contrastField(inp: TransportInput): ContrastField {
  const { net, side, trace } = inp;
  const P = contrastTune();
  const seat = inp.seat ?? DEFAULT_SEAT;
  const cap = Math.max(0, Math.min(1, seat.capture));
  const seal = Math.max(0, Math.min(1, seat.seal));
  const fs = Math.max(0.02, inp.flowScale ?? 1);
  const qRest = net.rest[side];
  const rr = Math.max(0.25, inp.rr);
  const t = Math.max(0, inp.t);
  const nH = Math.max(1, Math.floor(t / HISTORY_DT) + 1);
  // ostial history on a uniform time grid
  const sArr = new Float32Array(nH + 1);
  const cArr = new Float32Array(nH + 1);
  const mArr = new Float32Array(nH + 1);
  const dArr = new Float32Array(nH + 1); // mixing deficiency 0..1
  let s = 0;
  let sinus = 0;
  let arrival: number | null = null;
  let inletSum = 0;
  let inletN = 0;
  let qInj = 0,
    qC = 0,
    qR = 0,
    inlet = 0;
  const kSinus = 1 - Math.exp(-HISTORY_DT / P.sinusTau);
  for (let k = 0; k <= nH; k++) {
    const tk = Math.min(t, k * HISTORY_DT);
    const ph = inp.phase - (t - tk) / rr;
    const qn = qRest * fs * phasicFlow(ph, side);
    const tip = traceAtTime(trace, tk);
    const qi = tip.q;
    const into = cap * qi;
    const qc = qn + seal * Math.max(0, into - qn);
    const f = qc > 1e-6 ? Math.min(1, into / qc) : into > 0 ? 1 : 0;
    const c = f * tip.c;
    const reflux = Math.max(0, qi - Math.min(into, qc));
    const mixQ = smoothstep(MIXING_JET.poor, MIXING_JET.full, qn > 1e-6 ? into / qn : 1);
    // flow time advances with the coronary flow (the step from k-1 to k)
    if (k > 0) s += (qc / qRest) * (tk - Math.min(t, (k - 1) * HISTORY_DT));
    sArr[k] = s;
    cArr[k] = c;
    dArr[k] = 1 - mixQ;
    mArr[k] = P.laminarMixed + (P.laminarWeak - P.laminarMixed) * (1 - mixQ);
    const sinTarget = reflux > 0 ? (tip.c * reflux) / (reflux + P.sinusMix) : 0;
    sinus += (sinTarget - sinus) * kSinus;
    if (arrival === null && c >= 0.1) arrival = tk;
    if (qi > 0.05) {
      inletSum += c;
      inletN++;
    }
    if (k === nH) {
      qInj = qi;
      qC = qc;
      qR = reflux;
      inlet = c;
    }
  }
  const S = s;
  // strength on a theta grid (quadratic spacing: fine near the ostium)
  const thMax = Math.max(0.2, net.thetaMax[side]);
  const grid = new Float32Array(N_THETA);
  const defic = new Float32Array(N_THETA);
  const thetaJ = (j: number) => thMax * ((j / (N_THETA - 1)) * (j / (N_THETA - 1)));
  // steps of the ostial strength (Duhamel)
  const steps: { s: number; dc: number; m: number }[] = [];
  let prev = 0;
  for (let k = 0; k <= nH; k++) {
    const dc = cArr[k] - prev;
    if (Math.abs(dc) > 1e-5) steps.push({ s: sArr[k], dc, m: mArr[k] });
    prev = cArr[k];
  }
  for (let j = 0; j < N_THETA; j++) {
    const th = thetaJ(j);
    let acc = 0;
    for (const st of steps) acc += st.dc * stepResponse(S - st.s, th, st.m, P.sigma0, P.kappa);
    grid[j] = Math.max(0, Math.min(1, acc));
    // mixing deficiency of the parcel now at theta: released at flow time S - theta
    const sRel = S - th;
    let lo = 0,
      hi = nH;
    if (sRel <= 0) defic[j] = dArr[0];
    else {
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (sArr[mid] <= sRel) lo = mid;
        else hi = mid;
      }
      defic[j] = dArr[lo];
    }
  }
  const lookup = (arr: Float32Array, theta: number) => {
    if (theta >= thMax) return arr[N_THETA - 1] * (theta > thMax * 1.05 ? 0 : 1);
    const x = Math.sqrt(Math.max(0, theta) / thMax) * (N_THETA - 1);
    const i = Math.min(N_THETA - 2, Math.floor(x));
    const f = x - i;
    return arr[i] * (1 - f) + arr[i + 1] * f;
  };
  // myocardial blush: arteriolar-end strength (spread over the terminal transit times) into a first-order
  // compartment cleared in flow time; slower with slow flow / no-reflow
  const thEnds = net.thetaEndQ[side];
  const tauM = P.blushTau / Math.min(1, fs);
  let blush = 0;
  for (const st of steps) {
    let g = 0;
    for (const th of thEnds) {
      const tau = S - st.s - th;
      if (tau > 0) g += 1 - Math.exp(-tau / tauM);
    }
    blush += (st.dc * g) / thEnds.length;
  }
  const last = trace.q.length ? trace.q[trace.q.length - 1] : 0;
  // collateral (late) and retention grids, built on first use: most scenes never ask
  const N_LATE = 128;
  const lagTop = Math.max(0.5, net.lagMax?.[side] ?? 0) + 0.5;
  let lateGrid: Float32Array | null = null;
  const late = (lag: number) => {
    if (!Number.isFinite(lag) || lag < 0) return 0;
    if (!lateGrid) {
      lateGrid = new Float32Array(N_LATE);
      for (let j = 0; j < N_LATE; j++) {
        const L = (lagTop * j) / (N_LATE - 1);
        const sg = RETRO.sigma0 + RETRO.kappa * L;
        let acc = 0;
        for (const st of steps) acc += st.dc * smoothstep(-2 * sg, 2 * sg, S - st.s - L);
        lateGrid[j] = Math.max(0, Math.min(1, acc));
      }
    }
    const x = Math.min(N_LATE - 1, (lag / lagTop) * (N_LATE - 1));
    const i = Math.min(N_LATE - 2, Math.floor(x));
    const f = x - i;
    return lateGrid[i] * (1 - f) + lateGrid[i + 1] * f;
  };
  let retGrid: Float32Array | null = null;
  const retained = (theta: number) => {
    if (!retGrid) {
      retGrid = new Float32Array(N_THETA);
      for (let j = 0; j < N_THETA; j++) {
        const th = thetaJ(j);
        let acc = 0;
        for (const st of steps) {
          const tau = S - st.s - th;
          if (tau > 0) acc += st.dc * (1 - Math.exp(-tau / RETRO.retentionTauS));
        }
        retGrid[j] = Math.max(0, Math.min(1, acc));
      }
    }
    return lookup(retGrid, theta);
  };
  return {
    S,
    at: (theta: number) => lookup(grid, theta),
    late,
    retained,
    streak: (theta: number, hash: number) => {
      const d = lookup(defic, theta);
      if (d < 0.02) return 1;
      return 1 - P.streak * d * vnoise((S - theta) * 3.5, hash);
    },
    blush: Math.max(0, Math.min(1, blush)),
    sinus: Math.max(0, Math.min(1, sinus)),
    arrival,
    pushEnd: trace.pushEnd,
    meanInlet: inletN ? inletSum / inletN : 0,
    now: { qInj, qCoronary: qC, qReflux: qR, inlet },
    injecting: qInj > 0.05 || (trace.pushEnd === null && last > 0.05 && t >= trace.pushStart),
  };
}

// ---------------------------------------------------------------------------
// The ostial mixing of one injection over its whole course (diag-injection-run-quality)
//
// The same mixing at the ostium as contrastField's step 1, tabulated from the press to the end of the
// trace, for judging a run after it (src/simulation/imaging/runQuality.ts): the strength entering the
// artery, how poorly the jet mixes, how much of the captured jet the coronary could not take and so
// spilled back into the sinus (reflux of a full artery), and how much missed the ostium (a side hole,
// a tip not seated). contrastField is unchanged; this adds no state to it.
// ---------------------------------------------------------------------------

/**
 * Side holes near the tip (data/catheters.ts catheterSideHoles): the share of the injected flow that leaves through
 * them into the aortic root instead of the end hole. The module text says side-hole catheters reduce the force of
 * the jet into the artery and let contrast escape into the aorta (pm-engaging, 07-engaging.ts; pm-acquiring-cine,
 * tips diag-acq-streaming-fill and diag-as-high-flow-fill; Brilakis 5.8, 6.6); the share is a MODEL PARAMETER.
 */
export const SIDE_HOLE_ESCAPE = 0.3;

/** The seat of a catheter with side holes: the share of the jet the ostium captures falls by SIDE_HOLE_ESCAPE. */
export function seatWithSideHoles(seat: Seat, sideHoles: boolean): Seat {
  return sideHoles ? { capture: seat.capture * (1 - SIDE_HOLE_ESCAPE), seal: seat.seal } : seat;
}

export interface OstialSeries {
  /** sample step (s) and the number of samples (time i x dt since the press) */
  dt: number;
  n: number;
  /** injected flow at the tip (mL/s) */
  qInj: Float32Array;
  /** strength of the injectate leaving the tip (0 saline .. 1 full-strength contrast: the lumen's old contents come first) */
  jet: Float32Array;
  /** native coronary flow (mL/s, phasic) */
  qNative: Float32Array;
  /** strength entering the artery (0..1 of full-strength contrast) */
  inlet: Float32Array;
  /** mixing deficiency of the jet (0 well mixed .. 1 poorly mixed: laminar streaming and streaks) */
  deficiency: Float32Array;
  /** captured jet the coronary could not take, spilling back from the ostium into the sinus (mL/s) */
  overflow: Float32Array;
  /** jet that missed the ostium (a tip not seated, side holes) (mL/s) */
  missed: Float32Array;
}

/**
 * The ostial mixing of an injection from the press to `tEnd` (default: the end of its trace), on the history grid
 * (HISTORY_DT), with contrastField's rules: native flow Q_rest x flowScale x phasicFlow at the beat phase counted
 * from `phase` at the press, capture and seal from the seat.
 */
export function ostialSeries(inp: Omit<TransportInput, "t"> & { tEnd?: number }): OstialSeries {
  const { net, side, trace } = inp;
  const seat = inp.seat ?? DEFAULT_SEAT;
  const cap = Math.max(0, Math.min(1, seat.capture));
  const seal = Math.max(0, Math.min(1, seat.seal));
  const fs = Math.max(0.02, inp.flowScale ?? 1);
  const qRest = net.rest[side];
  const rr = Math.max(0.25, inp.rr);
  const tEnd = Math.max(0, inp.tEnd ?? trace.q.length * trace.dt);
  const n = Math.max(1, Math.floor(tEnd / HISTORY_DT) + 1);
  const out: OstialSeries = {
    dt: HISTORY_DT,
    n,
    qInj: new Float32Array(n),
    jet: new Float32Array(n),
    qNative: new Float32Array(n),
    inlet: new Float32Array(n),
    deficiency: new Float32Array(n),
    overflow: new Float32Array(n),
    missed: new Float32Array(n),
  };
  for (let k = 0; k < n; k++) {
    const tk = k * HISTORY_DT;
    const tip = traceAtTime(trace, tk);
    const qn = qRest * fs * phasicFlow(inp.phase + tk / rr, side);
    const qi = tip.q;
    const into = cap * qi;
    const qc = qn + seal * Math.max(0, into - qn);
    const f = qc > 1e-6 ? Math.min(1, into / qc) : into > 0 ? 1 : 0;
    out.qInj[k] = qi;
    out.jet[k] = tip.c;
    out.qNative[k] = qn;
    out.inlet[k] = f * tip.c;
    out.deficiency[k] = 1 - smoothstep(MIXING_JET.poor, MIXING_JET.full, qn > 1e-6 ? into / qn : 1);
    out.overflow[k] = Math.max(0, into - qc);
    out.missed[k] = qi - into;
  }
  return out;
}

/** Flow and strength of a trace at time t since the press (0 before it, held while pushing past its end): contrastField's and ostialSeries's one sampling rule. */
function traceAtTime(trace: InjectionTrace, tk: number): { q: number; c: number } {
  const x = tk / trace.dt;
  const i = Math.floor(x);
  if (i < 0 || trace.q.length === 0) return { q: 0, c: 1 };
  if (i >= trace.q.length - 1) {
    const n = trace.q.length - 1;
    return { q: trace.pushEnd === null ? trace.q[n] : 0, c: trace.c[n] };
  }
  const f = x - i;
  return { q: trace.q[i] * (1 - f) + trace.q[i + 1] * f, c: trace.c[i] * (1 - f) + trace.c[i + 1] * f };
}

/** Stable small hash of a vessel name (streak pattern seed). */
export function vesselHash(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 37;
}

// ---------------------------------------------------------------------------
// Bypass grafts (diag-grafts-svg)
//
// A graft injection: contrast runs down the graft at the graft's own flow, enters the native vessel at the
// anastomosis and spreads from there through the native bed, antegrade beyond the anastomosis and retrograde towards
// the native ostium. With the native vessel occluded proximally the retrograde column reaches back to the occlusion;
// with the native vessel open, the native antegrade flow meets it a short way back (competitive flow), so only a
// short stretch fills. graftTransportNet() expresses all of this as a TransportNet of its own, so the scene draws a
// graft run with the same field code as a native run (thetaOnPath and contrastField): a vessel the graft does not
// reach is simply not in the net.
// A native injection with a patent graft: beyond the anastomosis the native column is diluted by the unopacified
// graft blood (competitive washout), the more the tighter the native vessel is upstream, and the graft back-fills from
// the anastomosis over a short distance (graftCompetition()). No source gives these quantities: every value below is
// a MODEL PARAMETER (docs/realism/facts/pkg-diag-grafts-svg.md); the module text names the phenomena (Oxford ch 7,
// complex-pci/05-prior-cabg.ts: washout beyond the anastomosis, back-filling of a graft on native injection,
// collateral filling, and the larger volumes and longer runs a graft needs).
// ---------------------------------------------------------------------------

/** Graft transport. MODEL PARAMETERS. */
export const GRAFT_FLOW = {
  /** resting flow of a patent vein graft (mL/s); a radial graft carries the same in this model */
  restMlS: 0.9,
  /** contrast speed through the native bed fed from the anastomosis, antegrade (mm/s) */
  nativeSpreadMmS: 110,
  /** retrograde spread from the anastomosis towards the native ostium (mm/s) */
  retroSpeedMmS: 70,
  /** with the native vessel open upstream, the retrograde column stops this far back from the anastomosis (mm) */
  competitiveRetroMm: 25,
  /** a chronic occlusion's cap, beyond the first occluded sample, that contrast from the graft does not enter (mm) */
  capMm: 10,
  /** competitive washout: the graft's share of the bed beyond the anastomosis rises from 0 at fromPct of native stenosis to maxShare at toPct */
  competition: { fromPct: 40, toPct: 90, maxShare: 0.6 },
  /** a diseased graft competes with this share of a patent graft's flow */
  diseasedShare: 0.6,
  /** back-filling of a patent graft on native injection: over this length from the anastomosis (mm), at this gain */
  backfill: { mm: 30, gain: 0.45 },
};

type Node2 = { v: number; i: number };

type Chain = { v: TreeVessel; join: number }[];
const chainCache = new WeakMap<CoronaryTree, Map<string, Chain>>();

/** Ancestry of a native vessel: the chain from the ostium vessel down to it, with each child's join index on its parent. Cached per tree. */
function chainOf(tree: CoronaryTree, v: TreeVessel): Chain {
  let m = chainCache.get(tree);
  if (!m) chainCache.set(tree, (m = new Map()));
  const hit = m.get(v.name);
  if (hit && hit[hit.length - 1]?.v === v) return hit;
  const byName = new Map(tree.vessels.map((x) => [x.name, x]));
  const out: Chain = [];
  let cur: TreeVessel | undefined = v;
  let join = Infinity;
  while (cur) {
    out.unshift({ v: cur, join });
    join = cur.parent?.index ?? 0;
    cur = cur.parent ? byName.get(cur.parent.name) : undefined;
  }
  // out[k].join: the index on out[k].v where the next vessel of the chain leaves (Infinity on the last)
  for (let k = 0; k < out.length - 1; k++) out[k].join = out[k + 1].v.parent!.index;
  m.set(v.name, out);
  return out;
}

/**
 * How much the live flow modifiers slow the native bed at sample i of `v` (1 unchanged, 0 no flow), with the rules
 * transportNet applies to a region: a no-reflow point's scale beyond it, and the patient's flow scale of the nearest
 * vessel on the path from the ostium that has one.
 */
function bedSlowing(tree: CoronaryTree, v: TreeVessel, i: number, mods: TransportMods): { k: number; noReflow: boolean } {
  const nr = mods.noReflow;
  const fsm = mods.flowScale;
  if (!nr && !fsm) return { k: 1, noReflow: false };
  const chain = chainOf(tree, v);
  let k = 1;
  let beyond = false;
  if (nr) {
    for (const { v: u, join } of chain) {
      if (u.name !== nr.vessel) continue;
      const at = u === v ? i : join;
      const p = u.param[Math.min(u.param.length - 1, at)] ?? 0;
      if (p >= nr.param - 1e-9) beyond = true;
    }
    if (beyond) k *= Math.max(0, Math.min(1, nr.scale));
  }
  if (fsm) {
    for (let j = chain.length - 1; j >= 0; j--) {
      const x = fsm[chain[j].v.name];
      if (x !== undefined && Number.isFinite(x)) {
        k *= Math.max(0, x);
        break;
      }
    }
  }
  return { k, noReflow: beyond };
}

/** The native vessel is open from its ostium to sample k of `v` (no occlusion upstream on the chain). */
function nativeOpenTo(tree: CoronaryTree, v: TreeVessel, k: number): boolean {
  const chain = chainOf(tree, v);
  for (const { v: u, join } of chain) {
    const upto = u === v ? k : join;
    if (u.occludedFrom >= 0 && u.occludedFrom <= upto) return false;
  }
  return true;
}

/** Worst native stenosis (% diameter) on the path from the ostium to sample k of `v`. */
function nativeSeverityTo(tree: CoronaryTree, v: TreeVessel, k: number, lesions: readonly Lesion[]): number {
  let worst = 0;
  for (const { v: u, join } of chainOf(tree, v)) {
    if (!u.lesionId) continue;
    const upto = u.param[Math.min(u.param.length - 1, u === v ? k : join)] ?? 1;
    for (const l of lesions) if (l.vessel === u.lesionId && l.position <= upto + 1e-6) worst = Math.max(worst, l.severity);
  }
  return worst;
}

/** Nominal transit along a graft at its flow qMlS (s), THETA_MAX_S beyond an occluded graft's stump. */
function graftTheta(g: TreeVessel, gain: number, qMlS: number): Float32Array {
  const n = g.samples.length;
  const th = new Float32Array(n);
  const q = qMlS * 1000;
  for (let i = 1; i < n; i++) {
    if (g.occludedFrom >= 0 && i >= g.occludedFrom) {
      th[i] = THETA_MAX_S;
      continue;
    }
    const r = 0.5 * (g.radii[i] + g.radii[i - 1]);
    const u = Math.max(MIN_SPEED_MM_S, (gain * q) / Math.max(Math.PI * r * r, 1e-3));
    th[i] = Math.min(THETA_MAX_S, th[i - 1] + Math.max(0, g.pathMm[i] - g.pathMm[i - 1]) / u);
  }
  return th;
}

const graftNetCache = new WeakMap<CoronaryTree, Map<string, TransportNet | null>>();

/**
 * The transport network of an injection into a graft (by its tree name): the graft at its own flow and the native bed
 * it reaches through the anastomosis. Null when the tree has no such graft. An occluded graft fills only its stump.
 * A diseased graft carries GRAFT_FLOW.diseasedShare of a patent graft's flow. The live flow modifiers act as they do
 * on a native run (transportNet): no-reflow slows the bed beyond its point (and the graft's own flow, when the whole
 * bed beyond the anastomosis lies beyond it), and the patient's flow scale slows or speeds both. Device occlusions
 * and hyperaemia are not applied to a graft run (intervention in a graft is pci-graft's).
 */
export function graftTransportNet(tree: CoronaryTree, graftName: string, mods: TransportMods = {}): TransportNet | null {
  let cache = graftNetCache.get(tree);
  if (!cache) graftNetCache.set(tree, (cache = new Map()));
  const gain = contrastTune().transitGain;
  const live: TransportMods = {};
  if (mods.noReflow) live.noReflow = mods.noReflow;
  if (mods.flowScale) live.flowScale = mods.flowScale;
  const key = graftName + "|" + gain + (live.noReflow || live.flowScale ? "|" + JSON.stringify(live) : "");
  if (cache.has(key)) return cache.get(key)!;
  if (cache.size > 16) cache.clear();
  const g = tree.grafts?.find((x) => x.name === graftName);
  if (!g) {
    cache.set(key, null);
    return null;
  }
  const occluded = g.occludedFrom >= 0;
  const tv = tree.vessels.find((v) => v.name === g.graft.anastomosis.vessel);
  const kA = tv ? Math.min(tv.samples.length - 1, g.graft.anastomosis.index) : 0;
  // the graft's own flow: a diseased graft carries less; the bed beyond the anastomosis limits it (no-reflow there, the
  // patient's flow scale of the graft or else of its target)
  let gq = GRAFT_FLOW.restMlS * (g.graft.status === "diseased" ? GRAFT_FLOW.diseasedShare : 1);
  if (tv) {
    const ownFs = live.flowScale?.[g.name];
    const bed = bedSlowing(tree, tv, kA, ownFs !== undefined && Number.isFinite(ownFs) ? { noReflow: live.noReflow } : live);
    gq *= bed.k * (ownFs !== undefined && Number.isFinite(ownFs) ? Math.max(0, ownFs) : 1);
  }
  const vessels = new Map<string, VesselNet>();
  const gth = graftTheta(g, gain, gq);
  vessels.set(g.name, { theta: gth, q: new Float32Array(g.samples.length).fill(gq) });
  const ends: number[] = [];
  let endsSlowed = 0;
  let thMax = 0.1;
  for (const x of gth) if (x < THETA_MAX_S - 1e-3) thMax = Math.max(thMax, x);
  if (!occluded && tv) {
    const k = kA;
    const t0 = gth[gth.length - 1];
    const open = nativeOpenTo(tree, tv, k);
    const list = tree.vessels.filter((v) => v.kind !== "collateral");
    const idx = new Map(list.map((v, i) => [v.name, i]));
    // double precision while searching (a float32 store would round the queued times below their own entries)
    const theta = list.map((v) => new Float64Array(v.samples.length).fill(THETA_MAX_S));
    const kids = new Map<number, { child: number; at: number }[]>();
    list.forEach((v, ci) => {
      if (!v.parent) return;
      const pi = idx.get(v.parent.name);
      if (pi === undefined) return;
      const a = kids.get(pi) ?? [];
      a.push({ child: ci, at: v.parent.index });
      kids.set(pi, a);
    });
    // samples contrast from the graft cannot enter: inside an occlusion's cap
    const blocked = (v: TreeVessel, i: number) => v.occludedFrom > 0 && i >= v.occludedFrom && v.pathMm[i] < v.pathMm[v.occludedFrom] + GRAFT_FLOW.capMm;
    // with the native vessel open, the retrograde column goes no further back (in path distance from the ostium) than this
    const retroFloor = open ? tv.pathMm[k] - GRAFT_FLOW.competitiveRetroMm : -Infinity;
    // Dijkstra over (vessel, sample) from the anastomosis
    const heap: { t: number; n: Node2 }[] = [];
    const push = (t: number, n: Node2) => {
      heap.push({ t, n });
      let c = heap.length - 1;
      while (c > 0) {
        const p = (c - 1) >> 1;
        if (heap[p].t <= heap[c].t) break;
        [heap[p], heap[c]] = [heap[c], heap[p]];
        c = p;
      }
    };
    const pop = () => {
      const top = heap[0];
      const last = heap.pop()!;
      if (heap.length) {
        heap[0] = last;
        let c = 0;
        for (;;) {
          const l = 2 * c + 1,
            r = l + 1;
          let m = c;
          if (l < heap.length && heap[l].t < heap[m].t) m = l;
          if (r < heap.length && heap[r].t < heap[m].t) m = r;
          if (m === c) break;
          [heap[m], heap[c]] = [heap[c], heap[m]];
          c = m;
        }
      }
      return top;
    };
    // the live modifiers' slowing of each native sample (1 without modifiers)
    const slowed = live.noReflow || live.flowScale;
    const slow = list.map((v) => {
      if (!slowed) return null;
      const a = new Float64Array(v.samples.length);
      for (let i = 0; i < a.length; i++) a[i] = bedSlowing(tree, v, i, live).k;
      return a;
    });
    const relax = (vi: number, i: number, t: number, retro: boolean) => {
      const v = list[vi];
      if (i < 0 || i >= v.samples.length || blocked(v, i)) return;
      if (retro && v.pathMm[i] < retroFloor) return;
      if (t >= theta[vi][i] - 1e-9 || t >= THETA_MAX_S) return;
      theta[vi][i] = t;
      push(t, { v: vi, i });
    };
    /** transit over dl mm at speed u into sample i of vessel vi, slowed by the live modifiers there */
    const dt = (vi: number, i: number, dl: number, u: number) => {
      const f = slow[vi]?.[i] ?? 1;
      return f > 1e-6 ? dl / (u * f) : THETA_MAX_S;
    };
    const tvi = idx.get(tv.name)!;
    relax(tvi, k, t0, false);
    const ant = GRAFT_FLOW.nativeSpreadMmS,
      ret = GRAFT_FLOW.retroSpeedMmS;
    while (heap.length) {
      const { t, n } = pop();
      if (t > theta[n.v][n.i] + 1e-9) continue;
      const v = list[n.v];
      const i = n.i;
      // along the vessel: distal is antegrade, proximal retrograde (never back across an occlusion's cap)
      if (i + 1 < v.samples.length) relax(n.v, i + 1, t + dt(n.v, i + 1, Math.abs(v.pathMm[i + 1] - v.pathMm[i]), ant), false);
      if (i > 0 && !(v.occludedFrom > 0 && i === v.occludedFrom)) relax(n.v, i - 1, t + dt(n.v, i - 1, Math.abs(v.pathMm[i] - v.pathMm[i - 1]), ret), true);
      // into the branches leaving here (antegrade), and from a branch's origin back into its parent (retrograde)
      for (const kd of kids.get(n.v) ?? []) if (kd.at === i) relax(kd.child, 0, t, false);
      if (i === 0 && v.parent) {
        const pi = idx.get(v.parent.name);
        if (pi !== undefined) relax(pi, v.parent.index, t, true);
      }
    }
    list.forEach((v, vi) => {
      const th = theta[vi];
      let any = false;
      for (const x of th) if (x < THETA_MAX_S - 1e-3) {
        any = true;
        thMax = Math.max(thMax, x);
      }
      if (!any) return;
      vessels.set(v.name, { theta: Float32Array.from(th), q: new Float32Array(v.samples.length) });
      const last = th[th.length - 1];
      if (last < THETA_MAX_S - 1e-3 && !(kids.get(vi)?.length)) {
        ends.push(last);
        if (live.noReflow && bedSlowing(tree, v, th.length - 1, { noReflow: live.noReflow }).noReflow) endsSlowed++;
      }
    });
  }
  const sorted = [...ends].sort((a, b) => a - b);
  const quant = (q: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : thMax);
  const qs = [0.1, 0.3, 0.5, 0.7, 0.9].map(quant);
  const rest = { left: Math.max(gq, 1e-3), right: Math.max(gq, 1e-3) };
  // the share of the bed's ends that no-reflow slows (the blush, as on a native run)
  const imp = ends.length ? endsSlowed / ends.length : 0;
  const net: TransportNet = {
    vessels,
    rest,
    thetaMax: { left: thMax, right: thMax },
    thetaEnd: { left: quant(0.5), right: quant(0.5) },
    thetaEndQ: { left: qs, right: qs },
    impaired: { left: imp, right: imp },
    lagMax: { left: 0, right: 0 },
  };
  cache.set(key, net);
  return net;
}

/** The native bed beyond one patent graft's anastomosis, and what a native injection does there. */
export interface GraftCompetition {
  graft: string;
  side: "left" | "right";
  /** the graft's share of the flow beyond the anastomosis (0 none .. GRAFT_FLOW.competition.maxShare) */
  share: number;
  /** the native samples that the graft's flow dilutes: per vessel name, the first base sample index */
  washout: Map<string, number>;
  /** back-filling of the graft on native injection: nominal transit (native flow time) per graft sample, THETA_MAX_S where it does not fill, and its gain */
  backfill: { theta: Float32Array; gain: number } | null;
}

/**
 * What every graft that is not occluded does to a native injection on its side (competitive flow): washout beyond the
 * anastomosis, and back-filling of the graft from it. A graft whose native vessel is occluded upstream competes with
 * nothing (no native contrast reaches the anastomosis).
 */
export function graftCompetition(tree: CoronaryTree, net: TransportNet, lesions: readonly Lesion[]): GraftCompetition[] {
  // memoised: the scene asks for it on every frame of a native run, and the net is itself cached per tree, lesions and mods
  let byLesions = competitionCache.get(net);
  if (!byLesions) competitionCache.set(net, (byLesions = new WeakMap()));
  const hit = byLesions.get(lesions);
  if (hit && hit.tree === tree) return hit.out;
  const out = graftCompetitionOf(tree, net, lesions);
  byLesions.set(lesions, { tree, out });
  return out;
}

const competitionCache = new WeakMap<TransportNet, WeakMap<readonly Lesion[], { tree: CoronaryTree; out: GraftCompetition[] }>>();

function graftCompetitionOf(tree: CoronaryTree, net: TransportNet, lesions: readonly Lesion[]): GraftCompetition[] {
  const out: GraftCompetition[] = [];
  for (const g of tree.grafts ?? []) {
    if (g.occludedFrom >= 0) continue;
    const tv = tree.vessels.find((v) => v.name === g.graft.anastomosis.vessel);
    if (!tv) continue;
    const k = Math.min(tv.samples.length - 1, g.graft.anastomosis.index);
    if (!nativeOpenTo(tree, tv, k)) continue;
    const sev = nativeSeverityTo(tree, tv, k, lesions);
    const C = GRAFT_FLOW.competition;
    const x = Math.max(0, Math.min(1, (sev - C.fromPct) / (C.toPct - C.fromPct)));
    const share = C.maxShare * x * x * (3 - 2 * x) * (g.graft.status === "diseased" ? GRAFT_FLOW.diseasedShare : 1);
    const washout = new Map<string, number>();
    if (share > 0) {
      washout.set(tv.name, k);
      // every vessel descending from the target beyond the anastomosis
      let grew = true;
      while (grew) {
        grew = false;
        for (const v of tree.vessels) {
          if (washout.has(v.name) || !v.parent || v.kind === "collateral") continue;
          const from = washout.get(v.parent.name);
          if (from !== undefined && v.parent.index >= from) {
            washout.set(v.name, 0);
            grew = true;
          }
        }
      }
    }
    // back-filling of the graft from the anastomosis (native flow time at the anastomosis, then retrograde up the graft)
    const vn = net.vessels.get(tv.name);
    let backfill: GraftCompetition["backfill"] = null;
    if (vn) {
      const n = g.samples.length;
      const th = new Float32Array(n).fill(THETA_MAX_S);
      const L = g.pathMm[n - 1];
      const t0 = vn.theta[k];
      for (let i = 0; i < n; i++) {
        const back = L - g.pathMm[i];
        if (back <= GRAFT_FLOW.backfill.mm) th[i] = Math.min(THETA_MAX_S, t0 + back / GRAFT_FLOW.retroSpeedMmS);
      }
      backfill = { theta: th, gain: GRAFT_FLOW.backfill.gain * (1 - share) };
    }
    out.push({ graft: g.name, side: g.side, share, washout, backfill });
  }
  return out;
}
