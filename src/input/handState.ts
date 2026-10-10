// ---------------------------------------------------------------------------
// HandState: two hands on the table.
//
// Right hand: is at one device (or moving between devices). While the fingers
// are closed (any source holds "grab"), hand travel becomes device motion:
//
//   push (mm)    = hand axial travel × push gain × pseudo-haptic gain
//   torque (rad) = 2 × fingertip lateral travel / D × roll gain × pseudo-haptic gain
//
// where D is the diameter rolled between the fingers (catheter hub, torque
// device, balloon shaft; settings.gripGeometry). A fingertip sliding dx over a
// cylinder of radius D/2 that turns about its own axis turns it by dx/(D/2):
// geometry, not a fitted constant.
//
// Each grip has a limited span of hand travel and fingertip roll centred on
// where the hand grasped. Motion beyond it is clipped (a "span" block is
// reported) until the hand lets go and grasps again (regrip), which re-centres
// both spans. Letting go emits {grip, right, null} so the device physics can
// let stored twist unwind through the hub.
//
// Two rails (pci-two-rail-engine): the PCI table may hold a second coronary
// wire (wire014b) and the device on it (balloon2); they follow the first
// rail's grip order and the auto pin of balloon2 is its own wire.
//
// Left hand: pins one device (hold key). A pinned device does not move with
// right-hand commands (they are blocked). Several sources can hold the same pin;
// it lets go only when the last holder releases, and a source that does not
// hold it cannot release it. releaseAll() opens both hands whoever holds them. With settings.grip.emulateCoupling the
// HandState also emits the drag of an unpinned wire by an over-the-wire device
// (for the legacy engine; the rod physics gets drag from friction instead).
//
// Moving the right hand to another device takes settings.grip.switchMs; motion
// during the move is ignored and the hand arrives open.
//
// This module is pure (no DOM, no timers): `apply` and `advance` return the
// commands to emit, so it is deterministic and snapshotable for replay.
// ---------------------------------------------------------------------------

import type { Snapshotable } from "../simulation/session/types";
import { GRIP_ORDER_PCI, RAILS, gripGeometry, type InputSettings } from "./settings";
import type {
  BlockedEvent,
  DeviceSlot,
  GripTarget,
  HandCommand,
  HandView,
  Intent,
  PinTarget,
  SourceId,
  SyringeCommand,
} from "./types";

const ALL_SLOTS: DeviceSlot[] = ["sheath", "wire035", "catheter", "wire014", "balloon", "stent", "pressureWire", "ivus", "pigtail", "wire014b", "balloon2"];

/** Pseudo-haptic multipliers supplied by the haptics controller (1 = no effect). */
export interface HapticGains {
  push: number;
  roll: number;
}

export interface HandOutput {
  commands: HandCommand[];
  syringe: SyringeCommand | null;
  blocked: BlockedEvent[];
  /** the HandView changed (emit "hands") */
  changed: boolean;
}

export interface HandSnapshot {
  at: GripTarget | null;
  transition: { from: GripTarget | null; to: GripTarget; elapsedMs: number } | null;
  holders: SourceId[];
  lastGrasped: GripTarget | null;
  pushOffsetMm: number;
  rollOffsetMm: number;
  plungerOffsetMm: number;
  plungerForce: number;
  pin: PinTarget | null;
  pinnedDevice: DeviceSlot | null;
  /** first source holding the pin (kept for snapshots written before pinHolders) */
  pinSource: SourceId | null;
  /** every source holding the pin; the pin lets go when the last one releases */
  pinHolders?: SourceId[];
  syringePort: "contrast" | "saline";
  present: DeviceSlot[];
  gripOrder: GripTarget[];
}

export interface HandStateOptions {
  settings: InputSettings;
  present?: DeviceSlot[];
  gripOrder?: GripTarget[];
  /** device the right hand starts at */
  initial?: GripTarget | null;
}

const EPS = 1e-9;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Usual partner for "pin auto": what the left hand fixes when the right hand moves X. */
export function autoPinFor(right: GripTarget | null, present: ReadonlySet<DeviceSlot>): PinTarget {
  switch (right) {
    case "balloon":
    case "stent":
    case "ivus":
    case "balloon2":
      return "wire"; // "I have the wire" while the device slides (the second rail's own wire for its device)
    case "wire014":
    case "wire014b":
    case "pressureWire":
    case "wire035":
      return "guide"; // steady the catheter while the wire is torqued
    case "catheter":
    case "pigtail":
      return present.has("wire035") || present.has("wire014") ? "wire" : "sheath";
    default:
      return "guide";
  }
}

