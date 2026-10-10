// ---------------------------------------------------------------------------
// Technique-tip context for the fluoroscopic PCI lab (pci-tip-context): the
// phase the operator is at and the events the lab detects, in the vocabulary
// of src/content/lab/tips.ts, as a pure function of one snapshot of the lab
// (PciTipSnapshot: PciLabSession.snapshot(), or a test's own).
//
// Phases, first match wins:
//   plan          the case brief or the plan form is open, or no guide is up yet
//   finish        the sign-out or the debrief (finishing, finished)
//   complication  a complication the learner has recognised (an edge flap
//                 alone with a stent in keeps the optimise phase; a recognised
//                 subintimal wire is not a complication), or haemodynamic
//                 compromise (COMPROMISE_EVENTS)
//   guide         the guide is not engaged (or is being re-engaged)
//   physiology    a pressure wire is in use
//   wire          the wire is not across the active lesion (a wire across it
//                 that ran on into a branch beyond it is across)
//   imaging       an imaging catheter is on the wire (imaging 'ivus' or 'oct')
//   stent         an undeployed stent is in the guide or the coronary
//   optimise      a stent has been placed
//   lesion-prep   otherwise
// Events come from PCI_EVENT_SOURCES (src/ui/lab/pciEvents/*.ts, by glob): a
// source that reports when its event last occurred holds it for its holdS
// (TRANSIENT_HOLD_S) on the procedure clock instead of latching it. Before the
// learner recognises a complication only its cue events are raised (slow-flow,
// and st-elevation, chest-pain and hypotension from the patient), and a
// subintimal wire is named only once recognised; at finish
// every complication, dose and contrast event that occurred is kept, with the
// case events (cto, bifurcation...). 'total-occlusion' is raised only for an
// acute occlusion, never in a CTO case. technique and step come from the
// technique machine when one is active.
// ---------------------------------------------------------------------------

import type { PciState } from "../../simulation/angioPci";
import type { LabContext, LabEvent, TipVessel } from "../../content/lab/tips";
import type { PressureKind } from "../../types";
import { PCI_EVENT_SOURCES, type PciEventSource, type PciTipSnapshot } from "./pciEvents/index";
import {
  COMPROMISE_EVENTS,
  RECOGNISED_NOT_COMPLICATION,
  TRANSIENT_HOLD_S,
  caseEventsOf,
  imagingOf,
  procedureTime,
  recognisedEvent,
  wireAcross,
  type PciTipPhase,
} from "./pciEvents/base";

export type { PciEventSource, PciTipSnapshot } from "./pciEvents/index";

// local copy of TIP_VESSELS so this chunk does not import the curriculum registry
const TIP_VESSEL_IDS: readonly TipVessel[] = ["LM", "LAD", "LCx", "RCA", "SVG", "LIMA", "RIMA", "radial-graft"];
// local copy of the pressure classes (src/types/index.ts PressureKind) the context passes on
const PRESSURE_KINDS: readonly PressureKind[] = ["aortic", "lv", "damped", "ventricularised", "wedged", "noisy", "dissected"];

export interface PciLesionRef {
  vessel: string;
  startMm: number;
  endMm: number;
}

/** Is a source's event active in this snapshot (a returned time is held for holdS)? */
export function sourceActive(src: PciEventSource, snap: PciTipSnapshot): boolean {
  const a = src.active(snap);
  if (typeof a === "number") return Number.isFinite(a) && procedureTime(snap) - a <= (src.holdS ?? TRANSIENT_HOLD_S);
  return !!a;
}

const flag = (inject: boolean | undefined, workflow: boolean | undefined) => (inject !== undefined ? inject : !!workflow);

