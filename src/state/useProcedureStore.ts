import { create } from "zustand";
import type { AccessRoute } from "../types";
import { newCaseSession, newCaseSessionStepped, type CaseHandover, type CaseSession, type SessionSummary, type Workspace } from "../simulation/session/caseSession";
import type { PatientEngine } from "../simulation/patient/engine";
import type { Indication } from "../simulation/patient/patient";
import type { AssessmentMode, EntrustmentLevel } from "../mentor/types";
import type { LaunchParams } from "../content/schema";
import type { LogbookEntry } from "../progress/types";
import { DEFAULT_SCENARIO_ID, isScenarioStart, scenarioById, type ScenarioStart } from "../simulation/session/scenarios/index";
import { AutopilotError } from "../simulation/session/autopilot";
import { isLaunchMode } from "../content/validateLaunch";
import { LabRun, runCaseId } from "../ui/lab/labRun";
import { useSimulatorStore } from "./useSimulatorStore";
import { useProgressStore } from "./useProgressStore";
import { labImaging } from "../render/xray/sceneBuilder";
import { adHocInputs, adHocReportFrom, adHocSetupOf, interruptAdHoc, interruptionDue, openAdHocGate, recordAdHocDecision, type AdHocChoice, type AdHocGateState, type AdHocInputs, type AdHocOutcome, type AdHocReport } from "../simulation/session/adhoc";
import type { DeferralReason } from "../mentor/report";

// ---------------------------------------------------------------------------
// The full-case lab: one CaseSession (simulation/session/caseSession.ts) and
// its PatientEngine. The session is a mutable object; `version` is bumped
// after every change so components re-render. `stage` says which lab is on
// screen: this one, or the diagnostic or PCI lab the case was handed to.
//
// Each case runs a named scenario (simulation/session/scenarios/); 'New
// patient' opens the default one, a random case. A lesson or case link
// (useLabLaunch("procedure")) passes scenario, start, access, mode, seed and
// workspace, which launchToCase turns into newCase options. Every case is
// one LabRun (src/ui/lab/labRun.ts, the class useLabRun wraps): finish
// copies the session's decisions into it and writes the one logbook row.
//
// A case that opens past the chart is played there by the autopilot one
// step per task (newCaseSessionStepped), with `preparing` set and no session
// meanwhile, so the page paints 'Preparing the patient' instead of freezing.
// The autopilot's own decisions are cleared; a case opened past 'access' is
// logged with a note and never as a pass (not access-EPA evidence).
//
// Ad hoc PCI goes through the hand-over gate (proc-heparin-act-handover):
// 'Ad hoc PCI now' at the decision gate below (openPciGate, still callable
// directly) opens it at the table, where the PCI heparin dose
// and the ACT are decided; toPci then hands the case to the PCI lab, which
// the session refuses in guided and supervised mode until an ACT at target
// has been measured. A scenario that opens with the gate open opens at the
// table too.
//
// The ad hoc or delayed PCI decision (proc-adhoc-gate): 'Ad hoc PCI
// decision' in the diagnostic lab brings the case back here with the
// decision gate open (openAdHocGate; src/simulation/session/adhoc.ts), as
// does a scenario whose setup opens it at the start. The gate reads the
// study report the learner submitted in this case's diagnostic lab (its
// decision and PciTarget). decideAdHoc scores the decision on the session's
// ledger; 'proceed' opens the hand-over gate above, 'defer' goes to closure
// with a staged-PCI note. Once a case has an ad hoc gate, toPci runs only
// after 'proceed', and the hand-over carries the report's target with the
// strategy 'adhoc'. A STEMI call the gate schedules comes in on the clock
// (tick) or when the learner first decides, and must be acknowledged.
//
// The session flow of repair-session-flow: the live lab lets session modules
// hold a femoral compression, band or recovery time-lapse while an emergency
// is under way (session.lapseHoldsOn, set when a case opens), so a faint at
// sheath removal plays out at the wall clock with the orders open. A case a
// module postponed before any puncture (the planning module's hold and delay)
// is finished at once by act(): the summary, its ledger and the logbook row
// appear on the handover workspace, and the row is never a pass (no access
// was done), with a note.
// ---------------------------------------------------------------------------

