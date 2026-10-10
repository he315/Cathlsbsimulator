// ---------------------------------------------------------------------------
// Spasm (diag-spasm-states): catheter-tip spasm, focal coronary spasm and a
// fixed narrowing that looks like it, and radial artery spasm as a live state.
//
//   diag-catheter-tip-spasm-rca    a JR4 in the small non-dominant RCA of a
//                                  short, slight woman: the trace
//                                  ventricularises and then keeps falling, and
//                                  a smooth ostial narrowing appears round the
//                                  tip (pm-interpreting#8, pm-acquiring#1)
//   diag-focal-rca-spasm           a smooth focal mid-RCA narrowing that
//                                  resolves on the same projection after
//                                  intracoronary nitrate (pm-acquiring#1;
//                                  defined in lesions.ts heldScenarios by
//                                  diag-lesion-morphologies, published here)
//   diag-focal-rca-fixed           the same appearance that persists after
//                                  nitrate, so intravascular imaging is asked
//                                  for (pm-acquiring#1, the persistent variant)
//   diag-ostial-lesion-or-spasm    an ostial RCA narrowing that damps the
//                                  catheter: nitrate and a non-selective sinus
//                                  injection before the ostium is judged
//                                  (cp-ostial#7)
//   diag-radial-spasm-entrapment   a small, anxious radial artery after two
//                                  exchanges: the catheter drags and the
//                                  forearm hurts; release it without traction
//                                  (pm-engaging#3)
//   diag-ohca-vasopressor-radial   a resuscitated patient on a noradrenaline
//                                  infusion, radial access: spasm is likely
//                                  (cp-complex-patients#4, the radial part)
//
// The mechanics are elsewhere and come from what the operator does: the
// catheter-tip spasm is the patient engine's (responses.ts TipSpasmModel,
// provoked by the tip's wall contact, larger in a small ostium, relieved by
// the epicardial dilation of intracoronary nitrate) and the image draws it
// round the tip (sceneBuilder.ts SceneInput.spasm); the focal spasm lesion
// relaxes with the same dilation (coronaryTree.ts relaxSpasm); the radial
// spasm is the shared model (src/simulation/access/radialSpasm.ts) hosted by
// the engine for a radial case (PatientEngine.setRadialAccess) and coupled to
// the rod mechanics by the spasm session module
// (src/ui/physics/physicsDevices.ts createSpasmSessionModule), which reads
// the start states below. The rules are the module text's: withdraw, re-engage
// gently and coaxially with a free trace, nitrate by the systolic pressure and
// a 1-2 minute wait, then a run in the same projection (pm-interpreting-spasm,
// pm-acquiring-test-nitrate; Brilakis 5.8 and 6.3); the radial measures and
// never a forceful pull (pm-engaging-spasm, 07-engaging.ts lines 1316-1325).
// Chart values and the start states are scenario data, not sourced facts.
//
// title names the scenario where the lessons and the case library list it;
// caseName is the case's name in the lab and states the presentation only.
// This pack imports types only, and the held scenario from lesions.ts, which
// imports types only too.
// ---------------------------------------------------------------------------

import type { DiagScenario } from "./index";
import { heldScenarios } from "./lesions";

/**
 * How a spasm scenario starts beyond its chart (read by the spasm session module): the radial artery's
 * relaxed diameter, the sheath, the exchanges already made, the artery's tone at the start, and an
 * intravenous vasopressor already running. Scenario data (MODEL PARAMETERS of the case).
 */
export interface SpasmSetup {
  /** relaxed radial artery diameter, mm (replaces the seeded patient's) */
  radialDiamMm?: number;
  /** the sheath in the radial artery (closure.ts SHEATHS id; default the 6 Fr) */
  sheath?: "5" | "6" | "6-thin" | "7";
  /** catheter exchanges already made through the artery */
  exchanges?: number;
  /** the artery's tone at the start, 0..1, and the transient part of it */
  startLevel?: number;
  startImpulse?: number;
  /** an intravenous vasopressor infusion running from the start (µg/min) */
  vasopressor?: { drug: "noradrenaline" | "phenylephrine"; rateUgMin: number };
}

