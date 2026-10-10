// ---------------------------------------------------------------------------
// Keyboard: the fallback for everything, and the default pedals.
//
// Held keys, not taps: F (fluoro) and C (cine) are foot switches held down;
// W/S feed the gripped device at a set speed while held, A/D roll it; Space
// is the left-hand pin modifier; Q/E/Z pin the wire, guide or sheath; 1-5
// move the right hand; J/K/L push, flush or pull on the syringe while held,
// building force over a short ramp. Arrows request C-arm motion (with the fine
// key held: table pan). Keys are KeyboardEvent.code values (physical position,
// layout independent) and can be remapped in settings.
//
// Dead-man: window blur or the page being hidden releases every held key, so
// a lost keyup can never leave a pedal down.
// ---------------------------------------------------------------------------

import type { InputSettings, KeyAction } from "./settings";
import type { Intent } from "./types";

export const KEYBOARD_SOURCE = "keyboard";

export interface KeyboardContext {
  settings(): InputSettings;
  port(): "contrast" | "saline";
}

type Emit = (i: Intent) => void;

const MOTION: KeyAction[] = ["advance", "withdraw", "rollCw", "rollCcw"];

export class KeyboardSource {
  private held = new Set<KeyAction>();
  private codeToActions = new Map<string, KeyAction[]>();
  private keymapRef: unknown = null;
  private grabbing = false;
  private plungerForce = 0;
  private carm = { lao: 0, cran: 0 };
  private table = { x: 0, y: 0 };
  private detach: (() => void) | null = null;
  private attachCount = 0;

  constructor(private emit: Emit, private ctx: KeyboardContext) {}

  private actionsFor(code: string): KeyAction[] {
    const km = this.ctx.settings().keyboard.keymap;
    if (km !== this.keymapRef) {
      this.codeToActions.clear();
      for (const a of Object.keys(km) as KeyAction[]) {
        for (const c of km[a]) {
          const list = this.codeToActions.get(c) ?? [];
          list.push(a);
          this.codeToActions.set(c, list);
        }
      }
      this.keymapRef = km;
    }
    return this.codeToActions.get(code) ?? [];
  }

  /** Returns true if the key is mapped (the caller may preventDefault). */
  keyDown(code: string, repeat = false): boolean {
    const acts = this.actionsFor(code);
    if (acts.length === 0) return false;
    if (repeat) return true;
    for (const a of acts) {
      if (this.held.has(a)) continue;
      this.held.add(a);
      this.onDown(a);
    }
    this.syncVelocities();
    return true;
  }

  keyUp(code: string): boolean {
    const acts = this.actionsFor(code);
    if (acts.length === 0) return false;
    for (const a of acts) {
      if (!this.held.delete(a)) continue;
      this.onUp(a);
    }
    this.syncVelocities();
    return true;
  }

  /** Release everything (blur, hidden page, unmount). */
  releaseAll() {
    const was = Array.from(this.held);
    this.held.clear();
    for (const a of was) this.onUp(a);
    this.syncVelocities();
    this.emit({ t: "releaseSource", source: KEYBOARD_SOURCE });
  }

  isHeld(a: KeyAction) {
    return this.held.has(a);
  }

  /** Per-frame: held motion keys become hand travel, held syringe keys ramp force. */
  frame(dtS: number) {
    const dt = Math.max(0, Math.min(0.1, dtS)); // a long stall must not become a lunge
    const s = this.ctx.settings().keyboard;
    const k = this.held.has("fine") ? s.fine : 1;
    const ax = (this.held.has("advance") ? 1 : 0) - (this.held.has("withdraw") ? 1 : 0);
    const lat = (this.held.has("rollCw") ? 1 : 0) - (this.held.has("rollCcw") ? 1 : 0);
    if (ax !== 0 || lat !== 0) {
      this.emit({ t: "move", axialMm: ax * s.pushMmPerS * k * dt, lateralMm: lat * s.rollMmPerS * k * dt, source: KEYBOARD_SOURCE });
    }
    const dir = this.held.has("inject") || this.held.has("flush") ? 1 : this.held.has("aspirate") ? -1 : 0;
    if (dir !== 0) {
      const target = dir * s.plungerForce * (this.held.has("fine") ? 0.5 : 1);
      const rate = s.plungerRampS > 0 ? Math.abs(target) / s.plungerRampS : Infinity;
      const step = rate * dt;
      const next = Math.abs(target - this.plungerForce) <= step + 1e-9 ? target : this.plungerForce + Math.sign(target - this.plungerForce) * step;
      if (next !== this.plungerForce) {
        this.plungerForce = next;
        this.emit({ t: "plunger", force: next, port: this.held.has("flush") ? "saline" : undefined, source: KEYBOARD_SOURCE });
      }
    }
  }

