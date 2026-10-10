import { describe, it, expect } from "vitest";
import { CORRECT_TIMING, NOTCH, iabpMetrics, iabpPressure, timingErrors } from "./iabp";

const h = { systolic: 100, diastolic: 60, hr: 90 };

describe("IABP timing model", () => {
  it("correct timing: augmentation exceeds unassisted systole and assisted EDP is lower", () => {
    const m = iabpMetrics(CORRECT_TIMING, h);
    expect(timingErrors(CORRECT_TIMING)).toEqual([]);
    expect(m.augDiastolic).toBeGreaterThan(m.unassistedSys);
    expect(m.assistedEdp).toBeLessThan(m.unassistedEdp);
    expect(m.assistedSys).toBeLessThan(m.unassistedSys);
    expect(m.effective).toBe(true);
  });

  it("classifies the four timing errors", () => {
    expect(timingErrors({ ...CORRECT_TIMING, inflate: 0.25 })).toContain("early-inflation");
    expect(timingErrors({ ...CORRECT_TIMING, inflate: 0.5 })).toContain("late-inflation");
    expect(timingErrors({ ...CORRECT_TIMING, deflate: 0.7 })).toContain("early-deflation");
    expect(timingErrors({ ...CORRECT_TIMING, deflate: 1.08 })).toContain("late-deflation");
  });

  it("late deflation: assisted EDP is not lower than unassisted", () => {
    const m = iabpMetrics({ ...CORRECT_TIMING, deflate: 1.08 }, h);
    expect(m.assistedEdp).toBeGreaterThanOrEqual(m.unassistedEdp);
    expect(m.effective).toBe(false);
  });

  it("early deflation: assisted EDP returns to the unassisted value", () => {
    const m = iabpMetrics({ ...CORRECT_TIMING, deflate: 0.65 }, h);
    expect(Math.abs(m.assistedEdp - m.unassistedEdp)).toBeLessThanOrEqual(2);
  });

  it("early inflation cuts into the systolic downslope before the notch", () => {
    const early = iabpPressure(NOTCH - 0.04, 0, { ...CORRECT_TIMING, inflate: 0.25 }, h).p;
    const correct = iabpPressure(NOTCH - 0.04, 0, CORRECT_TIMING, h).p;
    expect(early).toBeGreaterThan(correct + 5);
  });

  it("1:2 assist leaves alternate beats unassisted", () => {
    const s = { ...CORRECT_TIMING, ratio: 2 as const };
    expect(iabpPressure(0.5, 0, s, h).assisted).toBe(true);
    expect(iabpPressure(0.5, 1, s, h).assisted).toBe(false);
  });
});
