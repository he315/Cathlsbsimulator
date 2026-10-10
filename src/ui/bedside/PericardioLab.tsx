import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PERIC_SCENARIOS,
  getPericScenario,
  MANAGEMENT_LABEL,
  WINDOW_INFO,
  STRUCTURE_LABEL,
  SALINE_TEXT,
  WIRE_TEXT,
  SUPPORTIVE_OPTIONS,
  haemodynamics,
  pocketDepths,
  effusionSize,
  needlePath,
  structureAt,
  trajectoryRisk,
  aspirate,
  salineCheck,
  wireCheck,
  needlePressure,
  inspiration,
  drain,
  accumulateCoupled,
  echoAvailable,
  isCorrectManagement,
  leakFromTransfer,
  provokesEctopy,
  standInPerforatedEngine,
  scorePericardiocentesis,
  HANDOVER_LEAK,
  EnginePericardium,
  type PericScenario,
  type PericScenarioId,
  type Management,
  type Trajectory,
  type Structure,
  type Aspirate,
  type SalineResult,
  type WireResult,
  type Haemo,
  type ScoreResult,
} from "../../simulation/pericardiocentesis";
import { engineFromHandover, patientHandoverFrom, type PatientHandover } from "../../simulation/session/handover";
import type { LabTransfer } from "../../state/useLabHandoverStore";
import type { LabEvent } from "../../content/lab/tips";
import type { LaunchMode } from "../../content/schema";
import { PASS_SCORE } from "../../progress/logbook";
import { registerLabHook } from "../../dev/labHooks";
import { runCaseId, useLabRun } from "../lab/labRun";
import { loadedTips, selectTips, useContextTips } from "../lab/useLabTips";
import LabTipsPanel from "../lab/LabTipsPanel";
import { PatientEventAdapter } from "../lab/patientEvents";
import { PERIC_CASE_EVENTS, pericardioTipContext, pericardioVitals, type PericStage } from "../lab/bedsideTips";
import SweepMonitor, { type MonitorSource } from "./SweepMonitor";
import EchoView, { type EchoClock, type EchoViewId } from "./EchoView";
import NeedlePlanner from "./NeedlePlanner";
import { Debrief, LogPanel, Panel, Readout, Seg, StepTracker, type LogEntry, type Tone } from "./common";

// ===========================================================================
// Pericardiocentesis lab: recognise tamponade on the monitor and echo, decide
// whether percutaneous drainage is appropriate, choose the window with the
// largest safe pocket, plan and advance the needle while aspirating, confirm
// the position (aspirate, agitated saline, pressure, wire on fluoroscopy),
// place a drain and watch the haemodynamics recover.
//
// pericardiocentesis-tips-and-pci-handover:
//   • The lab tips of the bedside lab (src/ui/lab/bedsideTips.ts) show at each
//     stage under the run's policy (useLabRun, useContextTips, LabTipsPanel).
//   • from-pci-perforation continues the PCI patient on its PatientEngine: the
//     useLabHandoverStore transfer (BedsideLab takes it and passes it here), or
//     a stand-in perforated patient when opened without one. The leak runs
//     while the hole is open and the drain keeps draining it; the other
//     scenarios use the bedside model (haemodynamics()).
//   • Perforation scenarios show the contrast-outlined sac on fluoroscopy, so
//     X-ray can guide the needle while the echo is not yet in the room.
//   • The model runs in lab time (0.5 s steps); in DEV builds
//     window.__lab.pericardio.step(s) advances it.
//   • What the needle tip is in, and the hazards of a planned path, are
//     teaching aids shown in guided practice only.
// ===========================================================================

type Stage = PericStage;
const STAGES: Stage[] = ["assess", "decide", "plan", "needle", "drain", "debrief"];
const STAGE_LABEL: Record<Stage, string> = {
  assess: "Assess: monitor and echo",
  decide: "Decide management",
  plan: "Window and trajectory",
  needle: "Needle and confirmation",
  drain: "Drain and recover",
  debrief: "Debrief",
};

const MANAGEMENT_OPTIONS: Management[] = ["pericardiocentesis", "observe", "surgical-drainage", "ct-guided-drainage", "emergency-surgery", "controlled-aspiration"];
const CHAMBERS: Structure[] = ["rv", "lv", "ra"];
/** one pull on the needle syringe, mL */
const SYRINGE_PULL_ML = 20;
/** lab step, s */
const STEP_S = 0.5;
/** seconds from the request until the operator has sealed the perforation (MODEL PARAMETER) */
const SEAL_S = 20;

/** The lesson that teaches each scenario's management decision (opened from the debrief). */
const DECISION_LESSON: Record<PericScenarioId, string> = {
  "pci-perforation": "cm-perforation-pericardiocentesis",
  "from-pci-perforation": "cm-perforation-first-minutes",
  "perforation-unstable": "cm-perforation-first-minutes",
  "perforation-stable-small": "cm-perforation-pericardiocentesis",
  "post-cabg-loculated": "cm-perforation-collateral-cabg",
  malignant: "bed-peri-indications-echo",
  "post-surgical-posterior": "bed-peri-indications-echo",
  "aortic-dissection": "bed-peri-indications-echo",
};

/** A launch for this tab (BedsideLab resolves it from the link). */
export interface PericLaunch {
  scenario: PericScenarioId | null;
  mode: LaunchMode | null;
  /** events the link adds to the tip context for the run */
  events: LabEvent[];
  seq: number;
}

/** The scenario a launch's id names, or null. */
export function pericScenarioFor(id: string | undefined | null): PericScenarioId | null {
  return PERIC_SCENARIOS.some((s) => s.id === id) ? (id as PericScenarioId) : null;
}

