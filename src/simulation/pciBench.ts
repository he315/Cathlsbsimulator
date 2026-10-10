// ---------------------------------------------------------------------------
// PCI bench: imaging-guided lesion preparation, stent sizing, deployment and
// optimisation on a segment described by its EEM, plaque burden and calcium.
//
// Geometry along the segment (x in mm, 0 = proximal):
//   EEM(x)      external elastic membrane diameter, tapering
//   PB(x)       plaque burden (1 − lumen area / EEM area)
//   lumen(x)    = EEM(x) · √(1 − PB(x))
// Calcium resists expansion according to its arc, thickness and length (the
// Fujino OCT score); preparation devices modify it. A device expands to its
// pressure-dependent diameter unless the wall stops it.
//
// pci-bench-imaging-unify: the bench's images come from the PCI lab's frame
// generator (src/simulation/pci/ivus.ts) through benchIvusContext; outcomes are
// judged by the shared EAPCI 2018 criteria (src/simulation/imaging/criteria.ts:
// expansion > 80%, MSA > 5.5 mm² IVUS / > 4.5 mm² OCT outside the left main,
// plaque burden < 50% at the edges, tolerable malapposition < 0.4 mm;
// SIM_FACTS §12); devices come from the one catalogue
// (src/simulation/pci/equipment.ts): balloon and stent diameters are read from
// its compliance charts and BALLOON_SPEC is derived from it, so the pressures
// the bench and the PCI lab display are the ones they apply. The deployed stent
// is built ring by ring with stentGeometry.deployStent. Lesion resistance,
// calcium modification and the event rules are MODEL PARAMETERS.
//
// pci-bench-measure-and-plan: each lesion states a goal and a patient, and the
// learner commits to IVUS or OCT against it (the goal's modality and reason come
// from pm-imaging-when-which: OCT for the culprit, thrombus, dissection,
// apposition, edges and calcium thickness; IVUS for the left main, aorto-ostial
// segments, large vessels and contrast saving; either for sizing and expansion,
// Brilakis 13.2, Oxford ch 8). Lesions may carry further plaques, a piecewise
// EEM, two branch pullbacks sharing a left main segment, and an ostium with the
// aorta proximal to it (frames there show the aorta; OCT cannot clear the
// ostium). The learner's measurements and plan are graded in
// src/simulation/bench/measure.ts. deploy() adds the plan's consequences: an
// edge on lipid or on plaque burden over 50% dissects, a stent larger than the
// distal reference's sizing rules allow dissects the distal edge (Brilakis 13.3
// and 10.2, pm-imaging-planning), and each OCT run adds its flush to the
// imaging contrast.
//
// pci-bench-stent-platforms-sizing: the stent is one of the generic platforms of
// src/simulation/bench/platforms.ts (size range, labelled post-dilatation limit
// by size band, strut thickness, cell design, marker placement; platform A is
// the catalogue's drug-eluting stent and the default). Predilatation records the
// segment it injured, and deploy() reports a geographic miss when the stent
// leaves any injured segment uncovered (pm-prep-and-stent-deploy, Brilakis
// 10.2.3). A lesion may make the stent swing with each beat (deployed displaced
// unless rapid pacing is chosen), recoil after deployment (aorto-ostial, unless
// the platform has strong radial strength), or be ectatic (an OCT flush clears
// it incompletely). For an aorto-ostial lesion deploy() also reports the
// protrusion into the aorta (1-2 mm is the target, cp-ostial-stent), whether a
// check angiogram would look complete (the balloon shoulder dilates the true
// ostium, cp-ostial-troubleshoot) and whether the overhang was flared. Motion
// amplitudes, recoil fractions, the balloon shoulder and the dissection
// extension are MODEL PARAMETERS.
// ---------------------------------------------------------------------------

import type { Calcium, ImagingSideBranch, Modality, ThrombusType } from "./imaging/types";
import { EXPANSION_MIN_PCT, optimisationCriteria, msaTarget } from "./imaging/criteria";
import { EXPANSION_HALVES_LABEL, calciumProfileAt, eemMeasurable, ivusFrame, stentRingAt, type IvusContext, type IvusFrame } from "./pci/ivus";
import { BURR_SIZES_MM, DEVICE_BY_ID, chartDiameter, deviceFor, type BalloonKind, type DeviceSpec } from "./pci/equipment";
import { deliveryLayout, deployStent, type StentGeom } from "./pci/stentGeometry";
import { MP_RADIAL_STRENGTH_RECOIL_FACTOR, PLATFORM_LESIONS, checkPostDilatation, platformFor, type PostDilatationCheck, type StentPlatform } from "./bench/platforms";

export type { Calcium, Modality } from "./imaging/types";
export type { BalloonKind } from "./pci/equipment";

export type PlaqueType = "fibrous" | "lipid" | "calcified";

/** Scenario properties a bench lesion carries for the whole case (tip events, raised by src/ui/lab/benchTips.ts). */
export type BenchFlag = "bifurcation" | "aorto-ostial-lesion" | "in-stent-lesion" | "scad-suspected" | "cto";

/**
 * Why a modality fits a goal (pm-imaging-when-which, src/content/manual/pci-manual/15-imaging.ts: OCT for the
 * culprit, thrombus, dissection, apposition and edges, and calcium thickness, which IVUS cannot see through;
 * IVUS for the left main, aorto-ostial segments, large vessels and contrast saving; either for sizing,
 * landing zones and expansion. Brilakis 13.2, Oxford ch 8: IVUS or OCT?).
 */
export type ModalityReasonId = "culprit" | "apposition" | "calcium-thickness" | "left-main-ostial" | "large-vessel" | "spare-contrast" | "sizing";

export const MODALITY_REASONS: readonly { id: ModalityReasonId; label: string; fits: Modality | "either" }[] = [
  { id: "culprit", label: "Culprit, thrombus or dissection", fits: "OCT" },
  { id: "apposition", label: "Strut apposition and stent edges", fits: "OCT" },
  { id: "calcium-thickness", label: "Calcium thickness and the calcium score", fits: "OCT" },
  { id: "left-main-ostial", label: "Left main or aorto-ostial segment", fits: "IVUS" },
  { id: "large-vessel", label: "Large vessel", fits: "IVUS" },
  { id: "spare-contrast", label: "Contrast must be spared", fits: "IVUS" },
  { id: "sizing", label: "Sizing, landing zones and expansion", fits: "either" },
];

/** The question the imaging must answer, and for whom; the modality and reason that fit it. */
export interface BenchGoal {
  text: string;
  patient: string;
  correctModality: Modality | "either";
  reasonId: ModalityReasonId;
  /** the debrief's explanation of the choice */
  reason: string;
  /** estimated GFR (mL/min/1.73 m²) when the scenario states it */
  egfr?: number;
}

/** A further plaque along the segment, profiled like the main lesion (plaque burden is the larger of the profiles). */
export interface BenchPlaque {
  startMm: number;
  endMm: number;
  pbMax: number;
  pbShoulder: number;
  shoulderMm: number;
}

/** The geometry a branch pullback may replace. */
export type BenchBranchGeometry = Partial<Pick<BenchLesion, "segmentMm" | "eemProx" | "eemDist" | "eemPoints" | "plaques" | "sideBranches" | "calcium" | "lipidArcDeg">>;

/**
 * A pullback from one branch of a bifurcation: the left main segment (0 … atMm) is shared, the branch
 * beyond it is the branch's own geometry. The first branch is the lesion's own geometry.
 */
export interface BenchBranch {
  id: "LAD" | "LCx";
  label: string;
  /** the bifurcation (polygon of confluence) along the pullback, mm from the proximal end */
  atMm: number;
  geometry: BenchBranchGeometry;
}

export interface BenchLesion {
  id: string;
  title: string;
  vessel: string;
  brief: string;
  leftMain?: boolean;
  segmentMm: number;
  eemProx: number;
  eemDist: number;
  /** angiographic lesion extent */
  startMm: number;
  endMm: number;
  /** plaque burden at the tightest point */
  pbMax: number;
  /** plaque burden at the lesion shoulders (disease beyond the angiographic edges) */
  pbShoulder: number;
  /** how far the shoulders extend beyond the lesion (mm) */
  shoulderMm: number;
  /** background plaque burden in the "normal" reference segments */
  pbBackground: number;
  plaque: PlaqueType;
  calcium?: Calcium;
  /** lipid pool arc on OCT / attenuation on IVUS */
  lipidArcDeg?: number;
  /** thrombus over the lesion, with its type */
  thrombus?: ThrombusType;
  /** scenario properties raised as tip events for the whole case */
  flags?: BenchFlag[];
  /** side branches whose ostia the pullback passes */
  sideBranches?: ImagingSideBranch[];
  /** the question the imaging must answer (pci-bench-measure-and-plan) */
  goal?: BenchGoal;
  /** EEM diameter as [mm, diameter] points, piecewise linear (overrides eemProx and eemDist) */
  eemPoints?: readonly (readonly [number, number])[];
  /** further plaques along the segment */
  plaques?: BenchPlaque[];
  /** pullbacks from both branches of a left main bifurcation */
  branches?: BenchBranch[];
  /** an ostial lesion: the first aortaMm of the pullback are in the aorta */
  ostial?: { aortaMm: number };
  /** a predilatation already done before the bench opens, as the operator recorded it (its injured segment) */
  predilatation?: { fromMm: number; toMm: number; label: string };
  /** the stent swings with each beat by this amplitude (mm) and lands displaced unless rapid pacing is chosen */
  motion?: { amplitudeMm: number; towards: "proximal" | "distal" };
  /** the reference diameter on angiography before and after intracoronary nitroglycerin (spasm), mm */
  spasm?: { angioRefMm: number; afterNitrateRefMm: number };
  /** a drug-coated balloon is an alternative to a stent here (small vessels, cp-other-complex-vessel-size) */
  dcbOption?: boolean;
  /** an ectatic (large) vessel: an OCT flush clears it incompletely where the lumen is large */
  ectatic?: boolean;
  /** elastic recoil after deployment over a segment: the share of the acute gain the wall takes back */
  recoil?: { fromMm: number; toMm: number; fraction: number };
  teaching: string;
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------
export function eem(l: BenchLesion, x: number): number {
  const pts = l.eemPoints;
  if (pts && pts.length) {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      const [x1, d1] = pts[i];
      if (x <= x1) {
        const [x0, d0] = pts[i - 1];
        return x1 > x0 ? d0 + ((d1 - d0) * (x - x0)) / (x1 - x0) : d1;
      }
    }
    return pts[pts.length - 1][1];
  }
  return l.eemProx + ((l.eemDist - l.eemProx) * x) / l.segmentMm;
}

/** One plaque's burden profile: cosine core between its edges, shoulders falling to the background. */
function plaqueProfile(p: BenchPlaque, background: number, x: number): number {
  const mid = (p.startMm + p.endMm) / 2;
  const half = (p.endMm - p.startMm) / 2;
  if (x >= p.startMm && x <= p.endMm) {
    const d = half > 0 ? Math.abs(x - mid) / half : 0; // 0 centre → 1 edge
    return p.pbShoulder + (p.pbMax - p.pbShoulder) * (0.5 + 0.5 * Math.cos(Math.PI * d));
  }
  const dist = x < p.startMm ? p.startMm - x : x - p.endMm;
  if (dist < p.shoulderMm) {
    const f = dist / p.shoulderMm;
    return p.pbShoulder + (background - p.pbShoulder) * f;
  }
  return background;
}

