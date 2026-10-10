// The bench's measurements and pre-PCI plan (pci-bench-measure-and-plan): grading against frame truth,
// the plan's consequences in deploy(), the modality choice, the ostial and two-branch left main presets,
// and the geometry the measuring tools share.
//   npx vitest run src/simulation/bench/measure.test.ts
import { describe, expect, it } from "vitest";
import {
  BENCH_BY_ID,
  BENCH_LESIONS,
  MEASURE_LESIONS,
  OCT_RUN_CONTRAST_ML,
  benchFrameAt,
  benchLeftMainSegment,
  benchMsaTarget,
  benchPullbacks,
  deploy,
  initialState,
  lumen,
  eem,
  preImaging,
  type BenchLesion,
} from "../pciBench";
import { polarArea } from "../pci/ivus";
import {
  LM_SEGMENT_TARGETS_MM2,
  MEASURE_TOLERANCE,
  arcDegBetween,
  exactPlan,
  gradeModality,
  gradePlan,
  inGreyZone,
  lmSegmentCheck,
  lmThreshold,
  meanDiameterMm,
  planTruth,
  polygonAreaMm2,
  snapMm,
  type BenchPlan,
} from "./measure";

const L = (id: string): BenchLesion => BENCH_BY_ID[id];
const item = (plan: BenchPlan, l: BenchLesion, id: string) => gradePlan(l, plan).items.find((i) => i.id === id)!;

describe("focal-lad: entries graded against the frames", () => {
  const l = L("focal-lad");
  const t = planTruth(l, "IVUS");

  it("correct entries pass every item", () => {
    const g = gradePlan(l, exactPlan(l, "IVUS"));
    expect(g.items.filter((i) => !i.ok)).toEqual([]);
    expect(g.correct).toBe(g.total);
    // and the truth is the bench's own geometry: the MLA is the narrowest lumen of the segment
    expect(t.mla).toBeCloseTo(preImaging(l, "IVUS").mla, 6);
  });

  it("entries a measurement off by less than the tolerance still pass; beyond it they fail", () => {
    const ok = { ...exactPlan(l, "IVUS"), mla: t.mla! + 0.4, landingProxMm: t.landingProxMm - 0.9, distRef: { method: "lumen" as const, diameterMm: t.distRef.lumenMax + 0.2 } };
    const g = gradePlan(l, ok);
    expect(g.items.filter((i) => !i.ok)).toEqual([]);
    const bad = { ...ok, mla: t.mla! + 0.6, landingProxMm: t.landingProxMm - 1.5, distRef: { method: "lumen" as const, diameterMm: t.distRef.lumenMax + 0.4 } };
    const gb = gradePlan(l, bad);
    expect(gb.items.filter((i) => !i.ok).map((i) => i.id).sort()).toEqual(["dist-ref", "landing-prox", "mla"]);
    expect(MEASURE_TOLERANCE.mlaMm2).toBe(0.5);
  });

  it("a stent sized to the proximal reference is flagged, and deploy() reports a distal edge dissection", () => {
    expect(t.stentSizes).toEqual([3.5]);
    expect(t.proximalStentSizes).toContain(4);
    const plan = { ...exactPlan(l, "IVUS"), stentDiameterMm: 4 };
    const st = item(plan, l, "stent");
    expect(st.ok).toBe(false);
    expect(st.flag).toBe("proximal-reference");
    expect(gradePlan(l, plan).flags).toContain("proximal-reference");
    // deployed on the planned landing zones, the distal sizing passes and the proximal sizing dissects the distal edge
    const stent = (d: number) => ({ diameter: d, lengthMm: 18, proxEdge: t.landingProxMm - 1, atm: 12 });
    const good = deploy(l, initialState(), stent(3.5), [], "IVUS");
    expect(good.events.some((e) => e.kind === "dissection")).toBe(false);
    const prox = deploy(l, initialState(), stent(4), [], "IVUS");
    const diss = prox.events.find((e) => e.kind === "dissection" && e.where === "dist-edge");
    expect(diss).toBeDefined();
    expect(diss!.text).toContain("distal reference");
    expect(prox.score).toBeLessThan(good.score);
  });

  it("a proximal post-dilatation balloon no larger than the stent is not a proximal optimisation", () => {
    // only sizes above every distal stent size count
    expect(t.postDilSizes.every((s) => s > Math.max(...t.stentSizes))).toBe(true);
    const same = { ...exactPlan(l, "IVUS"), stentDiameterMm: 3.5, postDilMm: 3.5 };
    expect(item(same, l, "post-dil").ok).toBe(false);
    if (t.postDilSizes.length) {
      const larger = { ...exactPlan(l, "IVUS"), stentDiameterMm: 3.5, postDilMm: t.postDilSizes[0] };
      expect(item(larger, l, "post-dil").ok).toBe(true);
    }
  });

  it("an optional reason left out is not graded; a required one is", () => {
    const base = { ...exactPlan(l, "IVUS"), reasonId: null };
    expect(gradePlan(l, base).items.some((i) => i.id === "reason")).toBe(false);
    expect(item({ ...base, requireReason: true }, l, "reason").ok).toBe(false);
    expect(item(exactPlan(l, "IVUS"), l, "reason").ok).toBe(true);
  });

  it("an edge on plaque burden over 50% dissects", () => {
    const r = deploy(l, initialState(), { diameter: 3.5, lengthMm: 8, proxEdge: 17, atm: 12 }, [], "IVUS");
    expect(r.events.some((e) => e.kind === "dissection" && e.where === "prox-edge")).toBe(true);
  });
});

