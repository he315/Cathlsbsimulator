// ---------------------------------------------------------------------------
// The retroperitoneal bleed (access-cx-bleeding-retroperitoneal): the pure
// parts. The session module src/simulation/session/modules/bleeding.ts keeps
// the case's state and calls these on its clock.
//
// Sources (module text, src/content/manual/**):
//   cm-access-complications-femoral-bleeding (complication-management/
//   06-access-complications.ts):
//     - the picture: hypotension, sweating, low abdominal or back pain, often a
//       slow pulse, most within 3 hours; a closure device does not exclude it
//       (lines 145-147);
//     - the dented bladder on fluoroscopy once contrast has been given, and the
//       haemoglobin that lags (149-150);
//     - Brilakis Fig. 29.4: general measures at once (large-bore or central
//       access, crystalloid without reflex large volumes, type and crossmatch
//       with early transfusion, a vasopressor if the pressure will not hold,
//       haemoglobin, pressure at the site); reversal once the diagnosis is made;
//       in the lab the bladder and angiography from the other groin; out of it,
//       unstable straight back to the lab or theatre and stable to CT; the
//       in-lab 'no bleeding' box read by the module's reasoning (a haematoma
//       without active bleeding: conservative; no haematoma: look for another
//       cause); active bleeding: a low-pressure balloon first, a covered stent
//       for a large vessel, coils for a small branch after excluding retrograde
//       filling, surgery if these fail (lines 160-200);
//   cm-patient-complications-bleeding (complication-management/
//   05-patient-complications.ts):
//     - reversal (975-980): protamine 1-1.5 mg per 100 units (Brilakis 3.4),
//       never more than 50 mg, no faster than 5 mg/min (Brilakis 26.2); no
//       antidote for cangrelor or a GP IIb/IIIa inhibitor (stop the infusion);
//       platelets for life-threatening bleeding on aspirin, clopidogrel or
//       prasugrel, which may fail with ticagrelor; for a DOAC (EHRA 2021):
//       idarucizumab 5 g IV in two 2.5 g doses for dabigatran, andexanet alfa
//       for apixaban or rivaroxaban (extrapolated to edoxaban), prothrombin
//       complex concentrate when a specific agent is unavailable;
//     - a protamine reaction 5-10 minutes after the dose (995);
//     - after the bleed (1056-1058): de-escalate ticagrelor or prasugrel to
//       clopidogrel 75 mg without a loading dose 24 hours after the last dose,
//       rather than stopping dual antiplatelet therapy after a new stent; the
//       pitfalls (1082-1085).
// Everything else here (the haemoglobin model, the stability line, the times
// the steps take, the drawing of the bladder) is a MODEL PARAMETER: a setting
// of the simulator that gives the right direction, not a clinical value
// (docs/realism/facts/pkg-access-cx-bleeding-retroperitoneal.md).
// ---------------------------------------------------------------------------

import { COMPRESSION } from "./compression";
import type { DoacAgent } from "../patient/pharmacology";

// ---------------------------------------------------------------------------
// Sourced numbers
// ---------------------------------------------------------------------------

export const RP_SOURCED = {
  /** most retroperitoneal bleeds present within 3 hours of the procedure (Brilakis 29.1.2) */
  presentationWithinH: 3,
  /** protamine: never more than 50 mg (Brilakis 3.4 and 26.2; Oxford) */
  protamineMaxMg: COMPRESSION.protamineMaxMg,
  /** protamine no faster than 5 mg/min (Brilakis 26.2) */
  protamineMaxMgPerMin: 5,
  /** idarucizumab 5 g IV in two 2.5 g doses (EHRA 2021, in the lesson) */
  idarucizumabTotalG: 5,
  idarucizumabDoseG: 2.5,
  /** the switch for bleeding: clopidogrel 75 mg, no loading dose, 24 hours after the last ticagrelor or prasugrel (Brilakis Fig. 3.5) */
  clopidogrelSwitchMg: 75,
  clopidogrelSwitchAfterH: 24,
  /** lab request cm-access-complications#0 (success): 'General measures within the first minute' (a scoring rule, not a clinical number) */
  generalMeasuresWithinS: 60,
} as const;

