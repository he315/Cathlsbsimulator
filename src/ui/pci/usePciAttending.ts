// ---------------------------------------------------------------------------
// The attending in the PCI lab (pci-attending), modelled on useAttending
// (src/ui/lab/useAttending.ts) for the diagnostic lab.
//
// One PciAttending per PciLabSession: a MentorEngine at the run's policy fed
// from the session through the PCI bridge (src/mentor/bridge/pciSession.ts),
// the session's ProcedureRecorder (lab 'pci') given 10 Hz frames and the
// engine's telemetry, and the case's workflow:
//
//   brief     the pre-brief: the case as the attending presents it, two to
//             four questions (PCI_PREBRIEFS)
//   plan      the plan form: one field per step of Brilakis's fourteen steps,
//             the complication forecast with a first move for each, the
//             support plan, the bail-out kit, the operator's state and (CTO)
//             the stopping rules; stored as a 'plan' event
//   timeout   the team time-out (timeOutItems('pci') and the pm-monitoring
//             items); one seeded team member may be absent and must be waited
//             for: the time-out is not run with anyone missing
//   case      the procedure, with the safety stops: the session's
//             beforeAction asks engine.preAction for advance-wire,
//             advance-device, inflate (deploy for an undeployed stent) and
//             inject; the beam waits for the time-out where the mode requires
//             one (visibility.timeOutRequired)
//   signout   the sign-out: equipment and sharps, wire integrity (one seeded
//             variant has a wire without its tip coil; finish is blocked in
//             every mode until it is recorded), anything left in place, the
//             antiplatelet regimen, the complications and their final state,
//             the tests after a complication and the classification under the
//             fifth universal definition, disclosure, the logbook fields. The
//             sign-out is still the live case ('Back to the case' returns to
//             it), so it lists only the complications the learner has
//             recognised (pci-cx-recognition), under the learner's own
//             assessment (in guided practice the others are an unnamed
//             count to assess first)
//   done      the PEARLS debrief: assessAttempt on the record, the plan
//             compared with the case, the run's decisions
//
// Modes: in guided practice and exams the brief, plan, time-out and sign-out
// are dialogues that hold the hands (beforeAction refuses operator actions
// while one is open, and the lab disables the input); in supervised and
// independent practice they are attending dialogue in the drawer and the
// hands keep working. The time-out and the sign-out are required in guided,
// supervised and exam modes (supervised, as the pm-monitoring-checklist and
// pm-planning launch links ask), optional in independent practice; the
// damaged-wire record is required in every mode. Safety stop thresholds are
// the same in every mode; only the attending's ladder differs (MentorEngine).
//
// The engine runs every rule except the diagnostic lab's stuck 'time-out' rule
// (its lines are about catheters and the root); the PCI group has its own
// (pci-stuck, src/mentor/rules/pci.ts), and a form being filled in counts as
// progress. In supervised and independent practice the first operator action
// while the brief, plan or time-out is open takes the case dialogue off the
// lab (the 'prebrief' modal closes, so the tips and the assessment prompts see
// the case), and the form stays in the drawer by its stage.
//
// The seeded draws and timings are MODEL PARAMETERS
// (docs/realism/facts/pkg-pci-attending.md).
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useReducer, useRef } from "react";
import { MentorEngine } from "../../mentor/mentor";
import { ALL_RULES } from "../../mentor/rules";
import { assessAttempt, utteranceData, type Assessment } from "../../mentor/index";
import type { MentorUtterance } from "../../mentor/types";
import type { DecisionRecord } from "../../mentor/ledger";
import { pciMetricNumbers, type PciMetrics } from "../../mentor/metrics";
import { withLedger, type DebriefModel } from "../../mentor/debrief";
import {
  classifyPmi,
  damagedWireResolved,
  emptySignOut,
  expectedForecast,
  expectedSupport,
  forecastMatches,
  gradeAnswers,
  guideFrenchNeeded,
  pciPlanVsExecution,
  pciTimeOutItems,
  PCI_TEAM_MEMBERS,
  signOutBlockers,
  type PciPlan,
  type PciPlanFacts,
  type PciSignOutState,
  type PciTeamMemberId,
  type PlanItem,
  type PmiClass,
  type PmiResult,
  type Prebrief,
} from "../../mentor/prebrief";
import { newPciBridgeMemory, pciCaseFacts, pciContrastBudget, pciFrameSample, pciMentorInput, pciPreActionFor, PciRecordForwarder, type PciBridgeMemory, type PciBridgeSource } from "../../mentor/bridge/pciSession";
import { FIRST_MOVE_FOR, PCI_PLAN_LESSONS, pciPlanDefaults, pciPlanFacts, prebriefForScenario } from "../../content/mentor/prebriefs";
import { rngFrom, rnd } from "../../simulation/pci/rng";
import { WIRE_SPEC, type WireKind } from "../../simulation/pci/equipment";
import { causeRecognised } from "../../simulation/complications/engine";
import type { Complication } from "../../simulation/complications/types";
import { CAUSES } from "./RecognitionForm";
import type { LabPolicy } from "../lab/visibility";
import type { PciAction, PciLabSession } from "./PciLabSession";

// --- model parameters (docs/realism/facts/pkg-pci-attending.md) -------------------------------

