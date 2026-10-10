// The ACS rule group and its scoring (diag-acs-scenarios): Brilakis's STEMI engagement order, the
// triage after a resuscitated arrest against the 2023 ESC classes the module quotes, the pre-brief
// ECG prediction, the culprit and its clues, the first measures for an iatrogenic occlusion and the
// reperfusion clock.
//   npx vitest run src/mentor/diagAcs.test.ts
import { afterEach, describe, expect, it } from "vitest";
import {
  ACS_RULES,
  EngagementOrderWatch,
  MIN_CULPRIT_CLUES,
  OHCA_RECOMMENDATIONS,
  REPERFUSION_LIMIT_MIN,
  acsDecisions,
  culpritProblems,
  ecgPredictionProblems,
  gradeEcgPrediction,
  iatrogenicProblems,
  order,
  reperfusionClock,
  rules,
  scoreCulprit,
  scoreEngagementOrder,
  scoreIatrogenic,
  scoreOhcaTriage,
  triageProblems,
  type EngagementStep,
} from "./rules/diagAcs";
import { RULES } from "./rules/index";
import { ACS_CASES } from "../simulation/diagnosticScenarios/acs";
import { diagScenarioById } from "../simulation/diagnosticScenarios";
import { scenarioCase } from "../simulation/caseGenerator";
import { catheterById } from "../data/catheters";
import { useSimulatorStore } from "../state/useSimulatorStore";
import { DiagnosticLabSession } from "../ui/sim/labSession";
import { MentorEngine } from "./mentor";
import type { MentorInput } from "./context";
import { TRACKS } from "../content";

const g = () => useSimulatorStore.getState();
afterEach(() => g().setPedalImaging(false));
const isGuide = (id: string) => catheterById(id)?.category === "guide";
const step = (t: number, side: "left" | "right", o: Partial<EngagementStep> = {}): EngagementStep => ({ t, side, guide: false, injected: false, selective: true, ...o });

