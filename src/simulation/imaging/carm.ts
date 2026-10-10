// ---------------------------------------------------------------------------
// C-arm and table dynamics for the lab shell.
//
// The operator commands a velocity (joystick: gamepad stick or held arrows) or
// drives toward a stored position (a memory, driven only while its key or
// button is held). The arm accelerates, is capped at a speed and stops when the
// command goes away (dead-man). Views therefore take physical time, and any
// angle on the continuum is reachable, not only the 5 degree grid.
//
// Every number here is a MODEL PARAMETER (docs/realism/facts/C2.md, "Model
// parameters"): no source giving C-arm angular speeds or table inertia was
// opened for this step.
// ---------------------------------------------------------------------------

import type { CArm } from "../../types";

export interface CArmLimits {
  /** LAO (+) / RAO (-) range, degrees */
  laoMin: number;
  laoMax: number;
  /** cranial (+) / caudal (-) range, degrees */
  cranMin: number;
  cranMax: number;
}

export interface CArmParams {
  /** speed cap per axis, deg/s (model) */
  maxSpeed: number;
  /** acceleration and braking, deg/s^2 (model) */
  accel: number;
  /** a memory drive counts as arrived within this many degrees (model) */
  arriveDeg: number;
}

/** Model parameters (facts C2: model). */
export const CARM_PARAMS: CArmParams = { maxSpeed: 15, accel: 30, arriveDeg: 0.05 };
/** The diagnostic store's mechanical range (the lab clamps here; useSimulatorStore.setCArm uses the same). */
export const CARM_LIMITS: CArmLimits = { laoMin: -90, laoMax: 90, cranMin: -45, cranMax: 45 };

export interface CArmDriveState {
  laoRao: number;
  cranialCaudal: number;
  vLao: number;
  vCran: number;
}

/** Move one value toward a target velocity at a bounded acceleration. */
function approach(v: number, target: number, maxDv: number): number {
  const d = target - v;
  if (Math.abs(d) <= maxDv) return target;
  return v + Math.sign(d) * maxDv;
}

/** Fastest velocity from which the axis can still stop at a distance `dist` (signed) at `accel`. */
function brakingSpeed(dist: number, accel: number, cap: number): number {
  return Math.sign(dist) * Math.min(cap, Math.sqrt(2 * accel * Math.abs(dist)));
}

export class CArmDrive {
  private s: CArmDriveState;
  private cmd = { lao: 0, cran: 0 };
  private target: CArm | null = null;
  readonly params: CArmParams;
  readonly limits: CArmLimits;

  constructor(start: CArm = { laoRao: 0, cranialCaudal: 0 }, params: Partial<CArmParams> = {}, limits: Partial<CArmLimits> = {}) {
    this.params = { ...CARM_PARAMS, ...params };
    this.limits = { ...CARM_LIMITS, ...limits };
    this.s = { laoRao: start.laoRao, cranialCaudal: start.cranialCaudal, vLao: 0, vCran: 0 };
  }

  get state(): Readonly<CArmDriveState> {
    return this.s;
  }

  get angles(): CArm {
    return { laoRao: this.s.laoRao, cranialCaudal: this.s.cranialCaudal };
  }

  /** True while the arm is moving (or a drive is pending). */
  get moving(): boolean {
    return Math.abs(this.s.vLao) > 1e-6 || Math.abs(this.s.vCran) > 1e-6 || this.cmd.lao !== 0 || this.cmd.cran !== 0 || this.target !== null;
  }

  /** Joystick: commanded angular velocity (deg/s). Zero = released (the arm brakes to a stop). */
  setCommandedVelocity(laoDegPerS: number, cranDegPerS: number) {
    this.cmd = { lao: Number.isFinite(laoDegPerS) ? laoDegPerS : 0, cran: Number.isFinite(cranDegPerS) ? cranDegPerS : 0 };
    if (this.cmd.lao !== 0 || this.cmd.cran !== 0) this.target = null; // the joystick overrides a memory drive
  }

  /** Memory drive: move toward `target` while held; `null` releases the key (the arm brakes where it is). */
  driveTo(target: CArm | null) {
    this.target = target ? this.clamp(target) : null;
  }

  get driving(): CArm | null {
    return this.target;
  }

  /** Teleport (case load, tests). Velocity is zeroed. */
  set(a: CArm) {
    const c = this.clamp(a);
    this.s = { laoRao: c.laoRao, cranialCaudal: c.cranialCaudal, vLao: 0, vCran: 0 };
    this.target = null;
    this.cmd = { lao: 0, cran: 0 };
  }

  /** Emergency stop: everything released, velocity zero at once. */
  stop() {
    this.cmd = { lao: 0, cran: 0 };
    this.target = null;
    this.s.vLao = 0;
    this.s.vCran = 0;
  }

  private clamp(a: CArm): CArm {
    const L = this.limits;
    return {
      laoRao: Math.max(L.laoMin, Math.min(L.laoMax, a.laoRao)),
      cranialCaudal: Math.max(L.cranMin, Math.min(L.cranMax, a.cranialCaudal)),
    };
  }

