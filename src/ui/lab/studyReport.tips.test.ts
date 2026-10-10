// diag-study-report in the lab: the finish step's tips, the report screen (no truth before submission)
// and the debrief with the submitted report.
//   npx vitest run src/ui/lab/studyReport.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { useProgressStore } from "../../state/useProgressStore";
import { CASE_LIBRARY, scenarioCase } from "../../simulation/caseGenerator";
import { visibilityFor } from "../../mentor/visibility";
import { DiagnosticLabSession } from "../sim/labSession";
import { LabScreen, reportRuns, syncFinishEvents } from "../sim/Simulator";
import StudyReport, { supplyKey, supplyOf, withStudyReport } from "./StudyReport";
import { tipsFor, tipsForAll, type LabEvent } from "../../content/lab/tips";
import { WAITING_TIPS, DEFERRED_RETARGETS } from "../../content/lab/raisable/waiting";
import { assessAttempt } from "../../mentor";
import { emptyFrame, ProcedureRecorder } from "../../mentor/telemetry";
import { segmentLabelAt } from "../../mentor/treeSegments";
import { asksMiClass, compareStudyReport, emptyStudyReport, finishContexts, miTruth, finishEvents, LV_WALL_LABEL, LV_WALLS, reportGrafts, studyReportGaps, studyTruth, wallsOfRegion, type StudyReport as Report } from "../../mentor/report";
import type { AnatomyCase } from "../../types";
import { PRACTICE_INDEX } from "../content/practiceIndex";
import { buildKnownLaunch, validateLaunchLinks, type LaunchFiles } from "../../content/validateLaunch";
import { TRACKS, PUBLISHED_CASES } from "../../content";
import { launch as studyReportLaunch } from "../../content/practice/diag-study-report.launch";
import { section as reportSection } from "../mentor/debrief/ReportSection";
import { DEBRIEF_SECTIONS, sectionsFor } from "../mentor/debrief/index";

const g = () => useSimulatorStore.getState();
const base = CASE_LIBRARY[0];
/**
 * The routine case with an anomalous circumflex from the right sinus: the tree and the flow model draw it
 * (its circumflex regions fill from the right injection), as in scenario diag-territory-check-anomalous-cx.
 */
const anomalous: AnatomyCase = { ...base, id: `${base.id}-anomalous-cx`, variants: [...base.variants, "anomalous-lcx-right-sinus"] };

const lateralEmpty = (): Report => ({
  ...emptyStudyReport(),
  territories: {
    anterior: { kind: "native", artery: "LAD", injection: "left" },
    septal: { kind: "native", artery: "LAD", injection: "left" },
    apical: { kind: "native", artery: "LAD", injection: "left" },
    inferior: { kind: "native", artery: "RCA", injection: "right" },
    lateral: { kind: "none" },
  },
});

afterEach(() => {
  useProgressStore.setState({ activePolicy: null });
  g().loadCase(base, "free");
});

