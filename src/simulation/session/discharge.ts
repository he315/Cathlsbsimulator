// ---------------------------------------------------------------------------
// The discharge antithrombotic prescription (proc-discharge-prescription;
// requests hb-after-the-procedure#2 and pm-antithrombotics#5).
//
// After a PCI the learner writes the antithrombotic plan the patient goes home
// on: classifies the bleeding risk (ARC-HBR, one major or two minor criteria),
// chooses the P2Y12 inhibitor and the DAPT duration and what continues after
// it, adds a proton pump inhibitor where gastrointestinal bleeding risk is
// raised, warns a patient on ticagrelor about breathlessness, writes a stop or
// review date for every antiplatelet drug, builds triple then dual therapy for
// a patient on an oral anticoagulant (kept at the stroke-prevention dose), and
// advises on the timing of planned surgery. A follow-up visit may bring a
// bleed on the antiplatelets, which is answered and scored too.
//
// This file is pure (no engine, no session): the case facts of each discharge
// scenario (DISCHARGE_CASES, from which scenarios/discharge.ts builds its
// scenarios), the ARC-HBR classification, the plan, and its scoring against
// the module text. The session module (modules/discharge.ts) records the
// verdicts in the ledger.
//
// Sources (module text; lesson hb-after-the-procedure-dapt in
// src/content/manual/cath-handbook/09-after-the-procedure.ts, lesson
// pm-antithrombotics-oral in src/content/manual/pci-manual/03-antithrombotics.ts):
// - ARC-HBR (Urban 2019): one major or two minor criteria, the criteria table
//   at 09-after-the-procedure.ts:500-513 (age 75 or older minor; long-term
//   oral anticoagulation major; eGFR under 30 major, 30-59 minor; Hb under 11
//   major, 11-12.9 in men and 11-11.9 in women minor; spontaneous bleeding
//   needing admission or transfusion in 6 months or recurrent major, in 12
//   months minor; platelets under 100 x 10^9/L, chronic bleeding diathesis,
//   cirrhosis with portal hypertension major; long-term oral NSAIDs or
//   steroids minor; active cancer in 12 months major; previous spontaneous
//   ICH, traumatic ICH in 12 months, brain AVM, moderate or severe ischaemic
//   stroke in 6 months major, any other ischaemic stroke minor; major surgery
//   that cannot be deferred on DAPT, or major surgery or trauma in the 30
//   days before PCI, major).
// - The P2Y12 inhibitor: clopidogrel with an oral anticoagulant; clopidogrel
//   for stable disease, prasugrel or ticagrelor for ACS unless contraindicated;
//   no prasugrel after stroke or TIA, no ticagrelor after intracranial
//   haemorrhage or with strong CYP3A drugs; Oxford advises against prasugrel
//   over 75 years or under 60 kg (03-antithrombotics.ts:746-760). At high
//   bleeding risk after ACS, Oxford Table 8.8 gives clopidogrel or ticagrelor
//   (09-after-the-procedure.ts:482); Brilakis avoids prasugrel and ticagrelor
//   at high bleeding risk (09-after-the-procedure.ts:582).
// - Maintenance doses: aspirin 75 mg daily (Oxford) or 81-100 mg (Brilakis),
//   clopidogrel 75 mg daily, prasugrel 10 mg daily (5 mg under 60 kg or over
//   75 years, Brilakis), ticagrelor 90 mg twice daily
//   (03-antithrombotics.ts:707-733).
// - DAPT duration (09-after-the-procedure.ts:476-484): stable 6 months
//   (Brilakis 3.5, Oxford Table 8.8); stable at high bleeding risk 3 months
//   (both), 1 month after MASTER DAPT; ACS 12 months (both; 2023 ESC default);
//   ACS at high bleeding risk 6 months (both), monotherapy after 1 month may
//   be considered (2023 ESC). A single antiplatelet drug continues after DAPT
//   (the lesson's ARC-HBR check, :530). Stepping down to clopidogrel: not in
//   the first 30 days after ACS, may be considered after (2023 ESC, :484);
//   after a bleed (Brilakis 3.5, :584).
// - With an oral anticoagulant (2023 ESC, 09-after-the-procedure.ts:555-561):
//   triple therapy with aspirin and clopidogrel for up to 1 week, up to 1
//   month when ischaemic risk outweighs bleeding risk; then the anticoagulant
//   with clopidogrel for up to 12 months, shortened to 6 months in selected
//   patients with several bleeding risk factors; then the anticoagulant alone;
//   the anticoagulant at the stroke-prevention dose; never prasugrel or
//   ticagrelor in triple therapy.
// - The proton pump inhibitor: Brilakis gives one routinely with DAPT; the
//   2023 ESC ACS guideline where gastrointestinal bleeding risk is higher than
//   average, an anticoagulant and long-term NSAIDs or steroids among the
//   features (09-after-the-procedure.ts:582-583).
// - Ticagrelor: non-severe dyspnoea in up to 15% in the first week (Oxford),
//   the patient warned (09-after-the-procedure.ts:623).
// - Surgery (2022 ESC non-cardiac surgery guideline and Oxford,
//   09-after-the-procedure.ts:592-600): elective surgery after the full DAPT
//   course (6 months after elective PCI, 12 after ACS); time-sensitive surgery
//   after at least 1 month, at least 3 months considered after ACS; aspirin
//   continued; if the P2Y12 inhibitor must stop, prasugrel 7 days, clopidogrel
//   5 days, ticagrelor 3 days (Oxford) or 3-5 days (ESC) before; no heparin
//   bridging (Oxford).
// - A bleed on DAPT: control the site and step down from ticagrelor or
//   prasugrel to clopidogrel; platelet transfusion for life-threatening bleeding
//   on an irreversible agent, which may not work against ticagrelor
//   (09-after-the-procedure.ts:584-585); stopping DAPT outright is a pitfall
//   (the pitfalls, :629-638).
// Every other number is a MODEL PARAMETER (MP_DISCHARGE, and the scenario
// settings in DISCHARGE_CASES), listed in
// docs/realism/facts/pkg-proc-discharge-prescription.md.
// ---------------------------------------------------------------------------

import type { DoacAgent } from "../patient/pharmacology";
import type { PatientProfile } from "../patient/patient";
import type { ReportedStent } from "./handover";
import { DECISION_TEXT_MAX } from "../../mentor/ledger";

// ---------------------------------------------------------------------------
// Lessons and tips
// ---------------------------------------------------------------------------

export const DISCHARGE_LESSONS = {
  dapt: "hb-after-the-procedure-dapt",
  oral: "pm-antithrombotics-oral",
} as const;

