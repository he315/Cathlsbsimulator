// ---------------------------------------------------------------------------
// The left heart tasks (diag-lv-aorta-task): seven patients for the pigtail's
// work beyond the coronaries.
//
//   diag-lv-gram-task           an intended ventriculogram with a raised LVEDP:
//                               cross, read the LVEDP, set the injector for it,
//                               film a clean cycle, pull back, out over the wire
//                               (hb-cardiac-catheterisation#0, #11)
//   diag-lv-gram-reading-set    a ventriculogram to read: the pattern is drawn
//                               from the seed (segmental defects by territory and
//                               dominance, MR, apical thrombus, takotsubo, a VSD,
//                               the anomalous circumflex dot) (#1, hb-background#1,
//                               hb-specific-conditions#3)
//   diag-aortogram-ar-grading   an aortogram for aortic regurgitation, its grade
//                               drawn from the seed (#2, hb-specific-conditions#3)
//   diag-difficult-valve-crossing  a normal valve the pigtail will not cross (#4)
//   diag-as-cross-or-not        severe aortic stenosis with concordant echo:
//                               crossing is not indicated (#4)
//   diag-tavi-workup            severe aortic stenosis before TAVI: coronaries,
//                               aortogram, iliofemoral run, crossing only if needed
//                               (cp-complex-patients#7)
//   diag-lv-stain-tamponade     an apical aneurysm: the test injection before the
//                               power injection, or a stain and later tamponade
//                               (#0, #11, cm-perforation#10)
//
// The lab's left heart session module (src/ui/sim/modules/leftHeart.ts) reads
// leftHeartSetups below: the catheter the case opens with, the valve, the
// LVEDP the patient starts at, whether crossing is indicated, and what the
// ventriculogram or aortogram shows (the case's pattern, combined with the
// engine's ischaemia). Every value there is a MODEL PARAMETER of the scenario
// (docs/realism/facts/pkg-diag-lv-aorta-task.md); the clinical rules the cases
// teach are the module text's (src/content/manual/cath-handbook/
// 04-cardiac-catheterisation.ts, 05-specific-conditions.ts). Chart values are
// scenario data. caseName states the presentation only.
//
// This pack imports types only, as every pack does (index.ts).
// ---------------------------------------------------------------------------

import type { DiagScenario } from "./index";

/** Wall-motion class of a ventriculogram segment (the module text's four). */
export type LvWallClass = "normal" | "hypokinetic" | "akinetic" | "dyskinetic";
export type LvSegmentName = "anterior" | "apical" | "inferior" | "septal" | "posterolateral";

/** What a ventriculogram or aortogram of the case shows (the answer key the reader is compared with). */
export interface LeftHeartFindings {
  /** a short name for the debrief (not shown during the case) */
  label: string;
  /** wall motion by segment; segments not named follow the engine (normal at rest) */
  segments?: Partial<Record<LvSegmentName, LvWallClass>>;
  /** LVEF, % (the global excursion); absent: the chart's */
  ef?: number;
  /** mitral and aortic regurgitation, grade 0 (none) to 4 (Oxford's I-IV) */
  mr?: 0 | 1 | 2 | 3 | 4;
  ar?: 0 | 1 | 2 | 3 | 4;
  thrombus?: boolean;
  takotsubo?: boolean;
  vsd?: boolean;
  anomalousCx?: boolean;
  /** the territory a regional defect points to, for the reader's territory question */
  territory?: "LAD" | "RCA" | "LCx" | null;
}

/** How a left heart scenario's lab starts (read by the left heart session module). */
export interface LeftHeartSetup {
  /** the task the brief sets (the learner still chooses it on the Left heart tab) */
  task: "ventriculogram" | "aortogram";
  /** the catheter in the root when the case opens */
  catheterId: "PIG" | "JL4" | "JR4";
  /** the aortic valve: normal, the difficult valve, or stenotic */
  valve: "normal" | "difficult" | "stenotic";
  /** LVEDP the patient starts at, mmHg (reached by a silent volume load at the start); absent: the chart's patient */
  lvedpMmHg?: number;
  /** crossing the valve is indicated (false: the echo answers the question, so the valve should not be crossed) */
  crossingIndicated: boolean;
  /** the findings; a list is a reading set, from which the case's seed picks one */
  findings: LeftHeartFindings | readonly LeftHeartFindings[];
  /** an aneurysm with thin wall: the apical and wall positions stain on a power injection */
  aneurysm?: boolean;
}

