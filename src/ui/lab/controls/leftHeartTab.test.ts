// The Left heart tab (diag-lv-aorta-task): registered for the diagnostic lab, shown while the left heart
// is in play (not on a coronary study's strip), and rendering its controls and the reader without
// saying where the tip is outside a guided aid.
//   npx vitest run src/ui/lab/controls/leftHeartTab.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useSimulatorStore } from "../../../state/useSimulatorStore";
import { useProgressStore } from "../../../state/useProgressStore";
import { CASE_LIBRARY, scenarioCase } from "../../../simulation/caseGenerator";
import { DiagnosticLabSession } from "../../sim/labSession";
import TableSideControls from "../TableSideControls";
import { CONTROL_TABS } from "./registry";
import { leftHeartOf, type LeftHeartControl } from "../../sim/modules/leftHeart";
import LvGramReader from "../LvGramReader";

const g = () => useSimulatorStore.getState();
let session: DiagnosticLabSession | null = null;
afterEach(() => {
  session?.dispose();
  session = null;
});
const open = (c: Parameters<ReturnType<typeof g>["loadCase"]>[0]) => {
  useProgressStore.setState({ activePolicy: null });
  g().loadCase(c, "free");
  session = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
  return session;
};
const render = (s: DiagnosticLabSession, initialTab?: string) => renderToString(createElement(TableSideControls, { session: s, input: null, ...(initialTab ? { initialTab } : {}) })).replace(/<!-- -->/g, "");
const strip = (html: string) => [...html.matchAll(/role="tab"[^>]*>([^<]*)<\/button>/g)].map((m) => m[1]);

describe("the Left heart tab", () => {
  it("is registered for the diagnostic lab only, and hidden on a coronary study", () => {
    const t = CONTROL_TABS.find((x) => x.id === "left-heart");
    expect(t).toBeDefined();
    expect(t!.labs).toEqual(["diagnostic"]);
    const s = open(CASE_LIBRARY[0]);
    expect(strip(render(s))).not.toContain("Left heart");
  });

  it("shows in a left heart scenario and renders the task, the pressure, the injector, the catheter moves, the management and the reader", () => {
    const s = open(scenarioCase("diag-lv-gram-task")!);
    expect(strip(render(s))).toContain("Left heart");
    const html = render(s, "left-heart");
    for (const k of ["Ventriculogram", "Aortogram", "Record LVEDP", "Record pullback", "Air check and connect", "Arm", "Hand test injection, 10 mL", "Rotate gently and withdraw", "Above the bifurcation", "Pericardiocentesis", "High-flow oxygen", "Read the run"]) expect(html, k).toContain(k);
    for (const p of ["Ventriculogram 35 mL at 12 mL/s", "Reduced 30 mL at 10 mL/s", "Aortogram 50 mL at 20 mL/s"]) expect(html, p).toContain(p);
    // where the tip sits is not on the screen outside a guided aid
    if (!g().policy.visibility.stateChips) expect(html).not.toMatch(/Tip: (Mid-cavity|Apex|Against the wall|Papillary)/);
  });

  it("the reader renders the end-diastolic and end-systolic outlines of a filmed run and the grading controls", () => {
    const s = open(scenarioCase("diag-lv-gram-task")!);
    const lh = leftHeartOf(s) as LeftHeartControl;
    // a filmed ventriculogram run, as the module records it
    const spec = lh.sceneSpec();
    lh.runs.push({ id: 1, kind: "lv", via: "power", t: 1, position: "mid-cavity", settings: null, volumeMl: 30, view: "rao", cArm: { laoRao: -30, cranialCaudal: 0 }, filmed: true, beats: 3, ectopicBeats: 0, catheterMr: false, catheterAr: false, stainMl: 0, truth: lh.truthNow(), spec });
    const html = renderToString(createElement(LvGramReader, { lh, heart: s.tree.heart }));
    expect(html).toContain("End-diastolic frame outline");
    expect(html).toContain("End-systolic frame outline");
    for (const sg of ["anterior", "apical", "inferior"]) expect(html).toContain(`data-segment="${sg}"`);
    expect(html).not.toContain(`data-segment="septal"`);
    expect(html).toContain("MR grade");
    // nothing compared until a reading is recorded, and then only after the case (or in guided mode)
    expect(html).not.toContain("data-reader-comparison");
  });
});
