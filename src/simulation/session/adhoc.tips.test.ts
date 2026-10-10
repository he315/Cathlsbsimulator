// proc-adhoc-gate: the decision gate's tips. While the gate is open the case reports the diagnostic
// finish (adhoc.ts adHocTipContext) with 'high-contrast-volume' and 'high-radiation-dose' when present;
// adhoc.ts and scenarios/adhoc.ts declare it in `raises`.
//   npx vitest run src/simulation/session/adhoc.tips.test.ts
import { describe, it, expect } from "vitest";
import { newCaseSession } from "./caseSession";
import { ADHOC_GATE_PINNED_TIPS, ADHOC_GATE_TIP_DEPTH, ADHOC_GATE_TIP_LIMIT, adHocGateTips, adHocInputs, adHocTipContext, openAdHocGate, raises } from "./adhoc";
import { raises as scenarioRaises, scenarios as ADHOC_SCENARIOS } from "./scenarios/adhoc";
import { caseTipContexts } from "../../ui/access/caseTips";
import { LAB_EVENTS, LAB_PHASES, TIP_BY_ID, tipsFor, type LabContext } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS } from "../../content/lab/raisable/waiting";
import { DOSE_TRIGGERS } from "../dose";

const PKG = "proc-adhoc-gate";
const ids = (ctx: LabContext) => tipsFor(ctx, 20).map((t) => t.id);

describe("ad hoc gate tips", () => {
  it("adhoc-left-main-stable: at phase 'finish', tipsFor(ctx, 20) includes diag-ad-hoc-pause and diag-stop-for-heart-team", () => {
    const { session: s } = newCaseSession({ scenario: "adhoc-left-main-stable" });
    const ctx = adHocTipContext(adHocInputs(s, openAdHocGate(s)));
    expect(ctx).toMatchObject({ lab: "diagnostic", phase: "finish" });
    expect(ids(ctx)).toEqual(expect.arrayContaining(["diag-ad-hoc-pause", "diag-stop-for-heart-team", "diag-planning-ad-hoc-consent"]));
    // the case panel's own closure context reports the diagnostic finish too
    const finish = caseTipContexts(s, "closure").find((c) => c.lab === "diagnostic" && c.phase === "finish")!;
    expect(ids(finish)).toEqual(expect.arrayContaining(["diag-ad-hoc-pause", "diag-stop-for-heart-team"]));
    s.dispose();
  });

  it("contrast at the warning threshold and a radiation trigger level add 'high-contrast-volume' and 'high-radiation-dose'", () => {
    const { session: s } = newCaseSession({ scenario: "adhoc-cto-stable" });
    const g = openAdHocGate(s);
    expect(adHocTipContext(adHocInputs(s, g)).events).toEqual([]);
    const c = s.contrastNow();
    s.patient.contrast(Math.ceil(0.8 * c.budgetMl! - c.usedMl) + 5, "root");
    s.wait(2);
    s.runPending();
    s.setOwnDose({ ...s.totals, karMGy: DOSE_TRIGGERS.karMGy + 10 });
    const ctx = adHocTipContext(adHocInputs(s, g));
    expect(ctx.events).toEqual(["high-contrast-volume", "high-radiation-dose"]);
    expect(ids(ctx)).toContain("diag-ad-hoc-pause");
    s.dispose();
  });

  it("the gate's panel lists the three decision tips first in every ad hoc scenario, and no acquisition tip", () => {
    for (const sc of ADHOC_SCENARIOS) {
      const { session: s } = newCaseSession({ scenario: sc.id });
      const ctx = adHocTipContext(adHocInputs(s, openAdHocGate(s)));
      const shown = adHocGateTips(tipsFor(ctx, ADHOC_GATE_TIP_DEPTH)).map((t) => t.id);
      expect(shown.slice(0, 3), sc.id).toEqual([...ADHOC_GATE_PINNED_TIPS]);
      expect(shown.length).toBeLessThanOrEqual(ADHOC_GATE_TIP_LIMIT);
      expect(shown.filter((id) => id.startsWith("diag-acq-") || id === "diag-interp-every-territory"), sc.id).toEqual([]);
      s.dispose();
    }
    // with the dose events the fourth place goes to a dose tip, after the decision tips
    const shownHigh = adHocGateTips(tipsFor({ lab: "diagnostic", phase: "finish", events: ["high-contrast-volume", "high-radiation-dose"] }, ADHOC_GATE_TIP_DEPTH)).map((t) => t.id);
    expect(shownHigh.slice(0, 3)).toEqual([...ADHOC_GATE_PINNED_TIPS]);
    expect(TIP_BY_ID[shownHigh[3]].when.event?.length ?? 0).toBeGreaterThan(0);
  });

  it("raises names only registered events and phases, and every waiting.ts entry naming this package is satisfiable", () => {
    expect(scenarioRaises).toEqual(raises);
    for (const r of raises) {
      for (const e of r.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
      for (const p of r.phases) expect(LAB_PHASES[r.lab] as readonly string[]).toContain(p);
    }
    // waiting.ts names no tip or retarget for this package (the gate's tips wait on diag-tip-context, which is built)
    expect(WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips)).toEqual([]);
    expect(DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG)).toEqual([]);
    for (const id of ["diag-ad-hoc-pause", "diag-stop-for-heart-team", "diag-planning-ad-hoc-consent"]) {
      expect(TIP_BY_ID[id], id).toBeDefined();
      expect(TIP_BY_ID[id].lab).toBe("diagnostic");
      expect(TIP_BY_ID[id].when.phase).toContain("finish");
    }
  });
});
