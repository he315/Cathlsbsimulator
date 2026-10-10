// access-closure-femoral-manual: hands-on femoral manual compression (pm-closure-femoral-compression), pure and
// in the full case's closure scenarios.
import { describe, it, expect } from "vitest";
import {
  COMPRESSION,
  MP_COMPRESSION,
  actAllowsPull,
  coverage,
  freshCompression,
  gradeProtamine,
  haemostatic,
  positionError,
  protamineRange,
  requiredMinutes,
  stepCompression,
} from "./compression";
import { femoralRisk, FEMORAL, type FemoralFactors } from "./closure";
import { newCaseSession, type CaseSession } from "../session/caseSession";
import { emergenciesOf } from "../session/modules/emergencies";

const BASE: FemoralFactors = { method: "manual", actAtPullS: 170, minutes: 15, positionErrorMm: 0, stick: "ok", backWalls: 0, fr: 6, anticoagulated: false, angiogramBeforeDevice: true };

/** Wait in 5-minute steps, measuring the ACT each time, until a measured ACT is at or below `target` (s). */
function waitForAct(s: CaseSession, target: number): number {
  let act = Infinity;
  for (let k = 0; k < 40; k++) {
    s.runPending();
    act = s.measureAct() ?? Infinity;
    s.runPending();
    if (act <= target) return act;
    s.wait(300);
  }
  return act;
}

/** The hole on the skin map (mm from the nick) of a compression just started. */
const hole = (s: CaseSession) => s.compression!.hole;

/** The full preparation (Brilakis 11.1.6 steps 1-3) and the pressure read. */
function prepare(s: CaseSession): void {
  for (const p of ["monitoring", "vagal-kit", "saline", "gloves", "bp"] as const) {
    s.confirmPrep(p);
    s.runPending();
  }
}

/** Press for `min` minutes in one-minute steps (the hands as they are). */
function hold(s: CaseSession, min: number): void {
  for (let m = 0; m < min; m++) {
    s.holdCompression(1);
    s.runPending();
  }
}

describe("the compression model (pure)", () => {
  it("the rules: Brilakis 2-3 min per French and an ACT below 180 s; Oxford about 8-10 min and below 150-200 s or after 3-4 h", () => {
    expect(requiredMinutes("brilakis", 6)).toBe(12);
    expect(requiredMinutes("brilakis", 8)).toBe(16);
    expect(requiredMinutes("oxford", 6)).toBe(8);
    expect(actAllowsPull("brilakis", 179, null)).toBe(true);
    expect(actAllowsPull("brilakis", 185, null)).toBe(false);
    expect(actAllowsPull("oxford", 195, null)).toBe(true);
    expect(actAllowsPull("oxford", 240, 3 * 3600)).toBe(true);
    expect(actAllowsPull("oxford", 240, 3600)).toBe(false);
  });

  it("the fingers cover the hole from just below it to about 1 cm above it; to the side or well below they do not", () => {
    const h = { xMm: 18, yMm: 0 };
    expect(coverage({ xMm: 18, yMm: 0 }, h)).toBe(1);
    expect(coverage({ xMm: 18 + COMPRESSION.oxfordProximalMm, yMm: 0 }, h)).toBe(1);
    expect(coverage({ xMm: 3, yMm: 0 }, h)).toBeLessThan(0.1);
    expect(coverage({ xMm: 18, yMm: 12 }, h)).toBeLessThan(0.1);
    expect(positionError({ xMm: 3, yMm: 0 }, h)).toBe(12);
    expect(positionError({ xMm: 20, yMm: 0 }, h)).toBe(0);
  });

  it("held over the hole with firm pressure the plug forms and the nick is dry; off the hole it oozes and swells", () => {
    const start = (x: number) => freshCompression({ hole: { xMm: 18, yMm: 0 }, fr: 6, rule: "brilakis", hands: { xMm: x, yMm: 0, pressure: 0.65 }, t: 0, actS: 170, sysMmHg: 130 });
    let on = start(20);
    let off = start(3);
    for (let i = 0; i < 12 * 12; i++) {
      on = stepCompression(on, 5, 170, 130);
      off = stepCompression(off, 5, 170, 130);
    }
    expect(haemostatic(on, 170)).toBe(true);
    expect(on.haematomaMl).toBe(0);
    expect(haemostatic(off, 170)).toBe(false);
    expect(off.haematomaMl).toBeGreaterThan(MP_COMPRESSION.visibleHaematomaMl);
    // occlusive pressure stops the distal flow
    let hard = stepCompression({ ...start(20), hands: { xMm: 20, yMm: 0, pressure: 0.95 } }, 5, 170, 130);
    expect(hard.occluded).toBe(true);
    hard = stepCompression({ ...hard, hands: { xMm: 20, yMm: 0, pressure: 0.6 } }, 5, 170, 130);
    expect(hard.occluded).toBe(false);
  });

  it("Compression 15 mm caudal to the arteriotomy raises the large-haematoma risk over the centred value", () => {
    const h = { xMm: 18, yMm: 0 };
    const caudal = positionError({ xMm: h.xMm - 15, yMm: 0 }, h);
    const centred = positionError({ xMm: h.xMm, yMm: 0 }, h);
    expect(caudal).toBeGreaterThan(5);
    expect(centred).toBe(0);
    expect(femoralRisk({ ...BASE, positionErrorMm: caudal }).largeHaematoma).toBeGreaterThan(femoralRisk({ ...BASE, positionErrorMm: centred }).largeHaematoma);
    // and with the error itself, as the earlier callers pass it
    expect(femoralRisk({ ...BASE, positionErrorMm: 15 }).largeHaematoma).toBeGreaterThan(femoralRisk(BASE).largeHaematoma);
    // too little pressure raises the pseudoaneurysm more than the haematoma; a high systolic raises both
    const weak = femoralRisk({ ...BASE, pressureAdequacy: 0.5 });
    expect(weak.pseudoaneurysm / femoralRisk(BASE).pseudoaneurysm).toBeGreaterThan(weak.largeHaematoma / femoralRisk(BASE).largeHaematoma);
    expect(femoralRisk({ ...BASE, sysAtPullMmHg: 190 }).largeHaematoma).toBeGreaterThan(femoralRisk(BASE).largeHaematoma);
    // the earlier callers (no optional terms) are unchanged
    expect(femoralRisk(BASE).terms.map((t) => t.factor)).toEqual(femoralRisk({ ...BASE, requiredMinutes: FEMORAL.manualMinutes }).terms.map((t) => t.factor));
  });

  it("protamine: 1-1.5 mg per 100 U, capped at 50 mg; refused with equipment in", () => {
    expect(protamineRange(3000)).toEqual([30, 45]);
    expect(protamineRange(6000)).toEqual([50, 50]);
    expect(gradeProtamine({ mg: 40, heparinU: 3000, equipmentIn: false })).toMatchObject({ refused: false, givenMg: 40, correct: true });
    expect(gradeProtamine({ mg: 80, heparinU: 6000, equipmentIn: false })).toMatchObject({ refused: false, givenMg: 50, correct: false });
    expect(gradeProtamine({ mg: 10, heparinU: 3000, equipmentIn: false }).correct).toBe(false);
    expect(gradeProtamine({ mg: 40, heparinU: 3000, equipmentIn: true })).toMatchObject({ refused: true, givenMg: 0 });
  });
});

