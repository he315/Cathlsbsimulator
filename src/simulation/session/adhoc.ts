// ---------------------------------------------------------------------------
// The ad hoc or delayed PCI decision gate (proc-adhoc-gate).
//
// At the end of the diagnostic stage of the full case the learner decides
// between ad hoc PCI on the same table and stopping to plan (delayed PCI),
// and ticks the reasons to defer that apply. The gate shows what an operator
// has in front of them at that moment: the contrast used against the case's
// budget, the screening time, air kerma and kerma-area product, the consent
// wording, the centre's capabilities, any complication so far, the time of
// day, the patient's symptoms now, the study report's decision and target,
// and, in some cases, a STEMI call that interrupts while the decision is
// pending. A case that opens after the study shows the team's report of its
// findings (the scenario's studyFindings) until the learner files a study
// report of their own. It never shows which reasons apply: that is the debrief's.
//
// Sources (module text):
//   the reasons to defer and their wording   DEFERRAL_REASONS in src/mentor/report.ts
//                                            (pm-target-timing, Brilakis 7.3, after the SCAI
//                                            consensus; 10-target.ts:633-647)
//   ad hoc PCI in ACS with active ischaemia  pm-target-timing table (Brilakis 7.3.1;
//                                            10-target.ts:626): 'needed in most ACS patients with
//                                            active ischaemia'; delayed PCI for stable patients, or
//                                            ACS without active ischaemia, when a reason applies
//   a STEMI call as a scheduling clash       pm-target-timing, 'People' (10-target.ts:643)
//   the consent covering the risk            pm-planning-consent (diag-planning-ad-hoc-consent)
//   contrast warning threshold               CONTRAST_BUDGET_DEFAULTS.warnFraction (MODEL,
//                                            LAB_BUILD_PLAN section 4)
//   radiation follow-up trigger levels       DOSE_TRIGGERS (src/simulation/dose.ts)
// MODEL PARAMETERS (docs/realism/facts/pkg-proc-adhoc-gate.md): MP_ADHOC below,
// DEFAULT_CENTRE, the consent-wording rule (consentLimitFromText) and which
// complications count.
//
// The rules (deferralReasonsApplying):
//   ACS with active ischaemia (ST elevation, chest pain or regional
//   ischaemia now): ad hoc PCI; only a consent limited to the diagnostic
//   study stops it.
//   Otherwise each reason applies on its facts:
//     anatomy       unprotected left main, a chronic total occlusion,
//                   multivessel disease or a bifurcation lesion
//     dose          contrast at the warning threshold of the budget, or a
//                   radiation follow-up trigger level reached
//     place         no on-site surgery with complex anatomy, or no CTO
//                   programme for a CTO, or no atherectomy for severe calcium
//     consent       diagnostic only; or ad hoc PCI of a simple lesion with
//                   complex anatomy found (the study report's model rule)
//     symptoms      the scenario's uncertain symptoms, or no evidence of
//                   ischaemia with neither pressure wire nor imaging
//     complication  a major complication recorded so far, or one the study
//                   report records
//     people        a STEMI call has come in, or the scenario's fatigue
//     preparation   the scenario's preparation gap
//     choice        the patient prefers to wait
// Scoring (judgeAdHoc): 'proceed' is correct when no reason applies;
// 'defer' is correct when a reason applies and the learner names at least
// one that does, or, in a stable patient with none, when the learner gives a
// reason (deferral is never wrong there). The reasons checklist is scored
// separately: every reason that applies, and none that does not.
//
// The gate writes two ledger records (session.decide): 'adhoc-decision' and
// 'adhoc-deferral-reasons', and on 'defer' a staged-PCI note in the case log.
// While it is open the case reports the diagnostic finish phase with
// 'high-contrast-volume' and 'high-radiation-dose' when present
// (adHocTipContext; `raises` below).
//
// Engine-side and DOM-free; CaseSession is imported as a type only.
// ---------------------------------------------------------------------------

import type { CaseSession } from "./caseSession";
import type { AdHocConsent, ContrastState, PciTarget } from "./handover";
import type { LabContext, LabEvent } from "../../content/lab/tips";
import type { LabRaises } from "../../content/lab/raisable/waiting";
import type { Indication } from "../patient/patient";
import { DEFERRAL_REASONS, DEFERRAL_SOURCE, SIGNIFICANT_PCT, STUDY_DECISION_LABEL, complexAnatomy, studyTruth, type DeferralReason, type StudyDecision } from "../../mentor/report";
import { CONTRAST_BUDGET_DEFAULTS } from "../patient/contrastBudget";
import { DOSE_TRIGGERS } from "../dose";
import { SeededRng } from "../patient/rng";

