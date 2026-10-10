// pci-device-delivery: the delivery pack's launch file lists rca-stuck-stent and rca-calcified-uncrossable
// under the delivery, support and equipment-position lessons; the guide extension lessons open the stuck stent
// at the moment of failure and the combined-support lesson the balloon at the lesion edge; every link resolves.
//   npx vitest run src/simulation/pci/scenarios/delivery.practice.test.ts
import { describe, expect, it } from "vitest";
import { PRACTICE_INDEX, practiceForLesson } from "../../../ui/content/practiceIndex";
import { launch as DELIVERY } from "./packs/delivery.launch";
import { PCI_REGISTRY_PROBLEMS, pciScenarioDef } from "./registry";
import { resolvePciLaunch } from "../../../ui/pci/launch";

const SOURCE = /\/simulation\/pci\/scenarios\/packs\/delivery\.launch\.ts$/;
const SCENARIOS = ["rca-stuck-stent", "rca-calcified-uncrossable"];

describe("delivery pack practice links (pci-device-delivery)", () => {
  it("practiceIndex lists rca-stuck-stent and rca-calcified-uncrossable under pm-prep-and-stent-delivery, pm-prep-and-stent-support and pm-monitoring-position", () => {
    expect(PCI_REGISTRY_PROBLEMS).toEqual([]);
    expect(DELIVERY.sim).toBe("angio-pci");
    for (const lesson of ["pm-prep-and-stent-delivery", "pm-prep-and-stent-support", "pm-monitoring-position"]) {
      const mine = practiceForLesson(lesson, PRACTICE_INDEX).filter((e) => e.sim === "angio-pci" && SOURCE.test(e.source) && !e.start);
      expect(mine.map((e) => e.scenario).sort(), lesson).toEqual([...SCENARIOS].sort());
    }
    // the core pack keeps listing rca-calcified under the delivery lessons
    for (const lesson of ["pm-prep-and-stent-delivery", "pm-prep-and-stent-support"]) expect(practiceForLesson(lesson).some((e) => e.scenario === "rca-calcified")).toBe(true);
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("delivery.launch"))).toEqual([]);
  });

  it("the extension lessons open the stuck stent at 'stent-stuck-bend2'; the combined-support lesson the balloon at 'balloon-at-edge'", () => {
    for (const lesson of ["eq-sheaths-guides-extension-device", "eq-sheaths-guides-extension-use"]) {
      const e = practiceForLesson(lesson).find((x) => x.scenario === "rca-stuck-stent" && x.start === "stent-stuck-bend2");
      expect(e, lesson).toBeDefined();
      expect(e!.source).toMatch(SOURCE);
    }
    const u = practiceForLesson("cp-uncrossable-extension-combined").find((x) => x.scenario === "rca-calcified-uncrossable" && x.start === "balloon-at-edge");
    expect(u).toBeDefined();
    expect(u!.source).toMatch(SOURCE);
  });

  it("every scenario and link resolves to a PCI launch at its start", () => {
    for (const id of SCENARIOS) {
      expect(pciScenarioDef(id)?.heldOut).toBe(false);
      const r = resolvePciLaunch({ scenario: id });
      expect(r.problems, id).toEqual([]);
    }
    for (const l of DELIVERY.links ?? []) {
      const r = resolvePciLaunch({ scenario: l.scenario!, start: l.start!, mode: "guided" });
      expect(r.problems).toEqual([]);
      expect(r.launch?.start.id).toBe(l.start);
    }
  });
});
