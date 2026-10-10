// The ACS front end on screen (diag-acs-scenarios): the pre-brief opens on the presenting ECG and
// cannot be completed (so the beam is not enabled) until the prediction and the triage are
// committed; nothing on it grades the prediction; the study report asks the culprit and its clues,
// or the work-up, and the complication question of the iatrogenic case, and waits for them.
//   npx vitest run src/ui/lab/EcgPrebrief.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { useSeriesStore } from "../../state/useSeriesStore";
import { scenarioCase } from "../../simulation/caseGenerator";
import { prebriefForCase } from "../../content/mentor/prebriefs";
import { emptyStudyReport, reportGrafts } from "../../mentor/report";
import { ACS_CASES } from "../../simulation/diagnosticScenarios/acs";
import PreBrief from "../mentor/PreBrief";
import StudyReport, { acsReportProblems } from "./StudyReport";
import EcgPrebrief, { EcgPaper, OhcaTriageGate, acsBeamAllowed, acsEcgStrips, acsLedgerForLoadedCase, acsPrebriefDone, acsAnswersFor, useAcsStore, PreviousStudyViewer, ReperfusionClock, clockStartFor, releasePreviousStudyUnless, renderPreviousStudy } from "./EcgPrebrief";
import type { AnatomyCase } from "../../types";

const g = () => useSimulatorStore.getState();
afterEach(() => {
  useAcsStore.getState().reset();
  useSeriesStore.getState().setPreviousStudy(null);
});

const load = (id: string): AnatomyCase => {
  const c = scenarioCase(id)!;
  g().loadCase(c, "free");
  return c;
};
const prebrief = (c: AnatomyCase, mode: "guided" | "supervised" | "exam" = "supervised") =>
  renderToStaticMarkup(createElement(PreBrief, { prebrief: prebriefForCase(c), lab: "diagnostic", mode, catheters: ["JL4", "JR4"], views: [{ id: "lao30", name: "LAO 30" }], onComplete: () => undefined }));

