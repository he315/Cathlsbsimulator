// ---------------------------------------------------------------------------
// The balloon's filling as fluoroscopy shows it (pci-equipment-tray).
//
// render/core.ts fills every inflated balloon with diluted contrast of about
// 1:1 (175 mg I/mL). This module adds a correction tube on the same centre
// line and radii, so the balloon carries the iodine of the mixture the prep
// station put in it (src/simulation/pci/cart.ts balloonIodineMgPerMl): a
// balloon filled with saline, or never prepared, is almost invisible, a 1:2
// mixture is fainter, and residual air shows as a lucent gap at the balloon's
// proximal end (the share of its length is the air fraction, up to
// MP_AIR_GAP_MAX). A device the assisted path loaded (no mixture recorded, 1:1)
// draws nothing here, so the realism baseline's device scenes are unchanged.
// inflatedRadii repeats core.ts's profile exactly; balloonFill.test.ts checks
// that the two agree.
// ---------------------------------------------------------------------------

import { MU, type TubeSpec } from "../../../render/xray/thorax";
import { balloonDiameter, stentDiameter } from "../../../simulation/pciBench";
import { routeSamples, type PciGeom, type PciState } from "../../../simulation/angioPci";
import { MP_AIR_GAP_MAX, balloonIodineMgPerMl, deviceAir } from "../../../simulation/pci/cart";
import type { PciDrawContext, PciDrawResult } from "../pciDevicesRender";

export const id = "balloon-fill";
/** After core (0), which draws the balloon this corrects. */
export const order = 5;

/** The iodine core.ts puts in every inflated balloon (mg/mL: diluted contrast about 1:1). */
export const CORE_BALLOON_MG_PER_ML = 175;

/** The inflated balloon's centre-line samples and radii, as render/core.ts draws them (null when it draws none). */
export function inflatedRadii(st: PciState, g: PciGeom): { from: number; to: number; sm: ReturnType<typeof routeSamples>; r: number[] } | null {
  const dev = st.device;
  if (!dev || !dev.inflated || dev.centreMm + dev.lengthMm / 2 <= 0) return null;
  const from = Math.max(0, dev.centreMm - dev.lengthMm / 2);
  const to = dev.centreMm + dev.lengthMm / 2;
  const sm = routeSamples(g, st.route, from, to, 0.6);
  if (sm.length < 2) return null;
  const nominalD = dev.kind === "stent" ? stentDiameter(dev.diameter, dev.atm) : balloonDiameter(dev.balloon, dev.diameter, dev.atm);
  const yieldF = Math.max(0, 1 - Math.max(0, dev.atm - 6) / 20);
  const r = sm.map((_, i) => {
    const mm = from + ((to - from) * i) / Math.max(1, sm.length - 1);
    const inLes = st.route.includes(g.lesion.vessel) && mm > g.lesion.startMm && mm < g.lesion.endMm;
    const f = inLes ? 0.5 + 0.5 * Math.cos((Math.PI * (mm - g.lesion.centreMm)) / ((g.lesion.endMm - g.lesion.startMm) / 2)) : 0;
    const waist = 1 - st.resistance * (st.stents.length ? 0.6 : 1) * yieldF * f;
    const edge = Math.min(1, Math.min(mm - from, to - mm) / 1.5 + 0.35);
    return (nominalD / 2) * waist * edge;
  });
  return { from, to, sm, r };
}

/** The correction tubes for this frame: the mixture's iodine against core's, and the air gap. */
export function draw(st: PciState, g: PciGeom, x: PciDrawContext): PciDrawResult {
  const tubes: TubeSpec[] = [];
  const dev = st.device;
  // the assisted path's devices (no mixture recorded and prepared) keep core's drawing as it was
  if (!dev || (dev.mixture === undefined && dev.airFraction === undefined && dev.prepared)) return { tubes, bones: [] };
  const prof = inflatedRadii(st, g);
  if (!prof) return { tubes, bones: [] };
  const iodine = (mg: number) => MU.iodinePerMg * mg;
  const pts = prof.sm.map(x.place);
  const mg = balloonIodineMgPerMl(dev);
  // the air sits at the proximal end, so the mixture's own iodine fills the rest; an air-filled balloon has none
  const air = Math.min(1, deviceAir(dev));
  const fluidMg = air >= 1 ? 0 : mg / (1 - air);
  const delta = fluidMg - CORE_BALLOON_MG_PER_ML;
  if (Math.abs(delta) > 1e-6) tubes.push({ pts, r: prof.r, mu: [0, iodine(delta), 0] });
  if (air > 1e-3 && air < 1) {
    const gapTo = prof.from + (prof.to - prof.from) * Math.min(MP_AIR_GAP_MAX, air);
    // the samples are evenly spaced from `from` to `to`, so the gap is a prefix: find its last sample with a plain loop
    const n = prof.sm.length;
    const step = (prof.to - prof.from) / Math.max(1, n - 1);
    let last = -1;
    for (let i = 0; i < n && prof.from + step * i <= gapTo; i++) last = i;
    if (last >= 1) tubes.push({ pts: pts.slice(0, last + 1), r: prof.r.slice(0, last + 1), mu: [0, iodine(-fluidMg), 0] });
  }
  return { tubes, bones: [] };
}