describe("finish-step tips", () => {
  it("opening the report sets phase 'finish'; in scenario diag-territory-check-anomalous-cx an empty lateral wall raises anomalous-origin, and the drawer's contexts show diag-anomalous-origin-image-first and diag-interp-anomalous-cx-search", () => {
    const scn = scenarioCase("diag-territory-check-anomalous-cx", "s1")!;
    expect(scn.variants).toContain("anomalous-lcx-right-sinus");
    g().loadCase(scn, "free");
    expect(g().caseData.scenarioId).toBe("diag-territory-check-anomalous-cx");
    const session = new DiagnosticLabSession(useSimulatorStore, null);
    try {
      expect(session.tipContext().phase).not.toBe("finish");
      // 'Finish study': the store opens the step and the shell moves the tips to the finish phase
      g().beginFinish();
      expect(g().finishing).toBe(true);
      session.setFinishStep(true);
      expect(session.tipContext().phase).toBe("finish");
      expect(tipsFor(session.tipContext(), 20).map((t) => t.id)).toContain("diag-interp-every-territory");

      // the learner reports the lateral wall with no supplying vessel: the shell syncs the finish events
      const added = new Set<LabEvent>();
      const draft = lateralEmpty();
      syncFinishEvents(session.events, finishEvents(draft, g().caseData), added);
      expect(session.activeEvents()).toEqual(expect.arrayContaining(["territory-unsupplied", "anomalous-origin"]));
      const ctxs = finishContexts(session.tipContext(), draft);
      const ids = tipsFor(ctxs[1], 20).map((t) => t.id);
      expect(ids).toContain("diag-anomalous-origin-image-first");
      expect(ids).toContain("diag-interp-anomalous-cx-search");
      expect(tipsForAll(ctxs, 20).map((t) => t.id)).toEqual(expect.arrayContaining(["diag-anomalous-origin-image-first", "diag-interp-anomalous-cx-search"]));

      // assigning the wall drops the events the step raised; closing the step leaves nothing behind
      syncFinishEvents(session.events, finishEvents({ ...draft, territories: { ...draft.territories, lateral: { kind: "native", artery: "LCx", injection: "right" } } }, g().caseData), added);
      expect(session.activeEvents()).not.toContain("anomalous-origin");
      g().cancelFinish();
      session.setFinishStep(false);
      syncFinishEvents(session.events, [], added);
      expect(added.size).toBe(0);
      expect(session.tipContext().phase).not.toBe("finish");
    } finally {
      session.dispose();
    }
  });

  it("a CTO case raises cto at the finish step, without clearing a cto the scenario already holds", () => {
    const cto: AnatomyCase = { ...base, id: `${base.id}-cto`, lesions: [{ vessel: "RCA", position: 0.3, severity: 100, kind: "cto", morphology: "cto" }] };
    g().loadCase(cto, "free");
    const session = new DiagnosticLabSession(useSimulatorStore, null);
    try {
      const added = new Set<LabEvent>();
      syncFinishEvents(session.events, finishEvents(emptyStudyReport(), g().caseData), added);
      expect(session.activeEvents()).toContain("cto");
      syncFinishEvents(session.events, [], added);
      expect(session.activeEvents()).not.toContain("cto");
      // held from elsewhere first: the finish step leaves it alone
      session.events.hold(["cto"]);
      syncFinishEvents(session.events, ["cto"], added);
      expect(added.has("cto")).toBe(false);
      syncFinishEvents(session.events, [], added);
      expect(session.activeEvents()).toContain("cto");
    } finally {
      session.dispose();
    }
  });

  it("no waiting.ts entry names diag-study-report (so none is left unsatisfiable by it)", () => {
    expect(WAITING_TIPS.filter((w) => w.raisedBy === "diag-study-report")).toEqual([]);
    expect(DEFERRED_RETARGETS.filter((d) => d.raisedBy === "diag-study-report")).toEqual([]);
  });
});