describe("the STEMI engagement order (Brilakis, pm-target-culprit)", () => {
  const inferior = ACS_CASES["diag-stemi-inferior-rv"].stemi!;

  it("in diag-stemi-inferior-rv a first selective RCA guide engagement before any left injection fails the engagement-order rule", () => {
    expect(inferior.presentation).toBe("non-anterior");
    const v = scoreEngagementOrder(inferior.presentation, [step(30, "right", { guide: true }), step(60, "right", { guide: true, injected: true }), step(200, "left", { injected: true })]);
    expect(v.ok).toBe(false);
    expect(v.code).toBe("rca-guide-before-left");
    expect(v.lessonId).toBe("pm-target-culprit");
    expect(v.tipId).toBe("diag-stemi-engagement-order");
    // the same guide after a left diagnostic run passes
    const ok = scoreEngagementOrder(inferior.presentation, [step(10, "left"), step(20, "left", { injected: true }), step(90, "right", { guide: true }), step(100, "right", { guide: true, injected: true })]);
    expect(ok).toMatchObject({ ok: true, code: "left-imaged-first" });
    // a left root puff (not selective) does not count as imaging the left
    const puff = scoreEngagementOrder(inferior.presentation, [step(10, "left", { injected: true, selective: false }), step(20, "right", { guide: true })]);
    expect(puff.code).toBe("rca-guide-before-left");
  });

  it("drives the scenario's session: a right coronary run before any left run is scored as the wrong order, the left first as the right one", () => {
    const run = (sides: ("left" | "right")[]) => {
      g().loadCase(scenarioCase("diag-stemi-inferior-rv")!, "free");
      const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
      const w = new EngagementOrderWatch(isGuide);
      s.setTimeOutDone(true);
      s.step(0.1);
      for (const side of sides) {
        const kind = side === "left" ? "selective-lm" : "selective-rca";
        g().setCatheter(side === "left" ? "JL4" : "JR4");
        useSimulatorStore.setState({ engagement: { ...g().engagement, kind, target: side, isSelective: true } });
        w.observe(s.wall(), kind, g().catheterId);
        expect(s.startInjection()).toBe(true);
        w.inject(s.wall(), g().engagement.kind, g().catheterId, side);
        s.injector.finish();
        for (let i = 0; i < 5; i++) s.step(0.1);
      }
      s.dispose();
      return scoreEngagementOrder("non-anterior", w.steps);
    };
    expect(run(["right", "left"])).toMatchObject({ ok: false, code: "right-imaged-first" });
    expect(run(["left", "right"])).toMatchObject({ ok: true, code: "left-imaged-first" });
  });

  it("anterior STEMI: the left main first (a guide straight in is the sequence; a diagnostic left run first still follows it); the RCA first fails", () => {
    expect(ACS_CASES["diag-stemi-anterior"].stemi!.presentation).toBe("anterior");
    expect(scoreEngagementOrder("anterior", [step(5, "left", { guide: true }), step(9, "left", { guide: true, injected: true })]).code).toBe("guide-left-first");
    expect(scoreEngagementOrder("anterior", [step(5, "left"), step(40, "left", { guide: true })])).toMatchObject({ ok: true, code: "diagnostic-left-first" });
    expect(scoreEngagementOrder("anterior", [step(5, "right"), step(40, "left", { guide: true })])).toMatchObject({ ok: false, code: "rca-before-left-main" });
    expect(scoreEngagementOrder("anterior", []).code).toBe("not-engaged");
  });

  it("the live rule speaks and stops a run when the RCA is seated before the left is imaged in a non-anterior STEMI, and is silent otherwise", () => {
    const eng = new MentorEngine({ mode: "supervised", entrustment: 2 }, ACS_RULES);
    const input = (t: number, over: Partial<MentorInput> & { acs?: unknown } = {}): MentorInput =>
      ({ tWall: t, lab: "diagnostic", engagement: "non-selective", pressure: "aortic", sys: 120, dia: 70, resistance: 0, advancing: false, insertion: 0, aspirated: "clean", beam: 1, cArm: { laoRao: 0, cranialCaudal: 0 }, ...over }) as MentorInput;
    const said = [];
    const acs = { presentation: "non-anterior", leftImaged: false };
    for (let t = 0; t < 2; t += 0.1) said.push(...eng.step(input(t, { acs })));
    for (let t = 2; t < 12; t += 0.1) said.push(...eng.step(input(t, { engagement: "selective-rca", acs })));
    expect(said.filter((u) => u.ruleId === "stemi-rca-before-left").length).toBeGreaterThan(0);
    expect(eng.preAction("inject", input(12, { engagement: "selective-rca", acs })).allow).toBe(false);
    // the left already imaged, an anterior STEMI, or no ACS context: no prompt and no stop
    for (const ctx of [{ presentation: "non-anterior", leftImaged: true }, { presentation: "anterior", leftImaged: false }, undefined]) {
      const e2 = new MentorEngine({ mode: "supervised", entrustment: 2 }, ACS_RULES);
      const s2 = [];
      for (let t = 0; t < 12; t += 0.1) s2.push(...e2.step(input(t, { engagement: "selective-rca", acs: ctx })));
      expect(s2.filter((u) => u.ruleId === "stemi-rca-before-left")).toEqual([]);
      expect(e2.preAction("inject", input(12, { engagement: "selective-rca", acs: ctx })).allow).toBe(true);
    }
    for (const l of Object.values(ACS_RULES[0].lines)) expect(l!({} as never)).not.toMatch(/score|points|%|percent|grade|—/i);
  });

  it("is a rule group the registry collects (order 320) with no rule in RULES until the lab passes the ACS context", () => {
    expect(order).toBe(320);
    expect(rules).toEqual([]);
    expect(RULES.some((r) => r.id === "stemi-rca-before-left")).toBe(false);
  });
});