// ---------------------------------------------------------------------------
// Model parameters
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of the bleed and its management (simulator settings, not clinical values). */
export const MP_RP = {
  /**
   * 'Unstable' for the diagnostic route: the lowest true mean pressure over the last `stabilityWindowS` below
   * this (the shared adapter's hypotension line, src/ui/lab/patientEvents.ts) or a systolic below `unstableSysMmHg`
   */
  unstableMapMmHg: 65,
  unstableSysMmHg: 90,
  stabilityWindowS: 300,
  /** crystalloid before any red cells beyond this counts as reflex litres (the lesson: 'avoid reflex large-volume crystalloid') */
  reflexCrystalloidMl: 2000,
  /** the share of shed blood taken from the engine's stressed volume (the session's MP_SESSION.bleedStressedShare; keep in step) */
  stressedShare: 0.35,
  /** how long the steps take (s) */
  ctS: 1800,
  backToLabS: 600,
  teamContralateralS: 480,
  angioS: 120,
  retrogradeCheckS: 60,
  balloonS: 60,
  stentS: 900,
  coilS: 900,
  surgeryS: 3600,
  hbTurnaroundS: 120,
  /** a balloon inflated across the bleeding point holds the flow while it stays up (s) */
  balloonHoldS: 900,
  /** crystalloid bolus and its infusion time (s) */
  crystalloidBolusMl: 500,
  crystalloidOverS: 300,
  /** a unit of red cells: volume (mL, as MP_HYPOTENSION.bloodUnitMl), haemoglobin content (g) and infusion time (s) */
  redCellUnitMl: 300,
  redCellUnitHbG: 55,
  redCellUnitS: 600,
  /** the engine amounts behind the factor Xa reversal orders (engine units, not clinical doses: the lesson gives no figure) */
  andexanetEngineMg: 800,
  pccEngineU: 3000,
  /** the bladder screen shows a dented bladder once the haematoma reaches this volume (mL) */
  dentFromMl: 200,
} as const;

// ---------------------------------------------------------------------------
// Haemoglobin (a teaching model)
// ---------------------------------------------------------------------------

/**
 * MODEL PARAMETERS of the haemoglobin model. Whole blood lost leaves the concentration unchanged at first;
 * plasma refills the circulation over `refillTauMin` and dilutes what is left (so the measured value lags
 * the loss); crystalloid dilutes while it stays in the circulation; a unit of red cells adds its
 * haemoglobin. Baselines by sex are model settings, not reference ranges.
 */
export const MP_HB = {
  baselineGdl: { M: 14.0, F: 12.5 },
  bloodVolumeMlPerKg: { M: 70, F: 65 },
  refillTauMin: 50,
  /** share of the shed volume the circulation eventually refills from the interstitium */
  refillShare: 0.8,
  /** share of a crystalloid bolus still in the circulation once it has redistributed, and how fast it leaves */
  crystalloidRetainedShare: 0.25,
  crystalloidTauMin: 30,
} as const;

export interface HbModel {
  baselineGdl: number;
  /** circulating volume (mL) and the haemoglobin in it (g) */
  volumeMl: number;
  hbG: number;
  /** volume still to be refilled from the interstitium (mL), crystalloid still to leave the circulation (mL) */
  refillDueMl: number;
  crystalloidOutMl: number;
}

export function newHbModel(sex: "M" | "F", weightKg: number): HbModel {
  const baselineGdl = MP_HB.baselineGdl[sex];
  const volumeMl = MP_HB.bloodVolumeMlPerKg[sex] * Math.max(30, weightKg);
  return { baselineGdl, volumeMl, hbG: (baselineGdl * volumeMl) / 100, refillDueMl: 0, crystalloidOutMl: 0 };
}

/** The circulating concentration now (g/dL). */
export function hbNow(m: HbModel): number {
  return m.volumeMl > 0 ? (m.hbG / m.volumeMl) * 100 : 0;
}

