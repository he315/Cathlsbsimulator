// Engine-free practice links of pci-two-rail-engine (found-launch-links): two wires and two devices in one
// guide. This package gives the engine the second rail (a second wire, jailing under the main-vessel stent,
// rewiring through a strut cell, the kiss and the final POT) and the hands' slots for it (wire014b, balloon2),
// but nothing in the lab yet loads the second wire, takes the jailed wire out or starts the kiss: no input
// binding or console calls loadSecondWire, setActiveRail, removeRailWire or perform('kissing', ...). A link
// under the provisional-stenting lessons (cp-bifurcation-provisional-sb, cp-bifurcation-provisional-pot) would
// promise steps the learner cannot take, so it waits for the package that binds them (lad-focal at
// 'wire-across' with 'bifurcation' is the link it can add).
// The plan's lad-isr link (start 'wire-under-strut', setup { underStrut: { diameter, lengthMm } }, under
// pm-prep-and-stent-delivery, for pm-prep-and-stent#5) waits for the scenario pack that declares lad-isr; the
// engine side is ready (PciStartSetup.underStrut in src/simulation/pci/state.ts, applied by actions/devices.ts
// applyStartSetup).
import type { LaunchFile } from "../schema";

export const launch: LaunchFile = {
  sim: "angio-pci",
  links: [],
};
