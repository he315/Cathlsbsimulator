// ---------------------------------------------------------------------------
// Bail-out techniques (blocking balloon, covered stent, coils, thrombus and
// flow bail-outs) added by later packages: pci-perforation, pci-flow-closure,
// pci-acs-thrombus and pci-equipment-loss.
//
// The existing generic bail-out action, bailout(), and the drugs that call it
// live in drugs.ts. Functions exported here reach the angioPci facade through
// its `export *`; module-internal helpers shared with other action modules go
// in a default-exported object (see wire.ts), which the facade does not
// re-export.
//
// pci-flow-closure adds:
//   - the flow and closure start states (applyFlowStart): no-reflow after
//     stenting the thrombotic circumflex, air in the RCA (or the LAD), an abrupt
//     closure with a hidden mechanism drawn from the seed (dissection, plaque
//     embolisation, thrombosis or spasm), flow states to grade, a dissection with
//     a re-crossed wire that may lie in the false lumen, plaque embolisation, a
//     stiff wire in the tortuous RCA with spasm at its bends, and the sinus stain
//     of an aortocoronary dissection. Each is a pure change of the state a
//     start opens at (startPci, src/simulation/pci/actions/scenario.ts); the
//     lab applies it once after startPci (the package report names that line);
//     flowStartPatient says what the start asks of the patient engine;
//   - coronary spasm (cm-principles-closure#2, pm-lab-drugs#2 and #13): a
//     smooth narrowing kept on the record ('spasm' telemetry) that relaxes up to
//     two minutes after intracoronary nitroglycerin or a calcium channel
//     blocker, never after anything else;
//   - the manifold check before the next injection after air, and the
//     re-crossing of a dissected segment that may track into the false lumen.
// Nothing here names a complication on the live log: start notes go through
// the complication engine's recognition gate (gateNotes). The start's
// mechanism is telemetry ('flow-start'), for the debrief (flowDebrief).
// Every number is a MODEL PARAMETER unless cited
// (docs/realism/facts/pkg-pci-flow-closure.md).
// ---------------------------------------------------------------------------

import type { VesselId } from "../../../types";
import { gateNotes, onAspirate, cloneCx, type CxNote } from "../../complications/engine";
import { seedNoReflow, timiFor } from "../../complications/noReflow";
import { seedThrombosis } from "../../complications/thrombus";
import { bailoutAir, seedAir } from "../../complications/airEmbolism";
import { recrossSubintimalP, seedAortocoronaryDissection, seedClosureDissection } from "../../complications/dissection";
import { pathTo } from "../geometry";
import { rnd, rngFrom, type RngState } from "../rng";
import { THIN_STRUT_DES, ringCount } from "../stentGeometry";
import { cloneWire } from "../coronaryWire";
import { log, syncWire, tele, withNotes, wiringOf, type PciGeom, type PciScenario, type PciState, type Placed } from "../state";
import { loadMicrocatheter, moveMicrocatheter, setWireKind } from "./wire";

// ---------------------------------------------------------------------------
// Start states
// ---------------------------------------------------------------------------

/** The flow and closure starts, by id (a launch variant on a core scenario, or a start of the closure pack). */
export const FLOW_STARTS = {
  "no-reflow": { scenario: "lcx-stemi", title: "No-reflow after stenting the thrombotic circumflex" },
  "no-reflow-refractory": { scenario: "lcx-stemi", title: "Refractory no-reflow after stenting the thrombotic circumflex" },
  "air-rca": { scenario: "rca-calcified", title: "Air in the RCA after a balloon was withdrawn without aspirating the guide" },
  "air-lcx": { scenario: "lcx-stemi", title: "Air in the circumflex after the stent balloon was withdrawn without aspirating the guide" },
  "air-lad": { scenario: "lad-focal", title: "Air in the LAD after trapping without back-bleeding" },
  "closure-timi0": { scenario: "lad-focal", title: "Abrupt closure after predilatation: find the cause" },
  "closure-dissection": { scenario: "lad-focal", title: "Abrupt closure after predilatation (dissection)" },
  "closure-plaque": { scenario: "lad-focal", title: "Abrupt closure after predilatation (plaque embolisation)" },
  "closure-thrombus": { scenario: "lad-focal", title: "Abrupt closure after predilatation (thrombosis)" },
  "closure-spasm": { scenario: "lad-focal", title: "Abrupt closure after predilatation (spasm)" },
  "flow-states": { scenario: "lad-focal", title: "Grade the flow after balloon angioplasty" },
  "dissection-rescue": { scenario: "lad-focal", title: "Dissection with the wire re-crossed: confirm the true lumen" },
  "plaque-embolisation": { scenario: "rca-calcified", title: "Slow flow after high-pressure dilatation of calcified plaque" },
  "wire-spasm": { scenario: "rca-calcified", title: "New narrowings with a stiff wire in the RCA" },
  "sinus-stain": { scenario: "rca-aortocoronary", title: "Contrast staining the right sinus after a forceful injection" },
} as const satisfies Record<string, { scenario: string; title: string }>;

