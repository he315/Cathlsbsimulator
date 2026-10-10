// ---------------------------------------------------------------------------
// One PCI lab session (pci-lab-shell-session), modelled on the diagnostic
// lab's DiagnosticLabSession (src/ui/sim/labSession.ts).
//
// It owns, per case:
//  - the patient: the case's own PatientEngine after a hand-over from the
//    full case, otherwise a fresh one for this scenario (heparinised as the
//    scenarios assume); its clock beats the image, the ECG and the pressures;
//  - the scenario from the registry (src/simulation/pci/scenarios/), its
//    anatomy, trees and geometry, and the PCI procedure state (PciState),
//    published to subscribers on every change;
//  - LabImaging (the dose-rate controller and the dose tracker), the
//    C-arm and table dynamics (CArmDrive, TableDrive), the guide's and the
//    contralateral catheter's syringes (Injectors sized from the guide);
//  - the foot switches: imaging only while a pedal is held (the earlier
//    lab's automatic 900 ms of fluoroscopy after every action is gone), cine
//    runs recorded on the reference monitor (RunRecorder) and the last
//    seconds of fluoroscopy kept for "store fluoro" (FluoroLoop), with the
//    helpers the diagnostic lab uses (startCineRun, storeFluoroLoop);
//  - the 4 Hz procedure clock (indeflator, complications, what the
//    procedure does to the patient) and the frame step (exposure);
//  - the team and the sound (LabTeam), the tip event log (EventLog with the
//    patient-event adapter and the radiation-dose level), and a
//    ProcedureRecorder (lab 'pci') that logs every console and modal opened
//    as a 'ui' event;
//  - hooks for the attending: beforeInject, beforeAction(action) and beamGate;
//  - the contrast and radiation budgets (pci-budgets-stop-rules,
//    src/simulation/pci/budgets.ts): the patient's contrast ceiling (the
//    scenario's patient facts, else the engine's profile; a hand-over's
//    contrast and agreed ceiling), every millilitre (the syringes and the
//    engine's own injections, such as a microcatheter injection), the dose and
//    the elapsed time; the team's announcements (a radiographer line); the
//    'high-contrast-volume' and 'high-radiation-dose' holds; and the
//    stop-or-continue checkpoint, which holds the beam until it is answered
//    in guided practice and exams (attending dialogue in the drawer in the
//    other modes); one that opens during a run waits for the run to end, so
//    the run is filmed. The 'long-case' variant of rca-cto opens part-way
//    through a long attempt (BUDGET_CARRY_VARIANTS, by the launch's variant).
//
// Patient coupling (pci-patient-coupling): the engine's coronary network
// follows the treated lumen (actions/patient.ts syncEngineCoronary, once the
// device is deflated); the contrast transport follows the engine's live
// coronary flow (patientBridge.ts engineFlowScale, TransportMods.flowScale);
// a launch variant 'hypotension-<cause>' (or 'hypotension-unknown') starts a
// hidden cause from the shared cause model (src/simulation/pci/hypotension.ts)
// with its onset, the learner's first action and its end recorded; an
// injection through a damped guide or with contrast held up at an ostium can
// bring VF, as can reperfusion of an occluded artery (the lcx-stemi variants
// 'vf-reperfusion', 'vf-refractory' and 'arrest-wire-across' make it
// certain); the defibrillator (pads, synchronised or not, energy, charge,
// clear, shock), a cough on request, manual CPR and a mechanical compression
// device drawn over the sternum (src/ui/pci/render/cpr.ts) and pericardio-
// centesis. The tips are at phase 'complication' while VF or pulseless VT is
// on the monitor or the pressure is low (COMPROMISE_EVENTS).
//
// It is the table-side controls' LabControlsTarget (controlsLab 'pci').
// snapshot() gives what pci-tip-context and the attending read; tipContext()
// is the lab's tip context until pci-tip-context replaces it.
//
// The session runs on lab time: the sum of the steps the shell's frame loop
// (or a development hook, or a test) has taken. Without a live monitor
// (`headlessFrames`) it books the exposure itself at the monitor's frame
// cadence, building the same scene the monitor draws but rendering nothing
// (stored frames are then blank: the GL renderer is what draws images).
// ---------------------------------------------------------------------------

import { buildAnatomy, type AnatomyModel } from "../../simulation/anatomy";
import { buildCoronaryTree, type CoronaryTree, type Sample } from "../../render/xray/coronaryTree";
import { buildXrayScene, LabImaging, treeCentre, type SceneResult } from "../../render/xray/sceneBuilder";
import type { TransportMods } from "../../render/xray/contrastTransport";
import type { XrayRenderer } from "../../render/xray/XrayRenderer";
import { CINE_RUN_S, CINE_TAIL_S, Injector, LUMENS, OPERATOR_DELAY_S, STANDARD_PUSH_S, lumenObstruction, traceAt, type CatheterLumen, type InjectionKind } from "../../simulation/injection";
import { HEART_PERIOD, pressureFromEngine } from "../../simulation/pressure";
import { catheterById } from "../../data/catheters";
import { VIEW_PRESETS, viewById } from "../../data/viewPresets";
import { catheterPath } from "../sim/helpers";
import {
  bailout,
  debrief,
  deflate,
  engageGuide,
  finishCase,
  giveDrug,
  giveVasodilator,
  inflate,
  inject,
  injectPci,
  loadDevice,
  lumenFor,
  moveDevice,
  moveWire,
  pciGeom,
  pciPatientEffects,
  recordAct,
  removeDevice,
  setWireKind,
  startPci,
  stepPci,
  torqueWire,
  type PciDebrief,
  type PciDrug,
  type PciGeom,
  type PciState,
  type WireKind,
} from "../../simulation/angioPci";
import { scenarioCase } from "../../simulation/pci/actions/scenario";
import { log, tele } from "../../simulation/pci/state";
import type { BalloonKind } from "../../simulation/pci/equipment";
import { resolveScenario, type ResolvedPciScenario } from "../../simulation/pci/scenarios/generate";
import { PCI_SCENARIO_DEFS, startOf } from "../../simulation/pci/scenarios/registry";
import type { PciRuntimeScenario } from "../../simulation/pci/scenarios/legacy";
import type { PciStartDef } from "../../simulation/pci/scenarios/types";
import { rnd, rngFrom, type RngState } from "../../simulation/pci/rng";
import { PatientEngine, type Vitals } from "../../simulation/patient/engine";
import type { ShockOutcome } from "../../simulation/patient/rhythm";
import { CREATININE_UMOL_PER_MGDL, cigarroaMacd, ckdEpi2021, cockcroftGault, generatePatient, type PatientProfile } from "../../simulation/patient/patient";
import { BudgetTracker, budgetCarryFor, type BudgetCarry, type BudgetCheckpoint, type BudgetPatient, type BudgetReadout, type BudgetReading, type CheckpointAnswer } from "../../simulation/pci/budgets";
import type { PciScenarioDef } from "../../simulation/pci/scenarios/types";
import { applyEffects, engineFlowScale, MP_FLOW_SCALE_START_S, newBridge, tipFromGuide, type BridgeMemory } from "../../simulation/pci/patientBridge";
import { MP_PATIENT_COUPLING, injectionVfHazard, newCoronarySync, syncEngineCoronary, type CoronarySync } from "../../simulation/pci/actions/patient";
import { setValve } from "../../simulation/pci/actions/devices";
import { seatGuide } from "../../simulation/pci/actions/guide";
import { HYPOTENSION_VARIANT_PREFIX, causeForVariant, newEpisode, recordEpisodeAction, type HypotensionEpisode, type PciCauseLab, type PciCausePort } from "../../simulation/pci/hypotension";
import { classifyRightHeart, startHypotensionCause, type CauseRun, type CauseTreatment } from "../../simulation/patient/hypotensionCauses";
import { catheterFamily } from "../../content/lab/tips";
import { REFERENCE_GENOME, thoraxGenome } from "../../render/xray/thorax";
import { MP_CPR_DEVICE, compressionDepthMm, type CprDrawState } from "./render/cpr";
import { COMPROMISE_EVENTS } from "../lab/pciEvents/base";
import { SOURCED_DOSES, type SessionHandover } from "../../simulation/session/caseSession";
import type { PedalState, TelemetryEvent } from "../../simulation/session/types";
import type { AnatomyCase, CArm, Vec3, VesselId } from "../../types";
import { CArmDrive, TableDrive } from "../../simulation/imaging/carm";
import type { DoseTotals } from "../../simulation/dose";
import type { PulseRate } from "../../render/xray/adrc";
import { FluoroLoop, STORE_PX, useSeriesStore, type RunRecorder, type StoredSeries } from "../../state/useSeriesStore";
import { BREATH_HOLD_LEVEL, BREATH_HOLD_MAX_S, DEFAULT_MEMORIES, doseSince, seedDose, startCineRun, storeFluoroLoop, type LabStart } from "../sim/labSession";
import { LabTeam } from "../lab/labTeam";
import { EventLog } from "../lab/eventLog";
import { PATIENT_EVENTS, PATIENT_EVENT_THRESHOLDS, PatientEventAdapter } from "../lab/patientEvents";
import { pciTipContext } from "../lab/pciTips";
import { labScreens, type LabPolicy } from "../lab/visibility";
import { visibilityFor } from "../../mentor/visibility";
import { ProcedureRecorder } from "../../mentor/telemetry";
import type { LaunchMode } from "../../content/schema";
import type { LabContext, LabEvent, LabPhase } from "../../content/lab/tips";
import type { LabRaises } from "../../content/lab/raisable/waiting";
import type { BackTableState, DefibReadout, FluoroLevel, ImagingControls, LabCapabilities, LabControlsTarget } from "../lab/controls/types";
import type { PciLaunch } from "./launch";
import { pciDevices, pciFlowMods } from "./pciDevicesRender";
import { uid } from "../../utils/random";

// --- constants -----------------------------------------------------------------------

/** Field sizes the PCI lab's detector offers (cm), as the earlier lab. */
export const PCI_FIELDS = [25, 20, 16, 12] as const;
/** The field the lab opens at (cm), as the earlier lab. */
export const PCI_DEFAULT_FIELD = 20;
/** Fluoroscopy pulse rates the PCI lab offers (p/s): hb-lab-and-radiation request 1 (3.75, 7.5, 15; Brilakis 28.2), and 30 as the diagnostic lab. */
export const PCI_FLUORO_RATES: readonly PulseRate[] = [3.75, 7.5, 15, 30];
/** Cine frame rates the PCI lab offers (f/s), as the diagnostic lab. */
export const PCI_CINE_RATES: readonly PulseRate[] = [7.5, 15, 30];
/**
 * While the beam is on, dose is booked at least this often (s), whatever the acquisition rate: the imaging
 * model books at most 0.2 s of beam time per exposed frame, which a 3.75 p/s frame interval (0.27 s)
 * exceeds. The earlier lab's 15 per second frame cadence. MODEL PARAMETER.
 */
export const PCI_DOSE_TICK_S = 1 / 15;
/** The procedure clock (Hz): indeflator, complications, patient effects; the earlier lab's 250 ms interval. */
export const PCI_PROCEDURE_HZ = 4;
/** A contralateral (collateral) run is filmed this long (s), until the distal vessel has filled; the earlier lab's value. MODEL PARAMETER. */
export const CONTRA_RUN_S = 6.5;
/** The hook's draw keeps the dose run open this long with the pedal up (s), as the earlier lab. */
const HOOK_HOLD_S = 0.5;

/**
 * The defibrillator's energies (J). The module text's settings: VF 150-200 J biphasic or 200-360 J
 * monophasic, high from the start (cp-complex-patients-lab-arrest, tip pci-arrest-defib-settings); stable
 * arrhythmias 150 J biphasic or 200 J monophasic; poorly tolerated VT 200-360 J (cm-patient-complications-
 * arrhythmia). The lower steps are the dial's, there to be chosen wrongly.
 */
export const DEFIB_ENERGIES_J = [50, 100, 150, 200, 360] as const;
/** The energy the defibrillator opens at (J): 200, as the earlier lab's Charge button. */
export const DEFIB_DEFAULT_J = 200;

