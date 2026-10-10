// ---------------------------------------------------------------------------
// Haemodynamics lab engine.
//
// Each scenario defines chamber pressure landmarks (a/x/v/y waves, systolic,
// diastolic and end-diastolic pressures, the dicrotic notch) plus a saturation
// run. Waveforms are built from those landmarks on a cardiac timeline whose
// valve events (mitral closure, aortic opening/closure, mitral opening) are
// derived from heart rate, so every number the learner "measures" — means,
// gradients, ejection and filling periods, Fick output, resistances, Gorlin
// areas, shunt ratios — is computed from the same traces they are looking at.
//
// Respiration modulates the traces: normal inspiratory fall, Kussmaul's sign,
// ventricular interdependence (discordant LV/RV systolic peaks in
// constriction, concordant in restriction), and pulsus paradoxus.
// ---------------------------------------------------------------------------

import {
  assumedVO2,
  bsaDuBois,
  cardiacPower,
  fickCO,
  flammMixedVenous,
  gorlinAVA,
  gorlinMVA,
  papi,
  pvrWU,
  qpQs,
  svrWU,
} from "./calc";
import type { LabEvent } from "../content/lab/tips";

export type Chamber = "RA" | "RV" | "PA" | "PCWP" | "LV" | "Ao";
export type SatSite = "SVC" | "IVC" | "RA" | "RV" | "PA" | "Ao";

export interface AtrialSpec {
  a: number;
  x: number;
  v: number;
  y: number;
  base: number;
  /** slow, shallow y descent (tamponade, mitral stenosis) */
  slowY?: boolean;
}
export interface VentSpec {
  sys: number;
  min: number;
  edp: number;
  /** pressure just before atrial contraction */
  preA: number;
  /** early rapid filling then plateau ("dip and plateau", square-root sign) */
  dip?: boolean;
  /** time of the systolic peak as a fraction of the ejection period */
  peakAt?: number;
}
export interface ArtSpec {
  sys: number;
  dia: number;
  notch: number;
  shape?: "normal" | "parvus" | "bisferiens";
  peakAt?: number;
}

export type RespPattern = "normal" | "kussmaul" | "constriction" | "restriction" | "tamponade";

export interface HaemoScenario {
  id: string;
  title: string;
  category: "normal" | "valve" | "pericardial" | "myocardial" | "pulmonary" | "shunt" | "shock";
  /** presentation, written so it does not give the diagnosis away */
  brief: string;
  hr: number;
  heightCm: number;
  weightKg: number;
  hb: number;
  /** systolic ejection period (s); defaults from heart rate */
  sep?: number;
  ra: AtrialSpec;
  rv: VentSpec;
  pa: ArtSpec;
  pcwp: AtrialSpec;
  lv: VentSpec;
  ao: ArtSpec;
  sats: Record<SatSite, number> & { pv?: number };
  resp: RespPattern;
  /** inspiratory fall in aortic systolic pressure (mmHg) */
  pulsus?: number;
  /** post-extrasystolic response */
  pvcResponse?: "hocm" | "fixed";
  /** thermodilution unreliable here (why) */
  tdUnreliable?: string;
  /**
   * Scenario events raised for the whole study (haemo-study-session-and-tips): the condition being
   * studied, in the tip vocabulary (src/content/lab/tips.ts LAB_EVENTS), so that tips gated on a
   * condition (TipTrigger.requires) appear only in its own scenario. Tip context only: never shown
   * on the live screen.
   */
  events?: LabEvent[];
  /**
   * Measurement sets of a scenario studied twice, before and after PCI (the cardiogenic shock
   * presets). The scenario's own landmarks are the 'pre' set; 'post' overrides them. withSet()
   * gives the scenario as measured in a set.
   */
  sets?: Record<HaemoSetId, HaemoSetSpec>;
  /**
   * The aortic valve study (haemo-aortic-stenosis-studies): the echo report the learner reads before
   * deciding whether to cross the valve, and whether crossing is indicated. Scenarios without it keep
   * the plain 'cross into LV' control.
   */
  avStudy?: AvStudySpec;
  /**
   * Staged interventions that transform the scenario's landmarks (haemo-aortic-stenosis-studies:
   * the stages of a dobutamine infusion, baseline first). applyModifier() gives the scenario at a
   * stage; gorlinLive() the valve area computed from it.
   */
  modifiers?: HaemoModifier[];
  diagnosis: string;
  distractors: string[];
  /** what a good operator looks at to make the diagnosis */
  keyFindings: string[];
  explanation: string;
}

export type HaemoSetId = "pre" | "post";
export const HAEMO_SET_IDS: readonly HaemoSetId[] = ["pre", "post"];

/** One measurement set: what the learner is told about the moment, and the landmarks that differ from the scenario's own. */
export interface HaemoSetSpec {
  title: string;
  /** what has happened before this set, written so it does not give the numbers away */
  note: string;
  hr?: number;
  sep?: number;
  ra?: AtrialSpec;
  rv?: VentSpec;
  pa?: ArtSpec;
  pcwp?: AtrialSpec;
  lv?: VentSpec;
  ao?: ArtSpec;
  sats?: Record<SatSite, number> & { pv?: number };
  resp?: RespPattern;
  pulsus?: number;
}

/** A CT aortic valve calcium score, read against the sex-specific thresholds of the 2025 ESC/EACTS guideline. */
export interface CtCalciumScore {
  agatston: number;
  sex: "male" | "female";
}

/**
 * What the learner is given before an aortic valve study (haemo-aortic-stenosis-studies). The report
 * lines are what the echo department and the referrer wrote; they are teaching cases written for
 * this app (MODEL PARAMETERS), not measured patients.
 */
export interface AvStudySpec {
  /** the echo report and the referral, line by line, as the learner reads them */
  report: string[];
  /** a CT valve calcium score, released once the dobutamine study is finished (or with the report when there is no dobutamine study) */
  ctCalcium?: CtCalciumScore;
  /**
   * Whether the non-invasive data make crossing necessary: inconclusive, or discordant with the
   * symptoms (hb-specific-conditions-as, 'Deciding whether to cross'). The answer to the cross-or-not
   * decision: debrief only, never on the live screen.
   */
  crossingIndicated: boolean;
  /** why, for the debrief */
  why: string;
}

/**
 * One stage of a staged intervention (a dobutamine infusion). Every value is a MODEL PARAMETER of the
 * teaching case except the doses, which follow the protocol of the Academy lesson hd-valves-as-area
 * ('Invasive dobutamine study': increase stepwise, for example 5, then 10, up to 20 micrograms/kg/min).
 */
export interface HaemoModifier {
  id: string;
  label: string;
  /** dobutamine dose, micrograms/kg/min (0 at baseline) */
  dose: number;
  hr: number;
  /** systolic ejection period (s/beat) */
  sep: number;
  /** forward stroke volume (mL): with the heart rate it sets the output, through the mixed venous saturation */
  strokeVolumeMl: number;
  /**
   * The effective aortic orifice the valve opens to at this flow (cm²). Fixed in a true severe
   * stenosis, opening with flow in a pseudo-severe one. The LV systolic pressure, and so the gradient
   * on the traces, follows from it and the flow; nothing on the screen shows it.
   */
  orificeCm2: number;
  /** the aortic pressure at this stage */
  ao: ArtSpec;
}

/** The scenario as measured in a set (the scenario itself for null, an unknown set or a scenario without sets). */
export function withSet(s: HaemoScenario, set: HaemoSetId | null | undefined): HaemoScenario {
  const spec = set ? s.sets?.[set] : undefined;
  if (!spec) return s;
  const { title: _title, note: _note, ...over } = spec;
  return { ...s, ...over };
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
export interface Timeline {
  T: number; // cycle length (s)
  tA: number; // atrial contraction peak
  tMC: number; // mitral closure / onset of ventricular systole
  tAO: number; // aortic valve opening
  tAC: number; // aortic valve closure (dicrotic notch)
  tMO: number; // mitral valve opening
  sep: number; // systolic ejection period
  dfp: number; // diastolic filling period
}

export function timeline(s: Pick<HaemoScenario, "hr" | "sep">): Timeline {
  const T = 60 / s.hr;
  const k = Math.sqrt(70 / s.hr);
  const tMC = 0.16 * Math.min(1, k);
  const tA = 0.6 * tMC;
  const tAO = tMC + 0.05;
  const sep = s.sep ?? 0.3 * k;
  const tAC = tAO + sep;
  const tMO = tAC + 0.07;
  return { T, tA, tMC, tAO, tAC, tMO, sep, dfp: T - tMO + tMC };
}

type Key = [number, number];

/** Cosine interpolation through keyframes (times ascending). */
function interp(keys: Key[], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [ta, va] = keys[i];
    const [tb, vb] = keys[i + 1];
    if (t <= tb) {
      const f = tb === ta ? 1 : (t - ta) / (tb - ta);
      return va + (vb - va) * (1 - Math.cos(Math.PI * f)) * 0.5;
    }
  }
  return keys[keys.length - 1][1];
}

function wrap(t: number, T: number) {
  return ((t % T) + T) % T;
}

// ---------------------------------------------------------------------------
// Beat shapes (one cycle, τ ∈ [0, T), τ = 0 at the P wave)
// ---------------------------------------------------------------------------
function atrialBeat(a: AtrialSpec, tl: Timeline, tau: number): number {
  const { T, tA, tMC, tAO, tMO, sep } = tl;
  const c = (a.a + a.x) / 2 + 1;
  const yAt = tMO + (a.slowY ? 0.16 : 0.08);
  const keys: Key[] = [
    [0, a.base],
    [tA, a.a],
    [tMC + 0.005, (a.a + c) / 2],
    [tMC + 0.03, c],
    [tAO + 0.45 * sep, a.x],
    [tMO - 0.005, a.v],
    [Math.min(yAt, T - 0.02), a.y],
    [T, a.base],
  ];
  return interp(keys, tau);
}

