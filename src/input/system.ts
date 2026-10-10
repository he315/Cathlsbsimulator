// ---------------------------------------------------------------------------
// InputSystem: owns the bus, the hands, the pedals, the haptics and every
// source, and routes intents between them.
//
//   sources ──Intent──▶ router ──▶ HandState ──▶ bus "hand" / "syringe" / "hands" / "blocked"
//                          ├────▶ PedalMerger ──▶ bus "pedal"
//                          └────▶ C-arm / table velocity sums ──▶ bus "carm" / "table"
//   physics ──bus "reaction"──▶ HapticsController ──▶ pseudo-haptic gain, rumble, torquer brake
//
// Event-driven sources (mouse, trackpad, keyboard edges, MIDI, HID) are routed
// synchronously inside their DOM event. Polled and held inputs (gamepad, held
// keys, the hand-move animation, haptic filtering) advance in frame(dtMs),
// which the lab calls once per animation frame before stepping the physics.
// Either way a command is on the bus before the next physics step: input to
// physics latency is at most one frame.
// ---------------------------------------------------------------------------

import { createInputBus, type InputBus } from "./bus";
import { GamepadSource, type GamepadLike } from "./gamepad";
import { HandState } from "./handState";
import { DEFAULT_RUMBLE, GamepadRumbleSink, HapticsController, torquerOutputReport } from "./haptics";
import { HidPedalSource } from "./hidPedals";
import { KeyboardSource } from "./keyboard";
import { MidiPedalSource } from "./midiPedals";
import { PedalMerger } from "./pedals";
import { PointerLockMouse } from "./pointerLockMouse";
import {
  GRIP_ORDER_PCI,
  loadSettings,
  mergeSettings,
  saveSettings,
  type DeviceCalibration,
  type InputSettings,
  type SettingsPatch,
} from "./settings";
import { TrackpadSource } from "./trackpad";
import type { DeviceSlot, GripTarget, HandView, Intent, PedalState, SourceId, SourceStatus, StorageLike } from "./types";

export interface InputSystemOptions {
  /** start from these settings instead of loading from storage */
  settings?: InputSettings;
  /** storage for settings (default localStorage; null = do not persist) */
  storage?: StorageLike | null;
  present?: DeviceSlot[];
  gripOrder?: GripTarget[];
  initialGrip?: GripTarget | null;
  /** clock in ms (default performance.now) */
  now?: () => number;
  /** gamepad provider (tests) */
  getPads?: () => ArrayLike<GamepadLike | null>;
}

type Vel = { a: number; b: number };

export class InputSystem {
  readonly bus: InputBus;
  readonly hands: HandState;
  readonly pedals = new PedalMerger();
  readonly haptics = new HapticsController();
  readonly keyboard: KeyboardSource;
  readonly mouse: PointerLockMouse;
  readonly trackpad: TrackpadSource;
  readonly gamepad: GamepadSource;
  readonly midi: MidiPedalSource;
  readonly hid: HidPedalSource;

  private settings: InputSettings;
  private storage: StorageLike | null | undefined;
  private now: () => number;
  private plungerOwner: SourceId | null = null;
  private carmBy = new Map<SourceId, Vel>();
  private tableBy = new Map<SourceId, Vel>();
  private carmSum: Vel = { a: 0, b: 0 };
  private tableSum: Vel = { a: 0, b: 0 };
  private raf: number | null = null;
  private lastFrame: number | null = null;
  private disposers: (() => void)[] = [];
  private lastPadCount = 0;
  private rumbleSink: GamepadRumbleSink;
  private gamepadProvided: boolean;
  /** last torquer output report sent (null = none yet / torquer absent) and when */
  private torquerSent: Uint8Array | null = null;
  private torquerSentAt = -Infinity;

