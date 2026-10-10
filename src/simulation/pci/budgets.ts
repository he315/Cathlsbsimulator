// ---------------------------------------------------------------------------
// Contrast and radiation budgets, announcements and stop-or-continue
// checkpoints for the PCI lab (pci-budgets-stop-rules).
//
// The contrast ceiling comes from the shared contrast module
// (src/simulation/patient/contrastBudget.ts): the plan's value when the brief
// set one and it is lower, otherwise the stricter of Brilakis (3.7 × GFR; in
// CTO PCI 3.7 × the estimated creatinine clearance) and Oxford (5–7 mL/kg),
// with recent contrast (a CT, the diagnostic study the same day) subtracted.
// Below an eGFR of 30 the ceiling is the creatinine clearance in mL, as
// Brilakis advises for advanced kidney disease (contrastBudget's advisory).
//
// BudgetTracker follows one case: every millilitre (the syringes, the
// microcatheter injections and OCT flushes the session books, and contrast
// handed over from earlier in the same case), the reference air kerma, the
// kerma-area product, fluoroscopy time, cine runs, the dose rate and the
// elapsed time (a fatigue counter for long cases). It returns
//  - the announcements the team makes (a radiographer line): the contrast
//    total at 50% and 100% of the ceiling, the air kerma at each 1 Gy and the
//    elapsed time every 30 minutes, each with the other totals alongside, and
//    the sentinel level;
//  - the stop-or-continue checkpoints: at the warning threshold (80% of the
//    ceiling), at the ceiling, and at the air kerma limit (5 Gy by default).
//    The learner states progress and decides (continue with a named next
//    step, change strategy, bail out, stage, stop); judgeCheckpoint scores the
//    decision against the module text;
//  - whether 'high-contrast-volume' (from the warning threshold on) and
//    'high-radiation-dose' (air kerma at the limit, or another substantial
//    radiation dose level of DOSE_TRIGGERS) are raised. Both stay raised.
//
// Sources (module text, src/content/manual/...):
//  - 1 Gy and 30-minute calls: Brilakis 28.2.2.4.8, complication-management/
//    01-principles-closure.ts:386 and 05-patient-complications.ts:564 (Oxford:
//    the radiographer warns at 1 Gy). Announcing the contrast total at the
//    same points is the module's own extension (01-principles-closure.ts:386).
//  - Air kerma limit: usually stop above 5–7 Gy (Brilakis 2.5); CTO: above
//    5 Gy without crossing or substantial progress; above 15 Gy a sentinel
//    event (01-principles-closure.ts:263 and :400).
//  - Dose rate: act above 20 mGy/min (05-patient-complications.ts:672).
//  - Judging the decisions: 01-planning.ts:1692 (approaching the ceiling is
//    the time to stop or stage), 05-patient-complications.ts:567 (usually
//    stopped above 5–7 Gy; staging is legitimate), 01-principles-closure.ts:1292
//    (a CTO above 5 Gy without progress: stop or STAR; a change of strategy
//    does not erase the dose), complex-pci/09-cto-strategy.ts:929 (a CTO
//    already crossed is completed economically).
// MODEL PARAMETERS (docs/realism/facts/pkg-pci-budgets-stop-rules.md): which
// thresholds open a checkpoint, the decisions offered, and the carried totals
// of the 'long-case' variant.
// ---------------------------------------------------------------------------

import { CONTRAST_BUDGET_DEFAULTS, CONTRAST_RULE_SOURCES, contrastBudget, crossedPoints, type ContrastBudget, type ContrastRule, type RuleSource } from "../patient/contrastBudget";
import { DOSE_TRIGGERS } from "../dose";

// --- defaults and sources ------------------------------------------------------------------------

