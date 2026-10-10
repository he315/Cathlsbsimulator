// ---------------------------------------------------------------------------
// The revascularisation decision step (angio-decision-drills): a diagnostic
// session module that, in the stable multi-vessel scenarios of
// src/simulation/diagnosticScenarios/multivessel.ts, opens a decision after
// the study report has been submitted.
//
// The learner works through Brilakis's stable algorithm in order (symptoms,
// extent, previous CABG, diabetes, surgical candidacy, complexity, benefit
// against risk, preference) with the patient chart and the scenario's
// decision facts beside it, then chooses no revascularisation, PCI, CABG or
// the heart team. The answer is scored against
// src/content/decisions/revascStable.ts, and the reveal shows the
// algorithm's path with the lesson that teaches each step and the tips
// pci-plan-name-the-goal (the PCI plan) and diag-stop-for-heart-team (the
// close of the study).
//
// The module holds the step's state and gives a host everything it draws
// (questions, chart rows, the score, the reveal's tips); nothing in it is
// shown before the study report is in, and the truth (the algorithm's
// answer) only after the learner submits. It raises no event of its own.
// `raises` (read by the reachability report) declares the one live context
// the module stands in: the diagnostic lab's finish phase. The PCI 'plan'
// context the reveal reads tips from is synthetic (revascTipContexts); a
// diagnostic session never enters a PCI phase, so it is not declared.
// ---------------------------------------------------------------------------

import type { LabRaises } from "../../../content/lab/raisable/waiting";
import { TIP_BY_ID, tipsFor, type LabContext, type LabTip } from "../../../content/lab/tips";
import { chartRows, type ChartRow } from "../../../mentor/prebrief";
import {
  REVASC_OUTCOMES,
  STABLE_STEPS,
  STABLE_STEP_LABEL,
  STABLE_STEP_SOURCE,
  STEP_OPTIONS,
  revascRevealTips,
  revascTipContexts,
  scoreStable,
  vignetteRows,
  type RevascOutcome,
  type RevascSource,
  type StableAnswer,
  type StableScore,
  type StableStep,
  type StableVignette,
} from "../../../content/decisions/revascStable";
import { vignettes as MULTIVESSEL_VIGNETTES } from "../../../simulation/diagnosticScenarios/multivessel";
import type { DiagnosticLabSession } from "../labSession";
import type { SessionModule, SessionModuleFactory } from "./index";

/** The module's id in the session. */
export const REVASC_MODULE_ID = "revasc-decision";

/** One question of the decision step, as a host draws it. */
export interface DecisionQuestion {
  step: StableStep;
  label: string;
  options: readonly { id: string; label: string }[];
  source: RevascSource;
}

/** Every question of the algorithm, in Brilakis's order (the host shows them all; the score reads the ones the case reaches). */
export const DECISION_QUESTIONS: readonly DecisionQuestion[] = STABLE_STEPS.map((step) => ({ step, label: STABLE_STEP_LABEL[step], options: STEP_OPTIONS[step], source: STABLE_STEP_SOURCE[step] }));

export class RevascDecision implements SessionModule {
  readonly id = REVASC_MODULE_ID;
  /** the scenario the case was built from, when it carries a decision */
  scenarioId: string | null = null;
  vignette: StableVignette | null = null;
  private session: DiagnosticLabSession | null = null;
  private answer: StableAnswer = { steps: {}, outcome: null };
  private result: StableScore | null = null;

  constructor(private readonly lookup: (scenarioId: string) => StableVignette | undefined = (id) => MULTIVESSEL_VIGNETTES[id]) {}

  attach(session: DiagnosticLabSession) {
    this.session = session;
    const id = session.store.getState().caseData.scenarioId ?? null;
    this.vignette = (id && this.lookup(id)) || null;
    this.scenarioId = this.vignette ? id : null;
    return () => {
      this.session = null;
    };
  }

