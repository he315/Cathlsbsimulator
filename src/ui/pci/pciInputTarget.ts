// ---------------------------------------------------------------------------
// The PCI lab's hands and feet on the S8 input system (pci-lab-input).
//
// The input system (src/input/) turns keyboard, mouse, trackpad, gamepad,
// MIDI and USB foot switches and the DIY torquer into hand commands, pedal
// state, syringe commands and C-arm and table velocities on its bus, exactly
// as in the diagnostic lab. This target takes them to the PCI session:
//
//   hand commands   first through the binding registry (src/ui/pci/inputBindings/,
//                   one file per hand-operated device, discovered by glob), then
//                   through the built-in route (legacyAdapter.applyToPci):
//                     wire014        push to moveWire, torque to torqueWire, pin to pinWire
//                                    (without a session pin: the 'delivery' binding's pin,
//                                    the wire pinned in the engine)
//                     balloon, stent, ivus
//                                    push to the device: every device on the rail (taken
//                                    through the equipment workflow or loaded by the
//                                    assisted console) and the guide extension's push rod
//                                    go to the 'delivery' binding (src/ui/pci/inputBindings/
//                                    support.ts: the engine's advanceDevice, or the
//                                    extension's moveExtension); only a session without an
//                                    action entry (hasDeliveryEntry) keeps its own
//                                    advanceDevice (never the assisted moveDevice directly)
//                     catheter       push to engageGuide (out of the ostium) or seatGuide; pin to
//                                    pinGuide (without a session pin: the left hand holds the
//                                    guide in the engine, the independent-hand technique)
//   syringe         the plunger force to the guide's syringe: a push injects for as
//                   long as it is held, saline flushes, a pull aspirates (no buttons)
//   pedals          fluoroscopy and cine foot switches
//   carm, table     the C-arm and table drives
//
// A push on the device carries the delivery forces of deliver()
// (src/simulation/pci/guide.ts) back to the hands as a 'reaction' on the bus
// (PciReaction): the force needed at the device tip and the guide's back-up
// (a pure probe on the state before the push), and whether the guide was
// pushed back (the change the session actually shows after the push, so a
// session that does not move the guide gives no snap). While the session's
// advanceDevice is the assisted move (it does not stop at deliver()'s stall),
// the reaction is marked assisted and its axial load stays below the rumble's
// saturation, so the hands are not told of a stall the screen never shows. A
// push on the extension's push rod carries the forces moveExtension met beyond
// the guide tip (its 'extension' move record), so a stalled extension is felt. The haptics turn it into pseudo-haptic
// weight, gamepad rumble and the torquer brake; the scale from newtons to the
// haptic channel is a MODEL PARAMETER (docs/realism/facts/pkg-pci-lab-input.md).
//
// A guide push or a wire pull while a device or extension is out in the vessel
// is recorded as the deep seat or the partial wire withdrawal of the support
// menu (actions/devices.ts noteSupport, once per series of bites).
//
// The target keeps the hands' table in step with the session: the device on
// the wire is present (and slot 3 of the grip order) only once it is
// backloaded or in the guide, or, with no device on the rail, while a guide
// extension's push rod is there for the right hand (pci-device-delivery).
//
// Two rails (pci-two-rail-engine): with a second wire in the guide the table
// also holds wire014b and, once a device is on that wire, balloon2 (after
// keys 1-5 in the grip order). A hand command on wire014b or balloon2 first
// moves the engine's hands to rail 2 (setActiveRail, asked of the attending as
// 'load-device', which no rule stops), then takes the first rail's route for
// the wire or the device; a command on wire014, balloon, stent or ivus moves
// them back to rail 1. The hub reaction names the slot the hand holds. The
// two kissing balloons are inflated together with perform('kissing',
// 'inflate', atm) and deflated with a value of 0.
// ---------------------------------------------------------------------------

