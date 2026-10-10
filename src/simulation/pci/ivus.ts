// ---------------------------------------------------------------------------
// The one intravascular imaging frame generator, for the PCI lab and the IVUS
// and OCT bench (pci-bench-imaging-unify; it ends the bench's separate IVUS
// engine, HANDOVER 6.5).
//
// At a position along the vessel (mm from the proximal end) the frame carries:
// the lumen (the native radius, eccentric within the plaque), the external
// elastic membrane (from the plaque-burden profile when the lesion gives one,
// otherwise the healthy reference radius scaled by the background plaque
// burden of a "normal" reference segment), the calcium arc with its
// thickness, the lipid pool with its cap, thrombus with its type, a side-branch
// ostium, stent struts of every stent layer with their apposition from the
// procedural stent geometry, the guidewire with its acoustic shadow and a
// dissection flap. The modality decides what can be measured: OCT measures
// calcium thickness and the fibrous cap, IVUS cannot see through calcium (the
// acoustic shadow), so its frames report neither (null).
// Measurements (lumen and EEM areas, plaque burden, MSA, expansion,
// malapposition, landing zones) are computed from that geometry and judged by
// the shared EAPCI criteria (src/simulation/imaging/criteria.ts, SIM_FACTS §12).
// The motorised pullback runs at a constant speed; the transducer is a
// visible marker on fluoroscopy and co-registers like the pressure wire.
//
// The PCI lab's calcium grade (0, 1, 2) and lipid flag still work: normaliseLesion
// maps them onto a deposit and a pool, so angioPci.ts compiles unchanged.
// Stent rings are circles about the native lumen's centre, so a strut's gap to
// the wall is the native lumen radius minus the ring radius, the concentric
// apposition (lumen - d) / 2 that pciBench.deploy() measures; the stented lumen
// is the larger of the native lumen and the largest ring.
// MODEL PARAMETERS: background plaque burden, lumen eccentricity, pullback
// speed, the calcium arc and thickness for each calcium grade, the lipid arc of
// the lipid flag, the depth of calcium within the plaque, the depth of tissue
// each modality images (within the ranges of src/content/manual/pci-manual/15-imaging.ts).
// ---------------------------------------------------------------------------

import type { StentGeom } from "./stentGeometry";
import type { Calcium, ImagingCriterion, ImagingLesion, ImagingSideBranch, LipidPool, Modality, ThrombusType } from "../imaging/types";
import { EXPANSION_MIN_PCT, msaTarget, optimisationCriteria } from "../imaging/criteria";

export type { Calcium, ImagingLesion, LipidPool, Modality, ThrombusType } from "../imaging/types";

/** Background plaque burden of angiographically normal reference segments — MODEL PARAMETER. */
export const MP_PB_BACKGROUND = 0.35;
/** Lumen eccentricity within the plaque (fraction of the plaque thickness) — MODEL PARAMETER. */
export const MP_ECCENTRICITY = 0.45;
/** Motorised pullback speed (mm/s) — MODEL PARAMETER. */
export const MP_PULLBACK_MM_S = 0.5;
/** Calcium arc by grade (deg) — MODEL PARAMETER. */
export const MP_CALCIUM_ARC: Record<0 | 1 | 2, number> = { 0: 0, 1: 120, 2: 270 };
/** Calcium thickness by grade (mm), for OCT frames of the PCI lab's graded lesions — MODEL PARAMETER. */
export const MP_CALCIUM_THICKNESS: Record<0 | 1 | 2, number> = { 0: 0, 1: 0.4, 2: 0.8 };
/** Arc of the lipid pool of the PCI lab's lipid flag (deg; ±1.2 rad, as before) — MODEL PARAMETER. */
export const MP_LIPID_ARC_DEG = (2.4 * 180) / Math.PI;
/** Depth of the calcium's leading edge within the plaque (fraction of the plaque thickness) — MODEL PARAMETER. */
export const MP_CALCIUM_DEPTH = 0.25;
/**
 * Depth of tissue imaged beyond the lumen (mm) — MODEL PARAMETER, within the module's tissue penetration
 * of 4 to 8 mm for IVUS and 2 to 3.5 mm for OCT (Oxford, src/content/manual/pci-manual/15-imaging.ts).
 */
export const MP_PENETRATION_MM: Record<Modality, number> = { IVUS: 5, OCT: 2.5 };
/**
 * Calcium arc (deg) beyond which an IVUS frame does not show the EEM — MODEL PARAMETER. The module teaches that
 * IVUS shows only calcium's leading edge and the shadow behind it (src/content/manual/pci-manual/15-imaging.ts);
 * it gives no arc at which the EEM can no longer be traced, so the bench takes more than half the circumference.
 */
export const MP_IVUS_EEM_HIDDEN_ARC_DEG = 180;

export interface IvusStentLayer {
  fromMm: number;
  toMm: number;
  geom: StentGeom;
}

export interface IvusContext {
  /** current native lumen radius and reference (healthy) lumen radius at a position (mm) */
  lumenR: (mm: number) => number;
  refR: (mm: number) => number;
  /** the diseased segment: extent, plaque-burden profile, calcium, lipid, thrombus */
  lesion: ImagingLesion;
  /** stents in deployment order (later stents are inner layers) */
  stents: IvusStentLayer[];
  dissections: { fromMm: number; toMm: number; arcDeg: number }[];
  thrombus: { fromMm: number; toMm: number; type?: ThrombusType }[];
  /** side branches leaving the imaged segment */
  sideBranches?: ImagingSideBranch[];
  /** the imaging modality (default IVUS) */
  modality?: Modality;
  /** angle of the plaque's thickest part and of the wire (rad) */
  plaqueAngle: number;
  wireAngle: number;
}

