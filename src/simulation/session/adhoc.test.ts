// proc-adhoc-gate: the ad hoc or delayed PCI decision gate's rules, scenarios and links.
//   npx vitest run src/simulation/session/adhoc.test.ts
import { describe, it, expect } from "vitest";
import { newCaseSession, type CaseSession } from "./caseSession";
import {
  adHocInputs,
  adHocReportFrom,
  adHocTipIds,
  consentLimitFromText,
  deferralReasonsApplying,
  interruptAdHoc,
  interruptionDue,
  judgeAdHoc,
  openAdHocGate,
  recordAdHocDecision,
  timeOfDay,
  DEFAULT_CENTRE,
  type AdHocInputs,
} from "./adhoc";
import { scenarios as ADHOC_SCENARIOS, ADHOC_DIAGNOSTIC, ADHOC_FINDINGS, LATE_START_MIN } from "./scenarios/adhoc";
import { launch as adhocLaunch } from "./scenarios/adhoc.launch";
import { SCENARIO_BY_ID } from "./scenarios/index";
import { TIP_BY_ID } from "../../content/lab/tips";
import { DEFERRAL_REASONS, SIGNIFICANT_PCT } from "../../mentor/report";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";

const open = (id: string) => newCaseSession({ scenario: id }).session;
const inputsOf = (s: CaseSession) => adHocInputs(s, openAdHocGate(s));
const decision = (s: CaseSession, id: string) => s.decisions().find((d) => d.id === id);

/** Inputs for the pure rules: a stable patient with simple disease, everything covered, nothing wrong. */
function base(over: Partial<AdHocInputs> = {}): AdHocInputs {
  return {
    indication: "SA",
    acs: false,
    activeIschaemia: false,
    chestPain: 0,
    anatomy: { unprotectedLm: false, cto: false, multivessel: false, bifurcation: false, severeCalcium: false },
    consent: { limit: "target-only", wording: "Signed for coronary angiography and possible angioplasty." },
    contrast: { usedMl: 70, budgetMl: 300, remainingMl: 230 },
    fluoroS: 240,
    karMGy: 350,
    kapGyCm2: 25,
    contrastHigh: false,
    doseHigh: false,
    complications: [],
    majorComplication: false,
    centre: { ...DEFAULT_CENTRE },
    clockMin: 9 * 60,
    interruption: null,
    facts: {},
    report: null,
    ...over,
  };
}

