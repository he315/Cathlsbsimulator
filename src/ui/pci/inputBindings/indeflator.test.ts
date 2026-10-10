// pci-indeflator: the indeflator's hand actions are bound by src/ui/pci/inputBindings/indeflator.ts and reachable
// through the PCI input target with no console open: the hands turn the screw in (the pressure rises over seconds
// at the screw rate as the lab's procedure clock runs), lock the plunger (the pressure holds), and pull negative
// (the balloon empties over seconds). The indeflator console registers and its file exports only meta and the
// component; it offers the screw rate as its setting and drives the same handlers.
//   npx vitest run src/ui/pci/inputBindings/indeflator.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { PciLabSession } from "../PciLabSession";
import { PciInputTarget } from "../pciInputTarget";
import { resolvePciLaunch } from "../launch";
import { createInputSystem } from "../../../input/system";
import { defaultSettings, pciGripOrder, pciSettings } from "../../../input/settings";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { loadDevice, moveDevice } from "../../../simulation/angioPci";
import { PCI_INPUT_BINDINGS, bindingFor, boundPairs } from "./index";
import { DEFAULT_SCREW_RATE, applyIndeflatorAction, binding, screwRate, setScrewRate } from "./indeflator";
import { inflationOf } from "../../../simulation/pci/state";
import { meta as consoleMeta } from "../consoles/IndeflatorConsole";
import { pciConsoles } from "../consoles/registry";

