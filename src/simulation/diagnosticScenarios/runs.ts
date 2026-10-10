// ---------------------------------------------------------------------------
// Filling, streaming, catheter size and run mechanics (diag-injection-run-quality).
//
//   diag-streaming-weak-injection  a normal study in which a small or slow push
//                                  streams and does not reflux, so the run is
//                                  not read; a firm push fills the artery for
//                                  about three beats with reflux; a JR4 that
//                                  rides into the conus is withdrawn before any
//                                  puff; a non-selective right sinus injection
//                                  compared with the selective RCA run
//                                  (pm-acquiring#5, pm-interpreting#3, the
//                                  diagnostic part)
//   diag-high-flow-as-streaming    severe aortic stenosis on a TAVI work-up: a
//                                  5 Fr catheter cannot fill the high-flow left
//                                  coronary, which streams like disease; a
//                                  larger lumen and a firm push fill it
//                                  (pm-interpreting#3, cp-complex-patients#7,
//                                  the diagnostic part)
//   diag-4fr-ectatic               a large ectatic RCA that a small diagnostic
//                                  catheter cannot fill (the lab's smallest
//                                  lumen is 5 Fr: no 4 Fr inner diameter has
//                                  been sourced); a larger lumen fills it
//   diag-short-lm-superselective   a short left main: the usual JL enters the
//                                  LAD, so its runs (and its test puff) fill the
//                                  LAD alone and the circumflex looks absent;
//                                  one size larger shows the circumflex
//   diag-run-mechanics             recording a run: pedal first, inject after
//                                  1-2 seconds, breath held, no panning, the
//                                  cine rate, and filming until the distal bed
//                                  has filled (pm-acquiring#5, pm-acquiring#4
//                                  for the frame rate and field)
//   diag-qfr-acquisition           an intermediate LAD lesion filmed so that
//                                  angiography-derived FFR stays possible:
//                                  nitrate, two separated projections without
//                                  foreshortening or overlap, at least 12.5
//                                  frames per second, brisk injections, no
//                                  panning or zooming (pm-physiology#11's
//                                  angiographic part: two views apart;
//                                  cp-cto-strategy#8's orthogonal views)
//
// The mechanics are elsewhere: the syringe through the catheter's lumen
// (src/simulation/injection.ts, the lumen from the catheter's size,
// src/data/catheters.ts catheterFrench), the mixing at the ostium and the
// transport along the tree (src/render/xray/contrastTransport.ts), the
// patient's live coronary flow (PatientEngine.coronaryFlowScale) and the run
// analysis (src/simulation/imaging/runQuality.ts), which the session
// (src/ui/sim/labSession.ts) runs after every push and every cine run.
//
// The high resting flow of these patients is not something the patient engine
// models (its coronary demand follows the rate-pressure product, not the
// stenotic valve or the size of an ectatic artery), so it is a start state of
// the scenario: RUN_SETUPS below multiplies the engine's live flow scale on the
// named side. The factors are MODEL PARAMETERS
// (docs/realism/facts/pkg-diag-injection-run-quality.md); the module text
// names the states (Brilakis's causes of incomplete opacification: small,
// especially 4 Fr, and side-hole catheters, large or ectatic arteries, poor
// engagement, high-flow states such as severe aortic stenosis, a weak
// injection; pm-interpreting-pitfalls, 09-interpreting.ts:329, and
// pm-acquiring-cine, 08-acquiring.ts:580). Chart values are scenario data, not
// sourced facts.
//
// title names the scenario where the lessons and the case library list it;
// caseName is the case's name in the lab and states the presentation only.
// This pack imports types only.
// ---------------------------------------------------------------------------

import type { DiagScenario } from "./index";

/** How a run scenario starts beyond its chart (read by the diagnostic lab session). Scenario data. */
export interface RunSetup {
  /** the catheter at the root when the case opens (a catalogue id) */
  catheterId?: string;
  /**
   * The patient's resting coronary flow over the lab's standard tree, per side: the session multiplies the engine's
   * live flow scale by it when it passes the flow to the image and to the run analysis. MODEL PARAMETERS.
   */
  flowScale?: { left?: number; right?: number };
}

