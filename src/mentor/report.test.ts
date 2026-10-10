// diag-study-report: the finish step's study report against the case truth, the gaps it gives the
// debrief, and the PCI target it hands over.
//   npx vitest run src/mentor/report.test.ts
import { afterEach, describe, expect, it } from "vitest";
import type { AnatomyCase, CaseChart, Lesion } from "../types";
import { defaultFlowMap } from "../simulation/patient/coronaryFlow";
import { ANGIOCAD_SEGMENTS } from "../simulation/patient/angiocadPriors";
import { lesionIdOf, PCI_STRATEGIES, type HandoverExtensions } from "../simulation/session/handover";
import { useLabHandoverStore } from "../state/useLabHandoverStore";
import { scenarios as studyReportScenarios } from "../simulation/diagnosticScenarios/studyReport";
import { buildDebrief } from "./debrief";
import { DEBRIEF_CHECKS } from "./debriefChecks/index";
import { check as reportCheck, id as reportCheckId } from "./debriefChecks/report";
import { assessAttempt } from "./index";
import { emptyFrame, ProcedureRecorder } from "./telemetry";
import {
  FINISH_EVENTS,
  LV_WALLS,
  TARGET_SEGMENTS,
  bandOf,
  compareReport,
  compareStudyReport,
  emptyStudyReport,
  finishContexts,
  finishEvents,
  pciTargetFor,
  pciTargetProblem,
  reportGrafts,
  studyReportGaps,
  studyReportProblems,
  studyTruth,
  targetLesionId,
  targetSegmentsFor,
  territoryTruth,
  truthReportOf,
  wallsOfRegion,
  type StudyReport,
  type TerritoryRegion,
  type WallSupply,
} from "./report";

// --- fixtures ----------------------------------------------------------------------------------

const CHART: CaseChart = { ageY: 66, sex: "M", heightCm: 176, weightKg: 82, consentScope: "diagnostic-and-ad-hoc-pci" };

type CaseBits = Pick<AnatomyCase, "dominance" | "variants" | "lesions" | "grafts" | "events" | "chart">;

const caseOf = (over: Partial<CaseBits> = {}): CaseBits => ({ dominance: "right", variants: ["normal-root"], lesions: [], events: [], chart: CHART, ...over });

/** The default coronary network's regions (the engine's coronary flow model without a rendered tree). */
const normalRegions = (lesions: Lesion[] = []): TerritoryRegion[] => defaultFlowMap(lesions).regions;

/** The same network with the circumflex and its branches filling from the right injection (an anomalous circumflex from the right sinus). */
function anomalousCxRegions(): TerritoryRegion[] {
  return normalRegions().map((r) => {
    const path = (r.path ?? []).map((p) => p.vessel);
    if (!path.includes("LCx")) return r;
    return { ...r, side: "right" as const, path: [{ vessel: "RCA" }, ...path.filter((v) => v !== "LM").map((vessel) => ({ vessel }))] };
  });
}

/** SYNTAX segment by vessel for the fixtures (the lab reads it from the tree). */
const SEG: Record<string, string> = { LM: "5", LAD: "7", D1: "9", LCx: "11", RCA: "2", OM1: "12a", PDA: "4" };
const segmentOf = (v: string) => SEG[v];

const native = (artery: "LAD" | "LCx" | "RCA", injection: "left" | "right"): WallSupply => ({ kind: "native", artery, injection });

/** A report that accounts for every wall as the normal right-dominant heart is supplied. */
function normalReport(over: Partial<StudyReport> = {}): StudyReport {
  return {
    ...emptyStudyReport(),
    dominance: "right",
    territories: { anterior: native("LAD", "left"), septal: native("LAD", "left"), apical: native("LAD", "left"), inferior: native("RCA", "right"), lateral: native("LCx", "left") },
    decision: "no-pci",
    ...over,
  };
}

afterEach(() => useLabHandoverStore.getState().clear());

// --- the existing structured report --------------------------------------------------------------