/**
 * Advance the model by `dtS` with what happened in that step: whole blood lost (mL), crystalloid given (mL),
 * red cells given (mL of a unit and its haemoglobin, g). Mutates and returns the model.
 */
export function stepHb(m: HbModel, dtS: number, o: { lostMl?: number; crystalloidMl?: number; redCellMl?: number; redCellHbG?: number } = {}): HbModel {
  const lost = Math.max(0, o.lostMl ?? 0);
  if (lost > 0 && m.volumeMl > lost) {
    m.hbG -= (m.hbG / m.volumeMl) * lost;
    m.volumeMl -= lost;
    m.refillDueMl += lost * MP_HB.refillShare;
  }
  const c = Math.max(0, o.crystalloidMl ?? 0);
  if (c > 0) {
    m.volumeMl += c;
    m.crystalloidOutMl += c * (1 - MP_HB.crystalloidRetainedShare);
  }
  const rc = Math.max(0, o.redCellMl ?? 0);
  if (rc > 0) {
    m.volumeMl += rc;
    m.hbG += Math.max(0, o.redCellHbG ?? 0);
  }
  const dtMin = Math.max(0, dtS) / 60;
  if (dtMin > 0) {
    const refill = m.refillDueMl * (1 - Math.exp(-dtMin / MP_HB.refillTauMin));
    m.refillDueMl -= refill;
    m.volumeMl += refill;
    const out = m.crystalloidOutMl * (1 - Math.exp(-dtMin / MP_HB.crystalloidTauMin));
    m.crystalloidOutMl -= out;
    m.volumeMl -= out;
  }
  return m;
}

/** A measured value as the lab reports it: g/L, whole numbers (UK practice). */
export const hbGl = (gdl: number) => Math.round(gdl * 10);

// ---------------------------------------------------------------------------
// Where the patient is, stability, and the diagnostic route
// ---------------------------------------------------------------------------

/** Where the bleed presents: on the table, in recovery, or back in the laboratory from recovery. */
export type RpWhere = "table" | "recovery" | "lab";

/** What lies behind it: an active large-vessel or small-branch bleed, a haematoma that has stopped, or no haematoma at all. */
export type RpSource = "large-vessel" | "small-branch" | "haematoma-no-active" | "no-haematoma";

export const isActiveSource = (s: RpSource) => s === "large-vessel" || s === "small-branch";
export const hasHaematoma = (s: RpSource) => s !== "no-haematoma";

/** Unstable for the route: the lowest true mean pressure in the window, or the systolic now, below the model line. */
export function isUnstable(minMapMmHg: number, sysMmHg: number): boolean {
  return minMapMmHg < MP_RP.unstableMapMmHg || sysMmHg < MP_RP.unstableSysMmHg;
}

/** The diagnostic routes the learner can take. */
export type RpRoute = "bladder" | "contralateral-angio" | "ct" | "back-to-lab";

export const RP_ROUTE_LABEL: Record<RpRoute, string> = {
  bladder: "Screen the bladder on fluoroscopy",
  "contralateral-angio": "Iliofemoral angiography from the other groin",
  ct: "CT of the abdomen and pelvis",
  "back-to-lab": "Back to the catheter laboratory",
};

/** The route Brilakis Fig. 29.4 takes for this patient (the lesson's step 3 to 5). */
export function expectedRoute(where: RpWhere, unstable: boolean): string {
  if (where !== "recovery") return "Still in the laboratory: screen the bladder, then iliofemoral angiography from the other groin";
  return unstable ? "Out of the laboratory and unstable: straight back to the laboratory (or theatre); no CT that delays treatment" : "Out of the laboratory and stable: CT of the abdomen and pelvis";
}

/** Grade the first diagnostic step (pure). */
export function gradeRoute(where: RpWhere, unstable: boolean, chosen: RpRoute): { correct: boolean; expected: string } {
  const expected = expectedRoute(where, unstable);
  if (where !== "recovery") return { correct: chosen === "bladder" || chosen === "contralateral-angio", expected };
  return { correct: unstable ? chosen === "back-to-lab" : chosen === "ct", expected };
}

