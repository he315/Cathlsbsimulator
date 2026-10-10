// ---------------------------------------------------------------------------
// The IVUS and OCT bench's measurements and pre-PCI plan (pci-bench-measure-and-plan).
//
// The learner commits to a modality against the lesion's goal, runs the
// pullbacks, measures on the frames (src/ui/imaging/MeasureTools.tsx) and enters
// a plan (src/ui/bench/PlanForm.tsx). This module computes what the frames truly
// show (planTruth) and grades each entry against it (gradePlan); it also holds
// the pure geometry the measuring tools use, so the bench and the PCI lab
// measure the same way.
//
// Rules quoted from the module (src/content/manual/pci-manual/15-imaging.ts):
//   modality by goal               pm-imaging-when-which (Brilakis 13.2; Oxford ch 8)
//   left main significance         IVUS MLA below 6.0 mm², 4.5 mm² proposed in Korean
//                                  patients; OCT below 5.4 mm², not prospectively validated
//                                  (pm-imaging-planning table, Brilakis 13.1, 17.13)
//   calcium score                  arc over 180° = 2, thickness over 0.5 mm = 1, length over
//                                  5 mm = 1; a score of 4 favours modification (Fujino;
//                                  Brilakis 13.3, 19.13); IVUS cannot measure thickness
//   landing zones                  plaque burden below 50% and no lipid pool (Brilakis 13.3)
//   stent diameter                 distal reference: lumen + 0.25 mm or EEM − 0.25 mm, read
//                                  either as the nearest size or the next size up or down;
//                                  never the proximal reference (Brilakis 13.3, 10.2)
//   proximal post-dilatation       a larger, shorter balloon chosen from the proximal reference
//   left main segment targets      after stenting: circumflex ostium 5, LAD ostium 6, polygon
//                                  of confluence 7, left main 8 mm² (pm-imaging-optimisation,
//                                  Brilakis figure 17.3, Korean IVUS data)
// Grading tolerances (the plan's design, docs/curriculum/lab-build-plan.json) are
// MODEL PARAMETERS: MLA within 0.5 mm², references within 0.25 mm, landing zones
// within 1 mm, calcium arc within 30°, thickness within 0.1 mm, calcium length
// within 1 mm, stent length within 2 mm (the two landing tolerances); the left
// main segment lengths and the grey zone's use are MODEL PARAMETERS too.
// ---------------------------------------------------------------------------

import type { Modality } from "../imaging/types";
import {
  MODALITY_REASONS,
  STENT_DIAMETERS,
  area,
  balloonSizes,
  benchFrameAt,
  benchPullbacks,
  benchRegion,
  branchLesion,
  eem,
  fujino,
  imagingContrastMl,
  inAorta,
  landable,
  lumen,
  plaqueBurden,
  sizesForReference,
  type BenchLesion,
  type ModalityReasonId,
  type StentResult,
} from "../pciBench";

// ---------------------------------------------------------------------------
// Thresholds and tolerances
// ---------------------------------------------------------------------------

/** Left main significance thresholds, mm² (pm-imaging-planning: Brilakis 13.1, 17.13). */
export const LM_SIGNIFICANCE_MM2 = { IVUS: 6.0, IVUS_KOREAN: 4.5, OCT: 5.4 } as const;
/** Left main segment targets after stenting, mm² (pm-imaging-optimisation: Brilakis figure 17.3). */
export const LM_SEGMENT_TARGETS_MM2 = { lcxOstium: 5, ladOstium: 6, poc: 7, lm: 8 } as const;
/** Calcium score thresholds (pm-imaging-planning: Fujino; Brilakis 13.3). */
export const CALCIUM_SCORE_RULE = { arcDeg: 180, thicknessMm: 0.5, lengthMm: 5, modifyAt: 4 } as const;
/** Grading tolerances — MODEL PARAMETERS (the plan's design). */
export const MEASURE_TOLERANCE = { mlaMm2: 0.5, refMm: 0.25, landingMm: 1, arcDeg: 30, thicknessMm: 0.1, calciumLengthMm: 1, lengthMm: 2 } as const;
/** Length of a reference segment (mm) — MODEL PARAMETER (deploy() looks 10 mm beyond an edge). */
export const MP_REFERENCE_WINDOW_MM = 10;
/**
 * A reference segment is the most normal-looking one beside the lesion: it starts beyond the landing zone
 * where plaque burden has fallen to within this margin of the vessel's background — MODEL PARAMETER.
 */
