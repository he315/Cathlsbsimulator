import { describe, it, expect } from "vitest";
import {
  CONTRAST_DENSITY,
  CONTRAST_VISCOSITY,
  CONTRAST_VISCOSITY_USED,
  ECCENTRIC_FLOW_GAIN,
  HAND_RISE_S,
  Injector,
  LUMENS,
  MAX_HAND_FORCE_N,
  MAX_HAND_PRESSURE_PSI,
  OPERATOR_DELAY_S,
  SYRINGE_BORE_MM,
  PSI,
  PUFF,
  STANDARD_PUSH_S,
  SYRINGE_ML,
  TARGET_FLOW_ML_S,
  TRACE_DT,
  circuitFor,
  deadVolumeMl,
  flowForForce,
  forceForFlow,
  laminarResistance,
  lumenFillAt,
  lumenForFrench,
  lumenObstruction,
  maxHandForce,
  planTrace,
  pressureForFlow,
  standardPlan,
  traceAt,
} from "./injection";

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

describe("catheter hydraulics", () => {
  it("uses Poiseuille's resistance for an open lumen", () => {
    // 6 Fr guide: 1.80 mm, 100 cm, 10.4 mPa s -> 128 mu L / (pi d^4), in Pa per mL/s
    const expected = (128 * 10.4e-3 * 1.0) / (Math.PI * Math.pow(1.8e-3, 4)) * 1e-6;
    expect(laminarResistance(1.8, 1000, 10.4e-3)).toBeCloseTo(expected, 3);
    // d^4: halving the diameter multiplies the resistance by 16
    expect(laminarResistance(0.9, 1000) / laminarResistance(1.8, 1000)).toBeCloseTo(16, 6);
  });

  it("a wire or device shaft in the lumen raises the resistance, by less than the concentric annulus", () => {
    const open = laminarResistance(1.8, 1000);
    const wire = laminarResistance(1.8, 1000, CONTRAST_VISCOSITY_USED, lumenObstruction(true, false));
    const both = laminarResistance(1.8, 1000, CONTRAST_VISCOSITY_USED, lumenObstruction(true, true));
    expect(wire).toBeGreaterThanOrEqual(open);
    expect(both).toBeGreaterThan(wire);
    // concentric annulus for the wire plus shaft
    const R = 0.9e-3,
      a = lumenObstruction(true, true) / 2000;
    const g = Math.pow(R, 4) - Math.pow(a, 4) - Math.pow(R * R - a * a, 2) / Math.log(R / a);
    const concentric = ((8 * CONTRAST_VISCOSITY_USED * 1.0) / (Math.PI * g)) * 1e-6;
    expect(both).toBeCloseTo(Math.max(open, concentric / ECCENTRIC_FLOW_GAIN), 3);
  });

  it("hand-injection flow is laminar in every lumen (Reynolds number below 2000)", () => {
    for (const l of Object.values(LUMENS)) {
      const cc = circuitFor(l);
      const q = flowForForce(cc, maxHandForce(cc)) * 1e-6; // m^3/s
      const A = Math.PI * Math.pow(l.idMm / 2000, 2);
      const re = (CONTRAST_DENSITY * (q / A) * (l.idMm / 1000)) / CONTRAST_VISCOSITY_USED;
      expect(re).toBeLessThan(2000);
      expect(re).toBeGreaterThan(50);
    }
  });

  it("the vendor's dye-flow figure for the 6 Fr diagnostic lumen implies a viscosity between the label's 37 and 20 deg C values", () => {
    // 28 mL/s at 600 psi through 0.056 inch x 100 cm (facts/I1.md): Poiseuille's effective viscosity
    const d = 1.4224e-3;
    const mu = (600 * PSI * Math.PI * Math.pow(d, 4)) / (128 * 1.0 * 28e-6);
    expect(mu).toBeGreaterThan(CONTRAST_VISCOSITY.at37C);
    expect(mu).toBeLessThan(CONTRAST_VISCOSITY.at20C);
  });

  it("force, pressure and flow are consistent and capped by the hand", () => {
    const cc = circuitFor(LUMENS["guide-6"]);
    const f = forceForFlow(cc, 3);
    expect(flowForForce(cc, f)).toBeCloseTo(3, 6);
    expect(pressureForFlow(cc, 3)).toBeGreaterThan(cc.pTip);
    expect(maxHandForce(cc) / cc.area / PSI).toBeCloseTo(MAX_HAND_PRESSURE_PSI, 6);
    // a guide passes far more for the same push than a diagnostic catheter
    const fd = circuitFor(LUMENS["diag-6"]);
    expect(flowForForce(cc, 40)).toBeGreaterThan(2 * flowForForce(fd, 40));
  });

  it("the hand's limit is a force: 50 psi on the 10 mL control syringe, more pressure through a narrower barrel", () => {
    expect(MAX_HAND_FORCE_N).toBeCloseTo(MAX_HAND_PRESSURE_PSI * PSI * Math.PI * (SYRINGE_BORE_MM / 2000) ** 2, 9);
    const wide = planTrace({ ...standardPlan("left", LUMENS["diag-5"]), forceN: MAX_HAND_FORCE_N });
    const narrow = planTrace({ ...standardPlan("left", LUMENS["diag-5"]), forceN: MAX_HAND_FORCE_N, syringeBoreMm: 8.7, volumeMl: 3 });
    expect(wide.peakPsi).toBeLessThanOrEqual(MAX_HAND_PRESSURE_PSI + 1e-9);
    expect(narrow.peakPsi).toBeGreaterThan(2 * wide.peakPsi);
    expect(Math.max(...narrow.q)).toBeGreaterThan(1.5 * Math.max(...wide.q));
  });

  it("a 5 Fr diagnostic lumen holds the hand to about 1.4 mL/s with the 10 mL syringe (model limitation, facts/I1.md)", () => {
    const tr = planTrace(standardPlan("left", LUMENS["diag-5"]));
    expect(Math.max(...tr.q)).toBeGreaterThan(1.2);
    expect(Math.max(...tr.q)).toBeLessThan(1.7);
    expect(tr.peakPsi).toBeGreaterThan(0.9 * MAX_HAND_PRESSURE_PSI);
  });

  it("dead volumes follow the lumens", () => {
    expect(deadVolumeMl(LUMENS["guide-6"])).toBeCloseTo((Math.PI * 0.9 * 0.9 * 1000) / 1000, 6);
    expect(deadVolumeMl(LUMENS["diag-5"])).toBeLessThan(deadVolumeMl(LUMENS["diag-6"]));
    expect(lumenForFrench(5).idMm).toBe(LUMENS["diag-5"].idMm);
    expect(lumenForFrench(6).idMm).toBe(LUMENS["guide-6"].idMm);
    expect(lumenForFrench(6, false).idMm).toBe(LUMENS["diag-6"].idMm);
  });
});

