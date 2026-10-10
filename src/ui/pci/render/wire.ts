// ---------------------------------------------------------------------------
// The wire's shaped tip, a subintimal course, the microcatheter and a
// selective microcatheter injection (pci-wire-microcatheter). Drawn after
// render/core.ts (order 10), additively:
//
//  - the tip: core.ts draws every wire with the same small hook. When the tip
//    has been reshaped (a bend other than the default, a secondary bend or a
//    reversed hairpin) or the wire runs subintimally, this file cancels core's
//    wire tubes exactly (the same tubes with the opposite attenuation: the
//    line integrals add, so they sum to nothing) and draws the wire again:
//    the shaft on the centre line, the primary bend as a segment of its own
//    length at its effective angle, the hairpin as a 3 cm return limb. With
//    the default shape and a true-lumen wire, core's wire is left as it is.
//  - a subintimal segment is drawn outside the lumen contour, offset by the
//    lumen radius plus SUBINTIMAL_OFFSET_MM in the vessel's own frame (a 3D
//    offset, so one view shows it on the contour and the orthogonal view off
//    it), and its offset swings with the heart's own deformation of that
//    segment, so it moves out of step with the vessel through each beat. A
//    teaching approximation: the scene gives no phase, so the beat is read
//    from the stretch of the placed segment against its rest length.
//  - the microcatheter: a faint polymer tube over the wire from the guide tip
//    to its tip, with its distal marker band.
//  - a selective injection through the microcatheter fills the vessel beyond
//    its tip, and only that vessel (its route and the branches arising beyond
//    the tip), for MC_INJECTION_S seconds of procedure time; from a
//    subintimal position it stains the wall instead.
// Every value below is a MODEL PARAMETER (docs/realism/facts/pkg-pci-wire-microcatheter.md).
// ---------------------------------------------------------------------------

import { MU, type BonePrim, type TubeSpec } from "../../../render/xray/thorax";
import { samplePos, type Sample } from "../../../render/xray/coronaryTree";
import { routeSamples, sampleAtMm, tipBend, type PciGeom, type PciState } from "../../../simulation/angioPci";
import { DEFAULT_SHAPE } from "../../../simulation/pci/coronaryWire";
import { branchesOf, frameAt, radiusAtMm, routeEndMm } from "../../../simulation/pci/geometry";
import type { Vec3 } from "../../../types";
import type { PciDrawContext, PciDrawResult } from "../pciDevicesRender";

export const id = "wire";
/** After core (0): its tubes cancel core's wire when the tip is redrawn. */
export const order = 10;

/** Attenuation of the wire shaft and of its radiopaque distal coil (render/core.ts uses the same). */
export const WIRE_MU = 1.9;
export const COIL_MU = 6.5;
/** Wire tube radius (mm): 0.014 in / 2, as core.ts. */
export const WIRE_R = 0.178;
/** Radiopaque distal coil length drawn (mm), as core.ts. */
export const COIL_MM = 30;
/** A subintimal wire is drawn this far outside the lumen contour (mm): the plan's r + 0.4 mm. */
export const SUBINTIMAL_OFFSET_MM = 0.4;
/** Extra offset (mm) per unit of segment stretch: the beat-locked swing of a subintimal wire. */
export const SUBINTIMAL_SWING_MM = 12;
/** Microcatheter: outer radius (mm, about 0.034 in / 2), polymer shaft attenuation, marker band length (mm) and attenuation. */
export const MC_R = 0.43;
export const MC_MU = 0.35;
export const MC_MARKER_MM = 1;
export const MC_MARKER_MU = 3.2;
/** A selective injection shows for this long (s of procedure time), at this iodine load (mg per mm of tube) and lumen share. */
export const MC_INJECTION_S = 3;
export const MC_INJECTION_MG = 220;
export const MC_INJECTION_LUMEN = 0.92;
/** Stain of a subintimal injection: radius (mm) and iodine load (mg). */
export const MC_STAIN_R = 1.6;
export const MC_STAIN_MG = 90;

const addv = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const subv = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const scalev = (a: Vec3, k: number): Vec3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const lenv = (a: Vec3) => Math.hypot(a.x, a.y, a.z);
const norm = (a: Vec3): Vec3 => {
  const l = lenv(a) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};

/** The shape differs from the default (the tip is redrawn). */
export function reshaped(st: PciState): boolean {
  const s = st.wire.shape;
  return !!s.reversed || s.primaryDeg !== DEFAULT_SHAPE.primaryDeg || s.primaryMm !== DEFAULT_SHAPE.primaryMm || (s.secondaryDeg ?? 0) !== DEFAULT_SHAPE.secondaryDeg;
}

/** core.ts's fixed tip hook: 3 mm at 0.6 rad (render/core.ts). */
const CORE_HOOK_MM = 3;
const CORE_HOOK_RAD = 0.6;

/**
 * core.ts's wire tubes (the shaft and the coil) for this frame, built here the same way core.ts builds them
 * (the same samples, hook, coil and attenuations), so the cancellation is exact without running core's
 * whole draw a second time. render/wire.test.ts pins the equality against core's own tubes.
 */
