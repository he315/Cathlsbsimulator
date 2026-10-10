// The practice index lists every drill of src/content/practice/angio-expert-label-drills.launch.ts under its
// lessons, and every link it makes passes the launch validator.
import { describe, expect, it } from "vitest";
import { PRACTICE_INDEX, practiceForLesson } from "../content/practiceIndex";
import { checkLaunchParams } from "../../content/validateLaunch";
import { launch } from "../../content/practice/angio-expert-label-drills.launch";

describe("angio-expert-label-drills practice links", () => {
  it("practiceIndex lists every drill of the launch file under its lessons, among them pm-interpreting-flow, -morphology and -collaterals", () => {
    for (const d of launch.drills ?? [])
      for (const lesson of d.lessonIds ?? []) {
        const e = practiceForLesson(lesson).find((x) => x.sim === "angio-real" && x.drill === d.id);
        expect({ lesson, drill: d.id, listed: !!e }).toEqual({ lesson, drill: d.id, listed: true });
        expect(e!.params).toEqual({ drill: d.id });
        expect(e!.title).toBe(d.title);
      }
    for (const lesson of ["pm-interpreting-flow", "pm-interpreting-morphology", "pm-interpreting-collaterals"]) {
      const mine = practiceForLesson(lesson).filter((x) => x.source.endsWith("angio-expert-label-drills.launch.ts"));
      expect(mine.length).toBeGreaterThan(0);
    }
    expect(practiceForLesson("pm-interpreting-flow").filter((x) => x.drill === "timi" || x.drill === "frame-count")).toHaveLength(2);
  });

  it("each drill link is valid and the merge reports no problem for this file", () => {
    for (const d of launch.drills ?? []) {
      const errs: string[] = [];
      checkLaunchParams("angio-real", { drill: d.id }, PRACTICE_INDEX.known, d.id, errs);
      expect(errs).toEqual([]);
    }
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("angio-expert-label-drills"))).toEqual([]);
  });
});
