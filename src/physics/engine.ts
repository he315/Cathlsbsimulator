// ---------------------------------------------------------------------------
// Device physics engine: a catheter and a wire as elastic rods in the vessel
// lumens, driven by the hands (HandCommand), stepped at a fixed substep.
//
// Nesting. The wire inside the catheter is treated as a composite: catheter
// joints that contain the wire take the sum of the two bending stiffnesses
// and a stiffness-weighted average of the two rest curvatures (so a wire
// straightens a preformed curve, and a stiff device entering a guide's curve
// opens it). The part of the wire beyond the catheter tip is its own rod,
// clamped at the catheter tip; its lateral reaction loads the catheter tip.
// When the catheter advances over a held wire its tip is railed onto the
// wire's path, so a catheter tracks over the wire. Torque on the wire is
// carried 1:1 inside the catheter (low friction), so the wire's free part is
// clamped with the wire's own hub roll.
//
// Determinism. Fixed substep, fixed iteration count, no randomness, Float64
// state: identical command logs give identical node buffers. snapshot() and
// restore() capture the full state for rewind and replay.
//
// Torque loss and kinking (diag-catheter-kink). Where the access route has a
// tortuous segment (lumen.ts routeTortuosity: the tortuous-iliac and
// tortuous-subclavian variants), every catheter body lying in it loses part of
// its spin about its own axis to the wall at each substep (a torsional brake,
// MP_KINK_BRAKE), so rotation at the hub is stored as twist in the shaft
// proximal to the segment and the tip stops following. A tracker (about 30
// times a second) measures that stored twist, the hub's and the tip's rotation
// and the shaft's curvature. Twist above MP_KINK_TWIST held for MP_KINK_S while
// the tip is still latches a kink at the joint of greatest curvature times twist
// in the segment: a plastic bend added to the joint's rest curvature and a
// weakened joint (it travels with the material), reported as
// DeviceReadout.kink { node, severity }. A 0.035 in wire inside the catheter, a
// long sheath across the segment and a catheter 1 Fr smaller than the sheath
// lower the risk (KinkSetup). The kink is undone by untwisting, by a 0.035 in
// wire passed through it, by pressurising the lumen, with the tip held by a
// snare or an arm cuff, or the catheter is cut and covered with a sheath and
// removed (KinkCommand). Every value is a MODEL PARAMETER: the module text
// (pm-engaging-torque, eq-sheaths-guides, Brilakis 5.4 and 5.7.4.1) gives the
// signs, the prevention and the order of the escalation, not a threshold.
// The model is opt-in (KinkSetup.model, default off, set by a kink-setup
// command): an engine that never turns it on brakes nothing and never kinks,
// so the labs that do not use it keep the engine's defaults.
// ---------------------------------------------------------------------------

import type { AccessRoute, AnatomyVariant } from "../types";
import type { AnatomyModel } from "../simulation/anatomy";
import type { DeviceSlot, HandCommand, HubReaction, Snapshotable } from "../simulation/session/types";
import { Rod } from "./rod";
import { RodWorkspace, solveRodIteration, jointForceOnBody } from "./xpbd";
import { RodContacts, DEFAULT_FRICTION, type FrictionParams, type Rail } from "./contact";
import { LumenSet, Region, queryTube, type CoronaryInput, type CourseFn, type LumenHit, type ValveSetting } from "./lumen";
import { catheterSpec, innerDeviceSpec, wireSpec, freeShape, type DeviceSpec } from "./catheterShapes";
import { qexp, qfromFrame, qmul, qrot } from "./math3";
import { classifyEngagement, type EngagementReading } from "./engagementClassifier";

export interface EngineConfig {
  /** substep rate (Hz) */
  substepHz: number;
  /** direct-solver iterations per substep */
  iterations: number;
  /** lateral drag per unit length (N·s/mm²) — model parameter */
  dragLat: number;
  /** spin drag per unit length (N·mm·s/mm) — model parameter */
  dragSpin: number;
  friction: FrictionParams;
  /** fastest hand advance (mm/s) and rotation (rad/s) — model parameters */
  handSpeed: number;
  handRollSpeed: number;
  /** axial force (N) and torque (N·mm) beyond which the fingers slip on the hub — model parameters */
  gripForce: number;
  gripTorque: number;
  /** trust region per iteration (mm, rad) and its mode (see xpbd.ts) */
  maxMove: number;
  maxRot: number;
  trustRegion: "rod" | "joint";
  /** multiplies every device's segment lengths (bench.ts raises it on slow machines: fewer nodes) */
  segmentScale: number;
}

export const DEFAULT_CONFIG: EngineConfig = {
  substepHz: 120,
  iterations: 2,
  dragLat: 2e-6,
  dragSpin: 2e-7,
  friction: DEFAULT_FRICTION,
  handSpeed: 60,
  handRollSpeed: 2 * Math.PI,
  gripForce: 4,
  gripTorque: 8,
  maxMove: 1.5,
  maxRot: 0.3,
  trustRegion: "rod",
  segmentScale: 1,
};

export interface SceneSpec {
  model: AnatomyModel;
  route: AccessRoute;
  variants?: AnatomyVariant[];
  coronaries?: CoronaryInput[];
  /** initial respiration (0..1) */
  resp?: number;
  /** aortic course provider (default thorax.aorticCourse) */
  aorticCourse?: CourseFn;
  /** include arch branches that are not the access route (default true) */
  archBranches?: boolean;
}

export interface MotionInput {
  /** respiration 0..1 (rebuilds breathing-dependent lumens) */
  resp?: number;
  /** coronary centre lines at this clock time (physics frame) */
  coronaries?: CoronaryInput[];
  /**
   * the aortic valve's opening now (diag-lv-aorta-task, lumen.ts VALVE_OPENING); absent: unchanged. The
   * worker path carries the same setting as lumen.ts valveControlInput in `coronaries`.
   */
  valve?: ValveSetting | null;
}

interface Device {
  slot: DeviceSlot;
  spec: DeviceSpec;
  rod: Rod;
  ws: RodWorkspace;
  contacts: RodContacts;
  pred: Float64Array;
  start: number;
  pinned: boolean;
  pendingPush: number;
  pendingRoll: number;
  hubRoll: number;
  // reactions
  axial: number;
  torsion: number;
  snap: boolean;
  snapTimer: number;
  prevTip: Float64Array;
  prevTipRoll: number;
  /** time left (s) during which the hand is still advancing this device */
  advancing: number;
  /** a hand holds the hub (a released hub turns and slides back until its stored load is gone) */
  held: boolean;
}

interface Catheter extends Device {
  hubS: number;
  hubQ0: Float64Array;
  baseEI: Float64Array;
  baseRest: Float64Array;
  wireExt: Float64Array; // relaxed wire reaction on the tip body (6)
  compositeDelta: number;
  /** free-shape unit tangents, tip first, one per mm (for the classifier's prolapse rule) */
  restTangents: Float32Array;
  /** torque loss and kinking (diag-catheter-kink) */
  kk: KinkTracker;
}

interface Wire extends Device {
  /** wire length beyond the exit (catheter tip, or the sheath hub when there is no catheter), mm */
  delta: number;
  prevDelta: number;
  /** wire is outside the patient (removed) */
  out: boolean;
}

export interface DeviceReadout {
  slot: DeviceSlot;
  id: string;
  /** centre-line nodes (x,y,z) hub → tip, aortic frame */
  nodes: Float32Array;
  count: number;
  radius: number;
  /** index of the first node inside the patient (past the skin) */
  insideFrom: number;
  reaction: HubReaction;
  /** stored twist between hub and tip (rad, clockwise +) */
  windup: number;
  /** tip position and unit tangent */
  tip: [number, number, number];
  tipDir: [number, number, number];
  /**
   * Wall normal load per node (N), same order and count as `nodes`: node k ≥ 1 carries the load on
   * the segment that ends there (node 0 is 0). For S14 hazards (wall force) and S9 pressure.
   */
  contactForce: Float32Array;
  /** stick-to-slip transitions of this device's wall contacts since it was loaded (cumulative; diff between frames) */
  slipEvents: number;
  /** wall contacts currently stuck (static friction) and sliding */
  stuckContacts: number;
  slidingContacts: number;
  /** the catheter's kink, or null (catheters only; absent on wires and older frames) */
  kink?: KinkReadout | null;
  /**
   * Torque not transmitted (catheters only): over the last MP_TNT_WINDOW_S the hub turned at least
   * MP_TNT_HUB_RAD while the tip turned no more than MP_TNT_TIP_FRACTION of it.
   */
  torqueLoss?: boolean;
  /** twist stored in the shaft up to the distal end of a tortuous segment (rad, the windup's sign); 0 without one */
  storedTwist?: number;
  /** kinks latched and undone since the catheter was loaded, how the last was undone, and the last recovery command's outcome */
  kinkHistory?: KinkHistory;
  /** the kink model's set-up in the engine (catheters only): what a rewind or restore brought back */
  kinkSetup?: KinkSetup;
}

// ---------------------------------------------------------------------------
// Torque loss and kinking (diag-catheter-kink): read-outs, set-up and commands
// ---------------------------------------------------------------------------

/** How the tip of a kinked catheter is held while it is untwisted: a snare from a second access, or a cuff on the upper arm. */
export type KinkHold = "snare" | "cuff";

/** A latched kink, as the read-out reports it. */
export interface KinkReadout {
  /** index in DeviceReadout.nodes of the node at the kink (the joint between two bodies) */
  node: number;
  /** 0..1: how tightly the shaft is folded (1: the lumen closed) */
  severity: number;
  /** material distance of the kink from the catheter tip (mm) */
  u: number;
  /** lumen region code (lumen.ts Region) the kinked segment lies in */
  region: number;
  /** position of the kink (aortic frame, mm) */
  pos: [number, number, number];
  /** the tip is held by a snare or an arm cuff */
  held: KinkHold | null;
  /** the hub has been cut and a sheath advanced over the kinked part */
  sheathed: boolean;
}

export interface KinkHistory {
  latched: number;
  resolved: number;
  /** what undid the last kink */
  lastResolvedBy: KinkResolution | null;
  /** the last recovery command and what it did (seq counts the commands) */
  lastAction: { action: KinkRecoveryAction; outcome: KinkOutcome; seq: number } | null;
}

/** What undoes a kink. */
export type KinkResolution = "untwist" | "wire" | "pressurise";

/** The recovery commands the engine carries out (untwisting and passing the wire are hand commands). */
export type KinkRecoveryAction = "snare" | "cuff" | "pressurise" | "cut-sheath" | "release";

/** What a recovery command did, as the operator would find it. */
export type KinkOutcome = "held" | "not-below-brachial" | "unwound" | "unchanged" | "sheathed" | "released" | "no-catheter";

/**
 * The prevention measures in place: the sheath's length inside the body (mm, from the skin) and a
 * catheter 1 Fr smaller than the sheath; and whether the kink model runs at all (`model`, off by
 * default: the shared engine brakes and kinks nothing until a lab turns it on).
 */
export interface KinkSetup {
  sheathMm: number;
  undersized: boolean;
  model: boolean;
}

/**
 * Engine commands of the kink model, sent through the same channel as the hand commands (the worker
 * forwards every command to PhysicsEngine.command).
 */
export type KinkCommand =
  | { kind: "kink-setup"; setup: Partial<KinkSetup> }
  | { kind: "kink-recover"; action: KinkRecoveryAction }
  /** latch a kink at material point u (mm from the tip): a scenario's start state */
  | { kind: "kink-latch"; u: number; severity: number; sign?: number };

/** Whether a command is one of the kink model's (not a hand command). */
export function isKinkCommand(c: { kind: string }): c is KinkCommand {
  return c.kind === "kink-setup" || c.kind === "kink-recover" || c.kind === "kink-latch";
}

/**
 * The usual sheath length, 10 cm (eq-sheaths-guides: "10 cm is the usual length", Brilakis 30.1.3),
 * taken as its length inside the body; the long sheaths of the same module are 25 and 45 cm.
 */
export const DEFAULT_SHEATH_MM = 100;
export const LONG_SHEATH_MM = [250, 450] as const;

/** The engine's kink set-up until a kink-setup command changes it: the usual sheath, the model off. */
export const DEFAULT_KINK_SETUP: Readonly<KinkSetup> = { sheathMm: DEFAULT_SHEATH_MM, undersized: false, model: false };

