// ---------------------------------------------------------------------------
// The attending engine.
//
// Each frame the integrator calls step(input); before a consequential action
// (inject, inflate, deploy, advance a device or catheter) it calls
// preAction(action, input) and must honour `allow: false`. The engine returns
// utterances; it never returns scores, and nothing it says mentions one.
//
// Fading. The ladder start and ceiling depend on the assessment mode, the
// severity of the rule and the learner's entrustment level. Non-safety feedback
// during the case is rationed per minute and the rest is deferred to the
// debrief, because for novices terminal feedback transfers better than
// concurrent feedback (Walsh 2009; Hatala 2014; see facts/S11.md). Exam mode is
// silent except for safety stops, which are logged as critical errors.
//
// All times, budgets and level tables are tunable defaults (model parameters).
// ---------------------------------------------------------------------------

import { ContextTracker, type MentorCtx, type MentorInput, type PreAction } from "./context";
import { ALL_RULES, type MentorRule } from "./rules";
import type { AssessmentMode, EntrustmentLevel, LadderLevel, MentorUtterance, Severity } from "./types";

export interface MentorPolicy {
  mode: AssessmentMode;
  entrustment: EntrustmentLevel;
  /** seconds between ladder steps while a situation persists (model parameter) */
  escalateEveryS: number;
  /** in exam mode, does a safety stop block the action? (a real examiner would stop it) */
  examStopsBlock: boolean;
}

export const DEFAULT_POLICY: MentorPolicy = { mode: "supervised", entrustment: 2, escalateEveryS: 6, examStopsBlock: true };

/** Ladder start and ceiling per mode and severity (model parameters). 0 start = wait silently first. */
const LADDER_TABLE: Record<AssessmentMode, Record<Severity, { start: LadderLevel; max: LadderLevel; deferred?: boolean }>> = {
  guided: { safety: { start: 2, max: 5 }, technique: { start: 1, max: 4 }, efficiency: { start: 1, max: 3 } },
  supervised: { safety: { start: 1, max: 4 }, technique: { start: 1, max: 3 }, efficiency: { start: 0, max: 0, deferred: true } },
  independent: { safety: { start: 0, max: 3 }, technique: { start: 0, max: 0, deferred: true }, efficiency: { start: 0, max: 0, deferred: true } },
  exam: { safety: { start: 0, max: 0, deferred: true }, technique: { start: 0, max: 0, deferred: true }, efficiency: { start: 0, max: 0, deferred: true } },
};

/** Non-safety utterances allowed per minute by entrustment (model parameter). */
const BUDGET_PER_MIN: Record<EntrustmentLevel, number> = { 1: 3, 2: 2, 3: 1, 4: 0.5, 5: 0 };

interface RuleState {
  since: number;
  level: LadderLevel;
  lastStepT: number;
  active: boolean;
  clearedAt: number;
  lastLevel: LadderLevel;
}

export interface DeferredNote {
  tWall: number;
  ruleId: string;
  severity: Severity;
}

export interface PreActionResult {
  allow: boolean;
  utterance?: MentorUtterance;
}

export class MentorEngine {
  policy: MentorPolicy;
  readonly tracker = new ContextTracker();
  readonly rules: MentorRule[];
  readonly log: MentorUtterance[] = [];
  readonly deferred: DeferredNote[] = [];
  private st = new Map<string, RuleState>();
  private spoken: number[] = []; // times of non-safety utterances (budget window)
  private seq = 0;
  private listeners = new Set<(u: MentorUtterance) => void>();

  constructor(policy: Partial<MentorPolicy> = {}, rules: MentorRule[] = ALL_RULES) {
    this.policy = { ...DEFAULT_POLICY, ...policy };
    this.rules = rules;
  }

  onUtterance(f: (u: MentorUtterance) => void): () => void {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  }

  setPolicy(p: Partial<MentorPolicy>) {
    this.policy = { ...this.policy, ...p };
  }

  /** How the ladder runs for a severity under the current policy. */
  ladderFor(sev: Severity): { start: LadderLevel; max: LadderLevel; deferred: boolean; persistScale: number } {
    const base = LADDER_TABLE[this.policy.mode][sev];
    const fade = this.policy.entrustment - 2; // -1 .. 3
    let start = base.start;
    let max = base.max;
    let deferred = !!base.deferred;
    if (!deferred) {
      if (sev === "safety") {
        start = clampLevel(start - Math.max(0, fade - 1));
      } else {
        start = clampLevel(start - fade);
        if (this.policy.entrustment >= 4) deferred = true;
        if (this.policy.entrustment === 1) max = clampLevel(max + 1, 4);
      }
      if (sev === "safety" && this.policy.entrustment === 1) start = clampLevel(start + 1, max);
    }
    return { start, max, deferred, persistScale: 1 + 0.5 * Math.max(0, fade) };
  }

