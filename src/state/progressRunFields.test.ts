// Run fields on logbook rows (found-lab-session-plumbing): the storage bounds on decisions and
// metrics, older rows losing their decisions, and loaded rows being validated.
//   npx vitest run src/state/progressRunFields.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { DECISION_ROWS_KEPT, MAX_METRICS_PER_ROW, migrateProfile, useProgressStore, withRunFields } from "./useProgressStore";
import type { LogbookEntry, LogSessionInput } from "../progress/types";
import type { DecisionRecord } from "../mentor/ledger";

const store = () => useProgressStore.getState();
const dec = (id: string): DecisionRecord => ({ id, t: 1, stage: "plan", label: id, correct: true, expected: "a", given: "a" });
const input = (i: number): LogSessionInput => ({ lab: "haemo", source: "haemo", caseId: `haemo:s${i}`, mode: "guided", passed: true, decisions: [dec(`d${i}`)], t: 1_700_000_000_000 + i * 1000 });

beforeEach(() => {
  store().reset();
});

describe("run fields", () => {
  it("keeps at most MAX_METRICS_PER_ROW finite metrics", () => {
    const metrics: Record<string, number> = { bad: Number.NaN };
    for (let i = 0; i < MAX_METRICS_PER_ROW + 10; i++) metrics[`m${i}`] = i;
    const row = withRunFields({ epas: [] } as unknown as LogbookEntry, { ...input(0), metrics });
    expect(Object.keys(row.metrics!)).toHaveLength(MAX_METRICS_PER_ROW);
    expect(row.metrics!.bad).toBeUndefined();
  });

  it("older rows lose their decisions; the most recent keep them", () => {
    const n = DECISION_ROWS_KEPT + 3;
    for (let i = 0; i < n; i++) store().logSession(input(i));
    const book = store().profile.logbook;
    expect(book).toHaveLength(n);
    expect(book.slice(0, 3).every((r) => r.decisions === undefined)).toBe(true);
    expect(book.slice(3).every((r) => r.decisions?.length === 1)).toBe(true);
    expect(book[n - 1].decisions![0].id).toBe(`d${n - 1}`);
  });

  it("validates decisions and metrics on rows loaded from storage or an import", () => {
    const good = dec("ok");
    const row = { id: "r1", t: 1, date: "2026-01-01", lab: "haemo", source: "haemo", caseId: "haemo", caseName: "x", epas: [], rungs: {}, mode: "guided", role: "assistant", devices: [], complications: [], criticalErrors: 0, passed: true, decisions: [good, { id: 3 }, "junk", { ...good, id: "long", label: "y".repeat(500) }], metrics: { a: 1, b: "2", c: Number.POSITIVE_INFINITY } };
    const bad = { ...row, id: "r2", decisions: "not an array", metrics: [1, 2] };
    const p = migrateProfile({ schema: 2, logbook: [row, bad] });
    const [r1, r2] = p.logbook;
    expect(r1.decisions!.map((d) => d.id)).toEqual(["ok", "long"]);
    expect(r1.decisions![1].label.length).toBeLessThan(200);
    expect(r1.metrics).toEqual({ a: 1 });
    expect(r2.decisions).toBeUndefined();
    expect(r2.metrics).toBeUndefined();
  });
});
