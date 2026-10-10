// pci-lab-shell-session: the PCI lab's table-side controls. The PCI session is a LabControlsTarget; the
// registry gives it the shared C-arm, imaging and patient tabs and its own Devices tab (first in its
// strip), which the diagnostic lab never shows. The Devices tab lists the consoles the PCI lab provides
// and shows the one open; the imaging tab offers 3.75 p/s.
//   npx vitest run src/ui/lab/controls/pciDevicesTab.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TableSideControls from "../TableSideControls";
import { CONTROL_TABS, tabsFor } from "./registry";
import type { PciDevicesCapability } from "./tabs/PciDevicesTab";
import type { LabControlsTarget } from "./types";
import { PciLabSession } from "../../pci/PciLabSession";
import { consolesFor, pciConsoles } from "../../pci/consoles/registry";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
});

function pciLab(): PciLabSession {
  const x = new PciLabSession({ scenarioId: "lad-focal", team: false, headlessFrames: true });
  sessions.push(x);
  const cap: PciDevicesCapability = {
    consoles: () => consolesFor(x.policy.mode).map((c) => ({ id: c.id, label: c.label })),
    openId: () => x.openConsoleId(),
    open: (id) => x.openConsole(id),
    close: () => x.closeConsole(),
    render: (id) => {
      const c = pciConsoles().find((k) => k.id === id);
      return c ? createElement(c.Component, { session: x }) : null;
    },
  };
  x.provideCapability("pciDevices", cap);
  return x;
}

const render = (target: LabControlsTarget, initialTab?: string) => renderToStaticMarkup(createElement(TableSideControls, { session: target, input: null, initialTab }));

describe("the PCI lab's table-side controls", () => {
  it("the Devices tab is registered for the PCI lab only, first in its strip", () => {
    const t = CONTROL_TABS.find((x) => x.id === "pci-devices");
    expect(t?.labs).toEqual(["pci"]);
    const x = pciLab();
    expect(tabsFor(x, x.policy).map((t) => t.id)).toEqual(["pci-devices", "carm", "imaging", "patient"]);
    // the diagnostic strip does not carry the Devices tab, and its core tabs keep their order (diag-lab-drugs adds Drugs after them)
    const diag = CONTROL_TABS.filter((t) => t.labs.includes("diagnostic")).map((t) => t.id);
    expect(diag).not.toContain("pci-devices");
    expect(diag.slice(0, 4)).toEqual(["carm", "imaging", "table", "patient"]);
  });

  it("lists the consoles, shows none until one is opened, then its controls; opening is recorded", () => {
    const x = pciLab();
    const closed = render(x);
    expect(closed).toContain("Guide, wire and devices");
    expect(closed).toContain("Open a console for the guide, the wire and the devices.");
    x.openConsole("assisted-devices");
    const open = render(x);
    for (const k of ["Engage the guide", "Guidewire", "Balloon or stent", "Load on the wire", "Cine injection (Space)", "Flush guide"]) expect(open).toContain(k);
    expect(x.uiEvents().filter((e) => (e.data as { console?: string }).console === "assisted-devices")).toHaveLength(1);
  });

  it("the imaging tab offers the 3.75 p/s rate in the PCI lab and drives its session", () => {
    const x = pciLab();
    expect(x.imagingControls().rates).toEqual([3.75, 7.5, 15, 30]);
    const fluoroRadios = (html: string) => {
      const block = /aria-label="Fluoro rate"[^]*?<\/div>/.exec(html)![0];
      return [...block.matchAll(/<[^>]*role="radio"[^>]*>/g)].map((m) => /aria-checked="true"/.test(m[0]));
    };
    expect(fluoroRadios(render(x, "imaging"))).toHaveLength(4);
    x.setFluoroRate(3.75);
    expect(x.lab.exposure.fluoroPps).toBe(3.75);
    // the first of the four rate radios (3.75) is the checked one, whatever precision the label is written to
    expect(fluoroRadios(render(x, "imaging"))).toEqual([true, false, false, false]);
  });

  it("a target without capabilities (a bare PCI-like target) shows no Devices tab", () => {
    const bare = { controlsLab: "pci" } as LabControlsTarget;
    expect(CONTROL_TABS.find((t) => t.id === "pci-devices")!.visible!(bare, pciLab().policy)).toBe(false);
  });
});