describe("hands-on compression in the full case", () => {
  it("Hand compression at ACT 240 s is wrong and after waiting to 170 s correct", () => {
    const s = newCaseSession({ scenario: "compression-act-high" }).session;
    const first = s.measureAct()!;
    s.runPending();
    expect(first).toBeGreaterThanOrEqual(225);
    expect(first).toBeLessThanOrEqual(255);
    expect(s.activeEvents()).toContain("act-high");
    expect(s.chooseClosure("manual-compression")?.verdict).toBe("wrong");
    expect(s.decisions().find((d) => d.id === "femoral-closure-choice")?.correct).toBe(false);
    const act = waitForAct(s, 170);
    expect(act).toBeLessThanOrEqual(170);
    // only the first choice is scored: choosing again once the ACT has fallen does not erase the error
    expect(s.chooseClosure("manual-compression")?.verdict).toBe("wrong");
    expect(s.decisions().find((d) => d.id === "femoral-closure-choice")?.correct).toBe(false);
    prepare(s);
    expect(s.startCompression()).toBe(true);
    expect(s.decisions().find((d) => d.id === "femoral-act")?.correct).toBe(true);
    // the same patient pulled at the ACT it opened with is scored wrong
    const t = newCaseSession({ scenario: "compression-act-high" }).session;
    t.measureAct();
    t.runPending();
    expect(t.startCompression()).toBe(true);
    const rec = t.decisions().find((d) => d.id === "femoral-act")!;
    expect(rec.correct).toBe(false);
    expect(rec.lessonId).toBe("pm-antithrombotics-heparin");
  });

  it("protamine before the catheter is out is refused; 80 mg is capped at 50 mg and scored wrong", () => {
    const inside = newCaseSession({ scenario: "closure-fem-standard", start: "post-diagnostic" }).session;
    expect(inside.catheter?.inBody).toBe(true);
    const r = inside.giveProtamine(30);
    expect(r?.refused).toBe(true);
    expect(inside.protamine).toHaveLength(0);
    expect(inside.decisions().find((d) => d.id === "protamine-dose")?.correct).toBe(false);

    const s = newCaseSession({ scenario: "compression-act-high" }).session;
    expect(s.catheter?.inBody).toBeFalsy();
    const before = s.patient.vitals().actTrue;
    const g = s.giveProtamine(80, "slow")!;
    s.runPending();
    expect(g.givenMg).toBe(50);
    expect(g.correct).toBe(false);
    expect(s.protamine[0].mg).toBe(50);
    expect(s.decisions().find((d) => d.id === "protamine-dose")?.correct).toBe(false);
    // the heparin is reversed: the ACT falls
    expect(s.patient.vitals().actTrue).toBeLessThan(before - 30);
  });

  it("dragging the fingers changes the position error the debrief shows; pressing too low bleeds into the groin and raises bleeding and haematoma", () => {
    const centred = newCaseSession({ scenario: "closure-fem-standard" }).session;
    waitForAct(centred, 170);
    prepare(centred);
    centred.startCompression();
    centred.setHands({ xMm: hole(centred).xMm + 4, yMm: 0, pressure: 0.65 });
    hold(centred, 13);
    expect(centred.releaseCompression()?.held).toBe(true);
    const good = centred.decisions().find((d) => d.id === "femoral-compression")!;
    expect(good.correct).toBe(true);
    expect(good.given).toMatch(/^Over the arteriotomy \(fingers on average 0 mm from it\)/);

    const low = newCaseSession({ scenario: "closure-fem-standard" }).session;
    waitForAct(low, 170);
    prepare(low);
    low.startCompression();
    // on the skin nick, 15 mm or more below the arteriotomy
    low.setHands({ xMm: hole(low).xMm - 15, yMm: 0, pressure: 0.65 });
    hold(low, 4);
    expect(low.compressionFeel()).toMatch(/Blood wells up/);
    expect(low.activeEvents()).toContain("bleeding");
    expect(low.activeEvents()).toContain("haematoma");
    expect(low.checkGroin()).toMatch(/swelling/);
    low.runPending();
    // moved up over the hole, the rest is held well
    low.setHands({ xMm: hole(low).xMm + 4, yMm: 0 });
    hold(low, 10);
    expect(low.releaseCompression()?.held).toBe(true);
    const bad = low.decisions().find((d) => d.id === "femoral-compression")!;
    expect(bad.correct).toBe(false);
    expect(bad.given).toMatch(/fingers on average [1-9][\d.]* mm from it/);
    // four minutes on the nick count against the placement whatever the average (MP_COMPRESSION.offTargetMaxShare)
    // the lead-in names the measure that makes it off (time off target), so it cannot read as on target
    expect(bad.given).toMatch(/^Off the arteriotomy for [1-9][\d.]* of [\d.]+ min \(fingers on average/);
    expect(bad.given).not.toEqual(good.given);
    expect(low.femoral!.positionErrorMm).toBeGreaterThan(centred.femoral!.positionErrorMm);
    expect(low.femoral!.risk.largeHaematoma).toBeGreaterThan(centred.femoral!.risk.largeHaematoma);
  });

  it("lifting before the puncture holds bleeds again; the timer follows the rule chosen (Brilakis 12 min for 6 Fr, Oxford about 8)", () => {
    const s = newCaseSession({ scenario: "closure-fem-standard" }).session;
    waitForAct(s, 170);
    prepare(s);
    s.startCompression({ xMm: 20 });
    hold(s, 1);
    expect(s.releaseCompression()?.held).toBe(false);
    expect(s.activeEvents()).toContain("bleeding");
    expect(s.closureDone()).toBe(false);
    s.setHands({ xMm: hole(s).xMm + 4, pressure: 0.65 });
    hold(s, 9);
    expect(s.compressionTimer()?.requiredMin).toBe(12);
    expect(s.releaseCompression()?.held).toBe(true);
    expect(s.decisions().find((d) => d.id === "femoral-compression")?.correct).toBe(false);

    const o = newCaseSession({ scenario: "closure-fem-standard" }).session;
    o.setCompressionRule("oxford");
    waitForAct(o, 170);
    prepare(o);
    o.startCompression();
    o.setHands({ xMm: hole(o).xMm + 4, pressure: 0.65 });
    hold(o, 9);
    expect(o.compressionTimer()?.requiredMin).toBe(8);
    expect(o.releaseCompression()?.held).toBe(true);
    expect(o.decisions().find((d) => d.id === "femoral-compression")?.correct).toBe(true);
    expect(o.closureDone()).toBe(true);
  });

  it("the preparation, the pressure, the groin, the foot pulses and the dressing are scored; occlusive pressure takes the foot pulses away", () => {
    const s = newCaseSession({ scenario: "closure-fem-standard" }).session;
    waitForAct(s, 170);
    s.startCompression();
    expect(s.decisions().find((d) => d.id === "femoral-compression-prep")?.correct).toBe(false);
    s.setHands({ xMm: hole(s).xMm + 4, pressure: 0.95 });
    hold(s, 1);
    expect(s.checkFootPulses()).toMatch(/No foot pulses/);
    s.runPending();
    s.setHands({ pressure: 0.65 });
    hold(s, 1);
    expect(s.checkFootPulses()).toMatch(/present/);
    s.runPending();
    hold(s, 11);
    expect(s.releaseCompression()?.held).toBe(true);
    expect(s.decisions().find((d) => d.id === "femoral-aftercare")?.correct).toBe(false);
    s.checkGroin();
    s.runPending();
    s.checkFootPulses();
    s.runPending();
    expect(s.applyDressing()).toBe(true);
    s.runPending();
    expect(s.decisions().find((d) => d.id === "femoral-aftercare")?.correct).toBe(true);

    const p = newCaseSession({ scenario: "closure-fem-standard" }).session;
    waitForAct(p, 170);
    prepare(p);
    p.startCompression();
    expect(p.decisions().find((d) => d.id === "femoral-compression-prep")?.correct).toBe(true);
    expect(p.decisions().find((d) => d.id === "femoral-compression-bp")?.correct).toBe(true);
    // the saline and the vagal kit went through the emergency orders
    const em = emergenciesOf(p)!.state.prevention;
    expect(em.salineT).not.toBeNull();
    expect(em.atropineReadyT).not.toBeNull();
  });

  it("'compression-vagal' gives HR below 50 before MAP below 65, restored by atropine and fluid with pressure kept", () => {
    const s = newCaseSession({ scenario: "compression-vagal" }).session;
    prepare(s);
    expect(s.startCompression()).toBe(true);
    let hrLowAt: number | null = null;
    let mapLowAt: number | null = null;
    for (let i = 0; i < 24 && mapLowAt === null; i++) {
      s.tick(5);
      const v = s.patient.vitals();
      if (hrLowAt === null && (v.hr ?? 99) < 50) hrLowAt = s.tS;
      if (mapLowAt === null && v.aortaTrue.mean < 65) mapLowAt = s.tS;
    }
    expect(hrLowAt).not.toBeNull();
    expect(mapLowAt).not.toBeNull();
    expect(hrLowAt!).toBeLessThan(mapLowAt!);
    expect(s.activeEvents()).toContain("bradycardia");
    const em = emergenciesOf(s)!;
    for (const o of ["lie-flat-legs-up", "atropine-0.5", "fluid-500"] as const) {
      expect(em.actions.order(o).ok).toBe(true);
      s.runPending();
    }
    // the hands stay on through the treatment
    expect(s.compression?.releasedAt).toBeNull();
    expect(s.compression!.hands.pressure).toBeGreaterThan(0.5);
    for (let i = 0; i < 36; i++) s.tick(5);
    const v = s.patient.vitals();
    expect(v.hr ?? 0).toBeGreaterThanOrEqual(50);
    expect(v.aortaTrue.mean).toBeGreaterThanOrEqual(65);
    expect(s.compressionFeel()).toMatch(/dry/);
    // the same reaction left untreated is still slow and low at the same time
    const u = newCaseSession({ scenario: "compression-vagal" }).session;
    prepare(u);
    u.startCompression();
    while (u.tS < s.tS) u.tick(5);
    const w = u.patient.vitals();
    expect((w.hr ?? 99) < 50 || w.aortaTrue.mean < 65).toBe(true);
  });

  it("the emergency drills' removal scoring sees the hands-on pull as a manual compression", () => {
    const s = newCaseSession({ scenario: "vagal-removal-no-saline" }).session;
    expect(s.startCompression()).toBe(true);
    const rec = s.decisions().find((d) => d.id === "vagal-prevention-removal");
    expect(rec?.correct).toBe(false);
    expect(s.closureDone()).toBe(false);
  });

  it("'compression-tamponade-mimic' gives HR above 100 with hypotension and an effusion on echo", () => {
    const s = newCaseSession({ scenario: "compression-tamponade-mimic" }).session;
    prepare(s);
    s.startCompression();
    let seen = false;
    for (let i = 0; i < 120 && !seen; i++) {
      s.tick(5);
      const v = s.patient.vitals();
      seen = (v.hr ?? 0) > 100 && v.aortaTrue.mean < 65;
    }
    expect(seen).toBe(true);
    expect(s.activeEvents()).toContain("hypotension");
    const echo = emergenciesOf(s)!.actions.order("echo");
    expect(echo.text).toMatch(/pericardial effusion/);
  });
});
