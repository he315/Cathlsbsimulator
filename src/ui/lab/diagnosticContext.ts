// ---------------------------------------------------------------------------
// The diagnostic lab's tip context (diag-tip-context): one pure function from
// what the lab knows now to the LabContext its tips are written for, so that
// the hook (useDiagnosticTips), the dev hooks and the tests all read the same
// rule. It replaces the inline rule that useDiagnosticTips used to apply.
//
// Input: a slice of the diagnostic store (engagement, pressure, catheter, case,
// finished, wire lead), a view of the lab session (injector, cine run, exchange,
// the last filmed side, time-out, whether a catheter has reached the root, the
// finish step), a physics reading when an implementation provides one, and the
// events the session's EventLog holds now (transient events and the case-wide
// properties held for the whole case).
//
// Phase precedence (first that applies):
//   finish        the case is finished or the finish step is open
//   setup         before the time-out
//   exchange      a catheter is withdrawn over a wire, or a new one is loaded
//   setup         no catheter has reached the root yet (advance if the tip is in the route)
//   lv-aorta      a pigtail, or the tip in the LV
//   inject        the plunger is down (the injector is active) or a cine run is live
//   views         a filmed selective run on the engaged side, still engaged there
//   engage-graft  the case has grafts and the catheter is where they arise
//   engage-left / engage-right   by the engagement, or the catheter's side at the sinuses
//   advance       the tip in the route or above the sinuses
//
// Vessel: LM or RCA from the engagement (the tree segment at the tip when a
// physics reading gives it), the graft being sought during engage-graft, and
// the grafts of the operation note at setup. Route: femoral or radial.
//
// `raises` (below) is what this lab can report; the reachability report
// (src/content/lab/reachability.test.ts) reads it. Session modules in
// src/ui/sim/modules/ export their own.
//
// This module imports types only from the tip registry, so the lab bundle does
// not pull the curriculum in with it.
// ---------------------------------------------------------------------------

import type { AccessRoute as TipRoute, CatheterFamily, LabContext, LabEvent, LabPhase, TipVessel } from "../../content/lab/tips";
import type { LabRaises } from "../../content/lab/raisable/waiting";
import type { AnatomyCase, EngagementKind, EngagementState, GraftConduit, PressureKind, VesselId } from "../../types";
import { PATIENT_EVENTS, type PatientEvent } from "./patientEvents";

// ---------------------------------------------------------------------------
// Model parameters
// ---------------------------------------------------------------------------

/**
 * Seconds at the sinuses or near an ostium without a selective position before "engage-fail" is
 * raised. MODEL PARAMETER (the earlier rule's value; not from a source).
 */
export const ENGAGE_FAIL_S = 45;

/**
 * Wire lead beyond the catheter tip (the store's controls.wireInsertion, shown as mm on the table
 * strip) at or above which a withdrawal of the catheter counts as a withdrawal over the wire.
 * MODEL PARAMETER.
 */
export const EXCHANGE_WIRE_LEAD = 10;

/** Seconds the exchange phase is held after the catheter was last seen withdrawn over the wire. MODEL PARAMETER. */
export const EXCHANGE_HOLD_S = 5;

/**
 * Seconds the exchange phase is held after a new catheter was loaded (the lab's catheter change is
 * instant; this stands for loading it over the wire and bringing it to the root). Ended early by an
 * injection. MODEL PARAMETER.
 */
export const EXCHANGE_LOAD_S = 15;

/** Selective engagement below this quality (0..1) reads as "non-coaxial". MODEL PARAMETER (the earlier rule's value). */
export const NON_COAXIAL_QUALITY = 0.5;

// ---------------------------------------------------------------------------
// Vocabulary this lab uses (checked against the tip registry by diagnosticContext.test.ts)
// ---------------------------------------------------------------------------

/** The diagnostic lab's phases, in the registry's order (LAB_PHASES.diagnostic). */
export const DIAGNOSTIC_PHASES = ["setup", "advance", "engage-left", "engage-right", "engage-graft", "inject", "views", "lv-aorta", "exchange", "finish"] as const satisfies readonly LabPhase[];

/** Events read from the store and the case on every call (diagnosticStateEvents). */
export const DIAGNOSTIC_STATE_EVENTS = [
  "pressure-damped",
  "pressure-ventricularised",
  "catheter-too-deep",
  "conus-selective",
  "non-coaxial",
  "dilated-root",
  "small-root",
  "subclavian-tortuosity",
  "radial-loop",
] as const satisfies readonly LabEvent[];