describe("structured report (unchanged)", () => {
  it("still compares segments, dominance and bands as before", () => {
    expect(bandOf(0)).toBe("NL");
    expect(bandOf(51)).toBe("51-75");
    const cmp = compareReport({ dominance: "right", lesions: [{ segment: "7", band: "51-75" }] }, { dominance: "right", lesions: [{ segment: "7", severityPct: 85 }] });
    expect(cmp.dominanceCorrect).toBe(true);
    expect(cmp.items[0].adjacent).toBe(true);
    expect(cmp.study).toBeUndefined();
  });
});

// --- territories -------------------------------------------------------------------------------

describe("territory truth from the engine's coronary regions", () => {
  it("assigns the walls of the default right-dominant network to LAD, RCA and circumflex from their injections", () => {
    const t = territoryTruth(normalRegions());
    expect(Object.keys(t).sort()).toEqual([...LV_WALLS].sort());
    expect(t.anterior).toMatchObject({ artery: "LAD", injection: "left" });
    expect(t.septal).toMatchObject({ artery: "LAD", injection: "left" });
    expect(t.apical).toMatchObject({ artery: "LAD", injection: "left" });
    expect(t.inferior).toMatchObject({ artery: "RCA", injection: "right" });
    expect(t.lateral).toMatchObject({ artery: "LCx", injection: "left" });
  });

  it("an anomalous circumflex case with the lateral wall assigned to 'LCx from the left injection' is flagged; assigning it to the RCA injection passes", () => {
    const c = caseOf({ variants: ["anomalous-lcx-right-sinus"] });
    const truth = studyTruth({ caseData: c, regions: anomalousCxRegions(), segmentOf });
    expect(truth.anomalous).toBe(true);
    expect(truth.territories.lateral).toMatchObject({ artery: "LCx", injection: "right" });

    const wrong = compareStudyReport(normalReport(), truth, 300);
    const lateral = wrong.study!.territories.find((x) => x.wall === "lateral")!;
    expect(lateral.correct).toBe(false);
    expect(lateral.problem).toBe("wrong-injection");
    const gaps = studyReportGaps(wrong);
    const g = gaps.find((x) => x.id === "report-territory")!;
    expect(g).toBeDefined();
    expect(g.lessonId).toBe("pm-interpreting-anomalies");
    expect(g.teaching).toMatch(/anomalous circumflex/);
    expect(g.tWall).toBe(300);
    expect(g.advocacy).toBe("In your report the lateral or posterolateral wall was assigned to the wrong injection.");

    const right = compareStudyReport(normalReport({ territories: { ...normalReport().territories, lateral: native("LCx", "right") } }), truth);
    expect(right.study!.territories.every((x) => x.correct)).toBe(true);
    expect(studyReportGaps(right).some((x) => x.id === "report-territory")).toBe(false);
  });

  it("'none seen' for a wall is a missed territory; a patent graft or the collaterals beyond a CTO account for it", () => {
    const none = compareStudyReport(normalReport({ territories: { ...normalReport().territories, inferior: { kind: "none" } } }), studyTruth({ caseData: caseOf(), regions: normalRegions(), segmentOf }));
    expect(none.study!.territories.find((x) => x.wall === "inferior")!.problem).toBe("none-seen");
    // an empty territory in a case without an anomalous origin is the pitfalls lesson's
    expect(studyReportGaps(none)[0].lessonId).toBe("pm-interpreting-pitfalls");

    const cto: Lesion = { vessel: "RCA", position: 0.3, severity: 100, kind: "cto", morphology: "cto", cto: { stump: "tapered", lengthMm: 25, collaterals: [{ donor: "LAD", recipient: "PDA", type: "septal", wernerCC: 1, rentrop: 3, tortuosity: 1 }] } };
    const grafted = caseOf({ lesions: [cto], grafts: [{ id: "svg-pda", conduit: "svg", target: "PDA", position: 0.3, proximalSite: "aorta-low", status: "patent", ringMarker: false }] });
    const t = studyTruth({ caseData: grafted, regions: normalRegions([cto]), segmentOf });
    const viaGraft = compareStudyReport(normalReport({ territories: { ...normalReport().territories, inferior: { kind: "graft", graftId: "svg-pda" } } }), t);
    expect(viaGraft.study!.territories.find((x) => x.wall === "inferior")!.correct).toBe(true);
    const viaCollaterals = compareStudyReport(normalReport({ territories: { ...normalReport().territories, inferior: native("LAD", "left") } }), t);
    expect(viaCollaterals.study!.territories.find((x) => x.wall === "inferior")!.correct).toBe(true);
  });

  it("reads the tree's vessel names: septal perforators S1..S12 the septum, diagonals the anterior wall, PL branches the lateral wall, nodal and RV branches no wall", () => {
    const reg = (vessel: string, side: "left" | "right" = "left", path: string[] = []): TerritoryRegion => ({ vessel, side, demand: 0.01, p0: 0.2, path: path.map((v) => ({ vessel: v })) });
    expect(wallsOfRegion(reg("S1", "left", ["LM", "LAD"]))).toEqual(["septal"]);
    expect(wallsOfRegion(reg("S12", "left", ["LM", "LAD"]))).toEqual(["septal"]);
    expect(wallsOfRegion(reg("D3", "left", ["LM", "LAD"]))).toEqual(["anterior"]);
    for (const v of ["PLV", "PL2", "PL3", "PLV-twig0", "PL2-twig0-twig1"]) expect(wallsOfRegion(reg(v, "right", ["RCA"])), v).toEqual(["lateral"]);
    for (const v of ["SAN", "AVN", "RV", "RV2", "CONUS-twig0"]) expect(wallsOfRegion(reg(v, "right", ["RCA"])), v).toEqual([]);
    expect(wallsOfRegion(reg("PDA-twig1", "right", ["RCA", "PDA"]))).toEqual(["inferior", "septal"]);
    // a septal perforator's demand counts towards the septum of the LAD from the left injection
    const t = territoryTruth([reg("S1", "left", ["LM", "LAD"]), { ...reg("PDA", "right", ["RCA"]), demand: 0.005 }]);
    expect(t.septal).toMatchObject({ artery: "LAD", injection: "left" });
  });

  it("a wall credited to an injection that was not made and filmed is not accounted for", () => {
    const runs = [{ number: 1, injected: true }];
    // no injection at all (no stored contrast run): every native wall fails, whatever the lab knew of the sides
    const none = studyTruth({ caseData: caseOf(), regions: normalRegions(), segmentOf, runs: [], injectionsMade: ["left", "right"] });
    expect(none.injectionsMade).toEqual([]);
    const blank = compareStudyReport(normalReport(), none);
    expect(blank.study!.territories.every((x) => !x.correct && x.problem === "injection-not-made")).toBe(true);
    const g = studyReportGaps(blank).find((x) => x.id === "report-territory")!;
    expect(g.advocacy).toMatch(/^In your report the anterior wall was credited to an injection that was not made; the septal wall was credited/);
    // the left injection only: the inferior wall credited to the right injection fails, the rest pass
    const left = compareStudyReport(normalReport(), studyTruth({ caseData: caseOf(), regions: normalRegions(), segmentOf, runs, injectionsMade: ["left"] }));
    expect(left.study!.territories.filter((x) => !x.correct).map((x) => [x.wall, x.problem])).toEqual([["inferior", "injection-not-made"]]);
    // both injections made: every wall agrees; the check is not made when the lab does not know the sides
    expect(compareStudyReport(normalReport(), studyTruth({ caseData: caseOf(), regions: normalRegions(), segmentOf, runs, injectionsMade: ["left", "right"] })).study!.territories.every((x) => x.correct)).toBe(true);
    expect(compareStudyReport(normalReport(), studyTruth({ caseData: caseOf(), regions: normalRegions(), segmentOf })).study!.territories.every((x) => x.correct)).toBe(true);
  });

  it("an occluded graft reported patent is flagged", () => {
    const c = caseOf({ grafts: [{ id: "svg-om", conduit: "svg", target: "OM1", position: 0.35, proximalSite: "aorta-high", status: "occluded", ringMarker: false }] });
    expect(reportGrafts(c)).toEqual([{ id: "svg-om", label: "Vein graft to OM1" }]);
    const r = normalReport({ findings: emptyStudyReport(reportGrafts(c)).findings.map((f) => (f.vessel === "graft:svg-om" ? { ...f, patency: "patent" as const } : f)) });
    const cmp = compareStudyReport(r, studyTruth({ caseData: c, regions: normalRegions(), segmentOf }));
    expect(cmp.study!.graftPatency).toEqual([{ graftId: "svg-om", label: "Vein graft to OM1", learner: "patent", truth: "occluded", correct: false }]);
    expect(studyReportGaps(cmp).map((g) => g.id)).toContain("report-graft-patency");
  });
});

