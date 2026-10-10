// ---------------------------------------------------------------------------
// Stable multi-vessel scenarios with a revascularisation decision
// (angio-decision-drills; lab request pm-target#1).
//
// Each case is a stable patient having elective diagnostic angiography. The
// study ends with the study report (diag-study-report), and then the
// decision step (src/ui/sim/modules/revascDecision.ts) works through
// Brilakis's stable algorithm with the chart beside it: symptoms, extent,
// previous CABG, diabetes, surgical candidacy, complexity, benefit against
// risk and the patient's preference, ending in no revascularisation, PCI,
// CABG or the heart team (src/content/decisions/revascStable.ts).
//
//   - diag-mvd-diabetes-fit: three-vessel disease, diabetes, a good surgical
//     candidate: CABG.
//   - diag-mvd-two-vessel-heart-team: two-vessel, less complex disease
//     without diabetes in a good surgical candidate: PCI and CABG both stay
//     reasonable, so the heart team.
//   - diag-mvd-diabetes-frail: three-vessel disease and diabetes in a frail
//     patient at high surgical risk with limiting angina: PCI.
//   - diag-svd-asymptomatic-small-territory: the contrast case, a single
//     mid-RCA stenosis without symptoms and with a small ischaemic territory:
//     no revascularisation (the lesson's own check question).
//
// The patient chart (CaseChart) carries what the lab already shows; the
// decision's further facts (symptoms, diabetes, previous CABG, surgical risk
// band, ischaemic burden, the patient's view) are in `vignettes`, keyed by
// scenario id, which the decision step reads. The registry reads only
// `scenarios`. Chart, vignette and lesion values are MODEL PARAMETERS
// (scenario data), listed in docs/realism/facts/pkg-angio-decision-drills.md;
// the rules the checks state are quoted from the lessons they name.
//
// title names the scenario where the lessons and the case library list it;
// caseName is the case's name in the lab and states the presentation only.
// ---------------------------------------------------------------------------

import type { DiagScenario } from "./index";
import type { StableVignette } from "../../content/decisions/revascStable";

const MODULE = { id: "pm-target", title: "Choosing what to treat, and when" };
const WHY = "pm-target-ccs-why";
const TEAM = "pm-target-heart-team";