describe("planned injections", () => {
  it("no flow during the operator's delay, then the push, then the flow stops", () => {
    const tr = planTrace(standardPlan("left", LUMENS["guide-6"]));
    const nDelay = Math.round(OPERATOR_DELAY_S / TRACE_DT);
    expect(Math.max(...tr.q.slice(0, nDelay))).toBe(0);
    expect(tr.q[nDelay + Math.round((3 * HAND_RISE_S) / TRACE_DT)]).toBeGreaterThan(0.8 * TARGET_FLOW_ML_S.left);
    expect(tr.pushStart).toBeCloseTo(OPERATOR_DELAY_S, 6);
    expect(tr.pushEnd!).toBeCloseTo(OPERATOR_DELAY_S + STANDARD_PUSH_S, 1);
    expect(tr.q[tr.q.length - 1]).toBeLessThan(1e-3);
    // volume accounting
    expect(tr.volumeMl).toBeCloseTo(sum(tr.q) * TRACE_DT, 6);
    expect(tr.contrastMl).toBeCloseTo(tr.volumeMl, 6); // primed with contrast
  });

  it("the flow stops within a few tenths of a second of the push: no syringe tail", () => {
    const tr = planTrace(standardPlan("left", LUMENS["guide-6"]));
    const plateau = TARGET_FLOW_ML_S.left;
    const at = (t: number) => traceAt(tr, t).q;
    expect(at(tr.pushEnd! - 0.05)).toBeGreaterThan(0.9 * plateau);
    expect(at(tr.pushEnd! + 0.3)).toBeLessThan(0.05 * plateau);
    expect(tr.tailMl!).toBeGreaterThan(0);
    expect(tr.tailMl!).toBeLessThan(0.5);
    // push and release volumes add up to the total
    let push = 0;
    for (let i = 0; i < tr.q.length; i++) if (i * TRACE_DT < tr.pushEnd!) push += tr.q[i] * TRACE_DT;
    expect(push + tr.tailMl!).toBeCloseTo(tr.volumeMl, 2);
  });

  it("the lumen fills from the hub as its dead volume is pushed", () => {
    const tr = planTrace({ ...standardPlan("left", LUMENS["guide-6"]), primed: 0 });
    expect(lumenFillAt(tr, 0.1)).toEqual({ front: 0, behind: 1, ahead: 0 });
    const mid = lumenFillAt(tr, OPERATOR_DELAY_S + 0.35);
    expect(mid.front).toBeGreaterThan(0.2);
    expect(mid.front).toBeLessThan(0.9);
    expect(lumenFillAt(tr, OPERATOR_DELAY_S + 1.5).front).toBe(1);
    expect(tr.deadMl).toBeCloseTo(deadVolumeMl(LUMENS["guide-6"]), 9);
  });

  it("standard volumes sit inside the label's 3-14 mL per coronary injection", () => {
    for (const side of ["left", "right"] as const) {
      const tr = planTrace(standardPlan(side, LUMENS["guide-6"]));
      expect(tr.volumeMl).toBeGreaterThan(3);
      expect(tr.volumeMl).toBeLessThan(14);
      expect(tr.peakPsi).toBeLessThanOrEqual(MAX_HAND_PRESSURE_PSI + 1e-9);
    }
    expect(planTrace(standardPlan("left", LUMENS["guide-6"])).volumeMl).toBeGreaterThan(planTrace(standardPlan("right", LUMENS["guide-6"])).volumeMl);
  });

  it("a diagnostic catheter limits the flow the hand can reach", () => {
    const g = planTrace(standardPlan("left", LUMENS["guide-6"]));
    const d = planTrace(standardPlan("left", LUMENS["diag-6"]));
    expect(Math.max(...g.q)).toBeCloseTo(TARGET_FLOW_ML_S.left, 1);
    expect(Math.max(...d.q)).toBeLessThan(TARGET_FLOW_ML_S.left);
    expect(d.peakPsi).toBeGreaterThan(g.peakPsi);
  });

  it("a test puff is a few millilitres and short; a forceful injection pushes more", () => {
    const puff = planTrace({ kind: "puff", side: "left", catheter: LUMENS["guide-6"] });
    const std = planTrace(standardPlan("left", LUMENS["guide-6"]));
    const hard = planTrace({ kind: "forceful", side: "left", catheter: LUMENS["guide-6"] });
    expect(puff.volumeMl).toBeCloseTo(PUFF.volumeMl, 2);
    expect(puff.q.length).toBeLessThan(std.q.length);
    expect(Math.max(...hard.q)).toBeGreaterThan(1.2 * Math.max(...std.q));
    expect(hard.volumeMl).toBeLessThanOrEqual(SYRINGE_ML + 1e-9);
  });

  it("a saline-filled lumen delivers its dead volume before any contrast", () => {
    const tr = planTrace({ ...standardPlan("left", LUMENS["guide-6"]), primed: 0 });
    const dead = deadVolumeMl(LUMENS["guide-6"]);
    let v = 0;
    let firstContrast = -1;
    for (let i = 0; i < tr.q.length; i++) {
      v += tr.q[i] * TRACE_DT;
      if (firstContrast < 0 && tr.c[i] > 0.5) firstContrast = v;
    }
    expect(firstContrast).toBeGreaterThan(dead * 0.95);
    expect(tr.contrastMl).toBeCloseTo(tr.volumeMl - dead, 1);
  });

  it("traceAt interpolates and is zero outside a finished trace", () => {
    const tr = planTrace(standardPlan("left", LUMENS["guide-6"]));
    const i = 150;
    expect(traceAt(tr, (i + 0.5) * TRACE_DT).q).toBeCloseTo(0.5 * (tr.q[i] + tr.q[i + 1]), 9);
    expect(traceAt(tr, -1).q).toBe(0);
    expect(traceAt(tr, 100).q).toBe(0);
  });
});

