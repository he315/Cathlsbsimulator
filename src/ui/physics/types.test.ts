import { describe, expect, it } from "vitest";
import { buildAnatomy } from "../../simulation/anatomy";
import { generateCase } from "../../simulation/caseGenerator";
import { collectPhysicsDevices, getPhysicsDevices, resolvePhysicsDevices, type PhysicsDevicesImpl } from "./types";
import type { FixturePhysics } from "./__fixtures__/impl/fixture";

// The real impl folder, collected with the same pattern getPhysicsDevices() uses. These tests hold
// whether impl/ is empty or holds an implementation (diag-rod-physics adds impl/rod.ts).
const REAL = import.meta.glob(["./impl/*.ts", "!./impl/*.test.ts"], { eager: true });
// The fixture folder on its own, so fixture tests never depend on what impl/ holds.
const FIXTURE = import.meta.glob(["./__fixtures__/impl/*.ts", "!./__fixtures__/impl/*.test.ts"], { eager: true });

const stub = (id: string, order?: number): PhysicsDevicesImpl => ({
  id,
  label: `${id} mechanics`,
  order,
  create: () => {
    throw new Error("not used");
  },
});

describe("getPhysicsDevices", () => {
  it("returns null when there is no implementation", () => {
    expect(resolvePhysicsDevices({})).toBeNull();
    expect(collectPhysicsDevices({})).toEqual([]);
  });

  it("returns the first implementation registered in impl/, or null when it holds none", () => {
    const registered = collectPhysicsDevices(REAL);
    const got = getPhysicsDevices();
    if (registered.length === 0) expect(got).toBeNull();
    else expect(got).toBe(registered[0]);
    // resolved once and kept
    expect(getPhysicsDevices()).toBe(got);
  });

  it("returns a fixture implementation placed in an impl/ folder", () => {
    const impl = resolvePhysicsDevices(FIXTURE);
    expect(impl).not.toBeNull();
    expect(impl!.id).toBe("fixture");
    expect(impl!.label).toBe("Fixture mechanics");
  });

  it("collects the fixture beside whatever impl/ holds, without duplicate ids", () => {
    const real = collectPhysicsDevices(REAL);
    const both = collectPhysicsDevices({ ...REAL, ...FIXTURE });
    expect(both).toHaveLength(real.length + 1);
    expect(both.map((i) => i.id)).toContain("fixture");
    for (const impl of real) expect(both).toContain(impl);
    // the winner follows order, then id, across both folders
    const sorted = [...both].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    expect(resolvePhysicsDevices({ ...REAL, ...FIXTURE })).toBe(sorted[0]);
  });

  it("the fixture implementation receives init, load, commands and steps, and reports a reading", () => {
    const phys = resolvePhysicsDevices(FIXTURE)!.create({ useWorker: false }) as FixturePhysics;
    const model = buildAnatomy(generateCase("phys-fixture", { rootSize: "normal", focus: "left" }, "rand"));
    phys.init({ model, route: "femoral", coronaries: [] });
    expect(phys.latest()).toBeNull();
    phys.load("guide", "JL4G");
    phys.command({ kind: "push", device: "catheter", mm: 2 });
    phys.step(1.5);
    const r = phys.latest()!;
    expect(phys.scene?.route).toBe("femoral");
    expect(phys.loaded).toEqual({ device: "guide", id: "JL4G" });
    expect(phys.commands).toEqual([{ kind: "push", device: "catheter", mm: 2 }]);
    expect(r).toMatchObject({ t: 1.5, vessel: "LM", depthMm: 2, coaxiality: 1, wallForce: 0, openFraction: 1, prolapsed: false });
    expect(Number.isFinite(r.costMs)).toBe(true);
    phys.dispose();
    expect(phys.latest()).toBeNull();
  });
});

describe("collectPhysicsDevices", () => {
  it("orders by order, then id", () => {
    const got = collectPhysicsDevices({
      "./impl/b.ts": { physicsDevices: stub("b") },
      "./impl/a.ts": { physicsDevices: stub("a") },
      "./impl/c.ts": { physicsDevices: stub("c", -1) },
    });
    expect(got.map((i) => i.id)).toEqual(["c", "a", "b"]);
    expect(resolvePhysicsDevices({ "./impl/b.ts": { physicsDevices: stub("b") }, "./impl/a.ts": { physicsDevices: stub("a", 2) } })!.id).toBe("b");
  });

  it("rejects a file without the export, a malformed implementation and a duplicate id", () => {
    expect(() => collectPhysicsDevices({ "./impl/x.ts": {} })).toThrow(/does not export 'physicsDevices'/);
    expect(() => collectPhysicsDevices({ "./impl/x.ts": { physicsDevices: { ...stub("x"), id: "" } } })).toThrow(/id missing/);
    expect(() => collectPhysicsDevices({ "./impl/x.ts": { physicsDevices: { ...stub("x"), label: "" } } })).toThrow(/no label/);
    expect(() => collectPhysicsDevices({ "./impl/x.ts": { physicsDevices: { ...stub("x"), order: Number.NaN } } })).toThrow(/invalid order/);
    expect(() => collectPhysicsDevices({ "./impl/x.ts": { physicsDevices: { id: "x", label: "X" } } })).toThrow(/no create/);
    expect(() =>
      collectPhysicsDevices({ "./impl/x.ts": { physicsDevices: stub("dup") }, "./impl/y.ts": { physicsDevices: stub("dup") } })
    ).toThrow(/declared by .*x\.ts and .*y\.ts/);
  });
});