describe("edges on lipid", () => {
  it("an edge on the lipid pool reports an edge dissection; edges beyond it do not", () => {
    for (const id of ["lipid-acs", "acs-culprit-oct"]) {
      const l = L(id);
      const t = planTruth(l, "OCT");
      // the landing zones the frames call for lie beyond the pool
      expect(t.landingProxMm).toBeLessThan(l.startMm);
      expect(t.landingDistMm).toBeGreaterThan(l.endMm);
      const beyond = deploy(l, initialState(), { diameter: 3.5, lengthMm: 18, proxEdge: t.landingProxMm - 1, atm: 12 }, [], "OCT");
      expect(beyond.events.some((e) => e.kind === "dissection")).toBe(false);
      // the distal edge on the pool, where plaque burden is below 50% at the pool's edge
      const proxEdge = t.landingProxMm - 1;
      const onPool = deploy(l, initialState(), { diameter: 3.5, lengthMm: l.endMm - 0.5 - proxEdge, proxEdge, atm: 12 }, [], "OCT");
      const d = onPool.events.find((e) => e.kind === "dissection" && e.where === "dist-edge");
      expect(d, id).toBeDefined();
      expect(d!.text).toContain("lipid");
    }
  });
});

describe("the modality choice", () => {
  it("OCT for 'ostial-lm-ivus' is wrong and its aorta frames have no measurable lumen", () => {
    const l = L("ostial-lm-ivus");
    const g = gradeModality(l, "OCT", "left-main-ostial");
    expect(g.ok).toBe(false);
    expect(g.expected).toBe("IVUS");
    expect(g.consequence).toContain("aorta");
    expect(gradeModality(l, "IVUS", "left-main-ostial")).toMatchObject({ ok: true, reasonOk: true });
    const aortaMm = l.ostial!.aortaMm;
    for (let x = 0; x < aortaMm; x += 0.5)
      for (const m of ["IVUS", "OCT"] as const) {
        const f = benchFrameAt(l, x, m);
        expect(f.region).toBe("aorta");
        expect(f.lumenMeasurable).toBe(false);
        // the aortic lumen is wider than the field of view: no coronary wall to trace
        expect(Math.min(...f.frame.lumen)).toBeGreaterThan(5.3);
      }
    // OCT does not clear the ostium either: the ostial MLA cannot be measured, and the plan's MLA must say so
    const tOct = planTruth(l, "OCT");
    expect(tOct.mla).toBeNull();
    expect(benchFrameAt(l, tOct.mlaAtMm, "OCT").region).toBe("uncleared");
    expect(gradePlan(l, { ...exactPlan(l, "OCT"), mla: 5 }).items.find((i) => i.id === "mla")!.ok).toBe(false);
    // IVUS measures it, in the grey zone, so physiology is an accepted answer
    const tIvus = planTruth(l, "IVUS");
    expect(tIvus.mla).not.toBeNull();
    expect(benchFrameAt(l, tIvus.mlaAtMm, "IVUS").lumenMeasurable).toBe(true);
    expect(inGreyZone(tIvus.mla!)).toBe(true);
    const sig = (s: BenchPlan["significance"]) => gradePlan(l, { ...exactPlan(l, "IVUS"), significance: s }).items.find((i) => i.id === "significance")!.ok;
    expect(sig("physiology")).toBe(true);
    expect(sig("significant")).toBe(true);
    expect(sig("not-significant")).toBe(false);
  });

  it("the population toggle moves the IVUS threshold from 6.0 to 4.5 mm²; OCT uses 5.4 mm²", () => {
    expect(lmThreshold("IVUS")).toBe(6.0);
    expect(lmThreshold("IVUS", "korean")).toBe(4.5);
    expect(lmThreshold("OCT")).toBe(5.4);
    const l = L("ostial-lm-ivus");
    const korean = { ...exactPlan(l, "IVUS", "korean") };
    expect(korean.significance).toBe("not-significant");
    expect(gradePlan(l, korean).items.find((i) => i.id === "significance")!.ok).toBe(true);
  });

  it("every preset states a goal; OCT for contrast saving and IVUS for calcium thickness are wrong, with their limitation", () => {
    for (const l of [...BENCH_LESIONS, ...MEASURE_LESIONS]) expect(l.goal, l.id).toBeDefined();
    const ckd = gradeModality(L("ckd-ivus"), "OCT", "sizing");
    expect(ckd.ok).toBe(false);
    expect(ckd.consequence).toContain(`${OCT_RUN_CONTRAST_ML.right} mL`);
    expect(ckd.consequence).toContain("24");
    expect(gradeModality(L("calcified-rca"), "IVUS").consequence).toContain("thickness");
    expect(gradeModality(L("acs-culprit-oct"), "OCT", "culprit")).toMatchObject({ ok: true, reasonOk: true });
    expect(gradeModality(L("focal-lad"), "OCT").ok).toBe(true);
    expect(gradeModality(L("focal-lad"), "IVUS").ok).toBe(true);
  });

  it("OCT adds its flush to the imaging contrast; IVUS adds none", () => {
    const l = L("ckd-ivus");
    const stent = { diameter: 3.5, lengthMm: 28, proxEdge: 10, atm: 12 };
    expect(deploy(l, initialState(), stent, [], "IVUS").imagingContrastMl).toBe(0);
    expect(deploy(l, initialState(), stent, [], "OCT").imagingContrastMl).toBe(2 * OCT_RUN_CONTRAST_ML.right);
    expect(deploy(L("focal-lad"), initialState(), stent, [], "OCT", { imagingRuns: 3 }).imagingContrastMl).toBe(3 * OCT_RUN_CONTRAST_ML.left);
  });

  it("IVUS frames give no calcium thickness, and the plan must say it is not measurable", () => {
    const l = L("aorto-ostial-rca");
    const t = planTruth(l, "IVUS");
    expect(t.calcium!.thicknessMm).toBeNull();
    const withNumber = { ...exactPlan(l, "IVUS"), calcium: { arcDeg: t.calcium!.arcDeg, thicknessMm: 0.4, lengthMm: t.calcium!.lengthMm } };
    expect(item(withNumber, l, "ca-thickness").ok).toBe(false);
    // OCT scores it: arc over 180 (2) + length over 5 (1) = 3, so a balloon is the preparation
    const o = planTruth(l, "OCT");
    expect(o.calcium!.score).toBe(3);
    expect(o.prepTool).toBe("balloon");
    expect(planTruth(L("calcified-rca"), "OCT")).toMatchObject({ calcium: { score: 4 }, prepTool: "modification" });
  });
});