  /** Advance by dt seconds. Returns true when the angles changed. */
  step(dt: number): boolean {
    if (!(dt > 0)) return false;
    const P = this.params;
    const L = this.limits;
    const s = this.s;
    // integrate in small sub-steps so large dt (a slow frame) keeps the same kinematics
    const n = Math.max(1, Math.ceil(dt / 0.01));
    const h = dt / n;
    const before = { a: s.laoRao, b: s.cranialCaudal };
    for (let i = 0; i < n; i++) {
      let wantA: number;
      let wantB: number;
      if (this.target) {
        const dA = this.target.laoRao - s.laoRao;
        const dB = this.target.cranialCaudal - s.cranialCaudal;
        wantA = brakingSpeed(dA, P.accel, P.maxSpeed);
        wantB = brakingSpeed(dB, P.accel, P.maxSpeed);
        if (Math.abs(dA) < P.arriveDeg && Math.abs(s.vLao) < P.accel * h * 1.5) {
          s.laoRao = this.target.laoRao;
          s.vLao = 0;
          wantA = 0;
        }
        if (Math.abs(dB) < P.arriveDeg && Math.abs(s.vCran) < P.accel * h * 1.5) {
          s.cranialCaudal = this.target.cranialCaudal;
          s.vCran = 0;
          wantB = 0;
        }
      } else {
        wantA = Math.max(-P.maxSpeed, Math.min(P.maxSpeed, this.cmd.lao));
        wantB = Math.max(-P.maxSpeed, Math.min(P.maxSpeed, this.cmd.cran));
      }
      s.vLao = approach(s.vLao, wantA, P.accel * h);
      s.vCran = approach(s.vCran, wantB, P.accel * h);
      s.laoRao += s.vLao * h;
      s.cranialCaudal += s.vCran * h;
      if (s.laoRao <= L.laoMin || s.laoRao >= L.laoMax) {
        s.laoRao = Math.max(L.laoMin, Math.min(L.laoMax, s.laoRao));
        s.vLao = 0;
      }
      if (s.cranialCaudal <= L.cranMin || s.cranialCaudal >= L.cranMax) {
        s.cranialCaudal = Math.max(L.cranMin, Math.min(L.cranMax, s.cranialCaudal));
        s.vCran = 0;
      }
    }
    // on arrival the target is kept while the key is held, so the arm stays put
    return s.laoRao !== before.a || s.cranialCaudal !== before.b;
  }
}

// ---------------------------------------------------------------------------
// Table: pan (x: patient left +, y: head +) with inertia, and height.
// ---------------------------------------------------------------------------

export interface TableParams {
  /** pan speed cap, mm/s (model) */
  maxSpeed: number;
  /** pan acceleration and braking, mm/s^2 (model) */
  accel: number;
  /** height speed, mm/s (model) */
  heightSpeed: number;
  /** pan range from the start position, mm (the diagnostic store's clamp) */
  panX: number;
  panY: number;
  /** height range about the start height, mm (model) */
  height: number;
}

export const TABLE_PARAMS: TableParams = { maxSpeed: 60, accel: 150, heightSpeed: 25, panX: 90, panY: 120, height: 100 };

export interface TableDriveState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** table top height relative to the start, mm (+ = up) */
  height: number;
}

export class TableDrive {
  private s: TableDriveState;
  private cmd = { x: 0, y: 0, h: 0 };
  readonly params: TableParams;

  constructor(start: { x?: number; y?: number; height?: number } = {}, params: Partial<TableParams> = {}) {
    this.params = { ...TABLE_PARAMS, ...params };
    this.s = { x: start.x ?? 0, y: start.y ?? 0, vx: 0, vy: 0, height: start.height ?? 0 };
  }

  get state(): Readonly<TableDriveState> {
    return this.s;
  }

  get moving(): boolean {
    return Math.abs(this.s.vx) > 1e-6 || Math.abs(this.s.vy) > 1e-6 || this.cmd.x !== 0 || this.cmd.y !== 0 || this.cmd.h !== 0;
  }

  /** Pan velocity request (mm/s); zero = released, the table brakes (the float lock engages). */
  setCommandedVelocity(xMmPerS: number, yMmPerS: number) {
    this.cmd.x = Number.isFinite(xMmPerS) ? xMmPerS : 0;
    this.cmd.y = Number.isFinite(yMmPerS) ? yMmPerS : 0;
  }

  /** Height motor: -1 down, 0 stop, +1 up. */
  setHeightCommand(dir: -1 | 0 | 1) {
    this.cmd.h = dir;
  }

  set(p: { x: number; y: number; height?: number }) {
    this.s = { x: p.x, y: p.y, vx: 0, vy: 0, height: p.height ?? this.s.height };
    this.cmd = { x: 0, y: 0, h: 0 };
  }

  step(dt: number): boolean {
    if (!(dt > 0)) return false;
    const P = this.params;
    const s = this.s;
    const before = { x: s.x, y: s.y, h: s.height };
    const n = Math.max(1, Math.ceil(dt / 0.01));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      s.vx = approach(s.vx, Math.max(-P.maxSpeed, Math.min(P.maxSpeed, this.cmd.x)), P.accel * h);
      s.vy = approach(s.vy, Math.max(-P.maxSpeed, Math.min(P.maxSpeed, this.cmd.y)), P.accel * h);
      s.x += s.vx * h;
      s.y += s.vy * h;
      if (Math.abs(s.x) >= P.panX) {
        s.x = Math.sign(s.x) * P.panX;
        s.vx = 0;
      }
      if (Math.abs(s.y) >= P.panY) {
        s.y = Math.sign(s.y) * P.panY;
        s.vy = 0;
      }
      s.height = Math.max(-P.height, Math.min(P.height, s.height + this.cmd.h * P.heightSpeed * h));
    }
    return s.x !== before.x || s.y !== before.y || s.height !== before.h;
  }
}

/** Time (s) a single axis needs to travel `deg` from rest to rest at the given parameters (for tests and the mentor). */
export function travelTime(deg: number, p: CArmParams = CARM_PARAMS): number {
  const d = Math.abs(deg);
  const dAccel = (p.maxSpeed * p.maxSpeed) / p.accel; // accelerate + brake distance at the cap
  if (d <= dAccel) return 2 * Math.sqrt(d / p.accel);
  return 2 * (p.maxSpeed / p.accel) + (d - dAccel) / p.maxSpeed;
}
