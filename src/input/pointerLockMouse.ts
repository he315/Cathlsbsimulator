// ---------------------------------------------------------------------------
// Pointer-lock mouse: the right hand.
//
// Pressing the left button on the table (or the live image) closes the fingers
// on the device the right hand is at and asks for pointer lock with
// {unadjustedMovement: true}, which disables OS mouse acceleration and gives
// raw counts (facts S8 F1). If the browser rejects that option the lock is
// requested without it and a separate calibration ("mouse:os") is used, because
// accelerated counts are not proportional to hand travel. movementX units vary
// by browser and OS (facts S8 F2), which is why each mode is calibrated
// against a known distance and stored separately.
//
// While the button is held: mouse forward/back (away from / towards you) is
// push/pull, sideways is fingertip roll. The right button is the pin modifier
// (left hand fixes the partner device). Releasing the button opens the hand;
// losing pointer lock (Esc) releases everything.
//
// Without pointer lock (setting off, or before the lock arrives) a press-and-
// drag on the element still works, measured in CSS px ("mouse:css").
// ---------------------------------------------------------------------------

import { calibrationFromRun, mmPerCount, type DeviceCalibration, type InputSettings } from "./settings";
import type { Intent } from "./types";

export const MOUSE_SOURCE = "mouse";

/** Elements with this attribute handle their own pointer drags; the mouse source ignores presses on them. */
export const DIRECT_ATTR = "data-input-direct";

export type MouseMode = "raw" | "os" | "css";

export interface MouseContext {
  settings(): InputSettings;
}

type Emit = (i: Intent) => void;

interface LockableElement {
  requestPointerLock(options?: { unadjustedMovement?: boolean }): Promise<void> | void;
}

export class PointerLockMouse {
  private locked = false;
  private mode: MouseMode = "css";
  private grabbing = false;
  private pinning = false;
  private calib: { sx: number; sy: number; mode: MouseMode } | null = null;
  private lastLockError: string | null = null;

  constructor(private emit: Emit, private ctx: MouseContext) {}

  static supported(): boolean {
    return typeof document !== "undefined" && "pointerLockElement" in document && typeof Element !== "undefined" && "requestPointerLock" in Element.prototype;
  }

  get isLocked() {
    return this.locked;
  }
  get currentMode(): MouseMode {
    return this.mode;
  }
  get lockError() {
    return this.lastLockError;
  }
  calibrationKey(mode: MouseMode = this.mode): string {
    return `mouse:${mode}`;
  }

  // --- testable core -------------------------------------------------------

  /** Button transitions. 0 = left (grip), 2 = right (pin modifier). */
  button(button: number, down: boolean) {
    if (button === 0) {
      if (down === this.grabbing) return;
      this.grabbing = down;
      if (!this.calib) this.emit({ t: "grab", on: down, source: MOUSE_SOURCE });
    } else if (button === 2) {
      if (down === this.pinning) return;
      this.pinning = down;
      this.emit({ t: "pin", target: "auto", on: down, source: MOUSE_SOURCE });
    }
  }

