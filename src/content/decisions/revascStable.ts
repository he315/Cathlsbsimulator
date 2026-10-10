// ===========================================================================
// Revascularisation in stable coronary disease: Brilakis's algorithm and the
// heart-team rule, as the module text teaches them (angio-decision-drills).
//
// Every branch below carries the place it comes from: the lesson that teaches
// it (pm-target-ccs-why: whether to revascularise; pm-target-heart-team: PCI
// or CABG) and the book location that lesson cites (Brilakis, Manual of PCI,
// 7.1 and Fig. 7.1; the 2024 ESC position as quoted in the lesson). Nothing
// here is a threshold from memory: ischaemia over 10% of the LV, a proximal
// LAD or left main stenosis of 50% or more and an LVEF below 35% are the
// words of pm-target-ccs-why, "Question 2", "In the asymptomatic patient".
//
// The algorithm asks, in order: symptoms, the extent of disease, previous
// CABG, diabetes, surgical candidacy, the complexity of the disease, benefit
// against risk, and the patient's preference. It returns the branch the
// algorithm reaches and the recommendation the operator brings to the
// patient: no revascularisation, PCI, CABG, or the heart team when PCI and
// CABG both remain reasonable (the heart-team rule of pm-target-heart-team:
// "When PCI and CABG carry equal recommendations, a heart-team discussion is
// needed and ad hoc PCI should not be performed").
//
// Pure and engine-free: the diagnostic lab's decision step
// (src/ui/sim/modules/revascDecision.ts), the Real angiograms drills and the
// tests import it. It imports only types from the tip registry, so light
// helpers such as src/ui/angio/library.ts can import STABLE_FACTS without
// loading the manual curriculum; revascRevealTips takes the registry from its
// caller.
// ===========================================================================

import type { SourceLoc } from "../schema";
import type { LabContext, LabTip } from "../lab/tips";

/** Where a step of the algorithm is taught. */
export interface RevascSource {
  lessonId: string;
  /** the lesson's block the rule is quoted from */
  block: string;
  sources: SourceLoc[];
}

const WHY: SourceLoc[] = [{ book: "brilakis-pci", loc: "7.1 (Fig. 7.1)" }];
const MODALITY: SourceLoc[] = [{ book: "brilakis-pci", loc: "7.1 (Fig. 7.1)" }];

/** The questions of the algorithm, in the order Brilakis asks them. */
export const STABLE_STEPS = ["symptoms", "extent", "prior-cabg", "diabetes", "surgical-candidate", "complexity", "benefit-risk", "preference"] as const;
export type StableStep = (typeof STABLE_STEPS)[number];

export const STABLE_STEP_LABEL: Record<StableStep, string> = {
  symptoms: "Are there symptoms to relieve?",
  extent: "How much disease: one vessel, several, or the left main?",
  "prior-cabg": "Has the patient had CABG before?",
  diabetes: "Does the patient have diabetes?",
  "surgical-candidate": "Is the patient a good surgical candidate?",
  complexity: "How complex is the disease?",
  "benefit-risk": "Do the benefits outweigh the risks?",
  preference: "What does the patient want?",
};

export const STABLE_STEP_SOURCE: Record<StableStep, RevascSource> = {
  symptoms: { lessonId: "pm-target-ccs-why", block: "Question 1: are there symptoms to relieve?", sources: WHY },
  extent: { lessonId: "pm-target-ccs-why", block: "Question 2: how much disease, and how severe?", sources: WHY },
  "prior-cabg": { lessonId: "pm-target-heart-team", block: "The modality questions, in order: 1", sources: MODALITY },
  diabetes: { lessonId: "pm-target-heart-team", block: "The modality questions, in order: 2", sources: MODALITY },
  "surgical-candidate": { lessonId: "pm-target-heart-team", block: "The modality questions, in order: 3", sources: MODALITY },
  complexity: { lessonId: "pm-target-heart-team", block: "The modality questions, in order: 4", sources: MODALITY },
  "benefit-risk": { lessonId: "pm-target-ccs-why", block: "Question 3: do the benefits outweigh the risks?", sources: WHY },
  preference: { lessonId: "pm-target-ccs-why", block: "Question 4: what does the patient want?", sources: WHY },
};

