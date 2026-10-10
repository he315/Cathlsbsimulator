// ---------------------------------------------------------------------------
// The second rail's drawing (pci-two-rail-engine): the coronary wire and the
// device on the rail the hands are not working on. The rail the hands work on
// is the engine's legacy wire and device, which render/core.ts (and the wire
// and balloon modules after it) already draw; this file draws the other one
// with the same drawing (core, then the wire and balloon-fill corrections), so
// both wires look alike on fluoroscopy: a
// jailed side-branch wire beside the stent, a buddy wire, two kissing
// balloons. Nothing is drawn while the case has one wire (no rails), so the
// single-wire image is unchanged.
//
// railFlowMods adds the other rail's inflated balloon to the live flow
// conditions (a second occlusion during a kiss) for a caller of pciFlowMods.
// ---------------------------------------------------------------------------

import type { CoronaryTree } from "../../../render/xray/coronaryTree";
import type { TransportMods } from "../../../render/xray/contrastTransport";
import { sampleAtMm, type PciGeom, type PciState } from "../../../simulation/angioPci";
import { activeRailOf, railsOf, type RailState } from "../../../simulation/pci/state";
import { draw as drawCore } from "./core";
import { draw as drawWire } from "./wire";
import { draw as drawFill } from "./balloonFill";
import type { PciDrawContext, PciDrawResult } from "../pciDevicesRender";

export const id = "rails";
/** After the core devices (0) and before the wire's own redrawing (10). */
export const order = 2;

/** The rail the hands are not on, when it has a wire. */
export function otherRail(st: PciState): { index: 0 | 1; rail: RailState } | null {
  if (!st.rails) return null;
  const index: 0 | 1 = activeRailOf(st) === 0 ? 1 : 0;
  const rail = railsOf(st)[index];
  return rail.wire ? { index, rail } : null;
}

/**
 * The state as the core drawing would see it with the other rail's wire and device in the hands: its wire,
 * route, tip and device, and none of the deployed stents or complication staining (the core drawing of the
 * active rail draws those once).
 */
export function railDrawState(st: PciState, rail: RailState): PciState | null {
  const w = rail.wire;
  if (!w) return null;
  return {
    ...st,
    wire: w,
    wireKind: w.kind,
    route: w.route.slice(),
    tipMm: w.tipMm,
    tipAngle: w.tip,
    device: rail.device,
    ind: rail.ind,
    stents: [],
    dissection: null,
    perforation: null,
    rails: undefined,
    activeRail: undefined,
  };
}

/**
 * The other rail and its drawing state for one engine state, kept while the state object stays the same: the
 * drawing runs every frame, and railsOf and railDrawState allocate. The tubes themselves follow the frame's
 * heart mapping (PciDrawContext.place), so they are drawn afresh each frame.
 */
let lastSt: PciState | null = null;
let lastOther: { o: { index: 0 | 1; rail: RailState }; ds: PciState } | null = null;
function otherRailCached(st: PciState): { o: { index: 0 | 1; rail: RailState }; ds: PciState } | null {
  if (st === lastSt) return lastOther;
  lastSt = st;
  const o = st.rails ? otherRail(st) : null;
  const ds = o ? railDrawState(st, o.rail) : null;
  lastOther = o && ds ? { o, ds } : null;
  return lastOther;
}

/**
 * The other rail's wire and device, drawn as the active ones are: the core drawing, then the wire module's
 * redrawing (a reshaped or subintimal wire, a microcatheter) and the balloon's filling correction.
 */
export function draw(st: PciState, g: PciGeom, x: PciDrawContext): PciDrawResult {
  if (!st.rails) return { tubes: [], bones: [] };
  const c = otherRailCached(st);
  if (!c) return { tubes: [], bones: [] };
  const { o, ds } = c;
  const xr = { ...x, atm: o.rail.ind.atm };
  const out: PciDrawResult = { tubes: [], bones: [] };
  for (const f of [drawCore, drawWire, drawFill]) {
    const r = f(ds, g, xr);
    out.tubes.push(...r.tubes);
    out.bones.push(...r.bones);
  }
  return out;
}

/**
 * The live flow conditions with the other rail's inflated balloon added (a kiss stops antegrade contrast
 * beyond both balloons): `base` is pciFlowMods(s, st, g, tree) for the active rail.
 */
export function railFlowMods(st: PciState, g: PciGeom, tree: CoronaryTree, base: TransportMods): TransportMods {
  const o = st.rails ? otherRailCached(st)?.o : null;
  const dev = o?.rail.device;
  if (!o || !dev || !dev.inflated) return base;
  // where the balloon stops antegrade flow: its proximal end, or, for a balloon reaching into a branch (the
  // side-branch balloon of a kiss), the start of its part in that branch
  const route = o.rail.wire!.route;
  const last = g.byName.get(route[route.length - 1]);
  const branchFrom = route.length > 1 && last ? last.pathMm[0] + 0.5 : 0;
  const prox = Math.max(0, dev.centreMm - dev.lengthMm / 2);
  const at = sampleAtMm(g, route, dev.centreMm + dev.lengthMm / 2 > branchFrom && branchFrom > prox ? branchFrom : prox);
  if (!at) return base;
  const v = tree.vessels.find((x) => x.name === at.v.name) ?? at.v;
  const i = Math.max(0, Math.min(v.param.length - 1, Math.round(at.idx)));
  return { ...base, occlusions: [...(base.occlusions ?? []), { vessel: v.name, param: v.param[i], fraction: 1 }] };
}
