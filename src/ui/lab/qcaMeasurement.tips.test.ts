// diag-qca-measurement in the diagnostic lab: the views-phase tips with QCA open on the reference
// monitor, the result panel (both references, their average, the derived area stenosis, the
// segment and 'Report this measurement'; no model value on screen), the report sent with the
// model's projected stenosis per stored view, the debrief check that names the worse view, and the
// practice links.
//   npx vitest run src/ui/lab/qcaMeasurement.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { useSeriesStore, type StoredSeries } from "../../state/useSeriesStore";
import { scenarioCase } from "../../simulation/caseGenerator";
import { tipsFor } from "../../content/lab/tips";
import { WAITING_TIPS, DEFERRED_RETARGETS } from "../../content/lab/raisable/waiting";
import { DiagnosticLabSession } from "../sim/labSession";
import ReferenceMonitor, { QCA_SEGMENTS, lesionsInSegment, offersQcaReport, qcaScene, qcaSegmentForeshortening, qcaTruthFor, sendQcaReport } from "./ReferenceMonitor";
import { QcaPanel, foreshorteningWarning, segmentGroups, type QcaApi, type QcaReportHost } from "./QcaTool";
import { analyseSegment, clearQcaReports, qcaReportsFor, synthFrame, type QcaResult } from "../../simulation/imaging/qca";
import { projectedStenosis } from "../../render/xray/coronaryTree";
import { check as qcaCheck, qcaGaps } from "../../mentor/debriefChecks/qca";
import { DEBRIEF_CHECKS } from "../../mentor/debriefChecks/index";
import { runDebriefChecks, type DebriefInput } from "../../mentor/debrief";
import { emptyFrame, ProcedureRecorder } from "../../mentor/telemetry";
import { SEGMENT_NAMES } from "../../mentor/coverage";
import { PRACTICE_INDEX } from "../content/practiceIndex";
import { buildKnownLaunch, validateLaunchLinks, type LaunchFiles } from "../../content/validateLaunch";
import { TRACKS, PUBLISHED_CASES } from "../../content";
import { launch as qcaLaunch } from "../../content/practice/diag-qca-measurement.launch";
import type { CArm } from "../../types";

const g = () => useSimulatorStore.getState();
afterEach(() => {
  g().setPedalImaging(false);
  useSeriesStore.getState().clear();
  clearQcaReports();
});

/** Seat the catheter in the left coronary and film a diagnostic run there: the views phase. */
function filmedLeft(s: DiagnosticLabSession) {
  useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "selective-lm", target: "left", isSelective: true } });
  useSimulatorStore.setState({ bolus: { filled: ["LM", "LAD"], plume: "none", side: "left", phase: 0.5, duration: 60, progress: 1, intensity: 1, peak: 1, diagnostic: true, filmed: true, counted: true, labEnded: true } });
  s.step(0.01);
  useSimulatorStore.setState({ bolus: null, engagement: { ...g().engagement, kind: "selective-lm", target: "left", isSelective: true } });
}

/** A stored cine run of the current case in a view, whose frame holds an image (a dark tube on grey). */
function storeRun(number: number, cArm: CArm): StoredSeries {
  const f = synthFrame(64, 64, [{ pts: [{ x: 4, y: 32 }, { x: 60, y: 34 }], diamPx: 8, mu: 0.07 }], { blurPx: 0.8, noise: 2, seed: number });
  const run: StoredSeries = {
    id: `qca-run-${number}`,
    number,
    kind: "cine",
    caseId: g().caseData.id,
    startedAt: number * 10,
    fps: 15,
    w: 64,
    h: 64,
    frames: [f.data as Uint8Array],
    cArm,
    cArmEnd: cArm,
    fieldCm: 20,
    mmPerPxIso: 0.3,
    durationS: 3,
    karMGy: 1,
    kapGyCm2: 1,
    contrastMl: 6,
    injected: true,
    catheterId: g().catheterId,
  };
  useSeriesStore.getState().add(run);
  return run;
}

