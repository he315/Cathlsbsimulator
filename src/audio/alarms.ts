// ---------------------------------------------------------------------------
// Monitor alarm sound by priority.
//
// The S9 engine decides which alarms are active and their priority (high,
// medium, low; vitals().alarms, highest first) and whether they are silenced
// (vitals().alarmsSilencedUntil, patient time). The player sounds only the
// highest active priority, as one burst (sounds.ts ALARM_PATTERNS) repeated
// after an inter-burst interval. A rise in priority interrupts at once; a
// cleared or silenced alarm cancels bursts that have not yet played.
// Inter-burst intervals are MODEL PARAMETERS (no source giving them was
// opened; the standard is not freely available).
// ---------------------------------------------------------------------------

import type { AudioEngine } from "./engine";
import { ALARM_PATTERNS, alarmBurst, type AlarmPriority, type Voice } from "./sounds";

export const ALARM_REPEAT_S: Record<AlarmPriority, number | null> = {
  /** model */
  high: 2.5,
  medium: 6,
  /** model: low priority sounds once per new alarm, then not again */
  low: null,
};

const RANK: Record<AlarmPriority, number> = { high: 0, medium: 1, low: 2 };

export interface AlarmInput {
  alarms: readonly { id: string; level: AlarmPriority }[];
  /** patient time and the engine's silence deadline */
  tPatient: number;
  silencedUntil: number;
}

export class AlarmPlayer {
  private playing: AlarmPriority | null = null;
  private nextAt = 0;
  private voices: Voice[] = [];
  private lowSounded = new Set<string>();
  /** bursts placed: priority and audio time (tests, telemetry) */
  readonly log: { p: AlarmPriority; at: number }[] = [];

  constructor(private engine: AudioEngine) {}

  /** Highest active priority, or null when none or silenced. */
  static top(inp: AlarmInput): AlarmPriority | null {
    if (inp.silencedUntil > inp.tPatient) return null;
    let best: AlarmPriority | null = null;
    for (const a of inp.alarms) if (best === null || RANK[a.level] < RANK[best]) best = a.level;
    return best;
  }

  frame(inp: AlarmInput) {
    const ctx = this.engine.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const top = AlarmPlayer.top(inp);
    // forget low alarms that cleared, so they sound again if they return
    const lowIds = new Set(inp.alarms.filter((a) => a.level === "low").map((a) => a.id));
    for (const id of this.lowSounded) if (!lowIds.has(id)) this.lowSounded.delete(id);
    if (top !== this.playing) {
      // cancel what has not played yet
      for (const v of this.voices) if (v.start > now) v.cancel();
      this.voices = [];
      const wasRank = this.playing === null ? 99 : RANK[this.playing];
      this.playing = top;
      if (top === null) return;
      this.nextAt = RANK[top] < wasRank ? now + 0.02 : Math.max(now + 0.02, this.nextAt);
    }
    if (top === null) return;
    if (top === "low") {
      const fresh = inp.alarms.filter((a) => a.level === "low" && !this.lowSounded.has(a.id));
      if (!fresh.length) return;
      for (const a of fresh) this.lowSounded.add(a.id);
    } else if (this.nextAt > now + 0.15) return;
    const at = Math.max(now + 0.02, this.nextAt);
    this.voices = this.voices.filter((v) => v.start > now - 2).concat(alarmBurst(this.engine, at, top));
    this.log.push({ p: top, at });
    if (this.log.length > 200) this.log.splice(0, this.log.length - 200);
    const rep = ALARM_REPEAT_S[top];
    this.nextAt = at + ALARM_PATTERNS[top].totalS + (rep ?? 0);
  }

  stop() {
    for (const v of this.voices) v.cancel();
    this.voices = [];
    this.playing = null;
  }
}