// ---------------------------------------------------------------------------
// Investigation results (what the image shows; the learner reads it)
// ---------------------------------------------------------------------------

/** What iliofemoral angiography from the other groin shows, in words (the image is the operator's to read). */
export function angioFinding(source: RpSource, side: "right" | "left"): string {
  const s = side === "right" ? "right" : "left";
  switch (source) {
    case "large-vessel":
      return `Contrast streams out of the ${s} external iliac artery just above the inguinal ligament and collects behind it, growing with each frame.`;
    case "small-branch":
      return `A small branch rising medially from the ${s} external iliac artery, just above the femoral head, leaks contrast into a widening blush; the main artery is intact.`;
    case "haematoma-no-active":
    case "no-haematoma":
      return `The ${s} iliac and femoral arteries and their branches fill normally; no contrast leaves them.`;
  }
}

/** What CT of the abdomen and pelvis shows. */
export function ctFinding(source: RpSource, side: "right" | "left"): string {
  const s = side === "right" ? "right" : "left";
  switch (source) {
    case "large-vessel":
      return `A large ${s} retroperitoneal haematoma, with contrast extravasating from the ${s} external iliac artery on the arterial phase.`;
    case "small-branch":
      return `A ${s} retroperitoneal haematoma, with a jet of contrast from a small branch of the ${s} external iliac artery on the arterial phase.`;
    case "haematoma-no-active":
      return `A ${s} retroperitoneal haematoma; no contrast extravasation on the arterial or delayed phases.`;
    case "no-haematoma":
      return "No retroperitoneal haematoma and no free fluid.";
  }
}

/** What the bladder screen may be read as (the learner's reading, graded against the image). */
export type BladderReading = "dented" | "normal" | "not-opacified";

export const BLADDER_READING_LABEL: Record<BladderReading, string> = {
  dented: "Bladder pushed to one side (dented)",
  normal: "Bladder central and round",
  "not-opacified": "Bladder not opacified",
};

/** What the screen really shows: no contrast on board, or a haematoma large enough to dent it, or a normal bladder. */
export function bladderTruth(opacity: number, dentMm: number): BladderReading {
  if (opacity < 0.15) return "not-opacified";
  return dentMm > 0 ? "dented" : "normal";
}

/** MODEL PARAMETERS of the dent: it appears from MP_RP.dentFromMl of haematoma and grows to `maxMm` with its volume (mm). */
export const MP_DENT = { perMl: 0.02, maxMm: 22 } as const;

/** How far the haematoma pushes the bladder across (mm). */
export function bladderDentMm(haematomaMl: number): number {
  if (haematomaMl < MP_RP.dentFromMl) return 0;
  return Math.min(MP_DENT.maxMm, 6 + (haematomaMl - MP_RP.dentFromMl) * MP_DENT.perMl);
}

// ---------------------------------------------------------------------------
// Treatment of the source
// ---------------------------------------------------------------------------

export type RpTreatment = "balloon" | "covered-stent" | "coils" | "surgery" | "conservative" | "other-cause";

export const RP_TREATMENT_LABEL: Record<RpTreatment, string> = {
  balloon: "Low-pressure balloon across the bleeding point",
  "covered-stent": "Covered stent across the hole",
  coils: "Coil embolisation of the branch",
  surgery: "Call the vascular surgeons",
  conservative: "Conservative: general measures, transfuse, watch",
  "other-cause": "Look for another cause of the low pressure",
};

const ENDOVASCULAR: readonly RpTreatment[] = ["balloon", "covered-stent", "coils"];

export function expectedTreatment(source: RpSource): string {
  switch (source) {
    case "large-vessel":
      return "A low-pressure balloon across the hole first, then a covered stent if prolonged inflation does not seal it";
    case "small-branch":
      return "A low-pressure balloon first, then coils in the branch after excluding retrograde filling";
    case "haematoma-no-active":
      return "No bleeding point to treat: conservative, with the general measures";
    case "no-haematoma":
      return "No haematoma: look for another cause of the low pressure";
  }
}