function ventBeat(v: VentSpec, art: ArtSpec, tl: Timeline, tau: number): number {
  const { T, tA, tMC, tAO, tAC, tMO, sep } = tl;
  const peak = tAO + (v.peakAt ?? 0.4) * sep;
  const notchV = art.notch - 4;
  const D = T - tMO; // time left for diastole in this beat
  const tMin = tMO + Math.min(0.04, 0.3 * D);
  const keys: Key[] = [
    [0, v.preA],
    [tA + 0.02, v.edp],
    [tMC, v.edp],
    [tAO, Math.max(art.dia, v.edp + 2)],
    [peak, v.sys],
    [tAC, Math.min(v.sys, notchV)],
    [tMO, v.min + 2],
    [tMin, v.min],
  ];
  if (v.dip) {
    keys.push([tMO + Math.min(0.11, 0.6 * D), v.edp], [T, v.preA]);
  } else {
    // rapid early filling, then slow diastasis up to the pre-atrial pressure
    keys.push([tMin + 0.4 * (T - tMin), v.min + 0.8 * (v.preA - v.min)], [T, v.preA]);
  }
  return interp(keys, tau);
}

function arterialBeat(a: ArtSpec, tl: Timeline, tau: number): number {
  const { T, tAO, tAC, sep } = tl;
  const notchEnd = tAC + 0.05;
  // diastolic run-off: from the dicrotic wave to the next aortic opening
  const runoff = (s: number, S: number) => a.dia + (a.notch + 3 - a.dia) * Math.pow(1 - s / S, 1.25);
  const S = T - notchEnd + tAO;
  if (tau < tAO) return runoff(T - notchEnd + tau, S);
  if (tau >= notchEnd) return runoff(tau - notchEnd, S);
  let keys: Key[];
  if (a.shape === "bisferiens") {
    keys = [
      [tAO, a.dia],
      [tAO + 0.2 * sep, a.sys],
      [tAO + 0.45 * sep, a.sys - 18],
      [tAO + 0.72 * sep, a.sys - 7],
      [tAC - 0.005, a.notch + 2],
      [tAC + 0.015, a.notch],
      [notchEnd, a.notch + 3],
    ];
  } else {
    const pk = a.peakAt ?? (a.shape === "parvus" ? 0.7 : 0.35);
    keys = [
      [tAO, a.dia],
      [tAO + pk * sep, a.sys],
      [tAC - 0.005, a.notch + 2],
      [tAC + 0.015, a.notch],
      [notchEnd, a.notch + 3],
    ];
  }
  return interp(keys, tau);
}

/** PCWP is a delayed, damped LA trace. */
const WEDGE_DELAY = 0.06;

function beatValue(s: HaemoScenario, ch: Chamber, tau: number, tl: Timeline): number {
  switch (ch) {
    case "RA":
      return atrialBeat(s.ra, tl, tau);
    case "PCWP":
      return atrialBeat(s.pcwp, tl, wrap(tau - WEDGE_DELAY, tl.T));
    case "RV":
      return ventBeat(s.rv, s.pa, tl, tau);
    case "LV":
      return ventBeat(s.lv, s.ao, tl, tau);
    case "PA":
      return arterialBeat(s.pa, tl, tau);
    case "Ao":
      return arterialBeat(s.ao, tl, tau);
  }
}

// ---------------------------------------------------------------------------
// Live sampling with respiration and extrasystoles
// ---------------------------------------------------------------------------
export const RESP_PERIOD = 5; // s (12 breaths/min)

/** 0 at end-expiration, 1 at peak inspiration. */
export function inspiration(t: number): number {
  return (1 - Math.cos((2 * Math.PI * t) / RESP_PERIOD)) / 2;
}

export interface SampleOptions {
  respiration: boolean;
  /** every 6th beat is a ventricular extrasystole followed by a potentiated beat */
  pvc: boolean;
}

function systolicWeight(p: number, lo: number, hi: number) {
  return Math.max(0, Math.min(1, (p - lo) / Math.max(1, hi - lo)));
}

export function sample(s: HaemoScenario, ch: Chamber, t: number, opt: SampleOptions): number {
  const tl = timeline(s);
  const beat = Math.floor(t / tl.T);
  const tau = wrap(t, tl.T);
  let p = beatValue(s, ch, tau, tl);

  if (opt.pvc && (ch === "LV" || ch === "Ao")) {
    const k = ((beat % 6) + 6) % 6;
    if (k === 4) {
      // premature beat: poorly filled, weak ejection
      const lo = ch === "LV" ? s.lv.edp : s.ao.dia;
      const hi = ch === "LV" ? s.lv.sys : s.ao.sys;
      const w = systolicWeight(p, lo, hi);
      p -= w * (hi - lo) * 0.45;
    } else if (k === 5) {
      const art = ch === "Ao";
      const w = art ? systolicWeight(p, s.ao.dia, s.ao.sys) : systolicWeight(p, s.lv.edp, s.lv.sys);
      if (s.pvcResponse === "hocm") {
        // more contractility → more dynamic obstruction: LV up, aortic systolic and pulse pressure down
        p += art ? -w * 22 : w * 45;
      } else {
        // fixed obstruction: both rise with the potentiated stroke volume
        p += art ? w * 12 : w * 20;
      }
    }
  }

  if (!opt.respiration) return p;
  const insp = inspiration(t);
  const intrathoracicFall = 4 * insp;
  switch (ch) {
    case "RA":
      return s.resp === "kussmaul" || s.resp === "constriction" ? p + 3 * insp : p - intrathoracicFall;
    case "PCWP":
      return s.resp === "constriction" ? p - 7 * insp : p - intrathoracicFall;
    case "PA":
      return p - intrathoracicFall;
    case "RV": {
      const w = systolicWeight(p, s.rv.edp, s.rv.sys);
      if (s.resp === "constriction" || s.resp === "tamponade") return p + 7 * insp * w - 1.5 * insp;
      return p - intrathoracicFall;
    }
    case "LV": {
      const w = systolicWeight(p, s.lv.edp, s.lv.sys);
      if (s.resp === "constriction") return p - 10 * insp * w - 2 * insp;
      if (s.resp === "tamponade") return p - (s.pulsus ?? 15) * insp * w - 1.5 * insp;
      return p - intrathoracicFall;
    }
    case "Ao": {
      const w = systolicWeight(p, s.ao.dia, s.ao.sys);
      const fall = s.resp === "tamponade" ? s.pulsus ?? 15 : s.resp === "constriction" ? 10 : 4;
      return p - fall * insp * w - 2 * insp;
    }
  }
}

// ---------------------------------------------------------------------------
// Measurements (end-expiration, single representative beat)
// ---------------------------------------------------------------------------
export interface ChamberMeasure {
  sys: number;
  dia: number;
  mean: number;
  edp?: number;
  a?: number;
  v?: number;
}

const N = 600;

function beatSamples(s: HaemoScenario, ch: Chamber): number[] {
  const tl = timeline(s);
  return Array.from({ length: N }, (_, i) => beatValue(s, ch, (i / N) * tl.T, tl));
}

export function measure(s: HaemoScenario, ch: Chamber): ChamberMeasure {
  const tl = timeline(s);
  const xs = beatSamples(s, ch);
  const mean = xs.reduce((a, b) => a + b, 0) / N;
  const sys = Math.max(...xs);
  const dia = Math.min(...xs);
  const out: ChamberMeasure = { sys, dia, mean };
  if (ch === "LV" || ch === "RV") out.edp = beatValue(s, ch, tl.tMC, tl);
  if (ch === "RA" || ch === "PCWP") {
    const shift = ch === "PCWP" ? WEDGE_DELAY : 0;
    const spec = ch === "RA" ? s.ra : s.pcwp;
    out.a = Math.max(spec.a, beatValue(s, ch, wrap(tl.tA + shift, tl.T), tl));
    out.v = Math.max(spec.v, beatValue(s, ch, wrap(tl.tMO - 0.005 + shift, tl.T), tl));
  }
  return roundMeasure(out);
}

function roundMeasure(m: ChamberMeasure): ChamberMeasure {
  const r = (x?: number) => (x === undefined ? undefined : Math.round(x));
  return { sys: r(m.sys)!, dia: r(m.dia)!, mean: r(m.mean)!, edp: r(m.edp), a: r(m.a), v: r(m.v) };
}

/** Mean systolic gradient LV → aorta over the ejection period (mmHg). */
export function aorticGradient(s: HaemoScenario): { mean: number; peakToPeak: number; peakInstant: number } {
  const tl = timeline(s);
  let sum = 0,
    n = 0,
    peakInst = 0;
  for (let i = 0; i <= 200; i++) {
    const tau = tl.tAO + (tl.sep * i) / 200;
    const d = beatValue(s, "LV", tau, tl) - beatValue(s, "Ao", tau, tl);
    sum += Math.max(0, d);
    peakInst = Math.max(peakInst, d);
    n++;
  }
  const lv = measure(s, "LV");
  const ao = measure(s, "Ao");
  return { mean: sum / n, peakToPeak: lv.sys - ao.sys, peakInstant: peakInst };
}

/** Mean diastolic gradient PCWP → LV over the filling period (mmHg). */
export function mitralGradient(s: HaemoScenario): number {
  const tl = timeline(s);
  let sum = 0;
  const M = 200;
  for (let i = 0; i <= M; i++) {
    const tau = wrap(tl.tMO + (tl.dfp * i) / M, tl.T);
    sum += Math.max(0, beatValue(s, "PCWP", tau, tl) - beatValue(s, "LV", tau, tl));
  }
  return sum / (M + 1);
}

// ---------------------------------------------------------------------------
// Derived haemodynamics
// ---------------------------------------------------------------------------
export interface Derived {
  bsa: number;
  vo2: number;
  mixedVenous: number;
  /** systemic flow (Qs) by Fick */
  co: number;
  ci: number;
  qp: number;
  qpqs: number;
  map: number;
  mpap: number;
  rap: number;
  pawp: number;
  svr: number;
  pvr: number;
  tpg: number;
  dpg: number;
  cpo: number;
  papi: number;
  raPawp: number;
  aortic: { mean: number; peakToPeak: number; peakInstant: number; ava: number };
  mitral: { mean: number; mva: number };
  timeline: Timeline;
}

/** Where to take mixed venous from: proximal to the most proximal step-up. */
export function mixedVenousSat(s: HaemoScenario): number {
  const sv = s.sats;
  const atrialStep = sv.RA - flammMixedVenous(sv.SVC, sv.IVC) >= 0.07;
  if (atrialStep) return flammMixedVenous(sv.SVC, sv.IVC);
  const ventStep = sv.RV - sv.RA >= 0.05;
  if (ventStep) return sv.RA;
  const paStep = sv.PA - sv.RV >= 0.05;
  if (paStep) return sv.RV;
  return sv.PA;
}

export type StepUp = "none" | "atrial" | "ventricular" | "great-artery";

