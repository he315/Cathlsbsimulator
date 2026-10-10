// ---------------------------------------------------------------------------
// The full case's pre-procedure record with one planted problem
// (proc-chart-planted-problems; requests pm-planning#2 and pm-to-the-root#9).
//
// Every patient arrives with a pre-procedure record: medications with the time
// of the last dose, bloods and their age, devices and arms (closure devices,
// a dialysis fistula), resuscitation status, forthcoming surgery and, for a
// woman of childbearing potential, the pregnancy test. For an elective case
// (stable angina, an out-patient day case) exactly one item of the record is a
// problem from the manuals' checklists; every other item is written so that it
// is not one. An acute case also has exactly one (below). The problem comes from the patient where the patient carries it
// (a PDE-5 inhibitor, a DOAC inside its hold window, a previous contrast
// reaction), from a planning scenario that forces it, or is drawn from those
// the patient can have (seeded, so one seed gives one record).
//
// An acute case (unstable angina, NSTEMI, STEMI: an in-patient) is not held to
// the elective rules: Brilakis Table 1.2 is for an elective procedure, the
// 14-day bloods window is the out-patient's (24 h for an in-patient, bloods on
// admission), and postponing or a diagnostic-only plan is not the answer to an
// acute coronary syndrome. Its record plants one problem that applies to an
// in-patient (a PDE-5 inhibitor, a previous contrast reaction, an unsuspended
// do-not-resuscitate order, a pregnancy test) and, when the patient can have
// none of them, the site problem of the planned access: a recent
// anchor-and-collagen-plug closure device in the planned (right) groin for a
// femoral case, a dialysis fistula in the planned arm for a radial one. Every
// generated record therefore has exactly one planted problem.
//
// This file is pure: no engine, no session. The session module
// (modules/planning.ts) holds the record of a case, the learner's actions on
// it, the consequences of a missed problem and Oxford's pre-puncture
// checklist; the chart section (src/ui/access/chart/PlantedProblems.tsx)
// shows it.
//
// Sources (module text):
// - DOAC holds: Brilakis Table 1.2, src/content/manual/pci-manual/01-planning.ts (the table captioned
//   'Brilakis Table 1.2'); Oxford's 24 h, and 72 h for dabigatran in renal impairment, in the drug
//   table of the same lesson (pm-planning-preparation), shown as the accepted alternative.
// - PDE-5 windows: PDE5_WINDOW_H (pharmacology.ts, Brilakis 3.2).
// - INR within 24 h on warfarin, bloods within 14 days for an out-patient, pregnancy test, surgery in
//   the next 6-12 months, a dialysis fistula arm, an anchor-and-collagen-plug closure device within 90
//   days: Brilakis's checklist in pm-planning-assessment (01-planning.ts, tests, examination and
//   access tables and the stent-candidacy step).
// - Metformin in CKD (omit on the day and for 48 h or more after), contrast premedication (Oxford:
//   chlorphenamine 10 mg and hydrocortisone 100 mg IV an hour ahead; Brilakis, for an emergency:
//   hydrocortisone 100 mg IV as soon as possible before the procedure): pm-planning-preparation.
// - Bloods within 14 days for an out-patient, 24 h for an in-patient: pm-planning-assessment.
// - Resuscitation status: Brilakis's consent checklist in pm-planning-consent.
// - The pre-puncture checklist: Oxford chapter 1, 'Before the first puncture' in pm-to-the-root-table
//   (src/content/manual/pci-manual/06-to-the-root.ts).
// Every other number below is a MODEL PARAMETER and is named as such.
// ---------------------------------------------------------------------------

import type { AccessRoute } from "../../types";
import type { PatientProfile } from "../patient/patient";
import type { DoacAgent, Pde5Agent } from "../patient/pharmacology";
import { PDE5_WINDOW_H } from "../patient/pharmacology";
import { INDICATION_LABEL, childbearingPotential } from "../patient/patient";
import { SeededRng } from "../patient/rng";

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export const PLANTED_PROBLEM_IDS = [
  "doac-recent",
  "warfarin-inr-unchecked",
  "metformin-ckd",
  "contrast-allergy-unpremedicated",
  "pde5-24h",
  "closure-device-90d",
  "dialysis-fistula",
  "bloods-old",
  "surgery-planned",
  "dnacpr-unsuspended",
  "pregnancy-test",
] as const;
export type PlantedProblemId = (typeof PLANTED_PROBLEM_IDS)[number];
export const isPlantedProblemId = (x: unknown): x is PlantedProblemId => typeof x === "string" && (PLANTED_PROBLEM_IDS as readonly string[]).includes(x);

/** The record's items (the chart items this package adds). */
export type RecordItemId = "medications" | "bloods" | "access-history" | "resuscitation" | "pre-assessment" | "pregnancy";

