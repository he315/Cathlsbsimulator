# pci-lab-input: model parameters

The PCI lab's hands run on the S8 input system (`src/input/`), connected to the PCI session by `src/ui/pci/pciInputTarget.ts`. A push on the device carries the forces of `deliver()` (`src/simulation/pci/guide.ts`) back to the hands. Those forces are themselves model parameters of `guide.ts` (listed in docs/realism/facts/pci-equipment.md); this package adds only the scale that turns them into the haptic channel and two thresholds. None of the values below comes from a source.

| Parameter | File | Value | Unit | Rests on |
|---|---|---|---|---|
| `PCI_REACTION_AXIAL_AT_BACKUP` | src/ui/pci/pciInputTarget.ts | 1.5 (equal to `DEFAULT_RUMBLE.axialSat`) | HubReaction model units | Choice: the haptic axial load is requiredN / backupN times this value, so a push that needs exactly the guide's back-up saturates the gamepad's strong motor and brings the pseudo-haptic gain close to its floor. The felt weight is how close the push is to backing the guide out, not the absolute force |
| `PCI_REACTION_AXIAL_MAX` | src/ui/pci/pciInputTarget.ts | 3.0 (twice `DEFAULT_RUMBLE.axialSat`) | HubReaction model units | Choice: a ceiling so that a disengaged guide's token back-up (0.02 N in `backupForce`) cannot give an unbounded load |
| `PCI_REACTION_SNAP_MM` | src/ui/pci/pciInputTarget.ts | 0.3 | mm | The distance at which `advanceDevice` in src/simulation/pci/actions/devices.ts logs a guide back-out; a back-out at least this long, or the guide leaving the ostium, is felt as a snap (a short rumble pulse). The distance is the guide's depth before the push minus its depth after it, as the session shows it, not deliver()'s prediction, so a session that does not move the guide gives no snap |
| `PCI_REACTION_AXIAL_ASSISTED_MAX` | src/ui/pci/pciInputTarget.ts | 0.9 (0.6 times `DEFAULT_RUMBLE.axialSat`) | HubReaction model units | Choice: the ceiling of the axial load when the session moved the device further than deliver() allows (the session's advanceDevice is still the assisted move). It stays below the strong motor's saturation, so the rumble does not signal a stall the screen never shows. The reaction still carries deliver()'s forces and is marked `assisted` |
| `PCI_REACTION_OVERRUN_MM` | src/ui/pci/pciInputTarget.ts | 0.05 | mm | Choice: a tolerance above rounding. A session move of the device's distal end more than this beyond deliver()'s advance (free running inside the guide plus `advancedMm`) marks the reaction assisted |
| `PCI_PLUNGER_ON` | src/ui/pci/pciInputTarget.ts | 0.08 | fraction of a firm push (0..1) | The diagnostic lab's `PUSH_ON` in src/ui/sim/labSession.ts, so the syringe starts an injection, a flush or an aspiration at the same plunger force in both labs |

Not model parameters, but choices a reviewer may want to see:

- The PCI keys (`pciKeymap` in src/input/settings.ts): Q and E roll the gripped device anticlockwise and clockwise, as the earlier PCI lab's Q and E turned the wire, so the left hand's wire and guide pins move from Q and E to R and G. A key the person has remapped is kept as they set it. The diagnostic keymap is unchanged.
- The PCI grip order (`pciGripOrder` in src/input/settings.ts): guide, coronary wire, the device on the wire (balloon, stent or imaging catheter by its kind), syringe, sheath. `GRIP_ORDER_PCI` is the same order with a balloon and is unchanged.