export interface IvusStrut {
  theta: number;
  r: number;
  /** distance from the strut to the wall behind it (mm), 0 when apposed */
  gapMm: number;
  /** stent layer (0 = first stent deployed, the outermost) */
  layer: number;
}

export interface IvusFrame {
  mm: number;
  modality: Modality;
  /** radius of the lumen and of the EEM per angle (mm), about the EEM centre */
  theta: number[];
  lumen: number[];
  eem: number[];
  /** calcium arc (rad) at the depth r of its leading edge; thickness only on OCT (IVUS: null, acoustic shadow) */
  calcium: { from: number; to: number; r: number; arcDeg: number; thicknessMm: number | null; nodule: boolean } | null;
  /** lipid pool arc (rad); the cap thickness only on OCT and only where the scenario states it */
  lipid: { from: number; to: number; capUm: number | null } | null;
  struts: IvusStrut[];
  /** number of stent layers at this position */
  stentLayers: number;
  wire: { theta: number; r: number };
  flap: { from: number; to: number; r: number } | null;
  thrombus: boolean;
  thrombusType: ThrombusType | null;
  /** a side-branch ostium at this position: its direction and half-width (rad) */
  sideBranch: { theta: number; halfWidth: number } | null;
  areas: { lumen: number; eem: number; plaqueBurden: number; stent: number | null };
  /**
   * What the in-lab acquisition did to this frame (pci-intravascular-imaging): absent on bench and
   * geometry frames, which are always clean. See acquisitionArtefacts.
   */
  artefacts?: FrameArtefacts;
}

/** Area of a polar outline (mm²). */
export function polarArea(r: number[]): number {
  const n = r.length;
  let a = 0;
  for (let i = 0; i < n; i++) a += 0.5 * r[i] * r[(i + 1) % n] * Math.sin((2 * Math.PI) / n);
  return a;
}

/** The deposit, the pool and how the calcium is profiled along its length. */
interface NormLesion {
  startMm: number;
  endMm: number;
  pb?: (mm: number) => number;
  calcium: (Calcium & { uniform: boolean }) | null;
  lipid: LipidPool | null;
  thrombus: ThrombusType | null;
}

/**
 * Map the lesion onto one description: a calcium grade becomes a deposit over the whole lesion with
 * the grade's arc and thickness at every position (uniform, as the PCI lab drew it), and the lipid flag
 * a pool with the flag's arc and no stated cap.
 */
export function normaliseLesion(l: ImagingLesion): NormLesion {
  const len = Math.max(0, l.endMm - l.startMm);
  let calcium: NormLesion["calcium"] = null;
  if (typeof l.calcium === "number") {
    if (l.calcium > 0) calcium = { startMm: l.startMm, lengthMm: len, arcDeg: MP_CALCIUM_ARC[l.calcium], thicknessMm: MP_CALCIUM_THICKNESS[l.calcium], uniform: true };
  } else if (l.calcium && l.calcium.arcDeg > 0) calcium = { ...l.calcium, uniform: false };
  const lipid = typeof l.lipid === "boolean" ? (l.lipid ? { arcDeg: MP_LIPID_ARC_DEG } : null) : l.lipid && l.lipid.arcDeg > 0 ? l.lipid : null;
  return { startMm: l.startMm, endMm: l.endMm, pb: l.pb, calcium, lipid, thrombus: l.thrombus ?? null };
}

/**
 * Arc (deg) and thickness (mm) of a deposit at a position, or null outside it: fuller in the middle of
 * the deposit (55% of the arc and 60% of the thickness at its ends) unless it is uniform. The bench's
 * calciumAt is this function.
 */
export function calciumProfileAt(c: Calcium & { uniform?: boolean }, mm: number): { arc: number; thickness: number } | null {
  if (mm < c.startMm || mm > c.startMm + c.lengthMm) return null;
  if (c.uniform) return { arc: c.arcDeg, thickness: c.thicknessMm };
  const f = c.lengthMm > 0 ? Math.sin((Math.PI * (mm - c.startMm)) / c.lengthMm) : 1;
  return { arc: c.arcDeg * (0.55 + 0.45 * f), thickness: c.thicknessMm * (0.6 + 0.4 * f) };
}

/** Ring of a stent at a position along it (nearest ring when the position falls in a gap); pciBench.deploy() reads its malapposition through it. */
export function stentRingAt(st: IvusStentLayer, mm: number) {
  const s = mm - st.fromMm;
  for (const r of st.geom.rings) if (s >= r.s0 - 0.15 && s <= r.s0 + r.len + 0.15) return r;
  if (!st.geom.rings.length) return null;
  return st.geom.rings.reduce((a, b) => (Math.abs(b.s0 - s) < Math.abs(a.s0 - s) ? b : a));
}

/** Distance from the EEM centre to an eccentric lumen circle along angle th. */
function rayToCircle(th: number, cx: number, cy: number, r: number): number {
  const dx = Math.cos(th),
    dy = Math.sin(th);
  const b = dx * cx + dy * cy;
  const c = cx * cx + cy * cy - r * r;
  return b + Math.sqrt(Math.max(0, b * b - c));
}