export const RECORD_ITEM_LABEL: Record<RecordItemId, string> = {
  medications: "Medications and last doses",
  bloods: "Bloods",
  "access-history": "Devices, arms and groins",
  resuscitation: "Resuscitation status",
  "pre-assessment": "Pre-assessment notes",
  pregnancy: "Pregnancy test",
};

/** What the learner can do about the chart (the same menu for every patient). */
export type PlanningActionId =
  | "hold-and-delay"
  | "other-access"
  | "premedicate"
  | "avoid-nitrate"
  | "check-inr"
  | "hold-metformin"
  | "repeat-bloods"
  | "rethink-stenting"
  | "clarify-resuscitation"
  | "pregnancy-test"
  | "proceed";

export interface PlanningAction {
  id: PlanningActionId;
  label: string;
}

export const PLANNING_ACTIONS: readonly PlanningAction[] = [
  { id: "hold-and-delay", label: "Hold and delay the case" },
  { id: "other-access", label: "Plan another access site" },
  { id: "premedicate", label: "Premedicate for contrast: hydrocortisone 100 mg and chlorphenamine 10 mg IV, an hour ahead" },
  { id: "avoid-nitrate", label: "Tell the team: no nitroglycerin in this case" },
  { id: "check-inr", label: "Check the INR now" },
  { id: "hold-metformin", label: "Hold metformin today and for at least 48 hours after" },
  { id: "repeat-bloods", label: "Repeat the bloods before the case" },
  { id: "rethink-stenting", label: "Diagnostic study only: rethink stenting with the surgeon and anaesthetist" },
  { id: "clarify-resuscitation", label: "Clarify and document resuscitation status for the procedure" },
  { id: "pregnancy-test", label: "Pregnancy test before the case" },
  { id: "proceed", label: "Nothing in the chart stops the case: proceed" },
];

export const PLANNING_ACTION_BY_ID: Readonly<Record<PlanningActionId, PlanningAction>> = Object.fromEntries(PLANNING_ACTIONS.map((a) => [a.id, a])) as Record<PlanningActionId, PlanningAction>;

/** Elective (stable angina: an out-patient day case) or acute (an acute coronary syndrome: an in-patient). */
export type PlanningSetting = "elective" | "acute";

/** The setting of a case from its indication. */
export const settingOf = (p: Pick<PatientProfile, "indication">): PlanningSetting => (p.indication === "SA" ? "elective" : "acute");

/** The emergency premedication (Brilakis: hydrocortisone 100 mg IV as soon as possible, pm-planning-preparation). */
const ACUTE_PREMEDICATE_LABEL = "Premedicate for contrast: hydrocortisone 100 mg IV now, before the emergency case";

/** An action's label for the case's setting (premedication differs in an emergency). */
export function planningActionLabel(id: PlanningActionId, setting: PlanningSetting): string {
  return id === "premedicate" && setting === "acute" ? ACUTE_PREMEDICATE_LABEL : PLANNING_ACTION_BY_ID[id].label;
}

/** One planted problem: where the chart states it, what fixes it, and what teaches it. */
export interface PlantedProblem {
  id: PlantedProblemId;
  /** the problem in a line, for the debrief */
  title: string;
  /** the record item that states it */
  chartItem: RecordItemId;
  /** actions that act on it (any one of them is correct) */
  correct: readonly PlanningActionId[];
  /** what happens in the case when it is missed (the session module makes it happen) */
  consequence: string;
  /** the lesson that teaches it (the debrief links it beside the action decision) */
  lessonId: string;
  tipIds: readonly string[];
  /** where the rule comes from in the module text */
  source: string;
}

