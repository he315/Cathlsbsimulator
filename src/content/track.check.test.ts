// Per-author check: `TRACK=<track-id> npx vitest run src/content/track.check.test.ts`
// validates ONE track in isolation (so other authors' in-progress files can't
// break your check). Skipped during the normal full test run.
import { describe, it, expect } from "vitest";
import type { Track } from "./schema";
import { REF_IDS } from "./refs";
import { validateTrack } from "./validate";

const id = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.TRACK;

describe.skipIf(!id)(`track ${id ?? "(none)"}`, () => {
  it("validates", async () => {
    const mod = (await import(`./tracks/${id}.ts`)) as Record<string, Track>;
    const track = Object.values(mod).find((v) => v && typeof v === "object" && "modules" in v);
    expect(track, "track export not found").toBeTruthy();
    const errs = validateTrack(track as Track, REF_IDS);
    expect(errs).toEqual([]);
    const t = track as Track;
    const lessons = t.modules.reduce((n, m) => n + m.lessons.length, 0);
    const quiz = t.modules.reduce((n, m) => n + m.quiz.length, 0);
    console.log(`${t.id}: ${t.modules.length} modules, ${lessons} lessons, ${quiz} quiz items, ${t.cases.length} cases`);
  });
});
