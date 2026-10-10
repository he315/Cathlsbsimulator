// ---------------------------------------------------------------------------
// Pressure wire on the current anatomy: equalisation, Pd/Pa and the
// wave-free ratio at the sensor, recorded measurements, pullback recording
// and the drift check.
//
// pci-pressure-wire-console adds the set-up the physiology lab's
// pressure-wire session checks (pwSession.ts, lesson pm-physiology-setup,
// Brilakis 12.2, Oxford ch 8), on the PCI lab's own anatomy:
//   - equalisation at the guide tip is refused while the haemostatic valve
//     is open or the introducer is still in it, or while the guide still
//     holds contrast (it damps the aortic pressure: flush with saline first);
//     it fails while the aortic transducer has not been zeroed and levelled,
//     or while air in the aortic line damps the aortic trace (the Transducer
//     of patient/transducer.ts, through pwSession.aorticLine);
//   - a loose aortic transducer drifts the aortic channel (pressureWire.ts
//     stepPressureWire), which the drift check at the guide tip shows;
//   - hyperaemia by an intracoronary adenosine bolus through the guide (the
//     guide holds part of it until it is flushed: pwSession MP_GUIDE_HOLDUP),
//     an IV infusion run by the team, or an IC adenosine syringe the team gave
//     (its 'drug' telemetry), evaluated with pwSession's adenosine model
//     (injectionHyperaemia, ivTargetHyperaemia: the patient engine's
//     pharmacology), never the case's answer;
//   - the jailed side branch: with the wire exchanged into a branch whose
//     ostium a stent has pinched, the reading is that branch's, with the
//     ostium narrowed physiologically less than it looks
//     (MP_JAILED_FUNCTIONAL_SHARE); the operator wiring that branch with the
//     pressure wire is what the tips' 'side-branch-compromise' is raised from
//     in the physiology phase (pwJailedBranchMeasured);
//   - co-registration of the pullback on the stored angiogram (the route of
//     the recording placed on the stored run's image, pressureWire.frameXY).
// The log messages say what the console and the operator see; why a step
// failed is kept on the set-up (eq.reason) for guided aids and the debrief,
// and the branch the wire is in only in telemetry (guided practice adds it to
// the label).
// Set-up faults come from the case's launch (param 'pwFault', comma-separated
// PwLabFault ids), armed once per case (armPressureWire): the aortic line and
// its transducer belong to the patient, not to the wire, so a fault put right
// stays put right when the wire is exchanged out and back in, and what has
// been given for hyperaemia stays on the record ('pw-line' telemetry).
// In the lab the aortic line is the patient engine's arterial line (the one
// the monitor shows and zeroes): the session mirrors its zero, level, air and
// offset into the set-up (pwWithAorticLine; src/ui/pci/inputBindings/
// pressureWire.ts), so equalisation checks the line the monitor shows.
// ---------------------------------------------------------------------------

import type { CoronaryTree, Sample } from "../../../render/xray/coronaryTree";
import { samplePos } from "../../../render/xray/coronaryTree";
import type { CArm, Lesion, VesselId } from "../../../types";
import { cameraBasis, projectPoint } from "../../projection";
import { ivAdenosineTauS } from "../../patient/pharmacology";
import { sensorMm } from "../coronaryWire";
import { routeEndMm, sampleAtMm } from "../geometry";
import {
  MP_JAILED_FUNCTIONAL_SHARE,
  MP_LOOSE_TRANSDUCER_DRIFT_MMHG_S,
  MP_UNZEROED_TRANSDUCER_MMHG,
  PW_LAB_FAULTS,
  driftCheck,
  equalise,
  equaliseValidAt,
  frameXY,
  measure,
  physiologyCase,
  recordSample,
  sensorX,
  type ChannelErrors,
  type PressureWireState,
  type PwLabFault,
  type PwLabHyperaemia,
  type PwLabSetup,
  type PwReading,
  type StoredFrame,
} from "../pressureWire";
import { MP_AIR_ML, MP_DISENGAGED_DELIVERY, MP_GUIDE_HOLDUP, MP_INTRODUCER_LEAK_MMHG, aorticLine, injectionHyperaemia, ivTargetHyperaemia, type PwInjection } from "../pwSession";
import { log, tele, type PciGeom, type PciScenario, type PciState } from "../state";
import { lumenFor } from "./patient";
import { MP_AIR_FAULT_MIN_ML } from "../../patient/transducer";