/**
 * Extra drag on a body's spin about its own axis in a fully tortuous segment (lumen.ts tortuosityAt
 * 1), as a multiple of the blood's (the body's axial rotational mobility is divided by 1 + this):
 * the wall at every bend of the segment resists the shaft's turning, inside the same solve as the
 * rod's elasticity. MODEL PARAMETER, chosen so that three one-way turns at the hub store enough
 * twist to kink a catheter in the tortuous-iliac geometry in most starts.
 */
export const MP_KINK_BRAKE = 1e6;
/**
 * Factor on the brake with a 0.035 in wire inside the catheter across the body (it stiffens the shaft
 * and carries the turn). MODEL PARAMETER. The brake acts through the ratio of the body's mobility to
 * the joints' torsional compliance, so its effect changes over orders of magnitude of MP_KINK_BRAKE:
 * at 1e6 a braked body barely turns within a substep, at 1e4 it turns almost freely.
 */
export const MP_KINK_WIRE_BRAKE = 0.02;
/** Factor on the brake with a catheter 1 Fr smaller than the sheath (less of the turn is lost along the sheath and the shaft). MODEL PARAMETER. */
export const MP_KINK_UNDERSIZE_BRAKE = 0.2;
/**
 * Twist stored in the shaft up to the distal end of the tortuous segment above which, held for
 * MP_KINK_S with the tip still, the shaft kinks (rad). MODEL PARAMETER (below the twist at which the
 * fingers slip on the hub, DEFAULT_CONFIG.gripTorque over the shaft's torsional stiffness).
 */
export const MP_KINK_TWIST = 1.3;
/** Factor on MP_KINK_TWIST with a 0.035 in wire inside across the segment. MODEL PARAMETER. */
export const MP_KINK_WIRE_TWIST = 1.6;
/**
 * Greatest severity of a kink with a 0.035 in wire inside the catheter across it: the wire splints the
 * lumen, so the shaft folds round it but cannot close on it. A kink that forms over the wire is
 * therefore mild (at or below MP_KINK_UNTWIST_MAX and MP_KINK_WIRE_PASS_MAX: untwisting, or drawing the
 * wire back and passing it again, undoes it), and its severity is read against the wire-raised
 * threshold (the stored twist over MP_KINK_WIRE_TWIST). MODEL PARAMETER.
 */
export const MP_KINK_WIRE_SEVERITY_MAX = 0.45;
/** Seconds the stored twist must stay above MP_KINK_TWIST with the tip still before the kink latches. MODEL PARAMETER. */
export const MP_KINK_S = 0.8;
/**
 * The hand must still be turning the hub the same way as the stored twist, throughout MP_KINK_S: at
 * least MP_KINK_TURNING_RAD over each last MP_KINK_TURNING_S. A hub held still with twist in the shaft
 * (after untwisting, say) does not fold it. MODEL PARAMETERS.
 */
export const MP_KINK_TURNING_RAD = 0.05;
export const MP_KINK_TURNING_S = 0.3;
/**
 * The tip counts as not following the hub while its spin rate, averaged over MP_KINK_TIP_TAU_S, is
 * below this (rad/s; three turns in 6 s turn the hub at π rad/s, and through a free shaft the tip
 * follows at about that rate). MODEL PARAMETERS.
 */
export const MP_KINK_TIP_STILL = 1.2;
export const MP_KINK_TIP_TAU_S = 0.5;
/** Stored twist at which a kink is fully closed (severity 1, rad). MODEL PARAMETER. */
export const MP_KINK_SEVERE_TWIST = 3.4;
/** Severity of a kink as it latches, at least (0..1). MODEL PARAMETER. */
export const MP_KINK_MIN_SEVERITY = 0.3;
/** Plastic bend added to the kinked joint's rest curvature at severity 1 (rad). MODEL PARAMETER. */
export const MP_KINK_BEND_RAD = 0.6;
/** Bending stiffness left in the kinked joint (fraction). MODEL PARAMETER. */
export const MP_KINK_EI_FACTOR = 0.4;
/**
 * Untwisting: the hub turned back at least this far against the kinking direction (rad) with the twist
 * stored in that direction taken out of the shaft (none left up to the segment's end). MODEL PARAMETER.
 */
export const MP_KINK_UNTWIST_RAD = 0.5;
/** Untwisting undoes a kink up to this severity without the tip held (with a snare or a cuff, any). MODEL PARAMETER. */
export const MP_KINK_UNTWIST_MAX = 0.6;
/** A 0.035 in wire passes and straightens a kink up to this severity; beyond it the wire stops at the kink. MODEL PARAMETER. */
export const MP_KINK_WIRE_PASS_MAX = 0.75;
/** Pressurising the lumen (the module text's 3-4 atm with an inflation device) unwinds a kink up to this severity. MODEL PARAMETER. */
export const MP_KINK_PRESSURISE_MAX = 0.9;
/** The tip's rotation is read from the shaft body this far from the tip (mm), proximal to the preformed curve. MODEL PARAMETER. */
export const MP_KINK_REF_U = 150;
/** Torque not transmitted: window (s), least hub rotation in it (rad), and the largest tip rotation as a fraction of the hub's. MODEL PARAMETERS (the plan's 2 s). */
export const MP_TNT_WINDOW_S = 2;
export const MP_TNT_HUB_RAD = Math.PI / 2;
export const MP_TNT_TIP_FRACTION = 0.25;
/** The kink tracker runs every this many substeps. */
export const MP_KINK_TRACK_SUBSTEPS = 4;

interface KinkState {
  /** the kinked joint (between bodies joint and joint + 1) */
  joint: number;
  u: number;
  severity: number;
  /** sign of the stored twist that made it (the direction the hub was turned) */
  sign: number;
  hubAtLatch: number;
  t: number;
  /** unit direction of the plastic bend (rotation vector, local frame of the proximal body) */
  dirX: number;
  dirY: number;
  origRest: [number, number, number];
  origEI: number;
  /** 0 not held, 1 snare, 2 cuff */
  held: number;
  sheathed: boolean;
  /** a 0.035 in wire already lay across the kinked joint (passing it again is what straightens it) */
  wireAcross: boolean;
}

interface KinkTracker {
  /** brake weight per body (0..1, before the modifiers) */
  w: Float64Array;
  /** each body's axial rotational mobility without the brake (Rod.ia at load) */
  baseIa: Float64Array;
  /** the body the tip's rotation is read from */
  ref: number;
  refQ: Float64Array;
  /** cumulative spin of the reference body (rad) */
  tipSpin: number;
  /**
   * (t, hub roll, tip spin, hand roll) quadruples over the last MP_TNT_WINDOW_S: a fixed ring buffer
   * of histCap entries, the oldest at histHead (no allocation in the stepping path)
   */
  hist: Float64Array;
  histCap: number;
  histHead: number;
  histCount: number;
  /** cumulative rotation the hand has applied to the hub, including turns its fingers slipped on (rad) */
  handRoll: number;
  overSince: number | null;
  stored: number;
  tipRate: number;
  torqueLoss: boolean;
  kink: KinkState | null;
  latched: number;
  resolved: number;
  lastResolvedBy: KinkResolution | null;
  lastAction: KinkHistory["lastAction"];
  seq: number;
  counter: number;
}

/** Ring-buffer entries the tracker needs at substep h: every tracker tick over the longer of its two windows, and a margin. */
function kinkHistCap(h: number): number {
  return Math.ceil(Math.max(MP_TNT_WINDOW_S, MP_KINK_TURNING_S) / (MP_KINK_TRACK_SUBSTEPS * h)) + 2;
}

/** Offset in kk.hist of the i-th oldest entry. */
function histOff(kk: KinkTracker, i: number): number {
  return ((kk.histHead + i) % kk.histCap) * 4;
}

function histPush(kk: KinkTracker, t: number, hub: number, tip: number, hand: number): void {
  if (kk.histCount === kk.histCap) {
    kk.histHead = (kk.histHead + 1) % kk.histCap;
    kk.histCount--;
  }
  const o = histOff(kk, kk.histCount);
  kk.hist[o] = t;
  kk.hist[o + 1] = hub;
  kk.hist[o + 2] = tip;
  kk.hist[o + 3] = hand;
  kk.histCount++;
}

function newKinkTracker(rod: Rod, h: number): KinkTracker {
  const cap = kinkHistCap(h);
  let ref = rod.n - 1;
  let best = Infinity;
  for (let i = 0; i < rod.n; i++) {
    const d = Math.abs(rod.u[i] - MP_KINK_REF_U);
    if (d < best) {
      best = d;
      ref = i;
    }
  }
  return {
    w: new Float64Array(rod.n),
    baseIa: Float64Array.from(rod.ia),
    ref,
    refQ: Float64Array.from(rod.quat.subarray(4 * ref, 4 * ref + 4)),
    tipSpin: 0,
    hist: new Float64Array(4 * cap),
    histCap: cap,
    histHead: 0,
    histCount: 0,
    handRoll: 0,
    overSince: null,
    stored: 0,
    tipRate: 0,
    torqueLoss: false,
    kink: null,
    latched: 0,
    resolved: 0,
    lastResolvedBy: null,
    lastAction: null,
    seq: 0,
    counter: 0,
  };
}

const kq = new Float64Array(16);
/** joint-state and end-point scratch of the kink tracker and read-out (no allocation in the stepping path) */
const kjs = new Float64Array(3);
const kpos = new Float64Array(3);

/** Spin (rad) about the local z axis carrying orientation a to orientation b (quaternions [x, y, z, w]). */
function spinBetween(a: ArrayLike<number>, ao: number, b: ArrayLike<number>, bo: number): number {
  kq[0] = -a[ao]; kq[1] = -a[ao + 1]; kq[2] = -a[ao + 2]; kq[3] = a[ao + 3];
  qmul(kq, 0, b, bo, kq, 4);
  const sg = kq[7] < 0 ? -1 : 1;
  return 2 * Math.atan2(sg * kq[6], Math.abs(kq[7]));
}

/** Twist (rad, the windup's sign) and the bend vector (rad, local frame of body k) of joint k now. */
function jointState(rod: Rod, k: number, out: Float64Array): void {
  const qa = 4 * k, qb = 4 * (k + 1), r = 4 * k;
  kq[0] = -rod.restQ[r]; kq[1] = -rod.restQ[r + 1]; kq[2] = -rod.restQ[r + 2]; kq[3] = rod.restQ[r + 3];
  kq[4] = -rod.quat[qa]; kq[5] = -rod.quat[qa + 1]; kq[6] = -rod.quat[qa + 2]; kq[7] = rod.quat[qa + 3];
  qmul(kq, 4, rod.quat, qb, kq, 12); // relative rotation a -> b
  const sb = kq[15] < 0 ? -1 : 1;
  out[1] = 2 * sb * kq[12];
  out[2] = 2 * sb * kq[13];
  qmul(kq, 0, kq, 12, kq, 8); // deviation from rest
  const st = kq[11] < 0 ? -1 : 1;
  out[0] = -2 * st * kq[10];
}

export interface EngineSnapshot {
  t: number;
  steps: number;
  tAcc: number;
  resp: number;
  devices: {
    slot: DeviceSlot;
    specId: string;
    arrays: Record<string, Float64Array | Uint8Array | Int16Array | Int32Array>;
    scalars: Record<string, number | boolean>;
  }[];
  /** which device each hand holds and whether grip commands have been given (hand state) */
  hands?: { left: DeviceSlot | null; right: DeviceSlot | null };
  explicitGrip?: boolean;
  /** coronary lumens as last moved by step(motion) */
  coronaries?: { vessel: string; pts: Float64Array; rad: Float64Array; offsetMm: number }[];
  /** the kink prevention measures (diag-catheter-kink); absent in older snapshots */
  kinkSetup?: KinkSetup;
}

/** Damping risk above which the catheter counts as wedged (model parameter). */
export const WEDGED_RISK = 0.6;

const tmp6 = new Float64Array(6);
const tmp4 = new Float64Array(8);
const tmp3 = new Float64Array(6);
// per-substep scratch (no allocation in the stepping path)
const exitBuf = new Float64Array(6);
const sheathBuf = new Float64Array(6);
const wirePtBuf = new Float64Array(6);
const refQ = new Float64Array(4);
const tA = new Float64Array(3);
const tB = new Float64Array(3);