/** The start states, by scenario id. */
export const spasmSetups: Readonly<Record<string, SpasmSetup>> = {
  "diag-radial-spasm-entrapment": { radialDiamMm: 1.9, sheath: "6", exchanges: 2, startLevel: 0.75, startImpulse: 0.2 },
  "diag-ohca-vasopressor-radial": { sheath: "6", vasopressor: { drug: "noradrenaline", rateUgMin: 10 } },
};

/**
 * Seconds a catheter-tip spasm event is held once the RCA trace has ventricularised or damped with the
 * catheter seated deep (MODEL PARAMETER). It is the spasm session module's hold of ostial-spasm
 * (physicsDevices.ts MP_SPASM_MODULE.ostialHoldS reads this value), so the event follows the engine's own
 * spasm: the module raises it again while the engine's catheter-tip spasm on the engaged side stays at its
 * threshold, and it lapses this long after the spasm has gone. A longer script hold would keep the
 * 'withdraw and give nitrate' tip showing after nitrate had relieved the spasm.
 */
export const MP_SPASM_EVENT_HOLD_S = 30;

const INTERPRETING = { id: "pm-interpreting", title: "Interpreting the angiogram" };
const ACQUIRING = { id: "pm-acquiring", title: "Acquiring the angiogram" };
const ENGAGING = { id: "pm-engaging", title: "Engaging the coronary arteries" };
const OSTIAL = { id: "cp-ostial", title: "Ostial lesions" };
const COMPLEX = { id: "cp-complex-patients", title: "Cardiogenic shock, cardiac arrest and TAVI patients" };

/** The focal spasm scenario of diag-lesion-morphologies (held there until the live lab relaxed it with nitrate). */
const focalSpasm = heldScenarios.find((s) => s.id === "diag-focal-rca-spasm")!;

