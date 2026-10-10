// ---------------------------------------------------------------------------
// The diagnostic lab's QCA debrief check (diag-qca-measurement): the learner's
// reported QCA measurements (the reference monitor's 'Report this
// measurement', src/simulation/imaging/qca.ts qcaReportsFor) against the
// model's projected %DS of the lesion in the worse, least foreshortened stored
// view (the view the lesson says to report). A report passes when its frame
// does not foreshorten the segment, its %DS (on the average of the proximal
// and distal references) lies within QCA_REPORT_TOLERANCE_PCT of the model's
// value in the worse view, and the worse view does not show the lesion tighter
// than the reported view by more than the tolerance. A lesion measured in fewer
// than two views that lay it out gets its own gap. The gaps name
// the worse, least foreshortened view and the model's value in it: this is the
// first place the model's value appears.
//
// Rules (pm-interpreting-stenosis, the stenosis lesson, after Oxford ch 6 and
// Brilakis 6.8): two orthogonal views, least foreshortening, report the view in
// which the lesion looks worse; a foreshortened view makes the lesion look
// shorter and tighter; %DS on the average of the two references.
// ---------------------------------------------------------------------------

import type { CheckGap, DebriefInput } from "../debrief";
import { QCA_FORESHORTENED_BELOW, QCA_REPORT_TOLERANCE_PCT, isForeshortened, qcaReportsFor, qcaVerdicts, type QcaReport, type QcaVerdict } from "../../simulation/imaging/qca";
import { segmentName } from "../coverage";

export const id = "qca";
export const order = 210;

const LESSON = "pm-interpreting-stenosis";
const pct = (x: number) => `${Math.round(x)}%`;
const runText = (run: number, view: string) => `run ${run} (${view.replace(/\s+/g, " ")})`;
const segText = (s: string) => `segment ${s} (${segmentName(s)})`;

/** The gaps of a set of reports (pure; the check reads the reports of the record's case and session). */
export function qcaGaps(reports: readonly QcaReport[]): CheckGap[] {
  const out: CheckGap[] = [];
  for (const v of qcaVerdicts(reports)) out.push(...gapsOf(v));
  return out;
}

function gapsOf(v: QcaVerdict): CheckGap[] {
  const r = v.report;
  const key = v.lesionIndex !== null ? `l${v.lesionIndex}` : `s${v.segment}`;
  const where = runText(r.run, r.view);
  const worse = v.worse ? `${runText(v.worse.run, v.worse.view)}, where the model's projected stenosis is ${pct(v.worse.pctDS!)}` : null;
  const out: CheckGap[] = [];
  if (v.lesionIndex === null) {
    out.push({
      id: `qca-no-lesion-${key}`,
      title: "QCA reported for a segment without the lesion",
      severity: "technique",
      tWall: r.tWall,
      directive: "Name the segment from the anatomy before you report.",
      teaching: `Your QCA of ${pct(r.dsPct)} was reported for ${segText(r.segment)}, where the model has no narrowing. Name the segment from the anatomy before you report, so the number goes with the right lesion.`,
      lessonId: LESSON,
    });
    return out;
  }
  if (v.foreshortened) {
    out.push({
      id: `qca-foreshortened-${key}`,
      title: "QCA reported from a foreshortened frame",
      severity: "technique",
      tWall: r.tWall,
      directive: "Measure in the view that lays the segment out longest.",
      teaching: `In ${where} ${segText(r.segment)} is shown at ${Math.round((r.foreshortening ?? 0) * 100)}% of its length (below ${Math.round(QCA_FORESHORTENED_BELOW * 100)}%). A foreshortened lesion looks shorter and tighter, so its length and stenosis cannot be trusted.${worse ? ` The worse view that lays it out was ${worse}.` : " No stored view laid the segment out: film it in one that does."}`,
      lessonId: LESSON,
      takeHome: "Next time I will measure in the view that lays the segment out longest.",
    });
  }
  if (v.milderView && worse) {
    out.push({
      id: `qca-milder-view-${key}`,
      title: "QCA reported from the milder view",
      severity: "technique",
      tWall: r.tWall,
      directive: "Report the stenosis from the worse of two orthogonal views.",
      teaching: `You reported ${pct(r.dsPct)} from ${where}, where the model's projected stenosis is ${pct(v.truePct!)}. The lesion looks worse in ${worse}. An eccentric lumen looks mild from one side: grade it in two orthogonal views and report the worse.`,
      lessonId: LESSON,
      takeHome: "Next time I will measure the lesion in both orthogonal views and report the worse.",
    });
  }
  // the milder-view gap already names the worse view and its value: no second gap for the same report
  if (!v.foreshortened && !v.milderView && !v.withinTolerance && v.errorPct !== null && v.targetPct !== null) {
    const target =
      v.targetRun !== r.run && v.worse ? `the model's projected stenosis in the worse view, ${runText(v.worse.run, v.worse.view)}, is ${pct(v.targetPct)}` : `the model's projected stenosis in that view is ${pct(v.targetPct)}`;
    out.push({
      id: `qca-accuracy-${key}`,
      title: v.errorPct > 0 ? "QCA overstated the stenosis" : "QCA understated the stenosis",
      severity: "efficiency",
      tWall: r.tWall,
      directive: "Calibrate on straight catheter and mark normal to normal on both sides.",
      teaching: `You reported ${pct(r.dsPct)} in ${where}; ${target}, ${Math.round(Math.abs(v.errorPct))} points ${v.errorPct > 0 ? "lower" : "higher"} (the tolerance is ${QCA_REPORT_TOLERANCE_PCT}). Calibrate on a straight, unforeshortened length of catheter, and mark from normal segment to normal segment on both sides so the average reference is a true one (proximal ${r.refProxMm.toFixed(2)} mm, distal ${r.refDistMm.toFixed(2)} mm in your measurement).`,
      lessonId: LESSON,
    });
  }
  // the lesion measured in fewer than two views that lay it out (the lesson: run QCA in two orthogonal views)
  if (v.oneView) {
    const measured = v.measuredAdequateRuns.map((n) => v.views.find((x) => x.run === n)!).filter(Boolean);
    const unmeasured = v.views.filter((x) => x.pctDS !== null && !isForeshortened(x.foreshortening) && !v.measuredRuns.includes(x.run));
    out.push({
      id: `qca-one-view-${key}`,
      title: "The lesion measured without a second view",
      severity: "efficiency",
      tWall: r.tWall,
      directive: "Run QCA on every lesion in two views.",
      teaching: `You measured ${segText(r.segment)} in ${measured.length === 1 ? `only ${runText(measured[0].run, measured[0].view)}` : "no view"} that lays it out without foreshortening${unmeasured.length ? `; ${unmeasured.map((x) => runText(x.run, x.view)).join(" and ")} also laid it out but ${unmeasured.length > 1 ? "were" : "was"} not measured` : ""}. Run QCA on every lesion in at least two views, ideally orthogonal, and report the worse.`,
      lessonId: LESSON,
    });
  }
  return out;
}

export function check(input: DebriefInput): CheckGap[] {
  const meta = input.record?.meta;
  if (!meta || meta.lab !== "diagnostic") return [];
  // bound to the record's own session: from its start to its end, when it has ended
  const endedAt = input.record?.endedAt;
  return qcaGaps(qcaReportsFor(meta.caseId, meta.startedAt, typeof endedAt === "number" && Number.isFinite(endedAt) ? endedAt : Infinity));
}
