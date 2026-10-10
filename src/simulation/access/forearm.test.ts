// access-cx-forearm: the forearm haematoma model and grading (src/simulation/access/forearm.ts), and the full case's
// grade III and compartment scenarios (src/simulation/session/scenarios/forearm.ts through modules/forearm.ts).
//   npx vitest run src/simulation/access/forearm.test.ts
import { describe, it, expect } from "vitest";
import {
  CUFF_SCHEMES,
  MP_FOREARM,
  aboveElbow,
  baselineForearmCircCm,
  circumferences,
  forearmExamText,
  forearmExtentCm,
  forearmGrade,
  forearmGrowthMlMin,
  forearmMlForExtent,
  gradeCompartmentResponse,
  gradeForearmCuff,
  gradeForearmTreatment,
  stepForearmSource,
  type ForearmMeasure,
  type ForearmSource,
} from "./forearm";
import { easyGradeFromSize, haematomaCm } from "./closure";
import { MP_SESSION, newCaseSession, type CaseSession } from "../session/caseSession";
import { MP_WARD } from "../session/ward";
import { forearmOf } from "../session/modules/forearm";

const decision = (s: CaseSession, id: string) => s.decisions().find((d) => d.id === id);
/** Let `min` minutes pass on the session clock. */
const run = (s: CaseSession, min: number) => {
  s.wait(min * 60);
  s.runPending();
};
const none = new Set<ForearmMeasure>();
const base = { sourceMlMin: 3, actS: 130, antiplatelet: false, sysMmHg: 130, measures: none, cuff: null, bandOff: false } as const;

describe("grade and measurements", () => {
  it("grades from 4 cm, 9 cm and below-elbow volumes are I, II and III", () => {
    const at4 = forearmMlForExtent(4);
    const at9 = forearmMlForExtent(9);
    const belowElbow = forearmMlForExtent(MP_FOREARM.elbowCm - 4);
    expect(forearmExtentCm(at4)).toBeCloseTo(4, 1);
    expect(forearmExtentCm(at9)).toBeCloseTo(9, 1);
    expect(forearmGrade(at4)).toBe(1);
    expect(forearmGrade(at9)).toBe(2);
    expect(aboveElbow(belowElbow)).toBe(false);
    expect(forearmGrade(belowElbow)).toBe(3);
    // the grade is the EASY grade of the extent (closure.ts), the chart's thresholds
    for (const ml of [at4, at9, belowElbow]) expect(forearmGrade(ml)).toBe(easyGradeFromSize(haematomaCm(ml), false, false));
    // above the elbow is IV, the compartment signs V, and none 0
    expect(forearmGrade(forearmMlForExtent(MP_FOREARM.elbowCm + 1))).toBe(4);
    expect(forearmGrade(at9, true)).toBe(5);
    expect(forearmGrade(0)).toBe(0);
  });

  it("the circumference rises at the marks the swelling reaches and not beyond, against the other arm", () => {
    const ml = forearmMlForExtent(12);
    const marks = circumferences(ml, 25);
    const own = baselineForearmCircCm(25);
    for (const m of marks) expect(m.otherCm).toBeGreaterThanOrEqual(own - 0.5);
    const at5 = marks.find((m) => m.atCm === 5)!;
    const at15 = marks.find((m) => m.atCm === 15)!;
    expect(at5.cm).toBeGreaterThan(at5.otherCm);
    expect(at15.cm).toBe(at15.otherCm);
    // a larger haematoma swells the forearm more; above the elbow the arm mark swells too
    const big = circumferences(forearmMlForExtent(MP_FOREARM.elbowCm + 8), 25);
    expect(big.find((m) => m.atCm === 5)!.cm).toBeGreaterThanOrEqual(at5.cm);
    const arm = big[big.length - 1];
    expect(arm.cm).toBeGreaterThan(arm.otherCm);
    // no swelling: both arms the same
    expect(circumferences(0, 25).every((m) => m.cm === m.otherCm)).toBe(true);
  });

  it("the examination gives signs, never the grade", () => {
    const t = forearmExamText(forearmMlForExtent(15), false);
    expect(t).not.toMatch(/grade|compartment/i);
    expect(t).toMatch(/below the elbow/);
    const c = forearmExamText(forearmMlForExtent(15), true);
    expect(c).toMatch(/passively extending the fingers/i);
    expect(c).toMatch(/pale/);
    expect(c).not.toMatch(/compartment|grade/i);
  });
});