export const PCI_ATTENDING_PARAMS = {
  /** the attending's frame rate (Hz): the mentor steps and the recorder samples at the recorder's 10 Hz (MODEL PARAMETER) */
  stepHz: 10,
  /** chance a team member is out of the room when the time-out is due (MODEL PARAMETER) */
  absentChance: 0.5,
  /** lab seconds after the time-out opens that the absent member comes back (MODEL PARAMETER) */
  arrivalS: 20,
  /** chance that a case is the wire-integrity variant (a wire without its tip coil) (MODEL PARAMETER) */
  damagedWireChance: 0.25,
  /** the simulated result after a complication: chance of a troponin rise (MODEL PARAMETER) */
  troponinRiseAfterComplication: 0.85,
  /** after an uncomplicated case (MODEL PARAMETER) */
  troponinRiseUncomplicated: 0.3,
  /** chance of a clinical or ECG feature with a rise (MODEL PARAMETER) */
  clinicalFeature: 0.6,
  /** chance of a new wall-motion abnormality after a complication left untreated or with a residual (MODEL PARAMETER) */
  wallMotionResidual: 0.7,
  /** after a complication treated and resolved (MODEL PARAMETER) */
  wallMotionResolved: 0.25,
};

/** The engine complication kinds whose occurrence asks for the complications report and the classification (cm-principles-closure#8). */
export const PMI_COMPLICATION_KINDS = ["side-branch", "dissection", "no-reflow", "thrombus"] as const;

export type PciAttendingStage = "brief" | "plan" | "timeout" | "case" | "signout" | "done";

/** What the attending needs of a session (PciLabSession fits). */
export type PciAttendingSession = Pick<
  PciLabSession,
  | "s"
  | "g"
  | "st"
  | "engine"
  | "recorder"
  | "resolved"
  | "policy"
  | "snapshot"
  | "cArmAngles"
  | "wall"
  | "onStep"
  | "subscribe"
  | "openModal"
  | "closeModal"
  | "openModals"
  | "setFinishStep"
  | "setTimeOutDone"
  | "finish"
  | "field"
  | "lab"
  | "caseId"
  | "finished"
  | "result"
  | "beamMode"
  | "contrastPushed"
  | "setPedal"
> & { beforeAction: PciLabSession["beforeAction"]; beamGate: PciLabSession["beamGate"]; beforeInject: PciLabSession["beforeInject"] };

export interface PciAttendingOptions {
  /** the run's policy (default the session's) */
  policy?: LabPolicy;
  /** force the wire-integrity variant on or off (tests); default a seeded draw */
  damagedWire?: boolean;
  /** force the absent team member (null: everyone present) (tests); default a seeded draw */
  absentMember?: PciTeamMemberId | null;
  /** where scored decisions go (useLabRun's decide); they are kept here too */
  decide?: (rec: DecisionRecord) => void;
}

const FORM_STAGES: readonly PciAttendingStage[] = ["brief", "plan", "timeout", "signout"];
const PRE_CASE_STAGES: readonly PciAttendingStage[] = ["brief", "plan", "timeout"];

/** The rules of the PCI attending: all of them but the diagnostic lab's stuck 'time-out' (the PCI group has pci-stuck). */
export const PCI_ATTENDING_RULES = ALL_RULES.filter((r) => r.id !== "time-out");

/** A complication as the sign-out lists it: the learner's own assessment, not the engine's name and grade. */
export interface SignOutComplication {
  id: string;
  kind: string;
  /** the cause and the grade as the learner gave them */
  label: string;
}

/** The learner's assessment of a recognised complication, in their words (RecognitionForm's options). */
function assessedLabel(c: Complication): string {
  const a = c.recognised!.answer;
  const parts = [CAUSES.find((x) => x.v === a.cause)?.label ?? a.cause];
  if (a.nhlbi) parts.push(`NHLBI type ${a.nhlbi}`);
  if (a.ellis) parts.push(`Ellis ${a.ellis}`);
  return `${parts.join(", ")} (your assessment)`;
}

/** The attending of one PCI case (no React; usePciAttending wraps it). */
export class PciAttending {
  readonly session: PciAttendingSession;
  readonly engine: MentorEngine;
  readonly policy: LabPolicy;
  readonly prebrief: Prebrief;
  readonly facts: PciPlanFacts;
  /** what the attending has said (replaced, not mutated, on each line, so a memoised list sees the change) */
  utterances: MentorUtterance[] = [];
  readonly decisions: DecisionRecord[] = [];
  stage: PciAttendingStage = "brief";
  answers: Record<string, string> = {};
  plan: PciPlan;
  planSubmitted = false;
  timeOut: { checked: Record<string, boolean>; openedAt: number | null; completedAt: number | null; triedWithAbsent: boolean } = { checked: {}, openedAt: null, completedAt: null, triedWithAbsent: false };
  /** the team member out of the room, and the lab time they come back (null: everyone present) */
  readonly absent: { member: PciTeamMemberId; label: string } | null;
  signOut: PciSignOutState = emptySignOut();
  signOutDone = false;
  /** the wire without its tip coil in this variant (a wire kind), or null */
  readonly damagedWireKind: WireKind | null;
  /** the simulated result after the case, once the troponin and the ECG have been ordered */
  pmiResult: PmiResult | null = null;
  assessment: Assessment | null = null;
  metrics: PciMetrics | null = null;
  planItems: PlanItem[] = [];
  private readonly mem: PciBridgeMemory = newPciBridgeMemory();
  private readonly forwarder: PciRecordForwarder;
  private readonly decideOut?: (rec: DecisionRecord) => void;
  private readonly listeners = new Set<() => void>();
  private readonly wiresSeen = new Set<WireKind>();
  private nextT = -Infinity;
  private frame = 0;
  private bestTip = 0;
  private offs: (() => void)[] = [];
  private attached = false;
  /** the beam gate has said why the pedal does nothing (once a case) */
  private saidBeamWait = false;
  /** the bridge source of the last attending frame (reused, with the live state, by the hands' per-frame checks) */
  private cached: PciBridgeSource | null = null;
  version = 0;