// --- findings ----------------------------------------------------------------------------------

describe("findings", () => {
  it("spasm reported as a fixed stenosis is flagged; ticking spasm passes and leaves it out of the structured report", () => {
    const spasm: Lesion = { vessel: "RCA", position: 0.4, severity: 70, kind: "spasm", morphology: "spasm", nitrateResponsive: true };
    const t = studyTruth({ caseData: caseOf({ lesions: [spasm] }), regions: normalRegions(), segmentOf });
    const row = (s: boolean) => normalReport({ findings: emptyStudyReport().findings.map((f) => (f.vessel === "RCA" ? { ...f, patency: "patent" as const, worstPct: 70, segment: "2", spasm: s } : f)) });
    const fixed = compareStudyReport(row(false), t);
    expect(fixed.study!.spasmAsFixed).toEqual([{ vessel: "RCA", segment: "2", pct: 70 }]);
    const g = studyReportGaps(fixed).find((x) => x.id === "report-spasm-as-fixed")!;
    expect(g.lessonId).toBe("pm-interpreting-spasm");
    expect(fixed.falsePositives).toEqual(["2"]);
    const named = compareStudyReport(row(true), t);
    expect(named.study!.spasmAsFixed).toEqual([]);
    expect(named.items).toEqual([]);
  });

  it("compares one worst lesion per finding row: a lesser second lesion on the same artery is not missed", () => {
    const lad: Lesion = { vessel: "LAD", position: 0.45, severity: 80, kind: "severe-stenosis" };
    const d1: Lesion = { vessel: "D1", position: 0.3, severity: 70, kind: "severe-stenosis" };
    const t = studyTruth({ caseData: caseOf({ lesions: [lad, d1] }), regions: normalRegions(), segmentOf });
    expect(truthReportOf(t).lesions).toEqual([{ segment: "7", severityPct: 80 }]);
    const ladRow = (pct: number, segment: string) => normalReport({ findings: emptyStudyReport().findings.map((f) => (f.vessel === "LAD" ? { ...f, patency: "patent" as const, worstPct: pct, segment } : f)) });
    const right = compareStudyReport(ladRow(80, "7"), t);
    expect(right.missed).toEqual([]);
    expect(right.falsePositives).toEqual([]);
    expect(right.meanBias).toBe(0);
    // the lesser lesion given as the worst: compared with what is there, and the worst one is missed
    const lesser = compareStudyReport(ladRow(70, "9"), t);
    expect(lesser.items.find((i) => i.segment === "9")).toMatchObject({ truth: "51-75", correct: true });
    expect(lesser.missed).toEqual(["7"]);
    expect(lesser.falsePositives).toEqual([]);
  });

  it("a finding read from a run without contrast or one declared non-diagnostic is flagged", () => {
    const t = studyTruth({ caseData: caseOf(), regions: normalRegions(), segmentOf, runs: [{ number: 1, injected: true }, { number: 2, injected: false }, { number: 3, injected: true }] });
    const r = normalReport({
      nonDiagnosticRuns: [3],
      findings: emptyStudyReport().findings.map((f) => (f.vessel === "LAD" ? { ...f, patency: "patent" as const, run: 2 } : f.vessel === "LCx" ? { ...f, patency: "patent" as const, run: 3 } : f.vessel === "RCA" ? { ...f, run: 1 } : f)),
    });
    const cmp = compareStudyReport(r, t);
    expect(cmp.study!.runsCitedWithoutContrast).toEqual([2]);
    expect(cmp.study!.runsCitedNonDiagnostic).toEqual([3]);
    const g = studyReportGaps(cmp).find((x) => x.id === "report-non-diagnostic-run")!;
    expect(g.occurrences).toBe(2);
    expect(g.lessonId).toBe("pm-acquiring-cine");
  });

  it("asks for an MI classification only for an ACS presentation, and grades it by obstructive disease", () => {
    expect(studyReportProblems(normalReport(), { miAsked: true })).toContain("Classify the myocardial infarction");
    const acs = caseOf({ events: ["nste-acs"], lesions: [{ vessel: "LAD", position: 0.5, severity: 30, kind: "mild-irregularity" }] });
    const t = studyTruth({ caseData: acs, regions: normalRegions(), segmentOf });
    const wrong = compareStudyReport(normalReport({ mi: "primary" }), t);
    expect(wrong.study!.mi).toEqual({ learner: "primary", truth: "injury-non-obstructive", correct: false });
    expect(studyReportGaps(wrong).find((g) => g.id === "report-mi-class")!.lessonId).toBe("hb-background-mi");
    expect(compareStudyReport(normalReport({ mi: "injury-non-obstructive" }), t).study!.mi!.correct).toBe(true);
    expect(compareStudyReport(normalReport(), studyTruth({ caseData: caseOf(), regions: normalRegions(), segmentOf })).study!.mi).toBeNull();
  });
});

