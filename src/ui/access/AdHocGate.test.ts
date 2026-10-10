// proc-adhoc-gate: the decision gate rendered to static markup in Node. It shows the contrast against
// the case's budget, the dose, the consent wording, the centre and the time of day; the STEMI call
// shows once it has come in, and holds the decision until it is acknowledged; nothing names the
// reasons that apply. The gate reads the procedure store; the hook is replaced by one that hands it
// the test's session and gate.
//   npx vitest run src/ui/access/AdHocGate.test.ts
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { newCaseSession } from "../../simulation/session/caseSession";
import { adHocInputs, interruptAdHoc, openAdHocGate, type AdHocGateState } from "../../simulation/session/adhoc";
import { ADHOC_FINDINGS } from "../../simulation/session/scenarios/adhoc";

const store = vi.hoisted(() => ({
  session: null as unknown,
  adhoc: null as unknown,
  version: 0,
  decideAdHoc: () => null,
  acknowledgeAdHocCall: () => {},
  askHelp: () => {},
  toDiagnostic: () => {},
  adHocInputs: (() => null) as () => unknown,
}));
vi.mock("../../state/useProcedureStore", async (importOriginal) => {
  const real = await importOriginal<typeof import("../../state/useProcedureStore")>();
  return { ...real, useProcedureStore: Object.assign((sel: (x: typeof store) => unknown) => sel(store), { getState: () => store }) };
});

const { default: AdHocGate } = await import("./AdHocGate");

function render(scenario: string, edit?: (g: AdHocGateState, s: ReturnType<typeof newCaseSession>["session"]) => AdHocGateState, seed?: string): string {
  const { session: s } = newCaseSession({ scenario, ...(seed ? { seed } : {}) });
  let g = openAdHocGate(s);
  if (edit) g = edit(g, s);
  store.session = s;
  store.adhoc = g;
  store.adHocInputs = () => adHocInputs(s, g, null);
  const html = renderToStaticMarkup(createElement(AdHocGate));
  s.dispose();
  return html;
}

describe("the ad hoc decision gate", () => {
  it("shows the contrast against the budget, the dose, the consent wording and the centre, and never the reasons that apply", () => {
    const html = render("adhoc-left-main-stable");
    expect(html).toContain("data-adhoc-gate");
    expect(html).toMatch(/data-adhoc-contrast[^>]*>70 mL</);
    expect(html).toMatch(/of a \d+ mL budget, \d+ mL left/);
    expect(html).toContain("air kerma");
    expect(html).toContain("Signed for coronary angiography and possible angioplasty.");
    expect(html).toContain("Cardiac surgery on site");
    // the time of day is labelled, apart from the header's elapsed-time chip
    expect(html).toMatch(/data-adhoc-clock[^>]*>Time of day \d\d:\d\d</);
    // the team's report of the study the case opened after, and the way to the angiogram
    expect(html).toMatch(/data-adhoc-findings[^>]*>Diagnostic study \(reported by the attending, visual estimate\): left main 70%/);
    expect(html).toContain(ADHOC_FINDINGS["adhoc-left-main-stable"]);
    expect(html).toContain("Review the angiogram");
    expect(html).not.toContain("No study report submitted for this case");
    // the findings are the learner's to judge: the facts carry no verdict, and no reason is ticked for them
    const facts = html.slice(0, html.indexOf(">Decision</h3>"));
    expect(facts).not.toMatch(/\b(apply|applies|correct|wrong|defer)\b/i);
    expect(html).not.toMatch(/data-adhoc-reason="[a-z]+"[^>]*checked|checked=""[^>]*data-adhoc-reason/);
    // nine reasons, two choices, the record button
    expect(html.match(/data-adhoc-reason=/g)).toHaveLength(9);
    expect(html.match(/data-adhoc-choice=/g)).toHaveLength(2);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*data-adhoc-record|<button[^>]*data-adhoc-record[^>]*disabled=""/);
  });

  it("the late-evening case shows the time of day; once the STEMI call has come in it shows and the choices wait for 'Acknowledge'", () => {
    const before = render("adhoc-late-evening-stemi-call");
    expect(before).toMatch(/>Time of day 19:\d\d</);
    expect(before).not.toContain("data-adhoc-call");
    const after = render("adhoc-late-evening-stemi-call", (g, s) => interruptAdHoc(s, g));
    expect(after).toContain("data-adhoc-call");
    expect(after).toContain("STEMI");
    expect(after).toContain("Acknowledge");
    expect(after).toMatch(/<button[^>]*data-adhoc-choice="proceed"[^>]*disabled=""|<button[^>]*disabled=""[^>]*data-adhoc-choice="proceed"/);
  });

  it("a case with neither a study report nor the team's findings says so", () => {
    const html = render("default", undefined, "adhoc-gate-no-findings");
    expect(html).toContain("No study report submitted for this case");
    expect(html).toContain("No PCI target named");
    expect(html).not.toContain("data-adhoc-findings");
  });

  it("the complication case lists the complication", () => {
    expect(render("adhoc-complication")).toContain("Ventricular fibrillation during a coronary injection");
  });
});