/** Defaults; each is sourced in the comment or labelled MODEL PARAMETER. Every one is configurable (BudgetConfig). */
export const BUDGET_DEFAULTS = {
  /** air kerma at which the radiation limit applies, mGy (sourced: 5 Gy, the lower end of Brilakis's 5–7 Gy; the CTO rule's 5 Gy) */
  radiationLimitMGy: 5000,
  /** air kerma of the sentinel level, mGy (sourced: more than 15 Gy) */
  sentinelMGy: 15000,
  /** an air kerma call at each of these steps, mGy (sourced: each 1 Gy) */
  announceKarStepMGy: 1000,
  /** an elapsed-time call this often, s (sourced: each 30 minutes) */
  announceEveryS: 1800,
  /** a dose rate above this is high, mGy/min (sourced: act above 20 mGy/min) */
  doseRateHighMGyMin: 20,
};

export const BUDGET_SOURCES = {
  radiationLimit: { book: "Brilakis 2.5 and 21.8 (CTO)", where: "complication-management/01-principles-closure.ts:400" },
  sentinel: { book: "Brilakis 2.5 and 28.2.1", where: "complication-management/01-principles-closure.ts:400" },
  doseCall: { book: "Brilakis 28.2.2.4.8; Oxford (the radiographer warns at 1 Gy)", where: "complication-management/05-patient-complications.ts:564" },
  contrastCall: { book: "this module's extension of the dose call", where: "complication-management/01-principles-closure.ts:386" },
  doseRate: { book: "Brilakis 28.2", where: "complication-management/05-patient-complications.ts:672" },
  stopOrStage: { book: "Brilakis 2.6 and 1.1", where: "pci-manual/01-planning.ts:1692" },
  doseStop: { book: "Brilakis 2.5 and 28.2", where: "complication-management/05-patient-complications.ts:567" },
  ctoNoProgress: { book: "Brilakis (CTO stopping rules)", where: "complication-management/01-principles-closure.ts:1292" },
  ctoCrossed: { book: "Brilakis 21.8", where: "complex-pci/09-cto-strategy.ts:929" },
} satisfies Record<string, RuleSource>;

// --- the ceiling ------------------------------------------------------------------------------------

/** The patient facts the ceiling reads. */
export interface BudgetPatient {
  /** eGFR, mL/min/1.73 m² */
  egfr: number;
  /** calculated creatinine clearance, mL/min (the CTO rule and the advanced-CKD ceiling) */
  crclMlMin?: number;
  weightKg: number;
  /** a single kidney: the rules' figure is a maximum, and lower is advised (no figure is given) */
  singleKidney?: boolean;
  /** contrast before today's procedure or earlier today (a CT, the diagnostic study), counted against the ceiling */
  recent?: { ml: number; daysAgo: number }[];
}

export interface BudgetConfig {
  /** CTO PCI: Brilakis's rule uses the creatinine clearance */
  cto?: boolean;
  /** the ceiling agreed at the brief, mL (used when lower than the rule) */
  planContrastMl?: number;
  /** the air kerma limit agreed at the brief, mGy (default BUDGET_DEFAULTS.radiationLimitMGy) */
  karLimitMGy?: number;
  /** contrast given earlier in this case (a full-case diagnostic study handed over), mL: counted as used */
  handedOverMl?: number;
  /** the warning threshold as a fraction of the ceiling (default the shared 0.8) */
  warnFraction?: number;
  /** the contrast announcement points, fractions of the ceiling (default the shared 0.5 and 1) */
  announceAt?: number[];
  announceKarStepMGy?: number;
  announceEveryS?: number;
  /**
   * The team may name the rule's ceiling in its calls and at the checkpoint (default true). Off where the
   * screens show no ground truth (no teaching aids): the calls then give the volume only, unless the ceiling
   * in force is the learner's own figure from the plan.
   */
  announceCeiling?: boolean;
}

/** The carry for a launch's variant id, only for a scenario that declares that variant. */
export function budgetCarryFor(scenarioId: string, variant: string | null | undefined): BudgetCarry | null {
  const c = variant ? BUDGET_CARRY_VARIANTS[variant] : undefined;
  return c && c.scenarios.includes(scenarioId) ? c : null;
}

/** Which rule set the ceiling in force. */
export type CeilingSource = ContrastRule["id"] | "advanced-ckd-below-crcl" | "plan";