export const DISCHARGE_TIPS = {
  plan: ["pci-post-dapt-plan"],
  oac: ["pci-post-oac-clopidogrel"],
  bleeding: ["pci-post-bleeding-dapt"],
  oral: ["pci-check-oral-loading"],
} as const;

// ---------------------------------------------------------------------------
// Sourced values
// ---------------------------------------------------------------------------

/** Sourced numbers of the prescription (module text, see the header). */
export const DISCHARGE_RULES = {
  /** ARC-HBR thresholds */
  hbr: {
    ageMinorY: 75,
    egfrMajor: 30,
    egfrMinor: 60,
    hbMajorGdl: 11,
    /** the upper end of the minor band: under 13 g/dL in men, under 12 in women */
    hbMinorBelowGdl: { M: 13, F: 12 } as Record<"M" | "F", number>,
    plateletsMajorBelow: 100,
  },
  /** prasugrel: Oxford advises against it over 75 years or under 60 kg */
  prasugrelAgeOverY: 75,
  prasugrelWeightUnderKg: 60,
  /** DAPT months: Brilakis 3.5 and Oxford Table 8.8; MASTER DAPT 1 month; 2023 ESC monotherapy after 1 month at HBR */
  daptMonths: {
    stable: 6,
    stableHbr: [1, 3] as [number, number],
    acs: 12,
    acsHbr: [1, 6] as [number, number],
  },
  /** stepping down to clopidogrel after ACS: not in the first 30 days (2023 ESC) */
  noDeEscalationDays: 30,
  /** triple therapy, days: up to 1 week, up to 1 month when ischaemic risk dominates (2023 ESC) */
  tripleMaxDays: 7,
  tripleIschaemicMaxDays: 30,
  /** the anticoagulant with clopidogrel to 12 months, 6 in selected patients with several bleeding risk factors */
  dualMonths: 12,
  dualShortMonths: 6,
  /** surgery: elective after the full course (6 months elective PCI, 12 ACS); time-sensitive after at least 1 month, 3 considered after ACS */
  surgeryElectiveMonths: { stable: 6, acs: 12 },
  surgeryTimeSensitiveMinMonths: 1,
  surgeryTimeSensitiveAcsMonths: 3,
  /** if the P2Y12 inhibitor must stop before surgery: days before (Oxford; ESC 3-5 for ticagrelor) */
  p2y12StopDays: { clopidogrel: [5, 5], prasugrel: [7, 7], ticagrelor: [3, 5] } as Record<P2y12Oral, [number, number]>,
} as const;

/** Maintenance doses as the two manuals give them (03-antithrombotics.ts:707-733). */
export const MAINTENANCE_DOSE: Record<"aspirin" | P2y12Oral, string> = {
  aspirin: "75 mg once daily (Oxford; Brilakis 81-100 mg)",
  clopidogrel: "75 mg once daily",
  prasugrel: "10 mg once daily (5 mg under 60 kg or over 75 years, Brilakis)",
  ticagrelor: "90 mg twice daily",
};

/**
 * MODEL PARAMETERS (docs/realism/facts/pkg-proc-discharge-prescription.md):
 * - stopDateTolMonthDays: a stop date written for a duration in months counts when it is within this many days of the plan's own date;
 * - stopDateTolDays: the same for a duration in days (triple therapy);
 * - tripleIschaemicMinDays: when ischaemic risk dominates, triple therapy shorter than this undertreats (the default week is the floor);
 * - defaultHbGdl, defaultPlatelets: the bloods of a case that ran PCI without a discharge scenario (the generated patient has none);
 * - defaultPciDate: the procedure date of such a case (the stop dates count from it);
 * - signS: the time to write and sign the prescription, s;
 * - followUpS: the time the follow-up visit takes in the case, s;
 * - dualShortMinOtherCriteria: ARC-HBR criteria besides the anticoagulant that make a patient one of the 'selected
 *   patients, such as those with several bleeding risk factors' (09-after-the-procedure.ts:559) whose dual therapy may
 *   stop at 6 months; the anticoagulant is itself one, so one more gives two;
 * - derivedOacIndication: what the chart of a derived case says the anticoagulant is for when the generated patient
 *   is not in atrial fibrillation (the profile carries no other indication).
 */
export const MP_DISCHARGE = {
  stopDateTolMonthDays: 7,
  stopDateTolDays: 2,
  tripleIschaemicMinDays: 7,
  defaultHbGdl: { M: 14.2, F: 13.1 } as Record<"M" | "F", number>,
  defaultPlatelets: 240,
  defaultPciDate: "2026-03-02",
  signS: 120,
  followUpS: 60,
  dualShortMinOtherCriteria: 1,
  derivedOacIndication: "its existing indication",
};

// ---------------------------------------------------------------------------
// Case facts
// ---------------------------------------------------------------------------

export type P2y12Oral = "clopidogrel" | "prasugrel" | "ticagrelor";
export type OacDrug = "warfarin" | DoacAgent;
export type DischargePresentation = "stable" | "acs";

/** Previous spontaneous bleeding needing admission or transfusion. */
export type BleedHistory = "none" | "major-6m" | "recurrent" | "minor-12m";
/** The brain, as ARC-HBR and the P2Y12 contraindications read it. */
export type BrainHistory = "none" | "ich" | "traumatic-ich-12m" | "bavm" | "stroke-moderate-6m" | "stroke-other" | "tia";

export interface SurgeryPlanned {
  kind: "elective" | "time-sensitive";
  /** what the chart says, e.g. 'Right total hip replacement, listed for 4 months' time' */
  text: string;
}

/** A follow-up visit after discharge (a scenario setting). */
export interface FollowUp {
  /** days after the PCI */
  day: number;
  /** what the patient reports (no diagnosis on it) */
  text: string;
  /** the bleed, if this visit brings one */
  bleed: { severity: "minor" | "life-threatening"; site: string } | null;
}