export const PLANTED_PROBLEMS: Readonly<Record<PlantedProblemId, PlantedProblem>> = {
  "doac-recent": {
    id: "doac-recent",
    title: "A DOAC taken inside its hold window for this creatinine clearance",
    chartItem: "medications",
    correct: ["hold-and-delay"],
    consequence: "The residual anticoagulant raises the baseline ACT and the bleeding risk at the puncture site.",
    lessonId: "pm-planning-preparation",
    tipIds: ["access-planning-anticoagulated"],
    source: "Brilakis Table 1.2; Oxford 24 h (72 h for dabigatran in renal impairment), pm-planning-preparation",
  },
  "warfarin-inr-unchecked": {
    id: "warfarin-inr-unchecked",
    title: "Warfarin with no INR in the last 24 hours",
    chartItem: "bloods",
    correct: ["check-inr", "hold-and-delay"],
    consequence: "The INR today is unknown to the team; the residual warfarin raises the baseline ACT and the bleeding risk.",
    lessonId: "pm-planning-preparation",
    tipIds: ["access-planning-anticoagulated"],
    source: "Brilakis's checklist: INR within 24 hours on warfarin (pm-planning-assessment, tests table)",
  },
  "metformin-ckd": {
    id: "metformin-ckd",
    title: "Metformin taken today in chronic kidney disease",
    chartItem: "medications",
    correct: ["hold-metformin"],
    consequence: "Metformin is continued through a contrast load with impaired renal function.",
    lessonId: "pm-planning-preparation",
    tipIds: ["diag-caki-prepare"],
    source: "Brilakis: with CKD omit metformin on the day and for 48 hours or more afterwards (pm-planning-preparation)",
  },
  "contrast-allergy-unpremedicated": {
    id: "contrast-allergy-unpremedicated",
    title: "A previous contrast reaction with no premedication",
    chartItem: "medications",
    correct: ["premedicate", "hold-and-delay"],
    consequence: "Contrast is given without premedication: the previous-reaction risk applies in full.",
    lessonId: "pm-planning-preparation",
    tipIds: ["diag-planning-contrast-allergy"],
    source: "Brilakis's allergy checklist and course; Oxford's IV regimen an hour ahead (pm-planning-preparation)",
  },
  "pde5-24h": {
    id: "pde5-24h",
    title: "A PDE-5 inhibitor inside its nitrate window",
    chartItem: "medications",
    correct: ["avoid-nitrate"],
    consequence: "Nitroglycerin for spasm drops the pressure much more than in a patient without the PDE-5 inhibitor.",
    lessonId: "pm-planning-preparation",
    tipIds: ["diag-planning-pde5-nitrate"],
    source: "Brilakis 3.2: no nitroglycerin within 24 h of sildenafil, vardenafil or avanafil, 48 h of tadalafil",
  },
  "closure-device-90d": {
    id: "closure-device-90d",
    title: "An anchor-and-collagen-plug closure device in the planned groin within 90 days",
    chartItem: "access-history",
    correct: ["other-access"],
    consequence: "The groin with the plug is punctured, and no closure device can be used in it.",
    lessonId: "pm-planning-assessment",
    tipIds: ["access-planning-site-history"],
    source: "Brilakis 1.4: the other femoral artery or a radial after such a device within 90 days (pm-planning-assessment)",
  },
  "dialysis-fistula": {
    id: "dialysis-fistula",
    title: "A dialysis fistula in the planned arm",
    chartItem: "access-history",
    correct: ["other-access"],
    consequence: "The fistula arm is punctured.",
    lessonId: "pm-planning-assessment",
    tipIds: ["access-planning-site-history"],
    source: "Brilakis's examination checklist: a dialysis fistula arm is not used (pm-planning-assessment)",
  },
  "bloods-old": {
    id: "bloods-old",
    title: "Out-patient bloods older than 14 days",
    chartItem: "bloods",
    correct: ["repeat-bloods"],
    consequence: "The case goes ahead on blood results older than the checklist allows.",
    lessonId: "pm-planning-assessment",
    tipIds: ["diag-planning-check-in"],
    source: "Brilakis's checklist: blood count and electrolytes within 14 days for an out-patient (pm-planning-assessment)",
  },
  "surgery-planned": {
    id: "surgery-planned",
    title: "Non-cardiac surgery planned within 6-12 months",
    chartItem: "pre-assessment",
    correct: ["rethink-stenting"],
    consequence: "Stenting would commit the patient to DAPT that the planned operation will interrupt.",
    lessonId: "pm-planning-assessment",
    tipIds: ["pci-planning-stent-candidacy"],
    source: "Brilakis 1.1 and 1.10: surgery in the next 6-12 months is a reason to avoid PCI (pm-planning-assessment)",
  },
  "dnacpr-unsuspended": {
    id: "dnacpr-unsuspended",
    title: "A do-not-resuscitate order not discussed or suspended for the procedure",
    chartItem: "resuscitation",
    correct: ["clarify-resuscitation"],
    consequence: "The team starts the case without knowing whether to resuscitate.",
    lessonId: "pm-planning-consent",
    tipIds: ["diag-planning-resuscitation-status"],
    source: "Brilakis's consent checklist: a do-not-resuscitate order and whether it is suspended (pm-planning-consent)",
  },
  "pregnancy-test": {
    id: "pregnancy-test",
    title: "No pregnancy test in a woman of childbearing potential",
    chartItem: "pregnancy",
    correct: ["pregnancy-test"],
    consequence: "Radiation is given without a pregnancy test.",
    lessonId: "pm-planning-assessment",
    tipIds: ["diag-planning-check-in"],
    source: "Brilakis's checklist (serum beta-hCG) and Oxford's check-in (pm-planning-assessment)",
  },
};

// ---------------------------------------------------------------------------
// Sourced thresholds and MODEL PARAMETERS
// ---------------------------------------------------------------------------

/** Brilakis Table 1.2 (01-planning.ts): days to hold a DOAC before an elective catheter procedure, by creatinine clearance. */
export function brilakisDoacHoldDays(agent: DoacAgent, crclMlMin: number): number | null {
  if (crclMlMin < 15) return null; // the table stops at 15 mL/min
  switch (agent) {
    case "apixaban":
      return 2;
    case "edoxaban":
    case "rivaroxaban":
      return crclMlMin < 50 ? 3 : 2;
    case "dabigatran":
      return crclMlMin > 80 ? 2 : crclMlMin >= 50 ? 3 : crclMlMin >= 30 ? 4 : 5;
  }
}

