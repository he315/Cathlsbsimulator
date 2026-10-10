import { create } from "zustand";
import type {
  AnatomyCase,
  CArm,
  CaseAttempt,
  ContrastResult,
  Difficulty,
  EngagementState,
  MistakeCode,
  PressureState,
  ScoreState,
  SimEvent,
  SimMode,
  VesselId,
} from "../types";
import { buildAnatomy } from "../simulation/anatomy";
import type { AnatomyModel } from "../simulation/anatomy";
import {
  computeTip,
  computeEngagement,
  initialControls,
  stepDynamics,
} from "../simulation/engagement";
import type { ControlState, TipState } from "../simulation/engagement";
import { computePressure } from "../simulation/pressure";
import { injectContrast } from "../simulation/contrast";
import { haptics } from "../simulation/haptics";
import {
  initScore,
  computeScores,
  casePassed,
  defaultTargets,
} from "../simulation/scoring";
import type { ScoreTargets } from "../simulation/scoring";
import { coachCase } from "../simulation/adaptiveCoach";
import type { CoachInsight } from "../simulation/adaptiveCoach";
import { catheterById } from "../data/catheters";
import { viewById } from "../data/viewPresets";
import { CASE_LIBRARY } from "../simulation/caseGenerator";
import { round } from "../utils/math";
import { uid } from "../utils/random";
import { useProgressStore } from "./useProgressStore";
import { resolveLabPolicy, type LabPolicy } from "../ui/lab/visibility";
import type { PedalState } from "../simulation/session/types";
import type { ReportComparison, StudyReport } from "../mentor/report";
import type { PciTarget } from "../simulation/session/handover";

/**
 * The study report the learner submitted at the finish step (diag-study-report): the report, its
 * comparison with the case truth (for the debrief) and the PCI target it hands over (null for no PCI).
 * pciTarget is kept here for the full case's ad hoc gate and the diagnostic-to-PCI hand-over to read
 * (not wired yet: the hand-over's HandoverExtensions.pciTarget is to be set from it where the full case
 * builds the hand-over); nothing else chooses a target.
 */
export interface SubmittedStudyReport {
  report: StudyReport;
  comparison: ReportComparison;
  pciTarget: PciTarget | null;
  /** wall seconds since the case started */
  submittedAt: number;
}

// ---------------------------------------------------------------------------
// Control increments. Advancing/withdrawing changes tip height; torque rotates
// the preshaped tip. Two torque grains map to the A/D (coarse) and Q/E (fine)
// keys so trainees can both hunt for and fine-tune an ostium.
// ---------------------------------------------------------------------------
const INSERT_STEP = 1.2;
const TORQUE_COARSE = 0.22;
const TORQUE_FINE = 0.075;
const WIRE_STEP = 2;
const CARM_STEP = 5;

/** Detector field sizes (cm, side of the square field) offered on a cardiac flat panel. */
export type FieldSize = 25 | 20 | 16 | 12;
/** Pulse and frame rates (per s); 3.75 is offered by the PCI lab (src/render/xray/adrc.ts PulseRate). */
export type PulseRate = 3.75 | 7.5 | 15 | 30;
export interface ImagingState {
  field: FieldSize;
  panX: number;
  panY: number;
  /** fluoroscopy pulse rate (pulses/s) */
  pulseRate: PulseRate;
  /** cine acquisition rate (frames/s), separate from the fluoroscopy pulse rate */
  cineRate: PulseRate;
  /** collimator shutters, 0..1 of the image from each edge (left, right, top, bottom) */
  shutters: [number, number, number, number];
  /** semi-transparent wedge filter: insertion 0 (out) .. 1 (whole field), edge angle (deg, 0 = covers the right side) */
  wedge: { insertion: number; angleDeg: number };
  /** table top height relative to the start of the case (mm, + = up) */
  tableHeight: number;
}

/** Wall-clock seconds (performance.now based; 0 where unavailable). */
const nowS = () => (typeof performance !== "undefined" ? performance.now() / 1000 : 0);

export interface Overlays {
  labels: boolean;
  ostia: boolean;
  valvePlane: boolean;
  cusps: boolean;
  transparent: boolean;
  fluoroOnly: boolean;
}

// A contrast injection is a bolus with a lifecycle: antegrade wash-in from the
// ostium outward, a brief hold, then wash-out. `plume` renders reflux into the
// aortic root (non-selective puff) or staining (injection into a damped tip).
export interface ContrastBolus {
  filled: VesselId[];
  plume: "none" | "root" | "reflux";
  side: "left" | "right" | null;
  phase: number; // 0..1 lifecycle progress
  duration: number; // seconds
  progress: number; // 0..1 antegrade wash-in fraction (ostium → distal)
  intensity: number; // 0..1 current opacity
  peak: number; // max opacity for this injection
  /** the selective injection gave a diagnostic opacification */
  diagnostic?: boolean;
  /** a cine run was recording at some point while this bolus was in the vessels */
  filmed?: boolean;
  /** already counted as a diagnostic run */
  counted?: boolean;
  /** the lab ends this bolus (endBolus) when its contrast transport has cleared; the store holds it until then */
  labEnded?: boolean;
}

/** Vessels filled from the right coronary injection, for a bolus with no engaged side (an aortic or cusp injection). */
const RIGHT_FILLED = new Set<string>(["RCA", "PDA", "PLV", "CONUS", "AM"]);

/** The filmed sides with a bolus's added: its engaged side, or the sides of the vessels it filled. */
function withBolusSides(had: readonly ("left" | "right")[], b: Pick<ContrastBolus, "side" | "filled">): ("left" | "right")[] {
  if (!b.filled.length) return [...had];
  const sides = b.side ? [b.side] : b.filled.map((v) => (RIGHT_FILLED.has(v) ? ("right" as const) : ("left" as const)));
  return [...new Set([...had, ...sides])];
}

function advanceBolus(b: ContrastBolus | null, dt: number): ContrastBolus | null {
  if (!b) return null;
  if (b.labEnded) return { ...b, phase: Math.min(0.99, b.phase + dt / b.duration), progress: 1, intensity: b.peak };
  const phase = b.phase + dt / b.duration;
  if (phase >= 1) return null;
  const progress = Math.max(0, Math.min(1, phase / 0.3));
  let env: number;
  if (phase < 0.3) env = phase / 0.3; // wash-in
  else if (phase < 0.55) env = 1; // hold
  else env = Math.max(0, 1 - (phase - 0.55) / 0.45); // wash-out
  // A reflux/stain lingers faintly instead of clearing fully.
  if (b.plume === "reflux") env = Math.max(env, 0.28 * (1 - phase));
  return { ...b, phase, progress, intensity: b.peak * env };
}

/**
 * What the device physics writes into the store each frame while it drives the catheter
 * (diag-rod-physics, src/ui/physics/physicsDevices.ts): the tip and engagement from the rod solver's
 * classifier through the legacy bridge, the hub read-outs, and the pressure class of the patient
 * engine's own trace. recompute() then takes them as they are instead of running computeTip and
 * computeEngagement.
 */