import type { InputBus } from "../../input/bus";
import { applyToPci, type PciReaction, type PciTarget } from "../../input/legacyAdapter";
import { pciGripOrder } from "../../input/settings";
import type { DeviceSlot, GripTarget, HandCommand, PedalState, SyringeCommand } from "../../input/types";
import { deliver, type DeliveryResult } from "../../simulation/pci/guide";
import type { PciGeom } from "../../simulation/pci/geometry";
import type { PciState } from "../../simulation/pci/state";
import { deliveryInput, noteSupport, supportNoted } from "../../simulation/pci/actions/devices";
import { activeRailOf, railsOf, type PciScenario, type PciState as EngineState, type RailState, type SupportOption } from "../../simulation/pci/state";
import { setActiveRail } from "../../simulation/pci/actions/wire";
import { deflateKiss, kissBalloons } from "../../simulation/pci/actions/inflation";
import { DEFAULT_RUMBLE } from "../../input/haptics";
import { PCI_INPUT_BINDINGS, bindingFor, type PciBindingContext, type PciBindingRegistry, type PciHandAction } from "./inputBindings";
import { applyDeliveryAction, deliveryHand, hasDeliveryEntry, holdGuideByHand } from "./inputBindings/support";

/** The slots of the second rail and the first-rail slot each takes the route of (pci-two-rail-engine). */
export const SECOND_RAIL_SLOTS: Readonly<Partial<Record<DeviceSlot, DeviceSlot>>> = { wire014b: "wire014", balloon2: "balloon" };
/** The slots that work on the first rail. */
const FIRST_RAIL_SLOTS: readonly DeviceSlot[] = ["wire014", "pressureWire", "balloon", "stent", "ivus"];

/** The rail a hand slot works on (0 the first, 1 the second), or null for the guide, the sheath and the syringe. */
export function railOfSlot(d: string): 0 | 1 | null {
  if (d in SECOND_RAIL_SLOTS) return 1;
  return (FIRST_RAIL_SLOTS as readonly string[]).includes(d) ? 0 : null;
}

// --- model parameters (docs/realism/facts/pkg-pci-lab-input.md) ------------------------------

/**
 * Haptic axial load when the device needs exactly the guide's back-up (requiredN = backupN): the
 * gamepad's strong motor saturates there (DEFAULT_RUMBLE.axialSat). MODEL PARAMETER.
 */
export const PCI_REACTION_AXIAL_AT_BACKUP = DEFAULT_RUMBLE.axialSat;
/** Ceiling of the haptic axial load (model units), so a disengaged guide's tiny back-up cannot blow it up. MODEL PARAMETER. */
export const PCI_REACTION_AXIAL_MAX = 2 * DEFAULT_RUMBLE.axialSat;
/** A guide pushed back more than this (mm) is felt as a jump (snap); the engine logs a back-out from the same distance (actions/devices.ts). MODEL PARAMETER. */
export const PCI_REACTION_SNAP_MM = 0.3;
/**
 * Ceiling of the haptic axial load when the session moved the device further than deliver() lets it go
 * (the assisted move, which ignores the guide's back-up): below the strong motor's saturation, so the
 * hands do not feel a stall the screen never shows. MODEL PARAMETER.
 */
export const PCI_REACTION_AXIAL_ASSISTED_MAX = 0.6 * DEFAULT_RUMBLE.axialSat;
/** The session's device move counts as beyond deliver()'s when it overruns it by more than this (mm), above rounding. MODEL PARAMETER. */
export const PCI_REACTION_OVERRUN_MM = 0.05;
/** Plunger force above which a push (or below minus which a pull) acts, 0..1; the diagnostic lab's PUSH_ON (src/ui/sim/labSession.ts). MODEL PARAMETER. */
export const PCI_PLUNGER_ON = 0.08;

// --- what the target needs of the session --------------------------------------------------------

/**
 * The PCI session as the hands see it (PciLabSession satisfies it). The optional actions are the ones
 * the session does not offer yet; a command for one of them is not handled.
 */
