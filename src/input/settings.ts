// ---------------------------------------------------------------------------
// Input settings: per-device calibration, gains, grip geometry, key map and
// learned pedal bindings. Persisted to localStorage (wrapped: storage can be
// missing or throw in private windows), merged over defaults and validated so a
// corrupt or older record can never produce NaN gains.
//
// Every numeric default below is a MODEL PARAMETER unless its comment names a
// fact in docs/realism/facts/S8.md. Calibration replaces the mouse and trackpad
// defaults with measured values.
// ---------------------------------------------------------------------------

import type { DeviceSlot, GripTarget, StorageLike } from "./types";

export const SETTINGS_KEY = "cathmaster.input.v1";

/** 1 inch = 25.4 mm exactly (definition; facts S8 F9). */
export const MM_PER_INCH = 25.4;
/** CSS reference: 1in = 96px (CSS Values 4; facts S8 F8). Real screens differ, hence the card match. */
export const CSS_PX_PER_MM = 96 / MM_PER_INCH;
/** ISO/IEC 7810 ID-1 card long edge, mm (facts S8 F7). Used as the calibration distance. */
export const ID1_CARD_LONG_MM = 85.6;
export const ID1_CARD_SHORT_MM = 53.98;

/** Calibration of one physical device: millimetres of hand travel per reported count. */
export interface DeviceCalibration {
  mmPerCount: number;
  method: "default" | "measured";
  /** ISO time of the measurement */
  at?: string;
  /** counts recorded during the measurement (sanity record) */
  counts?: number;
}

/** Geometry of what the fingers hold, used to turn fingertip travel into rotation. */
export interface GripGeometry {
  /** diameter rolled between the fingers, mm (theta = 2 * dx / D) */
  diameterMm: number;
  /** fingertip travel available before a regrip, mm (total, centred on the grasp) */
  rollSpanMm: number;
  /** hand travel available along the device before a regrip, mm (total, centred) */
  pushSpanMm: number;
}

export interface MidiBinding {
  kind: "cc" | "note";
  number: number;
  /** 0-15, or undefined for any channel */
  channel?: number;
  action: "fluoro" | "cine" | "pinAuto" | "plunger";
}

export interface HidBinding {
  /** "vendorId:productId" in hex */
  device: string;
  reportId: number;
  byte: number;
  mask: number;
  /** pressed when the masked bits are set (true) or cleared (false) */
  activeHigh: boolean;
  action: "fluoro" | "cine" | "pinAuto";
}

export type KeyAction =
  | "pedalFluoro"
  | "pedalCine"
  | "advance"
  | "withdraw"
  | "rollCw"
  | "rollCcw"
  | "pinAuto"
  | "pinWire"
  | "pinGuide"
  | "pinSheath"
  | "grip1"
  | "grip2"
  | "grip3"
  | "grip4"
  | "grip5"
  | "gripNext"
  | "inject"
  | "flush"
  | "aspirate"
  | "portToggle"
  | "carmLao"
  | "carmRao"
  | "carmCran"
  | "carmCaud"
  | "fine";

/** KeyboardEvent.code values (physical key positions, layout independent). */
export type Keymap = Record<KeyAction, string[]>;

export const DEFAULT_KEYMAP: Keymap = {
  pedalFluoro: ["KeyF"],
  pedalCine: ["KeyC"],
  advance: ["KeyW"],
  withdraw: ["KeyS"],
  rollCw: ["KeyD"],
  rollCcw: ["KeyA"],
  pinAuto: ["Space"],
  pinWire: ["KeyQ"],
  pinGuide: ["KeyE"],
  pinSheath: ["KeyZ"],
  grip1: ["Digit1"],
  grip2: ["Digit2"],
  grip3: ["Digit3"],
  grip4: ["Digit4"],
  grip5: ["Digit5"],
  gripNext: ["Tab"],
  inject: ["KeyJ"],
  flush: ["KeyK"],
  aspirate: ["KeyL"],
  portToggle: ["KeyP"],
  carmLao: ["ArrowRight"],
  carmRao: ["ArrowLeft"],
  carmCran: ["ArrowUp"],
  carmCaud: ["ArrowDown"],
  fine: ["ShiftLeft", "ShiftRight"],
};

