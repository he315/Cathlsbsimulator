// ---------------------------------------------------------------------------
// Pressure wire on the patient's own anatomy.
//
// The physiology case is built from the rendered tree and the lesions as they
// are now (S9 coronaryFlowFor + coronaryCaseFor), so the pressure gradient,
// FFR and the resting ratios come from the same flow model the contrast
// transport uses (S5/I1 build their flow from coronaryFlowFor too): FFR and
// the angiographic transit are two read-outs of one flow().
//
// Sourced: the sensor sits 3 cm from the tip at the junction of the
// radiopaque and non-radiopaque segments, and is equalised with the sensor
// just beyond the guide tip (FDA/ClinicalTrials protocol text, facts C3);
// cut-offs FFR ≤ 0.80, non-hyperaemic ratios ≤ 0.89, drift check Pd/Pa
// 0.98-1.02 at the guide tip (SIM_FACTS §14; physiology.ts CUTOFF).
// MODEL PARAMETERS: drift rate spread, equalisation window, the fallback IC
// adenosine curve for headless use (the lab uses the S9 engine's).
//
// The PCI lab's set-up (pci-pressure-wire-console): PressureWireState.setup
// holds what the in-lab console checks before it equalises, after the
// pressure-wire session of the physiology lab (pwSession.ts, lesson
// pm-physiology-setup): the introducer in the valve, saline in the guide
// (contrast damps the aortic pressure), air in the aortic line, the aortic
// transducer zeroed and levelled, and its connection tight (Brilakis 12.2:
// air in the aortic line stops equalisation; a loose or malfunctioning
// transducer drifts; module text pm-monitoring-transducers,
// 02-monitoring.ts:541). The hyperaemia given in the lab (IC bolus or IV
// infusion) is kept here too. The rules that use them are in
// actions/pressure.ts; this file keeps the state and the clock (drift).
// ---------------------------------------------------------------------------

import type { CoronaryTree, TreeVessel } from "../../render/xray/coronaryTree";
import type { Lesion, VesselId } from "../../types";
import { coronaryCaseFor, coronaryFlowFor } from "../patient/coronaryFlow";
import { CUTOFF, HR, WFP, flow, reading, type CoronaryCase } from "../physiology";
import { normal, type RngState } from "./rng";

export interface PullbackSample {
  /** sensor position (route mm) */
  mm: number;
  /** Pd/Pa (hyperaemic) or the wave-free ratio (rest) */
  ratio: number;
  hyperaemic: boolean;
  t: number;
}

export interface PwMeasurement {
  kind: "rest" | "hyperaemia" | "drift-check";
  t: number;
  mm: number;
  pdpa: number;
  wfp: number;
  /** the case's state when measured (pre or post stent) */
  label: string;
  /** a drift check's verdict: Pd/Pa at the guide tip within 0.98-1.02 (driftCheck) */
  ok?: boolean;
}

export interface PressureWireState {
  equalised: boolean;
  /** added to Pd (mmHg): equalisation error and drift */
  offset: number;
  driftPerS: number;
  sinceEqualiseS: number;
  /** where it was equalised (route mm of the sensor) */
  equalisedAt: number | null;
  /**
   * the pullback: its samples, the stored run it is recorded against (its run number) and the wire's route
   * when the recording started (co-registration draws the samples on that route, not on a later one)
   */
  pullback: { recording: boolean; samples: PullbackSample[]; frameId: number | null; route?: string[] };
  measurements: PwMeasurement[];
  /** the PCI lab's set-up and hyperaemia (pci-pressure-wire-console); absent: none armed yet (actions/pressure.ts setupOf) */
  setup?: PwLabSetup;
}

/**
 * Set-up faults a PCI lab case can open with (the launch's 'pwFault' param): air in the aortic line, an
 * aortic transducer that was not zeroed and levelled, a loose transducer that drifts.
 */
export type PwLabFault = "line-air" | "transducer-unzeroed" | "transducer-loose";
export const PW_LAB_FAULTS: readonly PwLabFault[] = ["line-air", "transducer-unzeroed", "transducer-loose"];

