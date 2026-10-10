import { describe, expect, it } from "vitest";
import { actGate, lesionTruth, pxToMm, scoreEstimate, sizeFor, GUIDE_6F_MM } from "./lesionAssessment";
import { setup } from "./testSetup";

describe("lesion assessment, sizing and ACT", () => {
  it("ground truth comes from the reference tree and the current severity", () => {
    const su = setup("lad-focal");
    const t = lesionTruth(su.g, 85);
    expect(t.refMm).toBeGreaterThan(2);
    expect(t.mldMm).toBeCloseTo(su.g.lesion.refDiameter * 0.15, 6);
    expect(t.lengthMm).toBeCloseTo(12, 6);
    expect(t.refProxMm).toBeGreaterThanOrEqual(t.refDistMm);
  });

  it("estimate errors are measured in millimetres against the truth", () => {
    const su = setup("lad-focal");
    const t = lesionTruth(su.g, 85);
    const sc = scoreEstimate({ refMm: t.refMm + 0.4, mldMm: t.mldMm, lengthMm: t.lengthMm - 3 }, t);
    expect(sc.refErrMm).toBeCloseTo(0.4, 6);
    expect(sc.mldErrMm).toBeCloseTo(0, 6);
    expect(sc.lengthErrMm).toBeCloseTo(3, 6);
  });

  it("calipers are calibrated on the 6 F guide (2.0 mm)", () => {
    expect(GUIDE_6F_MM).toBe(2);
    expect(pxToMm(30, 20)).toBeCloseTo(3, 6);
  });

  it("sizing bases give different stents: EEM rounds down to 0.25 mm, lumen and references to the nearest size", () => {
    const m = { refProxMm: 3.4, refDistMm: 2.9, lengthMm: 14, ivusDistEem: 3.62, ivusDistLumen: 2.86 };
    expect(sizeFor("distal-reference", m).diameter).toBe(3.0);
    expect(sizeFor("mean-reference", m).diameter).toBe(3.0);
    expect(sizeFor("ivus-eem", m).diameter).toBe(3.5);
    expect(sizeFor("ivus-eem", m).rawMm).toBe(3.5);
    expect(sizeFor("ivus-lumen", m).diameter).toBe(3.0);
    // length covers the lesion with a margin at each end
    expect(sizeFor("distal-reference", m).lengthMm).toBeGreaterThanOrEqual(18);
  });

  it("the ACT gate needs heparin and a measured ACT at or above 250 s", () => {
    expect(actGate(null, false).ok).toBe(false);
    expect(actGate(null, true).ok).toBe(false);
    expect(actGate(210, true).ok).toBe(false);
    expect(actGate(280, true).ok).toBe(true);
  });
});
