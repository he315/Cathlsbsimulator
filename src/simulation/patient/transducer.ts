// ---------------------------------------------------------------------------
// From catheter tip to the number on the monitor.
//
// 1. Tip pressure. Where the tip sits decides what it sees:
//    - aorta: aortic root pressure
//    - lv: LV pressure
//    - ostium / coronary: a small chamber (the catheter tip and the ostial
//      lumen around it) filled from the aorta through the residual gap the
//      catheter leaves open (gap 1 = unobstructed) and drained into the
//      coronary bed, whose resistance is high in systole (intramyocardial
//      compression, physiology.ts) and low in diastole. With a small gap the
//      pressure falls in diastole while systole is preserved: the trace
//      "ventricularises". With no gap it decays to the bed's back pressure: the
//      tip is wedged. Side holes add a parallel path from the aorta. A run-off
//      branch at the tip (conus or RV branch in the RCA) drains in diastole.
//      Damping, ventricularisation and wedging therefore emerge from one
//      model; the gap comes from the device physics (S7) through TipInput.
//      A kink in the shaft (diag-catheter-kink, TipInput.kink) adds a second
//      small chamber, the column behind the kink, filled from the tip through
//      what the kink leaves open: the trace damps, and is flat once the lumen
//      is closed.
// 2. Transducer chain. A fluid-filled catheter, line and transducer behave as
//    a second-order system. Its natural frequency and damping follow from the
//    lumped hydraulics: fluid inertance L = ρℓ/(πr²), viscous resistance
//    R = 8μℓ/(πr⁴) and compliance C (transducer plus any air, V/P_atm by
//    Boyle's law): ωn = 1/√(LC), ζ = (R/2)√(C/L). Air raises C, so it lowers ωn
//    and raises ζ (a damped trace); contrast in the catheter raises μ.
//    The hydrostatic offset is ρg∆h between the transducer and the
//    phlebostatic axis (fourth intercostal space, mid-axillary line), about
//    0.74 mmHg per cm: raising the transducer 10 cm lowers the reading by
//    about 7.4 mmHg. An unzeroed transducer carries its own offset; zeroing
//    (stopcock open to air) removes it. A fast flush applies the flush-bag
//    pressure; on release the system rings at its natural frequency.
//    The requirement that the natural frequency exceed 24 Hz and the optimal
//    damping of 0.64-0.7 are from Deranged Physiology (facts S9 §transducer)
//    and are used for the teaching read-out only.
// Physical constants are physics; dimensions, compliances and the damping
// gain are MODEL PARAMETERS (MP_*).
// ---------------------------------------------------------------------------

import type { EngagementState } from "../../types";
import { compression } from "../physiology";

export type TipLocation = "outside" | "aorta" | "ostium" | "coronary" | "lv";

/** Input hook from the device physics (S7) or the legacy engagement classifier. */
export interface TipInput {
  location: TipLocation;
  side?: "left" | "right";
  /** open fraction of the ostial lumen around the catheter (gap area / ostial area), 0 sealed … 1 open; conductance ∝ gap² */
  gap?: number;
  /** a draining side branch at the tip (conus or RV branch), 0 … 1 */
  runoff?: number;
  /** the tip is in the conus branch */
  conus?: boolean;
  /** the catheter has side holes */
  sideHoles?: boolean;
  /** the haemostatic valve or a port is open: the pressure signal is lost */
  valveOpen?: boolean;
  /** tip-wall contact force (model units 0..1+) driving catheter-tip spasm */
  wallContact?: number;
  /** tip touching the LV wall (ventricular ectopy) */
  lvContact?: boolean;
  /**
   * A kink in the catheter shaft between the tip and the transducer (diag-catheter-kink), 0 (none) …
   * 1 (the lumen closed): the column behind it is filled from the tip through what the kink leaves
   * open, so the trace is damped and, with the lumen closed, flat. Absent: no kink (every caller that
   * does not set it is unchanged).
   */
  kink?: number;
}

export type TipPressureState = "aortic" | "damped" | "ventricularised" | "wedged" | "lv" | "open" | "none";

