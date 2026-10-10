// ---------------------------------------------------------------------------
// PEARLS debrief model (Eppich and Cheng 2015): reactions, description,
// analysis, summary.
//   Reactions   - the learner rates each sub-skill 1-5 and writes a plus/delta note.
//   Description - a narrative generated from the timeline.
//   Analysis    - up to 3 gaps, ranked by severity times recurrence. Technique
//                 gaps whose reason is evident get directive feedback with a replay
//                 clip; decision gaps get advocacy-inquiry (Rudolph 2006): an
//                 observation plus the attending's concern, then a genuine question
//                 with selectable frames, each of which unlocks targeted teaching.
//   Summary     - the learner picks a take-home ("next time I will..."), sees the
//                 metrics against their sourced standards, and skill cards are scheduled.
// Also: plan versus execution, self-rating calibration, and the structured report
// against ground truth.
//
// Registries (found-mentor-registries): further gaps come from debrief checks,
// one file per check under src/mentor/debriefChecks/ (discovered by glob), run
// after the debrief's own gaps and ranked with them. The model also carries
// the run's decision ledger (src/mentor/ledger.ts) and the lab tips shown
// during the run, for the debrief's Decisions tab; every gap, decision and tip
// with a lesson id links to that lesson.
// ---------------------------------------------------------------------------

import type { MistakeCode } from "../types";
import { MISTAKE_INFO } from "../data/teachingText";
import type { Analysis } from "./analysis";
import { segmentName } from "./coverage";
import type { Metrics } from "./metrics";
import { severityOf, type MistakeEvidence } from "./mistakes";
import type { PlanItem } from "./prebrief";
import type { ReportComparison } from "./report";
import { RULES } from "./rules";
import { cardForCode, isSchedulableCardId } from "./skillCards";
import { DecisionLedger, summariseLedger, type DecisionRecord, type LedgerSummary } from "./ledger";
import { DEBRIEF_CHECKS, type DebriefCheck } from "./debriefChecks/index";
import { formativeScore, type StandardResult } from "./standards";
import type { ProcedureRecord } from "./telemetry";
import type { FrameOption, MistakeTally, Severity, SnapshotRecord } from "./types";

// --- sub-skills for self-rating ------------------------------------------------------

export interface SubSkill {
  id: string;
  label: string;
  /** measured performance 0..1 from the metrics and mistakes (for calibration) */
  measure: (m: Metrics, t: MistakeTally) => number | undefined;
  /** the safety sub-skill (over-confidence here is flagged) */
  safety?: boolean;
}

const count = (t: MistakeTally, codes: MistakeCode[]) => codes.reduce((s, c) => s + (t[c] ?? 0), 0);
const decay = (n: number, k = 1) => Math.exp(-n / k);

export const DIAGNOSTIC_SUBSKILLS: SubSkill[] = [
  { id: "catheter", label: "Catheter choice", measure: (_m, t) => decay(count(t, ["wrong-catheter", "catheter-changed-early", "catheter-changed-late"])) },
  { id: "engage", label: "Engagement technique", measure: (m, t) => (m.lab === "diagnostic" ? decay(m.failedAttempts.left + m.failedAttempts.right, 3) * decay(count(t, ["wrong-rotation", "over-rotation", "too-high", "too-low", "non-coaxial"]), 2) : undefined) },
  { id: "safety", label: "Pressure and safety", safety: true, measure: (_m, t) => decay(count(t, ["damped-injection", "lv-injection", "lv-entry", "no-aspirate", "ignored-pressure-warning", "deep-engagement", "air-embolism", "vf-arrest", "dissection", "too-much-pushing"])) },
  { id: "inject", label: "Injection technique", measure: (m) => (m.lab === "diagnostic" && m.injectionQuality.length ? m.injectionQuality.filter((q) => q.preContrastOk !== false && q.washoutOk && q.adequateFill).length / m.injectionQuality.length : undefined) },
  { id: "views", label: "View selection", measure: (m, t) => (m.lab === "diagnostic" ? (m.viewCoverage ? m.viewCoverage.seen.length / Math.max(1, m.viewCoverage.seen.length + m.viewCoverage.missing.length) : decay(count(t, ["poor-view"]))) : undefined) },
  { id: "economy", label: "Radiation and contrast economy", measure: (_m, t) => decay(count(t, ["excess-fluoro", "excess-contrast"])) },
];

