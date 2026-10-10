import { describe, it, expect } from "vitest";
import {
  TEER_SCENARIOS,
  assessTransseptal,
  septalHeightCm,
  coaptationY,
  targetArmAngle,
  rotationError,
  segmentAt,
  coverage,
  areaFactor,
  grasp,
  idealPlacement,
  teerOutcome,
  transmitralGradient,
  baselineGradient,
  mrGrade,
  scoreTeer,
  GRADIENT_FLAG_MMHG,
  TEER_HEIGHT_TARGET,
  type TeerScenario,
  type PlacedDevice,
  type DevicePlacement,
} from "./teer";

const byId = (id: string): TeerScenario => {
  const s = TEER_SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error(`missing scenario ${id}`);
  return s;
};

const GOOD_FOSSA = { si: 0.55, ap: -0.45 };
const heightFor = (s: TeerScenario) => septalHeightCm(s.septalHeightBaseCm, GOOD_FOSSA);

const place = (s: TeerScenario, p: DevicePlacement, h = heightFor(s)): PlacedDevice => ({ placement: p, grasp: grasp(s, p, h) });

const mainJet = (s: TeerScenario) => s.jets.reduce((a, b) => (b.severity > a.severity ? b : a));

describe("scenario integrity", () => {
  it("includes the four required teaching scenarios", () => {
    const ids = TEER_SCENARIOS.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(["teer-p2-flail", "teer-fmr", "teer-commissural", "teer-small-mva"]));
    for (const s of TEER_SCENARIOS) expect(s.vignette.toLowerCase()).toContain("synthetic");
  });

  it.each(TEER_SCENARIOS.map((s) => [s.id, s] as const))("%s: jets sum to the baseline grade and values are plausible", (_id, s) => {
    const sum = s.jets.reduce((a, j) => a + j.severity, 0);
    expect(sum).toBeCloseTo(s.baselineMr, 6);
    for (const j of s.jets) {
      expect(j.x).toBeGreaterThanOrEqual(-1);
      expect(j.x).toBeLessThanOrEqual(1);
    }
    expect(s.mvaCm2).toBeGreaterThan(2);
    expect(s.mvaCm2).toBeLessThan(8);
    expect(baselineGradient(s)).toBeLessThan(GRADIENT_FLAG_MMHG);
    expect(baselineGradient(s)).toBeGreaterThan(0.5);
    expect(s.heightTargetCm[0]).toBeLessThan(s.heightTargetCm[1]);
    expect(s.anteriorGraspable).toBeLessThanOrEqual(1);
    expect(s.posteriorGraspable).toBeLessThanOrEqual(1);
  });

  it("has a commissural jet, a tethered functional case and a small-MVA case", () => {
    expect(byId("teer-commissural").jets.some((j) => Math.abs(j.x) > 0.6)).toBe(true);
    expect(byId("teer-fmr").etiology).toBe("functional");
    expect(byId("teer-small-mva").mvaCm2).toBeLessThan(4);
  });
});

describe("transseptal puncture", () => {
  it("superior and posterior punctures are higher above the mitral annulus", () => {
    const base = 3.4;
    expect(septalHeightCm(base, { si: 0.6, ap: 0 })).toBeGreaterThan(septalHeightCm(base, { si: 0, ap: 0 }));
    expect(septalHeightCm(base, { si: 0, ap: -0.6 })).toBeGreaterThan(septalHeightCm(base, { si: 0, ap: 0 }));
  });

  it("a posterior, mid-to-superior site at about 4.0–4.5 cm is ideal for TEER in degenerative MR", () => {
    const r = assessTransseptal("teer", GOOD_FOSSA, 3.4);
    expect(r.quality).toBe("ideal");
    expect(r.danger).toBe(false);
    expect(r.heightCm).toBeGreaterThanOrEqual(4.0);
    expect(r.heightCm).toBeLessThanOrEqual(4.5);
  });

  it("anterior tenting is flagged as aortic puncture risk", () => {
    const r = assessTransseptal("teer", { si: 0.4, ap: 0.7 }, 3.4);
    expect(r.danger).toBe(true);
    expect(r.flags.some((f) => /aortic/i.test(f.text))).toBe(true);
  });

  it("height targets follow the verified ranges: ≥4 cm degenerative, lower acceptable in functional MR", () => {
    expect(TEER_HEIGHT_TARGET.degenerative[0]).toBe(4.0);
    expect(TEER_HEIGHT_TARGET.functional[0]).toBeLessThan(TEER_HEIGHT_TARGET.degenerative[0]);
    const h = 3.7;
    const p = { si: 0, ap: (3.4 - h) / 0.5 }; // height 3.7 cm, posterior
    expect(assessTransseptal("teer", p, 3.4, TEER_HEIGHT_TARGET.functional).quality).toBe("ideal");
    expect(assessTransseptal("teer", p, 3.4, TEER_HEIGHT_TARGET.degenerative).quality).not.toBe("ideal");
  });

  it("an inferior puncture is low for TEER but coaxial for LAAO", () => {
    const p = { si: -0.5, ap: -0.4 };
    expect(assessTransseptal("teer", p, 3.4).quality).not.toBe("ideal");
    const l = assessTransseptal("laao", p, 3.4);
    expect(l.quality).toBe("ideal");
    expect(l.coaxialForLaa).toBe(true);
  });
});