export interface ContrastCeiling {
  budget: ContrastBudget;
  ceilingMl: number;
  source: CeilingSource;
  /** the rule in words, with its manual */
  label: string;
  sourceRef: RuleSource | null;
  /** the stricter rule's ceiling (before a plan), mL: what the brief should not exceed */
  ruleMl: number;
  notes: string[];
}

const round1 = (x: number) => Math.round(x * 10) / 10;

/**
 * The contrast ceiling for a patient: the shared module's stricter rule (or the plan, when lower), and
 * below an eGFR of 30 no more than the creatinine clearance in mL, with recent contrast subtracted.
 */
export function contrastCeiling(p: BudgetPatient, c: BudgetConfig = {}, usedMl = 0): ContrastCeiling {
  const input = {
    egfr: p.egfr,
    crclMlMin: p.crclMlMin,
    weightKg: p.weightKg,
    cto: c.cto,
    recent: p.recent,
    usedMl,
    warnFraction: c.warnFraction,
    announceAt: c.announceAt,
  };
  const rule = contrastBudget(input);
  let budget = c.planContrastMl && c.planContrastMl > 0 ? contrastBudget({ ...input, planMl: c.planContrastMl }) : rule;
  let ruleMl = rule.ceilingMl;
  let source: CeilingSource = budget.ceilingMl < rule.ceilingMl ? "plan" : rule.stricter.id;
  let label = source === "plan" ? `the plan's ceiling (${round1(budget.ceilingMl)} mL)` : rule.stricter.label;
  let sourceRef: RuleSource | null = source === "plan" ? null : rule.stricter.source;
  const adv = rule.advisories.find((a) => a.id === "advanced-ckd-below-crcl");
  if (adv) {
    const limit = round1(Math.max(0, adv.limitMl - rule.recentMl));
    if (limit < ruleMl) ruleMl = limit;
    if (limit < budget.ceilingMl) {
      budget = contrastBudget({ ...input, planMl: limit });
      source = "advanced-ckd-below-crcl";
      label = "Brilakis: eGFR below 30, less contrast (mL) than the creatinine clearance (mL/min)";
      sourceRef = adv.source;
    }
  }
  const notes: string[] = [];
  if (rule.recentMl > 0) notes.push(`${round1(rule.recentMl)} mL of recent contrast counted against the ceiling.`);
  if (p.singleKidney) notes.push("Single kidney: plan below the rule; neither manual gives a figure.");
  const ox = rule.rules.find((r) => r.id === "oxford-weight");
  if (ox && rule.stricter.id !== "oxford-weight") notes.push(`${ox.label} for comparison: ${ox.availableMl} mL.`);
  return { budget, ceilingMl: budget.ceilingMl, source, label, sourceRef, ruleMl, notes };
}

// --- the 'long-case' variant ------------------------------------------------------------------------

/** Totals a variant opens with: the attempt has already run this long (a long CTO case). */
export interface BudgetCarry {
  id: string;
  title: string;
  /** the scenarios that declare this variant (their launch files add it); any other scenario carries nothing */
  scenarios: readonly string[];
  karMGy: number;
  fluoroS: number;
  /** contrast already used in this attempt, mL */
  contrastMl: number;
  /** minutes already spent, s */
  elapsedS: number;
}

/**
 * Variants (seeds) that open the case part-way through a long attempt. MODEL PARAMETERS: teaching values
 * chosen so that the 5 Gy limit is reached within the session (0.5 Gy left) while the contrast and the
 * fluoroscopy time stay below their own limits; not from a source. The kerma-area product is not carried.
 */
export const BUDGET_CARRY_VARIANTS: Readonly<Record<string, BudgetCarry>> = {
  "long-case": { id: "long-case", title: "Long attempt: 100 minutes in, 4.5 Gy", scenarios: ["rca-cto"], karMGy: 4500, fluoroS: 2400, contrastMl: 150, elapsedS: 6000 },
};

// --- tracking ---------------------------------------------------------------------------------------