/** Hyperaemia given in the PCI lab: an intracoronary bolus (the operator's, or the team's syringe) or an IV infusion. */
export type PwLabHyperaemia =
  | { mode: "none" }
  | {
      mode: "ic";
      t0: number;
      doseUg: number;
      side: "left" | "right";
      vessel: string;
      engaged: boolean;
      fast: boolean;
      /** what reached the artery and when: the bolus, then the flush behind it (µg) */
      parts: { t: number; ug: number }[];
      flushedAt: number | null;
    }
  | { mode: "iv"; t0: number; rateUgKgMin: number; site: "hand" | "peripheral" | "central"; h0: number };

/** What the PCI lab's console checks before equalising, and what it has given for hyperaemia. */
export interface PwLabSetup {
  /** the faults still present (each is removed by its remedy) */
  faults: PwLabFault[];
  /** the introducer is still in the haemostatic valve (it goes in with the wire) */
  introducer: boolean;
  /** air in the aortic line, mL (pwSession MP_AIR_ML for the 'line-air' fault) */
  airMl: number;
  /** the aortic transducer is zeroed to atmosphere and levelled */
  transducerZeroed: boolean;
  /**
   * the aortic transducer's own offset on the patient's arterial line, mmHg, when the lab has one (the patient
   * engine's Transducer: its zero and its level, mirrored by actions/pressure.ts pwWithAorticLine); it replaces
   * MP_UNZEROED_TRANSDUCER_MMHG, so the console's Pa carries the error the monitor's arterial pressure carries
   */
  paLineOffsetMmHg?: number;
  /** the aortic transducer's connection is loose: the aortic channel drifts */
  transducerLoose: boolean;
  /** what the loose transducer has added to the aortic channel since it was last zeroed, mmHg */
  paDriftMmHg: number;
  /** procedure time the guide was last flushed with saline (null: not since the wire went in) */
  flushedAt: number | null;
  hyper: PwLabHyperaemia;
  /**
   * the last equalisation attempt, and why it did not take when it did not (reason: debrief and guided aids;
   * text: what the console says, in every mode; refused: it was refused rather than failed)
   */
  eq: { t: number; sensorMm: number; ok: boolean; atTip: boolean; reason?: string; text?: string; refused?: boolean } | null;
}

/**
 * A loose aortic transducer drifts the aortic channel by this much per second, mmHg/s — MODEL PARAMETER
 * (3 mmHg a minute: enough to take Pd/Pa at the guide tip outside 0.98-1.02 within a two-minute study; the
 * module names the cause, not a rate: 02-monitoring.ts:541, Brilakis 12.2).
 */
export const MP_LOOSE_TRANSDUCER_DRIFT_MMHG_S = 0.05;
/**
 * An aortic transducer that was not zeroed and levelled reads this far off, mmHg — MODEL PARAMETER (the size of
 * the error; the module says only that the line must be zeroed: 02-monitoring.ts:541).
 */
export const MP_UNZEROED_TRANSDUCER_MMHG = 15;
/**
 * A jailed side-branch ostium that looks pinched after main-vessel stenting narrows the branch physiologically
 * by this fraction of how narrow it looks — MODEL PARAMETER, resting on the module text "the eye overestimates
 * a jailed ostium" (tip pci-phys-jailed-side-branch, Brilakis 12.1, 16.2, 17.12).
 */
export const MP_JAILED_FUNCTIONAL_SHARE = 0.5;

/** Drift rate spread (mmHg/s) — MODEL PARAMETER (about 1 mmHg a minute). */
export const MP_DRIFT_SD = 0.015;
/** Offset left on a wire just zeroed outside the body, SD in mmHg (removed by equalisation) — MODEL PARAMETER. */
export const MP_ZERO_OFFSET_SD_MMHG = 3;
/** Equalise with the sensor this far beyond the guide tip at most (mm): "1 or 2 mm distal" (facts) plus a tolerance — MODEL PARAMETER. */
export const EQUALISE_MAX_MM = 5;
/** ... and at most this far inside the guide (mm) — MODEL PARAMETER (the tolerance equalise() has always used). */
export const EQUALISE_MIN_MM = -1;
/**
 * Sensor distance from the wire tip (mm): "about 3 cm from the tip, where the radiopaque tip meets
 * the radiolucent shaft" (Oxford ch 8 and Brilakis 12.2, lesson pm-physiology-setup; facts C3).
 */
export const SENSOR_FROM_TIP_MM = 30;

/** Is a sensor position (mm beyond the guide tip, negative inside the guide) a valid place to equalise? */
export function equaliseValidAt(sensorMm: number): boolean {
  return sensorMm >= EQUALISE_MIN_MM && sensorMm <= EQUALISE_MAX_MM;
}

