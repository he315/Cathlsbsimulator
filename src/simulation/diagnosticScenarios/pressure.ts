// ---------------------------------------------------------------------------
// The pressure scenarios (diag-pressure-transducer): one true trace from the
// patient engine's tip chamber and transducer, and what makes it look wrong.
//
//   diag-damping-causes          an ostial left main lesion that damps the trace
//                                each time the JL4 enters, and a JR4 that sits
//                                deep in the RCA and ventricularises it
//                                (pm-engaging#0, cp-left-main#5)
//   diag-aspiration-failures     a catheter at the root that will not aspirate:
//                                it picked up thrombus from the sheath
//                                (pm-engaging#1, pm-to-the-root#8)
//   diag-transducer-faults       air in the line, then a transducer left low,
//                                with the tip free (pm-engaging#0)
//   diag-as-pulse-not-damping    severe aortic stenosis: a slow, small pulse
//                                with the tip free (pm-engaging#0,
//                                hb-specific-conditions#8)
//
// The rules these scenarios teach are sourced in the module text the lessons
// carry (src/content/manual/pci-manual/07-engaging.ts: the damping steps,
// Brilakis 5.6; the catheter that will not aspirate, Brilakis 5.4.3.4; the two
// traps of aortic stenosis and side holes, Oxford ch 6). Chart values (age,
// size, renal function, drug timings) are scenario data. The start states
// below (valve area, a thrombus in the sheath, the first catheter) are MODEL
// PARAMETERS of the scenarios; the lab session applies them (src/ui/sim/
// labSession.ts pressureSetupFor).
//
// This pack imports types only, as every pack does (index.ts).
// ---------------------------------------------------------------------------

import type { DiagScenario } from "./index";
import type { TransducerFault } from "../patient/transducer";

/** How a pressure scenario's lab starts, beyond its chart and script (read by the lab session). */
export interface PressureSetup {
  /** the catheter at the root when the case opens (else the case's recommended catheter) */
  catheterId?: string;
  /**
   * Where the simple model parks the catheter at the start, in its own insertion units (negative is
   * withdrawn from the natural seat): above the sinus rather than seated, so the case opens with the
   * tip free. MODEL PARAMETER of the scenario; the rod mechanics starts from its own position.
   */
  parkedInsertion?: number;
  /** effective aortic valve orifice area, cm² (MODEL PARAMETER of the scenario) */
  aorticValveAreaCm2?: number;
  /**
   * Thrombus in the sheath: every catheter passed through it until the side arm has been aspirated
   * comes out plugged (the module text: thrombus "usually comes from the sheath", Brilakis 5.4).
   */
  sheathThrombus?: boolean;
  /** the catheter at the root is already plugged (it came up through the thrombus) */
  plugged?: boolean;
  /** faults in the pressure line at the start */
  faults?: TransducerFault[];
  /**
   * The patient's resting heart rate, bpm, in place of the seeded draw: for a scenario about the line
   * whose seeded patient would otherwise sit near the bradycardia threshold (MODEL PARAMETER).
   */
  heartRateBpm?: number;
}

/** The start states, by scenario id. */
export const pressureSetups: Readonly<Record<string, PressureSetup>> = {
  "diag-damping-causes": { catheterId: "JL4", parkedInsertion: -12 },
  "diag-aspiration-failures": { catheterId: "JR4", parkedInsertion: -12, sheathThrombus: true, plugged: true },
  // the JL4 parked free in the root, as the brief says (the same MODEL PARAMETER as diag-damping-causes);
  // the seeded patient's heart rate (51/min) sits on the bradycardia threshold, so it is set at 70/min,
  // the centre of generatePatient's heart-rate line (patient.ts; MODEL PARAMETER)
  "diag-transducer-faults": { catheterId: "JL4", parkedInsertion: -12, heartRateBpm: 70 },
  // 0.7 cm², inside the severe band of the module text (a valve area of 1.0 cm² or less, ESC/EACTS,
  // src/content/manual/cath-handbook/05-specific-conditions.ts); the value itself is a MODEL PARAMETER.
  // The JL4 parked free in the root, so the slow pulse is read with the tip free (MODEL PARAMETER).
  "diag-as-pulse-not-damping": { catheterId: "JL4", parkedInsertion: -12, aorticValveAreaCm2: 0.7 },
};