export interface PciInputSession {
  readonly s: { side: "left" | "right"; calcium: 0 | 1 | 2 };
  readonly g: PciGeom;
  readonly st: PciState;
  moveWire(mm: number): boolean;
  torqueWire(rad: number): boolean;
  /** the device along the wire */
  advanceDevice(mm: number): boolean;
  engageGuide(): boolean;
  inject(o?: { side?: "left" | "right"; autoCine?: boolean }): boolean;
  releaseInjection(): void;
  aspirate(): void;
  flushGuide(): boolean;
  pressPedal(which: "fluoro" | "cine", on: boolean): void;
  jogCArm(laoDegPerS: number, cranDegPerS: number): void;
  readonly table: { setCommandedVelocity(xMmPerS: number, yMmPerS: number): void };
  subscribe(fn: () => void): () => void;
  /** deep-seat (+) or draw back (−) an engaged guide */
  seatGuide?(mm: number): boolean;
  /** the left hand holds the wire (or the guide) */
  pinWire?(on: boolean): boolean;
  pinGuide?(on: boolean): boolean;
  /** put the hands on rail 0 or 1 (pci-two-rail-engine; absent: the target asks it of the attending as an engine change) */
  setActiveRail?(rail: 0 | 1): boolean;
}

/** What the target needs of the input system (InputSystem satisfies it). */
export interface PciInputSystemLike {
  readonly bus: InputBus;
  setPresent(list: DeviceSlot[]): void;
  setGripOrder(order: GripTarget[]): void;
}

export interface PciInputTargetOptions {
  /** the hand bindings (default: the files in src/ui/pci/inputBindings/) */
  bindings?: PciBindingRegistry;
}

// --- the device on the wire ------------------------------------------------------------------------

/**
 * The input slot of the device on the wire, once it is on the rail (backloaded or in the guide); with no
 * device there, the balloon slot for a guide extension's push rod; else null.
 */
export function pciDeviceSlot(st: PciState, rails: readonly [RailState, RailState] | null = st.rails ? railsOf(st) : null): DeviceSlot | null {
  // the first rail's device, whichever rail the hands are on (pci-two-rail-engine)
  const d = rails ? rails[0].device : st.device;
  if (!d || (d.stage !== "backloaded" && d.stage !== "in-guide")) return st.guide.ext ? "balloon" : null;
  if (d.kind === "stent" || d.kind === "covered-stent") return "stent";
  if (d.kind === "ivus") return "ivus";
  return "balloon";
}

/** The second rail on the table: its wire (wire014b) and the device on it (balloon2), once backloaded or in the guide. */
export function pciSecondRail(st: PciState, rails: readonly [RailState, RailState] | null = st.rails ? railsOf(st) : null): { wire: boolean; device: boolean } {
  if (!rails) return { wire: false, device: false };
  const r: RailState = rails[1];
  const d = r.device;
  return { wire: !!r.wire, device: !!r.wire && !!d && (d.stage === "backloaded" || d.stage === "in-guide") };
}

/** What is on the table for the hands: the sheath, the guide, the coronary wire and the device on the rail, then the second rail's. */
export function pciPresent(st: PciState, rails: readonly [RailState, RailState] | null = st.rails ? railsOf(st) : null): DeviceSlot[] {
  const slot = pciDeviceSlot(st, rails);
  const first = !rails || !!rails[0].wire;
  const out: DeviceSlot[] = first ? ["sheath", "catheter", "wire014"] : ["sheath", "catheter"];
  if (slot) out.push(slot);
  const b = pciSecondRail(st, rails);
  if (b.wire) out.push("wire014b");
  if (b.device) out.push("balloon2");
  return out;
}

/**
 * The delivery forces a push of `mm` on the device would meet now: deliver() on the session's state with
 * the inputs actions/devices.ts advanceDevice gives it (deliveryInput: the lesion, the wire's support, an
 * extension in the vessel, a held deep breath, the left hand on the guide; deliver is pure, nothing
 * changes). Null when the push meets no rail (no device in the guide, inflated, withdrawing, still inside
 * the guide, or at the end of the wire).
 */
