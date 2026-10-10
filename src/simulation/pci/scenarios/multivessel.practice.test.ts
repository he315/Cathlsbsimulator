// pci-budgets-stop-rules: the multivessel pack's launch file lists multivessel-stable and rca-cto (its
// 'long-case' variant) under the contrast, kidney and radiation lessons, rca-calcified under the contrast-budget
// lesson, and the CTO stop-rule lesson opens the long case.
//   npx vitest run src/simulation/pci/scenarios/multivessel.practice.test.ts
import { describe, expect, it } from "vitest";
import { practiceForLesson } from "../../../ui/content/practiceIndex";
import { resolvePciLaunch } from "../../../ui/pci/launch";
import { pciScenarioDef, PCI_REGISTRY_PROBLEMS } from "./registry";

const SOURCE = /\/simulation\/pci\/scenarios\/packs\/multivessel\.launch\.ts$/;

describe("multivessel pack practice links (pci-budgets-stop-rules)", () => {
  it("practiceIndex lists multivessel-stable and rca-cto under cm-patient-complications-contrast-budget, -kidney and -radiation (from multivessel.launch.ts)", () => {
    expect(PCI_REGISTRY_PROBLEMS).toEqual([]);
    for (const lesson of ["cm-patient-complications-contrast-budget", "cm-patient-complications-kidney", "cm-patient-complications-radiation"]) {
      const list = practiceForLesson(lesson).filter((e) => e.sim === "angio-pci");
      const mv = list.find((e) => e.scenario === "multivessel-stable");
      expect(mv, `${lesson} lists multivessel-stable`).toBeDefined();
      expect(mv!.source).toMatch(SOURCE);
      const cto = list.find((e) => e.scenario === "rca-cto" && e.variant === "long-case");
      expect(cto, `${lesson} lists rca-cto long-case`).toBeDefined();
      expect(cto!.source).toMatch(SOURCE);
    }
    // rca-calcified under the contrast-budget lesson; not under the kidney lesson while its definition sets no renal facts
    expect(practiceForLesson("cm-patient-complications-contrast-budget").find((e) => e.scenario === "rca-calcified")?.source).toMatch(SOURCE);
    expect(practiceForLesson("cm-patient-complications-kidney").some((e) => e.scenario === "rca-calcified" && SOURCE.test(e.source ?? ""))).toBe(false);
    // the CTO stop rules open the long case; the planning and target-timing lessons list the multivessel case
    for (const lesson of ["cp-cto-strategy-hybrid", "cm-principles-closure-stopping"]) expect(practiceForLesson(lesson).some((e) => e.scenario === "rca-cto" && e.variant === "long-case"), lesson).toBe(true);
    for (const lesson of ["pm-planning-bailout", "pm-target-timing", "cm-principles-closure-stopping"]) expect(practiceForLesson(lesson).some((e) => e.scenario === "multivessel-stable"), lesson).toBe(true);
  });

  it("the scenario is registered with its lesions and patient facts, and the long-case link resolves", () => {
    const d = pciScenarioDef("multivessel-stable")!;
    expect(d).toBeDefined();
    expect(d.heldOut).toBe(false);
    expect(d.lesions.map((l) => l.vessel)).toEqual(["RCA", "RCA", "LAD", "LCx", "LM"]);
    expect(d.lesions[d.target!].role).toBe("target");
    expect(d.patient).toMatchObject({ eGfr: 45, priorContrastMl: 60 });
    const r = resolvePciLaunch({ scenario: "rca-cto", variant: "long-case" });
    expect(r.problems).toEqual([]);
    expect(r.launch?.resolved.seed).toBe("long-case");
    const m = resolvePciLaunch({ scenario: "multivessel-stable", start: "wire-across" });
    expect(m.problems).toEqual([]);
    expect(m.launch?.resolved.scenario.target.vessel).toBe("RCA");
  });
});