  private budgetOk(t: number): boolean {
    const per = BUDGET_PER_MIN[this.policy.entrustment];
    this.spoken = this.spoken.filter((x) => t - x < 60);
    return this.spoken.length < per;
  }

  private emit(r: MentorRule, level: LadderLevel, c: MentorCtx, blocking = false, critical = false): MentorUtterance | undefined {
    const line = r.lines[level as Exclude<LadderLevel, 0>] ?? nearestLine(r, level);
    if (!line) return undefined;
    const u: MentorUtterance = {
      id: `u${++this.seq}`,
      tWall: c.tWall,
      ruleId: r.id,
      level,
      text: line(c),
      anchor: r.anchor,
      severity: r.severity,
      blocking,
      critical,
      frames: r.id === "time-out" && level === 1 ? r.frames : undefined,
    };
    this.log.push(u);
    for (const l of this.listeners) l(u);
    return u;
  }

  private stateOf(id: string): RuleState {
    let s = this.st.get(id);
    if (!s) {
      s = { since: 0, level: 0, lastStepT: -Infinity, active: false, clearedAt: -Infinity, lastLevel: 0 };
      this.st.set(id, s);
    }
    return s;
  }

  /** Advance one frame. Returns the utterances spoken this frame. */
  step(input: MentorInput): MentorUtterance[] {
    const c = this.tracker.update(input);
    const out: MentorUtterance[] = [];
    for (const r of this.rules) {
      if (r.lab !== "any" && r.lab !== c.lab) continue;
      const s = this.stateOf(r.id);
      const on = r.when(c);
      if (!on) {
        if (s.active) {
          s.active = false;
          s.clearedAt = c.tWall;
          s.lastLevel = s.level;
          s.level = 0;
        }
        continue;
      }
      const lad = this.ladderFor(r.severity);
      if (!s.active) {
        s.active = true;
        s.since = c.tWall;
        s.lastStepT = -Infinity;
        // a recurrence soon after clearing resumes where the attending left off
        s.level = c.tWall - s.clearedAt < Math.max(60, r.cooldownS) ? s.lastLevel : 0;
      }
      const persisted = c.tWall - s.since >= r.persistS * lad.persistScale;
      if (!persisted) continue;
      if (lad.deferred) {
        if (!this.deferred.some((d) => d.ruleId === r.id && c.tWall - d.tWall < r.cooldownS)) this.deferred.push({ tWall: c.tWall, ruleId: r.id, severity: r.severity });
        continue;
      }
      // back within the cooldown: no repeat of the same line, escalate from here after the usual wait
      if (s.lastStepT === -Infinity && c.tWall - s.clearedAt < r.cooldownS) {
        s.lastStepT = c.tWall;
        continue;
      }
      // first reaction at the start level (0 = wait one escalation period in silence)
      let next: LadderLevel | null = null;
      if (s.lastStepT === -Infinity) {
        if (s.level < lad.start) next = lad.start;
        else if (s.level > 0) next = clampLevel(s.level + 1, lad.max); // it happened again: one step firmer
        else if (lad.start === 0) {
          s.lastStepT = c.tWall; // silent observation period starts
          continue;
        } else next = lad.start;
      } else if (c.tWall - s.lastStepT >= this.policy.escalateEveryS && s.level < lad.max) {
        next = (s.level + 1) as LadderLevel;
      }
      if (next === null || next === 0) continue;
      if (r.severity !== "safety" && !this.budgetOk(c.tWall)) {
        // over budget: hold this level, note it for the debrief
        s.lastStepT = c.tWall;
        if (!this.deferred.some((d) => d.ruleId === r.id && c.tWall - d.tWall < r.cooldownS)) this.deferred.push({ tWall: c.tWall, ruleId: r.id, severity: r.severity });
        continue;
      }
      s.level = next;
      s.lastStepT = c.tWall;
      const u = this.emit(r, next, c);
      if (u) {
        out.push(u);
        if (r.severity !== "safety") this.spoken.push(c.tWall);
      }
    }
    return out;
  }

