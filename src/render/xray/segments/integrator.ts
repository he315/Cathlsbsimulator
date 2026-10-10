// ---------------------------------------------------------------------------
// CPU reference of the segment integrator. It mirrors SEG_FS (segmentGlsl.ts)
// operation for operation, so it serves both as the unit-test target and as
// the check of the GPU output in the demo page.
//
// Per detector ray, for every segment listed in the pixel's tile:
//   1. Reject unless the pixel-centre ray passes within (larger radius +
//      3 sigma of the thin PSF + 1 px) of the segment's axis.
//   2. Exact path (projected equal-area radius >= thinLoPx): the closed-form
//      interval of the ray through the round cone (sphere 0, sphere 1 and the
//      tangent frustum between them; their union is convex, so the interval
//      is [min entry, max exit]), clipped by the segment's joint planes. An
//      elliptical section is an affine stretch of a round one; the ray
//      parameter is unchanged by it. At a branch origin the host segments'
//      clipped chords are removed. Concentration is linear in the clamped
//      axial coordinate (integrated exactly, with breaks where it clamps),
//      times the mean laminar factor (1 - k rho^2 / R^2) over the chord.
//   3. Thin path (radius below thinHiPx): the cylinder chord convolved with
//      the PSF, times erf windows along the axis; integral-conserving
//      (pi r^2 L c per segment) and continuous along chains.
//   4. Contributions add (mu of the segment's group times the integral).
// There is no per-pixel list, so depth complexity is unbounded.
// ---------------------------------------------------------------------------

import { SEG_FLOATS, PREV_FLOATS, HOST_SLOT_OFFSETS, decodeHostSlot, expandHostSlot, type SegmentBatch } from "./segmentPack";
import { EDGE_FULL_PX, EDGE_LIST_MAX, EDGE_NONE_PX, SUBSAMPLES, rayThroughPixel, type CamInfo, type SegmentConfig } from "./config";
import { FLAG_MOTION, FLAG_SS, type TileBins } from "./tileBinner";
import { erfApprox, thinLookup, thinSigmaPx } from "./thinLut";

type V = [number, number, number];
const dot = (a: ArrayLike<number>, b: ArrayLike<number>) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * Ray against a round cone (convex hull of sphere (0, r0) and sphere (b, r1)), in coordinates
 * where p0 is the origin: w = ray origin - p0, d = direction (any length). Writes the parameter
 * interval to out[0..1]; returns false on a miss.
 */
