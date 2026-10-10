// ---------------------------------------------------------------------------
// Gamepad (Gamepad API, standard mapping; facts S8 F3).
//
//   left stick      push (up = advance) and roll (right = clockwise) of the
//                   gripped device, as velocities; the grip is closed while the
//                   stick is off centre, so returning it to centre is a regrip.
//                   With the right hand on the syringe, up = inject force,
//                   down = aspirate.
//   right stick     C-arm angular velocity (right = LAO, up = cranial)
//   d-pad           table pan
//   left trigger    fluoroscopy pedal (buttons[6], with hysteresis)
//   right trigger   cine pedal (buttons[7])
//   left bumper     pin modifier (left hand fixes the partner device)
//   right bumper    pin the guide catheter
//   A / B           right hand to next / previous device
//   Y               syringe port contrast / saline
//
// Axes: negative is up/left, buttons are normalised to [0, 1] (W3C Gamepad).
// The gamepad is polled once per frame by the input system; a disconnected
// pad releases everything it held (dead-man).
// ---------------------------------------------------------------------------

import { hysteresis } from "./pedals";
import type { InputSettings } from "./settings";
import type { Intent, SourceStatus } from "./types";

export interface GamepadButtonLike {
  pressed: boolean;
  value: number;
}
export interface GamepadLike {
  index: number;
  id: string;
  mapping: string;
  connected: boolean;
  axes: readonly number[];
  buttons: readonly GamepadButtonLike[];
}

export interface PadMemory {
  fluoro: boolean;
  cine: boolean;
  pinAuto: boolean;
  pinGuide: boolean;
  next: boolean;
  prev: boolean;
  port: boolean;
  grabbing: boolean;
  plunger: number;
  carm: { lao: number; cran: number };
  table: { x: number; y: number };
  /**
   * Controls latched by a releaseAll (pause, case end) while physically held:
   * each stays inactive until it is let go once. Keys: fluoro, cine, pinAuto,
   * pinGuide, stick (left stick: device or plunger), carm, table.
   */
  latched?: Set<string>;
}

export const PAD_LATCH_KEYS = ["fluoro", "cine", "pinAuto", "pinGuide", "stick", "carm", "table"] as const;

export const emptyPadMemory = (): PadMemory => ({
  fluoro: false,
  cine: false,
  pinAuto: false,
  pinGuide: false,
  next: false,
  prev: false,
  port: false,
  grabbing: false,
  plunger: 0,
  carm: { lao: 0, cran: 0 },
  table: { x: 0, y: 0 },
  latched: new Set(),
});

/**
 * Forget what the pad was doing (the input system has released it) and latch
 * every held control so it must be let go and pressed again. Mutates `mem`.
 */
export function latchPadMemory(mem: PadMemory) {
  mem.fluoro = false;
  mem.cine = false;
  mem.pinAuto = false;
  mem.pinGuide = false;
  mem.grabbing = false;
  mem.plunger = 0;
  mem.carm = { lao: 0, cran: 0 };
  mem.table = { x: 0, y: 0 };
  mem.latched = new Set(PAD_LATCH_KEYS);
}

/** Standard-mapping indices (W3C Gamepad "standard" layout). */
export const PAD = {
  axisLX: 0,
  axisLY: 1,
  axisRX: 2,
  axisRY: 3,
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  up: 12,
  down: 13,
  left: 14,
  right: 15,
} as const;

/** Radial dead zone, rescaled so output starts at 0 at the zone edge and reaches 1 at full deflection. */
export function deadzone2(x: number, y: number, dz: number): [number, number] {
  const fx = Number.isFinite(x) ? x : 0;
  const fy = Number.isFinite(y) ? y : 0;
  const m = Math.hypot(fx, fy);
  if (m <= dz || m === 0) return [0, 0];
  const k = Math.min(1, (m - dz) / (1 - dz)) / m;
  return [fx * k, fy * k];
}

const btn = (p: GamepadLike, i: number): GamepadButtonLike => p.buttons[i] ?? { pressed: false, value: 0 };
const axis = (p: GamepadLike, i: number) => p.axes[i] ?? 0;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-3;

