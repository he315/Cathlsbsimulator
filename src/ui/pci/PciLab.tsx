import { useEffect, useMemo, useRef, useState } from "react";
import LabLayout from "../lab/LabLayout";
import ReferenceMonitor from "../lab/ReferenceMonitor";
import HaemoMonitor from "../lab/HaemoMonitor";
import DosePanel from "../lab/DosePanel";
import TableView from "../lab/TableView";
import TableSideControls from "../lab/TableSideControls";
import TechniqueTips from "../lab/TechniqueTips";
import AttendingDrawer from "../mentor/AttendingDrawer";
import MentorVoice from "../mentor/MentorVoice";
import TeamBar from "../team/TeamBar";
import Captions from "../team/Captions";
import TeamReport from "../team/TeamReport";
import { labScreens, modeLabel, pciSimMode } from "../lab/visibility";
import { useLabRun, runCaseId, sourceForSim } from "../lab/labRun";
import { useProgressStore } from "../../state/useProgressStore";
import { pciScenarioDef } from "../../simulation/pci/scenarios/registry";
import { lastLiveEvent, liveLog } from "../../simulation/pci/actions/assessment";
import PciAssessPanel, { recordMeasurement } from "./PciAssessPanel";
import { loadTips, loadedTips, selectTips, useTipsModule, DEFAULT_TIP_LIMIT, type TipsModule } from "../lab/useLabTips";
import { registerLabHook } from "../../dev/labHooks";
import { labImaging } from "../../render/xray/sceneBuilder";
import { DEFAULT_SETTINGS } from "../../render/xray/adrc";
import { useSeriesStore } from "../../state/useSeriesStore";
import { setLabReporter, useProcedureStore } from "../../state/useProcedureStore";
import { PCI_SCENARIOS, branchLabel, sampleAtMm } from "../../simulation/angioPci";
import { GUIDE_BY_ID } from "../../simulation/pci/equipment";
import type { PciDevicesCapability } from "../lab/controls/tabs/PciDevicesTab";
import { PCI_CINE_RATES, PCI_FLUORO_RATES, PciLabSession, viewsFor, type PciHandover } from "./PciLabSession";
import PciLiveMonitor from "./PciLiveMonitor";
import { consolesFor, pciConsoles, usePciSession } from "./consoles/registry";
import { usePciInput } from "./usePciInput";
import { usePciLaunch, type PciLaunch } from "./launch";
import RecognitionForm, { assessmentClass, assessmentEffects, assessmentSummary } from "./RecognitionForm";
import { pciTipContext } from "../lab/pciTips";
import { awaitingAssessment, submitRecognition, withRecognition } from "../lab/pciEvents/recognition";
import { cxDebrief } from "../../simulation/complications/engine";
import Debrief from "../mentor/Debrief";
import { usePciAttending, type PciAttending } from "./usePciAttending";
import PciPrebrief from "./PciPrebrief";
import PciSignOut from "./PciSignOut";
import { FORECAST_LABELS } from "../../content/mentor/prebriefs";
import PciCheckpoint, { BudgetCounters, CheckpointReview } from "./PciCheckpoint";
import { decisionLabel, type BudgetCheckpoint, type CheckpointAnswer } from "../../simulation/pci/budgets";
import type { LaunchMode } from "../../content/schema";
import { isLaunchMode } from "../../content/validateLaunch";
import { buildAnatomy } from "../../simulation/anatomy";
import { buildCoronaryTree } from "../../render/xray/coronaryTree";
import { scenarioCase } from "../../simulation/pci/actions/scenario";
import { recordAct } from "../../simulation/pci/actions/drugs";
import { ACT_TARGET_S } from "../../simulation/pci/lesionAssessment";
import { complicationLabel } from "../../simulation/complications/engine";
import { startOf, targetIndex } from "../../simulation/pci/scenarios/registry";
import { actAtTarget, catheterName, pciLabReport, resolvedFromCase, scenarioFromCase, targetCheckText, withPlaceableLesions, type CasePciScenarioDef } from "../../simulation/pci/scenarios/fromCase";
import { deliveredHeparinU, lesionIdOf, type LabReport, type PciTarget, type WithHandover } from "../../simulation/session/handover";
import { SHEATHS } from "../../simulation/access/closure";
import type { Lesion, VesselId } from "../../types";
import { applyDeliveryAction } from "./inputBindings/support";

// ---------------------------------------------------------------------------
// The PCI lab on the diagnostic lab's full-screen shell (pci-lab-shell-session):
// the live monitor (pedal-gated fluoroscopy and cine), the reference monitor
// (stored runs, QCA on a paused frame), the haemodynamic monitor, the dose
// display (pulse rates 3.75 to 30, the skin map), the table strip with the
// guide set-up, and the table-side controls (the PCI tabs of the registry,
// with the device consoles under Devices). One PciLabSession per case: a new
// or repeated case gets a fresh patient, dose and syringes (a hand-over from
// the full case keeps the case's own patient). The lab takes a pending launch
// (scenario, variant, start, mode) on mount. The keys are the earlier lab's
// (usePciInput) until pci-lab-input moves them onto the S8 input system.
// Technique tips are in the attending drawer (guided practice) and behind the
// help button, following labScreens; the live screens show no ground truth.
// Complications show as cues until the learner assesses them (Assess, or the
// attending's prompt in guided practice: src/ui/pci/RecognitionForm.tsx); the
// assessment is attending dialogue in the drawer in supervised and independent
// practice and a dialogue that holds the clock and the hands in guided
// practice and exams (pci-cx-recognition). The tip context reads the
// learner's recognitions (withRecognition).
// The budgets (pci-budgets-stop-rules): the contrast, air kerma and time
// counters beside the dose display (the contrast counter turns the warning
// colour at 50% of the ceiling), the limits agreed at the plan passed to the
// session, and the stop-or-continue checkpoint, a dialogue that holds the
// beam and the hands in guided practice and exams and attending dialogue in
// the drawer otherwise; a decision to stop opens the sign-out. The debrief
// lists every checkpoint decision with the dose, contrast and time.
// The attending (pci-attending, src/ui/pci/usePciAttending.ts) runs the case:
// the pre-brief and plan, the team time-out, the safety stops through the
// session's beforeAction, the sign-out and the PEARLS debrief with the logbook
// row's measured metrics. Its dialogues hold the hands in guided practice and
// exams and are attending dialogue in the drawer in supervised and
// independent practice.
// Ad hoc PCI from the full case (pci-adhoc-handover): a hand-over opens the
// lab on the case's own scenario (caseLaunchFor: scenarioFromCase in
// src/simulation/pci/scenarios/fromCase.ts), the anatomy and lesions of the
// diagnostic study with the report's target as the target, in the case's
// mode, on the case's PatientEngine, with its dose and contrast carried on.
// The diagnostic catheter is in the root (phase 'guide' until a guide is
// engaged); an ACT measured at the hand-over gate after the last heparin
// dose is carried in, and 'low-act' is held until an ACT at the case's PCI
// target is measured (the supervised gate keeps a device in the guide until
// then). On 'back to the case' the lab leaves its LabReport (stents, final
// TIMI, complications, residual, contrast, dose, duration and the finish
// flags) on the case session (stageLabReport) for returnFromLab, with the
// comparison of the target with the case truth, which the case's summary
// gives at the end (the PCI debrief shows it only as a teaching aid). A
// target the lab's tree cannot place is marked 'unplaced' and the lesion
// treated instead is named as such.
// Assessment policy and QCA (pci-assessment-policy-qca): the run's policy is
// the PCI lab's (resolveLabPolicy with lab 'pci': the scenario's EPA, an exam
// from the launch or the progression's active exam of this case, a launch mode
// over the level). QCA is the trainee's own, on stored runs on the reference
// monitor, calibrated on the guide's French size, estimate first where the
// policy says so; the result is recorded as the trainee's measurement
// (submitEstimate). The measurement and the sizing choice are on the
// Measure panel (PciAssessPanel.tsx), never auto-sized. The coach read-outs
// (wire and device against the lesion, the log) are a teaching aid: offered
// only with labScreens' teachingAids, in the attending drawer, off until
// switched on; the logs show only what an operator could see (liveLog).
// ---------------------------------------------------------------------------

