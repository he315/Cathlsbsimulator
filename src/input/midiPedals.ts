// ---------------------------------------------------------------------------
// MIDI foot pedals (Web MIDI).
//
// Piano sustain pedals and MIDI foot controllers are cheap, robust foot
// switches. Access is requested only from a user action (connect()), and the
// API needs a secure context (localhost counts) (facts S8 F4b).
//
// Messages: Control Change is status 0xB0-0xBF, Note On 0x90-0x9F, Note Off
// 0x80-0x8F (facts S8 F4). On/off controllers (damper CC64, sostenuto CC66,
// soft CC67) are on at values >= 64 and off at <= 63 (facts S8 F4). A Note On
// with velocity 0 is treated as a release (a zero-velocity press cannot be a
// press). Continuous controllers (expression CC11, foot controller CC4,
// 0-127) can drive the plunger when bound to "plunger".
//
// Defaults bind CC64 to fluoroscopy and CC67/CC66 to cine; "learn" binds the
// next pedal pressed to an action. Each MIDI input is its own source, so
// unplugging one releases what it held (dead-man).
// ---------------------------------------------------------------------------

import type { MidiBinding } from "./settings";
import type { Intent, SourceStatus } from "./types";

export type MidiMessage =
  | { type: "cc"; channel: number; number: number; value: number }
  | { type: "noteOn"; channel: number; number: number; value: number }
  | { type: "noteOff"; channel: number; number: number; value: number }
  | { type: "other" };

export function parseMidi(data: ArrayLike<number> | null | undefined): MidiMessage {
  if (!data || data.length < 3) return { type: "other" };
  const status = data[0] & 0xff;
  const hi = status & 0xf0;
  const channel = status & 0x0f;
  const number = data[1] & 0x7f;
  const value = data[2] & 0x7f;
  if (hi === 0xb0) return { type: "cc", channel, number, value };
  if (hi === 0x90) return value === 0 ? { type: "noteOff", channel, number, value } : { type: "noteOn", channel, number, value };
  if (hi === 0x80) return { type: "noteOff", channel, number, value };
  return { type: "other" };
}

/** CC switch threshold: >= 64 is on (MIDI 1.0 CC table). */
export const MIDI_SWITCH_ON = 64;

export function matches(b: MidiBinding, m: MidiMessage): boolean {
  if (m.type === "other") return false;
  if (b.channel !== undefined && b.channel !== m.channel) return false;
  if (b.number !== m.number) return false;
  return b.kind === "cc" ? m.type === "cc" : m.type === "noteOn" || m.type === "noteOff";
}

/** Map one message to intents under the bindings. */
export function midiIntents(m: MidiMessage, bindings: readonly MidiBinding[], source: string): Intent[] {
  const out: Intent[] = [];
  if (m.type === "other") return out;
  for (const b of bindings) {
    if (!matches(b, m)) continue;
    const on = m.type === "cc" ? m.value >= MIDI_SWITCH_ON : m.type === "noteOn";
    switch (b.action) {
      case "fluoro":
      case "cine":
        out.push({ t: "pedal", pedal: b.action, on, source });
        break;
      case "pinAuto":
        out.push({ t: "pin", target: "auto", on, source });
        break;
      case "plunger":
        out.push({ t: "plunger", force: m.type === "cc" ? m.value / 127 : on ? m.value / 127 : 0, source });
        break;
    }
  }
  return out;
}

/** True for a message that is a press (used by learn mode). */
export function isPress(m: MidiMessage): boolean {
  return (m.type === "cc" && m.value >= MIDI_SWITCH_ON) || m.type === "noteOn";
}

interface MidiInputLike {
  id: string;
  name?: string | null;
  state?: string;
  onmidimessage: ((e: { data: Uint8Array | null }) => void) | null;
}
interface MidiAccessLike {
  inputs: { forEach(cb: (i: MidiInputLike) => void): void };
  onstatechange: ((e: { port: { id: string; type: string; state: string } | null }) => void) | null;
}