export class PhysicsEngine implements Snapshotable<EngineSnapshot> {
  readonly config: EngineConfig;
  readonly lumens: LumenSet;
  readonly scene: SceneSpec;
  /** patient clock time (s) of the current state */
  t = 0;
  steps = 0;
  private tAcc = 0;
  private resp = 0;
  catheter: Catheter | null = null;
  wire: Wire | null = null;
  /** the kink prevention measures in place (diag-catheter-kink) */
  kinkSetup: KinkSetup = { ...DEFAULT_KINK_SETUP };
  readonly h: number;
  private hit: LumenHit = { slack: 0, nx: 0, ny: 0, nz: 0, region: 0, lumen: 0, s: 0, floor: false };
  private rail: Rail = { body: 0, px: 0, py: 0, pz: 0, tx: 0, ty: 1, tz: 0 };
  private solveOpt: { h: number; maxMove: number; maxRot: number; trust: "rod" | "joint" } = { h: 0, maxMove: 0, maxRot: 0, trust: "rod" };

  /**
   * Extra device length (mm) added outside the patient. The simulated femoral course from the skin
   * to the root (built on thorax.aorticCourse) is about 0.81 m, roughly 10% longer than a typical
   * adult's, so a 1.0 m catheter would run out of hub travel before its curve reaches the root.
   * The extra length lies on the frictionless external line and changes nothing else.
   */
  readonly lengthAllowance: number;

  constructor(scene: SceneSpec, config: Partial<EngineConfig> = {}) {
    this.lengthAllowance = scene.route === "femoral" ? 100 : 0;
    this.config = { ...DEFAULT_CONFIG, ...config, friction: { ...DEFAULT_FRICTION, ...(config.friction ?? {}) } };
    this.h = 1 / this.config.substepHz;
    this.scene = scene;
    this.resp = scene.resp ?? 0;
    const v = scene.variants ?? [];
    this.lumens = new LumenSet({
      route: scene.route,
      model: scene.model,
      resp: this.resp,
      tortuousSubclavian: v.includes("tortuous-subclavian"),
      tortuousIliac: v.includes("tortuous-iliac"),
      coronaries: scene.coronaries,
      aorticCourse: scene.aorticCourse,
      archBranches: scene.archBranches,
    });
  }

  // -------------------------------------------------------------------------
  // Loading devices
  // -------------------------------------------------------------------------

  private makeDevice(slot: DeviceSlot, spec0: DeviceSpec): Device {
    const k = this.config.segmentScale;
    // the arm route bends sharply in narrow arteries (radial, axillary-subclavian turn): shorter shaft segments
    const coarse = this.scene.route === "femoral" ? spec0.segCoarse : Math.min(spec0.segCoarse, 12);
    const spec = k === 1 && coarse === spec0.segCoarse ? spec0 : { ...spec0, segFine: spec0.segFine * k, segCoarse: coarse * k };
    const rod = new Rod(spec, { h: this.h, dragLat: this.config.dragLat, dragSpin: this.config.dragSpin });
    const contacts = new RodContacts(rod.n);
    contacts.crossRadius = this.crossRadius();
    // end-point contacts of long segments: needed on the narrow, sharply bending arm route; the femoral
    // route's lumens are wide compared with the sagitta of its shaft segments (and it saves ~40% time)
    contacts.endContacts = this.scene.route !== "femoral";
    return {
      slot,
      spec,
      rod,
      ws: new RodWorkspace(rod.n),
      contacts,
      pred: new Float64Array(6 * rod.n),
      start: 0,
      pinned: false,
      pendingPush: 0,
      pendingRoll: 0,
      hubRoll: 0,
      axial: 0,
      torsion: 0,
      snap: false,
      snapTimer: 0,
      prevTip: new Float64Array(3),
      prevTipRoll: 0,
      advancing: 0,
      held: true,
    };
  }

  /**
   * Load a catheter with its tip at route arclength `tipS` (default: in the ascending aorta,
   * 60 mm before the root top) and hub roll `roll` (rad).
   */
  loadCatheter(
    idOrSpec: string | DeviceSpec,
    opts: { tipS?: number; roll?: number | "auto"; facing?: [number, number, number]; slot?: DeviceSlot } = {}
  ): void {
    const base = typeof idOrSpec === "string" ? catheterSpec(idOrSpec) : idOrSpec;
    if (typeof idOrSpec !== "string") this.customSpecs.set(base.id, base);
    // the outside-the-patient length only sets how far the hub can travel (see lengthAllowance)
    const spec = { ...base, length: base.length + this.lengthAllowance };
    this.version++;
    const d = this.makeDevice(opts.slot ?? (spec.id === "PIG" ? "pigtail" : "catheter"), spec);
    const L = this.lumens;
    const tipS = opts.tipS ?? L.routeLength - 60;
    const rod = d.rod;
    const access = L.access;
    let roll = typeof opts.roll === "number" ? opts.roll : 0;
    if (opts.roll === "auto") {
      // the roll a preformed curve takes when it has tracked along the route: the one that stores
      // the least bending energy in the distal curve placed along the route centre line
      let best = Infinity;
      for (let k = 0; k < 24; k++) {
        const r = (k / 24) * 2 * Math.PI;
        rod.placeAlong(access.pts, tipS, r);
        const e = distalBendEnergy(rod, 250);
        if (e < best) {
          best = e;
          roll = r;
        }
      }
    }
    if (opts.facing) {
      // the operator presents the curve facing a direction (e.g. the tip towards the patient's left):
      // the roll that turns the distal bending director d1 most towards `facing`
      const f = opts.facing;
      let best = -Infinity;
      const d1 = new Float64Array(3);
      for (let k = 0; k < 72; k++) {
        const r = (k / 72) * 2 * Math.PI;
        rod.placeAlong(access.pts, tipS, r);
        qrot(rod.quat, 4 * (rod.n - 8), 1, 0, 0, d1, 0);
        const sc = d1[0] * f[0] + d1[1] * f[1] + d1[2] * f[2];
        if (sc > best) {
          best = sc;
          roll = r;
        }
      }
    }
    rod.placeAlong(access.pts, tipS, roll);
    rod.kin[0] = 1;
    const c: Catheter = {
      ...d,
      hubS: tipS - (spec.length - rod.len[0]),
      hubQ0: Float64Array.from(rod.quat.subarray(0, 4)),
      baseEI: Float64Array.from(rod.EIj),
      baseRest: Float64Array.from(rod.restRot),
      wireExt: new Float64Array(6),
      compositeDelta: NaN,
      restTangents: restTangentsOf(spec),
      kk: newKinkTracker(rod, this.h),
    };
    c.hubRoll = 0;
    const w = this.wire && !this.wire.out ? this.wire : null;
    let sOldExit = 0;
    if (w) {
      const ex = this.exitPose();
      queryTube(L.access, ex[0], ex[1], ex[2], 0, -1, this.hit);
      sOldExit = this.hit.s;
    }
    this.catheter = c;
    rod.endPoint(rod.n - 1, 1, c.prevTip, 0);
    if (w) {
      // threaded over a wire already in place: the wire keeps its position, only its exit changes
      w.delta -= tipS - sOldExit;
      w.prevDelta = w.delta;
      c.hubRoll = 0;
      w.hubRoll = 0;
      this.updateWireStart(w);
      this.applyComposite(c, w, true);
    }
  }

  removeCatheter(): void {
    this.version++;
    const c = this.catheter, w = this.wire && !this.wire.out ? this.wire : null;
    if (w && c) {
      // the wire keeps its place in space: the part that was inside the catheter, from the
      // catheter tip back to the sheath hub, becomes free wire lying along the catheter's path
      const sh = this.sheathExit();
      const rod = c.rod;
      let ucHub = 0;
      let best = Infinity;
      const p = new Float64Array(3);
      for (let i = 0; i < rod.n; i++) {
        rod.endPoint(i, 1, p, 0);
        const d = Math.hypot(p[0] - sh[0], p[1] - sh[1], p[2] - sh[2]);
        if (d < best) {
          best = d;
          ucHub = rod.u[i] - rod.len[i] / 2;
        }
      }
      const oldDelta = w.delta;
      const newDelta = oldDelta + Math.max(0, ucHub);
      this.placeWireFromCatheter(w, c, Math.max(0, oldDelta), newDelta, oldDelta);
      w.delta = newDelta;
      w.prevDelta = newDelta;
      // the sheath clamp keeps the wire's current roll reference
      w.hubRoll = 0;
    }
    this.catheter = null;
    if (w) this.updateWireStart(w);
  }

  /** Initialise wire bodies with material coordinate in [u0, u1] along the catheter centre line (wire inside it). */
  private placeWireFromCatheter(w: Wire, c: Catheter, u0: number, u1: number, delta: number): void {
    const wr = w.rod, cr = c.rod;
    const t = new Float64Array(3);
    for (let i = 0; i < wr.n; i++) {
      const u = wr.u[i];
      if (u < u0 || u > u1) continue;
      const uc = u - delta;
      let j = cr.n - 1;
      while (j > 0 && cr.u[j] + cr.len[j] / 2 < uc) j--;
      cr.tangent(j, t, 0);
      const off = cr.u[j] - uc;
      wr.pos[3 * i] = cr.pos[3 * j] + t[0] * off;
      wr.pos[3 * i + 1] = cr.pos[3 * j + 1] + t[1] * off;
      wr.pos[3 * i + 2] = cr.pos[3 * j + 2] + t[2] * off;
      wr.quat.set(cr.quat.subarray(4 * j, 4 * j + 4), 4 * i);
    }
    wr.prevPos.set(wr.pos);
    wr.prevQuat.set(wr.quat);
  }

  /** Load a wire with `advance` mm beyond the catheter tip (or beyond the sheath hub when no catheter); negative = inside the catheter. */
  loadWire(idOrSpec: string | DeviceSpec, opts: { advance?: number; slot?: DeviceSlot } = {}): void {
    const spec = typeof idOrSpec === "string" ? wireSpec(idOrSpec) : idOrSpec;
    if (typeof idOrSpec !== "string") this.customSpecs.set(spec.id, spec);
    this.version++;
    const slot = opts.slot ?? (spec.inches < 0.02 ? "wire014" : "wire035");
    const d = this.makeDevice(slot, spec);
    const w: Wire = { ...d, delta: opts.advance ?? -5, prevDelta: opts.advance ?? -5, out: false };
    this.wire = w;
    this.attachWire(w);
  }

  removeWire(): void {
    this.version++;
    this.wire = null;
    if (this.catheter) this.applyComposite(this.catheter, null, true);
  }

  /** Place the wire's free part along the route ahead of the current exit. */
  private attachWire(w: Wire): void {
    const ex = this.exitPose();
    // route arclength of the exit point
    queryTube(this.lumens.access, ex[0], ex[1], ex[2], 0, -1, this.hit);
    const sExit = this.hit.s;
    w.rod.placeAlong(this.lumens.access.pts, sExit + Math.max(0, w.delta), 0);
    w.contacts.resetHints();
    this.updateWireStart(w);
    if (this.catheter) this.applyComposite(this.catheter, w, true);
  }

  // -------------------------------------------------------------------------
  // Hands
  // -------------------------------------------------------------------------

  /** Queue a hand command; it is applied at the next substeps, rate-limited by hand speed. */
  command(cmd: HandCommand | KinkCommand): void {
    if (isKinkCommand(cmd)) {
      if (cmd.kind === "kink-setup") this.setKinkSetup(cmd.setup);
      else if (cmd.kind === "kink-recover") this.kinkRecover(cmd.action);
      else this.latchKinkAt(cmd.u, cmd.severity, cmd.sign ?? 1);
      return;
    }
    if (cmd.kind === "grip") {
      this.hands[cmd.hand] = cmd.device;
      this.explicitGrip = true;
      this.updateHeld();
      return;
    }
    if (cmd.kind === "regrip") return;
    const dev = this.deviceFor(cmd.device);
    if (!dev) return;
    if (cmd.kind === "push") dev.pendingPush += cmd.mm;
    else if (cmd.kind === "torque") dev.pendingRoll += cmd.rad;
    else if (cmd.kind === "pin") dev.pinned = cmd.on;
    // moving or pinning a device means a hand is on it
    if (!dev.held) {
      dev.held = true;
      if (this.explicitGrip && this.hands.left !== dev.slot && this.hands.right !== dev.slot) this.hands.right = dev.slot;
    }
  }

  /** which device each hand holds (only used once a grip command has been given) */
  private hands: { left: DeviceSlot | null; right: DeviceSlot | null } = { left: null, right: null };
  private explicitGrip = false;