/** The views of the search grid, and the lesion's segment and its truth in each. */
function viewsOf(segment: string) {
  const scene = qcaScene(g().model, g().caseData);
  const out: { cArm: CArm; pct: number; fore: number }[] = [];
  for (let lao = -90; lao <= 90; lao += 15)
    for (const cc of [-30, -15, 0, 15, 30]) {
      const cArm = { laoRao: lao, cranialCaudal: cc };
      const v = projectedStenosis(scene.tree, scene.model, 0, cArm);
      const f = qcaSegmentForeshortening(scene, segment, cArm);
      if (v && f !== undefined) out.push({ cArm, pct: v.pctDS, fore: f });
    }
  return { scene, out };
}

/** A QCA result with given numbers (the learner's own measurement). */
const result = (dsAvgPct: number): QcaResult => {
  const f = synthFrame(80, 40, [{ pts: [{ x: 4, y: 20 }, { x: 76, y: 20 }], diamPx: 10, mu: 0.06 }], { blurPx: 0.8, noise: 1, seed: 2 });
  const r = analyseSegment(f, [{ x: 10, y: 20 }, { x: 70, y: 20 }], 0.3)!;
  return { ...r, dsAvgPct };
};

describe("tips with QCA on the reference monitor", () => {
  // Partly met: the plan's 'using QCA on the reference monitor sets phase views' needs a session flag read by
  // diagnosticPhase (src/ui/lab/diagnosticContext.ts, src/ui/sim/labSession.ts), outside this package. Here the
  // phase comes from the filmed left run, and the test checks that QCA is offered on that run's stored frame and
  // that both tips are raised in the views phase.
  it("in scenario diag-eccentric-orthogonal, after filming the left coronary (phase 'views') the reference monitor offers QCA on the stored run, and tipsFor(ctx, 20) includes diag-interp-orthogonal-worst-view and, through alsoIn, pci-interp-qca-calibrate", () => {
    const c = scenarioCase("diag-eccentric-orthogonal")!;
    g().loadCase(c, "free");
    expect(g().caseData.scenarioId).toBe("diag-eccentric-orthogonal");
    const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
    try {
      s.setTimeOutDone(true);
      s.step(0.1);
      filmedLeft(s);
      const run = storeRun(1, { laoRao: -30, cranialCaudal: 0 });
      useSeriesStore.getState().select(run.id);
      // the reference monitor offers QCA on this stored frame (it holds an image)
      const html = renderToString(createElement(ReferenceMonitor, { qca: "after-estimate" }));
      const qcaButton = html.match(/<button[^>]*title="Measure this frame[^"]*"[^>]*>QCA<\/button>/)?.[0] ?? "";
      expect(qcaButton).not.toBe("");
      expect(qcaButton).not.toContain("disabled");
      const ctx = s.tipContext();
      expect(ctx.phase).toBe("views");
      const ids = tipsFor(ctx, 20).map((t) => t.id);
      expect(ids).toContain("diag-interp-orthogonal-worst-view");
      expect(ids).toContain("pci-interp-qca-calibrate");
    } finally {
      s.dispose();
    }
  });

  it("no waiting.ts entry names diag-qca-measurement (so none is left unsatisfiable by it)", () => {
    expect(WAITING_TIPS.filter((w) => w.raisedBy === "diag-qca-measurement")).toEqual([]);
    expect(DEFERRED_RETARGETS.filter((d) => d.raisedBy === "diag-qca-measurement")).toEqual([]);
  });
});

