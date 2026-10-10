// ---------------------------------------------------------------------------
// Study report scenarios (diag-study-report): one patient each, whose lesson
// is decided at the finish step (src/ui/lab/StudyReport.tsx): every LV wall
// accounted for, the findings, the MI classification of a troponin-positive
// presentation, and the decision between no PCI, ad hoc PCI, the heart team
// and a staged procedure.
//
//   - diag-territory-check-anomalous-cx (pm-acquiring#8, pm-interpreting#3,
//     pm-interpreting#9): a circumflex from the right sinus running behind the
//     aorta (diag-anatomy-variants draws it). The left injection leaves the
//     lateral wall empty and the right sinus injection fills it. There is no script: the event
//     'anomalous-origin' is raised by the finish step when the learner reports
//     a wall with no supplying vessel (src/mentor/report.ts finishEvents), so
//     the case teaches the territory check itself. The anatomy pack's
//     diag-anomalous-cx-retroaortic raises it during the study instead.
//   - diag-beyond-consent-lm (pm-planning#4): a stable patient consented for
//     ad hoc PCI whose angiogram shows unprotected left main disease, which
//     the consent did not cover; the report scores ad hoc PCI against
//     Brilakis's reasons to defer (7.3, pm-target-timing).
//   - diag-cto-plan-not-adhoc (cp-cto-strategy#8): a stable patient with a
//     right coronary CTO filled by septal collaterals; the finish step raises
//     'cto' and the report scores ad hoc CTO PCI. No script raises 'cto' or
//     'total-occlusion' during the study: the lesions pack's
//     diag-cto-contralateral-collaterals does that, and its reachability test
//     (src/ui/sim/modules/lesions.test.ts) counts those events as its own.
//   - diag-minoca-classify (hb-background#4): a troponin-positive acute
//     coronary syndrome with no stenosis of 50% or more; the report asks for
//     the MI classification ('nste-acs' on the case makes it ask) and the
//     truth is myocardial injury with non-obstructive coronary arteries.
//
// Chart values (age, size, renal function, echo, drugs) and lesion values
// (position, severity, length, channel grades) are MODEL PARAMETERS, listed in
// docs/realism/facts/pkg-diag-study-report.md; they are scenario data, not
// sourced facts. What the checks ask is quoted from the lessons they name.
//
// title names the scenario where the lessons and the case library list it;
// caseName is the case's name in the lab and states the presentation only.
// ---------------------------------------------------------------------------

import type { DiagScenario } from "./index";