// --- settings ------------------------------------------------------------------------------------

/** The gate's settings. MODEL PARAMETERS (docs/realism/facts/pkg-proc-adhoc-gate.md). */
export const MP_ADHOC = {
  /** chest pain (0-10, the patient engine's score) from which an ACS patient has active ischaemia */
  chestPainActive: 3,
  /** regional ischaemia (0-1, the engine's territory index) from which an ACS patient has active ischaemia */
  ischaemiaActive: 0.2,
  /** the chance that a case without a scenario setting gets a STEMI call while the gate is open */
  stemiCallChance: 0.1,
  /** seconds after the gate opens that such a call comes in (it comes sooner if the learner decides first) */
  stemiCallAfterS: 25,
  /** the time of day a case starts when its scenario sets none, minutes after midnight (08:30) */
  clockStartMin: 8 * 60 + 30,
};

/** Recorded complications that are process errors caught before harm, not complications of the study (MODEL). */
const PROCESS_ERRORS = new Set(["no-time-out", "air-in-line"]);

// --- types ---------------------------------------------------------------------------------------

export type AdHocChoice = "proceed" | "defer";
export const AD_HOC_CHOICE_LABEL: Record<AdHocChoice, string> = { proceed: "Ad hoc PCI now", defer: "Defer: stop and plan" };

/** What the centre can offer for this PCI. */
export interface CentreCapabilities {
  onSiteSurgery: boolean;
  /** intravascular imaging (IVUS or OCT) */
  imaging: boolean;
  /** a pressure wire (FFR or a non-hyperaemic index) */
  physiology: boolean;
  /** rotational or orbital atherectomy, or intravascular lithotripsy */
  atherectomy: boolean;
  /** percutaneous mechanical circulatory support */
  mcs: boolean;
  /** an operator and equipment for CTO PCI */
  ctoProgramme: boolean;
}

/** The centre a case has when its scenario sets none: everything on site (MODEL, so random cases are unchanged by the place rule). */
export const DEFAULT_CENTRE: CentreCapabilities = { onSiteSurgery: true, imaging: true, physiology: true, atherectomy: true, mcs: true, ctoProgramme: true };

export const CENTRE_LABEL: Record<keyof CentreCapabilities, string> = {
  onSiteSurgery: "Cardiac surgery on site",
  imaging: "Intravascular imaging",
  physiology: "Pressure wire",
  atherectomy: "Atherectomy or lithotripsy",
  mcs: "Mechanical circulatory support",
  ctoProgramme: "CTO programme",
};

/** A call that interrupts the decision. */
export interface AdHocInterruption {
  kind: "stemi-call";
  /** seconds after the gate opens */
  afterS: number;
  /** what the caller says */
  text: string;
}

/** What a scenario sets for the gate (ProcedureScenario & { adhoc }). Every field is optional. */
export interface AdHocSetup {
  /** the gate is open when the case opens */
  openAtStart?: boolean;
  /** what the consent covers, with the form's wording (else the session's consent, else the chart's consent form) */
  consent?: { limit: AdHocConsent; wording: string };
  centre?: Partial<CentreCapabilities>;
  /** the time of day the case started, minutes after midnight */
  clockStartMin?: number;
  /** a call while the decision is pending; null: none (no seeded call either) */
  interruption?: AdHocInterruption | null;
  /** the patient's symptoms are uncertain (the history says so) */
  symptomsUncertain?: boolean;
  /** false: no non-invasive evidence of ischaemia */
  ischaemiaEvidence?: boolean;
  /** what the operator or the patient is short of (shown on the gate) */
  fatigue?: string;
  /** a preparation gap (shown on the gate), e.g. no aspirin before the study */
  preparation?: string;
  /** the patient's wishes (shown on the gate) */
  patientWishes?: string;
  /**
   * the diagnostic study's findings as the team reported them (shown on the gate when the learner has
   * filed no study report of their own): a case that opens after the study has the learner's only view
   * of the anatomy here, unless they review the angiogram in the diagnostic lab
   */
  studyFindings?: string;
}