function coreWireTubes(st: PciState, g: PciGeom, x: PciDrawContext): TubeSpec[] {
  if (st.tipMm <= 0) return [];
  const pts = routeSamples(g, st.route, 0, st.tipMm, 1.2).map(x.place);
  if (pts.length < 2) return [];
  const tb = tipBend(g, st);
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  const T = norm({ x: b.x - a.x, y: b.y - a.y, z: b.z - a.z });
  if (tb) {
    const d = norm(addv(scalev(T, Math.cos(CORE_HOOK_RAD)), scalev(tb.bend, Math.sin(CORE_HOOK_RAD))));
    pts.push(addv(b, scalev(d, CORE_HOOK_MM / 2)), addv(b, scalev(d, CORE_HOOK_MM)));
  }
  const out: TubeSpec[] = [{ pts, r: pts.map(() => WIRE_R), mu: [0, 0, WIRE_MU] }];
  let acc = 0;
  const c: Vec3[] = [pts[pts.length - 1]];
  for (let i = pts.length - 2; i >= 0 && acc < COIL_MM; i--) {
    acc += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y, pts[i + 1].z - pts[i].z);
    c.unshift(pts[i]);
  }
  out.push({ pts: c, r: c.map(() => WIRE_R), mu: [0, 0, COIL_MU] });
  return out;
}

/** The tubes with the opposite attenuation (they cancel the originals exactly). */
export function cancelling(tubes: TubeSpec[]): TubeSpec[] {
  return tubes.map((t) => ({ ...t, pts: t.pts.slice(), r: t.r.slice(), mu: (t.mu as [number, number, number]).map((m) => -m) as [number, number, number] }));
}

/** World points of the wire from the ostium to `toMm` (1.2 mm steps), with the subintimal part offset outside the lumen. */
function shaftPoints(st: PciState, g: PciGeom, x: PciDrawContext, toMm: number): Vec3[] {
  const sub = st.wire.subintimal;
  const out: Vec3[] = [];
  const step = 1.2;
  for (let mm = 0; mm <= toMm + 1e-6; mm = mm + step > toMm && mm < toMm - 1e-6 ? toMm : mm + step) {
    const at = sampleAtMm(g, st.route, mm);
    if (!at) continue;
    let p = x.place(at.s);
    if (sub && mm >= sub.fromMm) p = subintimalPoint(st, g, x, mm, at, p);
    out.push(p);
    if (mm >= toMm - 1e-6) break;
  }
  return out;
}

/**
 * A subintimal point: the placed centre-line point moved out by the lumen radius plus the offset, along the
 * vessel's epicardial normal (rest frame), with a swing that follows the stretch of the segment this frame.
 */
function subintimalPoint(st: PciState, g: PciGeom, x: PciDrawContext, mm: number, at: { v: { name: string }; s: Sample; idx: number }, p: Vec3): Vec3 {
  const v = g.byName.get(at.v.name);
  if (!v) return p;
  const i = Math.max(0, Math.min(v.samples.length - 2, Math.floor(at.idx)));
  const fr = frameAt(g, v, i);
  const r = radiusAtMm(g, st.route, mm);
  // the heart's deformation of this short segment now: placed length over rest length
  const a = v.samples[i];
  const b = v.samples[Math.min(v.samples.length - 1, i + 1)];
  const restLen = lenv(subv(samplePos(g.tree.heart, b), samplePos(g.tree.heart, a)));
  const placedLen = lenv(subv(x.place(b), x.place(a)));
  const stretch = restLen > 1e-6 ? placedLen / restLen - 1 : 0;
  const off = r + SUBINTIMAL_OFFSET_MM + Math.max(-SUBINTIMAL_OFFSET_MM, SUBINTIMAL_SWING_MM * stretch);
  return addv(p, scalev(norm(fr.N), off));
}

/** The radiopaque coil: the last COIL_MM of a polyline. */
function coil(pts: Vec3[]): Vec3[] {
  let acc = 0;
  const out: Vec3[] = [pts[pts.length - 1]];
  for (let i = pts.length - 2; i >= 0 && acc < COIL_MM; i--) {
    acc += lenv(subv(pts[i + 1], pts[i]));
    out.unshift(pts[i]);
  }
  return out;
}

