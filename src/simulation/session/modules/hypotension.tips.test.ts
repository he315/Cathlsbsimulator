import { describe, it, expect } from "vitest";
import { newCaseSession, type CaseSession } from "../caseSession";
import { caseTipContexts, raises as caseRaises } from "../../../ui/access/caseTips";
import { mcsTipContext, raises as mcsRaises } from "../../../ui/lab/mcsTips";
import { LAB_EVENTS, TIP_BY_ID, tipsFor, type LabContext, type LabEvent, type LabId } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { HYPOTENSION_EVENTS, hypotensionOf, raises } from "./hypotension";

// proc-hypotension-pressors: the hypotension module's tips. The case reports one context per lab
// (src/ui/access/caseTips.ts); the phase-less PCI context carries the patient events, so the
// low pressure brings up the PCI lab's hypotension tips in the full case.
//   npx vitest run src/simulation/session/modules/hypotension.tips.test.ts

const PKG = "proc-hypotension-pressors";
const phaseless = (ctxs: LabContext[], lab: LabId) => ctxs.find((c) => c.lab === lab && !c.phase)!;
const ids = (ctx: LabContext | undefined | null, n = 20) => (ctx ? tipsFor(ctx, n).map((t) => t.id) : []);

function untilEvent(s: CaseSession, e: LabEvent, maxS: number): boolean {
  for (let t = 0; t <= maxS; t += 5) {
    if (s.activeEvents().includes(e)) return true;
    s.wait(5);
    s.runPending();
  }
  return s.activeEvents().includes(e);
}

describe("hypotension tips", () => {
  it("hypo-bleeding: once the pressure falls and 'hypotension' is raised, tipsFor(ctx, 20) includes pci-hypotension-match-pressor and pci-mon-false-hypotension", () => {
    const { session: s } = newCaseSession({ scenario: "hypo-bleeding" });
    // the case opens with the pressure still up: no hypotension tip yet
    expect(ids(caseTipContexts(s, "table").find((c) => c.lab === "pci" && !c.phase))).not.toContain("pci-hypotension-match-pressor");
    expect(untilEvent(s, "hypotension", 900)).toBe(true);
    const pci = ids(phaseless(caseTipContexts(s, "table"), "pci"));
    expect(pci).toContain("pci-hypotension-match-pressor");
    expect(pci).toContain("pci-mon-false-hypotension");
    // the module reports the low pressure of its episode too
    expect(hypotensionOf(s)!.events!()).toContain("hypotension");
  });

  it("oedema-lvedp-high: the oedema after a bolus brings up diag-oedema-on-table in the diagnostic context; the right heart numbers open haemo-wedge-oedema-risk", () => {
    const { session: s } = newCaseSession({ scenario: "oedema-lvedp-high" });
    const m = hypotensionOf(s)!;
    m.actions.order("saline-1000");
    expect(untilEvent(s, "pulmonary-oedema", 900)).toBe(true);
    expect(s.activeEvents()).toContain("high-contrast-volume");
    const diag = caseTipContexts(s, "table").find((c) => c.lab === "diagnostic" && c.phase === "setup");
    expect(ids(diag)).toContain("diag-oedema-on-table");
    m.actions.order("rhc");
    const haemo = m.actions.rhcTipContext();
    expect(haemo).toEqual(expect.objectContaining({ lab: "haemo", phase: "right-heart" }));
    expect(ids(haemo)).toContain("haemo-wedge-oedema-risk");
  });

  it("the escalation hands over to a support console, whose select step shows mcs-pressor-escalation-limit", () => {
    const ctx = mcsTipContext("impella", "select", null, { events: ["hypotension"] });
    expect(ids(ctx)).toContain("mcs-pressor-escalation-limit");
    expect(mcsRaises.phases).toContain("select");
  });

  it("raises names only registered events, and every waiting.ts entry naming this package becomes satisfiable", () => {
    for (const e of HYPOTENSION_EVENTS) expect(LAB_EVENTS as readonly string[]).toContain(e);
    for (const r of raises) for (const e of r.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
    // a waiting tip is satisfiable when a lab context built from what the case declares brings it up
    const declared: LabRaises[] = [...raises, ...caseRaises];
    const satisfiable = (tipId: string): boolean => {
      const tip = TIP_BY_ID[tipId];
      if (!tip) return false;
      const lab = declared.filter((r) => r.lab === tip.lab);
      const events = [...new Set(lab.flatMap((r) => [...r.events]))];
      const phases: (string | undefined)[] = [undefined, ...new Set(lab.flatMap((r) => [...r.phases]))];
      return phases.some((phase) => tipsFor({ lab: tip.lab, ...(phase ? { phase: phase as LabContext["phase"] } : {}), events }, 1000).some((t) => t.id === tipId));
    };
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG);
    for (const id of waiting) expect(satisfiable(id), id).toBe(true);
    // waiting.ts names no tip or retarget for this package (the request's tips wait on the context
    // packages), so the PCI lab's waiting count falls by at least their number (none) ...
    expect(waiting.filter((id) => !satisfiable(id))).toEqual([]);
    expect(deferred).toEqual([]);
    // ... and the request's PCI and diagnostic tips are satisfiable from what the case declares
    for (const id of ["pci-hypotension-match-pressor", "pci-mon-false-hypotension", "diag-oedema-on-table"]) expect(satisfiable(id), id).toBe(true);
    // the request's tips all exist
    for (const id of ["pci-hypotension-match-pressor", "pci-mon-false-hypotension", "mcs-pressor-escalation-limit", "diag-lvedp-before-lv-gram", "diag-oedema-on-table", "haemo-wedge-oedema-risk"]) expect(TIP_BY_ID[id], id).toBeDefined();
  });

  it("every ledger record this module writes names tips that exist", () => {
    const { session: s } = newCaseSession({ scenario: "hypo-ischaemia" });
    const m = hypotensionOf(s)!;
    expect(untilEvent(s, "hypotension", 900)).toBe(true);
    m.actions.order("rhc");
    m.actions.nameMechanism("hypovolaemia");
    m.actions.setPump("dopamine", 10);
    m.actions.setPump("noradrenaline", 0.6);
    s.wait(30);
    s.runPending();
    m.actions.escalate("drugs");
    const mine = s.decisions().filter((d) => /hypotension|pressor|dobutamine|oedema/.test(d.id));
    expect(mine.length).toBeGreaterThanOrEqual(4);
    for (const d of mine) for (const id of d.tipIds ?? []) expect(TIP_BY_ID[id], `${d.id}: ${id}`).toBeDefined();
    expect(mine.find((d) => d.id === "hypotension-bridge-drug")!.correct).toBe(false);
    expect(mine.find((d) => d.id === "pressor-escalation")!.correct).toBe(false);
  });
});
