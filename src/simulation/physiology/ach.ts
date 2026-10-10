// ---------------------------------------------------------------------------
// Coronary function test in ANOCA with acetylcholine provocation
// (physiology-anoca-cft; lesson pm-physiology-microvascular).
//
// The study in the UK consensus order the lesson teaches (protocol steps 4-8):
//   1  low-dose intracoronary GTN (200 µg or less) before any reading
//   2  resting thermodilution: brisk 3-4 mL saline injections, the same each
//      time, until three transit times agree within 10% (physiology.ts tdAgree)
//   3  IV adenosine 140 µg/kg/min; hyperaemia confirmed by its markers
//      (physiology.ts hyperaemiaMarkers) before the hyperaemic injections
//   4  hyperaemic thermodilution: CFR, IMR and FFR together
//   5  the drift check at the ostium (0.03 or more: re-equalise and repeat)
//   6  acetylcholine last, with ECG, the symptom question and angiograms in two
//      views at least 30° apart; the response read against the COVADIS criteria
//      as CorMicA applied them; the endotype and the treatment direction.
//
// The study is a pure, engine-free reducer on a model clock ({ type: "tick" }),
// like the pressure-wire session (pci/pwSession.ts). Its physics is
// physiology.ts (flow, Pd/Pa, transit times). Acetylcholine is not in the
// patient engine's formulary (found-patient-formulary adds drugs; this package
// does not), so its effects on the heart rate and conduction are modelled here,
// as labelled hazards: transient bradycardia with every dose, AV block with an
// RCA dose (lesson: "bradycardia is common and usually self-limiting"; the RCA
// dose is halved to reduce it). Everything marked MP_ is a MODEL PARAMETER
// (docs/realism/facts/pkg-physiology-anoca-cft.md); the doses, cut-offs and
// definitions carry their source location.
//
// What the screen may show (src/ui/physiology/CftPanel.tsx): the console's
// pressures and transit times, the monitor (heart rate, ECG), what the patient
// says when asked, and the narrowing an angiogram run shows. The endotype, the
// response criteria met and the order errors are for the debrief (cftItems).
// ---------------------------------------------------------------------------

import { CUTOFF, HR, IV_ADENOSINE_HR_RISE_BPM, IV_ADENOSINE_SYSTOLIC_FALL_MMHG, MP_SYSTEMIC_H, PHYS_BY_ID, TD_AGREEMENT, hyperaemiaMarkers, indices, tdAgree, tdInjectionConsistent, tdLastThree, tdMeanTransit, tdSeriesMean, tdTransitTime, thermodilution, type CoronaryCase, type HyperaemiaMarkers } from "../physiology";
import { ADENOSINE, MP_ADENOSINE_IV_OFF_TAU_S, ivAdenosineSteadyLevel, ivAdenosineTauS } from "../patient/pharmacology";
import { MP_PACING_RATE_BPM, MP_REST_H, MP_SUBMAXIMAL_H } from "../pci/pwSession";
import { normal, rngFrom, type RngState } from "../pci/rng";

/** The last element of a list (ES2020 has no Array.prototype.at). */
const lastOf = <T,>(xs: readonly T[]): T | undefined => xs[xs.length - 1];

// --- the protocol, held as data with its source -------------------------------------------------

/** Where the protocol numbers come from. */
export const ACH_SOURCE = "lesson pm-physiology-microvascular, table 'Acetylcholine regimens in use' (UK consensus; CorMicA review), typical doses: follow local protocol";

/** Acetylcholine solution strength, µg/mL (the same table: 100 µg is 5.5 mL of an 18.2 µg/mL solution). */
export const ACH_CONCENTRATION_UG_ML = 18.2;

export type AchRegimen = "uk-bolus" | "stepped" | "infusion";
export type CftSide = "left" | "right";
export type CftRoute = "guide" | "microcatheter";

export interface AchStep {
  /** dose of this step, µg */
  doseUg: number;
  /** how long it is given over, s */
  durationS: number;
  /** the solution strength, µg/mL */
  concentrationUgMl: number;
}

export interface AchProtocol {
  id: AchRegimen;
  label: string;
  source: string;
  /** steps into the left coronary and into the RCA */
  steps: Readonly<Record<CftSide, readonly AchStep[]>>;
  /** the longest gap between doses, s (stepped practice: up to 3 minutes); the debrief checks it (cftItems 'step-gap') */
  maxGapS?: number;
  /** an infusion through the guide leaves acetylcholine in it ('After the infusion': aspirate before flushing) */
  infusion: boolean;
}

const bolus = (doseUg: number): AchStep => ({ doseUg, durationS: 20, concentrationUgMl: ACH_CONCENTRATION_UG_ML });
/** 2 minutes of each strength at 1 mL/min into the left coronary, the rate halved in the RCA. */
const infusionSteps = (mlPerMin: number): AchStep[] => [0.182, 1.82, 18.2].map((c) => ({ doseUg: c * mlPerMin * 2, durationS: 120, concentrationUgMl: c }));

/** The acetylcholine regimens of the lesson (ACH_SOURCE). */
export const ACH_PROTOCOLS: Readonly<Record<AchRegimen, AchProtocol>> = {
  "uk-bolus": {
    id: "uk-bolus",
    label: "Spasm provocation, UK consensus: 100 µg into the left coronary over 20 s, or 50 µg into the RCA",
    source: `${ACH_SOURCE}: row 'Spasm provocation, UK consensus'`,
    steps: { left: [bolus(100)], right: [bolus(50)] },
    infusion: false,
  },
  stepped: {
    id: "stepped",
    label: "Spasm provocation, stepped: 20, 50, 100 and 200 µg into the left, or 20, 50 and 80 µg into the RCA, 20 s each",
    source: `${ACH_SOURCE}: row 'Spasm provocation, Japanese practice (CorMicA review)'`,
    steps: { left: [20, 50, 100, 200].map(bolus), right: [20, 50, 80].map(bolus) },
    maxGapS: 180,
    infusion: false,
  },
  infusion: {
    id: "infusion",
    label: "Endothelial function: 2 minutes each of 0.182, 1.82 and 18.2 µg/mL at 1 mL/min (half the rate in the RCA)",
    source: `${ACH_SOURCE}: row 'Endothelial function (needs Doppler flow)'`,
    steps: { left: infusionSteps(1), right: infusionSteps(0.5) },
    infusion: true,
  },
};

/** Intracoronary GTN before any reading, at most this, µg (lesson pm-physiology-microvascular, protocol step 4). */
export const CFT_GTN_MAX_UG = 200;
/** GTN half-life, s (the same step: about 2 minutes). Display and teaching only. */
export const GTN_HALF_LIFE_S = 120;
/** IV adenosine for the hyperaemic step, µg/kg/min (protocol step 6). */
export const CFT_IV_ADENOSINE_UG_KG_MIN = ADENOSINE.ivStandardUgKgMin;
/** Epicardial constriction that defines epicardial spasm, fraction of diameter (table 'Reading the response': 90% or more). */
export const ACH_EPICARDIAL_SPASM = 0.9;
/** Constriction during the infusion that defines severe endothelial dysfunction (the same table: 20% or more). */
export const ACH_ENDOTHELIAL_CONSTRICTION = 0.2;
/** Angiograms before and after acetylcholine in two projections at least this far apart, degrees ('Imaging for QCA'). */
export const ACH_VIEW_SEPARATION_DEG = 30;
/** The response is read up to this long after each dose, s (stepped practice: angiography 1 minute after each injection). */
export const ACH_READ_WINDOW_S = 60;

// --- model parameters (docs/realism/facts/pkg-physiology-anoca-cft.md) ---------------------------

