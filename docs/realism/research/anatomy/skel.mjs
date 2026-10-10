// Vessel skeleton statistics for real cines (contrast frame minus pre-contrast frame) and for
// synthetic projections. Outputs: skeleton length, junction density, segment arc/chord ratios.
import { readJpg, writePng } from "./img.mjs";
import path from "node:path";

const N = 512;
export function boxMean(px, R, W = N, H = N) {
  const I = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) { let row = 0; for (let x = 0; x < W; x++) { row += px[y * W + x]; I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + row; } }
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const x0 = Math.max(0, x - R), x1 = Math.min(W, x + R + 1), y0 = Math.max(0, y - R), y1 = Math.min(H, y + R + 1);
    out[y * W + x] = (I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0]) / ((x1 - x0) * (y1 - y0));
  }
  return out;
}
export function vesselness(px) {
  const m = boxMean(px, 7), b = boxMean(px, 1);
  const v = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) v[i] = Math.max(0, m[i] - b[i]);
  return v;
}
function maxFilter(v, R) {
  const out = new Float32Array(N * N);
  const tmp = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let m = 0; for (let k = -R; k <= R; k++) { const xx = x + k; if (xx >= 0 && xx < N) m = Math.max(m, v[y * N + xx]); } tmp[y * N + x] = m; }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let m = 0; for (let k = -R; k <= R; k++) { const yy = y + k; if (yy >= 0 && yy < N) m = Math.max(m, tmp[yy * N + x]); } out[y * N + x] = m; }
  return out;
}
export function maskFrom(v, hi = 12, lo = 7, minArea = 80, border = 24) {
  const m = new Uint8Array(N * N);
  // hysteresis
  const stack = [];
  for (let y = border; y < N - border; y++) for (let x = border; x < N - border; x++) if (v[y * N + x] > hi) { m[y * N + x] = 1; stack.push(y * N + x); }
  while (stack.length) {
    const i = stack.pop(), x = i % N, y = (i / N) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < border || yy < border || xx >= N - border || yy >= N - border) continue;
      const j = yy * N + xx;
      if (!m[j] && v[j] > lo) { m[j] = 1; stack.push(j); }
    }
  }
  // remove small components
  const lab = new Int32Array(N * N);
  let L = 0;
  for (let i = 0; i < N * N; i++) if (m[i] && !lab[i]) {
    L++;
    const st = [i], comp = [i]; lab[i] = L;
    while (st.length) { const k = st.pop(), x = k % N, y = (k / N) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue; const j = yy * N + xx; if (m[j] && !lab[j]) { lab[j] = L; st.push(j); comp.push(j); } } }
    if (comp.length < minArea) for (const k of comp) m[k] = 0;
  }
  return m;
}
export function thin(m0) {
  const m = Uint8Array.from(m0);
  const P = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? 0 : m[y * N + x]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const pass of [0, 1]) {
      const del = [];
      for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) {
        if (!m[y * N + x]) continue;
        const p2 = P(x, y - 1), p3 = P(x + 1, y - 1), p4 = P(x + 1, y), p5 = P(x + 1, y + 1), p6 = P(x, y + 1), p7 = P(x - 1, y + 1), p8 = P(x - 1, y), p9 = P(x - 1, y - 1);
        const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (B < 2 || B > 6) continue;
        const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
        let A = 0; for (let k = 0; k < 8; k++) if (!seq[k] && seq[k + 1]) A++;
        if (A !== 1) continue;
        if (pass === 0 ? p2 * p4 * p6 === 0 && p4 * p6 * p8 === 0 : p2 * p4 * p8 === 0 && p2 * p6 * p8 === 0) del.push(y * N + x);
      }
      for (const i of del) m[i] = 0;
      if (del.length) changed = true;
    }
  }
  return m;
}
export function graphStats(sk) {
  const nb = (i) => { const x = i % N, y = (i / N) | 0, o = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < N && yy < N && sk[yy * N + xx]) o.push(yy * N + xx); } return o; };
  let pix = 0, len = 0, junc = 0, ends = 0;
  const deg = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) if (sk[i]) { pix++; const n = nb(i); deg[i] = n.length; if (n.length >= 3) junc++; if (n.length === 1) ends++; for (const j of n) if (j > i) len += (Math.abs(j - i) === 1 || Math.abs(j - i) === N) ? 1 : Math.SQRT2; }
  // collapse adjacent junction pixels into nodes
  const node = new Int32Array(N * N).fill(-1);
  let nNodes = 0;
  for (let i = 0; i < N * N; i++) if (sk[i] && deg[i] >= 3 && node[i] < 0) { const st = [i]; node[i] = nNodes; while (st.length) { const k = st.pop(); for (const j of nb(k)) if (deg[j] >= 3 && node[j] < 0) { node[j] = nNodes; st.push(j); } } nNodes++; }
  // trace segments from node/end pixels
  const visited = new Uint8Array(N * N);
  const segs = [];
  for (let i = 0; i < N * N; i++) {
    if (!sk[i] || !(deg[i] === 1 || deg[i] >= 3)) continue;
    for (const j0 of nb(i)) {
      if (visited[j0] || deg[j0] >= 3) continue;
      const path = [i, j0];
      visited[j0] = 1;
      let prev = i, cur = j0;
      while (deg[cur] === 2) {
        const nx = nb(cur).find((j) => j !== prev && !visited[j]);
        if (nx === undefined) break;
        if (deg[nx] < 3) visited[nx] = 1;
        path.push(nx); prev = cur; cur = nx;
      }
      if (path.length < 2) continue;
      let L = 0; for (let k = 1; k < path.length; k++) { const a = path[k - 1], b = path[k]; L += Math.hypot((a % N) - (b % N), ((a / N) | 0) - ((b / N) | 0)); }
      const a = path[0], b = path[path.length - 1];
      const chord = Math.hypot((a % N) - (b % N), ((a / N) | 0) - ((b / N) | 0));
      segs.push({ L, chord, pts: path });
    }
  }
  return { pix, len, junctions: nNodes, ends, segs };
}
export function analyseImage(v) {
  const m = maskFrom(v);
  const sk = thin(m);
  const g = graphStats(sk);
  const long = g.segs.filter((s) => s.L >= 40);
  const ac = long.map((s) => s.L / Math.max(1, s.chord)).sort((a, b) => a - b);
  // curvature energy: mean |turning angle| per 10 px along long segments (smoothed polyline every 5 px)
  let turn = 0, tl = 0;
  for (const s of long) {
    const P = s.pts.filter((_, k) => k % 5 === 0).map((i) => [i % N, (i / N) | 0]);
    for (let k = 2; k < P.length; k++) {
      const a1 = Math.atan2(P[k - 1][1] - P[k - 2][1], P[k - 1][0] - P[k - 2][0]), a2 = Math.atan2(P[k][1] - P[k - 1][1], P[k][0] - P[k - 1][0]);
      let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      turn += Math.abs(d); tl += 5;
    }
  }
  return {
    maskPx: m.reduce((a, b) => a + b, 0),
    skelLen: +g.len.toFixed(0),
    junctions: g.junctions,
    ends: g.ends,
    juncPer100px: +((100 * g.junctions) / Math.max(1, g.len)).toFixed(2),
    longSegs: long.length,
    arcChordMedian: ac.length ? +ac[Math.floor(ac.length / 2)].toFixed(3) : null,
    arcChordP90: ac.length ? +ac[Math.floor(ac.length * 0.9)].toFixed(3) : null,
    turnDegPer10px: tl ? +(((turn / tl) * 10 * 180) / Math.PI).toFixed(1) : null,
    mask: m, sk,
  };
}
export function realVesselness(run, frames, peak, pre) {
  const a = readJpg(path.join(run, frames[peak])).px, b = readJpg(path.join(run, frames[pre])).px;
  const va = vesselness(a), vb = maxFilter(vesselness(b), 3);
  const v = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) v[i] = Math.max(0, va[i] - vb[i]);
  return v;
}
export function dumpMask(file, base, res) {
  const rgb = new Uint8Array(N * N * 3);
  for (let i = 0; i < N * N; i++) { const g = base[i]; rgb[i * 3] = g; rgb[i * 3 + 1] = g; rgb[i * 3 + 2] = g; if (res.mask[i]) { rgb[i * 3 + 2] = 255; } if (res.sk[i]) { rgb[i * 3] = 255; rgb[i * 3 + 1] = 0; rgb[i * 3 + 2] = 0; } }
  writePng(file, N, N, rgb, 3);
}