export interface PhysicsStoreReadout {
  tip: TipState;
  engagement: EngagementState;
  /** hub read-outs: insertion (catheter length inside the patient, mm), torque (hub roll, rad), wire lead (mm), windup, forward pressure, resistance, whip */
  controls: Partial<Pick<ControlState, "insertion" | "torque" | "wireInsertion" | "windup" | "forwardPressure" | "resistance" | "whip">>;
  /** the patient engine's trace class at the tip, when the lab has one; else the legacy classes from the engagement */
  pressure?: PressureState | null;
  /** the tip moved since the last read-out (an earlier aspiration no longer stands) */
  moving?: boolean;
}

interface SimData {
  mode: SimMode;
  difficulty: Difficulty;
  caseData: AnatomyCase;
  model: AnatomyModel;
  targets: ScoreTargets;
  catheterId: string;
  wireId: string;
  controls: ControlState;
  cArm: CArm;
  /** imaging chain set by the operator: detector field (cm), table pan (mm, patient frame) and pulse rate */
  imaging: ImagingState;
  tip: TipState;
  engagement: EngagementState;
  pressure: PressureState;
  lastInjection: (ContrastResult & { fillOpacity: number }) | null;
  contrastFilled: VesselId[];
  contrastOpacity: number;
  contrastProgress: number; // antegrade wash-in fraction of the live bolus
  bolus: ContrastBolus | null;
  fluoroOn: boolean;
  /** either pedal is held → live beam (image updates, dose accrues); kept for older readers */
  fluoroLive: boolean;
  /** the two foot switches: fluoroscopy and cine are separate, as on a real table */
  pedal: PedalState;
  /**
   * The lab shell drives imaging from the pedals (S10): a cine run is the cine pedal interval, an
   * injection is independent of the beam, fluoroscopy time counts fluoroscopy only. Off (default) keeps
   * the earlier coupling (an injection is its own cine run), which headless tests and older hosts use.
   */
  pedalImaging: boolean;
  /** cine seconds and cine runs (pedal imaging) */
  cineTime: number;
  cineRuns: number;
  /** injections that were never filmed (no cine while the contrast was in the vessels) */
  unfilmedInjections: number;
  /**
   * The sides (left, right) from which a filmed injection filled coronary vessels in this case: the study
   * report credits a wall only to an injection that was made and filmed (diag-study-report).
   */
  filmedInjectionSides: ("left" | "right")[];
  /** contrast volume comes from the store's estimate per injection, or is booked from the lab's syringe */
  contrastSource: "estimate" | "syringe";
  /** wall-clock seconds at case load (event times are wall time since this) */
  sessionStart: number;
  /** what the screens may show and how the attending behaves (level policy, exam mode) */
  policy: LabPolicy;
  overlays: Overlays;
  score: ScoreState;
  events: SimEvent[];
  hintsUsed: number;
  fluoroTime: number;
  /** accumulated vessel-wall trauma from forceful contact, 0..~1.4 */
  trauma: number;
  /** a catheter-induced dissection has occurred (latched) */
  dissection: boolean;
  /** result of the last aspiration check (resets when the tip moves) */
  aspirated: "unknown" | "clean" | "no-return";
  /** active rhythm complication */
  arrhythmia: "none" | "vf";
  finished: boolean;
  /** the finish step's study report is open (diag-study-report); finishCase runs once it is submitted */
  finishing: boolean;
  /** the study report submitted at the finish step (null until then) */
  studyReport: SubmittedStudyReport | null;
  coach: CoachInsight | null;
  lastHint: string;
  _prevEngagement: EngagementState | null;
  _prevPressure: PressureState | null;
  _engagedOnce: boolean;
  /** the device physics drives the catheter: tip and engagement come from setPhysicsReadout (diag-rod-physics) */
  physicsOn: boolean;
  /** the pressure class the physics read-out last gave (the patient engine's trace), or null */
  _physPressure: PressureState | null;
  /**
   * The pressure at the catheter tip from the lab's patient engine (diag-pressure-transducer): its
   * tip-chamber class and its transduced numbers, set by the lab session through setEnginePressure.
   * With one, recompute() takes the class from it instead of the legacy computePressure, so the
   * deep-damping event and score follow the engine's tip-state transitions. Null in headless use.
   */
  _enginePressure: PressureState | null;
  /** what the last aspiration found (diag-pressure-transducer), or null before any aspiration in this case */
  lastAspiration: AspirationResult | null;
  /**
   * The left heart task the operator has chosen (diag-lv-aorta-task, the Left heart tab): with
   * 'ventriculogram' an injection into the LV through a pigtail is the intended run, not the
   * safety error an LV injection is otherwise; with 'aortogram' a pigtail's root injection is the
   * intended aortogram, not a non-selective coronary injection. Null (the default) scores as before.
   */
  leftHeartTask: LeftHeartTask | null;
  /**
   * The lab session whose patient engine owns the rhythm (diag-rhythm-haemodynamic-events), or null.
   * With an owner, VF comes only from the engine's hazard model (an injection into the conus is judged
   * there, not by a fixed rule here) and reaches the store through engineArrhythmia; without one (a
   * headless store, the legacy hosts) a conus injection fibrillates as before.
   */
  _rhythmOwner: string | null;
}

/** The left heart tasks (diag-lv-aorta-task). */
export type LeftHeartTask = "ventriculogram" | "aortogram";

/**
 * The outcome of an aspiration (diag-pressure-transducer, src/ui/sim/labSession.ts aspirate):
 * 'free' blood returns; 'wall', no return with the tip against the wall or obstructing an ostium
 * (easing back a few millimetres frees it); 'plug', no return from a catheter plugged with thrombus or
 * plaque; 'air', the syringe was pulled hard against a blocked catheter and drew air in through the
 * Y-connector. What the gauze shows is 'blood', 'thrombus' (usually from the sheath), 'plaque'
 * (glistening aortic debris) or nothing.
 */
export type AspirationOutcome = "free" | "wall" | "plug" | "air";
export interface AspirationResult {
  outcome: AspirationOutcome;
  material: "blood" | "thrombus" | "plaque" | "none";
  /** where it was drawn from: the catheter, or the sheath's side arm */
  from: "catheter" | "sheath";
  /** how it was drawn: a syringe on the port (the default) or the catheter withdrawn under continuous suction */
  via?: "syringe" | "suction-removal";
  /** wall seconds since the case started */
  t: number;
}

