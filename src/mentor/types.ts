// ---------------------------------------------------------------------------
// Mentor-layer contracts: assessment modes, entrustment, the recorded
// procedure (frames, events, commands, snapshots), the replay host, and the
// attending's utterances. Shared session contracts (HandCommand, PedalState,
// SyringeCommand, Snapshotable, TelemetryEvent) come from
// src/simulation/session/types.ts and are re-used, not redefined.
// ---------------------------------------------------------------------------

import type { CArm, EngagementKind, MistakeCode, PressureKind } from "../types";
import type { DeviceSlot, HandCommand, PedalState, Snapshotable, SyringeCommand, TelemetryEvent } from "../simulation/session/types";

// --- Modes and entrustment ---------------------------------------------------

/**
 * How much help the learner gets.
 * - guided: the attending talks early and blocks unsafe actions
 * - supervised: the attending waits, asks, then cues; time-out required before the beam
 * - independent: safety only, unless the learner asks
 * - exam: silent except safety stops (logged as critical errors); time-out required
 */
export type AssessmentMode = "guided" | "supervised" | "independent" | "exam";

/**
 * Entrustment level for the EPA being practised, 1..5, read as a supervision scale:
 * 1 observe only, 2 do with the attending's hands-on help, 3 do with the attending in the room,
 * 4 do with the attending available, 5 may supervise others. The mapping onto EAPCI levels is
 * left to the competency layer; the mentor only uses the number to fade its help.
 */
export type EntrustmentLevel = 1 | 2 | 3 | 4 | 5;

export type Lab = "diagnostic" | "pci";

// --- Telemetry ---------------------------------------------------------------

/** Engagement classes in a fixed order, so they can be stored as small integers. */
export const ENGAGEMENT_KINDS: EngagementKind[] = [
  "not-in-root",
  "ascending-aorta",
  "sinus-level",
  "below-valve",
  "in-lv",
  "near-lm",
  "coaxial-lm",
  "selective-lm",
  "deep-lm",
  "near-rca",
  "coaxial-rca",
  "selective-rca",
  "deep-rca",
  "non-selective",
  "dangerous",
];

export const PRESSURE_KINDS: PressureKind[] = ["aortic", "lv", "damped", "ventricularised", "wedged", "noisy", "dissected"];

/** Pressure classes that mean "do not inject here". */
export const DAMPED_KINDS: PressureKind[] = ["damped", "ventricularised", "wedged", "dissected"];

/** Beam state: 0 off, 1 fluoroscopy, 2 cine. */
export type BeamCode = 0 | 1 | 2;

/** One 10 Hz sample of the procedure. Units: mm, rad, degrees for the C-arm, mL, mGy, Gy·cm². */
export interface FrameSample {
  /** wall-clock seconds since the session started */
  tWall: number;
  /** patient-clock seconds */
  tPatient: number;
  /** accumulated fluoroscopy plus cine beam-on time (s) */
  tFluoro: number;
  /** simulation step index at which the sample was taken (for replay alignment) */
  step: number;
  cmdInsertion: number;
  insertion: number;
  cmdTorque: number;
  torque: number;
  wireInsertion: number;
  /** tip position (mm, world frame of the sim that recorded it) */
  tipX: number;
  tipY: number;
  tipZ: number;
  /** tip height above the valve plane (mm) */
  tipHeight: number;
  /** tip azimuth (rad) */
  tipAz: number;
  /** depth past the ostium along its axis (mm, positive = inside) */
  depth: number;
  /** index into ENGAGEMENT_KINDS */
  eng: number;
  /** index into PRESSURE_KINDS */
  press: number;
  sys: number;
  dia: number;
  /** felt resistance 0..1 */
  resistance: number;
  laoRao: number;
  cranCaud: number;
  /** detector field (cm) */
  field: number;
  /** pulse rate (pulses/s) */
  pps: number;
  beam: BeamCode;
  /** syringe force 0..1 (contrast), negative = aspirating */
  syringe: number;
  /** cumulative contrast (mL) */
  contrastMl: number;
  /** cumulative air kerma at the reference point (mGy) */
  karMGy: number;
  /** cumulative kerma-area product (Gy·cm²) */
  kapGyCm2: number;
  hr: number;
  /** PCI: wire tip along its route (mm from the ostium) */
  wireTipMm: number;
  /** PCI: device centre along the route (mm), NaN when none */
  deviceMm: number;
}

export type FrameKey = keyof FrameSample;

/** A telemetry event with its replay alignment. */
export interface RecordedEvent extends TelemetryEvent {
  /** simulation step index at which it happened */
  step: number;
  /** number of commands applied when it happened (including the one that caused it) */
  cmd: number;
  /** emitted outside the replay host (UI, mentor, plan): not reproduced by replay */
  ext?: boolean;
}

