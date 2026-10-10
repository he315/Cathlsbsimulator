// pci-wire-microcatheter: the microcatheter's hand actions are bound by src/ui/pci/inputBindings/wire.ts and
// reachable through the PCI input target with no console open: the wire is advanced and torqued by the
// hands (wire014, the target's built-in route to the same engine actions), the microcatheter advanced,
// withdrawn and rotated, the syringe on its hub pulled for a backflow check and pushed for an injection.
//   npx vitest run src/ui/pci/inputBindings/wire.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { PciLabSession } from "../PciLabSession";
import { PciInputTarget } from "../pciInputTarget";
import { createInputSystem } from "../../../input/system";
import { defaultSettings, pciGripOrder, pciSettings } from "../../../input/settings";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { loadMicrocatheter } from "../../../simulation/pci/actions/wire";
import { wiringOf } from "../../../simulation/pci/state";
import { PCI_INPUT_BINDINGS, bindingFor, boundPairs } from "./index";
import { applyWireAction, binding } from "./wire";

const sessions: PciLabSession[] = [];
const targets: PciInputTarget[] = [];
afterEach(() => {
  for (const t of targets.splice(0)) t.dispose();
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function rig() {
  const x = new PciLabSession({ scenarioId: "lad-focal", team: false, headlessFrames: true });
  sessions.push(x);
  const sys = createInputSystem({ storage: null, settings: pciSettings(defaultSettings()), gripOrder: pciGripOrder(null), initialGrip: "wire014", getPads: () => [] });
  const t = new PciInputTarget(x, sys);
  targets.push(t);
  return { x, t };
}

describe("microcatheter hand bindings (pci-wire-microcatheter)", () => {
  it("the binding file declares the microcatheter's advance, withdraw, torque, inject and aspirate", () => {
    expect(binding.device).toBe("microcatheter");
    for (const a of ["advance", "withdraw", "torque", "inject", "aspirate"] as const) {
      expect(bindingFor(PCI_INPUT_BINDINGS, "microcatheter", a)?.file).toBe("./wire.ts");
      expect(boundPairs(PCI_INPUT_BINDINGS)).toContain(`microcatheter:${a}`);
    }
  });

  it("drives the wire and the microcatheter through the input target with the console closed", () => {
    const { x, t } = rig();
    expect(x.engageGuide()).toBe(true);
    // the wire by hand: advance and torque (wire014, the target's own route to moveWire and torqueWire)
    const tip0 = x.st.wire.tip;
    expect(t.perform("wire014", "torque", 0.6)).toBe(true);
    for (let i = 0; i < 30; i++) expect(t.perform("wire014", "advance", 2)).toBe(true);
    expect(x.st.tipMm).toBeGreaterThan(20);
    expect(x.st.wire.tip).not.toBe(tip0);
    // no microcatheter yet: its hand actions are not taken
    expect(t.perform("microcatheter", "advance", 5)).toBe(false);
    // loading it is a setting (the console's); the hands do the rest
    expect(applyWireAction(x, "load-device", (st) => loadMicrocatheter(st, "mc-large"))).toBe(true);
    expect(x.st.wire.micro?.tipMm).toBeLessThan(0);
    for (let i = 0; i < 20; i++) t.perform("microcatheter", "advance", 5);
    const mcTip = x.st.wire.micro!.tipMm;
    expect(mcTip).toBeGreaterThan(10);
    expect(mcTip).toBeLessThan(x.st.tipMm);
    expect(t.perform("microcatheter", "withdraw", 4)).toBe(true);
    expect(x.st.wire.micro!.tipMm).toBeCloseTo(mcTip - 4, 6);
    expect(t.perform("microcatheter", "torque", Math.PI)).toBe(true);
    expect(x.st.wire.micro!.turns).toBeCloseTo(0.5, 6);
    // the syringe on its hub: a pull checks for backflow, a push injects (once per press)
    expect(t.perform("microcatheter", "aspirate", 0.6)).toBe(true);
    expect(x.st.wire.micro!.backflowAt).not.toBeNull();
    t.perform("microcatheter", "aspirate", 0);
    const ml = x.st.contrastMl;
    expect(t.perform("microcatheter", "inject", 0.7)).toBe(true);
    expect(t.perform("microcatheter", "inject", 0.8)).toBe(true);
    expect(x.st.contrastMl).toBeGreaterThan(ml);
    expect(wiringOf(x.st).microInjection).not.toBeNull();
    expect(wiringOf(x.st).uncheckedMicroInjections).toBe(0);
    const once = x.st.contrastMl;
    t.perform("microcatheter", "inject", 0);
    t.perform("microcatheter", "inject", 0.7);
    expect(x.st.contrastMl).toBeGreaterThan(once);
    // no console was opened for any of it
    expect(x.openConsoleId()).toBeNull();
  });

  it("the attending's safety stop applies to the microcatheter as to the wire", () => {
    const { x, t } = rig();
    x.engageGuide();
    for (let i = 0; i < 20; i++) t.perform("wire014", "advance", 2);
    applyWireAction(x, "load-device", (st) => loadMicrocatheter(st, "mc-small"));
    const before = x.st.wire.micro!.tipMm;
    x.beforeAction = (a) => a !== "advance-wire";
    expect(t.perform("microcatheter", "advance", 5)).toBe(false);
    expect(x.st.wire.micro!.tipMm).toBe(before);
  });

  it("the session's action entry is still there, and a session without one fails loudly in development", () => {
    // applyWireAction reaches PciLabSession's act() until the session offers a public applyWireAction
    const proto = PciLabSession.prototype as unknown as { act?: unknown; applyWireAction?: unknown };
    expect(typeof proto.applyWireAction === "function" || typeof proto.act === "function").toBe(true);
    const { x } = rig();
    expect(applyWireAction(x, "load-device", (st) => loadMicrocatheter(st, "mc-small"))).toBe(true);
    expect(x.st.wire.micro).toBeTruthy();
    const bare = { s: x.s, g: x.g, st: x.st };
    expect(() => applyWireAction(bare, "load-device", (st) => st)).toThrow(/applyWireAction/);
  });
});
