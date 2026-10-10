// ---------------------------------------------------------------------------
// Lesion assessment: the truth for scoring, the trainee's lesion measurement
// (QCA on a stored run or a visual estimate), the sizing basis, stent
// geometry of a placed stent and the route's tortuosity.
//
// pci-assessment-policy-qca: the measurement is the trainee's own (QCA on a
// stored run, calibrated on the guide, or a visual estimate); submitEstimate
// records it as 'lesion-estimate' telemetry against the truth for the debrief's
// 'assess' subskill. chooseSizing sizes from that measurement (or the
// trainee's own IVUS run assessment) and never from the truth: with nothing
// measured, or no measured lesion length, it records nothing. liveLog is the event log as an operator sees
// it: lines that name or grade a complication the learner has not recognised
// stay in the debrief.
// ---------------------------------------------------------------------------

import { deployStent, type StentGeom } from "../stentGeometry";
import { bendIntegrals } from "../geometry";
import { lesionTruth, scoreEstimate, sizeFor, type CaliperEstimate, type LesionTruth, type SizingBasis } from "../lesionAssessment";
import { causeRecognised } from "../../complications/engine";
import type { ComplicationKind } from "../../complications/types";
import { log, refDAt, tele, type PciEvent, type PciGeom, type PciState, type Placed } from "../state";

/** The trainee's lesion measurement: the caliper estimate, with how it was made. */
export interface LesionMeasurement extends CaliperEstimate {
  /** proximal and distal reference diameters, when the measurement gives them (QCA does) */
  refProxMm?: number;
  refDistMm?: number;
  /** QCA on a stored run, or the trainee's visual estimate */
  method?: "qca" | "visual";
  /** the visual estimate of the diameter stenosis made before QCA (the 'after-estimate' rule), % */
  visualDsPct?: number;
  /** QCA: the calibration (mm per stored pixel) and the catheter's French size it was made on */
  mmPerPx?: number;
  french?: number;
}

/** What the trainee's own IVUS run gives the sizing: the distal reference lumen (and EEM, when measured), mm. */
export interface SizingImaging {
  distRefLumen?: number;
  distRefEem?: number;
}

export function truthNow(g: PciGeom, st: PciState): LesionTruth {
  return lesionTruth(g, st.severity, st.route.includes(g.lesion.vessel) ? st.route : [g.lesion.vessel]);
}

/** Commit the trainee's lesion measurement (QCA or a visual estimate) as lesion-estimate telemetry against the truth. */
export function submitEstimate(g: PciGeom, st: PciState, est: CaliperEstimate | LesionMeasurement): PciState {
  const truth = truthNow(g, st);
  const score = scoreEstimate(est, truth);
  const m = est as LesionMeasurement;
  let n: PciState = { ...st, estimate: { est, score, t: st.t }, qcaRevealed: true };
  n = tele(n, "lesion-estimate", {
    refMm: est.refMm,
    mldMm: est.mldMm,
    lengthMm: est.lengthMm,
    ...(m.method ? { method: m.method } : {}),
    ...(m.refProxMm !== undefined ? { refProxMm: m.refProxMm } : {}),
    ...(m.refDistMm !== undefined ? { refDistMm: m.refDistMm } : {}),
    ...(m.visualDsPct !== undefined ? { visualDsPct: m.visualDsPct } : {}),
    ...(m.french !== undefined ? { french: m.french } : {}),
    truth: { refMm: truth.refMm, mldMm: truth.mldMm, lengthMm: truth.lengthMm, dsPct: truth.dsPct },
  });
  const how = m.method === "qca" ? "QCA" : m.method === "visual" ? "Visual estimate" : "Estimate";
  return log(n, "info", `${how} recorded: reference ${est.refMm.toFixed(2)} mm, MLD ${est.mldMm.toFixed(2)} mm, length ${est.lengthMm.toFixed(0)} mm.`);
}

/**
 * The sizing bases the trainee's own measurements allow now: none without a lesion measurement (the stent
 * length rests on it), the mean reference only when proximal and distal references were both measured,
 * and IVUS only with an IVUS run's reference recorded.
 */
export function sizingBases(st: PciState, ivus?: SizingImaging | null): SizingBasis[] {
  const out: SizingBasis[] = [];
  if (!st.estimate || !(st.estimate.est.lengthMm > 0)) return out;
  out.push("distal-reference");
  // the mean needs both references the trainee measured (QCA); a single visual reference offers no mean
  const e = st.estimate.est as LesionMeasurement;
  if (e.refProxMm !== undefined && e.refDistMm !== undefined) out.push("mean-reference");
  if (ivus?.distRefEem !== undefined) out.push("ivus-eem");
  if (ivus?.distRefLumen !== undefined) out.push("ivus-lumen");
  return out;
}

/**
 * The trainee's own IVUS reference (the latest pre-stent run assessment with a distal reference lumen area):
 * the diameter of a circle of that area, mm. Null when no such run was assessed.
 */
export function sizingImaging(st: PciState): SizingImaging | null {
  const a = (st.ivus?.assessments ?? []).filter((x) => !x.postStent && typeof x.distRefMm2 === "number" && x.distRefMm2 > 0).pop();
  return a ? { distRefLumen: 2 * Math.sqrt((a.distRefMm2 as number) / Math.PI) } : null;
}

/** The prompt when a sizing has no measured lesion length to rest on. */
export const MEASURE_LENGTH_PROMPT = "Measure the lesion length first: QCA on a stored run, or your estimate.";

/**
 * Choose a sizing basis; returns the stent size it implies, from the trainee's measurement (st.estimate) or
 * the trainee's IVUS reference, never from the case's truth (the engine's IVUS summary is not accepted).
 * Without the measurement the basis needs, the state is returned with a prompt in the log and no size. The
 * length always comes from the trainee's lesion measurement: an IVUS reference alone gives a diameter but
 * no measured length, so it too records no size and asks for the length.
 */