export type FlowStartId = keyof typeof FLOW_STARTS;

/** The closure start's hidden mechanisms and their weights (cm-principles-closure#2) — MODEL PARAMETERS. */
export const CLOSURE_MECHANISMS = [
  { value: "dissection", weight: 0.3 },
  { value: "plaque-embolisation", weight: 0.25 },
  { value: "thrombosis", weight: 0.2 },
  { value: "spasm", weight: 0.25 },
] as const;
export type ClosureMechanism = (typeof CLOSURE_MECHANISMS)[number]["value"];

/** The flow states the grading start draws from, with equal weight — MODEL PARAMETER. */
export const FLOW_STATES = ["edge-dissection", "no-reflow", "normal"] as const;
export type FlowState = (typeof FLOW_STATES)[number];

/** MODEL PARAMETERS of the starts. */
export const MP_FLOW_START = {
  /** the target's diameter stenosis (%) after the predilatation the closure and plaque starts open after */
  predilatedPct: 40,
  /** the target's residual stenosis (%) under the stent of the no-reflow start */
  stentedPct: 10,
  /** no-reflow at the no-reflow start (0..1; 0.95 and above is TIMI 0) and the chance it is refractory */
  noReflowSeverity: 0.95,
  noReflowRefractoryP: 0.25,
  /** the closure start's plaque embolisation (TIMI 0), the plaque start's (TIMI 1) and the flow-state drill's (TIMI 1) */
  closurePlaqueSeverity: 0.92,
  plaqueSeverity: 0.7,
  flowStateNoReflowSeverity: 0.65,
  /** the closure start's spasm (%), and the wire-induced spasm at a bend of the RCA (%) */
  closureSpasmPct: 90,
  wireSpasmPct: 65,
  /** the true ACT (s) the closure start's thrombosis opens with (the failed venous line) */
  thrombosisActS: 180,
  /** air at the LAD start (mL; the RCA start uses airEmbolism.MP_AIR_START_ML) */
  airLadMl: 0.3,
  /** air at the circumflex start (mL), after the stent of the no-reflow start */
  airLcxMl: 0.3,
  /**
   * the guide at the sinus-stain start (mm in the ostium, coaxiality 0..1): eased back from the deep, damped
   * seat that caused the stain to a free, coaxial one, so the trace is not damped (guide.ts guideDamps) and the
   * learner's further injections are not blocked by the attending: each one visibly enlarges the stain
   */
  stainGuideDepthMm: 0.5,
  stainGuideCoaxial: 0.9,
  /** the vagal stimulus the air starts ask of the patient engine (level 0..1, held s) */
  airVagalLevel: 0.9,
  airVagalHoldS: 40,
} as const;

/** What a start asks of the patient engine (the lab applies it with the start). */
export interface FlowStartPatient {
  /** a vagal episode now (PatientEngine.forceVagal) */
  vagal?: { level: number; holdS: number };
  /**
   * a rhythm now (PatientEngine.forceRhythm): complete heart block while air fills the RCA, which supplies the
   * AV node (the air module's AV block, airEmbolism.ts); flowPatientRecovery says when it ends
   */
  rhythm?: "chb";
  /** the true ACT the case should read (s): the engine's anticoagulation is lower than the lab's default */
  actS?: number;
}

/** Which flow start a launch opens: its variant when that is a flow start of this scenario, else its start. */
export function flowStartFor(scenario: string, o: { start?: string | null; variant?: string | null }): FlowStartId | null {
  for (const id of [o.variant, o.start]) {
    if (id && id in FLOW_STARTS && FLOW_STARTS[id as FlowStartId].scenario === scenario) return id as FlowStartId;
  }
  return null;
}

