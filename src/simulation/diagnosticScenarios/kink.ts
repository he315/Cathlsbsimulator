// ---------------------------------------------------------------------------
// Torque loss and catheter kinking (diag-catheter-kink): three patients whose
// access route has a tortuous segment, where rotation at the hub is absorbed
// along the shaft, the tip stops following and further turning kinks the
// catheter.
//
// The mechanics are the rod model's (src/physics/engine.ts, the kink model;
// lumen.ts routeTortuosity): the variant makes the segment tortuous, and the
// kink, its damped trace, the failed aspiration, the refused injection and the
// recovery all come from what the operator does. Under the simple catheter
// model the cases play as ordinary studies with the same anatomy. The
// tortuous-iliac case answers pm-engaging#2 and eq-sheaths-guides#4 (the
// femoral route; the long sheath, the wire inside and the smaller catheter as
// prevention); the subclavian case answers cp-prior-cabg#2 (the tortuous left
// subclavian on the way to the native vessels and the mammary graft) and
// pm-engaging#2; the radial forearm case opens with a kink that a colleague's
// catheter brought back into the forearm (pm-engaging#2: "a kinked catheter
// pulled back can bring the kink into the forearm"), where the cuff on the
// upper arm is the step that holds it (src/ui/physics/physicsDevices.ts
// KINK_STARTS). The catheter-kink and torque-not-transmitted events come from
// the kink session module, not from the case.
//
// caseName states the presentation only; title names what the case teaches
// where the lessons list it. Chart values are scenario data, not sourced facts.
// ---------------------------------------------------------------------------

import type { DiagScenario } from "./index";

const ENGAGING = { id: "pm-engaging", title: "Engaging the coronary arteries" };
const PRIOR_CABG = { id: "cp-prior-cabg", title: "Patients with bypass grafts" };

