// ---------------------------------------------------------------------------
// Intra-aortic balloon pump (counterpulsation) model.
//
// One cardiac cycle runs phase 0 → 1, starting at the onset of LV ejection.
// The aortic valve closes at the dicrotic notch (NOTCH). Balloon inflation in
// diastole augments diastolic pressure (coronary perfusion); deflation just
// before the next systole drops end-diastolic pressure so the next beat ejects
// against a lower afterload. Timing is expressed in cycle phase:
//   inflate: phase of inflation (correct ≈ the notch)
//   deflate: phase of deflation (correct ≈ just before 1.0, end-diastole;
//            values > 1 mean the balloon is still up into the next systole)
// The model reproduces the four classic timing errors and their waveforms.
// ---------------------------------------------------------------------------

export const NOTCH = 0.36; // aortic valve closure, fraction of the cycle

export interface IabpSettings {
  /** inflation timing (cycle phase) */
  inflate: number;
  /** deflation timing (cycle phase; may exceed 1) */
  deflate: number;
  /** assist ratio: 1 = every beat, 2 = every other beat, 3 = every third */
  ratio: 1 | 2 | 3;
  /** balloon augmentation 0..1 (volume / effectiveness) */
  augmentation: number;
}

export interface Haemo {
  systolic: number;
  diastolic: number;
  hr: number;
}

export type TimingError = "early-inflation" | "late-inflation" | "early-deflation" | "late-deflation";

export const CORRECT_TIMING: IabpSettings = { inflate: NOTCH, deflate: 0.97, ratio: 1, augmentation: 1 };

/** Unassisted aortic pressure, normalised 0..1 (diastolic → systolic). */
export function aorticShape(p: number): number {
  const q = ((p % 1) + 1) % 1;
  if (q < 0.1) return q / 0.1; // upstroke
  if (q < 0.3) return 1 - (q - 0.1) * 0.85; // ejection, falling
  if (q < NOTCH) return 0.83 - ((q - 0.3) / (NOTCH - 0.3)) * 0.25; // to the notch
  if (q < NOTCH + 0.05) return 0.58 + ((q - NOTCH) / 0.05) * 0.08; // dicrotic wave
  return 0.66 * Math.exp(-(q - NOTCH - 0.05) * 1.9) + 0.0; // diastolic runoff
}

/**
 * Pressure at a phase within a given beat (beat index matters for 1:2 / 1:3).
 * Returns { p, assisted } — p in mmHg.
 */
export function iabpPressure(phase: number, beat: number, s: IabpSettings, h: Haemo): { p: number; assisted: boolean } {
  const pulse = h.systolic - h.diastolic;
  const base = h.diastolic + pulse * aorticShape(phase);
  const assistedBeat = beat % s.ratio === 0;
  const prevAssisted = (beat - 1 + s.ratio * 10) % s.ratio === 0;
  const aug = s.augmentation;

  // Afterload reduction: if the PREVIOUS beat's balloon deflated correctly,
  // this beat's systole starts from a lower end-diastolic pressure and peaks lower.
  let p = base;
  const earlyPart = phase < 0.3;
  if (prevAssisted && earlyPart) {
    const deflateWell = s.deflate >= 0.88 && s.deflate <= 1.0;
    const lateDeflate = s.deflate > 1.0;
    if (deflateWell) p -= pulse * 0.12 * aug * (1 - phase / 0.3);
    if (lateDeflate) {
      // balloon still inflated as the ventricle starts to eject → raised afterload
      const overlap = Math.min(0.12, s.deflate - 1);
      if (phase < overlap) p = Math.max(p, h.diastolic + pulse * (0.9 + 0.3 * aug));
      p += pulse * 0.06 * aug * (1 - phase / 0.3);
    }
  }

  if (!assistedBeat) return { p, assisted: false };

  // Inflation segment of this beat
  const inflateAt = s.inflate;
  const deflateAt = Math.min(s.deflate, 1.0);
  if (phase >= inflateAt && phase <= deflateAt) {
    const t = phase - inflateAt;
    const augPeak = h.systolic + pulse * 0.15 * aug; // augmented diastolic peak
    const rise = Math.min(1, t / 0.035);
    const decay = Math.exp(-t * 1.1);
    const augP = h.diastolic + (augPeak - h.diastolic) * rise * (0.75 + 0.25 * decay);
    // Early inflation truncates ejection: the systolic tail is replaced by the balloon.
    p = Math.max(p * (phase < NOTCH ? 0.97 : 1), augP);
  } else if (phase > deflateAt && phase < 1.0 && s.deflate < 1.0) {
    // After (early) deflation: pressure dips then recovers toward baseline runoff.
    const since = phase - deflateAt;
    const dip = pulse * 0.22 * aug * Math.exp(-since * 9);
    p = base - dip;
  }
  return { p, assisted: true };
}