describe("ad hoc gate: the acceptance cases", () => {
  it("'adhoc-left-main-stable' scores proceed wrong and defer with 'anatomy' correct", () => {
    const s1 = open("adhoc-left-main-stable");
    const i1 = inputsOf(s1);
    expect(i1.anatomy.unprotectedLm).toBe(true);
    expect(i1.acs).toBe(false);
    expect(deferralReasonsApplying(i1)).toContain("anatomy");
    const p = recordAdHocDecision(s1, i1, "proceed", []);
    expect(p.correct).toBe(false);
    expect(decision(s1, "adhoc-decision")).toMatchObject({ correct: false, given: "Ad hoc PCI now", lessonId: "pm-target-timing" });
    // the reasons checklist is scored too: every applying reason was missed
    expect(decision(s1, "adhoc-deferral-reasons")!.correct).toBe(false);
    s1.dispose();

    const s2 = open("adhoc-left-main-stable");
    const d = recordAdHocDecision(s2, inputsOf(s2), "defer", ["anatomy"]);
    expect(d.correct).toBe(true);
    expect(decision(s2, "adhoc-decision")).toMatchObject({ correct: true });
    expect(decision(s2, "adhoc-decision")!.given).toContain("anatomy");
    // the deferral leaves a staged-PCI note on the case
    expect(s2.log.some((l) => /deferred: staged PCI/i.test(l.text))).toBe(true);
    s2.dispose();

    // with no study report the note names the case's significant lesions, most severe first
    const s3 = open("adhoc-consent-diagnostic-only");
    const i3 = inputsOf(s3);
    expect(i3.lesionVessels).toEqual(["LAD"]);
    recordAdHocDecision(s3, i3, "defer", ["consent"]);
    const note = s3.log.find((l) => /deferred: staged PCI/i.test(l.text))!.text;
    expect(note).toContain("staged PCI of the LAD lesion to be planned");
    expect(note).not.toContain("the lesion found");
    s3.dispose();
  });

  it("'adhoc-acs-ongoing' scores proceed correct (and deferring wrong)", () => {
    const s = open("adhoc-acs-ongoing");
    const i = inputsOf(s);
    expect(i.acs).toBe(true);
    expect(i.activeIschaemia).toBe(true);
    expect(deferralReasonsApplying(i)).toEqual([]);
    expect(recordAdHocDecision(s, i, "proceed", []).correct).toBe(true);
    expect(decision(s, "adhoc-decision")).toMatchObject({ correct: true });
    // ad hoc PCI with nothing to defer for: the checklist is not scored
    expect(decision(s, "adhoc-deferral-reasons")).toBeUndefined();
    expect(judgeAdHoc(i, "defer", ["people"]).correct).toBe(false);
    s.dispose();
  });

  it("a consent limit of diagnostic only makes proceed wrong regardless of anatomy", () => {
    const diagOnly = { limit: "diagnostic-only" as const, wording: "Signed for diagnostic coronary angiography only." };
    const anatomies: AdHocInputs["anatomy"][] = [
      { unprotectedLm: false, cto: false, multivessel: false, bifurcation: false, severeCalcium: false },
      { unprotectedLm: true, cto: false, multivessel: false, bifurcation: false, severeCalcium: false },
      { unprotectedLm: false, cto: true, multivessel: false, bifurcation: false, severeCalcium: false },
      { unprotectedLm: false, cto: false, multivessel: true, bifurcation: true, severeCalcium: true },
    ];
    for (const anatomy of anatomies) {
      for (const acs of [false, true]) {
        const i = base({ anatomy, acs, activeIschaemia: acs, indication: acs ? "STEMI" : "SA", consent: diagOnly });
        expect(deferralReasonsApplying(i), JSON.stringify({ anatomy, acs })).toContain("consent");
        expect(judgeAdHoc(i, "proceed", []).correct, JSON.stringify({ anatomy, acs })).toBe(false);
        expect(judgeAdHoc(i, "defer", ["consent"]).correct).toBe(true);
      }
      // the same anatomy with a consent that covers any PCI: consent is not the reason
      expect(deferralReasonsApplying(base({ anatomy, consent: { limit: "any", wording: "" } }))).not.toContain("consent");
    }
    // the scenario: a simple single-vessel case, consent for the diagnostic study only
    const s = open("adhoc-consent-diagnostic-only");
    const i = inputsOf(s);
    expect(i.consent.limit).toBe("diagnostic-only");
    expect(i.anatomy).toEqual({ unprotectedLm: false, cto: false, multivessel: false, bifurcation: false, severeCalcium: false });
    expect(deferralReasonsApplying(i)).toEqual(["consent"]);
    expect(recordAdHocDecision(s, i, "proceed", []).correct).toBe(false);
    s.dispose();
  });
});