export const scenarios: DiagScenario[] = [
  // pm-engaging#2, eq-sheaths-guides#4: the tortuous iliac from the right femoral artery.
  {
    id: "diag-kink-tortuous-iliac",
    title: "The tip that will not follow the hub: a tortuous iliac",
    caseName: "Exertional angina, right femoral study",
    indication: "SA",
    brief:
      "A 74-year-old woman with exertional angina is having diagnostic angiography from the right femoral artery. The report of an earlier study says the catheters were hard to steer from the groin. The catheter is in the aortic root over the J wire.",
    lessonIds: ["pm-engaging-torque", "eq-sheaths-guides-long-sheathless"],
    module: ENGAGING,
    spec: {
      focus: "both",
      access: "femoral",
      rootSize: "normal",
      dominance: "right",
      pathology: "mild-irregularity",
      forceVariants: ["tortuous-iliac"],
      variantCount: [0, 0],
      nameHint: "Exertional angina, right femoral study",
    },
    events: [],
    chart: {
      ageY: 74,
      sex: "F",
      heightCm: 160,
      weightKg: 66,
      egfr: 64,
      echo: { lvef: 60, note: "Normal LV size and function." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      previousCatheters: [
        { target: "left", catheterId: "JL4", route: "femoral" },
        { target: "right", catheterId: "JR4", route: "femoral" },
      ],
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "stop", text: "Turning stopped once the tip no longer followed the hub, with a back-and-forth movement rather than further turns one way.", lessonId: "pm-engaging-torque" },
      { id: "prevent", text: "A remedy used before engaging: a long sheath across the iliac, a 0.035 in wire kept inside while manipulating, or a catheter 1 Fr smaller than the sheath.", lessonId: "eq-sheaths-guides-long-sheathless" },
      { id: "screen", text: "With a damped trace or a tip that would not follow, the whole catheter screened before anything else.", lessonId: "pm-engaging-torque" },
      { id: "no-inject", text: "No injection or flush through a kinked catheter.", lessonId: "pm-engaging-torque" },
      { id: "order", text: "A kink recovered in the manual's order: untwist and pass a wire, hold the tip, pressurise the lumen, cut and cover with a sheath, then remove.", lessonId: "pm-engaging-torque" },
    ],
  },

  // cp-prior-cabg#2, pm-engaging#2: a tortuous left subclavian on the way to the natives and the mammary graft.
  {
    id: "diag-kink-subclavian",
    title: "A tortuous subclavian: torque that does not reach the tip",
    caseName: "Recurrent angina years after bypass surgery, left radial study",
    indication: "SA",
    brief:
      "A 70-year-old man had bypass surgery eight years ago and has angina again. He is having diagnostic angiography from the left radial artery, for the native vessels and the left internal mammary artery. The catheter is in the aortic root over the J wire.",
    lessonIds: ["pm-engaging-torque", "cp-prior-cabg-arterial"],
    module: PRIOR_CABG,
    spec: {
      focus: "both",
      access: "radial-left",
      rootSize: "normal",
      dominance: "right",
      pathology: "mild-irregularity",
      forceVariants: ["tortuous-subclavian"],
      variantCount: [0, 0],
      nameHint: "Recurrent angina years after bypass surgery, left radial study",
    },
    grafts: [{ id: "lima-lad", conduit: "lima", target: "LAD", position: 0.55, proximalSite: "left-subclavian", status: "patent", ringMarker: false }],
    events: [],
    chart: {
      ageY: 70,
      sex: "M",
      heightCm: 175,
      weightKg: 82,
      egfr: 70,
      echo: { lvef: 55, note: "Mild anterior hypokinesia." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      operationNote: "Coronary artery bypass grafting, eight years ago: left internal mammary artery to the LAD.",
      consentScope: "diagnostic-only",
    },
    planted: ["operation-note"],
    startAt: "root",
    checks: [
      { id: "stop", text: "Turning stopped once the tip no longer followed the hub through the subclavian.", lessonId: "pm-engaging-torque" },
      { id: "screen", text: "With a damped trace or a tip that would not follow, the whole catheter screened before any injection.", lessonId: "pm-engaging-torque" },
      { id: "no-inject", text: "No injection or flush through a kinked catheter.", lessonId: "pm-engaging-torque" },
      { id: "subclavian", text: "The tortuous subclavian taken into account before engaging the mammary graft.", lessonId: "cp-prior-cabg-arterial" },
    ],
  },

  // pm-engaging#2: a kink pulled back into the forearm, below the brachial artery. The tortuous
  // subclavian is this patient's anatomy and the reason the colleague's turns were lost (the brief); it
  // does not make the forearm tortuous (lumen.ts TORTUOUS_REGIONS.subclavian is the subclavian and the
  // innominate only). The forearm kink is the scenario's start state (physicsDevices.ts KINK_STARTS),
  // latched there whatever the variants, and the subclavian-tortuosity tips it raises are true of the
  // route the catheter must still take once the kink is undone.
  {
    id: "diag-kink-radial-forearm",
    title: "A kink in the forearm: hold it with a cuff",
    caseName: "Chest pain on exertion, right radial study handed over",
    indication: "SA",
    brief:
      "A 66-year-old man with chest pain on exertion is having diagnostic angiography from the right radial artery. A colleague was turning the catheter at the right sinus when the tip stopped answering the hub, and pulled it back a long way before handing over to you. Check the catheter before you do anything else with it.",
    lessonIds: ["pm-engaging-torque"],
    module: ENGAGING,
    spec: {
      focus: "right",
      access: "radial-right",
      rootSize: "normal",
      dominance: "right",
      pathology: "mild-irregularity",
      forceVariants: ["tortuous-subclavian"],
      variantCount: [0, 0],
      nameHint: "Chest pain on exertion, right radial study handed over",
    },
    events: [],
    chart: {
      ageY: 66,
      sex: "M",
      heightCm: 178,
      weightKg: 88,
      egfr: 78,
      echo: { lvef: 58 },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    startAt: "root",
    checks: [
      { id: "screen", text: "The whole catheter screened before any injection, flush or further turning.", lessonId: "pm-engaging-torque" },
      { id: "no-inject", text: "No injection or flush through the kinked catheter.", lessonId: "pm-engaging-torque" },
      { id: "cuff", text: "The kink below the brachial artery held with a cuff on the upper arm while it was untwisted, after untwisting and a wire alone had not undone it.", lessonId: "pm-engaging-torque" },
    ],
  },
];