export interface InputSettings {
  version: 1;
  /** keyed by device: "mouse:raw" (pointer lock, unadjusted), "mouse:os" (pointer lock, OS acceleration), "mouse:css" (drag without lock), "trackpad" */
  calibration: Record<string, DeviceCalibration>;
  /** measured screen scale (CSS px per real mm) from the card match, or null */
  screenPxPerMm: number | null;
  gains: {
    /** device mm per hand mm (1 = 1:1) */
    push: number;
    /** multiplier on theta = 2 dx / D */
    roll: number;
    invertPush: boolean;
    invertRoll: boolean;
  };
  grip: {
    /** per-target geometry overrides; missing targets use DEFAULT_GRIP_GEOMETRY */
    geometry: Partial<Record<GripTarget, GripGeometry>>;
    /** a torque device is clamped on the coronary wire */
    torqueDevice: boolean;
    /** time the hand takes to move between devices, ms */
    switchMs: number;
    /**
     * Emit wire drag when an over-the-wire device moves and the wire is not pinned.
     * Only for the legacy engine; the rod physics produces drag from friction.
     */
    emulateCoupling: boolean;
    /** fraction of the device travel the unpinned wire follows (legacy emulation) */
    wireDragFraction: number;
    /** plunger travel for a full-force push, mm of hand travel */
    plungerTravelMm: number;
  };
  pointerLock: {
    enabled: boolean;
    /** ask for raw counts (requestPointerLock({unadjustedMovement:true})) */
    unadjusted: boolean;
  };
  keyboard: {
    keymap: Keymap;
    /** held-key advance speed, mm/s */
    pushMmPerS: number;
    /** held-key fingertip speed, mm/s */
    rollMmPerS: number;
    /** multiplier while the fine key is held */
    fine: number;
    /** time for a held syringe key to reach its target force, s */
    plungerRampS: number;
    /** force a held inject key builds to (fine key held: half) */
    plungerForce: number;
    carmDegPerS: number;
    tableMmPerS: number;
  };
  gamepad: {
    deadzone: number;
    pushMmPerS: number;
    rollMmPerS: number;
    carmDegPerS: number;
    tableMmPerS: number;
    /** trigger pressed above this */
    pedalOn: number;
    /** trigger released below this (hysteresis) */
    pedalOff: number;
    rumble: boolean;
  };
  trackpad: {
    enabled: boolean;
    /** a gesture ends (the hand lets go) after this much silence, ms */
    idleMs: number;
    /** drop decaying inertial-scroll events after the fingers lift */
    momentumFilter: boolean;
    /** pixels per line when deltaMode is DOM_DELTA_LINE */
    pxPerLine: number;
    /** OS "natural" scrolling: content follows the fingers (deltaY > 0 when the fingers move away) */
    naturalScroll: boolean;
  };
  haptics: {
    /** pseudo-haptic gain on (control/display ratio drops against resistance) */
    pseudo: boolean;
    /** 0..1 scaling of the pseudo-haptic effect */
    strength: number;
  };
  midi: { bindings: MidiBinding[] };
  hid: {
    bindings: HidBinding[];
    /** DIY torquer encoder counts per revolution of the knob */
    torquerCountsPerRev: number;
  };
}

// --- Defaults ----------------------------------------------------------------

/**
 * Default mouse calibration before measurement: an assumed 800 counts per inch
 * (MODEL PARAMETER; mouse resolutions vary widely and movementX units vary by
 * browser and OS, facts S8 F2), i.e. 25.4/800 mm per count.
 */
export const DEFAULT_MOUSE_MM_PER_COUNT = MM_PER_INCH / 800;

/** Trackpad default: CSS px of scroll delta to mm of finger travel (MODEL PARAMETER). */
export const DEFAULT_TRACKPAD_MM_PER_PX = 0.1;

/** Coronary guidewire 0.014 in, J wire 0.035 in, converted with 25.4 mm/in (definition). */
export const WIRE014_MM = 0.014 * MM_PER_INCH; // 0.3556
export const WIRE035_MM = 0.035 * MM_PER_INCH; // 0.889

/** French size to mm: 1 Fr = 1/3 mm (facts S8 F6). */
export const frToMm = (fr: number) => fr / 3;

/**
 * Grip geometry. Diameters of wires and shafts follow from their nominal sizes;
 * hub, torque device and syringe sizes and all travel spans are MODEL PARAMETERS
 * (no measured source opened; tune in the calibration screen).
 */