// --- the set-up --------------------------------------------------------------------------------

/** The set-up of a freshly loaded pressure wire: the introducer in the valve, the faults of the case present. */
export function initialPwSetup(faults: readonly PwLabFault[] = []): PwLabSetup {
  const has = (f: PwLabFault) => faults.includes(f);
  return {
    faults: [...new Set(faults)],
    introducer: true,
    airMl: has("line-air") ? MP_AIR_ML : 0,
    transducerZeroed: !has("transducer-unzeroed"),
    transducerLoose: has("transducer-loose"),
    paDriftMmHg: 0,
    flushedAt: null,
    hyper: { mode: "none" },
    eq: null,
  };
}

/** The set-up faults a launch names (param 'pwFault': comma-separated ids; unknown ids are ignored). */
export function pwFaultsFromParams(params: Readonly<Record<string, string>> | null | undefined): PwLabFault[] {
  const raw = params?.pwFault;
  if (!raw) return [];
  return raw
    .split(",")
    .map((x) => x.trim())
    .filter((x): x is PwLabFault => (PW_LAB_FAULTS as readonly string[]).includes(x));
}

/** What belongs to the patient's aortic line and the team, not to the wire: kept across a wire exchange. */
type PwLine = Pick<PwLabSetup, "faults" | "airMl" | "transducerZeroed" | "transducerLoose" | "paDriftMmHg" | "hyper">;

const lineOf = (s: PwLabSetup): PwLine => ({
  faults: [...s.faults],
  airMl: s.airMl,
  transducerZeroed: s.transducerZeroed,
  transducerLoose: s.transducerLoose,
  paDriftMmHg: s.paDriftMmHg,
  hyper: s.hyper,
});

/** The last record of the aortic line in the telemetry ('pw-line'), with its time, or null. */
function lastLine(st: PciState): { t: number; line: PwLine } | null {
  for (let i = st.log.length - 1; i >= 0; i--) {
    const r = st.log[i];
    if (r.kind === "pw-line" && r.data.line) return { t: r.t, line: r.data.line as PwLine };
  }
  return null;
}

/** A fresh wire's set-up on the aortic line as last recorded (a loose transducer has gone on drifting since), or null. */
function setupFromLine(st: PciState): PwLabSetup | null {
  const rec = lastLine(st);
  if (!rec) return null;
  const l = rec.line;
  const drift = l.paDriftMmHg + (l.transducerLoose ? MP_LOOSE_TRANSDUCER_DRIFT_MMHG_S * Math.max(0, st.t - rec.t) : 0);
  return { ...initialPwSetup([]), ...l, faults: [...l.faults], paDriftMmHg: drift };
}

/** The set-up of the loaded pressure wire (the aortic line as last recorded, else a default one, when none has been armed), or null without one. */
export function pwSetupOf(st: PciState): PwLabSetup | null {
  if (!st.pressure) return null;
  return st.pressure.setup ?? setupFromLine(st) ?? initialPwSetup();
}

/**
 * Arm the set-up on the loaded pressure wire (a set-up already armed is kept). The case's faults are armed
 * once per case: a wire loaded after an earlier one takes the aortic line as it was last recorded, faults
 * put right staying right and the hyperaemia given staying on the record.
 */
export function armPressureWire(st: PciState, faults: readonly PwLabFault[] = []): PciState {
  if (!st.pressure || st.pressure.setup) return st;
  const kept = setupFromLine(st);
  if (kept) return { ...st, pressure: { ...st.pressure, setup: kept } };
  const setup = initialPwSetup(faults);
  const n = tele({ ...st, pressure: { ...st.pressure, setup } }, "pw-armed", { faults: [...setup.faults] });
  return tele(n, "pw-line", { line: lineOf(setup) });
}

/** Record the aortic line in the telemetry when it has changed since its last record (its drift aside, which runs on the clock). */
export function pwKeepLine(st: PciState): PciState {
  const s = st.pressure?.setup;
  if (!s) return st;
  const cur = lineOf(s);
  const prev = lastLine(st);
  const key = (l: PwLine) => JSON.stringify({ ...l, paDriftMmHg: 0 });
  if (prev && key(prev.line) === key(cur)) return st;
  return tele(st, "pw-line", { line: cur });
}

