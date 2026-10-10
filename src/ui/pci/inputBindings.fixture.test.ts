// pci-lab-input: adding a file under src/ui/pci/inputBindings/ binds its hand action without editing
// pciInputTarget.ts. The test writes a fixture binding file into the folder, loads the folder's registry
// afresh (the glob is resolved when the index is transformed, so the index is imported with a query
// that makes it a new module), drives the action through the unchanged input target, and removes the file.
// The file has a fixed name and any zz-fixture*.ts left in the folder by a killed run is removed first, so
// a leftover can never become a second file binding the same pair.
//   npx vitest run src/ui/pci/inputBindings.fixture.test.ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// no @types/node in this project: the writes go through an untyped dynamic import (as src/input/views.test.ts)
type Fs = { writeFileSync(p: string, d: string): void; unlinkSync(p: string): void; readdirSync(p: string): string[] };
const fsName = "node:fs";
const fsMod = () => import(/* @vite-ignore */ fsName) as Promise<Fs>;

// the query that makes the index a new module may vary; the file name may not
const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const name = "zz-fixture-binding";
const dir = join(__dirname, "inputBindings");
const file = join(dir, `${name}.ts`);
const FIXTURE_FILE = /^zz-fixture.*\.ts$/;
const calls: number[] = [];

const FIXTURE = `// Test fixture written by src/ui/pci/inputBindings.fixture.test.ts and removed by it.
import type { PciInputBinding } from "./index";
export const binding: PciInputBinding = {
  device: "sheath",
  actions: {
    advance: (_ctx, mm) => {
      ((globalThis as Record<string, unknown>).__pciBindingFixture as number[] | undefined)?.push(mm);
    },
  },
};
`;

async function removeFixture() {
  if (existsSync(file)) (await fsMod()).unlinkSync(file);
}

/** Remove every fixture file in the folder, this run's or a killed run's. */
async function removeStaleFixtures() {
  const fs = await fsMod();
  for (const f of fs.readdirSync(dir)) if (FIXTURE_FILE.test(f)) fs.unlinkSync(join(dir, f));
}

beforeAll(removeStaleFixtures);

afterAll(async () => {
  await removeFixture();
  delete (globalThis as Record<string, unknown>).__pciBindingFixture;
});

describe("a binding file added to the folder", () => {
  it("is found by the registry and bound through the unchanged input target", async () => {
    (globalThis as Record<string, unknown>).__pciBindingFixture = calls;
    (await fsMod()).writeFileSync(file, FIXTURE);
    try {
      const reg = (await import(/* @vite-ignore */ `./inputBindings/index.ts?fixture=${stamp}`)) as typeof import("./inputBindings/index");
      expect(reg.boundPairs(reg.PCI_INPUT_BINDINGS)).toContain("sheath:advance");
      const entry = reg.bindingFor(reg.PCI_INPUT_BINDINGS, "sheath", "advance")!;
      expect(entry.file).toBe(`./${name}.ts`);
      const { PciInputTarget } = await import("./pciInputTarget");
      const { PciLabSession } = await import("./PciLabSession");
      const { createInputSystem } = await import("../../input/system");
      const { defaultSettings, pciGripOrder, pciSettings } = await import("../../input/settings");
      const x = new PciLabSession({ scenarioId: "lad-focal", team: false, headlessFrames: true });
      const sys = createInputSystem({ storage: null, settings: pciSettings(defaultSettings()), gripOrder: pciGripOrder(null), initialGrip: "wire014", getPads: () => [] });
      const t = new PciInputTarget(x, sys, { bindings: reg.PCI_INPUT_BINDINGS });
      try {
        // the right hand to the sheath (slot 5) and a push: the target has no route of its own for the sheath
        sys.emit({ t: "selectIndex", index: 5 });
        sys.frame(sys.getSettings().grip.switchMs + 50);
        expect(sys.view().right.at).toBe("sheath");
        sys.emit({ t: "grab", on: true, source: "mouse" });
        sys.emit({ t: "move", axialMm: 2, lateralMm: 0, source: "mouse" });
        expect(calls).toHaveLength(1);
        expect(calls[0]).toBeCloseTo(2, 6);
        expect(t.perform("sheath", "advance", 3)).toBe(true);
        expect(calls[1]).toBe(3);
      } finally {
        t.dispose();
        x.dispose();
      }
    } finally {
      await removeFixture();
    }
  }, 60_000); // the lab's modules are loaded inside the test (after the fixture is written)
});
