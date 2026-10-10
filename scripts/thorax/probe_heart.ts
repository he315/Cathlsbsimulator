// Coronary samples against the heart silhouette (carve envelope), wave-0 thorax vs S4 thorax.
import { buildAnatomy } from "../../src/simulation/anatomy";
import { CASE_LIBRARY } from "../../src/simulation/caseGenerator";
import { buildCoronaryTree, samplePos } from "../../src/render/xray/coronaryTree";
import { buildThorax, ANAT } from "../../src/render/xray/thorax";
import { buildThorax as buildW0 } from "./w0/thoraxW0";
const c = CASE_LIBRARY[0];
const tree = buildCoronaryTree(buildAnatomy(c), c);
const H = tree.heart;
function stats(anat: any[]) {
  const s = anat[ANAT.HEART_FAT];
  const m = anat[ANAT.HEART];
  const env = [ANAT.HEART_FAT, 21, ANAT.RA, ANAT.LA, 22, ANAT.RVOT, 23].map((i) => anat[i]).filter(Boolean);
  const q = (sh: any, p: any) => {
    const d = { x: p.x - sh.c.x, y: p.y - sh.c.y, z: p.z - sh.c.z };
    const a = sh.ax.map((ax: any, i: number) => (d.x * ax.x + d.y * ax.y + d.z * ax.z) / sh.half[i]);
    return Math.hypot(a[0], a[1], a[2]);
  };
  let n = 0, outFat = 0, outMyo = 0;
  const rs: number[] = [];
  for (const v of tree.vessels) {
    if (v.name.includes("twig")) continue;
    for (const sm of v.samples) {
      const p = samplePos(H, sm);
      n++;
      const rf = Math.min(...env.map((e: any) => q(e, p)));
      if (rf > 1) outFat++;
      if (q(m, p) > 1) outMyo++;
      rs.push(rf);
    }
  }
  rs.sort((a, b) => a - b);
  return { n, outsideFatEnvelope: (outFat / n).toFixed(3), outsideVentricles: (outMyo / n).toFixed(3), r50: rs[Math.floor(rs.length / 2)].toFixed(2), r90: rs[Math.floor(rs.length * 0.9)].toFixed(2), r99: rs[Math.floor(rs.length * 0.99)].toFixed(2) };
}
console.log("w0", JSON.stringify(stats(buildW0({ resp: 0, heart: H }).anat)));
console.log("s4", JSON.stringify(stats(buildThorax({ resp: 0, heart: H }).anat)));