export interface TreatmentVerdict {
  correct: boolean;
  /** the treatment stops the bleeding for good (seals), only for now (a balloon), or not at all */
  effect: "seals" | "holds" | "none";
  expected: string;
  reasons: string[];
}

/** Grade a treatment of the source (pure). `ctx` says whether a balloon went up first and whether retrograde filling was checked. */
export function gradeTreatment(source: RpSource, t: RpTreatment, ctx: { balloonFirst: boolean; retrogradeChecked: boolean }): TreatmentVerdict {
  const expected = expectedTreatment(source);
  const reasons: string[] = [];
  if (!isActiveSource(source)) {
    if (ENDOVASCULAR.includes(t) || t === "surgery") return { correct: false, effect: "none", expected, reasons: ["The angiogram shows no bleeding point."] };
    if (source === "haematoma-no-active") return { correct: t === "conservative", effect: "none", expected, reasons: t === "other-cause" ? ["The dented bladder shows a haematoma."] : [] };
    return { correct: t === "other-cause", effect: "none", expected, reasons: t === "conservative" ? ["No haematoma was found: the low pressure has another cause."] : [] };
  }
  switch (t) {
    case "balloon":
      return { correct: true, effect: "holds", expected, reasons };
    case "covered-stent":
      if (!ctx.balloonFirst) reasons.push("No balloon went up first to stop the flow.");
      if (source === "small-branch") reasons.push("For a small branch, coils (after excluding retrograde filling) are the first choice.");
      return { correct: reasons.length === 0, effect: "seals", expected, reasons };
    case "coils":
      if (source === "large-vessel") return { correct: false, effect: "none", expected, reasons: ["Coils do not close a hole in a large vessel."] };
      if (!ctx.balloonFirst) reasons.push("No balloon went up first to stop the flow.");
      if (!ctx.retrogradeChecked) reasons.push("Retrograde filling of the branch was not excluded first.");
      return { correct: reasons.length === 0, effect: "seals", expected, reasons };
    case "surgery":
      return { correct: false, effect: "seals", expected, reasons: ["Surgery is for a failed covered stent or coils, or a hole at the femoral bifurcation."] };
    case "conservative":
    case "other-cause":
      return { correct: false, effect: "none", expected, reasons: ["The angiogram shows active bleeding."] };
  }
}

// ---------------------------------------------------------------------------
// Reversal and antiplatelet therapy
// ---------------------------------------------------------------------------

/** The oral or intravenous P2Y12 inhibitor on board (null: none). */
export type P2y12Agent = "clopidogrel" | "prasugrel" | "ticagrelor" | "cangrelor";

/** Is a protamine order to be refused outright? Above the 50 mg maximum the team draws up no more. */
export function protamineOrderCheck(mg: number): { refused: boolean; reason: string | null } {
  if (!(mg > 0)) return { refused: true, reason: "No dose given." };
  if (mg > RP_SOURCED.protamineMaxMg) return { refused: true, reason: `Protamine is never more than ${RP_SOURCED.protamineMaxMg} mg, given no faster than ${RP_SOURCED.protamineMaxMgPerMin} mg/min.` };
  return { refused: false, reason: null };
}

export type DoacReversal = "idarucizumab" | "andexanet" | "pcc";

export const DOAC_REVERSAL_LABEL: Record<DoacReversal, string> = {
  idarucizumab: `Idarucizumab ${RP_SOURCED.idarucizumabTotalG} g IV (two ${RP_SOURCED.idarucizumabDoseG} g doses)`,
  andexanet: "Andexanet alfa (bolus, then 2-hour infusion; regimen by drug and time since the dose)",
  pcc: "Prothrombin complex concentrate (when no specific agent is available)",
};

/**
 * Grade a DOAC reversal agent for the DOAC on board (EHRA 2021, in the lesson: reversal 'for life-threatening
 * bleeding or bleeding at a critical site'; prothrombin complex concentrate 'when a specific agent is
 * unavailable'). `lifeThreatening` is the module's reading of the episode (an active bleeding point, or a pressure
 * that has been unstable); a stable haematoma that has stopped bleeding needs no reversal. The case offers
 * andexanet alfa, so prothrombin complex concentrate is not the agent for a factor Xa inhibitor here.
 */
