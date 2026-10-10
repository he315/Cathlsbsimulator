// ---------------------------------------------------------------------------
// The PCI lab's pressure-wire event source (pci-pressure-wire-console).
//
// Read from one snapshot (PciTipSnapshot, ./index.ts), like the base sources:
//  - side-branch-compromise: the operator has the pressure wire in a side
//    branch whose ostium a stent has pinched (the complication engine's
//    side-branch compromise, not resolved), that is, the operator is measuring
//    the jailed branch (src/simulation/pci/actions/pressure.ts
//    pwJailedBranchMeasured). Wiring that branch is the operator's own act, so
//    the event names nothing the learner has not chosen to look at; the base
//    source still names an unrecognised compromise only once recognised.
// The phase 'physiology' (the pressure wire loaded) is set by the tip context
// (src/ui/lab/pciTips.ts); this file reports it with its event for the
// reachability report.
//
// `raises` is derived from PCI_EVENT_SOURCES (raisesFrom), so the reachability
// report reads what this file actually detects.
// ---------------------------------------------------------------------------

import type { LabRaises } from "../../../content/lab/raisable/waiting";
import { pwJailedBranchMeasured } from "../../../simulation/pci/actions/pressure";
import { raisesFrom } from "./base";
import type { PciEventSource } from "./index";

export const PCI_EVENT_SOURCES: readonly PciEventSource[] = [{ event: "side-branch-compromise", active: (snap) => pwJailedBranchMeasured(snap.state) }];

/** The events this file raises (for the reachability report), with the phase its events belong to. */
export const raises: LabRaises = raisesFrom(PCI_EVENT_SOURCES, { phases: ["physiology"] });