describe("the report screen", () => {
  const props = (c: AnatomyCase, value: Report = emptyStudyReport(reportGrafts(c))) => ({
    value,
    onChange: () => undefined,
    grafts: reportGrafts(c),
    miAsked: false,
    runs: [{ number: 1, label: "Run 1, LAO caudal" }],
    onBack: () => undefined,
    onSubmit: () => undefined,
  });

  it("shows nothing from the case truth: two cases that differ only in their lesions and graft status render the same report", () => {
    const grafted: AnatomyCase = { ...base, grafts: [{ id: "svg-om", conduit: "svg", target: "OM1", position: 0.35, proximalSite: "aorta-high", status: "patent", ringMarker: false }] };
    const other: AnatomyCase = { ...grafted, lesions: [{ vessel: "LM", position: 0.5, severity: 90, kind: "severe-stenosis" }], grafts: [{ ...grafted.grafts![0], status: "occluded" }] };
    const a = renderToString(createElement(StudyReport, props(grafted)));
    const b = renderToString(createElement(StudyReport, props(other)));
    expect(a).toBe(b);
    expect(a).toContain("Vein graft to OM1");
    expect(a).toContain("Lateral or posterolateral");
    expect(a).toContain("Submit report and finish");
    // every answer starts empty: submission is disabled until the walls are assigned
    expect(a).toMatch(/disabled=""[^>]*>Submit report and finish/);
    expect(a).not.toMatch(/90%|severe-stenosis/);
  });

  it("names each wall select for assistive technology and lets the whole panel scroll in a small pane", () => {
    const html = renderToString(createElement(StudyReport, props(base)));
    for (const w of LV_WALLS) {
      const sel = html.match(new RegExp(`<select[^>]*data-wall="${w}"[^>]*>`))?.[0] ?? "";
      expect(sel).toContain(`aria-label="${LV_WALL_LABEL[w]} wall: supplying vessel"`);
    }
    const root = html.match(/<div[^>]*data-study-report[^>]*>/)?.[0] ?? "";
    expect(root).toContain("overflow-y-auto");
    const body = html.match(/<div[^>]*data-report-body[^>]*>/)?.[0] ?? "";
    expect(body).toContain("min-h-[16rem]");
    expect(body).not.toContain("min-h-0");
  });

  it("round-trips wall supplies through the select values", () => {
    for (const s of [{ kind: "none" as const }, { kind: "graft" as const, graftId: "svg-om" }, { kind: "native" as const, artery: "LCx" as const, injection: "right" as const }]) expect(supplyOf(supplyKey(s))).toEqual(s);
    expect(supplyOf("")).toBeUndefined();
  });

  it("the lab shows the report over the live monitor once 'Finish study' is pressed, in every mode", () => {
    for (const mode of ["guided", "supervised", "independent", "exam"] as const) {
      if (mode === "exam") g().loadCase(base, "exam");
      else {
        useProgressStore.setState({ activePolicy: { epa: "lca-engage", caseId: base.id, mode, entrustment: 2, visibility: visibilityFor(mode, 2) } });
        g().loadCase(base, "case");
      }
      const session = new DiagnosticLabSession(useSimulatorStore, null);
      try {
        const before = renderToString(createElement(LabScreen, { session, input: null, title: "Cath lab" }));
        expect(before).toContain("Finish study");
        expect(before).not.toContain("data-study-report");
        g().beginFinish();
        const open = renderToString(createElement(LabScreen, { session, input: null, title: "Cath lab" }));
        expect(open, mode).toContain("data-study-report");
        expect(open).toContain("Reference monitor");
        expect(open).not.toContain(">Finish study<");
      } finally {
        session.dispose();
      }
    }
  });

  it("lists the case's stored cine runs with their view", () => {
    const runs = reportRuns(
      [
        { number: 1, kind: "cine", caseId: "a", cArm: { laoRao: 45, cranialCaudal: -25 } },
        { number: 2, kind: "fluoro", caseId: "a", cArm: { laoRao: 0, cranialCaudal: 0 } },
        { number: 3, kind: "cine", caseId: "b", cArm: { laoRao: 0, cranialCaudal: 0 } },
      ],
      "a"
    );
    expect(runs).toEqual([{ number: 1, label: "Run 1, LAO caudal" }]);
  });
});