  private updateHeld(): void {
    for (const d of [this.catheter, this.wire]) {
      if (!d) continue;
      const slots: DeviceSlot[] = d === this.catheter ? ["catheter", "pigtail", d.slot] : ["wire035", "wire014", "balloon", "stent", d.slot];
      d.held = !this.explicitGrip || slots.includes(this.hands.left as DeviceSlot) || slots.includes(this.hands.right as DeviceSlot);
    }
  }

  private deviceFor(slot: DeviceSlot | null): Device | null {
    if (!slot) return null;
    if (this.catheter && (slot === "catheter" || slot === "pigtail" || slot === this.catheter.slot)) return this.catheter;
    if (this.wire && (slot === "wire035" || slot === "wire014" || slot === "balloon" || slot === "stent" || slot === this.wire.slot)) return this.wire;
    return null;
  }

  private applyHands(): void {
    const h = this.h, cfg = this.config;
    const c = this.catheter, w = this.wire;
    if (c) {
      // the hand moves at most handSpeed; the fingers slip when the hub resists harder than the grip
      let ds = clampAbs(c.pendingPush, cfg.handSpeed * h);
      c.pendingPush -= ds;
      if (ds > 0 && c.axial > cfg.gripForce) ds = 0;
      if (ds < 0 && c.axial < -cfg.gripForce) ds = 0;
      if (c.pinned) ds = 0;
      // a kink pulled back stops at the sheath tip, unless the catheter has been cut and covered with a sheath
      const kink = c.kk.kink;
      if (kink && !kink.sheathed && ds < 0) {
        const sKink = this.routeS(c, kink.u);
        const sTip = this.lumens.skinS + this.kinkSetup.sheathMm;
        ds = Math.max(ds, Math.min(0, sTip - sKink));
      }
      const maxHub = this.lumens.skinS - 25 - c.rod.len[0];
      const newHub = Math.min(maxHub, c.hubS + ds);
      ds = newHub - c.hubS;
      c.hubS = newHub;
      let dr = clampAbs(c.pendingRoll, cfg.handRollSpeed * h);
      c.pendingRoll -= dr;
      c.kk.handRoll += dr; // what the hand turns, whether or not the hub follows (diag-catheter-kink)
      if (dr > 0 && c.torsion > cfg.gripTorque) dr = 0;
      if (dr < 0 && c.torsion < -cfg.gripTorque) dr = 0;
      if (c.pinned) dr = 0;
      c.hubRoll += dr;
      if (!c.held) {
        // released hub: it turns back and slides out until the stored twist and compression are gone
        // (model parameters: 1.5 rad/s per N·mm of torque, 20 mm/s per N of axial load)
        const spin = clampAbs(-c.torsion * 1.5 * h, cfg.handRollSpeed * h);
        const slide = clampAbs(-c.axial * 20 * h, cfg.handSpeed * h);
        c.hubRoll += spin;
        c.hubS = Math.min(maxHub, c.hubS + slide);
        dr += spin;
        ds += slide;
      }
      if (w && !w.out) {
        if (w.pinned) w.delta -= ds; // the catheter slides over a held wire
        else w.hubRoll += dr; // an unheld wire turns with the catheter
      }
    }
    if (w && !w.out) {
      let ds = clampAbs(w.pendingPush, cfg.handSpeed * h);
      w.pendingPush -= ds;
      // the hand is pushing (even when its fingers slip on a device that has stopped): the device
      // stays in compression while it does, and for 0.3 s after (model parameter)
      w.advancing = ds > 0 ? 0.3 : Math.max(0, w.advancing - h);
      if (ds > 0 && w.axial > cfg.gripForce) ds = 0;
      if (ds < 0 && w.axial < -cfg.gripForce) ds = 0;
      if (w.pinned && !c) ds = 0;
      // a 0.035 in wire stops at a kink too tight for it to pass (diag-catheter-kink)
      const kink = c?.kk.kink;
      if (kink && ds > 0 && kink.severity > MP_KINK_WIRE_PASS_MAX && w.delta <= -kink.u) ds = Math.min(ds, Math.max(0, -kink.u - 1 - w.delta));
      w.delta += ds;
      const dr = clampAbs(w.pendingRoll, cfg.handRollSpeed * h);
      w.pendingRoll -= dr;
      w.hubRoll += dr;
      const catLen = c ? c.spec.length : 0;
      w.delta = Math.min(w.spec.length - catLen - 30, w.delta);
      if (w.delta < -(catLen - 10)) w.out = true; // pulled out through the catheter hub
    }
  }

  // -------------------------------------------------------------------------
  // Stepping
  // -------------------------------------------------------------------------

  /** Advance patient time by dt (s) with fixed substeps. Returns the number of substeps run. */
  step(dt: number, motion?: MotionInput): number {
    this.version++;
    if (motion?.resp !== undefined && Math.abs(motion.resp - this.resp) > 1e-6) {
      this.resp = motion.resp;
      if (this.lumens.updateResp(this.resp)) {
        this.catheter?.contacts.resetHints();
        this.wire?.contacts.resetHints();
      }
    }
    if (motion?.coronaries) this.lumens.moveCoronaries(motion.coronaries);
    if (motion?.valve !== undefined) this.lumens.setValve(motion.valve);
    this.syncCrossRadius();
    this.tAcc += dt;
    let n = 0;
    while (this.tAcc >= this.h - 1e-12) {
      this.tAcc -= this.h;
      this.substep();
      n++;
    }
    return n;
  }

  /** Move the patient clock without stepping the devices (start-up, or catching up after a stall). */
  setTime(t: number): void {
    this.t = t;
    this.tAcc = 0;
  }

  /** Run substeps until the patient clock reaches tTarget. */
  stepTo(tTarget: number, motion?: MotionInput): number {
    return this.step(Math.max(0, tTarget - this.t - this.tAcc), motion);
  }

  private substep(): void {
    const h = this.h;
    this.applyHands();
    const c = this.catheter, w = this.wire && !this.wire.out ? this.wire : null;
    if (c) {
      if (w) this.applyComposite(c, w, false);
      this.setHubPose(c);
      // rail the tip onto the wire when the catheter advances over it
      c.contacts.rails.length = 0;
      if (w && w.delta < w.prevDelta - 1e-6 && w.delta > 0) {
        const p = this.wirePointAt(w, w.delta);
        if (p) {
          const r = this.rail;
          r.body = c.rod.n - 1;
          r.px = p[0]; r.py = p[1]; r.pz = p[2];
          r.tx = p[3]; r.ty = p[4]; r.tz = p[5];
          c.contacts.rails.push(r);
        }
      }
      // wire reaction loads the tip body
      c.rod.fext.fill(0);
      for (let k = 0; k < 6; k++) c.rod.fext[6 * (c.rod.n - 1) + k] = c.wireExt[k];
      // an inner device under axial compression presses outwards on every curve it passes through
      if (w) this.innerCompressionLoad(c, w);
      this.solveDevice(c);
      this.hubReaction(c, 0);
    }
    if (w) {
      this.updateWireStart(w);
      if (w.start < w.rod.n - 1) {
        this.setClampPose(w);
        w.rod.fext.fill(0);
        this.solveDevice(w);
        this.hubReaction(w, w.start);
        if (c) this.wireLoadOnCatheter(c, w);
      } else {
        // nothing beyond the exit: no tip resistance, so no compression or twist load at the hub
        // (friction of the wire inside the catheter is not modelled)
        w.axial = 0;
        w.torsion = 0;
        if (c) c.wireExt.fill(0);
      }
      w.prevDelta = w.delta;
    } else if (c) {
      c.wireExt.fill(0);
    }
    this.detectSnaps();
    this.t += h;
    this.steps++;
    if (c && ++c.kk.counter >= MP_KINK_TRACK_SUBSTEPS) {
      c.kk.counter = 0;
      this.kinkTrack(c, w);
    }
  }

  // -------------------------------------------------------------------------
  // Torque loss and kinking (diag-catheter-kink)
  // -------------------------------------------------------------------------

  /** Route arclength (mm) of the catheter's material point u (mm from its tip), along the access route. */
  private routeS(c: Catheter, u: number): number {
    return c.hubS + c.spec.length - c.rod.len[0] - u;
  }

  /**
   * Set the prevention measures (sheath length inside the body, a catheter 1 Fr smaller than the
   * sheath) and turn the kink model on or off. Turned off, the brake goes, the tracker stops and a
   * kink in the shaft is taken out without counting as undone.
   */
  setKinkSetup(setup: Partial<KinkSetup>): void {
    this.version++;
    const sheathMm = setup.sheathMm !== undefined && Number.isFinite(setup.sheathMm) ? Math.max(0, setup.sheathMm) : this.kinkSetup.sheathMm;
    const was = this.kinkSetup.model;
    this.kinkSetup = { sheathMm, undersized: setup.undersized ?? this.kinkSetup.undersized, model: setup.model ?? was };
    const c = this.catheter;
    if (!c) return;
    if (was && !this.kinkSetup.model) this.clearKinkModel(c);
    if (!was && this.kinkSetup.model) {
      // the tracker starts from the shaft as it lies now
      c.kk.refQ.set(c.rod.quat.subarray(4 * c.kk.ref, 4 * c.kk.ref + 4));
      c.kk.histCount = 0;
      c.kk.tipRate = 0;
      c.kk.overSince = null;
    }
    this.updateKinkWeights(c);
  }

  /** The kink model turned off: the kinked joint back to its own shape, the tracker's readings cleared. */
  private clearKinkModel(c: Catheter): void {
    const kk = c.kk, k = kk.kink;
    if (k) {
      const j = k.joint;
      c.baseRest[3 * j] = k.origRest[0];
      c.baseRest[3 * j + 1] = k.origRest[1];
      c.baseRest[3 * j + 2] = k.origRest[2];
      c.baseEI[j] = k.origEI;
      kk.kink = null;
      this.applyComposite(c, this.wire && !this.wire.out ? this.wire : null, true);
    }
    kk.stored = 0;
    kk.torqueLoss = false;
    kk.overSince = null;
    kk.histCount = 0;
  }

  /** The 0.035 in wire (not a 0.014 in wire or a device) lies inside the catheter across material point u. */
  private wire035Across(w: Wire | null, u: number): boolean {
    return !!w && !w.out && w.slot === "wire035" && u + w.delta >= 0 && u + w.delta <= w.spec.length;
  }

  /**
   * Brake weights per body (the route's tortuosity where the body lies, none inside the sheath; the
   * kinked joint's bodies in full) and the braked axial mobility from them, with the modifiers: a
   * 0.035 in wire inside across the body and a catheter 1 Fr smaller than the sheath.
   */
  private updateKinkWeights(c: Catheter): void {
    const kk = c.kk, rod = c.rod, L = this.lumens;
    if (!this.kinkSetup.model) {
      // the model off: no brake anywhere, each body's own mobility
      kk.w.fill(0);
      rod.ia.set(kk.baseIa);
      return;
    }
    const w = this.wire && !this.wire.out ? this.wire : null;
    const sheathTip = L.skinS + this.kinkSetup.sheathMm;
    for (let i = 0; i < rod.n; i++) {
      const sb = this.routeS(c, rod.u[i]);
      kk.w[i] = sb <= sheathTip ? 0 : L.tortuosityAt(sb);
    }
    const k = kk.kink;
    if (k && !k.sheathed) {
      kk.w[k.joint] = 1;
      if (k.joint + 1 < rod.n) kk.w[k.joint + 1] = 1;
    }
    const base = MP_KINK_BRAKE * (this.kinkSetup.undersized ? MP_KINK_UNDERSIZE_BRAKE : 1);
    for (let i = 0; i < rod.n; i++) {
      const wi = kk.w[i];
      rod.ia[i] = wi > 0 ? kk.baseIa[i] / (1 + base * wi * (this.wire035Across(w, rod.u[i]) ? MP_KINK_WIRE_BRAKE : 1)) : kk.baseIa[i];
    }
  }