const sessions: PciLabSession[] = [];
const targets: PciInputTarget[] = [];
afterEach(() => {
  for (const t of targets.splice(0)) t.dispose();
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

/** lad-focal opened at 'wire across', a balloon on the lesion, and an input target. */
function rig() {
  const r = resolvePciLaunch({ scenario: "lad-focal", start: "wire-across", mode: "supervised" });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
  sessions.push(x);
  const sys = createInputSystem({ storage: null, settings: pciSettings(defaultSettings()), gripOrder: pciGripOrder(null), initialGrip: "wire014", getPads: () => [] });
  const t = new PciInputTarget(x, sys);
  targets.push(t);
  expect(
    applyIndeflatorAction(x, "inflate", (st) => {
      const s = loadDevice(st, "balloon", "semi-compliant", 2.5, 12);
      return moveDevice(s, x.g.lesion.centreMm - s.device!.centreMm);
    })
  ).toBe(true);
  return { x, t };
}

function runLab(x: PciLabSession, seconds: number) {
  for (let t = 0; t < seconds - 1e-9; t += 0.05) x.step(0.05);
}

describe("indeflator hand bindings (pci-indeflator)", () => {
  it("the binding file declares the indeflator's inflate (screw), aspirate (negative pull) and pin (lock), and the console is registered", () => {
    expect(binding.device).toBe("indeflator");
    for (const a of ["inflate", "aspirate", "pin"] as const) {
      expect(bindingFor(PCI_INPUT_BINDINGS, "indeflator", a)?.file).toBe("./indeflator.ts");
      expect(boundPairs(PCI_INPUT_BINDINGS)).toContain(`indeflator:${a}`);
    }
    expect(pciConsoles().some((c) => c.id === consoleMeta.id)).toBe(true);
  });

  it("drives the indeflator through the input target with the console closed: the screw inflates over seconds, the lock holds, the pull empties", () => {
    const { x, t } = rig();
    expect(screwRate(x)).toBe(DEFAULT_SCREW_RATE);
    // turn the screw in by 10 atm: the target is set and the pressure follows over seconds
    expect(t.perform("indeflator", "inflate", 10)).toBe(true);
    expect(x.st.ind.target).toBeCloseTo(10, 6);
    expect(x.st.ind.atm).toBeLessThan(1);
    runLab(x, 1.5);
    expect(x.st.ind.atm).toBeGreaterThan(1);
    expect(x.st.ind.atm).toBeLessThan(10);
    runLab(x, 4);
    expect(x.st.ind.atm).toBeCloseTo(10, 6);
    expect(x.st.device!.inflated).toBe(true);
    // turn it out by 2: the pressure comes down, the balloon stays full
    expect(t.perform("indeflator", "inflate", -2)).toBe(true);
    runLab(x, 2);
    expect(x.st.ind.atm).toBeCloseTo(8, 6);
    // lock: the screw does not turn and the plunger cannot be pulled; the pressure holds
    expect(t.perform("indeflator", "pin", 1)).toBe(true);
    expect(x.st.ind.locked).toBe(true);
    // the refused screw turn and pull report false, so the input layer does not claim they were taken
    expect(t.perform("indeflator", "inflate", 4)).toBe(false);
    expect(t.perform("indeflator", "aspirate", 1)).toBe(false);
    t.perform("indeflator", "aspirate", 0);
    expect(x.st.ind.target).toBeCloseTo(8, 6);
    runLab(x, 2);
    expect(x.st.ind.atm).toBeCloseTo(8, 6);
    expect(x.st.ind.negative).toBe(false);
    // unlock and pull negative (one pull per press): the balloon empties over seconds
    expect(t.perform("indeflator", "pin", 0)).toBe(true);
    expect(t.perform("indeflator", "aspirate", 1)).toBe(true);
    expect(x.st.ind.negative).toBe(true);
    runLab(x, 1);
    expect(x.st.ind.fill).toBeGreaterThan(0);
    runLab(x, 20);
    expect(x.st.ind.fill).toBe(0);
    expect(x.st.device!.inflated).toBe(false);
    // the inflation was applied to the lesion at its peak pressure
    expect(x.st.device!.appliedAtm).toBeCloseTo(10, 6);
    expect(x.st.predilated).toBe(true);
  });

  it("a cutting balloon screwed in 1 atm at a time at 3 atm/s breaks the cutting-balloon rule once per inflation, not once per tick", () => {
    const { x, t } = rig();
    // the balloon on the lesion made a cutting balloon (its label: about 1 atm every 5 s, not above 12 atm)
    expect(applyIndeflatorAction(x, "inflate", (st) => ({ ...st, device: { ...st.device!, specId: "cutting", balloon: "scoring" } }))).toBe(true);
    setScrewRate(x, 3);
    // four ticks before the balloon has filled (one inflation), then four more as the pressure rises
    for (let i = 0; i < 4; i++) expect(t.perform("indeflator", "inflate", 1)).toBe(true);
    for (let i = 0; i < 4; i++) {
      expect(t.perform("indeflator", "inflate", 1)).toBe(true);
      runLab(x, 0.35);
    }
    expect(x.st.ind.target).toBeCloseTo(8, 6);
    expect(inflationOf(x.st).cuttingRuleBreaches).toBe(1);
    expect(x.st.log.filter((e) => e.kind === "cutting-balloon-rule")).toHaveLength(1);
    expect(x.st.log.filter((e) => e.kind === "inflate-start")).toHaveLength(1);
    // a second inflation after the balloon has emptied is a second breach
    runLab(x, 3);
    expect(t.perform("indeflator", "aspirate", 1)).toBe(true);
    t.perform("indeflator", "aspirate", 0);
    runLab(x, 20);
    expect(x.st.ind.fill).toBe(0);
    expect(t.perform("indeflator", "inflate", 2)).toBe(true);
    expect(inflationOf(x.st).cuttingRuleBreaches).toBe(2);
  });

  it("the screw rate is the console's setting: a slower rate takes longer to the same pressure", () => {
    const time = (rate: number) => {
      const { x, t } = rig();
      setScrewRate(x, rate);
      t.perform("indeflator", "inflate", 8);
      let s = 0;
      while (x.st.ind.atm < 8 - 1e-6 && s < 30) {
        x.step(0.05);
        s += 0.05;
      }
      return s;
    };
    expect(time(1)).toBeGreaterThan(time(4) + 3);
  });

  it("with no balloon or stent on the wire the indeflator's actions are not taken", () => {
    const r = resolvePciLaunch({ scenario: "lad-focal", start: "wire-across", mode: "supervised" });
    const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
    sessions.push(x);
    const sys = createInputSystem({ storage: null, settings: pciSettings(defaultSettings()), gripOrder: pciGripOrder(null), initialGrip: "wire014", getPads: () => [] });
    const t = new PciInputTarget(x, sys);
    targets.push(t);
    expect(t.perform("indeflator", "inflate", 6)).toBe(false);
    expect(t.perform("indeflator", "pin", 1)).toBe(false);
    expect(x.st.ind.target).toBe(0);
  });
});
