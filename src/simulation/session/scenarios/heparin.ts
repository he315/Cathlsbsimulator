// The full case's hand-over to ad hoc PCI (proc-heparin-act-handover): heparin, the ACT and the
// contrast budget carried from the diagnostic study into the PCI. Each case opens with the diagnostic
// study done and the catheter in the aorta, and the hand-over gate open (CaseSession.openPciGate):
// the learner gives the PCI heparin dose, counting what went in at the access, measures the ACT and
// takes the case on only once it is at target (guided and supervised mode hold it there).
//
//   adhoc-heparin      heparin alone: 70-100 U/kg in all, ACT 250-300 s on the case's machine
//   adhoc-gpi-planned  a GP IIb/IIIa inhibitor is planned for a thrombotic lesion: 50-70 U/kg and
//                      an ACT of 200-250 s, so a full 100 U/kg on top of the access dose is too much
//   tissued-cannula    the IV cannula has tissued: an IV bolus never reaches the blood and the ACT
//                      barely moves; the cannula is swollen when looked at, and a redose through
//                      the sheath side arm reaches target
//   ckd-budget-adhoc   kidney disease with a CT two days ago: the contrast budget by the stricter
//                      rule of contrastBudget.ts, most of it used by the diagnostic study, goes to the
//                      PCI with what remains
// Doses and ACT goals are the module text's (SOURCED_PCI_HEPARIN and ACT_TARGETS_S, lesson
// pm-antithrombotics-heparin, 03-antithrombotics.ts:64-65 and 119-121). The scenario settings are
// MODEL PARAMETERS (docs/realism/facts/pkg-proc-heparin-act-handover.md): the fixed seeds; a body
// weight of 95 kg in the heparin cases, so that the 5000 U access dose (SOURCED_DOSES.radialHeparinU)
// leaves the ACT short of the PCI target; the kidney case's creatinine (eGFR about 25), the 40 mL CT
// two days earlier and the 48 mL diagnostic study.
//
// Lessons: the three heparin cases are listed under the heparin lesson and under the kidney and
// contrast budget lessons (the gate carries the contrast used and the budget left into the PCI); the
// kidney case under the kidney and contrast budget lessons.
//
// `raises` is what the hand-over gate reports for the tips: the PCI plan with 'low-act' (an ACT
// below target at the gate) and 'high-contrast-volume' (contrast over the case's budget at the gate
// or on the return from PCI), and the PCI finish with 'high-contrast-volume'. The reachability report
// (src/content/lab/reachability.test.ts) does not glob session/scenarios/*.ts, so it reads this
// declaration only once a session module or a widened glob carries it.
import type { ProcedureScenario } from "./index";
import type { CaseSession } from "../caseSession";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import { contrastBudget } from "../../patient/contrastBudget";

const HEPARIN = "pm-antithrombotics-heparin";
const KIDNEY = "cm-patient-complications-kidney";
const BUDGET = "cm-patient-complications-contrast-budget";

const CLEAN = { allergies: { contrast: "none" as const } };
const NO_ACCESS_HISTORY = "No previous arterial access.";
const PCI_CONSENT = "Signed for coronary angiography and PCI.";

/** The weight of the heparin cases, kg (MODEL PARAMETER: the access dose falls short of 70 U/kg and of the ACT target). */
export const HEPARIN_CASE_WEIGHT_KG = 95;
/** The kidney case: creatinine (µmol/L), the CT two days before (mL) and the diagnostic study's contrast (mL); MODEL PARAMETERS. */
export const CKD_CASE = { creatinineUmolL: 200, weightKg: 72, ctMl: 40, ctDaysAgo: 2, diagnosticMl: 48 };

/** Open the hand-over gate once the diagnostic study is done. */
const atGate = (s: CaseSession) => {
  s.openPciGate();
};

