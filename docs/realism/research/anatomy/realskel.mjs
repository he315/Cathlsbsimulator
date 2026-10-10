// Run skeleton statistics over many real cines per view. Also measures the tree's extent (mm, via catheter width).
import { runs, readJpg } from "./img.mjs";
import { vesselness, analyseImage, realVesselness, dumpMask } from "./skel.mjs";
import { catheterWidth } from "./cathwidth.mjs";
import path from "node:path";
import fs from "node:fs";

const N = 512;
const spec = {
  LCA_RAOcau: (r) => r.artery === "LCA" && r.angles.primary < -15 && r.angles.secondary < -15,
  LCA_RAOcra: (r) => r.artery === "LCA" && r.angles.primary < -10 && r.angles.secondary > 20,
  LCA_APcra: (r) => r.artery === "LCA" && Math.abs(r.angles.primary) < 10 && r.angles.secondary > 25,
  LCA_LAOcau: (r) => r.artery === "LCA" && r.angles.primary > 30 && r.angles.secondary < -15,
  LCA_LAOcra: (r) => r.artery === "LCA" && r.angles.primary > 25 && r.angles.secondary > 15,
  RCA_LAO: (r) => r.artery === "RCA" && r.angles.primary > 25 && Math.abs(r.angles.secondary) < 10,
  RCA_APcra: (r) => r.artery === "RCA" && Math.abs(r.angles.primary) < 15 && r.angles.secondary > 15,
};
const per = +(process.argv[2] || 14);
const all = [...runs("dominance-main"), ...runs("dominance")].filter((r) => r.angles && !r.tags?.artefact && !r.tags?.occlusion && r.frames.length >= 30);
const out = {};
fs.mkdirSync("/private/tmp/claude-502/cathmaster-research/anatomy/skelimg", { recursive: true });
for (const [view, f] of Object.entries(spec)) {
  const seen = new Set();
  const cand = all.filter(f).filter((r) => !seen.has(r.patient) && seen.add(r.patient));
  const step = Math.max(1, Math.floor(cand.length / per));
  const res = [];
  for (let i = 0; i < cand.length && res.length < per; i += step) {
    const r = cand[i];
    const counts = r.frames.map((fr, k) => {
      if (k % 2) return -1;
      const v = vesselness(readJpg(path.join(r.dir, fr)).px);
      let c = 0; for (let j = 0; j < N * N; j++) if (v[j] > 10) c++;
      return c;
    });
    const valid = counts.map((c, k) => [c, k]).filter(([c, k]) => c >= 0 && k > 0);
    const peak = valid.reduce((a, b) => (b[0] > a[0] ? b : a));
    const early = valid.filter(([c, k]) => k < peak[1]);
    if (!early.length) continue;
    const pre = early.reduce((a, b) => (b[0] < a[0] ? b : a));
    if (pre[0] > 0.6 * peak[0]) continue; // no contrast-free frame
    const v = realVesselness(r.dir, r.frames, peak[1], pre[1]);
    const a = analyseImage(v);
    const cw = catheterWidth(readJpg(path.join(r.dir, r.frames[peak[1]])));
    // extent of the vessel mask (p2..p98) in px
    const xs = [], ys = [];
    for (let j = 0; j < N * N; j++) if (a.mask[j]) { xs.push(j % N); ys.push((j / N) | 0); }
    xs.sort((p, q) => p - q); ys.sort((p, q) => p - q);
    const ext = xs.length ? [xs[Math.floor(xs.length * 0.98)] - xs[Math.floor(xs.length * 0.02)], ys[Math.floor(ys.length * 0.98)] - ys[Math.floor(ys.length * 0.02)]] : [0, 0];
    if (res.length < 3) dumpMask(`/private/tmp/claude-502/cathmaster-research/anatomy/skelimg/${view}_${r.id}.png`, readJpg(path.join(r.dir, r.frames[peak[1]])).px, a);
    const { mask, sk, ...stats } = a;
    res.push({ id: r.id, dom: r.dominance, ang: [r.angles.primary, r.angles.secondary].map((x) => Math.round(x)), peak: peak[1], pre: pre[1], cathPx: cw?.width ?? null, extPx: ext, ...stats });
  }
  out[view] = res;
  const med = (k) => { const a = res.map((x) => x[k]).filter((x) => x != null).sort((p, q) => p - q); return a.length ? a[Math.floor(a.length / 2)] : null; };
  console.log(view, "n", res.length, "skelLen", med("skelLen"), "junc/100px", med("juncPer100px"), "arc/chord", med("arcChordMedian"), "p90", med("arcChordP90"), "turn/10px", med("turnDegPer10px"), "cathPx", med("cathPx"));
}
fs.writeFileSync("/private/tmp/claude-502/cathmaster-research/anatomy/realskel.json", JSON.stringify(out, null, 1));
