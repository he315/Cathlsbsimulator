// pci-lab-input: the PCI lab on the S8 input system, headless (no React, no DOM). The hands' commands
// reach the PCI session through pciInputTarget: a device push goes to advanceDevice and carries
// deliver()'s forces back as a 'reaction'; the keyboard's W/S/Q/E move and turn the wire; the gamepad
// maps as in the diagnostic lab; the pedals and the syringe have no buttons; binding files add hand
// actions without touching the target.
//   npx vitest run src/ui/pci/input.pci.test.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInputSystem, type InputSystem } from "../../input/system";
import { applyToPci, type PciReaction } from "../../input/legacyAdapter";
import { DEFAULT_KEYMAP, GRIP_ORDER_DIAGNOSTIC, GRIP_ORDER_PCI, defaultSettings, pciGripOrder, pciKeyHelp, pciKeymap, pciSettings, type InputSettings } from "../../input/settings";
import { emptyPadMemory, mapGamepad, PAD, type GamepadLike } from "../../input/gamepad";
import type { HapticFeel } from "../../input/types";
import { PciLabSession } from "./PciLabSession";
import { resolvePciLaunch } from "./launch";
import { PciInputTarget, pciDeviceSlot, pciGuideMove, pciPresent, pciReaction, PCI_REACTION_AXIAL_AT_BACKUP, PCI_REACTION_AXIAL_ASSISTED_MAX, type PciInputSession } from "./pciInputTarget";
import { DEFAULT_RUMBLE } from "../../input/haptics";
import { advanceDevice as engineAdvanceDevice } from "../../simulation/pci/actions/devices";
import { deliver } from "../../simulation/pci/guide";
import { WIRE_SPEC } from "../../simulation/pci/equipment";
import { specOf, type PciState } from "../../simulation/pci/state";
import { collectBindings, boundPairs, PCI_INPUT_BINDINGS, type PciInputBinding } from "./inputBindings";

const sessions: PciLabSession[] = [];
const targets: PciInputTarget[] = [];
afterEach(() => {
  for (const t of targets.splice(0)) t.dispose();
  for (const x of sessions.splice(0)) x.dispose();
});

/** A session at a scenario's start (default rca-calcified with the wire across the lesion). */
function lab(scenario = "rca-calcified", start = "wire-across"): PciLabSession {
  const r = resolvePciLaunch({ scenario, start });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ team: false, headlessFrames: true, launch: r.launch });
  sessions.push(x);
  return x;
}

/** The PCI lab's input system (the PCI keys, the person's default settings, no storage, no pads unless given). */
function inputFor(pads: (GamepadLike | null)[] = [], settings: InputSettings = pciSettings(defaultSettings())): InputSystem {
  return createInputSystem({ storage: null, settings, gripOrder: pciGripOrder(null), present: ["sheath", "catheter", "wire014"], initialGrip: "wire014", getPads: () => pads });
}

function connect(x: PciLabSession, sys: InputSystem, bindings = PCI_INPUT_BINDINGS): PciInputTarget {
  const t = new PciInputTarget(x, sys, { bindings });
  targets.push(t);
  return t;
}

/** Bring the device's distal end to `mm` along the route (the assisted move; the session's own path). */
function deviceDistalTo(x: PciLabSession, mm: number) {
  const d = x.st.device!;
  x.advanceDevice(mm - (d.centreMm + d.lengthMm / 2));
}

/** The right hand to grip-order slot n (keys 1-5) and the hand's travel there. */
function selectSlot(sys: InputSystem, n: number) {
  sys.emit({ t: "selectIndex", index: n });
  sys.frame(sys.getSettings().grip.switchMs + 50);
}

/** deliver() called directly, with its inputs written out, for a push of `mm` on the device in `st`. */
function deliverNow(x: PciLabSession, st: PciState, mm: number) {
  const dev = st.device!;
  const distal = dev.centreMm + dev.lengthMm / 2;
  const g = x.g;
  return deliver(g, st.guide, {
    spec: specOf(dev),
    diameter: dev.diameter,
    lengthMm: dev.lengthMm,
    fromMm: distal,
    toMm: distal + mm,
    route: st.route,
    lesion: { vessel: g.lesion.vessel, startMm: g.lesion.startMm, endMm: g.lesion.endMm, mldMm: g.lesion.refDiameter * (1 - st.severity / 100), calcium: x.s.calcium, resistance: st.resistance },
    wireSupport: WIRE_SPEC[st.wireKind].support,
  }).r;
}

