// Pick runs by view and build 2x2 montages of their peak-opacification frames.
import { runs, readJpg, writePng } from "./img.mjs";
import path from "node:path";
import fs from "node:fs";

const OUT = (process.env.ANATOMY_OUT || decodeURIComponent(new URL("../out/", import.meta.url).pathname)) + "montage";
fs.mkdirSync(OUT, { recursive: true });

function viewOf(a) {
  const pr = a.primary, se = a.secondary;
  return { pr, se };
}

export function vesselSignal(im) {
  // local-mean minus pixel (dark thin structures), integral image, 13x13 box
  const { w, h, px } = im;
  const I = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) { let row = 0; for (let x = 0; x < w; x++) { row += px[y * w + x]; I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + row; } }
  const R = 6; let s = 0;
  for (let y = 40; y < h - 40; y++) for (let x = 40; x < w - 40; x++) {
    const a = I[(y - R) * (w + 1) + x - R], b = I[(y - R) * (w + 1) + x + R + 1], c = I[(y + R + 1) * (w + 1) + x - R], d = I[(y + R + 1) * (w + 1) + x + R + 1];
    const m = (d - b - c + a) / ((2 * R + 1) ** 2);
    const v = m - px[y * w + x] - 6; if (v > 0) s += v;
  }
  return s;
}
function boxMean(px, w, h, R) {
  const I = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) { let row = 0; for (let x = 0; x < w; x++) { row += px[y * w + x]; I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + row; } }
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const x0 = Math.max(0, x - R), x1 = Math.min(w, x + R + 1), y0 = Math.max(0, y - R), y1 = Math.min(h, y + R + 1);
    out[y * w + x] = (I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0]) / ((x1 - x0) * (y1 - y0));
  }
  return out;
}
export function darkCount(im) {
  const b = boxMean(im.px, im.w, im.h, 2), m = boxMean(im.px, im.w, im.h, 10);
  let c = 0;
  for (let y = 32; y < im.h - 32; y++) for (let x = 32; x < im.w - 32; x++) if (m[y * im.w + x] - b[y * im.w + x] > 9) c++;
  return c;
}
export function peakFrame(run) {
  let best = null;
  for (let i = 2; i < run.frames.length; i += 2) {
    const c = darkCount(readJpg(path.join(run.dir, run.frames[i])));
    if (!best || c > best.c) best = { i, c };
  }
  return best;
}

function montage(name, list) {
  const W = 1024;
  const px = new Uint8Array(W * W);
  list.slice(0, 4).forEach((r, k) => {
    const im = readJpg(path.join(r.dir, r.frames[r.peak]));
    const ox = (k % 2) * 512, oy = Math.floor(k / 2) * 512;
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) px[(oy + y) * W + ox + x] = im.px[y * im.w + x];
  });
  writePng(path.join(OUT, name + ".png"), W, W, px);
}

const all = [...runs("dominance-main"), ...runs("dominance")].filter((r) => r.angles && !r.tags?.artefact && !r.tags?.occlusion);
const want = process.argv.slice(2);
const spec = {
  "LCA_RAOcau": (r) => r.artery === "LCA" && r.angles.primary < -15 && r.angles.secondary < -15,
  "LCA_RAOcra": (r) => r.artery === "LCA" && r.angles.primary < -10 && r.angles.secondary > 20,
  "LCA_APcra": (r) => r.artery === "LCA" && Math.abs(r.angles.primary) < 10 && r.angles.secondary > 25,
  "LCA_LAOcra": (r) => r.artery === "LCA" && r.angles.primary > 25 && r.angles.secondary > 15,
  "LCA_LAOcau": (r) => r.artery === "LCA" && r.angles.primary > 30 && r.angles.secondary < -15,
  "LCA_APcau": (r) => r.artery === "LCA" && Math.abs(r.angles.primary) < 10 && r.angles.secondary < -20,
  "RCA_LAO": (r) => r.artery === "RCA" && r.angles.primary > 25 && Math.abs(r.angles.secondary) < 10,
  "RCA_APcra": (r) => r.artery === "RCA" && Math.abs(r.angles.primary) < 15 && r.angles.secondary > 15,
  "RCA_RAO": (r) => r.artery === "RCA" && r.angles.primary < -15,
};
const res = {};
for (const [k, f] of Object.entries(spec)) {
  if (want.length && !want.includes(k)) continue;
  // spread over patients
  const seen = new Set();
  const cand = all.filter(f).filter((r) => r.frames.length >= 30 && !seen.has(r.patient) && seen.add(r.patient));
  // deterministic sample: every nth
  const step = Math.max(1, Math.floor(cand.length / 8));
  const sel = [];
  for (let i = 0; i < cand.length && sel.length < 8; i += step) sel.push(cand[i]);
  for (const r of sel) r.peak = peakFrame(r).i;
  montage(k + "_a", sel.slice(0, 4));
  if (sel.length > 4) montage(k + "_b", sel.slice(4, 8));
  res[k] = sel.map((r) => ({ id: r.id, dom: r.dominance, ang: [r.angles.primary.toFixed(0), r.angles.secondary.toFixed(0)], n: r.frames.length, peak: r.peak }));
  console.log(k, cand.length, JSON.stringify(res[k]));
}
fs.writeFileSync(path.join(OUT, "picked.json"), JSON.stringify(res, null, 1));
