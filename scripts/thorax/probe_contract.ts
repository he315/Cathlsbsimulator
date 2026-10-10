// Ventricular silhouette half-axes at diastole and end-systole (affine fit to heart.ts motion).
import { buildAnatomy } from "../../src/simulation/anatomy";
import { CASE_LIBRARY } from "../../src/simulation/caseGenerator";
import { buildCoronaryTree } from "../../src/render/xray/coronaryTree";
import { buildThorax, ANAT } from "../../src/render/xray/thorax";
import { restPoint, surfacePoint } from "../../src/render/xray/heart";
const c = CASE_LIBRARY[0];
const H = buildCoronaryTree(buildAnatomy(c), c).heart;
for (const e of [0, 0.5, 1]) {
  const t = buildThorax({ resp: 0, heart: H, contraction: e });
  console.log(e, JSON.stringify(t.anat[ANAT.HEART].half.map((x) => +x.toFixed(1))), JSON.stringify(t.anat[ANAT.RV].half.map((x) => +x.toFixed(1))));
}
for (const [ell, phi] of [[0.9, 0], [-0.9, 90], [0, 90], [0, -90], [0, 180]]) {
  const a = restPoint(H, ell, phi, 0), b = surfacePoint(H, ell, phi, 0, { contraction: 1 });
  console.log(ell, phi, (Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z)).toFixed(1));
}