export const MP_REFERENCE_PB_MARGIN = 0.02;
/** Length of the left main segments either side of the bifurcation (mm) — MODEL PARAMETER. */
export const MP_LM_SEGMENT_MM = { poc: 3, ostium: 3 } as const;
/** Proximal minus distal reference lumen (mm) below which no separate proximal balloon is needed — MODEL PARAMETER (one catalogue step). */
export const MP_NO_TAPER_MM = 0.25;

const STEP = 0.25;

// ---------------------------------------------------------------------------
// Geometry the measuring tools share
// ---------------------------------------------------------------------------

export type Pt = readonly [number, number];

/** Area of a traced polygon (mm², points in mm). */
export function polygonAreaMm2(pts: readonly Pt[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    a += x0 * y1 - x1 * y0;
  }
  return Math.abs(a) / 2;
}

/** The mean diameter of a traced area (mm): the diameter of the circle of that area. */
export function meanDiameterMm(areaMm2: number): number {
  return 2 * Math.sqrt(Math.max(0, areaMm2) / Math.PI);
}

export function distanceMm(a: Pt, b: Pt): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/** The arc (deg, 0 … 360) swept clockwise on screen from point a to point b about the catheter (the image centre). */
export function arcDegBetween(a: Pt, b: Pt): number {
  const t0 = Math.atan2(a[1], a[0]);
  const t1 = Math.atan2(b[1], b[0]);
  let d = ((t1 - t0) * 180) / Math.PI;
  while (d < 0) d += 360;
  while (d >= 360) d -= 360;
  return d;
}

/** Snap a pullback position to the nearest frame (every 0.25 mm), or to a marker already placed within `toMarkersMm`. */
export function snapMm(x: number, markers: readonly number[] = [], toMarkersMm = 0.5, step = STEP): number {
  let best: number | null = null;
  for (const m of markers) if (Math.abs(m - x) <= toMarkersMm && (best === null || Math.abs(m - x) < Math.abs(best - x))) best = m;
  if (best !== null) return best;
  return Math.round(x / step) * step;
}

// ---------------------------------------------------------------------------
// The modality choice
// ---------------------------------------------------------------------------

export interface ModalityGrade {
  ok: boolean;
  reasonOk: boolean | null;
  expected: Modality | "either";
  expectedReason: ModalityReasonId | null;
  /** what the wrong choice cost, shown in the debrief */
  consequence: string | null;
  explanation: string;
}

/** Grade the committed modality (and its reason) against the lesion's goal. */
export function gradeModality(l: BenchLesion, modality: Modality, reasonId?: ModalityReasonId | null): ModalityGrade {
  const g = l.goal;
  if (!g) return { ok: true, reasonOk: null, expected: "either", expectedReason: null, consequence: null, explanation: "No imaging goal is stated for this lesion." };
  const ok = g.correctModality === "either" || g.correctModality === modality;
  const reasonOk = reasonId ? reasonId === g.reasonId : null;
  let consequence: string | null = null;
  if (!ok) {
    if (modality === "OCT" && l.ostial) consequence = "The OCT flush escaped into the aorta: the frames from the aorta into the ostium were blood-filled, and the ostial lumen could not be measured.";
    else if (modality === "OCT" && g.egfr !== undefined) consequence = `Each OCT run needed a contrast flush (${imagingContrastMl(l, "OCT", 1)} mL), in a patient with an eGFR of ${g.egfr}.`;
    else if (modality === "OCT") consequence = "OCT penetrated less deeply: the EEM of the large vessel could not always be traced, and each run needed a contrast flush.";
    else if (g.reasonId === "calcium-thickness") consequence = "IVUS showed only the calcium's leading edge and its shadow: the thickness, and so the calcium score, could not be measured.";
    else consequence = "IVUS showed thrombus, lipid and the plaque surface less sharply than OCT would have.";
  }
  return { ok, reasonOk, expected: g.correctModality, expectedReason: g.reasonId, consequence, explanation: g.reason };
}

// ---------------------------------------------------------------------------
// What the frames show
// ---------------------------------------------------------------------------

export interface RefTruth {
  /** lumen and EEM diameters over the reference segment (mm) */
  lumenMin: number;
  lumenMax: number;
  eemMin: number;
  eemMax: number;
  /** the EEM can be traced on the reference frames with this modality */
  eemVisible: boolean;
  /** the reference segment (mm) */
  fromMm: number;
  toMm: number;
}

