// pci-device-delivery: the delivery hand actions are bound by src/ui/pci/inputBindings/support.ts ('delivery':
// advance and withdraw what the right hand holds, pin the wire) and reachable through the PCI input target with
// no console open: the hands push a device taken through the equipment workflow down the guide from the valve
// and out against the lesion (the delivery physics, with the hub reaction), pull it back, pin the wire and hold
// the guide, and push a guide extension by its rod. A device the assisted console loaded takes the same delivery
// path. With the attending attached, as in the lab, inchworming, balloon-assisted tracking, the team's deep breath
// and bringing a device back after a back-out are not stopped. The support console registers, exports only meta
// and the component, and shows read-outs and settings only.
//   npx vitest run src/ui/pci/inputBindings/support.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PciLabSession, policyForMode } from "../PciLabSession";
import { PciInputTarget } from "../pciInputTarget";
import { resolvePciLaunch } from "../launch";
import { createInputSystem } from "../../../input/system";
import { defaultSettings, pciGripOrder, pciSettings } from "../../../input/settings";
import type { PciReaction } from "../../../input/legacyAdapter";
import { useSeriesStore } from "../../../state/useSeriesStore";
import {
  advanceDevice,
  backloadDevice,
  checkLabel,
  moveExtension,
  pinWire,
  prepareDevice,
  pullIndeflatorNegative,
  requestDevice,
  setExtensionRod,
  setIndeflator,
  setValve,
  stepPci,
  takeExtension,
  type PciState,
} from "../../../simulation/angioPci";
import { deviceShaftMm, guideLengthMm } from "../../../simulation/pci/actions/devices";
import { deliveryOf, type PciScenario } from "../../../simulation/pci/state";
import { DEVICE_BY_ID } from "../../../simulation/pci/equipment";
import { PCI_INPUT_BINDINGS, bindingFor, boundPairs } from "./index";
import { applyDeliveryAction, binding, deepBreathByTeam, deliveryHand, setDeliveryHand } from "./support";
import { PciAttending } from "../usePciAttending";
import SupportConsole, { meta as consoleMeta } from "../consoles/SupportConsole";
import { pciConsoles } from "../consoles/registry";
import type { LaunchMode } from "../../../content/schema";

const sessions: PciLabSession[] = [];
const targets: PciInputTarget[] = [];
const detaches: (() => void)[] = [];
afterEach(() => {
  for (const d of detaches.splice(0)) d();
  for (const t of targets.splice(0)) t.dispose();
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

/** A scenario (default rca-stuck-stent) with the wire across, and an input target; no console is open. */
function rig(mode: LaunchMode = "guided", scenario = "rca-stuck-stent") {
  const r = resolvePciLaunch({ scenario, start: "wire-across", mode });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true, mode, policy: policyForMode(mode) });
  sessions.push(x);
  const sys = createInputSystem({ storage: null, settings: pciSettings(defaultSettings()), gripOrder: pciGripOrder(null), initialGrip: "wire014", getPads: () => [] });
  const t = new PciInputTarget(x, sys);
  targets.push(t);
  const reactions: PciReaction[] = [];
  sys.bus.on("reaction", (rr) => reactions.push(rr as PciReaction));
  return { x, t, sys, reactions };
}

/** A device box taken, checked, prepared and backloaded, the valve open (the equipment workflow). */
const take = (x: PciLabSession, specId: string, d: number, l: number) =>
  applyDeliveryAction(x, "load-device", (st) => setValve(backloadDevice(prepareDevice(checkLabel(requestDevice(st, specId, d, l)))), true));

const distalOf = (x: PciLabSession) => x.st.device!.centreMm + x.st.device!.lengthMm / 2;
const distalSt = (st: PciState) => st.device!.centreMm + st.device!.lengthMm / 2;

