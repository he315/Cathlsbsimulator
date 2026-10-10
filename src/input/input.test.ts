import { describe, expect, it, vi } from "vitest";
import { createBus } from "./bus";
import { CommandQueue } from "./commandQueue";
import { deadzone2, emptyPadMemory, GamepadSource, latchPadMemory, mapGamepad, PAD, type GamepadLike } from "./gamepad";
import { autoPinFor, HandState, resolvePin } from "./handState";
import {
  DEFAULT_PSEUDO,
  DEFAULT_RUMBLE,
  HapticsController,
  PseudoHapticGain,
  pseudoTarget,
  RumbleMapper,
  rumbleAmplitude,
  torquerOutputReport,
  type RumbleEffect,
} from "./haptics";
import {
  bindingPressed,
  diffBits,
  encodeTorquerReport,
  hidSwitchIntents,
  HidPedalSource,
  parseTorquerReport,
  torquerIntents,
  emptyTorquerMemory,
  latchTorquerMemory,
  TORQUER_USAGE,
  TORQUER_USAGE_PAGE,
  type HIDDeviceLike,
} from "./hidPedals";
import { KeyboardSource } from "./keyboard";
import { applyToDiagnostic, applyToPci } from "./legacyAdapter";
import { midiIntents, MidiPedalSource, parseMidi } from "./midiPedals";
import { hysteresis, PedalMerger } from "./pedals";
import { PointerLockMouse } from "./pointerLockMouse";
import {
  calibrationFromRun,
  DEFAULT_MOUSE_MM_PER_COUNT,
  defaultSettings,
  gripGeometry,
  loadSettings,
  mergeSettings,
  saveSettings,
  sanitizeSettings,
  SETTINGS_KEY,
  TORQUE_DEVICE_MM,
  WIRE014_MM,
  type InputSettings,
} from "./settings";
import { createInputSystem } from "./system";
import { MomentumFilter, TrackpadSource } from "./trackpad";
import type { DeviceSlot, GripTarget, HandCommand, Intent, StorageLike } from "./types";

// ---------------------------------------------------------------- helpers

function settings(patch: Partial<{ switchMs: number; coupling: boolean; torqueDevice: boolean }> = {}): InputSettings {
  const s = defaultSettings();
  s.grip.switchMs = patch.switchMs ?? 0;
  s.grip.emulateCoupling = patch.coupling ?? false;
  s.grip.torqueDevice = patch.torqueDevice ?? true;
  return s;
}

function hand(s = settings(), initial: GripTarget | null = "catheter", present?: DeviceSlot[]) {
  return new HandState({ settings: s, initial, present });
}

const grab = (on: boolean, source = "mouse"): Intent => ({ t: "grab", on, source });
const move = (axialMm: number, lateralMm = 0, source = "mouse"): Intent => ({ t: "move", axialMm, lateralMm, source });
const pushes = (cs: HandCommand[], device?: DeviceSlot) =>
  cs.filter((c): c is Extract<HandCommand, { kind: "push" }> => c.kind === "push" && (!device || c.device === device));
const torques = (cs: HandCommand[]) => cs.filter((c): c is Extract<HandCommand, { kind: "torque" }> => c.kind === "torque");

class MemStorage implements StorageLike {
  m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
}

function pad(over: Partial<{ axes: number[]; pressed: number[]; values: Record<number, number>; index: number }> = {}): GamepadLike {
  const buttons = Array.from({ length: 17 }, (_, i) => ({
    pressed: (over.pressed ?? []).includes(i) || (over.values?.[i] ?? 0) > 0.5,
    value: over.values?.[i] ?? ((over.pressed ?? []).includes(i) ? 1 : 0),
  }));
  return { index: over.index ?? 0, id: "test pad", mapping: "standard", connected: true, axes: over.axes ?? [0, 0, 0, 0], buttons };
}

// ---------------------------------------------------------------- bus