/** Time from the start of a dose to pain and ECG change, s — MODEL PARAMETER. */
export const MP_ACH_ONSET_S = 8;
/** Heart-rate fall per µg (left-equivalent) during a dose — MODEL PARAMETER (100 µg into the left: 30%). */
export const MP_ACH_BRADY_PER_UG = 0.003;
/** The largest heart-rate fall a dose causes, fraction — MODEL PARAMETER. */
export const MP_ACH_BRADY_MAX = 0.5;
/** Recovery of the heart rate after a dose ends, time constant s — MODEL PARAMETER ("usually self-limiting"). */
export const MP_ACH_BRADY_TAU_S = 8;
/** An RCA dose of at least this brings transient AV block, µg — MODEL PARAMETER (the lesson's lower RCA dose, at most 50-80 µg, "may reduce it"). */
export const MP_ACH_RCA_AVB_UG = 50;
/** AV block lasts this long after the dose ends, s — MODEL PARAMETER. */
export const MP_ACH_AVB_S = 15;
/** Ventricular escape rate during AV block, beats/min — MODEL PARAMETER. */
export const MP_ACH_ESCAPE_HR = 35;
/** Share of the acetylcholine slowing and block that IV atropine removes — MODEL PARAMETER. */
export const MP_ATROPINE_SHARE = 0.8;
/** An RCA dose counts as this many times its µg against the left's thresholds (the lesson halves RCA doses) — MODEL PARAMETER. */
export const MP_RCA_DOSE_WEIGHT = 2;
/** Unrelieved epicardial or microvascular spasm resolves on its own after this, s — MODEL PARAMETER. */
export const MP_SPASM_PERSIST_S = 300;
/** Intracoronary nitrate relieves spasm over this, s ("relieves it quickly") — MODEL PARAMETER. */
export const MP_NITRATE_RELIEF_S = 30;
/** Acetylcholine left in the guide after an infusion through it, mL (its dead space) — MODEL PARAMETER. */
export const MP_GUIDE_DEAD_SPACE_ML = 2;
/** Where acetylcholine spasm sits along the tested vessel, 0 ostium … 1 distal (proximal to the parked sensor) — MODEL PARAMETER. */
export const MP_SPASM_POS = 0.45;
/** Length of the constricted segment, mm (diffuse spasm over the mid vessel) — MODEL PARAMETER. */
export const MP_SPASM_LENGTH_MM = 30;
/** The wire's drift builds over this long after equalisation, s — MODEL PARAMETER. */
export const MP_CFT_DRIFT_BUILD_S = 90;
/** A spasm-prone vessel below its threshold dose constricts by this — MODEL PARAMETER. */
export const MP_SUBTHRESHOLD_CONSTRICTION = 0.15;
/** Pain score (0-10) of reproduced usual angina — MODEL PARAMETER. */
export const MP_USUAL_PAIN_SCORE = 7;
/** Share of a provoked spasm left after a large nitrate dose before the test (the lesson's pitfall: it masks spasm) — MODEL PARAMETER. */
export const MP_NITRATE_MASK_SHARE = 0.3;
/** Epicardial constriction at which the run shows spasm as an event (coronary-spasm), fraction — MODEL PARAMETER. */
export const MP_SPASM_EVENT_CONSTRICTION = 0.5;
/** An unaspirated flush or contrast injection pushes the acetylcholine left in the guide in over this, s — MODEL PARAMETER. */
export const MP_ACCIDENTAL_BOLUS_S = 2;
/** The operator's eyeball estimate of the narrowing on a run scatters by this SD, fraction of diameter — MODEL PARAMETER. */
export const MP_ANGIO_EYE_SD = 0.05;
/** The eyeball estimate is read to the nearest this, fraction of diameter (nearest 10%) — MODEL PARAMETER. */
export const MP_ANGIO_EYE_STEP = 0.1;

// --- endotypes and their treatment direction --------------------------------------------------

export type Endotype = "obstructive" | "microvascular-angina" | "microvascular-spasm" | "vasospastic-angina" | "mixed" | "endothelial-dysfunction" | "non-cardiac";
export type CftTreatment = "manage-lesion" | "beta-blocker-first" | "ccb" | "ccb-nitrate" | "both" | "reassure";

/** The endotypes, with the lesson's definitions and treatment directions (tables 'Reading the response' and 'Endotype, then treatment'). */
export const ENDOTYPES: readonly { id: Endotype; label: string; definition: string; treatment: CftTreatment | null }[] = [
  { id: "obstructive", label: "Obstructive epicardial disease", definition: "FFR 0.80 or less: an epicardial lesion, not ANOCA (protocol step 3)", treatment: "manage-lesion" },
  { id: "microvascular-angina", label: "Microvascular angina (impaired dilatation)", definition: "FFR above 0.80 with a low CFR or a high IMR (either is enough)", treatment: "beta-blocker-first" },
  { id: "microvascular-spasm", label: "Microvascular spasm", definition: "The usual pain and ischaemic ECG changes with acetylcholine, without 90% epicardial constriction", treatment: "ccb" },
  { id: "vasospastic-angina", label: "Vasospastic angina (epicardial spasm)", definition: "The usual pain, ischaemic ECG changes and epicardial constriction of 90% or more", treatment: "ccb-nitrate" },
  { id: "mixed", label: "Mixed: microvascular angina and vasospastic angina", definition: "Both pathways", treatment: "both" },
  { id: "endothelial-dysfunction", label: "Severe epicardial endothelial dysfunction", definition: "Luminal constriction of 20% or more during the infusion", treatment: null },
  { id: "non-cardiac", label: "Non-cardiac chest pain", definition: "FFR above 0.80, CFR and IMR normal and no acetylcholine response", treatment: "reassure" },
];

export const TREATMENTS: readonly { id: CftTreatment; label: string }[] = [
  { id: "manage-lesion", label: "Manage the epicardial lesion" },
  { id: "beta-blocker-first", label: "Beta-blocker first, then a calcium-channel blocker; ACE inhibitor and statin" },
  { id: "ccb", label: "Calcium-channel blocker; ACE inhibitor, nicorandil and statin" },
  { id: "ccb-nitrate", label: "Calcium-channel blocker with nitrates; avoid beta-blockers" },
  { id: "both", label: "Treat both pathways" },
  { id: "reassure", label: "Reassure and look for other causes" },
];

export const endotypeOf = (id: Endotype) => ENDOTYPES.find((e) => e.id === id)!;

/** What the acetylcholine test showed: the largest response to any dose. */
export interface AchFindings {
  /** largest epicardial constriction to a bolus, fraction of diameter (negative: dilatation) */
  maxConstriction: number;
  /** largest constriction during the endothelial-function infusion (0 when none was given) */
  infusionConstriction: number;
  /** the patient's usual pain was reproduced */
  usualPain: boolean;
  /** ischaemic ECG changes */
  ischaemicEcg: boolean;
}

export interface CftFindings {
  ffr: number;
  cfr: number;
  imr: number;
  /** null: acetylcholine not tested */
  ach: AchFindings | null;
}

/**
 * The endotype by the lesson's definitions: FFR first (0.80 or less is an epicardial lesion), then the
 * microcirculation (CFR below the cut-off or IMR 25 or more: either establishes microvascular
 * dysfunction), then the acetylcholine response (COVADIS as applied in CorMicA). `cfrCut` is CorMicA's
 * 2.0 by default; the UK consensus uses CUTOFF.cfrUk (2.5).
 */
export function classifyEndotype(f: CftFindings, cfrCut: number = CUTOFF.cfr): Endotype | null {
  if (f.ffr <= CUTOFF.ffr) return "obstructive";
  const cmd = f.cfr < cfrCut || f.imr >= CUTOFF.imr;
  const a = f.ach;
  const vsa = !!a && a.usualPain && a.ischaemicEcg && a.maxConstriction >= ACH_EPICARDIAL_SPASM;
  const mvs = !!a && a.usualPain && a.ischaemicEcg && a.maxConstriction < ACH_EPICARDIAL_SPASM;
  if (vsa) return cmd ? "mixed" : "vasospastic-angina";
  if (cmd) return "microvascular-angina";
  if (mvs) return "microvascular-spasm";
  if (!a) return null; // vasomotion untested: no endotype yet
  if (a.infusionConstriction >= ACH_ENDOTHELIAL_CONSTRICTION) return "endothelial-dysfunction";
  return "non-cardiac";
}

// --- vasoreactivity per endotype ----------------------------------------------------------------

