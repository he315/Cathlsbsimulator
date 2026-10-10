// ---------------------------------------------------------------------------
// Delivery scenario pack (pci-device-delivery).
//
//  - rca-stuck-stent: the 'stuck stent' case of eq-sheaths-guides-extension-use
//    (lab request eq-sheaths-guides#1). Right radial access with a tortuous
//    subclavian, a 6 Fr Amplatz left 1 in a calcified, tortuous RCA; the
//    lesion has been predilated and a 3.0 x 22 mm stent has stopped at the
//    second proximal bend, at the lesion's proximal edge, with the guide
//    backing out of the ostium. It opens at that moment
//    ('stent-stuck-bend2'): stop pushing, make the guide coaxial, choose the
//    support (a matched 6 Fr extension with a 40 cm cylinder for the radial
//    route, its push rod under the towel, inchworming or balloon-assisted
//    tracking rather than the bare wire), withdraw the stent coaxially into
//    the extension or deliver it through, and inspect a stent that came back.
//  - rca-calcified-uncrossable: a severe calcified mid-RCA stenosis that a
//    small balloon will not cross through a Judkins right (cp-uncrossable,
//    first line and the guide extension delivered stepwise). It opens with a
//    2.0 mm balloon stopped at the lesion edge ('balloon-at-edge').
//
// A start's equipment (the device at the edge, the guide as the push left it)
// is its `setup` (PciStartSetup, src/simulation/pci/state.ts), applied by
// actions/devices.ts applyStartSetup. The registry's start type does not carry
// it and startPci (actions/scenario.ts) does not apply it yet: until it does,
// both starts open with the wire across and the device still to be taken (the
// package report names the one-line change), so their declared phase is the
// one startPci gives, 'lesion-prep'.
//
// The anatomy is the lab's tree with the tortuous-RCA variant (the atlas
// loops the RCA) for the stuck stent; the tortuous subclavian is declared for
// the case model (the PCI lab draws no arm) and raises subclavian-tortuosity
// on the radial route (src/ui/lab/pciEvents/delivery.ts). Lesion values,
// guide positions and device sizes are teaching values of synthetic cases;
// the 3.0 x 22 mm stent, the 6 Fr AL1 by the right radial route and the
// second proximal bend are the case text of eq-sheaths-guides#1.
// ---------------------------------------------------------------------------

import type { PciStartSetup } from "../../state";
import type { PciScenarioDef, PciStartDef } from "../types";
import { STANDARD_PCI_STARTS } from "./core";

/** A start with its opening equipment (applyStartSetup reads `setup`). */
export type DeliveryStartDef = PciStartDef & { setup?: PciStartSetup };

const WIRE_ACROSS: PciStartDef = { ...STANDARD_PCI_STARTS.find((x) => x.id === "wire-across")! };

/** The stuck stent: a 3.0 x 22 mm stent pushed until it stops at the bend, the guide backed out 1.5 mm and turned off the coaxial line. */
export const STUCK_STENT_START: DeliveryStartDef = {
  id: "stent-stuck-bend2",
  title: "Stent stuck at the second bend",
  phase: "lesion-prep",
  guideEngaged: true,
  wire: "across",
  setup: {
    device: { specId: "des", diameter: 3.0, lengthMm: 22 },
    // the radial Amplatz sits off the coaxial line in the tortuous subclavian; the failed push leaves it backed out 1.5 mm
    pushCoaxial: 0.55,
    guide: { depthMm: -1.5, coaxial: 0.42 },
  },
};

/** A 2.0 mm semi-compliant balloon pushed until it stops at the lesion edge, the guide still seated. */
export const BALLOON_AT_EDGE_START: DeliveryStartDef = {
  id: "balloon-at-edge",
  title: "Balloon stopped at the lesion edge",
  phase: "lesion-prep",
  guideEngaged: true,
  wire: "across",
  setup: {
    device: { specId: "sc", diameter: 2.0, lengthMm: 15 },
    // the Judkins right is pushed back a little and stays seated
    guide: { depthMm: -0.5, coaxial: 0.8 },
  },
};

export const scenarios: PciScenarioDef[] = [
  {
    id: "rca-stuck-stent",
    title: "Stuck stent: calcified, tortuous RCA",
    brief:
      "Synthetic case. 74-year-old woman with class III angina, treated by the right radial route; the subclavian is tortuous. The RCA is calcified and tortuous, and the mid-RCA stenosis at its second bend has been predilated. A 3.0 × 22 mm stent advanced through a 6 Fr Amplatz left 1 has stopped at the second proximal bend, and the guide has started to back out of the ostium.",
    epa: "pci-calcium",
    difficulty: 5,
    side: "right",
    anatomy: { dominance: "right", rootSize: "normal", tortuosity: 2, variants: ["tortuous-rca", "tortuous-subclavian"] },
    lesions: [{ vessel: "RCA", position: 0.45, severity: 85, lengthMm: 16, kind: "calcified", calcium: 2, role: "target" }],
    patient: { accessRoute: "radial-right" },
    setup: { guideDefault: "AL1", guidesAcceptable: ["JR4", "AL2"], french: 6, heparinised: true, guideInRoot: false },
    starts: [STUCK_STENT_START, WIRE_ACROSS],
    views: ["rcalao", "rcarao", "apcranial"],
    points: [
      "When a stent stops, stop pushing: watch the guide tip and the distal wire, and never push the stent's proximal end out of a guide that is backing out.",
      "Make the guide coaxial before anything comes back into it; a stent pulled into a guide that is not coaxial is stripped or deformed.",
      "A matched 6 Fr extension with a long cylinder for the radial route, its push rod under the towel, delivered over a balloon (inchworming) rather than along the bare wire; keep its collar inside the guide.",
    ],
  },
  {
    id: "rca-calcified-uncrossable",
    title: "Balloon-uncrossable calcified mid-RCA",
    brief:
      "Synthetic case. 69-year-old man with diabetes and class III angina. A severe, heavily calcified mid-RCA stenosis; the wire is across, but a 2.0 mm balloon advanced through a 6 Fr Judkins right stops at the lesion's edge.",
    epa: "pci-calcium",
    difficulty: 5,
    side: "right",
    anatomy: { dominance: "right", rootSize: "normal", tortuosity: 1, variants: [] },
    lesions: [{ vessel: "RCA", position: 0.45, severity: 85, lengthMm: 18, kind: "calcified", calcium: 2, role: "target" }],
    patient: { accessRoute: "radial-right" },
    setup: { guideDefault: "JR4", guidesAcceptable: ["AL1", "AL2"], french: 6, heparinised: true, guideInRoot: false },
    starts: [BALLOON_AT_EDGE_START, WIRE_ACROSS],
    views: ["rcalao", "rcarao", "apcranial"],
    points: [
      "Escalate stepwise and combine: a smaller balloon, more support (deep seat, buddy wire, anchor, extension), then modification.",
      "Deliver the extension by inchworming: a 2.0 mm balloon half in and half out of its tip at 6-8 atm, then advance the extension as the balloon deflates; repeat.",
      "A balloon that bites backs the guide out: add support at the same time as the device rather than one after the other.",
    ],
  },
];
