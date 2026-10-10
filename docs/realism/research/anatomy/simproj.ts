// Project the CathMaster coronary tree in a given C-arm view and rasterise a simple iodine
// line-integral image (no noise, no anatomy) so vessel courses can be compared with real cines.
// Optional: overlay end-diastole (gray) and end-systole (red) to visualise cardiac motion.
import { buildAnatomy, toWorld } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/anatomy";
import { buildCoronaryTree, samplePos } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree";
import { makeCamera, treeCentre } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder";
import { V3 } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/heart";
import { writePng } from "./img.mjs";

type Vec3 = { x: number; y: number; z: number };
const [domArg, sideArg, lrArg, ccArg, outArg, motionArg] = process.argv.slice(2);
const dom = (domArg || "right") as any;
const side = (sideArg || "left") as "left" | "right";
const lr = +lrArg, cc = +ccArg;
const c: any = { id: "audit-" + dom, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance: dom, variants: [], lesions: [] };
const model = buildAnatomy(c);
const tree = buildCoronaryTree(model, c);
const H = tree.heart;
const N = 512;
const field = 230;
const iso = treeCentre(tree, side);
const cam = makeCamera({ laoRao: lr, cranialCaudal: cc }, iso, field);
const u = V3.nrm(cam.detU), w = V3.nrm(cam.detV);
const half = field / 2;
function proj(p: Vec3) {
  // ray from source through p onto detector plane
  const d = V3.sub(p, cam.src);
  const n = V3.nrm(V3.sub(cam.detC, cam.src));
  const t = V3.dot(V3.sub(cam.detC, cam.src), n) / V3.dot(d, n);
  const q = V3.add(cam.src, V3.sc(d, t));
  const r = V3.sub(q, cam.detC);
  return { x: ((V3.dot(r, u) / half) * 0.5 + 0.5) * N, y: (0.5 - (V3.dot(r, w) / half) * 0.5) * N, mag: t };
}
const pxPerMm = N / field;
function render(e: number, acc: Float32Array) {
  for (const v of tree.vessels) {
    if (v.side !== side) continue;
    const pts = v.samples.map((s) => toWorld(model, samplePos(H, s, { contraction: e })));
    for (let i = 0; i < pts.length - 1; i++) {
      const a = proj(pts[i]), b = proj(pts[i + 1]);
      const r = v.radii[i] * a.mag * pxPerMm;
      const seg = Math.hypot(b.x - a.x, b.y - a.y);
      const steps = Math.max(1, Math.ceil(seg / 0.5));
      for (let k = 0; k < steps; k++) {
        const t = k / steps, cx = a.x + (b.x - a.x) * t, cy = a.y + (b.y - a.y) * t;
        const R = Math.max(0.6, r);
        for (let y = Math.floor(cy - R - 1); y <= cy + R + 1; y++) for (let x = Math.floor(cx - R - 1); x <= cx + R + 1; x++) {
          if (x < 0 || y < 0 || x >= N || y >= N) continue;
          const dd = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
          if (dd < R) acc[y * N + x] = Math.max(acc[y * N + x], 2 * Math.sqrt(R * R - dd * dd) / pxPerMm); // chord (mm), max to avoid overdraw sums
        }
      }
    }
  }
}
const ed = new Float32Array(N * N);
render(0, ed);
if (motionArg === "motion") {
  const es = new Float32Array(N * N);
  render(1, es);
  const rgb = new Uint8Array(N * N * 3);
  for (let k = 0; k < N * N; k++) {
    const a = Math.exp(-0.5 * ed[k]), b = Math.exp(-0.5 * es[k]);
    rgb[k * 3] = Math.round(235 * Math.min(a, 1)); // ED dark in all channels
    rgb[k * 3 + 1] = Math.round(235 * a * b);
    rgb[k * 3 + 2] = Math.round(235 * a * b);
    if (b < 0.9 && a > 0.9) { rgb[k * 3] = 220; rgb[k * 3 + 1] = 40; rgb[k * 3 + 2] = 40; }
  }
  writePng(outArg, N, N, rgb, 3);
} else {
  const g = new Uint8Array(N * N);
  for (let k = 0; k < N * N; k++) g[k] = Math.round(225 * Math.exp(-0.45 * ed[k]) + 15);
  writePng(outArg, N, N, g, 1);
}
