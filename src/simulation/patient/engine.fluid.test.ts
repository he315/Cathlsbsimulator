// pci-patient-coupling (from build run 3): fluid() with a negative volume removes it over time like a positive
// volume, instead of the whole volume in one step (Math.min of two negatives), and the workaround of
// proc-hypotension-pressors (a share per tick, fluid(-ml, 1)) keeps its behaviour.
//   npx vitest run src/simulation/patient/engine.fluid.test.ts
import { describe, expect, it } from "vitest";
import { PatientEngine } from "./engine";
import { generatePatient } from "./patient";

const ready = (seed: string) => {
  const e = new PatientEngine({ profile: { ...generatePatient(seed, { indication: "SA" }), lvef: 60 } });
  e.advance(8);
  return e;
};
const vSV = (e: PatientEngine) => e.snapshot().circ.vSV;
const pending = (e: PatientEngine) => e.snapshot().fluidPending.reduce((a, f) => a + f.ml, 0);

describe("fluid() with a negative volume", () => {
  it("removes the volume over its time, at the rate of a positive bolus, not in one step", () => {
    const e = ready("fl-1");
    const v0 = vSV(e);
    e.fluid(-300, 60);
    e.advance(0.1);
    // after 0.1 s about 0.5 mL has gone (300 mL over 60 s), not 300
    expect(v0 - vSV(e)).toBeLessThan(5);
    expect(pending(e)).toBeLessThan(-290);
    e.advance(30);
    expect(pending(e)).toBeGreaterThan(-160);
    expect(pending(e)).toBeLessThan(-140);
    e.advance(40);
    expect(pending(e)).toBe(0);
    expect(e.snapshot().fluidPending).toHaveLength(0);
  });

  it("removes as much as a positive bolus of the same size adds, over the same time", () => {
    const up = ready("fl-2");
    const down = ready("fl-2");
    const u0 = vSV(up);
    const d0 = vSV(down);
    up.fluid(200, 20);
    down.fluid(-200, 20);
    up.advance(10);
    down.advance(10);
    // the venous pool also redistributes, so compare the bolus's own bookkeeping: half is given or taken
    expect(pending(up)).toBeCloseTo(100, 0);
    expect(pending(down)).toBeCloseTo(-100, 0);
    expect(vSV(up)).toBeGreaterThan(u0);
    expect(vSV(down)).toBeLessThan(d0);
  });

  it("the share-per-tick workaround (fluid(-ml, 1) each tick) still takes about the deficit over its time", () => {
    const e = ready("fl-3");
    const map0 = e.vitals().aortaTrue.mean;
    // 2 mL/s for 120 s in 5 s slices, as the fasting cause does
    for (let t = 0; t < 120; t += 5) {
      e.fluid(-10, 1);
      e.advance(5);
    }
    expect(pending(e)).toBe(0);
    expect(e.vitals().aortaTrue.mean).toBeLessThan(map0 - 3);
  });
});