/**
 * How the vessel answers acetylcholine (MODEL PARAMETERS, chosen so that each preset meets its
 * endotype's definition): a normal vessel dilates; microvascular disease without spasm barely changes;
 * epicardial spasm closes the vessel to 90% or more at or above the threshold dose; microvascular spasm
 * reproduces the pain with ST depression and little epicardial change.
 */
export interface Vasoreactivity {
  kind: "dilates" | "none" | "epicardial-spasm" | "microvascular-spasm";
  /** left-equivalent dose that provokes the spasm, µg */
  thresholdUg?: number;
  /** constriction once provoked (or always, for "dilates" and "none"), fraction of diameter */
  constriction: number;
  /** constriction at the top strength of the endothelial-function infusion */
  infusionConstriction: number;
}

export interface AchResponse {
  constriction: number;
  pain: number;
  usualPain: boolean;
  ecg: "none" | "st-elevation" | "st-depression";
  spasm: "epicardial" | "microvascular" | null;
}

const NO_RESPONSE: AchResponse = { constriction: 0, pain: 0, usualPain: false, ecg: "none", spasm: null };

/** The response to one dose (left-equivalent µg) by the vessel's vasoreactivity. */
export function achResponse(v: Vasoreactivity, leftEqUg: number, infusion: boolean, topInfusionLeftEqUg: number, masked = false): AchResponse {
  if (infusion) {
    const share = Math.max(0, Math.min(1, leftEqUg / topInfusionLeftEqUg));
    return { ...NO_RESPONSE, constriction: v.infusionConstriction * share };
  }
  if (v.kind === "dilates" || v.kind === "none") return { ...NO_RESPONSE, constriction: v.constriction };
  const provoked = leftEqUg >= (v.thresholdUg ?? Infinity);
  if (!provoked) return { ...NO_RESPONSE, constriction: MP_SUBTHRESHOLD_CONSTRICTION };
  const r: AchResponse =
    v.kind === "epicardial-spasm"
      ? { constriction: v.constriction, pain: MP_USUAL_PAIN_SCORE, usualPain: true, ecg: "st-elevation", spasm: "epicardial" }
      : { constriction: v.constriction, pain: MP_USUAL_PAIN_SCORE, usualPain: true, ecg: "st-depression", spasm: "microvascular" };
  if (!masked) return r;
  return { ...NO_RESPONSE, constriction: Math.max(MP_SUBTHRESHOLD_CONSTRICTION, r.constriction * MP_NITRATE_MASK_SHARE) };
}

// --- presets ----------------------------------------------------------------------------------

export interface AnocaPreset {
  id: string;
  /** the title in the list (does not name the endotype) */
  title: string;
  brief: string;
  case: CoronaryCase;
  vasoreactivity: Vasoreactivity;
  /** the answer: classifyEndotype of what the study shows (ach.test.ts checks it) */
  endotype: Endotype;
  /** the wire's drift over the study, mmHg (0: none) */
  driftMmHg: number;
  /** shown after the classification */
  teaching: string;
}

const SMOOTH = PHYS_BY_ID.anoca;
const START = "Right radial access, heparin given. The guide is engaged in the left coronary; your assistant has equalised the pressure wire at the guide tip and parked the sensor 6 cm into the LAD.";

/** The four ANOCA presets (lesson pm-physiology-microvascular). */
export const ANOCA_PRESETS: readonly AnocaPreset[] = [
  {
    id: "anoca-cmd",
    title: "Coronary function test 1: exertional angina, smooth coronaries",
    brief: `54-year-old woman with typical exertional angina despite bisoprolol and amlodipine. Angiography: smooth coronaries with mild LAD irregularity. ${START}`,
    case: { ...SMOOTH, id: "anoca-cmd" },
    vasoreactivity: { kind: "none", constriction: 0.1, infusionConstriction: 0.1 },
    endotype: "microvascular-angina",
    driftMmHg: 0,
    teaching: "FFR above 0.80 rules out an epicardial lesion; CFR below 2.0 and IMR 25 or more establish microvascular dysfunction, and acetylcholine provoked no spasm: microvascular angina with impaired dilatation. Beta-blockers first, then calcium-channel blockers, with ACE inhibitors and statins (CorMicA review).",
  },
  {
    id: "anoca-epicardial-spasm",
    title: "Coronary function test 2: angina at rest and on exertion",
    brief: `49-year-old man, a smoker, with angina at rest in the early morning as well as on exertion. Angiography: unobstructed coronaries. ${START}`,
    case: { ...SMOOTH, id: "anoca-epicardial-spasm", cfrPotential: 3.6 },
    vasoreactivity: { kind: "epicardial-spasm", thresholdUg: 50, constriction: 0.95, infusionConstriction: 0.15 },
    endotype: "vasospastic-angina",
    driftMmHg: 0,
    teaching: "CFR and IMR are normal, so the microcirculation dilates normally. Acetylcholine reproduced the usual pain with ST elevation and 90% or more constriction of the LAD: epicardial vasospasm (vasospastic angina). Calcium-channel blockers with nitrates; beta-blockers are relatively contraindicated.",
  },
  {
    id: "anoca-microvascular-spasm",
    title: "Coronary function test 3: exertional and rest angina, normal stress test",
    brief: `61-year-old woman with exertional and rest angina and a normal exercise test. Angiography: unobstructed coronaries. ${START} The wire has been in the vessel for some time.`,
    case: { ...SMOOTH, id: "anoca-microvascular-spasm", cfrPotential: 3.4, lesions: [{ id: "mild", pos: 0.4, ds: 0.2, lengthMm: 6 }] },
    vasoreactivity: { kind: "microvascular-spasm", thresholdUg: 100, constriction: 0.25, infusionConstriction: 0.1 },
    endotype: "microvascular-spasm",
    driftMmHg: 3.5,
    teaching: "CFR and IMR are normal. Acetylcholine reproduced the usual pain with ischaemic ST depression but without 90% epicardial constriction: microvascular spasm, a functional form of microvascular angina. Calcium-channel blockers. The wire had drifted: a drift of 0.03 or more at the ostium means re-equalise and repeat.",
  },
  {
    id: "anoca-normal",
    title: "Coronary function test 4: atypical chest pain, smooth coronaries",
    brief: `45-year-old woman with intermittent chest pain unrelated to exertion. Angiography: smooth coronaries. ${START}`,
    case: { ...SMOOTH, id: "anoca-normal", cfrPotential: 3.6, lesions: [{ id: "mild", pos: 0.4, ds: 0.15, lengthMm: 5 }] },
    vasoreactivity: { kind: "dilates", constriction: -0.1, infusionConstriction: -0.05 },
    endotype: "non-cardiac",
    driftMmHg: 0,
    teaching: "FFR above 0.80, CFR and IMR normal and no response to acetylcholine: the coronary circulation is normal and the pain is non-cardiac. Reassure, and look for other causes.",
  },
];

export const ANOCA_PRESET_BY_ID: Readonly<Record<string, AnocaPreset>> = Object.fromEntries(ANOCA_PRESETS.map((p) => [p.id, p]));
export const isAnocaPreset = (id: string): boolean => !!ANOCA_PRESET_BY_ID[id];

/** What the preset's study shows at its true values, for checking its answer (not shown in the lab). */
export function presetFindings(p: AnocaPreset, regimen: AchRegimen = "uk-bolus"): CftFindings {
  const td = thermodilution(p.case);
  const top = topInfusionLeftEq("left");
  const r = achResponse(p.vasoreactivity, lastOf(ACH_PROTOCOLS[regimen].steps.left)!.doseUg, ACH_PROTOCOLS[regimen].infusion, top);
  return { ffr: td.ffr, cfr: td.cfr, imr: td.imr, ach: { maxConstriction: r.constriction, infusionConstriction: 0, usualPain: r.usualPain, ischaemicEcg: r.ecg !== "none" } };
}

function topInfusionLeftEq(side: CftSide): number {
  const s = lastOf(ACH_PROTOCOLS.infusion.steps[side])!;
  return s.doseUg * (side === "right" ? MP_RCA_DOSE_WEIGHT : 1);
}

// --- views ------------------------------------------------------------------------------------

