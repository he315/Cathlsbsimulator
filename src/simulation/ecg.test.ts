import { describe, it, expect } from "vitest";
import { ecgFromSim, ecgShape } from "./ecg";
import type { EngagementState, PressureState, AnatomyCase } from "../types";
import { generateCase } from "./caseGenerator";

const eng = (over: Partial<EngagementState> = {}): EngagementState => ({
  kind: "selective-lm",
  target: "left",
  distanceToLm: 2,
  distanceToRca: 30,
  alignmentLm: 0.95,
  alignmentRca: 0.2,
  tipHeight: 15,
  depth: 1,
  isSelective: true,
  isDeep: false,
  isDangerous: false,
  conus: false,
  quality: 0.9,
  message: "",
  ...over,
});

const press = (over: Partial<PressureState> = {}): PressureState => ({
  kind: "aortic",
  systolic: 122,
  diastolic: 76,
  quality: 0.95,
  warning: "none",
  label: "",
  ...over,
});

const normalCase = (): AnatomyCase => generateCase("ecg-normal", { pathology: "none", focus: "left" }, "rand");
const criticalLadCase = (): AnatomyCase => generateCase("ecg-lad", { pathology: "critical-lad", focus: "left" }, "rand");

describe("ecgFromSim", () => {
  it("a clean selective engagement is sinus rhythm with ~no ST shift", () => {
    const s = ecgFromSim(eng(), press(), normalCase(), 0);
    expect(s.ischaemia).toBeLessThan(0.05);
    expect(Math.abs(s.st)).toBeLessThan(0.5);
    expect(s.warning).toBe("none");
    expect(s.hr).toBeGreaterThan(50);
    expect(s.hr).toBeLessThan(110);
  });

  it("sustained obstruction of a critical LAD drives ST elevation + tachycardia", () => {
    const obstructed = eng({ kind: "deep-lm", isDeep: true, isDangerous: true });
    const damped = press({ kind: "damped", warning: "danger", systolic: 86, diastolic: 63 });
    const clean = ecgFromSim(obstructed, damped, criticalLadCase(), 0);
    const dwelt = ecgFromSim(obstructed, damped, criticalLadCase(), 8);
    expect(dwelt.ischaemia).toBeGreaterThan(clean.ischaemia);
    expect(dwelt.st).toBeGreaterThan(1); // injury-pattern elevation
    expect(dwelt.hr).toBeGreaterThan(clean.hr);
    expect(dwelt.warning).toBe("danger");
  });

  it("a dissected trace stamps an acute injury pattern", () => {
    const s = ecgFromSim(eng(), press({ kind: "dissected", warning: "danger" }), criticalLadCase(), 2);
    expect(s.ischaemia).toBeGreaterThan(0.5);
  });
});

describe("ecgShape", () => {
  it("is finite across the cycle for a range of ST deviations", () => {
    for (const st of [-3, -1, 0, 1, 3]) {
      for (let p = 0; p < 1; p += 0.02) {
        expect(Number.isFinite(ecgShape(p, st))).toBe(true);
      }
    }
  });

  it("has a dominant R-wave peak near the QRS", () => {
    const r = ecgShape(0.33, 0);
    const baseline = ecgShape(0.75, 0);
    expect(r).toBeGreaterThan(baseline + 0.5);
  });
});
