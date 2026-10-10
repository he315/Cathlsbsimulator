// Engine-free launch metadata for the scenarios of anatomy.ts (diag-anatomy-variants, with
// found-launch-links): the lessons each one practises. The ids, titles and lessons must match
// anatomy.ts (scenarios.test.ts checks).
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-anomalous-cx-retroaortic", title: "No vessel to the lateral wall", lessonIds: ["pm-interpreting-anomalies", "pm-engaging-left"] },
    { id: "diag-rca-from-left-sinus", title: "The RCA that is not in the right sinus", lessonIds: ["pm-interpreting-anomalies", "pm-engaging-rca", "pm-engaging-fail"] },
    { id: "diag-lm-from-right-sinus", title: "No left coronary in the left sinus", lessonIds: ["pm-interpreting-anomalies", "pm-engaging-left", "pm-engaging-fail"] },
    { id: "diag-high-ostia", title: "Ostia that are not where the catheters look", lessonIds: ["pm-engaging-fail", "pm-engaging-left", "pm-interpreting-anomalies"] },
    { id: "diag-separate-conus", title: "A damped trace at the RCA ostium", lessonIds: ["pm-engaging-rca"] },
    { id: "diag-bridge-lad", title: "A narrowing that comes and goes", lessonIds: ["pm-interpreting-anomalies"] },
    { id: "diag-fistula-pa", title: "A vessel that drains into the pulmonary artery", lessonIds: ["pm-interpreting-anomalies"] },
    { id: "diag-very-dilated-root-telescope", title: "A left main out of reach in a very large root", lessonIds: ["pm-engaging-fail", "pm-engaging-left"] },
  ],
};