export const PCI_SUBSKILLS: SubSkill[] = [
  { id: "wire", label: "Wiring", measure: (m) => (m.lab === "pci" ? decay(m.sideBranchEntries + 2 * m.septalEntries, 3) : undefined) },
  { id: "assess", label: "Lesion assessment and sizing", measure: (m) => (m.lab === "pci" && m.lesionEstimateErrorMm ? decay(m.lesionEstimateErrorMm.ref + m.lesionEstimateErrorMm.length / 4, 1.5) : undefined) },
  { id: "deliver", label: "Device delivery and deployment", measure: (m) => (m.lab === "pci" ? decay(m.deployWithoutPositioningRun + m.oversizedOutsideLesion + m.deviceBeyondWire) : undefined) },
  { id: "safety", label: "Complication recognition", safety: true, measure: (m) => (m.lab === "pci" ? (m.complications.length ? (m.correctBailout ? 1 : 0) : 1) : undefined) },
  { id: "economy", label: "Radiation and contrast economy", measure: (_m, t) => decay(count(t, ["excess-fluoro", "excess-contrast"])) },
];

// --- the model --------------------------------------------------------------------------

export interface Gap {
  id: string;
  /** the mistake behind the gap (a gap from a debrief check may have none) */
  code?: MistakeCode;
  title: string;
  severity: Severity;
  occurrences: number;
  /** severity weight × occurrences */
  priority: number;
  strategy: "directive" | "advocacy-inquiry";
  /** first occurrence (wall time) */
  tWall: number;
  /** replay clip around it */
  clip: { from: number; to: number };
  /** snapshot to rewind to (decision point at or before the gap) */
  rewind?: { index: number; tWall: number };
  /** advocacy-inquiry: observation plus concern, then the question */
  advocacy?: string;
  inquiry?: string;
  frames?: FrameOption[];
  /** directive feedback */
  directive?: string;
  teaching: string;
  /** skill card to schedule (none for a check gap without a mistake code or card) */
  cardId?: string;
  /** the lesson that teaches it ('Open lesson' in the debrief) */
  lessonId?: string;
  /** the take-home this gap offers (default from the mistake code) */
  takeHome?: string;
  /** the debrief check that raised it (absent for the debrief's own gaps) */
  check?: string;
}

/**
 * A gap as a debrief check reports it; buildDebrief fills in the rest the way it does for its own
 * gaps (priority from severity and occurrences, the clip, the rewind snapshot, the skill card of the
 * mistake code, the advocacy-inquiry question and frames).
 */
export interface CheckGap {
  /** unique within the debrief; a check gap whose id matches an earlier gap is dropped */
  id: string;
  title: string;
  severity: Severity;
  /** wall time of the first occurrence */
  tWall: number;
  /** what the learner should take from it */
  teaching: string;
  code?: MistakeCode;
  /** default 1 */
  occurrences?: number;
  /** default: advocacy-inquiry when advocacy or frames are given, otherwise directive */
  strategy?: Gap["strategy"];
  /** directive feedback (default: the teaching) */
  directive?: string;
  advocacy?: string;
  /** default "What were you seeing at that point?" */
  inquiry?: string;
  /** default: the frames of the rule that teaches the code, or the generic frames */
  frames?: FrameOption[];
  lessonId?: string;
  /** default: the card of the mistake code (cardForCode) */
  cardId?: string;
  takeHome?: string;
  clip?: { from: number; to: number };
}

/** A lab tip shown during the run (the debrief lists it with its lesson). */
export interface TipShown {
  id: string;
  /** wall time it was first shown, when the record has it */
  tWall?: number;
}

/** Telemetry event kind a lab writes when a tip is shown: data { tipId }. */
export const TIP_SHOWN_TELEMETRY = "lab.tip";

export interface DecisionPoint {
  tWall: number;
  label: string;
  /** index into record.snapshots */
  snapshot: number;
  code?: MistakeCode;
}

export interface Calibration {
  subSkill: string;
  label: string;
  self?: number;
  /** measured, mapped to 1..5 */
  measured?: number;
  /** self − measured (positive = over-confident) */
  delta?: number;
  /** percentile of this attempt in the learner's own history (0..100) */
  percentile?: number;
  flag?: "over-confident" | "under-confident";
}

