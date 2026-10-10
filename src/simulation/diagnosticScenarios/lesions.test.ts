// The lesion morphology scenarios (diag-lesion-morphologies): the practice index lists them under
// their lessons, each seed of the SCAD scenario shows one of the four types, and every scenario's
// case draws its morphology on the tree.
//   npx vitest run src/simulation/diagnosticScenarios/lesions.test.ts
import { describe, expect, it } from "vitest";
import { scenarioCase } from "../caseGenerator";
import { buildAnatomy } from "../anatomy";
import { buildCoronaryTree } from "../../render/xray/coronaryTree";
import { practiceForLesson } from "../../ui/content/practiceIndex";
import { diagScenarioById, scenarioEvents } from "./index";
import { launch } from "./lesions.launch";
import { heldScenarios, scenarios } from "./lesions";

const cathlab = (lesson: string) => practiceForLesson(lesson).filter((e) => e.sim === "cathlab").map((e) => e.scenario);

describe("the practice index", () => {
  it("lists diag-eccentric-orthogonal, diag-tapering-reference and diag-lesion-at-branch under pm-interpreting-stenosis (from lesions.launch.ts); diag-focal-rca-spasm is held back from this pack and published by diag-spasm-states (spasm.launch.ts) now the live lab passes the nitrate effect", () => {
    expect(cathlab("pm-interpreting-stenosis")).toEqual(expect.arrayContaining(["diag-eccentric-orthogonal", "diag-tapering-reference", "diag-lesion-at-branch"]));
    // diag-spasm-states: FluoroView passes the engine's nitrate effect to the scene, so the spasm pack publishes it
    expect(cathlab("pm-acquiring-test-nitrate")).toContain("diag-focal-rca-spasm");
    expect(cathlab("pm-acquiring-anatomy")).toContain("diag-focal-rca-spasm");
    expect(diagScenarioById("diag-focal-rca-spasm")).toBe(heldScenarios[0]);
    expect(scenarios.map((s) => s.id)).not.toContain("diag-focal-rca-spasm");
    expect((launch.scenarios ?? []).map((s) => s.id)).not.toContain("diag-focal-rca-spasm");
    expect(heldScenarios.map((s) => s.id)).toEqual(["diag-focal-rca-spasm"]);
    // and every scenario of the pack under each of its lessons, opening in the guided mode by default
    for (const s of launch.scenarios ?? []) for (const l of s.lessonIds) expect(cathlab(l), `${s.id} under ${l}`).toContain(s.id);
    expect(practiceForLesson("cp-cto-strategy-selection").find((e) => e.scenario === "diag-cto-contralateral-collaterals")?.params).toEqual({ scenario: "diag-cto-contralateral-collaterals", mode: "guided" });
  });

  it("the pack and its launch file agree, and the registry holds the pack", () => {
    expect(scenarios.map((s) => s.id)).toEqual((launch.scenarios ?? []).map((s) => s.id));
    for (const s of scenarios) expect(diagScenarioById(s.id)).toBe(s);
  });
});

describe("the scenarios' events", () => {
  it("CTO cases raise total-occlusion and cto, the SCAD case scad-suspected, the thrombotic culprit thrombus", () => {
    expect(scenarioEvents(diagScenarioById("diag-cto-contralateral-collaterals")!)).toEqual(expect.arrayContaining(["total-occlusion", "cto"]));
    expect(scenarioEvents(diagScenarioById("diag-scad-types")!)).toContain("scad-suspected");
    expect(scenarioEvents(diagScenarioById("diag-two-candidate-culprits")!)).toEqual(expect.arrayContaining(["thrombus", "total-occlusion"]));
    // none of them is raised before the learner has done anything that would show it (no case-wide event)
    for (const s of [...scenarios, ...heldScenarios]) expect(s.events, s.id).toEqual([]);
  });
});

describe("the SCAD scenario's type follows the seed", () => {
  it("the same seed always gives the same type, and the seeds cover types 1, 2A, 2B and 3", () => {
    const types = new Set<string>();
    for (let i = 1; i <= 24; i++) {
      const a = scenarioCase("diag-scad-types", String(i))!;
      const b = scenarioCase("diag-scad-types", String(i))!;
      expect(a.lesions[0].scadType).toBe(b.lesions[0].scadType);
      types.add(a.lesions[0].scadType!);
    }
    expect([...types].sort()).toEqual(["1", "2A", "2B", "3"]);
    // a scenario that names its type keeps it
    expect(scenarioCase("diag-scad-suspected", "5")!.lesions[0].scadType).toBe("2A");
    // the registry's lesion is not changed
    expect(diagScenarioById("diag-scad-types")!.lesions![0].scadType).toBeUndefined();
  });
});

describe("every scenario draws its morphology", () => {
  it("eccentric, taper, branch, CTO channels, SCAD, spasm and thrombus each reach the tree", () => {
    const tree = (id: string) => {
      const c = scenarioCase(id, "1", (x) => diagScenarioById(x) ?? heldScenarios.find((s) => s.id === x))!;
      return buildCoronaryTree(buildAnatomy(c), c);
    };
    const lad = (id: string) => tree(id).vessels.find((v) => v.lesionId === "LAD")!;
    expect(lad("diag-eccentric-orthogonal").shape?.minor).toBeDefined();
    expect(lad("diag-tapering-reference").shape!.ref.some((r, i, a) => i > 0 && r < a[0] * 0.9)).toBe(true);
    expect(tree("diag-lesion-at-branch").lesionSites![0].branch).toBeDefined();
    expect(tree("diag-cto-contralateral-collaterals").vessels.filter((v) => v.kind === "collateral").length).toBe(2);
    expect(lad("diag-scad-types").shape).toBeDefined();
    expect(tree("diag-focal-rca-spasm").vessels.find((v) => v.lesionId === "RCA")!.shape?.spasmF).toBeDefined();
    const two = tree("diag-two-candidate-culprits");
    expect(two.vessels.find((v) => v.lesionId === "LCx")!.shape?.haze).toBeDefined();
    expect(two.vessels.some((v) => v.retro?.side === "left")).toBe(true);
  });
});
