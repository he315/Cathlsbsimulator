// ---------------------------------------------------------------------------
// The full case's pre-procedure order sheet (proc-preprocedure-orders;
// requests pm-antithrombotics#4, pm-antithrombotics#5 and
// cm-patient-complications#5).
//
// The learner writes the orders a patient needs before a catheter procedure,
// in three parts:
//   - the oral anticoagulant: hold (for how many hours), continue, or bridge
//     with IV unfractionated heparin, and when it restarts;
//   - the antiplatelets: aspirin, the P2Y12 inhibitor, its loading dose,
//     route (whole or crushed) and timing (before the procedure, or once the
//     anatomy shows that PCI is the plan), and an IV agent at the PCI when
//     oral absorption cannot be relied on;
//   - kidney protection: the saline rate and how long before and after,
//     metformin, the NSAID, the statin, acetylcysteine and bicarbonate (both
//     distractors), the creatinine checks afterwards, and the contrast
//     ceiling the learner states at the time-out.
// The 5 Fr diagnostic catheters without side holes are chosen at the table
// (src/ui/access/panels/TablePanel.tsx) and scored here too.
//
// This file is pure (no engine, no session): the case facts of each order
// sheet scenario (PREORDER_CASES, which scenarios/preorders.ts builds its
// scenarios from), the orders, their scoring against the module text, and
// the pharmacological consequences the session module applies when the sheet
// is signed (modules/preorders.ts).
//
// Sources (module text):
// - Warfarin: Oxford's two lists (stop 3-5 days ahead, or continue or bridge
//   with IV UFH: prosthetic valves, rheumatic mitral disease, non-laminar
//   thrombus; laminar apical thrombus and recurrent VTE may stop), Brilakis 5
//   days: pm-antithrombotics-oac, src/content/manual/pci-manual/
//   03-antithrombotics.ts:525-535. Bridging infusion stopped 2 h before and
//   restarted straight after (Oxford, 03-antithrombotics.ts:535).
// - No routine bridging in AF (BRIDGE, Douketis 2015): 03-antithrombotics.ts:539.
// - DOAC holds: Brilakis Table 1.2 (03-antithrombotics.ts:557; planning.ts
//   brilakisDoacHoldDays) and Oxford's 24 h, 72 h for dabigatran in renal
//   impairment (03-antithrombotics.ts:573; planning.ts oxfordDoacHoldH), which
//   restarts the DOAC on the evening after (same line); a written restart time
//   (03-antithrombotics.ts:637).
// - The P2Y12 choice: clopidogrel with an oral anticoagulant; prasugrel ruled
//   out after stroke or TIA, ticagrelor after intracranial haemorrhage or with
//   strong CYP3A drugs or high-dose simvastatin or lovastatin; Oxford advises
//   against prasugrel over 75 years or under 60 kg; clopidogrel for stable
//   disease, prasugrel or ticagrelor for ACS (03-antithrombotics.ts:748-758,
//   and the drug table at 709-730).
// - Loading doses: aspirin 300 mg (Oxford) or 325 mg (Brilakis), clopidogrel
//   600 mg ideally 6 h or more before (Brilakis) or 300 mg at least 72 h before
//   (Oxford), prasugrel 60 mg, ticagrelor 180 mg (03-antithrombotics.ts:709-730;
//   pharmacology.ts DOSE_SOURCES).
// - Pretreatment: elective PCI preloaded; NSTE-ACS not pretreated before early
//   angiography; STEMI before or at PCI (03-antithrombotics.ts:788-800).
// - Opioids delay oral P2Y12 absorption: an IV agent, cangrelor 30 µg/kg then
//   4 µg/kg/min (03-antithrombotics.ts:812 and 1017).
// - With an oral anticoagulant: clopidogrel, aspirin peri-procedurally and
//   short (03-antithrombotics.ts, Step 5 of pm-antithrombotics-oac).
// - Kidneys (cm-patient-complications-kidney, src/content/manual/
//   complication-management/05-patient-complications.ts:844-908): normal
//   saline 1-3 mL/kg/h before and after (Brilakis) or 1 mL/kg/h for 12 h before
//   and after (Oxford), tailored to volume status, with pulmonary oedema in LV
//   impairment (844); high-dose statins (845); NSAIDs stopped (846); metformin
//   held on the day and restarted no earlier than 48 h after in CKD (847); no
//   acetylcysteine or bicarbonate (PRESERVE, 859); creatinine for at least 48 h
//   and again at the 4-5 day peak (890).
// - The contrast ceiling: contrastBudget.ts (Brilakis 3.7 × GFR, Oxford
//   5-7 mL/kg); with an eGFR below 30 a contrast-to-clearance ratio above 2
//   predicts injury (05-patient-complications.ts:704-705); 5 Fr catheters
//   without side holes (05-patient-complications.ts:753).
// Every other number is a MODEL PARAMETER (MP_PREORDERS), listed in
// docs/realism/facts/pkg-proc-preprocedure-orders.md.
// ---------------------------------------------------------------------------

import type { PatientProfile } from "../patient/patient";
import type { DoacAgent } from "../patient/pharmacology";
import { MP_FORMULARY } from "../patient/pharmacology";
import { contrastBudget, type ContrastBudget } from "../patient/contrastBudget";
import { MP_PLANNING, brilakisDoacHoldDays, oxfordDoacHoldH } from "./planning";
import { MP_HYPOTENSION } from "./hypotension";

// ---------------------------------------------------------------------------
// Lessons and tips
// ---------------------------------------------------------------------------

export const PREORDER_LESSONS = {
  oac: "pm-antithrombotics-oac",
  oral: "pm-antithrombotics-oral",
  kidney: "cm-patient-complications-kidney",
  budget: "cm-patient-complications-contrast-budget",
} as const;

const TIPS = {
  oac: ["access-anticoagulated-go-radial", "access-planning-anticoagulated"],
  oral: ["pci-check-oral-loading"],
  opioid: ["pci-opioid-delays-p2y12", "pci-check-oral-loading"],
  kidney: ["diag-caki-prepare"],
  after: ["pci-caki-after-case"],
  ceiling: ["pci-planning-contrast-ceiling", "pci-contrast-budget-ckd"],
} as const;

// ---------------------------------------------------------------------------
// Sourced values
// ---------------------------------------------------------------------------