describe("ostial presets: the stent covers the ostium, just protruding into the aorta", () => {
  for (const id of ["ostial-lm-ivus", "aorto-ostial-rca"]) {
    it(`${id}: protrusion is not malapposition and the covered ostium has no proximal edge; a stent inside the ostium is flagged`, () => {
      const l = L(id);
      const t = planTruth(l, "IVUS");
      const d = t.stentSizes[0];
      const ostium = l.ostial!.aortaMm;
      const label = (r: ReturnType<typeof deploy>, start: string) => r.criteria.find((c) => c.label.startsWith(start))!;
      // a distal-sized stent from 1 mm in the aorta to beyond the distal landing zone
      const lengthMm = Math.ceil(t.landingDistMm - (ostium - 1)) + 2;
      const cover = deploy(l, initialState(), { diameter: d, lengthMm, proxEdge: ostium - 1, atm: 12 }, [], "IVUS");
      expect(label(cover, "Malapposition").ok).toBe(true);
      expect(label(cover, "Plaque burden < 50% at both edges").ok).toBe(true);
      expect(label(cover, "Ostium covered").ok).toBe(true);
      expect(cover.ostiumCovered).toBe(true);
      expect(cover.proxEdgePB).toBe(0);
      expect(cover.geographicMiss).toBe(false);
      expect(cover.events.some((e) => e.where === "prox-edge")).toBe(false);
      expect(cover.events.some((e) => e.kind === "perforation")).toBe(false);
      // exactly at the ostium also counts as covered
      const at = deploy(l, initialState(), { diameter: d, lengthMm, proxEdge: ostium, atm: 12 }, [], "IVUS");
      expect(label(at, "Plaque burden < 50% at both edges").ok).toBe(true);
      expect(at.ostiumCovered).toBe(true);
      // starting 1 mm inside the ostium leaves it uncovered
      const inside = deploy(l, initialState(), { diameter: d, lengthMm, proxEdge: ostium + 1, atm: 12 }, [], "IVUS");
      expect(inside.ostiumCovered).toBe(false);
      expect(label(inside, "Ostium covered").ok).toBe(false);
      expect(inside.geographicMiss).toBe(true);
      expect(inside.score).toBeLessThan(cover.score);
    });
  }

  it("a non-ostial lesion gets no ostium criterion", () => {
    const r = deploy(L("focal-lad"), initialState(), { diameter: 3.5, lengthMm: 18, proxEdge: 10, atm: 12 }, [], "IVUS");
    expect(r.ostiumCovered).toBe(true);
    expect(r.criteria.some((c) => c.label.startsWith("Ostium covered"))).toBe(false);
  });
});

