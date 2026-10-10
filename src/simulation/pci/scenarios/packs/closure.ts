// ---------------------------------------------------------------------------
// Flow failure and abrupt closure scenario pack (pci-flow-closure).
//
//  - rca-aortocoronary: the aortocoronary dissection of cm-principles-closure#5.
//    A proximal RCA lesion treated through an Amplatz left guide; the case
//    opens just after a forceful injection through the deep, wedged guide has
//    stained the right sinus ('sinus-stain'). The learner stops injecting into
//    the RCA, keeps the wire, seals the ostium with a stent protruding 1-2 mm
//    into the aorta and checks the distal vessel without a guide injection;
//    every further RCA injection enlarges the stain
//    (src/simulation/complications/dissection.ts). The request's 8 Fr guide is
//    a 7 Fr here: the engine models 6 and 7 Fr. The plan names this scenario
//    'rca-ostial', which pci-ostial will create for the ostial lesion; this
//    pack keeps its own id so the two never collide.
//    The scenario title is a neutral case name (it shows in the brief, the plan
//    header and the scenario list before any assessment); the diagnosis is named
//    only in the lesson links, which are practice. The start opens with the guide
//    already backed off to a free, coaxial seat (the damping came before the
//    stain), so the trace is not damped: the attending does not block the
//    learner's injections, each further RCA injection visibly enlarges the stain,
//    and the debrief can count the injections given after it.
//
// The other flow and closure starts open the core pack's cases (lcx-stemi,
// rca-calcified, lad-focal) at their 'wire-across' start with a variant that
// closure.launch.ts declares: the core pack (owned by pci-scenario-registry)
// cannot gain starts from here, and the lab opens a variant on any scenario.
// What every start changes in the state is in
// src/simulation/pci/actions/bailouts.ts (applyFlowStart), which the lab
// applies after startPci.
//
// The anatomy is the lab's generic tree; lesion values, guide and views are
// teaching values of a synthetic case.
// ---------------------------------------------------------------------------

import type { PciScenarioDef, PciStartDef } from "../types";
import { STANDARD_PCI_STARTS } from "./core";

/**
 * The sinus-stain start: the wire across, just after the injection that stained the sinus, with the guide
 * backed off from its deep seat (bailouts.ts MP_FLOW_START). Its phase is the wire-across start's: the stain is a complication the learner has not yet assessed,
 * so the tips stay at lesion preparation until the assessment names it (src/ui/lab/pciTips.ts).
 */
export const SINUS_STAIN_START: PciStartDef = { id: "sinus-stain", title: "Contrast staining the right sinus after a forceful injection", phase: "lesion-prep", guideEngaged: true, wire: "across" };

export const scenarios: PciScenarioDef[] = [
  {
    id: "rca-aortocoronary",
    title: "Proximal RCA stenosis through an Amplatz guide",
    brief:
      "Synthetic case. 67-year-old man with class III angina and a severe proximal RCA stenosis. An Amplatz left guide was chosen for support; it dived deep into the RCA and a forceful injection was given through it while the pressure was damped. The guide has since been eased back out of the deep seat.",
    epa: "complication-bailout",
    difficulty: 4,
    side: "right",
    anatomy: { dominance: "right", rootSize: "normal", tortuosity: 0, variants: [] },
    lesions: [{ vessel: "RCA", position: 0.14, severity: 80, lengthMm: 10, kind: "severe-stenosis", calcium: 1, role: "target" }],
    patient: { accessRoute: "femoral" },
    setup: { guideDefault: "AL1", guidesAcceptable: ["AL2", "JR4"], french: 7, heparinised: true },
    starts: [{ ...SINUS_STAIN_START }, ...STANDARD_PCI_STARTS.map((s) => ({ ...s }))],
    views: ["rcalao", "rcarao", "apcranial"],
    points: [
      "Contrast staining from the RCA ostium into the sinus: stop injecting into the RCA and keep the wire.",
      "Seal the entry with an ostial stent protruding 1-2 mm into the aorta, checked with intravascular imaging.",
      "Check the distal vessel without a guide injection, then image the aorta and keep the blood pressure controlled.",
    ],
  },
];
