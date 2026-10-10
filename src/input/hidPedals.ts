// ---------------------------------------------------------------------------
// USB foot switches and the DIY torquer over WebHID.
//
// Permission: navigator.hid.requestDevice() needs a user action and a secure
// context (facts S8 F10). Devices granted before are reopened without a prompt
// through navigator.hid.getDevices().
//
// Foot switches: many USB foot switches enumerate as keyboards. Chrome blocks
// WebHID access to collections with a protected usage such as a generic
// keyboard (facts S8 F10), so those pedals are used through the keyboard path:
// program them to send F and C. Pedals that report on a non-keyboard usage
// (gamepad-style, vendor-defined) are read here: "learn" records which bit
// changes when the pedal is pressed and stores {reportId, byte, mask}.
//
// DIY torquer: a microcontroller with a rotary encoder on a knob (roll), a
// linear sensor on a rod (push), buttons and a plunger force sensor, using a
// vendor-defined usage page (0xFF00..0xFFFF, facts S8 F11). Report format
// (little endian), designed for this simulator:
//
//   Input report 0x01, 8 bytes
//     0-1  int16  roll: encoder counts since the previous report (+ = clockwise
//                 seen from the operator looking down the device)
//     2-3  int16  push: rod travel since the previous report, micrometres
//                 (+ = advance)
//     4    uint8  buttons: bit0 grip, bit1 pin (auto), bit2 pin guide,
//                 bit3 fluoroscopy pedal, bit4 cine pedal
//     5    uint8  plunger force 0-255 (0 = none, 255 = firm push)
//     6    uint8  sequence number (wraps at 256; gaps count dropped reports)
//     7    uint8  reserved (0)
//
//   Output report 0x02, 4 bytes (host → device; haptics.ts torquerOutputReport)
//     0    uint8  axial brake 0-255 (friction brake or servo on the rod)
//     1    uint8  rumble amplitude 0-255
//     2    uint8  pulse length in units of 4 ms
//     3    uint8  reserved (0)
//
// Encoder resolution is settings.hid.torquerCountsPerRev. Rotation from the
// encoder is passed as an angle (no finger-diameter mapping: the knob is the
// hub).
// ---------------------------------------------------------------------------

import type { HidBinding, InputSettings } from "./settings";
import type { Intent, SourceStatus } from "./types";

export const TORQUER_INPUT_REPORT = 0x01;
export const TORQUER_OUTPUT_REPORT = 0x02;
export const TORQUER_USAGE_PAGE = 0xff00;
export const TORQUER_USAGE = 0x01;
export const TORQUER_REPORT_BYTES = 8;

export interface TorquerReport {
  rollCounts: number;
  pushUm: number;
  grip: boolean;
  pinAuto: boolean;
  pinGuide: boolean;
  fluoro: boolean;
  cine: boolean;
  /** 0..1 */
  plunger: number;
  seq: number;
}

export function parseTorquerReport(reportId: number, data: DataView): TorquerReport | null {
  if (reportId !== TORQUER_INPUT_REPORT || data.byteLength < TORQUER_REPORT_BYTES) return null;
  const b = data.getUint8(4);
  return {
    rollCounts: data.getInt16(0, true),
    pushUm: data.getInt16(2, true),
    grip: (b & 0x01) !== 0,
    pinAuto: (b & 0x02) !== 0,
    pinGuide: (b & 0x04) !== 0,
    fluoro: (b & 0x08) !== 0,
    cine: (b & 0x10) !== 0,
    plunger: data.getUint8(5) / 255,
    seq: data.getUint8(6),
  };
}

/** Build a torquer input report (tests and firmware reference). */
export function encodeTorquerReport(r: Omit<TorquerReport, "plunger"> & { plunger: number }): DataView {
  const buf = new ArrayBuffer(TORQUER_REPORT_BYTES);
  const v = new DataView(buf);
  v.setInt16(0, Math.max(-32768, Math.min(32767, Math.round(r.rollCounts))), true);
  v.setInt16(2, Math.max(-32768, Math.min(32767, Math.round(r.pushUm))), true);
  v.setUint8(4, (r.grip ? 1 : 0) | (r.pinAuto ? 2 : 0) | (r.pinGuide ? 4 : 0) | (r.fluoro ? 8 : 0) | (r.cine ? 16 : 0));
  v.setUint8(5, Math.round(Math.max(0, Math.min(1, r.plunger)) * 255));
  v.setUint8(6, r.seq & 0xff);
  v.setUint8(7, 0);
  return v;
}

export interface TorquerMemory {
  grip: boolean;
  pinAuto: boolean;
  pinGuide: boolean;
  fluoro: boolean;
  cine: boolean;
  plunger: number;
  seq: number | null;
  dropped: number;
  /** controls latched by a releaseAll while held (grip, pinAuto, pinGuide, fluoro, cine, plunger): inactive until let go once */
  latched?: Set<string>;
}