  constructor(o: InputSystemOptions = {}) {
    this.storage = o.storage;
    this.settings = o.settings ?? (o.storage === null ? loadSettings(null) : loadSettings(o.storage));
    this.now = o.now ?? (() => (typeof performance !== "undefined" ? performance.now() : Date.now()));
    this.bus = createInputBus();
    this.hands = new HandState({ settings: this.settings, present: o.present, gripOrder: o.gripOrder ?? GRIP_ORDER_PCI, initial: o.initialGrip });

    const emit = (i: Intent) => this.emit(i);
    const settings = () => this.settings;
    const onChange = () => this.publishSources();
    this.keyboard = new KeyboardSource(emit, { settings, port: () => this.hands.view().syringePort });
    this.mouse = new PointerLockMouse(emit, { settings });
    this.trackpad = new TrackpadSource(emit, { settings });
    this.gamepad = new GamepadSource(
      emit,
      { settings, padContext: () => ({ atSyringe: this.hands.view().right.at === "syringe", port: this.hands.view().syringePort }) },
      o.getPads
    );
    this.midi = new MidiPedalSource(emit, { bindings: () => this.settings.midi.bindings, onChange });
    this.hid = new HidPedalSource(emit, { settings, onChange });

    this.rumbleSink = new GamepadRumbleSink(o.getPads as (() => ArrayLike<Gamepad | null>) | undefined);
    this.disposers.push(this.haptics.addSink(this.rumbleSink));
    this.gamepadProvided = !!o.getPads;
    this.disposers.push(
      this.bus.on("reaction", (f) => {
        this.haptics.feed(f);
      })
    );
    this.applyHapticSettings();
  }

  // --- settings ----------------------------------------------------------------

  getSettings(): InputSettings {
    return this.settings;
  }

  updateSettings(patch: SettingsPatch) {
    this.settings = mergeSettings(this.settings, patch);
    this.hands.setSettings(this.settings);
    this.applyHapticSettings();
    if (this.storage !== null) saveSettings(this.settings, this.storage);
  }

  setCalibration(key: string, cal: DeviceCalibration) {
    this.updateSettings({ calibration: { ...this.settings.calibration, [key]: cal } });
    this.bus.emit("calibrated", { device: key, mmPerCount: cal.mmPerCount });
  }

  private applyHapticSettings() {
    this.haptics.enabledPseudo = this.settings.haptics.pseudo;
    this.haptics.pseudo.setStrength(this.settings.haptics.strength);
    this.haptics.enabledRumble = this.settings.gamepad.rumble;
  }

  // --- table ---------------------------------------------------------------------

  setPresent(list: DeviceSlot[]) {
    this.publishHands(this.hands.setPresent(list));
  }

  setGripOrder(order: GripTarget[]) {
    this.hands.setGripOrder(order);
    this.bus.emit("hands", this.hands.view());
  }

  view(): HandView {
    return this.hands.view();
  }

  pedalState(): PedalState {
    return this.pedals.state();
  }

  // --- routing ---------------------------------------------------------------------

  emit(i: Intent) {
    switch (i.t) {
      case "pedal": {
        const p = this.pedals.set(i.source, i.pedal, i.on);
        if (p) this.bus.emit("pedal", p);
        return;
      }
      case "carm":
        return this.velocity(this.carmBy, i.source, { a: i.laoDegPerS, b: i.cranDegPerS }, "carm");
      case "table":
        return this.velocity(this.tableBy, i.source, { a: i.xMmPerS, b: i.yMmPerS }, "table");
      case "plunger": {
        const zero = Math.abs(i.force) < 1e-9;
        if (zero && this.plungerOwner !== null && this.plungerOwner !== i.source) return; // another hand holds it
        if (zero && this.plungerOwner === null && this.hands.view().right.plungerForce === 0) return;
        this.plungerOwner = zero ? null : i.source;
        break;
      }
      case "releaseSource": {
        const p = this.pedals.releaseSource(i.source);
        if (p) this.bus.emit("pedal", p);
        if (this.carmBy.has(i.source)) this.velocity(this.carmBy, i.source, { a: 0, b: 0 }, "carm");
        if (this.tableBy.has(i.source)) this.velocity(this.tableBy, i.source, { a: 0, b: 0 }, "table");
        if (this.plungerOwner === i.source) {
          this.plungerOwner = null;
          this.publishHands(this.hands.apply({ t: "plunger", force: 0, source: i.source }));
        }
        break;
      }
      default:
        break;
    }
    this.publishHands(this.hands.apply(i, this.haptics.gains()));
  }