/** Sourced numbers of the order sheet (module text, see the header). */
export const PREORDER_RULES = {
  /** Brilakis: warfarin stopped 5 days before an elective procedure */
  warfarinHoldBrilakisH: 5 * 24,
  /** Oxford: warfarin can stop 3-5 days ahead */
  warfarinHoldOxfordH: [3 * 24, 5 * 24] as [number, number],
  /** Oxford: the bridging heparin infusion stops 2 h before (mechanical mitral example) */
  bridgeUfhStopH: 2,
  /** Brilakis: clopidogrel 600 mg ideally at least 6 h before PCI */
  clopidogrel600MinH: 6,
  /** Oxford: clopidogrel 300 mg at least 72 h before PCI */
  clopidogrel300MinH: 72,
  /** loading doses, mg: aspirin 300 (Oxford) or 325 (Brilakis); clopidogrel 600 or 300 (above); prasugrel 60; ticagrelor 180 */
  loadMg: { aspirin: [300, 325], clopidogrel: [600, 300], prasugrel: [60], ticagrelor: [180] } as Record<"aspirin" | P2y12Oral, number[]>,
  /** cangrelor: 30 µg/kg IV bolus, then 4 µg/kg/min */
  cangrelor: { bolusUgKg: 30, infusionUgKgMin: 4 },
  /** prasugrel: Oxford does not recommend it over 75 years or under 60 kg */
  prasugrelAgeOverY: 75,
  prasugrelWeightUnderKg: 60,
  /** Brilakis: normal saline 1-3 mL/kg/h before and after */
  salineBrilakisMlKgH: [1, 3] as [number, number],
  /** Oxford: 1 mL/kg/h for the 12 h before and the 12 h after */
  salineOxfordMlKgH: 1,
  salineOxfordH: 12,
  /** Brilakis: metformin restarted no earlier than 48 h after, in CKD */
  metforminRestartMinH: 48,
  /** Brilakis: creatinine for at least 48 h; Oxford: it peaks at 4-5 days */
  creatinineFirstH: 48,
  creatininePeakDays: [4, 5] as [number, number],
  /** Brilakis 28.3: with an eGFR below 30, a contrast to creatinine clearance ratio above 2 predicts injury */
  advancedCkdEgfr: 30,
  advancedCkdRatio: 2,
} as const;

/**
 * MODEL PARAMETERS (docs/realism/facts/pkg-proc-preprocedure-orders.md):
 * - intravascularShare: the share of a pre-procedure saline infusion that stays in the circulation
 *   (the engine's fluid() keeps all of a bolus; over hours most crystalloid leaves the circulation
 *   by redistribution and urine, which the engine does not model);
 * - preHydrationOverS: the session time over which the saline given before the case enters the
 *   engine once the orders are signed (the hours on the ward compressed);
 * - infusionSliceS: the in-case infusion is delivered in slices of this length;
 * - inrHalfH: after warfarin stops, the INR's excess over 1 halves every this many hours;
 * - doacContinueH: 'continue' a DOAC: its last dose was taken this long before the procedure;
 * - restartWindowH: a restart time counts as Oxford's 'evening after the procedure' within this window;
 * - restartMaxH: a written restart later than this leaves the patient unprotected for too long;
 * - chronicAspirin: a patient on daily aspirin carries its effect, represented as this dose taken
 *   this long before the case;
 * - opioidFentanylUg: the opioid given before arrival (the ambulance's), as fentanyl (the
 *   formulary's opioid), IV;
 * - ckdEgfr: CKD for the metformin rule and the kidney orders (planning.ts MP_PLANNING.ckdEgfr);
 * - lvImpairmentLvef: LV impairment for the saline rate (hypotension.ts MP_HYPOTENSION.oedemaRiskLvef);
 * - tailoredLvMaxMlKgH, tailoredLvMinMlKgH: the saline rates scored as tailored in LV impairment (the
 *   highest is the lower end of Brilakis's range and Oxford's rate; neither manual gives a lower one);
 * - maxHoursBefore: the longest pre-procedure time the sheet accepts for a load or the saline;
 * - pciLoadAtHandoverS: a load ordered 'at PCI' is given at the hand-over to PCI.
 */
export const MP_PREORDERS = {
  intravascularShare: 0.2,
  preHydrationOverS: 600,
  infusionSliceS: 60,
  inrHalfH: 24,
  doacContinueH: 12,
  restartWindowH: [4, 24] as [number, number],
  restartMaxH: 48,
  chronicAspirin: { mg: 300, leadH: 24 },
  opioidFentanylUg: 100,
  ckdEgfr: MP_PLANNING.ckdEgfr,
  lvImpairmentLvef: MP_HYPOTENSION.oedemaRiskLvef,
  tailoredLvMaxMlKgH: 1,
  tailoredLvMinMlKgH: 0.5,
  maxHoursBefore: 96,
} as const;

// ---------------------------------------------------------------------------
// Case facts
// ---------------------------------------------------------------------------

export type OacDrug = "warfarin" | DoacAgent;

/** What the oral anticoagulant is for, as Oxford's two lists sort it. */
export type OacIndication = "af-low-risk" | "af-higher-risk" | "mechanical-valve" | "rheumatic-mitral" | "thrombus-non-laminar" | "thrombus-laminar" | "vte-recurrent";

/** Oxford's continue-or-bridge list without AF, where BRIDGE does not apply (03-antithrombotics.ts:525-539). */
export const BRIDGE_INDICATIONS: readonly OacIndication[] = ["mechanical-valve", "rheumatic-mitral", "thrombus-non-laminar"];
export const isAf = (i: OacIndication) => i === "af-low-risk" || i === "af-higher-risk";

export const OAC_INDICATION_TEXT: Record<OacIndication, string> = {
  "af-low-risk": "atrial fibrillation, normal LV function, no previous stroke",
  "af-higher-risk": "atrial fibrillation with diabetes or a previous stroke",
  "mechanical-valve": "a mechanical mitral valve replacement",
  "rheumatic-mitral": "rheumatic mitral stenosis with atrial fibrillation",
  "thrombus-non-laminar": "a mobile, protruding LV apical thrombus after an anterior infarct",
  "thrombus-laminar": "a laminar LV apical thrombus",
  "vte-recurrent": "recurrent venous thromboembolism",
};