export const emptyTorquerMemory = (): TorquerMemory => ({ grip: false, pinAuto: false, pinGuide: false, fluoro: false, cine: false, plunger: 0, seq: null, dropped: 0, latched: new Set() });

/** Forget held state after a releaseAll and latch every control (sequence tracking is kept). Mutates `mem`. */
export function latchTorquerMemory(mem: TorquerMemory) {
  mem.grip = false;
  mem.pinAuto = false;
  mem.pinGuide = false;
  mem.fluoro = false;
  mem.cine = false;
  mem.plunger = 0;
  mem.latched = new Set(["grip", "pinAuto", "pinGuide", "fluoro", "cine", "plunger"]);
}

/** Map a torquer report to intents. Mutates `mem`. */
export function torquerIntents(r: TorquerReport, mem: TorquerMemory, countsPerRev: number, source: string): Intent[] {
  const out: Intent[] = [];
  if (mem.seq !== null) {
    const gap = (r.seq - mem.seq - 1 + 256) % 256;
    mem.dropped += gap;
  }
  mem.seq = r.seq;
  // a latched control acts only after it has been let go once
  const free = (key: string, held: boolean): boolean => {
    const l = mem.latched;
    if (!l || !l.has(key)) return true;
    if (!held) l.delete(key);
    return false;
  };
  const grip = free("grip", r.grip) && r.grip;
  const pinAuto = free("pinAuto", r.pinAuto) && r.pinAuto;
  const pinGuide = free("pinGuide", r.pinGuide) && r.pinGuide;
  const fluoro = free("fluoro", r.fluoro) && r.fluoro;
  const cine = free("cine", r.cine) && r.cine;
  const plunger = free("plunger", r.plunger > 1 / 512) ? r.plunger : 0;
  // order: grip before motion so the first report's travel counts; release after
  if (grip && !mem.grip) out.push({ t: "grab", on: (mem.grip = true), source });
  if (pinAuto !== mem.pinAuto) out.push({ t: "pin", target: "auto", on: (mem.pinAuto = pinAuto), source });
  if (pinGuide !== mem.pinGuide) out.push({ t: "pin", target: "guide", on: (mem.pinGuide = pinGuide), source });
  if (fluoro !== mem.fluoro) out.push({ t: "pedal", pedal: "fluoro", on: (mem.fluoro = fluoro), source });
  if (cine !== mem.cine) out.push({ t: "pedal", pedal: "cine", on: (mem.cine = cine), source });
  if (r.pushUm !== 0) out.push({ t: "move", axialMm: r.pushUm / 1000, lateralMm: 0, source });
  if (r.rollCounts !== 0 && countsPerRev > 0) out.push({ t: "roll", rad: (r.rollCounts / countsPerRev) * 2 * Math.PI, source });
  if (Math.abs(plunger - mem.plunger) > 1 / 512) out.push({ t: "plunger", force: (mem.plunger = plunger), source });
  if (!grip && mem.grip) out.push({ t: "grab", on: (mem.grip = false), source });
  return out;
}

// --- generic switch learning --------------------------------------------------

export interface BitChange {
  byte: number;
  mask: number;
  /** the bit is set in the new report */
  set: boolean;
}

/** Bits that differ between two reports, lowest byte and bit first. */
export function diffBits(before: Uint8Array, after: Uint8Array): BitChange[] {
  const out: BitChange[] = [];
  const n = Math.max(before.length, after.length);
  for (let i = 0; i < n; i++) {
    const a = before[i] ?? 0;
    const b = after[i] ?? 0;
    const x = a ^ b;
    for (let bit = 0; bit < 8; bit++) {
      const m = 1 << bit;
      if (x & m) out.push({ byte: i, mask: m, set: (b & m) !== 0 });
    }
  }
  return out;
}

export function bindingPressed(b: HidBinding, reportId: number, data: Uint8Array): boolean | null {
  if (b.reportId !== reportId || b.byte >= data.length) return null;
  const on = (data[b.byte] & b.mask) !== 0;
  return b.activeHigh ? on : !on;
}

export function hidKey(vendorId: number, productId: number): string {
  const h = (n: number) => n.toString(16).padStart(4, "0");
  return `${h(vendorId)}:${h(productId)}`;
}

/** Map a generic report to pedal / pin intents under the learned bindings. */
export function hidSwitchIntents(
  device: string,
  reportId: number,
  data: Uint8Array,
  bindings: readonly HidBinding[],
  held: Map<string, boolean>,
  source: string
): Intent[] {
  const out: Intent[] = [];
  for (const b of bindings) {
    if (b.device !== device) continue;
    const p = bindingPressed(b, reportId, data);
    if (p === null) continue;
    const k = `${b.reportId}:${b.byte}:${b.mask}:${b.action}`;
    if ((held.get(k) ?? false) === p) continue;
    held.set(k, p);
    if (b.action === "pinAuto") out.push({ t: "pin", target: "auto", on: p, source });
    else out.push({ t: "pedal", pedal: b.action, on: p, source });
  }
  return out;
}

