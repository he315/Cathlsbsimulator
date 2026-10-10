// ---------------------------------------------------------------------------
// The rhythm and haemodynamic scenarios (diag-rhythm-haemodynamic-events):
// arrhythmias, vagal reactions and hypotension caused by what was done, with
// the orders that treat them (the Rhythm tab, src/ui/lab/controls/tabs/
// RhythmTab.tsx; the lab session's 'rhythm' capability).
//
//   diag-vf-causes                  VF from the injection itself: a conus that
//                                   a right Judkins rides into, a damped or
//                                   plugged RCA, contrast that cannot clear
//                                   (cp-complex-patients#2, cm-patient-
//                                   complications#1)
//   diag-vagal-vs-bleed             a slow pulse, then a falling pressure, in
//                                   a femoral study: legs up, atropine and
//                                   saline do not restore it, because it is a
//                                   hidden retroperitoneal bleed from a high
//                                   puncture (the default seed) or a tamponade;
//                                   at a third of the seeds it is a true
//                                   vasovagal reaction that recovers
//                                   (cm-patient-complications#1)
//   diag-amplatz-hypotension        an Amplatz advanced onto the cusp holds the
//                                   aortic valve open (cm-patient-complications#1)
//   diag-lv-vt                      sustained VT from the pigtail touching the
//                                   LV wall in a patient with a long QT
//                                   (pm-lab-drugs#8, cp-complex-patients#2)
//   diag-bradycardia-pace           complete block after a right coronary
//                                   injection that atropine does not lift: pacing
//                                   (cp-complex-patients#2)
//   diag-arrhythmia-contraindications  fast AF with a long QT and a poor LV:
//                                   which drug, or a synchronised shock
//                                   (pm-lab-drugs#8)
//
// Sources (module text, src/content/manual/**): the VF triggers of an
// injection and their treatment (tips diag-vf-catheter-cause, complex-pci/
// 08-complex-patients.ts:1851, and diag-vf-shock-then-amiodarone, pci-manual/
// 04-lab-drugs.ts:2047; the electrical treatment, 08-complex-patients.ts:610-
// 623 and complication-management/05-patient-complications.ts:434-460); the
// vagal sequence and its time limit (05-patient-complications.ts:259-341 and
// the tip at 1867); a slow pulse with a retroperitoneal bleed and the high
// puncture (complication-management/06-access-complications.ts:74, 145, 225);
// the Amplatz holding the cusp open (tip diag-hypo-amplatz-valve, 05-patient-
// complications.ts:1834); the QTc of 540 ms with VT at LV catheterisation and
// amiodarone avoided in a long QT (04-lab-drugs.ts:1349-1358, 936); AF with
// severe compromise and flecainide only without structural heart disease
// (04-lab-drugs.ts:855, 939); Mobitz II and complete block needing pacing, not
// more atropine (05-patient-complications.ts:471, tip diag-bradycardia-
// atropine-or-pace at 04-lab-drugs.ts:2062). Chart values (age, size, renal
// function, the ventricular rates) are scenario data; the onset times, rates and
// severities in RHYTHM_SETUPS are MODEL PARAMETERS (docs/realism/facts/pkg-diag-
// rhythm-haemodynamic-events.md).
//
// This pack imports types only, as every pack does (index.ts). The lab session
// (src/ui/sim/labSession.ts) reads rhythmSetups and RHYTHM_ECGS.
// ---------------------------------------------------------------------------

import type { DiagScenario } from "./index";

/**
 * What a chart's resting ECG (CaseChart.ecgId) shows that the patient engine must carry: the QTc and
 * pre-excitation. The engine's monitor draws the QT from the profile, so a long QT on the chart is a
 * long QT on the monitor.
 */
export interface RhythmEcg {
  /** QTc, ms */
  qtcMs?: number;
  preExcitation?: boolean;
  /** what the chart says about the ECG, for the record */
  text: string;
}

/** The resting ECGs of these scenarios, by chart ecgId. */
export const RHYTHM_ECGS: Readonly<Record<string, RhythmEcg>> = {
  // the module text's patient: a baseline QTc of 540 ms (04-lab-drugs.ts:1349)
  "ecg-rhythm-long-qt": { qtcMs: 540, text: "Sinus rhythm, QTc 540 ms." },
  "ecg-rhythm-af-long-qt": { qtcMs: 520, text: "Atrial fibrillation on the ward strip; QTc 520 ms in sinus rhythm last month." },
};