/** What a flow start asks of the patient engine (null: nothing beyond the procedure's own effects). */
export function flowStartPatient(st: Pick<PciState, "log">): FlowStartPatient | null {
  const r = flowStartRecord(st);
  if (!r) return null;
  if (r.id === "air-rca") return { vagal: { level: MP_FLOW_START.airVagalLevel, holdS: MP_FLOW_START.airVagalHoldS }, rhythm: "chb" };
  if (r.id === "air-lad" || r.id === "air-lcx") return { vagal: { level: MP_FLOW_START.airVagalLevel, holdS: MP_FLOW_START.airVagalHoldS } };
  if (r.mechanism === "thrombosis") return { actS: MP_FLOW_START.thrombosisActS };
  return null;
}

/**
 * The rhythm the patient engine returns to now: sinus once the air of an air start that blocked the AV node
 * has cleared from the vessel (the lab calls PatientEngine.forceRhythm('sinus') once); else null.
 */
export function flowPatientRecovery(st: Pick<PciState, "log" | "cx">): "sinus" | null {
  if (flowStartPatient(st)?.rhythm !== "chb") return null;
  const air = st.cx.list.filter((c) => c.kind === "air");
  return air.length > 0 && air.every((c) => c.stage === "resolved") ? "sinus" : null;
}

/** The flow start this case opened at (truth, for the debrief), or null. */
export function flowStartRecord(st: Pick<PciState, "log">): { id: FlowStartId; mechanism: string | null; t: number } | null {
  const r = st.log.find((x) => x.kind === "flow-start");
  if (!r) return null;
  return { id: r.data.id as FlowStartId, mechanism: typeof r.data.mechanism === "string" ? r.data.mechanism : null, t: r.t };
}

function weighted<T extends string>(rng: RngState, opts: readonly { value: T; weight: number }[]): T {
  const total = opts.reduce((a, o) => a + o.weight, 0);
  let u = rnd(rng) * total;
  for (const o of opts) {
    u -= o.weight;
    if (u < 0) return o.value;
  }
  return opts[opts.length - 1].value;
}

/** A stent over the target lesion (the no-reflow start opens after stenting), sized to its reference. */
function placeStent(g: PciGeom, st: PciState): PciState {
  const route = st.route.includes(g.lesion.vessel) ? st.route.slice() : pathTo(g, g.lesion.vessel);
  const d = Math.max(2.5, Math.min(4, Math.round(g.lesion.refDiameter * 4) / 4));
  const len = Math.ceil(g.lesion.endMm - g.lesion.startMm + 4);
  const from = Math.max(0.5, g.lesion.startMm - 2);
  const placed: Placed = {
    vessel: g.lesion.vessel as VesselId,
    fromMm: from,
    toMm: from + len,
    diameter: d,
    atLesion: d,
    route,
    nominal: d,
    labelLengthMm: len,
    ringD: new Array(ringCount(THIN_STRUT_DES, len)).fill(d),
    compressionMm: 0,
    covered: false,
  };
  return { ...st, stents: [...st.stents, placed] };
}

/** Log a start's notes as the last run showed them, through the recognition gate. */
function shown(st0: PciState, notes: CxNote[]): PciState {
  const g = gateNotes({ ...st0.cx, lastRunT: st0.t }, notes, { run: true });
  return withNotes({ ...st0, cx: g.cx, lastInjectionT: st0.t }, g.notes);
}

/**
 * The state a flow start opens at: `st` is what startPci gave for the scenario's start (the wire across for
 * every flow start). Pure; returns `st` unchanged for a launch that is not a flow start of this scenario. The
 * start is recorded as 'flow-start' telemetry with its mechanism (debrief truth, never on the live log).
 */
