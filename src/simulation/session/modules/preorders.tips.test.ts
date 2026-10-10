import { describe, it, expect } from "vitest";
import { newCaseSession } from "../caseSession";
import { prepare, fastForward } from "../autopilot";
import { caseTipContexts } from "../../../ui/access/caseTips";
import { LAB_EVENTS, TIP_BY_ID, tipsFor, type LabContext } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS } from "../../../content/lab/raisable/waiting";
import { PREORDER_CASES, preorderPatient, referenceOrders } from "../preorders";
import { PREORDER_EVENTS, preordersOf, raises } from "./preorders";

// proc-preprocedure-orders: the order sheet module's tips. The case reports one context per lab
// (src/ui/access/caseTips.ts): the access plan at the chart, and the PCI finish once the case has
// been to PCI; the module's 'high-contrast-volume' is a case event every lab sees.

const PKG = "proc-preprocedure-orders";
const ctxOf = (ctxs: LabContext[], lab: LabContext["lab"], phase: string) => ctxs.find((c) => c.lab === lab && c.phase === phase)!;

describe("pre-procedure order tips", () => {
  it("oac-af-low-risk: at phase 'plan' tipsFor(ctx, 20) includes access-anticoagulated-go-radial", () => {
    const { session: s } = newCaseSession({ scenario: "oac-af-low-risk" });
    const ctx = ctxOf(caseTipContexts(s, "chart"), "access", "plan");
    expect(ctx).toBeDefined();
    expect(tipsFor(ctx, 20).map((t) => t.id)).toContain("access-anticoagulated-go-radial");
  });

  it("oac-af-low-risk: after the return from PCI over the stated ceiling raises 'high-contrast-volume', tipsFor(ctx, 20) includes pci-caki-after-case", () => {
    const { session: s } = newCaseSession({ scenario: "oac-af-low-risk" });
    const m = preordersOf(s)!;
    const orders = referenceOrders(PREORDER_CASES["oac-af-low-risk"], preorderPatient(s.profile));
    const ceiling = 120;
    expect(m.actions.sign({ ...orders, ceilingMl: ceiling })).toBe(true);
    s.runPending();
    prepare(s, { record: false });
    fastForward(s, "post-diagnostic");
    expect(s.toPci()).not.toBeNull();
    // within the ceiling: no event, and the PCI finish context does not bring the tip up
    expect(s.activeEvents()).not.toContain("high-contrast-volume");
    s.returnFromLab("pci", { contrastMl: ceiling + 30, fluoroS: 600, durationS: 0 });
    s.runPending();
    expect(s.activeEvents()).toContain("high-contrast-volume");
    const pciFinish = ctxOf(caseTipContexts(s, "handover"), "pci", "finish");
    expect(pciFinish.events).toContain("high-contrast-volume");
    expect(tipsFor(pciFinish, 20).map((t) => t.id)).toContain("pci-caki-after-case");
    // the module's event is what brings it up: the same context without it does not
    const without: LabContext = { ...pciFinish, events: (pciFinish.events ?? []).filter((e) => e !== "high-contrast-volume") };
    expect(tipsFor(without, 20).map((t) => t.id)).not.toContain("pci-caki-after-case");
    // the contrast decision is in the ledger, and the nurse called the ceiling
    expect(s.decisions().find((d) => d.id === "preorders-ceiling-kept")!.correct).toBe(false);
    s.wait(5);
    s.runPending();
    expect(s.log.some((l) => l.kind === "nurse" && /ceiling/.test(l.text))).toBe(true);
  });

  it("raises names only registered events, and every waiting.ts entry naming this package is satisfiable", () => {
    for (const e of PREORDER_EVENTS) expect(LAB_EVENTS as readonly string[]).toContain(e);
    for (const r of raises) for (const e of r.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
    expect(raises.map((r) => r.lab).sort()).toEqual(["access", "diagnostic", "pci"]);
    // waiting.ts names no tip or retarget for this package (the request's tips wait on proc-tip-context,
    // diag-tip-context and pci-tip-context, which are built), so nothing is left waiting on it
    expect(WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips)).toEqual([]);
    expect(DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG)).toEqual([]);
    // the requests' tips all exist
    for (const id of ["access-anticoagulated-go-radial", "access-crossover-anticoagulated-care", "pci-check-oral-loading", "diag-caki-prepare", "pci-caki-after-case"]) expect(TIP_BY_ID[id], id).toBeDefined();
  });
});
