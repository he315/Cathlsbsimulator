// ---------------------------------------------------------------------------
// Anatomy variant scenarios (diag-anatomy-variants): one patient each, whose
// engagement problem or reporting trap comes from the anatomy itself.
//
// The anomalies are drawn by the analytic ostia (src/simulation/anatomy.ts),
// the render tree (src/render/xray/coronaryGrowth.ts, coronaryAtlas.ts) and
// the physics lumens taken from it (src/physics/coronaryLumens.ts): a
// circumflex from the right sinus or the proximal RCA running behind the
// aorta, an RCA from the left sinus and a left main from the right sinus
// running between the aorta and the pulmonary trunk, ostia high at the
// sinotubular junction, a large conus with its own ostium beside the RCA's, a
// myocardial bridge on the mid LAD, a fistula from the proximal LAD to the
// pulmonary artery, and a very dilated root. Their geometry is MODEL
// PARAMETERS (named where it is set); what the manuals say about each is
// quoted in pm-interpreting-anomalies and pm-engaging-left, -rca and -fail.
//
// Tip events: in the anomalous-origin cases the script raises
// 'anomalous-origin' for the rest of the case when an injection shows that a
// territory has no vessel in the usual place, or after a non-selective
// injection into the root (how the ostium is found). For the RCA from the
// left sinus and the left main from the right sinus that is any first
// injection: the catheter in the empty sinus finds nothing, and the other
// side's run leaves the territory empty. For the circumflex it is the first
// left injection (the lateral wall is empty) or a root injection; a first RCA
// run fills the circumflex and raises nothing. For high ostia it is a root
// injection only. The script tests the engagement when it evaluates, so a
// root-level trigger also fires if the catheter later sits at sinus level
// after an earlier injection (src/ui/sim/modules/script.ts has no per-
// injection engagement condition). The scenario script module's raises
// export lists the event for the reachability report. The very
// dilated root reports 'dilated-root' through the lab's own context
// (src/ui/lab/diagnosticContext.ts). Chart values are scenario data, not
// sourced facts. The lab requests each scenario answers are named above it.
//
// Engagement mechanics (package notes): the catheter-shape lessons of
// diag-rca-from-left-sinus (an Amplatz engages where a Judkins right fails)
// and diag-high-ostia (the usual shapes do not find a high ostium) come from
// the rod mechanics (diag-rod-physics), where the shape's own curve meets the
// root. The default analytic engagement model (src/simulation/engagement.ts)
// places the tip on a circle at any azimuth the torque gives and any height
// the insertion gives, so there a JR4 turned into the left sinus seats on the
// anomalous RCA and a JL4 withdrawn a little seats on a high left main. The
// anatomy here keeps the analytic model honest otherwise: with the RCA from
// the left sinus the conus stays in the right sinus (anatomy.ts), so an AL1 or
// JL4 aimed at the RCA is not taken for conus over-selection, and a right
// catheter in the empty right sinus finds only the conus.
//
// title names the scenario where the lessons and the case library list it;
// caseName is the case's name in the lab and states the presentation only:
// it never names the anomaly.
// ---------------------------------------------------------------------------

import type { EngagementKind } from "../../types";
import type { DiagScenario, ScenarioAction, ScenarioTrigger } from "./index";

/** Raise the anomalous-origin event for the rest of the case. */
const RAISE_ANOMALY: readonly ScenarioAction[] = [{ kind: "raise", event: "anomalous-origin", hold: "case" }];
/** The engagement kinds of a non-selective injection into the root (a sinus injection or a puff above the sinuses). */
const ROOT_LEVEL: readonly EngagementKind[] = ["ascending-aorta", "sinus-level", "non-selective"];
/** Any first injection: the catheter in the empty sinus finds nothing and the other run leaves a territory empty. */
const ANOMALY_SEEN: ScenarioTrigger = { id: "anomaly-seen", when: { firstInjection: "any" }, do: RAISE_ANOMALY };
/** The first left injection (it leaves the lateral wall empty when the circumflex arises on the right). */
const ANOMALY_LEFT: ScenarioTrigger = { id: "anomaly-left", when: { firstInjection: "left" }, do: RAISE_ANOMALY };
/** A non-selective injection into the root, which shows where the ostia are. */
const ANOMALY_ROOT: ScenarioTrigger = { id: "anomaly-root", when: { firstInjection: "any", engagement: ROOT_LEVEL }, do: RAISE_ANOMALY };

