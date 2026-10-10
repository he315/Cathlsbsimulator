// ---------------------------------------------------------------------------
// Engagement technique scenarios (diag-engagement-technique-set): one patient
// each, scored on how the catheters are chosen and handled rather than on a
// lesion.
//
//   diag-lm-fold-small-root      femoral left main over the looped J wire in a
//                                short patient with a small root and a high
//                                left main (pm-engaging#6)
//   diag-radial-left-set         the left coronary from the right radial with a
//                                JL3.5 or a universal curve; the seed may give
//                                separate LAD and circumflex ostia
//                                (pm-engaging#7)
//   diag-rca-set                 a large dominant RCA that a Judkins right or a
//                                universal curve dives into, a conus with its
//                                own ostium beside the RCA's that damps the
//                                trace, and a mild ostial narrowing a deep tip
//                                hides (pm-engaging#8, pm-interpreting#3)
//   diag-engage-fail-ladder      an elective patient whose ostia arise high,
//                                reached through a tortuous iliac route: the
//                                five failed-engagement steps, with the stop
//                                decision on the contrast total (pm-engaging#8)
//   diag-lm-damping-causes       a left main stenosis that damps the trace,
//                                with a short left main (the JL fills only the
//                                LAD until one size larger is used) or left
//                                dominance by seed; the five-view left main set
//                                (cp-left-main#5, cp-ostial#7,
//                                pm-interpreting#3)
//   diag-catheter-choice-by-root a very tall patient with a dilated ascending
//                                aorta and an anterior RCA: the pre-case
//                                catheter choice compared with the route and
//                                the root (pm-to-the-root#7)
//
// The mechanics come from elsewhere: the looped wire, the radial approach and
// the short left main from the rod physics (src/physics/manoeuvres.ts
// foldOverJWire, radialLeftEngagement, shortLmEntry) and the analytic model
// (src/simulation/engagement.ts shortLmBranch, applied only with
// opts.shortLmBranches; engagementOptionsFor gives those options for this
// pack's short-lm cases, but the lab's store does not call it yet: reported
// with this package); the conus damping, the deep
// seat and the root size from the lab's context (diagnosticContext.ts:
// 'conus-selective', 'catheter-too-deep', 'small-root', 'dilated-root'); a
// failed attempt from the session ('engage-fail'); catheter-tip spasm from the
// spasm session module ('ostial-spasm'). The scripts here raise only what the
// anatomy implies: 'anomalous-origin' when a root injection shows a high
// ostium, as diag-high-ostia does (anatomy.ts), and 'high-contrast-volume'
// when the contrast reaches the warning of the stricter ceiling, as
// diag-contrast-sensitive does (core.ts). The attending's rules for this set
// (cycling shapes before the ostium is located, injecting deep, no sinus
// injection at an ostial lesion) and the scoring of the catheter choice and
// the stop decision are in src/mentor/rules/diagEngagement.ts.
//
// Oxford and Brilakis disagree on the direction of the small rotation near
// the left main (pm-engaging#5 of the plan): the lab shows what the physics
// does and the lesson states the disagreement.
//
// The plan names the looped-wire scenario diag-lm-fold-over-j-wire. That id
// is held by diag-rod-physics's normal-root scenario (src/ui/physics/
// physicsDevices.ts ROD_SCENARIOS, src/content/practice/diag-rod-physics
// .launch.ts), whose tests are calibrated on its anatomy, and a second
// declaration of a launch id fails the link validation; so the small-root
// case is diag-lm-fold-small-root until the two are merged (reported with
// this package).
//
// Chart values, lesion values and the variant pools are scenario data, not
// sourced facts. title names the scenario where the lessons and the case
// library list it; caseName is the case's name in the lab and states the
// presentation only.
// ---------------------------------------------------------------------------

import type { EngagementKind } from "../../types";
import type { DiagScenario, ScenarioTrigger } from "./index";