export const DEFAULT_GRIP_GEOMETRY: Record<GripTarget, GripGeometry> = {
  // sheath hub: held to fix the sheath, rarely rolled (model)
  sheath: { diameterMm: 10, rollSpanMm: 20, pushSpanMm: 30 },
  // bare 0.035 J wire rolled between finger and thumb
  wire035: { diameterMm: WIRE035_MM, rollSpanMm: 24, pushSpanMm: 50 },
  // catheter hub body (model): rolled at the hub, pushed at the hub
  catheter: { diameterMm: 6, rollSpanMm: 24, pushSpanMm: 50 },
  // coronary wire; diameter replaced by the torque device when one is fitted
  wire014: { diameterMm: WIRE014_MM, rollSpanMm: 24, pushSpanMm: 40 },
  // rapid-exchange balloon / stent proximal shaft about 2 Fr (model)
  balloon: { diameterMm: frToMm(2), rollSpanMm: 16, pushSpanMm: 40 },
  stent: { diameterMm: frToMm(2), rollSpanMm: 16, pushSpanMm: 40 },
  // the second rail (pci-two-rail-engine): the same wire and device as the first
  wire014b: { diameterMm: WIRE014_MM, rollSpanMm: 24, pushSpanMm: 40 },
  balloon2: { diameterMm: frToMm(2), rollSpanMm: 16, pushSpanMm: 40 },
  pressureWire: { diameterMm: WIRE014_MM, rollSpanMm: 24, pushSpanMm: 40 },
  // imaging catheter shaft about 3 Fr (model)
  ivus: { diameterMm: frToMm(3), rollSpanMm: 16, pushSpanMm: 40 },
  pigtail: { diameterMm: 6, rollSpanMm: 24, pushSpanMm: 50 },
  // plunger: no roll; pushSpan is the plunger travel for a full-force push
  syringe: { diameterMm: 20, rollSpanMm: 0, pushSpanMm: 30 },
};

/** Torque device body diameter, mm (MODEL PARAMETER). */
export const TORQUE_DEVICE_MM = 8;

export function defaultSettings(): InputSettings {
  return {
    version: 1,
    calibration: {
      "mouse:raw": { mmPerCount: DEFAULT_MOUSE_MM_PER_COUNT, method: "default" },
      "mouse:os": { mmPerCount: DEFAULT_MOUSE_MM_PER_COUNT, method: "default" },
      // without pointer lock movement is in CSS px; 1 CSS px = 1/CSS_PX_PER_MM mm on a reference screen
      "mouse:css": { mmPerCount: 1 / CSS_PX_PER_MM, method: "default" },
      trackpad: { mmPerCount: DEFAULT_TRACKPAD_MM_PER_PX, method: "default" },
    },
    screenPxPerMm: null,
    gains: { push: 1, roll: 1, invertPush: false, invertRoll: false },
    grip: {
      geometry: {},
      torqueDevice: true,
      switchMs: 300, // model
      emulateCoupling: false,
      wireDragFraction: 0.5, // model
      plungerTravelMm: 15, // model
    },
    pointerLock: { enabled: true, unadjusted: true },
    keyboard: {
      keymap: cloneKeymap(DEFAULT_KEYMAP),
      pushMmPerS: 20, // model
      rollMmPerS: 15, // model
      fine: 0.25, // model
      plungerRampS: 0.5, // model
      plungerForce: 0.7, // model
      carmDegPerS: 8, // model
      tableMmPerS: 40, // model
    },
    gamepad: {
      deadzone: 0.12, // model: covers typical stick rest offsets
      pushMmPerS: 30, // model
      rollMmPerS: 25, // model
      carmDegPerS: 10, // model
      tableMmPerS: 50, // model
      pedalOn: 0.5, // model
      pedalOff: 0.3, // model
      rumble: true,
    },
    trackpad: { enabled: true, idleMs: 140 /* model */, momentumFilter: true, pxPerLine: 16 /* model */, naturalScroll: true },
    haptics: { pseudo: true, strength: 1 },
    midi: {
      bindings: [
        // sustain (damper) pedal CC64 and soft pedal CC67 are on/off switches (facts S8 F4)
        { kind: "cc", number: 64, action: "fluoro" },
        { kind: "cc", number: 67, action: "cine" },
        { kind: "cc", number: 66, action: "cine" },
      ],
    },
    hid: { bindings: [], torquerCountsPerRev: 2400 /* model: 600-line quadrature encoder */ },
  };
}