/** A session stub on a lab's state whose advanceDevice applies `apply` (the rest are inert). */
function stubSession(x: PciLabSession, apply: (st: PciState, mm: number) => PciState) {
  const stub = {
    s: x.s,
    g: x.g,
    st: x.st,
    moveWire: () => true,
    torqueWire: () => true,
    advanceDevice(mm: number) {
      stub.st = apply(stub.st, mm);
      return true;
    },
    engageGuide: () => true,
    inject: () => true,
    releaseInjection: () => undefined,
    aspirate: () => undefined,
    flushGuide: () => true,
    pressPedal: () => undefined,
    jogCArm: () => undefined,
    table: { setCommandedVelocity: () => undefined },
    subscribe: () => () => undefined,
  } satisfies PciInputSession;
  return stub;
}

function pad(o: { ly?: number; lx?: number; pressed?: number[]; values?: Record<number, number> } = {}): GamepadLike {
  const buttons = Array.from({ length: 17 }, (_, i) => ({ pressed: !!o.pressed?.includes(i), value: o.values?.[i] ?? (o.pressed?.includes(i) ? 1 : 0) }));
  return { index: 0, id: "test pad", mapping: "standard", connected: true, axes: [o.lx ?? 0, o.ly ?? 0, 0, 0], buttons };
}

