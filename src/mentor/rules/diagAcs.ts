// ---------------------------------------------------------------------------
// Rule group: acute coronary syndromes in the diagnostic lab (diag-acs-scenarios).
//
// The live rule and the scoring of the ACS front end (src/simulation/
// diagnosticScenarios/acs.ts):
//
//   stemi-rca-before-left   in a non-anterior STEMI, the RCA engaged before the
//                           left coronary artery has been imaged (technique;
//                           stops 'inject'). Brilakis's recommended engagement
//                           order (pm-target-culprit, src/content/manual/
//                           pci-manual/10-target.ts, 'The STEMI engagement
//                           sequence'; tip diag-stemi-engagement-order cites
//                           Brilakis 20.5): anterior STEMI, the guide into the
//                           left main first, then the RCA imaged; non-anterior,
//                           diagnostic angiography of the left first, then the
//                           guide into whichever artery holds the culprit, so the
//                           RCA is never stented with the left anatomy unknown.
//
// The scoring functions (pure, for the debrief and the ledger):
//   scoreEngagementOrder    the order above, from the engagements and runs
//   gradeEcgPrediction      the pre-brief prediction against the ECG's answer
//   scoreOhcaTriage         the triage after a resuscitated arrest against the
//                           2023 ESC classes cp-complex-patients-ohca quotes
//                           (class I, level B, primary PCI with persistent ST
//                           elevation; class III, level A, routine immediate
//                           angiography in stable patients without it)
//   scoreCulprit            the report's culprit and clues (pm-target-culprit)
//   scoreIatrogenic         the first measures for an iatrogenic occlusion
//                           (cm-principles-closure-pmi)
//   reperfusionClock        minutes since the STEMI diagnosis against Oxford's
//                           120 minutes (cp-acs-thrombus-reperfusion)
//   acsDecisions            all of these as decision-ledger records
//
// `rules` (what RULES collects) is empty, as in diagDrugs.ts: the rule reads
// AcsMentorCtx.acs (the case's presentation and whether the left has been
// imaged), which the diagnostic lab's attending does not pass yet, and
// mentor.test.ts runs a firing scenario for every rule in RULES. ACS_RULES
// joins RULES once the lab passes the field (reported with this package).
// Persistence and cooldown are MODEL PARAMETERS
// (docs/realism/facts/pkg-diag-acs-scenarios.md).
//
// This file imports types only from the rule registry (registries.test.ts).
// ---------------------------------------------------------------------------

import type { MentorCtx } from "../context";
import type { MentorRule } from "../rules";
import type { DecisionRecord } from "../ledger";
import type { EngagementKind } from "../../types";
import {
  CULPRIT_CLUE_LABEL,
  ECG_ARTERY_LABEL,
  ECG_LEVEL_LABEL,
  ECG_TERRITORY_LABEL,
  IATROGENIC_ACTION_LABEL,
  NO_CULPRIT_STEPS,
  NO_CULPRIT_STEP_LABEL,
  OHCA_TRIAGE_LABEL,
  type AcsCase,
  type AcsEcg,
  type CulpritClue,
  type CulpritVessel,
  type DefibOperator,
  type EcgArtery,
  type EcgLevel,
  type EcgTerritory,
  type IatrogenicAction,
  type NoCulpritStep,
  type OhcaTriage,
  type StemiPresentation,
} from "../../simulation/diagnosticScenarios/acs";

/** Position of this group in RULES (after the drug rules, 310). */
export const order = 320;

// --- the learner's answers ---------------------------------------------------------------------

/** The extra leads the learner recorded at the pre-brief. */
export type ExtraLeadSet = "right" | "posterior";

/** The pre-brief prediction from the 12-lead. */
export interface EcgPrediction {
  territory?: EcgTerritory;
  artery?: EcgArtery;
  level?: EcgLevel;
  activate?: boolean;
  /** the extra leads recorded before committing */
  leads: ExtraLeadSet[];
}

export interface OhcaTriageAnswer {
  choice?: OhcaTriage;
  defibOperator?: DefibOperator;
  padsOn: boolean;
}

export interface CulpritAnswer {
  vessel?: CulpritVessel;
  clues: CulpritClue[];
  /** with 'none-visible': the next steps in the learner's order */
  workUp: NoCulpritStep[];
}