function cloneKeymap(k: Keymap): Keymap {
  const out = {} as Keymap;
  for (const a of Object.keys(k) as KeyAction[]) out[a] = [...k[a]];
  return out;
}

// --- Validation / merge ---------------------------------------------------

const num = (v: unknown, lo: number, hi: number, d: number): number =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
const bool = (v: unknown, d: boolean): boolean => (typeof v === "boolean" ? v : d);
const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

/** Plausible calibration range: 0.001 mm/count (25,000 cpi) to 2 mm/count. */
export const MM_PER_COUNT_RANGE: [number, number] = [0.001, 2];

function cleanCal(v: unknown, d: DeviceCalibration): DeviceCalibration {
  const o = obj(v);
  const mm = num(o.mmPerCount, MM_PER_COUNT_RANGE[0], MM_PER_COUNT_RANGE[1], NaN);
  if (!Number.isFinite(mm)) return { ...d };
  return {
    mmPerCount: mm,
    method: o.method === "measured" ? "measured" : "default",
    at: typeof o.at === "string" ? o.at : undefined,
    counts: typeof o.counts === "number" ? o.counts : undefined,
  };
}

function cleanGeom(v: unknown, d: GripGeometry): GripGeometry {
  const o = obj(v);
  return {
    diameterMm: num(o.diameterMm, 0.1, 40, d.diameterMm),
    rollSpanMm: num(o.rollSpanMm, 0, 200, d.rollSpanMm),
    pushSpanMm: num(o.pushSpanMm, 1, 400, d.pushSpanMm),
  };
}

const KEY_ACTIONS = Object.keys(DEFAULT_KEYMAP) as KeyAction[];
const GRIP_TARGETS = Object.keys(DEFAULT_GRIP_GEOMETRY) as GripTarget[];

