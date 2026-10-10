// ---------------------------------------------------------------------------
// The drug scenarios (diag-lab-drugs): intracoronary nitrate dosed by the
// learner from the pressure, and the patients in whom it goes wrong.
//
//   diag-nitrate-dose-by-pressure  a short, slight woman with a small
//                                  non-dominant RCA: nitrate before the runs,
//                                  dosed from the systolic pressure, and a JR4
//                                  that ventricularises the RCA (catheter-tip
//                                  spasm) (pm-acquiring#0, pm-acquiring#1,
//                                  pm-interpreting#8)
//   diag-pde5-patient              tadalafil 30 hours ago: inside its 48-hour
//                                  window although past the 24 hours of the
//                                  other PDE-5 inhibitors (pm-lab-drugs#1)
//   diag-nitrate-hypotension       an inferior STEMI with right ventricular
//                                  involvement after thrombolysis: nitrate is
//                                  withheld, and a fall after it is treated
//                                  with saline, time and a pressor
//                                  (cm-patient-complications#1, #10)
//   diag-nitrate-on-infusion       a patient already on an IV nitrate
//                                  infusion, whose response to a bolus is
//                                  blunted (pm-interpreting#8)
//
// The rules these scenarios teach are sourced in the module text the lessons
// carry (src/content/manual/pci-manual/04-lab-drugs.ts): the dose by systolic
// pressure (Brilakis 6.3, line 251), the cautions (Brilakis 3.2 and 6.3,
// lines 308-312: hypotension or hypovolaemia, RV infarction, a PDE-5 inhibitor
// within 24 h or 48 h for tadalafil, HOCM, high or repeated doses), the two
// ways to give the bolus and the blunted response on an infusion (line 260),
// and nitrate hypotension treated with no more nitrate, saline, time and a
// vasopressor (lines 319-323). Chart values (age, size, renal function, drug
// timings, the infusion rate) are scenario data; the infusion rate lies inside
// Brilakis's IV range (10 µg/min rising to at most 200 µg/min, line 254).
//
// The lab session's drug module (src/ui/sim/modules/drugs.ts) reads the facts
// below that a chart cannot carry (an RV infarction or hypovolaemia on the
// history) and starts the chart's nitrate infusion.
//
// This pack imports types only, as every pack does (index.ts).
// ---------------------------------------------------------------------------

import type { DiagScenario } from "./index";

/** History a chart cannot carry, which the drug module passes to the attending's nitrate cautions. */
export type DrugScenarioFact = "rv-infarction" | "hypovolaemia";

/** How a drug scenario starts, beyond its chart and script (read by src/ui/sim/modules/drugs.ts). */
export interface DrugSetup {
  facts?: DrugScenarioFact[];
}

/** The start facts, by scenario id. */
export const drugSetups: Readonly<Record<string, DrugSetup>> = {
  "diag-nitrate-hypotension": { facts: ["rv-infarction"] },
};

/**
 * Seconds a catheter-tip spasm event is held once the RCA trace has ventricularised or damped
 * (MODEL PARAMETER: the 1-2 minute wait after nitrate, 04-lab-drugs.ts:251, with time to re-engage
 * and repeat the view).
 */
export const MP_TIP_SPASM_HOLD_S = 300;

