import { describe, it, expect } from "vitest";
import { chartDiameter, deviceFor, DEVICE_BY_ID } from "./pci/equipment";
import {
  BALLOON_KINDS,
  BALLOON_SPEC,
  BENCH_BY_ID,
  BENCH_LESIONS,
  STENT_SPEC,
  applyPrep,
  balloonDiameter,
  balloonPressures,
  maxStentDiameter,
  stentDiameter,
  deploy,
  fujino,
  initialState,
  lumen,
  eem,
  plaqueBurden,
  preImaging,
  type PrepAction,
} from "./pciBench";

const prep = (id: string, actions: PrepAction[]) => actions.reduce((s, a) => applyPrep(BENCH_BY_ID[id], s, a), initialState());

describe("geometry", () => {
  it("lumen never exceeds EEM and plaque burden peaks in the lesion", () => {
    for (const l of BENCH_LESIONS) {
      for (let x = 0; x <= l.segmentMm; x += 1) expect(lumen(l, x)).toBeLessThan(eem(l, x));
      const mid = (l.startMm + l.endMm) / 2;
      expect(plaqueBurden(l, mid)).toBeCloseTo(l.pbMax, 5);
      expect(plaqueBurden(l, 0)).toBeLessThan(0.5);
    }
  });
  it("Fujino score", () => {
    expect(fujino({ startMm: 0, lengthMm: 12, arcDeg: 300, thicknessMm: 0.9 })).toBe(4);
    expect(fujino({ startMm: 0, lengthMm: 4, arcDeg: 90, thicknessMm: 0.3 })).toBe(0);
    expect(fujino({ startMm: 0, lengthMm: 6, arcDeg: 200, thicknessMm: 0.4 })).toBe(3);
  });
  it("IVUS cannot measure calcium thickness; OCT can", () => {
    const l = BENCH_BY_ID["calcified-rca"];
    expect(preImaging(l, "IVUS").calcium?.thicknessMm).toBeNull();
    expect(preImaging(l, "OCT").calcium?.fujino).toBe(4);
  });
  it("non-compliant balloons barely grow with pressure; semi-compliant ones do", () => {
    // recalibrated to the catalogue charts (pci-bench-imaging-unify): semi-compliant nominal 6, RBP 14 atm;
    // non-compliant nominal 12, RBP 20 atm; the semi-compliant balloon grows more per atm and over its range
    const sc = balloonDiameter("semi-compliant", 3, 14) - balloonDiameter("semi-compliant", 3, 6);
    const nc = balloonDiameter("non-compliant", 3, 20) - balloonDiameter("non-compliant", 3, 12);
    expect(sc).toBeGreaterThan(1.5 * nc);
  });
});

describe("devices from the catalogue", () => {
  it("BALLOON_SPEC diameters equal equipment.ts chartDiameter at nominal and RBP for every kind and size", () => {
    for (const k of BALLOON_KINDS) {
      const spec = deviceFor("balloon", k);
      expect(BALLOON_SPEC[k].label).toBe(spec.label);
      expect(BALLOON_SPEC[k].nominalAtm).toBe(spec.nominalAtm(3));
      expect(BALLOON_SPEC[k].rbpAtm).toBe(spec.rbpAtm(3));
      for (const d of spec.diameters) {
        const { nominalAtm, rbpAtm } = balloonPressures(k, d);
        expect(nominalAtm).toBe(spec.nominalAtm(d));
        expect(rbpAtm).toBe(spec.rbpAtm(d));
        expect(balloonDiameter(k, d, nominalAtm)).toBeCloseTo(chartDiameter(spec, d, nominalAtm), 10);
        expect(balloonDiameter(k, d, rbpAtm)).toBeCloseTo(chartDiameter(spec, d, rbpAtm), 10);
      }
      // the single-number growth AngioPci reads agrees with the chart at 3.0 mm
      const s = BALLOON_SPEC[k];
      expect(balloonDiameter(k, 3, s.nominalAtm) + s.mmPerAtm * (s.rbpAtm - s.nominalAtm)).toBeCloseTo(chartDiameter(spec, 3, s.rbpAtm), 10);
    }
  });

  it("the stent follows the catalogue's drug-eluting stent: chart, pressures and dilatation limit", () => {
    const des = DEVICE_BY_ID.des;
    expect(STENT_SPEC.nominalAtm).toBe(des.nominalAtm(3));
    expect(STENT_SPEC.rbpAtm).toBe(des.rbpAtm(3));
    for (const d of des.diameters) {
      for (const atm of [des.nominalAtm(d), des.rbpAtm(d)]) expect(stentDiameter(d, atm)).toBeCloseTo(chartDiameter(des, d, atm), 10);
      expect(maxStentDiameter(d)).toBe(des.dilatationLimit!(d));
    }
    // the dilatation limit is the catalogue's; there is no fallback number
    expect(typeof des.dilatationLimit).toBe("function");
  });
});