export type Presentation = "stable" | "nste-acs" | "stemi";

export interface PreorderCase {
  /** the scenario id */
  id: string;
  presentation: Presentation;
  /** planned PCI (known anatomy) or angiography with possible ad hoc PCI */
  procedure: "planned-pci" | "angiography";
  oac: { drug: OacDrug; indication: OacIndication; regimen: string; inrToday?: number } | null;
  /** the patient takes daily aspirin */
  onAspirin: boolean;
  /** the screen the P2Y12 choice needs (age and weight come from the profile) */
  screen: { strokeOrTia: string | null; ich: boolean; cyp3a: string | null; highDoseStatin: string | null; opioidBeforeArrival: string | null };
  meds: { metformin: boolean; nsaid: string | null; statin: string | null };
}

/** The patient facts the scoring reads (from the profile). */
export interface PreorderPatient {
  ageY: number;
  weightKg: number;
  egfr: number;
  crclMlMin: number;
  lvef: number;
  recentContrast?: { ml: number; daysAgo: number }[];
}

export const preorderPatient = (p: PatientProfile): PreorderPatient => ({
  ageY: p.ageY,
  weightKg: p.weightKg,
  egfr: p.renal.egfr,
  crclMlMin: p.renal.crclMlMin,
  lvef: p.lvef,
  ...(p.recentContrast ? { recentContrast: p.recentContrast } : {}),
});

const NO_SCREEN: PreorderCase["screen"] = { strokeOrTia: null, ich: false, cyp3a: null, highDoseStatin: null, opioidBeforeArrival: null };
const NO_MEDS: PreorderCase["meds"] = { metformin: false, nsaid: null, statin: "Atorvastatin 40 mg at night" };

/**
 * The order sheet scenarios' case facts (scenarios/preorders.ts builds each scenario's patient and
 * chart from these). Every value is a scenario setting (MODEL PARAMETER).
 */
export const PREORDER_CASES: Readonly<Record<string, PreorderCase>> = Object.fromEntries(
  (
    [
      { id: "oac-af-low-risk", presentation: "stable", procedure: "planned-pci", oac: { drug: "apixaban", indication: "af-low-risk", regimen: "Apixaban 5 mg twice daily" }, onAspirin: false, screen: NO_SCREEN, meds: NO_MEDS },
      { id: "oac-mechanical-valve", presentation: "stable", procedure: "planned-pci", oac: { drug: "warfarin", indication: "mechanical-valve", regimen: "Warfarin, target INR 2.5-3.5", inrToday: 2.9 }, onAspirin: false, screen: NO_SCREEN, meds: NO_MEDS },
      { id: "oac-rheumatic-mitral", presentation: "stable", procedure: "planned-pci", oac: { drug: "warfarin", indication: "rheumatic-mitral", regimen: "Warfarin, target INR 2-3", inrToday: 2.6 }, onAspirin: false, screen: NO_SCREEN, meds: NO_MEDS },
      { id: "oac-lv-thrombus", presentation: "stable", procedure: "angiography", oac: { drug: "warfarin", indication: "thrombus-non-laminar", regimen: "Warfarin, target INR 2-3", inrToday: 2.4 }, onAspirin: true, screen: NO_SCREEN, meds: NO_MEDS },
      { id: "warfarin-inr-high", presentation: "stable", procedure: "angiography", oac: { drug: "warfarin", indication: "af-low-risk", regimen: "Warfarin, target INR 2-3", inrToday: 3.4 }, onAspirin: false, screen: NO_SCREEN, meds: NO_MEDS },
      { id: "elective-pci-preload", presentation: "stable", procedure: "planned-pci", oac: null, onAspirin: true, screen: NO_SCREEN, meds: NO_MEDS },
      { id: "nste-early-angio", presentation: "nste-acs", procedure: "angiography", oac: null, onAspirin: false, screen: { ...NO_SCREEN, strokeOrTia: "Ischaemic stroke 3 years ago, no residual deficit" }, meds: NO_MEDS },
      { id: "stemi-opioids", presentation: "stemi", procedure: "angiography", oac: null, onAspirin: false, screen: { ...NO_SCREEN, cyp3a: "Clarithromycin 500 mg twice daily (chest infection, day 3)", opioidBeforeArrival: "Morphine IV in the ambulance for chest pain" }, meds: NO_MEDS },
      { id: "ckd-egfr-28-metformin-nsaid", presentation: "stable", procedure: "angiography", oac: null, onAspirin: true, screen: NO_SCREEN, meds: { metformin: true, nsaid: "Ibuprofen 400 mg three times daily", statin: "Atorvastatin 80 mg at night" } },
      { id: "ckd-low-ef", presentation: "stable", procedure: "angiography", oac: null, onAspirin: true, screen: NO_SCREEN, meds: { metformin: false, nsaid: null, statin: "Atorvastatin 80 mg at night" } },
    ] as PreorderCase[]
  ).map((c) => [c.id, c]),
);

export const preorderCase = (scenarioId: string): PreorderCase | undefined => PREORDER_CASES[scenarioId];

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type OacStrategy = "hold" | "continue" | "bridge";
export type AspirinPlan = "continue" | "load" | "peri-procedural" | "none";
export type P2y12Oral = "clopidogrel" | "prasugrel" | "ticagrelor";
export type P2y12Choice = "none" | P2y12Oral;
/** before the procedure (hoursBefore, 0 = on the table now) or at PCI, once the anatomy shows PCI is the plan */
export type LoadTiming = "before" | "at-pci";
export type OralRoute = "oral" | "crushed";

export interface OacOrders {
  strategy: OacStrategy | null;
  /** hold (or the warfarin stop before a bridge), hours before the procedure */
  holdH: number | null;
  /** restart, hours after the procedure */
  restartH: number | null;
}

export interface AntiplateletOrders {
  aspirin: AspirinPlan | null;
  /** aspirin loading dose, mg (for 'load' and 'peri-procedural') */
  aspirinMg: number | null;
  p2y12: P2y12Choice | null;
  /** P2Y12 loading dose, mg */
  p2y12Mg: number | null;
  timing: LoadTiming | null;
  /** hours before the procedure, for timing 'before' (0: now, on the table) */
  hoursBefore: number | null;
  route: OralRoute;
  /** an IV P2Y12 agent (cangrelor) at the PCI */
  ivAgent: boolean;
}

