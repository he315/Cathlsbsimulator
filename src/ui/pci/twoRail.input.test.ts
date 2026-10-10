// pci-two-rail-engine: the hands on two rails. With a second wire in the guide the hands' table holds
// wire014b and, once a device is on that wire, balloon2 (after keys 1-5 in the grip order); a hand command
// on either reaches the second wire and the device on it in the engine (the target moves the engine's hands
// to rail 2 first), and a command on the first rail's slots moves them back. With one wire nothing changes.
//   npx vitest run src/ui/pci/twoRail.input.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createInputSystem, type InputSystem } from "../../input/system";
import { GRIP_ORDER_DIAGNOSTIC, GRIP_ORDER_PCI, GRIP_ORDER_PCI_TWO_RAIL, defaultSettings, pciGripOrder, pciSettings } from "../../input/settings";
import { HandState, autoPinFor, resolvePin } from "../../input/handState";
import type { HandCommand } from "../../input/types";
import { PciLabSession } from "./PciLabSession";
import { resolvePciLaunch } from "./launch";
import { PciInputTarget, pciPresent, pciSecondRail, railOfSlot } from "./pciInputTarget";
import { applyDeliveryAction } from "./inputBindings/support";
import { loadSecondWire } from "../../simulation/pci/actions/wire";
import { loadDevice } from "../../simulation/pci/actions/devices";
import { activeRailOf, railsOf } from "../../simulation/pci/state";
import { pciRailInput } from "../../mentor/context";
import type { PciReaction } from "../../input/legacyAdapter";

const sessions: PciLabSession[] = [];
const targets: PciInputTarget[] = [];
afterEach(() => {
  for (const t of targets.splice(0)) t.dispose();
  for (const x of sessions.splice(0)) x.dispose();
});

function lab(scenario = "lad-focal", start = "wire-across"): PciLabSession {
  const r = resolvePciLaunch({ scenario, start });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ team: false, headlessFrames: true, launch: r.launch });
  sessions.push(x);
  return x;
}

function inputFor(): InputSystem {
  return createInputSystem({ storage: null, settings: pciSettings(defaultSettings()), gripOrder: pciGripOrder(null), present: ["sheath", "catheter", "wire014"], initialGrip: "wire014", getPads: () => [] });
}

function connect(x: PciLabSession, sys: InputSystem): PciInputTarget {
  const t = new PciInputTarget(x, sys);
  targets.push(t);
  return t;
}

/** The right hand to a device by name, closed on it, then hand travel (mm, + towards the patient). */
function push(sys: InputSystem, target: "wire014" | "wire014b" | "balloon" | "balloon2", mm: number) {
  sys.emit({ t: "select", target });
  sys.frame(sys.getSettings().grip.switchMs + 50);
  sys.emit({ t: "grab", on: true, source: "mouse" });
  // within the grip's push span, in bites
  for (let left = mm; Math.abs(left) > 1e-9; ) {
    const d = Math.sign(left) * Math.min(Math.abs(left), 15);
    sys.emit({ t: "move", axialMm: d, lateralMm: 0, source: "mouse" });
    sys.emit({ t: "grab", on: false, source: "mouse" });
    sys.emit({ t: "grab", on: true, source: "mouse" });
    left -= d;
  }
  sys.emit({ t: "grab", on: false, source: "mouse" });
}

describe("one wire: the hands' table as before", () => {
  it("present, grip order and the diagnostic grips leave the second rail out", () => {
    const x = lab();
    const sys = inputFor();
    connect(x, sys);
    expect(x.st.rails).toBeUndefined();
    expect(pciPresent(x.st)).toEqual(["sheath", "catheter", "wire014"]);
    expect(pciSecondRail(x.st)).toEqual({ wire: false, device: false });
    expect(sys.hands.getGripOrder()).toEqual(GRIP_ORDER_PCI);
    expect(pciGripOrder(null)).toEqual(GRIP_ORDER_PCI);
    expect(GRIP_ORDER_DIAGNOSTIC).not.toContain("wire014b");
    expect(GRIP_ORDER_DIAGNOSTIC).not.toContain("balloon2");
    expect(GRIP_ORDER_PCI_TWO_RAIL.slice(0, GRIP_ORDER_PCI.length)).toEqual(GRIP_ORDER_PCI);
    expect(pciRailInput(x.st)).toEqual({ activeRail: 0, wireCount: 1, jailedWire: false, kissing: false });
  });

  it("a command on the first wire's slot does not create rails", () => {
    const x = lab();
    const sys = inputFor();
    connect(x, sys);
    const tip0 = x.st.tipMm;
    push(sys, "wire014", -5);
    expect(x.st.tipMm).toBeLessThan(tip0);
    expect(x.st.rails).toBeUndefined();
  });
});

