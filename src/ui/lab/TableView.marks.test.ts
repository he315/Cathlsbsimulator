// pci-device-delivery: the table view draws the device's 90 and 100 cm shaft marks where they lie outside the
// Y-connector; the PCI lab's table strip shows the 90 cm mark coming down to the valve as the hands push a
// device down the guide from the valve.
//   npx vitest run src/ui/lab/TableView.marks.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TableView from "./TableView";
import { PciTableStrip } from "../pci/PciLab";
import { PciLabSession } from "../pci/PciLabSession";
import { resolvePciLaunch } from "../pci/launch";
import { backloadDevice, checkLabel, prepareDevice, requestDevice, setValve } from "../../simulation/angioPci";
import { advanceDevice, deviceShaftMm } from "../../simulation/pci/actions/devices";
import { applyDeliveryAction } from "../pci/inputBindings/support";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
});

const marks = (html: string) => (html.match(/data-shaft-mark=/g) ?? []).length;

describe("the device's shaft marks on the table (pci-device-delivery)", () => {
  it("draws the marks still outside the valve: both before the 90 cm mark reaches it, one after, none past the 100 cm mark", () => {
    const view = (inserted: number) =>
      renderToStaticMarkup(createElement(TableView, { readOnly: true, state: { setup: "guide", present: ["sheath", "catheter", "wire014", "balloon"], insertedMm: { catheter: 1000, wire014: 1100, balloon: inserted } } }));
    expect(marks(view(500))).toBe(2);
    expect(marks(view(950))).toBe(1);
    expect(marks(view(1050))).toBe(0);
    // no device, no marks; a diagnostic set-up has no rapid-exchange device
    expect(marks(renderToStaticMarkup(createElement(TableView, { readOnly: true, state: { setup: "guide", present: ["sheath", "catheter", "wire014"] } })))).toBe(0);
  });

  it("the PCI lab's table strip shows the 90 cm mark until it reaches the Y-connector", () => {
    const r = resolvePciLaunch({ scenario: "rca-stuck-stent", start: "wire-across" });
    const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
    sessions.push(x);
    applyDeliveryAction(x, "load-device", (st) => advanceDevice(x.s, x.g, setValve(backloadDevice(prepareDevice(checkLabel(requestDevice(st, "sc", 2.0, 15)))), true), 1, { fromValve: true }));
    const strip = () => renderToStaticMarkup(createElement(PciTableStrip, { session: x, recommended: [], showEvent: false }));
    applyDeliveryAction(x, "advance-device", (st) => advanceDevice(x.s, x.g, st, 800));
    expect(deviceShaftMm(x.st)).toBeCloseTo(800, 6);
    expect(marks(strip())).toBe(2);
    applyDeliveryAction(x, "advance-device", (st) => advanceDevice(x.s, x.g, st, 150));
    expect(deviceShaftMm(x.st)).toBeCloseTo(950, 6);
    expect(marks(strip())).toBe(1);
  });
});
