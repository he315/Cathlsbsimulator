// Vessel-only extents of the real LCA masks: the same runs, frames and mask as realskel.mjs, with the
// contrast-filled guiding catheter removed before the p2-p98 extent is taken.
//
// Catheter removal: the catheter is the skeleton chain that enters the mask from the image border in the
// upper part of the frame (top edge, or the left/right edge above 60% of the height). It is traced from
// that end along the skeleton, continuing straight through crossings, until the mask widens beyond 1.6x
// the catheter's own half-width (the left main at the ostium) for 6 pixels, or the chain turns by more than
// 60 degrees at a junction, or ends. Mask pixels within (local half-width + 2 px) of the traced chain are
// cleared. The catheter half-width is measured on the chain itself (median distance-transform value over
// px 8-40), and is at least 0.4 x the run's measured catheter width.
//
// Also reports how much of the vessel mask touches the image field border (the tree is clipped by the
// field in magnified cines, which shortens the extent).
//
// usage: node scripts/anatomy_validation/library/realskel_nocath.mjs [debugPngCount=2] [peak|fill]
// reads scripts/anatomy_validation/data/realskel.json (run ids, peak and pre frames, catheter px),
// writes scripts/anatomy_validation/data/realskel_nocath.json (or realskel_fill_nocath.json) and debug PNGs to out/nocath/.
import { runs, readJpg, writePng } from "./img.mjs";
import { maskFrom, thin, realVesselness, vesselness } from "./skel.mjs";
import path from "node:path";
import fs from "node:fs";

const N = 512;
const HERE = decodeURIComponent(new URL(".", import.meta.url).pathname);
const DATA = path.join(HERE, "../data");
const OUT = (process.env.ANATOMY_OUT || path.join(HERE, "../out/")) + "nocath/";
fs.mkdirSync(OUT, { recursive: true });
const nDebug = +(process.argv[2] ?? 2);
// mode "peak": the realskel.mjs mask (peak frame minus pre-contrast frame); mode "fill": the whole filling phase
// (temporal maximum, from the pre-contrast frame to 10 frames after the peak, of the 3-frame running mean of
// vesselness minus the pre-contrast vesselness), which also keeps distal vessels that fill late or are faint
const MODE = process.argv[3] ?? "peak";

function maxFilter3(v) {
  const out = new Float32Array(N * N), tmp = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let m = 0; for (let k = -3; k <= 3; k++) { const xx = x + k; if (xx >= 0 && xx < N) m = Math.max(m, v[y * N + xx]); } tmp[y * N + x] = m; }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let m = 0; for (let k = -3; k <= 3; k++) { const yy = y + k; if (yy >= 0 && yy < N) m = Math.max(m, tmp[yy * N + x]); } out[y * N + x] = m; }
  return out;
}
function fillVesselness(run, peak, pre) {
  const vb = maxFilter3(vesselness(readJpg(path.join(run.dir, run.frames[pre])).px));
  const last = Math.min(run.frames.length - 1, peak + 10);
  const vs = [];
  for (let k = pre + 1; k <= last; k++) vs.push(vesselness(readJpg(path.join(run.dir, run.frames[k])).px));
  const out = new Float32Array(N * N);
  for (let k = 1; k + 1 < vs.length; k++) for (let i = 0; i < N * N; i++) out[i] = Math.max(out[i], (vs[k - 1][i] + vs[k][i] + vs[k + 1][i]) / 3 - vb[i]);
  return out;
}
const real = JSON.parse(fs.readFileSync(path.join(DATA, "realskel.json"), "utf8"));
const all = [...runs("dominance-main"), ...runs("dominance")];
const byId = new Map(all.map((r) => [r.id, r]));

/** chamfer (3-4) distance transform inside the mask, in px */
function distance(m) {
  const d = new Float32Array(N * N);
  const INF = 1e9;
  for (let i = 0; i < N * N; i++) d[i] = m[i] ? INF : 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    if (!d[i]) continue;
    let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + 3);
    if (y > 0) { v = Math.min(v, d[i - N] + 3); if (x > 0) v = Math.min(v, d[i - N - 1] + 4); if (x < N - 1) v = Math.min(v, d[i - N + 1] + 4); }
    d[i] = v;
  }
  for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) {
    const i = y * N + x;
    if (!d[i]) continue;
    let v = d[i];
    if (x < N - 1) v = Math.min(v, d[i + 1] + 3);
    if (y < N - 1) { v = Math.min(v, d[i + N] + 3); if (x < N - 1) v = Math.min(v, d[i + N + 1] + 4); if (x > 0) v = Math.min(v, d[i + N - 1] + 4); }
    d[i] = v;
  }
  for (let i = 0; i < N * N; i++) d[i] /= 3;
  return d;
}

const nb = (sk, i) => {
  const x = i % N, y = (i / N) | 0, o = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    const xx = x + dx, yy = y + dy;
    if (xx >= 0 && yy >= 0 && xx < N && yy < N && sk[yy * N + xx]) o.push(yy * N + xx);
  }
  return o;
};
const xy = (i) => [i % N, (i / N) | 0];