function withSetup(st: PciState, f: (s: PwLabSetup, pw: PressureWireState) => PwLabSetup): PciState {
  if (!st.pressure) return st;
  const s0 = pwSetupOf(st)!;
  return { ...st, pressure: { ...st.pressure, setup: f(s0, st.pressure) } };
}

const without = (s: PwLabSetup, f: PwLabFault) => s.faults.filter((x) => x !== f);

/** Take the introducer out of the haemostatic valve (it went in with the wire). */
export function pwRemoveIntroducer(st: PciState): PciState {
  const s = pwSetupOf(st);
  if (!s) return log(st, "warn", "Load the pressure wire first.");
  if (!s.introducer) return st;
  return log(withSetup(st, (x) => ({ ...x, introducer: false })), "info", "Introducer out of the haemostatic valve.");
}

/**
 * Flush the guide with saline: the contrast is cleared, and an intracoronary bolus still in the guide is
 * carried into the artery (pwSession: the flush delivers the rest of the dose).
 */
export function pwFlushGuide(st: PciState): PciState {
  const s = pwSetupOf(st);
  if (!s) return st;
  let hy: PwLabHyperaemia = s.hyper;
  if (hy.mode === "ic" && hy.flushedAt === null) {
    const ug = hy.doseUg * MP_GUIDE_HOLDUP * (st.guide.engaged ? 1 : MP_DISENGAGED_DELIVERY);
    hy = { ...hy, flushedAt: st.t, parts: [...hy.parts, { t: st.t, ug }] };
  }
  const n = withSetup(st, (x) => ({ ...x, flushedAt: st.t, hyper: hy }));
  return log(tele(n, "pw-flush-guide", {}), "info", "Guide flushed with saline.");
}

/** The team flushes the aortic line (air out) and re-zeroes it. */
export function pwFlushAorticLine(st: PciState): PciState {
  const s = pwSetupOf(st);
  if (!s) return st;
  const n = withSetup(st, (x) => ({ ...x, airMl: 0, faults: without(x, "line-air") }));
  return log(tele(n, "pw-flush-aortic-line", {}), "info", "Aortic line flushed through the transducer.");
}

/** The team zeroes the aortic transducer to atmosphere and levels it at the heart (its drift so far is zeroed out). */
export function pwZeroTransducer(st: PciState): PciState {
  const s = pwSetupOf(st);
  if (!s) return st;
  const n = withSetup(st, (x) => ({ ...x, transducerZeroed: true, paDriftMmHg: 0, faults: without(x, "transducer-unzeroed") }));
  return log(tele(n, "pw-zero-transducer", {}), "info", "Aortic transducer zeroed to air and levelled at the heart.");
}

/** Check the transducer's connections: a loose one is tightened (and stops drifting from then on). */
export function pwCheckConnections(st: PciState): PciState {
  const s = pwSetupOf(st);
  if (!s) return st;
  const loose = s.transducerLoose;
  const n = withSetup(st, (x) => ({ ...x, transducerLoose: false, faults: without(x, "transducer-loose") }));
  return log(tele(n, "pw-check-connections", { loose }), "info", loose ? "One connection at the aortic transducer was loose: tightened." : "Transducer connections checked: all tight.");
}

/**
 * The guide still holds contrast: no saline flush since the wire went in or since the last injection
 * through the guide. `override` is the guide syringe's own state when the lab has one (its primed fraction:
 * 1 contrast, 0 saline), which also knows of a flush by hand on the syringe.
 */
export function pwGuideHoldsContrast(st: PciState, override?: number): boolean {
  if (override !== undefined && Number.isFinite(override)) return override > 0.5;
  const s = pwSetupOf(st);
  if (!s || s.flushedAt === null) return true;
  return st.lastInjectionT !== null && st.lastInjectionT >= s.flushedAt;
}

/**
 * The patient's arterial line as the lab's monitor has it (the patient engine's Transducer, read by the session:
 * src/ui/pci/inputBindings/pressureWire.ts aorticLineOf): zeroed to air, levelled at the phlebostatic axis, the
 * air in it (mL) and the offset it reads with (mmHg: its zero and its level, a loose transducer's drift aside).
 */