/** Whether a position of the pullback is in the aorta, proximal to an ostial lesion's ostium. */
export function inAorta(l: BenchLesion, x: number): boolean {
  return !!l.ostial && x < l.ostial.aortaMm;
}

export function plaqueBurden(l: BenchLesion, x: number): number {
  // the aorta proximal to an ostium carries no coronary plaque in this model
  if (inAorta(l, x)) return 0;
  let pb = plaqueProfile(l, l.pbBackground, x);
  for (const p of l.plaques ?? []) pb = Math.max(pb, plaqueProfile(p, l.pbBackground, x));
  return pb;
}

/** The geometry a pullback from one branch images (the lesion itself for its first branch or when it has none). */
export function branchLesion(l: BenchLesion, branchId?: string | null): BenchLesion {
  const b = branchId ? l.branches?.find((x) => x.id === branchId) : undefined;
  if (!b || b === l.branches?.[0]) return l;
  return { ...l, ...b.geometry };
}

/** The pullbacks a lesion offers: its branches, or one pullback ("main"). */
export function benchPullbacks(l: BenchLesion): { id: string; label: string }[] {
  return l.branches?.length ? l.branches.map((b) => ({ id: b.id, label: b.label })) : [{ id: "main", label: "Pullback" }];
}

export function lumen(l: BenchLesion, x: number): number {
  return eem(l, x) * Math.sqrt(1 - plaqueBurden(l, x));
}

export const area = (d: number) => (Math.PI * d * d) / 4;

/** Calcium arc (deg) and thickness (mm) at x, fuller in the middle of the deposit (the frame generator's profile). */
export function calciumAt(l: BenchLesion, x: number): { arc: number; thickness: number } | null {
  return l.calcium ? calciumProfileAt(l.calcium, x) : null;
}

/** Fujino OCT calcium score (0–4) on the largest deposit. */
export function fujino(c?: Calcium): number {
  if (!c) return 0;
  return (c.arcDeg > 180 ? 2 : 0) + (c.thicknessMm > 0.5 ? 1 : 0) + (c.lengthMm > 5 ? 1 : 0);
}

export interface PreImaging {
  /** the lesion these measures belong to */
  lesionId: string;
  modality: Modality;
  mla: number;
  mlaAt: number;
  distRefLumen: number;
  distRefEem: number;
  proxRefLumen: number;
  proxRefEem: number;
  /** where plaque burden drops below 50% on each side: suggested landing zones */
  landingProx: number;
  landingDist: number;
  calcium?: { arcDeg: number; thicknessMm: number | null; lengthMm: number; fujino: number | null; nodule?: boolean };
  lipid?: string;
}

/** Whether a position lies on the lesion's lipid pool (the pool spans the lesion, as the frames draw it). */
export function onLipid(l: BenchLesion, x: number): boolean {
  return (l.lipidArcDeg ?? 0) > 0 && x >= l.startMm && x <= l.endMm;
}

/** Where an edge may land: plaque burden below 50% and no lipid pool (pm-imaging-planning, Brilakis 13.3). */
export function landable(l: BenchLesion, x: number): boolean {
  return plaqueBurden(l, x) < 0.5 && !onLipid(l, x);
}

