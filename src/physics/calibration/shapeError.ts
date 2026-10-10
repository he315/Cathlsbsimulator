// ---------------------------------------------------------------------------
// Shape error between simulated engaged catheters and real catheter
// silhouettes traced in pre-contrast frames (traces.json).
//
// Simulated side: the catheter is engaged with the scripted operator
// technique (manoeuvres.ts) on the live anatomy with the arch branches, from
// the five standard starts; every engaged end state is a candidate. Its
// centre line (aortic frame) is taken to world with the anatomy's tilt and
// projected orthographically with the run's own C-arm angles (cameraBasis,
// the renderer's projection), in mm at the catheter.
//
// Real side: the traced centre line in mm at the library's 6F scale, tip
// first (select.ts).
//
// Metric: the distal W mm (projected arclength from the tip, default 60) of
// both curves are aligned by an in-plane rotation (at most +-30 deg: patients'
// aortic roots are oriented differently from the model's) and a translation,
// minimising the mean closest-point distance; the error is the symmetric
// mean distance (real -> simulated and simulated -> real, each over its own
// distal W mm) after alignment. A run's error is the smallest over the
// candidate states of the catheters allowed for it (catheter size and the
// engaged realisation are unknown for a real run). Scale is not fitted.
// ---------------------------------------------------------------------------

import { cameraBasis } from "../../simulation/projection";
import type { RootSize } from "../../types";
import * as M from "../manoeuvres";
import * as S from "../scenarios";
import type { PhysicsEngine } from "../engine";
import type { RealTrace } from "./select";

export type P2 = [number, number];

export interface SimShape {
  catheter: string;
  root: RootSize;
  start: number;
  /** distal centre line in the aortic frame, tip first, 1 mm spacing (3D arclength), 140 mm */
  pts3: [number, number, number][];
  /** anatomy tilt (rad, about z) */
  tilt: number;
}

/** Distal centre line of the engine's catheter, tip first, resampled at `step` mm, `len` mm long. */
export function distalCentreline(eng: PhysicsEngine, len = 140, step = 1): [number, number, number][] {
  const r = eng.readDevice(eng.catheter!);
  const n = r.count;
  const out: [number, number, number][] = [];
  const P = (i: number): [number, number, number] => [r.nodes[3 * i], r.nodes[3 * i + 1], r.nodes[3 * i + 2]];
  let prev = P(n - 1);
  out.push(prev);
  let need = step;
  let acc = 0;
  for (let i = n - 2; i >= 0 && acc < len; i--) {
    const cur = P(i);
    const L = Math.hypot(cur[0] - prev[0], cur[1] - prev[1], cur[2] - prev[2]);
    let s = need;
    while (s <= L && acc + s <= len + 1e-9) {
      const f = s / L;
      out.push([prev[0] + (cur[0] - prev[0]) * f, prev[1] + (cur[1] - prev[1]) * f, prev[2] + (cur[2] - prev[2]) * f]);
      s += step;
    }
    need = s - L;
    acc += L;
    prev = cur;
  }
  return out;
}

/**
 * Orientation of the model's aortic frame in the patient, beyond the anatomy's own tilt: a rotation
 * about the antero-posterior axis (z, degrees; positive turns the top of the aorta towards the
 * patient's left) followed by one about the left-right axis (x, degrees; positive turns the top
 * of the aorta anteriorly). Zero is the renderer's convention (anatomy.toWorld).
 */
export interface RootOrientation {
  zDeg: number;
  xDeg: number;
}

export const NO_ORIENTATION: RootOrientation = { zDeg: 0, xDeg: 0 };

/** Orthographic projection (mm) with the renderer's C-arm basis; x right, y up on the image. */
export function project(pts3: [number, number, number][], tilt: number, primary: number, secondary: number, o: RootOrientation = NO_ORIENTATION): P2[] {
  const b = cameraBasis({ laoRao: primary, cranialCaudal: secondary });
  // toWorld: rotate about z by the aortic tilt, then the extra orientation (z, then x)
  const az = tilt - (o.zDeg * Math.PI) / 180;
  const c = Math.cos(az), s = Math.sin(az);
  const ax = (o.xDeg * Math.PI) / 180;
  const cx = Math.cos(ax), sx = Math.sin(ax);
  return pts3.map(([x, y, z]) => {
    const wx = x * c - y * s, wy0 = x * s + y * c;
    // about x: +xDeg moves +y towards +z (anterior)
    const wy = wy0 * cx - z * sx, wz = wy0 * sx + z * cx;
    return [wx * b.right.x + wy * b.right.y + wz * b.right.z, wx * b.up.x + wy * b.up.y + wz * b.up.z];
  });
}