/** The hypotension a scenario starts (the shared cause model's diagnostic causes, labSession.ts DIAG_HYPOTENSION_CAUSES). */
export type RhythmHypotension = "vagal-mimic" | "post-nitrate";

/** Which cause a vagal-mimic scenario runs at a seed: a hidden bleed, a tamponade, or a true vasovagal reaction. */
export type VagalMimicCause = "hidden-bleed" | "tamponade" | "vagal";

/** How a rhythm scenario starts, beyond its chart and script (read by src/ui/sim/labSession.ts). */
export interface RhythmSetup {
  /** the catheter at the root at the start */
  catheterId?: string;
  /** an arrhythmia already running at the start, at this ventricular rate (bpm) */
  startRhythm?: { kind: "af" | "svt"; rateBpm: number };
  /** the first injection into this coronary brings this AV block, which persists until paced or the case ends */
  blockOnFirstInjection?: { side: "left" | "right"; degree: 2 | 3 };
  /** a hypotension cause started `afterS` of lab time after the time-out */
  hypotension?: { cause: RhythmHypotension; afterS: number };
  /** the femoral puncture lies above the femoral head (site.ts punctureBleed) */
  highPuncture?: boolean;
  /** the pericardial inflow of the tamponade variant, mL/s */
  tamponadeMlS?: number;
  /** the Amplatz holds the aortic valve open while it is deep (engine aortic regurgitation, 0..1) */
  cuspRegurgitation?: number;
}

/** The start states, by scenario id. Every number is a MODEL PARAMETER. */
export const rhythmSetups: Readonly<Record<string, RhythmSetup>> = {
  "diag-vf-causes": { catheterId: "JR4" },
  "diag-vagal-vs-bleed": { hypotension: { cause: "vagal-mimic", afterS: 60 }, highPuncture: true, tamponadeMlS: 1.0 },
  "diag-amplatz-hypotension": { catheterId: "AL1", cuspRegurgitation: 0.6 },
  "diag-lv-vt": { catheterId: "PIG" },
  "diag-bradycardia-pace": { catheterId: "JR4", blockOnFirstInjection: { side: "right", degree: 3 } },
  "diag-arrhythmia-contraindications": { startRhythm: { kind: "af", rateBpm: 150 } },
};

/**
 * What a vagal-mimic scenario runs at a seed, by the sum of the seed's character codes modulo 3: 1 the
 * hidden bleed (the default seed "1"), 2 a tamponade that does not recover ("2"), 0 a true vasovagal
 * reaction that recovers with legs up, atropine and saline ("3"). Pure, so the debrief and the tests
 * know which it was.
 */
export function vagalMimicCause(seed: string): VagalMimicCause {
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i);
  const k = sum % 3;
  return k === 1 ? "hidden-bleed" : k === 2 ? "tamponade" : "vagal";
}

const ARREST = "cp-complex-patients-lab-arrest";
const ARRHYTHMIA = "cm-patient-complications-arrhythmia";
const HYPO = "cm-patient-complications-hypotension";
const VAGAL = "cm-patient-complications-vasovagal";
const ANTIARRHYTHMICS = "pm-lab-drugs-antiarrhythmics";
const MODULE_CM = { id: "cm-patient-complications", title: "Hypotension, arrhythmia, radiation, kidneys and bleeding" };
const MODULE_PM = { id: "pm-lab-drugs", title: "Sedation, vasodilators, pressors, antiarrhythmics and contrast" };

