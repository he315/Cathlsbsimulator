// Tip integration and launch links of the bench's platform, sizing and positioning presets
// (pci-bench-stent-platforms-sizing), driven from src/content/lab/presets/pci-bench/platforms.launch.ts: the
// launch file against PLATFORM_LESIONS, the practice index under the lessons, the tips at the plan, stent and
// optimise phases, and the waiting.ts entries naming this package. The bench's event source is
// src/ui/lab/benchTips.ts (its raises export).
//   npx vitest run src/ui/lab/benchTips.platforms.test.ts
import { describe, expect, it } from "vitest";
import { tipsFor } from "../../content/lab/tips";
import { WAITING_TIPS } from "../../content/lab/raisable/waiting";
import { buildKnownLaunch, validateLaunchLinks } from "../../content/validateLaunch";
import { ALL_CASES, TRACKS } from "../../content/index";
import { launch } from "../../content/lab/presets/pci-bench/platforms.launch";
import { launch as core } from "../../content/lab/presets/pci-bench/core.launch";
import { launch as measure } from "../../content/lab/presets/pci-bench/measure.launch";
import { BENCH_BY_ID, BENCH_LESIONS, MEASURE_LESIONS, PLATFORM_LESIONS, initialState } from "../../simulation/pciBench";
import { practiceForLesson } from "../content/practiceIndex";
import { launchBench } from "../sections/PciBench";
import { benchTipContext, raises } from "./benchTips";

const PKG = "pci-bench-stent-platforms-sizing";
const FILE = "presets/pci-bench/platforms.launch.ts";
const LESSONS = ["pm-prep-and-stent-deploy", "cp-left-main-technique", "cp-left-main-distal"];
const ids = (ctx: Parameters<typeof tipsFor>[0]) => tipsFor(ctx, 20).map((t) => t.id);

describe("platforms.launch.ts", () => {
  it("declares every platform preset, and only those, under the pci-bench sim, beside core and measure", () => {
    expect(launch.sim).toBe("pci-bench");
    expect(launch.scenarios!.map((s) => s.id).sort()).toEqual(PLATFORM_LESIONS.map((l) => l.id).sort());
    expect(launch.scenarios!.map((s) => s.id).sort()).toEqual(
      ["ectatic-rca", "lm-lad-crossover", "ostial-fibrotic", "ostial-overhang", "ostial-recoil", "ostial-rca-short", "small-distal-225", "taper-lad"].sort()
    );
    for (const l of PLATFORM_LESIONS) {
      expect(BENCH_BY_ID[l.id]).toBe(l);
      expect(BENCH_LESIONS).not.toContain(l);
      expect(MEASURE_LESIONS).not.toContain(l);
    }
    const known = buildKnownLaunch({ [FILE]: { launch }, "presets/pci-bench/core.launch.ts": { launch: core }, "presets/pci-bench/measure.launch.ts": { launch: measure } });
    expect(known.problems).toEqual([]);
  });

  it("every named lessonId resolves and every link passes validation", () => {
    const known = buildKnownLaunch({ [FILE]: { launch } });
    const errs = validateLaunchLinks({ tracks: TRACKS, cases: ALL_CASES }, known).filter((e) => e.includes("pci-bench"));
    expect(errs).toEqual([]);
  });

  it("practiceIndex lists the scenarios under pm-prep-and-stent-deploy, cp-left-main-technique and cp-left-main-distal", () => {
    // every scenario is listed under every lesson it names
    for (const sc of launch.scenarios!) {
      for (const lessonId of sc.lessonIds) {
        const e = practiceForLesson(lessonId).filter((x) => x.sim === "pci-bench" && x.scenario === sc.id && x.source.endsWith(FILE));
        expect(e.length, `${sc.id} under ${lessonId}`).toBeGreaterThan(0);
        expect(e[0].params.scenario).toBe(sc.id);
      }
    }
    // every scenario practises stent deployment
    for (const sc of launch.scenarios!) expect(sc.lessonIds, sc.id).toContain("pm-prep-and-stent-deploy");
    // the two left main lessons list the left main presets (the crossover under both, the ostial left main under the technique lesson)
    const listed = (lessonId: string) => practiceForLesson(lessonId).filter((x) => x.source.endsWith(FILE)).map((x) => x.scenario);
    for (const lessonId of LESSONS) expect(listed(lessonId).length, lessonId).toBeGreaterThan(0);
    expect(listed("cp-left-main-technique")).toEqual(expect.arrayContaining(["lm-lad-crossover", "ostial-recoil"]));
    expect(listed("cp-left-main-distal")).toContain("lm-lad-crossover");
    expect(listed("pm-prep-and-stent-deploy").sort()).toEqual(PLATFORM_LESIONS.map((l) => l.id).sort());
  });

  it("a launch opens each preset at each of its starts", () => {
    for (const sc of launch.scenarios!) {
      for (const st of sc.starts ?? []) {
        const start = typeof st === "string" ? st : st.id;
        const b = launchBench({ scenario: sc.id, start })!;
        expect(b.session.lesionId).toBe(sc.id);
        expect(b.session.step).toBe(start);
        if (start === "image") expect(b.session.modality).toBeNull();
        else expect(b.session.modality).toBe("IVUS");
      }
    }
  });
});

