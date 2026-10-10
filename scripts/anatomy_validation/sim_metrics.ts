// CLI: simulator anatomy and motion metrics over many genomes, against reference.json.
// usage: npx vite-node scripts/anatomy_validation/sim_metrics.ts [nGenomes=12] [section,...]
//   sections: extent, length, tortuosity, motion, xtrack, calibre, bif, transect, proximal, timing
import { buildAnatomy } from "../../src/simulation/anatomy";
import type { AnatomyCase, CArm, Dominance } from "../../src/types";
import { buildCoronaryTree, samplePos, type CoronaryTree } from "../../src/render/xray/coronaryTree";
import { clearTopologyCache } from "../../src/render/xray/coronaryGrowth";
import { tangentBandRms } from "../../src/render/xray/tortuosity";
import { extent, chainBands, projectedChain, polylineLength, landmarkMotion, rasterMetrics, scanlineMotion, xtrackSpec, quantile as q } from "./metrics";
import ref from "./reference.json";
import { chainSamples } from "./metrics";
/** cut a projected chain at the apex (the wrap-around part is not traced on library cines) */
function toApex(tree: CoronaryTree, pts: [number, number][], chain: string[]): [number, number][] {
  const cs = chainSamples(tree, chain);
  let best = 0;
  cs.forEach(({ v, i }, k) => { if (v.samples[i].ell > cs[best].v.samples[cs[best].i].ell) best = k; });
  return pts.slice(0, best + 1);
}

const n = +(process.argv[2] ?? 12);
const sections = new Set((process.argv[3] ?? "extent,length,tortuosity,motion,xtrack,calibre,bif,transect,proximal,timing").split(","));
const mk = (id: string, dominance: Dominance = "right"): AnatomyCase =>
  ({ id, name: id, difficulty: 1, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance, variants: [], pathology: "none", lesions: [], recommendedCatheters: [], acceptableCatheters: [], requiredViews: [], traps: [], objectives: [], teachingSummary: "" }) as AnatomyCase;
const cases = Array.from({ length: n }, (_, i) => mk(`genome-${i}`, i % 10 === 9 ? "left" : i % 10 === 8 ? "codominant" : "right"));
const trees: { c: AnatomyCase; model: ReturnType<typeof buildAnatomy>; tree: CoronaryTree; ms: number }[] = [];
clearTopologyCache();
for (const c of cases) {
  const model = buildAnatomy(c);
  const t0 = performance.now();
  const tree = buildCoronaryTree(model, c);
  trees.push({ c, model, tree, ms: performance.now() - t0 });
}
const fmt = (a: number[]) => `p10 ${q(a, 0.1).toFixed(1)} p50 ${q(a, 0.5).toFixed(1)} p90 ${q(a, 0.9).toFixed(1)}`;
const V = (lr: number, cc: number): CArm => ({ laoRao: lr, cranialCaudal: cc });