export interface DischargeCase {
  /** the scenario id */
  id: string;
  presentation: DischargePresentation;
  /** what the chart calls it */
  presentationText: string;
  hbGdl: number;
  plateletsE9L: number;
  bleeding: BleedHistory;
  brain: BrainHistory;
  /** active malignancy (not non-melanoma skin cancer) in the past 12 months */
  cancer: string | null;
  /** a long-term oral NSAID or steroid */
  nsaidOrSteroid: string | null;
  /** chronic bleeding diathesis, or cirrhosis with portal hypertension */
  diathesis: string | null;
  /** major surgery or major trauma in the 30 days before PCI */
  recentMajorSurgery: string | null;
  /** surgery planned after the PCI */
  surgery: SurgeryPlanned | null;
  /** surgery that cannot be deferred, due while on DAPT (ARC-HBR major) */
  surgeryNonDeferrable?: boolean;
  oac: { drug: OacDrug; regimen: string; indication: string } | null;
  /** ischaemic risk or anatomical and procedural features outweigh bleeding risk */
  ischaemicRiskDominates: string | null;
  /** a strong CYP3A inhibitor or inducer */
  cyp3a: string | null;
  /** the procedure date (ISO yyyy-mm-dd): the stop dates count from it */
  pciDate: string;
  followUp: FollowUp | null;
  /** the case was not a discharge scenario: its facts were read from the generated patient */
  derived?: boolean;
}

/** The patient facts the scoring reads (from the profile). */
export interface DischargePatient {
  sex: "M" | "F";
  ageY: number;
  weightKg: number;
  egfr: number;
}

export const dischargePatient = (p: Pick<PatientProfile, "sex" | "ageY" | "weightKg" | "renal">): DischargePatient => ({ sex: p.sex, ageY: p.ageY, weightKg: p.weightKg, egfr: p.renal.egfr });

const PCI_DATE = MP_DISCHARGE.defaultPciDate;
const BASE: Omit<DischargeCase, "id" | "presentation" | "presentationText"> = {
  hbGdl: 14.2,
  plateletsE9L: 240,
  bleeding: "none",
  brain: "none",
  cancer: null,
  nsaidOrSteroid: null,
  diathesis: null,
  recentMajorSurgery: null,
  surgery: null,
  oac: null,
  ischaemicRiskDominates: null,
  cyp3a: null,
  pciDate: PCI_DATE,
  followUp: null,
};

/**
 * The discharge scenarios' case facts (scenarios/discharge.ts builds each scenario's patient from these; age, sex,
 * weight and the creatinine are set there, so the eGFR is the profile's). Every value is a scenario setting (MODEL
 * PARAMETER); the dapt-hbr-one-major and dapt-af-acs patients are the lesson's own check questions
 * (09-after-the-procedure.ts:521-531 and :567-577).
 */
export const DISCHARGE_CASES: Readonly<Record<string, DischargeCase>> = Object.fromEntries(
  (
    [
      {
        ...BASE,
        id: "dapt-stable",
        presentation: "stable",
        presentationText: "Stable angina, elective PCI",
        followUp: { day: 12, text: "Seen in clinic 12 days after the PCI: nosebleeds on three evenings this week, each stopped with pressure in a few minutes. Haemoglobin unchanged.", bleed: { severity: "minor", site: "nose" } },
      },
      { ...BASE, id: "dapt-acs", presentation: "acs", presentationText: "NSTEMI, PCI to the culprit", hbGdl: 14.8, plateletsE9L: 265 },
      { ...BASE, id: "dapt-hbr-one-major", presentation: "acs", presentationText: "NSTEMI, PCI to the culprit", hbGdl: 12.4, plateletsE9L: 210 },
      { ...BASE, id: "dapt-hbr-two-minor", presentation: "stable", presentationText: "Stable angina, elective PCI", hbGdl: 13.6, plateletsE9L: 190 },
      {
        ...BASE,
        id: "dapt-af-acs",
        presentation: "acs",
        presentationText: "NSTEMI, PCI to the culprit",
        hbGdl: 13.9,
        oac: { drug: "apixaban", regimen: "Apixaban 5 mg twice daily", indication: "atrial fibrillation" },
      },
      {
        ...BASE,
        id: "dapt-af-ischaemic",
        presentation: "acs",
        presentationText: "STEMI, primary PCI",
        hbGdl: 14.5,
        oac: { drug: "rivaroxaban", regimen: "Rivaroxaban 20 mg once daily", indication: "atrial fibrillation" },
        ischaemicRiskDominates: "Stent thrombosis of a previous LAD stent last year; diabetes; two long overlapping stents today",
      },
      {
        ...BASE,
        id: "dapt-surgery-planned",
        presentation: "stable",
        presentationText: "Stable angina, elective PCI",
        hbGdl: 13.4,
        surgery: { kind: "elective", text: "Right total hip replacement for osteoarthritis, listed by the orthopaedic team for 4 months from now" },
      },
    ] as DischargeCase[]
  ).map((c) => [c.id, c]),
);

export const dischargeCase = (scenarioId: string): DischargeCase | undefined => DISCHARGE_CASES[scenarioId];

/**
 * The facts of a case that ran PCI without a discharge scenario: the presentation and the anticoagulant from the
 * generated patient, bloods and a procedure date as MODEL PARAMETERS, nothing else on the chart.
 */
export function derivedDischargeCase(p: Pick<PatientProfile, "sex" | "indication" | "anticoagulation" | "doac"> & { baseline?: Pick<PatientProfile["baseline"], "rhythm"> }): DischargeCase {
  const acs = p.indication === "UA" || p.indication === "NSTEMI" || p.indication === "STEMI";
  const text = p.indication === "STEMI" ? "STEMI, primary PCI" : p.indication === "NSTEMI" ? "NSTEMI, PCI to the culprit" : p.indication === "UA" ? "Unstable angina, PCI" : "Stable angina, PCI";
  // the indication only when the profile shows it (atrial fibrillation in the baseline rhythm)
  const indication = p.baseline?.rhythm === "af" ? "atrial fibrillation" : MP_DISCHARGE.derivedOacIndication;
  const oac: DischargeCase["oac"] =
    p.anticoagulation === "warfarin"
      ? { drug: "warfarin", regimen: "Warfarin, target INR 2-3", indication }
      : p.anticoagulation === "doac"
      ? { drug: p.doac?.agent ?? "apixaban", regimen: `${cap(p.doac?.agent ?? "apixaban")}, the usual dose`, indication }
      : null;
  return { ...BASE, id: "derived", presentation: acs ? "acs" : "stable", presentationText: text, hbGdl: MP_DISCHARGE.defaultHbGdl[p.sex], plateletsE9L: MP_DISCHARGE.defaultPlatelets, oac, derived: true };
}

// ---------------------------------------------------------------------------
// ARC-HBR
// ---------------------------------------------------------------------------

export type HbrCriterion =
  | "age"
  | "oac"
  | "egfr-major"
  | "egfr-minor"
  | "hb-major"
  | "hb-minor"
  | "bleed-major"
  | "bleed-minor"
  | "platelets"
  | "diathesis"
  | "nsaid-steroid"
  | "cancer"
  | "brain-major"
  | "stroke-minor"
  | "surgery-major";

