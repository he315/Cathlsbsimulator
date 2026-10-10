// repair-diag-host-wiring: what run 3's packages built, wired into the live diagnostic lab.
//   (1) the table strip shows the drug syringe, the gauze and a working side-arm stopcock
//   (2) the Back table tab removes the catheter under suction (and aspirates the side arm)
//   (3) the hub's aspirate goes through the session (its judgement, hazards and record)
//   (4) the lab's raises include the pressure system's events; a wedged trace reads damped for tips
//   (5) the finished case's assessment carries the submitted study report into buildDebrief
//   (6) the reference monitor's run header wraps, and truncates in a narrow image area
//   (7) rateText keeps two decimals (3.75 p/s)
//   npx vitest run src/ui/lab/diagHostWiring.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { useSeriesStore } from "../../state/useSeriesStore";
import { useProgressStore } from "../../state/useProgressStore";
import { CASE_LIBRARY, scenarioCase } from "../../simulation/caseGenerator";
import { DiagnosticLabSession, PRESSURE_SESSION_EVENTS } from "../sim/labSession";
import { TableStrip, provideSuctionControls, tableStripExtras } from "../sim/Simulator";
import CatheterHub, { aspirateFromHub } from "../sim/CatheterHub";
import TableSideControls from "./TableSideControls";
import ReferenceMonitor, { RUN_HEADER_NARROW_PX } from "./ReferenceMonitor";
import { DIAGNOSTIC_PRESSURE_EVENTS, IDLE_SESSION_VIEW, PRESSURE_EVENTS_COMPLETE, diagnosticContext, raises, shownPressure, tipPressure, type DiagnosticStoreSlice } from "./diagnosticContext";
import { assessFinishedCase } from "./useAttending";
import { withStudyReport } from "./StudyReport";
import { rateText } from "./useLab";
import { tipScore, type LabTip } from "../../content/lab/tips";
import { DRUGS_MODULE_ID, type DrugOrders } from "../sim/modules/drugs";
import { ProcedureRecorder, emptyFrame } from "../../mentor/telemetry";
import { segmentLabelAt, treeSegmentGeometry } from "../../mentor/treeSegments";
import { compareStudyReport, emptyStudyReport, studyTruth, type StudyReport as Report } from "../../mentor/report";
import type { AnatomyCase } from "../../types";

const g = () => useSimulatorStore.getState();
// server rendering reads a store's initial state unless it has getServerState: render the live state instead
for (const st of [useSimulatorStore, useSeriesStore, useProgressStore]) (st as unknown as { getServerState: () => unknown }).getServerState = () => st.getState();
/** React escapes text in server output; compare against the escaped form. */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const routine = CASE_LIBRARY[0];

const open: DiagnosticLabSession[] = [];
function sessionFor(c: AnatomyCase): DiagnosticLabSession {
  useProgressStore.setState({ activePolicy: null });
  g().loadCase(c, "free");
  const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, physics: false });
  open.push(s);
  return s;
}
afterEach(() => {
  while (open.length) open.pop()!.dispose();
  g().setPedalImaging(false);
});
const strip = (s: DiagnosticLabSession) => renderToString(createElement(TableStrip, { session: s })).replace(/<!-- -->/g, "");
const drugsOf = (s: DiagnosticLabSession) => s.modules.find((m) => m.id === DRUGS_MODULE_ID) as DrugOrders;

