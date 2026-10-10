import { buildAnatomy, toWorld } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/anatomy";
import { buildCoronaryTree, samplePos } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree";
import { makeCamera, treeCentre } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder";
import { cameraBasis } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/projection";
import { V3 } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/heart";
const c: any = { id: "x", accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance: "right", variants: [], lesions: [] };
const model = buildAnatomy(c); const tree = buildCoronaryTree(model, c);
for (const cc of [-30, 0, 30]) {
  const b = cameraBasis({ laoRao: 0, cranialCaudal: cc });
  const cam = makeCamera({ laoRao: 0, cranialCaudal: cc }, treeCentre(tree, "left"), 230);
  const det = V3.sub(cam.detC, treeCentre(tree, "left"));
  for (const name of ["LAD", "RCA", "LCx"]) {
    const v = tree.vessels.find((x) => x.name === name)!;
    const P = v.samples.map((s) => toWorld(model, samplePos(tree.heart, s)));
    let L = 0; for (let i = 1; i < P.length; i++) { const d = V3.sub(P[i], P[i - 1]); L += Math.hypot(V3.dot(d, b.right), V3.dot(d, b.up)); }
    console.log("cranialCaudal", cc, "detector dir y", (det.y / Math.hypot(det.x, det.y, det.z)).toFixed(2), name, "projected length (orthographic, mm)", L.toFixed(0));
  }
}
