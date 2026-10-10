// ---------------------------------------------------------------------------
// Team and patient voices through the Web Speech synthesis API.
//
// Only voices with localService === true are used, so nothing is sent off the
// device (the same rule as the attending's voice, S11 MentorVoice). Captions
// are always shown, so the team works with speech off. Each role gets its own
// local voice where the browser has enough, plus a pitch and rate (model
// parameters), so the speaker is recognisable by ear.
// ---------------------------------------------------------------------------

import type { RoleId } from "../simulation/team/types";

export interface SpeechApi {
  synth: SpeechSynthesis;
  Utterance: typeof SpeechSynthesisUtterance;
}

export function speechApi(): SpeechApi | null {
  try {
    const w = globalThis as unknown as { speechSynthesis?: SpeechSynthesis; SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance };
    if (!w.speechSynthesis || !w.SpeechSynthesisUtterance) return null;
    return { synth: w.speechSynthesis, Utterance: w.SpeechSynthesisUtterance };
  } catch {
    return null;
  }
}

/** Novelty voices some systems ship (sound effects, singing); never used for clinical speech. */
const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Junior|Ralph|Fred|Kathy|Princess|Pipe Organ)\b/;

/** Local voices only (no novelty voices), English first, British English preferred. */
export function localVoices(all: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const local = all.filter((v) => v.localService && !NOVELTY.test(v.name));
  const rank = (v: SpeechSynthesisVoice) => (v.lang === "en-GB" ? 0 : v.lang.startsWith("en") ? 1 : 2);
  return [...local].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

/** Pitch and rate per role (model parameters). */
export const ROLE_VOICE: Record<Exclude<RoleId, "operator">, { pitch: number; rate: number }> = {
  scrub: { pitch: 1.1, rate: 1.05 },
  radiographer: { pitch: 0.95, rate: 1.05 },
  physiologist: { pitch: 1.0, rate: 1.1 },
  sedation: { pitch: 0.9, rate: 1.0 },
  patient: { pitch: 0.95, rate: 0.92 },
};

/** Text for a synthesiser: stage directions removed, abbreviations spelt out. */
export function speakable(text: string): string {
  return text
    .replace(/\([^)]*\)\s*/g, "")
    .replace(/\bIV\b/g, "I.V.")
    .replace(/\bIM\b/g, "I.M.")
    .replace(/\bACT\b/g, "A.C.T.")
    .replace(/\bLAO\b/g, "L.A.O.")
    .replace(/\bRAO\b/g, "R.A.O.")
    .replace(/\bAP\b/g, "A.P.")
    .replace(/\bGTN\b/g, "G.T.N.")
    .replace(/\bVF\b/g, "V.F.")
    .replace(/\bVT\b/g, "V.T.")
    .replace(/\bST\b/g, "S.T.")
    .replace(/\bmL\b/g, "mils")
    .replace(/\bIVUS\b/g, "I.V.U.S.")
    .replace(/\.\.(?!\.)/g, ".")
    .trim();
}

export interface SpeakRequest {
  speaker: RoleId;
  text: string;
  urgent?: boolean;
}

export class TeamVoices {
  readonly api: SpeechApi | null;
  enabled = true;
  private voices: SpeechSynthesisVoice[] = [];
  private onVoices = () => this.loadVoices();

  constructor(
    private volume: () => number,
    private preferred: () => string | null = () => null,
    private patientSex: () => "M" | "F" | null = () => null,
    api: SpeechApi | null = speechApi()
  ) {
    this.api = api;
    this.loadVoices();
    try {
      this.api?.synth.addEventListener?.("voiceschanged", this.onVoices);
    } catch {
      /* older browsers: voices load on first call */
    }
  }

  get supported(): boolean {
    return !!this.api && this.voices.length > 0;
  }

  get available(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  private loadVoices() {
    try {
      this.voices = this.api ? localVoices(this.api.synth.getVoices()) : [];
    } catch {
      this.voices = [];
    }
  }

  /** The voice for a role: the chosen voice for staff when set, otherwise distinct local voices. */
  voiceFor(role: Exclude<RoleId, "operator">): SpeechSynthesisVoice | null {
    if (!this.voices.length) this.loadVoices();
    if (!this.voices.length) return null;
    const en = this.voices.filter((v) => v.lang.startsWith("en"));
    const pool = en.length ? en : this.voices;
    const pref = this.preferred();
    if (pref && role !== "patient") {
      const v = pool.find((x) => x.name === pref);
      if (v) return v;
    }
    const order: Exclude<RoleId, "operator">[] = ["scrub", "radiographer", "physiologist", "sedation", "patient"];
    return pool[order.indexOf(role) % pool.length];
  }

  speak(r: SpeakRequest): boolean {
    if (!this.enabled || !this.api || r.speaker === "operator") return false;
    const vol = this.volume();
    if (vol <= 0) return false;
    const voice = this.voiceFor(r.speaker);
    if (!voice) return false;
    try {
      const u = new this.api.Utterance(speakable(r.text));
      u.voice = voice;
      u.lang = voice.lang;
      const rv = ROLE_VOICE[r.speaker];
      const sex = r.speaker === "patient" ? this.patientSex() : null;
      u.pitch = rv.pitch * (sex === "F" ? 1.15 : sex === "M" ? 0.9 : 1);
      u.rate = rv.rate;
      u.volume = Math.max(0, Math.min(1, vol));
      if (r.urgent) this.api.synth.cancel();
      this.api.synth.speak(u);
      return true;
    } catch {
      return false;
    }
  }

  stop() {
    try {
      this.api?.synth.cancel();
    } catch {
      /* nothing to stop */
    }
  }

  dispose() {
    this.stop();
    try {
      this.api?.synth.removeEventListener?.("voiceschanged", this.onVoices);
    } catch {
      /* ignore */
    }
  }
}