describe("distal-lm-two-branch", () => {
  const l = L("distal-lm-two-branch");

  it("has an LAD and a circumflex pullback sharing the left main segment", () => {
    expect(benchPullbacks(l).map((p) => p.id)).toEqual(["LAD", "LCx"]);
    const poc = l.branches![0].atMm;
    for (let x = 0; x < poc - 1; x += 1) {
      const a = benchFrameAt(l, x, "IVUS", "LAD").frame.areas.lumen;
      const b = benchFrameAt(l, x, "IVUS", "LCx").frame.areas.lumen;
      expect(Math.abs(a - b) / a).toBeLessThan(0.01);
    }
  });

  it("is graded correct only with both pullbacks", () => {
    const full = exactPlan(l, "IVUS");
    expect(full.pullbacks).toEqual(["LAD", "LCx"]);
    expect(gradePlan(l, full).items.filter((i) => !i.ok)).toEqual([]);
    const ladOnly = { ...full, pullbacks: ["LAD"] };
    const g = gradePlan(l, ladOnly);
    expect(g.items.find((i) => i.id === "pullbacks")!.ok).toBe(false);
    expect(g.items.find((i) => i.id === "seg-lcx")!.ok).toBe(false);
    expect(g.flags).toContain("not-imaged");
    expect(g.correct).toBeLessThan(g.total);
  });

  it("a short circumflex ostial lesion shows only on the circumflex pullback", () => {
    const poc = l.branches![0].atMm;
    const minArea = (branch: string) => {
      let m = Infinity;
      for (let x = poc + 0.25; x <= poc + 4; x += 0.25) m = Math.min(m, benchFrameAt(l, x, "IVUS", branch).frame.areas.lumen);
      return m;
    };
    const t = planTruth(l, "IVUS");
    expect(t.segments!.lcxOstium!).toBeLessThan(LM_SEGMENT_TARGETS_MM2.lcxOstium);
    expect(minArea("LCx")).toBeLessThan(LM_SEGMENT_TARGETS_MM2.lcxOstium);
    expect(minArea("LAD")).toBeGreaterThan(LM_SEGMENT_TARGETS_MM2.ladOstium);
    // the circumflex lesion is short (under 5 mm of the circumflex below the target)
    let short = 0;
    for (let x = poc; x <= poc + 10; x += 0.25) if (benchFrameAt(l, x, "IVUS", "LCx").frame.areas.lumen < LM_SEGMENT_TARGETS_MM2.lcxOstium) short += 0.25;
    expect(short).toBeGreaterThan(0);
    expect(short).toBeLessThan(5);
    // the left main itself is significant by either threshold
    expect(t.significance).toMatchObject({ expected: "significant", greyZone: false });
  });

  it("after stenting the segments are judged against 5, 6, 7 and 8 mm²", () => {
    const t = planTruth(l, "IVUS");
    const r = deploy(l, initialState(), { diameter: 3.5, lengthMm: 18, proxEdge: t.landingProxMm - 2, atm: 12 }, [{ diameter: 5.0, atm: 14, where: "proximal" }], "IVUS");
    const seg = lmSegmentCheck(l, r)!;
    expect(seg.map((s) => [s.id, s.targetMm2])).toEqual([
      ["lm", 8],
      ["poc", 7],
      ["ladOstium", 6],
      ["lcxOstium", 5],
    ]);
    // the jailed circumflex ostium is not treated on the bench and stays below its target
    expect(seg.find((s) => s.id === "lcxOstium")).toMatchObject({ ok: false, basis: "native" });
    expect(seg.find((s) => s.id === "lm")!.basis).toBe("stent");
    expect(lmSegmentCheck(L("focal-lad"), r)).toBeNull();
  });
});

