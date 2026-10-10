import { buildAnatomy } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/anatomy";
import { buildCoronaryTree, samplePos } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree";
import { surfacePoint } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/heart";
const c: any = { id: "audit-right", accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance: "right", variants: [], lesions: [] };
const m = buildAnatomy(c); const t = buildCoronaryTree(m, c); const H = t.heart;
const f = (p: any) => `(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})`;
console.log("A", f(H.A), "S", f(H.S), "L", f(H.L), "base", f(H.base), "apex", f({ x: H.base.x + H.L.x * H.len, y: H.base.y + H.L.y * H.len, z: H.base.z + H.L.z * H.len }));
console.log("LM os", f(m.lm.pos), "RCA os", f(m.rca.pos), "conus", f(m.conus.pos));
for (const n of ["LM", "LAD", "LCx", "RCA", "CONUS", "PDA", "S1", "D1", "OM1"]) {
  const v = t.vessels.find((x) => x.name === n)!;
  const pts = v.samples.map((s) => samplePos(H, s));
  const ys = pts.map((p) => p.y);
  console.log(n, "first", f(pts[0]), "k=4", f(pts[Math.min(4, pts.length - 1)]), "k=10", f(pts[Math.min(10, pts.length - 1)]), "maxY", Math.max(...ys).toFixed(1), "at", ys.indexOf(Math.max(...ys)), "last", f(pts[pts.length - 1]));
}
for (const phi of [0, 45, 90, 135, 180, -135, -90, -45]) console.log("AV groove ell=-0.9 phi", phi, f(surfacePoint(H, -0.9, phi, 3)));
