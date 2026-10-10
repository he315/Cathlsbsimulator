// ---------------------------------------------------------------------------
// Contracts shared by the hands (input), the devices (rod physics), the
// patient engine, the imaging chain and the mentor. Streams code against these
// types; implementations live in their own modules.
// ---------------------------------------------------------------------------

/** What is in the operator's hands or on the table. */
export type DeviceSlot =
  | "sheath"
  | "wire035" // 0.035-inch J wire for catheter delivery
  | "catheter" // diagnostic or guiding catheter
  | "wire014" // coronary guidewire (the PCI lab's first rail)
  | "balloon"
  | "stent"
  | "wire014b" // a second coronary guidewire in the same guide (the PCI lab's second rail, pci-two-rail-engine)
  | "balloon2" // the device on the second wire (a balloon, stent or imaging catheter on rail 2)
  | "pressureWire"
  | "ivus"
  | "pigtail";

/**
 * A command from the hands to a device. Push is millimetres of axial travel at the hub
 * (positive = advance); torque is radians of rotation at the hub (positive = clockwise as
 * seen by the operator looking down the device). Pins hold a device still while another moves.
 */
export type HandCommand =
  | { kind: "push"; device: DeviceSlot; mm: number }
  | { kind: "torque"; device: DeviceSlot; rad: number }
  | { kind: "pin"; device: DeviceSlot; on: boolean }
  | { kind: "grip"; hand: "left" | "right"; device: DeviceSlot | null }
  | { kind: "regrip"; hand: "left" | "right" };

/** Foot switches: fluoroscopy and cine are separate, as on a real table. */
export interface PedalState {
  fluoro: boolean;
  cine: boolean;
}

/** Hand injection through the manifold: plunger force (0..1 of a firm push) and travel. */
export interface SyringeCommand {
  /** 0 = released … 1 = a firm two-handed push */
  force: number;
  /** "contrast" from the contrast port, "saline" flush, or aspirate (negative force) */
  port: "contrast" | "saline" | "aspirate";
}

/** Reaction felt at the hub, computed by the device physics. */
export interface HubReaction {
  device: DeviceSlot;
  /** axial resistance (N, model units) */
  axial: number;
  /** stored torque (N·mm, model units) */
  torsion: number;
  /** a sudden release of stored torque or length (whip, jump) */
  snap: boolean;
  /** the tip is wedged or damping the pressure */
  wedged: boolean;
}

/** Anything that must survive rewind-to-decision and deterministic replay. */
export interface Snapshotable<T> {
  snapshot(): T;
  restore(s: T): void;
}

/** One telemetry record for the mentor, replay and debrief. */
export interface TelemetryEvent {
  /** wall-clock seconds since the session started */
  tWall: number;
  /** patient clock seconds */
  tPatient: number;
  kind: string;
  data?: Record<string, unknown>;
}
