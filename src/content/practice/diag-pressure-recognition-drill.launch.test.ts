// The practice links of diag-pressure-recognition-drill: the runtime practice index lists every scenario of
// diag-pressure-recognition-drill.launch.ts under lessons pm-engaging-trace and pm-engaging-damping, and
// openSim('pressure', { set }) opens the drill's section with the request pending for it.
//   npx vitest run src/content/practice/diag-pressure-recognition-drill.launch.test.ts
import { describe, expect, it } from "vitest";
import { launch } from "./diag-pressure-recognition-drill.launch";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";
import { isLaunchSim } from "../validateLaunch";
import { SIM_SECTION, useUiStore } from "../../state/useUiStore";
import { useLabLaunchStore } from "../../state/useLabLaunchStore";

const FILE = "/src/content/practice/diag-pressure-recognition-drill.launch.ts";

describe("diag-pressure-recognition-drill practice links", () => {
  it("'pressure' is a launch destination the validator knows", () => {
    expect(isLaunchSim("pressure")).toBe(true);
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("diag-pressure-recognition-drill"))).toEqual([]);
  });

  it("practiceIndex lists every scenario in the .launch.ts under lessons pm-engaging-trace and pm-engaging-damping", () => {
    const ids = (launch.scenarios ?? []).map((s) => s.id);
    expect(ids.length).toBe(4);
    for (const lesson of ["pm-engaging-trace", "pm-engaging-damping"]) {
      const listed = practiceForLesson(lesson).filter((e) => e.sim === "pressure" && e.source === FILE);
      expect(listed.map((e) => e.scenario).sort()).toEqual([...ids].sort());
      for (const e of listed) expect(e.params).toMatchObject({ scenario: e.scenario, mode: "guided" });
    }
  });

  it("openSim('pressure', { set: 'damping' }) opens the pressure trainer section with the set pending for the drill", () => {
    expect(SIM_SECTION.pressure.section).toBe("pressure-trainer");
    useLabLaunchStore.getState().clear();
    useUiStore.getState().openSim("pressure", { set: "damping" });
    expect(useUiStore.getState().section).toBe("pressure-trainer");
    expect(useUiStore.getState().simTab).toBe("pressure");
    expect(useLabLaunchStore.getState().peek("pressure")).toEqual({ set: "damping" });
  });
});
