// ---------------------------------------------------------------------------
// Screen-tile binning of segments (CPU).
//
// Each segment's screen footprint is bounded by projecting its two end
// spheres (and, with motion, their positions at the start and end of the
// X-ray pulse), enlarging the radius by 5 % for perspective, adding one pixel
// for the pixel footprint and, for segments thin enough to take the thin
// path, 3 sigma of the thin-path PSF. The footprint's bounding box is listed
// in every tile it touches.
//
// Output (uploaded as textures by segmentPass.ts):
//   header  Uint32 pairs per tile: offset into `index`, count | flags << 24
//           flags bit 0: needs 4 rotated-grid rays (an exact-path feature,
//                        radius or shell wall, under ssFeaturePx);
//           flags bit 1: needs 4 time sub-samples (motion within the pulse);
//   index   segment indices, per tile in ascending order, hence grouped by
//           union group (segments are stored grouped).
//
// Overflow: there is no per-tile limit (the shader loop is dynamic). The total
// is limited to `capacity` entries; past it, whole tile lists are truncated in
// tile order and the dropped count is reported in stats.dropped.
//
// Cost: per-tile counts and flags come from 2D difference arrays (four writes
// per segment whatever its footprint), so tile entries are walked once, when
// the index is filled. Blocks of 32 consecutive segments (chains are stored
// consecutively) whose 3D bounding box projects off the detector are skipped
// whole; the pre-cull is adaptive (skipped for a while when it last removed
// under 1/16 of the blocks), since it costs about a fifth of the binning when
// everything is on screen.
// ---------------------------------------------------------------------------

import { SEG_FLOATS, PREV_FLOATS, type SegmentBatch } from "./segmentPack";
import { camInfo, type CamInfo, type SegmentConfig, withDefaults } from "./config";
import type { XrayCamera } from "./types";

export const FLAG_SS = 1;
export const FLAG_MOTION = 2;

export interface BinStats {
  segments: number;
  onScreen: number;
  entries: number;
  coveredTiles: number;
  meanPerCoveredTile: number;
  p95PerTile: number;
  maxPerTile: number;
  ssTiles: number;
  motionTiles: number;
  dropped: number;
  ms: number;
}

export interface TileBins {
  res: number;
  tile: number;
  tilesX: number;
  tilesY: number;
  /** 2 per tile: offset, count | flags << 24 */
  header: Uint32Array;
  /** used length is stats.entries */
  index: Uint32Array;
  stats: BinStats;
  cam: CamInfo;
}

// scratch reused between calls
let bboxScratch = new Int32Array(0);

function project(ci: CamInfo, x: number, y: number, z: number, out: number[]): boolean {
  const dx = x - ci.src[0],
    dy = y - ci.src[1],
    dz = z - ci.src[2];
  const along = dx * ci.n[0] + dy * ci.n[1] + dz * ci.n[2];
  if (along < 1) return false;
  const mag = ci.sid / along;
  const u = mag * (dx * ci.pu[0] + dy * ci.pu[1] + dz * ci.pu[2]) - ci.ku;
  const v = mag * (dx * ci.pv[0] + dy * ci.pv[1] + dz * ci.pv[2]) - ci.kv;
  out[0] = ((u + 1) / 2) * ci.res;
  out[1] = ((v + 1) / 2) * ci.res;
  out[2] = mag;
  out[3] = along;
  return true;
}

/** Segments per pre-cull block (as a shift: 32). */
const BLOCK_SHIFT = 5;
const BLOCK = 1 << BLOCK_SHIFT;
/** Calls skipped between pre-cull attempts when the last one removed little (MODEL PARAMETER). */
const CULL_RETRY = 15;
/** Development and test switch for the block pre-cull ("auto": adaptive, the default). */
export const binnerOptions: { preCull: "auto" | "on" | "off" } = { preCull: "auto" };
/** Shared state of the adaptive pre-cull (an optimisation only: any value is correct). */
const cullHint = { skip: 0, lastFraction: 1 };
/** Screen margin of the pre-cull, px, beyond the radii and blur (MODEL PARAMETER: generous). */
const CULL_MARGIN_PX = 16;

