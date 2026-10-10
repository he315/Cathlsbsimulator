// Engine-free practice links of pci-equipment-tray (found-launch-links): the table workflow of the PCI lab,
// listed under the lessons that teach it. All open in guided practice, where the equipment tray adds its
// teaching aids (the push buttons and the pre-device checklist):
//   - lad-focal at 'wire-across': ask for a balloon, read the label back, prepare it at the prep station
//     (the mixture decides what fluoroscopy shows; residual air shows as a lucent gap), backload it with
//     the wire pinned, open the valve, introduce it, back-bleed and aspirate the guide, with the wire tip
//     checked before the first device and after each removal (pm-prep-and-stent-balloon-choose,
//     pm-prep-and-stent-balloon-inflate, pm-prep-and-stent-prep-why);
//   - lad-focal at 'guide-engaged': the wire still in the guide, set up and loaded through the
//     Y-connector with the introducer and the torque device (pm-wiring-shape-load). The plan names
//     'wire-across' for the wiring lessons too, but a wire already across cannot be loaded again, so the
//     wiring link opens one step earlier;
//   - rca-cto and rca-calcified at 'guide-engaged': the cart check before the first wire in a CTO and a
//     calcified case, with missing and out-of-date bail-out items to find (eq-balloons-stents-cart-cart).
// Each link carries workspace 'equipment-tray' (src/ui/pci/launch.ts passes it through as launch.workspace,
// naming the tray as the console the link is for; the lab does not yet open a console from it, so the
// learner opens the tray from the Devices drawer). It also keeps these links apart from pci-indeflator's
// link to the same scenario and start under the same balloon lessons: the practice index merges identical
// launches, and both should be listed.
import type { LaunchFile } from "../schema";

const PREP_LESSONS = ["pm-prep-and-stent-balloon-choose", "pm-prep-and-stent-balloon-inflate", "pm-prep-and-stent-prep-why"];

export const launch: LaunchFile = {
  sim: "angio-pci",
  links: [
    {
      scenario: "lad-focal",
      start: "wire-across",
      mode: "guided",
      params: { workspace: "equipment-tray" },
      title: "Take a balloon from the tray: label, preparation, backload, valve and aspiration",
      lessonIds: PREP_LESSONS,
    },
    {
      scenario: "lad-focal",
      start: "guide-engaged",
      mode: "guided",
      params: { workspace: "equipment-tray" },
      title: "Load the wire through the Y-connector with the introducer and the torque device",
      lessonIds: ["pm-wiring-shape-load"],
    },
    {
      scenario: "rca-cto",
      start: "guide-engaged",
      mode: "guided",
      params: { workspace: "equipment-tray" },
      title: "Check the cart before a CTO case",
      lessonIds: ["eq-balloons-stents-cart-cart"],
    },
    {
      scenario: "rca-calcified",
      start: "guide-engaged",
      mode: "guided",
      params: { workspace: "equipment-tray" },
      title: "Check the cart before a calcified case",
      lessonIds: ["eq-balloons-stents-cart-cart"],
    },
  ],
};
