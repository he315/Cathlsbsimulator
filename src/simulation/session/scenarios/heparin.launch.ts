// Launch metadata for the full case's hand-over to ad hoc PCI (proc-heparin-act-handover; engine-free:
// types only). The ids, titles and lessons are those of scenarios/heparin.ts. Each opens with the
// diagnostic study done and the hand-over gate open, so the lessons list that start. The three heparin
// cases are listed under the heparin lesson, and also under the kidney and contrast budget lessons
// because the gate carries the contrast used and the budget left into the PCI; the kidney case is
// listed under the kidney and contrast budget lessons. No mode is set: the learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const HEPARIN = "pm-antithrombotics-heparin";
const KIDNEY = "cm-patient-complications-kidney";
const BUDGET = "cm-patient-complications-contrast-budget";
const AT_GATE = [{ id: "post-diagnostic", title: "Diagnostic study done: hand-over to PCI" }];

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "adhoc-heparin", title: "Hand-over to PCI: the heparin dose and the ACT", lessonIds: [HEPARIN, KIDNEY, BUDGET], starts: AT_GATE },
    { id: "adhoc-gpi-planned", title: "Hand-over to PCI: heparin with a GP IIb/IIIa inhibitor planned", lessonIds: [HEPARIN, KIDNEY, BUDGET], starts: AT_GATE },
    { id: "tissued-cannula", title: "Hand-over to PCI: the ACT that will not rise", lessonIds: [HEPARIN, KIDNEY, BUDGET], starts: AT_GATE },
    { id: "ckd-budget-adhoc", title: "Hand-over to PCI: kidney disease and a contrast budget", lessonIds: [KIDNEY, BUDGET], starts: AT_GATE },
  ],
};
