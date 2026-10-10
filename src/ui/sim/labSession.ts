// ---------------------------------------------------------------------------
// One diagnostic cath-lab session (plan stream S10, lab shell step 1).
//
// It owns, per case:
//  - the patient (S9 PatientEngine): its CardiacClock drives the ECG, the
//    pressure traces and the image's heart motion and breathing together;
//  - the exposure loop (S6 ADRC and dose tracker) and the run bookkeeping;
//  - the C-arm and the table (dynamics in src/simulation/imaging/carm.ts);
//  - the manifold syringe (I1 Injector), driven by the hand on the plunger;
//  - the recorder of cine runs and the fluoroscopy loop for "store fluoro";
//  - the hands and pedals (S8 InputSystem), when the shell gives it one.
//
// The diagnostic store (useSimulatorStore) keeps the catheter, engagement,
// legacy pressure classes, events and scoring. This session reads it and feeds
// it pedals, C-arm angles, table position and booked contrast.
//
// The session is the table-side controls' LabControlsTarget
// (src/ui/lab/controls/types.ts, found-lab-controls-registry): the tabs in
// src/ui/lab/controls/tabs/ read and drive the lab through it alone.
//
// It also owns what the lab tips need (diag-tip-context): the EventLog (on lab
// time) with the case's properties held for the whole case and the transient
// events it raises from store transitions (VF, air, dissection), the patient
// engine (patientEvents), the dose tracker and its own trackers (engage-fail,
// exchange, the last filmed side, the first catheter at the root), and the
// session modules of src/ui/sim/modules/. tipContext() gives the LabContext
// (src/ui/lab/diagnosticContext.ts).
//
// One patient from one seed (diag-scenario-registry): the case id seeds the
// thorax (FluoroView's patientSeed), the coronary genome (genomeForCase) and
// the patient engine. When the case carries a chart (a named scenario), the
// engine's patient is built from that seed with the chart's sex, age, height,
// weight, renal function, LVEF, allergies and drugs and the scenario's
// indication (profileFromChart); what the chart does not record (another
// allergy, an anticoagulant, AF) the patient does not have. The thorax still
// takes its sex and habitus from its own seeded genome (FluoroView and
// sceneBuilder are outside this package).
//
// The stored runs (a cine run's RunRecorder, "store fluoro" from the
// FluoroLoop) are made by startCineRun and storeFluoroLoop, exported so that
// the PCI lab session (src/ui/pci/PciLabSession.ts) records its runs the same
// way (pci-lab-shell-session).
//
// A cathlab launch (found-launch-links) is turned into a case here too
// (caseForLaunch, loadLaunchedCase), so that Simulator.tsx exports components
// only.
//
// The catheter's mechanics (diag-rod-physics): when the rod mechanics runs
// (src/ui/physics/physicsDevices.ts resolvePhysicsMode: the Settings choice or
// the measured-cost default, a worker, a registered implementation), the
// session owns a DiagnosticPhysics: the hands go to it instead of the legacy
// engine, it steps on the patient engine's clock, its read-out drives the
// store (setPhysicsReadout: tip, engagement, hub read-outs, and the engine's
// own trace class), tipFromPhysics feeds the patient engine's tip, the hub
// reaction goes to the haptics, a catheter change is a timed exchange over the
// wire, and the recorder keeps physics snapshots at decision points. The lab
// falls back to the simple model, with a banner, when the solver fails or
// stays over its budget.
//
// One pressure system (diag-pressure-transducer): the store's pressure class,
// its deep-damping event and score follow the patient engine's tip state
// (setEnginePressure), not legacy pressure.ts. The tip input carries the
// catheter's side holes and an ostial lesion's narrowing of the gap. The line
// can carry faults (transducer.ts) that the monitor's keys and the table
// remedy. Aspiration is an outcome of the tip and the lumen (free blood, no
// return against the wall, no return from a plug, air drawn in by a hard
// pull), shown on the table's gauze; a plug comes from thrombus in the sheath,
// and flushing, injecting or passing the wire through it embolises it. The
// session raises transducer-fault, pressure-damped (a trace damped by the line
// or the plug), aspiration-failed, catheter-plugged, air, contrast-hold-up,
// hypotension (true systolic low with the tip free) and neuro-deficit
// (PRESSURE_SESSION_EVENTS); the physiologist calls out a low systolic.
//
// Filling and run quality (diag-injection-run-quality): the syringe pushes
// through the lumen of the catheter in use (its size and whether it is a
// guide, src/data/catheters.ts catheterFrench), and the hand's force on the
// plunger sets the aimed flow (injection.ts plungerAimFactor). The image gets
// the patient's live coronary flow per side (PatientEngine.coronaryFlowScale,
// times a run scenario's resting flow, runs.ts RUN_SETUPS) and the tree vessel
// the classifier puts the tip in (the rod mechanics' reading, or the branch a
// Judkins left enters in a short left main), so a superselective LAD
// injection fills the LAD alone. Every push is analysed when its flow has
// stopped (contrastTransport ostialSeries, runQuality analyseInjection) and
// every stored cine run when the pedal is released (runQuality assessRun: the
// push delay, frame rate, table motion, a change of field, the breath-hold,
// and the QFR check for an intermediate lesion), and the run carries the
// result (StoredSeries.quality). A push under RUN_QUALITY.testPuffMl is a test
// puff, recorded with the tip's classification (testPuffs). The session raises
// contrast-streaming after a selective push that streamed (cleared by a push
// that filled the artery), non-diagnostic-run after a filmed selective push
// that was underfilled or did not reflux, and engage-fail after a test puff
// into a branch of the left main (RUN_QUALITY_SESSION_EVENTS).
//
// Rhythm and haemodynamic events (diag-rhythm-haemodynamic-events): the
// patient engine owns the rhythm (the store's fixed 'conus injection always
// fibrillates' rule is off while a session is attached). Each push is judged
// by the engine's injection hazard model with what the tip was doing when it
// began (a conus, a damped, wedged or plugging seat; a free trace carries no
// trigger), and contrast an obstructing tip holds in the artery adds its dwell
// hazard every step until it clears. VF from any cause reaches the store
// (engineArrhythmia) and is recorded with the catheter, its engagement and
// the tip state for the debrief. The 'rhythm' capability gives the Rhythm
// tab its orders: defibrillator mode and energy, synchronised cardioversion
// with sedation, CPR, external or transvenous pacing with a set-up time,
// overdrive pacing of VT, legs up, the arrest and rhythm drugs (checked
// against the chart by src/mentor/rules/diagRhythm.ts) and the vagal time
// limit with the look for another cause. A scenario of src/simulation/
// diagnosticScenarios/rhythm.ts may start an arrhythmia, a block on the first
// injection of a side, a vagal look-alike (a hidden retroperitoneal bleed from
// a high puncture, site.ts, or a tamponade), or an Amplatz that holds the
// aortic cusp open; the causes are registered with the shared hypotension
// model (DIAG_HYPOTENSION_CAUSES). The chart's resting ECG gives the engine's
// QTc, an obstructive outflow on the echo gives obstructive HCM, a planned
// thrombotic target gives the culprit, and a dry patient on the history gives
// a volume deficit (profileFromChart, engineOptionsForCase).
// ---------------------------------------------------------------------------

import { useSimulatorStore, type FieldSize, type PulseRate } from "../../state/useSimulatorStore";
import { useSeriesStore, RunRecorder, FluoroLoop, STORE_PX, type StoredSeries } from "../../state/useSeriesStore";
import { PatientEngine } from "../../simulation/patient/engine";
import { CREATININE_UMOL_PER_MGDL, ckdEpi2021, cigarroaMacd, cockcroftGault, generatePatient, type PatientProfile, type Sex } from "../../simulation/patient/patient";
import { PDE5_WINDOW_H, type DoacAgent, type Pde5Agent } from "../../simulation/patient/pharmacology";
import { tipFromEngagement, tipFromPhysics } from "../../simulation/patient/transducer";
import { buildCoronaryTree, type CoronaryTree } from "../../render/xray/coronaryTree";
import type { AnatomyModel } from "../../simulation/anatomy";
import { ExposureLoop } from "../../simulation/imaging/exposure";
import { CArmDrive, TableDrive } from "../../simulation/imaging/carm";
import { Injector, LUMENS, lumenForCatheter, plungerAimFactor, type InjectionTrace } from "../../simulation/injection";
import { CATHETERS, catheterById, catheterCurveBase, catheterFrench, catheterSideHoles } from "../../data/catheters";
import { injectionSeat } from "../../simulation/contrast";
import { ostialSeries, seatWithSideHoles, transportNet, type Seat } from "../../render/xray/contrastTransport";
import { samplePos } from "../../render/xray/coronaryTree";
import { toWorld } from "../../simulation/anatomy";
import { RUN_QUALITY, analyseInjection, assessRun, lesionView, viewSeparationDeg, type InjectionQuality, type RunLesion, type RunQuality, type RunQualityInput } from "../../simulation/imaging/runQuality";
import { RUN_SETUPS, SHORT_LM_CLASSIFIER_SCENARIOS, type RunSetup } from "../../simulation/diagnosticScenarios/runs";
import { SOD, SID, vesselSubtree } from "../../render/xray/sceneBuilder";
import type { InputSystem } from "../../input";
import { routeDiagnosticHand } from "../../input/legacyAdapter";
import type { PedalState, SyringeCommand } from "../../simulation/session/types";
import type { AnatomyCase, CArm, CaseChart, EngagementState, PressureState, VesselId } from "../../types";
import type { Indication } from "../../simulation/patient/patient";
import { DEFAULT_SCENARIO_SEED, scenarioCase } from "../../simulation/caseGenerator";
import { diagScenarioById } from "../../simulation/diagnosticScenarios";
import { visibilityFor } from "../../mentor/visibility";
import { LAUNCH_MODES, type LaunchMode, type LaunchParams } from "../../content/schema";
import { LAB_EVENTS } from "../../content/lab/tips";
import { uid } from "../../utils/random";
import { computeScores } from "../../simulation/scoring";
import { LabTeam } from "../lab/labTeam";
import type { DoseTracker } from "../../simulation/dose";
import { FLUORO_SIGNAL_INTERVAL_S } from "../../simulation/dose";
import { MP_AIR_FULL_ML, MP_AIR_PER_INSERT_ML, MP_AIR_TAU_S } from "../../simulation/complications/airEmbolism";
import type { LabPolicy } from "../lab/visibility";
import type { BackTableState, DefibReadout, FluoroLevel, ImagingControls, LabCapabilities, LabControlsTarget } from "../lab/controls/types";
import { triggerFractions } from "../../simulation/dose";
import type { LabContext, LabEvent } from "../../content/lab/tips";
import { EventLog } from "../lab/eventLog";
import { PatientEventAdapter } from "../lab/patientEvents";
import {
  ENGAGE_FAIL_S,
  EXCHANGE_HOLD_S,
  EXCHANGE_LOAD_S,
  EXCHANGE_WIRE_LEAD,
  caseEvents,
  diagnosticContext,
  diagnosticStoreSlice,
  engagedSide,
  tipVesselOf,
  type DiagnosticPhysicsReading,
  type DiagnosticSessionView,
} from "../lab/diagnosticContext";
import { instantiateSessionModules, sessionModuleFactories, type SessionModule, type SessionModuleFactory } from "./modules";
import { getPhysicsDevices, type PhysicsReading } from "../physics/types";
import {
  DiagnosticPhysics,
  PROLAPSE_REPEAT,
  easeBackScript,
  engageScript,
  resolvePhysicsMode,
  rodScenarioById,
  usePhysicsSettings,
  type DiagnosticPhysicsOptions,
  type PhysicsMode,
  type PhysicsSnapshotEntry,
} from "../physics/physicsDevices";
import type { EngineConfig } from "../../physics/engine";
import { pressureFromEngine } from "../../simulation/pressure";
import type { TipInput, TipPressureState } from "../../simulation/patient/transducer";
import { pressureSetups, type PressureSetup } from "../../simulation/diagnosticScenarios/pressure";
import type { AspirationOutcome, AspirationResult } from "../../state/useSimulatorStore";
import { initialControls, isShortLeftMain, shortLmBranch } from "../../simulation/engagement";
import { MP_CALLOUT_HOLD_S, MP_CALLOUT_SYSTOLIC_MMHG } from "../lab/labTeam";
import { RHYTHM_ECGS, rhythmSetups, vagalMimicCause, type RhythmHypotension, type RhythmSetup, type VagalMimicCause } from "../../simulation/diagnosticScenarios/rhythm";
import { drugSetups } from "../../simulation/diagnosticScenarios/drugs";
import { buildAccessSite, highPunctureX, punctureBleed, MP_PUNCTURE_BLEED, type PunctureBleed } from "../../simulation/access/site";
import { MP_CAUSES, registerHypotensionCause, startHypotensionCause, hypotensionCause, type CauseRun, type HypotensionCause, type HypotensionEnginePort } from "../../simulation/patient/hypotensionCauses";
import { MP_INTERACTION, type DrugId } from "../../simulation/patient/pharmacology";
import { SeededRng } from "../../simulation/patient/rng";
import { bladderDentMm, bladderTruth } from "../../simulation/access/bleeding";
import type { InjectionHazardDetail } from "../../simulation/patient/engine";
import { dwellVfProbability, injectionVfProbability, type InjectionHazardInput } from "../../simulation/patient/responses";
import { MentorEngine } from "../../mentor/mentor";
import type { MentorInput, PreAction } from "../../mentor/context";
import type { MentorUtterance } from "../../mentor/types";
import { mentorInputFromSim } from "../../mentor/bridge/simulatorStore";
import { RHYTHM_RULES, type RhythmDrugAction, type RhythmMentorCtx, type VagalWatchRecord } from "../../mentor/rules/diagRhythm";
import type { Lesion } from "../../types";
import type { AngioCadSegment } from "../../simulation/patient/angiocadPriors";
import type { Grade } from "../../simulation/patient/patient";

/** How a session runs the rod mechanics (tests run it in-thread with a fixed configuration). */
export interface SessionPhysicsOptions {
  /** run even when the default or the Settings choice is the simple model */
  force?: boolean;
  /** false: in-thread (tests, Node); default: a worker */
  useWorker?: boolean;
  config?: Partial<EngineConfig> | "auto";
  autoFallback?: boolean;
  moveCoronaries?: boolean;
  start?: DiagnosticPhysicsOptions["start"];
}

/** Three seconds still, then easeBackScript (the scripted seat of the development capture). */
function* settleThenEaseBack(p: DiagnosticPhysics, side: "left" | "right"): Generator<number, void> {
  yield 3;
  yield* easeBackScript(p, side);
}

/** Decision-point physics snapshots the session keeps (the newest). */
const PHYSICS_SNAPSHOT_KEEP = 8;

/** Two tip inputs agree (the engine is told only of a change). */
function sameTip(a: TipInput, b: TipInput | null): boolean {
  if (!b) return false;
  const ka = Object.keys(a) as (keyof TipInput)[];
  if (ka.length !== Object.keys(b).length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}

/** Lab time per step when a script or the bench drives the session (s). */
const SCRIPT_DT = 1 / 60;

/** Yield to the event loop without timer throttling (worker frames arrive in between). */
export function yieldTask(): Promise<void> {
  if (typeof MessageChannel === "undefined") return new Promise((r) => setTimeout(r, 0));
  return new Promise((r) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => {
      ch.port1.close();
      r();
    };
    ch.port2.postMessage(0);
  });
}

/** Engagement kinds at which time without a selective position counts towards "engage-fail". */
const NEAR_OSTIUM = ["sinus-level", "near-lm", "near-rca", "non-selective"] as const;

/** Seconds after the end of a push before the lab ends the store's bolus (contrast cleared from the tree). Model parameter (facts C2). */
export const CONTRAST_CLEAR_S = 3.5;
/** A breath-hold the patient keeps before breathing again on their own (s). Model parameter (facts C2). */
export const BREATH_HOLD_MAX_S = 15;
/** Held inspiration level (0..1); the same model parameter as sceneBuilder's CINE_BREATH_HOLD. */
export const BREATH_HOLD_LEVEL = 0.7;
/** Plunger force above which the push starts (0..1 of a firm push). Model parameter. */
const PUSH_ON = 0.08;

// --- the pressure system (diag-pressure-transducer) -----------------------------------

/**
 * What the session raises for the pressure system, into its EventLog: a fault in the line, a trace
 * damped by the line or a plug, an aspiration that fails, a plugged catheter, air drawn in, contrast
 * held up by an obstructing tip, true hypotension with the tip free, and a neurological deficit from
 * a plug flushed into the aorta. (The reachability report reads the diagnostic lab's raises from
 * src/ui/lab/diagnosticContext.ts and the session modules; this list is what those should add.)
 */
export const PRESSURE_SESSION_EVENTS = [
  "transducer-fault",
  "pressure-damped",
  "aspiration-failed",
  "catheter-plugged",
  "air",
  "contrast-hold-up",
  "hypotension",
  "neuro-deficit",
] as const satisfies readonly LabEvent[];

// --- filling and run quality (diag-injection-run-quality) ---------------------------------

/**
 * What the session raises for the filling of the arteries and the runs, into its EventLog: a selective push that
 * streamed, a filmed selective push that was underfilled or did not reflux, and a test puff into a branch of the left
 * main (engage-fail, with the vessel the classifier names). (The reachability report reads the diagnostic lab's
 * raises from src/ui/lab/diagnosticContext.ts and the session modules; this list is what those should add, as for
 * PRESSURE_SESSION_EVENTS.)
 */
export const RUN_QUALITY_SESSION_EVENTS = ["contrast-streaming", "non-diagnostic-run", "engage-fail"] as const satisfies readonly LabEvent[];

/** The phases at which the session raises them: during the push and its washout ('inject'), and after a filmed run ('views'). */
export const RUN_QUALITY_SESSION_PHASES = ["inject", "views"] as const;

/** The run scenario's start state for a case (null for any other case). */
export function runSetupFor(c: Pick<AnatomyCase, "scenarioId">): RunSetup | null {
  return (c.scenarioId && RUN_SETUPS[c.scenarioId]) || null;
}

/** A push the session has started, analysed once its flow has stopped. */
export interface PushRecord {
  /** lab time of the press (s) */
  t0: number;
  side: "left" | "right";
  trace: InjectionTrace;
  /** the ostium's capture and seal (with the side holes' escape) */
  seat: Seat;
  /** the native flow scale of the side when the push began */
  flowScale: number;
  /** beat length (s) and beat phase at the press */
  rrS: number;
  phase0: number;
  /** the tip's classification when the push began */
  tip: { kind: string; vessel: string | null };
  /** the push went into an engaged coronary (not a root puff, not the LV) */
  selective: boolean;
  /** a cine run was recording when the push began */
  filmed: boolean;
  /** the epicardial dilation (the nitrate effect) on board when the push began */
  dilation: number;
  /** the analysis once the flow stopped */
  quality: InjectionQuality | null;
}

/** A test puff the session recorded (RUN_QUALITY.testPuffMl), with the tip's classification. */
export interface TestPuffRecord {
  t: number;
  volumeMl: number;
  side: "left" | "right";
  tip: { kind: string; vessel: string | null };
}

/** Seconds after the end of a push at which contrast still in the vessel with the tip obstructing raises contrast-hold-up. MODEL PARAMETER (the plan's value; not sourced). */
export const MP_HOLD_UP_S = 4;
/** Longest the lab keeps the contrast of a push in the vessels while the tip obstructs the ostium, s. MODEL PARAMETER. */
export const MP_HOLD_UP_MAX_S = 20;
/**
 * A pull on the syringe at least this firm (0..1 of a full pull) against a blocked catheter draws air
 * in through the connector. MODEL PARAMETER. It must stay above the keyboard's full pull
 * (src/input/settings.ts keyboard.plungerForce, default 0.7), so holding the aspirate key against a
 * blocked catheter gives no return rather than air; only a deliberate full pull (a trigger pulled all
 * the way) draws air.
 */
export const MP_HARD_PULL = 0.85;
/** Lesions this close to the vessel's origin (0..1 along the vessel) narrow the ostium around an engaged catheter. MODEL PARAMETER. */
export const MP_OSTIAL_POSITION = 0.06;
/** Where a plug flushed into a coronary lodges (0..1 along the LAD or RCA) and how much it occludes. MODEL PARAMETERS. */
export const MP_PLUG_EMBOLUS = { param: 0.3, fraction: 1 } as const;
/** True aortic systolic pressure below which, with the tip free, the session raises hypotension, mmHg. The physiologist's call-out threshold (labTeam.ts, from pm-engaging's rule of thumb). */
export const MP_HYPOTENSION_SYS_MMHG = MP_CALLOUT_SYSTOLIC_MMHG;
/** Seconds the true systolic must stay low before hypotension is raised. MODEL PARAMETER (the physiologist's hold, labTeam.ts). */
export const MP_HYPOTENSION_HOLD_S = MP_CALLOUT_HOLD_S;
/**
 * Cardiac cycles after the flush valve is released for which the store's pressure numbers hold their
 * last values from before the flush. The engine averages the last 4 beats (engine.ts computeVitals),
 * so a flush artefact leaves its numerics after 4 whole beats plus the beat it ended in. MODEL PARAMETER.
 * The monitor's own trace and numerics still show the artefact, as a real monitor's do.
 */
