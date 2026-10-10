// Fit of the mean heart axis and size (model parameters in coronaryAtlas.ts PRIORS.axisMeanDeg and
// PRIORS.heartScaleMean) to the library's vessel-only LCA extents (reference.json extentsVesselOnly: the
// catheter removed; the target per view is the geometric mean of the peak-frame median, a lower bound, and
// the filling-phase median, an upper bound). Objective: per view and dimension, log-ratio² outside the band
// [0.83 x lower median (5 F catheter scale), upper median]; plus the RAO cranial LM+LAD projected length (to the apex) against the
// library median with weight 2; plus a weak pull towards the previous mean axis; plus a penalty when the LAD or
// circumflex climbs more than 2 mm above the LM bifurcation in its first 25 mm (anatomical constraint, 0.5 per mm). Parameters are kept in anatomically plausible ranges
// (azimuth 30-65°, elevation 25-55°, roll -30-15°, overall scale 0.85-1.12, base-apex length factor 0.9-1.35).
// usage: npx vite-node scripts/anatomy_validation/fit_axis.ts [nGenomes=8] [startScale=1] [maxAzimuthDeg=65]
// The scale is relative to the current genome scale (PRIORS.heartScaleMean included).
import { buildAnatomy } from "../../src/simulation/anatomy";
import type { AnatomyCase } from "../../src/types";
import { buildCoronaryTree, samplePos, type CoronaryTree } from "../../src/render/xray/coronaryTree";
import { clearTopologyCache } from "../../src/render/xray/coronaryGrowth";
import { genomeForCase, PRIORS, type AnatomyGenome } from "../../src/render/xray/coronaryAtlas";
import { extent, projectedChain, polylineLength, chainSamples, quantile as q } from "./metrics";
import ref from "./reference.json";

const n = +(process.argv[2] ?? 8);
const mk = (id: string, dominance: "right" | "left" | "codominant" = "right"): AnatomyCase =>
  ({ id, name: id, difficulty: 1, accessRoute: "femoral", rootSize: "normal", rootRotationDeg: 0, aortaTiltDeg: 0, dominance, variants: [], pathology: "none", lesions: [], recommendedCatheters: [], acceptableCatheters: [], requiredViews: [], traps: [], objectives: [], teachingSummary: "" }) as AnatomyCase;