// --- tip chamber MODEL PARAMETERS ---
/** conductance of an unobstructed ostium around the catheter, mL/s/mmHg */
export const MP_G_FREE = 5;
/** compliance of the ostial chamber at the tip, mL/mmHg */
export const MP_C_TIP = 0.0035;
/** side-hole conductance from the aorta, mL/s/mmHg */
export const MP_G_SIDEHOLES = 0.25;
/** maximal run-off conductance of a conus/RV branch at the tip, mL/s/mmHg */
export const MP_G_RUNOFF = 0.035;
/** coronary bed back pressure in diastole, mmHg (physiology.ts PV) */
export const P_BED = 5;
/** extra back pressure from intramyocardial compression at peak systole, mmHg (MODEL PARAMETER) */
export const MP_P_INTRAMYO = 22;

/** Back pressure of the coronary bed through the beat: the contracting myocardium squeezes the bed. */
export function bedBackPressure(phase: number): number {
  return P_BED + (MP_P_INTRAMYO * (compression(phase) - 0.75)) / 1.85;
}

export interface TipEnv {
  /** aortic root, LV and RV pressure now (mmHg) */
  pAo: number;
  pLv: number;
  pRv: number;
  /** beat phase 0..1 for intramyocardial compression */
  phase: number;
  /** resting coronary bed resistance of the side the tip is in (mmHg·s/mL, before compression) */
  rBed: number;
  /** extra ostial narrowing from catheter-tip spasm, 0 (none) … 1 (closed) */
  spasm: number;
}

/**
 * The column behind a kink in the shaft (diag-catheter-kink): its compliance (mL/mmHg) and the
 * conductance of the open lumen through the kinked segment (mL/s/mmHg), which falls as (1 − kink)²
 * like the ostial gap's; a kink at or above MP_KINK_CLOSED closes the lumen. MODEL PARAMETERS: the
 * column's time constant C/g is about 0.2 s at the lightest kink the engine latches (0.3), about 0.4 s
 * at 0.5 (the beat low-passed towards its mean) and seconds near closure (a flat line).
 */
export const MP_C_KINK = 0.002;
export const MP_G_KINK_OPEN = 0.02;
export const MP_KINK_CLOSED = 0.95;

export class TipChamber {
  p = 80;
  /** mean flow through the gap and side holes into the coronary over the last beat (mL/s) */
  qIn = 0;
  /** the pressure of the column behind a kink in the shaft (what the transducer sees while there is one) */
  pBehind = 80;

  /**
   * Advance the tip pressure by dt and return the pressure the catheter's column carries to the
   * transducer: the tip's own, or, behind a kink in the shaft (TipInput.kink), the column's.
   */
  step(dt: number, tip: TipInput, env: TipEnv): number {
    const pTip = this.stepTip(dt, tip, env);
    const kink = Math.max(0, Math.min(1, tip.kink ?? 0));
    if (!(kink > 0) || tip.location === "outside") {
      this.pBehind = pTip;
      return pTip;
    }
    const open = kink >= MP_KINK_CLOSED ? 0 : 1 - kink;
    const g = MP_G_KINK_OPEN * open * open;
    this.pBehind += (pTip - this.pBehind) * (1 - Math.exp((-g * dt) / MP_C_KINK));
    return this.pBehind;
  }

  private stepTip(dt: number, tip: TipInput, env: TipEnv): number {
    if (tip.location === "outside") {
      this.p = 0;
      this.qIn = 0;
      return 0;
    }
    if (tip.location === "aorta") {
      this.p = env.pAo;
      this.qIn = 0;
      return this.p;
    }
    if (tip.location === "lv") {
      this.p = env.pLv;
      this.qIn = 0;
      return this.p;
    }
    const gap = Math.max(0, Math.min(1, tip.gap ?? 1)) * (1 - Math.max(0, Math.min(1, env.spasm)));
    const g = MP_G_FREE * gap * gap + (tip.sideHoles ? MP_G_SIDEHOLES : 0);
    const comp = compression(env.phase);
    const gBed = 1 / Math.max(1, env.rBed * comp);
    const run = (tip.runoff ?? (tip.conus ? 0.6 : 0)) * MP_G_RUNOFF / comp;
    // implicit update of C dp/dt = g (pAo − p) − (gBed + run)(p − Pbed)
    const a = g + gBed + run;
    const pb = bedBackPressure(env.phase);
    const pInf = a > 0 ? (g * env.pAo + gBed * pb + run * P_BED) / a : this.p;
    const k = 1 - Math.exp((-a * dt) / MP_C_TIP);
    this.p += (pInf - this.p) * k;
    const q = g * (env.pAo - this.p);
    this.qIn += (q - this.qIn) * Math.min(1, dt / 0.8);
    return this.p;
  }
}