/** One reading of the case's totals (the session takes one four times a second). */
export interface BudgetReading {
  /** lab seconds */
  t: number;
  /** contrast given in this lab, mL (the syringes and the engine's own injections) */
  contrastMl: number;
  karMGy: number;
  kapGyCm2?: number;
  fluoroS?: number;
  cineRuns?: number;
  peakSkinMGy?: number;
  /** air kerma rate now, mGy/min */
  doseRateMGyMin?: number;
  /** the target has been crossed by the wire (the CTO progress state) */
  crossed?: boolean;
}

export type AnnouncementKind = "contrast" | "air-kerma" | "elapsed" | "sentinel";

export interface BudgetAnnouncement {
  kind: AnnouncementKind;
  t: number;
  /** the radiographer's line */
  text: string;
  contrastMl: number;
  karMGy: number;
  elapsedS: number;
  source: RuleSource;
}

export type CheckpointReason = "contrast-warning" | "contrast-ceiling" | "radiation-limit";
export type CheckpointDecision = "continue" | "change-strategy" | "bail-out" | "stage" | "stop";
export type ProgressClaim = "crossed" | "progress" | "no-progress";

export const CHECKPOINT_DECISIONS: readonly { id: CheckpointDecision; label: string; title: string; ctoOnly?: boolean }[] = [
  { id: "continue", label: "Continue", title: "Carry on with a named next step" },
  { id: "change-strategy", label: "Change strategy", title: "A different wire, device or approach" },
  { id: "bail-out", label: "Bail out", title: "End the crossing attempt with a bail-out (STAR without a stent)", ctoOnly: true },
  { id: "stage", label: "Stage", title: "Finish the lesion in hand and stage the rest for another day" },
  { id: "stop", label: "Stop", title: "End the attempt now and plan a repeat" },
];

export const PROGRESS_CLAIMS: readonly { id: ProgressClaim; label: string }[] = [
  { id: "crossed", label: "Crossed" },
  { id: "progress", label: "Making progress" },
  { id: "no-progress", label: "No progress" },
];

export interface CheckpointAnswer {
  decision: CheckpointDecision;
  progress: ProgressClaim;
  /** the named next step (continue, change of strategy) */
  nextStep?: string;
}

/** The numbers at a checkpoint (what the debrief shows beside the decision). */
export interface CheckpointNumbers {
  contrastMl: number;
  ceilingMl: number;
  karMGy: number;
  karLimitMGy: number;
  elapsedS: number;
  crossed: boolean;
}

export interface BudgetCheckpoint {
  id: string;
  reason: CheckpointReason;
  t: number;
  /** what the team says when it opens */
  text: string;
  at: CheckpointNumbers;
  sources: RuleSource[];
  answer: (CheckpointAnswer & { t: number } & CheckpointJudgement) | null;
}

/** How a decision is judged: whether it follows the rule, what the rule expects, and its source. */
export interface CheckpointJudgement {
  correct: boolean;
  expected: string;
  source: RuleSource;
  /** the judgement rests on the learner's own claim (CTO progress), so the decision is not scored */
  unscored?: boolean;
}

/** The budget as the snapshot, the event source and the counters read it. */
export interface BudgetReadout {
  contrast: {
    /** contrast in this lab, mL */
    labMl: number;
    handedOverMl: number;
    /** handed-over plus this lab's, mL */
    totalMl: number;
    ceilingMl: number;
    source: CeilingSource;
    label: string;
    sourceRef: RuleSource | null;
    ruleMl: number;
    planMl: number | null;
    /** the ceiling in force is the learner's own figure from the plan (it may be named on screen and in the calls) */
    agreed: boolean;
    fraction: number;
    warnAtMl: number;
    status: "ok" | "warn" | "over";
    /** the warning threshold has been crossed this case (held from then on) */
    warned: boolean;
    notes: string[];
  };
  radiation: {
    karMGy: number;
    kapGyCm2: number;
    fluoroS: number;
    cineRuns: number;
    doseRateMGyMin: number;
    doseRateHigh: boolean;
    limitMGy: number;
    /** the limit (or another substantial radiation dose level) has been reached this case (held) */
    high: boolean;
  };
  /** elapsed time of the attempt, s (carried time included): the fatigue counter */
  elapsedS: number;
  /** CTO progress: the case is a CTO, and whether the target has been crossed */
  progress: { cto: boolean; crossed: boolean };
  pending: BudgetCheckpoint | null;
}