describe("(1) the table strip: the drug syringe, the gauze and the side arm", () => {
  it("shows the drug syringe once a drug is drawn up (the drugs capability's tableSyringe), and none before", () => {
    const s = sessionFor(routine);
    expect(s.capability("drugs")).not.toBeNull();
    expect(tableStripExtras(s).drug).toBeNull();
    expect(strip(s)).not.toContain("syringe on the manifold");
    expect(drugsOf(s).order({ entryId: "gtn", dose: 100, via: "manifold" }).ok).toBe(true);
    const drug = tableStripExtras(s).drug;
    expect(drug).toMatchObject({ via: "manifold", given: false });
    expect(drug).toEqual(s.capability("drugs")!.tableSyringe());
    const html = strip(s);
    expect(html).toContain(esc(`${drug!.label}: syringe on the manifold`));
    expect(html).toContain(esc(drug!.label));
    // given: the strip shows it emptied
    expect(drugsOf(s).give().ok).toBe(true);
    expect(tableStripExtras(s).drug).toMatchObject({ given: true });
    expect(strip(s)).toContain(esc(`${drug!.label}, given`));
  });

  it("shows a clean gauze and a clickable side arm; the side arm aspirates the sheath through the session and the gauze shows what came back", () => {
    const s = sessionFor(scenarioCase("diag-aspiration-failures")!);
    expect(s.sheathThrombus).toBe(true);
    let html = strip(s);
    expect(html).toContain('aria-label="Aspirate the sheath side arm"');
    expect(html).toContain('aria-label="Gauze: clean"');
    const x = tableStripExtras(s);
    expect(x.gauze).toBeNull();
    x.onSideArm();
    expect(g().lastAspiration).toMatchObject({ from: "sheath", material: "thrombus" });
    expect(s.sheathThrombus).toBe(false);
    expect(tableStripExtras(s).gauze).toMatchObject({ from: "sheath", material: "thrombus" });
    html = strip(s);
    expect(html).toContain('aria-label="Gauze: blood with a dark clot"');
  });
});

describe("(2) the Back table tab: remove under suction", () => {
  const renderTable = (s: DiagnosticLabSession) => renderToString(createElement(TableSideControls, { session: s, input: null, initialTab: "table" })).replace(/<!-- -->/g, "");

  it("offers the controls only where the lab provides the suction capability (the shell provides it for every diagnostic session)", () => {
    const s = sessionFor(routine);
    expect(s.capability("suction")).toBeNull();
    expect(renderTable(s)).not.toContain("Remove under suction");
    provideSuctionControls(s);
    const html = renderTable(s);
    expect(html).toContain("Remove under suction");
    expect(html).toContain("Aspirate side arm");
    expect(html).toContain("data-suction");
  });

  it("the tab's Remove under suction runs the session's removeUnderSuction: the plug comes out on the gauze and a fresh catheter is brought in", () => {
    const s = sessionFor(scenarioCase("diag-aspiration-failures")!);
    provideSuctionControls(s);
    const suction = s.capability("suction")!;
    // the side arm first, so the fresh catheter does not pick up the sheath's thrombus
    suction.aspirateSheath();
    expect(g().lastAspiration).toMatchObject({ from: "sheath", material: "thrombus" });
    expect(s.plugged).toBe(true);
    const changes = g().score.catheterChanges;
    suction.removeUnderSuction();
    expect(g().lastAspiration).toMatchObject({ outcome: "plug", material: "thrombus", from: "catheter", via: "suction-removal" });
    expect(s.plugged).toBe(false);
    expect(g().score.catheterChanges).toBe(changes + 1);
    expect(g().events.some((e) => /removed under suction/i.test(e.message))).toBe(true);
  });
});

describe("(3) the catheter hub's aspirate goes through the session", () => {
  it("against a plugged catheter the session judges it, raises its hazards and records the outcome", () => {
    const s = sessionFor(scenarioCase("diag-aspiration-failures")!);
    expect(s.plugged).toBe(true);
    aspirateFromHub(s);
    expect(g().lastAspiration).toMatchObject({ outcome: "plug", from: "catheter" });
    expect(g().aspirated).toBe("no-return");
    expect(s.activeEvents()).toEqual(expect.arrayContaining(["aspiration-failed", "catheter-plugged"]));
  });

  it("the store's legacy aspirate does not know the plug (why the hub must use the session)", () => {
    const s = sessionFor(scenarioCase("diag-aspiration-failures")!);
    aspirateFromHub(null);
    expect(s.activeEvents()).not.toContain("catheter-plugged");
  });

  it("with a session the hub's aspirate calls the session's aspirate, not the store's bare one", () => {
    const s = sessionFor(scenarioCase("diag-aspiration-failures")!);
    const viaSession = vi.spyOn(s, "aspirate");
    const legacy = vi.fn();
    const storeAspirate = g().aspirate;
    useSimulatorStore.setState({ aspirate: legacy });
    try {
      aspirateFromHub(s);
    } finally {
      useSimulatorStore.setState({ aspirate: storeAspirate });
    }
    expect(viaSession).toHaveBeenCalledTimes(1);
    // the store is reached only through the session, carrying the session's judged outcome (never the bare legacy call)
    expect(legacy.mock.calls.length).toBeGreaterThan(0);
    for (const call of legacy.mock.calls) expect(call[0]).toMatchObject({ outcome: "plug", from: "catheter" });
    viaSession.mockRestore();
    // the hub still renders with a session passed
    expect(renderToString(createElement(CatheterHub, { session: s }))).toContain("aspirate");
  });
});