/** One frame at position `mm`. */
export function ivusFrame(ctx: IvusContext, mm: number, n = 72): IvusFrame {
  const modality: Modality = ctx.modality ?? "IVUS";
  const les = normaliseLesion(ctx.lesion);
  const lumR = ctx.lumenR(mm);
  const pbHere = les.pb ? Math.min(0.97, Math.max(0, les.pb(mm))) : null;
  const eemR = pbHere !== null ? lumR / Math.sqrt(1 - pbHere) : ctx.refR(mm) / Math.sqrt(1 - MP_PB_BACKGROUND);
  // stented segments: every layer's struts; the lumen is the largest ring (a later, smaller layer sits
  // inside an earlier, larger one), or the native lumen where that is larger
  const layers = ctx.stents.map((s, i) => ({ s, i })).filter(({ s }) => mm >= s.fromMm && mm <= s.toMm);
  const rings = layers.map(({ s, i }) => ({ s, i, ring: stentRingAt(s, mm) })).filter((x) => x.ring);
  const stentR = rings.length ? Math.max(...rings.map((x) => x.ring!.d / 2)) : null;
  // eccentric lumen: centre offset towards the thin side of the plaque
  const plaqueT = Math.max(0, eemR - lumR);
  // the EEM centre stays inside the lumen (the transducer sits in the lumen)
  const off = Math.min(MP_ECCENTRICITY * plaqueT, 0.8 * lumR);
  // a stent larger than the native lumen compresses the plaque: the stented lumen (and its rings) sits
  // less eccentrically, so it stays within the EEM; a smaller stent sits about the native lumen's centre
  const lumOut = stentR !== null ? Math.max(lumR, stentR) : lumR;
  const offS = Math.min(off, MP_ECCENTRICITY * Math.max(0, eemR - lumOut));
  const cx = -offS * Math.cos(ctx.plaqueAngle),
    cy = -offS * Math.sin(ctx.plaqueAngle);
  const theta: number[] = [];
  const lumen: number[] = [];
  const eem: number[] = [];
  for (let i = 0; i < n; i++) {
    const th = (2 * Math.PI * i) / n;
    theta.push(th);
    eem.push(eemR);
    // the stent rings are concentric with the lumen
    const r = rayToCircle(th, cx, cy, lumOut);
    lumen.push(Math.min(eemR * 0.995, r));
  }
  const inLesion = mm >= les.startMm && mm <= les.endMm;
  const ca = les.calcium ? calciumProfileAt(les.calcium, mm) : null;
  const arc = ca ? (ca.arc * Math.PI) / 180 : 0;
  const caR = lumR + MP_CALCIUM_DEPTH * plaqueT;
  const calcium =
    ca && arc > 0
      ? {
          from: ctx.plaqueAngle - arc / 2,
          to: ctx.plaqueAngle + arc / 2,
          r: caR,
          arcDeg: ca.arc,
          // OCT measures the deposit's thickness (within the vessel wall); IVUS cannot see behind its leading edge
          thicknessMm: modality === "OCT" ? Math.min(ca.thickness, Math.max(0.05, eemR + 0.3 - caR)) : null,
          nodule: !!les.calcium?.nodule,
        }
      : null;
  const lipArc = les.lipid ? (les.lipid.arcDeg * Math.PI) / 180 : 0;
  const lipid = inLesion && les.lipid ? { from: ctx.plaqueAngle - lipArc / 2, to: ctx.plaqueAngle + lipArc / 2, capUm: modality === "OCT" && les.lipid.capUm !== undefined ? les.lipid.capUm : null } : null;
  const struts: IvusStrut[] = [];
  for (const { s, i, ring } of rings) {
    const k = 2 * s.geom.crowns;
    const rr = ring!.d / 2;
    // the wall behind a ring: the native lumen, or an earlier (outer) layer that is larger
    const wall = Math.max(lumR, ...rings.filter((o) => o.i < i).map((o) => o.ring!.d / 2));
    const gapMm = Math.max(0, wall - rr);
    for (let j = 0; j < k; j++) {
      const a = ring!.phase + (2 * Math.PI * j) / k;
      // on a circle about the native lumen's centre, given in polar form about the EEM centre
      const px = cx + rr * Math.cos(a),
        py = cy + rr * Math.sin(a);
      struts.push({ theta: Math.atan2(py, px), r: Math.hypot(px, py), gapMm, layer: i });
    }
  }
  const dis = ctx.dissections.find((d) => mm >= d.fromMm && mm <= d.toMm) ?? null;
  const flapArc = dis ? (dis.arcDeg * Math.PI) / 180 : 0;
  const flap = dis ? { from: ctx.plaqueAngle + 0.5 - flapArc / 2, to: ctx.plaqueAngle + 0.5 + flapArc / 2, r: lumR * 0.85 } : null;
  const thr = ctx.thrombus.find((t) => mm >= t.fromMm && mm <= t.toMm) ?? null;
  const lesionThrombus = inLesion && les.thrombus ? les.thrombus : null;
  const thrombus = !!thr || !!lesionThrombus;
  const thrombusType: ThrombusType | null = thrombus ? thr?.type ?? lesionThrombus ?? "red" : null;
  const sb = (ctx.sideBranches ?? []).find((b) => Math.abs(mm - b.atMm) <= b.diameterMm / 2) ?? null;
  const sideBranch = sb ? { theta: sb.angle, halfWidth: Math.min(Math.PI / 2, Math.asin(Math.min(1, sb.diameterMm / 2 / Math.max(eemR, sb.diameterMm / 2)))) } : null;
  const la = polarArea(lumen);
  const ea = Math.PI * eemR * eemR;
  return {
    mm,
    modality,
    theta,
    lumen,
    eem,
    calcium,
    lipid,
    struts,
    stentLayers: rings.length,
    wire: { theta: ctx.wireAngle, r: Math.max(0.2, Math.min(...lumen) * 0.7) },
    flap,
    thrombus,
    thrombusType,
    sideBranch,
    areas: { lumen: la, eem: ea, plaqueBurden: 1 - la / ea, stent: stentR !== null ? Math.PI * stentR * stentR : null },
  };
}

