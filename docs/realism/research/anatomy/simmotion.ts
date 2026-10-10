import { buildAnatomy, toWorld } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/anatomy";
import { buildCoronaryTree, samplePos } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree";
import { makeCamera, treeCentre, contraction } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder";
import { V3 } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/heart";
const c: any = { id: "m", accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance: "right", variants: [], lesions: [] };
const model = buildAnatomy(c); const tree = buildCoronaryTree(model, c); const H = tree.heart;
const SID = 1060, SOD = 760;
function run(name: string, withLM: boolean, lr: number, cc: number, side: "left" | "right") {
  const cam = makeCamera({ laoRao: lr, cranialCaudal: cc }, treeCentre(tree, side), 230);
  const u = V3.nrm(cam.detU), w = V3.nrm(cam.detV), n = V3.nrm(V3.sub(cam.detC, cam.src));
  const proj = (p: any) => { const d = V3.sub(p, cam.src); const t = V3.dot(V3.sub(cam.detC, cam.src), n) / V3.dot(d, n); const q = V3.sub(V3.add(cam.src, V3.sc(d, t)), cam.detC); return [V3.dot(q, u) / (SID / SOD), V3.dot(q, w) / (SID / SOD)]; };
  const v = tree.vessels.find((x) => x.name === name)!; const lm = tree.vessels.find((x) => x.name === "LM")!;
  const S = withLM ? [...lm.samples, ...v.samples] : v.samples;
  // arc-length positions at rest
  const P0 = S.map((s) => toWorld(model, samplePos(H, s)));
  const L = [0]; for (let i = 1; i < P0.length; i++) L.push(L[i - 1] + Math.hypot(P0[i].x - P0[i - 1].x, P0[i].y - P0[i - 1].y, P0[i].z - P0[i - 1].z));
  const out: string[] = [];
  for (const f of [0.1, 0.3, 0.5, 0.7, 0.9]) {
    const i = L.findIndex((x) => x >= f * L[L.length - 1]);
    const traj = []; for (let k = 0; k < 60; k++) traj.push(proj(toWorld(model, samplePos(H, S[i], { contraction: contraction(k / 60) }))));
    let mx = 0; for (const a of traj) for (const b of traj) mx = Math.max(mx, Math.hypot(a[0] - b[0], a[1] - b[1]));
    out.push(`${Math.round(f * 100)}%:${mx.toFixed(1)}`);
  }
  console.log(name, withLM ? "(LM+)" : "", `view ${lr}/${cc}`, out.join(" "), "mm");
}
run("RCA", false, 28, -3, "right"); run("RCA", false, 28, 3, "right");
run("LAD", true, -30, 25, "left"); run("LAD", true, -30, -25, "left");
run("LCx", true, -25, -20, "left"); run("LCx", true, -25, 20, "left");
// heart frame motion: base descent and twist check (apex rotation sign seen from apex)
const s0 = samplePos(H, { ell: 0.8, phi: 0, h: 0, w: 1 } as any, { contraction: 0 }), s1 = samplePos(H, { ell: 0.8, phi: 0, h: 0, w: 1 } as any, { contraction: 1 });
const ax = V3.add(H.base, V3.sc(H.L, H.len * 0.9));
const r0 = V3.sub(s0, ax), r1 = V3.sub(s1, ax);
console.log("apical rotation sign dot(L, r0 x r1) =", V3.dot(H.L, V3.cross(r0, r1)).toFixed(2), "(positive = counterclockwise seen from the apex)");
const b0 = samplePos(H, { ell: -0.9, phi: 0, h: 0, w: 1 } as any, { contraction: 0 }), b1 = samplePos(H, { ell: -0.9, phi: 0, h: 0, w: 1 } as any, { contraction: 1 });
const axb = V3.add(H.base, V3.sc(H.L, H.len * 0.05));
console.log("basal rotation sign =", V3.dot(H.L, V3.cross(V3.sub(b0, axb), V3.sub(b1, axb))).toFixed(2));
console.log("base point descent along L (mm):", V3.dot(V3.sub(b1, b0), H.L).toFixed(1), " apex point along L:", V3.dot(V3.sub(s1, s0), H.L).toFixed(1));