export interface PwAorticLine {
  zeroed: boolean;
  levelled: boolean;
  airMl: number;
  offsetMmHg: number;
}

/**
 * The pressure wire's aortic channel on the patient's arterial line: the set-up's transducer and air mirrored
 * from the line the monitor shows, so the console and the monitor read one aortic line (a fault put right on
 * either is right on both). Unchanged without a line (a headless caller) or without a set-up armed.
 */
export function pwWithAorticLine(st: PciState, line: PwAorticLine | null | undefined): PciState {
  const s = st.pressure?.setup;
  if (!line || !s || !st.pressure) return st;
  const zeroed = line.zeroed && line.levelled;
  const airMl = Math.max(0, line.airMl);
  const faults = s.faults.filter((f) => !(f === "line-air" && airMl < MP_AIR_FAULT_MIN_ML) && !(f === "transducer-unzeroed" && zeroed));
  if (s.transducerZeroed === zeroed && s.airMl === airMl && s.paLineOffsetMmHg === line.offsetMmHg && faults.length === s.faults.length) return st;
  return { ...st, pressure: { ...st.pressure, setup: { ...s, transducerZeroed: zeroed, airMl, paLineOffsetMmHg: line.offsetMmHg, faults } } };
}

/** The set-up errors on the two channels now: the introducer's leak, an unzeroed transducer (the line's own offset when known), a loose one's drift. */
export function pwChannelErrors(st: PciState): ChannelErrors {
  const s = pwSetupOf(st);
  if (!s) return {};
  const zeroErr = s.paLineOffsetMmHg ?? (s.transducerZeroed ? 0 : MP_UNZEROED_TRANSDUCER_MMHG);
  const paOffset = s.paDriftMmHg + zeroErr - (s.introducer ? MP_INTRODUCER_LEAK_MMHG : 0);
  return paOffset ? { paOffset } : {};
}

/** The aortic trace is overdamped now (air in the line, or contrast in the guide): the Transducer's verdict. */
export function pwAorticDamped(st: PciState, guideContrast?: number): boolean {
  const s = pwSetupOf(st);
  if (!s) return false;
  const contrastFrac = pwGuideHoldsContrast(st, guideContrast) ? 1 : 0;
  return aorticLine({ airMl: s.airMl, contrastFrac, introducer: s.introducer }).dynamic.verdict === "overdamped";
}

// --- hyperaemia ---------------------------------------------------------------------------------

const sideOf = (s: PciScenario): "left" | "right" => s.side;

/** An intracoronary adenosine bolus through the guide (µg): part reaches the artery now, the rest with the flush. */
export function pwGiveIcAdenosine(s: PciScenario, st: PciState, doseUg: number, o: { fast?: boolean } = {}): PciState {
  if (!st.pressure) return log(st, "warn", "Load the pressure wire first.");
  if (!(doseUg > 0) || !Number.isFinite(doseUg)) return log(st, "warn", "Choose the intracoronary adenosine dose first.");
  const engaged = st.guide.engaged;
  const now = doseUg * (1 - MP_GUIDE_HOLDUP) * (engaged ? 1 : MP_DISENGAGED_DELIVERY);
  const hy: PwLabHyperaemia = { mode: "ic", t0: st.t, doseUg, side: sideOf(s), vessel: s.target.vessel, engaged, fast: !!o.fast, parts: [{ t: st.t, ug: now }], flushedAt: null };
  const n = withSetup(st, (x) => ({ ...x, hyper: hy }));
  return log(tele(n, "pw-adenosine", { route: "ic", doseUg, fast: !!o.fast, engaged }), "info", `Intracoronary adenosine ${Math.round(doseUg)} µg through the guide${engaged ? "" : " (guide disengaged)"}; flush it in with saline.`);
}