// --- WebHID wiring -------------------------------------------------------------

interface HIDCollectionLike {
  usagePage: number;
  usage: number;
}
interface HIDInputReportEventLike {
  reportId: number;
  data: DataView;
}
export interface HIDDeviceLike {
  vendorId: number;
  productId: number;
  productName: string;
  opened: boolean;
  collections: HIDCollectionLike[];
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  addEventListener(type: "inputreport", cb: (e: HIDInputReportEventLike) => void): void;
  removeEventListener(type: "inputreport", cb: (e: HIDInputReportEventLike) => void): void;
}
interface HIDLike {
  requestDevice(o: { filters: { vendorId?: number; productId?: number; usagePage?: number; usage?: number }[] }): Promise<HIDDeviceLike[]>;
  getDevices(): Promise<HIDDeviceLike[]>;
  addEventListener(type: "disconnect", cb: (e: { device: HIDDeviceLike }) => void): void;
  removeEventListener(type: "disconnect", cb: (e: { device: HIDDeviceLike }) => void): void;
}

const hidApi = (): HIDLike | null => {
  if (typeof navigator === "undefined") return null;
  const h = (navigator as unknown as { hid?: HIDLike }).hid;
  return h ?? null;
};

export function isTorquer(d: HIDDeviceLike): boolean {
  return d.collections.some((c) => c.usagePage === TORQUER_USAGE_PAGE && c.usage === TORQUER_USAGE);
}

interface OpenDevice {
  dev: HIDDeviceLike;
  key: string;
  torquer: boolean;
  onReport: (e: HIDInputReportEventLike) => void;
  last: Map<number, Uint8Array>;
  held: Map<string, boolean>;
  mem: TorquerMemory;
}

export class HidPedalSource {
  private open = new Map<string, OpenDevice>();
  private learnCb: ((d: OpenDevice, reportId: number, data: Uint8Array) => void) | null = null;
  private error: string | null = null;
  private onDisc = (e: { device: HIDDeviceLike }) => this.drop(hidKey(e.device.vendorId, e.device.productId));
  private listening = false;

  constructor(
    private emit: (i: Intent) => void,
    private ctx: { settings(): InputSettings; onChange?(): void }
  ) {}

  static supported(): boolean {
    return hidApi() !== null;
  }

  /** Ask the user to choose a device. Call from a click. */
  async connect(kind: "pedal" | "torquer" = "pedal"): Promise<boolean> {
    const hid = hidApi();
    if (!hid) {
      this.error = "WebHID is not available in this browser";
      this.ctx.onChange?.();
      return false;
    }
    try {
      const filters = kind === "torquer" ? [{ usagePage: TORQUER_USAGE_PAGE, usage: TORQUER_USAGE }] : [];
      const devs = await hid.requestDevice({ filters });
      for (const d of devs) await this.add(d);
      this.listen(hid);
      this.error = devs.length ? null : "No device chosen";
      this.ctx.onChange?.();
      return devs.length > 0;
    } catch (e) {
      this.error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      this.ctx.onChange?.();
      return false;
    }
  }

  /** Reopen devices granted in an earlier session (no prompt). */
  async restore(): Promise<void> {
    const hid = hidApi();
    if (!hid) return;
    try {
      for (const d of await hid.getDevices()) await this.add(d);
      this.listen(hid);
      this.ctx.onChange?.();
    } catch {
      /* ignore */
    }
  }

