// pci-attending tips: the attending's pre-brief and plan put the PCI lab's tips at phase 'plan' (its event
// source, src/mentor/bridge/pciSession.ts, exports `raises`), where the time-out and fourteen-step planning
// tips show; the sign-out puts them at 'finish', where the sign-out tip shows. Every waiting.ts entry naming
// this package is satisfiable from that declaration.
//   npx vitest run src/mentor/bridge/pciSession.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { raises } from "./pciSession";
import { PciLabSession, policyForMode } from "../../ui/pci/PciLabSession";
import { resolvePciLaunch } from "../../ui/pci/launch";
import { PciAttending } from "../../ui/pci/usePciAttending";
import { pciTipContext } from "../../ui/lab/pciTips";
import { withRecognition } from "../../ui/lab/pciEvents/recognition";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type TipTrigger } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS } from "../../content/lab/raisable/waiting";
import { useSeriesStore } from "../../state/useSeriesStore";

const PKG = "pci-attending";
const sessions: PciLabSession[] = [];
const attendings: PciAttending[] = [];
afterEach(() => {
  for (const a of attendings.splice(0)) a.detach();
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

/** A trigger can match given this source's raises (phase, events, required events). */
function satisfiableHere(when: TipTrigger): boolean {
  const any = (want: readonly string[] | undefined, have: readonly string[]) => !want?.length || want.some((x) => have.includes(x));
  return any(when.phase, raises.phases) && any(when.event, raises.events) && (when.requires ?? []).every((e) => (raises.events as readonly string[]).includes(e));
}

function rig(scenario: string) {
  const r = resolvePciLaunch({ scenario, mode: "supervised" });
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true, policy: policyForMode("supervised") });
  sessions.push(x);
  const a = new PciAttending(x, { damagedWire: false, absentMember: null });
  attendings.push(a);
  a.attach();
  return { x, a };
}

describe("PCI attending tips", () => {
  it("at phase 'plan' (the pre-brief and plan of lad-focal) tipsFor(ctx, 20) includes pci-mon-time-out and pci-planning-fourteen-steps", () => {
    const { x, a } = rig("lad-focal");
    const ctx = pciTipContext(withRecognition(x.snapshot()));
    expect(ctx.phase).toBe("plan");
    const ids = tipsFor(ctx, 20).map((t) => t.id);
    expect(ids).toContain("pci-planning-fourteen-steps");
    // Both tips match at phase 'plan'. The time-out tip is not in the first 20: more than 20 PCI tips have
    // the trigger { phase: ['plan'] } alone, and tipsFor breaks that tie by registry order, so it ranks
    // after them (as PciLabSession.tips.test.ts notes for another plan tip). Ranking the plan tips is the
    // tip registry's to settle: docs/curriculum/lab-build-plan.json assigns it to tip-retarget-catchup, item (g),
    // which adds the tipsFor(ctx, 20) test for lad-focal; the attending's time-out form shows the tip itself
    // whenever tips are visible (PciTimeOut FormTips).
    const ranked = tipsFor(ctx, LAB_TIPS.length).map((t) => t.id);
    expect(ranked).toContain("pci-mon-time-out");
    expect(ranked.filter((id) => TIP_BY_ID[id].lab === "pci" && JSON.stringify(TIP_BY_ID[id].when) === JSON.stringify({ phase: ["plan"] })).length).toBeGreaterThan(20);
    // the plan form and the time-out keep the phase
    a.toPlan();
    a.setPlan({ contrastCeilingMl: 150, forecast: [{ complication: "dissection", firstMove: "stent" }], support: "none", operatorState: "rested" });
    a.submitPlan();
    const t = pciTipContext(withRecognition(x.snapshot()));
    expect(t.phase).toBe("plan");
    expect(tipsFor(t, LAB_TIPS.length).map((x) => x.id)).toContain("pci-mon-time-out");
  });

  it("the sign-out gives phase 'finish', where the sign-out tip shows", () => {
    const { x, a } = rig("rca-calcified");
    a.startCase();
    a.openSignOut();
    const ctx = pciTipContext(withRecognition(x.snapshot()));
    expect(ctx.phase).toBe("finish");
    expect(tipsFor(ctx, 20).map((t) => t.id)).toContain("pci-mon-sign-out");
  });

  it("the raises export names the plan and finish phases, and the tips' triggers are satisfiable from it", () => {
    expect(raises.lab).toBe("pci");
    expect([...raises.phases].sort()).toEqual(["finish", "plan"]);
    for (const id of ["pci-mon-time-out", "pci-planning-fourteen-steps", "pci-mon-sign-out", "pci-safe-state-check", "pci-planning-bailout-kit"]) {
      const tip = TIP_BY_ID[id];
      expect(tip, id).toBeTruthy();
      expect(satisfiableHere(tip.when), id).toBe(true);
    }
  });

  it("every waiting.ts entry naming this package is satisfiable from its raises", () => {
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG);
    for (const id of waiting) {
      const tip = LAB_TIPS.find((t) => t.id === id);
      expect(tip, id).toBeTruthy();
      expect(satisfiableHere(tip!.when), id).toBe(true);
    }
    for (const d of deferred) expect(satisfiableHere(d.when), d.tipId).toBe(true);
    // the plan names no waiting entry for this package: its tips (pci-mon-time-out, pci-planning-*, pci-mon-sign-out)
    // wait on pci-tip-context, whose phases the PCI lab already raises
    expect(waiting.length + deferred.length).toBe(0);
  });
});