/** Projections for the acetylcholine angiograms: LAO positive, RAO negative; cranial positive, caudal negative. */
export const CFT_VIEWS: readonly { id: string; label: string; lao: number; cranial: number }[] = [
  { id: "rao-caudal", label: "RAO 30° caudal 20°", lao: -30, cranial: -20 },
  { id: "rao-cranial", label: "RAO 30° cranial 30°", lao: -30, cranial: 30 },
  { id: "ap-cranial", label: "AP cranial 40°", lao: 0, cranial: 40 },
  { id: "lao-cranial", label: "LAO 40° cranial 30°", lao: 40, cranial: 30 },
];

const viewById = (id: string) => CFT_VIEWS.find((v) => v.id === id);

/** Angle between two projections' beam directions, degrees. */
export function viewSeparationDeg(a: string, b: string): number {
  const va = viewById(a);
  const vb = viewById(b);
  if (!va || !vb) return 0;
  const dir = (v: { lao: number; cranial: number }) => {
    const l = (v.lao * Math.PI) / 180;
    const c = (v.cranial * Math.PI) / 180;
    return [Math.sin(l) * Math.cos(c), Math.sin(c), Math.cos(l) * Math.cos(c)];
  };
  const [x, y] = [dir(va), dir(vb)];
  const dot = Math.max(-1, Math.min(1, x[0] * y[0] + x[1] * y[1] + x[2] * y[2]));
  return (Math.acos(dot) * 180) / Math.PI;
}

/** Some two of these views lie at least ACH_VIEW_SEPARATION_DEG apart. */
export function twoViewsApart(viewIds: readonly string[]): boolean {
  for (let i = 0; i < viewIds.length; i++) for (let j = i + 1; j < viewIds.length; j++) if (viewSeparationDeg(viewIds[i], viewIds[j]) >= ACH_VIEW_SEPARATION_DEG) return true;
  return false;
}

// --- state ------------------------------------------------------------------------------------

export type CftChecklistItem = "pads" | "pacing" | "nitrate" | "atropine";
export const CFT_CHECKLIST: readonly { id: CftChecklistItem; label: string; source: string }[] = [
  { id: "pads", label: "Defibrillator pads and ECG leads on", source: "pm-physiology-microvascular, 'Safety during acetylcholine': Before" },
  { id: "pacing", label: "Team warned; pacing available (needed for RCA testing)", source: "the same step: pacing, though seldom needed, may be required" },
  { id: "nitrate", label: "Intracoronary nitrate drawn up for spasm", source: "the same table: Spasm, intracoronary nitrate relieves it quickly" },
  { id: "atropine", label: "Atropine drawn up", source: "the same table: AV block, IV atropine; Spasm, intracoronary atropine if nitrate fails" },
];

export type CftIvSite = "peripheral" | "central";

export interface CftAdenosine {
  rate: number;
  site: CftIvSite;
  t0: number;
  stoppedAt: number | null;
  /** hyperaemia when stopped */
  hAtStop: number;
}

export interface CftInjection {
  t: number;
  state: "rest" | "hyp";
  volumeMl: number;
  brisk: boolean;
  consistent: boolean;
  /** transit time, s (what the console shows) */
  tmn: number;
  h: number;
  /** mean aortic and distal pressures at the injection, mmHg (with the wire's offset) */
  pa: number;
  pd: number;
  /** re-equalisation count when taken: an injection of an earlier epoch no longer counts */
  epoch: number;
  /** why the debrief does not trust it (empty when fine) */
  problems: string[];
}

export interface CftDose {
  id: number;
  regimen: AchRegimen | "accidental";
  step: number;
  side: CftSide;
  route: CftRoute;
  doseUg: number;
  leftEqUg: number;
  t0: number;
  durationS: number;
  stoppedAt: number | null;
  response: AchResponse;
  /** intracoronary nitrate (or atropine) given for this dose's spasm */
  relievedAt: number | null;
}

export interface CftAngio {
  t: number;
  view: string;
  /** the narrowing the run shows, fraction of diameter (negative: wider than at baseline); measured (QCA), for the debrief */
  constriction: number;
  /** the same narrowing as the operator judges it by eye on the live screen (angioEstimate) */
  looks: number;
  /** the dose whose response it shows (null: a baseline run) */
  doseId: number | null;
}

export interface CftError {
  id: string;
  t: number;
  label: string;
}

export interface CftLogEntry {
  t: number;
  label: string;
  value: string;
  /** a neutral detail of what was done (route, vein, volume): shown in every mode */
  note?: string;
  /** why it went wrong or what to do next: a teaching aid, shown only with the guided aids (and in the debrief) */
  hint?: string;
  /** the entry records something that went wrong: styled so only with the guided aids */
  bad?: boolean;
}

export interface CftState {
  presetId: string;
  t: number;
  rng: RngState;
  gtn: { t: number; doseUg: number }[];
  adenosine: CftAdenosine[];
  guide: "engaged" | "deep";
  injections: CftInjection[];
  epoch: number;
  /** the wire was last equalised at this time; drift (preset.driftMmHg) builds from the start only */
  reEqualisedAt: number | null;
  driftChecks: { t: number; pdpa: number; ok: boolean; epoch: number }[];
  checklist: CftChecklistItem[];
  doses: CftDose[];
  /** acetylcholine left in the guide after an infusion through it, µg */
  guideAchUg: number;
  angios: CftAngio[];
  pacing: boolean;
  ivAtropineAt: number | null;
  nitrateAt: number[];
  icAtropineAt: number[];
  painAsked: { t: number; answer: string; during: number | null }[];
  errors: CftError[];
  log: CftLogEntry[];
  answer: { endotype: Endotype; treatment: CftTreatment | null } | null;
}

export type CftAction =
  | { type: "tick"; dt: number }
  | { type: "gtn"; doseUg: number }
  | { type: "saline"; volumeMl: number; brisk: boolean }
  | { type: "iv-adenosine"; rate: number; site: CftIvSite }
  | { type: "stop-adenosine" }
  | { type: "guide"; position: "engaged" | "deep" }
  | { type: "drift-check" }
  | { type: "re-equalise" }
  | { type: "check"; item: CftChecklistItem }
  | { type: "ach"; regimen: AchRegimen; side: CftSide; route: CftRoute; step?: number }
  | { type: "stop-ach" }
  | { type: "aspirate-guide" }
  | { type: "flush-guide" }
  | { type: "angio"; view: string }
  | { type: "ask-pain" }
  | { type: "ic-nitrate" }
  | { type: "ic-atropine" }
  | { type: "iv-atropine" }
  | { type: "pacing"; on: boolean }
  | { type: "classify"; endotype: Endotype; treatment?: CftTreatment | null };

export function initialCftState(presetId: string, seed: string | number = presetId): CftState {
  const id = ANOCA_PRESET_BY_ID[presetId] ? presetId : ANOCA_PRESETS[0].id;
  return {
    presetId: id,
    t: 0,
    rng: rngFrom(`cft:${id}:${seed}`),
    gtn: [],
    adenosine: [],
    guide: "engaged",
    injections: [],
    epoch: 0,
    reEqualisedAt: null,
    driftChecks: [],
    checklist: [],
    doses: [],
    guideAchUg: 0,
    angios: [],
    pacing: false,
    ivAtropineAt: null,
    nitrateAt: [],
    icAtropineAt: [],
    painAsked: [],
    errors: [],
    log: [],
    answer: null,
  };
}

export const cftPreset = (s: Pick<CftState, "presetId">): AnocaPreset => ANOCA_PRESET_BY_ID[s.presetId] ?? ANOCA_PRESETS[0];

/** The case as the guide sits now (a deep guide plugs the left main and obstructs flow). */
export function cftCase(s: CftState): CoronaryCase {
  const c = cftPreset(s).case;
  return s.guide === "deep" ? { ...c, guideObstructs: true } : c;
}

/**
 * The case the pressures follow at a constriction: the acetylcholine narrowing (a positive constriction,
 * fraction of diameter) added as a temporary lesion at MP_SPASM_POS, upstream of the sensor. Dilatation
 * (negative) and no constriction leave the case as it is.
 */
