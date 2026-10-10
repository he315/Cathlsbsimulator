// Engine-free practice links of diag-qca-measurement (found-launch-links): the lesion morphology
// scenarios (src/simulation/diagnosticScenarios/lesions.ts, declared in lesions.launch.ts) practised
// as QCA on the reference monitor: calibrate on the catheter, mark normal to normal, read both
// references and their average, name the segment and report the measurement with its view; the
// debrief compares the report with the model's projected stenosis in that view
// (src/mentor/debriefChecks/qca.ts). The scenarios' own file lists them in guided practice; these
// links open them in supervised practice, where the foreshortening warning (a guided teaching aid) is
// not shown and the debrief alone judges the frame and the view.
//   - diag-eccentric-orthogonal: an eccentric lumen that grades differently in orthogonal views;
//     the worse, least foreshortened view is the one to report.
//   - diag-tapering-reference: a tapering vessel where the proximal reference alone overstates the
//     stenosis and the average of both references does not.
//   - diag-lesion-at-branch: a lesion at a large diagonal, where the reference changes across the
//     bifurcation.
import type { LaunchFile } from "../schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  links: [
    { scenario: "diag-eccentric-orthogonal", mode: "supervised", title: "QCA: an eccentric lesion in orthogonal views", lessonIds: ["pm-interpreting-stenosis"] },
    { scenario: "diag-tapering-reference", mode: "supervised", title: "QCA: both references in a tapering vessel", lessonIds: ["pm-interpreting-stenosis"] },
    { scenario: "diag-lesion-at-branch", mode: "supervised", title: "QCA: a narrowing at a large diagonal", lessonIds: ["pm-interpreting-stenosis"] },
  ],
};
