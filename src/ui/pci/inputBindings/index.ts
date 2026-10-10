// ---------------------------------------------------------------------------
// The PCI lab's hand bindings as a registry (pci-lab-input).
//
// Every src/ui/pci/inputBindings/*.ts other than this index (and test files)
// exports `binding` (or a default) of the shape { device, actions }: the hand
// target it serves (a device slot of the input layer, the syringe, or a named
// hand-operated part such as an indeflator) and, for each hand action it
// handles, the engine call. The input target (src/ui/pci/pciInputTarget.ts)
// routes the hands' commands through these first, so a device package adds a
// hand action by adding a file here and never edits the target. Two files may
// not bind the same action of the same device; a binding replaces the
// target's built-in route for that pair.
//
// Hand actions and their values:
//   advance, withdraw   mm of hub travel (always > 0; withdraw is the pull)
//   torque              radians at the hub (+ clockwise seen from the operator)
//   pin                 1 the left hand holds it, 0 it lets go
//   inflate             atm turned on the indeflator's screw (+ in, - out)
//   inject, flush       plunger force 0..1 (0 = released)
//   aspirate            pull 0..1 (0 = released)
// ---------------------------------------------------------------------------

import type { GripTarget } from "../../../input/types";
import type { PciReaction } from "../../../input/legacyAdapter";
import type { PciInputSession } from "../pciInputTarget";

export type PciHandAction = "advance" | "withdraw" | "torque" | "pin" | "inflate" | "inject" | "flush" | "aspirate";

export const PCI_HAND_ACTIONS: readonly PciHandAction[] = ["advance", "withdraw", "torque", "pin", "inflate", "inject", "flush", "aspirate"];

/** A hand target: a device slot, the syringe, or a named hand-operated part (a name such as 'indeflator' or 'guide-extension'). */
export type PciBindingDevice = GripTarget | (string & {});

/** What a binding's action is given. */
export interface PciBindingContext {
  session: PciInputSession;
  /** put a hub reaction on the input bus (haptics) */
  reaction(r: PciReaction): void;
}

/** One action: the engine call. Returning false says it was not taken (the target then tries its own route). */
export type PciBindingHandler = (ctx: PciBindingContext, value: number) => boolean | void;

export interface PciInputBinding {
  device: PciBindingDevice;
  actions: Partial<Record<PciHandAction, PciBindingHandler>>;
}

/** What a binding module exports. */
export interface PciInputBindingModule {
  binding?: PciInputBinding;
  default?: PciInputBinding;
}

export interface PciBindingEntry {
  device: string;
  action: PciHandAction;
  handler: PciBindingHandler;
  /** the file that declared it */
  file: string;
}

/** The bindings by device, then action. */
export type PciBindingRegistry = ReadonlyMap<string, ReadonlyMap<PciHandAction, PciBindingEntry>>;

/** A device name as the input layer writes its slots (wire014, pressureWire) or a kebab-case part name. */
const DEVICE_NAME = /^[a-z0-9]+(?:[A-Z0-9][a-z0-9]*)*(?:-[a-z0-9]+)*$/;

/** Collect the bindings from glob results (path to module). Throws on a malformed binding or a pair bound twice. */
export function collectBindings(files: Record<string, unknown>): PciBindingRegistry {
  const out = new Map<string, Map<PciHandAction, PciBindingEntry>>();
  for (const path of Object.keys(files).sort()) {
    const m = (files[path] ?? {}) as PciInputBindingModule;
    const b = m.binding ?? m.default;
    if (!b || typeof b !== "object") throw new Error(`PCI input binding file ${path} does not export 'binding'`);
    if (typeof b.device !== "string" || !DEVICE_NAME.test(b.device)) throw new Error(`${path}: binding device missing or not a device name`);
    if (!b.actions || typeof b.actions !== "object") throw new Error(`${path}: binding for '${b.device}' has no actions`);
    const names = Object.keys(b.actions);
    if (names.length === 0) throw new Error(`${path}: binding for '${b.device}' has no actions`);
    let byAction = out.get(b.device);
    if (!byAction) out.set(b.device, (byAction = new Map()));
    for (const name of names) {
      if (!(PCI_HAND_ACTIONS as readonly string[]).includes(name)) throw new Error(`${path}: '${name}' is not a PCI hand action (${PCI_HAND_ACTIONS.join(", ")})`);
      const action = name as PciHandAction;
      const handler = b.actions[action];
      if (typeof handler !== "function") throw new Error(`${path}: '${b.device}' ${action} is not a function`);
      const prev = byAction.get(action);
      if (prev) throw new Error(`PCI hand action '${action}' of '${b.device}' is bound by ${prev.file} and ${path}`);
      byAction.set(action, { device: b.device, action, handler, file: path });
    }
  }
  return out;
}

/** The binding for one device and action, or null. */
export function bindingFor(reg: PciBindingRegistry, device: string, action: PciHandAction): PciBindingEntry | null {
  return reg.get(device)?.get(action) ?? null;
}

/** Every bound (device, action) pair, sorted, for diagnostics and tests. */
export function boundPairs(reg: PciBindingRegistry): string[] {
  const out: string[] = [];
  for (const [device, m] of reg) for (const a of m.keys()) out.push(`${device}:${a}`);
  return out.sort();
}

/** The bindings in this folder (eager glob; this index and test files are not bindings). */
export const PCI_INPUT_BINDINGS: PciBindingRegistry = collectBindings(
  import.meta.glob(["./*.ts", "!./index.ts", "!./*.test.ts"], { eager: true }) as Record<string, unknown>
);