export function chooseSizing(g: PciGeom, st: PciState, basis: SizingBasis, ivus?: SizingImaging | null): PciState {
  void g;
  const est = st.estimate?.est as LesionMeasurement | undefined;
  const im = ivus ?? sizingImaging(st);
  const needsIvus = basis === "ivus-eem" ? im?.distRefEem === undefined : basis === "ivus-lumen" ? im?.distRefLumen === undefined : false;
  if (needsIvus) return log(st, "warn", "Size from IVUS after an IVUS run: record its distal reference first.");
  if (!est && (basis === "distal-reference" || basis === "mean-reference")) return log(st, "warn", "Measure the lesion first: QCA on a stored run, or your estimate.");
  // the stent length rests on the trainee's measured lesion length; IVUS here gives only a reference
  if (!est || !(est.lengthMm > 0)) return log(st, "warn", MEASURE_LENGTH_PROMPT);
  const m = {
    refProxMm: est.refProxMm ?? est.refMm,
    refDistMm: est.refDistMm ?? est.refMm,
    lengthMm: est.lengthMm,
    ivusDistEem: im?.distRefEem,
    ivusDistLumen: im?.distRefLumen,
  };
  const z = sizeFor(basis, m);
  return log(tele({ ...st, sizing: { basis, diameter: z.diameter, lengthMm: z.lengthMm } }, "sizing", { basis, diameter: z.diameter, lengthMm: z.lengthMm, rawMm: z.rawMm }), "info", `Sizing: ${z.diameter.toFixed(2)} × ${z.lengthMm} mm.`);
}

/**
 * Words that name or grade each kind of complication in a log line. A line with one is left out of the live
 * log until the learner has recognised that kind's cause (its notes then pass the engine's gate unchanged).
 * The engine's gate (complications/engine.ts) already keeps such notes off st.events; this is the
 * screen's own check, for any line that reaches the log by another path.
 */
const KIND_WORDS: Record<ComplicationKind, RegExp> = {
  dissection: /dissect|NHLBI|false lumen|intramural|haematoma/i,
  perforation: /perforat|Ellis|extravasat|tamponade/i,
  "no-reflow": /no[- ]?reflow|slow[- ]flow|TIMI/i,
  // the complication's own wording (thrombus, thrombi, embolus, emboli, embolised, distal embolisation), not
  // 'thrombosis' in a drug warning or 'coil embolisation' of a perforation's bail-out
  thrombus: /\bthromb(?:us|i)\b|\bembol(?:us|i|ised)\b|distal embolisation/i,
  air: /air embol/i,
  "side-branch": /side[- ]branch (?:occlu|closure|compromise|loss)/i,
};

/** The learner's own assessment line ("Assessed as: ..."): their answer, always shown. */
const OWN_ANSWER = /^Assessed as:/;

const KIND_ENTRIES = Object.entries(KIND_WORDS) as [ComplicationKind, RegExp][];

/** The kinds whose cause the learner has recognised. */
function recognisedKinds(st: Pick<PciState, "cx">): Set<ComplicationKind> {
  return new Set(st.cx.list.filter((c) => causeRecognised(c)).map((c) => c.kind));
}

/** namesUnrecognised against a recognised set built once (for a scan of the whole log). */
function namesUnrecognisedWith(recognised: ReadonlySet<ComplicationKind>, text: string): boolean {
  if (OWN_ANSWER.test(text)) return false;
  for (const [kind, re] of KIND_ENTRIES) if (!recognised.has(kind) && re.test(text)) return true;
  return false;
}

/** Does this log line name or grade a complication the learner has not recognised? */
export function namesUnrecognised(st: Pick<PciState, "cx">, text: string): boolean {
  return namesUnrecognisedWith(recognisedKinds(st), text);
}

/** The live log: what an operator could see or did (cues, device actions, the learner's answers), oldest first. */
export function liveLog(st: Pick<PciState, "cx" | "events">): PciEvent[] {
  const recognised = recognisedKinds(st);
  return st.events.filter((e) => !namesUnrecognisedWith(recognised, e.text));
}

/** The latest line of the live log (scanned from the end, no copy of the log), or undefined. */
export function lastLiveEvent(st: Pick<PciState, "cx" | "events">): PciEvent | undefined {
  let recognised: Set<ComplicationKind> | null = null;
  for (let i = st.events.length - 1; i >= 0; i--) {
    const e = st.events[i];
    recognised ??= recognisedKinds(st);
    if (!namesUnrecognisedWith(recognised, e.text)) return e;
  }
  return undefined;
}

/** Stent geometry of a placed stent (rings, apposition against the local reference lumen). */
export function stentGeomOf(g: PciGeom, p: Placed): StentGeom {
  const n = p.ringD.length;
  const ringAt = (u: number) => {
    const x = u * (n - 1);
    const i = Math.max(0, Math.min(n - 2, Math.floor(x)));
    const f = x - i;
    return n > 1 ? p.ringD[i] + (p.ringD[i + 1] - p.ringD[i]) * f : p.ringD[0];
  };
  const lumenAt = (u: number) => refDAt(g, p.route, p.fromMm + u * (p.toMm - p.fromMm));
  return deployStent(p.nominal, p.labelLengthMm, ringAt, lumenAt, { compressionMm: p.compressionMm });
}

/** Tortuosity of the route to the lesion (total turning, rad): a read-out for the debrief and tests. */
export function routeTurning(g: PciGeom, route: string[], toMm: number): number {
  return bendIntegrals(g, route, 0, toMm).turning;
}