describe("ad hoc gate: the rules", () => {
  it("stable patients: each reason applies on its facts; none applies to a simple case", () => {
    expect(deferralReasonsApplying(base())).toEqual([]);
    expect(judgeAdHoc(base(), "proceed", []).correct).toBe(true);
    // deferral is never wrong in a stable patient with a stated reason, and is wrong without one
    expect(judgeAdHoc(base(), "defer", ["choice"]).correct).toBe(true);
    expect(judgeAdHoc(base(), "defer", []).correct).toBe(false);
    expect(deferralReasonsApplying(base({ contrastHigh: true }))).toEqual(["dose"]);
    expect(deferralReasonsApplying(base({ doseHigh: true }))).toEqual(["dose"]);
    expect(deferralReasonsApplying(base({ majorComplication: true }))).toEqual(["complication"]);
    expect(deferralReasonsApplying(base({ report: { decision: "adhoc", reasons: [], target: null, complication: true } }))).toEqual(["complication"]);
    expect(deferralReasonsApplying(base({ interruption: { kind: "stemi-call", text: "call", at: 10 } }))).toEqual(["people"]);
    expect(deferralReasonsApplying(base({ facts: { fatigue: "The operator has been in the lab since 7 am." } }))).toEqual(["people"]);
    expect(deferralReasonsApplying(base({ facts: { preparation: "No aspirin before the study." } }))).toEqual(["preparation"]);
    expect(deferralReasonsApplying(base({ facts: { patientWishes: "Would rather go home and think." } }))).toEqual(["choice"]);
    expect(deferralReasonsApplying(base({ facts: { symptomsUncertain: true } }))).toEqual(["symptoms"]);
    // no evidence of ischaemia matters only without a pressure wire and imaging
    expect(deferralReasonsApplying(base({ facts: { ischaemiaEvidence: false } }))).toEqual([]);
    expect(deferralReasonsApplying(base({ facts: { ischaemiaEvidence: false }, centre: { ...DEFAULT_CENTRE, physiology: false, imaging: false } }))).toEqual(["symptoms"]);
    // place: no surgery on site with complex anatomy; no CTO programme for a CTO; no atherectomy for severe calcium
    const lm = { ...base().anatomy, unprotectedLm: true };
    expect(deferralReasonsApplying(base({ anatomy: lm, consent: { limit: "any", wording: "" }, centre: { ...DEFAULT_CENTRE, onSiteSurgery: false } }))).toEqual(["anatomy", "place"]);
    expect(deferralReasonsApplying(base({ anatomy: { ...base().anatomy, severeCalcium: true }, centre: { ...DEFAULT_CENTRE, atherectomy: false } }))).toEqual(["place"]);
  });

  it("ACS with active ischaemia: ad hoc PCI even with complex anatomy, a complication or a call; without active ischaemia the reasons apply", () => {
    const busy = { anatomy: { unprotectedLm: false, cto: false, multivessel: true, bifurcation: false, severeCalcium: false }, majorComplication: true, interruption: { kind: "stemi-call" as const, text: "call", at: 5 } };
    const active = base({ ...busy, indication: "STEMI", acs: true, activeIschaemia: true });
    expect(deferralReasonsApplying(active)).toEqual([]);
    expect(judgeAdHoc(active, "proceed", []).correct).toBe(true);
    const quiet = base({ ...busy, indication: "NSTEMI", acs: true, activeIschaemia: false });
    expect(deferralReasonsApplying(quiet)).toEqual(["anatomy", "consent", "complication", "people"]);
    expect(judgeAdHoc(quiet, "proceed", []).correct).toBe(false);
  });

  it("the reasons checklist: every applying reason and none that does not", () => {
    const i = base({ anatomy: { ...base().anatomy, multivessel: true } });
    expect(deferralReasonsApplying(i)).toEqual(["anatomy", "consent"]);
    expect(judgeAdHoc(i, "defer", ["anatomy"])).toMatchObject({ correct: true, reasonsCorrect: false, missed: ["consent"], extra: [] });
    expect(judgeAdHoc(i, "defer", ["anatomy", "consent"])).toMatchObject({ correct: true, reasonsCorrect: true });
    expect(judgeAdHoc(i, "defer", ["anatomy", "consent", "dose"])).toMatchObject({ correct: true, reasonsCorrect: false, extra: ["dose"] });
    // a deferral that names only reasons the case does not have is wrong
    expect(judgeAdHoc(i, "defer", ["dose"]).correct).toBe(false);
  });

  it("consent wording: diagnostic only, a simple ad hoc PCI or any PCI", () => {
    expect(consentLimitFromText("Signed for diagnostic coronary angiography only.")).toBe("diagnostic-only");
    expect(consentLimitFromText("Signed for coronary angiography.")).toBe("diagnostic-only");
    expect(consentLimitFromText("Signed for coronary angiography and possible angioplasty.")).toBe("target-only");
    expect(consentLimitFromText("Signed for coronary angiography and PCI.")).toBe("target-only");
    expect(consentLimitFromText("Signed for coronary angiography and any PCI judged necessary, including complex PCI.")).toBe("any");
    // 'only' limits the PCI here, not the study: ad hoc PCI of the lesion found
    expect(consentLimitFromText("Signed for coronary angiography and PCI of the culprit lesion only.")).toBe("target-only");
    expect(consentLimitFromText("Signed for coronary angiography only; no angioplasty today.")).toBe("diagnostic-only");
    expect(consentLimitFromText("Signed for the diagnostic study alone, not for PCI.")).toBe("diagnostic-only");
  });

  it("the study report: its decision, reasons, target and complication reach the gate", () => {
    const target = { vessel: "LAD" as const, segment: "Mid LAD" as const, qcaPct: 80, lengthMm: 18, lesionId: "LAD@0.400", strategy: "adhoc" as const };
    const r = adHocReportFrom({ report: { decision: "adhoc", reasons: ["dose"] }, comparison: { study: { deferralApplies: ["complication"] } }, pciTarget: target });
    expect(r).toEqual({ decision: "adhoc", reasons: ["dose"], target, complication: true });
    expect(adHocReportFrom(null)).toBeNull();
    // the decision carries the report's target with the strategy decided at the gate
    const s = open("adhoc-acs-ongoing");
    const out = recordAdHocDecision(s, { ...inputsOf(s), report: r }, "proceed", []);
    expect(out.target).toEqual({ ...target, strategy: "adhoc" });
    s.dispose();
  });

  it("every tip a decision names resolves, and the reasons are Brilakis's list", () => {
    const all = base({ anatomy: { unprotectedLm: true, cto: true, multivessel: true, bifurcation: false, severeCalcium: false }, contrastHigh: true });
    const ids = adHocTipIds(all, deferralReasonsApplying(all));
    expect(ids).toEqual(["diag-ad-hoc-pause", "diag-stop-for-heart-team", "diag-planning-ad-hoc-consent", "diag-cto-strategy-defer-adhoc", "pci-stage-on-dose"]);
    for (const id of ids) expect(TIP_BY_ID[id], id).toBeDefined();
    expect(DEFERRAL_REASONS.map((r) => r.id)).toEqual(["anatomy", "dose", "place", "consent", "symptoms", "complication", "people", "preparation", "choice"]);
  });
});