export function gradeDoacReversal(agent: DoacAgent | null, given: DoacReversal, lifeThreatening = true): { correct: boolean; expected: string } {
  if (!agent) return { correct: false, expected: "No DOAC is on board: nothing to reverse with a DOAC agent" };
  if (!lifeThreatening) return { correct: false, expected: "Stable, no active bleeding: reversal not indicated (it is for life-threatening bleeding or bleeding at a critical site); general measures" };
  if (agent === "dabigatran") return { correct: given === "idarucizumab", expected: `Dabigatran: idarucizumab ${RP_SOURCED.idarucizumabTotalG} g IV in two ${RP_SOURCED.idarucizumabDoseG} g doses` };
  const xa = agent === "edoxaban" ? "Edoxaban: andexanet alfa (use extrapolated)" : `${agent === "apixaban" ? "Apixaban" : "Rivaroxaban"}: andexanet alfa`;
  return { correct: given === "andexanet", expected: `${xa}; prothrombin complex concentrate only when no specific agent is available, and andexanet alfa is available here` };
}

/** Grade a platelet transfusion as a reversal, by the antiplatelet agents on board. */
export function gradePlatelets(o: { p2y12: P2y12Agent | null; aspirin: boolean }): { correct: boolean; expected: string } {
  if (o.p2y12 === "ticagrelor") return { correct: false, expected: "Not expected to reverse ticagrelor: it binds reversibly, so transfused platelets can be inhibited too" };
  if (o.p2y12 === "cangrelor") return { correct: false, expected: "Cangrelor has no antidote: stop the infusion; its effect wears off quickly" };
  if (o.p2y12 || o.aspirin) return { correct: true, expected: "Platelets for life-threatening bleeding on an irreversible agent (aspirin, clopidogrel, prasugrel)" };
  return { correct: false, expected: "No antiplatelet agent is on board: platelets would not reverse anything" };
}

export type AntiplateletPlan = "continue" | "de-escalate" | "oral-after-cangrelor" | "stop-dapt";

export const ANTIPLATELET_PLAN_LABEL: Record<AntiplateletPlan, string> = {
  continue: "Continue dual antiplatelet therapy unchanged",
  "de-escalate": `Step down to clopidogrel ${RP_SOURCED.clopidogrelSwitchMg} mg, no loading dose, ${RP_SOURCED.clopidogrelSwitchAfterH} h after the last dose`,
  "oral-after-cangrelor": "Start the oral P2Y12 inhibitor once the bleeding is controlled",
  "stop-dapt": "Stop both antiplatelet drugs",
};

/** Grade the antiplatelet plan once the bleeding is controlled (Brilakis 3.5, in cm-patient-complications-bleeding). */
export function gradeAntiplateletPlan(p2y12: P2y12Agent | null, plan: AntiplateletPlan): { correct: boolean; expected: string } {
  if (plan === "stop-dapt") return { correct: false, expected: "Not stopping dual antiplatelet therapy outright after a new stent (stent thrombosis): a deliberate, recorded plan" };
  switch (p2y12) {
    case "ticagrelor":
    case "prasugrel":
      return { correct: plan === "de-escalate", expected: `De-escalate ${p2y12} to clopidogrel ${RP_SOURCED.clopidogrelSwitchMg} mg without a loading dose, ${RP_SOURCED.clopidogrelSwitchAfterH} h after the last dose` };
    case "cangrelor":
      return { correct: plan === "oral-after-cangrelor", expected: "The oral P2Y12 plan once the bleeding is controlled: ticagrelor at any time, clopidogrel or prasugrel straight after the infusion stops" };
    case "clopidogrel":
      return { correct: plan === "continue", expected: "Already on clopidogrel: continue it with aspirin, and treat the site locally" };
    default:
      return { correct: plan === "continue", expected: "No P2Y12 inhibitor on board: nothing to step down" };
  }
}
