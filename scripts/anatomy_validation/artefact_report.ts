// CLI: generator artefacts (branches re-entering their parent, interpenetrating same-tree pairs) on the case library
// trees S2b counted (CASE_LIBRARY[0..2]) and on N genomes, with examples.
// usage: npx vite-node scripts/anatomy_validation/artefact_report.ts [nGenomes=12] [examples=6]
import { buildAnatomy } from "../../src/simulation/anatomy";
import { CASE_LIBRARY } from "../../src/simulation/caseGenerator";
import type { AnatomyCase, Dominance } from "../../src/types";
import { buildCoronaryTree } from "../../src/render/xray/coronaryTree";
import { clearTopologyCache } from "../../src/render/xray/coronaryGrowth";
import { treeArtefacts, quantile as q } from "./metrics";

const n = +(process.argv[2] ?? 12);
const nEx = +(process.argv[3] ?? 6);
const mk = (id: string, dominance: Dominance = "right"): AnatomyCase =>
  ({ id, name: id, difficulty: 1, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance, variants: [], pathology: "none", lesions: [], recommendedCatheters: [], acceptableCatheters: [], requiredViews: [], traps: [], objectives: [], teachingSummary: "" }) as AnatomyCase;
clearTopologyCache();
const fmt = (a: number[]) => `p10 ${q(a, 0.1).toFixed(1)} p50 ${q(a, 0.5).toFixed(1)} p90 ${q(a, 0.9).toFixed(1)} max ${Math.max(...a)}`;
const rows: { re: number; ip: number; named: number; cross: number }[] = [];
const cases: AnatomyCase[] = [...CASE_LIBRARY.slice(0, 3), ...Array.from({ length: n }, (_, i) => mk(`genome-${i}`, i % 10 === 9 ? "left" : i % 10 === 8 ? "codominant" : "right"))];
cases.forEach((c, k) => {
  const tree = buildCoronaryTree(buildAnatomy(c), c);
  const a = treeArtefacts(tree);
  const isNamed = (s: string) => !s.includes("twig");
  const named = a.interpenetration.filter((x) => isNamed(x.a) && isNamed(x.b)).length;
  rows.push({ re: a.reentry.length, ip: a.interpenetration.length, named, cross: a.crossFamily });
  if (k < 3) {
    console.log(`case ${k} (${c.id}): re-entry ${a.reentry.length}, interpenetrating pairs ${a.interpenetration.length} (named-named ${named}), left-right intersecting pairs ${a.crossFamily}`);
    for (const r of a.reentry.slice(0, nEx)) console.log(`   re-entry ${r.child}[${r.sample}] inside parent at sample ${r.parentSample} (origin ${r.origin})`);
    for (const r of a.interpenetration.slice(0, nEx)) console.log(`   pair ${r.a}[${r.ia}] ~ ${r.b}[${r.ib}] axis distance ${r.d.toFixed(2)} mm`);
  }
});
const lib = rows.slice(0, 3),
  gen = rows.slice(3);
console.log(`CASE_LIBRARY[0..2]: re-entry ${lib.map((r) => r.re).join("/")}, interpenetrating pairs ${lib.map((r) => r.ip).join("/")}, named-named ${lib.map((r) => r.named).join("/")}, left-right ${lib.map((r) => r.cross).join("/")}`);
if (gen.length) console.log(`${gen.length} genomes: re-entry ${fmt(gen.map((r) => r.re))}; interpenetrating pairs ${fmt(gen.map((r) => r.ip))}; named-named ${fmt(gen.map((r) => r.named))}; left-right ${fmt(gen.map((r) => r.cross))}`);