export const MP_FLUSH_HOLD_BEATS = 5;
/**
 * Aortic valve area the engine gives a chart's severe aortic stenosis, cm². MODEL PARAMETER inside
 * the module text's severe band (a valve area of 1.0 cm² or less, ESC/EACTS, hb-specific-conditions,
 * src/content/manual/cath-handbook/05-specific-conditions.ts). Milder grades leave the valve normal.
 */
export const MP_SEVERE_AS_AVA_CM2 = 0.7;

const OBSTRUCTING: readonly TipPressureState[] = ["damped", "wedged", "ventricularised"];

/** The pressure scenario's start state for a case (null for any other case). */
export function pressureSetupFor(c: Pick<AnatomyCase, "scenarioId">): PressureSetup | null {
  return (c.scenarioId && pressureSetups[c.scenarioId]) || null;
}

/**
 * How much an ostial lesion narrows the gap around a catheter seated in that ostium: the residual
 * lumen area fraction (1 − DS)² of the tightest lesion within MP_OSTIAL_POSITION of the LM (left)
 * or the RCA (right) origin; 1 without one. The module text: an ostial lesion damps the trace every
 * time the tip enters and the trace is normal as soon as it backs out (Brilakis 5.8, pm-engaging).
 */
export function ostialGapFactor(lesions: readonly { vessel: string; position: number; severity: number }[], side: "left" | "right"): number {
  const ostiumOf = side === "right" ? "RCA" : "LM";
  let f = 1;
  for (const l of lesions) {
    if (l.vessel !== ostiumOf || l.position > MP_OSTIAL_POSITION) continue;
    const r = Math.max(0, 1 - Math.max(0, Math.min(100, l.severity)) / 100);
    f = Math.min(f, r * r);
  }
  return f;
}

/** What an aspiration finds, from the tip and the lumen. */
export function aspirationOutcome(i: {
  plugged: boolean;
  tipState: TipPressureState;
  engagement: Pick<EngagementState, "isDeep" | "conus" | "kind"> | null;
  /** the legacy tip's contact with the wall (store tip.cram) */
  cram: number;
  /** the pull on the syringe, 0..1 */
  pull: number;
}): AspirationOutcome {
  const lv = i.engagement?.kind === "in-lv" || i.tipState === "lv";
  const blocked = i.plugged || (!lv && (OBSTRUCTING.includes(i.tipState) || !!i.engagement?.isDeep || !!i.engagement?.conus || i.cram >= 4));
  if (!blocked) return "free";
  if (i.pull >= MP_HARD_PULL) return "air";
  return i.plugged ? "plug" : "wall";
}

/** Programmed C-arm positions (memories). Neutral defaults; the operator stores their own. */
export const DEFAULT_MEMORIES: (CArm | null)[] = [
  { laoRao: 0, cranialCaudal: 0 },
  { laoRao: 40, cranialCaudal: 0 },
  { laoRao: -30, cranialCaudal: 0 },
  { laoRao: 0, cranialCaudal: 30 },
  null,
  null,
  null,
  null,
];

/** Field sizes the diagnostic lab's detector offers (cm). */
export const DIAGNOSTIC_FIELDS: readonly FieldSize[] = [25, 20, 16, 12];
/** Fluoroscopy pulse and cine frame rates the diagnostic lab offers (per s). */
export const DIAGNOSTIC_RATES: readonly PulseRate[] = [7.5, 15, 30];
/** The back table's line about the J wire (the wire itself is on the table strip). */
const BACK_TABLE_NOTE = "The J wire is on the table strip: grip it (2) and advance or withdraw (W / S).";

/** What the scene needs about the injection in progress. */
export interface ContrastRun {
  filled: VesselId[];
  plume: "none" | "root" | "reflux";
  side: "left" | "right" | null;
  peak: number;
  lv: boolean;
  /** the tree vessel the classifier put the tip in when the push began (diag-injection-run-quality), or null */
  vessel?: string | null;
}

type Store = typeof useSimulatorStore;

// --- stored runs (shared by the diagnostic and the PCI lab) ---------------------------

/** mm per stored pixel at the isocentre for a detector field (cm). */
export function storedMmPerPx(fieldCm: number): number {
  return (fieldCm * 10 * (SOD / SID)) / STORE_PX;
}

/** What a lab knows when the cine pedal goes down. */
export interface CineRunStart {
  caseId: string;
  /** lab seconds at the first frame */
  startedAt: number;
  fps: number;
  cArm: CArm;
  fieldCm: number;
  catheterId: string;
  karMGy0: number;
  kapGyCm20: number;
  contrastMl0: number;
}

/** A recorder for the cine run that starts now (numbered after the runs already stored). */
export function startCineRun(o: CineRunStart): RunRecorder {
  return new RunRecorder({
    id: uid(),
    number: useSeriesStore.getState().nextNumber(),
    kind: "cine",
    caseId: o.caseId,
    startedAt: o.startedAt,
    fps: o.fps,
    cArm: { ...o.cArm },
    fieldCm: o.fieldCm,
    mmPerPxIso: storedMmPerPx(o.fieldCm),
    catheterId: o.catheterId,
    karMGy0: o.karMGy0,
    kapGyCm20: o.kapGyCm20,
    contrastMl0: o.contrastMl0,
  });
}

/**
 * Store the last fluoroscopy sequence of a loop as a run on the reference monitor ("store fluoro"),
 * and clear the loop. Null when the loop holds no frames.
 */
export function storeFluoroLoop(loop: FluoroLoop, o: { caseId: string; fps: number; fieldCm: number; catheterId: string }): StoredSeries | null {
  const seq = loop.last();
  if (!seq || !seq.frames.length) return null;
  const s: StoredSeries = {
    id: uid(),
    number: useSeriesStore.getState().nextNumber(),
    kind: "fluoro",
    caseId: o.caseId,
    startedAt: seq.t0,
    fps: o.fps,
    w: STORE_PX,
    h: STORE_PX,
    frames: seq.frames,
    cArm: seq.cArm,
    cArmEnd: seq.cArmEnd,
    fieldCm: o.fieldCm,
    mmPerPxIso: storedMmPerPx(o.fieldCm),
    durationS: seq.frames.length / o.fps,
    karMGy: 0,
    kapGyCm2: 0,
    contrastMl: 0,
    injected: false,
    catheterId: o.catheterId,
  };
  loop.clear();
  useSeriesStore.getState().add(s);
  return s;
}

/** Dose already given to this patient before the lab (the case session's access fluoroscopy and earlier labs). */
export interface LabDoseStart {
  fluoroS: number;
  karMGy: number;
  kapGyCm2: number;
}

/**
 * What a lab receives in the continuous hand-over from the full case (C5): the case's own patient
 * engine (one clock: heparin, ACT, contrast and pressures carry on), the dose so far, the catheter in
 * the aorta and what the table left in the line.
 */
export interface LabStart {
  engine: PatientEngine;
  dose?: LabDoseStart;
  /** the case session's catheter (JR4, JL4, TIG, AL1, pigtail) */
  catheterId?: string | null;
  /** air left in the manifold line or the catheter lumen: the first injection carries it into the coronary */
  air?: { line: boolean; lumen: boolean };
}

/** Seed a dose tracker with the dose given before this lab (the display and the five-minute signal carry on). */
export function seedDose(d: DoseTracker, start: LabDoseStart | null | undefined): void {
  if (!start || !(start.fluoroS > 0 || start.karMGy > 0 || start.kapGyCm2 > 0)) return;
  const sn = d.snapshot();
  const t = sn.totals;
  t.karMGy = { ...t.karMGy, fluoro: t.karMGy.fluoro + start.karMGy, total: t.karMGy.total + start.karMGy };
  t.kapGyCm2 = { ...t.kapGyCm2, fluoro: t.kapGyCm2.fluoro + start.kapGyCm2, total: t.kapGyCm2.total + start.kapGyCm2 };
  t.fluoroTimeS += start.fluoroS;
  sn.fluoroSignals = Math.floor(t.fluoroTimeS / FLUORO_SIGNAL_INTERVAL_S);
  d.restore(sn);
}

/** The dose this lab added (its tracker's totals less the seeded start). */
export function doseSince(d: DoseTracker, start: LabDoseStart | null | undefined): LabDoseStart {
  const t = d.totals;
  return {
    fluoroS: Math.max(0, t.fluoroTimeS - (start?.fluoroS ?? 0)),
    karMGy: Math.max(0, t.karMGy.total - (start?.karMGy ?? 0)),
    kapGyCm2: Math.max(0, t.kapGyCm2.total - (start?.kapGyCm2 ?? 0)),
  };
}

// --- the patient from the chart (diag-scenario-registry) ----------------------------

const DOAC_AGENTS: readonly DoacAgent[] = ["dabigatran", "apixaban", "rivaroxaban", "edoxaban"];

/**
 * Serum creatinine (mg/dL) that gives this eGFR by the 2021 CKD-EPI creatinine equation (the
 * sourced formula of src/simulation/patient/patient.ts), found by bisection; the equation falls
 * monotonically with creatinine.
 */