  /** Raw movement in the units of the current mode. +dy is towards the user (screen down). */
  movement(dx: number, dy: number, mode: MouseMode = this.mode) {
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0 && dy === 0)) return;
    if (this.calib) {
      if (this.grabbing) {
        this.calib.sx += dx;
        this.calib.sy += dy;
        this.calib.mode = mode;
      }
      return;
    }
    if (!this.grabbing) return;
    const k = mmPerCount(this.ctx.settings(), this.calibrationKey(mode));
    // "+ 0" turns -0 into 0
    this.emit({ t: "move", axialMm: -dy * k + 0, lateralMm: dx * k + 0, source: MOUSE_SOURCE });
  }

  /** Pointer lock gained or lost. Losing it is a dead-man release. */
  lockChanged(locked: boolean, mode?: MouseMode) {
    this.locked = locked;
    if (locked && mode) this.mode = mode;
    if (!locked) {
      this.mode = "css";
      if (this.grabbing || this.pinning) {
        this.grabbing = false;
        this.pinning = false;
        this.emit({ t: "releaseSource", source: MOUSE_SOURCE });
      }
    }
  }

  // --- calibration ---------------------------------------------------------

  /** Start recording: hold the button and move the mouse a known distance. Motion is not passed on. */
  startCalibration() {
    if (this.grabbing) this.emit({ t: "grab", on: false, source: MOUSE_SOURCE });
    this.calib = { sx: 0, sy: 0, mode: this.mode };
  }

  /** Counts recorded so far (straight-line magnitude). */
  calibrationCounts(): number {
    return this.calib ? Math.hypot(this.calib.sx, this.calib.sy) : 0;
  }

  get calibrating() {
    return this.calib !== null;
  }

  /** Finish: returns the device key and record, or null if the run was implausible. */
  finishCalibration(distanceMm: number): { key: string; cal: DeviceCalibration } | null {
    const c = this.calib;
    this.calib = null;
    if (!c) return null;
    const cal = calibrationFromRun(Math.hypot(c.sx, c.sy), distanceMm);
    return cal ? { key: this.calibrationKey(c.mode), cal } : null;
  }

  cancelCalibration() {
    this.calib = null;
  }

  // --- DOM wiring ------------------------------------------------------------

  /** Request pointer lock on an element (must be called from a user gesture). */
  requestLock(el: Element & LockableElement) {
    const s = this.ctx.settings().pointerLock;
    if (!s.enabled || !PointerLockMouse.supported()) return;
    this.lastLockError = null;
    const plain = () => {
      try {
        const r = el.requestPointerLock();
        this.pendingMode = "os";
        if (r && typeof (r as Promise<void>).catch === "function") {
          (r as Promise<void>).catch((e: unknown) => {
            this.lastLockError = e instanceof Error ? e.name : String(e);
          });
        }
      } catch (e) {
        this.lastLockError = e instanceof Error ? e.name : String(e);
      }
    };
    if (!s.unadjusted) return plain();
    try {
      const r = el.requestPointerLock({ unadjustedMovement: true });
      if (r && typeof (r as Promise<void>).then === "function") {
        this.pendingMode = "raw";
        (r as Promise<void>).catch((e: unknown) => {
          // unadjustedMovement not supported on this platform: fall back to OS-adjusted counts
          const name = e instanceof Error ? e.name : String(e);
          if (name === "NotSupportedError") plain();
          else this.lastLockError = name;
        });
      } else {
        // older implementations return nothing and ignore the option
        this.pendingMode = "os";
      }
    } catch {
      plain();
    }
  }

  private pendingMode: MouseMode = "os";
  private elements = new Map<HTMLElement, () => void>();
  private dragEl: HTMLElement | null = null;
  private docOff: (() => void) | null = null;

  /**
   * Attach to an element (the table, the live image, the calibration pad).
   * Several elements may be attached at once; document-level listeners are
   * shared, so movement is never counted twice.
   */
  attach(el: HTMLElement): () => void {
    const existing = this.elements.get(el);
    if (existing) return existing;
    const doc = el.ownerDocument;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0 && e.button !== 2) return;
      // controls that handle their own drags (TableView hit areas) opt out
      const t = e.target as Element | null;
      if (t && typeof t.closest === "function" && t.closest(`[${DIRECT_ATTR}]`)) return;
      e.preventDefault();
      if (e.button === 0 && !this.locked && this.ctx.settings().pointerLock.enabled) this.requestLock(el);
      this.dragEl = el;
      this.button(e.button, true);
    };
    const onCtx = (e: Event) => e.preventDefault();
    el.addEventListener("mousedown", onDown);
    el.addEventListener("contextmenu", onCtx);
    if (!this.docOff) this.docOff = this.attachDocument(doc);

    const off = () => {
      if (!this.elements.has(el)) return;
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("contextmenu", onCtx);
      this.elements.delete(el);
      if (doc.pointerLockElement === el) doc.exitPointerLock();
      if (this.dragEl === el) {
        this.dragEl = null;
        this.releaseAll();
      }
      if (this.elements.size === 0) {
        this.docOff?.();
        this.docOff = null;
        this.releaseAll();
      }
    };
    this.elements.set(el, off);
    return off;
  }

  /** Detach from every element. */
  detachAll() {
    for (const off of Array.from(this.elements.values())) off();
  }

  private releaseAll() {
    if (this.grabbing || this.pinning) {
      this.grabbing = false;
      this.pinning = false;
      this.emit({ t: "releaseSource", source: MOUSE_SOURCE });
    }
  }

  private attachDocument(doc: Document): () => void {
    const onUp = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) this.button(e.button, false);
      if (e.button === 0) this.dragEl = null;
    };
    const onMove = (e: MouseEvent) => {
      if (this.locked) this.movement(e.movementX, e.movementY, this.mode);
      else if (this.dragEl) this.movement(e.movementX, e.movementY, "css");
    };
    const onLock = () => {
      const lockedEl = doc.pointerLockElement as HTMLElement | null;
      const mine = lockedEl !== null && this.elements.has(lockedEl);
      this.lockChanged(mine, mine ? this.pendingMode : undefined);
      if (!mine) this.dragEl = null;
    };
    const onLockErr = () => {
      this.lastLockError = "pointerlockerror";
    };
    const onBlur = () => {
      this.dragEl = null;
      this.releaseAll();
    };
    doc.addEventListener("mouseup", onUp);
    doc.addEventListener("mousemove", onMove);
    doc.addEventListener("pointerlockchange", onLock);
    doc.addEventListener("pointerlockerror", onLockErr);
    doc.defaultView?.addEventListener("blur", onBlur);
    return () => {
      doc.removeEventListener("mouseup", onUp);
      doc.removeEventListener("mousemove", onMove);
      doc.removeEventListener("pointerlockchange", onLock);
      doc.removeEventListener("pointerlockerror", onLockErr);
      doc.defaultView?.removeEventListener("blur", onBlur);
    };
  }
}
