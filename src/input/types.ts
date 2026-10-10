// ---------------------------------------------------------------------------
// Input layer types.
//
// Physical input sources (keyboard, pointer-lock mouse, trackpad, gamepad,
// MIDI and HID foot switches, a DIY torquer) do not talk to devices directly.
// Each one turns what the user's hands and feet did into an `Intent` measured
// in physical units (millimetres of hand travel, radians of knob rotation,
// pedal up/down, plunger force). The router (system.ts) feeds intents to the
// HandState and PedalMerger, which emit the shared session contracts
// (HandCommand, PedalState, SyringeCommand from src/simulation/session/types.ts)
// on the input bus.
// ---------------------------------------------------------------------------

import type {
  DeviceSlot,
  HandCommand,
  HubReaction,
  PedalState,
  SyringeCommand,
} from "../simulation/session/types";

export type { DeviceSlot, HandCommand, HubReaction, PedalState, SyringeCommand };

export type Hand = "left" | "right";

/** What the right hand can hold. The syringe is on the manifold, not a device slot. */
export type GripTarget = DeviceSlot | "syringe";

/**
 * What the left hand can fix. "wire" resolves to the coronary or 0.035 wire on the
 * table, "guide" to the guiding or diagnostic catheter, "sheath" to the sheath hub.
 * "auto" picks the usual partner of the right-hand device ("I have the wire" when
 * the right hand moves a balloon, the guide when the right hand torques the wire).
 */
export type PinTarget = "wire" | "guide" | "sheath";

export type PedalName = keyof PedalState; // "fluoro" | "cine"

export type SyringePort = SyringeCommand["port"];

/** Identifies an input source instance (e.g. "keyboard", "mouse", "gamepad:0", "midi", "hid:1234:5678"). */
export type SourceId = string;

export type SourceKind = "keyboard" | "mouse" | "trackpad" | "gamepad" | "midi" | "hid" | "torquer" | "ui";

/**
 * A physical action, already converted to physical units by the source's own
 * calibration. Axial + is hand travel away from the operator towards the patient
 * (advance). Lateral + is the fingertip moving to the operator's right across the
 * top of the gripped cylinder, which turns it clockwise as seen looking down the
 * device from the hub (the HandCommand torque sign).
 */
export type Intent =
  /** fingers close on (on=true) or let go of (on=false) the right-hand device */
  | { t: "grab"; on: boolean; source: SourceId }
  /** hand travel in mm while gripping */
  | { t: "move"; axialMm: number; lateralMm: number; source: SourceId }
  /** direct rotation of the gripped device (rotary encoder on a torquer), radians */
  | { t: "roll"; rad: number; source: SourceId }
  /** move the right hand to a device */
  | { t: "select"; target: GripTarget }
  /** move the right hand to grip-order slot n (1-based, keys 1-5) */
  | { t: "selectIndex"; index: number }
  /** move the right hand to the next or previous device in the grip order */
  | { t: "cycle"; dir: 1 | -1 }
  /** left hand holds (on) or releases (off) a device */
  | { t: "pin"; target: PinTarget | "auto"; on: boolean; source: SourceId }
  /** foot switch */
  | { t: "pedal"; pedal: PedalName; on: boolean; source: SourceId }
  /**
   * Plunger force, 0..1 of a firm push; negative = aspirate. `port` overrides the
   * current manifold port for this command.
   */
  | { t: "plunger"; force: number; port?: "contrast" | "saline"; source: SourceId }
  /** choose which port the syringe draws from / injects through */
  | { t: "port"; port: "contrast" | "saline" }
  /** C-arm angular velocity request (dead-man: zero when released) */
  | { t: "carm"; laoDegPerS: number; cranDegPerS: number; source: SourceId }
  /** table pan velocity request (dead-man) */
  | { t: "table"; xMmPerS: number; yMmPerS: number; source: SourceId }
  /** release everything this source holds (blur, disconnect, lost pointer lock) */
  | { t: "releaseSource"; source: SourceId };

/** C-arm velocity command emitted on the bus for the C-arm dynamics (owned by the lab shell). */
export interface CArmVelocity {
  /** + = towards LAO */
  laoDegPerS: number;
  /** + = towards cranial */
  cranDegPerS: number;
}

/** Table pan velocity emitted on the bus. +x = table towards the operator's right on the monitor, +y = towards the head. */
export interface TableVelocity {
  xMmPerS: number;
  yMmPerS: number;
}

/** Why a motion was not passed on (for sound, the mentor and the table view). */
export interface BlockedEvent {
  device: GripTarget | null;
  reason: "pinned" | "span" | "transition" | "absent" | "not-gripped";
}

/** Read-only view of both hands, for the table view and the calibration screen. */
export interface HandView {
  right: {
    /** device the hand is at (null while moving between devices) */
    at: GripTarget | null;
    /** fingers closed on the device */
    gripped: boolean;
    /** moving between devices: from, to, progress 0..1 */
    transition: { from: GripTarget | null; to: GripTarget; progress: number } | null;
    /** hand axial offset from where it grasped, mm (+ = towards patient) */
    pushOffsetMm: number;
    /** fingertip lateral offset from where it grasped, mm */
    rollOffsetMm: number;
    /** span limits for the current grip, mm */
    pushSpanMm: number;
    rollSpanMm: number;
    /** syringe plunger force currently applied (0 if not on the syringe) */
    plungerForce: number;
  };
  left: {
    pin: PinTarget | null;
    /** the device slot the pin resolved to */
    pinnedDevice: DeviceSlot | null;
  };
  syringePort: "contrast" | "saline";
}

/** Physics reaction with optional contact detail (S7 may add per-node contact). */
export interface HapticFeel extends HubReaction {
  /** strongest wall or cusp contact force along the device, model units */
  contact?: number;
}

export interface SourceStatus {
  id: SourceId;
  kind: SourceKind;
  label: string;
  /** API present in this browser */
  supported: boolean;
  /** connected / permission granted / attached */
  connected: boolean;
  detail?: string;
}

/** Event map for the input bus. */
export interface InputEvents {
  /** hand commands for the device physics */
  hand: HandCommand;
  /** merged foot-switch state, emitted on every change */
  pedal: PedalState;
  /** syringe plunger command, emitted on every change */
  syringe: SyringeCommand;
  carm: CArmVelocity;
  table: TableVelocity;
  /** hand view after any change */
  hands: HandView;
  /** physics → input: hub reaction for pseudo-haptics and rumble */
  reaction: HapticFeel;
  blocked: BlockedEvent;
  sources: SourceStatus[];
  /** a calibration finished; payload is the device key */
  calibrated: { device: string; mmPerCount: number };
}

/** Minimal storage interface so settings can be tested without a browser. */
export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}
