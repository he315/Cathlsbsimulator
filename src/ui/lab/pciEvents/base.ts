// ---------------------------------------------------------------------------
// The PCI lab's base event sources (pci-tip-context).
//
// Each source reads one snapshot (PciTipSnapshot, ./index.ts) and says whether
// its event is present now, or when it last occurred (a transient event, held
// for TRANSIENT_HOLD_S after its last occurrence on the procedure clock). The
// tip context (src/ui/lab/pciTips.ts) applies the phase machine, the
// recognition gate and the finish rule.
//
//  - the guide: guide-backout (a device push that moved the guide back),
//    poor-guide-support (a push needing more than POOR_SUPPORT_RATIO of the
//    guide's back-up), pressure-damped and pressure-ventricularised from the
//    guide pressure trace, extension-in-place;
//  - the wire: wire-side-branch (never for a wire across the lesion and parked
//    in a branch beyond it), wire-not-crossing, wire-subintimal (named only once
//    recognised: the engine hides it), wire-distal-position, wire-prolapse;
//  - the devices: the catalogue's device events (deviceTipEvents, with the
//    stall and the waist the operator sees), stent-uncrossable, and
//    stent-underexpanded from a placed stent as well;
//  - the lesion: total-occlusion while an acute (never a chronic) occlusion is
//    unopened; slow-flow while flow is slow (a cue);
//  - complications: dissection, perforation, no-reflow, thrombus, air and
//    side-branch-compromise, named only once recognised and kept at finish when
//    they occurred;
//  - the patient: the patient-event adapter's events (src/ui/lab/patientEvents.ts),
//    low-act from the measured ACT, high-contrast-volume and
//    high-radiation-dose (kept at finish when they occurred).
// Case and scenario events (registry.scenarioEvents: the target lesion's sites,
// calcium grade 2 and the definition's events; the start's events) are held for
// the whole run by the tip context; `raises` declares those the registered
// scenarios give.
//
// `raises` is derived from PCI_EVENT_SOURCES, the phases the tip context's
// machine sets (PCI_TIP_PHASES) and the imaging catalogue (raisesFrom), so it
// cannot drift from the code. Feature files import raisesFrom from here.
// ---------------------------------------------------------------------------