/** Screening thresholds commonly taught for an oximetry run (mean of samples). */
export function stepUp(s: HaemoScenario): StepUp {
  const sv = s.sats;
  if (sv.RA - flammMixedVenous(sv.SVC, sv.IVC) >= 0.07) return "atrial";
  if (sv.RV - sv.RA >= 0.05) return "ventricular";
  if (sv.PA - sv.RV >= 0.05) return "great-artery";
  return "none";
}

export function derive(s: HaemoScenario): Derived {
  const tl = timeline(s);
  const bsa = bsaDuBois(s.heightCm, s.weightKg);
  const vo2 = assumedVO2(bsa);
  const mv = mixedVenousSat(s);
  const pv = s.sats.pv ?? s.sats.Ao;
  const co = fickCO(vo2, s.hb, s.sats.Ao, mv);
  const qp = fickCO(vo2, s.hb, pv, s.sats.PA);
  const ao = measure(s, "Ao");
  const pa = measure(s, "PA");
  const ra = measure(s, "RA");
  const w = measure(s, "PCWP");
  const ag = aorticGradient(s);
  const mg = mitralGradient(s);
  return {
    bsa,
    vo2,
    mixedVenous: mv,
    co,
    ci: co / bsa,
    qp,
    qpqs: qpQs(s.sats.Ao, mv, pv, s.sats.PA),
    map: ao.mean,
    mpap: pa.mean,
    rap: ra.mean,
    pawp: w.mean,
    svr: svrWU(ao.mean, ra.mean, co),
    pvr: pvrWU(pa.mean, w.mean, qp),
    tpg: pa.mean - w.mean,
    dpg: pa.dia - w.mean,
    cpo: cardiacPower(ao.mean, co),
    papi: papi(pa.sys, pa.dia, Math.max(1, ra.mean)),
    raPawp: ra.mean / Math.max(1, w.mean),
    aortic: { ...ag, ava: ag.mean > 2 ? gorlinAVA(co, s.hr, tl.sep, ag.mean) : NaN },
    mitral: { mean: mg, mva: mg > 2 ? gorlinMVA(co, s.hr, tl.dfp, mg) : NaN },
    timeline: tl,
  };
}

// ---------------------------------------------------------------------------
// Staged interventions: the dobutamine study of low-flow low-gradient aortic
// stenosis (haemo-aortic-stenosis-studies)
//
// A stage sets the heart rate, ejection period, stroke volume, aortic pressure
// and the effective orifice the valve opens to. The output is carried by the
// mixed venous saturation (so a Fick output from the stage's saturations is
// the stage's output), and the LV systolic pressure is solved so that the mean
// LV-aortic gradient on the traces is the one that flow through that orifice
// produces (Gorlin's relation). Everything the learner reads at a stage, and
// the Gorlin area gorlinLive() computes, comes from the stage's traces.
// ---------------------------------------------------------------------------

/** Venous saturations with no step-up anywhere: the mixed venous value is the PA one. */
function venousSats(mv: number, ao: number): HaemoScenario["sats"] {
  return { SVC: mv - 0.01, IVC: mv + 0.03, RA: mv, RV: mv, PA: mv, Ao: ao };
}

/** The LV systolic pressure that gives this mean systolic gradient on the traces (bisection; the gradient rises with it). */
function lvSystolicFor(s: HaemoScenario, meanGradient: number): number {
  let lo = s.ao.dia;
  let hi = s.ao.sys + 250;
  const grad = (sys: number) => aorticGradient({ ...s, lv: { ...s.lv, sys } }).mean;
  for (let i = 0; i < 50 && hi - lo > 0.005; i++) {
    const mid = (lo + hi) / 2;
    if (grad(mid) < meanGradient) lo = mid;
    else hi = mid;
  }
  return Math.round(((lo + hi) / 2) * 100) / 100;
}

const MODIFIED = new WeakMap<HaemoScenario, Map<HaemoModifier, HaemoScenario>>();

/**
 * The scenario at a stage of a staged intervention: heart rate, ejection period and aortic pressure
 * from the stage, saturations that carry its output (mixed venous rounded to a whole per cent, as the
 * oximeter reads it), and the LV systolic pressure solved for the gradient that the output produces
 * across the stage's orifice. Memoised per scenario and stage.
 */
export function applyModifier(s: HaemoScenario, m: HaemoModifier): HaemoScenario {
  let byMod = MODIFIED.get(s);
  if (!byMod) MODIFIED.set(s, (byMod = new Map()));
  const hit = byMod.get(m);
  if (hit) return hit;
  const vo2 = assumedVO2(bsaDuBois(s.heightCm, s.weightKg));
  const target = (m.strokeVolumeMl * m.hr) / 1000;
  const sa = s.sats.Ao;
  const mv = Math.round((sa - vo2 / (13.6 * s.hb * target)) * 100) / 100;
  const sats = venousSats(mv, sa);
  const co = fickCO(vo2, s.hb, sa, mv);
  const meanGradient = Math.pow((co * 1000) / (m.hr * m.sep * 44.3 * m.orificeCm2), 2);
  const staged: HaemoScenario = { ...s, hr: m.hr, sep: m.sep, ao: { ...m.ao }, sats };
  const out: HaemoScenario = { ...staged, lv: { ...s.lv, sys: lvSystolicFor(staged, meanGradient) } };
  byMod.set(m, out);
  return out;
}

/** A stage of the scenario's staged intervention, by id (or the modifier itself); null or unknown gives null. */
export function modifierOf(s: HaemoScenario, stage: HaemoModifier | string | null | undefined): HaemoModifier | null {
  if (!stage) return null;
  if (typeof stage !== "string") return s.modifiers?.includes(stage) ? stage : null;
  return s.modifiers?.find((m) => m.id === stage) ?? null;
}

/** What the recorder and the output measurement give at a stage, and the Gorlin area computed from them. */
export interface LiveGorlin {
  /** dobutamine dose (micrograms/kg/min), 0 at baseline or without a stage */
  dose: number;
  hr: number;
  /** systolic ejection period (s/beat) */
  sep: number;
  /** output (L/min) */
  co: number;
  /** stroke volume (mL) */
  sv: number;
  /** mean LV-aortic gradient from simultaneous traces (mmHg) */
  meanGradient: number;
  /** pullback peak-to-peak difference (mmHg) */
  peakToPeak: number;
  /** mean arterial pressure (mmHg) */
  map: number;
  /** Gorlin aortic valve area (cm²); NaN when the gradient is 2 mmHg or less, as derive() */
  ava: number;
}

/**
 * The Gorlin aortic valve area live: calc.gorlinAVA from the output, heart rate, ejection period and
 * mean gradient of the scenario at a stage of its staged intervention (the scenario itself without
 * one). The area moves with flow exactly as the formula makes it, which is the point of the exercise.
 */
export function gorlinLive(s: HaemoScenario, stage?: HaemoModifier | string | null): LiveGorlin {
  const m = modifierOf(s, stage);
  const x = m ? applyModifier(s, m) : s;
  const d = derive(x);
  return {
    dose: m?.dose ?? 0,
    hr: x.hr,
    sep: d.timeline.sep,
    co: d.co,
    sv: (d.co * 1000) / x.hr,
    meanGradient: d.aortic.mean,
    peakToPeak: d.aortic.peakToPeak,
    map: d.map,
    ava: d.aortic.ava,
  };
}

/** A scenario whose own landmarks are its first stage (the baseline of the infusion). */
function stagedScenario(s: HaemoScenario & { modifiers: HaemoModifier[] }): HaemoScenario {
  const base = applyModifier(s, s.modifiers[0]);
  return { ...s, hr: base.hr, sep: base.sep, ao: base.ao, lv: base.lv, sats: base.sats };
}

/** The stages of a dobutamine infusion: rows of [dose, HR, SEP, stroke volume mL, orifice cm², aortic systolic, aortic diastolic]. */
function dobutamineStages(rows: readonly [number, number, number, number, number, number, number][]): HaemoModifier[] {
  return rows.map(([dose, hr, sep, sv, orifice, sys, dia]) => ({
    id: dose === 0 ? "baseline" : `dobutamine-${dose}`,
    label: dose === 0 ? "Baseline" : `Dobutamine ${dose} micrograms/kg/min`,
    dose,
    hr,
    sep,
    strokeVolumeMl: sv,
    orificeCm2: orifice,
    ao: { sys, dia, notch: Math.round(dia + 0.62 * (sys - dia)), shape: "parvus" },
  }));
}

// ---------------------------------------------------------------------------
// Scenario library (teaching cases written for this app)
// ---------------------------------------------------------------------------
const normalSats = (pa: number, ao = 0.98) => ({ SVC: pa - 0.01, IVC: pa + 0.03, RA: pa, RV: pa, PA: pa, Ao: ao });