/** The ARC-HBR criteria as the lesson's table lists them (Urban et al. 2019; 09-after-the-procedure.ts:500-513). */
export const ARC_HBR: readonly { id: HbrCriterion; major: boolean; label: string }[] = [
  { id: "age", major: false, label: "Age 75 years or older" },
  { id: "oac", major: true, label: "Long-term oral anticoagulation expected" },
  { id: "egfr-major", major: true, label: "eGFR under 30 mL/min" },
  { id: "egfr-minor", major: false, label: "eGFR 30-59 mL/min" },
  { id: "hb-major", major: true, label: "Haemoglobin under 11 g/dL" },
  { id: "hb-minor", major: false, label: "Haemoglobin 11-12.9 g/dL in men, 11-11.9 g/dL in women" },
  { id: "bleed-major", major: true, label: "Spontaneous bleeding needing admission or transfusion in the past 6 months, or recurrent" },
  { id: "bleed-minor", major: false, label: "Such bleeding in the past 12 months, not meeting the major criterion" },
  { id: "platelets", major: true, label: "Platelets under 100 × 10⁹/L before PCI" },
  { id: "diathesis", major: true, label: "Chronic bleeding diathesis, or cirrhosis with portal hypertension" },
  { id: "nsaid-steroid", major: false, label: "Long-term oral NSAIDs or steroids" },
  { id: "cancer", major: true, label: "Active malignancy in the past 12 months (not non-melanoma skin cancer)" },
  { id: "brain-major", major: true, label: "Previous spontaneous ICH, traumatic ICH within 12 months, brain AVM, or moderate or severe ischaemic stroke within 6 months" },
  { id: "stroke-minor", major: false, label: "Any other ischaemic stroke at any time" },
  { id: "surgery-major", major: true, label: "Non-deferrable major surgery on DAPT, or major surgery or trauma in the 30 days before PCI" },
];

export interface HbrResult {
  major: HbrCriterion[];
  minor: HbrCriterion[];
  high: boolean;
}

/** ARC-HBR: the criteria the case meets, and high bleeding risk on one major or two minor criteria. */
export function arcHbr(c: DischargeCase, p: DischargePatient): HbrResult {
  const R = DISCHARGE_RULES.hbr;
  const met = new Set<HbrCriterion>();
  if (p.ageY >= R.ageMinorY) met.add("age");
  if (c.oac) met.add("oac");
  if (p.egfr < R.egfrMajor) met.add("egfr-major");
  else if (p.egfr < R.egfrMinor) met.add("egfr-minor");
  if (c.hbGdl < R.hbMajorGdl) met.add("hb-major");
  else if (c.hbGdl < R.hbMinorBelowGdl[p.sex]) met.add("hb-minor");
  if (c.bleeding === "major-6m" || c.bleeding === "recurrent") met.add("bleed-major");
  else if (c.bleeding === "minor-12m") met.add("bleed-minor");
  if (c.plateletsE9L < R.plateletsMajorBelow) met.add("platelets");
  if (c.diathesis) met.add("diathesis");
  if (c.nsaidOrSteroid) met.add("nsaid-steroid");
  if (c.cancer) met.add("cancer");
  if (c.brain === "ich" || c.brain === "traumatic-ich-12m" || c.brain === "bavm" || c.brain === "stroke-moderate-6m") met.add("brain-major");
  else if (c.brain === "stroke-other") met.add("stroke-minor");
  if (c.surgeryNonDeferrable || c.recentMajorSurgery) met.add("surgery-major");
  const major = ARC_HBR.filter((k) => k.major && met.has(k.id)).map((k) => k.id);
  const minor = ARC_HBR.filter((k) => !k.major && met.has(k.id)).map((k) => k.id);
  return { major, minor, high: major.length >= 1 || minor.length >= 2 };
}

const criterionLabel = (id: HbrCriterion) => ARC_HBR.find((k) => k.id === id)?.label ?? id;

// ---------------------------------------------------------------------------
// The plan
// ---------------------------------------------------------------------------

/** What continues after DAPT ends (no anticoagulant). */
export type AfterDapt = "aspirin" | "p2y12" | "none";
export type SurgeryTiming = "now" | "1-month" | "3-months" | "after-dapt";
export type BleedResponse = "local-continue" | "local-step-down" | "stop-all" | "platelets";

export interface DischargePlan {
  /** the learner's bleeding risk classification */
  hbr: "high" | "not-high" | null;
  /** the criteria the learner ticked (shown in the debrief beside the classification) */
  criteria: HbrCriterion[];
  aspirin: boolean;
  p2y12: P2y12Oral | null;
  /** without an anticoagulant: months of DAPT, then what continues */
  daptMonths: number | null;
  after: AfterDapt | null;
  /** with an anticoagulant: days of triple therapy (aspirin stops), months to which the anticoagulant runs with clopidogrel */
  tripleDays: number | null;
  dualMonths: number | null;
  oacDose: "stroke-prevention" | "reduced" | null;
  /** a step-down to clopidogrel is planned (the day is then required) */
  switchPlanned: boolean;
  /** a planned step-down from prasugrel or ticagrelor to clopidogrel, days after the PCI (null: none, or not yet written) */
  switchToClopidogrelDay: number | null;
  ppi: boolean;
  /** the patient warned that ticagrelor can cause breathlessness in the first week */
  dyspnoeaWarned: boolean;
  /** the stop or review date of each antiplatelet drug (ISO yyyy-mm-dd) */
  stopDates: { aspirin: string | null; p2y12: string | null };
  /** advice on the planned surgery */
  surgery: { timing: SurgeryTiming | null; aspirin: "continue" | "stop" | null; p2y12StopDays: number | null; bridging: boolean };
}

export const emptyPlan = (): DischargePlan => ({
  hbr: null,
  criteria: [],
  aspirin: true,
  p2y12: null,
  daptMonths: null,
  after: null,
  tripleDays: null,
  dualMonths: null,
  oacDose: null,
  switchPlanned: false,
  switchToClopidogrelDay: null,
  ppi: false,
  dyspnoeaWarned: false,
  stopDates: { aspirin: null, p2y12: null },
  surgery: { timing: null, aspirin: null, p2y12StopDays: null, bridging: false },
});

const num = (x: number | null | undefined): x is number => typeof x === "number" && Number.isFinite(x);