describe("the territory truth in a real session", () => {
  const truthOf = (c: AnatomyCase) => {
    g().loadCase(c, "free");
    const session = new DiagnosticLabSession(useSimulatorStore, null);
    try {
      return { regions: session.engine.flow.regions, truth: studyTruth({ caseData: g().caseData, regions: session.engine.flow.regions, segmentOf: (v, p) => segmentLabelAt(session.tree, v, p) }) };
    } finally {
      session.dispose();
    }
  };
  const report = (lateral: Report["territories"]["lateral"]): Report => ({ ...lateralEmpty(), dominance: base.dominance, decision: "no-pci", territories: { ...lateralEmpty().territories, lateral } });

  it("the tree's septal perforators supply the septum, and a routine case's walls are LAD, RCA and circumflex", () => {
    const { regions, truth } = truthOf(base);
    const septals = regions.filter((r) => /^S\d+$/.test(r.vessel) && !r.rv);
    expect(septals.length).toBeGreaterThan(0);
    for (const r of septals) expect(wallsOfRegion(r), r.vessel).toEqual(["septal"]);
    expect(truth.territories.septal).toMatchObject({ artery: "LAD", injection: "left" });
    expect(truth.territories.lateral).toMatchObject({ artery: "LCx", injection: "left" });
    expect(compareStudyReport(report({ kind: "native", artery: "LCx", injection: "left" }), truth).study!.territories.every((x) => x.correct)).toBe(true);
  });

  it("an anomalous circumflex from the right sinus: the lateral wall from the left injection is the wrong injection, from the right injection it is right", () => {
    const { truth } = truthOf(anomalous);
    expect(truth.anomalous).toBe(true);
    expect(truth.territories.lateral).toMatchObject({ artery: "LCx", injection: "right" });
    const wrong = compareStudyReport(report({ kind: "native", artery: "LCx", injection: "left" }), truth);
    expect(wrong.study!.territories.find((x) => x.wall === "lateral")).toMatchObject({ correct: false, problem: "wrong-injection" });
    const gap = studyReportGaps(wrong).find((x) => x.id === "report-territory")!;
    expect(gap.lessonId).toBe("pm-interpreting-anomalies");
    const right = compareStudyReport(report({ kind: "native", artery: "LCx", injection: "right" }), truth);
    expect(right.study!.territories.every((x) => x.correct)).toBe(true);
  });
});

describe("the study report scenarios (src/simulation/diagnosticScenarios/studyReport.ts)", () => {
  const truthOf = (c: AnatomyCase) => {
    g().loadCase(c, "free");
    const session = new DiagnosticLabSession(useSimulatorStore, null);
    try {
      return studyTruth({ caseData: g().caseData, regions: session.engine.flow.regions, segmentOf: (v, p) => segmentLabelAt(session.tree, v, p) });
    } finally {
      session.dispose();
    }
  };
  const decide = (c: AnatomyCase, decision: Report["decision"]): Report => ({ ...lateralEmpty(), dominance: c.dominance, decision, territories: { ...lateralEmpty().territories, lateral: { kind: "native", artery: "LCx", injection: "left" } } });

  it("diag-territory-check-anomalous-cx: every seed draws the circumflex from the right sinus, whose lateral wall fills from the right injection", () => {
    for (const seed of ["1", "2", "3", "4"]) {
      const c = scenarioCase("diag-territory-check-anomalous-cx", seed)!;
      const t = truthOf(c);
      expect(t.anomalous, seed).toBe(true);
      expect(t.territories.lateral, `${seed} ${c.variants.join(",")}`).toMatchObject({ artery: "LCx", injection: "right" });
      expect(finishEvents(lateralEmpty(), c)).toEqual(["territory-unsupplied", "anomalous-origin"]);
    }
  });

  it("diag-beyond-consent-lm: ad hoc PCI gives the deferral gap for unprotected left main disease", () => {
    const c = scenarioCase("diag-beyond-consent-lm")!;
    const cmp = compareStudyReport(decide(c, "adhoc"), truthOf(c));
    expect(cmp.study!.anatomy.unprotectedLm).toBe(true);
    // the scenario's lesson: the anatomy is beyond what the consent covered
    expect(cmp.study!.deferralApplies).toEqual(expect.arrayContaining(["anatomy", "consent"]));
    expect(cmp.study!.adhocAgainstReasons).toBe(true);
    expect(studyReportGaps(cmp).find((x) => x.id === "report-adhoc-deferral")?.lessonId).toBe("pm-target-timing");
    expect(compareStudyReport(decide(c, "heart-team"), truthOf(c)).study!.adhocAgainstReasons).toBe(false);
  });

  it("diag-cto-plan-not-adhoc: the finish step raises cto and ad hoc PCI is scored against the reasons to defer", () => {
    const c = scenarioCase("diag-cto-plan-not-adhoc")!;
    expect(finishEvents(emptyStudyReport(), c)).toEqual(["cto"]);
    const cmp = compareStudyReport(decide(c, "adhoc"), truthOf(c));
    expect(cmp.study!.anatomy.cto).toBe(true);
    expect(cmp.study!.adhocAgainstReasons).toBe(true);
  });

  it("diag-minoca-classify: the report asks for the MI classification, and the truth is injury with non-obstructive arteries", () => {
    const c = scenarioCase("diag-minoca-classify")!;
    expect(asksMiClass(c.events)).toBe(true);
    const t = truthOf(c);
    expect(t.acs).toBe(true);
    expect(miTruth(t)).toBe("injury-non-obstructive");
  });
});

