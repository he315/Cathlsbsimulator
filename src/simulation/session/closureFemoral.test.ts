// access-closure-femoral-manual (review fixes): the wait for the ACT to fall as the closure panel drives it,
// act-high held and cleared under the learner's rule, only what the operator knows said about the ACT,
// the first closure choice scored, and the session's vasodilation composed with other writers'.
import { describe, it, expect } from "vitest";
import { newCaseSession, type CaseSession } from "./caseSession";
import { MP_COMPRESSION } from "../access/compression";

/** The preparation (Brilakis 11.1.6 steps 1-3) and the pressure read. */
function prepare(s: CaseSession): void {
  for (const p of ["monitoring", "vagal-kit", "saline", "gloves", "bp"] as const) {
    s.confirmPrep(p);
    s.runPending();
  }
}

/** The closure panel's wait button (10 min, the sheath sutured in), then a recheck, until a measured ACT is below `target`. */
function waitAsPanel(s: CaseSession, target: number): number {
  let act = Infinity;
  for (let k = 0; k < 30; k++) {
    s.wait(600, "Waiting for the ACT to fall, the sheath sutured in");
    s.runPending();
    act = s.measureAct() ?? Infinity;
    s.runPending();
    if (act < target) return act;
  }
  return act;
}

const engineVaso = (s: CaseSession) => (s.patient as unknown as { snapshot(): { form?: { vasodilation?: number } } }).snapshot().form?.vasodilation ?? 0;
const otherWriter = (s: CaseSession) => s.patient as unknown as { setVasodilation(x: number): void };

describe("femoral closure: the wait, the ACT and the choice", () => {
  it("wait-then-compress: the panel's wait lets the ACT fall; act-high clears on a reading below 180 s; compression then scores the ACT correct", () => {
    const s = newCaseSession({ scenario: "compression-act-high" }).session;
    const first = s.measureAct()!;
    s.runPending();
    expect(first).toBeGreaterThanOrEqual(180);
    expect(s.activeEvents()).toContain("act-high");
    expect(s.chooseClosure("wait-then-compress")?.verdict).toBe("correct");
    s.runPending();
    const act = waitAsPanel(s, 180);
    expect(act).toBeLessThan(180);
    expect(s.activeEvents()).not.toContain("act-high");
    // the one change of plan is recorded as its own item; the first choice stands
    expect(s.chooseClosure("manual-compression")?.verdict).toBe("correct");
    expect(s.decisions().find((d) => d.id === "femoral-closure-after-wait")?.correct).toBe(true);
    expect(s.decisions().find((d) => d.id === "femoral-closure-choice")?.given).toMatch(/wait for the ACT to fall/);
    prepare(s);
    expect(s.startCompression()).toBe(true);
    expect(s.decisions().find((d) => d.id === "femoral-act")?.correct).toBe(true);
  });

  it("act-high clears when the sheath comes out under the fingers, and when the sheath is kept sutured", () => {
    const s = newCaseSession({ scenario: "compression-act-high" }).session;
    s.measureAct();
    s.runPending();
    expect(s.activeEvents()).toContain("act-high");
    expect(s.startCompression()).toBe(true);
    expect(s.activeEvents()).not.toContain("act-high");

    const k = newCaseSession({ scenario: "compression-act-high" }).session;
    k.measureAct();
    k.runPending();
    expect(k.activeEvents()).toContain("act-high");
    k.chooseClosure("keep-suture");
    k.runPending();
    expect(k.siteClosed(k.activeSite)).toBe(true);
    expect(k.activeEvents()).not.toContain("act-high");
  });

  it("act-high follows the learner's rule: a reading between 180 and 200 s holds it under Brilakis, not under Oxford", () => {
    const s = newCaseSession({ scenario: "compression-act-high" }).session;
    let act = Infinity;
    for (let k = 0; k < 60 && act >= 200; k++) {
      s.wait(120);
      s.runPending();
      act = s.measureAct()!;
      s.runPending();
    }
    expect(act).toBeLessThan(200);
    expect(act).toBeGreaterThanOrEqual(180);
    expect(s.activeEvents()).toContain("act-high");
    s.setCompressionRule("oxford");
    const again = s.measureAct()!;
    s.runPending();
    expect(again).toBeLessThan(200);
    expect(s.activeEvents()).not.toContain("act-high");
  });

  it("the attending says no ACT the learner has not measured: without a reading it says none was measured", () => {
    const s = newCaseSession({ scenario: "compression-act-high" }).session;
    const before = s.attending.length;
    const trueAct = Math.round(s.patient.vitals().actTrue);
    prepare(s);
    expect(s.startCompression()).toBe(true);
    const said = s.attending.slice(before).map((l) => l.text).join(" ");
    expect(said).toMatch(/No ACT has been measured since the heparin/);
    expect(said).not.toContain(`${trueAct} s`);
    const rec = s.decisions().find((d) => d.id === "femoral-act")!;
    expect(rec.correct).toBe(false);
  });

  it("the closure choice is graded on the ACT measured, not the engine's: a reading of 245 s makes waiting correct", () => {
    const s = newCaseSession({ scenario: "compression-act-high" }).session;
    s.measureAct();
    s.runPending();
    // the engine's ACT keeps falling while the learner thinks; the grade uses the reading taken
    s.wait(1800);
    s.runPending();
    expect(s.patient.vitals().actTrue).toBeLessThan(245);
    const g = s.chooseClosure("wait-then-compress")!;
    expect(g.verdict).toBe("correct");
    s.runPending();
    // a second, different choice is not scored over the first
    expect(s.chooseClosure("suture-device")?.verdict).toBe("correct");
    expect(s.activeSite.closure.plan?.choice?.choice).toBe("wait-then-compress");
  });
});

describe("the session's vasodilation beside other writers", () => {
  it("lowering the pressure keeps another writer's larger value, and its end does not wipe a cause still running", () => {
    const s = newCaseSession({ scenario: "closure-fem-standard" }).session;
    expect(s.lowerBloodPressure()).toBe(true);
    s.runPending();
    expect(engineVaso(s)).toBeCloseTo(MP_COMPRESSION.bpLoweringVasodilation, 5);
    // a cause run writes a larger value: the engine holds it
    otherWriter(s).setVasodilation(0.5);
    expect(engineVaso(s)).toBeCloseTo(0.5, 5);
    // the cause stops (writes 0): the session's share is kept
    otherWriter(s).setVasodilation(0);
    expect(engineVaso(s)).toBeCloseTo(MP_COMPRESSION.bpLoweringVasodilation, 5);
    // a smaller cause running when the antihypertensive wears off is left in force
    otherWriter(s).setVasodilation(0.1);
    s.wait(MP_COMPRESSION.bpLoweringS + 60);
    s.runPending();
    expect(engineVaso(s)).toBeCloseTo(0.1, 5);
  });
});
