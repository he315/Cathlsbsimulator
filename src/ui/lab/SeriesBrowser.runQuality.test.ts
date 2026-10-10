// diag-injection-run-quality in the run browser: the acquisition tags show in every mode, the filling judgements
// only as a guided teaching aid; the store keeps the learner's non-diagnostic declarations for the study report.
//   npx vitest run src/ui/lab/SeriesBrowser.runQuality.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import SeriesBrowser, { runFacts, shownRunTags } from "./SeriesBrowser";
import { useSeriesStore, declaredNonDiagnosticRuns, type StoredSeries } from "../../state/useSeriesStore";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { assessRun, type InjectionQuality } from "../../simulation/imaging/runQuality";
import { visibilityFor } from "../../mentor/visibility";

afterEach(() => useSeriesStore.getState().clear());

const streaming: InjectionQuality = { volumeMl: 3, peakFlowMlS: 1, meanFlowMlS: 1, pushS: 3, testPuff: false, streamingIndex: 0.9, refluxMl: 0, reflux: false, missedMl: 0, opacifiedS: 0, beatsOpacified: 0, streaming: true, underfilled: true };
const quality = assessRun({ injection: streaming, selective: true, tip: { kind: "selective-lm", vessel: null }, pushDelayS: 0.2, tailS: 3, distalArrivalS: 1.9, fps: 7.5, table: { maxSpeedMmS: 20, travelMm: 10 }, fieldChanged: false, breathHeldShare: 1 });

function run(id: string, number: number, extra: Partial<StoredSeries> = {}): StoredSeries {
  return { id, number, kind: "cine", caseId: "c1", startedAt: 0, fps: 7.5, w: 4, h: 4, frames: [new Uint8Array(16)], cArm: { laoRao: 0, cranialCaudal: 0 }, cArmEnd: { laoRao: 0, cranialCaudal: 0 }, fieldCm: 20, mmPerPxIso: 0.3, durationS: 1, karMGy: 0, kapGyCm2: 0, contrastMl: 3, injected: true, catheterId: "JL4", ...extra };
}

describe("the run browser's tags", () => {
  it("shows the acquisition tags in every mode and the filling judgements only as a teaching aid", () => {
    const s = { quality };
    expect(quality.tags).toEqual(expect.arrayContaining(["streaming", "no-reflux", "underfilled", "non-diagnostic", "early-injection", "panned", "low-frame-rate"]));
    const off = shownRunTags(s, false);
    expect(off).toEqual(expect.arrayContaining(["early-injection", "panned", "low-frame-rate"]));
    for (const t of ["streaming", "no-reflux", "underfilled", "non-diagnostic"] as const) expect(off).not.toContain(t);
    expect(shownRunTags(s, true)).toEqual(quality.tags);
    expect(shownRunTags({}, true)).toEqual([]);
    expect(runFacts(run("a", 1))).toBe("1 frames at 7.5 per second, 3.0 mL");
  });

  it("an exam shows no filling judgement on the thumbnails; the declaration button is offered for the selected cine run", () => {
    useSimulatorStore.setState({ policy: { mode: "exam", entrustment: 2, visibility: visibilityFor("exam"), source: "exam" } as never });
    useSeriesStore.getState().add(run("a", 1, { quality }));
    const html = renderToStaticMarkup(createElement(SeriesBrowser));
    expect(html).not.toMatch(/Streaming|No reflux|Non-diagnostic</);
    expect(html).toMatch(/Panned|Injected under 1 s|Under 12.5 fps/);
    expect(html).toContain("Declare non-diagnostic");
  });

  it("a cine run the diagnostic lab did not judge (a PCI lab run, no quality) offers no declaration and shows no tags", () => {
    useSeriesStore.getState().add(run("p", 1));
    const html = renderToStaticMarkup(createElement(SeriesBrowser));
    expect(html).not.toContain("Declare non-diagnostic");
    expect(html).not.toMatch(/Panned|Injected under 1 s|Under 12.5 fps/);
  });

  it("declaring a run non-diagnostic is kept per run and listed for the study report", () => {
    const st = useSeriesStore.getState();
    st.add(run("a", 1));
    st.add(run("b", 2));
    st.add({ ...run("f", 3), kind: "fluoro" });
    st.declareNonDiagnostic("b", true);
    st.declareNonDiagnostic("f", true);
    expect(declaredNonDiagnosticRuns(useSeriesStore.getState(), "c1")).toEqual([2]);
    expect(declaredNonDiagnosticRuns(useSeriesStore.getState(), "other")).toEqual([]);
    useSeriesStore.getState().setQuality("a", quality);
    expect(useSeriesStore.getState().series[0].quality).toBe(quality);
  });
});
