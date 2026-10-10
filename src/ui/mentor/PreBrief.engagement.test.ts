// The pre-brief's catheter step and the per-patient record of the catheters that worked
// (diag-engagement-technique-set): the plan step asks for the guide and the French sizes; the stated catheters and
// the catheters of each filmed diagnostic run are kept per patient (progress/logbook.ts) and shown in the chart next
// time.
//   npx vitest run src/ui/mentor/PreBrief.engagement.test.ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import PreBrief, { catheterChoiceAid, startWorkedCatheterRecorder, withWorkedCatheters } from "./PreBrief";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { CASE_LIBRARY, scenarioCase } from "../../simulation/caseGenerator";
import { chartRows, prebriefWithChart } from "../../mentor/prebrief";
import { prebriefForCase } from "../../content/mentor/prebriefs";
import { diagScenarioById } from "../../simulation/diagnosticScenarios";
import {
  WORKED_CATHETERS_KEY,
  WORKED_CATHETERS_MAX,
  patientKey,
  previousCathetersOf,
  readWorkedCatheters,
  recordStatedCatheters,
  recordWorkedCatheter,
  workedCathetersFor,
  workedFromInjections,
  type WorkedStorage,
} from "../../progress/logbook";
import { DiagnosticLabSession } from "../sim/labSession";

class MemStorage implements WorkedStorage {
  m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
}

const g = () => useSimulatorStore.getState();
let mem: MemStorage;
let prev: PropertyDescriptor | undefined;
beforeEach(() => {
  mem = new MemStorage();
  prev = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { value: mem, configurable: true, writable: true });
});
afterEach(() => {
  if (prev) Object.defineProperty(globalThis, "localStorage", prev);
  else delete (globalThis as { localStorage?: unknown }).localStorage;
  g().loadCase(CASE_LIBRARY[0], "free");
});

describe("the per-patient catheter record (progress/logbook.ts)", () => {
  it("keeps the last catheter that gave a diagnostic run of each side and the catheters stated, per patient", () => {
    const id = "scn|diag-catheter-choice-by-root|1";
    expect(patientKey(id)).toBe(id);
    expect(workedCathetersFor(id)).toBeUndefined();
    recordWorkedCatheter(id, "left", "JL4", "femoral", 1);
    recordWorkedCatheter(id, "left", "JL5", "femoral", 2);
    recordWorkedCatheter(id, "right", "AR1", "femoral", 3);
    recordStatedCatheters(id, { access: "femoral", left: "JL4", right: "JR4", french: 5 }, 4);
    const w = workedCathetersFor(id)!;
    expect(w).toMatchObject({ left: "JL5", right: "AR1", route: "femoral", t: 4, stated: { left: "JL4", right: "JR4", french: 5 } });
    expect(previousCathetersOf(w)).toEqual([
      { target: "left", catheterId: "JL5", route: "femoral" },
      { target: "right", catheterId: "AR1", route: "femoral" },
    ]);
    // another seed is another patient
    expect(workedCathetersFor("scn|diag-catheter-choice-by-root|2")).toBeUndefined();
    expect(JSON.parse(mem.getItem(WORKED_CATHETERS_KEY)!)[id].left).toBe("JL5");
  });

  it("is bounded, survives a broken value and does nothing without storage", () => {
    for (let i = 0; i < WORKED_CATHETERS_MAX + 5; i++) recordWorkedCatheter(`p${i}`, "left", "JL4", undefined, i);
    const all = readWorkedCatheters();
    expect(Object.keys(all)).toHaveLength(WORKED_CATHETERS_MAX);
    expect(all.p0).toBeUndefined();
    expect(all[`p${WORKED_CATHETERS_MAX + 4}`]).toBeDefined();
    mem.setItem(WORKED_CATHETERS_KEY, "{not json");
    expect(readWorkedCatheters()).toEqual({});
    expect(recordWorkedCatheter("x", "left", "JL4", undefined, 1, null)).toBeUndefined();
    expect(workedCathetersFor("x", null)).toBeUndefined();
  });

  it("workedFromInjections takes the last selective run of each side", () => {
    expect(
      workedFromInjections([
        { side: "left", outcome: "root-puff", catheterId: "JL4" },
        { side: "left", outcome: "selective-lca", catheterId: "JL4.5" },
        { side: "right", outcome: "deep-reflux", catheterId: "JR4" },
        { side: "right", outcome: "selective-rca", catheterId: "AR1" },
      ])
    ).toEqual({ left: "JL4.5", right: "AR1" });
  });
});

