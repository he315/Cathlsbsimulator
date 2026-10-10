// ---------------------------------------------------------------------------
// The lesion-yield model (pci-indeflator): how far a lesion lets a balloon or
// a stent open at a given pressure, after a given hold, and whether the
// balloon keeps a waist.
//
// One teaching model, shared by everything that dilates a lesion: the PCI
// lab's inflations (src/simulation/pci/actions/inflation.ts) call it, and the
// IVUS and OCT bench's timed inflations are meant to call it too, so the bench
// and the lab dilate lesions the same way.
//
//   resistance  0 (none) .. 1: how much the lesion holds the device back
//               (the PCI engine's PciState.resistance: about 0.6 for heavy
//               untreated calcium, lowered by scoring, cutting and lithotripsy)
//   atm         the pressure in the balloon
//   holdS       seconds the pressure has been held at its target
//   calcium     the angiographic calcium grade (0 none, 1 moderate, 2 severe)
//
// Above an onset pressure each atmosphere overcomes a share of the resistance
// (the engine's earlier formula, kept exactly so an instant inflation gives
// the same result as before); a held inflation overcomes a little more, less
// so the heavier the calcium, because Brilakis's first step for an
// undilatable lesion is prolonged inflation (30-60 s or more) before plaque
// modification (module pm-prep-and-stent, lesson 'Balloon angioplasty II':
// 'First step of the undilatable algorithm'). Every coefficient is a MODEL
// PARAMETER (docs/realism/facts/pkg-pci-indeflator.md): the module gives the
// clinical sequence, not the mechanics.
// ---------------------------------------------------------------------------

/** Pressure above which a balloon starts to overcome the lesion (atm) — MODEL PARAMETER (the engine's earlier value). */
export const MP_YIELD_ONSET_ATM = 6;
/** Atmospheres above the onset that overcome the whole resistance (atm) — MODEL PARAMETER (the engine's earlier value). */
export const MP_YIELD_SPAN_ATM = 20;
/** Most of the remaining resistance a long hold overcomes (fraction) — MODEL PARAMETER. */
export const MP_HOLD_GAIN = 0.15;
/** Hold at which the hold's gain is complete (s): the start of the module's 30-60 s prolonged inflation — MODEL PARAMETER. */
export const MP_HOLD_FULL_S = 30;
/** Share of the hold's gain each calcium grade takes away (calcium does not creep) — MODEL PARAMETER. */
export const MP_HOLD_CALCIUM_DAMP = 0.25;
/**
 * A balloon or stent keeps a waist when it reaches less than this fraction of the diameter its chart
 * gives at that pressure — MODEL PARAMETER (the engine's earlier criterion, which base.ts's
 * STENT_UNDEREXPANDED_RATIO mirrors).
 */
export const MP_WAIST_RATIO = 0.85;

export interface YieldInput {
  /** 0 (none) .. 1 */
  resistance: number;
  /** pressure in the balloon (atm) */
  atm: number;
  /** seconds held at the target (default 0: an instant inflation) */
  holdS?: number;
  /** angiographic calcium grade (default 0) */
  calcium?: 0 | 1 | 2;
  /** onset pressure (atm; default MP_YIELD_ONSET_ATM; a post-dilatation inside a stent starts later) */
  onsetAtm?: number;
}

/** Share of the resistance still acting at this pressure (1 at or below the onset, 0 once fully overcome). */
export function pressureFactor(atm: number, onsetAtm = MP_YIELD_ONSET_ATM): number {
  return Math.max(0, 1 - Math.max(0, atm - onsetAtm) / MP_YIELD_SPAN_ATM);
}

/** Share of the resistance still acting after a hold of `holdS` seconds (1 for an instant inflation). */
export function holdFactor(holdS = 0, calcium: 0 | 1 | 2 = 0): number {
  const gain = MP_HOLD_GAIN * Math.max(0, 1 - MP_HOLD_CALCIUM_DAMP * calcium);
  return 1 - gain * Math.min(1, Math.max(0, holdS) / MP_HOLD_FULL_S);
}

/**
 * Fraction (0..1) of the device's chart diameter the lesion lets it reach: 1 - resistance x pressure
 * factor x hold factor. With holdS 0 it is the engine's earlier formula exactly.
 */
export function lesionYield(i: YieldInput): number {
  const r = Math.max(0, Math.min(1, i.resistance));
  return Math.max(0, Math.min(1, 1 - r * pressureFactor(i.atm, i.onsetAtm) * holdFactor(i.holdS ?? 0, i.calcium ?? 0)));
}

/** The diameter the device reaches at the lesion (the waist), in mm, for a device whose chart gives `deviceMm` at that pressure. */
export function waistDiameter(deviceMm: number, i: YieldInput): number {
  return deviceMm * lesionYield(i);
}

/** Does the device keep a waist at the lesion? */
export function hasWaist(i: YieldInput): boolean {
  return lesionYield(i) < MP_WAIST_RATIO;
}
