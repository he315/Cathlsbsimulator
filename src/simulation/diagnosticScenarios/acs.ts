// ---------------------------------------------------------------------------
// Acute coronary syndrome scenarios (diag-acs-scenarios): the clinical front
// end of an ACS case in the diagnostic lab. One patient each.
//
//   - the pre-brief 12-lead (src/ui/lab/EcgPrebrief.tsx): the learner names
//     the territory, the artery, its level and whether the pattern activates
//     the reperfusion pathway before the first injection, and can record the
//     right-sided (V3R, V4R) and posterior (V7-V9) leads. The ECG is drawn
//     from the patient engine's dipole (src/simulation/ecg12.ts) with the
//     injury vector of the scenario's culprit on the engine's textbook
//     coronary network (defaultFlowMap), so each pattern is the one the
//     culprit gives; ACS_CASES holds the culprit and the answer;
//   - STEMI mode: a reperfusion clock from the diagnosis and the engagement
//     order of Brilakis's recommended sequence (src/mentor/rules/diagAcs.ts);
//   - the resuscitated arrest: the arrest history, the post-resuscitation ECG,
//     the vasopressor, the triage gate scored against the 2023 ESC classes the
//     module quotes, the pads and a named defibrillator operator;
//   - a postpartum SCAD in which deep intubation or an injection into a damped
//     trace causes a proximal iatrogenic dissection;
//   - culprit studies: the report names the culprit and at least two clues
//     (src/ui/lab/StudyReport.tsx); diag-two-candidate-culprits (the lesions
//     pack) gets its 'previous study' here, rendered from the same tree with
//     the earlier lesion state (src/state/useSeriesStore.ts), and
//     diag-no-visible-culprit asks for the work-up when nothing is visible;
//   - an iatrogenic occlusion during an elective study, whose ST elevation the
//     patient engine shows and the lab raises (patientEvents), with the first
//     measures asked at the finish step.
// The MI classification of every troponin-positive case is the study report's
// (diag-study-report); 'stemi' or 'nste-acs' on the case makes it ask.
//
// Chart values, lesion values, the clock's start and the culprit positions on
// the textbook network are MODEL PARAMETERS, listed in
// docs/realism/facts/pkg-diag-acs-scenarios.md; they are scenario data, not
// sourced facts. What the checks and the answers say is taken from the lessons
// they name (module text, cited at each answer).
//
// This file is a scenario pack (src/simulation/diagnosticScenarios/index.ts):
// it imports types only, and its ACS_CASES table is plain data.
// ---------------------------------------------------------------------------

import type { DiagScenario } from "./index";

// --- what the pre-brief ECG shows and what it means -----------------------------------------------

/** The territories the learner can name from the ECG (cp-acs-thrombus-ecg's table of patterns). */
export const ECG_TERRITORIES = ["anterior", "inferior", "inferior-rv", "lateral", "posterior", "diffuse-subendocardial", "bundle-branch-or-paced", "no-st-elevation"] as const;
export type EcgTerritory = (typeof ECG_TERRITORIES)[number];
export const ECG_TERRITORY_LABEL: Record<EcgTerritory, string> = {
  anterior: "Anterior",
  inferior: "Inferior",
  "inferior-rv": "Inferior with right ventricular involvement",
  lateral: "Lateral",
  posterior: "Posterior",
  "diffuse-subendocardial": "Depression in many leads with elevation in aVR or V1",
  "bundle-branch-or-paced": "Bundle branch block or paced rhythm",
  "no-st-elevation": "No ST elevation",
};

export const ECG_ARTERIES = ["LAD", "LCx", "RCA", "LM-or-multivessel", "undetermined"] as const;
export type EcgArtery = (typeof ECG_ARTERIES)[number];
export const ECG_ARTERY_LABEL: Record<EcgArtery, string> = {
  LAD: "LAD",
  LCx: "Circumflex",
  RCA: "RCA",
  "LM-or-multivessel": "Left main or multivessel",
  undetermined: "Cannot say from the ECG",
};

export const ECG_LEVELS = ["proximal", "mid", "distal", "undetermined"] as const;
export type EcgLevel = (typeof ECG_LEVELS)[number];
export const ECG_LEVEL_LABEL: Record<EcgLevel, string> = { proximal: "Proximal", mid: "Mid", distal: "Distal", undetermined: "Cannot say" };

/** The textbook coronary network's vessels a pre-brief culprit can sit on (defaultFlowMap in patient/coronaryFlow.ts). */
export type EcgNetworkVessel = "LM" | "LAD" | "D1" | "D2" | "LCx" | "OM1" | "RCA" | "PDA" | "PLV";

