// ---------------------------------------------------------------------------
// The PCI lab's guide engagement event sources (pci-guide-engagement).
//
// Read from one snapshot (PciTipSnapshot, ./index.ts), like the base sources:
//  - engage-fail: the guide has been near the case's ostium without engaging
//    for GUIDE_ENGAGE_FAIL_S on the procedure clock;
//  - catheter-too-deep: an engaged guide deeper than GUIDE_TOO_DEEP_MM;
//  - non-coaxial: an engaged guide less coaxial than GUIDE_NON_COAXIAL (turned
//    against the wall);
//  - conus-selective: the guide's tip has slipped into the conus;
//  - catheter-kink and torque-not-transmitted: the shaft has kinked, or holds
//    enough twist that the tip no longer follows the hub (the same read-out
//    the diagnostic lab raises them from);
//  - aorto-ostial-lesion: the active target sits at the ostium of the left
//    main or the right coronary (the rule of actions/imaging.ts aortoOstial),
//    a case property held for the run.
// pressure-damped and pressure-ventricularised come from the guide pressure
// trace (the base sources), which the guide's seat sets through
// patientBridge.tipFromGuide; the wire the guide sends into the conus or the
// circumflex raises wire-side-branch through the base sources. The phase
// 'guide' is the tip context's while the guide is out of the ostium.
//
// `raises` is derived from PCI_EVENT_SOURCES (raisesFrom), so the reachability
// report reads what this file actually detects.
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import { GUIDE_ENGAGE_FAIL_S, GUIDE_NON_COAXIAL, GUIDE_TOO_DEEP_MM, torqueNotTransmitted } from "../../../simulation/pci/guide";
import { raisesFrom } from "./base";
import type { PciEventSource, PciTipSnapshot } from "./index";

/** The target lesion lies at the origin of the left main or the right coronary (actions/imaging.ts aortoOstial: within 5 mm). */
export const AORTO_OSTIAL_MM = 5;

export function aortoOstialTarget(snap: PciTipSnapshot): boolean {
  return (snap.lesion.vessel === "RCA" || snap.lesion.vessel === "LM") && snap.lesion.startMm <= AORTO_OSTIAL_MM;
}

export const PCI_EVENT_SOURCES: readonly PciEventSource[] = [
  {
    event: "engage-fail",
    active: (snap) => {
      const gs = snap.state.guide;
      return !gs.engaged && gs.nearSince !== undefined && gs.nearSince !== null && snap.state.t - gs.nearSince >= GUIDE_ENGAGE_FAIL_S;
    },
  },
  { event: "catheter-too-deep", active: (snap) => snap.state.guide.engaged && snap.state.guide.depthMm > GUIDE_TOO_DEEP_MM },
  { event: "non-coaxial", active: (snap) => snap.state.guide.engaged && snap.state.guide.coaxial < GUIDE_NON_COAXIAL },
  { event: "conus-selective", active: (snap) => !snap.state.guide.engaged && snap.state.guide.zone === "conus" },
  { event: "catheter-kink", active: (snap) => !!snap.state.guide.kinked },
  { event: "torque-not-transmitted", active: (snap) => torqueNotTransmitted(snap.state.guide) },
  { event: "aorto-ostial-lesion", active: (snap) => aortoOstialTarget(snap), finish: "active" },
];

/** The events this file raises. */
export const GUIDE_EVENTS: readonly LabEvent[] = PCI_EVENT_SOURCES.map((s) => s.event);

export const raises: LabRaises = raisesFrom(PCI_EVENT_SOURCES, { phases: ["guide"] });
