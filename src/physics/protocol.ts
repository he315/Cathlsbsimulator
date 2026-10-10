// ---------------------------------------------------------------------------
// Messages between the main thread (physicsClient.ts) and the physics worker
// (physicsWorker.ts). Everything is structured-clone friendly; node buffers
// travel as transferable Float32Arrays.
// ---------------------------------------------------------------------------

import type { AccessRoute, AnatomyVariant, Vec3 } from "../types";
import type { AnatomyModel } from "../simulation/anatomy";
import type { DeviceSlot, HandCommand, HubReaction } from "../simulation/session/types";
import type { EngineConfig, DeviceReadout, EngineSnapshot, KinkCommand } from "./engine";
import type { CoronaryInput } from "./lumen";
import type { EngagementReading } from "./engagementClassifier";

export interface SceneInit {
  model: AnatomyModel;
  route: AccessRoute;
  variants?: AnatomyVariant[];
  coronaries?: CoronaryInput[];
  resp?: number;
  /** aortic course polylines (thorax.aorticCourse without its final root point), if the main thread supplies them */
  course?: Record<AccessRoute, Vec3[]>;
  archBranches?: boolean;
  /**
   * Solver configuration, or "auto": the worker runs a short bench at init on this scene
   * (bench.autoConfig) and uses the finest validated configuration whose measured full-frame cost
   * is within bench.AUTO_MARGIN of the budget on this machine.
   */
  config?: Partial<EngineConfig> | "auto";
  /** per-frame solver budget for "auto" (ms, default 2) */
  budgetMs?: number;
  /** patient clock time at start (s) */
  t0?: number;
}

export interface LoadOpts {
  tipS?: number;
  roll?: number | "auto";
  facing?: [number, number, number];
  advance?: number;
  slot?: DeviceSlot;
}

export interface MotionMsg {
  resp?: number;
  coronaries?: CoronaryInput[];
}

export type ToWorker =
  | { type: "init"; scene: SceneInit }
  | { type: "load"; device: "catheter" | "wire"; id: string; opts?: LoadOpts }
  | { type: "remove"; device: "catheter" | "wire" }
  /**
   * Hand commands, and the kink model's engine commands (diag-catheter-kink: set-up, recovery, a
   * scenario's start kink), which travel the same way and are applied in order (PhysicsEngine.command).
   */
  | { type: "commands"; cmds: (HandCommand | KinkCommand)[] }
  | { type: "step"; tClock: number; motion?: MotionMsg }
  | { type: "snapshot"; reqId: number }
  | { type: "restore"; snap: EngineSnapshot };

export interface PhysicsFrame {
  /** patient clock time of this state (s): the renderer evaluates the heart at this same time */
  t: number;
  steps: number;
  /** the catheter's read-out, with its kink and torque loss (DeviceReadout.kink, torqueLoss: diag-catheter-kink) */
  catheter: DeviceReadout | null;
  wire: DeviceReadout | null;
  engagement: EngagementReading | null;
  /** worker time spent producing this frame (ms) */
  stepMs: number;
  /** substeps run for this frame */
  substeps: number;
  /** hub reactions of the devices in this frame (catheter first): HubReaction for S8, S14, S15 */
  reactions: HubReaction[];
  /**
   * Measured worker cost per 1/15 s of patient time (ms): the median over the last 15 frames of
   * stepMs scaled to the substeps of one 15 frames/s frame. Compare with the budget (2 ms).
   */
  costMs?: number;
  /** costMs has exceeded the budget: the store may re-initialise at a coarser validated configuration at a quiet moment */
  overBudget?: boolean;
}

/** Configuration the worker settled on (reported with "ready"). */
export interface ConfigInfo {
  substepHz: number;
  segmentScale: number;
  /** measured worst-case full-frame cost (ms per 15 frames/s frame) of the chosen configuration, when chosen by "auto" */
  predictedMs?: number;
  /** time the "auto" bench took at init (ms) */
  initMs?: number;
  /** no validated configuration fits the budget on this machine */
  overBudget?: boolean;
}

export type FromWorker =
  | { type: "ready"; config?: ConfigInfo }
  | { type: "frame"; frame: PhysicsFrame }
  | { type: "snapshot"; reqId: number; snap: EngineSnapshot }
  | { type: "error"; message: string };

/** Longest stretch of patient time simulated per step message; beyond it the clock skips (s). */
export const MAX_CATCH_UP = 0.25;