/** The setup a scenario object carries (read structurally: the scenario registry is not imported here). */
export function adHocSetupOf(scenario: unknown): AdHocSetup | null {
  const a = (scenario as { adhoc?: AdHocSetup } | null | undefined)?.adhoc;
  return a && typeof a === "object" ? a : null;
}

/** What the gate reads from the submitted study report (src/state/useSimulatorStore.ts SubmittedStudyReport). */
export interface AdHocReportInput {
  report: { decision?: StudyDecision; reasons: readonly DeferralReason[] };
  comparison?: { study?: { deferralApplies: readonly DeferralReason[] } };
  pciTarget: PciTarget | null;
}

/** The study report as the gate shows it. */
export interface AdHocReport {
  decision: StudyDecision | null;
  reasons: DeferralReason[];
  target: PciTarget | null;
  /** the study report recorded a complication of the study */
  complication: boolean;
}

export function adHocReportFrom(r: AdHocReportInput | null | undefined): AdHocReport | null {
  if (!r) return null;
  return {
    decision: r.report.decision ?? null,
    reasons: [...r.report.reasons],
    target: r.pciTarget ? { ...r.pciTarget } : null,
    complication: !!r.comparison?.study?.deferralApplies.includes("complication"),
  };
}

/** The gate's state while the case is at it (kept by the procedure store). */
export interface AdHocGateState {
  /** session time the gate opened (s) */
  openedAt: number;
  /** the call that will interrupt, or null */
  interruption: AdHocInterruption | null;
  /** session time the call came in, or null */
  interruptedAt: number | null;
  /** session time the learner acknowledged the call, or null */
  acknowledgedAt: number | null;
  outcome: AdHocOutcome | null;
}

export interface AdHocOutcome {
  t: number;
  choice: AdHocChoice;
  reasons: DeferralReason[];
  /** the reasons that applied (for the debrief and the tests; never shown before the decision) */
  applies: DeferralReason[];
  correct: boolean;
  /** null when the reasons checklist was not scored (ad hoc PCI with no reason applying) */
  reasonsCorrect: boolean | null;
  /** the PCI target the decision carries (the study report's, with the strategy of the decision) */
  target: PciTarget | null;
}

/** Everything the gate shows and the rules read. */
export interface AdHocInputs {
  indication: Indication;
  acs: boolean;
  /** ACS with ST elevation, chest pain or regional ischaemia now (never shown as such) */
  activeIschaemia: boolean;
  /** chest pain now, 0-10 */
  chestPain: number;
  anatomy: { unprotectedLm: boolean; cto: boolean; multivessel: boolean; bifurcation: boolean; severeCalcium: boolean };
  consent: { limit: AdHocConsent; wording: string };
  contrast: ContrastState;
  fluoroS: number;
  karMGy: number;
  kapGyCm2: number;
  contrastHigh: boolean;
  doseHigh: boolean;
  complications: { id: string; label: string; severity: "minor" | "major" }[];
  /** a major complication so far (MODEL: process errors caught before harm do not count) */
  majorComplication: boolean;
  centre: CentreCapabilities;
  /** time of day now, minutes after midnight */
  clockMin: number;
  /** the call, once it has come in */
  interruption: { kind: AdHocInterruption["kind"]; text: string; at: number } | null;
  facts: Pick<AdHocSetup, "symptomsUncertain" | "ischaemiaEvidence" | "fatigue" | "preparation" | "patientWishes" | "studyFindings">;
  report: AdHocReport | null;
  /** the vessels of the significant lesions, most severe first (the case truth; never shown on the gate, named in the staged-PCI note when no report names a target) */
  lesionVessels?: string[];
}

/** What adHocInputs reads from the session. */
export type AdHocSource = Pick<CaseSession, "profile" | "caseData" | "patient" | "activeEvents" | "complications" | "contrastNow" | "totals" | "tS" | "seed" | "scenario" | "chart">;

// --- consent -------------------------------------------------------------------------------------

/**
 * What a consent form's wording covers (MODEL rule): no mention of angioplasty or PCI, the diagnostic
 * study (or the angiography) 'only' or 'alone', or 'no PCI' is the diagnostic study only; 'any PCI' or
 * 'complex' is any PCI; otherwise ad hoc PCI of the lesion found ('PCI of the culprit lesion only' is
 * that, not the diagnostic study only).
 */
