// access-closure-radial: the band's position against the arterial hole, the pleth, spasm on removal, the band
// time and the late radial problems, in the model (closure.ts) and in the full case's radial closure scenarios
// (src/simulation/session/scenarios/closureRadial.ts: the high-ACT 7 Fr case here, the others in
// radialClosure.scenarios.test.ts).
import { describe, it, expect } from "vitest";
import {
  MP_BAND_POSITION,
  MP_RADIAL_CLOSURE,
  bandCoverage,
  bandPressure,
  bandStatus,
  easyGradeFromSize,
  haematomaCm,
  plethNow,
  radialBandStatus,
  radialHoleOffsetMm,
  radialThresholds,
  raoRisk,
  scheduleDelayed,
  sheathGripped,
} from "./closure";
import { newCaseSession, type CaseSession } from "../session/caseSession";
import { emergenciesOf } from "../session/modules/emergencies";

const open = (id: string) => newCaseSession({ scenario: id }).session;
const decision = (s: CaseSession, id: string) => s.decisions().find((d) => d.id === id);

/** The volume (mL, in 0.5 mL steps) that keeps the hole dry under a centred band without occluding the artery, or null. */
function patentVolume(s: CaseSession): number | null {
  const th = s.bandThresholds();
  for (let ml = 4; ml <= 20; ml += 0.5) {
    const p = bandPressure(ml);
    if (p >= th.bleedMmHg && p < th.occludeMmHg) return ml;
  }
  return null;
}

/** Step 2 then 3: the vasodilator through the side arm mixed with blood, then the band at `centreX` (default over the hole). */
function vasodilatorThenBand(s: CaseSession, ml: number, centreX?: number): void {
  expect(s.sideArmVasodilator("verapamil")).toBe(true);
  s.runPending();
  s.applyBand(ml, centreX);
  s.runPending();
}

