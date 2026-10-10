// ---------------------------------------------------------------------------
// Synthesised lab sounds.
//
// Sourced shapes (docs/realism/facts/C4.md):
// - Alarm pulses: harmonic complexes of five equally weighted harmonics,
//   high priority 440 Hz fundamental, 50 ms pulses, 5 ms rise and fall, a
//   burst of two five-pulse blocks 190 ms apart lasting 1,110 ms; medium
//   priority 220 Hz fundamental, 155 ms pulses, 10 ms rise and fall, a burst
//   lasting 595 ms (C4-F3, the IEC 60601-1-8:2020 pointers as reproduced in
//   PLOS One 2023). Even pulse spacing inside a block and three medium pulses
//   are model choices that fit those totals.
// - Pulse tone: a short beep whose pitch rises with SpO2 on a logarithmic scale
//   (C4-F2); see monitorTone.ts for the mapping.
// - Five-minute screening signal: sounds until reset, at least 2 s when reset
//   automatically; a continuous signal while high-level fluoroscopy is in use
//   (C4-F4, 21 CFR 1020.32).
// Every other frequency, duration and level here is a MODEL PARAMETER chosen
// to sound plausible; they are named in SOUND_PARAMS.
// ---------------------------------------------------------------------------

import type { AudioEngine, Channel } from "./engine";

export const SOUND_PARAMS = {
  beep: { durS: 0.12, attackS: 0.004, releaseS: 0.03, gain: 0.5, h2: 0.25, h3: 0.1 },
  exposure: { fluoroHz: 990, cineHz: 1320, gain: 0.12, rampS: 0.006, cineClickGain: 0.25, highHz: 1480 },
  fiveMin: { hz: 1760, onS: 0.4, offS: 0.4, gain: 0.25, autoResetMinS: 2 },
  syringe: { baseHz: 700, hzPerPsi: 25, gainPerFlow: 0.09, squeakHz: 1850, squeakGain: 0.05 },
  injector: { baseHz: 70, hzPerMlS: 18, gain: 0.08 },
  indeflator: { clicksPerAtm: 3, clickGain: 0.35, maxClicksPerS: 25 },
  defib: { chargeFromHz: 700, chargeToHz: 2600, chargeGain: 0.08, readyHz: 2000, readyEveryS: 0.6 },
} as const;

export const ALARM_PATTERNS = {
  /** sourced: two blocks of five 50 ms pulses, 190 ms between blocks, 1,110 ms in all (C4-F3) */
  high: { f0: 440, pulseS: 0.05, edgeS: 0.005, blocks: 2, pulsesPerBlock: 5, blockGapS: 0.19, totalS: 1.11 },
  /** sourced: 155 ms pulses, 595 ms burst; three pulses is the model choice that fits (C4-F3) */
  medium: { f0: 220, pulseS: 0.155, edgeS: 0.01, blocks: 1, pulsesPerBlock: 3, blockGapS: 0, totalS: 0.595 },
  /** model: one medium-type pulse */
  low: { f0: 220, pulseS: 0.155, edgeS: 0.01, blocks: 1, pulsesPerBlock: 1, blockGapS: 0, totalS: 0.155 },
} as const;

export type AlarmPriority = keyof typeof ALARM_PATTERNS;

/** Onset times (s, from the burst start) of every pulse in a burst. */
export function burstOnsets(p: AlarmPriority): number[] {
  const a = ALARM_PATTERNS[p];
  const blockS = a.blocks > 1 ? (a.totalS - (a.blocks - 1) * a.blockGapS) / a.blocks : a.totalS;
  const gap = a.pulsesPerBlock > 1 ? (blockS - a.pulsesPerBlock * a.pulseS) / (a.pulsesPerBlock - 1) : 0;
  const out: number[] = [];
  for (let b = 0; b < a.blocks; b++) {
    const b0 = b * (blockS + a.blockGapS);
    for (let k = 0; k < a.pulsesPerBlock; k++) out.push(b0 + k * (a.pulseS + gap));
  }
  return out;
}