export const scenarios: DiagScenario[] = [
  // pm-acquiring#8, pm-interpreting#3, pm-interpreting#9: the lateral wall has no vessel on the left injection.
  {
    id: "diag-territory-check-anomalous-cx",
    title: "Every wall accounted for before the catheter comes out",
    caseName: "Exertional angina, positive exercise test",
    indication: "SA",
    brief:
      "A 66-year-old man has exertional chest pain and a positive exercise test. He is having diagnostic angiography from the right femoral artery. Before you finish, say which vessel supplies each wall of the left ventricle and which injection showed it.",
    lessonIds: ["pm-interpreting-pitfalls"],
    module: { id: "pm-acquiring", title: "Acquiring the angiogram" },
    spec: {
      focus: "both",
      access: "femoral",
      rootSize: "normal",
      dominance: "right",
      pathology: "none",
      // the right-sinus circumflex only: the patient engine's coronary regions (engine.flow.regions, which
      // the report's territory truth reads) have no circumflex for 'anomalous-lcx-from-rca' yet, so that
      // variant's truth would credit the lateral wall to the RCA's posterolateral branches
      forceVariants: ["anomalous-lcx-right-sinus"],
      variantCount: [0, 0],
      nameHint: "Exertional angina, positive exercise test",
    },
    lesions: [],
    events: [],
    chart: {
      ageY: 66,
      sex: "M",
      heightCm: 174,
      weightKg: 82,
      egfr: 76,
      echo: { lvef: 57, note: "Normal LV size and function at rest." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Amlodipine", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "every-wall", text: "Each wall assigned a vessel that was seen to fill before the study ended; the empty lateral wall noticed rather than reported as normal.", lessonId: "pm-interpreting-pitfalls" },
      { id: "search", text: "The missing circumflex looked for: faint filling on the other injection, then cusp angiography or an aortogram.", lessonId: "pm-interpreting-anomalies" },
      { id: "no-occlusion", text: "No circumflex occlusion reported; the lateral wall credited to the right-sided injection that filled it.", lessonId: "pm-acquiring-anatomy" },
    ],
  },

  // pm-planning#4: unprotected left main disease in a patient consented for ad hoc PCI.
  {
    id: "diag-beyond-consent-lm",
    title: "Left main disease the consent did not cover",
    caseName: "Exertional angina, strongly positive exercise test",
    indication: "SA",
    brief:
      "A 71-year-old woman has angina on moderate exertion and a strongly positive exercise test. She is having diagnostic angiography from the right radial artery and has consented to ad hoc PCI of a single-vessel lesion if it is appropriate. Decide at the end of the study what happens next.",
    lessonIds: ["pm-planning-consent", "pm-target-timing"],
    module: { id: "pm-planning", title: "Planning the case" },
    spec: { focus: "left", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "left-main", variantCount: [0, 0], nameHint: "Exertional angina, strongly positive exercise test" },
    lesions: [{ vessel: "LM", position: 0.5, severity: 80, kind: "left-main", role: "target" }],
    events: [],
    chart: {
      ageY: 71,
      sex: "F",
      heightCm: 160,
      weightKg: 68,
      egfr: 62,
      echo: { lvef: 55, note: "Normal LV size and function at rest." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    checks: [
      { id: "ostium", text: "The left main ostium shown on a run with the tip not deep, since a lesion behind the tip is never opacified.", lessonId: "pm-interpreting-pitfalls" },
      { id: "stop", text: "Ad hoc PCI declined: the anatomy is beyond what was consented, and unprotected left main disease is one of Brilakis's reasons to defer.", lessonId: "pm-target-timing" },
      { id: "arrange", text: "A heart-team discussion and a new consent conversation arranged before any revascularisation.", lessonId: "pm-planning-consent" },
    ],
  },

  // cp-cto-strategy#8: a stable patient with a right coronary CTO filled by collaterals; plan, do not proceed ad hoc.
  {
    id: "diag-cto-plan-not-adhoc",
    title: "A chronic occlusion: plan it, do not treat it ad hoc",
    caseName: "Stable angina, previous inferior infarction",
    indication: "SA",
    brief:
      "A 59-year-old man had an inferior infarction three years ago that was treated medically, and now has angina on exertion despite two anti-anginal drugs. He is having diagnostic angiography from the right femoral artery and has consented to ad hoc PCI if it is appropriate. Account for every territory before you decide anything.",
    lessonIds: ["cp-cto-strategy-selection", "pm-target-timing"],
    module: { id: "cp-cto-strategy", title: "Chronic total occlusions: selection, set-up and strategy" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "cto", variantCount: [0, 0], nameHint: "Stable angina, previous inferior infarction" },
    lesions: [
      {
        vessel: "RCA",
        position: 0.4,
        severity: 100,
        kind: "cto",
        morphology: "cto",
        role: "target",
        cto: {
          stump: "blunt",
          lengthMm: 30,
          collaterals: [{ donor: "LAD", recipient: "PDA", type: "septal", wernerCC: 1, rentrop: 3, tortuosity: 0 }],
        },
      },
    ],
    events: [],
    chart: {
      ageY: 59,
      sex: "M",
      heightCm: 181,
      weightKg: 94,
      egfr: 84,
      echo: { lvef: 50, note: "Inferior hypokinesia; the other walls move normally." },
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
    startAt: "root",
    checks: [
      { id: "territory", text: "The inferior wall accounted for by the collaterals from the left injection, with the left run continued until the distal right coronary artery filled.", lessonId: "pm-interpreting-pitfalls" },
      { id: "plan", text: "The CTO planned as a separate procedure rather than treated ad hoc in a stable patient (Brilakis's reasons to plan).", lessonId: "cp-cto-strategy-selection" },
      { id: "decision", text: "The finish-step decision is staged PCI or the heart team, with the reasons to defer named.", lessonId: "pm-target-timing" },
    ],
  },

  // hb-background#4: a troponin-positive presentation with no stenosis of 50% or more.
  {
    id: "diag-minoca-classify",
    title: "Troponin positive, arteries non-obstructive: classify it",
    caseName: "Chest pain with a raised troponin, no ST elevation",
    indication: "NSTEMI",
    brief:
      "A 54-year-old woman had two hours of central chest pain yesterday evening. Her troponin is raised and rising, and her ECG shows T-wave inversion in the lateral leads without ST elevation. She is having diagnostic angiography from the right radial artery. At the end of the study, classify the presentation and say what happens next.",
    lessonIds: ["hb-background-mi"],
    module: { id: "hb-background", title: "Background for the lab: anatomy, disease and beyond the coronaries" },
    spec: { focus: "both", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", variantCount: [0, 0], nameHint: "Chest pain with a raised troponin, no ST elevation" },
    lesions: [{ vessel: "LAD", position: 0.4, severity: 30, kind: "mild-irregularity", role: "bystander" }],
    events: ["nste-acs"],
    chart: {
      ageY: 54,
      sex: "F",
      heightCm: 165,
      weightKg: 66,
      egfr: 92,
      echo: { lvef: 55, note: "Bedside echo: LV function preserved; no regional wall-motion abnormality seen." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 12 },
        { name: "Ticagrelor", route: "oral", lastDoseHoursAgo: 12 },
        { name: "Fondaparinux", route: "SC", lastDoseHoursAgo: 10 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "test-negative",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    checks: [
      { id: "classify", text: "With no stenosis of 50% or more, the presentation classified as myocardial injury with non-obstructive coronary arteries, a working diagnosis.", lessonId: "hb-background-mi" },
      { id: "mr", text: "Cardiac MR recommended, ideally within 2 weeks, to find the cause.", lessonId: "hb-background-mi" },
      { id: "no-pci", text: "No PCI: there is no obstructive lesion to treat.", lessonId: "hb-background-mi" },
    ],
  },
];
