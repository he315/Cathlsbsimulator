// ---------------------------------------------------------------------------
// Route geometry for PCI devices on the rendered coronary tree.
//
// A coronary device (wire, balloon, stent, imaging catheter) lives on a route:
// the named vessels from the ostium to its tip. Positions along the route are
// path distances from the coronary ostium (mm), the same `pathMm` the tree
// carries, so every engine (wire, delivery, stent, physiology, imaging,
// complications) and the renderer index one geometry.
//
// Frames and take-offs use the rest geometry (no heart motion): the moving
// image places the same samples with `place()` each frame.
// ---------------------------------------------------------------------------

import type { Vec3, VesselId } from "../../types";
import { samplePos, type CoronaryTree, type Sample, type TreeVessel } from "../../render/xray/coronaryTree";

export interface LesionGeom {
  vessel: string;
  startMm: number;
  endMm: number;
  centreMm: number;
  /** reference (disease-free) diameter at the lesion centre (mm) */
  refDiameter: number;
}

export interface PciGeom {
  tree: CoronaryTree;
  byName: Map<string, TreeVessel>;
  /** the same vessels without disease (reference diameters) */
  refByName: Map<string, TreeVessel>;
  /** named children of each vessel (space-filling twigs excluded) */
  children: Map<string, TreeVessel[]>;
  /** the active target lesion's extent along its vessel's path (mm); changes only through setTarget() */
  lesion: LesionGeom;
  /** every lesion of the case, in scenario order (the active target is lesions[targetIdx]) */
  lesions: LesionGeom[];
  targetIdx: number;
  /** rest positions and curvature per vessel, filled lazily */
  cache: { pos: Map<string, Vec3[]>; kappa: Map<string, number[]> };
}

/** A lesion as the geometry needs it: where it is along its vessel and how long it is. */
export interface LesionSite {
  vessel: VesselId;
  position: number;
  lengthMm: number;
}

/**
 * What the geometry needs from a scenario: the active target and, for a multi-lesion scenario
 * (pci-scenario-registry), every lesion with the index of the target among them. `target` stays the
 * source of the active lesion, so a caller that overrides it moves the target.
 */
export interface LesionTarget {
  target: LesionSite;
  lesions?: readonly LesionSite[];
  targetIdx?: number;
}

/** Index the tree for device navigation. `refTree` is the same anatomy without lesions (reference diameters). */
export function pciGeom(s: LesionTarget, tree: CoronaryTree, refTree: CoronaryTree): PciGeom {
  const byName = new Map(tree.vessels.map((v) => [v.name, v]));
  const children = new Map<string, TreeVessel[]>();
  for (const v of tree.vessels) {
    if (!v.parent || v.name.includes("twig") || v.kind === "collateral") continue;
    const arr = children.get(v.parent.name) ?? [];
    arr.push(v);
    children.set(v.parent.name, arr);
  }
  const targetIdx = s.lesions?.length ? Math.max(0, Math.min(s.lesions.length - 1, s.targetIdx ?? 0)) : 0;
  const sites = s.lesions?.length ? s.lesions.map((l, i) => (i === targetIdx ? s.target : l)) : [s.target];
  const lesions = sites.map((l) => lesionGeom(l, tree, refTree));
  return {
    tree,
    byName,
    refByName: new Map(refTree.vessels.map((v) => [v.name, v])),
    children,
    lesion: lesions[targetIdx],
    lesions,
    targetIdx,
    cache: { pos: new Map(), kappa: new Map() },
  };
}

/** Extent of one lesion along its vessel's path (mm) and its reference diameter. */
export function lesionGeom(l: LesionSite, tree: CoronaryTree, refTree: CoronaryTree): LesionGeom {
  const tv = tree.vessels.find((v) => v.name === l.vessel || (v.lesionId === l.vessel && !v.name.includes("twig")));
  if (!tv) throw new Error(`pciGeom: no vessel ${l.vessel} in the tree`);
  const i = nearestParam(tv, l.position);
  const centreMm = tv.pathMm[i];
  const ref = refTree.vessels.find((v) => v.name === tv.name) ?? tv;
  return {
    vessel: tv.name,
    startMm: centreMm - l.lengthMm / 2,
    endMm: centreMm + l.lengthMm / 2,
    centreMm,
    refDiameter: 2 * ref.radii[i],
  };
}