/**
 * Events the session raises into its EventLog from store transitions and its own trackers:
 * engage-fail (time near an ostium, lab time), VF (the store's arrhythmia), air (an air embolism
 * the store records), dissection (the store's dissection) and a high radiation dose (the dose
 * tracker's follow-up trigger levels, DOSE_TRIGGERS in src/simulation/dose.ts).
 */
export const DIAGNOSTIC_SESSION_EVENTS = ["engage-fail", "vf", "air", "dissection", "high-radiation-dose"] as const satisfies readonly LabEvent[];

/** The pressure system's events as the session declares them (src/ui/sim/labSession.ts; a type only, so no import cycle). */
type SessionPressureEvent = (typeof import("../sim/labSession").PRESSURE_SESSION_EVENTS)[number];

/**
 * Events the session raises for the pressure system (diag-pressure-transducer; labSession.ts
 * PRESSURE_SESSION_EVENTS): a fault in the line, a trace damped by the line or a plug, an aspiration
 * that fails, a plugged catheter, air drawn in, contrast held up by an obstructing tip, true
 * hypotension with the tip free, and a neurological deficit from a plug flushed into the aorta.
 * Listed here because labSession.ts imports this module (a value import back would be a cycle);
 * the type check below fails the build when the session's list gains an event this one lacks, and
 * diagHostWiring.test.ts (4) checks the two are equal.
 */
export const DIAGNOSTIC_PRESSURE_EVENTS = [
  "transducer-fault",
  "pressure-damped",
  "aspiration-failed",
  "catheter-plugged",
  "air",
  "contrast-hold-up",
  "hypotension",
  "neuro-deficit",
] as const satisfies readonly SessionPressureEvent[];

/** Compile-time: every event of the session's PRESSURE_SESSION_EVENTS is in DIAGNOSTIC_PRESSURE_EVENTS. */
type MissingPressureEvent = Exclude<SessionPressureEvent, (typeof DIAGNOSTIC_PRESSURE_EVENTS)[number]>;
export const PRESSURE_EVENTS_COMPLETE: [MissingPressureEvent] extends [never] ? true : never = true;

/**
 * Patient events the diagnostic lab can raise through the patient-event adapter (patientEvents.ts).
 * The lab measures no ACT and shows no echo, so "low-act" and "pericardial-effusion" never arise.
 */
export const DIAGNOSTIC_PATIENT_EVENTS: readonly PatientEvent[] = PATIENT_EVENTS.filter((e) => e !== "low-act" && e !== "pericardial-effusion");

/** Case properties the lab derives from the case itself (a case with grafts is a prior-CABG case). */
export const DERIVED_CASE_EVENTS = ["prior-cabg"] as const satisfies readonly LabEvent[];

/** The routes the lab reports. */
export const DIAGNOSTIC_ROUTES = ["femoral", "radial"] as const satisfies readonly TipRoute[];

/**
 * What the diagnostic lab can report (the reachability report reads this). Case events a scenario
 * declares in caseData.events are held for the whole case too; the scenario packs that set them
 * declare them.
 */
export const raises: LabRaises = {
  lab: "diagnostic",
  phases: DIAGNOSTIC_PHASES,
  events: [...new Set<LabEvent>([...DIAGNOSTIC_STATE_EVENTS, ...DIAGNOSTIC_SESSION_EVENTS, ...DIAGNOSTIC_PRESSURE_EVENTS, ...DIAGNOSTIC_PATIENT_EVENTS, ...DERIVED_CASE_EVENTS])],
  routes: DIAGNOSTIC_ROUTES,
};

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/** The slice of the diagnostic store the context reads. */
export interface DiagnosticStoreSlice {
  engagement: Pick<EngagementState, "kind" | "target" | "isSelective" | "isDeep" | "conus" | "quality"> | null;
  pressure: { kind: PressureKind } | null;
  catheterId: string;
  caseData: Pick<AnatomyCase, "accessRoute" | "variants" | "rootSize"> & Partial<Pick<AnatomyCase, "grafts" | "events">>;
  finished: boolean;
  /** the wire's lead beyond the catheter tip (controls.wireInsertion) */
  wireLead?: number;
}