/** Oxford (pm-planning-preparation drug table): 24 h, or 72 h for dabigatran with renal impairment. */
export function oxfordDoacHoldH(agent: DoacAgent, crclMlMin: number): number {
  return agent === "dabigatran" && crclMlMin < MP_PLANNING.renalImpairmentCrclMlMin ? 72 : 24;
}

/** Sourced windows (module text, see the header). */
export const PLANNING_RULES = {
  /** INR within 24 h on warfarin */
  inrMaxAgeH: 24,
  /** out-patient bloods within 14 days */
  bloodsMaxAgeDays: 14,
  /** an anchor-and-collagen-plug device within 90 days */
  closureDeviceDays: 90,
  /** non-cardiac surgery in the next 6-12 months: the upper bound */
  surgeryWithinMonths: 12,
  /** Oxford: SaO2 above 96% on room air */
  spo2AbovePct: 96,
} as const;

/**
 * MODEL PARAMETERS (planning settings, not population values):
 * - renalImpairmentCrclMlMin: the clearance below which Oxford's 'renal impairment' 72 h dabigatran
 *   hold is applied (the text gives no number);
 * - ckdEgfr: the eGFR below which the record calls the kidneys chronically impaired (metformin rule);
 * - dnacprMinAgeY: the age from which the draw offers a do-not-resuscitate order to any patient
 *   (below it, only through the acute fallback, siteFallbackShare);
 * - noCrclHoldDays: the hold applied below the table's 15 mL/min;
 * - dialysisEgfr: the eGFR below which the record's fistula is in use for haemodialysis; above it
 *   the record says a kidney transplant has since taken over (a narrative choice, so a drawn fistula
 *   never contradicts the patient's creatinine);
 * - siteFallbackShare: for an acute patient who can carry none of the in-patient problems, the share
 *   given the site problem of the planned access; the rest carry an unsuspended do-not-resuscitate
 *   order below dnacprMinAgeY (a case-mix setting, so an acute case does not always mean a site problem);
 * - the ranges the record draws its times from (h, days, months) and the draw weights (uniform).
 */
export const MP_PLANNING = {
  renalImpairmentCrclMlMin: 50,
  ckdEgfr: 60,
  dnacprMinAgeY: 65,
  noCrclHoldDays: 5,
  dialysisEgfr: 15,
  siteFallbackShare: 0.6,
  doacDrawH: [12, 48] as [number, number],
  bloodsOkDays: [1, 10] as [number, number],
  bloodsOldDays: [18, 35] as [number, number],
  inrOldDays: [3, 8] as [number, number],
  inrTodayRange: [2.4, 3.6] as [number, number],
  inrLastRange: [2.0, 3.0] as [number, number],
  closureDeviceDays: [21, 80] as [number, number],
  surgeryMonths: [2, 6] as [number, number],
};

// ---------------------------------------------------------------------------
// Facts and the record
// ---------------------------------------------------------------------------

/** What the record knows about the patient (truth for the debrief and the session module). */
export interface PlanningFacts {
  /** elective (out-patient) or acute (in-patient): which rules apply */
  setting: PlanningSetting;
  /** agentNamed: the patient's own agent; false when the record shows the default agent of an unnamed DOAC */
  doac: { agent: DoacAgent; agentNamed: boolean; hoursSinceDose: number; crclMlMin: number; brilakisHoldH: number; oxfordHoldH: number } | null;
  warfarin: { inrLast: number; inrAgeH: number; inrToday: number } | null;
  metformin: { taking: boolean; heldSinceH: number | null; ckd: boolean } | null;
  contrastAllergy: PatientProfile["allergies"]["contrast"];
  premedicated: boolean;
  pde5: { agent: Pde5Agent; hoursAgo: number; windowH: number } | null;
  closureDevice: { side: "right" | "left"; daysAgo: number } | null;
  fistulaArm: "right" | "left" | null;
  bloodsDaysAgo: number;
  surgery: { what: string; months: number } | null;
  dnacpr: { present: boolean; suspended: boolean };
  pregnancy: { applicable: boolean; done: boolean };
}

export interface RecordItem {
  id: RecordItemId;
  label: string;
  /** what the record says, one line per entry */
  lines: string[];
}

export interface PlanningRecord {
  /** the planted problem (every generated record has one; null only for a record a caller builds without one) */
  planted: PlantedProblemId | null;
  facts: PlanningFacts;
  items: RecordItem[];
}

export interface PlanningInput {
  seed: string;
  profile: PatientProfile;
  /** the planned access */
  access: AccessRoute;
  /** the session chart's anticoagulation line: its DOAC dose time and INR are the record's */
  anticoagText?: string;
  /** a planning scenario's problem */
  force?: PlantedProblemId;
}