/** What the report's complication section still needs (empty: complete). */
export function iatrogenicProblems(actions: readonly IatrogenicAction[] | undefined): string[] {
  return actions?.length ? [] : ["Say what the ECG did during the study, and your first measures if it changed"];
}

export interface AcsAnswers {
  /** the case the answers belong to */
  caseId: string;
  /** the lab session they were given in (the simulator store's sessionStart): a retry or a restart starts afresh */
  session?: number;
  ecg?: EcgPrediction & { committedAt?: number };
  triage?: OhcaTriageAnswer & { committedAt?: number };
  culprit?: CulpritAnswer;
  iatrogenic?: IatrogenicAction[];
  /** when the reperfusion clock was first shown for this case (ms), so that it runs on across the pre-brief's steps */
  clockStartedAt?: number;
}

// --- the engagement order (Brilakis, pm-target-culprit) ----------------------------------------

/** One engagement or run, as the lab saw it. */
export interface EngagementStep {
  /** lab time, s */
  t: number;
  side: "left" | "right";
  /** a guide catheter (the catalogue's category 'guide'), not a diagnostic */
  guide: boolean;
  /** a run was given (an injection), not only an engagement */
  injected: boolean;
  /** the catheter sat coaxial, selective or deep in that coronary (a root puff is not) */
  selective: boolean;
}

export type EngagementOrderCode = "guide-left-first" | "diagnostic-left-first" | "left-imaged-first" | "rca-guide-before-left" | "right-imaged-first" | "rca-before-left-main" | "not-engaged";

export interface EngagementOrderVerdict {
  ok: boolean;
  code: EngagementOrderCode;
  expected: string;
  given: string;
  lessonId: "pm-target-culprit";
  tipId: "diag-stemi-engagement-order";
}

const EXPECTED_ORDER: Record<StemiPresentation, string> = {
  anterior: "The left main engaged first with the guide, the culprit treated, then the RCA imaged",
  "non-anterior": "The left coronary artery imaged first with a diagnostic catheter; the guide then goes to whichever artery holds the culprit",
};

/** Brilakis's recommended engagement order in STEMI, scored on what the lab saw (first match in time). */
export function scoreEngagementOrder(presentation: StemiPresentation, steps: readonly EngagementStep[]): EngagementOrderVerdict {
  const base = { expected: EXPECTED_ORDER[presentation], lessonId: "pm-target-culprit" as const, tipId: "diag-stemi-engagement-order" as const };
  const sorted = [...steps].sort((a, b) => a.t - b.t);
  const leftRun = sorted.find((s) => s.side === "left" && s.injected && s.selective);
  const before = (s: EngagementStep) => !leftRun || s.t < leftRun.t;
  if (!sorted.some((s) => s.selective)) return { ...base, ok: false, code: "not-engaged", given: "No coronary was engaged" };
  if (presentation === "non-anterior") {
    const rcaGuide = sorted.find((s) => s.side === "right" && s.selective && s.guide && before(s));
    if (rcaGuide) return { ...base, ok: false, code: "rca-guide-before-left", given: "A guide engaged the RCA before the left coronary artery had been imaged" };
    const rightRun = sorted.find((s) => s.side === "right" && s.selective && s.injected && before(s));
    if (rightRun) return { ...base, ok: false, code: "right-imaged-first", given: "The RCA was imaged before the left coronary artery" };
    if (!leftRun) return { ...base, ok: false, code: "not-engaged", given: "The left coronary artery was not imaged" };
    return { ...base, ok: true, code: "left-imaged-first", given: "The left coronary artery was imaged first" };
  }
  const firstLeft = sorted.find((s) => s.side === "left" && s.selective);
  const rightFirst = sorted.find((s) => s.side === "right" && s.selective && (!firstLeft || s.t < firstLeft.t));
  if (rightFirst) return { ...base, ok: false, code: "rca-before-left-main", given: "The RCA was engaged before the left main" };
  if (firstLeft?.guide) return { ...base, ok: true, code: "guide-left-first", given: "The guide went into the left main first" };
  // a diagnostic left run first follows the order but costs time: going straight to the culprit saves
  // 8-13 minutes of door-to-balloon time (pm-target-culprit)
  return { ...base, ok: true, code: "diagnostic-left-first", given: "The left coronary artery was imaged with a diagnostic catheter first, then the guide" };
}

