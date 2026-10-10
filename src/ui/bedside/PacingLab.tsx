import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PACING_SCENARIOS,
  getPacingScenario,
  pacingVariant,
  ACCESS_INFO,
  accessInfoFor,
  INITIAL_ACTION_LABEL,
  IN_LAB_MODEL,
  initialActionsFor,
  initialInLabState,
  applyInitialAction,
  inLabTick,
  actionAt,
  withInLabConduction,
  effectiveScenario,
  rhythmSupported,
  patientResponsive,
  asynchronousWithIntrinsic,
  inLabCriteria,
  inLabPassed,
  requiredMargin,
  OXFORD_OUTPUT_MARGIN,
  outputIn,
  outputFrom,
  outputLimits,
  stepOutputIn,
  formatOutput,
  rotateThroughSheath,
  DIRECTION_LABEL,
  ZONE_LABEL,
  FAULT_INFO,
  DIAGNOSIS_LABEL,
  BOX_LIMITS,
  TCP_LIMITS,
  DEFAULT_BOX,
  DEFAULT_TCP,
  NO_FAULTS,
  initialLead,
  moveLead,
  rotateLead,
  leadInfo,
  consistentThreshold,
  sensedSignals,
  assessSensing,
  recommendedOutput,
  recommendedSensitivity,
  stepOutput,
  stepSensitivity,
  stepRate,
  createRhythm,
  advanceRhythm,
  nowOf,
  ecgRange,
  arterialAt,
  tipEgmAt,
  pacingNumerics,
  intrinsicRate,
  sensingTestable,
  applyFault,
  faultStatus,
  scorePacing,
  ZONE_LEN,
  OUTPUT_MARGIN,
  ACCEPTABLE_THRESHOLD,
  type PacingScenarioId,
  type AccessRoute,
  type LeadState,
  type BoxSettings,
  type TcpSettings,
  type Faults,
  type PacingContext,
  type PacingNumerics,
  type RhythmState,
  type Diagnosis,
  type PacingEventOutcome,
  type ScoreResult,
  type PaceMode,
  type PacingScenario,
  type InitialAction,
  type InLabState,
  type InLabCriterion,
  type PacingRunLog,
  type BoxUnits,
  type SheathFit,
} from "../../simulation/pacing";
import type { LabEvent } from "../../content/lab/tips";
import { LAUNCH_MODES, type LaunchMode, type LaunchParams } from "../../content/schema";
import { PASS_SCORE } from "../../progress/logbook";
import { registerLabHook } from "../../dev/labHooks";
import { useLabLaunch } from "../../state/useLabLaunchStore";
import { runCaseId, useLabRun } from "../lab/labRun";
import { loadedTips, tipsVisible, useTipsModule } from "../lab/useLabTips";
import LabTipsPanel from "../lab/LabTipsPanel";
import LabModeBar from "../lab/LabModeBar";
import { INITIAL_PATIENT_EVENT_STATE, patientEvents, type PatientEventState } from "../lab/patientEvents";
import { pacingTipContext, pacingTips, pacingVitals, type PacingStage } from "../lab/bedsideTips";
import SweepMonitor, { type MonitorSource } from "./SweepMonitor";
import Knob from "./Knob";
import { FluoroImage } from "./PacingFluoro";
import { Debrief, LogPanel, Panel, Readout, Seg, StepTracker, type LogEntry, type Tone } from "./common";

// ===========================================================================
// Temporary pacing lab: assess and bridge with transcutaneous pacing, choose
// venous access, position a transvenous lead under fluoroscopy, connect the
// box, measure threshold and sensing, set safe margins, hand over, then
// troubleshoot scripted problems on the live monitor.
//
// pacing-in-lab-scenarios-and-tips:
//   • Three in-lab bradycardia scenarios open with the initial management
//     (wait, atropine, a cough, stopping an infusion, external pacing, a
//     femoral wire) before the insertion and box stages, with pass criteria
//     (rhythm supported in time, no coronary sinus position, output at least
//     three times the measured threshold, demand mode, no asynchronous pacing
//     over an intrinsic rhythm).
//   • Links (useLabLaunch "pacing": scenario, variant, mode) open a scenario;
//     a held-out variant always runs as an exam.
//   • The run follows useLabRun: the lab tips of src/ui/lab/bedsideTips.ts by
//     stage under its policy (none in exams), and one logbook row at the end.
//     Outside guided practice the screens show what an operator would see:
//     no tip location, rhythm label, checklist ticks or verdicts in the log.
//   • The box reads volts or milliamps (Oxford's box reads volts); the engine
//     works in mA and converts through LEAD_IMPEDANCE_OHM.
//   • A sheath the same size as the wire binds it (rotation is damped).
//   • In DEV builds window.__lab.pacing exposes the context, tips and state,
//     and step(s) advances the rhythm (the pane pauses frames when hidden).
// ===========================================================================

type Stage = PacingStage;
const STAGES: Stage[] = ["assess", "access", "position", "test", "events", "debrief"];
const STAGE_LABEL: Record<Stage, string> = {
  assess: "Assess and bridge",
  access: "Venous access",
  position: "Position the lead",
  test: "Threshold and sensing",
  events: "Troubleshooting",
  debrief: "Debrief",
};

const DIAGNOSES: Diagnosis[] = ["loss-of-capture", "undersensing", "oversensing", "failure-to-output", "normal"];

/** The tips that teach an initial action (linked from the debrief's decision ledger). */
const INITIAL_TIPS: Partial<Record<InitialAction, string[]>> = {
  "external-pacing": ["bed-pace-external-bridge"],
  "femoral-wire": ["bed-pace-sheath-up-femoral"],
};

/** The tips that teach each in-lab pass criterion (linked from the debrief's decision ledger). */
const CRITERION_TIPS: Record<InLabCriterion["id"], string[]> = {
  "supported-in-time": ["bed-pace-external-bridge"],
  "no-cs-accepted": ["bed-pace-coronary-sinus"],
  "output-margin": ["bed-pace-threshold-margin"],
  "demand-mode": ["bed-pace-demand-sensitivity"],
  "no-async-with-intrinsic": ["bed-pace-demand-sensitivity"],
};

/**
 * Outside guided practice, a lead message as the operator perceives it: resistance, a loop seen on
 * screening, ectopics as the wire crosses, the patient's symptoms. Messages that name where the tip
 * is are dropped (the fluoroscopy, the lateral view and the tip electrogram show it).
 */
export function perceivedLeadMessage(msg: string): { text: string; tone: Tone } | null {
  if (/^Perforation/.test(msg)) return { text: "The patient complains of sharp chest pain.", tone: "warn" };
  if (/buckles/.test(msg)) return { text: "The wire buckles against the atrial wall and forms a loop.", tone: "plain" };
  if (/Firm resistance/.test(msg)) return { text: "Firm resistance at the tip.", tone: "plain" };
  if (/crossed the tricuspid valve/.test(msg)) return { text: "A few ventricular ectopics as the wire advances.", tone: "plain" };
  if (/fully withdrawn/.test(msg)) return { text: "The wire is back at the sheath.", tone: "plain" };
  return null;
}

interface Handover {
  lead: LeadState;
  box: BoxSettings;
  threshold: number | null;
  r: number;
  t: number;
}

const emptyNumerics: PacingNumerics = {
  hr: 0, sys: 0, dia: 0, map: 0, pacedPct: 0, label: "", warning: "none", lossOfCapture: false, onT: false,
  inhibitedPause: false, longestPause: 0, phrenic: false, tcpArtefactOnly: false, tcpCapture: false,
};

/** A link into this tab: the scenario, its variant and the mode (seq tells a new link from one already applied). */
export interface PacingLaunch {
  scenario: PacingScenarioId | null;
  variant: string | null;
  mode: LaunchMode | null;
  seq: number;
}

/** The scenario a launch's id names, or null. */
export function pacingScenarioFor(id: string | undefined | null): PacingScenarioId | null {
  return PACING_SCENARIOS.some((s) => s.id === id) ? (id as PacingScenarioId) : null;
}

/** A pacing link's scenario, variant and mode. A held-out variant always runs as an exam. */
export function resolvePacingLaunch(p: LaunchParams, seq: number): PacingLaunch {
  const scenario = pacingScenarioFor(p.scenario ?? p.preset);
  const v = scenario ? pacingVariant(scenario, p.variant) : null;
  const asked = (LAUNCH_MODES as readonly string[]).includes(p.mode ?? "") ? (p.mode as LaunchMode) : null;
  return { scenario, variant: v?.id ?? null, mode: v?.heldOut ? "exam" : asked, seq };
}

interface Selection {
  id: PacingScenarioId;
  variant: string | null;
  mode: LaunchMode | null;
}

/**
 * The pacing tab. `initial` opens it on a scenario, variant and mode (a link resolved elsewhere, or a
 * test); links that arrive while it is mounted come through useLabLaunch.
 */
