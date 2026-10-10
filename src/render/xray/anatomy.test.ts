// Anatomy and motion realism tests (stream S3). Targets come from cited literature (see
// docs/realism/facts/S3.md) or from the real-library measurements in
// scripts/anatomy_validation/reference.json (built by build_reference.mjs from the audit's
// library tool outputs). Metric definitions match the library tools (scripts/anatomy_validation/metrics.ts).
import { describe, it, expect } from "vitest";
import type { AnatomyCase, Dominance, Lesion, Vec3 } from "../../types";
import { buildAnatomy, engagementTargets, LM_OSTIUM_HEIGHT, RCA_OSTIUM_HEIGHT } from "../../simulation/anatomy";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import { buildCoronaryTree, renderPath, samplePos, segmentAt, segmentSpans, vesselLength, vesselRadiiAt, type CoronaryTree } from "./coronaryTree";
import { sampleGenome, PRIORS, describeGenome } from "./coronaryAtlas";
import { growTopology, HK_EXPONENT } from "./coronaryGrowth";
import { makeHeart, surfacePoint, restPoint, V3, type Motion } from "./heart";
import { motionAt, clockStateAt, rootDisplacement, bridgeCompression, catheterTether, longEnvelope, envelopesAt, stillFraction, DEFAULT_AMPLITUDES } from "./heartMotion";
import { heartShapes, fitVentricles, insideSilhouette, HEART_SHAPE_NAMES } from "./heartShape";
import { tortuosityOffsets, tangentBandRms } from "./tortuosity";
// the validation metrics live with the library tools (outside src): the import is checked by vitest, not tsc
// @ts-ignore TS6307 (file outside the app project)
import { extent, landmarkMotion, polylineLength, projectedChain, chainSamples, quantile, scanlineMotion, xtrackSpec, rasterMetrics, treeArtefacts } from "../../../scripts/anatomy_validation/metrics";
// @ts-ignore TS6307 (file outside the app project)
import ref from "../../../scripts/anatomy_validation/reference.json";

const mk = (id: string, dominance: Dominance = "right", variants: string[] = [], lesions: Lesion[] = []): AnatomyCase =>
  ({
    id,
    name: id,
    difficulty: 1,
    accessRoute: "femoral",
    rootSize: "normal",
    rootRotationDeg: 0,
    aortaTiltDeg: 0,
    dominance,
    variants,
    pathology: "none",
    lesions,
    recommendedCatheters: [],
    acceptableCatheters: [],
    requiredViews: [],
    traps: [],
    objectives: [],
    teachingSummary: "",
  }) as unknown as AnatomyCase;

const build = (c: AnatomyCase) => {
  const model = buildAnatomy(c);
  return { model, tree: buildCoronaryTree(model, c) };
};
const N_GEN = 24;
const genomes = Array.from({ length: N_GEN }, (_, i) => build(mk(`anat-${i}`, i % 12 === 11 ? "left" : i % 12 === 10 ? "codominant" : "right")));
const rightDom = genomes.filter((g) => g.tree.genome!.dominance === "right");
const med = (a: number[]) => quantile(a, 0.5);
const V = (laoRao: number, cranialCaudal: number) => ({ laoRao, cranialCaudal });
const vessel = (t: CoronaryTree, n: string) => t.vessels.find((v) => v.name === n);
const D = (t: CoronaryTree, n: string, f: number) => {
  const v = vessel(t, n)!;
  const i = Math.max(0, v.param.findIndex((x) => x >= f));
  return 2 * (v.refRadii ?? v.radii)[i];
};

