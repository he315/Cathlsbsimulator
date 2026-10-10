import { describe, expect, it } from "vitest";
import {
  SIM_FLOW_SPECS,
  SIM_FRAME_TOLERANCE,
  TIMI_GRADES,
  describeTruth,
  engineGrade,
  measureFlow,
  modelFrameCount,
  scoreSimFlow,
  simFlowItem,
  simFlowSeeded,
  simFlowMods,
  simFlowPatient,
  simFlowSetting,
  simFlowTipContext,
  simFlowTrace,
  raises,
} from "./simFlowDrill";
import { LAD_CORRECTION } from "./labels";
import { tipsFor } from "../../content/lab/tips";
import { contrastField, transportNet } from "../../render/xray/contrastTransport";

describe("simulated-run TIMI and frame-count drill", () => {
  it("runs at the flowScale values for TIMI 0, 1, 2 and 3 are graded by the engine as the grade they were made for", () => {
    for (const vessel of ["LAD", "RCA"] as const)
      for (const g of TIMI_GRADES) {
        const m = measureFlow(vessel, g);
        expect({ vessel, g, grade: engineGrade(m) }).toEqual({ vessel, g, grade: g });
      }
    // the settings are what the grades differ by: the flow beyond the proximal vessel (and an occlusion for TIMI 0)
    const distal = (v: "LAD" | "RCA", g: 0 | 1 | 2 | 3) => simFlowSetting(v, g).flowScale * (simFlowSetting(v, g).slowBeyond?.scale ?? 1);
    for (const v of ["LAD", "RCA"] as const) {
      expect(distal(v, 3)).toBeGreaterThan(distal(v, 2));
      expect(distal(v, 2)).toBeGreaterThan(distal(v, 1));
      expect(simFlowSetting(v, 0).occluded).toBe(true);
    }
    // TIMI 2 slows the vessel beyond its proximal segment only, so the proximal segment and the circumflex of the
    // same left injection fill at normal flow as the in-run comparison
    for (const v of ["LAD", "RCA"] as const) expect(simFlowSetting(v, 2)).toMatchObject({ flowScale: 1, slowBeyond: { at: expect.any(Number) } });
    expect(simFlowSetting("LAD", 1).flowScale).toBe(1);
  });

  it("in the LAD TIMI 2 and 1 runs the circumflex fills as promptly as in the normal run (an uninvolved bed to compare with)", () => {
    const { tree } = simFlowPatient();
    const trace = simFlowTrace("left");
    const rr = 60 / 72;
    /** time (s) the distal circumflex first reaches half its peak, for the transport of a LAD run of grade g */
    const lcxFill = (g: 1 | 2 | 3) => {
      const net = transportNet(tree, [], simFlowMods({ vessel: "LAD", timi: g }, tree));
      const th = net.vessels.get("LCx")!.theta;
      const at = th[Math.round(0.9 * (th.length - 1))];
      const ys: number[] = [];
      for (let i = 0; i <= 6 * 60; i++) {
        const t = i / 60;
        ys.push(contrastField({ net, side: "left", trace, t, phase: (t / rr) % 1, rr, flowScale: simFlowSetting("LAD", g).flowScale }).at(at));
      }
      const peak = Math.max(...ys);
      return ys.findIndex((y) => y >= 0.5 * peak) / 60;
    };
    const normal = lcxFill(3);
    expect(normal).toBeGreaterThan(0);
    // no slower than in the normal run (slightly sooner, as more of the injection goes to the circumflex)
    for (const g of [2, 1] as const) expect(lcxFill(g)).toBeLessThanOrEqual(normal + 1 / 60);
  });

  it("every drill item's answer is the engine's grade, and a learner is scored against it", () => {
    for (const spec of SIM_FLOW_SPECS) {
      const it = simFlowItem(spec);
      expect(it.truth.timi).toBe(spec.timi);
      expect(it.truth.source).toBe("model");
      expect(scoreSimFlow(it, { timi: spec.timi, frames: it.truth.frameCount, conf: 0.8 }).gradeCorrect).toBe(true);
      const wrong = ((spec.timi + 1) % 4) as 0 | 1 | 2 | 3;
      expect(scoreSimFlow(it, { timi: wrong, frames: it.truth.frameCount, conf: 0.8 }).gradeCorrect).toBe(false);
    }
  });

  it("the frame-count answer is the model's count at the run's own frame rate, labelled a model value", () => {
    const at15 = simFlowItem(SIM_FLOW_SPECS.find((s) => s.vessel === "LAD" && s.timi === 3 && s.fps === 15)!);
    const at10 = simFlowItem(SIM_FLOW_SPECS.find((s) => s.vessel === "LAD" && s.timi === 3 && s.fps === 10)!);
    const m = measureFlow("LAD", 3);
    expect(at15.truth.frameCount).toBe(modelFrameCount(m, 15));
    expect(at10.truth.frameCount).toBe(modelFrameCount(m, 10));
    // the same transit gives fewer frames at the lower rate
    expect(at10.truth.frameCount!).toBeLessThan(at15.truth.frameCount!);
    expect(Math.abs(at10.truth.frameCount! - (at15.truth.frameCount! * 10) / 15)).toBeLessThanOrEqual(1);
    // the LAD count is corrected by dividing by 1.7 at the run's rate
    expect(at15.truth.corrected).toBeCloseTo(at15.truth.frameCount! / LAD_CORRECTION, 6);
    const text = describeTruth(at15).join(" ");
    expect(text).toContain("Model value");
    expect(text).toContain(`${at15.truth.frameCount} frames at 15 frames per second`);
    // refs carries no verified normal counts, so none is shown
    expect(at15.truth.normals).toBeNull();
    expect(text).toContain("No published normal count is shown");
    // a slower grade takes more frames
    const slow = simFlowItem(SIM_FLOW_SPECS.find((s) => s.vessel === "LAD" && s.timi === 2 && s.fps === 15)!);
    expect(slow.truth.frameCount!).toBeGreaterThan(at15.truth.frameCount!);
  });

  it("TIMI 0 and 1 runs have no frame count, and the learner's 'does not reach the landmark' agrees", () => {
    for (const g of [0, 1] as const) {
      const it = simFlowItem(SIM_FLOW_SPECS.find((s) => s.timi === g)!);
      expect(it.truth.frameCount).toBeNull();
      expect(scoreSimFlow(it, { timi: g, frames: null, conf: 0.5 }).countCorrect).toBe(true);
      expect(scoreSimFlow(it, { timi: g, frames: 20, conf: 0.5 }).countCorrect).toBe(false);
    }
    const it3 = simFlowItem(SIM_FLOW_SPECS.find((s) => s.timi === 3)!);
    const n = it3.truth.frameCount!;
    expect(scoreSimFlow(it3, { timi: 3, frames: n + SIM_FRAME_TOLERANCE, conf: 0.5 }).countCorrect).toBe(true);
    expect(scoreSimFlow(it3, { timi: 3, frames: n + SIM_FRAME_TOLERANCE + 1, conf: 0.5 }).countCorrect).toBe(false);
  });

  it("a set is stratified: the same number of runs of each grade", () => {
    const set = simFlowSeeded(7, 2);
    expect(set).toHaveLength(8);
    for (const g of TIMI_GRADES) expect(set.filter((x) => x.spec.timi === g)).toHaveLength(2);
  });

  it("the reveal's tip context is the diagnostic views phase with slow-flow, and its raises declare it", () => {
    const it = simFlowItem(SIM_FLOW_SPECS.find((s) => s.timi === 2)!);
    const ctx = simFlowTipContext(it);
    expect(ctx).toMatchObject({ lab: "diagnostic", phase: "views" });
    expect(tipsFor(ctx, 20).map((t) => t.id)).toContain("pci-interp-grade-flow");
    for (const e of ctx.events ?? []) expect(raises.events).toContain(e);
  });
});
