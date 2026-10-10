// ---------------------------------------------------------------------------
// Rule group: the PCI rules written with the S11 attending (wire in a septal,
// device beyond the wire, oversized balloon outside the lesion, deployment
// without a positioning run). The PCI attending package adds its own rule
// files beside this one rather than editing it.
//
// Moved unchanged from src/mentor/rules.ts (found-mentor-registries).
// ---------------------------------------------------------------------------

import type { MentorCtx } from "../context";
import type { MentorRule } from "../rules";
import { MENTOR_PARAMS } from "./diagnostic";

/** Position of this group in RULES (after the diagnostic group). */
export const order = 200;

const oversizedOutsideLesion = (c: MentorCtx): boolean =>
  !!c.pci &&
  c.pci.deviceKind === "balloon" &&
  (c.pci.localRefMm ?? 0) > 0 &&
  (c.pci.deviceDiameter ?? 0) / (c.pci.localRefMm ?? 1) > MENTOR_PARAMS.oversizeRatio &&
  !c.pci.deviceInLesion &&
  !c.pci.deviceInStent;

export const rules: MentorRule[] = [
  {
    id: "wire-septal",
    title: "Wire in a septal branch",
    severity: "technique",
    phase: "wire",
    lab: "pci",
    when: (c) => !!c.pci?.wireInSeptal,
    persistS: 0.8,
    stopOn: (a, c) => (a === "advance-wire" || a === "advance-device") && !!c.pci?.wireInSeptal && c.septalS > MENTOR_PARAMS.septalStopS,
    anchor: "fluoro",
    cooldownS: 10,
    lines: {
      1: () => "Where's your wire going?",
      2: () => "Look at how straight and downward that course is, towards the septum.",
      3: () => "You're in a septal perforator.",
      4: () => "Pull back into the LAD, turn the tip towards the epicardial side and go again.",
      5: () => "Don't push in a septal. Pull back.",
    },
    frames: [
      { id: "lad", text: "I thought it was the LAD", teaching: "In a right anterior oblique cranial view septals run downward into the septum and do not reach the apex; the LAD runs along the epicardial surface to the apex. Check the course in two views.", drill: "poor-view" },
    ],
  },
  {
    id: "device-beyond-wire",
    title: "Device advanced beyond the wire",
    severity: "safety",
    phase: "device",
    lab: "pci",
    when: (c) => !!c.pci?.deviceBeyondWire,
    persistS: 0.3,
    stopOn: (a, c) => a === "advance-device" && !!c.pci?.deviceBeyondWire,
    anchor: "fluoro",
    cooldownS: 8,
    lines: {
      2: () => "Watch your wire tip.",
      3: () => "The device is running out of wire.",
      4: () => "Hold the device and advance the wire well into the distal vessel first.",
      5: () => "Stop. You're off the end of the wire.",
    },
    frames: [
      { id: "short", text: "I thought there was enough wire", teaching: "A device needs wire beyond it for support and to protect the vessel. Keep the wire tip well distal and watch it whenever you advance a device.", drill: "too-much-pushing" },
    ],
  },
  {
    id: "oversized-balloon",
    title: "Oversized balloon outside the lesion",
    severity: "safety",
    phase: "device",
    lab: "pci",
    when: oversizedOutsideLesion,
    persistS: 0.5,
    stopOn: (a, c) => a === "inflate" && oversizedOutsideLesion(c),
    anchor: "fluoro",
    cooldownS: 10,
    lines: {
      1: () => "Where exactly is your balloon sitting?",
      2: (c) => `How does a ${(c.pci?.deviceDiameter ?? 0).toFixed(1)} compare with the vessel here?`,
      3: () => "That balloon is bigger than the normal vessel it's in.",
      4: () => "Bring it back inside the stent or the lesion before you inflate.",
      5: () => "Stop. Don't inflate there.",
    },
    frames: [
      { id: "edge", text: "I wanted to treat the stent edge", teaching: "Inflating an oversized balloon in normal vessel beyond the stent edge causes edge dissection. Keep high-pressure post-dilation inside the stent.", drill: "dissection" },
    ],
  },
  {
    id: "deploy-without-run",
    title: "Stent deployment without a positioning run",
    severity: "technique",
    phase: "device",
    lab: "pci",
    when: (c) => !!c.pci && c.pci.deviceKind === "stent" && !c.pci.injectedSinceDeviceMove,
    persistS: 6,
    stopOn: (a, c) => a === "deploy" && !!c.pci && c.pci.deviceKind === "stent" && !c.pci.injectedSinceDeviceMove,
    anchor: "fluoro",
    cooldownS: 10,
    lines: {
      1: () => "How do you know the stent is where you want it?",
      2: () => "Your last picture was before you moved it.",
      3: () => "You haven't checked the position since the last move.",
      4: () => "Take a small positioning run in your working view, then deploy.",
      5: () => "Hold on. Check your position first.",
    },
    frames: [
      { id: "markers", text: "I lined it up on the markers", teaching: "Markers relative to a remembered image drift with every heartbeat and with table movement. Confirm the position against fresh contrast in the working view.", drill: "poor-view" },
    ],
  },
];