const r1 = (x: number) => Math.round(x * 10) / 10;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const sideOf = (a: AccessRoute): "right" | "left" => (a === "radial-left" ? "left" : "right");
const isRadial = (a: AccessRoute) => a !== "femoral";

/** The DOAC dose time the session chart states ('last dose 20 h ago'), if any. */
export function chartDoacHours(text: string | undefined): number | null {
  const m = text ? /last dose (\d+(?:\.\d+)?) h ago/.exec(text) : null;
  return m ? Number(m[1]) : null;
}

/** The INR the session chart states: today ('INR today 2.4') or with its age ('last INR 2.4, 5 days ago'). */
export function chartInr(text: string | undefined): { inr: number; ageH: number } | null {
  if (!text) return null;
  const today = /INR today (\d+(?:\.\d+)?)/.exec(text);
  if (today) return { inr: Number(today[1]), ageH: 2 };
  const old = /last INR (\d+(?:\.\d+)?),? (\d+) days? ago/i.exec(text);
  return old ? { inr: Number(old[1]), ageH: Number(old[2]) * 24 } : null;
}

/** The hold that makes a DOAC dose a problem: Brilakis's table (or its fallback below 15 mL/min), h. */
function doacFacts(agent: DoacAgent, agentNamed: boolean, hoursSinceDose: number, crcl: number): NonNullable<PlanningFacts["doac"]> {
  const days = brilakisDoacHoldDays(agent, crcl) ?? MP_PLANNING.noCrclHoldDays;
  return { agent, agentNamed, hoursSinceDose: r1(hoursSinceDose), crclMlMin: crcl, brilakisHoldH: days * 24, oxfordHoldH: oxfordDoacHoldH(agent, crcl) };
}

/**
 * Problems a patient can be drawn with without changing the engine's patient (chart-only). The two
 * that rule out the planned site (a closure device in the planned groin, a fistula in the planned arm)
 * are not in the draw: they come from their scenarios, and they are, with a younger patient's
 * do-not-resuscitate order, what an acute patient eligible for none of these carries (planFacts), so
 * that every record has exactly one problem.
 */
function chartOnlyEligible(p: PatientProfile, setting: PlanningSetting): PlantedProblemId[] {
  // an in-patient's bloods are taken on admission, and an acute syndrome is not sent away for planned surgery
  const out: PlantedProblemId[] = setting === "elective" ? ["bloods-old", "surgery-planned"] : [];
  if (setting === "elective" && p.risk.diabetes && p.renal.egfr < MP_PLANNING.ckdEgfr) out.push("metformin-ckd");
  if (p.ageY >= MP_PLANNING.dnacprMinAgeY) out.push("dnacpr-unsuspended");
  if (childbearingPotential(p)) out.push("pregnancy-test");
  return out;
}

/** The site problem of the planned access: the plug in the planned groin, or the fistula in the planned arm. */
const sitePlanted = (access: AccessRoute): PlantedProblemId => (access === "femoral" ? "closure-device-90d" : "dialysis-fistula");

/**
 * The planted problem and the facts of the record. A forced one (a planning scenario) comes first,
 * then a problem the patient carries (a PDE-5 inhibitor inside its window, a DOAC inside its hold, a
 * previous contrast reaction), then one drawn from those this patient can have and, for an acute
 * patient who can have none of them, the site problem of the planned access or an unsuspended
 * do-not-resuscitate order (MP_PLANNING.siteFallbackShare). Every other fact is set
 * so that it is not a problem.
 */