export function deliveryProbe(s: { calcium: 0 | 1 | 2 }, g: PciGeom, st: PciState, mm: number): DeliveryResult | null {
  const dev = st.device;
  if (!dev || dev.stage !== "in-guide" || !(mm > 0)) return null;
  if (dev.inflated || st.ind.fill > 0.05) return null;
  const distal = dev.centreMm + dev.lengthMm / 2;
  const target = Math.min(distal + mm, st.tipMm - 6);
  const from = Math.max(distal, 0);
  if (!(target > from)) return null;
  if (distal < 0 && !st.guide.engaged) return null;
  return deliver(g, st.guide, deliveryInput(s, g, st, from, target)).r;
}

/**
 * The forces a push on the guide extension's push rod met beyond the guide tip: the last 'extension' move
 * record from log index `from` on (moveExtension writes deliver()'s result on it). Null when the push did
 * not reach the rail (inside the guide, blocked, or withdrawn).
 */
export function extensionForces(st: PciState, from: number): DeliveryResult | null {
  for (let i = st.log.length - 1; i >= Math.max(0, from); i--) {
    const e = st.log[i];
    if (e.kind !== "extension" || e.data.action !== "move") continue;
    if (typeof e.data.requiredN !== "number") return null;
    return {
      requiredN: Number(e.data.requiredN),
      frictionN: Number(e.data.frictionN ?? 0),
      lesionN: Number(e.data.lesionN ?? 0),
      backupN: Number(e.data.backupN ?? 0),
      advancedMm: Number(e.data.railAdvancedMm ?? 0),
      guideBackMm: Number(e.data.guideBackMm ?? 0),
      disengaged: !!e.data.disengaged,
    };
  }
  return null;
}

/** A device or the guide extension is out in the vessel beyond the guide tip. */
export function deviceOut(st: PciState): boolean {
  const d = st.device;
  if (d && d.stage === "in-guide" && d.centreMm + d.lengthMm / 2 > 0) return true;
  return !!st.guide.ext && st.guide.ext.tipMm > 0;
}

/** What the guide (and the device) did during a push, as the session shows it afterwards. */
export interface PciGuideMove {
  /** how far the guide went back (mm, 0 when it did not) */
  guideBackMm: number;
  /** the guide was engaged before the push and is not after it */
  disengaged: boolean;
  /**
   * how far the session moved the device's distal end beyond the advance deliver() allows (mm, 0 or
   * absent when it did not): the assisted move, which goes through a stall the delivery physics would stop
   */
  overrunMm?: number;
}

/**
 * The advance of the device's distal end that a push of `mm` gets under the delivery physics, given the
 * probe's result: free running inside the guide, then deliver()'s advance beyond its tip (as
 * actions/devices.ts advanceDevice adds them). Null when the probe met no rail.
 */
export function deliveryAdvance(st: PciState, mm: number, r: DeliveryResult | null): number | null {
  const dev = st.device;
  if (!dev || !r) return null;
  const distal = dev.centreMm + dev.lengthMm / 2;
  const target = Math.min(distal + mm, st.tipMm - 6);
  return Math.max(0, Math.min(target, 0) - distal) + r.advancedMm;
}

/** The guide's movement between two guide states (before and after a push). */
export function pciGuideMove(before: { engaged: boolean; depthMm: number }, after: { engaged: boolean; depthMm: number }): PciGuideMove {
  return { guideBackMm: Math.max(0, before.depthMm - after.depthMm), disengaged: before.engaged && !after.engaged };
}

/**
 * The hub reaction for a device push. The load (requiredN, backupN, frictionN, lesionN) is deliver()'s
 * result `r` (zero when the push met no rail). The snap, guideBackMm and disengaged come from `moved`,
 * the guide movement the session actually applied; without it, from `r` itself (a prediction, for a
 * caller that has no session). When the session moved the device through a stall deliver() would have
 * stopped it at (`moved.overrunMm`), the reaction is marked assisted and its axial load stays below the
 * rumble's saturation (PCI_REACTION_AXIAL_ASSISTED_MAX), so the hands feel weight but not a stall.
 */