// --- transducer chain ---
export const MMHG_PA = 133.322;
/** saline density, kg/m³ (0.9% NaCl ≈ water; physics) */
export const RHO = 1005;
export const G = 9.81;
/** hydrostatic pressure of 1 cm of saline, mmHg (ρg × 0.01 m / 133.322 Pa) */
export const MMHG_PER_CM = (RHO * G * 0.01) / MMHG_PA;
/** atmospheric pressure, mmHg (for the compliance of trapped air: C = V/P) */
export const P_ATM = 760;

export interface LineSpec {
  /** catheter length (cm) and inner radius (mm) */
  catheterCm: number;
  catheterRmm: number;
  /** pressure line length (cm) and inner radius (mm) */
  lineCm: number;
  lineRmm: number;
  /**
   * The damping gain of this set-up (haemo-transducer-and-setup), in place of MP_DAMPING_GAIN when
   * given. Optional, so DEFAULT_LINE and every line without it keep MP_DAMPING_GAIN. MODEL PARAMETER:
   * the lumped hydraulics cannot make a long extension ring (with Poiseuille resistance a longer line
   * always damps more), so a line that resonates as a distributed line carries its own, lower gain.
   */
  dampingGain?: number;
}

/** A 100 cm catheter and 150 cm manifold line (MODEL PARAMETERS). */
export const DEFAULT_LINE: LineSpec = { catheterCm: 100, catheterRmm: 0.55, lineCm: 150, lineRmm: 0.75 };
/** transducer and connector compliance, mL/mmHg (MODEL PARAMETER giving ≈ 20 Hz without air) */
export const MP_C_TRANSDUCER = 3.0e-6;
/** extra damping from connectors, stopcocks and frequency-dependent losses (MODEL PARAMETER) */
export const MP_DAMPING_GAIN = 4;
/** saline and contrast viscosity, Pa·s (saline is water-like physics; contrast at body temperature is a MODEL PARAMETER) */
export const MU_SALINE = 0.0009;
export const MP_MU_CONTRAST = 0.01;
/** flush bag pressure, mmHg (MODEL PARAMETER) */
export const MP_FLUSH_BAG = 300;

export interface TransducerState {
  /** transducer height above the phlebostatic axis, cm (+ above) */
  heightCm: number;
  /** offset the transducer reads at atmosphere before zeroing, mmHg */
  drift: number;
  /** offset removed at the last zero, mmHg */
  zeroRef: number;
  zeroed: boolean;
  /** air trapped in the line, mL */
  airMl: number;
  /** fraction of the catheter filled with contrast */
  contrastFrac: number;
  flushing: boolean;
  openToAir: boolean;
  /** second-order state */
  x: number;
  v: number;
  /**
   * Line faults (diag-pressure-transducer), optional so that older snapshots restore: the stopcock
   * at the transducer turned off to the patient (the diaphragm sees the closed column, a flat line at
   * the pressure it held), the line disconnected from the catheter (the diaphragm sees atmosphere),
   * and a zero offset put in as a fault (cleared by zeroing).
   */
  offToPatient?: boolean;
  /** the pressure the closed column holds while the stopcock is off to the patient, mmHg */
  heldU?: number;
  disconnected?: boolean;
  unzeroedFault?: boolean;
  /** seconds of fast flush left (a square-wave test: the flush valve pulled and released) */
  flushLeftS?: number;
  /** thrombus or plaque plugging the catheter lumen: the column barely moves (not a line fault) */
  lumenPlug?: boolean;
  /**
   * Seconds since the diaphragm last saw the flush bag (a held flush or a fast flush), so that a
   * reader of the beat numerics can tell flush artefact from pressure; absent until the first flush.
   */
  sinceFlushS?: number;
}

