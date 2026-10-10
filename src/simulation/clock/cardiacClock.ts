// ---------------------------------------------------------------------------
// One patient clock for everything that beats or breathes: the X-ray image
// (cardiac motion, contrast transit), the ECG, pressures, audio and the mentor
// timeline all read the same CardiacClock, so a QRS on the monitor, the
// systolic jump of the coronaries on fluoroscopy and the beep are the same beat.
//
// Model notes (parameters, not measured values):
// - End of ejection is placed at the end of the QT interval, scaled with the RR
//   interval by Bazett's square-root relation (QT = QTc·√RR, with QTc a
//   per-patient parameter, default 0.40 s). Systole therefore shortens less
//   than diastole as the heart rate rises, and diastasis disappears at high rates.
// - Sinus arrhythmia: a small respiratory modulation of the RR interval
//   (parameter, default ±3% of RR).
// - Respiration: free breathing as a smooth cycle; breath-hold ramps to a held
//   inspiration level (cine acquisitions are taken in held inspiration).
// ---------------------------------------------------------------------------

export type RhythmKind = "sinus" | "af" | "paced" | "vt" | "vf" | "asystole";

export interface ClockOptions {
  /** baseline heart rate (bpm) */
  hr?: number;
  /** corrected QT parameter (s) used to place end-systole */
  qtc?: number;
  /** breaths per minute in free breathing */
  respRate?: number;
  /** tidal excursion as a fraction of a full inspiration (0..1) */
  tidal?: number;
  /** respiratory RR modulation, fraction of RR */
  sinusArrhythmia?: number;
  /** seed for beat-to-beat irregularity (AF) */
  seed?: number;
}

export interface ClockState {
  /** patient time (s) */
  t: number;
  /** instantaneous heart rate (bpm) = 60 / rr */
  hr: number;
  /** index of the current beat (increments at each R wave) */
  beat: number;
  /** seconds since the current R wave */
  tInBeat: number;
  /** current RR interval (s) */
  rr: number;
  /** tInBeat / rr, 0..1 */
  phase: number;
  /** seconds after R at which ejection ends (end-systole) */
  endSystole: number;
  /** true between R and end-systole */
  systole: boolean;
  /** 0 end-expiration … 1 full inspiration */
  resp: number;
  /** true while a breath is held */
  breathHold: boolean;
  rhythm: RhythmKind;
}

export interface BeatEvent {
  /** patient time of the R wave */
  t: number;
  beat: number;
  rr: number;
}

/** Small deterministic generator (mulberry32). */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class CardiacClock {
  private opts: Required<ClockOptions>;
  private t = 0;
  private beat = 0;
  private tR = 0; // time of the current R wave
  private rr: number;
  private hrTarget: number;
  private respPhase = 0; // radians
  private holdLevel: number | null = null;
  private resp = 0;
  private rhythm: RhythmKind = "sinus";
  private rnd: () => number;
  private events: BeatEvent[] = [];

  constructor(o: ClockOptions = {}) {
    this.opts = {
      hr: o.hr ?? 72,
      qtc: o.qtc ?? 0.4,
      respRate: o.respRate ?? 14,
      tidal: o.tidal ?? 0.22,
      sinusArrhythmia: o.sinusArrhythmia ?? 0.03,
      seed: o.seed ?? 1,
    };
    this.hrTarget = this.opts.hr;
    this.rr = 60 / this.opts.hr;
    this.rnd = prng(this.opts.seed);
  }

  setHeartRate(bpm: number) {
    this.hrTarget = Math.max(20, Math.min(220, bpm));
  }

  setRhythm(kind: RhythmKind) {
    this.rhythm = kind;
  }

  /** Hold the breath at an inspiration level (0..1), or null to breathe freely. */
  holdBreath(level: number | null) {
    this.holdLevel = level;
  }

  /** Advance patient time by dt seconds. */
  advance(dt: number) {
    if (!(dt > 0)) return;
    // sub-step so R waves are not skipped at large dt
    let left = dt;
    while (left > 1e-9) {
      const h = Math.min(left, 0.02);
      this.step(h);
      left -= h;
    }
  }

  private step(h: number) {
    this.t += h;
    // respiration: free cycle or a ramp to/from the held level (time constant ~0.8 s)
    if (this.holdLevel === null) {
      this.respPhase += (2 * Math.PI * this.opts.respRate * h) / 60;
      const free = this.opts.tidal * (0.5 - 0.5 * Math.cos(this.respPhase));
      this.resp += (free - this.resp) * Math.min(1, h / 0.8);
    } else {
      this.resp += (this.holdLevel - this.resp) * Math.min(1, h / 0.8);
    }
    if (this.rhythm === "asystole" || this.rhythm === "vf") return;
    if (this.t - this.tR >= this.rr) {
      this.tR += this.rr;
      this.beat++;
      this.rr = this.nextRR();
      this.events.push({ t: this.tR, beat: this.beat, rr: this.rr });
      if (this.events.length > 64) this.events.shift();
    }
  }

  private nextRR(): number {
    const base = 60 / this.hrTarget;
    if (this.rhythm === "af") return base * (0.65 + 0.7 * this.rnd());
    const sa = this.rhythm === "sinus" ? this.opts.sinusArrhythmia * Math.sin(this.respPhase) : 0;
    return base * (1 - sa);
  }

  /** R waves since the last call (for ECG, audio beeps and gating). */
  drainBeats(): BeatEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  /** End-systole after the R wave for a given RR (Bazett-scaled QT). */
  endSystoleFor(rr: number): number {
    return Math.min(0.9 * rr, this.opts.qtc * Math.sqrt(rr));
  }

  state(): ClockState {
    const tInBeat = Math.max(0, this.t - this.tR);
    const endSystole = this.endSystoleFor(this.rr);
    return {
      t: this.t,
      hr: 60 / this.rr,
      beat: this.beat,
      tInBeat,
      rr: this.rr,
      phase: Math.min(1, tInBeat / this.rr),
      endSystole,
      systole: tInBeat < endSystole,
      resp: this.resp,
      breathHold: this.holdLevel !== null,
      rhythm: this.rhythm,
    };
  }

  snapshot() {
    return { t: this.t, beat: this.beat, tR: this.tR, rr: this.rr, hrTarget: this.hrTarget, respPhase: this.respPhase, holdLevel: this.holdLevel, resp: this.resp, rhythm: this.rhythm };
  }

  restore(s: ReturnType<CardiacClock["snapshot"]>) {
    Object.assign(this, s);
  }
}
