// C1 (wave 2) calibration probe: CPU maps of the exact anatomy for one capture view, frame k.
// Writes a raw float32 file per map (n x n, rows top-down) plus a JSON header to scripts/thorax/out/c1/.
//   npx vite-node scripts/thorax/probe_c1.ts -- <view preset> <scenario> [k] [n]
// Maps: P (anatomy line integral, no clutter, no bones), lung (aerated lung path, mm), heart (chord through
// the union of the cardiac shapes, mm), dome (chord through liver + left dome, mm).
import { mkdirSync, writeFileSync } from "node:fs";
import { prepareScenario, resolveSpec, sceneInputAt } from "../../src/dev/xrayCapture";
import { buildXrayScene } from "../../src/render/xray/sceneBuilder";
import { ANAT, ANATOMY_TUNE, shapeInterval, traceAnat } from "../../src/render/xray/thorax";

// C1_TUNE='{"dome":{"apexR":-45}}' merges into ANATOMY_TUNE (objects field by field) before the scene is built
for (const [k, x] of Object.entries(JSON.parse(process.env.C1_TUNE ?? "{}") as Record<string, unknown>)) {
  const T = ANATOMY_TUNE as Record<string, unknown>;
  T[k] = x && typeof x === "object" ? { ...(T[k] as object), ...(x as object) } : x;
}
const args = process.argv.slice(2).filter((a) => a !== "--");
const view = args[0] ?? "apcranial";
const scenario = args[1] ?? "lad-focal";
const k = Number(args[2] ?? 2);
const n = Number(args[3] ?? 160);
const R = resolveSpec({ set: "probe", name: "p", view, scenario, nFrames: 51, injection: { at: 0, duration: 2.2 }, annotate: false, upload: false });
const p = prepareScenario(R.scenario);
const inp = sceneInputAt(p, R, k, {});
const r = buildXrayScene(inp);
const cam = r.scene.cam;
const anat = r.scene.anat;
const heartIdx = [ANAT.HEART, ANAT.RV, ANAT.RA, ANAT.LA, ANAT.LAA, ANAT.RVOT, ANAT.HEART_FAT, ANAT.RV_FAT, ANAT.FAT_PAD];
const domeIdx = [ANAT.LIVER, ANAT.LEFT_DOME];
const maps: Record<string, Float32Array> = { P: new Float32Array(n * n), lung: new Float32Array(n * n), heart: new Float32Array(n * n), dome: new Float32Array(n * n) };
const union = (ivs: [number, number][]) => {
  const v = ivs.filter((i) => i[1] > i[0]).sort((a, b) => a[0] - b[0]);
  let cov = 0,
    s = -1e9,
    e = -1e9;
  for (const i of v) {
    if (i[0] > e) {
      cov += Math.max(0, e - s);
      s = i[0];
      e = i[1];
    } else e = Math.max(e, i[1]);
  }
  return cov + Math.max(0, e - s);
};
for (let y = 0; y < n; y++)
  for (let x = 0; x < n; x++) {
    const u = ((x + 0.5) / n) * 2 - 1;
    const vv = 1 - ((y + 0.5) / n) * 2;
    const pt = { x: cam.detC.x + u * cam.detU.x + vv * cam.detV.x, y: cam.detC.y + u * cam.detU.y + vv * cam.detV.y, z: cam.detC.z + u * cam.detU.z + vv * cam.detV.z };
    const d = { x: pt.x - cam.src.x, y: pt.y - cam.src.y, z: pt.z - cam.src.z };
    const L = Math.hypot(d.x, d.y, d.z);
    const rd = { x: d.x / L, y: d.y / L, z: d.z / L };
    const t = traceAnat(anat, cam.src, rd);
    const i = y * n + x;
    maps.P[i] = t.P;
    maps.lung[i] = t.lungPath;
    maps.heart[i] = union(heartIdx.filter((j) => anat[j]).map((j) => shapeInterval(anat[j], cam.src, rd)));
    maps.dome[i] = union(domeIdx.map((j) => shapeInterval(anat[j], cam.src, rd)));
  }
const dir = "scripts/thorax/out/c1";
mkdirSync(dir, { recursive: true });
const tag = `${view}_${scenario}_k${k}`;
for (const [name, a] of Object.entries(maps)) writeFileSync(`${dir}/${tag}_${name}.f32`, Buffer.from(a.buffer));
writeFileSync(`${dir}/${tag}.json`, JSON.stringify({ n, view, scenario, k, cArm: R.cArm, field: inp.field, shapes: anat.map((s) => ({ name: s.name, c: s.c, half: s.half, mu: s.mu })) }, null, 1));
console.log("wrote", tag);
