// The full case's route-decision scenarios (access-route-decision): each a fixed patient opened at the
// chart, whose card (ROUTE_CARDS below, read by the session module 'route-plan', modules/routePlan.ts)
// makes one step of Brilakis's five-step algorithm decide (pm-access-site-choice), or holds one of the
// peripheral findings of hb-background-peripheral, or a radial artery at high risk of spasm
// (pm-engaging-spasm). The learner examines the pulses, reads the card and chooses the site, the
// sheath and a fallback; the planned route then drives the case.
//
//   lima-graft            LIMA and vein grafts: femoral, or the left radial (step 2). A small
//                         haematoma evolves at the access site under heparin, found only when the site
//                         is inspected and palpated (pm-monitoring-watch).
//   arteria-lusoria       an aberrant right subclavian on CT: the left radial or femoral (step 1)
//   complex-pci-8fr       a calcified RCA CTO for PCI: femoral, 7-8 Fr, 45 cm (step 4)
//   impalpable-femorals   neither femoral pulse palpable: the wrist (step 1)
//   axillofemoral-graft   an axillofemoral graft with good femoral pulses: the wrist (step 1)
//   aaa-mural-thrombus    a known aneurysm with mural thrombus on ultrasound: the wrist (step 1)
//   right-groin-plug-60d  a LIMA, and a collagen plug in the right groin 60 days ago: the left groin
//                         or the left radial (steps 1 and 2). The lab cannot yet start a case in the
//                         left groin (routePlan.ts LEFT_GROIN_PLANNABLE), so the plan offers the left
//                         radial as the first site and the left groin as the fallback
//   spasm-high-risk       a small radial in an anxious woman who smokes: the radial with the smallest
//                         thin-walled sheath, sedation, local and the cocktail (pm-engaging-spasm)
//   very-small-radial     a radial too small for any sheath: the ulnar or femoral artery
// The dialysis fistula case is the planning scenario 'dialysis-fistula' (scenarios/planning.ts); its
// route lesson link is in routes.launch.ts.
//
// Scenario settings, all MODEL PARAMETERS (docs/realism/facts/pkg-access-route-decision.md): fixed
// seeds; elective stable-angina patients with no anticoagulant, no contrast reaction and sinus rhythm
// (CLEAN), so no step but the scenario's decides; the planned access the case is booked with (the
// learner's plan replaces it); the ages, sexes and the radial diameters of the spasm cases; the
// haematoma volumes of lima-graft. Every card fact is the scenario's, stated in its chart history.
import type { ProcedureScenario } from "./index";
import type { RouteCardOverrides } from "../../access/siteChoice";

const SITE = "pm-access-site-choice";
const PERIPHERAL = "hb-background-peripheral";
const SPASM = "pm-engaging-spasm";
const WATCH = "pm-monitoring-watch";

/** Nothing carried that would make another step decide. */
const CLEAN = { anticoagulation: "none" as const, allergies: { contrast: "none" as const }, rhythm: "sinus" as const };

/**
 * The haematoma lima-graft develops at the access site under heparin, mL at each time after the sheath
 * (MODEL PARAMETERS: small enough not to be seen under the drapes, MP_COMPRESSION.visibleHaematomaMl
 * 15 mL, and large enough to be felt, MP_ROUTE_PLAN.palpableHaematomaMl).
 */
const LIMA_HAEMATOMA_ML: readonly { at: string; ml: number }[] = [
  { at: "sheath-in+3min", ml: 4 },
  { at: "sheath-in+6min", ml: 4 },
];

