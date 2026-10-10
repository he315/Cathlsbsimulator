// CLI: projected LCA extents of the simulator, vessel-only and with an emulated contrast-filled catheter,
// against the library masks. usage: npx vite-node scripts/anatomy_validation/extent_report.ts [n=16]
import { buildAnatomy } from "../../src/simulation/anatomy";
import type { AnatomyCase, Dominance } from "../../src/types";
import { buildCoronaryTree } from "../../src/render/xray/coronaryTree";
import { extent, quantile as q } from "./metrics";
import ref from "./reference.json";
const n = +(process.argv[2] ?? 16);
const mk = (id: string, dominance: Dominance = "right"): AnatomyCase =>
  ({ id, name: id, difficulty: 1, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance, variants: [], pathology: "none", lesions: [], recommendedCatheters: [], acceptableCatheters: [], requiredViews: [], traps: [], objectives: [], teachingSummary: "" }) as AnatomyCase;
const trees = Array.from({ length: n }, (_, i) => { const c = mk(`genome-${i}`, i % 10 === 9 ? "left" : i % 10 === 8 ? "codominant" : "right"); const model = buildAnatomy(c); return { model, tree: buildCoronaryTree(model, c) }; });
const f = (a: number[]) => `${q(a, 0.25).toFixed(0)}/${q(a, 0.5).toFixed(0)}/${q(a, 0.75).toFixed(0)}`;
for (const view of ["LCA_RAOcau", "LCA_RAOcra", "LCA_APcra", "LCA_LAOcra"] as const) {
  const r = (ref.extents as any)[view];
  const V = { laoRao: r.angle.laoRao, cranialCaudal: r.angle.cranialCaudal };
  const e0 = trees.map(({ model, tree }) => extent(tree, model, "left", V));
  const e1 = trees.map(({ model, tree }) => extent(tree, model, "left", V, { catheter: true }));
  console.log(view.padEnd(11), "vessels w", f(e0.map((x) => x.w)), "h", f(e0.map((x) => x.h)), "| +catheter w", f(e1.map((x) => x.w)), "h", f(e1.map((x) => x.h)), "| real w", `${r.widthMm.p25}/${r.widthMm.median}/${r.widthMm.p75}`, "h", `${r.heightMm.p25}/${r.heightMm.median}/${r.heightMm.p75}`);
}