/**
 * The faults a pressure line can carry (diag-pressure-transducer): air in the line, the stopcock
 * turned off to the patient, the line disconnected, a transducer that has not been zeroed, and a
 * transducer set below ('low', reads high) or above ('high', reads low) the phlebostatic axis. The
 * plan names the first five; 'high' is the same levelling fault the other way. Each has its remedy on the Transducer: reprime (flush
 * the air out through the waste port), turnToPatient, reconnect, zero, level. A fast flush (the
 * square-wave test) shows the line's dynamic response on the trace and does not by itself clear air.
 */
export const TRANSDUCER_FAULTS = ["air-bubble", "off", "disconnected", "unzeroed", "low", "high"] as const;
export type TransducerFault = (typeof TRANSDUCER_FAULTS)[number];

/** Air a fault puts in the line, mL. MODEL PARAMETER: enough to overdamp the 100 cm catheter and 150 cm line of DEFAULT_LINE (natural frequency below 5 Hz). */
export const MP_FAULT_AIR_ML = 0.1;
/** Air in the line from which the trace is affected and the line counts as faulty, mL. MODEL PARAMETER. */
export const MP_AIR_FAULT_MIN_ML = 0.01;
/** Zero offset an 'unzeroed' fault adds, mmHg. MODEL PARAMETER. */
export const MP_FAULT_DRIFT_MMHG = 18;
/** Height of a transducer left low ('low' fault): this far below the phlebostatic axis, cm; a 'high' fault sets it this far above. MODEL PARAMETER (about 11 mmHg off, MMHG_PER_CM). */
export const MP_FAULT_LOW_CM = 15;
/** A transducer more than this far from the phlebostatic axis counts as not levelled, cm. MODEL PARAMETER. */
export const MP_LEVEL_TOL_CM = 5;
/** Length of a fast flush (the flush valve pulled for the square-wave test), s. MODEL PARAMETER. */
export const MP_FAST_FLUSH_S = 0.5;
/**
 * Factor on the catheter's viscous resistance while a plug sits in its lumen. MODEL PARAMETER: it
 * low-passes the column with a time constant of well under a second, so the displayed trace is
 * damped towards the mean pressure.
 */
export const MP_PLUG_R_FACTOR = 200;

export interface Dynamic {
  fnHz: number;
  zeta: number;
  /** amplitude ratio of successive oscillations after a fast flush */
  amplitudeRatio: number;
  /** teaching verdict (natural frequency > 24 Hz; damping 0.64-0.7 optimal) */
  verdict: "optimal" | "underdamped" | "overdamped" | "low natural frequency";
}

export class Transducer {
  st: TransducerState;
  constructor(public line: LineSpec = DEFAULT_LINE, drift = 0) {
    this.st = { heightCm: 0, drift, zeroRef: 0, zeroed: false, airMl: 0, contrastFrac: 0, flushing: false, openToAir: false, x: 0, v: 0 };
  }

  /** ωn (rad/s) and ζ from the lumped hydraulics. */
  dynamics(): { wn: number; zeta: number } {
    const { catheterCm, catheterRmm, lineCm, lineRmm } = this.line;
    const lc = catheterCm / 100,
      rc = catheterRmm / 1000,
      ll = lineCm / 100,
      rl = lineRmm / 1000;
    const L = (RHO * lc) / (Math.PI * rc * rc) + (RHO * ll) / (Math.PI * rl * rl); // kg/m⁴
    const muC = MU_SALINE * (1 - this.st.contrastFrac) + MP_MU_CONTRAST * this.st.contrastFrac;
    const R = ((8 * muC * lc) / (Math.PI * rc ** 4)) * (this.st.lumenPlug ? MP_PLUG_R_FACTOR : 1) + (8 * MU_SALINE * ll) / (Math.PI * rl ** 4); // Pa·s/m³
    const cMl = MP_C_TRANSDUCER + Math.max(0, this.st.airMl) / P_ATM; // mL/mmHg
    const C = (cMl * 1e-6) / MMHG_PA; // m³/Pa
    const wn = 1 / Math.sqrt(L * C);
    const zeta = (this.line.dampingGain ?? MP_DAMPING_GAIN) * (R / 2) * Math.sqrt(C / L);
    return { wn, zeta };
  }