/** The case events a launch's comma-separated "events" param names that this lab reports. */
export function launchEvents(param: string | undefined): LabEvent[] {
  const names = (param ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  return names.filter((e): e is LabEvent => (PERIC_CASE_EVENTS as readonly string[]).includes(e));
}

/** The mode a transfer asks the lab to open in (its params.mode), or null. */
function transferMode(t: LabTransfer): LaunchMode | null {
  const m = t.params.mode;
  return m === "guided" || m === "supervised" || m === "independent" || m === "exam" ? m : null;
}

export default function PericardioLab({ launch = null, transfer = null }: { launch?: PericLaunch | null; transfer?: LabTransfer | null }) {
  // the link or transfer this tab mounts with opens it directly (BedsideLab keeps only the newer of the two)
  const [scenarioId, setScenarioId] = useState<PericScenarioId>(transfer ? "from-pci-perforation" : launch?.scenario ?? "pci-perforation");
  const [runKey, setRunKey] = useState(0);
  const [launchMode, setLaunchMode] = useState<LaunchMode | null>(() => (transfer ? transferMode(transfer) : launch?.mode ?? null));
  const [launchEv, setLaunchEv] = useState<LabEvent[]>(() => (transfer ? [] : launch?.events ?? []));
  const [active, setActive] = useState<LabTransfer | null>(transfer);
  const seen = useRef({ launch: launch?.seq ?? -1, transfer: transfer?.seq ?? -1 });

  // a new link or a new patient from another lab starts a new run
  useEffect(() => {
    if (!launch || launch.seq === seen.current.launch) return;
    seen.current.launch = launch.seq;
    if (launch.scenario) setScenarioId(launch.scenario);
    setLaunchMode(launch.mode);
    setLaunchEv(launch.events);
    setActive(null);
    setRunKey((k) => k + 1);
  }, [launch]);
  useEffect(() => {
    if (!transfer || transfer.seq === seen.current.transfer) return;
    seen.current.transfer = transfer.seq;
    setScenarioId("from-pci-perforation");
    setLaunchMode(transferMode(transfer));
    setLaunchEv([]);
    setActive(transfer);
    setRunKey((k) => k + 1);
  }, [transfer]);

  const choose = (id: PericScenarioId) => {
    setScenarioId(id);
    setLaunchMode(null);
    setLaunchEv([]);
    setActive(null);
  };
  return (
    <PericRun
      key={`${scenarioId}-${runKey}`}
      scenarioId={scenarioId}
      runKey={runKey}
      launchMode={launchMode}
      extraEvents={launchEv}
      transfer={scenarioId === "from-pci-perforation" ? active : null}
      onScenario={choose}
      onRestart={() => setRunKey((k) => k + 1)}
    />
  );
}

interface BeatRec {
  t: number;
  insp: number;
  pvc: boolean;
  idx: number;
}

/** The stand-in perforated patient, built once (it advances about a minute of engine time) and restored for each run. */
let standInSnapshot: PatientHandover | null = null;
function standInEngine() {
  if (!standInSnapshot) standInSnapshot = patientHandoverFrom(standInPerforatedEngine());
  const e = engineFromHandover(standInSnapshot);
  e.setPericardialInflow(HANDOVER_LEAK.mlPerS);
  return e;
}

interface EnginePatient {
  eng: EnginePericardium | null;
  /** the patient is the stand-in, not the one handed over */
  standIn: boolean;
  /** a hand-over was offered but could not be read */
  unreadable: boolean;
}

/** The engine-backed patient for a scenario that continues the PCI patient (null otherwise). */
function makeEnginePatient(sc: PericScenario, transfer: LabTransfer | null): EnginePatient {
  if (!sc.engine) return { eng: null, standIn: false, unreadable: false };
  if (transfer?.patient) {
    try {
      return { eng: new EnginePericardium(engineFromHandover(transfer.patient), leakFromTransfer(transfer)), standIn: false, unreadable: false };
    } catch {
      return { eng: new EnginePericardium(standInEngine(), leakFromTransfer(null)), standIn: true, unreadable: true };
    }
  }
  return { eng: new EnginePericardium(standInEngine(), leakFromTransfer(transfer)), standIn: true, unreadable: false };
}

function PericRun({
  scenarioId,
  runKey,
  launchMode,
  extraEvents,
  transfer,
  onScenario,
  onRestart,
}: {
  scenarioId: PericScenarioId;
  runKey: number;
  launchMode: LaunchMode | null;
  extraEvents: LabEvent[];
  transfer: LabTransfer | null;
  onScenario: (id: PericScenarioId) => void;
  onRestart: () => void;
}) {
  const sc = getPericScenario(scenarioId);
  const percutaneous = sc.correct === "pericardiocentesis";
  const perforation = (sc.events ?? []).includes("perforation");

  // the patient on its engine (from-pci-perforation), else the bedside model
  const [patient] = useState(() => makeEnginePatient(sc, transfer));
  const eng = patient.eng;
  /** the effusion the learner sees on arrival, mL (the engine patient's own, else the scenario's) */
  const [arrivalMl] = useState(() => (eng ? eng.volume : sc.initialVolume));
  /** the effusion when the needle plan was committed, mL (null: no needle yet) */
  const [plannedMl, setPlannedMl] = useState<number | null>(null);
  const run = useLabRun("pericardiocentesis", runCaseId("pericardiocentesis", sc.id), launchMode, { runKey, caseName: `Pericardiocentesis: ${sc.title}` });
  const runRef = useRef(run);
  runRef.current = run;
  const guided = run.mode === "guided";

  const [stage, setStage] = useState<Stage>("assess");
  const [volume, setVolumeState] = useState(() => (eng ? eng.volume : sc.initialVolume));
  const [engHaemo, setEngHaemo] = useState<Haemo | null>(() => (eng ? eng.haemo(sc) : null));
  const [labT, setLabT] = useState(0);
  const [sealAt, setSealAt] = useState<number | null>(null);
  const [sealed, setSealed] = useState(() => (eng ? eng.leak.sealed : false));
  const [view, setView] = useState<EchoViewId>("subcostal");
  /** first decision (scored) */
  const [management, setManagement] = useState<Management | null>(null);
  /** current decision on screen */
  const [choice, setChoice] = useState<Management | null>(null);
  const [rationale, setRationale] = useState<number | null>(null);
  const [supportive, setSupportive] = useState<Set<string>>(new Set());
  const [traj, setTraj] = useState<Trajectory | null>(null);
  const [plannedRisk, setPlannedRisk] = useState<"safe" | "caution" | "danger" | null>(null);
  const [depth, setDepth] = useState(0);
  const [aspirateOn, setAspirateOn] = useState(false);
  const [aspWhileAdv, setAspWhileAdv] = useState(false);
  const [entered, setEntered] = useState<Structure[]>([]);
  const [syringe, setSyringe] = useState<Aspirate | null>(null);
  const [saline, setSaline] = useState<{ result: SalineResult; at: number } | null>(null);
  const [salineResult, setSalineResult] = useState<SalineResult | null>(null);
  const [transducing, setTransducing] = useState(false);
  const [pressureChecked, setPressureChecked] = useState(false);
  const [wire, setWire] = useState<"none" | "passed" | "screened">("none");
  const [wireResult, setWireResult] = useState<WireResult | null>(null);
  const [drainPlaced, setDrainPlaced] = useState(false);
  const [dilatedNoCheck, setDilatedNoCheck] = useState(false);
  const [dilatedChamber, setDilatedChamber] = useState(false);
  const [drainedMl, setDrainedMl] = useState(0);
  const [drainOutput, setDrainOutput] = useState(0);
  const [firstDrainAt, setFirstDrainAt] = useState<number | null>(null);
  const [echoRepeated, setEchoRepeated] = useState(false);
  const [fluidSent, setFluidSent] = useState(false);
  const [log, setLog] = useState<LogEntry[]>(() =>
    patient.unreadable ? [{ t: Date.now(), text: "The hand-over could not be read; continuing on a stand-in patient.", tone: "warn" }] : []
  );
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [nums, setNums] = useState({ hr: 0, sys: 0, dia: 0, map: 0 });
  const [patientEv, setPatientEv] = useState<LabEvent[]>([]);

  const volumeRef = useRef(volume);
  const setVolume = (v: number) => {
    volumeRef.current = v;
    setVolumeState(v);
  };
  const haemo = useMemo(() => engHaemo ?? haemodynamics(volume, sc), [engHaemo, volume, sc]);
  const haemoRef = useRef<Haemo>(haemo);
  haemoRef.current = haemo;
  const pockets = useMemo(() => pocketDepths(volume, sc), [volume, sc]);
  /** the drain keeps taking the blood that re-accumulates (the new perforation scenarios; the original keeps re-accumulating) */
  const drainKeepsDraining = !!sc.engine || sc.leakStopMmHg !== undefined;
  /** the perforation can be sealed by the primary operator (every perforation except the one to observe) */
  const canSeal = perforation && sc.correct !== "observe";
  const echoHere = echoAvailable(sc, labT);

  const addLog = useCallback((text: string, tone: Tone = "plain") => setLog((l) => [...l, { t: Date.now(), text, tone }].slice(-80)), []);

  /** Bring the screen in line with the engine after anything changed it. */
  const syncEngine = useCallback(() => {
    if (!eng) return;
    volumeRef.current = eng.volume;
    setVolumeState(eng.volume);
    const h = eng.haemo(sc);
    haemoRef.current = h;
    setEngHaemo(h);
  }, [eng, sc]);

  /** Take up to `ml` out of the pericardium (needle or drain); returns what came out. */
  const removeFluid = (ml: number): number => {
    let removed: number;
    if (eng) {
      removed = eng.drain(ml);
      syncEngine();
    } else {
      const r = drain(volumeRef.current, ml);
      setVolume(r.volume);
      removed = r.removed;
    }
    if (removed > 0 && firstDrainAt === null) setFirstDrainAt(simT.current);
    return removed;
  };

  // --- current needle position ---------------------------------------------------
  const path = useMemo(() => (traj ? needlePath(traj, pockets) : null), [traj, pockets]);
  const needleIn = stage === "needle" && depth > 0 && !drainPlaced;
  const tip: Structure | null = drainPlaced ? "effusion" : path && depth > 0 ? structureAt(path, depth) : null;
  const tipRef = useRef<Structure | null>(tip);
  tipRef.current = tip;
  const transRef = useRef(transducing);
  transRef.current = transducing && tip !== null;

  // --- monitor source --------------------------------------------------------------
  const clockRef = useRef<EchoClock>({ phase: 0, beat: 0, insp: 0 });
  const sim = useRef({ t: 0, beats: [] as BeatRec[], nextBeat: 0.2, idx: 0, nextPvc: false });
  const sourceRef = useRef<MonitorSource | null>(null);
  if (!sourceRef.current) {
    sourceRef.current = {
      advance: (dt) => {
        const st = sim.current;
        st.t += dt;
        const h = haemoRef.current;
        const ectopy = provokesEctopy(tipRef.current);
        const rate = Math.max(20, h.hr);
        while (st.nextBeat <= st.t) {
          const bt = st.nextBeat;
          const pvc = st.nextPvc;
          st.beats.push({ t: bt, insp: inspiration(bt), pvc, idx: st.idx++ });
          // needle contact with the heart provokes ventricular ectopics: an early beat then a compensatory pause
          const nextPvc = ectopy && !pvc && st.idx % 3 === 2;
          st.nextBeat = bt + (60 / rate) * (nextPvc ? 0.72 : pvc ? 1.28 : 1);
          st.nextPvc = nextPvc;
        }
        while (st.beats.length > 40) st.beats.shift();
        const last = st.beats[st.beats.length - 1];
        if (last) clockRef.current = { phase: Math.min(0.999, ((st.t - last.t) * rate) / 60), beat: last.idx, insp: inspiration(st.t) };
        return st.t;
      },
      sample: (_t0, t1) => {
        const st = sim.current;
        const h = haemoRef.current;
        return [ecgAt(st.beats, t1, h), artAt(st.beats, t1, h), inspiration(t1), transRef.current && tipRef.current ? needleP(st.beats, t1, h, tipRef.current) : NaN];
      },
    };
  }

  // --- lab clock: leak, sealing, drain output, echo arrival, patient events ----------
  const simT = useRef(0);
  const live = useRef({ stage, sealAt, sealed, drainPlaced });
  live.current = { stage, sealAt, sealed, drainPlaced };
  const severeSince = useRef<number | null>(null);
  const adapter = useMemo(() => new PatientEventAdapter(), []);
  const evKey = useRef("");

  /** Advance the patient by dt seconds of lab time. */
  const advanceLab = (dt: number) => {
    const L = live.current;
    if (L.stage === "debrief") return;
    const t0 = simT.current;
    const t = t0 + dt;
    simT.current = t;
    let isSealed = L.sealed;
    if (L.sealAt !== null && !isSealed && t - L.sealAt >= SEAL_S) {
      isSealed = true;
      live.current.sealed = true;
      eng?.seal();
      setSealed(true);
      addLog("The perforation is sealed (prolonged balloon inflation, then a covered stent). Bleeding into the pericardium stops.", "good");
    }
    // the leak, and with a drain in, the drain output while the hole is open
    const before = eng ? eng.volume : volumeRef.current;
    if (eng) eng.step(dt);
    else if (sc.bleedRate > 0 && !isSealed) setVolume(accumulateCoupled(volumeRef.current, dt, sc, false));
    const after = eng ? eng.volume : volumeRef.current;
    if (drainKeepsDraining && L.drainPlaced && after > before) {
      const out = eng ? eng.drain(after - before) : drain(volumeRef.current, after - before).removed;
      if (!eng) setVolume(volumeRef.current - out);
      if (out > 0) setDrainOutput((x) => x + out);
    }
    if (eng) syncEngine();
    if (sc.echoAfterS && t0 < sc.echoAfterS && t >= sc.echoAfterS) addLog("The echo machine has arrived.", "info");
    const h = eng ? eng.haemo(sc) : haemodynamics(volumeRef.current, sc);
    if (h.severity >= 0.95) {
      if (severeSince.current === null) severeSince.current = t;
      else if (t - severeSince.current > 45) {
        severeSince.current = t;
        addLog(guided ? "Peri-arrest: profound hypotension. Drain now; call for help." : "Peri-arrest: profound hypotension.", "danger");
      }
    } else severeSince.current = null;
    // patient events from the shared adapter (hypotension with its hold, tamponade, an effusion on echo)
    const ev = adapter.update(pericardioVitals(t, h, eng ? eng.volume : volumeRef.current), { echo: echoAvailable(sc, t) });
    const k = ev.join(",");
    if (k !== evKey.current) {
      evKey.current = k;
      setPatientEv(ev);
    }
    setLabT(t);
  };
  const advanceRef = useRef(advanceLab);
  advanceRef.current = advanceLab;

  useEffect(() => {
    const id = window.setInterval(() => {
      advanceRef.current(STEP_S);
      // numerics from the live beats
      const st = sim.current;
      let sys = 0;
      let dia = 999;
      let sum = 0;
      let n = 0;
      for (let x = st.t - 4; x <= st.t; x += 0.02) {
        const p = artAt(st.beats, x, haemoRef.current);
        if (Number.isNaN(p)) continue;
        sys = Math.max(sys, p);
        dia = Math.min(dia, p);
        sum += p;
        n++;
      }
      setNums({ hr: haemoRef.current.hr, sys: Math.round(sys), dia: Math.round(dia === 999 ? 0 : dia), map: n ? Math.round(sum / n) : 0 });
    }, STEP_S * 1000);
    return () => window.clearInterval(id);
  }, []);

  // record structures the tip enters as the pocket changes under it
  const lastTip = useRef<Structure | null>(null);
  useEffect(() => {
    if (!tip || drainPlaced) {
      lastTip.current = tip;
      return;
    }
    if (tip !== lastTip.current) {
      setEntered((e) => (e.includes(tip) ? e : [...e, tip]));
      if (lastTip.current !== null) {
        const msg = enterMessage(tip, sc.heparinised, guided);
        if (msg) addLog(msg.text, msg.tone);
      }
      if (tip === "effusion" && aspirateOn) {
        setAspWhileAdv(true);
        setSyringe(aspirate("effusion", sc));
      } else if (aspirateOn && tip !== "tissue") setSyringe(aspirate(tip, sc));
    }
    lastTip.current = tip;
  }, [tip, aspirateOn, drainPlaced, addLog, sc, guided]);

  // --- tips ------------------------------------------------------------------------------
  const caseEvents = useMemo(() => [...new Set<LabEvent>([...(sc.events ?? []), ...(transfer?.events ?? []), ...extraEvents])], [sc, transfer, extraEvents]);
  const context = useMemo(() => pericardioTipContext(stage, { events: [...caseEvents, ...patientEv], echo: echoHere }), [stage, caseEvents, patientEv, echoHere]);
  const { tips, visible } = useContextTips(context, run);
  const contextRef = useRef(context);
  contextRef.current = context;

  // DEV: window.__lab.pericardio
  const stateRef = useRef<() => unknown>(() => null);
  stateRef.current = () => {
    const h = eng ? eng.haemo(sc) : haemodynamics(volumeRef.current, sc);
    return {
    scenario: sc.id,
    stage: live.current.stage,
    engine: !!eng,
    t: simT.current,
    pericardialMl: Math.round((eng ? eng.volume : volumeRef.current) * 10) / 10,
    map: h.map,
    hr: h.hr,
    ppc: h.ppc,
    sealed: live.current.sealed,
    drainPlaced,
    drainedMl: Math.round(drainedMl),
    drainOutputMl: Math.round(drainOutput),
    echo: echoAvailable(sc, simT.current),
    mode: runRef.current.mode,
    };
  };
  useEffect(
    () =>
      registerLabHook("pericardio", {
        context: () => contextRef.current,
        tips: () => selectTips(loadedTips(), contextRef.current, runRef.current.run).map((t) => t.id),
        state: () => stateRef.current(),
        events: () => contextRef.current?.events ?? [],
        step: (seconds: number, dt = STEP_S) => {
          let left = Math.max(0, seconds);
          while (left > 1e-9) {
            const h = Math.min(dt, left);
            advanceRef.current(h);
            left -= h;
          }
        },
      }),
    []
  );

  // --- actions ------------------------------------------------------------------------
  const decide = (m: Management) => {
    if (management === null) {
      setManagement(m);
      const right = isCorrectManagement(sc, m);
      run.decide({
        id: "management",
        stage: "decide",
        label: "Management",
        correct: right,
        expected: [sc.correct, ...(sc.alsoCorrect ?? [])].map((x) => MANAGEMENT_LABEL[x]).join(" or "),
        given: MANAGEMENT_LABEL[m],
        lessonId: DECISION_LESSON[sc.id],
      });
    }
    setChoice(m);
    const right = isCorrectManagement(sc, m) || sc.acceptable.includes(m);
    // outside guided practice the decision is logged without a verdict or a hint
    addLog(`Decision: ${MANAGEMENT_LABEL[m]}.`, guided ? (right ? "good" : "warn") : "plain");
    if (m === "pericardiocentesis") {
      if (!percutaneous && guided) addLog("Proceeding with a needle. Look carefully at the pocket at each window before committing.", "warn");
      setStage("plan");
    }
  };

  const startNeedle = () => {
    if (!traj || !path) return;
    const risk = trajectoryRisk(path);
    setPlannedRisk(risk);
    // the window is scored on the pockets on screen when the plan was committed
    setPlannedMl(eng ? eng.volume : volumeRef.current);
    setStage("needle");
    setDepth(0);
    addLog(`${WINDOW_INFO[traj.window].label} approach: ${traj.angle}° to the skin${traj.window !== "parasternal" ? `, aim ${traj.aim}°` : ""}. Local anaesthetic infiltrated.`, "info");
  };

  const moveNeedle = (d: number) => {
    if (stage !== "needle" || drainPlaced || wire !== "none" || !path) return;
    const nd = Math.max(0, Math.min(140, depth + d));
    setDepth(nd);
    if (nd === 0) addLog("Needle withdrawn to the skin.", "plain");
  };

  const pullSyringe = () => {
    if (!tip) return;
    const a = aspirate(tip, sc);
    setSyringe(a);
    let removed = 0;
    if (tip === "effusion") {
      removed = removeFluid(SYRINGE_PULL_ML);
      setDrainedMl((x) => x + removed);
    }
    const line = aspirateLogLine(tip, a, removed, guided);
    addLog(line.text, line.tone);
  };

  const doSaline = () => {
    if (!tip) return;
    const r = salineCheck(tip);
    setSaline({ result: r, at: performance.now() });
    setSalineResult(r);
    if (r === "pericardial" || r === "rv" || r === "lv" || r === "ra") {
      const w = traj?.window;
      if (w) setView(w === "subxiphoid" ? "subcostal" : w === "apical" ? "apical" : "plax");
    }
    addLog(`Agitated saline: ${SALINE_TEXT[r]}`, r === "pericardial" ? "good" : r === "none" ? "warn" : "danger");
  };

  const toggleTransduce = () => {
    const on = !transducing;
    setTransducing(on);
    if (on && tip) {
      setPressureChecked(true);
      const h = haemoRef.current;
      if (guided)
        addLog(
          tip === "effusion"
            ? `Pressure through the needle: low and barely pulsatile, about ${Math.round(h.ppc)} mmHg, matching the RA pressure: pericardial.`
            : CHAMBERS.includes(tip)
            ? `Pressure through the needle is a ${tip === "lv" ? "systemic ventricular" : tip === "rv" ? "right ventricular" : "right atrial"} waveform: you are in a cardiac chamber.`
            : "No meaningful pressure waveform: the needle is not in a fluid space.",
          tip === "effusion" ? "good" : CHAMBERS.includes(tip) ? "danger" : "warn"
        );
      else addLog("Needle transduced: read the waveform on the monitor.", "plain");
    }
  };

  const passWire = () => {
    if (!tip || wire !== "none") return;
    const r = wireCheck(tip);
    setWire("passed");
    setWireResult(r);
    addLog("J-wire passed through the needle; the needle is removed over the wire.", "plain");
  };

  const screenWire = () => {
    if (wire !== "passed" || !wireResult) return;
    setWire("screened");
    addLog(`Fluoroscopy: ${WIRE_TEXT[wireResult]}`, wireResult === "wraps" ? "good" : "danger");
  };

  const withdrawWire = () => {
    setWire("none");
    setWireResult(null);
    addLog("Wire withdrawn; needle repositioned.", "plain");
  };

  const dilate = () => {
    if (wire === "none" || !wireResult) return;
    if (wire === "passed") setDilatedNoCheck(true);
    run.decide({
      id: "wire-confirmed",
      stage: "needle",
      label: "Wire course confirmed before dilating",
      correct: wire === "screened" && wireResult === "wraps",
      expected: "A J-wire curling round the heart border outside the chambers, seen before dilating",
      given: wire === "screened" ? WIRE_TEXT[wireResult] : "Dilated without screening the wire",
      lessonId: "cm-perforation-pericardiocentesis",
      tipIds: ["bed-peri-confirm-wire"],
    });
    if (wireResult === "wraps") {
      setDrainPlaced(true);
      live.current.drainPlaced = true;
      setTransducing(true);
      setStage("drain");
      addLog(`Tract dilated and a pigtail drain placed in the pericardial space${wire === "passed" ? " (the wire course was not checked first)" : ""}.`, wire === "passed" ? "warn" : "good");
    } else if (wireResult === "rvot-pa" || wireResult === "lv-aorta" || wireResult === "ra-cava") {
      setDilatedChamber(true);
      if (eng) {
        eng.bleed(150);
        eng.step(1);
        syncEngine();
      } else setVolume(volumeRef.current + 150);
      addLog("The dilator has been passed into a cardiac chamber. Leave it in place, call the cardiac surgeons immediately and prepare for emergency surgery.", "danger");
      finish({ dilatedIntoChamber: true });
    } else {
      addLog("The dilator and drain are outside the pericardium: nothing drains. Remove and start again.", "danger");
      setWire("none");
      setWireResult(null);
    }
  };

  const drainAliquot = () => {
    const ml = sc.id === "aortic-dissection" ? 20 : 50;
    const removed = removeFluid(ml);
    const total = drainedMl + removed;
    setDrainedMl(total);
    setSyringe(aspirate("effusion", sc));
    const h = eng ? eng.haemo(sc) : haemodynamics(volumeRef.current, sc);
    addLog(`Drained ${Math.round(removed)} mL (total ${Math.round(total)} mL). Pericardial pressure ${h.ppc} mmHg, BP ${h.sbp}/${h.dbp}.`, h.tamponade ? "plain" : "good");
    if (sc.id === "malignant" && total > 1000 && total - removed <= 1000)
      addLog("You have drained more than 1 L. Many centres stop here and drain the rest in stages to reduce the risk of pericardial decompression syndrome.", "warn");
    if (sc.id === "aortic-dissection" && h.severity < 0.3)
      addLog("The blood pressure is rising toward normal. In dissection this risks extension or rupture: aspirate only enough for a minimal perfusing pressure until the surgeons take over.", "danger");
  };

  const repeatEcho = () => {
    if (!echoHere) return;
    setEchoRepeated(true);
    const p = pocketDepths(eng ? eng.volume : volumeRef.current, sc);
    const mm = Math.max(p.subxiphoid, p.apical, p.parasternal, p.posterior);
    const h = haemoRef.current;
    addLog(
      `Repeat echo: ${effusionSize(mm) === "none" ? "no effusion" : `${effusionSize(mm)} effusion, ${Math.round(mm)} mm`}${h.rvCollapse ? ", RV diastolic collapse" : h.raCollapse ? ", RA systolic collapse" : ""}.`,
      "info"
    );
  };

  const autotransfuse = () =>
    addLog("Autotransfusion of the drained blood: Brilakis lists it as an option to consider; neither manual describes how, so follow local practice.", "info");

  const requestSeal = () => {
    if (sealAt !== null) return;
    setSealAt(simT.current);
    live.current.sealAt = simT.current;
    addLog("You ask the primary operator to seal the perforation: a balloon is inflated at the perforation site while a covered stent is prepared; heparin reversal is considered.", "info");
  };

  const finish = (over: Partial<{ dilatedIntoChamber: boolean }> = {}) => {
    const h = eng ? eng.haemo(sc) : haemodynamics(volumeRef.current, sc);
    const into = over.dilatedIntoChamber ?? dilatedChamber;
    const res = scorePericardiocentesis({
      scenarioId: sc.id,
      management,
      rationaleCorrect: sc.rationale ? rationale === sc.rationale.correct : null,
      supportiveCorrect: SUPPORTIVE_OPTIONS.filter((o) => o.good && supportive.has(o.id)).length,
      supportiveWrong: SUPPORTIVE_OPTIONS.filter((o) => !o.good && supportive.has(o.id)).length,
      window: traj?.window ?? null,
      plannedRisk,
      structuresEntered: entered,
      aspiratedWhileAdvancing: aspWhileAdv,
      salineResult,
      pressureChecked,
      wireResult: wire === "screened" ? wireResult : null,
      dilatedWithoutWireCheck: dilatedNoCheck,
      dilatedIntoChamber: into,
      drainPlaced,
      drainedMl,
      finalPpc: h.ppc,
      finalSeverity: h.severity,
      bleedSealRequested: sealAt !== null,
      stagedDrainage: drainedMl <= 1000,
      fluidSent,
      echoRepeated,
      secondsToDrain: firstDrainAt,
      initialMl: plannedMl ?? arrivalMl,
    });
    if (perforation && percutaneous && drainPlaced && sc.id !== "pci-perforation")
      run.decide({
        id: "re-imaged",
        stage: "drain",
        label: "Echo repeated after drainage",
        correct: echoRepeated,
        expected: "Repeat the echo straight after drainage, then serially",
        given: echoRepeated ? "Repeated" : "Not repeated",
        lessonId: "cm-perforation-pericardiocentesis",
        tipIds: ["bed-peri-drain-stays"],
      });
    setResult(res);
    setStage("debrief");
    run.finish({
      score: res.score,
      passed: res.score >= PASS_SCORE.default && !into,
      criticalErrors: into ? 1 : 0,
      complications: Array.from(new Set(entered.filter((x) => x !== "tissue" && x !== "effusion"))).map((x) => STRUCTURE_LABEL[x]),
      metrics: { drainedMl: Math.round(drainedMl), drainOutputMl: Math.round(drainOutput), finalPpc: h.ppc, ...(firstDrainAt !== null ? { secondsToDrain: Math.round(firstDrainAt) } : {}) },
      durationS: Math.round(simT.current),
    });
    addLog(`Run complete: ${res.score} / 100.`, "info");
  };

  const stageDone = (s: Stage) => STAGES.indexOf(s) < STAGES.indexOf(stage);
  const sizeLabel = effusionSize(Math.max(pockets.subxiphoid, pockets.apical, pockets.parasternal, pockets.posterior));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="stat-label">Scenario</span>
        <select
          value={scenarioId}
          onChange={(e) => onScenario(e.target.value as PericScenarioId)}
          aria-label="Scenario"
          className="field !h-8 text-[13px] w-full sm:w-auto min-w-0 sm:max-w-[320px]"
        >
          {PERIC_SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.short}
            </option>
          ))}
        </select>
        {eng && <span className="chip">{patient.standIn ? "Perforated patient (stand-in)" : "Patient from the PCI lab"}</span>}
        <button className="btn btn-ghost ml-auto" onClick={onRestart}>
          Restart
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem] gap-3">
        <div className="space-y-3 min-w-0">
          {/* Monitor */}
          <div className="panel overflow-hidden">
            <div className="panel-head">
              <span className="flex items-center gap-2">
                <span className="led text-ecg animate-ledpulse" />
                Monitor: II, arterial line, respiration{transducing ? ", needle / drain pressure" : ""}
              </span>
              <span className={`normal-case tracking-normal font-normal ${haemo.tamponade ? "text-danger" : haemo.severity > 0.1 ? "text-warn" : "text-good"}`}>
                {haemo.tamponade ? "Tamponade physiology" : haemo.severity > 0.1 ? "Rising pericardial pressure" : "Haemodynamics normal"}
              </span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_9.5rem]">
              <SweepMonitor
                sourceRef={sourceRef}
                className="h-60"
                channels={[
                  { label: "II", color: "#3ef2a4", min: -0.8, max: 1.4, weight: 1 },
                  { label: "ART mmHg", color: "#ff5d6c", min: 30, max: 150, weight: 1.3, gridLines: [60, 100] },
                  { label: "RESP (insp ↑)", color: "#22d3ee", min: -0.2, max: 1.2, weight: 0.5 },
                  { label: "NEEDLE / DRAIN mmHg", color: "#E9B95A", min: -2, max: 45, weight: transducing ? 0.9 : 0.35, gridLines: [10, 20] },
                ]}
              />
              <div className="border-l border-line divide-y divide-line/70">
                <Readout label="HR" unit="bpm" value={nums.hr} color="text-ecg" blip />
                <Readout label="ABP" unit="mmHg" value={`${nums.sys}/${nums.dia}`} sub={`(${nums.map})`} color="text-art" />
                <Readout label="Pulsus" unit="mmHg" value={haemo.pulsus} color={haemo.pulsus > 10 ? "text-danger" : "text-ink-soft"} />
                <Readout label="CVP" unit="mmHg" value={haemo.ra} color="text-spo2" sub={transducing && tip ? `peri ${Math.round(haemo.ppc)}` : undefined} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Echo */}
            <Panel title={<>Echo</>} right={echoHere ? <span className="text-ink-faint">{sizeLabel} effusion</span> : <span className="text-ink-faint">not in the room</span>}>
              {!echoHere ? (
                <p className="text-[12px] text-ink-faint">The echo machine is on its way. Fluoroscopy is available now.</p>
              ) : (
              <>
              <div className="mb-2">
                <Seg
                  options={[
                    { id: "subcostal", label: "Subcostal" },
                    { id: "apical", label: "Apical 4C" },
                    { id: "plax", label: "PLAX" },
                    { id: "ivc", label: "IVC" },
                  ]}
                  value={view}
                  onChange={setView}
                />
              </div>
              <EchoView
                view={view}
                clockRef={clockRef}
                haemo={haemo}
                pockets={pockets}
                regional={sc.regional}
                extras={sc.echoExtras}
                saline={saline}
                needle={traj && stage === "needle" && path && path.pericardiumAt !== null ? { window: traj.window, beyondPericardium: depth - path.pericardiumAt } : null}
              />
              <InflowDoppler haemo={haemo} />
              </>
              )}
            </Panel>

            {/* Approach / needle */}
            <Panel title={<>Approach and needle</>} right={traj ? <span className="text-accent">{WINDOW_INFO[traj.window].label}</span> : undefined}>
              {stage === "assess" || stage === "decide" ? (
                <p className="text-[12px] text-ink-faint">Assess the patient and the echo first, then decide whether a needle is the right treatment.</p>
              ) : (
                <>
                  <NeedlePlanner traj={traj} onChange={setTraj} pockets={pockets} disabled={stage !== "plan"} />
                  {path && stage === "plan" && (
                    <div className="mt-2 text-[12px] space-y-1">
                      <div className="stat-label">Along this line on {echoHere ? "echo" : "fluoroscopy"}</div>
                      {echoHere || guided ? (
                        <div className="text-ink-soft">
                          {path.segments
                            .filter((s) => s.structure !== "tissue" || s.from === 0)
                            .slice(0, 6)
                            .map((s) => (s.structure === "effusion" ? `pericardial fluid (${Math.round(s.to - s.from)} mm)` : STRUCTURE_LABEL[s.structure].toLowerCase()))
                            .join(" → ")}
                        </div>
                      ) : (
                        <div className="text-ink-soft">Contrast outlines the sac along the heart border.</div>
                      )}
                      {guided &&
                        path.hazards.map((h, i) => (
                          <div key={i} className={h.severity === "danger" ? "text-danger" : "text-warn"}>
                            • {h.text}
                          </div>
                        ))}
                      {guided && path.hazards.length === 0 && <div className="text-good">• Clear path to the pocket.</div>}
                      {guided && traj && <p className="text-ink-faint">{WINDOW_INFO[traj.window].teach}</p>}
                    </div>
                  )}
                  {(stage === "needle" || stage === "drain") && (
                    <NeedleConsole
                      depth={depth}
                      pericardiumAt={path?.pericardiumAt ?? null}
                      tip={tip}
                      syringe={syringe}
                      aspirateOn={aspirateOn}
                      setAspirateOn={setAspirateOn}
                      onMove={moveNeedle}
                      onPull={pullSyringe}
                      locked={drainPlaced || wire !== "none"}
                      showTip={stage === "needle" && guided}
                      showDetail={guided}
                    />
                  )}
                </>
              )}
              {((sc.contrastSac && stage !== "debrief") || ((stage === "needle" || stage === "drain") && wire !== "none" && wireResult)) && (
                <WireFluoro result={wire === "screened" ? wireResult : null} passed={wire !== "none"} sacMl={sc.contrastSac ? volume : 0} />
              )}
            </Panel>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-3 min-w-0">
          {stage === "debrief" && result ? (
            <Debrief score={result.score} items={result.items} teaching={sc.teaching} onRestart={onRestart} title={`Debrief: ${sc.title}`} />
          ) : (
            <Panel title={<>{sc.title}</>} right={<span className="text-accent">{STAGE_LABEL[stage]}</span>}>
              {stage === "assess" && (
                <div className="space-y-2 text-[12px] text-ink-soft">
                  <p>{sc.vignette}</p>
                  <p className="text-ink-faint">Setting: {sc.setting}.</p>
                  <ul className="space-y-1 text-ink-faint">
                    <li>• Watch the arterial trace against the respiration trace: does systolic pressure fall with inspiration by more than 10 mmHg?</li>
                    <li>• Look at every echo window: where is the fluid, how deep is it, is there RA or RV collapse, is the IVC plethoric?</li>
                    <li>• Compare the pocket depth at the subcostal, apical and parasternal windows.</li>
                  </ul>
                  <button className="btn btn-accent" onClick={() => setStage("decide")}>
                    I have assessed the patient
                  </button>
                </div>
              )}

              {stage === "decide" && (
                <div className="space-y-2 text-[12px]">
                  <p className="text-ink-soft">What is the right treatment?</p>
                  {MANAGEMENT_OPTIONS.map((m) => (
                    <button
                      key={m}
                      className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${choice === m ? "border-accent/60 bg-accent/10 text-ink" : "border-line hover:border-accent/40 text-ink-soft"}`}
                      onClick={() => decide(m)}
                    >
                      {MANAGEMENT_LABEL[m]}
                    </button>
                  ))}
                  {choice && choice !== "pericardiocentesis" && sc.correct === "observe" && choice === "observe" && (
                    <ObserveFollowUp sc={sc} rationale={rationale} setRationale={setRationale} echoHere={echoHere} echoRepeated={echoRepeated} onRepeatEcho={repeatEcho} onSubmit={() => finish()} />
                  )}
                  {choice && choice !== "pericardiocentesis" && !(sc.correct === "observe" && choice === "observe") && (
                    <SurgicalFollowUp
                      sc={sc}
                      management={choice}
                      rationale={rationale}
                      setRationale={setRationale}
                      supportive={supportive}
                      setSupportive={setSupportive}
                      onSubmit={() => finish()}
                      onProceedAnyway={percutaneous ? () => setStage("plan") : undefined}
                    />
                  )}
                  {choice && choice !== "pericardiocentesis" && canSeal && <SealButton sealAt={sealAt} sealed={sealed} onSeal={requestSeal} />}
                </div>
              )}

              {stage === "plan" && (
                <div className="space-y-2 text-[12px] text-ink-soft">
                  <p>
                    Pick the window on the chest diagram, drag from the entry point to aim, and set the angle to the skin.{" "}
                    {echoHere
                      ? "Echo-guided: aim along the line that shows the largest pocket closest to the skin with nothing in the way."
                      : "No echo yet: the leaked contrast outlines the sac on fluoroscopy, so set the direction from the screen."}
                  </p>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    {(["subxiphoid", "apical", "parasternal"] as const).map((w) => (
                      <div key={w} className="rounded border border-line p-1.5 bg-base-800/60">
                        <div className="stat-label">{WINDOW_INFO[w].label}</div>
                        <div className="metric text-ink text-base">{echoHere ? `${Math.round(pockets[w])} mm` : "–"}</div>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-accent" disabled={!traj} onClick={startNeedle}>
                    Start the needle
                  </button>
                  {!percutaneous && (
                    <button className="btn btn-ghost" onClick={() => setStage("decide")}>
                      Abandon: reconsider management
                    </button>
                  )}
                </div>
              )}

              {stage === "needle" && (
                <div className="space-y-2 text-[12px] text-ink-soft">
                  <p>Advance slowly with gentle aspiration. Once fluid comes back, confirm the position before you dilate anything.</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button className="btn" onClick={doSaline} disabled={!needleIn || wire !== "none" || !echoHere} title={echoHere ? undefined : "Needs echo"}>
                      Agitated saline
                    </button>
                    <button className={`btn ${transducing ? "btn-accent" : ""}`} onClick={toggleTransduce} disabled={!tip}>
                      {transducing ? "Transducing" : "Transduce needle"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button className="btn" onClick={passWire} disabled={!needleIn || wire !== "none"}>
                      Pass J-wire
                    </button>
                    <button className="btn" onClick={screenWire} disabled={wire !== "passed"}>
                      Screen the wire
                    </button>
                    <button className="btn btn-ghost" onClick={withdrawWire} disabled={wire === "none"}>
                      Withdraw wire
                    </button>
                  </div>
                  <button className="btn btn-accent" onClick={dilate} disabled={wire === "none"}>
                    Dilate and place pigtail drain
                  </button>
                  {canSeal && <SealButton sealAt={sealAt} sealed={sealed} onSeal={requestSeal} />}
                  {!percutaneous && (
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setDepth(0);
                        setStage("decide");
                        addLog("Needle withdrawn; management reconsidered.", "info");
                      }}
                    >
                      Withdraw and reconsider
                    </button>
                  )}
                </div>
              )}

              {stage === "drain" && (
                <div className="space-y-2 text-[12px] text-ink-soft">
                  <p>
                    Drain is in. Pericardial pressure <span className="text-ink font-mono">{haemo.ppc} mmHg</span>
                    {guided && (
                      <>
                        , effusion about <span className="text-ink font-mono">{Math.round(volume)} mL</span>
                      </>
                    )}
                    , aspirated <span className="text-ink font-mono">{Math.round(drainedMl)} mL</span>.
                  </p>
                  {drainKeepsDraining ? (
                    <p>
                      Drain output since it was placed: <span className="text-ink font-mono">{Math.round(drainOutput)} mL</span>
                      {!sealed && drainOutput > 0 ? <span className="text-warn"> and still rising: the source is not sealed.</span> : null}
                    </p>
                  ) : null}
                  {sc.id === "pci-perforation" && !sealed && drainedMl > 0 && <p className="text-warn">Blood keeps re-accumulating while the perforation is open.</p>}
                  <button className="btn btn-accent" onClick={drainAliquot} disabled={volume <= 6}>
                    Aspirate {sc.id === "aortic-dissection" ? "20" : "50"} mL
                  </button>
                  <div className="flex flex-wrap gap-1.5">
                    <button className="btn" onClick={repeatEcho} disabled={!echoHere} title={echoHere ? undefined : "The echo machine is not here yet"}>
                      Repeat the echo
                    </button>
                    {perforation && (
                      <button className="btn btn-ghost" onClick={autotransfuse}>
                        Autotransfusion (local practice)
                      </button>
                    )}
                  </div>
                  {canSeal && <SealButton sealAt={sealAt} sealed={sealed} onSeal={requestSeal} />}
                  {sc.id === "malignant" && (
                    <button className="btn" onClick={() => { setFluidSent(true); addLog("Fluid sent for cytology, microbiology and biochemistry.", "good"); }} disabled={fluidSent}>
                      Send fluid for analysis
                    </button>
                  )}
                  <button className="btn btn-good" onClick={() => finish()}>
                    Secure the drain and finish
                  </button>
                </div>
              )}
            </Panel>
          )}

          {stage !== "debrief" && <LabTipsPanel tips={tips} visible={visible} mode={run.mode} onAskHelp={() => run.askHelp(simT.current)} events={context?.events ?? []} />}

          <Panel title={<>Steps</>}>
            <StepTracker steps={STAGES} labels={STAGE_LABEL} current={stage} done={stageDone} />
          </Panel>

          <LogPanel log={log} />
        </div>
      </div>
    </div>
  );
}

// --- sub-components --------------------------------------------------------------------

function SealButton({ sealAt, sealed, onSeal }: { sealAt: number | null; sealed: boolean; onSeal: () => void }) {
  return (
    <div>
      <button className="btn" onClick={onSeal} disabled={sealAt !== null}>
        {sealed ? "Perforation sealed" : sealAt !== null ? "Sealing the perforation…" : "Ask the operator to seal the perforation"}
      </button>
      <p className="text-[12px] text-ink-faint mt-1">Teaching note: drainage buys time; the bleeding has to be stopped at its source.</p>
    </div>
  );
}

function ObserveFollowUp({
  sc,
  rationale,
  setRationale,
  echoHere,
  echoRepeated,
  onRepeatEcho,
  onSubmit,
}: {
  sc: PericScenario;
  rationale: number | null;
  setRationale: (n: number) => void;
  echoHere: boolean;
  echoRepeated: boolean;
  onRepeatEcho: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-md border border-line p-2.5 space-y-2 bg-base-800/60">
      {sc.rationale && (
        <div className="space-y-1">
          <div className="stat-label">{sc.rationale.question}</div>
          {sc.rationale.options.map((o, i) => (
            <label key={i} className="flex gap-2 text-ink-soft">
              <input type="radio" name="rationale" checked={rationale === i} onChange={() => setRationale(i)} />
              <span>{o}</span>
            </label>
          ))}
        </div>
      )}
      <p className="text-ink-soft">Watch the monitor while you wait. If the pressure falls, reconsider.</p>
      <div className="flex flex-wrap gap-1.5">
        <button className="btn" onClick={onRepeatEcho} disabled={!echoHere}>
          {echoRepeated ? "Repeat the echo again" : "Repeat the echo"}
        </button>
        <button className="btn btn-accent" onClick={onSubmit} disabled={sc.rationale ? rationale === null : false}>
          Submit decision
        </button>
      </div>
    </div>
  );
}

function SurgicalFollowUp({
  sc,
  management,
  rationale,
  setRationale,
  supportive,
  setSupportive,
  onSubmit,
  onProceedAnyway,
}: {
  sc: ReturnType<typeof getPericScenario>;
  management: Management;
  rationale: number | null;
  setRationale: (n: number) => void;
  supportive: Set<string>;
  setSupportive: (s: Set<string>) => void;
  onSubmit: () => void;
  onProceedAnyway?: () => void;
}) {
  if (onProceedAnyway) {
    return (
      <div className="rounded-md border border-warn/40 bg-warn/5 p-2.5 space-y-2">
        <p className="text-warn">
          {management === "observe"
            ? "This patient is in tamponade; observation risks arrest."
            : management === "controlled-aspiration"
            ? "There is no reason to limit drainage here: the effusion needs full drainage with a drain left in."
            : "There is a drainable effusion and the patient is compromised; percutaneous drainage is the treatment here."}
        </p>
        <button className="btn btn-accent" onClick={onProceedAnyway}>
          Proceed to pericardiocentesis
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-line p-2.5 space-y-2 bg-base-800/60">
      {sc.rationale && (
        <div className="space-y-1">
          <div className="stat-label">{sc.rationale.question}</div>
          {sc.rationale.options.map((o, i) => (
            <label key={i} className="flex gap-2 text-ink-soft">
              <input type="radio" name="rationale" checked={rationale === i} onChange={() => setRationale(i)} />
              <span>{o}</span>
            </label>
          ))}
        </div>
      )}
      <div className="space-y-1">
        <div className="stat-label">While waiting for the surgeons (choose all that apply)</div>
        {SUPPORTIVE_OPTIONS.map((o) => (
          <label key={o.id} className="flex gap-2 text-ink-soft">
            <input
              type="checkbox"
              checked={supportive.has(o.id)}
              onChange={(e) => {
                const n = new Set(supportive);
                if (e.target.checked) n.add(o.id);
                else n.delete(o.id);
                setSupportive(n);
              }}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
      <button className="btn btn-accent" onClick={onSubmit} disabled={sc.rationale ? rationale === null : false}>
        Submit decision
      </button>
    </div>
  );
}

function NeedleConsole({
  depth,
  pericardiumAt,
  tip,
  syringe,
  aspirateOn,
  setAspirateOn,
  onMove,
  onPull,
  locked,
  showTip,
  showDetail = true,
}: {
  depth: number;
  pericardiumAt: number | null;
  tip: Structure | null;
  syringe: Aspirate | null;
  aspirateOn: boolean;
  setAspirateOn: (b: boolean) => void;
  onMove: (d: number) => void;
  onPull: () => void;
  locked: boolean;
  showTip: boolean;
  /** the meaning of the aspirate (guided practice only) */
  showDetail?: boolean;
}) {
  const drag = useRef(false);
  const acc = useRef(0);
  const fill = syringe && syringe.colour !== "transparent" ? syringe.colour : null;
  return (
    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_5.5rem] gap-3">
      <div className="space-y-2">
        <div
          className={`relative h-10 rounded border border-line bg-base-800 overflow-hidden ${locked ? "opacity-50" : "cursor-ew-resize touch-none"}`}
          onPointerDown={(e) => {
            if (locked) return;
            drag.current = true;
            (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            acc.current += e.movementX;
            while (acc.current > 6) {
              acc.current -= 6;
              onMove(1);
            }
            while (acc.current < -6) {
              acc.current += 6;
              onMove(-1);
            }
          }}
          onPointerUp={() => (drag.current = false)}
          onPointerCancel={() => (drag.current = false)}
        >
          {pericardiumAt !== null && <div className="absolute top-0 bottom-0 border-l border-dashed border-danger/50" style={{ left: `${(pericardiumAt / 140) * 100}%` }} />}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-ink-soft rounded-r" style={{ width: `${(depth / 140) * 100}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white" style={{ left: `calc(${(depth / 140) * 100}% - 6px)` }} />
          <span className="absolute right-2 top-1 text-[12px] font-mono text-ink-faint">{Math.round(depth)} mm</span>
          <span className="absolute left-2 bottom-1 text-[12px] text-ink-faint">drag → advance</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button className="btn" disabled={locked} onClick={() => onMove(-2)}>
            ◀ 2 mm
          </button>
          <button className="btn" disabled={locked} onClick={() => onMove(2)}>
            2 mm ▶
          </button>
          <label className="flex items-center gap-1.5 text-[12px] text-ink-soft ml-1">
            <input type="checkbox" checked={aspirateOn} onChange={(e) => setAspirateOn(e.target.checked)} /> aspirate while advancing
          </label>
          <button className="btn" onClick={onPull} disabled={!tip || locked}>
            Pull back syringe
          </button>
        </div>
        {showTip && tip && (
          <div className="text-[12px] text-ink-faint">
            Tip (instructor view): <span className={tip === "effusion" ? "text-good" : tip === "tissue" ? "text-ink-soft" : "text-danger"}>{STRUCTURE_LABEL[tip]}</span>
          </div>
        )}
        {syringe && (
          <div className="text-[12px]">
            <span className="text-ink">{syringe.label}.</span> {showDetail && <span className="text-ink-soft">{syringe.detail}</span>}
          </div>
        )}
      </div>
      <svg viewBox="0 0 60 120" className="w-full">
        <rect x={18} y={6} width={24} height={86} rx={3} fill="#15181C" stroke="#5b6b7d" />
        {fill && <rect x={19} y={30} width={22} height={61} fill={fill} opacity={0.85} />}
        {syringe?.air && [40, 55, 70].map((y) => <circle key={y} cx={30} cy={y} r={3} fill="#e2e8f0" opacity={0.8} />)}
        <rect x={22} y={0} width={16} height={30} fill="#2E343C" />
        <rect x={27} y={92} width={6} height={10} fill="#5b6b7d" />
        <line x1={30} y1={102} x2={30} y2={120} stroke="#cbd5e1" strokeWidth={2} />
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i} x1={18} x2={24} y1={20 + i * 12} y2={20 + i * 12} stroke="#858D99" />
        ))}
      </svg>
    </div>
  );
}

function WireFluoro({ result, passed = true, sacMl = 0 }: { result: WireResult | null; passed?: boolean; sacMl?: number }) {
  // AP fluoroscopy (schematic): the leaked contrast outlining the pericardial sac when there is one
  // (its rim widens with the volume; MODEL), and the wire course once screened. Before screening,
  // the wire is not shown.
  const rim = sacMl > 0 ? Math.max(2, Math.min(14, Math.sqrt(sacMl) * 0.8)) : 0;
  const course: Record<WireResult, string> = {
    wraps: "M118 214 Q150 206 186 196 Q214 180 208 140 Q200 104 170 88 Q146 80 128 90",
    "rvot-pa": "M118 214 Q140 196 150 176 Q156 150 150 124 Q146 104 160 92 Q178 86 196 92",
    "lv-aorta": "M118 214 Q170 200 190 176 Q176 140 152 112 Q140 92 132 70 Q130 50 150 40",
    "ra-cava": "M118 214 Q118 190 108 168 Q100 140 104 110 Q106 80 104 40",
    extracardiac: "M118 214 Q132 222 150 226 Q170 230 186 224",
  };
  return (
    <div className="mt-3">
      <div className="stat-label mb-1">Fluoroscopy (AP){rim ? ": contrast outlines the pericardial sac" : ""}{passed ? ", wire" : ""}</div>
      <svg viewBox="0 0 300 240" className="w-full max-h-48 block rounded-md border border-line">
        <defs>
          <radialGradient id="wf-bg" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#a9afb6" />
            <stop offset="100%" stopColor="#3a3f45" />
          </radialGradient>
        </defs>
        <rect width="300" height="240" fill="url(#wf-bg)" />
        {rim > 0 && (
          <path d="M118 80 Q96 100 100 150 Q108 196 160 200 Q214 198 222 170 Q228 130 196 100 Q172 78 140 74 Z" fill="none" stroke="#2a2e33" strokeWidth={rim} opacity={0.55} strokeLinejoin="round" />
        )}
        <path d="M118 80 Q96 100 100 150 Q108 196 160 200 Q214 198 222 170 Q228 130 196 100 Q172 78 140 74 Z" fill="#555b62" opacity={0.6} />
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={140} y={4 + i * 24} width={18} height={20} rx={3} fill="#5c6269" opacity={0.4} />
        ))}
        {result ? (
          <path d={course[result]} stroke="#111315" strokeWidth={2} fill="none" strokeLinecap="round" />
        ) : passed ? (
          <text x="150" y="124" textAnchor="middle" fontSize="11" fill="#1d2329">wire passed: screen it to see its course</text>
        ) : null}
      </svg>
    </div>
  );
}