describe("the band's position (model)", () => {
  it("the arterial hole lies depth / tan(angle) proximal to the skin nick, further with a flatter needle", () => {
    expect(radialHoleOffsetMm(4.3, 45)).toBeCloseTo(4.3, 5);
    expect(radialHoleOffsetMm(4.3, 30)).toBeCloseTo(4.3 / Math.tan(Math.PI / 6), 5);
    expect(radialHoleOffsetMm(4.3, 15)).toBeGreaterThan(radialHoleOffsetMm(4.3, 30));
  });

  it("the band presses the hole fully near its centre and not at all well off it", () => {
    expect(bandCoverage(0)).toBe(1);
    expect(bandCoverage(MP_BAND_POSITION.flatHalfMm)).toBe(1);
    expect(bandCoverage(-8)).toBeLessThan(0.5);
    expect(bandCoverage(MP_BAND_POSITION.flatHalfMm + MP_BAND_POSITION.edgeMm + 1)).toBe(0);
  });

  it("a band centred 8 mm distal to the arterial puncture bleeds at the planned volume; centred over it does not (into the forearm, not at the wrist)", () => {
    // a 7 Fr sheath, an ACT of 320 s and an antiplatelet infusion: the lesson's hardest case
    const th = radialThresholds({ map: 100, sys: 135, actS: 320, fr: 7, antiplatelet: true });
    let planned = 0;
    for (let ml = 4; ml <= 20 && !planned; ml += 0.5) if (bandPressure(ml) >= th.bleedMmHg && bandPressure(ml) < th.occludeMmHg) planned = ml;
    expect(planned).toBeGreaterThan(0);
    const over = radialBandStatus([{ volumeMl: planned, offsetMm: 0 }], th, true);
    const distal = radialBandStatus([{ volumeMl: planned, offsetMm: -8 }], th, true);
    const proximal = radialBandStatus([{ volumeMl: planned, offsetMm: 8 }], th, true);
    expect(over.bleeding).toBe(false);
    expect(over.radialFlow).toBe(true);
    expect(distal.bleeding).toBe(true);
    expect(distal.bleedSite).toBe("forearm");
    expect(proximal.bleeding).toBe(true);
    expect(proximal.bleedSite).toBe("wrist");
    // one band over the hole reads as the earlier centred model
    const old = bandStatus(planned, th, true);
    expect(over.bleeding).toBe(old.bleeding);
    expect(over.radialFlow).toBe(old.radialFlow);
    // a second band against the first covers the hole the first missed
    const two = radialBandStatus([{ volumeMl: planned, offsetMm: -8 }, { volumeMl: planned, offsetMm: -8 + MP_BAND_POSITION.secondBandSpacingMm }], th, true);
    expect(two.bleeding).toBe(false);
  });

  it("the antiplatelet infusion raises the bleeding threshold", () => {
    const a = radialThresholds({ map: 100, sys: 135, actS: 320, fr: 7 });
    const b = radialThresholds({ map: 100, sys: 135, actS: 320, fr: 7, antiplatelet: true });
    expect(b.bleedMmHg).toBeGreaterThan(a.bleedMmHg);
    expect(b.occludeMmHg).toBe(a.occludeMmHg);
  });

  it("the pleth stays with the ulnar artery open, is lost when the band occludes the radial and the ulnar is compressed, and returns when loosened", () => {
    const th = radialThresholds({ map: 100, sys: 135, actS: 200, fr: 6 });
    const tight = radialBandStatus([{ volumeMl: 18, offsetMm: 0 }], th, true);
    const loose = radialBandStatus([{ volumeMl: 9, offsetMm: 0 }], th, true);
    expect(tight.radialFlow).toBe(false);
    expect(plethNow({ band: tight, ulnarCompressed: false, radialOccluded: false, th }).amplitude).toBe(1);
    expect(plethNow({ band: tight, ulnarCompressed: true, radialOccluded: false, th }).amplitude).toBe(0);
    expect(plethNow({ band: loose, ulnarCompressed: true, radialOccluded: false, th }).amplitude).toBeGreaterThan(0);
  });

  it("a sheath grips at the grip tone, and a lubricious solution lets it slide a little higher", () => {
    expect(sheathGripped(MP_RADIAL_CLOSURE.gripAt - 0.01, false)).toBe(false);
    expect(sheathGripped(MP_RADIAL_CLOSURE.gripAt, false)).toBe(true);
    expect(sheathGripped(MP_RADIAL_CLOSURE.gripAt, true)).toBe(false);
  });

  it("an avulsion schedules a major forearm haematoma; without it the draws are unchanged", () => {
    const base = { route: "radial" as const, closedAtS: 1000, seed: "avulsion-check", rao: { probability: 0 }, bandOozeMl: 0, radialPunctures: 1 };
    const without = scheduleDelayed(base);
    const withIt = scheduleDelayed({ ...base, avulsion: true });
    expect(without.some((d) => d.severity === "major")).toBe(false);
    const big = withIt.find((d) => d.kind === "forearm-haematoma" && d.severity === "major");
    expect(big).toBeDefined();
    expect(big!.severity).toBe("major");
    // the grade is the learner's to name: never in the finding shown on examination
    expect(big!.finding).not.toMatch(/grade/i);
    expect(easyGradeFromSize(haematomaCm(big!.totalMl), false, false)).toBeGreaterThanOrEqual(3);
    expect(big!.easyGrade).toBe(easyGradeFromSize(haematomaCm(big!.totalMl), false, false));
    expect(withIt.filter((d) => d !== big)).toEqual(without);
  });
});