export function roundConeInterval(w: ArrayLike<number>, d: ArrayLike<number>, b: ArrayLike<number>, r0: number, r1: number, out: number[]): boolean {
  const dd = dot(d, d);
  let tin = Infinity,
    tout = -Infinity;
  // spheres
  for (let s = 0; s < 2; s++) {
    const r = s === 0 ? r0 : r1;
    const ox = w[0] - (s === 0 ? 0 : b[0]),
      oy = w[1] - (s === 0 ? 0 : b[1]),
      oz = w[2] - (s === 0 ? 0 : b[2]);
    const bq = ox * d[0] + oy * d[1] + oz * d[2];
    const cq = ox * ox + oy * oy + oz * oz - r * r;
    const disc = bq * bq - dd * cq;
    if (disc > 0) {
      const sq = Math.sqrt(disc);
      tin = Math.min(tin, (-bq - sq) / dd);
      tout = Math.max(tout, (-bq + sq) / dd);
    }
  }
  const L2 = dot(b, b);
  const L = Math.sqrt(L2);
  if (L > Math.abs(r0 - r1) + 1e-7) {
    // tangent frustum: rho(h) <= rhoA + m (h - hA) for hA <= h <= hB
    const ax = b[0] / L,
      ay = b[1] / L,
      az = b[2] / L;
    const sa = (r0 - r1) / L;
    const ca = Math.sqrt(Math.max(0, 1 - sa * sa));
    const hA = r0 * sa,
      hB = L + r1 * sa;
    const rhoA = r0 * ca,
      rhoB = r1 * ca;
    const m = (rhoB - rhoA) / (hB - hA);
    const h0 = w[0] * ax + w[1] * ay + w[2] * az;
    const hd = d[0] * ax + d[1] * ay + d[2] * az;
    const c0 = rhoA + m * (h0 - hA),
      c1 = m * hd;
    const A = dd - hd * hd - c1 * c1;
    const B = 2 * (dot(w, d) - h0 * hd - c0 * c1);
    const C = dot(w, w) - h0 * h0 - c0 * c0;
    let s0: number, s1: number;
    if (Math.abs(hd) < 1e-12) {
      if (h0 < hA || h0 > hB) {
        s0 = 1;
        s1 = 0;
      } else {
        s0 = -1e30;
        s1 = 1e30;
      }
    } else {
      const ta = (hA - h0) / hd,
        tb = (hB - h0) / hd;
      s0 = Math.min(ta, tb);
      s1 = Math.max(ta, tb);
    }
    if (s0 < s1) {
      let lo = 1,
        hi = 0;
      if (Math.abs(A) < 1e-7 * dd) {
        // linear: B t + C <= 0
        if (Math.abs(B) < 1e-20) {
          if (C <= 0) {
            lo = s0;
            hi = s1;
          }
        } else {
          const ts = -C / B;
          if (B > 0) {
            lo = s0;
            hi = Math.min(s1, ts);
          } else {
            lo = Math.max(s0, ts);
            hi = s1;
          }
        }
      } else {
        const D = B * B - 4 * A * C;
        if (A > 0) {
          if (D > 0) {
            const sq = Math.sqrt(D);
            const q = -0.5 * (B + (B >= 0 ? sq : -sq));
            const ra = q / A,
              rb = q !== 0 ? C / q : ra;
            lo = Math.max(s0, Math.min(ra, rb));
            hi = Math.min(s1, Math.max(ra, rb));
          }
        } else if (D <= 0) {
          lo = s0;
          hi = s1;
        } else {
          const sq = Math.sqrt(D);
          const q = -0.5 * (B + (B >= 0 ? sq : -sq));
          const ra = q / A,
            rb = q !== 0 ? C / q : ra;
          const tl = Math.min(ra, rb),
            th = Math.max(ra, rb);
          // outside the roots, within the slab (one side only for a convex solid)
          const aLo = s0,
            aHi = Math.min(s1, tl);
          const bLo = Math.max(s0, th),
            bHi = s1;
          if (aLo < aHi) {
            lo = aLo;
            hi = aHi;
          }
          if (bLo < bHi) {
            if (lo < hi) {
              lo = Math.min(lo, bLo);
              hi = Math.max(hi, bHi);
            } else {
              lo = bLo;
              hi = bHi;
            }
          }
        }
      }
      if (lo < hi) {
        tin = Math.min(tin, lo);
        tout = Math.max(tout, hi);
      }
    }
  }
  out[0] = tin;
  out[1] = tout;
  return tin < tout;
}