/** The team runs IV adenosine at a rate (µg/kg/min) through a vein. */
export function pwStartIvAdenosine(st: PciState, rateUgKgMin: number, site: "hand" | "peripheral" | "central" = "central"): PciState {
  if (!st.pressure) return log(st, "warn", "Load the pressure wire first.");
  if (!(rateUgKgMin > 0) || !Number.isFinite(rateUgKgMin)) return log(st, "warn", "Choose the infusion rate first.");
  const h0 = pwHyperaemia(st);
  const n = withSetup(st, (x) => ({ ...x, hyper: { mode: "iv", t0: st.t, rateUgKgMin, site, h0 } }));
  const where = site === "central" ? "a central vein" : site === "peripheral" ? "a large antecubital vein" : "the hand-vein cannula";
  return log(tele(n, "pw-adenosine", { route: "iv", rateUgKgMin, site }), "info", `The team runs IV adenosine at ${Math.round(rateUgKgMin)} µg/kg/min through ${where}.`);
}

/** Stop the adenosine (the infusion off; a bolus simply wears off). */
export function pwStopAdenosine(st: PciState): PciState {
  const s = pwSetupOf(st);
  if (!s || s.hyper.mode === "none") return st;
  const n = withSetup(st, (x) => ({ ...x, hyper: { mode: "none" } }));
  return log(tele(n, "pw-adenosine-stop", {}), "info", "Adenosine stopped.");
}

const asInjection = (hy: Extract<PwLabHyperaemia, { mode: "ic" }>): PwInjection => ({
  t: hy.t0,
  agent: "adenosine",
  doseUg: hy.doseUg,
  ml: 0,
  side: hy.side,
  vessel: hy.vessel,
  engaged: hy.engaged,
  fast: hy.fast,
  parts: hy.parts,
  flushedAt: hy.flushedAt,
});

/** Intracoronary adenosine syringes the team gave (the 'drug' telemetry of actions/drugs.ts giveDrug), each delivered whole. */
function teamIcHyperaemia(s: PciScenario | null, st: PciState): number {
  let h = 0;
  for (let i = st.log.length - 1; i >= 0; i--) {
    const r = st.log[i];
    if (st.t - r.t > 120) break;
    if (r.kind !== "drug" || r.data.drug !== "ic-adenosine") continue;
    const dose = Number(r.data.dose);
    if (!(dose > 0)) continue;
    const side = s ? sideOf(s) : "left";
    h = Math.max(h, injectionHyperaemia({ t: r.t, agent: "adenosine", doseUg: dose, ml: 0, side, vessel: s?.target.vessel ?? "", engaged: true, fast: false, parts: [{ t: r.t, ug: dose }], flushedAt: r.t }, st.t, false));
  }
  return h;
}

/**
 * Hyperaemia now (0 rest, 1 maximal): the larger of the state's own (a headless caller's, from the engine)
 * and what was given in the lab (the console's bolus or infusion, the team's IC syringe), by pwSession's
 * adenosine model.
 */
export function pwHyperaemia(st: PciState, s: PciScenario | null = null): number {
  let h = st.hyperaemia;
  const set = pwSetupOf(st);
  const hy = set?.hyper;
  if (hy?.mode === "ic") h = Math.max(h, injectionHyperaemia(asInjection(hy), st.t, false));
  if (hy?.mode === "iv") {
    const target = ivTargetHyperaemia({ rate: hy.rateUgKgMin, delivered: 1, agent: "adenosine" }, false);
    const dt = st.t - hy.t0;
    const v = dt <= 0 ? hy.h0 : target + (hy.h0 - target) * Math.exp(-dt / ivAdenosineTauS(hy.site === "central" ? "central" : "peripheral"));
    h = Math.max(h, v);
  }
  if (st.pressure) h = Math.max(h, teamIcHyperaemia(s, st));
  return Math.min(1, Math.max(0, h));
}

// --- the anatomy the sensor reads -----------------------------------------------------------------

/** The side branch the wire tip is in (a named branch off the target vessel, not the target itself), or null. */
export function pwBranchOf(g: PciGeom, st: PciState): { name: string; id: VesselId } | null {
  const tip = st.route[st.route.length - 1];
  if (!tip || tip === g.lesion.vessel || !st.route.includes(g.lesion.vessel)) return null;
  const v = g.byName.get(tip);
  return v?.lesionId ? { name: v.name, id: v.lesionId } : null;
}

/**
 * The lesions as the sensor meets them: the lumen as it is now (lumenFor), with the ostium of a branch a stent
 * has pinched narrowed physiologically by MP_JAILED_FUNCTIONAL_SHARE of how narrow it looks.
 */