export function planFacts(input: PlanningInput): { planted: PlantedProblemId; facts: PlanningFacts } {
  const p = input.profile;
  const rng = new SeededRng(`planning:${input.seed}`);
  const access = input.access;
  const setting = settingOf(p);
  const acute = setting === "acute";

  // what the patient carries (the engine already has it)
  const pde5 = p.pde5 ? { agent: p.pde5.agent, hoursAgo: r1(p.pde5.hoursAgo), windowH: PDE5_WINDOW_H[p.pde5.agent] } : null;
  let doac: PlanningFacts["doac"] = null;
  if (p.anticoagulation === "doac") {
    const h = p.doac?.hoursSinceDose ?? chartDoacHours(input.anticoagText) ?? Math.round(rng.range(MP_PLANNING.doacDrawH[0], MP_PLANNING.doacDrawH[1]));
    doac = doacFacts(p.doac?.agent ?? "apixaban", !!p.doac, h, p.renal.crclMlMin);
  }
  // one draw per fact, always in this order, so the record does not shift with the problem planted
  const u = { bloods: rng.next(), inrOld: rng.next(), inrToday: rng.next(), inrLast: rng.next(), device: rng.next(), deviceSide: rng.next(), surgery: rng.next(), surgeryWhat: rng.next(), pick: rng.next(), fallback: rng.next() };
  const within = (r: [number, number], x: number) => r[0] + x * (r[1] - r[0]);

  const carried: PlantedProblemId[] = [];
  if (pde5 && pde5.hoursAgo < pde5.windowH) carried.push("pde5-24h");
  // Brilakis Table 1.2 is for an elective procedure: an acute case is not held for the DOAC
  if (!acute && doac && doac.hoursSinceDose < doac.brilakisHoldH) carried.push("doac-recent");
  if (p.allergies.contrast !== "none") carried.push("contrast-allergy-unpremedicated");

  let planted: PlantedProblemId;
  if (input.force) planted = input.force;
  else if (carried.length) planted = carried[0];
  else {
    const pool = chartOnlyEligible(p, setting);
    // an acute patient who can carry none of the in-patient problems has, in most draws, the site
    // problem of the planned access (a recent collagen-plug device in the planned (right) groin, or a
    // dialysis fistula in the planned arm) and otherwise a do-not-resuscitate order not discussed for
    // the procedure, which a younger patient can also hold (MP_PLANNING.siteFallbackShare)
    planted = pool.length
      ? pool[Math.min(pool.length - 1, Math.floor(u.pick * pool.length))]
      : u.fallback < MP_PLANNING.siteFallbackShare
      ? sitePlanted(access)
      : "dnacpr-unsuspended";
  }

  const warfarinInr = p.anticoagulation === "warfarin" ? chartInr(input.anticoagText) : null;
  const facts: PlanningFacts = {
    setting,
    doac,
    warfarin:
      p.anticoagulation === "warfarin" || planted === "warfarin-inr-unchecked"
        ? planted === "warfarin-inr-unchecked"
          ? {
              inrLast: warfarinInr && warfarinInr.ageH > PLANNING_RULES.inrMaxAgeH ? warfarinInr.inr : r1(within(MP_PLANNING.inrLastRange, u.inrLast)),
              inrAgeH: warfarinInr && warfarinInr.ageH > PLANNING_RULES.inrMaxAgeH ? warfarinInr.ageH : Math.round(within(MP_PLANNING.inrOldDays, u.inrOld)) * 24,
              inrToday: r1(within(MP_PLANNING.inrTodayRange, u.inrToday)),
            }
          : { inrLast: warfarinInr?.inr ?? r1(within(MP_PLANNING.inrLastRange, u.inrLast)), inrAgeH: 2, inrToday: warfarinInr?.inr ?? r1(within(MP_PLANNING.inrLastRange, u.inrLast)) }
        : null,
    metformin: p.risk.diabetes || planted === "metformin-ckd" ? { taking: true, heldSinceH: planted === "metformin-ckd" ? null : 24, ckd: p.renal.egfr < MP_PLANNING.ckdEgfr } : null,
    contrastAllergy: p.allergies.contrast,
    // a reaction that is not the planted problem was premedicated as arranged at pre-assessment
    premedicated: p.allergies.contrast !== "none" && planted !== "contrast-allergy-unpremedicated",
    pde5,
    closureDevice: planted === "closure-device-90d" ? { side: access === "femoral" ? "right" : u.deviceSide < 0.5 ? "right" : "left", daysAgo: Math.round(within(MP_PLANNING.closureDeviceDays, u.device)) } : null,
    fistulaArm: planted === "dialysis-fistula" ? (isRadial(access) ? sideOf(access) : "left") : null,
    // an in-patient's bloods were taken on admission today
    bloodsDaysAgo: acute && planted !== "bloods-old" ? 0 : Math.round(planted === "bloods-old" ? within(MP_PLANNING.bloodsOldDays, u.bloods) : within(MP_PLANNING.bloodsOkDays, u.bloods)),
    surgery: planted === "surgery-planned" ? { what: SURGERY[Math.min(SURGERY.length - 1, Math.floor(u.surgeryWhat * SURGERY.length))], months: Math.round(within(MP_PLANNING.surgeryMonths, u.surgery)) } : null,
    dnacpr: planted === "dnacpr-unsuspended" ? { present: true, suspended: false } : { present: false, suspended: false },
    pregnancy: { applicable: childbearingPotential(p) || planted === "pregnancy-test", done: planted !== "pregnancy-test" },
  };
  return { planted, facts };
}

/** Elective non-cardiac operations the pre-assessment note can name (model choices). */
const SURGERY = ["a right total hip replacement", "a left total knee replacement", "a laparoscopic cholecystectomy", "a transurethral resection of the prostate", "a hernia repair"];

/**
 * Every checklist problem the facts hold for this planned access, in PLANTED_PROBLEM_IDS order. A
 * well-formed record has exactly one, the planted problem. Independent of planFacts, so the test can
 * check one against the other.
 */