export function cftCaseWith(s: CftState, constriction: number): CoronaryCase {
  const c = cftCase(s);
  if (!(constriction > 0)) return c;
  return { ...c, lesions: [...c.lesions, { id: "ach", pos: MP_SPASM_POS, ds: Math.min(0.99, constriction), lengthMm: MP_SPASM_LENGTH_MM }] };
}

// --- time-dependent readings ---------------------------------------------------------------------

const IV_REF = ivAdenosineSteadyLevel(CFT_IV_ADENOSINE_UG_KG_MIN);

/** Hyperaemia fraction now from IV adenosine (0 rest … 1 maximal), the engine's IV model normalised to 140 µg/kg/min. */
export function cftHyperaemia(s: Pick<CftState, "adenosine" | "t">, t = s.t): number {
  const a = lastOf(s.adenosine);
  if (!a || t < a.t0) return 0;
  const target = Math.min(1, ivAdenosineSteadyLevel(a.rate) / IV_REF);
  const tau = ivAdenosineTauS(a.site);
  if (a.stoppedAt === null || t < a.stoppedAt) return target * (1 - Math.exp(-(t - a.t0) / tau));
  return a.hAtStop * Math.exp(-(t - a.stoppedAt) / MP_ADENOSINE_IV_OFF_TAU_S);
}

/** IV adenosine is running. */
export const adenosineRunning = (s: Pick<CftState, "adenosine">): boolean => {
  const a = lastOf(s.adenosine);
  return !!a && a.stoppedAt === null;
};

/** The wire's offset now, mmHg: the preset's drift builds from the start until the wire is re-equalised. */
export function wireOffset(s: CftState, t = s.t): number {
  const d = cftPreset(s).driftMmHg;
  if (!d || s.reEqualisedAt !== null) return 0;
  return d * Math.min(1, t / MP_CFT_DRIFT_BUILD_S);
}

const doseEnd = (d: CftDose) => Math.min(d.t0 + d.durationS, d.stoppedAt ?? Infinity);

/** A dose's spasm persists until relieved (or MP_SPASM_PERSIST_S). */
function spasmUntil(d: CftDose): number {
  if (!d.response.spasm) return -Infinity;
  return d.relievedAt !== null ? d.relievedAt + MP_NITRATE_RELIEF_S : d.t0 + MP_SPASM_PERSIST_S;
}

/** The dose is being given or its response is being read (or its spasm lasts). */
export function doseActive(d: CftDose, t: number): boolean {
  if (t < d.t0) return false;
  return t < doseEnd(d) + ACH_READ_WINDOW_S || t < spasmUntil(d);
}

/** The acetylcholine dose active now, if any (the latest). */
export function activeDose(s: Pick<CftState, "doses" | "t">, t = s.t): CftDose | null {
  for (let i = s.doses.length - 1; i >= 0; i--) if (doseActive(s.doses[i], t)) return s.doses[i];
  return null;
}

/** Acetylcholine is being given now: the 'ach-provocation' event of the tip vocabulary. */
export const achProvocation = (s: Pick<CftState, "doses" | "t">, t = s.t): boolean => activeDose(s, t) !== null;

/** How much of a dose's response is present at t (0..1): it builds over the delivery and fades with relief or the window. */
function responseShare(d: CftDose, t: number): number {
  if (t < d.t0) return 0;
  const build = Math.min(1, (t - d.t0) / Math.max(1, Math.min(d.durationS, doseEnd(d) - d.t0)));
  if (d.response.spasm) {
    if (d.relievedAt !== null && t >= d.relievedAt) return build * Math.max(0, 1 - (t - d.relievedAt) / MP_NITRATE_RELIEF_S);
    return t < spasmUntil(d) ? build : 0;
  }
  return t < doseEnd(d) + ACH_READ_WINDOW_S ? build : 0;
}

/** Epicardial constriction now, fraction of diameter (the largest of the doses' responses). */
export function constrictionNow(s: Pick<CftState, "doses" | "t">, t = s.t): number {
  let c = 0;
  for (const d of s.doses) {
    const k = responseShare(d, t);
    if (k > 0 && Math.abs(d.response.constriction * k) > Math.abs(c)) c = d.response.constriction * k;
  }
  return c;
}

/**
 * The narrowing as the operator judges it by eye on the run (fraction of diameter): the measured value
 * with a seeded observer error (MP_ANGIO_EYE_SD), read to the nearest MP_ANGIO_EYE_STEP and kept within
 * −0.2 … 1. The live screen shows this; the measured value is for the guided aids and the debrief.
 */
export function angioEstimate(constriction: number, r: RngState): number {
  const e = constriction + normal(r, 0, MP_ANGIO_EYE_SD);
  const q = Math.round(e / MP_ANGIO_EYE_STEP) * MP_ANGIO_EYE_STEP;
  return Math.max(-0.2, Math.min(1, Math.round(q * 100) / 100)) || 0; // no negative zero
}

/** The pain and ECG now (a response counts once it has built halfway, after MP_ACH_ONSET_S). */
export function symptomsNow(s: Pick<CftState, "doses" | "t">, t = s.t): { pain: number; usualPain: boolean; ecg: AchResponse["ecg"] } {
  let best: { pain: number; usualPain: boolean; ecg: AchResponse["ecg"] } = { pain: 0, usualPain: false, ecg: "none" };
  for (const d of s.doses) {
    if (!d.response.pain && d.response.ecg === "none") continue;
    if (t < d.t0 + MP_ACH_ONSET_S || responseShare(d, t) < 0.5) continue;
    if (d.response.pain > best.pain) best = { pain: d.response.pain, usualPain: d.response.usualPain, ecg: d.response.ecg };
  }
  return best;
}

export interface CftVitals {
  hr: number;
  /** the sinus (atrial) rate: the patient's own rate with the adenosine rise and the acetylcholine slowing, whether or not it conducts */
  sinusHr: number;
  /** 0 conducted, 3 complete AV block */
  av: 0 | 3;
  /** mean aortic pressure the patient has, mmHg */
  map: number;
  /** the aortic (guide) trace is recorded (an injection through the guide interrupts it) */
  aorticTrace: boolean;
  ecg: AchResponse["ecg"];
  pain: number;
  /** the patient feels IV adenosine */
  systemic: boolean;
  paced: boolean;
}

/** The monitor now: heart rate (acetylcholine slowing and RCA block, labelled hazards), pressure, ECG and pain. */
export function cftVitals(s: CftState, t = s.t): CftVitals {
  const c = cftPreset(s).case;
  const h = cftHyperaemia(s, t);
  const atropine = s.ivAtropineAt !== null && s.ivAtropineAt <= t ? 1 - MP_ATROPINE_SHARE : 1;
  let drop = 0;
  let block = false;
  for (const d of s.doses) {
    if (t < d.t0) continue;
    const end = doseEnd(d);
    const full = Math.min(MP_ACH_BRADY_MAX, MP_ACH_BRADY_PER_UG * d.leftEqUg);
    const k = t <= end ? 1 : Math.exp(-(t - end) / MP_ACH_BRADY_TAU_S);
    drop = Math.max(drop, full * k * atropine);
    const avb = d.side === "right" && d.doseUg >= MP_ACH_RCA_AVB_UG && t >= d.t0 + MP_ACH_ONSET_S && t < end + MP_ACH_AVB_S;
    if (avb && atropine === 1) block = true;
  }
  const own = (HR + IV_ADENOSINE_HR_RISE_BPM * h) * (1 - drop);
  const hr = block ? (s.pacing ? MP_PACING_RATE_BPM : MP_ACH_ESCAPE_HR) : s.pacing ? Math.max(own, MP_PACING_RATE_BPM) : own;
  const delivering = s.doses.some((d) => d.route === "guide" && t >= d.t0 && t < doseEnd(d));
  const sym = symptomsNow(s, t);
  return {
    hr,
    sinusHr: own,
    av: block ? 3 : 0,
    map: c.map - IV_ADENOSINE_SYSTOLIC_FALL_MMHG * h,
    aorticTrace: !delivering,
    ecg: sym.ecg,
    pain: sym.pain,
    systemic: adenosineRunning(s) && h >= MP_SYSTEMIC_H,
    paced: s.pacing,
  };
}