describe("the pre-brief ECG step", () => {
  it("an ACS case opens on its presenting ECG with the extra leads to record and the prediction to commit, and says the ECG is a model", () => {
    const c = load("diag-stemi-inferior-rv");
    const html = prebrief(c);
    expect(html).toContain("Presenting ECG");
    expect(html).toContain("data-ecg-prebrief=\"ecg-stemi-inferior-rv\"");
    expect(html).toContain("Record V3R and V4R");
    expect(html).toContain("Record V7 to V9");
    expect(html).toContain("model parameters");
    expect(html).toContain("data-reperfusion-clock");
    expect(html).toContain("120 minutes of the diagnosis");
    // the 12 standard leads are drawn; the extra leads only once recorded
    for (const l of ["I", "aVR", "V1", "V6"]) expect(html).toContain(`data-lead="${l}"`);
    expect(html).not.toContain('data-lead="V4R"');
    // nothing is committed: the step cannot be left, and nothing grades the prediction
    expect(html).toMatch(/disabled=""[^>]*>Commit prediction/);
    expect(html).toMatch(/disabled=""[^>]*>Continue to the plan/);
    expect(html).not.toContain(ACS_CASES["diag-stemi-inferior-rv"].ecg!.truth.why);
  });

  it("recording V3R and V4R adds their row; a committed prediction lets the pre-brief finish, and the time-out alone does not", () => {
    const c = load("diag-stemi-inferior-rv");
    const acs = ACS_CASES["diag-stemi-inferior-rv"];
    expect(acsPrebriefDone(acs, acsAnswersFor(useAcsStore.getState(), c.id))).toBe(false);
    useAcsStore.getState().update(c.id, { ecg: { territory: "inferior-rv", artery: "RCA", level: "proximal", activate: true, leads: ["right"] } });
    const recorded = renderToStaticMarkup(createElement(EcgPrebrief, { acs: acs as typeof acs & { ecg: NonNullable<typeof acs.ecg> }, caseId: c.id }));
    expect(recorded).toContain('data-lead="V4R"');
    expect(recorded).toContain("V3R and V4R recorded");
    expect(recorded).not.toMatch(/disabled=""[^>]*>Commit prediction/);
    expect(acsPrebriefDone(acs, acsAnswersFor(useAcsStore.getState(), c.id))).toBe(false);
    useAcsStore.getState().update(c.id, { ecg: { ...acsAnswersFor(useAcsStore.getState(), c.id).ecg!, committedAt: 1 } });
    expect(acsPrebriefDone(acs, acsAnswersFor(useAcsStore.getState(), c.id))).toBe(true);
    expect(prebrief(c)).toContain("Prediction recorded");
    // answers of another case do not count
    expect(acsAnswersFor(useAcsStore.getState(), "another-case")).toEqual({ caseId: "another-case" });
  });

  it("after a resuscitated arrest the triage gate comes with the ECG; both are needed", () => {
    const c = load("diag-ohca-no-st");
    const html = prebrief(c, "exam");
    expect(html).toContain("data-ohca-triage");
    expect(html).toContain("Immediate angiography: to the lab now");
    expect(html).toContain("Who defibrillates if VF recurs");
    expect(html).not.toContain("data-reperfusion-clock");
    const acs = ACS_CASES["diag-ohca-no-st"];
    useAcsStore.getState().update(c.id, { ecg: { territory: "no-st-elevation", artery: "undetermined", level: "undetermined", activate: false, leads: [], committedAt: 1 } });
    expect(acsPrebriefDone(acs, acsAnswersFor(useAcsStore.getState(), c.id))).toBe(false);
    useAcsStore.getState().update(c.id, { triage: { choice: "intensive-care-first", padsOn: true, defibOperator: "cardiac-physiologist", committedAt: 2 } });
    expect(acsPrebriefDone(acs, acsAnswersFor(useAcsStore.getState(), c.id))).toBe(true);
  });

  it("a case without an ACS front end keeps the plain pre-brief, and the PCI lab never shows the ECG step", () => {
    const c = load("diag-graft-search");
    const html = prebrief(c);
    expect(html).not.toContain("Presenting ECG");
    expect(html).toContain("Left catheter");
    load("diag-stemi-anterior");
    const pci = renderToStaticMarkup(createElement(PreBrief, { prebrief: prebriefForCase(scenarioCase("diag-stemi-anterior")!), lab: "pci", mode: "supervised", catheters: [], views: [], onComplete: () => undefined }));
    expect(pci).not.toContain("Presenting ECG");
  });

  it("draws every ECG of ACS_CASES on 25 mm/s paper, with the extra rows when asked", () => {
    for (const [id, a] of Object.entries(ACS_CASES)) {
      if (!a.ecg) continue;
      const strips = acsEcgStrips(a.ecg);
      const svg = renderToStaticMarkup(createElement(EcgPaper, { strips, rows: [["I", "II"], ["V7", "V8", "V9"]], title: id }));
      expect(svg, id).toContain('data-lead="V9"');
      expect(svg, id).not.toContain("NaN");
    }
  });
});