export function applyFlowStart(s: PciScenario, g: PciGeom, st0: PciState, o: { start?: string | null; variant?: string | null }): PciState {
  const scenario = (s as { defId?: string }).defId ?? s.id;
  const id = flowStartFor(scenario, o);
  if (!id) return st0;
  const rng = rngFrom(`${st0.rng.s}:flow-start:${id}`);
  const route = st0.route.includes(g.lesion.vessel) ? st0.route.slice() : pathTo(g, g.lesion.vessel);
  const vessel = g.lesion.vessel;
  const at = g.lesion.centreMm;
  const len = g.lesion.endMm - g.lesion.startMm;
  let st: PciState = { ...st0, cx: cloneCx(st0.cx) };
  const cx = st.cx;
  let mechanism: string | null = null;
  const notes: CxNote[] = [];
  switch (id) {
    case "no-reflow":
    case "no-reflow-refractory": {
      st = placeStent(g, { ...st, severity: MP_FLOW_START.stentedPct });
      const refractory = id === "no-reflow-refractory" || rnd(rng) < MP_FLOW_START.noReflowRefractoryP;
      mechanism = refractory ? "thrombus embolisation, refractory to vasodilators" : "thrombus embolisation";
      notes.push(...seedNoReflow(cx, st.t, { route, vessel, atMm: at, severity: MP_FLOW_START.noReflowSeverity, embolus: "thrombus", refractory }).notes);
      st = log(st, "info", "Stent deployed across the circumflex lesion; the final run follows.");
      break;
    }
    case "air-rca":
    case "air-lad":
    case "air-lcx": {
      const side = s.side;
      // the circumflex start opens after the stent, as the no-reflow start does
      if (id === "air-lcx") st = placeStent(g, { ...st, severity: MP_FLOW_START.stentedPct });
      const ml = id === "air-lad" ? MP_FLOW_START.airLadMl : id === "air-lcx" ? MP_FLOW_START.airLcxMl : undefined;
      const source =
        id === "air-rca" ? "a large balloon withdrawn without aspirating the guide" : id === "air-lcx" ? "the stent balloon withdrawn without aspirating the guide" : "trapping without back-bleeding the guide";
      mechanism = `air from ${source}`;
      notes.push(...seedAir(cx, st.t, { route, vessel, side, ml, cause: `air drawn in by ${source}, injected with the next run` }).notes);
      break;
    }
    case "closure-timi0":
    case "closure-dissection":
    case "closure-plaque":
    case "closure-thrombus":
    case "closure-spasm": {
      const forced: Partial<Record<FlowStartId, ClosureMechanism>> = { "closure-dissection": "dissection", "closure-plaque": "plaque-embolisation", "closure-thrombus": "thrombosis", "closure-spasm": "spasm" };
      const m = forced[id] ?? weighted(rng, CLOSURE_MECHANISMS);
      mechanism = m;
      st = { ...st, severity: MP_FLOW_START.predilatedPct };
      if (m === "dissection") notes.push(...seedClosureDissection(cx, st.t, { route, vessel, atMm: at, lengthMm: Math.max(8, len * 1.3), grade: "F" }).notes);
      else if (m === "plaque-embolisation") notes.push(...seedNoReflow(cx, st.t, { route, vessel, atMm: at, severity: MP_FLOW_START.closurePlaqueSeverity, embolus: "plaque" }).notes);
      else if (m === "thrombosis") {
        notes.push(...seedThrombosis(cx, st.t, { route, vessel, atMm: at, act: MP_FLOW_START.thrombosisActS }).notes);
        st = { ...st, actTrue: MP_FLOW_START.thrombosisActS };
      } else st = addSpasm(st, { route, vessel, atMm: at, severity: MP_FLOW_START.closureSpasmPct, lengthMm: Math.max(6, len), cause: "spasm at the dilated segment" });
      st = log(st, "info", "Predilatation done; the run after the balloon is withdrawn follows.");
      break;
    }
    case "flow-states": {
      const f = FLOW_STATES[Math.min(FLOW_STATES.length - 1, Math.floor(rnd(rng) * FLOW_STATES.length))];
      mechanism = f;
      st = { ...st, severity: MP_FLOW_START.predilatedPct };
      if (f === "edge-dissection") notes.push(...seedClosureDissection(cx, st.t, { route, vessel, atMm: g.lesion.endMm + 2, lengthMm: 8, grade: "D" }).notes);
      else if (f === "no-reflow") notes.push(...seedNoReflow(cx, st.t, { route, vessel, atMm: at, severity: MP_FLOW_START.flowStateNoReflowSeverity, embolus: "plaque" }).notes);
      st = log(st, "info", "Balloon angioplasty done; grade the flow on the next run.");
      break;
    }
    case "dissection-rescue": {
      st = { ...st, severity: MP_FLOW_START.predilatedPct };
      const d = seedClosureDissection(cx, st.t, { route, vessel, atMm: at, lengthMm: Math.max(10, len * 1.4), grade: "D" });
      notes.push(...d.notes);
      const sub = rnd(rng) < recrossSubintimalP(d.c);
      mechanism = sub ? "re-crossed wire in the false lumen" : "re-crossed wire in the true lumen";
      if (sub) {
        const fromMm = d.c.atMm - d.c.lengthMm / 2;
        st = syncWire(st, { ...cloneWire(st.wire), subintimal: { fromMm } });
        st = tele(st, "wire-subintimal", { atMm: fromMm, cause: "re-crossing the dissection" });
      }
      st = log(st, "info", "The first wire came back during the dilatation; a second workhorse wire has been advanced beyond the lesion.");
      break;
    }
    case "plaque-embolisation": {
      st = { ...st, severity: MP_FLOW_START.predilatedPct + 5 };
      mechanism = "plaque embolisation";
      notes.push(...seedNoReflow(cx, st.t, { route, vessel, atMm: at, severity: MP_FLOW_START.plaqueSeverity, embolus: "plaque", cause: "distal embolisation of plaque debris after high-pressure dilatation of calcified plaque" }).notes);
      st = log(st, "info", "High-pressure dilatation done; the run after the balloon is withdrawn follows.");
      break;
    }
    case "wire-spasm": {
      // a stiff wire through a microcatheter, the microcatheter then parked back in the guide
      let w = loadMicrocatheter(st, "mc-large");
      w = moveMicrocatheter(s, g, w, 400);
      w = setWireKind(w, "support", { g });
      w = moveMicrocatheter(s, g, w, -400);
      st = { ...w, cx: st.cx };
      const sites = wiringOf(st).pseudo?.sites ?? [];
      const site = sites.length ? sites[Math.floor(sites.length / 2)] : { atMm: at };
      mechanism = sites.length ? "pseudolesions at the bends, with spasm at one" : "spasm at a bend";
      st = addSpasm(st, { route: st.route.slice(), vessel, atMm: site.atMm, severity: MP_FLOW_START.wireSpasmPct, lengthMm: 6, cause: "spasm provoked by the stiff wire" });
      st = log(st, "info", "A support wire has been exchanged in through the microcatheter for more support.");
      break;
    }
    case "sinus-stain": {
      mechanism = "aortocoronary dissection from the guide";
      {
        // the rod physics' measured gap (if any) belongs to the old seat
        const { openFraction: _old, ...guide } = st.guide;
        void _old;
        st = { ...st, guide: { ...guide, depthMm: MP_FLOW_START.stainGuideDepthMm, coaxial: MP_FLOW_START.stainGuideCoaxial } };
      }
      notes.push(...seedAortocoronaryDissection(cx, st.t, { route: [route[0]], vessel: route[0] }).notes);
      st = log(st, "info", "A forceful injection has just been given through the deep-seated guide; the guide has been eased back since.");
      break;
    }
  }
  st = tele(st, "flow-start", { id, mechanism });
  return shown(st, notes);
}

