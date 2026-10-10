// ---------------------------------------------------------------------------
// Rule group: the attending in the PCI lab (pci-attending). The four PCI rules
// written with the S11 attending stay in pciLegacy.ts (wire in a septal,
// device beyond the wire, oversized balloon outside the lesion, deployment
// without a positioning run); this group adds the rest of the PCI safety
// stops and technique prompts the bridge (src/mentor/bridge/pciSession.ts)
// makes visible:
//
//   unscreened-device-advance  a device advanced out of the guide with the beam
//                              off (safety; stops 'advance-device'). Module text:
//                              tip pci-delivery-marker-then-screen (Brilakis,
//                              pm-prep-and-stent-delivery): push blind only to
//                              the shaft marker, then screen it to the guide tip
//                              and out to the lesion.
//   act-not-checked            a device about to leave the guide before the ACT
//                              is known to be in range, in supervised practice
//                              (technique; stops 'advance-device' in guided and
//                              supervised practice). Tip
//                              pci-act-before-coronary-devices
//                              (pm-antithrombotics-heparin); the gate is the
//                              engine's actGate (lesionAssessment.ts).
//   withdraw-before-deflate    a balloon pulled back, or about to be moved, before
//                              it has emptied (safety; stops 'advance-device').
//                              Tip pci-balloon-withdraw-deflated
//                              (pm-prep-and-stent-balloon-inflate).
//   guide-backout-ignored      pushing on after the guide has been pushed back out
//                              of the ostium (technique; stops 'advance-device').
//                              Tip pci-mon-guide-backout (pm-monitoring-position).
//   contrast-ceiling           contrast at the warning level of the agreed ceiling,
//                              and an injection past the ceiling (technique; stops
//                              'inject' in guided and supervised practice). The
//                              ceiling is contrastBudget.ts's (Brilakis 2.6 and 1.1,
//                              Oxford ch 4); tip pci-planning-contrast-ceiling.
//   pci-stuck                  no progress on the PCI tasks for a while (technique;
//                              stops nothing). The PCI lab's own stuck prompt: the
//                              attending builds its engine without the diagnostic
//                              'time-out' rule (rules/diagnostic.ts), whose lines are
//                              about catheters and the aortic root. Progress is the
//                              engine's (a better engagement, a cine run that ends)
//                              and the attending's (a device step, an inflation, a
//                              deployment, the wire crossing or moving on, a form
//                              being filled in: src/ui/pci/usePciAttending.ts).
//
// The damped-injection rule (damped-before-inject, rules/diagnostic.ts) is
// already written for lab 'any', so the PCI lab gets it from the bridge's
// guide pressure class; this file does not repeat it.
//
// The thresholds are the same in every mode (only the ladder differs, as the
// engine sets it). Persistence and cooldown times are MODEL PARAMETERS
// (docs/realism/facts/pkg-pci-attending.md), like those of the other groups.
// The lines never name a score, and they speak from what the operator sees.
//
// This file imports types only from the rule registry (registries.test.ts).
// ---------------------------------------------------------------------------

import type { MentorCtx } from "../context";
import type { MentorRule } from "../rules";

/** Position of this group in RULES (after the PCI rules of pciLegacy.ts, before the drug rules). */
export const order = 210;

const pci = (c: MentorCtx) => c.pci;
const contrastOver = (c: MentorCtx): boolean => {
  const p = pci(c);
  return !!p && (p.contrastCeilingMl ?? 0) > 0 && (p.contrastMl ?? 0) >= (p.contrastCeilingMl ?? Infinity);
};
const contrastWarn = (c: MentorCtx): boolean => {
  const p = pci(c);
  return !!p && (p.contrastWarnMl ?? 0) > 0 && (p.contrastMl ?? 0) >= (p.contrastWarnMl ?? Infinity);
};
const ml = (v: number | undefined) => `${Math.round(v ?? 0)} mL`;

/** Seconds without progress before the PCI stuck prompt (MODEL PARAMETER, docs/realism/facts/pkg-pci-attending.md). */
export const PCI_STUCK_NO_PROGRESS_S = 120;

