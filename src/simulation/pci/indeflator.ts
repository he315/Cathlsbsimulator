// ---------------------------------------------------------------------------
// The indeflator: a screw-driven syringe with a pressure dial.
//
// The operator turns the screw (a target pressure and a turning rate); the
// pressure follows at that rate, more slowly while the folded balloon unfolds
// in the first atmospheres. Pulling negative empties the balloon over a time
// that scales with its size and the contrast mixture: the balloon stays
// occlusive until it has emptied. The balloon's diameter follows its
// compliance chart (equipment.ts). Each balloon is given a burst pressure at
// "manufacture" from a normal distribution placed so that 99.9% survive the
// rated burst pressure, the FDA definition of RBP (99.9% survival with 95%
// confidence; facts C3); the spread is a MODEL PARAMETER.
//
// The indeflator also records the exposures the complication engine uses:
// peak pressure, time above RBP, the fastest pressure rise (melon-seeding)
// and the time the balloon occluded the vessel (ischaemia), and (pci-indeflator)
// the hold: seconds the screw has held its target and seconds at or above the
// rated burst pressure, which the lesion-yield model (lesionYield.ts) and the
// balloon-undilatable rule read. The lock holds the plunger where it is: while
// locked the screw does not turn and the plunger cannot be pulled back, so the
// pressure holds; unlock to turn the screw or to pull negative.
// ---------------------------------------------------------------------------

import { normal, type RngState } from "./rng";

export interface IndeflatorState {
  /** pressure now (atm); negative while pulling vacuum */
  atm: number;
  /** where the operator has screwed it to (atm) */
  target: number;
  /** screw turning rate (atm/s) */
  rate: number;
  /** pulling negative (deflating) */
  negative: boolean;
  /** balloon filled fraction by volume (0 folded … 1 at the commanded pressure) */
  fill: number;
  /** this inflation: seconds the balloon occluded, seconds above RBP, peak pressure, fastest rise (atm/s) */
  tOccluded: number;
  tAboveRbp: number;
  peak: number;
  maxRise: number;
  /** completed inflations with this balloon */
  count: number;
  /**
   * seconds the pressure has held the screw's target this inflation (pci-indeflator; absent on states
   * made before it: read as 0). A new, higher target restarts it.
   */
  tHold?: number;
  /** seconds at or above the device's rated burst pressure this inflation (pci-indeflator; absent: 0) */
  tAtRbp?: number;
  /** the screw is locked (pci-indeflator; absent: unlocked) */
  locked?: boolean;
}

export function initialIndeflator(): IndeflatorState {
  return { atm: 0, target: 0, rate: 0, negative: false, fill: 0, tOccluded: 0, tAboveRbp: 0, peak: 0, maxRise: 0, count: 0, tHold: 0, tAtRbp: 0, locked: false };
}

/** Spread of burst pressures above RBP (atm) — MODEL PARAMETER. */
export const MP_BURST_SD = 1.5;
/** z for 99.9% survival at RBP. */
export const Z_999 = 3.09;
/** Pressure below which a folded balloon is still unfolding (atm) and the slowing of the rise there — MODEL PARAMETERS. */
export const MP_UNFOLD_ATM = 2;
export const MP_UNFOLD_SLOW = 0.45;
/** Fill fraction above which the balloon occludes the vessel — MODEL PARAMETER. */
export const MP_OCCLUDE_FILL = 0.25;
/**
 * Time to empty the balloon fully, as a fraction of its labelled deflation-time specification — MODEL
 * PARAMETER (the label states a maximum; a clean preparation empties faster).
 */
export const MP_DEFLATE_OF_SPEC = 0.55;
/**
 * The pressure counts as holding its target within this band (atm), and as at the rated burst pressure
 * from this far below it (rounding of the dial) — MODEL PARAMETERS.
 */
export const MP_HOLD_BAND_ATM = 0.1;
/** A new target this far above the pressure now starts a new hold (atm) — MODEL PARAMETER. */
export const MP_HOLD_RESTART_ATM = 0.5;
/** Dial range of the indeflator (atm): the needle dial reads 0 to 30 (lab-build-plan.json, pci-indeflator design). */
export const INDEFLATOR_MAX_ATM = 30;

/** Draw the burst pressure of one balloon (atm). */
export function drawBurst(rng: RngState, rbp: number): number {
  return rbp + MP_BURST_SD * (Z_999 + normal(rng));
}

/** Screw to a target pressure at a turning rate (atm/s). Starting an inflation clears the per-inflation record. */
export function screwTo(s: IndeflatorState, target: number, rate: number): IndeflatorState {
  if (s.locked) return s;
  const fresh = s.fill < 0.05 && s.atm <= 0.2;
  const tgt = Math.max(0, Math.min(INDEFLATOR_MAX_ATM, target));
  const restart = fresh || tgt > s.atm + MP_HOLD_RESTART_ATM;
  return {
    ...s,
    target: tgt,
    rate: Math.max(0.1, rate),
    negative: false,
    ...(restart ? { tHold: 0 } : {}),
    ...(fresh ? { tOccluded: 0, tAboveRbp: 0, peak: 0, maxRise: 0, tAtRbp: 0 } : {}),
  };
}

