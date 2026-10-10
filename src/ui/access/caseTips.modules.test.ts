// repair-session-flow (6): caseTipContexts merges the session modules' own tip contexts
// (session.moduleTipContexts(), CaseSessionModule.tipContexts), so the hypotension module's
// haemodynamic 'right-heart' context, open while the right heart numbers are, brings
// haemo-wedge-oedema-risk to the case tips panel.
//   npx vitest run src/ui/access/caseTips.modules.test.ts
import { describe, expect, it } from "vitest";
import * as TIPS from "../../content/lab/tips";
import type { LabContext } from "../../content/lab/tips";
import { newCaseSession, type CaseSession } from "../../simulation/session/caseSession";
import type { CaseSessionModule } from "../../simulation/session/modules/index";
import { hypotensionOf } from "../../simulation/session/modules/hypotension";
import { caseTipContexts, caseTipLimits, selectCaseTips } from "./caseTips";

function untilEvent(s: CaseSession, e: TIPS.LabEvent, maxS: number): boolean {
  for (let t = 0; t <= maxS; t += 5) {
    if (s.activeEvents().includes(e)) return true;
    s.wait(5);
    s.runPending();
  }
  return s.activeEvents().includes(e);
}

describe("module tip contexts in the case tips", () => {
  it("a module's tipContexts() are merged into every workspace's contexts, and none while the case is in another lab", () => {
    const ctx: LabContext = { lab: "haemo", phase: "right-heart", events: [] };
    let on = true;
    const probe = (): CaseSessionModule => ({ id: "test-ctx", attach() {}, tipContexts: () => (on ? [ctx] : []) });
    const { session: s } = newCaseSession({ seed: "ctx-merge", access: "radial-right", modules: [probe] });
    expect(s.moduleTipContexts()).toEqual([ctx]);
    for (const w of ["chart", "access", "table", "closure"] as const) expect(caseTipContexts(s, w)).toContainEqual({ ...ctx, source: "module" });
    expect(caseTipContexts(s, "table", "pci")).toEqual([]);
    on = false;
    expect(caseTipContexts(s, "table")).not.toContainEqual(expect.objectContaining(ctx));
  });

  it("oedema-lvedp-high: with the right heart numbers open the panel shows haemo-wedge-oedema-risk; once they close it does not", () => {
    const { session: s } = newCaseSession({ scenario: "oedema-lvedp-high" });
    const m = hypotensionOf(s)!;
    m.actions.order("saline-1000");
    expect(untilEvent(s, "pulmonary-oedema", 900)).toBe(true);
    const shown = () => selectCaseTips(TIPS, caseTipContexts(s, "table"), true, caseTipLimits("table")).map((t) => t.id);
    expect(shown()).not.toContain("haemo-wedge-oedema-risk");
    m.actions.order("rhc");
    s.runPending();
    expect(caseTipContexts(s, "table")).toContainEqual(expect.objectContaining({ lab: "haemo", phase: "right-heart" }));
    expect(shown()).toContain("haemo-wedge-oedema-risk");
    // the module's mark is in the data: a copy of the contexts keeps the reservation
    expect(selectCaseTips(TIPS, caseTipContexts(s, "table").map((c) => ({ ...c })), true, caseTipLimits("table")).map((t) => t.id)).toContain("haemo-wedge-oedema-risk");
    // the right heart numbers stay open for the module's panel setting, then the context goes
    for (let k = 0; k < 130 && m.actions.rhcTipContext(); k++) {
      s.wait(5);
      s.runPending();
    }
    expect(m.actions.rhcTipContext()).toBeNull();
    expect(caseTipContexts(s, "table").some((c) => c.lab === "haemo" && c.phase === "right-heart")).toBe(false);
  });
});