describe("closure-radial-7fr-act320-gpi", () => {
  it("opens with a 7 Fr sheath, an ACT above 300 s and the infusion counted; without the vasodilator the sheath grips, after it it slides out; band time 4 h raises the RAO probability above the 2 h value; the pleth disappears with over-inflation and ulnar compression and returns when loosened", () => {
    const s = open("closure-radial-7fr-act320-gpi");
    expect(s.sheath?.id).toBe("7");
    expect(s.catheter?.inBody ?? false).toBe(false);
    const v = s.patient.vitals();
    expect(v.actTrue).toBeGreaterThan(300);
    expect(s.bandThresholds().bleedMmHg).toBeGreaterThan(radialThresholds({ map: v.aortaTrue.mean, sys: v.aortaTrue.sys, actS: v.actTrue, fr: 7 }).bleedMmHg);
    expect(s.decisions()).toHaveLength(0);
    // band on at 15 mL, no vasodilator: the 7 Fr sheath is gripped
    s.applyBand(15);
    s.runPending();
    expect(s.pullRadialSheath()).toBe("gripped");
    expect(s.sheath).not.toBeNull();
    expect(s.activeEvents()).toContain("radial-spasm");
    expect(s.sideArmVasodilator("verapamil")).toBe(true);
    s.runPending();
    expect(s.pullRadialSheath()).toBe("out");
    expect(decision(s, "radial-sheath-traction")?.correct).toBe(true);
    expect(raoRisk(s.raoFactors(4)).probability).toBeGreaterThan(raoRisk(s.raoFactors(2)).probability);
    // 15 mL occludes the radial in this patient: the pleth goes with the ulnar artery compressed
    expect(s.plethNow().amplitude).toBe(1);
    s.setUlnarCompression(true);
    expect(s.plethNow().amplitude).toBe(0);
    expect(s.plethCheck()!.cls).toBe("D");
    s.runPending();
    // loosened to the patent volume: the trace returns, the site is dry
    s.setBandVolume(patentVolume(s)!);
    expect(s.plethNow().amplitude).toBeGreaterThan(0);
    const r = s.plethCheck()!;
    s.runPending();
    expect(r.cls).not.toBe("D");
    expect(r.bleeding).toBe(false);
    expect(s.radial!.patentDocumented).toBe(true);
    // the band set to come off at 4 h is scored wrong
    s.finishRadialClosure(4);
    expect(decision(s, "radial-band-time")?.correct).toBe(false);
    expect(decision(s, "patent-haemostasis")?.correct).toBe(true);
  });

  it("a band centred 8 mm distal to the arterial puncture bleeds at the planned volume; centred over it does not; pulling the sheath at once is correct", () => {
    const over = open("closure-radial-7fr-act320-gpi");
    const ml = patentVolume(over)!;
    expect(ml).not.toBeNull();
    const g = over.radialPunctureGeometry()!;
    vasodilatorThenBand(over, ml, g.holeX);
    expect(over.pullRadialSheath()).toBe("out");
    expect(over.bandNow()!.bleeding).toBe(false);
    expect(decision(over, "radial-band-position")?.correct).toBe(true);
    expect(decision(over, "radial-sheath-out-now")?.correct).toBe(true);

    const distal = open("closure-radial-7fr-act320-gpi");
    vasodilatorThenBand(distal, ml, distal.radialPunctureGeometry()!.holeX - 8);
    expect(distal.pullRadialSheath()).toBe("out");
    const b = distal.bandNow()!;
    expect(b.bleeding).toBe(true);
    expect(b.bleedSite).toBe("forearm");
    expect(decision(distal, "radial-band-position")?.correct).toBe(false);
    // the forearm fills above the band, as the operator sees it, and the second band against the first stops it
    for (let i = 0; i < 40 && !distal.activeEvents().includes("haematoma"); i++) distal.tick(5);
    expect(distal.activeEvents()).toContain("haematoma");
    expect(distal.addSecondBand()).toBe(true);
    distal.runPending();
    expect(distal.bandNow()!.bleeding).toBe(false);
  });

  it("waiting for the ACT with the sheath in is wrong", () => {
    const waited = open("closure-radial-7fr-act320-gpi");
    waited.measureAct();
    waited.runPending();
    waited.waitWithSheathIn(600, "Waiting for the ACT to fall, the sheath in");
    waited.runPending();
    vasodilatorThenBand(waited, patentVolume(waited)!);
    expect(waited.pullRadialSheath()).toBe("out");
    const d = decision(waited, "radial-sheath-out-now");
    expect(d?.correct).toBe(false);
    expect(d?.given).toMatch(/Waited 10 min/);
  });

  it("time spent on an emergency order or another step at closure is not a wait for the ACT", () => {
    const s = open("closure-radial-7fr-act320-gpi");
    const em = emergenciesOf(s);
    expect(em).toBeDefined();
    em!.actions.order("oxygen");
    s.runPending();
    s.wait(120, "Observing");
    s.runPending();
    vasodilatorThenBand(s, patentVolume(s)!);
    expect(s.pullRadialSheath()).toBe("out");
    expect(decision(s, "radial-sheath-out-now")?.correct).toBe(true);
  });

  it("a band at the occlusion threshold holds or loses the pleth steadily, not with each beat (the thresholds read smoothed pressures)", () => {
    const s = open("closure-radial-7fr-act320-gpi");
    vasodilatorThenBand(s, patentVolume(s)!);
    expect(s.pullRadialSheath()).toBe("out");
    s.runPending();
    s.setUlnarCompression(true);
    // the 0.5 mL step nearest the occlusion threshold
    const occ = s.bandThresholds().occludeMmHg;
    let ml = 4;
    for (let v = 4; v <= 20; v += 0.5) if (Math.abs(bandPressure(v) - occ) < Math.abs(bandPressure(ml) - occ)) ml = v;
    s.setBandVolume(ml);
    s.runPending();
    let flips = 0;
    let prev = s.plethNow().cls;
    for (let i = 0; i < 300; i++) {
      s.tick(0.1);
      const c = s.plethNow().cls;
      if (c !== prev) flips++;
      prev = c;
    }
    // at most one change in 30 s (the pressure itself drifting across the threshold), never one with each beat
    expect(flips).toBeLessThanOrEqual(1);
  });
});
