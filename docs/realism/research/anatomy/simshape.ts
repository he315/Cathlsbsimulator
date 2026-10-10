// 2D shape metrics of the simulator's projected main vessels (mm at the iso-centre plane), same code as for real traces.
import { buildAnatomy, toWorld } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/anatomy";
import { buildCoronaryTree, samplePos } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree";
import { makeCamera, treeCentre } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder";
import { V3 } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/heart";
// @ts-ignore
import { shapeMetrics } from "./shape.mjs";

const SID = 1060, SOD = 760;
const views: Record<string, [number, number, string, string]> = {
  LAD_RAOcra: [-30, 25, "left", "LAD"], LAD_RAOcra_true: [-30, -25, "left", "LAD"], LAD_APcra_true: [0, -32, "left", "LAD"],
  LAD_APcra: [0, 32, "left", "LAD"],
  RCA_LAO: [28, -3, "right", "RCA"],
  LCx_RAOcau: [-30, -25, "left", "LCx"],
};
const out: any = {};
for (const [k, [lr, cc, side, vessel]] of Object.entries(views)) {
  const rows: any[] = [];
  for (let seed = 0; seed < 8; seed++) {
    const c: any = { id: "case-" + seed, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance: "right", variants: [], lesions: [] };
    const model = buildAnatomy(c);
    const tree = buildCoronaryTree(model, c);
    const iso = treeCentre(tree, side as any);
    const cam = makeCamera({ laoRao: lr, cranialCaudal: cc }, iso, 230);
    const u = V3.nrm(cam.detU), w = V3.nrm(cam.detV);
    const n = V3.nrm(V3.sub(cam.detC, cam.src));
    const v = tree.vessels.find((x) => x.name === vessel)!;
    // include the LM for the LAD/LCx so the projected course starts at the ostium like the real traces
    const lm = tree.vessels.find((x) => x.name === "LM")!;
    const samples = vessel === "RCA" ? v.samples : [...lm.samples, ...v.samples];
    const pts = samples.map((s) => {
      const p = toWorld(model, samplePos(tree.heart, s));
      const d = V3.sub(p, cam.src);
      const t = V3.dot(V3.sub(cam.detC, cam.src), n) / V3.dot(d, n);
      const q = V3.sub(V3.add(cam.src, V3.sc(d, t)), cam.detC);
      return [V3.dot(q, u) / (SID / SOD), -V3.dot(q, w) / (SID / SOD)];
    });
    rows.push(shapeMetrics(pts, 1));
  }
  const med = (key: string) => { const a = rows.map((r) => r[key]).sort((p, q) => p - q); return a[Math.floor(a.length / 2)]; };
  out[k] = { n: rows.length, lengthMm: med("lengthMm"), arcChord: med("arcChord"), soamDegPerCm: med("soamDegPerCm"), inflPerCm: med("inflPerCm"), bends60Per10mm: med("bends60Per10mm"), all: rows.map((r) => [r.lengthMm, r.arcChord, r.soamDegPerCm, r.inflPerCm]) };
  console.log(k, JSON.stringify(out[k]));
}