// ---------------------------------------------------------------------------
// Coronary spasm
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of spasm. */
export const MP_SPASM = {
  /** a spasm narrower than this (%) is not seen as a new narrowing */
  visiblePct: 25,
  /** the agent's dose (µg) that relaxes it fully (a smaller dose in proportion) */
  fullDoseUg: { gtn: 100, verapamil: 100, nicardipine: 100 } as Record<string, number>,
  /** the delay from the dose to the relaxation (s): at least the first, at most the second (Brilakis: allow up to 2 minutes) */
  reliefDelayS: [30, 120] as const,
  /** stenosis (%) from which a spasm closes the vessel (TIMI 0-1) and from which it slows flow (TIMI 2) */
  closurePct: 85,
  slowPct: 70,
} as const;

/** The agents that relax spasm (Brilakis 25.2 and 6.3: intracoronary nitroglycerin or a calcium channel blocker). */
export const SPASM_AGENTS: readonly string[] = ["gtn", "verapamil", "nicardipine"];

export interface Spasm {
  id: number;
  vessel: string;
  route: string[];
  atMm: number;
  lengthMm: number;
  /** stenosis now (%) */
  severity: number;
  /** stenosis at onset (%) */
  baseSeverity: number;
  since: number;
  cause: string;
  /** a relaxation already given and due later (procedure time, s), or null */
  pendingAt: number | null;
}

