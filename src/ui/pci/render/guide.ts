// ---------------------------------------------------------------------------
// The guide's drawing (pci-guide-engagement).
//
// The PCI session draws the guide's shaft itself (PciLabSession.sceneFor: the
// legacy fixed path to the ostium, catheterRoot with legacyCatheter). This
// module adds, in the composer's order, the part of a deep-seated guide that
// lies inside the coronary: from the ostium along the vessel to the guide's
// depth, with the guide's outer diameter for its French size (the catalogue's
// GUIDE_LUMEN, Brilakis Table 30.4, 5 to 8 Fr) and the shaft's wall
// (CATHETER_WALL), so seating the guide deeper is seen on the image. Nothing
// is added for a guide at the ostium or out of it, so every image without a
// deep seat is unchanged.
//
// guideCatheterRoot gives the course the session's catheterRoot should take
// (the analytic tip in the root for a guide out of the ostium, the ostium
// otherwise), and guideCatheterNodes the rod solver's centre line when the rod
// guide is on (catheterNodes, with legacyCatheter false): the session has to
// pass them to buildXrayScene for the shaft itself to follow the guide; that
// edit belongs to PciLabSession.ts (see the package report). guideInjectionSeat
// gives the cine bolus seat (capture and seal) for the guide's state, for the
// session to pass in place of its fixed coaxial seat.
// ---------------------------------------------------------------------------

import { CATHETER_WALL } from "../../../render/xray/sceneBuilder";
import type { TubeSpec } from "../../../render/xray/thorax";
import { routeSamples, type PciGeom, type PciState } from "../../../simulation/angioPci";
import { GUIDE_LUMEN } from "../../../simulation/pci/equipment";
import { computeTip, initialControls } from "../../../simulation/engagement";
import { GUIDE_NON_COAXIAL, GUIDE_TOO_DEEP_MM, guideCatheterType, guideDamps, rootStart, type GuideState } from "../../../simulation/pci/guide";
import type { InjectionSeat } from "../../../simulation/contrast";
import { catheterPath } from "../../sim/helpers";
import type { AnatomyModel } from "../../../simulation/anatomy";
import type { Vec3 } from "../../../types";
import type { PciDrawContext, PciDrawResult } from "../pciDevicesRender";
import type { PhysicsDevices } from "../../physics/types";
import type { PhysicsFrame } from "../../../physics/protocol";

export const id = "guide";
/** After the core devices and before later device modules. */
export const order = 5;

/** Depth beyond the ostium (mm) from which the intravascular part of the guide is drawn. MODEL PARAMETER. */
export const DRAW_DEEP_MM = 0.3;

/** The guide's lumen holds saline in the drawn intravascular part (the shaft's lumen contrast is the session's). */
const WALL_MU: [number, number, number] = [0, CATHETER_WALL.jacket, CATHETER_WALL.braid];

/** The last drawn intravascular part per geometry: re-sampled when the side, depth (to 0.1 mm) or French size changes, re-placed when the placement does. */
interface Drawn {
  key: string;
  place: PciDrawContext["place"] | null;
  sm: ReturnType<typeof routeSamples>;
  od: number;
  idr: number;
  tubes: TubeSpec[];
}
const DRAWN = new WeakMap<PciGeom, Drawn>();