export interface IvusSummary {
  mla: number;
  mlaAt: number;
  proxRefLumen: number;
  distRefLumen: number;
  proxRefEem: number;
  distRefEem: number;
  /** nearest positions either side of the MLA where plaque burden falls below 50% */
  landingProx: number;
  landingDist: number;
  /** stent measures, when a stent is present */
  msa: number | null;
  msaAt: number | null;
  expansionPct: number | null;
  maxMalappositionMm: number | null;
  /** plaque burden at the newest stent's edges within the run, when a stent is present */
  proxEdgePb: number | null;
  distEdgePb: number | null;
  /** the shared EAPCI criteria on the stent measures, when a stent is present */
  criteria: ImagingCriterion[] | null;
}

export interface IvusSummaryOptions {
  leftMain?: boolean;
  /**
   * How expansion is taken (criteria.ts): "mean" (default), the MSA over the mean of the proximal and
   * distal reference lumen areas at the ends of the run (EAPCI 2018, SIM_FACTS §12); "halves", each half
   * of the newest stent against its nearest reference (the largest native lumen within 10 mm outside that
   * edge), the bench's ILUMIEN-style definition, so that pciBench.deploy() and the frames give one verdict.
   */
  expansion?: "mean" | "halves";
}

/** The label of the half-stent expansion criterion (pciBench.deploy() and ivusSummary in "halves" mode). */
export const EXPANSION_HALVES_LABEL = "Expansion > 80% in each half of the stent (against the nearest reference)";

/**
 * Whether the frame shows the EEM all round: on OCT it is hidden behind a lipid pool and wherever the wall
 * is thicker than the modality images (MP_PENETRATION_MM; the module notes OCT may not see the EEM
 * behind lipid or heavy plaque); on IVUS it is hidden in the acoustic shadow behind a calcium arc wider
 * than MP_IVUS_EEM_HIDDEN_ARC_DEG. Where it is hidden, EEM area and plaque burden cannot be measured.
 */
export function eemMeasurable(f: IvusFrame): boolean {
  if (f.modality === "OCT" && f.lipid) return false;
  if (f.modality === "IVUS" && f.calcium && f.calcium.arcDeg > MP_IVUS_EEM_HIDDEN_ARC_DEG) return false;
  let wall = 0;
  for (let i = 0; i < f.eem.length; i++) wall = Math.max(wall, f.eem[i] - f.lumen[i]);
  return wall <= MP_PENETRATION_MM[f.modality];
}

/** Summary over a pullback range (proximal `fromMm` to distal `toMm`), sampled every 0.25 mm. */
export function ivusSummary(ctx: IvusContext, fromMm: number, toMm: number, opts: IvusSummaryOptions = {}): IvusSummary {
  let mla = Infinity,
    mlaAt = fromMm;
  let msa = Infinity,
    msaAt: number | null = null,
    maxMal = 0,
    anyStent = false;
  const frames: IvusFrame[] = [];
  for (let mm = fromMm; mm <= toMm + 1e-9; mm += 0.25) {
    const f = ivusFrame(ctx, mm, 48);
    frames.push(f);
    if (f.areas.lumen < mla) {
      mla = f.areas.lumen;
      mlaAt = mm;
    }
    if (f.areas.stent !== null) {
      anyStent = true;
      if (f.areas.stent < msa) {
        msa = f.areas.stent;
        msaAt = mm;
      }
      for (const s of f.struts) maxMal = Math.max(maxMal, s.gapMm);
    }
  }
  const at = (mm: number) => frames.reduce((a, b) => (Math.abs(b.mm - mm) < Math.abs(a.mm - mm) ? b : a));
  const prox = at(fromMm),
    dist = at(toMm);
  let landingProx = fromMm,
    landingDist = toMm;
  for (let mm = mlaAt; mm >= fromMm; mm -= 0.25)
    if (at(mm).areas.plaqueBurden < 0.5) {
      landingProx = mm;
      break;
    }
  for (let mm = mlaAt; mm <= toMm; mm += 0.25)
    if (at(mm).areas.plaqueBurden < 0.5) {
      landingDist = mm;
      break;
    }
  // edge plaque burden: the native vessel just outside the newest stent's edges (the stent props the lumen open inside)
  const st = ctx.stents.length ? ctx.stents[ctx.stents.length - 1] : null;
  const refArea = (prox.areas.lumen + dist.areas.lumen) / 2;
  let expansionPct = anyStent ? (100 * msa) / refArea : null;
  const halves = opts.expansion === "halves";
  if (anyStent && halves && st) {
    const nativeArea = (mm: number) => Math.PI * ctx.lumenR(mm) ** 2;
    const refMax = (a: number, b: number) => {
      let m = 0;
      for (let mm = Math.max(fromMm, a); mm <= Math.min(toMm, b) + 1e-9; mm += 0.25) m = Math.max(m, nativeArea(mm));
      return m || nativeArea(Math.max(fromMm, Math.min(toMm, a)));
    };
    const proxRef = refMax(st.fromMm - 10, st.fromMm);
    const distRef = refMax(st.toMm, st.toMm + 10);
    const mid = (st.fromMm + st.toMm) / 2;
    let e = Infinity;
    for (const f of frames) if (f.areas.stent !== null && f.mm >= st.fromMm && f.mm <= st.toMm) e = Math.min(e, (100 * f.areas.stent) / (f.mm <= mid ? proxRef : distRef));
    expansionPct = Number.isFinite(e) ? e : 100;
  }
  const nativePb = (mm: number) => {
    const f = ivusFrame({ ...ctx, stents: [] }, Math.max(fromMm, Math.min(toMm, mm)), 48);
    return f.areas.plaqueBurden;
  };
  const proxEdgePb = anyStent && st ? nativePb(st.fromMm) : null;
  const distEdgePb = anyStent && st ? nativePb(st.toMm) : null;
  const criteria =
    anyStent && expansionPct !== null && proxEdgePb !== null && distEdgePb !== null
      ? optimisationCriteria(
          { msa, expansionPct, maxMalappositionMm: maxMal, proxEdgePb, distEdgePb },
          { leftMain: opts.leftMain, modality: ctx.modality ?? "IVUS" },
          halves ? EXPANSION_HALVES_LABEL : undefined
        )
      : null;
  return {
    mla,
    mlaAt,
    proxRefLumen: 2 * Math.sqrt(prox.areas.lumen / Math.PI),
    distRefLumen: 2 * Math.sqrt(dist.areas.lumen / Math.PI),
    proxRefEem: 2 * Math.sqrt(prox.areas.eem / Math.PI),
    distRefEem: 2 * Math.sqrt(dist.areas.eem / Math.PI),
    landingProx,
    landingDist,
    msa: anyStent ? msa : null,
    msaAt,
    expansionPct,
    maxMalappositionMm: anyStent ? maxMal : null,
    proxEdgePb,
    distEdgePb,
    criteria,
  };
}