export function consentLimitFromText(text: string): AdHocConsent {
  const t = text.toLowerCase();
  const pci = /angioplasty|\bpci\b|stent/.test(t);
  const diagnosticOnly = /diagnostic[^.]*\bonly\b|\b(angiography|angiogram|study) only\b|diagnostic (study|angiography) alone|\bno (angioplasty|pci|stent)|\bnot (for |to include )?(angioplasty|pci|stent)/;
  if (!pci || diagnosticOnly.test(t)) return "diagnostic-only";
  if (/\bany (pci|angioplasty)|complex|including left main/.test(t)) return "any";
  return "target-only";
}

function consentOf(s: AdHocSource, setup: AdHocSetup | null): AdHocInputs["consent"] {
  const wording = s.chart?.["consent-form"]?.text ?? "";
  if (setup?.consent) return { limit: setup.consent.limit, wording: setup.consent.wording };
  // the hand-over contract's consent limit, once the session carries one (proc-consent-conversation)
  const limit = (s as unknown as { consent?: { adHocLimit?: AdHocConsent } }).consent?.adHocLimit;
  if (limit) return { limit, wording };
  return { limit: consentLimitFromText(wording), wording };
}

// --- the gate ------------------------------------------------------------------------------------

/** Open the gate now: the call that will interrupt comes from the scenario, or (rarely) from the case's seed. */
export function openAdHocGate(s: Pick<CaseSession, "tS" | "seed" | "scenario">): AdHocGateState {
  const setup = adHocSetupOf(s.scenario);
  let interruption: AdHocInterruption | null = null;
  if (setup && "interruption" in setup) interruption = setup.interruption ? { ...setup.interruption } : null;
  else if (new SeededRng(`adhoc-call:${s.seed}`).chance(MP_ADHOC.stemiCallChance)) interruption = { kind: "stemi-call", afterS: MP_ADHOC.stemiCallAfterS, text: STEMI_CALL_TEXT };
  return { openedAt: s.tS, interruption, interruptedAt: null, acknowledgedAt: null, outcome: null };
}

/** What the switchboard says on a STEMI call (wording, not a clinical value). */
export const STEMI_CALL_TEXT = "Switchboard: the ambulance service has an inferior STEMI 15 minutes out and needs this lab and team.";

/** The call is due: its time has come, or the learner is deciding (it interrupts the pending decision). */
export function interruptionDue(g: AdHocGateState, tS: number, deciding = false): boolean {
  if (!g.interruption || g.interruptedAt !== null || g.outcome) return false;
  return deciding || tS - g.openedAt >= g.interruption.afterS;
}

/** The call comes in: logged on the case (the gate shows it until it is acknowledged). */
export function interruptAdHoc(s: Pick<CaseSession, "tS" | "logEntry">, g: AdHocGateState): AdHocGateState {
  if (!g.interruption || g.interruptedAt !== null) return g;
  s.logEntry("event", g.interruption.text);
  return { ...g, interruptedAt: round1(s.tS) };
}

/** The anatomy as the rules read it (the case truth; never shown on the gate). */
export function adHocAnatomy(c: CaseSession["caseData"]): AdHocInputs["anatomy"] {
  const t = studyTruth({ caseData: c, regions: [], segmentOf: () => undefined });
  const a = complexAnatomy(t);
  // a generated chronic occlusion carries kind 'cto' only (report.ts reads the morphology fields)
  const cto = a.cto || c.lesions.some((l) => l.kind === "cto" || l.morphology === "cto" || !!l.cto);
  const sig = c.lesions.filter((l) => l.severity >= SIGNIFICANT_PCT && l.morphology !== "spasm" && !l.nitrateResponsive);
  const bifurcation = sig.some((l) => !!l.medina || !!l.sites?.includes("bifurcation"));
  const severeCalcium = sig.some((l) => l.calcium === 2);
  return { unprotectedLm: a.unprotectedLm, cto, multivessel: a.multivessel, bifurcation, severeCalcium };
}