describe("tips from the platform presets", () => {
  it("lm-lad-crossover at phase 'plan' shows pci-lm-stent-expansion-limit; at phase 'stent' pci-stent-size-distal", () => {
    const l = BENCH_BY_ID["lm-lad-crossover"];
    const plan = benchTipContext(l, "image", initialState(), null, null);
    expect(plan.phase).toBe("plan");
    expect(plan.vessel).toBe("LM");
    expect(ids(plan)).toContain("pci-lm-stent-expansion-limit");
    const stent = benchTipContext(l, "stent", initialState(), null, "IVUS");
    expect(stent.phase).toBe("stent");
    expect(ids(stent)).toEqual(expect.arrayContaining(["pci-stent-size-distal", "pci-lm-stent-expansion-limit"]));
  });

  it("taper-lad at phase 'stent' shows the sizing, injured-segment and cardiac-motion tips", () => {
    const ctx = benchTipContext(BENCH_BY_ID["taper-lad"], "stent", initialState(), null, "IVUS");
    expect(ids(ctx)).toEqual(expect.arrayContaining(["pci-stent-size-distal", "pci-stent-cover-injured-segment", "pci-stent-cardiac-motion"]));
  });

  it("the vessel-size presets raise small-vessel and large-vessel, and the expansion-limit tip shows at optimisation in the ectatic RCA", () => {
    expect(benchTipContext(BENCH_BY_ID["small-distal-225"], "image", initialState(), null, null).events).toContain("small-vessel");
    expect(ids(benchTipContext(BENCH_BY_ID["small-distal-225"], "image", initialState(), null, null))).toContain("pci-ocx-small-vessel-nitrate");
    const ect = benchTipContext(BENCH_BY_ID["ectatic-rca"], "optimise", initialState(), null, "IVUS");
    expect(ect.events).toContain("large-vessel");
    expect(ids(ect)).toContain("pci-ocx-stent-expansion-limit");
  });

  it("the ostial presets raise aorto-ostial-lesion, and the coverage and recoil tips show at optimisation", () => {
    for (const id of ["ostial-rca-short", "ostial-overhang", "ostial-fibrotic", "ostial-recoil"]) {
      const ctx = benchTipContext(BENCH_BY_ID[id], "optimise", initialState(), null, "IVUS");
      expect(ctx.events, id).toContain("aorto-ostial-lesion");
      expect(tipsFor(ctx, 40).map((t) => t.id), id).toEqual(expect.arrayContaining(["pci-img-ostial-coverage", "pci-ostial-recoil"]));
    }
  });

  it("the bench's raises still declare the phases these tips need", () => {
    expect(raises.phases).toEqual(expect.arrayContaining(["plan", "imaging", "stent", "optimise"]));
  });
});

describe("waiting.ts entries naming this package", () => {
  it("there are none, so none is left unsatisfiable and the pci waiting count does not grow", () => {
    expect(WAITING_TIPS.filter((g) => g.raisedBy === PKG)).toEqual([]);
  });
});