export interface Voice {
  /** scheduled start (context time) */
  readonly start: number;
  /** silence it now (also before it has started) */
  cancel(): void;
}

const waveCache = new WeakMap<BaseAudioContext, Map<string, PeriodicWave>>();

/** Equal-weight harmonic series 1..n (the alarm pulses' spectrum). */
export function harmonicWave(ctx: BaseAudioContext, n: number, weights?: number[]): PeriodicWave {
  let m = waveCache.get(ctx);
  if (!m) waveCache.set(ctx, (m = new Map()));
  const key = `${n}:${weights?.join(",") ?? "eq"}`;
  let w = m.get(key);
  if (!w) {
    const real = new Float32Array(n + 1);
    const imag = new Float32Array(n + 1);
    for (let k = 1; k <= n; k++) imag[k] = weights ? (weights[k - 1] ?? 0) : 1;
    w = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    m.set(key, w);
  }
  return w;
}

/** One enveloped tone. */
export function tone(
  engine: AudioEngine,
  ch: Channel,
  o: { when: number; hz: number; durS: number; gain: number; attackS?: number; releaseS?: number; type?: OscillatorType; wave?: PeriodicWave; endHz?: number }
): Voice | null {
  const ctx = engine.ctx;
  const dest = engine.bus(ch);
  if (!ctx || !dest) return null;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  if (o.wave) osc.setPeriodicWave(o.wave);
  else osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.hz, o.when);
  if (o.endHz) osc.frequency.linearRampToValueAtTime(o.endHz, o.when + o.durS);
  const a = Math.min(o.attackS ?? 0.005, o.durS / 2);
  const r = Math.min(o.releaseS ?? 0.01, o.durS / 2);
  g.gain.setValueAtTime(0, o.when);
  g.gain.linearRampToValueAtTime(o.gain, o.when + a);
  g.gain.setValueAtTime(o.gain, o.when + o.durS - r);
  g.gain.linearRampToValueAtTime(0, o.when + o.durS);
  osc.connect(g);
  g.connect(dest);
  osc.start(o.when);
  osc.stop(o.when + o.durS + 0.02);
  osc.onended = () => {
    try {
      g.disconnect();
    } catch {
      /* already gone */
    }
  };
  let cancelled = false;
  return {
    start: o.when,
    cancel() {
      if (cancelled) return;
      cancelled = true;
      try {
        g.gain.cancelScheduledValues(0);
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.disconnect();
      } catch {
        /* nothing to stop */
      }
    },
  };
}

/** A burst of filtered noise (clicks, thumps, hiss). */
export function noiseBurst(engine: AudioEngine, ch: Channel, o: { when: number; durS: number; gain: number; hz: number; q?: number; type?: BiquadFilterType; endHz?: number; decay?: boolean }): Voice | null {
  const ctx = engine.ctx;
  const dest = engine.bus(ch);
  const buf = engine.noiseBuffer();
  if (!ctx || !dest || !buf) return null;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = o.type ?? "bandpass";
  f.frequency.setValueAtTime(o.hz, o.when);
  if (o.endHz) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.endHz), o.when + o.durS);
  f.Q.value = o.q ?? 4;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, o.when);
  g.gain.linearRampToValueAtTime(o.gain, o.when + 0.001);
  if (o.decay === false) {
    g.gain.setValueAtTime(o.gain, o.when + o.durS * 0.8);
    g.gain.linearRampToValueAtTime(0, o.when + o.durS);
  } else g.gain.exponentialRampToValueAtTime(0.0005, o.when + o.durS);
  src.connect(f);
  f.connect(g);
  g.connect(dest);
  const offset = (o.when * 7.31) % 0.9; // a different stretch of the noise each time
  src.start(o.when, offset, o.durS + 0.02);
  src.onended = () => {
    try {
      g.disconnect();
    } catch {
      /* already gone */
    }
  };
  return {
    start: o.when,
    cancel() {
      try {
        g.disconnect();
      } catch {
        /* already gone */
      }
    },
  };
}