const SELECTIVE_KINDS: readonly EngagementKind[] = ["coaxial-lm", "selective-lm", "deep-lm", "coaxial-rca", "selective-rca", "deep-rca"];
const sideOf = (k: EngagementKind): "left" | "right" | null => (k.endsWith("-lm") ? "left" : k.endsWith("-rca") ? "right" : null);

/**
 * Collects EngagementSteps from the lab's frames and runs: a step each time the catheter comes to sit
 * coaxial, selective or deep in a coronary, and one for each run. The lab (or a test) feeds it.
 */
export class EngagementOrderWatch {
  readonly steps: EngagementStep[] = [];
  private seated: EngagementKind | null = null;
  constructor(private readonly isGuide: (catheterId: string) => boolean) {}

  /** A frame: the engagement kind and the catheter in use. */
  observe(t: number, engagement: EngagementKind, catheterId: string) {
    const selective = SELECTIVE_KINDS.includes(engagement);
    if (!selective) {
      this.seated = null;
      return;
    }
    if (this.seated === engagement) return;
    this.seated = engagement;
    this.steps.push({ t, side: sideOf(engagement)!, guide: this.isGuide(catheterId), injected: false, selective: true });
  }

  /** A run: the side injected, the engagement at the time and the catheter. */
  inject(t: number, engagement: EngagementKind, catheterId: string, side?: "left" | "right") {
    const s = sideOf(engagement) ?? side;
    if (!s) return;
    this.steps.push({ t, side: s, guide: this.isGuide(catheterId), injected: true, selective: SELECTIVE_KINDS.includes(engagement) });
  }
}

// --- the live rule ---------------------------------------------------------------------------------

/** The attending's context with the ACS case's state (the lab passes it in STEMI mode). */
export interface AcsMentorCtx extends MentorCtx {
  acs?: { presentation: StemiPresentation; leftImaged: boolean };
}

const acsOf = (c: MentorCtx) => (c as AcsMentorCtx).acs;
const RCA_SEATED: readonly EngagementKind[] = ["coaxial-rca", "selective-rca", "deep-rca"];
const rcaBeforeLeft = (c: MentorCtx): boolean => {
  const a = acsOf(c);
  return c.lab === "diagnostic" && !!a && a.presentation === "non-anterior" && !a.leftImaged && RCA_SEATED.includes(c.engagement);
};

export const ACS_RULES: MentorRule[] = [
  {
    id: "stemi-rca-before-left",
    title: "Non-anterior STEMI: the RCA before the left",
    severity: "technique",
    phase: "engage",
    lab: "diagnostic",
    when: rcaBeforeLeft,
    persistS: 2,
    stopOn: (a, c) => a === "inject" && rcaBeforeLeft(c),
    anchor: "plan",
    cooldownS: 30,
    lines: {
      1: () => "Before you go on: what do you know about the left side yet?",
      2: () => "Think about the order for a STEMI that is not anterior.",
      3: () => "You are in the right coronary and the left has not been imaged.",
      4: () => "Come out, image the left first, then decide where the guide goes.",
      5: () => "Hold that run. Left coronary first.",
    },
  },
];

/** What the registry collects into RULES; empty until the lab passes AcsMentorCtx.acs (see the header). */
export const rules: MentorRule[] = [];

// --- the pre-brief ECG -------------------------------------------------------------------------

export interface EcgGrade {
  territory: boolean;
  /** null: the artery is not graded for this ECG */
  artery: boolean | null;
  level: boolean | null;
  activation: boolean;
  /** the extra leads the pattern needs were recorded (null: none needed) */
  leads: boolean | null;
  /** territory and artery (where graded) both right: the success measure of cp-acs-thrombus#0 */
  correct: boolean;
}

export function gradeEcgPrediction(p: EcgPrediction | undefined, ecg: AcsEcg): EcgGrade {
  const t = ecg.truth;
  const territory = p?.territory === t.territory;
  const artery = t.artery === null ? null : p?.artery === t.artery;
  const level = t.level === null ? null : p?.level === t.level;
  const activation = p?.activate === t.activate;
  const leads = t.needsLeads?.length ? t.needsLeads.every((l) => p?.leads.includes(l)) : null;
  return { territory, artery, level, activation, leads, correct: territory && artery !== false };
}

