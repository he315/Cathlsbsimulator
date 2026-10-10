import { makeHeart, surfacePoint, V3 } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/heart";
import { buildThorax, ANAT } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/thorax";
const H = makeHeart(1);
const th = buildThorax({ resp: 0, heart: H });
const E = th.anat[ANAT.HEART], F = th.anat[ANAT.HEART_FAT];
// distance from ellipsoid centre along direction d to its surface
function hit(S: any, o: any, d: any) {
  const oc = V3.sub(o, S.c);
  const q = (v: any) => [V3.dot(v, S.ax[0]) / S.half[0], V3.dot(v, S.ax[1]) / S.half[1], V3.dot(v, S.ax[2]) / S.half[2]];
  const a = q(d), b = q(oc);
  const A = a[0] ** 2 + a[1] ** 2 + a[2] ** 2, B = 2 * (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]), C = b[0] ** 2 + b[1] ** 2 + b[2] ** 2 - 1;
  return (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
}
console.log("phi  ell  vessel-radius  heart-ellipsoid-radius  fat-ellipsoid-radius (mm from long axis)");
for (const ell of [-0.8, -0.3, 0.2, 0.6]) for (const phi of [0, 90, 180, -90]) {
  const u = (ell + 1) / 2;
  const ax = V3.add(H.base, V3.sc(H.L, u * H.len));
  const p = surfacePoint(H, ell, phi, 3);
  const d = V3.nrm(V3.sub(p, ax));
  const rv = Math.hypot(...Object.values(V3.sub(p, ax)) as [number, number, number]);
  console.log(String(phi).padStart(4), ell.toFixed(1).padStart(5), rv.toFixed(1).padStart(8), hit(E, ax, d).toFixed(1).padStart(10), hit(F, ax, d).toFixed(1).padStart(10));
}