const ANOMALIES = { id: "pm-interpreting", title: "Interpreting the angiogram" };
const ENGAGING = { id: "pm-engaging", title: "Engaging the coronary arteries" };

export const scenarios: DiagScenario[] = [
  // pm-interpreting#9, pm-engaging#6: a circumflex from the right sinus or the proximal RCA (the seed picks which),
  // running behind the aorta; the left injection leaves the lateral wall empty.
  {
    id: "diag-anomalous-cx-retroaortic",
    title: "No vessel to the lateral wall",
    caseName: "Exertional chest tightness, lateral ischaemia on stress testing",
    indication: "SA",
    brief:
      "A 61-year-old man has chest tightness on exertion and a stress perfusion scan that showed lateral ischaemia. He is having diagnostic angiography from the right femoral artery before a decision about revascularisation. Account for every territory before you report.",
    lessonIds: ["pm-interpreting-anomalies", "pm-engaging-left"],
    module: ANOMALIES,
    spec: {
      focus: "both",
      access: "femoral",
      rootSize: "normal",
      dominance: "right",
      pathology: "none",
      variantPool: ["anomalous-lcx-right-sinus", "anomalous-lcx-from-rca"],
      variantCount: [1, 1],
      nameHint: "Exertional chest tightness, lateral ischaemia on stress testing",
    },
    lesions: [],
    events: [],
    chart: {
      ageY: 61,
      sex: "M",
      heightCm: 176,
      weightKg: 84,
      egfr: 82,
      echo: { lvef: 58, note: "Normal LV size and function at rest." },
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
    script: [ANOMALY_LEFT, ANOMALY_ROOT],
    checks: [
      { id: "territory", text: "The empty lateral wall on the left injection noticed, and no circumflex occlusion reported.", lessonId: "pm-interpreting-anomalies" },
      { id: "find", text: "The circumflex found on the right side (faint filling on the RCA run, a right sinus injection, or the dot sign on the ventriculogram).", lessonId: "pm-interpreting-anomalies" },
      { id: "image", text: "The anomalous circumflex engaged without dissection (an Amplatz shape is often needed) and imaged in two views.", lessonId: "pm-engaging-left" },
    ],
  },

  // pm-interpreting#9, pm-engaging#7, pm-engaging#8: an RCA from the left sinus; the right sinus is empty.
  {
    id: "diag-rca-from-left-sinus",
    title: "The RCA that is not in the right sinus",
    caseName: "Inferior ischaemia on stress echo",
    indication: "SA",
    brief:
      "A 57-year-old woman has exertional breathlessness and chest discomfort, with inferior wall ischaemia on stress echo. She is having diagnostic angiography from the right femoral artery. If a catheter does not find an ostium, find the ostium before you change catheters.",
    lessonIds: ["pm-interpreting-anomalies", "pm-engaging-rca", "pm-engaging-fail"],
    module: ENGAGING,
    spec: { focus: "right", access: "femoral", rootSize: "normal", dominance: "right", pathology: "none", forceVariants: ["anomalous-rca-left-sinus"], variantCount: [0, 0], nameHint: "Inferior ischaemia on stress echo" },
    lesions: [],
    events: [],
    chart: {
      ageY: 57,
      sex: "F",
      heightCm: 164,
      weightKg: 70,
      egfr: 88,
      echo: { lvef: 60, note: "Normal LV function at rest; inferior hypokinesia at peak stress." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 4 }, { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 }],
      allergies: { contrast: "none" },
      pregnancy: "test-negative",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    script: [ANOMALY_SEEN],
    checks: [
      { id: "locate", text: "A non-selective right sinus injection or an aortogram (60 mL over 3 s through a pigtail) before shapes are cycled.", lessonId: "pm-engaging-fail" },
      { id: "engage", text: "The RCA engaged from the left sinus with a suitable shape (a JL of unusual size or an AL), without dissection.", lessonId: "pm-interpreting-anomalies" },
      { id: "course", text: "The course between the aorta and the pulmonary trunk recorded in the report.", lessonId: "pm-interpreting-anomalies" },
    ],
  },

  // pm-interpreting#9, pm-engaging#8: a left main from the right sinus; the left sinus is empty.
  {
    id: "diag-lm-from-right-sinus",
    title: "No left coronary in the left sinus",
    caseName: "Exertional syncope in a young man",
    indication: "SA",
    brief:
      "A 34-year-old man fainted twice while running and has had chest pain on hard exertion. His echo is normal. He is having diagnostic angiography from the right femoral artery. Find each ostium before you choose a catheter.",
    lessonIds: ["pm-interpreting-anomalies", "pm-engaging-left", "pm-engaging-fail"],
    module: ANOMALIES,
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "none", forceVariants: ["anomalous-lm-right-sinus"], variantCount: [0, 0], nameHint: "Exertional syncope in a young man" },
    lesions: [],
    events: [],
    chart: {
      ageY: 34,
      sex: "M",
      heightCm: 183,
      weightKg: 79,
      egfr: 104,
      echo: { lvef: 62, note: "Structurally normal heart." },
      drugs: [],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    script: [ANOMALY_SEEN],
    checks: [
      { id: "locate", text: "The empty left sinus recognised and the left main found with a sinus injection or an aortogram, looking in RAO as well as LAO.", lessonId: "pm-engaging-fail" },
      { id: "engage", text: "The left main engaged from the right sinus without dissection (an Amplatz shape is often needed; a multipurpose catheter engages at an aggressive angle).", lessonId: "pm-interpreting-anomalies" },
      { id: "course", text: "The course between the aorta and the pulmonary trunk recorded and the need for CT named: this course is the one linked with sudden death.", lessonId: "pm-interpreting-anomalies" },
    ],
  },

  // pm-interpreting#9, pm-engaging#8: both ostia high, at the sinotubular junction.
  {
    id: "diag-high-ostia",
    title: "Ostia that are not where the catheters look",
    caseName: "Stable angina, first angiogram",
    indication: "SA",
    brief:
      "A 68-year-old man has stable angina despite two drugs. This is his first angiogram, from the right femoral artery. If the usual shapes do not find an ostium, work through the failed-engagement steps in order.",
    lessonIds: ["pm-engaging-fail", "pm-engaging-left", "pm-interpreting-anomalies"],
    module: ENGAGING,
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", forceVariants: ["high-ostia"], variantCount: [0, 0], nameHint: "Stable angina, first angiogram" },
    events: [],
    chart: {
      ageY: 68,
      sex: "M",
      heightCm: 172,
      weightKg: 86,
      egfr: 70,
      echo: { lvef: 57, note: "Normal LV function, mild LV hypertrophy." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Amlodipine", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Isosorbide mononitrate", route: "oral", lastDoseHoursAgo: 3 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    script: [ANOMALY_ROOT],
    checks: [
      { id: "locate", text: "A sinus injection or an aortogram shows the ostia before shapes are cycled.", lessonId: "pm-engaging-fail" },
      { id: "engage", text: "Each ostium engaged at its own height without forcing the catheter into the ascending aorta wall.", lessonId: "pm-engaging-left" },
    ],
  },

  // pm-engaging#7: a large conus with its own ostium beside the RCA's; the trace damps as a right catheter enters it.
  {
    id: "diag-separate-conus",
    title: "A damped trace at the RCA ostium",
    caseName: "Atypical chest pain, abnormal exercise test",
    indication: "SA",
    brief:
      "A 52-year-old woman has atypical chest pain and an exercise test that was stopped for ST depression. She is having diagnostic angiography from the right radial artery. Read the trace before every injection.",
    lessonIds: ["pm-engaging-rca"],
    module: ENGAGING,
    spec: { focus: "right", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "none", forceVariants: ["conus-separate-ostium"], variantCount: [0, 0], nameHint: "Atypical chest pain, abnormal exercise test" },
    lesions: [],
    events: [],
    chart: {
      ageY: 52,
      sex: "F",
      heightCm: 160,
      weightKg: 66,
      egfr: 92,
      echo: { lvef: 63, note: "Normal." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 4 }],
      allergies: { contrast: "none" },
      pregnancy: "test-negative",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "withdraw", text: "No injection into a damped position: the catheter withdrawn from the conus before any test puff.", lessonId: "pm-engaging-rca" },
      { id: "engage", text: "The RCA engaged with two-handed clockwise rotation after the ostium is located.", lessonId: "pm-engaging-rca" },
    ],
  },

  // pm-interpreting#9: a myocardial bridge on the mid LAD, narrowed in systole only.
  {
    id: "diag-bridge-lad",
    title: "A narrowing that comes and goes",
    caseName: "Exertional chest pain, normal ECG at rest",
    indication: "SA",
    brief:
      "A 47-year-old man has exertional chest pain with a normal resting ECG and echo. He is having diagnostic angiography from the right radial artery. Grade what you see on the right frame.",
    lessonIds: ["pm-interpreting-anomalies"],
    module: ANOMALIES,
    spec: { focus: "left", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "none", forceVariants: ["myocardial-bridge"], variantCount: [0, 0], nameHint: "Exertional chest pain, normal ECG at rest" },
    lesions: [],
    events: [],
    chart: {
      ageY: 47,
      sex: "M",
      heightCm: 180,
      weightKg: 88,
      egfr: 96,
      echo: { lvef: 60, note: "Normal LV size and function; mild septal hypertrophy." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "frame", text: "The mid LAD graded on a diastolic frame, and the systolic narrowing reported as a bridge, not a fixed stenosis.", lessonId: "pm-interpreting-anomalies" },
      { id: "manage", text: "Medical treatment (a beta-blocker or calcium channel blocker) named, as Oxford does.", lessonId: "pm-interpreting-anomalies" },
    ],
  },

  // pm-interpreting#9: a fistula from the proximal LAD draining to the pulmonary artery.
  {
    id: "diag-fistula-pa",
    title: "A vessel that drains into the pulmonary artery",
    caseName: "Murmur and atypical chest pain",
    indication: "SA",
    brief:
      "A 55-year-old woman has atypical chest pain and a continuous murmur heard at a routine examination. Her echo is otherwise normal. She is having diagnostic angiography from the right radial artery. Describe everything the left injection shows.",
    lessonIds: ["pm-interpreting-anomalies"],
    module: ANOMALIES,
    spec: { focus: "left", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "none", forceVariants: ["fistula-lad-pa"], variantCount: [0, 0], nameHint: "Murmur and atypical chest pain" },
    lesions: [],
    events: [],
    chart: {
      ageY: 55,
      sex: "F",
      heightCm: 166,
      weightKg: 72,
      egfr: 85,
      echo: { lvef: 61, note: "Normal LV function; normal right heart size." },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 4 }],
      allergies: { contrast: "none" },
      pregnancy: "test-negative",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "describe", text: "The fistula described: its origin, its course and its drainage into the pulmonary artery.", lessonId: "pm-interpreting-anomalies" },
      { id: "manage", text: "No treatment proposed without volume overload or steal (Brilakis), and not confused with a perforation into a chamber.", lessonId: "pm-interpreting-anomalies" },
    ],
  },

  // pm-engaging#8: a very dilated root where the left main is hard to reach.
  {
    id: "diag-very-dilated-root-telescope",
    title: "A left main out of reach in a very large root",
    caseName: "Breathlessness, aortic regurgitation on echo",
    indication: "SA",
    brief:
      "A 71-year-old man with moderate aortic regurgitation and a dilated ascending aorta on CT has exertional breathlessness. He is having coronary angiography from the right femoral artery before surgery. Size your catheters to the root.",
    lessonIds: ["pm-engaging-fail", "pm-engaging-left"],
    module: ENGAGING,
    spec: { focus: "both", access: "femoral", rootSize: "dilated", dominance: "right", pathology: "none", forceVariants: ["very-dilated-root"], variantCount: [0, 0], nameHint: "Breathlessness, aortic regurgitation on echo" },
    lesions: [],
    events: [],
    chart: {
      ageY: 71,
      sex: "M",
      heightCm: 178,
      weightKg: 82,
      egfr: 68,
      echo: { lvef: 55, note: "Moderate aortic regurgitation; ascending aorta 5.0 cm on CT." },
      drugs: [{ name: "Ramipril", route: "oral", lastDoseHoursAgo: 4 }, { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "size", text: "The JL sized up from the aortic diameter (Brilakis: diameter in centimetres plus one) as far as the cart allows (JL5), or an Amplatz shape, before pushing.", lessonId: "pm-engaging-left" },
      { id: "telescope", text: "When the left main stays out of reach, a 4 Fr diagnostic catheter telescoped through a 6 Fr AL3 guide, as pm-engaging-fail describes.", lessonId: "pm-engaging-fail" },
    ],
  },
];