export interface AcsEcg {
  /** the chart's ecgId */
  id: string;
  morph: "normal" | "lbbb" | "rbbb" | "paced";
  /** heart rate on the ECG, beats/min */
  hr: number;
  /** the culprit occlusions on the textbook network whose injury the ECG shows */
  occlusions?: { vessel: EcgNetworkVessel; param: number }[];
  /** diffuse subendocardial ischaemia (ecg12 MP_DIFFUSE_SUBENDOCARDIAL_ST) */
  diffuse?: boolean;
  /** T-wave inversion over this territory (an NSTE-ACS without ST elevation) */
  tInversion?: "lateral" | "anterior";
  /** what the ECG means: the answer the debrief compares with the learner's prediction */
  truth: {
    territory: EcgTerritory;
    /** null: the artery is not graded (the ECG cannot say) */
    artery: EcgArtery | null;
    level: EcgLevel | null;
    /** the pattern activates the reperfusion pathway in this patient */
    activate: boolean;
    /** the extra leads that show the pattern (the learner is expected to record them) */
    needsLeads?: ("right" | "posterior")[];
    /** the module text the answer rests on */
    why: string;
  };
}

/** Brilakis's STEMI engagement sequence keys on this (pm-target-culprit). */
export type StemiPresentation = "anterior" | "non-anterior";

/** The triage after a resuscitated out-of-hospital arrest (cp-complex-patients-ohca). */
export const OHCA_TRIAGE = ["immediate-angiography", "intensive-care-first"] as const;
export type OhcaTriage = (typeof OHCA_TRIAGE)[number];
export const OHCA_TRIAGE_LABEL: Record<OhcaTriage, string> = {
  "immediate-angiography": "Immediate angiography: to the lab now",
  "intensive-care-first": "Intensive care first, with angiography delayed or selective",
};

/** Who defibrillates if VF recurs on the table (Oxford's team preparation names one person). */
export const DEFIB_OPERATORS = ["cardiac-physiologist", "operator", "nurse", "anaesthetist"] as const;
export type DefibOperator = (typeof DEFIB_OPERATORS)[number];
export const DEFIB_OPERATOR_LABEL: Record<DefibOperator, string> = {
  "cardiac-physiologist": "The cardiac physiologist, on the operator's instruction",
  operator: "The operator",
  nurse: "The scrub nurse",
  anaesthetist: "The anaesthetist",
};

/** The clues to a culprit, Brilakis's list as pm-target-culprit gives it (7.2.1a, 20.7, 13.1.1). */
export const CULPRIT_CLUES = ["ecg-territory", "wall-motion", "thrombus-or-haze", "staining", "slow-flow", "no-collaterals", "distal-emboli", "previous-study"] as const;
export type CulpritClue = (typeof CULPRIT_CLUES)[number];
export const CULPRIT_CLUE_LABEL: Record<CulpritClue, string> = {
  "ecg-territory": "It supplies the ECG territory",
  "wall-motion": "It supplies the hypokinetic wall",
  "thrombus-or-haze": "Thrombus or haziness",
  staining: "Contrast staining",
  "slow-flow": "Slow antegrade flow",
  "no-collaterals": "Poor or absent collaterals",
  "distal-emboli": "Occluded distal branches",
  "previous-study": "The previous study: the lesion is new",
};

/** The culprit as the report names it. */
export const CULPRIT_VESSELS = ["LM", "LAD", "LCx", "RCA", "none-visible"] as const;
export type CulpritVessel = (typeof CULPRIT_VESSELS)[number];

/** The work-up when no culprit is visible, in the order pm-target-culprit gives it (Brilakis 7.2.10-7.2.12 and 20.7). */
export const NO_CULPRIT_STEPS = ["review-runs", "ventriculogram-or-echo", "oct", "cardiac-mri"] as const;
export type NoCulpritStep = (typeof NO_CULPRIT_STEPS)[number];
export const NO_CULPRIT_STEP_LABEL: Record<NoCulpritStep, string> = {
  "review-runs": "Review every run again, and any earlier angiogram",
  "ventriculogram-or-echo": "Left ventriculogram or echo in the lab",
  oct: "Intravascular imaging, OCT preferred",
  "cardiac-mri": "Cardiac MR later",
};

/** The first measures for new ST elevation from an iatrogenic occlusion (cm-principles-closure-pmi). */
export const IATROGENIC_ACTIONS = ["immediate-pci", "transfer", "thrombolysis", "oxygen", "routine-balloon-pump", "inotropes", "no-change-seen"] as const;
export type IatrogenicAction = (typeof IATROGENIC_ACTIONS)[number];
export const IATROGENIC_ACTION_LABEL: Record<IatrogenicAction, string> = {
  "immediate-pci": "Hand over for immediate PCI",
  transfer: "Transfer to a centre with PCI",
  thrombolysis: "Give thrombolysis",
  oxygen: "Give oxygen",
  "routine-balloon-pump": "Insert a balloon pump routinely",
  inotropes: "Start inotropes",
  "no-change-seen": "The ECG did not change during the study",
};