/**
 * Off-screen flags per block of BLOCK consecutive segments: the block's 3D bounding box
 * (endpoints, plus the largest radius and the largest intra-pulse displacement) projected by its
 * eight corners, enlarged by the largest thin-path margin and CULL_MARGIN_PX. Returns null when
 * nothing can be culled (every block is at least partly on screen).
 */
function cullBlocks(batch: SegmentBatch, ci: CamInfo, res: number, mscale: number, cfg: SegmentConfig): Uint8Array | null {
  const n = batch.count;
  if (n < BLOCK * 4) {
    cullHint.lastFraction = 1;
    return null;
  }
  const d = batch.data;
  const prev = batch.prev && batch.motion ? batch.prev : null;
  const nb = (n + BLOCK - 1) >> BLOCK_SHIFT;
  const out = new Uint8Array(nb);
  const pr = [0, 0, 0, 0];
  // thin-path margin at the largest focal blur (an object at the source side): bounded by the
  // anti-aliasing and extra blur plus the focal blur at a quarter of the SID
  const fsig = (cfg.psf.focalSigmaMm / ci.mmPerPx) * 3;
  const thinM = 3 * Math.sqrt(cfg.psf.sigmaAaPx * cfg.psf.sigmaAaPx + cfg.psf.extraPx * cfg.psf.extraPx + fsig * fsig) + 1.5;
  let any = false;
  for (let b = 0; b < nb; b++) {
    const i0 = b << BLOCK_SHIFT,
      i1 = Math.min(n, i0 + BLOCK);
    let x0 = Infinity,
      y0 = Infinity,
      z0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity,
      z1 = -Infinity,
      rm = 0;
    for (let i = i0; i < i1; i++) {
      const o = i * SEG_FLOATS;
      const ax = d[o],
        ay = d[o + 1],
        az = d[o + 2],
        ar = d[o + 3],
        bx = d[o + 4],
        by = d[o + 5],
        bz = d[o + 6],
        br = d[o + 7];
      let r = ar > br ? ar : br;
      if (prev !== null) {
        const q = i * PREV_FLOATS;
        const m0 = Math.hypot(ax - prev[q], ay - prev[q + 1], az - prev[q + 2]);
        const m1 = Math.hypot(bx - prev[q + 4], by - prev[q + 5], bz - prev[q + 6]);
        r += (m0 > m1 ? m0 : m1) * mscale;
      }
      if (r > rm) rm = r;
      const lx = ax < bx ? ax : bx,
        hx = ax < bx ? bx : ax,
        ly = ay < by ? ay : by,
        hy = ay < by ? by : ay,
        lz = az < bz ? az : bz,
        hz = az < bz ? bz : az;
      if (lx < x0) x0 = lx;
      if (hx > x1) x1 = hx;
      if (ly < y0) y0 = ly;
      if (hy > y1) y1 = hy;
      if (lz < z0) z0 = lz;
      if (hz > z1) z1 = hz;
    }
    x0 -= rm;
    y0 -= rm;
    z0 -= rm;
    x1 += rm;
    y1 += rm;
    z1 += rm;
    let sx0 = Infinity,
      sy0 = Infinity,
      sx1 = -Infinity,
      sy1 = -Infinity,
      ok = true;
    for (let c = 0; c < 8 && ok; c++) {
      if (!project(ci, c & 1 ? x1 : x0, c & 2 ? y1 : y0, c & 4 ? z1 : z0, pr)) ok = false;
      else {
        if (pr[0] < sx0) sx0 = pr[0];
        if (pr[0] > sx1) sx1 = pr[0];
        if (pr[1] < sy0) sy0 = pr[1];
        if (pr[1] > sy1) sy1 = pr[1];
      }
    }
    if (!ok) continue; // a corner behind the source plane: keep the block
    const m = thinM + CULL_MARGIN_PX;
    if (sx1 < -m || sy1 < -m || sx0 > res + m || sy0 > res + m) {
      out[b] = 1;
      any = true;
    }
  }
  let culled = 0;
  for (let b = 0; b < nb; b++) culled += out[b];
  cullHint.lastFraction = culled / nb;
  return any ? out : null;
}