/** The engagement kinds of a non-selective injection into the root (a sinus injection or a puff above the sinuses). */
const ROOT_LEVEL: readonly EngagementKind[] = ["ascending-aorta", "sinus-level", "non-selective"];
/** A root injection shows the ostium where it really is: a high ostium is anomalous for the usual shapes (pm-engaging-fail step 1). */
const OSTIUM_SEEN_FROM_ROOT: ScenarioTrigger = { id: "ostium-from-root", when: { firstInjection: "any", engagement: ROOT_LEVEL }, do: [{ kind: "raise", event: "anomalous-origin", hold: "case" }] };
/** The contrast used reaches the warning of the stricter ceiling (contrastBudget.ts): the stop question is now live. */
const CONTRAST_WARNING: ScenarioTrigger = { id: "contrast-warning", when: { contrast: "warn" }, do: [{ kind: "raise", event: "high-contrast-volume", hold: "case" }] };

const ENGAGING = { id: "pm-engaging", title: "Engaging the coronary arteries" };

/** The scenario ids of this pack, in the pack's order. */
export const ENGAGEMENT_SCENARIO_IDS = [
  "diag-lm-fold-small-root",
  "diag-radial-left-set",
  "diag-rca-set",
  "diag-engage-fail-ladder",
  "diag-lm-damping-causes",
  "diag-catheter-choice-by-root",
] as const;

/**
 * The catheter lists each scenario's case should carry, so that the case's acceptableCatheters (which the debrief's
 * 'wrong-catheter' mistake reads, mistakes.ts) agree with what this set teaches and scores (rules/diagEngagement.ts
 * expectedCatheters for the case's route, root and chart). The case generator draws its lists from the anatomy alone
 * (caseGenerator.ts recommendedLeft and recommendedRight), which leaves out the JL3.5 of a small root with a high
 * left main and of the right radial, the JL one size larger of a short left main, the Williams 3DRC and the AR1, AR2,
 * AL1 and AL2 of an anterior RCA in a dilated root. Reserved: DiagScenario.spec has no catheter override yet, so
 * scenarioCase does not apply these (reported with this package); the scenario test checks that each list holds
 * every catheter expectedCatheters accepts and every catheter the generated case already accepts over seeds 1-10.
 * `recommended` absent: the generated case's own (its first is the catheter the case opens on). For
 * diag-lm-fold-small-root the case keeps opening on the JL4 the learner must change.
 */
export const ENGAGEMENT_CATHETER_LISTS: Readonly<Record<(typeof ENGAGEMENT_SCENARIO_IDS)[number], { recommended?: readonly string[]; acceptable: readonly string[] }>> = {
  "diag-lm-fold-small-root": { recommended: ["JL4", "AL1"], acceptable: ["JL4", "AL1", "JL3.5", "JR4", "3DRC", "AR", "TIG"] },
  "diag-radial-left-set": { acceptable: ["JL4", "JL3.5", "TIG", "JR4", "IKR"] },
  "diag-rca-set": { acceptable: ["JR4", "3DRC", "JL4", "TIG"] },
  "diag-engage-fail-ladder": { acceptable: ["JL4", "JL3.5", "JR4", "3DRC", "AL1", "AR", "TIG"] },
  "diag-lm-damping-causes": { acceptable: ["JL4", "JL4.5", "JR4", "3DRC", "TIG"] },
  "diag-catheter-choice-by-root": { acceptable: ["JL4.5", "JL5", "JL6", "AL1", "AL2", "AR", "AR1", "AR2", "JR4", "TIG"] },
};

