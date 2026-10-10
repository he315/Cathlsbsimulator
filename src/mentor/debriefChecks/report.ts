// ---------------------------------------------------------------------------
// The study report's debrief check (diag-study-report): the gaps of the
// finish step's report against the case truth, when the learner submitted one
// (DebriefInput.report.study): a missed territory (including an anomalous
// circumflex assigned to the left injection), a graft not accounted for, spasm
// reported as fixed disease, a finding read from a non-diagnostic run, the MI
// classification, and ad hoc PCI in stable disease despite Brilakis's reasons
// to defer (unprotected left main, CTO, multivessel disease, consent). The
// rules and their sources live with the report model in src/mentor/report.ts.
// ---------------------------------------------------------------------------

import type { CheckGap, DebriefInput } from "../debrief";
import { studyReportGaps } from "../report";

export const id = "study-report";
export const order = 200;

export function check(input: DebriefInput): CheckGap[] {
  return studyReportGaps(input.report);
}