export interface PadContext {
  /** right hand is on the syringe: the left stick drives the plunger */
  atSyringe: boolean;
  port: "contrast" | "saline";
}

/** Pure mapping of one pad poll to intents. Mutates and returns `mem`. */
export function mapGamepad(p: GamepadLike, mem: PadMemory, s: InputSettings, dtS: number, ctx: PadContext): Intent[] {
  const src = `gamepad:${p.index}`;
  const g = s.gamepad;
  const out: Intent[] = [];
  const dt = Math.max(0, Math.min(0.1, dtS));
  // a latched control acts only after it has been let go once
  const free = (key: string, held: boolean): boolean => {
    const l = mem.latched;
    if (!l || !l.has(key)) return true;
    if (!held) l.delete(key);
    return false;
  };

  // pedals (dead-man with hysteresis)
  const lt = btn(p, PAD.LT).value;
  const rt = btn(p, PAD.RT).value;
  const f = free("fluoro", lt > g.pedalOff) && hysteresis(mem.fluoro, lt, g.pedalOn, g.pedalOff);
  if (f !== mem.fluoro) out.push({ t: "pedal", pedal: "fluoro", on: (mem.fluoro = f), source: src });
  const c = free("cine", rt > g.pedalOff) && hysteresis(mem.cine, rt, g.pedalOn, g.pedalOff);
  if (c !== mem.cine) out.push({ t: "pedal", pedal: "cine", on: (mem.cine = c), source: src });

  // pins
  const lb = btn(p, PAD.LB).pressed;
  const pa = free("pinAuto", lb) && lb;
  if (pa !== mem.pinAuto) out.push({ t: "pin", target: "auto", on: (mem.pinAuto = pa), source: src });
  const rb = btn(p, PAD.RB).pressed;
  const pg = free("pinGuide", rb) && rb;
  if (pg !== mem.pinGuide) out.push({ t: "pin", target: "guide", on: (mem.pinGuide = pg), source: src });

  // grip selection and port (rising edges)
  const nx = btn(p, PAD.A).pressed;
  if (nx && !mem.next) out.push({ t: "cycle", dir: 1 });
  mem.next = nx;
  const pv = btn(p, PAD.B).pressed;
  if (pv && !mem.prev) out.push({ t: "cycle", dir: -1 });
  mem.prev = pv;
  const po = btn(p, PAD.Y).pressed;
  if (po && !mem.port) out.push({ t: "port", port: ctx.port === "contrast" ? "saline" : "contrast" });
  mem.port = po;

  // left stick: device or plunger
  const [lx0, ly0] = deadzone2(axis(p, PAD.axisLX), axis(p, PAD.axisLY), g.deadzone);
  const stickFree = free("stick", lx0 !== 0 || ly0 !== 0);
  const lx = stickFree ? lx0 : 0;
  const ly = stickFree ? ly0 : 0;
  if (ctx.atSyringe) {
    if (mem.grabbing) {
      mem.grabbing = false;
      out.push({ t: "grab", on: false, source: src });
    }
    const force = -ly + 0;
    if (!near(force, mem.plunger)) {
      mem.plunger = force;
      out.push({ t: "plunger", force, source: src });
    }
  } else {
    if (mem.plunger !== 0) {
      mem.plunger = 0;
      out.push({ t: "plunger", force: 0, source: src });
    }
    const active = lx !== 0 || ly !== 0;
    if (active !== mem.grabbing) {
      mem.grabbing = active;
      out.push({ t: "grab", on: active, source: src });
    }
    if (active) out.push({ t: "move", axialMm: -ly * g.pushMmPerS * dt + 0, lateralMm: lx * g.rollMmPerS * dt + 0, source: src });
  }

  // right stick: C-arm velocity
  const [rx0, ry0] = deadzone2(axis(p, PAD.axisRX), axis(p, PAD.axisRY), g.deadzone);
  const carmFree = free("carm", rx0 !== 0 || ry0 !== 0);
  const rx = carmFree ? rx0 : 0;
  const ry = carmFree ? ry0 : 0;
  const lao = rx * g.carmDegPerS + 0;
  const cran = -ry * g.carmDegPerS + 0;
  if (!near(lao, mem.carm.lao) || !near(cran, mem.carm.cran)) {
    mem.carm = { lao, cran };
    out.push({ t: "carm", laoDegPerS: lao, cranDegPerS: cran, source: src });
  }

  // d-pad: table pan
  const dpad = btn(p, PAD.right).pressed || btn(p, PAD.left).pressed || btn(p, PAD.up).pressed || btn(p, PAD.down).pressed;
  const tableFree = free("table", dpad);
  const tx = tableFree ? ((btn(p, PAD.right).pressed ? 1 : 0) - (btn(p, PAD.left).pressed ? 1 : 0)) * g.tableMmPerS + 0 : 0;
  const ty = tableFree ? ((btn(p, PAD.up).pressed ? 1 : 0) - (btn(p, PAD.down).pressed ? 1 : 0)) * g.tableMmPerS + 0 : 0;
  if (tx !== mem.table.x || ty !== mem.table.y) {
    mem.table = { x: tx, y: ty };
    out.push({ t: "table", xMmPerS: tx, yMmPerS: ty, source: src });
  }
  return out;
}