export const scenarios: DiagScenario[] = [
  // pm-engaging#6: the femoral left main over the looped J wire; a small root, a short patient and a high left main
  // call for the JL3.5 (tip diag-small-root-shorter-jl), and the root injection that finds the high ostium raises
  // 'anomalous-origin'.
  {
    id: "diag-lm-fold-small-root",
    title: "The left main over a looped wire",
    caseName: "Exertional angina in a small woman, first angiogram",
    indication: "SA",
    brief:
      "A 74-year-old woman, 152 cm tall, has exertional angina despite two drugs. This is her first angiogram, from the right femoral artery. Park the left catheter before the wire comes out, and size it to the patient and the root.",
    lessonIds: ["pm-engaging-left"],
    module: ENGAGING,
    spec: { focus: "left", access: "femoral", rootSize: "small", dominance: "right", pathology: "mild-irregularity", forceVariants: ["small-root", "high-ostia"], variantCount: [0, 0], nameHint: "Exertional angina in a small woman, first angiogram" },
    events: [],
    chart: {
      ageY: 74,
      sex: "F",
      heightCm: 152,
      weightKg: 55,
      egfr: 66,
      echo: { lvef: 60, note: "Normal LV function; small aortic root." },
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
    script: [OSTIUM_SEEN_FROM_ROOT],
    checks: [
      { id: "park", text: "The left catheter parked 2-3 cm above the floor of the right cusp, level with the upward limb of the J, before the wire was withdrawn (Brilakis).", lessonId: "pm-engaging-left" },
      { id: "fold", text: "The catheter allowed to fold into the left cusp and the left main engaged coaxially with a free trace, without forcing it.", lessonId: "pm-engaging-left" },
      { id: "right-cusp", text: "A tip pushed down into the right cusp recognised and corrected by pulling back and re-parking, not by advancing.", lessonId: "pm-engaging-left" },
      { id: "size", text: "A JL3.5 chosen for the short patient, the small root and the high left main (Oxford).", lessonId: "pm-engaging-left" },
      { id: "two-views", text: "Small rotations near the ostium judged in two projections, not one.", lessonId: "pm-engaging-left" },
    ],
  },

  // pm-engaging#7: the left coronary from the right radial; the seed may give separate LAD and circumflex ostia. The
  // short left main is taught femorally (diag-lm-damping-causes): the analytic model's "one size larger" is judged
  // against the root (engagement.ts shortLmBranch) and does not know the route, so from the radial, where the JL3.5
  // is the usual size, it would ask for a JL4.5 rather than the JL4 the lesson names.
  {
    id: "diag-radial-left-set",
    title: "The left coronary from the right radial",
    caseName: "Stable angina, right radial study",
    indication: "SA",
    brief:
      "A 63-year-old man has stable angina and an abnormal CT calcium score. He is having diagnostic angiography from the right radial artery. Engage the left coronary coaxially with a free trace, and make sure every territory is accounted for before you report.",
    lessonIds: ["pm-engaging-left", "pm-interpreting-pitfalls"],
    module: ENGAGING,
    spec: { focus: "left", access: "radial-right", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", variantPool: ["separate-ostia"], variantCount: [0, 1], nameHint: "Stable angina, right radial study" },
    events: [],
    chart: {
      ageY: 63,
      sex: "M",
      heightCm: 175,
      weightKg: 83,
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
      { id: "radial-curve", text: "A JL3.5 or a universal radial curve chosen for the right radial route (Oxford, Brilakis).", lessonId: "pm-engaging-left" },
      { id: "universal", text: "With the universal curve: anticlockwise in the left sinus, then a gentle clockwise turn to seat; its side hole can hide damping, so the position confirmed on fluoroscopy before the test puff.", lessonId: "pm-engaging-left" },
      { id: "separate-ostia", text: "With separate LAD and circumflex ostia, each engaged and imaged; no circumflex occlusion reported that is really selective LAD engagement.", lessonId: "pm-interpreting-pitfalls" },
    ],
  },

  // pm-engaging#8, pm-interpreting#3: the RCA set; a conus with its own ostium (the trace damps as the tip enters it),
  // a large dominant RCA the Judkins right dives into, and a mild ostial narrowing a deep tip hides. No take-off
  // variant: the lab opens a case on its first recommended catheter (caseGenerator.ts recommendedRight), which for a
  // shepherd's crook or an anterior RCA is already an Amplatz, so those stay with the cases built for them.
  {
    id: "diag-rca-set",
    title: "The right coronary: dives, the conus and the ostium",
    caseName: "Exertional breathlessness, inferior ischaemia",
    indication: "SA",
    brief:
      "A 66-year-old man has exertional breathlessness and inferior ischaemia on a perfusion scan. He is having diagnostic angiography from the right femoral artery. Read the trace before every injection, and judge the RCA ostium from outside it.",
    lessonIds: ["pm-engaging-rca", "pm-interpreting-pitfalls"],
    module: ENGAGING,
    spec: { focus: "right", access: "femoral", rootSize: "normal", dominance: "right", pathology: "none", forceVariants: ["conus-separate-ostium"], variantCount: [0, 0], nameHint: "Exertional breathlessness, inferior ischaemia" },
    lesions: [{ vessel: "RCA", position: 0.02, severity: 45, kind: "ostial-rca", lengthMm: 4, role: "bystander", sites: ["aorto-ostial-lesion"] }],
    events: [],
    chart: {
      ageY: 66,
      sex: "M",
      heightCm: 179,
      weightKg: 91,
      egfr: 74,
      echo: { lvef: 54, note: "Mild inferior hypokinesia." },
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
      { id: "torque", text: "The RCA engaged with two-handed clockwise rotation after the ostium was located.", lessonId: "pm-engaging-rca" },
      { id: "dive", text: "A dive into the large RCA backed out by withdrawal or a little anticlockwise rotation.", lessonId: "pm-engaging-rca" },
      { id: "conus", text: "No injection into a deep, damped or conus position: withdrawn from the conus before any test puff.", lessonId: "pm-engaging-rca" },
      { id: "ostium", text: "The ostium judged from a non-selective sinus injection, not with the tip deep in the artery.", lessonId: "pm-interpreting-pitfalls" },
    ],
  },

  // pm-engaging#8: the five failed-engagement steps in an elective patient; both ostia arise high (at the sinotubular
  // junction), the iliac route is tortuous, and the stop decision is taken on the contrast total. The case opens on
  // the usual Judkins shapes (caseGenerator.ts recommends them first for high ostia), so the ladder is the learner's.
  {
    id: "diag-engage-fail-ladder",
    title: "When the catheter will not engage",
    caseName: "Elective angiography, atypical chest pain",
    indication: "SA",
    brief:
      "A 70-year-old woman with atypical chest pain and moderate renal impairment is having elective diagnostic angiography from the right femoral artery. If engagement fails, work through the five questions in order, and keep the contrast total in view.",
    lessonIds: ["pm-engaging-fail"],
    module: ENGAGING,
    spec: { focus: "both", access: "femoral", rootSize: "normal", dominance: "right", pathology: "mild-irregularity", forceVariants: ["high-ostia", "tortuous-iliac"], variantCount: [0, 0], nameHint: "Elective angiography, atypical chest pain" },
    events: [],
    chart: {
      ageY: 70,
      sex: "F",
      heightCm: 163,
      weightKg: 68,
      egfr: 46,
      echo: { lvef: 60, note: "Normal LV function." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 4 },
        { name: "Ramipril", route: "oral", lastDoseHoursAgo: 26, held: true },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    script: [OSTIUM_SEEN_FROM_ROOT, CONTRAST_WARNING],
    checks: [
      { id: "locate", text: "Step 1: the ostium located with a non-selective sinus injection or an aortogram (usually 60 mL over 3 seconds) before shapes were cycled.", lessonId: "pm-engaging-fail" },
      { id: "manoeuvre", text: "Step 2: manoeuvrability restored (a wire inside the catheter, a long sheath, a diagnostic catheter, one 1 Fr smaller than the sheath, or another access).", lessonId: "pm-engaging-fail" },
      { id: "size", text: "Step 3: the curve size changed, or a guide extension used.", lessonId: "pm-engaging-fail" },
      { id: "shape", text: "Step 4: other shapes tried for the located ostium.", lessonId: "pm-engaging-fail" },
      { id: "stop", text: "Step 5: in this elective patient, the study stopped once a large contrast volume had been used without success, with coronary CT to follow; not stopped in an emergency.", lessonId: "pm-engaging-fail" },
    ],
  },

  // cp-left-main#5, cp-ostial#7, pm-interpreting#3: a left main stenosis that damps the trace; by seed a short left
  // main (the tip in the LAD damps too, and the JL fills only the LAD until one size larger is used) and left
  // dominance (short injections). The five-view left main set.
  {
    id: "diag-lm-damping-causes",
    title: "A damped trace at the left main",
    caseName: "Exertional angina and breathlessness",
    indication: "SA",
    brief:
      "A 69-year-old man has angina and breathlessness on modest exertion, with widespread ST depression on an exercise test. He is having diagnostic angiography from the right femoral artery. Read the trace before every injection, and image the left main in the views that show its ostium.",
    lessonIds: ["cp-left-main-assess", "pm-engaging-damping", "cp-ostial-assess", "pm-interpreting-pitfalls"],
    module: { id: "cp-left-main", title: "Left main disease" },
    spec: { focus: "left", access: "femoral", rootSize: "normal", dominance: ["right", "left"], pathology: "mild-irregularity", variantPool: ["short-lm"], variantCount: [0, 1], nameHint: "Exertional angina and breathlessness" },
    lesions: [{ vessel: "LM", position: 0.12, severity: 62, kind: "left-main", lengthMm: 4, role: "target", sites: ["left-main-lesion", "aorto-ostial-lesion"] }],
    events: [],
    chart: {
      ageY: 69,
      sex: "M",
      heightCm: 172,
      weightKg: 80,
      egfr: 70,
      echo: { lvef: 52, note: "Mildly impaired LV function, no regional abnormality at rest." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Isosorbide mononitrate", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "no-inject", text: "No injection with a damped trace: withdrawn until the trace was free and blood could be aspirated.", lessonId: "pm-engaging-damping" },
      { id: "cause", text: "The cause sought: a left main stenosis, the tip in the wall, spasm (nitrate given), or the tip in a branch of a short left main; catheter causes (thrombus, kink, transducer) excluded.", lessonId: "cp-left-main-assess" },
      { id: "non-selective", text: "Non-selective images from the sinus when every engagement damps; disengaged at once when contrast did not clear.", lessonId: "cp-left-main-assess" },
      { id: "short-lm", text: "With a short left main, the circumflex imaged by changing to a JL one size larger rather than by engaging deeper (Oxford), and every territory assigned a supplying vessel.", lessonId: "pm-interpreting-pitfalls" },
      { id: "short-injections", text: "Short left injections in a left-dominant patient.", lessonId: "cp-left-main-assess" },
      { id: "views", text: "The five-view left main set acquired (AP, RAO caudal, RAO cranial, LAO cranial, LAO caudal), and LAO caudal and LAO cranial named as the least foreshortened views of the ostium (Brilakis).", lessonId: "cp-ostial-assess" },
    ],
  },

  // pm-to-the-root#7: the catheter choice before the case, compared with the route and the root: a very tall patient
  // with a dilated ascending aorta (a larger JL, Brilakis's diameter plus one) and an anterior RCA (AR or AL shapes).
  {
    id: "diag-catheter-choice-by-root",
    title: "Choosing catheters for the route and the root",
    caseName: "Breathlessness in a tall man, angiography before valve surgery",
    indication: "SA",
    brief:
      "A 64-year-old man, 197 cm tall, has moderate aortic regurgitation and a dilated ascending aorta (4.2 cm on CT). He is having coronary angiography from the right femoral artery before valve surgery. State your catheters before you start, and record the ones that worked.",
    lessonIds: ["pm-to-the-root-choice"],
    module: { id: "pm-to-the-root", title: "Getting to the aortic root" },
    spec: { focus: "both", access: "femoral", rootSize: "dilated", dominance: "right", pathology: "none", forceVariants: ["dilated-root", "anterior-rca"], variantCount: [0, 0], nameHint: "Breathlessness in a tall man, angiography before valve surgery" },
    lesions: [],
    events: [],
    chart: {
      ageY: 64,
      sex: "M",
      heightCm: 197,
      weightKg: 96,
      egfr: 85,
      echo: { lvef: 55, note: "Moderate aortic regurgitation; ascending aorta 4.2 cm on CT." },
      drugs: [{ name: "Ramipril", route: "oral", lastDoseHoursAgo: 4 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "choice", text: "Left and right catheters chosen before the case for the route and the root: a JL sized up for the dilated root (Brilakis: diameter in cm plus 1, so a JL5) and an AR or AL shape for the anterior RCA.", lessonId: "pm-to-the-root-choice" },
      { id: "record", text: "The catheters that worked recorded for the next study.", lessonId: "pm-to-the-root-choice" },
    ],
  },
];