export function initialPressureWire(rng: RngState): PressureWireState {
  return {
    equalised: false,
    offset: normal(rng, 0, MP_ZERO_OFFSET_SD_MMHG),
    driftPerS: normal(rng, 0, MP_DRIFT_SD),
    sinceEqualiseS: 0,
    equalisedAt: null,
    pullback: { recording: false, samples: [], frameId: null },
    measurements: [],
  };
}

/** The physiology case for a named vessel, from the tree and the lesions as they are now. */
export function physiologyCase(tree: CoronaryTree, lesions: Lesion[], vessel: VesselId, opts: { guideDeep?: boolean; map?: number } = {}): { c: CoronaryCase; v: TreeVessel } | null {
  const fm = coronaryFlowFor(tree, lesions, opts.map ? { map: opts.map } : {});
  const c = coronaryCaseFor(tree, fm, vessel, lesions, opts.map ? { map: opts.map } : {});
  if (!c) return null;
  const v = tree.vessels.find((x) => x.name === c.vessel)!;
  return { c: { ...c, guideObstructs: !!opts.guideDeep }, v };
}

/** Sensor position along the case's vessel (0..1), 0 when still proximal to it. */
export function sensorX(v: TreeVessel, sensorMm: number): number {
  const a = v.pathMm[0],
    b = v.pathMm[v.pathMm.length - 1];
  return Math.max(0, Math.min(1, (sensorMm - a) / Math.max(1, b - a)));
}

export interface PwReading {
  pa: number;
  pd: number;
  pdpa: number;
  wfp: number;
  q: number;
}

/** Set-up errors on the two channels of a reading (pwSession's set-up faults); every field defaults to none. */
export interface ChannelErrors {
  /** added to the aortic (guide) pressure, mmHg: a leak at the haemostatic valve reads low */
  paOffset?: number;
  /** the Pd waveform lags the Pa waveform by this fraction of the cycle (a faulty wire) */
  pdLagPhase?: number;
  /** samples per cycle (default 120) */
  n?: number;
}

/** Cycle-averaged reading at sensor position x, hyperaemia h, with the wire's offset (and, optionally, set-up errors). */
export function measure(c: CoronaryCase, x: number, h: number, offset: number, guideEngaged = true, err: ChannelErrors = {}): PwReading {
  const N = err.n ?? 120;
  const T = 60 / HR;
  const paOff = err.paOffset ?? 0;
  const lag = err.pdLagPhase ?? 0;
  let sa = 0,
    sd = 0,
    wa = 0,
    wd = 0,
    sq = 0;
  for (let i = 0; i < N; i++) {
    const ph = i / N;
    const r = reading(c, ph * T, x, h, guideEngaged, offset);
    const pd = lag ? reading(c, (ph - lag) * T, x, h, guideEngaged, offset).pd : r.pd;
    r.pa += paOff;
    r.pd = pd;
    sa += r.pa;
    sd += r.pd;
    sq += r.q;
    if (ph >= WFP[0] && ph <= WFP[1]) {
      wa += r.pa;
      wd += r.pd;
    }
  }
  return { pa: sa / N, pd: sd / N, pdpa: sd / sa, wfp: wd / wa, q: sq / N };
}

/**
 * Equalise: the sensor should sit just beyond the guide tip, where Pd = Pa. Equalising anywhere else
 * cancels a real gradient (a classic error the debrief reports).
 */
export function equalise(pw: PressureWireState, c: CoronaryCase, x: number, sensorMm: number, err: ChannelErrors = {}): { pw: PressureWireState; ok: boolean } {
  const r = measure(c, x, 0, pw.offset, true, err);
  const ok = equaliseValidAt(sensorMm);
  return { pw: { ...pw, equalised: true, offset: pw.offset - (r.pd - r.pa), sinceEqualiseS: 0, equalisedAt: sensorMm }, ok };
}

export function stepPressureWire(pw: PressureWireState, dt: number): PressureWireState {
  const n: PressureWireState = { ...pw, offset: pw.offset + pw.driftPerS * dt, sinceEqualiseS: pw.sinceEqualiseS + dt };
  // a loose aortic transducer drifts the aortic channel (pci-pressure-wire-console)
  if (pw.setup?.transducerLoose && dt > 0) n.setup = { ...pw.setup, paDriftMmHg: pw.setup.paDriftMmHg + MP_LOOSE_TRANSDUCER_DRIFT_MMHG_S * dt };
  return n;
}

