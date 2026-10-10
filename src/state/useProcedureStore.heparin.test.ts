// proc-heparin-act-handover: the store's path to ad hoc PCI through the hand-over gate.
//   npx vitest run src/state/useProcedureStore.heparin.test.ts
import { describe, it, expect } from "vitest";
import { useProcedureStore } from "./useProcedureStore";

describe("full-case store: the hand-over gate before ad hoc PCI", () => {
  it("a heparin scenario opens at the table with the gate open; in supervised mode toPci stays in the case until an ACT at target", async () => {
    await useProcedureStore.getState().newCase({ scenario: "adhoc-heparin", mode: "supervised" });
    let st = useProcedureStore.getState();
    const s = st.session!;
    expect(st.workspace).toBe("table");
    expect(s.pciGateOpen).toBe(true);
    st.toPci();
    expect(useProcedureStore.getState().stage).toBe("lab");
    st.act((x) => x.measureAct());
    s.runPending();
    st.toPci();
    expect(useProcedureStore.getState().stage).toBe("lab");
    st.act((x) => x.givePciHeparin(100 * x.profile.weightKg - x.heparinU, "iv"));
    s.runPending();
    st.act((x) => x.measureAct());
    s.runPending();
    st.toPci();
    st = useProcedureStore.getState();
    expect(st.stage).toBe("pci");
    expect(st.handover!.anticoag!.lastAct!.act).toBeGreaterThanOrEqual(250);
    // back from PCI, the gate is closed
    st.backToCase();
    expect(useProcedureStore.getState().session!.pciGateOpen).toBe(false);
  });

  it("'Proceed to ad hoc PCI' from the diagnostic lab comes back to the case with the gate open; 'Not now' closes it", async () => {
    await useProcedureStore.getState().newCase({ scenario: "adhoc-heparin" });
    let st = useProcedureStore.getState();
    st.closePciGate();
    expect(st.session!.pciGateOpen).toBe(false);
    // hand the case to the diagnostic lab, then proceed to PCI from there
    st.toDiagnostic();
    expect(useProcedureStore.getState().stage).toBe("diagnostic");
    useProcedureStore.getState().openPciGate();
    st = useProcedureStore.getState();
    expect(st.stage).toBe("lab");
    expect(st.workspace).toBe("table");
    expect(st.session!.pciGateOpen).toBe(true);
    st.closePciGate();
    expect(useProcedureStore.getState().session!.pciGateOpen).toBe(false);
  });
});
