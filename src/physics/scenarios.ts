// ---------------------------------------------------------------------------
// Scripted hand trajectories shared by the manoeuvre tests, the bench and the
// mentor's future demonstrations. Each helper only issues HandCommands to the
// engine (push, torque, pin) and steps the patient clock, exactly as the hands
// would; nothing here moves the rods directly.
// ---------------------------------------------------------------------------

import type { AccessRoute, AnatomyCase, AnatomyVariant, RootSize } from "../types";
import { buildAnatomy } from "../simulation/anatomy";
import { PhysicsEngine, type EngineConfig } from "./engine";
import type { EngagementReading } from "./engagementClassifier";
import { fixtureAnatomy, fixtureCourse } from "./fixtures";
import type { DeviceSpec } from "./catheterShapes";

export function caseFor(route: AccessRoute, rootSize: RootSize, variants: AnatomyVariant[] = [], rootRotationDeg = 0): AnatomyCase {
  return {
    id: `physics-${route}-${rootSize}`,
    name: "physics scenario",
    difficulty: 1,
    accessRoute: route,
    rootSize,
    rootRotationDeg,
    aortaTiltDeg: 0,
    dominance: "right",
    variants,
    pathology: "none",
    lesions: [],
    recommendedCatheters: [],
    acceptableCatheters: [],
    requiredViews: [],
    traps: [],
    objectives: [],
    teachingSummary: "",
  };
}

/**
 * Geometry and solver settings that makeEngine applies when the caller does not pass its own.
 * The robustness matrix (robustness.ts, manoeuvres.matrix.test.ts) switches these to run the same
 * scripted manoeuvres on the live anatomy and at each configuration bench.chooseConfig can return.
 */
export const scenarioDefaults: {
  /** use the live buildAnatomy()/thorax.aorticCourse geometry instead of the frozen fixture */
  live: boolean;
  /** include the arch branches that are not the access route */
  archBranches: boolean;
  /** solver configuration merged under the caller's */
  cfg: Partial<EngineConfig>;
} = { live: false, archBranches: false, cfg: {} };

/**
 * An engine on the frozen test geometry (fixtures.ts) by default, or on the live anatomy.ts /
 * thorax.ts geometry with `live: true` (or scenarioDefaults.live).
 */
export function makeEngine(
  route: AccessRoute,
  rootSize: RootSize = "normal",
  cfg: Partial<EngineConfig> = {},
  variants: AnatomyVariant[] = [],
  live = false
): PhysicsEngine {
  const config = { ...scenarioDefaults.cfg, ...cfg };
  const archBranches = scenarioDefaults.archBranches;
  if (live || scenarioDefaults.live || variants.length) {
    const c = caseFor(route, rootSize, variants);
    return new PhysicsEngine({ model: buildAnatomy(c), route, variants, archBranches }, config);
  }
  // the arch branches that are not the route are left out of the regression geometry by default: a
  // wire-led catheter entering the innominate from below is real but is not what these tests examine
  return new PhysicsEngine({ model: fixtureAnatomy(rootSize), route, aorticCourse: fixtureCourse, archBranches }, config);
}

export const PATIENT_LEFT: [number, number, number] = [1, 0, 0];
/** "Pointing left" as the operator sees it in a 45° left anterior oblique view: towards the patient's left and posterior. */
export const LAO_LEFT: [number, number, number] = [Math.SQRT1_2, 0, -Math.SQRT1_2];

/**
 * A catheter loaded over a 0.035 in J wire in the ascending aorta, its curve presented towards
 * `facing` (the operator orients the curve before seating, as in an LAO view).
 */
export function parkOverWire(
  eng: PhysicsEngine,
  catheterId: string | DeviceSpec,
  o: { tipBack?: number; facing?: [number, number, number]; wire?: string; wireLead?: number } = {}
): void {
  eng.loadCatheter(catheterId, { tipS: eng.lumens.routeLength - (o.tipBack ?? 90), facing: o.facing ?? LAO_LEFT });
  eng.loadWire(o.wire ?? "J", { advance: o.wireLead ?? 30 });
  eng.step(0.3);
}

