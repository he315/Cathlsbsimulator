// ---------------------------------------------------------------------------
// A mechanical chest compression device in the image (pci-patient-coupling).
//
// During mechanical CPR in the PCI lab a piston device sits over the lower
// sternum: a suction-cup pad on the chest and the piston above it, which
// obscures the posteroanterior view (the lab request pm-support-choice#3,
// Yadav and Truong 2018: coronary work then moves to oblique projections).
// The pad and the piston move with each compression, in step with the
// engine's chest-compression pressure (MP_ENGINE.cprRate), so the motion is
// seen in the image: along the beam in the PA view (a small change of size)
// and across it in the obliques.
//
// The session passes the device's state on the draw context's ctx
// (CprDrawCtx.cpr): where the lower sternum is (thorax world coordinates, from
// the patient's thorax genome) and the compression depth now. With nothing
// passed nothing is drawn, so every other scene is unchanged.
//
// Every dimension and attenuation below is a MODEL PARAMETER (the manuals
// give none: docs/realism/facts/pkg-pci-patient-coupling.md).
// ---------------------------------------------------------------------------

import type { BonePrim, TubeSpec } from "../../../render/xray/thorax";
import type { PciGeom, PciState } from "../../../simulation/angioPci";
import { MP_ENGINE } from "../../../simulation/patient/engine";
import type { Vec3 } from "../../../types";
import type { PciDrawContext, PciDrawResult } from "../pciDevicesRender";

export const id = "cpr";
/** After every coronary device: the device lies on the chest, outside the heart. */
export const order = 90;

/** MODEL PARAMETERS of the device's drawing. */
export const MP_CPR_DEVICE = {
  /** suction-cup pad radius and thickness (mm) and its plastic's attenuation excess (bone/soft channel, per mm) */
  padRadiusMm: 36,
  padThickMm: 14,
  padMu: 0.006,
  /** the cup's rim: a stiffer ring (radius as the pad's, tube radius mm, attenuation) */
  rimTubeMm: 3,
  rimMu: 0.05,
  /** the piston: radius and length above the pad (mm) and its attenuation excess (bone/soft channel, per mm: a light alloy) */
  pistonRadiusMm: 9,
  pistonLengthMm: 110,
  pistonMu: 0.06,
  /** the piston housing around it: radius (mm) and attenuation excess (bone/soft channel, per mm: plastic) */
  housingRadiusMm: 30,
  housingMu: 0.004,
  /** the compression depth the device drives (mm) */
  depthMm: 50,
  /**
   * the pad sits this far below the centre of the sternal body (mm, towards the feet): the middle of the body's
   * lower half, over the lower sternum and clear of the xiphoid (the renderer's sternal body: centre y 102 mm,
   * half-length 52 mm, thorax.ts; the session's THORAX_FRONT)
   */
  padBelowSternumMm: 26,
  /**
   * the pad's centre this far above the centre of the patient's coronary tree (mm, towards the head), the height
   * it takes when that is lower than the sternal position above. In a patient the lower sternum overlies the
   * cardiac silhouette in the PA view, but the renderer's sternal body (y 50 to 154 mm) ends above the heart
   * (lcx-stemi: the ventricles centred near y -33 mm, the coronary tree near y -32 mm), so the sternal position
   * alone put the device at the top edge of the field, off the heart. Taken from the scene's heart, the piston and
   * pad lie over the middle and upper heart, where the device hides the posteroanterior coronary view as the lab
   * request describes
   */
  padAboveHeartCentreMm: 15,
  /**
   * the support arch that holds the piston over the chest: half its width across the chest and how far its legs
   * reach behind the skin (to the back plate under the patient), its tube radius (mm) and attenuation excess
   * (bone/soft channel, per mm: a composite frame)
   */
  archHalfWidthMm: 170,
  archBackMm: 270,
  archTubeMm: 10,
  archMu: 0.012,
} as const;

/** What the session passes to draw the device. */
export interface CprDrawState {
  /** the device is on the chest (fitted or being fitted) */
  device: boolean;
  /** the skin over the lower sternum, thorax world coordinates (mm): x lateral, y cranial, z anterior */
  skin: Vec3;
  /** the compression depth now (mm, 0 released) */
  depthMm: number;
}