export interface DebriefModel {
  reactions: { prompt: string; subSkills: { id: string; label: string }[] };
  description: { narrative: string[] };
  analysis: { gaps: Gap[] };
  summary: {
    takeHomeOptions: string[];
    standards: StandardResult[];
    /** formative only, shown here and nowhere during the case */
    formative: number;
    passed: boolean;
    cardsToSchedule: string[];
  };
  planVsExecution: PlanItem[];
  calibration: Calibration[];
  report?: ReportComparison;
  decisionPoints: DecisionPoint[];
  /** the run's scored decisions (found-lab-session-plumbing), in the order they were made */
  ledger: { decisions: DecisionRecord[]; summary: LedgerSummary };
  /** lab tips shown during the run, each once, in the order first shown */
  tipsShown: TipShown[];
  /** debrief checks that failed (their gaps are missing; the rest of the debrief stands) */
  checkErrors?: string[];
}

export interface DebriefInput {
  record: ProcedureRecord;
  analysis: Analysis;
  metrics: Metrics;
  mistakes: { tally: MistakeTally; evidence: MistakeEvidence[] };
  standards: { results: StandardResult[]; passed: boolean };
  planVsExecution?: PlanItem[];
  selfRatings?: Record<string, number>;
  /** previous measured performance per sub-skill (0..1), for percentiles */
  history?: Record<string, number[]>;
  report?: ReportComparison;
  /** the run's decision ledger (useLabRun's decisions()) */
  decisions?: readonly DecisionRecord[];
  /** tip ids shown during the run, when the lab tracks them itself (merged with the record's lab.tip events) */
  tipsShown?: readonly string[];
}

/** "mm:ss" from seconds. */
export function clock(s: number): string {
  const v = Math.max(0, Math.round(s));
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
}

const SEV_W: Record<Severity, number> = { safety: 3, technique: 2, efficiency: 1 };

/** Gaps where the reasoning is usually evident (directive); the rest are decisions (advocacy-inquiry). */
const DIRECTIVE: MistakeCode[] = ["wrong-rotation", "over-rotation", "too-high", "too-low", "non-coaxial", "deep-engagement", "lv-entry", "too-much-pushing", "dissection"];

const CONCERN: Partial<Record<MistakeCode, string>> = {
  "damped-injection": "I was worried about a dissection",
  "ignored-pressure-warning": "I was worried the tip was obstructing the vessel",
  "no-aspirate": "I was worried about air or clot in the line",
  "air-embolism": "I was worried about air in the coronary",
  "vf-arrest": "I was worried about ventricular fibrillation",
  "lv-injection": "I was worried we would inject the ventricle",
  "non-selective-injection": "I was worried we were spending contrast without a diagnostic picture",
  "catheter-changed-early": "I wondered whether that catheter had had a fair chance",
  "catheter-changed-late": "I was worried about the time and the trauma of repeated attempts",
  "wrong-catheter": "I wondered whether that curve could reach in this root",
  "poor-view": "I was worried we would miss or misjudge disease in that segment",
  "excess-contrast": "I was worried about the kidneys",
  "excess-fluoro": "I was worried about the radiation dose",
  "insufficient-withdrawal": "I was worried about trauma from a dangerous position",
  "vessel-misid": "I was worried about the report",
};

const GENERIC_FRAMES: FrameOption[] = [
  { id: "didnt-see", text: "I didn't see it at the time", teaching: "Name the cue you missed and where you will look for it next time.", drill: undefined },
  { id: "thought-ok", text: "I saw it but thought it was acceptable", teaching: "Compare what you accepted with the standard; the gap is what to practise.", drill: undefined },
  { id: "rushed", text: "I felt under time pressure", teaching: "In the lab a short pause to reassess costs less than the complication it avoids.", drill: undefined },
];

function framesFor(code: MistakeCode): FrameOption[] {
  const r = RULES.find((x) => x.mistake === code && x.frames);
  return (r?.frames ?? GENERIC_FRAMES).map((f) => ({ ...f, drill: f.drill ?? code }));
}

