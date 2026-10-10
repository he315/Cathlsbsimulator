// ---------------------------------------------------------------------------
// The imaging catheter on fluoroscopy (pci-intravascular-imaging). Drawn after
// render/core.ts (order 20), additively, and only while an imaging catheter is
// on the wire (st.device.kind 'ivus'), so no other scene changes:
//
//  - core.ts draws every device on the wire as a balloon: a nearly radiolucent
//    folded sleeve with two marker bands. For an imaging catheter this file
//    cancels those tubes exactly (the same tubes with the opposite attenuation)
//    and draws the catheter as it looks: a faint polymer shaft from the guide
//    to its tip, the radiopaque transducer (IVUS) or lens (OCT) at the imaging
//    element, and the marker bands of the catheter;
//  - rotational IVUS and OCT pull the imaging core back inside the sheath: the
//    sheath and its tip marker stay where the run started while the transducer
//    or lens moves back, and the OCT core's middle marker (MP_OCT_LENS_TO_MIDDLE_MM
//    beyond the lens) and proximal marker (50 mm behind it) move with it; a
//    phased-array catheter moves back whole, its transducer near the tip.
// The pullback moves st.device.centreMm (src/simulation/pci/actions/step.ts), so
// the transducer visibly moves back on fluoroscopy during the run.
// Every value below is a MODEL PARAMETER (docs/realism/facts/pkg-pci-intravascular-imaging.md).
// ---------------------------------------------------------------------------

import type { BonePrim, TubeSpec } from "../../../render/xray/thorax";
import { routeSamples, type PciGeom, type PciState } from "../../../simulation/angioPci";
import { DEVICE_BY_ID } from "../../../simulation/pci/equipment";
import { MP_TIP_BEYOND_LENS_MM, octMarkers, type ImagingTech } from "../../../simulation/pci/ivus";
import type { PciDrawContext, PciDrawResult } from "../pciDevicesRender";

export const id = "imaging-catheter";
/** After core (0) and the wire (10): its tubes cancel core's drawing of the device. */
export const order = 20;

/** Polymer shaft attenuation (as the microcatheter's, render/wire.ts MC_MU). */
export const SHAFT_MU = 0.35;
/** Radiopaque transducer or lens: length (mm) and attenuation (core.ts's marker bands use 3.2). */
export const TRANSDUCER_MM: Record<ImagingTech, number> = { rotational: 2, "phased-array": 3, oct: 1.2 };
export const TRANSDUCER_MU = 4.5;
/** Marker bands: length (mm), attenuation. */
export const MARKER_MM = 1;
export const MARKER_MU = 3.2;

/** core.ts's tubes for a device on the wire that is not inflated (the folded sleeve and its two marker bands). */
function coreDeviceTubes(st: PciState, g: PciGeom, x: PciDrawContext): TubeSpec[] {
  const dev = st.device;
  if (!dev || !(dev.centreMm + dev.lengthMm / 2 > 0) || dev.inflated) return [];
  const from = Math.max(0, dev.centreMm - dev.lengthMm / 2);
  const to = dev.centreMm + dev.lengthMm / 2;
  const pts = routeSamples(g, st.route, from, to, 0.6).map(x.place);
  if (pts.length < 2) return [];
  const out: TubeSpec[] = [];
  out.push({ pts, r: pts.map(() => 0.45), mu: [0.02, 0, 0] });
  for (const mm of [dev.centreMm - dev.lengthMm / 2 + 0.6, dev.centreMm + dev.lengthMm / 2 - 0.6]) {
    const m = routeSamples(g, st.route, mm - 0.5, mm + 0.5, 0.5).map(x.place);
    if (m.length >= 2) out.push({ pts: m, r: m.map(() => 0.42), mu: [0, 0, 3.2] });
  }
  return out;
}

/** The tubes with the opposite attenuation (they cancel the originals exactly). */
function cancelling(tubes: TubeSpec[]): TubeSpec[] {
  // the point and radius arrays are shared, not copied: nothing mutates them
  return tubes.map((t) => ({ ...t, mu: (t.mu as [number, number, number]).map((m) => -m) as [number, number, number] }));
}

/** The catheter's parts along the route (mm): its tip, the imaging element and the marker bands. */
export function imagingCatheterLayout(st: PciState): { tech: ImagingTech; profileMm: number; tipMm: number; elementMm: number; markers: number[] } | null {
  const dev = st.device;
  if (!dev || dev.kind !== "ivus") return null;
  const spec = DEVICE_BY_ID[dev.specId];
  const tech: ImagingTech = spec?.imaging?.tech ?? "rotational";
  const profileMm = spec ? spec.profileMm(0) : 1;
  const lens = dev.centreMm;
  const acq = st.ivus?.acq;
  // the sheath stays where the run started for a core pulled back inside it (rotational, OCT)
  const sheathTip = tech !== "phased-array" && acq?.sheathTipMm != null && (st.ivus?.active || st.ivus?.recorded.length) ? acq.sheathTipMm : lens + MP_TIP_BEYOND_LENS_MM[tech];
  const markers: number[] = [];
  if (tech === "oct") {
    const m = octMarkers(lens, sheathTip);
    markers.push(m.tip - MARKER_MM / 2, m.middle, m.proximal);
  }
  else if (tech === "rotational") markers.push(sheathTip - MARKER_MM / 2);
  return { tech, profileMm, tipMm: sheathTip, elementMm: lens, markers };
}

/** The imaging catheter: core's device tubes cancelled, then the shaft, the imaging element and the markers. */
export function draw(st: PciState, g: PciGeom, x: PciDrawContext): PciDrawResult {
  const tubes: TubeSpec[] = [];
  const bones: BonePrim[] = [];
  const lay = imagingCatheterLayout(st);
  if (!lay) return { tubes, bones };
  tubes.push(...cancelling(coreDeviceTubes(st, g, x)));
  const seg = (from: number, to: number, r: number, mu: [number, number, number]) => {
    const a = Math.max(0, from);
    if (!(to > a + 0.05)) return;
    const pts = routeSamples(g, st.route, a, to, 0.6).map(x.place);
    if (pts.length >= 2) tubes.push({ pts, r: pts.map(() => r), mu });
  };
  const R = lay.profileMm / 2;
  seg(0, lay.tipMm, R, [SHAFT_MU, 0, 0]);
  const el = TRANSDUCER_MM[lay.tech];
  seg(lay.elementMm - el / 2, lay.elementMm + el / 2, R * 0.9, [0, 0, TRANSDUCER_MU]);
  for (const m of lay.markers) seg(m - MARKER_MM / 2, m + MARKER_MM / 2, R * 0.95, [0, 0, MARKER_MU]);
  return { tubes, bones };
}