/** Merge an unknown (parsed JSON or partial) record over defaults, clamping every field. */
export function sanitizeSettings(raw: unknown): InputSettings {
  const d = defaultSettings();
  const r = obj(raw);

  const calIn = obj(r.calibration);
  const calibration: Record<string, DeviceCalibration> = { ...d.calibration };
  for (const k of Object.keys(calIn)) calibration[k] = cleanCal(calIn[k], d.calibration[k] ?? { mmPerCount: DEFAULT_MOUSE_MM_PER_COUNT, method: "default" });

  const g = obj(r.gains);
  const gr = obj(r.grip);
  const geomIn = obj(gr.geometry);
  const geometry: Partial<Record<GripTarget, GripGeometry>> = {};
  for (const t of GRIP_TARGETS) if (geomIn[t] !== undefined) geometry[t] = cleanGeom(geomIn[t], DEFAULT_GRIP_GEOMETRY[t]);

  const pl = obj(r.pointerLock);
  const kb = obj(r.keyboard);
  const kmIn = obj(kb.keymap);
  const keymap = cloneKeymap(d.keyboard.keymap);
  for (const a of KEY_ACTIONS) {
    const v = kmIn[a];
    if (Array.isArray(v) && v.every((x) => typeof x === "string")) keymap[a] = [...(v as string[])];
  }
  const gp = obj(r.gamepad);
  const tp = obj(r.trackpad);
  const hp = obj(r.haptics);
  const mi = obj(r.midi);
  const hi = obj(r.hid);

  const midiBindings = Array.isArray(mi.bindings)
    ? (mi.bindings as unknown[])
        .map(obj)
        .filter((b) => (b.kind === "cc" || b.kind === "note") && typeof b.number === "number" && ["fluoro", "cine", "pinAuto", "plunger"].includes(b.action as string))
        .map((b) => ({
          kind: b.kind as "cc" | "note",
          number: num(b.number, 0, 127, 0),
          channel: typeof b.channel === "number" ? num(b.channel, 0, 15, 0) : undefined,
          action: b.action as MidiBinding["action"],
        }))
    : d.midi.bindings;
  const hidBindings = Array.isArray(hi.bindings)
    ? (hi.bindings as unknown[])
        .map(obj)
        .filter((b) => typeof b.device === "string" && ["fluoro", "cine", "pinAuto"].includes(b.action as string))
        .map((b) => ({
          device: b.device as string,
          reportId: num(b.reportId, 0, 255, 0),
          byte: num(b.byte, 0, 63, 0),
          mask: num(b.mask, 1, 255, 1),
          activeHigh: bool(b.activeHigh, true),
          action: b.action as HidBinding["action"],
        }))
    : [];

  const pedalOn = num(gp.pedalOn, 0.05, 1, d.gamepad.pedalOn);
  return {
    version: 1,
    calibration,
    screenPxPerMm: typeof r.screenPxPerMm === "number" && Number.isFinite(r.screenPxPerMm) ? num(r.screenPxPerMm, 1, 20, CSS_PX_PER_MM) : null,
    gains: {
      push: num(g.push, 0.05, 10, d.gains.push),
      roll: num(g.roll, 0.05, 10, d.gains.roll),
      invertPush: bool(g.invertPush, false),
      invertRoll: bool(g.invertRoll, false),
    },
    grip: {
      geometry,
      torqueDevice: bool(gr.torqueDevice, d.grip.torqueDevice),
      switchMs: num(gr.switchMs, 0, 2000, d.grip.switchMs),
      emulateCoupling: bool(gr.emulateCoupling, d.grip.emulateCoupling),
      wireDragFraction: num(gr.wireDragFraction, 0, 1, d.grip.wireDragFraction),
      plungerTravelMm: num(gr.plungerTravelMm, 2, 100, d.grip.plungerTravelMm),
    },
    pointerLock: { enabled: bool(pl.enabled, true), unadjusted: bool(pl.unadjusted, true) },
    keyboard: {
      keymap,
      pushMmPerS: num(kb.pushMmPerS, 0.5, 200, d.keyboard.pushMmPerS),
      rollMmPerS: num(kb.rollMmPerS, 0.5, 200, d.keyboard.rollMmPerS),
      fine: num(kb.fine, 0.02, 1, d.keyboard.fine),
      plungerRampS: num(kb.plungerRampS, 0, 5, d.keyboard.plungerRampS),
      plungerForce: num(kb.plungerForce, 0.05, 1, d.keyboard.plungerForce),
      carmDegPerS: num(kb.carmDegPerS, 0.5, 60, d.keyboard.carmDegPerS),
      tableMmPerS: num(kb.tableMmPerS, 1, 300, d.keyboard.tableMmPerS),
    },
    gamepad: {
      deadzone: num(gp.deadzone, 0, 0.6, d.gamepad.deadzone),
      pushMmPerS: num(gp.pushMmPerS, 0.5, 300, d.gamepad.pushMmPerS),
      rollMmPerS: num(gp.rollMmPerS, 0.5, 300, d.gamepad.rollMmPerS),
      carmDegPerS: num(gp.carmDegPerS, 0.5, 60, d.gamepad.carmDegPerS),
      tableMmPerS: num(gp.tableMmPerS, 1, 300, d.gamepad.tableMmPerS),
      pedalOn,
      pedalOff: num(gp.pedalOff, 0, pedalOn, Math.min(pedalOn, d.gamepad.pedalOff)),
      rumble: bool(gp.rumble, true),
    },
    trackpad: {
      enabled: bool(tp.enabled, true),
      idleMs: num(tp.idleMs, 30, 1000, d.trackpad.idleMs),
      momentumFilter: bool(tp.momentumFilter, true),
      pxPerLine: num(tp.pxPerLine, 1, 100, d.trackpad.pxPerLine),
      naturalScroll: bool(tp.naturalScroll, true),
    },
    haptics: { pseudo: bool(hp.pseudo, true), strength: num(hp.strength, 0, 1, 1) },
    midi: { bindings: midiBindings },
    hid: { bindings: hidBindings, torquerCountsPerRev: num(hi.torquerCountsPerRev, 4, 100000, d.hid.torquerCountsPerRev) },
  };
}

/** Deep-ish partial for updates. */
export type SettingsPatch = {
  [K in keyof InputSettings]?: InputSettings[K] extends Record<string, unknown> ? Partial<InputSettings[K]> : InputSettings[K];
};