  /**
   * Ask before a consequential action. A safety rule whose stopOn matches takes
   * over: the attending says stop, and the action is blocked (in exam mode it is
   * logged as a critical error, and blocked when examStopsBlock is set).
   */
  preAction(action: PreAction, input: MentorInput): PreActionResult {
    const c: MentorCtx = { ...(this.tracker.ctx ?? this.tracker.update(input)), ...input, pending: action };
    for (const r of this.rules) {
      if (r.lab !== "any" && r.lab !== c.lab) continue;
      if (!r.stopOn || !r.stopOn(action, c)) continue;
      const mode = this.policy.mode;
      const exam = mode === "exam";
      // the examiner only stops for safety; an independent operator is left to technique decisions
      if (r.severity !== "safety" && (exam || mode === "independent")) {
        this.deferred.push({ tWall: c.tWall, ruleId: r.id, severity: r.severity });
        continue;
      }
      const blocking = exam ? this.policy.examStopsBlock : true;
      const u = this.emit(r, 5, c, blocking, exam);
      const s = this.stateOf(r.id);
      s.level = 5;
      s.lastStepT = c.tWall;
      return { allow: !blocking, utterance: u };
    }
    return { allow: true };
  }

  /**
   * The learner asks for help. Returns the next ladder line of the most urgent
   * active situation, or a phase cue. No help in exam mode.
   */
  requestHint(input?: MentorInput): MentorUtterance | null {
    if (this.policy.mode === "exam") return null;
    const c = input ? this.tracker.update(input) : this.tracker.ctx;
    if (!c) return null;
    const order: Severity[] = ["safety", "technique", "efficiency"];
    const active = this.rules
      .filter((r) => (r.lab === "any" || r.lab === c.lab) && r.when(c))
      .sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
    const r = active[0];
    if (!r) {
      const u: MentorUtterance = { id: `u${++this.seq}`, tWall: c.tWall, ruleId: "hint", level: 3, text: phaseHint(c), anchor: "fluoro", severity: "technique", blocking: false, critical: false };
      this.log.push(u);
      for (const l of this.listeners) l(u);
      return u;
    }
    const s = this.stateOf(r.id);
    const next = clampLevel(Math.max(s.level + 1, 2), 4);
    s.level = next;
    s.lastStepT = c.tWall;
    return this.emit(r, next, c) ?? null;
  }

  /** The "show me" demonstrator is deferred (wave 3); this keeps the interface. */
  requestDemonstration(): { status: "deferred"; reason: string } {
    return { status: "deferred", reason: "The demonstrator needs the rod solver as a calibrated forward model (planned after S7's manoeuvre tests)." };
  }

  /** Progress noted from outside (a diagnostic run completed, a PCI step done). */
  noteProgress(t: number) {
    this.tracker.noteProgress(t);
  }
}

function clampLevel(x: number, max = 5): LadderLevel {
  return Math.max(0, Math.min(max, Math.round(x))) as LadderLevel;
}

function nearestLine(r: MentorRule, level: LadderLevel) {
  for (let l = level; l >= 1; l--) {
    const f = r.lines[l as Exclude<LadderLevel, 0>];
    if (f) return f;
  }
  for (let l = level + 1; l <= 5; l++) {
    const f = r.lines[l as Exclude<LadderLevel, 0>];
    if (f) return f;
  }
  return undefined;
}

/** A cue for the phase when nothing is wrong but the learner asks. */
function phaseHint(c: MentorCtx): string {
  if (c.lab === "pci") {
    if (!c.pci?.wireBranch) return "Shape the tip, then lead with the wire under fluoroscopy. Steer at each branch with small turns.";
    if (c.pci.deviceKind === "stent") return "Line the stent up on fresh contrast in your working view before you deploy.";
    return "Get the wire well distal, then think about what this lesion needs before a stent.";
  }
  switch (c.engagement) {
    case "ascending-aorta":
      return "You're above the sinuses. Bring the tip down to the level of the cusps first.";
    case "sinus-level":
      return "You're down at the valve plane. Come back up to the level of the cusps.";
    case "non-selective":
      return c.targetSide === "right" ? "From here, small clockwise turns with a slight withdrawal bring a right Judkins round to the ostium." : "Let the curve find the left cusp; small adjustments in height and torque, not big turns.";
    case "near-lm":
    case "near-rca":
      return "You're close. Make the tip point down the vessel rather than across it.";
    case "selective-lm":
    case "selective-rca":
      return "Seated. Look at the pressure, aspirate, then choose your first view.";
    default:
      return "Tell me what you see on the trace and on the image, then decide the next small move.";
  }
}
