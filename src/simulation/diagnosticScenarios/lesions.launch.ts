// Engine-free launch metadata for the scenarios of lesions.ts (diag-lesion-morphologies, with
// found-launch-links): the lessons each one practises. The ids, titles and lessons must match
// lesions.ts (scenarios.test.ts checks). diag-focal-rca-spasm is held back until the live lab passes
// the nitrate effect to the scene (see heldScenarios in lesions.ts).
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-eccentric-orthogonal", title: "An eccentric lesion in orthogonal views", lessonIds: ["pm-interpreting-stenosis"] },
    { id: "diag-tapering-reference", title: "A narrowing in a tapering vessel", lessonIds: ["pm-interpreting-stenosis"] },
    { id: "diag-lesion-at-branch", title: "A narrowing at a large diagonal", lessonIds: ["pm-interpreting-stenosis"] },
    { id: "diag-cto-contralateral-collaterals", title: "A chronic occlusion filling from the other side", lessonIds: ["cp-cto-strategy-selection", "pm-interpreting-collaterals"] },
    { id: "diag-scad-types", title: "Name the SCAD type", lessonIds: ["cp-other-complex-scad"] },
    { id: "diag-two-candidate-culprits", title: "Two occlusions: which is the culprit?", lessonIds: ["pm-interpreting-flow", "pm-interpreting-collaterals"] },
  ],
};