export function tipOf(eng: PhysicsEngine): [number, number, number] {
  return eng.readDevice(eng.catheter!).tip;
}

/** Advance the catheter (with its wire) in steps until the tip is in the root, below yMax. */
export function advanceToRoot(eng: PhysicsEngine, yMax = 22, stepMm = 6, maxSteps = 80): boolean {
  for (let i = 0; i < maxSteps; i++) {
    const t = tipOf(eng);
    if (t[1] < yMax && Math.hypot(t[0], t[2]) < eng.lumens.root.R + 4) return true;
    eng.command({ kind: "push", device: "catheter", mm: stepMm });
    eng.step(0.1);
  }
  return false;
}

/** Pull the wire back into the catheter (well clear of the curve) and let the curve form. */
export function withdrawWire(eng: PhysicsEngine, settle = 2.5): void {
  const w = eng.wire;
  if (!w) return;
  eng.command({ kind: "push", device: w.slot, mm: -(Math.max(0, w.delta) + 160) });
  eng.step(settle);
}

export interface Trajectory {
  /** catheter push per step (mm) */
  pushMm?: number;
  /** catheter hub rotation per step (rad, clockwise +) */
  torqueRad?: number;
  steps: number;
  /** patient time per step (s) */
  dt?: number;
  /** stop early when this returns true */
  until?: (r: EngagementReading) => boolean;
}

/** Run a hand trajectory; returns the classifier reading after every step. */
export function runTrajectory(eng: PhysicsEngine, tr: Trajectory): EngagementReading[] {
  const out: EngagementReading[] = [];
  for (let i = 0; i < tr.steps; i++) {
    if (tr.pushMm) eng.command({ kind: "push", device: "catheter", mm: tr.pushMm });
    if (tr.torqueRad) eng.command({ kind: "torque", device: "catheter", rad: tr.torqueRad });
    eng.step(tr.dt ?? 0.5);
    const r = eng.classify()!;
    out.push(r);
    if (tr.until?.(r)) break;
  }
  return out;
}

/** Tip azimuth about the aortic axis (degrees, atan2(z, x)). */
export function tipAzimuth(eng: PhysicsEngine): number {
  const t = tipOf(eng);
  return (Math.atan2(t[2], t[0]) * 180) / Math.PI;
}

/** Azimuth (degrees) of the tip direction's horizontal component. */
export function tipDirAzimuth(eng: PhysicsEngine): number {
  const d = eng.readDevice(eng.catheter!).tipDir;
  return (Math.atan2(d[2], d[0]) * 180) / Math.PI;
}

/**
 * Turn the catheter until its tip points towards `facing` (horizontal direction), the way an operator
 * corrects the tip under fluoroscopy: small hub rotations, looking after each one. Clockwise rotation
 * (positive) carries the tip towards increasing azimuth when the shaft comes down the aorta.
 * Returns true when the tip is within tolDeg.
 */
export function faceTip(eng: PhysicsEngine, facing: [number, number, number], tolDeg = 20, maxSteps = 40): boolean {
  const target = (Math.atan2(facing[2], facing[0]) * 180) / Math.PI;
  for (let i = 0; i < maxSteps; i++) {
    let err = target - tipDirAzimuth(eng);
    while (err > 180) err -= 360;
    while (err < -180) err += 360;
    if (Math.abs(err) < tolDeg) return true;
    const rad = Math.max(-0.35, Math.min(0.35, (err * Math.PI) / 180 * 0.6));
    eng.command({ kind: "torque", device: "catheter", rad });
    eng.step(0.25);
  }
  return false;
}

/** Advance (or withdraw, negative) the catheter until its tip is below (above) height y. */
export function moveTipToHeight(eng: PhysicsEngine, y: number, stepMm = 3, maxSteps = 60): boolean {
  for (let i = 0; i < maxSteps; i++) {
    const t = tipOf(eng);
    if (stepMm > 0 ? t[1] <= y : t[1] >= y) return true;
    eng.command({ kind: "push", device: "catheter", mm: stepMm });
    eng.step(0.2);
  }
  return false;
}