/** What the pre-brief still needs before the beam (empty: the prediction can be committed). */
export function ecgPredictionProblems(p: EcgPrediction | undefined): string[] {
  const out: string[] = [];
  if (!p?.territory) out.push("Name the territory");
  if (!p?.artery) out.push("Name the artery, or say the ECG cannot");
  if (!p?.level) out.push("Name the level, or say you cannot");
  if (p?.activate === undefined) out.push("Decide whether this activates the reperfusion pathway");
  return out;
}

// --- the resuscitated arrest -------------------------------------------------------------------

export interface TriageRecommendation {
  /** the 2023 ESC class and level, as the module quotes them */
  class: "I" | "III";
  level: "A" | "B";
  text: string;
  lessonId: "cp-complex-patients-ohca";
}

export const OHCA_RECOMMENDATIONS = {
  persistentSt: { class: "I", level: "B", text: "A primary PCI strategy is recommended for resuscitated arrest with persistent ST elevation (2023 ESC, class I, level B).", lessonId: "cp-complex-patients-ohca" },
  stableNoSt: { class: "III", level: "A", text: "Routine immediate angiography is not recommended in haemodynamically stable patients without ST elevation after resuscitation (2023 ESC, class III, level A, after COACT and TOMAHAWK).", lessonId: "cp-complex-patients-ohca" },
} as const satisfies Record<string, TriageRecommendation>;

export interface TriageVerdict {
  correct: boolean;
  /** the recommendation the choice was scored against (null: no class applies, decided case by case) */
  against: TriageRecommendation | null;
  /** pads on and the person who defibrillates named (Oxford's team preparation; Brilakis's pads) */
  teamReady: boolean;
}

/** The triage choice against the module's classes. Without persistent ST elevation and not stable, no class decides it. */
export function scoreOhcaTriage(a: OhcaTriageAnswer | undefined, truth: NonNullable<AcsCase["triage"]>): TriageVerdict {
  const teamReady = !!a?.padsOn && !!a?.defibOperator;
  if (truth.persistentStElevation) return { correct: a?.choice === "immediate-angiography", against: OHCA_RECOMMENDATIONS.persistentSt, teamReady };
  if (truth.stable) return { correct: a?.choice === "intensive-care-first", against: OHCA_RECOMMENDATIONS.stableNoSt, teamReady };
  return { correct: !!a?.choice, against: null, teamReady };
}

export function triageProblems(a: OhcaTriageAnswer | undefined): string[] {
  const out: string[] = [];
  if (!a?.choice) out.push("Decide where the patient goes next");
  if (!a?.padsOn) out.push("Pads on before the case");
  if (!a?.defibOperator) out.push("Name who defibrillates");
  return out;
}

// --- the culprit (pm-target-culprit) ---------------------------------------------------------------

/** Clues the report must name for a culprit (pm-interpreting#11: at least two each time). */
export const MIN_CULPRIT_CLUES = 2;

export interface CulpritVerdict {
  culprit: boolean;
  /** clues named that the case shows */
  supported: CulpritClue[];
  /** clues named that the case does not show */
  unsupported: CulpritClue[];
  enoughClues: boolean;
  /** the clue that decides the case was named (null: none decides it) */
  decisive: boolean | null;
  /** with no visible culprit: the work-up in the module's order (null: a culprit is visible) */
  workUp: boolean | null;
}

export function scoreCulprit(a: CulpritAnswer | undefined, truth: NonNullable<AcsCase["culprit"]>): CulpritVerdict {
  const clues = a?.clues ?? [];
  const supported = clues.filter((c) => truth.clues.includes(c));
  const unsupported = clues.filter((c) => !truth.clues.includes(c));
  const none = truth.vessel === "none-visible";
  const order = truth.workUp ?? [...NO_CULPRIT_STEPS];
  return {
    culprit: a?.vessel === truth.vessel,
    supported,
    unsupported,
    enoughClues: none ? true : supported.length >= MIN_CULPRIT_CLUES,
    decisive: truth.decisive ? clues.includes(truth.decisive) : null,
    workUp: none ? a?.vessel === "none-visible" && order.every((s, i) => a.workUp[i] === s) : null,
  };
}