describe("procedure outcomes", () => {
  it("focal LAD: the optimised imaging-guided plan scores at least 80", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const p = preImaging(l, "IVUS");
    const s = prep("focal-lad", [{ kind: "balloon", balloon: "semi-compliant", diameter: 2.5, atm: 10 }]);
    const r = deploy(l, s, { diameter: 3.0, lengthMm: 18, proxEdge: p.landingProx - 1, atm: 12 }, [{ diameter: 3.25, atm: 18, where: "full" }], "IVUS");
    expect(r.score).toBeGreaterThanOrEqual(80);
    expect(r.geom.rings.length).toBeGreaterThan(5);
  });

  it("calcified RCA without calcium modification fails the expansion criterion", () => {
    const l = BENCH_BY_ID["calcified-rca"];
    const s = prep("calcified-rca", [{ kind: "balloon", balloon: "non-compliant", diameter: 3.0, atm: 14 }]);
    const r = deploy(l, s, { diameter: 3.5, lengthMm: 23, proxEdge: 9, atm: 14 }, [{ diameter: 3.75, atm: 20, where: "full" }], "IVUS");
    expect(r.criteria.find((c) => c.label.startsWith("Expansion"))?.ok).toBe(false);
    expect(r.score).toBeLessThan(80);
  });

  it("good imaging-guided technique meets the optimisation criteria in a focal lesion", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const p = preImaging(l, "IVUS");
    const s = prep("focal-lad", [{ kind: "balloon", balloon: "semi-compliant", diameter: 2.5, atm: 10 }]);
    const r = deploy(l, s, { diameter: 3.0, lengthMm: 16, proxEdge: p.landingProx - 1, atm: 12 }, [{ diameter: 3.25, atm: 18, where: "full" }], "IVUS");
    expect(r.criteria.every((c) => c.ok)).toBe(true);
  });

  it("untreated heavy calcium leads to stent underexpansion; modification fixes it", () => {
    const l = BENCH_BY_ID["calcified-rca"];
    const stent = { diameter: 3.5, lengthMm: 24, proxEdge: 9, atm: 14 };
    const post = [{ diameter: 3.75, atm: 20, where: "full" as const }];
    const bad = deploy(l, prep("calcified-rca", [{ kind: "balloon", balloon: "semi-compliant", diameter: 3.0, atm: 12 }]), stent, post, "IVUS");
    const good = deploy(l, prep("calcified-rca", [{ kind: "ivl", diameter: 3.5, cycles: 6 }, { kind: "balloon", balloon: "non-compliant", diameter: 3.5, atm: 18 }]), stent, post, "IVUS");
    expect(bad.expansion).toBeLessThan(70);
    expect(good.expansion).toBeGreaterThan(80);
  });

  it("an oversized burr perforates", () => {
    const s = prep("calcified-rca", [{ kind: "rota", burrMm: 2.5 }]);
    expect(s.events.some((e) => e.kind === "perforation" && e.severity === "major")).toBe(true);
  });

  it("proximal optimisation corrects malapposition and proximal underexpansion in the left main", () => {
    const l = BENCH_BY_ID["distal-lm"];
    const s = prep("distal-lm", [{ kind: "balloon", balloon: "semi-compliant", diameter: 3.0, atm: 10 }]);
    const stent = { diameter: 3.5, lengthMm: 20, proxEdge: 2, atm: 12 };
    const without = deploy(l, s, stent, [{ diameter: 3.75, atm: 18, where: "full" }], "IVUS");
    const withPot = deploy(l, s, stent, [{ diameter: 3.75, atm: 18, where: "full" }, { diameter: 5.0, atm: 14, where: "proximal" }], "IVUS");
    expect(without.maxMalapposition).toBeGreaterThan(withPot.maxMalapposition);
    expect(withPot.expansionProx).toBeGreaterThan(without.expansionProx + 15);
  });

  it("landing an edge in heavy plaque is penalised", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const r = deploy(l, initialState(), { diameter: 3.0, lengthMm: 8, proxEdge: 17, atm: 12 }, [], "IVUS");
    expect(r.geographicMiss).toBe(true);
    expect(r.criteria.find((c) => c.label.startsWith("Plaque burden"))?.ok).toBe(false);
  });

  it("post-dilatation beyond the stent's labelled dilatation limit is reported and costs score", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const p = preImaging(l, "IVUS");
    const s = prep("focal-lad", [{ kind: "balloon", balloon: "semi-compliant", diameter: 2.5, atm: 10 }]);
    const stent = { diameter: 3.0, lengthMm: 18, proxEdge: p.landingProx - 1, atm: 12 };
    // a 4.0 mm non-compliant balloon at 18 atm on a 3.0 mm stent (limit 3.5 mm)
    expect(balloonDiameter("non-compliant", 4.0, 18)).toBeGreaterThan(maxStentDiameter(3.0));
    const over = deploy(l, s, stent, [{ diameter: 4.0, atm: 18, where: "full" }], "IVUS");
    const ev = over.events.find((e) => e.kind === "stent-overdilated");
    expect(ev).toBeDefined();
    expect(ev!.text).toContain("3.50");
    expect(over.score).toBeLessThan(100);
    // within the limit there is no such event
    const within = deploy(l, s, stent, [{ diameter: 3.25, atm: 18, where: "full" }], "IVUS");
    expect(within.events.some((e) => e.kind === "stent-overdilated")).toBe(false);
    expect(over.score).toBeLessThan(within.score);
  });

  it("an oversized post-dilatation balloon can perforate although the stent stops at its limit", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const p = preImaging(l, "IVUS");
    const s = prep("focal-lad", [{ kind: "balloon", balloon: "semi-compliant", diameter: 2.5, atm: 10 }]);
    const stent = { diameter: 3.0, lengthMm: 18, proxEdge: p.landingProx - 1, atm: 12 };
    const r = deploy(l, s, stent, [{ diameter: 4.5, atm: 20, where: "full" }], "IVUS");
    expect(r.profile.every((q) => q.d <= maxStentDiameter(3.0) + 1e-9)).toBe(true);
    expect(r.events.some((e) => e.kind === "perforation" && e.severity === "major")).toBe(true);
  });

  it("aggressive post-dilatation over a lipid pool causes no-reflow", () => {
    const l = BENCH_BY_ID["lipid-acs"];
    const r = deploy(l, initialState(), { diameter: 3.5, lengthMm: 20, proxEdge: 8, atm: 12 }, [{ diameter: 4.0, atm: 20, where: "full" }], "OCT");
    expect(r.events.some((e) => e.kind === "no-reflow")).toBe(true);
  });
});