const CATH = { id: "hb-cardiac-catheterisation", title: "Cardiac catheterisation" };
const SPECIFIC = { id: "hb-specific-conditions", title: "Specific conditions" };
const COMPLEX = { id: "cp-complex-patients", title: "Complex patients" };

/** The reading set (hb-cardiac-catheterisation#1, hb-background#1, hb-specific-conditions#3). */
export const READING_SET: readonly LeftHeartFindings[] = [
  { label: "anterior akinesis (LAD)", segments: { anterior: "akinetic", apical: "hypokinetic" }, ef: 45, territory: "LAD" },
  { label: "apical dyskinesis from a wrapping LAD", segments: { apical: "dyskinetic", anterior: "hypokinetic" }, ef: 40, territory: "LAD" },
  { label: "inferior hypokinesis (RCA, right dominant)", segments: { inferior: "hypokinetic" }, ef: 52, territory: "RCA" },
  { label: "posterolateral akinesis (LCx)", segments: { posterolateral: "akinetic" }, ef: 48, territory: "LCx" },
  { label: "moderate mitral regurgitation", mr: 2, territory: null },
  { label: "severe mitral regurgitation", mr: 3, ef: 55, territory: null },
  { label: "apical thrombus in an akinetic apex", segments: { apical: "akinetic", anterior: "hypokinetic" }, thrombus: true, ef: 38, territory: "LAD" },
  { label: "takotsubo apical ballooning", takotsubo: true, territory: null },
  { label: "ventricular septal defect", vsd: true, territory: null },
  { label: "anomalous circumflex: the dot sign", anomalousCx: true, territory: null },
];

/** The AR grades of the aortogram set (hb-cardiac-catheterisation#2). */
export const AR_SET: readonly LeftHeartFindings[] = [
  { label: "aortic regurgitation grade I", ar: 1 },
  { label: "aortic regurgitation grade II", ar: 2 },
  { label: "aortic regurgitation grade III", ar: 3 },
  { label: "aortic regurgitation grade IV", ar: 4 },
];

/** The start states, by scenario id. */
export const leftHeartSetups: Readonly<Record<string, LeftHeartSetup>> = {
  // an old anterior infarct; LVEDP 27 is above Oxford's 25 (reduce the run) and below 30 (oedema likely above)
  "diag-lv-gram-task": { task: "ventriculogram", catheterId: "PIG", valve: "normal", lvedpMmHg: 27, crossingIndicated: true, findings: { label: "anterior hypokinesis", segments: { anterior: "hypokinetic", apical: "hypokinetic" }, ef: 45, territory: "LAD" } },
  "diag-lv-gram-reading-set": { task: "ventriculogram", catheterId: "PIG", valve: "normal", lvedpMmHg: 14, crossingIndicated: true, findings: READING_SET },
  "diag-aortogram-ar-grading": { task: "aortogram", catheterId: "PIG", valve: "normal", crossingIndicated: false, findings: AR_SET },
  "diag-difficult-valve-crossing": { task: "ventriculogram", catheterId: "PIG", valve: "difficult", lvedpMmHg: 12, crossingIndicated: true, findings: { label: "normal left ventricle, severe mitral regurgitation", mr: 3, territory: null } },
  "diag-as-cross-or-not": { task: "aortogram", catheterId: "JL4", valve: "stenotic", crossingIndicated: false, findings: { label: "severe aortic stenosis, no regurgitation", territory: null } },
  "diag-tavi-workup": { task: "aortogram", catheterId: "JL4", valve: "stenotic", crossingIndicated: false, findings: { label: "severe aortic stenosis, mild regurgitation", ar: 1, territory: null } },
  "diag-lv-stain-tamponade": { task: "ventriculogram", catheterId: "PIG", valve: "normal", lvedpMmHg: 16, crossingIndicated: true, aneurysm: true, findings: { label: "apical aneurysm", segments: { apical: "dyskinetic", anterior: "akinetic" }, ef: 35, territory: "LAD" } },
};

