import { describe, it, expect } from "vitest";
import { useProcedureStore, launchToCase, logCase, WORKSPACE_FOR_START } from "./useProcedureStore";
import { useProgressStore } from "./useProgressStore";
import { newCaseSession } from "../simulation/session/caseSession";
import { fastForward } from "../simulation/session/autopilot";
import { LabRun } from "../ui/lab/labRun";
import type { LogSessionInput } from "../progress/types";
import { caseKey } from "../progress/competency";

// proc-foundation-scenarios-ledger: the full case's launch params, scenario cases and logbook row.

describe("full-case store", () => {
  it("launch params become a new-case request; unknown values are dropped", () => {
    expect(launchToCase({ scenario: "default", start: "closure", access: "femoral", mode: "supervised", seed: "abc", workspace: "table" })).toEqual({
      scenario: "default",
      start: "closure",
      access: "femoral",
      mode: "supervised",
      seed: "abc",
      workspace: "table",
    });
    expect(launchToCase({ scenario: "nope", start: "lunch", access: "jugular", mode: "relaxed", workspace: "bar" })).toEqual({});
    expect(launchToCase({ access: "radial" }).access).toBe("radial-right");
  });

  it("a scenario at 'closure' opens on the Closure workspace with a sheath in, after a 'preparing' state", async () => {
    const opening = useProcedureStore.getState().newCase({ scenario: "default", start: "closure", seed: "store-closure", access: "radial-right" });
    expect(useProcedureStore.getState().preparing).toBe(true);
    expect(useProcedureStore.getState().session).toBeNull();
    await opening;
    const st = useProcedureStore.getState();
    expect(st.preparing).toBe(false);
    expect(st.workspace).toBe("closure");
    expect(WORKSPACE_FOR_START.closure).toBe("closure");
    expect(st.scenarioId).toBe("default");
    expect(st.session!.sheath).not.toBeNull();
    expect(st.session!.catheter!.inBody).toBe(false);
    expect(st.run!.caseId).toMatch(/^procedure:default~store-closure$/);
    expect(st.launchNotice).toBeNull();
    expect(st.session!.decisions()).toEqual([]);
  });

  it("a newer case replaces one still being prepared", async () => {
    const first = useProcedureStore.getState().newCase({ scenario: "default", start: "closure", seed: "store-old", access: "radial-right" });
    await useProcedureStore.getState().newCase({ scenario: "default", seed: "store-new", access: "radial-right" });
    await first;
    const st = useProcedureStore.getState();
    expect(st.seed).toBe("store-new");
    expect(st.session!.seed).toBe("store-new");
    expect(st.preparing).toBe(false);
  });

  it("two random patients are two distinct cases for the competency count", async () => {
    const keys: string[] = [];
    for (const seed of ["store-key-1", "store-key-2"]) {
      await useProcedureStore.getState().newCase({ scenario: "default", seed, access: "radial-right" });
      const row = { caseId: useProcedureStore.getState().run!.caseId, date: "2026-10-08", lab: "procedure" as const };
      keys.push(caseKey(row));
    }
    expect(keys[0]).not.toBe(keys[1]);
  });

  it("a launch mode is the session's and the run's mode", () => {
    useProcedureStore.getState().newCase(launchToCase({ scenario: "default", mode: "exam", seed: "store-exam" }));
    const st = useProcedureStore.getState();
    expect(st.session!.mode).toBe("exam");
    expect(st.run!.mode).toBe("exam");
  });

  it("session.decide() records appear in finish().decisions and in the logbook row; a part-played case never passes", async () => {
    await useProcedureStore.getState().newCase({ scenario: "default", start: "recovery", seed: "store-log", access: "radial-right" });
    const st = useProcedureStore.getState();
    st.act((s) => s.decide({ id: "store-test", stage: "recovery", label: "A test decision", correct: true, expected: "x", given: "x" }));
    st.act((s) => s.submitHandover(s.truth()));
    const before = useProgressStore.getState().profile.logbook.length;
    const sum = useProcedureStore.getState().finish()!;
    expect(sum.decisions.some((d) => d.id === "store-test")).toBe(true);
    const book = useProgressStore.getState().profile.logbook;
    expect(book.length).toBe(before + 1);
    const row = book[book.length - 1];
    expect(row.caseId).toBe("procedure:default~store-log");
    expect(row.decisions?.map((d) => d.id)).toEqual(sum.decisions.map((d) => d.id));
    // the autopilot's steps are not the learner's: none in the row, and the row is not a pass
    expect(sum.decisions.map((d) => d.id)).not.toContain("time-out-backed");
    expect(row.passed).toBe(false);
    expect(row.notes).toBe("Opened at recovery; earlier steps played by the autopilot");
    // finishing again writes no second row
    useProcedureStore.getState().finish();
    expect(useProgressStore.getState().profile.logbook.length).toBe(before + 1);
  });

  it("logCase copies the decisions into the run and writes one row", () => {
    const rows: LogSessionInput[] = [];
    const { session: s } = newCaseSession({ seed: "store-logcase", access: "femoral" });
    fastForward(s, "recovery");
    s.submitHandover(s.truth());
    const sum = s.finish()!;
    const run = new LabRun({ sim: "procedure", caseId: "procedure:default", launchMode: "guided", source: "full-case", epa: "access-femoral", log: (x) => (rows.push(x), { ...x, id: "r", t: 0, epas: [], rungs: {} } as never) });
    logCase(run, s, sum);
    logCase(run, s, sum);
    expect(rows).toHaveLength(1);
    expect(rows[0].decisions!.map((d) => d.id)).toEqual(sum.decisions.map((d) => d.id));
    expect(rows[0].decisions!.some((d) => d.id === "femoral-act")).toBe(true);
    expect(rows[0].metrics!.decisionsTotal).toBe(sum.decisions.length);
    expect(rows[0].access).toBe("femoral");
    expect(rows[0].source).toBe("full-case");
  });
});