import type { ImagingModality, LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { PciPhase } from "../../../simulation/pci/scenarios/types";
import type { PciState, Placed } from "../../../simulation/pci/state";
import { DEVICE_BY_ID, DEVICE_EVENTS, deviceTipEvents, type ActiveDevice } from "../../../simulation/pci/equipment";
import { PCI_SCENARIO_DEFS, scenarioEvents, targetIndex } from "../../../simulation/pci/scenarios/registry";
import { triggerFractions } from "../../../simulation/dose";
import { TRANSIENT_HOLD_S } from "../eventLog";
import { INITIAL_PATIENT_EVENT_STATE, PATIENT_EVENTS, PATIENT_EVENT_THRESHOLDS, patientEvents, type PatientEvent } from "../patientEvents";
import type { PciEventSource, PciTipSnapshot } from "./index";

// --- model parameters ------------------------------------------------------------------------------

/**
 * A device push needing more than this fraction of the guide's back-up force raises
 * poor-guide-support (requiredN / backupN). MODEL PARAMETER: the plan's design value
 * (lab-build-plan.json, pci-tip-context), not from a source.
 */
export const POOR_SUPPORT_RATIO = 0.8;

/**
 * A balloon or stent whose distal end stopped this far proximal to the lesion start, or within the
 * lesion, counts as stalled at the lesion (mm). MODEL PARAMETER: the criterion of the device
 * catalogue's tip test (src/simulation/pci/equipment.tips.test.ts).
 */
export const STALL_ZONE_MM = 2;

/**
 * The engine stops a balloon or stent this far proximal to the wire tip (mm): advanceDevice's
 * maxDistal = st.tipMm - 6 and its 'move' record's beyondWire flag (src/simulation/pci/actions/devices.ts,
 * which does not export the value). A device held there stopped at the wire limit, not at the lesion.
 * MODEL PARAMETER: mirrors the engine's value; keep the two equal.
 */
export const DEVICE_WIRE_MARGIN_MM = 6;

/** A push that moved the device less than this (mm) did not advance it. MODEL PARAMETER (the catalogue test's 0.05 mm). */
export const STALL_ADVANCE_MM = 0.05;

/**
 * A placed stent whose diameter at the lesion is below this fraction of its expanded diameter is
 * under-expanded. MODEL PARAMETER: the engine's own waist criterion (src/simulation/pci/actions/inflation.ts,
 * achieved diameter below 0.85 of the device's chart diameter).
 */
export const STENT_UNDEREXPANDED_RATIO = 0.85;

/**
 * The target counts as occluded at or above this diameter stenosis (%): the engine's own occlusion
 * rule (src/simulation/pci/state.ts lesionNow). MODEL PARAMETER.
 */
export const OCCLUSION_SEVERITY_PCT = 95;

/** Patient events that mean haemodynamic compromise: the tips go to the complication phase. MODEL PARAMETER (choice of events). */
export const COMPROMISE_EVENTS: readonly LabEvent[] = ["hypotension", "vf", "vt", "tamponade"];

/**
 * Events behind the recognition gate that are not complications: once named they are raised, but they do
 * not move the tips to the complication phase (a recognised subintimal wire is still wiring).
 */
export const RECOGNISED_NOT_COMPLICATION: readonly LabEvent[] = ["wire-subintimal"];

/** The cue events of a complication the learner has not named yet (what the operator sees or the monitor shows). */
export const CUE_EVENTS: readonly LabEvent[] = ["slow-flow", "st-elevation", "chest-pain", "hypotension"];

/**
 * Every phase the tip context's machine sets (src/ui/lab/pciTips.ts returns only these; the
 * compiler checks it).
 */
export const PCI_TIP_PHASES = ["plan", "guide", "wire", "lesion-prep", "stent", "optimise", "physiology", "imaging", "complication", "finish"] as const satisfies readonly PciPhase[];
export type PciTipPhase = (typeof PCI_TIP_PHASES)[number];

// --- reading the snapshot --------------------------------------------------------------------------

/** The procedure clock the hold windows run on (s). */
export const procedureTime = (snap: PciTipSnapshot): number => snap.state.t;

/** The vessel the wire tip is in (the last of its route). */
const tipVessel = (snap: PciTipSnapshot): string | undefined => snap.state.route[snap.state.route.length - 1];

/** The wire tip is in the target vessel. */
export const onTarget = (snap: PciTipSnapshot): boolean => tipVessel(snap) === snap.lesion.vessel;

/**
 * The wire tip is in a branch off the route to the target: a branch of the target vessel (a septal,
 * a diagonal), or a branch the engine reported entering off the route (its 'wire-branch' record says
 * onRoute false: src/simulation/pci/actions/wire.ts compares it with the path to the target).
 */
export function wireOffRoute(snap: PciTipSnapshot): boolean {
  const st = snap.state;
  const tip = tipVessel(snap);
  if (st.tipMm <= 0 || !tip || tip === snap.lesion.vessel) return false;
  // a wire across the lesion that ran on into a branch beyond it (the engine carries it into a terminal
  // branch at the end of the vessel: the PDA or PLV, an OM, a diagonal) is parked distally, not off route
  if (wireAcross(snap)) return false;
  if (st.route.includes(snap.lesion.vessel)) return true;
  for (let i = st.log.length - 1; i >= 0; i--) {
    const r = st.log[i];
    if (r.kind === "wire-branch" && r.data.branch === tip) return r.data.onRoute === false;
  }
  return false;
}

/**
 * The wire is across the active target lesion: its route runs through the target vessel and its tip is
 * beyond the lesion, either in the target vessel itself or in a branch beyond it once the engine has
 * recorded the crossing (st.wire.crossed: at the end of a vessel the engine carries the wire on into a
 * terminal branch, src/simulation/pci/coronaryWire.ts).
 */
export function wireAcross(snap: PciTipSnapshot): boolean {
  const st = snap.state;
  const L = snap.lesion;
  return st.route.includes(L.vessel) && st.tipMm > L.endMm && (tipVessel(snap) === L.vessel || st.wire.crossed);
}

/** The case and scenario events held for the whole run: the definition's (registry.scenarioEvents), the start's and any given. */
export function caseEventsOf(snap: PciTipSnapshot): LabEvent[] {
  const out: LabEvent[] = [];
  const d = snap.definition;
  if (d?.lesions?.length) out.push(...scenarioEvents(d, snap.scenario?.targetIdx ?? targetIndex(d)));
  out.push(...(snap.start?.events ?? []), ...(snap.caseEvents ?? []));
  return [...new Set(out)].filter((e) => e !== "total-occlusion" || !isCtoCase(snap, out));
}

/** A chronic total occlusion case: the 'cto' case event, or a CTO target. */
function isCtoCase(snap: PciTipSnapshot, events: readonly LabEvent[]): boolean {
  return events.includes("cto") || snap.scenario?.target.kind === "cto";
}

/** Is this a CTO case (the 'cto' case event or a CTO target)? */
export function isCto(snap: PciTipSnapshot): boolean {
  return isCtoCase(snap, caseEventsOf(snap));
}

/** Has the learner recognised (named) this complication? */
export function recognisedEvent(snap: PciTipSnapshot, e: LabEvent): boolean {
  const r = snap.recognised;
  return r === true || (Array.isArray(r) && r.includes(e));
}

/** The time (state.t) of the last telemetry record of a kind that passes `pred`, or null. */
function lastTele(st: PciState, kind: string | null, pred?: (d: Record<string, unknown>) => boolean): number | null {
  for (let i = st.log.length - 1; i >= 0; i--) {
    const r = st.log[i];
    if ((kind === null || r.kind === kind) && (!pred || pred(r.data))) return r.t;
  }
  return null;
}

/** The outcome message of the last inflation said a waist remained (the operator reads it on the image). */
function lastInflationWaist(st: PciState): boolean {
  for (let i = st.events.length - 1; i >= 0; i--) {
    const text = st.events[i].text;
    if (/^A waist persists|under-expanded at the lesion/.test(text)) return true;
    if (/^Balloon fully expanded|^Stent deployed at|^Post-dilatation at/.test(text)) return false;
  }
  return false;
}

/**
 * One 'move' record of the device: its log index and centre (mm); whether the push stopped at the distal
 * wire limit (the record's beyondWire flag); and whether the delivery physics judged it (advanceDevice
 * writes beyondWire, the compatibility moveDevice does not: nothing but the wire limit stops a device it
 * moves, so a repeat of its centre is a stop at the wire, never at the lesion).
 */
interface DeviceMove {
  i: number;
  c: number;
  atWire: boolean;
  delivered: boolean;
}

/**
 * The device's history since it was loaded or introduced, oldest first: its 'move' records (log index and
 * centre mm) and the log indices of the guide back-outs. A push that backs the guide out writes its
 * 'guide-backout' record before its own 'move' record (src/simulation/pci/actions/devices.ts).
 */
function deviceHistory(st: PciState): { moves: DeviceMove[]; backouts: number[] } {
  const moves: DeviceMove[] = [];
  const backouts: number[] = [];
  for (let i = st.log.length - 1; i >= 0; i--) {
    const r = st.log[i];
    if (r.kind === "guide-backout") {
      backouts.push(i);
      continue;
    }
    if (r.kind !== "device") continue;
    if (r.data.action === "load" || r.data.action === "introduce" || r.data.action === "remove") break;
    if (r.data.action === "move" && typeof r.data.centreMm === "number") moves.push({ i, c: r.data.centreMm, atWire: r.data.beyondWire === true, delivered: typeof r.data.beyondWire === "boolean" });
  }
  return { moves: moves.reverse(), backouts: backouts.reverse() };
}

/**
 * The last push, judged by the delivery physics, did not move the device (its last two 'move' records
 * within STALL_ADVANCE_MM) and did not stop at the wire limit.
 */
function lastPushStalled(moves: readonly DeviceMove[]): boolean {
  const n = moves.length;
  return n >= 2 && moves[n - 1].delivered && !moves[n - 1].atWire && Math.abs(moves[n - 1].c - moves[n - 2].c) < STALL_ADVANCE_MM;
}

/**
 * The last guide back-out since the device went in still stands: no push after the one that backed the
 * guide out advanced the device (by STALL_ADVANCE_MM or more). A back-out the operator has since got past
 * (re-engaged and advanced the device further) does not count.
 */
function backoutStands(moves: readonly DeviceMove[], backouts: readonly number[]): boolean {
  if (!backouts.length) return false;
  const b = backouts[backouts.length - 1];
  const push = moves.findIndex((m) => m.i > b);
  if (push < 0) return true;
  for (let k = push + 1; k < moves.length; k++) if (moves[k].c - moves[k - 1].c >= STALL_ADVANCE_MM) return false;
  return true;
}

// Per-snapshot memo of what several sources read (the stall and the device's events): a snapshot is
// evaluated by every source, so these are worked out once per snapshot. The context stays pure.
const snapMemo = new WeakMap<PciTipSnapshot, { stalled?: boolean; deviceEvents?: readonly LabEvent[] }>();
function memoOf(snap: PciTipSnapshot): { stalled?: boolean; deviceEvents?: readonly LabEvent[] } {
  let m = snapMemo.get(snap);
  if (!m) {
    m = {};
    snapMemo.set(snap, m);
  }
  return m;
}

/**
 * A balloon or stent on the wire that stopped at the lesion: out of the guide, not inflated, its distal
 * end within STALL_ZONE_MM of the lesion start or inside the lesion, and either the last push did not move
 * it or a push since it went in moved the guide back and no later push has advanced it. A device held at
 * the distal wire limit (DEVICE_WIRE_MARGIN_MM short of the wire tip), or whose last push stopped there,
 * is not stalled at the lesion: the wire is too short beyond it. Only a push the delivery physics judged
 * (advanceDevice) can show a stall; the assisted moveDevice stops only at the wire limit.
 */
export function stalledAtLesion(snap: PciTipSnapshot): boolean {
  const m = memoOf(snap);
  if (m.stalled === undefined) m.stalled = computeStalled(snap);
  return m.stalled;
}

function computeStalled(snap: PciTipSnapshot): boolean {
  const st = snap.state;
  const dev = st.device;
  if (!dev || dev.inflated || dev.deployed || dev.stage !== "in-guide") return false;
  if (dev.kind !== "balloon" && dev.kind !== "stent" && dev.kind !== "covered-stent") return false;
  if (!onTarget(snap)) return false;
  const distal = dev.centreMm + dev.lengthMm / 2;
  if (!(distal >= snap.lesion.startMm - STALL_ZONE_MM && distal < snap.lesion.endMm)) return false;
  // held at the distal wire limit (too little wire beyond the lesion), not by the lesion: the engine
  // tells the operator to advance the wire first
  if (distal >= st.tipMm - DEVICE_WIRE_MARGIN_MM - STALL_ADVANCE_MM) return false;
  const h = deviceHistory(st);
  // the last push stopped at the wire limit as it then was; the wire may since have been advanced, but
  // until the device is pushed again nothing says the lesion stops it
  if (h.moves[h.moves.length - 1]?.atWire) return false;
  return lastPushStalled(h.moves) || backoutStands(h.moves, h.backouts);
}

/** The active device as the catalogue's event mapping reads it (snap.activeDevice, else from the state). */
export function activeDeviceOf(snap: PciTipSnapshot): ActiveDevice | null {
  if (snap.activeDevice !== undefined) return snap.activeDevice;
  const st = snap.state;
  const dev = st.device;
  if (!dev) return null;
  const spec = DEVICE_BY_ID[dev.specId];
  if (!spec) return null;
  const inArtery = dev.stage === "in-guide" && dev.centreMm + dev.lengthMm / 2 > 0;
  const active = dev.inflated;
  return {
    spec,
    diameter: dev.diameter,
    inArtery,
    active,
    atm: active ? Math.max(dev.atm, st.ind.atm) : dev.appliedAtm,
    stalledAtLesion: stalledAtLesion(snap),
    waist: dev.appliedAtm > 0 || dev.deployed ? lastInflationWaist(st) : false,
    inflatedBefore: dev.appliedAtm > 0 || dev.deployed,
  };
}

/** The catalogue's events for the active device (deviceTipEvents), once per snapshot. */
function deviceEventsOf(snap: PciTipSnapshot): readonly LabEvent[] {
  const m = memoOf(snap);
  if (m.deviceEvents === undefined) {
    const a = activeDeviceOf(snap);
    m.deviceEvents = a ? deviceTipEvents(a) : [];
  }
  return m.deviceEvents;
}

/** The imaging modality of the imaging catheter on the wire, or undefined. */
export function imagingOf(snap: PciTipSnapshot): ImagingModality | undefined {
  const dev = snap.state.device;
  if (!dev) return undefined;
  const modality = DEVICE_BY_ID[dev.specId]?.imaging?.modality;
  return modality ?? (dev.kind === "ivus" ? "ivus" : undefined);
}

/** A placed stent over the target lesion that is under-expanded (STENT_UNDEREXPANDED_RATIO). */
function placedUnderexpanded(snap: PciTipSnapshot): boolean {
  const L = snap.lesion;
  return snap.state.stents.some((p: Placed) => p.route.includes(L.vessel) && p.fromMm <= L.endMm && p.toMm >= L.startMm && p.diameter > 0 && p.atLesion / p.diameter < STENT_UNDEREXPANDED_RATIO);
}

// The patient events present in the snapshot's vitals, without the adapter's hold (the session's log
// holds them; a hypotension needs its hold, so it comes from activeEvents). One evaluation per snapshot.
const vitalsCache = new WeakMap<object, PatientEvent[]>();
function vitalsEvents(snap: PciTipSnapshot): PatientEvent[] {
  const v = snap.vitals;
  if (!v) return [];
  const hit = vitalsCache.get(v);
  if (hit) return hit;
  const out = patientEvents(v, INITIAL_PATIENT_EVENT_STATE).events;
  vitalsCache.set(v, out);
  return out;
}

const held = (snap: PciTipSnapshot, e: LabEvent): boolean => !!snap.activeEvents?.includes(e);
const occurredInLog = (snap: PciTipSnapshot, e: LabEvent): boolean => !!snap.events?.history().some((o) => o.event === e);

// --- the sources -----------------------------------------------------------------------------------

/** Complication kind of the engine (src/simulation/complications/types.ts) to its tip event. */
const COMPLICATION_EVENTS = {
  dissection: "dissection",
  perforation: "perforation",
  "no-reflow": "no-reflow",
  thrombus: "thrombus",
  air: "air",
  "side-branch": "side-branch-compromise",
} as const satisfies Record<string, LabEvent>;

function complicationSources(): PciEventSource[] {
  return (Object.entries(COMPLICATION_EVENTS) as [keyof typeof COMPLICATION_EVENTS, LabEvent][]).map(([kind, event]) => ({
    event,
    gate: "recognition",
    active: (snap) => snap.state.cx.list.some((c) => c.kind === kind && (c.stage === "overt" || c.stage === "prodrome")),
    // occurred: it became overt during the case, whatever happened to it since
    finish: (snap) => snap.state.cx.list.some((c) => c.kind === kind && c.tOvert !== null),
  }));
}

/** The patient adapter's events, except those with their own source below. */
const OWN_PATIENT_SOURCES: readonly LabEvent[] = ["low-act", "high-contrast-volume"];

function patientSources(): PciEventSource[] {
  return PATIENT_EVENTS.filter((e) => !OWN_PATIENT_SOURCES.includes(e)).map((event) => ({
    event,
    active: (snap) => held(snap, event) || vitalsEvents(snap).includes(event),
    finish: "active",
  }));
}

/** The device catalogue's events from the active device (stent-underexpanded also from a placed stent). */
function deviceSources(): PciEventSource[] {
  return DEVICE_EVENTS.map((event) => ({
    event,
    active: (snap: PciTipSnapshot) => {
      if (deviceEventsOf(snap).includes(event)) return true;
      if (event === "stent-underexpanded") return placedUnderexpanded(snap);
      if (event === "extension-in-place") return snap.state.guide.extensionMm !== null;
      return false;
    },
  }));
}

export const PCI_EVENT_SOURCES: readonly PciEventSource[] = [
  // --- the guide ---
  { event: "guide-backout", active: (snap) => lastTele(snap.state, "guide-backout") },
  {
    event: "poor-guide-support",
    active: (snap) =>
      lastTele(snap.state, null, (d) => typeof d.requiredN === "number" && typeof d.backupN === "number" && d.backupN > 0 && d.requiredN / d.backupN > POOR_SUPPORT_RATIO),
  },
  { event: "pressure-damped", active: (snap) => snap.guidePressure === "damped" || snap.guidePressure === "wedged" },
  { event: "pressure-ventricularised", active: (snap) => snap.guidePressure === "ventricularised" },
  // --- the wire ---
  { event: "wire-side-branch", active: (snap) => wireOffRoute(snap) },
  {
    event: "wire-not-crossing",
    active: (snap) => {
      const st = snap.state;
      if (st.wire.fold && (st.wire.fold.reason === "cap" || st.wire.fold.reason === "lesion")) return true;
      return onTarget(snap) && !st.wire.crossed && st.tipMm > snap.lesion.startMm && st.tipMm <= snap.lesion.endMm;
    },
  },
  {
    // the engine hides it (the operator reads only that the tip moves unusually freely): named only once
    // the learner has recognised it, as a complication is; not itself a reason for the complication phase
    event: "wire-subintimal",
    gate: "recognition",
    active: (snap) => snap.state.wire.subintimal !== null,
    finish: (snap) => snap.state.log.some((r) => r.kind === "wire-subintimal"),
  },
  { event: "wire-distal-position", active: (snap) => snap.state.wire.distal.inDanger },
  { event: "wire-prolapse", active: (snap) => !!snap.state.wire.fold && (snap.state.wire.fold.reason === "branch" || snap.state.wire.fold.reason === "end") },
  // --- the devices ---
  ...deviceSources(),
  {
    event: "stent-uncrossable",
    active: (snap) => {
      const k = snap.state.device?.kind;
      return (k === "stent" || k === "covered-stent") && stalledAtLesion(snap);
    },
  },
  // --- the lesion and the flow ---
  { event: "total-occlusion", active: (snap) => !isCto(snap) && snap.state.severity >= OCCLUSION_SEVERITY_PCT },
  { event: "slow-flow", active: (snap) => snap.state.slowFlow },
  // --- complications ---
  ...complicationSources(),
  // --- the patient ---
  ...patientSources(),
  {
    event: "low-act",
    active: (snap) => held(snap, "low-act") || (snap.state.act !== null && snap.state.act.value < PATIENT_EVENT_THRESHOLDS.actGoalS),
    finish: "active",
  },
  {
    event: "high-contrast-volume",
    active: (snap) => held(snap, "high-contrast-volume") || vitalsEvents(snap).includes("high-contrast-volume"),
    finish: (snap) => held(snap, "high-contrast-volume") || occurredInLog(snap, "high-contrast-volume") || vitalsEvents(snap).includes("high-contrast-volume"),
  },
  {
    event: "high-radiation-dose",
    active: (snap) => held(snap, "high-radiation-dose") || doseHigh(snap),
    finish: (snap) => held(snap, "high-radiation-dose") || occurredInLog(snap, "high-radiation-dose") || doseHigh(snap),
  },
];

/** The dose has passed a substantial radiation dose level (DOSE_TRIGGERS, src/simulation/dose.ts), as the session holds it. */
function doseHigh(snap: PciTipSnapshot): boolean {
  if (!snap.dose) return false;
  const f = triggerFractions(snap.dose);
  return Math.max(f.kar, f.kap, f.fluoroTime, f.peakSkin) >= 1;
}

// --- raises ----------------------------------------------------------------------------------------

/** What a source file reports: its sources' events, the phases it sets, and any further events and imaging. */
export function raisesFrom(
  sources: readonly PciEventSource[],
  o: { phases?: readonly PciPhase[]; events?: readonly LabEvent[]; imaging?: readonly ImagingModality[] } = {}
): LabRaises {
  const events = [...new Set<LabEvent>([...sources.map((s) => s.event), ...(o.events ?? [])])];
  const out: LabRaises = { lab: "pci", phases: [...(o.phases ?? [])], events };
  if (o.imaging?.length) return { ...out, imaging: [...new Set(o.imaging)] };
  return out;
}

/** The case events the registered scenarios give (their target lesions' sites, calcium, case-wide and start events). */
export const REGISTERED_CASE_EVENTS: readonly LabEvent[] = [
  ...new Set(PCI_SCENARIO_DEFS.flatMap((d) => [...scenarioEvents(d), ...d.starts.flatMap((s) => s.events ?? [])])),
];

/** The modalities of the imaging catheters in the device catalogue (any of them can be put on the wire). */
export const CATALOGUE_IMAGING: readonly ImagingModality[] = [
  ...new Set(Object.values(DEVICE_BY_ID).flatMap((d) => (d.imaging ? [d.imaging.modality] : []))),
];

export const raises: LabRaises = raisesFrom(PCI_EVENT_SOURCES, { phases: PCI_TIP_PHASES, events: REGISTERED_CASE_EVENTS, imaging: CATALOGUE_IMAGING });

/** Re-exported for the tip context: the default hold of a transient event (s). */
export { TRANSIENT_HOLD_S };