describe("the triage after a resuscitated arrest (cp-complex-patients-ohca)", () => {
  it("'immediate angiography' for a stable patient without ST elevation is scored against the class III recommendation", () => {
    const t = ACS_CASES["diag-ohca-no-st"].triage!;
    expect(t).toMatchObject({ stable: true, persistentStElevation: false });
    const v = scoreOhcaTriage({ choice: "immediate-angiography", padsOn: true, defibOperator: "cardiac-physiologist" }, t);
    expect(v.correct).toBe(false);
    expect(v.against).toEqual(OHCA_RECOMMENDATIONS.stableNoSt);
    expect(v.against).toMatchObject({ class: "III", level: "A", lessonId: "cp-complex-patients-ohca" });
    expect(scoreOhcaTriage({ choice: "intensive-care-first", padsOn: true, defibOperator: "cardiac-physiologist" }, t).correct).toBe(true);
  });

  it("persistent ST elevation goes to the lab whether or not the patient responds (class I, level B); the pads and a named defibrillator operator are scored apart", () => {
    for (const id of ["diag-ohca-st-elevation", "diag-ohca-post-rosc"]) {
      const t = ACS_CASES[id].triage!;
      expect(scoreOhcaTriage({ choice: "immediate-angiography", padsOn: true, defibOperator: "operator" }, t)).toMatchObject({ correct: true, teamReady: true, against: { class: "I", level: "B" } });
      expect(scoreOhcaTriage({ choice: "intensive-care-first", padsOn: false }, t)).toMatchObject({ correct: false, teamReady: false });
    }
    expect(scoreOhcaTriage({ choice: "immediate-angiography", padsOn: true }, { expected: "immediate-angiography", persistentStElevation: false, stable: false }).against).toBeNull();
    expect(triageProblems({ padsOn: false })).toHaveLength(3);
    expect(triageProblems({ choice: "intensive-care-first", padsOn: true, defibOperator: "nurse" })).toEqual([]);
  });

  it("the arrest scenarios carry the case events their tips need: post-arrest, and the vasopressor where the chart has one", () => {
    expect(diagScenarioById("diag-ohca-st-elevation")!.events).toEqual(expect.arrayContaining(["post-arrest", "stemi", "vasopressor"]));
    expect(diagScenarioById("diag-ohca-no-st")!.events).toContain("post-arrest");
    expect(diagScenarioById("diag-ohca-no-st")!.events).not.toContain("stemi");
  });
});

describe("the pre-brief ECG prediction", () => {
  it("grades territory, artery, level, activation and the extra leads the pattern needs", () => {
    const ecg = ACS_CASES["diag-stemi-inferior-rv"].ecg!;
    const right = gradeEcgPrediction({ territory: "inferior-rv", artery: "RCA", level: "proximal", activate: true, leads: ["right"] }, ecg);
    expect(right).toEqual({ territory: true, artery: true, level: true, activation: true, leads: true, correct: true });
    // calling it inferior without recording V4R misses the RV
    const missed = gradeEcgPrediction({ territory: "inferior", artery: "RCA", level: "distal", activate: true, leads: [] }, ecg);
    expect(missed).toMatchObject({ territory: false, level: false, leads: false, correct: false });
    // a bundle branch block: the artery is not graded, the activation is
    const lbbb = ACS_CASES["diag-lbbb-paced"].ecg!;
    expect(gradeEcgPrediction({ territory: "bundle-branch-or-paced", artery: "undetermined", level: "undetermined", activate: false, leads: [] }, lbbb)).toMatchObject({ artery: null, level: null, activation: false, correct: true });
    expect(ecgPredictionProblems(undefined)).toHaveLength(4);
    expect(ecgPredictionProblems({ territory: "anterior", artery: "LAD", level: "proximal", activate: false, leads: [] })).toEqual([]);
  });
});

