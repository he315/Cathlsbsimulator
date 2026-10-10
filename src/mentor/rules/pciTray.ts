// ---------------------------------------------------------------------------
// Rule group: the table workflow in the PCI lab (pci-equipment-tray). The
// pre-device checklist (pm-prep-and-stent-prep-why: the wire tip position and
// the state of the guide, back-bled, aspirated and filled, before the first
// device and after each device is removed) and the box read back:
//
//   device-wire-in-branch    a device about to leave the guide with the wire tip
//                            in a small distal branch (technique; stops
//                            'advance-device'). Tip pci-prep-wire-check-before-balloon:
//                            inject to check the tip and take it out of small
//                            branches before the balloon goes out. Reads the
//                            bridge's wireTipDistal and deviceAtGuideTip.
//   inject-guide-not-cleared an injection after a device went in or came out
//                            before the guide was back-bled and aspirated
//                            (safety; stops 'inject'). Tip pci-prep-clear-the-guide:
//                            air or debris in the guide goes down the artery.
//   expired-device           a device from an out-of-date box on its way into the
//                            guide (technique; stops 'advance-device'). Tip
//                            pci-operator-check-the-device.
//
// The last two read the tray's fields of the PCI input (PciTrayInput below),
// which the bridge (src/mentor/bridge/pciSession.ts pciInputOf) fills from the
// engine's tray record with trayMentorInput(st); until it does, they read as
// false and stay quiet. Persistence and cooldown times are MODEL PARAMETERS
// (docs/realism/facts/pkg-pci-equipment-tray.md), like those of the other
// groups. The lines never name a score, and they speak from what the
// operator sees.
//
// This file imports types only from the rule registry (registries.test.ts).
// ---------------------------------------------------------------------------

import type { MentorCtx, PciInput } from "../context";
import type { MentorRule } from "../rules";
import type { PciState } from "../../simulation/pci/state";

/** Position of this group in RULES (after the PCI attending's group, 210). */
export const order = 215;

/** The tray's part of the attending's PCI input (absent reads as false). */
export interface PciTrayInput {
  /** a device went into the guide, or came out, since the guide was last back-bled and aspirated */
  guideNotCleared?: boolean;
  /** the device on the wire came from an out-of-date box */
  expiredDevice?: boolean;
}

/** The tray's fields for the attending, from the engine's tray record (for the bridge to add to its PCI input). */
export function trayMentorInput(st: Pick<PciState, "tray" | "device">): PciTrayInput {
  // no tray record yet: the guide is as the team left it (clear), as state.ts trayOf reads it
  const t = st.tray;
  const dev = st.device;
  return {
    guideNotCleared: !!t && !t.guideClear,
    expiredDevice: !!dev && !!dev.box?.expired && (dev.stage === "backloaded" || dev.stage === "in-guide"),
  };
}

const pci = (c: MentorCtx): (PciInput & PciTrayInput) | undefined => c.pci as (PciInput & PciTrayInput) | undefined;
const wireInBranch = (c: MentorCtx): boolean => !!pci(c)?.deviceAtGuideTip && !!pci(c)?.wireTipDistal;

export const rules: MentorRule[] = [
  {
    id: "device-wire-in-branch",
    title: "Device taken out of the guide with the wire tip in a small branch",
    severity: "technique",
    phase: "device",
    lab: "pci",
    when: wireInBranch,
    persistS: 0.3,
    stopOn: (a, c) => a === "advance-device" && wireInBranch(c),
    anchor: "fluoro",
    cooldownS: 20,
    lines: {
      1: () => "Before the balloon goes out, where is your wire tip?",
      2: () => "Look at the tip on the last run: what is it sitting in?",
      3: () => "The wire tip is in a small branch.",
      4: () => "Hold the device in the guide, inject to see the tip, and bring it back into the main vessel a few centimetres beyond the lesion.",
      5: () => "Stop. Sort the wire tip out before the device leaves the guide.",
    },
    frames: [
      {
        id: "far-enough",
        text: "I wanted the tip well distal for support",
        teaching:
          "Distal is right, a small branch is not: a balloon pushed or inflated with the tip in a small branch near the lesion can dissect or perforate it. Check the tip with an injection before the first device and after each removal, and keep it several centimetres beyond the lesion in the main vessel (pm-prep-and-stent-prep-why).",
        drill: "too-much-pushing",
      },
    ],
  },
  {
    id: "inject-guide-not-cleared",
    title: "Injection before the guide was cleared after a device went in or out",
    severity: "safety",
    phase: "device",
    lab: "pci",
    when: (c) => !!pci(c)?.guideNotCleared,
    persistS: 4,
    stopOn: (a, c) => a === "inject" && !!pci(c)?.guideNotCleared,
    anchor: "syringe",
    cooldownS: 15,
    lines: {
      1: () => "What might be sitting in the guide after that exchange?",
      2: () => "The valve was open for the device. What does the manifold line look like?",
      3: () => "You haven't back-bled or aspirated since the device went through the valve.",
      4: () => "Back-bleed the Y-connector, aspirate and flush the guide through the manifold, then inject.",
      5: () => "Stop. Aspirate the guide before you inject.",
    },
    frames: [
      {
        id: "closed-valve",
        text: "The valve is closed again",
        teaching:
          "Closing the valve stops more air getting in; it does not remove what came in with the device. Back-bleed and aspirate after every exchange through the valve, before the next injection, or the air goes down the artery (pm-prep-and-stent-prep-why, pm-wiring-shape-load).",
        drill: "air-embolism",
      },
    ],
    mistake: "no-aspirate",
  },
  {
    id: "expired-device",
    title: "Device from an out-of-date box",
    severity: "technique",
    phase: "device",
    lab: "pci",
    when: (c) => !!pci(c)?.expiredDevice,
    persistS: 0.5,
    stopOn: (a, c) => a === "advance-device" && !!pci(c)?.expiredDevice,
    anchor: "plan",
    cooldownS: 60,
    lines: {
      1: () => "Did you read that box back?",
      2: () => "Check the date on the box.",
      3: () => "That device is past its use-by date.",
      4: () => "Take it off the wire, send the box back and ask for another of the same size.",
      5: () => "Stop. Not that one: it is out of date.",
    },
    frames: [
      {
        id: "size-only",
        text: "I checked the size",
        teaching: "The read-back is the type, the diameter, the length and the use-by date, every time a box is opened (hb-the-operator).",
      },
    ],
  },
];