/**
 * Resolve a pin target to the device slot on the table, or null if none is present. With the right hand on
 * the second rail's device (pci-two-rail-engine) "the wire" is the second wire, which that device rides on.
 */
export function resolvePin(t: PinTarget, present: ReadonlySet<DeviceSlot>, right: GripTarget | null = null): DeviceSlot | null {
  if (t === "wire" && right === "balloon2" && present.has("wire014b")) return "wire014b";
  const order: Record<PinTarget, DeviceSlot[]> = {
    wire: ["wire014", "pressureWire", "wire035"],
    guide: ["catheter", "pigtail"],
    sheath: ["sheath"],
  };
  for (const d of order[t]) if (present.has(d)) return d;
  return null;
}

const isSlot = (t: GripTarget | null): t is DeviceSlot => t !== null && t !== "syringe";

export class HandState implements Snapshotable<HandSnapshot> {
  private s: InputSettings;
  private present: Set<DeviceSlot>;
  private gripOrder: GripTarget[];

  private at: GripTarget | null;
  private transition: HandSnapshot["transition"] = null;
  private holders = new Set<SourceId>();
  private lastGrasped: GripTarget | null = null;
  private pushOffsetMm = 0;
  private rollOffsetMm = 0;
  private plungerOffsetMm = 0;
  private plungerForce = 0;
  private pin: PinTarget | null = null;
  private pinnedDevice: DeviceSlot | null = null;
  private pinHolders = new Set<SourceId>();
  private syringePort: "contrast" | "saline" = "contrast";

  constructor(o: HandStateOptions) {
    this.s = o.settings;
    this.present = new Set(o.present ?? ALL_SLOTS);
    this.gripOrder = [...(o.gripOrder ?? GRIP_ORDER_PCI)];
    this.at = o.initial === undefined ? this.gripOrder.find((t) => t === "syringe" || this.present.has(t)) ?? null : o.initial;
  }

  // --- configuration -------------------------------------------------------

  setSettings(s: InputSettings) {
    this.s = s;
  }

  /** Devices on the table. Releasing a device that leaves the table lets go of it. */
  setPresent(list: DeviceSlot[]): HandOutput {
    const out = this.out();
    this.present = new Set(list);
    if (isSlot(this.at) && !this.present.has(this.at)) {
      if (this.gripped) this.release(out);
      this.holders.clear();
      this.at = null;
      out.changed = true;
    }
    if (this.pinnedDevice && !this.present.has(this.pinnedDevice)) this.unpin(out);
    return out;
  }

  setGripOrder(order: GripTarget[]) {
    this.gripOrder = [...order];
  }

  getGripOrder(): readonly GripTarget[] {
    return this.gripOrder;
  }

  isPresent(d: DeviceSlot) {
    return this.present.has(d);
  }

  get gripped(): boolean {
    return this.holders.size > 0 && this.at !== null && this.transition === null;
  }

  /** The device slot whose motion right-hand travel currently drives (null for syringe / none). */
  get activeDevice(): DeviceSlot | null {
    return this.gripped && isSlot(this.at) ? this.at : null;
  }

  // --- intents ---------------------------------------------------------------

  apply(i: Intent, gains: HapticGains = { push: 1, roll: 1 }): HandOutput {
    const out = this.out();
    switch (i.t) {
      case "grab":
        i.on ? this.grabOn(i.source, out) : this.grabOff(i.source, out);
        break;
      case "move":
        this.move(i.axialMm, i.lateralMm, gains, out);
        break;
      case "roll":
        this.rollDirect(i.rad, out);
        break;
      case "select":
        this.select(i.target, out);
        break;
      case "selectIndex": {
        const t = this.gripOrder[i.index - 1];
        if (t !== undefined) this.select(t, out);
        break;
      }
      case "cycle":
        this.cycle(i.dir, out);
        break;
      case "pin":
        i.on ? this.pinOn(i.target, i.source, out) : this.pinOff(i.target, i.source, out);
        break;
      case "plunger":
        this.plunger(i.force, i.port, out);
        break;
      case "port":
        if (this.syringePort !== i.port) {
          this.syringePort = i.port;
          out.changed = true;
          if (Math.abs(this.plungerForce) > EPS && this.plungerForce > 0) out.syringe = this.syringeCmd();
        }
        break;
      case "releaseSource":
        this.grabOff(i.source, out);
        this.pinRelease(i.source, out);
        break;
      default:
        // pedal, carm and table intents are routed elsewhere
        break;
    }
    return out;
  }