  constructor(session: PciAttendingSession, o: PciAttendingOptions = {}) {
    this.session = session;
    this.policy = o.policy ?? session.policy;
    this.decideOut = o.decide;
    this.engine = new MentorEngine({ mode: this.policy.mode, entrustment: this.policy.entrustment }, PCI_ATTENDING_RULES);
    this.prebrief = prebriefForScenario(session.s);
    this.facts = pciPlanFacts(session.s, session.resolved.def as { anatomy?: { tortuosity?: number }; events?: readonly string[] });
    const d = pciPlanDefaults(session.s);
    this.plan = { steps: {}, guideFrench: d.guideFrench, contrastCeilingMl: 0, forecast: [], support: null, bailoutKit: [], operatorState: null, riskiestStep: null, stopRules: undefined };
    this.forwarder = new PciRecordForwarder(session.recorder);
    // the seeded variants of this case (the same case and seed give the same team and the same wire)
    const rng = rngFrom(`${session.caseId}:${session.resolved.seed ?? ""}:attending`);
    const a = rnd(rng);
    const which = rnd(rng);
    const wire = rnd(rng);
    const absentId = o.absentMember !== undefined ? o.absentMember : a < PCI_ATTENDING_PARAMS.absentChance ? PCI_TEAM_MEMBERS[Math.floor(which * PCI_TEAM_MEMBERS.length) % PCI_TEAM_MEMBERS.length].id : null;
    const m = absentId ? PCI_TEAM_MEMBERS.find((x) => x.id === absentId) ?? null : null;
    this.absent = m ? { member: m.id, label: m.label } : null;
    const damaged = o.damagedWire ?? wire < PCI_ATTENDING_PARAMS.damagedWireChance;
    this.damagedWireKind = damaged ? session.st.wireKind : null;
    this.wiresSeen.add(session.st.wireKind);
  }

  // --- modes ------------------------------------------------------------------------------------

  /** The forms are dialogues that hold the hands (guided practice and exams). */
  get blocking(): boolean {
    return this.policy.mode === "guided" || this.policy.mode === "exam";
  }

  /** The time-out and the sign-out must be completed (not in independent practice). */
  get required(): boolean {
    return this.policy.mode !== "independent";
  }

  /** A form (brief, plan, time-out, sign-out) is open. */
  formOpen(): boolean {
    return FORM_STAGES.includes(this.stage);
  }

  /** The hands may act (a form holds them only in guided practice and exams). */
  handsEnabled(): boolean {
    return !(this.blocking && this.formOpen()) && !this.session.finished;
  }

  /** The forms may link to their lessons (not in exams: the Academy is the curriculum). */
  get lessonsAllowed(): boolean {
    return this.policy.mode !== "exam";
  }

  get timeOutDone(): boolean {
    return this.timeOut.completedAt !== null;
  }

  /** The beam may be switched on: after the time-out in the modes that require one before the beam. */
  beamAllowed(): boolean {
    return !this.policy.visibility.timeOutRequired || this.timeOutDone;
  }

  // --- wiring into the session ---------------------------------------------------------------

  /** Set the session's hooks and start stepping with it. Returns the detach. */
  attach(): () => void {
    if (this.attached) return () => this.detach();
    this.attached = true;
    const x = this.session;
    x.beforeAction = (a) => this.beforeAction(a);
    x.beamGate = () => this.beamAllowed();
    // the pedal does nothing before the time-out: say why, once (the press itself, not the gate, which the beam polls)
    const setPedal = x.setPedal;
    x.setPedal = (p) => {
      if ((p.fluoro || p.cine) && !this.beamAllowed() && !this.saidBeamWait) {
        this.saidBeamWait = true;
        this.line("time-out-beam", "Not yet. We screen after the team time-out.", true);
      }
      setPedal.call(x, p);
    };
    this.offs.push(() => {
      if (Object.prototype.hasOwnProperty.call(x, "setPedal")) delete (x as { setPedal?: unknown }).setPedal;
    });
    x.setTimeOutDone(!this.policy.visibility.timeOutRequired && !this.blocking);
    this.offs.push(x.onStep(() => this.tick()));
    if (this.stage === "brief") x.openModal("prebrief");
    this.tick(true);
    return () => this.detach();
  }

  detach() {
    if (!this.attached) return;
    this.attached = false;
    const x = this.session;
    for (const f of this.offs) f();
    this.offs = [];
    if (x.beforeAction) x.beforeAction = null;
    if (x.beamGate) x.beamGate = null;
  }

  subscribe(f: () => void): () => void {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  }

  private changed() {
    this.version++;
    for (const f of this.listeners) f();
  }

  /** The bridge's view of the session now. */
  source(): PciBridgeSource {
    const x = this.session;
    return {
      snap: x.snapshot(),
      g: x.g,
      scenario: x.s,
      cArm: x.cArmAngles(),
      profile: x.engine.profile,
      planContrastMl: this.plan.contrastCeilingMl,
      tPatient: x.engine.time,
      field: x.field,
      pps: x.lab.exposure.fluoroPps,
    };
  }

  /**
   * The source for a check between attending frames (the hands' per-frame actions): the last frame's,
   * with the live state, beam, contrast and agreed ceiling; a fresh one once the next frame is due.
   */
  private liveSource(): PciBridgeSource {
    const x = this.session;
    const c = this.cached;
    if (!c || x.wall() + 1e-9 >= this.nextT) return this.source();
    return {
      ...c,
      planContrastMl: this.plan.contrastCeilingMl,
      snap: { ...c.snap, state: x.st, contrastMl: Math.round(x.contrastPushed() * 10) / 10, workflow: { ...c.snap.workflow, beam: x.beamMode() } },
    };
  }