export type Stage = "lab" | "diagnostic" | "pci";

/** What a lab hands back when the case returns (the dose it added; contrast already in the shared engine when patientAdvanced). */
export interface LabReport {
  contrastMl: number;
  fluoroS: number;
  karMGy: number;
  kapGyCm2: number;
  /** the lab ran the case's own patient engine (the continuous hand-over) */
  patientAdvanced: boolean;
}

let labReporter: (() => LabReport) | null = null;

/** The mounted lab registers how to read its totals (C5 continuous hand-over); returns the unregister. */
export function setLabReporter(fn: (() => LabReport) | null): () => void {
  labReporter = fn;
  return () => {
    if (labReporter === fn) labReporter = null;
  };
}

interface LabMark {
  wall: number;
  /** the patient engine's clock at the hand-over */
  tPatient: number;
}

/** What a new case is opened with (a launch, the scenario picker, 'New patient'). */
export interface NewCaseRequest {
  access?: AccessRoute;
  seed?: string;
  indication?: Indication;
  /** a registered scenario id (default 'default') */
  scenario?: string;
  start?: ScenarioStart;
  /** a launch's mode: overrides the level-derived mode */
  mode?: AssessmentMode;
  workspace?: Workspace;
}

const WORKSPACE_IDS: readonly Workspace[] = ["chart", "access", "fluoro", "table", "closure", "recovery", "handover"];
const ACCESS_PARAM: Record<string, AccessRoute> = { "radial-right": "radial-right", radial: "radial-right", "radial-left": "radial-left", femoral: "femoral" };

/** The workspace a start stage opens on. */
export const WORKSPACE_FOR_START: Record<ScenarioStart, Workspace> = {
  chart: "chart",
  access: "access",
  "sheath-in": "table",
  "post-diagnostic": "closure",
  closure: "closure",
  recovery: "recovery",
};

/**
 * Launch params (scenario, start, access, mode, seed, workspace) as a new-case request. Unknown
 * values are dropped (the content test refuses them in lesson links): an unknown scenario opens the
 * default one.
 */
export function launchToCase(p: LaunchParams): NewCaseRequest {
  const r: NewCaseRequest = {};
  if (p.scenario && scenarioById(p.scenario)) r.scenario = p.scenario;
  if (isScenarioStart(p.start)) r.start = p.start;
  if (p.access && ACCESS_PARAM[p.access]) r.access = ACCESS_PARAM[p.access];
  if (isLaunchMode(p.mode)) r.mode = p.mode;
  if (p.seed) r.seed = p.seed;
  if (p.workspace && (WORKSPACE_IDS as readonly string[]).includes(p.workspace)) r.workspace = p.workspace as Workspace;
  return r;
}

/** The logbook note of a case postponed before any puncture. */
export const POSTPONED_NOTE = "Postponed after the chart review, before any puncture; no access was done";

/**
 * Write the finished case to its run: the session's decisions go into the run's ledger and the run
 * writes the one logbook row (LabRun.finish; a second call returns the same row).
 */
export function logCase(run: LabRun, s: CaseSession, sum: SessionSummary): LogbookEntry {
  for (const d of sum.decisions) run.decide(d);
  const correct = sum.decisions.filter((d) => d.correct).length;
  // a case opened past 'access' had its earlier steps played by the autopilot: logged, never passed
  const wholeCase = s.startStage === "chart" || s.startStage === "access";
  // a case postponed before any puncture: logged with its decisions, never passed (no access was done)
  const notes = sum.postponed ? POSTPONED_NOTE : wholeCase ? null : `Opened at ${s.startStage}; earlier steps played by the autopilot`;
  return run.finish({
    passed: sum.passed && wholeCase && !sum.postponed,
    ...(notes ? { notes } : {}),
    criticalErrors: sum.criticalErrors,
    complications: sum.complications.map((c) => c.label),
    devices: sum.devices,
    fluoroS: sum.totals.fluoroS,
    karMGy: sum.totals.karMGy,
    kapGyCm2: sum.totals.kapGyCm2,
    contrastMl: sum.totals.contrastMl,
    durationS: sum.durationS,
    access: s.access,
    indication: s.profile.indication,
    epas: [s.access === "femoral" ? "access-femoral" : "access-radial"],
    metrics: { decisionsCorrect: correct, decisionsTotal: sum.decisions.length, ...(sum.handover ? { handoverCorrect: sum.handover.correct, handoverTotal: sum.handover.total } : {}) },
  });
}

