// Tip integration and launch links of the bench's measuring and planning presets (pci-bench-measure-and-plan),
// driven from src/content/lab/presets/pci-bench/measure.launch.ts: the launch file against MEASURE_LESIONS, the
// practice index under the imaging lessons, the tips at the imaging phase, and the waiting.ts entries naming
// this package. The bench's event source is src/ui/lab/benchTips.ts (its raises export).
//   npx vitest run src/ui/lab/benchTips.measure.test.ts
import { describe, expect, it } from "vitest";
import { tipsFor } from "../../content/lab/tips";
import { WAITING_TIPS } from "../../content/lab/raisable/waiting";
import { buildKnownLaunch, validateLaunchLinks } from "../../content/validateLaunch";
import { ALL_CASES, TRACKS } from "../../content/index";
import { launch } from "../../content/lab/presets/pci-bench/measure.launch";
import { launch as core } from "../../content/lab/presets/pci-bench/core.launch";
import { BENCH_BY_ID, BENCH_LESIONS, MEASURE_LESIONS, initialState } from "../../simulation/pciBench";
import { practiceForLesson } from "../content/practiceIndex";
import { launchBench } from "../sections/PciBench";
import { benchTipContext, raises } from "./benchTips";

const PKG = "pci-bench-measure-and-plan";
const FILE = "presets/pci-bench/measure.launch.ts";
const LESSONS = ["pm-imaging-when-which", "pm-imaging-planning", "pm-imaging-optimisation"];
const ids = (ctx: Parameters<typeof tipsFor>[0]) => tipsFor(ctx, 20).map((t) => t.id);

describe("measure.launch.ts", () => {
  it("declares every measuring preset, and only those, under the pci-bench sim; the picker's lesions stay core.launch.ts's", () => {
    expect(launch.sim).toBe("pci-bench");
    expect(launch.scenarios!.map((s) => s.id).sort()).toEqual(MEASURE_LESIONS.map((l) => l.id).sort());
    expect(launch.scenarios!.map((s) => s.id).sort()).toEqual(["acs-culprit-oct", "aorto-ostial-rca", "ckd-ivus", "distal-lm-two-branch", "ostial-lm-ivus"]);
    for (const l of MEASURE_LESIONS) {
      expect(BENCH_BY_ID[l.id]).toBe(l);
      expect(BENCH_LESIONS).not.toContain(l);
    }
    const known = buildKnownLaunch({ [FILE]: { launch }, "presets/pci-bench/core.launch.ts": { launch: core } });
    expect(known.problems).toEqual([]);
  });

  it("every named lessonId resolves and every link passes validation", () => {
    const known = buildKnownLaunch({ [FILE]: { launch } });
    const errs = validateLaunchLinks({ tracks: TRACKS, cases: ALL_CASES }, known).filter((e) => e.includes("pci-bench"));
    expect(errs).toEqual([]);
  });

  it("practiceIndex lists every scenario under pm-imaging-when-which, pm-imaging-planning and pm-imaging-optimisation", () => {
    for (const sc of launch.scenarios!) {
      for (const lessonId of new Set([...LESSONS, ...sc.lessonIds])) {
        expect(sc.lessonIds).toContain(lessonId);
        const e = practiceForLesson(lessonId).filter((x) => x.sim === "pci-bench" && x.scenario === sc.id && x.source.endsWith(FILE));
        expect(e.length, `${sc.id} under ${lessonId}`).toBeGreaterThan(0);
        expect(e[0].params.scenario).toBe(sc.id);
      }
    }
  });

  it("a launch opens each preset at the first pullback with the modality to choose", () => {
    for (const sc of launch.scenarios!) expect(launchBench({ scenario: sc.id, start: "image" })!.session).toMatchObject({ lesionId: sc.id, step: "image", modality: null });
  });
});

describe("tips from the measuring presets", () => {
  it("at phase 'imaging' the choose-by-goal and calcium-score tips appear (acs-culprit-oct and aorto-ostial-rca on OCT)", () => {
    for (const id of ["acs-culprit-oct", "aorto-ostial-rca"]) {
      const ctx = benchTipContext(BENCH_BY_ID[id], "image", initialState(), null, "OCT");
      expect(ctx.phase).toBe("imaging");
      expect(ids(ctx), id).toEqual(expect.arrayContaining(["pci-img-choose-by-goal", "pci-img-calcium-score"]));
    }
  });

  it("the phase is 'plan' until the modality is committed, then 'imaging'", () => {
    const l = BENCH_BY_ID["ckd-ivus"];
    expect(benchTipContext(l, "image", initialState(), null, null).phase).toBe("plan");
    expect(tipsFor(benchTipContext(l, "image", initialState(), null, null), 60).map((t) => t.id)).toContain("pci-img-choose-by-goal");
    expect(benchTipContext(l, "image", initialState(), null, "IVUS").phase).toBe("imaging");
  });

  it("the ostial left main reports vessel LM and aorto-ostial-lesion, and its left main imaging tips appear", () => {
    const ctx = benchTipContext(BENCH_BY_ID["ostial-lm-ivus"], "image", initialState(), null, "OCT");
    expect(ctx.vessel).toBe("LM");
    expect(ctx.events).toContain("aorto-ostial-lesion");
    expect(ids(ctx)).toEqual(expect.arrayContaining(["pci-lm-ivus-for-ostium", "pci-img-lm-threshold"]));
    // the two-branch left main at optimisation: image from both branches
    const two = benchTipContext(BENCH_BY_ID["distal-lm-two-branch"], "optimise", initialState(), null, "IVUS");
    expect(ids(two)).toContain("pci-img-lm-both-branches");
  });

  it("the bench's raises still declare the phases and imaging these tips need", () => {
    expect(raises.phases).toEqual(expect.arrayContaining(["plan", "imaging", "optimise"]));
    expect(raises.imaging).toEqual(expect.arrayContaining(["ivus", "oct"]));
  });
});

describe("waiting.ts entries naming this package", () => {
  it("there are none, so none is left unsatisfiable and the pci waiting count does not grow", () => {
    expect(WAITING_TIPS.filter((g) => g.raisedBy === PKG)).toEqual([]);
  });
});