  /** One frame (decimated to stepHz): the recorder's frame, the engine's telemetry, the attending's step. */
  tick(force = false) {
    const x = this.session;
    const t = x.wall();
    if (!force && t + 1e-9 < this.nextT) return;
    this.nextT = t + 1 / PCI_ATTENDING_PARAMS.stepHz;
    const src = this.source();
    this.cached = src;
    // filling in the brief, the plan, the time-out or the sign-out is progress (the stuck prompt waits)
    if (this.formOpen()) this.engine.noteProgress(t);
    x.recorder.sample(pciFrameSample(src, t, this.frame++), true);
    const evs = this.forwarder.sync(src, t);
    for (const e of evs) {
      if (e.kind === "wire-loaded" || e.kind === "wire-exchange") {
        const k = e.data?.kind;
        if (typeof k === "string" && k in WIRE_SPEC) this.wiresSeen.add(k as WireKind);
      }
      // progress on the PCI tasks (the time-out rule watches for none)
      if (["device", "inflate", "deploy", "wire-crossed"].includes(e.kind) || (e.kind === "wire-branch" && e.data?.onRoute === true)) this.engine.noteProgress(t);
    }
    if (x.st.tipMm > this.bestTip + 5) {
      this.bestTip = x.st.tipMm;
      this.engine.noteProgress(t);
    }
    this.wiresSeen.add(x.st.wireKind);
    this.clearStaleTimeOutCaption();
    if (x.finished) return;
    const said = this.engine.step(pciMentorInput(src, this.mem, t));
    for (const u of said) this.say(u);
  }

  /**
   * The attending's latest line (the live view's caption), or null. A time-out refusal stops being the
   * caption once it no longer holds (the absent member is back, or the time-out has run): the drawer
   * keeps it in the conversation, but the live view does not go on showing a stale refusal.
   */
  get last(): MentorUtterance | null {
    if (this.utterances.length <= this.captionClearedAt) return null;
    return this.utterances[this.utterances.length - 1] ?? null;
  }

  /** Utterances up to this count are no longer the caption (see last). */
  private captionClearedAt = 0;

  /** Drop a time-out refusal from the caption when it no longer applies. */
  private clearStaleTimeOutCaption() {
    const u = this.utterances[this.utterances.length - 1];
    if (!u || this.utterances.length <= this.captionClearedAt) return;
    const stale = (u.ruleId === "time-out-team" && this.absentHasArrived()) || ((u.ruleId === "time-out-team" || u.ruleId === "time-out-items") && this.timeOutDone);
    if (!stale) return;
    this.captionClearedAt = this.utterances.length;
    this.changed();
  }

  private say(u: MentorUtterance) {
    this.utterances = [...this.utterances, u];
    this.session.recorder.event({ kind: "mentor", data: utteranceData(u), tWall: u.tWall, tPatient: this.session.engine.time, step: 0, cmd: 0, ext: true });
    this.changed();
  }

  /** An attending line outside the rules (the workflow's own: the time-out, the sign-out). */
  private line(ruleId: string, text: string, blocking: boolean): MentorUtterance {
    const u: MentorUtterance = { id: `w${this.utterances.length + 1}:${ruleId}`, tWall: this.session.wall(), ruleId, level: blocking ? 5 : 3, text, anchor: "plan", severity: "technique", blocking, critical: false };
    this.say(u);
    return u;
  }

  /** The session asks before an operator action. */
  beforeAction(action: PciAction): boolean {
    if (action === "finish") return this.finishAllowed(true);
    // a form open over the lab holds the hands in guided practice and exams
    if (this.blocking && this.formOpen()) return false;
    const pre = pciPreActionFor(action, this.session.st);
    let allow = true;
    if (pre) {
      const r = this.engine.preAction(pre, pciMentorInput(this.liveSource(), { ...this.mem }, this.session.wall()));
      if (r.utterance) this.say(r.utterance);
      allow = r.allow;
    }
    // supervised and independent practice: the hands are working, so the case dialogue is off the lab
    // (the form stays in the drawer by its stage; the tips and the assessment prompts see the case)
    if (allow && !this.blocking && PRE_CASE_STAGES.includes(this.stage)) this.session.closeModal("prebrief");
    return allow;
  }

  /** The learner asks for help: the attending's next line (counted by the run in costed modes). */
  askHelp(): MentorUtterance | null {
    const u = this.engine.requestHint(pciMentorInput(this.liveSource(), { ...this.mem }, this.session.wall()));
    this.session.recorder.event({ kind: "hint", data: { level: u?.level ?? 0, ruleId: u?.ruleId }, tWall: this.session.wall(), tPatient: this.session.engine.time, step: 0, cmd: 0, ext: true });
    if (u) {
      this.utterances = [...this.utterances, u];
      this.changed();
    }
    return u;
  }

  // --- decisions ---------------------------------------------------------------------------------

  private decide(rec: Omit<DecisionRecord, "t">) {
    const full: DecisionRecord = { ...rec, t: this.session.wall() };
    const i = this.decisions.findIndex((d) => d.id === full.id);
    if (i >= 0) this.decisions[i] = full;
    else this.decisions.push(full);
    this.decideOut?.(full);
  }

  // --- the brief and the plan ------------------------------------------------------------------

  answer(questionId: string, optionId: string) {
    this.answers = { ...this.answers, [questionId]: optionId };
    this.changed();
  }

  /** From the brief to the plan form (the questions are graded into the ledger). */
  toPlan() {
    for (const g of gradeAnswers(this.prebrief.questions, this.answers)) {
      const q = this.prebrief.questions.find((x) => x.id === g.questionId)!;
      this.decide({ id: `prebrief-${q.id}`, stage: "plan", label: q.prompt, correct: g.correct, expected: q.options.filter((o) => q.correct.includes(o.id)).map((o) => o.text).join(" or "), given: q.options.find((o) => o.id === g.chosen)?.text ?? "no answer", lessonId: PCI_PLAN_LESSONS.plan });
    }
    this.stage = "plan";
    this.session.openModal("prebrief");
    this.changed();
  }