describe("growth", () => {
  it("the values the model shares with the ward and the session are theirs", () => {
    expect(MP_FOREARM.palpableMl).toBe(MP_WARD.palpableMl);
    expect(MP_FOREARM.reportMl).toBe(MP_WARD.reportMl);
    expect(MP_FOREARM.stressedShare).toBe(MP_SESSION.bleedStressedShare);
  });

  it("the ACT, an IV antiplatelet infusion and the pressure raise the growth; each measure lowers it", () => {
    const r0 = forearmGrowthMlMin(base);
    expect(forearmGrowthMlMin({ ...base, actS: 260 })).toBeGreaterThan(r0);
    expect(forearmGrowthMlMin({ ...base, antiplatelet: true })).toBeGreaterThan(r0);
    expect(forearmGrowthMlMin({ ...base, sysMmHg: 170 })).toBeGreaterThan(r0);
    for (const m of ["reposition-band", "second-band", "ice", "sling", "analgesia", "bp-control", "bandage"] as ForearmMeasure[])
      expect(forearmGrowthMlMin({ ...base, measures: new Set([m]) }), m).toBeLessThan(r0);
    expect(forearmGrowthMlMin({ ...base, cuff: "below" })).toBeLessThan(r0);
    // the band off while it grows takes the pressure off the hole
    expect(forearmGrowthMlMin({ ...base, bandOff: true })).toBeGreaterThan(r0);
  });

  it("a source held below the sealing rate for the sealing time stops for good; one above it goes on", () => {
    const src: ForearmSource = { ml: 100, capMl: null, sealedAt: null, lowSince: null };
    let t = 0;
    while (t < MP_FOREARM.sealAfterS - 5) {
      t += 5;
      stepForearmSource(src, 5, t, MP_FOREARM.sealBelowMlMin / 2);
    }
    expect(src.sealedAt).toBeNull();
    for (let k = 0; k < 3; k++) {
      t += 5;
      stepForearmSource(src, 5, t, MP_FOREARM.sealBelowMlMin / 2);
    }
    expect(src.sealedAt).not.toBeNull();
    const ml = src.ml;
    expect(stepForearmSource(src, 5, t + 5, 10)).toBe(0);
    expect(src.ml).toBe(ml);
    const fast: ForearmSource = { ml: 100, capMl: null, sealedAt: null, lowSince: null };
    for (let k = 1; k <= 120; k++) stepForearmSource(fast, 5, k * 5, 2);
    expect(fast.sealedAt).toBeNull();
    expect(fast.ml).toBeCloseTo(120, 5);
  });
});