/** Distal part of a tip-first polyline up to arclength W, resampled at `step`. */
export function window2(p: P2[], W: number, step = 1): P2[] {
  const out: P2[] = [p[0]];
  let acc = 0;
  let need = step;
  for (let i = 1; i < p.length && acc < W; i++) {
    const a = p[i - 1], b = p[i];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let s = need;
    while (s <= L && acc + s <= W + 1e-9) {
      out.push([a[0] + ((b[0] - a[0]) * s) / L, a[1] + ((b[1] - a[1]) * s) / L]);
      s += step;
    }
    need = s - L;
    acc += L;
  }
  return out;
}

function closestOnPolyline(px: number, py: number, poly: Float64Array, n: number, out: Float64Array): number {
  let best = Infinity;
  for (let i = 0; i < n - 1; i++) {
    const ax = poly[2 * i], ay = poly[2 * i + 1], bx = poly[2 * i + 2], by = poly[2 * i + 3];
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy || 1e-12;
    let t = ((px - ax) * dx + (py - ay) * dy) / l2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const cx = ax + dx * t, cy = ay + dy * t;
    const d2 = (px - cx) * (px - cx) + (py - cy) * (py - cy);
    if (d2 < best) {
      best = d2;
      out[0] = cx;
      out[1] = cy;
    }
  }
  return Math.sqrt(best);
}

const cbuf = new Float64Array(2);

function meanDist(a: P2[], poly: Float64Array, n: number): number {
  let s = 0;
  for (const p of a) s += closestOnPolyline(p[0], p[1], poly, n, cbuf);
  return s / a.length;
}

function toFlat(p: P2[], th: number, tx: number, ty: number): Float64Array {
  const c = Math.cos(th), s = Math.sin(th);
  const f = new Float64Array(2 * p.length);
  for (let i = 0; i < p.length; i++) {
    f[2 * i] = p[i][0] * c - p[i][1] * s + tx;
    f[2 * i + 1] = p[i][0] * s + p[i][1] * c + ty;
  }
  return f;
}

export interface AlignResult {
  /** symmetric mean distance after alignment (mm) */
  error: number;
  /** real -> simulated mean distance (mm) */
  realToSim: number;
  thetaDeg: number;
  tx: number;
  ty: number;
}

/**
 * Align a simulated projected curve (tip first) to a real one (tip first) over the distal W mm and
 * return the symmetric mean distance. `thetaStepDeg` sets the rotation search grid.
 */
export function alignShapes(real: P2[], sim: P2[], W = 60, opts: { maxThetaDeg?: number; thetaStepDeg?: number; icp?: number; sample?: number } = {}): AlignResult {
  const maxT = opts.maxThetaDeg ?? 30, stepT = opts.thetaStepDeg ?? 3, icp = opts.icp ?? 8, sample = opts.sample ?? 2;
  const R = window2(real, W, sample);
  // the simulated curve is searched over a longer stretch so the real window's far end finds its match
  const Sfull = window2(sim, W + 25, sample);
  const Sw = window2(sim, W, sample);
  const Rflat = new Float64Array(2 * R.length);
  R.forEach((p, i) => {
    Rflat[2 * i] = p[0];
    Rflat[2 * i + 1] = p[1];
  });
  const evalTheta = (thDeg: number) => {
    const th = (thDeg * Math.PI) / 180;
    const c = Math.cos(th), s = Math.sin(th);
    // start with the tips together
    let tx = R[0][0] - (Sfull[0][0] * c - Sfull[0][1] * s);
    let ty = R[0][1] - (Sfull[0][0] * s + Sfull[0][1] * c);
    for (let k = 0; k < icp; k++) {
      const poly = toFlat(Sfull, th, tx, ty);
      let mx = 0, my = 0;
      for (const p of R) {
        closestOnPolyline(p[0], p[1], poly, Sfull.length, cbuf);
        mx += p[0] - cbuf[0];
        my += p[1] - cbuf[1];
      }
      tx += mx / R.length;
      ty += my / R.length;
    }
    const polyFull = toFlat(Sfull, th, tx, ty);
    const r2s = meanDist(R, polyFull, Sfull.length);
    const simW = toFlat(Sw, th, tx, ty);
    let s2r = 0;
    for (let i = 0; i < Sw.length; i++) s2r += closestOnPolyline(simW[2 * i], simW[2 * i + 1], Rflat, R.length, cbuf);
    s2r /= Sw.length;
    return { error: 0.5 * (r2s + s2r), realToSim: r2s, thetaDeg: thDeg, tx, ty };
  };
  let best: AlignResult = { error: Infinity, realToSim: Infinity, thetaDeg: 0, tx: 0, ty: 0 };
  for (let t = -maxT; t <= maxT + 1e-9; t += stepT) {
    const r = evalTheta(t);
    if (r.error < best.error) best = r;
  }
  // refine around the best angle
  for (let t = best.thetaDeg - stepT; t <= best.thetaDeg + stepT + 1e-9; t += stepT / 4) {
    if (Math.abs(t) > maxT) continue;
    const r = evalTheta(t);
    if (r.error < best.error) best = r;
  }
  return best;
}