describe("the report's ACS sections", () => {
  const props = (c: AnatomyCase) => ({ value: emptyStudyReport(reportGrafts(c)), onChange: () => undefined, grafts: reportGrafts(c), miAsked: true, runs: [], onBack: () => undefined, onSubmit: () => undefined });

  it("diag-two-candidate-culprits: the report requires a culprit and at least two clues, and shows the previous study", () => {
    const c = load("diag-two-candidate-culprits");
    useSeriesStore.getState().setPreviousStudy({ caseId: c.id, label: "Previous study, four years ago", status: "ready", series: [] });
    const html = renderToStaticMarkup(createElement(StudyReport, props(c)));
    expect(html).toContain("data-culprit-section");
    expect(html).toContain("data-previous-study");
    expect(html).toContain("Previous study, four years ago");
    expect(html).toMatch(/disabled=""[^>]*>Submit report and finish/);
    const acs = ACS_CASES["diag-two-candidate-culprits"];
    expect(acsReportProblems(acs, undefined, undefined)).toEqual(["Name the culprit, or say none is visible"]);
    useAcsStore.getState().update(c.id, { culprit: { vessel: "LCx", clues: ["previous-study"], workUp: [] } });
    const one = renderToStaticMarkup(createElement(StudyReport, props(c)));
    expect(one).toContain("The previous study: the lesion is new");
    expect(acsReportProblems(acs, acsAnswersFor(useAcsStore.getState(), c.id).culprit, undefined)).toEqual(["Name at least 2 clues for the culprit"]);
    useAcsStore.getState().update(c.id, { culprit: { vessel: "LCx", clues: ["previous-study", "wall-motion"], workUp: [] } });
    expect(acsReportProblems(acs, acsAnswersFor(useAcsStore.getState(), c.id).culprit, undefined)).toEqual([]);
    // the previous study of another case is not shown
    useSeriesStore.getState().setPreviousStudy({ caseId: "another-case", label: "Old film", status: "ready", series: [] });
    expect(renderToStaticMarkup(createElement(StudyReport, props(c)))).not.toContain("data-previous-study");
  });

  it("diag-no-visible-culprit asks for the work-up in order; the iatrogenic case asks what the ECG did, worded for every outcome; other cases add nothing", () => {
    const c = load("diag-no-visible-culprit");
    useAcsStore.getState().update(c.id, { culprit: { vessel: "none-visible", clues: [], workUp: ["review-runs"] } });
    const html = renderToStaticMarkup(createElement(StudyReport, props(c)));
    expect(html).toContain("data-work-up");
    expect(html).toContain("Choose the next steps in the order you would do them.");
    const i = load("diag-iatrogenic-occlusion");
    const iat = renderToStaticMarkup(createElement(StudyReport, props(i)));
    expect(iat).toContain("data-iatrogenic-section");
    expect(iat).toContain("The ECG did not change during the study");
    expect(iat).not.toContain("data-culprit-section");
    const plain = load("diag-graft-search");
    const p = renderToStaticMarkup(createElement(StudyReport, props(plain)));
    expect(p).not.toContain("data-culprit-section");
    expect(p).not.toContain("data-iatrogenic-section");
  });

  it("the previous-study viewer names its state and never takes a run number of the case", () => {
    const html = renderToStaticMarkup(createElement(PreviousStudyViewer, { study: { caseId: "x", label: "Old film", status: "rendering", series: [] } }));
    expect(html).toContain("Loading the previous study.");
    useSeriesStore.getState().setPreviousStudy({ caseId: "x", label: "Old film", status: "ready", series: [] });
    expect(useSeriesStore.getState().nextNumber()).toBe(useSeriesStore.getState().series.length + 1);
    // a new case clears the runs but the group stays keyed to its own case
    useSeriesStore.getState().clear();
    expect(useSeriesStore.getState().previousStudy?.caseId).toBe("x");
  });

  it("the previous study renders again for a case after another case's group replaced it, and a case without one releases the frames", async () => {
    const spec = ACS_CASES["diag-two-candidate-culprits"].previousStudy!;
    const a = scenarioCase("diag-two-candidate-culprits", "1")!;
    const b = scenarioCase("diag-two-candidate-culprits", "2")!;
    const calls: string[] = [];
    const stub = async (c: AnatomyCase) => {
      calls.push(c.id);
      return [];
    };
    await renderPreviousStudy(a, spec, stub);
    expect(useSeriesStore.getState().previousStudy).toMatchObject({ caseId: a.id, status: "ready" });
    // ready: nothing more to do
    await renderPreviousStudy(a, spec, stub);
    expect(calls).toEqual([a.id]);
    await renderPreviousStudy(b, spec, stub);
    expect(useSeriesStore.getState().previousStudy).toMatchObject({ caseId: b.id, status: "ready" });
    // back to the first case: rendered again, not blocked by an old promise
    await renderPreviousStudy(a, spec, stub);
    expect(calls).toEqual([a.id, b.id, a.id]);
    expect(useSeriesStore.getState().previousStudy).toMatchObject({ caseId: a.id, status: "ready" });
    // a case without a previous study releases the group
    releasePreviousStudyUnless("another-case");
    expect(useSeriesStore.getState().previousStudy).toBeNull();
  });
});

