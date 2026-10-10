// Per-frame CPU cost of the motion field and silhouette fit, and the cost of growing / re-lesioning a tree.
// usage: npx vite-node scripts/anatomy_validation/perf.ts
import { buildAnatomy } from "../../src/simulation/anatomy";
import type { AnatomyCase } from "../../src/types";
import { buildCoronaryTree, samplePos, renderPath } from "../../src/render/xray/coronaryTree";
import { clearTopologyCache } from "../../src/render/xray/coronaryGrowth";
import { motionAt, clockStateAt, rootDisplacement } from "../../src/render/xray/heartMotion";
import { heartShapes } from "../../src/render/xray/heartShape";

const mk = (id: string) => ({ id, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance: "right", variants: [], lesions: [] }) as unknown as AnatomyCase;
const q = (a: number[], p: number) => [...a].sort((x, y) => x - y)[Math.floor(p * (a.length - 1))];
clearTopologyCache();
const grow: number[] = [];
const trees = Array.from({ length: 12 }, (_, i) => {
  const c = mk(`perf-${i}`);
  const m = buildAnatomy(c);
  const t0 = performance.now();
  const t = buildCoronaryTree(m, c);
  grow.push(performance.now() - t0);
  return { c, m, t };
});
const { c, m, t } = trees[0];
const relesion: number[] = [];
for (let k = 0; k < 40; k++) {
  const t0 = performance.now();
  buildCoronaryTree(m, { ...c, lesions: [{ vessel: "LAD", position: 0.4, severity: 50 + k, kind: "severe-stenosis", lengthMm: 12 } as any] }, [{ vessel: "LAD", from: 0.35, to: 0.45, radius: 1.5 }]);
  relesion.push(performance.now() - t0);
}
// per frame: every sample of every vessel with motion (what sceneBuilder does), plus root displacement for 120 catheter nodes
const frame: number[] = [];
let samples = 0;
for (const v of t.vessels) samples += renderPath(v).samples.length;
for (let k = 0; k < 120; k++) {
  const mo = motionAt(clockStateAt(k / 15, 65));
  const t0 = performance.now();
  let acc = 0;
  for (const v of t.vessels) {
    const rp = renderPath(v, mo);
    for (const s of rp.samples) acc += samplePos(t.heart, s, mo).x;
  }
  for (let n = 0; n < 120; n++) acc += rootDisplacement(mo, 14, t.heart).x;
  frame.push(performance.now() - t0);
  if (!Number.isFinite(acc)) throw new Error("nan");
}
const fit: number[] = [];
for (let k = 0; k < 200; k++) {
  const mo = motionAt(clockStateAt(k / 15, 65));
  const t0 = performance.now();
  heartShapes(t.heart, mo);
  fit.push(performance.now() - t0);
}
console.log(`grow (new genome) ms: median ${q(grow, 0.5).toFixed(1)} p90 ${q(grow, 0.9).toFixed(1)}`);
console.log(`re-apply lesions + stent ms: median ${q(relesion, 0.5).toFixed(2)} p90 ${q(relesion, 0.9).toFixed(2)}`);
console.log(`per-frame motion of ${samples} samples + 120 catheter nodes ms: median ${q(frame.slice(10), 0.5).toFixed(2)} p90 ${q(frame.slice(10), 0.9).toFixed(2)}`);
console.log(`silhouette fit ms: median ${q(fit.slice(10), 0.5).toFixed(3)} p90 ${q(fit.slice(10), 0.9).toFixed(3)}`);
console.log(`tree sizes: samples ${trees.map((x) => x.t.stats!.samples).join(",")} vessels ${trees.map((x) => x.t.stats!.vessels).join(",")}`);
