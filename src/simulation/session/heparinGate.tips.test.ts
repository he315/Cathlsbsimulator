// proc-heparin-act-handover: the hand-over gate's tips and links. The gate (caseSession.ts) raises
// 'low-act' while the ACT measured there is below the PCI target and 'high-contrast-volume' when the
// contrast is over the case's budget at the gate or on the return from PCI; scenarios/heparin.ts
// declares them in `raises`.
//   npx vitest run src/simulation/session/heparinGate.tips.test.ts
import { describe, it, expect } from "vitest";
import { newCaseSession } from "./caseSession";
import { caseTipContexts } from "../../ui/access/caseTips";
import { LAB_EVENTS, LAB_PHASES, TIP_BY_ID, tipsFor, type LabContext } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS } from "../../content/lab/raisable/waiting";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";
import { SCENARIO_BY_ID } from "./scenarios/index";
import { raises, scenarios as HEPARIN_SCENARIOS } from "./scenarios/heparin";
import { launch as heparinLaunch } from "./scenarios/heparin.launch";

const PKG = "proc-heparin-act-handover";
const ids = (ctx: LabContext) => tipsFor(ctx, 20).map((t) => t.id);

describe("hand-over gate tips", () => {
  it("adhoc-heparin: after a low ACT at the gate tipsFor(ctx, 20) includes pci-low-act-redose; after the return over budget it includes pci-caki-after-case", () => {
    const { session: s } = newCaseSession({ scenario: "adhoc-heparin" });
    expect(s.pciGateOpen).toBe(true);
    // before the ACT nothing says it is low
    expect(s.activeEvents()).not.toContain("low-act");
    expect(ids(s.pciGateTipContext()!)).not.toContain("pci-low-act-redose");
    // the action that raises 'low-act': the ACT measured at the gate, below target
    expect(s.measureAct()!).toBeLessThan(s.pciActRange()[0]);
    s.runPending();
    expect(s.activeEvents()).toContain("low-act");
    const gate = s.pciGateTipContext()!;
    expect(gate).toMatchObject({ lab: "pci", phase: "plan" });
    expect(gate.events).toContain("low-act");
    expect(ids(gate)).toContain("pci-low-act-redose");
    // the case panel's own PCI context carries it too
    const pciCtx = caseTipContexts(s, "table").filter((c) => c.lab === "pci");
    expect(pciCtx.some((c) => c.events?.includes("low-act") && ids(c).includes("pci-low-act-redose"))).toBe(true);
    // the dose and an ACT at target clear it
    s.givePciHeparin(100 * s.profile.weightKg - s.heparinU, "iv");
    s.runPending();
    expect(s.measureAct()!).toBeGreaterThanOrEqual(s.pciActRange()[0]);
    s.runPending();
    expect(s.activeEvents()).not.toContain("low-act");
    expect(s.toPci()).not.toBeNull();

    // the action that raises 'high-contrast-volume': back from PCI over the case's budget
    expect(s.activeEvents()).not.toContain("high-contrast-volume");
    const budget = s.contrastBudgetMl!;
    s.returnFromLab("pci", { contrastMl: budget + 30, fluoroS: 600, durationS: 0 });
    s.runPending();
    expect(s.activeEvents()).toContain("high-contrast-volume");
    const finish = caseTipContexts(s, "handover").find((c) => c.lab === "pci" && c.phase === "finish")!;
    expect(finish.events).toContain("high-contrast-volume");
    expect(ids(finish)).toContain("pci-caki-after-case");
    const without: LabContext = { ...finish, events: (finish.events ?? []).filter((e) => e !== "high-contrast-volume") };
    expect(ids(without)).not.toContain("pci-caki-after-case");
  });

  it("ckd-budget-adhoc: contrast over the budget at the gate raises 'high-contrast-volume' in the gate's PCI plan context", () => {
    const { session: s } = newCaseSession({ scenario: "ckd-budget-adhoc" });
    s.wait(2);
    s.runPending();
    const c = s.contrastNow();
    expect(c.usedMl).toBeLessThanOrEqual(c.budgetMl!);
    expect(s.activeEvents()).not.toContain("high-contrast-volume");
    // a further run before the PCI takes it over the budget
    s.patient.contrast(c.remainingMl! + 10, "root");
    s.wait(2);
    s.runPending();
    expect(s.pciGateTipContext()!.events).toContain("high-contrast-volume");
  });

  it("raises names only registered events and phases, and every waiting.ts entry naming this package is satisfiable", () => {
    for (const r of raises) {
      for (const e of r.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
      for (const p of r.phases) expect(LAB_PHASES[r.lab] as readonly string[]).toContain(p);
    }
    // waiting.ts names no tip or retarget for this package (the two tips wait on pci-tip-context, which is built)
    expect(WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips)).toEqual([]);
    expect(DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG)).toEqual([]);
    for (const id of ["pci-low-act-redose", "pci-caki-after-case", "pci-act-before-coronary-devices", "pci-act-device-targets"]) expect(TIP_BY_ID[id], id).toBeDefined();
  });
});

describe("hand-over gate links", () => {
  it("practiceIndex lists the scenarios adhoc-heparin, adhoc-gpi-planned, tissued-cannula under lessons pm-antithrombotics-heparin, cm-patient-complications-kidney, cm-patient-complications-contrast-budget (from src/simulation/session/scenarios/heparin.launch.ts)", () => {
    for (const lessonId of ["pm-antithrombotics-heparin", "cm-patient-complications-kidney", "cm-patient-complications-contrast-budget"]) {
      const entries = practiceForLesson(lessonId).filter((e) => e.sim === "procedure");
      for (const id of ["adhoc-heparin", "adhoc-gpi-planned", "tissued-cannula"]) expect(entries.some((e) => e.scenario === id && e.params.scenario === id), `${lessonId}: ${id}`).toBe(true);
    }
    for (const lessonId of ["cm-patient-complications-kidney", "cm-patient-complications-contrast-budget"])
      expect(practiceForLesson(lessonId).some((e) => e.sim === "procedure" && e.scenario === "ckd-budget-adhoc")).toBe(true);
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("heparin.launch"))).toEqual([]);
  });

  it("the launch file and the scenario file agree", () => {
    expect(heparinLaunch.sim).toBe("procedure");
    expect(heparinLaunch.scenarios!.map((x) => x.id)).toEqual(HEPARIN_SCENARIOS.map((x) => x.id));
    for (const sc of heparinLaunch.scenarios ?? []) {
      expect(SCENARIO_BY_ID[sc.id].title).toBe(sc.title);
      expect(SCENARIO_BY_ID[sc.id].lessonIds).toEqual(sc.lessonIds);
      expect(SCENARIO_BY_ID[sc.id].start).toBe("post-diagnostic");
    }
  });
});
