// Launch metadata for the full case's ad hoc or delayed PCI decision (proc-adhoc-gate; engine-free:
// types only). The ids, titles and lessons are those of scenarios/adhoc.ts. Each opens with the
// diagnostic study done and the decision gate open. All are listed under the timing lesson
// (pm-target-timing); the left main and three-vessel cases also under the heart team lesson, and the
// diagnostic-only consent case under the consent lesson. No mode is set: the learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const TIMING = "pm-target-timing";
const HEART_TEAM = "pm-target-heart-team";
const CONSENT = "pm-planning-consent";
const AT_GATE = [{ id: "post-diagnostic", title: "Diagnostic study done: ad hoc or delayed PCI" }];

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "adhoc-left-main-stable", title: "Ad hoc or delayed PCI: left main disease in stable angina", lessonIds: [TIMING, HEART_TEAM], starts: AT_GATE },
    { id: "adhoc-cto-stable", title: "Ad hoc or delayed PCI: a chronic total occlusion in stable angina", lessonIds: [TIMING], starts: AT_GATE },
    { id: "adhoc-mvd-stable", title: "Ad hoc or delayed PCI: three-vessel disease in stable angina", lessonIds: [TIMING, HEART_TEAM], starts: AT_GATE },
    { id: "adhoc-acs-ongoing", title: "Ad hoc or delayed PCI: anterior STEMI with ongoing pain", lessonIds: [TIMING], starts: AT_GATE },
    { id: "adhoc-consent-diagnostic-only", title: "Ad hoc or delayed PCI: consent for the diagnostic study only", lessonIds: [TIMING, CONSENT], starts: AT_GATE },
    { id: "adhoc-complication", title: "Ad hoc or delayed PCI: after a complication of the diagnostic study", lessonIds: [TIMING], starts: AT_GATE },
    { id: "adhoc-late-evening-stemi-call", title: "Ad hoc or delayed PCI: late in the evening, a STEMI call", lessonIds: [TIMING], starts: AT_GATE },
  ],
};