export function problemsPresent(f: PlanningFacts, access: AccessRoute): PlantedProblemId[] {
  const out: PlantedProblemId[] = [];
  if (f.setting === "elective" && f.doac && f.doac.hoursSinceDose < f.doac.brilakisHoldH) out.push("doac-recent");
  if (f.warfarin && f.warfarin.inrAgeH > PLANNING_RULES.inrMaxAgeH) out.push("warfarin-inr-unchecked");
  if (f.metformin && f.metformin.taking && f.metformin.heldSinceH === null && f.metformin.ckd) out.push("metformin-ckd");
  if (f.contrastAllergy !== "none" && !f.premedicated) out.push("contrast-allergy-unpremedicated");
  if (f.pde5 && f.pde5.hoursAgo < f.pde5.windowH) out.push("pde5-24h");
  if (f.closureDevice && f.closureDevice.daysAgo < PLANNING_RULES.closureDeviceDays && access === "femoral" && f.closureDevice.side === "right") out.push("closure-device-90d");
  if (f.fistulaArm && isRadial(access) && f.fistulaArm === sideOf(access)) out.push("dialysis-fistula");
  if (f.bloodsDaysAgo > PLANNING_RULES.bloodsMaxAgeDays) out.push("bloods-old");
  if (f.surgery && f.surgery.months <= PLANNING_RULES.surgeryWithinMonths) out.push("surgery-planned");
  if (f.dnacpr.present && !f.dnacpr.suspended) out.push("dnacpr-unsuspended");
  if (f.pregnancy.applicable && !f.pregnancy.done) out.push("pregnancy-test");
  return out;
}

const DOAC_NAME: Record<DoacAgent, string> = { apixaban: "Apixaban", rivaroxaban: "Rivaroxaban", edoxaban: "Edoxaban", dabigatran: "Dabigatran" };
const PDE5_NAME: Record<Pde5Agent, string> = { sildenafil: "Sildenafil", vardenafil: "Vardenafil", avanafil: "Avanafil", tadalafil: "Tadalafil" };

/** The record's items as the chart shows them (what an operator would read; no verdicts). */
export function recordItems(p: PatientProfile, f: PlanningFacts): RecordItem[] {
  const meds: string[] = [];
  const acute = f.setting === "acute";
  meds.push(acute ? "Aspirin: loading dose given on admission." : "Aspirin: last dose this morning.");
  if (acute) meds.push("P2Y12 inhibitor: loading dose given on admission.");
  if (p.risk.dyslipidaemia || acute) meds.push("Atorvastatin: last dose last night.");
  if (f.doac) meds.push(`${f.doac.agentNamed ? DOAC_NAME[f.doac.agent] : `Direct oral anticoagulant (${f.doac.agent})`}: last dose ${f.doac.hoursSinceDose} h ago.`);
  if (f.warfarin) meds.push("Warfarin: last dose yesterday evening.");
  if (f.metformin)
    meds.push(
      f.metformin.heldSinceH === null
        ? "Metformin: last dose this morning, with breakfast."
        : acute
        ? "Metformin: held since admission."
        : `Metformin: held since ${f.metformin.heldSinceH} h before the case, as instructed at pre-assessment.`,
    );
  if (f.pde5) meds.push(`${PDE5_NAME[f.pde5.agent]}: taken ${f.pde5.hoursAgo} h ago (the patient's own supply).`);
  if (f.contrastAllergy !== "none")
    meds.push(
      !f.premedicated
        ? "No premedication recorded for the previous contrast reaction."
        : acute
        ? "Intravenous hydrocortisone for the contrast reaction: given on admission."
        : "Steroid and antihistamine premedication for the contrast reaction: taken as arranged at pre-assessment.",
    );

  const bloods: string[] = [
    acute && f.bloodsDaysAgo === 0
      ? "Full blood count, electrolytes and creatinine: taken on admission today."
      : `Full blood count, electrolytes and creatinine: taken ${f.bloodsDaysAgo} days ago, at the out-patient pre-assessment.`,
  ];
  if (f.warfarin)
    bloods.push(
      f.warfarin.inrAgeH <= PLANNING_RULES.inrMaxAgeH
        ? `INR ${f.warfarin.inrLast} ${acute ? "on admission" : "this morning"}.`
        : `INR ${f.warfarin.inrLast}, ${Math.round(f.warfarin.inrAgeH / 24)} days ago (anticoagulation clinic); none since.`,
    );

  const access: string[] = [];
  access.push(f.closureDevice ? `${cap(f.closureDevice.side)} femoral angiogram ${f.closureDevice.daysAgo} days ago, closed with an anchor-and-collagen-plug closure device.` : "No previous closure devices.");
  access.push(
    !f.fistulaArm
      ? "No dialysis fistula; both arms free."
      : p.renal.egfr < MP_PLANNING.dialysisEgfr
      ? `On haemodialysis through a ${f.fistulaArm} forearm arteriovenous fistula.`
      : // kidneys that are not at a dialysis level: the fistula is kept after a transplant (a record narrative)
        `${cap(f.fistulaArm)} forearm arteriovenous fistula, formed for haemodialysis; functioning kidney transplant since, fistula kept.`,
  );

  const resus = [f.dnacpr.present ? (f.dnacpr.suspended ? "Do-not-resuscitate order: discussed and suspended for the procedure; documented." : "Do-not-resuscitate order in place (signed on a previous admission); not discussed for this procedure.") : "For full resuscitation."];
  const pre = [
    f.surgery ? `Listed for ${f.surgery.what} in ${f.surgery.months} months.` : "No planned non-cardiac surgery.",
    acute ? `Admitted with ${INDICATION_LABEL[p.indication].toLowerCase()}; in-patient. Consent discussed on the ward.` : "Consent discussed at pre-assessment; out-patient day case.",
  ];

  const items: RecordItem[] = [
    { id: "medications", label: RECORD_ITEM_LABEL.medications, lines: meds },
    { id: "bloods", label: RECORD_ITEM_LABEL.bloods, lines: bloods },
    { id: "access-history", label: RECORD_ITEM_LABEL["access-history"], lines: access },
    { id: "resuscitation", label: RECORD_ITEM_LABEL.resuscitation, lines: resus },
    { id: "pre-assessment", label: acute ? "Admission notes" : RECORD_ITEM_LABEL["pre-assessment"], lines: pre },
  ];
  if (f.pregnancy.applicable) items.push({ id: "pregnancy", label: RECORD_ITEM_LABEL.pregnancy, lines: [f.pregnancy.done ? "Urine pregnancy test this morning: negative." : "Not done."] });
  return items;
}

