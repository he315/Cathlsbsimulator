// The bench's image step, plan form, debrief and measuring tools as rendered (pci-bench-measure-and-plan):
// no plaque-burden read-out or frame truth before the plan is entered (in exam mode and in every mode), the
// guided comparison after entry, the grey-zone hand-off, the debrief's plan grading, and the tools' limits.
//   npx vitest run src/ui/bench/PlanForm.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { BENCH_BY_ID, deploy, initialState, preImaging } from "../../simulation/pciBench";
import { exactPlan, planTruth } from "../../simulation/bench/measure";
import { ivusFrame } from "../../simulation/pci/ivus";
import { benchIvusContext } from "../../simulation/pciBench";
import ImagePanel, { inSentence } from "./ImagePanel";
import PlanForm, { EMPTY_DRAFT, GREY_ZONE_HANDOFF, draftToPlan, greyZoneHandoffAvailable, useBenchPlanStore, type BenchPlanRecord } from "./PlanForm";
import { PRACTICE_INDEX } from "../content/practiceIndex";
import AssessPanel from "./AssessPanel";
import MeasureTools, { measurementText, toolBlocked } from "../imaging/MeasureTools";

const noop = () => {};
afterEach(() => useBenchPlanStore.getState().reset());

/** Every way the screen could leak plaque burden or the frames' measures. */
function leaks(html: string, id: string, modality: "IVUS" | "OCT"): string[] {
  const l = BENCH_BY_ID[id];
  const t = planTruth(l, modality);
  const out: string[] = [];
  if (/plaque burden/i.test(html)) out.push("plaque burden");
  if (/EEM area/i.test(html)) out.push("EEM area");
  if (t.mla !== null && html.includes(t.mla.toFixed(2))) out.push(`MLA ${t.mla.toFixed(2)}`);
  if (html.includes("Plan against the frames")) out.push("comparison");
  if (html.includes("Pre-PCI measurements")) out.push("pre-PCI table");
  return out;
}

describe("the image step shows no truth before the plan", () => {
  it("exam mode: the modality chooser, then the workspace and form, carry no plaque-burden read-out", () => {
    for (const id of ["focal-lad", "ostial-lm-ivus", "distal-lm-two-branch", "acs-culprit-oct"]) {
      const l = BENCH_BY_ID[id];
      const chooser = renderToString(createElement(ImagePanel, { modality: null, onModality: noop, pre: null, next: noop, lesion: l, mode: "exam" }));
      expect(chooser).toContain(l.goal!.text);
      expect(chooser).toContain("Reason");
      expect(leaks(chooser, id, "IVUS")).toEqual([]);
      useBenchPlanStore.getState().commit(l.id, "IVUS", "sizing");
      const html = renderToString(createElement(ImagePanel, { modality: "IVUS", onModality: noop, pre: preImaging(l, "IVUS"), next: noop, lesion: l, mode: "exam" }));
      expect(html).toContain("Pre-PCI plan");
      expect(leaks(html, id, "IVUS")).toEqual([]);
      // exam: the plan must be entered before moving on
      expect(html).toMatch(/<button[^>]*disabled=""[^>]*title="Enter the plan first"/);
    }
  });

  it("without a mode or lesion from the bench screen, the panel finds the lesion and still shows no truth", () => {
    const l = BENCH_BY_ID["calcified-rca"];
    const html = renderToString(createElement(ImagePanel, { modality: "OCT", onModality: noop, pre: preImaging(l, "OCT"), next: noop }));
    expect(leaks(html, l.id, "OCT")).toEqual([]);
    expect(useBenchPlanStore.getState().records[l.id]).toBeUndefined(); // the record is created after mount (effect), not during render
  });

  it("exam and supervised: after entry the plan is recorded and compared only in the debrief; guided shows the comparison", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const st = useBenchPlanStore.getState();
    st.commit(l.id, "IVUS", "sizing");
    st.run(l.id, "main");
    st.edit(l.id, { mla: "2.30", stent: "4.00" });
    st.submit(l.id);
    for (const mode of ["exam", "supervised"] as const) {
      const html = renderToString(createElement(ImagePanel, { modality: "IVUS", onModality: noop, pre: preImaging(l, "IVUS"), next: noop, lesion: l, mode }));
      expect(html).toContain("compared with the frames in the debrief");
      expect(html).not.toContain("Plan against the frames");
    }
    const guided = renderToString(createElement(ImagePanel, { modality: "IVUS", onModality: noop, pre: preImaging(l, "IVUS"), next: noop, lesion: l, mode: "guided" }));
    expect(guided).toContain("Plan against the frames");
    expect(guided).toContain("Stent diameter from the distal reference");
  });
});

