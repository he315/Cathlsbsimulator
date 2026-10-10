// repair-session-flow (3): the postponed-case end path. A case the planning module's hold and delay
// ended before any puncture can be finished: CaseSession.finish() accepts the postponed state and
// returns the summary with the decisions, and useProcedureStore finishes it at once, so the debrief
// (the handover workspace's summary) and the logbook row appear. A postponement after a puncture
// still needs the site closed.
//   npx vitest run src/simulation/session/postponedFinish.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession } from "./caseSession";
import { advanceToFlash, aimedPose, prepare } from "./autopilot";
import { planningOf } from "./modules/planning";
import { useProcedureStore } from "../../state/useProcedureStore";
import { useProgressStore } from "../../state/useProgressStore";
import { caseTipContexts } from "../../ui/access/caseTips";

describe("postponed-case end path", () => {
  it("doac-recent: hold and delay before any puncture, and finish() returns the summary with the planning decisions", () => {
    const { session: s } = newCaseSession({ scenario: "doac-recent" });
    // not postponed: the case is not finished until the site is closed
    expect(s.postponement()).toBeNull();
    expect(s.finish()).toBeNull();
    expect(s.finished).toBe(false);
    const m = planningOf(s)!;
    m.actions.readItem("medications");
    s.runPending();
    m.actions.act("hold-and-delay");
    const pp = s.postponement()!;
    expect(pp).toMatchObject({ by: "planning", beforePuncture: true });
    expect(pp.text).toMatch(/postponed/i);
    const sum = s.finish()!;
    expect(sum).not.toBeNull();
    expect(s.finished).toBe(true);
    expect(sum.postponed).toEqual({ t: pp.t, text: pp.text });
    // never a pass: no access was done (the debrief and the logbook row agree)
    expect(sum.passed).toBe(false);
    expect(sum.scenarioId).toBe("doac-recent");
    expect(sum.decisions.find((d) => d.id === "planning-problem")?.correct).toBe(true);
    expect(sum.decisions.find((d) => d.id === "planning-action-hold-and-delay")?.correct).toBe(true);
    // no access was done: no devices beyond the defaults' wire, no contrast, no heparin
    expect(sum.totals.contrastMl).toBe(0);
    expect(sum.heparinU).toBe(0);
  });

  it("a postponement after a skin puncture still needs the site closed", () => {
    const { session: s } = newCaseSession({ scenario: "doac-recent" });
    prepare(s);
    expect(s.placeNeedle(aimedPose(s))).toBe(true);
    advanceToFlash(s);
    expect(s.hookAt.puncture).toBeDefined();
    planningOf(s)!.actions.act("hold-and-delay");
    expect(s.postponement()).toMatchObject({ beforePuncture: false });
    expect(s.finish()).toBeNull();
    expect(s.finished).toBe(false);
  });

  it("the store: hold and delay finishes the case, opens the summary on the handover workspace and writes one logbook row, not a pass", async () => {
    await useProcedureStore.getState().newCase({ scenario: "doac-recent" });
    const before = useProgressStore.getState().profile.logbook.length;
    const st = useProcedureStore.getState();
    expect(st.summary).toBeNull();
    st.act((s) => planningOf(s)!.actions.act("hold-and-delay"));
    const after = useProcedureStore.getState();
    expect(after.summary).not.toBeNull();
    expect(after.summary!.postponed).toBeDefined();
    expect(after.summary!.passed).toBe(false);
    expect(after.logged).toBe(true);
    expect(after.workspace).toBe("handover");
    const book = useProgressStore.getState().profile.logbook;
    expect(book.length).toBe(before + 1);
    const row = book[book.length - 1];
    expect(row.caseId).toBe("procedure:doac-recent");
    expect(row.passed).toBe(false);
    expect(row.notes).toMatch(/postponed/i);
    expect(row.decisions?.some((d) => d.id === "planning-problem" && d.correct)).toBe(true);
    // finishing again (the button) writes no second row and keeps the summary
    expect(useProcedureStore.getState().finish()).not.toBeNull();
    expect(useProgressStore.getState().profile.logbook.length).toBe(before + 1);
  });

  it("the store: once the postponed case is logged its clock and patient stop, so the header clock keeps the debrief's time", async () => {
    await useProcedureStore.getState().newCase({ scenario: "doac-recent" });
    useProcedureStore.getState().act((s) => planningOf(s)!.actions.act("hold-and-delay"));
    const st = useProcedureStore.getState();
    expect(st.logged).toBe(true);
    const s = st.session!;
    const t0 = s.tS;
    const e0 = st.engine?.time ?? 0;
    for (let k = 0; k < 20; k++) useProcedureStore.getState().tick(0.5);
    expect(s.tS).toBe(t0);
    expect(useProcedureStore.getState().engine?.time ?? 0).toBe(e0);
  });

  it("the case tips of a case postponed before any puncture keep to the planning tips: no closure, band or recovery context", () => {
    const { session: s } = newCaseSession({ scenario: "doac-recent" });
    const closure = caseTipContexts(s, "handover");
    expect(closure.some((c) => c.lab === "access" && c.phase === "closure")).toBe(true);
    planningOf(s)!.actions.act("hold-and-delay");
    expect(s.postponement()).toMatchObject({ beforePuncture: true });
    for (const w of ["handover", "closure", "recovery", "access", "table"] as const) {
      const ctx = caseTipContexts(s, w);
      expect(ctx.some((c) => c.lab === "access" && c.phase === "plan")).toBe(true);
      expect(ctx.some((c) => c.lab === "access" && (c.phase === "closure" || c.phase === "sheath" || c.phase === "complication"))).toBe(false);
      expect(ctx.some((c) => c.lab === "diagnostic" && c.phase !== undefined)).toBe(false);
    }
  });
});