/** What the lab session knows about the procedure now (DiagnosticLabSession.sessionView). */
export interface DiagnosticSessionView {
  /** the syringe push is in progress or its contrast has not yet cleared */
  injectorActive: boolean;
  /** a cine run is being recorded */
  runLive: boolean;
  /** a catheter is being withdrawn over a wire or a new one loaded */
  exchange: boolean;
  /** the side of the last filmed diagnostic run, while the catheter is still engaged there */
  lastFilmedSide: "left" | "right" | null;
  timeOutDone: boolean;
  /** a catheter has reached the aortic root */
  rootReached: boolean;
  /** the finish step is open (the study is being closed) */
  finishing: boolean;
}

/** A physics implementation's reading of the tip, when one is registered (src/ui/physics/). */
export interface DiagnosticPhysicsReading {
  /** where the tip is: in the access route, in the aortic root, in the LV */
  tipZone?: "route" | "root" | "lv";
  /** the tree vessel at the tip, when engaged (a VesselId; typed as PhysicsReading.vessel, so a reading passes structurally) */
  vessel?: string | null;
  /** the graft engaged or being sought */
  graft?: TipVessel | null;
  /** a catheter is being exchanged over the wire */
  exchange?: boolean;
}

export interface DiagnosticContextInput {
  store: DiagnosticStoreSlice;
  session: DiagnosticSessionView;
  physics?: DiagnosticPhysicsReading | null;
  /** events active now (EventLog.active() and the session modules' events) */
  active?: readonly LabEvent[];
}

/** A session view for a lab that has no session (the hook before the shell has one; tests). */
export const IDLE_SESSION_VIEW: Readonly<DiagnosticSessionView> = {
  injectorActive: false,
  runLive: false,
  exchange: false,
  lastFilmedSide: null,
  timeOutDone: true,
  rootReached: true,
  finishing: false,
};