  /** Edit the plan (refused once it is agreed: the debrief compares the case with the plan as agreed). */
  setPlan(p: Partial<PciPlan>) {
    if (this.planSubmitted) return;
    this.plan = { ...this.plan, ...p, steps: { ...this.plan.steps, ...(p.steps ?? {}) } };
    this.changed();
  }

  /** The plan, stored as a 'plan' event; its decisions go to the ledger. Then the time-out. Once agreed, it only moves on. */
  submitPlan() {
    const x = this.session;
    if (this.planSubmitted) {
      if (this.timeOutDone) this.startCase();
      else this.toTimeOut();
      return;
    }
    const p = this.plan;
    this.planSubmitted = true;
    x.recorder.event({ kind: "plan", data: { plan: JSON.parse(JSON.stringify(p)) }, tWall: x.wall(), tPatient: x.engine.time, step: 0, cmd: 0, ext: true });
    const budget = pciContrastBudget({ ...this.source(), planContrastMl: undefined });
    const rule = budget ? budget.stricter.availableMl : null;
    this.decide({
      id: "plan-contrast-ceiling",
      stage: "plan",
      label: "Contrast ceiling set at the brief",
      correct: p.contrastCeilingMl > 0 && (rule === null || p.contrastCeilingMl <= rule + 0.5),
      expected: rule !== null ? `at most ${Math.round(rule)} mL (${budget!.stricter.label})` : "a ceiling set before the case",
      given: p.contrastCeilingMl > 0 ? `${Math.round(p.contrastCeilingMl)} mL` : "none set",
      lessonId: "pm-planning-bailout",
      tipIds: ["pci-planning-contrast-ceiling"],
    });
    const need = guideFrenchNeeded(p);
    this.decide({ id: "plan-guide-size", stage: "plan", label: "Guide size for the planned preparation", correct: p.guideFrench >= need, expected: `${need} Fr or larger`, given: `${p.guideFrench} Fr`, lessonId: "pm-planning-bailout", tipIds: ["pci-planning-guide-size"] });
    const support = expectedSupport(this.facts);
    this.decide({ id: "plan-support", stage: "plan", label: "Support plan", correct: p.support === support, expected: support, given: p.support ?? "not chosen", lessonId: PCI_PLAN_LESSONS.forecast, tipIds: ["pci-principles-support-standby"] });
    const exp = expectedForecast(this.facts);
    const named = p.forecast.map((f) => f.complication);
    this.decide({ id: "plan-forecast-named", stage: "plan", label: "Likeliest complications named", correct: named.length >= 2 && named.length <= 3 && named.some((c) => exp.slice(0, 2).includes(c)), expected: exp.slice(0, 3).join(", "), given: named.join(", ") || "none", lessonId: PCI_PLAN_LESSONS.forecast, tipIds: ["pci-planning-bailout-kit"] });
    const movesOk = p.forecast.length > 0 && p.forecast.every((f) => FIRST_MOVE_FOR[f.complication] === f.firstMove);
    this.decide({ id: "plan-first-moves", stage: "plan", label: "First move for each forecast complication", correct: movesOk, expected: p.forecast.map((f) => `${f.complication}: ${FIRST_MOVE_FOR[f.complication]}`).join("; ") || "a first move for each", given: p.forecast.map((f) => `${f.complication}: ${f.firstMove || "none"}`).join("; ") || "none", lessonId: PCI_PLAN_LESSONS.forecast });
    this.decide({ id: "plan-operator-state", stage: "plan", label: "Own state declared at the brief", correct: !!p.operatorState, expected: "declared", given: p.operatorState ?? "not declared", lessonId: PCI_PLAN_LESSONS.state, tipIds: ["pci-safe-state-check"] });
    if (this.facts.cto) this.decide({ id: "plan-stop-rules", stage: "plan", label: "Stopping rules set before the CTO attempt", correct: !!p.stopRules && Object.values(p.stopRules).some((v) => typeof v === "number" && v > 0), expected: "air kerma, contrast and time limits agreed", given: p.stopRules ? "set" : "not set", lessonId: PCI_PLAN_LESSONS.stopRules, tipIds: ["pci-safe-cto-stop-rules"] });
    if (p.operatorState === "post-call") this.line("operator-state", "You've been up all night. For the hardest step, let's have a second operator scrubbed, or stage it rather than finish everything today.", false);
    this.toTimeOut();
  }

  /** To the time-out (its clock starts the first time it opens: an absent member who came back stays back). */
  private toTimeOut() {
    this.stage = "timeout";
    if (this.timeOut.openedAt === null) this.timeOut = { ...this.timeOut, openedAt: this.session.wall() };
    this.session.openModal("prebrief");
    this.changed();
  }

  // --- the time-out --------------------------------------------------------------------------------

  timeOutItems() {
    return pciTimeOutItems();
  }

  checkTimeOut(id: string, on: boolean) {
    this.timeOut = { ...this.timeOut, checked: { ...this.timeOut.checked, [id]: on } };
    this.changed();
  }

  /** The members in the room now (the absent one returns arrivalS after the time-out opened). */
  presentMembers(): PciTeamMemberId[] {
    return PCI_TEAM_MEMBERS.filter((m) => m.id !== this.absent?.member || this.absentHasArrived()).map((m) => m.id);
  }

  absentHasArrived(): boolean {
    if (!this.absent) return true;
    const opened = this.timeOut.openedAt;
    return opened !== null && this.session.wall() - opened >= PCI_ATTENDING_PARAMS.arrivalS;
  }

