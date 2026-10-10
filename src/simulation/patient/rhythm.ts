// ---------------------------------------------------------------------------
// Rhythm state and arrest management.
//
// The base rhythm (sinus, AF, VT, VF, asystole, accelerated idioventricular),
// AV conduction (first-degree, 2:1, complete block) and the defibrillator and
// CPR sequence. VF never resolves by itself: it needs charge, clear and shock.
// Shock success falls with the time spent in VF; the decline uses the sourced
// figure that each minute without defibrillation lowers survival by about
// 7-10% (Front Pharmacol 2019, facts S9 §arrest), applied to the probability
// that a shock restores an organised rhythm (a MODEL use of a survival figure).
// CPR slows the decline (MODEL PARAMETER). Post-shock myocardial stunning grows
// with VF duration (MODEL PARAMETER).
//
// diag-rhythm-haemodynamic-events adds, inert unless something starts them:
// a supraventricular tachycardia ("svt": a regular narrow-complex rhythm
// without visible P waves), atrial fibrillation started during the case at a
// set ventricular rate (startAf), and sustained VT (startVt with no end, as
// before). Nothing here starts them by itself: the engine's injection hazard
// model and the scenarios do.
// ---------------------------------------------------------------------------

import type { SeededRng } from "./rng";

export type BaseRhythm = "sinus" | "af" | "vt" | "vf" | "asystole" | "aivr" | "paced" | "svt";

export interface DefibState {
  /** stored energy, J (0 = not charged) */
  charged: number;
  /** energy being charged and when it will be ready (patient clock s) */
  charging: { joules: number; readyAt: number } | null;
  /** "stand clear" called since the last charge */
  cleared: boolean;
  shocks: number;
  lastShockT: number | null;
}

export interface RhythmState {
  base: BaseRhythm;
  /** AV conduction: 0 normal, 1 first degree, 2 2:1, 3 complete block */
  av: 0 | 1 | 2 | 3;
  /** patient time when a transient AV block ends (null = persistent until changed) */
  avUntil: number | null;
  /** onset of the current VF or asystole (patient clock s) */
  arrestOnset: number | null;
  /** seconds of arrest with CPR running */
  cprSeconds: number;
  /** seconds of arrest without CPR */
  noFlowSeconds: number;
  cpr: boolean;
  /** VT, AIVR or SVT rate, bpm */
  ventricularRate: number;
  /**
   * The ventricular rate of atrial fibrillation started during the case (startAf), bpm; null or absent:
   * the engine's own AF rate (the sinus model's rate, as before). Optional for older snapshots.
   */
  afRate?: number | null;
  /** AIVR or transient rhythm end (patient clock s) */
  transientUntil: number | null;
  /** the rhythm to return to after a transient (AF patients return to AF) */
  underlying: "sinus" | "af";
  /** post-arrest stunning 0..1 (contractility deficit), decays */
  stunning: number;
  defib: DefibState;
  /** ventricular ectopy pending (the engine fires it as a premature beat) */
  ectopicPending: boolean;
}

/** MODEL PARAMETERS for the arrest sequence */
export const MP_DEFIB = {
  chargeTimeS: 5,
  /** probability that a shock at ≥ 150 J terminates VF within the first minute */
  successAtOnset: 0.95,
  /** relative decline per minute without CPR (from the 7-10% survival figure; mid value) */
  declinePerMinNoCpr: 0.085,
  /** relative decline per minute with CPR (MODEL) */
  declinePerMinCpr: 0.035,
  /** energy at which success is not energy-limited, J */
  fullEnergyJ: 150,
  /** chance that a shock delivered onto an organised rhythm induces VF (unsynchronised, MODEL) */
  rOnTRisk: 0.1,
  /** stunning after defibrillation: base and per minute of arrest (MODEL) */
  stunBase: 0.08,
  stunPerMin: 0.1,
  stunRecoveryTauS: 300,
  /** probability that a failed shock after a long arrest leaves asystole (MODEL) */
  asystoleAfterFailPerMin: 0.06,
};

