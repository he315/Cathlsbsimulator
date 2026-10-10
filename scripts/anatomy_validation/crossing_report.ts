// CLI: what the mid-tree transect crossings are made of (library/transect2.mjs count on the synthetic raster), by vessel
// class, and the calibre budget of the left tree. usage: npx vite-node scripts/anatomy_validation/crossing_report.ts [n=16]
import { buildAnatomy } from "../../src/simulation/anatomy";
import type { AnatomyCase, CArm, Dominance } from "../../src/types";
import { buildCoronaryTree } from "../../src/render/xray/coronaryTree";
import { clearTopologyCache } from "../../src/render/xray/coronaryGrowth";
import { rasterMetrics, quantile as q } from "./metrics";

const n = +(process.argv[2] ?? 16);
const mk = (id: string, dominance: Dominance = "right"): AnatomyCase =>
  ({ id, name: id, difficulty: 1, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance, variants: [], pathology: "none", lesions: [], recommendedCatheters: [], acceptableCatheters: [], requiredViews: [], traps: [], objectives: [], teachingSummary: "" }) as AnatomyCase;
const V = (lr: number, cc: number): CArm => ({ laoRao: lr, cranialCaudal: cc });
clearTopologyCache();
const trees = Array.from({ length: n }, (_, i) => {
  const c = mk(`genome-${i}`, i % 10 === 9 ? "left" : i % 10 === 8 ? "codominant" : "right");
  const model = buildAnatomy(c);
  return { model, tree: buildCoronaryTree(model, c) };
});
const cls = (name: string) =>
  name.includes("twig") ? `twig g${name.split("twig").length - 1}` : /^S\d+$/.test(name) ? "septal" : /^D\d+$/.test(name) ? "diagonal" : /^OM\d+$/.test(name) ? "marginal" : ["LAD", "LCx", "LM", "RAMUS"].includes(name) ? name : "other named";
for (const [view, lr, cc, real] of [["LCA_RAOcra", -29, 25, 8], ["LCA_APcra", 0, 32, 7], ["LCA_LAOcra", 30.5, 27, 4]] as const) {
  const counts = new Map<string, number>();
  let rows = 0;
  const med: number[] = [];
  trees.forEach(({ model, tree }, k) => {
    const r = rasterMetrics(tree, model, "left", V(lr, cc), k);
    med.push(r.median);
    for (const p of r.peaks) {
      rows++;
      for (const v of p.vessels) counts.set(cls(v), (counts.get(cls(v)) ?? 0) + 1);
    }
  });
  const parts = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c, x]) => `${c} ${(x / rows).toFixed(2)}`);
  console.log(`${view} median crossings p50 ${q(med, 0.5)} (real ${real}); mean per row by class: ${parts.join(", ")}`);
}
// calibre budget: diameter at origin of the left tree's vessels, and how many are wide enough to be seen (>= 0.75 mm over 15 mm)
const vis: number[] = [];
const visTw: number[] = [];
for (const { tree } of trees) {
  let a = 0,
    b = 0;
  for (const v of tree.vessels) {
    if (v.side !== "left") continue;
    const r = v.refRadii ?? v.radii;
    let run = 0;
    for (let i = 1; i < r.length; i++) if (2 * r[i] >= 0.75) run += v.pathMm[i] - v.pathMm[i - 1];
    if (run >= 15) {
      a++;
      if (v.kind === "twig") b++;
    }
  }
  vis.push(a);
  visTw.push(b);
}
console.log(`left vessels with >= 15 mm at diameter >= 0.75 mm: p50 ${q(vis, 0.5)} (of which small branches ${q(visTw, 0.5)})`);