describe("(4) the diagnostic lab's raises and the pressure the tips read", () => {
  it("raises every event of the session's PRESSURE_SESSION_EVENTS (transducer-fault, aspiration-failed, catheter-plugged, contrast-hold-up, neuro-deficit and the rest)", () => {
    expect(PRESSURE_EVENTS_COMPLETE).toBe(true);
    expect([...DIAGNOSTIC_PRESSURE_EVENTS]).toEqual([...PRESSURE_SESSION_EVENTS]);
    for (const e of PRESSURE_SESSION_EVENTS) expect(raises.events, e).toContain(e);
    for (const e of ["transducer-fault", "aspiration-failed", "catheter-plugged", "contrast-hold-up", "neuro-deficit"] as const) expect(raises.events).toContain(e);
    // no duplicates
    expect(new Set(raises.events).size).toBe(raises.events.length);
  });

  it("a wedged trace reads 'damped' in the context, so a tip filtered on a damped pressure matches it", () => {
    const store = (kind: "wedged" | "damped" | "aortic" | "ventricularised"): DiagnosticStoreSlice => ({
      engagement: { kind: "selective-rca", target: "right", isSelective: true, isDeep: false, conus: false, quality: 0.9 },
      pressure: { kind },
      catheterId: "JR4",
      caseData: { accessRoute: "femoral", variants: [], rootSize: "normal" },
      finished: false,
    });
    const ctx = (kind: Parameters<typeof store>[0]) => diagnosticContext({ store: store(kind), session: IDLE_SESSION_VIEW });
    expect(tipPressure("wedged")).toBe("damped");
    expect(ctx("wedged").pressure).toBe("damped");
    expect(ctx("wedged").events).toContain("pressure-damped");
    expect(ctx("damped").pressure).toBe("damped");
    expect(ctx("aortic").pressure).toBe("aortic");
    expect(ctx("ventricularised").pressure).toBe("ventricularised");
    const tip: LabTip = { id: "diag-test-damped", lab: "diagnostic", when: { pressure: ["damped"] }, title: "t", text: "t", tone: "caution", lessonId: "x", sources: [] };
    expect(tipScore(tip, ctx("wedged"))).not.toBeNull();
    expect(tipScore(tip, ctx("aortic"))).toBeNull();
  });

  it("a trace the session damps itself (a plugged catheter) reads 'damped' though the store's class follows the free tip", () => {
    const s = sessionFor(scenarioCase("diag-aspiration-failures")!);
    expect(s.plugged).toBe(true);
    for (let t = 0; t < 2; t += 0.05) s.step(0.05);
    const ctx = s.tipContext();
    expect(g().pressure.kind).not.toBe("damped");
    expect(g().pressure.kind).not.toBe("wedged");
    expect(ctx.events).toContain("pressure-damped");
    expect(ctx.pressure).toBe("damped");
    const tip: LabTip = { id: "diag-test-damped", lab: "diagnostic", when: { pressure: ["damped"] }, title: "t", text: "t", tone: "caution", lessonId: "x", sources: [] };
    expect(tipScore(tip, ctx)).not.toBeNull();
    // the same store pressure without the session's damping keeps its own class
    expect(shownPressure([], "aortic")).toBe("aortic");
    expect(shownPressure(["pressure-damped"], "aortic")).toBe("damped");
  });
});