  /** Natural frequency, damping and the fast-flush amplitude ratio, with the teaching verdict. */
  dynamic(): Dynamic {
    const { wn, zeta } = this.dynamics();
    const fnHz = wn / (2 * Math.PI);
    const ar = zeta < 1 ? Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta)) : 0;
    const verdict: Dynamic["verdict"] = zeta > 0.75 ? "overdamped" : fnHz < 24 && zeta < 0.45 ? "low natural frequency" : zeta < 0.55 ? "underdamped" : "optimal";
    return { fnHz, zeta, amplitudeRatio: ar, verdict };
  }

  /** Hydrostatic offset added to the reading, mmHg (transducer above the axis reads low). */
  hydrostatic(): number {
    return -this.st.heightCm * MMHG_PER_CM;
  }

  setHeight(cm: number) {
    this.st.heightCm = cm;
  }
  /** Zero: open to air at the transducer and take the reading as the reference. */
  zero() {
    this.st.zeroRef = this.st.drift;
    this.st.zeroed = true;
    this.st.unzeroedFault = false;
  }
  setAir(ml: number) {
    this.st.airMl = Math.max(0, ml);
  }
  setContrast(frac: number) {
    this.st.contrastFrac = Math.max(0, Math.min(1, frac));
  }
  setFlush(on: boolean) {
    this.st.flushing = on;
  }
  setOpenToAir(on: boolean) {
    this.st.openToAir = on;
  }

  // --- faults and their remedies (diag-pressure-transducer) -------------------------

  /** Put a fault in the line. */
  setFault(f: TransducerFault) {
    const s = this.st;
    if (f === "air-bubble") s.airMl = Math.max(s.airMl, MP_FAULT_AIR_ML);
    else if (f === "off") {
      s.offToPatient = true;
      s.heldU = s.x;
    } else if (f === "disconnected") s.disconnected = true;
    else if (f === "unzeroed") {
      s.drift = s.zeroRef + MP_FAULT_DRIFT_MMHG;
      s.zeroed = false;
      s.unzeroedFault = true;
    } else if (f === "high") s.heightCm = MP_FAULT_LOW_CM;
    else s.heightCm = -MP_FAULT_LOW_CM;
  }

  /** The faults the line has now (what a careful check of the line would find). */
  faults(): TransducerFault[] {
    const s = this.st;
    const out: TransducerFault[] = [];
    if (s.airMl >= MP_AIR_FAULT_MIN_ML) out.push("air-bubble");
    if (s.offToPatient) out.push("off");
    if (s.disconnected) out.push("disconnected");
    if (s.unzeroedFault) out.push("unzeroed");
    if (s.heightCm < -MP_LEVEL_TOL_CM) out.push("low");
    else if (s.heightCm > MP_LEVEL_TOL_CM) out.push("high");
    return out;
  }

  /** Fast flush: pull the flush valve for durS and release it (the square-wave test). The trace shows the ringing; air stays in the line. */
  fastFlush(durS = MP_FAST_FLUSH_S) {
    this.st.flushLeftS = Math.max(this.st.flushLeftS ?? 0, durS);
  }

  /** Re-prime the line: flush it through the waste port until no air is left. */
  reprime() {
    this.st.airMl = 0;
  }

  /** Bring the transducer back to the phlebostatic axis. */
  level() {
    this.st.heightCm = 0;
  }

  /** Turn the transducer stopcock back to the patient. */
  turnToPatient() {
    this.st.offToPatient = false;
    this.st.heldU = undefined;
  }

  /** Reconnect the line to the catheter. */
  reconnect() {
    this.st.disconnected = false;
  }

  /** A plug of thrombus or plaque in the catheter lumen (set by the lab; not a fault of the line). */
  setLumenPlug(on: boolean) {
    this.st.lumenPlug = on;
  }

  /**
   * Advance the chain by dt (call at ≤ 0.5 ms) with the true tip pressure (gauge, at the heart's
   * level). Returns the displayed pressure.
   */
  step(dt: number, pTip: number): number {
    const { wn, zeta } = this.dynamics();
    return this.stepWith(dt, pTip, wn, zeta);
  }

  /**
   * step() with the line's dynamics given (from dynamics(), computed once by a caller that steps many
   * times with the line unchanged; recompute after any change to the line, air, contrast or plug).
   */
  stepWith(dt: number, pTip: number, wn: number, zeta: number): number {
    const s = this.st;
    const fastFlush = (s.flushLeftS ?? 0) > 0;
    if (fastFlush) s.flushLeftS = Math.max(0, (s.flushLeftS ?? 0) - dt);
    if (s.flushing || fastFlush) s.sinceFlushS = 0;
    else if (s.sinceFlushS !== undefined) s.sinceFlushS += dt;
    // the pressure at the transducer diaphragm (gauge): open to air reads atmosphere; flush applies the
    // bag; a line off to the patient holds its column, a disconnected line reads atmosphere
    const u = s.openToAir
      ? 0
      : s.flushing || fastFlush
        ? MP_FLUSH_BAG
        : s.offToPatient
          ? (s.heldU ?? 0)
          : s.disconnected
            ? 0
            : pTip + this.hydrostatic();
    // semi-implicit integration of x'' + 2ζωn x' + ωn² x = ωn² u, sub-stepped for stability
    // sub-steps for the oscillation and, when heavily damped (a plug), for the damping term
    const n = Math.max(1, Math.ceil((wn * dt) / 0.15), Math.ceil((2 * zeta * wn * dt) / 0.5));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      s.v += h * (wn * wn * (u - s.x) - 2 * zeta * wn * s.v);
      s.x += h * s.v;
    }
    return s.x + s.drift - s.zeroRef;
  }

  snapshot(): TransducerState {
    return { ...this.st };
  }
  restore(t: TransducerState) {
    this.st = { ...t };
  }
}