/**
 * Thresholds of the asymptomatic branch, quoted from pm-target-ccs-why ("In the asymptomatic patient"):
 * ischaemia exceeding 10% of the LV, a proximal LAD or left main stenosis of 50% or more, LVEF below 35%.
 */
export const ASYMPTOMATIC_RULE = {
  ischaemiaOverPct: 10,
  proximalLadOrLmPct: 50,
  lvefBelowPct: 35,
  source: STABLE_STEP_SOURCE.extent,
} as const;

/** What the algorithm needs to know about a stable patient. */
export interface StableInputs {
  /** angina, an anginal equivalent (breathlessness on exertion), or none */
  symptoms: "angina" | "equivalent" | "none";
  /**
   * The extent of disease. `vessels` counts the major epicardial arteries (LAD, circumflex, RCA) with
   * significant disease beyond the left main; `leftMain` and `proximalLad` are stenoses of 50% or more there.
   */
  extent: { vessels: 0 | 1 | 2 | 3; leftMain: boolean; proximalLad: boolean };
  /** ischaemic burden on functional testing, percent of the LV (null: not tested) */
  ischaemiaPct: number | null;
  /** LV ejection fraction, % (null: not known) */
  lvef: number | null;
  priorCabg: boolean;
  diabetes: boolean;
  surgicalCandidate: "good" | "poor";
  /** complexity of the disease, as the SYNTAX score measures it */
  complexity: "complex" | "less-complex";
  /** whether the benefit of the modality reached outweighs its risk (default: yes) */
  benefitOutweighsRisk?: boolean;
}

export const REVASC_OUTCOMES = ["none", "pci", "cabg", "heart-team"] as const;
export type RevascOutcome = (typeof REVASC_OUTCOMES)[number];

export const REVASC_OUTCOME_LABEL: Record<RevascOutcome, string> = {
  none: "No revascularisation",
  pci: "PCI",
  cabg: "CABG",
  "heart-team": "Heart-team referral (PCI and CABG both reasonable)",
};

/** One question the algorithm asked, with the answer the inputs give and where the rule is taught. */
export interface StablePathStep {
  step: StableStep;
  /** the answer the inputs give, as the option id the decision step offers */
  answer: string;
  /** what the answer means here */
  note: string;
  source: RevascSource;
}

export interface StableDecision {
  /** the questions asked, in order (steps the branch does not reach are absent) */
  path: StablePathStep[];
  /** the modality Brilakis's figure reaches before the heart-team rule */
  branch: RevascOutcome;
  /** the recommendation: the branch, or 'heart-team' when PCI and CABG both remain reasonable */
  outcome: RevascOutcome;
  /** left main or multivessel disease in a stable patient: no ad hoc PCI (diag-stop-for-heart-team, Brilakis 7.3) */
  noAdHocPci: boolean;
  /** one or two sentences for the reveal, from the module text */
  explanation: string;
}

/** Option ids of each step, as the decision step offers them. */
export const STEP_OPTIONS: Record<StableStep, readonly { id: string; label: string }[]> = {
  symptoms: [
    { id: "yes", label: "Yes: angina or an anginal equivalent" },
    { id: "no", label: "No symptoms" },
  ],
  extent: [
    { id: "single", label: "Single-vessel disease" },
    { id: "multi", label: "Multivessel or left main disease" },
    { id: "none", label: "No significant disease" },
  ],
  "prior-cabg": [
    { id: "yes", label: "Yes" },
    { id: "no", label: "No" },
  ],
  diabetes: [
    { id: "yes", label: "Yes" },
    { id: "no", label: "No" },
  ],
  "surgical-candidate": [
    { id: "good", label: "Good surgical candidate" },
    { id: "poor", label: "Poor surgical candidate" },
  ],
  complexity: [
    { id: "complex", label: "Complex" },
    { id: "less-complex", label: "Less complex" },
  ],
  "benefit-risk": [
    { id: "yes", label: "Benefit outweighs risk" },
    { id: "no", label: "Risk outweighs benefit" },
    { id: "not-reached", label: "Not reached: the algorithm stops before this" },
  ],
  preference: [{ id: "patient-decides", label: "The informed patient decides between the options that remain" }],
};

