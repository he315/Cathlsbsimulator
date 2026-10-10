// ---------------------------------------------------------------------------
// Feel from forces.
//
// The device physics reports the reaction at the hub (HubReaction: axial
// resistance, stored torsion, snaps, wedging; optional peak contact force).
// This module turns that one physical signal into every feedback channel the
// browser has:
//
//  - PseudoHapticGain: the control/display gain for mouse and trackpad motion
//    drops smoothly as the hub pushes back, so a loaded catheter feels heavier
//    to move. Gain = gMin + (1 - gMin) / (1 + |F| / F_half), low-pass filtered
//    with time constant tau so a step in force never gives a step in feel.
//  - RumbleMapper: gamepad dual-rumble amplitude scales with axial force
//    (strong motor) and contact / torsion (weak motor); a snap is a short pulse.
//    Effect parameters follow GamepadHapticActuator.playEffect (facts S8 F3).
//  - Torquer output report: brake and rumble bytes for the DIY torquer
//    (format in hidPedals.ts).
//
// All force scales are MODEL PARAMETERS in HubReaction model units; retune them
// once the rod physics (S7) publishes its force scale.
// ---------------------------------------------------------------------------

import type { HapticGains } from "./handState";
import type { HapticFeel } from "./types";

export interface PseudoHapticParams {
  /** axial force at which the push gain is halfway to gMin (model units) */
  axialHalf: number;
  /** stored torsion at which the roll gain is halfway to gMin (model units) */
  torsionHalf: number;
  /** floor of the gain: the device never stops responding entirely */
  gMin: number;
  /** low-pass time constant, s */
  tauS: number;
  /** reaction older than this is ignored (physics paused), s */
  staleS: number;
}