/** Pd/Pa at the guide tip after a pullback: outside 0.98-1.02 the sensor has drifted (`err`: the channels' set-up errors). */
export function driftCheck(pw: PressureWireState, c: CoronaryCase, err: ChannelErrors = {}): { pdpa: number; ok: boolean } {
  const r = measure(c, 0, 0, pw.offset, true, err);
  return { pdpa: r.pdpa, ok: Math.abs(r.pdpa - 1) <= CUTOFF.drift };
}

export function recordSample(pw: PressureWireState, s: PullbackSample): PressureWireState {
  if (!pw.pullback.recording) return pw;
  return { ...pw, pullback: { ...pw.pullback, samples: [...pw.pullback.samples, s] } };
}

/**
 * Angiographic transit time (s) of contrast from the ostium to the sensor position at hyperaemia h:
 * epicardial volume over flow, from the same flow() that gives FFR.
 */
export function transitTimeS(c: CoronaryCase, h: number, x = 1): number {
  const q = flow(c, h).q;
  const vol = (Math.PI * (c.refDiamMm / 2) ** 2 * c.lengthMm * x) / 1000; // mL
  return vol / Math.max(1e-3, q);
}

/** Fallback IC adenosine hyperaemia curve for headless use (rise over 5 s, plateau to 15 s, gone by 45 s) — MODEL PARAMETER. */
export function icAdenosineHyperaemia(tSinceBolus: number): number {
  if (tSinceBolus < 0) return 0;
  if (tSinceBolus < 5) return tSinceBolus / 5;
  if (tSinceBolus < 15) return 1;
  return Math.max(0, 1 - (tSinceBolus - 15) / 30);
}

// ---------------------------------------------------------------------------
// Co-registration on a stored angiographic frame
// ---------------------------------------------------------------------------
export interface StoredFrame {
  id: number;
  /** cardiac phase of the stored frame (0..1, 0 = R wave) */
  phase: number;
  /** route positions (mm) and their projected image positions (mm on the detector plane) */
  mm: number[];
  xy: { x: number; y: number }[];
}

/** Projected position of a route position on the stored frame (linear between stored points). */
export function frameXY(f: StoredFrame, mm: number): { x: number; y: number } {
  if (mm <= f.mm[0]) return f.xy[0];
  for (let i = 1; i < f.mm.length; i++) {
    if (mm <= f.mm[i]) {
      const u = (mm - f.mm[i - 1]) / Math.max(1e-6, f.mm[i] - f.mm[i - 1]);
      return { x: f.xy[i - 1].x + (f.xy[i].x - f.xy[i - 1].x) * u, y: f.xy[i - 1].y + (f.xy[i].y - f.xy[i - 1].y) * u };
    }
  }
  return f.xy[f.xy.length - 1];
}

export interface MarkerObs {
  t: number;
  /** cardiac phase of this fluoroscopy frame */
  phase: number;
  /** tracked marker position on that frame */
  xy: { x: number; y: number };
}

/**
 * Co-register a constant-speed pullback onto the stored frame. Marker observations on frames in the
 * stored frame's cardiac phase (within `gate`) are matched to the nearest point of the stored centre line;
 * those anchors are fitted with the pullback's known constant speed (least squares on the start position),
 * and every sample time is mapped to a route position. Returns the route mm for each requested time.
 */
export function coregister(f: StoredFrame, obs: MarkerObs[], speedMmS: number, times: number[], gate = 0.06): number[] {
  const anchors: { t: number; mm: number }[] = [];
  for (const o of obs) {
    const dph = Math.abs(((o.phase - f.phase + 1.5) % 1) - 0.5);
    if (dph > gate) continue;
    let best = 0,
      bd = Infinity;
    for (let i = 0; i < f.xy.length; i++) {
      const d = (f.xy[i].x - o.xy.x) ** 2 + (f.xy[i].y - o.xy.y) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    anchors.push({ t: o.t, mm: f.mm[best] });
  }
  if (!anchors.length) return times.map(() => NaN);
  // mm(t) = mm0 − speed·t; least squares for mm0
  const mm0 = anchors.reduce((s, a) => s + a.mm + speedMmS * a.t, 0) / anchors.length;
  return times.map((t) => mm0 - speedMmS * t);
}