describe("valve geometry and alignment", () => {
  it("the coaptation line is a smile: most posterior centrally", () => {
    expect(coaptationY(0)).toBeLessThan(coaptationY(0.7));
    expect(coaptationY(0)).toBeLessThan(coaptationY(-0.7));
    expect(coaptationY(0.5)).toBeCloseTo(coaptationY(-0.5), 9);
  });

  it("perpendicular is 90° centrally and rotates towards each commissure", () => {
    expect(targetArmAngle(0)).toBeCloseTo(90, 9);
    expect(targetArmAngle(0.7)).toBeGreaterThan(100);
    expect(targetArmAngle(-0.7)).toBeLessThan(80);
    expect(rotationError(90, 0)).toBe(0);
    expect(rotationError(270, 0)).toBe(0); // symmetric arms
    expect(rotationError(0, 0)).toBe(90);
  });

  it("maps positions to segments", () => {
    expect(segmentAt(-0.7)).toBe("A1P1");
    expect(segmentAt(0)).toBe("A2P2");
    expect(segmentAt(0.7)).toBe("A3P3");
  });

  it("coverage falls with distance and a wide device reaches further", () => {
    const ds = [0, 0.1, 0.2, 0.3, 0.4, 0.6];
    const c = ds.map((d) => coverage(d, "narrow"));
    for (let i = 1; i < c.length; i++) expect(c[i]).toBeLessThanOrEqual(c[i - 1]);
    expect(coverage(0.25, "wide")).toBeGreaterThan(coverage(0.25, "narrow"));
  });

  it("wide and central devices take more orifice area", () => {
    expect(areaFactor(0, "wide")).toBeLessThan(areaFactor(0, "narrow"));
    expect(areaFactor(0, "narrow")).toBeLessThan(areaFactor(0.8, "narrow"));
  });
});

describe("grasp and residual MR", () => {
  it("rotation error reduces insertion monotonically", () => {
    const s = byId("teer-commissural");
    const x = mainJet(s).x;
    const errs = [0, 15, 30, 45, 60];
    const ins = errs.map((e) => {
      const p = { ...idealPlacement(x), armAngleDeg: targetArmAngle(x) + e };
      const g = grasp(s, p, heightFor(s));
      return Math.min(g.anterior, g.posterior);
    });
    for (let i = 1; i < ins.length; i++) expect(ins[i]).toBeLessThanOrEqual(ins[i - 1]);
  });

  it("a device placed anterior to the coaptation line loses posterior insertion", () => {
    const s = byId("teer-p2-flail");
    const ideal = grasp(s, idealPlacement(0), heightFor(s));
    const ant = grasp(s, { ...idealPlacement(0), y: coaptationY(0) + 0.25 }, heightFor(s));
    expect(ant.posterior).toBeLessThan(ideal.posterior);
    expect(ant.slda).toBe(true);
  });

  it("a perfectly aligned device at the main jet reduces MR to 2+ or less", () => {
    for (const s of TEER_SCENARIOS) {
      const o = teerOutcome(s, [place(s, idealPlacement(mainJet(s).x))]);
      expect(o.mrGrade).toBeLessThanOrEqual(2);
      expect(o.mrGrade).toBeLessThan(s.baselineMr);
    }
  });

  it("a device far from the jet origin barely helps", () => {
    const s = byId("teer-commissural");
    const on = teerOutcome(s, [place(s, idealPlacement(0.74))]);
    const off = teerOutcome(s, [place(s, idealPlacement(-0.4))]);
    expect(off.mrGrade).toBeGreaterThanOrEqual(3);
    expect(on.mrGrade).toBeLessThan(off.mrGrade);
  });

  it("the P2 flail needs a second device to get below 2+", () => {
    const s = byId("teer-p2-flail");
    const one = teerOutcome(s, [place(s, idealPlacement(0.02))]);
    expect(one.mrGrade).toBe(2);
    const two = teerOutcome(s, [place(s, idealPlacement(0.02)), place(s, idealPlacement(-0.42))]);
    expect(two.mrGrade).toBeLessThan(one.mrGrade);
  });

  it("a low puncture costs more insertion in degenerative than in functional MR", () => {
    const low = { si: -0.3, ap: 0 };
    const dmr = byId("teer-p2-flail");
    const fmr = byId("teer-fmr");
    const dGood = grasp(dmr, idealPlacement(0), heightFor(dmr));
    const dLow = grasp(dmr, idealPlacement(0), septalHeightCm(dmr.septalHeightBaseCm, low));
    const fGood = grasp(fmr, idealPlacement(0), heightFor(fmr));
    const fLow = grasp(fmr, idealPlacement(0), septalHeightCm(fmr.septalHeightBaseCm, low));
    expect(dLow.posterior).toBeLessThan(dGood.posterior);
    expect(dGood.posterior - dLow.posterior).toBeGreaterThan(fGood.posterior - fLow.posterior);
    expect(teerOutcome(dmr, [place(dmr, idealPlacement(0), septalHeightCm(dmr.septalHeightBaseCm, low))]).slda.level).not.toBe("low");
  });

  it("functional MR: a short posterior leaflet loses adequate insertion with modest misrotation", () => {
    const s = byId("teer-fmr");
    const aligned = grasp(s, idealPlacement(0), heightFor(s));
    const off = grasp(s, { ...idealPlacement(0), armAngleDeg: 110 }, heightFor(s));
    expect(aligned.posteriorAdequacy).toBe("adequate");
    expect(off.posteriorAdequacy).not.toBe("adequate");
  });

  it("MR grade rounds and clamps to 0–4", () => {
    expect(mrGrade(-1)).toBe(0);
    expect(mrGrade(1.4)).toBe(1);
    expect(mrGrade(1.6)).toBe(2);
    expect(mrGrade(9)).toBe(4);
  });
});