/** Add a spasm to the record. */
export function addSpasm(st: PciState, o: { route: string[]; vessel: string; atMm: number; severity: number; lengthMm?: number; cause: string }): PciState {
  const id = st.log.filter((r) => r.kind === "spasm").length + 1;
  return tele(st, "spasm", { id, route: o.route.slice(), vessel: o.vessel, atMm: o.atMm, lengthMm: o.lengthMm ?? 6, severity: o.severity, cause: o.cause });
}

type LogEntry = PciState["log"][number];
const NO_RECORDS: readonly LogEntry[] = Object.freeze([]);
const NO_SPASMS: readonly Spasm[] = Object.freeze([]);
/** The spasm and spasm-relief records of each log seen (the log is appended immutably, so a log array never changes). */
const SPASM_RECORDS = new WeakMap<readonly LogEntry[], readonly LogEntry[]>();
/** The last log scanned and its records: a log that extends it is scanned only from where it ended. */
let lastSpasmScan: { log: readonly LogEntry[]; recs: readonly LogEntry[] } | null = null;

/** The spasm records of a log: cached per log array, scanned incrementally from the last log seen. */
function spasmRecords(log: readonly LogEntry[]): readonly LogEntry[] {
  const hit = SPASM_RECORDS.get(log);
  if (hit) return hit;
  let recs = NO_RECORDS;
  let from = 0;
  const prev = lastSpasmScan;
  if (prev && prev.log.length > 0 && prev.log.length <= log.length && log[prev.log.length - 1] === prev.log[prev.log.length - 1] && log[0] === prev.log[0]) {
    recs = prev.recs;
    from = prev.log.length;
  }
  let added: LogEntry[] | null = null;
  for (let i = from; i < log.length; i++) {
    const k = log[i].kind;
    if (k === "spasm" || k === "spasm-relief") (added ??= []).push(log[i]);
  }
  if (added) recs = [...recs, ...added];
  SPASM_RECORDS.set(log, recs);
  lastSpasmScan = { log, recs };
  return recs;
}

/** The spasms on the record and their stenosis now (relaxations due by st.t applied). Read-only: a shared empty list when there is none. */
export function spasmsOf(st: Pick<PciState, "log" | "t">): readonly Spasm[] {
  const recs = spasmRecords(st.log);
  if (!recs.length) return NO_SPASMS;
  const out: Spasm[] = [];
  for (const r of recs) {
    if (r.kind === "spasm") {
      const d = r.data;
      out.push({
        id: Number(d.id),
        vessel: String(d.vessel),
        route: d.route as string[],
        atMm: Number(d.atMm),
        lengthMm: Number(d.lengthMm) || 6,
        severity: Number(d.severity),
        baseSeverity: Number(d.severity),
        since: r.t,
        cause: String(d.cause ?? "spasm"),
        pendingAt: null,
      });
    } else if (r.kind === "spasm-relief") {
      const sp = out.find((x) => x.id === Number(r.data.id));
      if (!sp) continue;
      const at = Number(r.data.at);
      if (at <= st.t + 1e-9) sp.severity = sp.severity * (1 - Math.max(0, Math.min(1, Number(r.data.fraction))));
      else sp.pendingAt = sp.pendingAt === null ? at : Math.min(sp.pendingAt, at);
    }
  }
  return out;
}

/** The spasms seen now (at least MP_SPASM.visiblePct). */
export function activeSpasms(st: Pick<PciState, "log" | "t">): readonly Spasm[] {
  const all = spasmsOf(st);
  return all.length ? all.filter((x) => x.severity >= MP_SPASM.visiblePct) : NO_SPASMS;
}

/**
 * An agent given into the coronary acting on the spasms: nitroglycerin or a calcium channel blocker relaxes
 * each active spasm, in proportion to the dose up to MP_SPASM.fullDoseUg, after a delay drawn between the
 * bounds of MP_SPASM.reliefDelayS (from the record's own generator, so a replay gives the same delay). Any
 * other agent does nothing to spasm. Returns the state with the relaxations on the record.
 */