export interface IvusRun {
  active: boolean;
  /** transducer position (route mm) */
  mm: number;
  startMm: number;
  speed: number;
  t: number;
  /** recorded frame positions and times */
  recorded: { mm: number; t: number }[];
  /** where the run ends of itself (an OCT run's length); absent: at the guide tip */
  endMm?: number;
  /** the in-lab acquisition of the imaging catheter on the wire (pci-intravascular-imaging) */
  acq?: ImagingAcq;
  /** the trainee's assessments of the runs, oldest first (kept across catheters in the case) */
  assessments?: RunAssessment[];
  /** completed runs of the case, oldest first (kept across catheters) */
  runs?: ImagingRunRecord[];
}

export function startPullback(fromMm: number, speed = MP_PULLBACK_MM_S): IvusRun {
  return { active: true, mm: fromMm, startMm: fromMm, speed, t: 0, recorded: [{ mm: fromMm, t: 0 }] };
}

/** Advance the motorised pullback; it stops at `stopMm` (the guide tip), or at the run's own end. */
export function stepPullback(run: IvusRun, dt: number, stopMm: number): IvusRun {
  if (!run.active) return run;
  const stop = Math.max(stopMm, run.endMm ?? -Infinity);
  const mm = Math.max(stop, run.mm - run.speed * dt);
  const t = run.t + dt;
  const recorded = run.recorded.length && run.recorded[run.recorded.length - 1].mm - mm < 0.25 && mm > stop + 1e-6 ? run.recorded : [...run.recorded, { mm, t }];
  return { ...run, mm, t, recorded, active: mm > stop + 1e-6 };
}

// ===========================================================================
// In-lab acquisition (pci-intravascular-imaging)
//
// The PCI lab puts an imaging catheter on the wire and acquires on the frames
// above. What the operator does decides what each frame shows:
//   - a rotational IVUS or OCT catheter is flushed (OCT: purged with undiluted
//     contrast) before use, or air in it shadows an arc of every frame;
//   - OCT is calibrated after the purge, never while purging, or the console's
//     automated measurements are wrong;
//   - a phased-array (solid-state) catheter needs 'clear view' pressed in a roomy
//     segment or the aorta before it crosses, or ring-down hides the near field;
//     its pullback jumps across tight segments and struts unless it is slow;
//   - OCT needs the blood flushed out for the run: the run triggers only when the
//     injection rate clears the lumen (at least 3 mL/s in the RCA, 4 mL/s in the
//     left system), and only the part of the run the flush lasts is clear; a
//     hand injection through a guide under 6 Fr cannot reach that rate; an
//     aorto-ostial segment is never cleared;
//   - the run covers what the lens passes: OCT survey 75 mm at 36 mm/s, high
//     resolution 54 mm at 18 mm/s (the module's 57 mm marker rule follows from it);
//   - a catheter that will not cross a tight or calcified lesion stops there, and
//     forcing it kinks it (it then images nothing).
// Sourced values cite src/content/manual/pci-manual/15-imaging.ts (pm-imaging-ivus,
// pm-imaging-oct, pm-imaging-optimisation); every MP_ value is a MODEL PARAMETER
// (docs/realism/facts/pkg-pci-intravascular-imaging.md).
// ===========================================================================

/** The imaging catheter technologies of the device catalogue (equipment.ts `imaging.tech`). */
export type ImagingTech = "rotational" | "phased-array" | "oct";
export type OctMode = "survey" | "high-resolution";

/** OCT acquisition modes (pm-imaging-oct, Brilakis table 13.3). */
export const OCT_MODES: Record<OctMode, { lengthMm: number; speedMmS: number; framesPerMm: number; durationS: number }> = {
  survey: { lengthMm: 75, speedMmS: 36, framesPerMm: 5, durationS: 2.1 },
  "high-resolution": { lengthMm: 54, speedMmS: 18, framesPerMm: 10, durationS: 3.0 },
};
/** OCT: the middle marker at least this far distal to the target (pm-imaging-oct step 2). */
export const OCT_MIDDLE_MARKER_RULE_MM = 57;
/** OCT: the proximal marker sits this far proximal to the lens (pm-imaging-oct step 2). */
export const OCT_PROXIMAL_MARKER_MM = 50;
/** OCT: the least injection rate that clears the lumen, mL/s (pm-imaging-oct, 'When the run fails': at least 3 mL/s RCA, 4 mL/s left main). */
export const OCT_FLUSH_MIN_ML_S: Record<"left" | "right", number> = { left: 4, right: 3 };
/** OCT: typical injector settings (pm-imaging-oct step 6: 4 mL/s for 4 s left, 3 mL/s for 3 s right). */
export const OCT_FLUSH_TYPICAL: Record<"left" | "right", { rateMlS: number; durationS: number }> = { left: { rateMlS: 4, durationS: 4 }, right: { rateMlS: 3, durationS: 3 } };
/** OCT: a hand injection clears the lumen through a guide of at least this size; a smaller one needs an injector (pm-imaging-oct; equipment.ts guideHandInjectionMinFrench). */
export const OCT_HAND_INJECTION_MIN_FRENCH = 6;
/** IVUS motorised pullback speeds the console offers, mm/s (pm-imaging-ivus step 3: Oxford 0.5-1.0 mm/s, Brilakis 1-10 mm/s by catheter). */
export const IVUS_PULLBACK_SPEEDS: Record<Exclude<ImagingTech, "oct">, readonly number[]> = { rotational: [0.5, 1, 10], "phased-array": [0.5, 1] };