function physiologicalLesions(s: PciScenario, g: PciGeom, st: PciState): Lesion[] {
  const pinched = st.cx.list.filter((c) => c.kind === "side-branch" && c.stage !== "resolved");
  if (!pinched.length) return lumenFor(s, g, st).lesions;
  // the lumen without the pinched ostia, then each ostium as lumenFor draws it from its complication alone
  // (the lesions after the target's), narrowed physiologically by the share
  const others = lumenFor(s, g, { ...st, cx: { ...st.cx, list: st.cx.list.filter((c) => !pinched.includes(c)) } }).lesions;
  const ostia = pinched.flatMap((c) => pwJailedLesions(s, g, st, c));
  return [...others, ...ostia];
}

/** The ostial narrowing of one pinched side branch as the pressure meets it: lumenFor's, scaled by MP_JAILED_FUNCTIONAL_SHARE. */
function pwJailedLesions(s: PciScenario, g: PciGeom, st: PciState, c: PciState["cx"]["list"][number]): Lesion[] {
  const own = lumenFor(s, g, { ...st, cx: { ...st.cx, list: [c] } }).lesions.slice(1);
  return own.map((l) => ({ ...l, severity: Math.round(l.severity * MP_JAILED_FUNCTIONAL_SHARE) }));
}

/** The physiology case on the current anatomy (lesions as they are now), and the sensor's position on it. */
export function pressureContext(s: PciScenario, g: PciGeom, st: PciState, tree: CoronaryTree) {
  const branch = pwBranchOf(g, st);
  const vessel = branch?.id ?? s.target.vessel;
  const pc = physiologyCase(tree, physiologicalLesions(s, g, st), vessel, { guideDeep: st.guide.engaged && (st.guide.depthMm > 3 || st.guide.extensionMm !== null) });
  if (!pc) return null;
  const smm = sensorMm(st.wire);
  const x = smm === null ? 0 : sensorX(pc.v, smm);
  return { ...pc, x, sensorMm: smm, branch: branch?.name ?? null };
}

/** Why an equalisation does not take now (the first reason in the order the console checks), or null. */
function equaliseBlock(st: PciState, guideContrast?: number): { reason: string; refused: boolean; text: string } | null {
  const s = pwSetupOf(st)!;
  if (st.valveOpen) return { reason: "valve-open", refused: true, text: "Equalisation refused: close the haemostatic valve first; an open valve leaks and the aortic pressure reads low." };
  if (s.introducer) return { reason: "introducer", refused: true, text: "Equalisation refused: take the introducer out of the haemostatic valve first; it leaks and damps the aortic pressure." };
  if (pwGuideHoldsContrast(st, guideContrast))
    return { reason: "contrast", refused: true, text: "Equalisation refused: the guide still holds contrast, which damps the aortic pressure. Flush the guide with saline, then equalise." };
  if (!s.transducerZeroed) return { reason: "transducer-unzeroed", refused: false, text: "Equalisation failed: the aortic pressure does not agree with the wire's at the guide tip." };
  if (pwAorticDamped(st, guideContrast)) return { reason: "line-air", refused: false, text: "Equalisation failed: the aortic trace is damped and does not superimpose on the wire's." };
  return null;
}

/**
 * Equalise with the sensor where it is (it should sit just beyond the guide tip). Refused or failed while the
 * set-up is not ready (equaliseBlock); `o.guideContrast` is the guide syringe's primed fraction when the lab has
 * one.
 */
export function equalisePressure(s: PciScenario, g: PciGeom, st: PciState, tree: CoronaryTree, o: { guideContrast?: number } = {}): PciState {
  if (!st.pressure) return log(st, "warn", "Load the pressure wire first.");
  const ctx = pressureContext(s, g, st, tree);
  if (!ctx || ctx.sensorMm === null) return st;
  const smm = ctx.sensorMm;
  const block = equaliseBlock(st, o.guideContrast);
  if (block) {
    let n = withSetup(st, (x) => ({ ...x, eq: { t: st.t, sensorMm: smm, ok: false, atTip: equaliseValidAt(smm), reason: block.reason, text: block.text, refused: block.refused } }));
    n = tele(n, "pw-equalise", { sensorMm: smm, ok: false, refused: block.refused, reason: block.reason });
    return log(n, "warn", block.text);
  }
  const r = equalise(st.pressure, ctx.c, ctx.x, smm, pwChannelErrors(st));
  let n: PciState = { ...st, pressure: r.pw };
  n = withSetup(n, (x) => ({ ...x, eq: { t: st.t, sensorMm: smm, ok: r.ok, atTip: r.ok } }));
  n = tele(n, "pw-equalise", { sensorMm: smm, ok: r.ok });
  return log(n, r.ok ? "info" : "warn", r.ok ? "Pressures equalised with the sensor just beyond the guide tip." : "Equalised with the sensor away from the guide tip: any gradient there has been zeroed out.");
}