export function spasmDose(st0: PciState, agent: string, doseUg: number): PciState {
  if (!SPASM_AGENTS.includes(agent)) return st0;
  let st = st0;
  for (const sp of activeSpasms(st0)) {
    if (sp.pendingAt !== null) continue;
    const n = st.log.filter((r) => r.kind === "spasm-relief").length;
    const r = rngFrom(`${st0.rng.s}:spasm-relief:${sp.id}:${n}`);
    const [a, b] = MP_SPASM.reliefDelayS;
    const at = st0.t + a + (b - a) * rnd(r);
    const fraction = Math.min(1, doseUg / (MP_SPASM.fullDoseUg[agent] ?? 100));
    st = tele(st, "spasm-relief", { id: sp.id, agent, doseUg, at, fraction });
  }
  return st;
}

/** The fraction of flow a spasm of this stenosis (%) takes away (for the patient engine) — MODEL PARAMETER. */
export function spasmOcclusion(pct: number): number {
  return Math.max(0, Math.min(1, (pct - 50) / 45));
}

/** The TIMI grade beyond a spasm of this stenosis (%). */
export function spasmTimi(pct: number): number {
  return pct >= MP_SPASM.closurePct ? 1 : pct >= MP_SPASM.slowPct ? 2 : 3;
}

/**
 * The learner has named spasm in an assessment made since the spasm began (the 'recognition' record the
 * assessment writes, src/simulation/pci/actions/step.ts recognisePci, whatever it was scored against).
 */
export function spasmRecognised(st: Pick<PciState, "log" | "t">): boolean {
  const live = activeSpasms(st);
  if (!live.length) return false;
  const since = Math.min(...live.map((x) => x.since));
  return st.log.some((r) => r.kind === "recognition" && r.t >= since && r.data.cause === "spasm");
}

// ---------------------------------------------------------------------------
// Air: the system check before the next injection
// ---------------------------------------------------------------------------

/**
 * Check the manifold, the connections and the guide for the source of air, and aspirate and flush the guide
 * (cm-flow-embolism#5: the step before the next injection). The air left in the guide is gone; a second
 * injection made before this check carries it in.
 */
export function checkManifold(st0: PciState): PciState {
  const had = st0.cx.guideAirMl > 0.01;
  let st = tele(st0, "manifold-check", { airFound: had });
  st = { ...st, cx: onAspirate(st.cx) };
  return log(st, "info", had ? "Manifold, connections and guide checked: a bubble is drawn back from the guide; the system is now clear." : "Manifold, connections and guide checked: no air in the system.");
}

/** Whether the system was checked after the last air event (the debrief, the console's read-out). */
export function manifoldCheckedSinceAir(st: Pick<PciState, "log" | "cx">): boolean {
  const air = st.cx.list.filter((c) => c.kind === "air").map((c) => c.t0);
  if (!air.length) return true;
  const last = Math.max(...air);
  return st.log.some((r) => r.kind === "manifold-check" && r.t >= last);
}

/**
 * The wire moved through the distal vessel and its branches while air is in it breaks the bubbles up
 * (airEmbolism.ts 'wire-through-bubbles', Brilakis, 02-flow-embolism.ts:939). Not triggered yet: the wire route
 * (src/simulation/pci/actions/wire.ts moveWire) is meant to call this after an advance in an air case (the
 * package report's out-of-scope list). Returns `st` unchanged when no live air is in the wired vessel.
 */
export function wireThroughBubbles(st: PciState): PciState {
  if (!st.cx.list.some((c) => c.kind === "air" && c.stage !== "resolved" && st.route.includes(c.vessel))) return st;
  const cx = cloneCx(st.cx);
  const notes: CxNote[] = [];
  for (const c of cx.list) if (c.kind === "air" && c.stage !== "resolved" && st.route.includes(c.vessel)) notes.push(...bailoutAir(c, "wire-through-bubbles", st.t));
  const r = gateNotes(cx, notes);
  return withNotes({ ...tele(st, "bailout", { action: "wire-through-bubbles" }), cx: r.cx }, r.notes);
}

// ---------------------------------------------------------------------------
// Re-crossing a dissected segment
// ---------------------------------------------------------------------------

