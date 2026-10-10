// Tips from the antithrombotic orders (pci-antithrombotic-orders), driven in lad-focal at its 'hemochron'
// variant from 'guide-engaged' (phase 'wire') through PciLabSession, with the drugs console's actions:
// the case declares its Hemochron machine, the ACT is measured on the engine after the pre-case heparin,
// and then the case runs on for more than 30 minutes without an ACT: the recheck clock lapses and
// lowActFor (the regimen- and device-specific rule) says 'low-act' should be raised. NOT MET: no lab
// code raises the event yet. This package lists no PCI event source file, so this test injects the
// event into the context itself (activeEvents) wherever lowActFor holds; that only shows the tips follow
// once the rule fires. The event source (src/ui/lab/pciEvents/antithrombotic.ts exporting
// PCI_EVENT_SOURCES and raises) is out of scope and blocks the criterion; once it exists this test should
// call pciTipContext(x.snapshot(), PCI_EVENT_SOURCES) without injecting anything. The base source's own
// rule (a measured ACT below 250 s) does not raise it here, which this test also records.
//   npx vitest run src/simulation/pci/antithrombotic.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { tipsFor, type LabContext } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS } from "../../content/lab/raisable/waiting";
import { PciLabSession } from "../../ui/pci/PciLabSession";
import { resolvePciLaunch } from "../../ui/pci/launch";
import { applyDeliveryAction } from "../../ui/pci/inputBindings/support";
import { useSeriesStore } from "../../state/useSeriesStore";
import { pciTipContext } from "../../ui/lab/pciTips";
import { actGateFor, antithromboticContextForRun, declareAntithrombotic, lowActFor, recordAct } from "./actions/drugs";
import { antithromboticVariant } from "./scenarios/packs/antithrombotic";

const PKG = "pci-antithrombotic-orders";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

const ids = (ctx: LabContext, n = 20) => tipsFor(ctx, n).map((t) => t.id);

/** The context with 'low-act' held when the antithrombotic rule raises it (what an event source would add). */
function ctxOf(x: PciLabSession): LabContext {
  const snap = x.snapshot();
  const low = lowActFor(x.st, { actTrue: x.engine.vitals().actTrue });
  return pciTipContext({ ...snap, activeEvents: [...snap.activeEvents, ...(low ? (["low-act"] as const) : [])] });
}

describe("antithrombotic tips in lad-focal at 'hemochron' (pci-antithrombotic-orders)", () => {
  it("after the ACT that raises 'low-act', tipsFor(ctx, 20) includes pci-low-act-redose, and at phase 'wire' it includes pci-act-before-coronary-devices", () => {
    const r = resolvePciLaunch({ scenario: "lad-focal", variant: "hemochron", start: "guide-engaged", mode: "independent" });
    expect(r.problems).toEqual([]);
    const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
    sessions.push(x);
    const v = antithromboticVariant(x.resolved.seed)!;
    expect(v.actDevice).toBe("hemochron");
    // the case declares its machine (what the console does on first opening, from the run's variant)
    const ctx0 = antithromboticContextForRun(x.resolved.seed, x.s)!;
    expect(ctx0).toMatchObject({ actDevice: v.actDevice, hit: v.hit });
    expect(applyDeliveryAction(x, "drug", (s) => declareAntithrombotic(s, ctx0))).toBe(true);
    for (let i = 0; i < 20; i++) x.step(0.25);
    const before = ctxOf(x);
    expect(before.phase).toBe("wire");
    expect(ids(before)).toContain("pci-act-before-coronary-devices");
    // the first ACT on the patient after the pre-case heparin: at or above the Hemochron goal for this patient
    const act = x.engine.measureAct();
    expect(applyDeliveryAction(x, "drug", (s) => recordAct(s, act))).toBe(true);
    expect(act).toBeGreaterThanOrEqual(300);
    expect(actGateFor(x.st).ok).toBe(true);
    expect(ctxOf(x).events).not.toContain("low-act");
    // the action that raises 'low-act': more than 30 minutes of the case without a recheck
    const t0 = x.st.t;
    while (x.st.t < t0 + 30 * 60 + 5) x.step(0.1);
    expect(actGateFor(x.st).stale).toBe(true);
    const ctx = ctxOf(x);
    expect(ctx.events).toContain("low-act");
    expect(ctx.phase).toBe("wire");
    const shown = ids(ctx);
    expect(shown).toContain("pci-low-act-redose");
    expect(shown).toContain("pci-act-before-coronary-devices");
    // the base source alone does not raise it (no ACT below 250 s has been measured)
    expect(pciTipContext(x.snapshot()).events ?? []).not.toContain("low-act");
    // a recheck clears it while the true ACT is still at the Hemochron goal; else it stays (read against 300 s)
    const again = x.engine.measureAct();
    applyDeliveryAction(x, "drug", (s) => recordAct(s, again));
    expect(ctxOf(x).events?.includes("low-act")).toBe(again < 300 || x.engine.vitals().actTrue < 300);
  });

  // vacuous until an entry names this package: the antithrombotic tips wait under pci-tip-context
  it("no waiting.ts entry names pci-antithrombotic-orders, so the reachability waiting count is unchanged by it", () => {
    expect(WAITING_TIPS.filter((w) => w.raisedBy === PKG)).toEqual([]);
    expect(DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG)).toEqual([]);
  });
});
