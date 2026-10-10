// Track vessel landmarks through a real cine with normalised cross-correlation block matching.
// usage: node track.mjs <set/run> [nLandmarks] [overlay.png] [x,y;x,y;... explicit landmarks]
import { readJpg, writePng, LIB } from "./img.mjs";
import { toRgb, marker, line, text } from "./draw.mjs";
import fs from "node:fs";
import path from "node:path";

const [run, nArg, overlay, explicit, refArg] = process.argv.slice(2);
const dir = path.join(LIB, run);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).sort();
const ims = files.map((f) => readJpg(path.join(dir, f)));
const W = ims[0].w, H = ims[0].h;

function boxMean(px, R) {
  const I = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) { let row = 0; for (let x = 0; x < W; x++) { row += px[y * W + x]; I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + row; } }
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const x0 = Math.max(0, x - R), x1 = Math.min(W, x + R + 1), y0 = Math.max(0, y - R), y1 = Math.min(H, y + R + 1);
    out[y * W + x] = (I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0]) / ((x1 - x0) * (y1 - y0));
  }
  return out;
}
const blur = ims.map((im) => boxMean(im.px, 1));
const vness = ims.map((im, k) => { const m = boxMean(im.px, 8); const b = blur[k]; const v = new Float32Array(W * H); for (let i = 0; i < W * H; i++) v[i] = Math.max(0, m[i] - b[i]); return v; });
const count = vness.map((v) => { let c = 0; for (let y = 40; y < H - 40; y++) for (let x = 40; x < W - 40; x++) if (v[y * W + x] > 10) c++; return c; });
const maxC = Math.max(...count.slice(1));
const peak = refArg !== undefined ? +refArg : count.indexOf(maxC);
const opac = count.map((c, i) => i > 0 && c > 0.6 * maxC);
if (!opac[peak]) opac[peak] = true;
let f0 = peak, f1 = peak;
while (f0 - 1 > 0 && opac[f0 - 1]) f0--;
while (f1 + 1 < ims.length && opac[f1 + 1]) f1++;

