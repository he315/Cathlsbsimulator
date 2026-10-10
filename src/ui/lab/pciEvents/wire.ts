// ---------------------------------------------------------------------------
// The PCI lab's wire and microcatheter event sources (pci-wire-microcatheter).
//
// Read from one snapshot (PciTipSnapshot, ./index.ts), like the base sources:
//  - microcatheter-needed: the wire has stalled at the lesion MICRO_NEEDED_STALLS
//    times with a workhorse and no microcatheter behind it since the last wire
//    or microcatheter was loaded (the plan's design value);
//  - microcatheter-removal: a microcatheter that has been in the vessel since
//    it was loaded, withdrawn into the guide over a short wire still in the
//    vessel (the operator is about to remove it), and for a while after a
//    removal (a microcatheter just loaded and still parked in the guide does
//    not raise it);
//  - wire-out-of-guide: the wire tip has just left the guide into the coronary;
//  - second-wire-with-device: a second wire (buddy) with a balloon or stent in
//    the guide, or a wire loaded while one is there;
//  - new-narrowing-tortuous: a support wire's stiff shaft has straightened the
//    bends into pseudolesions, shown by an injection since they appeared that
//    fills them (a selective microcatheter injection fills only the vessel
//    beyond its tip, so it shows only the sites beyond it);
//  - wire-prolapse: held for a while after the wire prolapsed out of a branch
//    (the base source covers the fold itself).
// A deformed (over-rotated) microcatheter is logged to the operator; it raises
// no event of its own (equipment-entrapment would bring up the unrelated
// entrapment bail-outs; pci-microcath-no-overspin is reached through
// microcatheter-needed).
// The base sources already raise wire-side-branch, wire-subintimal (behind the
// recognition gate), wire-distal-position and wire-prolapse while folded.
//
// `raises` is derived from PCI_EVENT_SOURCES (raisesFrom), so the reachability
// report reads what this file actually detects.
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { PciState } from "../../../simulation/pci/state";
import { EXCHANGE_LENGTH_CM, SHORT_WIRE_CM } from "../../../simulation/pci/coronaryWire";
import { raisesFrom } from "./base";
import type { PciEventSource, PciTipSnapshot } from "./index";

/**
 * Stalls at the lesion with a workhorse and no microcatheter that raise microcatheter-needed. MODEL
 * PARAMETER: the plan's design value (lab-build-plan.json, pci-wire-microcatheter: three stalled pushes).
 */
export const MICRO_NEEDED_STALLS = 3;

/** Telemetry kinds after which the stall count starts again (a new wire or a microcatheter on the wire). */
const RESET_KINDS = new Set(["micro-load", "wire-loaded", "wire-exchange"]);

/** The log index of the last telemetry record of a kind, or -1. */
function lastIndex(st: PciState, kind: string): number {
  for (let i = st.log.length - 1; i >= 0; i--) if (st.log[i].kind === kind) return i;
  return -1;
}

/** The time (state.t) of the last telemetry record of a kind that passes `pred`, or null. */
function lastTele(st: PciState, kind: string, pred?: (d: Record<string, unknown>) => boolean): number | null {
  for (let i = st.log.length - 1; i >= 0; i--) {
    const r = st.log[i];
    if (r.kind === kind && (!pred || pred(r.data))) return r.t;
  }
  return null;
}

/** Stalls at the lesion with a workhorse and no microcatheter behind the tip, since the last wire or microcatheter was loaded. */
export function stallsWithoutMicro(st: PciState): number {
  let n = 0;
  for (let i = st.log.length - 1; i >= 0; i--) {
    const r = st.log[i];
    if (RESET_KINDS.has(r.kind)) break;
    if (r.kind === "wire-stall" && r.data.atLesion === true && r.data.micro !== true && r.data.kind === "workhorse") n++;
  }
  return n;
}

/** A balloon or stent on the wire inside the guide (backloaded or in the guide, not yet out of it). */
function deviceInGuide(st: PciState): boolean {
  const d = st.device;
  return !!d && (d.stage === "backloaded" || (d.stage === "in-guide" && d.centreMm + d.lengthMm / 2 <= 0));
}

export const PCI_EVENT_SOURCES: readonly PciEventSource[] = [
  {
    event: "microcatheter-needed",
    active: (snap: PciTipSnapshot) => {
      const st = snap.state;
      const micro = st.wire.micro;
      return !st.wire.crossed && !(micro && micro.tipMm > 0) && stallsWithoutMicro(st) >= MICRO_NEEDED_STALLS;
    },
  },
  {
    event: "microcatheter-removal",
    active: (snap) => {
      const st = snap.state;
      const m = st.wire.micro;
      // only a microcatheter that has left the guide since it was loaded (one just loaded is parked in the guide)
      const usedInVessel = !!m && lastIndex(st, "micro-left-guide") > lastIndex(st, "micro-load");
      if (m && usedInVessel && m.tipMm <= 0 && st.tipMm > 0 && (st.wire.lengthCm ?? SHORT_WIRE_CM) < EXCHANGE_LENGTH_CM) return true;
      return lastTele(st, "micro-removal");
    },
  },
  { event: "wire-out-of-guide", active: (snap) => lastTele(snap.state, "wire-out-of-guide") },
  {
    event: "second-wire-with-device",
    active: (snap) => {
      const st = snap.state;
      if (st.guide.buddy && deviceInGuide(st)) return true;
      return lastTele(st, "wire-loaded", (d) => d.deviceInGuide === true) ?? lastTele(st, "wire-exchange", (d) => d.deviceInGuide === true);
    },
  },
  {
    event: "new-narrowing-tortuous",
    active: (snap) => {
      const st = snap.state;
      const p = st.wiring?.pseudo;
      if (!p || st.lastInjectionT === null || st.lastInjectionT < p.since) return false;
      // a selective microcatheter injection fills only the vessel beyond its tip: it shows only the sites beyond it
      const mi = st.wiring?.microInjection;
      const viaMicro = !!mi && mi.t === st.lastInjectionT;
      return !viaMicro || p.sites.some((s) => s.atMm >= mi!.fromMm);
    },
  },
  { event: "wire-prolapse", active: (snap) => lastTele(snap.state, "wire-prolapse") },
];

/** The events this file raises (for the reachability report), with the phase its events belong to. */
export const WIRE_EVENTS: readonly LabEvent[] = PCI_EVENT_SOURCES.map((s) => s.event);

export const raises: LabRaises = raisesFrom(PCI_EVENT_SOURCES, { phases: ["wire"] });
