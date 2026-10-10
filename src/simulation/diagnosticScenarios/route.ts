// ---------------------------------------------------------------------------
// From the sheath to the root (diag-route-wire-led-radial): three patients
// whose study opens at the sheath, with the catheter just out of the sheath
// tip over a leading 0.035 in J wire (startAt 'sheath'; the start state is
// src/ui/physics/physicsDevices.ts ROUTE_START).
//
// The route mechanics are the rod model's and the route session module's
// (src/ui/sim/modules/route.ts): the wire must lead the catheter to the root
// and stay out of the ventricle, the catheter is aspirated and connected wet
// before its trace is read (pm-to-the-root#3); the radial loop stops a J wire
// mechanically (src/physics/lumen.ts RADIAL_LOOP) and the resistance
// algorithm is done with the hands: transduce, image from just below, another
// wire with the catheter close behind, balloon-assisted tracking, and the
// pseudolesions of the straightened loop (pm-to-the-root#4); an exchange
// after a tortuous subclavian keeps the route only over an exchange-length
// wire (pm-engaging#9). Under the simple catheter model the cases play as
// ordinary studies from the root with the same anatomy. No case event is
// declared: what the tips see comes from the route module.
//
// caseName states the presentation only; title names what the case teaches
// where the lessons list it. Chart values are scenario data, not sourced facts.
// ---------------------------------------------------------------------------

import type { DiagScenario } from "./index";

const TO_THE_ROOT = { id: "pm-to-the-root", title: "Set-up, catheter choice and reaching the aortic root" };
const ENGAGING = { id: "pm-engaging", title: "Engaging the coronary arteries" };