  /** Who is missing now (label), or null. */
  missingMember(): string | null {
    return this.absent && !this.absentHasArrived() ? this.absent.label : null;
  }

  /**
   * Run the time-out. Refused while a team member is out of the room (the attending says so; trying is
   * recorded) or while an item is unchecked. Returns true when it is complete.
   */
  runTimeOut(): boolean {
    const missing = this.missingMember();
    if (missing) {
      this.timeOut = { ...this.timeOut, triedWithAbsent: true };
      this.line("time-out-team", `We're not all here: the ${missing} is out of the room. We wait for the whole team.`, true);
      return false;
    }
    const items = this.timeOutItems();
    const open = items.filter((i) => !this.timeOut.checked[i.id]);
    if (open.length) {
      this.line("time-out-items", `Not yet: ${open[0].text.toLowerCase()}.`, true);
      return false;
    }
    const x = this.session;
    this.timeOut = { ...this.timeOut, completedAt: x.wall() };
    x.recorder.event({ kind: "timeout", data: { done: true, items: items.map((i) => i.id), present: this.presentMembers() }, tWall: x.wall(), tPatient: x.engine.time, step: 0, cmd: 0, ext: true });
    this.decide({ id: "timeout-team-present", stage: "plan", label: "Time-out run with the whole team present", correct: !this.timeOut.triedWithAbsent, expected: "wait until everyone is in the room", given: this.timeOut.triedWithAbsent ? `started with the ${this.absent?.label ?? "team"} absent` : "whole team present", lessonId: PCI_PLAN_LESSONS.timeOut, tipIds: ["pci-mon-time-out"] });
    this.decide({ id: "timeout-complete", stage: "plan", label: "Time-out items stated", correct: true, expected: "every item", given: "every item", lessonId: PCI_PLAN_LESSONS.timeOut, tipIds: ["pci-mon-time-out"] });
    x.setTimeOutDone(true);
    this.clearStaleTimeOutCaption();
    this.startCase();
    return true;
  }

  /** Leave the pre-case dialogue for the procedure (the time-out stays open in the drawer where it was not done). */
  startCase() {
    this.stage = "case";
    this.session.closeModal("prebrief");
    this.changed();
  }

  /** Back to the brief, plan or time-out from the case (the Case brief button). */
  reopen(stage: "brief" | "plan" | "timeout") {
    if (this.session.finished) return;
    this.stage = stage;
    if (stage === "timeout" && this.timeOut.openedAt === null) this.timeOut = { ...this.timeOut, openedAt: this.session.wall() };
    this.session.openModal("prebrief");
    this.changed();
  }

  // --- the sign-out ------------------------------------------------------------------------------------

  /** The wires used in the case (kinds), the damaged one first in its variant. */
  wiresUsed(): WireKind[] {
    return [...this.wiresSeen];
  }

  /** The engine's complications that became overt during the case (id, kind): the debrief's truth, never a live screen's. */
  complications(): { id: string; kind: string }[] {
    return this.session.st.cx.list.filter((c) => c.tOvert !== null).map((c) => ({ id: c.id, kind: c.kind }));
  }

  /**
   * The complications the sign-out records: while the case is live (the sign-out can go back to it),
   * only those the learner has recognised, under the learner's own assessment (pci-cx-recognition: the
   * engine keeps the names and grades of the others off the live screens).
   */
  signOutComplications(): SignOutComplication[] {
    return this.session.st.cx.list.filter((c) => c.tOvert !== null && causeRecognised(c)).map((c) => ({ id: c.id, kind: c.kind, label: assessedLabel(c) }));
  }

  /** How many overt changes the learner has not yet assessed (a count, unnamed). */
  unassessedCount(): number {
    return this.session.st.cx.list.filter((c) => c.tOvert !== null && !causeRecognised(c)).length;
  }

  /**
   * The complications report and the classification are asked (a lost branch, a dissection, slow or no
   * flow, embolisation): from what the learner has recognised while the case is live, from the engine's
   * complications once it is over.
   */
  pmiAsked(): boolean {
    const kinds = this.session.finished ? this.complications() : this.signOutComplications();
    return kinds.some((c) => (PMI_COMPLICATION_KINDS as readonly string[]).includes(c.kind));
  }

  openSignOut() {
    const x = this.session;
    if (x.finished) return;
    this.stage = "signout";
    x.setFinishStep(true);
    x.openModal("signout");
    this.changed();
  }

  closeSignOut() {
    const x = this.session;
    if (this.stage !== "signout") return;
    this.stage = "case";
    x.setFinishStep(false);
    x.closeModal("signout");
    this.changed();
  }

  setSignOut(p: Partial<PciSignOutState>) {
    this.signOut = { ...this.signOut, ...p };
    this.changed();
  }

  /** Inspect a wire: what the scrub nurse and the operator find on it. */
  inspectWire(kind: WireKind): "intact" | "damaged" {
    const finding = kind === this.damagedWireKind ? "damaged" : "intact";
    this.setSignOut({ wiresChecked: { ...this.signOut.wiresChecked, [kind]: finding } });
    return finding;
  }

  /** Record the damaged wire and what is done about it (DAMAGED_WIRE_ACTIONS). */
  recordDamagedWire(action: string) {
    const ok = action === "record-image";
    this.setSignOut({ damagedWireAction: action, damagedWireRecorded: ok, leftInPlace: ok ? `${this.damagedWireKind ? WIRE_SPEC[this.damagedWireKind].label : "Wire"}: tip coil missing, imaged; retrieval planned` : this.signOut.leftInPlace });
    this.decide({ id: "signout-wire-integrity", stage: "finish", label: "A wire without its tip coil", correct: ok, expected: "record it, image the vessel and plan retrieval before the patient leaves", given: action, lessonId: PCI_PLAN_LESSONS.signOut, tipIds: ["pci-mon-sign-out"] });
  }

