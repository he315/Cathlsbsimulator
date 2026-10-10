/// <reference types="vite/client" />
// pci-lab-shell-session: every PCI device console file exports only `meta` and its default component.
// Other exports (constants, helpers) make React Fast Refresh remount the PCI lab on each edit of the
// file, losing the case in progress; they belong in a plain module (the assisted console's device menu
// is in PciLabSession.ts). `meta` is the registry's contract and registry.ts tells the refresh runtime
// to ignore it in this folder.
//   npx vitest run src/ui/pci/consoles/consoles.test.ts
import { describe, expect, it } from "vitest";
import { pciConsoles } from "./registry";
import { DEVICE_DIAMETERS, DEVICE_LENGTHS, INDEFLATOR_RANGE, deviceSizeFor } from "../PciLabSession";

const FILES = import.meta.glob<Record<string, unknown>>("./*.tsx", { eager: true });

describe("PCI console files", () => {
  it("export only meta and the default component", () => {
    const paths = Object.keys(FILES);
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      const keys = Object.keys(FILES[path]).filter((k) => k !== "__esModule").sort();
      expect({ path, keys }).toEqual({ path, keys: ["default", "meta"] });
    }
    expect(pciConsoles().map((c) => c.id)).toContain("assisted-devices");
  });

  it("the assisted console's device menu is unchanged in its new home", () => {
    expect(DEVICE_DIAMETERS).toEqual([2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0]);
    expect(DEVICE_LENGTHS).toEqual([8, 12, 15, 18, 20, 23, 28, 33, 38]);
    expect(INDEFLATOR_RANGE).toEqual([2, 24]);
    expect(deviceSizeFor(3.1, 14)).toEqual({ diameter: 3.0, lengthMm: 20 });
  });
});