function directiveFor(code: MistakeCode): string {
  const tips: Partial<Record<MistakeCode, string>> = {
    "wrong-rotation": "Watch which way the tip swings with a small test turn before committing. Clockwise brings a right Judkins anterior towards the RCA.",
    "over-rotation": "Make small turns and pause for each to reach the tip. Stored torque released at once swings the tip past the ostium.",
    "too-high": "Engagement happens at the sinus level. Bring the tip down to the cusps before any torque.",
    "too-low": "Hold the tip at the cusp. Lower than that, it heads for the valve.",
    "non-coaxial": "Make the tip point down the vessel, not across the ostium, before you inject.",
    "deep-engagement": "Withdraw a millimetre or two until the trace is aortic again; a seated tip only needs to be coaxial.",
    "lv-entry": "Withdraw to the root and rebuild the approach from the sinus; never push from the ventricle.",
    "too-much-pushing": "Release the load, withdraw to the sinus and change the angle with torque.",
    dissection: "Stop the moment you feel resistance build; withdraw and re-approach with torque.",
  };
  return tips[code] ?? MISTAKE_INFO[code].explain;
}

function describeAt(code: MistakeCode, ev: MistakeEvidence): string {
  const t = clock(ev.tWall);
  switch (code) {
    case "damped-injection":
      return `I noticed you injected at ${t} while the trace was damped.`;
    case "no-aspirate":
      return `I noticed the injection at ${t} came without an aspirate after the tip had moved.`;
    case "ignored-pressure-warning":
      return `I noticed the trace was damped from ${t} and stayed that way for a while.`;
    case "catheter-changed-early":
      return `I noticed you changed catheter at ${t}. ${ev.note}`;
    case "catheter-changed-late":
      return `I noticed you stayed with the same catheter until ${t}. ${ev.note}`;
    case "poor-view":
      return `I noticed that by the end, ${ev.note.replace(/^Not shown/, "some segments were not shown").replace(/segment ([\w, ]+)/, (_m, l: string) => l.split(", ").map(segmentName).join(", "))}`;
    default:
      return `I noticed at ${t}: ${ev.note.charAt(0).toLowerCase()}${ev.note.slice(1)}`;
  }
}