/** The hyperaemia markers the operator can see now (physiology.ts hyperaemiaMarkers). */
export function cftMarkers(s: CftState, t = s.t): HyperaemiaMarkers {
  const h = cftHyperaemia(s, t);
  return hyperaemiaMarkers(cftCase(s), h, adenosineRunning(s), s.guide === "deep");
}

/** The console's mean pressures now, mmHg (Pd with the wire's offset; acetylcholine spasm upstream of the sensor lowers Pd). */
export function cftPressures(s: CftState, t = s.t): { pa: number; pd: number; pdpa: number } {
  const v = cftVitals(s, t);
  const ix = indices(cftCaseWith(s, constrictionNow(s, t)), 1, cftHyperaemia(s, t), s.guide === "deep");
  const pd = v.map * ix.pdpa + wireOffset(s, t);
  return { pa: v.map, pd, pdpa: pd / v.map };
}

// --- the console's indices ----------------------------------------------------------------------

export interface CftReadings {
  rest: number[];
  hyp: number[];
  restAgree: boolean;
  hypAgree: boolean;
  tmnRest: number | null;
  tmnHyp: number | null;
  cfr: number | null;
  imr: number | null;
  ffr: number | null;
}

/** The series of the current epoch (rest injections count across a re-equalisation: CFR does not use pressure). */
export function cftSeries(s: CftState): { rest: CftInjection[]; hyp: CftInjection[] } {
  return { rest: s.injections.filter((i) => i.state === "rest"), hyp: s.injections.filter((i) => i.state === "hyp" && i.epoch === s.epoch) };
}

/** Tmn, CFR, IMR and FFR as the console gives them from the last three injections of each series. */
export function cftReadings(s: CftState): CftReadings {
  const { rest, hyp } = cftSeries(s);
  const rt = rest.map((i) => i.tmn);
  const ht = hyp.map((i) => i.tmn);
  const tmnRest = rt.length >= 3 ? tdSeriesMean(rt) : null;
  const tmnHyp = ht.length >= 3 ? tdSeriesMean(ht) : null;
  const last = hyp.slice(-3);
  const pd = last.length ? last.reduce((a, i) => a + i.pd, 0) / last.length : null;
  const pa = last.length ? last.reduce((a, i) => a + i.pa, 0) / last.length : null;
  return {
    rest: rt,
    hyp: ht,
    restAgree: tdAgree(rt),
    hypAgree: tdAgree(ht),
    tmnRest,
    tmnHyp,
    cfr: tmnRest !== null && tmnHyp !== null ? tmnRest / tmnHyp : null,
    imr: tmnHyp !== null && pd !== null ? pd * tmnHyp : null,
    ffr: tmnHyp !== null && pd !== null && pa !== null ? pd / pa : null,
  };
}

// --- the reducer ----------------------------------------------------------------------------------

const log = (s: CftState, e: Omit<CftLogEntry, "t">): CftState => ({ ...s, log: [...s.log, { t: s.t, ...e }] });
const err = (s: CftState, id: string, label: string): CftState => (s.errors.some((e) => e.id === id) ? s : { ...s, errors: [...s.errors, { id, t: s.t, label }] });

/** The order errors the reducer can record (labels for the debrief). */
export const ORDER_ERRORS = {
  "reading-before-gtn": "A reading was taken before the low-dose nitrate",
  "gtn-large": "More than 200 µg of nitrate before the test: it can mask spasm",
  "adenosine-before-rest": "IV adenosine before the resting thermodilution was complete",
  "hyp-before-hyperaemia": "Hyperaemic injections before hyperaemia was established",
  "guide-deep": "Thermodilution with the guide plugging the left main",
  "ach-before-rest-td": "Acetylcholine before the resting thermodilution",
  "ach-before-adenosine": "Acetylcholine before the adenosine measurements",
  "ach-before-drift": "Acetylcholine before the drift check (or with the drift not corrected)",
  "adenosine-after-ach": "Adenosine measurements after acetylcholine: resting flow and CFR may be inaccurate",
  "ach-without-pads": "Acetylcholine without pads and ECG leads on",
  "rca-without-pacing": "Acetylcholine into the RCA without pacing available",
  "unaspirated-flush": "The guide was flushed or injected without aspirating the acetylcholine: an extra bolus",
  "dose-after-positive": "A further acetylcholine dose after a positive test",
} as const;
export type CftOrderError = keyof typeof ORDER_ERRORS;

/** The next step of a regimen into a side (the count of earlier doses of that regimen and side), or null when it is complete. */
export function nextAchStep(s: CftState, regimen: AchRegimen, side: CftSide): number | null {
  const done = s.doses.filter((d) => d.regimen === regimen && d.side === side).length;
  return done < ACH_PROTOCOLS[regimen].steps[side].length ? done : null;
}

/** Any dose so far gave a positive response (spasm of either kind). */
const positiveSoFar = (s: CftState) => s.doses.some((d) => d.response.spasm !== null);

function giveDose(s: CftState, d: Omit<CftDose, "id" | "t0" | "stoppedAt" | "relievedAt" | "response" | "leftEqUg">): CftState {
  const p = cftPreset(s);
  const leftEqUg = d.doseUg * (d.side === "right" ? MP_RCA_DOSE_WEIGHT : 1);
  const masked = s.gtn.reduce((a, g) => a + g.doseUg, 0) > CFT_GTN_MAX_UG;
  const infusion = d.regimen !== "accidental" && ACH_PROTOCOLS[d.regimen].infusion;
  const response = achResponse(p.vasoreactivity, leftEqUg, infusion, topInfusionLeftEq("left"), masked);
  const dose: CftDose = { ...d, id: s.doses.length + 1, leftEqUg, t0: s.t, stoppedAt: null, relievedAt: null, response };
  return { ...s, doses: [...s.doses, dose] };
}

/** The guide is flushed or contrast is injected: acetylcholine left in it goes in as a bolus. */
function pushGuide(s: CftState, what: string): CftState {
  if (s.guideAchUg <= 0) return s;
  const last = lastOf(s.doses);
  const side = last?.side ?? "left";
  let n = giveDose({ ...s, guideAchUg: 0 }, { regimen: "accidental", step: 0, side, route: "guide", doseUg: s.guideAchUg, durationS: MP_ACCIDENTAL_BOLUS_S });
  n = err(n, "unaspirated-flush", ORDER_ERRORS["unaspirated-flush"]);
  return log(n, { label: what, value: "done", hint: "the acetylcholine in the guide went in with it", bad: true });
}

