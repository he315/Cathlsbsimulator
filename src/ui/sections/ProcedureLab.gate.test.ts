// proc-heparin-act-handover: the hand-over gate bar ('Proceed to PCI'), rendered to static markup in
// Node. Held (disabled) in supervised mode until an ACT at target has been measured after the last
// dose; open in independent mode, where the decision is scored instead. The bar reads the session
// from the procedure store; server rendering would read the store's initial state, so the hook is
// replaced by one that hands the bar the test's session.
//   npx vitest run src/ui/sections/ProcedureLab.gate.test.ts
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { newCaseSession, type CaseSession } from "../../simulation/session/caseSession";

const store = vi.hoisted(() => ({ session: null as unknown, version: 0, toPci: () => {}, closePciGate: () => {} }));
vi.mock("../../state/useProcedureStore", async (importOriginal) => {
  const real = await importOriginal<typeof import("../../state/useProcedureStore")>();
  return { ...real, useProcedureStore: Object.assign((sel: (x: typeof store) => unknown) => sel(store), { getState: () => store }) };
});

const { PciGateBar } = await import("./ProcedureLab");

const proceedButton = (s: CaseSession) => {
  store.session = s;
  const html = renderToStaticMarkup(createElement(PciGateBar));
  const m = html.match(/<button[^>]*data-pci-gate-proceed[^>]*>/);
  expect(m, "the Proceed to PCI button").not.toBeNull();
  return m![0];
};
const DISABLED = /\sdisabled=""/;

describe("the hand-over gate bar", () => {
  it("'Proceed to PCI' is disabled while the gate holds in supervised mode, and enabled once the ACT is at target", () => {
    const { session: s } = newCaseSession({ scenario: "adhoc-heparin", mode: "supervised" });
    expect(s.pciGateOpen).toBe(true);
    expect(proceedButton(s)).toMatch(DISABLED);
    s.givePciHeparin(100 * s.profile.weightKg - s.heparinU, "iv");
    s.runPending();
    s.measureAct();
    s.runPending();
    expect(s.pciGateProblem()).toBeNull();
    expect(proceedButton(s)).not.toMatch(DISABLED);
  });

  it("'Proceed to PCI' is enabled in independent mode with no ACT measured", () => {
    const { session: s } = newCaseSession({ scenario: "adhoc-heparin", mode: "independent" });
    expect(s.pciGateOpen).toBe(true);
    expect(s.pciGateProblem()).not.toBeNull();
    expect(proceedButton(s)).not.toMatch(DISABLED);
  });
});