  /** Advance the hand-move animation. */
  advance(dtMs: number): HandOutput {
    const out = this.out();
    if (!this.transition) return out;
    this.transition.elapsedMs += Math.max(0, dtMs);
    out.changed = true;
    if (this.transition.elapsedMs >= this.s.grip.switchMs) {
      this.at = this.transition.to;
      this.transition = null;
      this.holders.clear(); // the hand arrives open
    }
    return out;
  }

  // --- view / snapshot -------------------------------------------------------

  view(): HandView {
    const target = this.transition?.to ?? this.at;
    const g = target ? gripGeometry(this.s, target) : null;
    return {
      right: {
        at: this.at,
        gripped: this.gripped,
        transition: this.transition
          ? {
              from: this.transition.from,
              to: this.transition.to,
              progress: this.s.grip.switchMs > 0 ? clamp(this.transition.elapsedMs / this.s.grip.switchMs, 0, 1) : 1,
            }
          : null,
        pushOffsetMm: this.at === "syringe" ? this.plungerOffsetMm : this.pushOffsetMm,
        rollOffsetMm: this.rollOffsetMm,
        pushSpanMm: target === "syringe" ? this.s.grip.plungerTravelMm * 2 : g?.pushSpanMm ?? 0,
        rollSpanMm: g?.rollSpanMm ?? 0,
        plungerForce: this.plungerForce,
      },
      left: { pin: this.pin, pinnedDevice: this.pinnedDevice },
      syringePort: this.syringePort,
    };
  }

  snapshot(): HandSnapshot {
    return {
      at: this.at,
      transition: this.transition ? { ...this.transition } : null,
      holders: Array.from(this.holders),
      lastGrasped: this.lastGrasped,
      pushOffsetMm: this.pushOffsetMm,
      rollOffsetMm: this.rollOffsetMm,
      plungerOffsetMm: this.plungerOffsetMm,
      plungerForce: this.plungerForce,
      pin: this.pin,
      pinnedDevice: this.pinnedDevice,
      pinSource: this.pinHolders.values().next().value ?? null,
      pinHolders: Array.from(this.pinHolders),
      syringePort: this.syringePort,
      present: Array.from(this.present),
      gripOrder: [...this.gripOrder],
    };
  }

  restore(s: HandSnapshot): void {
    this.at = s.at;
    this.transition = s.transition ? { ...s.transition } : null;
    this.holders = new Set(s.holders);
    this.lastGrasped = s.lastGrasped;
    this.pushOffsetMm = s.pushOffsetMm;
    this.rollOffsetMm = s.rollOffsetMm;
    this.plungerOffsetMm = s.plungerOffsetMm;
    this.plungerForce = s.plungerForce;
    this.pin = s.pin;
    this.pinnedDevice = s.pinnedDevice;
    this.pinHolders = new Set(s.pinHolders ?? (s.pinSource !== null ? [s.pinSource] : []));
    this.syringePort = s.syringePort;
    this.present = new Set(s.present);
    this.gripOrder = [...s.gripOrder];
  }

  // --- internals -------------------------------------------------------------

  private out(): HandOutput {
    return { commands: [], syringe: null, blocked: [], changed: false };
  }

  private grabOn(source: SourceId, out: HandOutput) {
    const was = this.holders.size > 0;
    if (this.transition) {
      out.blocked.push({ device: this.transition.to, reason: "transition" });
      return;
    }
    if (this.at === null) return;
    if (isSlot(this.at) && !this.present.has(this.at)) {
      out.blocked.push({ device: this.at, reason: "absent" });
      return;
    }
    this.holders.add(source);
    if (was) return; // another source already holds the grip
    // fingers close: re-centre the spans
    this.pushOffsetMm = 0;
    this.rollOffsetMm = 0;
    this.plungerOffsetMm = 0;
    out.changed = true;
    if (isSlot(this.at)) {
      if (this.lastGrasped === this.at) out.commands.push({ kind: "regrip", hand: "right" });
      out.commands.push({ kind: "grip", hand: "right", device: this.at });
    }
    this.lastGrasped = this.at;
  }