export interface BudgetUpdate {
  announcements: BudgetAnnouncement[];
  /** checkpoints opened by this reading */
  opened: BudgetCheckpoint[];
  /** 'high-contrast-volume' starts now */
  contrastWarned: boolean;
  /** 'high-radiation-dose' starts now */
  radiationHigh: boolean;
}

const gy = (mGy: number) => {
  const g = mGy / 1000;
  return Number.isInteger(g) ? String(g) : g.toFixed(1);
};
const minutes = (s: number) => Math.round(s / 60);

/** The radiation level beyond the air kerma: another substantial radiation dose level of DOSE_TRIGGERS. */
function otherDoseLevel(r: BudgetReading): boolean {
  return (r.kapGyCm2 ?? 0) >= DOSE_TRIGGERS.kapGyCm2 || (r.fluoroS ?? 0) / 60 >= DOSE_TRIGGERS.fluoroMin || (r.peakSkinMGy ?? 0) >= DOSE_TRIGGERS.peakSkinMGy;
}

/**
 * The total is at or above a contrast threshold. With no ceiling left (recent contrast has used it all) any
 * contrast is over.
 */
function atOrOver(b: ContrastBudget, total: number, thresholdMl: number): boolean {
  return b.ceilingMl > 0 ? total >= thresholdMl : total > 0;
}

export interface BudgetTrackerOptions {
  /** time already spent before this lab (a carried long case), s */
  elapsedOffsetS?: number;
}

/** One case's budgets: call update() with each reading. */
export class BudgetTracker {
  readonly patient: BudgetPatient;
  config: BudgetConfig;
  readonly announcements: BudgetAnnouncement[] = [];
  readonly checkpoints: BudgetCheckpoint[] = [];
  private ceiling: ContrastCeiling;
  private last: BudgetReading = { t: 0, contrastMl: 0, karMGy: 0 };
  private readonly elapsedOffsetS: number;
  private warned = false;
  private high = false;
  private karCalls = 0;
  private timeCalls = 0;
  private sentinelCalled = false;
  private opened = new Set<CheckpointReason>();
  private seq = 0;

  constructor(patient: BudgetPatient, config: BudgetConfig = {}, o: BudgetTrackerOptions = {}) {
    this.patient = patient;
    this.config = { ...config };
    this.elapsedOffsetS = Math.max(0, o.elapsedOffsetS ?? 0);
    this.ceiling = contrastCeiling(patient, this.config, this.handedOverMl());
    this.timeCalls = Math.floor(this.elapsedOffsetS / this.everyS());
  }

  private handedOverMl(): number {
    return Math.max(0, this.config.handedOverMl ?? 0);
  }
  private karStep(): number {
    return this.config.announceKarStepMGy ?? BUDGET_DEFAULTS.announceKarStepMGy;
  }
  private everyS(): number {
    return this.config.announceEveryS ?? BUDGET_DEFAULTS.announceEveryS;
  }
  /** The air kerma limit in force, mGy. */
  karLimitMGy(): number {
    const v = this.config.karLimitMGy;
    return v !== undefined && v > 0 ? v : BUDGET_DEFAULTS.radiationLimitMGy;
  }

  /** The ceiling in force is the plan's own figure (the plan is at or below the rule). */
  ceilingAgreed(): boolean {
    const p = this.config.planContrastMl;
    return p !== undefined && p > 0 && Math.abs(this.ceiling.ceilingMl - round1(p)) < 0.05;
  }

  /** The calls and the checkpoint may name the ceiling: the teaching aids allow it, or it is the learner's own figure. */
  private namesCeiling(): boolean {
    return this.config.announceCeiling !== false || this.ceilingAgreed();
  }

  /** Total contrast for a reading (handed-over plus this lab's), mL. */
  totalMl(r: BudgetReading = this.last): number {
    return this.handedOverMl() + Math.max(0, r.contrastMl);
  }

  elapsedS(r: BudgetReading = this.last): number {
    return this.elapsedOffsetS + Math.max(0, r.t);
  }