/** The pulse-oximeter / QRS beep at a pitch. */
export function pulseBeep(engine: AudioEngine, when: number, hz: number): Voice | null {
  const b = SOUND_PARAMS.beep;
  const ctx = engine.ctx;
  if (!ctx) return null;
  return tone(engine, "monitor", { when, hz, durS: b.durS, gain: b.gain, attackS: b.attackS, releaseS: b.releaseS, wave: harmonicWave(ctx, 3, [1, b.h2, b.h3]) });
}

/** One alarm burst starting at `when`. Returns its voices (to cancel when the alarm clears). */
export function alarmBurst(engine: AudioEngine, when: number, p: AlarmPriority, gain = 0.45): Voice[] {
  const ctx = engine.ctx;
  if (!ctx) return [];
  const a = ALARM_PATTERNS[p];
  const wave = harmonicWave(ctx, 5);
  const out: Voice[] = [];
  for (const on of burstOnsets(p)) {
    const v = tone(engine, "alarms", { when: when + on, hz: a.f0, durS: a.pulseS, gain, attackS: a.edgeS, releaseS: a.edgeS, wave });
    if (v) out.push(v);
  }
  return out;
}

/** Short device clicks. */
export type ClickKind = "stopcock" | "valve" | "torquer" | "device" | "lock" | "relay";

export function click(engine: AudioEngine, kind: ClickKind, when = engine.now()): void {
  switch (kind) {
    case "stopcock":
      noiseBurst(engine, "devices", { when, durS: 0.025, gain: 0.5, hz: 3200, q: 6 });
      noiseBurst(engine, "devices", { when: when + 0.045, durS: 0.02, gain: 0.35, hz: 2600, q: 6 });
      return;
    case "valve":
      noiseBurst(engine, "devices", { when, durS: 0.06, gain: 0.25, hz: 1500, q: 3, endHz: 900 });
      return;
    case "torquer":
      tone(engine, "devices", { when, hz: 4100, durS: 0.03, gain: 0.15, attackS: 0.001, releaseS: 0.025 });
      noiseBurst(engine, "devices", { when, durS: 0.015, gain: 0.4, hz: 5000, q: 8 });
      return;
    case "lock":
      noiseBurst(engine, "devices", { when, durS: 0.03, gain: 0.55, hz: 2200, q: 5 });
      return;
    case "relay":
      noiseBurst(engine, "devices", { when, durS: 0.02, gain: 0.5, hz: 1200, q: 3 });
      return;
    case "device":
    default:
      noiseBurst(engine, "devices", { when, durS: 0.02, gain: 0.4, hz: 2200, q: 5 });
  }
}

// --- continuous sounds ----------------------------------------------------------------

/** A sustained oscillator whose level and pitch are steered, never restarted (no clicks). */
class Sustained {
  private osc: OscillatorNode | null = null;
  private g: GainNode | null = null;
  constructor(
    private engine: AudioEngine,
    private ch: Channel,
    private type: OscillatorType | "harmonic3" = "sine",
    private filterHz: number | null = null
  ) {}
  private ensure(): boolean {
    const ctx = this.engine.ctx;
    const dest = this.engine.bus(this.ch);
    if (!ctx || !dest) return false;
    if (this.osc) return true;
    this.osc = ctx.createOscillator();
    if (this.type === "harmonic3") this.osc.setPeriodicWave(harmonicWave(ctx, 3, [1, 0.3, 0.15]));
    else this.osc.type = this.type;
    this.g = ctx.createGain();
    this.g.gain.value = 0;
    if (this.filterHz) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = this.filterHz;
      this.osc.connect(f);
      f.connect(this.g);
    } else this.osc.connect(this.g);
    this.g.connect(dest);
    this.osc.start();
    return true;
  }
  /** Level (0 = off) with a short time constant; pitch with a glide. */
  set(gain: number, hz: number | null, tau = 0.006, glide = 0.05) {
    if (gain <= 0 && !this.osc) return;
    if (!this.ensure()) return;
    const t = this.engine.now();
    const g = this.g!.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(Math.max(0, gain), t, tau);
    if (hz !== null) {
      this.osc!.frequency.cancelScheduledValues(t);
      this.osc!.frequency.setTargetAtTime(hz, t, glide);
    }
  }
  /** Current target state (tests). */
  get node(): { osc: OscillatorNode | null; gain: GainNode | null } {
    return { osc: this.osc, gain: this.g };
  }
  dispose() {
    try {
      this.osc?.stop();
      this.g?.disconnect();
    } catch {
      /* already stopped */
    }
    this.osc = null;
    this.g = null;
  }
}

