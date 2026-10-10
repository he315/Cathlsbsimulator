// Run quality (diag-injection-run-quality): the analysis of one push from its ostial mixing, and of a stored
// cine run from what the lab recorded about it.
//   npx vitest run src/simulation/imaging/runQuality.test.ts
import { describe, expect, it } from "vitest";
import { CASE_LIBRARY } from "../caseGenerator";
import { buildAnatomy } from "../anatomy";
import { buildCoronaryTree } from "../../render/xray/coronaryTree";
import { ostialSeries, transportNet, DEFAULT_SEAT, SIDE_HOLE_ESCAPE, seatWithSideHoles } from "../../render/xray/contrastTransport";
import { LUMENS, planTrace, standardPlan, type InjectionPlan } from "../injection";
import { RUN_QUALITY, analyseInjection, assessRun, lesionView, viewSeparationDeg, type InjectionQuality, type RunQualityInput } from "./runQuality";

const c = CASE_LIBRARY[0];
const tree = buildCoronaryTree(buildAnatomy(c), c);
const net = transportNet(tree, c.lesions);
const RR = 0.8;

/** The analysis of a planned push into the left coronary at a native flow scale (with the washout the session passes: the side's terminal transit at that flow). */
function judge(plan: InjectionPlan, flowScale: number, seat = { capture: 1, seal: DEFAULT_SEAT.seal }): InjectionQuality {
  const trace = planTrace(plan);
  const series = ostialSeries({ net, side: plan.side, trace, phase: 0, rr: RR, flowScale, seat });
  return analyseInjection(series, trace, RR, net.thetaEnd[plan.side] / flowScale);
}

/** A run input around an injection, with every acquisition setting acceptable. */
function runOf(injection: InjectionQuality | null, extra: Partial<RunQualityInput> = {}): RunQualityInput {
  return {
    injection,
    selective: true,
    tip: { kind: "selective-lm", vessel: null },
    pushDelayS: 1.5,
    tailS: 3,
    distalArrivalS: 1.9,
    fps: 15,
    table: { maxSpeedMmS: 0, travelMm: 0 },
    fieldChanged: false,
    breathHeldShare: 1,
    ...extra,
  };
}

// a 3 mL syringe pushed at 1 mL/s until it is empty
const weak: InjectionPlan = { kind: "held", side: "left", catheter: LUMENS["diag-6"], delayS: 0, targetFlow: 1, volumeMl: 3, pushS: 4, primed: 1 };
const firm: InjectionPlan = { kind: "forceful", side: "left", catheter: LUMENS["guide-6"], delayS: 0, volumeMl: 8, pushS: 3, primed: 1 };