  /** The ceiling in force now. */
  contrastCeiling(): ContrastCeiling {
    return contrastCeiling(this.patient, this.config, this.totalMl());
  }

  /** The limits agreed at the brief (a ceiling in mL, an air kerma in mGy). Thresholds already passed are not announced again. */
  setPlan(p: { contrastMl?: number | null; karLimitMGy?: number | null }) {
    const next: BudgetConfig = { ...this.config };
    if (p.contrastMl !== undefined) next.planContrastMl = p.contrastMl && p.contrastMl > 0 ? p.contrastMl : undefined;
    if (p.karLimitMGy !== undefined) next.karLimitMGy = p.karLimitMGy && p.karLimitMGy > 0 ? p.karLimitMGy : undefined;
    this.config = next;
    this.ceiling = contrastCeiling(this.patient, this.config, this.totalMl());
  }

  /**
   * Take a starting reading without announcing (a hand-over or a carried long case): the calls already
   * passed are not made again and no checkpoint opens for them. The raised events are still raised.
   */
  prime(r: BudgetReading): BudgetUpdate {
    const step = this.karStep();
    this.karCalls = Math.floor(Math.max(0, r.karMGy) / step);
    this.timeCalls = Math.floor(this.elapsedS(r) / this.everyS());
    this.sentinelCalled = r.karMGy >= BUDGET_DEFAULTS.sentinelMGy;
    const total = this.totalMl(r);
    this.ceiling = contrastCeiling(this.patient, this.config, total);
    const b = this.ceiling.budget;
    if (atOrOver(b, total, b.warnAtMl)) this.opened.add("contrast-warning");
    if (atOrOver(b, total, b.ceilingMl)) this.opened.add("contrast-ceiling");
    if (r.karMGy >= this.karLimitMGy()) this.opened.add("radiation-limit");
    this.last = { ...r };
    return this.raiseEvents(r, b);
  }

  private raiseEvents(r: BudgetReading, b: ContrastBudget): BudgetUpdate {
    const out: BudgetUpdate = { announcements: [], opened: [], contrastWarned: false, radiationHigh: false };
    const total = this.totalMl(r);
    if (!this.warned && atOrOver(b, total, b.warnAtMl)) {
      this.warned = true;
      out.contrastWarned = true;
    }
    if (!this.high && (r.karMGy >= this.karLimitMGy() || otherDoseLevel(r))) {
      this.high = true;
      out.radiationHigh = true;
    }
    return out;
  }

