// One pressure system (diag-pressure-transducer), at the engine: the tip state of a deep JR4 seat
// with and without side holes, transducer faults and their remedies, a plug in the lumen, and the
// aortic stenosis pulse that is not damping.
//   npx vitest run src/simulation/patient/pressureTransducer.test.ts
import { describe, expect, it } from "vitest";
import { PatientEngine, SAMPLE_HZ } from "./engine";
import { MP_FAULT_AIR_ML, MP_FAULT_DRIFT_MMHG, MP_FAULT_LOW_CM, MMHG_PER_CM, TRANSDUCER_FAULTS, Transducer, tipFromEngagement, type TipInput } from "./transducer";
import { NORMAL_PATIENT, Circulation, orificeCoefficient } from "../circulation";
import { catheterSideHoles, catheterById, sideHoleBase, CATHETERS } from "../../data/catheters";
import type { EngagementState } from "../../types";

const SEED = "probe";

function engineWith(tip: TipInput, o: { seed?: string; ava?: number } = {}): PatientEngine {
  const e = new PatientEngine({ seed: o.seed ?? SEED, aorticValveAreaCm2: o.ava });
  e.setTip(tip);
  e.advance(4);
  return e;
}

const pulse = (e: PatientEngine) => {
  const a = e.vitals().art!;
  return a.sys - a.dia;
};

/** A deep right coronary seat of a JR4 in the legacy classifier's terms. */
const deepRca = { kind: "deep-rca", target: "right", isDeep: true, isSelective: true, conus: false, depth: 3, quality: 0.8 } as unknown as EngagementState;

describe("the tip state of a JR4 and its side-hole variant", () => {
  it("TipInput with gap 0.1 and a JR4 gives tipState 'ventricularised'; with sideHoles true it gives 'aortic'", () => {
    const jr4 = tipFromEngagement(deepRca, catheterSideHoles("JR4"));
    expect(jr4).toMatchObject({ location: "ostium", side: "right", gap: 0.1, sideHoles: false });
    expect(engineWith(jr4).vitals().tipState).toBe("ventricularised");
    const sh = tipFromEngagement(deepRca, catheterSideHoles("JR4-SH"));
    expect(sh.sideHoles).toBe(true);
    expect(engineWith(sh).vitals().tipState).toBe("aortic");
  });

  it("the catalogue has the side-hole JR4 after the JR4, with the same curve; the universal radial curve has a side hole (Oxford)", () => {
    const i = CATHETERS.findIndex((c) => c.id === "JR4");
    expect(CATHETERS[i + 1].id).toBe("JR4-SH");
    expect(catheterById("JR4-SH")!.behaviour).toEqual(catheterById("JR4")!.behaviour);
    expect(sideHoleBase("JR4-SH")).toBe("JR4");
    expect(sideHoleBase("JR4")).toBeNull();
    expect(catheterSideHoles("TIG")).toBe(true);
    expect(catheterSideHoles("JL4")).toBe(false);
  });
});