/** The vessels of the significant lesions, most severe first, each once (the case truth; never shown on the gate). */
export function adHocLesionVessels(c: CaseSession["caseData"]): string[] {
  const sig = c.lesions.filter((l) => l.severity >= SIGNIFICANT_PCT && l.morphology !== "spasm" && !l.nitrateResponsive);
  return [...new Set([...sig].sort((a, b) => b.severity - a.severity).map((l) => String(l.vessel)))];
}

/** 'the LAD lesion', 'the LM and LAD lesions', 'the LAD, LCx and RCA lesions'. */
function lesionsText(vessels: readonly string[]): string {
  if (vessels.length === 1) return `the ${vessels[0]} lesion`;
  return `the ${vessels.slice(0, -1).join(", ")} and ${vessels[vessels.length - 1]} lesions`;
}

const ACS = new Set<Indication>(["UA", "NSTEMI", "STEMI"]);

/** The gate's facts now. `report`: the study report of this case, if the learner submitted one. */
export function adHocInputs(s: AdHocSource, g: AdHocGateState | null, report: AdHocReport | null = null): AdHocInputs {
  const setup = adHocSetupOf(s.scenario);
  const v = s.patient.vitals();
  const events = s.activeEvents();
  const acs = ACS.has(s.profile.indication);
  const chestPain = Math.round((v.symptoms?.chestPain ?? 0) * 10) / 10;
  const isch = Math.max(0, ...Object.values(v.ischaemia ?? {}));
  const activeIschaemia = acs && (!!v.stemi?.met || events.includes("st-elevation") || chestPain >= MP_ADHOC.chestPainActive || isch >= MP_ADHOC.ischaemiaActive);
  const contrast = s.contrastNow();
  const t = s.totals;
  const contrastHigh = contrast.budgetMl !== null && contrast.usedMl >= CONTRAST_BUDGET_DEFAULTS.warnFraction * contrast.budgetMl;
  const doseHigh = t.karMGy >= DOSE_TRIGGERS.karMGy || t.kapGyCm2 >= DOSE_TRIGGERS.kapGyCm2 || t.fluoroS / 60 >= DOSE_TRIGGERS.fluoroMin;
  const complications = s.complications.filter((c) => !PROCESS_ERRORS.has(c.id)).map((c) => ({ id: c.id, label: c.label, severity: c.severity }));
  return {
    indication: s.profile.indication,
    acs,
    activeIschaemia,
    chestPain,
    anatomy: adHocAnatomy(s.caseData),
    lesionVessels: adHocLesionVessels(s.caseData),
    consent: consentOf(s, setup),
    contrast,
    fluoroS: t.fluoroS,
    karMGy: t.karMGy,
    kapGyCm2: t.kapGyCm2,
    contrastHigh,
    doseHigh,
    complications,
    majorComplication: complications.some((c) => c.severity === "major"),
    centre: { ...DEFAULT_CENTRE, ...(setup?.centre ?? {}) },
    clockMin: (setup?.clockStartMin ?? MP_ADHOC.clockStartMin) + Math.floor(s.tS / 60),
    interruption: g?.interruption && g.interruptedAt !== null ? { kind: g.interruption.kind, text: g.interruption.text, at: g.interruptedAt } : null,
    facts: {
      symptomsUncertain: setup?.symptomsUncertain,
      ischaemiaEvidence: setup?.ischaemiaEvidence,
      fatigue: setup?.fatigue,
      preparation: setup?.preparation,
      patientWishes: setup?.patientWishes,
      studyFindings: setup?.studyFindings,
    },
    report,
  };
}

/** The reasons to defer that apply, in DEFERRAL_REASONS order (see the header). */
export function deferralReasonsApplying(i: AdHocInputs): DeferralReason[] {
  const a = i.anatomy;
  const complexForConsent = a.unprotectedLm || a.cto || a.multivessel;
  const on = new Set<DeferralReason>();
  if (i.consent.limit === "diagnostic-only") on.add("consent");
  if (!(i.acs && i.activeIschaemia)) {
    if (complexForConsent || a.bifurcation) on.add("anatomy");
    if (i.contrastHigh || i.doseHigh) on.add("dose");
    if ((!i.centre.onSiteSurgery && complexForConsent) || (a.cto && !i.centre.ctoProgramme) || (a.severeCalcium && !i.centre.atherectomy)) on.add("place");
    if (i.consent.limit === "target-only" && complexForConsent) on.add("consent");
    if (!i.acs && (i.facts.symptomsUncertain || (i.facts.ischaemiaEvidence === false && !i.centre.physiology && !i.centre.imaging))) on.add("symptoms");
    if (i.majorComplication || i.report?.complication) on.add("complication");
    if (i.interruption || i.facts.fatigue) on.add("people");
    if (i.facts.preparation) on.add("preparation");
    if (i.facts.patientWishes) on.add("choice");
  }
  return DEFERRAL_REASONS.map((r) => r.id).filter((id) => on.has(id));
}

