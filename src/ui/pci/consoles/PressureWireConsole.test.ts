// pci-pressure-wire-console: the pressure-wire console renders the console's read-outs (Pa, Pd, Pd/Pa, the
// wave-free ratio) and settings, the pullback plot once a pullback is recorded and its co-registration on the
// stored run's image; it names no cause of a failed step, no branch the wire is in and no stenosis outside guided
// practice.
//   npx vitest run src/ui/pci/consoles/PressureWireConsole.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PciLabSession } from "../PciLabSession";
import { resolvePciLaunch } from "../launch";
import { STORE_PX, useSeriesStore, type StoredSeries } from "../../../state/useSeriesStore";
import { branchesOf, pathTo } from "../../../simulation/pci/geometry";
import { setWireKind, moveWire } from "../../../simulation/pci/actions/wire";
import { pressureDriftCheck, pwRemoveIntroducer, samplePullback, setPullbackRecording } from "../../../simulation/pci/actions/pressure";
import { sensorMm } from "../../../simulation/pci/coronaryWire";
import { applyPressureAction, equaliseInSession, zeroTransducerInSession } from "../inputBindings/pressureWire";
import PressureWireConsole, { meta } from "./PressureWireConsole";
import type { LaunchMode } from "../../../content/schema";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function measured(mode: LaunchMode, params: Record<string, string> = {}) {
  const r = resolvePciLaunch({ scenario: "lad-focal", start: "guide-engaged", mode, ...params });
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
  sessions.push(x);
  const go = (mm: number) => applyPressureAction(x, "advance-wire", (st) => samplePullback(x.s, x.g, moveWire(x.s, x.g, st, mm), x.drawTree));
  applyPressureAction(x, "wire-kind", (st) => setWireKind(st, "pressure", { g: x.g }));
  for (let i = 0; i < 80 && (sensorMm(x.st.wire) ?? -99) < 1; i++) go(1);
  applyPressureAction(x, "wire-kind", (st) => pwRemoveIntroducer(st));
  x.flushGuide();
  zeroTransducerInSession(x);
  equaliseInSession(x);
  for (let i = 0; i < 30; i++) go(2);
  applyPressureAction(x, "wire-kind", (st) => setPullbackRecording(st, true));
  for (let i = 0; i < 40 && sensorMm(x.st.wire)! > 1; i++) go(-2);
  return x;
}

const html = (x: PciLabSession) => renderToStaticMarkup(createElement(PressureWireConsole, { session: x }));

describe("PressureWireConsole (pci-pressure-wire-console)", () => {
  it("is registered with a generic label", () => {
    expect(meta).toMatchObject({ id: "pressure-wire", label: "Pressure wire" });
  });

  it("offers the exchange when no pressure wire is on the rail", () => {
    const r = resolvePciLaunch({ scenario: "lad-focal", start: "guide-engaged", mode: "supervised" });
    const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
    sessions.push(x);
    expect(html(x)).toMatch(/Exchange for the pressure wire/);
  });

  it("shows Pa, Pd, Pd/Pa and the wave-free ratio, the pullback plot and, with a stored run, the co-registration; no cause or stenosis outside guided practice", () => {
    const x = measured("supervised");
    expect(x.st.pressure!.equalised).toBe(true);
    expect(x.st.pressure!.pullback.samples.length).toBeGreaterThan(5);
    let h = html(x);
    expect(h).toMatch(/Pa \/ Pd/);
    expect(h).toMatch(/Pd\/Pa/);
    expect(h).toMatch(/Wave-free ratio/);
    expect(h).toMatch(/pullback curve/);
    expect(h).toMatch(/Record a cine run to co-register/);
    // the vessel strip (with the stenosis as a percentage) and the sensor position are guided aids only
    expect(h).not.toMatch(/\d+%/);
    expect(h).not.toMatch(/beyond the guide tip<\/span>/);
    // a stored cine run: the pullback and the sensor on its projection
    const cArm = { ...x.carm.angles };
    const run = { id: "r1", number: 1, kind: "cine", caseId: x.caseId, cArm, cArmEnd: cArm, fieldCm: x.field, w: STORE_PX, h: STORE_PX, frames: [new Uint8Array(STORE_PX * STORE_PX).fill(90)], mmPerPxIso: 0.35 } as unknown as StoredSeries;
    useSeriesStore.setState({ series: [run] });
    h = html(x);
    expect(h).toMatch(/Pullback co-registered on the stored run/);
    // the stored image under the dots, in stored pixels
    expect(h).toMatch(new RegExp(`<canvas width="${STORE_PX}" height="${STORE_PX}"`));
    expect(h).toMatch(new RegExp(`viewBox="0 0 ${STORE_PX} ${STORE_PX}"`));
    expect(h).toMatch(/<circle/);
    // every dot inside the image
    const cs = [...h.matchAll(/<circle cx="([-\d.e]+)" cy="([-\d.e]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(cs.length).toBeGreaterThan(5);
    for (const [cx, cy] of cs) {
      expect(cx).toBeGreaterThan(0);
      expect(cx).toBeLessThan(STORE_PX);
      expect(cy).toBeGreaterThan(0);
      expect(cy).toBeLessThan(STORE_PX);
    }
  });

  /** The pressure wire moved into a named side branch off the target (its route and tip set directly). */
  function inBranch(x: PciLabSession): string {
    const b = branchesOf(x.g, x.g.lesion.vessel).find((v) => !v.terminal && x.g.byName.get(v.c.name)?.lesionId)!;
    const route = [...pathTo(x.g, x.g.lesion.vessel), b.c.name];
    const tipMm = b.atMm + 50;
    applyPressureAction(x, "advance-wire", (st) => ({ ...st, route, tipMm, wire: { ...st.wire, route, tipMm } }));
    return b.c.name;
  }

  it("names the branch the wire is in only in guided practice", () => {
    const sup = measured("supervised");
    const name = inBranch(sup);
    const h = html(sup);
    expect(h).toMatch(/Pd\/Pa/);
    expect(h).not.toMatch(/Wire in/);
    expect(h).not.toContain(name);
    const gd = measured("guided");
    expect(html(gd)).not.toContain(name);
    inBranch(gd);
    expect(html(gd)).toMatch(new RegExp(`Wire in</span><span[^>]*>${name}<`));
  });

  it("in guided practice adds the vessel strip and the sensor position", () => {
    const h = html(measured("guided"));
    expect(h).toMatch(/\d+%/);
    expect(h).toMatch(/mm beyond the guide tip/);
  });
  it("says in every mode why an equalisation did not take, and the drift check's verdict, but names the cause only in guided practice", () => {
    const x = measured("supervised");
    // a contrast injection fills the guide again: equalising now is refused, with the console's own message
    x.syringes.guide.primed = 1;
    equaliseInSession(x);
    let h = html(x);
    expect(h).toMatch(/Equalisation refused: the guide still holds contrast/);
    expect(h).toMatch(/no \(last attempt refused\)/);
    expect(h).not.toMatch(/from the last injection/);
    // the drift check's verdict on the Pd/Pa it shows
    applyPressureAction(x, "wire-kind", (st) => pressureDriftCheck(x.s, x.g, st, x.drawTree));
    h = html(x);
    expect(h).toMatch(/no significant drift|the sensor has drifted: re-equalise and repeat/);
    const gd = measured("guided");
    gd.syringes.guide.primed = 1;
    equaliseInSession(gd);
    expect(html(gd)).toMatch(/from the last injection/);
  });
});