/** The earlier study of the same patient, rendered from the same tree with the lesions it then had. */
export interface PreviousStudySpec {
  /** how the reference monitor and the report name it */
  label: string;
  /** the lesions at the time of the previous study (the tree is the case's own) */
  lesions: DiagScenario["lesions"];
  /** the runs filmed (the side and a view by name of the lab's presets) */
  runs: { side: "left" | "right"; cArm: { laoRao: number; cranialCaudal: number } }[];
}

export interface AcsCase {
  ecg?: AcsEcg;
  /** STEMI mode: the engagement order and the reperfusion clock */
  stemi?: {
    presentation: StemiPresentation;
    /** minutes from the STEMI diagnosis to the patient's arrival on the table (MODEL PARAMETER) */
    diagnosisMinutesAgo: number;
  };
  /** the resuscitated arrest's triage gate */
  triage?: { expected: OhcaTriage; persistentStElevation: boolean; stable: boolean };
  /** a culprit study: the report names the culprit and at least two clues */
  culprit?: { vessel: CulpritVessel; clues: CulpritClue[]; decisive?: CulpritClue; workUp?: NoCulpritStep[] };
  previousStudy?: PreviousStudySpec;
  /** an iatrogenic occlusion: the measures asked at the finish */
  iatrogenic?: { saturationPct: number; air: boolean; onsitePci: boolean; shock: boolean };
}

// --- the ECG answers (module text) ---------------------------------------------------------------

const WHY_ANTERIOR = "cp-acs-thrombus-ecg, 'Which artery supplies which wall' (Oxford): anterior ST elevation points to the LAD; septal involvement points to the LAD proximal to its septal branches.";
const WHY_RV = "cp-acs-thrombus-ecg: ST elevation in II, III and aVF with elevation in V4R places the occlusion in the RCA upstream of its RV branches (Oxford's anatomy; the module's check on V4R).";
const WHY_POSTERIOR = "cp-acs-thrombus-ecg, 2023 ESC supplementary data Figure S2: ST depression in V1-V3 with ST elevation of at least 0.5 mm in V7-V9 is a posterior STEMI and goes down the reperfusion pathway; the posterior wall is the circumflex's (Oxford).";
const WHY_LBBB = "cp-acs-thrombus-ecg, 2023 ESC supplementary data Figure S2: with LBBB or a paced rhythm and a high clinical suspicion of ongoing ischaemia, manage as STEMI; the block's newness is not the test, and the ECG cannot name the artery.";
const WHY_NO_ST = "cp-complex-patients-ohca: without ST elevation after a resuscitated arrest the ECG does not activate the primary PCI pathway.";