interface ProcStore {
  session: CaseSession | null;
  engine: PatientEngine | null;
  version: number;
  seed: string;
  access: AccessRoute;
  mode: AssessmentMode;
  workspace: Workspace;
  stage: Stage;
  /** what the lab the case was handed to received, with the hand-over extensions (anticoag, antithrombotic, contrast) */
  handover: CaseHandover | null;
  labMark: LabMark | null;
  summary: SessionSummary | null;
  logged: boolean;
  /** the scenario of the current case */
  scenarioId: string;
  /** the ad hoc or delayed PCI decision gate of this case (null: not opened) */
  adhoc: AdHocGateState | null;
  /** the case was handed to the diagnostic lab in this run (only then is the lab's study report this case's) */
  studyLoaded: boolean;
  /** the run the case is logged through (one logbook row) */
  run: LabRun | null;
  /** set when a launch's start stage could not be reached and the case opened at the chart */
  launchNotice: string | null;
  /** the autopilot is playing a new case to its start stage (no session until it is done) */
  preparing: boolean;

  /** open a new case; resolves once it is on screen (at once for a case that opens at the chart) */
  newCase: (o?: NewCaseRequest) => Promise<void>;
  /** 'Ask the attending': the session and the run record the first request */
  askHelp: () => void;
  /** run something on the session and re-render */
  act: <T>(fn: (s: CaseSession) => T) => T | undefined;
  bump: () => void;
  setWorkspace: (w: Workspace) => void;
  setAccess: (a: AccessRoute) => void;
  tick: (dt: number) => void;
  toDiagnostic: () => void;
  /** back from the diagnostic lab with the hand-over gate open: the PCI heparin dose and the ACT first */
  openPciGate: () => void;
  /** put the hand-over to PCI off (the case continues) */
  closePciGate: () => void;
  /** back from the diagnostic lab (or at the table) with the ad hoc or delayed PCI decision gate open */
  openAdHocGate: () => void;
  /** the decision at the gate; null when it was not taken (the STEMI call came in first, or a deferral without a reason) */
  decideAdHoc: (choice: AdHocChoice, reasons: readonly DeferralReason[]) => AdHocOutcome | null;
  /** the STEMI call has been heard */
  acknowledgeAdHocCall: () => void;
  /** the study report this case's diagnostic lab submitted, as the gate reads it (null: none) */
  adHocReport: () => AdHocReport | null;
  /** the gate's facts now (null without a session or a gate) */
  adHocInputs: () => AdHocInputs | null;
  toPci: () => void;
  backToCase: () => void;
  finish: () => SessionSummary | null;
}

let caseCounter = 0;
/** bumped by every newCase: a stepped build that is no longer the latest stops and is dropped */
let buildToken = 0;
/** between autopilot steps: let the browser paint and handle input */
const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
/** The diagnostic lab's title for an ad hoc decision case (neutral: it names no finding). */
export const AD_HOC_STUDY_NAME = "Full case: the diagnostic study";
const UNREACHED_NOTICE = "This case could not be set up at the requested stage; it opens at the chart.";
const newSeed = () => `case-${Date.now().toString(36)}-${(caseCounter++).toString(36)}`;

/** The mode and entrustment for an access case: the policy set by the progression screens, else guided. */
function policyFor(access: AccessRoute): { mode: AssessmentMode; entrustment: EntrustmentLevel } {
  const pol = useProgressStore.getState().activePolicy;
  const epa = access === "femoral" ? "access-femoral" : "access-radial";
  if (pol && pol.epa === epa) return { mode: pol.mode, entrustment: pol.entrustment as EntrustmentLevel };
  return { mode: "guided", entrustment: 2 };
}