export function cftReducer(s: CftState, a: CftAction): CftState {
  if (s.answer && a.type !== "tick") return s;
  switch (a.type) {
    case "tick": {
      const dt = Math.max(0, a.dt);
      return { ...s, t: s.t + dt };
    }
    case "gtn": {
      let n: CftState = { ...s, gtn: [...s.gtn, { t: s.t, doseUg: a.doseUg }] };
      if (n.gtn.reduce((x, g) => x + g.doseUg, 0) > CFT_GTN_MAX_UG) n = err(n, "gtn-large", ORDER_ERRORS["gtn-large"]);
      return log(n, { label: "Intracoronary GTN", value: `${a.doseUg} µg` });
    }
    case "saline": {
      const h = cftHyperaemia(s);
      const state: "rest" | "hyp" = adenosineRunning(s) || h > MP_REST_H ? "hyp" : "rest";
      const series = state === "rest" ? cftSeries(s).rest : cftSeries(s).hyp;
      const problems: string[] = [];
      let n = s;
      if (!s.gtn.length) {
        problems.push("before the nitrate");
        n = err(n, "reading-before-gtn", ORDER_ERRORS["reading-before-gtn"]);
      }
      if (s.guide === "deep") {
        problems.push("guide plugging the left main");
        n = err(n, "guide-deep", ORDER_ERRORS["guide-deep"]);
      }
      // the lesson's criterion: the four markers of hyperaemia (they appear at MP_SUBMAXIMAL_H, physiology.ts MP_WAVE_MARKER_H0)
      if (state === "hyp" && !cftMarkers(s).confirmed) {
        problems.push("hyperaemia not established");
        n = err(n, "hyp-before-hyperaemia", ORDER_ERRORS["hyp-before-hyperaemia"]);
      }
      if (s.doses.length) problems.push("after acetylcholine");
      const consistent = tdInjectionConsistent(a, series[0] ?? null);
      if (!consistent) problems.push("injection not the same as the others");
      const r = { ...s.rng };
      const tmn = tdTransitTime(tdMeanTransit(cftCase(s), h, s.guide === "deep"), consistent, r);
      const p = cftPressures(s);
      const inj: CftInjection = { t: s.t, state, volumeMl: a.volumeMl, brisk: a.brisk, consistent, tmn, h, pa: p.pa, pd: p.pd, epoch: s.epoch, problems };
      n = { ...n, rng: r, injections: [...n.injections, inj] };
      const k = (state === "rest" ? cftSeries(n).rest : cftSeries(n).hyp).length;
      return log(n, { label: `Tmn (${state === "rest" ? "rest" : "hyperaemia"}) ${k}`, value: `${tmn.toFixed(2)} s`, note: `${a.volumeMl} mL${a.brisk ? "" : ", slow push"}` });
    }
    case "iv-adenosine": {
      if (adenosineRunning(s)) return log(s, { label: "IV adenosine", value: "already running" });
      let n = s;
      if (!tdAgree(cftSeries(s).rest.map((i) => i.tmn))) n = err(n, "adenosine-before-rest", ORDER_ERRORS["adenosine-before-rest"]);
      if (s.doses.length) n = err(n, "adenosine-after-ach", ORDER_ERRORS["adenosine-after-ach"]);
      n = { ...n, adenosine: [...n.adenosine, { rate: a.rate, site: a.site, t0: s.t, stoppedAt: null, hAtStop: 0 }] };
      return log(n, { label: "IV adenosine", value: `${a.rate} µg/kg/min`, note: a.site === "central" ? "central vein" : "antecubital vein" });
    }
    case "stop-adenosine": {
      if (!adenosineRunning(s)) return s;
      const h = cftHyperaemia(s);
      const ad = s.adenosine.map((x, i) => (i === s.adenosine.length - 1 ? { ...x, stoppedAt: s.t, hAtStop: h } : x));
      return log({ ...s, adenosine: ad }, { label: "IV adenosine", value: "stopped" });
    }
    case "guide":
      if (s.guide === a.position) return s;
      return log({ ...s, guide: a.position }, { label: "Guide", value: a.position === "deep" ? "seated deeply" : "engaged coaxially" });
    case "drift-check": {
      const p = cftPressures(s);
      const off = wireOffset(s);
      // at the ostium the distal and aortic pressures are the same but for the wire's offset
      const pdpa = (p.pa + off) / p.pa;
      const ok = Math.abs(pdpa - 1) < CUTOFF.cftDrift;
      const n: CftState = { ...s, driftChecks: [...s.driftChecks, { t: s.t, pdpa, ok, epoch: s.epoch }] };
      return log(n, { label: "Pd/Pa at the ostium", value: pdpa.toFixed(2), note: "sensor pulled back to the guide tip, then parked again", ...(ok ? {} : { hint: "drift of 0.03 or more: re-equalise and repeat", bad: true }) });
    }
    case "re-equalise":
      return log({ ...s, reEqualisedAt: s.t, epoch: s.epoch + 1 }, { label: "Wire", value: "re-equalised at the guide tip", hint: "repeat the hyperaemic measurements" });
    case "check":
      if (s.checklist.includes(a.item)) return s;
      return { ...s, checklist: [...s.checklist, a.item] };
    case "ach": {
      const proto = ACH_PROTOCOLS[a.regimen];
      if (adenosineRunning(s) || cftHyperaemia(s) > MP_REST_H) return log(s, { label: "Acetylcholine", value: "not given", hint: "stop the adenosine and let it wear off first", bad: true });
      if (activeDose(s)) return log(s, { label: "Acetylcholine", value: "not given", hint: "wait for the response to the last dose", bad: true });
      const step = a.step ?? nextAchStep(s, a.regimen, a.side);
      if (step === null || step !== nextAchStep(s, a.regimen, a.side)) return log(s, { label: "Acetylcholine", value: "not given", hint: "not the next dose of this regimen", bad: true });
      const st = proto.steps[a.side][step];
      let n = s;
      const r = cftReadings(s);
      if (!r.restAgree) n = err(n, "ach-before-rest-td", ORDER_ERRORS["ach-before-rest-td"]);
      if (!r.hypAgree) n = err(n, "ach-before-adenosine", ORDER_ERRORS["ach-before-adenosine"]);
      const lastHyp = lastOf(cftSeries(s).hyp);
      const drift = lastOf(s.driftChecks.filter((d) => d.epoch === s.epoch && (!lastHyp || d.t >= lastHyp.t)));
      if (!drift || !drift.ok) n = err(n, "ach-before-drift", ORDER_ERRORS["ach-before-drift"]);
      if (!s.checklist.includes("pads")) n = err(n, "ach-without-pads", ORDER_ERRORS["ach-without-pads"]);
      if (a.side === "right" && !s.checklist.includes("pacing")) n = err(n, "rca-without-pacing", ORDER_ERRORS["rca-without-pacing"]);
      if (positiveSoFar(s)) n = err(n, "dose-after-positive", ORDER_ERRORS["dose-after-positive"]);
      n = giveDose(n, { regimen: a.regimen, step, side: a.side, route: a.route, doseUg: st.doseUg, durationS: st.durationS });
      if (proto.infusion && a.route === "guide") n = { ...n, guideAchUg: MP_GUIDE_DEAD_SPACE_ML * st.concentrationUgMl };
      const dose = Math.round(st.doseUg * 100) / 100;
      return log(n, { label: `Acetylcholine ${a.side === "right" ? "RCA" : "left coronary"}`, value: `${dose} µg over ${st.durationS} s`, note: a.route === "microcatheter" ? "through a microcatheter" : "through the guide" });
    }
    case "stop-ach": {
      const d = activeDose(s);
      if (!d || s.t >= doseEnd(d)) return s;
      return log({ ...s, doses: s.doses.map((x) => (x.id === d.id ? { ...x, stoppedAt: s.t } : x)) }, { label: "Acetylcholine", value: "stopped" });
    }
    case "aspirate-guide":
      return log({ ...s, guideAchUg: 0 }, { label: "Guide", value: "aspirated" });
    case "flush-guide":
      return s.guideAchUg > 0 ? pushGuide(s, "Guide flush") : log(s, { label: "Guide", value: "flushed" });
    case "angio": {
      if (!viewById(a.view)) return s;
      const n = pushGuide(s, "Contrast injection");
      const d = activeDose(n);
      const c = constrictionNow(n);
      const ang: CftAngio = { t: n.t, view: a.view, constriction: c, looks: angioEstimate(c, rngFrom(`${n.rng.s}:angio:${n.angios.length}`)), doseId: d?.id ?? null };
      return log({ ...n, angios: [...n.angios, ang] }, { label: "Angiogram", value: viewById(a.view)!.label });
    }
    case "ask-pain": {
      const sym = symptomsNow(s);
      const answer = sym.pain > 0 ? (sym.usualPain ? "Yes, that's my usual pain" : "It hurts, but not like my usual pain") : "No pain";
      const d = activeDose(s);
      return log({ ...s, painAsked: [...s.painAsked, { t: s.t, answer, during: d?.id ?? null }] }, { label: "Is this your usual pain?", value: answer });
    }
    case "ic-nitrate":
    case "ic-atropine": {
      // nitrate relieves spasm quickly; intracoronary atropine reverses acetylcholine if nitrate fails
      const doses = s.doses.map((d) => (d.response.spasm && d.relievedAt === null && s.t >= d.t0 && s.t < spasmUntil(d) ? { ...d, relievedAt: s.t } : d));
      const n: CftState = a.type === "ic-nitrate" ? { ...s, doses, nitrateAt: [...s.nitrateAt, s.t] } : { ...s, doses, icAtropineAt: [...s.icAtropineAt, s.t] };
      return log(n, { label: a.type === "ic-nitrate" ? "Intracoronary nitrate" : "Intracoronary atropine", value: "given" });
    }
    case "iv-atropine":
      if (s.ivAtropineAt !== null) return s;
      return log({ ...s, ivAtropineAt: s.t }, { label: "IV atropine", value: "given" });
    case "pacing":
      if (s.pacing === a.on) return s;
      return log({ ...s, pacing: a.on }, { label: "Temporary pacing", value: a.on ? "on" : "off" });
    case "classify":
      return { ...s, answer: { endotype: a.endotype, treatment: a.treatment ?? null } };
  }
}

