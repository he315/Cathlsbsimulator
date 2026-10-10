// ---------------------------------------------------------------------------
// Trackpad two-finger gestures: the right hand without a mouse.
//
// A two-finger swipe is a grip: the first wheel event of a gesture closes the
// fingers, a pause of settings.trackpad.idleMs opens them. Each new swipe is a
// regrip, which is what the hand does on a real table. Swiping away from you
// pushes, sideways rolls.
//
// Units: deltaMode is checked (pixel, line or page; facts S8 F5) and line
// deltas are converted with pxPerLine. The px → mm factor is the "trackpad"
// calibration (two-finger swipe over a known distance).
//
// Momentum: after the fingers lift, macOS keeps sending wheel events that decay
// smoothly. With momentumFilter on, a run of at least four events whose
// magnitude ratio stays in [0.75, 0.995] and varies by less than 0.03 is treated
// as inertia and dropped until the magnitude rises again. This is a HEURISTIC
// (no API exposes the phase); it may also drop the last few millimetres of a
// very smooth real deceleration.
//
// Wheel events with ctrlKey set (pinch zoom on several platforms) are ignored.
// A plain mouse wheel arrives here too and feeds the device in line steps.
// ---------------------------------------------------------------------------

import { calibrationFromRun, mmPerCount, type DeviceCalibration, type InputSettings } from "./settings";
import type { Intent } from "./types";

export const TRACKPAD_SOURCE = "trackpad";

export interface WheelLike {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  ctrlKey?: boolean;
}

type Emit = (i: Intent) => void;

export const MOMENTUM_RUN = 4;
export const MOMENTUM_RATIO: [number, number] = [0.75, 0.995];
export const MOMENTUM_RATIO_SPREAD = 0.03;

/** Detects smooth geometric decay of wheel magnitudes (inertial scrolling). */
export class MomentumFilter {
  private prev = 0;
  private ratios: number[] = [];
  private inMomentum = false;

  /** Returns true if this event should be dropped as inertia. */
  push(mag: number): boolean {
    const m = Math.abs(mag);
    if (this.prev > 0 && m > 0) {
      const r = m / this.prev;
      if (r > 1.0001) {
        // fingers back on the pad (or a new push): never momentum
        this.ratios = [];
        this.inMomentum = false;
      } else {
        this.ratios.push(r);
        if (this.ratios.length > MOMENTUM_RUN) this.ratios.shift();
        if (!this.inMomentum && this.ratios.length >= MOMENTUM_RUN) {
          const lo = Math.min(...this.ratios);
          const hi = Math.max(...this.ratios);
          this.inMomentum = lo >= MOMENTUM_RATIO[0] && hi <= MOMENTUM_RATIO[1] && hi - lo < MOMENTUM_RATIO_SPREAD;
        }
      }
    }
    this.prev = m;
    return this.inMomentum;
  }

  reset() {
    this.prev = 0;
    this.ratios = [];
    this.inMomentum = false;
  }
}

export interface TrackpadContext {
  settings(): InputSettings;
}

export class TrackpadSource {
  private grabbing = false;
  private lastAt = -Infinity;
  private momentum = new MomentumFilter();
  private calib: { sx: number; sy: number } | null = null;
  private elements = new Map<HTMLElement, () => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private emit: Emit, private ctx: TrackpadContext) {}

  /** Handle one wheel event. Returns true if consumed (caller should preventDefault). */
  wheel(e: WheelLike, nowMs: number): boolean {
    const s = this.ctx.settings().trackpad;
    if (!s.enabled || e.ctrlKey) return false;
    const unit = e.deltaMode === 1 ? s.pxPerLine : e.deltaMode === 2 ? s.pxPerLine * 20 : 1;
    const dx = e.deltaX * unit;
    const dy = e.deltaY * unit;
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return true;

    const gap = nowMs - this.lastAt > s.idleMs;
    this.lastAt = nowMs;
    if (gap) this.momentum.reset();

    if (this.calib) {
      this.calib.sx += dx;
      this.calib.sy += dy;
      return true;
    }

    if (s.momentumFilter && this.momentum.push(Math.hypot(dx, dy))) {
      // inertia after lift-off: the hand has already let go
      this.release();
      return true;
    }

    if (!this.grabbing) {
      this.grabbing = true;
      this.emit({ t: "grab", on: true, source: TRACKPAD_SOURCE });
    }
    const k = mmPerCount(this.ctx.settings(), "trackpad");
    const sign = s.naturalScroll ? 1 : -1;
    this.emit({ t: "move", axialMm: sign * dy * k + 0, lateralMm: -sign * dx * k + 0, source: TRACKPAD_SOURCE });
    return true;
  }

  /** Called every frame (and by a timer) to end a gesture after the idle gap. */
  tick(nowMs: number) {
    if (this.grabbing && nowMs - this.lastAt > this.ctx.settings().trackpad.idleMs) this.release();
  }

  release() {
    if (!this.grabbing) return;
    this.grabbing = false;
    this.emit({ t: "grab", on: false, source: TRACKPAD_SOURCE });
  }

  get isGrabbing() {
    return this.grabbing;
  }

  startCalibration() {
    this.release();
    this.calib = { sx: 0, sy: 0 };
  }
  calibrationCounts() {
    return this.calib ? Math.hypot(this.calib.sx, this.calib.sy) : 0;
  }
  get calibrating() {
    return this.calib !== null;
  }
  finishCalibration(distanceMm: number): { key: string; cal: DeviceCalibration } | null {
    const c = this.calib;
    this.calib = null;
    if (!c) return null;
    const cal = calibrationFromRun(Math.hypot(c.sx, c.sy), distanceMm);
    return cal ? { key: "trackpad", cal } : null;
  }
  cancelCalibration() {
    this.calib = null;
  }

  /** Attach to an element; several elements may be attached at once. */
  attach(el: HTMLElement, now: () => number = () => performance.now()): () => void {
    const existing = this.elements.get(el);
    if (existing) return existing;
    const onWheel = (e: WheelEvent) => {
      if (this.wheel(e, now())) {
        e.preventDefault();
        if (this.timer) clearTimeout(this.timer);
        // backup for when rAF is paused: end the gesture after the idle gap
        this.timer = setTimeout(() => this.tick(now()), this.ctx.settings().trackpad.idleMs + 20);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    const off = () => {
      if (!this.elements.delete(el)) return;
      el.removeEventListener("wheel", onWheel);
      if (this.elements.size === 0) {
        if (this.timer) clearTimeout(this.timer);
        this.release();
      }
    };
    this.elements.set(el, off);
    return off;
  }
}
