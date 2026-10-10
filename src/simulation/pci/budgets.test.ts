// pci-budgets-stop-rules: the contrast ceiling, the tracker's announcements and events, the checkpoints and
// how a decision is judged, and the 'long-case' carry.
//   npx vitest run src/simulation/pci/budgets.test.ts
import { describe, expect, it } from "vitest";
import { BUDGET_CARRY_VARIANTS, BUDGET_DEFAULTS, BudgetTracker, budgetCarryFor, contrastCeiling, judgeCheckpoint, type BudgetReading } from "./budgets";

const R = (o: Partial<BudgetReading>): BudgetReading => ({ t: 0, contrastMl: 0, karMGy: 0, ...o });

describe("the contrast ceiling (contrastBudget.ts through budgets.ts)", () => {
  it("eGFR 45 gives 166.5 mL (Brilakis 3.7 × GFR, stricter than Oxford's 5 mL/kg)", () => {
    const c = contrastCeiling({ egfr: 45, crclMlMin: 50, weightKg: 80 });
    expect(c.ceilingMl).toBe(166.5);
    expect(c.source).toBe("brilakis-gfr");
    expect(c.sourceRef?.book).toMatch(/Brilakis/);
    expect(c.notes.join(" ")).toMatch(/Oxford: 5 mL\/kg for comparison: 400 mL/);
  });

  it("eGFR 25 gives a ceiling at the creatinine clearance, below the 3.7 × GFR rule", () => {
    const c = contrastCeiling({ egfr: 25, crclMlMin: 28, weightKg: 70 });
    const rule = 3.7 * 25;
    expect(c.ceilingMl).toBeLessThan(rule);
    expect(c.ceilingMl).toBeLessThanOrEqual(28);
    expect(c.source).toBe("advanced-ckd-below-crcl");
    expect(c.sourceRef?.book).toBe("Brilakis 28.3");
    // the brief is held to the lower figure too
    expect(c.ruleMl).toBe(28);
  });

  it("60 mL given two days earlier is subtracted; contrast outside the recent window is not", () => {
    expect(contrastCeiling({ egfr: 45, weightKg: 80, recent: [{ ml: 60, daysAgo: 2 }] }).ceilingMl).toBe(106.5);
    expect(contrastCeiling({ egfr: 45, weightKg: 80, recent: [{ ml: 60, daysAgo: 10 }] }).ceilingMl).toBe(166.5);
  });

  it("a lower plan is the ceiling; a higher plan is not; the CTO rule uses the creatinine clearance", () => {
    const p = { egfr: 45, crclMlMin: 50, weightKg: 80 };
    expect(contrastCeiling(p, { planContrastMl: 120 })).toMatchObject({ ceilingMl: 120, source: "plan", ruleMl: 166.5 });
    expect(contrastCeiling(p, { planContrastMl: 250 })).toMatchObject({ ceilingMl: 166.5, source: "brilakis-gfr" });
    expect(contrastCeiling(p, { cto: true })).toMatchObject({ ceilingMl: 185, source: "brilakis-crcl-cto" });
    expect(contrastCeiling({ ...p, singleKidney: true }).notes.join(" ")).toMatch(/Single kidney/);
  });
});