describe("ad hoc gate: the scenarios", () => {
  it("each scenario's own anatomy and facts give the reasons it teaches", () => {
    const want: Record<string, string[]> = {
      "adhoc-left-main-stable": ["anatomy", "consent"],
      "adhoc-cto-stable": ["anatomy", "consent"],
      "adhoc-mvd-stable": ["anatomy", "consent"],
      "adhoc-acs-ongoing": [],
      "adhoc-consent-diagnostic-only": ["consent"],
      "adhoc-complication": ["complication"],
      // the call has not come in yet: until it does nothing applies
      "adhoc-late-evening-stemi-call": [],
    };
    expect(ADHOC_SCENARIOS.map((x) => x.id)).toEqual(Object.keys(want));
    for (const sc of ADHOC_SCENARIOS) {
      const s = open(sc.id);
      expect(s.catheter?.inBody, sc.id).toBe(true);
      expect(s.labsDone, sc.id).toContain("diagnostic");
      const i = inputsOf(s);
      expect(deferralReasonsApplying(i), sc.id).toEqual(want[sc.id]);
      // the diagnostic study's contrast and dose are on the case
      expect(i.contrast.usedMl, sc.id).toBeCloseTo(ADHOC_DIAGNOSTIC.contrastMl, 0);
      expect(i.karMGy, sc.id).toBeGreaterThanOrEqual(ADHOC_DIAGNOSTIC.karMGy);
      expect(i.contrastHigh || i.doseHigh, sc.id).toBe(false);
      // the autopilot's decisions are not the learner's
      expect(s.decisions().filter((d) => d.id.startsWith("adhoc-")), sc.id).toEqual([]);
      s.dispose();
    }
    expect(inputsOf(open("adhoc-cto-stable")).anatomy.cto).toBe(true);
    expect(inputsOf(open("adhoc-mvd-stable")).anatomy.multivessel).toBe(true);
  });

  it("each scenario's gate has the team's report of the study, naming every significant lesion's vessel; the log agrees on the contrast", () => {
    const NAME: Record<string, string> = { LM: "left main", LAD: "LAD", D1: "first diagonal", LCx: "circumflex", RCA: "right coronary" };
    for (const sc of ADHOC_SCENARIOS) {
      const s = open(sc.id);
      const i = inputsOf(s);
      expect(i.facts.studyFindings, sc.id).toBe(ADHOC_FINDINGS[sc.id]);
      for (const l of s.caseData.lesions.filter((x) => x.severity >= SIGNIFICANT_PCT)) {
        expect(NAME[l.vessel], `${sc.id} ${l.vessel}`).toBeDefined();
        expect(i.facts.studyFindings, `${sc.id} ${l.vessel}`).toContain(NAME[l.vessel]);
      }
      expect(i.facts.studyFindings, sc.id).toMatch(s.caseData.dominance === "left" ? /Left dominant/ : /Right dominant/);
      // one return from the angiography, with the study's contrast
      const returns = s.log.filter((l) => /^Back from the angiography/.test(l.text)).map((l) => l.text);
      expect(returns, sc.id).toEqual([`Back from the angiography: contrast ${ADHOC_DIAGNOSTIC.contrastMl} mL so far.`]);
      s.dispose();
    }
  });

  it("the diagnostic study's dose is the lab's: the access stage's own fluoroscopy does not overwrite it", () => {
    const s = open("adhoc-left-main-stable");
    // the Fluoroscopy workspace books its own tracker's totals, which start at zero
    s.setOwnDose({ fluoroS: 0, karMGy: 0, kapGyCm2: 0 });
    const i = inputsOf(s);
    expect(i.fluoroS).toBeGreaterThanOrEqual(ADHOC_DIAGNOSTIC.fluoroS);
    expect(i.karMGy).toBeGreaterThanOrEqual(ADHOC_DIAGNOSTIC.karMGy);
    expect(i.kapGyCm2).toBeGreaterThanOrEqual(ADHOC_DIAGNOSTIC.kapGyCm2);
    s.dispose();
  });

  it("adhoc-late-evening-stemi-call: the call comes in while the decision is pending, and then 'people' applies", () => {
    const s = open("adhoc-late-evening-stemi-call");
    let g = openAdHocGate(s);
    expect(g.interruption?.kind).toBe("stemi-call");
    expect(timeOfDay(adHocInputs(s, g).clockMin)).toMatch(/^19:/);
    expect(adHocInputs(s, g).clockMin).toBeGreaterThanOrEqual(LATE_START_MIN);
    expect(interruptionDue(g, s.tS)).toBe(false);
    // deciding before its time brings the call in now
    expect(interruptionDue(g, s.tS, true)).toBe(true);
    // or the clock does
    expect(interruptionDue(g, s.tS + g.interruption!.afterS)).toBe(true);
    g = interruptAdHoc(s, g);
    expect(g.interruptedAt).not.toBeNull();
    expect(interruptionDue(g, s.tS + 999)).toBe(false);
    expect(s.log.some((l) => /STEMI/.test(l.text))).toBe(true);
    const i = adHocInputs(s, g);
    expect(i.interruption?.kind).toBe("stemi-call");
    expect(deferralReasonsApplying(i)).toEqual(["people"]);
    expect(recordAdHocDecision(s, i, "proceed", []).correct).toBe(false);
    s.dispose();
  });

  it("a case without a scenario setting gets the occasional seeded call, the same for the same seed", () => {
    let calls = 0;
    for (let k = 0; k < 60; k++) {
      const g = openAdHocGate({ tS: 0, seed: `adhoc-random-${k}`, scenario: SCENARIO_BY_ID["default"] });
      expect(openAdHocGate({ tS: 0, seed: `adhoc-random-${k}`, scenario: SCENARIO_BY_ID["default"] }).interruption).toEqual(g.interruption);
      if (g.interruption) calls++;
    }
    expect(calls).toBeGreaterThan(0);
    expect(calls).toBeLessThan(20);
    // a scenario that sets none has none
    expect(openAdHocGate({ tS: 0, seed: "x", scenario: SCENARIO_BY_ID["adhoc-left-main-stable"] }).interruption).toBeNull();
  });
});