describe("one push", () => {
  it("a 3 mL push at 1 mL/s into a high-flow (flowScale 1.8) left system gives a higher streaming index and no reflux than an 8 mL firm push, and is tagged non-diagnostic", () => {
    const w = judge(weak, 1.8);
    const f = judge(firm, 1.8);
    expect(w.volumeMl).toBeCloseTo(3, 1);
    expect(f.volumeMl).toBeCloseTo(8, 1);
    expect(w.meanFlowMlS).toBeLessThan(1.1);
    expect(f.meanFlowMlS).toBeGreaterThan(3 * w.meanFlowMlS);
    expect(w.streamingIndex).toBeGreaterThan(f.streamingIndex);
    expect(w.streaming).toBe(true);
    expect(f.streaming).toBe(false);
    expect(w.reflux).toBe(false);
    expect(w.refluxMl).toBeLessThan(RUN_QUALITY.refluxMinMl);
    expect(f.reflux).toBe(true);
    expect(w.testPuff).toBe(false);
    const q = assessRun(runOf(w));
    expect(q.tags).toEqual(expect.arrayContaining(["streaming", "no-reflux", "non-diagnostic"]));
    expect(q.nonDiagnostic).toBe(true);
    const qf = assessRun(runOf(f));
    expect(qf.tags).not.toContain("streaming");
    expect(qf.tags).not.toContain("no-reflux");
  });

  it("at rest the lab's 6 Fr diagnostic push of 10 mL fills the left coronary for at least 3 beats with reflux; a 5 Fr lumen at the hand's largest force fills it less", () => {
    const six = judge({ kind: "held", side: "left", catheter: LUMENS["diag-6"], delayS: 0, volumeMl: 10, pushS: 4, primed: 1 }, 1);
    expect(six.streaming).toBe(false);
    expect(six.reflux).toBe(true);
    expect(six.beatsOpacified).toBeGreaterThanOrEqual(RUN_QUALITY.beatsMin);
    expect(assessRun(runOf(six)).nonDiagnostic).toBe(false);
    const five = judge({ kind: "forceful", side: "left", catheter: LUMENS["diag-5"], delayS: 0, volumeMl: 10, pushS: 4, primed: 1 }, 1);
    // the hand cannot push more than about 1.4 mL/s through the 5 Fr lumen (facts I1.md)
    expect(five.peakFlowMlS).toBeLessThan(1.6);
    expect(five.streamingIndex).toBeGreaterThan(six.streamingIndex);
  });

  it("side holes let part of the jet escape into the root, so less of it fills the artery", () => {
    const seat = seatWithSideHoles({ capture: 1, seal: DEFAULT_SEAT.seal }, true);
    expect(seat.capture).toBeCloseTo(1 - SIDE_HOLE_ESCAPE, 6);
    expect(seatWithSideHoles({ capture: 0.8, seal: 0.3 }, false)).toEqual({ capture: 0.8, seal: 0.3 });
    const plan: InjectionPlan = { kind: "held", side: "left", catheter: LUMENS["diag-6"], delayS: 0, volumeMl: 8, pushS: 3, primed: 1 };
    const end = judge(plan, 1);
    const sh = judge(plan, 1, seat);
    expect(sh.missedMl).toBeGreaterThan(end.missedMl + 1);
    expect(sh.streamingIndex).toBeGreaterThan(end.streamingIndex);
  });

  it("Oxford's standard volumes through the lab's 6 Fr diagnostic at the keyboard's push fill for at least 3 beats with reflux: about 4 mL right and 7 mL left; the beats include the washout along the artery", () => {
    const right = judge({ kind: "held", side: "right", catheter: LUMENS["diag-6"], delayS: 0, volumeMl: 4, pushS: 4, primed: 1 }, 1);
    const left = judge({ kind: "held", side: "left", catheter: LUMENS["diag-6"], delayS: 0, volumeMl: 7, pushS: 4, primed: 1 }, 1);
    for (const q of [right, left]) {
      expect(q.streaming).toBe(false);
      expect(q.reflux).toBe(true);
      expect(q.beatsOpacified).toBeGreaterThanOrEqual(RUN_QUALITY.beatsMin);
      expect(assessRun(runOf(q)).nonDiagnostic).toBe(false);
    }
    // without the washout the count is the inlet alone, which a 4 mL push cannot hold for 3 beats
    const trace = planTrace({ kind: "held", side: "right", catheter: LUMENS["diag-6"], delayS: 0, volumeMl: 4, pushS: 4, primed: 1 });
    const inletOnly = analyseInjection(ostialSeries({ net, side: "right", trace, phase: 0, rr: RR, flowScale: 1, seat: { capture: 1, seal: DEFAULT_SEAT.seal } }), trace, RR);
    expect(right.opacifiedS - inletOnly.opacifiedS).toBeCloseTo(net.thetaEnd.right, 6);
    expect(inletOnly.beatsOpacified).toBeLessThan(RUN_QUALITY.beatsMin);
  });

  it("a push under 3 mL is a test puff, recorded and not judged as a run", () => {
    const puff = judge({ ...standardPlan("left", LUMENS["diag-6"]), kind: "puff", delayS: 0, primed: 1 }, 1);
    expect(puff.volumeMl).toBeLessThan(RUN_QUALITY.testPuffMl);
    expect(puff.testPuff).toBe(true);
    const q = assessRun(runOf(puff));
    expect(q.tags).toContain("test-puff");
    expect(q.tags).not.toContain("non-diagnostic");
    expect(q.qfr.applicable).toBe(false);
  });
});