describe("the lab's syringe (Injector)", () => {
  const run = (inj: Injector, t0: number, until: number, releaseAt: number | null) => {
    for (let t = t0; t <= until + 1e-9; t += 1 / 60) {
      if (releaseAt !== null && t >= releaseAt) inj.release(t);
      inj.advance(t);
    }
  };

  it("a press is a standard injection", () => {
    const inj = new Injector(LUMENS["guide-6"]);
    inj.start(10, { kind: "standard", side: "left" });
    run(inj, 10, 14, 10.1);
    const tr = inj.trace!;
    expect(tr.pushEnd!).toBeCloseTo(OPERATOR_DELAY_S + STANDARD_PUSH_S, 1);
    expect(inj.done()).toBe(true);
    inj.finish();
    expect(inj.stats.injections).toBe(1);
    expect(inj.stats.totalMl).toBeCloseTo(planTrace(standardPlan("left", LUMENS["guide-6"])).volumeMl, 0);
  });

  it("holding pushes for longer, until release or until the syringe is empty", () => {
    const a = new Injector(LUMENS["guide-6"]);
    a.start(0, { kind: "standard", side: "left" });
    run(a, 0, 5, 2.6);
    expect(a.trace!.pushEnd!).toBeCloseTo(2.6, 1);
    expect(a.trace!.volumeMl).toBeGreaterThan(planTrace(standardPlan("left", LUMENS["guide-6"])).volumeMl);
    const b = new Injector(LUMENS["guide-6"]);
    b.start(0, { kind: "held", side: "left" });
    run(b, 0, 8, null); // never released: the 10 mL syringe empties
    expect(b.trace!.empty).toBe(true);
    expect(b.trace!.volumeMl).toBeCloseTo(SYRINGE_ML, 1);
    const tail = b.trace!.q.slice(-20);
    expect(Math.max(...tail)).toBe(0);
  });

  it("books volume per run, counts puffs apart and primes the lumen", () => {
    const inj = new Injector(LUMENS["guide-6"], { primed: 0 });
    inj.start(0, { kind: "puff", side: "left" });
    run(inj, 0, 3, 0.05);
    inj.finish();
    expect(inj.stats.puffs).toBe(1);
    expect(inj.stats.totalMl).toBeCloseTo(PUFF.volumeMl, 1);
    // 2 mL puff into a 2.5 mL lumen: most of it now holds contrast
    expect(inj.primed).toBeGreaterThan(0.7);
    expect(inj.primed).toBeLessThan(1);
    inj.start(5, { kind: "standard", side: "left" });
    run(inj, 5, 9, 5.05);
    inj.finish();
    expect(inj.primed).toBe(1);
    expect(inj.stats.injections).toBe(1);
    // the release volume is booked apart from the push
    expect(inj.stats.last!.tailMl).toBeGreaterThan(0);
    expect(inj.stats.last!.tailMl).toBeLessThan(0.5);
    expect(inj.stats.last!.volumeMl).toBeGreaterThan(5);
    inj.flush();
    expect(inj.primed).toBe(0);
  });

  it("the live trace grows in real time from the press", () => {
    const inj = new Injector(LUMENS["guide-6"]);
    const tr = inj.start(0, { kind: "standard", side: "right" });
    inj.advance(0.25);
    expect(tr.q.length).toBe(Math.floor(0.25 / TRACE_DT + 1e-9));
    expect(Math.max(...tr.q)).toBe(0); // still inside the operator's delay
    inj.advance(1.0);
    expect(Math.max(...tr.q)).toBeGreaterThan(0);
    expect(inj.elapsed(1.0)).toBeCloseTo(1.0, 9);
  });
});
