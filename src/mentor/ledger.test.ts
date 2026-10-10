// The decision ledger (found-lab-session-plumbing).
//   npx vitest run src/mentor/ledger.test.ts
import { describe, expect, it } from "vitest";
import { cleanDecision, DECISION_ID_MAX, DECISION_TEXT_MAX, DECISION_TIPS_MAX, DecisionLedger, isDecisionRecord, MAX_DECISIONS_PER_RUN, summariseLedger, type DecisionRecord } from "./ledger";

const rec = (id: string, correct: boolean, stage = "plan", lessonId?: string): DecisionRecord => ({ id, t: 1, stage, label: id, correct, expected: "x", given: correct ? "x" : "y", ...(lessonId ? { lessonId } : {}) });

describe("DecisionLedger", () => {
  it("keeps decisions in order, a repeated id replacing the earlier answer", () => {
    const l = new DecisionLedger();
    l.add(rec("a", false));
    l.add(rec("b", true, "closure"));
    l.add({ ...rec("a", true), t: 9 });
    expect(l.all().map((r) => [r.id, r.correct, r.t])).toEqual([
      ["a", true, 9],
      ["b", true, 1],
    ]);
    expect(l.byStage("closure").map((r) => r.id)).toEqual(["b"]);
  });

  it("stores only its own fields and caps a run", () => {
    const l = new DecisionLedger();
    const stored = l.add({ ...rec("a", true), extra: () => 1 } as unknown as DecisionRecord);
    expect(Object.keys(stored).sort()).toEqual(["correct", "expected", "given", "id", "label", "stage", "t"]);
    expect(isDecisionRecord(JSON.parse(JSON.stringify(stored)))).toBe(true);
    for (let i = 0; i < MAX_DECISIONS_PER_RUN + 5; i++) l.add(rec(`d${i}`, true));
    expect(l.size).toBe(MAX_DECISIONS_PER_RUN);
  });

  it("bounds the stored text and tip ids", () => {
    const long = "x".repeat(1000);
    const c = cleanDecision({ id: long, t: 1, stage: long, label: long, correct: true, expected: long, given: long, lessonId: long, tipIds: Array.from({ length: 20 }, (_, i) => `tip-${i}`) });
    expect(c.id.length).toBe(DECISION_ID_MAX);
    expect(c.stage.length).toBe(DECISION_ID_MAX);
    expect(c.lessonId!.length).toBe(DECISION_ID_MAX);
    for (const k of ["label", "expected", "given"] as const) expect(c[k].length).toBe(DECISION_TEXT_MAX);
    expect(c.label.endsWith("\u2026")).toBe(true);
    expect(c.tipIds).toHaveLength(DECISION_TIPS_MAX);
    expect(cleanDecision(rec("short", true)).label).toBe("short");
  });

  it("rejects malformed stored records", () => {
    expect(isDecisionRecord({ ...rec("a", true), tipIds: [1] })).toBe(false);
    expect(isDecisionRecord({ ...rec("a", true), lessonId: 3 })).toBe(false);
    expect(isDecisionRecord({ ...rec("a", true), correct: "yes" })).toBe(false);
    expect(isDecisionRecord(null)).toBe(false);
  });

  it("summarises totals and the lessons to review", () => {
    const s = summariseLedger([rec("a", false, "plan", "l1"), rec("b", false, "pci", "l1"), rec("c", true, "pci", "l2"), rec("d", false, "closure", "l3")]);
    expect(s).toEqual({ total: 4, correct: 1, lessonsToReview: ["l1", "l3"], stages: ["plan", "pci", "closure"] });
  });
});