  /** A new reading: the announcements due, the checkpoints opened and the events that start now. */
  update(r: BudgetReading): BudgetUpdate {
    const prev = this.last;
    const prevTotal = this.totalMl(prev);
    const total = this.totalMl(r);
    this.ceiling = contrastCeiling(this.patient, this.config, total);
    const b = this.ceiling.budget;
    const out = this.raiseEvents(r, b);
    const elapsed = this.elapsedS(r);
    const totals = () => `contrast ${Math.round(total)} millilitres`;
    const say = (kind: AnnouncementKind, text: string, source: RuleSource) => {
      const a: BudgetAnnouncement = { kind, t: r.t, text, contrastMl: round1(total), karMGy: Math.round(r.karMGy), elapsedS: Math.round(elapsed), source };
      out.announcements.push(a);
      this.announcements.push(a);
    };
    // contrast: the announcement points and the warning threshold crossed since the last reading
    const announce = this.config.announceAt ?? CONTRAST_BUDGET_DEFAULTS.announceAt;
    const crossed = total > prevTotal ? crossedPoints(b, prevTotal, total) : [];
    const agreed = this.ceilingAgreed();
    const named = this.namesCeiling();
    for (const f of crossed) {
      if (!announce.includes(f)) continue;
      const ml = `Contrast ${Math.round(total)} millilitres`;
      const ceiling = agreed ? `the agreed ceiling of ${Math.round(b.ceilingMl)}` : "the ceiling";
      say("contrast", !named ? `${ml}.` : f >= 1 ? `${ml}: that is ${ceiling}.` : `${ml}, ${Math.round(f * 100)} per cent of ${ceiling}.`, BUDGET_SOURCES.contrastCall);
    }
    // the checkpoints at the warning threshold and the ceiling, each from its own test (whatever the calls)
    if (atOrOver(b, total, b.warnAtMl)) this.open("contrast-warning", r, out);
    if (atOrOver(b, total, b.ceilingMl)) this.open("contrast-ceiling", r, out);
    // air kerma: a call at each step, with the time and the contrast alongside
    const calls = Math.floor(Math.max(0, r.karMGy) / this.karStep());
    if (calls > this.karCalls) {
      this.karCalls = calls;
      say("air-kerma", `Air kerma ${gy(calls * this.karStep())} gray, ${minutes(elapsed)} minutes, ${totals()}.`, BUDGET_SOURCES.doseCall);
    }
    if (!this.sentinelCalled && r.karMGy >= BUDGET_DEFAULTS.sentinelMGy) {
      this.sentinelCalled = true;
      say("sentinel", `Air kerma is past ${gy(BUDGET_DEFAULTS.sentinelMGy)} gray: the sentinel level.`, BUDGET_SOURCES.sentinel);
    }
    if (r.karMGy >= this.karLimitMGy()) this.open("radiation-limit", r, out);
    // elapsed time: a call every 30 minutes, with the dose and the contrast
    const tc = Math.floor(elapsed / this.everyS());
    if (tc > this.timeCalls) {
      this.timeCalls = tc;
      say("elapsed", `${minutes(tc * this.everyS())} minutes in. Air kerma ${gy(Math.round(r.karMGy / 100) * 100)} gray, ${totals()}.`, BUDGET_SOURCES.doseCall);
    }
    this.last = { ...r };
    return out;
  }

  private open(reason: CheckpointReason, r: BudgetReading, out: BudgetUpdate) {
    if (this.opened.has(reason)) return;
    this.opened.add(reason);
    const b = this.ceiling.budget;
    const at: CheckpointNumbers = {
      contrastMl: round1(this.totalMl(r)),
      ceilingMl: b.ceilingMl,
      karMGy: Math.round(r.karMGy),
      karLimitMGy: this.karLimitMGy(),
      elapsedS: Math.round(this.elapsedS(r)),
      crossed: !!r.crossed,
    };
    // the radiation checkpoint carries the totals (it is the one line spoken when the air kerma call falls with it)
    const text =
      reason === "radiation-limit"
        ? `Air kerma ${gy(at.karMGy)} gray, ${minutes(at.elapsedS)} minutes, contrast ${Math.round(at.contrastMl)} millilitres: we are at the radiation limit. Where are we, and what next?`
        : !this.namesCeiling()
          ? `Contrast ${Math.round(at.contrastMl)} millilitres. Where are we, and what next?`
          : reason === "contrast-ceiling"
            ? `Contrast ${Math.round(at.contrastMl)} millilitres: we are at the ceiling. Where are we, and what next?`
            : `Contrast ${Math.round(at.contrastMl)} millilitres: we are close to the ceiling. Where are we, and what next?`;
    const sources: RuleSource[] =
      reason === "radiation-limit" ? [BUDGET_SOURCES.radiationLimit, BUDGET_SOURCES.doseStop] : [this.ceiling.sourceRef ?? CONTRAST_RULE_SOURCES[this.ceiling.budget.stricter.id], BUDGET_SOURCES.stopOrStage];
    const cp: BudgetCheckpoint = { id: `${reason}-${++this.seq}`, reason, t: r.t, text, at, sources, answer: null };
    this.checkpoints.push(cp);
    out.opened.push(cp);
  }

  /** The first checkpoint not yet answered, or null. */
  pending(): BudgetCheckpoint | null {
    return this.checkpoints.find((c) => !c.answer) ?? null;
  }

  /** Answer the pending checkpoint; returns it, judged, or null when none is pending. */
  answer(a: CheckpointAnswer, t: number): BudgetCheckpoint | null {
    const cp = this.pending();
    if (!cp) return null;
    const j = judgeCheckpoint(cp, a, !!this.config.cto);
    cp.answer = { ...a, nextStep: a.nextStep?.trim() || undefined, t, ...j };
    return cp;
  }