export const scenarios: DiagScenario[] = [
  // pm-engaging#0 (and cp-left-main#5): a damped trace and its causes; the ostial left main lesion
  // damps on every entry, a deep right seat ventricularises.
  {
    id: "diag-damping-causes",
    title: "Damping: name it and work the steps",
    caseName: "Exertional angina, first angiogram",
    indication: "SA",
    brief:
      "A 64-year-old man with exertional angina and a positive stress test is having his first diagnostic angiogram from the right femoral artery. The JL4 is in the aortic root with the wire out. Read the trace before every injection.",
    lessonIds: ["pm-engaging-trace", "pm-engaging-damping"],
    module: { id: "pm-engaging", title: "Engaging the coronary arteries" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "left-main", variantCount: [0, 0], nameHint: "Exertional angina, first angiogram" },
    lesions: [{ vessel: "LM", position: 0.02, severity: 75, kind: "left-main", lengthMm: 5 }],
    events: [],
    chart: {
      ageY: 64,
      sex: "M",
      heightCm: 175,
      weightKg: 82,
      egfr: 78,
      echo: { lvef: 58, note: "Normal LV size and function." },
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
      { id: "no-damped-injection", text: "No injection into a damped or ventricularised trace.", lessonId: "pm-engaging-damping" },
      { id: "steps", text: "Damping worked in order: withdraw, aspirate, check the transducer, screen for a kink, then remove under suction if nothing restores it.", lessonId: "pm-engaging-damping" },
      { id: "outside", text: "The ostial left main lesion imaged with short injections from just outside the ostium, not with the catheter seated across it.", lessonId: "pm-engaging-damping" },
      { id: "deep-rca", text: "A JR4 that ventricularises deep in the RCA withdrawn until the aortic trace returns before any injection.", lessonId: "pm-engaging-damping" },
    ],
  },

  // pm-engaging#1, pm-to-the-root#8: a catheter that will not aspirate.
  {
    id: "diag-aspiration-failures",
    title: "A catheter that will not aspirate",
    caseName: "Breathlessness on exertion, femoral study",
    indication: "SA",
    brief:
      "A 70-year-old woman with exertional breathlessness is having diagnostic angiography from the right femoral artery. The sheath was placed some minutes ago. The JR4 has just reached the aortic root and the wire is out: aspirate before you connect.",
    lessonIds: ["pm-engaging-damping", "pm-to-the-root-advance"],
    module: { id: "pm-engaging", title: "Engaging the coronary arteries" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Breathlessness on exertion, femoral study" },
    events: [],
    chart: {
      ageY: 70,
      sex: "F",
      heightCm: 162,
      weightKg: 70,
      egfr: 64,
      echo: { lvef: 55, note: "Normal LV function." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 4 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "no-flush", text: "Nothing flushed, injected or wired through a catheter that will not aspirate.", lessonId: "pm-engaging-damping" },
      { id: "ease-back", text: "Eased back a few millimetres and aspirated again before assuming a plug.", lessonId: "pm-to-the-root-advance" },
      { id: "suction", text: "The plugged catheter removed under continuous suction, and the sheath aspirated before the next catheter.", lessonId: "pm-engaging-damping" },
      { id: "no-air", text: "No air drawn in by pulling hard on a blocked catheter, or all of it cleared before the next injection.", lessonId: "pm-to-the-root-advance" },
    ],
  },

  // pm-engaging#0: transducer faults damp every trace while the tip is free.
  {
    id: "diag-transducer-faults",
    title: "Every trace looks wrong: check the line",
    caseName: "Atypical chest pain, outpatient study",
    indication: "SA",
    brief:
      "A 55-year-old man with atypical chest pain is having an outpatient diagnostic angiogram from the right radial artery. The line was set up in a hurry. The JL4 is in the root.",
    lessonIds: ["pm-engaging-trace"],
    module: { id: "pm-engaging", title: "Engaging the coronary arteries" },
    spec: { focus: "left", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", variantCount: [0, 0], nameHint: "Atypical chest pain, outpatient study" },
    events: [],
    chart: {
      ageY: 55,
      sex: "M",
      heightCm: 180,
      weightKg: 88,
      egfr: 90,
      echo: { lvef: 60, note: "Normal LV size and function." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 2 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    script: [
      // air in the transducer dome from the start (MODEL PARAMETER: 0.1 mL, transducer.ts MP_FAULT_AIR_ML)
      { id: "air-in-line", when: { afterS: 0 }, do: [{ kind: "transducer", airMl: 0.1 }] },
      // after the first injection the transducer is found knocked low on its pole (MODEL PARAMETER: 15 cm, MP_FAULT_LOW_CM)
      { id: "transducer-low", when: { firstInjection: "any", afterS: 30 }, do: [{ kind: "transducer", heightCm: -15 }] },
    ],
    checks: [
      { id: "line-first", text: "A trace damped with the tip free in the root traced to the line: fast flush, then flush the air out and re-prime.", lessonId: "pm-engaging-trace" },
      { id: "level", text: "A pressure that reads high with a normal waveform traced to the transducer height, and the transducer re-levelled.", lessonId: "pm-engaging-trace" },
    ],
  },

  // pm-engaging#0, hb-specific-conditions#8: parvus et tardus is not damping.
  {
    id: "diag-as-pulse-not-damping",
    title: "Aortic stenosis: a slow pulse, not damping",
    caseName: "Breathlessness before valve surgery",
    indication: "SA",
    brief:
      "A 76-year-old man with exertional breathlessness and a heart murmur is having coronary angiography before valve surgery. The echo is on the chart.",
    lessonIds: ["pm-engaging-trace", "hb-specific-conditions-as"],
    module: { id: "hb-specific-conditions", title: "Valves, pericardium, cardiomyopathy and pulmonary embolism" },
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Breathlessness before valve surgery" },
    events: ["aortic-stenosis"],
    chart: {
      ageY: 76,
      sex: "M",
      heightCm: 172,
      weightKg: 78,
      egfr: 62,
      echo: { lvef: 55, valves: [{ valve: "aortic", lesion: "stenosis", severity: "severe" }], note: "Severe calcific aortic stenosis. Normal LV systolic function." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 4 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "baseline", text: "The aortic trace recorded in the root before engaging, and each engaged trace judged against it.", lessonId: "pm-engaging-trace" },
      { id: "not-damping", text: "The slow, small pulse with the tip free recognised as aortic stenosis, not damping; no needless disengagement.", lessonId: "hb-specific-conditions-as" },
    ],
  },
];