/** Pull negative: start deflating (not while the screw is locked). */
export function pullNegative(s: IndeflatorState): IndeflatorState {
  if (s.negative || s.locked) return s;
  return { ...s, negative: true, target: 0, count: s.fill > 0.2 ? s.count + 1 : s.count };
}

/**
 * Lock or unlock the screw. Locking holds the pressure where it is: the screw's target is frozen at the
 * pressure now, so a pressure still rising toward the old target stops rising.
 */
export function lockScrew(s: IndeflatorState, locked: boolean): IndeflatorState {
  return !!s.locked === locked ? s : { ...s, locked, ...(locked ? { target: Math.max(0, s.atm) } : {}) };
}

/** Seconds the pressure has held its target this inflation (0 on a state made before pci-indeflator). */
export function holdSeconds(s: IndeflatorState): number {
  return s.tHold ?? 0;
}

/** Seconds at or above the rated burst pressure this inflation (0 on a state made before pci-indeflator). */
export function secondsAtRbp(s: IndeflatorState): number {
  return s.tAtRbp ?? 0;
}

/** The balloon is completely empty (the only state in which it may be withdrawn). */
export function fullyDeflated(s: IndeflatorState): boolean {
  return s.fill <= 0;
}

/** Is the balloon occluding the vessel? */
export function occluding(s: IndeflatorState): boolean {
  return s.fill > MP_OCCLUDE_FILL;
}

/**
 * Advance by dt (s). `rbp` is the device's rated burst pressure; `deflateSpecS` its labelled deflation time.
 * Returns the new state and the pressure rise rate in this step.
 */
export function stepIndeflator(s0: IndeflatorState, dt: number, rbp: number, deflateSpecS: number): { s: IndeflatorState; rise: number } {
  const s = { ...s0 };
  const p0 = s.atm;
  if (s.negative) {
    // pressure falls to vacuum within a second; the balloon empties exponentially
    s.atm = Math.max(-1, s.atm - Math.max(2, s.atm * 4) * dt);
    const tFull = Math.max(2, MP_DEFLATE_OF_SPEC * deflateSpecS);
    const tau = tFull / 3; // 95% empty at tFull
    s.fill = s.fill * Math.exp(-dt / tau);
    if (s.fill < 0.01) s.fill = 0;
  } else if (s.target > s.atm) {
    const slow = s.atm < MP_UNFOLD_ATM ? MP_UNFOLD_SLOW : 1;
    s.atm = Math.min(s.target, s.atm + s.rate * slow * dt);
    // the balloon fills while it unfolds; above the unfolding range it is full at the commanded pressure
    s.fill = Math.min(1, Math.max(s.fill, s.atm / MP_UNFOLD_ATM));
  } else if (s.target < s.atm) {
    // backing the screw off releases pressure (balloon stays full)
    s.atm = Math.max(s.target, s.atm - Math.max(2, s.rate) * dt);
  }
  const rise = dt > 0 ? (s.atm - p0) / dt : 0;
  if (s.atm > 0.5) s.maxRise = Math.max(s.maxRise, rise);
  s.peak = Math.max(s.peak, s.atm);
  if (s.atm > rbp) s.tAboveRbp += dt;
  if (occluding(s)) s.tOccluded += dt;
  // the hold: at the screw's target with the balloon full, and the time at or above the rated burst pressure
  if (!s.negative && s.atm > 0.5 && Math.abs(s.atm - s.target) <= MP_HOLD_BAND_ATM) s.tHold = (s.tHold ?? 0) + dt;
  if (!s.negative && s.atm >= rbp - MP_HOLD_BAND_ATM) s.tAtRbp = (s.tAtRbp ?? 0) + dt;
  return { s, rise };
}

/** Instantly set a pressure (headless scripts and the compatibility path). */
export function setPressure(s: IndeflatorState, atm: number): IndeflatorState {
  const fresh = s.fill < 0.05;
  return {
    ...s,
    atm,
    target: atm,
    negative: false,
    fill: atm > 0.5 ? 1 : s.fill,
    peak: Math.max(fresh ? 0 : s.peak, atm),
    ...(fresh ? { tOccluded: 0, tAboveRbp: 0, maxRise: 0, tHold: 0, tAtRbp: 0 } : {}),
  };
}

/** Instantly empty the balloon (headless scripts and the compatibility path). */
export function emptyNow(s: IndeflatorState): IndeflatorState {
  return { ...s, atm: -1, target: 0, negative: true, fill: 0, locked: false, count: s.fill > 0.2 ? s.count + 1 : s.count };
}