  /** The 'high-contrast-volume' and 'high-radiation-dose' states (held once reached). */
  raised(): { contrast: boolean; radiation: boolean } {
    return { contrast: this.warned, radiation: this.high };
  }

  readout(o: { cto?: boolean; crossed?: boolean } = {}): BudgetReadout {
    const r = this.last;
    const c = this.ceiling;
    const b = c.budget;
    const rate = r.doseRateMGyMin ?? 0;
    return {
      contrast: {
        labMl: round1(Math.max(0, r.contrastMl)),
        handedOverMl: round1(this.handedOverMl()),
        totalMl: round1(this.totalMl(r)),
        ceilingMl: c.ceilingMl,
        source: c.source,
        label: c.label,
        sourceRef: c.sourceRef,
        ruleMl: c.ruleMl,
        planMl: this.config.planContrastMl ?? null,
        agreed: this.ceilingAgreed(),
        fraction: b.fraction,
        warnAtMl: b.warnAtMl,
        status: b.status,
        warned: this.warned,
        notes: c.notes,
      },
      radiation: {
        karMGy: Math.round(r.karMGy),
        kapGyCm2: Math.round((r.kapGyCm2 ?? 0) * 10) / 10,
        fluoroS: Math.round(r.fluoroS ?? 0),
        cineRuns: r.cineRuns ?? 0,
        doseRateMGyMin: Math.round(rate * 10) / 10,
        doseRateHigh: rate > BUDGET_DEFAULTS.doseRateHighMGyMin,
        limitMGy: this.karLimitMGy(),
        high: this.high,
      },
      elapsedS: Math.round(this.elapsedS(r)),
      progress: { cto: o.cto ?? !!this.config.cto, crossed: o.crossed ?? !!r.crossed },
      pending: this.pending(),
    };
  }
}

// --- judging a decision -------------------------------------------------------------------------------

const DECISION_LABEL: Record<CheckpointDecision, string> = {
  continue: "continue",
  "change-strategy": "change strategy",
  "bail-out": "bail out",
  stage: "stage",
  stop: "stop",
};

/**
 * Whether a checkpoint decision follows the module text. The warning threshold asks only for an explicit
 * decision; at the ceiling, stop or stage (or bail out of a CTO); at the air kerma limit, stop or stage,
 * and in a CTO not yet crossed stop or bail out (a change of strategy does not erase the dose), while a
 * CTO already crossed is completed economically.
 */
export function judgeCheckpoint(cp: Pick<BudgetCheckpoint, "reason" | "at">, a: CheckpointAnswer, cto: boolean): CheckpointJudgement {
  const one = (ok: CheckpointDecision[], source: RuleSource) => ({ correct: ok.includes(a.decision), expected: ok.map((d) => DECISION_LABEL[d]).join(" or "), source });
  if (cp.reason === "contrast-warning") return { correct: true, expected: "an explicit decision (finish economically, stage or stop)", source: BUDGET_SOURCES.stopOrStage };
  if (cp.reason === "contrast-ceiling") return one(cto ? ["stop", "bail-out", "stage"] : ["stop", "stage"], BUDGET_SOURCES.stopOrStage);
  if (cto && cp.at.crossed) return one(["continue"], BUDGET_SOURCES.ctoCrossed);
  // the CTO rule stops above 5 Gy without crossing or substantial progress: progress the learner reports is not
  // measured by the lab, so that decision is not scored (marked correct, with the rule as the expectation)
  if (cto && a.progress === "progress") return { correct: true, expected: "stop or bail out unless there is substantial progress", source: BUDGET_SOURCES.ctoNoProgress, unscored: true };
  if (cto) return one(["stop", "bail-out"], BUDGET_SOURCES.ctoNoProgress);
  return one(["stage", "stop"], BUDGET_SOURCES.doseStop);
}

/** The decision in words, for the debrief. */
export function decisionLabel(d: CheckpointDecision): string {
  return DECISION_LABEL[d];
}
