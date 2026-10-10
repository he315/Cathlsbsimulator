import { describe, it, expect } from "vitest";
import {
  generateBatch,
  resolveCase,
  dailyCase,
  replaySeed,
  weakestSkillPreset,
  caseDifficultyAxes,
  PRESET_ORDER,
} from "./caseGenerator";
import type { MistakeRecord } from "../types";

describe("procedural generation is reproducible", () => {
  it("every generated case reconstructs byte-for-byte from its id", () => {
    for (const key of PRESET_ORDER) {
      const batch = generateBatch(key, 12, "fixed-seed");
      for (const c of batch) {
        const back = resolveCase(c.id);
        expect(back).toBeTruthy();
        expect(JSON.stringify(back)).toBe(JSON.stringify(c));
      }
    }
  });

  it("the same seed base yields an identical batch", () => {
    const a = generateBatch("high-rca", 20, "abc");
    const b = generateBatch("high-rca", 20, "abc");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("the daily case is deterministic for a given date", () => {
    const d = new Date("2026-07-02T00:00:00Z");
    expect(JSON.stringify(dailyCase(d))).toBe(JSON.stringify(dailyCase(d)));
  });

  it("replaySeed round-trips through resolveCase", () => {
    const c = replaySeed("hello-world");
    expect(JSON.stringify(resolveCase(c.id))).toBe(JSON.stringify(c));
  });
});

describe("preset constraints are honoured", () => {
  it("high-rca cases always carry the high/anterior take-off at difficulty ≥ 4", () => {
    for (const c of generateBatch("high-rca", 40, "x")) {
      expect(c.variants).toContain("high-rca");
      expect(c.variants).toContain("anterior-rca");
      expect(c.difficulty).toBeGreaterThanOrEqual(4);
    }
  });

  it("case ids in a batch are unique", () => {
    const ids = new Set(generateBatch("rand", 100, "u").map((c) => c.id));
    expect(ids.size).toBe(100);
  });
});

describe("weakestSkillPreset", () => {
  it("maps an empty ledger to random practice", () => {
    expect(weakestSkillPreset({})).toBe("rand");
  });

  it("targets the learner's most frequent mistake", () => {
    const mistakes: Record<string, MistakeRecord> = {
      "lv-entry": { code: "lv-entry", count: 5, lastSeen: 2, contexts: [] },
      "poor-view": { code: "poor-view", count: 1, lastSeen: 1, contexts: [] },
    };
    expect(weakestSkillPreset(mistakes)).toBe("lv-trap");
  });
});

describe("caseDifficultyAxes", () => {
  it("returns engagement/rca/view axes within 1..5", () => {
    const c = generateBatch("high-rca", 1, "axes")[0];
    const a = caseDifficultyAxes(c);
    for (const v of [a.engagement, a.rca, a.view]) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(5);
    }
    expect(a.rca).toBeGreaterThanOrEqual(4); // high/anterior RCA is a hard take-off
  });
});