describe("device push: advanceDevice and the delivery reaction", () => {
  it("a push on 'balloon' calls advanceDevice and, against the calcified lesion on the bend, emits 'reaction' with requiredN > 0", () => {
    const x = lab();
    expect(x.s.calcium).toBe(2);
    const sys = inputFor();
    connect(x, sys);
    expect(x.loadDevice("balloon", "semi-compliant", 2.5, 15)).toBe(true);
    // the device is on the rail: the hands' table and grip order follow
    expect(pciDeviceSlot(x.st)).toBe("balloon");
    expect(sys.hands.getGripOrder()).toEqual(["catheter", "wire014", "balloon", "syringe", "sheath"]);
    // the device's distal end just into the calcified segment
    deviceDistalTo(x, x.g.lesion.startMm + 3);
    const adv = vi.spyOn(x, "advanceDevice");
    const n0 = x.st.log.length;
    const reactions: HapticFeel[] = [];
    sys.bus.on("reaction", (r) => reactions.push(r));
    selectSlot(sys, 3);
    expect(sys.view().right.at).toBe("balloon");
    sys.emit({ t: "grab", on: true, source: "mouse" });
    sys.emit({ t: "move", axialMm: 2, lateralMm: 0, source: "mouse" });
    // pci-device-delivery: the push takes the engine's delivery path (actions/devices.ts advanceDevice, through the
    // 'delivery' binding), not the session's assisted move: one engine move record, with the technique it writes
    expect(adv).not.toHaveBeenCalled();
    const moves = x.st.log.slice(n0).filter((e) => e.kind === "device" && e.data.action === "move");
    expect(moves).toHaveLength(1);
    expect(moves[0].data.technique).toBeDefined();
    expect(reactions).toHaveLength(1);
    const r = reactions[0] as PciReaction;
    expect(r.device).toBe("balloon");
    expect(r.requiredN).toBeGreaterThan(0);
    expect(r.lesionN).toBeGreaterThan(0); // the calcified lesion's crossing load, not only rail friction
    expect(r.backupN).toBeGreaterThan(0);
    expect(r.axial).toBeGreaterThan(0);
  });

  it("the reaction's load is the delivery engine's: heavier in the calcified lesion than on the proximal rail", () => {
    const x = lab();
    const sys = inputFor();
    const t = connect(x, sys);
    x.loadDevice("balloon", "semi-compliant", 2.5, 15);
    const got: PciReaction[] = [];
    sys.bus.on("reaction", (r) => got.push(r as PciReaction));
    // the proximal rail: deliver() itself, called with its inputs written out
    deviceDistalTo(x, 20);
    const direct = deliverNow(x, x.st, 2);
    expect(t.pushDevice("balloon", 2)).toBe(true);
    const proximal = got.pop()!;
    expect(proximal.requiredN).toBeCloseTo(direct.requiredN, 9);
    expect(proximal.backupN).toBeCloseTo(direct.backupN, 9);
    expect(proximal.lesionN).toBe(0);
    // in the lesion: the delivery engine (actions/devices.ts advanceDevice) on the same state logs a
    // guide back-out with the forces the reaction must carry
    deviceDistalTo(x, x.g.lesion.startMm + 10);
    const n0 = x.st.log.length;
    const engine = engineAdvanceDevice(x.s, x.g, x.st, 2);
    const backout = engine.log.slice(n0).find((e) => e.kind === "guide-backout");
    expect(backout).toBeDefined();
    const depth0 = x.st.guide.depthMm;
    const engaged0 = x.st.guide.engaged;
    expect(t.pushDevice("balloon", 2)).toBe(true);
    const inLesion = got.pop()!;
    expect(inLesion.requiredN).toBeCloseTo(backout!.data.requiredN as number, 9);
    expect(inLesion.backupN).toBeCloseTo(backout!.data.backupN as number, 9);
    expect(inLesion.requiredN).toBeGreaterThan(proximal.requiredN);
    expect(inLesion.axial).toBeGreaterThan(proximal.axial);
    expect(inLesion.requiredN).toBeGreaterThan(inLesion.backupN);
    // the snap is what the session did to the guide, not the probe's prediction
    const moved = pciGuideMove({ engaged: engaged0, depthMm: depth0 }, x.st.guide);
    expect(inLesion.guideBackMm).toBeCloseTo(moved.guideBackMm, 9);
    expect(inLesion.disengaged).toBe(moved.disengaged);
    expect(inLesion.snap).toBe(moved.guideBackMm > 0.3 || moved.disengaged);
    // no rail, no load: a pull back gives a zero reaction
    expect(t.pushDevice("balloon", -2)).toBe(true);
    expect(got.pop()!.requiredN).toBe(0);
  });

  it("no snap when the session's push leaves the guide where it was, however heavy the push", () => {
    const x = lab();
    x.loadDevice("balloon", "semi-compliant", 2.5, 15);
    deviceDistalTo(x, x.g.lesion.startMm + 10);
    // the assisted path: the device moves, the guide does not
    const stub = stubSession(x, (st, mm) => ({ ...st, device: { ...st.device!, centreMm: st.device!.centreMm + mm } }));
    const sys = inputFor();
    const t = new PciInputTarget(stub, sys);
    targets.push(t);
    const got: PciReaction[] = [];
    sys.bus.on("reaction", (r) => got.push(r as PciReaction));
    for (let i = 0; i < 5; i++) expect(t.pushDevice("balloon", 0.5)).toBe(true);
    expect(got).toHaveLength(5);
    for (const r of got) {
      expect(r.requiredN).toBeGreaterThan(r.backupN);
      expect(r.guideBackMm).toBe(0);
      expect(r.disengaged).toBe(false);
      expect(r.snap).toBe(false);
      // the device went through the stall: the hands feel weight, never the rumble's saturation
      expect(r.assisted).toBe(true);
      expect(r.axial).toBeGreaterThan(0);
      expect(r.axial).toBeLessThanOrEqual(PCI_REACTION_AXIAL_ASSISTED_MAX);
      expect(r.axial).toBeLessThan(DEFAULT_RUMBLE.axialSat);
    }
    expect(stub.st.guide.engaged).toBe(true);
  });

  it("the live session's push through the calcified lesion is assisted: no saturated rumble for a stall it does not show", () => {
    const x = lab();
    const sys = inputFor();
    const t = connect(x, sys);
    x.loadDevice("balloon", "semi-compliant", 2.5, 15);
    deviceDistalTo(x, x.g.lesion.startMm + 10);
    const got: PciReaction[] = [];
    sys.bus.on("reaction", (r) => got.push(r as PciReaction));
    const d0 = x.st.device!.centreMm;
    expect(t.pushDevice("balloon", 2)).toBe(true);
    const r = got.pop()!;
    expect(r.requiredN).toBeGreaterThan(r.backupN);
    if (x.st.device!.centreMm - d0 > 0.5) {
      // the session's advanceDevice is still the assisted move: the device went on
      expect(r.assisted).toBe(true);
      expect(r.axial).toBeLessThan(DEFAULT_RUMBLE.axialSat);
    } else {
      // the session runs the delivery physics: the stall is real and felt in full
      expect(r.assisted).toBe(false);
      expect(r.axial).toBeGreaterThanOrEqual(DEFAULT_RUMBLE.axialSat);
    }
  });

  it("a snap when the session's push backs the guide out (the delivery engine's advanceDevice)", () => {
    const x = lab();
    x.loadDevice("balloon", "semi-compliant", 2.5, 15);
    deviceDistalTo(x, x.g.lesion.startMm + 10);
    const stub = stubSession(x, (st, mm) => engineAdvanceDevice(x.s, x.g, st, mm));
    const sys = inputFor();
    const t = new PciInputTarget(stub, sys);
    targets.push(t);
    const got: PciReaction[] = [];
    sys.bus.on("reaction", (r) => got.push(r as PciReaction));
    const depth0 = stub.st.guide.depthMm;
    expect(t.pushDevice("balloon", 2)).toBe(true);
    const r = got.pop()!;
    expect(depth0 - stub.st.guide.depthMm).toBeGreaterThan(0.3);
    expect(r.guideBackMm).toBeCloseTo(depth0 - stub.st.guide.depthMm, 9);
    expect(r.snap).toBe(true);
    // the delivery engine stops the device at the stall: not assisted, the full load
    expect(r.assisted).toBe(false);
    expect(r.axial).toBeGreaterThanOrEqual(DEFAULT_RUMBLE.axialSat);
  });

  it("the haptic load is the fraction of the guide's back-up the push needs (MODEL PARAMETER scale)", () => {
    const r = pciReaction("stent", { requiredN: 0.09, frictionN: 0.03, lesionN: 0.06, backupN: 0.18, advancedMm: 1, guideBackMm: 0, disengaged: false });
    expect(r.axial).toBeCloseTo(0.5 * PCI_REACTION_AXIAL_AT_BACKUP, 9);
    expect(r.snap).toBe(false);
    expect(pciReaction("balloon", null).axial).toBe(0);
    // the guide movement the session applied decides the snap, not deliver()'s prediction
    const heavy = { requiredN: 0.3, frictionN: 0.1, lesionN: 0.2, backupN: 0.18, advancedMm: 0, guideBackMm: 1.2, disengaged: false };
    expect(pciReaction("balloon", heavy, { guideBackMm: 0, disengaged: false }).snap).toBe(false);
    expect(pciReaction("balloon", heavy, { guideBackMm: 0, disengaged: true }).snap).toBe(true);
    expect(pciReaction("balloon", heavy, { guideBackMm: 0.5, disengaged: false }).snap).toBe(true);
    // a session move beyond deliver()'s advance caps the load below saturation; within rounding it does not
    expect(pciReaction("balloon", heavy, { guideBackMm: 0, disengaged: false, overrunMm: 1 }).axial).toBeCloseTo(PCI_REACTION_AXIAL_ASSISTED_MAX, 9);
    expect(pciReaction("balloon", heavy, { guideBackMm: 0, disengaged: false, overrunMm: 0.01 }).assisted).toBe(false);
    expect(pciReaction("balloon", heavy).assisted).toBe(false);
  });

  it("the device push never takes the assisted moveDevice when advanceDevice exists (legacyAdapter.applyToPci)", () => {
    const t = { moveWire: vi.fn(), torqueWire: vi.fn(), advanceDevice: vi.fn(), moveDevice: vi.fn() };
    expect(applyToPci({ kind: "push", device: "stent", mm: 3 }, t)).toBe(true);
    expect(t.advanceDevice).toHaveBeenCalledWith(3);
    expect(t.moveDevice).not.toHaveBeenCalled();
    // the guide: re-engaged when out of the ostium, else seated
    const g = { moveWire: vi.fn(), torqueWire: vi.fn(), guideEngaged: () => false, engageGuide: vi.fn(), seatGuide: vi.fn() };
    applyToPci({ kind: "push", device: "catheter", mm: 2 }, g);
    expect(g.engageGuide).toHaveBeenCalledTimes(1);
    g.guideEngaged = () => true;
    applyToPci({ kind: "push", device: "catheter", mm: -1 }, g);
    expect(g.seatGuide).toHaveBeenCalledWith(-1);
    // an action the target does not offer is not handled
    expect(applyToPci({ kind: "pin", device: "wire014", on: true }, { moveWire: vi.fn(), torqueWire: vi.fn() })).toBe(false);
  });
});

