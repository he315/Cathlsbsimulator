// proc-anaphylaxis-vagal: the emergency order section, rendered to static markup in Node (no DOM). The
// section takes the session and an act() function as props, so no store is needed.
//   npx vitest run src/ui/access/orders/Emergency.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { newCaseSession, type CaseSession } from "../../../simulation/session/caseSession";
import { EMERGENCY_ORDERS } from "../../../simulation/session/emergencies";
import { emergenciesOf } from "../../../simulation/session/modules/emergencies";
import { section } from "./Emergency";
import { ORDER_SECTIONS } from "./index";

const render = (s: CaseSession) => renderToStaticMarkup(createElement(section.Component, { session: s, act: <T,>(fn: (x: CaseSession) => T) => fn(s) }));
const text = (html: string) => html.replace(/<[^>]+>/g, " ");

describe("emergency order section", () => {
  it("is registered, applies to every case and offers every order", () => {
    expect(ORDER_SECTIONS.some((x) => x.id === "emergency")).toBe(true);
    const { session: s } = newCaseSession({ seed: "em-ui", access: "radial-right" });
    expect(section.applies!(s)).toBe(true);
    const html = render(s);
    for (const o of EMERGENCY_ORDERS) if (o.id !== "cpr-stop") expect(html).toContain(`data-emergency-order="${o.id}"`);
    expect(html).toContain("Adrenaline infusion");
  });

  it("never names the reaction on the live screen, during anaphylaxis or at a faint", () => {
    const { session: s } = newCaseSession({ scenario: "anaphylaxis-asthmatic" });
    for (let k = 0; k < 60 && !s.activeEvents().includes("contrast-reaction"); k++) {
      s.wait(5);
      s.runPending();
    }
    emergenciesOf(s)!.actions.order("adrenaline-im");
    s.runPending();
    const t = text(render(s)).toLowerCase();
    for (const word of ["anaphyla", "vasovagal", "vagal reaction", "tamponade", "correct", "wrong"]) expect(t).not.toContain(word);
    expect(t).toContain("adrenaline 0.5 mg im into the anterolateral thigh");
  });
});