/** trace the catheter chain from a border skeleton pixel; returns the path (pixel indices) */
function traceCatheter(sk, dt, start, cathPx) {
  const path = [start];
  const seen = new Set([start]);
  let cur = start;
  let wide = 0;
  let half = null;
  for (let step = 0; step < 700; step++) {
    const cand = nb(sk, cur).filter((j) => !seen.has(j));
    if (!cand.length) break;
    let next = cand[0];
    if (cand.length > 1 || nb(sk, cur).length > 2) {
      // junction: continue along the incoming direction (last 8 px)
      const a = xy(path[Math.max(0, path.length - 9)]), b = xy(cur);
      const din = Math.atan2(b[1] - a[1], b[0] - a[0]);
      let bestTurn = Infinity;
      for (const j of cand) {
        // look a few px ahead along that branch for a stable direction
        let k = j, prev = cur;
        for (let s = 0; s < 6; s++) { const n2 = nb(sk, k).filter((q) => q !== prev && !seen.has(q)); if (!n2.length) break; prev = k; k = n2[0]; }
        const c = xy(k);
        let t = Math.atan2(c[1] - b[1], c[0] - b[0]) - din;
        while (t > Math.PI) t -= 2 * Math.PI;
        while (t < -Math.PI) t += 2 * Math.PI;
        if (Math.abs(t) < bestTurn) { bestTurn = Math.abs(t); next = j; }
      }
      if (bestTurn > (60 * Math.PI) / 180 && path.length > 40) break;
    }
    path.push(next);
    seen.add(next);
    cur = next;
    if (path.length === 40) {
      // skip the first 8 px (the mask thins where it meets the border band)
      const ds = path.slice(8).map((i) => dt[i]).sort((p, q) => p - q);
      half = Math.max(1.5, ds[Math.floor(ds.length / 2)], cathPx ? 0.4 * cathPx : 0);
    }
    if (half !== null) {
      wide = dt[cur] > 1.6 * half ? wide + 1 : 0;
      if (wide >= 6) { path.splice(path.length - 6); break; }
    }
  }
  return { path, half: half ?? 2 };
}

const result = {};
let debugLeft = nDebug;
for (const [view, list] of Object.entries(real)) {
  if (!view.startsWith("LCA")) continue;
  const res = [];
  for (const r of list) {
    const run = byId.get(r.id);
    if (!run) continue;
    const v = MODE === "fill" ? fillVesselness(run, r.peak, r.pre) : realVesselness(run.dir, run.frames, r.peak, r.pre);
    const m = maskFrom(v);
    const sk = thin(m);
    const dt = distance(m);
    // border starts: skeleton pixels in the mask's border band (the mask excludes 24 px)
    const starts = [];
    for (let i = 0; i < N * N; i++) {
      if (!sk[i]) continue;
      const [x, y] = xy(i);
      const top = y <= 27;
      const side = (x <= 27 || x >= N - 28) && y < N * 0.6;
      if ((top || side) && nb(sk, i).length <= 2) starts.push(i);
    }
    // one start per border chain: keep the start nearest the border within each 12 px cluster
    const picked = [];
    for (const s of starts) {
      const [x, y] = xy(s);
      if (picked.some((p) => Math.hypot(xy(p)[0] - x, xy(p)[1] - y) < 12)) continue;
      picked.push(s);
    }
    const removed = new Uint8Array(N * N);
    let cathLen = 0;
    for (const s of picked) {
      const { path: p, half } = traceCatheter(sk, dt, s, r.cathPx);
      if (p.length < 25) continue; // a short stub at the border is a vessel end, not a catheter
      cathLen += p.length;
      for (const i of p) {
        const [x, y] = xy(i);
        const R = Math.ceil(Math.min(dt[i], 2 * half) + 2);
        for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= N || yy >= N || dx * dx + dy * dy > R * R) continue;
          removed[yy * N + xx] = 1;
        }
      }
    }
    const ext = (keep) => {
      const xs = [], ys = [];
      for (let j = 0; j < N * N; j++) if (m[j] && keep(j)) { xs.push(j % N); ys.push((j / N) | 0); }
      xs.sort((p, q) => p - q);
      ys.sort((p, q) => p - q);
      return xs.length ? [xs[Math.floor(xs.length * 0.98)] - xs[Math.floor(xs.length * 0.02)], ys[Math.floor(ys.length * 0.98)] - ys[Math.floor(ys.length * 0.02)]] : [0, 0];
    };
    const withCath = ext(() => true);
    const noCath = ext((j) => !removed[j]);
    // field clipping: share of vessel-mask pixels within 6 px of the mask's border band
    let edge = 0, tot = 0;
    for (let j = 0; j < N * N; j++) if (m[j] && !removed[j]) { tot++; const [x, y] = xy(j); if (x < 30 || y < 30 || x >= N - 30 || y >= N - 30) edge++; }
    res.push({ id: r.id, ang: r.ang, cathPx: r.cathPx, extPx: withCath, extPxNoCath: noCath, cathChainPx: cathLen, edgeFraction: +(edge / Math.max(1, tot)).toFixed(3) });
    if (debugLeft > 0) {
      debugLeft--;
      const base = readJpg(path.join(run.dir, run.frames[r.peak])).px;
      const rgb = new Uint8Array(N * N * 3);
      for (let i = 0; i < N * N; i++) {
        const g = base[i];
        rgb[i * 3] = g; rgb[i * 3 + 1] = g; rgb[i * 3 + 2] = g;
        if (m[i] && !removed[i]) rgb[i * 3 + 2] = 255;
        if (m[i] && removed[i]) { rgb[i * 3] = 255; rgb[i * 3 + 1] = 140; rgb[i * 3 + 2] = 0; }
      }
      writePng(path.join(OUT, `${MODE}_${view}_${r.id}.png`), N, N, rgb, 3);
    }
  }
  result[view] = res;
  const mm = (x) => x.extPxNoCath.map((p) => (p * 2.0) / (x.cathPx || 6.5));
  const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
  console.log(view, "n", res.length, "no-catheter median w x h mm", med(res.map((x) => mm(x)[0])).toFixed(1), "x", med(res.map((x) => mm(x)[1])).toFixed(1), "| edge fraction median", med(res.map((x) => x.edgeFraction)));
}
fs.writeFileSync(path.join(DATA, MODE === "fill" ? "realskel_fill_nocath.json" : "realskel_nocath.json"), JSON.stringify(result, null, 1));