describe("the arm cuff and the chart's treatment", () => {
  const sys = 140;
  it("the two accepted schemes pass with the finger saturation watched and a plan to let it down; the others do not", () => {
    const oxford = gradeForearmCuff({ mmHg: sys - 10, deflateEveryMin: 30, fingerSat: true }, sys);
    expect(oxford).toMatchObject({ scheme: "oxford", correct: true });
    const bertrand = gradeForearmCuff({ mmHg: sys - CUFF_SCHEMES.bertrandBelowMmHg, deflateEveryMin: 15, fingerSat: true }, sys);
    expect(bertrand).toMatchObject({ scheme: "bertrand", correct: true });
    // Bertrand's pressure without the 15-minute deflation, no plan at all, no saturation probe, above systolic, too low
    expect(gradeForearmCuff({ mmHg: sys - 20, deflateEveryMin: 30, fingerSat: true }, sys).correct).toBe(false);
    expect(gradeForearmCuff({ mmHg: sys - 10, deflateEveryMin: null, fingerSat: true }, sys).correct).toBe(false);
    expect(gradeForearmCuff({ mmHg: sys - 10, deflateEveryMin: 15, fingerSat: false }, sys).correct).toBe(false);
    const above = gradeForearmCuff({ mmHg: sys + 20, deflateEveryMin: 15, fingerSat: true }, sys);
    expect(above).toMatchObject({ correct: false, aboveSystolic: true });
    expect(gradeForearmCuff({ mmHg: sys - 50, deflateEveryMin: 15, fingerSat: true }, sys).correct).toBe(false);
  });

  it("the chart's treatment by grade: analgesia, a band and ice; the operator told from II; the cuff for III and IV", () => {
    const basic = new Set<ForearmMeasure>(["analgesia", "second-band", "ice"]);
    expect(gradeForearmTreatment(1, basic, false).correct).toBe(true);
    expect(gradeForearmTreatment(2, basic, false).correct).toBe(false);
    expect(gradeForearmTreatment(2, new Set([...basic, "inform"]), false).correct).toBe(true);
    const iii = new Set<ForearmMeasure>([...basic, "inform", "cuff"]);
    expect(gradeForearmTreatment(3, iii, false).missing).toContain("an arm cuff below systolic");
    expect(gradeForearmTreatment(3, iii, true).correct).toBe(true);
    expect(gradeForearmTreatment(4, iii, true).correct).toBe(true);
  });

  it("after the compartment signs the call is right within its window and compression is wrong", () => {
    const ok = gradeCompartmentResponse([{ id: "call-surgeons", t: 130 }], 100, 140);
    expect(ok).toMatchObject({ callCorrect: true, compressedAfter: false, first: "call-surgeons" });
    const pressed = gradeCompartmentResponse([{ id: "cuff", t: 110 }, { id: "call-surgeons", t: 150 }], 100, 160);
    expect(pressed).toMatchObject({ callCorrect: true, compressedAfter: true, first: "cuff" });
    // compression before the signs is not counted; a call never made is wrong once the window has passed
    expect(gradeCompartmentResponse([{ id: "second-band", t: 50 }], 100, 120).compressedAfter).toBe(false);
    expect(gradeCompartmentResponse([], 100, 100 + MP_FOREARM.callWithinS + 1).callCorrect).toBe(false);
    expect(gradeCompartmentResponse([], 100, 110).callCorrect).toBeNull();
  });
});

describe("forearm-grade-3", () => {
  it("cuff, ice and band repositioning in 'forearm-grade-3' stop growth within the scripted time", () => {
    const s = newCaseSession({ scenario: "forearm-grade-3" }).session;
    const m = forearmOf(s)!;
    run(s, 2);
    const e = m.state.episode!;
    expect(e.foundBy).toBe("call");
    expect(m.actions.gradeNow()).toBe(3);
    const sysNow = Math.round(s.patient.vitals().aortaTrue.sys);
    expect(m.actions.cuff({ mmHg: sysNow - 10, deflateEveryMin: 30, fingerSat: true }).ok).toBe(true);
    expect(m.actions.apply("ice").ok).toBe(true);
    expect(m.actions.apply("reposition-band").ok).toBe(true);
    const at = m.actions.volumeMl();
    const t0 = s.tS;
    // the scripted time: the sealing time and a minute
    run(s, MP_FOREARM.sealAfterS / 60 + 1);
    expect(e.source.sealedAt).not.toBeNull();
    expect(e.source.sealedAt! - t0).toBeLessThanOrEqual(MP_FOREARM.sealAfterS + 60);
    const sealedMl = m.actions.volumeMl();
    expect(sealedMl - at).toBeLessThan(5);
    run(s, 20);
    expect(m.actions.volumeMl()).toBe(sealedMl);
    expect(m.actions.gradeNow()).toBe(3);
    expect(decision(s, "forearm-cuff")?.correct).toBe(true);
    // the cuff's finger trace is kept below systolic
    expect(m.actions.fingerSat().text).toMatch(/good trace/);
  });

  it("untreated, the same haematoma goes on growing and reaches above the elbow", () => {
    const s = newCaseSession({ scenario: "forearm-grade-3" }).session;
    const m = forearmOf(s)!;
    run(s, 2);
    const at = m.actions.volumeMl();
    run(s, 20);
    expect(m.actions.volumeMl()).toBeGreaterThan(at + 20);
    expect(m.state.episode!.source.sealedAt).toBeNull();
    run(s, 60);
    expect(m.actions.gradeNow()).toBeGreaterThanOrEqual(4);
  });
});