describe("the culprit (pm-target-culprit) and the iatrogenic occlusion (cm-principles-closure-pmi)", () => {
  it("diag-two-candidate-culprits: the circumflex with at least two clues the case shows; the previous study is the decisive clue", () => {
    const t = ACS_CASES["diag-two-candidate-culprits"].culprit!;
    expect(diagScenarioById("diag-two-candidate-culprits")).toBeDefined();
    const v = scoreCulprit({ vessel: "LCx", clues: ["previous-study", "wall-motion", "ecg-territory"], workUp: [] }, t);
    expect(v).toMatchObject({ culprit: true, enoughClues: true, decisive: true, workUp: null });
    expect(v.unsupported).toEqual(["ecg-territory"]);
    // the chronic occlusion named for its collaterals is not the culprit
    expect(scoreCulprit({ vessel: "RCA", clues: ["no-collaterals", "thrombus-or-haze"], workUp: [] }, t).culprit).toBe(false);
    expect(culpritProblems({ vessel: "LCx", clues: ["wall-motion"], workUp: [] })).toEqual([`Name at least ${MIN_CULPRIT_CLUES} clues for the culprit`]);
    expect(culpritProblems(undefined)).toHaveLength(1);
  });

  it("diag-no-visible-culprit: none visible, and the work-up in the module's order", () => {
    const t = ACS_CASES["diag-no-visible-culprit"].culprit!;
    const order = ["review-runs", "ventriculogram-or-echo", "oct", "cardiac-mri"] as const;
    expect(scoreCulprit({ vessel: "none-visible", clues: [], workUp: [...order] }, t)).toMatchObject({ culprit: true, workUp: true });
    expect(scoreCulprit({ vessel: "none-visible", clues: [], workUp: ["oct", "review-runs", "ventriculogram-or-echo", "cardiac-mri"] }, t).workUp).toBe(false);
    expect(scoreCulprit({ vessel: "LCx", clues: ["thrombus-or-haze", "wall-motion"], workUp: [] }, t).culprit).toBe(false);
    expect(culpritProblems({ vessel: "none-visible", clues: [], workUp: ["review-runs"] })).toEqual(["Put the next steps in order"]);
  });

  it("the first measures: immediate PCI, no thrombolysis, no oxygen at a normal saturation, no routine balloon pump", () => {
    const t = ACS_CASES["diag-iatrogenic-occlusion"].iatrogenic!;
    expect(scoreIatrogenic(["immediate-pci"], t).correct).toBe(true);
    expect(scoreIatrogenic(["immediate-pci", "thrombolysis"], t)).toMatchObject({ correct: false, noLysis: false });
    expect(scoreIatrogenic(["immediate-pci", "oxygen"], t)).toMatchObject({ correct: false, oxygenRight: false });
    expect(scoreIatrogenic(["immediate-pci", "oxygen"], { ...t, air: true }).correct).toBe(true);
    expect(scoreIatrogenic(["immediate-pci", "oxygen"], { ...t, saturationPct: 86 }).correct).toBe(true);
    expect(scoreIatrogenic(["immediate-pci", "routine-balloon-pump"], t).correct).toBe(false);
    expect(scoreIatrogenic(["transfer"], { ...t, onsitePci: false }).correct).toBe(true);
    expect(scoreIatrogenic(["no-change-seen"], t).correct).toBe(false);
    expect(iatrogenicProblems([])).toHaveLength(1);
    expect(iatrogenicProblems(["no-change-seen"])).toEqual([]);
  });
});

describe("the reperfusion clock and the ledger", () => {
  it("counts from the STEMI diagnosis against Oxford's 120 minutes", () => {
    expect(REPERFUSION_LIMIT_MIN).toBe(120);
    expect(reperfusionClock(45, 0)).toEqual({ minutesSinceDiagnosis: 45, limitMin: 120, remainingMin: 75, over: false });
    expect(reperfusionClock(100, 30 * 60).over).toBe(true);
  });

  it("writes one record per decision the case asks, each with a lesson of the curriculum", () => {
    const lessons = new Set<string>();
    for (const t of TRACKS) for (const m of t.modules) for (const l of m.lessons) lessons.add(l.id);
    const eng = scoreEngagementOrder("non-anterior", [step(1, "right", { guide: true })]);
    const recs = acsDecisions(ACS_CASES["diag-ohca-st-elevation"], { caseId: "x", triage: { choice: "immediate-angiography", padsOn: true, defibOperator: "cardiac-physiologist" } }, { t: 12, engagement: eng });
    expect(recs.map((r) => r.id)).toEqual(["acs-ecg-territory", "acs-ecg-activation", "acs-ohca-triage", "acs-ohca-team", "acs-engagement-order"]);
    expect(recs.find((r) => r.id === "acs-ohca-triage")!.correct).toBe(true);
    expect(recs.find((r) => r.id === "acs-engagement-order")!.correct).toBe(false);
    expect(recs.find((r) => r.id === "acs-ecg-territory")!.correct).toBe(false);
    for (const c of Object.values(ACS_CASES)) for (const r of acsDecisions(c, undefined)) expect(lessons.has(r.lessonId!), r.id).toBe(true);
  });
});
