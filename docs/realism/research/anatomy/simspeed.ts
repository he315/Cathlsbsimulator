import { buildAnatomy, toWorld } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/anatomy";
import { buildCoronaryTree, samplePos } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree";
import { makeCamera, treeCentre, contraction } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder";
import { V3 } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/heart";
const c: any = { id: "v", accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance: "right", variants: [], lesions: [] };
const model = buildAnatomy(c); const tree = buildCoronaryTree(model, c); const H = tree.heart;
const SID = 1060, SOD = 760;
for (const [name, lr, cc, side] of [["RCA", 28, 0, "right"], ["LAD", -30, -25, "left"]] as const) {
  const cam = makeCamera({ laoRao: lr, cranialCaudal: cc }, treeCentre(tree, side), 230);
  const u = V3.nrm(cam.detU), w = V3.nrm(cam.detV), n = V3.nrm(V3.sub(cam.detC, cam.src));
  const proj = (p: any) => { const d = V3.sub(p, cam.src); const t = V3.dot(V3.sub(cam.detC, cam.src), n) / V3.dot(d, n); const q = V3.sub(V3.add(cam.src, V3.sc(d, t)), cam.detC); return [V3.dot(q, u) / (SID / SOD), V3.dot(q, w) / (SID / SOD)]; };
  const v = tree.vessels.find((x) => x.name === name)!;
  const meds: number[] = [], p90s: number[] = [];
  for (const f of [0.1, 0.3, 0.5, 0.7, 0.9]) {
    const s = v.samples[Math.round(f * (v.samples.length - 1))];
    const sp: number[] = []; let prev: number[] | null = null;
    for (let k = 0; k < 15 * 6; k++) { const ph = (k / 15) * 72 / 60; const p = proj(toWorld(model, samplePos(H, s, { contraction: contraction(ph) }))); if (prev) sp.push(Math.hypot(p[0] - prev[0], p[1] - prev[1]) * 15); prev = p; }
    sp.sort((a, b) => a - b); meds.push(sp[Math.floor(sp.length / 2)]); p90s.push(sp[Math.floor(sp.length * 0.9)]);
  }
  console.log(name, "sim frame-to-frame speed at 15 f/s, 72 bpm: median per landmark", meds.map((x) => x.toFixed(0)).join(","), "mm/s; 90th pct", p90s.map((x) => x.toFixed(0)).join(","));
}