// landmarks: strongest vesselness maxima, spaced
let lms = [];
if (explicit) lms = explicit.split(";").map((s) => s.split(",").map(Number));
else {
  // Shi-Tomasi corners on the vesselness map: junctions and bends avoid the aperture problem
  const v = vness[peak];
  const gx = new Float32Array(W * H), gy = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { gx[y * W + x] = (v[y * W + x + 1] - v[y * W + x - 1]) / 2; gy[y * W + x] = (v[(y + 1) * W + x] - v[(y - 1) * W + x]) / 2; }
  const xx = new Float32Array(W * H), yy = new Float32Array(W * H), xy = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) { xx[i] = gx[i] * gx[i]; yy[i] = gy[i] * gy[i]; xy[i] = gx[i] * gy[i]; }
  const R = 8;
  const bxx = boxMean(xx, R), byy = boxMean(yy, R), bxy = boxMean(xy, R);
  const cand = [];
  for (let y = 48; y < H - 48; y += 2) for (let x = 48; x < W - 48; x += 2) {
    const i = y * W + x, a = bxx[i], b = byy[i], c = bxy[i];
    const lmin = (a + b) / 2 - Math.sqrt(((a - b) / 2) ** 2 + c * c);
    cand.push([lmin, x, y]);
  }
  cand.sort((a, b) => b[0] - a[0]);
  for (const [s, x, y] of cand) {
    if (lms.length >= +(nArg || 10)) break;
    if (lms.every(([a, b]) => Math.hypot(a - x, b - y) > 44)) lms.push([x, y]);
  }
}
// NCC tracking on vesselness maps (robust to background and DRC changes)
const T = +(process.env.T || 16), S = +(process.env.S || 16);
function ncc(A, ax, ay, B, bx, by) {
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, n = 0;
  for (let dy = -T; dy <= T; dy++) for (let dx = -T; dx <= T; dx++) {
    const xa = ax + dx, ya = ay + dy, xb = bx + dx, yb = by + dy;
    if (xa < 0 || ya < 0 || xa >= W || ya >= H || xb < 0 || yb < 0 || xb >= W || yb >= H) continue;
    const a = A[ya * W + xa], b = B[yb * W + xb];
    sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b; n++;
  }
  const cov = sab - (sa * sb) / n, va = saa - (sa * sa) / n, vb = sbb - (sb * sb) / n;
  return cov / Math.sqrt(Math.max(1e-6, va * vb));
}
function step(A, ax, ay, B, gx, gy) {
  let best = -2, bx = gx, by = gy;
  for (let dy = -S; dy <= S; dy++) for (let dx = -S; dx <= S; dx++) {
    const c = ncc(A, ax, ay, B, gx + dx, gy + dy);
    if (c > best) { best = c; bx = gx + dx; by = gy + dy; }
  }
  // sub-pixel parabola fit
  const fx = (o) => ncc(A, ax, ay, B, bx + o, by), fy = (o) => ncc(A, ax, ay, B, bx, by + o);
  const px = (fx(-1) - fx(1)) / (2 * (fx(-1) - 2 * best + fx(1)) || 1), py = (fy(-1) - fy(1)) / (2 * (fy(-1) - 2 * best + fy(1)) || 1);
  return { x: bx, y: by, sx: bx + Math.max(-0.5, Math.min(0.5, px)), sy: by + Math.max(-0.5, Math.min(0.5, py)), c: best };
}
const tracks = lms.map(([x, y]) => {
  const tr = new Array(ims.length).fill(null);
  let e0 = 0; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) e0 += vness[peak][(y + dy) * W + x + dx] || 0;
  tr[peak] = { x, y, sx: x, sy: y, c: 1, e: e0 / 81 };
  for (const dirn of [1, -1]) {
    let cur = tr[peak];
    for (let f = peak + dirn; f >= f0 && f <= f1; f += dirn) {
      const r = step(vness[f - dirn], cur.x, cur.y, vness[f], cur.x, cur.y);
      if (r.c < 0.35) break;
      let e = 0; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) e += vness[f][(r.y + dy) * W + r.x + dx] || 0;
      r.e = e / 81;
      tr[f] = r;
      cur = r;
    }
  }
  return tr;
});
const res = { run, frames: ims.length, peak, window: [f0, f1], landmarks: [] };
tracks.forEach((tr, k) => {
  const eRef = tr[peak].e;
  const pts = tr.map((p, f) => (p && p.e > 0.5 * eRef && p.c > 0.5 ? { f, x: p.sx, y: p.sy, c: p.c } : null)).filter(Boolean);
  if (pts.length < 8) return;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  // peak-to-peak extent along the principal axis
  const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
  let sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < xs.length; i++) { sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; sxy += (xs[i] - mx) * (ys[i] - my); }
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const proj = xs.map((x, i) => (x - mx) * Math.cos(th) + (ys[i] - my) * Math.sin(th));
  const ortho = xs.map((x, i) => -(x - mx) * Math.sin(th) + (ys[i] - my) * Math.cos(th));
  let maxPair = 0;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) maxPair = Math.max(maxPair, Math.hypot(xs[i] - xs[j], ys[i] - ys[j]));
  const speed = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const sp2 = proj.slice().sort((a, b) => a - b), pr = (q) => sp2[Math.floor(q * (sp2.length - 1))];
  res.landmarks.push({ k, start: lms[k], n: pts.length, p10p90: +(pr(0.9) - pr(0.1)).toFixed(1), p5p95: +(pr(0.95) - pr(0.05)).toFixed(1), p2pMajor: +(Math.max(...proj) - Math.min(...proj)).toFixed(1), p2pMinor: +(Math.max(...ortho) - Math.min(...ortho)).toFixed(1), maxPair: +maxPair.toFixed(1), axisDeg: +((th * 180) / Math.PI).toFixed(0), meanC: +(pts.reduce((a, p) => a + p.c, 0) / pts.length).toFixed(2), proj: proj.map((v) => +v.toFixed(1)), speed: speed.map((v) => +v.toFixed(2)), f: pts.map((p) => p.f) });
});
console.log(JSON.stringify({ run, frames: ims.length, peak, window: [f0, f1], lms: res.landmarks.map((l) => ({ k: l.k, start: l.start, n: l.n, p1090: l.p10p90, p0595: l.p5p95, p2p: l.p2pMajor, minor: l.p2pMinor, maxPair: l.maxPair, axis: l.axisDeg, c: l.meanC })) }));
fs.mkdirSync("/private/tmp/claude-502/cathmaster-research/anatomy/tracks", { recursive: true });
fs.writeFileSync(`/private/tmp/claude-502/cathmaster-research/anatomy/tracks/${run.replace("/", "__")}.json`, JSON.stringify(res));
if (overlay) {
  const c = toRgb(ims[peak], 1);
  const cols = [[255, 0, 0], [0, 255, 0], [0, 128, 255], [255, 255, 0], [255, 0, 255], [0, 255, 255], [255, 128, 0], [128, 255, 128], [255, 128, 255], [128, 128, 255], [255, 255, 255], [200, 100, 50]];
  tracks.forEach((tr, k) => {
    const pts = tr.map((p) => (p ? [p.sx, p.sy] : null)).filter(Boolean);
    line(c, pts, cols[k % cols.length]);
    marker(c, lms[k][0], lms[k][1], cols[k % cols.length], 2);
    text(c, lms[k][0] + 4, lms[k][1] + 4, k, cols[k % cols.length], 2);
  });
  writePng(overlay, c.w, c.h, c.rgb, 3);
}