/** Noise through a band-pass, level and centre steered continuously. */
class SustainedNoise {
  private src: AudioBufferSourceNode | null = null;
  private f: BiquadFilterNode | null = null;
  private g: GainNode | null = null;
  constructor(
    private engine: AudioEngine,
    private ch: Channel,
    private q = 1.5
  ) {}
  private ensure(): boolean {
    const ctx = this.engine.ctx;
    const dest = this.engine.bus(this.ch);
    const buf = this.engine.noiseBuffer();
    if (!ctx || !dest || !buf) return false;
    if (this.src) return true;
    this.src = ctx.createBufferSource();
    this.src.buffer = buf;
    this.src.loop = true;
    this.f = ctx.createBiquadFilter();
    this.f.type = "bandpass";
    this.f.Q.value = this.q;
    this.g = ctx.createGain();
    this.g.gain.value = 0;
    this.src.connect(this.f);
    this.f.connect(this.g);
    this.g.connect(dest);
    this.src.start();
    return true;
  }
  set(gain: number, hz: number, tau = 0.03) {
    if (gain <= 0 && !this.src) return;
    if (!this.ensure()) return;
    const t = this.engine.now();
    this.g!.gain.cancelScheduledValues(t);
    this.g!.gain.setTargetAtTime(Math.max(0, gain), t, tau);
    this.f!.frequency.setTargetAtTime(hz, t, 0.05);
  }
  get gainNode(): GainNode | null {
    return this.g;
  }
  dispose() {
    try {
      this.src?.stop();
      this.g?.disconnect();
    } catch {
      /* already stopped */
    }
    this.src = null;
  }
}

export type ExposureMode = "off" | "fluoro" | "cine";

/**
 * The exposure tone while a pedal is emitting: a steady tone for fluoroscopy, a higher one for cine
 * with a soft click per acquired frame, and an added continuous tone during high-level fluoroscopy
 * (C4-F4). Releasing the pedal ramps the tone to silence with a 6 ms time constant at once.
 */
export class ExposureTone {
  private main: Sustained;
  private high: Sustained;
  mode: ExposureMode = "off";
  private highLevel = false;
  private pps = 15;
  private nextFrame = 0;
  constructor(private engine: AudioEngine) {
    this.main = new Sustained(engine, "xray", "harmonic3");
    this.high = new Sustained(engine, "xray", "sine");
  }
  set(mode: ExposureMode, o: { highLevel?: boolean; pps?: number } = {}) {
    const P = SOUND_PARAMS.exposure;
    const was = this.mode;
    this.mode = mode;
    this.highLevel = !!o.highLevel && mode === "fluoro";
    if (o.pps) this.pps = o.pps;
    if (mode === "off") {
      this.main.set(0, null, P.rampS);
      this.high.set(0, null, P.rampS);
      return;
    }
    this.main.set(P.gain, mode === "cine" ? P.cineHz : P.fluoroHz, P.rampS, 0.001);
    this.high.set(this.highLevel ? P.gain * 0.8 : 0, P.highHz, P.rampS, 0.001);
    if (mode === "cine" && was !== "cine") this.nextFrame = this.engine.now() + 0.01;
  }
  /** Per frame: schedule the cine frame clicks a little ahead. */
  frame(lookaheadS = 0.12) {
    if (this.mode !== "cine" || !this.engine.ctx) return;
    const now = this.engine.now();
    if (this.nextFrame < now) this.nextFrame = now + 0.005;
    const dt = 1 / Math.max(1, this.pps);
    while (this.nextFrame < now + lookaheadS) {
      noiseBurst(this.engine, "xray", { when: this.nextFrame, durS: 0.012, gain: SOUND_PARAMS.exposure.cineClickGain, hz: 2400, q: 2 });
      this.nextFrame += dt;
    }
  }
  /** Gain node of the main tone (tests). */
  get node() {
    return this.main.node;
  }
  dispose() {
    this.main.dispose();
    this.high.dispose();
  }
}