interface SimActions {
  loadCase: (c: AnatomyCase, mode: SimMode, difficulty?: Difficulty) => void;
  setDifficulty: (d: Difficulty) => void;
  setCatheter: (id: string) => void;
  setWire: (id: string) => void;
  advance: (mult?: number) => void;
  withdraw: (mult?: number) => void;
  rotate: (dir: number) => void; // coarse torque (A/D)
  torque: (dir: number) => void; // fine torque (Q/E)
  commandInsertion: (delta: number) => void; // continuous (mouse) advance/withdraw
  commandTorque: (delta: number) => void; // continuous (mouse) torque
  commandWire: (delta: number) => void; // continuous (mouse) wire advance/withdraw
  relaxLoad: () => void; // neutralise stored torque / forward push (no tip jump)
  wire: (dir: number) => void;
  inject: () => void;
  /**
   * Confirm free blood return before injecting. Without an argument the store judges it from the
   * legacy classes; the lab session passes the outcome its tip and lumen model gives
   * (diag-pressure-transducer).
   */
  aspirate: (result?: Omit<AspirationResult, "t">) => void;
  defibrillate: () => void; // recover from VF
  /**
   * The patient engine fibrillated (diag-rhythm-haemodynamic-events): the store's arrhythmia, the score's
   * arrhythmia count and the vf-arrest event. The message names the rhythm only; the cause stays with
   * the session's record for the debrief. Nothing happens when the store is already in VF.
   */
  engineArrhythmia: (kind: "vf") => void;
  /** claim (an owner id) or release (null, by the same owner) the rhythm for a lab session's engine */
  setRhythmOwner: (owner: string | null, releasing?: string) => void;
  checkPressure: () => void;
  setCArm: (cArm: CArm) => void;
  /** detector field size in cm (smaller = magnified, more dose) */
  setField: (cm: FieldSize) => void;
  /** move the table: +x patient left, +y head-wards (mm) */
  panTable: (dx: number, dy: number) => void;
  centreTable: () => void;
  setPulseRate: (fps: PulseRate) => void;
  nudgeCArm: (dLaoRao: number, dCranial: number) => void;
  applyViewPreset: (id: string) => void;
  toggleFluoro: () => void;
  setFluoroLive: (on: boolean) => void;
  /** foot switches (lab shell) */
  setPedal: (p: PedalState) => void;
  setPedalImaging: (on: boolean) => void;
  /** book contrast actually delivered by the lab's syringe (mL) */
  bookContrast: (ml: number) => void;
  /** end the current bolus (the lab's transport says the contrast has cleared) */
  endBolus: () => void;
  setCineRate: (fps: PulseRate) => void;
  setShutters: (s: [number, number, number, number]) => void;
  setWedge: (w: { insertion: number; angleDeg: number }) => void;
  setTableHeight: (mm: number) => void;
  /** absolute table position (mm), from the table dynamics */
  setPan: (x: number, y: number) => void;
  /** wall seconds since the case started */
  wallTime: () => number;
  toggleOverlay: (key: keyof Overlays) => void;
  hint: () => void;
  reset: () => void;
  tick: (dt: number) => void;
  finishCase: () => void;
  /** open the finish step's study report (nothing once the case is finished) */
  beginFinish: () => void;
  /** close the study report and go back to the study */
  cancelFinish: () => void;
  /** store the submitted study report and finish the case */
  submitStudyReport: (r: SubmittedStudyReport) => void;
  /** the device physics' read-out for this frame; null hands the catheter back to the analytic model */
  setPhysicsReadout: (r: PhysicsStoreReadout | null) => void;
  /** the patient engine's pressure at the tip (diag-pressure-transducer); null returns to the legacy classes */
  setEnginePressure: (p: PressureState | null) => void;
  /** choose the left heart task (diag-lv-aorta-task); null ends it */
  setLeftHeartTask: (task: LeftHeartTask | null) => void;
}

type SimStore = SimData & SimActions;

/** Event time: wall seconds since the case started (not fluoroscopy seconds; S11 step 1a). */
const wallT = (s: { sessionStart: number }) => round(Math.max(0, nowS() - s.sessionStart), 1);

const NON_MISTAKE = new Set(["engaged", "diagnostic-injection", "info"]);

function targetsFor(c: AnatomyCase): ScoreTargets {
  const hasLeft = c.requiredViews.includes("spider");
  const hasRight = c.requiredViews.includes("rcalao");
  const both = hasLeft && hasRight;
  if (both) return { contrastBudget: 75, fluoroBudget: 180, requiredDiagnostic: 4 };
  return defaultTargets();
}

function uniqueMistakes(events: SimEvent[]): MistakeCode[] {
  const set = new Set<MistakeCode>();
  for (const e of events) {
    if (!NON_MISTAKE.has(e.code)) set.add(e.code as MistakeCode);
  }
  return Array.from(set);
}

function isDeepDamp(p: PressureState): boolean {
  return (
    (p.kind === "damped" || p.kind === "wedged" || p.kind === "ventricularised") &&
    p.warning === "danger"
  );
}

// Once a vessel is dissected the trace never recovers to clean aortic: it reads
// low, damped and blunted regardless of tip position.
function dissectedPressure(p: PressureState): PressureState {
  return {
    kind: "dissected",
    systolic: Math.min(p.systolic, 88),
    diastolic: Math.max(p.diastolic, 60),
    quality: 0.4,
    warning: "danger",
    label: "Dissection — damped, blunted trace; do not inject",
  };
}

/** The deep-damping event's message (a transition of the trace class into damped, ventricularised or wedged). */
const DEEP_DAMP_MESSAGE = "The pressure damped — the catheter is deeply engaged and obstructing flow. Withdraw slightly until the trace recovers.";

/** The legacy dynamics' over-push warning (tick and the rod mechanics' read-out). */
const TOO_MUCH_PUSHING_MESSAGE = "Forward pressure is building against a tip that isn't seating. Pushing harder won't align it — withdraw and torque instead.";

// Recompute tip / engagement / pressure from the current controls, detect
// state transitions (LV entry, damping, first selective engagement, over-
// pushing) and log them, then refresh the live derived scores.
function recompute(s: SimData): SimData {
  const cath = catheterById(s.catheterId);
  if (!cath) return s;

  // with the device physics on, the tip and engagement are its read-out (setPhysicsReadout), at every difficulty
  const tip = s.physicsOn && s.tip ? s.tip : computeTip(s.model, cath, s.controls);
  const engagement = s.physicsOn && s.engagement ? s.engagement : computeEngagement(s.model, cath, s.controls, s.difficulty);
  const pressure0 = (s.physicsOn && s._physPressure) || s._enginePressure || computePressure(engagement, tip, s.controls, cath);
  // A dissected vessel overrides the clean-trace calculation permanently.
  const pressure = s.dissection ? dissectedPressure(pressure0) : pressure0;

  const prevEng = s._prevEngagement;
  const prevPress = s._prevPressure;
  const t = wallT(s);
  let events = s.events;
  let score = { ...s.score };
  let engagedOnce = s._engagedOnce;
  const ctx = s.caseData.name;

  const add = (code: SimEvent["code"], message: string) => {
    events = [...events, { t, code, message, context: ctx }];
  };

  if (engagement.kind === "in-lv" && prevEng?.kind !== "in-lv") {
    // the left heart task (diag-lv-aorta-task): a pigtail crossing for the planned ventriculogram is the intended
    // crossing, not an LV entry error
    if (/^PIG/.test(s.catheterId) && s.leftHeartTask === "ventriculogram") {
      add("info", "Pigtail across the aortic valve into the left ventricle.");
    } else {
      score.lvEntries += 1;
      add(
        "lv-entry",
        "The tip crossed the valve plane into the left ventricle. Do not inject — withdraw to the root."
      );
    }
  }

  if (isDeepDamp(pressure) && !(prevPress && isDeepDamp(prevPress))) {
    score.dampedEvents += 1;
    add("deep-engagement", DEEP_DAMP_MESSAGE);
  }

  if (engagement.isSelective && !prevEng?.isSelective) {
    score.successfulEngagements += 1;
    engagedOnce = true;
    add("engaged", engagement.message);
  }

  score = computeScores({ ...score, fluoroTime: s.fluoroTime }, s.targets);

  return {
    ...s,
    tip,
    engagement,
    pressure,
    score,
    events,
    _prevEngagement: engagement,
    _prevPressure: pressure,
    _engagedOnce: engagedOnce,
  };
}