export const scenarios: DiagScenario[] = [
  // cp-complex-patients#2 and cm-patient-complications#1: VF from what the injection did.
  {
    id: "diag-vf-causes",
    title: "VF after an injection: what was the catheter doing?",
    caseName: "Exertional chest pain, femoral study",
    indication: "SA",
    brief:
      "A 61-year-old man with exertional chest pain and an abnormal stress test is having a diagnostic angiogram from the right femoral artery. Pads are on. The right Judkins is at the root. Watch the trace before every injection.",
    lessonIds: [ARREST, ARRHYTHMIA, ANTIARRHYTHMICS],
    module: { id: "cp-complex-patients", title: "Complex patients" },
    spec: {
      focus: "right",
      access: "femoral",
      rootSize: "normal",
      dominance: "right",
      pathology: "moderate-stenosis",
      forceVariants: ["conus-separate-ostium"],
      variantCount: [0, 0],
      nameHint: "Exertional chest pain, femoral study",
    },
    lesions: [{ vessel: "RCA", position: 0.45, severity: 60, kind: "moderate-stenosis" }],
    events: [],
    chart: {
      ageY: 61,
      sex: "M",
      heightCm: 178,
      weightKg: 86,
      egfr: 82,
      echo: { lvef: 58, note: "Normal LV size and function." },
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
      { id: "shock-first", text: "VF shocked at once, unsynchronised and at high energy (150-200 J biphasic), up to three quick shocks in the monitored lab.", lessonId: ARREST },
      { id: "remove-cause", text: "Before the next injection the catheter was withdrawn from the ostium so that flow and clearance returned, and re-engaged gently or with another catheter.", lessonId: ARRHYTHMIA },
      { id: "persistent", text: "If VF persisted: compressions, adrenaline 1 mg after the third shock and amiodarone 300 mg after three shocks.", lessonId: ARREST },
    ],
  },

  // cm-patient-complications#1: the vagal look-alike that is not vagal.
  {
    id: "diag-vagal-vs-bleed",
    title: "A slow pulse and a falling pressure: vagal, or not?",
    caseName: "Breathlessness and angina, femoral study",
    indication: "SA",
    brief:
      "A 72-year-old woman with angina and breathlessness is having a diagnostic angiogram from the right femoral artery. The puncture took three passes. A left ventriculogram is planned. Treat what you find, and decide how long you will wait for it to work.",
    lessonIds: [VAGAL, HYPO, ANTIARRHYTHMICS],
    module: MODULE_CM,
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Breathlessness and angina, femoral study" },
    lesions: [{ vessel: "LAD", position: 0.4, severity: 55, kind: "moderate-stenosis" }],
    events: [],
    chart: {
      ageY: 72,
      sex: "F",
      heightCm: 158,
      weightKg: 56,
      egfr: 64,
      echo: { lvef: 55, note: "Normal LV size; mild septal hypertrophy." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Clopidogrel", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Ramipril", route: "oral", lastDoseHoursAgo: 26, held: true },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "vagal-sequence", text: "Legs up, atropine 0.5-1.0 mg IV and fast saline for the slow pulse with a falling pressure.", lessonId: VAGAL },
      { id: "time-limit", text: "A time was set for the vagal diagnosis; when the pressure had not recovered within a few minutes the cause was reconsidered: bleeding first, then tamponade and infarction.", lessonId: VAGAL },
      { id: "slow-pulse", text: "A slow pulse was not taken to exclude a retroperitoneal bleed after a high femoral puncture.", lessonId: HYPO },
    ],
  },

  // cm-patient-complications#1: the Amplatz on the cusp.
  {
    id: "diag-amplatz-hypotension",
    title: "The pressure falls with the Amplatz deep",
    caseName: "Angina with a wide aortic root, femoral study",
    indication: "SA",
    brief:
      "A 68-year-old man with angina and a dilated aortic root is having a diagnostic angiogram from the right femoral artery. The left Judkins did not reach the left main on a previous study, so an Amplatz is at the root. Watch the pressure as you seat it.",
    lessonIds: [HYPO, "hb-specific-conditions-ar-right"],
    module: MODULE_CM,
    spec: { focus: "left", access: "femoral", rootSize: "dilated", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Angina with a wide aortic root, femoral study" },
    lesions: [{ vessel: "LAD", position: 0.35, severity: 60, kind: "moderate-stenosis" }],
    events: ["dilated-root"],
    chart: {
      ageY: 68,
      sex: "M",
      heightCm: 182,
      weightKg: 90,
      egfr: 76,
      echo: { lvef: 56, note: "Aortic root 45 mm; trivial aortic regurgitation; normal LV function." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Amlodipine", route: "oral", lastDoseHoursAgo: 3 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
      previousCatheters: [{ target: "left", catheterId: "AL1" }],
    },
    startAt: "root",
    checks: [
      { id: "withdraw", text: "The Amplatz was withdrawn a little off the cusp and the trace watched; the pressure recovered without a drug.", lessonId: HYPO },
      { id: "no-pressor-first", text: "No vasopressor before the catheter position had been checked.", lessonId: HYPO },
    ],
  },

  // pm-lab-drugs#8 and cp-complex-patients#2: VT from the pigtail, in a long QT.
  {
    id: "diag-lv-vt",
    title: "VT during the ventriculogram: which treatment?",
    caseName: "Palpitations and breathlessness, femoral study",
    indication: "SA",
    brief:
      "A 64-year-old man with breathlessness and a history of palpitations is having a diagnostic study with a left ventriculogram from the right femoral artery. His resting ECG is on the chart. The pigtail is at the root. Pads are on.",
    lessonIds: [ANTIARRHYTHMICS, ARRHYTHMIA],
    module: MODULE_PM,
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", variantCount: [0, 0], nameHint: "Palpitations and breathlessness, femoral study" },
    lesions: [{ vessel: "LAD", position: 0.3, severity: 30, kind: "mild-irregularity" }],
    events: [],
    chart: {
      ageY: 64,
      sex: "M",
      heightCm: 175,
      weightKg: 82,
      egfr: 78,
      echo: { lvef: 50, note: "Mildly dilated LV with mildly reduced function." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Ramipril", route: "oral", lastDoseHoursAgo: 3 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
      ecgId: "ecg-rhythm-long-qt",
    },
    startAt: "root",
    checks: [
      { id: "withdraw", text: "The pigtail was pulled back off the LV wall.", lessonId: ARRHYTHMIA },
      { id: "no-amiodarone", text: "No amiodarone with the long QT on the chart (Brilakis).", lessonId: ANTIARRHYTHMICS },
      { id: "treatment", text: "Tolerated VT: synchronised cardioversion under sedation, or lidocaine 50 mg; poorly tolerated VT: synchronised cardioversion at 200-360 J or the biphasic equivalent.", lessonId: ARRHYTHMIA },
    ],
  },

  // cp-complex-patients#2: complete block after a right coronary injection.
  {
    id: "diag-bradycardia-pace",
    title: "A slow rhythm after the right coronary run",
    caseName: "Dizzy spells and angina, femoral study",
    indication: "SA",
    brief:
      "A 76-year-old woman with angina and dizzy spells is having a diagnostic angiogram from the right femoral artery. The right Judkins is at the root. Watch the rhythm after each right coronary run.",
    lessonIds: [ARRHYTHMIA, ANTIARRHYTHMICS],
    module: MODULE_CM,
    spec: { focus: "right", access: "femoral", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Dizzy spells and angina, femoral study" },
    lesions: [{ vessel: "RCA", position: 0.3, severity: 65, kind: "moderate-stenosis" }],
    events: [],
    chart: {
      ageY: 76,
      sex: "F",
      heightCm: 160,
      weightKg: 62,
      egfr: 58,
      echo: { lvef: 60, note: "Normal LV size and function." },
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
      { id: "wait-then-atropine", text: "Injection slowing given seconds to recover; atropine 0.5-1 mg if it persisted.", lessonId: ARRHYTHMIA },
      { id: "pace", text: "Complete block that atropine did not lift was paced (external pacing as a bridge, a transvenous wire), not treated with more atropine.", lessonId: ARRHYTHMIA },
    ],
  },

  // pm-lab-drugs#8: fast AF in a patient whose chart rules drugs out.
  {
    id: "diag-arrhythmia-contraindications",
    title: "Fast AF: is that drug safe for this patient?",
    caseName: "Breathlessness with a fast pulse, femoral study",
    indication: "SA",
    brief:
      "A 70-year-old man with breathlessness is having a diagnostic angiogram from the right femoral artery. On the table his pulse is fast and irregular. His ECG and echo are on the chart. Decide how to treat the rhythm before you go on.",
    lessonIds: [ANTIARRHYTHMICS, ARRHYTHMIA],
    module: MODULE_PM,
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Breathlessness with a fast pulse, femoral study" },
    lesions: [{ vessel: "LCx", position: 0.4, severity: 60, kind: "moderate-stenosis" }],
    events: [],
    chart: {
      ageY: 70,
      sex: "M",
      heightCm: 172,
      weightKg: 78,
      egfr: 66,
      echo: { lvef: 32, note: "Dilated LV with severely reduced function; regional wall motion abnormality." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Furosemide", route: "oral", lastDoseHoursAgo: 3 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
      ecgId: "ecg-rhythm-af-long-qt",
    },
    startAt: "root",
    checks: [
      { id: "no-amiodarone", text: "No amiodarone with the long QT on the chart (Brilakis).", lessonId: ANTIARRHYTHMICS },
      { id: "no-flecainide", text: "No flecainide with structural heart disease (Oxford).", lessonId: ANTIARRHYTHMICS },
      { id: "cardioversion", text: "AF with compromise: synchronised cardioversion under sedation (200 J biphasic or 360 J monophasic for severe compromise), with heparin.", lessonId: ARRHYTHMIA },
    ],
  },
];