export function pciReaction(device: DeviceSlot, r: DeliveryResult | null, moved?: PciGuideMove): PciReaction {
  const back = moved ? moved.guideBackMm : (r?.guideBackMm ?? 0);
  const disengaged = moved ? moved.disengaged : (r?.disengaged ?? false);
  const snap = back > PCI_REACTION_SNAP_MM || disengaged;
  const assisted = !!r && (moved?.overrunMm ?? 0) > PCI_REACTION_OVERRUN_MM;
  if (!r) return { device, axial: 0, torsion: 0, snap, wedged: false, requiredN: 0, backupN: 0, frictionN: 0, lesionN: 0, guideBackMm: back, disengaged, assisted };
  const ratio = r.requiredN / Math.max(1e-6, r.backupN);
  return {
    device,
    axial: Math.min(assisted ? PCI_REACTION_AXIAL_ASSISTED_MAX : PCI_REACTION_AXIAL_MAX, ratio * PCI_REACTION_AXIAL_AT_BACKUP),
    torsion: 0,
    snap,
    wedged: false,
    requiredN: r.requiredN,
    backupN: r.backupN,
    frictionN: r.frictionN,
    lesionN: r.lesionN,
    guideBackMm: back,
    disengaged,
    assisted,
  };
}

// --- the target ------------------------------------------------------------------------------------------

export class PciInputTarget {
  readonly bindings: PciBindingRegistry;
  private offs: (() => void)[] = [];
  /** the table the hands were last synced to (undefined before the first sync): the first rail's device slot and the second rail */
  private lastSlot: string | undefined = undefined;
  /** the session state the hands' table was last brought into step with */
  private lastSt: PciState | null = null;
  /** the slot the hand holds while a second-rail command takes the first rail's route (the reaction names it) */
  private alias: DeviceSlot | null = null;
  /** the device the hand command being routed pushes (set by core() before applyToPci) */
  private pushSlot: DeviceSlot = "balloon";
  /** whether the device push core() routed was taken (false: no device, or the attending stopped it); null when it routed none */
  private lastPush: boolean | null = null;
  /** built once: the built-in route's view of the session and the bindings' context */
  private readonly route: PciTarget;
  private readonly ctx: PciBindingContext;
  private pedals: PedalState = { fluoro: false, cine: false };
  private injecting = false;
  private flushing = false;
  private aspirating = false;
  private disposed = false;

  constructor(readonly session: PciInputSession, readonly input: PciInputSystemLike, o: PciInputTargetOptions = {}) {
    this.bindings = o.bindings ?? PCI_INPUT_BINDINGS;
    const x = session;
    this.route = {
      moveWire: (mm) => x.moveWire(mm),
      torqueWire: (rad) => x.torqueWire(rad),
      advanceDevice: (mm) => {
        this.lastPush = this.pushDevice(this.pushSlot, mm);
      },
      guideEngaged: () => x.st.guide.engaged,
      engageGuide: () => x.engageGuide(),
      seatGuide: x.seatGuide ? (mm) => x.seatGuide!(mm) : undefined,
      // without a pin of the session's own, the wire through the 'delivery' binding and the guide in the engine (pci-device-delivery)
      pinWire: x.pinWire ? (on) => x.pinWire!(on) : (on) => this.bound("delivery", "pin", on ? 1 : 0),
      pinGuide: x.pinGuide ? (on) => x.pinGuide!(on) : (on) => holdGuideByHand(x, on),
    };
    this.ctx = { session, reaction: (r) => input.bus.emit("reaction", r) };
    const bus = input.bus;
    this.offs.push(
      bus.on("hand", (c) => this.hand(c)),
      bus.on("syringe", (c) => this.syringe(c)),
      bus.on("pedal", (p) => this.pedal(p)),
      bus.on("carm", (v) => session.jogCArm(v.laoDegPerS, v.cranDegPerS)),
      bus.on("table", (v) => session.table.setCommandedVelocity(v.xMmPerS, v.yMmPerS)),
      session.subscribe(() => this.syncTable())
    );
    this.syncTable();
  }