export type PressureContext = NonNullable<ReturnType<typeof pressureContext>>;
export type PressureReading = PwReading & { sensorMm: number; x: number; h: number; branch: string | null };

/** The reading at the sensor for a context already built (pressureView: one physiology case per state). */
function readingIn(s: PciScenario, st: PciState, ctx: PressureContext | null): PressureReading | null {
  if (!st.pressure || !ctx || ctx.sensorMm === null) return null;
  const h = pwHyperaemia(st, s);
  const r = measure(ctx.c, ctx.x, h, st.pressure.offset, st.guide.engaged, pwChannelErrors(st));
  return { ...r, sensorMm: ctx.sensorMm, x: ctx.x, h, branch: ctx.branch };
}

/** The physiology case and the reading at the sensor, from one physiology case (what the console draws). */
export function pressureView(s: PciScenario, g: PciGeom, st: PciState, tree: CoronaryTree): { ctx: PressureContext | null; reading: PressureReading | null } {
  if (!st.pressure) return { ctx: null, reading: null };
  const ctx = pressureContext(s, g, st, tree);
  return { ctx, reading: readingIn(s, st, ctx) };
}

/** Read Pa, Pd and the ratios now at the sensor (hyperaemia: pwHyperaemia; the channels' set-up errors applied). */
export function pressureReadout(s: PciScenario, g: PciGeom, st: PciState, tree: CoronaryTree): PressureReading | null {
  return pressureView(s, g, st, tree).reading;
}

/**
 * Record the reading now. The branch the wire is in goes into the telemetry (the debrief reads it) and, in
 * guided practice only (`o.guided`), into the label and the log: whether the wire is in the intended vessel is
 * read from the image (tip pci-phys-wire-wrong-branch).
 */
export function recordPressure(s: PciScenario, g: PciGeom, st: PciState, tree: CoronaryTree, o: { label?: string; guided?: boolean } = {}): PciState {
  const r = pressureReadout(s, g, st, tree);
  if (!r || !st.pressure) return st;
  const label = o.label ?? (st.stents.length ? "post-stent" : "pre-stent");
  const kind = r.h > 0.6 ? "hyperaemia" : "rest";
  const where = r.branch && o.guided ? `${label}, ${r.branch}` : label;
  const m = { kind, t: st.t, mm: r.sensorMm, pdpa: r.pdpa, wfp: r.wfp, label: where } as const;
  const n = { ...st, pressure: { ...st.pressure, measurements: [...st.pressure.measurements, m] } };
  return log(tele(n, "pw-measure", { ...m, ...(r.branch ? { branch: r.branch } : {}) }), "info", kind === "hyperaemia" ? `Hyperaemic Pd/Pa ${r.pdpa.toFixed(2)} (${where}).` : `Resting Pd/Pa ${r.pdpa.toFixed(2)}, wave-free ratio ${r.wfp.toFixed(2)} (${where}).`);
}

/** Start (or stop) recording a pullback against a stored run (its number), keeping the route the wire is on as it starts. */
export function setPullbackRecording(st: PciState, on: boolean, frameId: number | null = null): PciState {
  if (!st.pressure) return st;
  const pb = st.pressure.pullback;
  const pullback = on ? { recording: true, samples: [], frameId, route: [...st.route] } : { ...pb, recording: false };
  return { ...st, pressure: { ...st.pressure, pullback } };
}

/** Add the current reading to a recording pullback. */
export function samplePullback(s: PciScenario, g: PciGeom, st: PciState, tree: CoronaryTree): PciState {
  if (!st.pressure?.pullback.recording) return st;
  const r = pressureReadout(s, g, st, tree);
  if (!r) return st;
  const hyp = r.h > 0.6;
  return { ...st, pressure: recordSample(st.pressure, { mm: r.sensorMm, ratio: hyp ? r.pdpa : r.wfp, hyperaemic: hyp, t: st.t }) };
}