export const DEFAULT_PSEUDO: PseudoHapticParams = {
  axialHalf: 0.5, // model
  torsionHalf: 2.0, // model
  gMin: 0.3, // model
  tauS: 0.12, // model
  staleS: 0.3, // model
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function pseudoTarget(force: number, half: number, gMin: number, strength = 1): number {
  const f = Math.abs(Number.isFinite(force) ? force : 0);
  const raw = gMin + (1 - gMin) / (1 + f / Math.max(1e-9, half));
  return 1 - clamp01(strength) * (1 - raw);
}

export class PseudoHapticGain {
  private g: HapticGains = { push: 1, roll: 1 };
  private last: HapticFeel | null = null;
  private age = Infinity;
  constructor(private p: PseudoHapticParams = DEFAULT_PSEUDO, private strength = 1) {}

  setStrength(s: number) {
    this.strength = clamp01(s);
  }

  feed(f: HapticFeel) {
    this.last = f;
    this.age = 0;
  }

  /** Advance the filter by dt seconds; returns the current gains. */
  step(dtS: number): HapticGains {
    const dt = Math.max(0, Number.isFinite(dtS) ? dtS : 0);
    this.age += dt;
    const fresh = this.last && this.age <= this.p.staleS;
    const tp = fresh ? pseudoTarget(this.last!.axial, this.p.axialHalf, this.p.gMin, this.strength) : 1;
    const tr = fresh ? pseudoTarget(this.last!.torsion, this.p.torsionHalf, this.p.gMin, this.strength) : 1;
    const a = this.p.tauS > 0 ? 1 - Math.exp(-dt / this.p.tauS) : 1;
    this.g = { push: this.g.push + (tp - this.g.push) * a, roll: this.g.roll + (tr - this.g.roll) * a };
    return this.gains();
  }

  gains(): HapticGains {
    return { ...this.g };
  }

  reset() {
    this.g = { push: 1, roll: 1 };
    this.last = null;
    this.age = Infinity;
  }
}

export interface RumbleEffect {
  strongMagnitude: number;
  weakMagnitude: number;
  /** ms */
  duration: number;
}

export interface RumbleParams {
  axialSat: number;
  torsionSat: number;
  contactSat: number;
  /** minimum interval between sustained effects, ms */
  intervalMs: number;
  /** sustained effect duration (slightly longer than the interval so pulses overlap), ms */
  durationMs: number;
  snap: RumbleEffect;
  /** amplitudes below this count as silence */
  floor: number;
}

export const DEFAULT_RUMBLE: RumbleParams = {
  axialSat: 1.5, // model
  torsionSat: 6, // model
  contactSat: 1.5, // model
  intervalMs: 80, // model: about 12 updates per second
  durationMs: 100, // model
  snap: { strongMagnitude: 1, weakMagnitude: 0.6, duration: 120 }, // model
  floor: 0.02,
};

/** Map a reaction to a rumble amplitude pair (no throttling). */
export function rumbleAmplitude(f: HapticFeel, p: RumbleParams = DEFAULT_RUMBLE): { strong: number; weak: number } {
  const strong = clamp01(Math.abs(f.axial) / p.axialSat);
  const weak = clamp01(Math.max(Math.abs(f.contact ?? 0) / p.contactSat, Math.abs(f.torsion) / p.torsionSat));
  return { strong, weak };
}

export class RumbleMapper {
  private lastAt = -Infinity;
  private lastSilent = true;
  constructor(private p: RumbleParams = DEFAULT_RUMBLE) {}

  /** Decide the effect to play now, or null. A snap always plays at once. */
  step(f: HapticFeel | null, nowMs: number): RumbleEffect | null {
    if (f?.snap) {
      this.lastAt = nowMs;
      this.lastSilent = false;
      return { ...this.p.snap };
    }
    if (nowMs - this.lastAt < this.p.intervalMs) return null;
    const a = f ? rumbleAmplitude(f, this.p) : { strong: 0, weak: 0 };
    const silent = a.strong < this.p.floor && a.weak < this.p.floor;
    if (silent && this.lastSilent) return null;
    this.lastAt = nowMs;
    this.lastSilent = silent;
    return silent
      ? { strongMagnitude: 0, weakMagnitude: 0, duration: 0 }
      : { strongMagnitude: a.strong, weakMagnitude: a.weak, duration: this.p.durationMs };
  }
}

/** Something that can play a rumble effect (a gamepad, the torquer). */
export interface RumbleSink {
  play(e: RumbleEffect): void;
}

interface ActuatorLike {
  playEffect(type: string, params: { duration?: number; startDelay?: number; strongMagnitude?: number; weakMagnitude?: number }): Promise<unknown>;
}

/** Plays dual-rumble on the first connected gamepad that has an actuator. */
export class GamepadRumbleSink implements RumbleSink {
  constructor(private getPads: () => ArrayLike<Gamepad | null> = () => (typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [])) {}
  private actuator(): ActuatorLike | null {
    let pads: ArrayLike<Gamepad | null> = [];
    try {
      pads = this.getPads();
    } catch {
      return null;
    }
    for (let i = 0; i < pads.length; i++) {
      const a = (pads[i] as unknown as { vibrationActuator?: ActuatorLike } | null)?.vibrationActuator;
      if (a && typeof a.playEffect === "function") return a;
    }
    return null;
  }
  available(): boolean {
    return this.actuator() !== null;
  }
  play(e: RumbleEffect) {
    const a = this.actuator();
    if (!a) return;
    a.playEffect("dual-rumble", { duration: e.duration, startDelay: 0, strongMagnitude: e.strongMagnitude, weakMagnitude: e.weakMagnitude }).catch(() => {});
  }
}

/** Torquer output report 2: [brake 0-255, rumble 0-255, pulse ms/4, reserved]. */
export function torquerOutputReport(brake: number, e: RumbleEffect | null): Uint8Array {
  const b = Math.round(clamp01(brake) * 255);
  const r = e ? Math.round(clamp01(Math.max(e.strongMagnitude, e.weakMagnitude)) * 255) : 0;
  const ms = e ? Math.min(255, Math.round(e.duration / 4)) : 0;
  return new Uint8Array([b, r, ms, 0]);
}

/**
 * Owns the pseudo-haptic gain and the rumble channels. Fed with reactions
 * (bus "reaction") and stepped once per frame by the input system.
 */
export class HapticsController {
  readonly pseudo: PseudoHapticGain;
  readonly rumble: RumbleMapper;
  private sinks = new Set<RumbleSink>();
  private last: HapticFeel | null = null;
  /** seconds since the last reaction (Infinity before the first) */
  private age = Infinity;
  private staleS: number;
  private pendingSnap = false;
  enabledPseudo = true;
  enabledRumble = true;

  constructor(pseudo?: PseudoHapticParams, rumble?: RumbleParams) {
    this.pseudo = new PseudoHapticGain(pseudo);
    this.rumble = new RumbleMapper(rumble);
    this.staleS = (pseudo ?? DEFAULT_PSEUDO).staleS;
  }

  addSink(s: RumbleSink): () => void {
    this.sinks.add(s);
    return () => this.sinks.delete(s);
  }

  feed(f: HapticFeel) {
    this.last = f;
    this.age = 0;
    if (f.snap) this.pendingSnap = true;
    this.pseudo.feed(f);
  }

  /**
   * The latest reaction while it is fresh, else null. A reaction older than
   * staleS (physics paused, case finished, nobody feeding) counts as no load,
   * so rumble and the torquer brake fall silent instead of holding the last load.
   */
  current(): HapticFeel | null {
    return this.last && this.age <= this.staleS ? this.last : null;
  }

  /** Once per frame. */
  step(dtS: number, nowMs: number): HapticGains {
    const dt = Math.max(0, Number.isFinite(dtS) ? dtS : 0);
    this.age += dt;
    const g = this.pseudo.step(dt);
    if (this.sinks.size) {
      // disabled or stale: step with null so a sustained effect is followed by exactly one zero effect
      const cur = this.enabledRumble ? this.current() : null;
      const f = cur ? { ...cur, snap: this.pendingSnap } : null;
      const e = this.rumble.step(f, nowMs);
      if (e) for (const s of this.sinks) s.play(e);
    }
    this.pendingSnap = false;
    return this.enabledPseudo ? g : { push: 1, roll: 1 };
  }

  gains(): HapticGains {
    return this.enabledPseudo ? this.pseudo.gains() : { push: 1, roll: 1 };
  }

  /** Forget the load at once (pause, case end): gains return to 1, rumble and brake stop on the next step. */
  clear() {
    this.last = null;
    this.age = Infinity;
    this.pendingSnap = false;
    this.pseudo.reset();
  }

  /** One-off pulse (calibration screen test). */
  pulse(strength: number, ms: number) {
    const e: RumbleEffect = { strongMagnitude: clamp01(strength), weakMagnitude: clamp01(strength * 0.5), duration: ms };
    for (const s of this.sinks) s.play(e);
  }
}