describe("the pre-brief's catheter step", () => {
  it("the diagnostic plan step asks for the left, right and guide catheters and the French sizes; the PCI plan is as it was", () => {
    const c = scenarioCase("diag-catheter-choice-by-root")!;
    g().loadCase(c, "free");
    const prebrief = prebriefWithChart(prebriefForCase(c), c, diagScenarioById("diag-catheter-choice-by-root"));
    const html = renderToString(createElement(PreBrief, { prebrief, lab: "diagnostic", mode: "supervised", catheters: ["JL4", "JL5", "JR4", "AR1", "EBU3.5", "PIG"], views: [], chart: chartRows(c.chart!), onComplete: () => undefined }));
    for (const label of ["Left catheter", "Right catheter", "Diagnostic size", "Guide, if PCI follows", "Guide size"]) expect(html).toContain(label);
    expect(html).toContain("6 Fr");
    // the guide list leaves the pigtail out
    const guideBlock = html.slice(html.indexOf("Guide, if PCI follows"), html.indexOf("Guide size"));
    expect(guideBlock).toContain("EBU3.5");
    expect(guideBlock).not.toContain("PIG");
    const pci = renderToString(createElement(PreBrief, { prebrief, lab: "pci", mode: "supervised", catheters: [], guides: ["EBU3.5"], views: [], onComplete: () => undefined }));
    expect(pci).not.toContain("Diagnostic size");
    expect(pci).toContain("First wire");
  });

  it("the chart shows the catheters that worked at the last study of this patient, beside the chart's own", () => {
    const c = scenarioCase("diag-catheter-choice-by-root")!;
    g().loadCase(c, "free");
    recordWorkedCatheter(c.id, "left", "JL5", "femoral", 1);
    recordWorkedCatheter(c.id, "right", "AR1", "femoral", 2);
    const prebrief = prebriefWithChart(prebriefForCase(c), c, diagScenarioById("diag-catheter-choice-by-root"));
    const html = renderToString(createElement(PreBrief, { prebrief, lab: "diagnostic", mode: "exam", catheters: ["JL4"], views: [], chart: chartRows(c.chart!), onComplete: () => undefined }));
    expect(html).toContain("Catheters that worked before");
    expect(html).toContain("JL5 (left); AR1 (right) via femoral, at the last study here");
    // merged into the chart's own row when it has one
    const rows = withWorkedCatheters([{ id: "catheters", label: "Catheters that worked before", value: "JR4 (graft) via femoral" }], { left: "JL4", t: 1 });
    expect(rows).toEqual([{ id: "catheters", label: "Catheters that worked before", value: "JR4 (graft) via femoral; JL4 (left), at the last study here" }]);
    expect(withWorkedCatheters(undefined, undefined)).toBeUndefined();
    // another patient: nothing added
    const other = scenarioCase("diag-catheter-choice-by-root", "2")!;
    g().loadCase(other, "free");
    const html2 = renderToString(createElement(PreBrief, { prebrief, lab: "diagnostic", mode: "exam", catheters: ["JL4"], views: [], chart: chartRows(other.chart!), onComplete: () => undefined }));
    expect(html2).not.toContain("at the last study here");
  });

  it("the recorder keeps the catheter of each filmed diagnostic run, by side, for the case loaded at the time", () => {
    const c = scenarioCase("diag-radial-left-set")!;
    g().loadCase(c, "free");
    const stop = startWorkedCatheterRecorder();
    // idempotent: a second start returns the same recorder
    expect(startWorkedCatheterRecorder()).toBe(stop);
    const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
    try {
      s.setTimeOutDone(true);
      if (g().catheterId !== "JL3.5") g().setCatheter("JL3.5");
      useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "selective-lm", target: "left", isSelective: true, isDeep: false, conus: false, depth: 0, quality: 0.9, distanceToLm: 0.5, alignmentLm: 0.99 } });
      expect(s.startInjection()).toBe(true);
      s.releaseInjection();
      const codes = g().events.map((e) => e.code);
      expect(codes).toContain("diagnostic-injection");
      expect(workedCathetersFor(c.id)?.left).toBe("JL3.5");
      expect(workedCathetersFor(c.id)?.route).toBe("radial-right");
    } finally {
      s.dispose();
      stop();
    }
  });
});

describe("the catheter choice comparison is a guided aid only", () => {
  it("scores the stated catheters in guided mode in the diagnostic lab, and gives nothing in supervised, independent or exam mode or in the PCI lab", () => {
    const c = scenarioCase("diag-catheter-choice-by-root")!;
    const stated = { access: "femoral" as const, left: "JL4", right: "JR4" };
    const guided = catheterChoiceAid("guided", "diagnostic", stated, c);
    expect(guided).not.toBeNull();
    expect(guided!.left.ok).toBe(false);
    expect(guided!.left.expected).toContain("JL5");
    expect(catheterChoiceAid("supervised", "diagnostic", stated, c)).toBeNull();
    expect(catheterChoiceAid("independent", "diagnostic", stated, c)).toBeNull();
    expect(catheterChoiceAid("exam", "diagnostic", stated, c)).toBeNull();
    expect(catheterChoiceAid("guided", "pci", stated, c)).toBeNull();
  });
});