function InflowDoppler({ haemo }: { haemo: Haemo }) {
  // Mitral inflow E velocity over two breaths: inspiratory fall shown as bar height.
  const bars: { x: number; h: number; insp: boolean }[] = [];
  const n = 16;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 6;
    const insp = inspiration(t);
    const h = 40 * (1 - (haemo.mitralVar / 100) * insp);
    bars.push({ x: 8 + i * 17, h, insp: insp > 0.3 });
  }
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <span className="stat-label">Mitral inflow (PW Doppler, E wave)</span>
        <span className={`text-[12px] font-mono ${haemo.mitralVar > 25 ? "text-danger" : "text-ink-soft"}`}>
          variation {haemo.mitralVar}% · tricuspid {haemo.tricuspidVar}%
        </span>
      </div>
      <svg viewBox="0 0 280 54" className="w-full block bg-black rounded border border-line">
        <line x1={0} y1={6} x2={280} y2={6} stroke="#374151" />
        {bars.map((b, i) => (
          <path key={i} d={`M${b.x} 6 L${b.x + 4} ${6 + b.h} L${b.x + 8} 6`} fill={b.insp ? "#9ca3af" : "#e5e7eb"} opacity={0.85} />
        ))}
      </svg>
      <p className="text-[12px] text-ink-faint mt-1">Exaggerated respiratory variation of mitral and tricuspid inflow supports tamponade physiology (mitral variation above about 25% is a commonly quoted marker).</p>
    </div>
  );
}

