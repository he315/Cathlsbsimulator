// ---------------------------------------------------------------------------
// The PCI lab's inflation event sources (pci-indeflator).
//
// What the indeflator and the lesion's response to it give the tips:
//   balloon-undilatable  a balloon in the lesion keeping a waist at or above its
//                        rated burst pressure after a hold of the rule's length
//                        (MP_UNDILATABLE_HOLD_S, src/simulation/pci/actions/inflation.ts),
//                        while it is held and for a while after the deflation
//                        that recorded it: the waist the operator sees
//   balloon-rupture      the needle fell above the drawn burst pressure, while the
//                        ruptured balloon is still on the wire and for a while after
//   stent-underexpanded  a placed stent below the model's expansion ratio
//                        (MP_STENT_EXPANSION_RATIO) at the lesion, until a run's
//                        assessment stands (imaging then measures it: ./imaging.ts)
//   stent-recoil         a placed stent that expanded and then lost diameter at an
//                        aorto-ostial lesion, until a post-dilatation opens it
// Slow flow and dissection after a predilatation come through the complication
// engine and are raised by base.ts (slow-flow as a cue; dissection once named).
// The phases these events belong to (lesion-prep for balloons, stent for the
// stent's delivery balloon, optimise after it) are set by the tip context's
// machine (src/ui/lab/pciTips.ts); `raises` declares them with the events, derived
// from PCI_EVENT_SOURCES (raisesFrom), for the reachability report.
// ---------------------------------------------------------------------------

import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { PciState } from "../../../simulation/pci/state";
import { MP_STENT_EXPANSION_RATIO, stentExpansionRatio, undilatableAt } from "../../../simulation/pci/actions/inflation";
import { raisesFrom } from "./base";
import { standingAssessment } from "./imaging";
import type { PciEventSource, PciTipSnapshot } from "./index";

/** How long a recorded undilatable inflation or a rupture stays raised after it (s, procedure clock) — MODEL PARAMETER. */
export const INFLATION_EVENT_HOLD_S = 30;

/** Procedure time of the last telemetry record of `kind`, or null. */
function lastRecord(st: PciState, kind: string): number | null {
  for (let i = st.log.length - 1; i >= 0; i--) if (st.log[i].kind === kind) return st.log[i].t;
  return null;
}

/** The calcium grade of the active target lesion (the definition's), 0 when the snapshot has none. */
function targetCalcium(snap: PciTipSnapshot): 0 | 1 | 2 {
  const d = snap.definition;
  if (!d?.lesions?.length) return 0;
  const idx = snap.scenario?.targetIdx ?? d.target ?? Math.max(0, d.lesions.findIndex((l) => l.role === "target"));
  return (d.lesions[idx]?.calcium ?? 0) as 0 | 1 | 2;
}

/** Stents over the target lesion's span. */
function stentsOverLesion(snap: PciTipSnapshot) {
  const L = snap.lesion;
  return snap.state.stents.filter((p) => p.route.includes(L.vessel) && p.fromMm <= L.endMm && p.toMm >= L.startMm);
}

export const PCI_EVENT_SOURCES: readonly PciEventSource[] = [
  {
    event: "balloon-undilatable",
    holdS: INFLATION_EVENT_HOLD_S,
    active: (snap) => {
      if (undilatableAt(snap.state, snap.lesion, targetCalcium(snap))) return true;
      // the last deflation recorded it, and the same balloon (its catalogue entry and size) is still on the
      // wire: another balloon loaded after it has not been tried
      const log = snap.state.log;
      const dev = snap.state.device;
      if (!dev || dev.kind !== "balloon") return null;
      for (let i = log.length - 1; i >= 0; i--) {
        const e = log[i];
        // a balloon removed or loaded since: not the balloon that was tried
        if (e.kind === "device" && (e.data.action === "load" || e.data.action === "remove")) return null;
        if (e.kind === "balloon-undilatable") return dev.specId === e.data.specId && dev.diameter === e.data.diameter ? e.t : null;
      }
      return null;
    },
  },
  {
    event: "balloon-rupture",
    holdS: INFLATION_EVENT_HOLD_S,
    active: (snap) => (snap.state.device?.ruptured ? true : lastRecord(snap.state, "balloon-rupture")),
  },
  {
    event: "stent-underexpanded",
    active: (snap) => standingAssessment(snap.state) === null && stentsOverLesion(snap).some((p) => !p.recoilMm && stentExpansionRatio(p) < MP_STENT_EXPANSION_RATIO),
  },
  {
    event: "stent-recoil",
    active: (snap) => snap.state.stents.some((p) => (p.recoilMm ?? 0) > 0),
  },
];

export const raises: LabRaises = raisesFrom(PCI_EVENT_SOURCES, { phases: ["lesion-prep", "stent", "optimise"] });