export function pressureDriftCheck(s: PciScenario, g: PciGeom, st: PciState, tree: CoronaryTree): PciState {
  if (!st.pressure) return st;
  const ctx = pressureContext(s, g, st, tree);
  if (!ctx) return st;
  const r = driftCheck(st.pressure, ctx.c, pwChannelErrors(st));
  const n = { ...st, pressure: { ...st.pressure, measurements: [...st.pressure.measurements, { kind: "drift-check" as const, t: st.t, mm: 0, pdpa: r.pdpa, wfp: r.pdpa, label: "guide tip", ok: r.ok }] } };
  return log(tele(n, "pw-drift-check", { pdpa: r.pdpa, ok: r.ok }), r.ok ? "good" : "warn", r.ok ? `Pd/Pa at the guide tip ${r.pdpa.toFixed(2)}: no significant drift.` : `Pd/Pa at the guide tip ${r.pdpa.toFixed(2)}: the sensor has drifted. Re-equalise and repeat.`);
}

// --- the jailed side branch ---------------------------------------------------------------------------

/**
 * The operator is measuring a jailed side branch: the pressure wire is loaded and its tip is in a branch whose
 * ostium a stent has pinched (the complication engine's side-branch compromise, not resolved). The operator's
 * own act of wiring that branch, so it names nothing the learner has not chosen to look at; what the event
 * source src/ui/lab/pciEvents/pressureWire.ts raises 'side-branch-compromise' from in the physiology phase
 * (tip pci-phys-jailed-side-branch).
 */
export function pwJailedBranchMeasured(st: PciState): boolean {
  if (st.wireKind !== "pressure" || !st.pressure) return false;
  const tip = st.route[st.route.length - 1];
  if (!tip || st.route.length < 2) return false;
  return st.cx.list.some((c) => c.kind === "side-branch" && c.stage !== "resolved" && c.vessel === tip);
}

// --- co-registration on the stored angiogram ------------------------------------------------------

/**
 * A stored frame of the route for co-registration: each route position, 1 mm apart from the guide tip to the
 * end of the route, placed on the frame by `place` (a heart-surface sample to the frame's coordinates).
 */
export function pwRouteFrame(g: PciGeom, route: readonly string[], place: (s: Sample) => { x: number; y: number }, id = 0, phase = 0): StoredFrame {
  const end = routeEndMm(g, route as string[]);
  const f: StoredFrame = { id, phase, mm: [], xy: [] };
  for (let mm = 0; mm <= end; mm += 1) {
    const a = sampleAtMm(g, route as string[], mm);
    if (!a) continue;
    f.mm.push(mm);
    f.xy.push(place(a.s));
  }
  return f;
}

/**
 * The stored frame of a run on the detector plane (mm): the route projected at the run's C-arm angles (the
 * rest geometry, end-diastole). The console places the route on the stored image itself
 * (src/ui/pci/inputBindings/pressureWire.ts storedRunPlace).
 */
export function pwStoredFrame(g: PciGeom, route: readonly string[], cArm: CArm, id = 0): StoredFrame {
  const basis = cameraBasis(cArm);
  return pwRouteFrame(g, route, (s) => projectPoint(samplePos(g.tree.heart, s), basis), id);
}

/**
 * Where the recorded pullback's samples (with whether each was taken at hyperaemia) and the sensor now sit on a
 * stored frame (in the frame's own coordinates).
 */
export function pwCoregistered(
  f: StoredFrame,
  pw: PressureWireState,
  sensorNowMm: number | null
): { dots: { x: number; y: number; ratio: number; hyperaemic: boolean }[]; sensor: { x: number; y: number } | null } {
  if (!f.mm.length) return { dots: [], sensor: null };
  const dots = pw.pullback.samples.filter((p) => p.mm >= 0).map((p) => ({ ...frameXY(f, p.mm), ratio: p.ratio, hyperaemic: p.hyperaemic }));
  return { dots, sensor: sensorNowMm !== null && sensorNowMm >= 0 ? frameXY(f, sensorNowMm) : null };
}
