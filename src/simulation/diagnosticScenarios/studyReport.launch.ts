// Engine-free launch metadata for the scenarios of studyReport.ts (diag-study-report): the lessons each
// one practises. The ids, titles and lessons must match studyReport.ts (scenarios.test.ts checks). The
// further lessons these scenarios are linked from (pm-acquiring-anatomy, pm-interpreting-anomalies and
// pm-interpreting-pitfalls) are added by src/content/practice/diag-study-report.launch.ts.
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-territory-check-anomalous-cx", title: "Every wall accounted for before the catheter comes out", lessonIds: ["pm-interpreting-pitfalls"] },
    { id: "diag-beyond-consent-lm", title: "Left main disease the consent did not cover", lessonIds: ["pm-planning-consent", "pm-target-timing"] },
    { id: "diag-cto-plan-not-adhoc", title: "A chronic occlusion: plan it, do not treat it ad hoc", lessonIds: ["cp-cto-strategy-selection", "pm-target-timing"] },
    { id: "diag-minoca-classify", title: "Troponin positive, arteries non-obstructive: classify it", lessonIds: ["hb-background-mi"] },
  ],
};