describe("BudgetTracker", () => {
  const patient = { egfr: 45, crclMlMin: 50, weightKg: 80 };

  it("raises high-contrast-volume once at the warning threshold (80%) and keeps it; announces 50% and 100%", () => {
    const b = new BudgetTracker(patient);
    const warnAt = 0.8 * 166.5;
    const u1 = b.update(R({ t: 10, contrastMl: 85 }));
    expect(u1.announcements.map((a) => a.kind)).toEqual(["contrast"]);
    expect(u1.announcements[0].text).toMatch(/Contrast 85 millilitres, 50 per cent of the ceiling/);
    expect(b.raised().contrast).toBe(false);
    const u2 = b.update(R({ t: 20, contrastMl: warnAt + 1 }));
    expect(u2.contrastWarned).toBe(true);
    expect(u2.opened.map((c) => c.reason)).toEqual(["contrast-warning"]);
    const u3 = b.update(R({ t: 30, contrastMl: 170 }));
    expect(u3.contrastWarned).toBe(false);
    expect(u3.announcements.map((a) => a.text)).toEqual(["Contrast 170 millilitres: that is the ceiling."]);
    expect(u3.opened.map((c) => c.reason)).toEqual(["contrast-ceiling"]);
    expect(b.raised().contrast).toBe(true);
    expect(b.readout().contrast).toMatchObject({ warned: true, status: "over" });
    // nothing is announced or opened twice
    const u4 = b.update(R({ t: 40, contrastMl: 200 }));
    expect([u4.announcements.length, u4.opened.length]).toEqual([0, 0]);
  });

  it("a KAR of 1 Gy emits an announcement with the time and the contrast; 5 Gy raises high-radiation-dose and opens the checkpoint", () => {
    const b = new BudgetTracker(patient);
    expect(b.update(R({ t: 300, karMGy: 990, contrastMl: 30 })).announcements).toEqual([]);
    const u = b.update(R({ t: 320, karMGy: 1002, contrastMl: 32 }));
    expect(u.announcements).toHaveLength(1);
    expect(u.announcements[0]).toMatchObject({ kind: "air-kerma", text: "Air kerma 1 gray, 5 minutes, contrast 32 millilitres." });
    expect(u.announcements[0].source.where).toMatch(/05-patient-complications\.ts:564/);
    expect(b.raised().radiation).toBe(false);
    const hi = b.update(R({ t: 2000, karMGy: BUDGET_DEFAULTS.radiationLimitMGy, contrastMl: 60 }));
    expect(hi.radiationHigh).toBe(true);
    expect(hi.opened.map((c) => c.reason)).toEqual(["radiation-limit"]);
    // one call for the step reached, not one for each gray skipped
    expect(hi.announcements.filter((a) => a.kind === "air-kerma").map((a) => a.text)).toEqual(["Air kerma 5 gray, 33 minutes, contrast 60 millilitres."]);
    expect(hi.announcements.filter((a) => a.kind === "elapsed").map((a) => a.text)).toEqual(["30 minutes in. Air kerma 5 gray, contrast 60 millilitres."]);
    expect(b.readout().radiation).toMatchObject({ high: true, limitMGy: 5000 });
  });

  it("another substantial radiation dose level (fluoroscopy time) also raises high-radiation-dose; the limit is configurable at the brief", () => {
    const a = new BudgetTracker(patient);
    expect(a.update(R({ t: 1, karMGy: 1500, fluoroS: 60 * 60 })).radiationHigh).toBe(true);
    const b = new BudgetTracker(patient);
    b.setPlan({ karLimitMGy: 3000 });
    expect(b.update(R({ t: 1, karMGy: 3100 })).radiationHigh).toBe(true);
    expect(b.pending()?.at.karLimitMGy).toBe(3000);
  });

  it("the checkpoint stays pending until answered; answers are judged and recorded with the numbers", () => {
    const b = new BudgetTracker(patient);
    b.update(R({ t: 5, contrastMl: 140, karMGy: 900 }));
    const cp = b.pending()!;
    expect(cp.reason).toBe("contrast-warning");
    expect(cp.at).toMatchObject({ contrastMl: 140, ceilingMl: 166.5, karMGy: 900 });
    expect(b.update(R({ t: 6, contrastMl: 141, karMGy: 900 })).opened).toEqual([]);
    expect(b.pending()).toBe(cp);
    const done = b.answer({ decision: "continue", progress: "progress", nextStep: "  deploy the stent  " }, 7)!;
    expect(done.answer).toMatchObject({ decision: "continue", nextStep: "deploy the stent", correct: true, t: 7 });
    expect(b.pending()).toBeNull();
    expect(b.answer({ decision: "stop", progress: "no-progress" }, 8)).toBeNull();
  });

  it("recent contrast that uses up the whole ceiling: any contrast is over, the event is raised and both checkpoints open", () => {
    const p = { ...patient, recent: [{ ml: 200, daysAgo: 1 }] };
    const b = new BudgetTracker(p);
    expect(b.readout().contrast.ceilingMl).toBe(0);
    expect(b.update(R({ t: 1, contrastMl: 0 })).opened).toEqual([]);
    expect(b.raised().contrast).toBe(false);
    const u = b.update(R({ t: 2, contrastMl: 3 }));
    expect(u.contrastWarned).toBe(true);
    expect(u.opened.map((c) => c.reason)).toEqual(["contrast-warning", "contrast-ceiling"]);
    expect(b.raised().contrast).toBe(true);
    // a carried total over a ceiling of 0: raised by prime(), and the points already passed open nothing
    const c = new BudgetTracker(p, { handedOverMl: 10 });
    expect(c.prime(R({ t: 0 })).contrastWarned).toBe(true);
    expect(c.update(R({ t: 1, contrastMl: 2 })).opened).toEqual([]);
  });

  it("the ceiling checkpoint opens from its own test, whatever the announcement points", () => {
    const b = new BudgetTracker(patient, { announceAt: [0.5] });
    expect(b.update(R({ t: 1, contrastMl: 100 })).opened).toEqual([]);
    const u = b.update(R({ t: 2, contrastMl: 140 }));
    expect(u.opened.map((c) => c.reason)).toEqual(["contrast-warning"]);
    const v = b.update(R({ t: 3, contrastMl: 170 }));
    expect(v.announcements.filter((a) => a.kind === "contrast")).toEqual([]);
    expect(v.opened.map((c) => c.reason)).toEqual(["contrast-ceiling"]);
    // one reading straight past both opens both
    const c = new BudgetTracker(patient, { announceAt: [] });
    expect(c.update(R({ t: 1, contrastMl: 170 })).opened.map((x) => x.reason)).toEqual(["contrast-warning", "contrast-ceiling"]);
  });

  it("without the teaching aids the calls and the checkpoint give the volume only, unless the ceiling is the learner's own from the plan", () => {
    const b = new BudgetTracker(patient, { announceCeiling: false });
    expect(b.update(R({ t: 1, contrastMl: 85 })).announcements.map((a) => a.text)).toEqual(["Contrast 85 millilitres."]);
    expect(b.update(R({ t: 2, contrastMl: 140 })).opened[0].text).toBe("Contrast 140 millilitres. Where are we, and what next?");
    expect(b.update(R({ t: 3, contrastMl: 170 })).announcements.map((a) => a.text)).toEqual(["Contrast 170 millilitres."]);
    expect(b.readout().contrast.agreed).toBe(false);
    // a plan above the rule is not used: its figure is not 'agreed', and the rule's figure is not named
    const hi = new BudgetTracker(patient, { announceCeiling: false, planContrastMl: 250 });
    expect(hi.readout().contrast).toMatchObject({ ceilingMl: 166.5, agreed: false });
    const t = hi.update(R({ t: 1, contrastMl: 85 })).announcements.map((a) => a.text);
    expect(t).toEqual(["Contrast 85 millilitres."]);
    expect(t.join(" ")).not.toMatch(/agreed|166|167/);
    // the plan's own figure (at or below the rule) is named
    const lo = new BudgetTracker(patient, { announceCeiling: false, planContrastMl: 120 });
    expect(lo.readout().contrast.agreed).toBe(true);
    expect(lo.update(R({ t: 1, contrastMl: 60 })).announcements.map((a) => a.text)).toEqual(["Contrast 60 millilitres, 50 per cent of the agreed ceiling of 120."]);
    expect(lo.update(R({ t: 2, contrastMl: 96 })).opened[0].text).toMatch(/close to the ceiling/);
    expect(lo.update(R({ t: 3, contrastMl: 120 })).announcements.map((a) => a.text)).toEqual(["Contrast 120 millilitres: that is the agreed ceiling of 120."]);
    // with the teaching aids the rule's ceiling is named, and 'agreed' is never said of a plan that is not used
    const aids = new BudgetTracker(patient, { planContrastMl: 250 });
    expect(aids.update(R({ t: 1, contrastMl: 85 })).announcements.map((a) => a.text)).toEqual(["Contrast 85 millilitres, 50 per cent of the ceiling."]);
  });

  it("the radiation checkpoint's line carries the totals", () => {
    const b = new BudgetTracker(patient);
    const u = b.update(R({ t: 1200, karMGy: 5000, contrastMl: 60 }));
    expect(u.opened[0].text).toBe("Air kerma 5 gray, 20 minutes, contrast 60 millilitres: we are at the radiation limit. Where are we, and what next?");
  });

  it("prime() takes a carried total without announcing the calls already passed, but keeps the events", () => {
    const b = new BudgetTracker(patient, { cto: true, handedOverMl: 150 }, { elapsedOffsetS: 6000 });
    const u = b.prime(R({ t: 0, karMGy: 4500 }));
    expect(u.announcements).toEqual([]);
    expect(b.update(R({ t: 1, karMGy: 4600 })).announcements).toEqual([]);
    expect(b.readout().contrast.totalMl).toBe(150);
    expect(b.readout().elapsedS).toBe(6001);
    const at5 = b.update(R({ t: 400, karMGy: 5000 }));
    expect(at5.announcements.map((a) => a.kind)).toEqual(["air-kerma"]);
    expect(at5.radiationHigh).toBe(true);
    // the next time call is at 2 hours (the carried 100 minutes counted)
    expect(b.update(R({ t: 1200, karMGy: 5100 })).announcements.map((a) => a.text)).toEqual(["120 minutes in. Air kerma 5.1 gray, contrast 150 millilitres."]);
  });
});