/**
 * The same geometry with lesion `idx` as the active target (g.lesion). The tree, the indexes and the
 * caches are shared; the input is not changed. The engine state's severity belongs to the target it
 * was built for, so a caller that switches target also re-seeds the lesion state it keeps.
 */
export function setTarget(g: PciGeom, idx: number): PciGeom {
  if (!Number.isInteger(idx) || idx < 0 || idx >= g.lesions.length) throw new Error(`setTarget: no lesion ${idx} (the case has ${g.lesions.length})`);
  if (idx === g.targetIdx) return g;
  return { ...g, lesion: g.lesions[idx], targetIdx: idx };
}

export function nearestParam(v: TreeVessel, t: number): number {
  let best = 0;
  for (let i = 0; i < v.param.length; i++) if (Math.abs(v.param[i] - t) < Math.abs(v.param[best] - t)) best = i;
  return best;
}

/** Where along each route vessel the route continues (sample index range). */
export function segments(g: PciGeom, route: string[]): { v: TreeVessel; i0: number; i1: number }[] {
  const out: { v: TreeVessel; i0: number; i1: number }[] = [];
  for (let k = 0; k < route.length; k++) {
    const v = g.byName.get(route[k]);
    if (!v) break;
    const next = k + 1 < route.length ? g.byName.get(route[k + 1]) : undefined;
    const i1 = next?.parent ? next.parent.index : v.samples.length - 1;
    out.push({ v, i0: 0, i1 });
  }
  return out;
}

const lerp3 = (a: Vec3, b: Vec3, f: number): Vec3 => ({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f });

/** Sample (heart coordinates) at a path distance along the route, or null inside the guide. */
export function sampleAtMm(g: PciGeom, route: string[], mm: number): { v: TreeVessel; s: Sample; idx: number } | null {
  if (mm < 0) return null;
  const segs = segments(g, route);
  for (let k = 0; k < segs.length; k++) {
    const { v, i1 } = segs[k];
    const last = k === segs.length - 1;
    if (mm > v.pathMm[i1] && !last) continue;
    for (let i = 1; i <= v.samples.length - 1; i++) {
      if (v.pathMm[i] >= mm || i === v.samples.length - 1) {
        const a = v.pathMm[i - 1],
          b = v.pathMm[i];
        const f = b > a ? Math.max(0, Math.min(1, (mm - a) / (b - a))) : 0;
        const s0 = v.samples[i - 1],
          s1 = v.samples[i];
        const s: Sample = {
          ell: s0.ell + (s1.ell - s0.ell) * f,
          phi: s0.phi + (s1.phi - s0.phi) * f,
          h: s0.h + (s1.h - s0.h) * f,
          w: s0.w + (s1.w - s0.w) * f,
          fixed: s0.fixed && s1.fixed ? lerp3(s0.fixed, s1.fixed, f) : s0.fixed ?? s1.fixed,
        };
        return { v, s, idx: i - 1 + f };
      }
    }
  }
  return null;
}

/** Samples of the route from `fromMm` to `toMm` (every `step` mm), for drawing the wire or a device. */
export function routeSamples(g: PciGeom, route: string[], fromMm: number, toMm: number, step = 1.2): Sample[] {
  const out: Sample[] = [];
  for (let mm = Math.max(0, fromMm); mm <= toMm + 1e-6; mm += step) {
    const r = sampleAtMm(g, route, mm);
    if (r) out.push(r.s);
  }
  const end = sampleAtMm(g, route, toMm);
  if (end && toMm > fromMm) out.push(end.s);
  return out;
}

/** End of the route's last vessel (mm). */
export function routeEndMm(g: PciGeom, route: string[]): number {
  const v = g.byName.get(route[route.length - 1]);
  if (!v) return 0;
  return v.pathMm[v.pathMm.length - 1];
}