describe("bus", () => {
  it("dispatches synchronously, unsubscribes and isolates listener errors", () => {
    const bus = createBus<{ a: number; b: string }>();
    const got: number[] = [];
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    bus.on("a", () => {
      throw new Error("boom");
    });
    const off = bus.on("a", (v) => got.push(v));
    const any: string[] = [];
    bus.onAny((t) => any.push(String(t)));
    bus.emit("a", 1);
    expect(got).toEqual([1]); // ran inside emit, despite the throwing listener
    off();
    bus.emit("a", 2);
    bus.emit("b", "x");
    expect(got).toEqual([1]);
    expect(any).toEqual(["a", "a", "b"]);
    expect(err).toHaveBeenCalledTimes(1); // reported once per listener
    err.mockRestore();
  });

  it("once fires a single time", () => {
    const bus = createBus<{ a: number }>();
    const fn = vi.fn();
    bus.once("a", fn);
    bus.emit("a", 1);
    bus.emit("a", 2);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------- settings

describe("settings", () => {
  it("defaults are 1:1 with the documented mouse default", () => {
    const s = defaultSettings();
    expect(s.gains.push).toBe(1);
    expect(s.calibration["mouse:raw"].mmPerCount).toBeCloseTo(25.4 / 800, 10);
  });

  it("sanitizes corrupt records and clamps ranges", () => {
    const s = sanitizeSettings({ gains: { push: "x", roll: 1e9 }, grip: { switchMs: -5 }, calibration: { "mouse:raw": { mmPerCount: NaN } }, gamepad: { pedalOn: 0.4, pedalOff: 0.9 } });
    expect(s.gains.push).toBe(1);
    expect(s.gains.roll).toBe(10);
    expect(s.grip.switchMs).toBe(0);
    expect(s.calibration["mouse:raw"].mmPerCount).toBe(DEFAULT_MOUSE_MM_PER_COUNT);
    expect(s.gamepad.pedalOff).toBeLessThanOrEqual(s.gamepad.pedalOn);
  });

  it("persists per device and survives a throwing storage", () => {
    const st = new MemStorage();
    const s = mergeSettings(defaultSettings(), { calibration: { ...defaultSettings().calibration, trackpad: { mmPerCount: 0.2, method: "measured" } } });
    expect(saveSettings(s, st)).toBe(true);
    const back = loadSettings(st);
    expect(back.calibration.trackpad.mmPerCount).toBe(0.2);
    expect(back.calibration["mouse:raw"].mmPerCount).toBeCloseTo(DEFAULT_MOUSE_MM_PER_COUNT);
    const bad: StorageLike = {
      getItem() {
        throw new Error("denied");
      },
      setItem() {
        throw new Error("denied");
      },
    };
    expect(loadSettings(bad).version).toBe(1);
    expect(saveSettings(s, bad)).toBe(false);
    st.setItem(SETTINGS_KEY, "{not json");
    expect(loadSettings(st).gains.push).toBe(1);
  });

  it("calibration from a ruler run", () => {
    const c = calibrationFromRun(856, 85.6)!;
    expect(c.mmPerCount).toBeCloseTo(0.1, 10);
    expect(c.method).toBe("measured");
    expect(calibrationFromRun(5, 85.6)).toBeNull(); // too few counts
    expect(calibrationFromRun(30, 85.6)).toBeNull(); // 2.85 mm/count: implausible
    expect(calibrationFromRun(100, 0)).toBeNull();
  });

  it("torque device replaces the wire diameter", () => {
    expect(gripGeometry(settings({ torqueDevice: true }), "wire014").diameterMm).toBe(TORQUE_DEVICE_MM);
    expect(gripGeometry(settings({ torqueDevice: false }), "wire014").diameterMm).toBeCloseTo(WIRE014_MM, 6);
  });
});

// ---------------------------------------------------------------- hand mapping

describe("HandState mapping", () => {
  it("1:1 push and theta = 2 dx / D roll while gripped", () => {
    const h = hand();
    expect(h.apply(move(10)).commands).toEqual([]); // hovering hand
    const g = h.apply(grab(true));
    expect(g.commands).toEqual([{ kind: "grip", hand: "right", device: "catheter" }]);
    const o = h.apply(move(10, 3));
    expect(pushes(o.commands)[0]).toEqual({ kind: "push", device: "catheter", mm: 10 });
    expect(torques(o.commands)[0].rad).toBeCloseTo((2 * 3) / 6, 12); // catheter hub D = 6 mm
  });

  it("roll uses the gripped diameter (torque device vs bare wire)", () => {
    const withTd = hand(settings({ torqueDevice: true }), "wire014");
    withTd.apply(grab(true));
    expect(torques(withTd.apply(move(0, 4)).commands)[0].rad).toBeCloseTo(1, 12); // 2*4/8
    const bare = hand(settings({ torqueDevice: false }), "wire014");
    bare.apply(grab(true));
    expect(torques(bare.apply(move(0, 1)).commands)[0].rad).toBeCloseTo(2 / WIRE014_MM, 9);
  });

  it("applies gains, inversion and pseudo-haptic multipliers", () => {
    const s = settings();
    s.gains.push = 0.5;
    s.gains.invertRoll = true;
    const h = hand(s);
    h.apply(grab(true));
    const o = h.apply(move(10, 3), { push: 0.5, roll: 1 });
    expect(pushes(o.commands)[0].mm).toBeCloseTo(2.5, 12);
    expect(torques(o.commands)[0].rad).toBeCloseTo(-1, 12);
  });

  it("clips at the push span and needs a regrip", () => {
    const h = hand(); // catheter pushSpan 50 mm → ±25
    h.apply(grab(true));
    const o = h.apply(move(30));
    expect(pushes(o.commands)[0].mm).toBeCloseTo(25, 12);
    expect(o.blocked).toContainEqual({ device: "catheter", reason: "span" });
    expect(pushes(h.apply(move(5)).commands)).toEqual([]);
    // pulling back is still possible within the span
    expect(pushes(h.apply(move(-5)).commands)[0].mm).toBeCloseTo(-5, 12);
    // let go and grasp again
    const rel = h.apply(grab(false));
    expect(rel.commands).toEqual([{ kind: "grip", hand: "right", device: null }]);
    const re = h.apply(grab(true));
    expect(re.commands).toEqual([
      { kind: "regrip", hand: "right" },
      { kind: "grip", hand: "right", device: "catheter" },
    ]);
    expect(pushes(h.apply(move(20)).commands)[0].mm).toBeCloseTo(20, 12);
  });

  it("limits roll per grip to the fingertip span", () => {
    const h = hand(); // catheter rollSpan 24 mm → ±12, D 6 → 4 rad per direction
    h.apply(grab(true));
    let total = 0;
    for (let i = 0; i < 20; i++) total += torques(h.apply(move(0, 1)).commands).reduce((a, c) => a + c.rad, 0);
    expect(total).toBeCloseTo(4, 9);
    h.apply(grab(false));
    h.apply(grab(true));
    expect(torques(h.apply(move(0, 1)).commands)[0].rad).toBeCloseTo(1 / 3, 9);
    expect(h.view().right.rollOffsetMm).toBeCloseTo(1, 9);
  });

  it("several sources can hold the grip; it opens when the last lets go", () => {
    const h = hand();
    h.apply(grab(true, "mouse"));
    expect(h.apply(grab(true, "keyboard")).commands).toEqual([]);
    expect(h.apply(grab(false, "mouse")).commands).toEqual([]);
    expect(h.gripped).toBe(true);
    expect(h.apply(grab(false, "keyboard")).commands).toEqual([{ kind: "grip", hand: "right", device: null }]);
  });

  it("encoder roll is passed as an angle without span or diameter", () => {
    const h = hand();
    h.apply(grab(true, "torquer"));
    const o = h.apply({ t: "roll", rad: 10, source: "torquer" });
    expect(torques(o.commands)[0].rad).toBe(10);
  });
});

describe("pins", () => {
  it("auto pin resolves to the usual partner", () => {
    const all = new Set<DeviceSlot>(["sheath", "catheter", "wire014", "balloon"]);
    expect(autoPinFor("balloon", all)).toBe("wire");
    expect(autoPinFor("wire014", all)).toBe("guide");
    expect(autoPinFor("catheter", all)).toBe("wire");
    expect(autoPinFor("catheter", new Set<DeviceSlot>(["sheath", "catheter"]))).toBe("sheath");
    expect(resolvePin("wire", all)).toBe("wire014");
    expect(resolvePin("wire", new Set<DeviceSlot>(["wire035"]))).toBe("wire035");
    expect(resolvePin("guide", new Set<DeviceSlot>(["sheath"]))).toBeNull();
  });

  it("a pinned wire stays put while the balloon advances", () => {
    const h = hand(settings({ coupling: true }), "balloon");
    const p = h.apply({ t: "pin", target: "auto", on: true, source: "keyboard" });
    expect(p.commands).toEqual([
      { kind: "grip", hand: "left", device: "wire014" },
      { kind: "pin", device: "wire014", on: true },
    ]);
    h.apply(grab(true));
    const o = h.apply(move(8));
    expect(pushes(o.commands, "balloon")[0].mm).toBe(8);
    expect(pushes(o.commands, "wire014")).toEqual([]);
  });

  it("an unpinned wire is dragged by the device (legacy coupling emulation)", () => {
    const h = hand(settings({ coupling: true }), "balloon");
    h.apply(grab(true));
    const o = h.apply(move(10));
    expect(pushes(o.commands, "wire014")[0].mm).toBeCloseTo(5, 12); // wireDragFraction 0.5
    const off = hand(settings({ coupling: false }), "balloon");
    off.apply(grab(true));
    expect(pushes(off.apply(move(10)).commands, "wire014")).toEqual([]);
  });

  it("the right hand cannot move what the left hand pins", () => {
    const h = hand(settings(), "catheter");
    h.apply({ t: "pin", target: "guide", on: true, source: "keyboard" });
    h.apply(grab(true));
    const o = h.apply(move(5, 2));
    expect(o.commands).toEqual([]);
    expect(o.blocked).toEqual([{ device: "catheter", reason: "pinned" }]);
    const rel = h.apply({ t: "pin", target: "guide", on: false, source: "keyboard" });
    expect(rel.commands).toEqual([
      { kind: "pin", device: "catheter", on: false },
      { kind: "grip", hand: "left", device: null },
    ]);
    expect(pushes(h.apply(move(5)).commands)[0].mm).toBe(5);
  });

  it("a new pin replaces the old one; releaseSource drops a pin", () => {
    const h = hand(settings(), "wire014");
    h.apply({ t: "pin", target: "guide", on: true, source: "keyboard" });
    const o = h.apply({ t: "pin", target: "sheath", on: true, source: "gamepad:0" });
    expect(o.commands.map((c) => c.kind)).toEqual(["pin", "grip", "grip", "pin"]);
    expect(h.view().left.pinnedDevice).toBe("sheath");
    // the old key coming up does not release the new pin
    expect(h.apply({ t: "pin", target: "guide", on: false, source: "keyboard" }).commands).toEqual([]);
    expect(h.apply({ t: "releaseSource", source: "gamepad:0" }).commands[0]).toEqual({ kind: "pin", device: "sheath", on: false });
  });
});

describe("grip switching", () => {
  it("takes switchMs, ignores motion meanwhile, arrives open", () => {
    const h = hand(settings({ switchMs: 300 }), "catheter");
    h.apply(grab(true));
    const sel = h.apply({ t: "selectIndex", index: 2 }); // PCI order: catheter, wire014, ...
    expect(sel.commands).toEqual([{ kind: "grip", hand: "right", device: null }]);
    expect(h.view().right.transition?.to).toBe("wire014");
    expect(h.apply(move(5)).blocked).toEqual([{ device: "wire014", reason: "transition" }]);
    h.advance(150);
    expect(h.view().right.transition?.progress).toBeCloseTo(0.5, 9);
    h.advance(200);
    expect(h.view().right.at).toBe("wire014");
    expect(h.gripped).toBe(false);
    expect(h.apply(grab(true)).commands).toEqual([{ kind: "grip", hand: "right", device: "wire014" }]); // not a regrip
  });

  it("cycle skips devices that are not on the table", () => {
    const h = hand(settings(), "catheter", ["sheath", "catheter", "wire014"]);
    h.apply({ t: "cycle", dir: 1 });
    expect(h.view().right.at).toBe("wire014");
    h.apply({ t: "cycle", dir: 1 }); // balloon absent → syringe
    expect(h.view().right.at).toBe("syringe");
    expect(h.apply({ t: "select", target: "balloon" }).blocked).toEqual([{ device: "balloon", reason: "absent" }]);
  });

  it("removing the held device from the table lets go", () => {
    const h = hand(settings(), "balloon");
    h.apply(grab(true));
    const o = h.setPresent(["sheath", "catheter", "wire014"]);
    expect(o.commands).toEqual([{ kind: "grip", hand: "right", device: null }]);
    expect(h.view().right.at).toBeNull();
  });
});

describe("syringe", () => {
  it("hold-and-drag sets plunger force; pulling back aspirates; letting go stops", () => {
    const h = hand(settings(), "syringe");
    h.apply(grab(true));
    let o = h.apply(move(7.5)); // plungerTravel 15 mm
    expect(o.syringe).toEqual({ force: 0.5, port: "contrast" });
    expect(o.commands).toEqual([]);
    o = h.apply(move(-15));
    expect(o.syringe).toEqual({ force: -0.5, port: "aspirate" });
    o = h.apply(grab(false));
    expect(o.syringe).toEqual({ force: 0, port: "contrast" });
  });

  it("a plunger command away from the syringe moves the hand first", () => {
    const h = hand(settings({ switchMs: 300 }), "catheter");
    const o = h.apply({ t: "plunger", force: 0.6, source: "keyboard" });
    expect(o.syringe).toBeNull();
    expect(o.blocked).toEqual([{ device: "syringe", reason: "transition" }]);
    h.advance(400);
    expect(h.apply({ t: "plunger", force: 0.6, source: "keyboard" }).syringe).toEqual({ force: 0.6, port: "contrast" });
    expect(h.apply({ t: "port", port: "saline" }).syringe).toEqual({ force: 0.6, port: "saline" });
  });
});

describe("snapshot", () => {
  it("restore reproduces the same commands", () => {
    const h = hand(settings({ switchMs: 200 }), "catheter");
    h.apply(grab(true));
    h.apply(move(12, 4));
    const snap = h.snapshot();
    const run = () => {
      const out: HandCommand[] = [];
      out.push(...h.apply(move(20, 9)).commands);
      out.push(...h.apply({ t: "pin", target: "auto", on: true, source: "k" }).commands);
      out.push(...h.apply(grab(false)).commands);
      out.push(...h.apply({ t: "selectIndex", index: 3 }).commands);
      h.advance(250);
      out.push(...h.apply(grab(true)).commands);
      out.push(...h.apply(move(3)).commands);
      return out;
    };
    const a = run();
    h.restore(snap);
    const b = run();
    expect(b).toEqual(a);
    expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);
  });
});

// ---------------------------------------------------------------- pedals

describe("pedals", () => {
  it("OR across sources; one source letting go does not drop another's pedal", () => {
    const m = new PedalMerger();
    expect(m.set("keyboard", "fluoro", true)).toEqual({ fluoro: true, cine: false });
    expect(m.set("midi:1", "fluoro", true)).toBeNull();
    expect(m.set("keyboard", "fluoro", false)).toBeNull();
    expect(m.state().fluoro).toBe(true);
    expect(m.releaseSource("midi:1")).toEqual({ fluoro: false, cine: false });
    expect(m.set("gamepad:0", "cine", true)).toEqual({ fluoro: false, cine: true });
    expect(m.holders("cine")).toEqual(["gamepad:0"]);
    expect(m.releaseAll()).toEqual({ fluoro: false, cine: false });
  });

  it("hysteresis for analog triggers", () => {
    expect(hysteresis(false, 0.45, 0.5, 0.3)).toBe(false);
    expect(hysteresis(false, 0.5, 0.5, 0.3)).toBe(true);
    expect(hysteresis(true, 0.35, 0.5, 0.3)).toBe(true);
    expect(hysteresis(true, 0.3, 0.5, 0.3)).toBe(false);
    expect(hysteresis(true, NaN, 0.5, 0.3)).toBe(false);
  });

  it("every source maps to the same pedal state and a release stops the beam synchronously", () => {
    const sys = createInputSystem({ storage: null, settings: settings(), getPads: () => [] });
    const log: string[] = [];
    sys.bus.on("pedal", (p) => log.push(`${p.fluoro ? "F" : "-"}${p.cine ? "C" : "-"}`));
    // keyboard
    sys.keyboard.keyDown("KeyF");
    expect(sys.pedalState().fluoro).toBe(true);
    sys.keyboard.keyUp("KeyF");
    expect(log).toEqual(["F-", "--"]); // emitted inside the key handler: no frame needed
    // MIDI sustain pedal
    sys.midi.handle([0xb0, 64, 127]);
    sys.midi.handle([0xb0, 64, 0]);
    // gamepad trigger via the system's poll
    // HID torquer pedal bits
    const tq = torquerIntents({ ...encodeless(), cine: true }, emptyTorquerMemory(), 2400, "torquer:x");
    tq.forEach((i) => sys.emit(i));
    sys.emit({ t: "releaseSource", source: "torquer:x" });
    expect(log).toEqual(["F-", "--", "F-", "--", "-C", "--"]);
    // blur releases a held key
    sys.keyboard.keyDown("KeyC");
    sys.keyboard.releaseAll();
    expect(sys.pedalState()).toEqual({ fluoro: false, cine: false });
  });
});

function encodeless() {
  return { rollCounts: 0, pushUm: 0, grip: false, pinAuto: false, pinGuide: false, fluoro: false, cine: false, plunger: 0, seq: 0 };
}

// ---------------------------------------------------------------- latency

describe("latency", () => {
  it("mouse motion reaches the bus inside the event, before any frame", () => {
    const sys = createInputSystem({ storage: null, settings: settings(), initialGrip: "catheter", getPads: () => [] });
    const q = new CommandQueue(sys.bus);
    sys.mouse.button(0, true);
    sys.mouse.movement(0, -400, "raw"); // 400 counts forward
    const cmds = q.drain();
    expect(cmds[0]).toEqual({ kind: "grip", hand: "right", device: "catheter" });
    expect(pushes(cmds)[0].mm).toBeCloseTo(12.7, 9); // 400 counts × 25.4/800 mm = half an inch, 1:1
  });

  it("held keys produce motion in the same frame call", () => {
    const sys = createInputSystem({ storage: null, settings: settings(), initialGrip: "catheter", getPads: () => [] });
    const q = new CommandQueue(sys.bus);
    sys.keyboard.keyDown("KeyW");
    sys.frame(100);
    const p = pushes(q.drain());
    expect(p[0].mm).toBeCloseTo(2, 9); // 20 mm/s × 0.1 s
  });
});

// ---------------------------------------------------------------- keyboard

describe("keyboard", () => {
  const make = () => {
    const s = settings();
    const out: Intent[] = [];
    let port: "contrast" | "saline" = "contrast";
    const kb = new KeyboardSource((i) => out.push(i), { settings: () => s, port: () => port });
    return { kb, out, s, setPort: (p: typeof port) => (port = p) };
  };

  it("held motion keys grab and move; fine key slows; repeat is ignored", () => {
    const { kb, out } = make();
    expect(kb.keyDown("KeyW")).toBe(true);
    expect(kb.keyDown("KeyW", true)).toBe(true);
    expect(out.filter((i) => i.t === "grab")).toEqual([{ t: "grab", on: true, source: "keyboard" }]);
    kb.keyDown("ShiftLeft");
    kb.frame(0.1);
    const m = out.find((i) => i.t === "move") as Extract<Intent, { t: "move" }>;
    expect(m.axialMm).toBeCloseTo(20 * 0.25 * 0.1, 9);
    kb.keyUp("KeyW");
    expect(out[out.length - 1]).toEqual({ t: "grab", on: false, source: "keyboard" });
    expect(kb.keyDown("KeyM")).toBe(false); // unmapped
  });

  it("a long stall is capped so it cannot become a lunge", () => {
    const { kb, out } = make();
    kb.keyDown("KeyD");
    kb.frame(5);
    const m = out.find((i) => i.t === "move") as Extract<Intent, { t: "move" }>;
    expect(m.lateralMm).toBeCloseTo(15 * 0.1, 9);
  });

  it("syringe keys ramp force and release to zero", () => {
    const { kb, out } = make();
    kb.keyDown("KeyJ");
    for (let i = 0; i < 12; i++) kb.frame(0.05);
    const forces = out.filter((i): i is Extract<Intent, { t: "plunger" }> => i.t === "plunger").map((i) => i.force);
    expect(forces[0]).toBeCloseTo(0.07, 9); // 0.7 over 0.5 s, 50 ms step
    expect(forces.length).toBe(10); // reaches the target, then stops emitting
    expect(forces[forces.length - 1]).toBeCloseTo(0.7, 9);
    kb.keyUp("KeyJ");
    expect(out[out.length - 1]).toEqual({ t: "plunger", force: 0, source: "keyboard" });
  });

  it("arrows are dead-man C-arm velocity; with the fine key they pan the table", () => {
    const { kb, out } = make();
    kb.keyDown("ArrowRight");
    expect(out[out.length - 1]).toEqual({ t: "carm", laoDegPerS: 8, cranDegPerS: 0, source: "keyboard" });
    kb.keyUp("ArrowRight");
    expect(out[out.length - 1]).toEqual({ t: "carm", laoDegPerS: 0, cranDegPerS: 0, source: "keyboard" });
    kb.keyDown("ShiftLeft");
    kb.keyDown("ArrowUp");
    expect(out[out.length - 1]).toEqual({ t: "table", xMmPerS: 0, yMmPerS: 40, source: "keyboard" });
  });

  it("port toggle and grip keys", () => {
    const { kb, out, setPort } = make();
    kb.keyDown("KeyP");
    expect(out[out.length - 1]).toEqual({ t: "port", port: "saline" });
    setPort("saline");
    kb.keyUp("KeyP");
    kb.keyDown("KeyP");
    expect(out[out.length - 1]).toEqual({ t: "port", port: "contrast" });
    kb.keyDown("Digit3");
    expect(out[out.length - 1]).toEqual({ t: "selectIndex", index: 3 });
  });
});

// ---------------------------------------------------------------- mouse

describe("pointer-lock mouse", () => {
  const make = () => {
    const s = settings();
    s.calibration["mouse:raw"] = { mmPerCount: 0.05, method: "measured" };
    s.calibration["mouse:css"] = { mmPerCount: 0.25, method: "measured" };
    const out: Intent[] = [];
    const m = new PointerLockMouse((i) => out.push(i), { settings: () => s });
    return { m, out, s };
  };

  it("uses the calibration of the active mode; forward is +axial", () => {
    const { m, out } = make();
    m.lockChanged(true, "raw");
    m.button(0, true);
    m.movement(10, -20);
    expect(out[out.length - 1]).toEqual({ t: "move", axialMm: 1, lateralMm: 0.5, source: "mouse" });
    m.movement(4, 0, "css");
    expect(out[out.length - 1]).toEqual({ t: "move", axialMm: 0, lateralMm: 1, source: "mouse" });
  });

  it("right button is the pin modifier; losing the lock releases everything", () => {
    const { m, out } = make();
    m.lockChanged(true, "raw");
    m.button(0, true);
    m.button(2, true);
    expect(out).toContainEqual({ t: "pin", target: "auto", on: true, source: "mouse" });
    m.lockChanged(false);
    expect(out[out.length - 1]).toEqual({ t: "releaseSource", source: "mouse" });
    expect(m.currentMode).toBe("css");
  });

  it("several attached elements never double-count movement", () => {
    const { m, out } = make();
    const doc = Object.assign(new EventTarget(), { pointerLockElement: null, exitPointerLock() {}, defaultView: null });
    const el1 = Object.assign(new EventTarget(), { ownerDocument: doc }) as unknown as HTMLElement;
    const el2 = Object.assign(new EventTarget(), { ownerDocument: doc }) as unknown as HTMLElement;
    const s = m as unknown as { ctx: { settings(): InputSettings } };
    s.ctx.settings().pointerLock.enabled = false; // plain drag, no lock request
    const off1 = m.attach(el1);
    const off2 = m.attach(el2);
    const ev = (type: string, p: Record<string, number>) => Object.assign(new Event(type), { preventDefault() {}, ...p });
    el1.dispatchEvent(ev("mousedown", { button: 0 }));
    doc.dispatchEvent(ev("mousemove", { movementX: 4, movementY: 0 }));
    expect(out.filter((i) => i.t === "move")).toEqual([{ t: "move", axialMm: 0, lateralMm: 1, source: "mouse" }]);
    doc.dispatchEvent(ev("mouseup", { button: 0 }));
    doc.dispatchEvent(ev("mousemove", { movementX: 4, movementY: 0 }));
    expect(out.filter((i) => i.t === "move").length).toBe(1);
    off1();
    off2();
    el2.dispatchEvent(ev("mousedown", { button: 0 }));
    expect(out.filter((i) => i.t === "grab").length).toBe(2); // down and up only
  });

  it("calibration records counts and does not move devices", () => {
    const { m, out } = make();
    m.lockChanged(true, "raw");
    m.startCalibration();
    m.button(0, true);
    m.movement(300, 0);
    m.movement(556, 0);
    expect(out.filter((i) => i.t === "move" || i.t === "grab")).toEqual([]);
    expect(m.calibrationCounts()).toBe(856);
    const r = m.finishCalibration(85.6)!;
    expect(r.key).toBe("mouse:raw");
    expect(r.cal.mmPerCount).toBeCloseTo(0.1, 10);
  });
});

// ---------------------------------------------------------------- trackpad

describe("trackpad", () => {
  const make = () => {
    const s = settings();
    s.calibration.trackpad = { mmPerCount: 0.1, method: "measured" };
    const out: Intent[] = [];
    const t = new TrackpadSource((i) => out.push(i), { settings: () => s });
    return { t, out, s };
  };

  it("a swipe is a grip; silence opens the hand", () => {
    const { t, out } = make();
    t.wheel({ deltaX: 0, deltaY: 50, deltaMode: 0 }, 0);
    expect(out[0]).toEqual({ t: "grab", on: true, source: "trackpad" });
    expect(out[1]).toEqual({ t: "move", axialMm: 5, lateralMm: 0, source: "trackpad" });
    t.tick(100);
    expect(t.isGrabbing).toBe(true);
    t.tick(200);
    expect(out[out.length - 1]).toEqual({ t: "grab", on: false, source: "trackpad" });
  });

  it("line mode, natural scroll off and pinch are handled", () => {
    const { t, out, s } = make();
    s.trackpad.naturalScroll = false;
    t.wheel({ deltaX: 2, deltaY: 1, deltaMode: 1 }, 0);
    expect(out[1]).toEqual({ t: "move", axialMm: -1.6, lateralMm: 3.2, source: "trackpad" });
    expect(t.wheel({ deltaX: 0, deltaY: 5, deltaMode: 0, ctrlKey: true }, 10)).toBe(false);
  });

  it("drops smooth inertial decay but not a finger that pushes again", () => {
    const f = new MomentumFilter();
    const seq = [40, 38, 41, 30, 28.5, 27.1, 25.7, 24.4, 23.2];
    const dropped = seq.map((m) => f.push(m));
    expect(dropped.slice(0, 7).every((d) => !d)).toBe(true);
    expect(dropped[8]).toBe(true);
    expect(f.push(30)).toBe(false); // magnitude rose again
  });
});

// ---------------------------------------------------------------- gamepad

describe("gamepad", () => {
  it("radial dead zone rescales from the edge", () => {
    expect(deadzone2(0.1, 0, 0.12)).toEqual([0, 0]);
    const [x] = deadzone2(0.56, 0, 0.12);
    expect(x).toBeCloseTo(0.5, 9);
    expect(deadzone2(1, 0, 0.12)[0]).toBeCloseTo(1, 9);
  });

  it("triggers are pedals with hysteresis; release turns them off", () => {
    const s = settings();
    const mem = emptyPadMemory();
    const ctx = { atSyringe: false, port: "contrast" as const };
    let o = mapGamepad(pad({ values: { [PAD.LT]: 0.6 } }), mem, s, 1 / 60, ctx);
    expect(o).toContainEqual({ t: "pedal", pedal: "fluoro", on: true, source: "gamepad:0" });
    o = mapGamepad(pad({ values: { [PAD.LT]: 0.4 } }), mem, s, 1 / 60, ctx);
    expect(o.filter((i) => i.t === "pedal")).toEqual([]);
    o = mapGamepad(pad({ values: { [PAD.LT]: 0.1, [PAD.RT]: 1 } }), mem, s, 1 / 60, ctx);
    expect(o).toContainEqual({ t: "pedal", pedal: "fluoro", on: false, source: "gamepad:0" });
    expect(o).toContainEqual({ t: "pedal", pedal: "cine", on: true, source: "gamepad:0" });
  });

  it("left stick grips and moves; right stick is C-arm velocity; d-pad pans", () => {
    const s = settings();
    const mem = emptyPadMemory();
    const ctx = { atSyringe: false, port: "contrast" as const };
    const o = mapGamepad(pad({ axes: [0, -1, 1, 0], pressed: [PAD.right] }), mem, s, 0.1, ctx);
    expect(o).toContainEqual({ t: "grab", on: true, source: "gamepad:0" });
    const m = o.find((i) => i.t === "move") as Extract<Intent, { t: "move" }>;
    expect(m.axialMm).toBeCloseTo(3, 9); // 30 mm/s × 0.1 s
    expect(o).toContainEqual({ t: "carm", laoDegPerS: 10, cranDegPerS: 0, source: "gamepad:0" });
    expect(o).toContainEqual({ t: "table", xMmPerS: 50, yMmPerS: 0, source: "gamepad:0" });
    const back = mapGamepad(pad(), mem, s, 0.1, ctx);
    expect(back).toContainEqual({ t: "grab", on: false, source: "gamepad:0" });
    expect(back).toContainEqual({ t: "carm", laoDegPerS: 0, cranDegPerS: 0, source: "gamepad:0" });
  });

  it("on the syringe the left stick is plunger force", () => {
    const s = settings();
    const mem = emptyPadMemory();
    const o = mapGamepad(pad({ axes: [0, -0.56, 0, 0] }), mem, s, 0.1, { atSyringe: true, port: "contrast" });
    const p = o.find((i) => i.t === "plunger") as Extract<Intent, { t: "plunger" }>;
    expect(p.force).toBeCloseTo(0.5, 9);
  });

  it("button edges select grips; a vanished pad releases its pedals", () => {
    let pads: (GamepadLike | null)[] = [pad({ pressed: [PAD.A], values: { [PAD.RT]: 1 } })];
    const sys = createInputSystem({ storage: null, settings: settings(), initialGrip: "catheter", getPads: () => pads });
    sys.frame(16);
    expect(sys.view().right.at).toBe("wire014");
    expect(sys.pedalState().cine).toBe(true);
    sys.frame(16); // still held: no second cycle
    expect(sys.view().right.at).toBe("wire014");
    pads = [];
    sys.frame(16);
    expect(sys.pedalState().cine).toBe(false);
  });

  it("GamepadSource reports status", () => {
    const g = new GamepadSource(() => {}, { settings: () => settings(), padContext: () => ({ atSyringe: false, port: "contrast" }) }, () => [pad()]);
    g.poll(0.016);
    expect(g.statuses()[0]).toMatchObject({ id: "gamepad:0", connected: true });
  });
});

// ---------------------------------------------------------------- MIDI

describe("MIDI pedals", () => {
  it("parses control change and notes", () => {
    expect(parseMidi([0xb3, 64, 127])).toEqual({ type: "cc", channel: 3, number: 64, value: 127 });
    expect(parseMidi([0x90, 60, 0]).type).toBe("noteOff");
    expect(parseMidi([0x80, 60, 30]).type).toBe("noteOff");
    expect(parseMidi([0xf8]).type).toBe("other");
  });

  it("CC64 >= 64 is on, <= 63 off; default bindings", () => {
    const b = defaultSettings().midi.bindings;
    expect(midiIntents(parseMidi([0xb0, 64, 64]), b, "midi:a")).toEqual([{ t: "pedal", pedal: "fluoro", on: true, source: "midi:a" }]);
    expect(midiIntents(parseMidi([0xb0, 64, 63]), b, "midi:a")).toEqual([{ t: "pedal", pedal: "fluoro", on: false, source: "midi:a" }]);
    expect(midiIntents(parseMidi([0xb0, 67, 127]), b, "midi:a")).toEqual([{ t: "pedal", pedal: "cine", on: true, source: "midi:a" }]);
    expect(midiIntents(parseMidi([0xb0, 11, 100]), b, "midi:a")).toEqual([]);
    const plunger = midiIntents(parseMidi([0xb0, 11, 127]), [{ kind: "cc", number: 11, action: "plunger" }], "m");
    expect(plunger).toEqual([{ t: "plunger", force: 1, source: "m" }]);
  });

  it("learn binds the next pedal pressed", async () => {
    const s = defaultSettings();
    const src = new MidiPedalSource(() => {}, { bindings: () => s.midi.bindings });
    const p = src.learn("cine", 1000);
    src.handle([0xb0, 4, 10]); // a release / low value is not a press
    src.handle([0x91, 36, 90]);
    await expect(p).resolves.toEqual({ kind: "note", number: 36, channel: 1, action: "cine" });
  });
});

// ---------------------------------------------------------------- HID / torquer

describe("HID foot switches and torquer", () => {
  it("torquer report round trip and mapping", () => {
    const v = encodeTorquerReport({ rollCounts: 600, pushUm: -1500, grip: true, pinAuto: false, pinGuide: true, fluoro: true, cine: false, plunger: 0.5, seq: 7 });
    const r = parseTorquerReport(1, v)!;
    expect(r).toMatchObject({ rollCounts: 600, pushUm: -1500, grip: true, pinGuide: true, fluoro: true, cine: false, seq: 7 });
    expect(r.plunger).toBeCloseTo(128 / 255, 9);
    expect(parseTorquerReport(2, v)).toBeNull();
    const mem = emptyTorquerMemory();
    const it = torquerIntents(r, mem, 2400, "torquer:x");
    expect(it[0]).toEqual({ t: "grab", on: true, source: "torquer:x" }); // grip before motion
    expect(it).toContainEqual({ t: "move", axialMm: -1.5, lateralMm: 0, source: "torquer:x" });
    const roll = it.find((i) => i.t === "roll") as Extract<Intent, { t: "roll" }>;
    expect(roll.rad).toBeCloseTo(Math.PI / 2, 12);
    torquerIntents({ ...r, seq: 10 }, mem, 2400, "torquer:x");
    expect(mem.dropped).toBe(2);
  });

  it("learns a pedal bit and maps it without repeats", () => {
    expect(diffBits(new Uint8Array([0, 0]), new Uint8Array([0, 4]))).toEqual([{ byte: 1, mask: 4, set: true }]);
    const b = { device: "0001:0002", reportId: 0, byte: 1, mask: 4, activeHigh: true, action: "fluoro" as const };
    expect(bindingPressed(b, 0, new Uint8Array([0, 4]))).toBe(true);
    expect(bindingPressed(b, 3, new Uint8Array([0, 4]))).toBeNull();
    const held = new Map<string, boolean>();
    expect(hidSwitchIntents("0001:0002", 0, new Uint8Array([0, 4]), [b], held, "hid:x")).toEqual([{ t: "pedal", pedal: "fluoro", on: true, source: "hid:x" }]);
    expect(hidSwitchIntents("0001:0002", 0, new Uint8Array([0, 5]), [b], held, "hid:x")).toEqual([]);
    expect(hidSwitchIntents("0001:0002", 0, new Uint8Array([0, 0]), [b], held, "hid:x")).toEqual([{ t: "pedal", pedal: "fluoro", on: false, source: "hid:x" }]);
  });

  it("an open device feeds pedals, learn works, and unplugging releases", async () => {
    const s = defaultSettings();
    const out: Intent[] = [];
    const listeners: ((e: { reportId: number; data: DataView }) => void)[] = [];
    const dev: HIDDeviceLike = {
      vendorId: 1,
      productId: 2,
      productName: "Foot switch",
      opened: false,
      collections: [{ usagePage: 0x0c, usage: 1 }],
      async open() {
        this.opened = true;
      },
      async close() {},
      async sendReport() {},
      addEventListener: (_t, cb) => listeners.push(cb),
      removeEventListener: () => {},
    };
    const hid = new HidPedalSource((i) => out.push(i), { settings: () => s });
    await hid.add(dev);
    hid.report("0001:0002", 0, new DataView(new Uint8Array([0, 0]).buffer)); // resting report before learning
    const learnt = hid.learn("cine", 1000);
    hid.report("0001:0002", 0, new DataView(new Uint8Array([0, 2]).buffer));
    const b = await learnt;
    expect(b).toEqual({ device: "0001:0002", reportId: 0, byte: 1, mask: 2, activeHigh: true, action: "cine" });
    s.hid.bindings = [b];
    hid.report("0001:0002", 0, new DataView(new Uint8Array([0, 0]).buffer));
    hid.report("0001:0002", 0, new DataView(new Uint8Array([0, 2]).buffer));
    expect(out).toContainEqual({ t: "pedal", pedal: "cine", on: true, source: "hid:0001:0002" });
    hid.disconnectAll();
    expect(out).toContainEqual({ t: "releaseSource", source: "hid:0001:0002" });
    expect(listeners.length).toBe(1);
    expect(TORQUER_USAGE_PAGE).toBe(0xff00);
    expect(TORQUER_USAGE).toBe(1);
  });
});

// ---------------------------------------------------------------- haptics

describe("haptics", () => {
  it("pseudo-haptic target falls monotonically with force", () => {
    let prev = 1.0001;
    for (let f = 0; f <= 5; f += 0.25) {
      const g = pseudoTarget(f, DEFAULT_PSEUDO.axialHalf, DEFAULT_PSEUDO.gMin);
      expect(g).toBeLessThan(prev);
      expect(g).toBeGreaterThanOrEqual(DEFAULT_PSEUDO.gMin);
      prev = g;
    }
    expect(pseudoTarget(DEFAULT_PSEUDO.axialHalf, DEFAULT_PSEUDO.axialHalf, 0.3)).toBeCloseTo(0.65, 9);
    expect(pseudoTarget(2, 0.5, 0.3, 0)).toBe(1); // strength 0 disables
  });

  it("pushing against resistance lowers the gain smoothly (no step)", () => {
    const p = new PseudoHapticGain();
    const dt = 1 / 60;
    const target = pseudoTarget(1.5, DEFAULT_PSEUDO.axialHalf, DEFAULT_PSEUDO.gMin);
    const maxStep = (1 - target) * (1 - Math.exp(-dt / DEFAULT_PSEUDO.tauS));
    let prev = 1;
    for (let i = 0; i < 60; i++) {
      p.feed({ device: "catheter", axial: 1.5, torsion: 0, snap: false, wedged: false });
      const g = p.step(dt).push;
      expect(g).toBeLessThanOrEqual(prev + 1e-12);
      expect(prev - g).toBeLessThanOrEqual(maxStep + 1e-12);
      prev = g;
    }
    expect(prev).toBeCloseTo(target, 3);
    // physics stops reporting: feel relaxes back towards 1
    for (let i = 0; i < 120; i++) prev = p.step(dt).push;
    expect(prev).toBeGreaterThan(0.99);
  });

  it("rumble amplitude scales with contact force; snaps pulse at once; throttled", () => {
    const a = rumbleAmplitude({ device: "catheter", axial: 0.75, torsion: 0, snap: false, wedged: false, contact: 0.3 });
    expect(a.strong).toBeCloseTo(0.75 / DEFAULT_RUMBLE.axialSat, 9);
    expect(a.weak).toBeCloseTo(0.3 / DEFAULT_RUMBLE.contactSat, 9);
    const r = new RumbleMapper();
    const f = { device: "catheter" as const, axial: 1.5, torsion: 0, snap: false, wedged: false };
    expect(r.step(f, 0)).toEqual({ strongMagnitude: 1, weakMagnitude: 0, duration: DEFAULT_RUMBLE.durationMs });
    expect(r.step(f, 40)).toBeNull(); // throttled
    expect(r.step({ ...f, snap: true }, 50)).toEqual(DEFAULT_RUMBLE.snap);
    expect(r.step({ ...f, axial: 0 }, 200)).toEqual({ strongMagnitude: 0, weakMagnitude: 0, duration: 0 });
    expect(r.step({ ...f, axial: 0 }, 400)).toBeNull(); // silence is not repeated
  });

  it("controller drives sinks and the system scales mouse push by the gain", () => {
    const played: RumbleEffect[] = [];
    const h = new HapticsController();
    h.addSink({ play: (e) => played.push(e) });
    h.feed({ device: "catheter", axial: 0, torsion: 0, snap: true, wedged: false });
    h.step(1 / 60, 0);
    expect(played[0]).toEqual(DEFAULT_RUMBLE.snap);

    const sys = createInputSystem({ storage: null, settings: settings(), initialGrip: "catheter", getPads: () => [] });
    const q = new CommandQueue(sys.bus);
    for (let i = 0; i < 60; i++) {
      sys.feedReaction({ device: "catheter", axial: 3, torsion: 0, snap: false, wedged: false });
      sys.frame(1000 / 60);
    }
    sys.mouse.button(0, true);
    sys.mouse.movement(0, -800, "raw");
    const mm = pushes(q.drain())[0].mm;
    expect(mm).toBeLessThan(25.4 * 0.6);
    expect(mm).toBeGreaterThan(25.4 * DEFAULT_PSEUDO.gMin);
  });

  it("torquer output report encodes brake and rumble", () => {
    expect(Array.from(torquerOutputReport(0.5, { strongMagnitude: 1, weakMagnitude: 0.2, duration: 120 }))).toEqual([128, 255, 30, 0]);
    expect(Array.from(torquerOutputReport(2, null))).toEqual([255, 0, 0, 0]);
  });
});

// ---------------------------------------------------------------- queue / adapters

describe("command queue and legacy adapters", () => {
  it("coalesces motion per device without crossing grips or pins", () => {
    const q = new CommandQueue();
    q.push({ kind: "push", device: "catheter", mm: 1 });
    q.push({ kind: "torque", device: "catheter", rad: 0.1 });
    q.push({ kind: "push", device: "catheter", mm: 2 });
    q.push({ kind: "pin", device: "wire014", on: true });
    q.push({ kind: "push", device: "catheter", mm: 3 });
    expect(q.drain()).toEqual([
      { kind: "push", device: "catheter", mm: 3 },
      { kind: "torque", device: "catheter", rad: 0.1 },
      { kind: "pin", device: "wire014", on: true },
      { kind: "push", device: "catheter", mm: 3 },
    ]);
    expect(q.length).toBe(0);
  });

  it("maps commands to the legacy engines", () => {
    const d = { commandInsertion: vi.fn(), commandTorque: vi.fn(), commandWire: vi.fn(), setFluoroLive: vi.fn() };
    applyToDiagnostic({ kind: "push", device: "catheter", mm: 4 }, d);
    applyToDiagnostic({ kind: "torque", device: "catheter", rad: 0.5 }, d);
    applyToDiagnostic({ kind: "push", device: "wire035", mm: 2 }, d);
    expect(d.commandInsertion).toHaveBeenCalledWith(4);
    expect(d.commandTorque).toHaveBeenCalledWith(0.5);
    expect(d.commandWire).toHaveBeenCalledWith(2);
    const p = { moveWire: vi.fn(), torqueWire: vi.fn(), moveDevice: vi.fn() };
    applyToPci({ kind: "push", device: "balloon", mm: 3 }, p);
    applyToPci({ kind: "torque", device: "wire014", rad: 1 }, p);
    expect(p.moveDevice).toHaveBeenCalledWith(3);
    expect(p.torqueWire).toHaveBeenCalledWith(1);
  });
});

describe("system routing", () => {
  it("sums C-arm velocity across sources and zeroes on release", () => {
    const sys = createInputSystem({ storage: null, settings: settings(), getPads: () => [] });
    const v: number[] = [];
    sys.bus.on("carm", (c) => v.push(c.laoDegPerS));
    sys.emit({ t: "carm", laoDegPerS: 5, cranDegPerS: 0, source: "a" });
    sys.emit({ t: "carm", laoDegPerS: 3, cranDegPerS: 0, source: "b" });
    sys.emit({ t: "releaseSource", source: "a" });
    sys.releaseAll();
    expect(v).toEqual([5, 8, 3, 0]);
  });

  it("a zero plunger from another source does not cancel the holder's push", () => {
    const sys = createInputSystem({ storage: null, settings: settings(), initialGrip: "syringe", getPads: () => [] });
    const got: number[] = [];
    sys.bus.on("syringe", (s) => got.push(s.force));
    sys.emit({ t: "plunger", force: 0.6, source: "keyboard" });
    sys.emit({ t: "plunger", force: 0, source: "midi:x" });
    sys.emit({ t: "releaseSource", source: "keyboard" });
    expect(got).toEqual([0.6, 0]);
  });

  it("calibration persists through the system", () => {
    const st = new MemStorage();
    const sys = createInputSystem({ storage: st, getPads: () => [] });
    sys.setCalibration("mouse:raw", { mmPerCount: 0.02, method: "measured" });
    const again = createInputSystem({ storage: st, getPads: () => [] });
    expect(again.getSettings().calibration["mouse:raw"].mmPerCount).toBe(0.02);
  });
});

// ---------------------------------------------------------------- review fixes

function fakeHid(o: { torquer?: boolean; key?: [number, number] } = {}) {
  const sent: number[][] = [];
  const dev: HIDDeviceLike = {
    vendorId: o.key?.[0] ?? 1,
    productId: o.key?.[1] ?? 2,
    productName: o.torquer ? "Torquer" : "Foot switch",
    opened: false,
    collections: o.torquer ? [{ usagePage: TORQUER_USAGE_PAGE, usage: TORQUER_USAGE }] : [{ usagePage: 0x0c, usage: 1 }],
    async open() {
      this.opened = true;
    },
    async close() {},
    async sendReport(_id: number, data: BufferSource) {
      sent.push(Array.from(new Uint8Array(data as ArrayBuffer)));
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  return { dev, sent };
}
const bytes = (...b: number[]) => new DataView(new Uint8Array(b).buffer);

describe("haptics go quiet when reactions stop", () => {
  it("rumble: one reaction then silence plays a zero effect and nothing after it", () => {
    const played: RumbleEffect[] = [];
    const h = new HapticsController();
    h.addSink({ play: (e) => played.push(e) });
    h.feed({ device: "catheter", axial: 1.2, torsion: 0, snap: false, wedged: false });
    const dt = 1 / 60;
    let now = 0;
    for (let i = 0; i < 600; i++) {
      h.step(dt, now);
      now += dt * 1000;
    }
    const last = played[played.length - 1];
    expect(last).toEqual({ strongMagnitude: 0, weakMagnitude: 0, duration: 0 });
    expect(played.filter((e) => e.strongMagnitude === 0 && e.weakMagnitude === 0).length).toBe(1);
    // sustained effects only while the reaction was fresh (staleS / interval, plus the first)
    const loud = played.filter((e) => e.strongMagnitude > 0);
    expect(loud.length).toBeLessThanOrEqual(Math.ceil((DEFAULT_PSEUDO.staleS * 1000) / DEFAULT_RUMBLE.intervalMs) + 1);
    expect(loud[0].strongMagnitude).toBeCloseTo(0.8, 9);
    expect(h.current()).toBeNull();
  });

  it("rumble turned off while buzzing sends one zero effect", () => {
    const played: RumbleEffect[] = [];
    const h = new HapticsController();
    h.addSink({ play: (e) => played.push(e) });
    h.feed({ device: "catheter", axial: 1.5, torsion: 0, snap: false, wedged: false });
    h.step(1 / 60, 0);
    h.enabledRumble = false;
    h.feed({ device: "catheter", axial: 1.5, torsion: 0, snap: false, wedged: false });
    h.step(1 / 60, 100);
    h.step(1 / 60, 200);
    expect(played.map((e) => e.strongMagnitude)).toEqual([1, 0]);
  });

  it("torquer brake drops to 0 when reactions go stale and is sent only on change", async () => {
    let t = 0;
    const sys = createInputSystem({ storage: null, settings: settings(), getPads: () => [], now: () => t });
    const { dev, sent } = fakeHid({ torquer: true });
    await sys.hid.add(dev);
    sys.feedReaction({ device: "catheter", axial: 1.5, torsion: 0, snap: false, wedged: false });
    for (let i = 0; i < 60; i++) {
      sys.frame(1000 / 60);
      t += 1000 / 60;
    }
    expect(sent[0]).toEqual([255, 0, 0, 0]);
    expect(sent[sent.length - 1]).toEqual([0, 0, 0, 0]);
    expect(sent.length).toBe(2); // engage once, release once; no per-frame resend
    // a fresh load re-engages; releaseAll lets go at once
    sys.feedReaction({ device: "catheter", axial: 0.75, torsion: 0, snap: false, wedged: false });
    sys.frame(16);
    t += 16;
    expect(sent[sent.length - 1]).toEqual([128, 0, 0, 0]);
    sys.releaseAll();
    expect(sent[sent.length - 1]).toEqual([0, 0, 0, 0]);
  });
});

describe("releaseAll releases every source", () => {
  it("a gamepad grip, pin and pedal are released and stay released until let go", () => {
    const held = pad({ axes: [0, -1, 0, 0], pressed: [PAD.LB], values: { [PAD.RT]: 1 } });
    let pads: (GamepadLike | null)[] = [held];
    const sys = createInputSystem({ storage: null, settings: settings(), initialGrip: "balloon", getPads: () => pads });
    const q = new CommandQueue(sys.bus);
    sys.frame(16);
    expect(sys.view().right.gripped).toBe(true);
    expect(sys.view().left.pinnedDevice).toBe("wire014");
    expect(sys.pedalState().cine).toBe(true);
    q.drain();

    sys.releaseAll();
    expect(sys.view().right.gripped).toBe(false);
    expect(sys.view().left.pinnedDevice).toBeNull();
    expect(sys.pedalState().cine).toBe(false);
    const cmds = q.drain();
    expect(cmds).toContainEqual({ kind: "grip", hand: "right", device: null });
    expect(cmds).toContainEqual({ kind: "pin", device: "wire014", on: false });

    // still held after the pause: nothing comes back
    sys.frame(16);
    sys.frame(16);
    expect(sys.view().right.gripped).toBe(false);
    expect(sys.view().left.pinnedDevice).toBeNull();
    expect(sys.pedalState().cine).toBe(false);
    expect(pushes(q.drain())).toEqual([]);

    // let go, then press again: it works
    pads = [pad()];
    sys.frame(16);
    pads = [held];
    sys.frame(16);
    expect(sys.view().right.gripped).toBe(true);
    expect(sys.view().left.pinnedDevice).toBe("wire014");
    expect(sys.pedalState().cine).toBe(true);
  });

  it("latched pad memory ignores a held trigger until it falls below the off threshold", () => {
    const s = settings();
    const mem = emptyPadMemory();
    const ctx = { atSyringe: false, port: "contrast" as const };
    latchPadMemory(mem);
    expect(mapGamepad(pad({ values: { [PAD.LT]: 1 } }), mem, s, 1 / 60, ctx).filter((i) => i.t === "pedal")).toEqual([]);
    expect(mapGamepad(pad({ values: { [PAD.LT]: s.gamepad.pedalOff + 0.05 } }), mem, s, 1 / 60, ctx).filter((i) => i.t === "pedal")).toEqual([]);
    mapGamepad(pad(), mem, s, 1 / 60, ctx);
    expect(mapGamepad(pad({ values: { [PAD.LT]: 1 } }), mem, s, 1 / 60, ctx)).toContainEqual({ t: "pedal", pedal: "fluoro", on: true, source: "gamepad:0" });
  });

  it("torquer grip, pin and pedal are released and latched", async () => {
    const sys = createInputSystem({ storage: null, settings: settings(), initialGrip: "catheter", getPads: () => [] });
    const { dev } = fakeHid({ torquer: true });
    await sys.hid.add(dev);
    const key = "0001:0002";
    const rep = (seq: number, o: Partial<{ grip: boolean; pinGuide: boolean; fluoro: boolean; pushUm: number }>) =>
      sys.hid.report(key, 1, encodeTorquerReport({ rollCounts: 0, pushUm: o.pushUm ?? 0, grip: !!o.grip, pinAuto: false, pinGuide: !!o.pinGuide, fluoro: !!o.fluoro, cine: false, plunger: 0, seq }));
    sys.setPresent(["sheath", "catheter", "wire014"]);
    sys.emit({ t: "select", target: "wire014" });
    rep(1, { grip: true, pinGuide: true, fluoro: true });
    expect(sys.view().right.gripped).toBe(true);
    expect(sys.view().left.pinnedDevice).toBe("catheter");
    expect(sys.pedalState().fluoro).toBe(true);
    sys.releaseAll();
    expect(sys.view().right.gripped).toBe(false);
    expect(sys.view().left.pinnedDevice).toBeNull();
    expect(sys.pedalState().fluoro).toBe(false);
    rep(2, { grip: true, pinGuide: true, fluoro: true, pushUm: 2000 });
    expect(sys.view().right.gripped).toBe(false);
    expect(sys.pedalState().fluoro).toBe(false);
    rep(3, {});
    rep(4, { grip: true, fluoro: true });
    expect(sys.view().right.gripped).toBe(true);
    expect(sys.pedalState().fluoro).toBe(true);
  });

  it("latchTorquerMemory keeps sequence tracking", () => {
    const mem = emptyTorquerMemory();
    const r = parseTorquerReport(1, encodeTorquerReport({ rollCounts: 0, pushUm: 0, grip: true, pinAuto: false, pinGuide: false, fluoro: false, cine: false, plunger: 0.8, seq: 5 }))!;
    torquerIntents(r, mem, 2400, "t");
    latchTorquerMemory(mem);
    expect(torquerIntents({ ...r, seq: 6 }, mem, 2400, "t")).toEqual([]);
    expect(mem.dropped).toBe(0);
    expect(torquerIntents({ ...r, seq: 7, grip: false, plunger: 0 }, mem, 2400, "t")).toEqual([]);
    expect(torquerIntents({ ...r, seq: 8 }, mem, 2400, "t")[0]).toEqual({ t: "grab", on: true, source: "t" });
  });

  it("HandState.releaseAll opens the hand, stops the plunger and unpins", () => {
    const h = hand(settings(), "syringe");
    h.apply({ t: "pin", target: "guide", on: true, source: "gamepad:0" });
    h.apply({ t: "plunger", force: 0.7, source: "gamepad:0" });
    const o = h.releaseAll();
    expect(o.syringe).toEqual({ force: 0, port: "contrast" });
    expect(o.commands).toContainEqual({ kind: "pin", device: "catheter", on: false });
    expect(h.view().right.plungerForce).toBe(0);
    expect(h.releaseAll().commands).toEqual([]); // idempotent
  });
});

describe("pins held by several sources", () => {
  it("the pin stays until the last holder lets go", () => {
    const h = hand(settings(), "balloon");
    h.apply({ t: "pin", target: "wire", on: true, source: "keyboard" });
    h.apply({ t: "pin", target: "auto", on: true, source: "mouse" }); // resolves to the same wire
    expect(h.apply({ t: "pin", target: "wire", on: false, source: "keyboard" }).commands).toEqual([]);
    expect(h.view().left.pinnedDevice).toBe("wire014");
    h.apply(grab(true, "gamepad:0"));
    expect(h.apply({ t: "move", axialMm: 5, lateralMm: 0, source: "gamepad:0" }).commands.some((c) => c.kind === "push" && c.device === "wire014")).toBe(false);
    const off = h.apply({ t: "pin", target: "auto", on: false, source: "mouse" });
    expect(off.commands[0]).toEqual({ kind: "pin", device: "wire014", on: false });
    expect(h.view().left.pinnedDevice).toBeNull();
  });

  it("a source that does not hold the pin cannot release it, even naming the target", () => {
    const h = hand(settings(), "catheter");
    h.apply({ t: "pin", target: "guide", on: true, source: "keyboard" });
    expect(h.apply({ t: "pin", target: "guide", on: false, source: "midi:x" }).commands).toEqual([]);
    expect(h.apply({ t: "releaseSource", source: "midi:x" }).commands).toEqual([]);
    expect(h.view().left.pinnedDevice).toBe("catheter");
  });

  it("snapshots carry all holders and old snapshots with pinSource still restore", () => {
    const h = hand(settings(), "balloon");
    h.apply({ t: "pin", target: "wire", on: true, source: "keyboard" });
    h.apply({ t: "pin", target: "wire", on: true, source: "mouse" });
    const snap = h.snapshot();
    expect(snap.pinHolders).toEqual(["keyboard", "mouse"]);
    expect(snap.pinSource).toBe("keyboard");
    const old = { ...snap, pinHolders: undefined, pinSource: "mouse" };
    const g = hand(settings(), "balloon");
    g.restore(old);
    expect(g.apply({ t: "pin", target: "wire", on: false, source: "keyboard" }).commands).toEqual([]);
    expect(g.apply({ t: "pin", target: "wire", on: false, source: "mouse" }).commands[0]).toEqual({ kind: "pin", device: "wire014", on: false });
  });
});

describe("HID learn needs two real reports", () => {
  it("a constant status bit in the first report is not taken for the pedal", async () => {
    const { dev } = fakeHid();
    const hid = new HidPedalSource(() => {}, { settings: () => defaultSettings() });
    await hid.add(dev);
    const learnt = hid.learn("fluoro", 1000);
    hid.report("0001:0002", 0, bytes(0x80, 0)); // first report: constant status bit, no baseline yet
    hid.report("0001:0002", 0, bytes(0x80, 0)); // repeats: device reports continuously, so this is rest
    hid.report("0001:0002", 0, bytes(0x80, 4)); // pedal
    await expect(learnt).resolves.toEqual({ device: "0001:0002", reportId: 0, byte: 1, mask: 4, activeHigh: true, action: "fluoro" });
  });

  it("a device that reports only on change: the first report was the press", async () => {
    const { dev } = fakeHid();
    const hid = new HidPedalSource(() => {}, { settings: () => defaultSettings() });
    await hid.add(dev);
    const learnt = hid.learn("cine", 1000);
    hid.report("0001:0002", 0, bytes(0, 8)); // press
    hid.report("0001:0002", 0, bytes(0, 0)); // release
    await expect(learnt).resolves.toMatchObject({ byte: 1, mask: 8, activeHigh: true });
  });

  it("an active-low switch with a known resting report", async () => {
    const { dev } = fakeHid();
    const hid = new HidPedalSource(() => {}, { settings: () => defaultSettings() });
    await hid.add(dev);
    hid.report("0001:0002", 0, bytes(0, 0xff));
    const learnt = hid.learn("cine", 1000);
    hid.report("0001:0002", 0, bytes(0, 0xfd));
    await expect(learnt).resolves.toMatchObject({ byte: 1, mask: 2, activeHigh: false });
  });
});