export interface SegmentTruth {
  /** minimum lumen area of each left main segment before PCI (mm²) */
  lm: number;
  poc: number;
  ladOstium: number;
  /** null when the circumflex is not a pullback of this lesion */
  lcxOstium: number | null;
}

export interface PlanTruth {
  lesionId: string;
  modality: Modality;
  /** the pullbacks a complete study needs (branch ids, or "main") */
  pullbacks: string[];
  /** minimum lumen area (mm²; the left main segment for a left main bifurcation); null when the frames there cannot be measured */
  mla: number | null;
  mlaAtMm: number;
  distRef: RefTruth;
  /** null for an aorto-ostial lesion, which has no proximal reference */
  proxRef: RefTruth | null;
  landingProxMm: number;
  landingDistMm: number;
  lengthMm: number;
  calcium: { arcDeg: number; thicknessMm: number | null; lengthMm: number; score: number | null } | null;
  prepTool: "balloon" | "modification";
  /** stent diameters the distal reference allows, and those the proximal reference would give */
  stentSizes: number[];
  proximalStentSizes: number[];
  /** proximal post-dilatation balloon diameters; empty when the vessel does not taper (no separate balloon needed) */
  postDilSizes: number[];
  /** left main significance, for left main lesions */
  significance: { thresholdMm2: number; expected: "significant" | "not-significant"; greyZone: boolean } | null;
  segments: SegmentTruth | null;
}

export type Population = "general" | "korean";

/** The left main significance threshold for a modality and population. */
export function lmThreshold(modality: Modality, population: Population = "general"): number {
  if (modality === "OCT") return LM_SIGNIFICANCE_MM2.OCT;
  return population === "korean" ? LM_SIGNIFICANCE_MM2.IVUS_KOREAN : LM_SIGNIFICANCE_MM2.IVUS;
}

/** Whether an MLA lies in the IVUS grey zone (4.5 to 6.0 mm²), where the plan offers physiology. */
export function inGreyZone(mlaMm2: number): boolean {
  return mlaMm2 >= LM_SIGNIFICANCE_MM2.IVUS_KOREAN && mlaMm2 < LM_SIGNIFICANCE_MM2.IVUS;
}

function refTruth(l: BenchLesion, modality: Modality, a: number, b: number): RefTruth {
  const from = Math.max(0, Math.min(a, b));
  const to = Math.min(l.segmentMm, Math.max(a, b));
  let lumenMin = Infinity,
    lumenMax = 0,
    eemMin = Infinity,
    eemMax = 0,
    eemVisible = true;
  for (let x = from; x <= to + 1e-9; x += 1) {
    const lu = lumen(l, x),
      e = eem(l, x);
    lumenMin = Math.min(lumenMin, lu);
    lumenMax = Math.max(lumenMax, lu);
    eemMin = Math.min(eemMin, e);
    eemMax = Math.max(eemMax, e);
    if (!benchFrameAt(l, x, modality).eemMeasurable) eemVisible = false;
  }
  return { lumenMin, lumenMax, eemMin, eemMax, eemVisible, fromMm: from, toMm: to };
}

function minLumen(l: BenchLesion, a: number, b: number): { area: number; at: number } {
  let best = { area: Infinity, at: a };
  for (let x = Math.max(0, a); x <= Math.min(l.segmentMm, b) + 1e-9; x += STEP) {
    if (inAorta(l, x)) continue;
    const ar = area(lumen(l, x));
    if (ar < best.area) best = { area: ar, at: x };
  }
  return best;
}