  /** The case carries a revascularisation decision. */
  applies(): boolean {
    return !!this.vignette;
  }

  /** The decision step is open: the case carries one and its study report has been submitted. */
  isOpen(): boolean {
    return this.applies() && !!this.session?.store.getState().studyReport;
  }

  /** The patient chart and the decision's chart facts (shown with the step, so empty until it opens; nothing from the study). */
  chart(): ChartRow[] {
    if (!this.isOpen() || !this.vignette || !this.session) return [];
    const c = this.session.store.getState().caseData.chart;
    return [...(c ? chartRows(c) : []), ...vignetteRows(this.vignette)];
  }

  /** The learner's answers so far. */
  answers(): StableAnswer {
    return { steps: { ...this.answer.steps }, outcome: this.answer.outcome };
  }

  /** Answer one question (ignored once submitted or before the step opens). */
  setStep(step: StableStep, option: string) {
    if (!this.isOpen() || this.result) return;
    if (!STEP_OPTIONS[step].some((o) => o.id === option)) return;
    this.answer = { ...this.answer, steps: { ...this.answer.steps, [step]: option } };
    this.session?.notify();
  }

  /** Choose the recommendation (ignored once submitted or before the step opens). */
  choose(outcome: RevascOutcome) {
    if (!this.isOpen() || this.result || !REVASC_OUTCOMES.includes(outcome)) return;
    this.answer = { ...this.answer, outcome };
    this.session?.notify();
  }

  /** Submit the decision: the score against the algorithm, or null when the step is not open or no recommendation is chosen. */
  submit(): StableScore | null {
    if (this.result) return this.result;
    if (!this.isOpen() || !this.vignette || !this.answer.outcome) return null;
    this.result = scoreStable(this.vignette.inputs, this.answers());
    this.session?.notify();
    return this.result;
  }

  /** The score once submitted (the algorithm's answer is never available before). */
  score(): StableScore | null {
    return this.result;
  }

  /** The case's events, which the decision's tip contexts carry. */
  private caseEvents(): NonNullable<LabContext["events"]> {
    return [...(this.session?.store.getState().caseData.events ?? [])];
  }

  /**
   * The contexts the decision is made in: the PCI plan (lab 'pci', phase 'plan') and the close of the
   * diagnostic study (the session's own context, at phase 'finish' once the study is finished or the finish
   * step is open).
   */
  contexts(): { plan: LabContext; finish: LabContext } {
    const events = this.caseEvents();
    const own = this.session?.tipContext();
    return { plan: revascTipContexts(events).plan, finish: own && own.phase === "finish" ? own : revascTipContexts(events).finish };
  }

  /** The tips the reveal shows (after submission only). */
  revealTips(): LabTip[] {
    if (!this.result || !this.vignette) return [];
    const x = this.vignette.inputs.extent;
    return revascRevealTips({ tipsFor, byId: TIP_BY_ID }, { events: this.caseEvents(), multivessel: x.vessels >= 2 || x.leftMain });
  }
}

/** The decision module of a session, if the session has one. */
export function revascDecisionOf(session: Pick<DiagnosticLabSession, "modules">): RevascDecision | null {
  return (session.modules.find((m) => m.id === REVASC_MODULE_ID) as RevascDecision | undefined) ?? null;
}

/** A factory with its own vignette lookup (tests pass fixtures). */
export function createRevascDecisionModule(lookup?: (scenarioId: string) => StableVignette | undefined): SessionModuleFactory {
  return () => new RevascDecision(lookup);
}

export const createSessionModule: SessionModuleFactory = createRevascDecisionModule();

/**
 * The decision is made at the close of the diagnostic study. The PCI plan context of the reveal is not a live
 * phase of this session, so it is not declared here (pciEvents/base.ts raises every PCI phase).
 */
export const raises: readonly LabRaises[] = [{ lab: "diagnostic", phases: ["finish"], events: [] }];
