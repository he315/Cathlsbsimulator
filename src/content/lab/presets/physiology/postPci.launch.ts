// Launch metadata for the physiology lab's post-PCI presets (physiology-post-pci-handover). Engine-free:
// types only. The ids and titles are those of POST_PCI_PRESETS in src/simulation/physiology.ts
// (src/simulation/physiology/postPci.test.ts checks both ways): an in-stent step, a focal step beyond the
// distal edge, diffuse loss beyond the stent and a final value above 0.91, one for each branch of
// Brilakis's post-PCI algorithm. Each practises lesson pm-physiology-after-pci; the titles do not name
// the variant.
//
// Held back: the physiology lab opens a preset only when the pressure-wire session registers it
// (src/simulation/pci/pwSession.ts PHYSIOLOGY_PRESETS) and the lab offers the post-PCI decisions
// (src/ui/physiology/DecisionPanel.tsx); neither file belongs to this package. Until both are done,
// POST_PCI_LAUNCH_ENABLED stays false, so no lesson links to a scenario the lab cannot open and the
// bench's hand-over button stays hidden (src/ui/bench/AssessPanel.tsx postPciHandoffAvailable); the
// bench measures the post-PCI physiology of its own stent in place meanwhile. Setting it true publishes
// all four.
import type { LaunchFile, LaunchScenario } from "../../../schema";

const AFTER_PCI = "pm-physiology-after-pci";

/** Whether the physiology lab can open the presets below (see the note above). */
export const POST_PCI_LAUNCH_ENABLED: boolean = false;

/** The scenarios this file declares once POST_PCI_LAUNCH_ENABLED is true. */
export const POST_PCI_SCENARIOS: LaunchScenario[] = [
  { id: "post-pci-instent-step", title: "Post-stent physiology 1: mid LAD", lessonIds: [AFTER_PCI] },
  { id: "post-pci-focal-edge", title: "Post-stent physiology 2: mid LAD", lessonIds: [AFTER_PCI] },
  { id: "post-pci-diffuse", title: "Post-stent physiology 3: mid LAD", lessonIds: [AFTER_PCI] },
  { id: "post-pci-good", title: "Post-stent physiology 4: mid LAD", lessonIds: [AFTER_PCI] },
];

export const launch: LaunchFile = {
  sim: "physiology",
  scenarios: POST_PCI_LAUNCH_ENABLED ? POST_PCI_SCENARIOS : [],
};