  /** The tracker: stored twist, the hub's and the tip's rotation, the latch, the kink's growth and its undoing. */
  private kinkTrack(c: Catheter, w: Wire | null): void {
    if (!this.kinkSetup.model) return;
    const kk = c.kk, rod = c.rod;
    const dt = MP_KINK_TRACK_SUBSTEPS * this.h;
    this.updateKinkWeights(c);
    // the tip's rotation (the shaft body proximal to the preformed curve)
    const ri = kk.ref;
    const dphi = spinBetween(kk.refQ, 0, rod.quat, 4 * ri);
    kk.refQ.set(rod.quat.subarray(4 * ri, 4 * ri + 4));
    kk.tipSpin += dphi;
    kk.tipRate += (Math.abs(dphi) / dt - kk.tipRate) * Math.min(1, dt / MP_KINK_TIP_TAU_S);
    // torque not transmitted over the last MP_TNT_WINDOW_S
    const t = this.t;
    const H = kk.hist;
    histPush(kk, t, c.hubRoll, kk.tipSpin, kk.handRoll);
    while (kk.histCount > 1 && t - H[histOff(kk, 0)] > MP_TNT_WINDOW_S + 1e-9) {
      kk.histHead = (kk.histHead + 1) % kk.histCap;
      kk.histCount--;
    }
    const o0 = histOff(kk, 0);
    const span = t - H[o0];
    const dHub = c.hubRoll - H[o0 + 1];
    const dTip = kk.tipSpin - H[o0 + 2];
    kk.torqueLoss = span >= MP_TNT_WINDOW_S - dt - 1e-9 && Math.abs(dHub) >= MP_TNT_HUB_RAD && Math.abs(dTip) <= MP_TNT_TIP_FRACTION * Math.abs(dHub);
    // twist stored up to the distal end of the tortuous segment, and where curvature times twist is greatest in it
    const js = kjs;
    let kDist = -1;
    for (let k = rod.n - 2; k >= 0; k--) {
      if (kk.w[k] > 0 || kk.w[k + 1] > 0) {
        kDist = k;
        break;
      }
    }
    let stored = 0;
    let bestK = -1, best = 0, bx = 0, by = 0;
    let inside = false;
    for (let k = 0; k <= kDist; k++) {
      jointState(rod, k, js);
      stored += js[0];
      // the kink forms inside the segment: a joint between two braked bodies, where there is one
      const both = kk.w[k] > 0 && kk.w[k + 1] > 0;
      if (both || (!inside && (kk.w[k] > 0 || kk.w[k + 1] > 0))) {
        if (both && !inside) {
          inside = true;
          bestK = -1;
        }
        const L = rod.Lj[k] || rod.len[k];
        const score = (Math.hypot(js[1], js[2]) / L) * Math.abs(js[0] / L);
        if (score > best || bestK < 0) {
          best = score;
          bestK = k;
          bx = js[1];
          by = js[2];
        }
      }
    }
    kk.stored = stored;
    const kink = kk.kink;
    if (!kink) {
      // no tortuous segment under the shaft (normal anatomy): nothing can latch
      if (kDist < 0) {
        kk.overSince = null;
        return;
      }
      const thr = MP_KINK_TWIST * (this.wire035Across(w, rod.uJ[kDist]) ? MP_KINK_WIRE_TWIST : 1);
      // the hand's turn over the last MP_KINK_TURNING_S (the history holds (t, hub, tip, hand) quadruples)
      let handThen = H[o0 + 3];
      for (let i = kk.histCount - 1; i >= 0; i--) {
        const o = histOff(kk, i);
        if (t - H[o] >= MP_KINK_TURNING_S - 1e-9) {
          handThen = H[o + 3];
          break;
        }
      }
      const turning = (kk.handRoll - handThen) * Math.sign(stored);
      if (Math.abs(stored) > thr && kk.tipRate < MP_KINK_TIP_STILL && turning >= MP_KINK_TURNING_RAD) {
        kk.overSince ??= t;
        if (t - kk.overSince >= MP_KINK_S && bestK >= 0) this.latchKink(c, w, bestK, Math.max(MP_KINK_MIN_SEVERITY, this.kinkSeverityFor(w, rod.uJ[bestK], Math.abs(stored))), Math.sign(stored) || 1, bx, by);
      } else kk.overSince = null;
      return;
    }
    // further turning in the same direction folds it tighter (round a wire across it, only so far)
    const sev = Math.max(kink.severity, this.kinkSeverityFor(w, kink.u, kink.sign * stored));
    if (sev > kink.severity + 1e-3) {
      kink.severity = sev;
      this.applyKinkBend(c, w);
    }
    // untwisting: the hub turned back against the kinking direction
    const back = kink.sign * (kink.hubAtLatch - c.hubRoll);
    if (back >= MP_KINK_UNTWIST_RAD && kink.sign * stored <= 0 && (kink.severity <= MP_KINK_UNTWIST_MAX || kink.held > 0)) {
      this.resolveKink(c, w, "untwist");
      return;
    }
    // a 0.035 in wire passed through it straightens it (one already across it when it formed must be drawn back first)
    const across = this.wire035Across(w, kink.u);
    if (!across) kink.wireAcross = false;
    else if (!kink.wireAcross && kink.severity <= MP_KINK_WIRE_PASS_MAX) this.resolveKink(c, w, "wire");
  }

  /**
   * The severity the stored twist folds the shaft to at material point u: the twist over
   * MP_KINK_SEVERE_TWIST, or with a 0.035 in wire across u, over the wire-raised threshold's factor and
   * at most MP_KINK_WIRE_SEVERITY_MAX.
   */
  private kinkSeverityFor(w: Wire | null, u: number, twist: number): number {
    if (this.wire035Across(w, u)) return Math.min(MP_KINK_WIRE_SEVERITY_MAX, twist / (MP_KINK_WIRE_TWIST * MP_KINK_SEVERE_TWIST));
    return Math.min(1, twist / MP_KINK_SEVERE_TWIST);
  }

  /** Latch a kink at joint k: the plastic bend in the rest curvature, the weakened joint. */
  latchKink(c: Catheter, w: Wire | null, k: number, severity: number, sign: number, bx = 1, by = 0): void {
    const kk = c.kk;
    if (!this.kinkSetup.model || kk.kink || k < 0 || k >= c.rod.n - 1) return;
    const bl = Math.hypot(bx, by);
    kk.kink = {
      joint: k,
      u: c.rod.uJ[k],
      severity: Math.max(0, Math.min(1, severity)),
      sign,
      hubAtLatch: c.hubRoll,
      t: this.t,
      dirX: bl > 1e-6 ? bx / bl : 1,
      dirY: bl > 1e-6 ? by / bl : 0,
      origRest: [c.baseRest[3 * k], c.baseRest[3 * k + 1], c.baseRest[3 * k + 2]],
      origEI: c.baseEI[k],
      held: 0,
      sheathed: false,
      wireAcross: this.wire035Across(w, c.rod.uJ[k]),
    };
    kk.overSince = null;
    kk.latched++;
    this.version++;
    this.applyKinkBend(c, w);
    this.updateKinkWeights(c);
  }

  /** Latch a kink at the joint nearest material point u (mm from the tip): a scenario's start state, and the tests. */
  latchKinkAt(u: number, severity: number, sign = 1): boolean {
    const c = this.catheter;
    if (!c || c.kk.kink || !this.kinkSetup.model) return false;
    let k = 0, best = Infinity;
    for (let j = 0; j < c.rod.n - 1; j++) {
      const d = Math.abs(c.rod.uJ[j] - u);
      if (d < best) {
        best = d;
        k = j;
      }
    }
    jointState(c.rod, k, kjs);
    this.latchKink(c, this.wire && !this.wire.out ? this.wire : null, k, severity, sign, kjs[1], kjs[2]);
    return true;
  }

  private applyKinkBend(c: Catheter, w: Wire | null): void {
    const k = c.kk.kink;
    if (!k) return;
    const j = k.joint;
    const th = k.sheathed ? 0 : MP_KINK_BEND_RAD * k.severity;
    c.baseRest[3 * j] = k.origRest[0] + th * k.dirX;
    c.baseRest[3 * j + 1] = k.origRest[1] + th * k.dirY;
    c.baseRest[3 * j + 2] = k.origRest[2];
    c.baseEI[j] = k.sheathed ? k.origEI : k.origEI * MP_KINK_EI_FACTOR;
    this.applyComposite(c, w && !w.out ? w : null, true);
  }

  private resolveKink(c: Catheter, w: Wire | null, by: KinkResolution): void {
    const k = c.kk.kink;
    if (!k) return;
    const j = k.joint;
    c.baseRest[3 * j] = k.origRest[0];
    c.baseRest[3 * j + 1] = k.origRest[1];
    c.baseRest[3 * j + 2] = k.origRest[2];
    c.baseEI[j] = k.origEI;
    c.kk.kink = null;
    c.kk.resolved++;
    c.kk.lastResolvedBy = by;
    c.kk.overSince = null;
    this.version++;
    this.applyComposite(c, w && !w.out ? w : null, true);
    this.updateKinkWeights(c);
  }

  /** A recovery command: hold the tip (snare, cuff), pressurise the lumen, cut the hub and cover the kink with a sheath, or let go. */
  kinkRecover(action: KinkRecoveryAction): KinkOutcome {
    const c = this.catheter;
    const w = this.wire && !this.wire.out ? this.wire : null;
    let outcome: KinkOutcome;
    if (!c) outcome = "no-catheter";
    else {
      const k = c.kk.kink;
      switch (action) {
        case "snare":
          if (k) k.held = 1;
          outcome = "held";
          break;
        case "cuff": {
          // a cuff on the upper arm holds the catheter in the forearm on an arm route; whether there is a
          // kink makes no difference to what the operator is told. It holds a kink that lies in the
          // forearm, below the brachial artery; from the femoral route it holds nothing.
          if (this.scene.route === "femoral") outcome = "not-below-brachial";
          else {
            if (k && this.regionAtU(c, k.u) === Region.Radial) k.held = 2;
            outcome = "held";
          }
          break;
        }
        case "pressurise":
          if (k && k.severity <= MP_KINK_PRESSURISE_MAX) {
            this.resolveKink(c, w, "pressurise");
            outcome = "unwound";
          } else outcome = "unchanged";
          break;
        case "cut-sheath":
          // the sheath encloses the kinked part and carries it: the fold no longer catches on the wall
          if (k && !k.sheathed) {
            k.sheathed = true;
            this.applyKinkBend(c, w);
            this.updateKinkWeights(c);
          }
          outcome = "sheathed";
          break;
        case "release":
          if (k) k.held = 0;
          outcome = "released";
          break;
      }
      c.kk.seq++;
      c.kk.lastAction = { action, outcome, seq: c.kk.seq };
    }
    this.version++;
    return outcome;
  }

