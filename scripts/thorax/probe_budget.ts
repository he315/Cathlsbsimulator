// Static segment budget against habitus: total, vessel, twig, rib and bronchus segments per patient.
// Run: npx vite-node scripts/thorax/probe_budget.ts
import { buildAnatomy } from "../../src/simulation/anatomy";
import { CASE_LIBRARY } from "../../src/simulation/caseGenerator";
import { buildCoronaryTree } from "../../src/render/xray/coronaryTree";
import { buildThorax, thoraxGenome, SEG_FLOATS, LUNG_VESSEL_MU } from "../../src/render/xray/thorax";
import { LEAF_RADIUS } from "../../src/render/xray/pulmonaryTree";

const c = CASE_LIBRARY[0];
const tree = buildCoronaryTree(buildAnatomy(c), c);
const rows: Record<string, number | string>[] = [];
for (const seed of [1, 2, 3, 4]) {
  for (const habitus of [0.85, 1.0, 1.25]) {
    const g = { ...thoraxGenome(seed), habitus };
    const t0 = performance.now();
    const th = buildThorax({ resp: 0, heart: tree.heart, genome: g, segments: true });
    const ms = performance.now() - t0;
    const d = th.segments!.stat.data;
    let ves = 0,
      twig = 0,
      bron = 0,
      other = 0,
      len = 0;
    for (let i = 0; i < th.segments!.stat.count; i++) {
      const o = i * SEG_FLOATS;
      if (Math.abs(d[o + 16] - LUNG_VESSEL_MU) < 1e-6) {
        ves++;
        len += Math.hypot(d[o + 4] - d[o], d[o + 5] - d[o + 1], d[o + 6] - d[o + 2]);
        if (d[o + 3] <= LEAF_RADIUS * 0.9 + 1e-6) twig++;
      } else if (d[o + 20] < 0) bron++;
      else other++;
    }
    rows.push({ seed, habitus, buildMs: Math.round(ms), total: th.segments!.stat.count, vessel: ves, twig, bronchus: bron, bonesAndCartilage: other, vesselM: +(len / 1000).toFixed(1) });
  }
}
console.table(rows);