export class MidiPedalSource {
  private access: MidiAccessLike | null = null;
  private inputs = new Map<string, string>(); // id → name
  private learnCb: ((m: MidiMessage) => void) | null = null;
  private error: string | null = null;

  constructor(
    private emit: (i: Intent) => void,
    private ctx: { bindings(): MidiBinding[]; onChange?(): void }
  ) {}

  static supported(): boolean {
    return typeof navigator !== "undefined" && typeof (navigator as Navigator & { requestMIDIAccess?: unknown }).requestMIDIAccess === "function";
  }

  get connected() {
    return this.access !== null;
  }

  /** Request MIDI access. Call from a click or key handler. */
  async connect(): Promise<boolean> {
    if (!MidiPedalSource.supported()) {
      this.error = "Web MIDI is not available in this browser";
      return false;
    }
    try {
      const nav = navigator as unknown as { requestMIDIAccess(o?: { sysex?: boolean }): Promise<MidiAccessLike> };
      const access = await nav.requestMIDIAccess({ sysex: false });
      this.access = access;
      this.error = null;
      access.inputs.forEach((i) => this.bindInput(i));
      access.onstatechange = (e) => {
        const p = e.port;
        if (!p || p.type !== "input") return;
        if (p.state === "disconnected") this.dropInput(p.id);
        else access.inputs.forEach((i) => this.bindInput(i));
        this.ctx.onChange?.();
      };
      this.ctx.onChange?.();
      return true;
    } catch (e) {
      this.error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      this.ctx.onChange?.();
      return false;
    }
  }

  /** Feed raw bytes (tests, or a custom transport). */
  handle(data: ArrayLike<number> | null, inputId = "test") {
    const m = parseMidi(data);
    if (this.learnCb && isPress(m)) {
      const cb = this.learnCb;
      this.learnCb = null;
      cb(m);
      return;
    }
    for (const it of midiIntents(m, this.ctx.bindings(), `midi:${inputId}`)) this.emit(it);
  }

  /** Resolve with a binding for the next pedal pressed (rejects after timeoutMs). */
  learn(action: MidiBinding["action"], timeoutMs = 10000): Promise<MidiBinding> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.learnCb = null;
        reject(new Error("No MIDI pedal pressed"));
      }, timeoutMs);
      this.learnCb = (m) => {
        clearTimeout(t);
        if (m.type === "other") return reject(new Error("Unsupported message"));
        resolve({ kind: m.type === "cc" ? "cc" : "note", number: m.number, channel: m.channel, action });
      };
    });
  }

  cancelLearn() {
    this.learnCb = null;
  }

  disconnect() {
    if (this.access) {
      this.access.inputs.forEach((i) => (i.onmidimessage = null));
      this.access.onstatechange = null;
    }
    for (const id of Array.from(this.inputs.keys())) this.dropInput(id);
    this.access = null;
  }

  status(): SourceStatus {
    const supported = MidiPedalSource.supported();
    const names = Array.from(this.inputs.values());
    return {
      id: "midi",
      kind: "midi",
      label: "MIDI foot pedal",
      supported,
      connected: this.access !== null && names.length > 0,
      detail: this.error ?? (this.access ? (names.length ? names.join(", ") : "Access granted; no MIDI input connected") : supported ? "Not connected" : "Web MIDI is not available in this browser"),
    };
  }

  private bindInput(i: MidiInputLike) {
    if (i.state === "disconnected") return;
    this.inputs.set(i.id, i.name ?? "MIDI input");
    i.onmidimessage = (e) => this.handle(e.data, i.id);
  }

  private dropInput(id: string) {
    if (!this.inputs.delete(id)) return;
    this.emit({ t: "releaseSource", source: `midi:${id}` });
    this.emit({ t: "plunger", force: 0, source: `midi:${id}` });
  }
}