  /** A binding file's handler for (device, action), if any. Returns true when it took the action. */
  private bound(device: string, action: PciHandAction, value: number): boolean {
    const b = bindingFor(this.bindings, device, action);
    if (!b) return false;
    return b.handler(this.ctx, value) !== false;
  }

  /** The built-in route for a hand command on the session (legacyAdapter.applyToPci). */
  private core(c: HandCommand): boolean {
    this.pushSlot = "device" in c && c.device ? c.device : "balloon";
    this.lastPush = null;
    const took = applyToPci(c, this.route);
    // applyToPci counts a routed device push as taken; a push the session refused, or the attending stopped, was not
    return took && this.lastPush !== false;
  }

  /**
   * Push the device along the wire (advanceDevice) and put the reaction on the bus: deliver()'s forces
   * probed on the state before the push, and the guide and device movement the session shows after it
   * (so a session whose advanceDevice does not move the guide gives no snap, and one that moves the
   * device through a stall gives an assisted reaction below the rumble's saturation).
   */
  pushDevice(device: DeviceSlot, mm: number): boolean {
    const x = this.session;
    const st0 = x.st;
    const d0 = st0.device;
    // the delivery path (support.ts): every device on the rail and the extension's push rod, when the session has an action entry
    const delivery = !!bindingFor(this.bindings, "delivery", mm >= 0 ? "advance" : "withdraw") && (!!d0 || !!st0.guide.ext) && hasDeliveryEntry(x);
    if (!d0 && !delivery) return false;
    const onDevice = !!d0 && (!delivery || deliveryHand(x) === "device" || !st0.guide.ext);
    const g0 = st0.guide;
    const before = { engaged: g0.engaged, depthMm: g0.depthMm };
    const distal0 = d0 ? d0.centreMm + d0.lengthMm / 2 : 0;
    const probe = mm > 0 && onDevice ? deliveryProbe(x.s, x.g, st0, mm) : null;
    const allowed = onDevice ? deliveryAdvance(st0, mm, probe) : null;
    const n0 = st0.log.length;
    const ok = delivery ? this.bound("delivery", mm >= 0 ? "advance" : "withdraw", Math.abs(mm)) : x.advanceDevice(mm);
    if (!ok) return false;
    const moved = pciGuideMove(before, x.st.guide);
    const d1 = x.st.device;
    if (allowed !== null && d1) moved.overrunMm = Math.max(0, d1.centreMm + d1.lengthMm / 2 - distal0 - allowed);
    // the push rod: the forces the extension met beyond the guide tip
    const r = delivery && !onDevice && mm > 0 ? extensionForces(x.st, n0) : probe;
    this.input.bus.emit("reaction", pciReaction(this.alias ?? device, r, moved));
    return true;
  }

  /**
   * Put the engine's hands on rail `rail` (pci-two-rail-engine): through the session's setActiveRail when it
   * has one, else as an engine change asked of the attending ('load-device'). True when the hands are there.
   */
  ensureRail(rail: 0 | 1): boolean {
    const x = this.session;
    if (activeRailOf(x.st) === rail) return true;
    if (rail === 1 && !pciSecondRail(x.st).wire) return false;
    if (x.setActiveRail) x.setActiveRail(rail);
    else applyDeliveryAction(x, "load-device", (st) => setActiveRail(st, rail));
    return activeRailOf(x.st) === rail;
  }

  /**
   * A hand command for a slot of either rail: the hands moved to that rail first, a second-rail slot taking
   * the first rail's route (wire014b as wire014, balloon2 as the device). Returns the command to route, or
   * null when the rail cannot be reached (no second wire, or the attending stopped the change).
   */
  private onRail<C extends { device: DeviceSlot }>(c: C): C | null {
    const rail = railOfSlot(c.device);
    if (rail === null || (rail === 0 && !this.session.st.rails)) return c;
    if (!this.ensureRail(rail)) return null;
    const mapped = SECOND_RAIL_SLOTS[c.device];
    return mapped ? { ...c, device: mapped } : c;
  }