export const ACS_CASES: Record<string, AcsCase> = {
  "diag-stemi-anterior": {
    ecg: { id: "ecg-stemi-anterior", morph: "normal", hr: 92, occlusions: [{ vessel: "LAD", param: 0.05 }], truth: { territory: "anterior", artery: "LAD", level: "proximal", activate: true, why: WHY_ANTERIOR } },
    stemi: { presentation: "anterior", diagnosisMinutesAgo: 45 },
  },
  "diag-stemi-inferior-rv": {
    ecg: { id: "ecg-stemi-inferior-rv", morph: "normal", hr: 58, occlusions: [{ vessel: "RCA", param: 0.05 }], truth: { territory: "inferior-rv", artery: "RCA", level: "proximal", activate: true, needsLeads: ["right"], why: WHY_RV } },
    stemi: { presentation: "non-anterior", diagnosisMinutesAgo: 50 },
  },
  "diag-stemi-posterior": {
    ecg: { id: "ecg-stemi-posterior", morph: "normal", hr: 84, occlusions: [{ vessel: "LCx", param: 0.38 }], truth: { territory: "posterior", artery: "LCx", level: "mid", activate: true, needsLeads: ["posterior"], why: WHY_POSTERIOR } },
    stemi: { presentation: "non-anterior", diagnosisMinutesAgo: 60 },
  },
  "diag-lbbb-paced": {
    ecg: { id: "ecg-lbbb-ongoing-pain", morph: "lbbb", hr: 96, truth: { territory: "bundle-branch-or-paced", artery: null, level: null, activate: true, why: WHY_LBBB } },
    // the ECG cannot localise: Brilakis's non-anterior sequence (image the left first)
    stemi: { presentation: "non-anterior", diagnosisMinutesAgo: 40 },
  },
  "diag-ohca-st-elevation": {
    ecg: { id: "ecg-ohca-inferior", morph: "normal", hr: 104, occlusions: [{ vessel: "RCA", param: 0.5 }], truth: { territory: "inferior", artery: "RCA", level: "mid", activate: true, why: "cp-complex-patients-ohca: persistent ST elevation after resuscitation goes to primary PCI whether or not the patient responds; inferior elevation without V4R elevation is the RCA beyond its RV branches (cp-acs-thrombus-ecg)." } },
    stemi: { presentation: "non-anterior", diagnosisMinutesAgo: 35 },
    triage: { expected: "immediate-angiography", persistentStElevation: true, stable: false },
  },
  "diag-ohca-no-st": {
    ecg: { id: "ecg-ohca-no-st", morph: "normal", hr: 88, truth: { territory: "no-st-elevation", artery: "undetermined", level: null, activate: false, why: WHY_NO_ST } },
    triage: { expected: "intensive-care-first", persistentStElevation: false, stable: true },
  },
  // the core pack's resuscitated arrest (src/simulation/diagnosticScenarios/core.ts) gets the ECG and the gate
  "diag-ohca-post-rosc": {
    ecg: { id: "ecg-ohca-anterior", morph: "normal", hr: 108, occlusions: [{ vessel: "LAD", param: 0.2 }], truth: { territory: "anterior", artery: "LAD", level: "proximal", activate: true, why: "cp-complex-patients-ohca: persistent ST elevation after resuscitation means primary PCI (2023 ESC class I, level B); anterior elevation points to the LAD (cp-acs-thrombus-ecg)." } },
    stemi: { presentation: "anterior", diagnosisMinutesAgo: 30 },
    triage: { expected: "immediate-angiography", persistentStElevation: true, stable: false },
  },
  "diag-scad-postpartum": {
    ecg: { id: "ecg-scad-anterior", morph: "normal", hr: 90, occlusions: [{ vessel: "LAD", param: 0.4 }], truth: { territory: "anterior", artery: "LAD", level: null, activate: true, why: "cp-acs-thrombus-ecg: anterior ST elevation points to the LAD; the module does not grade the level from this ECG. pm-target-culprit (Brilakis 20.1): a postpartum STEMI may be SCAD." } },
    stemi: { presentation: "anterior", diagnosisMinutesAgo: 55 },
  },
  // the lesions pack's culprit study (src/simulation/diagnosticScenarios/lesions.ts): the old report's angiogram
  "diag-two-candidate-culprits": {
    culprit: { vessel: "LCx", clues: ["wall-motion", "thrombus-or-haze", "no-collaterals", "previous-study"], decisive: "previous-study" },
    previousStudy: {
      label: "Previous study, four years ago",
      lesions: [
        {
          vessel: "RCA",
          position: 0.35,
          severity: 100,
          kind: "cto",
          morphology: "cto",
          role: "non-culprit",
          cto: { stump: "blunt", lengthMm: 20, collaterals: [{ donor: "LAD", recipient: "PDA", type: "septal", wernerCC: 2, rentrop: 3, tortuosity: 0 }] },
        },
      ],
      runs: [
        { side: "left", cArm: { laoRao: 30, cranialCaudal: -25 } },
        { side: "left", cArm: { laoRao: -30, cranialCaudal: -25 } },
        { side: "right", cArm: { laoRao: 30, cranialCaudal: 0 } },
      ],
    },
  },
  "diag-no-visible-culprit": {
    ecg: { id: "ecg-nste-lateral-t", morph: "normal", hr: 76, tInversion: "lateral", truth: { territory: "no-st-elevation", artery: "undetermined", level: null, activate: false, why: "cp-acs-thrombus-ecg: T-wave inversion without ST elevation does not meet the reperfusion criteria; pm-target-culprit: ST depression or T inversion does not localise the culprit." } },
    culprit: { vessel: "none-visible", clues: [], workUp: ["review-runs", "ventriculogram-or-echo", "oct", "cardiac-mri"] },
  },
  "diag-iatrogenic-occlusion": {
    iatrogenic: { saturationPct: 97, air: false, onsitePci: true, shock: false },
  },
};

/** The ACS front end of a scenario (undefined: the scenario has none). */
export function acsCaseFor(scenarioId: string | undefined | null): AcsCase | undefined {
  return scenarioId ? ACS_CASES[scenarioId] : undefined;
}

// --- the scenarios ---------------------------------------------------------------------------------

const STEMI_LESSONS = ["cp-acs-thrombus-ecg", "pm-target-culprit"];