/** MODEL PARAMETERS of the arrest and the coupling in the session (docs/realism/facts/pkg-pci-patient-coupling.md). */
export const MP_PCI_ARREST = {
  /** applying the defibrillator pads takes this long (s) */
  padsApplyS: 8,
  /** fitting the mechanical compression device pauses compressions this long (s) */
  deviceFitPauseS: 10,
  /** the 'arrest-wire-across' variant: VF this long into the run (s), and the shocks that fail before one converts */
  arrestOnsetS: 6,
  arrestRefractoryShocks: 4,
  /** the 'vf-refractory' variant: the reperfusion VF's shocks that fail before one converts */
  refractoryShocks: 3,
  /** a hidden hypotension cause starts this long into the run (s), or as soon as its trigger is there after that */
  causeOnsetS: 10,
  /** a vasovagal reaction in this lab: the vagal level the cause forces (the engine's forced level otherwise) */
  vagalLevel: 1,
  /** pericardiocentesis without a running cause drains up to this volume (mL) */
  drainMl: 250,
  /**
   * In a hypotension drill (a 'hypotension-*' variant) the monitor's low-pressure limit is the patient's resting
   * mean pressure less this (mmHg), never below the shared limit (PATIENT_EVENT_THRESHOLDS): a fall of this size
   * from a high resting pressure is the fall the drill is about (the module's example falls about 26 mmHg, from
   * 128/70 to 94/48)
   */
  drillHypotensionFallMmHg: 20,
} as const;

/**
 * The thorax as the scene builds it (src/render/xray/thorax.ts): bodyFrame's front (centre z, half-depth, scaled by
 * habitus and depth) and the sternal body (centre y, half-length), mm. Copied here because thorax.ts does not
 * export them; keep in step with bodyFrame and the sternum in thorax.ts.
 */
export const THORAX_FRONT = { centreZMm: -46, halfDepthMm: 126, sternalBodyCentreYMm: 102, sternalBodyHalfLengthMm: 52 } as const;

/** The defibrillator's message when Shock is pressed without pads (the live log). */
export const DEFIB_NO_PADS_TEXT = "Defibrillator: no pads connected, nothing delivered";

/** The lcx-stemi arrhythmia variants (pci-patient-coupling). */
export const ARRHYTHMIA_VARIANTS = ["vf-reperfusion", "vf-refractory", "arrest-wire-across"] as const;
export type ArrhythmiaVariant = (typeof ARRHYTHMIA_VARIANTS)[number];

/** The chest compressions now: none, by hand, or by the mechanical device (being fitted, or running). */
export type CprMode = "off" | "manual" | "fitting" | "mechanical";

/** The defibrillator console's settings and read-out. */
export interface DefibSettings {
  /** pads on the chest (sternum and apex) */
  pads: boolean;
  /** pads being applied: on at this lab time */
  padsAt: number | null;
  /** synchronised mode (cardioversion): no discharge without an R wave */
  sync: boolean;
  /** the energy selected (J) */
  energyJ: number;
}

/** One arrhythmia the lab brought on, with its trigger (the debrief's record). */
export interface ArrhythmiaRecord {
  t: number;
  kind: "vf" | "vt" | "brady" | "af" | "chb";
  trigger: string;
}

/** The injection kinds the guide's syringe offers (the earlier lab's buttons). */
export const PCI_INJECTION_KINDS: { id: Exclude<InjectionKind, "held">; label: string; title: string }[] = [
  { id: "puff", label: "Test puff", title: "A few millilitres pushed briskly: check the position before a run" },
  { id: "standard", label: "Standard", title: "A press is a standard injection; hold to inject for longer" },
  { id: "forceful", label: "Forceful", title: "Push harder: denser filling, more reflux into the sinus" },
];

/** The device diameters the assisted device console offers (mm): the earlier lab's menu. */
export const DEVICE_DIAMETERS = [2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0] as const;
/** The device lengths the assisted device console offers (mm): the earlier lab's menu. */
export const DEVICE_LENGTHS = [8, 12, 15, 18, 20, 23, 28, 33, 38] as const;
/** The indeflator's dial range in the assisted device console (atm): the earlier lab's slider. */
export const INDEFLATOR_RANGE = [2, 24] as const;

/**
 * A size from the assisted device console's menu for a reference diameter and a lesion length (scripted runs and tests,
 * never shown to the learner): the menu diameter nearest the reference, and the shortest menu length that
 * covers the lesion with at least 3 mm each side.
 */
export function deviceSizeFor(refDiameterMm: number, lesionLengthMm: number): { diameter: number; lengthMm: number } {
  const diameter = DEVICE_DIAMETERS.reduce((a, d) => (Math.abs(d - refDiameterMm) < Math.abs(a - refDiameterMm) ? d : a), DEVICE_DIAMETERS[0]);
  const lengthMm = DEVICE_LENGTHS.find((l) => l >= lesionLengthMm + 6) ?? DEVICE_LENGTHS[DEVICE_LENGTHS.length - 1];
  return { diameter, lengthMm };
}

/** The actions the attending may stop before they happen (beforeAction). */
export type PciAction =
  | "engage-guide"
  | "advance-wire"
  | "torque-wire"
  | "wire-kind"
  | "load-device"
  | "advance-device"
  | "remove-device"
  | "inflate"
  | "deflate"
  | "inject"
  | "drug"
  | "flush-guide"
  | "finish";

/** The continuous hand-over from the full case (C5): the case's patient engine and the dose so far. */
export interface PciHandover {
  h: SessionHandover;
  start: LabStart;
}

export interface PciLabSessionOptions {
  /** a registry scenario id (default: the first core scenario); ignored when `launch` is given */
  scenarioId?: string;
  /** a resolved launch (src/ui/pci/launch.ts): scenario, variant, start, mode and events */
  launch?: PciLaunch | null;
  /** the full case's hand-over: its patient engine and dose */
  handover?: PciHandover | null;
  /** the assessment mode (default: the launch's, else guided) */
  mode?: LaunchMode;
  /** the run's policy (the shell passes useLabRun's); default the mode's own */
  policy?: LabPolicy;
  /** the team and the sound (default true; tests pass false) */
  team?: boolean;
  /** book the exposure in step() (no live monitor: tests, the development hooks) */
  headlessFrames?: boolean;
}

/** What the live monitor and the headless frame step need for one frame. */
export interface PciFrameOptions {
  /** frame number (the monitor's counter) */
  frame: number;
  /** a run time to draw at (the development hook's standard plan), overriding the live bolus time */
  bt?: number | null;
}

/** The PCI lab's state as the tip context and the attending read it (pci-tip-context, pci-attending). */
export interface PciLabSnapshot {
  /** lab seconds */
  t: number;
  state: PciState;
  definition: ResolvedPciScenario["def"];
  scenario: PciRuntimeScenario;
  start: PciStartDef;
  /** the active target lesion as the geometry places it (mm along its route) */
  lesion: { vessel: VesselId; startMm: number; endMm: number; centreMm: number; refDiameter: number };
  vitals: Vitals;
  rhythm: string;
  /** the guide pressure trace's class (normal, damped, ventricularised...) */
  guidePressure: string;
  dose: DoseTotals;
  /** contrast given so far in this lab (mL): the syringes and the engine's own injections */
  contrastMl: number;
  /** the contrast and radiation budgets (pci-budgets-stop-rules) */
  budget: BudgetReadout;
  policy: LabPolicy;
  workflow: {
    prebriefOpen: boolean;
    timeOutDone: boolean;
    finishing: boolean;
    finished: boolean;
    beam: "fluoro" | "cine" | null;
    injecting: boolean;
    runLive: boolean;
    xrayEnabled: boolean;
  };
  openModals: string[];
  openConsole: string | null;
  events: EventLog;
  activeEvents: LabEvent[];
}

/**
 * What this session reports to the lab tips (the reachability report reads the PCI event sources): the plan and
 * finish phases, the complication phase while VF, pulseless VT, a low pressure or tamponade is on
 * (pci-patient-coupling), the dose level, the patient events and cardiogenic shock (a low pressure with the
 * pump failure pattern of the right heart numbers).
 */
export const raises: LabRaises = {
  lab: "pci",
  phases: ["plan", "finish", "complication"],
  events: ["high-radiation-dose", "cardiogenic-shock", ...PATIENT_EVENTS],
};

/** Team drugs that also act on the PCI complication engine (intracoronary bail-outs, heparin, protamine). */
export function pciDrugFor(drug: string, route: string): PciDrug | null {
  if (drug === "heparin") return "heparin";
  if (drug === "protamine") return "protamine";
  if (drug === "atropine") return "atropine";
  if (route === "ic" && drug === "adenosine") return "ic-adenosine";
  if (route === "ic" && drug === "verapamil") return "ic-verapamil";
  if (route === "ic" && drug === "adrenaline") return "ic-epinephrine";
  return null;
}

/** The guide's lumen for its French size (5 Fr guides are not in the lumen table: the 6 Fr lumen stands in). */
export function guideLumen(french: number): CatheterLumen {
  return french >= 7 ? LUMENS["guide-7"] : LUMENS["guide-6"];
}

/** The default policy of a mode (guided practice at entrustment I, the other modes at II). */
export function policyForMode(mode: LaunchMode): LabPolicy {
  const entrustment = mode === "guided" ? 1 : 2;
  return { mode, entrustment, visibility: mode === "exam" ? visibilityFor("exam") : visibilityFor(mode, entrustment), source: mode === "exam" ? "exam" : "level" };
}

interface Bolus {
  /** lab seconds of the press: the cine starts here, the push follows after the operator's delay */
  start: number;
  side: "left" | "right";
  /** through the second (contralateral, diagnostic) catheter */
  contra: boolean;
}

const BLANK_FRAME = () => new Uint8Array(STORE_PX * STORE_PX);

export class PciLabSession implements LabControlsTarget {
  readonly controlsLab = "pci" as const;
  /** the options this session was made from (repeat() makes the next one from them) */
  readonly options: PciLabSessionOptions;
  readonly resolved: ResolvedPciScenario;
  readonly s: PciRuntimeScenario;
  readonly startDef: PciStartDef;
  readonly mode: LaunchMode;
  readonly caseData: AnatomyCase;
  readonly caseId: string;
  readonly model: AnatomyModel;
  readonly refTree: CoronaryTree;
  readonly baseTree: CoronaryTree;
  readonly g: PciGeom;
  readonly engine: PatientEngine;
  readonly lab: LabImaging;
  readonly syringes: { guide: Injector; contra: Injector };
  readonly carm: CArmDrive;
  readonly table: TableDrive;
  readonly fluoroLoop = new FluoroLoop();
  readonly events: EventLog;
  readonly recorder: ProcedureRecorder;
  readonly crew: LabTeam | null;
  readonly handover: PciHandover | null;
  /** a contralateral catheter for dual injection (CTO scenarios) */
  readonly dual: boolean;
  /** the contrast and radiation budgets, the announcements and the checkpoints (pci-budgets-stop-rules) */
  readonly budgets: BudgetTracker;
  /** the totals a 'long-case' variant opened with, or null */
  readonly carry: BudgetCarry | null;
  memories: (CArm | null)[] = DEFAULT_MEMORIES.slice();
  drivingMemory: number | null = null;
  /** the run being recorded (cine pedal down) */
  run: RunRecorder | null = null;
  /** asked before an injection starts (the attending's safety stop); false blocks it */
  beforeInject: (() => boolean) | null = null;
  /** asked before an operator action (the attending's safety stops); false blocks it */
  beforeAction: ((action: PciAction) => boolean) | null = null;
  /** the beam may be enabled (false until the time-out in modes that require one) */
  beamGate: (() => boolean) | null = null;
  /** lab seconds the breath-hold started, or null while breathing */
  breathHoldSince: number | null = null;
  /** lab seconds of the last exposed image (last-image hold) */
  lastImageAt: number | null = null;
  /** the injection kind of the guide's syringe (the next press) */
  injKind: Exclude<InjectionKind, "held"> = "standard";
  /** the indeflator's set pressure in the assisted console (atm) */
  indeflatorAtm = 10;
  field: number = PCI_DEFAULT_FIELD;
  xrayEnabled = true;
  shutters: [number, number, number, number] = [0, 0, 0, 0];
  wedge = { insertion: 0, angleDeg: 0 };
  /** the guide's lumen holds saline (flushed) until the next push */
  guideFlushed = false;
  /** the last run's syringe read-out (volume, flow, pressure), for the console */
  lastRun: string | null = null;
  /** contrast pushed through both syringes and booked (mL) */
  contrastUsed = 0;
  policy: LabPolicy;
  /** the case-brief (plan) dialogue is open: the tips are at phase 'plan' */
  prebriefOpen = false;
  timeOutDone = true;
  finishing = false;
  finished = false;
  result: PciDebrief | null = null;
  version = 0;
  disposed = false;