  /**
   * Lumen region code at the catheter's material point u: the access route's region where that point
   * lies along it, or, past the route's end (the root, a coronary), the last contact of its body.
   */
  private regionAtU(c: Catheter, u: number): number {
    const s = this.routeS(c, u);
    const t = this.lumens.access;
    if (s >= 0 && s <= t.cum[t.n - 1]) {
      let lo = 0, hi = t.n - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (t.cum[mid] <= s) lo = mid;
        else hi = mid;
      }
      return t.region[s - t.cum[lo] <= t.cum[hi] - s ? lo : hi];
    }
    const rod = c.rod;
    let b = rod.n - 1;
    for (let i = 0; i < rod.n; i++) {
      if (Math.abs(rod.u[i] - u) <= rod.len[i] / 2 + 1e-6) {
        b = i;
        break;
      }
    }
    return c.contacts.region[b];
  }

  /** The kink read-out for a device read-out of catheter c (nodes start at body `start`). */
  private kinkReadout(c: Catheter): KinkReadout | null {
    const k = c.kk.kink;
    if (!k) return null;
    const p = kpos;
    c.rod.endPoint(k.joint + 1, -1, p, 0);
    return {
      node: Math.max(0, k.joint + 1 - c.start),
      severity: k.severity,
      u: k.u,
      region: this.regionAtU(c, k.u),
      pos: [p[0], p[1], p[2]],
      held: k.held === 1 ? "snare" : k.held === 2 ? "cuff" : null,
      sheathed: k.sheathed,
    };
  }

  private solveDevice(d: Device): void {
    const rod = d.rod, ws = d.ws, ct = d.contacts, cfg = this.config, h = this.h;
    rod.prevPos.set(rod.pos);
    rod.prevQuat.set(rod.quat);
    rod.lambda.fill(0);
    ct.detect(rod, this.lumens, d.start);
    const opt = this.solveOpt;
    opt.h = h;
    opt.maxMove = cfg.maxMove;
    opt.maxRot = cfg.maxRot;
    opt.trust = cfg.trustRegion;
    for (let it = 0; it < cfg.iterations; it++) {
      ct.mobility(rod, ws, h, d.start);
      let pred: Float64Array | null = null;
      if (it === 0) {
        let any = false;
        for (let i = d.start; i < rod.n; i++) {
          const fo = 6 * i, wo = 36 * i;
          let nz = false;
          for (let m = 0; m < 6; m++) if (rod.fext[fo + m] !== 0) nz = true;
          if (!nz) {
            for (let m = 0; m < 6; m++) d.pred[fo + m] = 0;
            continue;
          }
          any = true;
          for (let r = 0; r < 6; r++) {
            let s = 0;
            for (let m = 0; m < 6; m++) s += ws.Wp[wo + 6 * r + m] * rod.fext[fo + m];
            d.pred[fo + r] = h * h * s;
          }
        }
        if (any) pred = d.pred;
      }
      solveRodIteration(rod, ws, opt, pred, d.start);
      ct.detect(rod, this.lumens, d.start);
      // refresh normal loads and friction for the next iteration
      if (it < cfg.iterations - 1) ct.after(rod, ws, h, d.start, cfg.friction, false);
    }
    ct.after(rod, ws, h, d.start, cfg.friction);
    this.crossThroughOpening(d);
    ct.updateValveFlag(rod, this.lumens, d.start);
  }

  /**
   * The radius (mm) within which a tip pressed on the closed valve opens it (contact.ts): the model's
   * 1.2 x orifice radius, or with a valve set (diag-lv-aorta-task) no more than its full opening, so a
   * difficult or stenotic valve is not opened by pressing on its centre.
   */
  private crossRadius(): number {
    const base = this.lumens.root.rOrifice * 1.2;
    const v = this.lumens.valve;
    return v ? Math.min(base, v.fullR) : base;
  }

  /** Keep the devices' press-to-cross radius in step with the valve setting. */
  private syncCrossRadius(): void {
    const r = this.crossRadius();
    if (this.catheter) this.catheter.contacts.crossRadius = r;
    if (this.wire) this.wire.contacts.crossRadius = r;
  }

  /**
   * A distal segment that has dropped through the valve's systolic opening (lumen.ts VALVE_OPENING) has
   * crossed: the rod is in the ventricle from then on, as after a crossing by pressure (diag-lv-aorta-task).
   */
  private crossThroughOpening(d: Device): void {
    const L = this.lumens;
    const ct = d.contacts;
    if (ct.flags.crossedValve || !(L.valveOpenRadius() > 0)) return;
    const rod = d.rod;
    if (L.rodThroughOpening(rod.pos, rod.n, Math.max(d.start, rod.n - 10))) ct.flags.crossedValve = true;
  }

  // -------------------------------------------------------------------------
  // Hub, clamp and nesting
  // -------------------------------------------------------------------------

  private setHubPose(c: Catheter): void {
    const rod = c.rod;
    const p = tmp6;
    this.lumens.routePoint(c.hubS - rod.len[0] / 2, p);
    rod.pos[0] = p[0];
    rod.pos[1] = p[1];
    rod.pos[2] = p[2];
    qexp(p[3] * c.hubRoll, p[4] * c.hubRoll, p[5] * c.hubRoll, tmp4, 0);
    qmul(tmp4, 0, c.hubQ0, 0, rod.quat, 0);
  }

  /** Exit pose of the wire: catheter tip (position, tangent) or the sheath hub (a shared scratch buffer: read it at once). */
  private exitPose(): Float64Array {
    const out = exitBuf;
    const c = this.catheter;
    if (c) {
      c.rod.endPoint(c.rod.n - 1, 1, out, 0);
      c.rod.tangent(c.rod.n - 1, out, 3);
      return out;
    }
    return this.sheathExit();
  }

  /** Sheath hub pose (a shared scratch buffer). */
  private sheathExit(): Float64Array {
    const out = sheathBuf;
    this.lumens.routePoint(this.lumens.skinS - 25, out);
    return out;
  }

  private updateWireStart(w: Wire): void {
    const rod = w.rod;
    let s: number;
    if (w.delta <= 0.5) {
      s = rod.n - 1; // nothing beyond the exit
    } else {
      // clamp body = the body containing material coordinate delta
      s = rod.n - 1;
      while (s > 0 && rod.u[s] + rod.len[s] / 2 <= w.delta) s--;
    }
    if (s !== w.start) {
      if (s < w.start) {
        // bodies leaving the catheter (or the sheath) emerge straight ahead of the exit
        const ex = this.exitPose();
        const c = this.catheter;
        const q = tmp4;
        if (c) {
          const rel = w.hubRoll - c.hubRoll;
          qexp(ex[3] * rel, ex[4] * rel, ex[5] * rel, q, 0);
          qmul(q, 0, c.rod.quat, 4 * (c.rod.n - 1), q, 4);
        } else {
          orthoFrameQuat(ex[3], ex[4], ex[5], q.subarray(4, 8));
        }
        const hi = Math.min(rod.n - 1, w.start);
        for (let i = s; i <= hi; i++) {
          const ahead = w.delta - rod.u[i];
          // a body crossing the exit this substep sits just ahead of the catheter tip; the wire beyond it
          // then moves with its own mechanics (pushed out when the hubs slide, left in place when the tip
          // backs off along its own path)
          rod.pos[3 * i] = ex[0] + ex[3] * ahead;
          rod.pos[3 * i + 1] = ex[1] + ex[4] * ahead;
          rod.pos[3 * i + 2] = ex[2] + ex[5] * ahead;
          rod.quat.set(q.subarray(4, 8), 4 * i);
          rod.prevPos.set(rod.pos.subarray(3 * i, 3 * i + 3), 3 * i);
          rod.prevQuat.set(rod.quat.subarray(4 * i, 4 * i + 4), 4 * i);
          rod.cActive[i] = 0;
          rod.cEta[i] = 0;
        }
      }
      for (let i = 0; i < rod.n; i++) rod.kin[i] = i <= s ? 1 : 0;
      w.contacts.resetHints();
    }
    w.start = s;
  }

  private setClampPose(w: Wire): void {
    const rod = w.rod;
    const s = w.start;
    const ex = this.exitPose();
    const c = this.catheter;
    // distal end of the clamp body sits (delta − uJ) ahead of the exit along the exit tangent
    const uJs = rod.u[s] - rod.len[s] / 2;
    const ahead = w.delta - uJs - rod.len[s] / 2;
    rod.pos[3 * s] = ex[0] + ex[3] * ahead;
    rod.pos[3 * s + 1] = ex[1] + ex[4] * ahead;
    rod.pos[3 * s + 2] = ex[2] + ex[5] * ahead;
    // orientation: the exit frame rolled by the wire's hub roll relative to the catheter
    const q = tmp4;
    if (c) {
      const rel = w.hubRoll - c.hubRoll;
      qexp(ex[3] * rel, ex[4] * rel, ex[5] * rel, q, 0);
      qmul(q, 0, c.rod.quat, 4 * (c.rod.n - 1), q, 4);
      rod.quat.set(q.subarray(4, 8), 4 * s);
    } else {
      // sheath: a fixed reference frame about the route tangent, rolled by the hub roll
      const ref = refQ;
      orthoFrameQuat(ex[3], ex[4], ex[5], ref);
      qexp(ex[3] * w.hubRoll, ex[4] * w.hubRoll, ex[5] * w.hubRoll, q, 0);
      qmul(q, 0, ref, 0, q, 4);
      rod.quat.set(q.subarray(4, 8), 4 * s);
    }
  }

  /** Wire centre-line point and tangent at material coordinate u (from the wire tip), on the free part. */
  private wirePointAt(w: Wire, u: number): Float64Array | null {
    const rod = w.rod;
    for (let i = rod.n - 1; i > w.start; i--) {
      const u0 = rod.u[i] - rod.len[i] / 2, u1 = rod.u[i] + rod.len[i] / 2;
      if (u >= u0 && u <= u1) {
        const out = wirePtBuf;
        rod.tangent(i, out, 3);
        const off = rod.u[i] - u; // positive towards the tip
        out[0] = rod.pos[3 * i] + out[3] * off;
        out[1] = rod.pos[3 * i + 1] + out[4] * off;
        out[2] = rod.pos[3 * i + 2] + out[5] * off;
        return out;
      }
    }
    return null;
  }

  /** Composite stiffness and rest shape of catheter joints that contain the wire. */
  private applyComposite(c: Catheter, w: Wire | null, force: boolean): void {
    const delta = w && !w.out ? w.delta : -1e9;
    if (!force && Math.abs(delta - c.compositeDelta) < 0.25) return;
    c.compositeDelta = delta;
    const rod = c.rod;
    const k3 = tmp3;
    for (let k = 0; k < rod.n - 1; k++) {
      const uc = rod.uJ[k];
      const uw = uc + delta;
      const L = k === 0 ? rod.len[1] / 2 : rod.Lj[k];
      const EIc = c.baseEI[k];
      let EI = EIc;
      let rx = c.baseRest[3 * k], ry = c.baseRest[3 * k + 1];
      const rz = c.baseRest[3 * k + 2];
      if (w && !w.out && uw >= 0 && uw <= w.spec.length) {
        const EIw = w.spec.EI(uw);
        w.spec.rest(uw, k3);
        EI = EIc + EIw;
        rx = (EIc * rx + EIw * k3[0] * L) / EI;
        ry = (EIc * ry + EIw * k3[1] * L) / EI;
      }
      rod.alB[k] = L / EI;
      rod.setRest(k, rx, ry, rz);
    }
  }

  /**
   * An inner device carrying axial compression P inside a curved catheter pushes outwards on the
   * catheter's curves with force P·(t_k − t_{k+1}) at each joint (the reverse of a string in tension).
   * This is what opens a guide's curves and backs it out when a device is pushed against resistance.
   * P is the axial compression the free part of the device carries at the catheter tip (its hub
   * resistance), assumed uniform along the overlap and capped at 3 N (model parameter, below the 4 N
   * grip limit at which the fingers slip). It acts whenever a hand holds the device: a device that has
   * met resistance stays compressed after the hand stops pushing, until it is pulled back or let go.
   */
  private innerCompressionLoad(c: Catheter, w: Wire): void {
    if (!w.held) return;
    const P = Math.min(3, Math.max(0, w.axial));
    if (P < 1e-3) return;
    const rod = c.rod;
    const ta = tA, tb = tB;
    for (let k = 0; k < rod.n - 1; k++) {
      const uw = rod.uJ[k] + w.delta;
      if (uw < 0 || uw > w.spec.length) continue;
      if (rod.kin[k] && rod.kin[k + 1]) continue;
      rod.tangent(k, ta, 0);
      rod.tangent(k + 1, tb, 0);
      const fx = P * (ta[0] - tb[0]), fy = P * (ta[1] - tb[1]), fz = P * (ta[2] - tb[2]);
      for (let b = k; b <= k + 1; b++) {
        rod.fext[6 * b] += 0.5 * fx;
        rod.fext[6 * b + 1] += 0.5 * fy;
        rod.fext[6 * b + 2] += 0.5 * fz;
      }
    }
  }

  /** Lateral force and bending moment of the wire's free part on the catheter tip (relaxed). */
  private wireLoadOnCatheter(c: Catheter, w: Wire): void {
    const F = tmp6;
    jointForceOnBody(w.rod, w.ws, w.start, this.h, F, 0);
    // F is the force of joint `start` on the clamp; the catheter tip carries its lateral part
    const t = tmp3;
    c.rod.tangent(c.rod.n - 1, t, 0);
    const fa = F[0] * t[0] + F[1] * t[1] + F[2] * t[2];
    const ta = F[3] * t[0] + F[4] * t[1] + F[5] * t[2];
    const relax = 0.3;
    const lat = [F[0] - fa * t[0], F[1] - fa * t[1], F[2] - fa * t[2], F[3] - ta * t[0], F[4] - ta * t[1], F[5] - ta * t[2]];
    // a very short free part is pinned between the clamp and the wall and its joint forces are not a
    // meaningful load; cap the staggered coupling (model parameters: 0.4 N, 4 N·mm) for stability
    const freeLen = w.delta;
    const ramp = Math.max(0, Math.min(1, (freeLen - 4) / 10));
    const fl = Math.hypot(lat[0], lat[1], lat[2]), ml = Math.hypot(lat[3], lat[4], lat[5]);
    const sf = ramp * Math.min(1, 0.4 / (fl || 1)), sm = ramp * Math.min(1, 4 / (ml || 1));
    for (let k = 0; k < 3; k++) lat[k] *= sf;
    for (let k = 3; k < 6; k++) lat[k] *= sm;
    for (let k = 0; k < 6; k++) c.wireExt[k] = (1 - relax) * c.wireExt[k] + relax * lat[k];
  }

  private hubReaction(d: Device, body: number): void {
    const F = tmp6;
    jointForceOnBody(d.rod, d.ws, body, this.h, F, 0);
    const t = tmp3;
    d.rod.tangent(body, t, 0);
    // the hand supplies −F; resistance to advancing is positive (low-passed over ~25 ms, as felt)
    const ax = -(F[0] * t[0] + F[1] * t[1] + F[2] * t[2]);
    const tq = -(F[3] * t[0] + F[4] * t[1] + F[5] * t[2]);
    const a = Math.min(1, this.h / 0.025);
    d.axial += a * (clampAbs(ax, 20) - d.axial);
    d.torsion += a * (clampAbs(tq, 50) - d.torsion);
  }

  private detectSnaps(): void {
    if (this.catheter) this.detectSnap(this.catheter);
    if (this.wire) this.detectSnap(this.wire);
  }

  private detectSnap(d: Device): void {
    {
      const tip = tmp3;
      d.rod.endPoint(d.rod.n - 1, 1, tip, 0);
      const v = Math.hypot(tip[0] - d.prevTip[0], tip[1] - d.prevTip[1], tip[2] - d.prevTip[2]) / this.h;
      d.prevTip[0] = tip[0];
      d.prevTip[1] = tip[1];
      d.prevTip[2] = tip[2];
      // model parameter: a tip faster than 150 mm/s without a matching hand motion is a snap
      if (v > 150 && Math.abs(d.pendingPush) < 1) d.snapTimer = 0.15;
      d.snapTimer = Math.max(0, d.snapTimer - this.h);
      d.snap = d.snapTimer > 0;
    }
  }

  // -------------------------------------------------------------------------
  // Read-out
  // -------------------------------------------------------------------------

  /** Stored twist (rad) along a device: sum of joint twist deviations from the hub to the tip. */
  windup(d: Device): number {
    const rod = d.rod;
    let s = 0;
    const q = new Float64Array(16);
    for (let k = d.start; k < rod.n - 1; k++) {
      const qa = 4 * k, qb = 4 * (k + 1), r = 4 * k;
      q[0] = -rod.restQ[r]; q[1] = -rod.restQ[r + 1]; q[2] = -rod.restQ[r + 2]; q[3] = rod.restQ[r + 3];
      q[4] = -rod.quat[qa]; q[5] = -rod.quat[qa + 1]; q[6] = -rod.quat[qa + 2]; q[7] = rod.quat[qa + 3];
      qmul(q, 0, q, 4, q, 8);
      qmul(q, 8, rod.quat, qb, q, 12);
      const sg = q[15] < 0 ? -1 : 1;
      s += 2 * sg * q[14];
    }
    // a clockwise hub twist makes the hub lead the tip: report the hub-minus-tip angle
    return -s;
  }

  readDevice(d: Device): DeviceReadout {
    const r = this.readDeviceRaw(d);
    if (d === this.catheter) {
      const c = d as Catheter;
      r.reaction.wedged = this.wedged();
      r.kink = this.kinkReadout(c);
      r.torqueLoss = c.kk.torqueLoss;
      r.storedTwist = c.kk.stored;
      r.kinkHistory = { latched: c.kk.latched, resolved: c.kk.resolved, lastResolvedBy: c.kk.lastResolvedBy, lastAction: c.kk.lastAction ? { ...c.kk.lastAction } : null };
      r.kinkSetup = { ...this.kinkSetup };
    }
    return r;
  }

  /** Read-out without the classifier (used by classify() itself). */
  private readDeviceRaw(d: Device): DeviceReadout {
    const rod = d.rod;
    const n = rod.n - d.start;
    const nodes = new Float32Array(3 * (n + 1));
    const contactForce = new Float32Array(n + 1);
    const tmp = new Float64Array(3);
    let sliding = 0, stuck = 0;
    for (let i = d.start; i < rod.n; i++) {
      rod.endPoint(i, -1, tmp, 0);
      const o = 3 * (i - d.start);
      nodes[o] = tmp[0];
      nodes[o + 1] = tmp[1];
      nodes[o + 2] = tmp[2];
      // node k ≥ 1 is the distal end of body start + k − 1 and carries that body's wall load
      contactForce[i - d.start + 1] = rod.cN[i];
      if (rod.cN[i] > 0) {
        if (d.contacts.stuck[i]) stuck++;
        else sliding++;
      }
    }
    rod.endPoint(rod.n - 1, 1, tmp, 0);
    nodes[3 * n] = tmp[0];
    nodes[3 * n + 1] = tmp[1];
    nodes[3 * n + 2] = tmp[2];
    const td = new Float64Array(3);
    rod.tangent(rod.n - 1, td, 0);
    // first node past the skin
    let insideFrom = 0;
    for (let i = d.start; i < rod.n; i++) {
      if (d.contacts.region[i] > 0) {
        insideFrom = i - d.start;
        break;
      }
    }
    return {
      slot: d.slot,
      id: d.spec.id,
      nodes,
      count: n + 1,
      radius: d.spec.radius,
      insideFrom,
      reaction: { device: d.slot, axial: d.axial, torsion: d.torsion, snap: d.snap, wedged: false },
      windup: this.windup(d),
      tip: [tmp[0], tmp[1], tmp[2]],
      tipDir: [td[0], td[1], td[2]],
      contactForce,
      slipEvents: d.contacts.slipEvents,
      stuckContacts: stuck,
      slidingContacts: sliding,
    };
  }

  /** Wire nodes including the part inside the catheter (follows the catheter centre line). */
  readWire(): DeviceReadout | null {
    const w = this.wire;
    if (!w || w.out) return null;
    const free = w.start < w.rod.n - 1 ? this.readDeviceRaw(w) : null;
    const c = this.catheter;
    const inside: number[] = [];
    if (c) {
      // wire material from the exit back to where it leaves the catheter hub, along the catheter
      const rod = c.rod;
      const tmp = new Float64Array(3);
      const uStart = Math.max(0, -w.delta); // catheter material coordinate of the wire tip (if inside)
      for (let i = 0; i < rod.n; i++) {
        if (rod.u[i] < uStart) continue;
        rod.endPoint(i, -1, tmp, 0);
        inside.push(tmp[0], tmp[1], tmp[2]);
      }
    }
    const nIn = inside.length / 3;
    const nFree = free ? free.count : 0;
    const nodes = new Float32Array(3 * (nIn + nFree));
    nodes.set(inside);
    if (free) nodes.set(free.nodes, 3 * nIn);
    const contactForce = new Float32Array(nIn + nFree);
    if (free) contactForce.set(free.contactForce, nIn);
    const base = free ?? (c ? this.readDeviceRaw(c) : null);
    if (!base) return null;
    return {
      ...base,
      slot: w.slot,
      id: w.spec.id,
      nodes,
      count: nIn + nFree,
      radius: w.spec.radius,
      insideFrom: 0,
      reaction: { device: w.slot, axial: w.axial, torsion: w.torsion, snap: w.snap, wedged: false },
      contactForce,
      slipEvents: w.contacts.slipEvents,
      stuckContacts: free ? free.stuckContacts : 0,
      slidingContacts: free ? free.slidingContacts : 0,
    };
  }

  /** bumped by every change of state (step, load, remove, restore): keys the classifier cache */
  private version = 0;
  private classCache: { version: number; reading: EngagementReading | null } = { version: -1, reading: null };

  /** Read-only engagement reading for the catheter (null without a catheter); cached per substep count. */
  classify(): EngagementReading | null {
    const c = this.catheter;
    if (!c) return null;
    if (this.classCache.version === this.version && this.classCache.reading) return this.classCache.reading;
    const r = this.readDeviceRaw(c);
    const reading = classifyEngagement({
      lumens: this.lumens,
      model: this.scene.model,
      nodes: r.nodes,
      count: r.count,
      tipDir: r.tipDir,
      radius: c.spec.radius,
      nodeForce: r.contactForce,
      crossedValve: c.contacts.flags.crossedValve,
      restTangents: c.restTangents,
    });
    this.classCache = { version: this.version, reading };
    return reading;
  }

  /**
   * The catheter tip is wedged: the classifier's damping risk exceeds WEDGED_RISK (a pressure trace
   * would damp or ventricularise). Feeds HubReaction.wedged for S8, S9 and S14.
   */
  wedged(): boolean {
    const r = this.classify();
    return !!r && r.dampingRisk > WEDGED_RISK;
  }

  // -------------------------------------------------------------------------
  // Snapshots
  // -------------------------------------------------------------------------

  /**
   * Devices loaded from a DeviceSpec object rather than a catalogue id, by id, so restore() can
   * rebuild them. A snapshot taken in another engine (or another worker) can be restored once the
   * same spec has been registered there with registerSpec().
   */
  private customSpecs = new Map<string, DeviceSpec>();

  registerSpec(spec: DeviceSpec): void {
    this.customSpecs.set(spec.id, spec);
  }

  private specFor(id: string, isWire: boolean): DeviceSpec {
    const custom = this.customSpecs.get(id);
    if (custom) return custom;
    if (id === "DEVICE") return innerDeviceSpec();
    try {
      return isWire ? wireSpec(id) : catheterSpec(id);
    } catch {
      throw new Error(`physics restore: device "${id}" is not in the catalogue; call registerSpec() with its DeviceSpec first`);
    }
  }

  snapshot(): EngineSnapshot {
    const devs: EngineSnapshot["devices"] = [];
    for (const d of [this.catheter, this.wire]) {
      if (!d) continue;
      const r = d.rod;
      const arrays: EngineSnapshot["devices"][number]["arrays"] = {
        pos: r.pos.slice(),
        quat: r.quat.slice(),
        prevPos: r.prevPos.slice(),
        prevQuat: r.prevQuat.slice(),
        kin: r.kin.slice(),
        restQ: r.restQ.slice(),
        restRot: r.restRot.slice(),
        alB: r.alB.slice(),
        cActive: r.cActive.slice(),
        cN: r.cN.slice(),
        cNrm: r.cNrm.slice(),
        cMu: r.cMu.slice(),
        cEta: r.cEta.slice(),
        cSlip: r.cSlip.slice(),
        cRegion: r.cRegion.slice(),
        hints: d.contacts.hints.slice(),
        stuck: d.contacts.stuck.slice(),
        prevTip: d.prevTip.slice(),
      };
      const scalars: Record<string, number | boolean> = {
        start: d.start,
        pinned: d.pinned,
        pendingPush: d.pendingPush,
        pendingRoll: d.pendingRoll,
        hubRoll: d.hubRoll,
        axial: d.axial,
        torsion: d.torsion,
        snapTimer: d.snapTimer,
        snap: d.snap,
        advancing: d.advancing,
        held: d.held,
        crossed: d.contacts.flags.crossedValve,
        slipEvents: d.contacts.slipEvents,
        lastSlipLoad: d.contacts.lastSlipLoad,
      };
      if (d === this.catheter) {
        const c = d as Catheter;
        scalars.hubS = c.hubS;
        scalars.compositeDelta = c.compositeDelta;
        arrays.hubQ0 = c.hubQ0.slice();
        arrays.wireExt = c.wireExt.slice();
        snapshotKink(c, arrays, scalars);
      } else {
        const w = d as Wire;
        scalars.delta = w.delta;
        scalars.prevDelta = w.prevDelta;
        scalars.out = w.out;
      }
      devs.push({ slot: d.slot, specId: d.spec.id, arrays, scalars });
    }
    return {
      t: this.t,
      steps: this.steps,
      tAcc: this.tAcc,
      resp: this.resp,
      devices: devs,
      hands: { left: this.hands.left, right: this.hands.right },
      explicitGrip: this.explicitGrip,
      coronaries: this.lumens.coronaryState(),
      kinkSetup: { ...this.kinkSetup },
    };
  }

  restore(s: EngineSnapshot): void {
    // resolve every device spec first, so an unknown device throws before any state changes
    const isWireSlot = (slot: DeviceSlot) => slot === "wire035" || slot === "wire014" || slot === "balloon" || slot === "stent";
    const specs = s.devices.map((ds) => this.specFor(ds.specId, isWireSlot(ds.slot)));
    this.t = s.t;
    this.steps = s.steps;
    this.tAcc = s.tAcc;
    if (Math.abs(s.resp - this.resp) > 1e-9) {
      this.resp = s.resp;
      this.lumens.build(this.resp);
    }
    if (s.coronaries) this.lumens.restoreCoronaryState(s.coronaries);
    this.catheter = null;
    this.wire = null;
    this.version++;
    for (let di = 0; di < s.devices.length; di++) {
      const ds = s.devices[di];
      const isWire = isWireSlot(ds.slot);
      const spec = specs[di];
      if (!isWire) this.loadCatheter(spec, { slot: ds.slot });
      else this.loadWire(spec, { slot: ds.slot });
      const d = (isWire ? this.wire : this.catheter) as Device | null;
      if (!d) continue;
      const r = d.rod;
      const a = ds.arrays;
      r.pos.set(a.pos as Float64Array);
      r.quat.set(a.quat as Float64Array);
      r.prevPos.set(a.prevPos as Float64Array);
      r.prevQuat.set(a.prevQuat as Float64Array);
      r.kin.set(a.kin as Uint8Array);
      r.restQ.set(a.restQ as Float64Array);
      r.restRot.set(a.restRot as Float64Array);
      r.alB.set(a.alB as Float64Array);
      r.cActive.set(a.cActive as Uint8Array);
      r.cN.set(a.cN as Float64Array);
      r.cNrm.set(a.cNrm as Float64Array);
      r.cMu.set(a.cMu as Float64Array);
      r.cEta.set(a.cEta as Float64Array);
      r.cSlip.set(a.cSlip as Float64Array);
      r.cRegion.set(a.cRegion as Int16Array);
      d.contacts.hints.set(a.hints as Int32Array);
      if (a.stuck) d.contacts.stuck.set(a.stuck as Uint8Array);
      d.prevTip.set(a.prevTip as Float64Array);
      const sc = ds.scalars;
      d.start = sc.start as number;
      d.pinned = sc.pinned as boolean;
      d.pendingPush = sc.pendingPush as number;
      d.pendingRoll = sc.pendingRoll as number;
      d.hubRoll = sc.hubRoll as number;
      d.axial = sc.axial as number;
      d.torsion = sc.torsion as number;
      d.snapTimer = sc.snapTimer as number;
      d.snap = (sc.snap as boolean) ?? false;
      d.advancing = (sc.advancing as number) ?? 0;
      d.held = (sc.held as boolean) ?? true;
      d.contacts.flags.crossedValve = sc.crossed as boolean;
      d.contacts.slipEvents = (sc.slipEvents as number) ?? 0;
      d.contacts.lastSlipLoad = (sc.lastSlipLoad as number) ?? 0;
      if (!isWire) {
        const c = d as Catheter;
        c.hubS = sc.hubS as number;
        c.compositeDelta = sc.compositeDelta as number;
        c.hubQ0.set(a.hubQ0 as Float64Array);
        c.wireExt.set(a.wireExt as Float64Array);
        restoreKink(c, a, sc);
      } else {
        const w = d as Wire;
        w.delta = sc.delta as number;
        w.prevDelta = sc.prevDelta as number;
        w.out = sc.out as boolean;
      }
    }
    this.hands = { left: s.hands?.left ?? null, right: s.hands?.right ?? null };
    this.explicitGrip = s.explicitGrip ?? false;
    this.kinkSetup = { ...DEFAULT_KINK_SETUP, ...(s.kinkSetup ?? {}) };
    // the rod's rest shape (restQ, restRot, alB), the brake weights and the braked mobility came back with the snapshot
  }
}