export function preImaging(l: BenchLesion, modality: Modality): PreImaging {
  // an ostial lesion's pullback starts in the aorta: the coronary measures start at the ostium
  const x0 = l.ostial ? l.ostial.aortaMm : 0;
  let mla = Infinity,
    mlaAt = x0;
  for (let x = x0; x <= l.segmentMm; x += 0.25) {
    const a = area(lumen(l, x));
    if (a < mla) {
      mla = a;
      mlaAt = x;
    }
  }
  // for an ostial lesion the stent must cover the ostium, so the proximal landing zone is the ostium
  let landingProx = x0,
    landingDist = l.segmentMm;
  for (let x = mlaAt; x >= x0; x -= 0.25)
    if (landable(l, x)) {
      landingProx = x;
      break;
    }
  if (l.ostial) landingProx = x0;
  for (let x = mlaAt; x <= l.segmentMm; x += 0.25)
    if (landable(l, x)) {
      landingDist = x;
      break;
    }
  const c = l.calcium;
  return {
    lesionId: l.id,
    modality,
    mla,
    mlaAt,
    distRefLumen: lumen(l, l.segmentMm),
    distRefEem: eem(l, l.segmentMm),
    // an aorto-ostial lesion has no proximal reference: the distal reference stands in
    proxRefLumen: l.ostial ? lumen(l, l.segmentMm) : lumen(l, 0),
    proxRefEem: l.ostial ? eem(l, l.segmentMm) : eem(l, 0),
    landingProx,
    landingDist,
    calcium: c
      ? {
          arcDeg: c.arcDeg,
          // IVUS cannot see through calcium (acoustic shadow), so thickness is not measurable
          thicknessMm: modality === "OCT" ? c.thicknessMm : null,
          lengthMm: c.lengthMm,
          fujino: modality === "OCT" ? fujino(c) : null,
          nodule: c.nodule,
        }
      : undefined,
    lipid: l.lipidArcDeg
      ? modality === "OCT"
        ? `lipid pool over ${l.lipidArcDeg}° with a thin fibrous cap`
        : `attenuated plaque over ${l.lipidArcDeg}°`
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Devices: the PCI equipment catalogue (src/simulation/pci/equipment.ts)
// ---------------------------------------------------------------------------
export const BALLOON_KINDS: readonly BalloonKind[] = ["semi-compliant", "non-compliant", "scoring", "ivl"];

/** The catalogue entry the bench uses for each balloon kind (the kind's first entry, as the PCI lab's deviceFor finds it). */
export function benchBalloonDevice(kind: BalloonKind): DeviceSpec {
  return deviceFor("balloon", kind);
}

/** The drug-eluting stent of the catalogue. */
export const BENCH_STENT_DEVICE: DeviceSpec = DEVICE_BY_ID.des;

/** Reference diameter at which the single-number fields of BALLOON_SPEC and STENT_SPEC are read (mm). */
const SPEC_REF_D = 3.0;

export interface BalloonSpecSummary {
  nominalAtm: number;
  rbpAtm: number;
  /** mean growth per atm between nominal and rated burst pressure at 3.0 mm (mm/atm), read from the chart */
  mmPerAtm: number;
  label: string;
}

function summarise(spec: DeviceSpec, label: string): BalloonSpecSummary {
  const nominalAtm = spec.nominalAtm(SPEC_REF_D);
  const rbpAtm = spec.rbpAtm(SPEC_REF_D);
  const span = rbpAtm - nominalAtm;
  const mmPerAtm = span > 0 ? (chartDiameter(spec, SPEC_REF_D, rbpAtm) - chartDiameter(spec, SPEC_REF_D, nominalAtm)) / span : 0;
  return { nominalAtm, rbpAtm, mmPerAtm, label };
}

/**
 * Nominal and rated burst pressures and the label of each balloon kind, derived from the catalogue (read at
 * 3.0 mm; balloonPressures gives them at any diameter). AngioPci displays these, and the bench and the PCI
 * engine apply the same catalogue charts, so displayed and applied pressures agree.
 */
export const BALLOON_SPEC: Record<BalloonKind, BalloonSpecSummary> = Object.fromEntries(
  BALLOON_KINDS.map((k) => {
    const spec = benchBalloonDevice(k);
    return [k, summarise(spec, spec.label)];
  })
) as Record<BalloonKind, BalloonSpecSummary>;

/** The stent's nominal and rated burst pressures (read at 3.0 mm; stentPressures gives them at any diameter). */
export const STENT_SPEC: Omit<BalloonSpecSummary, "label"> = (({ label: _label, ...rest }) => rest)(summarise(BENCH_STENT_DEVICE, BENCH_STENT_DEVICE.label));

/** Nominal and rated burst pressures of a balloon kind at a nominal diameter (from the catalogue). */
export function balloonPressures(kind: BalloonKind, nominal: number): { nominalAtm: number; rbpAtm: number } {
  const spec = benchBalloonDevice(kind);
  return { nominalAtm: spec.nominalAtm(nominal), rbpAtm: spec.rbpAtm(nominal) };
}

/** Nominal and rated burst pressures of the stent at a nominal diameter (from the catalogue). */
export function stentPressures(nominal: number): { nominalAtm: number; rbpAtm: number } {
  return { nominalAtm: BENCH_STENT_DEVICE.nominalAtm(nominal), rbpAtm: BENCH_STENT_DEVICE.rbpAtm(nominal) };
}

/**
 * Maximum post-dilatation diameter of the stent: the platform's labelled post-dilatation limit for the size
 * ("Do not dilate beyond" on the box; src/simulation/bench/platforms.ts). Without a platform it is platform A,
 * the catalogue's drug-eluting stent, whose limits are the catalogue's. Real limits are device-specific: check
 * the instructions for use.
 */
export function maxStentDiameter(nominal: number, platformId?: string | null): number {
  if (!platformId) {
    const limit = BENCH_STENT_DEVICE.dilatationLimit;
    if (!limit) throw new Error(`pciBench: the catalogue stent "${BENCH_STENT_DEVICE.id}" has no dilatation limit`);
    return limit(nominal);
  }
  return platformFor(platformId).limit(nominal);
}

/** The platform of a stent (platform A, the catalogue's, when none was chosen). */
export function stentPlatform(stent: Pick<Stent, "platformId">): StentPlatform {
  return platformFor(stent.platformId);
}

/** Diameter of a balloon at a pressure, from its catalogue compliance chart. */
export function balloonDiameter(kind: BalloonKind, nominal: number, atm: number): number {
  return chartDiameter(benchBalloonDevice(kind), nominal, atm);
}

/** Diameter of the stent at a deployment pressure, from its catalogue compliance chart. */
export function stentDiameter(nominal: number, atm: number): number {
  return chartDiameter(BENCH_STENT_DEVICE, nominal, atm);
}

/** Sizes the catalogue offers: balloon diameters of a kind, and the stent's diameters and lengths. */
export function balloonSizes(kind: BalloonKind): number[] {
  return benchBalloonDevice(kind).diameters.slice();
}
export const STENT_DIAMETERS: readonly number[] = BENCH_STENT_DEVICE.diameters.slice();
export const STENT_LENGTHS: readonly number[] = BENCH_STENT_DEVICE.lengths.slice();
/** Rotational atherectomy burr sizes (mm), from the catalogue. */
export const BURR_SIZES: readonly number[] = [...BURR_SIZES_MM];

/**
 * The device sizes a reference allows by Brilakis's imaging rules (pm-imaging-planning, Brilakis 13.3 and
 * 10.2): a lumen-based diameter is the lumen rounded up by 0.25 mm, an EEM-based one the EEM rounded down by
 * 0.25 mm. The module reads the rule both ways (the size nearest to lumen + 0.25 or EEM − 0.25, or the next
 * size up from the lumen or down from the EEM), so every size either reading gives is accepted. `eemMm` is
 * null where the EEM cannot be seen. `sizes` are the catalogue's (STENT_DIAMETERS, or a balloon's sizes).
 */
export function sizesForReference(lumenMm: number, eemMm: number | null, sizes: readonly number[]): number[] {
  const sorted = [...sizes].sort((a, b) => a - b);
  const out = new Set<number>();
  const nearest = (t: number) => {
    const best = Math.min(...sorted.map((s) => Math.abs(s - t)));
    for (const s of sorted) if (Math.abs(Math.abs(s - t) - best) < 1e-6) out.add(s);
  };
  nearest(lumenMm + 0.25);
  const up = sorted.find((s) => s > lumenMm + 1e-6);
  if (up !== undefined) out.add(up);
  if (eemMm !== null) {
    nearest(eemMm - 0.25);
    const down = [...sorted].reverse().find((s) => s < eemMm - 1e-6);
    if (down !== undefined) out.add(down);
  }
  return [...out].sort((a, b) => a - b);
}

/** The largest lumen and EEM within 10 mm beyond a position (the reference deploy() judges a stent edge against). */
export function referenceBeyond(l: BenchLesion, fromMm: number, toMm: number): { lumen: number; eem: number; at: number } {
  let best = { lumen: 0, eem: 0, at: fromMm };
  const a = Math.max(l.ostial ? l.ostial.aortaMm : 0, Math.min(fromMm, toMm));
  const b = Math.min(l.segmentMm, Math.max(fromMm, toMm));
  for (let x = a; x <= b + 1e-9; x += 0.25) {
    const lu = lumen(l, x);
    if (lu > best.lumen) best = { lumen: lu, eem: eem(l, x), at: x };
  }
  if (best.lumen === 0) {
    const x = Math.max(0, Math.min(l.segmentMm, fromMm));
    best = { lumen: lumen(l, x), eem: eem(l, x), at: x };
  }
  return best;
}

/**
 * Contrast of one OCT run (mL): the flush, at the module's typical injector settings of 4 mL/s for 4 s in the
 * left coronary artery and 3 mL/s for 3 s in the right (pm-imaging-oct, Brilakis). IVUS needs no flush.
 */
export const OCT_RUN_CONTRAST_ML = { left: 4 * 4, right: 3 * 3 } as const;

/** The imaging contrast of a number of runs (mL): OCT runs flush with contrast, IVUS runs need none. */
export function imagingContrastMl(l: BenchLesion, modality: Modality, runs: number): number {
  if (modality !== "OCT") return 0;
  return Math.max(0, runs) * (l.vessel === "RCA" ? OCT_RUN_CONTRAST_ML.right : OCT_RUN_CONTRAST_ML.left);
}

// ---------------------------------------------------------------------------
// Procedure state
// ---------------------------------------------------------------------------
/** A vessel under 2.5 mm is small (cp-other-complex-vessel-size, Brilakis 22.3). */
export const SMALL_VESSEL_REF_MM = 2.5;

export type PrepAction =
  | { kind: "balloon"; balloon: BalloonKind; diameter: number; atm: number; fromMm?: number; lengthMm?: number }
  | { kind: "ivl"; diameter: number; cycles: number; fromMm?: number; lengthMm?: number }
  | { kind: "rota"; burrMm: number };

export interface Stent {
  diameter: number;
  lengthMm: number;
  /** proximal edge position (mm from segment start) */
  proxEdge: number;
  atm: number;
  /** the platform (src/simulation/bench/platforms.ts); platform A, the catalogue's stent, when absent */
  platformId?: string;
  /** rapid pacing during deployment, which stops the stent swinging with each beat */
  rapidPacing?: boolean;
}

export interface PostDil {
  diameter: number;
  atm: number;
  /**
   * "full" = whole stent; "proximal" = proximal optimisation of the proximal half; "flare" = an ostial stent's
   * protruding end, with a short balloon half in the aorta (cp-ostial-stent: a short, 6-8 mm, oversized balloon)
   */
  where: "full" | "proximal" | "flare";
}

/** A segment the procedure injured, which the stent must cover (pm-prep-and-stent-deploy, Brilakis 10.2.3). */
export interface InjuredSegment {
  fromMm: number;
  toMm: number;
  cause: "predilatation" | "dissection";
  label: string;
}

export type EventKind = "perforation" | "dissection" | "no-reflow" | "balloon-rupture" | "burr-stall" | "underexpanded-balloon" | "stent-overdilated";

export interface BenchEvent {
  kind: EventKind;
  severity: "minor" | "major";
  text: string;
  /** where it happened, for the images: at the lesion, or at a stent edge */
  where?: "lesion" | "prox-edge" | "dist-edge";
}

export interface BenchState {
  /** calcium modification 0 (untouched) … 1 (fully modified) */
  mod: number;
  /** lumen gain from preparation at the MLA site (mm) */
  prepDiameter: number;
  events: BenchEvent[];
  ivlPulses: number;
  /** segments injured by balloons whose position and length were recorded, and the dissections they caused */
  injured?: InjuredSegment[];
  /** intracoronary nitroglycerin given */
  nitrate?: boolean;
}

export function initialState(): BenchState {
  return { mod: 0, prepDiameter: 0, events: [], ivlPulses: 0, injured: [] };
}

/** Nitroglycerin given: the vessel shows its true size (cp-other-complex-vessel-size, Brilakis 22.3). */
export function giveNitrate(s: BenchState): BenchState {
  return { ...s, nitrate: true };
}

/** The reference diameter the angiogram shows (mm): smaller before nitroglycerin where the lesion has spasm. */
export function angiographicReferenceMm(l: BenchLesion, s?: Pick<BenchState, "nitrate"> | null): number {
  if (l.spasm) return s?.nitrate ? l.spasm.afterNitrateRefMm : l.spasm.angioRefMm;
  return lumen(l, l.segmentMm);
}

/** How far a dissection from an oversized balloon runs beyond the balloon's distal end (mm) — MODEL PARAMETER. */
export const MP_DISSECTION_EXTENSION_MM = 5;

/** Every segment the stent must cover: the scenario's recorded predilatation and the procedure's injured segments. */
export function injuredSegments(l: BenchLesion, s?: Pick<BenchState, "injured"> | null): InjuredSegment[] {
  const out: InjuredSegment[] = [];
  if (l.predilatation) out.push({ fromMm: l.predilatation.fromMm, toMm: l.predilatation.toMm, cause: "predilatation", label: l.predilatation.label });
  for (const seg of s?.injured ?? []) out.push(seg);
  return out;
}

/** How much the wall resists expansion at x, 0 (none) … 0.6 (heavy untreated calcium). */
export function resistance(l: BenchLesion, x: number, mod: number): number {
  const c = calciumAt(l, x);
  if (!c) return l.plaque === "fibrous" && plaqueBurden(l, x) > 0.6 ? 0.06 : 0.02;
  const arcF = Math.min(1, c.arc / 360);
  const thickF = Math.min(1, c.thickness / 1.0);
  const raw = 0.6 * arcF * (0.5 + 0.5 * thickF) * (c.arc > 180 ? 1 : 0.6);
  const nodule = l.calcium?.nodule ? 0.08 : 0;
  return (raw + nodule) * (1 - mod);
}

/** Maximum achievable diameter at x for a device of diameter d. */
export function achievable(l: BenchLesion, x: number, d: number, mod: number): number {
  return d * (1 - resistance(l, x, mod));
}

/** The segment a balloon covered, when its proximal end and length were recorded. */
function balloonRange(l: BenchLesion, a: PrepAction): { fromMm: number; toMm: number } | null {
  if (a.kind === "rota" || a.fromMm === undefined || a.lengthMm === undefined) return null;
  const fromMm = Math.max(0, a.fromMm);
  return { fromMm, toMm: Math.min(l.segmentMm, a.fromMm + Math.max(0, a.lengthMm)) };
}

/**
 * Record what a preparation step injured: the balloon's own segment when its position and length are known,
 * and a dissection a balloon caused, which runs MP_DISSECTION_EXTENSION_MM beyond the balloon and must be covered
 * by a longer stent (cp-other-complex-vessel-size: an oversized balloon causes dissections that need longer
 * stents). Only a balloon whose segment was recorded adds a dissected segment: without its position the
 * dissection stays an event only, as before, and atherectomy's 'dissection' penalty records no segment.
 */
function recordInjury(l: BenchLesion, before: BenchState, ns: BenchState, a: PrepAction): void {
  const injured = [...(before.injured ?? [])];
  const range = balloonRange(l, a);
  const dev = a.kind === "balloon" ? `${BALLOON_SPEC[a.balloon].label.toLowerCase()} ${a.diameter.toFixed(2)} mm` : a.kind === "ivl" ? `lithotripsy balloon ${a.diameter.toFixed(2)} mm` : "rotational atherectomy";
  if (range) injured.push({ ...range, cause: "predilatation", label: `${dev}, ${(range.toMm - range.fromMm).toFixed(0)} mm long` });
  const dissected = ns.events.slice(before.events.length).some((e) => e.kind === "dissection" && e.where === "lesion");
  if (dissected && a.kind === "balloon" && range)
    injured.push({ fromMm: range.fromMm, toMm: Math.min(l.segmentMm, range.toMm + MP_DISSECTION_EXTENSION_MM), cause: "dissection", label: `dissection from the ${dev}` });
  ns.injured = injured;
}

export function applyPrep(l: BenchLesion, s: BenchState, a: PrepAction): BenchState {
  const ns = applyPrepEvents(l, s, a);
  recordInjury(l, s, ns, a);
  return ns;
}

function applyPrepEvents(l: BenchLesion, s: BenchState, a: PrepAction): BenchState {
  const ns: BenchState = { ...s, events: [...s.events] };
  const pre = preImaging(l, "IVUS");
  const ref = (pre.distRefLumen + pre.proxRefLumen) / 2;
  const refEem = (pre.distRefEem + pre.proxRefEem) / 2;
  const x = pre.mlaAt;
  const hasCa = !!l.calcium;
  const ca = calciumAt(l, x);
  const lipid = (l.lipidArcDeg ?? 0) > 120;

  if (a.kind === "rota") {
    const ratio = a.burrMm / ref;
    if (!hasCa)
      ns.events.push({
        kind: "dissection",
        severity: "minor",
        text:
          pre.distRefLumen < SMALL_VESSEL_REF_MM
            ? "Rotational atherectomy in a small, non-calcified vessel adds risk without benefit: atherectomy is generally avoided in vessels under 2.5 mm (Brilakis 22.3)."
            : "Rotational atherectomy in a non-calcified vessel adds risk without benefit.",
        where: "lesion",
      });
    if (ratio > 0.7) ns.events.push({ kind: "perforation", severity: "major", text: `Burr-to-artery ratio ${ratio.toFixed(2)} (> 0.7): perforation.` });
    else if (ratio > 0.6) ns.events.push({ kind: "burr-stall", severity: "minor", text: `Burr-to-artery ratio ${ratio.toFixed(2)}: decelerations and slow flow; 0.4–0.6 is the usual target.` });
    if (lipid) ns.events.push({ kind: "no-reflow", severity: "minor", text: "Debris from a lipid-rich segment: transient slow flow." });
    if (hasCa) ns.mod = Math.min(0.95, ns.mod + (ratio >= 0.4 ? 0.45 : 0.25));
    ns.prepDiameter = Math.max(ns.prepDiameter, a.burrMm);
    return ns;
  }

  if (a.kind === "ivl") {
    const d = balloonDiameter("ivl", a.diameter, 4);
    const ratio = a.diameter / ref;
    const pulses = a.cycles * 10;
    ns.ivlPulses += pulses;
    if (ratio < 0.85) ns.events.push({ kind: "underexpanded-balloon", severity: "minor", text: "Undersized lithotripsy balloon: poor wall contact, little energy transfer to the calcium." });
    if (ns.ivlPulses > 80) ns.events.push({ kind: "balloon-rupture", severity: "minor", text: "More than 80 pulses delivered in one segment exceeds the usual limit for one catheter." });
    if (hasCa) ns.mod = Math.min(0.95, ns.mod + (ratio >= 0.85 ? 0.12 * a.cycles : 0.04 * a.cycles));
    ns.prepDiameter = Math.max(ns.prepDiameter, achievable(l, x, d, ns.mod));
    return ns;
  }

  // balloons
  const spec = { ...BALLOON_SPEC[a.balloon], ...balloonPressures(a.balloon, a.diameter) };
  const d = balloonDiameter(a.balloon, a.diameter, a.atm);
  if (a.atm > spec.rbpAtm) {
    ns.events.push({
      kind: "balloon-rupture",
      severity: hasCa && ns.mod < 0.4 ? "major" : "minor",
      text: `${spec.label} inflated above its rated burst pressure (${spec.rbpAtm} atm)${hasCa && ns.mod < 0.4 ? ": pinhole rupture against calcium causes a dissection" : ""}.`,
      where: "lesion",
    });
  }
  const reached = achievable(l, x, d, ns.mod);
  if (reached < d * 0.85) ns.events.push({ kind: "underexpanded-balloon", severity: "minor", text: `Balloon would not expand fully at the lesion (dog-boning): ${reached.toFixed(2)} of ${d.toFixed(2)} mm.` });
  if (d / refEem > 1.1 && reached > d * 0.95) ns.events.push({ kind: "perforation", severity: "major", text: `Balloon ${d.toFixed(2)} mm exceeds the vessel (EEM ${refEem.toFixed(1)} mm): perforation.` });
  else if (d / ref > 1.15 && a.balloon === "semi-compliant") ns.events.push({ kind: "dissection", severity: "minor", text: "Oversized semi-compliant predilatation: dissection at the lesion edge.", where: "lesion" });
  if (lipid && d / ref >= 1.0 && a.atm >= spec.nominalAtm) ns.events.push({ kind: "no-reflow", severity: "minor", text: "Aggressive predilatation of a lipid-rich plaque: slow flow." });
  if (hasCa && ca) {
    if (a.balloon === "scoring") ns.mod = Math.min(0.95, ns.mod + 0.2);
    else if (a.balloon === "non-compliant" && a.atm >= 18) ns.mod = Math.min(0.95, ns.mod + (ca.arc < 270 ? 0.12 : 0.06));
  }
  ns.prepDiameter = Math.max(ns.prepDiameter, reached);
  return ns;
}

// ---------------------------------------------------------------------------
// Stenting and final assessment
// ---------------------------------------------------------------------------
/** What the debrief names after deployment, beyond the events: each with the tip and lesson that teach it. */
export type BenchFindingId = "injured-uncovered" | "deployed-moving" | "overexpansion" | "ostium-missed" | "overhang" | "recoil" | "underexpansion-waist";

export interface BenchFinding {
  id: BenchFindingId;
  text: string;
  tipId: string;
  lessonId: string;
}

/** An aorto-ostial stent's position against the ostium. */
export interface OstialResult {
  /** length of stent in the aorta (mm; 0 when it stops at or inside the ostium) */
  protrusionMm: number;
  /** gap between the ostium and the stent's proximal edge (mm; 0 when the ostium is covered) */
  gapMm: number;
  /** IVUS shows the ostium covered */
  ivusCovered: boolean;
  /** a check angiogram would look complete: covered, or short by no more than the balloon shoulder that dilated the ostium */
  angiographicallyCovered: boolean;
  /** protrusion beyond the 1-2 mm target */
  overhang: boolean;
  /** a flaring inflation was given with the balloon half in the aorta */
  flared: boolean;
  /** more than half the stent protrudes (the one case in which snaring may be considered) */
  overHalfProtrudes: boolean;
}

export interface StentResult {
  /** achieved stent diameter along the stent (acuteD: before recoil, where the lesion recoils) */
  profile: { x: number; d: number; lumen: number; eem: number; apposition: number; acuteD?: number }[];
  msa: number;
  msaAt: number;
  /** worse of the proximal-half and distal-half expansion, % */
  expansion: number;
  expansionProx: number;
  expansionDist: number;
  /** MSA ÷ average of proximal and distal reference lumen areas (EAPCI 2018 definition), % */
  expansionAvg: number;
  maxMalapposition: number; // mm axial distance
  /** proximal edge plaque burden; 0 for an ostial stent that covers the ostium (it has no coronary proximal edge) */
  proxEdgePB: number;
  distEdgePB: number;
  geographicMiss: boolean;
  /** for an ostial lesion, whether the stent reaches the ostium (true for any other lesion) */
  ostiumCovered: boolean;
  events: BenchEvent[];
  criteria: { label: string; ok: boolean }[];
  score: number;
  /** the deployed stent, ring by ring (stentGeometry.deployStent), for the images */
  geom: StentGeom;
  /** stent extent (mm from the segment start) */
  x0: number;
  x1: number;
  /** the stent sizes the distal reference beyond the stent allows (sizesForReference) */
  distalSizes: number[];
  /** contrast given for the imaging runs (mL): the OCT flushes, none for IVUS */
  imagingContrastMl: number;
  /** the platform deployed and its labelled post-dilatation limit for the size (mm) */
  platformId: string;
  limitMm: number;
  /** how far cardiac motion displaced the stent from where it was placed (mm, + distal) */
  motionShiftMm: number;
  /** every segment the stent had to cover, and those it left uncovered (part of the geographic miss) */
  injured: InjuredSegment[];
  injuredUncovered: InjuredSegment[];
  /** the largest post-dilatation beyond the platform's labelled limit, or null */
  overexpansion: PostDilatationCheck | null;
  /** an aorto-ostial stent against the ostium, or null for any other lesion */
  ostial: OstialResult | null;
  /** largest diameter lost to recoil after deployment (mm) */
  recoilMm: number;
  /** why the stent is underexpanded: a waist that never opened, or recoil after it opened; null when expanded */
  underexpansion: "waist" | "recoil" | null;
  findings: BenchFinding[];
}

/** The stent balloon's shoulder beyond the stent end, which dilates an uncovered ostium on deployment (mm) — MODEL PARAMETER. */
export const MP_BALLOON_SHOULDER_MM = 2;
/** The aorto-ostial target: the stent just protruding, 1-2 mm into the aorta (cp-ostial-stent, Brilakis 15.1.10). */
export const OSTIAL_PROTRUSION_MM = { min: 1, max: 2 } as const;
/** Half the length of the short (6-8 mm) flaring balloon, inflated half in the aorta (cp-ostial-stent): its reach either side of the ostium (mm). */
export const FLARE_HALF_MM = 4;
/** Diameter lost after deployment above which the recoil counts (mm) — MODEL PARAMETER. */
export const MP_RECOIL_SIGNIFICANT_MM = 0.25;

export interface DeployOptions {
  /**
   * imaging runs of the case, before and after the stent (default 2: one pullback before and one after).
   * Without it, result.imagingContrastMl is that default estimate; a screen that records its runs passes
   * their number (the plan record's runs + the final pullback), as the bench debrief counts them.
   */
  imagingRuns?: number;
}

export function deploy(l: BenchLesion, st: BenchState, stent: Stent, post: PostDil[], modality: Modality, opts: DeployOptions = {}): StentResult {
  const events = [...st.events];
  const platform = stentPlatform(stent);
  // a stent that swings with each beat lands displaced from where it was placed, unless rapid pacing stops it
  // (pm-prep-and-stent-deploy, cp-ostial-stent); the amplitude and direction are the lesion's MODEL PARAMETERS
  const motionShiftMm = l.motion && !stent.rapidPacing ? (l.motion.towards === "distal" ? 1 : -1) * l.motion.amplitudeMm : 0;
  const placed = stent.proxEdge + motionShiftMm;
  const x0 = Math.max(0, placed);
  const x1 = Math.min(l.segmentMm, placed + stent.lengthMm);
  const maxD = platform.limit(stent.diameter);
  const flareAt = l.ostial ? l.ostial.aortaMm : x0;
  const recoilFactor = MP_RADIAL_STRENGTH_RECOIL_FACTOR[platform.radialStrength];
  let recoilMm = 0;
  const stentRbp = stentPressures(stent.diameter).rbpAtm;
  if (stent.atm > stentRbp) events.push({ kind: "balloon-rupture", severity: "minor", text: `Stent delivery balloon taken above RBP (${stentRbp} atm).` });
  let postRupture = false;
  // the largest post-dilatation balloon taken beyond the stent's labelled dilatation limit (the stent is held at the limit)
  let overDilatedMm = 0;

  // severe untreated calcium can stop a stent being delivered or expanded at all
  const sev = l.calcium ? resistance(l, l.calcium.startMm + l.calcium.lengthMm / 2, st.mod) : 0;

  const profile: StentResult["profile"] = [];
  let msa = Infinity,
    msaAt = x0,
    perforated = false;
  for (let x = x0; x <= x1 + 1e-9; x += 0.25) {
    const lum = lumen(l, x);
    const e = eem(l, x);
    // the part of an ostial stent that protrudes into the aorta stands free in a lumen far wider than the
    // stent: it cannot perforate, is not malapposition and is not part of the stent's expansion
    const aortic = inAorta(l, x);
    const noCalcium = !calciumAt(l, x) && !aortic;
    let d = achievable(l, x, stentDiameter(stent.diameter, stent.atm), st.mod);
    for (const p of post) {
      const inZone = p.where === "full" || (p.where === "proximal" ? x <= (x0 + x1) / 2 : Math.abs(x - flareAt) <= FLARE_HALF_MM);
      if (!inZone) continue;
      const pd = balloonDiameter("non-compliant", p.diameter, p.atm);
      d = Math.max(d, achievable(l, x, Math.min(pd, maxD), st.mod));
      if (p.atm > balloonPressures("non-compliant", p.diameter).rbpAtm) postRupture = true;
      // the labelled limit applies to the stent in the vessel; struts flared in the aorta are not post-dilated against a
      // wall, and an ostial flare with a short oversized balloon is the taught technique (cp-ostial-troubleshoot), so
      // it is not counted as overdilatation (the stent itself is still held at its limit above)
      if (!aortic && p.where !== "flare" && pd > maxD + 1e-6) overDilatedMm = Math.max(overDilatedMm, pd);
      // the balloon itself, as far as the wall lets it open, can tear the vessel even where the stent stops at its limit
      if (!aortic && achievable(l, x, pd, st.mod) > e * 1.12 && noCalcium) perforated = true;
    }
    d = Math.min(d, maxD);
    if (!aortic && d > e * 1.12 && noCalcium) perforated = true;
    // elastic recoil: the wall takes back a share of the acute gain after deployment, less with a platform of
    // strong radial strength (cp-ostial-troubleshoot); post-dilatation does not stop it recurring
    const acuteD = d;
    if (!aortic && l.recoil && x >= l.recoil.fromMm - 1e-9 && x <= l.recoil.toMm + 1e-9) {
      const loss = l.recoil.fraction * recoilFactor * Math.max(0, d - lum);
      d -= loss;
      recoilMm = Math.max(recoilMm, loss);
    }
    // apposition here is concentric (lumen - d) / 2; it is set from the stent's rings below
    profile.push({ x, d, lumen: lum, eem: e, apposition: Math.max(0, (lum - d) / 2), ...(acuteD !== d ? { acuteD } : {}) });
    if (aortic) continue;
    const a = area(Math.max(d, 0));
    if (a < msa) {
      msa = a;
      msaAt = x;
    }
  }
  if (postRupture) events.push({ kind: "balloon-rupture", severity: "minor", text: "Post-dilatation balloon above its rated burst pressure." });
  // MODEL PARAMETER: the severity (minor) of post-dilatation beyond the labelled limit; the limit is the platform's
  const overexpansion = overDilatedMm > 0 ? checkPostDilatation(platform, stent.diameter, overDilatedMm) : null;
  if (overexpansion)
    events.push({
      kind: "stent-overdilated",
      severity: "minor",
      text: `Post-dilatation beyond the stent's labelled dilatation limit (${platform.label}, ${stent.diameter.toFixed(2)} mm): balloon ${overDilatedMm.toFixed(2)} mm, limit ${maxD.toFixed(2)} mm.`,
    });
  if (perforated) events.push({ kind: "perforation", severity: "major", text: "Stent or post-dilatation balloon expanded beyond the vessel wall (EEM): perforation.", where: "lesion" });

  // the stent ring by ring: each ring at the achieved diameter of its own position, over the native lumen.
  // Ring u is read at x0 + u × the stent's length, not across the span clipped to the segment end; a second
  // pass reads each ring at the centre the first pass placed it, since deployStent's length differs a little
  // from the label (rings past the segment end take the last profile diameter and are not imaged).
  const dAtX = (x: number) => {
    const xc = Math.max(x0, Math.min(x1, x));
    let best = profile[0];
    for (const p of profile) if (Math.abs(p.x - xc) < Math.abs(best.x - xc)) best = p;
    return best?.d ?? stent.diameter;
  };
  const lumenAtX = (x: number) => lumen(l, Math.max(0, Math.min(l.segmentMm, x)));
  const design = { design: platform.design };
  const first = deployStent(stent.diameter, stent.lengthMm, (u) => dAtX(x0 + u * stent.lengthMm), (u) => lumenAtX(x0 + u * stent.lengthMm), design);
  const n = first.rings.length;
  const ringX = (u: number) => {
    const r = first.rings[Math.max(0, Math.min(n - 1, Math.round(u * (n - 1))))];
    return r ? x0 + r.s0 + r.len / 2 : x0 + u * stent.lengthMm;
  };
  const geom = deployStent(stent.diameter, stent.lengthMm, (u) => dAtX(ringX(u)), (u) => lumenAtX(ringX(u)), design);
  // malapposition as the frames show it: the native lumen at each position against the ring there
  // (a ring keeps the diameter of its centre, so a ring that straddles a calcium edge stands off the wall)
  const layer = { fromMm: x0, toMm: x1, geom };
  let maxMal = 0;
  for (const p of profile) {
    if (inAorta(l, p.x)) {
      // protrusion into the aorta is not malapposition
      p.apposition = 0;
      continue;
    }
    const ring = stentRingAt(layer, p.x);
    p.apposition = Math.max(0, (p.lumen - (ring ? ring.d : p.d)) / 2);
    maxMal = Math.max(maxMal, p.apposition);
  }

  // an ostial stent that reaches the ostium (or protrudes into the aorta) has no coronary proximal edge: the
  // ostium is covered, so there is no proximal edge plaque burden and no proximal edge to dissect
  const ostiumCovered = l.ostial ? x0 <= l.ostial.aortaMm + 1e-9 : true;
  const noProxEdge = !!l.ostial && ostiumCovered;
  const proxEdgePB = noProxEdge ? 0 : plaqueBurden(l, x0);
  const distEdgePB = plaqueBurden(l, x1);
  const lesionCovered = x0 <= l.startMm && x1 >= l.endMm;
  // every injured segment must be covered too (its coronary part: an ostial predilatation may reach the aorta)
  const coronaryFrom = l.ostial ? l.ostial.aortaMm : 0;
  const injured = injuredSegments(l, st);
  const injuredUncovered = injured.filter((g) => Math.max(coronaryFrom, g.fromMm) < x0 - 1e-6 || Math.min(l.segmentMm, g.toMm) > x1 + 1e-6);
  const geographicMiss = !lesionCovered || injuredUncovered.length > 0;
  // an edge landed where plaque burden is over 50% or on the lipid pool dissects when the stent stretches it
  // (pm-imaging-planning, Brilakis 13.3: edges on such plaque tend to dissect); the severity is a MODEL PARAMETER
  const edgeDiss = (x: number, d: number): "plaque" | "lipid" | null => {
    if (d <= lumen(l, x)) return null;
    if (onLipid(l, x)) return "lipid";
    return plaqueBurden(l, x) > 0.5 ? "plaque" : null;
  };
  const edgeText = (which: "Proximal" | "Distal", why: "plaque" | "lipid") =>
    why === "lipid" ? `${which} edge landed on the lipid pool: edge dissection.` : `${which} edge landed in plaque and was stretched: edge dissection.`;
  const proxWhy = noProxEdge ? null : edgeDiss(x0, profile[0]?.d ?? 0);
  if (proxWhy) events.push({ kind: "dissection", severity: plaqueBurden(l, x0) > 0.6 ? "major" : "minor", text: edgeText("Proximal", proxWhy), where: "prox-edge" });
  const distWhy = edgeDiss(x1, profile[profile.length - 1]?.d ?? 0);
  if (distWhy) events.push({ kind: "dissection", severity: plaqueBurden(l, x1) > 0.6 ? "major" : "minor", text: edgeText("Distal", distWhy), where: "dist-edge" });
  // a stent larger than any size the distal reference allows (sizesForReference) overstretches the tapering
  // distal vessel: distal edge dissection (pm-imaging-planning: never size to the proximal reference). Judged on
  // the nominal diameter, the sizing decision; major when the stent exceeds the EEM at its distal edge (MODEL PARAMETER).
  const dRef = referenceBeyond(l, x1, x1 + 10);
  const distalSizes = sizesForReference(dRef.lumen, dRef.eem, platform.diameters);
  const maxDistal = distalSizes.length ? distalSizes[distalSizes.length - 1] : Infinity;
  if (!distWhy && stent.diameter > maxDistal + 1e-6)
    events.push({
      kind: "dissection",
      severity: stent.diameter > eem(l, x1) ? "major" : "minor",
      text: `Stent of ${stent.diameter.toFixed(2)} mm is larger than the distal reference allows (${maxDistal.toFixed(2)} mm): the distal edge dissected.`,
      where: "dist-edge",
    });
  const lesionEem = eem(l, (l.startMm + l.endMm) / 2);
  if ((l.lipidArcDeg ?? 0) > 120 && post.some((p) => balloonDiameter("non-compliant", p.diameter, p.atm) > lesionEem * 0.95))
    events.push({ kind: "no-reflow", severity: "major", text: "Aggressive post-dilatation over a large lipid pool: distal embolisation and no-reflow." });

  // EAPCI definition: MSA ÷ average reference lumen area (an aorto-ostial lesion has no proximal
  // reference, so the distal reference stands in, as in preImaging)
  const refArea = (area(lumen(l, l.ostial ? l.segmentMm : 0)) + area(lumen(l, l.segmentMm))) / 2;
  const expansionAvg = (100 * msa) / refArea;
  // Expansion of each half of the stent against its nearest reference lumen
  // (the largest lumen within 10 mm outside that edge), as in ILUMIEN-style
  // optimisation; fairer than a single average in tapering vessels and the left main.
  const coronaryStart = l.ostial ? l.ostial.aortaMm : 0;
  const maxLumen = (a: number, b: number) => {
    let m = 0;
    for (let x = Math.max(coronaryStart, a); x <= Math.min(l.segmentMm, b); x += 0.25) m = Math.max(m, lumen(l, x));
    return m || lumen(l, Math.min(l.segmentMm, Math.max(coronaryStart, a)));
  };
  const distRef = maxLumen(x1, x1 + 10);
  // an ostial stent's proximal half has no proximal reference: the distal reference stands in
  const proxRef = noProxEdge ? distRef : maxLumen(x0 - 10, x0);
  const mid = (x0 + x1) / 2;
  const half = (inProx: boolean) => {
    const pts = profile.filter((p) => !inAorta(l, p.x) && (inProx ? p.x <= mid : p.x > mid));
    if (pts.length === 0) return 100;
    return Math.min(...pts.map((p) => (100 * area(p.d)) / area(inProx ? proxRef : distRef)));
  };
  const expansionProx = half(true);
  const expansionDist = half(false);
  const expansion = Math.min(expansionProx, expansionDist);
  const majorEvents = events.filter((e) => e.severity === "major");
  // the shared EAPCI criteria (src/simulation/imaging/criteria.ts), then the bench's own two
  const imaging = optimisationCriteria(
    { msa, expansionPct: expansion, maxMalappositionMm: maxMal, proxEdgePb: proxEdgePB, distEdgePb: distEdgePB },
    { leftMain: l.leftMain, leftMainSegment: benchLeftMainSegment(l), modality },
    EXPANSION_HALVES_LABEL
  );
  const ostial: OstialResult | null = l.ostial
    ? (() => {
        const protrusionMm = Math.max(0, l.ostial!.aortaMm - x0);
        const gapMm = Math.max(0, x0 - l.ostial!.aortaMm);
        return {
          protrusionMm,
          gapMm,
          ivusCovered: ostiumCovered,
          angiographicallyCovered: gapMm <= MP_BALLOON_SHOULDER_MM + 1e-9,
          overhang: protrusionMm > OSTIAL_PROTRUSION_MM.max + 1e-9,
          flared: post.some((p) => p.where === "flare"),
          overHalfProtrudes: protrusionMm > stent.lengthMm / 2,
        };
      })()
    : null;
  const recoiled = recoilMm > MP_RECOIL_SIGNIFICANT_MM;
  const underexpansion: StentResult["underexpansion"] = expansion < EXPANSION_MIN_PCT ? (recoiled ? "recoil" : "waist") : null;
  const criteria = [
    ...imaging.map((c) => ({ label: c.label, ok: c.ok })),
    { label: injured.length ? "Lesion and every injured segment covered (no geographic miss)" : "Whole lesion covered (no geographic miss)", ok: !geographicMiss },
    // an aorto-ostial stent must cover the ostium (pm-imaging-planning: the stent just protruding into the aorta); a
    // stent that stops short still looks treated on the check angiogram (cp-ostial-troubleshoot)
    ...(ostial
      ? [
          {
            label: `Ostium covered (stent reaches the aorta)${!ostial.ivusCovered && ostial.angiographicallyCovered ? ": the check angiogram looked complete, IVUS shows the gap" : ""}`,
            ok: ostiumCovered,
          },
          { label: `Overhang into the aorta no more than ${OSTIAL_PROTRUSION_MM.max} mm, or flared`, ok: !ostial.overhang || ostial.flared },
        ]
      : []),
    ...(l.recoil ? [{ label: "No acute recoil (the stent held its diameter)", ok: !recoiled }] : []),
    ...(l.motion ? [{ label: "Deployed with the stent steady (rapid pacing while it swung)", ok: motionShiftMm === 0 }] : []),
    { label: "No major complication", ok: majorEvents.length === 0 },
  ];
  const findings = benchFindings(l, { platform, stent, motionShiftMm, injuredUncovered, overexpansion, ostial, recoiled, recoilMm, underexpansion });
  const minor = events.filter((e) => e.severity === "minor").length;
  const score = Math.max(0, Math.round((100 * criteria.filter((c) => c.ok).length) / criteria.length - 5 * minor - (sev > 0.25 ? 10 : 0)));
  return {
    profile,
    msa,
    msaAt,
    expansion,
    expansionProx,
    expansionDist,
    expansionAvg,
    maxMalapposition: maxMal,
    proxEdgePB,
    distEdgePB,
    geographicMiss,
    ostiumCovered,
    events,
    criteria,
    score,
    geom,
    x0,
    x1,
    distalSizes,
    imagingContrastMl: imagingContrastMl(l, modality, opts.imagingRuns ?? 2),
    platformId: platform.id,
    limitMm: maxD,
    motionShiftMm,
    injured,
    injuredUncovered,
    overexpansion,
    ostial,
    recoilMm,
    underexpansion,
    findings,
  };
}

/** The debrief's findings of a deployment, each with the tip and lesson that teach it. */
function benchFindings(
  l: BenchLesion,
  r: {
    platform: StentPlatform;
    stent: Stent;
    motionShiftMm: number;
    injuredUncovered: InjuredSegment[];
    overexpansion: PostDilatationCheck | null;
    ostial: OstialResult | null;
    recoiled: boolean;
    recoilMm: number;
    underexpansion: StentResult["underexpansion"];
  }
): BenchFinding[] {
  const out: BenchFinding[] = [];
  const mm = (x: number) => x.toFixed(1);
  for (const g of r.injuredUncovered)
    out.push({
      id: "injured-uncovered",
      text: `Geographic miss: the ${g.cause === "dissection" ? "dissected" : "predilated"} segment ${mm(g.fromMm)}-${mm(g.toMm)} mm (${g.label}) is not fully covered by the stent.`,
      tipId: "pci-stent-cover-injured-segment",
      lessonId: "pm-prep-and-stent-deploy",
    });
  if (r.motionShiftMm !== 0)
    out.push({
      id: "deployed-moving",
      text: `Deployed while the stent swung with each beat: it landed ${mm(Math.abs(r.motionShiftMm))} mm ${r.motionShiftMm > 0 ? "distal" : "proximal"} to where it was placed. Deploy once the position is stable; when the stent swings a lot, rapid pacing steadies it (Brilakis 10.2).`,
      tipId: "pci-stent-cardiac-motion",
      lessonId: "pm-prep-and-stent-deploy",
    });
  if (r.overexpansion)
    out.push({
      id: "overexpansion",
      text: `${r.platform.label}'s ${r.stent.diameter.toFixed(2)} mm stent is labelled to ${r.overexpansion.limitMm.toFixed(2)} mm; it was post-dilated with a ${r.overexpansion.balloonMm.toFixed(2)} mm balloon. Choose a platform whose limit reaches the proximal reference before sizing to the distal one.`,
      tipId: l.leftMain ? "pci-lm-stent-expansion-limit" : "pci-ocx-stent-expansion-limit",
      lessonId: l.leftMain ? "cp-left-main-technique" : "cp-other-complex-vessel-size",
    });
  if (r.ostial && !r.ostial.ivusCovered)
    out.push({
      id: "ostium-missed",
      text: `The stent stops ${mm(r.ostial.gapMm)} mm short of the ostium${r.ostial.angiographicallyCovered ? ", although the check angiogram looks complete: the balloon shoulder dilated the true ostium" : ""}. Cover it with another stent.`,
      tipId: "pci-ostial-missed-ostium",
      lessonId: "cp-ostial-troubleshoot",
    });
  if (r.ostial && r.ostial.overhang)
    out.push({
      id: "overhang",
      text: `${mm(r.ostial.protrusionMm)} mm of stent overhangs into the aorta (target ${OSTIAL_PROTRUSION_MM.min}-${OSTIAL_PROTRUSION_MM.max} mm)${r.ostial.flared ? "; it was flared" : ": flare it with a short oversized balloon half in the aorta"}${r.ostial.overHalfProtrudes ? ". More than half the stent protrudes, the one case in which snaring may be considered" : ""}.`,
      tipId: "pci-ostial-overhang-flare",
      lessonId: "cp-ostial-troubleshoot",
    });
  if (r.recoiled)
    out.push({
      id: "recoil",
      text: `The stent opened and then recoiled, losing up to ${r.recoilMm.toFixed(2)} mm of diameter at the ostium. Post-dilate again and wait; if it recoils again, a stent with strong radial strength can be placed inside it.`,
      tipId: "pci-ostial-recoil",
      lessonId: "cp-ostial-troubleshoot",
    });
  if (r.ostial && r.underexpansion === "waist")
    out.push({
      id: "underexpansion-waist",
      text: "A waist that never opened: underexpansion of the fibrotic, calcified ostium, treated as a balloon-undilatable lesion, not with a second stent.",
      tipId: "pci-ostial-stent-underexpanded",
      lessonId: "cp-ostial-troubleshoot",
    });
  return out;
}

/**
 * The planned stent as the screens draw it before deployment: its extent along the pullback, its nominal
 * diameter and its platform's marker bands (stentGeometry.deliveryLayout), so the markers show apart from the
 * stent edges. The plan is where the stent is placed; cardiac motion may move it at deployment.
 */
export function plannedDelivery(l: BenchLesion, stent: Stent): { fromMm: number; toMm: number; diameterMm: number; markers: [number, number][] } {
  const lay = deliveryLayout(stentPlatform(stent).design, stent.lengthMm);
  const at = (mm: number) => stent.proxEdge + mm;
  return {
    fromMm: stent.proxEdge,
    toMm: Math.min(l.segmentMm, stent.proxEdge + stent.lengthMm),
    diameterMm: stent.diameter,
    markers: lay.markers.map(([a, b]) => [at(a), at(b)] as [number, number]),
  };
}

/** The stretches of a pullback that show no measurable coronary lumen: the aorta, and blood an OCT flush did not clear. */
export function benchRegions(l: BenchLesion, modality: Modality, step = 0.25): { fromMm: number; toMm: number; kind: "aorta" | "uncleared" }[] {
  const out: { fromMm: number; toMm: number; kind: "aorta" | "uncleared" }[] = [];
  for (let x = 0; x <= l.segmentMm + 1e-9; x += step) {
    const r = benchRegion(l, x, modality);
    if (r === "vessel") continue;
    const last = out[out.length - 1];
    if (last && last.kind === r && x - last.toMm <= step + 1e-9) last.toMm = x;
    else out.push({ fromMm: x, toMm: x, kind: r });
  }
  return out;
}

/** The MSA target the bench judges a lesion against (for the screens). */
export function benchMsaTarget(l: BenchLesion, modality: Modality): number {
  return msaTarget({ leftMain: l.leftMain, leftMainSegment: benchLeftMainSegment(l), modality }).mm2;
}

/**
 * Which left main target a lesion's stent is judged against: an ostial left main lesion sits in the proximal
 * left main (MSA_MIN_LM_MM2.proximal), every other left main lesion in the distal left main.
 */
export function benchLeftMainSegment(l: BenchLesion): "proximal" | "distal" | undefined {
  if (!l.leftMain) return undefined;
  return l.ostial ? "proximal" : "distal";
}

// ---------------------------------------------------------------------------
// Images: the bench segment through the shared frame generator
// ---------------------------------------------------------------------------
/** Dissection flap arc (deg) by severity, and its length beside a stent edge (mm) — MODEL PARAMETERS. */
export const MP_BENCH_FLAP_ARC = { minor: 70, major: 150 } as const;
export const MP_BENCH_FLAP_MM = 3;
/** Plaque and wire angles of the bench images (rad) — MODEL PARAMETERS (the plaque's thickest part towards the upper right). */
export const MP_BENCH_PLAQUE_ANGLE = (-30 * Math.PI) / 180;
export const MP_BENCH_WIRE_ANGLE = (150 * Math.PI) / 180;
/** The circumflex ostium of the distal left main lesion: position (mm), direction (rad) and diameter (mm) — MODEL PARAMETERS. */
export const MP_BENCH_LCX_OSTIUM = { atMm: 10, angle: (100 * Math.PI) / 180, diameterMm: 3.5 } as const;

/**
 * The bench segment as the frame generator reads it (pci/ivus.ts): the native lumen and the plaque-burden
 * profile of the lesion (so the frames' lumen and EEM areas are lumen() and eem()), its calcium deposit,
 * lipid pool and thrombus, the deployed stent when there is one, and the dissections the procedure caused
 * so far (at the lesion, or beside the stent edge that caused them).
 */
export function benchIvusContext(l: BenchLesion, st?: BenchState | null, result?: StentResult | null, modality: Modality = "IVUS"): IvusContext {
  const events = [...(st?.events ?? []), ...(result?.events ?? []).slice(st?.events.length ?? 0)];
  const pre = preImaging(l, modality);
  const dissections = events
    .filter((e) => e.kind === "dissection" || (e.kind === "balloon-rupture" && e.severity === "major"))
    .map((e) => {
      const arcDeg = MP_BENCH_FLAP_ARC[e.severity];
      if (e.where === "prox-edge" && result) return { fromMm: Math.max(0, result.x0 - MP_BENCH_FLAP_MM), toMm: result.x0 + 0.5, arcDeg };
      if (e.where === "dist-edge" && result) return { fromMm: result.x1 - 0.5, toMm: Math.min(l.segmentMm, result.x1 + MP_BENCH_FLAP_MM), arcDeg };
      return { fromMm: Math.max(l.startMm, pre.mlaAt - 3), toMm: Math.min(l.endMm, pre.mlaAt + 3), arcDeg };
    });
  // proximal to an ostium the catheter lies in the aorta, whose lumen is wider than the field of view
  const lumR = (x: number) => (inAorta(l, x) ? MP_AORTA_LUMEN_MM / 2 : lumen(l, Math.max(0, Math.min(l.segmentMm, x))) / 2);
  return {
    lumenR: lumR,
    refR: lumR,
    lesion: {
      startMm: l.startMm,
      endMm: l.endMm,
      pb: (x) => plaqueBurden(l, Math.max(0, Math.min(l.segmentMm, x))),
      calcium: l.calcium,
      lipid: l.lipidArcDeg ? { arcDeg: l.lipidArcDeg } : false,
      thrombus: l.thrombus,
    },
    // the stent over the extent deploy() judges (its labelled length within the segment); its rings sit at
    // their physical positions, so the ring shown at a position carries the diameter deploy() gives there
    stents: result ? [{ fromMm: result.x0, toMm: result.x1, geom: result.geom }] : [],
    dissections,
    thrombus: [],
    sideBranches: l.sideBranches,
    modality,
    plaqueAngle: MP_BENCH_PLAQUE_ANGLE,
    wireAngle: MP_BENCH_WIRE_ANGLE,
  };
}

/** Aortic lumen diameter shown proximal to an ostium (mm): wider than the field of view — MODEL PARAMETER. */
export const MP_AORTA_LUMEN_MM = 30;
/**
 * How far beyond an ostium an OCT flush fails to clear the blood (mm) — MODEL PARAMETER. The module states
 * that OCT cannot clear an ostial left main or an aorto-ostial segment (the contrast escapes into the aorta,
 * pm-imaging-when-which); it gives no length, so the bench takes the ostial lesion's first 5 mm.
 */
export const MP_OCT_OSTIAL_UNCLEARED_MM = 5;

/** What a frame shows: the aorta, coronary blood the OCT flush did not clear, or the coronary vessel. */
export type BenchFrameRegion = "aorta" | "uncleared" | "vessel";

/**
 * In an ectatic vessel an OCT flush clears the lumen incompletely where it is larger than this (mm) — MODEL
 * PARAMETER. The module states that complete contrast filling for OCT is hard in a big artery and that IVUS is
 * preferred in large and ectatic vessels (cp-other-complex-vessel-size, Brilakis 22.3); it gives no diameter.
 */
export const MP_OCT_CLEAR_MAX_LUMEN_MM = 4.0;

export function benchRegion(l: BenchLesion, x: number, modality: Modality): BenchFrameRegion {
  if (l.ectatic && modality === "OCT" && lumen(l, Math.max(0, Math.min(l.segmentMm, x))) > MP_OCT_CLEAR_MAX_LUMEN_MM) return "uncleared";
  if (!l.ostial) return "vessel";
  if (x < l.ostial.aortaMm) return "aorta";
  if (modality === "OCT" && x < l.ostial.aortaMm + MP_OCT_OSTIAL_UNCLEARED_MM) return "uncleared";
  return "vessel";
}

export interface BenchFrame {
  frame: IvusFrame;
  region: BenchFrameRegion;
  /** a coronary lumen can be traced (not the aorta, not uncleared blood) */
  lumenMeasurable: boolean;
  /** the EEM can be traced (a measurable lumen, and the EEM not hidden by lipid, calcium shadow or depth) */
  eemMeasurable: boolean;
}

/**
 * One frame of a pullback from a branch (or the lesion's single pullback) before the stent, with what can be
 * measured on it. Frames in the aorta, and OCT frames whose blood the flush did not clear, have no measurable
 * lumen.
 */
export function benchFrameAt(l: BenchLesion, x: number, modality: Modality, branchId?: string | null, st?: BenchState | null, result?: StentResult | null): BenchFrame {
  const g = branchLesion(l, branchId);
  const xc = Math.max(0, Math.min(g.segmentMm, x));
  const frame = ivusFrame(benchIvusContext(g, st, result, modality), xc);
  const region = benchRegion(g, xc, modality);
  const lumenOk = region === "vessel";
  return { frame, region, lumenMeasurable: lumenOk, eemMeasurable: lumenOk && eemMeasurable(frame) };
}

// ---------------------------------------------------------------------------
// Teaching lesions
// ---------------------------------------------------------------------------
export const BENCH_LESIONS: BenchLesion[] = [
  {
    id: "focal-lad",
    title: "Focal fibrous mid-LAD lesion",
    vessel: "LAD",
    brief: "Stable angina, positive physiology. A focal 75% mid-LAD stenosis. Plan the stent with imaging.",
    segmentMm: 40,
    eemProx: 4.1,
    eemDist: 3.6,
    startMm: 15,
    endMm: 27,
    pbMax: 0.8,
    pbShoulder: 0.5,
    shoulderMm: 3,
    pbBackground: 0.3,
    plaque: "fibrous",
    goal: {
      text: "Size the stent, find landing zones and check the expansion.",
      patient: "Stable angina; normal renal function.",
      correctModality: "either",
      reasonId: "sizing",
      reason: "Sizing, landing zones and expansion can be done with either modality (pm-imaging-when-which).",
    },
    teaching:
      "Size the stent to the distal reference (lumen-based, or EEM-based rounded down), land both edges where plaque burden is below 50%, then post-dilate with a non-compliant balloon to reach > 80% expansion. A short proximal optimisation corrects the larger proximal segment.",
  },
  {
    id: "long-taper",
    title: "Long tapering LAD with diffuse disease",
    vessel: "LAD",
    brief: "Diabetic, long proximal-to-mid LAD disease. The vessel tapers markedly from proximal to distal.",
    segmentMm: 50,
    eemProx: 4.6,
    eemDist: 3.2,
    startMm: 8,
    endMm: 36,
    pbMax: 0.78,
    pbShoulder: 0.55,
    shoulderMm: 5,
    pbBackground: 0.32,
    plaque: "fibrous",
    goal: {
      text: "Size a long stent in a tapering vessel and choose landing zones at both ends.",
      patient: "Diabetic; normal renal function.",
      correctModality: "either",
      reasonId: "sizing",
      reason: "Sizing, landing zones and expansion can be done with either modality (pm-imaging-when-which).",
    },
    teaching:
      "In a tapering vessel the stent is sized to the distal reference, so the proximal part will be malapposed unless you post-dilate it with a larger non-compliant balloon sized to the proximal reference. Choose a length that reaches plaque burden below 50% at both ends.",
  },
  {
    id: "calcified-rca",
    title: "Heavily calcified mid-RCA",
    vessel: "RCA",
    brief: "Elderly patient with exertional angina. Mid-RCA stenosis with dense fluoroscopic calcification on both sides of the vessel.",
    segmentMm: 40,
    eemProx: 4.3,
    eemDist: 3.9,
    startMm: 13,
    endMm: 28,
    pbMax: 0.78,
    pbShoulder: 0.45,
    shoulderMm: 2,
    pbBackground: 0.3,
    plaque: "calcified",
    calcium: { startMm: 14, lengthMm: 12, arcDeg: 300, thicknessMm: 0.9 },
    goal: {
      text: "Score the calcium (arc, thickness and length) to decide whether it needs modification.",
      patient: "Elderly; normal renal function.",
      correctModality: "OCT",
      reasonId: "calcium-thickness",
      reason: "OCT measures calcium thickness; IVUS sees only the calcium's leading edge and the shadow behind it, so the calcium score is incomplete (pm-imaging-planning, Brilakis 13.3).",
    },
    teaching:
      "A Fujino score of 4 (arc > 180°, thickness > 0.5 mm, length > 5 mm) predicts underexpansion. Modify the calcium before stenting (lithotripsy sized 1:1, or atherectomy then a non-compliant or scoring balloon), and confirm the balloon expands fully before committing a stent. An underexpanded stent cannot be fixed later.",
  },
  {
    id: "lipid-acs",
    title: "Lipid-rich culprit lesion in NSTEMI",
    vessel: "LCx",
    brief: "NSTEMI with a hazy proximal LCx culprit lesion, TIMI 3 flow.",
    segmentMm: 36,
    eemProx: 4.2,
    eemDist: 3.7,
    startMm: 12,
    endMm: 24,
    pbMax: 0.76,
    pbShoulder: 0.45,
    shoulderMm: 2,
    pbBackground: 0.28,
    plaque: "lipid",
    lipidArcDeg: 210,
    goal: {
      text: "Confirm the culprit and find edges clear of lipid-rich plaque.",
      patient: "NSTEMI; normal renal function.",
      correctModality: "OCT",
      reasonId: "culprit",
      reason: "OCT is the modality for the culprit, thrombus and plaque characterisation (pm-imaging-when-which, Brilakis 13.2).",
    },
    teaching:
      "Large attenuated or lipid-rich plaque predicts distal embolisation and no-reflow. Prefer modest predilatation (or direct stenting), avoid aggressive oversized post-dilatation, and cover the lipid pool with the stent edges in healthier segments.",
  },
  {
    id: "distal-lm",
    title: "Distal left main into the LAD",
    vessel: "Left main",
    leftMain: true,
    brief: "Isolated distal left main and ostial LAD disease, SYNTAX low. Heart team chose PCI with a provisional strategy into the LAD.",
    segmentMm: 30,
    eemProx: 5.6,
    eemDist: 4.1,
    startMm: 6,
    endMm: 18,
    pbMax: 0.72,
    pbShoulder: 0.5,
    shoulderMm: 3,
    pbBackground: 0.3,
    plaque: "fibrous",
    flags: ["bifurcation"],
    // the circumflex ostium at the bifurcation: position, direction and diameter are MODEL PARAMETERS
    sideBranches: [{ atMm: MP_BENCH_LCX_OSTIUM.atMm, angle: MP_BENCH_LCX_OSTIUM.angle, diameterMm: MP_BENCH_LCX_OSTIUM.diameterMm }],
    goal: {
      text: "Size the left main and LAD and confirm the left main result.",
      patient: "Heart team decision for PCI; normal renal function.",
      correctModality: "IVUS",
      reasonId: "left-main-ostial",
      reason: "IVUS is preferred in the left main: it penetrates further and needs no flush (pm-imaging-when-which, Brilakis 13.2; Oxford ch 8).",
    },
    teaching:
      "Left main targets are larger: IVUS MSA above about 7 mm² in the distal left main and 8 mm² in the proximal left main (EAPCI consensus; the Korean 5-6-7-8 data behind them). The stent is sized to the LAD and the left main segment must be optimised with a larger non-compliant balloon (proximal optimisation).",
  },
  {
    // a small vessel (cp-other-complex-vessel-size: Brilakis 22.3 calls a vessel under 2.5 mm small): the distal
    // reference lumen is under 2.5 mm and the EEM is larger than the lumen (outward remodelling). The dimensions
    // and plaque burdens are MODEL PARAMETERS of the teaching lesion; spasm is not modelled on the bench.
    id: "small-diagonal",
    title: "Focal stenosis in a small diagonal",
    vessel: "Diagonal",
    brief: "Diabetic patient with stable angina. A focal stenosis in a diagonal branch that looks small on the first injection. Plan the treatment with imaging.",
    segmentMm: 30,
    eemProx: 3.2,
    eemDist: 2.8,
    startMm: 11,
    endMm: 21,
    pbMax: 0.8,
    pbShoulder: 0.5,
    shoulderMm: 2,
    pbBackground: 0.3,
    plaque: "fibrous",
    goal: {
      text: "Find the true vessel size before choosing the device.",
      patient: "Diabetic; normal renal function.",
      correctModality: "either",
      reasonId: "sizing",
      reason: "In small vessels either modality shows the true size and any outward remodelling (pm-imaging-when-which).",
    },
    teaching:
      "Brilakis calls a vessel under 2.5 mm small. Give nitroglycerin before judging its size, because spasm makes an artery look smaller than it is (the bench does not model spasm). Imaging then shows the true size: here the EEM is larger than the lumen, the outward remodelling that can allow a larger stent than the angiogram suggests. Prepare without oversizing, since a balloon larger than the vessel at the lesion dissects and the dissection needs a longer stent, and avoid atherectomy. A drug-coated balloon is an option in small vessels; if you stent, use the shortest length that covers the lesion.",
  },
];

/** The left main bifurcation of the two-branch preset: where the LAD and the circumflex leave the left main (mm) — MODEL PARAMETER. */
export const MP_TWO_BRANCH_POC_MM = 12;

/**
 * The measuring and planning presets (pci-bench-measure-and-plan). They are kept apart from BENCH_LESIONS,
 * the lesion picker's list (src/content/lab/presets/pci-bench/core.launch.ts declares exactly those), and
 * open through their own launch file (src/content/lab/presets/pci-bench/measure.launch.ts); BENCH_BY_ID holds
 * both. All dimensions, plaque burdens, calcium and the left main geometry are MODEL PARAMETERS of the
 * teaching lesions; the goals and the eGFR are from the module (pm-imaging-when-which).
 */
export const MEASURE_LESIONS: BenchLesion[] = [
  {
    id: "ostial-lm-ivus",
    title: "Ostial left main stenosis",
    vessel: "Left main",
    leftMain: true,
    brief: "Exertional angina. The left main ostium looks narrowed with pressure damping on engagement; the rest of the left system is smooth. Decide whether the lesion is significant.",
    segmentMm: 26,
    eemProx: 5.4,
    eemDist: 4.9,
    startMm: 4,
    endMm: 10,
    pbMax: 0.77,
    pbShoulder: 0.5,
    shoulderMm: 3,
    pbBackground: 0.3,
    plaque: "fibrous",
    calcium: { startMm: 5, lengthMm: 4, arcDeg: 110, thicknessMm: 0.4 },
    flags: ["aorto-ostial-lesion"],
    ostial: { aortaMm: 4 },
    goal: {
      text: "Is this ostial left main lesion significant?",
      patient: "Exertional angina; normal renal function.",
      correctModality: "IVUS",
      reasonId: "left-main-ostial",
      reason: "IVUS images the ostial left main without a flush; an OCT flush escapes into the aorta and cannot clear the ostium (pm-imaging-when-which, Brilakis 13.2 and 15.1).",
    },
    teaching:
      "Image the ostial left main with IVUS, pulling back into the aorta. Judge the minimum lumen area against 6.0 mm² by IVUS (4.5 mm² proposed in Korean patients; 5.4 mm² by OCT, not prospectively validated), and between 4.5 and 6.0 mm² add physiology. Read the two-dimensional area with care: the left main leaves the aorta at a slant (Brilakis 13.1, 15.1, 17.13).",
  },
  {
    id: "distal-lm-two-branch",
    title: "Distal left main bifurcation, imaged from both branches",
    vessel: "Left main",
    leftMain: true,
    brief: "Stable angina. Distal left main disease at the bifurcation, with an angiographically uncertain circumflex ostium. Image the left main before PCI.",
    segmentMm: 40,
    eemProx: 5.2,
    eemDist: 3.4,
    eemPoints: [
      [0, 5.2],
      [MP_TWO_BRANCH_POC_MM, 5.0],
      [MP_TWO_BRANCH_POC_MM + 0.5, 4.0],
      [40, 3.4],
    ],
    startMm: 5,
    endMm: MP_TWO_BRANCH_POC_MM,
    pbMax: 0.8,
    pbShoulder: 0.5,
    shoulderMm: 2,
    pbBackground: 0.3,
    plaque: "fibrous",
    flags: ["bifurcation"],
    sideBranches: [{ atMm: MP_TWO_BRANCH_POC_MM + 0.75, angle: MP_BENCH_LCX_OSTIUM.angle, diameterMm: MP_BENCH_LCX_OSTIUM.diameterMm }],
    branches: [
      { id: "LAD", label: "LAD pullback", atMm: MP_TWO_BRANCH_POC_MM, geometry: {} },
      {
        id: "LCx",
        label: "Circumflex pullback",
        atMm: MP_TWO_BRANCH_POC_MM,
        geometry: {
          segmentMm: 32,
          eemPoints: [
            [0, 5.2],
            [MP_TWO_BRANCH_POC_MM, 5.0],
            [MP_TWO_BRANCH_POC_MM + 0.5, 3.8],
            [32, 3.2],
          ],
          // a short circumflex ostial lesion, which the LAD pullback does not image
          plaques: [{ startMm: MP_TWO_BRANCH_POC_MM + 0.5, endMm: MP_TWO_BRANCH_POC_MM + 3.5, pbMax: 0.78, pbShoulder: 0.5, shoulderMm: 1.5 }],
          // the LAD ostium, passed by the circumflex pullback
          sideBranches: [{ atMm: MP_TWO_BRANCH_POC_MM + 0.75, angle: -MP_BENCH_LCX_OSTIUM.angle, diameterMm: 4.0 }],
        },
      },
    ],
    goal: {
      text: "Judge the left main and both ostia before PCI.",
      patient: "Stable angina; normal renal function.",
      correctModality: "IVUS",
      reasonId: "left-main-ostial",
      reason: "IVUS is preferred in the left main, pulled back from both the LAD and the circumflex (pm-imaging-when-which; cp-left-main-assess, Brilakis 13.1 and 17.13).",
    },
    teaching:
      "Pull back from the LAD and from the circumflex: each shows its own ostium, and a short circumflex ostial lesion is seen only on the circumflex run. After stenting, aim for 5 mm² at the circumflex ostium, 6 mm² at the LAD ostium, 7 mm² at the polygon of confluence and 8 mm² in the left main above it (Brilakis figure 17.3).",
  },
  {
    id: "aorto-ostial-rca",
    title: "Aorto-ostial RCA stenosis",
    vessel: "RCA",
    brief: "Stable angina. The RCA ostium is narrowed with ventricularisation of the pressure on engagement. Plan the stent so that it covers the ostium.",
    segmentMm: 40,
    eemProx: 4.6,
    eemDist: 4.0,
    startMm: 4,
    endMm: 12,
    pbMax: 0.75,
    pbShoulder: 0.5,
    shoulderMm: 3,
    pbBackground: 0.3,
    plaque: "calcified",
    calcium: { startMm: 5, lengthMm: 6, arcDeg: 200, thicknessMm: 0.4 },
    flags: ["aorto-ostial-lesion"],
    ostial: { aortaMm: 4 },
    goal: {
      text: "Plan an aorto-ostial stent and be able to show afterwards that it covers the ostium.",
      patient: "Stable angina; normal renal function.",
      correctModality: "IVUS",
      reasonId: "left-main-ostial",
      reason: "IVUS is graded clearly better for aorto-ostial lesions: a flush cannot clear an aorto-ostial segment reliably (pm-imaging-when-which, Brilakis 13.2; Oxford ch 8).",
    },
    teaching:
      "An aorto-ostial stent must cover the ostium, so the proximal landing zone is the ostium itself, with the stent just protruding into the aorta. Angiography often misses an uncovered ostium because the balloon shoulder dilates it; image, preferably with IVUS, after deployment.",
  },
  {
    id: "ckd-ivus",
    title: "Long mid-RCA disease in advanced kidney disease",
    vessel: "RCA",
    brief: "A 76-year-old with an eGFR of 24 mL/min/1.73 m² and a long mid-RCA lesion. Size the stent and check the result while giving as little contrast as possible.",
    segmentMm: 50,
    eemProx: 4.4,
    eemDist: 3.8,
    startMm: 12,
    endMm: 34,
    pbMax: 0.78,
    pbShoulder: 0.52,
    shoulderMm: 4,
    pbBackground: 0.32,
    plaque: "fibrous",
    goal: {
      text: "Size the stent and check the result with as little contrast as possible.",
      patient: "Age 76, eGFR 24 mL/min/1.73 m².",
      correctModality: "IVUS",
      reasonId: "spare-contrast",
      reason: "IVUS needs no contrast to image and can replace check angiograms; every OCT run needs a contrast flush (pm-imaging-when-which, Brilakis 13.1 and 13.2).",
      egfr: 24,
    },
    teaching:
      "In advanced kidney disease IVUS sizes the vessel and judges the result without contrast, and using it instead of further check angiograms lowers the contrast volume. A long lesion needs landing zones at both ends where plaque burden is below 50%.",
  },
  {
    id: "acs-culprit-oct",
    title: "Hazy proximal LAD lesion in NSTEMI",
    vessel: "LAD",
    brief: "NSTEMI with two possible culprit lesions; the proximal LAD lesion is hazy on the angiogram. Image it to decide whether it is the culprit and to plan the stent.",
    segmentMm: 36,
    eemProx: 4.0,
    eemDist: 3.5,
    startMm: 11,
    endMm: 21,
    pbMax: 0.74,
    pbShoulder: 0.45,
    shoulderMm: 2,
    pbBackground: 0.28,
    plaque: "lipid",
    lipidArcDeg: 190,
    thrombus: "red",
    goal: {
      text: "Is this the culprit, and where can the stent edges land?",
      patient: "NSTEMI; normal renal function.",
      correctModality: "OCT",
      reasonId: "culprit",
      reason: "OCT shows thrombus, plaque rupture and lipid-rich plaque best (pm-imaging-when-which, Brilakis 13.2).",
    },
    teaching:
      "OCT shows the culprit: thrombus over a lipid-rich plaque. Land both edges beyond the lipid pool, where plaque burden is below 50%; an edge on lipid dissects. Avoid aggressive post-dilatation over a large lipid pool.",
  },
];

/**
 * The platform, sizing and positioning presets (pci-bench-stent-platforms-sizing), defined in
 * src/simulation/bench/platforms.ts and opened through src/content/lab/presets/pci-bench/platforms.launch.ts.
 */
export { PLATFORM_LESIONS };

/** Every bench lesion: the picker's, the measuring presets and the platform presets. */
export const ALL_BENCH_LESIONS: readonly BenchLesion[] = [...BENCH_LESIONS, ...MEASURE_LESIONS, ...PLATFORM_LESIONS];

export const BENCH_BY_ID: Record<string, BenchLesion> = Object.fromEntries(ALL_BENCH_LESIONS.map((l) => [l.id, l]));