describe("two wires: hand commands reach the second wire and balloon slots", () => {
  it("loading a second wire puts wire014b on the table (after keys 1-5); a push on it moves rail 2's wire and leaves rail 1's", () => {
    const x = lab();
    const sys = inputFor();
    connect(x, sys);
    const tipA = x.st.tipMm;
    expect(applyDeliveryAction(x, "load-device", (st) => loadSecondWire(st))).toBe(true);
    expect(pciPresent(x.st)).toEqual(["sheath", "catheter", "wire014", "wire014b"]);
    expect(sys.hands.getGripOrder()).toEqual([...GRIP_ORDER_PCI, "wire014b"]);
    expect(sys.hands.isPresent("wire014b")).toBe(true);
    const tipB = railsOf(x.st)[1].wire!.tipMm;
    push(sys, "wire014b", 30);
    expect(activeRailOf(x.st)).toBe(1);
    expect(x.st.tipMm).toBeGreaterThan(tipB + 20);
    expect(railsOf(x.st)[0].wire!.tipMm).toBeCloseTo(tipA, 6);
    expect(pciRailInput(x.st)).toMatchObject({ activeRail: 1, wireCount: 2 });
    // the first wire's slot moves the hands back
    push(sys, "wire014", -3);
    expect(activeRailOf(x.st)).toBe(0);
    expect(x.st.tipMm).toBeLessThan(tipA);
    expect(railsOf(x.st)[1].wire!.tipMm).toBeGreaterThan(tipB + 20);
  });

  it("a torque and a pin on wire014b act on the second wire", () => {
    const x = lab();
    const sys = inputFor();
    const t = connect(x, sys);
    applyDeliveryAction(x, "load-device", (st) => loadSecondWire(st));
    const hub0 = railsOf(x.st)[1].wire!.hub;
    expect(t.hand({ kind: "torque", device: "wire014b", rad: 0.8 })).toBe(true);
    expect(railsOf(x.st)[1].wire!.hub).toBeCloseTo(hub0 + 0.8, 6);
    expect(t.hand({ kind: "pin", device: "wire014b", on: true })).toBe(true);
    expect(railsOf(x.st)[1].wire!.pinned).toBe(true);
    expect(railsOf(x.st)[0].wire!.pinned).toBe(false);
  });

  it("a device on the second wire is balloon2; a push on it moves that device and its reaction names balloon2", () => {
    const x = lab();
    const sys = inputFor();
    connect(x, sys);
    const reactions: PciReaction[] = [];
    sys.bus.on("reaction", (r) => reactions.push(r as PciReaction));
    applyDeliveryAction(x, "load-device", (st) => loadSecondWire(st));
    push(sys, "wire014b", 60);
    expect(railsOf(x.st)[1].wire!.tipMm).toBeGreaterThan(30);
    // a balloon on rail 2 (the hands are on rail 2 after the wire push)
    expect(applyDeliveryAction(x, "load-device", (st) => loadDevice(st, "balloon", "semi-compliant", 2.0, 12))).toBe(true);
    expect(pciPresent(x.st)).toEqual(["sheath", "catheter", "wire014", "wire014b", "balloon2"]);
    expect(sys.hands.getGripOrder()).toEqual(GRIP_ORDER_PCI_TWO_RAIL);
    // the first rail has no device: its slot is not on the table
    expect(pciPresent(x.st)).not.toContain("balloon");
    // back to rail 1 with a wire push, then the balloon2 push takes the hands to rail 2 and moves its device
    push(sys, "wire014", -1);
    expect(activeRailOf(x.st)).toBe(0);
    const c0 = railsOf(x.st)[1].device!.centreMm;
    push(sys, "balloon2", 10);
    expect(activeRailOf(x.st)).toBe(1);
    expect(x.st.device!.centreMm).toBeGreaterThan(c0 + 5);
    expect(railsOf(x.st)[0].device).toBeNull();
    expect(reactions.some((r) => r.device === "balloon2")).toBe(true);
  });

  it("the left hand's auto pin with the right hand on balloon2 holds the second wire", () => {
    const present = new Set(["sheath", "catheter", "wire014", "wire014b", "balloon2"] as const);
    expect(autoPinFor("balloon2", present)).toBe("wire");
    expect(resolvePin("wire", present, "balloon2")).toBe("wire014b");
    expect(resolvePin("wire", present, "balloon")).toBe("wire014");
    expect(autoPinFor("wire014b", present)).toBe("guide");
    const h = new HandState({ settings: pciSettings(defaultSettings()), present: [...present], gripOrder: GRIP_ORDER_PCI_TWO_RAIL, initial: "balloon2" });
    const out: HandCommand[] = h.apply({ t: "pin", target: "auto", on: true, source: "keyboard" }).commands;
    expect(out).toContainEqual({ kind: "pin", device: "wire014b", on: true });
  });

  it("a command on the second rail without a second wire is not taken; the slots map to their rails", () => {
    const x = lab();
    const sys = inputFor();
    const t = connect(x, sys);
    expect(t.hand({ kind: "push", device: "wire014b", mm: 5 })).toBe(false);
    expect(x.st.rails).toBeUndefined();
    expect(railOfSlot("wire014b")).toBe(1);
    expect(railOfSlot("balloon2")).toBe(1);
    expect(railOfSlot("stent")).toBe(0);
    expect(railOfSlot("catheter")).toBeNull();
  });

  it("perform('kissing', 'inflate') inflates both rails' balloons together and 0 deflates them", () => {
    const x = lab();
    const sys = inputFor();
    const t = connect(x, sys);
    applyDeliveryAction(x, "load-device", (st) => loadSecondWire(st));
    push(sys, "wire014b", 60);
    applyDeliveryAction(x, "load-device", (st) => loadDevice(st, "balloon", "semi-compliant", 2.0, 12));
    push(sys, "balloon2", 50);
    push(sys, "wire014", 0.5);
    applyDeliveryAction(x, "load-device", (st) => loadDevice(st, "balloon", "semi-compliant", 2.5, 12));
    push(sys, "balloon", 50);
    expect(t.perform("kissing", "inflate", 8)).toBe(true);
    expect(railsOf(x.st).every((r) => r.device!.inflated)).toBe(true);
    expect(pciRailInput(x.st).kissing).toBe(true);
    expect(t.perform("kissing", "inflate", 0)).toBe(true);
    expect(railsOf(x.st).some((r) => r.device!.inflated)).toBe(false);
  });
});
