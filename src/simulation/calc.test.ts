import { describe, it, expect } from "vitest";
import {
  bsaDuBois,
  bsaMosteller,
  fickCO,
  flammMixedVenous,
  qpQs,
  svrWU,
  pvrWU,
  gorlinAVA,
  gorlinMVA,
  hakki,
  cardiacPower,
  papi,
  egfrCkdEpi2021,
  maxContrastCigarroa,
  mehranScore,
  mehranBand,
  meanPressure,
} from "./calc";

describe("haemodynamic formulas", () => {
  it("BSA formulas agree for an average adult", () => {
    const d = bsaDuBois(175, 75);
    const m = bsaMosteller(175, 75);
    expect(d).toBeCloseTo(1.9, 1);
    expect(Math.abs(d - m)).toBeLessThan(0.05);
  });

  it("Fick output matches a hand calculation", () => {
    // VO2 250, Hb 14, SaO2 98%, SvO2 73% → ΔC = 13.6 × 14 × 0.25 = 47.6 mL/L
    expect(fickCO(250, 14, 0.98, 0.73)).toBeCloseTo(250 / 47.6, 3);
    expect(Number.isNaN(fickCO(250, 14, 0.7, 0.75))).toBe(true);
  });

  it("Flamm and Qp:Qs for an atrial shunt", () => {
    const mv = flammMixedVenous(0.7, 0.76);
    expect(mv).toBeCloseTo(0.715, 3);
    expect(qpQs(0.97, mv, 0.98, 0.86)).toBeCloseTo(2.125, 2);
    expect(qpQs(0.97, 0.72, 0.98, 0.72)).toBeCloseTo(0.96, 2);
  });

  it("resistances", () => {
    expect(svrWU(93, 5, 5)).toBeCloseTo(17.6, 1);
    expect(pvrWU(50, 10, 3.5)).toBeCloseTo(11.43, 2);
  });

  it("Gorlin areas behave as expected", () => {
    const ava = gorlinAVA(5, 72, 0.32, 50);
    expect(ava).toBeGreaterThan(0.6);
    expect(ava).toBeLessThan(0.75);
    // higher gradient at the same flow → smaller area
    expect(gorlinAVA(5, 72, 0.32, 80)).toBeLessThan(ava);
    // Hakki approximates Gorlin at normal heart rates
    expect(Math.abs(hakki(5, 50) - ava)).toBeLessThan(0.15);
    expect(gorlinMVA(4.5, 80, 0.4, 12)).toBeLessThan(1.5);
  });

  it("power and PAPi", () => {
    expect(cardiacPower(62, 2.8)).toBeCloseTo(0.385, 2);
    expect(papi(26, 16, 18)).toBeCloseTo(0.556, 2);
    expect(meanPressure(120, 80)).toBeCloseTo(93.3, 1);
  });
});

describe("renal and contrast", () => {
  it("CKD-EPI 2021 gives plausible values", () => {
    const young = egfrCkdEpi2021(80, 40, false);
    const old = egfrCkdEpi2021(80, 80, false);
    expect(young).toBeGreaterThan(90);
    expect(old).toBeLessThan(young);
    expect(egfrCkdEpi2021(200, 70, true)).toBeLessThan(25);
  });

  it("Cigarroa limit caps at 300 mL", () => {
    expect(maxContrastCigarroa(80, 88.4)).toBe(300);
    expect(maxContrastCigarroa(70, 177)).toBeCloseTo(174.8, 0);
  });

  it("Mehran score and bands", () => {
    const s = mehranScore({
      hypotension: true,
      iabp: false,
      heartFailure: true,
      age: 78,
      anaemia: false,
      diabetes: true,
      contrastMl: 250,
      egfr: 35,
    });
    expect(s).toBe(5 + 5 + 4 + 3 + 2 + 4);
    expect(mehranBand(s).band).toBe("very high");
    expect(mehranBand(3).band).toBe("low");
    expect(mehranBand(10).band).toBe("moderate");
  });
});
