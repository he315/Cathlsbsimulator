// C1 (wave 2) probe: axial (or coronal) slice of the exact anatomy of one capture frame, as an 8-bit PGM.
//   npx vite-node scripts/thorax/probe_c1_slice.ts -- <view preset> <scenario> <axial|coronal> <level mm> [out.pgm]
// Grey levels: 255 aerated lung (lung shape outside every carve shape), 170 heart and pericardial shapes,
// 120 other carve shapes (mediastinum, domes, great vessels), 80 body soft tissue, 30 bone, 0 outside.
import { writeFileSync } from "node:fs";
import { prepareScenario, resolveSpec, sceneInputAt } from "../../src/dev/xrayCapture";
import { buildXrayScene } from "../../src/render/xray/sceneBuilder";
import { ANAT, ANATOMY_TUNE, type Shape } from "../../src/render/xray/thorax";

// C1_TUNE='{"dome":{"apexR":-45}}' merges into ANATOMY_TUNE (objects field by field) before the scene is built
for (const [k, x] of Object.entries(JSON.parse(process.env.C1_TUNE ?? "{}") as Record<string, unknown>)) {
  const T = ANATOMY_TUNE as Record<string, unknown>;
  T[k] = x && typeof x === "object" ? { ...(T[k] as object), ...(x as object) } : x;
}
const args = process.argv.slice(2).filter((a) => a !== "--");
const [view = "raocaudal", scenario = "lad-focal", plane = "axial", lv = "-50", out = "scripts/thorax/out/c1/slice.pgm"] = args;
const level = Number(lv);
const R = resolveSpec({ set: "probe", name: "p", view, scenario, nFrames: 51, injection: null, annotate: false, upload: false });
const p = prepareScenario(R.scenario);
const r = buildXrayScene(sceneInputAt(p, R, 2, {}));
const anat = r.scene.anat;
const inside = (s: Shape, q: { x: number; y: number; z: number }) => {
  const d = { x: q.x - s.c.x, y: q.y - s.c.y, z: q.z - s.c.z };
  const l = s.ax.map((a, i) => (d.x * a.x + d.y * a.y + d.z * a.z) / s.half[i]);
  if (s.type === 0) return l[0] * l[0] + l[1] * l[1] + l[2] * l[2] <= 1;
  if (s.type === 1) return l[0] * l[0] + l[2] * l[2] <= 1 && Math.abs(l[1]) <= 1;
  return Math.abs(l[0]) <= 1 && Math.abs(l[1]) <= 1 && Math.abs(l[2]) <= 1;
};
const heartSet = new Set([ANAT.HEART, ANAT.RV, ANAT.HEART_FAT, ANAT.RV_FAT, ANAT.RA, ANAT.LA, ANAT.LAA, ANAT.RVOT, ANAT.FAT_PAD]);
const W = 180,
  H = 120,
  mm = 2;
const px = new Uint8Array(W * H);
for (let j = 0; j < H; j++)
  for (let i = 0; i < W; i++) {
    const a = (i - W / 2) * mm;
    const b = (H / 2 - j) * mm;
    const q = plane === "axial" ? { x: a, y: level, z: b - 46 } : { x: a, y: b - 20, z: level };
    let g = 0;
    if (inside(anat[0], q)) g = 80;
    const carved = anat.some((s) => s.carve && inside(s, q));
    const lung = anat.some((s) => s.lung && inside(s, q));
    if (lung && !carved) g = 255;
    else if (anat.some((s, k) => heartSet.has(k) && inside(s, q))) g = 170;
    else if (carved) g = 120;
    if (r.scene.bones.some((bn) => bn.mu > 0.01 && inside(bn, q))) g = 30;
    px[j * W + i] = g;
  }
writeFileSync(out, Buffer.concat([Buffer.from(`P5\n${W} ${H}\n255\n`), Buffer.from(px)]));
console.log("wrote", out, "x -180..180 mm left to right (patient left = +x), ", plane === "axial" ? "z +74 (anterior) top" : "y +100 top");
