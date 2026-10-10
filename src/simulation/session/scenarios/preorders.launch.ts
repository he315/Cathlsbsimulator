// Launch metadata for the full case's pre-procedure order sheet scenarios (engine-free: types only).
// The ids, titles and lessons are those of scenarios/preorders.ts: the three anticoagulant cases
// booked for PCI under the anticoagulant, antiplatelet and kidney lessons (their sheet turns on all
// three), the other anticoagulant cases under the anticoagulant lesson, the antiplatelet cases under
// the antiplatelet lesson and the kidney cases under the kidney and contrast budget lessons. Each
// opens at the chart, where the orders are written. No mode is set: the learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const OAC = "pm-antithrombotics-oac";
const ORAL = "pm-antithrombotics-oral";
const KIDNEY = "cm-patient-complications-kidney";
const BUDGET = "cm-patient-complications-contrast-budget";

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "oac-af-low-risk", title: "Orders: apixaban for atrial fibrillation before PCI", lessonIds: [OAC, ORAL, KIDNEY] },
    { id: "oac-mechanical-valve", title: "Orders: warfarin and a mechanical valve before PCI", lessonIds: [OAC, ORAL, KIDNEY] },
    { id: "oac-rheumatic-mitral", title: "Orders: warfarin for rheumatic mitral disease", lessonIds: [OAC, ORAL, KIDNEY] },
    { id: "oac-lv-thrombus", title: "Orders: warfarin for an LV thrombus", lessonIds: [OAC] },
    { id: "warfarin-inr-high", title: "Orders: warfarin with an INR of 3.4", lessonIds: [OAC] },
    { id: "elective-pci-preload", title: "Orders: antiplatelets before planned PCI", lessonIds: [ORAL] },
    { id: "nste-early-angio", title: "Orders: NSTEMI before early angiography", lessonIds: [ORAL] },
    { id: "stemi-opioids", title: "Orders: STEMI after morphine", lessonIds: [ORAL] },
    { id: "ckd-egfr-28-metformin-nsaid", title: "Orders: diabetes, metformin and an eGFR of 28", lessonIds: [KIDNEY, BUDGET] },
    { id: "ckd-low-ef", title: "Orders: kidney disease and a weak ventricle", lessonIds: [KIDNEY, BUDGET] },
  ],
};
