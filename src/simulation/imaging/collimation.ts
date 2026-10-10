// ---------------------------------------------------------------------------
// Collimation controls of the lab shell -> ImageParams (shutters, wedges).
// The renderer draws shutter blades and semi-transparent wedge filters
// (XrayRenderer pass 4); the dose tracker integrates KAP over the collimated
// area (dose.ts fieldAreaAtIrpCm2), so closing the shutters lowers KAP.
// The wedge's primary transmission is the renderer's default (detector.ts,
// model parameter); the dose tracker does not model the wedge's dose saving.
// ---------------------------------------------------------------------------

import type { Wedge } from "../../render/xray/XrayRenderer";

/** Widest shutter travel from each edge (fraction of the field). Model parameter of the controls. */
export const MAX_SHUTTER = 0.45;

/** Symmetric pairs (horizontal blades from left and right, vertical from top and bottom) to the four-blade form. */
export function shuttersFromPairs(horizontal: number, vertical: number): [number, number, number, number] {
  const h = Math.max(0, Math.min(MAX_SHUTTER, horizontal));
  const v = Math.max(0, Math.min(MAX_SHUTTER, vertical));
  return [h, h, v, v];
}

/** Wedge control (insertion 0 out .. 1 across the whole field, edge angle in degrees) to the renderer's wedge list. */
export function wedgesFor(w: { insertion: number; angleDeg: number }): Wedge[] {
  if (!(w.insertion > 0.005)) return [];
  const ins = Math.min(1, w.insertion);
  return [{ angle: (w.angleDeg * Math.PI) / 180, offset: 1 - 2 * ins }];
}

/** Open share of the field left by the shutters (for display). */
export function openShare(sh: [number, number, number, number]): number {
  return Math.max(0, 1 - sh[0] - sh[1]) * Math.max(0, 1 - sh[2] - sh[3]);
}