// ---------------------------------------------------------------------------
// The bedside reading of a fast-flush test (haemo-transducer-and-setup)
// ---------------------------------------------------------------------------

/**
 * What a fast-flush test is read as at the bedside. The module (pm-monitoring-transducers, 'Doing and
 * reading the test (Michard 2024)') names three outcomes: normal damping (a couple of oscillations,
 * called 'optimal' here), overdamped (no oscillations; air, a kink or partial obstruction) and
 * underdamped (several oscillations with a systolic overshoot; longer tubing makes resonance more
 * likely).
 */
export const FLUSH_READINGS = ["optimal", "overdamped", "underdamped"] as const;
export type FlushReading = (typeof FLUSH_READINGS)[number];

/** Natural frequency a line needs to resolve the trace, Hz (Deranged Physiology, facts S9 §transducer; the same 24 Hz as dynamic()). */
export const FLUSH_MIN_FN_HZ = 24;
/** Most oscillations an adequate line shows after a fast flush (Deranged Physiology, facts S9 §transducer: at least one and no more than two). */
export const FLUSH_MAX_OSCILLATIONS = 2;
/**
 * An oscillation after the flush is visible on the recorder while its amplitude is at least this
 * fraction of the flush step. MODEL PARAMETER: chosen so that a line at the top of the optimal damping
 * band (ζ 0.75, dynamic()'s overdamped boundary) shows no visible oscillation.
 */
export const MP_FLUSH_VISIBLE = 0.03;