describe("the injections the report may credit (useSimulatorStore filmedInjectionSides)", () => {
  const bolus = (side: "left" | "right" | null, filled: string[]) => ({ filled, plume: "none" as const, side, phase: 0, duration: 60, progress: 0, intensity: 0, peak: 1, diagnostic: true, filmed: false, counted: false, labEnded: true });

  it("a bolus filmed by a cine run adds its side; an unengaged injection adds the sides of the vessels it filled; a new case clears them", () => {
    g().loadCase(base, "free");
    expect(g().filmedInjectionSides).toEqual([]);
    useSimulatorStore.setState({ pedalImaging: true, pedal: { fluoro: false, cine: false }, bolus: bolus("left", ["LM", "LAD"]) as never });
    // the contrast is in the vessels but no cine yet: nothing filmed
    expect(g().filmedInjectionSides).toEqual([]);
    g().setPedal({ fluoro: false, cine: true });
    expect(g().filmedInjectionSides).toEqual(["left"]);
    g().setPedal({ fluoro: false, cine: false });
    useSimulatorStore.setState({ bolus: bolus(null, ["RCA", "PDA"]) as never });
    g().setPedal({ fluoro: false, cine: true });
    expect(g().filmedInjectionSides).toEqual(["left", "right"]);
    g().loadCase(base, "free");
    expect(g().filmedInjectionSides).toEqual([]);
  });
});

describe("submission and the debrief", () => {
  it("submitting stores the report and the PCI target and finishes the case; the debrief gains the report and its gaps", () => {
    const LM = { vessel: "LM" as const, position: 0.5, severity: 70, kind: "severe-stenosis" as const };
    const c: AnatomyCase = { ...base, lesions: [LM] };
    g().loadCase(c, "free");
    const session = new DiagnosticLabSession(useSimulatorStore, null);
    try {
      g().beginFinish();
      const draft: Report = {
        ...lateralEmpty(),
        dominance: c.dominance,
        territories: { ...lateralEmpty().territories, lateral: { kind: "native", artery: "LCx", injection: "left" } },
        decision: "adhoc",
        target: { vessel: "LM", segment: "LM", qcaPct: 72, lengthMm: 6 },
      };
      // what the shell's submit does: the truth from the case, the engine's regions and the tree
      const truth = studyTruth({ caseData: g().caseData, regions: session.engine.flow.regions, segmentOf: (v, p) => segmentLabelAt(session.tree, v, p) });
      const comparison = compareStudyReport(draft, truth, 42);
      expect(comparison.study!.territories.every((x) => x.correct)).toBe(true);
      expect(comparison.study!.adhocAgainstReasons).toBe(true);
      g().submitStudyReport({ report: draft, comparison, pciTarget: { vessel: "LM", segment: "LM", qcaPct: 72, lengthMm: 6, lesionId: "LM@0.500", strategy: "adhoc" }, submittedAt: 42 });
      expect(g().finished).toBe(true);
      expect(g().finishing).toBe(false);
      expect(g().studyReport?.pciTarget?.lesionId).toBe("LM@0.500");

      const rec = new ProcedureRecorder({ id: "rec", startedAt: 0, caseId: c.id, lab: "diagnostic", mode: "supervised", entrustment: 2, seed: "s1" });
      for (let i = 1; i <= 20; i++) rec.sample({ ...emptyFrame(), tWall: i * 0.1, step: i }, true);
      const plain = assessAttempt(rec.toRecord()).debrief;
      expect(plain.report).toBeUndefined();
      const merged = withStudyReport(plain, comparison);
      expect(merged.report?.study?.decision).toBe("adhoc");
      const gap = merged.analysis.gaps.find((x) => x.id === "report-adhoc-deferral")!;
      expect(gap.check).toBe("study-report");
      expect(gap.rewind).toBeUndefined();
      expect(merged.analysis.gaps.length).toBeLessThanOrEqual(3);
      // the debrief's Study report tab: absent before submission, registered and drawn after it
      expect(DEBRIEF_SECTIONS.some((x) => x.id === "study-report")).toBe(true);
      expect(reportSection.applies({ model: plain, t0: 0 })).toBe(false);
      expect(sectionsFor({ model: plain, t0: 0 }).some((x) => x.id === "study-report")).toBe(false);
      expect(reportSection.applies({ model: merged, t0: 0 })).toBe(true);
      expect(sectionsFor({ model: merged, t0: 0 }).some((x) => x.id === "study-report")).toBe(true);
      const tab = renderToString(createElement(reportSection.Component, { model: merged, t0: 0, onOpenLesson: () => {} }));
      expect(tab).toContain('data-section="study-report"');
      expect(tab).toContain('data-gap="report-adhoc-deferral"');
      expect(tab).toContain(`data-lesson="${gap.lessonId}"`);
      expect(tab).toContain('data-target="LM@0.500"');
      for (const w of LV_WALLS) expect(tab).toContain(`data-wall="${w}"`);
      // a debrief that already has the report is unchanged
      expect(withStudyReport(merged, comparison)).toBe(merged);
      expect(withStudyReport(plain, undefined)).toBe(plain);
      // a new case clears it
      g().loadCase(base, "free");
      expect(g().studyReport).toBeNull();
    } finally {
      session.dispose();
    }
  });
});

