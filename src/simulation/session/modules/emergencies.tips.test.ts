import { describe, it, expect } from "vitest";
import { newCaseSession, type CaseSession } from "../caseSession";
import { caseTipContexts } from "../../../ui/access/caseTips";
import { raises as caseRaises } from "../../../ui/access/caseTips";
import { LAB_EVENTS, TIP_BY_ID, tipsFor, type LabContext, type LabEvent, type LabId } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { EMERGENCY_EVENTS, emergenciesOf, raises } from "./emergencies";

// proc-anaphylaxis-vagal: the emergencies module's tips. The case reports one context per lab
// (src/ui/access/caseTips.ts); the phase-less diagnostic and PCI contexts carry the patient events,
// the access contexts every event at the step the workspace shows.

const PKG = "proc-anaphylaxis-vagal";
const phaseless = (ctxs: LabContext[], lab: LabId) => ctxs.find((c) => c.lab === lab && !c.phase)!;
const ids = (ctx: LabContext | undefined, n = 20) => (ctx ? tipsFor(ctx, n).map((t) => t.id) : []);

function untilEvent(s: CaseSession, e: LabEvent, maxS: number): boolean {
  for (let t = 0; t <= maxS; t += 5) {
    if (s.activeEvents().includes(e)) return true;
    s.wait(5);
    s.runPending();
  }
  return s.activeEvents().includes(e);
}

describe("emergencies tips", () => {
  it("anaphylaxis-asthmatic: after the first injection raises 'contrast-reaction', tipsFor(ctx, 20) includes diag-anaphylaxis-im-adrenaline and diag-reaction-or-vagal", () => {
    const { session: s } = newCaseSession({ scenario: "anaphylaxis-asthmatic" });
    // the case opens just after the first run: no reaction yet
    const before = caseTipContexts(s, "table");
    expect(ids(before.find((c) => c.lab === "diagnostic" && !c.phase))).not.toContain("diag-anaphylaxis-im-adrenaline");
    expect(untilEvent(s, "contrast-reaction", 600)).toBe(true);
    const ctxs = caseTipContexts(s, "table");
    const diag = ids(phaseless(ctxs, "diagnostic"));
    expect(diag).toContain("diag-anaphylaxis-im-adrenaline");
    expect(diag).toContain("diag-reaction-or-vagal");
    expect(ids(phaseless(ctxs, "pci"))).toContain("pci-anaphylaxis-im-adrenaline");
    // the module reports the reaction's signs too
    expect(emergenciesOf(s)!.events!()).toContain("contrast-reaction");
  });

  it("vagal-mimic: at sheath removal the access closure context brings up access-vasovagal-or-tamponade and access-vagal-prevention", () => {
    const { session: s } = newCaseSession({ scenario: "vagal-mimic" });
    // the closure context matches many tips; this one is among them (its rank is the panel's business)
    expect(ids(caseTipContexts(s, "closure").find((c) => c.lab === "access" && c.phase === "closure"), 200)).toContain("access-vagal-prevention");
    s.femoralManual(15, 3);
    let seen = false;
    for (let k = 0; k < 12 && !seen; k++) {
      s.tick(0);
      seen = s.activeEvents().includes("bradycardia") || s.activeEvents().includes("hypotension");
    }
    expect(seen).toBe(true);
    const access = caseTipContexts(s, "closure").find((c) => c.lab === "access" && c.phase === "closure");
    expect(ids(access)).toContain("access-vasovagal-or-tamponade");
    expect(ids(phaseless(caseTipContexts(s, "closure"), "diagnostic"))).toContain("diag-reaction-or-vagal");
  });

  it("raises names only registered events, and every waiting.ts entry naming this package becomes satisfiable", () => {
    for (const e of EMERGENCY_EVENTS) expect(LAB_EVENTS as readonly string[]).toContain(e);
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
    // packages), so the diagnostic lab's waiting count falls by at least their number (none) ...
    expect(waiting.filter((id) => !satisfiable(id))).toEqual([]);
    expect(deferred).toEqual([]);
    // ... and the diagnostic tips of the request that wait on diag-tip-context are satisfiable from the case
    for (const id of ["diag-anaphylaxis-im-adrenaline", "diag-reaction-or-vagal"]) expect(satisfiable(id), id).toBe(true);
    // the request's tips all exist
    for (const id of ["diag-anaphylaxis-im-adrenaline", "diag-reaction-or-vagal", "pci-anaphylaxis-im-adrenaline", "access-vagal-prevention", "access-vasovagal-or-tamponade"]) expect(TIP_BY_ID[id], id).toBeDefined();
  });
});