/** Build the debrief; `checks` defaults to the registry (src/mentor/debriefChecks/). */
export function buildDebrief(i: DebriefInput, checks: readonly DebriefCheck[] = DEBRIEF_CHECKS): DebriefModel {
  const subs = i.metrics.lab === "pci" ? PCI_SUBSKILLS : DIAGNOSTIC_SUBSKILLS;
  const decisionPoints = findDecisionPoints(i.record, i.mistakes.evidence);

  // --- analysis: gaps by severity × recurrence --------------------------------------
  const byCode = new Map<MistakeCode, MistakeEvidence[]>();
  for (const e of i.mistakes.evidence) {
    const a = byCode.get(e.code) ?? [];
    a.push(e);
    byCode.set(e.code, a);
  }
  const own: Gap[] = [...byCode.entries()]
    .map(([code, evs]) => {
      const sev = severityOf(code);
      const first = evs[0];
      const directive = DIRECTIVE.includes(code);
      const snapIdx = nearestSnapshot(i.record.snapshots, first.tWall);
      const info = MISTAKE_INFO[code];
      const g: Gap = {
        id: `gap-${code}`,
        code,
        title: info.label,
        severity: sev,
        occurrences: evs.length,
        priority: SEV_W[sev] * evs.length,
        strategy: directive ? "directive" : "advocacy-inquiry",
        tWall: first.tWall,
        clip: { from: Math.max(0, first.tWall - 6), to: first.tWall + 4 },
        rewind: snapIdx >= 0 ? { index: snapIdx, tWall: i.record.snapshots[snapIdx].tWall } : undefined,
        teaching: info.explain,
        cardId: cardForCode(code).id,
      };
      if (directive) g.directive = directiveFor(code);
      else {
        g.advocacy = `${describeAt(code, first)} ${CONCERN[code] ?? "I was concerned about that"}.`;
        g.inquiry = "What were you seeing at that point?";
        g.frames = framesFor(code);
      }
      return g;
    });

  // --- further gaps from the debrief checks, ranked with the debrief's own ---------------
  const { gaps: checked, errors: checkErrors } = runDebriefChecks(i, checks);
  const ids = new Set(own.map((g) => g.id));
  const extra: Gap[] = [];
  for (const g of checked) {
    if (ids.has(g.id)) continue;
    ids.add(g.id);
    extra.push(g);
  }
  const gaps: Gap[] = [...own, ...extra].sort((a, b) => b.priority - a.priority || a.tWall - b.tWall).slice(0, 3);

  // --- calibration ---------------------------------------------------------------------
  const calibration: Calibration[] = subs.map((s) => {
    const perf = s.measure(i.metrics, i.mistakes.tally);
    const measured = perf === undefined ? undefined : Math.round((1 + 4 * Math.max(0, Math.min(1, perf))) * 10) / 10;
    const self = i.selfRatings?.[s.id];
    const delta = self !== undefined && measured !== undefined ? Math.round((self - measured) * 10) / 10 : undefined;
    const hist = i.history?.[s.id];
    const percentile = hist && hist.length && perf !== undefined ? Math.round((100 * hist.filter((h) => h <= perf).length) / hist.length) : undefined;
    const flag = delta === undefined ? undefined : delta >= 2 ? "over-confident" : delta <= -2 ? "under-confident" : undefined;
    return { subSkill: s.id, label: s.label, self, measured, delta, percentile, flag: flag as Calibration["flag"] };
  });

  // --- summary ----------------------------------------------------------------------------
  const takeHome = [...new Set(gaps.map((g) => g.takeHome ?? (g.code ? takeHomeFor(g.code) : undefined)).filter((t): t is string => !!t))];
  if (!takeHome.length) takeHome.push("Next time I will keep the same sequence and aim for fewer, more deliberate runs.");
  return {
    reactions: { prompt: "How did that feel? Rate each part, then note one thing that went well and one you would change.", subSkills: subs.map((s) => ({ id: s.id, label: s.label })) },
    description: { narrative: narrate(i.analysis, i.record) },
    analysis: { gaps },
    summary: {
      takeHomeOptions: takeHome,
      standards: i.standards.results,
      formative: formativeScore(i.standards.results),
      passed: i.standards.passed,
      // only cards the review schedule can hold are announced (a check gap's own cardId may have no template)
      cardsToSchedule: [...new Set(gaps.map((g) => g.cardId).filter((c): c is string => !!c && isSchedulableCardId(c)))],
    },
    planVsExecution: i.planVsExecution ?? [],
    calibration,
    report: i.report,
    decisionPoints,
    ledger: ledgerOf(i.decisions ?? []),
    tipsShown: tipsShownOf(i.record, i.tipsShown),
    ...(checkErrors.length ? { checkErrors } : {}),
  };
}

// --- debrief checks ------------------------------------------------------------------------

/** Complete a check's gap the way the debrief builds its own. */
export function completeGap(cg: CheckGap, record: ProcedureRecord, check?: string): Gap {
  const occurrences = Math.max(1, Math.round(cg.occurrences ?? 1));
  const strategy = cg.strategy ?? (cg.advocacy || cg.frames?.length ? "advocacy-inquiry" : "directive");
  const snapIdx = nearestSnapshot(record.snapshots, cg.tWall);
  const g: Gap = {
    id: cg.id,
    ...(cg.code ? { code: cg.code } : {}),
    title: cg.title,
    severity: cg.severity,
    occurrences,
    priority: SEV_W[cg.severity] * occurrences,
    strategy,
    tWall: cg.tWall,
    clip: cg.clip ?? { from: Math.max(0, cg.tWall - 6), to: cg.tWall + 4 },
    rewind: snapIdx >= 0 ? { index: snapIdx, tWall: record.snapshots[snapIdx].tWall } : undefined,
    teaching: cg.teaching,
  };
  const card = cg.cardId ?? (cg.code ? cardForCode(cg.code).id : undefined);
  if (card) g.cardId = card;
  if (cg.lessonId) g.lessonId = cg.lessonId;
  if (cg.takeHome) g.takeHome = cg.takeHome;
  if (check) g.check = check;
  if (strategy === "directive") g.directive = cg.directive ?? cg.teaching;
  else {
    g.advocacy = cg.advocacy ?? cg.teaching;
    g.inquiry = cg.inquiry ?? "What were you seeing at that point?";
    g.frames = cg.frames?.length ? cg.frames : cg.code ? framesFor(cg.code) : GENERIC_FRAMES;
  }
  return g;
}