/**
 * The log line for a pull on the syringe. Outside guided practice it is one neutral line for anything
 * in the syringe, wherever the tip is: after a perforation, blood from the sac and from a chamber read
 * the same (only saline, the pressure and the wire course tell them apart).
 */
export function aspirateLogLine(tip: Structure, a: Aspirate, removedMl: number, guided: boolean): { text: string; tone: Tone } {
  const clotNote = a.clots === "unreliable" ? " Clotting test unreliable (heparin)." : "";
  if (guided) {
    if (tip === "effusion") return { text: `Aspirated ${Math.round(removedMl)} mL through the needle: ${a.label.toLowerCase()}.${clotNote}`, tone: "good" };
    return { text: `Aspirate: ${a.label}. ${a.detail}`, tone: a.colour === "transparent" ? "plain" : CHAMBERS.includes(tip) ? "danger" : "warn" };
  }
  if (a.colour === "transparent") return { text: `Aspirate: ${a.label.toLowerCase()}.`, tone: "plain" };
  return { text: `Aspirated ${tip === "effusion" ? Math.round(removedMl) : SYRINGE_PULL_ML} mL: ${a.label.toLowerCase()}.${clotNote}`, tone: "plain" };
}

function enterMessage(s: Structure, heparinised: boolean, guided = true): { text: string; tone: Tone } | null {
  // outside guided practice only what the operator feels and sees is reported, not where the tip is
  if (!guided) {
    switch (s) {
      case "effusion":
        return { text: "Loss of resistance.", tone: "plain" };
      case "epicardium":
        return { text: "A scratching sensation and ventricular ectopics.", tone: "warn" };
      case "rv":
      case "lv":
        return { text: "Ventricular ectopics on the monitor.", tone: "warn" };
      case "ra":
        return { text: "Atrial ectopics on the monitor.", tone: "warn" };
      case "lung":
        return { text: "The patient coughs.", tone: "warn" };
      case "mammary":
      case "intercostal":
        return { text: "Brisk bright red bleeding at the needle.", tone: "warn" };
      default:
        return null;
    }
  }
  switch (s) {
    case "effusion":
      return { text: "Loss of resistance: the needle tip is in the pericardial fluid.", tone: "good" };
    case "epicardium":
      return { text: "A scratching sensation and ventricular ectopics: the needle is touching the heart. Withdraw slightly.", tone: "danger" };
    case "rv":
      return { text: `Ventricular ectopics and dark blood${heparinised ? "" : " that clots"}: the needle is in the right ventricle. Withdraw.`, tone: "danger" };
    case "lv":
      return { text: "Bright red pulsatile blood and ectopics: the needle is in the left ventricle. Withdraw.", tone: "danger" };
    case "ra":
      return { text: "Dark blood and atrial ectopics: the needle is in the right atrium. Withdraw.", tone: "danger" };
    case "liver":
      return { text: "The needle has entered the liver.", tone: "danger" };
    case "stomach":
      return { text: "The needle has entered the stomach.", tone: "danger" };
    case "lung":
      return { text: "The patient coughs; air in the syringe: the needle has crossed the lung.", tone: "danger" };
    case "mammary":
      return { text: "Brisk bright red bleeding at the needle: internal mammary artery injury.", tone: "danger" };
    case "intercostal":
      return { text: "Bleeding from the intercostal vessels under the rib above.", tone: "danger" };
    default:
      return null;
  }
}