/**
 * A wire move that took the tip across the whole of an unsealed dissection (from `before` to `after`) may
 * have tracked into the false lumen (dissection.recrossSubintimalP by NHLBI type; drawn from the record's
 * generator). Returns `after`, with the wire's subintimal course from the flap's start when it did. The wire
 * route (src/simulation/pci/actions/wire.ts moveWire) is meant to call this after each advance.
 */
export function recrossDissection(before: PciState, after: PciState): PciState {
  if (after.wire.subintimal || !(after.tipMm > before.tipMm)) return after;
  for (const c of after.cx.list) {
    if (c.kind !== "dissection" || c.stage === "treated" || c.stage === "resolved") continue;
    if (!after.route.includes(c.vessel)) continue;
    const a = c.atMm - c.lengthMm / 2;
    if (!(before.tipMm < a && after.tipMm > c.atMm + c.lengthMm / 2)) continue;
    const r = rngFrom(`${after.rng.s}:recross:${after.log.length}:${c.id}`);
    if (rnd(r) >= recrossSubintimalP(c)) continue;
    const st = syncWire(after, { ...cloneWire(after.wire), subintimal: { fromMm: a } });
    return tele(st, "wire-subintimal", { atMm: a, cause: "re-crossing the dissection" });
  }
  return after;
}

// ---------------------------------------------------------------------------
// The debrief
// ---------------------------------------------------------------------------

/** The debrief's flow and closure lines: the start's mechanism, how the drugs were given, and the errors of technique. */
export function flowDebrief(st: Pick<PciState, "log" | "cx" | "t">): { ok: boolean; text: string }[] {
  const out: { ok: boolean; text: string }[] = [];
  const start = flowStartRecord(st);
  if (start) out.push({ ok: true, text: `The case opened at "${FLOW_STARTS[start.id].title}"${start.mechanism ? `; the mechanism was ${start.mechanism}` : ""}.` });
  const doses = st.log.filter((r) => r.kind === "ic-drug");
  // what reached the bed is the recorded flag: a microcatheter tip short of the segment delivers as the guide does
  const guideOnly = doses.filter((r) => r.data.distal !== true && r.data.timiBefore !== null && r.data.timiBefore !== undefined && Number(r.data.timiBefore) <= 1);
  if (guideOnly.length) out.push({ ok: false, text: `${guideOnly.length} intracoronary dose${guideOnly.length > 1 ? "s were" : " was"} given with TIMI 0-1 flow without reaching beyond the segment (into the guide, or through a microcatheter short of it): the drug refluxes; give it distally through a microcatheter at or beyond the segment.` });
  if (doses.some((r) => r.data.distal === true)) out.push({ ok: true, text: "A microvascular agent was delivered distally." });
  if (doses.some((r) => r.data.agent === "gtn" && r.data.noReflow === true)) out.push({ ok: false, text: "Nitrate was given for no-reflow: nitrates have not been shown to help no-reflow (Oxford ch 8)." });
  for (const c of st.cx.list) {
    if (c.kind === "no-reflow" && c.data.stentedOver) out.push({ ok: false, text: "A stent was placed over embolised plaque: it releases more debris (Brilakis 25.2)." });
    if (c.kind === "no-reflow" && c.data.refractoryRaised) out.push({ ok: true, text: "Two distal vasodilator doses did not raise the TIMI grade: refractory no-reflow." });
    if (c.kind === "dissection" && c.data.aortic) {
      const n = Number(c.data.injectionsAfter ?? 0);
      if (n > 0) out.push({ ok: false, text: `${n} injection${n > 1 ? "s" : ""} into the RCA after the aortocoronary dissection: each enlarged the stain.` });
      if (c.data.protrusionMm !== undefined) {
        const p = Number(c.data.protrusionMm);
        out.push({
          ok: p >= 1 && p <= 2,
          text: p < 0 ? `The ostial stent stopped ${(-p).toFixed(1)} mm short of the ostium (1-2 mm protrusion intended).` : `The ostial stent protruded ${p.toFixed(1)} mm into the aorta (1-2 mm intended).`,
        });
      }
    }
  }
  if (st.cx.list.some((c) => c.kind === "air") && !manifoldCheckedSinceAir(st)) out.push({ ok: false, text: "The manifold and connections were not checked after the air event." });
  return out;
}

/** The TIMI grade of the no-reflow at a severity, as the debrief names it (re-exported for the console's guided aid). */
export const timiOfSeverity = timiFor;