describe("judging a checkpoint decision against the module text", () => {
  const at = { contrastMl: 0, ceilingMl: 100, karMGy: 5200, karLimitMGy: 5000, elapsedS: 3600, crossed: false };
  it("a CTO above the air kerma limit without crossing: stop or bail out, not a change of strategy", () => {
    expect(judgeCheckpoint({ reason: "radiation-limit", at }, { decision: "bail-out", progress: "no-progress" }, true).correct).toBe(true);
    expect(judgeCheckpoint({ reason: "radiation-limit", at }, { decision: "stop", progress: "no-progress" }, true).correct).toBe(true);
    const ch = judgeCheckpoint({ reason: "radiation-limit", at }, { decision: "change-strategy", progress: "no-progress", nextStep: "retrograde" }, true);
    expect(ch.correct).toBe(false);
    expect(ch.unscored).toBeUndefined();
    expect(ch.source.where).toMatch(/01-principles-closure\.ts:1292/);
    expect(judgeCheckpoint({ reason: "radiation-limit", at }, { decision: "continue", progress: "no-progress", nextStep: "another wire" }, true).correct).toBe(false);
  });
  it("a CTO above the limit, not crossed, with progress reported: continuing is legitimate with substantial progress, so the decision is not scored", () => {
    for (const decision of ["continue", "change-strategy", "stop", "bail-out"] as const) {
      const j = judgeCheckpoint({ reason: "radiation-limit", at }, { decision, progress: "progress", nextStep: "retrograde" }, true);
      expect(j).toMatchObject({ correct: true, unscored: true, expected: "stop or bail out unless there is substantial progress" });
      expect(j.source.where).toMatch(/01-principles-closure\.ts:1292/);
    }
    // outside a CTO the progress claim changes nothing
    expect(judgeCheckpoint({ reason: "radiation-limit", at }, { decision: "continue", progress: "progress", nextStep: "LAD" }, false)).toMatchObject({ correct: false });
  });
  it("a CTO already crossed is completed economically", () => {
    const j = judgeCheckpoint({ reason: "radiation-limit", at: { ...at, crossed: true } }, { decision: "continue", progress: "crossed", nextStep: "stent" }, true);
    expect(j.correct).toBe(true);
    expect(j.source.where).toMatch(/09-cto-strategy\.ts:929/);
    expect(judgeCheckpoint({ reason: "radiation-limit", at: { ...at, crossed: true } }, { decision: "stop", progress: "crossed" }, true).correct).toBe(false);
  });
  it("outside a CTO: stage or stop at the dose limit and at the contrast ceiling; the warning needs only a decision", () => {
    expect(judgeCheckpoint({ reason: "radiation-limit", at }, { decision: "stage", progress: "progress" }, false).correct).toBe(true);
    expect(judgeCheckpoint({ reason: "radiation-limit", at }, { decision: "continue", progress: "progress", nextStep: "LAD" }, false).correct).toBe(false);
    expect(judgeCheckpoint({ reason: "contrast-ceiling", at }, { decision: "continue", progress: "progress", nextStep: "LAD" }, false)).toMatchObject({ correct: false, expected: "stop or stage" });
    expect(judgeCheckpoint({ reason: "contrast-warning", at }, { decision: "continue", progress: "progress", nextStep: "finish the RCA" }, false).correct).toBe(true);
  });
});

describe("the 'long-case' variant", () => {
  it("carries a dose below the limit, contrast and time, as model parameters", () => {
    const c = BUDGET_CARRY_VARIANTS["long-case"];
    expect(c.karMGy).toBeLessThan(BUDGET_DEFAULTS.radiationLimitMGy);
    expect(c.fluoroS / 60).toBeLessThan(60);
    expect(c.contrastMl).toBeGreaterThan(0);
    expect(c.elapsedS).toBeGreaterThan(BUDGET_DEFAULTS.announceEveryS);
  });
  it("is found by the launch's variant id, only for a scenario that declares it", () => {
    expect(budgetCarryFor("rca-cto", "long-case")?.karMGy).toBe(4500);
    expect(budgetCarryFor("lad-focal", "long-case")).toBeNull();
    expect(budgetCarryFor("rca-cto", null)).toBeNull();
    expect(budgetCarryFor("rca-cto", "pci-rca-cto~L3")).toBeNull();
  });
});
