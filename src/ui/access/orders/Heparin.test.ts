// proc-heparin-act-handover: the heparin record and the hand-over gate's dose controls, rendered to
// static markup in Node (no DOM). The section takes the session and an act() function as props.
//   npx vitest run src/ui/access/orders/Heparin.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { newCaseSession, type CaseSession } from "../../../simulation/session/caseSession";
import { section, gateTips, GATE_TIP_LESSON } from "./Heparin";
import * as tipsModule from "../../../content/lab/tips";
import { ORDER_SECTIONS } from "./index";

const render = (s: CaseSession) => renderToStaticMarkup(createElement(section.Component, { session: s, act: <T,>(fn: (x: CaseSession) => T) => fn(s) }));
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");

describe("heparin and ACT section", () => {
  it("is registered, and applies once heparin is given or the hand-over gate is open", () => {
    expect(ORDER_SECTIONS.map((x) => x.id)).toContain("heparin");
    const { session: fresh } = newCaseSession({ seed: "hep-ui", access: "radial-right" });
    expect(section.applies!(fresh)).toBe(false);
    const { session: s } = newCaseSession({ scenario: "adhoc-heparin" });
    expect(section.applies!(s)).toBe(true);
    const html = render(s);
    expect(html).toContain("data-pci-gate-dose");
    expect(html).toContain("data-pci-gate-give");
    expect(html).toContain("data-pci-gate-act");
    // every dose with its time and route
    expect(text(html)).toMatch(/\d+:\d\d · 5000 U (IV|side arm)/);
  });

  it("never says on the live screen that a dose did not arrive; the cannula shows it only once looked at", () => {
    const { session: s } = newCaseSession({ scenario: "tissued-cannula", mode: "supervised" });
    s.givePciHeparin(5000, "iv");
    s.runPending();
    const before = text(render(s)).toLowerCase();
    for (const w of ["tissued", "not delivered", "swollen", "did not reach", "target"]) expect(before, w).not.toContain(w);
    s.inspectIvCannula();
    s.runPending();
    expect(text(render(s)).toLowerCase()).toContain("swollen");
  });

  it("shows the heparin still to give and the ACT target in guided mode only", () => {
    const { session: g } = newCaseSession({ scenario: "adhoc-heparin" });
    const gt = text(render(g));
    expect(gt).toContain(`Heparin still to give: ${g.pciTopUpU()} U`);
    expect(gt).toContain("ACT target 250-300 s");
    for (const mode of ["supervised", "independent", "exam"] as const) {
      const { session: s } = newCaseSession({ scenario: "adhoc-heparin", mode });
      const t = text(render(s));
      expect(t, mode).not.toContain("still to give");
      expect(t, mode).not.toContain("ACT target");
    }
  });

  it("names the plan's GP IIb/IIIa inhibitor and the contrast left of the budget at the gate", () => {
    const { session: g } = newCaseSession({ scenario: "adhoc-gpi-planned", mode: "supervised" });
    expect(text(render(g))).toContain("Plan for the PCI: a GP IIb/IIIa inhibitor or cangrelor.");
    const { session: k } = newCaseSession({ scenario: "ckd-budget-adhoc", mode: "supervised" });
    k.wait(2);
    k.runPending();
    const c = k.contrastNow();
    expect(text(render(k))).toContain(`of a ${c.budgetMl} mL budget: ${Math.round(c.remainingMl!)} mL left`);
  });

  it("the gate's tips are the hand-over's: the heparin and ACT tips first, not the case's other events", () => {
    const guided = { mode: "guided" as const, helpAskedAt: null };
    // an NSTEMI case with chest pain and ST change active: those events stay with the case panel
    const { session: g } = newCaseSession({ scenario: "adhoc-gpi-planned" });
    const ctx = g.pciGateTipContext()!;
    expect(ctx.events ?? []).toEqual([]);
    const ids = gateTips(tipsModule, ctx, guided).map((t) => t.id);
    expect(ids.slice(0, 2).sort()).toEqual(["pci-act-before-coronary-devices", "pci-act-device-targets"]);
    for (const t of gateTips(tipsModule, ctx, guided)) expect(t.lessonId).toBe(GATE_TIP_LESSON);
    // a low ACT puts the redose tip first
    const { session: s } = newCaseSession({ scenario: "adhoc-heparin" });
    s.measureAct();
    s.runPending();
    expect(gateTips(tipsModule, s.pciGateTipContext()!, guided)[0].id).toBe("pci-low-act-redose");
    // the visibility rule holds: none in an exam
    expect(gateTips(tipsModule, ctx, { mode: "exam", helpAskedAt: null })).toEqual([]);
  });
});
