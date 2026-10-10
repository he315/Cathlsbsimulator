// ---------------------------------------------------------------------------
// Haptics abstraction.
//
// A browser can't drive a real force-feedback catheter, so "feel" is delivered
// through whichever channel the platform offers. Everything speaks to one
// `HapticAdapter` interface; the factory picks the best channel available and
// the rest of the app never cares which one it got:
//
//   • MousePseudoHapticsAdapter — the default. No actuator, so it fakes weight
//     with PSEUDO-HAPTICS: it lowers the control→display gain as resistance
//     rises, so a loaded catheter literally feels heavier / stickier to drag
//     (a well-established perceptual trick). The visible load meters, shaft
//     bowing and pressure wobble reinforce it.
//   • GamepadVibrationAdapter — if a gamepad with a vibration actuator is
//     connected, sustained resistance → low rumble, a torque-whip snap → a
//     sharp pulse.
//   • WebHIDHapticsAdapter — stub for a real force-feedback torquer over WebHID
//     (no cross-vendor FFB standard yet, so it reports unavailable).
//   • NullHapticsAdapter — no-op fallback.
// ---------------------------------------------------------------------------

export interface HapticSample {
  /** sustained resistance felt right now, 0..1 */
  resistance: number;
  /** transient torque-whip magnitude this frame, 0..1 */
  whip: number;
  /** wall / cusp contact firmness, 0..1 */
  contact: number;
}

export interface HapticAdapter {
  readonly name: string;
  /** whether this channel can actually deliver feedback on this device */
  readonly available: boolean;
  start(): void;
  stop(): void;
  /** called every physics tick with the current feel */
  update(s: HapticSample): void;
  /** one-shot kick (e.g. a whip release or a firm seat) */
  pulse(strength: number, ms: number): void;
  /**
   * Control→display gain the UI multiplies into drag deltas, 0..1. Below 1 the
   * catheter feels heavier / harder to move — the pseudo-haptic channel.
   */
  gain(): number;
}

// --- No-op fallback -------------------------------------------------------
export class NullHapticsAdapter implements HapticAdapter {
  readonly name = "null";
  readonly available = true;
  start() {}
  stop() {}
  update() {}
  pulse() {}
  gain() {
    return 1;
  }
}

// --- Mouse pseudo-haptics (default) --------------------------------------
export class MousePseudoHapticsAdapter implements HapticAdapter {
  readonly name = "mouse-pseudo";
  readonly available = true;
  private g = 1;
  start() {}
  stop() {
    this.g = 1;
  }
  update(s: HapticSample) {
    // Heavier as resistance builds; a whip momentarily lets go (slips).
    const heaviness = Math.min(0.6, s.resistance * 0.55 + s.contact * 0.15);
    const slip = s.whip * 0.25;
    this.g = Math.max(0.35, 1 - heaviness + slip);
  }
  pulse() {
    // No actuator — the visible whip banner / shaft snap carries the cue.
  }
  gain() {
    return this.g;
  }
}

// --- Gamepad rumble -------------------------------------------------------
interface VibrationActuatorLike {
  playEffect(
    type: string,
    params: { duration: number; strongMagnitude?: number; weakMagnitude?: number }
  ): Promise<unknown>;
}

export class GamepadVibrationAdapter implements HapticAdapter {
  readonly name = "gamepad";
  private last = 0;
  constructor(readonly available: boolean) {}
  private actuator(): VibrationActuatorLike | null {
    const pads = navigator.getGamepads?.() ?? [];
    for (const p of pads) {
      const a = (p as unknown as { vibrationActuator?: VibrationActuatorLike })
        ?.vibrationActuator;
      if (a?.playEffect) return a;
    }
    return null;
  }
  start() {}
  stop() {}
  update(s: HapticSample) {
    const now = performance.now();
    if (now - this.last < 80) return; // throttle to ~12 Hz
    this.last = now;
    const a = this.actuator();
    if (!a) return;
    a.playEffect("dual-rumble", {
      duration: 90,
      strongMagnitude: Math.min(1, s.resistance * 0.7 + s.whip),
      weakMagnitude: Math.min(1, s.contact * 0.6),
    }).catch(() => {});
  }
  pulse(strength: number, ms: number) {
    this.actuator()
      ?.playEffect("dual-rumble", {
        duration: ms,
        strongMagnitude: Math.min(1, strength),
        weakMagnitude: Math.min(1, strength * 0.5),
      })
      .catch(() => {});
  }
  gain() {
    return 1;
  }
}

// --- WebHID force-feedback torquer (stub) --------------------------------
export class WebHIDHapticsAdapter implements HapticAdapter {
  readonly name = "webhid";
  // No cross-vendor force-feedback HID standard yet; reports unavailable so
  // the factory never selects it. Wiring point for a real haptic torquer.
  readonly available = false;
  start() {}
  stop() {}
  update() {}
  pulse() {}
  gain() {
    return 1;
  }
}

function pickAdapter(): HapticAdapter {
  // A connected, vibration-capable gamepad wins; otherwise pseudo-haptics.
  try {
    const pads = navigator.getGamepads?.() ?? [];
    const hasRumble = Array.from(pads).some(
      (p) => (p as unknown as { vibrationActuator?: unknown })?.vibrationActuator
    );
    if (hasRumble) return new GamepadVibrationAdapter(true);
  } catch {
    /* getGamepads unavailable */
  }
  return new MousePseudoHapticsAdapter();
}

// Live singleton the store tick feeds and the control deck reads.
export const haptics: HapticAdapter = pickAdapter();