/** The asymptomatic patient's prognostic criteria that are met (pm-target-ccs-why, Question 2). */
export function prognosticCriteria(v: StableInputs): string[] {
  const out: string[] = [];
  const multi = v.extent.vessels >= 2 || v.extent.leftMain;
  if (v.ischaemiaPct !== null && v.ischaemiaPct > ASYMPTOMATIC_RULE.ischaemiaOverPct) out.push(`ischaemia over ${ASYMPTOMATIC_RULE.ischaemiaOverPct}% of the LV`);
  if (multi) {
    if (v.lvef !== null && v.lvef < ASYMPTOMATIC_RULE.lvefBelowPct) out.push(`LVEF below ${ASYMPTOMATIC_RULE.lvefBelowPct}%`);
    if (v.extent.leftMain) out.push(`left main stenosis of ${ASYMPTOMATIC_RULE.proximalLadOrLmPct}% or more`);
  } else if (v.extent.proximalLad) out.push(`proximal LAD stenosis of ${ASYMPTOMATIC_RULE.proximalLadOrLmPct}% or more`);
  return out;
}

/**
 * Brilakis's algorithm for a stable patient (Fig. 7.1, as pm-target-ccs-why and pm-target-heart-team teach
 * it), then the heart-team rule. The patient's preference runs across every branch: it is the last step of
 * the path and never changes the recommendation the operator brings.
 */
