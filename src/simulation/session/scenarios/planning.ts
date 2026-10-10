// The full case's planning scenarios (proc-chart-planted-problems): one per planted problem of the
// pre-procedure record (src/simulation/session/planning.ts), each a fixed patient whose chart holds
// that problem and no other, opened at the chart; and 'checklist', opened ready to puncture for
// Oxford's pre-puncture checklist. The session module 'planning' (modules/planning.ts) plants the
// problem whose id is the scenario's id, scores the learner's actions and makes the consequences
// of a miss happen.
//
// Scenario settings, all MODEL PARAMETERS unless cited (none is a population value):
//   - fixed seeds, elective stable-angina cases (out-patient day cases), sinus rhythm unless the
//     problem is an anticoagulant for atrial fibrillation;
//   - every problem the patient could carry and that is not the scenario's is cleared (no oral
//     anticoagulant, no previous contrast reaction), so the chart holds exactly one problem;
//   - doac-recent: rivaroxaban 18 h before arrival, inside Oxford's 24 h and Brilakis's 2 days
//     (Table 1.2 at this clearance), so the manuals agree that the case waits;
//   - warfarin-inr-unchecked: the last INR 6 days old (Brilakis's checklist asks for one within 24 h);
//   - metformin-ckd: a patient with diabetes whose creatinine puts the eGFR in chronic kidney disease;
//   - contrast-allergy-unpremedicated: a previous severe reaction (the engine's previous-reaction
//     risk applies, SIM_FACTS, responses.ts);
//   - pde5-24h: sildenafil 14 h before arrival (window 24 h, Brilakis 3.2), in a man whose resting
//     pressure is at the low end of the generator's range (96/58), so repeated nitroglycerin for
//     spasm takes him below the hypotension threshold, which it does not without the sildenafil;
//   - closure-device-90d: a right femoral case (the plug is in the right groin);
//   - dialysis-fistula: a right radial case in a patient on haemodialysis through a right forearm
//     fistula (creatinine at a dialysis level);
//   - dnacpr-unsuspended: an 82-year-old; pregnancy-test: a 34-year-old woman;
//   - every scenario sets the chart's 'Previous access' text, so the generated history cannot add a
//     second concern on the planned route (a weak radial pulse) or contradict the record.
// The anticoagulant, kidney and metformin scenarios are also listed under the table set-up lesson:
// they open at the chart, so Oxford's pre-puncture checklist is part of each case.
import type { ProcedureScenario } from "./index";

const ASSESS = "pm-planning-assessment";
const PREP = "pm-planning-preparation";
const CONSENT = "pm-planning-consent";
const TABLE = "pm-to-the-root-table";

/** Nothing carried that is not the scenario's own problem. */
const CLEAN = { anticoagulation: "none" as const, allergies: { contrast: "none" as const }, rhythm: "sinus" as const };
/** The chart's 'Previous access' with nothing on it. */
const NO_ACCESS_HISTORY = "No previous arterial access.";

export const scenarios: ProcedureScenario[] = [
  {
    id: "doac-recent",
    title: "Chart review: a recent anticoagulant dose",
    lessonIds: [ASSESS, PREP, TABLE],
    seed: "planning-doac",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, rhythm: "af", anticoagulation: "doac", doac: { agent: "rivaroxaban", hoursSinceDose: 18 } },
    chart: { history: NO_ACCESS_HISTORY },
  },
  {
    id: "warfarin-inr-unchecked",
    title: "Chart review: warfarin and the INR",
    lessonIds: [ASSESS, PREP, TABLE],
    seed: "planning-warfarin",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, rhythm: "af", anticoagulation: "warfarin" },
    chart: { anticoag: "Warfarin for atrial fibrillation; last INR 2.4, 6 days ago (anticoagulation clinic).", history: NO_ACCESS_HISTORY },
  },
  {
    id: "metformin-ckd",
    title: "Chart review: diabetes and the kidneys",
    lessonIds: [ASSESS, PREP, TABLE],
    seed: "planning-4",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, creatinineUmolL: 165 },
    chart: { history: NO_ACCESS_HISTORY },
  },
  {
    id: "contrast-allergy-unpremedicated",
    title: "Chart review: a previous contrast reaction",
    lessonIds: [PREP],
    seed: "planning-allergy",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, allergies: { contrast: "previous-severe" } },
    chart: { history: NO_ACCESS_HISTORY },
  },
  {
    id: "pde5-24h",
    title: "Chart review: the patient's own medicines",
    lessonIds: [PREP],
    seed: "planning-pde5-149",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, sex: "M", pde5: { agent: "sildenafil", hoursAgo: 14 } },
    chart: { history: NO_ACCESS_HISTORY },
  },
  {
    id: "closure-device-90d",
    title: "Chart review: the groin history",
    lessonIds: [ASSESS],
    seed: "planning-plug",
    access: "femoral",
    indication: "SA",
    profile: { ...CLEAN },
    chart: { history: "Previous right femoral coronary angiography, closed with a closure device (details in the pre-procedure record)." },
  },
  {
    id: "dialysis-fistula",
    title: "Chart review: the arms",
    lessonIds: [ASSESS],
    seed: "planning-fistula",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, creatinineUmolL: 650 },
    chart: { history: "No previous arterial access; right forearm arteriovenous fistula for haemodialysis." },
  },
  {
    id: "bloods-old",
    title: "Chart review: the blood results",
    lessonIds: [ASSESS],
    seed: "planning-bloods",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN },
    chart: { history: NO_ACCESS_HISTORY },
  },
  {
    id: "surgery-planned",
    title: "Chart review: can this patient have a stent?",
    lessonIds: [ASSESS],
    seed: "planning-surgery",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN },
    chart: { history: NO_ACCESS_HISTORY },
  },
  {
    id: "dnacpr-unsuspended",
    title: "Chart review: resuscitation status",
    lessonIds: [CONSENT],
    seed: "planning-dnacpr",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, ageY: 82 },
    chart: { history: NO_ACCESS_HISTORY },
  },
  {
    id: "pregnancy-test",
    title: "Chart review: a young woman before angiography",
    lessonIds: [ASSESS],
    seed: "planning-pregnancy",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, sex: "F", ageY: 34 },
    chart: { history: NO_ACCESS_HISTORY },
  },
  {
    id: "checklist",
    title: "Pre-puncture checklist",
    lessonIds: [TABLE],
    seed: "planning-checklist",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN },
    chart: { history: NO_ACCESS_HISTORY },
    start: "access",
  },
];