if (sections.has("timing")) {
  console.log("grow ms", fmt(trees.map((t) => t.ms)), "samples", fmt(trees.map((t) => t.tree.stats!.samples)), "twigs", fmt(trees.map((t) => t.tree.stats!.twigs)));
}
if (sections.has("extent")) {
  for (const view of ["LCA_RAOcau", "LCA_RAOcra", "LCA_APcra", "LCA_LAOcra"] as const) {
    const r = (ref.extents as any)[view];
    const e = trees.map(({ model, tree }) => extent(tree, model, "left", V(r.angle.laoRao, r.angle.cranialCaudal)));
    console.log(view.padEnd(11), "sim w", fmt(e.map((x) => x.w)), "| real", r.widthMm.p25, r.widthMm.median, r.widthMm.p75, "|| sim h", fmt(e.map((x) => x.h)), "| real", r.heightMm.p25, r.heightMm.median, r.heightMm.p75);
  }
}
if (sections.has("length")) {
  const L = trees.map(({ model, tree }) => polylineLength(toApex(tree, projectedChain(tree, model, ["LM", "LAD"], V(-29, 25)), ["LM", "LAD"])));
  console.log("LM+LAD RAOcra projected", fmt(L), "| real", JSON.stringify(ref.lmLadLengthRAOcraMm));
  console.log("LAD 3D", fmt(trees.map(({ tree }) => { const v = tree.vessels.find((x) => x.name === "LAD")!; return v.pathMm[v.pathMm.length - 1] - v.pathMm[0]; })), "LCx 3D", fmt(trees.map(({ tree }) => { const v = tree.vessels.find((x) => x.name === "LCx")!; return v.pathMm[v.pathMm.length - 1] - v.pathMm[0]; })), "RCA 3D", fmt(trees.map(({ tree }) => { const v = tree.vessels.find((x) => x.name === "RCA")!; return v.pathMm[v.pathMm.length - 1] - v.pathMm[0]; })));
}
if (sections.has("tortuosity")) {
  const lad = trees.map(({ model, tree }) => tangentBandRms(toApex(tree, projectedChain(tree, model, ["LM", "LAD"], V(-29, 25)), ["LM", "LAD"])));
  // the RCA traced to the crux (PDA origin), as on the library cines
  const rca = trees.map(({ model, tree }) => { const pda = tree.vessels.find((v) => v.name === "PDA" && v.parent?.name === "RCA"); const p = projectedChain(tree, model, ["RCA"], V(27, -2)); return tangentBandRms(pda ? p.slice(0, pda.parent!.index + 1) : p); });
  for (const b of ["b3_8", "b8_20", "b20_60"] as const) {
    console.log("LAD RAOcra", b, fmt(lad.map((x) => x[b] ?? NaN)), "| real", JSON.stringify((ref.tortuosity.LAD_RAOcra as any)[b].median), " RCA LAO", fmt(rca.map((x) => x[b] ?? NaN)), "| real", (ref.tortuosity.RCA_LAO as any)[b].median);
  }
}
if (sections.has("motion")) {
  for (const hr of [60, 65, 90]) {
    const r = trees.filter((t) => t.c.dominance === "right").slice(0, Math.min(12, n)).map(({ model, tree }) => landmarkMotion(tree, model, ["RCA"], V(27, -2), hr));
    const l = trees.filter((t) => t.c.dominance === "right").slice(0, Math.min(12, n)).map(({ model, tree }) => landmarkMotion(tree, model, ["LM", "LAD"], V(-29, 25), hr));
    const flat = (a: number[][]) => a.flat();
    console.log(`HR ${hr} RCA LAO p1090 mm`, fmt(flat(r.map((x) => x.p1090))), "step med px", fmt(flat(r.map((x) => x.stepMedianPx))), "p90", fmt(flat(r.map((x) => x.stepP90Px))), "max", fmt(flat(r.map((x) => x.stepMaxPx))), "cross range px", fmt(flat(r.map((x) => x.crossRangePx))), "cross step med", fmt(flat(r.map((x) => x.crossStepMedianPx))), "cross step p90", fmt(flat(r.map((x) => x.crossStepP90Px))), "speed", fmt(flat(r.map((x) => x.speedMedian))));
    console.log(`HR ${hr} LAD RAOcra p1090 mm`, fmt(flat(l.map((x) => x.p1090))), "step med px", fmt(flat(l.map((x) => x.stepMedianPx))), "p90", fmt(flat(l.map((x) => x.stepP90Px))), "max", fmt(flat(l.map((x) => x.stepMaxPx))), "cross range px", fmt(flat(l.map((x) => x.crossRangePx))), "cross step med", fmt(flat(l.map((x) => x.crossStepMedianPx))), "cross step p90", fmt(flat(l.map((x) => x.crossStepP90Px))), "speed", fmt(flat(l.map((x) => x.speedMedian))));
    console.log(`   ratio RCA/LAD median p1090`, (q(flat(r.map((x) => x.p1090)), 0.5) / q(flat(l.map((x) => x.p1090)), 0.5)).toFixed(2), "| real", JSON.stringify(ref.motionP1090Mm));
  }
}
if (sections.has("calibre")) {
  const D = (tree: CoronaryTree, name: string, f: number) => {
    const v = tree.vessels.find((x) => x.name === name);
    if (!v) return NaN;
    const i = v.param.findIndex((t) => t >= f);
    return 2 * (v.refRadii ?? v.radii)[Math.max(0, i)];
  };
  const by = (dom: Dominance) => trees.filter((t) => t.c.dominance === dom);
  const R = by("right");
  console.log("LM", fmt(trees.map((t) => D(t.tree, "LM", 0.5))), "| Dodge 4.5±0.5");
  console.log("LAD prox (0.1)", fmt(trees.map((t) => D(t.tree, "LAD", 0.1))), "| Dodge 3.7±0.4; LAD distal (0.7)", fmt(trees.map((t) => D(t.tree, "LAD", 0.7))), "| Dodge 1.9±0.4");
  console.log("RCA prox right-dom", fmt(R.map((t) => D(t.tree, "RCA", 0.1))), "| Dodge 3.9±0.6; left-dom", fmt(by("left").map((t) => D(t.tree, "RCA", 0.1))), "| Dodge 2.8±0.5");
  console.log("LCx prox right-dom", fmt(R.map((t) => D(t.tree, "LCx", 0.1))), "| Dodge 3.4±0.5; left-dom", fmt(by("left").map((t) => D(t.tree, "LCx", 0.1))), "| Dodge 4.2±0.6");
  for (const [v, f] of [["LAD", 0.38], ["RCA", 0.45], ["LCx", 0.42], ["RCA", 0.35]] as const) console.log(` PCI target ${v}@${f}`, fmt(R.map((t) => D(t.tree, v, f))));
}
if (sections.has("bif")) {
  const finet: number[] = [],
    murray: number[] = [],
    hk: number[] = [];
  for (const { tree } of trees) {
    for (const v of tree.vessels) {
      if (!v.parent || v.kind === "twig" || v.name.startsWith("collateral")) continue;
      const p = tree.vessels.find((x) => x.name === v.parent!.name)!;
      const i = v.parent.index;
      if (i < 3 || i > p.samples.length - 4) continue;
      const rr = p.refRadii ?? p.radii;
      const Dp = 2 * rr[i - 2],
        Dm = 2 * rr[i + 2],
        Ds = 2 * (v.refRadii ?? v.radii)[Math.min(2, v.samples.length - 1)];
      finet.push(Dp / (Dm + Ds));
      murray.push((Dm ** 3 + Ds ** 3) / Dp ** 3);
      hk.push((Dm ** (7 / 3) + Ds ** (7 / 3)) / Dp ** (7 / 3));
    }
  }
  const major: number[] = [];
  for (const { tree } of trees) {
    for (const [par, child] of [["LAD", "D1"], ["LCx", "OM1"], ["LM", "LCx"]] as const) {
      const p = tree.vessels.find((x) => x.name === par), v = tree.vessels.find((x) => x.name === child);
      if (!p || !v || !v.parent) continue;
      const rr = p.refRadii ?? p.radii, i = v.parent.index;
      const Dp = 2 * rr[Math.max(0, i - 2)], Ds = 2 * (v.refRadii ?? v.radii)[Math.min(2, v.samples.length - 1)];
      const other = par === "LM" ? tree.vessels.find((x) => x.name === "LAD")! : p;
      const Dm = 2 * (other.refRadii ?? other.radii)[par === "LM" ? Math.min(2, other.samples.length - 1) : Math.min(rr.length - 1, i + 2)];
      major.push(Dp / (Dm + Ds));
    }
  }
  console.log("major bifurcations (LM, LAD/D1, LCx/OM1) Finet", fmt(major), "frac<0.678", (major.filter((x) => x < 0.678).length / major.length).toFixed(2));
  console.log("Finet ratio", fmt(finet), "frac<0.678", (finet.filter((x) => x < 0.678).length / finet.length).toFixed(2), "| Murray cube", fmt(murray), "max", Math.max(...murray).toFixed(2), "| HK", fmt(hk));
}
if (sections.has("proximal")) {
  const ex: number[] = [];
  for (const { tree } of trees) {
    const lm = tree.vessels.find((v) => v.name === "LM");
    if (!lm) continue;
    const by = samplePos(tree.heart, lm.samples[lm.samples.length - 1]).y;
    for (const name of ["LAD", "LCx"]) {
      const v = tree.vessels.find((x) => x.name === name)!;
      let m = -Infinity;
      for (let i = 0; i < v.samples.length && v.pathMm[i] - v.pathMm[0] <= 20; i++) m = Math.max(m, samplePos(tree.heart, v.samples[i]).y);
      ex.push(m - by);
    }
  }
  console.log("max height over first 20 mm of LAD/LCx minus bifurcation", fmt(ex), "max", Math.max(...ex).toFixed(1));
}
if (sections.has("transect")) {
  for (const [view, lr, cc, real] of [["LCA_RAOcra", -29, 25, 8], ["LCA_APcra", 0, 32, 7], ["LCA_LAOcra", 30.5, 27, 4]] as const) {
    const r = trees.slice(0, Math.min(16, n)).map(({ model, tree }, k) => rasterMetrics(tree, model, "left", V(lr, cc), k));
    console.log(view, "crossings median", fmt(r.map((x) => x.median)), "| real", real, " area>10", fmt(r.map((x) => x.area10 * 100)), "%");
  }
}
if (sections.has("xtrack")) {
  const R = trees.filter((t) => t.c.dominance === "right");
  const agg: Record<string, { sim: number[][]; real: number[][] }> = { LAD: { sim: [[], [], []], real: [[], [], []] }, RCA: { sim: [[], [], []], real: [[], [], []] } };
  for (const line of (ref as any).xtrackLines) {
    const sp = xtrackSpec(line);
    if (!sp) continue;
    const r = R.map(({ model, tree }) => scanlineMotion(tree, model, sp.chain, line.angle, sp.frac, line.orient)).filter((x): x is NonNullable<typeof x> => !!x);
    const a = agg[sp.vessel];
    a.sim[0].push(q(r.map((x) => x.range), 0.5)); a.sim[1].push(q(r.map((x) => x.stepMedian), 0.5)); a.sim[2].push(q(r.map((x) => x.stepP90), 0.5));
    a.real[0].push(line.rangePx); a.real[1].push(line.stepMedianPx); a.real[2].push(line.stepP90Px);
    console.log(`xtrack ${line.run} ${line.line} (${sp.chain.join("+")} at ${sp.frac}, ${line.orient}) sim range ${fmt(r.map((x) => x.range))} step med ${q(r.map((x) => x.stepMedian), 0.5).toFixed(1)} p90 ${q(r.map((x) => x.stepP90), 0.5).toFixed(1)} | real ${line.rangePx} / ${line.stepMedianPx} / ${line.stepP90Px}`);
  }
  for (const [v, a] of Object.entries(agg)) console.log(`xtrack ${v} medians over lines: sim range ${q(a.sim[0], 0.5).toFixed(1)} step ${q(a.sim[1], 0.5).toFixed(1)} p90 ${q(a.sim[2], 0.5).toFixed(1)} | real ${q(a.real[0], 0.5).toFixed(1)} / ${q(a.real[1], 0.5).toFixed(1)} / ${q(a.real[2], 0.5).toFixed(1)}`);
}