/**
 * Run the debrief checks on a debrief's input (in registry order). A check that throws is reported
 * in errors and contributes nothing; the others still run.
 */
export function runDebriefChecks(i: DebriefInput, checks: readonly DebriefCheck[] = DEBRIEF_CHECKS): { gaps: Gap[]; errors: string[] } {
  const gaps: Gap[] = [];
  const errors: string[] = [];
  for (const c of checks) {
    try {
      for (const cg of c.check(i) ?? []) gaps.push(completeGap(cg, i.record, c.id));
    } catch (e) {
      errors.push(`${c.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { gaps, errors };
}

// --- decision ledger and tips shown ------------------------------------------------------------

function ledgerOf(decisions: readonly DecisionRecord[]): DebriefModel["ledger"] {
  const list = new DecisionLedger(decisions).all();
  return { decisions: list, summary: summariseLedger(list) };
}

/** Tips shown: the record's lab.tip events (data.tipId) first, then ids the lab passed, each once. */
export function tipsShownOf(r: ProcedureRecord | undefined, extra: readonly string[] = []): TipShown[] {
  const out: TipShown[] = [];
  const seen = new Set<string>();
  for (const e of r?.events ?? []) {
    if (e.kind !== TIP_SHOWN_TELEMETRY) continue;
    const id = e.data?.tipId;
    if (typeof id !== "string" || !id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, tWall: e.tWall });
  }
  for (const id of extra) {
    if (typeof id !== "string" || !id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id });
  }
  return out;
}

/**
 * The debrief with a run's decisions and tips added (for a lab that builds the debrief through
 * assessAttempt, which does not take them): decisions recorded again under the same id replace the
 * earlier ones, tips already listed are not repeated.
 */
export function withLedger(model: DebriefModel, decisions: readonly DecisionRecord[] = [], tipIds: readonly string[] = []): DebriefModel {
  if (!decisions.length && !tipIds.length) return model;
  const ledger = ledgerOf([...(model.ledger?.decisions ?? []), ...decisions]);
  const tips = [...(model.tipsShown ?? [])];
  for (const id of tipIds) if (id && !tips.some((t) => t.id === id)) tips.push({ id });
  return { ...model, ledger, tipsShown: tips };
}

function takeHomeFor(code: MistakeCode): string {
  const t: Partial<Record<MistakeCode, string>> = {
    "damped-injection": "Next time I will look at the trace before every injection and withdraw if it is damped.",
    "ignored-pressure-warning": "Next time I will act on a damped trace straight away.",
    "no-aspirate": "Next time I will aspirate after every repositioning, immediately before injecting.",
    "lv-entry": "Next time I will solve height problems by withdrawing, not pushing.",
    "too-much-pushing": "Next time I will stop and release the moment I feel resistance.",
    "wrong-rotation": "Next time I will make a small test turn and watch the tip before committing.",
    "over-rotation": "Next time I will use small turns and wait for each to reach the tip.",
    "poor-view": "Next time I will show each segment in two clean views.",
    "catheter-changed-early": "Next time I will give a catheter a systematic try before changing.",
    "catheter-changed-late": "Next time I will decide on a catheter change after a few failed attempts.",
    "excess-contrast": "Next time I will agree a contrast budget and make every run count.",
    "excess-fluoro": "Next time I will screen in short, purposeful bursts.",
  };
  return t[code] ?? `Next time I will avoid: ${MISTAKE_INFO[code].label.toLowerCase()}.`;
}

/** Snapshot index at or before a time (-1 if none). */
export function nearestSnapshot(snaps: SnapshotRecord[], t: number): number {
  let best = -1;
  for (let k = 0; k < snaps.length; k++) if (snaps[k].tWall <= t + 1e-6 && (best < 0 || snaps[k].tWall >= snaps[best].tWall)) best = k;
  return best;
}

const REASON_LABEL: Record<string, string> = {
  inject: "Injection",
  cine: "Cine run",
  "device:catheter": "Catheter exchange",
  inflate: "Inflation",
  deploy: "Stent deployment",
  load: "Device loaded",
  exchange: "Exchange",
  remove: "Device removed",
  bailout: "Bailout",
};

/** Decision points for rewind: recorded decision snapshots plus each first mistake. */
export function findDecisionPoints(r: ProcedureRecord, evidence: MistakeEvidence[]): DecisionPoint[] {
  const out: DecisionPoint[] = [];
  r.snapshots.forEach((s, k) => {
    if (s.reason === "keyframe" || s.reason === "start") return;
    out.push({ tWall: s.tWall, label: REASON_LABEL[s.reason] ?? s.reason, snapshot: k });
  });
  const firsts = new Map<MistakeCode, MistakeEvidence>();
  for (const e of evidence) if (!firsts.has(e.code)) firsts.set(e.code, e);
  for (const e of firsts.values()) {
    const k = nearestSnapshot(r.snapshots, e.tWall);
    if (k >= 0) out.push({ tWall: r.snapshots[k].tWall, label: `Before: ${MISTAKE_INFO[e.code].label.toLowerCase()}`, snapshot: k, code: e.code });
  }
  out.sort((a, b) => a.tWall - b.tWall);
  return out;
}

/** A short chronological narrative from the analysis. */
export function narrate(a: Analysis, r: ProcedureRecord): string[] {
  const lines: { t: number; s: string }[] = [];
  const startCath = typeof r.meta.context?.catheterId === "string" ? ` with a ${r.meta.context.catheterId}` : "";
  lines.push({ t: a.t0, s: `Case started in ${r.meta.mode} mode${startCath}.` });
  for (const c of a.catheters.slice(1)) lines.push({ t: c.startT, s: `Changed to a ${c.id}.` });
  for (const side of ["left", "right"] as const) {
    const t = a.firstSelective[side];
    const aps = a.approaches.filter((x) => x.side === side && (t === undefined || x.startT <= t));
    if (t !== undefined) lines.push({ t, s: `Selective in the ${side === "left" ? "left main" : "right coronary"} after ${aps.length} approach${aps.length === 1 ? "" : "es"}.` });
    else if (aps.length) lines.push({ t: aps[aps.length - 1].endT, s: `${aps.length} approach${aps.length === 1 ? "" : "es"} to the ${side === "left" ? "left main" : "right coronary"} without a selective seat.` });
  }
  for (const t of a.lvEntries) lines.push({ t, s: "The tip crossed into the ventricle." });
  for (const d of a.damped) lines.push({ t: d.startT, s: `Damped trace for ${Math.max(1, Math.round(d.endT - d.startT))} s${d.acted ? ", corrected" : ", not corrected"}.` });
  for (const run of a.runs) {
    const fam = viewName(run.cArm.laoRao, run.cArm.cranialCaudal);
    const q = run.injections.length ? (run.diagnostic ? "diagnostic" : "not diagnostic") : "no injection";
    lines.push({ t: run.startT, s: `Cine in ${fam}, ${run.durationS.toFixed(1)} s, ${Math.round(run.ml)} mL (${q}).` });
  }
  for (const i of a.injectionsOutsideCine) lines.push({ t: i.tWall, s: `Injection of ${Math.round(Number(i.data?.ml ?? 0))} mL without cine.` });
  for (const c of a.complications) lines.push({ t: c.tWall, s: `Complication: ${String(c.data?.kind ?? "unspecified").replace(/-/g, " ")}.` });
  for (const m of a.mentor) if (m.data?.blocking) lines.push({ t: m.tWall, s: `The attending stopped the action: "${String(m.data?.text ?? "")}"` });
  lines.push({ t: a.t1, s: "Case ended." });
  lines.sort((x, y) => x.t - y.t);
  // collapse consecutive identical sentences
  const out: string[] = [];
  let last = "";
  let rep = 0;
  for (const l of lines) {
    if (l.s === last) {
      rep++;
      continue;
    }
    if (rep) out[out.length - 1] += ` (×${rep + 1})`;
    rep = 0;
    last = l.s;
    out.push(`${clock(l.t - a.t0)}  ${l.s}`);
  }
  if (rep) out[out.length - 1] += ` (×${rep + 1})`;
  return out;
}

function viewName(lao: number, cran: number): string {
  const side = Math.abs(lao) < 1 ? "AP" : `${lao > 0 ? "LAO" : "RAO"} ${Math.round(Math.abs(lao))}`;
  const ang = Math.abs(cran) < 1 ? "" : ` ${cran > 0 ? "cranial" : "caudal"} ${Math.round(Math.abs(cran))}`;
  return side + ang;
}