describe("gradient", () => {
  it("rises with each attached device", () => {
    for (const s of TEER_SCENARIOS) {
      const x = mainJet(s).x;
      const g0 = teerOutcome(s, []).gradientMmHg;
      const g1 = teerOutcome(s, [place(s, idealPlacement(x))]).gradientMmHg;
      const g2 = teerOutcome(s, [place(s, idealPlacement(x)), place(s, idealPlacement(x > 0 ? x - 0.35 : x + 0.35))]).gradientMmHg;
      expect(g1).toBeGreaterThan(g0);
      expect(g2).toBeGreaterThan(g1);
    }
  });

  it("is higher for a smaller baseline MVA, before and after the same device", () => {
    const s = byId("teer-p2-flail");
    const small: TeerScenario = { ...s, mvaCm2: 3.5 };
    expect(baselineGradient(small)).toBeGreaterThan(baselineGradient(s));
    const devs = [place(s, idealPlacement(0))];
    expect(teerOutcome(small, devs).gradientMmHg).toBeGreaterThan(teerOutcome(s, devs).gradientMmHg);
    // Orifice relation: halving the area quadruples the gradient at the same flow.
    expect(transmitralGradient(s, 2, 1) / transmitralGradient(s, 4, 1)).toBeCloseTo(4, 9);
  });

  it("small MVA: a narrow device stays under 5 mmHg, a wide device or a second device is flagged", () => {
    const s = byId("teer-small-mva");
    const narrow = teerOutcome(s, [place(s, idealPlacement(0, "narrow"))]);
    const wide = teerOutcome(s, [place(s, idealPlacement(0, "wide"))]);
    const two = teerOutcome(s, [place(s, idealPlacement(0)), place(s, idealPlacement(0.35))]);
    expect(narrow.gradientFlag).toBe(false);
    expect(wide.gradientFlag).toBe(true);
    expect(two.gradientFlag).toBe(true);
    expect(two.stenosis.level).toBe("high");
  });

  it("a single-leaflet attachment neither reduces MR nor narrows the orifice", () => {
    const s = byId("teer-p2-flail");
    const bad = place(s, { ...idealPlacement(0), y: coaptationY(0) + 0.3 });
    expect(bad.grasp.slda).toBe(true);
    const o = teerOutcome(s, [bad]);
    expect(o.mrGrade).toBe(4);
    expect(o.mvaCm2).toBeCloseTo(s.mvaCm2, 9);
    expect(o.slda.level).toBe("high");
  });
});

describe("scoring", () => {
  it("rewards a clean procedure and penalises poor ones", () => {
    const s = byId("teer-small-mva");
    const ts = assessTransseptal("teer", GOOD_FOSSA, s.septalHeightBaseCm, s.heightTargetCm);
    const good = scoreTeer(s, { transseptal: ts, devices: [place(s, idealPlacement(0))], gradeBeforeEachExtraDevice: [], regrasps: 0 });
    expect(good.score).toBeGreaterThanOrEqual(90);
    const bad = scoreTeer(s, {
      transseptal: assessTransseptal("teer", { si: 0.4, ap: 0.7 }, s.septalHeightBaseCm, s.heightTargetCm),
      devices: [place(s, idealPlacement(0, "wide")), place(s, idealPlacement(0.35))],
      gradeBeforeEachExtraDevice: [0],
      regrasps: 5,
    });
    expect(bad.score).toBeLessThan(good.score);
    expect(bad.score).toBeGreaterThanOrEqual(0);
    expect(bad.deductions.length).toBeGreaterThan(2);
  });

  it("is deterministic", () => {
    const s = byId("teer-fmr");
    const a = teerOutcome(s, [place(s, idealPlacement(0))]);
    const b = teerOutcome(s, [place(s, idealPlacement(0))]);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
