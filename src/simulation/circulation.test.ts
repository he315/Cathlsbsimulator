import { describe, it, expect } from "vitest";
import {
  Circulation,
  PATIENTS,
  impellaPosition,
  impellaPumpFlow,
  ecmoPumpFlow,
  oxygenation,
  type Devices,
  type Patient,
} from "./circulation";

function settle(p: Patient, d: Devices = {}, seconds = 40) {
  const c = new Circulation(p, d);
  c.run(seconds);
  return c.average(4)!;
}

describe("baseline physiology", () => {
  it("normal adult resting values", () => {
    const s = settle(PATIENTS.normal);
    expect(s.map).toBeGreaterThan(85);
    expect(s.map).toBeLessThan(110);
    expect(s.nativeCO).toBeGreaterThan(4.5);
    expect(s.nativeCO).toBeLessThan(7);
    expect(s.pcwp).toBeLessThan(15);
    expect(s.cvp).toBeLessThan(8);
    expect(s.paSys).toBeLessThan(32);
    expect(s.pulsePressure).toBeGreaterThan(30);
    expect(s.avOpen).toBe(true);
  });

  it("LV-predominant shock: low output, high wedge, poor CPO", () => {
    const s = settle(PATIENTS.lvShock);
    expect(s.map).toBeLessThan(65);
    expect(s.nativeCO).toBeLessThan(3);
    expect(s.pcwp).toBeGreaterThan(22);
    expect(s.cpo).toBeLessThan(0.6);
    expect(s.cvp / s.pcwp).toBeLessThan(0.8);
  });

  it("biventricular failure: high RA relative to wedge and low PAPi", () => {
    const s = settle(PATIENTS.biv);
    expect(s.cvp / s.pcwp).toBeGreaterThan(0.5);
    expect(s.papi).toBeLessThan(0.9);
  });

  it("conserves blood volume", () => {
    const c = new Circulation(PATIENTS.normal);
    const tot = () => c.s.vLV + c.s.vRV + c.s.vRoot + c.s.vSA + c.s.vSV + c.s.vPA + c.s.vPV;
    const before = tot();
    c.run(10);
    expect(Math.abs(tot() - before)).toBeLessThan(0.5);
  });
});

describe("Impella", () => {
  it("pump curve: more flow at higher P-level, less against a higher pressure difference", () => {
    expect(impellaPumpFlow(8, 60)).toBeGreaterThan(impellaPumpFlow(4, 60));
    expect(impellaPumpFlow(8, 80)).toBeLessThan(impellaPumpFlow(8, 40));
  });
  it("position classification", () => {
    expect(impellaPosition(3.5)).toBe("correct");
    expect(impellaPosition(0)).toBe("aorta");
    expect(impellaPosition(7)).toBe("ventricle");
  });
  it("correctly placed at P8 raises MAP and CPO and lowers LV filling pressure in LV shock", () => {
    const base = settle(PATIENTS.lvShock);
    const sup = settle(PATIENTS.lvShock, { impella: { on: true, pLevel: 8, depth: 3.5 } });
    expect(sup.map).toBeGreaterThan(base.map + 10);
    expect(sup.cpo).toBeGreaterThan(base.cpo + 0.15);
    expect(sup.lvedp).toBeLessThan(base.lvedp - 2);
    expect(sup.pulsePressure).toBeLessThan(base.pulsePressure);
  });
  it("in the aorta it does nothing useful", () => {
    const base = settle(PATIENTS.lvShock);
    const wrong = settle(PATIENTS.lvShock, { impella: { on: true, pLevel: 8, depth: 0 } });
    expect(Math.abs(wrong.map - base.map)).toBeLessThan(2);
    expect(wrong.impellaFlow).toBeCloseTo(0, 5);
  });
  it("suction when the LV is underfilled", () => {
    const dry = { ...PATIENTS.lvShock, stressed: 480 };
    const s = settle(dry, { impella: { on: true, pLevel: 9, depth: 3.5 } });
    expect(s.suction).toBe(true);
  });
});

describe("VA-ECMO", () => {
  it("pump flow rises with speed and falls against afterload; low speed can run backwards", () => {
    expect(ecmoPumpFlow(4000, 70)).toBeGreaterThan(ecmoPumpFlow(3000, 70));
    expect(ecmoPumpFlow(3500, 100)).toBeLessThan(ecmoPumpFlow(3500, 60));
    expect(ecmoPumpFlow(1500, 70)).toBeLessThan(0);
  });
  it("restores pressure in arrest but distends a non-ejecting LV; an Impella vents it", () => {
    const ecmo: Devices = { ecmo: { on: true, rpm: 3800, sweep: 3, fdo2: 1, distalPerfusion: true } };
    const s = settle(PATIENTS.arrest, ecmo, 60);
    expect(s.map).toBeGreaterThan(60);
    expect(s.pulsePressure).toBeLessThan(3);
    expect(s.lvedp).toBeGreaterThan(20);
    const vented = settle(PATIENTS.arrest, { ...ecmo, impella: { on: true, pLevel: 6, depth: 3.5 } }, 60);
    expect(vented.lvedp).toBeLessThan(s.lvedp - 10);
  });
  it("raising ECMO flow in a failing LV raises afterload: pulse pressure falls, LV filling pressure rises", () => {
    const lo = settle(PATIENTS.biv, { ecmo: { on: true, rpm: 2500, sweep: 3, fdo2: 1, distalPerfusion: true } });
    const hi = settle(PATIENTS.biv, { ecmo: { on: true, rpm: 4000, sweep: 3, fdo2: 1, distalPerfusion: true } });
    expect(hi.ecmoFlow).toBeGreaterThan(lo.ecmoFlow);
    expect(hi.pulsePressure).toBeLessThan(lo.pulsePressure);
    expect(hi.lvedp).toBeGreaterThan(lo.lvedp);
  });
  it("differential hypoxaemia: recovering LV with poor lungs perfuses the right arm with desaturated blood", () => {
    const d: Devices = { ecmo: { on: true, rpm: 3600, sweep: 3, fdo2: 1, distalPerfusion: true } };
    const s = settle(PATIENTS.recovering, d);
    const o = oxygenation(PATIENTS.recovering, s, d);
    expect(o.rightRadialSat).toBeLessThan(0.9);
    expect(o.lowerBodySat).toBeGreaterThan(o.rightRadialSat);
  });
});