/** The five-minute screening signal: intermittent until reset (at least 2 s when reset automatically). */
export class FiveMinuteSignal {
  private tone: Sustained;
  private lfo: OscillatorNode | null = null;
  private startedAt: number | null = null;
  constructor(private engine: AudioEngine) {
    this.tone = new Sustained(engine, "xray", "square", 3000);
  }
  get sounding(): boolean {
    return this.startedAt !== null;
  }
  start() {
    const ctx = this.engine.ctx;
    if (!ctx || this.startedAt !== null) return;
    this.startedAt = this.engine.now();
    const P = SOUND_PARAMS.fiveMin;
    this.tone.set(P.gain * 0.5, P.hz, 0.004);
    // on-off modulation by a slow square wave into the tone's gain
    const g = this.tone.node.gain;
    if (g) {
      this.lfo = ctx.createOscillator();
      this.lfo.type = "square";
      this.lfo.frequency.value = 1 / (P.onS + P.offS);
      const depth = ctx.createGain();
      depth.gain.value = P.gain * 0.5;
      this.lfo.connect(depth);
      depth.connect(g.gain);
      this.lfo.start();
    }
  }
  /** Reset: stops at once, or after the 2 s minimum when `automatic` (C4-F4). */
  reset(automatic = false) {
    if (this.startedAt === null) return;
    const minEnd = this.startedAt + SOUND_PARAMS.fiveMin.autoResetMinS;
    const now = this.engine.now();
    const at = automatic ? Math.max(now, minEnd) : now;
    this.startedAt = null;
    const lfo = this.lfo;
    this.lfo = null;
    const stop = () => {
      this.tone.set(0, null, 0.005);
      try {
        lfo?.stop();
        lfo?.disconnect();
      } catch {
        /* already stopped */
      }
    };
    if (at <= now + 1e-3) stop();
    else setTimeout(stop, (at - now) * 1000);
  }
  dispose() {
    this.reset();
    this.tone.dispose();
  }
}

/**
 * Hand syringe through the manifold: a hiss whose level follows the flow and whose brightness follows
 * the pressure, and a plunger squeak when the hand pushes hard with little flow (stiction). Model.
 */
export class SyringeSound {
  private hiss: SustainedNoise;
  private squeak: Sustained;
  constructor(engine: AudioEngine) {
    this.hiss = new SustainedNoise(engine, "devices", 1.2);
    this.squeak = new Sustained(engine, "devices", "triangle");
  }
  update(o: { force: number; flowMlS?: number; psi?: number; aspirate?: boolean }) {
    const P = SOUND_PARAMS.syringe;
    const force = Math.abs(o.force);
    const flow = o.flowMlS ?? force * 3; // without the injector's flow, a model guess from force
    const psi = o.psi ?? force * 40;
    this.hiss.set(force > 0.01 ? Math.min(0.5, P.gainPerFlow * Math.pow(Math.abs(flow), 0.8)) : 0, (o.aspirate ? 500 : P.baseHz) + P.hzPerPsi * psi);
    const stiction = force > 0.6 && Math.abs(flow) < 1 ? (force - 0.6) * 2.5 : 0;
    this.squeak.set(stiction * P.squeakGain, P.squeakHz * (1 + 0.04 * Math.sin(force * 20)), 0.02);
  }
  get level(): GainNode | null {
    return this.hiss.gainNode;
  }
  dispose() {
    this.hiss.dispose();
    this.squeak.dispose();
  }
}

