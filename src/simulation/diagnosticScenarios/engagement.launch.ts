// Engine-free launch metadata for the scenarios of engagement.ts (diag-engagement-technique-set, with
// found-launch-links): the lessons each one practises. The ids, titles and lessons must match engagement.ts
// (scenarios.test.ts checks).
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-lm-fold-small-root", title: "The left main over a looped wire", lessonIds: ["pm-engaging-left"] },
    { id: "diag-radial-left-set", title: "The left coronary from the right radial", lessonIds: ["pm-engaging-left", "pm-interpreting-pitfalls"] },
    { id: "diag-rca-set", title: "The right coronary: dives, the conus and the ostium", lessonIds: ["pm-engaging-rca", "pm-interpreting-pitfalls"] },
    { id: "diag-engage-fail-ladder", title: "When the catheter will not engage", lessonIds: ["pm-engaging-fail"] },
    { id: "diag-lm-damping-causes", title: "A damped trace at the left main", lessonIds: ["cp-left-main-assess", "pm-engaging-damping", "cp-ostial-assess", "pm-interpreting-pitfalls"] },
    { id: "diag-catheter-choice-by-root", title: "Choosing catheters for the route and the root", lessonIds: ["pm-to-the-root-choice"] },
  ],
};