  /** One hand command: a binding first, then the built-in route. Returns true when something took it. */
  hand(c: HandCommand): boolean {
    if (this.disposed) return false;
    let action: PciHandAction;
    let value: number;
    if (c.kind === "push") {
      action = c.mm >= 0 ? "advance" : "withdraw";
      value = Math.abs(c.mm);
    } else if (c.kind === "torque") {
      action = "torque";
      value = c.rad;
    } else if (c.kind === "pin") {
      action = "pin";
      value = c.on ? 1 : 0;
    } else return false; // grip and regrip: the PCI engine has no stored twist to unwind
    const cc = this.onRail(c);
    if (!cc) return false;
    const st0 = this.session.st;
    this.alias = cc.device !== c.device ? c.device : null;
    try {
      const took = this.bound(cc.device, action, value) || this.core(cc);
      if (took && cc.kind === "push") this.noteHandSupport(cc.device, cc.mm, st0);
      return took;
    } finally {
      this.alias = null;
    }
  }

  /**
   * A guide push that seated the guide deeper, or a wire pull that took the wire back, while a device or the
   * extension was out in the vessel: the deep seat or the partial wire withdrawal of the support menu,
   * recorded once per series of bites (the debrief and the attending read DeliveryRecord.support).
   */
  private noteHandSupport(device: string, mm: number, st0: PciState) {
    const x = this.session;
    if (!deviceOut(st0) || !hasDeliveryEntry(x)) return;
    const st = x.st;
    let option: SupportOption | null = null;
    if (device === "catheter" && mm > 0 && st.guide.engaged && st.guide.depthMm > st0.guide.depthMm + 1e-6) option = "deep-seat";
    else if (device === "wire014" && mm < 0 && st.tipMm < st0.tipMm - 1e-6) option = "partial-wire-withdrawal";
    if (!option || supportNoted(st, option)) return;
    const o = option;
    applyDeliveryAction(x, "load-device", (s) => noteSupport(s, o));
  }

  /**
   * Any hand action by name, for a device the hands reach without a slot of their own (an indeflator's
   * screw) or for a console's or test's drive with the console closed. A binding first; for a device slot
   * the built-in route.
   */
  perform(device0: string, action: PciHandAction, value: number): boolean {
    if (this.disposed) return false;
    if (device0 === "kissing" && action === "inflate") return this.kiss(value);
    const onRail = this.onRail({ device: device0 as DeviceSlot });
    if (!onRail) return false;
    const device: string = onRail.device;
    this.alias = device !== device0 ? (device0 as DeviceSlot) : null;
    try {
      return this.performOn(device, action, value);
    } finally {
      this.alias = null;
    }
  }

  /** The kissing balloons (pci-two-rail-engine): both inflated together to `atm`, or deflated together with 0. */
  kiss(atm: number): boolean {
    const x = this.session;
    const scen = x.s as PciScenario;
    if (atm > 0) return applyDeliveryAction(x, "load-device", (st: EngineState) => kissBalloons(scen, x.g, st, atm));
    return applyDeliveryAction(x, "load-device", (st: EngineState) => deflateKiss(st));
  }

  private performOn(device: string, action: PciHandAction, value: number): boolean {
    const st0 = this.session.st;
    const signed = action === "advance" ? Math.abs(value) : -Math.abs(value);
    if (this.bound(device, action, value)) {
      if (action === "advance" || action === "withdraw") this.noteHandSupport(device, signed, st0);
      return true;
    }
    const slot = device as DeviceSlot;
    if (action === "advance" || action === "withdraw") {
      const took = this.core({ kind: "push", device: slot, mm: signed });
      if (took) this.noteHandSupport(device, signed, st0);
      return took;
    }
    if (action === "torque") return this.core({ kind: "torque", device: slot, rad: value });
    if (action === "pin") return this.core({ kind: "pin", device: slot, on: value > 0 });
    if (device === "syringe" && (action === "inject" || action === "flush" || action === "aspirate")) {
      this.syringe(action === "aspirate" ? { force: -Math.abs(value), port: "aspirate" } : { force: Math.abs(value), port: action === "flush" ? "saline" : "contrast" });
      return true;
    }
    return false;
  }