export interface CandidateSet {
  name: string;
  /** catheter id -> root size it is simulated in */
  members: { catheter: string; root: RootSize }[];
}

/** Engaged end states of a catheter (the scripted technique from each standard start). */
export function engagedShapes(catheter: string, root: RootSize, side: "left" | "right", starts = M.STARTS): SimShape[] {
  const out: SimShape[] = [];
  for (const back of starts) {
    const eng = M.femoralInRoot(catheter, back, root);
    if (!eng) continue;
    const tr = side === "left" ? M.judkinsLeftTechnique(eng) : M.jr4Technique(eng, 0.15);
    const at = tr[tr.length - 1];
    const ok = side === "left" ? M.engagedLm(at) : M.engagedRca(at);
    if (!ok) continue;
    // a seated catheter before injection: let it settle
    eng.step(0.5);
    out.push({ catheter, root, start: back, pts3: distalCentreline(eng), tilt: eng.scene.model.aortaTiltRad });
  }
  return out;
}

/** Run with the live anatomy and the arch branches (the app's geometry), restoring the defaults after. */
export function withLiveGeometry<T>(f: () => T): T {
  const prev = { ...S.scenarioDefaults, cfg: { ...S.scenarioDefaults.cfg } };
  S.scenarioDefaults.live = true;
  S.scenarioDefaults.archBranches = true;
  try {
    return f();
  } finally {
    S.scenarioDefaults.live = prev.live;
    S.scenarioDefaults.archBranches = prev.archBranches;
    S.scenarioDefaults.cfg = prev.cfg;
  }
}

export interface TraceScore {
  id: string;
  error: number;
  realToSim: number;
  catheter: string;
  root: RootSize;
  start: number;
  thetaDeg: number;
}

/** Best error of each trace over the candidate shapes. */
export function scoreTraces(traces: RealTrace[], shapes: SimShape[], W = 60, o: RootOrientation = NO_ORIENTATION): TraceScore[] {
  const out: TraceScore[] = [];
  for (const t of traces) {
    let best: TraceScore = { id: t.id, error: Infinity, realToSim: Infinity, catheter: "", root: "normal", start: 0, thetaDeg: 0 };
    // coarse pass on every shape, fine pass on the best three
    const coarse = shapes.map((s) => {
      const sim = project(s.pts3, s.tilt, t.primary, t.secondary, o);
      return { s, sim, r: alignShapes(t.mm, sim, W, { thetaStepDeg: 6, icp: 5, sample: 3 }) };
    });
    coarse.sort((a, b) => a.r.error - b.r.error);
    for (const c of coarse.slice(0, 3)) {
      const r = alignShapes(t.mm, c.sim, W);
      if (r.error < best.error) best = { id: t.id, error: r.error, realToSim: r.realToSim, catheter: c.s.catheter, root: c.s.root, start: c.s.start, thetaDeg: r.thetaDeg };
    }
    out.push(best);
  }
  return out;
}

export function summary(scores: TraceScore[]): { n: number; median: number; mean: number; p25: number; p75: number; within2: number } {
  const e = scores.map((s) => s.error).sort((a, b) => a - b);
  const q = (p: number) => e[Math.min(e.length - 1, Math.floor(p * (e.length - 1)))];
  return {
    n: e.length,
    median: q(0.5),
    mean: e.reduce((a, b) => a + b, 0) / Math.max(1, e.length),
    p25: q(0.25),
    p75: q(0.75),
    within2: e.filter((x) => x <= 2).length / Math.max(1, e.length),
  };
}
