// ---------------------------------------------------------------------------
// The device physics adapter interface and its registry
// (diag-engagement-fallback).
//
// A lab that can drive catheters and guides by mechanics asks
// getPhysicsDevices() for an implementation. Every src/ui/physics/impl/*.ts
// that exports `physicsDevices: PhysicsDevicesImpl` registers one; nothing else
// lists them. While no implementation is registered getPhysicsDevices()
// returns null and the caller uses the analytic engagement model
// (computeEngagement in src/simulation/engagement.ts, which is the same at
// every difficulty). Test fixtures live under __fixtures__/ and are not
// globbed here.
// ---------------------------------------------------------------------------

import type { AccessRoute, AnatomyVariant, EngagementKind } from "../../types";
import type { AnatomyModel } from "../../simulation/anatomy";
import type { HandCommand } from "../../simulation/session/types";
import type { CoronaryInput } from "../../physics/lumen";

/** The devices a physics implementation can carry: a diagnostic catheter or a guiding catheter. */
export type PhysicsDeviceKind = "catheter" | "guide";

/** The scene a physics implementation is initialised with. */
export interface PhysicsSceneInit {
  model: AnatomyModel;
  route: AccessRoute;
  /** coronary centre-lines and radii (aortic frame) */
  coronaries: CoronaryInput[];
  variants?: AnatomyVariant[];
  /** patient clock time at start (s) */
  t0?: number;
}

/** Where and how a device is loaded. */
export interface PhysicsLoadOptions {
  /** how far the device is advanced beyond the implementation's start position (mm) */
  advanceMm?: number;
  /** hub roll at load (rad) */
  roll?: number;
}

/** Cardiac and respiratory motion for one step. */
export interface PhysicsMotion {
  /** respiratory phase or excursion, as the implementation defines it */
  resp?: number;
  /** moved coronaries for this step, when the heart has moved them */
  coronaries?: CoronaryInput[];
}

/** The newest reading of the loaded catheter or guide. */
export interface PhysicsReading {
  /** patient clock time of this reading (s) */
  t: number;
  /** coronary vessel holding the tip, or null */
  vessel: string | null;
  side: "left" | "right" | null;
  /** depth beyond the ostium along the vessel (mm); negative is short of it */
  depthMm: number;
  /** tip tangent against the vessel axis (-1..1); 0 when not near a coronary */
  coaxiality: number;
  /** summed wall normal force over the distal tip (N) */
  wallForce: number;
  /** fraction of the ostial lumen left open (1 is unobstructed) */
  openFraction: number;
  /** the distal catheter has folded down past the valve */
  prolapsed: boolean;
  /** engagement class in the vocabulary the labs already use, so their events stay unchanged */
  kind: EngagementKind;
  conus: boolean;
  /** measured cost of producing this reading (ms) */
  costMs: number;
}

/** One live physics session, owned by the lab session that created it. */
export interface PhysicsDevices {
  init(scene: PhysicsSceneInit): void;
  load(device: PhysicsDeviceKind, id: string, opts?: PhysicsLoadOptions): void;
  remove(device: PhysicsDeviceKind): void;
  /** queue a hand command; it takes effect with the next step */
  command(cmd: HandCommand): void;
  /** advance the physics to patient time tClock (s) */
  step(tClock: number, motion?: PhysicsMotion): void;
  /** newest complete reading, or null before the first step or with no device loaded */
  latest(): PhysicsReading | null;
  dispose(): void;
}

export interface PhysicsDevicesCreateOptions {
  /** run the solver off the main thread when possible (default true) */
  useWorker?: boolean;
}

/** A registered implementation: what an impl/*.ts file exports as `physicsDevices`. */
export interface PhysicsDevicesImpl {
  id: string;
  label: string;
  /** lower wins when several implementations are registered (default 0) */
  order?: number;
  create(opts?: PhysicsDevicesCreateOptions): PhysicsDevices;
}

export interface PhysicsDevicesModule {
  physicsDevices?: PhysicsDevicesImpl;
}

/**
 * Collect the implementations from glob modules (path to module), lowest order
 * first, then by id. Throws on a module without the export, a malformed
 * implementation or a duplicate id.
 */
export function collectPhysicsDevices(modules: Record<string, unknown>): PhysicsDevicesImpl[] {
  const out: PhysicsDevicesImpl[] = [];
  const seen = new Map<string, string>();
  for (const path of Object.keys(modules).sort()) {
    const impl = (modules[path] as PhysicsDevicesModule | undefined)?.physicsDevices;
    if (!impl) throw new Error(`physics implementation file ${path} does not export 'physicsDevices'`);
    if (typeof impl.id !== "string" || !impl.id) throw new Error(`${path}: physics implementation id missing`);
    if (typeof impl.label !== "string" || !impl.label) throw new Error(`${path}: physics implementation '${impl.id}' has no label`);
    if (impl.order !== undefined && !Number.isFinite(impl.order)) throw new Error(`${path}: physics implementation '${impl.id}' has an invalid order`);
    if (typeof impl.create !== "function") throw new Error(`${path}: physics implementation '${impl.id}' has no create()`);
    const prev = seen.get(impl.id);
    if (prev) throw new Error(`physics implementation id '${impl.id}' is declared by ${prev} and ${path}`);
    seen.set(impl.id, path);
    out.push(impl);
  }
  return out.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** The implementation to use from these glob modules, or null when there is none. */
export function resolvePhysicsDevices(modules: Record<string, unknown>): PhysicsDevicesImpl | null {
  return collectPhysicsDevices(modules)[0] ?? null;
}

const FILES = import.meta.glob<PhysicsDevicesModule>(["./impl/*.ts", "!./impl/*.test.ts"], { eager: true });

let resolved: { impl: PhysicsDevicesImpl | null } | null = null;

/**
 * The registered physics implementation, or null while none exists; callers
 * then use the analytic engagement model (computeEngagement).
 */
export function getPhysicsDevices(): PhysicsDevicesImpl | null {
  if (!resolved) resolved = { impl: resolvePhysicsDevices(FILES) };
  return resolved.impl;
}