  /**
   * Resolve with a binding for the next pedal bit that toggles on any open
   * switch device. A bit is bound only when it differs between two real
   * reports (never against an assumed all-zero report, which would make any
   * constant status bit look like the pedal).
   *
   * Polarity: if the device had reported before learning started, that report
   * is the resting state and the changed bit's new value is "pressed". If the
   * first report arrives after learning started, its state is unknown: a
   * following identical report shows a device that reports continuously, so
   * the first report was the rest; a following different report shows a device
   * that reports only on change, so the first report was the press itself and
   * the change is the release.
   */
  learn(action: HidBinding["action"], timeoutMs = 10000): Promise<HidBinding> {
    const restKnown = new Set<string>();
    for (const d of this.open.values()) for (const id of d.last.keys()) restKnown.add(`${d.key}#${id}`);
    const repeated = new Set<string>();
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.learnCb = null;
        reject(new Error("No HID switch pressed"));
      }, timeoutMs);
      this.learnCb = (d, reportId, data) => {
        const k = `${d.key}#${reportId}`;
        const before = d.last.get(reportId);
        if (!before) return; // first report for this id: it becomes the baseline (onReport records it)
        const ch = diffBits(before, data);
        if (ch.length === 0) {
          repeated.add(k);
          return; // keep waiting
        }
        clearTimeout(t);
        this.learnCb = null;
        const c = ch[0];
        const baselineIsRest = restKnown.has(k) || repeated.has(k);
        resolve({ device: d.key, reportId, byte: c.byte, mask: c.mask, activeHigh: baselineIsRest ? c.set : !c.set, action });
      };
    });
  }

  cancelLearn() {
    this.learnCb = null;
  }

  /** Feed a report directly (tests). */
  report(key: string, reportId: number, data: DataView) {
    const d = this.open.get(key);
    if (d) d.onReport({ reportId, data });
  }

  /** Send a haptic output report to every open torquer. */
  sendTorquer(bytes: Uint8Array) {
    for (const d of this.open.values()) {
      if (d.torquer && d.dev.opened) d.dev.sendReport(TORQUER_OUTPUT_REPORT, bytes).catch(() => {});
    }
  }

  hasTorquer(): boolean {
    for (const d of this.open.values()) if (d.torquer) return true;
    return false;
  }

  /** Dropped torquer reports since connection (sequence gaps). */
  droppedReports(): number {
    let n = 0;
    for (const d of this.open.values()) n += d.mem.dropped;
    return n;
  }

  async add(dev: HIDDeviceLike): Promise<void> {
    const key = hidKey(dev.vendorId, dev.productId);
    if (this.open.has(key)) return;
    if (!dev.opened) await dev.open();
    const torquer = isTorquer(dev);
    const od: OpenDevice = {
      dev,
      key,
      torquer,
      last: new Map(),
      held: new Map(),
      mem: emptyTorquerMemory(),
      onReport: () => {},
    };
    const source = torquer ? `torquer:${key}` : `hid:${key}`;
    od.onReport = (e) => {
      const bytes = new Uint8Array(e.data.buffer, e.data.byteOffset, e.data.byteLength);
      const copy = new Uint8Array(bytes);
      if (this.learnCb && !torquer) {
        this.learnCb(od, e.reportId, copy);
      } else if (torquer) {
        const r = parseTorquerReport(e.reportId, e.data);
        if (r) for (const it of torquerIntents(r, od.mem, this.ctx.settings().hid.torquerCountsPerRev, source)) this.emit(it);
      } else {
        for (const it of hidSwitchIntents(key, e.reportId, copy, this.ctx.settings().hid.bindings, od.held, source)) this.emit(it);
      }
      od.last.set(e.reportId, copy);
    };
    dev.addEventListener("inputreport", od.onReport);
    this.open.set(key, od);
  }

  /**
   * The input system released everything: latch each torquer's held buttons
   * so they must be let go and pressed again. USB switches need nothing: their
   * held map already suppresses repeats until the switch changes.
   */
  releaseAll() {
    for (const d of this.open.values()) if (d.torquer) latchTorquerMemory(d.mem);
  }

  disconnectAll() {
    for (const k of Array.from(this.open.keys())) this.drop(k, true);
    const hid = hidApi();
    if (hid && this.listening) hid.removeEventListener("disconnect", this.onDisc);
    this.listening = false;
  }

  status(): SourceStatus[] {
    const supported = HidPedalSource.supported();
    const devs = Array.from(this.open.values());
    const pedals = devs.filter((d) => !d.torquer);
    const torq = devs.filter((d) => d.torquer);
    return [
      {
        id: "hid",
        kind: "hid",
        label: "USB foot switch",
        supported,
        connected: pedals.length > 0,
        detail: this.error ?? (pedals.length ? pedals.map((d) => d.dev.productName || d.key).join(", ") : supported ? "Not connected" : "WebHID is not available in this browser"),
      },
      {
        id: "torquer",
        kind: "torquer",
        label: "Torquer (USB)",
        supported,
        connected: torq.length > 0,
        detail: torq.length ? torq.map((d) => d.dev.productName || d.key).join(", ") : "Not connected",
      },
    ];
  }

  private listen(hid: HIDLike) {
    if (this.listening) return;
    hid.addEventListener("disconnect", this.onDisc);
    this.listening = true;
  }

  private drop(key: string, close = false) {
    const d = this.open.get(key);
    if (!d) return;
    d.dev.removeEventListener("inputreport", d.onReport);
    if (close && d.dev.opened) d.dev.close().catch(() => {});
    this.open.delete(key);
    const source = d.torquer ? `torquer:${key}` : `hid:${key}`;
    this.emit({ t: "releaseSource", source });
    this.emit({ t: "plunger", force: 0, source });
    this.ctx.onChange?.();
  }
}