  /** Order the tests after the case; once the troponin and the ECG are ordered the simulated result is shown. */
  order(tests: Partial<PciSignOutState["ordered"]>) {
    this.setSignOut({ ordered: { ...this.signOut.ordered, ...tests } });
    if (!this.pmiResult && this.signOut.ordered.troponin && this.signOut.ordered.ecg) this.pmiResult = this.simulatePmi();
    this.changed();
  }

  /** The simulated result (seeded by the case; MODEL PARAMETERS) from the complications the engine produced. */
  simulatePmi(): PmiResult {
    const P = PCI_ATTENDING_PARAMS;
    const rng = rngFrom(`${this.session.caseId}:${this.session.resolved.seed ?? ""}:pmi`);
    const cx = this.session.st.cx.list.filter((c) => c.tOvert !== null && (PMI_COMPLICATION_KINDS as readonly string[]).includes(c.kind));
    const onTable = cx.length > 0;
    const residual = cx.some((c) => c.stage !== "resolved") || Object.values(this.signOut.complications).some((v) => v !== "resolved");
    const troponinRise = rnd(rng) < (onTable ? P.troponinRiseAfterComplication : P.troponinRiseUncomplicated);
    const clinicalFeature = troponinRise && rnd(rng) < P.clinicalFeature;
    // what an echo would show (shown, and counted, only once imaging is ordered)
    const newWallMotion = onTable && rnd(rng) < (residual ? P.wallMotionResidual : P.wallMotionResolved);
    return { troponinRise, risingAt6h: troponinRise && onTable, clinicalFeature, angiographicComplication: onTable, complicationOnTable: onTable, newWallMotion };
  }

  /** The classification the simulated result supports, with what was ordered (an echo not ordered confirms nothing). */
  pmiTruth(): PmiClass | null {
    return this.pmiResult ? classifyPmi({ ...this.pmiResult, newWallMotion: this.pmiResult.newWallMotion && this.signOut.ordered.imaging }) : null;
  }

  /** What still stops the sign-out (empty: it may finish). */
  signOutBlockers(): string[] {
    const wires = this.wiresUsed();
    return signOutBlockers(this.signOut, { wires, damagedWire: this.damagedWireKind, complications: this.signOutComplications().map((c) => c.id), pmiAsked: this.pmiAsked() && !!this.pmiResult });
  }

  /** Complete the sign-out: its decisions go to the ledger. Returns what is still missing (empty when done). */
  completeSignOut(): string[] {
    const missing = this.signOutBlockers();
    if (this.pmiAsked() && !this.pmiResult) missing.push("Order the troponin and the ECG.");
    if (missing.length) {
      this.line("sign-out", `The patient stays until the sign-out is done. ${missing[0]}`, true);
      return missing;
    }
    const s = this.signOut;
    const x = this.session;
    const cx = this.signOutComplications();
    this.decide({ id: "signout-antiplatelet", stage: "finish", label: "Antiplatelet regimen, duration and loading recorded", correct: true, expected: "recorded", given: `${s.antiplatelet.regimen}, ${s.antiplatelet.durationMonths} months, ${s.antiplatelet.loading}`, lessonId: PCI_PLAN_LESSONS.signOut, tipIds: ["pci-mon-sign-out"] });
    if (!this.damagedWireKind) this.decide({ id: "signout-wire-integrity", stage: "finish", label: "Every wire checked intact", correct: true, expected: "checked", given: "checked", lessonId: PCI_PLAN_LESSONS.signOut, tipIds: ["pci-mon-sign-out"] });
    if (cx.length) {
      this.decide({ id: "signout-complications", stage: "finish", label: "Every complication recorded with its final state", correct: cx.every((c) => !!s.complications[c.id]), expected: cx.map((c) => c.kind).join(", "), given: Object.values(s.complications).join(", "), lessonId: PCI_PLAN_LESSONS.pmi, tipIds: ["pci-pmi-document"] });
      this.decide({ id: "signout-disclosure", stage: "finish", label: "Disclosure after the complication", correct: s.disclosure === "now-awake", expected: "tell the patient once safe and awake, fully, with an apology", given: s.disclosure ?? "not chosen", lessonId: PCI_PLAN_LESSONS.candour, tipIds: ["pci-post-complication-candour"] });
      this.decide({ id: "signout-incident", stage: "finish", label: "Incident report", correct: s.incidentReport === true, expected: "reported", given: s.incidentReport ? "reported" : "not reported", lessonId: PCI_PLAN_LESSONS.candour });
    }
    if (this.pmiAsked() && this.pmiResult) {
      const truth = this.pmiTruth()!;
      this.decide({ id: "signout-imaging-ordered", stage: "finish", label: "Imaging ordered after a complication on the table", correct: s.ordered.imaging, expected: "imaging of the territory", given: s.ordered.imaging ? "ordered" : "not ordered", lessonId: PCI_PLAN_LESSONS.pmi, tipIds: ["pci-pmi-document"] });
      this.decide({ id: "signout-pmi-class", stage: "finish", label: "Classification under the fifth universal definition", correct: s.pmiClass === truth, expected: PMI_LABEL[truth], given: s.pmiClass ? PMI_LABEL[s.pmiClass] : "none", lessonId: PCI_PLAN_LESSONS.pmi, tipIds: ["pci-pmi-document"] });
    }
    this.decide({ id: "signout-logbook", stage: "finish", label: "Logbook entry", correct: !!s.logbook.role && !!s.logbook.presentation && !!s.logbook.complexity, expected: "role, access, presentation, complexity, techniques, complications", given: [s.logbook.role, s.logbook.presentation, s.logbook.complexity, s.logbook.techniques].filter(Boolean).join(", "), lessonId: PCI_PLAN_LESSONS.logbook, tipIds: ["pci-operator-log-the-case"] });
    this.signOutDone = true;
    x.recorder.event({ kind: "report", data: { report: { signOut: JSON.parse(JSON.stringify(s)), pmi: this.pmiResult } }, tWall: x.wall(), tPatient: x.engine.time, step: 0, cmd: 0, ext: true });
    this.changed();
    return [];
  }