/** What the frames of a lesion show, measured exactly (the grading truth). */
export function planTruth(l: BenchLesion, modality: Modality): PlanTruth {
  const x0 = l.ostial ? l.ostial.aortaMm : 0;
  const poc = l.branches?.[0]?.atMm ?? null;
  // MLA: the left main segment for a bifurcation, else the whole vessel
  const m = poc !== null ? minLumen(l, x0, poc) : minLumen(l, x0, l.segmentMm);
  const mlaMeasurable = benchRegion(l, m.at, modality) === "vessel";
  // landing zones from the narrowest point of the whole vessel
  const whole = minLumen(l, x0, l.segmentMm);
  let landingProx = x0,
    landingDist = l.segmentMm;
  for (let x = whole.at; x >= x0; x -= STEP)
    if (landable(l, x)) {
      landingProx = x;
      break;
    }
  if (l.ostial) landingProx = x0;
  for (let x = whole.at; x <= l.segmentMm; x += STEP)
    if (landable(l, x)) {
      landingDist = x;
      break;
    }
  // reference segments: from where the vessel looks normal beyond each landing zone, 10 mm long
  const normal = (x: number) => plaqueBurden(l, x) <= l.pbBackground + MP_REFERENCE_PB_MARGIN;
  let dStart = landingDist;
  while (dStart < l.segmentMm && !normal(dStart)) dStart += STEP;
  if (dStart >= l.segmentMm) dStart = landingDist;
  let pEnd = landingProx;
  while (pEnd > 0 && !normal(pEnd)) pEnd -= STEP;
  if (pEnd <= 0) pEnd = landingProx;
  const distRef = refTruth(l, modality, dStart, Math.min(l.segmentMm, dStart + MP_REFERENCE_WINDOW_MM));
  const proxRef = l.ostial ? null : refTruth(l, modality, Math.max(0, pEnd - MP_REFERENCE_WINDOW_MM), pEnd);

  // calcium, as the frames show it
  let calcium: PlanTruth["calcium"] = null;
  if (l.calcium) {
    let arc = 0,
      thick = 0;
    for (let x = l.calcium.startMm; x <= l.calcium.startMm + l.calcium.lengthMm + 1e-9; x += STEP) {
      const f = benchFrameAt(l, x, modality).frame;
      if (!f.calcium) continue;
      arc = Math.max(arc, f.calcium.arcDeg);
      if (f.calcium.thicknessMm !== null) thick = Math.max(thick, f.calcium.thicknessMm);
    }
    const score = modality === "OCT" ? fujino({ startMm: l.calcium.startMm, lengthMm: l.calcium.lengthMm, arcDeg: arc, thicknessMm: thick }) : null;
    calcium = { arcDeg: arc, thicknessMm: modality === "OCT" ? thick : null, lengthMm: l.calcium.lengthMm, score };
  }
  const prepTool: PlanTruth["prepTool"] = fujino(l.calcium) >= CALCIUM_SCORE_RULE.modifyAt ? "modification" : "balloon";

  const sizesOf = (r: RefTruth, sizes: readonly number[]) => {
    const out = new Set<number>();
    for (let x = r.fromMm; x <= r.toMm + 1e-9; x += 1) for (const s of sizesForReference(lumen(l, x), r.eemVisible ? eem(l, x) : null, sizes)) out.add(s);
    return [...out].sort((a, b) => a - b);
  };
  const stentSizes = sizesOf(distRef, STENT_DIAMETERS);
  const proximalStentSizes = proxRef ? sizesOf(proxRef, STENT_DIAMETERS) : [];
  const tapers = proxRef ? proxRef.lumenMax - distRef.lumenMax >= MP_NO_TAPER_MM : false;
  // the proximal balloon is a larger, shorter one chosen from the proximal reference: only sizes above
  // every stent size the distal reference allows count (an equal size adds nothing to the stent's own)
  const largestStent = stentSizes.length ? Math.max(...stentSizes) : 0;
  const postDilSizes = proxRef && tapers ? sizesOf(proxRef, balloonSizes("non-compliant")).filter((s) => s > largestStent + 1e-6) : [];

  let significance: PlanTruth["significance"] = null;
  if (l.leftMain && mlaMeasurable) {
    const t = lmThreshold(modality);
    significance = { thresholdMm2: t, expected: m.area < t ? "significant" : "not-significant", greyZone: modality === "IVUS" && inGreyZone(m.area) };
  }

  let segments: SegmentTruth | null = null;
  if (poc !== null) {
    const lad = branchLesion(l, l.branches![0].id);
    const lcx = l.branches!.find((b) => b.id === "LCx");
    const lcxL = lcx ? branchLesion(l, lcx.id) : null;
    segments = {
      lm: minLumen(l, x0, poc - MP_LM_SEGMENT_MM.poc).area,
      poc: minLumen(l, poc - MP_LM_SEGMENT_MM.poc, poc).area,
      ladOstium: minLumen(lad, poc + 0.25, poc + MP_LM_SEGMENT_MM.ostium).area,
      lcxOstium: lcxL ? minLumen(lcxL, poc + 0.25, poc + MP_LM_SEGMENT_MM.ostium).area : null,
    };
  }

  return {
    lesionId: l.id,
    modality,
    pullbacks: benchPullbacks(l).map((p) => p.id),
    mla: mlaMeasurable ? m.area : null,
    mlaAtMm: m.at,
    distRef,
    proxRef,
    landingProxMm: landingProx,
    landingDistMm: landingDist,
    lengthMm: landingDist - landingProx,
    calcium,
    prepTool,
    stentSizes,
    proximalStentSizes,
    postDilSizes,
    significance,
    segments,
  };
}