/** The tip context of a session: its snapshot with the learner's recognitions (src/ui/lab/pciEvents/recognition.ts). */
export function labTipContext(session: PciLabSession) {
  return pciTipContext(withRecognition(session.snapshot()));
}

/** The attending's prompt when something has changed (guided practice). */
const ASSESS_PROMPT = "Something has changed. Before you treat it, tell me what you see: keep the wire, look again, then name and grade it.";
/** The prompt when more than one change awaits an assessment (each gets its own, oldest first). */
const ASSESS_PROMPT_MORE = "More than one thing has changed. Before you treat anything, tell me what you see, one change at a time: keep the wire, look again, then name and grade the first.";

const DEV = !!(import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;

/** The full case's hand-over with the found-handover-contract extensions it carries (the PCI target among them). */
type CaseHandoverData = WithHandover<PciHandover["h"]>;

/** The vessels the PCI lab's coronary tree has for a case definition (a lesion elsewhere cannot be placed). */
function labVessels(def: CasePciScenarioDef): (v: VesselId) => boolean {
  const c = scenarioCase(resolvedFromCase(def).scenario);
  const tree = buildCoronaryTree(buildAnatomy(c), { ...c, lesions: [] });
  const names = new Set<string>();
  for (const v of tree.vessels) {
    names.add(v.name);
    if (v.lesionId) names.add(v.lesionId);
  }
  return (v) => names.has(v);
}

/**
 * The PCI launch of a full-case hand-over (pci-adhoc-handover): the scenario built from the case (its anatomy
 * and lesions, the study report's target), the default start (the diagnostic catheter in the root) unless
 * `start` names another, and the case's mode. Null when the case has no lesion the lab can place.
 */
export function caseLaunchFor(handover: PciHandover, o: { start?: string; mode?: LaunchMode; target?: PciTarget | null } = {}): PciLaunch | null {
  const h = handover.h as CaseHandoverData;
  if (!h.caseData?.lesions?.length) return null;
  const target = o.target !== undefined ? o.target : (h.pciTarget ?? null);
  const opts = {
    contrastMl: h.contrastMl,
    contrastBudgetMl: h.contrastBudgetMl,
    catheterId: h.catheterInAscendingAorta ? h.catheterId : null,
    heparinised: h.anticoag ? deliveredHeparinU(h.anticoag) > 0 : h.heparinU > 0,
    french: (SHEATHS[h.sheath]?.fr ?? 6) >= 7 ? (7 as const) : (6 as const),
  };
  let def = scenarioFromCase(h.caseData, target, h.profile, opts);
  const has = labVessels(def);
  if (!h.caseData.lesions.some((l) => has(l.vessel))) return null;
  // the lab cannot place the chosen lesion: the most severe lesion it can place, marked 'unplaced' (the brief and
  // the debrief name the report's choice and the lesion treated); the definition keeps its id, so the same tree
  if (!has(def.lesions[targetIndex(def)].vessel)) def = scenarioFromCase(h.caseData, target, h.profile, { ...opts, placeable: has });
  def = withPlaceableLesions(def, has);
  const resolved = resolvedFromCase(def);
  const start = startOf(resolved.def, o.start) ?? startOf(resolved.def)!;
  const mode: LaunchMode = o.mode ?? (isLaunchMode(h.mode) ? h.mode : "guided");
  return {
    source: "handover",
    params: { scenario: def.id, start: start.id, mode },
    resolved,
    start,
    mode,
    events: [...new Set([...resolved.events, ...(start.events ?? [])])],
  };
}

/** The case definition behind a session opened from a hand-over (null for a registry scenario). */
export function caseDefOf(session: PciLabSession): CasePciScenarioDef | null {
  const d = session.resolved.def as Partial<CasePciScenarioDef>;
  return d.caseIdentity && d.targetCheck ? (session.resolved.def as unknown as CasePciScenarioDef) : null;
}

/**
 * A handed-over session at its start: the ACT measured at the hand-over gate after the last heparin dose is
 * carried in (the lab's ACT panel shows it), and 'low-act' is held until an ACT at the case's PCI target is
 * measured. Returns the unsubscribe.
 */
export function prepareHandedOver(session: PciLabSession, handover: PciHandover): () => void {
  const h = handover.h as CaseHandoverData;
  const doses = h.anticoag?.doses ?? [];
  const lastDoseT = doses.filter((d) => d.delivered).reduce((m, d) => Math.max(m, d.t), -Infinity);
  const last = h.anticoag?.lastAct ?? (h.lastAct ? { t: h.lastAct.t, act: h.lastAct.act } : null);
  if (last && Number.isFinite(last.act) && last.t >= lastDoseT && session.st.act === null) applyDeliveryAction(session, "drug", (x) => recordAct(x, last.act));
  const targetS = h.pciReady?.actTargetS[0] ?? h.anticoag?.targetS?.[0] ?? ACT_TARGET_S;
  if (actAtTarget(session.st.act, targetS)) return () => {};
  session.events.hold(["low-act"], undefined, "handover");
  let off: (() => void) | null = null;
  const check = () => {
    if (!actAtTarget(session.st.act, targetS)) return;
    session.events.clear("low-act");
    off?.();
    off = null;
  };
  off = session.subscribe(check);
  return () => off?.();
}

/**
 * The LabReport the PCI lab returns to the case (fromCase.pciLabReport on this session). `caseLesions` are every
 * lesion of the case (the hand-over's caseData, which keeps the lesions this lab could not place); absent, the
 * session's own definition's.
 */
export function caseReportOf(session: PciLabSession, caseLesions?: readonly Lesion[]): LabReport {
  const def = caseDefOf(session);
  const l = session.resolved.def.lesions[session.resolved.targetIdx];
  const snap = withRecognition({ ...session.snapshot(), prebriefOpen: false, planOpen: false, guideIntroduced: true, finishing: true });
  return pciLabReport({
    st: session.st,
    target: { lesionId: def?.targetCheck.lesionId ?? lesionIdOf(l), vessel: l.vessel, segment: def?.chosen?.segment ?? null },
    contrastMl: session.contrastTotal(),
    dose: session.doseAdded(),
    durationS: session.wall(),
    finishEvents: pciTipContext(snap).events ?? [],
    labelOf: complicationLabel,
    lesions: caseLesions ?? session.resolved.def.lesions,
  });
}

export default function PciLab({ handover = null }: { handover?: PciHandover | null }) {
  const [launch, setLaunch] = useState<PciLaunch | null>(null);
  const [launchProblems, setLaunchProblems] = useState<string[]>([]);
  const [scenarioId, setScenarioId] = useState(PCI_SCENARIOS[0].id);
  const [runKey, setRunKey] = useState(0);
  // a lesson, case or the case library opened the lab at a named scenario (found-launch-links); the
  // full case's hand-over is its own patient, so a launch waits for the free lab
  usePciLaunch((r) => {
    setLaunchProblems(r.problems);
    if (!r.launch) return;
    setLaunch(r.launch);
    setScenarioId(r.launch.resolved.def.id);
    setRunKey((k) => k + 1);
  }, !handover);
  // a hand-over from the full case opens on the case's own scenario (pci-adhoc-handover)
  // (keyed on the hand-over's case and start, which the full case keeps, not on the wrapper object rebuilt each render)
  const handH = handover?.h ?? null;
  const handStart = handover?.start ?? null;
  const caseLaunch = useMemo(() => (handH && handStart ? caseLaunchFor({ h: handH, start: handStart }) : null), [handH, handStart]);
  const active = launch ?? caseLaunch;
  const sid = active ? active.resolved.def.id : scenarioId;
  const title = active ? active.resolved.scenario.title : PCI_SCENARIOS.find((x) => x.id === sid)?.title;
  // the PCI policy (pci-assessment-policy-qca): the scenario's EPA, and an exam when the progression's
  // active policy is an exam of this case (a launch's mode is applied over it by the run)
  const variant = launch?.params.variant ?? null;
  const runId = runCaseId("angio-pci", sid, variant);
  const progress = useProgressStore.getState();
  const simMode = pciSimMode([runId, sourceForSim("angio-pci", sid, variant)], { activePolicy: progress.activePolicy, profile: progress.profile });
  const epa = active?.resolved.def.epa ?? pciScenarioDef(sid)?.epa;
  const labRun = useLabRun("angio-pci", runId, active?.mode ?? null, { runKey, caseName: title, simMode, ...(epa ? { epa } : {}) });
  const policyRef = useRef(labRun.policy);
  policyRef.current = labRun.policy;

  // one session per case, per repeat and per launch: patient, imaging, C-arm, table, syringes, recorder
  // The session is kept with the key it was built for: on a case change or a repeat the screen waits for
  // the new session instead of remounting once on the disposed one (a WebGL context and the hooks).
  const caseKey = `${sid}:${runKey}`;
  const [built, setBuilt] = useState<{ key: string; session: PciLabSession } | null>(null);
  useEffect(() => {
    const x = new PciLabSession({ scenarioId: sid, launch: launch ?? caseLaunch, handover, mode: policyRef.current.mode, policy: policyRef.current });
    // a hand-over from the full case is the same patient: its diagnostic runs stay on the reference monitor
    if (!handover) useSeriesStore.getState().clear();
    // the hand-over's ACT carried in, 'low-act' held until the PCI target is met
    const offAct = handover && caseLaunch ? prepareHandedOver(x, handover) : null;
    labImaging.pci = x.lab;
    setBuilt({ key: `${sid}:${runKey}`, session: x });
    return () => {
      offAct?.();
      x.dispose();
      if (labImaging.pci === x.lab) labImaging.pci = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the hand-over is keyed on its case and start (see caseLaunch)
  }, [sid, launch, caseLaunch, handH, handStart, runKey]);
  const session = built && built.key === caseKey && !built.session.disposed ? built.session : null;
  useEffect(() => {
    session?.setPolicy(labRun.policy);
  }, [session, labRun.policy]);

  // the case comes back with this lab's dose (its contrast is already in the shared engine) and, left on the case
  // session for returnFromLab, the lab's report with the target and its comparison with the case truth
  useEffect(() => {
    if (!handover || !session) return;
    return setLabReporter(() => {
      const d = session.doseAdded();
      const cs = useProcedureStore.getState().session;
      const def = caseDefOf(session);
      if (cs && cs.caseData.id === handover.h.caseData.id) {
        const c = def?.targetCheck;
        cs.stageLabReport(caseReportOf(session, handover.h.caseData.lesions), {
          target: def?.chosen ?? null,
          targetCheck: c && def ? { lesionId: c.lesionId, match: c.match, culpritId: c.culpritId, culpritVessel: c.culpritVessel, isCulprit: c.isCulprit, text: targetCheckText(def) } : null,
        });
      }
      return { contrastMl: 0, fluoroS: d.fluoroS, karMGy: d.karMGy, kapGyCm2: d.kapGyCm2, patientAdvanced: true };
    });
  }, [handover, session]);

  if (!session) return <div className="grid h-full place-items-center bg-base-900 text-[13px] text-ink-faint">Preparing the lab</div>;
  return (
    <PciLabScreen
      key={caseKey}
      session={session}
      labRun={labRun}
      handedOver={!!handover}
      launchProblems={launchProblems}
      onScenario={(id) => {
        setLaunch(null);
        setScenarioId(id);
        setRunKey((k) => k + 1);
      }}
      onRepeat={() => setRunKey((k) => k + 1)}
    />
  );
}

type LabRunApi = ReturnType<typeof useLabRun>;


/** The module tip shown inside the QCA steps in guided practice: the calibration tip. */
export const PCI_QCA_HINT_TIP = "pci-interp-qca-calibrate";

/**
 * The guided QCA hint: the module's calibration tip inside the QCA steps (a teaching aid, so only where the
 * policy gives teaching aids; this is how the tip reaches the learner at the measuring step, whatever its
 * rank in the tip panel). Undefined elsewhere or before the tips load.
 */
export function pciQcaHint(screens: { teachingAids: boolean }, tipsMod: TipsModule | null | undefined): string | undefined {
  const tip = screens.teachingAids ? tipsMod?.TIP_BY_ID[PCI_QCA_HINT_TIP] : undefined;
  return tip ? `${tip.title}. ${tip.text}` : undefined;
}

export function PciLabScreen({
  session,
  labRun,
  handedOver,
  launchProblems,
  onScenario,
  onRepeat,
}: {
  session: PciLabSession;
  labRun: LabRunApi;
  handedOver: boolean;
  launchProblems: string[];
  onScenario: (id: string) => void;
  onRepeat: () => void;
}) {
  usePciSession(session);
  const policy = labRun.policy;
  // the attending: pre-brief, plan, time-out, safety stops, sign-out, debrief (pci-attending)
  const attending = usePciAttending(session, policy, labRun.decide);
  // the assessment of a complication: a dialogue that holds the clock and the hands in guided practice
  // and exams, attending dialogue in the drawer otherwise (the procedure runs on)
  const [assess, setAssess] = useState<{ prompt?: string } | null>(null);
  const effects = assessmentEffects(policy.mode, !!assess, session.finished);
  const holding = !effects.stepClock;
  const holdRef = useRef(false);
  holdRef.current = holding;
  // the stop-or-continue checkpoint waiting (or just answered and still on screen)
  // the answered checkpoint, with the one already queued behind it when it was answered (shown after 'Back to the case')
  const [answered, setAnswered] = useState<{ cp: BudgetCheckpoint; queued: string | null } | null>(null);
  const answeredCp = answered?.cp ?? null;
  // a blocking checkpoint that opened during a run is shown when the run ends (PciLabSession.checkpointDue)
  const pendingCp = session.checkpointDue();
  // a checkpoint opened after the answer replaces the answered one still on screen (the drawer was closed
  // without 'Back to the case'); one already queued at the answer waits for 'Back to the case'
  const pendingCpId = pendingCp?.id ?? null;
  const staleAnswer = !!answered && pendingCpId !== null && pendingCpId !== answered.queued;
  const checkpoint = answeredCp && !staleAnswer ? answeredCp : pendingCp;
  useEffect(() => {
    if (staleAnswer) setAnswered(null);
  }, [staleAnswer]);
  const cpBlocks = session.checkpointBlocks();
  usePciInput(session, effects.handsEnabled && (attending?.handsEnabled() ?? true) && !session.checkpointHoldsBeam());
  const screens = labScreens(policy);
  const hintsAllowed = screens.hints !== "off" && policy.mode !== "exam";
  // the attending drawer is a dialogue over the lab: the session records its opening as an interruption
  const drawerOpen = session.openModals().includes("attending");
  const setDrawerOpen = (open: boolean) => (open ? session.openModal("attending") : session.closeModal("attending"));
  // the finish step: "Final result" asks before the case ends (every mode; it cannot be undone)
  const finishStep = session.finishing && !session.finished;
  const [debriefClosed, setDebriefClosed] = useState(false);
  // the Measure panel: the trainee's measurement and the sizing choice
  const [measureOpen, setMeasureOpen] = useState(false);
  // the coach read-outs (the drawer's teaching aid and the table strip's latest-event line): off until the
  // learner switches them on in the attending drawer, and only where labScreens offers them
  const [coach, setCoach] = useState(false);
  const tipsMod = useTipsModule();
  const s = session.s;
  const crew = session.crew;
  const helpRef = useRef<number | null>(labRun.helpAskedAt);
  helpRef.current = labRun.helpAskedAt;

  // the frame loop: patient, C-arm and table, syringes, procedure clock, team
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      // the blocking assessment holds the procedure clock (guided practice and exams)
      if (!holdRef.current) session.step(Math.min(0.1, (now - last) / 1000));
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const w = window as unknown as Record<string, unknown>;
    if (DEV) {
      // the earlier lab's development hooks, now on the session
      w.__pci = {
        get st() {
          return session.st;
        },
        g: session.g,
        s: session.s,
      };
      w.__pciStep = (seconds: number, dt = 1 / 30) => {
        for (let t = 0; t < seconds - 1e-9; t += dt) session.step(dt);
      };
      w.__pciSession = session;
      w.__pciCrew = session.crew;
      // the learner's assessment, headless (pci-cx-recognition)
      w.__pciRecognise = (answer: Parameters<typeof submitRecognition>[1]) => submitRecognition(session, answer);
      void loadTips();
    }
    // window.__lab.pci (DEV): the tip context, the tips the drawer would show, the session's state
    const offHook = registerLabHook("pci", {
      context: () => labTipContext(session),
      tips: () => {
        const mod = loadedTips();
        if (!mod) void loadTips();
        return selectTips(mod, labTipContext(session), { mode: session.policy.mode, helpAskedAt: helpRef.current }, DEFAULT_TIP_LIMIT).map((t) => t.id);
      },
      state: () => {
        const snap = session.snapshot();
        return { scenario: session.s.id, start: session.startDef.id, mode: session.policy.mode, workflow: snap.workflow, openModals: snap.openModals, openConsole: snap.openConsole, events: session.events.activeEntries(), ui: session.uiEvents().length, budget: snap.budget };
      },
      step: (seconds: number, dt = 1 / 60) => {
        for (let t = 0; t < seconds - 1e-9; t += dt) session.step(dt);
      },
      events: () => session.activeEvents(),
    });
    return () => {
      cancelAnimationFrame(raf);
      offHook();
      session.setPedal({ fluoro: false, cine: false });
    };
  }, [session]);

  // the device consoles for the table-side Devices tab
  useEffect(() => {
    const cap: PciDevicesCapability = {
      consoles: () => consolesFor(session.policy.mode).map((c) => ({ id: c.id, label: c.label })),
      openId: () => session.openConsoleId(),
      open: (id) => session.openConsole(id),
      close: () => session.closeConsole(),
      render: (id) => {
        const c = pciConsoles().find((x) => x.id === id);
        return c ? <c.Component session={session} /> : null;
      },
    };
    session.provideCapability("pciDevices", cap);
    return () => session.provideCapability("pciDevices", null);
  }, [session]);

  // window.__pciAttending (DEV): the attending of this case, for the development hooks and the browser checks
  useEffect(() => {
    if (!DEV || !attending) return;
    const w = window as unknown as Record<string, unknown>;
    w.__pciAttending = attending;
    return () => {
      if (w.__pciAttending === attending) delete w.__pciAttending;
    };
  }, [attending]);

  // the case brief opens the case (the attending opens it on attach; the tips are at phase 'plan' while it is open).
  // In supervised and independent practice its dialogue is in the drawer: open the drawer with it.
  const formStage = attending && attending.formOpen() ? attending.stage : null;
  useEffect(() => {
    if (attending && !attending.blocking && formStage) session.openModal("attending");
  }, [attending, formStage, session]);

  // the limits agreed at the plan go to the budgets: the contrast ceiling and the air kerma limit (CTO stop rules)
  useEffect(() => {
    if (!attending) return;
    let key = "";
    const sync = () => {
      if (!attending.planSubmitted) return;
      const ml = attending.plan.contrastCeilingMl > 0 ? attending.plan.contrastCeilingMl : null;
      const karGy = attending.plan.stopRules?.karGy && attending.plan.stopRules.karGy > 0 ? attending.plan.stopRules.karGy : null;
      const k = `${ml}|${karGy}`;
      if (k === key) return;
      key = k;
      session.setBudgetPlan({ contrastMl: ml, karGy });
    };
    sync();
    return attending.subscribe(sync);
  }, [attending, session]);

  // a checkpoint that does not block is attending dialogue: the drawer opens with it
  const cpId = pendingCp?.id ?? null;
  useEffect(() => {
    if (cpId && !cpBlocks) session.openModal("attending");
  }, [cpId, cpBlocks, session]);

  const answerCheckpoint = (a: CheckpointAnswer) => {
    const r = session.answerCheckpoint(a);
    if (!r?.answer) return null;
    setAnswered({ cp: r, queued: session.pendingCheckpoint()?.id ?? null });
    labRun.decide({
      id: `checkpoint-${r.id}`,
      t: r.answer.t,
      stage: r.reason === "radiation-limit" ? "radiation" : "contrast",
      label: `Stop or continue at ${r.reason === "radiation-limit" ? "the air kerma limit" : r.reason === "contrast-ceiling" ? "the contrast ceiling" : "the contrast warning"} (contrast ${Math.round(r.at.contrastMl)} mL, air kerma ${(r.at.karMGy / 1000).toFixed(1)} Gy, ${Math.round(r.at.elapsedS / 60)} min)`,
      correct: r.answer.correct,
      expected: r.answer.expected,
      given: `${decisionLabel(r.answer.decision)}${r.answer.nextStep ? `: ${r.answer.nextStep}` : ""} (progress: ${r.answer.progress.replace("-", " ")})`,
      lessonId: "cm-principles-closure-stopping",
      tipIds: s.target.kind === "cto" ? ["pci-stop-checkpoint", "pci-cto-strategy-stop-rules"] : ["pci-stop-checkpoint", "pci-planning-contrast-ceiling", "pci-planning-radiation-limit"],
    });
    return r;
  };
  const closeCheckpoint = () => {
    const stop = answeredCp?.answer?.decision === "stop";
    setAnswered(null);
    if (stop && !session.finished) openFinishStep(true);
  };

  // in supervised and independent practice Assess opens the attending drawer; it closes the drawer again
  // only when it was the one that opened it
  const assessOpenedDrawer = useRef(false);
  const openAssess = (prompt?: string) => {
    if (session.finished) return;
    setAssess({ prompt });
    if (effects.modalId === "attending" && !session.openModals().includes("attending")) assessOpenedDrawer.current = true;
    session.openModal(effects.modalId);
  };
  const closeAssess = () => {
    setAssess(null);
    session.closeModal("recognition");
    if (assessOpenedDrawer.current) session.closeModal("attending");
    assessOpenedDrawer.current = false;
  };
  // guided practice: the attending asks for an assessment when a complication has shown (a teaching aid;
  // in the other modes the learner must notice the cues and press Assess). One prompt per complication,
  // oldest first, and again after an answer that named the wrong cause; the next one comes once the form
  // has closed.
  const prompted = useRef(new Set<string>());
  useEffect(() => {
    if (policy.mode !== "guided") return;
    const key = (c: { id: string; recognised?: { attempt?: number } | null }) => `${c.id}:${c.recognised ? (c.recognised.attempt ?? 1) : 0}`;
    const check = () => {
      const open = session.openModals();
      if (session.finished || open.includes("prebrief") || open.includes("signout") || open.includes("recognition")) return;
      const fresh = awaitingAssessment(session.st).filter((c) => !prompted.current.has(key(c)));
      if (!fresh.length) return;
      prompted.current.add(key(fresh[0]));
      setAssess({ prompt: fresh.length > 1 ? ASSESS_PROMPT_MORE : ASSESS_PROMPT });
      session.openModal("recognition");
    };
    check();
    return session.subscribe(check);
  }, [session, policy.mode]);

  // the end of the case: through the attending (the sign-out gate), then one logbook row with the measured
  // metrics of the record (pciMetrics), not a 100 or 0 score
  const finish = () => {
    const r = session.finished ? session.result : attending ? (attending.finishCase(), session.result) : session.finish();
    if (!r || !session.finished) return;
    setAssess(null);
    session.closeModal("recognition");
    setDrawerOpen(false);
    session.openModal("debrief");
    const d = session.lab.dose.totals;
    const m = attending?.metrics ?? null;
    const sign = attending?.signOut;
    labRun.finish({
      passed: attending?.assessment ? attending.assessment.debrief.summary.passed && r.passed : r.passed,
      complications: m ? m.complications : r.metrics.complications.map((c) => c.kind),
      criticalErrors: m ? m.criticalErrors.length : r.metrics.complications.filter((c) => !c.treated).length,
      metrics: m ? { ...attending!.metricNumbers(), residualDS: r.metrics.residualDS } : { residualDS: r.metrics.residualDS, contrastMl: Math.round(r.metrics.contrastMl), cineRuns: r.metrics.cineRuns },
      fluoroS: d.fluoroTimeS,
      karMGy: d.karMGy.total,
      kapGyCm2: d.kapGyCm2.total,
      contrastMl: session.contrastTotal(),
      runs: d.cineRuns,
      durationS: session.wall(),
      ...(sign?.logbook.presentation ? { indication: sign.logbook.presentation } : {}),
      ...(sign && attending?.signOutDone ? { notes: [sign.logbook.role ? `role: ${sign.logbook.role.replace(/-/g, " ")}` : "", sign.logbook.complexity ? `complexity: ${sign.logbook.complexity}` : "", sign.logbook.techniques ? `techniques: ${sign.logbook.techniques}` : ""].filter(Boolean).join("; ") } : {}),
    });
  };

  // "Final result" opens the sign-out (every mode); the sign-out ends the case
  const openFinishStep = (open: boolean) => {
    if (attending) {
      if (open) attending.openSignOut();
      else attending.closeSignOut();
    } else session.setFinishStep(open);
    // in guided practice the drawer shows the finish tips while the step is open
    if (open && screens.attendingDrawer) setDrawerOpen(true);
    if (open && attending && !attending.blocking) setDrawerOpen(true);
  };

  // "Case brief": a form already open stays where it is (in supervised and independent practice the
  // drawer opens on it, since those modes have no Attending button); otherwise the brief, or the agreed
  // plan (read-only), opens again
  const openCaseBrief = () => {
    if (!attending) {
      session.openModal("prebrief");
      return;
    }
    if (!attending.formOpen()) attending.reopen(attending.planSubmitted ? "plan" : "brief");
    if (!attending.blocking) setDrawerOpen(true);
  };

  const askHelp = () => {
    labRun.askHelp(session.wall());
    attending?.askHelp();
    setDrawerOpen(true);
  };

  const header = (
    <>
      <h1 className="truncate text-[15px] font-semibold text-ink">PCI in the cath lab</h1>
      <select value={session.resolved.def.id} onChange={(e) => onScenario(e.target.value)} className="h-8 rounded-md border border-line bg-base-800 px-2 text-[13px] text-ink" aria-label="Scenario" disabled={handedOver}>
        {PCI_SCENARIOS.map((x) => (
          <option key={x.id} value={x.id}>
            {x.title}
          </option>
        ))}
        {/* a launched scenario the free list does not offer (a held-out exam case) */}
        {!PCI_SCENARIOS.some((x) => x.id === session.resolved.def.id) && <option value={session.resolved.def.id}>{session.resolved.def.title}</option>}
      </select>
      <span className="chip shrink-0">{modeLabel(policy)}</span>
      <span className="flex-1" />
      {!session.finished && (
        <button className={`btn btn-ghost h-8 ${assess ? "!text-accent" : ""}`} onClick={() => (assess ? closeAssess() : openAssess())} aria-pressed={!!assess} title="Name and grade what has changed on the image, the trace or the patient">
          Assess
        </button>
      )}
      <button className="btn btn-ghost h-8" onClick={openCaseBrief} title="The case and the plan">
        Case brief
      </button>
      {!session.finished && (
        <button className={`btn btn-ghost h-8 ${measureOpen ? "!text-accent" : ""}`} onClick={() => setMeasureOpen(!measureOpen)} aria-pressed={measureOpen} title="Your lesion measurement and the stent size it gives">
          Measure
        </button>
      )}
      {attending && !attending.timeOutDone && attending.stage === "case" && !session.finished && (
        <button className="btn btn-ghost h-8" onClick={() => attending.reopen("timeout")} title="Run the team time-out">
          Time-out
        </button>
      )}
      {screens.attendingDrawer && (
        <button className={`btn btn-ghost h-8 ${drawerOpen ? "!text-accent" : ""}`} onClick={() => setDrawerOpen(!drawerOpen)} aria-pressed={drawerOpen}>
          Attending
        </button>
      )}
      {!screens.attendingDrawer && hintsAllowed && !session.finished && (
        <button className="btn btn-ghost h-8" onClick={askHelp} title="Ask the attending (counted in your debrief)">
          Ask the attending
        </button>
      )}
      {session.finished ? (
        !handedOver && (
          <button className="btn btn-accent h-8" onClick={onRepeat}>
            Repeat the case
          </button>
        )
      ) : finishStep && !attending ? (
        <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label="End the case">
          <span className="text-[13px] text-ink-soft">End the case and see the result?</span>
          <button className="btn btn-ghost h-8" onClick={() => openFinishStep(false)}>
            Keep going
          </button>
          <button className="btn btn-accent h-8" onClick={finish}>
            Confirm
          </button>
        </div>
      ) : (
        <button className="btn btn-accent h-8" onClick={() => openFinishStep(!finishStep)} aria-pressed={finishStep} title="The sign-out, then the result">
          Final result
        </button>
      )}
    </>
  );

  const recognitionForm = (variant: "modal" | "drawer") =>
    assess && (
      <RecognitionForm
        key={variant}
        variant={variant}
        showScore={policy.mode === "guided"}
        prompt={assess.prompt}
        onSubmit={(answer) => {
          const r = submitRecognition(session, answer);
          return r ? { recognition: r.recognition } : null;
        }}
        onClose={closeAssess}
      />
    );

  const briefFacts = caseFacts(session, screens.objectives, screens.teachingAids);
  const formTips = policy.mode === "guided" || (policy.mode !== "exam" && labRun.helpAskedAt !== null);
  const prebriefForm = (variant: "modal" | "drawer") =>
    attending && (attending.stage === "brief" || attending.stage === "plan" || attending.stage === "timeout") ? (
      <PciPrebrief attending={attending} variant={variant} teachingAids={screens.teachingAids} facts={briefFacts} problems={launchProblems} tipsVisible={formTips} onClose={() => attending.startCase()} />
    ) : null;
  const signOutForm = (variant: "modal" | "drawer") =>
    attending && attending.stage === "signout" ? <PciSignOut attending={attending} variant={variant} onFinish={finish} onCancel={() => openFinishStep(false)} tipsVisible={formTips} /> : null;

  // the ceiling's figure: with the teaching aids, or when the ceiling in force is the learner's own from the plan
  // (a plan above the rule is not used, and the rule's figure is not shown in its place)
  const showCeiling = screens.teachingAids || session.budgetReadout().contrast.agreed;
  const checkpointForm = (variant: "modal" | "drawer") =>
    checkpoint && !session.finished ? (
      <PciCheckpoint
        key={`${variant}:${checkpoint.id}`}
        checkpoint={checkpoint}
        variant={variant}
        cto={s.target.kind === "cto"}
        showCeiling={showCeiling}
        showVerdict={policy.mode === "guided"}
        onAnswer={answerCheckpoint}
        onClose={closeCheckpoint}
      />
    ) : null;

  let modal: React.ReactNode = null;
  const modals = session.openModals();
  if (attending?.blocking && attending.formOpen()) modal = prebriefForm("modal") ?? signOutForm("modal");
  else if (!attending && modals.includes("prebrief")) modal = <CaseBrief session={session} showViews={screens.objectives} problems={launchProblems} onClose={() => session.closeModal("prebrief")} />;
  else if (checkpoint && cpBlocks && !session.finished) modal = checkpointForm("modal");
  else if (holding) modal = recognitionForm("modal");
  else if (session.finished && session.result && !debriefClosed)
    modal = (
      <div className="panel w-full max-w-3xl space-y-2 p-4 text-[13px]">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-ink">{session.result.verdict}</div>
          <div className={`font-mono text-[12px] ${session.result.passed ? "text-good" : "text-warn"}`}>residual {session.result.residual}%</div>
        </div>
        <ul className="space-y-0.5">
          {session.result.items.map((it, i) => (
            <li key={i} className={it.ok ? "text-good" : "text-danger"}>
              {it.ok ? "✓" : "✗"} {it.text}
            </li>
          ))}
        </ul>
        {/* the choice against the case truth: here only as a teaching aid (the case's own summary gives it at the end) */}
        {handedOver && screens.teachingAids && caseDefOf(session) && <div className="text-ink-soft">{targetCheckText(caseDefOf(session)!)}</div>}
        <ComplicationReview session={session} />
        <CheckpointReview checkpoints={session.budgets.checkpoints} />
        {attending && <ForecastReview attending={attending} />}
        <div className="text-[12px] text-ink-faint">Teaching points</div>
        <ul className="list-disc pl-5 text-ink-soft">
          {s.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        {crew && <TeamReport team={crew.team} />}
        {attending?.assessment && (
          <Debrief
            model={attending.assessment.debrief}
            onFinish={() => {
              // the debrief is done (the run keeps no take-home store; the record has the case)
              session.closeModal("debrief");
              setDebriefClosed(true);
            }}
          />
        )}
        <div className="flex gap-2">
          {!handedOver && (
            <button className="btn btn-accent" onClick={onRepeat}>
              Repeat the case
            </button>
          )}
          <button
            className="btn"
            onClick={() => {
              session.closeModal("debrief");
              setDebriefClosed(true);
            }}
          >
            Close
          </button>
        </div>
      </div>
    );

  const measurePanel =
    measureOpen && !session.finished ? (
      <div className="ml-auto w-full max-w-md shrink-0">
        <PciAssessPanel session={session} onClose={() => setMeasureOpen(false)} />
      </div>
    ) : null;
  const drawer = drawerOpen ? (
    <div className="flex h-full w-full flex-col gap-1.5 overflow-y-auto">
      {measurePanel}
      {!cpBlocks && checkpointForm("drawer")}
      {!holding && recognitionForm("drawer")}
      {attending && !attending.blocking && (prebriefForm("drawer") ?? signOutForm("drawer"))}
      <PciAttendingDrawer
        session={session}
        attending={attending}
        mode={policy.mode}
        teachingAids={screens.coachReadouts}
        coach={coach}
        onCoach={setCoach}
        helpAskedAt={labRun.helpAskedAt}
        onAskHelp={
          hintsAllowed
            ? () => {
                labRun.askHelp(session.wall());
                attending?.askHelp();
              }
            : undefined
        }
        onClose={() => {
          setDrawerOpen(false);
          // the assessment in the drawer goes with it
          if (effects.modalId === "attending" && assess) {
            setAssess(null);
            assessOpenedDrawer.current = false;
          }
        }}
      />
    </div>
  ) : measurePanel ? (
    <div className="flex h-full w-full flex-col gap-1.5 overflow-y-auto">{measurePanel}</div>
  ) : null;

  const qcaHint = pciQcaHint(screens, tipsMod);

  return (
    <LabLayout
      lab="pci"
      header={header}
      live={
        <PciLiveMonitor session={session}>
          {attending && (
            <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-6">
              <div className="pointer-events-auto max-w-[90%]">
                <MentorVoice utterance={attending.last} mode={policy.mode} controls={false} />
              </div>
            </div>
          )}
          {crew && (
            <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center px-6">
              <Captions team={crew.team} variant="overlay" limit={3} hideOperator sedationRole={crew.sedationRole} />
            </div>
          )}
        </PciLiveMonitor>
      }
      reference={
        <ReferenceMonitor
          qca={screens.qca}
          qcaFrench={session.st.guide.french}
          onQcaRecord={session.finished ? undefined : (m) => recordMeasurement(session, m)}
          qcaHint={qcaHint}
        />
      }
      haemo={<HaemoMonitor engine={session.engine} sweepSeconds={6} showControls />}
      dose={<PciDose session={session} showCeiling={showCeiling} />}
      table={<PciTableStrip session={session} recommended={screens.objectives ? s.views : []} showEvent={screens.coachReadouts && coach} />}
      controls={<TableSideControls session={session} input={null} />}
      drawer={drawer}
      palette={crew ? <TeamBar team={crew.team} audio={crew.audioEngine} voices={crew.audio?.voices ?? null} sedationRole={crew.sedationRole} /> : undefined}
      modal={modal}
    />
  );
}

/** The case and the plan: the vignette, the guide and, outside exams, the recommended working views. */
function CaseBrief({ session, showViews, problems, onClose }: { session: PciLabSession; showViews: boolean; problems: string[]; onClose: () => void }) {
  const s = session.s;
  const views = viewsFor(s.side).filter((v) => s.views.includes(v.id));
  return (
    <div className="panel w-full max-w-2xl space-y-3 p-4 text-[13px]" role="dialog" aria-label="Case brief">
      <div className="text-[15px] font-semibold text-ink">{s.title}</div>
      <p className="leading-relaxed text-ink">{s.brief}</p>
      <div className="flex flex-wrap gap-3 font-mono text-[12px] text-ink-soft">
        <span>guide {GUIDE_BY_ID[s.guide]?.label ?? s.guide}</span>
        <span>start: {session.startDef.title}</span>
        {session.dual && <span>dual injection: a second catheter in the other coronary</span>}
      </div>
      {showViews && views.length > 0 && <div className="text-[12px] text-ink-soft">Working views: {views.map((v) => v.name).join(", ")}.</div>}
      {problems.length > 0 && (
        <div className="notice notice-warn text-[12px]" role="status">
          {problems.join(" ")}
        </div>
      )}
      <p className="text-[12px] text-ink-faint">Synthetic patient; images are rendered by a physical X-ray model, not taken from patients. Imaging only while a pedal is held: F fluoroscopy, C cine, Space a cine injection.</p>
      <button className="btn btn-accent" onClick={onClose}>
        Start the case
      </button>
    </div>
  );
}

function PciDose({ session, showCeiling }: { session: PciLabSession; showCeiling: boolean }) {
  usePciSession(session);
  const L = session.lab;
  const im = session.imagingControls();
  const beam = session.beamMode();
  return (
    <div className="flex h-full w-full flex-col">
      <BudgetCounters budget={session.budgetReadout()} showCeiling={showCeiling} />
      <div className="min-h-0 flex-1">
    <DosePanel
      totals={L.dose.totals}
      live={L.dose.live}
      adrc={L.lastExposure}
      skinMap={L.dose.skinMap}
      settings={{ ...DEFAULT_SETTINGS, ...L.exposure, mode: beam === "cine" ? "cine" : "fluoro", fieldMm: im.field * 10 }}
      onSettings={(p) => {
        if (p.fluoroPps !== undefined) session.setFluoroRate(p.fluoroPps);
        if (p.cinePps !== undefined) session.setCineRate(p.cinePps);
        if (p.fluoroLevel) session.setFluoroLevel(p.fluoroLevel);
        if (p.grid !== undefined) {
          L.exposure = { ...L.exposure, grid: p.grid };
          session.notify();
        }
      }}
      operator={L.operator}
      onOperator={(p) => {
        L.operator = { ...L.operator, ...p };
        session.notify();
      }}
      rates={PCI_FLUORO_RATES}
      cineRates={PCI_CINE_RATES}
    />
      </div>
    </div>
  );
}

/** The table: the guide set-up with the wire and the device as they are in the patient, the working views and the keys. */
export function PciTableStrip({ session, recommended, showEvent }: { session: PciLabSession; recommended: readonly string[]; showEvent: boolean }) {
  usePciSession(session);
  const st = session.st;
  const cArm = session.cArmAngles();
  const inj = session.syringes.guide;
  const syringeMl = Math.max(0, 10 - (inj.trace?.volumeMl ?? 0));
  // the latest event line says what the operator would not be told (wire position, geographic miss):
  // a coach read-out, shown only when the learner has switched them on in the guided attending drawer
  const last = showEvent ? lastLiveEvent(st) : undefined;
  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="min-h-0 flex-1">
        <TableView
          height={150}
          readOnly
          state={{
            setup: "guide",
            present: st.device ? ["sheath", "catheter", "wire014", "balloon"] : ["sheath", "catheter", "wire014"],
            // the guide's and the wire's length beyond the valve (TableView's guide length, MODEL PARAMETER of the strip)
            insertedMm: { catheter: 1000, wire014: Math.max(0, 1000 + st.tipMm), ...(st.device ? { balloon: Math.max(0, 1000 + st.device.centreMm) } : {}) },
            hubRollRad: { wire014: st.wire.hub },
            valveOpen: st.valveOpen,
            syringe: { volMl: syringeMl, contrastMl: session.guideFlushed ? 0 : syringeMl, salineMl: session.guideFlushed ? syringeMl : 0, bloodMl: 0, airMl: 0 },
          }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1 px-1 pt-1">
        <span className="mr-1 text-[12px] text-ink-faint">Working views</span>
        {viewsFor(session.s.side).map((v) => (
          <button
            key={v.id}
            onClick={() => session.setView(v.cArm)}
            className={`rounded border px-2 py-0.5 text-[12px] ${cArm.laoRao === v.cArm.laoRao && cArm.cranialCaudal === v.cArm.cranialCaudal ? "border-accent bg-accent/15 text-ink" : "border-line text-ink-soft"} ${recommended.includes(v.id) ? "font-semibold" : ""}`}
            title={v.shows}
          >
            {v.short}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-1 pt-1 text-[12px] text-ink-faint">
        <span>
          <kbd className="kbd">W</kbd> <kbd className="kbd">S</kbd> wire
        </span>
        <span>
          <kbd className="kbd">Q</kbd> <kbd className="kbd">E</kbd> torque
        </span>
        <span>
          <kbd className="kbd">Shift</kbd> <kbd className="kbd">W</kbd> <kbd className="kbd">S</kbd> device
        </span>
        <span>
          <kbd className="kbd">Space</kbd> cine injection
        </span>
        <span>
          <kbd className="kbd">Shift</kbd> <kbd className="kbd">Space</kbd> {session.dual ? "contralateral" : "test puff"}
        </span>
        <span>
          hold <kbd className="kbd">F</kbd> fluoro, <kbd className="kbd">C</kbd> cine
        </span>
        <span>
          <kbd className="kbd">N</kbd> store fluoro
        </span>
      </div>
      {last && (
        <div className={`pointer-events-none absolute right-2 top-1 max-w-[60%] truncate rounded bg-base-900/80 px-2 py-0.5 text-[12px] ${last.tone === "danger" ? "text-danger" : last.tone === "warn" ? "text-warn" : last.tone === "good" ? "text-good" : "text-ink-soft"}`} role="status" title={last.text}>
          {last.text}
        </div>
      )}
    </div>
  );
}

/**
 * The attending drawer: the technique tips for the moment (guided practice, or after asking for help),
 * and the teaching aids (where the wire tip and the device are relative to the lesion, and the procedure
 * log) when labScreens allows them: guided practice with the overlays toggleable.
 */
function PciAttendingDrawer({
  session,
  attending,
  mode,
  teachingAids,
  coach,
  onCoach,
  helpAskedAt,
  onAskHelp,
  onClose,
}: {
  session: PciLabSession;
  attending: PciAttending | null;
  mode: LabRunApi["mode"];
  teachingAids: boolean;
  /** the coach read-outs switched on (state held by the screen: it also governs the table strip's event line) */
  coach: boolean;
  onCoach: (on: boolean) => void;
  helpAskedAt: number | null;
  onAskHelp?: () => void;
  onClose: () => void;
}) {
  usePciSession(session);
  const mod = useTipsModule();
  const ctx = labTipContext(session);
  const policy = useMemo(() => ({ mode, helpAskedAt }), [mode, helpAskedAt]);
  const tips = selectTips(mod, ctx, policy, DEFAULT_TIP_LIMIT);
  const visible = mode === "guided" || (mode !== "exam" && helpAskedAt !== null);
  const st = session.st;
  const g = session.g;
  const tipAt = st.tipMm > 0 ? sampleAtMm(g, st.route, st.tipMm) : null;
  const dev = st.device;
  const devOffset = dev ? dev.centreMm - g.lesion.centreMm : 0;
  return (
    <AttendingDrawer
      open
      mode={mode}
      utterances={attending ? attending.utterances : []}
      onClose={onClose}
      onAskHelp={onAskHelp}
      technique={
        <>
          <TechniqueTips tips={tips} visible={visible} exam={mode === "exam"} onAskHelp={onAskHelp} />
          {teachingAids && (
            <label className="flex items-center gap-2 border-b border-line px-4 py-2 text-[12.5px] text-ink-soft">
              <input type="checkbox" checked={coach} onChange={(e) => onCoach(e.target.checked)} aria-label="Coach read-outs" />
              Coach read-outs: where the wire and the device are, and the procedure log (teaching aid)
            </label>
          )}
          {teachingAids && coach && (
            <section className="space-y-1 border-b border-line px-4 py-3 text-[12.5px] text-ink-soft" aria-label="Teaching aid">
              <div className="text-[13px] font-semibold text-ink">Where things are (teaching aid)</div>
              <div>
                {st.tipMm <= 0
                  ? "Wire tip inside the guide."
                  : `Wire tip in the ${branchLabel(tipAt?.v.name ?? st.route[st.route.length - 1])}, ${Math.round(st.tipMm)} mm from the ostium${
                      st.route.includes(g.lesion.vessel) ? (st.tipMm > g.lesion.endMm ? ", across the lesion" : st.tipMm > g.lesion.startMm ? ", in the lesion" : ", proximal to the lesion") : ""
                    }.`}
              </div>
              {dev && dev.centreMm > 0 && st.route.includes(g.lesion.vessel) && (
                <div>Device centre {devOffset > 0 ? `${devOffset.toFixed(0)} mm distal to` : devOffset < 0 ? `${(-devOffset).toFixed(0)} mm proximal to` : "at"} the lesion centre.</div>
              )}
              <div className="max-h-40 space-y-0.5 overflow-y-auto pt-1">
                {liveLog(st)
                  .reverse()
                  .map((e, i) => (
                    <div key={i} className={e.tone === "danger" ? "text-danger" : e.tone === "warn" ? "text-warn" : e.tone === "good" ? "text-good" : "text-ink-soft"}>
                      <span className="mr-1 font-mono text-ink-faint">{e.t.toFixed(0)}s</span>
                      {e.text}
                    </div>
                  ))}
              </div>
            </section>
          )}
        </>
      }
    />
  );
}

/**
 * The debrief's complications: each one named and graded, what caused it, and the learner's assessment
 * (when, and whether the cause and grade were right). Shown once the case is over.
 */
function ComplicationReview({ session }: { session: PciLabSession }) {
  const rows = cxDebrief(session.st.cx);
  if (!rows.length) return null;
  return (
    <div className="space-y-0.5">
      <div className="text-[12px] text-ink-faint">Complications and your assessment</div>
      <ul className="space-y-0.5">
        {rows.map((r) => (
          <li key={r.id} className={assessmentClass(r.recognised)}>
            {r.label}: {r.cause}. {assessmentSummary(r.recognised)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The guide, the start and (outside exams, when the policy lists them) the working views, for the case brief; after a
 * hand-over from the full case, the diagnostic catheter in the root and, as a teaching aid, the heparin still to give.
 */
function caseFacts(session: PciLabSession, showViews: boolean, teachingAids = false): string[] {
  const s = session.s;
  const out = [`guide ${GUIDE_BY_ID[s.guide]?.label ?? s.guide}`, `start: ${session.startDef.title}`];
  // a hand-over: the diagnostic catheter left in the root, and (a teaching aid: guided practice) the heparin still to give
  const def = caseDefOf(session);
  if (def?.catheterInRoot) out.push(`diagnostic catheter (${catheterName(def.catheterInRoot)}) in the ascending aorta: exchange it for the guide`);
  const ready = session.handover?.h.pciReady;
  if (teachingAids && ready && ready.heparinTopUpU > 0) out.push(`heparin still to give: ${ready.heparinTopUpU} U, ACT target ${ready.actTargetS[0]}-${ready.actTargetS[1]} s`);
  if (session.dual) out.push("dual injection: a second catheter in the other coronary");
  const views = viewsFor(s.side).filter((v) => s.views.includes(v.id));
  if (showViews && views.length) out.push(`working views: ${views.map((v) => v.name).join(", ")}`);
  return out;
}

/** The debrief's forecast: what the plan named beside what the complications engine produced (cm-principles-closure#0). */
function ForecastReview({ attending }: { attending: PciAttending }) {
  if (!attending.planSubmitted) return null;
  const produced = [...new Set(attending.complications().map((c) => c.kind))];
  const items = attending.planItems;
  return (
    <div className="space-y-0.5">
      <div className="text-[12px] text-ink-faint">Your plan and what happened</div>
      <div className="text-ink-soft">
        Forecast: {attending.plan.forecast.map((f) => FORECAST_LABELS[f.complication]).join(", ") || "none"}. Produced: {produced.length ? produced.join(", ") : "no complication"}.
      </div>
      <ul className="space-y-0.5">
        {items.map((it) => (
          <li key={it.id} className={it.kept === null ? "text-ink-soft" : it.kept ? "text-good" : "text-warn"}>
            {it.label}: planned {it.planned}; {it.actual}.
          </li>
        ))}
      </ul>
    </div>
  );
}