/** Bending energy (N·mm) of the joints within u < uMax of the tip, relative to the rest shape. */
function distalBendEnergy(rod: Rod, uMax: number): number {
  const q = new Float64Array(16);
  let E = 0;
  for (let k = 0; k < rod.n - 1; k++) {
    if (rod.uJ[k] > uMax) continue;
    const qa = 4 * k, qb = 4 * (k + 1), r = 4 * k;
    q[0] = -rod.restQ[r]; q[1] = -rod.restQ[r + 1]; q[2] = -rod.restQ[r + 2]; q[3] = rod.restQ[r + 3];
    q[4] = -rod.quat[qa]; q[5] = -rod.quat[qa + 1]; q[6] = -rod.quat[qa + 2]; q[7] = rod.quat[qa + 3];
    qmul(q, 0, q, 4, q, 8);
    qmul(q, 8, rod.quat, qb, q, 12);
    const cx = 2 * q[12], cy = 2 * q[13];
    E += (0.5 * (cx * cx + cy * cy)) / rod.alB[k];
  }
  return E;
}

const restTangentCache = new Map<string, Float32Array>();

/** Unit tangents of a device's free shape (towards the tip), tip first, one per mm, with 200 mm of straight shaft beyond the arcs. */
export function restTangentsOf(spec: DeviceSpec): Float32Array {
  const key = spec.id + ":" + JSON.stringify(spec.arcs);
  const hit = restTangentCache.get(key);
  if (hit) return hit;
  const pts = freeShape(spec.arcs, 1);
  const tang: number[] = [];
  // freeShape runs from the shaft to the tip; walk it backwards
  for (let i = pts.length - 1; i > 0; i--) {
    const a = pts[i - 1], b = pts[i];
    const l = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) || 1;
    tang.push((b.x - a.x) / l, (b.y - a.y) / l, (b.z - a.z) / l);
  }
  if (!tang.length) tang.push(0, -1, 0);
  // straight shaft (freeShape starts with the shaft pointing −y)
  for (let k = 0; k < 200; k++) tang.push(0, -1, 0);
  const out = Float32Array.from(tang);
  restTangentCache.set(key, out);
  return out;
}