/** Fastest hand injection through a guide of each size with the imaging catheter in it, mL/s — MODEL PARAMETER (rests on the 6 Fr hand / 5 Fr injector rule and the 3 and 4 mL/s minima). */
export const MP_HAND_FLUSH_MAX_ML_S: Record<5 | 6 | 7 | 8, number> = { 5: 2.5, 6: 4.5, 7: 5.5, 8: 6 };
/** Seconds from the start of the push to a clear lumen (the trigger) — MODEL PARAMETER. */
export const MP_FLUSH_CLEAR_DELAY_S = 0.5;
/** Length of an aorto-ostial segment that a flush through an engaged guide cannot clear, mm from the vessel origin — MODEL PARAMETER (pm-imaging-when-which: a flush cannot clear an aorto-ostial segment reliably). */
export const MP_OSTIAL_UNCLEARED_MM = 3;
/** OCT: lens to middle marker, mm — MODEL PARAMETER (57 mm rule less the 54 mm high-resolution run, so the rule is the condition for that run to reach the target's proximal edge). */
export const MP_OCT_LENS_TO_MIDDLE_MM = OCT_MIDDLE_MARKER_RULE_MM - OCT_MODES["high-resolution"].lengthMm;
/** OCT and rotational IVUS: catheter tip (sheath) beyond the lens when the run starts, mm — MODEL PARAMETER. */
export const MP_TIP_BEYOND_LENS_MM: Record<ImagingTech, number> = { rotational: 10, "phased-array": 2.5, oct: 20 };
/** Ring-down: depth of the near field a phased-array catheter hides without 'clear view', mm — MODEL PARAMETER. */
export const MP_RINGDOWN_MM = 0.9;
/** 'Clear view' works in a segment at least this wide (mm) outside the lesion, or with the catheter still in the guide at the root — MODEL PARAMETER. */
export const MP_ROOMY_LUMEN_MM = 2.5;
/**
 * The catheter crosses an untreated segment where the lumen is at least its profile plus MP_CROSS_CLEARANCE_MM, mm
 * (an untreated grade 2 calcified lesion adds MP_CROSS_CALCIUM_MM) — MODEL PARAMETERS.
 */
export const MP_CROSS_CLEARANCE_MM = 0.1;
export const MP_CROSS_CALCIUM_MM = 0.3;
/**
 * Once the target lesion has been prepared (dilated in the lesion, or its stenosis reduced by any device), the
 * catheter crosses it where the lumen is at least its profile less this, mm: the cracked plaque gives way —
 * MODEL PARAMETER, set so that the module's remedy (predilate with a small balloon) works in the calcified case:
 * in rca-calcified a 2.0 to 3.0 mm balloon leaves a lumen of 0.78 to 0.99 mm, which every imaging catheter of
 * the catalogue (0.95 to 1.15 mm) then crosses, while the untreated lesion (0.60 mm) still stops them.
 */
export const MP_CROSS_PREPARED_GIVE_MM = 0.4;
/** Pushes against the stop before the catheter kinks — MODEL PARAMETER (pm-imaging-ivus: forcing kinks it). */
export const MP_FORCE_KINK_PUSHES = 3;
/** The catheter tip stays this far behind the wire tip, mm — MODEL PARAMETER. */
export const MP_IMAGING_WIRE_MARGIN_MM = 5;
/** Phased-array pullbacks faster than this jump across tight segments and struts, mm/s — MODEL PARAMETER (pm-imaging-ivus: pull back slowly). */
export const MP_JUMP_SAFE_MM_S = 0.5;
/** A segment is tight for a jump where its lumen is under the catheter profile plus this, mm — MODEL PARAMETER. */
export const MP_JUMP_CLEARANCE_MM = 0.6;
/** A forceful flush (at least this rate, mL/s) drives an unheld catheter and wire distally by MP_MIGRATION_MM — MODEL PARAMETER (pm-imaging-oct 'When the run fails'). */
export const MP_MIGRATION_RATE_ML_S = 4;
export const MP_MIGRATION_MM = 5;
/** Automated measurements of an OCT catheter not calibrated, or calibrated while purging: linear scale error — MODEL PARAMETER. */
export const MP_MISCALIBRATION_SCALE = 1.12;

/** What the acquisition did to a frame. */
export interface FrameArtefacts {
  /** OCT: blood left in the lumen (an incomplete flush, or an aorto-ostial segment) */
  blood: boolean;
  /** phased-array without 'clear view': ring-down hides the near field (MP_RINGDOWN_MM) */
  ringDown: boolean;
  /** air in an unflushed or unpurged catheter shadows an arc */
  air: boolean;
  /** a kinked catheter images nothing */
  noImage: boolean;
  /** a phased-array pullback jumped across this position (the frame is skipped) */
  jump: boolean;
}

export const CLEAN_FRAME: FrameArtefacts = { blood: false, ringDown: false, air: false, noImage: false, jump: false };

