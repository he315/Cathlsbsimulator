// ---------------------------------------------------------------------------
// The PCI lab's budget event sources (pci-budgets-stop-rules).
//
// They read the budget read-out of the snapshot (PciLabSession.snapshot().budget,
// from src/simulation/pci/budgets.ts):
//  - high-contrast-volume from the moment the contrast total crosses the
//    warning threshold (80% of the patient's ceiling by default: the stricter
//    of Brilakis's and Oxford's rules, a lower plan, recent contrast
//    subtracted), held for the rest of the case and kept at finish;
//  - high-radiation-dose from the moment the air kerma reaches the limit
//    (5 Gy by default, configurable at the brief) or another substantial
//    radiation dose level, held and kept at finish.
// The session also holds both events in its event log (the base sources read
// those holds); these sources make the tip context a pure function of a
// snapshot that carries a budget read-out. The CTO progress state (crossed or
// not) is in the read-out for the CTO stop-rule tips and the checkpoint.
// ---------------------------------------------------------------------------

import type { BudgetReadout } from "../../../simulation/pci/budgets";
import { raisesFrom } from "./base";
import type { PciEventSource, PciTipSnapshot } from "./index";

/** The budget read-out of a snapshot, when it carries one (the session's does). */
export function budgetOf(snap: PciTipSnapshot): BudgetReadout | null {
  const b = (snap as PciTipSnapshot & { budget?: BudgetReadout }).budget;
  return b && typeof b === "object" && b.contrast && b.radiation ? b : null;
}

const contrastHigh = (snap: PciTipSnapshot) => !!budgetOf(snap)?.contrast.warned;
const radiationHigh = (snap: PciTipSnapshot) => !!budgetOf(snap)?.radiation.high;

export const PCI_EVENT_SOURCES: readonly PciEventSource[] = [
  { event: "high-contrast-volume", active: contrastHigh, finish: contrastHigh },
  { event: "high-radiation-dose", active: radiationHigh, finish: radiationHigh },
];

export const raises = raisesFrom(PCI_EVENT_SOURCES);