/** Rest positions of a vessel's samples (cached). */
export function restPositions(g: PciGeom, v: TreeVessel): Vec3[] {
  let p = g.cache.pos.get(v.name);
  if (!p) {
    p = v.samples.map((s) => samplePos(g.tree.heart, s));
    g.cache.pos.set(v.name, p);
  }
  return p;
}

/** Curvature (1/mm) at each sample of a vessel, from the rest centre line (cached). */
export function curvature(g: PciGeom, v: TreeVessel): number[] {
  let k = g.cache.kappa.get(v.name);
  if (k) return k;
  const p = restPositions(g, v);
  k = p.map(() => 0);
  // turning angle between chords about 1.5 mm either side, divided by the arc between their midpoints
  for (let i = 0; i < p.length; i++) {
    let a = i,
      b = i;
    while (a > 0 && v.pathMm[i] - v.pathMm[a] < 1.5) a--;
    while (b < p.length - 1 && v.pathMm[b] - v.pathMm[i] < 1.5) b++;
    if (a === i || b === i) continue;
    const t1 = norm(sub(p[i], p[a]));
    const t2 = norm(sub(p[b], p[i]));
    const ang = Math.acos(Math.max(-1, Math.min(1, dot(t1, t2))));
    const ds = (v.pathMm[b] - v.pathMm[a]) / 2;
    k[i] = ds > 1e-6 ? ang / ds : 0;
  }
  g.cache.kappa.set(v.name, k);
  return k;
}

/** Local frame at a vessel sample: tangent, epicardial normal and binormal (rest geometry). */
export function frameAt(g: PciGeom, v: TreeVessel, idx: number): { p: Vec3; T: Vec3; N: Vec3; B: Vec3 } {
  const H = g.tree.heart;
  const pos = restPositions(g, v);
  const n = pos.length;
  const i = Math.max(0, Math.min(n - 2, Math.floor(idx)));
  const f = Math.max(0, Math.min(1, idx - i));
  const p = lerp3(pos[i], pos[i + 1], f);
  const T = norm(sub(pos[i + 1], pos[i]));
  // outward normal: away from the heart's long axis
  const rel = sub(p, H.base);
  const along = dot(rel, H.L);
  const radial = sub(rel, scale(H.L, along));
  let N = sub(radial, scale(T, dot(radial, T)));
  N = len(N) > 1e-6 ? norm(N) : norm(cross(T, { x: 0, y: 1, z: 0 }));
  const B = cross(T, N);
  return { p, T, N, B };
}

export interface TakeOff {
  /** unit direction of the branch's first ~3 mm (rest geometry) */
  dir: Vec3;
  /** angle about the parent axis (rad, 0 = epicardial normal, +π/2 = binormal) */
  azimuth: number;
  /** angle between the branch and the parent's forward direction (rad): ~0.5 a diagonal, ~1.4 a septal */
  polar: number;
  /** parent and branch lumen radius at the origin (mm) */
  parentRadius: number;
  childRadius: number;
  /** origin on the parent (path mm) */
  atMm: number;
}

/** 3D take-off of a branch relative to its parent at the origin. */
export function takeOff(g: PciGeom, child: TreeVessel): TakeOff {
  const parent = g.byName.get(child.parent!.name)!;
  const pi = Math.min(parent.samples.length - 2, child.parent!.index);
  const { p, T, N, B } = frameAt(g, parent, pi);
  const cp = restPositions(g, child);
  // first sample at least 3 mm along the branch (or the last)
  let k = 1;
  while (k < cp.length - 1 && child.pathMm[k] - child.pathMm[0] < 3) k++;
  const d = norm(sub(cp[Math.min(k, cp.length - 1)], p));
  const lat = sub(d, scale(T, dot(d, T)));
  const refP = g.refByName.get(parent.name) ?? parent;
  const refC = g.refByName.get(child.name) ?? child;
  return {
    dir: d,
    azimuth: Math.atan2(dot(lat, B), dot(lat, N)),
    polar: Math.acos(Math.max(-1, Math.min(1, dot(d, T)))),
    parentRadius: refP.radii[pi] ?? parent.radii[pi],
    childRadius: refC.radii[0] ?? child.radii[0],
    atMm: parent.pathMm[child.parent!.index],
  };
}