/** One OCT flush: what was pushed, and what it did. */
export interface OctFlushOutcome {
  /** the rate the push reached, mL/s (a hand push is limited by the guide) */
  rateMlS: number;
  durationS: number;
  volumeMl: number;
  injector: boolean;
  /** the lumen cleared and the pullback triggered of itself */
  triggered: boolean;
  /** seconds of clear lumen after the trigger */
  clearS: number;
  /** why the run is not clean */
  reason: null | "rate-low" | "hand-small-guide" | "too-short";
}

/** The least flush volume for a clean run of a mode on a side, mL. */
export function octVolumeNeeded(side: "left" | "right", mode: OctMode): number {
  return OCT_FLUSH_MIN_ML_S[side] * (OCT_MODES[mode].durationS + MP_FLUSH_CLEAR_DELAY_S);
}

/** The outcome of an OCT flush (pure). */
export function octFlushOutcome(f: { rateMlS: number; durationS: number; injector: boolean; french: number; side: "left" | "right" }, mode: OctMode): OctFlushOutcome {
  const fr = (Math.max(5, Math.min(8, Math.round(f.french))) as 5 | 6 | 7 | 8);
  const handMax = MP_HAND_FLUSH_MAX_ML_S[fr];
  const rate = Math.max(0, f.injector ? f.rateMlS : Math.min(f.rateMlS, handMax));
  const durationS = Math.max(0, f.durationS);
  const volumeMl = rate * durationS;
  const triggered = rate >= OCT_FLUSH_MIN_ML_S[f.side] - 1e-9 && durationS > MP_FLUSH_CLEAR_DELAY_S;
  const clearS = triggered ? durationS - MP_FLUSH_CLEAR_DELAY_S : 0;
  let reason: OctFlushOutcome["reason"] = null;
  if (!triggered) reason = !f.injector && f.rateMlS > handMax && handMax < OCT_FLUSH_MIN_ML_S[f.side] ? "hand-small-guide" : "rate-low";
  else if (clearS < OCT_MODES[mode].durationS) reason = "too-short";
  return { rateMlS: rate, durationS, volumeMl, injector: f.injector, triggered, clearS, reason };
}

/** The acquisition state of the imaging catheter on the wire. */
export interface ImagingAcq {
  specId: string;
  tech: ImagingTech;
  modality: Modality;
  /** profile of the catheter (mm), from the catalogue */
  profileMm: number;
  /** flushed (rotational IVUS) or purged with undiluted contrast (OCT); a phased-array needs neither */
  purged: boolean;
  /** a purge is in progress (calibrating now is the error the module names) */
  purging: boolean;
  calibrated: boolean;
  calibratedWhilePurging: boolean;
  /** phased-array: 'clear view' pressed in a roomy segment or at the root */
  clearView: boolean;
  /** 'clear view' pressed where it does not work (in the lesion or a narrow segment) */
  clearViewFailed: number;
  octMode: OctMode;
  /** IVUS motorised pullback speed, mm/s */
  speedMmS: number;
  /** OCT: enabled, waiting for the flush */
  armed: boolean;
  /** the left hand holds the catheter and wire (no migration on a forceful flush) */
  held: boolean;
  /** the last OCT flush */
  flush: (OctFlushOutcome & { t: number; manual: boolean }) | null;
  /** stopped by the lesion at this catheter-tip position (mm), and pushes against the stop since */
  stoppedAtMm: number | null;
  forcedPushes: number;
  kinked: boolean;
  /** intracoronary nitrate given before the run (the lab reports it) */
  nitrate: boolean;
  /** catheter tip (sheath) position when the run started; it stays there for rotational and OCT pullbacks */
  sheathTipMm: number | null;
  /** phased-array: positions the last pullback jumped across */
  jumps: { fromMm: number; toMm: number }[];
  /** contrast this catheter's flushes used, mL */
  contrastMl: number;
}

/** A fresh acquisition record for a catheter. */
export function newAcquisition(specId: string, tech: ImagingTech, profileMm: number): ImagingAcq {
  return {
    specId,
    tech,
    modality: tech === "oct" ? "OCT" : "IVUS",
    profileMm,
    // a phased-array catheter needs no preparation (pm-imaging-ivus)
    purged: tech === "phased-array",
    purging: false,
    calibrated: tech !== "oct",
    calibratedWhilePurging: false,
    clearView: tech !== "phased-array",
    clearViewFailed: 0,
    octMode: "survey",
    speedMmS: tech === "rotational" ? 1 : MP_PULLBACK_MM_S,
    armed: false,
    held: false,
    flush: null,
    stoppedAtMm: null,
    forcedPushes: 0,
    kinked: false,
    nitrate: false,
    sheathTipMm: null,
    jumps: [],
    contrastMl: 0,
  };
}

/** Seconds into the run at which the lens passed `mm`. */
export function runTimeAt(run: Pick<IvusRun, "startMm" | "speed">, mm: number): number {
  return run.speed > 0 ? Math.max(0, (run.startMm - mm) / run.speed) : 0;
}

/**
 * What the acquisition did to the frame at `mm` of the run. `ostialMm` is the start of an aorto-ostial
 * segment's origin on the route (null when the target is not aorto-ostial).
 */
export function acquisitionArtefacts(run: IvusRun, mm: number, o: { ostial?: boolean } = {}): FrameArtefacts {
  const acq = run.acq;
  if (!acq) return CLEAN_FRAME;
  const out: FrameArtefacts = { ...CLEAN_FRAME };
  if (acq.kinked) return { ...out, noImage: true };
  out.air = !acq.purged;
  out.ringDown = acq.tech === "phased-array" && !acq.clearView;
  if (acq.tech === "oct") {
    const f = acq.flush;
    const cleared = !!f && f.triggered && runTimeAt(run, mm) <= f.clearS + 1e-9;
    out.blood = !cleared || (!!o.ostial && mm <= MP_OSTIAL_UNCLEARED_MM);
  }
  out.jump = acq.jumps.some((j) => mm >= j.fromMm && mm <= j.toMm);
  return out;
}

