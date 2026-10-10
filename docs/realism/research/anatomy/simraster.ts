// Synthetic contrast-only image of the simulator tree at the real-library scale (0.3077 mm/px at iso),
// realistic iodine contrast and noise, then the same transect vessel count as for the real frames.
import { buildAnatomy, toWorld } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/anatomy";
import { buildCoronaryTree, samplePos } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree";
import { makeCamera, treeCentre } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder";
import { V3 } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/heart";
// @ts-ignore
import { vesselness } from "./skel.mjs";
// @ts-ignore
import { countRows } from "./countrows.mjs";
// @ts-ignore
import { writePng } from "./img.mjs";
const N = 512, MMPX = 0.3077, SID = 1060, SOD = 760;
const views: [string, number, number, "left" | "right"][] = [["LCA_RAOcra_true", -30, -25, "left"], ["LCA_APcra_true", 0, -30, "left"], ["LCA_LAOcra_true", 32, -26, "left"], ["LCA_RAOcra_code", -30, 25, "left"]];
for (const [name, lr, cc, side] of views) {
  const res: number[] = [];
  for (let seed = 0; seed < 6; seed++) {
    const c: any = { id: "s" + seed, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance: "right", variants: [], lesions: [] };
    const model = buildAnatomy(c); const tree = buildCoronaryTree(model, c);
    const cam = makeCamera({ laoRao: lr, cranialCaudal: cc }, treeCentre(tree, side), 230);
    const u = V3.nrm(cam.detU), w = V3.nrm(cam.detV), n = V3.nrm(V3.sub(cam.detC, cam.src));
    const proj = (p: any) => { const d = V3.sub(p, cam.src); const t = V3.dot(V3.sub(cam.detC, cam.src), n) / V3.dot(d, n); const q = V3.sub(V3.add(cam.src, V3.sc(d, t)), cam.detC); return { x: N / 2 + V3.dot(q, u) / (SID / SOD) / MMPX, y: N / 2 - V3.dot(q, w) / (SID / SOD) / MMPX, m: t * SOD / SID }; };
    const path = new Float32Array(N * N);
    for (const v of tree.vessels) {
      if (v.side !== side) continue;
      const P = v.samples.map((s) => proj(toWorld(model, samplePos(tree.heart, s))));
      for (let i = 0; i < P.length - 1; i++) {
        const a = P[i], b = P[i + 1], r = (v.radii[i] * a.m) / MMPX;
        const seg = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.max(1, Math.ceil(seg / 0.5));
        for (let k = 0; k < steps; k++) {
          const cx = a.x + ((b.x - a.x) * k) / steps, cy = a.y + ((b.y - a.y) * k) / steps;
          for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
            if (x < 0 || y < 0 || x >= N || y >= N) continue;
            // sub-pixel coverage approximation: chord length through the cylinder (mm)
            const dd = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
            if (dd < r + 0.5) path[y * N + x] = Math.max(path[y * N + x], 2 * Math.sqrt(Math.max(0, r * r - Math.min(dd, r) ** 2)) * MMPX + (r < 0.6 ? 0.15 : 0));
          }
        }
      }
    }
    // image: background 150, iodine contrast 0.162/mm chord, 3x3 blur, gaussian noise sd 3.2
    let rs = 12345 + seed; const rnd = () => ((rs = (rs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    const img = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) img[i] = 150 * Math.exp(-0.162 * path[i]);
    const bl = new Float32Array(N * N);
    for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { let s = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) s += img[(y + a) * N + x + b]; bl[y * N + x] = s / 9; }
    const px = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) { const g = Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd()); px[i] = Math.max(0, Math.min(255, Math.round((bl[i] || 150) + 3.2 * g))); }
    if (seed === 0) writePng(`sim/raster_${name}.png`, N, N, px, 1);
    const cnt = countRows(vesselness(px));
    if (cnt) res.push(cnt.slice().sort((a: number, b: number) => a - b)[2]);
  }
  console.log(name, "transect crossings (median per image) over seeds:", JSON.stringify(res));
}
