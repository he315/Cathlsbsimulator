// pci-patient-coupling: the defibrillator and resuscitation console, server-rendered from a headless session.
// It is in the console registry, shows the pads, the mode, the energies, charge, all clear and shock, the cough
// request, compressions and the device, and pericardiocentesis, and never names the rhythm or a cause.
//   npx vitest run src/ui/pci/consoles/DefibConsole.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PciLabSession, DEFIB_ENERGIES_J } from "../PciLabSession";
import { resolvePciLaunch } from "../launch";
import { useSeriesStore } from "../../../state/useSeriesStore";
import { pciConsoles } from "./registry";
import DefibConsole from "./DefibConsole";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function lab(scenario: string, variant?: string) {
  const r = resolvePciLaunch({ scenario, start: "wire-across", mode: "supervised", ...(variant ? { variant } : {}) });
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
  sessions.push(x);
  return x;
}
const html = (x: PciLabSession) => renderToStaticMarkup(createElement(DefibConsole, { session: x }));
const run = (x: PciLabSession, s: number) => {
  for (let t = 0; t < s - 1e-9; t += 0.1) x.step(0.1);
};

describe("the defibrillator console", () => {
  it("is registered with a generic label and offered in every mode", () => {
    const c = pciConsoles().find((k) => k.id === "defib");
    expect(c?.label).toBe("Defibrillator and CPR");
    expect(c?.modes).toBeUndefined();
  });

  it("shows the settings and actions, charges, clears and shocks, and names no rhythm or cause", () => {
    const x = lab("lcx-stemi", "arrest-wire-across");
    let h = html(x);
    for (const k of ["Pads", "on (sternum and apex)", "Unsynchronised", "Synchronised", "Charge 200 J", "All clear", "Shock", "Ask the patient to cough", "Start compressions", "Fit compression device", "Stop compressions", "Pericardiocentesis"]) expect(h).toContain(k);
    for (const j of DEFIB_ENERGIES_J) expect(h).toContain(`${j} J`);
    expect(h).toMatch(/disabled=""[^>]*>Shock</);
    run(x, 8);
    x.charge();
    run(x, 6);
    h = html(x);
    expect(h).toContain("200 J ready");
    expect(h).not.toMatch(/disabled=""[^>]*>Shock</);
    x.clearForShock();
    expect(html(x)).toMatch(/aria-pressed="true"[^>]*>All clear/);
    x.shock();
    run(x, 0.2);
    h = html(x);
    expect(h).toMatch(/Shocks delivered<\/span><span[^>]*>1</);
    for (const w of [/fibrillation/i, /\bVF\b/, /tachycardia/i, /asystole/i, /reperfusion/i, /tamponade/i, /vagal/i]) expect(h).not.toMatch(w);
  });

  it("without pads the console offers to apply them, and the device fitting shows as a pause", () => {
    const x = lab("lad-focal");
    expect(html(x)).toContain("Apply pads");
    x.setPads(true);
    expect(html(x)).toContain("being applied");
    x.engine.forceRhythm("vf", "test");
    x.fitCompressionDevice();
    expect(html(x)).toContain("paused: fitting the device");
    run(x, 11);
    expect(html(x)).toContain("mechanical device running");
  });
});