/** What the prescription still needs before it can be signed (empty: complete). Stop dates are scored, not required. */
export function missingPlan(c: DischargeCase, o: DischargePlan): string[] {
  const out: string[] = [];
  if (!o.hbr) out.push("the bleeding risk classification");
  if (!o.p2y12) out.push("the P2Y12 inhibitor");
  if (c.oac) {
    if (o.aspirin && !num(o.tripleDays)) out.push("how long the triple therapy runs");
    if (!num(o.dualMonths)) out.push("when the antiplatelet stops beside the anticoagulant");
    if (!o.oacDose) out.push("the anticoagulant dose");
  } else {
    if (!num(o.daptMonths)) out.push("the DAPT duration");
    if (!o.after) out.push("what continues after DAPT");
  }
  if (o.switchPlanned && !num(o.switchToClopidogrelDay)) out.push("the day of the switch to clopidogrel");
  if (c.surgery && !o.surgery.timing) out.push("the advice on the planned operation");
  return out;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const DAY_MS = 86_400_000;
const parseIso = (d: string): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return Number.isFinite(t) ? t : null;
};
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** The date `months` calendar months (or `days` days) after an ISO date. */
export function addToDate(date: string, o: { months?: number; days?: number }): string {
  const t = parseIso(date);
  if (t === null) return date;
  const d = new Date(t);
  if (o.months) {
    const whole = Math.floor(o.months);
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + whole);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
    const frac = o.months - whole;
    if (frac) d.setUTCDate(d.getUTCDate() + Math.round(frac * 30));
  }
  if (o.days) d.setUTCDate(d.getUTCDate() + Math.round(o.days));
  return iso(d.getTime());
}