describe("the QCA result panel in the diagnostic lab", () => {
  const api = (r: QcaResult) =>
    ({
      s: { step: "result", estimatePct: "", french: 6, calMarks: [], cal: { mmPerPx: 0.3, widthPx: 6.7, sdPx: 0.1, n: 20, french: 6 }, segMarks: [], result: r, error: "" },
      set: () => undefined,
      reset: () => undefined,
    }) as unknown as QcaApi;
  const host = (o: Partial<QcaReportHost> = {}): QcaReportHost => ({ segments: QCA_SEGMENTS, runLabel: "Run 2, RAO 30  CRA 0", onReport: () => undefined, ...o });
  const frame = { w: 4, h: 4, data: new Uint8Array(16) };

  it("shows both references, their average, the one-ended stenoses, the derived area stenosis, the length normal to normal and 'Report this measurement'", () => {
    const r = result(55);
    const html = renderToString(createElement(QcaPanel, { api: api(r), frame, onClose: () => undefined, report: host() })).replace(/<!-- -->/g, "");
    for (const s of ["Proximal reference", "Distal reference", "Average reference", "One-ended reference", "Area stenosis", "derived, circular lumen", "Length, normal to normal", "Report this measurement", "Segment measured", "Run 2, RAO 30  CRA 0", "Your measurement"])
      expect(html, s).toContain(s);
    expect(html).toContain(`${r.refAvgMm.toFixed(2)} mm`);
    // no segment named yet: nothing to report, and no foreshortening warning
    expect(html).toMatch(/disabled=""[^>]*>Report this measurement/);
    expect(html).not.toContain("data-qca-foreshortened");
  });

  it("'Report this measurement' is offered only to the diagnostic host, decided by the props passed, not their values (the PCI lab passes onQcaRecord undefined once its case is finished)", () => {
    // the hosts as they render the monitor (Simulator.tsx; PciLab.tsx before and after the case is finished)
    const diag = createElement(ReferenceMonitor, { qca: "after-estimate" }).props;
    const pciLive = createElement(ReferenceMonitor, { qca: "after-estimate", qcaFrench: 6, onQcaRecord: () => undefined, qcaHint: null }).props;
    const pciFinished = createElement(ReferenceMonitor, { qca: "after-estimate", qcaFrench: 6, onQcaRecord: undefined, qcaHint: null }).props;
    expect(offersQcaReport(diag)).toBe(true);
    expect(offersQcaReport(pciLive)).toBe(false);
    expect(offersQcaReport(pciFinished)).toBe(false);
    expect(offersQcaReport({ qca: "after-estimate", onQcaRecord: undefined })).toBe(false);
    expect(offersQcaReport({ qca: "after-estimate", enhance: true })).toBe(false);
    // an explicit choice wins
    expect(offersQcaReport({ qca: "after-estimate", onQcaRecord: undefined, qcaReport: true })).toBe(true);
    expect(offersQcaReport({ qca: "after-estimate", qcaReport: false })).toBe(false);
    // the finished PCI host's monitor renders without the diagnostic panel or the report action
    const html = renderToString(createElement(ReferenceMonitor, { qca: "after-estimate", onQcaRecord: undefined }));
    expect(html).not.toContain("Report this measurement");
    expect(html).not.toContain('data-qca-result="diagnostic"');
  });

  it("the report action sits above the numbers, so it is in sight in the monitor's short pane", () => {
    const html = renderToString(createElement(QcaPanel, { api: api(result(55)), frame, onClose: () => undefined, report: host() }));
    expect(html.indexOf("data-qca-report")).toBeGreaterThan(-1);
    expect(html.indexOf("data-qca-report")).toBeLessThan(html.indexOf('data-qca-result="diagnostic"'));
    expect(html).toContain("Record this measurement for the debrief");
  });

  it("without the diagnostic host the result is the earlier one (the PCI lab)", () => {
    const html = renderToString(createElement(QcaPanel, { api: api(result(55)), frame, onClose: () => undefined }));
    expect(html).toContain("Diameter stenosis");
    expect(html).not.toContain("Average reference");
    expect(html).not.toContain("Report this measurement");
  });

  it("the segment select lists every SYNTAX segment once, grouped by vessel (left main, LAD, circumflex, RCA) with each sub-branch beside its parent", () => {
    const labels = QCA_SEGMENTS.map((x) => x.label);
    expect([...labels].sort()).toEqual(Object.keys(SEGMENT_NAMES).sort());
    expect(new Set(labels).size).toBe(labels.length);
    expect(segmentGroups(QCA_SEGMENTS).map((x) => x.group)).toEqual(["Left main", "LAD", "Circumflex", "RCA"]);
    expect(labels.indexOf("9a")).toBe(labels.indexOf("9") + 1);
    expect(labels.indexOf("12a")).toBeGreaterThan(labels.indexOf("12"));
    expect(labels.indexOf("12a")).toBeLessThan(labels.indexOf("13"));
    expect(labels.indexOf("14b")).toBeLessThan(labels.indexOf("15"));
    const html = renderToString(createElement(QcaPanel, { api: api(result(55)), frame, onClose: () => undefined, report: host() })).replace(/<!-- -->/g, "");
    const order = ["Left main", "LAD", "Circumflex", "RCA"].map((gr) => html.indexOf(`<optgroup label="${gr}"`));
    expect(order.every((i) => i > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html.indexOf(">9a first diagonal a<")).toBeLessThan(html.indexOf('<optgroup label="Circumflex"'));
  });

  it("the foreshortening warning (a guided teaching aid) words a frame below the threshold and nothing above it", () => {
    expect(foreshorteningWarning("7", 0.6)).toContain("60%");
    expect(foreshorteningWarning("7", 0.6)).toContain("shorter and tighter");
    expect(foreshorteningWarning("7", 0.95)).toBeNull();
    expect(foreshorteningWarning("7", undefined)).toBeNull();
  });
});

describe("the report and the debrief (diag-eccentric-orthogonal)", () => {
  it("a report from the milder view is judged against the model in that view, and the debrief names the worse, least foreshortened view; the worse view within 5 points passes", () => {
    const c = scenarioCase("diag-eccentric-orthogonal")!;
    g().loadCase(c, "free");
    const scene = qcaScene(g().model, g().caseData);
    // the cache returns the same scene for the same case
    expect(qcaScene(g().model, g().caseData)).toBe(scene);
    const all = QCA_SEGMENTS.map((x) => x.label).filter((l) => lesionsInSegment(scene, l).includes(0));
    expect(all.length).toBe(1);
    const segment = all[0];
    const { out } = viewsOf(segment);
    const adequate = out.filter((v) => v.fore >= 0.8);
    expect(adequate.length).toBeGreaterThan(1);
    const worse = adequate.reduce((a, b) => (b.pct > a.pct ? b : a));
    const milder = adequate.reduce((a, b) => (b.pct < a.pct ? b : a));
    expect(worse.pct - milder.pct).toBeGreaterThan(10);
    const fore = out.filter((v) => v.fore < 0.8).sort((a, b) => a.fore - b.fore)[0];
    expect(fore).toBeDefined();

    // three stored runs: the milder view (1), the worse view (2) and a foreshortened one (3)
    const runs = [
      { number: 1, cArm: milder.cArm },
      { number: 2, cArm: worse.cArm },
      { number: 3, cArm: fore.cArm },
    ];
    const truth = qcaTruthFor(scene, segment, milder.cArm, runs);
    expect(truth.lesionIndex).toBe(0);
    expect(truth.pctDS).toBeCloseTo(milder.pct, 6);
    expect(truth.byRun.map((v) => v.run)).toEqual([1, 2, 3]);

    const startedAt = Date.now() - 1000;
    const meta = { id: "r", startedAt, caseId: g().caseData.id, lab: "diagnostic" as const, mode: "supervised" as const, entrustment: 2 as const, seed: "1" };
    const input = { record: { meta } } as unknown as DebriefInput;

    // the milder view, measured within the tolerance of the model's value there
    const rep1 = sendQcaReport({ scene, result: result(milder.pct + 2), segment, run: runs[0], runs, tWall: 30 });
    expect(rep1.foreshortened).toBe(false);
    expect(qcaReportsFor(g().caseData.id, startedAt)).toHaveLength(1);
    const gaps1 = qcaCheck(input);
    const milderGap = gaps1.find((x) => x.id.startsWith("qca-milder-view"))!;
    expect(milderGap).toBeDefined();
    expect(milderGap.teaching).toContain("run 2");
    expect(milderGap.lessonId).toBe("pm-interpreting-stenosis");
    expect(gaps1.some((x) => x.id.startsWith("qca-accuracy"))).toBe(false);

    // the foreshortened view is flagged
    const rep3 = sendQcaReport({ scene, result: result(fore.pct), segment, run: runs[2], runs, tWall: 40 });
    expect(rep3.foreshortened).toBe(true);
    expect(rep3.foreshortening).toBeLessThan(0.8);
    const gaps3 = qcaCheck(input);
    expect(gaps3.some((x) => x.id.startsWith("qca-foreshortened"))).toBe(true);
    expect(gaps3.find((x) => x.id.startsWith("qca-foreshortened"))!.teaching).toContain("run 2");

    // the worse view within 5 points: no gap (two adequate views were stored)
    sendQcaReport({ scene, result: result(worse.pct - 3), segment, run: runs[1], runs, tWall: 50 });
    expect(qcaCheck(input)).toEqual([]);

    // 7 points off in the worse view: the accuracy gap gives the model's value only now, in the debrief
    sendQcaReport({ scene, result: result(worse.pct + 7), segment, run: runs[1], runs, tWall: 60 });
    const acc = qcaCheck(input).find((x) => x.id.startsWith("qca-accuracy"))!;
    expect(acc).toBeDefined();
    expect(acc.teaching).toContain(`${Math.round(worse.pct)}%`);
    // every gap kind met here has a directive of its own, distinct from its teaching
    for (const x of [...gaps1, ...gaps3, acc]) {
      expect(x.directive, x.id).toBeTruthy();
      expect(x.directive, x.id).not.toBe(x.teaching);
    }

    // another lab's record, or an earlier session, sees none of these reports
    expect(qcaCheck({ record: { meta: { ...meta, lab: "pci" } } } as unknown as DebriefInput)).toEqual([]);
    expect(qcaCheck({ record: { meta: { ...meta, startedAt: Date.now() + 1000 } } } as unknown as DebriefInput)).toEqual([]);
    // a record that ended before these reports (debriefed again after a later session of the case) sees none of them
    expect(qcaCheck({ record: { meta, endedAt: startedAt + 1 } } as unknown as DebriefInput)).toEqual([]);
    expect(qcaCheck({ record: { meta, endedAt: Date.now() + 1000 } } as unknown as DebriefInput).length).toBeGreaterThan(0);
  });

  it("is a registered debrief check, and its gaps reach the debrief through the registry", () => {
    expect(DEBRIEF_CHECKS.some((x) => x.id === "qca")).toBe(true);
    const c = scenarioCase("diag-eccentric-orthogonal")!;
    g().loadCase(c, "free");
    const scene = qcaScene(g().model, g().caseData);
    const segment = QCA_SEGMENTS.map((x) => x.label).find((l) => lesionsInSegment(scene, l).includes(0))!;
    const run = { number: 1, cArm: { laoRao: -30, cranialCaudal: 0 } };
    const startedAt = Date.now() - 1000;
    sendQcaReport({ scene, result: result(10), segment, run, runs: [run], tWall: 12 });
    const rec = new ProcedureRecorder({ id: "rec", startedAt, caseId: g().caseData.id, lab: "diagnostic", mode: "supervised", entrustment: 2, seed: "s1" });
    for (let i = 1; i <= 20; i++) rec.sample({ ...emptyFrame(), tWall: i * 0.1, step: i }, true);
    const { gaps, errors } = runDebriefChecks({ record: rec.toRecord() } as unknown as DebriefInput);
    expect(errors).toEqual([]);
    const mine = gaps.filter((x) => x.check === "qca");
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((x) => x.lessonId === "pm-interpreting-stenosis")).toBe(true);
    // each gap carries its own short directive, so the debrief card does not print the teaching twice
    for (const x of mine) {
      expect(x.strategy, x.id).toBe("directive");
      expect(x.directive, x.id).toBeTruthy();
      expect(x.directive, x.id).not.toBe(x.teaching);
    }
    // pure form: no reports, no gaps
    expect(qcaGaps([])).toEqual([]);
  });
});