export function decideStable(v: StableInputs): StableDecision {
  const path: StablePathStep[] = [];
  const ask = (step: StableStep, answer: string, note: string) => path.push({ step, answer, note, source: STABLE_STEP_SOURCE[step] });
  const benefit = v.benefitOutweighsRisk ?? true;
  const symptomatic = v.symptoms !== "none";
  const multi = v.extent.vessels >= 2 || v.extent.leftMain;
  const finish = (branch: RevascOutcome, outcome: RevascOutcome, explanation: string, reachedBenefit: boolean): StableDecision => {
    if (!reachedBenefit) ask("benefit-risk", "not-reached", "The algorithm stops before the benefit–risk question.");
    ask("preference", "patient-decides", "The decision is always the patient's; the operator and the heart team inform and guide.");
    return { path, branch, outcome, noAdHocPci: multi, explanation };
  };
  const weigh = (modality: "pci" | "cabg", why: string): StableDecision => {
    ask("benefit-risk", benefit ? "yes" : "no", benefit ? `The benefit of ${modality.toUpperCase()} outweighs its risk.` : `The risk of ${modality.toUpperCase()} outweighs its benefit.`);
    return finish(modality, benefit ? modality : "none", benefit ? why : `${why} Here the risk outweighs the benefit, so no revascularisation.`, true);
  };

  ask("symptoms", symptomatic ? "yes" : "no", symptomatic ? "There are symptoms to relieve." : "No symptoms: revascularisation can only be justified on prognostic grounds.");
  if (v.extent.vessels === 0 && !v.extent.leftMain) {
    ask("extent", "none", "No significant coronary disease.");
    return finish("none", "none", "There is no significant coronary disease to revascularise.", false);
  }
  ask("extent", multi ? "multi" : "single", multi ? "Multivessel or left main disease: PCI or CABG are both possible, so the modality questions follow." : "Single-vessel disease, treated with PCI in most cases.");

  if (!symptomatic) {
    const met = prognosticCriteria(v);
    if (!met.length)
      return finish(
        "none",
        "none",
        multi
          ? "An asymptomatic patient with multivessel disease goes on to the modality questions only if ischaemia exceeds 10%, LVEF is below 35% or the left main has a 50% or greater stenosis. None applies, so no revascularisation."
          : "An asymptomatic patient with single-vessel disease goes on to weigh benefit and risk only if ischaemia exceeds 10% or the proximal LAD has a 50% or greater stenosis. Neither applies, and a patient without symptoms cannot be made to feel better, so no revascularisation.",
        false
      );
  }
  if (!multi) return weigh("pci", "Single-vessel disease is treated with PCI in most cases, once benefit has been weighed against risk.");

  if (v.priorCabg) {
    ask("prior-cabg", "yes", "Redo CABG carries more risk, so PCI is usually favoured.");
    return weigh("pci", "After previous CABG, redo surgery carries more risk of death and complications, so PCI is usually favoured if its benefit outweighs its risk.");
  }
  ask("prior-cabg", "no", "No previous CABG.");

  if (v.diabetes) {
    ask("diabetes", "yes", "Diabetes with multivessel disease: CABG is generally preferred in a good surgical candidate.");
    ask("surgical-candidate", v.surgicalCandidate, v.surgicalCandidate === "good" ? "A good surgical candidate." : "Not a good surgical candidate: the PCI benefit–risk question follows.");
    if (v.surgicalCandidate === "good")
      return weigh("cabg", "Diabetes with multivessel disease in a good surgical candidate leads to CABG in Brilakis's algorithm, and the 2024 ESC guideline recommends CABG over PCI in diabetes with three-vessel disease, whatever the SYNTAX score.");
    return weigh("pci", "With diabetes but a poor surgical candidate, the algorithm goes to the PCI benefit–risk question.");
  }
  ask("diabetes", "no", "No diabetes: complexity is asked next, before surgical candidacy.");
  ask("complexity", v.complexity, v.complexity === "complex" ? "Complex disease leads to the surgical-candidate question." : "Less complex disease goes straight to the PCI benefit–risk question.");
  if (v.complexity === "complex") {
    ask("surgical-candidate", v.surgicalCandidate, v.surgicalCandidate === "good" ? "A good surgical candidate." : "Not a good surgical candidate: the PCI benefit–risk question follows.");
    if (v.surgicalCandidate === "good") return weigh("cabg", "Brilakis prefers CABG for complex multivessel disease in a good surgical candidate.");
    return weigh("pci", "Complex disease in a poor surgical candidate goes to the PCI benefit–risk question.");
  }
  // Less complex disease without diabetes: Brilakis's figure reaches PCI, but his SYNTAX table allows PCI or
  // CABG here (three-vessel 0–22, left main 0–32, two-vessel without a threshold). The 2024 ESC statement
  // (PCI a class I alternative at low or intermediate complexity without diabetes; equal recommendations mean a
  // heart-team discussion and no ad hoc PCI) is quoted for three-vessel disease only, so the explanation
  // depends on the anatomy (heartTeamExplanation). When a good surgical candidate keeps both, the case goes
  // to the heart team.
  ask("benefit-risk", benefit ? "yes" : "no", benefit ? "The benefit of revascularisation outweighs its risk." : "The risk of PCI outweighs its benefit.");
  if (!benefit) return finish("pci", "none", "The risk of PCI outweighs its benefit here, so no revascularisation.", true);
  if (v.surgicalCandidate === "good")
    return finish("pci", "heart-team", heartTeamExplanation(v.extent), true);
  return finish("pci", "pci", "Less complex disease in a patient who is not a good surgical candidate goes to PCI once benefit has been weighed against risk.", true);
}