export const scenarios: ProcedureScenario[] = [
  {
    id: "adhoc-heparin",
    title: "Hand-over to PCI: the heparin dose and the ACT",
    lessonIds: [HEPARIN, KIDNEY, BUDGET],
    seed: "heparin-adhoc-heparin-1",
    access: "radial-right",
    indication: "SA",
    start: "post-diagnostic",
    profile: { ...CLEAN, weightKg: HEPARIN_CASE_WEIGHT_KG, rhythm: "sinus", anticoagulation: "none", lvef: 60, creatinineUmolL: 85 },
    chart: { history: NO_ACCESS_HISTORY, "consent-form": PCI_CONSENT },
    state: (s) => {
      s.setIvLine("patent");
      atGate(s);
    },
  },
  {
    id: "adhoc-gpi-planned",
    title: "Hand-over to PCI: heparin with a GP IIb/IIIa inhibitor planned",
    lessonIds: [HEPARIN, KIDNEY, BUDGET],
    seed: "heparin-adhoc-gpi-planned-1",
    access: "radial-right",
    indication: "NSTEMI",
    start: "post-diagnostic",
    profile: { ...CLEAN, weightKg: HEPARIN_CASE_WEIGHT_KG, rhythm: "sinus", anticoagulation: "none", lvef: 50, creatinineUmolL: 85 },
    chart: {
      history: NO_ACCESS_HISTORY,
      "consent-form": PCI_CONSENT,
      anticoag: "No oral anticoagulant. Plan agreed with the attending: a GP IIb/IIIa inhibitor (eptifibatide) during the PCI for the thrombus seen on the diagnostic study.",
    },
    state: (s) => {
      s.setIvLine("patent");
      s.planIvAntiplatelet(true);
      atGate(s);
    },
  },
  {
    id: "tissued-cannula",
    title: "Hand-over to PCI: the ACT that will not rise",
    lessonIds: [HEPARIN, KIDNEY, BUDGET],
    seed: "heparin-tissued-cannula-7",
    access: "radial-right",
    indication: "SA",
    start: "post-diagnostic",
    profile: { ...CLEAN, weightKg: HEPARIN_CASE_WEIGHT_KG, rhythm: "sinus", anticoagulation: "none", lvef: 60, creatinineUmolL: 85 },
    chart: { history: NO_ACCESS_HISTORY, "consent-form": PCI_CONSENT },
    state: (s) => {
      s.setIvLine("tissued");
      atGate(s);
    },
  },
  {
    id: "ckd-budget-adhoc",
    title: "Hand-over to PCI: kidney disease and a contrast budget",
    lessonIds: [KIDNEY, BUDGET],
    seed: "heparin-ckd-budget-adhoc-1",
    access: "radial-right",
    indication: "SA",
    start: "post-diagnostic",
    profile: {
      ...CLEAN,
      weightKg: CKD_CASE.weightKg,
      rhythm: "sinus",
      anticoagulation: "none",
      lvef: 55,
      creatinineUmolL: CKD_CASE.creatinineUmolL,
      recentContrast: [{ ml: CKD_CASE.ctMl, daysAgo: CKD_CASE.ctDaysAgo }],
    },
    chart: { history: `CT coronary angiogram ${CKD_CASE.ctDaysAgo} days ago (${CKD_CASE.ctMl} mL of contrast). ${NO_ACCESS_HISTORY}`, "consent-form": PCI_CONSENT },
    state: (s) => {
      s.setIvLine("patent");
      // the diagnostic study's contrast, and the case's budget by the stricter rule, counting the CT
      // (rounded down, so the case's budget never exceeds the rule's ceiling)
      s.patient.contrast(CKD_CASE.diagnosticMl, "root");
      const p = s.profile;
      s.contrastBudgetMl = Math.floor(contrastBudget({ egfr: p.renal.egfr, crclMlMin: p.renal.crclMlMin, weightKg: p.weightKg, recent: p.recentContrast }).ceilingMl);
      atGate(s);
    },
  },
];

/** What the hand-over gate reports for the tips (see the header). */
export const raises: readonly LabRaises[] = [
  { lab: "pci", phases: ["plan", "finish"], events: ["low-act", "high-contrast-volume"] },
];
