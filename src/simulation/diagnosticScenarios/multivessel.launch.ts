// Engine-free launch metadata for the scenarios of multivessel.ts (angio-decision-drills): stable cases
// whose study report is followed by the revascularisation decision step, listed under the lessons that
// teach that decision. The ids, titles and lessons must match multivessel.ts (scenarios.test.ts checks).
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-mvd-diabetes-fit", title: "Three vessels and diabetes: decide the revascularisation", lessonIds: ["pm-target-heart-team", "pm-target-ccs-why"] },
    { id: "diag-mvd-two-vessel-heart-team", title: "Two vessels, no diabetes: PCI or CABG?", lessonIds: ["pm-target-heart-team", "pm-target-ccs-why"] },
    { id: "diag-mvd-diabetes-frail", title: "Three vessels, diabetes and a high surgical risk", lessonIds: ["pm-target-heart-team", "pm-target-ccs-why"] },
    { id: "diag-svd-asymptomatic-small-territory", title: "One vessel, no symptoms, a small ischaemic territory", lessonIds: ["pm-target-ccs-why"] },
  ],
};