/**
 * Why less complex disease without diabetes in a good surgical candidate goes to the heart team, by anatomy
 * (pm-target-heart-team, "Using the score" and the guidance under it; pm-target-ccs-why's reasons to defer).
 * Left main: Brilakis's 0–32 row, similar benefit (17.7). Three-vessel: the 2024 ESC statement, which the
 * lesson quotes for three-vessel disease. Two-vessel: his table gives no threshold, and multivessel disease
 * is on his list of reasons to defer ad hoc PCI.
 */
export function heartTeamExplanation(extent: StableInputs["extent"]): string {
  if (extent.leftMain)
    return "Less complex left main disease (SYNTAX 0–32) in a good surgical candidate without diabetes is where Brilakis says CABG and PCI give similar benefit (his SYNTAX table, 17.7), which makes it a heart-team decision with the patient's preference. Unprotected left main disease is also on his list of reasons to defer ad hoc PCI.";
  if (extent.vessels >= 3)
    return "Less complex three-vessel disease without diabetes goes to PCI in Brilakis's figure, yet PCI and CABG both remain reasonable (his SYNTAX table at 0–22; the 2024 ESC guideline makes PCI a class I alternative at low or intermediate complexity if it matches CABG's completeness). When PCI and CABG carry equal recommendations, a heart-team discussion is needed and ad hoc PCI should not be performed.";
  return "Brilakis's SYNTAX table gives no threshold for two-vessel disease, so PCI or CABG. Multivessel disease is on his list of reasons to defer ad hoc PCI, so the diagnostic study ends and the case goes to the heart team.";
}

// ---------------------------------------------------------------------------
// Scoring a learner's walk through the algorithm
// ---------------------------------------------------------------------------

export interface StableAnswer {
  /** the learner's answer per step (option id); steps the learner left out are absent */
  steps: Partial<Record<StableStep, string>>;
  outcome: RevascOutcome | null;
}

export interface StableScore {
  outcomeCorrect: boolean;
  /** per step the algorithm asked: the learner's answer and whether it agrees */
  steps: { step: StableStep; expected: string; given: string | null; correct: boolean }[];
  /** steps the learner answered correctly, of those the algorithm asked */
  stepsCorrect: number;
  decision: StableDecision;
}

export function scoreStable(v: StableInputs, a: StableAnswer): StableScore {
  const decision = decideStable(v);
  const steps = decision.path.map((p) => {
    const given = a.steps[p.step] ?? null;
    return { step: p.step, expected: p.answer, given, correct: p.step === "preference" ? true : given === p.answer };
  });
  return { outcomeCorrect: a.outcome === decision.outcome, steps, stepsCorrect: steps.filter((s) => s.correct).length, decision };
}

// ---------------------------------------------------------------------------
// The facts the algorithm needs, for the real-library drill that asks which are missing
// ---------------------------------------------------------------------------

/**
 * The facts a stable decision rests on (pm-target-ccs-why Questions 1 to 4, pm-target-heart-team's
 * modality questions). The real-library drill shows only what the dataset records and asks which of these
 * the learner would still need before deciding.
 */
export const STABLE_FACTS = [
  { id: "symptoms", label: "Symptoms now: angina or its equivalent, and how limiting despite treatment", step: "symptoms" },
  { id: "ischaemia", label: "Ischaemic burden on functional testing (more than 10% of the LV?)", step: "extent" },
  { id: "lv-function", label: "LV function (LVEF)", step: "extent" },
  { id: "extent", label: "Extent of disease: the diseased vessels and the left main", step: "extent" },
  { id: "prior-cabg", label: "Previous CABG", step: "prior-cabg" },
  { id: "diabetes", label: "Diabetes", step: "diabetes" },
  { id: "surgical-risk", label: "Surgical risk (STS or EuroSCORE II factors, frailty)", step: "surgical-candidate" },
  { id: "complexity", label: "Complexity of the disease (SYNTAX)", step: "complexity" },
  { id: "preference", label: "The patient's preference", step: "preference" },
] as const satisfies readonly { id: string; label: string; step: StableStep }[];
export type StableFact = (typeof STABLE_FACTS)[number]["id"];

