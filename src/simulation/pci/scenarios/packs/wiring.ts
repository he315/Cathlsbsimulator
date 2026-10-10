// ---------------------------------------------------------------------------
// Wiring scenario pack (pci-wire-microcatheter).
//
//  - lcx-om-tortuous: a stenosis of the tortuous circumflex at the origin of
//    the second obtuse marginal, which leaves it at an acute angle backwards
//    (a bifurcation lesion whose side branch is the declared sideBranch). The
//    marginal is wired first: the wire prolapses out of it into the
//    circumflex, and the four solutions of pm-wiring-tortuosity are offered
//    (another wire or a larger bend, a straight, angulated or dual-lumen
//    microcatheter, the reversed hairpin wire, a deflection balloon); a
//    support wire makes pseudolesions at the bends. The marginal itself is
//    about 1.7 mm wide in this tree, below a stenting reference (the angioPci
//    test requires a target reference above 2 mm), so the treated lesion is
//    the circumflex at its origin rather than the marginal.
//  - wiring-ladder: wire navigation as an exercise (pm-wiring-navigate): a
//    mid-to-distal LAD lesion past the diagonals and septal perforators. Its
//    held-out exam variants (XA..XD in wiring.launch.ts) are for now seeds of
//    the same case: only the wire's random draws differ (resolveScenario
//    applies no per-seed change to the lesion; a different task per variant
//    needs scenarios/generate.ts). actions/wire.ts wiringScore gives what the
//    exercise is to be scored on (off-route entries, time and contrast); the
//    exam debrief does not call it yet (actions/debrief.ts).
//
// The anatomy is the lab's generic tree (the renderer's tree has no
// tortuosity control yet): the circumflex's own bends and the second obtuse
// marginal's take-off in this tree are what make the case. tortuosity: 2 is
// declared for the case model, not drawn. The lesion values are teaching
// values of a synthetic case.
// ---------------------------------------------------------------------------

import type { PciAnatomyDef, PciScenarioDef } from "../types";
import { STANDARD_PCI_STARTS } from "./core";

const starts = () => STANDARD_PCI_STARTS.map((s) => ({ ...s }));

const ANATOMY: PciAnatomyDef = { dominance: "right", rootSize: "normal", tortuosity: 2, variants: [] };

export const scenarios: PciScenarioDef[] = [
  {
    id: "lcx-om-tortuous",
    title: "Tortuous circumflex: angulated obtuse marginal",
    brief:
      "Synthetic case. 66-year-old woman with exertional angina and lateral ischaemia on perfusion imaging. The circumflex is tortuous; a severe stenosis lies just beyond the origin of the second obtuse marginal, which leaves the circumflex at an acute angle. Wire the marginal before the circumflex is treated.",
    epa: "pci-simple",
    difficulty: 4,
    side: "left",
    anatomy: { ...ANATOMY },
    lesions: [
      {
        vessel: "LCx",
        position: 0.635,
        severity: 75,
        lengthMm: 10,
        kind: "severe-stenosis",
        calcium: 0,
        sites: ["bifurcation"],
        branchAt: 0,
        // the marginal's take-off in this tree: about 96 degrees from the circumflex, about 1.7 mm wide (teaching values)
        sideBranch: { vessel: "OM2", angleDeg: 96, diameterMm: 1.7 },
        role: "target",
      },
    ],
    patient: { accessRoute: "radial-right" },
    setup: { guideDefault: "EBU3.5", french: 6, heparinised: true, guideInRoot: true },
    starts: starts(),
    views: ["raocaudal", "laocaudal", "ap"],
    points: [
      "Wire the marginal first in a caudal view, turning the tip towards it only at its origin; then wire the circumflex.",
      "When the wire prolapses into the circumflex, change the wire or the bend, support it with a microcatheter, reverse it into a hairpin, or deflect it with a balloon beyond the origin.",
      "A support wire straightens the bends into pseudolesions: give intracoronary nitrate, then withdraw the wire partly, keeping its soft segment across the lesion, before any stent.",
    ],
  },
  {
    id: "wiring-ladder",
    title: "Wiring exercise: mid-to-distal LAD",
    brief:
      "Synthetic case. 61-year-old man with stable angina; a stenosis in the mid-to-distal LAD beyond the second diagonal. The task is the wiring: choose the views, keep the tip free, avoid the side branches and park the wire safely.",
    epa: "pci-simple",
    difficulty: 3,
    side: "left",
    anatomy: { dominance: "right", rootSize: "normal", tortuosity: 1, variants: [] },
    lesions: [{ vessel: "LAD", position: 0.55, severity: 85, lengthMm: 12, kind: "severe-stenosis", calcium: 0, role: "target" }],
    patient: { accessRoute: "radial-right" },
    setup: { guideDefault: "EBU3.5", french: 6, heparinised: true, guideInRoot: true },
    starts: starts(),
    views: ["raocranial", "apcranial", "laocranial"],
    points: [
      "Choose a view that opens the next branch point before you steer at it; store a reference frame.",
      "Use small intermittent injections, keep the tip free, and confirm the distal position in an orthogonal view.",
      "Park the tip in a safe distal segment and keep it in view while devices move.",
    ],
  },
];