/** Classify the current timing against the textbook targets. */
export function timingErrors(s: IabpSettings): TimingError[] {
  const errs: TimingError[] = [];
  if (s.inflate < NOTCH - 0.025) errs.push("early-inflation");
  if (s.inflate > NOTCH + 0.04) errs.push("late-inflation");
  if (s.deflate < 0.88) errs.push("early-deflation");
  if (s.deflate > 1.0) errs.push("late-deflation");
  return errs;
}

export const TIMING_TEACH: Record<TimingError, { label: string; look: string; harm: string }> = {
  "early-inflation": {
    label: "Early inflation",
    look: "Balloon inflates before the dicrotic notch; the augmentation rises out of the systolic downslope and the notch disappears.",
    harm: "Premature aortic valve closure — reduced stroke volume, raised LV volumes and afterload, possible aortic regurgitation.",
  },
  "late-inflation": {
    label: "Late inflation",
    look: "The dicrotic notch is clearly visible before the augmentation begins; the diastolic peak is lower and later.",
    harm: "Suboptimal diastolic augmentation — less coronary perfusion benefit.",
  },
  "early-deflation": {
    label: "Early deflation",
    look: "Augmentation falls away sharply in mid-diastole (U-shaped dip) and pressure recovers before the next beat; assisted end-diastolic pressure ≈ unassisted.",
    harm: "Short augmentation and no afterload reduction; possible retrograde coronary/carotid flow during the dip.",
  },
  "late-deflation": {
    label: "Late deflation",
    look: "Assisted end-diastolic pressure is equal to or higher than unassisted; the augmentation runs into the next systole with a widened, slow upstroke.",
    harm: "The ventricle ejects against an inflated balloon — increased afterload and myocardial oxygen demand. The most harmful error.",
  },
};

/** Summary metrics over one assisted + one unassisted beat (for the console). */
export function iabpMetrics(s: IabpSettings, h: Haemo) {
  const N = 200;
  let unassistedSys = -Infinity,
    augDiastolic = -Infinity,
    assistedSys = -Infinity;
  let unassistedEdp = 0,
    assistedEdp = 0;
  // beat 1 unassisted (if ratio > 1) — use a reference unassisted beat computed with ratio forced high
  const ref = { ...s, ratio: 3 as const };
  for (let i = 0; i < N; i++) {
    const ph = i / N;
    const u = iabpPressure(ph, 2, ref, h).p; // beat 2: neither it nor the previous beat is assisted at 1:3
    unassistedSys = Math.max(unassistedSys, u);
    if (i === N - 1) unassistedEdp = u;
    const a = iabpPressure(ph, 0, s, h).p;
    if (ph >= s.inflate) augDiastolic = Math.max(augDiastolic, a);
    if (i === N - 1) assistedEdp = a;
    const next = iabpPressure(ph, 1, { ...s, ratio: 1 }, h).p; // systole after an assisted beat
    if (ph < 0.3) assistedSys = Math.max(assistedSys, next);
  }
  return {
    unassistedSys: Math.round(unassistedSys),
    assistedSys: Math.round(assistedSys),
    augDiastolic: Math.round(augDiastolic),
    unassistedEdp: Math.round(unassistedEdp),
    assistedEdp: Math.round(assistedEdp),
    /** good counterpulsation: augmented diastolic > unassisted systolic and assisted EDP < unassisted EDP */
    effective: augDiastolic > unassistedSys && assistedEdp < unassistedEdp,
  };
}