// ---------------------------------------------------------------------------
describe("heart motion: sign, amplitude, timing", () => {
  const H = makeHeart(1);
  const es: Motion = { contraction: 1, env: { long: 1, longRv: 1, twist: 1, radial: 1, trans: 1 }, rootMoves: true };
  /** rotation (deg) about +L of a material point between rest and end-systole */
  const rotation = (ell: number, phi: number) => {
    const p0 = restPoint(H, ell, phi, 0);
    const p1 = surfacePoint(H, ell, phi, 0, { ...es, amp: { ...DEFAULT_AMPLITUDES, radial: 0, trans: { x: 0, y: 0, z: 0 }, wholeRot: { x: 0, y: 0, z: 0 }, rvSwing: 0, mapseLateral: 0, mapseSeptal: 0, tapse: 0, aapse: 0 } });
    const axis = (p: Vec3) => {
      const r = V3.sub(p, H.base);
      return V3.sub(r, V3.sc(H.L, V3.dot(r, H.L)));
    };
    const r0 = axis(p0),
      r1 = axis(p1);
    return (Math.atan2(V3.dot(H.L, V3.cross(r0, r1)), V3.dot(r0, r1)) * 180) / Math.PI;
  };

  it("twists the right way: apex anticlockwise, base clockwise, seen from the apex (Cheng 2017, Halcsik 2026)", () => {
    for (const phi of [0, 90, 180, -90]) {
      expect(rotation(0.9, phi)).toBeGreaterThan(0);
      expect(rotation(-0.95, phi)).toBeLessThan(0);
    }
    // amplitudes at end-systole: apex ≈ +9.7°, base ≈ -5.4° (means of the two sources; interpolated along the axis)
    expect(rotation(0.999, 45)).toBeGreaterThan(8.5);
    expect(rotation(0.999, 45)).toBeLessThan(11);
    expect(rotation(-1, 45)).toBeLessThan(-4.5);
    expect(rotation(-1, 45)).toBeGreaterThan(-6.5);
  });

  it("the base descends towards a nearly fixed apex by annular-excursion amounts (Ochs 2017)", () => {
    const along = (ell: number, phi: number) => V3.dot(V3.sub(surfacePoint(H, ell, phi, 0, es), restPoint(H, ell, phi, 0)), H.L);
    const lateral = along(-1, 100);
    expect(lateral).toBeGreaterThan(12);
    expect(lateral).toBeLessThan(22);
    // lateral tricuspid annulus (acute margin) moves most
    expect(along(-1, -95)).toBeGreaterThan(lateral);
    // the apex itself hardly moves along the axis (whole-heart translation excluded)
    const noTrans: Motion = { ...es, amp: { ...DEFAULT_AMPLITUDES, trans: { x: 0, y: 0, z: 0 } } };
    expect(Math.abs(V3.dot(V3.sub(surfacePoint(H, 0.999, 30, 0, noTrans), restPoint(H, 0.999, 30, 0)), H.L))).toBeLessThan(2);
  });

  it("rotates the whole heart rigidly about the base centre: the apex thrusts forwards in systole", () => {
    const only: Motion = {
      ...es,
      amp: { ...DEFAULT_AMPLITUDES, apexRotDeg: 0, baseRotDeg: 0, radial: 0, trans: { x: 0, y: 0, z: 0 }, rvSwing: 0, mapseLateral: 0, mapseSeptal: 0, tapse: 0, aapse: 0 },
    };
    const move = (ell: number, phi: number) => V3.sub(surfacePoint(H, ell, phi, 0, only), restPoint(H, ell, phi, 0));
    const apex = move(0.999, 0);
    expect(apex.z).toBeGreaterThan(3);
    expect(Math.hypot(apex.x, apex.y, apex.z)).toBeLessThan(15);
    // rigid: distances between material points are kept
    const a0 = restPoint(H, 0.3, 40, 0),
      b0 = restPoint(H, 0.8, -60, 0);
    const a1 = V3.add(a0, move(0.3, 40)),
      b1 = V3.add(b0, move(0.8, -60));
    expect(Math.abs(Math.hypot(a1.x - b1.x, a1.y - b1.y, a1.z - b1.z) - Math.hypot(a0.x - b0.x, a0.y - b0.y, a0.z - b0.z))).toBeLessThan(0.01);
  });

  it("follows the cardiac cycle in seconds: systolic rise, rapid return, diastasis, atrial kick", () => {
    const s = clockStateAt(0, 60);
    const rr = s.rr,
      esT = s.endSystole;
    expect(longEnvelope(0.01, rr, esT)).toBe(0);
    expect(longEnvelope(esT - 0.001, rr, esT)).toBeGreaterThan(0.98);
    // after rapid filling most of the excursion is gone, but not all (atrial kick to come)
    const mid = longEnvelope(esT + 0.3, rr, esT);
    expect(mid).toBeGreaterThan(0.15);
    expect(mid).toBeLessThan(0.35);
    expect(longEnvelope(rr - 0.012, rr, esT)).toBeLessThan(0.05);
    // twist unwinds before the annulus has returned
    const e = envelopesAt({ tInBeat: esT + 0.12, rr, endSystole: esT });
    expect(e.twist).toBeLessThan(e.long);
    // the RV leads
    const early = envelopesAt({ tInBeat: 0.1, rr, endSystole: esT });
    expect(early.longRv).toBeGreaterThan(early.long);
  });

  it("the still fraction of the beat keeps falling as the heart rate rises (Husmann 2007; end-systolic and end-diastolic rest windows ∝ RR^1.8)", () => {
    const { tree } = genomes[0];
    for (const name of ["RCA", "LAD"]) {
      const v = vessel(tree, name)!;
      const idx = [0.2, 0.5, 0.8].map((f) => Math.round(f * (v.samples.length - 1)));
      const still = (hr: number) => {
        const series: Vec3[][] = [];
        for (let k = 0; k < 400; k++) {
          const m = motionAt(clockStateAt(k / 100, hr));
          series.push(idx.map((i) => samplePos(tree.heart, v.samples[i], m)));
        }
        // absolute threshold (10 mm/s, about twice the library's static-landmark noise floor of 4.6 mm/s)
        return stillFraction(series, 100, 0.25, 10);
      };
      const s60 = still(60),
        s80 = still(80),
        s110 = still(110);
      // diastasis shrinks: a clear fall from 60 to 80 bpm
      expect(s60).toBeGreaterThan(s80 + 0.1);
      // above 80 bpm the remaining rest windows (end-systolic hold, end-diastolic pause) shorten faster than the cycle;
      // the onset delay shortens only weakly (ONSET_EXP)
      expect(s110).toBeLessThan(s80 - 0.01);
    }
    // the R-to-onset delay stays physiological at 130 beats/min (at least 25 ms of the 45 ms at 60)
    const fast = clockStateAt(0, 130);
    expect(longEnvelope(0.025, fast.rr, fast.endSystole)).toBe(0);
  });

  it("matches the library's projected motion: LAD RAO cranial, RCA LAO, and their ratio", () => {
    const rca: number[] = [],
      lad: number[] = [],
      ladStep: number[] = [],
      ladP90: number[] = [];
    for (const { model, tree } of rightDom.slice(0, 8)) {
      const r = landmarkMotion(tree, model, ["RCA"], V(27, -2), 65);
      const l = landmarkMotion(tree, model, ["LM", "LAD"], V(-29, 25), 65);
      rca.push(...r.p1090);
      lad.push(...l.p1090);
      ladStep.push(...l.stepMedianPx);
      ladP90.push(...l.stepP90Px);
    }
    const realR = ref.motionP1090Mm.RCA_LAO,
      realL = ref.motionP1090Mm.LAD_RAOcra;
    // medians inside the real inter-quartile ranges (NCC tracking, 6F scale)
    expect(med(lad)).toBeGreaterThan(realL.p25);
    expect(med(lad)).toBeLessThan(realL.p75);
    expect(med(rca)).toBeGreaterThan(realR.p25);
    expect(med(rca)).toBeLessThan(realR.p75);
    // plan acceptance 1.6-3 (library 2.18)
    const ratio = med(rca) / med(lad);
    expect(ratio).toBeGreaterThan(1.8);
    expect(ratio).toBeLessThan(2.8);
    // full in-plane frame-to-frame steps of the LAD at 15 frames/s, 512 px scale
    expect(med(ladStep)).toBeGreaterThan(1.5);
    expect(med(ladStep)).toBeLessThan(4.5);
    expect(med(ladP90)).toBeGreaterThan(4.3);
    expect(med(ladP90)).toBeLessThan(10);
  });

  it("reproduces the xtrack scan-line measurement: RCA within the real lines, LAD at least half of them", () => {
    // the same measurement as docs/realism/research/xtrack.py (vessel crossing of a fixed horizontal or vertical
    // scan line, 15 frames/s, 512 px), at the runs' own view angles (reference.json xtrackLines)
    const lines = (ref as any).xtrackLines.filter((l: any) => xtrackSpec(l));
    const sim: Record<string, { range: number[]; med: number[]; p90: number[] }> = { LAD: { range: [], med: [], p90: [] }, RCA: { range: [], med: [], p90: [] } };
    const real: Record<string, { range: number[]; med: number[]; p90: number[] }> = { LAD: { range: [], med: [], p90: [] }, RCA: { range: [], med: [], p90: [] } };
    for (const l of lines) {
      const sp = xtrackSpec(l)!;
      const r = rightDom.slice(0, 6).map(({ model, tree }) => scanlineMotion(tree, model, sp.chain, l.angle, sp.frac, l.orient)).filter((x): x is NonNullable<typeof x> => !!x);
      sim[sp.vessel].range.push(med(r.map((x) => x.range)));
      sim[sp.vessel].med.push(med(r.map((x) => x.stepMedian)));
      sim[sp.vessel].p90.push(med(r.map((x) => x.stepP90)));
      real[sp.vessel].range.push(l.rangePx);
      real[sp.vessel].med.push(l.stepMedianPx);
      real[sp.vessel].p90.push(l.stepP90Px);
    }
    const lo = (a: number[]) => Math.min(...a),
      hi = (a: number[]) => Math.max(...a);
    // RCA: step median and p90 inside the span of the real lines, range at least half the real median
    expect(med(sim.RCA.med)).toBeGreaterThanOrEqual(lo(real.RCA.med));
    expect(med(sim.RCA.med)).toBeLessThanOrEqual(hi(real.RCA.med));
    expect(med(sim.RCA.p90)).toBeGreaterThanOrEqual(lo(real.RCA.p90));
    expect(med(sim.RCA.p90)).toBeLessThanOrEqual(hi(real.RCA.p90));
    expect(med(sim.RCA.range)).toBeGreaterThan(0.5 * med(real.RCA.range));
    // LAD: with the whole-heart rotation the across-vessel motion is about 60-70% of the real lines (open gap,
    // docs/realism/wave2/I2.md); p90 inside the span
    expect(med(sim.LAD.p90)).toBeGreaterThanOrEqual(lo(real.LAD.p90));
    expect(med(sim.LAD.p90)).toBeLessThanOrEqual(hi(real.LAD.p90));
    expect(med(sim.LAD.range)).toBeGreaterThan(0.5 * med(real.LAD.range));
    expect(med(sim.LAD.med)).toBeGreaterThan(0.55 * med(real.LAD.med));
  });

  it("moves the aortic root and the ostia with the beat; the catheter tether decays along the shaft", () => {
    const H = genomes[0].tree.heart;
    const lm = genomes[0].model.lm.pos;
    let lo = Infinity,
      hi = -Infinity;
    const pts: Vec3[] = [];
    for (let k = 0; k < 60; k++) pts.push(rootDisplacement(clockStateAt(k / 60, 60), lm.y, H));
    // per-beat excursion of the left main ostium region: library cine about 8 mm (cdm-00931-LCA-1)
    for (const p of pts) {
      const s = V3.dot(p, H.L);
      lo = Math.min(lo, s);
      hi = Math.max(hi, s);
    }
    expect(hi - lo).toBeGreaterThan(5);
    expect(hi - lo).toBeLessThan(12);
    // the LM samples (fixed in the aortic frame) move with the root under motionAt
    const lmV = vessel(genomes[0].tree, "LM")!;
    const m = motionAt(clockStateAt(0.38, 60));
    const d = V3.sub(samplePos(H, lmV.samples[0], m), samplePos(H, lmV.samples[0]));
    expect(Math.hypot(d.x, d.y, d.z)).toBeGreaterThan(4);
    // legacy contraction-only motion keeps the ostia fixed (catheter not yet coupled)
    expect(samplePos(H, lmV.samples[0], { contraction: 1 })).toEqual(samplePos(H, lmV.samples[0]));
    expect(catheterTether(0)).toBe(1);
    expect(catheterTether(40)).toBeLessThan(0.5);
    expect(catheterTether(40)).toBeGreaterThan(catheterTether(80));
  });

  it("proximal RCA landmarks move 6-25 mm in LAO (library NCC tracks)", () => {
    const p: number[] = [];
    for (const { model, tree } of rightDom.slice(0, 6)) p.push(landmarkMotion(tree, model, ["RCA"], V(27, -2), 65, 15, 4, [0.1])[`p1090`][0]);
    expect(med(p)).toBeGreaterThan(6);
    expect(med(p)).toBeLessThan(25);
  });

  it("bridge compression is zero in diastole and maximal at end-systole", () => {
    const s = clockStateAt(0, 65);
    expect(bridgeCompression({ tInBeat: s.rr * 0.85, rr: s.rr, endSystole: s.endSystole })).toBe(0);
    expect(bridgeCompression({ tInBeat: s.endSystole, rr: s.rr, endSystole: s.endSystole })).toBeGreaterThan(0.95);
    expect(bridgeCompression({ tInBeat: 0.02, rr: s.rr, endSystole: s.endSystole })).toBe(0);
  });

  it("stays finite for every rhythm", () => {
    const { tree } = genomes[0];
    for (const rhythm of ["sinus", "af", "vf", "asystole"] as const) {
      const m = motionAt({ ...clockStateAt(0.3, 80), rhythm, endSystole: 0.3 });
      for (const v of tree.vessels.slice(0, 5)) for (const sm of v.samples) {
        const p = samplePos(tree.heart, sm, m);
        expect(Number.isFinite(p.x + p.y + p.z)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
describe("heart silhouette (heartShape)", () => {
  it("gives the renderer a fixed set of named primitives within the shader limits", () => {
    const { tree } = genomes[0];
    const shapes = heartShapes(tree.heart, motionAt(clockStateAt(0.3, 65)));
    expect(shapes.map((s) => s.name)).toEqual([...HEART_SHAPE_NAMES]);
    expect(shapes.filter((s) => s.carve).length).toBeLessThanOrEqual(8);
    for (const s of shapes) for (const h of s.half) expect(h).toBeGreaterThan(1);
  });

  it("marginal arteries run within about 3 mm of the heart-lung border at rest and in systole", () => {
    for (const { tree } of rightDom.slice(0, 6)) {
      for (const m of [undefined, motionAt(clockStateAt(0.36, 65))]) {
        const shapes = heartShapes(tree.heart, m);
        for (const name of ["OM1", "AM"]) {
          const v = vessel(tree, name);
          if (!v) continue;
          const d: number[] = [];
          for (let i = Math.floor(v.samples.length * 0.2); i < v.samples.length * 0.7; i++) d.push(insideSilhouette(tree.heart, shapes, samplePos(tree.heart, v.samples[i], m)));
          // median inside by at most 3 mm and not outside by more than 1 mm
          expect(med(d)).toBeGreaterThan(-1);
          expect(med(d)).toBeLessThan(3);
        }
      }
    }
  });

  it("the border beats: the fitted ventricles shrink and move in systole", () => {
    const H = genomes[0].tree.heart;
    const rest = fitVentricles(H);
    const sys = fitVentricles(H, motionAt(clockStateAt(0.37, 65)));
    expect(sys.lv.half[0]).toBeLessThan(rest.lv.half[0]);
    expect(Math.hypot(sys.lv.c.x - rest.lv.c.x, sys.lv.c.y - rest.lv.c.y, sys.lv.c.z - rest.lv.c.z)).toBeGreaterThan(1);
  });

  it("fits the silhouette in well under 0.5 ms per frame", () => {
    const H = genomes[1].tree.heart;
    heartShapes(H, motionAt(clockStateAt(0.2, 65)));
    const t0 = performance.now();
    for (let k = 0; k < 200; k++) heartShapes(H, motionAt(clockStateAt(k / 200, 65)));
    expect((performance.now() - t0) / 200).toBeLessThan(0.5);
  });
});

// ---------------------------------------------------------------------------
describe("anatomy genome (population priors)", () => {
  const n = 4000;
  const G = Array.from({ length: n }, (_, i) => sampleGenome(`freq-${i}`));
  const frac = (f: (g: (typeof G)[number]) => boolean) => G.filter(f).length / n;
  it("reproduces every categorical prior within 2 percentage points", () => {
    expect(Math.abs(frac((g) => g.dominance === "right") - PRIORS.dominance.right)).toBeLessThan(0.02);
    expect(Math.abs(frac((g) => g.dominance === "left") - PRIORS.dominance.left)).toBeLessThan(0.02);
    expect(Math.abs(frac((g) => g.dominance === "codominant") - PRIORS.dominance.codominant)).toBeLessThan(0.02);
    expect(Math.abs(frac((g) => g.ramus) - PRIORS.ramus)).toBeLessThan(0.02);
    expect(Math.abs(frac((g) => g.diagonals === 1) - PRIORS.diagonals.one)).toBeLessThan(0.02);
    expect(Math.abs(frac((g) => g.diagonals === 2) - PRIORS.diagonals.two)).toBeLessThan(0.02);
    expect(Math.abs(frac((g) => g.diagonals >= 3) - PRIORS.diagonals.many)).toBeLessThan(0.02);
    expect(Math.abs(frac((g) => g.marginals === 1) - PRIORS.marginals.one)).toBeLessThan(0.02);
    expect(Math.abs(frac((g) => g.marginals === 2) - PRIORS.marginals.two)).toBeLessThan(0.02);
    expect(Math.abs(frac((g) => g.marginals >= 3) - PRIORS.marginals.many)).toBeLessThan(0.02);
    expect(Math.abs(frac((g) => g.wrapAround) - PRIORS.wrapAround)).toBeLessThan(0.02);
    const sa = PRIORS.saNodal;
    const single = (1 - sa.duplicated) / (sa.RCA + sa.LCx + sa.LM);
    expect(Math.abs(frac((g) => g.saNodal === "both") - sa.duplicated)).toBeLessThan(0.02);
    expect(Math.abs(frac((g) => g.saNodal === "RCA") - sa.RCA * single)).toBeLessThan(0.02);
    expect(Math.abs(frac((g) => g.saNodal === "LCx") - sa.LCx * single)).toBeLessThan(0.02);
    expect(Math.abs(frac((g) => !!g.bridge) - PRIORS.bridge.prevalence)).toBeLessThan(0.02);
    const bridged = G.filter((g) => g.bridge);
    expect(Math.abs(bridged.filter((g) => g.bridge!.vessel === "LAD").length / bridged.length - PRIORS.bridge.onLad)).toBeLessThan(0.06);
    expect(Math.abs(frac((g) => g.sex === "female") - PRIORS.female)).toBeLessThan(0.02);
    // continuous priors: means near the cited values
    const lm = G.filter((g) => !g.ramus).map((g) => g.lm.bifAngleDeg);
    expect(Math.abs(lm.reduce((a, b) => a + b, 0) / lm.length - 75)).toBeLessThan(4);
  });

  it("respects case-specified dominance and variants", () => {
    const g = sampleGenome("case-x", { dominance: "left", variants: ["ramus", "long-lm", "myocardial-bridge"] });
    expect(g.dominance).toBe("left");
    expect(g.ramus).toBe(true);
    expect(g.lm.lengthMm).toBeGreaterThanOrEqual(15);
    expect(g.bridge?.vessel).toBe("LAD");
    expect(sampleGenome("case-y", { variants: [] }).ramus).toBe(false);
    expect(describeGenome(g).join("; ")).toMatch(/ramus/);
  });

  it("varies the anatomy between patients (LAD projected length spans a realistic range)", () => {
    const L = genomes.slice(0, 8).map(({ model, tree }) => polylineLength(projectedChain(tree, model, ["LM", "LAD"], V(-29, 25))));
    expect(Math.max(...L) - Math.min(...L)).toBeGreaterThan(15);
  });
});

// ---------------------------------------------------------------------------
describe("coronary morphology", () => {
  it("has a smooth proximal course: LAD and LCx never climb above the bifurcation, and no Z-kink", () => {
    for (const { tree } of genomes) {
      const lm = vessel(tree, "LM");
      if (!lm) continue;
      const by = samplePos(tree.heart, lm.samples[lm.samples.length - 1]).y;
      for (const name of ["LAD", "LCx"]) {
        const v = vessel(tree, name)!;
        let maxY = -Infinity,
          maxTurn = 0;
        const P = v.samples.map((s) => samplePos(tree.heart, s));
        for (let i = 0; i < v.samples.length && v.pathMm[i] - v.pathMm[0] <= 20; i++) maxY = Math.max(maxY, P[i].y);
        expect(maxY - by).toBeLessThanOrEqual(3);
        // turning over 3 mm windows in the first 25 mm (a Z-kink folds back by more than 90°)
        for (let i = 3; i + 3 < P.length && v.pathMm[i] - v.pathMm[0] <= 25; i++) {
          const a = V3.nrm(V3.sub(P[i], P[i - 3])),
            b = V3.nrm(V3.sub(P[i + 3], P[i]));
          maxTurn = Math.max(maxTurn, (Math.acos(Math.max(-1, Math.min(1, V3.dot(a, b)))) * 180) / Math.PI);
        }
        expect(maxTurn).toBeLessThan(75);
      }
    }
  });

  it("the circumflex has no fold-back: arc/chord in RAO caudal under 1.6", () => {
    const ac: number[] = [];
    for (const { model, tree } of rightDom.slice(0, 10)) {
      const p = projectedChain(tree, model, ["LCx"], V(-31, -22.5));
      const chord = Math.hypot(p[p.length - 1][0] - p[0][0], p[p.length - 1][1] - p[0][1]);
      ac.push(polylineLength(p) / chord);
    }
    // no fold-back (the old tree reached 7.5); the typical course stays under 1.6
    expect(med(ac)).toBeLessThan(1.6);
    expect(Math.max(...ac)).toBeLessThan(2.4);
  });

  it("puts the RCA ostium above the left main ostium (Philip 2015) and anchors the tree to the ostia", () => {
    expect(RCA_OSTIUM_HEIGHT).toBeGreaterThan(LM_OSTIUM_HEIGHT);
    for (const { model, tree } of genomes.slice(0, 4)) {
      expect(model.rca.height).toBeGreaterThan(model.lm.height);
      const d = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      expect(d(samplePos(tree.heart, vessel(tree, "LM")!.samples[0]), model.lm.pos)).toBeLessThan(0.01);
      expect(d(samplePos(tree.heart, vessel(tree, "RCA")!.samples[0]), model.rca.pos)).toBeLessThan(0.01);
    }
  });

  it("projected LM+LAD length in RAO cranial matches the library (96-136 mm, traced to the apex)", () => {
    const L = genomes.slice(0, 12).map(({ model, tree }) => {
      const pts = projectedChain(tree, model, ["LM", "LAD"], V(-29, 25));
      const cs = chainSamples(tree, ["LM", "LAD"]);
      let apex = 0;
      cs.forEach(({ v, i }, k) => {
        if (v.samples[i].ell > cs[apex].v.samples[cs[apex].i].ell) apex = k;
      });
      return polylineLength(pts.slice(0, apex + 1));
    });
    expect(med(L)).toBeGreaterThan(ref.lmLadLengthRAOcraMm.p10 - 5);
    expect(med(L)).toBeLessThan(ref.lmLadLengthRAOcraMm.p90 + 5);
  });

  it("projected tree extents fall within the library's catheter-removed bands", () => {
    // reference.json extentsVesselOnly: catheter removed from the peak-frame mask (lower bound: misses faint and
    // late-filling vessels) and from the filling-phase mask (upper bound: motion-widened). The library mm assume a
    // 6 F catheter; with a 5 F catheter they shrink by 0.83 (reference.json provenance), so the band per dimension is
    // [0.83 x lower median, 1.05 x upper median]. In AP and LAO cranial the catheter enters sideways and its curved tip
    // stays in both masks (out/nocath overlays), so those widths get only a sanity range.
    const band = (r: any, k: "widthMm" | "heightMm") => [0.83 * Math.min(r.peak[k].median, r.fill[k].median), 1.05 * Math.max(r.peak[k].median, r.fill[k].median)];
    for (const view of ["LCA_RAOcau", "LCA_RAOcra", "LCA_APcra", "LCA_LAOcra"] as const) {
      const r = (ref as any).extentsVesselOnly[view];
      const e = genomes.slice(0, 10).map(({ model, tree }) => extent(tree, model, "left", V(r.angle.laoRao, r.angle.cranialCaudal)));
      const w = med(e.map((x) => x.w)),
        h = med(e.map((x) => x.h));
      const [wl, wh] = band(r, "widthMm"),
        [hl, hh] = band(r, "heightMm");
      if (view === "LCA_RAOcau" || view === "LCA_RAOcra") {
        expect(w).toBeGreaterThan(wl);
        expect(w).toBeLessThan(wh);
      } else {
        expect(w).toBeGreaterThan(0.65 * wl);
        expect(w).toBeLessThan(wh);
      }
      // heights: both masks lose the distal LAD and apex where they overlie the diaphragm (overlays), so the upper
      // bound is widened by 10% (25% in LAO cranial, where the distal LAD also crosses the spine)
      expect(h).toBeGreaterThan(hl);
      expect(h).toBeLessThan((view === "LCA_LAOcra" ? 1.25 : 1.1) * hh);
    }
  });

  it("has library-like small-scale tortuosity (8-20 mm band 6-22°, 3-8 mm band reaching the real range)", () => {
    const b820: number[] = [],
      b38: number[] = [];
    for (const { model, tree } of genomes.slice(0, 12)) {
      const pts = projectedChain(tree, model, ["LM", "LAD"], V(-29, 25));
      const b = tangentBandRms(pts.slice(0, Math.round(pts.length * 0.75)));
      if (b.b8_20 !== null) b820.push(b.b8_20);
      if (b.b3_8 !== null) b38.push(b.b3_8);
    }
    expect(med(b820)).toBeGreaterThan(6);
    expect(med(b820)).toBeLessThan(22);
    expect(med(b38)).toBeGreaterThan(6.5);
    expect(med(b38)).toBeLessThan(19);
  });

  it("tortuosity offsets respect the minimum radius of curvature and keep the ostium straight", () => {
    const s = Array.from({ length: 200 }, (_, i) => i * 0.5);
    const o = tortuosityOffsets("rmin", s, { index: 1.5, corkscrew: true });
    expect(Math.abs(o.lat[0])).toBeLessThan(0.05);
    // the short-wavelength part is limited to the minimum radius (2.2 mm); the longer octaves add a little
    const k: number[] = [];
    for (let i = 1; i < s.length - 1; i++) k.push(Math.hypot(o.lat[i + 1] - 2 * o.lat[i] + o.lat[i - 1], o.hgt[i + 1] - 2 * o.hgt[i] + o.hgt[i - 1]) / 0.25);
    expect(quantile(k, 0.95)).toBeLessThan(1 / 2.2 + 0.1);
  });

  it("calibres follow the flow law and Dodge 1992 reference diameters", () => {
    const sexAdj = (t: CoronaryTree) => t.genome!.lm.diameterMm / 4.5;
    expect(HK_EXPONENT).toBeCloseTo(3 / 7);
    expect(med(genomes.map((g) => D(g.tree, "LM", 0.5)))).toBeGreaterThan(3.6);
    expect(med(genomes.map((g) => D(g.tree, "LAD", 0.08) / sexAdj(g.tree)))).toBeGreaterThan(3.3);
    expect(med(genomes.map((g) => D(g.tree, "LAD", 0.08) / sexAdj(g.tree)))).toBeLessThan(4.1);
    expect(med(genomes.map((g) => D(g.tree, "LAD", 0.7)))).toBeGreaterThan(1.3);
    expect(med(rightDom.map((g) => D(g.tree, "RCA", 0.1)))).toBeGreaterThan(3.3);
    expect(med(rightDom.map((g) => D(g.tree, "RCA", 0.1)))).toBeLessThan(4.5);
    expect(med(rightDom.map((g) => D(g.tree, "LCx", 0.1)))).toBeGreaterThan(2.7);
    expect(med(rightDom.map((g) => D(g.tree, "LCx", 0.1)))).toBeLessThan(3.9);
    // left dominance: smaller RCA, larger circumflex
    // relative to the patient's own left main
    const left = genomes.filter((g) => g.tree.genome!.dominance === "left");
    const rel = (g: (typeof genomes)[number], n: string) => D(g.tree, n, 0.1) / g.tree.genome!.lm.diameterMm;
    for (const g of left) {
      expect(rel(g, "RCA")).toBeLessThan(med(rightDom.map((r) => rel(r, "RCA"))));
      expect(rel(g, "LCx")).toBeGreaterThan(med(rightDom.map((r) => rel(r, "LCx"))));
    }
  });

  it("bifurcations: no Murray cube ratio above 1.2; major bifurcation Finet ratios near the normal 0.66-0.68", () => {
    const finet: number[] = [];
    for (const { tree } of genomes) {
      for (const v of tree.vessels) {
        if (!v.parent || v.kind === "twig" || v.name.startsWith("collateral")) continue;
        const p = vessel(tree, v.parent.name)!;
        const i = v.parent.index;
        if (i < 3 || i > p.samples.length - 4) continue;
        const rr = p.refRadii!;
        const Dp = 2 * rr[i - 2],
          Dm = 2 * rr[i + 2],
          Ds = 2 * v.refRadii![Math.min(2, v.samples.length - 1)];
        expect((Dm ** 3 + Ds ** 3) / Dp ** 3).toBeLessThan(1.2);
      }
      for (const [par, child] of [["LAD", "D1"], ["LCx", "OM1"]] as const) {
        const p = vessel(tree, par),
          v = vessel(tree, child);
        if (!p || !v || !v.parent) continue;
        const i = v.parent.index;
        finet.push((2 * p.refRadii![Math.max(0, i - 2)]) / (2 * p.refRadii![Math.min(p.samples.length - 1, i + 2)] + 2 * v.refRadii![Math.min(2, v.samples.length - 1)]));
      }
      const lm = vessel(tree, "LM");
      if (lm) finet.push((2 * lm.refRadii![lm.samples.length - 1]) / (2 * vessel(tree, "LAD")!.refRadii![2] + 2 * vessel(tree, "LCx")!.refRadii![2]));
    }
    // Medrano-Gracia 2017: 0.6576 ± 0.083 (the 7/3 law alone cannot go below 0.673)
    expect(med(finet)).toBeLessThan(0.6576 + 0.083);
    expect(med(finet)).toBeGreaterThan(0.6576 - 0.083);
  });

  it("branch counts follow the genome and every tip tapers to a fine end", () => {
    for (const { tree } of genomes) {
      const g = tree.genome!;
      expect(tree.vessels.filter((v) => /^D\d+$/.test(v.name)).length).toBe(g.diagonals);
      expect(tree.vessels.filter((v) => /^OM\d+$/.test(v.name)).length).toBe(g.marginals);
      expect(!!vessel(tree, "RAMUS")).toBe(g.ramus);
      if (g.dominance !== "left") expect(vessel(tree, "PDA")!.parent!.name).toBe("RCA");
      else expect(vessel(tree, "PDA")!.parent!.name).toBe("LCx");
      expect(!!vessel(tree, "AVN")).toBe(true);
      expect(!!vessel(tree, "SAN") || !!vessel(tree, "SAN2")).toBe(true);
      for (const v of tree.vessels.filter((x) => x.kind === "twig")) expect(v.refRadii![v.refRadii!.length - 1]).toBeLessThan(0.15);
    }
  });

  it("labels SYNTAX segments", () => {
    const { tree } = genomes[0];
    expect(segmentAt(tree, "LM", 0.5)).toBe("5");
    expect(segmentAt(tree, "RCA", 0.05)).toBe("1");
    expect(segmentAt(tree, "LAD", 0.02)).toBe("6");
    expect(segmentAt(tree, "LAD", 0.95)).toBe("8");
    expect(segmentAt(tree, "D1", 0.5)).toBe("9");
    expect(segmentAt(tree, "LCx", 0.02)).toBe("11");
    expect(segmentAt(tree, "OM1", 0.5)).toBe("12a");
    expect(segmentAt(tree, "PDA", 0.5)).toBe("4");
    for (const label of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "11", "12a", "13"]) expect(segmentSpans(tree, label).length).toBeGreaterThan(0);
  });

  it("every branch belongs to its parent's injection side, for every variant and dominance", () => {
    for (const variants of [[], ["anomalous-lcx-right-sinus"], ["anomalous-rca-left-sinus"], ["separate-ostia"]])
      for (const dom of ["right", "left", "codominant"] as Dominance[]) {
        const { tree } = build(mk(`side-${dom}-${variants.join()}`, dom, variants));
        for (const v of tree.vessels) {
          if (!v.parent) continue;
          expect(v.side).toBe(vessel(tree, v.parent.name)!.side);
        }
        if (variants[0] === "anomalous-lcx-right-sinus") {
          // the whole circumflex system is injected from the right; its segment numbers stay left-system ones
          for (const n of ["LCx", "OM1"]) expect(vessel(tree, n)!.side).toBe("right");
          if (dom === "left") {
            expect(vessel(tree, "PDA")!.side).toBe("right");
            expect(segmentAt(tree, "PDA", 0.5)).toBe("15");
          }
        }
      }
  });

  it("first diagonal and first marginal: near-ostial diameters as Divia Paul 2018, and not systematically smaller than the next", () => {
    const G = Array.from({ length: 30 }, (_, i) => build(mk(`series-${i}`)));
    const d0 = (t: CoronaryTree, n: string) => {
      const v = vessel(t, n);
      if (!v) return NaN;
      const i0 = Math.max(0, v.samples.findIndex((x) => x.w >= 0.5));
      return 2 * v.refRadii![Math.min(v.samples.length - 1, i0 + 2)];
    };
    const d1 = G.map((g) => d0(g.tree, "D1")),
      om1 = G.map((g) => d0(g.tree, "OM1"));
    // Divia Paul 2018 Table 2: DIAG 1.83 ± 0.43 (men) / 1.65 ± 0.41 (women); OM 2.19 ± 0.48 / 2.05 ± 0.41 mm
    expect(med(d1)).toBeGreaterThan(1.65 - 0.41);
    expect(med(d1)).toBeLessThan(1.83 + 0.43);
    expect(med(om1)).toBeGreaterThan(2.05 - 0.41);
    expect(med(om1)).toBeLessThan(2.19 + 0.48 + 0.2);
    const withOm2 = G.filter((g) => vessel(g.tree, "OM2"));
    const withD2 = G.filter((g) => vessel(g.tree, "D2"));
    // the first of a series is the larger in most patients, not all (model rule, U(0.8, 1.1) ratio)
    expect(withOm2.filter((g) => d0(g.tree, "OM1") < d0(g.tree, "OM2")).length / withOm2.length).toBeLessThan(0.5);
    expect(withD2.filter((g) => d0(g.tree, "D1") < d0(g.tree, "D2")).length / withD2.length).toBeLessThan(0.5);
  });

  it("septal perforators number 6-12 (Kesieme 2024: about 9, range 6-14) and the first is the largest", () => {
    for (const { tree } of genomes.slice(0, 12)) {
      const S = tree.vessels.filter((v) => /^S\d+$/.test(v.name));
      expect(S.length).toBeGreaterThanOrEqual(5);
      expect(S.length).toBeLessThanOrEqual(12);
      const d = S.map((v) => v.refRadii![Math.min(2, v.samples.length - 1)]);
      expect(d[0]).toBeGreaterThanOrEqual(Math.max(...d.slice(1)));
    }
  });

  it("the sinoatrial nodal artery ends near the SVC-right atrial junction (model course, 40-90 mm)", () => {
    for (const { tree } of genomes) {
      for (const n of ["SAN", "SAN2"]) {
        if (!vessel(tree, n)) continue;
        const L = vesselLength(tree, n);
        expect(L).toBeGreaterThan(35);
        expect(L).toBeLessThan(95);
      }
    }
  });

  it("branch density: mid-tree transect crossings above the wave-1 5/5/5, towards the library 8/7/4", () => {
    // these seeds give about 7/6/6 (wave 1: 5/5/5). The calibre constraints (Dodge distal LAD, Divia Paul side branches,
    // a 2 mm reference diameter at the mid-LAD PCI lesion) bound how much territory the visible branches can drain under
    // the 7/3 law; the remaining gap is an open issue (docs/realism/wave2/I2.md)
    const views = [
      ["LCA_RAOcra", -29, 25, 6, 9],
      ["LCA_APcra", 0, 32, 5.5, 8],
      // LAO cranial is above the library's 4 (6 on these seeds): the upper bound holds it there so it cannot drift further
      ["LCA_LAOcra", 30.5, 27, 4, 6],
    ] as const;
    for (const [, lr, cc, min, max] of views) {
      const c = genomes.slice(0, 12).map(({ model, tree }, k) => rasterMetrics(tree, model, "left", V(lr, cc), k).median);
      expect(med(c)).toBeGreaterThanOrEqual(min);
      expect(med(c)).toBeLessThanOrEqual(max);
    }
  });

  it("no generator artefacts: no branch re-enters its parent, no lumen runs through another one of its tree", () => {
    // the S2b counts (docs/realism/wave1/S2b.md): 5-7 re-entries and 29-37 interpenetrating pairs per tree before
    const trees = [...CASE_LIBRARY.slice(0, 3).map((c) => buildCoronaryTree(buildAnatomy(c), c)), ...genomes.slice(0, 6).map((g) => g.tree)];
    for (const t of trees) {
      const a = treeArtefacts(t);
      expect(a.reentry.length).toBe(0);
      expect(a.interpenetration.length).toBeLessThanOrEqual(1);
      expect(a.crossFamily).toBeLessThanOrEqual(2);
    }
  });

  it("epicardial courses stay above the myocardium outside a flagged bridge, and every genome bridge is flagged", () => {
    const trees = [...genomes.map((g) => g.tree), ...CASE_LIBRARY.slice(0, 40).map((c) => buildCoronaryTree(buildAnatomy(c), c))];
    let bridges = 0;
    for (const t of trees) {
      const gb = t.genome?.bridge;
      if (gb) {
        bridges++;
        expect(vessel(t, gb.vessel)?.bridge).toBeDefined();
      }
      const lad = vessel(t, "LAD")!;
      lad.samples.forEach((s, i) => {
        if (s.w < 1 || s.ell <= -0.85) return;
        // the bridge run and its ramps (4 mm each side, coronaryGrowth make())
        if (lad.bridge && i >= lad.bridge.i0 - 8 && i <= lad.bridge.i1 + 8) return;
        expect(s.h).toBeGreaterThanOrEqual(0);
      });
    }
    expect(bridges).toBeGreaterThan(0);
  });

  it("named branches keep their reach: the PDA runs down the posterior groove, D1 and OM1 are not cut short", () => {
    const trees = [...genomes.map((g) => g.tree), ...CASE_LIBRARY.slice(0, 40).map((c) => buildCoronaryTree(buildAnatomy(c), c))];
    const len = (v: { pathMm: number[] }) => v.pathMm[v.pathMm.length - 1] - v.pathMm[0];
    const d1: number[] = [],
      om1: number[] = [];
    for (const t of trees) {
      const pda = vessel(t, "PDA");
      if (pda) {
        // wave 1: ends at ell -0.12 or beyond on every tree (the crux is at the AV groove, ell about -0.94)
        expect(pda.samples[pda.samples.length - 1].ell).toBeGreaterThan(-0.3);
        expect(len(pda)).toBeGreaterThan(45);
      }
      for (const v of t.vessels) if (/^PL\d$/.test(v.name)) expect(len(v)).toBeGreaterThan(12);
      d1.push(len(vessel(t, "D1")!));
      om1.push(len(vessel(t, "OM1")!));
    }
    // wave 1 (no clearance): D1 median 80 mm, minimum 61; OM1 median 81, minimum 59
    expect(med(d1)).toBeGreaterThan(65);
    expect(Math.min(...d1)).toBeGreaterThan(40);
    expect(med(om1)).toBeGreaterThan(70);
    expect(Math.min(...om1)).toBeGreaterThan(50);
  });

  it("LAD long-wavelength meander: the projected 20-60 mm band reaches the library range (real median 13.85°)", () => {
    const b: number[] = [];
    for (const { model, tree } of genomes.slice(0, 12)) {
      const pts = projectedChain(tree, model, ["LM", "LAD"], V(-29, 25));
      const cs = chainSamples(tree, ["LM", "LAD"]);
      let apex = 0;
      cs.forEach(({ v, i }, k) => {
        if (v.samples[i].ell > cs[apex].v.samples[cs[apex].i].ell) apex = k;
      });
      const r = tangentBandRms(pts.slice(0, apex + 1));
      if (r.b20_60 !== null) b.push(r.b20_60);
    }
    expect(med(b)).toBeGreaterThan(9);
    expect(med(b)).toBeLessThan(20);
  });
});

// ---------------------------------------------------------------------------
describe("lesions, stents and caching", () => {
  const base = mk("lesion-case");
  const model = buildAnatomy(base);
  const lesion: Lesion = { vessel: "LAD", position: 0.4, severity: 90, kind: "severe-stenosis", lengthMm: 10 } as Lesion;

  it("applying lesions does not move the anatomy (same samples, same path coordinates)", () => {
    const ref0 = buildCoronaryTree(model, base);
    const withL = buildCoronaryTree(model, { ...base, lesions: [lesion] }, [{ vessel: "LAD", from: 0.36, to: 0.44, radius: 1.4 }]);
    const a = vessel(ref0, "LAD")!,
      b = vessel(withL, "LAD")!;
    expect(b.samples).toBe(a.samples);
    const i = a.param.findIndex((t) => t >= 0.4);
    expect(Math.abs(b.pathMm[i] - a.pathMm[i])).toBeLessThan(0.5);
    expect(ref0.vessels.length).toBe(withL.vessels.length);
  });

  it("re-applying lesions is cheap (topology cached per genome)", () => {
    buildCoronaryTree(model, base);
    const t0 = performance.now();
    for (let k = 0; k < 20; k++) buildCoronaryTree(model, { ...base, lesions: [{ ...lesion, severity: 50 + k }] });
    expect((performance.now() - t0) / 20).toBeLessThan(8);
  });

  it("renders a 90% lesion's minimum lumen diameter within 2% (dense samples at the lesion)", () => {
    const t = buildCoronaryTree(model, { ...base, lesions: [lesion] });
    const v = vessel(t, "LAD")!;
    const rp = renderPath(v);
    expect(v.fine).toBeDefined();
    const i = v.param.findIndex((x) => x >= 0.4);
    const refD = 2 * v.refRadii![i];
    const mld = 2 * Math.min(...rp.radii);
    const spec = refD * (1 - 0.9);
    expect(Math.abs(mld - spec) / refD).toBeLessThan(0.02);
    // spacing ≤ 0.25 mm within the lesion
    for (let k = 1; k < rp.pathMm.length; k++) {
      const mid = (rp.param[k] + rp.param[k - 1]) / 2;
      if (Math.abs(mid - 0.4) * (v.pathMm[v.pathMm.length - 1] - v.pathMm[0]) < 5) expect(rp.pathMm[k] - rp.pathMm[k - 1]).toBeLessThan(0.26);
    }
  });

  it("is fast to grow a new patient", () => {
    const t0 = performance.now();
    growTopology(buildAnatomy(mk("speed-1")), sampleGenome("speed-1", { dominance: "right", variants: [] }));
    expect(performance.now() - t0).toBeLessThan(400);
  });
});

// ---------------------------------------------------------------------------
describe("variants as geometry", () => {
  const span = (t: CoronaryTree, name: string) => {
    const v = vessel(t, name)!;
    return v.samples.map((s) => samplePos(t.heart, s));
  };
  it("separate ostia start the circumflex at its own ostium with no left main", () => {
    const c = mk("var-sep", "right", ["separate-ostia"]);
    const { model, tree } = build(c);
    expect(vessel(tree, "LM")).toBeUndefined();
    const p = span(tree, "LCx")[0];
    expect(Math.hypot(p.x - model.leftOstium2!.pos.x, p.y - model.leftOstium2!.pos.y, p.z - model.leftOstium2!.pos.z)).toBeLessThan(0.01);
    expect(engagementTargets(model).map((x) => x.vessel)).toContain("LCx");
  });

  it("a shepherd's crook RCA loops upwards before entering the groove", () => {
    const plain = build(mk("var-crook"));
    const crook = build(mk("var-crook", "right", ["shepherds-crook-rca"]));
    const maxRise = (t: CoronaryTree) => {
      const p = span(t, "RCA");
      return Math.max(...p.slice(0, 25).map((q) => q.y)) - p[0].y;
    };
    expect(maxRise(crook.tree)).toBeGreaterThan(maxRise(plain.tree) + 2);
  });

  it("a tortuous RCA is more tortuous", () => {
    const plain = build(mk("var-tort"));
    const tort = build(mk("var-tort", "right", ["tortuous-rca"]));
    // the extra undulation shows across the bands, most in the longer wavelengths (curvature-limited below 8 mm)
    const b = (x: ReturnType<typeof build>) => {
      const r = tangentBandRms(projectedChain(x.tree, x.model, ["RCA"], V(27, -2)));
      return r.b8_20! + r.b20_60!;
    };
    expect(b(tort)).toBeGreaterThan(b(plain) * 1.25);
  });

  it("a myocardial bridge dips the LAD under the myocardium and narrows in systole only", () => {
    const { tree } = build(mk("var-bridge", "right", ["myocardial-bridge"]));
    const v = vessel(tree, "LAD")!;
    expect(v.bridge).toBeDefined();
    const mid = Math.round((v.bridge!.i0 + v.bridge!.i1) / 2);
    expect(v.samples[mid].h).toBeLessThan(0);
    const dia = vesselRadiiAt(v, motionAt(clockStateAt(0.85, 65)));
    const sys = vesselRadiiAt(v, motionAt(clockStateAt(0.37, 65)));
    expect(dia[mid]).toBeCloseTo(v.radii[mid]);
    expect(sys[mid]).toBeLessThan(v.radii[mid] * (1 - 0.3));
  });

  it("anomalous origins move the ostia and change the course", () => {
    const rcaL = build(mk("var-anom", "right", ["anomalous-rca-left-sinus"]));
    expect(rcaL.model.sinusOf?.rca).toBe("left");
    expect(rcaL.model.rca.height).toBeGreaterThan(rcaL.model.lm.height);
    // interarterial: the proximal RCA passes in front of the root (anterior), between aorta and pulmonary trunk
    const p = span(rcaL.tree, "RCA");
    expect(Math.max(...p.slice(0, 20).map((q) => q.z))).toBeGreaterThan(rcaL.model.sinusRadius);
    const lcxR = build(mk("var-anom2", "right", ["anomalous-lcx-right-sinus"]));
    expect(lcxR.model.sinusOf?.lcx).toBe("right");
    const q = span(lcxR.tree, "LCx");
    // retroaortic: behind the root
    expect(Math.min(...q.slice(0, 30).map((x) => x.z))).toBeLessThan(-lcxR.model.sinusRadius * 0.6);
    expect(vessel(lcxR.tree, "LCx")!.side).toBe("right");
  });
});

// ---------------------------------------------------------------------------
describe("case library", () => {
  it("every library case builds a finite tree within adult dimensions", () => {
    for (const c of CASE_LIBRARY) {
      const model = buildAnatomy(c);
      const t = buildCoronaryTree(model, c);
      expect(vesselLength(t, "LAD")).toBeGreaterThan(90);
      expect(vesselLength(t, "LAD")).toBeLessThan(250);
      for (const v of t.vessels) for (const s of v.samples) {
        const p = samplePos(t.heart, s);
        expect(Number.isFinite(p.x + p.y + p.z)).toBe(true);
      }
    }
  });
});