/**
 * Resting coronary flow in severe aortic stenosis over the standard tree's (MODEL PARAMETER): Brilakis lists high
 * coronary flow in severe aortic stenosis among the causes of incomplete opacification (module text) without a
 * figure; 1.4 is chosen so that the 5 Fr lumen at the hand's largest force streams and a 6 Fr diagnostic lumen with a
 * firm push does not, with a margin either side of the streaming threshold for a seat that captures from 0.87 to all
 * of the jet (streaming index 0.65-0.71 and 0.28-0.37; docs/realism/facts/pkg-diag-injection-run-quality.md;
 * src/ui/sim/runQuality.session.test.ts drives both).
 */
export const MP_AS_FLOW_SCALE = 1.4;
/**
 * Flow of a large ectatic RCA over the standard tree's RCA (MODEL PARAMETER): the render tree draws no ectasia, so a
 * larger artery's larger flow is given here; large or ectatic arteries are on Brilakis's list of causes of incomplete
 * filling (module text).
 */
export const MP_ECTATIC_RCA_FLOW_SCALE = 1.8;

/** The start states, by scenario id. */
export const RUN_SETUPS: Readonly<Record<string, RunSetup>> = {
  "diag-streaming-weak-injection": { catheterId: "JL4" },
  "diag-high-flow-as-streaming": { catheterId: "JL4-5F", flowScale: { left: MP_AS_FLOW_SCALE, right: MP_AS_FLOW_SCALE } },
  "diag-4fr-ectatic": { catheterId: "JR4-5F", flowScale: { right: MP_ECTATIC_RCA_FLOW_SCALE } },
  "diag-short-lm-superselective": { catheterId: "JL4" },
  "diag-run-mechanics": { catheterId: "JL4" },
  "diag-qfr-acquisition": { catheterId: "JL4" },
};

/**
 * The scenarios in which a Judkins left seated in a short left main enters a branch (src/simulation/engagement.ts
 * shortLmBranch), so that the session's classifier names the branch and the injection fills it alone.
 */
export const SHORT_LM_CLASSIFIER_SCENARIOS: readonly string[] = ["diag-short-lm-superselective"];

const ACQUIRING = { id: "pm-acquiring", title: "Acquiring the angiogram" };
const INTERPRETING = { id: "pm-interpreting", title: "Interpreting the angiogram" };
const COMPLEX = { id: "cp-complex-patients", title: "Cardiogenic shock, cardiac arrest and TAVI patients" };
const PHYSIOLOGY = { id: "pm-physiology", title: "Coronary physiology" };

