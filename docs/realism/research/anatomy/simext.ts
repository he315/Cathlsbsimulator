import { buildAnatomy, toWorld } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/anatomy";
import { buildCoronaryTree, samplePos } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree";
import { makeCamera, treeCentre } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder";
import { V3 } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/heart";
const SID = 1060, SOD = 760;
const c: any = { id: "e", accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance: "right", variants: [], lesions: [] };
const model = buildAnatomy(c); const tree = buildCoronaryTree(model, c);
for (const [name, lr, cc, side] of [["LCA_RAOcau_true", -30, 25, "left"], ["LCA_RAOcra_true", -30, -25, "left"], ["LCA_APcra_true", 0, -30, "left"], ["LCA_LAOcau_true", 40, 28, "left"], ["LCA_LAOcra_true", 32, -26, "left"], ["RCA_LAO", 30, 0, "right"]] as const) {
  const cam = makeCamera({ laoRao: lr, cranialCaudal: cc }, treeCentre(tree, side), 230);
  const u = V3.nrm(cam.detU), w = V3.nrm(cam.detV), n = V3.nrm(V3.sub(cam.detC, cam.src));
  const xs: number[] = [], ys: number[] = [];
  for (const v of tree.vessels) { if (v.side !== side || v.radii[0] < 0.4) continue; for (const s of v.samples) { const p = toWorld(model, samplePos(tree.heart, s)); const d = V3.sub(p, cam.src); const t = V3.dot(V3.sub(cam.detC, cam.src), n) / V3.dot(d, n); const q = V3.sub(V3.add(cam.src, V3.sc(d, t)), cam.detC); xs.push(V3.dot(q, u) / (SID / SOD)); ys.push(V3.dot(q, w) / (SID / SOD)); } }
  xs.sort((a, b) => a - b); ys.sort((a, b) => a - b);
  const q = (A: number[], p: number) => A[Math.floor(p * (A.length - 1))];
  console.log(name, "extent p2-p98 mm at iso: w", (q(xs, 0.98) - q(xs, 0.02)).toFixed(0), "h", (q(ys, 0.98) - q(ys, 0.02)).toFixed(0));
}