  /** The hand on the plunger: inject while pushed, flush with saline, aspirate on a pull. */
  syringe(c: SyringeCommand) {
    if (this.disposed) return;
    const x = this.session;
    if (c.port === "aspirate") {
      const pull = Math.max(0, -c.force);
      if (this.bound("syringe", "aspirate", pull)) return;
      if (pull > PCI_PLUNGER_ON && !this.aspirating) {
        this.aspirating = true;
        x.aspirate();
      } else if (pull <= PCI_PLUNGER_ON) this.aspirating = false;
      return;
    }
    // a push through another port ends a held injection
    if (c.port === "saline") {
      if (this.injecting) this.endInjection();
      if (this.bound("syringe", "flush", Math.max(0, c.force))) return;
      if (c.force > PCI_PLUNGER_ON && !this.flushing) {
        this.flushing = true;
        x.flushGuide();
      } else if (c.force <= PCI_PLUNGER_ON) this.flushing = false;
      return;
    }
    if (this.bound("syringe", "inject", Math.max(0, c.force))) return;
    if (c.force > PCI_PLUNGER_ON && !this.injecting) {
      // the push lasts while the plunger is held; the pedals stay the operator's
      this.injecting = x.inject({ side: x.s.side });
    } else if (c.force <= PCI_PLUNGER_ON && this.injecting) this.endInjection();
  }

  private endInjection() {
    this.injecting = false;
    this.session.releaseInjection();
  }

  /** The foot switches: each pedal that changed (an on-screen pedal held at the same time is left alone). */
  pedal(p: PedalState) {
    if (this.disposed) return;
    const was = this.pedals;
    this.pedals = { fluoro: !!p.fluoro, cine: !!p.cine };
    if (was.fluoro !== this.pedals.fluoro) this.session.pressPedal("fluoro", this.pedals.fluoro);
    if (was.cine !== this.pedals.cine) this.session.pressPedal("cine", this.pedals.cine);
  }

  /** Keep the hands' table (present devices, grip order) in step with the session. */
  syncTable() {
    if (this.disposed) return;
    const st = this.session.st;
    // the session notifies on every tick: the same state needs no new table
    if (st === this.lastSt) return;
    this.lastSt = st;
    const rails = st.rails ? railsOf(st) : null;
    const slot = pciDeviceSlot(st, rails);
    const b = pciSecondRail(st, rails);
    const first = !rails || !!rails[0].wire;
    const key = `${slot}|${first}|${b.wire}|${b.device}`;
    if (key === this.lastSlot) return;
    this.lastSlot = key;
    this.input.setGripOrder(pciGripOrder(slot, b));
    this.input.setPresent(pciPresent(st, rails));
  }

  /** Disconnect: the feet come off the pedals and a held injection ends. */
  dispose() {
    if (this.disposed) return;
    for (const off of this.offs) off();
    this.offs = [];
    if (this.injecting) this.endInjection();
    if (this.pedals.fluoro) this.session.pressPedal("fluoro", false);
    if (this.pedals.cine) this.session.pressPedal("cine", false);
    this.pedals = { fluoro: false, cine: false };
    this.disposed = true;
  }
}

/** Connect an input system to a PCI session. Returns the disconnect. */
export function connectPciInput(session: PciInputSession, input: PciInputSystemLike, o: PciInputTargetOptions = {}): { target: PciInputTarget; dispose: () => void } {
  const target = new PciInputTarget(session, input, o);
  return { target, dispose: () => target.dispose() };
}