/** The attending attached to the session as PciLab attaches it, with the case begun (no form over the lab). */
function attend(x: PciLabSession): PciAttending {
  const a = new PciAttending(x, { damagedWire: false, absentMember: null });
  detaches.push(a.attach());
  a.startCase();
  expect(a.handsEnabled()).toBe(true);
  return a;
}

/**
 * The wire pinned, a guide extension (rod under the towel) at the guide tip, a 2.0 mm balloon taken over the
 * equipment workflow with the extension 10 mm in over it, the balloon straddling the extension's tip and
 * inflated to `atm` (the team's set-up, applied as one engine change).
 */
function straddle(x: PciLabSession, atm: number): boolean {
  const s = x.s as PciScenario;
  const g = x.g;
  return applyDeliveryAction(x, "load-device", (st0) => {
    let st = setExtensionRod(takeExtension(setValve(pinWire(st0, true), true), { french: 6, cylinderCm: 25 }), true);
    st = moveExtension(s, g, st, guideLengthMm(st.guide));
    st = advanceDevice(s, g, setValve(backloadDevice(prepareDevice(checkLabel(requestDevice(st, "sc", 2.0, 15)))), true), 1);
    st = advanceDevice(s, g, st, 20 - distalSt(st));
    st = moveExtension(s, g, st, 10);
    st = advanceDevice(s, g, st, 17.5 - distalSt(st));
    st = setIndeflator(st, atm, 4);
    for (let i = 0; i < 40; i++) st = stepPci(s, g, st, 0.1);
    return st;
  });
}

