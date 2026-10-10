// ---------------------------------------------------------------------------
// Audio engine: one Web Audio context for the lab, created only after a user
// gesture (browsers keep an AudioContext suspended until then; fact C4-F1),
// a master bus with a limiter, and five channels with their own volume and
// mute:
//
//   monitor  pulse-oximeter / QRS tone
//   alarms   monitor alarm bursts
//   xray     exposure tone, cine acquisition, five-minute screening signal
//   devices  syringe, power injector, inflation device, clicks, defibrillator
//   voices   team and patient speech (speech synthesis volume, not a node)
//
// Everything is synthesised from oscillators and a noise buffer: no samples.
// Settings persist in localStorage (guarded; a throwing store is ignored).
// ---------------------------------------------------------------------------

export type Channel = "monitor" | "alarms" | "xray" | "devices" | "voices";
export const CHANNELS: Channel[] = ["monitor", "alarms", "xray", "devices", "voices"];

export const CHANNEL_LABEL: Record<Channel, string> = {
  monitor: "Monitor tone",
  alarms: "Alarms",
  xray: "X-ray",
  devices: "Devices",
  voices: "Voices",
};

export interface ChannelSetting {
  /** 0..1 */
  volume: number;
  muted: boolean;
}

export interface AudioSettings {
  /** 0..1 */
  master: number;
  muted: boolean;
  channels: Record<Channel, ChannelSetting>;
  /** pulse tone timed from the ECG R wave (default) or from the pleth (R wave plus pulse transit) */
  pulseSource: "ecg" | "pleth";
  /** local speech-synthesis voice name for the team (null: automatic) */
  voiceName: string | null;
}

/** Defaults (model): every channel on, master at 0.7. */
export const DEFAULT_AUDIO: AudioSettings = {
  master: 0.7,
  muted: false,
  channels: {
    monitor: { volume: 0.6, muted: false },
    alarms: { volume: 0.8, muted: false },
    xray: { volume: 0.5, muted: false },
    devices: { volume: 0.7, muted: false },
    voices: { volume: 0.9, muted: false },
  },
  pulseSource: "ecg",
  voiceName: null,
};

export const AUDIO_STORAGE_KEY = "cathmaster.audio.v1";

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

const clamp01 = (x: unknown, d: number) => (typeof x === "number" && Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : d);