  private velocity(map: Map<SourceId, Vel>, source: SourceId, v: Vel, ev: "carm" | "table") {
    if (v.a === 0 && v.b === 0) map.delete(source);
    else map.set(source, v);
    let a = 0;
    let b = 0;
    for (const x of map.values()) {
      a += x.a;
      b += x.b;
    }
    const prev = ev === "carm" ? this.carmSum : this.tableSum;
    if (prev.a === a && prev.b === b) return;
    if (ev === "carm") {
      this.carmSum = { a, b };
      this.bus.emit("carm", { laoDegPerS: a, cranDegPerS: b });
    } else {
      this.tableSum = { a, b };
      this.bus.emit("table", { xMmPerS: a, yMmPerS: b });
    }
  }

  private publishHands(o: ReturnType<HandState["apply"]>) {
    for (const c of o.commands) this.bus.emit("hand", c);
    if (o.syringe) this.bus.emit("syringe", o.syringe);
    for (const b of o.blocked) this.bus.emit("blocked", b);
    if (o.changed) this.bus.emit("hands", this.hands.view());
  }

  // --- per frame -------------------------------------------------------------------

  /** Advance polled inputs, the hand-move animation and haptic filtering. Call once per frame. */
  frame(dtMs: number) {
    const dt = Math.max(0, Number.isFinite(dtMs) ? dtMs : 0);
    const now = this.now();
    this.publishHands(this.hands.advance(dt));
    this.keyboard.frame(dt / 1000);
    this.trackpad.tick(now);
    if (GamepadSource.supported() || this.gamepadProvided) {
      this.gamepad.poll(dt / 1000);
      const n = this.gamepad.statuses().filter((s) => s.connected).length;
      if (n !== this.lastPadCount) {
        this.lastPadCount = n;
        this.publishSources();
      }
    }
    this.haptics.step(dt / 1000, now);
    this.updateTorquer(now);
  }

  /**
   * Torquer brake from the latest fresh axial reaction; 0 once the reaction is
   * stale (same rule as rumble), so the brake never stays engaged when the
   * physics stops feeding. The report is sent only when its bytes change, at
   * most once per rumble interval, except that releasing the brake is sent at once.
   */
  private updateTorquer(now: number) {
    if (!this.hid.hasTorquer()) {
      this.torquerSent = null;
      return;
    }
    const f = this.haptics.current();
    // model: brake saturates with the strong rumble motor (DEFAULT_RUMBLE.axialSat)
    const brake = f ? Math.min(1, Math.abs(f.axial) / DEFAULT_RUMBLE.axialSat) : 0;
    const bytes = torquerOutputReport(brake, null);
    const prev = this.torquerSent;
    if (prev && prev.every((b, i) => b === bytes[i])) return;
    const releasing = bytes[0] === 0;
    if (!releasing && prev && now - this.torquerSentAt < DEFAULT_RUMBLE.intervalMs) return;
    this.torquerSent = bytes;
    this.torquerSentAt = now;
    this.hid.sendTorquer(bytes);
  }

  /** Convenience for the physics client: hub reaction in (same as emitting "reaction" on the bus). */
  feedReaction(f: Parameters<HapticsController["feed"]>[0]) {
    this.bus.emit("reaction", f);
  }

