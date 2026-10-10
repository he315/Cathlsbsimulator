// CLI: reach of the named branches and the depth of the epicardial courses, over CASE_LIBRARY and N genomes.
// - Named-branch lengths (mm, rest geometry) for PDA, D1-D4, OM1-OM3, PL1-PL3 and the PDA's end position on the
//   heart's long axis (ell; the posterior interventricular groove runs towards the apex, ell 1).
// - Myocardial bridges: genomes with one, and how many the grown vessel still flags (a bridge whose run floats above
//   -1.5 mm is not flagged and loses its systolic compression).
// - Depth of the LAD and of every other epicardial named vessel: samples beyond the origin region (ell > -0.85, on the
//   moving surface) that lie more than 1 mm or 3 mm below the epicardium (h < -1, h < -3), outside a flagged
//   myocardial bridge. Septal perforators and nodal arteries run deep by design and are left out.
// usage: npx vite-node scripts/anatomy_validation/named_report.ts [nGenomes=24] [perTree=0]
import { buildAnatomy } from "../../src/simulation/anatomy";
import { CASE_LIBRARY } from "../../src/simulation/caseGenerator";
import type { AnatomyCase, Dominance } from "../../src/types";
import { buildCoronaryTree, type TreeVessel } from "../../src/render/xray/coronaryTree";
import { clearTopologyCache, growTopology } from "../../src/render/xray/coronaryGrowth";
import { quantile as q } from "./metrics";

const n = +(process.argv[2] ?? 24);
const perTree = +(process.argv[3] ?? 0) > 0;
const mk = (id: string, dominance: Dominance = "right"): AnatomyCase =>
  ({ id, name: id, difficulty: 1, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance, variants: [], pathology: "none", lesions: [], recommendedCatheters: [], acceptableCatheters: [], requiredViews: [], traps: [], objectives: [], teachingSummary: "" }) as AnatomyCase;
clearTopologyCache();

const NAMES = ["PDA", "D1", "D2", "D3", "D4", "OM1", "OM2", "OM3", "PL1", "PL2", "PL3", "PLV", "AM1", "RV1"];
const deepExempt = (name: string) => /^S\d+$/.test(name) || /nodal|SAN|AVN|conus/i.test(name);
const lengthOf = (v: TreeVessel) => v.pathMm[v.pathMm.length - 1] - v.pathMm[0];

const cases: AnatomyCase[] = [...Array.from({ length: n }, (_, i) => mk(`genome-${i}`, i % 10 === 9 ? "left" : i % 10 === 8 ? "codominant" : "right")), ...CASE_LIBRARY];
const lens = new Map<string, number[]>();
const pdaEnd: number[] = [];
const vesselCount: number[] = [];
let pdaShort = 0,
  pdaTrees = 0;
const ladDeep1: number[] = [],
  ladDeep3: number[] = [],
  ladMin: number[] = [];
let otherDeep1 = 0,
  otherDeep3 = 0,
  otherMin = Infinity,
  otherWorst = "";
let bridges = 0,
  bridgesFlagged = 0;
const cutCount = new Map<string, number>();
const blockers = new Map<string, number>();
for (const c of cases) {
  const model = buildAnatomy(c);
  const tree = buildCoronaryTree(model, c);
  const cuts = tree.genome ? growTopology(model, tree.genome).cuts ?? [] : [];
  for (const x of cuts) {
    const k = x.name.replace(/\d+$/, "#");
    cutCount.set(k, (cutCount.get(k) ?? 0) + 1);
    const kb = `${x.name}<-${x.blocker.replace(/\d+$/, "#")}`;
    blockers.set(kb, (blockers.get(kb) ?? 0) + 1);
  }
  vesselCount.push(tree.vessels.length);
  const gb = tree.genome?.bridge;
  if (gb) {
    bridges++;
    if (tree.vessels.find((v) => v.name === gb.vessel)?.bridge) bridgesFlagged++;
  }
  const notes: string[] = [];
  for (const v of tree.vessels) {
    if (v.name.includes("twig") || v.kind === "collateral") continue;
    if (NAMES.includes(v.name)) {
      const L = lengthOf(v);
      if (!lens.has(v.name)) lens.set(v.name, []);
      lens.get(v.name)!.push(L);
      if (v.name === "PDA") {
        pdaTrees++;
        pdaEnd.push(v.samples[v.samples.length - 1].ell);
        if (L < 32) pdaShort++;
        notes.push(`PDA ${L.toFixed(0)} mm to ell ${v.samples[v.samples.length - 1].ell.toFixed(2)}`);
      }
    }
    if (deepExempt(v.name)) continue;
    let d1 = 0,
      d3 = 0,
      mn = Infinity;
    v.samples.forEach((s, i) => {
      if (s.w < 1 || s.ell <= -0.85) return;
      if (v.bridge && i >= v.bridge.i0 - 4 && i <= v.bridge.i1 + 4) return;
      if (s.h < -1) d1++;
      if (s.h < -3) d3++;
      mn = Math.min(mn, s.h);
    });
    if (v.name === "LAD") {
      ladDeep1.push(d1);
      ladDeep3.push(d3);
      ladMin.push(mn);
      notes.push(`LAD min h ${mn.toFixed(1)} mm, ${d1} samples < -1`);
    } else {
      otherDeep1 += d1;
      otherDeep3 += d3;
      if (mn < otherMin) {
        otherMin = mn;
        otherWorst = `${c.id}:${v.name}`;
      }
    }
  }
  if (perTree) console.log(`${c.id}: ${tree.vessels.length} vessels; ${notes.join("; ")}; cut: ${cuts.map((x) => `${x.name} ${x.keptMm.toFixed(0)}/${x.fullMm.toFixed(0)} by ${x.blocker}[${x.blockerSample}] at ${x.at} (origin ${x.hostIndex})`).join(", ") || "none"}`);
}
const f = (a: number[], d = 0) => (a.length ? `p10 ${q(a, 0.1).toFixed(d)} p50 ${q(a, 0.5).toFixed(d)} p90 ${q(a, 0.9).toFixed(d)} min ${Math.min(...a).toFixed(d)} (n ${a.length})` : "none");
console.log(`trees: ${cases.length} (${n} genomes + ${CASE_LIBRARY.length} library cases); vessels per tree ${f(vesselCount)}`);
console.log(`LAD: trees with samples h < -1 mm: ${ladDeep1.filter((x) => x > 0).length}/${ladDeep1.length}; samples h < -1: total ${ladDeep1.reduce((a, b) => a + b, 0)}, h < -3: total ${ladDeep3.reduce((a, b) => a + b, 0)}; min h ${f(ladMin, 1)}`);
console.log(`other epicardial named vessels: samples h < -1 ${otherDeep1}, h < -3 ${otherDeep3}; deepest ${otherMin.toFixed(1)} mm (${otherWorst})`);
console.log(`myocardial bridges in the genomes: ${bridges}, flagged on the grown vessel: ${bridgesFlagged}`);
console.log(`PDA: cut to < 32 mm in ${pdaShort}/${pdaTrees} trees; end ell ${f(pdaEnd, 2)}`);
for (const k of NAMES) if (lens.has(k)) console.log(`${k.padEnd(4)} length mm ${f(lens.get(k)!)}`);
console.log(`named vessels cut short (by class): ${[...cutCount].map(([k, v]) => `${k} ${v}`).join(", ") || "none"}`);
console.log(`cut by (vessel<-blocker class): ${[...blockers].sort((a, b) => b[1] - a[1]).slice(0, 16).map(([k, v]) => `${k} ${v}`).join(", ") || "none"}`);
