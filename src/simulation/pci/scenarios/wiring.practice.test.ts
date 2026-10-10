// pci-wire-microcatheter: the wiring pack's launch file lists its scenarios under the wiring lessons, the
// rca-cto links come from it too, and the held-out exercise variants are never listed.
//   npx vitest run src/simulation/pci/scenarios/wiring.practice.test.ts
import { describe, expect, it } from "vitest";
import { PRACTICE_INDEX, practiceForLesson } from "../../../ui/content/practiceIndex";
import { launch as WIRING } from "./packs/wiring.launch";
import { pciScenarioDef, PCI_REGISTRY_PROBLEMS } from "./registry";
import { resolveScenario } from "./generate";
import { resolvePciLaunch } from "../../../ui/pci/launch";

const SOURCE = /\/simulation\/pci\/scenarios\/packs\/wiring\.launch\.ts$/;

describe("wiring pack practice links (pci-wire-microcatheter)", () => {
  it("practiceIndex lists lcx-om-tortuous, wiring-ladder and rca-cto under pm-wiring-wire-choice, pm-wiring-shape-load and pm-wiring-navigate", () => {
    expect(PCI_REGISTRY_PROBLEMS).toEqual([]);
    for (const lesson of ["pm-wiring-wire-choice", "pm-wiring-shape-load", "pm-wiring-navigate"]) {
      const list = practiceForLesson(lesson).filter((e) => e.sim === "angio-pci");
      const scen = new Set(list.map((e) => e.scenario));
      for (const id of ["lcx-om-tortuous", "wiring-ladder", "rca-cto"]) expect(scen.has(id), `${lesson} lists ${id}`).toBe(true);
      // the wiring scenarios come from this pack's launch file
      for (const id of ["lcx-om-tortuous", "wiring-ladder"]) expect(list.find((e) => e.scenario === id)!.source).toMatch(SOURCE);
    }
    // rca-cto is linked from this file under the lessons the core pack does not already list it for
    for (const lesson of ["pm-wiring-shape-load", "pm-wiring-navigate"]) expect(practiceForLesson(lesson).find((e) => e.scenario === "rca-cto")!.source).toMatch(SOURCE);
    // the trapping lessons open rca-cto with the wire across the occlusion
    for (const lesson of ["pm-wiring-microcatheters", "pm-engaging-exchange", "eq-balloons-stents-cart-specialty"]) {
      const e = practiceForLesson(lesson).find((x) => x.scenario === "rca-cto" && x.start === "wire-across");
      expect(e, lesson).toBeDefined();
      expect(e!.source).toMatch(SOURCE);
    }
    expect(practiceForLesson("pm-wiring-tortuosity").some((e) => e.scenario === "lcx-om-tortuous")).toBe(true);
    // the plan's links to lad-focal and rca-calcified, where the core pack does not list them already
    expect(practiceForLesson("pm-wiring-navigate").find((e) => e.scenario === "lad-focal")?.source).toMatch(SOURCE);
    for (const lesson of ["pm-wiring-shape-load", "pm-wiring-navigate"]) expect(practiceForLesson(lesson).find((e) => e.scenario === "rca-calcified")?.source, lesson).toMatch(SOURCE);
    for (const lesson of ["pm-wiring-wire-choice", "pm-wiring-shape-load", "pm-wiring-navigate"]) {
      const scen = new Set(practiceForLesson(lesson).filter((e) => e.sim === "angio-pci").map((e) => e.scenario));
      for (const id of ["lad-focal", "rca-calcified"]) expect(scen.has(id), `${lesson} lists ${id}`).toBe(true);
    }
  });

  it("the held-out exercise variants are declared held out, never listed, and open as seeds of the exercise in exam mode", () => {
    const ladder = WIRING.scenarios!.find((s) => s.id === "wiring-ladder")!;
    const variants = (ladder.variants ?? []).map((v) => (typeof v === "string" ? { id: v, heldOut: false } : v));
    expect(variants.length).toBeGreaterThan(0);
    for (const v of variants) expect(v.heldOut, v.id).toBe(true);
    for (const list of PRACTICE_INDEX.byLesson.values()) for (const e of list) expect(e.variant && e.scenario === "wiring-ladder").toBeFalsy();
    const r = resolvePciLaunch({ scenario: "wiring-ladder", variant: "XA", mode: "exam" });
    expect(r.problems).toEqual([]);
    expect(r.launch?.mode).toBe("exam");
    expect(r.launch?.resolved.seed).toBe("XA");
    expect(resolveScenario("wiring-ladder", "XB").seed).toBe("XB");
    expect(pciScenarioDef("wiring-ladder")?.heldOut).toBe(false);
  });
});