/** Whole days from a to b (b later is positive); null when either is not a date. */
export function daysBetween(a: string, b: string): number | null {
  const ta = parseIso(a);
  const tb = parseIso(b);
  return ta === null || tb === null ? null : Math.round((tb - ta) / DAY_MS);
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export interface DischargeVerdict {
  /** stable id within the prescription; the ledger id is 'discharge-<id>' */
  id: string;
  label: string;
  correct: boolean;
  expected: string;
  given: string;
  lessonId: string;
  tipIds: string[];
}

const DRUG: Record<P2y12Oral | "aspirin", string> = { aspirin: "aspirin", clopidogrel: "clopidogrel", prasugrel: "prasugrel", ticagrelor: "ticagrelor" };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const mo = (m: number) => `${m} month${m === 1 ? "" : "s"}`;
const range = (r: readonly [number, number], unit: (n: number) => string) => (r[0] === r[1] ? unit(r[0]) : `${r[0]}-${unit(r[1])}`);

/**
 * The P2Y12 inhibitors the module text allows for this patient, and `why`: the debrief's expected answer, the allowed
 * drugs first, then the reason and (where the manuals differ) the other position with its source, then each
 * contraindication that ruled a drug out. It is written to fit the ledger's DECISION_TEXT_MAX (160 characters, src/
 * mentor/ledger.ts): the source comparison is dropped only if the contraindications leave no room for it.
 */
export function allowedP2y12(c: DischargeCase, p: DischargePatient, hbrHigh: boolean): { allowed: P2y12Oral[]; why: string } {
  if (c.oac) return { allowed: ["clopidogrel"], why: "Clopidogrel: with an anticoagulant the partner is clopidogrel; prasugrel and ticagrelor are not used in triple therapy" };
  if (c.presentation === "stable") return { allowed: ["clopidogrel"], why: "Clopidogrel for stable disease (Brilakis; Oxford)" };
  let allowed: P2y12Oral[] = hbrHigh ? ["clopidogrel", "ticagrelor"] : ["prasugrel", "ticagrelor"];
  const reason = hbrHigh ? "ACS at high bleeding risk (Oxford Table 8.8)" : "ACS (Brilakis; 2023 ESC)";
  // where the manuals differ, the verdict follows one and the other's position is shown beside it
  const compare = hbrHigh ? "Brilakis avoids prasugrel and ticagrelor at high bleeding risk" : "Oxford Table 8.8 also lists clopidogrel";
  const ruled: string[] = [];
  const rule = (drug: P2y12Oral, when: boolean, note: string) => {
    if (!when || !allowed.includes(drug)) return;
    allowed = allowed.filter((d) => d !== drug);
    ruled.push(note);
  };
  rule("prasugrel", c.brain === "stroke-other" || c.brain === "stroke-moderate-6m" || c.brain === "tia", "no prasugrel after stroke or TIA");
  rule("ticagrelor", c.brain === "ich" || c.brain === "traumatic-ich-12m", "no ticagrelor after intracranial haemorrhage");
  rule("ticagrelor", !!c.cyp3a, "no ticagrelor with a strong CYP3A drug");
  rule("prasugrel", p.ageY > DISCHARGE_RULES.prasugrelAgeOverY || p.weightKg < DISCHARGE_RULES.prasugrelWeightUnderKg, "over 75 y or under 60 kg: no prasugrel (Oxford) or prasugrel 5 mg (Brilakis)");
  if (!allowed.length) allowed = ["clopidogrel"];
  const head = `${allowed.map(cap).join(" or ")}: ${reason}`;
  const full = [head, compare, ...ruled].join("; ");
  return { allowed, why: full.length <= DECISION_TEXT_MAX ? full : [head, ...ruled].join("; ") };
}

/** The DAPT months the module text accepts without an anticoagulant. */
export function daptRange(c: DischargeCase, hbrHigh: boolean): { range: [number, number]; text: string } {
  const D = DISCHARGE_RULES.daptMonths;
  if (c.presentation === "stable")
    return hbrHigh
      ? { range: [...D.stableHbr], text: "1-3 months (3: Brilakis, Oxford; 1: MASTER DAPT), then one antiplatelet" }
      : { range: [D.stable, D.stable], text: "6 months (Brilakis 3.5; Oxford Table 8.8), then one antiplatelet" };
  return hbrHigh
    ? { range: [...D.acsHbr], text: "1-6 months (6: Brilakis, Oxford; from 1: 2023 ESC), then one antiplatelet" }
    : { range: [D.acs, D.acs], text: "12 months (Brilakis, Oxford, 2023 ESC), then one antiplatelet" };
}

/** The triple therapy days the module text accepts with an anticoagulant. */
export function tripleRange(c: DischargeCase): [number, number] {
  return c.ischaemicRiskDominates ? [MP_DISCHARGE.tripleIschaemicMinDays, DISCHARGE_RULES.tripleIschaemicMaxDays] : [0, DISCHARGE_RULES.tripleMaxDays];
}

/** The dual therapy months accepted: 12, or 6 with enough bleeding risk factors beyond the anticoagulant (MP_DISCHARGE.dualShortMinOtherCriteria). */
export function dualOptions(c: DischargeCase, hbr: HbrResult): number[] {
  const others = [...hbr.major, ...hbr.minor].filter((k) => k !== "oac").length;
  return others >= MP_DISCHARGE.dualShortMinOtherCriteria ? [DISCHARGE_RULES.dualShortMonths, DISCHARGE_RULES.dualMonths] : [DISCHARGE_RULES.dualMonths];
}

/** Whether the P2Y12 inhibitor is still being taken at the time of the operation (its stop interval then applies). */
export function p2y12RunningAtSurgery(c: DischargeCase, o: Pick<DischargePlan, "after" | "surgery">): boolean {
  // after the full course the P2Y12 inhibitor has stopped, unless it is the drug that continues (no anticoagulant)
  return o.surgery.timing !== "after-dapt" || (!c.oac && o.after === "p2y12");
}

/** Whether a PPI is required (raised gastrointestinal bleeding risk: an anticoagulant, a long-term NSAID or steroid). */
export function ppiRequired(c: DischargeCase): boolean {
  return !!c.oac || !!c.nsaidOrSteroid;
}

/** The stop dates the plan itself implies: for each prescribed drug, the date it stops, or the earliest review date if it continues. */
export function planStopDates(c: DischargeCase, o: DischargePlan): { aspirin: { date: string; continues: boolean; days: boolean } | null; p2y12: { date: string; continues: boolean; days: boolean } | null } {
  const d0 = c.pciDate;
  if (c.oac) {
    return {
      aspirin: o.aspirin && num(o.tripleDays) ? { date: addToDate(d0, { days: o.tripleDays }), continues: false, days: true } : null,
      p2y12: o.p2y12 && num(o.dualMonths) ? { date: addToDate(d0, { months: o.dualMonths }), continues: false, days: false } : null,
    };
  }
  if (!num(o.daptMonths)) return { aspirin: null, p2y12: null };
  const end = addToDate(d0, { months: o.daptMonths });
  return {
    aspirin: o.aspirin ? { date: end, continues: o.after === "aspirin", days: false } : null,
    p2y12: o.p2y12 ? { date: end, continues: o.after === "p2y12", days: false } : null,
  };
}

/** Score the prescription against the module text. `bled`: a bleed happened in the case (stepping down is then allowed early). */
export function scorePlan(c: DischargeCase, p: DischargePatient, o: DischargePlan, ctx: { bled: boolean } = { bled: false }): DischargeVerdict[] {
  const out: DischargeVerdict[] = [];
  const L = DISCHARGE_LESSONS;
  const T = DISCHARGE_TIPS;
  const hbr = arcHbr(c, p);
  const tips = (...xs: readonly (readonly string[])[]) => [...new Set(xs.flat())];

  // 1. bleeding risk
  const met = [...hbr.major.map((k) => `major: ${criterionLabel(k)}`), ...hbr.minor.map((k) => `minor: ${criterionLabel(k)}`)];
  out.push({
    id: "hbr",
    label: "Bleeding risk (ARC-HBR)",
    correct: o.hbr === (hbr.high ? "high" : "not-high"),
    expected: `${hbr.high ? "High" : "Not high"} (${hbr.major.length} major, ${hbr.minor.length} minor; one major or two minor)${met.length ? `: ${met.join("; ")}` : ""}`,
    given: `${o.hbr === "high" ? "High" : o.hbr === "not-high" ? "Not high" : "Not classified"}${o.criteria.length ? ` (ticked: ${o.criteria.map(criterionLabel).join("; ")})` : ""}`,
    lessonId: L.dapt,
    tipIds: tips(T.plan),
  });

  // 2. the P2Y12 inhibitor
  const ap = allowedP2y12(c, p, hbr.high);
  out.push({
    id: "p2y12",
    label: c.oac ? "P2Y12 inhibitor with the anticoagulant" : "P2Y12 inhibitor",
    correct: !!o.p2y12 && ap.allowed.includes(o.p2y12),
    expected: ap.why,
    given: o.p2y12 ? cap(o.p2y12) : "None",
    lessonId: c.oac ? L.dapt : L.oral,
    tipIds: tips(c.oac ? T.oac : T.plan, T.oral),
  });

  // 3. the duration
  if (c.oac) {
    const tr = tripleRange(c);
    const days = o.aspirin ? o.tripleDays ?? 0 : 0;
    const dual = dualOptions(c, hbr);
    const tripleOk = days >= tr[0] && days <= tr[1];
    const dualOk = num(o.dualMonths) && dual.includes(o.dualMonths);
    out.push({
      id: "triple-dual",
      label: "Triple then dual therapy",
      correct: tripleOk && dualOk,
      expected: `Triple ${c.ischaemicRiskDominates ? "1 week to 1 month (ischaemic risk dominates)" : "up to 1 week"}, then anticoagulant with clopidogrel to ${dual.map(String).join(" or ")} months, then anticoagulant alone`,
      given: `${o.aspirin ? `Triple ${days} days` : "No aspirin after the procedure"}, anticoagulant with ${o.p2y12 ?? "no P2Y12"} to ${num(o.dualMonths) ? mo(o.dualMonths) : "no stop"}`,
      lessonId: L.dapt,
      tipIds: tips(T.oac),
    });
    out.push({
      id: "oac-dose",
      label: "Anticoagulant dose",
      correct: o.oacDose === "stroke-prevention",
      expected: "The dose recommended for stroke prevention, not reduced for the antiplatelets (2023 ESC)",
      given: o.oacDose === "stroke-prevention" ? "Stroke-prevention dose" : o.oacDose === "reduced" ? "Reduced because of the antiplatelets" : "Not stated",
      lessonId: L.dapt,
      tipIds: tips(T.oac),
    });
  } else {
    const dr = daptRange(c, hbr.high);
    const m = o.daptMonths;
    out.push({
      id: "dapt-duration",
      label: "DAPT duration",
      correct: num(m) && m >= dr.range[0] && m <= dr.range[1] && o.aspirin && (o.after === "aspirin" || o.after === "p2y12"),
      expected: dr.text,
      given: `${o.aspirin ? "Aspirin with " : "No aspirin; "}${o.p2y12 ?? "no P2Y12"} for ${num(m) ? mo(m) : "no stated time"}, then ${o.after === "aspirin" ? "aspirin alone" : o.after === "p2y12" ? "the P2Y12 inhibitor alone" : "nothing"}`,
      lessonId: L.dapt,
      tipIds: tips(T.plan),
    });
  }

  // 4. stepping down (only when planned)
  if (num(o.switchToClopidogrelDay) && o.p2y12 && o.p2y12 !== "clopidogrel") {
    const early = c.presentation === "acs" && o.switchToClopidogrelDay < DISCHARGE_RULES.noDeEscalationDays && !ctx.bled;
    out.push({
      id: "de-escalation",
      label: "Stepping down to clopidogrel",
      correct: !early,
      expected: c.presentation === "acs" && !ctx.bled ? "Not in the first 30 days after ACS without bleeding; may be considered after 30 days (2023 ESC)" : "A step-down to clopidogrel is acceptable here",
      given: `${cap(o.p2y12)} to clopidogrel on day ${o.switchToClopidogrelDay}${ctx.bled ? " (after a bleed)" : ""}`,
      lessonId: L.dapt,
      tipIds: tips(T.plan, ctx.bled ? T.bleeding : []),
    });
  }

  // 5. the proton pump inhibitor
  const ppiNeeded = ppiRequired(c);
  out.push({
    id: "ppi",
    label: "Proton pump inhibitor",
    correct: ppiNeeded ? o.ppi : true,
    expected: ppiNeeded ? `A PPI: gastrointestinal bleeding risk is raised (${c.oac ? "an anticoagulant" : "a long-term NSAID or steroid"}; 2023 ESC; Brilakis gives one routinely)` : "Optional: Brilakis gives one routinely with DAPT; the 2023 ESC by gastrointestinal risk",
    given: o.ppi ? "PPI prescribed" : "No PPI",
    lessonId: L.dapt,
    tipIds: tips(T.plan),
  });

  // 6. ticagrelor
  if (o.p2y12 === "ticagrelor")
    out.push({
      id: "ticagrelor-dyspnoea",
      label: "Ticagrelor: the breathlessness warning",
      correct: o.dyspnoeaWarned,
      expected: "Warned: non-severe breathlessness in up to 15% in the first week (Oxford); report it rather than stop the tablet",
      given: o.dyspnoeaWarned ? "Warned" : "Not warned",
      lessonId: L.dapt,
      tipIds: tips(T.plan),
    });

  // 7. stop dates
  const want = planStopDates(c, o);
  const lines: string[] = [];
  const exp: string[] = [];
  let datesOk = true;
  for (const k of ["aspirin", "p2y12"] as const) {
    const w = want[k];
    if (!w) continue;
    const name = k === "aspirin" ? "aspirin" : o.p2y12 ?? "P2Y12";
    const given = o.stopDates[k];
    lines.push(`${name} ${given ?? "no date"}`);
    exp.push(`${name} ${w.continues ? `review from ${w.date}` : `stop ${w.date}`}`);
    if (!given) {
      datesOk = false;
      continue;
    }
    const d = daysBetween(w.date, given);
    const tol = w.days ? MP_DISCHARGE.stopDateTolDays : MP_DISCHARGE.stopDateTolMonthDays;
    if (d === null) datesOk = false;
    else if (w.continues ? d < -tol : Math.abs(d) > tol) datesOk = false;
  }
  out.push({
    id: "stop-dates",
    label: "Stop or review dates",
    correct: datesOk && exp.length > 0,
    expected: exp.length ? `Every antiplatelet dated from the PCI (${c.pciDate}): ${exp.join("; ")}` : "Every antiplatelet drug carries a stop or review date",
    given: lines.length ? lines.join("; ") : "No antiplatelet dated",
    lessonId: L.dapt,
    tipIds: tips(T.plan),
  });

  // 8. surgery
  if (c.surgery) {
    const S = DISCHARGE_RULES;
    const acs = c.presentation === "acs";
    const okTiming: SurgeryTiming[] = c.surgery.kind === "elective" ? ["after-dapt"] : acs ? ["3-months"] : ["1-month", "3-months"];
    const timingText: Record<SurgeryTiming, string> = { now: "now", "1-month": "after at least 1 month", "3-months": "after at least 3 months", "after-dapt": "after the full DAPT course" };
    out.push({
      id: "surgery-timing",
      label: "Timing of the planned operation",
      correct: !!o.surgery.timing && okTiming.includes(o.surgery.timing),
      expected:
        c.surgery.kind === "elective"
          ? `Elective: after the full DAPT course, ${acs ? S.surgeryElectiveMonths.acs : S.surgeryElectiveMonths.stable} months (2022 ESC)`
          : `Time-sensitive: after at least ${acs ? S.surgeryTimeSensitiveAcsMonths : S.surgeryTimeSensitiveMinMonths} month${acs ? "s" : ""} of DAPT (2022 ESC)`,
      given: o.surgery.timing ? `Operate ${timingText[o.surgery.timing]}` : "No advice",
      lessonId: L.dapt,
      tipIds: tips(T.plan),
    });
    const stop = o.p2y12 ? S.p2y12StopDays[o.p2y12] : null;
    const sd = o.surgery.p2y12StopDays;
    const daysOk = !stop || sd === null || (sd >= stop[0] && sd <= stop[1]);
    // the stop interval is needed only while the P2Y12 inhibitor is still taken at the time of the operation
    const running = p2y12RunningAtSurgery(c, o);
    const name = o.p2y12 ?? "the P2Y12 inhibitor";
    out.push({
      id: "surgery-drugs",
      label: "Antiplatelets around the operation",
      correct: o.surgery.aspirin === "continue" && !o.surgery.bridging && (running ? sd !== null && daysOk : sd === null || daysOk),
      expected: `Aspirin continued; ${
        running ? `${name} stopped ${stop ? range(stop, (n) => `${n} days`) : "as its own interval"} before` : `no ${name} stop needed: it will have stopped at the end of DAPT`
      }; no heparin bridging`,
      given: `Aspirin ${o.surgery.aspirin === "continue" ? "continued" : o.surgery.aspirin === "stop" ? "stopped" : "not stated"}; P2Y12 ${num(o.surgery.p2y12StopDays) ? `stopped ${o.surgery.p2y12StopDays} days before` : "stop not stated"}; ${o.surgery.bridging ? "heparin bridging" : "no bridging"}`,
      lessonId: L.dapt,
      tipIds: tips(T.plan),
    });
  }
  return out;
}

/** The answer to a bleed on the antiplatelets at follow-up. */
export function scoreBleedResponse(r: BleedResponse, onP2y12: P2y12Oral | null, severity: "minor" | "life-threatening"): DischargeVerdict {
  const potent = onP2y12 === "prasugrel" || onP2y12 === "ticagrelor";
  let correct: boolean;
  if (r === "stop-all") correct = false;
  else if (r === "platelets") correct = severity === "life-threatening" && onP2y12 !== "ticagrelor";
  else if (r === "local-continue") correct = !potent;
  else correct = true;
  const words: Record<BleedResponse, string> = {
    "local-continue": "Control the site, antiplatelets unchanged",
    "local-step-down": "Control the site, step down to clopidogrel",
    "stop-all": "Stop all antiplatelet drugs",
    platelets: "Platelet transfusion",
  };
  return {
    id: "bleed-response",
    label: "Bleeding on the antiplatelets",
    correct,
    expected: potent
      ? `Control the site and step down from ${onP2y12} to clopidogrel (Brilakis 3.5); platelets may not reverse ticagrelor`
      : "Control the site and keep the antiplatelets (already on clopidogrel); do not stop DAPT outright",
    given: words[r],
    lessonId: DISCHARGE_LESSONS.dapt,
    tipIds: [...DISCHARGE_TIPS.bleeding],
  };
}

/** The prescription as the discharge letter would carry it (drugs, doses, durations, dates). */
export function planSummary(c: DischargeCase, o: DischargePlan): string[] {
  const out: string[] = [];
  const want = planStopDates(c, o);
  const date = (k: "aspirin" | "p2y12") => o.stopDates[k] ?? "no date written";
  if (o.aspirin) out.push(`Aspirin ${MAINTENANCE_DOSE.aspirin}; ${want.aspirin?.continues ? "continues, review" : "stop"} ${date("aspirin")}`);
  if (o.p2y12) out.push(`${cap(DRUG[o.p2y12])} ${MAINTENANCE_DOSE[o.p2y12]}; ${want.p2y12?.continues ? "continues, review" : "stop"} ${date("p2y12")}`);
  if (c.oac) out.push(`${c.oac.regimen} continued${o.oacDose === "reduced" ? " at a reduced dose" : o.oacDose === "stroke-prevention" ? " at the stroke-prevention dose" : ""}`);
  if (o.ppi) out.push("Proton pump inhibitor");
  if (num(o.switchToClopidogrelDay) && o.p2y12 && o.p2y12 !== "clopidogrel") out.push(`Switch to clopidogrel on day ${o.switchToClopidogrelDay}`);
  return out;
}

/** The plan the module text gives for a case (a reference for tests and for a team-written prescription). */
export function referencePlan(c: DischargeCase, p: DischargePatient): DischargePlan {
  const hbr = arcHbr(c, p);
  const o = emptyPlan();
  o.hbr = hbr.high ? "high" : "not-high";
  o.criteria = [...hbr.major, ...hbr.minor];
  o.p2y12 = allowedP2y12(c, p, hbr.high).allowed[0];
  o.ppi = true;
  o.dyspnoeaWarned = o.p2y12 === "ticagrelor";
  if (c.oac) {
    o.aspirin = true;
    o.tripleDays = c.ischaemicRiskDominates ? DISCHARGE_RULES.tripleIschaemicMaxDays : DISCHARGE_RULES.tripleMaxDays;
    o.dualMonths = DISCHARGE_RULES.dualMonths;
    o.oacDose = "stroke-prevention";
  } else {
    o.daptMonths = daptRange(c, hbr.high).range[1];
    o.after = "aspirin";
  }
  const want = planStopDates(c, o);
  o.stopDates = { aspirin: want.aspirin?.date ?? null, p2y12: want.p2y12?.date ?? null };
  if (c.surgery) {
    const timing: SurgeryTiming = c.surgery.kind === "elective" ? "after-dapt" : c.presentation === "acs" ? "3-months" : "1-month";
    o.surgery = { timing, aspirin: "continue", p2y12StopDays: null, bridging: false };
    if (p2y12RunningAtSurgery(c, o)) o.surgery.p2y12StopDays = DISCHARGE_RULES.p2y12StopDays[o.p2y12!][0];
  }
  return o;
}

/** The chart's lines for the case: what an operator has in front of them at discharge (no classification on it). */
export function dischargeChart(c: DischargeCase, p: DischargePatient, stents: readonly ReportedStent[]): string[] {
  const out: string[] = [];
  out.push(`${p.ageY} years, ${p.sex === "M" ? "man" : "woman"}, ${p.weightKg} kg. ${c.presentationText}; procedure date ${c.pciDate}.`);
  if (stents.length) out.push(`Stents: ${stents.map((s) => `${s.vessel} ${s.diameterMm.toFixed(1)} × ${s.lengthMm} mm${s.platform ? ` ${s.platform.toLowerCase()}` : ""}`).join("; ")}.`);
  out.push(`Bloods: haemoglobin ${c.hbGdl.toFixed(1)} g/dL, platelets ${c.plateletsE9L} × 10⁹/L, eGFR ${p.egfr} mL/min/1.73 m².`);
  const hist: string[] = [];
  if (c.bleeding === "major-6m") hist.push("admitted with a spontaneous bleed needing transfusion 4 months ago");
  if (c.bleeding === "recurrent") hist.push("recurrent spontaneous bleeding needing admission");
  if (c.bleeding === "minor-12m") hist.push("admitted with a spontaneous bleed 9 months ago");
  if (c.brain === "ich") hist.push("spontaneous intracranial haemorrhage in the past");
  if (c.brain === "traumatic-ich-12m") hist.push("traumatic intracranial haemorrhage this year");
  if (c.brain === "bavm") hist.push("a brain arteriovenous malformation");
  if (c.brain === "stroke-moderate-6m") hist.push("a moderate ischaemic stroke 3 months ago");
  if (c.brain === "stroke-other") hist.push("a minor ischaemic stroke years ago");
  if (c.brain === "tia") hist.push("a transient ischaemic attack");
  if (c.cancer) hist.push(c.cancer);
  if (c.diathesis) hist.push(c.diathesis);
  if (c.recentMajorSurgery) hist.push(c.recentMajorSurgery);
  if (c.ischaemicRiskDominates) hist.push(c.ischaemicRiskDominates);
  out.push(hist.length ? `History: ${hist.join("; ")}.` : "History: no previous bleeding, stroke or cancer.");
  const meds: string[] = [];
  if (c.oac) meds.push(`${c.oac.regimen} for ${c.oac.indication}`);
  if (c.nsaidOrSteroid) meds.push(c.nsaidOrSteroid);
  if (c.cyp3a) meds.push(c.cyp3a);
  out.push(meds.length ? `Other medicines: ${meds.join("; ")}.` : "Other medicines: no anticoagulant, NSAID or steroid.");
  if (c.surgery) out.push(`Planned surgery: ${c.surgery.text}.`);
  return out;
}