  private grabOff(source: SourceId, out: HandOutput) {
    if (!this.holders.has(source)) return;
    const wasGripped = this.gripped;
    this.holders.delete(source);
    if (this.holders.size === 0 && wasGripped) this.release(out);
  }

  /** Fingers open: tell the physics and drop the plunger. */
  private release(out: HandOutput) {
    this.holders.clear();
    out.changed = true;
    if (isSlot(this.at)) out.commands.push({ kind: "grip", hand: "right", device: null });
    if (this.at === "syringe" || Math.abs(this.plungerForce) > EPS) {
      this.plungerOffsetMm = 0;
      if (Math.abs(this.plungerForce) > EPS) {
        this.plungerForce = 0;
        out.syringe = this.syringeCmd();
      }
    }
  }

  private move(axialMm: number, lateralMm: number, gains: HapticGains, out: HandOutput) {
    if (!Number.isFinite(axialMm) || !Number.isFinite(lateralMm)) return;
    if (Math.abs(axialMm) < EPS && Math.abs(lateralMm) < EPS) return;
    if (this.transition) {
      out.blocked.push({ device: this.transition.to, reason: "transition" });
      return;
    }
    if (!this.gripped || this.at === null) return; // hovering hand: no effect

    const ax = this.s.gains.invertPush ? -axialMm : axialMm;

    if (this.at === "syringe") {
      const travel = this.s.grip.plungerTravelMm;
      const next = clamp(this.plungerOffsetMm + ax, -travel, travel);
      if (next !== this.plungerOffsetMm + ax) out.blocked.push({ device: "syringe", reason: "span" });
      this.plungerOffsetMm = next;
      this.setPlunger(next / travel, out);
      out.changed = true;
      return;
    }

    const dev = this.at;
    if (this.pinnedDevice === dev) {
      out.blocked.push({ device: dev, reason: "pinned" });
      return;
    }
    const g = gripGeometry(this.s, dev);

    // axial span
    const halfP = g.pushSpanMm / 2;
    const p0 = this.pushOffsetMm;
    const p1 = clamp(p0 + ax, -halfP, halfP);
    const effAx = p1 - p0;
    this.pushOffsetMm = p1;

    // roll span
    const lat = this.s.gains.invertRoll ? -lateralMm : lateralMm;
    const halfR = g.rollSpanMm / 2;
    const r0 = this.rollOffsetMm;
    const r1 = clamp(r0 + lat, -halfR, halfR);
    const effLat = r1 - r0;
    this.rollOffsetMm = r1;

    const clipped = Math.abs(effAx - ax) > EPS || Math.abs(effLat - lat) > EPS;
    if (clipped) out.blocked.push({ device: dev, reason: "span" });

    const mm = effAx * this.s.gains.push * gains.push;
    const rad = ((2 * effLat) / g.diameterMm) * this.s.gains.roll * gains.roll;
    if (Math.abs(mm) > EPS) {
      out.commands.push({ kind: "push", device: dev, mm });
      if (this.s.grip.emulateCoupling) {
        for (const rail of RAILS[dev] ?? []) {
          if (this.present.has(rail) && this.pinnedDevice !== rail) {
            out.commands.push({ kind: "push", device: rail, mm: mm * this.s.grip.wireDragFraction });
          }
        }
      }
    }
    if (Math.abs(rad) > EPS) out.commands.push({ kind: "torque", device: dev, rad });
    if (Math.abs(effAx) > EPS || Math.abs(effLat) > EPS) out.changed = true;
  }

  /** Rotation measured directly (torquer encoder): no diameter, no span, no pseudo-haptic gain. */
  private rollDirect(rad: number, out: HandOutput) {
    if (!Number.isFinite(rad) || Math.abs(rad) < EPS) return;
    if (this.transition) {
      out.blocked.push({ device: this.transition.to, reason: "transition" });
      return;
    }
    if (!this.gripped || !isSlot(this.at)) return;
    if (this.pinnedDevice === this.at) {
      out.blocked.push({ device: this.at, reason: "pinned" });
      return;
    }
    const r = (this.s.gains.invertRoll ? -rad : rad) * this.s.gains.roll;
    out.commands.push({ kind: "torque", device: this.at, rad: r });
  }

