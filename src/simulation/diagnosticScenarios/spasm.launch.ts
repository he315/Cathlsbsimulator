// Engine-free launch metadata for the scenarios of spasm.ts (diag-spasm-states, with found-launch-links):
// the lessons each one practises. The ids, titles and lessons must match spasm.ts (scenarios.test.ts
// checks). diag-focal-rca-spasm is defined in lesions.ts (heldScenarios) and published by this pack.
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-catheter-tip-spasm-rca", title: "Catheter-tip spasm in a small RCA", lessonIds: ["pm-interpreting-spasm", "pm-acquiring-test-nitrate", "pm-acquiring-anatomy"] },
    { id: "diag-focal-rca-spasm", title: "A focal narrowing that may be spasm", lessonIds: ["pm-acquiring-test-nitrate", "pm-acquiring-anatomy"] },
    { id: "diag-focal-rca-fixed", title: "A focal mid-RCA narrowing in rest angina", lessonIds: ["pm-acquiring-test-nitrate", "pm-interpreting-spasm"] },
    { id: "diag-ostial-lesion-or-spasm", title: "Ostial RCA narrowing: lesion or catheter-tip spasm?", lessonIds: ["cp-ostial-assess", "pm-interpreting-spasm"] },
    { id: "diag-radial-spasm-entrapment", title: "The catheter that will not come back: radial spasm", lessonIds: ["pm-engaging-spasm"] },
    { id: "diag-ohca-vasopressor-radial", title: "On noradrenaline after an arrest: the radial will spasm", lessonIds: ["cp-complex-patients-ohca"] },
  ],
};
