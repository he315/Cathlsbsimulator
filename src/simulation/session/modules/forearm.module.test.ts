// access-cx-forearm: the session module 'forearm' in the full case (modules/forearm.ts): how a haematoma is found
// (looking, the ward's site check, the patient's complaint), the grade named, the chart's treatment scored when it
// stops growing, the band kept on, the infusion stopped, and a case without the scenario left unchanged.
//   npx vitest run src/simulation/session/modules/forearm.module.test.ts
import { describe, it, expect } from "vitest";
import { newCaseSession, type CaseSession } from "../caseSession";
import { oxfordMobilisation, oxfordSchedule } from "../ward";
import { forearmOf, FOREARM_MODULE_ID } from "./forearm";
import { MP_FOREARM } from "../../access/forearm";

const decision = (s: CaseSession, id: string) => s.decisions().find((d) => d.id === id);
const run = (s: CaseSession, min: number) => {
  s.wait(min * 60);
  s.runPending();
};

describe("forearm module", () => {
  it("in forearm-grade-1 the swelling is not found until the learner looks, then graded and treated by the chart", () => {
    const s = newCaseSession({ scenario: "forearm-grade-1" }).session;
    const m = forearmOf(s)!;
    // no swelling drawn by the closure's own risk model in this drill
    expect(s.delayed.some((d) => d.kind === "forearm-haematoma")).toBe(false);
    run(s, 4);
    expect(m.state.episode).not.toBeNull();
    expect(m.state.episode!.foundT).toBeNull();
    expect(s.activeEvents()).not.toContain("haematoma");
    // naming a grade or treating before looking is refused
    expect(m.actions.nameGrade(1).ok).toBe(false);
    expect(m.actions.apply("ice").ok).toBe(false);
    const look = m.actions.look();
    expect(look.text).toMatch(/swelling/i);
    expect(look.text).not.toMatch(/grade/i);
    expect(s.activeEvents()).toContain("haematoma");
    m.actions.measure();
    expect(m.actions.nameGrade(1).ok).toBe(true);
    expect(decision(s, "forearm-grade")?.correct).toBe(true);
    for (const x of ["second-band", "ice", "analgesia"] as const) expect(m.actions.apply(x).ok).toBe(true);
    m.actions.measure();
    run(s, MP_FOREARM.sealAfterS / 60 + 2);
    expect(m.state.episode!.source.sealedAt).not.toBeNull();
    expect(decision(s, "forearm-treatment")?.correct).toBe(true);
    expect(decision(s, "forearm-measured")?.correct).toBe(true);
  });

  it("the ward's site check finds the swelling on its schedule and the nurse's note sits beside that set", () => {
    const s = newCaseSession({ scenario: "forearm-grade-1" }).session;
    const m = forearmOf(s)!;
    s.setWardPlan(oxfordSchedule("radial", false), oxfordMobilisation("radial-band"));
    // the first site check after the onset (2 min) is the 15-minute one
    run(s, 10);
    expect(m.state.episode!.foundT).toBeNull();
    run(s, 6);
    const e = m.state.episode!;
    expect(e.foundBy).toBe("site-check");
    const idx = Number(Object.keys(e.siteNotes)[0]);
    expect(s.ward.sets[idx].kinds).toContain("site");
    expect(e.siteNotes[idx]).toMatch(/swelling/i);
    expect(s.activeEvents()).toContain("haematoma");
  });

  it("in the live lab a finding of a growing swelling during a recovery time-lapse holds it, and the learner's first measure lets it go", () => {
    // forearm-grade-3's source is still growing when the nurse calls (forearm-grade-1's has stopped by its site
    // check, which is not held for: the test below)
    const s = newCaseSession({ scenario: "forearm-grade-3" }).session;
    const m = forearmOf(s)!;
    s.lapseHoldsOn = true;
    s.setWardPlan(oxfordSchedule("radial", false), oxfordMobilisation("radial-band"));
    s.observe(60);
    // the lapse runs in slices until the nurse's call at onset finds the swelling
    for (let k = 0; k < 400 && m.state.episode?.foundT == null; k++) s.tick(0.05);
    expect(m.state.episode!.foundBy).toBe("call");
    expect(m.state.episode!.source.sealedAt).toBeNull();
    expect(s.lapseHeld?.by).toContain(FOREARM_MODULE_ID);
    expect(s.busy).toBe(false);
    expect(m.actions.apply("second-band").ok).toBe(true);
    expect(s.lapseHeld).toBeNull();
    expect(s.busy).toBe(true);
  });

  it("a swelling the site check finds after it has stopped is not held for, and its treatment and measurements are still scored", () => {
    const s = newCaseSession({ scenario: "forearm-grade-1" }).session;
    const m = forearmOf(s)!;
    s.lapseHoldsOn = true;
    s.setWardPlan(oxfordSchedule("radial", false), oxfordMobilisation("radial-band"));
    s.observe(60);
    for (let k = 0; k < 400 && m.state.episode?.foundT == null; k++) s.tick(0.05);
    const e = m.state.episode!;
    expect(e.foundBy).toBe("site-check");
    // the source capped before the 15-minute check found it: nothing to hold the lapse for
    expect(e.source.sealedAt).not.toBeNull();
    expect(e.source.sealedAt!).toBeLessThan(e.foundT!);
    expect(s.lapseHeld?.by ?? []).not.toContain(FOREARM_MODULE_ID);
  });

  it("found by the site check after it stopped: the chart's treatment and two sets of measurements are scored at the deadline or the second set", () => {
    const s = newCaseSession({ scenario: "forearm-grade-1" }).session;
    const m = forearmOf(s)!;
    s.setWardPlan(oxfordSchedule("radial", false), oxfordMobilisation("radial-band"));
    run(s, 16);
    const e = m.state.episode!;
    expect(e.foundBy).toBe("site-check");
    expect(e.source.sealedAt!).toBeLessThan(e.foundT!);
    m.actions.look();
    m.actions.measure();
    expect(m.actions.nameGrade(1).ok).toBe(true);
    for (const x of ["second-band", "ice", "analgesia"] as const) expect(m.actions.apply(x).ok).toBe(true);
    expect(decision(s, "forearm-measured")).toBeUndefined();
    m.actions.measure();
    expect(decision(s, "forearm-measured")?.correct).toBe(true);
    run(s, MP_FOREARM.treatmentVerdictAfterS / 60 + 1);
    expect(decision(s, "forearm-grade")?.correct).toBe(true);
    expect(decision(s, "forearm-treatment")?.correct).toBe(true);
    expect(s.lapseHeld).toBeNull();
  });

  it("a set measured after the treatment has stopped the haematoma counts towards measuring repeatedly", () => {
    const s = newCaseSession({ scenario: "forearm-grade-3" }).session;
    const m = forearmOf(s)!;
    run(s, 2);
    m.actions.measure();
    m.actions.nameGrade(3);
    const sysNow = Math.round(s.patient.vitals().aortaTrue.sys);
    expect(m.actions.cuff({ mmHg: sysNow - 10, deflateEveryMin: 30, fingerSat: true }).ok).toBe(true);
    for (const x of ["reposition-band", "ice", "analgesia", "inform"] as const) expect(m.actions.apply(x).ok).toBe(true);
    run(s, MP_FOREARM.sealAfterS / 60 + 2);
    expect(m.state.episode!.source.sealedAt).not.toBeNull();
    expect(decision(s, "forearm-treatment")?.correct).toBe(true);
    // one set so far: not yet scored either way
    expect(decision(s, "forearm-measured")).toBeUndefined();
    m.actions.measure();
    expect(decision(s, "forearm-measured")?.correct).toBe(true);
  });

  it("measured once and never again: wrong at the deadline", () => {
    const s = newCaseSession({ scenario: "forearm-grade-3" }).session;
    const m = forearmOf(s)!;
    run(s, 2);
    m.actions.measure();
    run(s, MP_FOREARM.treatmentVerdictAfterS / 60 + 1);
    const d = decision(s, "forearm-measured")!;
    expect(d.correct).toBe(false);
    expect(d.given).toMatch(/1 time/);
  });

  it("forearm-compartment: surgeons called on the nurse's report before the signs: the call and no compression are both right", () => {
    const s = newCaseSession({ scenario: "forearm-compartment" }).session;
    const m = forearmOf(s)!;
    run(s, 1.5);
    expect(m.state.episode!.foundT).not.toBeNull();
    expect(m.actions.compartmentSigns()).toBe(false);
    expect(m.actions.apply("call-surgeons").ok).toBe(true);
    expect(decision(s, "forearm-compartment-call")).toBeUndefined();
    run(s, 3);
    expect(m.actions.compartmentSigns()).toBe(true);
    expect(decision(s, "forearm-compartment-call")?.correct).toBe(true);
    run(s, MP_FOREARM.surgeonsArriveS / 60);
    expect(m.state.episode!.fasciotomyT).not.toBeNull();
    expect(decision(s, "forearm-no-compression-after-signs")?.correct).toBe(true);
  });

  it("forearm-compartment: moving or doubling a band that is off after the signs is refused and not scored as compression", () => {
    const s = newCaseSession({ scenario: "forearm-compartment" }).session;
    const m = forearmOf(s)!;
    run(s, 6);
    expect(m.actions.compartmentSigns()).toBe(true);
    expect(s.removeBand()).not.toBeNull();
    expect(m.actions.apply("second-band").ok).toBe(false);
    expect(m.actions.apply("reposition-band").ok).toBe(false);
    expect(decision(s, "forearm-no-compression-after-signs")).toBeUndefined();
  });

  it("a wrong grade is wrong; the grade III treatment without the cuff or without telling the operator is wrong", () => {
    const s = newCaseSession({ scenario: "forearm-grade-3" }).session;
    const m = forearmOf(s)!;
    run(s, 2);
    m.actions.nameGrade(2);
    expect(decision(s, "forearm-grade")?.correct).toBe(false);
    for (const x of ["reposition-band", "second-band", "ice", "sling", "analgesia", "bp-control"] as const) m.actions.apply(x);
    const at = m.actions.volumeMl();
    run(s, 40);
    // without the cuff (and with the ACT of the case) the grade III haematoma still grows, more slowly; its treatment
    // is scored as it stands once it has grown for the verdict time: without the cuff and without telling the operator
    expect(m.state.episode!.source.sealedAt).toBeNull();
    expect(m.actions.volumeMl()).toBeGreaterThan(at);
    const tr = decision(s, "forearm-treatment")!;
    expect(tr.correct).toBe(false);
    expect(tr.given).toMatch(/cuff/);
    expect(tr.given).toMatch(/operator/);
  });

  it("taking the band off while the haematoma grows is wrong and speeds it up", () => {
    const s = newCaseSession({ scenario: "forearm-grade-3" }).session;
    const m = forearmOf(s)!;
    run(s, 2);
    const before = m.state.episode!.rateMlMin;
    expect(s.removeBand()).not.toBeNull();
    run(s, 1);
    expect(decision(s, "forearm-band-kept")?.correct).toBe(false);
    expect(m.state.episode!.rateMlMin).toBeGreaterThan(before);
  });

  it("forearm-grade-4: the cangrelor infusion runs until it is stopped, and the swelling reaches above the elbow", () => {
    const s = newCaseSession({ scenario: "forearm-grade-4" }).session;
    const m = forearmOf(s)!;
    run(s, 2);
    expect(m.actions.gradeNow()).toBe(4);
    expect(m.state.infusionRunning).toBe("cangrelor");
    const withInfusion = m.state.episode!.rateMlMin;
    expect(m.actions.apply("stop-infusion").text).toMatch(/stopped/);
    expect(m.state.infusionRunning).toBeNull();
    run(s, 1);
    expect(m.state.episode!.rateMlMin).toBeLessThan(withInfusion);
    // the full grade IV response stops it
    const sysNow = Math.round(s.patient.vitals().aortaTrue.sys);
    m.actions.measure();
    m.actions.cuff({ mmHg: sysNow - 20, deflateEveryMin: 15, fingerSat: true });
    for (const x of ["second-band", "ice", "analgesia", "inform", "sling"] as const) m.actions.apply(x);
    m.actions.nameGrade(4);
    m.actions.measure();
    run(s, 15);
    expect(m.state.episode!.source.sealedAt).not.toBeNull();
    expect(decision(s, "forearm-grade")?.correct).toBe(true);
    expect(decision(s, "forearm-cuff")?.correct).toBe(true);
    expect(decision(s, "forearm-treatment")?.correct).toBe(true);
    expect(m.actions.compartmentSigns()).toBe(false);
  });

  it("forearm-after-traction: a fast bleed the patient reports, which reaches compartment signs when nothing is done", () => {
    const s = newCaseSession({ scenario: "forearm-after-traction" }).session;
    const m = forearmOf(s)!;
    run(s, 5);
    expect(m.state.episode!.foundBy).toBe("report");
    run(s, 40);
    expect(m.actions.compartmentSigns()).toBe(true);
    expect(m.state.episode!.compartmentBy).toBe("growth");
    // the haematoma was found and went on growing to compartment syndrome: the treatment is scored wrong
    expect(decision(s, "forearm-treatment")?.correct).toBe(false);
  });

  it("a case without the scenario is unchanged: no episode, no event, no decision", () => {
    const s = newCaseSession({ seed: "forearm-plain", access: "radial-right", start: "recovery" }).session;
    const m = forearmOf(s)!;
    expect(s.moduleIds()).toContain(FOREARM_MODULE_ID);
    run(s, 30);
    expect(m.state.episode).toBeNull();
    expect(m.events!()).toEqual([]);
    expect(m.tipContexts!()).toEqual([]);
    expect(s.decisions().some((d) => d.id.startsWith("forearm-"))).toBe(false);
  });
});