export interface KidneyOrders {
  /** normal saline, mL/kg/h (0: none) */
  salineMlKgH: number | null;
  salineBeforeH: number | null;
  salineAfterH: number | null;
  metformin: "continue" | "hold" | null;
  /** metformin restart, hours after the procedure */
  metforminRestartH: number | null;
  nsaid: "continue" | "hold" | null;
  statin: "continue" | "stop" | null;
  acetylcysteine: boolean;
  bicarbonate: boolean;
  creatinine48h: boolean;
  creatinineDay4to5: boolean;
}

export interface PreOrders {
  oac: OacOrders;
  antiplatelet: AntiplateletOrders;
  kidney: KidneyOrders;
  /** the contrast ceiling stated for the time-out, mL */
  ceilingMl: number | null;
}

export const emptyOrders = (): PreOrders => ({
  oac: { strategy: null, holdH: null, restartH: null },
  antiplatelet: { aspirin: null, aspirinMg: null, p2y12: null, p2y12Mg: null, timing: null, hoursBefore: null, route: "oral", ivAgent: false },
  kidney: { salineMlKgH: null, salineBeforeH: null, salineAfterH: null, metformin: null, metforminRestartH: null, nsaid: null, statin: null, acetylcysteine: false, bicarbonate: false, creatinine48h: false, creatinineDay4to5: false },
  ceilingMl: null,
});

/** The diagnostic catheter set chosen at the table. */
export type CatheterSet = "5fr-no-side-holes" | "6fr-standard" | "side-holes";
export const CATHETER_SET_LABEL: Record<CatheterSet, string> = {
  "5fr-no-side-holes": "5 Fr, without side holes",
  "6fr-standard": "6 Fr, without side holes",
  "side-holes": "Catheters with side holes",
};

const num = (x: number | null | undefined): x is number => typeof x === "number" && Number.isFinite(x);