// ---------------------------------------------------------------------------
// The learner's plan and its grading
// ---------------------------------------------------------------------------

/** What the learner enters. A null number means "not measurable"; undefined means not entered. */
export interface BenchPlan {
  modality: Modality;
  reasonId?: ModalityReasonId | null;
  /** whether the run's mode requires the reason (guided, exam); an optional reason left out is not graded */
  requireReason?: boolean;
  /** the pullbacks run (branch ids, or "main") */
  pullbacks: string[];
  population?: Population;
  mla?: number | null;
  distRef?: { method: "lumen" | "eem"; diameterMm: number };
  proxRefMm?: number;
  landingProxMm?: number;
  landingDistMm?: number;
  lengthMm?: number;
  /** "none" when no calcium was seen */
  calcium?: "none" | { arcDeg?: number; thicknessMm?: number | null; lengthMm?: number; score?: number };
  prepTool?: "balloon" | "modification";
  stentDiameterMm?: number;
  /** the proximal post-dilatation balloon; null for none */
  postDilMm?: number | null;
  significance?: "significant" | "not-significant" | "physiology";
  segments?: { lm?: number; ladOstium?: number; lcxOstium?: number };
}

export interface GradeItem {
  id: string;
  label: string;
  ok: boolean;
  given: string;
  expected: string;
  /** a named error the debrief explains (for example a stent sized to the proximal reference) */
  flag?: "proximal-reference" | "not-imaged" | "not-measurable";
  note?: string;
}

export interface PlanGrade {
  items: GradeItem[];
  correct: number;
  total: number;
  /** the plan's named errors */
  flags: GradeItem["flag"][];
  truth: PlanTruth;
  modality: ModalityGrade;
}

const f2 = (x: number) => x.toFixed(2);
const f1 = (x: number) => x.toFixed(1);
const near = (given: number | undefined, want: number, tol: number) => given !== undefined && Number.isFinite(given) && Math.abs(given - want) <= tol + 1e-9;
const within = (given: number | undefined, lo: number, hi: number, tol: number) => given !== undefined && Number.isFinite(given) && given >= lo - tol - 1e-9 && given <= hi + tol + 1e-9;
const shown = (x: number | null | undefined, fmt = f2) => (x === undefined ? "not entered" : x === null ? "not measurable" : fmt(x));
const list = (xs: number[]) => (xs.length ? xs.map(f2).join(" or ") : "none");