export interface AdHocJudgement {
  applies: DeferralReason[];
  expected: AdHocChoice;
  correct: boolean;
  /** applying reasons the learner did not tick */
  missed: DeferralReason[];
  /** reasons ticked that do not apply */
  extra: DeferralReason[];
  /** null: the checklist is not scored (ad hoc PCI with nothing to defer for) */
  reasonsCorrect: boolean | null;
}

/** Score a decision against the case's facts (see the header). */
export function judgeAdHoc(i: AdHocInputs, choice: AdHocChoice, reasons: readonly DeferralReason[]): AdHocJudgement {
  const applies = deferralReasonsApplying(i);
  const ticked = DEFERRAL_REASONS.map((r) => r.id).filter((id) => reasons.includes(id));
  const missed = applies.filter((r) => !ticked.includes(r));
  const extra = ticked.filter((r) => !applies.includes(r));
  const expected: AdHocChoice = applies.length ? "defer" : "proceed";
  const activeAcs = i.acs && i.activeIschaemia;
  const correct = choice === "proceed" ? applies.length === 0 : applies.length ? ticked.some((r) => applies.includes(r)) : !activeAcs && ticked.length > 0;
  const scored = choice === "defer" || applies.length > 0;
  return { applies, expected, correct, missed, extra, reasonsCorrect: scored ? missed.length === 0 && extra.length === 0 : null };
}

const reasonTitle = (id: DeferralReason) => DEFERRAL_REASONS.find((r) => r.id === id)!.title.toLowerCase();
const listOf = (ids: readonly DeferralReason[]) => (ids.length ? ids.map(reasonTitle).join(", ") : "none");

/** The tips that teach the decision for these facts (each resolves in TIP_BY_ID; adhoc.test.ts checks). */
export function adHocTipIds(i: AdHocInputs, applies: readonly DeferralReason[]): string[] {
  const out = ["diag-ad-hoc-pause"];
  if (!i.acs && (i.anatomy.unprotectedLm || i.anatomy.multivessel)) out.push("diag-stop-for-heart-team");
  if (applies.includes("consent")) out.push("diag-planning-ad-hoc-consent");
  if (i.anatomy.cto && applies.includes("anatomy")) out.push("diag-cto-strategy-defer-adhoc");
  if (applies.includes("dose")) out.push("pci-stage-on-dose");
  return out;
}

/**
 * Record the decision on the case: the decision and the reasons checklist in the ledger, and on 'defer'
 * a staged-PCI note in the case log. Returns the outcome (the gate's state keeps it).
 */