describe("(5) the finished case's assessment carries the submitted study report", () => {
  it("assessFinishedCase passes the store's studyReport comparison to assessAttempt: the debrief has the report and its gap, and the old bridge adds nothing", () => {
    const LM = { vessel: "LM" as const, position: 0.5, severity: 70, kind: "severe-stenosis" as const };
    const c: AnatomyCase = { ...routine, lesions: [LM] };
    const s = sessionFor(c);
    g().beginFinish();
    const base = emptyStudyReport();
    const draft: Report = {
      ...base,
      dominance: c.dominance,
      territories: {
        anterior: { kind: "native", artery: "LAD", injection: "left" },
        septal: { kind: "native", artery: "LAD", injection: "left" },
        apical: { kind: "native", artery: "LAD", injection: "left" },
        inferior: { kind: "native", artery: "RCA", injection: "right" },
        lateral: { kind: "native", artery: "LCx", injection: "left" },
      },
      decision: "adhoc",
      target: { vessel: "LM", segment: "LM", qcaPct: 72, lengthMm: 6 },
    };
    const truth = studyTruth({ caseData: g().caseData, regions: s.engine.flow.regions, segmentOf: (v, p) => segmentLabelAt(s.tree, v, p) });
    const comparison = compareStudyReport(draft, truth, 42);
    expect(comparison.study!.adhocAgainstReasons).toBe(true);
    g().submitStudyReport({ report: draft, comparison, pciTarget: { vessel: "LM", segment: "LM", qcaPct: 72, lengthMm: 6, lesionId: "LM@0.500", strategy: "adhoc" }, submittedAt: 42 });
    expect(g().finished).toBe(true);

    const rec = new ProcedureRecorder({ id: "rec", startedAt: 0, caseId: c.id, lab: "diagnostic", mode: "supervised", entrustment: 2, seed: "s1" });
    for (let i = 1; i <= 20; i++) rec.sample({ ...emptyFrame(), tWall: i * 0.1, step: i }, true);
    const geometry = treeSegmentGeometry(s.tree);
    const a = assessFinishedCase(rec.toRecord(), { c, model: g().model, geometry, focus: "both" });
    expect(a.debrief.report).toBe(g().studyReport!.comparison);
    expect(a.debrief.report?.study?.decision).toBe("adhoc");
    const gap = a.debrief.analysis.gaps.find((x) => x.id === "report-adhoc-deferral");
    expect(gap?.check).toBe("study-report");
    // Simulator.tsx's former withStudyReport bridge is a no-op on this debrief (so it was removed)
    expect(withStudyReport(a.debrief, comparison)).toBe(a.debrief);
    // and past its early return, the bridge would add no gap buildDebrief has not already chosen
    const bridged = withStudyReport({ ...a.debrief, report: undefined }, comparison);
    expect(new Set(bridged.analysis.gaps.map((x) => x.id))).toEqual(new Set(a.debrief.analysis.gaps.map((x) => x.id)));

    // with no report submitted (a new case) the debrief has none
    g().loadCase(routine, "free");
    expect(g().studyReport).toBeNull();
    const b = assessFinishedCase(rec.toRecord(), { c: routine, model: g().model, geometry, focus: "both" });
    expect(b.debrief.report).toBeUndefined();
  });
});

describe("(6) the reference monitor's run header", () => {
  it("is one wrapping row that truncates its lines below RUN_HEADER_NARROW_PX of image width, and the image area clips what is drawn over it", () => {
    const html = renderToString(createElement(ReferenceMonitor, { qca: "off" }));
    const header = html.match(/<div data-run-header="true" class="([^"]*)"/)?.[1] ?? html.match(/data-run-header[^>]*class="([^"]*)"/)?.[1];
    expect(header).toBeTruthy();
    expect(header).toContain("flex-wrap");
    expect(header).toContain(`[@container(max-width:${RUN_HEADER_NARROW_PX - 1}px)]:flex-nowrap`);
    expect(html).toContain("[&amp;&gt;div]:truncate");
    const image = html.match(/<div class="([^"]*)" data-reference-image/)?.[1];
    expect(image).toContain("overflow-hidden");
    expect(image).toContain("[container-type:size]");
  });
});

describe("(7) rateText", () => {
  it("shows 3.75 as '3.75', 7.5 as '7.5' and whole rates as integers", () => {
    expect(rateText(3.75)).toBe("3.75");
    expect(`${rateText(3.75)} p/s`).toBe("3.75 p/s");
    expect(rateText(7.5)).toBe("7.5");
    expect(rateText(15)).toBe("15");
    expect(rateText(30)).toBe("30");
  });
});