/** Grade every entry of the plan against what the frames show. */
export function gradePlan(l: BenchLesion, plan: BenchPlan): PlanGrade {
  const t = planTruth(l, plan.modality);
  const items: GradeItem[] = [];
  const T = MEASURE_TOLERANCE;
  const mg = gradeModality(l, plan.modality, plan.reasonId);
  items.push({ id: "modality", label: "Modality for the goal", ok: mg.ok, given: plan.modality, expected: mg.expected === "either" ? "IVUS or OCT" : mg.expected, note: mg.consequence ?? undefined });
  if (l.goal && (plan.reasonId || plan.requireReason))
    items.push({
      id: "reason",
      label: "Reason for the modality",
      ok: !!mg.reasonOk,
      given: plan.reasonId ? MODALITY_REASONS.find((r) => r.id === plan.reasonId)?.label ?? plan.reasonId : "not stated",
      expected: MODALITY_REASONS.find((r) => r.id === l.goal!.reasonId)?.label ?? l.goal.reasonId,
    });

  // pullbacks
  const missing = t.pullbacks.filter((p) => !plan.pullbacks.includes(p));
  if (t.pullbacks.length > 1)
    items.push({
      id: "pullbacks",
      label: "Pullbacks from both branches",
      ok: missing.length === 0,
      given: plan.pullbacks.length ? plan.pullbacks.join(" and ") : "none",
      expected: t.pullbacks.join(" and "),
      flag: missing.length ? "not-imaged" : undefined,
    });

  // minimum lumen area
  if (t.mla === null) items.push({ id: "mla", label: "Minimum lumen area", ok: plan.mla === null, given: shown(plan.mla), expected: "not measurable (blood not cleared)", flag: "not-measurable" });
  else items.push({ id: "mla", label: t.segments ? "Left main minimum lumen area (mm²)" : "Minimum lumen area (mm²)", ok: near(plan.mla ?? undefined, t.mla, T.mlaMm2), given: shown(plan.mla), expected: f2(t.mla) });

  // left main segments, before PCI
  if (t.segments) {
    const s = plan.segments ?? {};
    items.push({ id: "seg-lad", label: "LAD ostium minimum lumen area (mm²)", ok: near(s.ladOstium, t.segments.ladOstium, T.mlaMm2), given: shown(s.ladOstium), expected: f2(t.segments.ladOstium) });
    if (t.segments.lcxOstium !== null) {
      const imaged = plan.pullbacks.includes("LCx");
      items.push({
        id: "seg-lcx",
        label: "Circumflex ostium minimum lumen area (mm²)",
        ok: imaged && near(s.lcxOstium, t.segments.lcxOstium, T.mlaMm2),
        given: imaged ? shown(s.lcxOstium) : "circumflex not imaged",
        expected: f2(t.segments.lcxOstium),
        flag: imaged ? undefined : "not-imaged",
        note: imaged ? undefined : "A short circumflex ostial lesion shows only on the circumflex pullback.",
      });
    }
  }

  // left main significance
  if (l.leftMain) {
    const thr = lmThreshold(plan.modality, plan.population);
    if (t.mla === null) items.push({ id: "significance", label: "Left main significance", ok: false, given: plan.significance ?? "not entered", expected: "cannot be judged on these frames" });
    else {
      const expected = t.mla < thr ? "significant" : "not-significant";
      const grey = plan.modality === "IVUS" && inGreyZone(t.mla);
      const ok = plan.significance === expected || (grey && plan.significance === "physiology");
      items.push({
        id: "significance",
        label: `Left main significance (threshold ${thr.toFixed(1)} mm²)`,
        ok,
        given: plan.significance ?? "not entered",
        expected: grey ? `${expected}, or physiology (grey zone 4.5 to 6.0 mm²)` : expected,
      });
    }
  }

  // references
  const dr = plan.distRef;
  if (dr?.method === "eem" && !t.distRef.eemVisible) items.push({ id: "dist-ref", label: "Distal reference", ok: false, given: `EEM ${f2(dr.diameterMm)} mm`, expected: "lumen-based: the EEM cannot be traced here", flag: "not-measurable" });
  else {
    const lo = dr?.method === "eem" ? t.distRef.eemMin : t.distRef.lumenMin;
    const hi = dr?.method === "eem" ? t.distRef.eemMax : t.distRef.lumenMax;
    items.push({
      id: "dist-ref",
      label: `Distal reference ${dr?.method === "eem" ? "EEM" : "lumen"} diameter (mm)`,
      ok: within(dr?.diameterMm, lo, hi, T.refMm),
      given: dr ? f2(dr.diameterMm) : "not entered",
      expected: `${f2(lo)} to ${f2(hi)}`,
    });
  }
  if (t.proxRef)
    items.push({
      id: "prox-ref",
      label: "Proximal reference lumen diameter (mm)",
      ok: within(plan.proxRefMm, t.proxRef.lumenMin, t.proxRef.lumenMax, T.refMm),
      given: shown(plan.proxRefMm),
      expected: `${f2(t.proxRef.lumenMin)} to ${f2(t.proxRef.lumenMax)}`,
    });

  // landing zones and length
  items.push({ id: "landing-prox", label: l.ostial ? "Proximal landing zone: the ostium (mm)" : "Proximal landing zone (mm)", ok: near(plan.landingProxMm, t.landingProxMm, T.landingMm), given: shown(plan.landingProxMm, f1), expected: f1(t.landingProxMm) });
  items.push({ id: "landing-dist", label: "Distal landing zone (mm)", ok: near(plan.landingDistMm, t.landingDistMm, T.landingMm), given: shown(plan.landingDistMm, f1), expected: f1(t.landingDistMm) });
  items.push({ id: "length", label: "Length between the landing zones (mm)", ok: near(plan.lengthMm, t.lengthMm, T.lengthMm), given: shown(plan.lengthMm, f1), expected: f1(t.lengthMm) });

  // calcium
  const pc = plan.calcium;
  if (!t.calcium) items.push({ id: "calcium", label: "Calcium", ok: pc === undefined || pc === "none", given: pc === undefined || pc === "none" ? "none" : "entered", expected: "none" });
  else {
    const c = pc && pc !== "none" ? pc : {};
    items.push({ id: "ca-arc", label: "Calcium arc (deg)", ok: near(c.arcDeg, t.calcium.arcDeg, T.arcDeg), given: shown(c.arcDeg, (x) => x.toFixed(0)), expected: t.calcium.arcDeg.toFixed(0) });
    if (t.calcium.thicknessMm === null)
      items.push({ id: "ca-thickness", label: "Calcium thickness", ok: c.thicknessMm === null, given: shown(c.thicknessMm), expected: "not measurable (IVUS acoustic shadow)", flag: c.thicknessMm === null ? undefined : "not-measurable" });
    else items.push({ id: "ca-thickness", label: "Calcium thickness (mm)", ok: near(c.thicknessMm ?? undefined, t.calcium.thicknessMm, T.thicknessMm), given: shown(c.thicknessMm), expected: f2(t.calcium.thicknessMm) });
    items.push({ id: "ca-length", label: "Calcium length (mm)", ok: near(c.lengthMm, t.calcium.lengthMm, T.calciumLengthMm), given: shown(c.lengthMm, f1), expected: f1(t.calcium.lengthMm) });
    if (t.calcium.score !== null) items.push({ id: "ca-score", label: "Calcium score (0 to 4)", ok: c.score === t.calcium.score, given: shown(c.score, (x) => x.toFixed(0)), expected: String(t.calcium.score) });
  }
  items.push({ id: "prep", label: "Preparation", ok: plan.prepTool === t.prepTool, given: plan.prepTool ?? "not entered", expected: t.prepTool === "modification" ? "calcium modification" : "balloon" });

  // sizing
  const sd = plan.stentDiameterMm;
  const stentOk = sd !== undefined && t.stentSizes.some((s) => Math.abs(s - sd) < 1e-6);
  const proximal = sd !== undefined && !stentOk && t.proximalStentSizes.some((s) => Math.abs(s - sd) < 1e-6) && sd > Math.max(...t.stentSizes);
  items.push({
    id: "stent",
    label: "Stent diameter from the distal reference (mm)",
    ok: stentOk,
    given: shown(sd),
    expected: list(t.stentSizes),
    flag: proximal ? "proximal-reference" : undefined,
    note: proximal ? "Sized to the proximal reference: the tapering distal vessel is overstretched and its edge dissects." : undefined,
  });
  const pd = plan.postDilMm;
  // a proximal balloon must also be larger than the stent the learner chose
  const postOk = t.postDilSizes.length
    ? pd !== undefined && pd !== null && t.postDilSizes.some((s) => Math.abs(s - pd) < 1e-6) && (sd === undefined || pd > sd + 1e-6)
    : pd === null || pd === undefined || (sd !== undefined && pd <= sd + 1e-6);
  items.push({
    id: "post-dil",
    label: "Proximal post-dilatation balloon (mm)",
    ok: postOk,
    given: pd === undefined ? "not entered" : pd === null ? "none" : f2(pd),
    expected: t.postDilSizes.length ? `${list(t.postDilSizes)}, larger than the stent` : "none needed (no taper beyond the stent)",
  });

  const correct = items.filter((i) => i.ok).length;
  return { items, correct, total: items.length, flags: items.map((i) => i.flag).filter((x): x is NonNullable<GradeItem["flag"]> => !!x), truth: t, modality: mg };
}