// ---------------------------------------------------------------------------
// The tips the reveal shows
// ---------------------------------------------------------------------------

/** The two tips a revascularisation decision teaches (the lab requests' tips for pm-target#1 and #2). */
export const REVASC_TIP_IDS = ["pci-plan-name-the-goal", "diag-stop-for-heart-team"] as const;

/** The contexts the decision is made in: the PCI plan and the close of the diagnostic study. */
export function revascTipContexts(events: LabContext["events"] = []): { plan: LabContext; finish: LabContext } {
  return { plan: { lab: "pci", phase: "plan", events: [...(events ?? [])] }, finish: { lab: "diagnostic", phase: "finish", events: [...(events ?? [])] } };
}

/**
 * The tip registry the reveal reads (src/content/lab/tips.ts tipsFor and TIP_BY_ID), passed in by the caller
 * so that this file imports no curriculum.
 */
export interface RevascTipRegistry {
  tipsFor: (ctx: LabContext, limit?: number) => LabTip[];
  byId: Readonly<Record<string, LabTip | undefined>>;
}

/**
 * The tips the reveal shows: those of REVASC_TIP_IDS that their own triggers select in the decision's
 * contexts (tipsFor with a wide limit), in that order. A tip whose trigger stops matching drops out rather
 * than being shown out of place. diag-stop-for-heart-team is about left main or multivessel disease, so it
 * is left out when `multivessel` is false (a real study whose grades show single-vessel or no disease).
 */
export function revascRevealTips(reg: RevascTipRegistry, opts: { events?: LabContext["events"]; multivessel?: boolean } = {}): LabTip[] {
  const ctx = revascTipContexts(opts.events ?? []);
  const shown = new Set([...reg.tipsFor(ctx.plan, 50), ...reg.tipsFor(ctx.finish, 50)].map((t) => t.id));
  const out: LabTip[] = [];
  for (const id of REVASC_TIP_IDS) {
    const t = reg.byId[id];
    if (!t || !shown.has(id)) continue;
    if (id === "diag-stop-for-heart-team" && opts.multivessel === false) continue;
    out.push(t);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The chart of a simulated stable case, for the decision step
// ---------------------------------------------------------------------------

/**
 * What a simulated multi-vessel case's chart says for the decision, beside the patient chart (CaseChart):
 * the algorithm's inputs and the wording the chart shows. Extent and complexity are read from the study,
 * so the chart rows do not show them. Values are scenario data (MODEL PARAMETERS of the pack that
 * declares the vignette), not sourced facts.
 */
export interface StableVignette {
  inputs: StableInputs;
  /** the chart's symptom history */
  symptoms: string;
  /** the functional test, as the chart reports it */
  ischaemia: string;
  /** the surgical review: risk band and candidacy, in words */
  surgicalRisk: string;
  /** the band shown beside it */
  surgicalRiskBand: "low" | "intermediate" | "high";
  /** what the patient has said about the options */
  preference: string;
}

/** The decision step's chart rows (id, label, value), after the patient chart's own rows. */
export function vignetteRows(v: StableVignette): { id: string; label: string; value: string }[] {
  const i = v.inputs;
  return [
    { id: "symptoms", label: "Symptoms", value: v.symptoms },
    { id: "diabetes", label: "Diabetes", value: i.diabetes ? "Yes" : "No" },
    { id: "prior-cabg", label: "Previous CABG", value: i.priorCabg ? "Yes" : "No" },
    { id: "lvef", label: "LVEF", value: i.lvef === null ? "Not known" : `${i.lvef}%` },
    { id: "surgical-risk", label: "Surgical risk", value: `${v.surgicalRiskBand[0].toUpperCase()}${v.surgicalRiskBand.slice(1)}: ${v.surgicalRisk}` },
    { id: "ischaemia", label: "Ischaemic burden", value: v.ischaemia },
    { id: "preference", label: "Patient's view", value: v.preference },
  ];
}
