// The hyperaemia and orders panels of the pressure-wire lab (physiology-hyperaemia-and-adenosine): they
// render the agent, dose, route and orders an operator chooses, with no dose filled in for the IC bolus
// and nothing that says whether hyperaemia was reached or what the rhythm is.
//   npx vitest run src/ui/physiology/MeasurePanel.hyperaemia.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { initialPwSession, pwSessionReducer, type PwAction, type PwSessionState } from "../../simulation/pci/pwSession";
import MeasurePanel from "./MeasurePanel";
import OrdersPanel, { PACING_HANDOFF } from "./OrdersPanel";
import { launch as pacingLaunch } from "../../content/lab/presets/bedside/pacing.launch";

const html = (s: PwSessionState) => renderToString(createElement(MeasurePanel, { session: s, dispatch: () => {} }));
const text = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/\s+/g, " ");

describe("the hyperaemia panel", () => {
  it("offers IC adenosine with a dose and speed, the guide flush, IV adenosine with a rate and a vein, contrast, the checks and the orders", () => {
    // a lab that passes the monitor's rhythm (pwPatientInput) also gives its engine the orders: the orders show
    const s = pwSessionReducer(initialPwSession("ic-rca-dose"), { type: "tick", dt: 0.1, patient: { rhythm: { kind: "sinus", av: 0 } } });
    const t = text(html(s));
    for (const label of ["Intracoronary adenosine into the RCA", "Inject slowly", "Fast push", "Flush the guide", "IV adenosine", "Hand-vein cannula", "Large antecubital vein", "Central (femoral) vein", "Contrast 8 mL through the guide", "Look at the IV cannula", "Check the syringe and bag labels", "Ask about caffeine today", "Ask to cough", "Wait and watch", "Start CPR", "Temporary pacing on", "Shock", "Synchronised shock (cardioversion)", "Hand over to the temporary pacing lab"]) expect(t, label).toContain(label);
  });

  it("the IC dose field is empty; nothing on the panel tells whether hyperaemia was reached or what went wrong", () => {
    const h = html(initialPwSession("iv-tissued-line"));
    expect(h).toMatch(/aria-label="Intracoronary adenosine dose, µg"[^>]*value=""|value=""[^>]*aria-label="Intracoronary adenosine dose, µg"/);
    const play = (s: PwSessionState, ...as: PwAction[]) => as.reduce(pwSessionReducer, s);
    let s = play(initialPwSession("iv-tissued-line", "ui"), { type: "hyperaemia", mode: "iv", rateUgKgMin: 140, site: "hand" });
    for (let i = 0; i < 1200; i++) s = pwSessionReducer(s, { type: "tick", dt: 0.1 });
    s = play(s, { type: "sensor", mm: 100 }, { type: "measure-ffr" });
    const t = text(html(s)).toLowerCase();
    for (const word of ["submaximal", "tissued", "saline", "caffeine blunts", "hyperaemia %", "fibrillation", "heart block"]) expect(t, word).not.toContain(word);
  });

  it("the bolus buttons wait for a dose and the infusion button for a rate; looking at an unused hand cannula judges nothing on the console", () => {
    const buttons = (h: string, label: string) => [...h.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].filter((m) => m[1].includes(label)).map((m) => m[0]);
    const h = html(initialPwSession("ic-rca-dose"));
    for (const b of [...buttons(h, "Inject slowly"), ...buttons(h, "Fast push")]) expect(b).toMatch(/disabled/);
    // the IV rate field starts at the standard rate, so the infusion can be started
    expect(buttons(h, "Start the infusion")[0]).not.toMatch(/disabled/);
    const s = pwSessionReducer(initialPwSession("ic-rca-dose"), { type: "check-line" });
    expect(s.log[0].note ?? "").not.toMatch(/poor/);
    expect(s.log[0].aid).toMatch(/poor site for adenosine/);
  });

  it("without the monitor's rhythm (a lab whose engine does not take the orders) the orders panel is not shown", () => {
    const t = text(html(initialPwSession("lad-intermediate")));
    expect(t).toContain("Inject slowly");
    for (const label of ["Ask to cough", "Start CPR", "Temporary pacing on", "Synchronised shock (cardioversion)"]) expect(t, label).not.toContain(label);
  });

  it("the orders panel shows what the team is doing (CPR, pacing) and hands over to the pacing lab's adenosine block scenario", () => {
    const s = { ...initialPwSession("adenosine-vf"), cpr: true, pacing: true };
    const t = text(renderToString(createElement(OrdersPanel, { session: s, dispatch: () => {} })));
    expect(t).toContain("Stop CPR");
    expect(t).toContain("Temporary pacing off");
    // the defibrillator's own charge indicator
    const ind = (defib: PwSessionState["defib"]) => text(renderToString(createElement(OrdersPanel, { session: { ...s, defib }, dispatch: () => {} })));
    expect(ind({ chargingSince: null, charged: false })).toContain("Not charged");
    expect(ind({ chargingSince: 3, charged: false })).toContain("Charging…");
    expect(ind({ chargingSince: null, charged: true })).toMatch(/\bCharged\b/);
    const sc = pacingLaunch.scenarios?.find((x) => x.id === PACING_HANDOFF.params.scenario);
    expect(sc).toBeDefined();
    expect((sc!.variants ?? []).map((v) => (typeof v === "string" ? v : v.id))).toContain(PACING_HANDOFF.params.variant);
    expect(pacingLaunch.sim).toBe(PACING_HANDOFF.sim);
  });
});
