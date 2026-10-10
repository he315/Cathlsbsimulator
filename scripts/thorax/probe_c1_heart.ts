// C1 (wave 2) probe: is the coronary tree projected over the heart shadow?
// For each reference view, at capture frame k, the aerated lung path (mm) and the cardiac chord (mm) along the ray
// through every epicardial vessel sample (coronary tubes, iodine channel per point), against the lung path of the
// lung field beside the heart (90th centile of the lung path over a grid of rays across the field).
//   npx vite-node scripts/thorax/probe_c1_heart.ts -- [k]
import { REFERENCE_VIEWS, prepareScenario, resolveSpec, sceneInputAt, sceneTubes } from "../../src/dev/xrayCapture";
import { buildXrayScene } from "../../src/render/xray/sceneBuilder";
import { ANAT, ANATOMY_TUNE, shapeInterval, traceAnat } from "../../src/render/xray/thorax";

for (const [key, x] of Object.entries(JSON.parse(process.env.C1_TUNE ?? "{}") as Record<string, unknown>)) {
  const T = ANATOMY_TUNE as Record<string, unknown>;
  T[key] = x && typeof x === "object" ? { ...(T[key] as object), ...(x as object) } : x;
}
const args = process.argv.slice(2).filter((a) => a !== "--");
const k = Number(args[0] ?? 24);
const heartIdx = [ANAT.HEART, ANAT.RV, ANAT.RA, ANAT.LA, ANAT.LAA, ANAT.RVOT, ANAT.HEART_FAT, ANAT.RV_FAT, ANAT.FAT_PAD];
const union = (ivs: [number, number][]) => {
  const s = ivs.filter((i) => i[1] > i[0]).sort((a, b) => a[0] - b[0]);
  let cov = 0,
    a = -1e9,
    b = -1e9;
  for (const i of s) {
    if (i[0] > b) {
      cov += Math.max(0, b - a);
      a = i[0];
      b = i[1];
    } else b = Math.max(b, i[1]);
  }
  return cov + Math.max(0, b - a);
};
const q = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN;
};
const views = REFERENCE_VIEWS.filter((v) => !v.mode);
for (const V of views) {
  const R = resolveSpec({ set: "probe", name: "p", view: V.view, scenario: V.scenario, nFrames: 51, annotate: false, upload: false });
  const p = prepareScenario(R.scenario);
  const r = buildXrayScene(sceneInputAt(p, R, k, {}));
  const { cam, anat } = r.scene;
  const ray = (pt: { x: number; y: number; z: number }) => {
    const d = { x: pt.x - cam.src.x, y: pt.y - cam.src.y, z: pt.z - cam.src.z };
    const L = Math.hypot(d.x, d.y, d.z);
    const rd = { x: d.x / L, y: d.y / L, z: d.z / L };
    const t = traceAnat(anat, cam.src, rd);
    const h = union(heartIdx.filter((j) => anat[j]).map((j) => shapeInterval(anat[j], cam.src, rd)));
    return { lung: t.lungPath, heart: h };
  };
  const level = (s: (typeof anat)[number], p: { x: number; y: number; z: number }) => {
    const d = { x: p.x - s.c.x, y: p.y - s.c.y, z: p.z - s.c.z };
    const l = s.ax.map((a, i) => (d.x * a.x + d.y * a.y + d.z * a.z) / s.half[i]);
    return s.type === 0 ? Math.hypot(l[0], l[1], l[2]) : Math.max(Math.hypot(l[0], l[2]), Math.abs(l[1]));
  };
  const vl: number[] = [],
    vh: number[] = [],
    lev: number[] = [];
  for (const t of sceneTubes(r.scene)) {
    if (!Array.isArray(t.mu[0])) continue;
    for (let i = 0; i < t.pts.length; i += 3) {
      const s = ray(t.pts[i]);
      vl.push(s.lung);
      vh.push(s.heart);
      lev.push(Math.min(...heartIdx.filter((j) => anat[j]).map((j) => level(anat[j], t.pts[i]))));
    }
  }
  // where along the vessel rays the aerated lung lies: before the vessel point (source side) and after it
  // (detector side), by 1 mm point sampling (lung shape and no carve shape)
  const isIn = (s: (typeof anat)[number], p: { x: number; y: number; z: number }) => level(s, p) <= 1;
  const sideSplit: number[][] = [[], []];
  const where: { x: number[]; y: number[]; z: number[] } = { x: [], y: [], z: [] };
  for (const t of sceneTubes(r.scene)) {
    if (!Array.isArray(t.mu[0])) continue;
    for (let i = 0; i < t.pts.length; i += 9) {
      const pt = t.pts[i];
      const d = { x: pt.x - cam.src.x, y: pt.y - cam.src.y, z: pt.z - cam.src.z };
      const L = Math.hypot(d.x, d.y, d.z);
      let a = 0,
        b = 0;
      for (let s = -250; s <= 250; s += 1) {
        const p = { x: pt.x + (d.x / L) * s, y: pt.y + (d.y / L) * s, z: pt.z + (d.z / L) * s };
        if (anat.some((sh) => sh.lung && isIn(sh, p)) && !anat.some((sh) => sh.carve && isIn(sh, p))) {
          if (s < 0) {
            a++;
            where.x.push(p.x);
            where.y.push(p.y);
            where.z.push(p.z);
          } else b++;
        }
      }
      sideSplit[0].push(a);
      sideSplit[1].push(b);
    }
  }
  console.log(`  lung on the source side p50 ${q(sideSplit[0], 0.5)} mm, detector side p50 ${q(sideSplit[1], 0.5)} mm; source-side lung samples x/y/z p10-p50-p90 ${(["x", "y", "z"] as const).map((c) => [0.1, 0.5, 0.9].map((f) => q(where[c], f).toFixed(0)).join("/")).join("  ")}`);
  console.log(`  vessel points: min ellipsoid level over the cardiac shapes p25/p50/p75/p90 ${[0.25, 0.5, 0.75, 0.9].map((x) => q(lev, x).toFixed(2)).join("/")}`);
  const fl: number[] = [],
    off: number[] = [];
  const n = 48;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const u = ((x + 0.5) / n) * 2 - 1,
        w = 1 - ((y + 0.5) / n) * 2;
      const rr = ray({ x: cam.detC.x + u * cam.detU.x + w * cam.detV.x, y: cam.detC.y + u * cam.detU.y + w * cam.detV.y, z: cam.detC.z + u * cam.detU.z + w * cam.detV.z });
      fl.push(rr.lung);
      if (rr.heart <= 0 && rr.lung > 20) off.push(rr.lung);
    }
  const beside = q(fl, 0.9);
  const heartFrac = fl.filter((x) => x < 0.5 * beside).length / fl.length;
  console.log(
    `${V.name.padEnd(11)} vessel lung p25/p50/p75 ${q(vl, 0.25).toFixed(0)}/${q(vl, 0.5).toFixed(0)}/${q(vl, 0.75).toFixed(0)} mm  heart chord p50 ${q(vh, 0.5).toFixed(0)}  beside ${beside.toFixed(0)}  ratio ${(q(vl, 0.5) / beside).toFixed(2)}  off-heart lung p50 ${q(off, 0.5).toFixed(0)} (n ${off.length}) ratio ${(q(vl, 0.5) / q(off, 0.5)).toFixed(2)}  field<half ${(100 * heartFrac).toFixed(0)}%  n=${vl.length}`,
  );
}
