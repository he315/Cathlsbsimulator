// The power injector (diag-lv-aorta-task): the air check before arming, the delivered volume and peak
// rate, the rise, the pressure limit and the operator's stop.
//   npx vitest run src/simulation/powerInjector.test.ts
import { describe, expect, it } from "vitest";
import { LUMENS, TRACE_DT } from "./injection";
import { deliveredBy, flowAtPressureLimit, MP_POWER_INJECTOR, peakFlow, plannedTrace, PowerInjector, pressurePsiFor } from "./powerInjector";

const lumen = LUMENS["diag-6"];

describe("arming", () => {
  it("arming without the air check is refused; after the purge it arms", () => {
    const inj = new PowerInjector(lumen);
    expect(inj.arm()).toBe(false);
    expect(inj.lastRefusal).toBe("air-check");
    expect(inj.fire(0)).toBeNull();
    inj.purge();
    expect(inj.arm()).toBe(true);
    expect(inj.armed).toBe(true);
    expect(inj.lastRefusal).toBeNull();
  });

  it("arming with no catheter connected is refused", () => {
    const inj = new PowerInjector(null);
    inj.purge();
    expect(inj.arm()).toBe(false);
    expect(inj.lastRefusal).toBe("no-lumen");
  });

  it("after an injection the air check is due again", () => {
    const inj = new PowerInjector(lumen);
    inj.set({ volumeMl: 5, rateMlS: 10, riseS: 0 });
    inj.purge();
    inj.arm();
    inj.fire(0);
    inj.advance(5);
    expect(inj.state).toBe("done");
    inj.reset();
    expect(inj.arm()).toBe(false);
    expect(inj.lastRefusal).toBe("air-check");
  });

  it("changing the settings disarms an armed injector (it must be armed again)", () => {
    const inj = new PowerInjector(lumen);
    inj.purge();
    inj.arm();
    inj.set({ volumeMl: 35 });
    expect(inj.armed).toBe(false);
    expect(inj.arm()).toBe(true);
  });
});

describe("delivery", () => {
  it("30 mL at 10 mL/s with a 0.5 s rise matches the volume and the peak rate", () => {
    const inj = new PowerInjector(lumen);
    inj.set({ volumeMl: 30, rateMlS: 10, riseS: 0.5 });
    inj.purge();
    expect(inj.arm()).toBe(true);
    const shot = inj.fire(12)!;
    expect(shot).not.toBeNull();
    const tr = shot.trace;
    expect(shot.pressureLimited).toBe(false);
    expect(tr.volumeMl).toBeCloseTo(30, 6);
    expect(deliveredBy(tr, 60)).toBeCloseTo(30, 6);
    expect(peakFlow(tr)).toBeCloseTo(10, 6);
    // the rise: half the rate a quarter of a second into the push, the full rate after 0.5 s
    const i = (s: number) => Math.round((tr.pushStart + s) / TRACE_DT);
    expect(tr.q[i(0.25)]).toBeCloseTo(5, 0);
    expect(tr.q[i(0.6)]).toBeCloseTo(10, 6);
    // 30 mL at 10 mL/s with a linear 0.5 s rise lasts 3.25 s
    expect((tr.pushEnd ?? 0) - tr.pushStart).toBeCloseTo(3.25, 1);
    // the injector reports firing until the push is over
    expect(inj.pushing(12 + tr.pushStart + 1)).toBe(true);
    inj.advance(12 + (tr.pushEnd ?? 0) + 0.01);
    expect(inj.state).toBe("done");
  });

  it("the pressure limit caps the rate at the flow that reaches it through the lumen", () => {
    const q20 = pressurePsiFor(lumen, 20);
    const limit = q20 * 0.6;
    const { trace, pressureLimited } = plannedTrace({ volumeMl: 20, rateMlS: 20, riseS: 0, pressureLimitPsi: Math.max(MP_POWER_INJECTOR.pressureLimitPsi.min, limit) }, lumen);
    if (limit >= MP_POWER_INJECTOR.pressureLimitPsi.min) {
      expect(pressureLimited).toBe(true);
      expect(peakFlow(trace)).toBeCloseTo(flowAtPressureLimit(lumen, limit), 6);
      expect(trace.peakPsi).toBeLessThanOrEqual(limit + 1e-6);
      expect(trace.volumeMl).toBeCloseTo(20, 6);
    }
    // a 5 Fr lumen needs more pressure for the same flow than a 6 Fr one
    expect(pressurePsiFor(LUMENS["diag-5"], 10)).toBeGreaterThan(pressurePsiFor(lumen, 10));
  });

  it("stop() cuts the injection: the volume is what had gone", () => {
    const inj = new PowerInjector(lumen);
    inj.set({ volumeMl: 30, rateMlS: 10, riseS: 0 });
    inj.purge();
    inj.arm();
    const shot = inj.fire(0)!;
    const start = shot.trace.pushStart;
    inj.stop(start + 1);
    expect(shot.stopped).toBe(true);
    expect(shot.trace.volumeMl).toBeCloseTo(10, 0);
    expect(inj.state).toBe("done");
  });
});
