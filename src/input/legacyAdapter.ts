// ---------------------------------------------------------------------------
// Bridges from hand commands to the pre-rod engines, so the grips can be used
// before the rod physics (S7) is wired in. Typed structurally: nothing here
// imports the stores, the lab passes the functions in.
//
// Unit factors are MODEL PARAMETERS: the legacy diagnostic engine uses an
// abstract insertion "depth" (displayed as mm) and radians for torque; the PCI
// engine moves the wire and devices in mm along the vessel path.
// ---------------------------------------------------------------------------

import type { InputBus } from "./bus";
import type { DeviceSlot, HandCommand, HapticFeel, PedalState } from "./types";

/** Diagnostic lab (useSimulatorStore) actions used by the adapter. */
export interface DiagnosticTarget {
  commandInsertion(delta: number): void;
  commandTorque(delta: number): void;
  commandWire(delta: number): void;
  setFluoroLive(on: boolean): void;
}

export const LEGACY_INSERTION_PER_MM = 1; // model: legacy depth is displayed as mm
export const LEGACY_WIRE_PER_MM = 1; // model

export function applyToDiagnostic(c: HandCommand, t: DiagnosticTarget) {
  if (c.kind === "push") {
    if (c.device === "catheter" || c.device === "pigtail") t.commandInsertion(c.mm * LEGACY_INSERTION_PER_MM);
    else if (c.device === "wire035") t.commandWire(c.mm * LEGACY_WIRE_PER_MM);
  } else if (c.kind === "torque") {
    if (c.device === "catheter" || c.device === "pigtail") t.commandTorque(c.rad);
  }
}

/** A device physics session that takes the hand commands as they are (src/ui/physics/, diag-rod-physics). */
export interface PhysicsHandTarget {
  command(c: HandCommand): void;
}

/**
 * The diagnostic lab's hands: to the rod physics when it runs (every command as it is: push, torque,
 * pin and grip), else to the legacy engine through applyToDiagnostic (the simple model's fallback).
 */
export function routeDiagnosticHand(c: HandCommand, physics: PhysicsHandTarget | null, legacy: DiagnosticTarget) {
  if (physics) physics.command(c);
  else applyToDiagnostic(c, legacy);
}

/**
 * PCI lab actions (pci-lab-input). The hands drive the PCI engine as the lab wraps it:
 *  - the coronary wire: push to moveWire, torque to torqueWire, pin to pinWire;
 *  - the device on the wire (balloon, stent, imaging catheter): push to advanceDevice, the delivery
 *    path that meets the guide's back-up and drags an unpinned wire (deliver(), src/simulation/pci/guide.ts),
 *    never the assisted moveDevice, which is used only by a target that has no advanceDevice (an older
 *    caller of this adapter);
 *  - the guide: a push re-engages a guide that is out of the ostium (engageGuide), otherwise seats it
 *    deeper or draws it back (seatGuide); pin to pinGuide.
 * Optional members are the actions a target may not offer yet; a command for one of them is not handled.
 */
export interface PciTarget {
  moveWire(mm: number): unknown;
  torqueWire(rad: number): unknown;
  /** the device with the delivery physics */
  advanceDevice?(mm: number): unknown;
  /** @deprecated the assisted move without the delivery physics; used only when advanceDevice is absent */
  moveDevice?(mm: number): unknown;
  /** the guide is in the ostium (a push on a disengaged guide engages it) */
  guideEngaged?(): boolean;
  engageGuide?(): unknown;
  seatGuide?(mm: number): unknown;
  pinWire?(on: boolean): unknown;
  pinGuide?(on: boolean): unknown;
}

/** The device slots that ride on the coronary wire in the PCI lab (one device at a time). */
export const PCI_RAIL_DEVICES: DeviceSlot[] = ["balloon", "stent", "ivus"];
const PCI_DEVICE = PCI_RAIL_DEVICES;

/** Route one hand command to the PCI target. Returns true when the target took it. */
export function applyToPci(c: HandCommand, t: PciTarget): boolean {
  if (c.kind === "push") {
    if (c.device === "wire014" || c.device === "pressureWire") {
      t.moveWire(c.mm);
      return true;
    }
    if (PCI_DEVICE.includes(c.device)) {
      if (t.advanceDevice) t.advanceDevice(c.mm);
      else if (t.moveDevice) t.moveDevice(c.mm);
      else return false;
      return true;
    }
    if (c.device === "catheter") {
      if (c.mm > 0 && t.guideEngaged && !t.guideEngaged() && t.engageGuide) {
        t.engageGuide();
        return true;
      }
      if (t.seatGuide) {
        t.seatGuide(c.mm);
        return true;
      }
    }
    return false;
  }
  if (c.kind === "torque") {
    if (c.device === "wire014" || c.device === "pressureWire") {
      t.torqueWire(c.rad);
      return true;
    }
    return false;
  }
  if (c.kind === "pin") {
    if ((c.device === "wire014" || c.device === "pressureWire") && t.pinWire) {
      t.pinWire(c.on);
      return true;
    }
    if (c.device === "catheter" && t.pinGuide) {
      t.pinGuide(c.on);
      return true;
    }
  }
  return false;
}

/**
 * The PCI hub reaction on the bus (pci-lab-input): the HubReaction the haptics read (axial load,
 * snap when the guide jumps back) with the delivery forces of deliver() it came from. Emitted as a
 * 'reaction' event; the extra fields ride along for the table view, the attending and tests.
 */
export interface PciReaction extends HapticFeel {
  /** force needed to advance the device at its tip (N, deliver() requiredN, MODEL PARAMETER scale) */
  requiredN: number;
  /** what the guide could react before it moved (N, deliver() backupN) */
  backupN: number;
  /** rail friction and lesion crossing load, the parts of requiredN (N) */
  frictionN: number;
  lesionN: number;
  /** the guide was pushed back this far by the push (mm) */
  guideBackMm: number;
  /** the guide left the ostium */
  disengaged: boolean;
  /**
   * the session moved the device further than deliver() allows (the assisted move, which goes through
   * the stall); the forces are still deliver()'s, the axial load is held below the rumble's saturation
   */
  assisted: boolean;
}

/** Subscribe a legacy target to the bus. Returns an unsubscribe function. */
export function bridgeDiagnostic(bus: InputBus, t: DiagnosticTarget): () => void {
  const a = bus.on("hand", (c) => applyToDiagnostic(c, t));
  // the diagnostic lab has one beam switch; either pedal turns it on
  const b = bus.on("pedal", (p: PedalState) => t.setFluoroLive(p.fluoro || p.cine));
  return () => {
    a();
    b();
  };
}

export function bridgePci(bus: InputBus, t: PciTarget): () => void {
  return bus.on("hand", (c) => applyToPci(c, t));
}