describe("one stored run", () => {
  const good = judge({ kind: "held", side: "left", catheter: LUMENS["diag-6"], delayS: 0, volumeMl: 10, pushS: 4, primed: 1 }, 1);
  const lesion = (extra: Partial<NonNullable<RunQualityInput["lesion"]>> = {}): RunQualityInput["lesion"] => ({
    vessel: "LAD",
    severityPct: 60,
    view: { foreshortening: 0.95, overlap: false, axis: { x: 0, y: 0, z: -1 } },
    nitrate: true,
    pairSeparationDeg: 40,
    ...extra,
  });

  it("a well-acquired run of an intermediate lesion meets every QFR criterion", () => {
    const q = assessRun(runOf(good, { lesion: lesion() }));
    expect(q.qfr.applicable).toBe(true);
    expect(q.qfr.criteria.map((x) => x.id)).toEqual(["nitrate", "frame-rate", "no-panning", "no-zoom", "brisk-injection", "foreshortening", "overlap", "second-projection"]);
    expect(q.qfr.criteria.filter((x) => !x.ok)).toEqual([]);
    expect(q.qfr.ok).toBe(true);
    expect(q.tags).toContain("qfr-suitable");
    expect(q.nonDiagnostic).toBe(false);
  });

  it("a run with table velocity above threshold during cine is tagged panned and fails the QFR check", () => {
    const q = assessRun(runOf(good, { lesion: lesion(), table: { maxSpeedMmS: RUN_QUALITY.panSpeedMmS + 10, travelMm: 12 } }));
    expect(q.tags).toContain("panned");
    expect(q.qfr.ok).toBe(false);
    expect(q.qfr.criteria.find((x) => x.id === "no-panning")!.ok).toBe(false);
    expect(q.tags).not.toContain("qfr-suitable");
    // a slow drift below both thresholds is not panning
    const still = assessRun(runOf(good, { lesion: lesion(), table: { maxSpeedMmS: 1, travelMm: 1 } }));
    expect(still.tags).not.toContain("panned");
    expect(still.qfr.ok).toBe(true);
  });

  it("each QFR criterion fails on its own: no nitrate, 7.5 frames per second, a change of field, a streaming push, foreshortening, overlap, no second projection", () => {
    const failing = (extra: Partial<RunQualityInput>, id: string, inj: InjectionQuality = good) => {
      const q = assessRun(runOf(inj, { lesion: lesion(), ...extra }));
      expect(q.qfr.ok, id).toBe(false);
      expect(q.qfr.criteria.filter((x) => !x.ok).map((x) => x.id), id).toContain(id);
    };
    failing({ lesion: lesion({ nitrate: false }) }, "nitrate");
    failing({ fps: 7.5 }, "frame-rate");
    failing({ fieldChanged: true }, "no-zoom");
    failing({}, "brisk-injection", judge(weak, 1.8));
    failing({ lesion: lesion({ view: { foreshortening: 0.5, overlap: false, axis: { x: 0, y: 0, z: -1 } } }) }, "foreshortening");
    failing({ lesion: lesion({ view: { foreshortening: 0.95, overlap: true, axis: { x: 0, y: 0, z: -1 } } }) }, "overlap");
    failing({ lesion: lesion({ pairSeparationDeg: null }) }, "second-projection");
    failing({ lesion: lesion({ pairSeparationDeg: 10 }) }, "second-projection");
    expect(assessRun(runOf(good, { fps: 7.5 })).tags).toContain("low-frame-rate");
    expect(assessRun(runOf(good, { fieldChanged: true })).tags).toContain("zoomed");
  });

  it("the push timing, the breath-hold and the run's length are tagged from what the lab recorded", () => {
    expect(assessRun(runOf(good, { pushDelayS: 0.3 })).tags).toContain("early-injection");
    expect(assessRun(runOf(good, { pushDelayS: 3 })).tags).toContain("late-injection");
    expect(assessRun(runOf(good, { pushDelayS: -0.5 })).tags).toContain("injected-before-cine");
    const ok = assessRun(runOf(good));
    for (const t of ["early-injection", "late-injection", "injected-before-cine", "free-breathing", "stopped-early"] as const) expect(ok.tags).not.toContain(t);
    expect(assessRun(runOf(good, { breathHeldShare: 0.5 })).tags).toContain("free-breathing");
    expect(assessRun(runOf(good, { tailS: 0.5 })).tags).toContain("stopped-early");
    expect(assessRun(runOf(good, { tailS: null })).tags).toContain("stopped-early");
    // a run without contrast cannot be read; a root puff is not judged as a selective run
    expect(assessRun(runOf(null)).nonDiagnostic).toBe(true);
    expect(assessRun(runOf(null)).tags).toContain("no-injection");
    const root = assessRun(runOf(judge(weak, 1.8), { selective: false }));
    expect(root.tags).toContain("non-selective");
    expect(root.nonDiagnostic).toBe(false);
  });
});

describe("the view of a lesion", () => {
  it("a segment along the beam is foreshortened; a vessel crossing its projection overlaps it; separations are the angles between the beam axes", () => {
    const seg = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 10 }];
    // AP: the beam runs along z, so a segment along z is seen end on
    const ap = { laoRao: 0, cranialCaudal: 0 };
    expect(lesionView(ap, { pts: seg, radiusMm: 1.5 }, []).foreshortening).toBeLessThan(0.05);
    // LAO 90: the same segment side on
    expect(lesionView({ laoRao: 90, cranialCaudal: 0 }, { pts: seg, radiusMm: 1.5 }, []).foreshortening).toBeGreaterThan(0.99);
    const side = [{ x: 0, y: 0, z: 0 }, { x: 5, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }];
    // a vessel 20 mm in front of the lesion's centre, crossing it in AP and clear of it in LAO 90
    const crossing = { pts: [{ x: 5, y: -5, z: 20 }, { x: 5, y: 0, z: 20 }, { x: 5, y: 5, z: 20 }], radii: [1.5, 1.5, 1.5] };
    expect(lesionView(ap, { pts: side, radiusMm: 1.5 }, [crossing]).overlap).toBe(true);
    expect(lesionView({ laoRao: 90, cranialCaudal: 0 }, { pts: side, radiusMm: 1.5 }, [crossing]).overlap).toBe(false);
    // the lesion's own neighbourhood (within RUN_QUALITY.overlapNearMm in 3D) is not an overlap
    const branch = { pts: [{ x: 5, y: 2, z: 0 }], radii: [1] };
    expect(lesionView(ap, { pts: side, radiusMm: 1.5 }, [branch]).overlap).toBe(false);
    expect(viewSeparationDeg({ laoRao: 30, cranialCaudal: 0 }, { laoRao: -30, cranialCaudal: 0 })).toBeCloseTo(60, 6);
    expect(viewSeparationDeg({ laoRao: 0, cranialCaudal: 30 }, { laoRao: 0, cranialCaudal: 30 })).toBeCloseTo(0, 6);
  });
});