export function recordAdHocDecision(
  s: Pick<CaseSession, "tS" | "decide" | "logEntry">,
  i: AdHocInputs,
  choice: AdHocChoice,
  reasons: readonly DeferralReason[],
): AdHocOutcome {
  const j = judgeAdHoc(i, choice, reasons);
  const tipIds = adHocTipIds(i, j.applies);
  const ticked = DEFERRAL_REASONS.map((r) => r.id).filter((id) => reasons.includes(id));
  const activeAcs = i.acs && i.activeIschaemia;
  s.decide({
    id: "adhoc-decision",
    stage: "handover",
    label: "Ad hoc PCI or delayed PCI after the diagnostic study",
    correct: j.correct,
    expected: j.applies.length
      ? `Defer: ${listOf(j.applies)} (Brilakis ${DEFERRAL_SOURCE.loc})`
      : activeAcs
        ? "Ad hoc PCI: an acute coronary syndrome with active ischaemia"
        : "Ad hoc PCI is reasonable: no reason to defer applies (deferral with a stated reason is acceptable)",
    given: choice === "proceed" ? "Ad hoc PCI now" : `Deferred: ${listOf(ticked)}`,
    lessonId: DEFERRAL_SOURCE.lessonId,
    tipIds,
  });
  if (j.reasonsCorrect !== null) {
    s.decide({
      id: "adhoc-deferral-reasons",
      stage: "handover",
      label: "The reasons to defer ad hoc PCI that apply",
      correct: j.reasonsCorrect,
      expected: listOf(j.applies).replace(/^./, (x) => x.toUpperCase()),
      given: `${listOf(ticked).replace(/^./, (x) => x.toUpperCase())}${j.missed.length ? `; missed ${listOf(j.missed)}` : ""}${j.extra.length ? `; not supported ${listOf(j.extra)}` : ""}`,
      lessonId: DEFERRAL_SOURCE.lessonId,
      tipIds,
    });
  }
  const target = i.report?.target ? { ...i.report.target, strategy: choice === "proceed" ? ("adhoc" as const) : ("staged" as const) } : null;
  if (choice === "defer") {
    // no report target: the case's significant lesions (the team's findings on the gate name them too)
    const what = target ? `${target.vessel}${target.segment ? ` (${target.segment})` : ""}` : i.lesionVessels?.length ? lesionsText(i.lesionVessels) : "the lesion found";
    s.logEntry("action", `Ad hoc PCI deferred: staged PCI of ${what} to be planned and consented${ticked.length ? ` (${listOf(ticked)})` : ""}.`);
  } else s.logEntry("action", "Decision: ad hoc PCI on this table.");
  return { t: round1(s.tS), choice, reasons: ticked, applies: j.applies, correct: j.correct, reasonsCorrect: j.reasonsCorrect, target };
}

// --- tips ----------------------------------------------------------------------------------------

/** The dose events the gate reports with the diagnostic finish. */
export function adHocEvents(i: Pick<AdHocInputs, "contrastHigh" | "doseHigh">): LabEvent[] {
  const out: LabEvent[] = [];
  if (i.contrastHigh) out.push("high-contrast-volume");
  if (i.doseHigh) out.push("high-radiation-dose");
  return out;
}

/** The tip context while the gate is open: the diagnostic finish, with the dose events when present. */
export function adHocTipContext(i: Pick<AdHocInputs, "contrastHigh" | "doseHigh">): LabContext {
  return { lab: "diagnostic", phase: "finish", events: adHocEvents(i) };
}

/**
 * The decision tips the gate's panel lists first, the same three in every case so the panel never hints
 * which reasons apply (the plan's tipIntegration for this package).
 */
export const ADHOC_GATE_PINNED_TIPS = ["diag-ad-hoc-pause", "diag-planning-ad-hoc-consent", "diag-stop-for-heart-team"] as const;

/** How many tips the gate's panel lists (a panel setting, not a clinical value). */
export const ADHOC_GATE_TIP_LIMIT = 4;

/** Acquisition tips, left out at the gate: the study is finished there. */
const isAcquisitionTip = (id: string) => id.startsWith("diag-acq-") || id === "diag-interp-every-territory";

/**
 * The gate's tips from the ranked tips of its context (tipsFor(adHocTipContext(i), n) with n large
 * enough to reach the pinned three): the pinned decision tips first, then the rest in rank order,
 * without the acquisition tips.
 */
export function adHocGateTips<T extends { id: string }>(ranked: readonly T[], limit = ADHOC_GATE_TIP_LIMIT): T[] {
  const pinned = ADHOC_GATE_PINNED_TIPS as readonly string[];
  const first = pinned.map((id) => ranked.find((t) => t.id === id)).filter((t): t is T => !!t);
  const rest = ranked.filter((t) => !pinned.includes(t.id) && !isAcquisitionTip(t.id));
  return [...first, ...rest].slice(0, limit);
}

/** How deep in the ranking the gate looks for its tips. */
export const ADHOC_GATE_TIP_DEPTH = 40;

/** What the gate reports for the tips (the reachability report reads `raises` exports). */
export const raises: readonly LabRaises[] = [{ lab: "diagnostic", phases: ["finish"], events: ["high-contrast-volume", "high-radiation-dose"] }];

// --- display helpers -----------------------------------------------------------------------------

/** Minutes after midnight as hh:mm (wrapping at midnight). */
export function timeOfDay(min: number): string {
  const m = ((Math.floor(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** The study report's decision as the gate shows it. */
export function reportDecisionLabel(d: StudyDecision | null): string {
  return d ? STUDY_DECISION_LABEL[d] : "No decision recorded";
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}