export const scenarios: DiagScenario[] = [
  // pm-to-the-root#3: wire-led advancement from the sheath, the wire out of the ventricle, the wet connection.
  {
    id: "diag-wire-leads-to-root",
    title: "From the sheath to the root: the wire leads",
    caseName: "Exertional angina, right femoral study",
    indication: "SA",
    brief:
      "A 61-year-old man with exertional angina is having diagnostic angiography from the right femoral artery. The sheath is in and its side arm has been aspirated and flushed. The left catheter is loaded over the J wire, its tip just out of the sheath. Take it to the aortic root.",
    lessonIds: ["pm-to-the-root-advance"],
    module: TO_THE_ROOT,
    spec: {
      focus: "both",
      access: "femoral",
      rootSize: "normal",
      dominance: "right",
      pathology: "mild-irregularity",
      variantCount: [0, 0],
      nameHint: "Exertional angina, right femoral study",
    },
    events: [],
    chart: {
      ageY: 61,
      sex: "M",
      heightCm: 178,
      weightKg: 86,
      egfr: 80,
      echo: { lvef: 60, note: "Normal LV size and function." },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Atorvastatin", route: "oral", lastDoseHoursAgo: 14 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    planted: [],
    startAt: "sheath",
    checks: [
      { id: "wire-leads", text: "The catheter was never advanced without the J wire ahead of its tip.", lessonId: "pm-to-the-root-advance" },
      { id: "out-of-ventricle", text: "The wire was kept out of the ventricle, and ectopy from it corrected by withdrawing it into the root.", lessonId: "pm-to-the-root-advance" },
      { id: "aspirate", text: "After the wire came out, 2–3 mL aspirated and discarded before anything was connected.", lessonId: "pm-to-the-root-advance" },
      { id: "wet", text: "The manifold connected while it dripped, drawn back and discarded, and the catheter filled with contrast to its tip before the trace was read.", lessonId: "pm-to-the-root-advance" },
    ],
  },

  // pm-to-the-root#4: the radial loop that stops the J wire, and Brilakis's resistance algorithm.
  {
    id: "diag-radial-loop-algorithm",
    title: "Resistance in the forearm: the radial loop algorithm",
    caseName: "Chest pain on exertion, right radial study",
    indication: "SA",
    brief:
      "A 57-year-old woman with chest pain on exertion is having diagnostic angiography from the right radial artery. The sheath is in and the vasodilator has been given through it. The catheter is loaded over the J wire, its tip just out of the sheath. Take it to the aortic root.",
    lessonIds: ["pm-to-the-root-radial"],
    module: TO_THE_ROOT,
    spec: {
      focus: "both",
      access: "radial-right",
      rootSize: "normal",
      dominance: "right",
      pathology: "mild-irregularity",
      forceVariants: ["radial-loop"],
      variantCount: [0, 0],
      nameHint: "Chest pain on exertion, right radial study",
    },
    events: [],
    chart: {
      ageY: 57,
      sex: "F",
      heightCm: 160,
      weightKg: 64,
      egfr: 84,
      echo: { lvef: 62 },
      drugs: [{ name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 }],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    planted: [],
    startAt: "sheath",
    checks: [
      { id: "no-force", text: "The wire and the catheter were not pushed against resistance.", lessonId: "pm-to-the-root-radial" },
      { id: "transduce", text: "The sheath's side arm transduced for a waveform before anything else.", lessonId: "pm-to-the-root-radial" },
      { id: "image", text: "The resistance imaged with a puff from just below it before another wire was tried.", lessonId: "pm-to-the-root-radial" },
      // the 0.014 in wire "to negotiate loops" (06-to-the-root.ts:696); the narrow-J, which can stop in the forearm too
      // (06-to-the-root.ts:1290), stalls at this loop like the J in the rod model
      { id: "wire", text: "A hydrophilic or 0.014 in wire across the loop with the catheter close behind.", lessonId: "pm-to-the-root-radial" },
      { id: "bat", text: "Balloon-assisted tracking when the catheter caught at the loop: a compliant balloon half out of the tip at 3–6 atm, advanced as a unit.", lessonId: "pm-to-the-root-radial" },
      { id: "pseudolesion", text: "The narrowings of the straightened loop called pseudolesions, not disease.", lessonId: "pm-to-the-root-radial" },
    ],
  },

  // pm-engaging#9: an exchange after a tortuous subclavian, over a 300 cm wire with its tip in the root.
  {
    id: "diag-exchange-long-wire",
    title: "Changing catheters without losing the route: the exchange-length wire",
    caseName: "Breathlessness on exertion, right radial study",
    indication: "SA",
    brief:
      "A 72-year-old woman with breathlessness on exertion is having diagnostic angiography from the right radial artery. A colleague found the route to the root hard going. The catheter is loaded over the J wire, its tip just out of the sheath. Study both coronary arteries.",
    lessonIds: ["pm-engaging-exchange"],
    module: ENGAGING,
    spec: {
      focus: "both",
      access: "radial-right",
      rootSize: "normal",
      dominance: "right",
      pathology: "mild-irregularity",
      forceVariants: ["tortuous-subclavian"],
      variantCount: [0, 0],
      nameHint: "Breathlessness on exertion, right radial study",
    },
    events: [],
    chart: {
      ageY: 72,
      sex: "F",
      heightCm: 158,
      weightKg: 60,
      egfr: 66,
      echo: { lvef: 58 },
      drugs: [
        { name: "Aspirin", route: "oral", lastDoseHoursAgo: 3 },
        { name: "Bisoprolol", route: "oral", lastDoseHoursAgo: 3 },
      ],
      allergies: { contrast: "none" },
      pregnancy: "not-applicable",
      consentScope: "diagnostic-only",
    },
    planted: [],
    startAt: "sheath",
    checks: [
      { id: "long-wire", text: "Catheters exchanged over a 260 or 300 cm wire, so the route was not lost.", lessonId: "pm-engaging-exchange" },
      { id: "root", text: "The exchange wire's tip kept in the aortic root, out of the ventricle.", lessonId: "pm-engaging-exchange" },
      { id: "aspirate", text: "Each new catheter aspirated and its trace checked before injecting.", lessonId: "pm-engaging-exchange" },
    ],
  },
];