export function mergeSettings(base: InputSettings, patch: SettingsPatch): InputSettings {
  const out: Record<string, unknown> = { ...base };
  for (const k of Object.keys(patch) as (keyof InputSettings)[]) {
    const pv = patch[k] as unknown;
    const bv = base[k] as unknown;
    if (pv && typeof pv === "object" && !Array.isArray(pv) && bv && typeof bv === "object" && !Array.isArray(bv)) {
      out[k] = { ...(bv as object), ...(pv as object) };
    } else if (pv !== undefined) out[k] = pv;
  }
  return sanitizeSettings(out);
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadSettings(storage: StorageLike | null = defaultStorage()): InputSettings {
  if (!storage) return defaultSettings();
  try {
    const s = storage.getItem(SETTINGS_KEY);
    return s ? sanitizeSettings(JSON.parse(s)) : defaultSettings();
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(s: InputSettings, storage: StorageLike | null = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

/** Resolve the geometry the fingers hold for a grip target under the current settings. */
export function gripGeometry(s: InputSettings, t: GripTarget): GripGeometry {
  const g = { ...DEFAULT_GRIP_GEOMETRY[t], ...(s.grip.geometry[t] ?? {}) };
  if ((t === "wire014" || t === "wire014b" || t === "pressureWire") && s.grip.torqueDevice && !s.grip.geometry[t]) {
    g.diameterMm = TORQUE_DEVICE_MM;
  }
  return g;
}

/** mm per count for a calibration key, falling back to the mouse default. */
export function mmPerCount(s: InputSettings, key: string): number {
  return s.calibration[key]?.mmPerCount ?? DEFAULT_MOUSE_MM_PER_COUNT;
}

/**
 * Turn a calibration run (counts recorded while the hand travelled a known
 * distance) into a calibration record. Returns null for implausible runs
 * (too few counts, or a result outside MM_PER_COUNT_RANGE).
 */
export function calibrationFromRun(counts: number, distanceMm: number, now = new Date()): DeviceCalibration | null {
  const c = Math.abs(counts);
  if (!(distanceMm > 0) || !Number.isFinite(c) || c < 20) return null;
  const mm = distanceMm / c;
  if (mm < MM_PER_COUNT_RANGE[0] || mm > MM_PER_COUNT_RANGE[1]) return null;
  return { mmPerCount: mm, method: "measured", at: now.toISOString(), counts: c };
}

/** Which device the right-hand slot keys 1-5 select, by setup. */
export const GRIP_ORDER_DIAGNOSTIC: GripTarget[] = ["catheter", "wire035", "syringe", "sheath"];
export const GRIP_ORDER_PCI: GripTarget[] = ["catheter", "wire014", "balloon", "syringe", "sheath"];

/**
 * The PCI lab's grip order (pci-lab-input) for the device on the wire now: the guide, the coronary
 * wire, the device (a balloon by default, else the stent or imaging catheter on the rail), the
 * syringe and the sheath. Keys 1-5 follow it. GRIP_ORDER_PCI is this order with a balloon.
 */
export function pciGripOrder(device: DeviceSlot | null = null, second: { wire?: boolean; device?: boolean } = {}): GripTarget[] {
  // only the devices that ride on the coronary wire (legacyAdapter PCI_RAIL_DEVICES); anything else is the balloon
  const slot: DeviceSlot = device === "stent" || device === "ivus" ? device : "balloon";
  const order = GRIP_ORDER_PCI.map((t) => (t === "balloon" ? slot : t));
  // the second rail (pci-two-rail-engine) follows keys 1-5: reached by cycling (gripNext) or selected by name
  if (second.wire) order.push("wire014b");
  if (second.wire && second.device) order.push("balloon2");
  return order;
}

/** The PCI grip order with both rails in use: GRIP_ORDER_PCI, then the second wire and the device on it (pci-two-rail-engine). */
export const GRIP_ORDER_PCI_TWO_RAIL: GripTarget[] = [...GRIP_ORDER_PCI, "wire014b", "balloon2"];

/**
 * The PCI lab's keys (pci-lab-input): Q and E roll the gripped device as in the earlier PCI lab
 * (anticlockwise, clockwise), so the left hand's wire and guide pins move to R and G. A key the
 * person has remapped is left as they set it, and Q or E is added only where no other action uses it.
 */
export const PCI_KEYMAP_CHANGES: { pinWire: string[]; pinGuide: string[]; rollCcw: string; rollCw: string } = {
  pinWire: ["KeyR"],
  pinGuide: ["KeyG"],
  rollCcw: "KeyQ",
  rollCw: "KeyE",
};

export function pciKeymap(base: Keymap): Keymap {
  const k = cloneKeymap(base);
  const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
  const used = (code: string) => KEY_ACTIONS.some((a) => k[a].includes(code));
  const move = (a: "pinWire" | "pinGuide") => {
    const to = PCI_KEYMAP_CHANGES[a];
    if (same(k[a], DEFAULT_KEYMAP[a]) && !to.some(used)) k[a] = [...to];
  };
  move("pinWire");
  move("pinGuide");
  if (!used(PCI_KEYMAP_CHANGES.rollCcw)) k.rollCcw = [...k.rollCcw, PCI_KEYMAP_CHANGES.rollCcw];
  if (!used(PCI_KEYMAP_CHANGES.rollCw)) k.rollCw = [...k.rollCw, PCI_KEYMAP_CHANGES.rollCw];
  return k;
}

/** A key's name for on-screen help, from its KeyboardEvent.code. */
export function keyCodeLabel(code: string): string {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  const map: Record<string, string> = { ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→", ShiftLeft: "Shift", ShiftRight: "Shift", Space: "Space", Tab: "Tab" };
  return map[code] ?? code;
}

/** One line of the PCI lab's key help: the keys (already named for display) and what they do. */
export interface PciKeyHelpItem {
  keys: string[];
  does: string;
}

/**
 * The PCI lab's key help, read from the keymap the lab actually runs on (pciKeymap of the person's
 * settings), so the help follows the person's remaps. Only the input system's keys are listed: a lab
 * shell command outside the keymap (storing the fluoroscopy loop, for one) is the shell's to add. The
 * left hand's pins are listed only when `pins` says the session takes them (a pin the session cannot
 * act on would be a key that does nothing).
 */
export function pciKeyHelp(k: Keymap, o: { pins?: boolean } = {}): PciKeyHelpItem[] {
  const names = (...acts: KeyAction[]) => {
    const out: string[] = [];
    for (const a of acts) for (const c of k[a]) {
      const n = keyCodeLabel(c);
      if (!out.includes(n)) out.push(n);
    }
    return out;
  };
  const items: PciKeyHelpItem[] = [
    { keys: names("advance", "withdraw"), does: "push, pull back what the right hand holds" },
    { keys: names("rollCcw", "rollCw"), does: "roll it anticlockwise, clockwise" },
    { keys: names("grip1", "grip2", "grip3", "grip4", "grip5"), does: "right hand to the guide, wire, device on the wire, syringe, sheath" },
    { keys: names("gripNext"), does: "right hand to the next device" },
    ...(o.pins
      ? [
          { keys: names("pinAuto"), does: "left hand holds the partner device" },
          { keys: names("pinWire"), does: "left hand pins the wire" },
          { keys: names("pinGuide"), does: "left hand holds the guide" },
        ]
      : []),
    { keys: names("inject"), does: "hold to inject contrast (with the cine pedal for a cine run)" },
    { keys: names("flush"), does: "hold to flush saline" },
    { keys: names("aspirate"), does: "hold to draw back" },
    { keys: names("pedalFluoro"), does: "hold for fluoroscopy" },
    { keys: names("pedalCine"), does: "hold for cine" },
    { keys: names("carmLao", "carmRao", "carmCran", "carmCaud"), does: "C-arm (with fine control: table)" },
    { keys: names("fine"), does: "fine control" },
  ];
  return items.filter((i) => i.keys.length > 0);
}

/** The settings the PCI lab runs on: the person's own, with the PCI keys. Gamepad, MIDI and HID are unchanged. */
export function pciSettings(s: InputSettings): InputSettings {
  return { ...s, keyboard: { ...s.keyboard, keymap: pciKeymap(s.keyboard.keymap) } };
}

/** Over-the-wire relationships: device → the wire it rides on. */
export const RAILS: Partial<Record<DeviceSlot, DeviceSlot[]>> = {
  catheter: ["wire035"],
  pigtail: ["wire035"],
  balloon: ["wire014"],
  stent: ["wire014"],
  ivus: ["wire014"],
  balloon2: ["wire014b"],
};