export const HAEMO_SCENARIOS: HaemoScenario[] = [
  {
    id: "normal",
    title: "Atypical chest pain, breathless on exertion",
    category: "normal",
    brief: "54-year-old man, exertional breathlessness. Echo technically limited. Right and left heart catheter to exclude a haemodynamic cause.",
    hr: 70,
    heightCm: 175,
    weightKg: 75,
    hb: 14,
    ra: { a: 6, x: 2, v: 5, y: 2, base: 3 },
    rv: { sys: 25, min: 1, edp: 5, preA: 3 },
    pa: { sys: 25, dia: 10, notch: 14 },
    pcwp: { a: 10, x: 6, v: 12, y: 5, base: 7 },
    lv: { sys: 122, min: 2, edp: 10, preA: 6 },
    ao: { sys: 120, dia: 75, notch: 95 },
    sats: normalSats(0.75),
    resp: "normal",
    events: [],
    diagnosis: "Normal resting haemodynamics",
    distractors: ["Pre-capillary pulmonary hypertension", "Constrictive pericarditis", "Severe aortic stenosis"],
    keyFindings: ["RA mean < 8", "mPAP ≤ 20", "PAWP ≤ 15", "no gradient on LV–Ao pullback", "no saturation step-up"],
    explanation:
      "All pressures sit in the normal range, there is no systolic gradient on pullback and the oximetry run shows no step-up. A normal resting study does not exclude exercise-induced abnormalities; that needs an exercise or fluid challenge.",
  },
  {
    id: "aortic-stenosis",
    title: "Exertional syncope with an ejection systolic murmur",
    category: "valve",
    brief:
      "79-year-old woman with exertional presyncope. Echo images are poor and the Doppler gradient is discordant with the valve appearance. Invasive assessment requested.",
    hr: 72,
    heightCm: 160,
    weightKg: 68,
    hb: 12.5,
    sep: 0.34,
    ra: { a: 8, x: 4, v: 7, y: 4, base: 5 },
    rv: { sys: 40, min: 2, edp: 8, preA: 5 },
    pa: { sys: 40, dia: 18, notch: 24 },
    pcwp: { a: 24, x: 14, v: 19, y: 13, base: 15 },
    lv: { sys: 205, min: 4, edp: 22, preA: 12, peakAt: 0.5 },
    ao: { sys: 118, dia: 66, notch: 100, shape: "parvus" },
    sats: { SVC: 0.67, IVC: 0.71, RA: 0.68, RV: 0.68, PA: 0.68, Ao: 0.96 },
    resp: "normal",
    pvcResponse: "fixed",
    events: ["aortic-stenosis"],
    diagnosis: "Severe aortic stenosis",
    distractors: ["Hypertrophic obstructive cardiomyopathy", "Normal valve with LV hypertension", "Severe aortic regurgitation"],
    keyFindings: [
      "simultaneous LV–Ao systolic gradient",
      "slow-rising aortic upstroke (parvus et tardus)",
      "Gorlin area < 1.0 cm²",
      "post-extrasystolic beat: LV and aortic pressures both rise (fixed obstruction)",
      "prominent PAWP a wave from a stiff, hypertrophied LV",
    ],
    explanation:
      "A fixed valvular obstruction gives a systolic gradient across the aortic valve with a slow-rising aortic trace. After an extrasystole both LV and aortic pressures rise. Crossing a calcified valve carries a risk of cerebral embolism, so invasive gradients are reserved for when echo is non-diagnostic or discordant.",
  },
  {
    id: "mitral-stenosis",
    title: "Breathlessness and palpitations, previous rheumatic fever",
    category: "valve",
    brief: "44-year-old woman born in South Asia, NYHA III breathlessness. Echo suggests a thickened mitral valve; Doppler is borderline.",
    hr: 82,
    heightCm: 160,
    weightKg: 58,
    hb: 12.5,
    ra: { a: 12, x: 7, v: 10, y: 7, base: 8 },
    rv: { sys: 55, min: 3, edp: 10, preA: 7 },
    pa: { sys: 55, dia: 28, notch: 34 },
    pcwp: { a: 22, x: 15, v: 23, y: 17, base: 17, slowY: true },
    lv: { sys: 115, min: 2, edp: 7, preA: 5 },
    ao: { sys: 115, dia: 72, notch: 92 },
    sats: { SVC: 0.64, IVC: 0.68, RA: 0.65, RV: 0.65, PA: 0.65, Ao: 0.96 },
    resp: "normal",
    events: ["mitral-stenosis"],
    diagnosis: "Severe mitral stenosis",
    distractors: ["Severe mitral regurgitation", "Pre-capillary pulmonary hypertension", "Restrictive cardiomyopathy"],
    keyFindings: [
      "diastolic gradient between PAWP and LV throughout diastole",
      "slow y descent on the PAWP trace",
      "low LV end-diastolic pressure despite high PAWP",
      "secondary pulmonary hypertension",
    ],
    explanation:
      "A persistent diastolic gradient from left atrium (here PAWP) to LV, with a low LVEDP, defines mitral stenosis. PAWP overestimates the gradient because of its delay and damping; a transseptal LA pressure is the reference when the decision rests on it.",
  },
  {
    id: "constriction",
    title: "Ascites and oedema after cardiac surgery years ago",
    category: "pericardial",
    brief: "61-year-old man, CABG 9 years ago, now with ascites, raised JVP and peripheral oedema. Preserved LV ejection fraction.",
    hr: 88,
    heightCm: 172,
    weightKg: 68,
    hb: 13,
    ra: { a: 21, x: 10, v: 20, y: 8, base: 18 },
    rv: { sys: 36, min: 2, edp: 18, preA: 18, dip: true },
    pa: { sys: 36, dia: 18, notch: 24 },
    pcwp: { a: 22, x: 14, v: 22, y: 12, base: 20 },
    lv: { sys: 108, min: 3, edp: 20, preA: 20, dip: true },
    ao: { sys: 105, dia: 70, notch: 88 },
    sats: { SVC: 0.62, IVC: 0.66, RA: 0.63, RV: 0.63, PA: 0.63, Ao: 0.97 },
    resp: "constriction",
    events: ["constriction"],
    diagnosis: "Constrictive pericarditis",
    distractors: ["Restrictive cardiomyopathy", "Cardiac tamponade", "RV infarction"],
    keyFindings: [
      "equalised diastolic pressures (LVEDP − RVEDP ≤ 5)",
      "dip-and-plateau in both ventricles",
      "prominent x and y descents (M/W pattern) with Kussmaul's sign",
      "discordant LV and RV systolic peaks with inspiration (ventricular interdependence)",
      "RVEDP/RVSP > 1/3, PASP < 55",
    ],
    explanation:
      "A rigid pericardium fixes total cardiac volume: diastolic pressures equalise and inspiration fills the RV at the expense of the LV, so RV systolic pressure rises as LV systolic pressure falls. Discordance (systolic area index) is the most discriminating invasive sign against restriction.",
  },
  {
    id: "restriction",
    title: "Breathlessness with thick ventricular walls and low voltages",
    category: "myocardial",
    brief: "72-year-old man, carpal tunnel surgery both hands, progressive breathlessness, thick LV walls on echo, low voltage ECG.",
    hr: 80,
    heightCm: 172,
    weightKg: 70,
    hb: 12.5,
    ra: { a: 17, x: 11, v: 17, y: 9, base: 14 },
    rv: { sys: 58, min: 2, edp: 15, preA: 14, dip: true },
    pa: { sys: 58, dia: 26, notch: 32 },
    pcwp: { a: 27, x: 20, v: 29, y: 18, base: 24 },
    lv: { sys: 110, min: 4, edp: 26, preA: 24, dip: true },
    ao: { sys: 105, dia: 68, notch: 86 },
    sats: { SVC: 0.6, IVC: 0.64, RA: 0.61, RV: 0.61, PA: 0.61, Ao: 0.96 },
    resp: "restriction",
    events: ["restriction"],
    diagnosis: "Restrictive cardiomyopathy",
    distractors: ["Constrictive pericarditis", "Cardiac tamponade", "Isolated post-capillary PH from systolic heart failure"],
    keyFindings: [
      "LVEDP exceeds RVEDP by more than 5 mmHg",
      "concordant LV and RV systolic changes with respiration",
      "PASP > 55 mmHg, RVEDP/RVSP < 1/3",
      "dip-and-plateau can occur in both conditions",
    ],
    explanation:
      "Stiff myocardium raises filling pressures, usually more on the left, and does not produce the ventricular interdependence of constriction: LV and RV systolic pressures move together with breathing.",
  },
  {
    id: "tamponade",
    title: "Hypotension two hours after a complex PCI",
    category: "pericardial",
    brief: "68-year-old woman, rotational atherectomy and stenting of the RCA earlier today. Now hypotensive, tachycardic and anxious.",
    hr: 118,
    heightCm: 170,
    weightKg: 70,
    hb: 12,
    ra: { a: 17, x: 11, v: 16, y: 15.5, base: 16, slowY: true },
    rv: { sys: 32, min: 14, edp: 16, preA: 16 },
    pa: { sys: 32, dia: 17, notch: 22 },
    pcwp: { a: 17, x: 14, v: 17, y: 16, base: 16, slowY: true },
    lv: { sys: 92, min: 14, edp: 17, preA: 16 },
    ao: { sys: 90, dia: 62, notch: 78 },
    sats: { SVC: 0.55, IVC: 0.6, RA: 0.56, RV: 0.56, PA: 0.56, Ao: 0.97 },
    resp: "tamponade",
    pulsus: 22,
    events: ["tamponade"],
    diagnosis: "Cardiac tamponade",
    distractors: ["Constrictive pericarditis", "RV infarction", "Hypovolaemia from access-site bleeding"],
    keyFindings: [
      "equal, elevated diastolic pressures across all chambers",
      "blunted or absent y descent",
      "pulsus paradoxus > 10 mmHg",
      "no dip-and-plateau",
    ],
    explanation:
      "Pericardial pressure compresses every chamber throughout diastole, so filling is limited all the way through and the y descent disappears. A fall in systolic pressure of more than 10 mmHg on inspiration is pulsus paradoxus. After a complex PCI, think coronary perforation and image the pericardium at once.",
  },
  {
    id: "hocm",
    title: "Exertional syncope in a young man with a loud murmur",
    category: "myocardial",
    brief: "34-year-old man, exertional syncope, family history of sudden death, systolic murmur that increases on standing.",
    hr: 68,
    heightCm: 180,
    weightKg: 82,
    hb: 14.5,
    ra: { a: 7, x: 3, v: 6, y: 3, base: 4 },
    rv: { sys: 30, min: 1, edp: 6, preA: 4 },
    pa: { sys: 30, dia: 13, notch: 17 },
    pcwp: { a: 20, x: 11, v: 18, y: 10, base: 13 },
    lv: { sys: 200, min: 3, edp: 20, preA: 12, peakAt: 0.75 },
    ao: { sys: 124, dia: 70, notch: 100, shape: "bisferiens" },
    sats: normalSats(0.73, 0.97),
    resp: "normal",
    pvcResponse: "hocm",
    events: ["hocm"],
    diagnosis: "Hypertrophic obstructive cardiomyopathy (dynamic LVOT obstruction)",
    distractors: ["Severe valvular aortic stenosis", "Normal haemodynamics", "Restrictive cardiomyopathy"],
    keyFindings: [
      "late-peaking LV pressure with a large intraventricular gradient",
      "spike-and-dome aortic trace",
      "after an extrasystole the LV pressure rises but aortic systolic and pulse pressure fall (Brockenbrough–Braunwald–Morrow sign)",
    ],
    explanation:
      "Dynamic obstruction worsens with increased contractility, so the post-extrasystolic beat increases the gradient and narrows the aortic pulse pressure. A fixed valvular stenosis does the opposite. Use an end-hole catheter and a careful intracavitary pullback to show the gradient lies below the valve.",
  },
  {
    id: "pah",
    title: "Progressive breathlessness in a young woman",
    category: "pulmonary",
    brief: "38-year-old woman, 18 months of progressive breathlessness and exertional presyncope. Echo: dilated RV, high estimated PA pressure, normal left heart.",
    hr: 92,
    heightCm: 162,
    weightKg: 60,
    hb: 14,
    ra: { a: 16, x: 8, v: 14, y: 8, base: 11 },
    rv: { sys: 82, min: 3, edp: 13, preA: 10 },
    pa: { sys: 82, dia: 34, notch: 48 },
    pcwp: { a: 10, x: 6, v: 11, y: 6, base: 8 },
    lv: { sys: 105, min: 2, edp: 9, preA: 6 },
    ao: { sys: 105, dia: 68, notch: 85 },
    sats: { SVC: 0.62, IVC: 0.66, RA: 0.63, RV: 0.63, PA: 0.63, Ao: 0.95 },
    resp: "normal",
    tdUnreliable: "significant tricuspid regurgitation and low output make thermodilution less reliable; Fick is preferred here",
    events: ["pulmonary-hypertension"],
    diagnosis: "Pre-capillary pulmonary hypertension",
    distractors: [
      "Isolated post-capillary PH (left heart disease)",
      "Combined post- and pre-capillary PH",
      "Normal pulmonary haemodynamics",
    ],
    keyFindings: ["mPAP > 20 mmHg", "PAWP ≤ 15 mmHg", "PVR > 2 WU (ESC/ERS 2022 definitions)", "large RA a wave from a hypertrophied RV"],
    explanation:
      "Raised pulmonary pressure with a normal wedge and high pulmonary vascular resistance places the problem in the pulmonary vasculature. Vasoreactivity testing is considered in suspected idiopathic, heritable or drug-induced PAH.",
  },
  {
    id: "ipcph",
    title: "Breathless with a dilated, poorly contracting LV",
    category: "pulmonary",
    brief: "66-year-old man, ischaemic cardiomyopathy (EF 25%), being assessed for advanced heart failure therapies.",
    hr: 84,
    heightCm: 176,
    weightKg: 88,
    hb: 13.5,
    ra: { a: 12, x: 7, v: 13, y: 7, base: 9 },
    rv: { sys: 42, min: 3, edp: 12, preA: 9 },
    pa: { sys: 40, dia: 23, notch: 29 },
    pcwp: { a: 24, x: 19, v: 33, y: 19, base: 23 },
    lv: { sys: 98, min: 4, edp: 26, preA: 18 },
    ao: { sys: 98, dia: 64, notch: 80 },
    sats: { SVC: 0.56, IVC: 0.6, RA: 0.57, RV: 0.57, PA: 0.57, Ao: 0.96 },
    resp: "normal",
    events: ["pulmonary-hypertension"],
    diagnosis: "Isolated post-capillary PH (left heart disease)",
    distractors: ["Pre-capillary pulmonary hypertension", "Combined post- and pre-capillary PH", "Constrictive pericarditis"],
    keyFindings: ["mPAP > 20 mmHg", "PAWP > 15 mmHg", "PVR ≤ 2 WU", "large v waves from functional mitral regurgitation"],
    explanation:
      "The pulmonary pressure is raised passively by a high left atrial pressure; resistance across the pulmonary bed is not raised. A high PVR in this setting (combined pre- and post-capillary PH) matters for transplant and LVAD candidacy.",
  },
  {
    id: "asd",
    title: "Palpitations and a fixed split second heart sound",
    category: "shunt",
    brief: "41-year-old woman, palpitations, fixed splitting of S2, RV dilatation on echo. Oximetry run requested.",
    hr: 76,
    heightCm: 165,
    weightKg: 62,
    hb: 13.5,
    ra: { a: 8, x: 5, v: 8, y: 5, base: 6 },
    rv: { sys: 36, min: 2, edp: 7, preA: 5 },
    pa: { sys: 34, dia: 13, notch: 18 },
    pcwp: { a: 10, x: 7, v: 11, y: 7, base: 8 },
    lv: { sys: 112, min: 2, edp: 9, preA: 6 },
    ao: { sys: 112, dia: 70, notch: 90 },
    sats: { SVC: 0.7, IVC: 0.76, RA: 0.86, RV: 0.86, PA: 0.86, Ao: 0.97, pv: 0.98 },
    resp: "normal",
    tdUnreliable: "a left-to-right shunt makes thermodilution unreliable; use Fick",
    events: ["atrial-shunt"],
    diagnosis: "Atrial-level left-to-right shunt (Qp:Qs ≈ 2)",
    distractors: ["Ventricular-level left-to-right shunt", "Great-artery level shunt (e.g. PDA)", "No significant shunt"],
    keyFindings: [
      "saturation step-up from the venae cavae to the RA",
      "mixed venous by Flamm: (3 × SVC + IVC) / 4",
      "Qp:Qs ≥ 1.5 is generally considered significant",
      "the same step-up can come from anomalous pulmonary venous drainage; imaging decides",
    ],
    explanation:
      "Oxygenated blood enters the right heart at atrial level, so saturation jumps between the venae cavae and the RA. Because the RA receives the shunt, mixed venous saturation is calculated from caval samples.",
  },
  {
    id: "vsr",
    title: "New murmur and shock five days after an infarct",
    category: "shunt",
    brief: "74-year-old man, late-presenting anterior STEMI 5 days ago, now hypotensive with a new harsh pansystolic murmur.",
    hr: 112,
    heightCm: 170,
    weightKg: 78,
    hb: 12.5,
    ra: { a: 15, x: 10, v: 15, y: 9, base: 12 },
    rv: { sys: 44, min: 4, edp: 14, preA: 12 },
    pa: { sys: 44, dia: 22, notch: 28 },
    pcwp: { a: 22, x: 16, v: 30, y: 16, base: 20 },
    lv: { sys: 88, min: 6, edp: 22, preA: 16 },
    ao: { sys: 86, dia: 54, notch: 70 },
    sats: { SVC: 0.55, IVC: 0.6, RA: 0.56, RV: 0.8, PA: 0.81, Ao: 0.94, pv: 0.97 },
    resp: "normal",
    tdUnreliable: "shunt flow makes thermodilution unreliable",
    events: ["ventricular-shunt", "cardiogenic-shock"],
    diagnosis: "Ventricular-level left-to-right shunt (post-infarction septal rupture)",
    distractors: ["Acute severe mitral regurgitation (papillary muscle rupture)", "Atrial-level shunt", "Cardiogenic shock without a mechanical complication"],
    keyFindings: ["step-up from RA to RV", "high Qp:Qs", "v waves can be present without severe MR"],
    explanation:
      "A step-up at ventricular level after an infarct means a septal rupture until proved otherwise. Large v waves are not specific: they can arise from the high pulmonary venous return of the shunt itself. The oximetry run separates the two mechanical complications.",
  },
  {
    id: "lv-shock",
    title: "Anterior STEMI with cold peripheries",
    category: "shock",
    brief: "63-year-old man, anterior STEMI, after primary PCI to the proximal LAD: cool, clammy, rising lactate, on noradrenaline.",
    hr: 108,
    heightCm: 175,
    weightKg: 82,
    hb: 13,
    ra: { a: 11, x: 7, v: 11, y: 7, base: 9 },
    rv: { sys: 40, min: 3, edp: 11, preA: 9 },
    pa: { sys: 40, dia: 24, notch: 29 },
    pcwp: { a: 26, x: 20, v: 30, y: 21, base: 25 },
    lv: { sys: 84, min: 6, edp: 28, preA: 20 },
    ao: { sys: 82, dia: 54, notch: 68 },
    sats: { SVC: 0.48, IVC: 0.52, RA: 0.49, RV: 0.49, PA: 0.49, Ao: 0.95 },
    resp: "normal",
    events: ["cardiogenic-shock"],
    diagnosis: "LV-predominant cardiogenic shock",
    distractors: ["RV-predominant cardiogenic shock", "Distributive (vasodilatory) shock", "Cardiac tamponade"],
    keyFindings: ["CI < 2.2 L/min/m²", "PAWP high, RA relatively low (RA/PAWP < 0.8)", "CPO < 0.6 W", "PAPi > 0.9 (RV coping)"],
    explanation:
      "Low output with a high wedge and preserved RV indices points to left ventricular failure. Cardiac power output is one of the strongest haemodynamic correlates of mortality in cardiogenic shock; PAPi helps judge whether the RV will tolerate LV unloading alone.",
  },
  {
    id: "rv-infarct",
    title: "Inferior STEMI, hypotension, clear lungs",
    category: "shock",
    brief: "70-year-old woman, inferior STEMI with ST elevation in V4R, hypotension, raised JVP and clear lung fields.",
    hr: 58,
    heightCm: 168,
    weightKg: 76,
    hb: 13.5,
    ra: { a: 18, x: 12, v: 17, y: 10, base: 16 },
    rv: { sys: 28, min: 6, edp: 17, preA: 15, dip: true },
    pa: { sys: 26, dia: 15, notch: 19 },
    pcwp: { a: 13, x: 9, v: 14, y: 9, base: 12 },
    lv: { sys: 88, min: 3, edp: 12, preA: 9 },
    ao: { sys: 86, dia: 56, notch: 70 },
    sats: { SVC: 0.55, IVC: 0.59, RA: 0.56, RV: 0.56, PA: 0.56, Ao: 0.97 },
    resp: "kussmaul",
    events: ["cardiogenic-shock"],
    diagnosis: "RV-predominant cardiogenic shock (RV infarction)",
    distractors: ["LV-predominant cardiogenic shock", "Constrictive pericarditis", "Cardiac tamponade"],
    keyFindings: ["RA pressure high relative to PAWP (RA/PAWP > 0.8)", "low PA pulse pressure, PAPi < 0.9", "low output with clear lungs"],
    explanation:
      "The failing RV cannot push blood through the lungs, so the left heart is underfilled. A low PAPi and high RA/PAWP ratio identify RV failure; LV-only support can make it worse.",
  },
  {
    id: "acute-mr",
    title: "Flash pulmonary oedema after an inferolateral infarct",
    category: "valve",
    brief: "67-year-old man, inferolateral infarct 3 days ago, sudden pulmonary oedema and hypotension, soft murmur.",
    hr: 110,
    heightCm: 172,
    weightKg: 80,
    hb: 13,
    ra: { a: 12, x: 8, v: 12, y: 8, base: 10 },
    rv: { sys: 52, min: 3, edp: 12, preA: 10 },
    pa: { sys: 52, dia: 26, notch: 34 },
    pcwp: { a: 22, x: 17, v: 52, y: 16, base: 21 },
    lv: { sys: 96, min: 4, edp: 20, preA: 14 },
    ao: { sys: 94, dia: 58, notch: 74 },
    sats: { SVC: 0.5, IVC: 0.54, RA: 0.51, RV: 0.51, PA: 0.51, Ao: 0.93 },
    resp: "normal",
    events: ["cardiogenic-shock"],
    diagnosis: "Acute severe mitral regurgitation (papillary muscle rupture)",
    distractors: ["Post-infarction ventricular septal rupture", "Mitral stenosis", "LV failure without a mechanical complication"],
    keyFindings: ["giant v waves on the wedge trace", "no saturation step-up", "small, non-compliant LA"],
    explanation:
      "Sudden regurgitation into a normal-sized, non-compliant left atrium produces giant v waves and pulmonary oedema. The absence of a step-up excludes a significant septal rupture. A soft murmur does not exclude severe acute MR.",
  },
  {
    id: "acute-ar",
    title: "Tearing chest pain and a diastolic murmur",
    category: "valve",
    brief: "58-year-old man with Marfan features, sudden chest pain, hypotension and a short early diastolic murmur. CT is being arranged.",
    hr: 104,
    heightCm: 186,
    weightKg: 80,
    hb: 13.5,
    ra: { a: 9, x: 5, v: 9, y: 5, base: 7 },
    rv: { sys: 38, min: 3, edp: 9, preA: 7 },
    pa: { sys: 38, dia: 20, notch: 25 },
    pcwp: { a: 20, x: 16, v: 22, y: 16, base: 18 },
    lv: { sys: 128, min: 10, edp: 38, preA: 31 },
    ao: { sys: 130, dia: 40, notch: 66 },
    sats: { SVC: 0.62, IVC: 0.66, RA: 0.63, RV: 0.63, PA: 0.63, Ao: 0.97 },
    resp: "normal",
    events: [],
    diagnosis: "Acute severe aortic regurgitation",
    distractors: ["Severe aortic stenosis", "Constrictive pericarditis", "Restrictive cardiomyopathy"],
    keyFindings: [
      "LV diastolic pressure rising rapidly to approach aortic diastolic pressure",
      "wide aortic pulse pressure with a low diastolic pressure",
      "LVEDP above PAWP (premature mitral closure)",
    ],
    explanation:
      "A non-dilated LV cannot accommodate the sudden regurgitant volume, so its diastolic pressure climbs towards the aortic diastolic pressure. In suspected dissection, crossing the valve or injecting the root is not routine; urgent CT and surgery come first.",
  },
  // -------------------------------------------------------------------------
  // Added by haemo-study-session-and-tips. Teaching cases written for this app: every pressure,
  // saturation and Hb below is a MODEL PARAMETER chosen to sit clearly on one side of the module
  // thresholds the study teaches (pm-support-choice: CPO 0.6 W, PAPi 0.9, wedge 25 mmHg with mixed
  // venous saturation 50%; hb-specific-conditions-pe: PA systolic 60 mmHg). None is a measured
  // patient.
  // -------------------------------------------------------------------------
  {
    id: "pe-high-risk",
    title: "Collapse and breathlessness after a knee replacement",
    category: "pulmonary",
    brief:
      "57-year-old woman, sudden breathlessness and syncope ten days after a knee replacement. Hypotensive, hypoxic, raised JVP. Duplex: thrombus in the right common femoral vein. Right heart study requested while the team discusses treatment.",
    hr: 112,
    heightCm: 165,
    weightKg: 72,
    hb: 13,
    ra: { a: 16, x: 11, v: 15, y: 10, base: 13 },
    rv: { sys: 46, min: 4, edp: 14, preA: 12 },
    pa: { sys: 46, dia: 22, notch: 30 },
    pcwp: { a: 9, x: 6, v: 10, y: 6, base: 7 },
    lv: { sys: 80, min: 2, edp: 7, preA: 5 },
    ao: { sys: 78, dia: 50, notch: 64 },
    sats: { SVC: 0.51, IVC: 0.55, RA: 0.52, RV: 0.52, PA: 0.52, Ao: 0.89 },
    resp: "normal",
    events: ["pulmonary-embolism"],
    diagnosis: "Acute pulmonary embolism with right ventricular failure",
    distractors: ["RV-predominant cardiogenic shock (RV infarction)", "Cardiac tamponade", "Pre-capillary pulmonary hypertension (chronic)"],
    keyFindings: [
      "raised RA and RV end-diastolic pressures with a normal wedge",
      "low cardiac output with systemic hypotension and arterial desaturation",
      "PA systolic below 60 mmHg: Oxford's contraindication to pulmonary angiography does not apply",
      "a femoral vein thrombus on duplex: choose the venous route with the clot in mind",
    ],
    explanation:
      "Obstruction of the pulmonary bed loads the right ventricle: RA and RV filling pressures rise while the wedge stays normal and the output falls. CT pulmonary angiography is the diagnostic test of choice (2019 ESC guideline); the catheter study has a place when clot removal is considered. Oxford warns that femoral venous access can dislodge iliofemoral clot and treats a PA systolic pressure above 60 mmHg as a contraindication to pulmonary angiography unless the operator is very experienced.",
  },
  {
    id: "shock-lv",
    title: "Anterior STEMI in shock: before and after PCI",
    category: "shock",
    brief:
      "62-year-old man, anterior STEMI 3 hours ago, cool peripheries, rising lactate, on noradrenaline. A venous sheath goes in with the arterial one: right heart study before the coronary angiogram, then again after PCI.",
    hr: 110,
    heightCm: 176,
    weightKg: 84,
    hb: 13.5,
    ra: { a: 12, x: 8, v: 12, y: 8, base: 10 },
    rv: { sys: 42, min: 3, edp: 12, preA: 10 },
    pa: { sys: 42, dia: 26, notch: 31 },
    pcwp: { a: 27, x: 22, v: 31, y: 22, base: 26 },
    lv: { sys: 78, min: 6, edp: 29, preA: 21 },
    ao: { sys: 76, dia: 48, notch: 62 },
    sats: { SVC: 0.47, IVC: 0.51, RA: 0.48, RV: 0.48, PA: 0.48, Ao: 0.95 },
    resp: "normal",
    events: ["cardiogenic-shock"],
    sets: {
      pre: { title: "Before PCI", note: "On arrival in the lab, before the coronary angiogram." },
      post: {
        title: "After PCI",
        note: "The culprit artery has been treated and left-sided mechanical support started. Repeat the right heart numbers and decide on the next step.",
        hr: 96,
        ra: { a: 10, x: 6, v: 10, y: 6, base: 8 },
        rv: { sys: 36, min: 2, edp: 9, preA: 7 },
        pa: { sys: 36, dia: 20, notch: 25 },
        pcwp: { a: 19, x: 14, v: 21, y: 14, base: 17 },
        lv: { sys: 100, min: 4, edp: 19, preA: 14 },
        ao: { sys: 98, dia: 62, notch: 78 },
        sats: { SVC: 0.63, IVC: 0.67, RA: 0.64, RV: 0.64, PA: 0.64, Ao: 0.97 },
      },
    },
    diagnosis: "LV-predominant cardiogenic shock",
    distractors: ["RV-predominant cardiogenic shock", "Biventricular cardiogenic shock", "Distributive (vasodilatory) shock"],
    keyFindings: [
      "CPO below 0.6 W before PCI",
      "high wedge with a relatively low RA pressure",
      "PAPi above 0.9: the RV is coping",
      "after PCI: CPO above 0.6 W and PAPi above 0.9, the wean row of the decision table",
    ],
    explanation:
      "Low output and a high wedge with preserved RV indices point to left ventricular failure. Brilakis profiles shock with CPO (MAP × CO ÷ 451) and PAPi ((PA systolic − PA diastolic) ÷ RA) and recalculates both after PCI: with CPO above 0.6 W and PAPi above 0.9 the protocol he reproduces weans vasopressors and inotropes.",
  },
  {
    id: "shock-rv",
    title: "Inferior STEMI in shock: before and after PCI",
    category: "shock",
    brief:
      "69-year-old woman, inferior STEMI with ST elevation in V4R, hypotensive, raised JVP, clear lung fields. Right heart study before the angiogram and again after PCI.",
    hr: 62,
    heightCm: 164,
    weightKg: 70,
    hb: 13,
    ra: { a: 18, x: 13, v: 17, y: 11, base: 16 },
    rv: { sys: 28, min: 7, edp: 17, preA: 15 },
    pa: { sys: 27, dia: 18, notch: 21 },
    pcwp: { a: 12, x: 8, v: 13, y: 8, base: 10 },
    lv: { sys: 80, min: 3, edp: 11, preA: 8 },
    ao: { sys: 78, dia: 50, notch: 64 },
    sats: { SVC: 0.5, IVC: 0.54, RA: 0.51, RV: 0.51, PA: 0.51, Ao: 0.96 },
    resp: "kussmaul",
    events: ["cardiogenic-shock"],
    sets: {
      pre: { title: "Before PCI", note: "On arrival in the lab, before the coronary angiogram." },
      post: {
        title: "After PCI",
        note: "The right coronary artery has been opened and the rhythm is stable. Repeat the right heart numbers and decide on the next step.",
        hr: 78,
        ra: { a: 15, x: 11, v: 14, y: 10, base: 13 },
        rv: { sys: 29, min: 5, edp: 14, preA: 12 },
        pa: { sys: 28, dia: 19, notch: 22 },
        pcwp: { a: 13, x: 9, v: 14, y: 9, base: 11 },
        lv: { sys: 106, min: 3, edp: 12, preA: 9 },
        ao: { sys: 104, dia: 66, notch: 84 },
        sats: { SVC: 0.63, IVC: 0.67, RA: 0.64, RV: 0.64, PA: 0.64, Ao: 0.97 },
      },
    },
    diagnosis: "RV-predominant cardiogenic shock",
    distractors: ["LV-predominant cardiogenic shock", "Biventricular cardiogenic shock", "Cardiac tamponade"],
    keyFindings: [
      "RA pressure above 12 mmHg and PAPi below 0.9",
      "low wedge despite low output: the RV is not delivering blood to the left side",
      "after PCI: CPO above 0.6 W but PAPi still below 0.9, consider right-sided support if RV dysfunction is suspected",
    ],
    explanation:
      "A failing RV cannot push blood across the lungs, so the left heart is underfilled and the wedge is low. Brilakis judges RV failure invasively by an RA pressure above 12 mmHg or a PAPi below 0.9. After PCI, a CPO above 0.6 W with a PAPi below 0.9 is the row of the decision table that considers right-sided support when RV dysfunction is suspected clinically.",
  },
  {
    id: "shock-biv",
    title: "Extensive anterior STEMI in profound shock: before and after PCI",
    category: "shock",
    brief:
      "66-year-old man, extensive anterior STEMI, confused and mottled, on noradrenaline and an inotrope. Right heart study before the angiogram and again after PCI.",
    hr: 118,
    heightCm: 178,
    weightKg: 86,
    hb: 13,
    ra: { a: 18, x: 13, v: 18, y: 12, base: 16 },
    rv: { sys: 40, min: 6, edp: 17, preA: 15 },
    pa: { sys: 40, dia: 30, notch: 34 },
    pcwp: { a: 28, x: 23, v: 32, y: 23, base: 27 },
    lv: { sys: 72, min: 8, edp: 29, preA: 22 },
    ao: { sys: 70, dia: 46, notch: 58 },
    sats: { SVC: 0.44, IVC: 0.48, RA: 0.45, RV: 0.45, PA: 0.45, Ao: 0.93 },
    resp: "normal",
    events: ["cardiogenic-shock"],
    sets: {
      pre: { title: "Before PCI", note: "On arrival in the lab, before the coronary angiogram." },
      post: {
        title: "After PCI",
        note: "The culprit artery has been treated and left-sided mechanical support started. Repeat the right heart numbers and decide on the next step.",
        hr: 112,
        ra: { a: 19, x: 14, v: 19, y: 13, base: 17 },
        rv: { sys: 38, min: 6, edp: 18, preA: 16 },
        pa: { sys: 38, dia: 29, notch: 33 },
        pcwp: { a: 23, x: 19, v: 26, y: 19, base: 22 },
        lv: { sys: 80, min: 8, edp: 24, preA: 18 },
        ao: { sys: 78, dia: 50, notch: 64 },
        sats: { SVC: 0.51, IVC: 0.55, RA: 0.52, RV: 0.52, PA: 0.52, Ao: 0.95 },
      },
    },
    diagnosis: "Biventricular cardiogenic shock",
    distractors: ["LV-predominant cardiogenic shock", "RV-predominant cardiogenic shock", "Distributive (vasodilatory) shock"],
    keyFindings: [
      "high wedge and high RA pressure together",
      "CPO below 0.6 W and PAPi below 0.9",
      "after PCI: CPO still below 0.6 W with PAPi below 0.9, consider right-sided support alongside the left-sided device",
    ],
    explanation:
      "Both ventricles are failing: the wedge is high and so is the RA pressure, with a low PAPi. After PCI the protocol Brilakis reproduces reads a CPO below 0.6 W with a PAPi below 0.9 as a reason to consider right-sided support; with both ventricles failing his algorithm points to VA-ECMO or a left- and right-sided device together.",
  },
  {
    id: "chip-elective",
    title: "Planned complex PCI with a poor ventricle",
    category: "myocardial",
    brief:
      "71-year-old man, ejection fraction 25%, multivessel disease, planned complex PCI of his last remaining vessel. Comfortable on the ward with a normal blood pressure. Right heart study to help decide on support.",
    hr: 84,
    heightCm: 172,
    weightKg: 78,
    hb: 12.5,
    ra: { a: 10, x: 6, v: 10, y: 6, base: 8 },
    rv: { sys: 52, min: 3, edp: 10, preA: 8 },
    pa: { sys: 52, dia: 30, notch: 36 },
    pcwp: { a: 28, x: 24, v: 33, y: 24, base: 27 },
    lv: { sys: 118, min: 6, edp: 28, preA: 20 },
    ao: { sys: 116, dia: 68, notch: 90 },
    sats: { SVC: 0.45, IVC: 0.49, RA: 0.46, RV: 0.46, PA: 0.46, Ao: 0.95 },
    resp: "normal",
    events: [],
    diagnosis: "Abnormal but stable: high risk of pulmonary oedema and shock around the procedure",
    distractors: ["Normal resting haemodynamics", "LV-predominant cardiogenic shock", "Isolated RV failure"],
    keyFindings: [
      "wedge above 25 mmHg with a mixed venous saturation below 50%",
      "normal blood pressure: abnormal but stable, not shock",
      "PAPi above 0.9: the RV is not the problem",
    ],
    explanation:
      "Brilakis reads a wedge above 18 mmHg as LV failure and a wedge above 25 mmHg with a mixed venous saturation below 50% as a high risk of pulmonary oedema and shock around the procedure. A normal blood pressure does not make the haemodynamics normal: this patient is abnormal but stable.",
  },
  // -------------------------------------------------------------------------
  // Added by haemo-aortic-stenosis-studies (lesson hb-specific-conditions-as; Academy lesson
  // hd-valves-as-area). Teaching cases written for this app: every pressure, saturation, stroke
  // volume, orifice, report value and calcium score is a MODEL PARAMETER chosen to sit clearly on one
  // side of the thresholds the lessons teach (severe: valve area 1.0 cm² or less with a mean gradient
  // of 40 mmHg or more; low flow: stroke volume index 35 mL/m² or less; flow reserve: a stroke volume
  // rise of 20% or more; CT calcium: 2000 AU in men and 1200 AU in women for severe, 3000 and 1600
  // very specific, below 1600 and 800 unlikely). None is a measured patient.
  // -------------------------------------------------------------------------
  {
    id: "as-concordant-echo",
    title: "Breathless on exertion, referred for angiography before valve surgery",
    category: "valve",
    brief:
      "74-year-old man with exertional breathlessness, referred for coronary angiography before aortic valve surgery. Read the echo report before you plan the left heart part of the study.",
    hr: 68,
    heightCm: 175,
    weightKg: 78,
    hb: 13.5,
    sep: 0.33,
    ra: { a: 7, x: 3, v: 6, y: 3, base: 4 },
    rv: { sys: 34, min: 2, edp: 7, preA: 5 },
    pa: { sys: 34, dia: 15, notch: 21 },
    pcwp: { a: 20, x: 12, v: 16, y: 11, base: 13 },
    lv: { sys: 206, min: 4, edp: 19, preA: 11, peakAt: 0.5 },
    ao: { sys: 120, dia: 68, notch: 100, shape: "parvus" },
    sats: { SVC: 0.68, IVC: 0.72, RA: 0.69, RV: 0.69, PA: 0.69, Ao: 0.96 },
    resp: "normal",
    pvcResponse: "fixed",
    events: ["aortic-stenosis"],
    avStudy: {
      report: [
        "Transthoracic echo: good image quality.",
        "Calcified trileaflet aortic valve with restricted opening. Valve area 0.8 cm², mean gradient 48 mmHg.",
        "LV ejection fraction 60%. No other significant valve disease.",
        "Referral: exertional breathlessness; symptoms fit the echo findings. Coronary angiography requested before surgery.",
      ],
      crossingIndicated: false,
      why: "Good-quality echo and the symptoms agree, so an invasive gradient would add the embolic risk of valve passage without changing management: coronary angiography only (Oxford ch 5; 2025 ESC/EACTS; Omran 2003).",
    },
    diagnosis: "Severe aortic stenosis (echo concordant with the symptoms)",
    distractors: ["Moderate aortic stenosis", "Hypertrophic obstructive cardiomyopathy", "Pseudo-severe aortic stenosis"],
    keyFindings: [
      "good-quality echo: valve area below 1.0 cm² with a mean gradient above 40 mmHg",
      "symptoms that fit the echo",
      "the question for the lab is the coronary arteries, not the valve",
    ],
    explanation:
      "Echo has already graded the stenosis and the symptoms fit, so the invasive gradient would not change management. Crossing a stenotic valve was followed by new embolic brain lesions in 22% of patients in a randomised MRI study (3% with a clinical deficit), so the valve is left alone and the study is the coronary angiogram.",
  },
  {
    id: "as-discordant-cross",
    title: "Exertional presyncope, echo windows poor",
    category: "valve",
    brief:
      "79-year-old woman with exertional presyncope. The heart team wants the haemodynamics before deciding on valve intervention. Read the echo report before you plan the left heart part of the study.",
    hr: 74,
    heightCm: 158,
    weightKg: 62,
    hb: 12,
    sep: 0.32,
    ra: { a: 8, x: 4, v: 7, y: 4, base: 5 },
    rv: { sys: 38, min: 2, edp: 8, preA: 5 },
    pa: { sys: 38, dia: 17, notch: 23 },
    pcwp: { a: 22, x: 13, v: 18, y: 12, base: 14 },
    lv: { sys: 218, min: 4, edp: 21, preA: 12, peakAt: 0.5 },
    ao: { sys: 124, dia: 64, notch: 98, shape: "parvus" },
    sats: { SVC: 0.66, IVC: 0.7, RA: 0.67, RV: 0.67, PA: 0.67, Ao: 0.96 },
    resp: "normal",
    pvcResponse: "fixed",
    events: ["aortic-stenosis"],
    avStudy: {
      report: [
        "Transthoracic echo: poor windows. Heavily calcified aortic valve with restricted opening.",
        "Doppler mean gradient 28 mmHg; the jet could not be aligned with confidence. Valve area not measurable.",
        "LV ejection fraction 60%.",
        "Transoesophageal echo: planimetry not possible because of calcific shadowing.",
        "Referral: symptoms out of proportion to the Doppler gradient.",
      ],
      ctCalcium: { agatston: 1000, sex: "female" },
      crossingIndicated: true,
      why: "The non-invasive data are inconclusive (poor windows, a gradient that does not fit the valve or the symptoms, TOE planimetry not possible, a calcium score between the thresholds for a woman), so the invasive gradient will change management: cross, with Oxford's technique (Oxford ch 5; 2025 ESC/EACTS).",
    },
    diagnosis: "Severe aortic stenosis",
    distractors: ["Moderate aortic stenosis", "Hypertrophic obstructive cardiomyopathy", "Normal valve with LV hypertension"],
    keyFindings: [
      "inconclusive non-invasive data: crossing is justified",
      "simultaneous LV and aortic mean gradient above 40 mmHg",
      "Gorlin area below 1.0 cm² at a normal output",
      "the pullback peak-to-peak difference is a different number from the simultaneous mean gradient",
    ],
    explanation:
      "Poor windows let the Doppler underestimate the gradient. With the non-invasive data inconclusive, crossing with a 5 F AL1 and a straight hydrophilic wire under control, exchanging for a pigtail and recording LV and aortic pressures simultaneously gives the true mean gradient, which is severe.",
  },
  stagedScenario({
    id: "lflg-true",
    title: "Breathless with a weak ventricle and a calcified aortic valve",
    category: "valve",
    brief:
      "76-year-old man, ischaemic cardiomyopathy, NYHA III breathlessness. Echo: LV ejection fraction 30%, calcified aortic valve, valve area 0.8 cm², mean gradient 24 mmHg, stroke volume index 27 mL/m². Dobutamine stress echo was non-diagnostic (poor windows). Invasive dobutamine study requested.",
    hr: 70,
    heightCm: 172,
    weightKg: 80,
    hb: 13,
    sep: 0.3,
    ra: { a: 9, x: 5, v: 9, y: 5, base: 7 },
    rv: { sys: 44, min: 3, edp: 9, preA: 7 },
    pa: { sys: 44, dia: 20, notch: 27 },
    pcwp: { a: 24, x: 18, v: 26, y: 17, base: 20 },
    lv: { sys: 130, min: 5, edp: 24, preA: 14, peakAt: 0.5 },
    ao: { sys: 102, dia: 62, notch: 87, shape: "parvus" },
    sats: { SVC: 0.56, IVC: 0.6, RA: 0.57, RV: 0.57, PA: 0.57, Ao: 0.95 },
    resp: "normal",
    pvcResponse: "fixed",
    events: ["aortic-stenosis", "low-flow-aortic-stenosis"],
    avStudy: {
      report: [
        "Transthoracic echo: LV ejection fraction 30%. Calcified aortic valve, valve area 0.8 cm², mean gradient 24 mmHg.",
        "Stroke volume index 27 mL/m².",
        "Dobutamine stress echo: non-diagnostic (poor windows).",
        "Referral: invasive dobutamine study with simultaneous LV and aortic pressures and a right heart catheter for output.",
      ],
      ctCalcium: { agatston: 2600, sex: "male" },
      crossingIndicated: true,
      why: "Classical low-flow low-gradient stenosis with a non-diagnostic stress echo: the invasive dobutamine study is the alternative the Academy lesson on aortic valve area, low-flow low-gradient stenosis and dobutamine gives, so the valve is crossed.",
    },
    modifiers: dobutamineStages([
      [0, 70, 0.3, 52, 0.76, 102, 62],
      [5, 72, 0.3, 55, 0.77, 106, 63],
      [10, 75, 0.29, 58, 0.77, 110, 64],
      [15, 80, 0.28, 64, 0.78, 116, 65],
      [20, 82, 0.28, 66, 0.79, 118, 66],
    ]),
    diagnosis: "True severe low-flow low-gradient aortic stenosis",
    distractors: ["Pseudo-severe aortic stenosis", "Low-flow low-gradient stenosis without flow reserve (indeterminate)", "Moderate aortic stenosis with normal flow"],
    keyFindings: [
      "baseline: valve area 1.0 cm² or less with a mean gradient below 40 mmHg and a low stroke volume",
      "stroke volume rises by 20% or more (flow reserve)",
      "mean gradient reaches 40 mmHg or more while the valve area stays at or below 1.0 cm²",
    ],
    explanation:
      "With more flow the gradient rises and the calculated area hardly moves: the valve is fixed and severely narrowed. The low resting gradient reflected the weak ventricle, not a mild valve.",
  }),
  stagedScenario({
    id: "lflg-pseudo",
    title: "Heart failure clinic referral with a narrowed aortic valve on echo",
    category: "valve",
    brief:
      "71-year-old man, dilated cardiomyopathy, NYHA III breathlessness. Echo: LV ejection fraction 30%, aortic valve area 0.8 cm², mean gradient 22 mmHg, stroke volume index 26 mL/m². Dobutamine stress echo was non-diagnostic (poor windows). Invasive dobutamine study requested.",
    hr: 70,
    heightCm: 174,
    weightKg: 82,
    hb: 13.5,
    sep: 0.3,
    ra: { a: 9, x: 5, v: 9, y: 5, base: 7 },
    rv: { sys: 42, min: 3, edp: 9, preA: 7 },
    pa: { sys: 42, dia: 19, notch: 26 },
    pcwp: { a: 23, x: 17, v: 25, y: 16, base: 19 },
    lv: { sys: 125, min: 5, edp: 23, preA: 14, peakAt: 0.5 },
    ao: { sys: 104, dia: 62, notch: 88, shape: "parvus" },
    sats: { SVC: 0.56, IVC: 0.6, RA: 0.57, RV: 0.57, PA: 0.57, Ao: 0.95 },
    resp: "normal",
    pvcResponse: "fixed",
    events: ["aortic-stenosis", "low-flow-aortic-stenosis"],
    avStudy: {
      report: [
        "Transthoracic echo: LV ejection fraction 30%. Thickened aortic valve, valve area 0.8 cm², mean gradient 22 mmHg.",
        "Stroke volume index 26 mL/m².",
        "Dobutamine stress echo: non-diagnostic (poor windows).",
        "Referral: invasive dobutamine study with simultaneous LV and aortic pressures and a right heart catheter for output.",
      ],
      ctCalcium: { agatston: 1100, sex: "male" },
      crossingIndicated: true,
      why: "Classical low-flow low-gradient stenosis with a non-diagnostic stress echo: the invasive dobutamine study is the alternative the Academy lesson on aortic valve area, low-flow low-gradient stenosis and dobutamine gives, so the valve is crossed.",
    },
    modifiers: dobutamineStages([
      [0, 70, 0.3, 52, 0.84, 104, 62],
      [5, 73, 0.3, 57, 0.92, 108, 63],
      [10, 76, 0.29, 62, 1.0, 112, 64],
      [15, 79, 0.29, 66, 1.08, 116, 65],
      [20, 83, 0.28, 70, 1.18, 120, 66],
    ]),
    diagnosis: "Pseudo-severe aortic stenosis",
    distractors: ["True severe low-flow low-gradient aortic stenosis", "Low-flow low-gradient stenosis without flow reserve (indeterminate)", "Severe high-gradient aortic stenosis"],
    keyFindings: [
      "baseline: valve area 1.0 cm² or less with a mean gradient below 40 mmHg and a low stroke volume",
      "stroke volume rises by 20% or more (flow reserve)",
      "the calculated area rises above 1.0 cm² while the gradient stays below 40 mmHg",
    ],
    explanation:
      "With more flow the valve opens further: the calculated area rises above 1.0 cm² and the gradient stays low. The small resting area was the Gorlin formula's underestimate at low flow from a ventricle too weak to open a moderately diseased valve.",
  }),
  stagedScenario({
    id: "lflg-no-reserve",
    title: "Breathless and hypotensive with a poor ventricle and a calcified valve",
    category: "valve",
    brief:
      "79-year-old man, previous anterior infarct, NYHA III breathlessness, blood pressure on the low side. Echo: LV ejection fraction 25%, calcified aortic valve, valve area 0.8 cm², mean gradient 22 mmHg, stroke volume index 27 mL/m². Dobutamine stress echo was non-diagnostic (poor windows). Invasive dobutamine study requested.",
    hr: 72,
    heightCm: 170,
    weightKg: 76,
    hb: 12.5,
    sep: 0.3,
    ra: { a: 10, x: 6, v: 10, y: 6, base: 8 },
    rv: { sys: 46, min: 3, edp: 10, preA: 8 },
    pa: { sys: 46, dia: 21, notch: 28 },
    pcwp: { a: 25, x: 19, v: 27, y: 18, base: 21 },
    lv: { sys: 120, min: 5, edp: 25, preA: 15, peakAt: 0.5 },
    ao: { sys: 98, dia: 60, notch: 84, shape: "parvus" },
    sats: { SVC: 0.55, IVC: 0.59, RA: 0.56, RV: 0.56, PA: 0.56, Ao: 0.95 },
    resp: "normal",
    pvcResponse: "fixed",
    events: ["aortic-stenosis", "low-flow-aortic-stenosis"],
    avStudy: {
      report: [
        "Transthoracic echo: LV ejection fraction 25%. Calcified aortic valve, valve area 0.8 cm², mean gradient 22 mmHg.",
        "Stroke volume index 27 mL/m².",
        "Dobutamine stress echo: non-diagnostic (poor windows).",
        "Referral: invasive dobutamine study with simultaneous LV and aortic pressures and a right heart catheter for output.",
      ],
      ctCalcium: { agatston: 3200, sex: "male" },
      crossingIndicated: true,
      why: "Classical low-flow low-gradient stenosis with a non-diagnostic stress echo: the invasive dobutamine study is the alternative the Academy lesson on aortic valve area, low-flow low-gradient stenosis and dobutamine gives, so the valve is crossed.",
    },
    modifiers: dobutamineStages([
      [0, 72, 0.3, 50, 0.8, 98, 60],
      [5, 76, 0.29, 51, 0.8, 96, 59],
      [10, 80, 0.29, 52, 0.81, 94, 58],
      [15, 86, 0.28, 53, 0.81, 82, 48],
      [20, 92, 0.27, 54, 0.82, 78, 46],
    ]),
    diagnosis: "Low-flow low-gradient stenosis without flow reserve (indeterminate)",
    distractors: ["True severe low-flow low-gradient aortic stenosis", "Pseudo-severe aortic stenosis", "Moderate aortic stenosis with normal flow"],
    keyFindings: [
      "stroke volume rises by less than 20%: no flow reserve",
      "the gradient and the area hardly move, so the dobutamine study cannot separate true from pseudo-severe stenosis",
      "hypotension at 15 micrograms/kg/min is a reason to stop the infusion there",
      "a CT calcium score above 3000 AU in a man is very specific for severe stenosis",
    ],
    explanation:
      "Without flow reserve the infusion cannot raise flow enough to test the valve: the result is indeterminate and the CT calcium score decides. Prognosis is worse, but intervention may still help when the stenosis is severe, as a score of 3200 AU in a man indicates.",
  }),
];

export const SCENARIO_BY_ID: Record<string, HaemoScenario> = Object.fromEntries(HAEMO_SCENARIOS.map((s) => [s.id, s]));