describe("the reperfusion clock", () => {
  it("keeps counting when the clock is unmounted and mounted again (the ECG step left and revisited)", () => {
    const caseId = "scn|diag-stemi-anterior|1";
    const t0 = 1_000_000;
    // the first mount's effect stores the start
    expect(clockStartFor(caseId, () => t0)).toBe(t0);
    const minutes = (html: string) => Number(/(\d+) min<\/span> ago/.exec(html)?.[1]);
    const at = (ms: number) => renderToStaticMarkup(createElement(ReperfusionClock, { caseId, diagnosisMinutesAgo: 45, now: () => ms }));
    expect(minutes(at(t0 + 10 * 60_000))).toBe(55);
    // mounted again later: the start is the stored one, not the new mount's time
    expect(clockStartFor(caseId, () => t0 + 20 * 60_000)).toBe(t0);
    expect(minutes(at(t0 + 20 * 60_000))).toBe(65);
    // another case starts its own clock
    expect(clockStartFor("scn|diag-stemi-posterior|1", () => t0 + 5)).toBe(t0 + 5);
  });
});

describe("after the in-app verification", () => {
  const committedEcg = { territory: "anterior", artery: "LAD", level: "proximal", activate: true, leads: [], committedAt: 1 } as const;

  it("the beam hook holds an ACS case until the reading is committed whatever the assessment mode (it reads no policy), and lets a plain case through", () => {
    const c = load("diag-stemi-anterior");
    // the default 'Guided practice' launch: no time-out required, so only this hook can hold the beam
    expect(acsBeamAllowed()).toBe(false);
    useAcsStore.getState().update(c.id, { ecg: { territory: "anterior", artery: "LAD", level: "proximal", activate: true, leads: [] } });
    expect(acsBeamAllowed()).toBe(false);
    useAcsStore.getState().update(c.id, { ecg: { ...committedEcg, leads: [] } });
    expect(acsBeamAllowed()).toBe(true);
    load("diag-graft-search");
    expect(acsBeamAllowed()).toBe(true);
  });

  it("the ECG step says what the reading holds: the beam where the time-out is required, the first image otherwise", () => {
    const c = load("diag-stemi-anterior");
    expect(prebrief(c, "supervised")).toContain("The beam stays off until you commit your reading of the ECG.");
    const guided = prebrief(c, "guided");
    expect(guided).toContain("Commit your reading of the ECG before the first image.");
    expect(guided).not.toContain("The beam stays off until you commit");
    useAcsStore.getState().update(c.id, { ecg: { ...committedEcg, leads: [] } });
    expect(prebrief(c, "guided")).not.toContain("data-acs-beam-notice");
  });

  it("a retry or a restart of the same case starts the ECG step afresh (answers and clock)", () => {
    const c = load("diag-stemi-inferior-rv");
    const acs = ACS_CASES["diag-stemi-inferior-rv"];
    useAcsStore.getState().update(c.id, { ecg: { territory: "inferior-rv", artery: "RCA", level: "proximal", activate: true, leads: ["right"], committedAt: 1 }, clockStartedAt: 5 });
    expect(acsPrebriefDone(acs, acsAnswersFor(useAcsStore.getState(), c.id))).toBe(true);
    const s0 = g().sessionStart;
    // relaunched with the same seed: the same case id, a new session
    g().loadCase(scenarioCase("diag-stemi-inferior-rv")!, "free");
    expect(g().caseData.id).toBe(c.id);
    expect(g().sessionStart).not.toBe(s0);
    expect(acsPrebriefDone(acs, acsAnswersFor(useAcsStore.getState(), c.id))).toBe(false);
    expect(acsAnswersFor(useAcsStore.getState(), c.id).clockStartedAt).toBeUndefined();
    expect(prebrief(c)).not.toContain("Prediction recorded");
    // restarted in place
    useAcsStore.getState().update(c.id, { ecg: { territory: "inferior-rv", artery: "RCA", level: "proximal", activate: true, leads: [], committedAt: 2 } });
    expect(acsPrebriefDone(acs, acsAnswersFor(useAcsStore.getState(), c.id))).toBe(true);
    g().reset();
    expect(acsPrebriefDone(acs, acsAnswersFor(useAcsStore.getState(), c.id))).toBe(false);
  });

  it("after an arrest the presenting ECG comes first and the triage cannot be committed before the ECG reading", () => {
    for (const id of ["diag-ohca-no-st", "diag-ohca-st-elevation", "diag-ohca-post-rosc"]) {
      const c = load(id);
      const html = prebrief(c);
      expect(html.indexOf("data-ecg-prebrief"), id).toBeGreaterThan(-1);
      expect(html.indexOf("data-ohca-triage"), id).toBeGreaterThan(html.indexOf("data-ecg-prebrief"));
      resetAcsAnswers();
    }
    const c = load("diag-ohca-no-st");
    useAcsStore.getState().update(c.id, { triage: { choice: "intensive-care-first", padsOn: true, defibOperator: "cardiac-physiologist" } });
    const before = renderToStaticMarkup(createElement(OhcaTriageGate, { caseId: c.id, waitForEcg: true }));
    expect(before).toContain("Commit your reading of the ECG first");
    expect(before).toMatch(/disabled=""[^>]*>Commit decision/);
    useAcsStore.getState().update(c.id, { ecg: { territory: "no-st-elevation", artery: "undetermined", level: "undetermined", activate: false, leads: [], committedAt: 1 } });
    const after = renderToStaticMarkup(createElement(OhcaTriageGate, { caseId: c.id, waitForEcg: true }));
    expect(after).not.toMatch(/disabled=""[^>]*>Commit decision/);
  });

  it("two changes in the same tick both land: a function patch reads the store's current answers", () => {
    const c = load("diag-stemi-posterior");
    // what the lead buttons and the report's checkboxes now do: merge into the current record
    const record = (l: "right" | "posterior") => useAcsStore.getState().update(c.id, (cur) => ({ ecg: { ...(cur.ecg ?? { leads: [] }), leads: cur.ecg?.leads.includes(l) ? cur.ecg.leads : [...(cur.ecg?.leads ?? []), l] } }));
    record("right");
    record("posterior");
    expect(acsAnswersFor(useAcsStore.getState(), c.id).ecg?.leads).toEqual(["right", "posterior"]);
    const pads = (patch: object) => useAcsStore.getState().update(c.id, (cur) => ({ triage: { ...(cur.triage ?? { padsOn: false }), ...patch } }));
    pads({ padsOn: true });
    pads({ defibOperator: "cardiac-physiologist" });
    expect(acsAnswersFor(useAcsStore.getState(), c.id).triage).toEqual({ padsOn: true, defibOperator: "cardiac-physiologist" });
  });

  it("the debrief hook gives the loaded ACS case's decisions as ledger records, and nothing for a plain case", () => {
    const c = load("diag-ohca-no-st");
    useAcsStore.getState().update(c.id, { triage: { choice: "immediate-angiography", padsOn: true, defibOperator: "cardiac-physiologist", committedAt: 2 } });
    const recs = acsLedgerForLoadedCase();
    const triage = recs.find((r) => r.id === "acs-ohca-triage");
    expect(triage?.correct).toBe(false);
    expect(triage?.expected).toContain("class III, level A");
    load("diag-graft-search");
    expect(acsLedgerForLoadedCase()).toEqual([]);
  });
});

function resetAcsAnswers() {
  useAcsStore.getState().reset();
}