/** The session policy for a case: exam mode, the launch's active policy, or the level in force (src/ui/lab/visibility.ts). */
function policyFor(mode: SimMode, caseId: string): LabPolicy {
  let prog: Parameters<typeof resolveLabPolicy>[2] = null;
  try {
    const p = useProgressStore.getState();
    prog = { activePolicy: p.activePolicy, profile: { entrustment: p.profile.entrustment } };
  } catch {
    prog = null;
  }
  return resolveLabPolicy(mode, caseId, prog);
}

function buildSim(
  c: AnatomyCase,
  mode: SimMode,
  difficulty: Difficulty
): SimData {
  const model = buildAnatomy(c);
  const policy = policyFor(mode, c.id);
  const ov = policy.visibility.overlays;
  const seed = {
    mode,
    difficulty,
    caseData: c,
    model,
    targets: targetsFor(c),
    catheterId: c.recommendedCatheters[0] ?? "JL4",
    wireId: "J",
    controls: initialControls(),
    cArm: { laoRao: 0, cranialCaudal: 0 },
    imaging: {
      field: 25 as FieldSize,
      panX: 0,
      panY: 0,
      pulseRate: 15 as PulseRate,
      cineRate: 15 as PulseRate,
      shutters: [0, 0, 0, 0] as [number, number, number, number],
      wedge: { insertion: 0, angleDeg: 0 },
      tableHeight: 0,
    },
    tip: null as unknown as TipState,
    engagement: null as unknown as EngagementState,
    pressure: null as unknown as PressureState,
    lastInjection: null,
    contrastFilled: [] as VesselId[],
    contrastOpacity: 0,
    contrastProgress: 0,
    bolus: null as ContrastBolus | null,
    fluoroOn: true,
    fluoroLive: false,
    pedal: { fluoro: false, cine: false },
    pedalImaging: false,
    cineTime: 0,
    cineRuns: 0,
    unfilmedInjections: 0,
    filmedInjectionSides: [],
    contrastSource: "estimate" as SimData["contrastSource"],
    sessionStart: nowS(),
    policy,
    // anatomy overlays follow the level policy (off from supervised practice on, locked off in exams)
    overlays: {
      labels: ov.labels,
      ostia: ov.ostia,
      valvePlane: ov.valvePlane,
      cusps: false,
      transparent: ov.transparent,
      fluoroOnly: false,
    },
    score: initScore(),
    events: [] as SimEvent[],
    hintsUsed: 0,
    fluoroTime: 0,
    trauma: 0,
    dissection: false,
    aspirated: "unknown" as SimData["aspirated"],
    arrhythmia: "none" as SimData["arrhythmia"],
    finished: false,
    finishing: false,
    studyReport: null as SubmittedStudyReport | null,
    coach: null,
    lastHint: "",
    _prevEngagement: null,
    _prevPressure: null,
    _engagedOnce: false,
    physicsOn: false,
    _physPressure: null as PressureState | null,
    _enginePressure: null as PressureState | null,
    lastAspiration: null as AspirationResult | null,
    leftHeartTask: null as LeftHeartTask | null,
    _rhythmOwner: null as string | null,
  };
  return recompute(seed);
}

function buildHint(s: SimData): string {
  const eng = s.engagement;
  const rec = s.caseData.recommendedCatheters.join(" or ");
  const cue = catheterById(s.catheterId)?.seatCue;
  if (eng.conus)
    return "Conus over-selection — the tip is up in the conus branch. Withdraw slightly to drop onto the RCA ostium; do NOT inject here (VF risk).";
  if (eng.kind === "in-lv")
    return "You are below the valve plane. Withdraw (S) until the pressure returns to aortic before anything else.";
  if (eng.isDeep)
    return "Deeply engaged — withdraw (S) a touch until the pressure trace normalises, then inject.";
  if (eng.isSelective)
    return "Seated and coaxial. Aspirate to confirm free blood return, choose a view that lays out your target, then inject (Space).";
  if (eng.kind === "ascending-aorta")
    return "Too high — advance (W) gently to drop the tip down to the sinus level.";
  if (eng.kind.startsWith("coaxial"))
    return `Coaxial but not seated. ${cue ?? "A gentle seating motion (or a slightly larger curve) will engage it."}`;
  if (eng.kind.startsWith("near"))
    return "Close but not coaxial — a small torque to align the tip with the ostium beats advancing.";
  if (eng.kind === "non-selective" || eng.kind === "sinus-level")
    return cue
      ? `${cue} (${rec})`
      : `At the sinus level. Torque (Q/E) toward the target cusp to engage. Recommended: ${rec}.`;
  return cue ?? `Bring the tip to the sinus level and torque toward the cusp. Recommended: ${rec}.`;
}