describe("practice links (src/content/practice/diag-study-report.launch.ts)", () => {
  it("validate against every .launch.ts, and the practice index lists them under their lessons", () => {
    const files = import.meta.glob<LaunchFiles[string]>(["/src/**/*.launch.ts", "!/src/**/__fixtures__/**"], { eager: true });
    expect(validateLaunchLinks({ tracks: TRACKS, cases: PUBLISHED_CASES }, buildKnownLaunch(files))).toEqual([]);
    for (const l of studyReportLaunch.links ?? []) {
      for (const lessonId of l.lessonIds) {
        const entry = (PRACTICE_INDEX.byLesson.get(lessonId) ?? []).find((e) => e.sim === "cathlab" && e.scenario === l.scenario);
        expect(entry, `${l.scenario} under ${lessonId}`).toBeDefined();
        expect(entry!.params.scenario).toBe(l.scenario);
      }
    }
    expect((studyReportLaunch.links ?? []).map((l) => l.scenario)).toEqual(["diag-territory-check-anomalous-cx", "diag-beyond-consent-lm", "diag-cto-plan-not-adhoc", "diag-graft-search"]);
  });

  it("the practice index lists the study report scenarios under pm-acquiring-anatomy, pm-interpreting-anomalies and pm-interpreting-pitfalls, and under their own lessons", () => {
    const listed = (lessonId: string) => (PRACTICE_INDEX.byLesson.get(lessonId) ?? []).filter((e) => e.sim === "cathlab").map((e) => e.scenario);
    expect(listed("pm-acquiring-anatomy")).toContain("diag-territory-check-anomalous-cx");
    expect(listed("pm-interpreting-anomalies")).toContain("diag-territory-check-anomalous-cx");
    expect(listed("pm-interpreting-pitfalls")).toEqual(expect.arrayContaining(["diag-territory-check-anomalous-cx", "diag-beyond-consent-lm", "diag-cto-plan-not-adhoc"]));
    // the lessons of the plan's lessonAndCaseLinks: pm-planning, cp-cto-strategy and hb-background
    expect(listed("pm-planning-consent")).toContain("diag-beyond-consent-lm");
    expect(listed("pm-target-timing")).toEqual(expect.arrayContaining(["diag-beyond-consent-lm", "diag-cto-plan-not-adhoc"]));
    expect(listed("cp-cto-strategy-selection")).toContain("diag-cto-plan-not-adhoc");
    expect(listed("hb-background-mi")).toContain("diag-minoca-classify");
  });
});
