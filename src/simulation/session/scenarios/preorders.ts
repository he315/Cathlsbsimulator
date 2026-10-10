// The full case's pre-procedure order sheet scenarios (proc-preprocedure-orders). Each is a fixed
// patient whose case facts are PREORDER_CASES in ../preorders.ts (indication of the anticoagulant,
// presentation, the antiplatelet screen, the kidney medicines); the session module 'preorders'
// (modules/preorders.ts) opens the order sheet for it, scores the orders and plays their
// consequences. Every case opens at the chart: the orders are written before the time-out.
//
// Scenario settings, all MODEL PARAMETERS (docs/realism/facts/pkg-proc-preprocedure-orders.md):
//   - fixed seeds, chosen so that the planning module's one planted problem of the pre-procedure
//     record is a chart-only one (out-of-date bloods, or a do-not-resuscitate order not discussed)
//     that does not touch the anticoagulant, the antiplatelets or the kidney orders;
//   - no contrast reaction, and 'No previous arterial access', so the chart holds nothing else;
//   - the DOAC case's last dose is 72 h before arrival with the matching residual effect (the
//     formulary's DOAC half-life, doacEffectAfter): the sheet's plan then sets what is on board;
//   - the warfarin cases' INR today: 2.9 (mechanical valve), 2.6 (rheumatic mitral), 2.4 (LV
//     thrombus), 3.4 (the high INR case, planned femoral so the access decision is live);
//   - creatinine set for an eGFR of 28 in the two kidney cases; LVEF 30% in ckd-low-ef, 35% with
//     the LV thrombus, otherwise 45-60%.
// Lessons: the three anticoagulant cases booked for PCI are listed under the anticoagulant lesson
// and also under the antiplatelet and kidney lessons, because their sheet turns on clopidogrel with
// an anticoagulant and the contrast ceiling as well; the other anticoagulant cases under the
// anticoagulant lesson; the antiplatelet cases under the antiplatelet lesson; the kidney cases under
// the kidney and contrast budget lessons.
import type { ProcedureScenario } from "./index";
import { doacEffectAfter } from "../preorders";

const OAC = "pm-antithrombotics-oac";
const ORAL = "pm-antithrombotics-oral";
const KIDNEY = "cm-patient-complications-kidney";
const BUDGET = "cm-patient-complications-contrast-budget";

const CLEAN = { allergies: { contrast: "none" as const } };
const NO_ACCESS_HISTORY = "No previous arterial access.";
const PCI_CONSENT = "Signed for coronary angiography and PCI.";
const PLAN = "The peri-procedure plan is on the order sheet.";

export const scenarios: ProcedureScenario[] = [
  {
    id: "oac-af-low-risk",
    title: "Orders: apixaban for atrial fibrillation before PCI",
    lessonIds: [OAC, ORAL, KIDNEY],
    seed: "preorders-oac-af-low-risk-0",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, rhythm: "af", anticoagulation: "doac", doac: { agent: "apixaban", hoursSinceDose: 72, effect: doacEffectAfter(72) }, lvef: 60, creatinineUmolL: 85 },
    chart: { anticoag: `Apixaban 5 mg twice daily for atrial fibrillation (normal LV function, no previous stroke). ${PLAN}`, history: NO_ACCESS_HISTORY, "consent-form": PCI_CONSENT },
  },
  {
    id: "oac-mechanical-valve",
    title: "Orders: warfarin and a mechanical valve before PCI",
    lessonIds: [OAC, ORAL, KIDNEY],
    seed: "preorders-oac-mechanical-valve-6",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, rhythm: "sinus", anticoagulation: "warfarin", lvef: 55, creatinineUmolL: 90 },
    chart: { anticoag: `Warfarin for a mechanical mitral valve replacement (target INR 2.5-3.5); INR today 2.9. ${PLAN}`, history: NO_ACCESS_HISTORY, "consent-form": PCI_CONSENT },
  },
  {
    id: "oac-rheumatic-mitral",
    title: "Orders: warfarin for rheumatic mitral disease",
    lessonIds: [OAC, ORAL, KIDNEY],
    seed: "preorders-oac-rheumatic-mitral-9",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, rhythm: "af", anticoagulation: "warfarin", lvef: 55, creatinineUmolL: 80 },
    chart: { anticoag: `Warfarin for rheumatic mitral stenosis with atrial fibrillation; INR today 2.6. ${PLAN}`, history: NO_ACCESS_HISTORY, "consent-form": PCI_CONSENT },
  },
  {
    id: "oac-lv-thrombus",
    title: "Orders: warfarin for an LV thrombus",
    lessonIds: [OAC],
    seed: "preorders-oac-lv-thrombus-2",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, rhythm: "sinus", anticoagulation: "warfarin", lvef: 35, creatinineUmolL: 85 },
    chart: { anticoag: `Warfarin for a mobile, protruding LV apical thrombus after an anterior infarct 8 weeks ago; INR today 2.4. ${PLAN}`, history: NO_ACCESS_HISTORY },
  },
  {
    id: "warfarin-inr-high",
    title: "Orders: warfarin with an INR of 3.4",
    lessonIds: [OAC],
    seed: "preorders-warfarin-inr-high-5",
    access: "femoral",
    indication: "SA",
    profile: { ...CLEAN, rhythm: "af", anticoagulation: "warfarin", lvef: 60, creatinineUmolL: 85 },
    chart: { anticoag: `Warfarin for atrial fibrillation (normal LV function, no previous stroke); INR today 3.4. ${PLAN}`, history: NO_ACCESS_HISTORY },
  },
  {
    id: "elective-pci-preload",
    title: "Orders: antiplatelets before planned PCI",
    lessonIds: [ORAL],
    seed: "preorders-elective-pci-preload-2",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, rhythm: "sinus", anticoagulation: "none", lvef: 60, creatinineUmolL: 80 },
    chart: { history: NO_ACCESS_HISTORY, "consent-form": PCI_CONSENT },
  },
  {
    id: "nste-early-angio",
    title: "Orders: NSTEMI before early angiography",
    lessonIds: [ORAL],
    seed: "preorders-nste-early-angio-7",
    access: "radial-right",
    indication: "NSTEMI",
    profile: { ...CLEAN, rhythm: "sinus", anticoagulation: "none", lvef: 50, creatinineUmolL: 85 },
    chart: { history: NO_ACCESS_HISTORY },
  },
  {
    id: "stemi-opioids",
    title: "Orders: STEMI after morphine",
    lessonIds: [ORAL],
    seed: "preorders-stemi-opioids-15",
    access: "radial-right",
    indication: "STEMI",
    profile: { ...CLEAN, rhythm: "sinus", anticoagulation: "none", lvef: 45, creatinineUmolL: 85 },
    chart: { history: NO_ACCESS_HISTORY },
  },
  {
    id: "ckd-egfr-28-metformin-nsaid",
    title: "Orders: diabetes, metformin and an eGFR of 28",
    lessonIds: [KIDNEY, BUDGET],
    seed: "preorders-ckd-egfr-28-metformin-nsaid-0",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, rhythm: "sinus", anticoagulation: "none", lvef: 55, creatinineUmolL: 215 },
    chart: { history: NO_ACCESS_HISTORY },
  },
  {
    id: "ckd-low-ef",
    title: "Orders: kidney disease and a weak ventricle",
    lessonIds: [KIDNEY, BUDGET],
    seed: "preorders-ckd-low-ef-6",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, rhythm: "sinus", anticoagulation: "none", lvef: 30, creatinineUmolL: 180 },
    chart: { history: NO_ACCESS_HISTORY },
  },
];