export const useSimulatorStore = create<SimStore>((set, get) => ({
  ...buildSim(CASE_LIBRARY[0], "free", "beginner"),

  // a mounted lab shell keeps driving imaging from the pedals across case loads
  loadCase: (c, mode, difficulty) =>
    set((s) => ({ ...buildSim(c, mode, difficulty ?? get().difficulty), pedalImaging: s.pedalImaging, contrastSource: s.contrastSource, _rhythmOwner: s._rhythmOwner })),

  setDifficulty: (d) => set((s) => recompute({ ...s, difficulty: d })),

  setCatheter: (id) =>
    set((s) => {
      if (id === s.catheterId || !catheterById(id)) return {};
      return recompute({
        ...s,
        catheterId: id,
        controls: initialControls(),
        score: { ...s.score, catheterChanges: s.score.catheterChanges + 1 },
      });
    }),

  setWire: (id) => set(() => ({ wireId: id })),

  // Keyboard nudges move the COMMANDED hub position; the tip lags toward it
  // through the dynamics model on each tick (see `tick`).
  advance: (mult = 1) =>
    set((s) => {
      if (s.finished) return {};
      const controls: ControlState = {
        ...s.controls,
        cmdInsertion: s.controls.cmdInsertion + INSERT_STEP * mult,
        pushStreak: s.controls.pushStreak + 1,
      };
      return { controls };
    }),

  withdraw: (mult = 1) =>
    set((s) => {
      if (s.finished) return {};
      const controls: ControlState = {
        ...s.controls,
        cmdInsertion: s.controls.cmdInsertion - INSERT_STEP * mult,
        pushStreak: 0,
      };
      return { controls };
    }),

  rotate: (dir) =>
    set((s) => {
      if (s.finished) return {};
      const controls: ControlState = {
        ...s.controls,
        cmdTorque: s.controls.cmdTorque + TORQUE_COARSE * Math.sign(dir || 1),
        pushStreak: 0,
      };
      return { controls };
    }),

  torque: (dir) =>
    set((s) => {
      if (s.finished) return {};
      const controls: ControlState = {
        ...s.controls,
        cmdTorque: s.controls.cmdTorque + TORQUE_FINE * Math.sign(dir || 1),
        pushStreak: 0,
      };
      return { controls };
    }),

  commandInsertion: (delta) =>
    set((s) => {
      if (s.finished) return {};
      const controls: ControlState = {
        ...s.controls,
        cmdInsertion: s.controls.cmdInsertion + delta,
        pushStreak: delta > 0 ? s.controls.pushStreak + 1 : 0,
      };
      return { controls };
    }),

  commandTorque: (delta) =>
    set((s) => {
      if (s.finished) return {};
      const controls: ControlState = {
        ...s.controls,
        cmdTorque: s.controls.cmdTorque + delta,
      };
      return { controls };
    }),

  commandWire: (delta) =>
    set((s) => {
      if (s.finished) return {};
      const controls: ControlState = {
        ...s.controls,
        wireInsertion: Math.max(0, s.controls.wireInsertion + delta),
      };
      return recompute({ ...s, controls });
    }),

  // Carefully unload the catheter: bleed off stored torque wind-up and forward
  // push by matching the command to what the tip actually delivered, and damp
  // the spring velocities. The tip does NOT jump — this just relieves load.
  relaxLoad: () =>
    set((s) => {
      if (s.finished) return {};
      const c = s.controls;
      const controls: ControlState = {
        ...c,
        cmdInsertion: c.insertion,
        cmdTorque: c.torque,
        vInsertion: c.vInsertion * 0.2,
        vTorque: c.vTorque * 0.2,
        windup: 0,
        forwardPressure: 0,
        whip: 0,
        resistance: 0,
        pushStreak: 0,
      };
      return { controls };
    }),

  wire: (dir) =>
    set((s) => {
      if (s.finished) return {};
      const controls: ControlState = {
        ...s.controls,
        wireInsertion: Math.max(0, s.controls.wireInsertion + WIRE_STEP * Math.sign(dir || 1)),
      };
      return recompute({ ...s, controls });
    }),

  inject: () =>
    set((s) => {
      if (s.finished) return {};
      const t0 = wallT(s);

      // --- Conus over-selection → VF, in a headless store only. A contrast injection into the conus
      //     branch provokes ventricular fibrillation. Recover with defibrillate(). With a lab session's
      //     patient engine owning the rhythm (diag-rhythm-haemodynamic-events), the engine's hazard
      //     model judges the conus injection instead (below). ---
      if (s.engagement.conus && !s._rhythmOwner) {
        haptics.pulse(1, 260);
        const score = computeScores(
          {
            ...s.score,
            injections: s.score.injections + 1,
            arrhythmias: s.score.arrhythmias + 1,
            dangerousInjections: s.score.dangerousInjections + 1,
            fluoroTime: s.fluoroTime,
          },
          s.targets
        );
        return {
          arrhythmia: "vf",
          aspirated: "unknown",
          score,
          events: [
            ...s.events,
            { t: t0, code: "vf-arrest", message: "Conus injection provoked ventricular fibrillation — DEFIBRILLATE now.", context: s.caseData.name },
          ],
        };
      }

      // --- A conus injection with the engine owning the rhythm: a dangerous injection, which the
      //     engine's hazard model may answer with VF; the contrast fills what the damped tip reaches. ---
      const conusEngine = s.engagement.conus && !!s._rhythmOwner;

      // --- Air embolism: injecting without a confirmed clean aspirate while the
      //     tip is against the wall / deep / damped (no free blood return). A conus injection is
      //     judged as the conus injection it is, as the legacy branch above always has. ---
      const riskyPos =
        !conusEngine &&
        s.engagement.isDeep ||
        s.tip.cram > 4 ||
        s.pressure.kind === "damped" ||
        s.pressure.kind === "wedged" ||
        s.pressure.kind === "ventricularised" ||
        s.pressure.kind === "dissected";
      if (s.aspirated !== "clean" && riskyPos) {
        haptics.pulse(0.9, 160);
        const score = computeScores(
          {
            ...s.score,
            injections: s.score.injections + 1,
            airEmbolisms: s.score.airEmbolisms + 1,
            dangerousInjections: s.score.dangerousInjections + 1,
            fluoroTime: s.fluoroTime,
          },
          s.targets
        );
        return {
          aspirated: "unknown",
          score,
          events: [
            ...s.events,
            { t: t0, code: "air-embolism", message: "Injected against the wall without a clean aspirate — air embolism. Aspirate to a free return first.", context: s.caseData.name },
          ],
        };
      }

      const result = injectContrast(s.engagement, s.pressure, s.model);
      const t = wallT(s);
      let events = s.events;
      const add = (code: SimEvent["code"], message: string) => {
        events = [...events, { t, code, message, context: s.caseData.name }];
      };
      const score = { ...s.score };
      score.injections += 1;
      if (conusEngine) {
        score.dangerousInjections += 1;
        add("damped-injection", "Injected with the tip up in the conus branch: a damped, dangerous position. Withdraw before the next injection.");
      }
      // the lab's syringe books what it actually delivered (bookContrast); otherwise the per-run estimate
      if (s.contrastSource === "estimate") score.contrastVolume += result.volume;
      // with pedal imaging a run only counts as diagnostic once it is filmed (cine running while the contrast is in)
      const filmedNow = !s.pedalImaging || s.pedal.cine;

      // with a lab session attached, s.pressure is the engine's tip class (setEnginePressure), so the
      // deep-reflux case covers an injection into a damped, wedged or ventricularised trace
      // the left heart task (diag-lv-aorta-task): the run the operator set out to film through a pigtail
      const pigtail = /^PIG/.test(s.catheterId);
      const intendedLv = result.outcome === "lv-injection" && pigtail && s.leftHeartTask === "ventriculogram";
      const intendedRoot = (result.outcome === "root-puff" || result.outcome === "weak") && pigtail && s.leftHeartTask === "aortogram";
      switch (result.outcome) {
        case "lv-injection":
          if (intendedLv) {
            add("info", "Left ventriculogram: contrast into the LV through the pigtail.");
            break;
          }
          score.dangerousInjections += 1;
          add("lv-injection", result.message);
          break;
        case "deep-reflux":
          score.dangerousInjections += 1;
          add("damped-injection", result.message);
          break;
        case "selective-lca":
        case "selective-rca":
          score.selectiveInjections += 1;
          if (result.diagnostic) {
            if (filmedNow) {
              score.diagnosticInjections += 1;
              add("diagnostic-injection", result.message);
            }
          } else {
            add("info", result.message);
          }
          break;
        case "weak":
        case "root-puff":
          if (intendedRoot) {
            add("info", "Aortogram: contrast into the aortic root through the pigtail.");
            break;
          }
          score.nonSelectiveInjections += 1;
          add("non-selective-injection", result.message);
          break;
        case "none":
        default:
          add("info", result.message);
          break;
      }

      const scored = computeScores({ ...score, fluoroTime: s.fluoroTime }, s.targets);

      // Build the bolus timeline for this injection.
      const plume: ContrastBolus["plume"] =
        result.outcome === "lv-injection"
          ? "reflux"
          : result.outcome === "deep-reflux"
          ? "reflux"
          : result.outcome === "root-puff" || result.outcome === "weak"
          ? "root"
          : "none";
      const side: ContrastBolus["side"] =
        s.engagement.target === "right"
          ? "right"
          : s.engagement.target === "left"
          ? "left"
          : null;
      const bolus: ContrastBolus | null =
        result.filledVessels.length || plume !== "none"
          ? {
              filled: result.filledVessels,
              plume,
              side,
              phase: 0,
              // pre-shoot, ~2.5 s hand injection, washout over a few beats; with pedal imaging the lab ends it
              duration: s.pedalImaging ? 60 : result.diagnostic ? 4.8 : 3.4,
              progress: 0,
              intensity: 0,
              peak: Math.max(result.fillOpacity, plume !== "none" ? 0.3 : 0),
              diagnostic: result.diagnostic,
              filmed: filmedNow,
              counted: filmedNow && result.diagnostic,
              labEnded: s.pedalImaging,
            }
          : null;

      return {
        score: scored,
        events,
        lastInjection: result,
        filmedInjectionSides: bolus?.filmed ? withBolusSides(s.filmedInjectionSides, bolus) : s.filmedInjectionSides,
        contrastFilled: result.filledVessels,
        contrastOpacity: 0,
        contrastProgress: 0,
        bolus,
        fluoroOn: true,
        aspirated: "unknown",
      };
    }),

  aspirate: (result) =>
    set((s) => {
      if (s.finished) return {};
      const t = wallT(s);
      if (result) {
        // the lab session's outcome from its tip and lumen model (diag-pressure-transducer)
        const fromSheath = result.from === "sheath";
        const clean = result.outcome === "free";
        const message = result.via === "suction-removal"
          ? result.material === "thrombus"
            ? "Catheter removed under suction: thrombus on the gauze."
            : "Catheter removed under suction: blood only on the gauze."
          : fromSheath
          ? result.material === "thrombus"
            ? "Sheath side arm aspirated: thrombus on the gauze."
            : "Sheath side arm aspirated: blood only."
          : result.outcome === "free"
            ? result.material === "plaque"
              ? "Aspiration: blood return with glistening debris on the gauze."
              : "Aspiration: free blood return."
            : result.outcome === "air"
              ? "Aspiration: the syringe filled with air drawn in through the connector, not blood."
              : "Aspiration: no blood return.";
        return {
          // a sheath aspiration says nothing about the catheter's lumen
          aspirated: fromSheath ? s.aspirated : clean ? "clean" : "no-return",
          lastAspiration: { ...result, t },
          events: [...s.events, { t, code: "info" as const, message, context: s.caseData.name }],
        };
      }
      const p = s.pressure;
      const eng = s.engagement;
      // Free blood return only from a clean, non-wall, non-deep, non-conus seat.
      const clean =
        !eng.isDeep &&
        !eng.conus &&
        eng.kind !== "in-lv" &&
        s.tip.cram < 4 &&
        p.kind !== "damped" &&
        p.kind !== "wedged" &&
        p.kind !== "ventricularised" &&
        p.kind !== "dissected" &&
        p.kind !== "lv";
      const aspirated: SimData["aspirated"] = clean ? "clean" : "no-return";
      return {
        aspirated,
        lastAspiration: { outcome: clean ? "free" : "wall", material: clean ? "blood" : "none", from: "catheter", t },
        events: [
          ...s.events,
          {
            t,
            code: "info",
            message: clean
              ? "Aspiration: free blood return — safe to inject."
              : "Aspiration: NO return — tip against the wall or deeply engaged. Reposition; do not inject.",
            context: s.caseData.name,
          },
        ],
      };
    }),

  defibrillate: () =>
    set((s) => {
      if (s.arrhythmia !== "vf") return {};
      const t = wallT(s);
      return {
        arrhythmia: "none",
        events: [
          ...s.events,
          { t, code: "info", message: "Defibrillation — sinus rhythm restored. Reassess before continuing.", context: s.caseData.name },
        ],
      };
    }),

  engineArrhythmia: (kind) =>
    set((s) => {
      if (kind !== "vf" || s.arrhythmia === "vf") return {};
      const t = wallT(s);
      haptics.pulse(1, 260);
      return {
        arrhythmia: "vf",
        score: computeScores({ ...s.score, arrhythmias: s.score.arrhythmias + 1, fluoroTime: s.fluoroTime }, s.targets),
        events: [...s.events, { t, code: "vf-arrest", message: "Ventricular fibrillation. Defibrillate now.", context: s.caseData.name }],
      };
    }),

  setRhythmOwner: (owner, releasing) =>
    set((s) => {
      if (owner === null) return releasing === undefined || s._rhythmOwner === releasing ? { _rhythmOwner: null } : {};
      return s._rhythmOwner === owner ? {} : { _rhythmOwner: owner };
    }),

  checkPressure: () =>
    set((s) => {
      const t = wallT(s);
      return {
        events: [
          ...s.events,
          { t, code: "info", message: `Pressure: ${s.pressure.label}.`, context: s.caseData.name },
        ],
      };
    }),

  setCArm: (cArm) =>
    set(() => ({
      cArm: {
        laoRao: Math.max(-90, Math.min(90, cArm.laoRao)),
        cranialCaudal: Math.max(-45, Math.min(45, cArm.cranialCaudal)),
      },
    })),

  setField: (cm) => set((s) => ({ imaging: { ...s.imaging, field: cm } })),

  panTable: (dx, dy) =>
    set((s) => ({
      imaging: {
        ...s.imaging,
        panX: Math.max(-90, Math.min(90, s.imaging.panX + dx)),
        panY: Math.max(-120, Math.min(120, s.imaging.panY + dy)),
      },
    })),

  centreTable: () => set((s) => ({ imaging: { ...s.imaging, panX: 0, panY: 0 } })),

  setPulseRate: (fps) => set((s) => ({ imaging: { ...s.imaging, pulseRate: fps } })),

  nudgeCArm: (dLaoRao, dCranial) =>
    set((s) => ({
      cArm: {
        laoRao: Math.max(-90, Math.min(90, s.cArm.laoRao + dLaoRao * CARM_STEP)),
        cranialCaudal: Math.max(-45, Math.min(45, s.cArm.cranialCaudal + dCranial * CARM_STEP)),
      },
    })),

  applyViewPreset: (id) => {
    const preset = viewById(id);
    if (preset) set(() => ({ cArm: { ...preset.cArm } }));
  },

  toggleFluoro: () => set((s) => ({ fluoroOn: !s.fluoroOn })),

  setFluoroLive: (on) =>
    set((s) => {
      const pedal = { ...s.pedal, fluoro: on };
      return { pedal, fluoroLive: pedal.fluoro || pedal.cine };
    }),

  setPedal: (p) =>
    set((s) => {
      if (p.fluoro === s.pedal.fluoro && p.cine === s.pedal.cine) return {};
      const pedal = { fluoro: !!p.fluoro, cine: !!p.cine };
      const out: Partial<SimData> = { pedal, fluoroLive: pedal.fluoro || pedal.cine };
      if (pedal.cine && !s.pedal.cine) {
        out.cineRuns = s.cineRuns + 1;
        // a cine started while an unfilmed diagnostic bolus is still in the vessels films it
        const b = s.bolus;
        if (b && !b.filmed) {
          const score = { ...s.score };
          let events = s.events;
          if (b.diagnostic && !b.counted) {
            score.diagnosticInjections += 1;
            events = [...events, { t: wallT(s), code: "diagnostic-injection", message: s.lastInjection?.message ?? "Diagnostic run obtained", context: s.caseData.name }];
          }
          out.bolus = { ...b, filmed: true, counted: b.counted || !!b.diagnostic };
          out.filmedInjectionSides = withBolusSides(s.filmedInjectionSides, b);
          out.score = computeScores({ ...score, fluoroTime: s.fluoroTime }, s.targets);
          out.events = events;
        }
      }
      return out;
    }),

  setPedalImaging: (on) => set(() => ({ pedalImaging: on, contrastSource: on ? "syringe" : "estimate" })),

  bookContrast: (ml) =>
    set((s) => {
      if (!(ml > 0)) return {};
      const score = computeScores({ ...s.score, contrastVolume: s.score.contrastVolume + ml, fluoroTime: s.fluoroTime }, s.targets);
      return { score };
    }),

  endBolus: () =>
    set((s) => {
      const b = s.bolus;
      if (!b) return {};
      const out: Partial<SimData> = { bolus: null, contrastOpacity: 0, contrastProgress: 0 };
      if (s.pedalImaging && !b.filmed) {
        out.unfilmedInjections = s.unfilmedInjections + 1;
        out.events = [...s.events, { t: wallT(s), code: "info", message: "Contrast was injected with no cine running: nothing of that injection was recorded.", context: s.caseData.name }];
      }
      return out;
    }),

  setCineRate: (fps) => set((s) => ({ imaging: { ...s.imaging, cineRate: fps } })),

  setShutters: (sh) =>
    set((s) => ({ imaging: { ...s.imaging, shutters: sh.map((v) => Math.max(0, Math.min(0.45, v))) as [number, number, number, number] } })),

  setWedge: (w) =>
    set((s) => ({ imaging: { ...s.imaging, wedge: { insertion: Math.max(0, Math.min(1, w.insertion)), angleDeg: ((w.angleDeg % 360) + 360) % 360 } } })),

  setTableHeight: (mm) => set((s) => ({ imaging: { ...s.imaging, tableHeight: mm } })),

  setPan: (x, y) =>
    set((s) => {
      const panX = Math.max(-90, Math.min(90, x));
      const panY = Math.max(-120, Math.min(120, y));
      if (panX === s.imaging.panX && panY === s.imaging.panY) return {};
      return { imaging: { ...s.imaging, panX, panY } };
    }),

  wallTime: () => Math.max(0, nowS() - get().sessionStart),

  // anatomy overlays: locked off where the policy says so (exams)
  toggleOverlay: (key) =>
    set((s) => (s.policy.visibility.overlays.toggleable ? { overlays: { ...s.overlays, [key]: !s.overlays[key] } } : {})),

  hint: () =>
    set((s) => {
      if (s.policy.visibility.hints === "off") return {};
      const text = buildHint(s);
      const t = wallT(s);
      const score = computeScores(
        { ...s.score, hintsUsed: s.score.hintsUsed + 1, fluoroTime: s.fluoroTime },
        s.targets
      );
      return {
        lastHint: text,
        hintsUsed: s.hintsUsed + 1,
        score,
        events: [
          ...s.events,
          { t, code: "info", message: `Hint: ${text}`, context: s.caseData.name },
        ],
      };
    }),

  reset: () =>
    set((s) =>
      recompute({
        ...s,
        controls: initialControls(),
        score: initScore(),
        events: [],
        hintsUsed: 0,
        fluoroTime: 0,
        trauma: 0,
        dissection: false,
        aspirated: "unknown",
        arrhythmia: "none",
        contrastFilled: [],
        contrastOpacity: 0,
        contrastProgress: 0,
        bolus: null,
        lastInjection: null,
        fluoroLive: false,
        pedal: { fluoro: false, cine: false },
        cineTime: 0,
        cineRuns: 0,
        unfilmedInjections: 0,
    filmedInjectionSides: [],
        sessionStart: nowS(),
        finished: false,
        finishing: false,
        studyReport: null,
        coach: null,
        lastHint: "",
        _prevEngagement: null,
        _prevPressure: null,
        _engagedOnce: false,
        lastAspiration: null,
      })
    ),

  tick: (dt) =>
    set((s) => {
      if (s.finished) return {};
      const cath = catheterById(s.catheterId);

      // Is the catheter still settling toward its commanded position?
      const c = s.controls;
      const motion =
        !!cath &&
        !s.physicsOn &&
        (Math.abs(c.cmdTorque - c.torque) > 1e-3 ||
          Math.abs(c.cmdInsertion - c.insertion) > 1e-3 ||
          Math.abs(c.vTorque) > 1e-3 ||
          Math.abs(c.vInsertion) > 1e-3 ||
          c.whip > 1e-3);

      let base: SimData = s;
      if (motion && cath) {
        const step = stepDynamics(s.controls, cath, s.model, dt);
        const wasOverPush = s.controls.forwardPressure > 3;
        base = recompute({ ...s, controls: step.controls });

        // Feed the haptic channel: sustained resistance + contact firmness, and
        // a sharp kick when stored torque snaps the tip (whip release).
        haptics.update({
          resistance: step.controls.resistance,
          whip: step.controls.whip,
          contact: Math.max(0, Math.min(1, base.tip.cram / 6)),
        });
        if (step.whipReleased) haptics.pulse(0.9, 120);

        // Over-pushing warning — fires once as forward pressure builds.
        if (!wasOverPush && step.controls.forwardPressure > 3 && !base.engagement.isSelective) {
          base = {
            ...base,
            events: [
              ...base.events,
              {
                t: wallT(base),
                code: "too-much-pushing",
                message: TOO_MUCH_PUSHING_MESSAGE,
                context: base.caseData.name,
              },
            ],
          };
        }
        // Prolapse into the LV — recompute logs the lv-entry transition itself.
        if (step.prolapsed) {
          base = { ...base, score: { ...base.score } };
        }
      }

      // --- Vessel-wall trauma & dissection ---
      // Sustained forward force against a wall (unseated tip cramming the cusp,
      // a deep/wedged seat, or a torque-whip snap while in contact) erodes the
      // intima. Aggressive shapes (Amplatz/guide) tear faster. Cross the
      // threshold once and the vessel dissects — permanent, catastrophic.
      let trauma = base.trauma;
      let dissection = base.dissection;
      let events2 = base.events;
      let score0 = base.score;
      let pressure2 = base.pressure;
      if (cath && !dissection) {
        // `contact` = how hard the preshape crams the cusp wall (an over-sized
        // curve in a small root sits hard against it). `push` = the operator
        // actively driving the hub forward faster than the tip delivers — it
        // decays to ~0 the instant you stop pushing, so only ACTIVE forcing
        // against a wall accrues trauma; a catheter sitting still heals.
        const contact = Math.max(0, Math.min(1, base.tip.cram / 6));
        const push = base.controls.forwardPressure;
        const aggro = 0.6 + cath.behaviour.deepEngagementRisk; // 0.65..1.7
        let rate = 0;
        if (push > 0.6 && contact > 0.2) rate += contact * push * 0.16 * aggro;
        if (base.engagement.isDeep) rate += 0.06 * aggro; // deep seat grinds the ostium
        if (base.engagement.kind === "in-lv" && push > 0.6) rate += push * 0.05 * aggro; // forcing into the LV
        rate += base.controls.whip * contact * 0.5; // a snap while loaded tears
        if (rate > 0) trauma = Math.min(1.4, trauma + rate * dt);
        else trauma = Math.max(0, trauma - 0.06 * dt); // slow recovery when unloaded

        if (trauma >= 1) {
          dissection = true;
          score0 = { ...score0, dissections: score0.dissections + 1 };
          events2 = [
            ...events2,
            {
              t: wallT(base),
              code: "dissection",
              message:
                "Vessel dissection — sustained forward force against the wall tore the intima. The trace is damped and will not recover. Stop pushing; injecting here can propagate it.",
              context: base.caseData.name,
            },
          ];
          haptics.pulse(1, 220);
        }
      } else if (dissection) {
        trauma = Math.max(trauma, 1);
      }
      if (dissection && pressure2.kind !== "dissected") pressure2 = dissectedPressure(pressure2);

      // Fluoroscopy time only accrues while the beam is on. With pedal imaging it is the fluoroscopy pedal
      // alone (cine is counted separately, as the dose display does); otherwise the older coupling, where
      // the pedal or an injection's cine run counted.
      const beamOn = base.pedalImaging ? base.pedal.fluoro && !base.pedal.cine : base.fluoroLive || !!base.bolus;
      const fluoroTime = beamOn ? base.fluoroTime + dt : base.fluoroTime;
      const cineTime = base.pedalImaging && base.pedal.cine ? base.cineTime + dt : base.cineTime;
      const bolus = advanceBolus(base.bolus, dt);
      const score = computeScores({ ...score0, fluoroTime }, base.targets);
      return {
        ...base,
        trauma,
        dissection,
        // any tip movement invalidates the last aspiration — you must re-aspirate.
        aspirated: motion ? "unknown" : base.aspirated,
        events: events2,
        pressure: pressure2,
        _prevPressure: pressure2,
        fluoroTime,
        cineTime,
        bolus,
        contrastOpacity: bolus ? bolus.intensity : 0,
        contrastProgress: bolus ? bolus.progress : 0,
        contrastFilled: bolus ? bolus.filled : base.contrastFilled,
        score,
      };
    }),

  setPhysicsReadout: (r) =>
    set((s) => {
      // back to the analytic model: the rod's read-outs (insertion is the length inside the patient, not
      // the advance from the natural seat) mean nothing to it, so the catheter starts again from its
      // natural seat in the root, as after a catheter change
      if (!r) return s.physicsOn ? recompute({ ...s, physicsOn: false, _physPressure: null, controls: initialControls() }) : {};
      if (s.finished) return {};
      const c = r.controls;
      const controls: ControlState = {
        ...s.controls,
        ...c,
        // the hub is where the hands put it: commanded and delivered agree, the legacy springs are at rest
        cmdInsertion: c.insertion ?? s.controls.cmdInsertion,
        cmdTorque: c.torque ?? s.controls.cmdTorque,
        vInsertion: 0,
        vTorque: 0,
      };
      const wasOverPush = s.controls.forwardPressure > 3;
      let next = recompute({ ...s, physicsOn: true, tip: r.tip, engagement: r.engagement, controls, _physPressure: r.pressure ?? null });
      // the over-push warning of the legacy dynamics, from the rod's hub load
      if (!wasOverPush && controls.forwardPressure > 3 && !next.engagement.isSelective) {
        next = {
          ...next,
          events: [
            ...next.events,
            {
              t: wallT(next),
              code: "too-much-pushing",
              message: TOO_MUCH_PUSHING_MESSAGE,
              context: next.caseData.name,
            },
          ],
        };
      }
      return r.moving ? { ...next, aspirated: "unknown" } : next;
    }),

  setLeftHeartTask: (task) => set((s) => (s.leftHeartTask === task ? {} : { leftHeartTask: task })),

  setEnginePressure: (p) =>
    set((s) => {
      if (s._enginePressure === p) return {};
      const same = (a: PressureState | null, b: PressureState | null) => !!a && !!b && a.kind === b.kind && a.systolic === b.systolic && a.diastolic === b.diastolic && a.quality === b.quality && a.label === b.label;
      if (same(s._enginePressure, p)) return {};
      if (s.finished) return { _enginePressure: p };
      // only the pressure moves: the tip and the engagement stay as they are (a host may have set them)
      const cath = catheterById(s.catheterId);
      const pressure0 = (s.physicsOn && s._physPressure) || p || (cath ? computePressure(s.engagement, s.tip, s.controls, cath) : s.pressure);
      const pressure = s.dissection ? dissectedPressure(pressure0) : pressure0;
      const prev = s._prevPressure;
      // a session handing back (null) restores the legacy class without scoring the hand-over
      if (p === null || !(isDeepDamp(pressure) && !(prev && isDeepDamp(prev)))) return { _enginePressure: p, pressure, _prevPressure: pressure };
      const score = computeScores({ ...s.score, dampedEvents: s.score.dampedEvents + 1, fluoroTime: s.fluoroTime }, s.targets);
      return {
        _enginePressure: p,
        pressure,
        _prevPressure: pressure,
        score,
        events: [...s.events, { t: wallT(s), code: "deep-engagement" as const, message: DEEP_DAMP_MESSAGE, context: s.caseData.name }],
      };
    }),

  finishCase: () => {
    const s = get();
    if (s.finished) return;
    const score = computeScores({ ...s.score, fluoroTime: s.fluoroTime }, s.targets);
    const coach = coachCase(s.events, score);
    const passed = casePassed(score, s.targets);
    const mistakes = uniqueMistakes(s.events);
    const attempt: CaseAttempt = {
      id: uid(),
      caseId: s.caseData.id,
      caseName: s.caseData.name,
      timestamp: Date.now(),
      mode: s.mode,
      score,
      mistakes,
      passed,
    };
    const prog = useProgressStore.getState();
    prog.recordAttempt(attempt);
    if (mistakes.length) prog.addMistakes(mistakes, s.caseData.name);
    // training time is the wall time of the case, not fluoroscopy seconds (S11 step 1b)
    prog.addTrainingTime(Math.round(Math.max(0, nowS() - s.sessionStart)));
    set({ finished: true, finishing: false, coach, score });
  },

  beginFinish: () => set((s) => (s.finished || s.finishing ? {} : { finishing: true })),

  cancelFinish: () => set((s) => (s.finishing ? { finishing: false } : {})),

  submitStudyReport: (r) => {
    if (get().finished) return;
    set({ studyReport: r, finishing: false });
    get().finishCase();
  },
}));

// Development aid: inspect the live simulator state from the browser console.
if (typeof window !== "undefined" && (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) {
  (window as unknown as { __sim: typeof useSimulatorStore }).__sim = useSimulatorStore;
}
