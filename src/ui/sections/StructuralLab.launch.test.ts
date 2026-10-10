// repair-structural-bedside-launch, the structural side: a lesson's or case's practice link to a
// transseptal drill (ts-*, src/content/lab/presets/structural/transseptal.launch.ts) resolves to the
// TEER procedure with the drill as its scenario, whichever structural sim the link names, so TeerLab
// opens the drill at the transseptal step instead of the default TEER case.
//   npx vitest run src/ui/sections/StructuralLab.launch.test.ts
import { describe, expect, it } from "vitest";
import { resolveStructuralLaunch } from "./StructuralLab";
import { TS_PRESETS, transseptalPreset } from "../../simulation/transseptal";
import { TEER_SCENARIOS } from "../../simulation/teer";
import { launch as tsLaunch } from "../../content/lab/presets/structural/transseptal.launch";

describe("structural launch: transseptal drills", () => {
  it("the drills' launch file names the TEER sim and only ids TeerLab knows as drills", () => {
    expect(tsLaunch.sim).toBe("teer");
    for (const sc of tsLaunch.scenarios ?? []) expect(transseptalPreset(sc.id), sc.id).toBeDefined();
  });

  it("a ts-standard practice link opens the TEER tab on the drill", () => {
    expect(resolveStructuralLaunch("teer", { scenario: "ts-standard" })).toEqual({ tab: "teer", scenario: "ts-standard", start: null, mode: null });
  });

  it("every drill resolves to TEER from any of the three sims, as scenario or preset, with its start and mode", () => {
    for (const p of TS_PRESETS) {
      for (const sim of ["tavi", "teer", "laao"] as const) {
        expect(resolveStructuralLaunch(sim, { scenario: p.id })).toMatchObject({ tab: "teer", scenario: p.id });
        expect(resolveStructuralLaunch(sim, { preset: p.id })).toMatchObject({ tab: "teer", scenario: p.id });
      }
      expect(resolveStructuralLaunch("teer", { scenario: p.id, start: "transseptal", mode: "exam" })).toEqual({ tab: "teer", scenario: p.id, start: "transseptal", mode: "exam" });
    }
  });

  it("drill ids do not collide with the TEER cases, and unknown ids still open the named sim as it is", () => {
    for (const p of TS_PRESETS) expect(TEER_SCENARIOS.some((s) => s.id === p.id)).toBe(false);
    expect(resolveStructuralLaunch("laao", { scenario: "ts-no-such-drill" })).toEqual({ tab: "laao", scenario: null, start: null, mode: null });
    expect(resolveStructuralLaunch("teer", {})).toEqual({ tab: "teer", scenario: null, start: null, mode: null });
  });
});
