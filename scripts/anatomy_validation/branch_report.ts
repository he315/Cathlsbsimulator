// CLI: named side-branch calibres, SA-nodal length, side consistency and transect crossings over N genomes.
// usage: npx vite-node scripts/anatomy_validation/branch_report.ts [nGenomes=40]
import { buildAnatomy } from "../../src/simulation/anatomy";
import type { AnatomyCase, CArm, Dominance } from "../../src/types";
import { buildCoronaryTree, type CoronaryTree } from "../../src/render/xray/coronaryTree";
import { clearTopologyCache } from "../../src/render/xray/coronaryGrowth";
import { rasterMetrics, quantile as q } from "./metrics";

const n = +(process.argv[2] ?? 40);
const mk = (id: string, dominance: Dominance = "right", variants: string[] = []): AnatomyCase =>
  ({ id, name: id, difficulty: 1, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance, variants, pathology: "none", lesions: [], recommendedCatheters: [], acceptableCatheters: [], requiredViews: [], traps: [], objectives: [], teachingSummary: "" }) as AnatomyCase;
const fmt = (a: number[]) => (a.length ? `p10 ${q(a, 0.1).toFixed(2)} p25 ${q(a, 0.25).toFixed(2)} p50 ${q(a, 0.5).toFixed(2)} p75 ${q(a, 0.75).toFixed(2)} p90 ${q(a, 0.9).toFixed(2)} (n ${a.length})` : "none");
const V = (lr: number, cc: number): CArm => ({ laoRao: lr, cranialCaudal: cc });
const D = (t: CoronaryTree, name: string, at = 2) => {
  const v = t.vessels.find((x) => x.name === name);
  if (!v) return NaN;
  const i0 = Math.max(0, v.samples.findIndex((s) => s.w >= 0.5));
  return 2 * (v.refRadii ?? v.radii)[Math.min(v.samples.length - 1, i0 + at)];
};
const len = (t: CoronaryTree, name: string) => {
  const v = t.vessels.find((x) => x.name === name);
  return v ? v.pathMm[v.pathMm.length - 1] - v.pathMm[0] : NaN;
};
clearTopologyCache();
const trees = Array.from({ length: n }, (_, i) => {
  const c = mk(`branch-${i}`);
  const model = buildAnatomy(c);
  return { model, tree: buildCoronaryTree(model, c) };
});
const d1 = trees.map((t) => D(t.tree, "D1"));
const om1 = trees.map((t) => D(t.tree, "OM1"));
const om2 = trees.map((t) => D(t.tree, "OM2")).filter(Number.isFinite);
const both = trees.filter((t) => Number.isFinite(D(t.tree, "OM2")));
console.log("D1 near-ostial diameter", fmt(d1), "| Divia Paul men 1.83 ± 0.43, women 1.65 ± 0.41");
console.log("OM1 near-ostial diameter", fmt(om1), "| Divia Paul men 2.19 ± 0.48, women 2.05 ± 0.41");
console.log("OM2 near-ostial diameter", fmt(om2));
console.log("OM1 < OM2 in", both.filter((t) => D(t.tree, "OM1") < D(t.tree, "OM2")).length, "of", both.length);
const d2 = trees.filter((t) => Number.isFinite(D(t.tree, "D2")));
console.log("D1 < D2 in", d2.filter((t) => D(t.tree, "D1") < D(t.tree, "D2")).length, "of", d2.length);
console.log("SAN length mm", fmt(trees.map((t) => len(t.tree, "SAN")).filter(Number.isFinite)), "SAN diameter", fmt(trees.map((t) => D(t.tree, "SAN")).filter(Number.isFinite)));
console.log("LCx prox", fmt(trees.map((t) => D(t.tree, "LCx", 4))), "LAD prox", fmt(trees.map((t) => D(t.tree, "LAD", 4))));
console.log("twigs", fmt(trees.map((t) => t.tree.stats!.twigs)), "vessels", fmt(trees.map((t) => t.tree.stats!.vessels)), "samples", fmt(trees.map((t) => t.tree.stats!.samples)), "grow ms", fmt(trees.map((t) => t.tree.stats!.growMs)));
// side consistency, every variant
let bad = 0;
for (const variants of [[], ["anomalous-lcx-right-sinus"], ["anomalous-rca-left-sinus"], ["separate-ostia"]])
  for (const dom of ["right", "left", "codominant"] as Dominance[]) {
    const c = mk(`side-${dom}-${variants.join()}`, dom, variants);
    const t = buildCoronaryTree(buildAnatomy(c), c);
    for (const v of t.vessels) {
      const p = v.parent && t.vessels.find((x) => x.name === v.parent!.name);
      if (p && p.side !== v.side) bad++;
    }
  }
console.log("side mismatches parent/child over all variants:", bad);
for (const [view, lr, cc, real] of [["LCA_RAOcra", -29, 25, 8], ["LCA_APcra", 0, 32, 7], ["LCA_LAOcra", 30.5, 27, 4]] as const) {
  const r = trees.slice(0, 16).map(({ model, tree }, k) => rasterMetrics(tree, model, "left", V(lr, cc), k));
  console.log(view, "crossings median", fmt(r.map((x) => x.median)), "| real", real, " area>10", fmt(r.map((x) => x.area10 * 100)), "%");
}