/** The context field the session adds (pciDevices passes the session's ctx through). */
export interface CprDrawCtx {
  cpr?: CprDrawState | null;
}

/**
 * The compression depth at patient time t (mm): the device's stroke, in step with the engine's
 * compression pressure (the same rate and shape, engine.ts stepOnce), 0 when not compressing.
 */
export function compressionDepthMm(t: number, compressing: boolean, depthMm: number = MP_CPR_DEVICE.depthMm): number {
  if (!compressing) return 0;
  const x = Math.max(0, Math.sin((2 * Math.PI * t * MP_ENGINE.cprRate) / 60));
  return depthMm * x * x;
}

/** Local axes that put a capped cylinder's axis (local y) along the world z axis (antero-posterior). */
const AXIS_Z: [Vec3, Vec3, Vec3] = [
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: -1, z: 0 },
];

/** The device's primitives for one frame. */
export function cprDevicePrims(c: CprDrawState): PciDrawResult {
  const M = MP_CPR_DEVICE;
  const tubes: TubeSpec[] = [];
  const bones: BonePrim[] = [];
  if (!c.device) return { tubes, bones };
  // the pad presses the chest in by the compression depth (posteriorly, -z)
  const z0 = c.skin.z - Math.max(0, c.depthMm);
  const cx = c.skin.x;
  const cy = c.skin.y;
  // the suction-cup pad
  bones.push({ type: 1, c: { x: cx, y: cy, z: z0 + M.padThickMm / 2 }, ax: AXIS_Z, half: [M.padRadiusMm, M.padThickMm / 2, M.padRadiusMm], mu: M.padMu });
  // its rim
  const rim: Vec3[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = (2 * Math.PI * i) / 48;
    rim.push({ x: cx + M.padRadiusMm * Math.cos(a), y: cy + M.padRadiusMm * Math.sin(a), z: z0 + 2 });
  }
  tubes.push({ pts: rim, r: rim.map(() => M.rimTubeMm), mu: [M.rimMu, 0, 0] });
  // the piston and its housing above the pad, along the antero-posterior axis: exact capped cylinders, which the
  // PA view sees end on as discs (a ribbon tube along the beam would project to nothing)
  const zc = z0 + M.padThickMm + M.pistonLengthMm / 2;
  bones.push({ type: 1, c: { x: cx, y: cy, z: zc }, ax: AXIS_Z, half: [M.housingRadiusMm, M.pistonLengthMm / 2, M.housingRadiusMm], mu: M.housingMu });
  bones.push({ type: 1, c: { x: cx, y: cy, z: zc }, ax: AXIS_Z, half: [M.pistonRadiusMm, M.pistonLengthMm / 2, M.pistonRadiusMm], mu: M.pistonMu });
  // the support arch: fixed to the back plate, so it does not move with the compressions; its bar crosses the
  // chest at the piston's top, across the posteroanterior field
  const top = c.skin.z + M.padThickMm + M.pistonLengthMm;
  const back = c.skin.z - M.archBackMm;
  const W = M.archHalfWidthMm;
  const arch: Vec3[] = [];
  for (let i = 0; i <= 8; i++) arch.push({ x: cx - W, y: cy, z: back + ((top - back) * i) / 8 });
  for (let i = 1; i < 24; i++) arch.push({ x: cx - W + (2 * W * i) / 24, y: cy, z: top });
  for (let i = 0; i <= 8; i++) arch.push({ x: cx + W, y: cy, z: top - ((top - back) * i) / 8 });
  tubes.push({ pts: arch, r: arch.map(() => M.archTubeMm), mu: [M.archMu, 0, 0] });
  return { tubes, bones };
}

/** The render registry's entry: the device when the session passes it, else nothing. */
export function draw(_st: PciState, _g: PciGeom, x: PciDrawContext): PciDrawResult {
  const c = (x.ctx as PciDrawContext["ctx"] & CprDrawCtx).cpr;
  return c ? cprDevicePrims(c) : { tubes: [], bones: [] };
}