  private _st: PciState;
  private tree: CoronaryTree;
  private treeKey: string;
  private simT = 0;
  private procAcc = 0;
  private slowAcc = 0;
  private notifyAcc = 0;
  private frameAcc = Infinity;
  /** The last exposed frame's scene, its beam mode and when its beam time was last booked (lab s). */
  private lastExposed: { res: SceneResult; mode: "fluoro" | "cine"; t: number } | null = null;
  private headlessFrame = 0;
  private hookDrawAt = -Infinity;
  private exposedSinceBeamOff = false;
  private bolus: Bolus | null = null;
  private bookedMl = 0;
  /** contrast the engine's own actions gave (a microcatheter injection), mL: not through the syringes */
  private extraContrastMl = 0;
  /** a blocking checkpoint opened during a run: it is shown, and holds the beam, when the run ends */
  private cpDeferred = false;
  /** a run's volume is being booked into the state (not an engine injection) */
  private bookingRun = false;
  private bolusSide: "left" | "right";
  private pedalCmd: PedalState = { fluoro: false, cine: false };
  private autoCine = false;
  private lastPedal: PedalState = { fluoro: false, cine: false };
  private lastBeamMode: "fluoro" | "cine" | "hold" | "" = "";
  private wasInflated = false;
  private bridge: BridgeMemory = newBridge();
  private bridgeRng: RngState;
  /** pci-patient-coupling: the network the engine has, the coupling's generator, the launch's variant */
  private coronarySync: CoronarySync;
  private couplingRng: RngState;
  private readonly variant: string | null;
  /** a hidden hypotension cause: the one the variant names (waiting for its onset), and its run once started */
  private pendingCause: string | null = null;
  private causeRun: CauseRun | null = null;
  private causePort: PciCausePort | null = null;
  private flushCount = 0;
  private lineRmm0 = 0;
  private drainedMl = 0;
  private aspirateCount = 0;
  private arrestDue: number | null = null;
  private forceReperfusionVf = false;
  private reperfusionRefractory = 0;
  private cprFitUntil: number | null = null;
  /** the live flow scale and the transport's flow conditions, kept until the engine's supplies or the lumen change */
  private flowScaleMemo: { ver: number; tree: CoronaryTree | null; value: Record<string, number> | undefined; key: string } = { ver: -1, tree: null, value: undefined, key: "" };
  private flowModsMemo: { key: string; mods: TransportMods } | null = null;
  /** the hypotension episodes of the case (onset, first action, end) */
  episodes: HypotensionEpisode[] = [];
  /** the arrhythmias the lab brought on, with their triggers */
  arrhythmias: ArrhythmiaRecord[] = [];
  /** the defibrillator's settings */
  defib: DefibSettings = { pads: false, padsAt: null, sync: false, energyJ: DEFIB_DEFAULT_J };
  /** chest compressions now */
  cpr: CprMode = "off";
  private readonly patientEvents: PatientEventAdapter;
  private modals = new Set<string>();
  private console: string | null = null;
  private listeners = new Set<() => void>();
  private stepListeners = new Set<(dt: number) => void>();
  private capabilities = new Map<keyof LabCapabilities, LabCapabilities[keyof LabCapabilities]>();
  private offs: (() => void)[] = [];
  private readonly headless: boolean;

  constructor(o: PciLabSessionOptions = {}) {
    this.options = o;
    const launch = o.launch ?? null;
    this.handover = o.handover ?? null;
    this.resolved = launch?.resolved ?? resolveScenario(o.scenarioId ?? PCI_SCENARIO_DEFS[0].id);
    this.s = this.resolved.scenario;
    this.startDef = launch?.start ?? startOf(this.resolved.def)!;
    this.mode = o.mode ?? launch?.mode ?? "guided";
    this.policy = o.policy ?? policyForMode(this.mode);
    this.headless = !!o.headlessFrames;
    this.dual = this.s.target.kind === "cto";
    this.bolusSide = this.s.side;
    // anatomy and geometry: the reference tree never changes; the diseased tree follows the lumen
    this.caseData = scenarioCase(this.s);
    this.caseId = this.caseData.id;
    this.model = buildAnatomy(this.caseData);
    this.refTree = buildCoronaryTree(this.model, { ...this.caseData, lesions: [] });
    this.baseTree = buildCoronaryTree(this.model, this.caseData);
    this.g = pciGeom(this.s, this.baseTree, this.refTree);
    this._st = startPci({ def: this.resolved.def, scenario: this.s, seed: this.resolved.seed }, this.g, this.startDef.id);
    this.tree = this.baseTree;
    this.treeKey = "";
    this.syncTree();
    // the patient: the case's own engine after a hand-over, else one for this scenario, heparinised to the
    // lower PCI dose (70 U/kg; SOURCED_DOSES, 2011 ACCF/AHA/SCAI) as the scenarios assume
    if (this.handover) this.engine = this.handover.start.engine;
    else {
      const profile = scenarioProfile(this.caseData.id, this.resolved.def);
      const e = new PatientEngine({ ...(profile ? { profile } : { seed: this.caseData.id }), tree: this.baseTree, lesions: this.caseData.lesions });
      if (this.resolved.def.setup.heparinised ?? true) e.give({ drug: "heparin", dose: Math.round((e.profile.weightKg * SOURCED_DOSES.pciHeparinUPerKg[0]) / 500) * 500, route: "iv" });
      e.advance(8);
      // the adenosine hazards of the PCI lab (complete block, then AF or VF after a high-risk intracoronary dose)
      e.setAdenosineHazards({});
      this.engine = e;
    }
    // breathing swings the constraint of an effusion on the heart (pulsus paradoxus): this lab turns it on
    this.engine.setPulsusParadoxus(true);
    this.lineRmm0 = this.engine.transducer.line.catheterRmm;
    this.bridgeRng = rngFrom(`${this.caseId}:bridge`);
    // patient coupling (pci-patient-coupling): the network the engine has, the variant's hidden cause or arrhythmia
    this.variant = launch?.params.variant ?? null;
    this.couplingRng = rngFrom(`${this.caseId}:coupling:${this.variant ?? ""}`);
    // the sync starts from the network the engine has (its own lesions), so a start whose lumen differs is pushed
    this.coronarySync = newCoronarySync(this.engine.lesions, this._st.severity);
    this.pendingCause = causeForVariant(this.variant, () => rnd(this.couplingRng), catheterFamily(this._st.guide.id) ?? this._st.guide.id);
    // the guide trace's class follows what the line shows (contrast or a plug in the guide damps it)
    this.engine.setDisplayedDampingClass(true);
    this.applyArrhythmiaVariant(this.variant);
    // pads are on from the start in an acute case (the scenario's 'stemi' event); elsewhere they are applied when needed
    if (this.resolved.events.includes("stemi") || (launch?.events ?? []).includes("stemi")) this.defib = { ...this.defib, pads: true };
    // the lab's imaging for this patient: the engine's clock (the image beats and breathes with the ECG), one
    // dose-rate controller, one dose tracker, carrying on from the dose the case gave before this lab
    this.lab = new LabImaging({ hr: 60 / HEART_PERIOD, seed: this.caseData.id, clock: this.engine.clock });
    seedDose(this.lab.dose, this.handover?.start.dose);
    // a variant opened part-way through a long attempt carries its dose, contrast and time (not after a hand-over):
    // looked up by the launch's variant id, for a scenario that declares it (a seed of the same name carries nothing)
    this.carry = this.handover ? null : budgetCarryFor(this.resolved.def.id, launch?.params.variant ?? null);
    if (this.carry) seedDose(this.lab.dose, { fluoroS: this.carry.fluoroS, karMGy: this.carry.karMGy, kapGyCm2: 0 });
    // the budgets: the ceiling from the scenario's patient facts or the engine's profile, the hand-over's
    // contrast counted as used and its agreed ceiling as the plan
    const h = this.handover?.h;
    const handedMl = Math.max(0, Number(h?.contrastMl) || 0) + (this.carry?.contrastMl ?? 0);
    this.budgets = new BudgetTracker(
      budgetPatientOf(this.engine.profile, this.handover ? null : this.resolved.def),
      {
        cto: this.s.target.kind === "cto",
        handedOverMl: handedMl,
        // the team names the rule's ceiling only where the screens may show it (the teaching aids)
        announceCeiling: labScreens(this.policy).teachingAids,
        ...(h && Number(h.contrastBudgetMl) > 0 ? { planContrastMl: Number(h.contrastBudgetMl) } : {}),
      },
      { elapsedOffsetS: this.carry?.elapsedS ?? 0 }
    );
    // the manifold syringes for this patient (injection.ts); the guide arrives primed with contrast from engagement
    this.syringes = { guide: new Injector(guideLumen(this._st.guide.french), { primed: 1 }), contra: new Injector(LUMENS["diag-6"], { primed: 1 }) };
    // the calls already passed before this lab are not made again (the events are raised at the first step)
    if (this.handover || this.carry) this.budgets.prime(this.budgetReading());
    this.carm = new CArmDrive(viewById(this.s.views[0])?.cArm ?? { laoRao: 0, cranialCaudal: 0 });
    this.table = new TableDrive({ x: 0, y: 0, height: 0 });
    this.provideCapability("patient", this.engine);
    // the tips: the event log on lab time, the run's events held for the whole case, the patient
    this.events = new EventLog({
      clock: () => this.simT,
      sink: (kind, data, t) => this.crew?.push([{ tWall: t, tPatient: this.engine.time, kind, data }]),
    });
    const held = launch?.events ?? this.resolved.events;
    if (held.length) this.events.hold(held, 0, "case");
    // the patient adapter's contrast rule follows this lab's ceiling (contrastBudget), not the fraction of the MACD
    // a hypotension drill's low-pressure limit is set from this patient's resting pressure (MP_PCI_ARREST)
    const drill = !!this.variant?.startsWith(HYPOTENSION_VARIANT_PREFIX);
    const restMap = this.engine.vitals().aortaTrue.mean;
    const lowMap = drill && Number.isFinite(restMap) ? Math.max(PATIENT_EVENT_THRESHOLDS.hypotensionMapMmHg, Math.round(restMap - MP_PCI_ARREST.drillHypotensionFallMmHg)) : null;
    this.patientEvents = new PatientEventAdapter(this.events, { contrastHigh: () => this.budgets.raised().contrast, ...(lowMap !== null ? { thresholds: { hypotensionMapMmHg: lowMap } } : {}) });
    this.recorder = new ProcedureRecorder({
      id: uid(),
      startedAt: Date.now(),
      caseId: this.caseId,
      lab: "pci",
      mode: this.policy.mode,
      entrustment: this.policy.entrustment,
      seed: this.resolved.seed ?? this.caseId,
      context: { scenario: this.s.id, start: this.startDef.id, guide: this.s.guide },
    });
    this.recorder.event({ kind: "case-start", tWall: 0, tPatient: this.engine.time, step: 0, cmd: 0, ext: true, data: { caseId: this.caseId, lab: "pci", mode: this.policy.mode, entrustment: this.policy.entrustment } });
    // the team and the sound (C4)
    this.crew =
      o.team === false
        ? null
        : new LabTeam({
            seed: this.caseId,
            patient: this.engine,
            carm: this.carm,
            table: this.table,
            imaging: () => ({ fluoroPps: this.lab.exposure.fluoroPps, cinePps: this.lab.exposure.cinePps, fieldCm: this.field, fluoroLevel: this.lab.exposure.fluoroLevel ?? "normal", fluoroMin: this.lab.dose.totals.fluoroTimeS / 60 }),
            catheterSide: () => this.s.side,
          });
    if (this.crew) {
      const crew = this.crew;
      crew.onProtocol = (a) => {
        if (a.fieldCm) this.setFieldSize(a.fieldCm);
        if (a.fluoroPps !== undefined) this.setFluoroRate(a.fluoroPps);
        if (a.cinePps !== undefined) this.setCineRate(a.cinePps);
        if (a.fluoroLevel) this.setFluoroLevel(a.fluoroLevel);
        if (a.storeFluoro) this.storeFluoro();
        this.notify();
      };
      // drugs, oxygen and ACTs the team gives also act on the procedure (bail-outs, heparin, protamine)
      this.offs.push(
        crew.onEvents((evs: readonly TelemetryEvent[]) => {
          for (const e of evs) {
            const d = (e.data ?? {}) as Record<string, unknown>;
            if (e.kind === "team.drug-given") {
              const pd = pciDrugFor(String(d.drug), String(d.route));
              if (pd) this.update((x) => giveDrug(this.s, this.g, x, pd, Number(d.dose)));
              // the team's atropine and fluid treat a running hidden cause that answers to them
              if (d.drug === "atropine") this.treatCause("atropine");
            } else if (e.kind === "team.oxygen") this.update((x) => (x.oxygen ? x : bailout(this.s, this.g, x, "oxygen")));
            else if (e.kind === "team.act" && Number.isFinite(Number(d.act))) this.update((x) => recordAct(x, Number(d.act)));
          }
        })
      );
    }
  }

