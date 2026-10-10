// The bedside reading of the fast-flush test (haemo-transducer-and-setup): visible oscillations and
// natural frequency, added beside Transducer.dynamic() without changing it.
//   npx vitest run src/simulation/patient/transducer.flush.test.ts
import { describe, expect, it } from "vitest";
import { DEFAULT_LINE, FLUSH_MIN_FN_HZ, MP_DAMPING_GAIN, MP_FLUSH_VISIBLE, Transducer, fastFlushReading, flushOscillations, type Dynamic } from "./transducer";

const dyn = (fnHz: number, zeta: number): Dynamic => ({ fnHz, zeta, amplitudeRatio: zeta < 1 ? Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta)) : 0, verdict: "optimal" });

describe("fastFlushReading", () => {
  it("no visible oscillation reads overdamped; more than two, or a natural frequency under 24 Hz, underdamped; else optimal", () => {
    expect(fastFlushReading(dyn(30, 0.76)).reading).toBe("overdamped");
    expect(fastFlushReading(dyn(30, 1.5)).reading).toBe("overdamped");
    expect(fastFlushReading(dyn(30, 0.4)).reading).toBe("optimal");
    expect(fastFlushReading(dyn(30, 0.2)).reading).toBe("underdamped");
    expect(fastFlushReading(dyn(FLUSH_MIN_FN_HZ - 1, 0.4)).reading).toBe("underdamped");
  });

  it("counts the extrema at least MP_FLUSH_VISIBLE of the step", () => {
    const d = dyn(30, 0.4);
    const n = flushOscillations(d);
    expect(d.amplitudeRatio ** n).toBeGreaterThanOrEqual(MP_FLUSH_VISIBLE);
    expect(d.amplitudeRatio ** (n + 1)).toBeLessThan(MP_FLUSH_VISIBLE);
    // the top of the optimal damping band shows none
    expect(flushOscillations(dyn(30, 0.75))).toBe(0);
  });

  it("a line's own damping gain scales the damping only; without it MP_DAMPING_GAIN applies", () => {
    const base = new Transducer(DEFAULT_LINE).dynamics();
    expect(new Transducer({ ...DEFAULT_LINE, dampingGain: MP_DAMPING_GAIN }).dynamics()).toEqual(base);
    const half = new Transducer({ ...DEFAULT_LINE, dampingGain: MP_DAMPING_GAIN / 2 }).dynamics();
    expect(half.wn).toBe(base.wn);
    expect(half.zeta).toBeCloseTo(base.zeta / 2, 10);
  });

  it("stepWith() with the line's dynamics gives exactly what step() gives", () => {
    const a = new Transducer(DEFAULT_LINE);
    const b = new Transducer(DEFAULT_LINE);
    a.fastFlush();
    b.fastFlush();
    const { wn, zeta } = b.dynamics();
    for (let i = 0; i < 2000; i++) {
      const p = 20 + 10 * Math.sin(i / 50);
      expect(b.stepWith(0.0005, p, wn, zeta)).toBe(a.step(0.0005, p));
    }
  });

  it("dynamic() is unchanged for the diagnostic lab's default line", () => {
    const d = new Transducer(DEFAULT_LINE).dynamic();
    expect(d.fnHz).toBeCloseTo(24.3, 1);
    expect(d.zeta).toBeCloseTo(0.246, 2);
    expect(d.verdict).toBe("underdamped");
  });
});