describe("delivery hand bindings (pci-device-delivery)", () => {
  it("the binding file declares delivery's advance, withdraw and pin, and the support console is registered", () => {
    expect(binding.device).toBe("delivery");
    for (const a of ["advance", "withdraw", "pin"] as const) {
      expect(bindingFor(PCI_INPUT_BINDINGS, "delivery", a)?.file).toBe("./support.ts");
      expect(boundPairs(PCI_INPUT_BINDINGS)).toContain(`delivery:${a}`);
    }
    expect(pciConsoles().some((c) => c.id === consoleMeta.id)).toBe(true);
  });

  it("drives the device with the console closed: down the guide from the valve, out unscreened, against the lesion with the reaction, and back", () => {
    const { x, t, reactions } = rig();
    expect(x.openConsoleId()).toBeNull();
    expect(take(x, "des", 3.0, 22)).toBe(true);
    // the left hand pins the wire and holds the guide (the independent-hand technique)
    expect(t.hand({ kind: "pin", device: "wire014", on: true })).toBe(true);
    expect(x.st.wire.pinned).toBe(true);
    expect(t.hand({ kind: "pin", device: "catheter", on: true })).toBe(true);
    expect(x.st.guide.pinned).toBe(true);
    // the first push introduces it at the valve; the shaft then runs down the guide
    expect(t.hand({ kind: "push", device: "stent", mm: 5 })).toBe(true);
    expect(x.st.device!.stage).toBe("in-guide");
    expect(deviceShaftMm(x.st)).toBeCloseTo(0, 6);
    for (let i = 0; i < 90; i++) t.hand({ kind: "push", device: "stent", mm: 10 });
    expect(deviceShaftMm(x.st)).toBeCloseTo(900, 6);
    expect(x.st.counters.unscreened).toBe(0);
    // with the beam off it leaves the guide tip unscreened
    expect(x.beamMode()).toBeNull();
    for (let i = 0; i < 12; i++) t.hand({ kind: "push", device: "stent", mm: 10 });
    expect(distalOf(x)).toBeGreaterThan(0);
    expect(x.st.counters.unscreened).toBe(1);
    // against the lesion: the delivery physics, felt at the hub (not the assisted move)
    for (let i = 0; i < 80 && x.st.counters.guideBackouts === 0; i++) t.hand({ kind: "push", device: "stent", mm: 1 });
    expect(x.st.counters.guideBackouts).toBeGreaterThanOrEqual(1);
    expect(distalOf(x)).toBeLessThan(x.g.lesion.endMm);
    const r = reactions[reactions.length - 1];
    expect(r.device).toBe("stent");
    expect(r.requiredN).toBeGreaterThan(r.backupN);
    expect(r.assisted).toBe(false);
    // and back
    const d0 = distalOf(x);
    expect(t.hand({ kind: "push", device: "stent", mm: -5 })).toBe(true);
    expect(distalOf(x)).toBeCloseTo(d0 - 5, 6);
    // the pins let go
    expect(t.hand({ kind: "pin", device: "wire014", on: false })).toBe(true);
    expect(x.st.wire.pinned).toBe(false);
  });

  it("with the beam on the device leaves the guide tip screened", () => {
    const { x, t } = rig();
    take(x, "sc", 2.0, 15);
    t.hand({ kind: "push", device: "balloon", mm: 1 });
    for (let i = 0; i < 99; i++) t.hand({ kind: "push", device: "balloon", mm: 10 });
    x.pressPedal("fluoro", true);
    x.step(0.1);
    expect(x.beamMode()).not.toBeNull();
    for (let i = 0; i < 4; i++) t.hand({ kind: "push", device: "balloon", mm: 5 });
    expect(distalOf(x)).toBeGreaterThan(0);
    expect(x.st.counters.unscreened).toBe(0);
  });

  it("the right hand on the extension's push rod moves the extension; the assisted console's devices keep the session's own move", () => {
    const { x, t } = rig();
    expect(applyDeliveryAction(x, "load-device", (st) => setExtensionRod(takeExtension(setValve(st, true), { cylinderCm: 25 }), true))).toBe(true);
    // no device on the rail: the push rod is in the device slot
    const tip0 = x.st.guide.ext!.tipMm;
    expect(t.hand({ kind: "push", device: "balloon", mm: 10 })).toBe(true);
    expect(x.st.guide.ext!.tipMm).toBeCloseTo(tip0 + 10, 6);
    setDeliveryHand(x, "extension");
    expect(deliveryHand(x)).toBe("extension");
  });

  it("a device the assisted console loaded takes the delivery path: the hands' stalled push backs the guide out", () => {
    const { x, t, reactions } = rig();
    expect(x.loadDevice("stent", "semi-compliant", 3.0, 22)).toBe(true);
    expect(x.st.device!.assisted).toBe(true);
    const adv = vi.spyOn(x, "advanceDevice");
    const depth0 = x.st.guide.depthMm;
    for (let i = 0; i < 200 && x.st.counters.guideBackouts === 0 && x.st.guide.engaged; i++) t.hand({ kind: "push", device: "stent", mm: 1 });
    // never the session's assisted move: the engine's delivery physics stopped it and backed the guide out
    expect(adv).not.toHaveBeenCalled();
    expect(x.st.counters.guideBackouts).toBeGreaterThanOrEqual(1);
    expect(x.st.guide.depthMm).toBeLessThan(depth0);
    expect(distalOf(x)).toBeLessThan(x.g.lesion.endMm);
    const r = reactions[reactions.length - 1];
    expect(r.requiredN).toBeGreaterThan(r.backupN);
    expect(r.assisted).toBe(false);
    expect(r.snap).toBe(true);
  });

  it("with an assisted balloon on the rail the hands' setting drives the extension: 'together' pushes the rod", () => {
    const { x, t } = rig();
    expect(x.loadDevice("balloon", "semi-compliant", 2.0, 15)).toBe(true);
    expect(applyDeliveryAction(x, "load-device", (st) => setExtensionRod(takeExtension(st, { cylinderCm: 25 }), true))).toBe(true);
    setDeliveryHand(x, "together");
    const tip0 = x.st.guide.ext!.tipMm;
    const c0 = x.st.device!.centreMm;
    expect(t.hand({ kind: "push", device: "balloon", mm: 10 })).toBe(true);
    expect(x.st.guide.ext!.tipMm).toBeCloseTo(tip0 + 10, 6);
    // the balloon is not inflated and straddling, so only the extension went (balloon-assisted tracking needs both)
    expect(x.st.device!.centreMm).toBeCloseTo(c0, 6);
  });

  it("a stalled extension push is felt at the hub: the reaction carries the forces the extension met", () => {
    const { x, t, reactions } = rig("independent", "rca-calcified-uncrossable");
    expect(applyDeliveryAction(x, "load-device", (st) => setExtensionRod(takeExtension(setValve(pinWire(st, true), true), { french: 6, cylinderCm: 25 }), true))).toBe(true);
    // down the guide to its tip: free running, no load
    for (let i = 0; i < 100; i++) t.hand({ kind: "push", device: "balloon", mm: 10 });
    expect(x.st.guide.ext!.tipMm).toBeCloseTo(0, 6);
    expect(reactions[reactions.length - 1].requiredN).toBe(0);
    // over the bare wire into the bends until it backs the guide out
    for (let i = 0; i < 80 && x.st.counters.guideBackouts === 0 && x.st.guide.engaged; i++) t.hand({ kind: "push", device: "balloon", mm: 1 });
    expect(x.st.counters.guideBackouts).toBeGreaterThanOrEqual(1);
    const r = reactions[reactions.length - 1];
    expect(r.requiredN).toBeGreaterThan(r.backupN);
    expect(r.axial).toBeGreaterThan(0);
    expect(r.snap).toBe(true);
  });

  it("with the attending attached, as in the lab, inchworming, balloon-assisted tracking and the team's deep breath with the balloon up are not stopped", () => {
    for (const mode of ["guided", "independent"] as LaunchMode[]) {
      // balloon-assisted tracking: the balloon at nominal pressure, both advanced together
      {
        const { x, t } = rig(mode, "rca-calcified-uncrossable");
        attend(x);
        expect(straddle(x, DEVICE_BY_ID.sc.nominalAtm(2.0))).toBe(true);
        expect(x.st.device!.inflated || x.st.ind.fill > 0.05).toBe(true);
        setDeliveryHand(x, "together");
        const tip0 = x.st.guide.ext!.tipMm;
        const c0 = x.st.device!.centreMm;
        for (let i = 0; i < 5; i++) expect(t.hand({ kind: "push", device: "balloon", mm: 1 })).toBe(true);
        expect(x.st.guide.ext!.tipMm).toBeGreaterThan(tip0 + 4);
        expect(x.st.device!.centreMm - c0).toBeCloseTo(x.st.guide.ext!.tipMm - tip0, 6);
        // the deep breath is asked with the balloon still up
        expect(deepBreathByTeam(x)).toBe(true);
        expect(deliveryOf(x.st).support.map((o) => o.option)).toContain("deep-breath");
      }
      // inchworming: the extension on over the balloon as it deflates, while it is still partly full
      {
        const { x, t } = rig(mode, "rca-calcified-uncrossable");
        attend(x);
        expect(straddle(x, 7)).toBe(true);
        // the indeflator pulled to negative (an engine change applied here; the session's deflate() empties at once)
        expect(applyDeliveryAction(x, "load-device", (st) => stepPci(x.s as PciScenario, x.g, pullIndeflatorNegative(x.s as PciScenario, x.g, st), 0.2))).toBe(true);
        expect(x.st.ind.fill).toBeGreaterThan(0.05);
        setDeliveryHand(x, "extension");
        const tip0 = x.st.guide.ext!.tipMm;
        expect(t.hand({ kind: "push", device: "balloon", mm: 3 })).toBe(true);
        expect(x.st.guide.ext!.tipMm).toBeGreaterThan(tip0 + 2.5);
      }
    }
  });

  it("a guide push that seats the guide and a wire pull with the device out in the vessel are recorded as the deep seat and the partial wire withdrawal, once per series", () => {
    const { x, t } = rig("independent");
    expect(take(x, "sc", 2.0, 15)).toBe(true);
    // inside the guide: a wire pull is not a support option
    t.hand({ kind: "push", device: "balloon", mm: 1 });
    const tip0 = x.st.tipMm;
    t.hand({ kind: "push", device: "wire014", mm: -1 });
    expect(x.st.tipMm).toBeLessThan(tip0);
    expect(deliveryOf(x.st).support.map((o) => o.option)).not.toContain("partial-wire-withdrawal");
    for (let i = 0; i < 102; i++) t.hand({ kind: "push", device: "balloon", mm: 10 });
    expect(distalOf(x)).toBeGreaterThan(0);
    for (let i = 0; i < 3; i++) t.hand({ kind: "push", device: "wire014", mm: -1 });
    expect(deliveryOf(x.st).support.filter((o) => o.option === "partial-wire-withdrawal")).toHaveLength(1);
    const depth0 = x.st.guide.depthMm;
    for (let i = 0; i < 3; i++) t.hand({ kind: "push", device: "catheter", mm: 0.5 });
    const seats = deliveryOf(x.st).support.filter((o) => o.option === "deep-seat");
    expect(seats).toHaveLength(x.st.guide.depthMm > depth0 ? 1 : 0);
    expect(x.st.guide.depthMm).toBeGreaterThan(depth0);
  });

  it("with the attending attached, the device is brought back after the guide has backed out", () => {
    const { x, t } = rig("guided");
    attend(x);
    expect(take(x, "des", 3.0, 22)).toBe(true);
    t.hand({ kind: "pin", device: "wire014", on: true });
    t.hand({ kind: "push", device: "stent", mm: 1 });
    for (let i = 0; i < 99; i++) t.hand({ kind: "push", device: "stent", mm: 10 });
    // screened out of the guide tip and against the lesion
    x.pressPedal("fluoro", true);
    x.step(0.1);
    expect(x.beamMode()).not.toBeNull();
    for (let i = 0; i < 120 && x.st.counters.guideBackouts === 0; i++) t.hand({ kind: "push", device: "stent", mm: 1 });
    expect(x.st.counters.guideBackouts).toBeGreaterThanOrEqual(1);
    const d0 = distalOf(x);
    // guide-backout-ignored stops pushing on, not the pull it advises
    expect(t.hand({ kind: "push", device: "stent", mm: -5 })).toBe(true);
    expect(distalOf(x)).toBeCloseTo(d0 - 5, 6);
  });

  it("the support console shows read-outs and settings, and the share of back-up only in guided practice", () => {
    for (const mode of ["guided", "independent"] as LaunchMode[]) {
      const { x, t } = rig(mode);
      take(x, "des", 3.0, 22);
      t.hand({ kind: "pin", device: "wire014", on: true });
      t.hand({ kind: "push", device: "stent", mm: 1 });
      for (let i = 0; i < 100; i++) t.hand({ kind: "push", device: "stent", mm: 10 });
      for (let i = 0; i < 80 && x.st.counters.guideBackouts === 0; i++) t.hand({ kind: "push", device: "stent", mm: 1 });
      const html = renderToStaticMarkup(createElement(SupportConsole, { session: x }));
      expect(html).toContain("What the right hand moves");
      expect(html).toContain("90 cm and 100 cm marks past the valve");
      expect(html).toContain("wire pinned");
      // no hand action on screen: the device is pushed and pulled by the hands, not by buttons
      expect(html).not.toMatch(/>\s*(Advance|Withdraw|Push|Pull)\b/);
      // no forces, depths or lesion facts outside guided practice
      expect(html.includes("of the guide&#x27;s back-up")).toBe(mode === "guided");
      expect(html).not.toMatch(/depth|coaxial|stenosis|\bN\b/);
    }
  });
});