/**
 * Event kinds the mentor understands, with their data fields.
 * Other streams may emit their own namespaced kinds (e.g. "dose.cine-run"); they are kept.
 *
 * case-start   { caseId, lab, mode, entrustment }
 * case-end     { reason }
 * engagement   { from, to, side? }                       engagement class changed
 * pressure     { from, to, sys, dia }                    pressure class changed
 * catheter     { id, side?, previous? }                  catheter loaded / exchanged
 * aspirate     { result: "clean" | "no-return" }
 * pressure-check {}
 * inject       { ml, outcome, pressure, engagement, aspirated, diagnostic, fill?, side?, durationS? }
 * fluoro-on / fluoro-off {}
 * cine-start   { laoRao, cranCaud, side? }
 * cine-end     { laoRao, cranCaud, side?, durationS, injectStartS?, peakS?, filledVessels? }
 * view         { laoRao, cranCaud, preset? }             C-arm moved to a new rest position
 * hint         { level, ruleId? }
 * mentor       { ruleId, level, text, severity, blocking, critical }
 * complication { kind: "dissection" | "air-embolism" | "vf" | "perforation" | "slow-flow" | ..., grade? }
 * mistake      { code }                                  a mistake raised live by the sim
 * whip         { magnitude }
 * wire-branch  { branch, onRoute, septal }               PCI wire entered a branch
 * device       { action: "load" | "move" | "remove", kind, diameter, lengthMm, centreMm, beyondWire? }
 * inflate      { kind, diameter, atm, localRefMm, inLesion, inStent, fromMm, toMm }
 * deploy       { diameter, lengthMm, fromMm, toMm }      stent deployed
 * lesion-estimate { refMm, mldMm, lengthMm, truth: { refMm, mldMm, lengthMm } }
 * heparin      { unitsPerKg }
 * act          { seconds }
 * timeout      { done, items }
 * plan         { plan }
 * report       { report }
 * bailout      { action }                                e.g. "balloon-tamponade", "pericardiocentesis"
 */
export type MentorEventKind =
  | "case-start"
  | "case-end"
  | "engagement"
  | "pressure"
  | "catheter"
  | "aspirate"
  | "pressure-check"
  | "inject"
  | "fluoro-on"
  | "fluoro-off"
  | "cine-start"
  | "cine-end"
  | "view"
  | "hint"
  | "mentor"
  | "complication"
  | "mistake"
  | "whip"
  | "wire-branch"
  | "device"
  | "inflate"
  | "deploy"
  | "lesion-estimate"
  | "heparin"
  | "act"
  | "timeout"
  | "plan"
  | "report"
  | "bailout";

// --- Commands and the replay host ----------------------------------------------

/** Everything the operator can do that changes the simulation, as a replayable command. */
export type HostCommand =
  | HandCommand
  | { kind: "pedal"; pedal: PedalState }
  | { kind: "syringe"; syringe: SyringeCommand; ml?: number }
  | { kind: "carm"; cArm: CArm }
  | { kind: "imaging"; field?: number; pps?: number }
  | { kind: "device"; slot: DeviceSlot; id: string }
  | { kind: "action"; name: string; data?: Record<string, unknown> };

/** An event emitted by a host, before the session stamps its times. */
export interface HostEvent {
  kind: string;
  data?: Record<string, unknown>;
}

/**
 * A deterministic simulation that can be recorded and replayed. Given the same
 * initial snapshot, the same command sequence and the same dt sequence, it must
 * produce the same samples and events. The S7 rod worker, S5 transport, S6 dose
 * and S9 patient engine each implement Snapshotable; a composite host bundles them.
 */
export interface ReplayHost<S = unknown> extends Snapshotable<S> {
  apply(cmd: HostCommand): void;
  step(dt: number): void;
  /** current state as a frame sample (tWall and step are filled in by the session) */
  sample(): Omit<FrameSample, "tWall" | "step">;
  /** events since the last call */
  drainEvents(): HostEvent[];
}

/** A host snapshot taken at a decision point or keyframe. */
export interface SnapshotRecord<S = unknown> {
  /** steps completed when the snapshot was taken */
  step: number;
  /** commands applied when the snapshot was taken */
  cmd: number;
  /** events recorded when the snapshot was taken */
  ev: number;
  /** frames recorded when the snapshot was taken */
  frame: number;
  tWall: number;
  tPatient: number;
  reason: string;
  state: S;
}

export interface RecordedCommand {
  /** steps completed when the command was applied */
  step: number;
  tWall: number;
  cmd: HostCommand;
}

export interface RecordingMeta {
  id: string;
  /** epoch ms at start (for ordering stored attempts; never used inside the simulation) */
  startedAt: number;
  caseId: string;
  lab: Lab;
  mode: AssessmentMode;
  entrustment: EntrustmentLevel;
  /** session seed: replay regenerates the case and the patient from it */
  seed: string;
  /** free-form context (catheters acceptable for the case, target ostium azimuths, focus...) */
  context?: Record<string, unknown>;
}

// --- Mentor -------------------------------------------------------------------

/** The escalation ladder. */
export const LADDER = ["silence", "question", "prompt", "hint", "instruction", "take-over"] as const;
export type LadderLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type LadderName = (typeof LADDER)[number];

export type Severity = "safety" | "technique" | "efficiency";

export type Phase = "access" | "engage" | "inject" | "views" | "wire" | "device" | "complication";

/** Where the learner should look. */
export type Anchor = "pressure" | "fluoro" | "hub" | "c-arm" | "syringe" | "monitor" | "plan";

export interface FrameOption {
  id: string;
  /** what the learner might have been thinking, in their words */
  text: string;
  /** the teaching this frame unlocks */
  teaching: string;
  /** a skill-card or drill to schedule when this frame is chosen */
  drill?: MistakeCode;
}

export interface MentorUtterance {
  id: string;
  tWall: number;
  ruleId: string;
  level: LadderLevel;
  text: string;
  anchor: Anchor;
  severity: Severity;
  /** the attending stops the action (the UI must not let it happen) */
  blocking: boolean;
  /** counts as a critical error (always true for a stop in exam mode) */
  critical: boolean;
  /** choices offered with a time-out question */
  frames?: FrameOption[];
}

export type MistakeTally = Partial<Record<MistakeCode, number>>;