/** Visible oscillations after a fast flush: successive extrema of the second-order response at least MP_FLUSH_VISIBLE of the step. */
export function flushOscillations(d: Pick<Dynamic, "zeta" | "amplitudeRatio">): number {
  const ar = d.amplitudeRatio;
  if (!(d.zeta < 1) || !(ar > 0) || !(ar < 1)) return 0;
  return Math.max(0, Math.floor(Math.log(MP_FLUSH_VISIBLE) / Math.log(ar) + 1e-9));
}

/**
 * The bedside reading of the line from its dynamics: overdamped when no oscillation is visible;
 * underdamped when more than two are, or when the natural frequency is below FLUSH_MIN_FN_HZ (the line
 * resonates with the pressure wave: the module's 'longer tubing makes resonance more likely');
 * otherwise optimal. dynamic().verdict is the engineering verdict against the optimal damping band and
 * is unchanged; this is what the test shows on the recorder.
 */
export function fastFlushReading(d: Dynamic): { reading: FlushReading; oscillations: number } {
  const oscillations = flushOscillations(d);
  if (oscillations === 0) return { reading: "overdamped", oscillations };
  if (oscillations > FLUSH_MAX_OSCILLATIONS || d.fnHz < FLUSH_MIN_FN_HZ) return { reading: "underdamped", oscillations };
  return { reading: "optimal", oscillations };
}

/** Classify a beat's tip pressure against the aortic pressure of the same beat. */
export function classifyTip(tip: TipInput, tipSys: number, tipDia: number, aoSys: number, aoDia: number): TipPressureState {
  if (tip.valveOpen) return "open";
  if (tip.location === "outside") return "none";
  // a kinked shaft (diag-catheter-kink) damps whatever the tip sees: a ventricular tip behind a kink
  // still reads its column, an aortic one is read against the aorta like any other
  if ((tip.kink ?? 0) > 0) {
    if (tip.location === "lv") return "damped";
    const kinkPulse = tipSys - tipDia;
    if (tipSys < aoSys - 10 || tipDia < aoDia - 8 || kinkPulse < 0.6 * Math.max(1, aoSys - aoDia)) return "damped";
  }
  if (tip.location === "lv") return "lv";
  if (tip.location === "aorta") return "aortic";
  const pulse = tipSys - tipDia;
  const aoPulse = Math.max(1, aoSys - aoDia);
  const mean = tipDia + pulse / 3;
  const aoMean = aoDia + aoPulse / 3;
  if (mean < 0.55 * aoMean && pulse < 0.45 * aoPulse) return "wedged";
  if (tipDia < aoDia - 15 && tipSys > 0.75 * aoSys) return "ventricularised";
  if (tipSys < aoSys - 10 || tipDia < aoDia - 8) return "damped";
  return "aortic";
}

// ---------------------------------------------------------------------------
// Legacy bridge: the current engagement classifier as a tip input
// ---------------------------------------------------------------------------


/**
 * Map the legacy engagement classifier onto a tip input until the rod physics (S7) reports the
 * gap directly. The gap values are MODEL PARAMETERS chosen to reproduce the old trace classes.
 */
/**
 * Runoff at a deep right coronary seat (TipInput.runoff: a draining side branch at the tip, the conus
 * or a right ventricular branch). MODEL PARAMETER of tipFromEngagement's deep right seat, which has
 * always used it; tipFromPhysics gives a deep right seat the same.
 */
export const MP_DEEP_RCA_RUNOFF = 0.5;

export function tipFromEngagement(eng: EngagementState, sideHoles = false): TipInput {
  if (eng.kind === "in-lv" || eng.kind === "below-valve") return { location: "lv", lvContact: eng.kind === "in-lv" };
  if (eng.conus) return { location: "coronary", side: "right", gap: 0.09, conus: true, sideHoles };
  const side = eng.target === "right" ? "right" : "left";
  if (eng.isDeep) {
    if (side === "right") return { location: "ostium", side, gap: 0.1, runoff: MP_DEEP_RCA_RUNOFF, sideHoles, wallContact: 0.6 };
    return { location: "ostium", side, gap: eng.depth > 5 ? 0.0 : 0.13, sideHoles, wallContact: 0.6 };
  }
  if (eng.isSelective) return { location: "ostium", side, gap: eng.quality < 0.45 ? 0.3 : 0.8, sideHoles, wallContact: eng.quality < 0.45 ? 0.3 : 0.1 };
  return { location: "aorta" };
}

