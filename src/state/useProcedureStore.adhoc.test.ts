// proc-adhoc-gate: the store's path through the ad hoc or delayed PCI decision.
//   npx vitest run src/state/useProcedureStore.adhoc.test.ts
import { describe, it, expect } from "vitest";
import { AD_HOC_STUDY_NAME, useProcedureStore } from "./useProcedureStore";
import { useSimulatorStore } from "./useSimulatorStore";
import { emptyStudyReport, type ReportComparison } from "../mentor/report";
import type { PciTarget } from "../simulation/session/handover";
import { CASE_LIBRARY } from "../simulation/caseGenerator";

const st = () => useProcedureStore.getState();

describe("full-case store: the ad hoc or delayed PCI decision", () => {
  it("an ad hoc scenario opens at the gate; toPci is refused before 'proceed'; 'defer' goes to closure with a staged-PCI note and no PCI", async () => {
    await st().newCase({ scenario: "adhoc-left-main-stable", mode: "supervised" });
    expect(st().adhoc).not.toBeNull();
    expect(st().adhoc!.outcome).toBeNull();
    expect(st().workspace).toBe("closure");
    // no PCI before the decision
    st().toPci();
    expect(st().stage).toBe("lab");
    // a deferral needs a reason
    expect(st().decideAdHoc("defer", [])).toBeNull();
    const out = st().decideAdHoc("defer", ["anatomy", "consent"])!;
    expect(out).toMatchObject({ choice: "defer", correct: true, reasonsCorrect: true });
    expect(st().workspace).toBe("closure");
    expect(st().session!.pciGateOpen).toBe(false);
    expect(st().session!.log.some((l) => /deferred: staged PCI/i.test(l.text))).toBe(true);
    expect(st().session!.decisions().find((d) => d.id === "adhoc-decision")!.correct).toBe(true);
    // the decision stands: no second decision, and no PCI after a deferral
    expect(st().decideAdHoc("proceed", [])).toBeNull();
    st().toPci();
    expect(st().stage).toBe("lab");
  });

  it("'Review the angiogram' loads the ad hoc case in the diagnostic lab under a neutral title, with the case id kept", async () => {
    await st().newCase({ scenario: "adhoc-acs-ongoing", mode: "supervised" });
    const id = st().session!.caseData.id;
    st().toDiagnostic();
    expect(st().stage).toBe("diagnostic");
    expect(useSimulatorStore.getState().caseData.id).toBe(id);
    expect(useSimulatorStore.getState().caseData.name).toBe(AD_HOC_STUDY_NAME);
  });

  it("'proceed' opens the hand-over gate at the table and toPci then goes on, scored wrong in stable left main disease", async () => {
    await st().newCase({ scenario: "adhoc-left-main-stable", mode: "independent" });
    const out = st().decideAdHoc("proceed", [])!;
    expect(out.correct).toBe(false);
    expect(st().workspace).toBe("table");
    expect(st().session!.pciGateOpen).toBe(true);
    // independent mode: the hand-over gate lets the case on (the ACT is scored instead)
    st().toPci();
    expect(st().stage).toBe("pci");
    st().backToCase();
  });

  it("'Ad hoc PCI decision' in the diagnostic lab brings the case back with the gate open; the study report's target goes to the PCI hand-over", async () => {
    await st().newCase({ scenario: "adhoc-acs-ongoing", mode: "independent" });
    // close the scenario's gate state to start from the diagnostic lab as a learner would
    useProcedureStore.setState({ adhoc: null });
    st().toDiagnostic();
    expect(st().stage).toBe("diagnostic");
    // the learner submits the study report: ad hoc PCI of the LAD
    const target: PciTarget = { vessel: "LAD", segment: "Mid LAD", qcaPct: 90, lengthMm: 16, lesionId: "LAD@none", strategy: "adhoc" };
    const report = { ...emptyStudyReport(), decision: "adhoc" as const };
    useSimulatorStore.setState({ studyReport: { report, comparison: { study: { deferralApplies: [] } } as unknown as ReportComparison, pciTarget: target, submittedAt: 1 } });
    st().openAdHocGate();
    expect(st().stage).toBe("lab");
    expect(st().adhoc).not.toBeNull();
    expect(st().adHocReport()).toMatchObject({ decision: "adhoc", target });
    const out = st().decideAdHoc("proceed", [])!;
    expect(out.correct).toBe(true);
    expect(out.target).toEqual(target);
    st().toPci();
    expect(st().stage).toBe("pci");
    expect(st().handover!.pciTarget).toEqual(target);
    st().backToCase();
  });

  it("a study report of another case is not read", async () => {
    await st().newCase({ scenario: "adhoc-cto-stable" });
    // the simulator store still holds whatever the last diagnostic case left; this case never went there
    useSimulatorStore.setState({ studyReport: { report: { ...emptyStudyReport(), decision: "adhoc" }, comparison: {} as ReportComparison, pciTarget: null, submittedAt: 1 } });
    expect(st().adHocReport()).toBeNull();
  });

  it("a study report of another case in the diagnostic lab is not read, though this case went there", async () => {
    await st().newCase({ scenario: "adhoc-cto-stable" });
    st().toDiagnostic();
    expect(st().studyLoaded).toBe(true);
    // the lab now holds a different case, whose report is submitted
    const other = CASE_LIBRARY.find((c) => c.id !== st().session!.caseData.id)!;
    useSimulatorStore.getState().loadCase(other, "free");
    useSimulatorStore.setState({ studyReport: { report: { ...emptyStudyReport(), decision: "adhoc" }, comparison: {} as ReportComparison, pciTarget: null, submittedAt: 1 } });
    expect(st().adHocReport()).toBeNull();
    st().backToCase();
  });

  it("back to the case after the study report, the decision is still open to the learner and reads the report", async () => {
    await st().newCase({ scenario: "adhoc-acs-ongoing", mode: "independent" });
    useProcedureStore.setState({ adhoc: null });
    st().toDiagnostic();
    const target: PciTarget = { vessel: "LAD", segment: "Mid LAD", qcaPct: 95, lengthMm: 12, lesionId: "LAD@none", strategy: "adhoc" };
    useSimulatorStore.setState({ studyReport: { report: { ...emptyStudyReport(), decision: "adhoc" as const }, comparison: { study: { deferralApplies: [] } } as unknown as ReportComparison, pciTarget: target, submittedAt: 1 } });
    // 'Finished: back to the case' first, then 'Ad hoc PCI decision' in the case's bar (ProcedureLab: labsDone, catheter in, no gate)
    st().backToCase();
    const s = st().session!;
    expect(st().stage).toBe("lab");
    expect(st().adhoc).toBeNull();
    expect(s.labsDone).toContain("diagnostic");
    expect(s.catheter?.inBody).toBe(true);
    st().openAdHocGate();
    expect(st().adhoc).not.toBeNull();
    expect(st().adHocReport()).toMatchObject({ decision: "adhoc", target });
    expect(st().decideAdHoc("proceed", [])!.target).toEqual(target);
  });

  it("'Review the angiogram' from a pending gate: the study report filed there reaches the same gate", async () => {
    await st().newCase({ scenario: "adhoc-left-main-stable" });
    const opened = st().adhoc!.openedAt;
    st().toDiagnostic();
    expect(st().stage).toBe("diagnostic");
    useSimulatorStore.setState({ studyReport: { report: { ...emptyStudyReport(), decision: "heart-team" as const, reasons: ["anatomy"] }, comparison: { study: { deferralApplies: [] } } as unknown as ReportComparison, pciTarget: null, submittedAt: 1 } });
    st().openAdHocGate();
    expect(st().stage).toBe("lab");
    expect(st().adhoc!.openedAt).toBe(opened);
    expect(st().adhoc!.outcome).toBeNull();
    expect(st().adHocInputs()!.report).toMatchObject({ decision: "heart-team", reasons: ["anatomy"] });
  });

  it("adhoc-late-evening-stemi-call: the STEMI call interrupts the pending decision and is acknowledged before the decision is recorded", async () => {
    await st().newCase({ scenario: "adhoc-late-evening-stemi-call" });
    expect(st().adhoc!.interruption?.kind).toBe("stemi-call");
    // deciding first: the call comes in instead, and the decision waits
    expect(st().decideAdHoc("proceed", [])).toBeNull();
    expect(st().adhoc!.interruptedAt).not.toBeNull();
    expect(st().decideAdHoc("proceed", [])).toBeNull();
    st().acknowledgeAdHocCall();
    expect(st().adhoc!.acknowledgedAt).not.toBeNull();
    const out = st().decideAdHoc("defer", ["people"])!;
    expect(out).toMatchObject({ correct: true, applies: ["people"] });
  });

  it("the call also comes in on the clock", async () => {
    await st().newCase({ scenario: "adhoc-late-evening-stemi-call" });
    const g = st().adhoc!;
    expect(g.interruptedAt).toBeNull();
    for (let k = 0; k < (g.interruption!.afterS + 2) * 10; k++) st().tick(0.1);
    expect(st().adhoc!.interruptedAt).not.toBeNull();
  });

  it("a case without an ad hoc gate (a heparin hand-over scenario) still goes to PCI through its hand-over gate", async () => {
    await st().newCase({ scenario: "adhoc-heparin", mode: "independent" });
    expect(st().adhoc).toBeNull();
    st().toPci();
    expect(st().stage).toBe("pci");
    st().backToCase();
  });
});