  /**
   * Listen on the window. Reference counted: a second attach (the calibration
   * screen over a lab) shares the listeners, and they stay until the last
   * caller detaches.
   */
  attach(target: Window = window): () => void {
    this.attachCount++;
    if (!this.detach) {
      const isField = (e: KeyboardEvent) => {
        const el = e.target as HTMLElement | null;
        if (!el || !el.tagName) return false;
        const tag = el.tagName;
        return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || el.isContentEditable === true;
      };
      const down = (e: KeyboardEvent) => {
        if (isField(e) || e.metaKey || e.ctrlKey || e.altKey) return;
        if (this.keyDown(e.code, e.repeat)) e.preventDefault();
      };
      const up = (e: KeyboardEvent) => {
        // keyup is honoured even in a field so a pedal cannot stick
        if (this.keyUp(e.code)) e.preventDefault();
      };
      const blur = () => this.releaseAll();
      const vis = () => {
        if (typeof document !== "undefined" && document.visibilityState === "hidden") this.releaseAll();
      };
      target.addEventListener("keydown", down);
      target.addEventListener("keyup", up);
      target.addEventListener("blur", blur);
      if (typeof document !== "undefined") document.addEventListener("visibilitychange", vis);
      this.detach = () => {
        target.removeEventListener("keydown", down);
        target.removeEventListener("keyup", up);
        target.removeEventListener("blur", blur);
        if (typeof document !== "undefined") document.removeEventListener("visibilitychange", vis);
        this.releaseAll();
        this.detach = null;
      };
    }
    let done = false;
    return () => {
      if (done) return;
      done = true;
      this.attachCount = Math.max(0, this.attachCount - 1);
      if (this.attachCount === 0) this.detach?.();
    };
  }

  get attached() {
    return this.detach !== null;
  }

  // --- internals -------------------------------------------------------------

  private onDown(a: KeyAction) {
    const src = KEYBOARD_SOURCE;
    switch (a) {
      case "pedalFluoro":
        return this.emit({ t: "pedal", pedal: "fluoro", on: true, source: src });
      case "pedalCine":
        return this.emit({ t: "pedal", pedal: "cine", on: true, source: src });
      case "pinAuto":
        return this.emit({ t: "pin", target: "auto", on: true, source: src });
      case "pinWire":
        return this.emit({ t: "pin", target: "wire", on: true, source: src });
      case "pinGuide":
        return this.emit({ t: "pin", target: "guide", on: true, source: src });
      case "pinSheath":
        return this.emit({ t: "pin", target: "sheath", on: true, source: src });
      case "grip1":
      case "grip2":
      case "grip3":
      case "grip4":
      case "grip5":
        return this.emit({ t: "selectIndex", index: Number(a.slice(4)) });
      case "gripNext":
        return this.emit({ t: "cycle", dir: this.held.has("fine") ? -1 : 1 });
      case "portToggle":
        return this.emit({ t: "port", port: this.ctx.port() === "contrast" ? "saline" : "contrast" });
      case "inject":
      case "flush":
      case "aspirate":
        this.plungerForce = 0;
        return;
      default:
        return;
    }
  }

  private onUp(a: KeyAction) {
    const src = KEYBOARD_SOURCE;
    switch (a) {
      case "pedalFluoro":
        return this.emit({ t: "pedal", pedal: "fluoro", on: false, source: src });
      case "pedalCine":
        return this.emit({ t: "pedal", pedal: "cine", on: false, source: src });
      case "pinAuto":
        return this.emit({ t: "pin", target: "auto", on: false, source: src });
      case "pinWire":
        return this.emit({ t: "pin", target: "wire", on: false, source: src });
      case "pinGuide":
        return this.emit({ t: "pin", target: "guide", on: false, source: src });
      case "pinSheath":
        return this.emit({ t: "pin", target: "sheath", on: false, source: src });
      case "inject":
      case "flush":
      case "aspirate":
        if (!this.held.has("inject") && !this.held.has("flush") && !this.held.has("aspirate") && this.plungerForce !== 0) {
          this.plungerForce = 0;
          this.emit({ t: "plunger", force: 0, source: src });
        }
        return;
      default:
        return;
    }
  }

  /** Grab state and dead-man velocities follow the held set. */
  private syncVelocities() {
    const src = KEYBOARD_SOURCE;
    const moving = MOTION.some((a) => this.held.has(a));
    if (moving !== this.grabbing) {
      this.grabbing = moving;
      this.emit({ t: "grab", on: moving, source: src });
    }
    const s = this.ctx.settings().keyboard;
    const h = (a: KeyAction) => (this.held.has(a) ? 1 : 0);
    const x = h("carmLao") - h("carmRao");
    const y = h("carmCran") - h("carmCaud");
    const tableMode = this.held.has("fine");
    const carm = tableMode ? { lao: 0, cran: 0 } : { lao: x * s.carmDegPerS, cran: y * s.carmDegPerS };
    const table = tableMode ? { x: x * s.tableMmPerS, y: y * s.tableMmPerS } : { x: 0, y: 0 };
    if (carm.lao !== this.carm.lao || carm.cran !== this.carm.cran) {
      this.carm = carm;
      this.emit({ t: "carm", laoDegPerS: carm.lao, cranDegPerS: carm.cran, source: src });
    }
    if (table.x !== this.table.x || table.y !== this.table.y) {
      this.table = table;
      this.emit({ t: "table", xMmPerS: table.x, yMmPerS: table.y, source: src });
    }
  }
}