// ---------------------------------------------------------------------------
// The rod physics as a tip input (diag-rod-physics)
// ---------------------------------------------------------------------------

/** What tipFromPhysics reads from a physics reading (src/ui/physics/types.ts PhysicsReading passes structurally). */
export interface PhysicsTipReading {
  /** engagement class in the labs' vocabulary */
  kind: EngagementState["kind"];
  side: "left" | "right" | null;
  /** coronary vessel holding the tip, or null */
  vessel: string | null;
  /** depth beyond the ostium along the vessel (mm); negative is short of it */
  depthMm: number;
  /** fraction of the ostial lumen left open around the catheter (1 unobstructed) */
  openFraction: number;
  /** summed wall normal force over the distal tip (N) */
  wallForce: number;
  conus: boolean;
  prolapsed: boolean;
  /** a kink in the shaft (diag-catheter-kink): its severity, 0..1; absent or null without one */
  kink?: { severity: number } | null;
}

/**
 * Smallest gap a tip in the conus branch leaves open. MODEL PARAMETER: the conus is narrower than a
 * 6 Fr catheter, so the rod model's open fraction there falls to zero once the tip is past the
 * funnel; the tip lodges in the branch mouth rather than sealing it, and the leak is the conus gap
 * tipFromEngagement has always used (0.09), which the transducer chain reads as a damped trace.
 */
export const MP_CONUS_GAP_MIN = 0.09;
/** Tip wall contact (TipInput.wallContact, model units) per newton of distal wall force. MODEL PARAMETER: 0.3 N, a firm deep seat in the rod model, gives the 0.6 that tipFromEngagement uses for a deep seat. */
export const MP_WALL_CONTACT_PER_N = 2;

const clamp01 = (x: number) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 1));

/**
 * The tip input from the device physics: the open fraction of the ostial lumen is the gap (the
 * classifier's open fraction and TipInput.gap are the same quantity), the wall force drives
 * catheter-tip spasm, the conus and the ventricle are their own chambers. A tip that is not in a
 * coronary lumen sees the aortic pressure. Replaces tipFromEngagement while the rod physics runs.
 */
export function tipFromPhysics(r: PhysicsTipReading, catheter: { sideHoles?: boolean } = {}): TipInput {
  const tip = tipFromPhysicsTip(r, catheter);
  // a kink in the shaft lies behind the tip (diag-catheter-kink): the column to the transducer is
  // filled through what it leaves open, and a severe kink (MP_KINK_CLOSED) leaves no gap at all
  const k = r.kink?.severity;
  if (k !== undefined && Number.isFinite(k) && k > 0) tip.kink = Math.min(1, k >= MP_KINK_CLOSED ? 1 : k);
  return tip;
}

function tipFromPhysicsTip(r: PhysicsTipReading, catheter: { sideHoles?: boolean }): TipInput {
  const sideHoles = !!catheter.sideHoles;
  if (r.kind === "in-lv" || r.kind === "below-valve") return { location: "lv", lvContact: r.kind === "in-lv" };
  const wallContact = Math.max(0, Number.isFinite(r.wallForce) ? r.wallForce : 0) * MP_WALL_CONTACT_PER_N;
  if (r.conus) return { location: "coronary", side: "right", gap: Math.max(MP_CONUS_GAP_MIN, clamp01(r.openFraction)), conus: true, sideHoles, wallContact };
  if (r.vessel !== null && r.side && r.depthMm > -0.5) {
    const deep = r.kind === "deep-lm" || r.kind === "deep-rca";
    const runoff = r.kind === "deep-rca" ? { runoff: MP_DEEP_RCA_RUNOFF } : {};
    return { location: deep ? "coronary" : "ostium", side: r.side, gap: clamp01(r.openFraction), ...runoff, sideHoles, wallContact };
  }
  return { location: "aorta" };
}