export type ShockOutcome = "not-charged" | "converted" | "still-vf" | "asystole" | "induced-vf" | "no-change";

export class Rhythm {
  st: RhythmState;
  constructor(underlying: "sinus" | "af") {
    this.st = {
      base: underlying,
      av: 0,
      avUntil: null,
      arrestOnset: null,
      cprSeconds: 0,
      noFlowSeconds: 0,
      cpr: false,
      ventricularRate: 170,
      transientUntil: null,
      underlying,
      stunning: 0,
      defib: { charged: 0, charging: null, cleared: false, shocks: 0, lastShockT: null },
      ectopicPending: false,
    };
  }

  get arrested(): boolean {
    return this.st.base === "vf" || this.st.base === "asystole";
  }

  /** Start VF (conus injection, ischaemia, R-on-T, ...). */
  startVf(t: number): void {
    if (this.st.base === "vf") return;
    this.st.base = "vf";
    this.st.arrestOnset = t;
    this.st.cprSeconds = 0;
    this.st.noFlowSeconds = 0;
    this.st.transientUntil = null;
  }

  startVt(t: number, rate: number, durationS: number | null): void {
    if (this.arrested) return;
    this.st.base = "vt";
    this.st.ventricularRate = rate;
    this.st.transientUntil = durationS === null ? null : t + durationS;
  }

  /**
   * Atrial fibrillation from now (diag-rhythm-haemodynamic-events), at this ventricular rate (null: the
   * engine's own AF rate). An arrest is not interrupted. The underlying rhythm is unchanged, so a
   * cardioversion or a reversion returns to it.
   */
  startAf(t: number, rate: number | null = null): void {
    if (this.arrested) return;
    this.st.base = "af";
    this.st.afRate = rate !== null && rate > 0 ? rate : null;
    this.st.transientUntil = null;
    void t;
  }

  /** A supraventricular tachycardia at this rate, ending after durationS (null: sustained). */
  startSvt(t: number, rate: number, durationS: number | null): void {
    if (this.arrested || this.st.base === "vt") return;
    this.st.base = "svt";
    this.st.ventricularRate = rate;
    this.st.transientUntil = durationS === null ? null : t + durationS;
  }

  /** Back to the underlying rhythm (a terminated SVT or VT, a reverted AF). */
  revert(): void {
    if (this.arrested) return;
    this.st.base = this.st.underlying;
    this.st.transientUntil = null;
    this.st.afRate = null;
  }

  startAivr(t: number, rate: number, durationS: number): void {
    if (this.arrested || this.st.base === "vt") return;
    this.st.base = "aivr";
    this.st.ventricularRate = rate;
    this.st.transientUntil = t + durationS;
  }

  setAv(level: 0 | 1 | 2 | 3, until: number | null): void {
    this.st.av = level;
    this.st.avUntil = until;
  }

  setCpr(on: boolean): void {
    this.st.cpr = on;
  }

  charge(t: number, joules: number): void {
    this.st.defib.charging = { joules, readyAt: t + MP_DEFIB.chargeTimeS };
    this.st.defib.cleared = false;
  }

  clear(): void {
    this.st.defib.cleared = true;
  }

  disarm(): void {
    this.st.defib.charged = 0;
    this.st.defib.charging = null;
  }

