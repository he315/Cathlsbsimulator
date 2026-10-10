import { describe, it, expect } from "vitest";
import { Rng, hashStringToSeed, uid } from "./random";

describe("Rng (seeded mulberry32)", () => {
  it("is deterministic for a given seed", () => {
    const a = new Rng("case-42");
    const b = new Rng("case-42");
    const seqA = Array.from({ length: 8 }, () => a.next());
    const seqB = Array.from({ length: 8 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("produces different streams for different seeds", () => {
    const a = new Rng("seed-a");
    const b = new Rng("seed-b");
    expect(a.next()).not.toBe(b.next());
  });

  it("stays within [0,1)", () => {
    const r = new Rng(123);
    for (let i = 0; i < 200; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("int(lo,hi) is inclusive and in range", () => {
    const r = new Rng("ints");
    for (let i = 0; i < 500; i++) {
      const v = r.int(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it("pick never returns undefined for a non-empty array", () => {
    const r = new Rng("pick");
    const arr = ["a", "b", "c"];
    for (let i = 0; i < 50; i++) expect(arr).toContain(r.pick(arr));
  });
});

describe("hashStringToSeed", () => {
  it("is stable and non-zero", () => {
    expect(hashStringToSeed("x")).toBe(hashStringToSeed("x"));
    expect(hashStringToSeed("x")).not.toBe(hashStringToSeed("y"));
    expect(hashStringToSeed("anything")).toBeGreaterThan(0);
  });
});

describe("uid", () => {
  it("returns a non-empty string", () => {
    expect(typeof uid()).toBe("string");
    expect(uid().length).toBeGreaterThan(0);
  });
});