/** The entries the frames call for (the guided aid's answer, and the reference for the tests). */
export function exactPlan(l: BenchLesion, modality: Modality, population: Population = "general"): BenchPlan {
  const t = planTruth(l, modality);
  const mid = (r: RefTruth, k: "lumen" | "eem") => (k === "lumen" ? (r.lumenMin + r.lumenMax) / 2 : (r.eemMin + r.eemMax) / 2);
  const plan: BenchPlan = {
    modality,
    reasonId: l.goal?.reasonId ?? null,
    pullbacks: [...t.pullbacks],
    population,
    mla: t.mla,
    distRef: { method: "lumen", diameterMm: mid(t.distRef, "lumen") },
    proxRefMm: t.proxRef ? mid(t.proxRef, "lumen") : undefined,
    landingProxMm: t.landingProxMm,
    landingDistMm: t.landingDistMm,
    lengthMm: t.lengthMm,
    calcium: t.calcium ? { arcDeg: t.calcium.arcDeg, thicknessMm: t.calcium.thicknessMm, lengthMm: t.calcium.lengthMm, score: t.calcium.score ?? undefined } : "none",
    prepTool: t.prepTool,
    stentDiameterMm: t.stentSizes[0],
    postDilMm: t.postDilSizes.length ? t.postDilSizes[0] : null,
  };
  if (t.segments) plan.segments = { lm: t.segments.lm, ladOstium: t.segments.ladOstium, lcxOstium: t.segments.lcxOstium ?? undefined };
  if (l.leftMain && t.mla !== null) plan.significance = t.mla < lmThreshold(modality, population) ? "significant" : "not-significant";
  return plan;
}