/** What the sheet still needs before it can be signed (empty: complete). The ceiling is stated separately, before the time-out. */
export function missingOrders(c: PreorderCase, o: PreOrders): string[] {
  const out: string[] = [];
  if (c.oac) {
    if (!o.oac.strategy) out.push("the anticoagulant plan");
    else if (o.oac.strategy !== "continue") {
      if (!num(o.oac.holdH)) out.push("how long the anticoagulant is held");
      if (!num(o.oac.restartH)) out.push("when the anticoagulant restarts");
    }
  }
  const a = o.antiplatelet;
  if (!a.aspirin) out.push("the aspirin order");
  else if ((a.aspirin === "load" || a.aspirin === "peri-procedural") && !num(a.aspirinMg)) out.push("the aspirin dose");
  if (!a.p2y12) out.push("the P2Y12 inhibitor");
  else if (a.p2y12 !== "none") {
    if (!num(a.p2y12Mg)) out.push("the P2Y12 loading dose");
    if (!a.timing) out.push("when the load is given");
    else if (a.timing === "before" && !num(a.hoursBefore)) out.push("how many hours before the procedure");
  }
  const k = o.kidney;
  if (!num(k.salineMlKgH)) out.push("the saline rate (0 for none)");
  else if (k.salineMlKgH > 0 && (!num(k.salineBeforeH) || !num(k.salineAfterH))) out.push("the saline hours before and after");
  if (c.meds.metformin && !k.metformin) out.push("the metformin order");
  if (c.meds.metformin && k.metformin === "hold" && !num(k.metforminRestartH)) out.push("when metformin restarts");
  if (c.meds.nsaid && !k.nsaid) out.push("the NSAID order");
  if (c.meds.statin && !k.statin) out.push("the statin order");
  return out;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export interface OrderVerdict {
  /** stable id within the sheet; the ledger id is 'preorders-<id>' */
  id: string;
  label: string;
  correct: boolean;
  expected: string;
  given: string;
  lessonId: string;
  tipIds: string[];
}

const DRUG_NAME: Record<OacDrug | P2y12Oral | "aspirin", string> = {
  warfarin: "warfarin",
  apixaban: "apixaban",
  rivaroxaban: "rivaroxaban",
  edoxaban: "edoxaban",
  dabigatran: "dabigatran",
  clopidogrel: "clopidogrel",
  prasugrel: "prasugrel",
  ticagrelor: "ticagrelor",
  aspirin: "aspirin",
};
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const hText = (h: number) => (h >= 48 && h % 24 === 0 ? `${h / 24} days` : `${h} h`);

/** The hold each manual asks for, hours: Brilakis (Table 1.2 or 5 days for warfarin) and Oxford (24 h, 72 h, or 3-5 days). */
export function oacHoldRule(drug: OacDrug, crclMlMin: number): { brilakisH: number | null; oxfordH: number; text: string } {
  if (drug === "warfarin") {
    const [o0] = PREORDER_RULES.warfarinHoldOxfordH;
    return { brilakisH: PREORDER_RULES.warfarinHoldBrilakisH, oxfordH: o0, text: "warfarin stopped 5 days before (Brilakis) or 3-5 days (Oxford)" };
  }
  const d = brilakisDoacHoldDays(drug, crclMlMin);
  const ox = oxfordDoacHoldH(drug, crclMlMin);
  return { brilakisH: d === null ? null : d * 24, oxfordH: ox, text: `${DRUG_NAME[drug]} held ${d === null ? "(no Brilakis row below 15 mL/min)" : `${d} days (Brilakis Table 1.2)`} or ${ox} h (Oxford)` };
}

/** The anticoagulant plan: strategy against the indication, the hold length, the restart. */
export function scoreOac(c: PreorderCase, p: PreorderPatient, o: OacOrders): OrderVerdict[] {
  if (!c.oac) return [];
  const { drug, indication } = c.oac;
  const af = isAf(indication);
  const bridgeList = BRIDGE_INDICATIONS.includes(indication);
  const rule = oacHoldRule(drug, p.crclMlMin);
  const out: OrderVerdict[] = [];
  const s = o.strategy;
  // the strategy: continue (with radial access) is accepted for every indication; in AF interruption
  // without bridging (BRIDGE); on Oxford's continue-or-bridge list, bridging, never an unbridged stop
  const stratOk = s === "continue" || (s === "hold" && !bridgeList) || (s === "bridge" && bridgeList && drug === "warfarin");
  const expected = af
    ? "Interrupt without bridging (BRIDGE), or continue and go radial"
    : bridgeList
    ? "Continue warfarin and go radial, or bridge with IV heparin; never an unbridged stop"
    : "Stop without bridging (Oxford lists it among those who can stop), or continue and go radial";
  out.push({
    id: "oac-strategy",
    label: `Anticoagulant plan for ${OAC_INDICATION_TEXT[indication]}`,
    correct: stratOk,
    expected,
    given: s === "hold" ? "Hold without bridging" : s === "bridge" ? "Bridge with IV heparin" : s === "continue" ? "Continue" : "No plan written",
    lessonId: PREORDER_LESSONS.oac,
    tipIds: [...TIPS.oac],
  });
  if (s === "hold" || s === "bridge") {
    const h = o.holdH ?? 0;
    // the shorter rule is the accepted alternative (the manuals differ)
    const okH = h >= rule.oxfordH;
    out.push({
      id: "oac-hold",
      label: `How long ${DRUG_NAME[drug]} is held before the procedure`,
      correct: okH,
      expected: cap(rule.text),
      given: `${hText(h)}${okH && rule.brilakisH !== null && h < rule.brilakisH ? " (meets Oxford, not Brilakis)" : ""}`,
      lessonId: PREORDER_LESSONS.oac,
      tipIds: [...TIPS.oac],
    });
    const r = o.restartH;
    const [w0, w1] = MP_PREORDERS.restartWindowH;
    const okR = num(r) && r > 0 && r <= MP_PREORDERS.restartMaxH;
    out.push({
      id: "oac-restart",
      label: "Restart time for the anticoagulant written",
      correct: okR,
      expected: s === "bridge" ? "Heparin straight after; warfarin the evening after if there is no bleeding (Oxford)" : `The evening after the procedure if there is no bleeding (Oxford): about ${w0}-${w1} h`,
      given: num(r) ? `${r} h after the procedure` : "No restart time",
      lessonId: PREORDER_LESSONS.oac,
      tipIds: [...TIPS.oac],
    });
  }
  return out;
}

/** The contraindications to a P2Y12 inhibitor for this patient (empty: none), in the lesson's words. */
export function p2y12Contraindications(drug: P2y12Oral, c: PreorderCase, p: PreorderPatient): string[] {
  const out: string[] = [];
  if (drug === "prasugrel") {
    if (c.screen.strokeOrTia) out.push("previous stroke or TIA");
    if (p.ageY > PREORDER_RULES.prasugrelAgeOverY) out.push(`age over ${PREORDER_RULES.prasugrelAgeOverY}`);
    if (p.weightKg < PREORDER_RULES.prasugrelWeightUnderKg) out.push(`weight under ${PREORDER_RULES.prasugrelWeightUnderKg} kg`);
  }
  if (drug === "ticagrelor") {
    if (c.screen.ich) out.push("previous intracranial haemorrhage");
    if (c.screen.cyp3a) out.push("a strong CYP3A inhibitor or inducer");
    if (c.screen.highDoseStatin) out.push("simvastatin or lovastatin above 40 mg");
  }
  return out;
}

/** The P2Y12 inhibitors that fit the presentation and are not ruled out. */
export function fittingP2y12(c: PreorderCase, p: PreorderPatient): P2y12Oral[] {
  if (c.oac) return ["clopidogrel"];
  if (c.presentation === "stable") return ["clopidogrel"];
  const potent = (["prasugrel", "ticagrelor"] as const).filter((d) => p2y12Contraindications(d, c, p).length === 0);
  // clopidogrel only when both potent agents are ruled out
  return potent.length ? [...potent] : ["clopidogrel"];
}

/** Aspirin, the P2Y12 inhibitor, its dose and timing, and the IV agent. */
export function scoreAntiplatelet(c: PreorderCase, p: PreorderPatient, o: AntiplateletOrders): OrderVerdict[] {
  const out: OrderVerdict[] = [];
  const acs = c.presentation !== "stable";
  // aspirin
  // with an anticoagulant aspirin is kept short (03-antithrombotics.ts); a patient already on it may
  // continue the daily dose peri-procedurally instead of a reload
  const aspOk = c.oac
    ? o.aspirin === "peri-procedural" || o.aspirin === "load" || (c.onAspirin && o.aspirin === "continue")
    : c.onAspirin
    ? o.aspirin === "continue" || o.aspirin === "load"
    : o.aspirin === "load" || (o.aspirin === "peri-procedural" && !acs);
  const aspDoseOk = o.aspirin === "load" || o.aspirin === "peri-procedural" ? PREORDER_RULES.loadMg.aspirin.includes(o.aspirinMg ?? -1) : true;
  out.push({
    id: "aspirin",
    label: "Aspirin before the procedure",
    correct: aspOk && aspDoseOk,
    expected: c.oac
      ? c.onAspirin
        ? "Aspirin peri-procedurally only, then short: continue the daily dose, or 300 mg (Oxford) or 325 mg (Brilakis)"
        : "Aspirin peri-procedurally only, 300 mg (Oxford) or 325 mg (Brilakis), then short"
      : c.onAspirin
      ? "Continue the daily aspirin"
      : "Load aspirin, 300 mg (Oxford) or 325 mg (Brilakis)",
    given: o.aspirin === "load" || o.aspirin === "peri-procedural" ? `${o.aspirin === "load" ? "Load" : "Peri-procedural"} ${o.aspirinMg ?? "?"} mg` : o.aspirin === "continue" ? "Continue daily aspirin" : o.aspirin === "none" ? "No aspirin" : "No order",
    lessonId: PREORDER_LESSONS.oral,
    tipIds: [...TIPS.oral],
  });
  // the agent
  const fit = fittingP2y12(c, p);
  const chosen = o.p2y12;
  const ci = chosen && chosen !== "none" ? p2y12Contraindications(chosen, c, p) : [];
  const agentOk = !!chosen && chosen !== "none" && fit.includes(chosen);
  out.push({
    id: "p2y12-agent",
    label: "P2Y12 inhibitor for the presentation, after the screen",
    correct: agentOk,
    expected: c.oac
      ? "Clopidogrel: no prasugrel or ticagrelor with an oral anticoagulant"
      : acs
      ? `${fit.map(cap).join(" or ")}${fit.length < 2 && fit[0] !== "clopidogrel" ? ` (${(["prasugrel", "ticagrelor"] as const).filter((d) => !fit.includes(d)).map((d) => `${d}: ${p2y12Contraindications(d, c, p).join(", ")}`).join("; ")})` : ""}`
      : "Clopidogrel for stable disease",
    given: !chosen || chosen === "none" ? "None" : `${cap(chosen)}${ci.length ? ` despite ${ci.join(", ")}` : ""}${c.oac && chosen !== "clopidogrel" ? " with an oral anticoagulant" : ""}`,
    lessonId: PREORDER_LESSONS.oral,
    tipIds: [...TIPS.oral],
  });
  if (chosen && chosen !== "none") {
    const mg = o.p2y12Mg ?? -1;
    const doses = PREORDER_RULES.loadMg[chosen];
    out.push({
      id: "p2y12-dose",
      label: `${cap(chosen)} loading dose`,
      correct: doses.includes(mg),
      expected: chosen === "clopidogrel" ? "600 mg (Brilakis), or 300 mg at least 72 h before (Oxford)" : `${doses[0]} mg`,
      given: `${mg < 0 ? "?" : mg} mg`,
      lessonId: PREORDER_LESSONS.oral,
      tipIds: [...TIPS.oral],
    });
  }
  // timing
  if (chosen && chosen !== "none") {
    const t = o.timing;
    const h = o.hoursBefore ?? 0;
    let ok: boolean;
    let expected: string;
    if (c.presentation === "nste-acs") {
      ok = t === "at-pci";
      expected = "No pretreatment before early angiography: load once the anatomy shows PCI is the plan";
    } else if (c.presentation === "stemi") {
      ok = t === "at-pci" || t === "before";
      expected = "Before the procedure and no later than the PCI itself";
    } else if (c.procedure === "planned-pci") {
      const mg = o.p2y12Mg ?? 0;
      ok = t === "before" && (chosen !== "clopidogrel" || (mg >= 600 && h >= PREORDER_RULES.clopidogrel600MinH) || (mg === 300 && h >= PREORDER_RULES.clopidogrel300MinH));
      expected = "Preloaded: clopidogrel 600 mg ideally at least 6 h before (Brilakis), or 300 mg at least 72 h before (Oxford)";
    } else {
      // angiography with possible ad hoc PCI in stable disease: Brilakis loads when PCI is planned,
      // Oxford preloads anyone due for PCI; both are accepted (the manuals differ)
      ok = t === "at-pci" || t === "before";
      expected = "Once PCI is planned (Brilakis), or preloaded as local policy directs (Oxford)";
    }
    out.push({
      id: "p2y12-timing",
      label: "When the P2Y12 load is given",
      correct: ok,
      expected,
      given: t === "at-pci" ? "At PCI, once the anatomy is known" : t === "before" ? (h > 0 ? `${h} h before the procedure, ${o.route === "crushed" ? "crushed" : "swallowed whole"}` : `On the table, ${o.route === "crushed" ? "crushed" : "swallowed whole"}`) : "No timing",
      lessonId: PREORDER_LESSONS.oral,
      tipIds: [...TIPS.oral],
    });
  }
  // opioid before arrival: oral absorption is delayed, an IV agent at the PCI
  if (c.screen.opioidBeforeArrival) {
    out.push({
      id: "iv-agent",
      label: "An IV P2Y12 agent when an opioid delays oral absorption",
      correct: o.ivAgent,
      expected: `Cangrelor ${PREORDER_RULES.cangrelor.bolusUgKg} µg/kg IV, then ${PREORDER_RULES.cangrelor.infusionUgKgMin} µg/kg/min, at the PCI`,
      given: o.ivAgent ? "Cangrelor at the PCI" : "Oral load only, after an opioid",
      lessonId: PREORDER_LESSONS.oral,
      tipIds: [...TIPS.opioid],
    });
  }
  return out;
}

/** The kidney is at risk: CKD (MP_PREORDERS.ckdEgfr). */
export const kidneyAtRisk = (p: PreorderPatient) => p.egfr < MP_PREORDERS.ckdEgfr;
/** LV impairment for the saline rate. */
export const lvImpaired = (p: PreorderPatient) => p.lvef < MP_PREORDERS.lvImpairmentLvef;

/** The saline rate that is tailored to this patient, mL/kg/h: [lowest, highest]. */
export function tailoredSaline(p: PreorderPatient): [number, number] {
  const [b0, b1] = PREORDER_RULES.salineBrilakisMlKgH;
  return lvImpaired(p) ? [MP_PREORDERS.tailoredLvMinMlKgH, MP_PREORDERS.tailoredLvMaxMlKgH] : [b0, b1];
}

/** Saline, metformin, the NSAID, the statin, the distractors and the creatinine checks. */
export function scoreKidney(c: PreorderCase, p: PreorderPatient, o: KidneyOrders): OrderVerdict[] {
  const out: OrderVerdict[] = [];
  const atRisk = kidneyAtRisk(p);
  const lv = lvImpaired(p);
  const K = PREORDER_LESSONS.kidney;
  if (atRisk) {
    const [lo, hi] = tailoredSaline(p);
    const r = o.salineMlKgH ?? 0;
    const both = r > 0 && (o.salineBeforeH ?? 0) > 0 && (o.salineAfterH ?? 0) > 0;
    out.push({
      id: "saline",
      label: `Saline for a patient with an eGFR of ${p.egfr}${lv ? ` and an LVEF of ${p.lvef}%` : ""}`,
      correct: both && r >= lo && r <= hi,
      expected: lv
        ? `Normal saline before and after at no more than ${hi} mL/kg/h: LV impairment risks pulmonary oedema (Oxford)`
        : "Normal saline 1-3 mL/kg/h before and after (Brilakis), or 1 mL/kg/h for 12 h before and after (Oxford)",
      given: r > 0 ? `${r} mL/kg/h, ${o.salineBeforeH ?? 0} h before and ${o.salineAfterH ?? 0} h after` : "No saline",
      lessonId: K,
      tipIds: [...TIPS.kidney],
    });
  }
  if (c.meds.metformin) {
    const ckd = atRisk;
    const held = o.metformin === "hold";
    const restartOk = held && (o.metforminRestartH ?? 0) >= PREORDER_RULES.metforminRestartMinH;
    const ok = ckd ? held && restartOk && o.creatinine48h : true;
    out.push({
      id: "metformin",
      label: "Metformin around the contrast",
      correct: ok,
      expected: ckd ? "Held on the day, restarted no earlier than 48 h after, once the creatinine has been checked (Brilakis)" : "Need not stop without CKD; check renal function after",
      given: held ? `Held, restart ${o.metforminRestartH ?? "?"} h after${o.creatinine48h ? " with a 48 h creatinine" : ", no creatinine check before"}` : o.metformin === "continue" ? "Continued" : "No order",
      lessonId: K,
      tipIds: [...TIPS.kidney],
    });
  }
  if (c.meds.nsaid) {
    out.push({
      id: "nsaid",
      label: "The NSAID before contrast",
      correct: o.nsaid === "hold",
      expected: "Stopped (Brilakis; Oxford withholds nephrotoxic drugs)",
      given: o.nsaid === "hold" ? "Held" : o.nsaid === "continue" ? "Continued" : "No order",
      lessonId: K,
      tipIds: [...TIPS.kidney],
    });
  }
  if (c.meds.statin) {
    out.push({
      id: "statin",
      label: "The statin",
      correct: o.statin === "continue",
      expected: "Continued: Brilakis lists high-dose statins among the measures before the procedure",
      given: o.statin === "continue" ? "Continued" : o.statin === "stop" ? "Stopped" : "No order",
      lessonId: K,
      tipIds: [...TIPS.kidney],
    });
  }
  out.push({
    id: "acetylcysteine",
    label: "Acetylcysteine for kidney protection",
    correct: !o.acetylcysteine,
    expected: "Not given: no benefit in PRESERVE",
    given: o.acetylcysteine ? "Ordered" : "Not ordered",
    lessonId: K,
    tipIds: [...TIPS.kidney],
  });
  out.push({
    id: "bicarbonate",
    label: "Sodium bicarbonate for kidney protection",
    correct: !o.bicarbonate,
    expected: "Not given: no benefit over saline in PRESERVE",
    given: o.bicarbonate ? "Ordered" : "Not ordered",
    lessonId: K,
    tipIds: [...TIPS.kidney],
  });
  if (atRisk) {
    out.push({
      id: "creatinine",
      label: "Creatinine checks after the contrast",
      correct: o.creatinine48h && o.creatinineDay4to5,
      expected: "At 48 h (Brilakis) and again at the 4-5 day peak (Oxford)",
      given: [o.creatinine48h && "48 h", o.creatinineDay4to5 && "day 4-5"].filter(Boolean).join(" and ") || "None",
      lessonId: K,
      tipIds: [...TIPS.after],
    });
  }
  return out;
}

/** The contrast budget for this patient with the stated ceiling as the plan (contrastBudget.ts). */
export function preorderBudget(p: PreorderPatient, usedMl = 0, planMl?: number | null): ContrastBudget {
  return contrastBudget({ egfr: p.egfr, crclMlMin: p.crclMlMin, weightKg: p.weightKg, usedMl, recent: p.recentContrast, ...(num(planMl) ? { planMl } : {}) });
}

/** The highest ceiling scored as right, mL: the stricter rule's, and with an eGFR below 30 twice the creatinine clearance. */
export function ceilingLimitMl(p: PreorderPatient): number {
  const b = preorderBudget(p);
  const lim = b.stricter.availableMl;
  return p.egfr < PREORDER_RULES.advancedCkdEgfr ? Math.min(lim, Math.round(PREORDER_RULES.advancedCkdRatio * p.crclMlMin * 10) / 10) : lim;
}

/** The stated ceiling, checked with contrastBudget.ts. */
export function scoreCeiling(p: PreorderPatient, ceilingMl: number | null): OrderVerdict {
  const b = preorderBudget(p);
  const lim = ceilingLimitMl(p);
  const ok = num(ceilingMl) && ceilingMl > 0 && ceilingMl <= lim;
  const adv = p.egfr < PREORDER_RULES.advancedCkdEgfr;
  return {
    id: "ceiling",
    label: "Contrast ceiling stated at the time-out",
    correct: ok,
    expected: `At most ${lim} mL: ${b.rules.map((r) => `${r.label} ${r.availableMl} mL`).join("; ")}${adv ? `; eGFR below 30: no more than twice the clearance (${p.crclMlMin} mL/min), ideally below it` : ""}`,
    given: num(ceilingMl) ? `${ceilingMl} mL` : "No ceiling stated",
    lessonId: PREORDER_LESSONS.budget,
    tipIds: [...TIPS.ceiling],
  };
}

/** The catheters chosen at the table, for a kidney at risk. */
export function scoreCatheters(p: PreorderPatient, set: CatheterSet | null): OrderVerdict | null {
  if (!kidneyAtRisk(p)) return null;
  return {
    id: "catheters",
    label: "Diagnostic catheters for a kidney at risk",
    correct: set === "5fr-no-side-holes",
    expected: "5 Fr catheters without side holes",
    given: set ? CATHETER_SET_LABEL[set] : "Not chosen",
    lessonId: PREORDER_LESSONS.budget,
    tipIds: [...TIPS.kidney],
  };
}

/** Every verdict of a signed sheet (the ceiling and the catheters are scored at the time-out and the table). */
export function scoreOrders(c: PreorderCase, p: PreorderPatient, o: PreOrders): OrderVerdict[] {
  return [...scoreOac(c, p, o.oac), ...scoreAntiplatelet(c, p, o.antiplatelet), ...scoreKidney(c, p, o.kidney)];
}

/** The orders a careful team writes for this case (a case opened past the chart, and the tests' reference). */
export function referenceOrders(c: PreorderCase, p: PreorderPatient): PreOrders {
  const o = emptyOrders();
  if (c.oac) {
    const rule = oacHoldRule(c.oac.drug, p.crclMlMin);
    o.oac = BRIDGE_INDICATIONS.includes(c.oac.indication)
      ? { strategy: "continue", holdH: null, restartH: null }
      : { strategy: "hold", holdH: rule.brilakisH ?? rule.oxfordH, restartH: 12 };
  }
  const fit = fittingP2y12(c, p)[0];
  const acs = c.presentation !== "stable";
  o.antiplatelet = {
    aspirin: c.oac ? (c.onAspirin ? "continue" : "peri-procedural") : c.onAspirin ? "continue" : "load",
    aspirinMg: c.onAspirin ? null : 300,
    p2y12: fit,
    p2y12Mg: PREORDER_RULES.loadMg[fit][0],
    timing: c.presentation === "nste-acs" || (c.presentation === "stemi" && !!c.screen.opioidBeforeArrival) ? "at-pci" : acs ? "before" : c.procedure === "planned-pci" ? "before" : "at-pci",
    hoursBefore: c.presentation === "stable" && c.procedure === "planned-pci" ? 12 : acs ? 0 : null,
    route: "oral",
    ivAgent: !!c.screen.opioidBeforeArrival,
  };
  const at = kidneyAtRisk(p);
  const [lo, hi] = tailoredSaline(p);
  o.kidney = {
    salineMlKgH: at ? (lvImpaired(p) ? hi : lo) : 0,
    salineBeforeH: at ? PREORDER_RULES.salineOxfordH : null,
    salineAfterH: at ? PREORDER_RULES.salineOxfordH : null,
    metformin: c.meds.metformin ? "hold" : null,
    metforminRestartH: c.meds.metformin ? PREORDER_RULES.metforminRestartMinH : null,
    nsaid: c.meds.nsaid ? "hold" : null,
    statin: c.meds.statin ? "continue" : null,
    acetylcysteine: false,
    bicarbonate: false,
    creatinine48h: at || c.meds.metformin,
    creatinineDay4to5: at,
  };
  o.ceilingMl = Math.floor(ceilingLimitMl(p));
  return o;
}

// ---------------------------------------------------------------------------
// Consequences (the session module applies them when the sheet is signed)
// ---------------------------------------------------------------------------

/** A DOAC's anticoagulant effect (0..1) after `holdH` hours without a dose (the formulary's DOAC half-life). */
export function doacEffectAfter(holdH: number): number {
  return Math.pow(0.5, (Math.max(0, holdH) * 3600) / MP_FORMULARY.doacHalfLifeS);
}

/** The INR after warfarin has been stopped for `holdH` hours (MP_PREORDERS.inrHalfH). */
export function inrAfter(inrToday: number, holdH: number): number {
  return Math.round((1 + (inrToday - 1) * Math.pow(0.5, Math.max(0, holdH) / MP_PREORDERS.inrHalfH)) * 10) / 10;
}

/** What the anticoagulant plan leaves on board at the procedure. */
export interface OacOnBoard {
  drug: OacDrug;
  /** hours since the last dose (DOAC), or since warfarin stopped (null: continued) */
  sinceH: number | null;
  /** DOAC effect 0..1, or null for warfarin */
  doacEffect: number | null;
  /** warfarin INR at the procedure, or null for a DOAC */
  inr: number | null;
  bridged: boolean;
}

export function oacOnBoard(c: PreorderCase, o: OacOrders): OacOnBoard | null {
  if (!c.oac) return null;
  const { drug } = c.oac;
  const cont = o.strategy === "continue" || !o.strategy;
  const holdH = cont ? null : Math.max(0, o.holdH ?? 0);
  if (drug === "warfarin") {
    const inr0 = c.oac.inrToday ?? 2.5;
    return { drug, sinceH: holdH, doacEffect: null, inr: holdH === null ? inr0 : inrAfter(inr0, holdH), bridged: o.strategy === "bridge" };
  }
  const since = holdH ?? MP_PREORDERS.doacContinueH;
  return { drug, sinceH: since, doacEffect: doacEffectAfter(since), inr: null, bridged: o.strategy === "bridge" };
}

/** Saline before the case that stays in the circulation, mL (MP_PREORDERS.intravascularShare). */
export function preHydrationMl(o: KidneyOrders, weightKg: number): number {
  const r = Math.max(0, o.salineMlKgH ?? 0);
  const h = Math.min(MP_PREORDERS.maxHoursBefore, Math.max(0, o.salineBeforeH ?? 0));
  return Math.round(r * weightKg * h * MP_PREORDERS.intravascularShare);
}

/** The running infusion's share that stays in the circulation, mL/s. */
export function infusionMlPerS(o: KidneyOrders, weightKg: number): number {
  const r = Math.max(0, o.salineMlKgH ?? 0);
  return (r * weightKg * MP_PREORDERS.intravascularShare) / 3600;
}

/** A sheet in a line, for the log. */
export function ordersSummary(c: PreorderCase, o: PreOrders): string {
  const parts: string[] = [];
  if (c.oac) parts.push(o.oac.strategy === "continue" ? `${cap(DRUG_NAME[c.oac.drug])} continued` : o.oac.strategy ? `${cap(DRUG_NAME[c.oac.drug])} ${o.oac.strategy === "bridge" ? "bridged with IV heparin" : "held"} ${hText(o.oac.holdH ?? 0)}, restart ${o.oac.restartH ?? "?"} h after` : "");
  const a = o.antiplatelet;
  const aspirinBefore = a.timing === "before" && (a.hoursBefore ?? 0) > 0 ? `${a.hoursBefore} h before` : "on signing";
  if (a.aspirin === "load") parts.push(`Aspirin ${a.aspirinMg ?? "?"} mg load ${aspirinBefore}`);
  else if (a.aspirin === "peri-procedural") parts.push(`Aspirin ${a.aspirinMg ?? "?"} mg at the PCI`);
  else if (a.aspirin === "continue") parts.push("Aspirin continued");
  else if (a.aspirin === "none") parts.push("No aspirin");
  parts.push(a.p2y12 && a.p2y12 !== "none" ? `${cap(a.p2y12)} ${a.p2y12Mg ?? "?"} mg ${a.timing === "at-pci" ? "at PCI" : (a.hoursBefore ?? 0) > 0 ? `${a.hoursBefore} h before` : "on the table"}` : "No P2Y12 inhibitor");
  const k = o.kidney;
  parts.push((k.salineMlKgH ?? 0) > 0 ? `saline ${k.salineMlKgH} mL/kg/h` : "no saline");
  return parts.filter(Boolean).join("; ");
}