export function creatinineForEgfr(egfr: number, ageY: number, sex: Sex): number {
  let lo = 0.1;
  let hi = 20;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (ckdEpi2021(ageY, mid, sex) > egfr) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Renal function from the chart: the chart's creatinine when it gives one, else the creatinine that
 * gives its eGFR. Creatinine clearance (Cockcroft-Gault) and the Cigarroa dose follow from the
 * chart's age, weight and sex; the eGFR shown on the chart is kept as written.
 */
export function chartRenal(chart: CaseChart): PatientProfile["renal"] | null {
  const scrMgDl =
    chart.creatinineUmolL !== undefined ? chart.creatinineUmolL / CREATININE_UMOL_PER_MGDL : chart.egfr !== undefined ? creatinineForEgfr(chart.egfr, chart.ageY, chart.sex) : null;
  if (scrMgDl === null || !(scrMgDl > 0)) return null;
  const creatinineMgDl = Math.round(scrMgDl * 100) / 100;
  return {
    creatinineMgDl,
    creatinineUmolL: chart.creatinineUmolL ?? Math.round(scrMgDl * CREATININE_UMOL_PER_MGDL),
    crclMlMin: Math.round(cockcroftGault(chart.ageY, chart.weightKg, scrMgDl, chart.sex)),
    egfr: chart.egfr ?? Math.round(ckdEpi2021(chart.ageY, scrMgDl, chart.sex)),
    macdMl: Math.round(cigarroaMacd(chart.weightKg, scrMgDl)),
  };
}

/**
 * The patient engine's profile for a case with a chart: the seeded patient (generatePatient, the
 * case id as seed, the chart's sex and age and the scenario's indication) with the chart's height,
 * weight, renal function, LVEF and allergies, a PDE-5 inhibitor with the hours since its last dose
 * (the formulary applies its window, PDE5_WINDOW_H, Brilakis 3.2) and a DOAC or warfarin not held.
 * The chart is the patient's record: an allergy or an anticoagulant it does not list the patient
 * does not have, and without an anticoagulant the rhythm is sinus (the seeded draw's AF is what
 * brings its anticoagulant). Habitus follows BMI, and LVEDP, heart rate and blood pressure follow
 * the chart's LVEF, by generatePatient's own model lines (MODEL PARAMETERS in patient.ts).
 */
export function profileFromChart(seed: string, chart: CaseChart, indication?: Indication, lesions?: readonly Lesion[]): PatientProfile {
  const p = generatePatient(seed, { sex: chart.sex, ageY: chart.ageY, indication });
  const bmi = Math.round((chart.weightKg / (chart.heightCm / 100) ** 2) * 10) / 10;
  const lvef = chart.echo?.lvef ?? p.lvef;
  const out: PatientProfile = {
    ...p,
    heightCm: chart.heightCm,
    weightKg: chart.weightKg,
    bmi,
    habitus: Math.round(Math.min(1.25, Math.max(0.85, 1 + (bmi - 26) * 0.022)) * 100) / 100,
    renal: chartRenal(chart) ?? p.renal,
    lvef,
    ...chartHaemodynamics(p, lvef),
    allergies: { contrast: chart.allergies?.contrast ?? p.allergies.contrast, other: [...(chart.allergies?.other ?? [])] },
    anticoagulation: "none",
    doac: undefined,
  };
  for (const d of chart.drugs ?? []) {
    const id = (d.drugId ?? d.name).toLowerCase();
    if (id in PDE5_WINDOW_H && d.lastDoseHoursAgo !== undefined) out.pde5 = { agent: id as Pde5Agent, hoursAgo: d.lastDoseHoursAgo };
    if ((DOAC_AGENTS as readonly string[]).includes(id) && !d.held) {
      out.anticoagulation = "doac";
      out.doac = { agent: id as DoacAgent, hoursSinceDose: d.lastDoseHoursAgo ?? 0 };
    }
    if (id === "warfarin" && !d.held) out.anticoagulation = "warfarin";
  }
  if (out.anticoagulation === "none") out.baseline = { ...out.baseline, rhythm: "sinus" };
  // severe aortic stenosis on the echo narrows the engine's valve (diag-pressure-transducer)
  if (chart.echo?.valves?.some((v) => v.valve === "aortic" && v.lesion === "stenosis" && v.severity === "severe")) out.aorticValveAreaCm2 = MP_SEVERE_AS_AVA_CM2;
  // diag-rhythm-haemodynamic-events: the chart's resting ECG (its QTc and pre-excitation), an
  // obstructive outflow on the echo, and the culprit from a planned thrombotic target
  const ecg = chart.ecgId ? RHYTHM_ECGS[chart.ecgId] : undefined;
  if (ecg?.qtcMs !== undefined && ecg.qtcMs > 0) out.baseline = { ...out.baseline, qtc: ecg.qtcMs / 1000 };
  if (ecg?.preExcitation) out.preExcitation = true;
  if (chartObstructiveHcm(chart)) out.lvot = { obstructive: true };
  if (!out.culprit && indication && indication !== "SA" && lesions?.length) {
    const c = culpritFromLesions(lesions);
    if (c) out.culprit = c;
  }
  return out;
}

/**
 * Whether the chart's echo reports obstructive hypertrophic cardiomyopathy: a sentence naming it, a
 * left ventricular outflow tract (LVOT) obstruction or an outflow gradient, with no negation in that
 * sentence ("No outflow tract obstruction" is not).
 */
export function chartObstructiveHcm(chart: Pick<CaseChart, "echo">): boolean {
  const note = chart.echo?.note;
  if (!note) return false;
  return note
    .split(/[.;]/)
    .some((x) => /obstructive hypertrophic cardiomyopathy|\bHOCM\b|LVOT obstruction|outflow tract obstruction|outflow (tract )?gradient|LVOT gradient/i.test(x) && !/\b(no|not|without|non-obstructive)\b/i.test(x));
}

/**
 * The AngioCAD culprit segment of the first thrombotic lesion (the scenario's planned acute occlusion):
 * the vessel and its third along the vessel (proximal, mid, distal), graded by its severity (100%
 * occluded 6, 91-99% 5, otherwise 4, the grade from which culpritOf counts a culprit). Null without one.
 */
export function culpritFromLesions(lesions: readonly Lesion[]): { segment: AngioCadSegment; grade: Grade } | null {
  const l = lesions.find((x) => x.kind === "thrombotic");
  if (!l) return null;
  const third = l.position < 1 / 3 ? "Prox" : l.position < 2 / 3 ? "Mid" : "Dist";
  const byVessel: Partial<Record<string, AngioCadSegment>> = {
    LM: "LM",
    LAD: `${third} LAD` as AngioCadSegment,
    LCx: `${third} LCx` as AngioCadSegment,
    RCA: `${third} RCA` as AngioCadSegment,
    D1: "D1",
    D2: "D2",
    OM1: "OM",
    OM2: "OM",
    OM: "OM",
    PDA: "PDA",
    PLB: "PLB",
  };
  const segment = byVessel[l.vessel];
  if (!segment) return null;
  const grade: Grade = l.severity >= 100 ? 6 : l.severity >= 91 ? 5 : 4;
  return { segment, grade };
}

/**
 * The circulating volume a dry patient lacks on arrival, mL (a scenario whose history makes the
 * patient hypovolaemic: drugSetups' 'hypovolaemia' fact). MODEL PARAMETER: the shared cause model's
 * fasting deficit (MP_CAUSES.fastingDeficitMl).
 */
export const MP_DRY_DEFICIT_ML = MP_CAUSES.fastingDeficitMl;

/**
 * LVEDP, heart rate and blood pressure of a seeded patient moved to another LVEF along
 * generatePatient's model lines (MODEL PARAMETERS in patient.ts): LVEDP 0.22 mmHg higher per point
 * of LVEF lost, and an LVEF below 35% adding 8 bpm and taking 10 mmHg off the systolic pressure, with
 * the diastolic following at 0.58 of the systolic; the seeded scatter and patient.ts's limits are kept.
 */
function chartHaemodynamics(p: PatientProfile, lvef: number): Pick<PatientProfile, "lvedp" | "baseline"> {
  if (lvef === p.lvef) return { lvedp: p.lvedp, baseline: { ...p.baseline } };
  const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
  const lowEf = (ef: number) => (ef < 35 ? 1 : 0);
  const step = lowEf(lvef) - lowEf(p.lvef);
  const sbp = Math.round(clamp(p.baseline.sbp - 10 * step, 96, 185));
  return {
    lvedp: Math.round(clamp(p.lvedp + (p.lvef - lvef) * 0.22, 6, 32)),
    baseline: {
      ...p.baseline,
      hr: Math.round(clamp(p.baseline.hr + 8 * step, 50, 112)),
      sbp,
      dbp: Math.round(Math.min(sbp - 28, Math.max(52, p.baseline.dbp + 0.58 * (sbp - p.baseline.sbp)))),
    },
  };
}

/**
 * The engine options for a case: the chart's patient when it has one (with its scenario's
 * indication), else the patient the case id seeds.
 */
export function engineOptionsForCase(c: Pick<AnatomyCase, "id" | "chart" | "scenarioId"> & Partial<Pick<AnatomyCase, "lesions">>): { profile: PatientProfile; volumeDeficitMl?: number } | { seed: string } {
  if (!c.chart) return { seed: c.id };
  const indication = c.scenarioId ? diagScenarioById(c.scenarioId)?.indication : undefined;
  const profile = profileFromChart(c.id, c.chart, indication, c.lesions);
  // a pressure scenario may set the valve area and the resting heart rate itself (diag-pressure-transducer)
  const setup = pressureSetupFor(c);
  const out: PatientProfile = { ...profile };
  if (setup?.aorticValveAreaCm2 !== undefined) out.aorticValveAreaCm2 = setup.aorticValveAreaCm2;
  if (setup?.heartRateBpm !== undefined) out.baseline = { ...out.baseline, hr: setup.heartRateBpm };
  // a dry patient on the history (diag-rhythm-haemodynamic-events): the engine starts with a volume deficit
  const dry = !!c.scenarioId && !!drugSetups[c.scenarioId]?.facts?.includes("hypovolaemia");
  return dry ? { profile: out, volumeDeficitMl: MP_DRY_DEFICIT_ML } : { profile: out };
}

// --- a cathlab launch (found-launch-links) -------------------------------------------

const LAB_EVENT_SET = new Set<string>(LAB_EVENTS);

/**
 * The case a 'cathlab' launch asks for (found-launch-links params: scenario, seed, mode, events):
 * the named scenario at its seed (scenarioCase), or the current case when the launch names none,
 * with the launch's extra events (those in the shared vocabulary, LAB_EVENTS) added to the case
 * events. Null when the scenario is unknown.
 */
/** A named diagnostic scenario: the registry's, else one of the rod-mechanics scenarios (src/ui/physics/physicsDevices.ts). */
export const labScenarioById = (id: string) => diagScenarioById(id) ?? rodScenarioById(id);

export function caseForLaunch(p: LaunchParams, current: AnatomyCase): { c: AnatomyCase; mode: LaunchMode | null } | null {
  let c: AnatomyCase | undefined = current;
  if (p.scenario) c = scenarioCase(p.scenario, p.seed?.trim() || DEFAULT_SCENARIO_SEED, labScenarioById);
  if (!c) return null;
  const extra = (p.events ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter((x) => LAB_EVENT_SET.has(x)) as LabEvent[];
  if (extra.length) c = { ...c, events: [...new Set([...(c.events ?? []), ...extra])] };
  const asked = (LAUNCH_MODES as readonly string[]).includes(p.mode ?? "") ? (p.mode as LaunchMode) : null;
  const mode = asked ?? (p.scenario ? labScenarioById(p.scenario)?.mode ?? null : null);
  return { c, mode };
}

/** Load a launched case in the diagnostic store under the launch's mode (an exam loads as an exam; the other modes set the session policy). */
export function loadLaunchedCase(c: AnatomyCase, mode: LaunchMode | null) {
  const store = useSimulatorStore.getState();
  store.loadCase(c, mode === "exam" ? "exam" : "free");
  if (!mode || mode === "exam") return;
  useSimulatorStore.setState((s) => {
    const entrustment = mode === "guided" ? 1 : Math.max(2, s.policy.entrustment);
    const visibility = visibilityFor(mode, entrustment as typeof s.policy.entrustment);
    const ov = visibility.overlays;
    return {
      policy: { ...s.policy, mode, entrustment: entrustment as typeof s.policy.entrustment, visibility, source: "active" },
      overlays: { ...s.overlays, labels: ov.labels, ostia: ov.ostia, valvePlane: ov.valvePlane, transparent: ov.transparent },
    };
  });
}

/**
 * Whether the lab shows the pre-brief: until the time-out in the modes that require one, and, for a
 * case with a chart, until the learner has closed it once in any mode (guided and independent
 * practice need no time-out but the chart and its planted questions are the case). Never once the
 * case is finished.
 */
export function showPrebrief(o: { timeOutDone: boolean; hasChart: boolean; chartBriefDone: boolean; finished: boolean }): boolean {
  return !o.finished && (!o.timeOutDone || (o.hasChart && !o.chartBriefDone));
}

// --- rhythm and haemodynamic events (diag-rhythm-haemodynamic-events) -----------------

/**
 * Events the session raises for the rhythm and the haemodynamics, beyond the patient adapter's (vf, vt,
 * atrial-fibrillation, av-block, bradycardia, hypotension) and the pressure system's contrast-hold-up:
 * 'vagal' while the patient's vagal reaction is under way (the engine's vagal level above
 * MP_RHYTHM_ORDERS.vagalEventLevel), and 'bleeding' once the learner's look for bleeding has found it
 * (complications are named only after the learner's assessment). (The reachability report reads the
 * diagnostic lab's raises from src/ui/lab/diagnosticContext.ts; this list is what that should add.)
 */
export const RHYTHM_SESSION_EVENTS = ["vagal", "bleeding"] as const satisfies readonly LabEvent[];

/** The patient events the rhythm package's tips need, all raised through the patient adapter or the pressure system already. */
export const RHYTHM_TIP_EVENTS = ["vf", "vt", "atrial-fibrillation", "av-block", "bradycardia", "hypotension", "contrast-hold-up"] as const satisfies readonly LabEvent[];

/**
 * MODEL PARAMETERS of the rhythm orders (docs/realism/facts/pkg-diag-rhythm-haemodynamic-events.md), each
 * a setting of the simulator unless a source is given.
 */
export const MP_RHYTHM_ORDERS = {
  /** the energies the defibrillator offers, J, and the one it starts on (the lab's earlier fixed charge) */
  energiesJ: [50, 100, 150, 200, 300, 360] as readonly number[],
  defaultEnergyJ: 200,
  /** pads on and pacing captures this long after external pacing is ordered, s */
  externalPacingSetupS: 30,
  /** a transvenous wire placed and capturing this long after it is ordered, s (the shared cause model's MP_CAUSES.paceS) */
  transvenousPacingSetupS: MP_CAUSES.paceS,
  /** the pacing rate when none is chosen, bpm */
  pacingRateBpm: 70,
  /**
   * overdrive pacing of sustained VT through a transvenous wire: paced this many beats per minute above
   * the VT (Oxford's 15-20, 05-patient-complications.ts:458), ending the VT with this chance (Oxford's
   * 80-90%, the same line, mid value), else accelerating it into VF with this chance (MODEL: the text
   * says only that it can)
   */
  overdriveAboveBpm: 15,
  overdriveSuccessP: 0.85,
  overdriveVfP: 0.05,
  /** legs up: the volume that moves into the central circulation and over how long, mL and s */
  legsUpMl: 150,
  legsUpOverS: 30,
  /** the time limits offered for a vagal diagnosis, s ('a few minutes', 05-patient-complications.ts:328) */
  vagalLimitsS: [120, 180, 300] as readonly number[],
  /**
   * the systolic below which the rhythm rules take a hypotension as significant for verapamil, mmHg
   * (MODEL PARAMETER: the physiologist's call-out threshold, labTeam.ts MP_CALLOUT_SYSTOLIC_MMHG)
   */
  lowSystolicMmHg: MP_CALLOUT_SYSTOLIC_MMHG,
  /** the vagal look-alikes: the vascular tone follows the slowing with this lag, s (the emergency course's vagalSvrLagS), so the rate falls first */
  vagalSvrLagS: 20,
  /** the engine's vagal level above which the session raises 'vagal' */
  vagalEventLevel: 0.4,
  /** a synchronised shock with the patient's conscious level above this and sedation below sedatedAt is given to an awake patient */
  awakeConscious: 0.6,
  sedatedAt: 0.3,
  /** an Amplatz deep on the cusp holds the aortic valve open: the engine's aortic regurgitation, 0..1 */
  amplatzCuspAr: 0.5,
  /** the slow pulse of a vagal look-alike: the engine's vagal level and how long it is held, s (site.ts MP_PUNCTURE_BLEED) */
  mimicVagalLevel: MP_PUNCTURE_BLEED.slowPulseLevel,
  mimicVagalHoldS: MP_PUNCTURE_BLEED.slowPulseHoldS,
  /**
   * the tamponade of a vagal look-alike: blood into the pericardium, mL/s, stopping by itself at this
   * volume, mL (faster than the shared model's MP_CAUSES.tamponadeMlS, so fluid and atropine do not hold
   * the pressure for long)
   */
  mimicTamponadeMlS: 1.0,
  mimicTamponadeCapMl: 200,
  /** a pericardial drain removes up to this volume, mL (the shared cause model's MP_CAUSES.drainMl) */
  drainMl: MP_CAUSES.drainMl,
  /** the pericardial volume an echo reports as an effusion, mL (the patient adapter's effusionMl) */
  echoEffusionMl: 20,
};

/** A rhythm drug or fluid the Rhythm tab offers, with its source in the module text. */
export interface RhythmDrugEntry {
  id: string;
  drug: DrugId | "saline";
  label: string;
  /** in the formulary unit (µg for adrenaline and adenosine) or mL for saline; a function of the weight for flecainide */
  dose: number | ((weightKg: number) => number);
  unit: "mg" | "µg" | "mL" | "U";
  /** what the dose is written as in the menu */
  doseText: string;
  source: string;
}

/** The menu: only doses the module text states. */
export const RHYTHM_DRUGS: readonly RhythmDrugEntry[] = [
  { id: "atropine-0.5", drug: "atropine", label: "Atropine", dose: 0.5, unit: "mg", doseText: "0.5 mg IV", source: "Oxford 0.5-1.0 mg IV; Brilakis 0.5 mg repeated to 3 mg (complication-management/05-patient-complications.ts:341)" },
  { id: "atropine-1", drug: "atropine", label: "Atropine", dose: 1, unit: "mg", doseText: "1 mg IV", source: "Oxford 0.5-1.0 mg IV (05-patient-complications.ts:341)" },
  { id: "saline-250", drug: "saline", label: "Fast saline", dose: 250, unit: "mL", doseText: "250 mL", source: "fast 0.9% saline for a vagal reaction (05-patient-complications.ts:262); the volume is the drugs menu's MODEL PARAMETER (250 mL, its smaller bolus)" },
  { id: "adrenaline-1mg", drug: "adrenaline", label: "Adrenaline", dose: 1000, unit: "µg", doseText: "1 mg IV", source: "ERC 2021: 1 mg IV after the third shock, then every 3-5 minutes (complex-pci/08-complex-patients.ts:622)" },
  { id: "amiodarone-300", drug: "amiodarone", label: "Amiodarone", dose: 300, unit: "mg", doseText: "300 mg IV", source: "300 mg IV after three shocks (08-complex-patients.ts:622)" },
  { id: "amiodarone-150", drug: "amiodarone", label: "Amiodarone", dose: 150, unit: "mg", doseText: "150 mg IV", source: "150 mg after five shocks (08-complex-patients.ts:622); 150 mg over 10 minutes for tolerated VT (05-patient-complications.ts:457)" },
  { id: "lidocaine-50", drug: "lidocaine", label: "Lidocaine", dose: 50, unit: "mg", doseText: "50 mg IV over 2 minutes", source: "Oxford, tolerated VT with a stable pressure (05-patient-complications.ts:457)" },
  { id: "metoprolol-5", drug: "metoprolol", label: "Metoprolol", dose: 5, unit: "mg", doseText: "5 mg IV", source: "Oxford, tolerated VT (05-patient-complications.ts:457)" },
  { id: "adenosine-6", drug: "adenosine", label: "Adenosine", dose: 6000, unit: "µg", doseText: "6 mg IV with a flush", source: "Oxford, SVT: 6-18 mg IV bolus followed by a saline flush (pci-manual/04-lab-drugs.ts:857)" },
  { id: "adenosine-12", drug: "adenosine", label: "Adenosine", dose: 12000, unit: "µg", doseText: "12 mg IV with a flush", source: "Oxford, SVT: 6-18 mg IV bolus followed by a saline flush (pci-manual/04-lab-drugs.ts:857)" },
  { id: "verapamil-5", drug: "verapamil", label: "Verapamil", dose: 5, unit: "mg", doseText: "5 mg slow IV", source: "Oxford, SVT that restarts: 5-10 mg by slow IV injection, not with impaired LV function or significant hypotension (pci-manual/04-lab-drugs.ts:857)" },
  {
    id: "flecainide",
    drug: "flecainide",
    label: "Flecainide",
    dose: (kg) => Math.min(150, 2 * kg),
    unit: "mg",
    doseText: "2 mg/kg IV (at most 150 mg) over 30 minutes",
    source: "Oxford, AF without structural heart disease (05-patient-complications.ts:425)",
  },
  { id: "heparin-5000", drug: "heparin", label: "Heparin", dose: 5000, unit: "U", doseText: "5000 IU IV", source: "Oxford, AF with compromise: heparin 5000-10,000 IU IV (pci-manual/04-lab-drugs.ts:855)" },
  { id: "midazolam-1", drug: "midazolam", label: "Midazolam (sedation for cardioversion)", dose: 1, unit: "mg", doseText: "1 mg IV", source: "IV benzodiazepine sedation for synchronised cardioversion (08-complex-patients.ts:610); 1 mg is the sedation lesson's dose (04-lab-drugs.ts:140)" },
];

export type DefibMode = "unsynchronised" | "synchronised";
export type PacingKind = "external" | "transvenous";
export type ReconsiderAs = "bleeding" | "tamponade" | "infarction";

/** One line of the rhythm orders' log (the tab and the debrief read these). */
export interface RhythmOrderEntry {
  /** lab time, s */
  t: number;
  kind: "shock" | "charge" | "mode" | "energy" | "cpr" | "pacing" | "overdrive" | "legs" | "drug" | "limit" | "look" | "treat";
  text: string;
  /** what the operator sees or hears of it (shown in the tab) */
  note?: string;
  /** what it did to the patient (the record and the debrief only; never shown on the live screen) */
  outcome?: string;
}

/** A VF episode with what the catheter was doing at its onset (event data for the debrief). */
export interface VfEpisode {
  /** lab time of the onset and of the return of an organised rhythm (null while it lasts), s */
  t: number;
  endedAt: number | null;
  cause: string;
  catheterId: string;
  engagement: string;
  tipState: TipPressureState;
  tipLocation: string;
  conus: boolean;
  /** shocks delivered during it */
  shocks: number;
}

/** The hazard one push carried (for the debrief and the tests). */
export interface PushRisk {
  /** lab time of the press, s */
  t: number;
  side: "left" | "right";
  ml: number;
  input: InjectionHazardDetail;
  /** the probability that the push itself brought VF */
  pushP: number;
  /** seconds the contrast was held by an obstructing tip after the push, and the probability that brought */
  dwellS: number;
  dwellP: number;
  /** the reason, when it brought VF */
  vf: string | null;
}

/** What the session records for the debrief (record()). */
export interface RhythmRecord {
  orders: readonly RhythmOrderEntry[];
  vfEpisodes: readonly VfEpisode[];
  pushRisks: readonly PushRisk[];
  vagal: VagalWatchRecord;
  /** the cause a scenario started (truth, for the debrief only), and when, lab s */
  hypotensionCause: { id: string; startedAt: number } | null;
  /** a synchronised shock was given with the patient awake */
  awakeShocks: number;
  /** the stops the attending's rhythm rules made, newest last */
  stops: readonly MentorUtterance[];
}

/** What the Rhythm tab shows. Nothing here names the rhythm or the cause: the monitor shows the rhythm. */
export interface RhythmReadout {
  defib: { mode: DefibMode; energyJ: number; charged: number; charging: boolean; cleared: boolean; shocks: number };
  cpr: boolean;
  pacing: { state: "off" | "setting-up" | "pacing"; kind: PacingKind | null; rateBpm: number | null; readyInS: number | null };
  legsUp: boolean;
  /** seconds since the first vagal treatment, and the limit set (null: none) */
  vagal: { sinceTreatedS: number | null; limitS: number | null };
  /** the findings of the looks for another cause, newest last */
  findings: readonly { as: ReconsiderAs; text: string }[];
  /** the last order lines, newest last */
  log: readonly RhythmOrderEntry[];
}

/** What a rhythm order returned. */
export type RhythmResult = { ok: true; text: string } | { ok: false; reason: "stopped" | "refused" | "nothing"; text: string; utterance?: MentorUtterance };

/** What the Rhythm tab asks of the lab (the 'rhythm' capability). */
export interface RhythmCapability {
  readonly drugs: readonly RhythmDrugEntry[];
  readonly energies: readonly number[];
  readonly vagalLimits: readonly number[];
  subscribe(fn: () => void): () => void;
  version(): number;
  readout(): RhythmReadout;
  setMode(m: DefibMode): void;
  setEnergy(j: number): void;
  charge(): void;
  clear(): void;
  shock(): RhythmResult;
  setCpr(on: boolean): void;
  orderPacing(kind: PacingKind, rateBpm?: number): RhythmResult;
  stopPacing(): void;
  overdrive(): RhythmResult;
  setLegsUp(on: boolean): void;
  give(id: string): RhythmResult;
  setVagalTimeLimit(s: number): void;
  reconsider(as: ReconsiderAs): RhythmResult;
  /** treat what a look found: control the bleeding (pressure and the general measures) or drain the pericardium */
  treat(what: "control-bleeding" | "drain-pericardium"): RhythmResult;
  record(): RhythmRecord;
}

declare module "../lab/controls/types" {
  interface LabCapabilities {
    /** the diagnostic lab's rhythm orders (RhythmTab) */
    rhythm: RhythmCapability;
  }
}

const RHYTHM_CAUSE_SOURCE = "diag-rhythm-haemodynamic-events (src/ui/sim/labSession.ts; module text in src/simulation/diagnosticScenarios/rhythm.ts)";

/** A cause run whose only treatment is the given one (or none), with an optional tick. */
function causeRun(causeId: string, o: { stops?: readonly string[]; onStop?: (port: HypotensionEnginePort) => void; tick?: (port: HypotensionEnginePort, dtS: number) => void } = {}): CauseRun {
  let stopped = false;
  return {
    causeId,
    tick: (port, dtS) => {
      if (!stopped) o.tick?.(port, dtS);
    },
    treat: (port, t) => {
      if (!o.stops?.includes(t)) return false;
      if (!stopped) {
        stopped = true;
        o.onStop?.(port);
      }
      return true;
    },
    stopped: () => stopped,
  };
}

/** The bleeding cause's bridge rule (the shared model's), for the hidden bleed. */
const BLEED_BRIDGE = hypotensionCause("bleeding")?.bridge ?? { right: [], acceptable: ["noradrenaline", "phenylephrine", "metaraminol"], otherwise: "Volume and control of the bleeding", expected: "Fluid, blood and control of the bleeding site", causeFirst: true };
const TAMPONADE_BRIDGE = hypotensionCause("tamponade")?.bridge ?? { right: [], acceptable: ["noradrenaline"], otherwise: "Drainage treats it", expected: "Pericardial drainage", causeFirst: true };

/**
 * The diagnostic lab's own causes in the shared hypotension model (hypotensionCauses.ts): the Amplatz
 * on the cusp, nitrate vasodilation without a PDE-5 inhibitor, and the two vagal look-alikes (a hidden
 * retroperitoneal bleed from a high puncture, with the slow pulse it often brings, and a tamponade
 * with a vagal start). Registered when this module loads.
 */
export const DIAG_HYPOTENSION_CAUSES: readonly HypotensionCause[] = [
  {
    id: "diag-amplatz-cusp",
    mechanism: "cardiac",
    label: "An Amplatz holding the aortic cusp open (acute aortic regurgitation)",
    signature: { filling: "high", output: "low", ra: "normal", rate: "fast", cuff: "low" },
    treatment: "Withdraw the Amplatz a little off the cusp and watch the trace (tip diag-hypo-amplatz-valve, Brilakis)",
    treatments: [],
    bridge: { right: [], acceptable: [], otherwise: "A drug before the catheter came off the valve", expected: "No drug: withdraw the catheter", causeFirst: true },
    lessonId: "cm-patient-complications-hypotension",
    source: RHYTHM_CAUSE_SOURCE,
    start(port) {
      const p = port as HypotensionEnginePort & { setAorticRegurgitation?(s: number | null): void };
      if (!p.setAorticRegurgitation) return null;
      p.setAorticRegurgitation(MP_RHYTHM_ORDERS.amplatzCuspAr);
      return causeRun("diag-amplatz-cusp");
    },
  },
  {
    id: "diag-post-nitrate",
    mechanism: "vasodilation",
    label: "Nitrate vasodilation (no PDE-5 inhibitor)",
    signature: { filling: "low", output: "normal", ra: "low", rate: "fast", cuff: "low" },
    treatment: "No more nitrate, saline and time; a vasopressor if the fall is severe or persists, and another cause if it does not recover (tip diag-hypo-after-vasodilator)",
    treatments: ["fluid", "stop-drug"],
    bridge: { right: ["phenylephrine"], acceptable: ["noradrenaline", "metaraminol"], otherwise: "Saline and time, a vasopressor only if severe or persistent", expected: "Saline, time and phenylephrine or noradrenaline if needed", causeFirst: false },
    lessonId: "cm-patient-complications-hypotension",
    source: RHYTHM_CAUSE_SOURCE,
    start(port) {
      if (!port.giveDrug) return null;
      // Brilakis's intracoronary dose above 120 mmHg systolic (6.3; 04-lab-drugs.ts:251), given here as the cause
      port.giveDrug("gtn", 200, "ic");
      return causeRun("diag-post-nitrate", { stops: ["stop-drug"] });
    },
  },
  {
    id: "diag-hidden-bleed",
    mechanism: "hypovolaemia",
    label: "A hidden retroperitoneal bleed from a high femoral puncture, with a slow pulse",
    signature: { filling: "low", output: "low", ra: "low", rate: "slow", cuff: "low" },
    treatment: "General measures, the bladder screened and the source controlled; a slow pulse does not make it vagal (cm-access-complications-femoral-bleeding)",
    treatments: ["control-bleeding", "blood", "fluid"],
    bridge: BLEED_BRIDGE,
    lessonId: "cm-patient-complications-hypotension",
    source: RHYTHM_CAUSE_SOURCE,
    start(port) {
      if (!port.setHaemorrhage) return null;
      port.setHaemorrhage(MP_PUNCTURE_BLEED.retroperitonealMlS);
      port.forceVagal?.(MP_RHYTHM_ORDERS.mimicVagalLevel, MP_RHYTHM_ORDERS.mimicVagalHoldS);
      let lost = 0;
      return causeRun("diag-hidden-bleed", {
        stops: ["control-bleeding"],
        tick: (p, dtS) => {
          lost += MP_PUNCTURE_BLEED.retroperitonealMlS * dtS;
          // a bleed into a closed space slows as it fills (site.ts MP_PUNCTURE_BLEED, to the shared model's slow rate)
          if (lost >= MP_PUNCTURE_BLEED.retroperitonealSlowAfterMl) p.setHaemorrhage?.(MP_CAUSES.bleedSlowMlS);
        },
        onStop: (p) => p.setHaemorrhage?.(0),
      });
    },
  },
  {
    id: "diag-vagal-tamponade",
    mechanism: "cardiac",
    label: "Tamponade with a vagal start, that does not recover",
    signature: { filling: "normal", output: "low", ra: "high", rate: "fast", cuff: "low" },
    treatment: "An echo at once if there is any doubt, and drainage (cm-perforation)",
    treatments: ["drain-pericardium"],
    bridge: TAMPONADE_BRIDGE,
    lessonId: "cm-patient-complications-hypotension",
    source: RHYTHM_CAUSE_SOURCE,
    start(port) {
      if (!port.setPericardialInflow) return null;
      const M = MP_RHYTHM_ORDERS;
      let ml = 0;
      port.setPericardialInflow(M.mimicTamponadeMlS);
      port.forceVagal?.(M.mimicVagalLevel, M.mimicVagalHoldS / 4);
      return causeRun("diag-vagal-tamponade", {
        stops: ["drain-pericardium"],
        tick: (p, dtS) => {
          ml += M.mimicTamponadeMlS * dtS;
          if (ml >= M.mimicTamponadeCapMl) p.setPericardialInflow?.(0);
        },
        onStop: (p) => {
          p.setPericardialInflow?.(0);
          p.drainPericardium?.(M.drainMl);
        },
      });
    },
  },
];
for (const c of DIAG_HYPOTENSION_CAUSES) registerHypotensionCause(c);

/** The cause id a vagal-mimic scenario runs at this case's seed: a true vasovagal reaction (the shared model's), or a look-alike. */
export function vagalMimicCauseId(caseId: string): "vagal" | "diag-hidden-bleed" | "diag-vagal-tamponade" {
  const seed = caseId.split("|")[2] ?? caseId;
  const c: VagalMimicCause = vagalMimicCause(seed);
  return c === "hidden-bleed" ? "diag-hidden-bleed" : c === "tamponade" ? "diag-vagal-tamponade" : "vagal";
}

/** The rhythm scenario's start state for a case (null for any other case). */
export function rhythmSetupFor(c: Pick<AnatomyCase, "scenarioId">): RhythmSetup | null {
  return (c.scenarioId && rhythmSetups[c.scenarioId]) || null;
}

/** Structural heart disease on the chart, as Oxford reads it for flecainide: a reduced LVEF, a valve lesion, or coronary disease in the history (an ACS, prior CABG). */
export function chartStructuralDisease(c: Pick<AnatomyCase, "chart" | "grafts">, indication?: Indication): boolean {
  const ch = c.chart;
  if (!ch) return true;
  if ((ch.echo?.lvef ?? 60) < 50) return true;
  if ((ch.echo?.valves ?? []).some((v) => v.severity !== "mild")) return true;
  if ((c.grafts ?? []).length || ch.operationNote) return true;
  return !!indication && indication !== "SA";
}

/**
 * The rhythm orders of one diagnostic session (the 'rhythm' capability): the defibrillator, CPR,
 * pacing, legs up, the rhythm drugs checked against the chart by the attending's rhythm rules, the
 * vagal time limit, and the look for another cause. The record goes to the debrief.
 */
export class RhythmOrders implements RhythmCapability {
  readonly drugs = RHYTHM_DRUGS;
  readonly energies = MP_RHYTHM_ORDERS.energiesJ;
  readonly vagalLimits = MP_RHYTHM_ORDERS.vagalLimitsS;
  private mode: DefibMode = "unsynchronised";
  private energyJ = MP_RHYTHM_ORDERS.defaultEnergyJ;
  private cpr = false;
  private pacing: { kind: PacingKind; rateBpm: number; readyAt: number; on: boolean } | null = null;
  private legsUp = false;
  private readonly orders: RhythmOrderEntry[] = [];
  private readonly findings: { as: ReconsiderAs; text: string }[] = [];
  private readonly stops: MentorUtterance[] = [];
  private vagal: VagalWatchRecord = { treatedAt: null, limitS: null, limitSetAt: null, reconsideredAt: null, reconsideredAs: null };
  private awakeShocks = 0;
  private rev = 0;
  private listeners = new Set<() => void>();
  private readonly rng: SeededRng;

  constructor(private readonly s: DiagnosticLabSession) {
    this.rng = new SeededRng("rhythm-orders:" + s.caseId);
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  version(): number {
    return this.rev;
  }

  private now(): number {
    return this.s.wall();
  }

  readout(): RhythmReadout {
    const d = this.s.engine.vitals().defib;
    const t = this.now();
    const p = this.pacing;
    return {
      defib: { mode: this.mode, energyJ: this.energyJ, charged: d.charged, charging: d.charging, cleared: d.cleared, shocks: d.shocks },
      cpr: this.cpr,
      pacing: p ? { state: p.on ? "pacing" : "setting-up", kind: p.kind, rateBpm: p.rateBpm, readyInS: p.on ? null : Math.max(0, Math.ceil(p.readyAt - t)) } : { state: "off", kind: null, rateBpm: null, readyInS: null },
      legsUp: this.legsUp,
      vagal: { sinceTreatedS: this.vagal.treatedAt === null ? null : Math.max(0, t - this.vagal.treatedAt), limitS: this.vagal.limitS },
      findings: this.findings.slice(),
      // the outcome of an order stays in the record: the tab shows what was done and what the operator saw
      log: this.orders.slice(-6).map(({ outcome: _o, ...shown }) => shown),
    };
  }

  setMode(m: DefibMode) {
    if (m === this.mode) return;
    this.mode = m;
    this.log("mode", m === "synchronised" ? "Synchronised mode on" : "Synchronised mode off");
  }

  setEnergy(j: number) {
    if (!this.energies.includes(j) || j === this.energyJ) return;
    this.energyJ = j;
    this.log("energy", `${j} J selected`);
  }

  charge() {
    this.s.engine.charge(this.energyJ);
    this.log("charge", `Charging to ${this.energyJ} J`);
  }

  clear() {
    this.s.engine.clearForShock();
    this.log("charge", "All clear");
  }

  shock(): RhythmResult {
    const e = this.s.engine;
    const v = e.vitals();
    if (!(v.defib.charged > 0)) {
      this.log("shock", "Shock pressed: not charged", "nothing delivered");
      return { ok: false, reason: "nothing", text: "The defibrillator is not charged." };
    }
    if (this.mode === "synchronised") {
      const awake = v.symptoms.conscious > MP_RHYTHM_ORDERS.awakeConscious && v.symptoms.drowsy < MP_RHYTHM_ORDERS.sedatedAt && !e.rhythm.arrested;
      const out = e.cardiovert();
      if (out === "no-change" && e.rhythm.arrested) {
        // in VF or asystole there is no R wave to synchronise to: the charge is kept and nothing is delivered
        this.log("shock", "Synchronised shock pressed: no discharge", "waiting for an R wave");
        return { ok: false, reason: "refused", text: "No discharge: the defibrillator is waiting for an R wave." };
      }
      if (awake) this.awakeShocks++;
      this.log("shock", `Synchronised shock at ${v.defib.charged} J`, awake ? "the patient was awake" : undefined, out);
      this.s.notify();
      return { ok: true, text: `Synchronised shock delivered (${v.defib.charged} J).` };
    }
    const r = e.shock();
    this.s.noteShock();
    this.log("shock", `Unsynchronised shock at ${v.defib.charged} J`, undefined, r);
    this.s.notify();
    return { ok: true, text: `Shock delivered (${v.defib.charged} J).` };
  }

  setCpr(on: boolean) {
    if (on === this.cpr) return;
    this.cpr = on;
    this.s.engine.setCpr(on);
    this.log("cpr", on ? "Compressions started" : "Compressions stopped");
  }

  orderPacing(kind: PacingKind, rateBpm = MP_RHYTHM_ORDERS.pacingRateBpm): RhythmResult {
    if (!(rateBpm > 0)) return { ok: false, reason: "refused", text: "Choose a pacing rate." };
    const setup = kind === "external" ? MP_RHYTHM_ORDERS.externalPacingSetupS : MP_RHYTHM_ORDERS.transvenousPacingSetupS;
    // an external system already pacing bridges until the wire is in
    this.pacing = { kind, rateBpm, readyAt: this.now() + setup, on: false };
    this.log("pacing", kind === "external" ? `External pacing ordered at ${rateBpm}/min` : `Transvenous pacing wire ordered, ${rateBpm}/min`);
    return { ok: true, text: kind === "external" ? "Pads on for pacing; the team is setting it up." : "The team is preparing the venous access and the wire." };
  }

  stopPacing() {
    if (!this.pacing) return;
    this.pacing = null;
    this.s.engine.setPacing(null);
    this.log("pacing", "Pacing stopped");
  }

  overdrive(): RhythmResult {
    const e = this.s.engine;
    const p = this.pacing;
    if (!p || !p.on || p.kind !== "transvenous") return { ok: false, reason: "refused", text: "Overdrive pacing needs a transvenous wire in the right ventricle." };
    const v = e.vitals();
    if (v.rhythmKind !== "vt") {
      this.log("overdrive", "Overdrive pacing attempted", "no tachycardia to overdrive");
      return { ok: false, reason: "nothing", text: "There is no ventricular tachycardia to overdrive." };
    }
    const M = MP_RHYTHM_ORDERS;
    const rate = Math.round(e.rhythm.st.ventricularRate + M.overdriveAboveBpm);
    const u = this.rng.next();
    let out: string;
    if (u < M.overdriveSuccessP) {
      e.forceRhythm("sinus", "overdrive pacing");
      out = "terminated";
    } else if (u < M.overdriveSuccessP + M.overdriveVfP) {
      e.forceRhythm("vf", "overdrive pacing accelerated VT into VF");
      out = "accelerated";
    } else out = "no change";
    this.log("overdrive", `Overdrive pacing at ${rate}/min`, undefined, out);
    return { ok: true, text: `Overdrive pacing at ${rate}/min, stopped abruptly after capture.` };
  }

  setLegsUp(on: boolean) {
    if (on === this.legsUp) return;
    this.legsUp = on;
    const M = MP_RHYTHM_ORDERS;
    this.s.engine.fluid(on ? M.legsUpMl : -M.legsUpMl, M.legsUpOverS);
    if (on) this.vagalTreated();
    this.log("legs", on ? "Flat, legs raised" : "Legs down");
  }

  give(id: string): RhythmResult {
    const entry = RHYTHM_DRUGS.find((x) => x.id === id);
    const e = this.s.engine;
    if (!entry) return { ok: false, reason: "nothing", text: "Nothing to give." };
    const dose = typeof entry.dose === "function" ? Math.round(entry.dose(e.profile.weightKg)) : entry.dose;
    if (entry.drug === "saline") {
      e.fluid(dose, 120);
      this.vagalTreated();
      this.log("drug", `${entry.label} ${entry.doseText}`);
      return { ok: true, text: `${entry.label} running.` };
    }
    const action = this.rhythmAction(entry.drug, dose);
    const pol = this.s.controlsPolicy();
    const engine = new MentorEngine({ mode: pol.mode, entrustment: pol.entrustment }, RHYTHM_RULES);
    const input: MentorInput & Pick<RhythmMentorCtx, "rhythmAction"> = { ...mentorInputFromSim(this.s.store.getState(), null, this.now()), rhythmAction: action };
    // 'give' is a rule pre-action (RULE_PRE_ACTIONS); the engine's PreAction type has not been widened to it yet
    const g = engine.preAction("give" as unknown as PreAction, input);
    if (g.utterance) this.stops.push(g.utterance);
    if (!g.allow) {
      const text = g.utterance?.text ?? "Stopped.";
      this.log("drug", `${entry.label} ${entry.doseText} ordered`, "stopped by the attending", text);
      this.telemetry("rhythm.drug-stopped", { drug: entry.drug, dose, rule: g.utterance?.ruleId, text });
      return { ok: false, reason: "stopped", text, utterance: g.utterance };
    }
    const r = e.giveDrug(entry.drug, dose, "iv");
    if (!r.ok) {
      this.log("drug", `${entry.label} ${entry.doseText} ordered`, r.text);
      return { ok: false, reason: "refused", text: r.text };
    }
    if (entry.drug === "atropine") {
      this.vagalTreated();
      // the shared vagal cause answers to atropine
      this.s.hypotensionRun()?.treat(e, "atropine");
    }
    this.log("drug", `${entry.label} ${entry.doseText} given`);
    this.telemetry("rhythm.drug-given", { drug: entry.drug, dose });
    return { ok: true, text: `${entry.label} ${entry.doseText} given.` };
  }

  setVagalTimeLimit(sec: number) {
    if (!(sec > 0)) return;
    this.vagal = { ...this.vagal, limitS: sec, limitSetAt: this.now() };
    this.log("limit", `Time noted: reconsider if not better in ${Math.round(sec / 60)} min`);
  }

  reconsider(as: ReconsiderAs): RhythmResult {
    const t = this.now();
    if (this.vagal.reconsideredAt === null) this.vagal = { ...this.vagal, reconsideredAt: t, reconsideredAs: as };
    const text = this.finding(as);
    this.findings.push({ as, text });
    this.log("look", as === "bleeding" ? "Looked for bleeding: groin and pelvis screened" : as === "tamponade" ? "Echo for pericardial fluid" : "12-lead ECG for infarction", text);
    return { ok: true, text };
  }

  treat(what: "control-bleeding" | "drain-pericardium"): RhythmResult {
    const e = this.s.engine;
    const run = this.s.hypotensionRun();
    const answered = run ? run.treat(e, what) : false;
    if (what === "drain-pericardium") e.drainPericardium(MP_RHYTHM_ORDERS.drainMl);
    this.log("treat", what === "control-bleeding" ? "Bleeding measures: pressure above the puncture, fluid and blood, the source treated" : "Pericardium drained", undefined, answered ? "the cause answers to it" : "the cause does not answer to it");
    return { ok: true, text: what === "control-bleeding" ? "Bleeding measures started." : "Pericardial drain in." };
  }

  record(): RhythmRecord {
    return {
      orders: this.orders.slice(),
      vfEpisodes: this.s.vfEpisodes.slice(),
      pushRisks: this.s.pushRisks.slice(),
      vagal: { ...this.vagal },
      hypotensionCause: this.s.hypotensionCauseStarted(),
      awakeShocks: this.awakeShocks,
      stops: this.stops.slice(),
    };
  }

  /** Called every session step: pacing captures once set up. */
  step() {
    const p = this.pacing;
    if (p && !p.on && this.now() >= p.readyAt) {
      p.on = true;
      this.s.engine.setPacing(p.rateBpm);
      this.log("pacing", p.kind === "external" ? `External pacing on at ${p.rateBpm}/min` : `Transvenous wire in, pacing at ${p.rateBpm}/min`);
    }
  }

  /** What a look for another cause shows (an investigation's finding, not the diagnosis). */
  private finding(as: ReconsiderAs): string {
    const e = this.s.engine;
    const v = e.vitals();
    if (as === "bleeding") {
      const ml = e.bleedVolumeMl;
      // contrast given in the case reaches the bladder (the screening needs it, as the bleeding lesson says)
      const opacity = e.resp.st.contrastTotalMl > 0 ? 1 : 0;
      const reading = bladderTruth(opacity, bladderDentMm(ml));
      const groin = "The groin is soft, with no haematoma.";
      if (reading === "not-opacified") return `${groin} No contrast has been given yet, so the bladder cannot be seen on screening.`;
      if (reading === "dented") {
        this.s.events.hold(["bleeding"], this.now(), "rhythm");
        return `${groin} On screening the pelvis the bladder is pushed to one side.`;
      }
      return `${groin} The bladder outline on screening is normal.`;
    }
    if (as === "tamponade") return v.pericardialMl >= MP_RHYTHM_ORDERS.echoEffusionMl ? "Echo: a pericardial effusion, with the right ventricle collapsing in diastole." : "Echo: no pericardial effusion; the ventricles fill normally.";
    return v.stemi.met ? `12-lead ECG: ST elevation in ${v.stemi.groups.join(", ")}.` : "12-lead ECG: no new ST elevation.";
  }

  private rhythmAction(drug: DrugId, dose: number): RhythmDrugAction {
    const e = this.s.engine;
    const v = e.vitals();
    const st = this.s.store.getState();
    const indication = st.caseData.scenarioId ? diagScenarioById(st.caseData.scenarioId)?.indication : undefined;
    return {
      drug,
      dose,
      qtcS: e.profile.baseline.qtc,
      longQtcS: MP_INTERACTION.longQtcS,
      preExcitation: !!e.profile.preExcitation,
      rhythm: v.rhythmKind,
      avBlock: v.av,
      paced: e.pacing !== null,
      structural: chartStructuralDisease(st.caseData, indication ?? e.profile.indication),
      lvef: st.caseData.chart?.echo?.lvef ?? e.profile.lvef,
      poorLvefPct: MP_INTERACTION.poorLvefPct,
      systolic: v.art && v.tipState === "aortic" ? Math.round(v.art.sys) : v.nibp ? Math.round(v.nibp.sys) : null,
      lowSystolicMmHg: MP_RHYTHM_ORDERS.lowSystolicMmHg,
    };
  }

  private vagalTreated() {
    if (this.vagal.treatedAt === null) this.vagal = { ...this.vagal, treatedAt: this.now() };
  }

  private log(kind: RhythmOrderEntry["kind"], text: string, note?: string, outcome?: string) {
    this.orders.push({ t: this.now(), kind, text, ...(note !== undefined ? { note } : {}), ...(outcome !== undefined ? { outcome } : {}) });
    this.telemetry("rhythm.order", { kind, text, note, outcome });
    this.changed();
  }

  private telemetry(kind: string, data: Record<string, unknown>) {
    this.s.crew?.push([{ tWall: this.now(), tPatient: this.s.engine.time, kind, data }]);
  }

  private changed() {
    this.rev++;
    for (const f of this.listeners) f();
    this.s.notify();
  }
}

/** Case-session catheter names to the lab's catalogue. */
const CASE_CATHETER: Record<string, string> = { JR4: "JR4", JL4: "JL4", TIG: "TIG", AL1: "AL1", pigtail: "PIG" };

export class DiagnosticLabSession implements LabControlsTarget {
  /** the table-side controls show the diagnostic lab's tabs */
  readonly controlsLab = "diagnostic" as const;
  readonly caseId: string;
  readonly model: AnatomyModel;
  readonly tree: CoronaryTree;
  readonly engine: PatientEngine;
  readonly exposure = new ExposureLoop();
  readonly carm: CArmDrive;
  readonly table: TableDrive;
  readonly injector = new Injector(LUMENS["diag-6"], { primed: 0 });
  readonly fluoroLoop = new FluoroLoop();
  memories: (CArm | null)[] = DEFAULT_MEMORIES.slice();
  /** memory being driven (key or button held) */
  drivingMemory: number | null = null;
  /** wall time the breath-hold started, or null while breathing */
  breathHoldSince: number | null = null;
  /** the run being recorded (cine pedal down) */
  run: RunRecorder | null = null;
  /** the injection whose contrast is in the vessels */
  contrast: ContrastRun | null = null;
  /** asked before an injection starts (the attending's safety stop); false blocks it */
  beforeInject: (() => boolean) | null = null;
  /** the beam may be enabled (false until the time-out in modes that require one) */
  beamGate: (() => boolean) | null = null;
  /** wall time of the last exposed image (the monitor holds it: last-image hold) */
  lastImageAt: number | null = null;
  /** the team and the lab's sound (C4); null when the lab was built without them (tests) */
  readonly crew: LabTeam | null;
  /** the hand-over this lab started from (null: a stand-alone diagnostic case) */
  readonly start: LabStart | null;
  /** air still waiting in the line or lumen (mL), and the coronary air now clearing (mL) */
  private airPendingMl = 0;
  private airMl = 0;
  private airSide: "left" | "right" = "left";
  private simT = 0;
  private storeTickAcc = 0;
  private slowAcc = 0;
  private notifyAcc = 0;
  private lastEng: EngagementState | null = null;
  private catheterId: string;
  private vfForced = false;
  private plungerOn = false;
  private aspirating = false;
  private flushing = false;
  private listeners = new Set<() => void>();
  private controlsListeners = new Set<() => void>();
  /** bumped when a store slice the table-side controls show changes */
  private controlsRev = 0;
  private capabilities = new Map<keyof LabCapabilities, LabCapabilities[keyof LabCapabilities]>();
  private stepListeners = new Set<(dt: number) => void>();
  private unsub: (() => void)[] = [];
  version = 0;
  disposed = false;

  // --- the lab tips (diag-tip-context) ---------------------------------------------
  /** the tip events of this lab, on lab time: transient events and the case's properties (held) */
  readonly events: EventLog;
  /** the time-out has been completed or is not required (the shell sets it from the attending) */
  timeOutDone: boolean;
  /** a catheter has reached the aortic root (the legacy engine starts there: set by the first beam, push or hand movement) */
  rootReached: boolean;
  /** the finish step is open (a later package's study report opens it) */
  finishing = false;
  /**
   * The physics reading of the tip for the tip context, while the rod mechanics runs: vessel passes
   * through as it is; tipZone is "lv" when kind is "in-lv" or "below-valve" or the tip has prolapsed,
   * "route" when kind is "not-in-root", else "root"; exchange while the crew exchanges the catheter
   * over the wire; graft only once graft geometry exists.
   */
  physicsReading: DiagnosticPhysicsReading | null = null;
  /** the rod mechanics (diag-rod-physics), or null while the simple model drives the catheter */
  physics: DiagnosticPhysics | null = null;
  /** whether the rod mechanics was asked for and why it is not running */
  physicsMode: PhysicsMode = { on: false, reason: null };
  /** set when the lab fell back to the simple model during this case: the banner's text */
  physicsBanner: string | null = null;
  private physPressure: PressureState | null = null;
  private physWedged = false;
  private lastPhysReading: PhysicsReading | null = null;
  private lastPhysTip: TipInput | null = null;
  /**
   * The physics snapshots taken at decision points (the injection, the catheter change), newest last,
   * at most PHYSICS_SNAPSHOT_KEEP. Kept on the session, so they outlive a fallback to the simple model,
   * for the run recorder and the debrief.
   */
  readonly physicsSnapshots: PhysicsSnapshotEntry[] = [];
  /** the side of the last filmed diagnostic run, while the catheter stays engaged there */
  lastFilmedSide: "left" | "right" | null = null;
  /** the session modules (src/ui/sim/modules/) */
  readonly modules: readonly SessionModule[];
  private moduleOffs: (() => void)[] = [];
  private exchangeUntil = -Infinity;
  private lastInsertion = 0;
  private nearSince: number | null = null;
  private storeEventsSeen = 0;
  private handStart = { insertion: 0, torque: 0, wire: 0 };
  private readonly patientEvents: PatientEventAdapter;

  // --- the pressure system (diag-pressure-transducer) --------------------------------
  /** the catheter in the patient is plugged with thrombus or plaque */
  plugged = false;
  /** thrombus in the sheath: the next catheter through it comes out plugged until the side arm is aspirated */
  sheathThrombus = false;
  /** the engine's tip state at the last slow tick */
  tipState: TipPressureState = "aortic";
  private hypoSince: number | null = null;
  /** the engine's displayed numbers at the last slow tick clear of a flush (MP_FLUSH_HOLD_BEATS) */
  private cleanArt: { sys: number; dia: number } | null = null;
  private hardPulled = false;
  private lastWireLead = 0;

  // --- rhythm and haemodynamic events (diag-rhythm-haemodynamic-events) ---
  /** the rhythm scenario's start state, or null (a hand-over brings its own patient) */
  readonly rhythmSetup: RhythmSetup | null;
  /** the rhythm orders (the 'rhythm' capability) */
  readonly rhythmOrders: RhythmOrders;
  /** the VF episodes of the case, with what the catheter was doing at each onset */
  readonly vfEpisodes: VfEpisode[] = [];
  /** the hazard each push carried, newest last */
  readonly pushRisks: PushRisk[] = [];
  /** where a high femoral puncture of the scenario bleeds (site.ts punctureBleed), or null */
  readonly puncture: PunctureBleed | null = null;
  private readonly rhythmOwnerId = "diag-session-" + uid();
  private vfOpen: VfEpisode | null = null;
  private lastVfCause: string | null = null;
  private hazardPush: { trace: InjectionTrace; risk: PushRisk; drawn: boolean } | null = null;
  private blockFired = false;
  private cuspAr = 0;
  private arBefore = 0;
  private timeOutAt: number | null = null;
  private hypoRun: CauseRun | null = null;
  private hypoStarted: { id: string; startedAt: number } | null = null;

  // --- filling and run quality (diag-injection-run-quality) ---
  /** the run scenario's start state, or null */
  readonly runSetup: RunSetup | null;
  /** every push of the case, newest last; each is analysed once its flow has stopped */
  readonly pushes: PushRecord[] = [];
  /** the test puffs of the case, with the tip's classification */
  readonly testPuffs: TestPuffRecord[] = [];
  /** the quality of the newest stored cine run */
  lastRunQuality: RunQuality | null = null;
  /** the push in progress or still washing out, until it is analysed */
  private pending: PushRecord | null = null;
  /** the hand's last plunger fraction while the plunger is down */
  private plungerFraction: number | null = null;
  /** what the cine run in progress has recorded about itself */
  private runTrack: { startWall: number; fieldCm: number; fieldChanged: boolean; heldS: number; totalS: number; maxTableSpeed: number; travelMm: number; lastPan: { x: number; y: number }; push: PushRecord | null } | null = null;
  /** each stored run's analysis input, by run id (a later run can supply an earlier one's second projection) */
  private readonly runInputs = new Map<string, RunQualityInput>();

  constructor(
    readonly store: Store = useSimulatorStore,
    readonly input: InputSystem | null = null,
    start: LabStart | null = null,
    o: { team?: boolean; modules?: readonly SessionModuleFactory[]; physics?: SessionPhysicsOptions | false } = {}
  ) {
    this.start = start;
    if (start?.catheterId) {
      // the catheter the case session put in the aorta (a hand-over is not a catheter change)
      const id = CASE_CATHETER[start.catheterId] ?? start.catheterId;
      const s0 = store.getState();
      if (catheterById(id) && id !== s0.catheterId) {
        const changes = s0.score.catheterChanges;
        s0.setCatheter(id);
        store.setState((s) => ({ score: { ...s.score, catheterChanges: changes } }));
      }
    }
    const st = store.getState();
    this.caseId = st.caseData.id;
    this.model = st.model;
    this.tree = buildCoronaryTree(st.model, st.caseData);
    this.engine = start?.engine ?? new PatientEngine({ ...engineOptionsForCase(st.caseData), tree: this.tree, lesions: st.caseData.lesions });
    seedDose(this.exposure.dose, start?.dose);
    if (start?.air) this.airPendingMl = (start.air.line ? MP_AIR_PER_INSERT_ML : 0) + (start.air.lumen ? MP_AIR_PER_INSERT_ML : 0);
    this.carm = new CArmDrive(st.cArm);
    this.table = new TableDrive({ x: st.imaging.panX, y: st.imaging.panY, height: st.imaging.tableHeight });
    this.catheterId = st.catheterId;
    this.exposure.operator = { ...this.exposure.operator, access: st.caseData.accessRoute === "femoral" ? "femoral" : "radial" };
    this.exposure.exposure = { ...this.exposure.exposure, fluoroPps: st.imaging.pulseRate, cinePps: st.imaging.cineRate };
    // a pressure scenario's start (diag-pressure-transducer): the catheter at the root, a thrombus in
    // the sheath, a plugged catheter and faults in the line
    const setup = start ? null : pressureSetupFor(st.caseData);
    if (setup) {
      if (setup.catheterId && catheterById(setup.catheterId) && setup.catheterId !== st.catheterId) {
        const changes = st.score.catheterChanges;
        st.setCatheter(setup.catheterId);
        store.setState((s) => ({ score: { ...s.score, catheterChanges: changes } }));
        this.catheterId = store.getState().catheterId;
      }
      if (setup.parkedInsertion !== undefined) {
        const x = setup.parkedInsertion;
        store.setState({ controls: { ...initialControls(), insertion: x, cmdInsertion: x } });
        const s2 = store.getState();
        s2.setDifficulty(s2.difficulty); // recompute the tip and engagement at the parked position
      }
      this.sheathThrombus = !!setup.sheathThrombus;
      if (setup.plugged) this.setPlugged(true);
      for (const f of setup.faults ?? []) this.engine.transducer.setFault(f);
    }
    // a run scenario's start (diag-injection-run-quality): its resting flow always (it is the patient's), its
    // catheter at the root only when the session opens the case (a hand-over brings its own catheter)
    this.runSetup = runSetupFor(store.getState().caseData);
    const rc = start ? undefined : this.runSetup?.catheterId;
    if (rc && catheterById(rc) && rc !== store.getState().catheterId) {
      const s3 = store.getState();
      const changes = s3.score.catheterChanges;
      s3.setCatheter(rc);
      store.setState((s) => ({ score: { ...s.score, catheterChanges: changes } }));
      this.catheterId = store.getState().catheterId;
    }
    // a rhythm scenario's start (diag-rhythm-haemodynamic-events): its catheter, a rhythm already
    // running, and where a high femoral puncture bleeds; the engine owns the rhythm and judges each push
    this.rhythmSetup = start ? null : rhythmSetupFor(store.getState().caseData);
    const rs = this.rhythmSetup;
    if (rs?.catheterId && catheterById(rs.catheterId) && rs.catheterId !== store.getState().catheterId) {
      const s4 = store.getState();
      const changes = s4.score.catheterChanges;
      s4.setCatheter(rs.catheterId);
      store.setState((s) => ({ score: { ...s.score, catheterChanges: changes } }));
      this.catheterId = store.getState().catheterId;
    }
    if (rs?.startRhythm) this.engine.forceRhythm(rs.startRhythm.kind, "scenario", rs.startRhythm.rateBpm);
    if (rs?.highPuncture && st.caseData.accessRoute === "femoral") {
      const site = buildAccessSite("femoral", this.engine.profile);
      const x = highPunctureX(site);
      if (x !== null) this.puncture = punctureBleed(site, x);
    }
    this.engine.setInjectionHazards({});
    store.getState().setRhythmOwner(this.rhythmOwnerId);
    this.rhythmOrders = new RhythmOrders(this);
    this.provideCapability("rhythm", this.rhythmOrders);
    this.lastWireLead = store.getState().controls.wireInsertion;
    this.syncCatheter();
    this.provideCapability("patient", this.engine);
    // the store slices the table-side controls show (the same ones they selected before the registry)
    this.unsub.push(
      store.subscribe((s, p) => {
        if (s.imaging === p.imaging && s.cArm === p.cArm && s.pedal === p.pedal && s.catheterId === p.catheterId && s.fluoroOn === p.fluoroOn && s.policy === p.policy) return;
        this.controlsRev++;
        for (const f of this.controlsListeners) f();
      })
    );
    if (input) {
      const bus = input.bus;
      this.unsub.push(
        bus.on("pedal", (p) => this.setPedal(p)),
        bus.on("hand", (c) => {
          const s = this.store.getState();
          if (!s.finished) routeDiagnosticHand(c, this.physics?.active ? this.physics : null, s);
        }),
        bus.on("carm", (v) => {
          this.drivingMemory = null;
          this.carm.setCommandedVelocity(v.laoDegPerS, v.cranDegPerS);
        }),
        bus.on("table", (v) => this.table.setCommandedVelocity(v.xMmPerS, v.yMmPerS)),
        bus.on("syringe", (c) => this.onSyringe(c))
      );
    }
    this.crew =
      o.team === false
        ? null
        : new LabTeam({
            seed: this.caseId,
            patient: this.engine,
            input,
            carm: this.carm,
            table: this.table,
            imaging: () => {
              const s = this.store.getState();
              return { fluoroPps: s.imaging.pulseRate, cinePps: s.imaging.cineRate, fieldCm: s.imaging.field, fluoroLevel: this.exposure.exposure.fluoroLevel ?? "normal", fluoroMin: this.exposure.dose.totals.fluoroTimeS / 60 };
            },
            catheterSide: () => {
              const e = this.store.getState().engagement;
              return e.target === "left" || e.target === "right" ? e.target : null;
            },
            systolicCallout: true,
          });
    if (this.crew) {
      this.crew.onProtocol = (a) => {
        const s = this.store.getState();
        if (a.fluoroPps === 7.5 || a.fluoroPps === 15 || a.fluoroPps === 30) s.setPulseRate(a.fluoroPps);
        if (a.cinePps === 7.5 || a.cinePps === 15 || a.cinePps === 30) s.setCineRate(a.cinePps);
        if (a.fieldCm === 25 || a.fieldCm === 20 || a.fieldCm === 16 || a.fieldCm === 12) s.setField(a.fieldCm);
        if (a.fluoroLevel) this.exposure.exposure = { ...this.exposure.exposure, fluoroLevel: a.fluoroLevel };
        const s2 = this.store.getState();
        this.exposure.exposure = { ...this.exposure.exposure, fluoroPps: s2.imaging.pulseRate, cinePps: s2.imaging.cineRate };
        if (a.storeFluoro) this.storeFluoro();
        this.notify();
      };
    }
    // the lab tips: the event log on lab time (onsets go to the run's telemetry through the team),
    // the case's properties held for the whole case, and the patient-event adapter
    this.events = new EventLog({
      clock: () => this.simT,
      sink: (kind, data, t) => this.crew?.push([{ tWall: t, tPatient: this.engine.time, kind, data }]),
    });
    this.events.hold(caseEvents(st.caseData), 0, "case");
    this.patientEvents = new PatientEventAdapter(this.events);
    this.timeOutDone = !!start;
    this.rootReached = !!start;
    const s1 = store.getState();
    this.lastInsertion = s1.controls.insertion;
    this.handStart = { insertion: s1.controls.cmdInsertion, torque: s1.controls.cmdTorque, wire: s1.controls.wireInsertion };
    this.storeEventsSeen = s1.events.length;
    this.startPhysics(o.physics);
    this.modules = instantiateSessionModules(o.modules ?? sessionModuleFactories());
    for (const m of this.modules) {
      const off = m.attach(this);
      if (typeof off === "function") this.moduleOffs.push(off);
    }
  }

  // --- the lab tips ------------------------------------------------------------------

  /** What the session knows about the procedure now, for the tip context. */
  sessionView(): DiagnosticSessionView {
    return {
      injectorActive: this.injector.active,
      runLive: this.run !== null,
      exchange: this.simT <= this.exchangeUntil,
      lastFilmedSide: this.lastFilmedSide,
      timeOutDone: this.timeOutDone,
      rootReached: this.rootReached,
      finishing: this.finishing,
    };
  }

  /** Events active now: the event log's and the session modules'. */
  activeEvents(): LabEvent[] {
    const out = this.events.active();
    for (const m of this.modules) for (const e of m.events?.() ?? []) if (!out.includes(e)) out.push(e);
    return out;
  }

  /**
   * The diagnostic lab's tip context now (src/ui/lab/diagnosticContext.ts). When the classifier puts the tip in a
   * branch of the left main (a short left main entered superselectively), the context names that branch rather than
   * the left main (diag-injection-run-quality).
   */
  tipContext(): LabContext {
    const ctx = diagnosticContext({ store: diagnosticStoreSlice(this.store.getState()), session: this.sessionView(), physics: this.physicsReading, active: this.activeEvents() });
    if (ctx.vessel === "LM" && !this.physics?.active) {
      const branch = tipVesselOf(this.classifierVessel());
      if (branch === "LAD" || branch === "LCx") ctx.vessel = branch;
    }
    return ctx;
  }

  /** Open or close the finish step (the tips move to the finish phase while it is open). */
  setFinishStep(open: boolean) {
    if (this.finishing === open) return;
    this.finishing = open;
    this.notify();
  }

  /** Called by the shell when the attending's time-out state changes. */
  setTimeOutDone(done: boolean) {
    if (this.timeOutDone === done) return;
    this.timeOutDone = done;
    this.notify();
  }

  /**
   * The trackers behind the tip context, after every step (cheap): the first catheter at the root,
   * the exchange window, the last filmed side, and the store's transitions to an air embolism or a
   * dissection. `catheterChanged`: syncCatheter saw a new catheter this step.
   */
  private trackTips(catheterChanged: boolean) {
    const st = this.store.getState();
    const t = this.simT;
    const c = st.controls;
    if (!this.rootReached) {
      const z = this.physicsReading?.tipZone;
      // a hand on the catheter or the wire (the commanded hub position, so the tip's lag does not matter)
      const h = this.handStart;
      const moved = Math.abs(c.cmdInsertion - h.insertion) > 0.5 || Math.abs(c.cmdTorque - h.torque) > 0.05 || c.wireInsertion > h.wire;
      if (z ? z === "root" || z === "lv" : st.pedal.fluoro || st.pedal.cine || this.injector.active || !!st.bolus || moved || catheterChanged) this.rootReached = true;
    }
    if (catheterChanged) this.exchangeUntil = t + EXCHANGE_LOAD_S;
    if (c.wireInsertion >= EXCHANGE_WIRE_LEAD && c.insertion < this.lastInsertion - 1e-3) this.exchangeUntil = Math.max(this.exchangeUntil, t + EXCHANGE_HOLD_S);
    this.lastInsertion = c.insertion;
    const b = st.bolus;
    if (b && b.filmed && b.diagnostic && b.side) this.lastFilmedSide = b.side;
    if (this.lastFilmedSide && engagedSide(st.engagement) !== this.lastFilmedSide) this.lastFilmedSide = null;
    if (st.events.length < this.storeEventsSeen) this.storeEventsSeen = 0;
    for (let i = this.storeEventsSeen; i < st.events.length; i++) {
      const code = st.events[i].code;
      if (code === "air-embolism") this.events.raise("air", undefined, t, "store");
      else if (code === "dissection") this.events.raise("dissection", undefined, t, "store");
    }
    this.storeEventsSeen = st.events.length;
  }

  /**
   * The pressure system, four times a second (diag-pressure-transducer): the engine's trace class to
   * the store (or to the physics read-out), and the events of the line, the plug and true hypotension.
   */
  private trackPressure() {
    const v = this.engine.vitals();
    this.tipState = v.tipState;
    // a flush (held or fast) puts the bag's square wave into the beat numerics: hold the last numbers
    // from before it until the window has cleared, so nothing keyed on the store's systolic misfires
    const sinceFlush = this.engine.transducer.st.sinceFlushS;
    const rrS = 60 / Math.max(30, v.hr ?? 60);
    const flushHeld = sinceFlush !== undefined && sinceFlush < MP_FLUSH_HOLD_BEATS * rrS;
    if (!flushHeld) this.cleanArt = v.art;
    const art = flushHeld && v.art && this.cleanArt ? this.cleanArt : v.art;
    const p = pressureFromEngine({ tipState: v.tipState, art });
    if (this.physics?.active) this.physPressure = p;
    else this.store.getState().setEnginePressure(p);
    if (!this.events) return;
    const t = this.simT;
    const faults = this.engine.transducer.faults();
    const shown = v.art !== null;
    if (shown && faults.length) this.events.raise("transducer-fault", undefined, t, "transducer");
    // the trace the operator sees is damped by the line or a plug, whatever the tip is doing
    if (shown && (this.plugged || faults.some((f) => f === "air-bubble" || f === "off" || f === "disconnected"))) this.events.raise("pressure-damped", undefined, t, "transducer");
    // true hypotension: the aortic pressure itself is low with the tip free in the root, for a few seconds
    if (v.hr !== null && v.tipState === "aortic" && v.aortaTrue.sys < MP_HYPOTENSION_SYS_MMHG) {
      this.hypoSince ??= t;
      if (t - this.hypoSince >= MP_HYPOTENSION_HOLD_S) this.events.raise("hypotension", undefined, t, "patient");
    } else this.hypoSince = null;
  }

  /** The slower trackers (four times a second): engage-fail, VF, dissection, the patient and the dose. */
  private trackTipsSlow() {
    const st = this.store.getState();
    const t = this.simT;
    const e = st.engagement;
    // a tip the classifier puts in a branch of the left main (a short left main entered superselectively) is not an
    // engaged left main: the engage-fail a test puff there raised stays (diag-injection-run-quality)
    if (e?.isSelective && !this.superselective()) {
      this.nearSince = null;
      this.events.clear("engage-fail");
    } else if (e && this.timeOutDone && this.rootReached && (NEAR_OSTIUM as readonly string[]).includes(e.kind)) {
      if (this.nearSince === null) this.nearSince = t;
      if (t - this.nearSince > ENGAGE_FAIL_S) this.events.raise("engage-fail", undefined, t, "engagement");
    }
    // repeated prolapse onto the valve is a failed attempt to engage (rod mechanics)
    if (this.physics?.active && !e?.isSelective && this.timeOutDone && this.physics.recentProlapses() >= PROLAPSE_REPEAT) this.events.raise("engage-fail", undefined, t, "physics");
    if (st.arrhythmia === "vf") this.events.raise("vf", undefined, t, "store");
    if (st.dissection) this.events.raise("dissection", undefined, t, "store");
    // the patient: the adapter's hold (hypotension) is measured on lab time
    this.patientEvents.update({ ...this.engine.vitals(), t });
    // the substantial radiation dose levels (DOSE_TRIGGERS, src/simulation/dose.ts): held from then on
    const f = triggerFractions(this.exposure.dose.totals);
    if (!this.events.isActive("high-radiation-dose", t) && Math.max(f.kar, f.kap, f.fluoroTime, f.peakSkin) >= 1) this.events.hold(["high-radiation-dose"], t, "dose");
  }

  /**
   * Lab seconds since the session started: the sum of the steps the shell's frame loop has taken. The
   * syringe, the contrast lifecycle, runs and the attending all run on it, so a paused tab (no frames)
   * pauses the lab instead of letting a push run on unseen.
   */
  wall(): number {
    return this.simT;
  }

  private nowS(): number {
    return this.simT;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Called after every lab step (the attending's recorder samples here, so a hand-stepped hidden page is recorded too). */
  onStep(fn: (dt: number) => void): () => void {
    this.stepListeners.add(fn);
    return () => this.stepListeners.delete(fn);
  }

  notify() {
    this.version++;
    for (const f of this.listeners) f();
  }

  // --- table-side controls (LabControlsTarget) ---------------------------------------

  /** Called when the session publishes and when a store slice the controls show changes. */
  subscribeControls(fn: () => void): () => void {
    this.listeners.add(fn);
    this.controlsListeners.add(fn);
    return () => {
      this.listeners.delete(fn);
      this.controlsListeners.delete(fn);
    };
  }

  controlsVersion(): number {
    return this.version + this.controlsRev;
  }

  controlsPolicy(): LabPolicy {
    return this.store.getState().policy;
  }

  /** Register an optional capability for the table-side tabs (a session module or a later package). */
  provideCapability<K extends keyof LabCapabilities>(k: K, v: LabCapabilities[K] | null) {
    if (v === null) this.capabilities.delete(k);
    else this.capabilities.set(k, v);
  }

  capability<K extends keyof LabCapabilities>(k: K): LabCapabilities[K] | null {
    return (this.capabilities.get(k) as LabCapabilities[K] | undefined) ?? null;
  }

  // --- aspiration, flushing and plugs (diag-pressure-transducer) -------------------------

  /** Put a plug in (or take it out of) the catheter's lumen: the line sees it as damping. */
  setPlugged(on: boolean) {
    this.plugged = on;
    this.engine.transducer.setLumenPlug(on);
  }

  /**
   * Aspirate the catheter (the syringe drawn back on the catheter port). `pull` is how hard, 0..1:
   * against a blocked catheter a hard pull draws air in through the connector instead of blood.
   * Returns the outcome; the store records it and the gauze on the table shows what came back.
   */
  aspirate(pull = 0.4): AspirationResult | null {
    const st = this.store.getState();
    if (st.finished) return null;
    const outcome = aspirationOutcome({ plugged: this.plugged, tipState: this.engine.vitals().tipState, engagement: st.engagement, cram: st.tip?.cram ?? 0, pull });
    const material: AspirationResult["material"] = outcome === "free" ? "blood" : "none";
    st.aspirate({ outcome, material, from: "catheter" });
    const t = this.simT;
    if (outcome !== "free") this.events.raise("aspiration-failed", undefined, t, "aspiration");
    if (this.plugged) this.events.raise("catheter-plugged", undefined, t, "aspiration");
    if (outcome === "air") {
      // air drawn in through the connector waits in the lumen: the next push carries it (C3 air volume)
      this.airPendingMl += MP_AIR_PER_INSERT_ML;
      this.events.raise("air", undefined, t, "aspiration");
    }
    this.notify();
    return this.store.getState().lastAspiration;
  }

  /** Aspirate the sheath's side arm: a thrombus in the sheath comes out onto the gauze and is gone. */
  aspirateSheath(): AspirationResult | null {
    const st = this.store.getState();
    if (st.finished) return null;
    const material: AspirationResult["material"] = this.sheathThrombus ? "thrombus" : "blood";
    this.sheathThrombus = false;
    st.aspirate({ outcome: "free", material, from: "sheath" });
    this.notify();
    return this.store.getState().lastAspiration;
  }

  /**
   * Remove the catheter under continuous suction (the plug comes out with it, onto the gauze) and
   * bring in a fresh catheter of the same type over the wire. A thrombus still in the sheath plugs
   * the new one too, so the side arm is aspirated first.
   */
  removeUnderSuction() {
    const st = this.store.getState();
    if (st.finished) return;
    const hadPlug = this.plugged;
    this.setPlugged(false);
    st.aspirate({ outcome: hadPlug ? "plug" : "free", material: hadPlug ? "thrombus" : "blood", from: "catheter", via: "suction-removal" });
    // a new catheter of the same type: back at its natural seat in the root, over the wire
    this.store.setState((s) => ({ controls: initialControls(), aspirated: "unknown", score: { ...s.score, catheterChanges: s.score.catheterChanges + 1 } }));
    const s1 = this.store.getState();
    s1.setDifficulty(s1.difficulty); // recompute the tip and engagement from the reset controls
    this.lastInsertion = this.store.getState().controls.insertion;
    // a push still held in the vessels is booked before the catheter comes out
    if (this.injector.active) this.finishInjection();
    else this.injector.finish();
    this.injector.flush();
    this.exchangeUntil = this.simT + EXCHANGE_LOAD_S;
    if (this.physics?.active) {
      const id = this.physicsCatheterFor(s1.catheterId);
      if (DiagnosticPhysics.supports(id)) this.physics.exchangeTo(id);
    }
    if (this.sheathThrombus) this.setPlugged(true);
    this.notify();
  }

  /**
   * A saline flush down the catheter. Through a plugged catheter it drives the plug out of the tip:
   * into the engaged coronary (an embolic occlusion) or into the aorta (a neurological deficit).
   */
  flushCatheter() {
    if (this.store.getState().finished) return;
    if (this.plugged) {
      this.embolisePlug("flush");
      return;
    }
    // a push still held in the vessels is booked before the saline clears the lumen
    if (this.injector.active) this.finishInjection();
    else this.injector.finish();
    this.injector.flush();
    this.notify();
  }

  /** What the gauze on the table shows: the last aspiration (null before any). */
  aspirateView(): AspirationResult | null {
    return this.store.getState().lastAspiration;
  }

  /** The plug leaves the tip, pushed by a flush, an injection or the wire. */
  private embolisePlug(how: "flush" | "injection" | "wire") {
    if (!this.plugged) return;
    this.setPlugged(false);
    const st = this.store.getState();
    const t = this.simT;
    const tip = this.engine.tipInput;
    const coronary = tip.location === "ostium" || tip.location === "coronary" || !!st.engagement?.isSelective;
    const side: "left" | "right" = tip.side ?? (st.engagement?.target === "right" ? "right" : "left");
    const what = how === "flush" ? "Flushing" : how === "injection" ? "Injecting through" : "Passing the wire through";
    if (coronary) this.engine.setOcclusion("plug-embolus", { vessel: side === "right" ? "RCA" : "LAD", param: MP_PLUG_EMBOLUS.param, fraction: MP_PLUG_EMBOLUS.fraction });
    else this.events.hold(["neuro-deficit"], t, "embolism");
    this.store.setState((s) => ({
      score: computeScores({ ...s.score, dangerousInjections: s.score.dangerousInjections + 1, fluoroTime: s.fluoroTime }, s.targets),
      events: [
        ...s.events,
        {
          t: Math.round(Math.max(0, performance.now() / 1000 - s.sessionStart) * 10) / 10,
          code: "no-aspirate" as const,
          message: `${what} a catheter that would not aspirate drove its plug out of the tip${coronary ? " into the coronary." : " into the aorta."} Remove a catheter that will not aspirate under suction, without flushing, injecting or wiring it.`,
          context: s.caseData.name,
        },
      ],
    }));
    this.crew?.push([{ tWall: t, tPatient: this.engine.time, kind: "complication.embolism", data: { how, into: coronary ? side : "aorta" } }]);
    this.notify();
  }

  /** The catheter id the rod mechanics knows: a side-hole or a 5 Fr version moves like its base curve. */
  private physicsCatheterFor(id: string): string {
    return catheterCurveBase(id);
  }

  /** The tip input for the patient engine: the catheter's side holes and an ostial lesion's narrowing of the gap. */
  private withCatheterAndOstium(tip: TipInput): TipInput {
    const st = this.store.getState();
    const out: TipInput = { ...tip, sideHoles: catheterSideHoles(st.catheterId) };
    if ((out.location === "ostium" || out.location === "coronary") && out.gap !== undefined && !out.conus) {
      const f = ostialGapFactor(st.caseData.lesions ?? [], out.side ?? "left");
      if (f < 1) out.gap = out.gap * f;
    }
    return out;
  }

  canStoreFluoro(): boolean {
    return this.fluoroLoop.length > 0;
  }

  cArmAngles(): CArm {
    return this.store.getState().cArm;
  }

  tableHeightMm(): number {
    return this.store.getState().imaging.tableHeight;
  }

  imagingControls(): ImagingControls {
    const s = this.store.getState();
    const im = s.imaging;
    return {
      field: im.field,
      fields: DIAGNOSTIC_FIELDS,
      pulseRate: im.pulseRate,
      cineRate: im.cineRate,
      rates: DIAGNOSTIC_RATES,
      fluoroLevel: this.exposure.exposure.fluoroLevel ?? "normal",
      shutters: im.shutters,
      wedge: im.wedge,
      xrayEnabled: s.fluoroOn,
    };
  }

  setFieldSize(cm: number) {
    const f = DIAGNOSTIC_FIELDS.find((x) => x === cm);
    if (f !== undefined) this.store.getState().setField(f);
  }

  setFluoroRate(pps: number) {
    const r = DIAGNOSTIC_RATES.find((x) => x === pps);
    if (r !== undefined) this.store.getState().setPulseRate(r);
  }

  setCineRate(fps: number) {
    const r = DIAGNOSTIC_RATES.find((x) => x === fps);
    if (r !== undefined) this.store.getState().setCineRate(r);
  }

  setFluoroLevel(level: FluoroLevel) {
    this.exposure.exposure = { ...this.exposure.exposure, fluoroLevel: level };
    this.notify();
  }

  setShutters(sh: [number, number, number, number]) {
    this.store.getState().setShutters(sh);
  }

  setWedge(w: { insertion: number; angleDeg: number }) {
    this.store.getState().setWedge(w);
  }

  toggleXray() {
    this.store.getState().toggleFluoro();
  }

  backTable(): BackTableState {
    return { items: CATHETERS, selectedId: this.store.getState().catheterId, note: BACK_TABLE_NOTE };
  }

  selectBackTableItem(id: string) {
    this.store.getState().setCatheter(id);
  }

  breathHeld(): boolean {
    return this.breathHoldSince !== null;
  }

  defibReadout(): DefibReadout {
    return this.engine.vitals().defib;
  }

  // --- pedals ----------------------------------------------------------------------

  get pedal(): PedalState {
    return this.store.getState().pedal;
  }

  setPedal(p: PedalState) {
    const st = this.store.getState();
    if ((p.fluoro || p.cine) && (st.finished || (this.beamGate && !this.beamGate()))) p = { fluoro: false, cine: false };
    const was = st.pedal;
    st.setPedal(p);
    if (p.cine && !was.cine) this.beginRun();
    if (!p.cine && was.cine) this.endRun();
    // the exposure tone follows the beam the chain produces (a gated pedal makes no sound)
    const im = this.store.getState().imaging;
    this.crew?.setExposure(p.cine ? "cine" : p.fluoro ? "fluoro" : "off", { highLevel: this.exposure.exposure.fluoroLevel === "high", pps: p.cine ? im.cineRate : im.pulseRate });
    this.notify();
  }

  private beginRun() {
    const st = this.store.getState();
    const d = this.exposure.dose.totals;
    this.run = startCineRun({
      caseId: this.caseId,
      startedAt: this.wall(),
      fps: st.imaging.cineRate,
      cArm: st.cArm,
      fieldCm: st.imaging.field,
      catheterId: st.catheterId,
      karMGy0: d.karMGy.total,
      kapGyCm20: d.kapGyCm2.total,
      contrastMl0: this.contrastPushed(),
    });
    // what the run records about itself (diag-injection-run-quality); a push already going belongs to it
    this.runTrack = {
      startWall: this.wall(),
      fieldCm: st.imaging.field,
      fieldChanged: false,
      heldS: 0,
      totalS: 0,
      maxTableSpeed: 0,
      travelMm: 0,
      lastPan: { x: st.imaging.panX, y: st.imaging.panY },
      push: this.pending && this.injector.active && this.pending.trace === this.injector.trace ? this.pending : null,
    };
  }

  private endRun() {
    const r = this.run;
    this.run = null;
    const track = this.runTrack;
    this.runTrack = null;
    if (!r) return;
    const st = this.store.getState();
    const d = this.exposure.dose.totals;
    const s = r.finish({ cArm: { ...st.cArm }, karMGy: d.karMGy.total, kapGyCm2: d.kapGyCm2.total, contrastMl: this.contrastPushed() });
    if (!s) return;
    if (track) {
      const input = this.runQualityInput(track, s.fps, s.cArm);
      const q = assessRun(input);
      s.quality = q;
      this.runInputs.set(s.id, input);
      this.lastRunQuality = q;
      // a filmed selective push that cannot be read
      const p = track.push;
      if (p && p.selective && q.nonDiagnostic && !q.injection?.testPuff) this.events.raise("non-diagnostic-run", undefined, this.simT, "run-quality");
      // a readable filmed selective run: the repeat the waiting tip asks for has been done
      else if (p && p.selective && !q.nonDiagnostic && !q.injection?.testPuff) this.events.clear("non-diagnostic-run");
    }
    useSeriesStore.getState().add(s);
    // this run may be the second projection an earlier run of the same lesion lacked
    if (track && s.quality?.lesion) this.pairEarlierRuns(s);
  }

  // --- filling and run quality (diag-injection-run-quality) ---------------------------

  /** The ostial root vessel per side, found once per tree (flowScaleFor runs every frame a bolus is drawn). */
  private rootVessels: { tree: unknown; left: string | null; right: string | null } | null = null;

  /** The ostial (root) tree vessel of a side: the LM or the RCA (the first vessel of that side with its own ostium). */
  private rootVesselOf(side: "left" | "right"): string | null {
    if (!this.rootVessels || this.rootVessels.tree !== this.tree) {
      const find = (sd: "left" | "right") => this.tree.vessels.find((x) => x.side === sd && !x.parent && x.kind !== "collateral")?.name ?? null;
      this.rootVessels = { tree: this.tree, left: find("left"), right: find("right") };
    }
    return this.rootVessels[side];
  }

  /**
   * The native coronary flow of a side over its resting flow, for the image and the run analysis: the patient
   * engine's live flow scale of the side's ostial vessel (perfusion pressure, demand, a catheter obstructing the
   * ostium, hyperaemia), times a run scenario's resting flow (runs.ts RUN_SETUPS).
   */
  flowScaleFor(side: "left" | "right"): number {
    const root = this.rootVesselOf(side);
    const live = root ? this.engine.coronaryFlowScale(root) : 1;
    const k = this.runSetup?.flowScale?.[side] ?? 1;
    const x = live * k;
    return Number.isFinite(x) ? Math.max(0, x) : 1;
  }

  /**
   * The tree vessel holding the catheter tip, as the classifier names it: the rod mechanics' reading, or, in a run
   * scenario that teaches the short left main (runs.ts SHORT_LM_CLASSIFIER_SCENARIOS), the branch a Judkins left
   * seated in it enters (src/simulation/engagement.ts shortLmBranch). Null when neither names one.
   */
  classifierVessel(): string | null {
    const pv = this.physics?.active ? this.physicsReading?.vessel ?? null : null;
    if (pv) return pv;
    const st = this.store.getState();
    const e = st.engagement;
    const sid = st.caseData.scenarioId;
    if (!sid || !SHORT_LM_CLASSIFIER_SCENARIOS.includes(sid) || !st.caseData.variants?.includes("short-lm")) return null;
    if (e.target !== "left" || !(e.isSelective || e.isDeep)) return null;
    const cath = catheterById(st.catheterId);
    if (!cath || !isShortLeftMain(this.model)) return null;
    const branch = shortLmBranch(this.model, cath);
    return branch && this.tree.vessels.some((v) => v.name === branch) ? branch : null;
  }

  /** The classifier puts the tip in a branch of the left main (the LAD or the circumflex system), not the left main itself. */
  superselective(): boolean {
    const v = this.classifierVessel();
    if (!v || v === "LM") return false;
    const tv = tipVesselOf(v);
    return tv === "LAD" || tv === "LCx";
  }

  /** Book a push that has just started (analysed once its flow stops). */
  private recordPush(t: number, side: "left" | "right", trace: InjectionTrace, vessel: string | null) {
    const st = this.store.getState();
    const cs = this.engine.clockState();
    const c = this.contrast;
    const seat = seatWithSideHoles(injectionSeat(st.engagement, st.pressure), catheterSideHoles(st.catheterId));
    const rec: PushRecord = {
      t0: t,
      side,
      trace,
      seat,
      flowScale: this.flowScaleFor(side),
      rrS: cs.rr,
      phase0: cs.phase,
      tip: { kind: st.engagement.kind, vessel },
      selective: !!c && c.plume !== "root" && !c.lv && c.side !== null,
      filmed: this.run !== null,
      dilation: this.engine.epicardialDilation,
      quality: null,
    };
    this.pending = rec;
    this.pushes.push(rec);
    if (this.runTrack && !this.runTrack.push) this.runTrack.push = rec;
  }

  /**
   * The analysis of a push from its ostial mixing (from the press to the end of its trace so far), with the washout
   * the beats count includes: the side's median terminal transit at the push's flow scale.
   */
  private judgePush(rec: PushRecord): InjectionQuality {
    const net = transportNet(this.tree, this.store.getState().caseData.lesions);
    const series = ostialSeries({ net, side: rec.side, trace: rec.trace, phase: rec.phase0, rr: rec.rrS, flowScale: rec.flowScale, seat: rec.seat });
    return analyseInjection(series, rec.trace, rec.rrS, net.thetaEnd[rec.side] / Math.max(0.05, rec.flowScale));
  }

  /** Judge a push whose flow has stopped (or that a new push replaces), raise its events and book a test puff. */
  private analysePush(rec: PushRecord) {
    if (this.pending === rec) this.pending = null;
    if (rec.quality) return;
    const q = this.judgePush(rec);
    rec.quality = q;
    if (!(q.volumeMl > 0.05)) return;
    const t = this.simT;
    if (q.testPuff) {
      this.testPuffs.push({ t: rec.t0, volumeMl: q.volumeMl, side: rec.side, tip: { ...rec.tip } });
      // a test puff into a branch of the left main: the catheter is superselective, not engaged in the left main
      const tv = tipVesselOf(rec.tip.vessel);
      if (rec.side === "left" && rec.tip.vessel && rec.tip.vessel !== "LM" && (tv === "LAD" || tv === "LCx")) this.events.raise("engage-fail", undefined, t, "run-quality");
      return;
    }
    if (!rec.selective) return;
    if (q.streaming) this.events.raise("contrast-streaming", undefined, t, "run-quality");
    else if (!q.underfilled && q.reflux) this.events.clear("contrast-streaming");
    if (rec.filmed && (q.underfilled || !q.reflux)) this.events.raise("non-diagnostic-run", undefined, t, "run-quality");
    else if (rec.filmed && !q.underfilled && q.reflux && !q.streaming) this.events.clear("non-diagnostic-run");
  }

  /** The intermediate lesion (RUN_QUALITY.qfrLesionPct) a run of this side shows, with its view, or null. */
  private runLesion(side: "left" | "right", cArm: CArm, rec: PushRecord, reach: Set<string> | null): RunLesion | null {
    const st = this.store.getState();
    const P = RUN_QUALITY.qfrLesionPct;
    const H = this.tree.heart;
    const world = (sm: Parameters<typeof samplePos>[1]) => toWorld(this.model, samplePos(H, sm));
    for (const l of st.caseData.lesions ?? []) {
      if (l.severity < P.min || l.severity > P.max) continue;
      const v = this.tree.vessels.find((x) => x.side === side && x.lesionId === l.vessel && x.param.length > 1 && x.param[0] <= l.position + 1e-6 && x.param[x.param.length - 1] >= l.position - 1e-6);
      if (!v || (reach && !reach.has(v.name))) continue;
      let k = 0;
      for (let i = 1; i < v.param.length; i++) if (Math.abs(v.param[i] - l.position) < Math.abs(v.param[k] - l.position)) k = i;
      const half = Math.max(3, (l.lengthMm ?? 6) / 2);
      const pts = v.samples.filter((_, i) => Math.abs(v.pathMm[i] - v.pathMm[k]) <= half).map(world);
      if (pts.length < 2) continue;
      const others = this.tree.vessels
        .filter((x) => x.side === side && x.name !== v.name && x.kind !== "collateral" && (!reach || reach.has(x.name)))
        .map((x) => ({ pts: x.samples.filter((_, i) => i % 2 === 0).map(world), radii: x.radii.filter((_, i) => i % 2 === 0) }));
      const view = lesionView(cArm, { pts, radiusMm: v.radii[k] ?? 1 }, others);
      return { vessel: l.vessel, severityPct: l.severity, view, nitrate: rec.dilation >= RUN_QUALITY.nitrateDilation, pairSeparationDeg: this.bestPairDeg(cArm, l.vessel, null) };
    }
    return null;
  }

  /**
   * A run QFR could pair with another projection of its lesion: readable, and meeting every QFR criterion but the
   * second projection itself (FAVOR II's acquisition rules hold for both projections).
   */
  private static qfrPartner(q: RunQuality | undefined): boolean {
    return !!q && !q.nonDiagnostic && q.qfr.applicable && q.qfr.criteria.every((c) => c.id === "second-projection" || c.ok);
  }

  /** The largest view separation from another stored run of the case that shows this lesion and could be its QFR pair (degrees), or null. */
  private bestPairDeg(cArm: CArm, lesionVessel: string, exceptId: string | null): number | null {
    let best: number | null = null;
    for (const x of useSeriesStore.getState().series) {
      if (x.caseId !== this.caseId || x.kind !== "cine" || x.id === exceptId || x.quality?.lesion?.vessel !== lesionVessel || !DiagnosticLabSession.qfrPartner(x.quality)) continue;
      const d = viewSeparationDeg(cArm, x.cArm);
      if (best === null || d > best) best = d;
    }
    return best;
  }

  /** A new run of a lesion that could be a QFR pair gives earlier runs of it their second projection: re-judge them. */
  private pairEarlierRuns(newRun: StoredSeries) {
    const lesionVessel = newRun.quality?.lesion?.vessel;
    if (!lesionVessel || !DiagnosticLabSession.qfrPartner(newRun.quality)) return;
    const newId = newRun.id;
    const cArm = newRun.cArm;
    const st = useSeriesStore.getState();
    for (const x of st.series) {
      if (x.id === newId || x.caseId !== this.caseId || x.quality?.lesion?.vessel !== lesionVessel) continue;
      const input = this.runInputs.get(x.id);
      if (!input?.lesion) continue;
      const d = viewSeparationDeg(cArm, x.cArm);
      if (input.lesion.pairSeparationDeg !== null && input.lesion.pairSeparationDeg >= d) continue;
      const next: RunQualityInput = { ...input, lesion: { ...input.lesion, pairSeparationDeg: d } };
      this.runInputs.set(x.id, next);
      st.setQuality(x.id, assessRun(next));
    }
  }

  /** The analysis input of a cine run that has just ended. */
  private runQualityInput(track: NonNullable<DiagnosticLabSession["runTrack"]>, fps: number, cArm: CArm): RunQualityInput {
    const end = this.wall();
    const rec = track.push;
    const q = rec ? rec.quality ?? this.judgePush(rec) : null;
    const tr = rec?.trace ?? null;
    const net = transportNet(this.tree, this.store.getState().caseData.lesions);
    const reach = rec?.tip.vessel ? vesselSubtree(this.tree, rec.tip.vessel) : null;
    return {
      injection: q,
      selective: !!rec?.selective,
      tip: rec ? { ...rec.tip } : { kind: this.store.getState().engagement.kind, vessel: null },
      pushDelayS: rec && tr ? rec.t0 + tr.pushStart - track.startWall : null,
      tailS: rec && tr && tr.pushEnd !== null ? end - (rec.t0 + tr.pushEnd) : null,
      distalArrivalS: rec ? net.thetaEnd[rec.side] / Math.max(0.05, rec.flowScale) : 0,
      fps,
      table: { maxSpeedMmS: track.maxTableSpeed, travelMm: track.travelMm },
      fieldChanged: track.fieldChanged,
      breathHeldShare: track.totalS > 0 ? track.heldS / track.totalS : this.breathHoldSince !== null ? 1 : 0,
      lesion: rec && rec.selective && q && !q.testPuff ? this.runLesion(rec.side, cArm, rec, reach) : null,
    };
  }

  /** The run in progress, every step: its length, the breath-hold, the table's motion and the field. */
  private trackRun(dt: number) {
    const r = this.runTrack;
    if (!r || !this.run) return;
    const st = this.store.getState();
    r.totalS += dt;
    if (this.breathHoldSince !== null) r.heldS += dt;
    const ts = this.table.state;
    const dx = st.imaging.panX - r.lastPan.x;
    const dy = st.imaging.panY - r.lastPan.y;
    const moved = Math.hypot(dx, dy);
    r.travelMm += moved;
    r.maxTableSpeed = Math.max(r.maxTableSpeed, Math.hypot(ts.vx, ts.vy), dt > 0 ? moved / dt : 0);
    r.lastPan.x = st.imaging.panX;
    r.lastPan.y = st.imaging.panY;
    if (st.imaging.field !== r.fieldCm) r.fieldChanged = true;
  }

  /** Volume pushed by the syringe so far, including the run in progress (mL). */
  contrastPushed(): number {
    return this.injector.stats.totalMl + (this.injector.trace?.volumeMl ?? 0);
  }

  /** Store the last seconds of fluoroscopy as a run on the reference monitor. */
  storeFluoro(): StoredSeries | null {
    const st = this.store.getState();
    const s = storeFluoroLoop(this.fluoroLoop, { caseId: this.caseId, fps: st.imaging.pulseRate, fieldCm: st.imaging.field, catheterId: st.catheterId });
    if (!s) return null;
    this.notify();
    return s;
  }

  /** Called by the live monitor after every exposed frame, with the stored-size grey frame. */
  onExposedFrame(gray: Uint8Array | null, mode: "fluoro" | "cine") {
    this.lastImageAt = this.wall();
    if (!gray) return;
    if (mode === "cine") {
      if (this.run) {
        this.run.push(gray);
        if (this.injector.active) this.run.injected = true;
      }
    } else this.fluoroLoop.push(gray, this.wall(), { ...this.store.getState().cArm });
  }

  // --- syringe and manifold --------------------------------------------------------

  /** The hand on the plunger (S8 syringe command). */
  onSyringe(c: SyringeCommand) {
    const st = this.store.getState();
    const t = this.nowS();
    if (c.port === "aspirate") {
      const pull = Math.min(1, -c.force);
      if (c.force < -PUSH_ON && !this.aspirating) {
        this.aspirating = true;
        this.hardPulled = false;
        if (!st.finished) this.aspirate(pull);
      } else if (this.aspirating && pull >= MP_HARD_PULL && !this.hardPulled) {
        // pulling harder on a catheter that gave nothing back draws air in through the connector
        const last = st.lastAspiration;
        if (last && last.from === "catheter" && (last.outcome === "wall" || last.outcome === "plug") && !st.finished) {
          this.hardPulled = true;
          this.aspirate(pull);
        }
      } else if (c.force > -PUSH_ON) this.aspirating = false;
      return;
    }
    if (c.port === "saline") {
      if (c.force > PUSH_ON && !this.flushing) {
        this.flushing = true;
        this.flushCatheter();
      } else if (c.force <= PUSH_ON) this.flushing = false;
      return;
    }
    if (c.force > PUSH_ON && !this.plungerOn) {
      this.plungerOn = true;
      this.startInjection(t, { force: c.force });
    } else if (c.force <= PUSH_ON && this.plungerOn) {
      this.plungerOn = false;
      this.plungerFraction = null;
      this.injector.release(t);
    } else if (this.plungerOn && c.force > PUSH_ON && c.force !== this.plungerFraction) {
      // the hand pushes harder or softer during the push (diag-injection-run-quality)
      this.plungerFraction = c.force;
      this.injector.setAim(plungerAimFactor(c.force));
    }
  }

  /**
   * Start a hand injection (the push lasts while the plunger is held). Returns false if refused. `force` is the
   * hand's plunger fraction (0..1; injection.ts plungerAimFactor); without it the push is the standard one.
   */
  startInjection(t = this.nowS(), o: { force?: number } = {}): boolean {
    const st = this.store.getState();
    if (st.finished) return false;
    // the crew is exchanging the catheter over the wire: there is no catheter to inject through
    if (this.physics?.active && this.physics.exchanging) return false;
    if (this.beforeInject && !this.beforeInject()) return false;
    // contrast pushed through a plugged catheter drives the plug out first
    if (this.plugged) this.embolisePlug("injection");
    // a push still held in the vessels by an obstructing tip is booked before the new one replaces it
    if (this.injector.active) this.finishInjection();
    const before = this.store.getState().bolus;
    const before0 = this.store.getState().lastInjection;
    st.inject();
    const after = this.store.getState();
    const cath = catheterById(after.catheterId);
    const side: "left" | "right" = after.engagement.target === "right" ? "right" : after.engagement.target === "left" ? "left" : cath?.target === "right" ? "right" : "left";
    // the push happens whatever the tip is doing; what it fills depends on the tip (store outcome)
    if (this.pending) this.analysePush(this.pending);
    const trace = this.injector.start(t, { kind: "held", side, delayS: 0 });
    if (o.force !== undefined) {
      this.plungerFraction = o.force;
      this.injector.setAim(plungerAimFactor(o.force));
    }
    const vessel = this.classifierVessel();
    const b = after.bolus;
    if (b && b !== before) this.contrast = { filled: b.filled, plume: b.plume, side: b.side, peak: b.peak, lv: after.lastInjection?.outcome === "lv-injection", vessel };
    else this.contrast = null;
    this.recordPush(t, side, trace, vessel);
    this.notePushHazard(t, side, trace);
    if (this.airPendingMl > 0) this.embolise(side, this.contrast !== null && this.contrast.plume !== "root" && !this.contrast.lv);
    // an injection ends the exchange window (the new catheter is in use); the modules hear of it
    this.exchangeUntil = -Infinity;
    if (this.physics?.active) this.keepPhysicsSnapshot("injection");
    this.rootReached = true;
    const outcome = after.lastInjection && after.lastInjection !== before0 ? after.lastInjection.outcome : null;
    for (const m of this.modules) m.onInject?.({ t, side, outcome, catheterId: after.catheterId });
    this.notify();
    return true;
  }

  /**
   * Air left in the line or the lumen at the hand-over goes with the first push: into the engaged
   * coronary (a transient occlusion, a vagal reaction) or, from the aortic root, harmlessly into the
   * circulation. Volumes and clearance are the C3 air-embolism MODEL PARAMETERS.
   */
  private embolise(side: "left" | "right", coronary: boolean) {
    const ml = this.airPendingMl;
    this.airPendingMl = 0;
    if (!coronary) return;
    this.airMl = ml;
    this.airSide = side;
    this.engine.stimulus("balloon", Math.min(1, ml / MP_AIR_FULL_ML));
    this.store.setState((s) => ({
      score: computeScores({ ...s.score, airEmbolisms: s.score.airEmbolisms + 1, fluoroTime: s.fluoroTime }, s.targets),
      events: [
        ...s.events,
        {
          t: Math.round(Math.max(0, performance.now() / 1000 - s.sessionStart) * 10) / 10,
          code: "air-embolism" as const,
          message: "Bubbles went down the coronary with the first injection: the line or the catheter was not cleared of air before handing over.",
          context: s.caseData.name,
        },
      ],
    }));
    this.crew?.push([{ tWall: this.wall(), tPatient: this.engine.time, kind: "complication.air", data: { ml, side } }]);
  }

  /** Release the plunger (button or key up). */
  releaseInjection() {
    this.plungerOn = false;
    this.injector.release(this.nowS());
  }

  private syncCatheter() {
    const st = this.store.getState();
    const cath = catheterById(st.catheterId);
    if (st.catheterId !== this.catheterId) {
      this.catheterId = st.catheterId;
      this.injector.finish();
      this.injector.flush(); // a new catheter arrives flushed with saline
      // the old catheter took its plug out with it; the new one picks up a thrombus left in the sheath
      this.setPlugged(this.sheathThrombus);
      this.lastEng = null; // the tip input carries the new catheter's side holes
      if (this.physics?.active) {
        const physId = this.physicsCatheterFor(st.catheterId);
        if (DiagnosticPhysics.supports(physId)) {
          // a decision point: the recorder keeps the mechanics as they were before the exchange
          this.keepPhysicsSnapshot("catheter-change");
          this.physics.exchangeTo(physId);
          // the store shows the exchange (no engagement) from this frame on, not the old catheter's seat
          this.pushPhysicsReadout();
        } else this.fallBackToSimple(`The rod solver has no shape for the ${st.catheterId} catheter, so the lab switched to the simple model.`);
      }
    }
    // the lumen of the catheter in use: its size and whether it is a guide (diag-injection-run-quality)
    this.injector.setCatheter(cath ? lumenForCatheter({ french: catheterFrench(cath.id), guide: cath.category === "guide" }) : LUMENS["diag-6"]);
  }

  // --- C-arm, table, breathing ------------------------------------------------------

  driveMemory(i: number | null) {
    this.drivingMemory = i;
    const m = i === null ? null : this.memories[i] ?? null;
    this.carm.driveTo(m);
  }

  storeMemory(i: number) {
    this.memories[i] = { ...this.carm.angles };
    this.notify();
  }

  /** Joystick from the on-screen controls (deg/s); 0, 0 releases. */
  jogCArm(lao: number, cran: number) {
    this.drivingMemory = null;
    this.carm.setCommandedVelocity(lao, cran);
  }

  holdBreath(on: boolean) {
    this.breathHoldSince = on ? this.wall() : null;
    this.engine.holdBreath(on ? BREATH_HOLD_LEVEL : null);
    this.notify();
  }

  // --- defibrillator ---------------------------------------------------------------

  charge() {
    this.engine.charge(200);
    this.notify();
  }

  clearForShock() {
    this.engine.clearForShock();
    this.notify();
  }

  shock() {
    const r = this.engine.shock();
    this.noteShock();
    this.notify();
    return r;
  }

  /** A shock was delivered (any control): counted against the VF episode under way. */
  noteShock() {
    if (this.vfOpen) this.vfOpen.shocks++;
  }

  // --- the catheter's mechanics (diag-rod-physics) ------------------------------------

  /** Start the rod mechanics when the mode allows it (the constructor's option, the Settings choice, the default rule). */
  private startPhysics(opt: SessionPhysicsOptions | false | undefined) {
    if (opt === false) {
      this.physicsMode = { on: false, reason: null };
      return;
    }
    const st = this.store.getState();
    const inThread = opt?.useWorker === false;
    this.physicsMode = resolvePhysicsMode({
      choice: opt?.force ? "rod" : undefined,
      inThread,
      registered: getPhysicsDevices() !== null,
      catheterId: this.physicsCatheterFor(st.catheterId),
    });
    if (!this.physicsMode.on) return;
    // the rod mechanics runs again in this case: an earlier case's fallback no longer describes it
    try {
      usePhysicsSettings.getState().noteFallback(null);
    } catch {
      // settings store unavailable (tests)
    }
    try {
      this.physics = new DiagnosticPhysics({
        model: this.model,
        caseData: st.caseData,
        tree: this.tree,
        catheterId: this.physicsCatheterFor(st.catheterId),
        clock: this.engine.clockState(),
        useWorker: !inThread,
        config: opt?.config,
        autoFallback: opt?.autoFallback,
        moveCoronaries: opt?.moveCoronaries,
        start: opt?.start,
      });
    } catch (err) {
      this.physics = null;
      this.physicsMode = { on: false, reason: `The rod solver could not start (${err instanceof Error ? err.message : String(err)}).` };
      return;
    }
    // with a worker the first frame arrives one step later; until then the store keeps its own tip
  }

  /** The physics read-out into the store (tip, engagement, hub read-outs, the engine's trace) and the haptics. */
  private pushPhysicsReadout() {
    const p = this.physics!;
    const r = p.readout();
    if (!r) return;
    this.store.getState().setPhysicsReadout({ ...r, pressure: this.physPressure });
    const reaction = p.reaction();
    if (reaction) {
      // the hub reaction to the haptics (pseudo-haptic gain, rumble, torquer brake); a whip or a wedged
      // tip to the team's telemetry and a click of the shaft in the operator's hand
      this.input?.feedReaction(reaction);
      if (reaction.snap || (reaction.wedged && !this.physWedged)) {
        this.crew?.push([{ tWall: this.simT, tPatient: this.engine.time, kind: reaction.snap ? "physics.snap" : "physics.wedged", data: { device: reaction.device } }]);
        if (reaction.snap) this.crew?.audio?.click("device");
      }
      this.physWedged = reaction.wedged;
    }
  }

  /** The rod mechanics is starting: its first frame has not arrived (the shell shows "Preparing catheter mechanics"). */
  get physicsPreparing(): boolean {
    return !!this.physics?.preparing;
  }

  /** Take a physics snapshot at a decision point into physicsSnapshots (a worker that goes away meanwhile gives none). */
  private keepPhysicsSnapshot(reason: string) {
    const p = this.physics;
    if (!p?.active) return;
    p.snapshotAt(reason)
      .then((e) => {
        if (!e) return;
        this.physicsSnapshots.push(e);
        if (this.physicsSnapshots.length > PHYSICS_SNAPSHOT_KEEP) this.physicsSnapshots.splice(0, this.physicsSnapshots.length - PHYSICS_SNAPSHOT_KEEP);
      })
      .catch(() => undefined);
  }

  /** Hand the catheter back to the simple model (with the banner's reason). */
  fallBackToSimple(reason: string) {
    if (!this.physics) return;
    this.stopPhysics();
    // the analytic model starts from the natural seat (setPhysicsReadout(null)): the trackers follow it
    const c = this.store.getState().controls;
    this.lastInsertion = c.insertion;
    this.handStart = { insertion: c.cmdInsertion, torque: c.cmdTorque, wire: c.wireInsertion };
    this.physicsBanner = reason;
    this.physicsMode = { on: false, reason };
    try {
      usePhysicsSettings.getState().noteFallback(reason);
    } catch {
      // settings store unavailable (tests): the banner on the session is enough
    }
    this.notify();
  }

  private stopPhysics() {
    const p = this.physics;
    if (!p) return;
    this.physics = null;
    this.physicsReading = null;
    this.lastPhysReading = null;
    this.lastPhysTip = null;
    this.lastEng = null;
    p.dispose();
    this.store.getState().setPhysicsReadout(null);
  }

  /** Run a scripted procedure of src/ui/physics/physicsDevices.ts synchronously (in-thread mechanics: tests). */
  runPhysicsScript<T>(script: Generator<number, T>, dt = SCRIPT_DT): T {
    const p = this.physics;
    if (!p) throw new Error("the rod mechanics is not running");
    return p.runScript(script, (sec) => {
      for (let t = 0; t < sec - 1e-9; t += dt) this.step(dt);
    });
  }

  /** The same with a worker (the browser): the lab steps by dt and yields so that frames arrive. */
  async runPhysicsScriptAsync<T>(script: Generator<number, T>, dt = SCRIPT_DT, onStep?: () => void): Promise<T> {
    const p = this.physics;
    if (!p) throw new Error("the rod mechanics is not running");
    return p.runScriptAsync(script, async (sec) => {
      for (let t = 0; t < sec - 1e-9; t += dt) {
        this.step(dt);
        onStep?.();
        await yieldTask();
        await this.awaitPhysics(dt);
      }
    });
  }

  /**
   * A script steps the lab as fast as the page allows; the solver in its worker must not fall behind
   * the clock, or each of its frames covers a long stretch of patient time (the hands' commands land
   * late and the frames run over budget). Wait, up to 250 ms, until its newest frame is within three
   * lab steps of the patient clock.
   */
  private async awaitPhysics(dt: number) {
    const p = this.physics;
    if (!p?.devices.usesWorker) return;
    const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
    const w0 = now();
    for (;;) {
      const f = p.frame();
      if (!p.active || !f || this.engine.clockState().t - f.t <= 3 * dt) return;
      if (now() - w0 > 250) return;
      await yieldTask();
    }
  }

  /** Seat the catheter selectively on a side by the scripted technique (development capture). */
  async seatPhysics(side: "left" | "right", onStep?: () => void, attempts = 3): Promise<boolean> {
    const p = this.physics;
    if (!p) return false;
    for (let k = 0; k < attempts; k++) {
      if (await this.runPhysicsScriptAsync(engageScript(p, side), SCRIPT_DT, onStep)) {
        // the seated catheter settles under the load the hand left in it: let it settle, then ease back again
        await this.runPhysicsScriptAsync(settleThenEaseBack(p, side), SCRIPT_DT, onStep);
        return true;
      }
      if (!p.active) return false;
      // another attempt from higher in the root, as an operator would
      p.command({ kind: "push", device: "catheter", mm: -12 });
      for (let t = 0; t < 1; t += SCRIPT_DT) {
        this.step(SCRIPT_DT);
        await yieldTask();
        await this.awaitPhysics(SCRIPT_DT);
      }
    }
    return false;
  }

  /**
   * The cost bench of the default rule (COST_RULE): `seconds` of lab time of the scripted Judkins left
   * then, after an exchange over the wire, Judkins right technique, with `draw` (the fluoroscopy image)
   * called every lab frame. Returns the solver's per-frame cost over the run.
   */
  async benchPhysics(seconds = 60, draw?: () => void): Promise<{ frames: number; medianMs: number; p95Ms: number; labS: number; wallS: number; usesWorker: boolean; config: unknown }> {
    const p = this.physics;
    if (!p) throw new Error("the rod mechanics is not running");
    // costs keeps only the newest COST_KEEP frames: count this run's frames by the running total
    const fromTotal = p.costsTotal;
    const t0 = this.simT;
    const w0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const left = this.store.getState().catheterId;
    let side: "left" | "right" = "left";
    while (this.simT - t0 < seconds && p.active) {
      await this.runPhysicsScriptAsync(engageScript(p, side), SCRIPT_DT, draw);
      if (this.simT - t0 >= seconds || !p.active) break;
      // the other side: exchange over the wire, then engage it
      side = side === "left" ? "right" : "left";
      this.store.getState().setCatheter(side === "right" ? "JR4" : left === "JR4" ? "JL4" : left);
      while (p.active && (p.exchanging || this.store.getState().catheterId !== p.catheterId) && this.simT - t0 < seconds) {
        this.step(SCRIPT_DT);
        draw?.();
        await yieldTask();
        await this.awaitPhysics(SCRIPT_DT);
      }
    }
    const n = p.costsTotal - fromTotal;
    if (n === 0) throw new Error("the cost bench saw no solver frames (the rod mechanics produced none in the run)");
    if (n > DiagnosticPhysics.COST_KEEP) throw new Error(`the cost bench ran ${n} solver frames, more than the ${DiagnosticPhysics.COST_KEEP} kept: run it for fewer seconds`);
    const xs = p.costs.slice(-n);
    const s = xs.slice().sort((a, b) => a - b);
    const pct = (q: number) => (s.length ? s[Math.min(s.length - 1, Math.max(0, Math.ceil(q * s.length) - 1))] : NaN);
    return {
      frames: xs.length,
      medianMs: pct(0.5),
      p95Ms: pct(0.95),
      labS: this.simT - t0,
      wallS: ((typeof performance !== "undefined" ? performance.now() : Date.now()) - w0) / 1000,
      usesWorker: p.devices.usesWorker,
      config: p.devices.config,
    };
  }

  // --- the loop ----------------------------------------------------------------------

  /** Advance everything by dt seconds of wall time (call once per animation frame). */
  step(dt: number) {
    if (this.disposed || !(dt > 0)) return;
    dt = Math.min(dt, 0.1);
    this.simT += dt;
    this.input?.frame(dt * 1000);
    const st0 = this.store.getState();
    // the store may have been moved by another control (a preset button outside the shell): follow it when the arm is at rest
    if (!this.carm.moving && (Math.abs(st0.cArm.laoRao - this.carm.angles.laoRao) > 1e-6 || Math.abs(st0.cArm.cranialCaudal - this.carm.angles.cranialCaudal) > 1e-6)) this.carm.set(st0.cArm);
    if (this.carm.step(dt)) st0.setCArm(this.carm.angles);
    // sync whenever the drive and the store differ, not only when the drive moved this frame: a jump
    // (Centre, X) leaves the drive at rest at its new position, so step() reports no motion
    const tableMoved = this.table.step(dt);
    const ts = this.table.state;
    if (tableMoved || ts.x !== st0.imaging.panX || ts.y !== st0.imaging.panY || ts.height !== st0.imaging.tableHeight) {
      st0.setPan(ts.x, ts.y);
      if (ts.height !== st0.imaging.tableHeight) st0.setTableHeight(ts.height);
    }
    this.engine.advance(dt);
    // the rod mechanics on the patient clock (the hands reached it through the bus)
    const phys = this.physics;
    if (phys) {
      phys.step(this.engine.clockState());
      if (phys.failed) this.fallBackToSimple(`The lab switched to the simple model: ${phys.failed}.`);
    }
    // the store's catheter dynamics, contrast lifecycle and timers (about 33 Hz, as before)
    this.storeTickAcc += dt;
    if (this.storeTickAcc >= 0.03) {
      if (this.physics?.active) this.pushPhysicsReadout();
      this.store.getState().tick(this.storeTickAcc);
      this.storeTickAcc = 0;
    }
    const st = this.store.getState();
    const catheterChanged = st.catheterId !== this.catheterId;
    this.syncCatheter();
    this.trackTips(catheterChanged);
    if (this.physics?.active) {
      // the tip the patient engine sees is the rod's: its open fraction is the ostial gap
      const r = this.physics.latest();
      if (r && r !== this.lastPhysReading) {
        this.lastPhysReading = r;
        const tip = this.withCatheterAndOstium(tipFromPhysics(r));
        if (!sameTip(tip, this.lastPhysTip)) {
          this.lastPhysTip = tip;
          this.engine.setTip(tip);
        }
      }
      this.physicsReading = this.physics.contextReading();
    } else if (st.engagement !== this.lastEng) {
      this.lastEng = st.engagement;
      this.engine.setTip(this.withCatheterAndOstium(tipFromEngagement(st.engagement)));
    }
    // a wire passed out of a plugged catheter pushes the plug ahead of it
    const wireLead = st.controls.wireInsertion;
    if (this.plugged && wireLead > this.lastWireLead + 0.5) this.embolisePlug("wire");
    this.lastWireLead = wireLead;
    // syringe and the contrast lifecycle
    const t = this.nowS();
    if (this.injector.active) {
      const tr = this.injector.advance(t);
      if (tr && tr.empty && this.plungerOn) this.injector.release(t);
      // the injection hazard model (diag-rhythm-haemodynamic-events): the push once its flow has stopped, then the dwell
      this.trackInjectionHazard(tr, dt);
      // the push's flow has stopped: judge it (diag-injection-run-quality)
      if (this.pending && this.pending.trace === tr && this.injector.done()) this.analysePush(this.pending);
      const el = this.injector.elapsed(t) ?? 0;
      if (this.injector.done() && tr && tr.pushEnd !== null && el > tr.pushEnd + CONTRAST_CLEAR_S) {
        // an obstructing tip holds the contrast in the vessel (diag-pressure-transducer): it clears once
        // the tip is free, or after MP_HOLD_UP_MAX_S
        const held = !!this.contrast && !this.contrast.lv && this.contrast.plume !== "root" && OBSTRUCTING.includes(this.tipState) && el < tr.pushEnd + MP_HOLD_UP_MAX_S;
        if (held && el > tr.pushEnd + MP_HOLD_UP_S && !this.events.isActive("contrast-hold-up", this.simT)) this.events.raise("contrast-hold-up", undefined, this.simT, "contrast");
        if (!held) this.finishInjection();
      }
    } else if (st.bolus && !this.contrast) {
      // a bolus started by another control (a legacy button): end it on the store's own schedule
      if (st.bolus.labEnded && st.bolus.phase * st.bolus.duration > CONTRAST_CLEAR_S + 2.2) st.endBolus();
    }
    // coronary air clearing (C3 air model: occlusion by volume, exponential clearance); the bubbles lodge in
    // the LAD or the RCA at 30% of its length (MODEL PARAMETER)
    if (this.airMl > 0) {
      this.airMl *= Math.exp(-dt / MP_AIR_TAU_S);
      if (this.airMl < 0.005) {
        this.airMl = 0;
        this.engine.clearOcclusion("air");
      } else this.engine.setOcclusion("air", { vessel: this.airSide === "left" ? "LAD" : "RCA", param: 0.3, fraction: Math.min(1, this.airMl / MP_AIR_FULL_ML) });
    }
    this.trackRun(dt);
    // slow work: breath-hold limit, rhythm mirroring
    this.slowAcc += dt;
    if (this.slowAcc >= 0.25) {
      this.slowAcc = 0;
      if (this.breathHoldSince !== null && this.wall() - this.breathHoldSince > BREATH_HOLD_MAX_S) this.holdBreath(false);
      this.syncRhythm();
      this.trackPressure();
      this.trackTipsSlow();
    }
    // the team and the sound: engine and dose events, the syringe under the hand
    if (this.crew) {
      this.crew.push(this.exposure.dose.drainEvents());
      const tr = this.injector.trace;
      const pushing = this.injector.active && !!tr && tr.pushEnd === null;
      const flow = pushing && tr && tr.q.length ? tr.q[tr.q.length - 1] : 0;
      // the hand on the plunger for the syringe sound: a firm push while pushing (MODEL PARAMETER of the sound)
      this.crew.audio?.setInjection({ force: pushing ? 0.8 : 0, flowMlS: flow, psi: pushing && tr ? tr.peakPsi : 0, aspirate: this.aspirating });
      this.crew.step(dt);
    }
    this.rhythmStep(dt);
    for (const m of this.modules) m.step?.(dt);
    for (const f of this.stepListeners) f(dt);
    this.notifyAcc += dt;
    if (this.notifyAcc >= 0.2) {
      this.notifyAcc = 0;
      this.notify();
    }
  }

  private finishInjection() {
    if (this.pending) this.analysePush(this.pending);
    const tr = this.injector.trace;
    const side = tr?.side ?? "left";
    this.injector.finish();
    const last = this.injector.stats.last;
    const st = this.store.getState();
    if (last) {
      st.bookContrast(last.volumeMl);
      const where = this.contrast?.lv ? "lv" : this.contrast?.plume === "root" || !this.contrast ? "root" : side;
      // the injection hazard model has judged the push and its dwell already (trackInjectionHazard)
      this.engine.contrast(last.volumeMl, where, { hazard: false });
    }
    if (this.contrast) st.endBolus();
    this.contrast = null;
    this.notify();
  }

  /**
   * The store's arrhythmia follows the patient engine, which owns the rhythm (diag-rhythm-haemodynamic-
   * events): VF from the engine's hazard model (an injection, its dwell, ischaemia, a drug) opens an
   * episode with what the catheter was doing and reaches the store as engineArrhythmia; an organised
   * rhythm after a shock closes it. VF the store sets by itself (a legacy control) fibrillates the
   * patient, and a control that clears the store's VF while the patient is still fibrillating is undone.
   */
  private syncRhythm() {
    const st = this.store.getState();
    const v = this.engine.vitals();
    const engineVf = v.rhythmKind === "vf";
    if (engineVf && !this.vfForced) {
      this.vfForced = true;
      this.openVfEpisode(this.lastVfCause ?? "another cause (ischaemia, a drug or a shock)", v.tipState);
      this.lastVfCause = null;
      if (st.arrhythmia !== "vf") st.engineArrhythmia("vf");
    } else if (!engineVf && this.vfForced) {
      // an organised rhythm again (a shock on the defibrillator)
      this.vfForced = false;
      if (this.vfOpen) this.vfOpen.endedAt = this.simT;
      this.vfOpen = null;
      if (st.arrhythmia === "vf") st.defibrillate();
    } else if (engineVf && st.arrhythmia !== "vf") {
      // a control cleared the store's VF (the hub's button) while the patient is still fibrillating
      this.store.setState({ arrhythmia: "vf" });
    } else if (!engineVf && st.arrhythmia === "vf") {
      // VF the store set by itself: the patient fibrillates
      this.lastVfCause = "the store's arrhythmia";
      this.engine.forceRhythm("vf", "store arrhythmia");
    }
  }

  /** Open a VF episode with the catheter, its engagement and the tip state now (event data for the debrief). */
  private openVfEpisode(cause: string, tipState: TipPressureState) {
    const st = this.store.getState();
    const tip = this.engine.tipInput;
    const ep: VfEpisode = {
      t: this.simT,
      endedAt: null,
      cause,
      catheterId: st.catheterId,
      engagement: st.engagement.kind,
      tipState,
      tipLocation: tip.location,
      conus: !!st.engagement.conus || !!tip.conus,
      shocks: 0,
    };
    this.vfOpen = ep;
    this.vfEpisodes.push(ep);
    this.crew?.push([{ tWall: this.simT, tPatient: this.engine.time, kind: "rhythm.vf-episode", data: { ...ep } }]);
  }

  /** Book what a push is about to do, for the injection hazard model (the tip when the push began). */
  private notePushHazard(t: number, side: "left" | "right", trace: InjectionTrace) {
    const st = this.store.getState();
    const tip = this.engine.tipInput;
    const c = this.contrast;
    const coronary = !!c && !c.lv && c.plume !== "root" && (tip.location === "ostium" || tip.location === "coronary");
    const input: InjectionHazardInput = { tipState: this.engine.vitals().tipState, conus: !!st.engagement.conus || !!tip.conus, coronary, ...(tip.gap !== undefined ? { gap: tip.gap } : {}) };
    const risk: PushRisk = { t, side, ml: 0, input, pushP: 0, dwellS: 0, dwellP: 0, vf: null };
    this.pushRisks.push(risk);
    this.hazardPush = { trace, risk, drawn: false };
  }

  /**
   * The injection hazard model on the push in progress: once its flow has stopped, the push itself
   * (what the tip was doing when it began, the contrast it delivered); then, every step that an
   * obstructing tip holds its contrast in the artery, the dwell. The scenario's block on the first
   * injection of a side comes with the push.
   */
  private trackInjectionHazard(tr: InjectionTrace | null, dt: number) {
    const h = this.hazardPush;
    if (!h || !tr || h.trace !== tr) return;
    const m = this.engine.injectionHazards();
    if (!h.drawn) {
      if (!this.injector.done()) return;
      h.drawn = true;
      const r = h.risk;
      r.ml = Math.max(0, tr.contrastMl);
      if (m) r.pushP = injectionVfProbability(m, r.ml, r.input as InjectionHazardInput);
      const reason = this.engine.injectionHazard(r.ml, r.side, r.input);
      if (reason) {
        r.vf = reason;
        this.lastVfCause = reason;
      }
      const b = this.rhythmSetup?.blockOnFirstInjection;
      if (b && !this.blockFired && b.side === r.side && r.input.coronary) {
        this.blockFired = true;
        this.engine.forceRhythm(b.degree === 3 ? "chb" : "mobitz2", "after the injection");
      }
      return;
    }
    const c = this.contrast;
    if (!h.risk.input.coronary || !c || c.lv || c.plume === "root" || !OBSTRUCTING.includes(this.tipState)) return;
    const r = h.risk;
    r.dwellS += dt;
    if (m) r.dwellP = 1 - (1 - r.dwellP) * (1 - dwellVfProbability(m, r.ml, dt));
    const reason = this.engine.contrastDwell(r.ml, dt);
    if (reason) {
      r.vf = reason;
      this.lastVfCause = reason;
    }
  }

  /** The newest push's hazard (for the debrief and tests): its own, its dwell's and both together. */
  lastPushRisk(): (PushRisk & { totalP: number }) | null {
    const r = this.pushRisks[this.pushRisks.length - 1];
    return r ? { ...r, totalP: 1 - (1 - r.pushP) * (1 - r.dwellP) } : null;
  }

  /**
   * The rhythm package's work every step: pacing set-up, an Amplatz deep on the cusp holding the
   * aortic valve open, a scenario's hypotension cause after the time-out, and 'vagal' while the
   * patient's vagal reaction is under way.
   */
  private rhythmStep(dt: number) {
    this.rhythmOrders.step();
    const t = this.simT;
    if (this.timeOutDone && this.timeOutAt === null) this.timeOutAt = t;
    const st = this.store.getState();
    const al = /^AL/.test(catheterCurveBase(st.catheterId));
    const onCusp = al && (st.engagement.isDeep || st.engagement.kind === "below-valve");
    const ar = onCusp ? this.rhythmSetup?.cuspRegurgitation ?? MP_RHYTHM_ORDERS.amplatzCuspAr : 0;
    if (ar > 0 && this.cuspAr === 0) {
      this.arBefore = this.engine.aorticRegurgitation;
      this.engine.setAorticRegurgitation(Math.max(this.arBefore, ar));
    } else if (ar === 0 && this.cuspAr > 0) this.engine.setAorticRegurgitation(this.arBefore > 0 ? this.arBefore : null);
    this.cuspAr = ar;
    const hs = this.rhythmSetup?.hypotension;
    if (hs && !this.hypoStarted && this.timeOutAt !== null && t - this.timeOutAt >= hs.afterS) this.startHypotension(hs.cause);
    this.hypoRun?.tick(this.engine, dt);
    if (this.engine.resp.st.vagal > MP_RHYTHM_ORDERS.vagalEventLevel) this.events.raise("vagal", undefined, t, "patient");
  }

  /** Start a scenario's hypotension cause (the shared cause model). A hidden bleed bleeds at the rate its puncture gives (site.ts). */
  private startHypotension(cause: RhythmHypotension) {
    const id = cause === "vagal-mimic" ? vagalMimicCauseId(this.caseId) : "diag-post-nitrate";
    // the slowing comes before the fall (the emergency course's vagal lag, proc-anaphylaxis-vagal)
    if (cause === "vagal-mimic") this.engine.setEmergencyModel({ vagalSvrLagS: MP_RHYTHM_ORDERS.vagalSvrLagS });
    this.hypoRun = startHypotensionCause(id, this.engine);
    this.hypoStarted = { id, startedAt: this.simT };
    if (id === "diag-hidden-bleed" && this.puncture?.space === "retroperitoneal") this.engine.setHaemorrhage(this.puncture.rateMlS);
    const tmp = this.rhythmSetup?.tamponadeMlS;
    if (id === "diag-vagal-tamponade" && tmp !== undefined && tmp > 0) this.engine.setPericardialInflow(tmp);
    this.crew?.push([{ tWall: this.simT, tPatient: this.engine.time, kind: "rhythm.hypotension-cause", data: { id } }]);
  }

  /** The scenario's hypotension cause run (null: none started). */
  hypotensionRun(): CauseRun | null {
    return this.hypoRun;
  }

  /** The cause a scenario started and when (truth, for the debrief only). */
  hypotensionCauseStarted(): { id: string; startedAt: number } | null {
    return this.hypoStarted ? { ...this.hypoStarted } : null;
  }

  /** The bolus view the scene builder needs for this frame, or null. */
  bolusFor(t = this.nowS()) {
    const c = this.contrast;
    const tr = this.injector.trace;
    if (!c || !tr) return null;
    const el = this.injector.elapsed(t) ?? 0;
    return {
      filled: c.filled,
      plume: c.plume,
      side: c.side,
      t: el,
      injectDur: tr.pushEnd !== null ? tr.pushEnd - tr.pushStart : Math.max(0.1, el - tr.pushStart),
      peak: c.peak,
      lv: c.lv,
      trace: tr,
      vessel: c.vessel ?? null,
    };
  }

  dispose() {
    if (this.disposed) return;
    if (this.run) this.endRun();
    this.crew?.dispose();
    if (this.airMl > 0) this.engine.clearOcclusion("air");
    this.stopPhysics();
    for (const off of this.moduleOffs) off();
    this.moduleOffs = [];
    this.disposed = true;
    // the store falls back to its legacy pressure classes once the engine is gone
    this.store.getState().setEnginePressure(null);
    // and to its own rhythm rule (diag-rhythm-haemodynamic-events), unless another session has claimed it
    this.store.getState().setRhythmOwner(null, this.rhythmOwnerId);
    if (this.capability("rhythm") === this.rhythmOrders) this.provideCapability("rhythm", null);
    for (const u of this.unsub) u();
    this.unsub = [];
    this.listeners.clear();
    this.controlsListeners.clear();
    this.stepListeners.clear();
  }
}