export class GamepadSource {
  private mem = new Map<number, PadMemory>();
  private names = new Map<number, { id: string; mapping: string }>();

  constructor(
    private emit: (i: Intent) => void,
    private ctx: { settings(): InputSettings; padContext(): PadContext },
    private getPads: () => ArrayLike<GamepadLike | null> = () =>
      typeof navigator !== "undefined" && navigator.getGamepads ? (navigator.getGamepads() as unknown as ArrayLike<GamepadLike | null>) : []
  ) {}

  static supported(): boolean {
    return typeof navigator !== "undefined" && typeof navigator.getGamepads === "function";
  }

  /** Poll all pads once (call every frame). */
  poll(dtS: number) {
    let pads: ArrayLike<GamepadLike | null> = [];
    try {
      pads = this.getPads();
    } catch {
      pads = [];
    }
    const seen = new Set<number>();
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i];
      if (!p || !p.connected) continue;
      seen.add(p.index);
      let m = this.mem.get(p.index);
      if (!m) {
        m = emptyPadMemory();
        this.mem.set(p.index, m);
        this.names.set(p.index, { id: p.id, mapping: p.mapping });
      }
      for (const it of mapGamepad(p, m, this.ctx.settings(), dtS, this.ctx.padContext())) this.emit(it);
    }
    for (const idx of Array.from(this.mem.keys())) {
      if (!seen.has(idx)) this.disconnect(idx);
    }
  }

  /**
   * The input system released everything (pause, case end): forget each pad's
   * state without emitting, and latch held controls so a stick or trigger still
   * held must be let go and pressed again.
   */
  releaseAll() {
    for (const m of this.mem.values()) latchPadMemory(m);
  }

  disconnect(index: number) {
    if (!this.mem.delete(index)) return;
    this.names.delete(index);
    const src = `gamepad:${index}`;
    this.emit({ t: "releaseSource", source: src });
    // dead-man for velocity channels too
    this.emit({ t: "carm", laoDegPerS: 0, cranDegPerS: 0, source: src });
    this.emit({ t: "table", xMmPerS: 0, yMmPerS: 0, source: src });
    this.emit({ t: "plunger", force: 0, source: src });
  }

  statuses(): SourceStatus[] {
    const supported = GamepadSource.supported();
    if (this.names.size === 0) {
      return [{ id: "gamepad", kind: "gamepad", label: "Gamepad", supported, connected: false, detail: supported ? "Press any button on the controller to connect it" : "Gamepad API not available" }];
    }
    return Array.from(this.names.entries()).map(([i, n]) => ({
      id: `gamepad:${i}`,
      kind: "gamepad" as const,
      label: "Gamepad",
      supported,
      connected: true,
      detail: n.mapping === "standard" ? n.id : `${n.id} (non-standard layout; buttons may differ)`,
    }));
  }
}
