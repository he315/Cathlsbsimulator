import { describe, expect, it } from "vitest";
import { deflate, inflate, ivusAt, ivusContext, ivusReport, loadDevice, loadIvus, moveDevice, removeDevice, startIvus, stepPci, advanceDevice } from "../angioPci";
import { eemMeasurable, ivusFrame, ivusSummary, polarArea, startPullback, stepPullback, MP_IVUS_EEM_HIDDEN_ARC_DEG, MP_PULLBACK_MM_S, type IvusContext } from "./ivus";
import { setup, start, wireToTarget } from "./testSetup";
import { deployStent } from "./stentGeometry";
import {
  BENCH_BY_ID,
  BENCH_LESIONS,
  MP_BENCH_LCX_OSTIUM,
  STENT_DIAMETERS,
  STENT_LENGTHS,
  applyPrep,
  area,
  benchIvusContext,
  deploy,
  eem,
  initialState,
  lumen,
  preImaging,
  type BenchLesion,
  type BenchState,
  type PostDil,
  type PrepAction,
  type Stent,
} from "../pciBench";

describe("IVUS from the same lumen and plaque", () => {
  it("the lesion frame has the minimal lumen, a high plaque burden and the calcium arc; reference frames do not", () => {
    const su = setup("rca-calcified");
    const st = wireToTarget(su, start(su));
    const L = su.g.lesion;
    const atLesion = ivusAt(su.s, su.g, st, su.tree, L.centreMm);
    const ref = ivusAt(su.s, su.g, st, su.tree, L.endMm + 8);
    expect(atLesion.areas.lumen).toBeLessThan(0.3 * ref.areas.lumen);
    expect(atLesion.areas.plaqueBurden).toBeGreaterThan(0.7);
    expect(ref.areas.plaqueBurden).toBeLessThan(0.5);
    expect(atLesion.calcium).not.toBeNull();
    expect(ref.calcium).toBeNull();
    expect((atLesion.calcium!.to - atLesion.calcium!.from) * (180 / Math.PI)).toBeGreaterThan(180);
    // the lumen outline area matches the angiographic lumen (same radius)
    const ctx = ivusContext(su.s, su.g, st, su.tree);
    expect(Math.sqrt(atLesion.areas.lumen / Math.PI)).toBeCloseTo(ctx.lumenR(L.centreMm), 1);
  });

  it("after stenting, frames show the struts, the stent area and the expansion; an under-expanded stent fails the 80% rule", () => {
    const su = setup("rca-calcified");
    let st = wireToTarget(su, start(su));
    const ref = su.g.lesion.refDiameter;
    st = loadDevice(st, "stent", "semi-compliant", 3.0, 23);
    st = moveDevice(st, su.g.lesion.centreMm - st.device!.centreMm);
    st = removeDevice(deflate(inflate(su.s, su.g, st, 12)));
    const ctx = ivusContext(su.s, su.g, st, su.tree);
    const f = ivusFrame(ctx, su.g.lesion.centreMm);
    expect(f.struts.length).toBeGreaterThan(8);
    expect(f.areas.stent).not.toBeNull();
    const sum = ivusSummary(ctx, su.g.lesion.startMm - 6, su.g.lesion.endMm + 6);
    expect(sum.msa).not.toBeNull();
    expect(sum.expansionPct!).toBeLessThan(80);
    expect(ref).toBeGreaterThan(2.5);
  });

  it("the motorised pullback runs at a constant speed to the guide tip; the transducer is the device on the wire", () => {
    let run = startPullback(60);
    for (let i = 0; i < 400; i++) run = stepPullback(run, 0.1, 0);
    expect(run.mm).toBeCloseTo(60 - 40 * MP_PULLBACK_MM_S, 6);
    for (let i = 0; i < 2000 && run.active; i++) run = stepPullback(run, 0.1, 0);
    expect(run.active).toBe(false);
    expect(run.mm).toBeCloseTo(0, 6);
    // in the lab
    const su = setup("lad-focal");
    let st = loadIvus(wireToTarget(su, start(su), 30));
    for (let i = 0; i < 60; i++) st = advanceDevice(su.s, su.g, st, 2);
    st = startIvus(st);
    expect(st.ivus?.active).toBe(true);
    // the earlier lab's path keeps its pullback speed
    expect(st.ivus!.speed).toBe(MP_PULLBACK_MM_S);
    for (let i = 0; i < 60; i++) st = stepPci(su.s, su.g, st, 1);
    expect(st.device!.centreMm).toBeCloseTo(st.ivus!.mm, 6);
    const rep = ivusReport(su.s, su.g, st, su.tree);
    expect(rep).not.toBeNull();
    expect(rep!.mla).toBeLessThan(2);
  });

  it("polar area of a circle is πr²", () => {
    expect(polarArea(new Array(360).fill(2))).toBeCloseTo(Math.PI * 4, 2);
  });
});