/** The store slice from the diagnostic store's state (structural, so this module does not import the store). */
export function diagnosticStoreSlice(s: {
  engagement: DiagnosticStoreSlice["engagement"];
  pressure: DiagnosticStoreSlice["pressure"];
  catheterId: string;
  caseData: DiagnosticStoreSlice["caseData"];
  finished: boolean;
  controls?: { wireInsertion: number } | null;
}): DiagnosticStoreSlice {
  return { engagement: s.engagement, pressure: s.pressure, catheterId: s.catheterId, caseData: s.caseData, finished: s.finished, wireLead: s.controls?.wireInsertion ?? 0 };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A catheter id from src/data/catheters.ts to its family. The same rule as catheterFamily in
 * src/content/lab/tips.ts (diagnosticContext.test.ts checks that they agree for every catheter);
 * kept here so the lab does not load the tip registry to compute its context.
 */
export function diagnosticCatheterFamily(id: string): CatheterFamily | undefined {
  if (/^JL/.test(id)) return "JL";
  if (/^JR/.test(id)) return "JR";
  if (/^AL/.test(id)) return "AL";
  if (/^AR/.test(id)) return "AR";
  if (/^MP/.test(id)) return "MP";
  if (/^TIG/.test(id)) return "TIG";
  if (/^EBU|^XB|^VL/.test(id)) return "EBU";
  if (id === "IKL") return "IKL";
  if (id === "IKR") return "IKR";
  if (/^IM/.test(id)) return "IM";
  if (/^PIG/.test(id)) return "PIG";
  return undefined;
}

const LEFT_CATHETERS: readonly CatheterFamily[] = ["JL", "AL", "EBU", "IKL"];
const RIGHT_CATHETERS: readonly CatheterFamily[] = ["JR", "AR", "IKR", "MP"];

const LEFT_KINDS: readonly EngagementKind[] = ["near-lm", "coaxial-lm", "selective-lm", "deep-lm"];
const RIGHT_KINDS: readonly EngagementKind[] = ["near-rca", "coaxial-rca", "selective-rca", "deep-rca"];

/** The side the catheter is engaged in (coaxial, selective or deep), or null. */
export function engagedSide(e: Pick<EngagementState, "kind"> | null | undefined): "left" | "right" | null {
  const k = e?.kind;
  if (k === "coaxial-lm" || k === "selective-lm" || k === "deep-lm") return "left";
  if (k === "coaxial-rca" || k === "selective-rca" || k === "deep-rca") return "right";
  return null;
}

/** The tip vocabulary's vessel for a tree vessel (branches to their parent artery). */
export function tipVesselOf(v: VesselId | string | null | undefined): TipVessel | undefined {
  switch (v) {
    case "LM":
      return "LM";
    case "LAD":
    case "D1":
    case "D2":
    case "SEPTAL":
      return "LAD";
    case "LCx":
    case "OM1":
    case "OM2":
      return "LCx";
    case "RCA":
    case "PDA":
    case "PLV":
    case "CONUS":
    case "AM":
      return "RCA";
    default:
      return undefined;
  }
}

/** The tip vocabulary's vessel for a graft conduit. */
export function conduitVessel(c: GraftConduit): TipVessel {
  return c === "svg" ? "SVG" : c === "lima" ? "LIMA" : c === "rima" ? "RIMA" : "radial-graft";
}

/** The route the lab reports for the case's access. */
export function diagnosticRoute(r: AnatomyCase["accessRoute"]): "femoral" | "radial" {
  return r === "femoral" ? "femoral" : "radial";
}

/**
 * Case properties held for the whole case: the scenario's own events and, for a case with grafts,
 * prior-cabg (the operation note is part of the history, not a finding).
 */
export function caseEvents(c: Partial<Pick<AnatomyCase, "events" | "grafts">>): LabEvent[] {
  const out = new Set<LabEvent>(c.events ?? []);
  if (c.grafts?.length) out.add("prior-cabg");
  return [...out];
}

/**
 * The graft the operator is working on, when the case has grafts: an internal mammary catheter
 * seeks a mammary graft (the right one from the right radial, else the left first); any other
 * catheter except a pigtail, with its tip above the sinuses where vein and radial grafts arise,
 * seeks an aortic graft. Graft status is not read (whether a graft is open is a finding).
 */
export function graftSought(store: DiagnosticStoreSlice, fam: CatheterFamily | undefined): TipVessel | undefined {
  const grafts = store.caseData.grafts ?? [];
  if (!grafts.length || fam === "PIG") return undefined;
  const k = store.engagement?.kind;
  if (fam === "IM") {
    if (engagedSide(store.engagement)) return undefined;
    const lima = grafts.some((g) => g.conduit === "lima");
    const rima = grafts.some((g) => g.conduit === "rima");
    if (!lima && !rima) return undefined;
    if (rima && (store.caseData.accessRoute === "radial-right" || !lima)) return "RIMA";
    return "LIMA";
  }
  if (k !== "ascending-aorta") return undefined;
  const aortic = grafts.filter((g) => g.conduit === "svg" || g.conduit === "radial");
  if (!aortic.length) return undefined;
  return aortic.some((g) => g.conduit === "svg") ? "SVG" : "radial-graft";
}

// ---------------------------------------------------------------------------
// Phase, vessel and events
// ---------------------------------------------------------------------------

export interface DiagnosticPhase {
  phase: LabPhase;
  /** further phases at the same time (a non-pigtail catheter fallen into the LV is also an advance problem) */
  phases?: LabPhase[];
  vessel?: TipVessel;
}

/** The phase (by the precedence above) and the vessel. */
export function diagnosticPhase(input: DiagnosticContextInput): DiagnosticPhase {
  const { store, session, physics } = input;
  const fam = diagnosticCatheterFamily(store.catheterId);
  const eng = store.engagement;
  const k = eng?.kind;
  const grafts = store.caseData.grafts ?? [];
  const noteVessel = grafts.length ? conduitVessel(grafts[0].conduit) : undefined;
  const inLv = k === "in-lv" || k === "below-valve" || physics?.tipZone === "lv";
  const inRoute = physics?.tipZone === "route" || k === "not-in-root";
  const aboveSinus = k === "ascending-aorta";
  const side = engagedSide(eng);
  const sideVessel = (s: "left" | "right" | null): TipVessel | undefined => tipVesselOf(physics?.vessel) ?? (s === "left" ? "LM" : s === "right" ? "RCA" : undefined);

  if (store.finished || session.finishing) return { phase: "finish" };
  if (!session.timeOutDone) return { phase: "setup", vessel: noteVessel };
  if (session.exchange || physics?.exchange) return { phase: "exchange" };
  if (!session.rootReached) return inRoute ? { phase: "advance" } : { phase: "setup", vessel: noteVessel };
  if (fam === "PIG" || inLv) {
    const also: LabPhase[] = fam !== "PIG" || inRoute ? ["advance"] : [];
    return also.length ? { phase: "lv-aorta", phases: also } : { phase: "lv-aorta" };
  }
  if (session.injectorActive || session.runLive) {
    const near = k && LEFT_KINDS.includes(k) ? "left" : k && RIGHT_KINDS.includes(k) ? "right" : null;
    return { phase: "inject", vessel: physics?.graft ?? sideVessel(side ?? near) };
  }
  if (side && session.lastFilmedSide === side) return { phase: "views", vessel: sideVessel(side) };
  const graft = physics?.graft ?? graftSought(store, fam);
  if (graft) return { phase: "engage-graft", vessel: graft };
  if (k && LEFT_KINDS.includes(k)) return { phase: "engage-left", vessel: sideVessel("left") };
  if (k && RIGHT_KINDS.includes(k)) return { phase: "engage-right", vessel: sideVessel("right") };
  if (inRoute || aboveSinus) return { phase: "advance" };
  // at the sinuses, not near either ostium: the side the catheter is shaped for
  const right = !!fam && RIGHT_CATHETERS.includes(fam) && !LEFT_CATHETERS.includes(fam);
  return right ? { phase: "engage-right", vessel: "RCA" } : { phase: "engage-left", vessel: "LM" };
}

/**
 * Events read from the store and the case now: the pressure trace, the tip position, the root
 * once a catheter has reached it, and the arm and arch on a radial route while the catheter is
 * being advanced, exchanged or turned towards a graft there (and the subclavian, on any route,
 * while a mammary graft is sought).
 */
export function diagnosticStateEvents(input: DiagnosticContextInput, ph: DiagnosticPhase = diagnosticPhase(input)): LabEvent[] {
  const { store, session } = input;
  const out: LabEvent[] = [];
  const add = (e: LabEvent) => {
    if (!out.includes(e)) out.push(e);
  };
  const eng = store.engagement;
  const pk = store.pressure?.kind;
  if (pk === "damped" || pk === "wedged") add("pressure-damped");
  if (pk === "ventricularised") add("pressure-ventricularised");
  if (eng?.isDeep) add("catheter-too-deep");
  if (eng?.conus) add("conus-selective");
  if (eng?.isSelective && eng.quality < NON_COAXIAL_QUALITY) add("non-coaxial");

  const c = store.caseData;
  const variants = c.variants ?? [];
  if (session.rootReached && session.timeOutDone) {
    if (variants.includes("dilated-root") || variants.includes("very-dilated-root") || c.rootSize === "dilated") add("dilated-root");
    if (variants.includes("small-root") || c.rootSize === "small") add("small-root");
  }
  const phases = [ph.phase, ...(ph.phases ?? [])];
  const radial = c.accessRoute !== "femoral";
  // a graft is sought from the ascending aorta, so the catheter is still being worked through the arm
  const onTheArm = radial && (phases.includes("advance") || phases.includes("exchange") || phases.includes("engage-graft"));
  if (onTheArm) {
    if (variants.includes("tortuous-subclavian") || (variants.includes("arteria-lusoria") && c.accessRoute === "radial-right")) add("subclavian-tortuosity");
    if (variants.includes("radial-loop")) add("radial-loop");
  }
  if (ph.phase === "engage-graft" && (ph.vessel === "LIMA" || ph.vessel === "RIMA") && variants.includes("tortuous-subclavian")) add("subclavian-tortuosity");
  return out;
}

/**
 * The pressure class the tips are filtered on: a wedged trace is a damped trace on the monitor (it
 * also raises pressure-damped), so pressure-filtered tips written for 'damped' match it.
 */
export function tipPressure(k: PressureKind | undefined): PressureKind | undefined {
  return k === "wedged" ? "damped" : k;
}

/**
 * The pressure class of the trace the operator sees. The session damps the shown trace itself (a
 * plugged catheter, an air bubble, the line off or disconnected) and raises pressure-damped while the
 * store's class still follows the free tip, so an active pressure-damped reads 'damped' too.
 */
export function shownPressure(events: readonly LabEvent[], k: PressureKind | undefined): PressureKind | undefined {
  return events.includes("pressure-damped") ? "damped" : tipPressure(k);
}

/** The diagnostic lab's tip context now. */
export function diagnosticContext(input: DiagnosticContextInput): LabContext {
  const ph = diagnosticPhase(input);
  const events: LabEvent[] = diagnosticStateEvents(input, ph);
  for (const e of input.active ?? []) if (!events.includes(e)) events.push(e);
  const ctx: LabContext = {
    lab: "diagnostic",
    phase: ph.phase,
    events,
    catheter: diagnosticCatheterFamily(input.store.catheterId),
    engagement: input.store.engagement?.kind,
    pressure: shownPressure(events, input.store.pressure?.kind),
    vessel: ph.vessel,
    route: diagnosticRoute(input.store.caseData.accessRoute),
  };
  if (ph.phases?.length) ctx.phases = ph.phases;
  return ctx;
}