describe("the plan form", () => {
  const record = (id: string, patch: Partial<BenchPlanRecord["draft"]> = {}): BenchPlanRecord => ({ lesionId: id, modality: "IVUS", reasonId: "left-main-ostial", runs: ["main"], draft: { ...EMPTY_DRAFT, ...patch }, submitted: null });

  it("offers the physiology hand-off only when the learner's own MLA is in the IVUS grey zone", () => {
    const l = BENCH_BY_ID["ostial-lm-ivus"];
    const grey = renderToString(createElement(PlanForm, { lesion: l, record: record(l.id, { mla: "5.0" }), onEdit: noop, onSubmit: noop, handoffAvailable: true }));
    expect(grey).toContain("Open the physiology lab");
    expect(GREY_ZONE_HANDOFF).toEqual({ sim: "physiology", params: { scenario: "lm-intermediate" } });
    for (const mla of ["", "3.9", "6.4"])
      expect(renderToString(createElement(PlanForm, { lesion: l, record: record(l.id, { mla }), onEdit: noop, onSubmit: noop, handoffAvailable: true }))).not.toContain("Open the physiology lab");
    // without the physiology preset the notice stays and the button goes (it would open the default LAD case)
    const noPreset = renderToString(createElement(PlanForm, { lesion: l, record: record(l.id, { mla: "5.0" }), onEdit: noop, onSubmit: noop, handoffAvailable: false }));
    expect(noPreset).toContain("physiology can settle significance");
    expect(noPreset).not.toContain("Open the physiology lab");
    // by default the form asks the launch catalogue
    const declared = !!PRACTICE_INDEX.known.scenarios.get("physiology")?.has("lm-intermediate");
    expect(greyZoneHandoffAvailable()).toBe(declared);
    const byDefault = renderToString(createElement(PlanForm, { lesion: l, record: record(l.id, { mla: "5.0" }), onEdit: noop, onSubmit: noop }));
    expect(byDefault.includes("Open the physiology lab")).toBe(declared);
    // the population toggle and significance call appear for the left main only
    expect(grey).toContain("Korean 4.5");
    expect(renderToString(createElement(PlanForm, { lesion: BENCH_BY_ID["focal-lad"], record: record("focal-lad"), onEdit: noop, onSubmit: noop }))).not.toContain("Left main lesion");
  });

  it("the draft becomes the plan the grader reads", () => {
    const r = record("distal-lm-two-branch", { mla: "4.0", segLcx: "2.4", segLad: "6.9", distRef: "3.2", postDil: "none", calciumNone: true, significance: "significant" });
    r.runs = ["LAD", "LCx", "LAD"];
    const p = draftToPlan(r);
    expect(p).toMatchObject({ modality: "IVUS", pullbacks: ["LAD", "LCx"], mla: 4, distRef: { method: "lumen", diameterMm: 3.2 }, postDilMm: null, calcium: "none", significance: "significant", segments: { lcxOstium: 2.4, ladOstium: 6.9 } });
    expect(draftToPlan({ ...r, draft: { ...r.draft, mlaNotMeasurable: true } }).mla).toBeNull();
  });
});

describe("the debrief", () => {
  it("grades the submitted plan, names the modality's cost and lists the left main segments", () => {
    const l = BENCH_BY_ID["distal-lm-two-branch"];
    const t = planTruth(l, "IVUS");
    const r = deploy(l, initialState(), { diameter: 3.5, lengthMm: 18, proxEdge: t.landingProxMm - 2, atm: 12 }, [{ diameter: 5.0, atm: 14, where: "proximal" }], "IVUS");
    const plan: BenchPlanRecord = { lesionId: l.id, modality: "IVUS", reasonId: "left-main-ostial", runs: ["LAD"], draft: { ...EMPTY_DRAFT }, submitted: { ...exactPlan(l, "IVUS"), pullbacks: ["LAD"] } };
    const html = renderToString(createElement(AssessPanel, { lesion: l, modality: "IVUS", result: r, onMore: noop, onRestart: noop, plan }));
    expect(html).toContain("Pre-PCI plan against the frames");
    expect(html).toContain("Pullbacks from both branches");
    expect(html).toContain("circumflex not imaged");
    expect(html).toContain("Circumflex ostium");
    expect(html).toContain("target 5 mm²");

    const o = BENCH_BY_ID["ostial-lm-ivus"];
    const ro = deploy(o, initialState(), { diameter: 4.5, lengthMm: 12, proxEdge: 3, atm: 12 }, [], "OCT");
    const oct: BenchPlanRecord = { lesionId: o.id, modality: "OCT", reasonId: "left-main-ostial", runs: ["main"], draft: { ...EMPTY_DRAFT }, submitted: null };
    const h2 = renderToString(createElement(AssessPanel, { lesion: o, modality: "OCT", result: ro, onMore: noop, onRestart: noop, plan: oct }));
    expect(h2).toContain("IVUS fits this goal");
    expect(h2).toContain("blood-filled");
    expect(h2).toContain("32 mL (2 OCT runs)");
    expect(h2).toContain("No pre-PCI plan was entered.");
    expect(html).not.toContain("No pre-PCI plan was entered.");
  });
});

describe("the pullback buttons", () => {
  it("keep a branch acronym's capitals mid-sentence", () => {
    expect(inSentence("LAD pullback")).toBe("LAD pullback");
    expect(inSentence("Circumflex pullback")).toBe("circumflex pullback");
    expect(inSentence("Pullback")).toBe("pullback");
  });
});

describe("the measuring tools", () => {
  it("render the frame with their toolbar, and refuse thickness on IVUS and any tool where the frame cannot be measured", () => {
    const l = BENCH_BY_ID["calcified-rca"];
    const ivus = ivusFrame(benchIvusContext(l, null, null, "IVUS"), 20);
    const oct = ivusFrame(benchIvusContext(l, null, null, "OCT"), 20);
    expect(toolBlocked("thickness", ivus)).toContain("acoustic shadow");
    expect(toolBlocked("thickness", oct)).toBeNull();
    const html = renderToString(createElement(MeasureTools, { frame: ivus, blocked: "Blood not cleared", children: createElement("div", null, "image") }));
    expect(html).toContain("Trace area");
    expect(html).toContain("Blood not cleared");
    expect(html).not.toMatch(/plaque burden/i);
    expect(measurementText({ tool: "trace", areaMm2: 5.012, meanDiameterMm: 2.526 })).toBe("5.01 mm² (mean diameter 2.53 mm)");
    expect(measurementText({ tool: "arc", deg: 181.4 })).toBe("181°");
  });
});
