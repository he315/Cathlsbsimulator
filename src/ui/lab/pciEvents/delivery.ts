// ---------------------------------------------------------------------------
// The PCI lab's device delivery event sources (pci-device-delivery).
//
// Read from one snapshot (PciTipSnapshot, ./index.ts), like the base sources:
//  - subclavian-tortuosity: the case is done by the radial route with a
//    tortuous subclavian (the scenario's anatomy variant; arteria lusoria by
//    the right radial counts too, as in the diagnostic lab's context), a case
//    property held for the run (the stuck-stent case, eq-sheaths-guides#1).
// What else the delivery work raises comes from the base sources, which read
// the records actions/devices.ts writes: stent-uncrossable and
// balloon-uncrossable (the device stopped at or in the lesion, the stall
// zone of 2 mm before its proximal edge), guide-backout and poor-guide-support
// (the 'guide-backout' record with its forces, a device push or a guide
// extension's), extension-in-place (the extension beyond the guide tip),
// wire-distal-position (an unpinned wire dragged into the distal danger zone)
// and pressure-damped (an extension in the vessel damps the trace,
// patientBridge.tipFromGuide).
//
// `raises` is derived from PCI_EVENT_SOURCES (raisesFrom), so the
// reachability report reads what this file actually detects.
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import { raisesFrom } from "./base";
import type { PciEventSource, PciTipSnapshot } from "./index";

/** What the delivery sources read of the engine scenario beyond the snapshot's typed fields (PciRuntimeScenario carries them). */
interface ScenarioRoute {
  accessRoute?: string;
  anatomy?: { variants?: readonly string[] };
}

/** The case is done by the radial route through a tortuous subclavian (or an arteria lusoria from the right). */
export function radialSubclavianTortuosity(snap: PciTipSnapshot): boolean {
  const sc = snap.scenario as (PciTipSnapshot["scenario"] & ScenarioRoute) | undefined;
  const route = sc?.accessRoute;
  if (!route || !route.startsWith("radial")) return false;
  const variants = sc?.anatomy?.variants ?? [];
  return variants.includes("tortuous-subclavian") || (variants.includes("arteria-lusoria") && route === "radial-right");
}

export const PCI_EVENT_SOURCES: readonly PciEventSource[] = [{ event: "subclavian-tortuosity", active: (snap) => radialSubclavianTortuosity(snap), finish: "active" }];

/** The events this file raises. */
export const DELIVERY_EVENTS: readonly LabEvent[] = PCI_EVENT_SOURCES.map((s) => s.event);

export const raises: LabRaises = raisesFrom(PCI_EVENT_SOURCES);