export function sanitizeAudio(x: unknown): AudioSettings {
  const s = (x && typeof x === "object" ? x : {}) as Partial<AudioSettings>;
  const ch = {} as Record<Channel, ChannelSetting>;
  for (const c of CHANNELS) {
    const v = (s.channels && typeof s.channels === "object" ? (s.channels as Record<string, Partial<ChannelSetting>>)[c] : undefined) ?? {};
    ch[c] = { volume: clamp01(v.volume, DEFAULT_AUDIO.channels[c].volume), muted: typeof v.muted === "boolean" ? v.muted : false };
  }
  return {
    master: clamp01(s.master, DEFAULT_AUDIO.master),
    muted: typeof s.muted === "boolean" ? s.muted : false,
    channels: ch,
    pulseSource: s.pulseSource === "pleth" ? "pleth" : "ecg",
    voiceName: typeof s.voiceName === "string" ? s.voiceName : null,
  };
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadAudioSettings(storage: StorageLike | null = defaultStorage()): AudioSettings {
  try {
    const raw = storage?.getItem(AUDIO_STORAGE_KEY);
    return sanitizeAudio(raw ? JSON.parse(raw) : null);
  } catch {
    return sanitizeAudio(null);
  }
}

export function saveAudioSettings(s: AudioSettings, storage: StorageLike | null = defaultStorage()) {
  try {
    storage?.setItem(AUDIO_STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked: settings stay in memory */
  }
}

/** Effective linear gain of a channel (master × channel, 0 when either is muted). */
export function channelGain(s: AudioSettings, c: Channel): number {
  if (s.muted || s.channels[c].muted) return 0;
  // perceptual taper: squared slider position (model)
  return s.master * s.master * s.channels[c].volume * s.channels[c].volume;
}

/** Linear to 0.6, then a tanh knee that approaches 1 (model). */
export function softClipCurve(n = 2049): Float32Array {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    const a = Math.abs(x);
    c[i] = Math.sign(x) * (a < 0.6 ? a : 0.6 + 0.4 * Math.tanh((a - 0.6) / 0.4));
  }
  return c;
}

export interface AudioEngineOptions {
  /** creates the context (tests pass a fake); default new AudioContext({ latencyHint: "interactive" }) */
  createContext?: () => AudioContext;
  storage?: StorageLike | null;
  settings?: AudioSettings;
}

type Listener = (s: AudioSettings) => void;

export class AudioEngine {
  ctx: AudioContext | null = null;
  private settings: AudioSettings;
  private storage: StorageLike | null;
  private create: () => AudioContext;
  private masterGain: GainNode | null = null;
  private limiter: WaveShaperNode | null = null;
  private buses = new Map<Channel, GainNode>();
  private noise: AudioBuffer | null = null;
  private listeners = new Set<Listener>();
  private unlocking: Promise<boolean> | null = null;

  constructor(o: AudioEngineOptions = {}) {
    this.storage = o.storage === undefined ? defaultStorage() : o.storage;
    this.settings = o.settings ?? loadAudioSettings(this.storage);
    this.create =
      o.createContext ??
      (() => {
        const W = globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
        const C = W.AudioContext ?? W.webkitAudioContext;
        if (!C) throw new Error("Web Audio is not available");
        return new C({ latencyHint: "interactive" });
      });
  }

  static supported(): boolean {
    const W = globalThis as unknown as { AudioContext?: unknown; webkitAudioContext?: unknown };
    return !!(W.AudioContext ?? W.webkitAudioContext);
  }

  /** True once the context exists and is running. */
  get ready(): boolean {
    return !!this.ctx && this.ctx.state === "running";
  }

  /**
   * Create or resume the context. Call from a user gesture (click, key press); browsers refuse to
   * start audio otherwise. Safe to call repeatedly.
   */
  unlock(): Promise<boolean> {
    if (this.ready) return Promise.resolve(true);
    if (this.unlocking) return this.unlocking;
    try {
      if (!this.ctx) this.build(this.create());
    } catch {
      return Promise.resolve(false);
    }
    const ctx = this.ctx!;
    this.unlocking = (ctx.state === "running" ? Promise.resolve() : ctx.resume())
      .then(() => ctx.state === "running")
      .catch(() => false)
      .finally(() => {
        this.unlocking = null;
        this.emit();
      });
    return this.unlocking;
  }

  /** Suspend output (page hidden, pause); unlock() resumes. */
  suspend() {
    void this.ctx?.suspend().catch(() => undefined);
  }

  private build(ctx: AudioContext) {
    this.ctx = ctx;
    // A soft clipper so stacked sounds never clip. A WaveShaper adds no delay; a DynamicsCompressor
    // would (about 6 ms in Chromium, measured offline), which would shift the pulse tone off the R wave.
    this.limiter = ctx.createWaveShaper();
    this.limiter.curve = softClipCurve();
    this.limiter.oversample = "none";
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(this.limiter);
    this.limiter.connect(ctx.destination);
    for (const c of CHANNELS) {
      const g = ctx.createGain();
      g.gain.value = channelGain(this.settings, c);
      g.connect(this.masterGain);
      this.buses.set(c, g);
    }
  }

  /** Destination node for a channel (null before unlock). */
  bus(c: Channel): GainNode | null {
    return this.buses.get(c) ?? null;
  }

  now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  /** One second of seeded white noise, shared by every noise-based sound. */
  noiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (!this.noise) {
      const sr = this.ctx.sampleRate;
      const b = this.ctx.createBuffer(1, sr, sr);
      const d = b.getChannelData(0);
      let s = 0x2545f491;
      for (let i = 0; i < d.length; i++) {
        s ^= s << 13;
        s ^= s >>> 17;
        s ^= s << 5;
        d[i] = ((s >>> 0) / 4294967296) * 2 - 1;
      }
      this.noise = b;
    }
    return this.noise;
  }

  // --- settings ------------------------------------------------------------------------

  getSettings(): AudioSettings {
    return this.settings;
  }

  update(patch: Partial<Omit<AudioSettings, "channels">> & { channels?: Partial<Record<Channel, Partial<ChannelSetting>>> }) {
    const ch = { ...this.settings.channels };
    if (patch.channels) for (const c of CHANNELS) if (patch.channels[c]) ch[c] = { ...ch[c], ...patch.channels[c] };
    this.settings = sanitizeAudio({ ...this.settings, ...patch, channels: ch });
    saveAudioSettings(this.settings, this.storage);
    this.applyGains();
    this.emit();
  }

  setMaster(v: number) {
    this.update({ master: v });
  }
  setMuted(m: boolean) {
    this.update({ muted: m });
  }
  setChannel(c: Channel, p: Partial<ChannelSetting>) {
    this.update({ channels: { [c]: p } });
  }

  gainOf(c: Channel): number {
    return channelGain(this.settings, c);
  }

  private applyGains() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const c of CHANNELS) {
      const g = this.buses.get(c);
      if (!g) continue;
      g.gain.cancelScheduledValues(t);
      g.gain.setTargetAtTime(channelGain(this.settings, c), t, 0.015);
    }
  }

  onChange(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    for (const fn of this.listeners) {
      try {
        fn(this.settings);
      } catch {
        /* a listener failing does not stop the others */
      }
    }
  }

  dispose() {
    try {
      void this.ctx?.close();
    } catch {
      /* already closed */
    }
    this.ctx = null;
    this.buses.clear();
    this.listeners.clear();
  }
}
