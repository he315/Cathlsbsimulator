// Minimal-path centreline tracing between waypoints on a real frame, plus 2D shape metrics.
// usage: node trace.mjs <set/run> <frame0> "x,y;x,y;..." <label> [catheterPx]
import { readJpg, writePng, LIB } from "./img.mjs";
import { vesselness } from "./skel.mjs";
import { toRgb, line, marker } from "./draw.mjs";
import { shapeMetrics } from "./shape.mjs";
import path from "node:path";
import fs from "node:fs";

const N = 512;
const [run, fi, wps, label, cathArg] = process.argv.slice(2);
const im = readJpg(path.join(LIB, run, `f${String(+fi + 1).padStart(3, "0")}.jpg`));
const v = vesselness(im.px);
const cost = new Float32Array(N * N);
for (let i = 0; i < N * N; i++) cost[i] = 1 / Math.pow(1 + Math.max(0, v[i]), 2) + 1e-4;
const pts0 = wps.split(";").map((s) => s.split(",").map(Number));
const snap = ([x, y]) => { let b = [x, y], bv = -1; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue; if (Math.hypot(dx, dy) <= 3 && v[yy * N + xx] > bv) { bv = v[yy * N + xx]; b = [xx, yy]; } } return b; };
const wp = pts0.map(snap);
// binary heap Dijkstra
function dijkstra(s, t) {
  const dist = new Float64Array(N * N).fill(Infinity), prev = new Int32Array(N * N).fill(-1);
  const heap = []; const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  const si = s[1] * N + s[0], ti = t[1] * N + t[0];
  dist[si] = 0; push(0, si);
  while (heap.length) {
    const [d, i] = pop();
    if (d > dist[i]) continue;
    if (i === ti) break;
    const x = i % N, y = (i / N) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
      const j = yy * N + xx, nd = d + cost[j] * (dx && dy ? Math.SQRT2 : 1);
      if (nd < dist[j]) { dist[j] = nd; prev[j] = i; push(nd, j); }
    }
  }
  const p = []; for (let i = ti; i >= 0; i = prev[i]) { p.push([i % N, (i / N) | 0]); if (i === si) break; }
  return p.reverse();
}
let pathPx = [];
for (let k = 0; k < wp.length - 1; k++) { const seg = dijkstra(wp[k], wp[k + 1]); pathPx = pathPx.concat(k ? seg.slice(1) : seg); }
// remove out-and-back spurs and loops: cut between i and the last j > i+8 that comes back within 2.5 px
for (let i = 0; i < pathPx.length; i++) {
  let cut = -1;
  for (let j = pathPx.length - 1; j > i + 8; j--) if (Math.hypot(pathPx[j][0] - pathPx[i][0], pathPx[j][1] - pathPx[i][1]) < 2.5) { cut = j; break; }
  if (cut > 0) pathPx.splice(i + 1, cut - i);
}
const cath = cathArg ? +cathArg : null;
const mmPerPx = cath ? 2.0 / cath : null; // assumes a 6 F (2.0 mm) catheter shaft
const met = shapeMetrics(pathPx, mmPerPx);
const res = { run, frame: +fi, label, cathPx: cath, mmPerPx, ...met };
console.log(JSON.stringify(res));
fs.mkdirSync((process.env.ANATOMY_OUT || decodeURIComponent(new URL("../out/", import.meta.url).pathname)) + "traces", { recursive: true });
fs.writeFileSync(`${process.env.ANATOMY_OUT || decodeURIComponent(new URL("../out/", import.meta.url).pathname)}traces/${label}.json`, JSON.stringify({ ...res, path: pathPx }));
const c = toRgb(im, 1);
line(c, pathPx, [255, 40, 40]);
wp.forEach(([x, y]) => marker(c, x, y, [0, 255, 0], 3));
writePng(`${process.env.ANATOMY_OUT || decodeURIComponent(new URL("../out/", import.meta.url).pathname)}traces/${label}.png`, c.w, c.h, c.rgb, 3);
