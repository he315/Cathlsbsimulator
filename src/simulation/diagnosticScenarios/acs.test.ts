// The ACS scenario pack (diag-acs-scenarios): its practice links, the MI classification its
// troponin-positive cases ask, the ACS front end of each scenario and the previous study.
//   npx vitest run src/simulation/diagnosticScenarios/acs.test.ts
import { describe, expect, it } from "vitest";
import { practiceForLesson } from "../../ui/content/practiceIndex";
import { asksMiClass } from "../../mentor/report";
import { scenarioCase } from "../caseGenerator";
import { diagScenarioById, scenarioEvents } from "./index";
import { ACS_CASES, acsCaseFor, scenarios } from "./acs";
import { launch } from "./acs.launch";
import { previousStudyCase } from "../../ui/lab/EcgPrebrief";

const cathlab = (lesson: string) => practiceForLesson(lesson).filter((e) => e.sim === "cathlab").map((e) => e.scenario);

describe("the practice index", () => {
  it("lists diag-stemi-anterior, diag-stemi-inferior-rv and diag-stemi-posterior under cp-acs-thrombus-ecg and pm-target-culprit, and the arrest cases under cp-complex-patients-ohca (from acs.launch.ts)", () => {
    for (const id of ["diag-stemi-anterior", "diag-stemi-inferior-rv", "diag-stemi-posterior"]) {
      expect(cathlab("cp-acs-thrombus-ecg"), id).toContain(id);
      expect(cathlab("pm-target-culprit"), id).toContain(id);
    }
    expect(cathlab("cp-complex-patients-ohca")).toEqual(expect.arrayContaining(["diag-ohca-st-elevation", "diag-ohca-no-st", "diag-ohca-post-rosc"]));
    // every scenario of the launch file under every lesson it names
    for (const sc of launch.scenarios ?? []) for (const l of sc.lessonIds) expect(cathlab(l), `${sc.id} under ${l}`).toContain(sc.id);
    expect(cathlab("cp-other-complex-scad")).toContain("diag-scad-postpartum");
    expect(cathlab("cm-principles-closure-pmi")).toContain("diag-iatrogenic-occlusion");
  });
});

describe("the MI classification", () => {
  it("diag-ohca-post-rosc now carries 'stemi', so the study report asks its MI classification", () => {
    const c = scenarioCase("diag-ohca-post-rosc")!;
    expect(c.events).toEqual(expect.arrayContaining(["post-arrest", "stemi"]));
    expect(asksMiClass(c.events)).toBe(true);
  });

  it("every troponin-positive case of the pack asks it; the elective study does not", () => {
    for (const s of scenarios) {
      const c = scenarioCase(s.id)!;
      expect(asksMiClass(c.events), s.id).toBe(s.indication !== "SA");
    }
  });
});

describe("the ACS front end", () => {
  it("every entry of ACS_CASES is a registered scenario, and each ECG is the chart's", () => {
    for (const [id, a] of Object.entries(ACS_CASES)) {
      const s = diagScenarioById(id);
      expect(s, id).toBeDefined();
      if (a.ecg && s!.id !== "diag-two-candidate-culprits") expect(s!.chart.ecgId, id).toBe(a.ecg.id);
      if (a.triage) expect(scenarioEvents(s!), id).toContain("post-arrest");
      // STEMI mode only for a STEMI presentation
      if (a.stemi) expect(s!.events, id).toContain("stemi");
    }
    expect(acsCaseFor("diag-graft-search")).toBeUndefined();
    expect(acsCaseFor(undefined)).toBeUndefined();
    // every scenario of the pack has a front end
    for (const s of scenarios) expect(acsCaseFor(s.id), s.id).toBeDefined();
  });

  it("the briefs, case names, titles and echo notes never state the ECG's answer: the learner reads the territory from the ECG", () => {
    const withEcg = [...scenarios, diagScenarioById("diag-ohca-post-rosc")!];
    for (const s of withEcg) {
      const e = ACS_CASES[s.id]?.ecg;
      if (!e || e.truth.territory === "no-st-elevation") continue;
      const word = { anterior: /anterior|apical|septal/i, inferior: /inferior/i, "inferior-rv": /inferior|right ventric/i, lateral: /lateral/i, posterior: /posterior/i, "diffuse-subendocardial": /aVR/, "bundle-branch-or-paced": /bundle|LBBB|paced/i }[e.truth.territory];
      expect(s.brief, s.id).not.toMatch(word);
      expect(s.caseName, s.id).not.toMatch(word);
      expect(s.title, s.id).not.toMatch(word);
      expect(s.title, s.id).not.toMatch(/V4R|V7|manage as STEMI/);
      if (s.chart.echo?.note) expect(s.chart.echo.note, s.id).not.toMatch(word);
    }
  });

  it("the arrest cases' titles do not state the triage answer", () => {
    for (const id of ["diag-ohca-st-elevation", "diag-ohca-no-st"]) expect(diagScenarioById(id)!.title, id).not.toMatch(/ST elevation|the lab now|intensive care/i);
  });

  it("the previous study of diag-two-candidate-culprits is the same patient's tree with the earlier lesions: the right coronary occlusion and no circumflex lesion", () => {
    const c = scenarioCase("diag-two-candidate-culprits")!;
    const spec = ACS_CASES["diag-two-candidate-culprits"].previousStudy!;
    const old = previousStudyCase(c, spec);
    expect(old.id).toBe(c.id);
    expect(old.lesions.map((l) => `${l.vessel}:${l.kind}`)).toEqual(["RCA:cto"]);
    expect(c.lesions.some((l) => l.vessel === "LCx" && l.kind === "thrombotic")).toBe(true);
    // the case itself is not changed
    expect(c.lesions).toHaveLength(2);
    expect(spec.runs.map((r) => r.side)).toEqual(["left", "left", "right"]);
  });
});