export const scenarios: DiagScenario[] = [
  // pm-interpreting#8, pm-acquiring#1 (the catheter-tip variant): a JR4 that ventricularises a small non-dominant RCA.
  {
    id: "diag-catheter-tip-spasm-rca",
    title: "Catheter-tip spasm in a small RCA",
    caseName: "Atypical chest pain, radial study",
    indication: "SA",
    brief:
      "A 44-year-old woman of short, slight build has atypical chest pain and an equivocal stress test. She is having diagnostic angiography from the right radial artery. The catheter is at the aortic root. Name the trace before every run.",
    lessonIds: ["pm-interpreting-spasm", "pm-acquiring-test-nitrate", "pm-acquiring-anatomy"],
    module: INTERPRETING,
    // a normal root: the small RCA is the left-dominant tree's (the engine's spasm gain reads the ostial
    // radii, not the root), and a JR4 in a small root crams the cusp (store tip.cram at the 4 mm limit),
    // so no aspirate through it would ever return blood and every injection would be refused
    spec: { focus: "right", access: "radial-right", rootSize: "normal", dominance: "left", pathology: "mild-irregularity", variantCount: [0, 0], nameHint: "Atypical chest pain, radial study" },
    lesions: [{ vessel: "LAD", position: 0.4, severity: 25, kind: "mild-irregularity" }],
    events: [],
    chart: {
      ageY: 44,
      sex: "F",
      heightCm: 150,
      weightKg: 48,
      egfr: 98,
      echo: { lvef: 63, note: "Normal LV size and function. No outflow tract obstruction." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }],
      allergies: { contrast: "none" },
      pregnancy: "test-negative",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    script: [
      // seated deep in the small RCA, the trace ventricularises or damps: catheter-tip spasm (the engine narrows
      // the ostium round the tip with the wall contact). A deep seat, not a tip passing the ostium.
      { id: "tip-spasm", when: { engagement: ["deep-rca"], tipState: ["ventricularised", "damped"] }, do: [{ kind: "raise", event: "ostial-spasm", hold: MP_SPASM_EVENT_HOLD_S }] },
    ],
    checks: [
      { id: "no-inject", text: "No injection through the ventricularised or damped catheter.", lessonId: "pm-acquiring-anatomy" },
      { id: "sequence", text: "Withdrawn until the aortic trace returned, re-engaged gently and coaxially with a free trace, nitrate given dosed by the systolic pressure (Brilakis 6.3), and 1-2 minutes waited.", lessonId: "pm-interpreting-spasm" },
      { id: "documented", text: "A run in the same projection stored that shows the ostium open, and no ostial stenosis reported.", lessonId: "pm-acquiring-test-nitrate" },
    ],
  },

  // pm-acquiring#1: the focal mid-RCA spasm, published from lesions.ts heldScenarios.
  focalSpasm,

  // pm-acquiring#1, the persistent variant: the same smooth focal narrowing that does not resolve with nitrate.
  {
    id: "diag-focal-rca-fixed",
    title: "A focal mid-RCA narrowing in rest angina",
    caseName: "Chest pain at rest, radial study",
    indication: "SA",
    brief:
      "A 57-year-old man has had episodes of chest pain at rest over two months. He is having diagnostic angiography from the right radial. Repeat any view you need in the same projection.",
    lessonIds: ["pm-acquiring-test-nitrate", "pm-interpreting-spasm"],
    module: ACQUIRING,
    spec: { focus: "right", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Chest pain at rest, radial study" },
    lesions: [{ vessel: "RCA", position: 0.45, severity: 70, kind: "moderate-stenosis", lengthMm: 6, morphology: "spasm", nitrateResponsive: false, role: "target" }],
    events: [],
    chart: {
      ageY: 57,
      sex: "M",
      heightCm: 175,
      weightKg: 81,
      egfr: 80,
      echo: { lvef: 58, note: "Normal LV size and function." },
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
      { id: "repeat-view", text: "The narrowing filmed again in the same projection after intracoronary nitrate before it was judged.", lessonId: "pm-acquiring-test-nitrate" },
      { id: "imaging", text: "A narrowing that persists after nitrate referred for intravascular imaging (OCT or IVUS) rather than called spasm.", lessonId: "pm-acquiring-test-nitrate" },
    ],
  },

  // cp-ostial#7: an ostial RCA narrowing that damps the catheter; nitrate and a sinus injection before judging.
  {
    id: "diag-ostial-lesion-or-spasm",
    title: "Ostial RCA narrowing: lesion or catheter-tip spasm?",
    caseName: "Exertional angina, femoral study",
    indication: "SA",
    brief:
      "A 68-year-old man has exertional angina despite two drugs. He is having diagnostic angiography from the right femoral artery. The catheter is at the aortic root.",
    lessonIds: ["cp-ostial-assess", "pm-interpreting-spasm"],
    module: OSTIAL,
    spec: { focus: "right", access: "femoral", rootSize: "normal", dominance: "right", pathology: "ostial-rca", variantCount: [0, 0], nameHint: "Exertional angina, femoral study" },
    lesions: [{ vessel: "RCA", position: 0.01, severity: 70, kind: "ostial-rca", lengthMm: 5, nitrateResponsive: false, role: "target" }],
    events: [],
    chart: {
      ageY: 68,
      sex: "M",
      heightCm: 172,
      weightKg: 84,
      egfr: 69,
      echo: { lvef: 55, note: "Mild inferior hypokinesia." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Amlodipine", route: "oral", lastDoseHoursAgo: 3 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    script: [{ id: "tip-spasm", when: { engagement: ["deep-rca"], tipState: ["ventricularised", "damped"] }, do: [{ kind: "raise", event: "ostial-spasm", hold: MP_SPASM_EVENT_HOLD_S }] }],
    checks: [
      { id: "nitrate-first", text: "Nitrate given before the ostium was judged.", lessonId: "cp-ostial-assess" },
      { id: "sinus", text: "With the trace damped, the ostium filmed by a non-selective injection in the sinus, not through the damped catheter.", lessonId: "cp-ostial-assess" },
      { id: "views", text: "The RCA ostium judged in a steep LAO view (with or without caudal angulation), the least foreshortened.", lessonId: "cp-ostial-assess" },
    ],
  },

  // pm-engaging#3: radial artery spasm as a live state, with a catheter gripped after two exchanges.
  {
    id: "diag-radial-spasm-entrapment",
    title: "The catheter that will not come back: radial spasm",
    caseName: "Chest pain, radial study, third catheter",
    indication: "SA",
    brief:
      "A 34-year-old woman, a smoker, very anxious about the procedure, is having diagnostic angiography from the right radial artery for chest pain. Two catheters have already been exchanged through the 6 Fr sheath, and she says her forearm aches. The catheter is in the aortic root.",
    lessonIds: ["pm-engaging-spasm"],
    module: ENGAGING,
    spec: { focus: "right", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", variantCount: [0, 0], nameHint: "Chest pain, radial study, third catheter" },
    lesions: [{ vessel: "RCA", position: 0.4, severity: 25, kind: "mild-irregularity" }],
    events: [],
    chart: {
      ageY: 34,
      sex: "F",
      heightCm: 156,
      weightKg: 52,
      egfr: 104,
      echo: { lvef: 62, note: "Normal LV size and function." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }],
      allergies: { contrast: "none" },
      pregnancy: "test-negative",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "no-traction", text: "No forceful pull on a gripped catheter: Brilakis warns that forceful withdrawal can avulse the radial artery.", lessonId: "pm-engaging-spasm" },
      { id: "measures", text: "Spasm released with the measures: a vasodilator into the artery (intravenously if the side port will not aspirate), more sedation, warmth, a lubricious solution, an upper-arm cuff above systolic for 5 minutes; never lidocaine into the artery.", lessonId: "pm-engaging-spasm" },
      { id: "forearm", text: "The forearm checked at the end of the case.", lessonId: "pm-engaging-spasm" },
    ],
  },

  // cp-complex-patients#4 (the radial part): after resuscitation, on a vasopressor, radial access is likely to spasm.
  {
    id: "diag-ohca-vasopressor-radial",
    title: "On noradrenaline after an arrest: the radial will spasm",
    caseName: "Resuscitated collapse, on noradrenaline",
    indication: "NSTEMI",
    brief:
      "A 61-year-old man collapsed in the street; bystanders started CPR and the ambulance crew restored a circulation after one shock. He is ventilated and needs a noradrenaline infusion for his blood pressure. Intensive care have asked for angiography, which is starting from the right radial artery.",
    lessonIds: ["cp-complex-patients-ohca"],
    module: COMPLEX,
    spec: { focus: "both", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "severe-stenosis", variantCount: [0, 0], nameHint: "Resuscitated collapse, on noradrenaline" },
    lesions: [{ vessel: "LCx", position: 0.4, severity: 80, kind: "severe-stenosis", role: "target" }],
    events: ["post-arrest", "vasopressor", "nste-acs", "ventilated"],
    chart: {
      ageY: 61,
      sex: "M",
      heightCm: 178,
      weightKg: 86,
      egfr: 64,
      echo: { lvef: 45, note: "Bedside echo: mild global hypokinesia, no effusion." },
      drugs: [
        { name: "Noradrenaline infusion", drugId: "noradrenaline", dose: "10 µg/min", route: "IV" },
        { name: "Propofol infusion", route: "IV" },
        { name: "Aspirin", route: "IV" },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      arrestHistory: { rhythm: "vf", witnessed: true, minutesToRosc: 12, note: "Bystander CPR. One shock from the ambulance crew. No ST elevation on the post-resuscitation ECG." },
      consentScope: "diagnostic-and-ad-hoc-pci",
    },
    startAt: "root",
    checks: [
      { id: "access", text: "The high risk of radial spasm on vasopressors after an arrest recognised early, with an early switch from a spasming radial to femoral access under ultrasound, where support may also be needed (Brilakis 4.3 and 24.2).", lessonId: "cp-complex-patients-ohca" },
    ],
  },
];