  /** Deliver the stored energy. */
  shock(t: number, rng: SeededRng): { outcome: ShockOutcome; joules: number; cleared: boolean; arrestS: number } {
    const d = this.st.defib;
    const joules = d.charged;
    const cleared = d.cleared;
    if (joules <= 0) return { outcome: "not-charged", joules: 0, cleared, arrestS: 0 };
    d.charged = 0;
    d.cleared = false;
    d.shocks++;
    d.lastShockT = t;
    const arrestS = this.st.arrestOnset !== null ? t - this.st.arrestOnset : 0;
    if (this.st.base === "vf" || (this.st.base === "vt" && this.st.ventricularRate > 200)) {
      const p = this.shockSuccessProbability(joules);
      if (rng.chance(p)) {
        const mins = arrestS / 60;
        this.st.stunning = Math.min(0.75, Math.max(this.st.stunning, MP_DEFIB.stunBase + MP_DEFIB.stunPerMin * mins));
        this.st.base = this.st.underlying;
        this.st.arrestOnset = null;
        this.st.cpr = false;
        return { outcome: "converted", joules, cleared, arrestS };
      }
      if (rng.chance(Math.min(0.6, MP_DEFIB.asystoleAfterFailPerMin * (arrestS / 60)))) {
        this.st.base = "asystole";
        return { outcome: "asystole", joules, cleared, arrestS };
      }
      return { outcome: "still-vf", joules, cleared, arrestS };
    }
    if (this.st.base === "vt") {
      // VT with a pulse would be cardioverted synchronised; an unsynchronised shock still usually converts
      this.st.base = this.st.underlying;
      this.st.transientUntil = null;
      return { outcome: "converted", joules, cleared, arrestS };
    }
    if (this.st.base !== "asystole" && rng.chance(MP_DEFIB.rOnTRisk)) {
      this.startVf(t);
      return { outcome: "induced-vf", joules, cleared, arrestS };
    }
    return { outcome: "no-change", joules, cleared, arrestS };
  }

  /** Probability that a shock of this energy terminates VF now. */
  shockSuccessProbability(joules: number): number {
    const noFlowMin = this.st.noFlowSeconds / 60;
    const cprMin = this.st.cprSeconds / 60;
    const e = Math.min(1, Math.sqrt(joules / MP_DEFIB.fullEnergyJ));
    return MP_DEFIB.successAtOnset * e * Math.pow(1 - MP_DEFIB.declinePerMinNoCpr, noFlowMin) * Math.pow(1 - MP_DEFIB.declinePerMinCpr, cprMin);
  }

  /** Slow tick: timers, charging, transient rhythms, stunning recovery. */
  tick(t: number, dt: number): void {
    const s = this.st;
    const d = s.defib;
    if (d.charging && t >= d.charging.readyAt) {
      d.charged = d.charging.joules;
      d.charging = null;
    }
    if (this.arrested) {
      if (s.cpr) s.cprSeconds += dt;
      else s.noFlowSeconds += dt;
    }
    if (s.transientUntil !== null && t >= s.transientUntil && (s.base === "vt" || s.base === "aivr" || s.base === "svt")) {
      s.base = s.underlying;
      s.transientUntil = null;
    }
    if (s.avUntil !== null && t >= s.avUntil) {
      s.av = 0;
      s.avUntil = null;
    }
    s.stunning *= Math.exp(-dt / MP_DEFIB.stunRecoveryTauS);
  }

  /** Display label for the monitor. */
  label(hr: number, vagalPause: boolean): string {
    const s = this.st;
    switch (s.base) {
      case "vf":
        return "Ventricular fibrillation";
      case "asystole":
        return "Asystole";
      case "vt":
        return "Ventricular tachycardia";
      case "aivr":
        return "Accelerated idioventricular rhythm";
      case "paced":
        return "Paced rhythm";
      case "svt":
        return "Narrow-complex tachycardia";
      case "af":
        return s.av === 3 ? "Atrial fibrillation with complete heart block" : hr > 110 ? "Atrial fibrillation, fast ventricular rate" : "Atrial fibrillation";
      default:
        if (s.av === 3) return "Complete heart block";
        if (s.av === 2) return "Second-degree AV block, 2:1";
        if (vagalPause) return "Sinus pause";
        if (hr < 50) return s.av === 1 ? "Sinus bradycardia, first-degree AV block" : "Sinus bradycardia";
        if (hr > 100) return "Sinus tachycardia";
        return s.av === 1 ? "Sinus rhythm, first-degree AV block" : "Sinus rhythm";
    }
  }

  snapshot(): RhythmState {
    return JSON.parse(JSON.stringify(this.st));
  }
  restore(s: RhythmState): void {
    this.st = JSON.parse(JSON.stringify(s));
  }
}