// --- waveforms for the pericardiocentesis monitor ---------------------------------------

function lastBeat(beats: BeatRec[], t: number): BeatRec | null {
  for (let i = beats.length - 1; i >= 0; i--) if (beats[i].t <= t) return beats[i];
  return null;
}

function g(u: number, c: number, w: number) {
  const z = (u - c) / w;
  return Math.exp(-z * z);
}

function ecgAt(beats: BeatRec[], t: number, h: Haemo): number {
  const b = lastBeat(beats, t);
  if (!b) return 0;
  const u = t - b.t;
  const rr = 60 / h.hr;
  const volt = h.lowVoltage ? 0.5 : 1;
  const alt = h.alternans && b.idx % 2 === 1 ? 0.6 : 1;
  let v: number;
  if (b.pvc) {
    v = 1.0 * g(u, 0.05, 0.035) - 0.4 * g(u, 0.12, 0.03) - 0.35 * g(u, 0.36, 0.07);
  } else {
    v = volt * alt * (-0.1 * g(u, 0.0, 0.008) + 1.1 * g(u, 0.02, 0.011) - 0.26 * g(u, 0.045, 0.01)) + volt * 0.28 * g(u, 0.28, 0.05);
  }
  // P wave of the next beat
  v += volt * 0.13 * g(u, rr - 0.15, 0.025);
  return v;
}

