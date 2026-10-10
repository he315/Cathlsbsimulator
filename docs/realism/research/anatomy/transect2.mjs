import { runs, readJpg } from "./img.mjs";
import { vesselness, maskFrom, realVesselness } from "./skel.mjs";
import path from "node:path";
const N = 512;
function countRows(v) {
  const m = maskFrom(v, 12, 7, 80, 24);
  const ys = []; for (let i = 0; i < N * N; i++) if (m[i]) ys.push((i / N) | 0);
  if (ys.length < 500) return null;
  ys.sort((a, b) => a - b);
  const y0 = ys[Math.floor(ys.length * 0.1)], y1 = ys[Math.floor(ys.length * 0.9)];
  const counts = [];
  for (let f = 0.3; f <= 0.71; f += 0.1) {
    const y = Math.round(y0 + (y1 - y0) * f);
    const row = []; for (let x = 0; x < N; x++) { let s = 0; for (let k = -2; k <= 2; k++) s += v[(y + k) * N + x]; row.push(s / 5); }
    let c = 0; for (let x = 26; x < N - 26; x++) if (row[x] > 7 && row[x] >= Math.max(...row.slice(x - 3, x + 4)) && row[x] > row[x + 1]) c++;
    counts.push(c);
  }
  return counts;
}
const spec = {
  LCA_RAOcra: (r) => r.artery === "LCA" && r.angles.primary < -10 && r.angles.secondary > 15,
  LCA_APcra: (r) => r.artery === "LCA" && Math.abs(r.angles.primary) < 10 && r.angles.secondary > 20,
  LCA_LAOcra: (r) => r.artery === "LCA" && r.angles.primary > 20 && r.angles.secondary > 12,
  RCA_LAO: (r) => r.artery === "RCA" && r.angles.primary > 20 && Math.abs(r.angles.secondary) < 12,
};
const all = [...runs("dominance-main"), ...runs("dominance")].filter((r) => r.angles && !r.tags?.artefact && !r.tags?.occlusion && r.frames.length >= 30);
for (const [view, f] of Object.entries(spec)) {
  const seen = new Set();
  const cand = all.filter(f).filter((r) => !seen.has(r.patient) && seen.add(r.patient));
  const step = Math.max(1, Math.floor(cand.length / 16));
  const meds = [];
  for (let i = 0; i < cand.length && meds.length < 16; i += step) {
    const r = cand[i];
    const cnt = r.frames.map((fr, k) => { if (k % 2) return -1; const v = vesselness(readJpg(path.join(r.dir, fr)).px); let c = 0; for (let j = 0; j < N * N; j++) if (v[j] > 10) c++; return c; });
    const valid = cnt.map((c, k) => [c, k]).filter(([c, k]) => c >= 0 && k > 0);
    const peak = valid.reduce((a, b) => (b[0] > a[0] ? b : a));
    const early = valid.filter(([c, k]) => k < peak[1]);
    if (!early.length) continue;
    const pre = early.reduce((a, b) => (b[0] < a[0] ? b : a));
    if (pre[0] > 0.6 * peak[0]) continue;
    const counts = countRows(realVesselness(r.dir, r.frames, peak[1], pre[1]));
    if (!counts) continue;
    const med = counts.slice().sort((a, b) => a - b)[2];
    meds.push(med);
  }
  meds.sort((a, b) => a - b);
  console.log(view, "runs", meds.length, "median crossings per mid-tree transect: p25/p50/p75", meds[Math.floor(meds.length / 4)], meds[Math.floor(meds.length / 2)], meds[Math.floor((3 * meds.length) / 4)], JSON.stringify(meds));
}