export const scenarios: DiagScenario[] = [
  // pm-acquiring#5 and pm-interpreting#3 (the diagnostic part): fill the artery or call the run non-diagnostic.
  {
    id: "diag-streaming-weak-injection",
    title: "Runs that stream: fill the artery or call it non-diagnostic",
    caseName: "Exertional chest pain, femoral study",
    indication: "SA",
    brief:
      "A 61-year-old man has exertional chest pain and a positive exercise test. He is having diagnostic angiography from the right femoral artery. A JL4 is at the aortic root. Film the left and right coronaries, and for each run decide whether it can be read. Before you finish, compare a non-selective injection in the right sinus with the selective RCA run.",
    lessonIds: ["pm-acquiring-cine", "pm-interpreting-pitfalls", "pm-interpreting-anomalies"],
    module: ACQUIRING,
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Exertional chest pain, femoral study" },
    lesions: [{ vessel: "LAD", position: 0.45, severity: 60, kind: "moderate-stenosis", lengthMm: 10, role: "target" }],
    events: [],
    chart: {
      ageY: 61,
      sex: "M",
      heightCm: 176,
      weightKg: 84,
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
      { id: "fill", text: "Each left run filled the artery for about 3 beats with reflux into the root (Oxford: typically 5-10 mL left, 3-5 mL right).", lessonId: "pm-acquiring-cine" },
      { id: "not-graded", text: "No stenosis graded on a run that streamed or did not reflux; such a run repeated with a firmer push or declared non-diagnostic.", lessonId: "pm-interpreting-pitfalls" },
      { id: "conus", text: "A JR4 that rode into the conus withdrawn to the RCA ostium before any injection.", lessonId: "pm-interpreting-pitfalls" },
      { id: "sinus", text: "A non-selective injection in the right sinus compared with the selective RCA run.", lessonId: "pm-interpreting-anomalies" },
    ],
  },

  // pm-interpreting#3 (underfilling in a high-flow patient) and cp-complex-patients#7 (the TAVI patient's diagnostic runs).
  {
    id: "diag-high-flow-as-streaming",
    title: "High coronary flow in severe aortic stenosis: streaming that is not disease",
    caseName: "Breathless on exertion, TAVI work-up",
    indication: "SA",
    brief:
      "An 81-year-old woman with breathlessness on exertion is being worked up for TAVI. She is having coronary angiography from the right radial artery. A 5 Fr JL4 is at the aortic root. Decide, run by run, whether the left coronary is filled well enough to report.",
    lessonIds: ["pm-interpreting-pitfalls", "cp-complex-patients-tavr-before", "pm-acquiring-cine"],
    module: COMPLEX,
    spec: { focus: "left", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", variantCount: [0, 0], nameHint: "Breathless on exertion, TAVI work-up" },
    lesions: [{ vessel: "LAD", position: 0.35, severity: 30, kind: "mild-irregularity" }],
    events: [],
    chart: {
      ageY: 81,
      sex: "F",
      heightCm: 158,
      weightKg: 62,
      egfr: 52,
      echo: {
        lvef: 60,
        valves: [{ valve: "aortic", lesion: "stenosis", severity: "severe" }],
        note: "Severe calcific aortic stenosis. Concentric LV hypertrophy, normal LV function.",
      },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 4 },
        { name: "Furosemide", route: "oral", lastDoseHoursAgo: 4 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "not-disease", text: "The patchy, streaming left coronary not reported as diffuse disease.", lessonId: "pm-interpreting-pitfalls" },
      { id: "lumen", text: "A larger lumen without side holes and a firmer push used to fill it (Brilakis), or the run declared non-diagnostic.", lessonId: "cp-complex-patients-tavr-before" },
      { id: "filled", text: "The final left run full for about 3 beats with reflux into the root.", lessonId: "pm-acquiring-cine" },
    ],
  },

  // pm-interpreting#3 (small catheter, large artery): a large ectatic RCA through a small diagnostic catheter.
  {
    id: "diag-4fr-ectatic",
    title: "A small diagnostic catheter in a large ectatic RCA",
    caseName: "Atypical chest pain, femoral study",
    indication: "SA",
    brief:
      "A 66-year-old man with atypical chest pain had a CT coronary angiogram reporting a large, ectatic right coronary artery. He is having diagnostic angiography from the right femoral artery. A small (5 Fr) JR4 is at the aortic root. Film the right coronary so that it can be read.",
    lessonIds: ["pm-acquiring-cine", "pm-interpreting-morphology"],
    module: ACQUIRING,
    spec: { focus: "right", access: "femoral", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", variantCount: [0, 0], nameHint: "Atypical chest pain, femoral study" },
    lesions: [{ vessel: "RCA", position: 0.5, severity: 25, kind: "mild-irregularity" }],
    // the CT report describes the large artery: a property of the case, held for the whole case
    events: ["large-vessel"],
    chart: {
      ageY: 66,
      sex: "M",
      heightCm: 180,
      weightKg: 92,
      egfr: 74,
      echo: { lvef: 57, note: "Normal LV size and function." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "lumen", text: "The underfilled, streaming RCA filmed again through a larger lumen (a 6 Fr diagnostic catheter or a guide) with a firm push, not reported from the small catheter's runs.", lessonId: "pm-acquiring-cine" },
      { id: "haze", text: "The underfilled ectatic segments not read as thrombus or slow flow.", lessonId: "pm-interpreting-morphology" },
    ],
  },

  // pm-interpreting pitfalls: the short left main, where the usual JL fills only the LAD.
  {
    id: "diag-short-lm-superselective",
    title: "The missing circumflex of a short left main",
    caseName: "Stable angina, radial study",
    indication: "SA",
    brief:
      "A 58-year-old woman has stable angina. She is having diagnostic angiography from the right radial artery. A JL4 is at the aortic root. Account for every territory before you finish.",
    lessonIds: ["pm-interpreting-pitfalls", "pm-engaging-left"],
    module: INTERPRETING,
    spec: { focus: "left", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", forceVariants: ["short-lm"], variantCount: [0, 0], nameHint: "Stable angina, radial study" },
    lesions: [{ vessel: "LCx", position: 0.4, severity: 50, kind: "moderate-stenosis", lengthMm: 8 }],
    events: [],
    chart: {
      ageY: 58,
      sex: "F",
      heightCm: 163,
      weightKg: 70,
      egfr: 88,
      echo: { lvef: 61, note: "Normal LV size and function." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }],
      allergies: { contrast: "none" },
      pregnancy: "test-negative",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "not-occluded", text: "The circumflex not called absent or occluded from the LAD-only runs.", lessonId: "pm-interpreting-pitfalls" },
      { id: "size-up", text: "One size larger JL (or a withdrawal to the ostium) used to film the circumflex (Oxford).", lessonId: "pm-engaging-left" },
    ],
  },

  // pm-acquiring#5: the mechanics of recording a run (and pm-acquiring#4's frame rate and field).
  {
    id: "diag-run-mechanics",
    title: "Recording a run: pedal, push, breath-hold and panning",
    caseName: "Chest pain on exertion, radial study",
    indication: "SA",
    brief:
      "A 55-year-old man has exertional chest pain. He is having diagnostic angiography from the right radial artery. A JL4 is at the aortic root. Frame the catheter, press the cine pedal, inject after a second or two, keep the breath held and the table still, and film until the distal vessel has filled.",
    lessonIds: ["pm-acquiring-cine"],
    module: ACQUIRING,
    spec: { focus: "left", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Chest pain on exertion, radial study" },
    lesions: [{ vessel: "LCx", position: 0.5, severity: 55, kind: "moderate-stenosis", lengthMm: 9 }],
    events: [],
    chart: {
      ageY: 55,
      sex: "M",
      heightCm: 178,
      weightKg: 86,
      egfr: 90,
      echo: { lvef: 60, note: "Normal LV size and function." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "pedal-first", text: "Each run started on the pedal with the push 1-2 seconds later (Oxford).", lessonId: "pm-acquiring-cine" },
      { id: "breath", text: "The breath held through each run.", lessonId: "pm-acquiring-cine" },
      { id: "no-panning", text: "No panning across the segment to be graded (Brilakis).", lessonId: "pm-acquiring-cine" },
      { id: "distal", text: "Each run filmed until the distal bed had filled.", lessonId: "pm-acquiring-cine" },
    ],
  },

  // pm-physiology (angiography-derived FFR) and the two separated views of cp-cto-strategy#8 and pm-physiology#11.
  {
    id: "diag-qfr-acquisition",
    title: "Filming an intermediate lesion for angiography-derived FFR",
    caseName: "Stable angina, femoral study",
    indication: "SA",
    brief:
      "A 64-year-old man has stable angina and an intermediate mid-LAD narrowing on CT. He is having diagnostic angiography from the right femoral artery. A JL4 is at the aortic root. Film the LAD so that an angiography-derived FFR could be computed from your runs.",
    lessonIds: ["pm-physiology-derived", "pm-acquiring-views"],
    module: PHYSIOLOGY,
    spec: { focus: "left", access: "femoral", rootSize: "normal", dominance: "right", pathology: "moderate-stenosis", variantCount: [0, 0], nameHint: "Stable angina, femoral study" },
    lesions: [{ vessel: "LAD", position: 0.4, severity: 60, kind: "moderate-stenosis", lengthMm: 12, role: "target" }],
    events: [],
    chart: {
      ageY: 64,
      sex: "M",
      heightCm: 174,
      weightKg: 82,
      egfr: 81,
      echo: { lvef: 59, note: "Normal LV size and function." },
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
      { id: "nitrate", text: "Intracoronary nitrate given after the first projection (FAVOR II Europe-Japan).", lessonId: "pm-physiology-derived" },
      { id: "two-views", text: "Two projections of the lesion with minimal foreshortening and overlap.", lessonId: "pm-physiology-derived" },
      { id: "acquisition", text: "At least 12.5 frames per second, a brisk continuous injection, and no zooming or table movement during the runs.", lessonId: "pm-physiology-derived" },
    ],
  },
];
