// Pulmonary tree statistics for a seed: segment count, length and blood volume by calibre.
import { buildAnatomy } from "../../src/simulation/anatomy";
import { CASE_LIBRARY } from "../../src/simulation/caseGenerator";
import { buildCoronaryTree } from "../../src/render/xray/coronaryTree";
import { buildThorax, SEG_FLOATS, LUNG_VESSEL_MU } from "../../src/render/xray/thorax";
const c = CASE_LIBRARY[0];
const tree = buildCoronaryTree(buildAnatomy(c), c);
const t0 = performance.now();
const th = buildThorax({ resp: 0, heart: tree.heart, seed: Number(process.argv[2] ?? 1), segments: true });
const ms = performance.now() - t0;
const d = th.segments!.stat.data;
let n = 0, vol = 0, len = 0;
const hist: Record<string, number> = {};
for (let i = 0; i < th.segments!.stat.count; i++) {
  const o = i * SEG_FLOATS;
  if (Math.abs(d[o + 16] - LUNG_VESSEL_MU) > 1e-6) continue;
  n++;
  const L = Math.hypot(d[o + 4] - d[o], d[o + 5] - d[o + 1], d[o + 6] - d[o + 2]);
  const r = (d[o + 3] + d[o + 7]) / 2;
  vol += Math.PI * r * r * L;
  len += L;
  const b = r < 0.5 ? "<0.5" : r < 1 ? "0.5-1" : r < 2 ? "1-2" : r < 4 ? "2-4" : ">4";
  hist[b] = (hist[b] ?? 0) + Math.round(L);
}
console.log(JSON.stringify({ buildMs: Math.round(ms), segments: th.segments!.stat.count, vesselSegments: n, bloodVolumeMl: +(vol / 1000).toFixed(1), lengthM: +(len / 1000).toFixed(1), lengthMmByRadius: hist }));
