// ---------------------------------------------------------------------------
// Mentor layer: public API and the one-call assessment of an attempt.
// ---------------------------------------------------------------------------

import { VIEW_PRESETS } from "../data/viewPresets";
import type { CaseFacts } from "./analysis";
import { computeCoverage, requiredSegments, type CoverageResult, type SegmentGeometry } from "./coverage";
import { buildDebrief, type DebriefModel } from "./debrief";
import { computeMetrics, coverageRuns, type Metrics } from "./metrics";
import { detectMistakes, type MistakeEvidence } from "./mistakes";
import { planVsExecution, type ProcedurePlan } from "./prebrief";
import type { ReportComparison } from "./report";
import { DIAGNOSTIC_FULL_STUDY, ENGAGEMENT_TASK, PCI_STANDARD, evaluateStandards, type PassingStandard } from "./standards";
import type { ProcedureRecord } from "./telemetry";
import { timelineLanes, type TimelineLanes } from "./timeline";
import type { Analysis } from "./analysis";
import type { MentorUtterance, MistakeTally } from "./types";

export * from "./types";
export * from "./telemetry";
export * from "./replay";
export * from "./analysis";
export * from "./metrics";
export * from "./coverage";
export * from "./mistakes";
export * from "./standards";
export * from "./context";
export * from "./rules";
export * from "./mentor";
export * from "./visibility";
export * from "./prebrief";
export * from "./report";
export * from "./debrief";
export * from "./skillCards";
export * from "./demonstrator";
export * from "./timeline";
export { LegacyDiagnosticHost } from "./hosts/legacyDiagnostic";

export interface AssessOptions {
  facts?: CaseFacts;
  /** coronary geometry with segment labels, for view coverage */
  geometry?: SegmentGeometry;
  /** case focus and dominance, to pick the required segments */
  focus?: "left" | "right" | "both";
  dominance?: "right" | "left" | "codominant";
  plan?: ProcedurePlan;
  /** override the passing standards (e.g. a local expert benchmark) */
  standards?: PassingStandard[];
  selfRatings?: Record<string, number>;
  history?: Record<string, number[]>;
  report?: ReportComparison;
  misidentifications?: { tWall: number; note: string }[];
}

export interface Assessment {
  analysis: Analysis;
  metrics: Metrics;
  coverage?: CoverageResult;
  mistakes: { tally: MistakeTally; evidence: MistakeEvidence[] };
  standards: PassingStandard[];
  debrief: DebriefModel;
  lanes: TimelineLanes;
}

/** Default standards for a recorded attempt. */
export function defaultStandards(r: ProcedureRecord, focus?: "left" | "right" | "both"): PassingStandard[] {
  if (r.meta.lab === "pci") return PCI_STANDARD;
  return focus === "both" ? DIAGNOSTIC_FULL_STUDY : ENGAGEMENT_TASK;
}

/** Analyse, measure, detect mistakes, evaluate standards and build the debrief. */
export function assessAttempt(record: ProcedureRecord, o: AssessOptions = {}): Assessment {
  const first = computeMetrics(record, o.facts ?? {});
  let coverage: CoverageResult | undefined;
  if (o.geometry && record.meta.lab === "diagnostic") {
    const present = [...new Set(o.geometry.segments.map((s) => s.label))];
    const req = requiredSegments(o.focus ?? "both", o.dominance ?? "right", present);
    coverage = computeCoverage(o.geometry, coverageRuns(first.analysis), req);
  }
  const { analysis, metrics } = coverage ? computeMetrics(record, o.facts ?? {}, { coverage }) : first;
  const standards = o.standards ?? defaultStandards(record, o.focus);
  const budgetFluoro = standards.find((s) => s.metric === "fluoroS")?.value;
  const budgetContrast = o.plan?.contrastBudgetMl || standards.find((s) => s.metric === "contrastMl")?.value;
  const mistakes = detectMistakes(analysis, metrics, { facts: o.facts, budgets: { fluoroS: budgetFluoro, contrastMl: budgetContrast }, misidentifications: o.misidentifications });
  const ev = evaluateStandards(metrics, standards);
  const debrief = buildDebrief({
    record,
    analysis,
    metrics,
    mistakes,
    standards: ev,
    planVsExecution: o.plan ? planVsExecution(o.plan, analysis, VIEW_PRESETS) : undefined,
    selfRatings: o.selfRatings,
    history: o.history,
    report: o.report,
  });
  return { analysis, metrics, coverage, mistakes, standards, debrief, lanes: timelineLanes(analysis, mistakes.evidence) };
}

/** Telemetry event payload for an utterance (RecordedSession.event("mentor", ...)). */
export function utteranceData(u: MentorUtterance): Record<string, unknown> {
  return { ruleId: u.ruleId, level: u.level, text: u.text, severity: u.severity, blocking: u.blocking, critical: u.critical };
}
