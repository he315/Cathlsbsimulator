// Diagnostic scenario launches (diag-scenario-registry with found-launch-links): link validation
// against the packs' .launch.ts files, and a lesson's practice link opening the named case in the
// free lab with its chart and planted question in the pre-brief.
//   npx vitest run src/simulation/diagnosticScenarios/launch.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import type { LaunchFile, Track } from "../../content/schema";
import { buildKnownLaunch, validateLaunchLinks, type LaunchFiles } from "../../content/validateLaunch";
import { practiceForLesson } from "../../ui/content/practiceIndex";
import { useUiStore } from "../../state/useUiStore";
import { subscribeLabLaunch, useLabLaunchStore } from "../../state/useLabLaunchStore";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { caseForLaunch, loadLaunchedCase, showPrebrief } from "../../ui/sim/labSession";
import { visibilityFor } from "../../mentor/visibility";
import PreBrief from "../../ui/mentor/PreBrief";
import { chartQuestions, chartRows, prebriefWithChart } from "../../mentor/prebrief";
import { prebriefForCase } from "../../content/mentor/prebriefs";
import { CASE_LIBRARY } from "../caseGenerator";
import { diagScenarioById } from "./index";

const LAUNCH = import.meta.glob<LaunchFiles[string]>("./*.launch.ts", { eager: true });

/** A content root holding every lesson the packs link to, plus lesson x for the fixtures. */
function root(): Track[] {
  const ids = new Set<string>(["x"]);
  for (const mod of Object.values(LAUNCH)) for (const s of ((mod as { launch: LaunchFile }).launch.scenarios ?? [])) s.lessonIds.forEach((l) => ids.add(l));
  const lessons = [...ids].map((id) => ({ id, title: id, minutes: 1, blocks: [] }));
  return [{ id: "foundations", order: 0, title: "t", tagline: "", description: "", stage: 1, modules: [{ id: "m", title: "m", stage: 1, summary: "", objectives: [], lessons, quiz: [] }], cases: [] }] as unknown as Track[];
}

const g = () => useSimulatorStore.getState();
afterEach(() => {
  useLabLaunchStore.getState().clear();
  g().loadCase(CASE_LIBRARY[0], "free");
});

describe("cathlab launch links", () => {
  it("validateLaunchLinks with a fixture link rejects a cathlab link with an unknown scenario id", () => {
    const fixture: LaunchFile = { sim: "cathlab", links: [{ scenario: "diag-no-such-case", lessonIds: ["x"] }] };
    const errs = validateLaunchLinks({ tracks: root() }, buildKnownLaunch({ ...LAUNCH, "./fixture.launch.ts": { launch: fixture } }));
    expect(errs).toHaveLength(1);
    expect(errs[0]).toMatch(/unknown scenario "diag-no-such-case" for cathlab/);
  });

  it("accepts the packs as they are, a link to a declared scenario with a seed, and refuses a cathlab start the scenario does not declare", () => {
    expect(validateLaunchLinks({ tracks: root() }, buildKnownLaunch(LAUNCH))).toEqual([]);
    const ok: LaunchFile = { sim: "cathlab", links: [{ scenario: "diag-graft-search", params: { seed: "s1" }, lessonIds: ["x"] }] };
    expect(validateLaunchLinks({ tracks: root() }, buildKnownLaunch({ ...LAUNCH, "./ok.launch.ts": { launch: ok } }))).toEqual([]);
    const badStart: LaunchFile = { sim: "cathlab", links: [{ scenario: "diag-graft-search", start: "at-the-sheath", lessonIds: ["x"] }] };
    const errs = validateLaunchLinks({ tracks: root() }, buildKnownLaunch({ ...LAUNCH, "./bad.launch.ts": { launch: badStart } }));
    expect(errs.some((e) => /unknown start "at-the-sheath"/.test(e))).toBe(true);
  });
});

