import { buildAnatomy, toWorld } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/anatomy";
import { buildCoronaryTree, samplePos } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree";
import { makeCamera, treeCentre } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder";
import { V3 } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/heart";
// @ts-ignore
import { bands } from "./spectrum.mjs";
const SID = 1060, SOD = 760;
for (const [k, lr, cc, side, vessel] of [["LAD_RAOcra_true", -30, -25, "left", "LAD"], ["RCA_LAO", 28, 0, "right", "RCA"]] as const) {
  for (let seed = 0; seed < 3; seed++) {
    const c: any = { id: "sp" + seed, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance: "right", variants: [], lesions: [] };
    const model = buildAnatomy(c); const tree = buildCoronaryTree(model, c);
    const cam = makeCamera({ laoRao: lr, cranialCaudal: cc }, treeCentre(tree, side), 230);
    const u = V3.nrm(cam.detU), w = V3.nrm(cam.detV), n = V3.nrm(V3.sub(cam.detC, cam.src));
    const v = tree.vessels.find((x) => x.name === vessel)!;
    const pts = v.samples.map((s) => { const p = toWorld(model, samplePos(tree.heart, s)); const d = V3.sub(p, cam.src); const t = V3.dot(V3.sub(cam.detC, cam.src), n) / V3.dot(d, n); const q = V3.sub(V3.add(cam.src, V3.sc(d, t)), cam.detC); return [V3.dot(q, u) / (SID / SOD), -V3.dot(q, w) / (SID / SOD)]; });
    const b = bands(pts, 1);
    console.log("SIM", k, seed, JSON.stringify(Object.fromEntries(Object.entries(b).map(([kk, vv]) => [kk, typeof vv === "number" ? +(vv as number).toFixed(1) : vv]))));
  }
}