describe("one frame generator for the bench and the PCI lab", () => {
  it("for each bench lesion, lumen and EEM areas at 10 positions match pciBench lumen() and eem() within 2%", () => {
    for (const l of BENCH_LESIONS) {
      const ctx = benchIvusContext(l);
      for (let i = 0; i < 10; i++) {
        const x = (l.segmentMm * (i + 0.5)) / 10;
        const f = ivusFrame(ctx, x);
        expect(Math.abs(f.areas.lumen / area(lumen(l, x)) - 1), `${l.id} lumen at ${x}`).toBeLessThan(0.02);
        expect(Math.abs(f.areas.eem / area(eem(l, x)) - 1), `${l.id} EEM at ${x}`).toBeLessThan(0.02);
      }
    }
  });

  it("OCT frames report the calcium thickness and IVUS frames null (acoustic shadow)", () => {
    const l = BENCH_BY_ID["calcified-rca"];
    const x = l.calcium!.startMm + l.calcium!.lengthMm / 2;
    const oct = ivusFrame(benchIvusContext(l, null, null, "OCT"), x);
    const ivus = ivusFrame(benchIvusContext(l, null, null, "IVUS"), x);
    expect(oct.modality).toBe("OCT");
    expect(oct.calcium?.thicknessMm).toBeGreaterThan(0.5);
    expect(oct.calcium!.thicknessMm!).toBeLessThanOrEqual(l.calcium!.thicknessMm);
    expect(ivus.calcium).not.toBeNull();
    expect(ivus.calcium!.thicknessMm).toBeNull();
    expect(ivus.calcium!.arcDeg).toBeGreaterThan(180);
    // no calcium outside the deposit
    expect(ivusFrame(benchIvusContext(l, null, null, "OCT"), 2).calcium).toBeNull();
  });

  it("the PCI lab's calcium grade maps onto a deposit: OCT measures the graded thickness, IVUS does not", () => {
    const su = setup("rca-calcified");
    const st = wireToTarget(su, start(su));
    const ctx = ivusContext(su.s, su.g, st, su.tree);
    const mm = su.g.lesion.centreMm;
    expect(ivusFrame(ctx, mm).calcium!.thicknessMm).toBeNull();
    const oct = ivusFrame({ ...ctx, modality: "OCT" }, mm);
    expect(oct.calcium!.thicknessMm).toBeGreaterThan(0);
  });

  it("the bench pullback summary agrees with preImaging, and a deployed stent's frames carry struts and the shared criteria", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const pre = preImaging(l, "IVUS");
    const sum0 = ivusSummary(benchIvusContext(l), 0, l.segmentMm);
    expect(Math.abs(sum0.mla / pre.mla - 1)).toBeLessThan(0.03);
    expect(Math.abs(sum0.mlaAt - pre.mlaAt)).toBeLessThanOrEqual(0.5);
    expect(sum0.criteria).toBeNull();
    const r = deploy(l, initialState(), { diameter: 3.0, lengthMm: 18, proxEdge: pre.landingProx - 1, atm: 12 }, [{ diameter: 3.25, atm: 18, where: "full" }], "IVUS");
    const ctx = benchIvusContext(l, initialState(), r, "IVUS");
    const f = ivusFrame(ctx, (r.x0 + r.x1) / 2);
    expect(f.struts.length).toBeGreaterThan(8);
    expect(f.stentLayers).toBe(1);
    expect(f.areas.stent).not.toBeNull();
    const sum = ivusSummary(ctx, 0, l.segmentMm);
    expect(sum.criteria?.map((c) => c.id)).toEqual(["expansion", "msa", "malapposition", "edge-plaque-burden"]);
  });

  it("a dissection the bench caused shows as a flap beside the stent edge that caused it", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const r = deploy(l, initialState(), { diameter: 3.5, lengthMm: 8, proxEdge: 17, atm: 16 }, [], "IVUS");
    const edge = r.events.find((e) => e.kind === "dissection" && e.where === "prox-edge");
    expect(edge).toBeDefined();
    const ctx = benchIvusContext(l, initialState(), r, "IVUS");
    expect(ivusFrame(ctx, r.x0 - 1).flap).not.toBeNull();
    expect(ivusFrame(ctx, 2).flap).toBeNull();
  });
});


/** A standard imaging-guided plan for a bench lesion (prepared, sized to the distal reference, post-dilated) and the same stent with no preparation or post-dilatation. */
function plans(l: BenchLesion): { name: string; st: BenchState; stent: Stent; post: PostDil[] }[] {
  const p = preImaging(l, "IVUS");
  const d = STENT_DIAMETERS.filter((x) => x <= p.distRefLumen + 0.25).pop()!;
  const len = STENT_LENGTHS.find((x) => x >= p.landingDist - p.landingProx + 2) ?? STENT_LENGTHS[STENT_LENGTHS.length - 1];
  const stent = { diameter: d, lengthMm: len, proxEdge: Math.max(0, p.landingProx - 1), atm: 12 };
  const prep: PrepAction[] = l.calcium
    ? [
        { kind: "ivl", diameter: 3.5, cycles: 6 },
        { kind: "balloon", balloon: "non-compliant", diameter: 3.5, atm: 18 },
      ]
    : [{ kind: "balloon", balloon: "semi-compliant", diameter: 2.5, atm: 10 }];
  return [
    { name: "standard", st: prep.reduce((s, a) => applyPrep(l, s, a), initialState()), stent, post: [{ diameter: d + 0.25, atm: 18, where: "full" }] },
    { name: "unprepared", st: initialState(), stent, post: [] },
  ];
}