describe("practice links (src/content/practice/diag-qca-measurement.launch.ts)", () => {
  it("validate against every .launch.ts, and the practice index lists diag-eccentric-orthogonal, diag-tapering-reference and diag-lesion-at-branch under pm-interpreting-stenosis from this file", () => {
    const files = import.meta.glob<LaunchFiles[string]>(["/src/**/*.launch.ts", "!/src/**/__fixtures__/**"], { eager: true });
    // this file's links are valid (problems of files other packages are editing are theirs)
    expect(validateLaunchLinks({ tracks: TRACKS, cases: PUBLISHED_CASES }, buildKnownLaunch(files)).filter((p) => p.includes("diag-qca-measurement"))).toEqual([]);
    expect((qcaLaunch.links ?? []).map((l) => l.scenario)).toEqual(["diag-eccentric-orthogonal", "diag-tapering-reference", "diag-lesion-at-branch"]);
    const listed = (PRACTICE_INDEX.byLesson.get("pm-interpreting-stenosis") ?? []).filter((e) => e.sim === "cathlab" && e.source.endsWith("diag-qca-measurement.launch.ts"));
    expect(listed.map((e) => e.scenario)).toEqual(["diag-eccentric-orthogonal", "diag-tapering-reference", "diag-lesion-at-branch"]);
    for (const e of listed) {
      expect(e.mode).toBe("supervised");
      expect(e.params).toEqual({ scenario: e.scenario, mode: "supervised" });
    }
  });
});