export default function PacingLab({ initial = null }: { initial?: PacingLaunch | null }) {
  const [sel, setSel] = useState<Selection>(() =>
    initial?.scenario ? { id: initial.scenario, variant: initial.variant, mode: pacingVariant(initial.scenario, initial.variant)?.heldOut ? "exam" : initial.mode } : { id: "inferior-chb", variant: null, mode: null }
  );
  const [runKey, setRunKey] = useState(0);
  const seq = useRef(0);
  // a lesson's or case's link (and, later, a held-out exam) opens its scenario as a new run
  useLabLaunch("pacing", (p) => {
    const l = resolvePacingLaunch(p, ++seq.current);
    setSel((s) => (l.scenario ? { id: l.scenario, variant: l.variant, mode: l.mode } : { ...s, mode: l.mode }));
    setRunKey((k) => k + 1);
  });
  return (
    <PacingRun
      key={`${sel.id}-${sel.variant ?? ""}-${runKey}`}
      scenarioId={sel.id}
      variant={sel.variant}
      launchMode={sel.mode}
      runKey={runKey}
      onScenario={(id) => setSel({ id, variant: null, mode: null })}
      onRestart={() => setRunKey((k) => k + 1)}
    />
  );
}

function PacingRun({
  scenarioId,
  variant,
  launchMode,
  runKey,
  onScenario,
  onRestart,
}: {
  scenarioId: PacingScenarioId;
  variant: string | null;
  launchMode: LaunchMode | null;
  runKey: number;
  onScenario: (id: PacingScenarioId) => void;
  onRestart: () => void;
}) {
  const sc = useMemo(() => getPacingScenario(scenarioId, variant), [scenarioId, variant]);
  const fixedRoute = sc.fixedRoute ?? null;
  const run = useLabRun("pacing", runCaseId("pacing", sc.id, variant), launchMode, { runKey, caseName: `Temporary pacing: ${sc.title}` });
  const runRef = useRef(run);
  runRef.current = run;
  const guided = run.mode === "guided";
  const exam = run.mode === "exam";
  const margin = requiredMargin(sc);

  const [stage, setStage] = useState<Stage>("assess");
  const [lead, setLeadState] = useState<LeadState>(() => initialLead(fixedRoute ?? "rij"));
  const [box, setBoxState] = useState<BoxSettings>({ ...DEFAULT_BOX });
  const [tcp, setTcpState] = useState<TcpSettings>({ ...DEFAULT_TCP });
  const [faults, setFaultsState] = useState<Faults>({ ...NO_FAULTS });
  const [route, setRoute] = useState<AccessRoute | null>(fixedRoute);
  const [firstRoute, setFirstRoute] = useState<AccessRoute | null>(fixedRoute);
  const [pads, setPads] = useState(false);
  const [analgesia, setAnalgesia] = useState(false);
  const [fluoroOn, setFluoroOn] = useState(false);
  const [fluoroTime, setFluoroTime] = useState(0);
  const [lihLead, setLihLead] = useState<LeadState | null>(null);
  const [latSnap, setLatSnap] = useState<LeadState | null>(null);
  const [lateralChecked, setLateralChecked] = useState(false);
  const [showTipLabel, setShowTipLabel] = useState(true);
  const [thresholdMeasured, setThresholdMeasured] = useState<number | null>(null);
  const [sensingMeasured, setSensingMeasured] = useState<number | null>(null);
  const [sensingSkipped, setSensingSkipped] = useState(false);
  const skipJustifiedRef = useRef(false);
  const [tcpUsed, setTcpUsed] = useState(false);
  const [tcpChecked, setTcpChecked] = useState(false);
  const [pulseNote, setPulseNote] = useState<string | null>(null);
  const [handover, setHandover] = useState<Handover | null>(null);
  const [eventIdx, setEventIdx] = useState(0);
  const [eventDx, setEventDx] = useState<Diagnosis | null>(null);
  const [eventNote, setEventNote] = useState<{ text: string; tone: Tone } | null>(null);
  const [outcomes, setOutcomes] = useState<PacingEventOutcome[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [numerics, setNumerics] = useState<PacingNumerics>(emptyNumerics);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [onTCount, setOnTCount] = useState(0);
  // pacing-in-lab-scenarios-and-tips: box units, sheath, the in-lab course, tip events
  const [units, setUnits] = useState<BoxUnits>(sc.boxUnits ?? "mA");
  const [sheath, setSheath] = useState<SheathFit | null>(null);
  const [inLab, setInLabState] = useState<InLabState | null>(() => (sc.inLab ? initialInLabState(10) : null));
  const [supportedAt, setSupportedAt] = useState<number | null>(null);
  const [waitUntil, setWaitUntil] = useState<number | null>(null);
  const [simNow, setSimNow] = useState(10);
  const [patientEv, setPatientEv] = useState<LabEvent[]>([]);
  const [criteria, setCriteria] = useState<InLabCriterion[] | null>(null);
  // in-lab standstill: the patient stops responding (and cannot cough) after IN_LAB_MODEL.unresponsiveAfterS without a beat
  const [responsive, setResponsive] = useState(true);
  const responsiveRef = useRef(true);

  // Refs mirror state for the real-time loop and synchronous handlers.
  const leadRef = useRef(lead);
  const boxRef = useRef(box);
  const tcpRef = useRef(tcp);
  const faultsRef = useRef(faults);
  const inLabRef = useRef(inLab);
  const supportedRef = useRef<number | null>(null);
  const asyncRef = useRef(false);
  const waitRef = useRef<number | null>(null);
  const evState = useRef<PatientEventState>(INITIAL_PATIENT_EVENT_STATE);
  const rhythmRef = useRef<RhythmState>(createRhythm(sc, 10));
  // the scenario as the rhythm engine runs it now (atropine speeds the atrial rate once it acts)
  const scNow = effectiveScenario(sc, inLab, simNow);
  const ctxRef = useRef<PacingContext>({ scenario: scNow, lead, box, tcp, faults });
  ctxRef.current = { scenario: scNow, lead, box, tcp, faults };

  const setLead = (l: LeadState) => {
    leadRef.current = l;
    setLeadState(l);
  };
  const setBox = (b: BoxSettings) => {
    boxRef.current = b;
    setBoxState(b);
  };
  const setTcp = (t: TcpSettings) => {
    tcpRef.current = t;
    setTcpState(t);
  };
  const setFaults = (f: Faults) => {
    faultsRef.current = f;
    setFaultsState(f);
  };
  const setInLab = (st: InLabState) => {
    inLabRef.current = st;
    setInLabState(st);
    // conduction back (a cough, atropine, or by itself): the rhythm engine conducts again
    const f = withInLabConduction(faultsRef.current, st);
    if (f !== faultsRef.current) setFaults(f);
  };

  const addLog = useCallback((text: string, tone: Tone = "plain") => {
    setLog((l) => [...l, { t: Date.now(), text, tone }].slice(-80));
  }, []);

  // --- monitor sources -------------------------------------------------------
  const sourceRef = useRef<MonitorSource | null>(null);
  const egmRef = useRef<MonitorSource | null>(null);
  if (!sourceRef.current) {
    sourceRef.current = {
      advance: (dt) => {
        advanceRhythm(rhythmRef.current, ctxRef.current, dt);
        return nowOf(rhythmRef.current);
      },
      sample: (t0, t1) => {
        const r = rhythmRef.current;
        return [ecgRange(r, t0, t1, "II"), ecgRange(r, t0, t1, "V1"), arterialAt(r, ctxRef.current.scenario, t1)];
      },
    };
  }
  if (!egmRef.current) {
    egmRef.current = {
      advance: () => nowOf(rhythmRef.current),
      sample: (_t0, t1) => [tipEgmAt(rhythmRef.current, ctxRef.current.lead, t1)],
    };
  }

  // PACE / SENSE LEDs, updated straight from the frame loop.
  const paceLed = useRef<HTMLSpanElement>(null);
  const senseLed = useRef<HTMLSpanElement>(null);
  const onFrame = useCallback((t: number) => {
    const ev = rhythmRef.current.events;
    let pace = false;
    let sense = false;
    for (let i = ev.length - 1; i >= 0; i--) {
      const e = ev[i];
      if (t - e.t > 0.12) break;
      if (e.kind === "spike" && e.source === "box") pace = true;
      if (e.kind === "sense") sense = true;
    }
    if (paceLed.current) paceLed.current.style.opacity = pace ? "1" : "0.15";
    if (senseLed.current) senseLed.current.style.opacity = sense ? "1" : "0.15";
  }, []);

  // --- numerics, fluoro time, TCP use, R-on-T count ---------------------------
  const lastScan = useRef(0);
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const fluoroRef = useRef(fluoroOn);
  fluoroRef.current = fluoroOn;
  const scanRef = useRef<() => void>(() => undefined);
  scanRef.current = () => {
    const r = rhythmRef.current;
    const c = ctxRef.current;
    const n = pacingNumerics(r, c);
    setNumerics(n);
    if (fluoroRef.current) setFluoroTime((x) => x + 0.25);
    if (c.tcp.on && n.tcpCapture) setTcpUsed(true);
    const t = nowOf(r);
    setSimNow(t);
    if (stageRef.current === "events" || (sc.inLab && stageRef.current !== "debrief")) {
      const k = r.events.filter((e) => e.kind === "spike" && e.onT && e.t > lastScan.current && e.t <= t).length;
      if (k) setOnTCount((x) => x + k);
    }
    lastScan.current = t;

    // the in-lab course: conduction returning, the rhythm supported, asynchronous pacing, the Wait choice
    const st = inLabRef.current;
    if (sc.inLab && st && stageRef.current !== "debrief") {
      const next = inLabTick(sc, st, t);
      if (next !== st) {
        setInLab(next);
        addLog("Conducted beats return on the monitor.", "info");
      }
      const resp = patientResponsive(r, st, t);
      if (resp !== responsiveRef.current) {
        responsiveRef.current = resp;
        setResponsive(resp);
        if (resp) addLog("The patient is responding again.", "info");
        else {
          addLog("The patient no longer responds.", "danger");
          if (runRef.current.mode === "guided" && sc.inLab.cause === "adenosine" && sc.inLab.advice.cough) addLog(sc.inLab.advice.cough, "info");
        }
      }
      if (supportedRef.current === null && rhythmSupported(n, c)) {
        supportedRef.current = t;
        setSupportedAt(t);
      }
      if (!asyncRef.current && asynchronousWithIntrinsic(c.scenario, c.faults, c.box)) {
        asyncRef.current = true;
      }
      if (waitRef.current !== null && t >= waitRef.current) {
        waitRef.current = null;
        setWaitUntil(null);
        addLog(`${IN_LAB_MODEL.waitS} seconds have passed.`, "plain");
        if (runRef.current.mode === "guided" && sc.inLab.advice.wait) addLog(sc.inLab.advice.wait, "info");
      }
    }

    // the tip context's patient events, read from the monitor by the shared adapter
    const view = {
      hr: n.hr,
      sys: n.sys,
      dia: n.dia,
      map: n.map,
      pacedPct: n.pacedPct,
      atrial: c.scenario.atrialRate !== null,
      avBlock: c.scenario.atrialRate !== null && !c.scenario.avConduction && !c.faults.conductionReturned,
    };
    const res = patientEvents(pacingVitals(t, view), evState.current);
    evState.current = res.state;
    setPatientEv((prev) => (prev.length === res.events.length && prev.every((e, i) => e === res.events[i]) ? prev : res.events));
  };
  useEffect(() => {
    const id = window.setInterval(() => scanRef.current(), 250);
    return () => window.clearInterval(id);
  }, []);

  // keep the last-image-hold in step with screening
  useEffect(() => {
    if (fluoroOn) setLihLead(lead);
  }, [fluoroOn, lead]);

  const info = leadInfo(lead);
  const thrNow = consistentThreshold(lead, sc, faults);
  const sig = sensedSignals(lead, sc, faults);
  const intrinsic = intrinsicRate(sc, faults);

  // --- lead handlers -------------------------------------------------------------
  const blindWarned = useRef(false);
  // lead moves made without screening: coached live only in guided practice, reported in the debrief otherwise
  const blindMoves = useRef(0);
  const move = (cm: number) => {
    if (stage !== "position" && stage !== "test" && stage !== "events") return;
    if (!route || route === "epicardial") return;
    const before = leadRef.current;
    const m = moveLead(before, cm);
    const next = m.lead;
    if (next.zone !== before.zone && (faultsRef.current.rMult !== 1 || faultsRef.current.thresholdMult !== 1)) {
      // the tip has moved onto fresh myocardium
      setFaults({ ...faultsRef.current, rMult: 1, thresholdMult: 1 });
    }
    setLead(next);
    for (const msg of m.messages) {
      if (runRef.current.mode === "guided") addLog(msg, /perforat/i.test(msg) ? "danger" : /coronary sinus|outflow|pulmonary|hepatic|IVC/i.test(msg) ? "warn" : "plain");
      else {
        // outside guided practice only what the operator feels and sees is reported, not where the tip is
        const felt = perceivedLeadMessage(msg);
        if (felt) addLog(felt.text, felt.tone);
      }
    }
    if (!fluoroRef.current) {
      blindMoves.current += 1;
      if (runRef.current.mode === "guided" && !blindWarned.current) {
        blindWarned.current = true;
        addLog("Moving the lead without screening. Use fluoroscopy whenever the lead moves inside the heart.", "warn");
      }
    }
  };
  const bindWarned = useRef(false);
  const rotate = (deg: number) => {
    if (!route || route === "epicardial") return;
    setLead(rotateThroughSheath(leadRef.current, deg, sheath));
    if (sheath === "same" && !bindWarned.current) {
      bindWarned.current = true;
      addLog("The wire binds in the sheath: it turns stiffly and the tip lags behind your hand.", "warn");
    }
  };
  const dragAcc = useRef({ x: 0, y: 0 });
  const onFluoroDrag = (dx: number, dy: number) => {
    dragAcc.current.y += dy;
    dragAcc.current.x += dx;
    while (dragAcc.current.y > 10) {
      dragAcc.current.y -= 10;
      move(0.5);
    }
    while (dragAcc.current.y < -10) {
      dragAcc.current.y += 10;
      move(-0.5);
    }
    while (dragAcc.current.x > 14) {
      dragAcc.current.x -= 14;
      rotate(15);
    }
    while (dragAcc.current.x < -14) {
      dragAcc.current.x += 14;
      rotate(-15);
    }
  };

  const takeLateral = () => {
    setLatSnap(leadRef.current);
    setFluoroTime((x) => x + 1);
    const i = leadInfo(leadRef.current);
    if (i.inRV || i.zone === "cs" || i.zone === "rv-apex" || i.zone === "rv-septum") setLateralChecked(true);
    if (runRef.current.mode !== "guided") return addLog("Lateral view acquired.", "info");
    addLog(
      i.lateralCourse === "posterior"
        ? "Lateral view: the lead runs POSTERIORLY toward the spine. This is the coronary sinus, not the RV."
        : i.lateralCourse === "anterior"
        ? "Lateral view: the tip points ANTERIORLY toward the sternum, as an RV lead should."
        : "Lateral view acquired.",
      i.lateralCourse === "posterior" ? "warn" : "info"
    );
  };

  // --- box handlers -----------------------------------------------------------------
  /** v in mA (the engine's unit); the dial converts from the box's units */
  const changeOutput = (v: number) => {
    const prev = boxRef.current.output;
    const b = { ...boxRef.current, output: v };
    setBox(b);
    const thr = consistentThreshold(leadRef.current, ctxRef.current.scenario, faultsRef.current);
    if (b.connected && b.mode !== "OFF" && thr !== null && v < prev && prev >= thr && v < thr) {
      if (b.rate > intrinsicRate(ctxRef.current.scenario, faultsRef.current) + 5) {
        setThresholdMeasured(prev);
        const p = formatOutput(prev, units);
        if (runRef.current.mode === "guided")
          addLog(
            `Capture lost below ${p}: the threshold is ${p}.${prev < ACCEPTABLE_THRESHOLD ? ` Acceptable (below ${formatOutput(ACCEPTABLE_THRESHOLD, units)}).` : " Higher than acceptable; consider repositioning."}`,
            prev < ACCEPTABLE_THRESHOLD ? "good" : "warn"
          );
        else addLog(`Capture lost below ${p}.`, "plain");
      } else if (runRef.current.mode === "guided") {
        addLog("Capture cannot be judged while the intrinsic rhythm is faster than the pacing rate. Increase the rate first.", "warn");
      }
    }
  };
  const changeSens = (v: number) => {
    const prev = boxRef.current.sensitivity;
    const b = { ...boxRef.current, sensitivity: v };
    setBox(b);
    const s = sensedSignals(leadRef.current, sc, faultsRef.current);
    if (b.connected && b.mode === "VVI" && v > prev && prev <= s.r && v > s.r) {
      if (intrinsicRate(ctxRef.current.scenario, faultsRef.current) > b.rate + 3) {
        setSensingMeasured(prev);
        if (runRef.current.mode === "guided") addLog(`The SENSE light stops at ${v} mV: the R wave is about ${prev} mV. Set the sensitivity to about half of that.`, "good");
        else addLog(`The SENSE light stops at ${v} mV.`, "plain");
      } else if (runRef.current.mode === "guided") {
        addLog("Sensing cannot be judged: the box is pacing every beat, so there are no intrinsic beats to sense.", "warn");
      }
    }
  };
  const changeRate = (v: number) => setBox({ ...boxRef.current, rate: v });
  const changeMode = (m: PaceMode) => {
    setBox({ ...boxRef.current, mode: m });
    if (runRef.current.mode !== "guided") return addLog(m === "VOO" ? "Mode: VOO (asynchronous)." : m === "OFF" ? "Pacing output off." : "Mode: VVI (demand).", "plain");
    addLog(m === "VOO" ? "Asynchronous mode: the box ignores all sensed signals. Risk of spikes on T waves if there is an intrinsic rhythm." : m === "OFF" ? "Pacing output off." : "VVI: inhibited by sensed ventricular events.", m === "VVI" ? "plain" : "warn");
  };
  const connectBox = () => {
    if (boxRef.current.connected) return;
    setBox({ ...boxRef.current, connected: true });
    addLog(`Box connected.${guided && !(info.inRV || info.zone === "epicardial") ? ` The tip is in the ${ZONE_LABEL[info.zone].toLowerCase()}.` : ""}`, "info");
    if (stage === "position" || stage === "assess") setStage("test");
  };
  const reseat = () => {
    if (faultsRef.current.noise) {
      setFaults({ ...faultsRef.current, noise: false });
      addLog("A loose connection at the bridging cable is found and reseated.", "good");
    } else addLog("All connections checked: secure.", "plain");
  };

  // --- TCP -----------------------------------------------------------------------------
  const analgesiaWarned = useRef(false);
  const changeTcp = (t: TcpSettings) => {
    setTcp(t);
    if (t.on) recordAction("external-pacing");
    if (t.on && t.current >= 40 && !analgesia && !analgesiaWarned.current) {
      analgesiaWarned.current = true;
      addLog("The patient is in distress from the chest wall contractions. Transcutaneous pacing is painful: give analgesia and sedation.", "warn");
    }
  };
  const checkPulse = () => {
    const n = pacingNumerics(rhythmRef.current, ctxRef.current);
    let text: string;
    if (tcpRef.current.on && n.tcpCapture) {
      text = guided
        ? `Femoral pulse palpable at about ${n.hr}/min, matching the pacing rate, and the arterial line shows a pulse after each paced complex: mechanical capture.`
        : `Femoral pulse palpable at about ${n.hr}/min; the pacing rate is ${tcpRef.current.rate}/min.`;
      setTcpChecked(true);
    } else if (tcpRef.current.on && n.tcpArtefactOnly) {
      text = guided ? "No pulse corresponds to the pacing spikes: the broad deflections are artefact. There is no capture. Increase the current." : "No pulse corresponds to the pacing spikes.";
      setTcpChecked(true);
    } else {
      text = `Femoral pulse about ${n.hr}/min${tcpRef.current.on ? "" : " (transcutaneous pacing is off)"}. Arterial line ${n.sys}/${n.dia} mmHg.`;
    }
    setPulseNote(text);
    addLog(text, guided && n.tcpCapture ? "good" : "plain");
  };

  // --- stage transitions ----------------------------------------------------------------
  const chooseRoute = (r: AccessRoute) => {
    if (!firstRoute) setFirstRoute(r);
    setRoute(r);
    setLead(initialLead(r));
    setLihLead(null);
    setLatSnap(null);
    const ai = accessInfoFor(sc, r);
    if (r === "femoral") recordAction("femoral-wire");
    if (runRef.current.mode === "guided") addLog(`${ai.label}: ${ai.why}`, ai.verdict === "discouraged" ? "danger" : ai.verdict === "acceptable" ? "warn" : "good");
    else addLog(`${ai.label} chosen.`, "plain");
  };

  // --- in-lab initial management ------------------------------------------------------
  const recordAction = (a: InitialAction) => {
    const st = inLabRef.current;
    if (!sc.inLab || !st || actionAt(st, a) !== null) return;
    const t = nowOf(rhythmRef.current);
    setInLab(applyInitialAction(sc, st, a, t));
  };
  const initialAction = (a: InitialAction) => {
    const st = inLabRef.current;
    if (!sc.inLab || !st) return;
    if (a === "wait") {
      if (waitRef.current !== null) return;
      const t = nowOf(rhythmRef.current);
      waitRef.current = t + IN_LAB_MODEL.waitS;
      setWaitUntil(waitRef.current);
      recordAction("wait");
      addLog(`Watching the monitor for ${IN_LAB_MODEL.waitS} seconds.`, "plain");
      return;
    }
    if (a === "cough" && !responsiveRef.current) {
      addLog("The patient is asked to cough but does not respond.", "warn");
      return;
    }
    // external pacing is recorded when transcutaneous pacing is switched on (changeTcp), not when the pads go on
    if (a !== "external-pacing") recordAction(a);
    if (a === "atropine") addLog("Atropine given IV (Oxford ch 10 gives 1 mg; follow local protocol).", "plain");
    else if (a === "cough") addLog("The patient is asked to cough, and coughs.", "plain");
    else if (a === "stop-infusion") addLog("The amiodarone infusion is stopped.", "plain");
    else if (a === "external-pacing") {
      setPads(true);
      addLog("Pads on for external pacing: set the rate and current on the defibrillator below.", "plain");
    } else if (a === "femoral-wire") {
      if (route !== "femoral") chooseRoute("femoral");
      setStage("access");
    }
    if (guided && sc.inLab.advice[a] && a !== "femoral-wire") addLog(sc.inLab.advice[a]!, "info");
  };

  const handOver = () => {
    const scNow = ctxRef.current.scenario;
    const thr = consistentThreshold(leadRef.current, scNow, faultsRef.current);
    const s = sensedSignals(leadRef.current, scNow, faultsRef.current);
    const h: Handover = { lead: leadRef.current, box: boxRef.current, threshold: thr, r: s.r, t: s.t };
    setHandover(h);
    addLog(
      `Lead secured, chest X-ray requested, handed over: ${boxRef.current.mode} ${boxRef.current.rate} ppm, ${formatOutput(boxRef.current.output, units)}, sensitivity ${boxRef.current.sensitivity} mV.`,
      "info"
    );
    if (tcpRef.current.on) {
      setTcp({ ...tcpRef.current, on: false });
      addLog("Transcutaneous pacing put on standby; pads left on.", "plain");
    }
    if (!sc.events.length) return finish(outcomes, h);
    setStage("events");
    startEvent(0);
  };

  const startEvent = (idx: number) => {
    const kind = sc.events[idx];
    if (!kind) return finish();
    let f = faultsRef.current;
    let callPrefix = "";
    if ((kind === "displacement" || kind === "threshold-rise") && f.conductionReturned) {
      f = { ...f, conductionReturned: false };
      callPrefix = "Later, complete heart block recurs. ";
    }
    const applied = applyFault(kind, sc, leadRef.current, f, boxRef.current);
    setLead(applied.lead);
    setFaults(applied.faults);
    setEventIdx(idx);
    setEventDx(null);
    setEventNote(null);
    addLog(`${callPrefix}${FAULT_INFO[kind].call}`, "warn");
  };

  const diagnose = (d: Diagnosis) => {
    const kind = sc.events[eventIdx];
    setEventDx(d);
    const right = FAULT_INFO[kind].diagnosis === d;
    if (!guided) {
      // outside guided practice the diagnosis is recorded without a verdict
      setEventNote({ text: "Diagnosis recorded. Fix what you see, then press Check.", tone: "plain" });
      addLog(`Diagnosis: ${DIAGNOSIS_LABEL[d]}.`, "plain");
      return;
    }
    setEventNote({
      text: right ? `Yes: ${DIAGNOSIS_LABEL[d].toLowerCase()}. Now fix it with the controls, then press Check.` : `Not quite. Look again at the strip and the box lights. Fix what you see, then press Check.`,
      tone: right ? "good" : "warn",
    });
    addLog(`Diagnosis: ${DIAGNOSIS_LABEL[d]}.`, right ? "good" : "warn");
  };

  const checkEvent = () => {
    const kind = sc.events[eventIdx];
    const st = faultStatus(kind, sc, leadRef.current, faultsRef.current, boxRef.current);
    if (st.resolved) {
      const o: PacingEventOutcome = { kind, diagnosis: eventDx, resolved: true, partial: st.partial };
      setOutcomes((os) => [...os, o]);
      addLog(`${FAULT_INFO[kind].title}: ${st.detail}`, "good");
      setEventNote(null);
      if (eventIdx + 1 < sc.events.length) startEvent(eventIdx + 1);
      else finish([...outcomes, o]);
    } else {
      setEventNote(guided ? { text: st.detail, tone: st.partial ? "warn" : "danger" } : { text: "Not resolved yet.", tone: "plain" });
    }
  };

  const showFix = () => {
    const kind = sc.events[eventIdx];
    const o: PacingEventOutcome = { kind, diagnosis: eventDx, resolved: false, partial: false };
    // apply the fix so the run can continue
    let l = leadRef.current;
    let f = faultsRef.current;
    let b = boxRef.current;
    if (kind === "displacement") {
      // rebuild a clean apical position for the route
      if (l.route !== "epicardial") l = { ...apexFor(l.route), perforated: l.perforated };
      f = { ...f, rMult: 1, thresholdMult: 1 };
      const thr = consistentThreshold(l, sc, f) ?? 1;
      b = { ...b, output: Math.max(b.output, recommendedOutput(thr)), mode: "VVI" };
    } else if (kind === "threshold-rise") {
      const thr = consistentThreshold(l, sc, f) ?? 1;
      b = { ...b, output: Math.min(20, recommendedOutput(thr)) };
    } else if (kind === "undersensing") {
      const s = sensedSignals(l, sc, f);
      b = { ...b, mode: "VVI", sensitivity: Math.max(s.tPaced + 0.5, Math.min(recommendedSensitivity(s.r), s.r - 0.5)) };
      b = { ...b, sensitivity: Math.round(b.sensitivity * 2) / 2 };
    } else if (kind === "noise-oversensing") {
      f = { ...f, noise: false };
      b = { ...b, mode: "VVI" };
    }
    setLead(l);
    setFaults(f);
    setBox(b);
    addLog(`${FAULT_INFO[kind].title}. ${FAULT_INFO[kind].fix}`, "info");
    setOutcomes((os) => [...os, o]);
    setEventNote(null);
    if (eventIdx + 1 < sc.events.length) startEvent(eventIdx + 1);
    else finish([...outcomes, o]);
  };

  const finish = (outs: PacingEventOutcome[] = outcomes, ho: Handover | null = handover) => {
    const scNow = ctxRef.current.scenario;
    const h = ho ?? { lead: leadRef.current, box: boxRef.current, threshold: consistentThreshold(leadRef.current, scNow, faultsRef.current), r: sig.r, t: sig.t };
    const st = inLabRef.current;
    const transvenous = route !== null && route !== "epicardial";
    const log: PacingRunLog = {
      scenarioId: sc.id,
      variant,
      units,
      sheath,
      tcpUsed,
      tcpMechanicalChecked: tcpChecked,
      access: route,
      finalZone: h.lead.zone,
      finalContact: leadInfo(h.lead).contact,
      lateralChecked: lateralChecked,
      perforation: lead.perforated || h.lead.perforated,
      thresholdMeasured,
      trueThreshold: h.threshold,
      finalOutput: h.box.output,
      finalRate: h.box.rate,
      finalSensitivity: h.box.sensitivity,
      finalMode: h.box.mode,
      sensingMeasured,
      sensingSkippedDependent: sensingSkipped && skipJustifiedRef.current,
      rWave: h.r,
      tWave: h.t,
      onTSpikes: onTCount,
      events: outs,
      ...(sc.inLab && st
        ? {
            inLab: {
              onsetT: st.onsetT,
              actions: st.actions,
              supportedAt: supportedRef.current,
              restoredAt: st.restoredAt,
              asyncWithIntrinsic: asyncRef.current,
              wirePlaced: ho !== null && transvenous && h.box.connected,
            },
          }
        : {}),
    };
    const res = scorePacing(log);
    if (firstRoute && firstRoute !== route && accessInfoFor(sc, firstRoute).verdict === "discouraged") {
      const i = res.items.findIndex((x) => x.label === "Access");
      if (i >= 0) res.items[i] = { ...res.items[i], detail: `${res.items[i].detail} (Your first choice was ${ACCESS_INFO[firstRoute].label.toLowerCase()}; you changed it.)` };
    }
    const crit = sc.inLab ? inLabCriteria(log) : null;
    // the ledger: each initial action the manuals expect here, taken or not, then the pass criteria
    if (sc.inLab && st)
      for (const a of sc.inLab.expected) {
        const at = actionAt(st, a);
        run.decide({
          id: `initial-${a}`,
          stage: "assess",
          label: INITIAL_ACTION_LABEL[a],
          correct: at !== null,
          expected: `${INITIAL_ACTION_LABEL[a]}. ${sc.inLab.advice[a] ?? ""}`.trim(),
          given: at !== null ? `Done at ${Math.round(at - st.onsetT)} s` : "Not done",
          lessonId: "hb-additional-procedures-pacing",
          ...(INITIAL_TIPS[a] ? { tipIds: INITIAL_TIPS[a] } : {}),
        });
      }
    if (crit)
      for (const c of crit)
        run.decide({
          id: `criterion-${c.id}`,
          stage: "debrief",
          label: c.label,
          correct: c.met,
          expected: c.label,
          given: c.detail,
          lessonId: "hb-additional-procedures-pacing",
          tipIds: CRITERION_TIPS[c.id],
        });
    setCriteria(crit);
    setResult(res);
    setStage("debrief");
    // outside guided practice the unscreened moves were not coached live: the debrief reports them
    if (runRef.current.mode !== "guided" && blindMoves.current > 0)
      addLog(`${blindMoves.current} lead ${blindMoves.current === 1 ? "move was" : "moves were"} made without screening. Use fluoroscopy whenever the lead moves inside the heart.`, "warn");
    const passed = crit ? inLabPassed(log) : res.score >= PASS_SCORE.default;
    run.finish({
      score: res.score,
      passed,
      criticalErrors: log.perforation ? 1 : 0,
      complications: log.perforation ? ["RV perforation"] : [],
      metrics: {
        ...(log.thresholdMeasured !== null ? { thresholdMa: log.thresholdMeasured } : {}),
        outputMa: log.finalOutput,
        ...(log.inLab?.supportedAt != null ? { secondsToSupport: Math.round(log.inLab.supportedAt - log.inLab.onsetT) } : {}),
      },
      fluoroS: Math.round(fluoroTime),
    });
    addLog(`Run complete: ${res.score} / 100.`, "info");
  };

  const stageDone = (s: Stage) => STAGES.indexOf(s) < STAGES.indexOf(stage);

  // --- tips ------------------------------------------------------------------------------------
  const context = useMemo(() => pacingTipContext(stage, { events: patientEv, tcp: tcp.on }), [stage, patientEv, tcp.on]);
  const tipsMod = useTipsModule();
  const visible = tipsVisible(run);
  const tips = useMemo(() => pacingTips(tipsMod, context, visible), [tipsMod, context, visible]);
  const contextRef = useRef(context);
  contextRef.current = context;

  // DEV: window.__lab.pacing
  const stateRef = useRef<() => unknown>(() => null);
  stateRef.current = () => ({
    scenario: sc.id,
    variant,
    mode: runRef.current.mode,
    stage: stageRef.current,
    t: nowOf(rhythmRef.current),
    zone: leadRef.current.zone,
    box: boxRef.current,
    units,
    tcp: tcpRef.current,
    conductionReturned: faultsRef.current.conductionReturned,
    inLab: inLabRef.current,
    supportedAt: supportedRef.current,
    asyncWithIntrinsic: asyncRef.current,
    numerics: pacingNumerics(rhythmRef.current, ctxRef.current),
  });
  useEffect(
    () =>
      registerLabHook("pacing", {
        context: () => contextRef.current,
        tips: () => pacingTips(loadedTips(), contextRef.current, tipsVisible(runRef.current.run)).map((t) => t.id),
        state: () => stateRef.current(),
        events: () => contextRef.current?.events ?? [],
        step: (seconds: number, dt = 0.25) => {
          let left = Math.max(0, seconds);
          while (left > 1e-9) {
            const h = Math.min(dt, left);
            advanceRhythm(rhythmRef.current, ctxRef.current, h);
            scanRef.current();
            left -= h;
          }
        },
      }),
    []
  );

  // --- render -------------------------------------------------------------------------------
  const warnCls = numerics.warning === "danger" ? "text-danger" : numerics.warning === "caution" ? "text-warn" : "text-good";
  const shownLead = fluoroOn ? lead : lihLead;
  const canMoveLead = (stage === "position" || stage === "test" || stage === "events") && route !== null && route !== "epicardial";

  return (
    <div className="space-y-3">
      <LabModeBar mode={run.mode} helpAskedAt={run.helpAskedAt} onAskHelp={() => run.askHelp(simNow)}>
        <span className="stat-label">Scenario</span>
        <select
          value={scenarioId}
          onChange={(e) => onScenario(e.target.value as PacingScenarioId)}
          aria-label="Scenario"
          className="field !h-8 text-[13px] w-full sm:w-auto min-w-0 sm:max-w-[320px]"
        >
          {PACING_SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.short}
            </option>
          ))}
        </select>
        <button className="btn btn-ghost" onClick={onRestart}>
          Restart
        </button>
      </LabModeBar>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem] gap-3">
        <div className="space-y-3 min-w-0">
          {/* Monitor */}
          <div className="panel overflow-hidden">
            <div className="panel-head">
              <span className="flex items-center gap-2">
                <span className="led text-ecg animate-ledpulse" />
                Monitor: II, V1, arterial line
              </span>
              {/* the rhythm interpretation is a teaching aid: guided practice only */}
              {guided && <span className={`normal-case tracking-normal font-normal ${warnCls}`}>{numerics.label}</span>}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_9rem]">
              <SweepMonitor
                sourceRef={sourceRef}
                className="h-56"
                onFrame={onFrame}
                channels={[
                  { label: "II", color: "#3ef2a4", min: -1.7, max: 2.2, weight: 1.1 },
                  { label: "V1", color: "#3ef2a4", min: -1.7, max: 2.0, weight: 0.9 },
                  { label: "ART mmHg", color: "#ff5d6c", min: 0, max: 160, weight: 1.2, gridLines: [50, 100] },
                ]}
              />
              <div className="border-l border-line divide-y divide-line/70">
                <Readout label="HR" unit="bpm" value={numerics.hr} color="text-ecg" blip />
                <Readout label="ABP" unit="mmHg" value={`${numerics.sys}/${numerics.dia}`} sub={`(${numerics.map})`} color="text-art" />
                <Readout label="Paced" unit="%" value={numerics.pacedPct} color="text-ink-soft" />
              </div>
            </div>
            {(numerics.phrenic || (guided && lead.perforated)) && (
              <div className="px-3 py-1.5 text-[12px] border-t border-line text-warn">
                {numerics.phrenic && (guided ? "The patient is hiccuping: diaphragmatic stimulation. " : "The patient is hiccuping. ")}
                {guided && lead.perforated && "Perforation has occurred: watch for pericardial pain, hypotension and an effusion on echo."}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Fluoroscopy */}
            <Panel
              title={<>Fluoroscopy</>}
              right={<span className="font-mono text-ink-faint">{Math.floor(fluoroTime / 60)}:{String(Math.floor(fluoroTime % 60)).padStart(2, "0")} screening</span>}
            >
              <div className="grid grid-cols-2 gap-2">
                <FluoroImage
                  view="ap"
                  lead={route ? shownLead : null}
                  live={fluoroOn}
                  label="AP"
                  onDrag={canMoveLead ? onFluoroDrag : undefined}
                  hint={canMoveLead ? "drag ↕ advance / withdraw, ↔ rotate" : undefined}
                />
                <div className="relative">
                  <FluoroImage view="lat" lead={latSnap} live={false} label="LATERAL" />
                  {!latSnap && <div className="absolute inset-0 flex items-center justify-center text-[12px] text-[#1d2329] text-center px-4">No lateral image yet</div>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <button className={`btn ${fluoroOn ? "btn-danger" : ""}`} onClick={() => setFluoroOn((f) => !f)} disabled={!route || route === "epicardial"}>
                  {fluoroOn ? "Fluoro on (release)" : "Fluoro pedal"}
                </button>
                <button className="btn" onClick={takeLateral} disabled={!route || route === "epicardial"}>
                  Lateral view
                </button>
                <span className="mx-1 h-5 border-l border-line" />
                <button className="btn" disabled={!canMoveLead} onClick={() => move(-1)}>
                  ◀ Withdraw
                </button>
                <button className="btn" disabled={!canMoveLead} onClick={() => move(0.5)}>
                  Advance ▶
                </button>
                <button className="btn" disabled={!canMoveLead} onClick={() => rotate(-30)} title="Rotate anticlockwise">
                  ↺
                </button>
                <button className="btn" disabled={!canMoveLead} onClick={() => rotate(30)} title="Rotate clockwise">
                  ↻
                </button>
              </div>
              {route && route !== "epicardial" && (
                <div className="mt-2 text-[12px] text-ink-soft space-y-0.5">
                  <div>
                    <span className="text-ink-faint">Tip points: </span>
                    {/* outside guided practice only the direction, not the structures it leads to */}
                    {guided ? DIRECTION_LABEL[info.direction] : DIRECTION_LABEL[info.direction].replace(/\s*\(.*\)$/, "")}
                  </div>
                  {/* the tip location is a teaching aid: guided practice only, never in exams */}
                  {guided && showTipLabel && (
                    <div>
                      <span className="text-ink-faint">Tip location (instructor view): </span>
                      <span className={info.malposition ? "text-warn" : info.stable ? "text-good" : "text-ink"}>{info.label}</span>
                      {info.contact > 0 && <span className="text-ink-faint"> · contact {Math.round(info.contact * 100)}%</span>}
                    </div>
                  )}
                  {guided && (
                    <label className="flex items-center gap-1.5 text-ink-faint">
                      <input type="checkbox" checked={!showTipLabel} onChange={(e) => setShowTipLabel(!e.target.checked)} />
                      Hide tip location (test yourself)
                    </label>
                  )}
                </div>
              )}
              <div className="mt-2">
                <div className="stat-label mb-1">Tip electrogram (unipolar)</div>
                <SweepMonitor sourceRef={egmRef} className="h-20 rounded" channels={[{ label: "TIP", color: "#7dd3fc", min: -2.2, max: 3.2 }]} />
                <p className="text-[12px] text-ink-faint mt-1">
                  Large atrial deflections in the RA, a large ventricular signal once across the tricuspid valve, both in the coronary sinus, and ST elevation (current of injury) when the tip is in contact with the myocardium.
                </p>
              </div>
            </Panel>

            {/* Pacing box + TCP */}
            <div className="space-y-3">
              <Panel
                title={<>Temporary pacing box</>}
                right={
                  <span className="flex items-center gap-3 font-mono text-[12px]">
                    <span className="flex items-center gap-1">
                      <span ref={paceLed} className="led text-good" style={{ opacity: 0.15 }} /> PACE
                    </span>
                    <span className="flex items-center gap-1">
                      <span ref={senseLed} className="led text-warn" style={{ opacity: 0.15 }} /> SENSE
                    </span>
                  </span>
                }
              >
                <div className="grid grid-cols-3 gap-1">
                  <Knob label="Rate" unit="ppm" value={box.rate} min={BOX_LIMITS.rate[0]} max={BOX_LIMITS.rate[1]} step={stepRate} onChange={changeRate} color="#3ef2a4" />
                  <Knob
                    label="Output"
                    unit={units}
                    value={outputIn(box.output, units)}
                    min={outputLimits(units)[0]}
                    max={outputLimits(units)[1]}
                    step={(v, d) => stepOutputIn(v, d, units)}
                    onChange={(v) => changeOutput(outputFrom(v, units))}
                    format={(v) => v.toFixed(1)}
                    color="#E9B95A"
                  />
                  <Knob
                    label="Sensitivity"
                    unit="mV"
                    value={box.sensitivity}
                    min={BOX_LIMITS.sensitivity[0]}
                    max={BOX_LIMITS.sensitivity[1]}
                    step={stepSensitivity}
                    onChange={changeSens}
                    format={(v) => v.toFixed(1)}
                    color="#4F8EF7"
                    hint="Higher number = LESS sensitive"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Seg options={[{ id: "VVI", label: "VVI" }, { id: "VOO", label: "VOO (async)" }, { id: "OFF", label: "Off" }]} value={box.mode} onChange={changeMode} />
                  {!box.connected ? (
                    <button className="btn btn-accent" onClick={connectBox} disabled={!route || stage === "assess" || stage === "access"}>
                      Connect lead to box
                    </button>
                  ) : (
                    <span className="chip text-good border-good/40">connected</span>
                  )}
                  <button className="btn" onClick={reseat} disabled={!box.connected}>
                    Check connections
                  </button>
                  <span className="ml-auto flex items-center gap-1.5">
                    <span className="stat-label">Output reads</span>
                    <Seg
                      options={[
                        { id: "V", label: "V" },
                        { id: "mA", label: "mA" },
                      ]}
                      value={units}
                      onChange={(u) => {
                        setUnits(u);
                        addLog(`The box output now reads in ${u === "V" ? "volts" : "milliamps"}.`, "plain");
                      }}
                    />
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-[12px]">
                  <div className="rounded border border-line p-2 bg-base-800/60">
                    <div className="stat-label">Measured threshold</div>
                    <div className="metric text-ink text-base">{thresholdMeasured !== null ? formatOutput(thresholdMeasured, units) : "—"}</div>
                    {guided && thresholdMeasured !== null && (
                      <div className="text-ink-faint">
                        {margin >= OXFORD_OUTPUT_MARGIN
                          ? `3× = ${formatOutput(thresholdMeasured * OXFORD_OUTPUT_MARGIN, units)} or more (Oxford ch 9)`
                          : `2–3× = ${outputIn(thresholdMeasured * OUTPUT_MARGIN.min, units).toFixed(1)}–${outputIn(thresholdMeasured * OUTPUT_MARGIN.max, units).toFixed(1)} ${units}`}
                      </div>
                    )}
                  </div>
                  <div className="rounded border border-line p-2 bg-base-800/60">
                    <div className="stat-label">Measured R wave</div>
                    <div className="metric text-ink text-base">{sensingMeasured !== null ? `${sensingMeasured} mV` : sensingSkipped ? "not tested" : "—"}</div>
                    {guided && sensingMeasured !== null && <div className="text-ink-faint">half = {recommendedSensitivity(sensingMeasured)} mV</div>}
                  </div>
                </div>
                <p className="text-[12px] text-ink-faint mt-2">
                  Sensitivity is a threshold in mV: signals at least this big are sensed. A higher number makes the box LESS sensitive. Output reads in {units === "V" ? "volts, as on Oxford's box" : "milliamps"}; read the units before you quote a threshold.
                </p>
              </Panel>

              <Panel title={<>Transcutaneous pacing (defibrillator)</>} right={<span className={tcp.on ? "text-warn" : "text-ink-faint"}>{tcp.on ? "pacing" : "standby"}</span>}>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                    <input type="checkbox" checked={pads} onChange={(e) => setPads(e.target.checked)} /> Pads applied (anterior–posterior)
                  </label>
                  <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                    <input type="checkbox" checked={analgesia} onChange={(e) => setAnalgesia(e.target.checked)} /> Analgesia / sedation
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <label className="text-[12px] text-ink-soft">
                    <span className="stat-label">Rate {tcp.rate} ppm</span>
                    <input
                      type="range"
                      className="w-full"
                      min={TCP_LIMITS.rate[0]}
                      max={TCP_LIMITS.rate[1]}
                      step={5}
                      value={tcp.rate}
                      onChange={(e) => changeTcp({ ...tcpRef.current, rate: Number(e.target.value) })}
                    />
                  </label>
                  <label className="text-[12px] text-ink-soft">
                    <span className="stat-label">Current {tcp.current} mA</span>
                    <input
                      type="range"
                      className="w-full"
                      min={TCP_LIMITS.current[0]}
                      max={TCP_LIMITS.current[1]}
                      step={5}
                      value={tcp.current}
                      onChange={(e) => changeTcp({ ...tcpRef.current, current: Number(e.target.value) })}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <button
                    className={`btn ${tcp.on ? "btn-danger" : "btn-accent"}`}
                    disabled={!pads}
                    onClick={() => {
                      const on = !tcpRef.current.on;
                      changeTcp({ ...tcpRef.current, on });
                      addLog(on ? "Transcutaneous pacing started. Increase the current until each spike is followed by a broad complex, then confirm a pulse." : "Transcutaneous pacing stopped (pads left on).", on ? "info" : "plain");
                    }}
                  >
                    {tcp.on ? "Stop pacing" : "Start pacing"}
                  </button>
                  <Seg options={[{ id: "demand", label: "Demand" }, { id: "fixed", label: "Fixed" }]} value={tcp.demand ? "demand" : "fixed"} onChange={(v) => changeTcp({ ...tcpRef.current, demand: v === "demand" })} />
                  <button className="btn" onClick={checkPulse}>
                    Check femoral pulse
                  </button>
                </div>
                {pulseNote && <p className="text-[12px] text-ink-soft mt-2">{pulseNote}</p>}
                <p className="text-[12px] text-ink-faint mt-2">
                  Electrical capture is a broad complex with a T wave after each spike; mechanical capture is a pulse. Check a femoral pulse or the arterial line, not the carotid (muscle twitching misleads) and not the ECG alone.
                </p>
              </Panel>
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-3 min-w-0">
          {stage === "debrief" && result ? (
            <>
              {criteria && <CriteriaPanel criteria={criteria} />}
              <Debrief score={result.score} items={result.items} teaching={sc.teaching} onRestart={onRestart} title={`Debrief: ${sc.title}`} />
            </>
          ) : (
            <Panel title={<>{sc.title}</>} right={<span className="text-accent">{STAGE_LABEL[stage]}</span>}>
              {stage === "assess" && (
                <div className="space-y-2 text-[12px] text-ink-soft">
                  <p>{sc.vignette}</p>
                  {guided && !sc.inLab && (
                    <p className="text-ink-faint">
                      {sc.unstable
                        ? "The patient is compromised now. Bridge with transcutaneous pacing (pads, analgesia, increase the current until capture, confirm a pulse) while the wire is prepared."
                        : "Pads on as a precaution. Pacing is a back-up here; transcutaneous pacing is not essential unless the patient deteriorates."}
                    </p>
                  )}
                  {sc.inLab && inLab ? (
                    <InLabChoices
                      sc={sc}
                      st={inLab}
                      now={simNow}
                      waitUntil={waitUntil}
                      guided={guided}
                      supportedAt={supportedAt}
                      padsOn={pads}
                      responsive={responsive}
                      onAction={initialAction}
                      onFinish={() => finish()}
                    />
                  ) : fixedRoute === "epicardial" ? (
                    <button
                      className="btn btn-accent"
                      onClick={() => {
                        setStage("test");
                        setBox({ ...boxRef.current, connected: true });
                        addLog("Epicardial wires connected to the box via the bridging cable.", "info");
                      }}
                    >
                      Connect the epicardial wires
                    </button>
                  ) : (
                    <button className="btn btn-accent" onClick={() => setStage("access")}>
                      Prepare for transvenous pacing
                    </button>
                  )}
                </div>
              )}

              {sc.inLab && inLab && stage !== "assess" && stage !== "debrief" && (
                // the in-lab actions stay open while the wire goes in: drugs, a cough, stopping an infusion, external pacing
                <div className="mb-3 border-b border-line pb-3 text-[12px] text-ink-soft">
                  <InLabChoices
                    sc={sc}
                    st={inLab}
                    now={simNow}
                    waitUntil={waitUntil}
                    guided={guided}
                    supportedAt={supportedAt}
                    padsOn={pads}
                    responsive={responsive}
                    compact
                    onAction={initialAction}
                    onFinish={() => finish()}
                  />
                </div>
              )}

              {stage === "access" && (
                <div className="space-y-2">
                  <p className="text-[12px] text-ink-soft">Choose the venous route for the temporary wire.</p>
                  {(["rij", "femoral", "left-subclavian"] as AccessRoute[]).map((r) => {
                    const ai = accessInfoFor(sc, r);
                    const chosen = route === r;
                    // the verdict on a route is a teaching aid: guided practice only (the debrief gives it otherwise)
                    const verdictCls = !guided ? "border-accent/60 bg-accent/10" : ai.verdict === "discouraged" ? "border-danger/60 bg-danger/10" : "border-accent/60 bg-accent/10";
                    return (
                      <button
                        key={r}
                        className={`w-full text-left rounded-md border px-3 py-2 text-[12px] transition-colors ${chosen ? verdictCls : "border-line hover:border-accent/40"}`}
                        onClick={() => chooseRoute(r)}
                      >
                        <div className="text-ink">{ai.label}</div>
                        {guided && chosen && <div className={`mt-1 ${ai.verdict === "discouraged" ? "text-danger" : ai.verdict === "acceptable" ? "text-warn" : "text-good"}`}>{ai.why}</div>}
                      </button>
                    );
                  })}
                  {route && (
                    <div className="space-y-1">
                      <div className="stat-label">Venous sheath against the wire</div>
                      <Seg
                        options={[
                          { id: "larger", label: "One size larger" },
                          { id: "same", label: "Same size" },
                        ]}
                        value={sheath ?? ("" as SheathFit)}
                        onChange={(f) => {
                          setSheath(f);
                          addLog(f === "larger" ? "Sheath one size larger than the wire." : "Sheath the same size as the wire.", "plain");
                          if (guided && f === "same") addLog("Oxford ch 9: a sheath larger than the wire lets it turn and advance freely; the same size binds it.", "info");
                        }}
                      />
                    </div>
                  )}
                  <button className="btn btn-accent" disabled={!route || !sheath} onClick={() => setStage("position")}>
                    {guided && route === "left-subclavian" ? "Proceed anyway" : "Sheath in: start positioning"}
                  </button>
                </div>
              )}

              {stage === "position" && (
                <div className="space-y-2 text-[12px] text-ink-soft">
                  <p>Screen while you move the lead. Aim for the RV apex or septum.</p>
                  {guided && (
                  <ul className="space-y-1 text-ink-faint">
                    <li>• Point the tip toward the tricuspid valve in the low RA and advance across; then toward the apex (or posteriorly for the septum).</li>
                    <li>• Advance until the tip electrogram shows ST elevation (contact), but do not force it.</li>
                    <li>• {route === "femoral" ? "From the femoral route, form a loop against the lateral RA wall first, then rotate toward the valve." : "If the tip flicks up toward the outflow tract, withdraw and redirect toward the apex."}</li>
                    <li>• Take a lateral view: the RV is anterior, the coronary sinus posterior.</li>
                  </ul>
                  )}
                  <button className="btn btn-accent" onClick={connectBox}>
                    Connect the box
                  </button>
                </div>
              )}

              {stage === "test" && (
                <TestChecklist
                  guided={guided}
                  units={units}
                  margin={margin}
                  scenarioDependent={!sensingTestable(sc, faults)}
                  box={box}
                  intrinsic={intrinsic}
                  thresholdMeasured={thresholdMeasured}
                  sensingMeasured={sensingMeasured}
                  sensingSkipped={sensingSkipped}
                  thrNow={thrNow}
                  r={sig.r}
                  tPaced={sig.tPaced}
                  pacedPct={numerics.pacedPct}
                  onSkipSensing={() => {
                    // the skip earns its credit only if the patient really was pacing dependent at the time
                    skipJustifiedRef.current = !sensingTestable(ctxRef.current.scenario, faultsRef.current);
                    setSensingSkipped(true);
                    addLog("Pacing dependent: sensing not tested by turning the rate down. Sensitivity set to a standard value per local protocol and reviewed when an intrinsic rhythm is present.", "info");
                  }}
                  onHandover={handOver}
                />
              )}

              {stage === "events" && sc.events[eventIdx] && (
                <div className="space-y-2 text-[12px]">
                  <div className="text-ink-faint">
                    Event {eventIdx + 1} of {sc.events.length}
                  </div>
                  <p className="text-ink">{FAULT_INFO[sc.events[eventIdx]].call}</p>
                  <div className="stat-label mt-1">What is the problem?</div>
                  <div className="flex flex-wrap gap-1.5">
                    {DIAGNOSES.map((d) => (
                      <button key={d} className={`btn text-xs ${eventDx === d ? "btn-accent" : ""}`} onClick={() => diagnose(d)}>
                        {DIAGNOSIS_LABEL[d]}
                      </button>
                    ))}
                  </div>
                  {eventNote && <p className={toneCls(eventNote.tone)}>{eventNote.text}</p>}
                  <p className="text-ink-faint">
                    Tools: box dials and mode, Check connections, the lead controls under fluoroscopy, and transcutaneous pacing as a back-up.
                  </p>
                  <div className="flex gap-2">
                    <button className="btn btn-good" onClick={checkEvent} disabled={!eventDx}>
                      Check
                    </button>
                    {guided && (
                      <button className="btn btn-ghost" onClick={showFix}>
                        Show me the fix
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Panel>
          )}

          {stage !== "debrief" && <LabTipsPanel tips={tips} visible={visible} mode={run.mode} onAskHelp={() => run.askHelp(simNow)} events={context?.events ?? []} />}

          <Panel title={<>Steps</>}>
            <StepTracker steps={STAGES} labels={STAGE_LABEL} current={stage} done={stageDone} />
          </Panel>

          <LogPanel log={log} />
        </div>
      </div>
    </div>
  );
}

function toneCls(t: Tone) {
  return t === "good" ? "text-good" : t === "warn" ? "text-warn" : t === "danger" ? "text-danger" : t === "info" ? "text-accent" : "text-ink-soft";
}

/** A clean apical position for a route (used by "Show me the fix"). */
function apexFor(route: AccessRoute): LeadState {
  let l = initialLead(route);
  if (route === "femoral") {
    l = moveLead(l, ZONE_LEN.ivc + ZONE_LEN.ra).lead;
    l = rotateLead(l, 180);
    l = moveLead(l, 1).lead; // loop
    l = rotateLead(l, 180);
    l = moveLead(l, ZONE_LEN["rv-inflow"] + ZONE_LEN["rv-apex"] + 0.01).lead;
  } else {
    l = moveLead(l, ZONE_LEN.svc + ZONE_LEN.ra + ZONE_LEN["rv-inflow"] + ZONE_LEN["rv-apex"]).lead;
  }
  return { ...l, push: 0 };
}

export function TestChecklist({
  guided,
  units,
  margin,
  scenarioDependent,
  box,
  intrinsic,
  thresholdMeasured,
  sensingMeasured,
  sensingSkipped,
  thrNow,
  r,
  tPaced,
  pacedPct,
  onSkipSensing,
  onHandover,
}: {
  guided: boolean;
  units: BoxUnits;
  margin: number;
  scenarioDependent: boolean;
  box: BoxSettings;
  intrinsic: number;
  thresholdMeasured: number | null;
  sensingMeasured: number | null;
  sensingSkipped: boolean;
  thrNow: number | null;
  r: number;
  tPaced: number;
  pacedPct: number;
  onSkipSensing: () => void;
  onHandover: () => void;
}) {
  const rateAbove = box.rate > intrinsic + 5;
  const outputOk = thresholdMeasured !== null && box.output >= margin * thresholdMeasured - 1e-9;
  const oxford = margin >= OXFORD_OUTPUT_MARGIN;
  const sensOk = !assessSensing(box.sensitivity, { r, t: 0, tPaced, p: 0, noise: 0 }).undersensing && box.sensitivity > tPaced && (sensingMeasured === null || box.sensitivity <= sensingMeasured / 2 + 1e-9);
  // the ticks judge the settings against the patient's true signals: a guided teaching aid only
  const Row = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <li className="flex gap-2">
      <span className={guided && ok ? "text-good" : "text-ink-faint"}>{guided && ok ? "✓" : "○"}</span>
      <span className={ok ? "text-ink-soft" : "text-ink-soft"}>{children}</span>
    </li>
  );
  return (
    <div className="space-y-2 text-[12px]">
      <p className="text-ink-soft">With the box connected, confirm capture, measure the threshold and sensing, then set safe margins.</p>
      <ul className="space-y-1.5">
        <Row ok={pacedPct >= 90}>
          Pacing every beat with capture{guided ? ` (${pacedPct}% paced)` : ""}. The rate must be above the intrinsic rate{guided ? ` (~${intrinsic} bpm)` : ""} to judge capture.
        </Row>
        {guided && <Row ok={rateAbove}>Rate {box.rate} ppm {rateAbove ? "is" : "is not"} above the intrinsic rate.</Row>}
        <Row ok={thresholdMeasured !== null}>
          Threshold: {oxford ? "from a high output (Oxford starts at 3 V)," : ""} turn the output down step by step until capture is lost.{" "}
          {thresholdMeasured !== null
            ? `Measured ${formatOutput(thresholdMeasured, units)}${guided ? (thresholdMeasured < ACCEPTABLE_THRESHOLD ? ` (acceptable, below ${formatOutput(ACCEPTABLE_THRESHOLD, units)})` : " (high; consider repositioning)") : ""}.`
            : ""}
        </Row>
        <Row ok={outputOk}>
          {oxford
            ? `Output at least three times the threshold (Oxford ch 9)${guided && thresholdMeasured !== null ? `: ${formatOutput(thresholdMeasured * OXFORD_OUTPUT_MARGIN, units)} or more` : ""}.`
            : `Output at 2 to 3 times the threshold, about 2.5 times by default, or per local protocol${guided && thresholdMeasured !== null ? `: about ${formatOutput(recommendedOutput(thresholdMeasured), units)}` : ""}.`}
        </Row>
        {/* whether the patient is pacing dependent is model truth: guided practice says so; otherwise the learner decides */}
        {guided && scenarioDependent ? (
          <Row ok={sensingSkipped}>
            Pacing dependent: do not turn the rate down to test sensing.{" "}
            {!sensingSkipped && (
              <button className="btn text-xs py-0 ml-1" onClick={onSkipSensing}>
                Acknowledge
              </button>
            )}
          </Row>
        ) : guided ? (
          <Row ok={sensingMeasured !== null}>
            Sensing: turn the rate below the intrinsic rate so the patient's own beats appear, then turn the sensitivity number UP until the SENSE light stops flashing with each beat. {sensingMeasured !== null ? `R wave about ${sensingMeasured} mV.` : ""}
          </Row>
        ) : (
          <Row ok={sensingMeasured !== null || sensingSkipped}>
            Sensing: if the patient has an intrinsic rhythm above the lowest box rate, turn the rate below it and find where the SENSE light stops; if the patient is pacing dependent, do not turn the rate down.{" "}
            {sensingMeasured !== null ? `R wave about ${sensingMeasured} mV.` : sensingSkipped ? "Sensing not tested." : ""}
            {!sensingSkipped && sensingMeasured === null && (
              <button className="btn text-xs py-0 ml-1" onClick={onSkipSensing}>
                Pacing dependent: sensing not tested
              </button>
            )}
          </Row>
        )}
        <Row ok={sensOk}>
          Sensitivity about half the R wave{guided && sensingMeasured !== null ? ` (${recommendedSensitivity(sensingMeasured)} mV or lower)` : ""}, but above the T wave so it is not oversensed.
        </Row>
        <Row ok={box.rate >= 50 && box.rate <= 90 && box.mode === "VVI"}>Back-up rate and mode set for the hand-over (VVI, rate appropriate to the patient).</Row>
      </ul>
      {guided && thrNow !== null && thrNow >= ACCEPTABLE_THRESHOLD && (
        <p className="text-warn">The tip position gives a high threshold. Aim for a stable apical or septal position with a threshold below {formatOutput(ACCEPTABLE_THRESHOLD, units)}.</p>
      )}
      <button className="btn btn-accent" onClick={onHandover} disabled={!box.connected}>
        Secure the lead, chest X-ray, hand over
      </button>
    </div>
  );
}

/** The in-lab initial management: the choices, what has been done, and the time since the block began. */
export function InLabChoices({
  sc,
  st,
  now,
  waitUntil,
  guided,
  supportedAt,
  padsOn = false,
  responsive = true,
  compact = false,
  onAction,
  onFinish,
}: {
  sc: PacingScenario;
  st: InLabState;
  now: number;
  waitUntil: number | null;
  guided: boolean;
  supportedAt: number | null;
  /** the pads are on: the external-pacing button has done its part (the action is recorded when pacing starts) */
  padsOn?: boolean;
  /** the patient still responds; a patient in prolonged standstill cannot cough */
  responsive?: boolean;
  /** after the assess stage: the actions that still make sense while the wire goes in (no wait, no second wire) */
  compact?: boolean;
  onAction: (a: InitialAction) => void;
  onFinish: () => void;
}) {
  const since = Math.max(0, now - st.onsetT);
  const clock = (x: number) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
  const restored = st.restoredAt !== null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-ink-faint">
        <span>Since the slow rhythm began</span>
        <span className="font-mono text-ink">{clock(since)}</span>
      </div>
      {guided && sc.inLab && (
        <p className="text-ink-faint">
          Support the rhythm within {clock(sc.inLab.timeLimitS)}
          {supportedAt !== null ? `: supported at ${clock(Math.max(0, supportedAt - st.onsetT))}.` : "."}
        </p>
      )}
      <div className="stat-label">Initial management</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {initialActionsFor(sc)
          .filter((a) => !compact || (a !== "wait" && a !== "femoral-wire"))
          .map((a) => {
          const done = actionAt(st, a) !== null;
          const waiting = a === "wait" && waitUntil !== null;
          const padsDone = a === "external-pacing" && padsOn;
          const noResponse = a === "cough" && !responsive && !done;
          return (
            <button key={a} className={`btn justify-start text-xs ${done ? "btn-accent" : ""}`} disabled={waiting || padsDone || noResponse || (done && a !== "femoral-wire")} onClick={() => onAction(a)}>
              {a === "wait"
                ? waiting
                  ? `Watching… ${Math.max(0, Math.ceil(waitUntil! - now))} s`
                  : `${INITIAL_ACTION_LABEL.wait} (${IN_LAB_MODEL.waitS} s)`
                : INITIAL_ACTION_LABEL[a]}
              {noResponse ? " (no response)" : ""}
              {done && a !== "wait" ? " ✓" : ""}
            </button>
          );
        })}
      </div>
      {!compact && <p className="text-ink-faint">External pacing runs from the defibrillator panel; the femoral wire continues to venous access, the lead and the box.</p>}
      {restored && (
        <button className="btn btn-good" onClick={onFinish}>
          Conducted rhythm back: finish the case
        </button>
      )}
    </div>
  );
}

/** The pass criteria of an in-lab run, shown in the debrief. */
function CriteriaPanel({ criteria }: { criteria: InLabCriterion[] }) {
  const passed = criteria.every((c) => c.met);
  return (
    <Panel title={<>Pass criteria</>} right={<span className={passed ? "text-good" : "text-danger"}>{passed ? "passed" : "not passed"}</span>}>
      <ul className="space-y-1.5 text-[12px]">
        {criteria.map((c) => (
          <li key={c.id} className="flex gap-2">
            <span className={c.met ? "text-good" : "text-danger"}>{c.met ? "✓" : "✗"}</span>
            <span>
              <span className="text-ink">{c.label}.</span> <span className="text-ink-soft">{c.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