describe("forearm-compartment", () => {
  it("in 'forearm-compartment' compression after the signs is wrong and the surgical call correct", () => {
    const s = newCaseSession({ scenario: "forearm-compartment" }).session;
    const m = forearmOf(s)!;
    run(s, 2);
    expect(m.actions.compartmentSigns()).toBe(false);
    run(s, 4);
    // the signs are reported, and the module's own context carries limb-ischaemia
    expect(m.actions.compartmentSigns()).toBe(true);
    expect(m.actions.gradeNow()).toBe(5);
    expect(m.tipContexts!()[0].events).toEqual(["haematoma", "limb-ischaemia"]);
    expect(m.actions.look().text).toMatch(/passively extending the fingers/i);
    // compression after the signs: wrong
    expect(m.actions.apply("second-band").ok).toBe(true);
    expect(decision(s, "forearm-no-compression-after-signs")?.correct).toBe(false);
    // the surgical call: right (at once)
    expect(m.actions.apply("call-surgeons").ok).toBe(true);
    expect(decision(s, "forearm-compartment-call")?.correct).toBe(true);
    // a wrong compression stays wrong after the call
    expect(decision(s, "forearm-no-compression-after-signs")?.correct).toBe(false);
    // after the signs the band and a cuff no longer stop it: the signs stay until theatre
    const sysNow = Math.round(s.patient.vitals().aortaTrue.sys);
    m.actions.cuff({ mmHg: sysNow - 10, deflateEveryMin: 30, fingerSat: true });
    run(s, MP_FOREARM.surgeonsArriveS / 60 - 1);
    expect(m.state.episode!.fasciotomyT).toBeNull();
    expect(m.actions.compartmentSigns()).toBe(true);
    expect(m.state.episode!.source.sealedAt).toBeNull();
    // the surgeons arrive and take the arm to theatre: the signs and the growth end
    run(s, 2);
    expect(m.state.episode!.fasciotomyT).not.toBeNull();
    expect(m.actions.compartmentSigns()).toBe(false);
    const ml = m.actions.volumeMl();
    run(s, 10);
    expect(m.actions.volumeMl()).toBe(ml);
  });

  it("the call alone, at once, is scored right on both counts; a call never made is wrong once its window passes", () => {
    const a = newCaseSession({ scenario: "forearm-compartment" }).session;
    const ma = forearmOf(a)!;
    run(a, 6);
    expect(ma.actions.compartmentSigns()).toBe(true);
    ma.actions.apply("call-surgeons");
    expect(decision(a, "forearm-compartment-call")?.correct).toBe(true);
    expect(decision(a, "forearm-no-compression-after-signs")?.correct).toBe(true);
    const b = newCaseSession({ scenario: "forearm-compartment" }).session;
    const mb = forearmOf(b)!;
    run(b, 6);
    // a cuff after the signs is compression too, and is not scored as a haematoma cuff
    const sysNow = Math.round(b.patient.vitals().aortaTrue.sys);
    mb.actions.cuff({ mmHg: sysNow - 10, deflateEveryMin: 15, fingerSat: true });
    expect(decision(b, "forearm-no-compression-after-signs")?.correct).toBe(false);
    expect(decision(b, "forearm-cuff")).toBeUndefined();
    run(b, MP_FOREARM.callWithinS / 60 + 2);
    expect(decision(b, "forearm-compartment-call")?.correct).toBe(false);
  });
});