describe("a lesson's practice link opens the named case", () => {
  it("the practice entry for pm-engaging-trace opens diag-trace-recognition in the free lab, and the pre-brief shows the chart and its planted question", () => {
    const entry = practiceForLesson("pm-engaging-trace").find((e) => e.sim === "cathlab" && e.scenario === "diag-trace-recognition");
    expect(entry).toBeDefined();
    // the Practise button: openSim with the entry's params; the lab takes the request once
    useUiStore.getState().openSim("cathlab", entry!.params);
    expect(useUiStore.getState().section).toBe("free");
    const got: Record<string, string>[] = [];
    const off = subscribeLabLaunch("cathlab", (p) => {
      got.push(p);
      const l = caseForLaunch(p, g().caseData);
      if (l) loadLaunchedCase(l.c, l.mode);
    });
    off();
    expect(got).toEqual([{ scenario: "diag-trace-recognition", mode: "guided" }]);
    expect(useLabLaunchStore.getState().peek("cathlab")).toBeNull();
    const c = g().caseData;
    expect(c.id).toBe("scn|diag-trace-recognition|1");
    expect(g().policy.mode).toBe("guided");

    // the pre-brief the lab shows for it
    const prebrief = prebriefWithChart(prebriefForCase(c), c, diagScenarioById("diag-trace-recognition"));
    expect(prebrief.questions[0].id).toBe("chart-pregnancy");
    expect(prebrief.questions.length).toBeLessThanOrEqual(4);
    const html = renderToString(createElement(PreBrief, { prebrief, lab: "diagnostic", mode: "guided", catheters: ["JL4"], views: [], chart: chartRows(c.chart!), onComplete: () => undefined }));
    expect(html).toContain("Patient chart");
    expect(html).toContain("Pregnancy status");
    expect(html).toContain("Not documented");
    expect(html).toContain("46-year-old woman");
    expect(html).toContain(diagScenarioById("diag-trace-recognition")!.brief);
  });

  it("caseForLaunch: a seed, a mode, extra events, and an unknown scenario", () => {
    const cur = CASE_LIBRARY[0];
    const a = caseForLaunch({ scenario: "diag-ohca-post-rosc", seed: "9", mode: "supervised", events: "prior-cabg, not an event, not-an-event, post-arrest" }, cur)!;
    expect(a.c.id).toBe("scn|diag-ohca-post-rosc|9");
    expect(a.mode).toBe("supervised");
    // only events of the shared vocabulary are added, once each
    expect(a.c.events).toEqual(["post-arrest", "stemi", "prior-cabg"]);
    expect(caseForLaunch({ scenario: "diag-no-such-case" }, cur)).toBeNull();
    // no scenario: the current case, with the launch's events
    expect(caseForLaunch({ events: "post-arrest" }, cur)!.c).toMatchObject({ id: cur.id, events: ["post-arrest"] });
    // an exam launch loads as an exam
    loadLaunchedCase(a.c, "exam");
    expect(g().policy.mode).toBe("exam");
  });
});

