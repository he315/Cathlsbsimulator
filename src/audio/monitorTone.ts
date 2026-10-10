// ---------------------------------------------------------------------------
// Pulse tone: a beep on every R wave of the shared CardiacClock (or on every
// pulse at the finger), pitched by SpO2.
//
// Timing. The patient clock only advances when the lab calls engine.advance
// once per frame, so an R wave is seen up to a frame late. The scheduler
// therefore predicts: after each R wave the clock already holds the next RR
// interval (cardiacClock.ts draws it at the R wave, including AF), so the next
// beep is scheduled ahead on the audio clock at the mapped time of the next R
// wave, within a short look-ahead. The patient-to-audio time map is the
// difference between the audio clock and patient time, smoothed and snapped
// when they jump (a paused tab, a clamped frame). A beat the prediction missed
// (a premature beat) beeps at once; a predicted beat that does not come (VF,
// asystole, a premature beat that moved the R wave) is cancelled before it
// sounds as long as it lies beyond the current frame.
//
// Pitch. Pulse oximeters raise the tone's pitch with SpO2 on a logarithmic
// scale, and devices differ (C4-F2: across 21 oximeters the tone at 100% lay
// between 479 and 921 Hz, at 1% between 38 and 404 Hz). The model uses 880 Hz
// at 100% and a 1.84% frequency step per percentage point, which puts 1% at
// 145 Hz, inside the measured envelope at both ends. Without a pulse oximeter
// reading the R-wave tone keeps a fixed pitch.
// ---------------------------------------------------------------------------

import type { ClockState } from "../simulation/clock/cardiacClock";
import type { AudioEngine } from "./engine";
import { pulseBeep, type Voice } from "./sounds";

export const PULSE_TONE = {
  /** Hz at SpO2 100% (model, inside the 479-921 Hz range measured across devices, C4-F2) */
  hzAt100: 880,
  /** frequency ratio per SpO2 percentage point (model; puts 1% at 145 Hz, inside 38-404 Hz, C4-F2) */
  ratioPerPoint: 1.0184,
  /** pitch with no SpO2 reading (model) */
  hzNoSpo2: 660,
  /** schedule beats this far ahead of the patient clock, s (model) */
  lookaheadS: 0.12,
  /** pulse transit from R wave to finger for the "pleth" source, s (S9 MP_ENGINE.plethDelay, model) */
  plethDelayS: 0.25,
  /** time-map smoothing and snap threshold, s */
  mapAlpha: 0.15,
  mapSnapS: 0.06,
} as const;

/** Tone frequency for an SpO2 (%). Monotonic, logarithmic in frequency. */
export function spo2ToHz(spo2: number | null): number {
  if (spo2 === null || !Number.isFinite(spo2)) return PULSE_TONE.hzNoSpo2;
  const s = Math.max(1, Math.min(100, spo2));
  return PULSE_TONE.hzAt100 * Math.pow(PULSE_TONE.ratioPerPoint, s - 100);
}

export interface PulseToneInput {
  clock: ClockState;
  /** displayed SpO2 (null when the oximeter has no pulse) */
  spo2: number | null;
  /** no beats are coming (VF, asystole): pending beeps are cancelled */
  arrested?: boolean;
}

interface Pending {
  beat: number;
  tPatient: number;
  voice: Voice | null;
  audioT: number;
}

export class PulseToneScheduler {
  source: "ecg" | "pleth" = "ecg";
  enabled = true;
  private offset: number | null = null;
  private pending: Pending[] = [];
  private lastBeat = -1;
  private lastSounded = -1;
  /** every beep scheduled: patient time of its R wave and the audio time it was placed at (tests, telemetry) */
  readonly log: { beat: number; tR: number; audioT: number; hz: number; late: boolean }[] = [];

  constructor(private engine: AudioEngine) {}

  /** Patient time -> audio time with the current map. */
  toAudio(tPatient: number): number {
    return (this.offset ?? 0) + tPatient;
  }

  reset() {
    for (const p of this.pending) p.voice?.cancel();
    this.pending = [];
    this.offset = null;
    this.lastBeat = -1;
  }

  /** Call once per frame after engine.advance(). */
  frame(inp: PulseToneInput) {
    const ctx = this.engine.ctx;
    if (!ctx) return;
    const cs = inp.clock;
    const now = ctx.currentTime;
    // time map
    const meas = now - cs.t;
    if (this.offset === null || Math.abs(meas - this.offset) > PULSE_TONE.mapSnapS) this.offset = meas;
    else this.offset += PULSE_TONE.mapAlpha * (meas - this.offset);
    const delay = this.source === "pleth" ? PULSE_TONE.plethDelayS : 0;
    const silent = !this.enabled || inp.arrested || (this.source === "pleth" && inp.spo2 === null);

    // drop or cancel predictions that are no longer right
    const tR = cs.t - cs.tInBeat;
    const nextR = tR + cs.rr;
    this.pending = this.pending.filter((p) => {
      if (p.beat <= this.lastSounded) return false;
      const want = p.beat === cs.beat ? tR : p.beat === cs.beat + 1 ? nextR : NaN;
      const wrong = silent || !Number.isFinite(want) || Math.abs(want - p.tPatient) > 0.005;
      if (wrong && p.audioT > now) {
        p.voice?.cancel();
        const i = this.log.findIndex((l) => l.beat === p.beat && l.audioT === p.audioT);
        if (i >= 0) this.log.splice(i, 1);
        return false;
      }
      if (p.audioT <= now) this.lastSounded = Math.max(this.lastSounded, p.beat);
      return p.audioT > now;
    });
    if (silent) {
      this.lastBeat = cs.beat;
      return;
    }
    const hz = spo2ToHz(inp.spo2);
    const has = (beat: number) => this.pending.some((p) => p.beat === beat) || this.lastSounded >= beat;
    // a beat that happened without a prediction (first frame, a premature beat): beep now
    if (cs.beat !== this.lastBeat && cs.beat > 0 && !has(cs.beat) && this.lastBeat >= 0) {
      const at = Math.max(now, this.toAudio(tR + delay));
      if (at - this.toAudio(tR + delay) < 0.25) this.place(cs.beat, tR, at, hz, at > this.toAudio(tR + delay) + 1e-4);
    }
    this.lastBeat = cs.beat;
    // the next beat, when it falls inside the look-ahead
    const nb = cs.beat + 1;
    if (!has(nb) && nextR + delay - cs.t <= PULSE_TONE.lookaheadS) {
      const at = this.toAudio(nextR + delay);
      if (at >= now) this.place(nb, nextR, at, hz, false);
    }
  }

  private place(beat: number, tR: number, at: number, hz: number, late: boolean) {
    const voice = pulseBeep(this.engine, at, hz);
    this.pending.push({ beat, tPatient: tR, voice, audioT: at });
    this.log.push({ beat, tR, audioT: at, hz, late });
    if (this.log.length > 400) this.log.splice(0, this.log.length - 400);
  }
}