export interface RayContext {
  ci: CamInfo;
  cfg: SegmentConfig;
  lut: Float32Array;
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Thin-path value of one segment (local coordinates: w = ray origin - p0, d unit). */
export function thinValue(
  w: ArrayLike<number>,
  d: ArrayLike<number>,
  b: ArrayLike<number>,
  L: number,
  rA: number,
  rB: number,
  c0: number,
  c1: number,
  k: number,
  sigO: number,
  lut: Float32Array
): number {
  if (L < 1e-6 || sigO <= 0) return 0;
  const ax = b[0] / L,
    ay = b[1] / L,
    az = b[2] / L;
  const bb = d[0] * ax + d[1] * ay + d[2] * az;
  const sin2 = Math.max(1 - bb * bb, 1e-4);
  const wa = w[0] * ax + w[1] * ay + w[2] * az;
  const wd = dot(w, d);
  const t = (bb * wa - wd) / sin2;
  const s = (wa - bb * wd) / sin2;
  const px = w[0] + t * d[0] - s * ax,
    py = w[1] + t * d[1] - s * ay,
    pz = w[2] + t * d[2] - s * az;
  const dp = Math.sqrt(px * px + py * py + pz * pz);
  const sinT = Math.sqrt(sin2);
  const f = Math.min(1, Math.max(0, s / L));
  const r = rA + (rB - rA) * f;
  if (r <= 0) return 0;
  const c = (c0 + (c1 - c0) * f) * (1 - 0.5 * k);
  const h = thinLookup(lut, dp / sigO, r / sigO);
  const prof = ((Math.PI * r * r) / sigO) * h;
  const q = sinT / (Math.SQRT2 * sigO);
  const W = 0.5 * (erfApprox(s * q) - erfApprox((s - L) * q));
  return ((c * prof) / sinT) * W;
}

export interface RayResult {
  /** line integral per channel (R, G, B) */
  P: V;
  /** the part of P from the listed segments (silhouette crossing the pixel, or moving) */
  Plist: V;
  /** exact-path chords found */
  hits: number;
  /**
   * Distance (pixels) from the pixel-centre ray to the nearest silhouette of a small, contrasty
   * exact-path feature (when asked; 1e9 otherwise). Drives the anti-aliasing weight.
   */
  edgeDist: number;
  /**
   * Segments the sub-samples must re-integrate: those whose silhouette crosses the pixel (edge
   * test) or that move more than ssMotionPx within the pulse (motion test). At most
   * EDGE_LIST_MAX; listOverflow when there were more.
   */
  list: number[];
  listOverflow: boolean;
}

/** Detector pixel coordinates of a point (as tileBinner). */
function projPx(ci: CamInfo, x: number, y: number, z: number): [number, number] {
  const dx = x - ci.src[0],
    dy = y - ci.src[1],
    dz = z - ci.src[2];
  const mag = ci.sid / Math.max(1, dx * ci.n[0] + dy * ci.n[1] + dz * ci.n[2]);
  const u = mag * (dx * ci.pu[0] + dy * ci.pu[1] + dz * ci.pu[2]) - ci.ku;
  const v = mag * (dx * ci.pv[0] + dy * ci.pv[1] + dz * ci.pv[2]) - ci.kv;
  return [((u + 1) / 2) * ci.res, ((v + 1) / 2) * ci.res];
}

/** Positions of segment i at pulse fraction ms (prev-based extrapolation), into p0 / p1. */
function segPos(batch: SegmentBatch, i: number, ms: number, p0: number[], p1: number[]) {
  const D = batch.data;
  const o = i * SEG_FLOATS;
  for (let k = 0; k < 3; k++) {
    p0[k] = D[o + k];
    p1[k] = D[o + 4 + k];
  }
  const prev = batch.prev;
  if (prev && batch.motion && ms !== 0) {
    const q = i * PREV_FLOATS;
    for (let k = 0; k < 3; k++) {
      p0[k] += (p0[k] - prev[q + k]) * ms;
      p1[k] += (p1[k] - prev[q + 4 + k]) * ms;
    }
  }
}

const sp0 = [0, 0, 0],
  sp1 = [0, 0, 0],
  sbv = [0, 0, 0],
  sw = [0, 0, 0],
  sws = [0, 0, 0],
  sds = [0, 0, 0],
  sbs = [0, 0, 0],
  siv = [0, 0];

/**
 * Chord of segment i along the ray (origin o, direction d): the round cone (elliptical section
 * by an affine stretch) cut by the segment's joint planes. Positions must already be in p0 / p1.
 * Returns false when the ray misses the round cone. Writes, in the ray's local parameter (the
 * local origin is o + tc d, tc in out[2]):
 *   out[0..1]  the kept chord (empty when out[0] >= out[1]),
 *   out[3..4]  the part removed by the start plane, out[5..6] the part removed by the end plane.
 * The stretched quantities are left in sws / sds / sbs and w in sw for the caller.
 */
function chordParts(D: Float32Array, i: number, p0: number[], p1: number[], o: ArrayLike<number>, d: ArrayLike<number>, out: number[]): boolean {
  const off = i * SEG_FLOATS;
  const r0 = D[off + 3],
    r1 = D[off + 7];
  for (let k = 0; k < 3; k++) sbv[k] = p1[k] - p0[k];
  const tc = (0.5 * (p0[0] + p1[0]) - o[0]) * d[0] + (0.5 * (p0[1] + p1[1]) - o[1]) * d[1] + (0.5 * (p0[2] + p1[2]) - o[2]) * d[2];
  for (let k = 0; k < 3; k++) sw[k] = o[k] + tc * d[k] - p0[k];
  const ex = D[off + 12],
    ey = D[off + 13],
    ez = D[off + 14];
  const eL = Math.sqrt(ex * ex + ey * ey + ez * ez);
  if (eL > 0) {
    const nx = ex / eL,
      ny = ey / eL,
      nz = ez / eL;
    const a = eL * (sw[0] * nx + sw[1] * ny + sw[2] * nz);
    const b = eL * (d[0] * nx + d[1] * ny + d[2] * nz);
    const c = eL * (sbv[0] * nx + sbv[1] * ny + sbv[2] * nz);
    sws[0] = sw[0] + a * nx;
    sws[1] = sw[1] + a * ny;
    sws[2] = sw[2] + a * nz;
    sds[0] = d[0] + b * nx;
    sds[1] = d[1] + b * ny;
    sds[2] = d[2] + b * nz;
    sbs[0] = sbv[0] + c * nx;
    sbs[1] = sbv[1] + c * ny;
    sbs[2] = sbv[2] + c * nz;
  } else {
    for (let k = 0; k < 3; k++) {
      sws[k] = sw[k];
      sds[k] = d[k];
      sbs[k] = sbv[k];
    }
  }
  out[2] = tc;
  out[3] = out[5] = 1;
  out[4] = out[6] = 0;
  if (!roundConeInterval(sws, sds, sbs, r0, r1, siv)) {
    out[0] = 1;
    out[1] = 0;
    return false;
  }
  let t0 = siv[0],
    t1 = siv[1];
  // joint planes: inward normal n through p (p0 for the start, p1 for the end): n . (x - p) >= 0;
  // the start plane acts on the raw chord, the end plane on what the start plane kept
  for (let e = 0; e < 2; e++) {
    const nx = D[off + 16 + e * 4],
      ny = D[off + 17 + e * 4],
      nz = D[off + 18 + e * 4];
    if (nx === 0 && ny === 0 && nz === 0) continue;
    if (!(t0 < t1)) break;
    const wx = sw[0] - (e ? sbv[0] : 0),
      wy = sw[1] - (e ? sbv[1] : 0),
      wz = sw[2] - (e ? sbv[2] : 0);
    const num = nx * wx + ny * wy + nz * wz;
    const den = nx * d[0] + ny * d[1] + nz * d[2];
    let k0 = t0,
      k1 = t1,
      m0 = 1,
      m1 = 0;
    if (Math.abs(den) < 1e-12) {
      if (num < 0) {
        m0 = t0;
        m1 = t1;
        k0 = 1;
        k1 = 0;
      }
    } else {
      const ts = -num / den;
      if (den > 0) {
        k0 = Math.max(t0, ts);
        m0 = t0;
        m1 = Math.min(t1, ts);
      } else {
        k1 = Math.min(t1, ts);
        m0 = Math.max(t0, ts);
        m1 = t1;
      }
    }
    out[3 + e * 2] = m0;
    out[4 + e * 2] = m1;
    t0 = k0;
    t1 = k1;
  }
  out[0] = t0;
  out[1] = t1;
  return true;
}

/** Remove [ha, hb] from the pieces list (pairs, count np); returns the new count. */
function subtractPiece(pieces: number[], np: number, ha: number, hb: number): number {
  if (!(ha < hb)) return np;
  const tmp = pieces.slice(0, np * 2);
  let w = 0;
  for (let q = 0; q < np; q++) {
    const a = tmp[q * 2],
      b = tmp[q * 2 + 1];
    if (hb <= a || ha >= b) {
      pieces[w * 2] = a;
      pieces[w * 2 + 1] = b;
      w++;
      continue;
    }
    if (ha > a) {
      pieces[w * 2] = a;
      pieces[w * 2 + 1] = ha;
      w++;
    }
    if (hb < b) {
      pieces[w * 2] = hb;
      pieces[w * 2 + 1] = b;
      w++;
    }
  }
  return w;
}

/**
 * Integral of c over local [a, b], c = mix(c0, c1, clamp(sw + sd t, 0, 1)): piecewise linear
 * with breaks where s crosses 0 and 1, so the trapezoid rule over those pieces is exact.
 */
function concIntegral(a: number, b: number, sw0: number, sd: number, c0: number, c1: number): number {
  const c = (t: number) => c0 + (c1 - c0) * Math.min(1, Math.max(0, sw0 + sd * t));
  let lo = Infinity,
    hi = Infinity;
  if (Math.abs(sd) > 1e-12) {
    const u0 = -sw0 / sd,
      u1 = (1 - sw0) / sd;
    lo = Math.min(u0, u1);
    hi = Math.max(u0, u1);
  }
  let sum = 0,
    x = a,
    cx = c(a);
  for (const br of [lo, hi, b]) {
    if (br <= x || br > b) continue;
    const cb = c(br);
    sum += (br - x) * 0.5 * (cx + cb);
    x = br;
    cx = cb;
  }
  return sum;
}

/**
 * Integrate one ray (origin `o`, unit directions `dEx` for the exact path and `dTh` for the thin
 * path) over the listed segments (null = all). `tau` is the pulse time fraction (-0.5..0.5) for
 * moving segments. `classify` asks for the per-segment tests on this ray (bit 0: silhouette within
 * a pixel, bit 1: moving within the pulse; both always use the pixel-centre direction dTh and the
 * current positions); `listOnly` integrates only the segments those tests select.
 */
export function integrateRay(
  batch: SegmentBatch,
  list: ArrayLike<number> | null,
  listOff: number,
  listCount: number,
  o: ArrayLike<number>,
  dEx: ArrayLike<number>,
  dTh: ArrayLike<number>,
  ctx: RayContext,
  tau = 0,
  classify = 0,
  listOnly = false
): RayResult {
  const { ci, cfg, lut } = ctx;
  const D = batch.data;
  const ms = batch.motion ? (tau * batch.motion.pulseS) / Math.max(1e-6, batch.motion.dtS) : 0;
  const P: V = [0, 0, 0],
    Plist: V = [0, 0, 0];
  const list2: number[] = [];
  let listOverflow = false;
  const prevArr = batch.prev && batch.motion ? batch.prev : null;
  const pulseScale = batch.motion ? batch.motion.pulseS / Math.max(1e-6, batch.motion.dtS) : 0;
  const wantEdge = (classify & 1) !== 0,
    wantMove = (classify & 2) !== 0 && !!prevArr;
  let edgeDist = 1e9,
    hits = 0;
  const n = list ? listCount : batch.count;
  const p0 = [0, 0, 0],
    p1 = [0, 0, 0],
    h0 = [0, 0, 0],
    h1 = [0, 0, 0],
    bv = [0, 0, 0],
    wt = [0, 0, 0],
    iv = [0, 0, 0, 0, 0, 0, 0],
    hv = [0, 0, 0, 0, 0, 0, 0];
  const pieces = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let e = 0; e < n; e++) {
    const i = list ? list[listOff + e] : e;
    const o24 = i * SEG_FLOATS;
    segPos(batch, i, ms, p0, p1);
    const r0 = D[o24 + 3],
      r1 = D[o24 + 7];
    for (let k = 0; k < 3; k++) bv[k] = p1[k] - p0[k];
    const L2 = dot(bv, bv);
    const L = Math.sqrt(L2);
    const vx = 0.5 * (p0[0] + p1[0]) - o[0],
      vy = 0.5 * (p0[1] + p1[1]) - o[1],
      vz = 0.5 * (p0[2] + p1[2]) - o[2];
    // depth along the central ray, for magnification only (rays not from the source are clamped)
    const along = Math.max(1, vx * ci.n[0] + vy * ci.n[1] + vz * ci.n[2]);
    const mag = ci.sid / along;
    const pxObj = ci.mmPerPx / mag;
    const sigO = thinSigmaPx(cfg.psf, along, ci.sid, ci.mmPerPx) * pxObj;
    // reject: distance from the pixel-centre ray to the segment axis (clamped), against the larger
    // radius plus 3 sigma of the thin-path PSF plus one pixel of slack for sub-samples
    const br = Math.max(r0, r1) + 3 * sigO + pxObj;
    // a ray origin next to the segment (mirrors the shader, where float32 needs it)
    const tq = vx * dTh[0] + vy * dTh[1] + vz * dTh[2];
    const ocx = o[0] + tq * dTh[0],
      ocy = o[1] + tq * dTh[1],
      ocz = o[2] + tq * dTh[2];
    {
      const qx = p0[0] - ocx,
        qy = p0[1] - ocy,
        qz = p0[2] - ocz;
      const bb = bv[0] * dTh[0] + bv[1] * dTh[1] + bv[2] * dTh[2];
      const den = Math.max(L2 - bb * bb, 1e-12 * Math.max(L2, 1e-12));
      const sc = L2 > 0 ? Math.min(1, Math.max(0, (bb * (qx * dTh[0] + qy * dTh[1] + qz * dTh[2]) - (qx * bv[0] + qy * bv[1] + qz * bv[2])) / den)) : 0;
      const px = qx + sc * bv[0],
        py = qy + sc * bv[1],
        pz = qz + sc * bv[2];
      const pd = px * dTh[0] + py * dTh[1] + pz * dTh[2];
      if (px * px + py * py + pz * pz - pd * pd > br * br) continue;
    }
    const c0 = D[o24 + 8],
      c1 = D[o24 + 9],
      kk = D[o24 + 10];
    const g = D[o24 + 11] | 0;
    const mu = batch.groups[g].mu;
    const ex = D[o24 + 12],
      ey = D[o24 + 13],
      ez = D[o24 + 14];
    const eL = Math.sqrt(ex * ex + ey * ey + ez * ez);
    const sqRatio = 1 / Math.sqrt(1 + eL);
    const rEqPx = (0.5 * (r0 + r1) * sqRatio * mag) / ci.mmPerPx;
    const wEx = smoothstep(cfg.thinLoPx, cfg.thinHiPx, rEqPx);
    // edge distance for adaptive anti-aliasing: how close the pixel-centre ray passes to the
    // silhouette of a small exact-path feature (radius or shell wall under ssFeaturePx)
    let isEdge = false;
    if (wantEdge && wEx > 0 && eL === 0 && L > 0) {
      const wall = batch.groups[g].featureMm;
      const featPx = (Math.min(Math.min(r0, r1), wall) * mag) / ci.mmPerPx;
      const contrast = (Math.abs(mu[0]) + Math.abs(mu[1]) + Math.abs(mu[2])) * Math.max(Math.abs(c0), Math.abs(c1)) * (r0 + r1);
      if (featPx < cfg.ssFeaturePx && contrast >= cfg.ssMinContrast) {
        const ax = bv[0] / L,
          ay = bv[1] / L,
          az = bv[2] / L;
        const qx = p0[0] - ocx,
          qy = p0[1] - ocy,
          qz = p0[2] - ocz;
        const bb = ax * dTh[0] + ay * dTh[1] + az * dTh[2];
        const qa = qx * ax + qy * ay + qz * az,
          qd = qx * dTh[0] + qy * dTh[1] + qz * dTh[2];
        const sin2 = Math.max(1 - bb * bb, 1e-6);
        const sc = Math.min(L, Math.max(0, (bb * qd - qa) / sin2));
        const px = qx + sc * ax,
          py = qy + sc * ay,
          pz = qz + sc * az;
        const pd = px * dTh[0] + py * dTh[1] + pz * dTh[2];
        const dpe = Math.sqrt(Math.max(0, px * px + py * py + pz * pz - pd * pd));
        const rs = r0 + ((r1 - r0) * sc) / L;
        const ed = Math.abs(dpe - rs) / pxObj;
        edgeDist = Math.min(edgeDist, ed);
        isEdge = ed < EDGE_NONE_PX;
      }
    }
    // motion test: the middle's screen displacement over the pulse (current positions)
    let isMoving = false;
    if (wantMove && prevArr) {
      const q = i * PREV_FLOATS;
      const mxN = 0.5 * (D[o24] + D[o24 + 4]),
        myN = 0.5 * (D[o24 + 1] + D[o24 + 5]),
        mzN = 0.5 * (D[o24 + 2] + D[o24 + 6]);
      const hx = 0.5 * pulseScale * (mxN - 0.5 * (prevArr[q] + prevArr[q + 4])),
        hy = 0.5 * pulseScale * (myN - 0.5 * (prevArr[q + 1] + prevArr[q + 5])),
        hz = 0.5 * pulseScale * (mzN - 0.5 * (prevArr[q + 2] + prevArr[q + 6]));
      const a = projPx(ci, mxN - hx, myN - hy, mzN - hz),
        b = projPx(ci, mxN + hx, myN + hy, mzN + hz);
      isMoving = Math.hypot(a[0] - b[0], a[1] - b[1]) > cfg.ssMotionPx;
    }
    const isListed = isEdge || isMoving;
    if (isListed && classify !== 0 && !listOnly) {
      if (list2.length < EDGE_LIST_MAX) list2.push(i);
      else listOverflow = true;
    }
    // the sub-samples re-integrate only the listed segments; the others keep their centre-ray
    // value (contributions add)
    if (listOnly && !isListed) continue;
    let value = 0;
    // exact path: the kept chord minus the host chords; plus, at planar joints between segments of
    // different taper, the part the plane removed that the neighbour does not cover (back-fill)
    if (wEx > 0 && chordParts(D, i, p0, p1, o, dEx, iv)) {
      const t0 = iv[0],
        t1 = iv[1],
        tc = iv[2];
      const rS0 = iv[3],
        rS1 = iv[4],
        rE0 = iv[5],
        rE1 = iv[6];
      const sw0 = L2 > 0 ? dot(sw, bv) / L2 : 0.5;
      const sd = L2 > 0 ? dot(dEx, bv) / L2 : 0;
      // laminar factor over the kept chord (stretched frame left by chordParts)
      let f = 1;
      if (kk > 0 && t0 < t1) {
        const bl = Math.sqrt(dot(sbs, sbs));
        const ax = bl > 0 ? sbs[0] / bl : 0,
          ay = bl > 0 ? sbs[1] / bl : 0,
          az = bl > 0 ? sbs[2] / bl : 0;
        const hh0 = sws[0] * ax + sws[1] * ay + sws[2] * az;
        const hd = sds[0] * ax + sds[1] * ay + sds[2] * az;
        const A2 = dot(sds, sds) - hd * hd;
        const B2 = 2 * (dot(sws, sds) - hh0 * hd);
        const C2 = dot(sws, sws) - hh0 * hh0;
        const mean = (A2 * (t0 * t0 + t0 * t1 + t1 * t1)) / 3 + (B2 * (t0 + t1)) / 2 + C2;
        const sm = Math.min(1, Math.max(0, sw0 + sd * 0.5 * (t0 + t1)));
        const R = r0 + (r1 - r0) * sm;
        f = R > 0 ? Math.min(1, Math.max(0, 1 - (kk * mean) / (R * R))) : 1;
      }
      let I = 0;
      if (t0 < t1) {
        hits++;
        let np = 1;
        pieces[0] = t0;
        pieces[1] = t1;
        const subHost = (h: number) => {
          if (h >= batch.count || np === 0) return;
          segPos(batch, h, ms, h0, h1);
          if (!chordParts(D, h, h0, h1, o, dEx, hv) || !(hv[0] < hv[1])) return;
          np = subtractPiece(pieces, np, hv[0] + hv[2] - tc, hv[1] + hv[2] - tc);
        };
        for (const slot of HOST_SLOT_OFFSETS) {
          const sv = D[o24 + slot];
          const [hf, hc] = decodeHostSlot(sv);
          if (hc > 0) for (let hk = 0; hk < hc; hk++) subHost(hf + hk);
          else if (hc < 0) for (const h of expandHostSlot(sv, batch.hostExtra)) subHost(h);
        }
        for (let q = 0; q < np; q++) I += concIntegral(pieces[q * 2], pieces[q * 2 + 1], sw0, sd, c0, c1);
      }
      // back-fill (no laminar factor: a thin rim at the joint)
      for (let side = 0; side < 2; side++) {
        const m0 = side ? rE0 : rS0,
          m1 = side ? rE1 : rS1;
        if (!(m0 < m1)) continue;
        // only a chain joint (unit normal, made by addChain) has a neighbour: a flat end cut or a
        // plane given to addSegment (longer normals) does not; the neighbour must exist and share
        // the joint point
        const no = o24 + (side ? 20 : 16);
        const nn = D[no] * D[no] + D[no + 1] * D[no + 1] + D[no + 2] * D[no + 2];
        if (nn > 1.21 || nn < 0.81) continue;
        const nb = side ? i + 1 : i - 1;
        if (nb < 0 || nb >= batch.count) continue;
        const nbo = nb * SEG_FLOATS;
        {
          const a = side ? o24 + 4 : o24,
            b = side ? nbo : nbo + 4;
          if (D[a] !== D[b] || D[a + 1] !== D[b + 1] || D[a + 2] !== D[b + 2]) continue;
        }
        {
          // the gap left by a plane is second order in the taper: skip gentle tapers
          const Ln = Math.hypot(D[nbo + 4] - D[nbo], D[nbo + 5] - D[nbo + 1], D[nbo + 6] - D[nbo + 2]);
          const slope = Math.abs(r0 - r1) / Math.max(L, 1e-9) + Math.abs(D[nbo + 3] - D[nbo + 7]) / Math.max(Ln, 1e-9);
          if (slope < cfg.backfillSlope) continue;
        }
        segPos(batch, nb, ms, h0, h1);
        let lo = m0,
          hi = m1;
        // only within the neighbour's own slab: beyond its far plane lies the next segment's
        const fo = nbo + (side ? 20 : 16);
        const fx = D[fo],
          fy = D[fo + 1],
          fz = D[fo + 2];
        if (fx !== 0 || fy !== 0 || fz !== 0) {
          const q = side ? h1 : h0; // the far plane passes through the neighbour's far end
          // local ray point: o + (tc + t) dEx
          const num = fx * (o[0] + tc * dEx[0] - q[0]) + fy * (o[1] + tc * dEx[1] - q[1]) + fz * (o[2] + tc * dEx[2] - q[2]);
          const den = fx * dEx[0] + fy * dEx[1] + fz * dEx[2];
          if (Math.abs(den) < 1e-12) {
            if (num < 0) hi = lo;
          } else if (den > 0) lo = Math.max(lo, -num / den);
          else hi = Math.min(hi, -num / den);
        }
        if (!(lo < hi)) continue;
        let np = 1;
        pieces[0] = lo;
        pieces[1] = hi;
        if (chordParts(D, nb, h0, h1, o, dEx, hv) && hv[0] < hv[1]) np = subtractPiece(pieces, np, hv[0] + hv[2] - tc, hv[1] + hv[2] - tc);
        for (let q = 0; q < np; q++) I += concIntegral(pieces[q * 2], pieces[q * 2 + 1], sw0, sd, c0, c1) / Math.max(f, 1e-9);
      }
      value += wEx * f * I;
    }
    // thin path
    if (wEx < 1) {
      const tc = vx * dTh[0] + vy * dTh[1] + vz * dTh[2];
      for (let k = 0; k < 3; k++) wt[k] = o[k] + tc * dTh[k] - p0[k];
      value += (1 - wEx) * thinValue(wt, dTh, bv, L, r0 * sqRatio, r1 * sqRatio, c0, c1, kk, sigO, lut);
    }
    if (value !== 0) {
      P[0] += mu[0] * value;
      P[1] += mu[1] * value;
      P[2] += mu[2] * value;
      if (isListed) {
        Plist[0] += mu[0] * value;
        Plist[1] += mu[1] * value;
        Plist[2] += mu[2] * value;
      }
    }
  }
  return { P, Plist, hits, edgeDist, list: list2, listOverflow };
}