/** What the report's culprit section still needs (empty: complete). Reads the answer only, never the case. */
export function culpritProblems(a: CulpritAnswer | undefined): string[] {
  if (!a?.vessel) return ["Name the culprit, or say none is visible"];
  if (a.vessel === "none-visible") return a.workUp.length < NO_CULPRIT_STEPS.length ? ["Put the next steps in order"] : [];
  return a.clues.length < MIN_CULPRIT_CLUES ? [`Name at least ${MIN_CULPRIT_CLUES} clues for the culprit`] : [];
}

// --- the iatrogenic occlusion (cm-principles-closure-pmi) ------------------------------------------

/** Saturation below which oxygen is given (2023 ESC, as the module quotes it), %. */
export const OXYGEN_BELOW_SAT_PCT = 90;

export interface IatrogenicVerdict {
  revascularise: boolean;
  noLysis: boolean;
  oxygenRight: boolean;
  noRoutinePump: boolean;
  inotropesRight: boolean;
  correct: boolean;
}

/**
 * The first measures for new ST elevation from an iatrogenic occlusion: immediate PCI (or transfer
 * without on-site PCI), no thrombolysis, oxygen only below 90% saturation or for air, no routine
 * balloon pump, inotropes only when revascularisation is impossible (Oxford, with the 2023 ESC
 * changes the module gives: complication-management/01-principles-closure.ts, STEMI during
 * catheterisation).
 */
export function scoreIatrogenic(actions: readonly IatrogenicAction[] | undefined, truth: NonNullable<AcsCase["iatrogenic"]>): IatrogenicVerdict {
  const a = new Set(actions ?? []);
  // 'no-change-seen' is the occlusion missed: nothing was done for it
  const revascularise = !a.has("no-change-seen") && (truth.onsitePci ? a.has("immediate-pci") : a.has("transfer") || a.has("immediate-pci"));
  const noLysis = !a.has("thrombolysis");
  const oxygenNeeded = truth.air || truth.saturationPct < OXYGEN_BELOW_SAT_PCT;
  const oxygenRight = a.has("oxygen") === oxygenNeeded;
  const noRoutinePump = !a.has("routine-balloon-pump");
  // revascularisation is possible in every case here, so inotropes are not the measure
  const inotropesRight = !a.has("inotropes");
  return { revascularise, noLysis, oxygenRight, noRoutinePump, inotropesRight, correct: revascularise && noLysis && oxygenRight && noRoutinePump && inotropesRight };
}

// --- the reperfusion clock (cp-acs-thrombus-reperfusion) ------------------------------------------

/** Oxford: refer for primary PCI if it can happen within 120 minutes of the STEMI diagnosis, timed from the diagnosis. */
export const REPERFUSION_LIMIT_MIN = 120;

export interface ReperfusionClock {
  minutesSinceDiagnosis: number;
  limitMin: number;
  remainingMin: number;
  over: boolean;
}

export function reperfusionClock(diagnosisMinutesAgo: number, labSeconds: number): ReperfusionClock {
  const m = diagnosisMinutesAgo + Math.max(0, labSeconds) / 60;
  return { minutesSinceDiagnosis: m, limitMin: REPERFUSION_LIMIT_MIN, remainingMin: REPERFUSION_LIMIT_MIN - m, over: m > REPERFUSION_LIMIT_MIN };
}

// --- the ledger ------------------------------------------------------------------------------------

const yesNo = (b: boolean | undefined) => (b === undefined ? "Not stated" : b ? "Activate" : "Do not activate");