export const scenarios: DiagScenario[] = [
  // cp-acs-thrombus#0, pm-target#6: an anterior STEMI; guide into the left main first.
  {
    id: "diag-stemi-anterior",
    title: "STEMI call: predict the artery, then engage",
    caseName: "Central chest pain for an hour",
    indication: "STEMI",
    brief:
      "A 61-year-old man has had central chest pain for an hour. The STEMI call came from the emergency department 45 minutes ago and he has had aspirin and heparin. His 12-lead ECG is on the chart: before the first injection, say which territory, which artery and which level you expect, and whether this activates the reperfusion pathway.",
    lessonIds: STEMI_LESSONS,
    module: { id: "cp-acs-thrombus", title: "Acute coronary syndromes and thrombus" },
    spec: { focus: "both", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "thrombotic", variantCount: [0, 0], nameHint: "Central chest pain for an hour" },
    lesions: [{ vessel: "LAD", position: 0.1, severity: 100, kind: "thrombotic", morphology: "thrombus", thrombusGrade: 5, role: "target" }],
    events: ["stemi"],
    chart: {
      ageY: 61,
      sex: "M",
      heightCm: 178,
      weightKg: 86,
      egfr: 78,
      echo: { note: "Bedside echo in the emergency department: LV function reduced, no pericardial effusion." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 1 }, { name: "Unfractionated heparin", route: "IV", lastDoseHoursAgo: 0.5 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      ecgId: "ecg-stemi-anterior",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    // the presenting ECG is history: its ST elevation is in the tip context from the first frame
    script: [{ id: "presenting-ecg", when: { afterS: 0 }, do: [{ kind: "raise", event: "st-elevation", hold: "case" }] }],
    checks: [
      { id: "predict", text: "Territory, artery and level named from the ECG before the first injection: anterior, the proximal LAD.", lessonId: "cp-acs-thrombus-ecg" },
      { id: "order", text: "Anterior STEMI: the left main engaged first (with the guide), the RCA imaged afterwards (Brilakis's sequence).", lessonId: "pm-target-culprit" },
      { id: "clock", text: "Reperfusion inside 120 minutes of the diagnosis (Oxford).", lessonId: "cp-acs-thrombus-ecg" },
    ],
  },

  // cp-acs-thrombus#0, pm-target#6: an inferior STEMI with right ventricular involvement; image the left first.
  {
    id: "diag-stemi-inferior-rv",
    title: "Chest pain and a slow pulse: predict, then image",
    caseName: "Chest pain and a slow pulse",
    indication: "STEMI",
    brief:
      "A 67-year-old woman has had chest pain and nausea for two hours and a pulse in the fifties. The STEMI call came 50 minutes ago; she has had aspirin and heparin. Her 12-lead ECG is on the chart, and you can record more leads before you start. Say what you expect to find before the first injection.",
    lessonIds: STEMI_LESSONS,
    module: { id: "cp-acs-thrombus", title: "Acute coronary syndromes and thrombus" },
    spec: { focus: "both", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "thrombotic", variantCount: [0, 0], nameHint: "Chest pain and a slow pulse" },
    lesions: [{ vessel: "RCA", position: 0.08, severity: 100, kind: "thrombotic", morphology: "thrombus", thrombusGrade: 5, role: "target" }],
    events: ["stemi"],
    chart: {
      ageY: 67,
      sex: "F",
      heightCm: 162,
      weightKg: 70,
      egfr: 66,
      echo: { note: "Bedside echo: LV function reduced, no pericardial effusion." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 1 }, { name: "Unfractionated heparin", route: "IV", lastDoseHoursAgo: 0.5 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      ecgId: "ecg-stemi-inferior-rv",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    script: [{ id: "presenting-ecg", when: { afterS: 0 }, do: [{ kind: "raise", event: "st-elevation", hold: "case" }] }],
    checks: [
      { id: "predict", text: "Inferior elevation with V4R elevation named as the RCA upstream of its RV branches.", lessonId: "cp-acs-thrombus-ecg" },
      { id: "order", text: "Non-anterior STEMI: the left coronary imaged with a diagnostic catheter before any guide goes into the RCA.", lessonId: "pm-target-culprit" },
      { id: "no-nitrate", text: "No nitrate with right ventricular involvement and hypotension.", lessonId: "cp-acs-thrombus-ecg" },
    ],
  },

  // cp-acs-thrombus#0: a posterior STEMI seen as V1-V3 depression until V7-V9 are recorded.
  {
    id: "diag-stemi-posterior",
    title: "Crushing chest pain: which leads?",
    caseName: "Crushing chest pain, abnormal ECG",
    indication: "STEMI",
    brief:
      "A 58-year-old man has had 40 minutes of crushing central pain. The emergency team called the lab an hour ago about his ECG, which is on the chart. Record any further leads you need, then say whether this goes down the reperfusion pathway and what you expect to find.",
    lessonIds: STEMI_LESSONS,
    module: { id: "cp-acs-thrombus", title: "Acute coronary syndromes and thrombus" },
    spec: { focus: "both", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "thrombotic", variantCount: [0, 0], nameHint: "Crushing chest pain, abnormal ECG" },
    lesions: [{ vessel: "LCx", position: 0.45, severity: 100, kind: "thrombotic", morphology: "thrombus", thrombusGrade: 5, role: "target" }],
    events: ["stemi"],
    chart: {
      ageY: 58,
      sex: "M",
      heightCm: 175,
      weightKg: 83,
      egfr: 85,
      echo: { note: "Bedside echo: LV function reduced, no pericardial effusion." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 1 }, { name: "Unfractionated heparin", route: "IV", lastDoseHoursAgo: 0.5 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      ecgId: "ecg-stemi-posterior",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    script: [{ id: "presenting-ecg", when: { afterS: 0 }, do: [{ kind: "raise", event: "st-elevation", hold: "case" }] }],
    checks: [
      { id: "leads", text: "V7-V9 recorded for V1-V3 depression, and the posterior STEMI (at least 0.5 mm in V7-V9) sent down the reperfusion pathway.", lessonId: "cp-acs-thrombus-ecg" },
      { id: "order", text: "Non-anterior STEMI: the left coronary imaged first; the culprit is there, so the left main is engaged with the guide before the RCA is imaged.", lessonId: "pm-target-culprit" },
    ],
  },

  // cp-acs-thrombus#0: LBBB with ongoing pain.
  {
    id: "diag-lbbb-paced",
    title: "Ongoing pain and a wide QRS: activate or not?",
    caseName: "Ongoing chest pain, wide QRS",
    indication: "STEMI",
    brief:
      "A 72-year-old man has had an hour of ongoing central chest pain with sweating, and his blood pressure is 100/60. His ECG, on the chart, has a wide QRS; there is no previous ECG to compare. Decide whether this activates the reperfusion pathway and what you can and cannot say about the artery.",
    lessonIds: ["cp-acs-thrombus-ecg"],
    module: { id: "cp-acs-thrombus", title: "Acute coronary syndromes and thrombus" },
    spec: { focus: "both", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "thrombotic", variantCount: [0, 0], nameHint: "Ongoing chest pain, wide QRS" },
    lesions: [{ vessel: "LAD", position: 0.3, severity: 100, kind: "thrombotic", morphology: "thrombus", thrombusGrade: 4, role: "target" }],
    events: ["stemi"],
    chart: {
      ageY: 72,
      sex: "M",
      heightCm: 172,
      weightKg: 79,
      egfr: 58,
      echo: { note: "Bedside echo: LV function moderately reduced, no pericardial effusion." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 1 }, { name: "Unfractionated heparin", route: "IV", lastDoseHoursAgo: 0.5 }, { name: "Ramipril", route: "oral", lastDoseHoursAgo: 14 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      ecgId: "ecg-lbbb-ongoing-pain",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    script: [{ id: "managed-as-stemi", when: { afterS: 0 }, do: [{ kind: "raise", event: "chest-pain", hold: "case" }] }],
    checks: [
      { id: "activate", text: "LBBB with a high clinical suspicion of ongoing ischaemia managed as STEMI; the block's newness is not the test.", lessonId: "cp-acs-thrombus-ecg" },
      { id: "artery", text: "No artery or level claimed from an ECG with a bundle branch block: the angiogram finds the culprit.", lessonId: "cp-acs-thrombus-ecg" },
    ],
  },

  // cp-complex-patients#4: a resuscitated arrest with persistent ST elevation: to the lab now.
  {
    id: "diag-ohca-st-elevation",
    title: "Resuscitated collapse at a station: where next?",
    caseName: "Resuscitated collapse at a station",
    indication: "STEMI",
    brief:
      "A 63-year-old man collapsed at a railway station. Bystanders started CPR and a public defibrillator shocked him once. He arrives intubated on a noradrenaline infusion, with a post-resuscitation ECG on the chart. Decide where he goes next, then plan the case.",
    lessonIds: ["cp-complex-patients-ohca"],
    module: { id: "cp-complex-patients", title: "Cardiogenic shock, cardiac arrest and TAVI patients" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "thrombotic", variantCount: [0, 0], nameHint: "Resuscitated collapse at a station" },
    lesions: [{ vessel: "RCA", position: 0.5, severity: 100, kind: "thrombotic", morphology: "thrombus", thrombusGrade: 5, role: "target" }],
    events: ["post-arrest", "stemi", "vasopressor", "ventilated"],
    chart: {
      ageY: 63,
      sex: "M",
      heightCm: 180,
      weightKg: 92,
      egfr: 64,
      echo: { note: "Bedside echo: LV function reduced, no pericardial effusion." },
      drugs: [{ name: "Noradrenaline infusion", route: "IV" }, { name: "Propofol infusion", route: "IV" }, { name: "Aspirin", route: "IV" }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      arrestHistory: { rhythm: "vf", witnessed: true, minutesToRosc: 12, note: "Bystander CPR. One shock from a public defibrillator. Post-resuscitation ECG on the chart; the repeat ECG on arrival shows the same." },
      ecgId: "ecg-ohca-inferior",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    script: [{ id: "post-rosc-ecg", when: { afterS: 0 }, do: [{ kind: "raise", event: "st-elevation", hold: "case" }] }],
    checks: [
      { id: "triage", text: "Persistent ST elevation after resuscitation: primary PCI, whether or not the patient responds (2023 ESC class I).", lessonId: "cp-complex-patients-ohca" },
      { id: "team", text: "Pads on and the person who defibrillates named before the first injection.", lessonId: "cp-complex-patients-ohca" },
      { id: "access", text: "Femoral access for a patient on a vasopressor who may need support; no time lost to radial spasm.", lessonId: "cp-complex-patients-ohca" },
    ],
  },

  // cp-complex-patients#4: a resuscitated arrest, stable, without ST elevation: intensive care first.
  {
    id: "diag-ohca-no-st",
    title: "Resuscitated collapse at home: where next?",
    caseName: "Resuscitated collapse at home",
    indication: "NSTEMI",
    brief:
      "A 59-year-old woman collapsed at home after a day of chest discomfort. Her husband started CPR and the ambulance crew restored a circulation after two shocks. She is intubated, her blood pressure is stable without any infusion, her troponin is raised, and the post-resuscitation and repeat ECGs are on the chart. Decide whether she comes to the lab now. If you send her to intensive care first, the study that follows is her delayed angiogram.",
    lessonIds: ["cp-complex-patients-ohca"],
    module: { id: "cp-complex-patients", title: "Cardiogenic shock, cardiac arrest and TAVI patients" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "severe-stenosis", variantCount: [0, 0], nameHint: "Resuscitated collapse at home" },
    lesions: [{ vessel: "LCx", position: 0.35, severity: 80, kind: "severe-stenosis", role: "target" }],
    events: ["post-arrest", "nste-acs", "ventilated"],
    chart: {
      ageY: 59,
      sex: "F",
      heightCm: 164,
      weightKg: 68,
      egfr: 81,
      echo: { lvef: 50, note: "Bedside echo: mild global hypokinesia, no regional abnormality, no effusion." },
      drugs: [{ name: "Propofol infusion", route: "IV" }, { name: "Aspirin", route: "IV" }],
      allergies: { contrast: "none" },
      pregnancy: "test-negative",
      arrestHistory: { rhythm: "vf", witnessed: true, minutesToRosc: 9, note: "Bystander CPR. Two shocks from the ambulance crew. No ST elevation on the post-resuscitation ECG or on the repeat ECG 20 minutes later." },
      ecgId: "ecg-ohca-no-st",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    checks: [
      { id: "triage", text: "Stable without ST elevation after resuscitation: routine immediate angiography is not recommended (2023 ESC class III, after COACT and TOMAHAWK); intensive care first.", lessonId: "cp-complex-patients-ohca" },
      { id: "repeat-ecg", text: "The ECG repeated before the decision.", lessonId: "cp-complex-patients-ohca" },
    ],
  },

  // cp-other-complex#1: a postpartum STEMI from SCAD; deep intubation dissects the left main.
  {
    id: "diag-scad-postpartum",
    title: "Postpartum STEMI: engage gently, inject softly",
    caseName: "Chest pain six weeks after delivery",
    indication: "STEMI",
    brief:
      "A 36-year-old woman delivered her second child six weeks ago and is breastfeeding. She has had central chest pain for an hour and a half, and the STEMI call came from the emergency department. Her ECG is on the chart. Plan your access, your catheter and your injections before you start.",
    lessonIds: ["cp-other-complex-scad", "cp-acs-thrombus-ecg"],
    module: { id: "cp-other-complex", title: "SCAD, stent failure, vessel size and long lesions" },
    spec: { focus: "left", access: "femoral", rootSize: "normal", dominance: "right", pathology: "severe-stenosis", variantCount: [0, 0], nameHint: "Chest pain six weeks after delivery" },
    // no scadType: each seed draws one of types 1, 2A, 2B and 3 (caseGenerator scenarioCase)
    lesions: [{ vessel: "LAD", position: 0.5, severity: 90, kind: "severe-stenosis", morphology: "scad", role: "target" }],
    events: ["stemi"],
    chart: {
      ageY: 36,
      sex: "F",
      heightCm: 166,
      weightKg: 66,
      egfr: 112,
      echo: { lvef: 48, note: "Bedside echo: LV function mildly reduced, no pericardial effusion." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 1 }, { name: "Unfractionated heparin", route: "IV", lastDoseHoursAgo: 0.5 }],
      allergies: { contrast: "none" },
      pregnancy: "test-negative",
      ecgId: "ecg-scad-anterior",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    script: [
      { id: "history", when: { afterS: 0 }, do: [{ kind: "raise", event: "scad-suspected", hold: "case" }, { kind: "raise", event: "st-elevation", hold: "case" }] },
      // deep intubation of the left main tears the wall: a proximal iatrogenic dissection that limits flow
      // (the engine's flow loss is a MODEL PARAMETER), held for the case
      {
        id: "deep-intubation-dissection",
        when: { engagement: ["deep-lm"] },
        do: [
          { kind: "raise", event: "dissection", hold: "case" },
          { kind: "engine", occlusion: { id: "iatrogenic-dissection", vessel: "LAD", param: 0.04, fraction: 0.7 } },
        ],
      },
      // An injection into a damped trace would do the same, but the script has no condition that holds
      // only at the moment of an injection given into a damped trace (firstInjection stays true for the
      // case), so that trigger waits for one; the 'gentle' check grades it at the debrief.
    ],
    checks: [
      { id: "access", text: "Femoral access, or radial chosen deliberately with extra care (Brilakis; the AHA statement).", lessonId: "cp-other-complex-scad" },
      { id: "gentle", text: "Coaxial engagement without deep intubation, no injection into a damped trace, and gentle injections after intracoronary nitrate.", lessonId: "cp-other-complex-scad" },
      { id: "type", text: "The SCAD type named from orthogonal views, and the management chosen by Brilakis's rules (stability, left main or proximal two-vessel involvement, ongoing ischaemia).", lessonId: "cp-other-complex-scad" },
      { id: "drugs", text: "For conservative management: heparin stopped if nothing else needs it, single or dual antiplatelet therapy agreed for her, and clopidogrel generally avoided while she is breastfeeding.", lessonId: "cp-other-complex-scad" },
    ],
  },

  // pm-target#5: an ACS with no visible culprit; the work-up.
  {
    id: "diag-no-visible-culprit",
    title: "An ACS with no visible culprit: the next steps",
    caseName: "Chest pain with a raised troponin",
    indication: "NSTEMI",
    brief:
      "A 57-year-old woman had an hour of central chest pain at rest last night. Her troponin is raised and rising, and her ECG is on the chart. She is having angiography from the right radial artery. At the end, name the culprit and the clues, or say what you would do next if you cannot see one.",
    lessonIds: ["pm-target-culprit"],
    module: { id: "pm-target", title: "Choosing what to treat, and when" },
    spec: { focus: "both", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", variantCount: [0, 0], nameHint: "Chest pain with a raised troponin" },
    lesions: [
      { vessel: "LCx", position: 0.4, severity: 30, kind: "mild-irregularity", role: "bystander" },
      { vessel: "RCA", position: 0.5, severity: 25, kind: "mild-irregularity", role: "bystander" },
    ],
    events: ["nste-acs"],
    chart: {
      ageY: 57,
      sex: "F",
      heightCm: 160,
      weightKg: 64,
      egfr: 88,
      echo: { lvef: 55, note: "Bedside echo: possible mild lateral hypokinesia; views limited." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 10 },
        { name: "Ticagrelor", route: "oral", lastDoseHoursAgo: 10 },
        { name: "Fondaparinux", route: "SC", lastDoseHoursAgo: 9 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "test-negative",
      ecgId: "ecg-nste-lateral-t",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    script: [{ id: "presenting-pain", when: { afterS: 0 }, do: [{ kind: "raise", event: "chest-pain", hold: "case" }] }],
    checks: [
      { id: "no-culprit", text: "No lesion called the culprit without the features of one.", lessonId: "pm-target-culprit" },
      { id: "work-up", text: "The work-up in order: every run reviewed again, a ventriculogram or echo, OCT, then cardiac MR.", lessonId: "pm-target-culprit" },
    ],
  },

  // cm-principles-closure#9: new ST elevation during an elective study from an embolus; first measures and immediate PCI.
  {
    id: "diag-iatrogenic-occlusion",
    title: "New ST elevation during the study",
    caseName: "Exertional angina, planned angiography",
    indication: "SA",
    brief:
      "A 64-year-old man with exertional angina and a positive exercise test is having planned diagnostic angiography from the right femoral artery. He has consented to ad hoc PCI if it is appropriate. Watch the patient as well as the image throughout.",
    lessonIds: ["cm-principles-closure-pmi"],
    module: { id: "cm-principles-closure", title: "Principles, acute closure and dissection" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Exertional angina, planned angiography" },
    lesions: [{ vessel: "LAD", position: 0.35, severity: 60, kind: "moderate-stenosis", role: "target" }],
    events: [],
    chart: {
      ageY: 64,
      sex: "M",
      heightCm: 176,
      weightKg: 85,
      egfr: 79,
      echo: { lvef: 58, note: "Normal LV size and function." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }, { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 }, { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    script: [
      // an embolus from the catheter on the first right coronary run occludes the distal RCA (MODEL PARAMETER):
      // the engine's ST rises, and the lab raises st-elevation, chest pain and bradycardia from the patient
      { id: "embolus", when: { firstInjection: "right", engagement: ["selective-rca", "deep-rca"] }, do: [{ kind: "engine", occlusion: { id: "embolus", vessel: "RCA", param: 0.7, fraction: 1 } }] },
    ],
    checks: [
      { id: "recognise", text: "The new ST elevation recognised, and the angiogram looked at before any drug.", lessonId: "cm-principles-closure-pmi" },
      { id: "measures", text: "Immediate revascularisation (or transfer without on-site PCI); no thrombolysis; oxygen only below 90% saturation, or 100% for air.", lessonId: "cm-principles-closure-pmi" },
    ],
  },
];