/** The part of a deep-seated guide inside the coronary. */
export function draw(st: PciState, g: PciGeom, x: PciDrawContext): PciDrawResult {
  const gs = st.guide;
  if (!gs.engaged || !(gs.depthMm > DRAW_DEEP_MM)) return { tubes: [], bones: [] };
  const root = x.s.side === "left" ? "LM" : "RCA";
  if (!g.byName.has(root)) return { tubes: [], bones: [] };
  const depth = Math.round(gs.depthMm * 10) / 10;
  const key = `${root}:${depth}:${gs.french}`;
  let d = DRAWN.get(g);
  if (!d || d.key !== key) {
    const sm = routeSamples(g, [root], 0, depth, 0.5);
    // the guide's outer diameter by French size (5 to 8 Fr, Brilakis Table 30.4), the wall 0.2 mm
    const od = GUIDE_LUMEN[gs.french].odMm / 2;
    d = { key, place: null, sm, od, idr: Math.max(0.2, od - 0.2), tubes: [] };
    DRAWN.set(g, d);
  }
  if (d.sm.length < 2) return { tubes: [], bones: [] };
  if (d.place !== x.place) {
    const pts = d.sm.map(x.place);
    const { od, idr } = d;
    d.place = x.place;
    d.tubes = [
      { pts, r: pts.map(() => od), mu: WALL_MU },
      { pts, r: pts.map(() => idr), mu: [0, -WALL_MU[1], -WALL_MU[2]] },
    ];
  }
  // the composer copies the tubes into its own list; a fresh outer array keeps the cache's own
  return { tubes: d.tubes.slice(), bones: [] };
}

/**
 * The course of the guide in the aortic root for the session's catheterRoot (aortic frame): for a guide
 * out of the ostium the analytic model's tip (computeTip with its hub position); for an engaged guide
 * the ostium of the case's coronary, as the session draws it now.
 */
export function guideCatheterRoot(model: AnatomyModel, st: PciState, side: "left" | "right"): Vec3[] {
  const gs = st.guide;
  const cath = guideCatheterType(gs.id);
  if (!gs.engaged) {
    const r = gs.root ?? rootStart(model, cath);
    const tip = computeTip(model, cath, { ...initialControls(), insertion: r.insertion, cmdInsertion: r.insertion, torque: r.torque, cmdTorque: r.torque });
    return catheterPath(model, tip, cath);
  }
  const os = side === "left" ? model.lm : model.rca;
  return catheterPath(model, { pos: os.pos, dir: os.dir, height: os.height, az: os.az, radius: model.sinusRadius, cram: 0, gap: 0 }, cath);
}

/** The rod solver's centre line of the guide inside the patient (catheterNodes), when the physics has a frame. */
export function guideCatheterNodes(physics: PhysicsDevices | null): Vec3[] | null {
  const frame = (physics as unknown as { frame?: () => PhysicsFrame | null } | null)?.frame?.();
  const c = frame?.catheter;
  if (!c || c.count < 2) return null;
  const out: Vec3[] = [];
  for (let i = Math.max(0, c.insideFrom); i < c.count; i++) out.push({ x: c.nodes[3 * i], y: c.nodes[3 * i + 1], z: c.nodes[3 * i + 2] });
  return out.length >= 2 ? out : null;
}

/**
 * The cine bolus seat for the guide's state, on the diagnostic lab's scale (src/simulation/contrast.ts
 * injectionSeat, whose values it reuses): a damping or deep-seated guide captures all of the jet and seals
 * the ostium; an engaged guide captures from 0.55 (non-coaxial) to 1 (coaxial) with room around it; a tip
 * near the ostium captures a third; a guide elsewhere in the root gives a root flush with almost no
 * coronary filling, and one in the ventricle none.
 */
export function guideInjectionSeat(gs: GuideState): InjectionSeat {
  if (gs.engaged) {
    if (guideDamps(gs) || gs.depthMm > GUIDE_TOO_DEEP_MM) return { capture: 1, seal: 0.9 };
    // the coaxiality scale of the engagement tips: GUIDE_NON_COAXIAL and below captures least
    const q = Math.max(0, Math.min(1, (gs.coaxial - GUIDE_NON_COAXIAL) / (1 - GUIDE_NON_COAXIAL)));
    return { capture: 0.55 + 0.45 * q, seal: 0.3 };
  }
  if (gs.zone === "near") return { capture: 0.35, seal: 0.05 };
  if (gs.zone === "lv") return { capture: 0, seal: 0 };
  return { capture: 0.05, seal: 0 };
}
