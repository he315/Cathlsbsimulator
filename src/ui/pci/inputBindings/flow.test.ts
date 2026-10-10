// pci-flow-closure: the intracoronary drug syringe's hand actions are bound by src/ui/pci/inputBindings/flow.ts on
// the manifold syringe the hands already hold (device 'syringe') and reachable through the PCI input target with the
// flow console closed: the console's settings say what is drawn up and where the drug syringe is connected; a push
// with a dose drawn up gives it (into the guide or through the microcatheter) and empties the syringe, so the next
// push is contrast; a hard saline push with air in the vessel is the forceful injection; drawing back aspirates the
// guide and checks the manifold. Each dose reaches the procedure record and the patient engine. The console shows
// read-outs and settings only.
//   npx vitest run src/ui/pci/inputBindings/flow.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PciLabSession, policyForMode } from "../PciLabSession";
import { PciInputTarget } from "../pciInputTarget";
import { resolvePciLaunch } from "../launch";
import { createInputSystem } from "../../../input/system";
import { defaultSettings, pciGripOrder, pciSettings } from "../../../input/settings";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { applyFlowStart } from "../../../simulation/pci/actions/bailouts";
import { loadMicrocatheter } from "../../../simulation/pci/actions/wire";
import { timiFor } from "../../../simulation/complications/noReflow";
import type { PciState } from "../../../simulation/pci/state";
import { PCI_INPUT_BINDINGS, bindingFor } from "./index";
import { binding, icSyringe, injectIcDrug, setIcSyringe } from "./flow";
import FlowConsole, { meta as consoleMeta } from "../consoles/FlowConsole";
import { pciConsoles } from "../consoles/registry";
import type { LaunchMode } from "../../../content/schema";

const sessions: PciLabSession[] = [];
const targets: PciInputTarget[] = [];
afterEach(() => {
  for (const t of targets.splice(0)) t.dispose();
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

/** A flow start (default lcx-stemi at no-reflow, applied as the lab's start line will apply it), with an input target. */
function rig(mode: LaunchMode = "supervised", scenario = "lcx-stemi", variant = "no-reflow") {
  const r = resolvePciLaunch({ scenario, start: "wire-across", variant, mode });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true, mode, policy: policyForMode(mode) });
  sessions.push(x);
  const update = (f: (st: PciState) => PciState) => (x as unknown as { update(f: (st: PciState) => PciState): void }).update.call(x, f);
  update((st) => applyFlowStart(x.s, x.g, st, { variant, start: "wire-across" }));
  const sys = createInputSystem({ storage: null, settings: pciSettings(defaultSettings()), gripOrder: pciGripOrder(null), initialGrip: "wire014", getPads: () => [] });
  const t = new PciInputTarget(x, sys);
  targets.push(t);
  return { x, t, update };
}

const press = (t: PciInputTarget, action: "inject" | "flush" | "aspirate", v = 1) => {
  expect(t.perform("syringe", action, v)).toBe(true);
  t.perform("syringe", action, 0);
};
/** Draw up a dose (the console's setting). */
const drawUp = (x: PciLabSession, agent: "adenosine" | "nicardipine", doseUg: number, route: "guide" | "microcatheter") => setIcSyringe(x, { agent, doseUg, route });
const doses = (st: PciState) => st.log.filter((r) => r.kind === "ic-drug");
const timi = (st: PciState) => timiFor(st.cx.list.find((c) => c.kind === "no-reflow")!.severity);