/** The OCT markers on the route (mm): the lens, the middle marker on the imaging core, the proximal marker, and the catheter tip. */
export function octMarkers(lensMm: number, sheathTipMm: number | null): { lens: number; middle: number; proximal: number; tip: number } {
  return { lens: lensMm, middle: lensMm + MP_OCT_LENS_TO_MIDDLE_MM, proximal: lensMm - OCT_PROXIMAL_MARKER_MM, tip: sheathTipMm ?? lensMm + MP_TIP_BEYOND_LENS_MM.oct };
}

// ---------------------------------------------------------------------------
// The trainee's assessment of a run and what it calls for
// ---------------------------------------------------------------------------

/** What the trainee measured and named on a run (their own numbers; nothing here is the truth). */
export interface RunAssessment {
  /** procedure time it was recorded (state.t) */
  t: number;
  modality: Modality;
  /** the run is after stenting (an optimisation run) */
  postStent: boolean;
  mlaMm2?: number | null;
  msaMm2?: number | null;
  proxRefMm2?: number | null;
  distRefMm2?: number | null;
  /** largest strut-to-wall distance measured, mm */
  malappositionMm?: number | null;
  /** malapposed length, mm */
  malappositionLengthMm?: number | null;
  edgeDissection?: { edge: "proximal" | "distal"; arcDeg: number; lengthMm: number } | null;
  thrombus?: boolean;
  /** left main thresholds apply */
  leftMain?: boolean;
}

/** The next step the trainee's own findings call for (pm-imaging-optimisation; Brilakis 13.3). */
export interface NextStep {
  id: "nc-postdilate" | "sc-low-pressure" | "extra-stent" | "leave" | "none";
  text: string;
}

/** The trainee's expansion verdict from their own numbers: MSA against 80% of their mean reference and the MSA target. */
export function assessedUnderexpanded(a: RunAssessment): boolean {
  if (!a.postStent || a.msaMm2 == null) return false;
  const refs = [a.proxRefMm2, a.distRefMm2].filter((x): x is number => typeof x === "number" && x > 0);
  // expansion passes only above 80% (criteria.ts: ok when expansion > EXPANSION_MIN_PCT), so 80% itself fails
  const rel = refs.length ? a.msaMm2 <= (EXPANSION_MIN_PCT / 100) * (refs.reduce((p, q) => p + q, 0) / refs.length) : false;
  const abs = a.msaMm2 <= msaTarget({ modality: a.modality, leftMain: a.leftMain }).mm2;
  return rel || abs;
}

/** Extensive malapposition as Brilakis words it: a distance of 0.4 mm or more, or a malapposed length of 1 mm or more (pm-imaging-optimisation). */
export const EXTENSIVE_MALAPPOSITION = { distanceMm: 0.4, lengthMm: 1 } as const;
/** An edge dissection best covered with another stent: over 60 degrees of arc and/or over 3 mm long (pm-imaging-optimisation). */
export const EDGE_DISSECTION_STENT = { arcDeg: 60, lengthMm: 3 } as const;
/** Post-dilatation of an underexpanded stent: a non-compliant balloon at least the stent diameter, above 18 atm (pm-imaging-optimisation). */
export const UNDEREXPANSION_FIX = { minAtm: 18 } as const;

/** The step the trainee's findings call for, in the module's order: expansion first, then edges, then apposition. */
export function nextStepFor(a: RunAssessment, stentDiameterMm: number | null): NextStep {
  if (!a.postStent) return { id: "none", text: "" };
  if (assessedUnderexpanded(a))
    return {
      id: "nc-postdilate",
      text: `Underexpanded: a non-compliant balloon of at least ${stentDiameterMm ? `${stentDiameterMm.toFixed(2)} mm` : "the stent diameter"} above ${UNDEREXPANSION_FIX.minAtm} atm, then image again.`,
    };
  const d = a.edgeDissection;
  if (d && (d.arcDeg > EDGE_DISSECTION_STENT.arcDeg || d.lengthMm > EDGE_DISSECTION_STENT.lengthMm))
    return { id: "extra-stent", text: `${d.edge === "distal" ? "Distal" : "Proximal"} edge dissection over 60° or 3 mm: cover it with another stent. An oversized balloon at the edge makes a new dissection.` };
  if ((a.malappositionMm ?? 0) >= EXTENSIVE_MALAPPOSITION.distanceMm || (a.malappositionLengthMm ?? 0) >= EXTENSIVE_MALAPPOSITION.lengthMm)
    return { id: "sc-low-pressure", text: "Extensive malapposition: a semi-compliant balloon at low pressure for contact, not force." };
  return { id: "leave", text: d ? "A small edge flap: leave it." : "Nothing to correct on these measurements." };
}

/** One completed run of the case: what the catheter was and where it ran (the debrief compares the trainee's assessment of it with ivusReport). */
export interface ImagingRunRecord {
  t: number;
  tech: ImagingTech;
  modality: Modality;
  fromMm: number;
  toMm: number;
  /** stents in at the time of the run */
  stents: number;
  artefacts: { blood: boolean; ringDown: boolean; air: boolean; jumps: number; noImage: boolean };
  nitrate: boolean;
  motorised: boolean;
  contrastMl: number;
  /** the lens was beyond the target lesion's distal end when the run started (the run can cover the lesion) */
  beyondLesion: boolean;
  /** OCT: the run covered the whole target lesion, what the 57 mm marker rule is for (null: IVUS) */
  markerOk: boolean | null;
  /** OCT: not calibrated, or calibrated while purging (the automated measurements are wrong); null: IVUS */
  miscalibrated: boolean | null;
}