export const scenarios: DiagScenario[] = [
  // pm-target#1: diabetes with multivessel disease in a good surgical candidate.
  {
    id: "diag-mvd-diabetes-fit",
    title: "Three vessels and diabetes: decide the revascularisation",
    caseName: "Exertional angina, abnormal perfusion scan",
    indication: "SA",
    brief:
      "A 63-year-old man with type 2 diabetes has angina on climbing one flight of stairs despite two anti-anginal drugs, and a perfusion scan shows a large area of inducible ischaemia. He is having elective diagnostic angiography from the right radial artery. After the study report, decide what revascularisation, if any, you would recommend.",
    lessonIds: [TEAM, WHY],
    module: MODULE,
    spec: { focus: "both", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "severe-stenosis", variantCount: [0, 0], nameHint: "Exertional angina, abnormal perfusion scan" },
    lesions: [
      { vessel: "LAD", position: 0.18, severity: 85, kind: "severe-stenosis", role: "target" },
      { vessel: "LCx", position: 0.25, severity: 80, kind: "severe-stenosis", role: "target" },
      { vessel: "RCA", position: 0.45, severity: 85, kind: "severe-stenosis", role: "target" },
    ],
    events: [],
    chart: {
      ageY: 63,
      sex: "M",
      heightCm: 175,
      weightKg: 88,
      egfr: 78,
      echo: { lvef: 50, note: "Mild inferior hypokinesia; LV size normal." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Isosorbide mononitrate", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Metformin", route: "oral", lastDoseHoursAgo: 14, held: true },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    planted: [],
    startAt: "root",
    checks: [
      { id: "extent", text: "Three-vessel disease reported, with the proximal LAD lesion named.", lessonId: WHY },
      { id: "no-adhoc", text: "No ad hoc PCI: multivessel disease in a stable patient is not treated on the table; refer for CABG.", lessonId: TEAM },
      { id: "cabg", text: "CABG recommended: diabetes with multivessel disease in a good surgical candidate, whatever the SYNTAX score.", lessonId: TEAM },
    ],
  },

  // pm-target#1: less complex two-vessel disease without diabetes, good surgical candidate: both options stay.
  {
    id: "diag-mvd-two-vessel-heart-team",
    title: "Two vessels, no diabetes: PCI or CABG?",
    caseName: "Exertional angina, positive exercise test",
    indication: "SA",
    brief:
      "A 57-year-old woman has angina on brisk walking despite a beta-blocker and a long-acting nitrate, and a strongly positive exercise test. She is fit and has no diabetes. She is having elective diagnostic angiography from the right radial artery. After the study report, decide what revascularisation, if any, you would recommend.",
    lessonIds: [TEAM, WHY],
    module: MODULE,
    spec: { focus: "both", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "severe-stenosis", variantCount: [0, 0], nameHint: "Exertional angina, positive exercise test" },
    lesions: [
      { vessel: "LAD", position: 0.45, severity: 80, kind: "severe-stenosis", lengthMm: 12, role: "target" },
      { vessel: "RCA", position: 0.45, severity: 80, kind: "severe-stenosis", lengthMm: 10, role: "target" },
    ],
    events: [],
    chart: {
      ageY: 57,
      sex: "F",
      heightCm: 164,
      weightKg: 70,
      egfr: 88,
      echo: { lvef: 60, note: "Normal LV size and function at rest." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Isosorbide mononitrate", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    planted: [],
    startAt: "root",
    checks: [
      { id: "extent", text: "Two-vessel disease reported: a focal mid-LAD lesion and a focal mid-RCA lesion, the left main free of disease.", lessonId: WHY },
      { id: "heart-team", text: "Heart-team referral: Brilakis's SYNTAX table gives two-vessel disease no threshold, so without diabetes PCI and CABG both remain reasonable and the case goes to the heart team.", lessonId: TEAM },
      { id: "no-adhoc", text: "No ad hoc PCI: multivessel disease is on Brilakis's list of reasons to defer ad hoc PCI.", lessonId: TEAM },
    ],
  },

  // pm-target#1: diabetes and three-vessel disease in a poor surgical candidate with limiting symptoms.
  {
    id: "diag-mvd-diabetes-frail",
    title: "Three vessels, diabetes and a high surgical risk",
    caseName: "Angina on minimal exertion",
    indication: "SA",
    brief:
      "An 84-year-old man with type 2 diabetes, chronic lung disease and frailty has angina on dressing despite three anti-anginal drugs. The surgeons have reviewed him and judge his operative risk high. He is having elective diagnostic angiography from the right radial artery. After the study report, decide what revascularisation, if any, you would recommend.",
    lessonIds: [TEAM, WHY],
    module: MODULE,
    spec: { focus: "both", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "severe-stenosis", variantCount: [0, 0], nameHint: "Angina on minimal exertion" },
    lesions: [
      { vessel: "LAD", position: 0.4, severity: 90, kind: "severe-stenosis", role: "target" },
      { vessel: "LCx", position: 0.5, severity: 75, kind: "severe-stenosis", role: "target" },
      { vessel: "RCA", position: 0.35, severity: 80, kind: "severe-stenosis", role: "target" },
    ],
    events: [],
    chart: {
      ageY: 84,
      sex: "M",
      heightCm: 170,
      weightKg: 64,
      egfr: 52,
      echo: { lvef: 45, note: "Mild global LV impairment." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Amlodipine", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Isosorbide mononitrate", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Metformin", route: "oral", lastDoseHoursAgo: 14, held: true },
        { name: "Tiotropium", route: "inhaled", lastDoseHoursAgo: 4 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    planted: [],
    startAt: "root",
    checks: [
      { id: "candidate", text: "Surgical candidacy weighed before modality: diabetes with multivessel disease leads to CABG only in a good surgical candidate.", lessonId: TEAM },
      { id: "pci", text: "PCI recommended once its benefit is weighed against its risk: angina at minimal exertion is where the most can be gained.", lessonId: WHY },
      { id: "no-adhoc", text: "No ad hoc PCI: the consent covered the diagnostic study only and the disease is multivessel; plan the PCI with the patient.", lessonId: TEAM },
    ],
  },

  // pm-target#1 (contrast case): asymptomatic single-vessel disease without the prognostic criteria.
  {
    id: "diag-svd-asymptomatic-small-territory",
    title: "One vessel, no symptoms, a small ischaemic territory",
    caseName: "No symptoms, equivocal CT coronary angiogram",
    indication: "SA",
    brief:
      "A 63-year-old man has no symptoms and reached a high workload on a treadmill test. A CT coronary angiogram was equivocal and a perfusion scan showed a small area of ischaemia. He is having elective diagnostic angiography from the right radial artery. After the study report, decide what revascularisation, if any, you would recommend.",
    lessonIds: [WHY],
    module: MODULE,
    spec: { focus: "both", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "mid-rca", variantCount: [0, 0], nameHint: "No symptoms, equivocal CT coronary angiogram" },
    lesions: [{ vessel: "RCA", position: 0.45, severity: 80, kind: "mid-rca", role: "target" }],
    events: [],
    chart: {
      ageY: 63,
      sex: "M",
      heightCm: 180,
      weightKg: 82,
      egfr: 90,
      echo: { lvef: 60, note: "Normal LV size and function." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    planted: [],
    startAt: "root",
    checks: [
      { id: "none", text: "No revascularisation: no symptoms, ischaemia under 10% and no proximal LAD lesion.", lessonId: WHY },
      { id: "goal", text: "The goal named before any wire: there are no symptoms to relieve and no prognostic indication.", lessonId: WHY },
    ],
  },
];

/** The decision's chart facts per scenario (read by src/ui/sim/modules/revascDecision.ts). */
export const vignettes: Readonly<Record<string, StableVignette>> = {
  "diag-mvd-diabetes-fit": {
    inputs: {
      symptoms: "angina",
      extent: { vessels: 3, leftMain: false, proximalLad: true },
      ischaemiaPct: 15,
      lvef: 50,
      priorCabg: false,
      diabetes: true,
      surgicalCandidate: "good",
      complexity: "complex",
    },
    symptoms: "Angina on climbing one flight of stairs despite bisoprolol and isosorbide mononitrate.",
    ischaemia: "Perfusion scan: inducible ischaemia in about 15% of the LV, anterior and inferior.",
    surgicalRisk: "independent and active; the surgical review finds him a good candidate.",
    surgicalRiskBand: "low",
    preference: "Wants to know which treatment gives him the best long-term result.",
  },
  "diag-mvd-two-vessel-heart-team": {
    inputs: {
      symptoms: "angina",
      extent: { vessels: 2, leftMain: false, proximalLad: false },
      ischaemiaPct: null,
      lvef: 60,
      priorCabg: false,
      diabetes: false,
      surgicalCandidate: "good",
      complexity: "less-complex",
    },
    symptoms: "Angina on brisk walking despite bisoprolol and isosorbide mononitrate.",
    ischaemia: "Exercise test: 2 mm horizontal ST depression in the inferior and lateral leads at stage 2; no perfusion imaging.",
    surgicalRisk: "fit, with no significant comorbidity; a good surgical candidate.",
    surgicalRiskBand: "low",
    preference: "Would like both options explained before she decides.",
  },
  "diag-mvd-diabetes-frail": {
    inputs: {
      symptoms: "angina",
      extent: { vessels: 3, leftMain: false, proximalLad: false },
      ischaemiaPct: null,
      lvef: 45,
      priorCabg: false,
      diabetes: true,
      surgicalCandidate: "poor",
      complexity: "complex",
    },
    symptoms: "Angina on dressing despite bisoprolol, amlodipine and isosorbide mononitrate.",
    ischaemia: "No functional test: symptoms limit him at minimal exertion.",
    surgicalRisk: "frail, with chronic lung disease and reduced renal function; the surgical review judges the operative risk high.",
    surgicalRiskBand: "high",
    preference: "Wants relief of his angina and does not want an operation.",
  },
  "diag-svd-asymptomatic-small-territory": {
    inputs: {
      symptoms: "none",
      extent: { vessels: 1, leftMain: false, proximalLad: false },
      ischaemiaPct: 5,
      lvef: 60,
      priorCabg: false,
      diabetes: false,
      surgicalCandidate: "good",
      complexity: "less-complex",
    },
    symptoms: "None; a high workload reached on the treadmill without chest pain or breathlessness.",
    ischaemia: "Perfusion scan: ischaemia in about 5% of the LV, inferior.",
    surgicalRisk: "fit, with no significant comorbidity.",
    surgicalRiskBand: "low",
    preference: "Would prefer to avoid a procedure unless it helps him.",
  },
};
