// pci-flow-closure: the closure pack's launch file lists lcx-stemi, rca-calcified and lad-focal (at the flow and
// closure variants it adds, opened at 'wire-across') under the flow-embolism lessons, and its own
// rca-aortocoronary at 'sinus-stain' under the aortocoronary lesson; every link resolves to a launch the lab
// can open, and each variant is a flow start of its scenario (bailouts.ts applyFlowStart).
//   npx vitest run src/simulation/pci/scenarios/closure.practice.test.ts
import { describe, expect, it } from "vitest";
import { practiceForLesson } from "../../../ui/content/practiceIndex";
import { resolvePciLaunch } from "../../../ui/pci/launch";
import { launch as CLOSURE } from "./packs/closure.launch";
import { PCI_REGISTRY_PROBLEMS, pciScenarioDef } from "./registry";
import { FLOW_STARTS, flowStartFor } from "../actions/bailouts";

const SOURCE = /\/simulation\/pci\/scenarios\/packs\/closure\.launch\.ts$/;
const fromHere = (lesson: string) => practiceForLesson(lesson).filter((e) => e.sim === "angio-pci" && SOURCE.test(e.source));

describe("closure pack practice links (pci-flow-closure)", () => {
  it("practiceIndex lists lcx-stemi, rca-calcified and lad-focal under cm-flow-embolism-noreflow, cm-flow-embolism-plaque-thrombus and cm-flow-embolism-air (from closure.launch.ts)", () => {
    expect(PCI_REGISTRY_PROBLEMS).toEqual([]);
    const lessons = ["cm-flow-embolism-noreflow", "cm-flow-embolism-plaque-thrombus", "cm-flow-embolism-air"];
    const union = new Set(lessons.flatMap((l) => fromHere(l).map((e) => e.scenario)));
    for (const id of ["lcx-stemi", "rca-calcified", "lad-focal"]) expect(union.has(id), id).toBe(true);
    // each of the three lessons lists all three; the air lesson through the RCA, LAD and circumflex air starts
    for (const l of lessons) {
      const scen = new Set(fromHere(l).map((e) => e.scenario));
      for (const id of ["lcx-stemi", "rca-calcified", "lad-focal"]) expect(scen.has(id), `${l} lists ${id}`).toBe(true);
    }
    expect(fromHere("cm-flow-embolism-air").map((e) => `${e.scenario}:${e.variant}`).sort()).toEqual(["lad-focal:air-lad", "lcx-stemi:air-lcx", "rca-calcified:air-rca"]);
    // the no-reflow lesson opens lcx-stemi at its no-reflow variant with the wire across
    const nr = fromHere("cm-flow-embolism-noreflow").find((e) => e.scenario === "lcx-stemi" && e.variant === "no-reflow");
    expect(nr?.start).toBe("wire-across");
    // the closure, dissection and aortocoronary lessons
    expect(fromHere("cm-principles-closure-acute").some((e) => e.scenario === "lad-focal" && e.variant === "closure-timi0")).toBe(true);
    expect(fromHere("cm-principles-closure-dissection").some((e) => e.variant === "dissection-rescue")).toBe(true);
    expect(practiceForLesson("cm-principles-closure-aortocoronary").some((e) => e.scenario === "rca-aortocoronary" && SOURCE.test(e.source))).toBe(true);
    for (const l of ["pm-lab-drugs-microvascular", "pm-lab-drugs-nitrates", "pm-interpreting-flow", "pm-interpreting-pitfalls", "pm-interpreting-spasm"]) expect(fromHere(l).length, l).toBeGreaterThan(0);
  });

  it("every link resolves to a launch the lab can open, and every variant it adds is a flow start of its scenario", () => {
    for (const l of CLOSURE.links ?? []) {
      const r = resolvePciLaunch({ scenario: l.scenario!, ...(l.start ? { start: l.start } : {}), ...(l.variant ? { variant: l.variant } : {}), ...(l.mode ? { mode: l.mode } : {}) });
      expect(r.problems, `${l.scenario} ${l.variant}`).toEqual([]);
      expect(r.launch?.start.id).toBe(l.start);
      expect(flowStartFor(l.scenario!, { start: l.start, variant: l.variant }), `${l.scenario} ${l.variant}`).toBe(l.variant);
      for (const v of l.adds?.variants ?? []) {
        const id = typeof v === "string" ? v : v.id;
        expect(flowStartFor(l.scenario!, { variant: id }), id).toBe(id);
      }
    }
    // the pack's own case opens at the sinus stain by default
    expect(pciScenarioDef("rca-aortocoronary")?.starts[0].id).toBe("sinus-stain");
    expect(flowStartFor("rca-aortocoronary", { start: "sinus-stain" })).toBe("sinus-stain");
    expect(FLOW_STARTS["sinus-stain"].scenario).toBe("rca-aortocoronary");
    // a flow start of one scenario is not one of another
    expect(flowStartFor("rca-cto", { variant: "no-reflow" })).toBeNull();
  });
});
