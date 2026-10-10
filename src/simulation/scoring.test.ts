import { describe, it, expect } from "vitest";
import { initScore, computeScores, casePassed, defaultTargets } from "./scoring";
import type { ScoreState } from "../types";

const base = (over: Partial<ScoreState> = {}): ScoreState => ({ ...initScore(), ...over });

describe("computeScores — safety gates", () => {
  it("a clean, complete diagnostic study scores well and passes", () => {
    const s = computeScores(
      base({ injections: 3, selectiveInjections: 3, diagnosticInjections: 3, contrastVolume: 25, fluoroTime: 60 }),
      defaultTargets()
    );
    expect(s.safetyScore).toBe(100);
    expect(s.finalScore).toBeGreaterThanOrEqual(65);
    expect(casePassed(s, defaultTargets())).toBe(true);
  });

  it("a dangerous injection caps the final score and fails the case", () => {
    const s = computeScores(base({ injections: 2, diagnosticInjections: 2, dangerousInjections: 1 }), defaultTargets());
    expect(s.finalScore).toBeLessThanOrEqual(55);
    expect(casePassed(s, defaultTargets())).toBe(false);
  });

  it("a dissection is catastrophic — final capped low, case failed", () => {
    const s = computeScores(base({ injections: 2, diagnosticInjections: 2, dissections: 1 }), defaultTargets());
    expect(s.finalScore).toBeLessThanOrEqual(35);
    expect(s.safetyScore).toBeLessThan(60);
    expect(casePassed(s, defaultTargets())).toBe(false);
  });

  it("air embolism and VF are catastrophic and fail the case", () => {
    const air = computeScores(base({ injections: 2, diagnosticInjections: 2, airEmbolisms: 1 }), defaultTargets());
    expect(air.finalScore).toBeLessThanOrEqual(40);
    expect(casePassed(air, defaultTargets())).toBe(false);
    const vf = computeScores(base({ injections: 2, diagnosticInjections: 2, arrhythmias: 1 }), defaultTargets());
    expect(vf.finalScore).toBeLessThanOrEqual(35);
    expect(casePassed(vf, defaultTargets())).toBe(false);
  });

  it("repeated LV entries cap the final score", () => {
    const s = computeScores(base({ injections: 2, diagnosticInjections: 2, lvEntries: 2 }), defaultTargets());
    expect(s.finalScore).toBeLessThanOrEqual(60);
  });

  it("scores are always clamped to 0..100", () => {
    const s = computeScores(base({ dangerousInjections: 9, lvEntries: 9, dissections: 9, contrastVolume: 999, fluoroTime: 9999 }));
    for (const v of [s.safetyScore, s.efficiencyScore, s.anatomyScore, s.finalScore]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe("computeScores: internal analytics only", () => {
  it("hints are logged but not penalised", () => {
    const clean = base({ injections: 3, selectiveInjections: 3, diagnosticInjections: 3, contrastVolume: 25, fluoroTime: 60 });
    const a = computeScores(clean, defaultTargets());
    const b = computeScores({ ...clean, hintsUsed: 6 }, defaultTargets());
    expect(b.efficiencyScore).toBe(a.efficiencyScore);
    expect(b.finalScore).toBe(a.finalScore);
    expect(b.hintsUsed).toBe(6);
  });
});