/** Power injector (ventriculogram, aortogram): a motor whine whose pitch follows the flow rate. Model. */
export class PowerInjectorSound {
  private motor: Sustained;
  private armedBeepAt = -1;
  constructor(private engine: AudioEngine) {
    this.motor = new Sustained(engine, "devices", "sawtooth", 900);
  }
  update(o: { flowMlS: number; armed?: boolean }) {
    const P = SOUND_PARAMS.injector;
    this.motor.set(o.flowMlS > 0.05 ? P.gain : 0, P.baseHz + P.hzPerMlS * o.flowMlS, 0.04, 0.15);
    if (o.armed && this.armedBeepAt < 0) {
      this.armedBeepAt = this.engine.now();
      tone(this.engine, "devices", { when: this.armedBeepAt, hz: 1600, durS: 0.08, gain: 0.2 });
      tone(this.engine, "devices", { when: this.armedBeepAt + 0.15, hz: 1600, durS: 0.08, gain: 0.2 });
    }
    if (!o.armed) this.armedBeepAt = -1;
  }
  dispose() {
    this.motor.dispose();
  }
}

/**
 * Inflation device: a click per thread step as the handle turns (clicks per atmosphere is a model
 * parameter), brighter as the pressure rises; a lock click; and a hiss with a falling pitch on release.
 */
export class IndeflatorSound {
  private lastAtm = 0;
  private carry = 0;
  private lastT: number | null = null;
  constructor(private engine: AudioEngine) {}
  /** Call each frame with the current pressure (atm). */
  update(atm: number) {
    const now = this.engine.now();
    if (this.lastT === null) {
      this.lastT = now;
      this.lastAtm = atm;
      return 0;
    }
    const P = SOUND_PARAMS.indeflator;
    const d = atm - this.lastAtm;
    const dt = Math.max(1e-3, now - this.lastT);
    this.lastAtm = atm;
    this.lastT = now;
    if (d <= 0) {
      this.carry = 0;
      return 0;
    }
    this.carry += d * P.clicksPerAtm;
    let n = Math.floor(this.carry);
    this.carry -= n;
    n = Math.min(n, Math.ceil(P.maxClicksPerS * dt));
    for (let k = 0; k < n; k++) {
      const when = now + (k / Math.max(1, n)) * Math.min(dt, 0.05);
      noiseBurst(this.engine, "devices", { when, durS: 0.018, gain: P.clickGain, hz: 1800 + 120 * atm, q: 7 });
    }
    return n;
  }
  lock() {
    click(this.engine, "lock");
  }
  /** Deflation: unlock click then the vacuum hiss. */
  release() {
    const now = this.engine.now();
    click(this.engine, "lock", now);
    noiseBurst(this.engine, "devices", { when: now + 0.06, durS: 0.45, gain: 0.3, hz: 2500, endHz: 600, q: 1.5, decay: false });
    this.lastAtm = 0;
  }
}

/** Defibrillator: rising charge whine, ready beeps while charged, a relay click and a thump on the shock. */
export class DefibSound {
  private readyUntil = -1;
  private nextReady = 0;
  constructor(private engine: AudioEngine) {}
  charging(durS: number) {
    const P = SOUND_PARAMS.defib;
    const ctx = this.engine.ctx;
    if (!ctx) return;
    const now = this.engine.now();
    tone(this.engine, "devices", { when: now, hz: P.chargeFromHz, endHz: P.chargeToHz, durS, gain: P.chargeGain, attackS: 0.05, releaseS: 0.02 });
    this.readyUntil = Infinity;
    this.nextReady = now + durS;
  }
  /** Per frame: the ready beeps while charged. */
  frame() {
    if (this.readyUntil < 0 || !this.engine.ctx) return;
    const now = this.engine.now();
    const P = SOUND_PARAMS.defib;
    while (this.nextReady < now + 0.1) {
      tone(this.engine, "devices", { when: Math.max(now, this.nextReady), hz: P.readyHz, durS: 0.1, gain: 0.18 });
      this.nextReady += P.readyEveryS;
    }
  }
  disarm() {
    this.readyUntil = -1;
  }
  shock() {
    this.readyUntil = -1;
    const now = this.engine.now();
    click(this.engine, "relay", now);
    noiseBurst(this.engine, "devices", { when: now + 0.01, durS: 0.18, gain: 0.6, hz: 140, type: "lowpass", q: 0.7 });
  }
  dispose() {
    this.readyUntil = -1;
  }
}