/** The wire redrawn: the shaft (offset where it is subintimal) and the tip in its own shape. */
function redrawWire(st: PciState, g: PciGeom, x: PciDrawContext): TubeSpec[] {
  const w = st.wire;
  const shape = w.shape;
  const tubes: TubeSpec[] = [];
  const tb = tipBend(g, st);
  // the primary bend: the last primaryMm of the wire leaves the centre line at the effective bend angle
  const bendMm = shape.reversed ? 0 : Math.min(Math.max(0.3, shape.primaryMm), Math.max(0, st.tipMm - 0.5));
  const pts = shaftPoints(st, g, x, st.tipMm - bendMm);
  if (pts.length < 2) return tubes;
  const end = pts[pts.length - 1];
  const T = norm(subv(end, pts[pts.length - 2]));
  if (shape.reversed) {
    // the hairpin: the bend leads, the free end runs back along the vessel beside the shaft (about 3 cm)
    const side = tb ? norm(tb.bend) : norm({ x: -T.y, y: T.x, z: 0 });
    const back: Vec3[] = [];
    let acc = 0;
    for (let i = pts.length - 1; i >= 0 && acc <= Math.max(10, shape.primaryMm); i--) {
      if (i < pts.length - 1) acc += lenv(subv(pts[i + 1], pts[i]));
      back.push(addv(pts[i], scalev(side, 0.5)));
    }
    pts.push(...back);
  } else if (tb && bendMm > 0) {
    const d = norm(addv(scalev(T, Math.cos(tb.angle)), scalev(norm(tb.bend), Math.sin(tb.angle))));
    pts.push(addv(end, scalev(d, bendMm / 2)), addv(end, scalev(d, bendMm)));
  }
  tubes.push({ pts, r: pts.map(() => WIRE_R), mu: [0, 0, WIRE_MU] });
  const c = coil(shape.reversed ? pts.slice(0, Math.max(2, pts.length - Math.floor(pts.length / 3))) : pts);
  if (c.length >= 2) tubes.push({ pts: c, r: c.map(() => WIRE_R), mu: [0, 0, COIL_MU] });
  return tubes;
}

/** The microcatheter over the wire and its distal marker band. */
function microcatheter(st: PciState, g: PciGeom, x: PciDrawContext): TubeSpec[] {
  const m = st.wire.micro;
  if (!m || m.tipMm <= 0.5) return [];
  const sm = routeSamples(g, st.route, 0, m.tipMm, 1.2);
  const pts = sm.map(x.place);
  if (pts.length < 2) return [];
  const out: TubeSpec[] = [{ pts, r: pts.map(() => MC_R), mu: [MC_MU, 0, 0] }];
  const mk = routeSamples(g, st.route, Math.max(0, m.tipMm - MC_MARKER_MM - 0.5), m.tipMm - 0.5, 0.5).map(x.place);
  if (mk.length >= 2) out.push({ pts: mk, r: mk.map(() => MC_R * 0.9), mu: [0, 0, MC_MARKER_MU] });
  return out;
}

/** A recent selective injection: contrast beyond the microcatheter tip in its own vessel, or a wall stain. */
function microInjection(st: PciState, g: PciGeom, x: PciDrawContext): { tubes: TubeSpec[]; bones: BonePrim[] } {
  const inj = st.wiring?.microInjection;
  const out = { tubes: [] as TubeSpec[], bones: [] as BonePrim[] };
  if (!inj) return out;
  const age = st.t - inj.t;
  if (age < 0 || age > MC_INJECTION_S) return out;
  const fade = 1 - age / MC_INJECTION_S;
  const iodine = (mg: number) => MU.iodinePerMg * mg * fade;
  if (inj.subintimal) {
    const at = sampleAtMm(g, inj.route, inj.fromMm + 1.5);
    if (at) {
      const c = x.place(at.s);
      out.bones.push({ type: 0, c, ax: [{ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }], half: [MC_STAIN_R * 1.6, MC_STAIN_R, MC_STAIN_R], mu: 0, muI: iodine(MC_STAIN_MG) / 3 });
    }
    return out;
  }
  const fill = (route: string[], from: number) => {
    const to = routeEndMm(g, route);
    const sm = routeSamples(g, route, from, to, 0.8);
    if (sm.length < 2) return;
    const pts = sm.map(x.place);
    const r = sm.map((_, i) => MC_INJECTION_LUMEN * radiusAtMm(g, route, from + ((to - from) * i) / Math.max(1, sm.length - 1)));
    out.tubes.push({ pts, r, mu: [0, iodine(MC_INJECTION_MG), 0] });
  };
  fill(inj.route, inj.fromMm);
  // the branches that arise from the injected vessel beyond the tip fill too; nothing proximal does
  const last = inj.route[inj.route.length - 1];
  for (const b of branchesOf(g, last)) if (!b.terminal && b.atMm > inj.fromMm) fill([...inj.route, b.c.name], b.atMm);
  return out;
}

/** The redrawn wire (when reshaped or subintimal), the microcatheter and a selective injection. */
export function draw(st: PciState, g: PciGeom, x: PciDrawContext): PciDrawResult {
  const tubes: TubeSpec[] = [];
  const bones: BonePrim[] = [];
  if (st.tipMm > 0 && (reshaped(st) || st.wire.subintimal)) {
    tubes.push(...cancelling(coreWireTubes(st, g, x)));
    tubes.push(...redrawWire(st, g, x));
  }
  tubes.push(...microcatheter(st, g, x));
  const inj = microInjection(st, g, x);
  tubes.push(...inj.tubes);
  bones.push(...inj.bones);
  return { tubes, bones };
}
