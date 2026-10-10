// The stable multi-vessel scenarios (angio-decision-drills): the practice index lists them under the lessons
// that teach the revascularisation decision, each carries a full decision chart that agrees with its anatomy
// and its patient chart, and the case name gives nothing away.
//   npx vitest run src/simulation/diagnosticScenarios/multivessel.test.ts
import { describe, expect, it } from "vitest";
import { practiceForLesson } from "../../ui/content/practiceIndex";
import { scenarioCase } from "../caseGenerator";
import { diagScenarioById } from "./index";
import { launch } from "./multivessel.launch";
import { scenarios, vignettes } from "./multivessel";
import { decideStable } from "../../content/decisions/revascStable";

describe("multivessel.launch.ts in the practice index", () => {
  it("lists the decision scenarios under pm-target-ccs-why and pm-target-heart-team", () => {
    const at = (lesson: string) => practiceForLesson(lesson).filter((e) => e.sim === "cathlab" && e.source.endsWith("multivessel.launch.ts")).map((e) => e.scenario);
    expect(at("pm-target-heart-team")).toEqual(["diag-mvd-diabetes-fit", "diag-mvd-two-vessel-heart-team", "diag-mvd-diabetes-frail"]);
    expect(at("pm-target-ccs-why")).toEqual(launch.scenarios!.map((s) => s.id));
    const e = practiceForLesson("pm-target-heart-team").find((x) => x.scenario === "diag-mvd-diabetes-fit")!;
    expect(e.params).toEqual({ scenario: "diag-mvd-diabetes-fit", mode: "guided" });
  });
});

describe("the decision charts", () => {
  it("every scenario has a vignette and every vignette a scenario; the registry holds them", () => {
    expect(Object.keys(vignettes).sort()).toEqual(scenarios.map((s) => s.id).sort());
    for (const s of scenarios) expect(diagScenarioById(s.id), s.id).toBeDefined();
  });

  it("the vignette agrees with the case: the arteries with significant lesions, the left main, the LVEF and a stable presentation", () => {
    for (const s of scenarios) {
      const v = vignettes[s.id].inputs;
      const c = scenarioCase(s.id, "1")!;
      const sig = c.lesions.filter((l) => l.severity >= 70);
      const arteries = new Set(sig.filter((l) => l.vessel !== "LM").map((l) => l.vessel));
      expect(arteries.size, s.id).toBe(v.extent.vessels);
      expect(sig.some((l) => l.vessel === "LM"), s.id).toBe(v.extent.leftMain);
      expect(s.chart.echo?.lvef, s.id).toBe(v.lvef);
      expect(s.indication, s.id).toBe("SA");
      // diabetes shows in the chart as a glucose-lowering drug, and its absence as none
      expect((s.chart.drugs ?? []).some((d) => /metformin/i.test(d.name)), s.id).toBe(v.diabetes);
      expect(v.priorCabg, s.id).toBe(false);
      expect(s.grafts ?? [], s.id).toEqual([]);
    }
  });

  it("the checks name the recommendation the algorithm reaches", () => {
    const word = { none: /No revascularisation/, pci: /PCI recommended/, cabg: /CABG recommended/, "heart-team": /Heart-team referral/ } as const;
    for (const s of scenarios) {
      const out = decideStable(vignettes[s.id].inputs).outcome;
      expect(s.checks.some((ch) => word[out].test(ch.text)), `${s.id}: ${out}`).toBe(true);
    }
  });

  it("the brief and case name state the presentation, not the answer", () => {
    for (const s of scenarios) {
      expect(s.caseName).not.toMatch(/CABG|PCI|heart team|vessel|diabet/i);
      expect(s.brief).not.toMatch(/CABG|heart team|three-vessel|two-vessel|single-vessel/i);
    }
  });
});