describe("keyboard, gamepad, pedals and syringe", () => {
  it("W/S/Q/E move and turn the wire through KeyboardSource", () => {
    const x = lab("lad-focal");
    const sys = inputFor();
    connect(x, sys);
    const move = vi.spyOn(x, "moveWire");
    const turn = vi.spyOn(x, "torqueWire");
    const tip0 = x.st.tipMm;
    sys.keyboard.keyDown("KeyW");
    sys.frame(100);
    sys.keyboard.keyUp("KeyW");
    expect(move).toHaveBeenCalled();
    expect(move.mock.calls.every((c) => c[0] > 0)).toBe(true);
    expect(x.st.tipMm).toBeGreaterThan(tip0);
    move.mockClear();
    sys.keyboard.keyDown("KeyS");
    sys.frame(100);
    sys.keyboard.keyUp("KeyS");
    expect(move).toHaveBeenCalled();
    expect(move.mock.calls.every((c) => c[0] < 0)).toBe(true);
    sys.keyboard.keyDown("KeyQ");
    sys.frame(100);
    sys.keyboard.keyUp("KeyQ");
    expect(turn).toHaveBeenCalled();
    expect(turn.mock.calls.every((c) => c[0] < 0)).toBe(true); // anticlockwise, as the earlier lab's Q
    turn.mockClear();
    sys.keyboard.keyDown("KeyE");
    sys.frame(100);
    sys.keyboard.keyUp("KeyE");
    expect(turn.mock.calls.length).toBeGreaterThan(0);
    expect(turn.mock.calls.every((c) => c[0] > 0)).toBe(true);
  });

  it("the PCI keys move the pins to R and G and keep a person's own remaps", () => {
    const k = pciKeymap(DEFAULT_KEYMAP);
    expect(k.rollCcw).toEqual(["KeyA", "KeyQ"]);
    expect(k.rollCw).toEqual(["KeyD", "KeyE"]);
    expect(k.pinWire).toEqual(["KeyR"]);
    expect(k.pinGuide).toEqual(["KeyG"]);
    expect(k.advance).toEqual(["KeyW"]);
    expect(k.withdraw).toEqual(["KeyS"]);
    // the diagnostic keys are untouched
    expect(DEFAULT_KEYMAP.pinWire).toEqual(["KeyQ"]);
    // a person who put the wire pin on Q keeps it, and Q then does not roll
    const own = pciKeymap({ ...DEFAULT_KEYMAP, pinWire: ["KeyQ", "KeyV"] });
    expect(own.pinWire).toEqual(["KeyQ", "KeyV"]);
    expect(own.rollCcw).toEqual(["KeyA"]);
  });

  it("the key help is read from the PCI keymap: the real keys, the person's remaps, pins only when the session takes them", () => {
    const help = pciKeyHelp(pciKeymap(DEFAULT_KEYMAP));
    const keysFor = (does: RegExp) => help.find((i) => does.test(i.does))?.keys;
    expect(keysFor(/^push, pull back/)).toEqual(["W", "S"]);
    expect(keysFor(/^roll/)).toEqual(["A", "Q", "D", "E"]);
    expect(keysFor(/^right hand to the guide/)).toEqual(["1", "2", "3", "4", "5"]);
    expect(keysFor(/inject contrast/)).toEqual(["J"]);
    expect(keysFor(/flush/)).toEqual(["K"]);
    expect(keysFor(/draw back/)).toEqual(["L"]);
    expect(keysFor(/fluoroscopy/)).toEqual(["F"]);
    expect(keysFor(/^hold for cine/)).toEqual(["C"]);
    expect(keysFor(/^fine/)).toEqual(["Shift"]);
    // Space is a pin in this lab, never an injection; pins are listed only when they act
    expect(help.some((i) => i.keys.includes("Space"))).toBe(false);
    const withPins = pciKeyHelp(pciKeymap(DEFAULT_KEYMAP), { pins: true });
    expect(withPins.find((i) => /partner/.test(i.does))?.keys).toEqual(["Space"]);
    expect(withPins.find((i) => /pins the wire/.test(i.does))?.keys).toEqual(["R"]);
    expect(withPins.find((i) => /holds the guide/.test(i.does))?.keys).toEqual(["G"]);
    // a remap shows in the help
    const own = pciKeyHelp(pciKeymap({ ...DEFAULT_KEYMAP, inject: ["KeyI"] }));
    expect(own.find((i) => /inject contrast/.test(i.does))?.keys).toEqual(["I"]);
  });

  it("the gamepad mapping equals the diagnostic lab's", () => {
    const diag = defaultSettings();
    const pci = pciSettings(diag);
    expect(pci.gamepad).toEqual(diag.gamepad);
    expect(pci.midi).toEqual(diag.midi);
    expect(pci.hid).toEqual(diag.hid);
    const polls: GamepadLike[] = [
      pad({ ly: -0.8 }),
      pad({ ly: -0.8, lx: 0.5 }),
      pad({ values: { [PAD.LT]: 0.9 } }),
      pad({ pressed: [PAD.LB, PAD.RB] }),
      pad({ pressed: [PAD.A] }),
      pad({ values: { [PAD.RT]: 0.9 }, lx: -0.4 }),
      pad(),
    ];
    for (const ctx of [{ atSyringe: false, port: "contrast" as const }, { atSyringe: true, port: "saline" as const }]) {
      const ma = emptyPadMemory();
      const mb = emptyPadMemory();
      for (const p of polls) expect(mapGamepad(p, ma, pci, 1 / 60, ctx)).toEqual(mapGamepad(p, mb, diag, 1 / 60, ctx));
    }
    // and in the lab the left stick drives the gripped wire, the left trigger the fluoroscopy pedal
    const x = lab("lad-focal");
    const pads: (GamepadLike | null)[] = [pad({ ly: -1 })];
    const sys = inputFor(pads);
    connect(x, sys);
    const move = vi.spyOn(x, "moveWire");
    sys.frame(50);
    expect(move).toHaveBeenCalled();
    expect(move.mock.calls[0][0]).toBeGreaterThan(0);
    pads[0] = pad({ values: { [PAD.LT]: 1 } });
    sys.frame(16);
    expect(x.pedal.fluoro).toBe(true);
    pads[0] = pad();
    sys.frame(16);
    expect(x.pedal.fluoro).toBe(false);
  });

  it("F and C are the pedals; J pushes the guide's syringe for as long as it is held, L aspirates, K flushes", () => {
    const x = lab("lad-focal");
    const sys = inputFor();
    connect(x, sys);
    sys.keyboard.keyDown("KeyF");
    expect(x.pedal.fluoro).toBe(true);
    expect(x.beamMode()).toBe("fluoro");
    sys.keyboard.keyUp("KeyF");
    expect(x.pedal.fluoro).toBe(false);
    sys.keyboard.keyDown("KeyC");
    expect(x.beamMode()).toBe("cine");
    sys.keyboard.keyUp("KeyC");
    expect(x.beamMode()).toBe(null);
    // the plunger: no buttons, the force builds while J is held
    const inject = vi.spyOn(x, "inject");
    const release = vi.spyOn(x, "releaseInjection");
    sys.keyboard.keyDown("KeyJ");
    for (let i = 0; i < 10; i++) sys.frame(50);
    expect(inject).toHaveBeenCalledTimes(1);
    expect(inject.mock.calls[0][0]).toEqual({ side: x.s.side });
    expect(x.bolusInfo()).not.toBeNull();
    sys.keyboard.keyUp("KeyJ");
    expect(release).toHaveBeenCalledTimes(1);
    const asp = vi.spyOn(x, "aspirate");
    sys.keyboard.keyDown("KeyL");
    for (let i = 0; i < 10; i++) sys.frame(50);
    sys.keyboard.keyUp("KeyL");
    expect(asp).toHaveBeenCalledTimes(1);
    const flush = vi.spyOn(x, "flushGuide");
    sys.keyboard.keyDown("KeyK");
    for (let i = 0; i < 10; i++) sys.frame(50);
    sys.keyboard.keyUp("KeyK");
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it("the device is on the hands' table only while it is on the rail, in slot 3 by its kind", () => {
    const x = lab("lad-focal");
    const sys = inputFor();
    connect(x, sys);
    expect(pciPresent(x.st)).toEqual(["sheath", "catheter", "wire014"]);
    x.loadDevice("stent", "semi-compliant", 3, 15);
    expect(pciPresent(x.st)).toEqual(["sheath", "catheter", "wire014", "stent"]);
    expect(sys.hands.getGripOrder()).toEqual(["catheter", "wire014", "stent", "syringe", "sheath"]);
    expect(sys.hands.isPresent("stent")).toBe(true);
    x.removeDevice();
    expect(sys.hands.isPresent("stent")).toBe(false);
    expect(pciGripOrder(null)).toEqual(GRIP_ORDER_PCI);
    expect(GRIP_ORDER_DIAGNOSTIC).toEqual(["catheter", "wire035", "syringe", "sheath"]);
  });

  it("disconnecting lifts the feet and ends a held push", () => {
    const x = lab("lad-focal");
    const sys = inputFor();
    const t = connect(x, sys);
    sys.keyboard.keyDown("KeyF");
    expect(x.pedal.fluoro).toBe(true);
    t.dispose();
    expect(x.pedal.fluoro).toBe(false);
    // after disposal the bus no longer reaches the session
    const move = vi.spyOn(x, "moveWire");
    sys.keyboard.keyUp("KeyF");
    sys.keyboard.keyDown("KeyW");
    sys.frame(100);
    expect(move).not.toHaveBeenCalled();
  });

  it("the private key handler is gone: usePciInput runs on the input system", () => {
    const src = readFileSync(join(__dirname, "usePciInput.ts"), "utf8");
    expect(src).not.toMatch(/addEventListener\(\s*["']key(down|up)["']/);
    expect(src).not.toMatch(/export function pciKey(Down|Up)/);
    expect(src).toMatch(/useInputSystem\(/);
    expect(src).toMatch(/connectPciInput\(/);
  });
});

describe("hand bindings by file", () => {
  it("a binding replaces the target's own route for its pair, and an action without a slot is reached by perform()", () => {
    const x = lab("lad-focal");
    const sys = inputFor();
    const calls: string[] = [];
    const wire: PciInputBinding = {
      device: "wire014",
      actions: {
        advance: (ctx, mm) => {
          calls.push(`advance ${mm.toFixed(2)}`);
          ctx.session.moveWire(mm);
        },
      },
    };
    const indeflator: PciInputBinding = { device: "indeflator", actions: { inflate: (_ctx, atm) => void calls.push(`inflate ${atm}`) } };
    const reg = collectBindings({ "./wire.ts": { binding: wire }, "./indeflator.ts": { default: indeflator } });
    expect(boundPairs(reg)).toEqual(["indeflator:inflate", "wire014:advance"]);
    const t = connect(x, sys, reg);
    const move = vi.spyOn(x, "moveWire");
    sys.emit({ t: "grab", on: true, source: "mouse" });
    sys.emit({ t: "move", axialMm: 1.5, lateralMm: 0, source: "mouse" });
    expect(calls).toEqual(["advance 1.50"]);
    expect(move).toHaveBeenCalledWith(1.5);
    // withdraw is not bound: the target's own route
    sys.emit({ t: "move", axialMm: -1, lateralMm: 0, source: "mouse" });
    expect(move).toHaveBeenLastCalledWith(-1);
    expect(calls).toHaveLength(1);
    expect(t.perform("indeflator", "inflate", 2)).toBe(true);
    expect(calls).toEqual(["advance 1.50", "inflate 2"]);
    expect(t.perform("indeflator", "deflate" as never, 2)).toBe(false);
  });

  it("refuses a pair bound by two files, an unknown action and a file without a binding", () => {
    const b: PciInputBinding = { device: "balloon", actions: { advance: () => true } };
    expect(() => collectBindings({ "./a.ts": { binding: b }, "./b.ts": { binding: b } })).toThrow(/bound by \.\/a\.ts and \.\/b\.ts/);
    expect(() => collectBindings({ "./a.ts": { binding: { device: "balloon", actions: { spin: () => true } } } })).toThrow(/not a PCI hand action/);
    expect(() => collectBindings({ "./a.ts": { other: 1 } })).toThrow(/does not export 'binding'/);
  });

  it("the folder's registry loads (the files present today bind no pair twice)", () => {
    expect(PCI_INPUT_BINDINGS).toBeInstanceOf(Map);
    expect(() => boundPairs(PCI_INPUT_BINDINGS)).not.toThrow();
  });
});
