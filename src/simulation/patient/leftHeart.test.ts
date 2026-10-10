// The left heart in the circulation and the patient engine (diag-lv-aorta-task): mitral and aortic
// regurgitant conductances, atrial contraction (the a wave before the LVEDP), the valve's opening, and
// defaults that leave every other lab unchanged.
//   npx vitest run src/simulation/patient/leftHeart.test.ts
import { describe, expect, it } from "vitest";
import { atrialActivation, ATRIAL_CONTRACTION, Circulation, NORMAL_PATIENT } from "../circulation";
import { PatientEngine } from "./engine";

const lastSv = (e: PatientEngine): number => {
  const b = e.snapshot().beats;
  return b[b.length - 1].sv;
};

describe("circulation.ts", () => {
  it("defaults: a patient without the new fields beats as before (no regurgitant flows reported)", () => {
    const a = new Circulation({ ...NORMAL_PATIENT });
    a.run(6);
    expect(a.lastInfo!.F.mr).toBeUndefined();
    expect(a.lastInfo!.F.ar).toBeUndefined();
  });

  it("a mitral regurgitant conductance moves blood back to the atrium in systole and lowers forward output", () => {
    const base = new Circulation({ ...NORMAL_PATIENT });
    base.run(12);
    const mr = new Circulation({ ...NORMAL_PATIENT, mrConductance: 1.2 });
    let regurg = 0;
    mr.run(12, (_t, info) => {
      regurg += (info.F.mr ?? 0) * 0.004;
    });
    expect(regurg).toBeGreaterThan(20);
    expect(mr.average(3)!.nativeCO).toBeLessThan(base.average(3)!.nativeCO);
    expect(mr.average(3)!.pcwp).toBeGreaterThan(base.average(3)!.pcwp);
  });

  it("an aortic regurgitant conductance widens the pulse pressure", () => {
    const base = new Circulation({ ...NORMAL_PATIENT });
    base.run(12);
    const ar = new Circulation({ ...NORMAL_PATIENT, arConductance: 1.5 });
    ar.run(12);
    expect(ar.average(3)!.dia).toBeLessThan(base.average(3)!.dia);
  });

  it("atrial contraction falls in late diastole and raises the end-diastolic pressure", () => {
    const rr = 60 / 70;
    expect(atrialActivation(0.1, rr)).toBe(0);
    expect(atrialActivation(rr - ATRIAL_CONTRACTION.leadS + ATRIAL_CONTRACTION.durS / 2, rr)).toBeCloseTo(1, 6);
    expect(atrialActivation(rr - 0.01, rr)).toBe(0);
    const base = new Circulation({ ...NORMAL_PATIENT });
    base.run(10);
    const kick = new Circulation({ ...NORMAL_PATIENT, atrialKickMmHg: 6 });
    kick.run(10);
    expect(kick.average(3)!.lvedp).toBeGreaterThan(base.average(3)!.lvedp + 0.3);
  });
});

describe("PatientEngine", () => {
  it("by default nothing changes: no MR, no atrial contraction, no left-heart beat", () => {
    const e = new PatientEngine({ seed: "lv-task-default" });
    e.advance(5);
    expect(e.mitralRegurgitation).toBe(0);
    expect(e.atrialContraction).toBe(false);
    expect(e.leftHeartBeat()).toBeNull();
    expect(e.snapshot().leftHeart).toBeUndefined();
  });

  it("setMitralRegurgitation gives a regurgitant volume every beat and survives a snapshot", () => {
    const e = new PatientEngine({ seed: "lv-task-mr" });
    e.advance(4);
    e.setMitralRegurgitation(0.8);
    e.advance(6);
    const b = e.leftHeartBeat()!;
    expect(b).not.toBeNull();
    expect(b.mrMl).toBeGreaterThan(5);
    expect(b.regurgitantFraction).toBeGreaterThan(0.1);
    // per-beat volumes, not running totals: the same a beat later, and in line with the beat's stroke volume
    expect(b.mrMl).toBeLessThan(b.forwardMl);
    const sv1 = lastSv(e);
    expect(Math.abs(b.forwardMl - sv1) / sv1).toBeLessThan(0.2);
    e.advance(6);
    const b2 = e.leftHeartBeat()!;
    expect(Math.abs(b2.forwardMl - b.forwardMl) / b.forwardMl).toBeLessThan(0.2);
    expect(Math.abs(b2.mrMl - b.mrMl) / b.mrMl).toBeLessThan(0.3);
    const sv2 = lastSv(e);
    expect(Math.abs(b2.forwardMl - sv2) / sv2).toBeLessThan(0.2);
    const sn = e.snapshot();
    expect(sn.leftHeart).toEqual({ mr: 0.8, atrial: false });
    const f = new PatientEngine({ seed: "lv-task-mr" });
    f.restore(sn);
    expect(f.mitralRegurgitation).toBe(0.8);
    e.setMitralRegurgitation(null);
    expect(e.leftHeartBeat()).toBeNull();
  });

  it("atrial contraction raises the LVEDP the engine reports", () => {
    const a = new PatientEngine({ seed: "lv-task-a" });
    const b = new PatientEngine({ seed: "lv-task-a" });
    b.setAtrialContraction(true);
    a.advance(10);
    b.advance(10);
    expect(b.vitals().lvedp).toBeGreaterThan(a.vitals().lvedp);
  });

  it("the aortic valve opens in systole and is closed in diastole", () => {
    const e = new PatientEngine({ seed: "lv-task-av" });
    e.advance(3);
    let mx = 0;
    let mn = 1;
    for (let i = 0; i < 200; i++) {
      e.advance(0.01);
      const o = e.aorticValveOpening();
      mx = Math.max(mx, o);
      mn = Math.min(mn, o);
    }
    expect(mx).toBeGreaterThan(0.8);
    expect(mn).toBe(0);
  });
});
