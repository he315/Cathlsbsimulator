// pci-intravascular-imaging: the imaging catheter's hand actions are bound by src/ui/pci/inputBindings/imaging.ts
// and reachable through the PCI input target with no console open: the hands advance the catheter along the
// wire (it stops at the tight lesion until it is predilated), pull it back, hold it, and push the OCT flush,
// whose volume appears in the session's contrast total. The console offers settings and read-outs only.
//   npx vitest run src/ui/pci/inputBindings/imaging.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { PciLabSession } from "../PciLabSession";
import { PciInputTarget } from "../pciInputTarget";
import { resolvePciLaunch } from "../launch";
import { createInputSystem } from "../../../input/system";
import { defaultSettings, pciGripOrder, pciSettings } from "../../../input/settings";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { deflate, inflate, loadDevice, moveDevice, removeDevice } from "../../../simulation/angioPci";
import { armOct, calibrateImaging, loadImaging, purgeImaging } from "../../../simulation/pci/actions/imaging";
import { PCI_INPUT_BINDINGS, bindingFor, boundPairs } from "./index";
import { applyImagingAction, binding, flushSettings, setFlushSettings } from "./imaging";
import { meta as consoleMeta } from "../consoles/ImagingConsole";
import { pciConsoles } from "../consoles/registry";

const sessions: PciLabSession[] = [];
const targets: PciInputTarget[] = [];
afterEach(() => {
  for (const t of targets.splice(0)) t.dispose();
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

/** lad-focal opened at 'wire across', with an input target. */
function rig() {
  const r = resolvePciLaunch({ scenario: "lad-focal", start: "wire-across", mode: "supervised" });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
  sessions.push(x);
  const sys = createInputSystem({ storage: null, settings: pciSettings(defaultSettings()), gripOrder: pciGripOrder(null), initialGrip: "wire014", getPads: () => [] });
  const t = new PciInputTarget(x, sys);
  targets.push(t);
  return { x, t };
}

/** Predilate the lesion so the imaging catheter can cross (the assisted path). */
function predilate(x: PciLabSession) {
  const L = x.g.lesion;
  expect(applyImagingAction(x, "load-device", (st) => {
    let s = loadDevice(st, "balloon", "semi-compliant", 2.5, 12);
    s = moveDevice(s, L.centreMm - s.device!.centreMm);
    return removeDevice(deflate(inflate(x.s, x.g, s, 10)));
  })).toBe(true);
}

describe("imaging catheter hand bindings (pci-intravascular-imaging)", () => {
  it("the binding file declares the imaging catheter's advance, withdraw, pin and flush, and the console is registered", () => {
    expect(binding.device).toBe("ivus");
    for (const a of ["advance", "withdraw", "pin", "flush"] as const) {
      expect(bindingFor(PCI_INPUT_BINDINGS, "ivus", a)?.file).toBe("./imaging.ts");
      expect(boundPairs(PCI_INPUT_BINDINGS)).toContain(`ivus:${a}`);
    }
    expect(pciConsoles().some((c) => c.id === consoleMeta.id)).toBe(true);
  });

  it("drives the imaging catheter through the input target with the console closed: it stops at the tight lesion, crosses once predilated, and pulls back", () => {
    const { x, t } = rig();
    const L = x.g.lesion;
    expect(x.st.tipMm).toBeGreaterThan(L.endMm);
    // no imaging catheter: its hand actions are not taken by the binding
    expect(bindingFor(PCI_INPUT_BINDINGS, "ivus", "advance")!.handler({ session: x, reaction: () => undefined }, 2)).toBe(false);
    // taking it onto the wire is a setting (the console's); the hands do the rest
    expect(applyImagingAction(x, "load-device", (st) => loadImaging(st, "ivus"))).toBe(true);
    for (let i = 0; i < 80; i++) t.perform("ivus", "advance", 2);
    expect(x.st.device!.centreMm).toBeLessThan(L.endMm);
    expect(x.st.ivus!.acq!.stoppedAtMm).not.toBeNull();
    // out, predilate, and in again
    expect(applyImagingAction(x, "remove-device", (st) => removeDevice(st))).toBe(true);
    predilate(x);
    expect(applyImagingAction(x, "load-device", (st) => loadImaging(st, "ivus"))).toBe(true);
    for (let i = 0; i < 80 && x.st.device!.centreMm < L.endMm + 10; i++) expect(t.perform("ivus", "advance", 2)).toBe(true);
    expect(x.st.device!.centreMm).toBeGreaterThan(L.endMm);
    const at = x.st.device!.centreMm;
    expect(t.perform("ivus", "withdraw", 4)).toBe(true);
    expect(x.st.device!.centreMm).toBeCloseTo(at - 4, 6);
    expect(t.perform("ivus", "pin", 1)).toBe(true);
    expect(x.st.ivus!.acq!.held).toBe(true);
    // no console was opened for any of it
    expect(x.openConsoleId()).toBeNull();
  });

  it("the OCT flush pushed by hand appears in the session's contrast total (and in the procedure's)", () => {
    const { x, t } = rig();
    const L = x.g.lesion;
    predilate(x);
    expect(applyImagingAction(x, "load-device", (st) => calibrateImaging(purgeImaging(purgeImaging(loadImaging(st, "oct"), "start"), "end")))).toBe(true);
    for (let i = 0; i < 80 && x.st.device!.centreMm < L.endMm + 30; i++) t.perform("ivus", "advance", 2);
    t.perform("ivus", "pin", 1);
    setFlushSettings(x, { injector: false, rateMlS: 4, durationS: 4 });
    expect(flushSettings(x).rateMlS).toBe(4);
    applyImagingAction(x, "load-device", (st) => armOct(st));
    const session0 = x.snapshot().contrastMl;
    const state0 = x.st.contrastMl;
    expect(t.perform("ivus", "flush", 0.8)).toBe(true);
    // one flush per press
    expect(t.perform("ivus", "flush", 0.9)).toBe(true);
    expect(x.st.log.filter((r) => r.kind === "imaging-flush")).toHaveLength(1);
    expect(x.snapshot().contrastMl).toBeCloseTo(session0 + 16, 1);
    expect(x.st.contrastMl).toBeCloseTo(state0 + 16, 6);
    expect(x.st.ivus!.active).toBe(true);
    // the run ends of itself; a later guide injection books the syringe total, the flush included
    for (let i = 0; i < 40; i++) x.step(0.1);
    expect(x.st.ivus!.active).toBe(false);
    t.perform("ivus", "flush", 0);
    expect(x.inject({})).toBe(true);
    for (let i = 0; i < 120; i++) x.step(0.1);
    expect(x.st.contrastMl).toBeGreaterThanOrEqual(Math.round(session0 + 16));
    expect(x.snapshot().contrastMl).toBeGreaterThan(session0 + 16);
  });

  it("the attending's safety stop applies to the imaging catheter", () => {
    const { x, t } = rig();
    predilate(x);
    applyImagingAction(x, "load-device", (st) => loadImaging(st, "ivus"));
    const before = x.st.device!.centreMm;
    x.beforeAction = (a) => a !== "advance-device";
    // the binding is refused; the target's own route for the slot (the assisted move) is refused too
    expect(bindingFor(PCI_INPUT_BINDINGS, "ivus", "advance")!.handler({ session: x, reaction: () => undefined }, 2)).toBe(false);
    t.perform("ivus", "advance", 2);
    expect(x.st.device!.centreMm).toBe(before);
    x.beforeAction = null;
    expect(t.perform("ivus", "advance", 2)).toBe(true);
    expect(x.st.device!.centreMm).toBeGreaterThan(before);
  });
});