describe("the presets keep the geometry consistent", () => {
  it("frames match the bench's lumen() and eem() on vessel frames of every preset and branch", () => {
    for (const l of MEASURE_LESIONS)
      for (const p of benchPullbacks(l)) {
        const g = p.id === "main" ? l : { ...l, ...(l.branches?.find((b) => b.id === p.id)?.geometry ?? {}) };
        for (let x = l.ostial ? l.ostial.aortaMm : 0; x <= g.segmentMm; x += g.segmentMm / 10) {
          const f = benchFrameAt(l, x, "IVUS", p.id).frame;
          const want = (Math.PI * lumen(g, x) ** 2) / 4;
          expect(Math.abs(f.areas.lumen - want) / want, `${l.id} ${p.id} ${x}`).toBeLessThan(0.02);
          expect(Math.abs(f.areas.eem - (Math.PI * eem(g, x) ** 2) / 4) / f.areas.eem).toBeLessThan(0.02);
        }
      }
  });
});

describe("the measuring tools' geometry", () => {
  it("polygon area, mean diameter, arc and snapping", () => {
    // a unit square, and a 72-gon of radius 1.5 mm close to the circle's area
    expect(polygonAreaMm2([[0, 0], [1, 0], [1, 1], [0, 1]])).toBeCloseTo(1, 10);
    const r = Array.from({ length: 72 }, () => 1.5);
    const pts = r.map((rr, i) => [rr * Math.cos((2 * Math.PI * i) / 72), rr * Math.sin((2 * Math.PI * i) / 72)] as const);
    expect(polygonAreaMm2(pts)).toBeCloseTo(polarArea(r), 6);
    expect(meanDiameterMm(Math.PI)).toBeCloseTo(2, 10);
    expect(arcDegBetween([1, 0], [0, 1])).toBeCloseTo(90, 6);
    expect(arcDegBetween([0, 1], [1, 0])).toBeCloseTo(270, 6);
    expect(snapMm(12.1)).toBe(12);
    expect(snapMm(12.13)).toBe(12.25);
    expect(snapMm(12.3, [12.6])).toBe(12.6);
    expect(snapMm(12.3, [13.0])).toBe(12.25);
  });
});

describe("left main MSA target by segment", () => {
  it("an ostial left main stent is judged against the proximal left main target, a distal one against the distal", () => {
    const ostial = L("ostial-lm-ivus");
    expect(benchLeftMainSegment(ostial)).toBe("proximal");
    for (const modality of ["IVUS", "OCT"] as const) {
      const r = deploy(ostial, initialState(), { diameter: 4.5, lengthMm: 12, proxEdge: 3, atm: 12 }, [], modality);
      const msa = r.criteria.find((c) => c.label.startsWith("MSA"))!;
      expect(msa.label).toContain("MSA > 8 mm²");
      expect(msa.label).toContain("proximal left main");
      expect(benchMsaTarget(ostial, modality)).toBe(8);
    }
    for (const id of ["distal-lm", "distal-lm-two-branch"]) {
      const l = L(id);
      expect(benchLeftMainSegment(l)).toBe("distal");
      expect(benchMsaTarget(l, "IVUS")).toBe(7);
    }
    expect(benchLeftMainSegment(L("focal-lad"))).toBeUndefined();
  });
});