const RESOLUTIONS: readonly KinkResolution[] = ["untwist", "wire", "pressurise"];
const ACTIONS: readonly KinkRecoveryAction[] = ["snare", "cuff", "pressurise", "cut-sheath", "release"];
const OUTCOMES: readonly KinkOutcome[] = ["held", "not-below-brachial", "unwound", "unchanged", "sheathed", "released", "no-catheter"];

/** The kink tracker and the kinked base shape into a snapshot's arrays and scalars. */
function snapshotKink(c: Catheter, arrays: Record<string, Float64Array | Uint8Array | Int16Array | Int32Array>, sc: Record<string, number | boolean>): void {
  const kk = c.kk;
  arrays.baseRest = c.baseRest.slice();
  arrays.baseEI = c.baseEI.slice();
  arrays.ia = c.rod.ia.slice();
  arrays.kkW = kk.w.slice();
  arrays.kkRefQ = kk.refQ.slice();
  // the ring buffer, oldest entry first
  const hist = new Float64Array(4 * kk.histCount);
  for (let i = 0; i < kk.histCount; i++) hist.set(kk.hist.subarray(histOff(kk, i), histOff(kk, i) + 4), 4 * i);
  arrays.kkHist = hist;
  sc.kkTipSpin = kk.tipSpin;
  sc.kkHandRoll = kk.handRoll;
  sc.kkStored = kk.stored;
  sc.kkTipRate = kk.tipRate;
  sc.kkOverSince = kk.overSince ?? -1;
  sc.kkHasOver = kk.overSince !== null;
  sc.kkTorqueLoss = kk.torqueLoss;
  sc.kkLatched = kk.latched;
  sc.kkResolved = kk.resolved;
  sc.kkLastBy = kk.lastResolvedBy ? RESOLUTIONS.indexOf(kk.lastResolvedBy) : -1;
  sc.kkLastAction = kk.lastAction ? ACTIONS.indexOf(kk.lastAction.action) : -1;
  sc.kkLastOutcome = kk.lastAction ? OUTCOMES.indexOf(kk.lastAction.outcome) : -1;
  sc.kkLastSeq = kk.lastAction?.seq ?? 0;
  sc.kkSeq = kk.seq;
  sc.kkCounter = kk.counter;
  const k = kk.kink;
  sc.kJoint = k ? k.joint : -1;
  if (k) {
    sc.kU = k.u;
    sc.kSev = k.severity;
    sc.kSign = k.sign;
    sc.kHub = k.hubAtLatch;
    sc.kT = k.t;
    sc.kDirX = k.dirX;
    sc.kDirY = k.dirY;
    sc.kOrig0 = k.origRest[0];
    sc.kOrig1 = k.origRest[1];
    sc.kOrig2 = k.origRest[2];
    sc.kOrigEI = k.origEI;
    sc.kHeld = k.held;
    sc.kSheathed = k.sheathed;
    sc.kWireAcross = k.wireAcross;
  }
}

/** Restore what snapshotKink saved (a snapshot without it leaves the fresh tracker of the reloaded catheter). */
function restoreKink(c: Catheter, a: Record<string, Float64Array | Uint8Array | Int16Array | Int32Array>, sc: Record<string, number | boolean>): void {
  if (!a.baseRest || !a.baseEI) return;
  const kk = c.kk;
  c.baseRest.set(a.baseRest as Float64Array);
  c.baseEI.set(a.baseEI as Float64Array);
  if (a.ia) c.rod.ia.set(a.ia as Float64Array);
  if (a.kkW) kk.w.set(a.kkW as Float64Array);
  if (a.kkRefQ) kk.refQ.set(a.kkRefQ as Float64Array);
  // oldest entry first; an engine at a coarser substep keeps the newest entries that fit
  const hist = (a.kkHist as Float64Array | undefined) ?? new Float64Array(0);
  const n = Math.min(kk.histCap, Math.floor(hist.length / 4));
  kk.hist.set(hist.subarray(hist.length - 4 * n));
  kk.histHead = 0;
  kk.histCount = n;
  kk.tipSpin = (sc.kkTipSpin as number) ?? 0;
  kk.handRoll = (sc.kkHandRoll as number) ?? 0;
  kk.stored = (sc.kkStored as number) ?? 0;
  kk.tipRate = (sc.kkTipRate as number) ?? 0;
  kk.overSince = sc.kkHasOver ? (sc.kkOverSince as number) : null;
  kk.torqueLoss = !!sc.kkTorqueLoss;
  kk.latched = (sc.kkLatched as number) ?? 0;
  kk.resolved = (sc.kkResolved as number) ?? 0;
  const by = sc.kkLastBy as number;
  kk.lastResolvedBy = by >= 0 ? RESOLUTIONS[by] ?? null : null;
  const ai = sc.kkLastAction as number, oi = sc.kkLastOutcome as number;
  kk.lastAction = ai >= 0 && oi >= 0 ? { action: ACTIONS[ai], outcome: OUTCOMES[oi], seq: (sc.kkLastSeq as number) ?? 0 } : null;
  kk.seq = (sc.kkSeq as number) ?? 0;
  kk.counter = (sc.kkCounter as number) ?? 0;
  const j = (sc.kJoint as number) ?? -1;
  kk.kink =
    j >= 0
      ? {
          joint: j,
          u: sc.kU as number,
          severity: sc.kSev as number,
          sign: sc.kSign as number,
          hubAtLatch: sc.kHub as number,
          t: sc.kT as number,
          dirX: sc.kDirX as number,
          dirY: sc.kDirY as number,
          origRest: [sc.kOrig0 as number, sc.kOrig1 as number, sc.kOrig2 as number],
          origEI: sc.kOrigEI as number,
          held: sc.kHeld as number,
          sheathed: !!sc.kSheathed,
          wireAcross: !!sc.kWireAcross,
        }
      : null;
}

function clampAbs(v: number, m: number): number {
  return v > m ? m : v < -m ? -m : v;
}

/** A fixed frame quaternion with local z along t (deterministic choice of d1). */
function orthoFrameQuat(tx: number, ty: number, tz: number, out: Float64Array): void {
  let ax = 0, ay = 1;
  const az = 0;
  if (Math.abs(ty) > 0.9) {
    ax = 1;
    ay = 0;
  }
  const d = ax * tx + ay * ty + az * tz;
  let d1x = ax - d * tx, d1y = ay - d * ty, d1z = az - d * tz;
  const l = Math.hypot(d1x, d1y, d1z) || 1;
  d1x /= l; d1y /= l; d1z /= l;
  const d2x = ty * d1z - tz * d1y, d2y = tz * d1x - tx * d1z, d2z = tx * d1y - ty * d1x;
  qfromFrame(d1x, d1y, d1z, d2x, d2y, d2z, tx, ty, tz, out, 0);
}