// --- the decision --------------------------------------------------------------------------------

describe("the decision and Brilakis's reasons to defer", () => {
  const LM: Lesion = { vessel: "LM", position: 0.5, severity: 70, kind: "severe-stenosis" };

  it("a stable left main case with decision 'ad hoc PCI' produces the deferral gap citing the Brilakis reasons", () => {
    const t = studyTruth({ caseData: caseOf({ lesions: [LM] }), regions: normalRegions([LM]), segmentOf });
    const cmp = compareStudyReport(normalReport({ decision: "adhoc", target: { vessel: "LM", segment: "LM", qcaPct: 68, lengthMm: 8 } }), t);
    expect(cmp.study!.anatomy.unprotectedLm).toBe(true);
    // consented to ad hoc PCI, but unprotected left main disease is beyond what a consent to ad hoc PCI covered
    expect(cmp.study!.deferralApplies).toEqual(["anatomy", "consent"]);
    expect(cmp.study!.adhocAgainstReasons).toBe(true);
    const g = studyReportGaps(cmp).find((x) => x.id === "report-adhoc-deferral")!;
    expect(g).toBeDefined();
    expect(g.severity).toBe("safety");
    expect(g.lessonId).toBe("pm-target-timing");
    expect(g.teaching).toMatch(/Brilakis's reasons to defer ad hoc PCI \(7\.3/);
    expect(g.teaching).toMatch(/anatomy, dose, place, consent/);
    expect(g.teaching).toMatch(/unprotected left main/);
    expect(g.teaching).toMatch(/Here anatomy and consent applied/);
    expect(g.advocacy).toMatch(/unprotected left main disease/);
    // an isolated left main lesion is not multivessel disease
    expect(cmp.study!.anatomy.multivessel).toBe(false);
    expect(g.advocacy).not.toMatch(/multivessel/);
    // stopping for the heart team is not flagged
    expect(studyReportGaps(compareStudyReport(normalReport({ decision: "heart-team" }), t)).some((x) => x.id === "report-adhoc-deferral")).toBe(false);
  });

  it("an ACS presentation, a protected left main or a single simple lesion is not a deferral gap; multivessel disease and diagnostic-only consent are", () => {
    const acs = studyTruth({ caseData: caseOf({ lesions: [LM], events: ["stemi"] }), regions: normalRegions(), segmentOf });
    expect(compareStudyReport(normalReport({ decision: "adhoc", mi: "primary" }), acs).study!.adhocAgainstReasons).toBe(false);
    const lima = { id: "lima-lad", conduit: "lima" as const, target: "LAD" as const, position: 0.5, proximalSite: "left-subclavian" as const, status: "patent" as const, ringMarker: false };
    const prot = studyTruth({ caseData: caseOf({ lesions: [LM], grafts: [lima] }), regions: normalRegions(), segmentOf });
    const protCmp = compareStudyReport(normalReport({ decision: "adhoc" }), prot).study!;
    expect(protCmp.anatomy).toEqual({ unprotectedLm: false, cto: false, multivessel: false });
    expect(protCmp.adhocAgainstReasons).toBe(false);
    expect(protCmp.deferralApplies).toEqual([]);
    const single = studyTruth({ caseData: caseOf({ lesions: [{ vessel: "LAD", position: 0.4, severity: 80, kind: "severe-stenosis" }] }), regions: normalRegions(), segmentOf });
    expect(compareStudyReport(normalReport({ decision: "adhoc" }), single).study!.adhocAgainstReasons).toBe(false);
    const multi = studyTruth({
      caseData: caseOf({ lesions: [{ vessel: "LAD", position: 0.4, severity: 80, kind: "severe-stenosis" }, { vessel: "RCA", position: 0.4, severity: 85, kind: "severe-stenosis" }] }),
      regions: normalRegions(),
      segmentOf,
    });
    expect(compareStudyReport(normalReport({ decision: "adhoc" }), multi).study!.anatomy.multivessel).toBe(true);
    const consent = studyTruth({ caseData: caseOf({ chart: { ...CHART, consentScope: "diagnostic-only" }, lesions: [{ vessel: "LAD", position: 0.4, severity: 80, kind: "severe-stenosis" }] }), regions: normalRegions(), segmentOf });
    const c = compareStudyReport(normalReport({ decision: "adhoc" }), consent);
    expect(c.study!.deferralApplies).toEqual(["consent"]);
    expect(studyReportGaps(c).find((x) => x.id === "report-adhoc-deferral")!.teaching).toMatch(/Here consent applied/);
    // a single simple lesion stays within a consent to ad hoc PCI
    expect(compareStudyReport(normalReport({ decision: "adhoc" }), single).study!.deferralApplies).toEqual([]);
    // multivessel disease goes beyond it
    expect(compareStudyReport(normalReport({ decision: "adhoc" }), multi).study!.deferralApplies).toEqual(["anatomy", "consent"]);
  });

  it("diag-beyond-consent-lm: the truth carries both anatomy and consent, and the deferral gap names both", () => {
    const scn = studyReportScenarios.find((x) => x.id === "diag-beyond-consent-lm")!;
    expect(scn.chart!.consentScope).toBe("diagnostic-and-ad-hoc-pci");
    const lesions: Lesion[] = (scn.lesions ?? []).map(({ vessel, position, severity, kind }) => ({ vessel, position, severity, kind }) as Lesion);
    expect(lesions.map((l) => l.vessel)).toEqual(["LM"]);
    const t = studyTruth({ caseData: caseOf({ lesions, chart: scn.chart }), regions: normalRegions(lesions), segmentOf });
    const cmp = compareStudyReport(normalReport({ decision: "adhoc", target: { vessel: "LM", segment: "LM", qcaPct: 80, lengthMm: 8 } }), t);
    expect(cmp.study!.deferralApplies).toEqual(expect.arrayContaining(["anatomy", "consent"]));
    expect(studyReportGaps(cmp).find((x) => x.id === "report-adhoc-deferral")!.teaching).toMatch(/Here anatomy and consent applied/);
  });

  it("an ad hoc decision needs a target before submission", () => {
    expect(studyReportProblems(normalReport({ decision: "adhoc" }), { miAsked: false })).toContain("Name the PCI target");
    expect(studyReportProblems(normalReport(), { miAsked: false })).toEqual([]);
    expect(studyReportProblems(emptyStudyReport(), { miAsked: false })[0]).toMatch(/^Assign every wall/);
  });
});

// --- the PCI target --------------------------------------------------------------------------------

describe("the PCI target hand-over", () => {
  const LAD: Lesion = { vessel: "LAD", position: 0.42, severity: 85, kind: "severe-stenosis", lengthMm: 14 };

  it("an ad hoc decision with a target writes a PciTarget that the hand-over contract accepts", () => {
    const t = studyTruth({ caseData: caseOf({ lesions: [LAD] }), regions: normalRegions([LAD]), segmentOf });
    const r = normalReport({ decision: "adhoc", target: { vessel: "LAD", segment: "Mid LAD", qcaPct: 78, lengthMm: 15 } });
    const target = pciTargetFor(r, t)!;
    expect(target).toEqual({ vessel: "LAD", segment: "Mid LAD", qcaPct: 78, lengthMm: 15, lesionId: lesionIdOf(LAD), strategy: "adhoc" });
    expect(targetLesionId(LAD)).toBe(lesionIdOf(LAD));
    expect(PCI_STRATEGIES).toContain(target.strategy);
    expect(pciTargetProblem(target)).toBeNull();
    // the full case's hand-over extensions and the stand-alone transfer store both carry it unchanged
    const context: HandoverExtensions = { pciTarget: target };
    useLabHandoverStore.getState().put({ to: "angio-pci", from: "cathlab", context });
    expect(useLabHandoverStore.getState().take("angio-pci")!.context!.pciTarget).toEqual(target);
    // the comparison records it with the case lesion it refers to
    const cmp = compareStudyReport(r, t);
    expect(cmp.study!.target).toEqual({ target, matched: true, truthPct: 85 });
  });

  it("staged and heart-team decisions write their strategies; no PCI writes none; a target off any lesion is still valid", () => {
    const t = studyTruth({ caseData: caseOf({ lesions: [LAD] }), regions: normalRegions(), segmentOf });
    const tg = { vessel: "RCA" as const, segment: "Mid RCA" as const, qcaPct: null, lengthMm: null };
    expect(pciTargetFor(normalReport({ decision: "staged", target: tg }), t)).toMatchObject({ strategy: "staged", lesionId: "RCA@none" });
    expect(pciTargetFor(normalReport({ decision: "heart-team", target: tg }), t)!.strategy).toBe("defer");
    expect(pciTargetFor(normalReport({ decision: "no-pci", target: tg }), t)).toBeNull();
    expect(pciTargetProblem(pciTargetFor(normalReport({ decision: "staged", target: tg }), t)!)).toBeNull();
    expect(pciTargetProblem({ vessel: "LAD", segment: null, qcaPct: 140, lengthMm: null, lesionId: "LAD@0.420", strategy: "adhoc" })).toMatch(/QCA/);
  });

  it("a target in a segment, or on a branch, without a case lesion refers to no lesion", () => {
    const t = studyTruth({ caseData: caseOf({ lesions: [LAD] }), regions: normalRegions([LAD]), segmentOf });
    const prox = normalReport({ decision: "adhoc", target: { vessel: "LAD", segment: "Prox LAD", qcaPct: 80, lengthMm: 12 } });
    expect(pciTargetFor(prox, t)!.lesionId).toBe("LAD@none");
    expect(compareStudyReport(prox, t).study!.target).toMatchObject({ matched: false, truthPct: null });
    const diag = normalReport({ decision: "staged", target: { vessel: "D1", segment: "D1", qcaPct: null, lengthMm: null } });
    expect(pciTargetFor(diag, t)!.lesionId).toBe("D1@none");
    // no segment named: the most severe lesion on the vessel itself
    expect(pciTargetFor(normalReport({ decision: "adhoc", target: { vessel: "LAD", segment: null, qcaPct: null, lengthMm: null } }), t)!.lesionId).toBe(lesionIdOf(LAD));
  });

  it("offers the AngioCAD segments, each under its vessel", () => {
    expect([...TARGET_SEGMENTS]).toEqual([...ANGIOCAD_SEGMENTS]);
    expect(targetSegmentsFor("LAD")).toEqual(["Prox LAD", "Mid LAD", "Dist LAD"]);
    expect(targetSegmentsFor("OM1")).toEqual(["OM"]);
    expect(targetSegmentsFor("LM")).toEqual(["LM"]);
  });

  it("an ad hoc CTO target is flagged", () => {
    const cto: Lesion = { vessel: "RCA", position: 0.3, severity: 100, kind: "cto", morphology: "cto" };
    const t = studyTruth({ caseData: caseOf({ lesions: [cto], events: ["nste-acs"] }), regions: normalRegions(), segmentOf });
    const cmp = compareStudyReport(normalReport({ decision: "adhoc", mi: "primary", target: { vessel: "RCA", segment: "Mid RCA", qcaPct: 100, lengthMm: 25 } }), t);
    expect(cmp.study!.adhocCto).toBe(true);
    expect(studyReportGaps(cmp).map((g) => g.id)).toContain("report-adhoc-cto");
  });
});

// --- the finish step's events and contexts ---------------------------------------------------------

describe("finish-step events", () => {
  it("an empty wall raises territory-unsupplied, and anomalous-origin when the case has one; a CTO case raises cto", () => {
    const r = normalReport({ territories: { ...normalReport().territories, lateral: { kind: "none" } } });
    expect(finishEvents(r, { variants: ["normal-root"], lesions: [] })).toEqual(["territory-unsupplied"]);
    expect(finishEvents(r, { variants: ["anomalous-lcx-from-rca"], lesions: [] })).toEqual(["territory-unsupplied", "anomalous-origin"]);
    expect(finishEvents(normalReport(), { variants: ["anomalous-lcx-from-rca"], lesions: [] })).toEqual([]);
    expect(finishEvents(normalReport(), { variants: [], lesions: [{ vessel: "RCA", position: 0.3, severity: 100, kind: "cto", morphology: "cto" }] })).toEqual(["cto"]);
    for (const e of finishEvents(r, { variants: ["anomalous-lcx-from-rca"], lesions: [{ vessel: "RCA", position: 0.3, severity: 100, kind: "cto", morphology: "cto" }] })) expect(FINISH_EVENTS).toContain(e);
    // the empty lateral wall adds a context about the circumflex
    const ctxs = finishContexts({ lab: "diagnostic", phase: "finish", events: [] }, r);
    expect(ctxs.map((c) => c.vessel)).toEqual([undefined, "LCx"]);
    expect(finishContexts({ lab: "diagnostic", phase: "finish" }, null)).toHaveLength(1);
  });
});

// --- the debrief check -----------------------------------------------------------------------------

describe("the debrief check", () => {
  function record() {
    const rec = new ProcedureRecorder({ id: "rec", startedAt: 0, caseId: "easy-left-0", lab: "diagnostic", mode: "supervised", entrustment: 2, seed: "s1" });
    for (let i = 1; i <= 20; i++) rec.sample({ ...emptyFrame(), tWall: i * 0.1, step: i }, true);
    return rec.toRecord();
  }

  it("is registered, returns nothing without a study report, and ranks its gaps in the debrief", () => {
    expect(DEBRIEF_CHECKS.map((c) => c.id)).toContain(reportCheckId);
    const r = record();
    const as = assessAttempt(r);
    const input = { record: r, analysis: as.analysis, metrics: as.metrics, mistakes: as.mistakes, standards: { results: [], passed: true } };
    expect(reportCheck(input)).toEqual([]);
    const LM: Lesion = { vessel: "LM", position: 0.5, severity: 70, kind: "severe-stenosis" };
    const cmp = compareStudyReport(normalReport({ decision: "adhoc", target: { vessel: "LM", segment: "LM", qcaPct: 70, lengthMm: 6 } }), studyTruth({ caseData: caseOf({ lesions: [LM] }), regions: normalRegions([LM]), segmentOf }), 1.5);
    const d = buildDebrief({ ...input, report: cmp });
    const g = d.analysis.gaps.find((x) => x.id === "report-adhoc-deferral")!;
    expect(g.check).toBe("study-report");
    expect(g.strategy).toBe("advocacy-inquiry");
    expect(d.report?.study?.decision).toBe("adhoc");
    expect(d.summary.takeHomeOptions).toContain("Next time I will run the list of reasons to defer aloud before any ad hoc PCI.");
  });
});