/**
 * Bin a batch for one camera and resolution. `reuse` may pass the index array of a previous
 * result that is no longer needed (the pass does, every frame) to avoid reallocation.
 */
export function binSegments(batch: SegmentBatch, cam: XrayCamera, res: number, config?: Partial<SegmentConfig>, reuse?: Uint32Array): TileBins {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const cfg = withDefaults(config);
  const ci = camInfo(cam, res);
  const T = cfg.tile;
  const tilesX = Math.ceil(res / T),
    tilesY = Math.ceil(res / T);
  const nT = tilesX * tilesY;
  const n = batch.count;
  const d = batch.data;
  if (bboxScratch.length < n * 4) bboxScratch = new Int32Array(Math.max(n * 4, bboxScratch.length * 2));
  const bb = bboxScratch;
  const counts = new Uint32Array(nT + 1);
  const tflags = new Uint8Array(nT);
  const W1 = tilesX + 1;
  const dc = new Int32Array(W1 * (tilesY + 1)),
    ds = new Int32Array(W1 * (tilesY + 1)),
    dm = new Int32Array(W1 * (tilesY + 1));
  const colC = new Int32Array(tilesX),
    colS = new Int32Array(tilesX),
    colM = new Int32Array(tilesX);
  const prev = batch.prev && batch.motion ? batch.prev : null;
  const mscale = batch.motion ? (0.5 * batch.motion.pulseS) / Math.max(1e-6, batch.motion.dtS) : 0;
  const pr = [0, 0, 0, 0];
  let onScreen = 0;
  const pts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let sx = 0,
    sy = 0;
  // camera constants for the inlined projection
  const [cx, cy, cz] = ci.src;
  const [nx, ny, nz] = ci.n;
  const [ux, uy, uz] = ci.pu;
  const [wx, wy, wz] = ci.pv;
  const ku = ci.ku,
    kv = ci.kv,
    sid = ci.sid,
    half = res / 2,
    invMm = 1 / ci.mmPerPx;
  const aa2 = cfg.psf.sigmaAaPx * cfg.psf.sigmaAaPx + cfg.psf.extraPx * cfg.psf.extraPx;
  const fsig = cfg.psf.focalSigmaMm * invMm;
  const thinLim = cfg.thinHiPx * 1.25,
    exactLim = cfg.thinLoPx * 0.8;
  const wallMm = new Float64Array(batch.groups.length);
  const muSum = new Float64Array(batch.groups.length);
  for (let g = 0; g < batch.groups.length; g++) {
    wallMm[g] = batch.groups[g].featureMm;
    const m = batch.groups[g].mu;
    muSum[g] = Math.abs(m[0]) + Math.abs(m[1]) + Math.abs(m[2]);
  }
  // block pre-cull: runs of BLOCK consecutive segments (chains are stored consecutively) whose
  // 3D bounding box projects entirely off the detector are skipped without per-segment work
  let blockOff: Uint8Array | null = null;
  if (binnerOptions.preCull === "on") blockOff = cullBlocks(batch, ci, res, mscale, cfg);
  else if (binnerOptions.preCull === "off") blockOff = null;
  else if (cullHint.skip > 0) cullHint.skip--;
  else {
    blockOff = cullBlocks(batch, ci, res, mscale, cfg);
    // adaptive: when the last cull removed under 1/16 of the blocks, skip it for the next calls
    // (it costs about a fifth of the binning when nothing is culled); correctness never depends on it
    if (cullHint.lastFraction < 1 / 16) cullHint.skip = CULL_RETRY;
  }
  // projection of the previous segment's end, reused when the next segment starts there (chains)
  let lx = NaN,
    ly = NaN,
    lz = NaN,
    lX = 0,
    lY = 0,
    lM = 0,
    lA = 0;
  for (let i = 0; i < n; i++) {
    if (blockOff && blockOff[i >> BLOCK_SHIFT]) {
      // the whole block is off screen
      const end = Math.min(n, ((i >> BLOCK_SHIFT) + 1) << BLOCK_SHIFT);
      for (; i < end; i++) {
        bb[i * 4] = 1;
        bb[i * 4 + 1] = 0;
      }
      i--;
      lx = NaN;
      continue;
    }
    const o = i * SEG_FLOATS;
    const r0 = d[o + 3],
      r1 = d[o + 7];
    const ee = d[o + 12] * d[o + 12] + d[o + 13] * d[o + 13] + d[o + 14] * d[o + 14];
    const e = ee > 0 ? Math.sqrt(ee) : 0;
    let x0: number, y0: number, x1: number, y1: number;
    let rpxMax: number, rpxMin: number, along: number;
    let motionPx = 0;
    if (!prev) {
      // end 0 (cached from the previous segment's end 1 when they coincide)
      let X0: number, Y0: number, M0: number, A0: number;
      const ax = d[o],
        ay = d[o + 1],
        az = d[o + 2];
      if (ax === lx && ay === ly && az === lz) {
        X0 = lX;
        Y0 = lY;
        M0 = lM;
        A0 = lA;
      } else {
        const dx = ax - cx,
          dy = ay - cy,
          dz = az - cz;
        A0 = dx * nx + dy * ny + dz * nz;
        M0 = sid / A0;
        X0 = (M0 * (dx * ux + dy * uy + dz * uz) - ku + 1) * half;
        Y0 = (M0 * (dx * wx + dy * wy + dz * wz) - kv + 1) * half;
      }
      const bx = d[o + 4],
        by = d[o + 5],
        bz = d[o + 6];
      const ex = bx - cx,
        ey = by - cy,
        ez = bz - cz;
      const A1 = ex * nx + ey * ny + ez * nz;
      const M1 = sid / A1;
      const X1 = (M1 * (ex * ux + ey * uy + ez * uz) - ku + 1) * half;
      const Y1 = (M1 * (ex * wx + ey * wy + ez * wz) - kv + 1) * half;
      lx = bx;
      ly = by;
      lz = bz;
      lX = X1;
      lY = Y1;
      lM = M1;
      lA = A1;
      if (A0 < 1 || A1 < 1) {
        bb[i * 4] = 1;
        bb[i * 4 + 1] = 0;
        continue;
      }
      const q0 = r0 * M0 * invMm,
        q1 = r1 * M1 * invMm;
      const rr0 = q0 * 1.05 + 1.0,
        rr1 = q1 * 1.05 + 1.0;
      x0 = Math.min(X0 - rr0, X1 - rr1);
      x1 = Math.max(X0 + rr0, X1 + rr1);
      y0 = Math.min(Y0 - rr0, Y1 - rr1);
      y1 = Math.max(Y0 + rr0, Y1 + rr1);
      rpxMax = q0 > q1 ? q0 : q1;
      rpxMin = q0 > q1 ? q1 : q0;
      along = 0.5 * (A0 + A1);
    } else {
      // moving: the ends and their positions at both ends of the pulse
      let np = 2;
      for (let k = 0; k < 3; k++) {
        pts[k] = d[o + k];
        pts[3 + k] = d[o + 4 + k];
      }
      const q = i * PREV_FLOATS;
      for (let k = 0; k < 2; k++) {
        const vx = (pts[k * 3] - prev[q + k * 4]) * mscale,
          vy = (pts[k * 3 + 1] - prev[q + k * 4 + 1]) * mscale,
          vz = (pts[k * 3 + 2] - prev[q + k * 4 + 2]) * mscale;
        const bI = np * 3;
        pts[bI] = pts[k * 3] - vx;
        pts[bI + 1] = pts[k * 3 + 1] - vy;
        pts[bI + 2] = pts[k * 3 + 2] - vz;
        pts[bI + 3] = pts[k * 3] + vx;
        pts[bI + 4] = pts[k * 3 + 1] + vy;
        pts[bI + 5] = pts[k * 3 + 2] + vz;
        np += 2;
      }
      x0 = Infinity;
      y0 = Infinity;
      x1 = -Infinity;
      y1 = -Infinity;
      rpxMax = 0;
      rpxMin = Infinity;
      along = 0;
      let ok = true;
      for (let k = 0; k < np; k++) {
        if (!project(ci, pts[k * 3], pts[k * 3 + 1], pts[k * 3 + 2], pr)) {
          ok = false;
          break;
        }
        // order: end 0, end 1, then (end 0 at -pulse/2, +pulse/2), (end 1 at -pulse/2, +pulse/2)
        const end = k < 2 ? k : (k - 2) >> 1;
        const rpx = (end === 0 ? r0 : r1) * pr[2] * invMm;
        if (k < 2) {
          rpxMax = Math.max(rpxMax, rpx);
          rpxMin = Math.min(rpxMin, rpx);
          along += pr[3] * 0.5;
        } else if ((k & 1) === 0) {
          sx = pr[0];
          sy = pr[1];
        } else motionPx = Math.max(motionPx, Math.hypot(pr[0] - sx, pr[1] - sy));
        const rr = rpx * 1.05 + 1.0;
        x0 = Math.min(x0, pr[0] - rr);
        x1 = Math.max(x1, pr[0] + rr);
        y0 = Math.min(y0, pr[1] - rr);
        y1 = Math.max(y1, pr[1] + rr);
      }
      if (!ok) {
        bb[i * 4] = 1;
        bb[i * 4 + 1] = 0;
        continue;
      }
    }
    // thin-path margin: 3 sigma of the PSF at this depth (equal-area radius decides the path;
    // 25 % slack because the shader decides at the segment middle, this uses the ends)
    const rEq = (0.5 * (rpxMax + rpxMin)) / Math.sqrt(1 + e);
    let f = 0;
    if (rEq < thinLim) {
      const fpx = (fsig * Math.max(0, sid - along)) / along;
      const m = 3 * Math.sqrt(aa2 + fpx * fpx) + 0.5;
      x0 -= m;
      y0 -= m;
      x1 += m;
      y1 += m;
    }
    if (rEq >= exactLim) {
      // exact path: anti-alias where the radius, the thin semi-axis or a shell wall is small
      const gi = d[o + 11] | 0;
      const wm = wallMm[gi];
      const wallPx = wm < 1e30 ? (wm * sid * invMm) / along : Infinity;
      const feat = Math.min(rpxMin / (1 + e), wallPx);
      const contrast = muSum[gi] * Math.max(Math.abs(d[o + 8]), Math.abs(d[o + 9])) * (r0 + r1);
      if (feat < cfg.ssFeaturePx && contrast >= cfg.ssMinContrast) f |= FLAG_SS;
    }
    if (motionPx > cfg.ssMotionPx) f |= FLAG_MOTION;
    const tx0 = Math.max(0, Math.floor(x0 / T)),
      tx1 = Math.min(tilesX - 1, Math.floor(x1 / T));
    const ty0 = Math.max(0, Math.floor(y0 / T)),
      ty1 = Math.min(tilesY - 1, Math.floor(y1 / T));
    if (tx0 > tx1 || ty0 > ty1) {
      bb[i * 4] = 1;
      bb[i * 4 + 1] = 0;
      continue;
    }
    bb[i * 4] = tx0;
    bb[i * 4 + 1] = tx1;
    bb[i * 4 + 2] = ty0;
    bb[i * 4 + 3] = ty1;
    onScreen++;
    // counts and flags by 2D difference arrays: four writes per segment, whatever its size
    const a = ty0 * W1 + tx0,
      b = ty0 * W1 + tx1 + 1,
      c = (ty1 + 1) * W1 + tx0,
      e2 = (ty1 + 1) * W1 + tx1 + 1;
    dc[a]++;
    dc[b]--;
    dc[c]--;
    dc[e2]++;
    if (f & FLAG_SS) {
      ds[a]++;
      ds[b]--;
      ds[c]--;
      ds[e2]++;
    }
    if (f & FLAG_MOTION) {
      dm[a]++;
      dm[b]--;
      dm[c]--;
      dm[e2]++;
    }
  }
  // integrate the difference arrays: value(y, x) = sum over rows <= y of the row prefix at x
  for (let ty = 0; ty < tilesY; ty++) {
    let rc = 0,
      rs = 0,
      rm = 0;
    const base = ty * W1;
    for (let tx = 0; tx < tilesX; tx++) {
      rc += dc[base + tx];
      rs += ds[base + tx];
      rm += dm[base + tx];
      const vc = (colC[tx] += rc),
        vs = (colS[tx] += rs),
        vm = (colM[tx] += rm);
      const t = ty * tilesX + tx;
      counts[t] = vc;
      tflags[t] = (vs > 0 ? FLAG_SS : 0) | (vm > 0 ? FLAG_MOTION : 0);
    }
  }
  // prefix sums with the capacity limit
  const header = new Uint32Array(nT * 2);
  let total = 0,
    dropped = 0;
  const offs = new Uint32Array(nT);
  for (let t = 0; t < nT; t++) {
    let c = counts[t];
    if (total + c > cfg.capacity) {
      const keep = Math.max(0, cfg.capacity - total);
      dropped += c - keep;
      c = keep;
    }
    offs[t] = total;
    header[t * 2] = total;
    header[t * 2 + 1] = (c & 0xffffff) | (tflags[t] << 24);
    counts[t] = c; // now the kept count
    total += c;
  }
  // the index list is owned by the result (callers may keep several bin sets alive)
  const index = reuse && reuse.length >= total ? reuse : new Uint32Array(Math.max(total, 16));
  // write cursors: cur[t] runs from offs[t] to end[t]
  const cur = offs.slice();
  const end = new Uint32Array(nT);
  for (let t = 0; t < nT; t++) end[t] = offs[t] + counts[t];
  for (let i = 0; i < n; i++) {
    const tx0 = bb[i * 4],
      tx1 = bb[i * 4 + 1];
    if (tx0 > tx1) continue;
    const ty0 = bb[i * 4 + 2],
      ty1 = bb[i * 4 + 3];
    for (let ty = ty0; ty <= ty1; ty++) {
      const row = ty * tilesX;
      for (let tx = tx0; tx <= tx1; tx++) {
        const t = row + tx;
        const c = cur[t];
        if (c < end[t]) {
          index[c] = i;
          cur[t] = c + 1;
        }
      }
    }
  }
  // statistics
  let covered = 0,
    maxPer = 0,
    ss = 0,
    mo = 0;
  const per: number[] = [];
  for (let t = 0; t < nT; t++) {
    const c = counts[t];
    if (c > 0) {
      covered++;
      per.push(c);
      if (c > maxPer) maxPer = c;
      if (tflags[t] & FLAG_SS) ss++;
      if (tflags[t] & FLAG_MOTION) mo++;
    }
  }
  per.sort((a, b) => a - b);
  const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
  return {
    res,
    tile: T,
    tilesX,
    tilesY,
    header,
    index,
    cam: ci,
    stats: {
      segments: n,
      onScreen,
      entries: total,
      coveredTiles: covered,
      meanPerCoveredTile: covered ? total / covered : 0,
      p95PerTile: per.length ? per[Math.min(per.length - 1, Math.floor(per.length * 0.95))] : 0,
      maxPerTile: maxPer,
      ssTiles: ss,
      motionTiles: mo,
      dropped,
      ms: t1 - t0,
    },
  };
}
