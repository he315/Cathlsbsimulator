// Shared helpers for the segment integrator tests (CPU references: brute-force membership and a
// boundary-refined ray-marching integral). Test-only; not exported from index.ts.
import { SEG_FLOATS, type SegmentBatch } from "./segmentPack";
import { type RayContext } from "./integrator";
import { camInfo, withDefaults, type SegmentConfig } from "./config";
import { buildThinLut } from "./thinLut";
import type { XrayCamera } from "./types";
import type { Vec3 } from "../../../types";

export type V = [number, number, number];
export const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const sub = (a: ArrayLike<number>, b: ArrayLike<number>): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dot3 = (a: ArrayLike<number>, b: ArrayLike<number>) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const norm = (a: V): V => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** Segment record read back from a batch. */
export function segOf(b: SegmentBatch, i: number) {
  const d = b.data,
    o = i * SEG_FLOATS;
  return {
    p0: [d[o], d[o + 1], d[o + 2]] as V,
    r0: d[o + 3],
    p1: [d[o + 4], d[o + 5], d[o + 6]] as V,
    r1: d[o + 7],
    c0: d[o + 8],
    c1: d[o + 9],
    k: d[o + 10],
    g: d[o + 11] | 0,
    e: [d[o + 12], d[o + 13], d[o + 14]] as V,
  };
}

/**
 * Brute-force membership in a (possibly elliptical) round cone: the solid is the union over s of
 * spheres centred at p0 + s b with radius r0 + s (r1 - r0) (the convex hull of the end spheres);
 * the signed distance to that family is convex in s, so ternary search finds its minimum.
 * Returns the axial coordinate (clamped projection) when inside, or -1.
 */
export function insideCone(p: ArrayLike<number>, s: ReturnType<typeof segOf>): number {
  let q = sub(p, s.p0);
  let b = sub(s.p1, s.p0);
  const el = Math.hypot(s.e[0], s.e[1], s.e[2]);
  const sAx = dot3(b, b) > 0 ? Math.min(1, Math.max(0, dot3(q, b) / dot3(b, b))) : 0.5;
  {
    // quick reject: the solid lies within the larger radius of the axis segment (an elliptical
    // section only narrows it)
    const rx = q[0] - sAx * b[0],
      ry = q[1] - sAx * b[1],
      rz = q[2] - sAx * b[2];
    const rm = Math.max(s.r0, s.r1) * 1.000001 + 1e-9;
    if (rx * rx + ry * ry + rz * rz > rm * rm) return -1;
  }
  if (el > 0) {
    const n: V = [s.e[0] / el, s.e[1] / el, s.e[2] / el];
    const sq = el * dot3(q, n),
      sb = el * dot3(b, n);
    q = [q[0] + sq * n[0], q[1] + sq * n[1], q[2] + sq * n[2]];
    b = [b[0] + sb * n[0], b[1] + sb * n[1], b[2] + sb * n[2]];
  }
  const f = (t: number) => Math.hypot(q[0] - t * b[0], q[1] - t * b[1], q[2] - t * b[2]) - (s.r0 + t * (s.r1 - s.r0));
  let lo = 0,
    hi = 1;
  for (let it = 0; it < 60; it++) {
    const m1 = lo + (hi - lo) / 3,
      m2 = hi - (hi - lo) / 3;
    if (f(m1) < f(m2)) hi = m2;
    else lo = m1;
  }
  return Math.min(f(0), f(1), f(0.5 * (lo + hi))) <= 0 ? sAx : -1;
}

/**
 * Ray-marching reference over [t0, t1] with `steps` nodes. Density = sum over unions (default:
 * material groups) of mu x c, where c is the concentration of the union member whose axis is
 * nearest the point among the members containing it (c linear in that member's clamped axial
 * coordinate, times its laminar factor (1 - k rho^2 / R^2)). Within a vessel the concentration
 * at a point is the local one along the vessel, which is what nearest-axis gives; it is also the
 * physical meaning of the integrator's joint partition. Steps whose ends differ in the set of
 * containing segments are split at the boundary, found by bisection, so the reference does not
 * suffer from quantisation at surfaces.
 */