  /** May the case end now? (the session's 'finish' action asks this) */
  finishAllowed(speak = false): boolean {
    if (this.damagedWireKind && !damagedWireResolved(this.signOut, this.damagedWireKind)) {
      if (speak) this.line("sign-out-wire", "Not yet. Every wire has to be checked intact before the patient leaves.", true);
      return false;
    }
    if (this.required && !this.signOutDone) {
      if (speak) this.line("sign-out", "The patient stays until the sign-out is done.", true);
      return false;
    }
    return true;
  }

  /**
   * End the case (the session's finish, through the gate), then assess the record: the PCI metrics, the
   * standards, the PEARLS model with the plan compared and the decisions. Null when it was stopped.
   */
  finishCase(): Assessment | null {
    const x = this.session;
    const r = x.finish();
    if (!r) {
      this.changed();
      return null;
    }
    this.tick(true);
    this.forwarder.close(x.wall(), x.cArmAngles());
    x.closeModal("signout");
    this.stage = "done";
    this.assess();
    this.changed();
    return this.assessment;
  }

  /** Assess the session's record (called once the case has finished). */
  assess(): Assessment | null {
    const x = this.session;
    const rec = x.recorder.toRecord();
    const residual = x.result?.residual;
    // the session's case-end carries the result's residual stenosis for the metrics
    const record = { ...rec, events: rec.events.map((e) => (e.kind === "case-end" ? { ...e, data: { ...e.data, residualDS: residual } } : e)) };
    try {
      const a = assessAttempt(record, { facts: pciCaseFacts(x.snapshot()) });
      const engineKinds = [...new Set(this.complications().map((c) => c.kind))];
      this.planItems = this.planSubmitted
        ? pciPlanVsExecution(this.plan, { facts: this.facts, contrastMl: x.snapshot().contrastMl, engineComplications: engineKinds, guideFrenchUsed: x.st.guide.french, imagingUsed: x.st.ivus !== null, stopReached: this.stopReached() })
        : [];
      if (this.planSubmitted) {
        const m = forecastMatches(this.plan.forecast, engineKinds);
        if (engineKinds.length) this.decide({ id: "plan-forecast-matched", stage: "finish", label: "The complication that occurred was forecast", correct: m.missed.length === 0, expected: engineKinds.join(", "), given: this.plan.forecast.map((f) => f.complication).join(", ") || "none", lessonId: PCI_PLAN_LESSONS.forecast, tipIds: ["pci-principles-explain-unexpected"] });
      }
      const debrief: DebriefModel = withLedger({ ...a.debrief, planVsExecution: [...this.planItems, ...a.debrief.planVsExecution] }, this.decisions);
      this.assessment = { ...a, debrief };
      this.metrics = a.metrics.lab === "pci" ? a.metrics : null;
    } catch {
      this.assessment = null;
      this.metrics = null;
    }
    return this.assessment;
  }

  /**
   * The first of the plan's CTO stopping rules the case passed (air kerma in Gy, contrast as a multiple of
   * the creatinine clearance, minutes of the case), as the debrief says it; null when none was set or reached.
   */
  stopReached(): string | null {
    const r = this.plan.stopRules;
    if (!r) return null;
    const x = this.session;
    const karGy = x.lab.dose.totals.karMGy.total / 1000;
    const crcl = x.engine.profile?.renal.crclMlMin ?? 0;
    const xCrcl = crcl > 0 ? x.contrastPushed() / crcl : null;
    const minutes = x.wall() / 60;
    if (r.karGy && karGy >= r.karGy) return `air kerma ${karGy.toFixed(1)} Gy (limit ${r.karGy} Gy)`;
    if (r.contrastXCrcl && xCrcl !== null && xCrcl >= r.contrastXCrcl) return `contrast ${xCrcl.toFixed(1)} × CrCl (limit ${r.contrastXCrcl} × CrCl)`;
    if (r.minutes && minutes >= r.minutes) return `time ${Math.round(minutes)} min (limit ${r.minutes} min)`;
    return null;
  }

  /** The logbook row's measures (pciMetricNumbers), or none before the assessment. */
  metricNumbers(): Record<string, number> {
    return this.metrics ? pciMetricNumbers(this.metrics) : {};
  }
}

export const PMI_LABEL: Record<PmiClass, string> = {
  "no-injury": "No acute myocardial injury",
  injury: "Acute myocardial injury without infarction",
  "procedure-mi": "Procedure-related myocardial infarction",
};

// --- the hook ------------------------------------------------------------------------------------------

/**
 * The attending for a PCI session while it is mounted: one PciAttending per session and policy, attached
 * to the session's hooks; re-renders on its changes.
 */
export function usePciAttending(session: PciLabSession | null, policy: LabPolicy, decide?: (rec: DecisionRecord) => void): PciAttending | null {
  const decideRef = useRef(decide);
  decideRef.current = decide;
  const attending = useMemo(() => (session ? new PciAttending(session, { policy, decide: (r) => decideRef.current?.(r) }) : null), [session, policy]);
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!attending) return;
    const off = attending.subscribe(bump);
    const detach = attending.attach();
    return () => {
      off();
      detach();
    };
  }, [attending]);
  return attending;
}
