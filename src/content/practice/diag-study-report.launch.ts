// Engine-free practice links of diag-study-report (found-launch-links): cath lab scenarios whose
// finish step (the study report: every territory accounted for, the findings, and the decision
// between no PCI, ad hoc PCI, the heart team and a staged procedure) practises a lesson. This file
// adds links only, under lessons the scenarios' own .launch.ts files do not list.
//   - diag-territory-check-anomalous-cx (src/simulation/diagnosticScenarios/studyReport.ts): the
//     lateral wall is empty on the left injection; the finish step's territory check finds the
//     anomalous circumflex (the anatomy lesson's territory check, the anomalies lesson's search).
//   - diag-beyond-consent-lm (studyReport.ts): the left main has to be shown with the tip not deep
//     (a lesion behind the tip is never opacified: the pitfalls lesson).
//   - diag-cto-plan-not-adhoc (studyReport.ts): the inferior wall is accounted for only by the
//     collaterals filling it (an empty territory is the pitfalls lesson's).
//   - diag-graft-search (src/simulation/diagnosticScenarios/core.ts): two native occlusions and three
//     grafts, one of them occluded; every wall has to be accounted for by a graft, collaterals or the
//     native artery (missed territories and competitive graft flow are the pitfalls lesson's).
import type { LaunchFile } from "../schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  links: [
    { scenario: "diag-territory-check-anomalous-cx", lessonIds: ["pm-acquiring-anatomy", "pm-interpreting-anomalies"] },
    { scenario: "diag-beyond-consent-lm", lessonIds: ["pm-interpreting-pitfalls"] },
    { scenario: "diag-cto-plan-not-adhoc", lessonIds: ["pm-interpreting-pitfalls"] },
    { scenario: "diag-graft-search", title: "Account for every territory after bypass surgery", lessonIds: ["pm-interpreting-pitfalls"] },
  ],
};