export const scenarios: ProcedureScenario[] = [
  {
    id: "lima-graft",
    title: "Route choice: a patient with a LIMA graft",
    lessonIds: [SITE, WATCH],
    seed: "route-lima",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, sex: "M", ageY: 68 },
    chart: { history: "CABG 7 years ago: left internal mammary artery to the LAD and vein grafts to the obtuse marginal and right coronary arteries. No arterial access since." },
    // a small haematoma at the active access site, growing under heparin; nothing is raised or shown
    script: LIMA_HAEMATOMA_ML.map((h) => ({
      at: h.at,
      run: (s) => {
        s.pm.st.haematomaMl += h.ml;
      },
    })),
  },
  {
    id: "arteria-lusoria",
    title: "Route choice: an abnormal right subclavian on CT",
    lessonIds: [SITE, PERIPHERAL],
    seed: "route-lusoria",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, sex: "F", ageY: 61 },
    chart: { history: "No previous arterial access. CT aortogram for chest pain last year: aberrant right subclavian artery arising from the distal arch (arteria lusoria)." },
  },
  {
    id: "complex-pci-8fr",
    title: "Route and sheath for a calcified CTO",
    lessonIds: [SITE],
    seed: "route-cto",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, sex: "M", ageY: 64 },
    chart: { history: "Angiography 2 months ago through the right radial artery: heavily calcified chronic total occlusion of the mid right coronary artery, booked for PCI." },
  },
  {
    id: "impalpable-femorals",
    title: "Route choice: claudication in both calves",
    lessonIds: [PERIPHERAL],
    seed: "route-pad",
    access: "femoral",
    indication: "SA",
    profile: { ...CLEAN, sex: "M", ageY: 72 },
    chart: { history: "Claudication in both calves at 100 metres. No previous arterial access." },
  },
  {
    id: "axillofemoral-graft",
    title: "Peripheral disease: an axillofemoral graft",
    lessonIds: [PERIPHERAL],
    seed: "route-axfem",
    access: "femoral",
    indication: "SA",
    profile: { ...CLEAN, sex: "M", ageY: 70 },
    chart: { history: "Right axillofemoral bypass graft for aortoiliac occlusion. No previous coronary angiography." },
  },
  {
    id: "aaa-mural-thrombus",
    title: "Peripheral disease: an aneurysm with thrombus",
    lessonIds: [PERIPHERAL],
    seed: "route-aaa",
    access: "femoral",
    indication: "SA",
    profile: { ...CLEAN, sex: "M", ageY: 76 },
    chart: { history: "Abdominal aortic aneurysm under surveillance; the last ultrasound showed mural thrombus. No previous arterial access." },
  },
  {
    id: "right-groin-plug-60d",
    title: "Route choice: a recent closure device in the groin",
    lessonIds: [SITE, PERIPHERAL],
    seed: "route-plug",
    access: "femoral",
    indication: "SA",
    profile: { ...CLEAN, sex: "M", ageY: 69 },
    chart: { history: "CABG with a left internal mammary artery and vein grafts. Graft angiography through the right femoral artery 60 days ago, closed with a closure device (details in the pre-procedure record)." },
  },
  {
    id: "spasm-high-risk",
    title: "Radial access planning (1)",
    lessonIds: [SPASM],
    seed: "route-spasm",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, sex: "F", ageY: 47, heightCm: 158, weightKg: 58, radialDiamMm: 2.0, anxiety: 0.85 },
    chart: { history: "Smoker. Very anxious about the procedure. No previous arterial access." },
  },
  {
    id: "very-small-radial",
    title: "Radial access planning (2)",
    lessonIds: [SPASM],
    seed: "route-tiny",
    access: "radial-right",
    indication: "SA",
    profile: { ...CLEAN, sex: "F", ageY: 58, heightCm: 152, weightKg: 54, radialDiamMm: 1.6 },
    chart: { history: "No previous arterial access." },
  },
];

/**
 * The card each scenario sets over the card built from the patient (siteChoice.cardFromPatient). The
 * chart history above states each fact; the pulses are what examination finds.
 */
export const ROUTE_CARDS: Readonly<Record<string, RouteCardOverrides>> = {
  "lima-graft": { cabg: { lima: true, rima: false, veinGrafts: true } },
  "arteria-lusoria": { arteriaLusoria: true },
  "complex-pci-8fr": { procedure: "complex-pci", complexity: "calcified chronic total occlusion of the right coronary artery" },
  "impalpable-femorals": { pulses: { "femoral-right": "absent", "femoral-left": "absent", "pedal-right": "absent", "pedal-left": "absent" } },
  "axillofemoral-graft": { axillofemoralGraft: true },
  "aaa-mural-thrombus": { aaa: { muralThrombus: true } },
  "right-groin-plug-60d": { cabg: { lima: true, rima: false, veinGrafts: true }, recentPlug: { side: "right", daysAgo: 60 } },
  "spasm-high-risk": { smoker: true },
  "very-small-radial": {},
};