/** The phrase in the record that states the planted problem (the test checks the chart says it). */
export function statedBy(id: PlantedProblemId, f: PlanningFacts): string {
  switch (id) {
    case "doac-recent":
      return `last dose ${f.doac?.hoursSinceDose} h ago`;
    case "warfarin-inr-unchecked":
      return "none since";
    case "metformin-ckd":
      return "Metformin: last dose this morning";
    case "contrast-allergy-unpremedicated":
      return "No premedication recorded";
    case "pde5-24h":
      return `taken ${f.pde5?.hoursAgo} h ago`;
    case "closure-device-90d":
      return "anchor-and-collagen-plug closure device";
    case "dialysis-fistula":
      return "arteriovenous fistula";
    case "bloods-old":
      return `taken ${f.bloodsDaysAgo} days ago`;
    case "surgery-planned":
      return `in ${f.surgery?.months} months`;
    case "dnacpr-unsuspended":
      return "not discussed for this procedure";
    case "pregnancy-test":
      return "Not done.";
  }
}

/** The patient's pre-procedure record: the planted problem, its facts and what the chart says. */
export function buildPlanningRecord(input: PlanningInput): PlanningRecord {
  const { planted, facts } = planFacts(input);
  return { planted, facts, items: recordItems(input.profile, facts) };
}

/**
 * Whether an action acts on the planted problem. For a DOAC past Oxford's hold but inside Brilakis's,
 * proceeding is the accepted alternative where the unit follows Oxford (the manuals differ). An acute
 * case is never postponed for the chart; with nothing planted, proceeding is what fits.
 */
export function actionFits(planted: PlantedProblemId | null, action: PlanningActionId, f: PlanningFacts): { correct: boolean; note?: string } {
  if (action === "hold-and-delay" && f.setting === "acute") return { correct: false };
  if (planted === null) return { correct: action === "proceed" };
  const pp = PLANTED_PROBLEMS[planted];
  if (pp.correct.includes(action)) return { correct: true };
  if (planted === "doac-recent" && action === "proceed" && f.doac && f.doac.hoursSinceDose >= f.doac.oxfordHoldH)
    return { correct: true, note: `Oxford's ${f.doac.oxfordHoldH} h hold has been met; accepted where the unit follows Oxford (Brilakis holds ${f.doac.brilakisHoldH / 24} days)` };
  return { correct: false };
}

// ---------------------------------------------------------------------------
// Oxford's pre-puncture checklist (pm-to-the-root#9)
// ---------------------------------------------------------------------------

export type ChecklistItemId = "venous-access" | "ecg" | "spo2" | "lead-scrub" | "prep-drape" | "trolley" | "manifold" | "transducer";

export interface ChecklistItem {
  id: ChecklistItemId;
  text: string;
}

/** Oxford chapter 1, 'Before the first puncture' (06-to-the-root.ts, pm-to-the-root-table). */
export const PRE_PUNCTURE_CHECKLIST: readonly ChecklistItem[] = [
  { id: "venous-access", text: "Intravenous line in place" },
  { id: "ecg", text: "Continuous ECG of good quality" },
  { id: "spo2", text: "Pulse oximetry: SpO2 above 96%, on air or with oxygen" },
  { id: "lead-scrub", text: "Lead protection and sterile scrub suit on" },
  { id: "prep-drape", text: "Access site prepared and draped aseptically" },
  { id: "trolley", text: "Sterile trolley complete" },
  { id: "manifold", text: "Manifold flushed and contrast run through without bubbles" },
  { id: "transducer", text: "Transducer calibrated and zeroed" },
];