export function march(b: SegmentBatch, o: V, d: V, t0: number, t1: number, steps: number, unionOf?: (seg: number) => number): V {
  const segs = Array.from({ length: b.count }, (_, i) => segOf(b, i));
  const axisDist = (p: V, s: ReturnType<typeof segOf>) => {
    const bb = sub(s.p1, s.p0);
    const q = sub(p, s.p0);
    const L2 = dot3(bb, bb);
    const t = L2 > 0 ? Math.min(1, Math.max(0, dot3(q, bb) / L2)) : 0;
    return Math.hypot(q[0] - t * bb[0], q[1] - t * bb[1], q[2] - t * bb[2]);
  };
  const at = (t: number) => {
    const p: V = [o[0] + t * d[0], o[1] + t * d[1], o[2] + t * d[2]];
    const best = new Map<number, { c: number; dist: number; mu: [number, number, number] }>();
    let key = "";
    segs.forEach((s, i) => {
      const sa = insideCone(p, s);
      if (sa < 0) return;
      key += i + ",";
      let c = s.c0 + (s.c1 - s.c0) * sa;
      if (s.k > 0) {
        const bb = sub(s.p1, s.p0);
        const q = sub(p, s.p0);
        const L = Math.hypot(...bb);
        const ax = dot3(q, bb) / L;
        const rho2 = dot3(q, q) - ax * ax;
        const R = s.r0 + (s.r1 - s.r0) * sa;
        c *= Math.max(0, 1 - (s.k * rho2) / (R * R));
      }
      const u = unionOf ? unionOf(i) : s.g;
      const dist = axisDist(p, s);
      const cur = best.get(u);
      if (!cur || dist < cur.dist) best.set(u, { c, dist, mu: b.groups[s.g].mu });
    });
    const P: V = [0, 0, 0];
    for (const { c, mu } of best.values()) {
      P[0] += mu[0] * c;
      P[1] += mu[1] * c;
      P[2] += mu[2] * c;
    }
    return { key, P };
  };
  const P: V = [0, 0, 0];
  const add = (u: number, w: number) => {
    // midpoint value over a sub-step with constant membership
    const m = at(0.5 * (u + w)).P;
    P[0] += m[0] * (w - u);
    P[1] += m[1] * (w - u);
    P[2] += m[2] * (w - u);
  };
  const h = (t1 - t0) / steps;
  let prev = at(t0);
  for (let k = 0; k < steps; k++) {
    const u = t0 + k * h,
      w = u + h;
    const cur = at(w);
    if (cur.key === prev.key) {
      if (cur.key !== "") add(u, w);
    } else {
      // one membership change inside the step: locate it
      let lo = u,
        hi = w;
      for (let it = 0; it < 40; it++) {
        const m = 0.5 * (lo + hi);
        if (at(m).key === prev.key) lo = m;
        else hi = m;
      }
      add(u, lo);
      add(lo, w);
    }
    prev = cur;
  }
  return P;
}

/** A camera looking along -z at the origin from 760 mm with a 1060 mm SID (scene geometry). */
export function testCam(field = 200): XrayCamera {
  return { src: v(0, 0, 760), detC: v(0, 0, -300), detU: v(field / 2, 0, 0), detV: v(0, field / 2, 0) };
}

/** A context for integrating with the thin path disabled (exact only). */
export function ctxFor(cam: XrayCamera, res: number, cfg: Partial<SegmentConfig> = {}): RayContext {
  return { ci: camInfo(cam, res), cfg: withDefaults(cfg), lut: buildThinLut() };
}
export const EXACT_ONLY: Partial<SegmentConfig> = { thinLoPx: -2, thinHiPx: -1 };

export function randomCone(r: () => number) {
  const p0: V = [(r() - 0.5) * 4, (r() - 0.5) * 4, (r() - 0.5) * 4];
  const dir = norm([r() - 0.5, r() - 0.5, r() - 0.5]);
  const L = r() < 0.15 ? r() * 0.3 : 0.5 + r() * 4;
  const p1: V = [p0[0] + dir[0] * L, p0[1] + dir[1] * L, p0[2] + dir[2] * L];
  const r0 = 0.2 + r() * 1.8;
  const r1 = r() < 0.2 ? r0 : 0.2 + r() * 1.8;
  return { p0, p1, r0, r1 };
}

/** A ray from far away aimed near a point, with origin 400 mm out (exercises recentring). */
export function rayNear(r: () => number, target: V, spread: number): { o: V; d: V } {
  const d = norm([r() - 0.5, r() - 0.5, r() - 0.5]);
  const aim: V = [target[0] + (r() - 0.5) * spread, target[1] + (r() - 0.5) * spread, target[2] + (r() - 0.5) * spread];
  return { o: [aim[0] - 400 * d[0], aim[1] - 400 * d[1], aim[2] - 400 * d[2]], d };
}