  // --- state ------------------------------------------------------------------------

  /** The procedure state now. */
  get st(): PciState {
    return this._st;
  }

  /** The coronary tree drawn now (its lumen follows the treatment). */
  get drawTree(): CoronaryTree {
    return this.tree;
  }

  /** Lab seconds since the session started. */
  wall(): number {
    return this.simT;
  }

  private syncTree() {
    const st = this._st;
    const key = `${st.severity}|${st.stents.length}|${st.stents.map((p) => `${p.fromMm.toFixed(2)}:${p.toMm.toFixed(2)}:${p.diameter.toFixed(3)}:${p.compressionMm}`).join(",")}`;
    if (key === this.treeKey) return;
    this.treeKey = key;
    const lumen = lumenFor(this.s, this.g, st);
    this.tree = buildCoronaryTree(this.model, { ...this.caseData, lesions: lumen.lesions }, lumen.scaffolds);
  }

  /** Apply an engine change (no gate: the team's drugs, the procedure clock). */
  private update(f: (x: PciState) => PciState) {
    const prev = this._st;
    const next = f(prev);
    if (next === prev) return;
    // contrast the engine's own actions gave (a microcatheter injection): booked here, to the patient and the
    // budget. A run's volume is booked by onRunEnd; an OCT flush is booked on the guide's syringe by its binding.
    if (!this.bookingRun && next.contrastMl > prev.contrastMl) {
      const fresh = next.log.slice(prev.log.length);
      if (!fresh.some((r) => r.kind === "imaging-flush")) {
        const d = next.contrastMl - prev.contrastMl;
        this.extraContrastMl += d;
        this.engine.contrast(d, this.s.side);
      }
    }
    this._st = next;
    this.syncTree();
    this.notify();
  }

  /** An operator action, asked of the attending first. Returns false when it was stopped. */
  private act(action: PciAction, f: (x: PciState) => PciState): boolean {
    if (this.disposed || this.finished) return false;
    if (this.beforeAction && !this.beforeAction(action)) return false;
    this.noteAction(action);
    this.update(f);
    return true;
  }