  private select(target: GripTarget, out: HandOutput) {
    const dest = this.transition?.to ?? this.at;
    if (target === dest) return;
    if (isSlot(target) && !this.present.has(target)) {
      out.blocked.push({ device: target, reason: "absent" });
      return;
    }
    if (this.gripped) this.release(out);
    this.holders.clear();
    const from = this.transition ? null : this.at;
    this.transition = { from, to: target, elapsedMs: 0 };
    this.at = null;
    this.lastGrasped = null;
    this.pushOffsetMm = 0;
    this.rollOffsetMm = 0;
    out.changed = true;
    if (this.s.grip.switchMs <= 0) {
      this.at = target;
      this.transition = null;
    }
  }

  private cycle(dir: 1 | -1, out: HandOutput) {
    const order = this.gripOrder.filter((t) => t === "syringe" || this.present.has(t));
    if (order.length === 0) return;
    const cur = this.transition?.to ?? this.at;
    const idx = cur ? order.indexOf(cur) : -1;
    const n = order.length;
    const next = idx < 0 ? (dir > 0 ? order[0] : order[n - 1]) : order[(idx + dir + n) % n];
    this.select(next, out);
  }

  private pinOn(t: PinTarget | "auto", source: SourceId, out: HandOutput) {
    const right = this.transition?.to ?? this.at;
    const target: PinTarget = t === "auto" ? autoPinFor(right, this.present) : t;
    const dev = resolvePin(target, this.present, right);
    if (!dev) {
      out.blocked.push({ device: null, reason: "absent" });
      return;
    }
    if (this.pinnedDevice === dev) {
      this.pinHolders.add(source); // a second hold on the same device
      return;
    }
    if (this.pinnedDevice) this.unpin(out);
    this.pin = target;
    this.pinnedDevice = dev;
    this.pinHolders = new Set([source]);
    out.commands.push({ kind: "grip", hand: "left", device: dev });
    out.commands.push({ kind: "pin", device: dev, on: true });
    out.changed = true;
  }

  private pinOff(_t: PinTarget | "auto", source: SourceId, out: HandOutput) {
    // only a source that holds the pin can release it, and the pin stays while any other source still holds it
    this.pinRelease(source, out);
  }

  private pinRelease(source: SourceId, out: HandOutput) {
    if (!this.pinnedDevice || !this.pinHolders.delete(source)) return;
    if (this.pinHolders.size === 0) this.unpin(out);
  }

  private unpin(out: HandOutput) {
    if (!this.pinnedDevice) return;
    out.commands.push({ kind: "pin", device: this.pinnedDevice, on: false });
    out.commands.push({ kind: "grip", hand: "left", device: null });
    this.pin = null;
    this.pinnedDevice = null;
    this.pinHolders.clear();
    out.changed = true;
  }

  /**
   * Both hands let go, whoever held them (pause, case end): the right hand
   * opens (grip null, plunger force 0) and the left hand unpins. The hand stays
   * where it is; any source must press again to take hold.
   */
  releaseAll(): HandOutput {
    const out = this.out();
    if (this.gripped) this.release(out);
    else if (this.holders.size > 0) {
      this.holders.clear();
      out.changed = true;
    }
    if (Math.abs(this.plungerForce) > EPS) {
      this.plungerForce = 0;
      this.plungerOffsetMm = 0;
      out.syringe = this.syringeCmd();
      out.changed = true;
    }
    this.unpin(out);
    return out;
  }

  private plunger(force: number, port: "contrast" | "saline" | undefined, out: HandOutput) {
    if (!Number.isFinite(force)) return;
    if (port && port !== this.syringePort) {
      this.syringePort = port;
      out.changed = true;
    }
    if (Math.abs(force) > EPS && this.at !== "syringe") {
      // the right hand has to be on the syringe first
      if (this.transition?.to !== "syringe") this.select("syringe", out);
      // select() arrives at once when switchMs is 0
      if ((this.at as GripTarget | null) !== "syringe") {
        out.blocked.push({ device: "syringe", reason: "transition" });
        return;
      }
    }
    this.setPlunger(force, out);
  }

  private setPlunger(f: number, out: HandOutput) {
    const force = clamp(f, -1, 1);
    if (Math.abs(force - this.plungerForce) < 1e-6) return;
    this.plungerForce = force;
    out.syringe = this.syringeCmd();
    out.changed = true;
  }

  private syringeCmd(): SyringeCommand {
    const f = this.plungerForce;
    return f < 0 ? { force: f, port: "aspirate" } : { force: f, port: this.syringePort };
  }
}
