import { describe, it, expect } from "vitest";
import { newCaseSession } from "../caseSession";
import { caseTipContexts } from "../../../ui/access/caseTips";
import { LAB_EVENTS, TIP_BY_ID, tipsFor, type LabContext } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS } from "../../../content/lab/raisable/waiting";
import { PLANNING_EVENTS, planningOf, raises } from "./planning";

// proc-chart-planted-problems: the planning module's tips. The case reports one context per lab
// (src/ui/access/caseTips.ts); the diagnostic setup context carries the patient and scenario events.

const PKG = "proc-chart-planted-problems";
const diagSetup = (ctxs: LabContext[]) => ctxs.find((c) => c.lab === "diagnostic" && c.phase === "setup")!;

describe("planning tips", () => {
  it("pde5-24h: after the nitroglycerin that raises 'hypotension', tipsFor(ctx, 20) includes diag-planning-pde5-nitrate", () => {
    const { session: s } = newCaseSession({ scenario: "pde5-24h", start: "post-diagnostic" });
    expect(tipsFor(diagSetup(caseTipContexts(s, "table")), 20).map((t) => t.id)).not.toContain("diag-planning-pde5-nitrate");
    // nitroglycerin for spasm, repeated: the PDE-5 interaction takes the pressure below the threshold
    let seen = false;
    for (let k = 0; k < 2 && !seen; k++) {
      s.order("gtn");
      s.runPending();
      for (let i = 0; i < 12 && !seen; i++) {
        s.wait(5);
        s.runPending();
        seen = s.activeEvents().includes("hypotension");
      }
    }
    expect(seen).toBe(true);
    const ids = tipsFor(diagSetup(caseTipContexts(s, "table")), 20).map((t) => t.id);
    expect(ids).toContain("diag-planning-pde5-nitrate");
    // at the chart the same context brings it up too
    expect(tipsFor(diagSetup(caseTipContexts(s, "chart")), 20).map((t) => t.id)).toContain("diag-planning-pde5-nitrate");
  });

  it("contrast-allergy-unpremedicated: at phase 'setup' tipsFor(ctx, 20) includes diag-planning-contrast-allergy", () => {
    const { session: s } = newCaseSession({ scenario: "contrast-allergy-unpremedicated" });
    planningOf(s)!.actions.readItem("medications");
    s.runPending();
    const ctx = diagSetup(caseTipContexts(s, "chart"));
    expect(ctx.events).toContain("contrast-sensitive");
    expect(tipsFor(ctx, 20).map((t) => t.id)).toContain("diag-planning-contrast-allergy");
  });

  it("the case events follow the record once the item that states them is read", () => {
    const pde5 = newCaseSession({ scenario: "pde5-24h" }).session;
    expect(pde5.activeEvents()).not.toContain("pde5-recent");
    planningOf(pde5)!.actions.readItem("medications");
    expect(pde5.activeEvents()).toContain("pde5-recent");
    const preg = newCaseSession({ scenario: "pregnancy-test" }).session;
    planningOf(preg)!.actions.readItem("pregnancy");
    preg.runPending();
    expect(preg.activeEvents()).toContain("pregnancy-possible");
    planningOf(preg)!.actions.act("pregnancy-test");
    preg.runPending();
    expect(preg.activeEvents()).not.toContain("pregnancy-possible");
  });

  it("raises names only registered events, and every waiting.ts entry naming this package is satisfiable", () => {
    for (const e of PLANNING_EVENTS) expect(LAB_EVENTS as readonly string[]).toContain(e);
    for (const r of raises) for (const e of r.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
    // waiting.ts names no tip or retarget for this package (its tips wait on proc-tip-context and
    // diag-tip-context, which are built), so there is nothing left waiting on it
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG);
    expect(waiting).toEqual([]);
    expect(deferred).toEqual([]);
    // the request's tips all exist
    for (const id of ["access-planning-site-history", "access-planning-anticoagulated", "diag-planning-pde5-nitrate", "diag-planning-contrast-allergy", "pci-planning-stent-candidacy", "diag-planning-resuscitation-status", "diag-planning-check-in", "diag-root-manifold-ready"])
      expect(TIP_BY_ID[id], id).toBeDefined();
  });
});