  /** An operator action against the open hypotension episode (time to recognition: the first one counts). */
  private noteAction(action: string) {
    const i = this.episodes.length - 1;
    if (i < 0 || this.episodes[i].resolvedT !== null) return;
    this.episodes[i] = recordEpisodeAction(this.episodes[i], action, this.simT);
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Called after every lab step (an attending recorder samples here). */
  onStep(fn: (dt: number) => void): () => void {
    this.stepListeners.add(fn);
    return () => this.stepListeners.delete(fn);
  }

  notify() {
    this.version++;
    for (const f of this.listeners) f();
  }

  setPolicy(p: LabPolicy) {
    this.policy = p;
    this.notify();
  }

  // --- operator actions ----------------------------------------------------------------

  engageGuide(): boolean {
    return this.act("engage-guide", (x) => engageGuide(this.s, x));
  }

  /** Advance (+) or withdraw (−) the wire by mm. */
  moveWire(mm: number): boolean {
    return this.act("advance-wire", (x) => moveWire(this.s, this.g, x, mm));
  }

  torqueWire(rad: number): boolean {
    return this.act("torque-wire", (x) => torqueWire(x, rad));
  }

  setWireKind(k: WireKind): boolean {
    return this.act("wire-kind", (x) => setWireKind(x, k));
  }

  /**
   * Load a balloon or a stent on the wire with the team doing the steps (the assisted path of the
   * AssistedDeviceConsole: label checked, prepared, backloaded, valve opened, guide aspirated).
   */
  loadDevice(kind: "balloon" | "stent", balloon: BalloonKind, diameter: number, lengthMm: number): boolean {
    return this.act("load-device", (x) => loadDevice(x, kind, kind === "stent" ? "semi-compliant" : balloon, diameter, lengthMm));
  }

  /** Move the device along the wire (the assisted path, without the delivery physics). */
  advanceDevice(mm: number): boolean {
    return this.act("advance-device", (x) => moveDevice(x, mm));
  }

  removeDevice(): boolean {
    return this.act("remove-device", (x) => removeDevice(x));
  }

  /** Inflate the device to `atm` (deploys a stent); the assisted path. */
  inflate(atm = this.indeflatorAtm): boolean {
    return this.act("inflate", (x) => inflate(this.s, this.g, x, atm));
  }

  deflate(): boolean {
    return this.act("deflate", (x) => deflate(x));
  }

  giveVasodilator(): boolean {
    return this.act("drug", (x) => giveVasodilator(x));
  }

  setIndeflatorAtm(atm: number) {
    this.indeflatorAtm = Math.max(0, atm);
    this.notify();
  }

  setInjectionKind(k: Exclude<InjectionKind, "held">) {
    this.injKind = k;
    this.notify();
  }

  /** Flush the guide with saline: the lumen clears and the next push delivers the saline first. */
  flushGuide(): boolean {
    if (this.disposed || this.finished) return false;
    if (this.beforeAction && !this.beforeAction("flush-guide")) return false;
    this.syringes.guide.flush();
    this.guideFlushed = true;
    this.flushCount++;
    this.noteAction("flush-guide");
    this.treatCause("flush-line");
    this.notify();
    return true;
  }

  // --- injections ------------------------------------------------------------------------

  /**
   * Press on a syringe: the guide's (side = the scenario's), or the contralateral catheter's. With
   * `autoCine` (the cine injection: Space, the earlier lab's button) the cine pedal is held for the run,
   * as the earlier lab filmed every injection; the table-side Inject (LabControlsTarget) leaves the
   * pedals to the operator. Returns false when it was refused.
   */
  inject(o: { side?: "left" | "right"; kind?: Exclude<InjectionKind, "held">; autoCine?: boolean } = {}): boolean {
    if (this.disposed || this.finished) return false;
    const side = o.side ?? this.s.side;
    const contra = side !== this.s.side;
    if (contra && !this.dual) return false;
    if (this.beforeInject && !this.beforeInject()) return false;
    if (this.beforeAction && !this.beforeAction("inject")) return false;
    const kind = o.kind ?? (contra ? "standard" : this.injKind);
    const t = this.simT;
    const inj = contra ? this.syringes.contra : this.syringes.guide;
    if (this.bolus) this.endBolus();
    const tr0 = inj.start(t, { kind, side });
    this.bolus = { start: t, side, contra };
    this.bolusSide = side;
    // the case's contrast total is the syringes' measured volume, booked at the end of each run;
    // a run through the guide carries its physical effects (air, dissection extension, ostial injury)
    this.update((x) => (contra ? { ...inject({ ...this.s, side }, x), contrastMl: x.contrastMl } : injectPci(this.s, this.g, x, { ml: 0, psi: tr0.peakPsi, forceful: kind === "forceful", puff: kind === "puff" })));
    if (!contra) this.guideFlushed = false;
    this.noteAction("inject");
    // an injection through a damped guide, or into an ostium the contrast cannot clear, can bring VF (pci-patient-coupling)
    if (!contra && this.engine.rhythm.st.base !== "vf") {
      // the hazard follows the tip itself, not a line damped by contrast or a plug
      const why = injectionVfHazard({ side, tipState: this.engine.physicalTipState(), engaged: this._st.guide.engaged, ostialStenosis: this._st.guide.ostialStenosis ?? 0 }, () => rnd(this.couplingRng));
      if (why) this.bringVf(why);
    }
    if (o.autoCine) {
      this.autoCine = true;
      this.syncPedal();
    }
    this.notify();
    return true;
  }

  /** Release the plunger (key or button up). */
  releaseInjection() {
    const t = this.simT;
    this.syringes.guide.release(t);
    this.syringes.contra.release(t);
  }

  /** Seconds since the press of the run in progress, or null. */
  bolusTime(): number | null {
    return this.bolus ? this.simT - this.bolus.start : null;
  }

  /** The run in progress (side, through the contralateral catheter), or null. */
  bolusInfo(): Readonly<Bolus> | null {
    return this.bolus;
  }

  /** How long the run in progress is filmed (s since the press): the library's median run, at least CINE_TAIL_S beyond a longer push. */
  private runLength(): number {
    const b = this.bolus;
    if (!b) return 0;
    if (b.contra) return CONTRA_RUN_S;
    const tr = this.syringes.guide.trace;
    return Math.max(CINE_RUN_S, (tr?.pushEnd ?? this.simT - b.start) + CINE_TAIL_S);
  }

  private endBolus() {
    const b = this.bolus;
    if (!b) return;
    this.bolus = null;
    (b.contra ? this.syringes.contra : this.syringes.guide).finish();
    this.onRunEnd();
    if (this.autoCine) {
      this.autoCine = false;
      this.syncPedal();
    }
    // a blocking checkpoint that opened during the run is shown now, and the beam is held from here
    if (this.cpDeferred) {
      this.cpDeferred = false;
      if (this.budgets.pending() && !this.finished && !this.disposed) {
        this.openModal("checkpoint");
        this.syncPedal();
      }
    }
  }

  /** A run has ended: book the syringes' volume (the patient receives what was pushed; the debrief scores it). */
  private onRunEnd() {
    const g6 = this.syringes.guide.stats;
    const d6 = this.syringes.contra.stats;
    const total = g6.totalMl + d6.totalMl;
    this.contrastUsed = total;
    const fresh = total - this.bookedMl;
    if (fresh > 0) {
      this.engine.contrast(fresh, this.bolusSide);
      this.bookedMl = total;
    }
    this.bookingRun = true;
    try {
      this.update((x) => ({ ...x, contrastMl: Math.round(total + this.extraContrastMl) }));
    } finally {
      this.bookingRun = false;
    }
    const last = [g6.last, d6.last].filter(Boolean).pop();
    if (last)
      this.lastRun = `${last.kind === "puff" ? "puff" : "run"} ${last.volumeMl.toFixed(1)} mL (push ${(last.volumeMl - last.tailMl).toFixed(1)} + release ${last.tailMl.toFixed(1)}) · peak ${last.peakFlow.toFixed(1)} mL/s · ${last.peakPsi.toFixed(0)} psi${last.empty && last.kind !== "puff" ? " · syringe empty" : ""}`;
  }

  /** Volume pushed so far, including the run in progress (mL). */
  contrastPushed(): number {
    const g = this.syringes.guide;
    const c = this.syringes.contra;
    return g.stats.totalMl + c.stats.totalMl + (g.trace?.volumeMl ?? 0) + (c.trace?.volumeMl ?? 0);
  }

  /** Contrast given in this lab (mL): the syringes (the run in progress included) and the engine's own injections. */
  contrastTotal(): number {
    return this.contrastPushed() + this.extraContrastMl;
  }

  // --- foot switches ---------------------------------------------------------------------

  /** The pedals as the beam sees them: the operator's, the cine injection's held cine, the X-ray release and the gate. */
  get pedal(): PedalState {
    return this.effectivePedal();
  }

  private effectivePedal(): PedalState {
    const allowed = this.xrayEnabled && !this.finished && !this.disposed && (!this.beamGate || this.beamGate()) && !this.checkpointHoldsBeam();
    if (!allowed) return { fluoro: false, cine: false };
    return { fluoro: this.pedalCmd.fluoro, cine: this.pedalCmd.cine || this.autoCine };
  }

  /** The operator's foot on one pedal (keys F and C, the on-screen pedals). */
  pressPedal(which: "fluoro" | "cine", on: boolean) {
    if (this.pedalCmd[which] === on) return;
    this.setPedal({ ...this.pedalCmd, [which]: on });
  }

  /** The operator's foot on the pedals. */
  setPedal(p: PedalState) {
    if (this.disposed) return;
    this.pedalCmd = { fluoro: !!p.fluoro, cine: !!p.cine };
    this.syncPedal();
    this.notify();
  }

  /** The beam now: cine wins over fluoroscopy; null with both pedals up. */
  beamMode(): "fluoro" | "cine" | null {
    const p = this.effectivePedal();
    return p.cine ? "cine" : p.fluoro ? "fluoro" : null;
  }

  /** Follow the effective pedals: start and end the recorded cine run, and the exposure tone. */
  private syncPedal() {
    const p = this.effectivePedal();
    const was = this.lastPedal;
    this.lastPedal = p;
    if (p.cine && !was.cine) this.beginRun();
    if (!p.cine && was.cine) this.endRun();
    const m = p.cine ? "cine" : p.fluoro ? "fluoro" : "hold";
    if (m !== this.lastBeamMode) {
      this.lastBeamMode = m;
      this.crew?.setExposure(m === "hold" ? "off" : m, { highLevel: this.lab.exposure.fluoroLevel === "high", pps: m === "cine" ? this.lab.exposure.cinePps : this.lab.exposure.fluoroPps });
    }
  }

  /** Frames per second acquired in this beam mode: the cine frame rate or the fluoroscopy pulse rate. */
  acquisitionRate(mode: "fluoro" | "cine"): number {
    return mode === "cine" ? (this.lab.exposure.cinePps ?? 15) : (this.lab.exposure.fluoroPps ?? 15);
  }

  private beginRun() {
    const d = this.lab.dose.totals;
    this.run = startCineRun({
      caseId: this.caseId,
      startedAt: this.simT,
      fps: this.lab.exposure.cinePps ?? 15,
      cArm: this.carm.angles,
      fieldCm: this.field,
      catheterId: this.s.guide,
      karMGy0: d.karMGy.total,
      kapGyCm20: d.kapGyCm2.total,
      contrastMl0: this.contrastPushed(),
    });
  }

  private endRun() {
    const r = this.run;
    this.run = null;
    if (!r) return;
    const d = this.lab.dose.totals;
    const s = r.finish({ cArm: this.carm.angles, karMGy: d.karMGy.total, kapGyCm2: d.kapGyCm2.total, contrastMl: this.contrastPushed() });
    if (s) useSeriesStore.getState().add(s);
  }

  /** Store the last fluoroscopy sequence on the reference monitor. */
  storeFluoro(): StoredSeries | null {
    const s = storeFluoroLoop(this.fluoroLoop, { caseId: this.caseId, fps: this.lab.exposure.fluoroPps ?? 15, fieldCm: this.field, catheterId: this.s.guide });
    if (s) this.notify();
    return s;
  }

  canStoreFluoro(): boolean {
    return this.fluoroLoop.length > 0;
  }

  // --- frames ------------------------------------------------------------------------------

  /**
   * The scene of one exposed frame in `mode` (the live monitor renders it; the headless step only books
   * its dose). The scene assembly is the earlier lab's (AngioPci.tsx PciFluoro.draw), on lab time.
   */
  sceneFor(mode: "fluoro" | "cine", o: PciFrameOptions, xr: XrayRenderer | null): SceneResult {
    const cine = mode === "cine";
    const L = this.lab;
    const lf = L.frame(mode, xr);
    const st = this._st;
    const s = this.s;
    const bolus = this.bolus;
    const bt = o.bt !== undefined && o.bt !== null ? o.bt : this.bolusTime();
    const cath = catheterById(s.guide);
    const os = s.side === "left" ? this.model.lm : this.model.rca;
    const tip = { pos: os.pos, dir: os.dir, height: os.height, az: os.az, radius: this.model.sinusRadius, cram: 0, gap: 0 };
    const root = catheterPath(this.model, tip, cath);
    const bside = bolus?.side ?? s.side;
    const tree = this.tree;
    const filled = [...new Set(tree.vessels.filter((v) => v.side === bside).map((v) => v.fillId))] as VesselId[];
    // dual injection: a diagnostic catheter in the other coronary (femoral)
    let catheter2 = null;
    if (this.dual) {
      const os2 = s.side === "left" ? this.model.rca : this.model.lm;
      const tip2 = { pos: os2.pos, dir: os2.dir, height: os2.height, az: os2.az, radius: this.model.sinusRadius, cram: 0, gap: 0 };
      const t2 = bolus?.contra ? this.syringes.contra.trace : null;
      const injecting2 = cine && bside !== s.side && bt !== null && (t2 ? traceAt(t2, bt).q > 0.05 : bt >= OPERATOR_DELAY_S && bt < OPERATOR_DELAY_S + STANDARD_PUSH_S);
      catheter2 = { root: catheterPath(this.model, tip2, catheterById(s.side === "left" ? "JR4" : "JL4")), route: "femoral" as const, french: 6 as const, injecting: injecting2, lumen: this.syringes.contra.primed };
    }
    const tbl = this.table.state;
    const res = buildXrayScene({
      model: this.model,
      caseData: { accessRoute: "radial-right", lesions: [{ vessel: s.target.vessel, position: s.target.position, severity: st.severity, kind: s.target.kind, lengthMm: s.target.lengthMm }], dominance: "right" },
      tree,
      catheterRoot: root,
      french: 6,
      wire: null,
      // the live syringe trace of this run (a development hook draw without a run gets the standard plan)
      bolus:
        cine && bt !== null
          ? {
              filled,
              plume: "none",
              side: bside,
              t: bt,
              injectDur: STANDARD_PUSH_S,
              peak: 1,
              trace: bolus ? ((bolus.contra ? this.syringes.contra : this.syringes.guide).trace ?? undefined) : undefined,
              // a guide coaxial in the ostium: captures the jet, leaves room around it
              seat: { capture: 1, seal: 0.3 },
            }
          : null,
      // the guide's own lumen: from its live trace during its runs, its state otherwise (contralateral runs included)
      catheterContrast: cine && bolus && !bolus.contra ? undefined : this.syringes.guide.primed,
      catheter2,
      t: lf.clock.t,
      clock: lf.clock,
      cArm: this.carm.angles,
      field: this.field * 10,
      // the table top moved from the centre (raising the table moves the isocentre down in the patient)
      ...(tbl.x !== 0 || tbl.y !== 0 || tbl.height !== 0 ? { pan: { x: tbl.x, y: tbl.y, z: -tbl.height } } : {}),
      centreOn: this.dual ? "both" : s.side,
      mode: cine ? "cine" : "fluoro",
      // cine is filmed in held inspiration; otherwise breathing comes from the clock
      breathHold: lf.breathHold,
      frame: o.frame,
      framesSinceStart: lf.framesSinceStart,
      adrc: lf.adrc,
      exposure: lf.exposure,
      meter: lf.meter,
      meteredWaterCm: lf.meteredWaterCm,
      // the guide is the legacy fixed path: it bobs with the aortic root
      legacyCatheter: true,
      // live flow for the contrast transport: an inflated balloon stops antegrade contrast beyond it; slow flow
      // (no-reflow) is regional, beyond the treated lesion
      flowMods: pciFlowModsFor(this),
      // the mechanical compression device on the chest is drawn with the devices (render/cpr.ts)
      extras: (place, ctx) => pciDevicesFor(this, place, { ...ctx, cpr: this.cprDrawState(lf.clock.t) }),
    });
    // collimation and wedge as set at the table-side controls (left at the scene's own when untouched)
    if (this.shutters.some((x) => x !== 0)) res.params.shutters = this.shutters;
    return res;
  }

  /** Book an exposed frame's dose (after the scene and, in the browser, the render). */
  expose(res: SceneResult) {
    this.lab.expose(res, this.carm.angles, this.field * 10, this.simT * 1000);
    this.lastImageAt = this.simT;
    this.exposedSinceBeamOff = true;
    const mode = this.beamMode();
    this.lastExposed = mode ? { res, mode, t: this.simT } : null;
  }

  /**
   * Between acquired frames, book the beam time of the pulses in force on the last frame's exposure (a low
   * pulse rate's frame interval is longer than one frame's booked beam time; see PCI_DOSE_TICK_S).
   */
  private doseTick(mode: "fluoro" | "cine") {
    const e = this.lastExposed;
    if (!e || e.mode !== mode || this.simT - e.t < PCI_DOSE_TICK_S - 1e-9) return;
    this.lab.expose(e.res, this.carm.angles, this.field * 10, this.simT * 1000);
    e.t = this.simT;
  }

  /** The live monitor's frame, after it rendered and read back the image at the stored size. */
  onExposedFrame(gray: Uint8Array | null, mode: "fluoro" | "cine") {
    if (!gray) return;
    if (mode === "cine") {
      if (this.run) {
        this.run.push(gray);
        if (this.syringes.guide.active || this.syringes.contra.active) this.run.injected = true;
      }
    } else this.fluoroLoop.push(gray, this.simT, this.carm.angles);
  }

  /** A development hook drew a frame with the pedal up: keep the dose run open for a moment (as the earlier lab). */
  noteHookDraw() {
    this.hookDrawAt = this.simT;
  }

  // --- the loop ------------------------------------------------------------------------------

  /** Advance everything by dt seconds of lab time (call once per animation frame). */
  step(dt: number) {
    if (this.disposed || !(dt > 0)) return;
    dt = Math.min(dt, 0.1);
    this.simT += dt;
    this.carm.step(dt);
    this.table.step(dt);
    this.engine.advance(dt);
    // the syringes run on lab time; the guide carries the wire (and a device shaft) in its lumen
    const st = this._st;
    this.syringes.guide.setCatheter({ ...guideLumen(st.guide.french), obstructionMm: lumenObstruction(st.tipMm > 0, !!st.device) });
    const b = this.bolus;
    if (b) {
      (b.contra ? this.syringes.contra : this.syringes.guide).advance(this.simT);
      if (this.simT - b.start >= this.runLength()) this.endBolus();
    }
    // the beam: the headless frame step, and last-image hold with the pedals up
    this.syncPedal();
    const mode = this.beamMode();
    if (mode) {
      if (this.headless) {
        this.frameAcc += dt;
        const iv = 1 / this.acquisitionRate(mode);
        if (this.frameAcc >= iv - 1e-9) {
          // keep the remainder so the cadence holds at any step size (no burst after a rate change)
          this.frameAcc = Number.isFinite(this.frameAcc) ? Math.min(Math.max(0, this.frameAcc - iv), iv / 2) : 0;
          const res = this.sceneFor(mode, { frame: ++this.headlessFrame }, null);
          this.expose(res);
          this.onExposedFrame(BLANK_FRAME(), mode);
        }
      }
      this.doseTick(mode);
    } else if (this.exposedSinceBeamOff && this.simT - this.hookDrawAt > HOOK_HOLD_S) {
      this.lastExposed = null;
      this.lab.beamOff(this.simT * 1000);
      this.exposedSinceBeamOff = false;
      this.frameAcc = Infinity; // the first frame of the next pedal press is taken at once, whatever the rate
    }
    // the procedure clock (4 Hz): indeflator, pullbacks, the complication engine, and what it does to the patient
    this.procAcc += dt;
    const P = 1 / PCI_PROCEDURE_HZ;
    while (this.procAcc >= P - 1e-9) {
      this.procAcc -= P;
      this.procedureStep(P);
    }
    // the team and the sound
    this.teamStep(dt);
    // the tips' slower trackers (four times a second)
    this.slowAcc += dt;
    if (this.slowAcc >= 0.25) {
      this.slowAcc = 0;
      if (this.breathHoldSince !== null && this.simT - this.breathHoldSince > BREATH_HOLD_MAX_S) this.holdBreath(false);
      this.trackTips();
    }
    for (const f of this.stepListeners) f(dt);
    this.notifyAcc += dt;
    if (this.notifyAcc >= 0.2) {
      this.notifyAcc = 0;
      this.notify();
    }
  }

  private procedureStep(dt: number) {
    const fl = this.beamMode() === "fluoro";
    const nx = stepPci(this.s, this.g, this._st, dt, { fluoro: fl, actTrue: this.engine.vitals().actTrue });
    applyEffects(this.engine, this.bridge, pciPatientEffects(this.s, this.g, nx), this.engine.time, () => rnd(this.bridgeRng));
    this.engine.setTip(tipFromGuide(nx.guide, this.s.side, nx.valveOpen));
    this._st = nx;
    this.syncTree();
    this.couplingStep(dt);
  }

  // --- patient coupling (pci-patient-coupling) ----------------------------------------------------

  /** The procedure clock's coupling: the engine's network, the arrest variant, the pads, the device, the hidden cause. */
  private couplingStep(dt: number) {
    const r = syncEngineCoronary(this.engine, this.coronarySync, this.caseData.lesions, this.s, this.g, this._st, this.tree, this.simT);
    this.coronarySync = r.mem;
    if (r.applied) {
      this._st = tele(this._st, "engine-network", { severity: this._st.severity, stents: this._st.stents.length, reperfused: r.reperfused });
      if (r.reperfused) this.onReperfusion();
    }
    if (this.arrestDue !== null && this.simT >= this.arrestDue) {
      this.arrestDue = null;
      this.engine.setRefractoryVf(MP_PCI_ARREST.arrestRefractoryShocks);
      this.bringVf("arrest during primary PCI with the wire across");
    }
    if (this.defib.padsAt !== null && this.simT >= this.defib.padsAt) this.defib = { ...this.defib, pads: true, padsAt: null };
    if (this.cpr === "fitting" && this.cprFitUntil !== null && this.simT >= this.cprFitUntil) {
      this.cprFitUntil = null;
      this.cpr = "mechanical";
      this.engine.setCpr(true);
    }
    // a converting shock ends compressions in the engine (the rhythm model): the lab's mode follows
    if ((this.cpr === "manual" || this.cpr === "mechanical") && !this.engine.rhythm.st.cpr) this.cpr = "off";
    this.causeStep(dt);
  }

  /** Start the variant's hidden cause at its onset (when its trigger is there), tick it, and close its episode when it ends. */
  private causeStep(dt: number) {
    if (this.pendingCause && this.simT >= MP_PCI_ARREST.causeOnsetS && !this.finished) {
      const run = startHypotensionCause(this.pendingCause, this.portForCauses());
      if (run) {
        this.causeRun = run;
        this.episodes.push(newEpisode(this.pendingCause, this.simT));
        this._st = tele(this._st, "hypotension-onset", { cause: this.pendingCause });
        this.pendingCause = null;
      }
    }
    const run = this.causeRun;
    if (!run) return;
    run.tick(this.portForCauses(), dt);
    if (run.stopped()) {
      this.causeRun = null;
      const i = this.episodes.length - 1;
      if (i >= 0 && this.episodes[i].resolvedT === null) {
        this.episodes[i] = { ...this.episodes[i], resolvedT: this.simT };
        const ep = this.episodes[i];
        this._st = tele(this._st, "hypotension-resolved", { cause: ep.causeId, onsetT: ep.onsetT, firstAction: ep.firstAction, resolvedT: ep.resolvedT });
      }
    }
  }

  /** A treatment of the running cause (the session's flush, pericardiocentesis, the team's atropine). */
  private treatCause(t: CauseTreatment) {
    if (this.causeRun) this.causeRun.treat(this.portForCauses(), t);
  }

  /** The causes' port: the engine's public methods and this lab's valve, guide and lumen. */
  private portForCauses(): PciCausePort {
    if (this.causePort) return this.causePort;
    const e = this.engine;
    const lab: PciCauseLab = {
      valveOpen: () => this._st.valveOpen,
      setValve: (open) => this.update((x) => setValve(x, open)),
      guideEngaged: () => this._st.guide.engaged,
      guideDepthMm: () => this._st.guide.depthMm,
      seatGuide: (mm) => this.update((x) => seatGuide(x, mm, this.s, this.g)),
      guideFamily: () => catheterFamily(this._st.guide.id) ?? this._st.guide.id,
      deviceInGuide: () => !!this._st.device && this._st.device.stage === "in-guide",
      flushes: () => this.flushCount,
      aspirations: () => this.aspirateCount,
    };
    this.causePort = {
      lab,
      profile: e.profile,
      transducer: e.transducer,
      pharm: e.pharm,
      setHaemorrhage: (x) => e.setHaemorrhage(x),
      fluid: (ml, overS) => e.fluid(ml, overS),
      setOcclusion: (id, o) => e.setOcclusion(id, o),
      clearOcclusion: (id) => e.clearOcclusion(id),
      setPericardialInflow: (x) => e.setPericardialInflow(x),
      drainPericardium: (ml) => {
        const d = e.drainPericardium(ml);
        this.drainedMl += d;
        return d;
      },
      forceRhythm: (k, why) => e.forceRhythm(k, why),
      setVasodilation: (f) => e.setVasodilation(f),
      giveDrug: (d, dose, route) => e.giveDrug(d, dose, route),
      startInfusion: (o) => e.startInfusion(o),
      stopInfusion: (d) => e.stopInfusion(d),
      forceVagal: (level, holdS) => e.forceVagal(level ?? MP_PCI_ARREST.vagalLevel, holdS),
      forceReaction: (k, onset, o) => e.forceReaction(k, onset, o),
      setAorticRegurgitation: (sev) => e.setAorticRegurgitation(sev),
      vitals: () => e.vitals(),
      rightHeart: () => e.rightHeart(),
    };
    return this.causePort;
  }

  /** A variant of the circumflex STEMI that makes an arrhythmia certain (the arrhythmia and arrest drills). */
  private applyArrhythmiaVariant(v: string | null) {
    if (v === "vf-reperfusion") this.forceReperfusionVf = true;
    else if (v === "vf-refractory") {
      this.forceReperfusionVf = true;
      this.reperfusionRefractory = MP_PCI_ARREST.refractoryShocks;
    } else if (v === "arrest-wire-across") this.arrestDue = MP_PCI_ARREST.arrestOnsetS;
  }

  /** The occluded target has been opened (the engine took the treated network): reperfusion VF, drawn or certain. */
  private onReperfusion() {
    const certain = this.forceReperfusionVf;
    this.forceReperfusionVf = false;
    if (certain || rnd(this.couplingRng) < MP_PATIENT_COUPLING.reperfusionVfP) {
      if (this.reperfusionRefractory > 0) this.engine.setRefractoryVf(this.reperfusionRefractory);
      this.reperfusionRefractory = 0;
      this.bringVf("reperfusion of the occluded artery");
    }
  }

  /** VF now, with its trigger recorded. */
  private bringVf(trigger: string) {
    if (this.engine.rhythm.st.base === "vf") return;
    this.engine.forceRhythm("vf", trigger);
    this.arrhythmias.push({ t: this.simT, kind: "vf", trigger });
    this._st = tele(this._st, "arrhythmia", { kind: "vf", trigger });
    this.notify();
  }

  /** The hidden cause running now (for the debrief and tests; never shown on a live screen), or null. */
  hiddenCause(): string | null {
    return this.causeRun?.causeId ?? null;
  }

  /** The cause the variant will start, before its onset (for the debrief and tests), or null. */
  pendingHiddenCause(): string | null {
    return this.pendingCause;
  }

  // --- the defibrillator, CPR and the pericardium (pci-patient-coupling) --------------------------

  /** Put the pads on (they are on after MP_PCI_ARREST.padsApplyS) or take them off. */
  setPads(on: boolean) {
    if (on && !this.defib.pads && this.defib.padsAt === null) this.defib = { ...this.defib, padsAt: this.simT + MP_PCI_ARREST.padsApplyS };
    else if (!on) this.defib = { ...this.defib, pads: false, padsAt: null };
    this.uiEvent("defib-pads", { on });
    this.notify();
  }

  /** Synchronised (cardioversion) or unsynchronised (defibrillation) mode. */
  setDefibSync(sync: boolean) {
    this.defib = { ...this.defib, sync };
    this.uiEvent("defib-sync", { sync });
    this.notify();
  }

  /** The energy to charge to (J, one of DEFIB_ENERGIES_J). */
  setDefibEnergy(j: number) {
    const e = DEFIB_ENERGIES_J.find((x) => x === j);
    if (e === undefined) return;
    this.defib = { ...this.defib, energyJ: e };
    this.notify();
  }

  /** Ask the patient to cough (the adenosine pause or VF in a conscious patient while the defibrillator charges). */
  askCough() {
    this.engine.cough();
    this.noteAction("cough");
    this.uiEvent("cough", {});
    this.notify();
  }

  /** Start chest compressions by hand. */
  startCpr() {
    if (this.cpr === "manual" || this.cpr === "mechanical") return;
    this.cpr = "manual";
    this.cprFitUntil = null;
    this.engine.setCpr(true);
    this.noteAction("cpr");
    this.notify();
  }

  /** Fit the mechanical compression device: compressions pause for MP_PCI_ARREST.deviceFitPauseS, then the piston runs. */
  fitCompressionDevice() {
    if (this.cpr === "fitting" || this.cpr === "mechanical") return;
    this.cpr = "fitting";
    this.cprFitUntil = this.simT + MP_PCI_ARREST.deviceFitPauseS;
    this.engine.setCpr(false);
    this.noteAction("cpr-device");
    this.uiEvent("cpr-device", {});
    this.notify();
  }

  /** Stop compressions (the device comes off the chest). */
  stopCpr() {
    if (this.cpr === "off") return;
    this.cpr = "off";
    this.cprFitUntil = null;
    this.engine.setCpr(false);
    this.notify();
  }

  /** Pericardiocentesis: drains the effusion (a running tamponade cause stops and drains). Returns mL drained. */
  pericardiocentesis(): number {
    if (this.disposed || this.finished) return 0;
    this.noteAction("pericardiocentesis");
    this.drainedMl = 0;
    if (this.causeRun) this.treatCause("drain-pericardium");
    const drained = this.drainedMl > 0 ? this.drainedMl : this.engine.drainPericardium(MP_PCI_ARREST.drainMl);
    this.drainedMl = 0;
    this._st = tele(this._st, "pericardiocentesis", { ml: Math.round(drained) });
    this.notify();
    return drained;
  }

  /** Pulsus paradoxus as the arterial line shows it (mmHg; the engine's read-out). */
  pulsusParadoxus(): number {
    return this.engine.pulsusParadoxus();
  }

  /**
   * The patient's coronary flow over rest per trunk for the contrast transport (engineFlowScale), read once per
   * update of the engine's supplies (its slow tick) and kept as the same record while it is unchanged.
   */
  flowScaleNow(): Record<string, number> | undefined {
    const m = this.flowScaleMemo;
    // none while the guide settles at the start of the run (MP_FLOW_SCALE_START_S): the version -2 marks it
    const ver = this.simT < MP_FLOW_SCALE_START_S - 1e-9 ? -2 : this.engine.suppliesVersion;
    if (m.ver === ver && m.tree === this.drawTree) return m.value;
    const v = ver === -2 ? undefined : engineFlowScale(this.engine, this.drawTree, m.value);
    const key = v ? JSON.stringify(v) : "";
    this.flowScaleMemo = { ver, tree: this.drawTree, value: key === m.key ? m.value : v, key };
    return this.flowScaleMemo.value;
  }

  /** The transport's flow conditions now (pciFlowModsFor), the same object while nothing in them has changed. */
  flowModsNow(): TransportMods {
    const base = pciFlowMods(this.s, this._st, this.g, this.drawTree);
    const flowScale = this.flowScaleNow();
    const key = `${JSON.stringify(base)}|${this.flowScaleMemo.key}`;
    if (this.flowModsMemo?.key === key) return this.flowModsMemo.mods;
    const mods = flowScale ? { ...base, flowScale } : base;
    this.flowModsMemo = { key, mods };
    return mods;
  }

  /** The device's state for the image this frame (null: no device on the chest). */
  cprDrawState(t: number): CprDrawState | null {
    if (this.cpr !== "fitting" && this.cpr !== "mechanical") return null;
    // the patient's thorax as the scene builds it (sceneBuilder: the tree's genome seed, else the reference patient)
    const seed = this.drawTree.genome?.seed;
    const gn = seed !== undefined ? thoraxGenome(seed) : REFERENCE_GENOME;
    // the skin over the lower sternum (THORAX_FRONT): the chest's front, the pad MP_CPR_DEVICE.padBelowSternumMm
    // below the centre of the sternal body, or lower, over the heart (MP_CPR_DEVICE.padAboveHeartCentreMm above
    // the centre of the coronary tree), where the lower sternum lies over the cardiac silhouette in the PA view
    const T = THORAX_FRONT;
    const front = T.centreZMm + T.halfDepthMm * gn.habitus * gn.depth;
    const y = Math.min(T.sternalBodyCentreYMm - MP_CPR_DEVICE.padBelowSternumMm, treeCentre(this.drawTree, "both").y + MP_CPR_DEVICE.padAboveHeartCentreMm);
    return { device: true, skin: { x: 0, y, z: front }, depthMm: compressionDepthMm(t, this.cpr === "mechanical") };
  }

  private teamStep(dt: number) {
    const crew = this.crew;
    if (!crew) return;
    crew.push(this.lab.dose.drainEvents());
    const x = this._st;
    if (x.device && x.ind.atm > 0.05) crew.audio?.setIndeflator(x.ind.atm);
    // an inflation the patient should have been warned about (the team scores the warning)
    const inflated = !!x.device?.inflated;
    if (inflated && !this.wasInflated) crew.team.notifyInflation();
    if (!inflated && this.wasInflated) crew.audio?.indeflatorRelease();
    this.wasInflated = inflated;
    const b = this.bolus;
    const tr = b ? (b.contra ? this.syringes.contra : this.syringes.guide).trace : null;
    const pushing = !!tr && tr.pushEnd === null;
    crew.audio?.setInjection({ force: pushing ? 0.8 : 0, flowMlS: pushing && tr && tr.q.length ? tr.q[tr.q.length - 1] : 0, psi: pushing && tr ? tr.peakPsi : 0 });
    crew.step(dt);
  }

  private trackTips() {
    const t = this.simT;
    const evs = this.patientEvents.update({ ...this.engine.vitals(), t });
    // cardiogenic shock: a low pressure with the pump failure pattern of the right heart numbers (Brilakis Fig. 28.1)
    if (evs.includes("hypotension")) {
      const pat = classifyRightHeart(this.engine.rightHeart(), this.engine.profile, this.engine.vitals().hr ?? null);
      if (pat.mechanism === "cardiac" && pat.output === "low") this.events.raise("cardiogenic-shock", undefined, t, "patient");
    }
    this.trackBudgets(t);
  }

  // --- budgets, announcements and checkpoints (pci-budgets-stop-rules) ----------------------------

  /** The totals the budgets read now. */
  private budgetReading(): BudgetReading {
    const d = this.lab.dose.totals;
    return {
      t: this.simT,
      contrastMl: this.contrastTotal(),
      karMGy: d.karMGy.total,
      kapGyCm2: d.kapGyCm2.total,
      fluoroS: d.fluoroTimeS,
      cineRuns: d.cineRuns,
      peakSkinMGy: d.peakSkinMGy,
      doseRateMGyMin: this.lab.dose.live.akrMGyMin,
      crossed: !!this._st.wire.crossed,
    };
  }

  /**
   * The budgets at the slow tracker: the team's announcements, the events held from the warning threshold
   * (contrast) and the air kerma limit or another substantial radiation dose level (radiation), and the
   * checkpoints the thresholds open.
   */
  private trackBudgets(t: number) {
    if (this.finished) return;
    const u = this.budgets.update(this.budgetReading());
    // the radiation checkpoint carries the totals: when it opens with the air kerma call, only its line is spoken
    const radiationCp = u.opened.some((c) => c.reason === "radiation-limit");
    for (const a of u.announcements) {
      if (!(radiationCp && a.kind === "air-kerma")) this.crew?.team.say("radiographer", a.text, "callout", { to: "operator" });
      this.uiEvent("budget-announcement", { kind: a.kind, text: a.text, contrastMl: a.contrastMl, karMGy: a.karMGy, elapsedS: a.elapsedS });
    }
    const raised = this.budgets.raised();
    if (raised.contrast && !this.events.isActive("high-contrast-volume", t)) this.events.hold(["high-contrast-volume"], t, "contrast");
    if (raised.radiation && !this.events.isActive("high-radiation-dose", t)) this.events.hold(["high-radiation-dose"], t, "dose");
    for (const cp of u.opened) {
      this.crew?.team.say("radiographer", cp.text, "callout", { to: "operator" });
      this.uiEvent("checkpoint-open", { id: cp.id, reason: cp.reason, ...cp.at });
    }
    if (u.opened.length && this.checkpointBlocks()) {
      // during a run the checkpoint waits for it to end, so the run is filmed (the call is made now)
      if (this.bolus) this.cpDeferred = true;
      else {
        this.openModal("checkpoint");
        this.syncPedal();
      }
    }
    if (u.opened.length || u.announcements.length) this.notify();
  }

  /** Checkpoints are dialogues that hold the beam in guided practice and exams; attending dialogue otherwise. */
  checkpointBlocks(): boolean {
    return this.policy.mode === "guided" || this.policy.mode === "exam";
  }

  /** The stop-or-continue checkpoint waiting for the learner, or null. */
  pendingCheckpoint(): BudgetCheckpoint | null {
    return this.budgets.pending();
  }

  /** The checkpoint to show now: the pending one, except a blocking one waiting for the run in progress to end. */
  checkpointDue(): BudgetCheckpoint | null {
    return this.cpDeferred ? null : this.budgets.pending();
  }

  /** A checkpoint that blocks is waiting (and shown): the beam stays off until it is answered. */
  checkpointHoldsBeam(): boolean {
    return this.checkpointBlocks() && !this.cpDeferred && this.budgets.pending() !== null;
  }

  /**
   * Answer the waiting checkpoint (the learner states progress and decides): judged against the module
   * text, recorded with the dose, contrast and time, and the beam released once none is waiting.
   */
  answerCheckpoint(a: CheckpointAnswer): BudgetCheckpoint | null {
    if (this.disposed) return null;
    const cp = this.budgets.answer(a, this.simT);
    if (!cp || !cp.answer) return null;
    this.uiEvent("checkpoint-answer", { id: cp.id, reason: cp.reason, decision: cp.answer.decision, progress: cp.answer.progress, nextStep: cp.answer.nextStep ?? null, correct: cp.answer.correct, ...cp.at });
    if (!this.budgets.pending()) this.closeModal("checkpoint");
    this.syncPedal();
    this.notify();
    return cp;
  }

  /** The limits agreed at the brief: a contrast ceiling (mL) and an air kerma limit (Gy). */
  setBudgetPlan(p: { contrastMl?: number | null; karGy?: number | null }) {
    this.budgets.setPlan({ contrastMl: p.contrastMl, karLimitMGy: p.karGy === undefined ? undefined : p.karGy && p.karGy > 0 ? p.karGy * 1000 : null });
    this.notify();
  }

  /** The budgets' read-out now. */
  budgetReadout(): BudgetReadout {
    return this.budgets.readout({ cto: this.s.target.kind === "cto", crossed: !!this._st.wire.crossed });
  }

  // --- consoles and dialogues (the recorder counts interruptions) ------------------------------

  private uiEvent(action: string, data: Record<string, unknown>) {
    this.recorder.event({ kind: "ui", tWall: this.simT, tPatient: this.engine.time, step: 0, cmd: 0, ext: true, data: { action, ...data } });
  }

  /** The console open now (src/ui/pci/consoles/), or null. */
  openConsoleId(): string | null {
    return this.console;
  }

  /** Open a device console: one 'ui' event with its id. Opening the one already open does nothing. */
  openConsole(id: string) {
    if (this.console === id) return;
    this.console = id;
    this.uiEvent("console-open", { console: id });
    this.notify();
  }

  closeConsole() {
    if (this.console === null) return;
    this.console = null;
    this.notify();
  }

  /** A dialogue over the lab (the case brief, the debrief, input devices): one 'ui' event with its id. */
  openModal(id: string) {
    if (this.modals.has(id)) return;
    this.modals.add(id);
    if (id === "prebrief") this.prebriefOpen = true;
    this.uiEvent("modal-open", { modal: id });
    this.notify();
  }

  closeModal(id: string) {
    if (!this.modals.delete(id)) return;
    if (id === "prebrief") this.prebriefOpen = false;
    this.notify();
  }

  openModals(): string[] {
    return [...this.modals];
  }

  /** The recorder's 'ui' events (console and modal openings). */
  uiEvents() {
    return this.recorder.events.filter((e) => e.kind === "ui");
  }

  // --- the end of the case ----------------------------------------------------------------------

  /** Open or close the finish step (the tips move to the finish phase while it is open). */
  setFinishStep(open: boolean) {
    if (this.finishing === open) return;
    this.finishing = open;
    this.notify();
  }

  setTimeOutDone(done: boolean) {
    if (this.timeOutDone === done) return;
    this.timeOutDone = done;
    this.notify();
  }

  /** Finish the case: the debrief of the result (measured, no checklist score). Null when it was stopped. */
  finish(): PciDebrief | null {
    if (this.finished) return this.result;
    if (this.beforeAction && !this.beforeAction("finish")) return null;
    this.cpDeferred = false;
    if (this.bolus) this.endBolus();
    this._st = finishCase(this.s, this.g, this._st);
    this.result = debrief(this.s, this.g, this._st);
    this.finished = true;
    this.finishing = false;
    this.syncPedal();
    this.recorder.event({ kind: "case-end", tWall: this.simT, tPatient: this.engine.time, step: 0, cmd: 0, ext: true, data: { reason: "finished", passed: this.result.passed } });
    this.recorder.finish();
    this.notify();
    return this.result;
  }

  /** The dose this lab added (its tracker less the dose the case brought). */
  doseAdded() {
    return doseSince(this.lab.dose, this.handover?.start.dose);
  }

  /**
   * The same case again with a fresh patient, dose and syringes: a new session from the same options
   * (a hand-over keeps the case's own patient). This session is disposed.
   */
  repeat(o: Partial<PciLabSessionOptions> = {}): PciLabSession {
    const next = new PciLabSession({ ...this.options, ...o, policy: o.policy ?? this.policy });
    this.dispose();
    return next;
  }

  // --- tips ---------------------------------------------------------------------------------------

  /** Events active now: the run's held events, the patient's, the dose level. */
  activeEvents(): LabEvent[] {
    return this.events.active();
  }

  /** The PCI lab's tip context now (src/ui/lab/pciTips.ts, with this session's phases and events). */
  tipContext(): LabContext {
    const base = pciTipContext(this._st, this.g.lesion, { cto: this.s.target.kind === "cto" });
    const events = [...new Set<LabEvent>([...(base.events ?? []), ...this.activeEvents()])];
    // VF, pulseless VT, a low pressure or tamponade puts the tips at the complication phase (pci-patient-coupling)
    const compromised = events.some((e) => COMPROMISE_EVENTS.includes(e));
    const phase: LabPhase | undefined = this.prebriefOpen ? "plan" : this.finishing || this.finished ? "finish" : compromised ? "complication" : base.phase;
    const ctx: LabContext = { ...base, phase, events };
    // the guide's catheter family (a hypotension with an Amplatz or EBU points at the aortic cusp)
    const fam = catheterFamily(this._st.guide.id);
    if (fam) ctx.catheter = fam;
    return ctx;
  }

  /** What the tip context and the attending read (pci-tip-context, pci-attending). */
  snapshot(): PciLabSnapshot {
    const v = this.engine.vitals();
    const L = this.g.lesion;
    return {
      t: this.simT,
      state: this._st,
      definition: this.resolved.def,
      scenario: this.s,
      start: this.startDef,
      lesion: { vessel: L.vessel as VesselId, startMm: L.startMm, endMm: L.endMm, centreMm: L.centreMm, refDiameter: L.refDiameter },
      vitals: v,
      rhythm: v.rhythm,
      guidePressure: pressureFromEngine({ tipState: v.tipState, art: v.art }).kind,
      // whole cine frames and contrast to 0.1 mL: the counters accumulate fractional steps
      dose: { ...this.lab.dose.totals, cineFrames: Math.round(this.lab.dose.totals.cineFrames) },
      contrastMl: Math.round(this.contrastTotal() * 10) / 10,
      budget: this.budgetReadout(),
      policy: this.policy,
      workflow: {
        prebriefOpen: this.prebriefOpen,
        timeOutDone: this.timeOutDone,
        finishing: this.finishing,
        finished: this.finished,
        beam: this.beamMode(),
        injecting: this.syringes.guide.active || this.syringes.contra.active,
        runLive: this.run !== null,
        xrayEnabled: this.xrayEnabled,
      },
      openModals: this.openModals(),
      openConsole: this.console,
      events: this.events,
      activeEvents: this.activeEvents(),
    };
  }

  // --- table-side controls (LabControlsTarget) ------------------------------------------------------

  subscribeControls(fn: () => void): () => void {
    return this.subscribe(fn);
  }

  controlsVersion(): number {
    return this.version;
  }

  controlsPolicy(): LabPolicy {
    return this.policy;
  }

  /** Table-side Inject (hold J): the push lasts while held; the pedals stay the operator's. */
  startInjection(): boolean {
    return this.inject({ side: this.s.side });
  }

  /** Draw back on the guide's syringe (back-bleed): the guide is aspirated and flushed. */
  aspirate() {
    if (this.disposed || this.finished) return;
    this.aspirateCount++;
    this.noteAction("aspirate");
    this.update((x) => ({ ...x, aspirated: true }));
  }

  cArmAngles(): CArm {
    return this.carm.angles;
  }

  /** A working view by the radiographer: the C-arm is set at the preset at once (the earlier lab's view buttons). */
  setView(c: CArm) {
    this.drivingMemory = null;
    this.carm.set(c);
    this.notify();
  }

  driveMemory(i: number | null) {
    this.drivingMemory = i;
    const m = i === null ? null : this.memories[i] ?? null;
    this.carm.driveTo(m);
  }

  storeMemory(i: number) {
    this.memories[i] = { ...this.carm.angles };
    this.notify();
  }

  jogCArm(lao: number, cran: number) {
    this.drivingMemory = null;
    this.carm.setCommandedVelocity(lao, cran);
  }

  tableHeightMm(): number {
    return this.table.state.height;
  }

  imagingControls(): ImagingControls {
    const ex = this.lab.exposure;
    return {
      field: this.field,
      fields: PCI_FIELDS,
      pulseRate: ex.fluoroPps ?? 15,
      cineRate: ex.cinePps ?? 15,
      rates: PCI_FLUORO_RATES,
      fluoroLevel: ex.fluoroLevel ?? "normal",
      shutters: this.shutters,
      wedge: this.wedge,
      xrayEnabled: this.xrayEnabled,
    };
  }

  setFieldSize(cm: number) {
    if (!(PCI_FIELDS as readonly number[]).includes(cm)) return;
    this.field = cm;
    this.notify();
  }

  setFluoroRate(pps: number) {
    const r = PCI_FLUORO_RATES.find((x) => x === pps);
    if (r === undefined) return;
    this.lab.exposure = { ...this.lab.exposure, fluoroPps: r };
    this.notify();
  }

  setCineRate(fps: number) {
    const r = PCI_CINE_RATES.find((x) => x === fps);
    if (r === undefined) return;
    this.lab.exposure = { ...this.lab.exposure, cinePps: r };
    this.notify();
  }

  setFluoroLevel(level: FluoroLevel) {
    this.lab.exposure = { ...this.lab.exposure, fluoroLevel: level };
    this.notify();
  }

  setShutters(sh: [number, number, number, number]) {
    this.shutters = [...sh] as [number, number, number, number];
    this.notify();
  }

  setWedge(w: { insertion: number; angleDeg: number }) {
    this.wedge = { ...w };
    this.notify();
  }

  toggleXray() {
    this.xrayEnabled = !this.xrayEnabled;
    this.syncPedal();
    this.notify();
  }

  backTable(): BackTableState {
    return { items: [], selectedId: null, note: "Balloons and stents come from the device console (Devices tab)." };
  }

  selectBackTableItem() {
    // the PCI lab's devices are loaded through the device console
  }

  breathHeld(): boolean {
    return this.breathHoldSince !== null;
  }

  /** Ask the patient to breathe in and hold (released after BREATH_HOLD_MAX_S, as in the diagnostic lab). */
  holdBreath(on: boolean) {
    this.breathHoldSince = on ? this.simT : null;
    this.engine.holdBreath(on ? BREATH_HOLD_LEVEL : null);
    this.notify();
  }

  /** The defibrillator's read-out now (from the rhythm model directly, so a charge, clear or shock shows at once). */
  defibReadout(): DefibReadout {
    const d = this.engine.rhythm.st.defib;
    return { charged: d.charged, charging: d.charging !== null, cleared: d.cleared, shocks: d.shocks };
  }

  /** Charge to the energy selected on the defibrillator (DEFIB_DEFAULT_J, 200 J, unless the console changed it). */
  charge() {
    this.engine.charge(this.defib.energyJ);
    this.noteAction("defib-charge");
    this.notify();
  }

  clearForShock() {
    this.engine.clearForShock();
    this.notify();
  }

  /**
   * Discharge: unsynchronised, a defibrillation (engine.shock); synchronised, a cardioversion, which finds no R
   * wave in VF and does not discharge (engine.cardiovert keeps the charge). Without pads nothing is delivered.
   */
  shock(): ShockOutcome | "no-pads" {
    if (!this.defib.pads) {
      this.uiEvent("defib-no-pads", {});
      // what the defibrillator itself shows: on the live log, whichever control pressed Shock
      this._st = log(this._st, "warn", DEFIB_NO_PADS_TEXT);
      this.notify();
      return "no-pads";
    }
    const before = this.engine.rhythm.st.base;
    const r = this.defib.sync ? this.engine.cardiovert() : this.engine.shock();
    this.noteAction(this.defib.sync ? "cardiovert" : "shock");
    this._st = tele(this._st, "defib", { mode: this.defib.sync ? "sync" : "async", joules: this.defib.energyJ, rhythm: before, outcome: r });
    this.notify();
    return r;
  }

  provideCapability<K extends keyof LabCapabilities>(k: K, v: LabCapabilities[K] | null) {
    if (v === null) this.capabilities.delete(k);
    else this.capabilities.set(k, v);
  }

  capability<K extends keyof LabCapabilities>(k: K): LabCapabilities[K] | null {
    return (this.capabilities.get(k) as LabCapabilities[K] | undefined) ?? null;
  }

  // --- the end ----------------------------------------------------------------------------------------

  /** Leaving the lab takes the devices out (a balloon or an extension no longer occludes); what the complications did stays. */
  dispose() {
    if (this.disposed) return;
    this.cpDeferred = false;
    if (this.bolus) this.endBolus();
    if (this.run) this.endRun();
    const x = this._st;
    applyEffects(this.engine, this.bridge, pciPatientEffects(this.s, this.g, { ...x, device: null, guide: { ...x.guide, extensionMm: null } }), this.engine.time, () => rnd(this.bridgeRng));
    this.engine.setTip({ location: "aorta", side: this.s.side, valveOpen: false });
    // the guide leaves with the lab: no cusp held open, nothing in its lumen, no refractory shocks; a case's own
    // engine goes back to its effusion behaviour without the pulsus swing (pci-patient-coupling)
    this.engine.setAorticRegurgitation(null);
    this.engine.setRefractoryVf(0);
    this.engine.setDisplayedDampingClass(false);
    this.engine.transducer.setContrast(0);
    this.engine.transducer.setLumenPlug(false);
    this.engine.transducer.line.catheterRmm = this.lineRmm0;
    if (this.handover) this.engine.setPulsusParadoxus(false);
    for (const off of this.offs) off();
    this.offs = [];
    this.crew?.dispose();
    this.disposed = true;
    this.listeners.clear();
    this.stepListeners.clear();
  }
}

// --- the device drawing of a session (render registry) ----------------------------------------------

function pciDevicesFor(x: PciLabSession, place: (sm: Sample) => Vec3, ctx: { bolusT: number | null; injecting: boolean; cpr?: CprDrawState | null }) {
  return pciDevices(x.s, x.st, x.g, x.drawTree, place, ctx, x.indeflatorAtm);
}

/**
 * The live flow conditions of a session for the contrast transport: pciFlowMods (a balloon occlusion, regional
 * no-reflow) with the patient's coronary flow over rest per trunk (pci-patient-coupling: an arrest, a low
 * perfusion pressure or a wedged guide slows the contrast; absent at rest, so the image is as before).
 */
export function pciFlowModsFor(x: Pick<PciLabSession, "s" | "st" | "g" | "drawTree" | "engine"> & Partial<Pick<PciLabSession, "flowModsNow">>): TransportMods {
  if (typeof x.flowModsNow === "function") return x.flowModsNow();
  const mods = pciFlowMods(x.s, x.st, x.g, x.drawTree);
  const flowScale = engineFlowScale(x.engine, x.drawTree);
  return flowScale ? { ...mods, flowScale } : mods;
}

// --- the budgets' patient -------------------------------------------------------------------------

/**
 * The engine's profile for a scenario whose definition sets patient facts that the budgets and the
 * attending read (eGFR, weight, contrast earlier that day): the seed's own profile with those facts. An
 * eGFR sets the creatinine that gives it by the profile's own 2021 CKD-EPI formula (for the seed's age
 * and sex), and the creatinine clearance and the MACD follow from that creatinine by their formulas, so
 * the renal facts agree. Null when the definition sets none, so every other scenario's patient is unchanged.
 */
export function scenarioProfile(seed: string, def: Pick<PciScenarioDef, "patient">): PatientProfile | null {
  const p = def.patient;
  if (!p || (p.eGfr === undefined && p.weightKg === undefined && !(Number(p.priorContrastMl) > 0))) return null;
  const base = generatePatient(seed);
  const out: PatientProfile = { ...base, renal: { ...base.renal } };
  if (p.weightKg !== undefined) out.weightKg = p.weightKg;
  if (p.eGfr !== undefined || p.weightKg !== undefined) {
    const scr = p.eGfr !== undefined ? creatinineForEgfr(p.eGfr, out.ageY, out.sex) : out.renal.creatinineMgDl;
    out.renal = {
      creatinineMgDl: scr,
      creatinineUmolL: Math.round(scr * CREATININE_UMOL_PER_MGDL),
      crclMlMin: Math.round(cockcroftGault(out.ageY, out.weightKg, scr, out.sex)),
      egfr: p.eGfr ?? out.renal.egfr,
      macdMl: Math.round(cigarroaMacd(out.weightKg, scr)),
    };
  }
  if (Number(p.priorContrastMl) > 0) out.recentContrast = [...(base.recentContrast ?? []), { ml: Number(p.priorContrastMl), daysAgo: 0 }];
  return out;
}

/** The serum creatinine (mg/dL, to 0.01) at which the 2021 CKD-EPI eGFR is `egfr` (it falls as creatinine rises). */
export function creatinineForEgfr(egfr: number, ageY: number, sex: PatientProfile["sex"]): number {
  let lo = 0.2;
  let hi = 15;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (ckdEpi2021(ageY, mid, sex) > egfr) lo = mid;
    else hi = mid;
  }
  return Math.round(((lo + hi) / 2) * 100) / 100;
}

/** The budgets' patient: the profile's renal function, weight and recent contrast, with the scenario's facts over them. */
export function budgetPatientOf(profile: PatientProfile, def: Pick<PciScenarioDef, "patient"> | null): BudgetPatient {
  const p = def?.patient;
  const recent = [...(profile.recentContrast ?? [])];
  // a definition's contrast that day, when the profile does not already carry it (scenarioProfile adds it)
  if (p && Number(p.priorContrastMl) > 0 && !recent.some((r) => r.daysAgo === 0 && r.ml === Number(p.priorContrastMl))) recent.push({ ml: Number(p.priorContrastMl), daysAgo: 0 });
  return {
    egfr: p?.eGfr ?? profile.renal.egfr,
    crclMlMin: profile.renal.crclMlMin,
    weightKg: p?.weightKg ?? profile.weightKg,
    singleKidney: !!p?.singleKidney,
    recent,
  };
}

/** The working views offered for a scenario's side (the earlier lab's strip). */
export function viewsFor(side: "left" | "right") {
  return VIEW_PRESETS.filter((v) => v.side === side || v.side === "both");
}