/** The ACS case's decisions as ledger records (src/mentor/ledger.ts), for the debrief. */
export function acsDecisions(c: AcsCase, a: AcsAnswers | undefined, o: { t?: number; engagement?: EngagementOrderVerdict } = {}): DecisionRecord[] {
  const t = o.t ?? 0;
  const out: DecisionRecord[] = [];
  if (c.ecg) {
    const g = gradeEcgPrediction(a?.ecg, c.ecg);
    const tr = c.ecg.truth;
    const say = (x: string | undefined, labels: Record<string, string>) => (x ? labels[x] : "Not stated");
    out.push({
      id: "acs-ecg-territory",
      t,
      stage: "setup",
      label: "ECG territory and artery",
      correct: g.correct,
      expected: `${ECG_TERRITORY_LABEL[tr.territory]}${tr.artery ? `, ${ECG_ARTERY_LABEL[tr.artery]}` : ""}${tr.level ? `, ${ECG_LEVEL_LABEL[tr.level].toLowerCase()}` : ""}`,
      given: `${say(a?.ecg?.territory, ECG_TERRITORY_LABEL)}, ${say(a?.ecg?.artery, ECG_ARTERY_LABEL)}, ${say(a?.ecg?.level, ECG_LEVEL_LABEL).toLowerCase()}`,
      lessonId: "cp-acs-thrombus-ecg",
      tipIds: ["diag-stemi-predict-artery"],
    });
    out.push({ id: "acs-ecg-activation", t, stage: "setup", label: "Reperfusion pathway", correct: g.activation, expected: yesNo(tr.activate), given: yesNo(a?.ecg?.activate), lessonId: "cp-acs-thrombus-ecg" });
  }
  if (c.triage) {
    const v = scoreOhcaTriage(a?.triage, c.triage);
    out.push({
      id: "acs-ohca-triage",
      t,
      stage: "setup",
      label: "Triage after the arrest",
      correct: v.correct,
      expected: OHCA_TRIAGE_LABEL[c.triage.expected] + (v.against ? ` (${v.against.text})` : ""),
      given: a?.triage?.choice ? OHCA_TRIAGE_LABEL[a.triage.choice] : "Not stated",
      lessonId: "cp-complex-patients-ohca",
      tipIds: ["diag-ohca-ecg-sorts"],
    });
    out.push({ id: "acs-ohca-team", t, stage: "setup", label: "Pads on and a named defibrillator operator", correct: v.teamReady, expected: "Pads on; one person named to defibrillate", given: v.teamReady ? "Both" : "Not both", lessonId: "cp-complex-patients-ohca" });
  }
  if (c.stemi && o.engagement) {
    out.push({ id: "acs-engagement-order", t, stage: "engage-left", label: "STEMI engagement order", correct: o.engagement.ok, expected: o.engagement.expected, given: o.engagement.given, lessonId: "pm-target-culprit", tipIds: ["diag-stemi-engagement-order"] });
  }
  if (c.culprit) {
    const v = scoreCulprit(a?.culprit, c.culprit);
    const none = c.culprit.vessel === "none-visible";
    out.push({
      id: "acs-culprit",
      t,
      stage: "finish",
      label: none ? "No visible culprit: the next steps" : "Culprit and clues",
      correct: v.culprit && v.enoughClues && v.workUp !== false,
      expected: none ? `None visible; ${NO_CULPRIT_STEPS.map((s) => NO_CULPRIT_STEP_LABEL[s].toLowerCase()).join(", then ")}` : `${c.culprit.vessel}; ${c.culprit.clues.map((x) => CULPRIT_CLUE_LABEL[x].toLowerCase()).join("; ")}`,
      given: a?.culprit?.vessel ? `${a.culprit.vessel}${a.culprit.clues.length ? `; ${a.culprit.clues.map((x) => CULPRIT_CLUE_LABEL[x].toLowerCase()).join("; ")}` : ""}` : "Not stated",
      lessonId: "pm-target-culprit",
      tipIds: ["diag-culprit-not-obvious"],
    });
  }
  if (c.iatrogenic) {
    const v = scoreIatrogenic(a?.iatrogenic, c.iatrogenic);
    out.push({
      id: "acs-iatrogenic",
      t,
      stage: "finish",
      label: "New ST elevation during the study: first measures",
      correct: v.correct,
      expected: c.iatrogenic.onsitePci ? "Immediate PCI; no thrombolysis; no oxygen at a normal saturation; no routine balloon pump" : "Transfer for PCI; no thrombolysis",
      given: (a?.iatrogenic ?? []).map((x) => IATROGENIC_ACTION_LABEL[x]).join("; ") || "Nothing chosen",
      lessonId: "cm-principles-closure-pmi",
      tipIds: ["diag-stemi-during-cath"],
    });
  }
  return out;
}