/** Take-off angle of a child branch about the parent's axis (radians, 0 = epicardial normal). */
export function takeOffAngle(g: PciGeom, child: TreeVessel): number {
  return takeOff(g, child).azimuth;
}

/** Lumen radius of the route at `mm`, from the tree passed (diseased) or the reference tree. */
export function radiusAtMm(g: PciGeom, route: string[], mm: number, ref = false): number {
  const a = sampleAtMm(g, route, Math.max(0, mm));
  if (!a) return 1.5;
  const v = ref ? g.refByName.get(a.v.name) ?? a.v : a.v;
  const i = Math.floor(a.idx);
  const f = a.idx - i;
  const r0 = v.radii[Math.min(v.radii.length - 1, i)];
  const r1 = v.radii[Math.min(v.radii.length - 1, i + 1)];
  return r0 + (r1 - r0) * f;
}

/** Curvature of the route at `mm` (1/mm). */
export function curvatureAtMm(g: PciGeom, route: string[], mm: number): number {
  const a = sampleAtMm(g, route, Math.max(0, mm));
  if (!a) return 0;
  const k = curvature(g, a.v);
  return k[Math.min(k.length - 1, Math.round(a.idx))];
}

/**
 * Integrals of curvature along the route between two positions (step 1 mm):
 * total turning (rad) and ∫κ² ds (1/mm), the two measures of how hard the route bends a device.
 */
export function bendIntegrals(g: PciGeom, route: string[], fromMm: number, toMm: number): { turning: number; k2: number; kMax: number } {
  let turning = 0,
    k2 = 0,
    kMax = 0;
  for (let mm = Math.max(0, fromMm); mm < toMm; mm += 1) {
    const k = curvatureAtMm(g, route, mm);
    const ds = Math.min(1, toMm - mm);
    turning += k * ds;
    k2 += k * k * ds;
    kMax = Math.max(kMax, k);
  }
  return { turning, k2, kMax };
}

/** Named branches arising from a vessel, with their origin on it (path mm), proximal first. */
export function branchesOf(g: PciGeom, vessel: string): { c: TreeVessel; atMm: number; terminal: boolean }[] {
  const v = g.byName.get(vessel);
  if (!v) return [];
  return (g.children.get(vessel) ?? [])
    .map((c) => ({ c, atMm: v.pathMm[c.parent!.index], terminal: c.parent!.index >= v.samples.length - 2 }))
    .sort((a, b) => a.atMm - b.atMm);
}

/** Path from the ostium to a vessel, as vessel names. */
export function pathTo(g: PciGeom, vessel: string): string[] {
  const out: string[] = [];
  let v = g.byName.get(vessel);
  while (v) {
    out.unshift(v.name);
    v = v.parent ? g.byName.get(v.parent.name) : undefined;
  }
  return out;
}

/** Route mm → the vessel and its 0..1 parameter (for lesion and occlusion positions). */
export function paramAtMm(g: PciGeom, route: string[], mm: number): { vessel: string; param: number; lesionId: VesselId | null } | null {
  const a = sampleAtMm(g, route, Math.max(0, mm));
  if (!a) return null;
  const v = a.v;
  const i = Math.floor(a.idx);
  const f = a.idx - i;
  const p0 = v.param[Math.min(v.param.length - 1, i)];
  const p1 = v.param[Math.min(v.param.length - 1, i + 1)];
  return { vessel: v.name, param: p0 + (p1 - p0) * f, lesionId: v.lesionId };
}

// --- vector helpers -------------------------------------------------------------
export const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const add = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const scale = (a: Vec3, k: number): Vec3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
export const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const len = (a: Vec3) => Math.hypot(a.x, a.y, a.z);
export const norm = (a: Vec3): Vec3 => {
  const l = len(a) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};
export const cross = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
/** Wrap an angle to (−π, π]. */
export const wrap = (a: number) => {
  let x = a % (2 * Math.PI);
  if (x <= -Math.PI) x += 2 * Math.PI;
  if (x > Math.PI) x -= 2 * Math.PI;
  return x;
};