describe("ad hoc gate: links", () => {
  it("practiceIndex lists the scenarios adhoc-left-main-stable, adhoc-cto-stable, adhoc-mvd-stable under lessons pm-target-timing (from src/simulation/session/scenarios/adhoc.launch.ts)", () => {
    const entries = practiceForLesson("pm-target-timing").filter((e) => e.sim === "procedure");
    for (const id of ["adhoc-left-main-stable", "adhoc-cto-stable", "adhoc-mvd-stable", "adhoc-acs-ongoing", "adhoc-consent-diagnostic-only", "adhoc-complication", "adhoc-late-evening-stemi-call"])
      expect(entries.some((e) => e.scenario === id && e.params.scenario === id), id).toBe(true);
    for (const id of ["adhoc-left-main-stable", "adhoc-mvd-stable"]) expect(practiceForLesson("pm-target-heart-team").some((e) => e.sim === "procedure" && e.scenario === id), id).toBe(true);
    expect(practiceForLesson("pm-planning-consent").some((e) => e.sim === "procedure" && e.scenario === "adhoc-consent-diagnostic-only")).toBe(true);
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("adhoc.launch"))).toEqual([]);
  });

  it("the launch file and the scenario file agree", () => {
    expect(adhocLaunch.sim).toBe("procedure");
    expect(adhocLaunch.scenarios!.map((x) => x.id)).toEqual(ADHOC_SCENARIOS.map((x) => x.id));
    for (const sc of adhocLaunch.scenarios ?? []) {
      expect(SCENARIO_BY_ID[sc.id].title).toBe(sc.title);
      expect(SCENARIO_BY_ID[sc.id].lessonIds).toEqual(sc.lessonIds);
      expect(SCENARIO_BY_ID[sc.id].start).toBe("post-diagnostic");
      expect(sc.heldOut).toBeFalsy();
    }
  });
});
