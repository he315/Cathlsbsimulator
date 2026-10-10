// ---------------------------------------------------------------------------
// The decision ledger (found-lab-session-plumbing): one record type for every
// scored decision a learner makes in a lab, shared by the full case, the PCI
// sign-out, the diagnostic study report and the dev labs. A lab appends a
// record when the decision is made (useLabRun's decide), the debrief lists
// them with the lesson that teaches each one, and the logbook row of the run
// keeps them so a later review can link back to the lessons.
//
// Records are plain data (no functions, no engine state), so they can be
// stored in the progress profile and exported with the logbook as JSON.
// ---------------------------------------------------------------------------

/** One scored decision. */
export interface DecisionRecord {
  /** stable id of the decision within its lab, e.g. "adhoc-gate" or "closure-choice" */
  id: string;
  /** lab time of the decision, s */
  t: number;
  /** the stage of the procedure it belongs to (a lab phase or the lab's own stage name) */
  stage: string;
  /** what was decided, in the learner's words on the debrief, sentence case */
  label: string;
  /** whether the decision matched the expected one */
  correct: boolean;
  /** the expected answer, as shown in the debrief */
  expected: string;
  /** the learner's answer, as shown in the debrief */
  given: string;
  /** the lesson that teaches the decision (opened from the debrief) */
  lessonId?: string;
  /** lab tips that bear on the decision */
  tipIds?: string[];
}

/** Most decisions a single run keeps (storage cap for the logbook row; later records replace the oldest). */
export const MAX_DECISIONS_PER_RUN = 60;

/**
 * Storage bounds for one stored record (the logbook lives in one localStorage key): ids and stages
 * up to DECISION_ID_MAX characters, label, expected and given up to DECISION_TEXT_MAX, at most
 * DECISION_TIPS_MAX tip ids. Longer text is cut with an ellipsis.
 */
export const DECISION_ID_MAX = 80;
export const DECISION_TEXT_MAX = 160;
export const DECISION_TIPS_MAX = 8;

const cut = (v: unknown, n: number): string => {
  const s = String(v ?? "");
  return s.length > n ? `${s.slice(0, n - 1)}\u2026` : s;
};

/** A copy of a record with only its own fields (drops anything a caller attached), bounded and safe to store. */
export function cleanDecision(r: DecisionRecord): DecisionRecord {
  const out: DecisionRecord = {
    id: cut(r.id, DECISION_ID_MAX),
    t: Number.isFinite(r.t) ? r.t : 0,
    stage: cut(r.stage, DECISION_ID_MAX),
    label: cut(r.label, DECISION_TEXT_MAX),
    correct: !!r.correct,
    expected: cut(r.expected, DECISION_TEXT_MAX),
    given: cut(r.given, DECISION_TEXT_MAX),
  };
  if (r.lessonId) out.lessonId = cut(r.lessonId, DECISION_ID_MAX);
  if (Array.isArray(r.tipIds) && r.tipIds.length) out.tipIds = r.tipIds.slice(0, DECISION_TIPS_MAX).map((x) => cut(x, DECISION_ID_MAX));
  return out;
}

/** Is this value a stored decision record (for loading saved profiles)? */
export function isDecisionRecord(v: unknown): v is DecisionRecord {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.t === "number" && typeof r.stage === "string" && typeof r.label === "string" && typeof r.correct === "boolean" && typeof r.expected === "string" && typeof r.given === "string" &&
    (r.lessonId === undefined || typeof r.lessonId === "string") &&
    (r.tipIds === undefined || (Array.isArray(r.tipIds) && r.tipIds.every((x) => typeof x === "string")));
}

/** Totals for a debrief header. */
export interface LedgerSummary {
  total: number;
  correct: number;
  /** lessons of the decisions that were not correct, each once, in the order the decisions were made */
  lessonsToReview: string[];
  /** stages in the order they first appear */
  stages: string[];
}

export function summariseLedger(records: readonly DecisionRecord[]): LedgerSummary {
  const lessons: string[] = [];
  const stages: string[] = [];
  let correct = 0;
  for (const r of records) {
    if (r.correct) correct++;
    else if (r.lessonId && !lessons.includes(r.lessonId)) lessons.push(r.lessonId);
    if (!stages.includes(r.stage)) stages.push(r.stage);
  }
  return { total: records.length, correct, lessonsToReview: lessons, stages };
}

/**
 * The decisions of one run. A decision recorded again under the same id replaces the earlier one
 * (the learner changed an answer before it was final); the order is that of the first record.
 */
export class DecisionLedger {
  private list: DecisionRecord[] = [];

  constructor(initial: readonly DecisionRecord[] = []) {
    for (const r of initial) this.add(r);
  }

  add(r: DecisionRecord): DecisionRecord {
    const rec = cleanDecision(r);
    const i = this.list.findIndex((x) => x.id === rec.id);
    if (i >= 0) this.list[i] = rec;
    else {
      this.list.push(rec);
      if (this.list.length > MAX_DECISIONS_PER_RUN) this.list.shift();
    }
    return rec;
  }

  get(id: string): DecisionRecord | undefined {
    return this.list.find((x) => x.id === id);
  }

  all(): DecisionRecord[] {
    return this.list.slice();
  }

  byStage(stage: string): DecisionRecord[] {
    return this.list.filter((x) => x.stage === stage);
  }

  summary(): LedgerSummary {
    return summariseLedger(this.list);
  }

  get size(): number {
    return this.list.length;
  }

  clear(): void {
    this.list = [];
  }
}
