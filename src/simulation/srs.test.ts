import { describe, it, expect } from "vitest";
import { review, addDays, dueIds, moduleMastery, isDue, reviewSkill, isSkillCardId, partitionDue } from "./srs";

describe("addDays", () => {
  it("handles month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", 0)).toBe("2026-03-01");
  });
});

describe("review", () => {
  it("correct answers lengthen the interval 1 → 3 → ×ease", () => {
    let m = review(undefined, true, "2026-10-01", 1);
    expect(m.interval).toBe(1);
    expect(m.due).toBe("2026-10-02");
    m = review(m, true, "2026-10-02", 2);
    expect(m.interval).toBe(3);
    m = review(m, true, "2026-10-05", 3);
    expect(m.interval).toBeGreaterThan(3);
    expect(m.correct).toBe(3);
  });

  it("a wrong answer resets to tomorrow and lowers ease, never below 1.3", () => {
    let m = review(undefined, true, "2026-10-01", 1);
    m = review(m, true, "2026-10-02", 2);
    const easeBefore = m.ease;
    m = review(m, false, "2026-10-05", 3);
    expect(m.reps).toBe(0);
    expect(m.interval).toBe(1);
    expect(m.due).toBe("2026-10-06");
    expect(m.ease).toBeLessThan(easeBefore);
    for (let i = 0; i < 20; i++) m = review(m, false, "2026-10-05", 4);
    expect(m.ease).toBeGreaterThanOrEqual(1.3);
    expect(m.lapses).toBe(21);
  });
});

describe("dueIds / isDue", () => {
  it("returns overdue first, then by lapses", () => {
    const a = { ...review(undefined, false, "2026-10-01", 1), due: "2026-10-02", lapses: 1 };
    const b = { ...review(undefined, false, "2026-10-01", 1), due: "2026-09-30", lapses: 0 };
    const c = { ...review(undefined, true, "2026-10-01", 1), due: "2026-11-30" };
    expect(dueIds({ a, b, c }, "2026-10-03")).toEqual(["b", "a"]);
    expect(isDue(c, "2026-10-03")).toBe(false);
  });
});

describe("moduleMastery", () => {
  it("weights lessons and quiz equally", () => {
    const mem = { q1: { ...review(undefined, true, "2026-10-01", 1) }, q2: { ...review(undefined, false, "2026-10-01", 1) } };
    expect(moduleMastery(["l1", "l2"], ["q1", "q2"], { l1: 1, l2: 1 }, mem)).toBe(75);
    expect(moduleMastery(["l1"], [], {}, {})).toBe(0);
    expect(moduleMastery(["l1"], [], { l1: 1 }, {})).toBe(100);
  });
});

describe("reviewSkill (procedural skills)", () => {
  it("behaves like review when the skill is due or new", () => {
    const a = reviewSkill(undefined, true, "2026-10-01", 1);
    const b = review(undefined, true, "2026-10-01", 1);
    expect(a).toEqual(b);
  });

  it("does not extend the interval for passes before the due date, but counts them", () => {
    let m = reviewSkill(undefined, true, "2026-10-01", 1);
    m = reviewSkill(m, true, "2026-10-02", 2); // due: interval 3
    const before = { ...m };
    m = reviewSkill(m, true, "2026-10-03", 3); // not due until 10-05
    expect(m.due).toBe(before.due);
    expect(m.interval).toBe(before.interval);
    expect(m.attempts).toBe(before.attempts + 1);
    expect(m.correct).toBe(before.correct + 1);
  });

  it("a failed session always reschedules for tomorrow", () => {
    let m = reviewSkill(undefined, true, "2026-10-01", 1);
    m = reviewSkill(m, true, "2026-10-02", 2);
    m = reviewSkill(m, false, "2026-10-03", 3);
    expect(m.due).toBe("2026-10-04");
    expect(m.reps).toBe(0);
  });
});

describe("skill card ids", () => {
  it("splits mentor skill cards from quiz items", () => {
    expect(isSkillCardId("lca-engage:lv-entry")).toBe(true);
    expect(isSkillCardId("dx-q-ind-ohca")).toBe(false);
    expect(isSkillCardId("skill:lca-engage")).toBe(false);
    expect(isSkillCardId("angio:grade:run-1")).toBe(false);
    expect(partitionDue(["a", "rca-engage:damped-injection", "b"])).toEqual({ quiz: ["a", "b"], cards: ["rca-engage:damped-injection"] });
  });
});