export const scenarios: DiagScenario[] = [
  {
    id: "diag-lv-gram-task",
    title: "The ventriculogram as a task: cross, LVEDP, injector, clean cycle, pullback",
    caseName: "Breathless on exertion after an old heart attack",
    indication: "SA",
    brief:
      "A 66-year-old man had an anterior infarct six years ago and is now breathless on exertion. Echo windows were too poor to judge LV function, so the team wants coronary angiography and a left ventriculogram. The pigtail is in the aortic root over the J wire. Choose the ventriculogram on the Left heart tab when you are ready.",
    lessonIds: ["hb-cardiac-catheterisation-lv-gram", "hb-cardiac-catheterisation-lhc"],
    module: CATH,
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Breathless on exertion after an old heart attack" },
    lesions: [{ vessel: "LAD", position: 0.3, severity: 60, kind: "moderate-stenosis" }],
    events: [],
    chart: {
      ageY: 66,
      sex: "M",
      heightCm: 176,
      weightKg: 84,
      egfr: 72,
      echo: { lvef: 45, note: "Poor windows; LV function could not be assessed reliably." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Ramipril", route: "oral", lastDoseHoursAgo: 14 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "mid-cavity", text: "No injection from the apex, the papillary muscles or against the wall: the pigtail in the mid-cavity.", lessonId: "hb-cardiac-catheterisation-lv-gram" },
      { id: "lvedp", text: "The LVEDP recorded after the a wave before the injector was set.", lessonId: "hb-cardiac-catheterisation-lhc" },
      { id: "settings", text: "Injector settings for the LVEDP: with an LVEDP above 25 mmHg, volume and rate reduced (for example 30 mL at 10 mL/s).", lessonId: "hb-cardiac-catheterisation-lv-gram" },
      { id: "air", text: "The injector purged of air before it was armed.", lessonId: "hb-cardiac-catheterisation-lv-gram" },
      { id: "clean-cycle", text: "At least one clean sinus cycle recorded.", lessonId: "hb-cardiac-catheterisation-lv-gram" },
      { id: "pullback", text: "Pullback from LV to aorta recorded under pressure; the catheter removed over a wire.", lessonId: "hb-cardiac-catheterisation-lv-gram" },
      { id: "oedema", text: "If pulmonary oedema follows: oxygen and sitting up among the first actions.", lessonId: "cm-flow-embolism-oedema-cholesterol" },
    ],
  },
  {
    id: "diag-lv-gram-reading-set",
    title: "Reading ventriculograms: wall motion, territory, MR and the ungradable run",
    caseName: "Ventriculogram for left ventricular assessment",
    indication: "SA",
    brief:
      "A 61-year-old with chest pain on exertion is having coronary angiography and a ventriculogram, because the echo did not answer the question. The pigtail is in the aortic root over the J wire. Film the ventriculogram in RAO 30 and LAO 60 cranial 20, then read it on the Left heart tab: global function, each segment the view profiles, the territory, and the MR grade, or say the run cannot be graded.",
    lessonIds: ["hb-cardiac-catheterisation-lv-gram", "hb-background-silhouette", "hb-specific-conditions-mitral"],
    module: CATH,
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", variantCount: [0, 0], nameHint: "Ventriculogram for left ventricular assessment" },
    events: [],
    chart: {
      ageY: 61,
      sex: "F",
      heightCm: 164,
      weightKg: 70,
      egfr: 80,
      echo: { note: "Limited study; LV function and the mitral valve not assessed." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "wall-motion", text: "Global function and wall motion graded within one grade of the run.", lessonId: "hb-cardiac-catheterisation-lv-gram" },
      { id: "territory", text: "The territory named from the wall-motion pattern and the dominance before the angiogram confirmed it.", lessonId: "hb-background-silhouette" },
      { id: "mr", text: "MR graded on a clean run within one grade; a run with ectopics or the catheter on the mitral apparatus declared ungradable.", lessonId: "hb-specific-conditions-mitral" },
    ],
  },
  {
    id: "diag-aortogram-ar-grading",
    title: "The aortogram: clear of the leaflets, and the regurgitation graded",
    caseName: "Diastolic murmur, aortogram requested",
    indication: "SA",
    brief:
      "A 58-year-old man with a diastolic murmur and a dilated left ventricle on echo is having coronary angiography; the team also wants an aortogram to grade the aortic regurgitation. The pigtail is in the ascending aorta over the J wire. Choose the aortogram on the Left heart tab, position it clear of the valve, and grade what you see.",
    lessonIds: ["hb-cardiac-catheterisation-aortography", "hb-specific-conditions-ar-right"],
    module: CATH,
    spec: { focus: "both", access: "femoral", rootSize: "dilated", dominance: "right", pathology: "none", variantCount: [0, 0], nameHint: "Diastolic murmur, aortogram requested" },
    events: [],
    chart: {
      ageY: 58,
      sex: "M",
      heightCm: 182,
      weightKg: 88,
      egfr: 85,
      echo: { lvef: 55, valves: [{ valve: "aortic", lesion: "regurgitation", severity: "moderate" }], note: "Dilated LV; aortic regurgitation, severity uncertain on echo." },
      drugs: [{ name: "Ramipril", route: "oral", lastDoseHoursAgo: 14 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "position", text: "No injection with the pigtail on the valve: positioned in the proximal ascending aorta, clear of the leaflets.", lessonId: "hb-cardiac-catheterisation-aortography" },
      { id: "settings", text: "40–60 mL at 20 mL/s in LAO during a breath-hold.", lessonId: "hb-cardiac-catheterisation-aortography" },
      { id: "grade", text: "AR graded within one grade; catheter-induced regurgitation recognised and not graded.", lessonId: "hb-specific-conditions-ar-right" },
    ],
  },
  {
    id: "diag-difficult-valve-crossing",
    title: "The pigtail will not cross: the difficult-valve sequence",
    caseName: "Left heart pressures before valve surgery",
    indication: "SA",
    brief:
      "A 58-year-old man is having coronary angiography and LV pressures before mitral valve surgery. The echo shows no aortic stenosis. The pigtail is in the aortic root over the J wire. Enter the left ventricle and record the LVEDP.",
    lessonIds: ["hb-cardiac-catheterisation-lhc"],
    module: CATH,
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "none", variantCount: [0, 0], nameHint: "Left heart pressures before valve surgery" },
    events: [],
    chart: {
      ageY: 58,
      sex: "M",
      heightCm: 178,
      weightKg: 80,
      egfr: 90,
      echo: { lvef: 60, valves: [{ valve: "mitral", lesion: "regurgitation", severity: "severe" }], note: "Trileaflet aortic valve, no stenosis." },
      drugs: [{ name: "Furosemide", route: "oral", lastDoseHoursAgo: 4 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "notes", text: "Aortic stenosis excluded from the notes before escalating.", lessonId: "hb-cardiac-catheterisation-lhc" },
      { id: "order", text: "The escalation in order: the pigtail stiffened with the wire, wire-led crossing, then JR4 or Amplatz with a straight or hydrophilic wire, then exchange to the pigtail over a long J wire.", lessonId: "hb-cardiac-catheterisation-lhc" },
    ],
  },
  {
    id: "diag-as-cross-or-not",
    title: "Severe aortic stenosis: cross, or not?",
    caseName: "Breathless on exertion, valve referral",
    indication: "SA",
    brief:
      "A 74-year-old man with exertional breathlessness is referred for coronary angiography before aortic valve surgery. Read the echo on the chart. The left catheter is in the aortic root over the J wire.",
    lessonIds: ["hb-cardiac-catheterisation-lhc", "hb-specific-conditions-as"],
    module: SPECIFIC,
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", variantCount: [0, 0], nameHint: "Breathless on exertion, valve referral" },
    events: ["aortic-stenosis"],
    chart: {
      ageY: 74,
      sex: "M",
      heightCm: 172,
      weightKg: 78,
      egfr: 62,
      echo: { lvef: 60, valves: [{ valve: "aortic", lesion: "stenosis", severity: "severe" }], note: "Good-quality study: valve area 0.8 cm², mean gradient 48 mmHg; symptoms concordant." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "no-cross", text: "No crossing of a severely stenotic valve without an indication: the echo is good and concordant.", lessonId: "hb-cardiac-catheterisation-lhc" },
    ],
  },
  {
    id: "diag-tavi-workup",
    title: "The TAVI work-up study: coronaries, aortogram and the iliofemoral run",
    caseName: "Work-up before transcatheter valve replacement",
    indication: "SA",
    brief:
      "An 82-year-old woman with severe aortic stenosis is having her work-up for transcatheter valve replacement: coronary angiography, an aortogram for the valve and the aorta, and an iliofemoral run from a pigtail above the aortic bifurcation. The left catheter is in the aortic root over the J wire.",
    lessonIds: ["cp-complex-patients-tavr-before"],
    module: COMPLEX,
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", variantCount: [0, 0], nameHint: "Work-up before transcatheter valve replacement" },
    events: ["aortic-stenosis"],
    chart: {
      ageY: 82,
      sex: "F",
      heightCm: 158,
      weightKg: 61,
      egfr: 48,
      echo: { lvef: 55, valves: [{ valve: "aortic", lesion: "stenosis", severity: "severe" }], note: "Severe calcific aortic stenosis; symptoms concordant." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "pulse", text: "The slow-rising, low aortic pulse read as aortic stenosis, not damping.", lessonId: "cp-complex-patients-tavr-before" },
      { id: "complete", text: "A complete work-up: coronaries, aortogram and the iliofemoral run.", lessonId: "cp-complex-patients-tavr-before" },
      { id: "no-cross", text: "No unnecessary valve crossing.", lessonId: "cp-complex-patients-tavr-before" },
    ],
  },
  {
    id: "diag-lv-stain-tamponade",
    title: "Against the wall: the test injection, the stain and the tamponade that follows",
    caseName: "Ventriculogram after an anterior infarct",
    indication: "SA",
    brief:
      "A 69-year-old woman had a large anterior infarct a year ago; the team wants a ventriculogram to look at the apex before surgery. The pigtail is in the aortic root over the J wire. Choose the ventriculogram on the Left heart tab when you are ready.",
    lessonIds: ["hb-cardiac-catheterisation-lv-gram", "cm-perforation-tamponade"],
    module: CATH,
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Ventriculogram after an anterior infarct" },
    lesions: [{ vessel: "LAD", position: 0.3, severity: 70, kind: "moderate-stenosis" }],
    events: [],
    chart: {
      ageY: 69,
      sex: "F",
      heightCm: 162,
      weightKg: 68,
      egfr: 66,
      echo: { lvef: 35, note: "Apical aneurysm suspected; apex poorly seen." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "test", text: "A 10 mL hand test injection before the power injection when unsure the tip is clear of the aneurysm or the wall.", lessonId: "hb-cardiac-catheterisation-lv-gram" },
      { id: "stain", text: "A stain recognised and the injection stopped.", lessonId: "cm-perforation-tamponade" },
      { id: "tamponade", text: "Tamponade told from a vagal reaction by the rising heart rate; echo, pericardiocentesis not delayed, a drain left and the anticoagulation reviewed.", lessonId: "cm-perforation-tamponade" },
    ],
  },
];