// --- the debrief --------------------------------------------------------------------------------

export interface CftItem {
  id: string;
  label: string;
  ok: boolean;
  lessonId: string;
  tipIds?: string[];
}

const LESSON = "pm-physiology-microvascular";

/** What the study showed, as the learner measured it (the console's indices and the observed response). */
export function cftFindings(s: CftState): CftFindings | null {
  const r = cftReadings(s);
  if (r.cfr === null || r.imr === null || r.ffr === null) return null;
  const bolus = s.doses.filter((d) => d.regimen !== "infusion");
  const inf = s.doses.filter((d) => d.regimen === "infusion");
  if (!s.doses.length) return { ffr: r.ffr, cfr: r.cfr, imr: r.imr, ach: null };
  const maxC = bolus.reduce((m, d) => Math.max(m, d.response.constriction), -Infinity);
  return {
    ffr: r.ffr,
    cfr: r.cfr,
    imr: r.imr,
    ach: {
      maxConstriction: Number.isFinite(maxC) ? maxC : 0,
      infusionConstriction: inf.reduce((m, d) => Math.max(m, d.response.constriction), 0),
      usualPain: s.doses.some((d) => d.response.usualPain),
      ischaemicEcg: s.doses.some((d) => d.response.ecg !== "none"),
    },
  };
}

/** The study's checks for the debrief (each with its lesson). */
export function cftItems(s: CftState): CftItem[] {
  const p = cftPreset(s);
  const r = cftReadings(s);
  const has = (id: CftOrderError) => s.errors.some((e) => e.id === id);
  const firstReading = s.injections[0]?.t ?? Infinity;
  const gtnOk = s.gtn.length > 0 && s.gtn[0].t <= firstReading && !has("gtn-large");
  const positive = s.doses.filter((d) => d.response.spasm);
  const epi = positive.filter((d) => d.response.spasm === "epicardial");
  const before = s.angios.filter((x) => x.doseId === null && (!s.doses.length || x.t <= s.doses[0].t0)).map((x) => x.view);
  const during = s.angios.filter((x) => x.doseId !== null).map((x) => x.view);
  const lastHyp = lastOf(cftSeries(s).hyp);
  const drift = lastOf(s.driftChecks.filter((d) => d.epoch === s.epoch && (!lastHyp || d.t >= lastHyp.t)));
  const infusedViaGuide = s.doses.some((d) => d.regimen === "infusion" && d.route === "guide");
  const items: CftItem[] = [
    { id: "gtn", label: "Low-dose nitrate (200 µg or less) before any reading", ok: gtnOk, lessonId: LESSON },
    { id: "rest-td", label: "Resting thermodilution: three injections within 10%", ok: r.restAgree, lessonId: LESSON, tipIds: ["pci-phys-thermodilution-boluses"] },
    { id: "hyperaemia", label: "IV adenosine 140 µg/kg/min, hyperaemia confirmed before the hyperaemic injections", ok: s.adenosine.some((a) => a.rate >= CFT_IV_ADENOSINE_UG_KG_MIN) && !has("hyp-before-hyperaemia") && !has("adenosine-before-rest"), lessonId: LESSON },
    { id: "hyp-td", label: "Hyperaemic thermodilution: three injections within 10%, giving CFR, IMR and FFR", ok: r.hypAgree && !has("guide-deep"), lessonId: LESSON, tipIds: ["pci-phys-thermodilution-boluses"] },
    { id: "drift", label: "Drift check at the ostium (0.03 or more: re-equalise and repeat)", ok: !!drift?.ok, lessonId: LESSON },
    { id: "order", label: "Acetylcholine last, after the adenosine measurements and the drift check", ok: s.doses.length > 0 && !has("ach-before-rest-td") && !has("ach-before-adenosine") && !has("ach-before-drift") && !has("adenosine-after-ach"), lessonId: LESSON },
    { id: "safety", label: "Pads on before acetylcholine; pacing available for the RCA", ok: s.doses.length > 0 && !has("ach-without-pads") && !has("rca-without-pacing"), lessonId: LESSON, tipIds: ["pci-phys-ach-prepare"] },
    { id: "views", label: "Angiograms in two views at least 30° apart before and after acetylcholine", ok: twoViewsApart(before) && twoViewsApart(during), lessonId: LESSON },
  ];
  if (positive.length) {
    items.push({ id: "asked", label: "Asked whether it was the usual pain during the response", ok: s.painAsked.some((q) => q.during !== null && positive.some((d) => d.id === q.during)), lessonId: LESSON });
    items.push({ id: "reversed", label: "Spasm reversed with intracoronary nitrate (atropine if it failed)", ok: positive.every((d) => d.relievedAt !== null), lessonId: LESSON, tipIds: ["pci-phys-ach-spasm"] });
  }
  if (epi.length || positive.length) items.push({ id: "no-extra-dose", label: "No further dose once the test was positive", ok: !has("dose-after-positive"), lessonId: LESSON });
  // stepped practice: up to 3 minutes between doses (ACH_PROTOCOLS.stepped.maxGapS); a debrief item, not an order error
  for (const side of ["left", "right"] as const) {
    const st = s.doses.filter((d) => d.regimen === "stepped" && d.side === side);
    const maxGap = ACH_PROTOCOLS.stepped.maxGapS;
    if (st.length >= 2 && maxGap !== undefined) {
      const ok = st.every((d, i) => i === 0 || d.t0 - doseEnd(st[i - 1]) <= maxGap);
      items.push({ id: `step-gap-${side}`, label: `Stepped doses${side === "right" ? " into the RCA" : ""} no more than 3 minutes apart`, ok, lessonId: LESSON });
    }
  }
  if (infusedViaGuide || has("unaspirated-flush")) items.push({ id: "aspirate", label: "Guide aspirated after the infusion, before flushing or contrast", ok: !has("unaspirated-flush"), lessonId: LESSON, tipIds: ["pci-phys-ach-prepare"] });
  items.push({ id: "endotype", label: `Endotype: ${endotypeOf(p.endotype).label}`, ok: s.answer?.endotype === p.endotype, lessonId: LESSON });
  const tr = endotypeOf(p.endotype).treatment;
  if (tr) items.push({ id: "treatment", label: `Treatment direction: ${TREATMENTS.find((x) => x.id === tr)!.label}`, ok: s.answer?.treatment === tr, lessonId: LESSON });
  return items;
}

export interface CftScore {
  score: number;
  passed: boolean;
  endotypeCorrect: boolean;
  orderErrors: CftOrderError[];
  metrics: Record<string, number>;
}

/** The study scored: the share of items done, passed when the endotype is right and no order or safety error was made. */
export function scoreCft(s: CftState): CftScore {
  const items = cftItems(s);
  const ok = items.filter((i) => i.ok).length;
  const endotypeCorrect = s.answer?.endotype === cftPreset(s).endotype;
  const orderErrors = s.errors.map((e) => e.id as CftOrderError);
  const r = cftReadings(s);
  return {
    score: Math.round((100 * ok) / Math.max(1, items.length)),
    passed: endotypeCorrect && orderErrors.length === 0,
    endotypeCorrect,
    orderErrors,
    metrics: {
      restInjections: r.rest.length,
      hypInjections: r.hyp.length,
      achDoses: s.doses.filter((d) => d.regimen !== "accidental").length,
      ...(r.cfr !== null ? { cfr: Math.round(r.cfr * 100) / 100 } : {}),
      ...(r.imr !== null ? { imr: Math.round(r.imr) } : {}),
      ...(r.ffr !== null ? { ffr: Math.round(r.ffr * 100) / 100 } : {}),
    },
  };
}

/** The three transit times of a series agree (re-exported for the panel). */
export { TD_AGREEMENT, tdLastThree };