function artShape(q: number): number {
  if (q < 0) return 0;
  if (q < 0.12) return Math.sin((Math.PI / 2) * (q / 0.12));
  if (q < 0.35) return 1 - (0.22 * (q - 0.12)) / 0.23;
  if (q < 0.4) return 0.78 - (0.08 * (q - 0.35)) / 0.05;
  if (q < 0.45) return 0.7 + 0.04 * Math.sin((Math.PI * (q - 0.4)) / 0.05);
  return 0.7 * Math.pow(Math.max(0, 1 - (q - 0.45) / 0.55), 1.2);
}

function artAt(beats: BeatRec[], t: number, h: Haemo): number {
  const delay = 0.16;
  const b = lastBeat(beats, t - delay);
  if (!b) return h.dbp;
  const rr = 60 / h.hr;
  const u = t - delay - b.t;
  const sys = (h.sbp - h.pulsus * b.insp) * (b.pvc ? 0.75 : 1);
  const dia = h.dbp - 0.3 * h.pulsus * b.insp;
  return dia + (sys - dia) * artShape(Math.min(1, u / rr));
}

function needleP(beats: BeatRec[], t: number, h: Haemo, s: Structure): number {
  const b = lastBeat(beats, t);
  const rr = 60 / h.hr;
  const ph = b ? (t - b.t) / rr : 0;
  if (s === "tissue" || s === "liver" || s === "stomach" || s === "mammary" || s === "intercostal" || s === "lung" || s === "epicardium") return 0;
  return needlePressure(s, h, ph, inspiration(t));
}
