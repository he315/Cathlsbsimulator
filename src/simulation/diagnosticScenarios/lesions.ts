// ---------------------------------------------------------------------------
// Lesion morphology scenarios (diag-lesion-morphologies): one patient each,
// with a lesion whose appearance depends on how it is filmed.
//
// The morphologies are drawn by src/render/xray/coronaryTree.ts on the Lesion
// fields of found-case-model-types: an eccentric lumen whose %DS depends on
// the view, a tapering reference, a lesion at a large side branch, a chronic
// total occlusion with contralateral collateral channels (Werner and Rentrop
// grades), the SCAD types as Brilakis gives them, a focal spasm that relaxes
// with nitrate (held back, see heldScenarios), and two candidate culprits (an acute thrombotic occlusion and
// a chronic one). Chart values (age, size, renal function, echo, drugs) and
// lesion values (position, severity, eccentricity, lengths, channel grades)
// are scenario data, not sourced facts. The lab requests each scenario
// answers are named above it.
//
// title names the scenario where the lessons and the case library list it;
// caseName is the case's name in the lab and states the presentation only.
// ---------------------------------------------------------------------------

import type { DiagScenario } from "./index";

export const scenarios: DiagScenario[] = [
  // pm-interpreting#0: an eccentric lesion that grades differently in orthogonal views.
  {
    id: "diag-eccentric-orthogonal",
    title: "An eccentric lesion in orthogonal views",
    caseName: "Exertional angina, inconclusive stress echo",
    indication: "SA",
    brief:
      "A 59-year-old man has exertional angina on two drugs and a stress echo that was inconclusive. He is having diagnostic angiography from the right radial. Image the left coronary artery in at least two orthogonal views before you judge any narrowing.",
    lessonIds: ["pm-interpreting-stenosis"],
    module: { id: "pm-interpreting", title: "Interpreting the angiogram" },
    spec: { focus: "left", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "severe-stenosis", variantCount: [0, 0], nameHint: "Exertional angina, inconclusive stress echo" },
    lesions: [{ vessel: "LAD", position: 0.3, severity: 72, kind: "severe-stenosis", lengthMm: 10, eccentricity: 0.6, orientationDeg: 0, role: "target" }],
    events: [],
    chart: {
      ageY: 59,
      sex: "M",
      heightCm: 177,
      weightKg: 88,
      egfr: 84,
      echo: { lvef: 60, note: "Stress echo inconclusive: poor windows at peak stress." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Isosorbide mononitrate", route: "oral", lastDoseHoursAgo: 3 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "orthogonal", text: "The lesion imaged in two orthogonal views, and the worse, least foreshortened view reported.", lessonId: "pm-interpreting-stenosis" },
      { id: "qca", text: "Calibrated on the catheter, with the averaged proximal and distal reference and the MLD in that view.", lessonId: "pm-interpreting-stenosis" },
    ],
  },

  // pm-interpreting#0: a tapering vessel where a one-ended reference misleads.
  {
    id: "diag-tapering-reference",
    title: "A narrowing in a tapering vessel",
    caseName: "Breathlessness on exertion",
    indication: "SA",
    brief:
      "A 66-year-old woman has breathlessness on exertion that her cardiologist thinks is an angina equivalent. She is having diagnostic angiography. Measure any narrowing you find against the vessel on both sides of it.",
    lessonIds: ["pm-interpreting-stenosis"],
    module: { id: "pm-interpreting", title: "Interpreting the angiogram" },
    spec: { focus: "left", access: "femoral", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Breathlessness on exertion" },
    lesions: [{ vessel: "LAD", position: 0.42, severity: 58, kind: "moderate-stenosis", lengthMm: 18, taperMm: 1, role: "target" }],
    events: [],
    chart: {
      ageY: 66,
      sex: "F",
      heightCm: 161,
      weightKg: 70,
      egfr: 72,
      echo: { lvef: 58, note: "Normal LV size and function, mild diastolic dysfunction." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 4 }, { name: "Ramipril", route: "oral", lastDoseHoursAgo: 4 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "references", text: "Both references measured and averaged: the proximal reference alone overstates a lesion in a tapering vessel.", lessonId: "pm-interpreting-stenosis" },
      { id: "length", text: "Length measured from normal to normal segment in the least foreshortened view.", lessonId: "pm-interpreting-stenosis" },
    ],
  },

  // pm-interpreting#0: a lesion at a large side branch.
  {
    id: "diag-lesion-at-branch",
    title: "A narrowing at a large diagonal",
    caseName: "Angina walking uphill",
    indication: "SA",
    brief:
      "A 63-year-old man has angina walking uphill despite treatment. He is having diagnostic angiography from the right radial. Find the views that open the left anterior descending from its branches.",
    lessonIds: ["pm-interpreting-stenosis"],
    module: { id: "pm-interpreting", title: "Interpreting the angiogram" },
    spec: { focus: "left", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "severe-stenosis", variantCount: [0, 0], nameHint: "Angina walking uphill" },
    lesions: [{ vessel: "LAD", position: 0.2, severity: 70, kind: "severe-stenosis", lengthMm: 12, branchAt: 0.5, medina: [1, 1, 0], role: "target" }],
    events: [],
    chart: {
      ageY: 63,
      sex: "M",
      heightCm: 174,
      weightKg: 82,
      egfr: 78,
      echo: { lvef: 55, note: "Normal LV function." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "branch", text: "A view that separates the lesion from the side branch, and the side branch's ostium described.", lessonId: "pm-interpreting-stenosis" },
      { id: "orthogonal", text: "The lesion graded in its worse orthogonal view, with references on both sides of the branch.", lessonId: "pm-interpreting-stenosis" },
    ],
  },

  // cp-cto-strategy#8 (and pm-interpreting#6): a stable patient with a CTO filling from contralateral collaterals.
  {
    id: "diag-cto-contralateral-collaterals",
    title: "A chronic occlusion filling from the other side",
    caseName: "Stable angina, inferior wall motion abnormality",
    indication: "SA",
    brief:
      "A 64-year-old man has had stable angina for two years and an inferior wall motion abnormality on echo. He is having diagnostic angiography and has consented to ad hoc PCI if it is appropriate. Account for every territory before you decide anything.",
    lessonIds: ["cp-cto-strategy-selection", "pm-interpreting-collaterals"],
    module: { id: "cp-cto-strategy", title: "Chronic total occlusions: selection, set-up and strategy" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "cto", variantCount: [0, 0], nameHint: "Stable angina, inferior wall motion abnormality" },
    lesions: [
      {
        vessel: "RCA",
        position: 0.3,
        severity: 100,
        kind: "cto",
        morphology: "cto",
        role: "target",
        sites: ["cto"],
        cto: {
          stump: "tapered",
          lengthMm: 25,
          collaterals: [
            { donor: "LAD", recipient: "PDA", type: "septal", wernerCC: 1, rentrop: 3, tortuosity: 1 },
            { donor: "LCx", recipient: "PLV", type: "epicardial", wernerCC: 1, rentrop: 3, tortuosity: 2 },
          ],
        },
      },
    ],
    events: [],
    chart: {
      ageY: 64,
      sex: "M",
      heightCm: 179,
      weightKg: 90,
      egfr: 70,
      echo: { lvef: 52, note: "Inferior hypokinesia, the wall thickness preserved." },
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
    script: [
      // the occlusion is seen on the first selective run of the occluded artery (a root puff fills no
      // coronary, so it shows nothing): held for the case
      { id: "occlusion-seen", when: { firstInjection: "right", engagement: ["selective-rca", "deep-rca"] }, do: [{ kind: "raise", event: "total-occlusion", hold: "case" }, { kind: "raise", event: "cto", hold: "case" }] },
    ],
    checks: [
      { id: "collateral-runs", text: "Long, low-magnification donor runs without panning, continued until the distal vessel has filled from the collaterals.", lessonId: "pm-interpreting-collaterals" },
      { id: "plan", text: "The CTO planned as a separate procedure rather than treated ad hoc in a stable patient (Brilakis's reasons to plan).", lessonId: "cp-cto-strategy-selection" },
    ],
  },

  // cp-other-complex#1: a suspected SCAD; the type the learner sees depends on the seed (types 1, 2A, 2B and 3).
  {
    id: "diag-scad-types",
    title: "Name the SCAD type",
    caseName: "Chest pain two months after delivery",
    indication: "STEMI",
    brief:
      "A 34-year-old woman delivered her first child two months ago and is breastfeeding. She has had central chest pain for two hours and her ECG shows anterior ST elevation. Engage gently and image every narrowing in orthogonal views.",
    lessonIds: ["cp-other-complex-scad"],
    module: { id: "cp-other-complex", title: "SCAD, stent failure, vessel size and long lesions" },
    spec: { focus: "left", access: "femoral", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Chest pain two months after delivery" },
    // no scadType: each seed draws one (caseGenerator scenarioCase)
    lesions: [{ vessel: "LAD", position: 0.5, severity: 65, kind: "moderate-stenosis", morphology: "scad", role: "target" }],
    events: [],
    chart: {
      ageY: 34,
      sex: "F",
      heightCm: 168,
      weightKg: 64,
      egfr: 110,
      echo: { lvef: 50, note: "Anterior and apical hypokinesia." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 1 }],
      allergies: { contrast: "none" },
      pregnancy: "test-negative",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    script: [{ id: "scad-history", when: { afterS: 0 }, do: [{ kind: "raise", event: "scad-suspected", hold: "case" }] }],
    checks: [
      { id: "gentle", text: "Coaxial engagement without deep intubation, gentle injections and intracoronary nitrate before judging the narrowing.", lessonId: "cp-other-complex-scad" },
      { id: "type", text: "The SCAD type named from orthogonal views (1 multiple lumens or staining; 2A diffuse with normal artery either side; 2B to the tip; 3 focal).", lessonId: "cp-other-complex-scad" },
      { id: "manage", text: "Management by Brilakis's rules: a stable patient without left main or proximal two-vessel dissection is observed, not revascularised.", lessonId: "cp-other-complex-scad" },
    ],
  },

  // pm-interpreting#11: two candidate culprits, an acute occlusion and a chronic one; the old report decides.
  {
    id: "diag-two-candidate-culprits",
    title: "Two occlusions: which is the culprit?",
    caseName: "Chest pain since this morning, raised troponin",
    indication: "NSTEMI",
    brief:
      "A 69-year-old man has had chest pain since this morning and a raised troponin. His ECG shows ST depression in V1 to V3 and no ST elevation. The registrar has found the report of an angiogram four years ago at another hospital: the right coronary artery was occluded and filled from the left. Name the culprit and the clues that support it.",
    lessonIds: ["pm-interpreting-flow", "pm-interpreting-collaterals"],
    module: { id: "pm-interpreting", title: "Interpreting the angiogram" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "thrombotic", variantCount: [0, 0], nameHint: "Chest pain since this morning, raised troponin" },
    lesions: [
      { vessel: "LCx", position: 0.4, severity: 100, kind: "thrombotic", morphology: "thrombus", thrombusGrade: 5, role: "target" },
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
    events: [],
    chart: {
      ageY: 69,
      sex: "M",
      heightCm: 172,
      weightKg: 84,
      egfr: 64,
      echo: { lvef: 45, note: "Bedside echo: lateral and posterior hypokinesia; the inferior wall thickens normally." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 2 }, { name: "Fondaparinux", route: "SC", lastDoseHoursAgo: 6 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    script: [
      // each occlusion is seen only on a selective run of its own artery, never on a root puff
      { id: "left-run", when: { firstInjection: "left", engagement: ["selective-lm", "deep-lm"] }, do: [{ kind: "raise", event: "total-occlusion", hold: "case" }, { kind: "raise", event: "thrombus", hold: "case" }] },
      // the right coronary occlusion is the chronic one (the brief gives the old report), so its run raises cto too
      { id: "right-run", when: { firstInjection: "right", engagement: ["selective-rca", "deep-rca"] }, do: [{ kind: "raise", event: "total-occlusion", hold: "case" }, { kind: "raise", event: "cto", hold: "case" }] },
    ],
    checks: [
      { id: "culprit", text: "The circumflex occlusion named as the culprit, with at least two clues (ECG territory, wall motion, the hazy convex meniscus, the old report).", lessonId: "pm-interpreting-flow" },
      { id: "collaterals", text: "Collaterals alone not used to date an occlusion: the old report is what makes the right coronary occlusion chronic.", lessonId: "pm-interpreting-collaterals" },
    ],
  },
];

/**
 * Built but not yet published: the live lab does not yet pass the engine's nitrate effect to the scene
 * builder (src/ui/sim/FluoroView.tsx, due with diag-spasm-states), so on the live screen this narrowing
 * would stay fixed after intracoronary nitrate and teach the wrong conclusion. It is kept out of
 * `scenarios` and lesions.launch.ts until that lands; the morphology tests build it through their own
 * lookup. diag-spasm-states publishes it (its plan lists diag-focal-rca-spasm in spasm.launch.ts).
 */
export const heldScenarios: DiagScenario[] = [
  // pm-acquiring#1: a smooth focal mid-RCA narrowing that is spasm and resolves after intracoronary nitrate.
  {
    id: "diag-focal-rca-spasm",
    title: "A focal narrowing that may be spasm",
    caseName: "Chest pain at rest in the early morning",
    indication: "SA",
    brief:
      "A 52-year-old woman has chest pain at rest in the early morning, sometimes waking her. She is having diagnostic angiography from the right radial. Repeat any view you need in the same projection.",
    lessonIds: ["pm-acquiring-test-nitrate", "pm-acquiring-anatomy"],
    module: { id: "pm-acquiring", title: "Acquiring the angiogram" },
    spec: { focus: "right", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "spasm", variantCount: [0, 0], nameHint: "Chest pain at rest in the early morning" },
    lesions: [{ vessel: "RCA", position: 0.45, severity: 75, kind: "spasm", lengthMm: 6, morphology: "spasm", nitrateResponsive: true, role: "target" }],
    events: [],
    chart: {
      ageY: 52,
      sex: "F",
      heightCm: 164,
      weightKg: 62,
      egfr: 92,
      echo: { lvef: 62, note: "Normal LV size and function." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }, { name: "Amlodipine", route: "oral", lastDoseHoursAgo: 3 }],
      allergies: { contrast: "none" },
      pregnancy: "test-negative",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "repeat-view", text: "The narrowing not reported as a fixed lesion without a run in the same projection after intracoronary nitrate.", lessonId: "pm-acquiring-test-nitrate" },
      { id: "trace", text: "No injection into a ventricularised or damped trace in the right coronary artery.", lessonId: "pm-acquiring-anatomy" },
    ],
  },
];
