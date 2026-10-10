import { describe, it, expect } from "vitest";
import { injectContrast, injectionSeat } from "./contrast";
import { buildAnatomy } from "./anatomy";
import type { EngagementState, PressureState } from "../types";
import { generateCase } from "./caseGenerator";

const model = () => buildAnatomy(generateCase("ctest", { rootSize: "normal", focus: "both", dominance: "right" }, "rand"));

const eng = (over: Partial<EngagementState>): EngagementState => ({
  kind: "sinus-level",
  target: null,
  distanceToLm: 10,
  distanceToRca: 10,
  alignmentLm: 0.5,
  alignmentRca: 0.5,
  tipHeight: 12,
  depth: 0,
  isSelective: false,
  isDeep: false,
  isDangerous: false,
  conus: false,
  quality: 0,
  message: "",
  ...over,
});

const press = (over: Partial<PressureState> = {}): PressureState => ({
  kind: "aortic", systolic: 122, diastolic: 76, quality: 0.95, warning: "none", label: "", ...over,
});

describe("injectContrast outcomes", () => {
  it("a well-seated selective left injection is a diagnostic LCA run", () => {
    const r = injectContrast(eng({ kind: "selective-lm", target: "left", isSelective: true, quality: 0.9 }), press(), model());
    expect(r.outcome).toBe("selective-lca");
    expect(r.diagnostic).toBe(true);
    expect(r.safety).toBe("ok");
    expect(r.filledVessels).toContain("LAD");
  });

  it("injecting below the valve plane is an LV injection (danger)", () => {
    const r = injectContrast(eng({ kind: "in-lv", isDangerous: true }), press({ kind: "lv", warning: "danger" }), model());
    expect(r.outcome).toBe("lv-injection");
    expect(r.safety).toBe("danger");
  });

  it("injecting on a damped/deep trace refluxes and is dangerous", () => {
    const r = injectContrast(eng({ kind: "deep-lm", target: "left", isDeep: true, isDangerous: true }), press({ kind: "damped", warning: "danger" }), model());
    expect(r.outcome).toBe("deep-reflux");
    expect(r.safety).toBe("danger");
  });

  it("injecting into a dissected vessel is the most dangerous injection", () => {
    const r = injectContrast(eng({ kind: "selective-rca", target: "right", isSelective: true, quality: 0.8 }), press({ kind: "dissected", warning: "danger" }), model());
    expect(r.safety).toBe("danger");
  });

  it("a non-selective sinus injection is a root puff, not a coronary run", () => {
    const r = injectContrast(eng({ kind: "non-selective", quality: 0.15 }), press(), model());
    expect(r.outcome).toBe("root-puff");
    expect(r.diagnostic).toBe(false);
  });
});

describe("injectionSeat: how the tip meets the ostium for the hand injection", () => {
  it("a well-seated selective tip captures nearly all of the jet and leaves room around it", () => {
    const s = injectionSeat(eng({ kind: "selective-lm", target: "left", isSelective: true, quality: 0.9 }), press());
    expect(s.capture).toBeGreaterThan(0.9);
    expect(s.seal).toBeLessThan(0.5);
  });

  it("a poorer selective position captures less", () => {
    const good = injectionSeat(eng({ kind: "selective-lm", target: "left", isSelective: true, quality: 0.9 }), press());
    const poor = injectionSeat(eng({ kind: "selective-lm", target: "left", isSelective: true, quality: 0.45 }), press());
    expect(poor.capture).toBeLessThan(good.capture);
  });

  it("a deep or damped tip seals the ostium (overdrive and staining)", () => {
    const s = injectionSeat(eng({ kind: "deep-lm", target: "left", isDeep: true, isDangerous: true }), press({ kind: "damped", warning: "danger" }));
    expect(s.seal).toBeGreaterThan(0.8);
    expect(s.capture).toBe(1);
  });

  it("near but not seated captures a third; a sinus-level tip almost nothing; the LV none", () => {
    expect(injectionSeat(eng({ kind: "coaxial-lm", target: "left" }), press()).capture).toBeCloseTo(0.35, 6);
    expect(injectionSeat(eng({ kind: "non-selective" }), press()).capture).toBeLessThan(0.1);
    expect(injectionSeat(eng({ kind: "in-lv" }), press({ kind: "lv" })).capture).toBe(0);
  });
});