// the dominance mix of the population priors (about 1 in 12 left and 1 in 12 codominant)
const base = Array.from({ length: n }, (_, i) => { const c = mk(`fit-${i}`, i % 12 === 11 ? "left" : i % 12 === 10 ? "codominant" : "right"); return { c, model: buildAnatomy(c), g: genomeForCase(c) }; });
type P = { az: number; el: number; roll: number; scale: number; len: number };
const m0 = PRIORS.axisMeanDeg;
const views = ["LCA_RAOcau", "LCA_RAOcra", "LCA_APcra", "LCA_LAOcra"] as const;
function toApexLen(tree: CoronaryTree, model: (typeof base)[number]["model"]): number {
  const pts = projectedChain(tree, model, ["LM", "LAD"], { laoRao: -29, cranialCaudal: 25 });
  const cs = chainSamples(tree, ["LM", "LAD"]);
  let apex = 0;
  cs.forEach(({ v, i }, k) => { if (v.samples[i].ell > cs[apex].v.samples[cs[apex].i].ell) apex = k; });
  return polylineLength(pts.slice(0, apex + 1));
}
function evaluate(p: P, verbose = false): number {
  clearTopologyCache();
  const trees = base.map(({ c, model, g }) => {
    const h = g.heart;
    const gg: AnatomyGenome = { ...g, heart: { ...h, azimuthDeg: h.azimuthDeg + p.az - m0.azimuth, elevationDeg: h.elevationDeg + p.el - m0.elevation, rollDeg: h.rollDeg + p.roll - m0.roll, scale: h.scale * p.scale, length: h.length * p.len }, key: g.key + JSON.stringify(p) };
    return { model, tree: buildCoronaryTree(model, c, [], { genome: gg }) };
  });
  let err = 0;
  const parts: string[] = [];
  for (const view of views) {
    const r = (ref as any).extentsVesselOnly[view];
    const V = { laoRao: r.angle.laoRao, cranialCaudal: r.angle.cranialCaudal };
    const e = trees.map(({ model, tree }) => extent(tree, model, "left", V));
    const w = q(e.map((x) => x.w), 0.5), hh = q(e.map((x) => x.h), 0.5);
    // band: no cost between 0.83 x the lower median (5 F scale) and the upper median (both catheter-removed;
    // the peak masks miss faint distal vessels, the filling masks are widened by motion and keep catheter remnants)
    const band = (x: number, lo: number, hi: number) => Math.log(Math.max(1, lo / x, x / hi)) ** 2;
    const [wl, wh] = [0.83 * Math.min(r.peak.widthMm.median, r.fill.widthMm.median), Math.max(r.peak.widthMm.median, r.fill.widthMm.median)];
    const [hl, hh2] = [0.83 * Math.min(r.peak.heightMm.median, r.fill.heightMm.median), Math.max(r.peak.heightMm.median, r.fill.heightMm.median)];
    err += band(w, wl, wh) + band(hh, hl, hh2);
    parts.push(`${view} ${w.toFixed(0)}x${hh.toFixed(0)} (band ${wl.toFixed(0)}-${wh.toFixed(0)} x ${hl.toFixed(0)}-${hh2.toFixed(0)})`);
  }
  const L = q(trees.map(({ model, tree }) => toApexLen(tree, model)), 0.5);
  // the traced LM+LAD length is catheter-free and the most reliable library measurement: weight 2
  err += 2 * Math.log(L / ref.lmLadLengthRAOcraMm.median) ** 2;
  // weak pull towards the previous mean axis (keeps the fit away from implausible orientations it cannot resolve)
  err += 0.004 * (((p.az - m0.azimuth) / 10) ** 2 + ((p.el - m0.elevation) / 10) ** 2 + ((p.roll - m0.roll) / 10) ** 2);
  const lad3d = Math.max(...trees.map(({ tree }) => { const v = tree.vessels.find((x) => x.name === "LAD")!; return v.pathMm[v.pathMm.length - 1] - v.pathMm[0]; }));
  // anatomical constraint: neither the LAD nor the circumflex climbs above the LM bifurcation in its first 25 mm
  let climb = 0;
  for (const { tree } of trees) {
    const lm = tree.vessels.find((v) => v.name === "LM");
    if (!lm) continue;
    const by = samplePos(tree.heart, lm.samples[lm.samples.length - 1]).y;
    for (const name of ["LAD", "LCx"]) {
      const v = tree.vessels.find((x) => x.name === name)!;
      for (let i = 0; i < v.samples.length && v.pathMm[i] - v.pathMm[0] <= 25; i++) climb = Math.max(climb, samplePos(tree.heart, v.samples[i]).y - by);
    }
  }
  err += 0.5 * Math.max(0, climb - 2);
  if (verbose) console.log(JSON.stringify(p), "err", err.toFixed(4), parts.join(" | "), `LM+LAD ${L.toFixed(0)} (real ${ref.lmLadLengthRAOcraMm.median})`, `max LAD 3D ${lad3d.toFixed(0)}`, `max climb ${climb.toFixed(1)}`);
  return err;
}
const lim: Record<keyof P, [number, number]> = { az: [30, +(process.argv[4] ?? 65)], el: [25, 55], roll: [-30, 15], scale: [0.85, 1.12], len: [0.9, 1.35] };
const s0 = +(process.argv[3] ?? 1);
let best: P = { az: m0.azimuth, el: m0.elevation, roll: m0.roll, scale: s0, len: 1 };
let bestE = evaluate(best, true);
const steps: Record<keyof P, number> = { az: 8, el: 8, roll: 8, scale: 0.06, len: 0.08 };
for (let round = 0; round < 4; round++) {
  for (const k of ["el", "az", "len", "scale", "roll"] as (keyof P)[]) {
    for (const s of [-1, 1]) {
      for (let tries = 0; tries < 4; tries++) {
        const cand = { ...best, [k]: Math.min(lim[k][1], Math.max(lim[k][0], best[k] + s * steps[k])) };
        if (cand[k] === best[k]) break;
        const e = evaluate(cand);
        if (e < bestE) { best = cand; bestE = e; } else break;
      }
    }
  }
  console.log("round", round);
  evaluate(best, true);
  for (const k of Object.keys(steps) as (keyof P)[]) steps[k] /= 2;
}
console.log("best", JSON.stringify(best), bestE.toFixed(4));