describe("intracoronary drug syringe hand bindings (pci-flow-closure)", () => {
  it("the binding file declares the manifold syringe's inject, flush and aspirate, and the console is registered", () => {
    expect(binding.device).toBe("syringe");
    for (const a of ["inject", "flush", "aspirate"] as const) expect(bindingFor(PCI_INPUT_BINDINGS, "syringe", a)?.file).toBe("./flow.ts");
    expect(pciConsoles().some((c) => c.id === consoleMeta.id)).toBe(true);
  });

  it("drives the syringe through the input target with the console closed: a dose into the guide, then the same dose through the microcatheter", () => {
    const { x, t, update } = rig();
    expect(x.openConsoleId()).toBeNull();
    const give = vi.spyOn(x.engine, "giveDrug");
    const contrast = vi.spyOn(x, "inject");
    // nothing drawn up: the push is the contrast injection (the built-in route), no drug
    t.perform("syringe", "inject", 1);
    t.perform("syringe", "inject", 0);
    expect(doses(x.st)).toHaveLength(0);
    expect(contrast).toHaveBeenCalledTimes(1);
    // the console's settings: adenosine 100 µg on the guide manifold; the push gives it, not contrast
    drawUp(x, "adenosine", 100, "guide");
    press(t, "inject");
    expect(contrast).toHaveBeenCalledTimes(1);
    expect(doses(x.st)).toHaveLength(1);
    expect(doses(x.st)[0].data).toMatchObject({ agent: "adenosine", doseUg: 100, route: "guide", distal: false });
    expect(give).toHaveBeenCalledWith("adenosine", 100, "ic", expect.objectContaining({ side: "left" }));
    expect(timi(x.st)).toBe("TIMI 0");
    // the syringe is empty now: the next push is contrast again
    expect(icSyringe(x)).toEqual({ agent: "adenosine", doseUg: 0, route: "guide" });
    t.perform("syringe", "inject", 1);
    t.perform("syringe", "inject", 0);
    expect(doses(x.st)).toHaveLength(1);
    expect(contrast).toHaveBeenCalledTimes(2);
    // one dose per press: a held plunger does not repeat it
    drawUp(x, "adenosine", 100, "guide");
    t.perform("syringe", "inject", 1);
    t.perform("syringe", "inject", 1);
    t.perform("syringe", "inject", 0);
    expect(doses(x.st)).toHaveLength(2);
    expect(contrast).toHaveBeenCalledTimes(2);
    // connected to the microcatheter hub with no microcatheter out: refused (the function says so), nothing reaches the
    // engine, the dose stays drawn up and no contrast goes in instead
    drawUp(x, "adenosine", 100, "microcatheter");
    const calls = give.mock.calls.length;
    expect(injectIcDrug(x)).toBe(false);
    press(t, "inject");
    expect(doses(x.st)).toHaveLength(2);
    expect(give.mock.calls.length).toBe(calls);
    expect(contrast).toHaveBeenCalledTimes(2);
    expect(icSyringe(x).doseUg).toBe(100);
    // a microcatheter put on the wire and advanced by hand (its own binding), then the same dose distally
    update((st) => loadMicrocatheter(st, "mc-large"));
    expect(t.perform("microcatheter", "advance", 400)).toBe(true);
    expect(x.st.wire.micro!.tipMm).toBeGreaterThan(x.g.lesion.startMm);
    press(t, "inject");
    expect(doses(x.st)).toHaveLength(3);
    expect(doses(x.st)[2].data).toMatchObject({ route: "microcatheter", distal: true });
    expect(timi(x.st)).not.toBe("TIMI 0");
    expect(icSyringe(x)).toEqual({ agent: "adenosine", doseUg: 0, route: "microcatheter" });
  });

  it("with air in the vessel a hard saline push is the forceful injection and drawing back aspirates the guide and checks the manifold", () => {
    const { x, t } = rig("supervised", "rca-calcified", "air-rca");
    expect(x.st.cx.list.some((c) => c.kind === "air" && c.stage !== "resolved")).toBe(true);
    const flush = vi.spyOn(x, "flushGuide");
    const aspirate = vi.spyOn(x, "aspirate");
    const bailouts = (a: string) => x.st.log.filter((r) => r.kind === "bailout" && r.data.action === a).length;
    // a gentle flush is only the flush
    press(t, "flush", 0.3);
    expect(flush).toHaveBeenCalledTimes(1);
    expect(bailouts("forceful-saline")).toBe(0);
    // a push that builds up to a hard one: one forceful injection in the press, and the flush still runs
    t.perform("syringe", "flush", 0.2);
    t.perform("syringe", "flush", 0.7);
    t.perform("syringe", "flush", 0.9);
    t.perform("syringe", "flush", 0);
    expect(bailouts("forceful-saline")).toBe(1);
    expect(flush).toHaveBeenCalledTimes(2);
    press(t, "aspirate");
    expect(aspirate).toHaveBeenCalledTimes(1);
    expect(bailouts("aspirate-guide")).toBe(1);
    expect(x.st.log.some((r) => r.kind === "manifold-check")).toBe(true);
  });

  it("without air, flushing and drawing back are the manifold's own actions only", () => {
    const { x, t } = rig();
    const flush = vi.spyOn(x, "flushGuide");
    const aspirate = vi.spyOn(x, "aspirate");
    press(t, "flush");
    press(t, "aspirate");
    expect(flush).toHaveBeenCalledTimes(1);
    expect(aspirate).toHaveBeenCalledTimes(1);
    expect(x.st.log.some((r) => r.kind === "bailout")).toBe(false);
    expect(x.st.log.some((r) => r.kind === "manifold-check")).toBe(false);
  });

  it("the console shows read-outs and settings only; the dose ranges only in guided practice", () => {
    const { x } = rig("supervised");
    setIcSyringe(x, { agent: "nicardipine", doseUg: 200, route: "guide" });
    const html = renderToStaticMarkup(createElement(FlowConsole, { session: x }));
    expect(html).not.toMatch(/<button/);
    expect(html).toMatch(/Nicardipine 200 µg, on the guide manifold/);
    expect(html).not.toMatch(/Teaching aid/);
    // nothing on it grades or names the flow
    expect(html).not.toMatch(/TIMI|reflow|thromb|embol/i);
    const g = rig("guided").x;
    setIcSyringe(g, { agent: "nicardipine", doseUg: 200, route: "guide" });
    expect(renderToStaticMarkup(createElement(FlowConsole, { session: g }))).toMatch(/Teaching aid: Nicardipine: Brilakis 100–300 µg/);
  });
});
