// ---------------------------------------------------------------------------
// "auto" configuration choice (bench.ts): chosen from the measured full-frame
// cost of each validated configuration, with a safety margin under the budget,
// on the app's geometry (live anatomy with the arch branches).
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { AUTO_MARGIN, VALIDATED_CONFIGS, autoConfig, chooseConfig, chooseMeasured, liveArchEngine, type BenchReport, type MeasuredConfig } from "./bench";

const m = (s10: number, s12: number, s14: number): MeasuredConfig[] => [
  { substepHz: 120, segmentScale: 1.0, worstMs: s10 },
  { substepHz: 120, segmentScale: 1.2, worstMs: s12 },
  { substepHz: 120, segmentScale: 1.4, worstMs: s14 },
];

describe("auto configuration from measured costs", () => {
  it("keeps a margin: a configuration measured just under the budget is not chosen", () => {
    expect(AUTO_MARGIN).toBeLessThan(1);
    // the case found in review: scale 1.2 at 1.94 ms looked fine and then ran at 2.04 ms
    const c = chooseMeasured(m(2.3, 1.94, 1.65), 2);
    expect(c.segmentScale).toBe(1.4);
    expect(c.overBudget).toBe(false);
    expect(c.predictedMs).toBeLessThanOrEqual(AUTO_MARGIN * 2);
    expect(chooseMeasured(m(1.6, 1.4, 1.2), 2)).toMatchObject({ segmentScale: 1.0, overBudget: false });
    expect(chooseMeasured(m(1.71, 1.69, 1.2), 2)).toMatchObject({ segmentScale: 1.2, overBudget: false });
  });

  it("when nothing fits within the margin it returns the cheapest measured configuration, flagged over budget only beyond the budget itself", () => {
    expect(chooseMeasured(m(2.5, 2.2, 1.9), 2)).toMatchObject({ segmentScale: 1.4, overBudget: false, predictedMs: 1.9 });
    expect(chooseMeasured(m(4.6, 4.2, 3.5), 2)).toMatchObject({ segmentScale: 1.4, overBudget: true, predictedMs: 3.5 });
    // a partial measurement (autoConfig stops early) and configurations outside VALIDATED_CONFIGS
    expect(chooseMeasured([{ substepHz: 120, segmentScale: 1.0, worstMs: 1.0 }, { substepHz: 60, segmentScale: 2, worstMs: 0.1 }], 2)).toMatchObject({ segmentScale: 1.0 });
    expect(() => chooseMeasured([{ substepHz: 60, segmentScale: 2, worstMs: 0.1 }], 2)).toThrow();
  });

  it("the extrapolating wave-1 choice applies the same margin when asked", () => {
    const report = (ms: number): BenchReport => ({ substepHz: 120, segmentScale: 1, fps: 15, cases: [{ name: "x", bodies: 90, substeps: 240, msPerSubstep: ms / 8, msPerFrame: ms }] });
    // 2.3 ms at scale 1.0 predicts 1.92 ms at 1.2: inside the budget, outside the margin
    expect(chooseConfig(report(2.3), 2)).toMatchObject({ segmentScale: 1.2 });
    expect(chooseConfig(report(2.3), 2, AUTO_MARGIN)).toMatchObject({ segmentScale: 1.4 });
  });

  it("autoConfig measures configurations finest first on the app's geometry, stops at the first within the margin, and returns a validated one", () => {
    const c = autoConfig(2, 15, liveArchEngine);
    expect(c.measured.length).toBeGreaterThanOrEqual(1);
    c.measured.forEach((x, i) => expect(x.segmentScale).toBe(VALIDATED_CONFIGS[i].segmentScale));
    for (const x of c.measured.slice(0, -1)) expect(x.worstMs).toBeGreaterThan(AUTO_MARGIN * 2);
    expect(VALIDATED_CONFIGS.some((v) => v.segmentScale === c.segmentScale && v.substepHz === c.substepHz)).toBe(true);
    const chosen = c.measured.find((x) => x.segmentScale === c.segmentScale)!;
    expect(c.predictedMs).toBe(chosen.worstMs);
    if (!c.overBudget) expect(c.predictedMs).toBeLessThanOrEqual(2);
    expect(c.initMs).toBeGreaterThan(0);
  }, 120_000);
});
