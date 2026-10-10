// pci-antithrombotic-orders: the drugs console shows the ACT machine (generic name), the last ACT and the
// time since the last dose, the patient's weight and creatinine clearance; the ACT target and the dose
// calculations appear only in guided practice; the HIT variant shows the platelet trend, the 4Ts form,
// the antibody order and the flush setting; the console is registered.
//   npx vitest run src/ui/pci/consoles/DrugsConsole.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PciLabSession } from "../PciLabSession";
import { resolvePciLaunch } from "../launch";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { applyDeliveryAction } from "../inputBindings/support";
import { declareAntithrombotic, giveProtamine, protamineReactionsOf, recordAct } from "../../../simulation/pci/actions/drugs";
import { pciTipContext } from "../../lab/pciTips";
import { pciConsoles } from "./registry";
import DrugsConsole, { MP_PROTAMINE_PORTION_S, declareRunContext, deliverProtamine, driveProtamineReaction, meta } from "./DrugsConsole";
import { antithromboticContextOf } from "../../../simulation/pci/actions/drugs";
import type { LaunchMode } from "../../../content/schema";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function open(mode: LaunchMode, variant: string) {
  const r = resolvePciLaunch({ scenario: "lad-focal", variant, start: "guide-engaged", mode });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
  sessions.push(x);
  // what the console's effect declares on mount (effects do not run in a static render)
  applyDeliveryAction(x, "drug", (s) => declareAntithrombotic(s, { actDevice: "hemochron", hit: variant === "hit-bivalirudin" }));
  return x;
}

const html = (x: PciLabSession) => renderToStaticMarkup(createElement(DrugsConsole, { session: x }));

describe("DrugsConsole (pci-antithrombotic-orders)", () => {
  it("is registered with a generic label", () => {
    expect(meta).toMatchObject({ id: "drugs", label: "Drugs and ACT" });
    expect(pciConsoles().some((c) => c.id === "drugs")).toBe(true);
  });

  it("shows the machine by a generic name and the ACT read-outs; the target only in guided practice", () => {
    const sup = open("supervised", "hemochron");
    applyDeliveryAction(sup, "drug", (s) => recordAct(s, 287));
    const h = html(sup);
    expect(h).toContain("Higher-reading ACT machine");
    expect(h).toContain("287 s");
    expect(h).toContain(`${sup.engine.profile.renal.crclMlMin} mL/min`);
    expect(h).not.toContain("Hemochron");
    expect(h).not.toContain("Teaching aid");
    expect(h).not.toContain("300-350");
    const gd = html(open("guided", "hemochron"));
    expect(gd).toContain("Teaching aid: target 300-350 s");
    expect(gd).toContain("Teaching values");
  });

  it("the HIT variant shows the platelet trend, the 4Ts form, the antibody order and the flush setting", () => {
    const h = html(open("independent", "hit-bivalirudin"));
    expect(h).toContain("230 × 10⁹/L");
    expect(h).toContain("98 × 10⁹/L");
    expect(h).toContain("4Ts pretest probability");
    expect(h).toContain("Send HIT antibody test");
    expect(h).toContain("Heparin-free saline");
    expect(html(open("independent", "hemochron"))).not.toContain("4Ts");
  });
  it("outside guided practice every dose field starts empty; in guided practice they start at the sourced regimen", () => {
    const numbers = (h: string) => [...h.matchAll(/<input type="number"[^>]*?value="([^"]*)"/g)].map((m) => m[1]);
    for (const mode of ["supervised", "independent"] as const) {
      const h = html(open(mode, "hemochron"));
      const vals = numbers(h);
      expect(vals.length, mode).toBeGreaterThanOrEqual(8);
      expect(vals.every((v) => v === ""), `${mode}: ${vals.join(",")}`).toBe(true);
      for (const v of ['value="180"', 'value="1.75"', 'value="0.75"', 'value="600"', 'value="10"']) expect(h, `${mode} ${v}`).not.toContain(v);
    }
    const gd = numbers(html(open("guided", "hemochron")));
    expect(gd).toEqual(expect.arrayContaining(["0.75", "1.75", "180", "2", "600", "10"]));
  });

  it("a drawn protamine reaction driven on the engine raises 'hypotension' in the lab after its onset", () => {
    const x = open("independent", "hemochron");
    for (let i = 0; i < 8; i++) x.step(0.25);
    // a fast dose with risk factors, repeated until the session's generator draws a reaction
    for (let i = 0; i < 30 && protamineReactionsOf(x.st).length === 0; i++) applyDeliveryAction(x, "drug", (s) => giveProtamine(x.s, x.g, s, { doseMg: 50, overMin: 1, risks: 3 }));
    const rx = protamineReactionsOf(x.st);
    expect(rx.length).toBeGreaterThan(0);
    expect(pciTipContext(x.snapshot()).events ?? []).not.toContain("hypotension");
    driveProtamineReaction(x);
    let raised = false;
    while (x.st.t < rx[0].onsetT + 240 && !raised) {
      x.step(0.5);
      raised = (pciTipContext(x.snapshot()).events ?? []).includes("hypotension");
    }
    expect(raised).toBe(true);
    expect(x.st.t).toBeGreaterThanOrEqual(rx[0].onsetT);
  });

  it("the run's context is declared as case setup even while the attending refuses drug orders", () => {
    const r = resolvePciLaunch({ scenario: "lad-focal", variant: "hit-bivalirudin", start: "guide-engaged", mode: "guided" });
    const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
    sessions.push(x);
    x.beforeAction = (a) => a !== "drug";
    expect(antithromboticContextOf(x.st)).toBeNull();
    expect(declareRunContext(x)).toBe(true);
    expect(antithromboticContextOf(x.st)).toMatchObject({ actDevice: "hemochron", hit: true });
    // once declared it is not declared again
    const n = x.st.log.length;
    expect(declareRunContext(x)).toBe(true);
    expect(x.st.log.length).toBe(n);
  });

  it("in suspected HIT the guided aid replaces the heparin dose with the stop-all-heparin rule and keeps bivalirudin", () => {
    const gd = html(open("guided", "hit-bivalirudin"));
    expect(gd).toContain("every heparin product stops, the heparinised flushes and pressure line included, and bivalirudin is used");
    expect(gd).not.toMatch(/heparin 70-100 U\/kg/);
    expect(gd).toMatch(/Bivalirudin 0\.75 mg\/kg/);
    expect(html(open("guided", "hemochron"))).toMatch(/heparin 70-100 U\/kg/);
  });

  it("protamine ordered over minutes reaches the engine over those minutes; a push at once", () => {
    const x = open("independent", "hemochron");
    const total = () => x.engine.pharm.st.totals.protamine ?? 0;
    deliverProtamine(x, 50, 10);
    const portions = (10 * 60) / MP_PROTAMINE_PORTION_S;
    expect(total()).toBeCloseTo(50 / portions, 6);
    // the lab steps at most 0.1 s at a time
    const t0 = x.wall();
    while (x.wall() - t0 < 5 * 60) x.step(0.1);
    expect(total()).toBeGreaterThan(20);
    expect(total()).toBeLessThan(30);
    while (x.wall() - t0 < 11 * 60) x.step(0.1);
    expect(total()).toBeCloseTo(50, 6);
    const y = open("independent", "hemochron");
    deliverProtamine(y, 40, 0);
    expect(y.engine.pharm.st.totals.protamine ?? 0).toBeCloseTo(40, 6);
  });
});