export const rules: MentorRule[] = [
  {
    id: "unscreened-device-advance",
    title: "Device advanced out of the guide without screening",
    severity: "safety",
    phase: "device",
    lab: "pci",
    when: (c) => c.beam === 0 && !!pci(c)?.deviceAtGuideTip && !!pci(c)?.deviceMoving,
    persistS: 0.2,
    stopOn: (a, c) => a === "advance-device" && c.beam === 0 && !!pci(c)?.deviceAtGuideTip,
    anchor: "fluoro",
    cooldownS: 8,
    lines: {
      1: () => "What can you see of that device right now?",
      2: () => "It's at the end of the guide, and the screen is dark.",
      3: () => "You're taking it out of the guide without screening.",
      4: () => "Put your foot on the fluoroscopy, then bring it out of the guide watching the wire tip and the guide.",
      5: () => "Stop. Screen it before it leaves the guide.",
    },
    frames: [
      {
        id: "feel",
        text: "I was going by feel",
        teaching:
          "Blind pushing is for the shaft inside the guide, only as far as the shaft marker at the Y-connector. From the guide tip on, screen the device out to the lesion and watch the wire tip and the guide while it moves (pm-prep-and-stent-delivery).",
        drill: "too-much-pushing",
      },
    ],
  },
  {
    id: "act-not-checked",
    title: "Device into the coronary before the ACT is known",
    severity: "technique",
    phase: "device",
    lab: "pci",
    when: (c) => !!pci(c)?.actRequired && pci(c)?.actOk === false && !!pci(c)?.deviceAtGuideTip,
    persistS: 0.5,
    stopOn: (a, c) => a === "advance-device" && !!pci(c)?.actRequired && pci(c)?.actOk === false && !!pci(c)?.deviceAtGuideTip,
    anchor: "monitor",
    cooldownS: 20,
    lines: {
      1: () => "Before that goes into the artery, where is the patient's anticoagulation?",
      2: () => "Have we got an ACT since the heparin?",
      3: () => "You haven't checked the ACT yet.",
      4: () => "Hold the device in the guide, ask for an ACT and read it against our machine's target first.",
      5: () => "Hold on. Not into the artery until we have an ACT.",
    },
    frames: [
      {
        id: "heparin-given",
        text: "The heparin was given at the start",
        teaching:
          "A bolus that was given is not the same as a patient who is anticoagulated: a tissued cannula or a low dose leaves the ACT short. Check it about five minutes after the bolus and keep the wire, balloon and stent out of the coronary until it is in range (pm-antithrombotics-heparin).",
      },
    ],
  },
  {
    id: "withdraw-before-deflate",
    title: "Balloon moved before it has emptied",
    severity: "safety",
    phase: "device",
    lab: "pci",
    when: (c) => !!pci(c)?.pulledBeforeDeflation,
    persistS: 0,
    stopOn: (a, c) => a === "advance-device" && !!pci(c)?.balloonInflated,
    anchor: "fluoro",
    cooldownS: 10,
    lines: {
      1: () => "Is that balloon empty?",
      2: () => "Look at the balloon and at the guide as you pull.",
      3: () => "You pulled before it had deflated. The guide came with it.",
      4: () => "Lock the indeflator on vacuum, see it flat on fluoroscopy, then withdraw watching the guide.",
      5: () => "Stop. Let it deflate before you move it.",
    },
    frames: [
      {
        id: "quick",
        text: "I wanted to restore flow quickly",
        teaching:
          "A balloon that is still partly full drags the guide deep into the artery as it comes back, which can dissect the ostium. Lock on vacuum, confirm full deflation on fluoroscopy, and only then withdraw while you watch the guide (pm-prep-and-stent-balloon-inflate).",
        drill: "dissection",
      },
    ],
  },
  {
    id: "guide-backout-ignored",
    title: "Pushing on after the guide has backed out",
    severity: "technique",
    phase: "device",
    lab: "pci",
    when: (c) => !!pci(c)?.guideBackedOut && !!pci(c)?.deviceMoving,
    persistS: 0.3,
    stopOn: (a, c) => a === "advance-device" && !!pci(c)?.guideBackedOut,
    anchor: "fluoro",
    cooldownS: 12,
    lines: {
      1: () => "What did the guide just do?",
      2: () => "Look at the guide tip, not the device.",
      3: () => "The guide is backing out. Pushing harder takes the wire with it.",
      4: () => "Stop advancing, bring the device back, re-engage the guide and readvance the wire. If it still won't cross, prepare the lesion further.",
      5: () => "Stop pushing. Look at your guide.",
    },
    frames: [
      {
        id: "nearly",
        text: "It was nearly across",
        teaching:
          "When the guide is pushed out of the ostium the device stops crossing and the wire retreats. Stop, pull the device back, re-engage the guide and readvance the wire; if it will not cross, prepare the lesion further rather than pushing harder (pm-monitoring-position).",
        drill: "too-much-pushing",
      },
    ],
  },
  {
    id: "pci-stuck",
    title: "Stuck: a pause in the PCI",
    severity: "technique",
    phase: "device",
    lab: "pci",
    when: (c) => c.noProgressS > PCI_STUCK_NO_PROGRESS_S,
    persistS: 0,
    anchor: "plan",
    cooldownS: 60,
    lines: {
      1: () => "Pause. Talk me through your plan from here.",
      2: () => "What are you waiting for: the wire, the device or the picture?",
      3: () => "Step back. Which part is not working: where the wire is, the device, or the support from the guide?",
      4: () => "Look again in your working view, decide on one change, and tell me before you make it.",
    },
    frames: [
      {
        id: "wont-cross",
        text: "The device will not go",
        teaching:
          "When a device will not cross, pushing harder backs the guide out and takes the wire with it. Stop, look at the guide, then improve support or prepare the lesion further (pm-monitoring-position).",
        drill: "too-much-pushing",
      },
    ],
  },
  {
    id: "contrast-ceiling",
    title: "Contrast at the agreed ceiling",
    severity: "technique",
    phase: "inject",
    lab: "pci",
    when: contrastWarn,
    persistS: 0.5,
    stopOn: (a, c) => a === "inject" && contrastOver(c),
    anchor: "syringe",
    cooldownS: 60,
    lines: {
      1: () => "How much contrast have we used?",
      2: (c) => `We're at ${ml(pci(c)?.contrastMl)}. What did we agree at the brief?`,
      3: (c) => `That's close to the ceiling you set, ${ml(pci(c)?.contrastCeilingMl)}.`,
      4: () => "Make every run count from here, and decide now whether to finish or stage the rest.",
      5: () => "Hold on. That's past the ceiling we agreed.",
    },
    frames: [
      {
        id: "nearly-done",
        text: "We were nearly finished",
        teaching:
          "The ceiling is set before the case so that it is not renegotiated at the end: Brilakis stops before 3.7 × GFR, lower in kidney disease, counting recent contrast. Approaching it is the time to stop or stage (pm-planning-bailout).",
      },
    ],
  },
];