export const scenarios: DiagScenario[] = [
  // pm-acquiring#0, pm-acquiring#1 (the catheter-tip variant), pm-interpreting#8: nitrate dosed by the
  // pressure before the runs, and a JR4 that ventricularises a small non-dominant RCA.
  {
    id: "diag-nitrate-dose-by-pressure",
    title: "Intracoronary nitrate: dose it by the pressure",
    caseName: "Chest tightness on exertion, radial study",
    indication: "SA",
    brief:
      "A 48-year-old woman of short, slight build has chest tightness on exertion and is having diagnostic angiography from the right radial artery. The JL is at the root. Give intracoronary nitrate before the runs: choose the dose from the monitor, order it from the team and give it yourself.",
    lessonIds: ["pm-acquiring-test-nitrate", "pm-lab-drugs-nitrates", "pm-interpreting-spasm"],
    module: { id: "pm-acquiring", title: "Acquiring the angiogram" },
    spec: { focus: "both", access: "radial-right", rootSize: "small", dominance: "left", pathology: "mild-irregularity", variantCount: [0, 0], nameHint: "Chest tightness on exertion, radial study" },
    lesions: [{ vessel: "LAD", position: 0.35, severity: 30, kind: "mild-irregularity" }],
    events: [],
    chart: {
      ageY: 48,
      sex: "F",
      heightCm: 152,
      weightKg: 50,
      egfr: 95,
      echo: { lvef: 62, note: "Normal LV size and function. No outflow tract obstruction." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "test-negative",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    script: [
      // a JR seated deep in the small non-dominant RCA whose trace ventricularises or damps: catheter-tip
      // spasm (the patient engine narrows the ostium with the tip's wall contact, responses.ts, and
      // nitrate relieves it). A deep seat, not the passing transient of a tip entering the ostium.
      { id: "tip-spasm", when: { engagement: ["deep-rca"], tipState: ["ventricularised", "damped"] }, do: [{ kind: "raise", event: "ostial-spasm", hold: MP_TIP_SPASM_HOLD_S }] },
    ],
    checks: [
      { id: "dose-band", text: "Nitrate dose matched to the systolic pressure: 200 µg above 120 mmHg, 100 µg at 100-120 mmHg, 50 µg or none below 100 (Brilakis 6.3).", lessonId: "pm-lab-drugs-nitrates" },
      { id: "free-trace", text: "No intracoronary drug or contrast through a damped or ventricularised trace.", lessonId: "pm-acquiring-test-nitrate" },
      { id: "wait", text: "The first cine run recorded 1-2 minutes after the nitrate.", lessonId: "pm-acquiring-test-nitrate" },
      { id: "tip-spasm", text: "A ventricularised RCA trace: withdrawn, re-engaged gently and coaxially, nitrate given with a free trace, and an image stored that shows the ostium open, so no ostial stenosis is reported.", lessonId: "pm-interpreting-spasm" },
    ],
  },

  // pm-lab-drugs#1: tadalafil inside its 48-hour window.
  {
    id: "diag-pde5-patient",
    title: "Tadalafil yesterday: is nitrate safe?",
    caseName: "Stable angina, elective study",
    indication: "SA",
    brief:
      "A 59-year-old man with stable angina and a positive stress test is having an elective diagnostic angiogram from the right radial artery. His medicines are on the chart; ask about any not listed there before you give a vasodilator.",
    lessonIds: ["pm-lab-drugs-nitrates", "pm-planning-preparation"],
    module: { id: "pm-lab-drugs", title: "Sedation, vasodilators, pressors, antiarrhythmics and contrast" },
    spec: { focus: "both", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Stable angina, elective study" },
    lesions: [{ vessel: "LAD", position: 0.3, severity: 60, kind: "moderate-stenosis" }],
    events: ["pde5-recent"],
    chart: {
      ageY: 59,
      sex: "M",
      heightCm: 177,
      weightKg: 84,
      egfr: 84,
      echo: { lvef: 58, note: "Normal LV size and function." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Tadalafil", drugId: "tadalafil", route: "oral", lastDoseHoursAgo: 30 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "no-nitrate", text: "No nitrate within the PDE-5 inhibitor's window: tadalafil 48 hours, sildenafil, vardenafil and avanafil 24 hours (Brilakis 3.2).", lessonId: "pm-lab-drugs-nitrates" },
      { id: "asked", text: "PDE-5 inhibitors asked about before the first vasodilator.", lessonId: "pm-planning-preparation" },
      { id: "hypotension", text: "If nitrate was given: no more nitrate, saline, time, and a vasopressor if the fall was severe or persisted.", lessonId: "pm-lab-drugs-nitrates" },
    ],
  },

  // cm-patient-complications#1 and #10: an inferior STEMI with right ventricular involvement, after
  // thrombolysis (the RCA open with a severe residual narrowing, so no thrombotic occlusion is drawn).
  {
    id: "diag-nitrate-hypotension",
    title: "The pressure falls after nitrate",
    caseName: "Inferior infarction after lysis, transfer for angiography",
    indication: "STEMI",
    brief:
      "A 66-year-old man had an inferior STEMI and was given thrombolysis at his local hospital three hours ago; his pain has settled. The presenting ECG showed ST elevation in II, III and aVF and in the right-sided lead V4R. He has been transferred for angiography from the right femoral artery with consent for PCI. Watch the pressure with every drug you give.",
    lessonIds: ["cm-patient-complications-hypotension", "pm-lab-drugs-nitrates"],
    module: { id: "cm-patient-complications", title: "Hypotension, arrhythmia, radiation, kidneys and bleeding" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "severe-stenosis", variantCount: [0, 0], nameHint: "Inferior infarction after lysis, transfer for angiography" },
    lesions: [{ vessel: "RCA", position: 0.08, severity: 80, kind: "severe-stenosis", role: "target" }],
    events: ["stemi"],
    chart: {
      ageY: 66,
      sex: "M",
      heightCm: 174,
      weightKg: 80,
      egfr: 72,
      echo: { note: "Bedside echo at the local hospital: inferior hypokinesia, dilated hypokinetic right ventricle, no effusion." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Clopidogrel", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Tenecteplase", route: "IV", lastDoseHoursAgo: 3 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    checks: [
      { id: "withhold", text: "No nitrate in suspected right ventricular infarction (Brilakis 3.2 and 6.3).", lessonId: "pm-lab-drugs-nitrates" },
      { id: "treat", text: "A fall after a vasodilator treated with no more vasodilator, saline and time, and a vasopressor (phenylephrine or noradrenaline) if severe or persistent.", lessonId: "cm-patient-complications-hypotension" },
      { id: "other-causes", text: "If the pressure does not recover, other causes looked for, bleeding first.", lessonId: "cm-patient-complications-hypotension" },
    ],
  },

  // pm-interpreting#8 (the optional patient on an IV nitrate infusion): a blunted response.
  {
    id: "diag-nitrate-on-infusion",
    title: "On a nitrate infusion: a blunted bolus",
    caseName: "Rest pain on the ward, urgent angiogram",
    indication: "UA",
    brief:
      "A 63-year-old woman admitted with rest pain is having an urgent diagnostic angiogram from the right radial artery. Her ward drugs are on the chart.",
    lessonIds: ["pm-lab-drugs-nitrates"],
    module: { id: "pm-lab-drugs", title: "Sedation, vasodilators, pressors, antiarrhythmics and contrast" },
    spec: { focus: "both", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "severe-stenosis", variantCount: [0, 0], nameHint: "Rest pain on the ward, urgent angiogram" },
    lesions: [{ vessel: "LAD", position: 0.3, severity: 85, kind: "severe-stenosis" }],
    events: ["nste-acs"],
    chart: {
      ageY: 63,
      sex: "F",
      heightCm: 163,
      weightKg: 70,
      egfr: 70,
      echo: { lvef: 55, note: "Mild anterior hypokinesia." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 4 },
        { name: "Ticagrelor", route: "oral", lastDoseHoursAgo: 4 },
        { name: "GTN infusion", drugId: "gtn", dose: "50 µg/min", route: "IV" },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    checks: [
      { id: "infusion", text: "The IV nitrate infusion noticed on the chart, and a smaller response to the intracoronary bolus expected (Oxford).", lessonId: "pm-lab-drugs-nitrates" },
      { id: "dose-band", text: "The bolus still dosed by the systolic pressure, and not repeated into a falling pressure.", lessonId: "pm-lab-drugs-nitrates" },
    ],
  },
];
