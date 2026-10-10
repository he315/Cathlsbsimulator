// ---------------------------------------------------------------------------
// The PCI lab's flow-failure and closure event sources (pci-flow-closure).
//
// Read from one snapshot (PciTipSnapshot, ./index.ts), like the base sources.
// The complication's own events (no-reflow, thrombus, air, dissection,
// acute-closure, aortocoronary-dissection) come from the base and recognition
// sources; this file adds what tells the flow and closure states apart:
//  - no-reflow-refractory: a no-reflow the learner has named, after two
//    distal vasodilator doses without a rise in TIMI grade
//    (noReflow.REFRACTORY_DISTAL_DOSES, cm-flow-embolism#1);
//  - plaque-embolisation: a no-reflow the learner has named whose embolus is
//    plaque debris, not thrombus (cm-flow-embolism#10);
//  - new-narrowing (a cue): a new narrowing on the image, a pseudolesion at a
//    bend or a spasm, once a guide injection made since it appeared has shown
//    it;
//  - coronary-spasm: a spasm the learner has named (an assessment naming spasm
//    since it began; spasm is not one of the complication engine's kinds, so
//    the assessment's own record is read: bailouts.spasmRecognised);
//  - acute-closure and slow-flow for a spasm that closes or slows the vessel:
//    acute-closure once named, slow-flow (a cue) once a run has shown it;
//  - wire-subintimal: a re-crossed wire the learner has found in the false
//    lumen, by checking the microcatheter's backflow or injecting through it
//    with its tip beyond the flap (what the operator sees: no blood back, a
//    stain that does not clear).
// None of these is gated by snap.recognised: each checks the learner's
// assessment itself (the recognition gate's list holds only the engine's
// complication events), so before the assessment only cues are raised.
// Bradycardia, st-elevation and hypotension come from the patient adapter
// (base.ts), driven by what the complications do to the patient engine.
//
// `raises` is derived from PCI_EVENT_SOURCES (raisesFrom), with the phases
// these events belong to.
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { PciState } from "../../../simulation/pci/state";
import type { Complication } from "../../../simulation/complications/types";
import { causeRecognised } from "../../../simulation/complications/engine";
import { MP_SPASM, activeSpasms, spasmRecognised } from "../../../simulation/pci/actions/bailouts";
import { raisesFrom } from "./base";
import type { PciEventSource, PciTipSnapshot } from "./index";

const open = (c: Complication) => c.stage === "overt" || c.stage === "prodrome" || c.stage === "treated";
const namedNoReflow = (st: PciState, f: (c: Complication) => boolean) => st.cx.list.some((c) => c.kind === "no-reflow" && open(c) && causeRecognised(c) && f(c));

/** A guide injection made at or after `t` (the image has shown what changed then). */
const shownSince = (st: PciState, t: number) => st.lastInjectionT !== null && st.lastInjectionT >= t - 1e-9;

/** A selective microcatheter injection fills only the vessel beyond its tip. */
function guideRun(st: PciState): boolean {
  const mi = st.wiring?.microInjection;
  return !(mi && mi.t === st.lastInjectionT);
}

/** A new narrowing is on the image: pseudolesions or a spasm, shown by a guide run since they appeared. */
function newNarrowingShown(st: PciState): boolean {
  if (!guideRun(st)) return false;
  const p = st.wiring?.pseudo;
  if (p && shownSince(st, p.since)) return true;
  return activeSpasms(st).some((sp) => shownSince(st, sp.since));
}

/** The learner has found the wire in the false lumen: a backflow check or an injection through the microcatheter beyond the flap. */
function subintimalFound(st: PciState): number | null {
  const sub = st.wire.subintimal;
  if (!sub) return null;
  for (let i = st.log.length - 1; i >= 0; i--) {
    const r = st.log[i];
    if (r.kind === "micro-backflow" && r.data.blood === false) return r.t;
    if (r.kind === "micro-injection" && r.data.subintimal === true) return r.t;
    if (r.kind === "wire-subintimal") break;
  }
  return null;
}

export const PCI_EVENT_SOURCES: readonly PciEventSource[] = [
  { event: "no-reflow-refractory", active: (snap: PciTipSnapshot) => namedNoReflow(snap.state, (c) => !!c.data.refractoryRaised), finish: (snap) => snap.state.cx.list.some((c) => c.kind === "no-reflow" && !!c.data.refractoryRaised) },
  { event: "plaque-embolisation", active: (snap) => namedNoReflow(snap.state, (c) => !!c.data.plaque), finish: (snap) => snap.state.cx.list.some((c) => c.kind === "no-reflow" && !!c.data.plaque && c.tOvert !== null) },
  { event: "new-narrowing", active: (snap) => newNarrowingShown(snap.state) },
  { event: "coronary-spasm", active: (snap) => spasmRecognised(snap.state), finish: (snap) => snap.state.log.some((r) => r.kind === "spasm") },
  { event: "acute-closure", active: (snap) => spasmRecognised(snap.state) && activeSpasms(snap.state).some((sp) => sp.severity >= MP_SPASM.closurePct) },
  { event: "slow-flow", active: (snap) => guideRun(snap.state) && activeSpasms(snap.state).some((sp) => sp.severity >= MP_SPASM.slowPct && shownSince(snap.state, sp.since)) },
  { event: "wire-subintimal", active: (snap) => subintimalFound(snap.state) !== null },
];

/** The events this file raises (for the reachability report). */
export const FLOW_EVENTS: readonly LabEvent[] = PCI_EVENT_SOURCES.map((s) => s.event);

export const raises: LabRaises = raisesFrom(PCI_EVENT_SOURCES, { phases: ["wire", "lesion-prep", "stent", "imaging", "complication"] });