/** The phase from the snapshot and the complication events raised (see the header). */
function phaseOf(snap: PciTipSnapshot, recognised: readonly LabEvent[], active: readonly LabEvent[]): PciTipPhase {
  const st = snap.state;
  // the named complications (a recognised subintimal wire is named but is still wiring)
  const named = recognised.filter((e) => !RECOGNISED_NOT_COMPLICATION.includes(e));
  if (flag(snap.prebriefOpen, snap.workflow?.prebriefOpen) || snap.planOpen || snap.guideIntroduced === false) return "plan";
  if (flag(snap.finishing, snap.workflow?.finishing) || snap.workflow?.finished || st.finished) return "finish";
  // with a stent in, an edge flap alone is an optimisation finding, not a reason to leave the optimise phase
  const edgeFlapOnly =
    st.stents.length > 0 &&
    named.length > 0 &&
    named.every((e) => e === "dissection") &&
    st.cx.list.filter((c) => c.kind === "dissection" && (c.stage === "overt" || c.stage === "prodrome")).every((c) => c.cause.includes("edge"));
  if ((named.length > 0 && !edgeFlapOnly) || active.some((e) => COMPROMISE_EVENTS.includes(e))) return "complication";
  if (!st.guide.engaged) return "guide";
  if (st.pressure !== null || st.wireKind === "pressure") return "physiology";
  if (!wireAcross(snap)) return "wire";
  if (imagingOf(snap)) return "imaging";
  if ((st.device?.kind === "stent" || st.device?.kind === "covered-stent") && !st.device.deployed) return "stent";
  if (st.stents.length > 0) return "optimise";
  return "lesion-prep";
}

/** The context from a snapshot (the sources default to the registry's). */
function contextOf(snap: PciTipSnapshot, sources: readonly PciEventSource[]): LabContext {
  const caseEvents = caseEventsOf(snap);
  const active: LabEvent[] = [];
  const named: LabEvent[] = [];
  const finishKeep: LabEvent[] = [];
  for (const src of sources) {
    const on = sourceActive(src, snap);
    if (on) {
      if (src.gate === "recognition") {
        if (recognisedEvent(snap, src.event)) named.push(src.event);
      } else active.push(src.event);
    }
    const f = src.finish;
    if (f === "active" ? on : typeof f === "function" && f(snap)) finishKeep.push(src.event);
  }
  const phase = phaseOf(snap, named, active);
  const raised = phase === "finish" ? [...caseEvents, ...finishKeep] : [...caseEvents, ...named, ...active];
  // no-reflow is seen as slow flow
  if (raised.includes("no-reflow")) raised.push("slow-flow");
  const ctx: LabContext = { lab: "pci", phase, events: [...new Set(raised)] };
  const vessel = TIP_VESSEL_IDS.find((v) => v === snap.lesion.vessel);
  if (vessel) ctx.vessel = vessel;
  const imaging = imagingOf(snap);
  if (imaging) ctx.imaging = imaging;
  const pressure = PRESSURE_KINDS.find((p) => p === snap.guidePressure);
  if (pressure) ctx.pressure = pressure;
  if (snap.technique) {
    ctx.technique = snap.technique.technique;
    if (snap.technique.step !== undefined) ctx.step = snap.technique.step;
  }
  return ctx;
}

/**
 * The PCI lab's tip context: a pure function of the snapshot (the same snapshot gives the same
 * context). `sources` defaults to every PCI event source (src/ui/lab/pciEvents/*.ts).
 */
export function pciTipContext(snap: PciTipSnapshot, sources?: readonly PciEventSource[]): LabContext;
/**
 * @deprecated The engine state and the target lesion alone (headless scripts and older callers):
 * a snapshot of just those, with 'cto' held when opts.cto, and complications named as soon as they
 * are overt (as before the recognition step; a subintimal wire is never named). Use pciTipContext(snapshot).
 */
export function pciTipContext(st: PciState, lesion: PciLesionRef, opts?: { cto?: boolean }): LabContext;
export function pciTipContext(a: PciTipSnapshot | PciState, b?: PciLesionRef | readonly PciEventSource[], c: { cto?: boolean } = {}): LabContext {
  if (isSnapshot(a)) return contextOf(a, (b as readonly PciEventSource[] | undefined) ?? PCI_EVENT_SOURCES);
  const lesion = b as PciLesionRef;
  // complications named as soon as they are overt; a subintimal wire is never named (the old context never raised it)
  const recognised = PCI_EVENT_SOURCES.filter((s) => s.gate === "recognition" && !RECOGNISED_NOT_COMPLICATION.includes(s.event)).map((s) => s.event);
  return contextOf({ t: a.t, state: a, lesion, caseEvents: c.cto ? ["cto"] : [], scenario: c.cto ? { target: { kind: "cto" } } : undefined, recognised }, PCI_EVENT_SOURCES);
}

function isSnapshot(a: PciTipSnapshot | PciState): a is PciTipSnapshot {
  return "state" in a && "lesion" in a;
}

/** A stable key of a context (for change detection: the recorder, memoised hooks). */
export function tipContextKey(ctx: LabContext | null): string {
  return ctx ? JSON.stringify(ctx) : "";
}