export const useProcedureStore = create<ProcStore>((set, get) => ({
  session: null,
  engine: null,
  version: 0,
  seed: "",
  access: "radial-right",
  mode: "guided",
  workspace: "chart",
  stage: "lab",
  handover: null,
  labMark: null,
  summary: null,
  logged: false,
  scenarioId: DEFAULT_SCENARIO_ID,
  adhoc: null,
  studyLoaded: false,
  run: null,
  launchNotice: null,
  preparing: false,

  newCase: (o = {}) => {
    const scenario = scenarioById(o.scenario ?? DEFAULT_SCENARIO_ID);
    const scenarioId = scenario?.id ?? DEFAULT_SCENARIO_ID;
    const access = o.access ?? scenario?.access ?? get().access;
    const seed = o.seed ?? scenario?.seed ?? newSeed();
    const pol = policyFor(access);
    const mode: AssessmentMode = o.mode ?? scenario?.mode ?? pol.mode;
    const base = { seed, access, indication: o.indication, mode, entrustment: pol.entrustment, scenario: scenarioId };
    const start: ScenarioStart = o.start ?? scenario?.start ?? "chart";
    const token = ++buildToken;

    const open = (made: ReturnType<typeof newCaseSession>, at: ScenarioStart, launchNotice: string | null) => {
      const { session, engine } = made;
      get().session?.dispose();
      const st = useProgressStore.getState();
      const run = new LabRun({
        sim: "procedure",
        // a random patient is its own case (procedure:default~<seed>); a scenario with a fixed seed is one case
        caseId: runCaseId("procedure", scenarioId, scenario?.seed ? null : seed),
        // the session's mode is the run's mode (the launch's, else the level-derived one)
        launchMode: mode,
        source: "full-case",
        caseName: `Full case, ${access === "femoral" ? "femoral" : "radial"} access${scenarioId !== DEFAULT_SCENARIO_ID ? `: ${scenario?.title ?? scenarioId}` : ""}`,
        epa: access === "femoral" ? "access-femoral" : "access-radial",
        progress: { activePolicy: st.activePolicy, profile: st.profile },
        clock: () => session.tS,
      });
      // a case that opens at the hand-over gate opens at the table, where the catheter and the side arm are
      const workspace = o.workspace && at === start ? o.workspace : session.pciGateOpen ? "table" : WORKSPACE_FOR_START[at];
      // the live lab: an emergency may hold a compression, band or recovery time-lapse (modules/emergencies.ts)
      session.lapseHoldsOn = true;
      // a scenario that opens at the ad hoc or delayed PCI decision (proc-adhoc-gate); not on a case that fell back to the chart
      const adhoc = at === start && adHocSetupOf(scenario)?.openAtStart ? openAdHocGate(session) : null;
      set({ session, engine, seed, access, mode, workspace, stage: "lab", handover: null, labMark: null, summary: null, logged: false, scenarioId, adhoc, studyLoaded: false, run, launchNotice, preparing: false, version: get().version + 1 });
    };
    // the autopilot could not reach the stage with this patient: open the same case at the chart
    const unreached = (e: unknown) => {
      if (!(e instanceof AutopilotError)) throw e;
      if (import.meta.env.DEV) console.warn(`[full case] ${e.message}`);
      return newCaseSession({ ...base, start: "chart" });
    };

    if (start === "chart") {
      open(newCaseSession({ ...base, start }), "chart", null);
      return Promise.resolve();
    }
    // played one autopilot step per task: the lab shows 'Preparing the patient' meanwhile
    get().session?.dispose();
    set({ session: null, engine: null, preparing: true, stage: "lab", handover: null, labMark: null, summary: null, logged: false, launchNotice: null, adhoc: null, studyLoaded: false, version: get().version + 1 });
    return newCaseSessionStepped({ ...base, start }, pause, () => token !== buildToken).then(
      (made) => {
        if (made && token === buildToken) open(made, start, null);
      },
      (e: unknown) => {
        if (token !== buildToken) return;
        try {
          open(unreached(e), "chart", UNREACHED_NOTICE);
        } catch (err) {
          set({ preparing: false, version: get().version + 1 });
          throw err;
        }
      },
    );
  },

  askHelp: () => {
    const { session: s, run } = get();
    if (!s) return;
    s.askHelp();
    run?.askHelp(s.tS);
    set({ version: get().version + 1 });
  },

  act: (fn) => {
    const s = get().session;
    if (!s) return undefined;
    const r = fn(s);
    // a case postponed before any puncture ends here: the summary and the logbook row, on the handover workspace
    if (!get().logged && s.postponement()?.beforePuncture && get().stage === "lab" && get().finish()) {
      set({ workspace: "handover" });
      return r;
    }
    set({ version: get().version + 1 });
    return r;
  },

  bump: () => set({ version: get().version + 1 }),

  setWorkspace: (w) => set({ workspace: w }),

  setAccess: (a) => {
    const s = get().session;
    if (s && s.setAccess(a)) set({ access: a, version: get().version + 1 });
    else if (!s) set({ access: a });
  },

  tick: (dt) => {
    const s = get().session;
    if (!s || get().stage !== "lab") return;
    // a case postponed before any puncture is over once logged: its clock and patient stop with the debrief
    if (get().logged && s.postponement()?.beforePuncture) return;
    s.tick(dt);
    // the ad hoc gate's STEMI call comes in on the clock
    const g = get().adhoc;
    if (g && interruptionDue(g, s.tS)) set({ adhoc: interruptAdHoc(s, g) });
  },

  /** Hand the case to the diagnostic lab: same patient, anatomy and access. */
  toDiagnostic: () => {
    const s = get().session;
    if (!s) return;
    const h = s.handover("diagnostic");
    if (!h) return set({ version: get().version + 1 });
    // an ad hoc decision case: the generator's case name ('RCA — mid rca') can contradict the case's own
    // lesions, which the gate's findings name, so the diagnostic lab shows a neutral title instead (the id is kept)
    const caseData = adHocSetupOf(s.scenario) ? { ...h.caseData, name: AD_HOC_STUDY_NAME } : h.caseData;
    useSimulatorStore.getState().loadCase(caseData, "free");
    set({ stage: "diagnostic", handover: h, studyLoaded: true, labMark: { wall: performance.now() / 1000, tPatient: get().engine?.time ?? 0 }, version: get().version + 1 });
  },

  /** Back from the diagnostic lab to the hand-over gate before ad hoc PCI (the same patient and access). */
  openPciGate: () => {
    const { session: s, stage } = get();
    if (!s) return;
    if (stage !== "lab") get().backToCase();
    const g = s.openPciGate();
    set({ workspace: g ? "table" : get().workspace, version: get().version + 1 });
  },

  closePciGate: () => {
    const s = get().session;
    if (!s) return;
    s.closePciGate();
    set({ version: get().version + 1 });
  },

  /** Back from the diagnostic lab to the ad hoc or delayed PCI decision (the same patient and access). */
  openAdHocGate: () => {
    const { session: s, stage, adhoc } = get();
    if (!s) return;
    if (stage !== "lab") get().backToCase();
    // a decision already taken stands; a pending gate stays as it is (its call keeps its time)
    if (adhoc) return set({ version: get().version + 1 });
    set({ adhoc: openAdHocGate(s), version: get().version + 1 });
  },

  decideAdHoc: (choice, reasons) => {
    const { session: s, adhoc: g, stage } = get();
    if (!s || !g || g.outcome || stage !== "lab" || s.busy) return null;
    // the call interrupts the pending decision: it comes in now, and is heard before anything is decided
    if (interruptionDue(g, s.tS, true)) {
      set({ adhoc: interruptAdHoc(s, g), version: get().version + 1 });
      return null;
    }
    if (g.interruptedAt !== null && g.acknowledgedAt === null) return null;
    if (choice === "defer" && !reasons.length) return null;
    const outcome = recordAdHocDecision(s, adHocInputs(s, g, get().adHocReport()), choice, reasons);
    let workspace = get().workspace;
    if (choice === "proceed") {
      // on to the hand-over gate: the PCI heparin dose and the ACT at the table
      if (s.openPciGate()) workspace = "table";
    } else {
      s.closePciGate();
      workspace = "closure";
    }
    set({ adhoc: { ...g, outcome }, workspace, version: get().version + 1 });
    return outcome;
  },

  acknowledgeAdHocCall: () => {
    const { session: s, adhoc: g } = get();
    if (!s || !g || g.interruptedAt === null || g.acknowledgedAt !== null) return;
    set({ adhoc: { ...g, acknowledgedAt: Math.round(s.tS * 10) / 10 }, version: get().version + 1 });
  },

  adHocReport: () => {
    const { session: s, studyLoaded } = get();
    if (!s || !studyLoaded) return null;
    const sim = useSimulatorStore.getState();
    // the lab's report is this case's only when the lab holds this case (a new case in the lab clears it)
    return sim.caseData?.id === s.caseData.id ? adHocReportFrom(sim.studyReport) : null;
  },

  adHocInputs: () => {
    const { session: s, adhoc: g } = get();
    return s && g ? adHocInputs(s, g, get().adHocReport()) : null;
  },

  /** Ad hoc PCI through the same access (through the hand-over gate when it is open; after 'proceed' at the ad hoc gate when the case has one). */
  toPci: () => {
    const s = get().session;
    if (!s) return;
    const g = get().adhoc;
    if (g && g.outcome?.choice !== "proceed") {
      s.say(g.outcome ? "We decided to stop and plan: no ad hoc PCI today." : "First the decision: ad hoc PCI now, or stop and plan?", "safety", { stop: true });
      return set({ version: get().version + 1 });
    }
    const h = s.toPci();
    if (!h) return set({ version: get().version + 1 });
    // the target chosen in the study report, with the strategy decided at the gate
    if (g?.outcome?.target) h.pciTarget = { ...g.outcome.target };
    set({ stage: "pci", handover: h, labMark: { wall: performance.now() / 1000, tPatient: get().engine?.time ?? 0 }, version: get().version + 1 });
  },

  /** Back from the diagnostic or PCI lab with that lab's totals. */
  backToCase: () => {
    const { session: s, stage, labMark } = get();
    if (!s || stage === "lab") return;
    const durationS = labMark ? performance.now() / 1000 - labMark.wall : 0;
    const rep = labReporter?.() ?? null;
    if (rep) {
      // the lab ran this case's patient engine: its time and contrast are already the patient's
      s.returnFromLab(stage, { contrastMl: rep.contrastMl, fluoroS: rep.fluoroS, karMGy: rep.karMGy, kapGyCm2: rep.kapGyCm2, durationS: rep.patientAdvanced ? Math.max(0, (get().engine?.time ?? 0) - (get().labMark?.tPatient ?? 0)) : durationS, patientAdvanced: rep.patientAdvanced });
    } else if (stage === "diagnostic") {
      const sim = useSimulatorStore.getState();
      const dose = labImaging.diagnostic?.dose.totals;
      s.returnFromLab("diagnostic", { contrastMl: sim.score.contrastVolume, fluoroS: dose?.fluoroTimeS ?? sim.fluoroTime, karMGy: dose?.karMGy.total, kapGyCm2: dose?.kapGyCm2.total, durationS });
    } else {
      const dose = labImaging.pci?.dose.totals;
      // the PCI lab keeps its contrast total in component state; until it reports it (C5.md, integration) only dose is carried
      s.returnFromLab("pci", { contrastMl: 0, fluoroS: dose?.fluoroTimeS ?? 0, karMGy: dose?.karMGy.total, kapGyCm2: dose?.kapGyCm2.total, durationS });
    }
    set({ stage: "lab", workspace: "closure", labMark: null, version: get().version + 1 });
  },

  finish: () => {
    const s = get().session;
    if (!s) return null;
    const sum = s.finish();
    if (!sum) {
      set({ version: get().version + 1 });
      return null;
    }
    const run = get().run;
    if (!get().logged && run) logCase(run, s, sum);
    set({ summary: sum, logged: true, version: get().version + 1 });
    return sum;
  },
}));