  /** Drive frame() from requestAnimationFrame (standalone screens such as calibration). */
  startLoop() {
    if (this.raf !== null || typeof requestAnimationFrame === "undefined") return;
    const tick = (t: number) => {
      const dt = this.lastFrame === null ? 16.7 : Math.min(100, t - this.lastFrame);
      this.lastFrame = t;
      this.frame(dt);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stopLoop() {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.lastFrame = null;
  }

  // --- DOM -------------------------------------------------------------------------

  /**
   * Attach the mouse and trackpad to an element (the table view or the live
   * image) and, unless disabled, the keyboard to the window.
   */
  attach(el: HTMLElement, o: { keyboard?: boolean } = {}): () => void {
    const offs: (() => void)[] = [this.mouse.attach(el), this.trackpad.attach(el, this.now)];
    if (o.keyboard !== false && typeof window !== "undefined") offs.push(this.keyboard.attach(window));
    const onPad = () => this.publishSources();
    if (typeof window !== "undefined") {
      window.addEventListener("gamepadconnected", onPad);
      window.addEventListener("gamepaddisconnected", onPad);
      offs.push(() => {
        window.removeEventListener("gamepadconnected", onPad);
        window.removeEventListener("gamepaddisconnected", onPad);
      });
    }
    this.publishSources();
    return () => offs.forEach((f) => f());
  }

  statuses(): SourceStatus[] {
    const pl = PointerLockMouse.supported();
    return [
      { id: "keyboard", kind: "keyboard", label: "Keyboard", supported: true, connected: true, detail: "Held keys: F fluoroscopy, C cine" },
      {
        id: "mouse",
        kind: "mouse",
        label: "Mouse",
        supported: pl,
        connected: this.mouse.isLocked,
        detail: !pl
          ? "Pointer lock not available: press and drag instead"
          : this.mouse.isLocked
          ? this.mouse.currentMode === "raw"
            ? "Locked, raw counts"
            : "Locked, OS-adjusted counts"
          : this.mouse.lockError
          ? `Pointer lock refused (${this.mouse.lockError})`
          : "Click the table to take the device",
      },
      { id: "trackpad", kind: "trackpad", label: "Trackpad", supported: true, connected: this.settings.trackpad.enabled, detail: "Two-finger swipe over the table" },
      ...this.gamepad.statuses(),
      this.midi.status(),
      ...this.hid.status(),
    ];
  }

  private publishSources() {
    this.bus.emit("sources", this.statuses());
  }

  /**
   * Release every hand and foot (pause, unmount, case end), whichever source
   * holds them: keyboard, mouse, trackpad, on-screen, gamepad, MIDI, USB switch
   * or torquer. Controls that are still physically held (a deflected stick, a
   * pressed trigger, a held torquer button) are latched and must be let go and
   * pressed again before they act. The haptic load is forgotten so rumble and
   * the torquer brake stop.
   */
  releaseAll() {
    this.keyboard.releaseAll();
    this.gamepad.releaseAll();
    this.hid.releaseAll();
    for (const id of ["mouse", "trackpad", "ui"]) this.emit({ t: "releaseSource", source: id });
    // grips and pins held by any other source (gamepad, torquer, MIDI, USB switch)
    this.publishHands(this.hands.releaseAll());
    this.plungerOwner = null;
    const p = this.pedals.releaseAll();
    if (p) this.bus.emit("pedal", p);
    for (const k of Array.from(this.carmBy.keys())) this.velocity(this.carmBy, k, { a: 0, b: 0 }, "carm");
    for (const k of Array.from(this.tableBy.keys())) this.velocity(this.tableBy, k, { a: 0, b: 0 }, "table");
    this.haptics.clear();
    this.updateTorquer(this.now());
  }

  dispose() {
    this.stopLoop();
    this.releaseAll();
    this.midi.disconnect();
    this.hid.disconnectAll();
    this.disposers.forEach((f) => f());
    this.disposers = [];
    this.bus.clear();
  }
}

export function createInputSystem(o?: InputSystemOptions): InputSystem {
  return new InputSystem(o);
}