// ---------------------------------------------------------------------------
// After the stent: the left main segments
// ---------------------------------------------------------------------------

export interface SegmentCheck {
  id: keyof typeof LM_SEGMENT_TARGETS_MM2;
  label: string;
  areaMm2: number;
  targetMm2: number;
  ok: boolean;
  /** how the area was found */
  basis: "stent" | "native";
}

/**
 * Each left main segment after stenting from the left main into the first branch, against its target
 * (Brilakis figure 17.3): the stented segments by their minimal stent area, the other branch's ostium by
 * its native lumen (the bench does not treat it). Null for a lesion without branch pullbacks.
 */
export function lmSegmentCheck(l: BenchLesion, result: StentResult): SegmentCheck[] | null {
  const poc = l.branches?.[0]?.atMm;
  if (poc === undefined) return null;
  const stentArea = (a: number, b: number): number | null => {
    const pts = result.profile.filter((p) => p.x >= a - 1e-9 && p.x <= b + 1e-9);
    if (!pts.length) return null;
    return Math.min(...pts.map((p) => area(Math.max(p.d, p.lumen))));
  };
  const native = (g: BenchLesion, a: number, b: number) => minLumen(g, a, b).area;
  const x0 = l.ostial ? l.ostial.aortaMm : 0;
  const pick = (a: number, b: number, g: BenchLesion) => {
    const s = stentArea(a, b);
    return s === null ? { areaMm2: native(g, a, b), basis: "native" as const } : { areaMm2: s, basis: "stent" as const };
  };
  const out: SegmentCheck[] = [];
  const lm = pick(x0, poc - MP_LM_SEGMENT_MM.poc, l);
  out.push({ id: "lm", label: "Left main above the polygon of confluence", targetMm2: LM_SEGMENT_TARGETS_MM2.lm, ok: lm.areaMm2 >= LM_SEGMENT_TARGETS_MM2.lm, ...lm });
  const pc = pick(poc - MP_LM_SEGMENT_MM.poc, poc, l);
  out.push({ id: "poc", label: "Polygon of confluence", targetMm2: LM_SEGMENT_TARGETS_MM2.poc, ok: pc.areaMm2 >= LM_SEGMENT_TARGETS_MM2.poc, ...pc });
  const lad = pick(poc + 0.25, poc + MP_LM_SEGMENT_MM.ostium, branchLesion(l, l.branches![0].id));
  out.push({ id: "ladOstium", label: "LAD ostium", targetMm2: LM_SEGMENT_TARGETS_MM2.ladOstium, ok: lad.areaMm2 >= LM_SEGMENT_TARGETS_MM2.ladOstium, ...lad });
  const lcx = l.branches!.find((b) => b.id === "LCx");
  if (lcx) {
    const a = native(branchLesion(l, lcx.id), poc + 0.25, poc + MP_LM_SEGMENT_MM.ostium);
    out.push({ id: "lcxOstium", label: "Circumflex ostium", areaMm2: a, targetMm2: LM_SEGMENT_TARGETS_MM2.lcxOstium, ok: a >= LM_SEGMENT_TARGETS_MM2.lcxOstium, basis: "native" });
  }
  return out;
}