/**
 * Integrate one detector pixel exactly as SEG_FS does: the pixel's tile list, one ray at the
 * pixel centre, then four rotated-grid rays (offsets scaled by the anti-aliasing weight) where
 * that ray passed within a pixel of a small feature's silhouette (in tiles the binner flagged),
 * with four time sub-samples in moving tiles, averaged as transmission (or path length).
 */
export function integratePixel(batch: SegmentBatch, bins: TileBins, px: number, py: number, ctx: RayContext): V {
  const T = bins.tile;
  const t = Math.floor(py / T) * bins.tilesX + Math.floor(px / T);
  const off = bins.header[t * 2];
  const word = bins.header[t * 2 + 1];
  const cnt = word & 0xffffff;
  const flags = word >>> 24;
  if (cnt === 0) return [0, 0, 0];
  const ci = ctx.ci;
  const o = ci.src;
  const dTh = rayThroughPixel(ci, px + 0.5, py + 0.5, [0, 0, 0]);
  const dEx = [0, 0, 0];
  const classify = (flags & FLAG_SS ? 1 : 0) | (flags & FLAG_MOTION ? 2 : 0);
  const centre = integrateRay(batch, bins.index, off, cnt, o, dTh, dTh, ctx, 0, classify);
  // anti-aliasing weight: 1 near a small feature's silhouette, falling to 0 where the silhouette
  // no longer crosses the pixel; the rotated-grid offsets are scaled by it, so the result is
  // continuous in it
  const wAA = 1 - smoothstep(EDGE_FULL_PX, EDGE_NONE_PX, centre.edgeDist);
  const motion = (flags & FLAG_MOTION) !== 0;
  if (centre.list.length === 0 && !centre.listOverflow) return centre.P;
  const g = batch.gains ?? [1, 1, 1];
  const accP: V = [0, 0, 0],
    accT: V = [0, 0, 0];
  // only the listed segments (edge or moving) are sampled four times; the rest keep the centre value
  const base: V = [centre.P[0] - centre.Plist[0], centre.P[1] - centre.Plist[1], centre.P[2] - centre.Plist[2]];
  if (wAA <= 0 && motion) {
    // moving but no silhouette in the pixel: three time samples (-1/3, 0, +1/3 of the pulse,
    // the midpoint rule for a uniform pulse), the centre ray being the middle one
    for (let c = 0; c < 3; c++) {
      accP[c] = centre.Plist[c] / 3;
      accT[c] = Math.exp(-g[c] * centre.Plist[c]) / 3;
    }
    for (const tau of [-1 / 3, 1 / 3]) {
      const r = centre.listOverflow
        ? integrateRay(batch, bins.index, off, cnt, o, dTh, dTh, ctx, tau, classify, true).P
        : integrateRay(batch, centre.list, 0, centre.list.length, o, dTh, dTh, ctx, tau).P;
      for (let c = 0; c < 3; c++) {
        accP[c] += r[c] / 3;
        accT[c] += Math.exp(-g[c] * r[c]) / 3;
      }
    }
  } else
  for (let k = 0; k < 4; k++) {
    const [ox, oy, tt] = SUBSAMPLES[k];
    const tau = motion ? tt : 0;
    rayThroughPixel(ci, px + 0.5 + ox * wAA, py + 0.5 + oy * wAA, dEx);
    const r = centre.listOverflow
      ? integrateRay(batch, bins.index, off, cnt, o, dEx, dTh, ctx, tau, classify, true).P
      : integrateRay(batch, centre.list, 0, centre.list.length, o, dEx, dTh, ctx, tau).P;
    for (let c = 0; c < 3; c++) {
      accP[c] += r[c] * 0.25;
      accT[c] += Math.exp(-g[c] * r[c]) * 0.25;
    }
  }
  if (!ctx.cfg.transmissionAverage) return [base[0] + accP[0], base[1] + accP[1], base[2] + accP[2]];
  return [0, 1, 2].map((c) => base[c] + (g[c] > 0 ? -Math.log(accT[c]) / g[c] : accP[c])) as V;
}