describe("the lab shows a chart's pre-brief in every mode", () => {
  it("guided and independent need no time-out, yet a case with a chart opens on the pre-brief until it is closed once", () => {
    for (const mode of ["guided", "independent"] as const) {
      // useAttending starts with the time-out done when the mode requires none
      const timeOutDone = !visibilityFor(mode).timeOutRequired;
      expect(timeOutDone, mode).toBe(true);
      expect(showPrebrief({ timeOutDone, hasChart: true, chartBriefDone: false, finished: false }), mode).toBe(true);
      expect(showPrebrief({ timeOutDone, hasChart: true, chartBriefDone: true, finished: false }), mode).toBe(false);
      // a case without a chart keeps the old behaviour: no pre-brief without a time-out
      expect(showPrebrief({ timeOutDone, hasChart: false, chartBriefDone: false, finished: false }), mode).toBe(false);
    }
    for (const mode of ["supervised", "exam"] as const) {
      const timeOutDone = !visibilityFor(mode).timeOutRequired;
      expect(timeOutDone, mode).toBe(false);
      // until the time-out, with or without a chart
      expect(showPrebrief({ timeOutDone, hasChart: false, chartBriefDone: false, finished: false }), mode).toBe(true);
      expect(showPrebrief({ timeOutDone, hasChart: true, chartBriefDone: true, finished: false }), mode).toBe(true);
      expect(showPrebrief({ timeOutDone: true, hasChart: true, chartBriefDone: true, finished: false }), mode).toBe(false);
    }
    // never over a finished case
    expect(showPrebrief({ timeOutDone: false, hasChart: true, chartBriefDone: false, finished: true })).toBe(false);
    // the lesson launch of diag-trace-recognition is guided and its case has a chart
    const l = caseForLaunch({ scenario: "diag-trace-recognition", mode: "guided" }, CASE_LIBRARY[0])!;
    expect(l.mode).toBe("guided");
    expect(showPrebrief({ timeOutDone: !visibilityFor(l.mode!).timeOutRequired, hasChart: !!l.c.chart, chartBriefDone: false, finished: false })).toBe(true);
  });
});

describe("the chart's planted problems", () => {
  it("each planted problem gives its question, and a chart without one gives none", () => {
    const qs = (id: string) => chartQuestions(diagScenarioById(id)!.chart, diagScenarioById(id)!.planted).map((q) => q.id);
    expect(qs("diag-trace-recognition")).toEqual(["chart-pregnancy"]);
    expect(qs("diag-nitrate-pde5")).toEqual(["chart-pde5"]);
    expect(qs("diag-contrast-sensitive")).toEqual(["chart-egfr-ceiling"]);
    expect(qs("diag-prior-radiation")).toEqual(["chart-skin-injury"]);
    expect(qs("diag-graft-search")).toEqual(["chart-egfr-ceiling", "chart-operation-note"]);
    expect(qs("diag-scad-suspected")).toEqual([]);
    // the eGFR ceiling: 3.7 × 30 = 111 mL is the answer; the weight-based figure is offered and wrong
    const q = chartQuestions(diagScenarioById("diag-contrast-sensitive")!.chart, ["egfr-ceiling"])[0];
    // without a planted list the ceiling is asked only below eGFR 30 (Brilakis 28.3's advisory)
    expect(chartQuestions(diagScenarioById("diag-contrast-sensitive")!.chart)).toEqual([]);
    expect(chartQuestions({ ...diagScenarioById("diag-contrast-sensitive")!.chart, egfr: 25 }).map((x) => x.id)).toEqual(["chart-egfr-ceiling"]);
    expect(q.options.find((o) => q.correct.includes(o.id))!.text).toMatch(/^111 mL/);
    // a PDE-5 inhibitor outside its window plants nothing
    const late = { ...diagScenarioById("diag-nitrate-pde5")!.chart, drugs: [{ name: "Sildenafil", drugId: "sildenafil", lastDoseHoursAgo: 30 }] };
    expect(chartQuestions(late)).toEqual([]);
    const tadalafil = { ...late, drugs: [{ name: "Tadalafil", drugId: "tadalafil", lastDoseHoursAgo: 30 }] };
    expect(chartQuestions(tadalafil).map((x) => x.id)).toEqual(["chart-pde5"]);
  });

  it("the renal row keeps eGFR as written and sentence-cases a creatinine", () => {
    const chart = diagScenarioById("diag-trace-recognition")!.chart;
    expect(chartRows(chart).find((r) => r.id === "renal")!.value).toBe("eGFR 96 mL/min/1.73 m²");
    expect(chartRows({ ...chart, creatinineUmolL: 70 }).find((r) => r.id === "renal")!.value).toMatch(/^Creatinine 70 µmol\/L, eGFR 96/);
  });

  it("the PDE-5 scenario carries pde5-recent as a case event (the chart's sildenafil is history)", () => {
    expect(diagScenarioById("diag-nitrate-pde5")!.events).toContain("pde5-recent");
  });
});