describe("the bench's verdict and its frames agree", () => {
  const cases: [BenchLesion, ReturnType<typeof plans>[number]][] = BENCH_LESIONS.flatMap((l) => plans(l).map((p) => [l, p] as [BenchLesion, ReturnType<typeof plans>[number]]));
  // the plans the review measured: calcium not modified, proximal optimisation in the left main, no post-dilatation
  const rca = BENCH_BY_ID["calcified-rca"],
    lm = BENCH_BY_ID["distal-lm"],
    lad = BENCH_BY_ID["focal-lad"];
  cases.push([rca, { name: "nc-only", st: applyPrep(rca, initialState(), { kind: "balloon", balloon: "non-compliant", diameter: 3.0, atm: 14 }), stent: { diameter: 3.5, lengthMm: 23, proxEdge: 9, atm: 14 }, post: [{ diameter: 3.75, atm: 20, where: "full" }] }]);
  cases.push([
    lm,
    {
      name: "pot",
      st: applyPrep(lm, initialState(), { kind: "balloon", balloon: "semi-compliant", diameter: 3.0, atm: 10 }),
      stent: { diameter: 3.5, lengthMm: 20, proxEdge: 2, atm: 12 },
      post: [
        { diameter: 3.75, atm: 18, where: "full" },
        { diameter: 5.0, atm: 14, where: "proximal" },
      ],
    },
  ]);
  cases.push([lad, { name: "no-post", st: initialState(), stent: { diameter: 3.0, lengthMm: 18, proxEdge: 11, atm: 12 }, post: [] }]);

  it.each(cases.map(([l, p]) => [`${l.id} ${p.name}`, l, p] as const))("%s: malapposition, MSA and every criterion verdict", (_n, l, p) => {
    for (const modality of ["IVUS", "OCT"] as const) {
      const r = deploy(l, p.st, p.stent, p.post, modality);
      const ctx = benchIvusContext(l, p.st, r, modality);
      let gap = 0,
        msa = Infinity;
      for (let x = 0; x <= l.segmentMm + 1e-9; x += 0.25) {
        const f = ivusFrame(ctx, x);
        if (f.areas.stent === null) continue;
        msa = Math.min(msa, f.areas.stent);
        for (const s of f.struts) gap = Math.max(gap, s.gapMm);
      }
      expect(Math.abs(gap - r.maxMalapposition), "malapposition").toBeLessThan(0.05);
      expect(Math.abs(msa / r.msa - 1), "MSA").toBeLessThan(0.02);
      const sum = ivusSummary(ctx, 0, l.segmentMm, { leftMain: l.leftMain, expansion: "halves" });
      // expansion (halves), MSA, malapposition and edge plaque burden: the same verdicts and labels
      expect(sum.criteria!.map((c) => [c.label, c.ok])).toEqual(r.criteria.slice(0, 4).map((c) => [c.label, c.ok]));
    }
  });

  it("struts sit on a circle about the native lumen's centre: an apposed stent has no gap on the thin side of the plaque", () => {
    const l = BENCH_BY_ID["calcified-rca"];
    const [std] = plans(l);
    const r = deploy(l, std.st, std.stent, std.post, "IVUS");
    const f = ivusFrame(benchIvusContext(l, std.st, r, "IVUS"), (r.x0 + r.x1) / 2);
    expect(f.struts.length).toBeGreaterThan(8);
    expect(Math.max(...f.struts.map((s) => s.gapMm))).toBeLessThan(0.05);
    // the struts are on the stented lumen outline
    const n = f.lumen.length;
    const lumenAt = (th: number) => {
      const u = ((((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) * n) / (2 * Math.PI);
      const i = Math.floor(u) % n;
      return f.lumen[i] * (1 - (u - Math.floor(u))) + f.lumen[(i + 1) % n] * (u - Math.floor(u));
    };
    for (const s of f.struts) expect(Math.abs(s.r - lumenAt(s.theta))).toBeLessThan(0.03);
  });

  it("long-taper: a stent run past the segment end shows, at each position, the diameter deploy() gives there", () => {
    const l = BENCH_BY_ID["long-taper"];
    const r = deploy(l, initialState(), { diameter: 3.0, lengthMm: 38, proxEdge: 20, atm: 12 }, [{ diameter: 3.5, atm: 18, where: "proximal" }], "IVUS");
    expect(r.x1).toBe(l.segmentMm);
    const ctx = benchIvusContext(l, initialState(), r, "IVUS");
    for (const x of [21, 25, 29]) {
      const f = ivusFrame(ctx, x);
      const p = r.profile.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
      expect(Math.abs(f.areas.stent! / area(p.d) - 1), `stent area at ${x} mm`).toBeLessThan(0.03);
    }
  });
});

describe("frames: layers, side branches and what OCT can see", () => {
  it("with two overlapping layers the lumen is the larger ring and both layers' struts are drawn", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const base = benchIvusContext(l);
    const outer = deployStent(3.5, 18, () => 3.6, () => 2.8);
    const inner = deployStent(3.0, 18, () => 3.0, () => 2.8);
    const ctx: IvusContext = {
      ...base,
      stents: [
        { fromMm: 12, toMm: 30, geom: outer },
        { fromMm: 14, toMm: 32, geom: inner },
      ],
    };
    const f = ivusFrame(ctx, 21);
    expect(f.stentLayers).toBe(2);
    expect(f.areas.stent!).toBeCloseTo(Math.PI * 1.8 * 1.8, 6);
    expect(new Set(f.struts.map((s) => s.layer))).toEqual(new Set([0, 1]));
    // the inner layer stands off the outer one; the outer is on the wall
    const gapOf = (layer: number) => Math.max(...f.struts.filter((s) => s.layer === layer).map((s) => s.gapMm));
    expect(gapOf(1)).toBeCloseTo(0.3, 6);
    expect(gapOf(0)).toBe(0);
  });

  it("the distal left main pullback passes the circumflex ostium; other bench frames have no side branch", () => {
    const l = BENCH_BY_ID["distal-lm"];
    const f = ivusFrame(benchIvusContext(l), MP_BENCH_LCX_OSTIUM.atMm);
    expect(f.sideBranch).not.toBeNull();
    expect(f.sideBranch!.theta).toBeCloseTo(MP_BENCH_LCX_OSTIUM.angle, 6);
    expect(f.sideBranch!.halfWidth).toBeGreaterThan(0.2);
    expect(ivusFrame(benchIvusContext(l), 25).sideBranch).toBeNull();
    expect(ivusFrame(benchIvusContext(BENCH_BY_ID["focal-lad"]), 21).sideBranch).toBeNull();
  });

  it("OCT cannot measure the EEM behind a lipid pool; IVUS can, and OCT can in a fibrous lesion", () => {
    const lip = BENCH_BY_ID["lipid-acs"];
    const x = (lip.startMm + lip.endMm) / 2;
    expect(eemMeasurable(ivusFrame(benchIvusContext(lip, null, null, "OCT"), x))).toBe(false);
    expect(eemMeasurable(ivusFrame(benchIvusContext(lip, null, null, "IVUS"), x))).toBe(true);
    const lad = BENCH_BY_ID["focal-lad"];
    expect(eemMeasurable(ivusFrame(benchIvusContext(lad, null, null, "OCT"), 21))).toBe(true);
    expect(eemMeasurable(ivusFrame(benchIvusContext(lad, null, null, "OCT"), 2))).toBe(true);
  });

  it("IVUS does not show the EEM behind a calcium arc wider than half the circumference; the reference frames still do", () => {
    const rca = BENCH_BY_ID["calcified-rca"];
    const f = ivusFrame(benchIvusContext(rca, null, null, "IVUS"), 20);
    expect(f.calcium!.arcDeg).toBeGreaterThan(MP_IVUS_EEM_HIDDEN_ARC_DEG);
    expect(eemMeasurable(f)).toBe(false);
    // the reference frames used for sizing have no calcium, so their EEM is measurable
    expect(eemMeasurable(ivusFrame(benchIvusContext(rca, null, null, "IVUS"), 0))).toBe(true);
    expect(eemMeasurable(ivusFrame(benchIvusContext(rca, null, null, "IVUS"), rca.segmentMm))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// pci-intravascular-imaging: the in-lab acquisition
//   npx vitest run src/simulation/pci/ivus.test.ts
// ---------------------------------------------------------------------------

import {
  advanceImaging,
  armOct,
  calibrateImaging,
  clearViewImaging,
  holdImaging,
  imagingFrameAt,
  imagingDebrief,
  flushPsi,
  lesionPrepared,
  loadImaging,
  octFlush,
  purgeImaging,
  recordAssessment,
  recordCalciumRule,
  setImagingSettings,
  startImagingRun,
} from "./actions/imaging";
import { MAX_HAND_PRESSURE_PSI } from "../injection";
import {
  MP_FORCE_KINK_PUSHES,
  OCT_FLUSH_MIN_ML_S,
  OCT_MODES,
  acquisitionArtefacts,
  assessedUnderexpanded,
  nextStepFor,
  octFlushOutcome,
  octVolumeNeeded,
} from "./ivus";

/** A balloon inflated on the lesion and taken out (predilatation, a stent, a post-dilatation). */
function dilate(su: ReturnType<typeof setup>, st0: ReturnType<typeof start>, kind: "balloon" | "stent", balloon: "semi-compliant" | "non-compliant", d: number, len: number, atm: number) {
  let st = loadDevice(st0, kind, balloon, d, len);
  st = moveDevice(st, su.g.lesion.centreMm - st.device!.centreMm);
  return removeDevice(deflate(inflate(su.s, su.g, st, atm)));
}

/** Push the imaging catheter by hand until it stops or reaches `toMm`. */
function pushTo(su: ReturnType<typeof setup>, st0: ReturnType<typeof start>, toMm: number) {
  let st = st0;
  for (let i = 0; i < 200 && st.device!.centreMm < toMm; i++) {
    const before = st.device!.centreMm;
    st = advanceImaging(su.s, su.g, st, 2);
    if (st.device!.centreMm <= before + 1e-6) break;
  }
  return st;
}

describe("in-lab acquisition (pci-intravascular-imaging)", () => {
  it("an OCT frame with a flush volume below the threshold is flagged blood-filled; an adequate flush clears the run", () => {
    // the rule itself: rate and duration against the side's minimum and the run length
    const short = octFlushOutcome({ rateMlS: 4, durationS: 1, injector: true, french: 6, side: "left" }, "survey");
    expect(short.volumeMl).toBeLessThan(octVolumeNeeded("left", "survey"));
    expect(short.triggered).toBe(true);
    expect(short.clearS).toBeLessThan(OCT_MODES.survey.durationS);
    const slow = octFlushOutcome({ rateMlS: 2, durationS: 4, injector: true, french: 6, side: "left" }, "survey");
    expect(slow.triggered).toBe(false);
    // a hand injection through a 5 Fr guide cannot reach the rate that clears the left system; 6 Fr can
    expect(octFlushOutcome({ rateMlS: 4, durationS: 4, injector: false, french: 5, side: "left" }, "survey").triggered).toBe(false);
    expect(octFlushOutcome({ rateMlS: 4, durationS: 4, injector: false, french: 6, side: "left" }, "survey").triggered).toBe(true);
    expect(octFlushOutcome({ rateMlS: 4, durationS: 4, injector: true, french: 5, side: "left" }, "survey").triggered).toBe(true);

    // in the lab: lad-focal, predilated so the catheter crosses, OCT purged and calibrated
    const su = setup("lad-focal");
    let st = wireToTarget(su, start(su), 40);
    st = dilate(su, st, "balloon", "semi-compliant", 2.5, 12, 10);
    st = loadImaging(st, "oct");
    st = calibrateImaging(purgeImaging(purgeImaging(st, "start"), "end"));
    st = pushTo(su, st, su.g.lesion.endMm + 20);
    expect(st.device!.centreMm).toBeGreaterThan(su.g.lesion.endMm);
    // the left hand holds the catheter and wire for the flush
    st = holdImaging(st, true);
    const runFrom = st.device!.centreMm;
    // too little contrast: 4 mL/s for 1 s in the left system
    let low = armOct(st);
    const ml0 = low.contrastMl;
    low = octFlush(su.s, su.g, low, { rateMlS: 4, durationS: 1, injector: true });
    expect(low.contrastMl).toBeCloseTo(ml0 + 4, 6);
    expect(low.ivus!.active).toBe(true);
    const far = runFrom - 40; // 40 mm into a survey run is about 1.1 s, beyond the 0.5 s of clear lumen
    expect(imagingFrameAt(su.s, su.g, low, su.tree, far).artefacts!.blood).toBe(true);
    // the typical left setting clears the run
    let good = armOct(st);
    good = octFlush(su.s, su.g, good, { rateMlS: OCT_FLUSH_MIN_ML_S.left, durationS: 4, injector: true });
    expect(imagingFrameAt(su.s, su.g, good, su.tree, far).artefacts!.blood).toBe(false);
    expect(imagingFrameAt(su.s, su.g, good, su.tree, far).modality).toBe("OCT");
    // a rate that does not clear the lumen does not trigger the run
    let none = armOct(st);
    none = octFlush(su.s, su.g, none, { rateMlS: 2, durationS: 4, injector: true });
    expect(none.ivus!.active).toBe(false);
    expect(none.events[none.events.length - 1].text).toMatch(/did not clear/);
    // the run is stepped by the procedure clock and ends after the mode's length
    for (let i = 0; i < 40; i++) good = stepPci(su.s, su.g, good, 0.25);
    expect(good.ivus!.active).toBe(false);
    expect(good.ivus!.mm).toBeCloseTo(Math.max(0, runFrom - OCT_MODES.survey.lengthMm), 6);
    // not held, a forceful flush drives the catheter and the wire forward
    const loose = octFlush(su.s, su.g, armOct(holdImaging(st, false)), { rateMlS: 4, durationS: 4, injector: true });
    expect(loose.ivus!.startMm).toBeGreaterThan(runFrom + 1);
    expect(loose.log.some((r) => r.kind === "imaging-migration")).toBe(true);
  });

  it("a phased-array catheter taken through without clear view shows ring-down; clear view in a roomy segment removes it", () => {
    const su = setup("lad-focal");
    let st = wireToTarget(su, start(su), 40);
    st = dilate(su, st, "balloon", "semi-compliant", 2.5, 12, 10);
    st = loadImaging(st, "ivus-phased");
    const crossed = pushTo(su, st, su.g.lesion.endMm + 15);
    expect(crossed.device!.centreMm).toBeGreaterThan(su.g.lesion.endMm);
    const runA = startImagingRun(su.s, su.g, crossed);
    const fA = imagingFrameAt(su.s, su.g, runA, su.tree, su.g.lesion.centreMm);
    expect(fA.artefacts!.ringDown).toBe(true);
    // pressing it in the lesion does not help
    const inLesion = { ...crossed, device: { ...crossed.device!, centreMm: su.g.lesion.centreMm } };
    expect(clearViewImaging(su.s, su.g, inLesion).ivus!.acq!.clearView).toBe(false);
    // at the root (still in the guide) it works
    const cv = clearViewImaging(su.s, su.g, st);
    expect(cv.ivus!.acq!.clearView).toBe(true);
    const runB = startImagingRun(su.s, su.g, pushTo(su, cv, su.g.lesion.endMm + 15));
    expect(imagingFrameAt(su.s, su.g, runB, su.tree, su.g.lesion.centreMm).artefacts!.ringDown).toBe(false);
    // with a stent in, a fast phased-array pullback jumps across the struts; a slow one does not
    let stented = removeDevice(runB);
    stented = dilate(su, stented, "stent", "semi-compliant", 3.0, 18, 14);
    stented = pushTo(su, clearViewImaging(su.s, su.g, loadImaging(stented, "ivus-phased")), su.g.lesion.endMm + 15);
    const fast = startImagingRun(su.s, su.g, setImagingSettings(stented, { speedMmS: 1 }));
    expect(fast.ivus!.acq!.jumps.length).toBeGreaterThan(0);
    expect(startImagingRun(su.s, su.g, setImagingSettings(stented, { speedMmS: 0.5 })).ivus!.acq!.jumps.length).toBe(0);
    // the debrief names the missing clear view
    expect(imagingDebrief(su.s, su.g, runA, su.tree).find((i) => i.id === "clear-view")?.ok).toBe(false);
  });

  it("a tight calcified lesion stops the catheter until it is predilated; forcing it kinks it", () => {
    const su = setup("rca-calcified");
    let st = wireToTarget(su, start(su));
    st = loadImaging(st, "ivus");
    st = pushTo(su, st, su.g.lesion.endMm + 10);
    expect(st.device!.centreMm).toBeLessThan(su.g.lesion.endMm);
    expect(st.ivus!.acq!.stoppedAtMm).not.toBeNull();
    let forced = st;
    for (let i = 0; i < MP_FORCE_KINK_PUSHES; i++) forced = advanceImaging(su.s, su.g, forced, 2);
    expect(forced.ivus!.acq!.kinked).toBe(true);
    expect(acquisitionArtefacts(forced.ivus!, su.g.lesion.centreMm).noImage).toBe(true);
    // a tight non-calcified lesion stops it too; predilated, a fresh catheter crosses
    const lad = setup("lad-focal");
    const w = wireToTarget(lad, start(lad), 40);
    expect(pushTo(lad, loadImaging(w, "ivus"), lad.g.lesion.endMm + 10).device!.centreMm).toBeLessThan(lad.g.lesion.endMm);
    const pre = pushTo(lad, loadImaging(dilate(lad, w, "balloon", "semi-compliant", 2.5, 12, 10), "ivus"), lad.g.lesion.endMm + 10);
    expect(pre.device!.centreMm).toBeGreaterThan(lad.g.lesion.endMm);
  });

  it("after a 3.0 stent at 10 atm in rca-calcified the MSA is below 80% of the reference; after a non-compliant 3.5 at 20 atm it rises", () => {
    const su = setup("rca-calcified");
    const L = su.g.lesion;
    let st = wireToTarget(su, start(su));
    st = dilate(su, st, "stent", "semi-compliant", 3.0, 23, 10);
    const runOf = (x: typeof st) => {
      let y = pushTo(su, loadImaging(x, "ivus", { assisted: true }), L.endMm + 12);
      expect(y.device!.centreMm).toBeGreaterThan(L.endMm);
      y = startImagingRun(su.s, su.g, setImagingSettings(y, { speedMmS: 10 }));
      for (let i = 0; i < 400 && y.ivus!.active; i++) y = stepPci(su.s, su.g, y, 0.25);
      return y;
    };
    const a = runOf(st);
    const ctx = ivusContext(su.s, su.g, a, su.tree);
    const sumA = ivusSummary(ctx, L.startMm - 8, L.endMm + 8);
    const refArea = (Math.PI * (sumA.proxRefLumen / 2) ** 2 + Math.PI * (sumA.distRefLumen / 2) ** 2) / 2;
    expect(sumA.msa!).toBeLessThan(0.8 * refArea);
    expect(ivusReport(su.s, su.g, a, su.tree)!.msa!).toBeLessThan(0.8 * refArea);
    // post-dilate with a non-compliant 3.5 at 20 atm, then image again
    let b = removeDevice(a);
    b = dilate(su, b, "balloon", "non-compliant", 3.5, 12, 20);
    const bb = runOf(b);
    const sumB = ivusSummary(ivusContext(su.s, su.g, bb, su.tree), L.startMm - 8, L.endMm + 8);
    expect(sumB.msa!).toBeGreaterThan(sumA.msa! * 1.5);
    expect(ivusReport(su.s, su.g, bb, su.tree)!.msa!).toBeGreaterThan(sumA.msa!);
  });

  it("the trainee's own numbers decide the next step; the debrief sets them beside the truth", () => {
    const base = { t: 0, modality: "IVUS" as const, postStent: true };
    const under = { ...base, msaMm2: 3.9, proxRefMm2: 6.4, distRefMm2: 5.6 };
    expect(assessedUnderexpanded(under)).toBe(true);
    expect(nextStepFor(under, 3.0).id).toBe("nc-postdilate");
    expect(nextStepFor(under, 3.0).text).toMatch(/18 atm/);
    const edge = { ...base, msaMm2: 6.5, proxRefMm2: 7, distRefMm2: 6, edgeDissection: { edge: "distal" as const, arcDeg: 90, lengthMm: 4 } };
    expect(nextStepFor(edge, 3.0).id).toBe("extra-stent");
    const small = { ...edge, edgeDissection: { edge: "distal" as const, arcDeg: 30, lengthMm: 1 } };
    expect(nextStepFor(small, 3.0).id).toBe("leave");
    const mal = { ...base, msaMm2: 6.5, proxRefMm2: 7, distRefMm2: 6, malappositionMm: 0.45 };
    expect(nextStepFor(mal, 3.0).id).toBe("sc-low-pressure");
    // OCT: the MSA target is 4.5 mm²
    expect(assessedUnderexpanded({ ...base, modality: "OCT", msaMm2: 4.4 })).toBe(true);
    expect(assessedUnderexpanded({ ...base, modality: "OCT", msaMm2: 4.8 })).toBe(false);

    const su = setup("rca-calcified");
    let st = wireToTarget(su, start(su));
    st = dilate(su, st, "stent", "semi-compliant", 3.0, 23, 10);
    st = pushTo(su, loadImaging(st, "ivus", { assisted: true }), su.g.lesion.endMm + 12);
    st = startImagingRun(su.s, su.g, setImagingSettings(st, { speedMmS: 10 }));
    for (let i = 0; i < 400 && st.ivus!.active; i++) st = stepPci(su.s, su.g, st, 0.25);
    const truth = ivusReport(su.s, su.g, st, su.tree)!;
    st = recordAssessment(st, { modality: "IVUS", postStent: true, msaMm2: truth.msa! + 0.2, proxRefMm2: 7, distRefMm2: 5 });
    const items = imagingDebrief(su.s, su.g, st, su.tree);
    expect(items.find((i) => i.id === "msa")?.ok).toBe(true);
    expect(items.find((i) => i.id === "expansion")?.ok).toBe(true);
    expect(items.find((i) => i.id === "nitrate")?.ok).toBe(false);
  });

  it("rca-calcified: a 2.5 or 3.0 mm predilatation lets each imaging catheter cross; the untreated lesion still stops it; an OCT run then covers the lesion", () => {
    const su = setup("rca-calcified");
    const L = su.g.lesion;
    const w = wireToTarget(su, start(su));
    expect(lesionPrepared(su.s, w)).toBe(false);
    for (const id of ["ivus", "ivus-phased", "oct"]) expect(pushTo(su, loadImaging(w, id), L.endMm + 10).device!.centreMm, id).toBeLessThan(L.endMm);
    for (const [b, d, atm] of [["semi-compliant", 2.5, 12], ["non-compliant", 3.0, 14]] as const) {
      const pre = dilate(su, w, "balloon", b, d, 12, atm);
      expect(lesionPrepared(su.s, pre)).toBe(true);
      for (const id of ["ivus", "ivus-phased", "oct"]) expect(pushTo(su, loadImaging(pre, id), L.endMm + 30).device!.centreMm, `${id} after ${d} mm`).toBeGreaterThan(L.endMm);
    }
    // OCT after a 2.5 mm predilatation: purged, calibrated, held, survey run on the typical right-sided flush
    let st = dilate(su, w, "balloon", "semi-compliant", 2.5, 12, 12);
    st = calibrateImaging(purgeImaging(purgeImaging(loadImaging(st, "oct"), "start"), "end"));
    st = holdImaging(pushTo(su, st, L.endMm + 30), true);
    const from = st.device!.centreMm;
    st = octFlush(su.s, su.g, armOct(st), { rateMlS: OCT_FLUSH_MIN_ML_S.right, durationS: 3, injector: true });
    expect(st.ivus!.active).toBe(true);
    for (let i = 0; i < 40 && st.ivus!.active; i++) st = stepPci(su.s, su.g, st, 0.25);
    const rec = st.ivus!.recorded.map((r) => r.mm);
    expect(Math.max(...rec)).toBeCloseTo(from, 6);
    expect(Math.min(...rec)).toBeLessThan(L.startMm);
    const r = st.ivus!.runs![st.ivus!.runs!.length - 1];
    expect(r.beyondLesion).toBe(true);
    expect(r.markerOk).toBe(true);
    expect(r.miscalibrated).toBe(false);
  });

  it("a kinked catheter starts no run and gives no OCT flush run", () => {
    const su = setup("rca-calcified");
    let st = pushTo(su, loadImaging(wireToTarget(su, start(su)), "ivus", { assisted: true }), su.g.lesion.endMm + 10);
    for (let i = 0; i < MP_FORCE_KINK_PUSHES; i++) st = advanceImaging(su.s, su.g, st, 2);
    expect(st.ivus!.acq!.kinked).toBe(true);
    // pulled back into a segment where it could start, the kinked catheter still does not run
    const back = advanceImaging(su.s, su.g, st, -2);
    const n = startImagingRun(su.s, su.g, back);
    expect(n.ivus!.active).toBe(false);
    expect(n.ivus!.runs ?? []).toHaveLength(0);
    expect(n.events[n.events.length - 1].text).toMatch(/kinked/);
    let o = pushTo(su, loadImaging(wireToTarget(su, start(su)), "oct", { assisted: true }), su.g.lesion.endMm + 10);
    for (let i = 0; i < MP_FORCE_KINK_PUSHES; i++) o = advanceImaging(su.s, su.g, o, 2);
    const f = octFlush(su.s, su.g, armOct(o), { rateMlS: 3, durationS: 3, injector: true });
    expect(f.ivus!.active).toBe(false);
    expect(f.contrastMl).toBe(o.contrastMl);
  });

  it("the flush goes through the injection hook at the circuit's pressure; a hand push is capped at the hand's maximum", () => {
    expect(flushPsi(6, 4, false)).toBeLessThanOrEqual(MAX_HAND_PRESSURE_PSI);
    expect(flushPsi(6, 4, true)).toBeGreaterThan(flushPsi(6, 2, true));
    const su = setup("lad-focal");
    let st = dilate(su, wireToTarget(su, start(su), 40), "balloon", "semi-compliant", 2.5, 12, 10);
    st = holdImaging(pushTo(su, loadImaging(st, "oct", { assisted: true }), su.g.lesion.endMm + 20), true);
    const f = octFlush(su.s, su.g, armOct(st), { rateMlS: 4, durationS: 4, injector: true });
    // the complications engine ran (it clones the complication state on every injection)
    expect(f.cx).not.toBe(st.cx);
  });

  it("the debrief judges the expansion verdict by the console's rule, and names the preparation, calibration and the calcium rule", () => {
    const su = setup("rca-calcified");
    let st = wireToTarget(su, start(su));
    st = dilate(su, st, "stent", "semi-compliant", 3.0, 23, 10);
    st = pushTo(su, loadImaging(st, "ivus", { assisted: true }), su.g.lesion.endMm + 12);
    st = startImagingRun(su.s, su.g, setImagingSettings(st, { speedMmS: 10 }));
    for (let i = 0; i < 400 && st.ivus!.active; i++) st = stepPci(su.s, su.g, st, 0.25);
    const truth = ivusReport(su.s, su.g, st, su.tree)!;
    expect(truth.criteria!.find((c) => c.id === "msa")!.ok).toBe(false);
    // an MSA under the absolute target but above 80% of the trainee's references: underexpanded by the absolute rule
    const msa = 5.0;
    const said = { modality: "IVUS" as const, postStent: true, msaMm2: msa, proxRefMm2: 6, distRefMm2: 6 };
    expect(msa).toBeGreaterThan(0.8 * 6);
    expect(assessedUnderexpanded({ t: 0, ...said })).toBe(true);
    expect(imagingDebrief(su.s, su.g, recordAssessment(st, said), su.tree).find((i) => i.id === "expansion")?.ok).toBe(true);
    // exactly 80% of the mean reference fails, as in criteria.ts
    expect(assessedUnderexpanded({ t: 0, modality: "OCT", postStent: true, msaMm2: 8, proxRefMm2: 10, distRefMm2: 10 })).toBe(true);
    // a team-prepared catheter: no preparation error
    expect(imagingDebrief(su.s, su.g, st, su.tree).find((i) => i.id === "prepared")?.ok).toBe(true);

    // an OCT catheter calibrated while purging, run in lad-focal: the calibration item fails; an unflushed IVUS has air
    const lad = setup("lad-focal");
    let o = dilate(lad, wireToTarget(lad, start(lad), 40), "balloon", "semi-compliant", 2.5, 12, 10);
    o = loadImaging(o, "oct");
    o = purgeImaging(calibrateImaging(purgeImaging(o, "start")), "end");
    o = holdImaging(pushTo(lad, o, lad.g.lesion.endMm + 20), true);
    o = octFlush(lad.s, lad.g, armOct(o), { rateMlS: 4, durationS: 4, injector: true });
    const items = imagingDebrief(lad.s, lad.g, o, lad.tree);
    expect(items.find((i) => i.id === "calibration")?.ok).toBe(false);
    expect(items.find((i) => i.id === "oct-marker")).toBeDefined();
    // calibrated while purging, then calibrated again once the purge stopped: the run and the debrief agree with the tools' scale
    let re = dilate(lad, wireToTarget(lad, start(lad), 40), "balloon", "semi-compliant", 2.5, 12, 10);
    re = calibrateImaging(purgeImaging(calibrateImaging(purgeImaging(loadImaging(re, "oct"), "start")), "end"));
    expect(re.ivus!.acq!.calibrated).toBe(true);
    expect(re.ivus!.acq!.calibratedWhilePurging).toBe(false);
    re = holdImaging(pushTo(lad, re, lad.g.lesion.endMm + 20), true);
    re = octFlush(lad.s, lad.g, armOct(re), { rateMlS: 4, durationS: 4, injector: true });
    for (let i = 0; i < 40 && re.ivus!.active; i++) re = stepPci(lad.s, lad.g, re, 0.25);
    expect(re.ivus!.runs!.length).toBeGreaterThan(0);
    expect(re.ivus!.runs![re.ivus!.runs!.length - 1].miscalibrated).toBe(false);
    expect(imagingDebrief(lad.s, lad.g, re, lad.tree).find((i) => i.id === "calibration")?.ok).toBe(true);
    let u =dilate(lad, wireToTarget(lad, start(lad), 40), "balloon", "semi-compliant", 2.5, 12, 10);
    u = startImagingRun(lad.s, lad.g, pushTo(lad, loadImaging(u, "ivus"), lad.g.lesion.endMm + 15));
    expect(imagingDebrief(lad.s, lad.g, u, lad.tree).find((i) => i.id === "prepared")?.ok).toBe(false);

    // the calcium rule answer against the grade 2 calcium on OCT frames (270 degrees, 0.8 mm thick): a score of 4
    const right = recordCalciumRule(st, { arcOver180: true, thicknessOver05: true, lengthOver5: true, modify: true });
    expect(imagingDebrief(su.s, su.g, right, su.tree).find((i) => i.id === "calcium-rule")?.ok).toBe(true);
    const wrong = recordCalciumRule(st, { arcOver180: false, thicknessOver05: true, lengthOver5: true, modify: false });
    expect(imagingDebrief(su.s, su.g, wrong, su.tree).find((i) => i.id === "calcium-rule")?.ok).toBe(false);
  });
});
