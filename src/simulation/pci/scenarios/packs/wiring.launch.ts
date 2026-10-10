// Launch metadata for the wiring scenario pack (pci-wire-microcatheter; engine-free: types only).
//
// Scenario ids, titles and starts match ./wiring.ts (the registry checks). The held-out exam variants of
// the wiring exercise (XA..XD) are declared heldOut so no lesson or case can link them; the exam opens them
// as {scenario: 'wiring-ladder', variant: 'XA', mode: 'exam'}. For now each is a seed of the same case (only
// the wire's random draws differ): resolveScenario applies no per-seed change to the lesion, so drawing a
// different task per variant needs a change in scenarios/generate.ts (outside this package).
//
// The links put the core pack's cases under the wiring lessons the core pack does not already list them
// for (lab-build-plan.json: the pm-wiring lessons link to lad-focal and rca-calcified): lad-focal under
// navigation, rca-calcified under tip shaping and navigation, rca-cto as written for tip shaping and
// navigation, and rca-cto's 'wire-across' start (the wire is across the occlusion: the post-crossing state)
// for removing a microcatheter over a short wire by trapping.
import type { LaunchFile, LaunchVariant } from "../../../../content/schema";

const starts = [
  { id: "guide-in-root", title: "Guide in the aortic root" },
  { id: "guide-engaged", title: "Guide engaged" },
  { id: "wire-across", title: "Wire across the lesion" },
];

const EXAM_VARIANTS: LaunchVariant[] = ["XA", "XB", "XC", "XD"].map((id) => ({ id, title: `held-out exercise ${id.slice(1)}`, heldOut: true }));

export const launch: LaunchFile = {
  sim: "angio-pci",
  scenarios: [
    {
      id: "lcx-om-tortuous",
      title: "Tortuous circumflex: angulated obtuse marginal",
      lessonIds: ["pm-wiring-tortuosity", "pm-wiring-wire-choice", "pm-wiring-shape-load", "pm-wiring-navigate", "pm-wiring-microcatheters"],
      starts,
    },
    {
      id: "wiring-ladder",
      title: "Wiring exercise: mid-to-distal LAD",
      lessonIds: ["pm-wiring-navigate", "pm-wiring-wire-choice", "pm-wiring-shape-load"],
      starts,
      variants: EXAM_VARIANTS,
    },
  ],
  links: [
    { scenario: "lad-focal", lessonIds: ["pm-wiring-navigate"] },
    { scenario: "rca-calcified", lessonIds: ["pm-wiring-shape-load", "pm-wiring-navigate"] },
    { scenario: "rca-cto", lessonIds: ["pm-wiring-shape-load", "pm-wiring-navigate"] },
    {
      scenario: "rca-cto",
      start: "wire-across",
      title: "Chronic total occlusion of the mid RCA · removing the microcatheter after crossing",
      lessonIds: ["pm-wiring-microcatheters", "pm-engaging-exchange", "eq-balloons-stents-cart-specialty"],
    },
  ],
};
