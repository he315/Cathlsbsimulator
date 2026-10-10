// proc-hypotension-pressors: the low-pressure orders and the infusion pumps, rendered to static markup
// in Node (no DOM). The section takes the session and an act() function as props, so no store is
// needed to render it.
//   npx vitest run src/ui/access/orders/Infusions.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { newCaseSession, type CaseSession } from "../../../simulation/session/caseSession";
import { HYPO_ORDERS, PUMPS } from "../../../simulation/session/hypotension";
import { hypotensionOf } from "../../../simulation/session/modules/hypotension";
import { hypotensionCauses } from "../../../simulation/patient/hypotensionCauses";
import { section } from "./Infusions";
import { handToSupport } from "../InfusionPanel";
import { useLabHandoverStore } from "../../../state/useLabHandoverStore";
import { useUiStore } from "../../../state/useUiStore";
import { ORDER_SECTIONS } from "./index";
import { loadTips } from "../../lab/useLabTips";

const render = (s: CaseSession) => renderToStaticMarkup(createElement(section.Component, { session: s, act: <T,>(fn: (x: CaseSession) => T) => fn(s) }));
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&");

function untilLow(s: CaseSession, maxS: number) {
  for (let t = 0; t < maxS && !s.activeEvents().includes("hypotension"); t += 5) {
    s.wait(5);
    s.runPending();
  }
}

describe("infusion and low-pressure section", () => {
  it("is registered after the emergency orders, applies to every case and offers every order and pump", () => {
    const ids = ORDER_SECTIONS.map((x) => x.id);
    expect(ids).toContain("infusions");
    expect(ids.indexOf("infusions")).toBeGreaterThan(ids.indexOf("emergency"));
    const { session: s } = newCaseSession({ seed: "inf-ui", access: "radial-right" });
    expect(section.applies!(s)).toBe(true);
    const html = render(s);
    for (const o of HYPO_ORDERS) expect(html).toContain(`data-hypo-order="${o.id}"`);
    for (const p of PUMPS) expect(html).toContain(`value="${p.drug}"`);
    // no venous sheath: the central line cannot be chosen
    expect(html).toMatch(/<option value="central" disabled="">/);
  });

  it("never names the cause or the verdict on the live screen; the right heart read-out is numbers", () => {
    const { session: s } = newCaseSession({ scenario: "hypo-bleeding" });
    untilLow(s, 900);
    const m = hypotensionOf(s)!;
    m.actions.order("rhc");
    m.actions.setPump("noradrenaline", 0.2);
    const t = text(render(s)).toLowerCase();
    // the orders on the trolley name treatments (a bleeding site, a drain); the cause and the verdict are never shown
    for (const c of hypotensionCauses()) expect(t).not.toContain(c.label.toLowerCase());
    for (const word of ["haemorrhage", "correct", "wrong", "starting high", "mechanism:"]) expect(t).not.toContain(word);
    expect(t).toMatch(/ra \d+ · pa mean \d+ · wedge \d+ mmhg/);
    expect(t).toContain("noradrenaline 0.2 µg/kg/min");
    // the mechanism buttons are the operator's words, not a verdict
    expect(t).toContain("empty (hypovolaemia)");
  });

  it("shows the drug's range only where hints are free, and the escalation question once the team asks it", () => {
    const { session: s } = newCaseSession({ scenario: "hypo-ischaemia", mode: "exam" });
    expect(text(render(s))).not.toMatch(/module's range/);
    const g = newCaseSession({ scenario: "hypo-ischaemia", mode: "guided" }).session;
    expect(text(render(g))).toMatch(/module's range: 0.1-0.5 µg\/kg\/min \(Brilakis 3.6\)/);
    // the learner sees the citation only, never a source-file reference
    expect(text(render(g))).not.toMatch(/\.ts:\d/);
    untilLow(g, 900);
    hypotensionOf(g)!.actions.setPump("noradrenaline", 0.7);
    g.wait(10);
    g.runPending();
    const html = render(g);
    expect(html).toContain("data-escalation");
    expect(text(html)).toContain("Support: Microaxial flow pump");
    expect(text(html)).toContain("Support: VA-ECMO");
  });

  it("shows the right heart tips under the numbers in guided practice, and none in an exam", async () => {
    await loadTips();
    const arm = (mode: "guided" | "exam") => {
      const { session: s } = newCaseSession({ scenario: "oedema-lvedp-high", mode });
      const m = hypotensionOf(s)!;
      m.actions.order("saline-1000");
      for (let t = 0; t < 900 && m.state.oedema.onsetT === null; t += 5) {
        s.wait(5);
        s.runPending();
      }
      m.actions.order("rhc");
      return { s, html: render(s) };
    };
    const g = arm("guided");
    expect(g.html).toContain("data-rhc");
    expect(text(g.html)).toContain("Right heart tips");
    // (static markup runs no effects, so the tip is found by its title rather than session.tipsShown)
    const tip = (await loadTips()).TIP_BY_ID["haemo-wedge-oedema-risk"];
    expect(tip).toBeDefined();
    expect(text(g.html)).toContain(text(tip.title));
    const e = arm("exam");
    expect(e.html).toContain("data-rhc");
    expect(text(e.html)).not.toContain("Right heart tips");
  });

  it("mechanical support hands the patient, with the infusions, to the chosen console and opens it", () => {
    const { session: s } = newCaseSession({ scenario: "hypo-ischaemia" });
    untilLow(s, 900);
    const m = hypotensionOf(s)!;
    m.actions.setPump("noradrenaline", 0.7);
    s.wait(10);
    s.runPending();
    m.actions.escalate("support", "impella");
    handToSupport(s, "impella");
    expect(useUiStore.getState().simTab).toBe("impella");
    // the case's clock is the procedure section's frame loop: the hand-over leaves that section, so the
    // case's patient stops (handover rule 2)
    expect(useUiStore.getState().section).not.toBe("procedure");
    expect(useUiStore.getState().section).toBe("mcs");
    const t = useLabHandoverStore.getState().take("impella")!;
    expect(t.from).toBe("procedure");
    expect(t.events).toContain("hypotension");
    expect(t.patient).not.toBeNull();
    expect((t.payload?.infusions as { drug: string }[])[0].drug).toBe("noradrenaline");
    expect(useLabHandoverStore.getState().take("impella")).toBeNull();
  });
});
