// ---------------------------------------------------------------------------
// Bridge from the PCI procedure state to the S9 patient engine.
//
// Each tick the lab hands the engine what the procedure is doing to the
// patient: occlusions (an inflated balloon, a flow-limiting dissection, a
// closed side branch, embolised thrombus, air), regional no-reflow, a leak
// into the pericardium, a vagal reaction to air, the guide tip's position in
// the ostium and an open haemostatic valve. The bridge keeps what it applied
// last so it can clear what has gone (S9 integration step 5).
// ---------------------------------------------------------------------------

import type { PatientEngine } from "../patient/engine";
import { MP_CONUS_GAP_MIN, type TipInput } from "../patient/transducer";
import type { PatientEffects } from "../complications/types";
import { guideGap, type GuideState } from "./guide";

export interface BridgeMemory {
  occlusions: Set<string>;
  noReflow: boolean;
  periMlS: number;
  vagalSince: number;
  lastVf: number;
}

export function newBridge(): BridgeMemory {
  return { occlusions: new Set(), noReflow: false, periMlS: 0, vagalSince: -1e9, lastVf: -1e9 };
}

/**
 * Guide position as the engine's tip input (pci-guide-engagement). An engaged guide leaves the open
 * fraction of the ostium around its tip as the gap: 1 minus guideWedgeFraction (its outer diameter
 * against the ostial lumen, narrowed by an aorto-ostial lesion, sealed further by depth and poor
 * coaxiality: guide.ts), or the rod physics' measured open fraction; a guide extension in the vessel
 * leaves at most 0.1 (MODEL PARAMETER, as before). Side holes let aortic blood into the lumen, so the
 * trace stays aortic while the coronary is still obstructed. A guide out of the ostium reads the aorta,
 * the ventricle when it has fallen through the valve, and the conus when it has slipped into it.
 */
export function tipFromGuide(gs: GuideState, side: "left" | "right", valveOpen: boolean): TipInput {
  const holes = gs.sideHoles ? { sideHoles: true } : {};
  if (!gs.engaged) {
    if (gs.zone === "lv") return { location: "lv", lvContact: true, valveOpen };
    if (gs.zone === "conus") return { location: "coronary", side: "right", gap: MP_CONUS_GAP_MIN, conus: true, valveOpen, ...holes };
    return { location: "aorta", side, valveOpen };
  }
  let gap = guideGap(gs);
  if (gs.extensionMm !== null) gap = Math.min(gap, 0.1);
  return { location: gs.depthMm > 1 || gs.extensionMm !== null ? "coronary" : "ostium", side, gap, valveOpen, ...holes };
}

/** Apply the procedure's effects to the engine (diffing against what was applied before). */
export function applyEffects(eng: PatientEngine, mem: BridgeMemory, fx: PatientEffects, now: number, rnd: () => number = Math.random): void {
  const seen = new Set<string>();
  for (const o of fx.occlusions) {
    eng.setOcclusion(`pci:${o.id}`, { vessel: o.vessel, param: o.param, fraction: o.fraction });
    seen.add(o.id);
  }
  for (const id of mem.occlusions) if (!seen.has(id)) eng.clearOcclusion(`pci:${id}`);
  mem.occlusions = seen;
  if (fx.noReflow) {
    eng.clearNoReflow();
    eng.setNoReflow(fx.noReflow.vessel, fx.noReflow.param, fx.noReflow.severity);
    mem.noReflow = true;
  } else if (mem.noReflow) {
    eng.clearNoReflow();
    mem.noReflow = false;
  }
  if (Math.abs(fx.pericardialMlS - mem.periMlS) > 1e-6) {
    eng.setPericardialInflow(fx.pericardialMlS);
    mem.periMlS = fx.pericardialMlS;
  }
  // air: a vagal, bradycardic reaction (at most every 20 s) and a VF hazard for large volumes
  if (fx.vagal > 0.3 && now - mem.vagalSince > 20) {
    eng.stimulus("balloon", Math.min(1, fx.vagal));
    mem.vagalSince = now;
  }
  if (fx.vfPerS > 0 && now - mem.lastVf > 1) {
    mem.lastVf = now;
    if (rnd() < fx.vfPerS) eng.forceRhythm("vf", "air embolism");
  }
}

/** The live flow scale is passed to the contrast transport in steps of this size (keeps the transport's cache warm). MODEL PARAMETER. */
export const MP_FLOW_SCALE_STEP = 0.05;
/** Changes smaller than this from rest are not passed (the engine's resting flow wanders a few per cent with the rate-pressure product). MODEL PARAMETER. */
export const MP_FLOW_SCALE_DEADBAND = 0.1;
/**
 * A trunk not yet passed is passed only once its flow differs from rest by this much (the deadband and one step:
 * hysteresis, so a flow that sits at the deadband's edge, as a resting STEMI patient's does, is not passed and
 * dropped from second to second). MODEL PARAMETER.
 */
export const MP_FLOW_SCALE_ENTER = MP_FLOW_SCALE_DEADBAND + MP_FLOW_SCALE_STEP;
/**
 * No flow scale is passed in the first seconds of a run, while the guide settles in the ostium and the engine's
 * tip input passes through a brief wedge (lad-focal at wire-across: the left ostial flow reads 0 from about 0.3 s
 * to 1.1 s). MODEL PARAMETER (s of lab time).
 */
export const MP_FLOW_SCALE_START_S = 1.5;

/** What engineFlowScale reads from the patient engine. */
export interface FlowScalePort {
  coronaryFlowScale(vessel: string): number;
}

/**
 * The patient's live coronary flow over rest for the contrast transport (pci-patient-coupling): the engine's
 * coronaryFlowScale for each main trunk of the drawn tree (the vessels leaving the sinuses and their first
 * branches), rounded to MP_FLOW_SCALE_STEP. A trunk is passed once its flow differs from rest by
 * MP_FLOW_SCALE_ENTER, and dropped again when the difference falls below MP_FLOW_SCALE_DEADBAND; while it is
 * passed, its value (`prev`, the last record) is kept until the flow has moved a whole step from it. Undefined
 * when no trunk is passed, so the transport runs on resting flows exactly as before.
 */
export function engineFlowScale(
  eng: FlowScalePort,
  tree: { vessels: readonly { name: string; parent?: { name: string } | null; kind?: string }[] },
  prev?: Readonly<Record<string, number>>,
): Record<string, number> | undefined {
  const byName = new Map(tree.vessels.map((v) => [v.name, v]));
  let out: Record<string, number> | undefined;
  for (const v of tree.vessels) {
    if (v.kind === "collateral") continue;
    const p = v.parent ? byName.get(v.parent.name) : undefined;
    const trunk = !v.parent || (p && !p.parent);
    if (!trunk) continue;
    const x = eng.coronaryFlowScale(v.name);
    if (!Number.isFinite(x)) continue;
    const dev = Math.abs(Math.max(0, x) - 1);
    const held = prev?.[v.name];
    if (held !== undefined) {
      if (dev < MP_FLOW_SCALE_DEADBAND - 1e-9) continue;
      if (Math.abs(Math.max(0, x) - held) < MP_FLOW_SCALE_STEP - 1e-9) {
        (out ??= {})[v.name] = held;
        continue;
      }
    } else if (dev < MP_FLOW_SCALE_ENTER - 1e-9) continue;
    const q = Math.round(Math.max(0, x) / MP_FLOW_SCALE_STEP) * MP_FLOW_SCALE_STEP;
    (out ??= {})[v.name] = Math.round(q * 100) / 100;
  }
  return out;
}