describe("transducer faults and their remedies", () => {
  it("fault 'air-bubble' lowers natural frequency and displayed pulse pressure; fast flush and re-prime restore it", () => {
    const e = engineWith({ location: "aorta" });
    const fn0 = e.vitals().transducer.fnHz;
    const pp0 = pulse(e);
    expect(e.transducer.faults()).toEqual([]);
    e.transducer.setFault("air-bubble");
    expect(e.transducer.st.airMl).toBe(MP_FAULT_AIR_ML);
    expect(e.transducer.faults()).toEqual(["air-bubble"]);
    e.advance(5);
    const fn1 = e.vitals().transducer.fnHz;
    const pp1 = pulse(e);
    expect(fn1).toBeLessThan(fn0 / 3);
    expect(pp1).toBeLessThan(pp0 - 10);
    // the true tip is unchanged: the fault is in the line
    expect(e.vitals().tipState).toBe("aortic");
    // fast flush: the square-wave test shows on the trace (the flush bag pressure), then re-prime
    e.transducer.fastFlush();
    e.advance(0.2);
    expect(e.trace.art[e.trace.idx(0)]).toBeGreaterThan(200);
    e.advance(1);
    e.transducer.reprime();
    expect(e.transducer.faults()).toEqual([]);
    e.advance(5);
    expect(e.vitals().transducer.fnHz).toBeCloseTo(fn0, 6);
    expect(Math.abs(pulse(e) - pp0)).toBeLessThan(3);
  });

  it("a fast flush by itself leaves the air in the line", () => {
    const tr = new Transducer();
    tr.setFault("air-bubble");
    tr.fastFlush();
    for (let i = 0; i < 4000; i++) tr.step(0.0004, 100);
    expect(tr.faults()).toEqual(["air-bubble"]);
  });

  it("'off' flattens the trace at the held pressure, 'disconnected' reads atmosphere, 'unzeroed' and 'low' offset it; each remedy clears its fault", () => {
    expect([...TRANSDUCER_FAULTS]).toEqual(["air-bubble", "off", "disconnected", "unzeroed", "low", "high"]);
    const e = engineWith({ location: "aorta" });
    e.transducer.zero();
    e.advance(2);
    const base = e.vitals().art!;
    // switched off to the patient: no pulse
    e.transducer.setFault("off");
    e.advance(4);
    expect(pulse(e)).toBeLessThan(2);
    e.transducer.turnToPatient();
    e.advance(4);
    expect(Math.abs(pulse(e) - (base.sys - base.dia))).toBeLessThan(3);
    // disconnected: a flat line near zero
    e.transducer.setFault("disconnected");
    e.advance(4);
    expect(e.vitals().art!.sys).toBeLessThan(5);
    e.transducer.reconnect();
    // unzeroed: the reading carries an offset until zeroed
    e.transducer.setFault("unzeroed");
    e.advance(4);
    expect(e.vitals().art!.mean - base.mean).toBeGreaterThan(MP_FAULT_DRIFT_MMHG - 4);
    expect(e.transducer.faults()).toEqual(["unzeroed"]);
    e.transducer.zero();
    expect(e.transducer.faults()).toEqual([]);
    // low: reads high by the hydrostatic column until levelled (against the true aortic mean of the same beats)
    const offset = () => e.vitals().art!.mean - e.vitals().aortaTrue.mean;
    e.advance(4);
    const off0 = offset();
    e.transducer.setFault("low");
    e.advance(4);
    expect(offset() - off0).toBeCloseTo(MP_FAULT_LOW_CM * MMHG_PER_CM, 0);
    expect(e.transducer.faults()).toEqual(["low"]);
    e.transducer.level();
    e.advance(4);
    expect(Math.abs(offset() - off0)).toBeLessThan(1);
    expect(e.transducer.faults()).toEqual([]);
    // high: set above the axis it reads low, and is reported as 'high', not 'low'
    e.transducer.setFault("high");
    e.advance(4);
    expect(offset() - off0).toBeCloseTo(-MP_FAULT_LOW_CM * MMHG_PER_CM, 0);
    expect(e.transducer.faults()).toEqual(["high"]);
    e.transducer.level();
    expect(e.transducer.faults()).toEqual([]);
  });

  it("a plug in the lumen damps the displayed trace without changing the tip state, and is not a line fault", () => {
    const e = engineWith({ location: "aorta" });
    const pp0 = pulse(e);
    e.transducer.setLumenPlug(true);
    e.advance(5);
    expect(pulse(e)).toBeLessThan(pp0 / 3);
    expect(e.vitals().tipState).toBe("aortic");
    expect(e.transducer.faults()).toEqual([]);
    e.transducer.setLumenPlug(false);
    e.advance(5);
    expect(Math.abs(pulse(e) - pp0)).toBeLessThan(3);
  });

  it("an old snapshot without the fault fields restores to a working line", () => {
    const tr = new Transducer();
    tr.restore({ heightCm: 0, drift: 0, zeroRef: 0, zeroed: true, airMl: 0, contrastFrac: 0, flushing: false, openToAir: false, x: 80, v: 0 });
    expect(tr.faults()).toEqual([]);
    let out = 0;
    for (let i = 0; i < 2000; i++) out = tr.step(0.0004, 100);
    expect(out).toBeCloseTo(100, 0);
  });
});

/** Seconds from the foot of each upstroke (10% of the pulse) to the peak of the true aortic pressure, median over the last beats. */
function upstrokeS(e: PatientEngine): number {
  const tr = e.trace;
  const n = Math.min(tr.count, SAMPLE_HZ * 4);
  const xs: number[] = [];
  for (let k = n - 1; k >= 0; k--) xs.push(tr.aoTrue[tr.idx(k)]);
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  const foot = lo + 0.1 * (hi - lo);
  const out: number[] = [];
  for (let i = 1; i < xs.length; i++) {
    if (xs[i - 1] < foot && xs[i] >= foot) {
      let best = i;
      for (let j = i; j < Math.min(xs.length, i + SAMPLE_HZ * 0.5); j++) if (xs[j] > xs[best]) best = j;
      if (best < xs.length - 1) out.push((best - i) / SAMPLE_HZ);
    }
  }
  out.sort((a, b) => a - b);
  return out[Math.floor(out.length / 2)];
}

describe("aortic stenosis: a slow, small pulse that is not damping", () => {
  it("valve area 0.7 cm2 gives a later aortic peak and lower pulse than 3 cm2 and tipState stays 'aortic'", () => {
    for (const tip of [{ location: "aorta" } as TipInput, { location: "ostium", side: "left", gap: 0.8 } as TipInput]) {
      const severe = engineWith(tip, { ava: 0.7 });
      const normal = engineWith(tip, { ava: 3 });
      expect(severe.aorticValveAreaCm2).toBe(0.7);
      expect(upstrokeS(severe)).toBeGreaterThan(upstrokeS(normal) + 0.03);
      expect(pulse(severe)).toBeLessThan(pulse(normal) - 5);
      expect(severe.vitals().aortaTrue.sys).toBeLessThan(normal.vitals().aortaTrue.sys);
      expect(severe.vitals().tipState).toBe("aortic");
      expect(normal.vitals().tipState).toBe("aortic");
    }
  });

  it("an unset valve area leaves the circulation as it was (the default is unchanged)", () => {
    const a = new Circulation({ ...NORMAL_PATIENT });
    const b = new Circulation({ ...NORMAL_PATIENT, avaCm2: undefined });
    a.run(4);
    b.run(4);
    expect(a.average(2)).toEqual(b.average(2));
    const e = new PatientEngine({ seed: SEED });
    expect(e.aorticValveAreaCm2).toBeNull();
    // the Bernoulli coefficient: (ρ/2)/133.322 per (100·A)², about 4 mmHg per (m/s)²
    expect(orificeCoefficient(1) * 100 ** 2).toBeCloseTo(3.975, 2);
    e.setAorticValveArea(0.8);
    expect(e.aorticValveAreaCm2).toBe(0.8);
    e.setAorticValveArea(null);
    expect(e.aorticValveAreaCm2).toBeNull();
  });
});
