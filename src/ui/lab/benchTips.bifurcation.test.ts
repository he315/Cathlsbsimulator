// Tip integration and launch links of the bifurcation bench (pci-bench-bifurcation), driven from
// src/content/lab/presets/pci-bench/bifurcation.launch.ts: the launch file against BIF_PRESETS, the practice
// index under the lessons, the launches a lesson can make (start, technique and step), the tips after the
// action that raises side-branch-compromise, and the waiting.ts entries naming this package. The bench's
// event source is src/ui/lab/benchTips.ts; the bifurcation bench's context is bifTipContext
// (src/simulation/bench/bifurcation.ts).
//   npx vitest run src/ui/lab/benchTips.bifurcation.test.ts
import { describe, expect, it } from "vitest";
import { tipsFor, type LabContext } from "../../content/lab/tips";
import type { LaunchParams } from "../../content/schema";
import { WAITING_TIPS } from "../../content/lab/raisable/waiting";
import { buildKnownLaunch, checkLaunchParams, validateLaunchLinks } from "../../content/validateLaunch";
import { ALL_CASES, TRACKS } from "../../content/index";
import { launch } from "../../content/lab/presets/pci-bench/bifurcation.launch";
import { launch as core } from "../../content/lab/presets/pci-bench/core.launch";
import { launch as measure } from "../../content/lab/presets/pci-bench/measure.launch";
import { launch as platforms } from "../../content/lab/presets/pci-bench/platforms.launch";
import { BIF_PRESETS, applyStep, bifTipContext, currentStep, escalate, referenceInput, runReference, type BifState } from "../../simulation/bench/bifurcation";
import { BENCH_BY_ID } from "../../simulation/pciBench";
import { stepCount } from "../../simulation/pci/technique/steps";
import { PRACTICE_INDEX, practiceForLesson } from "../content/practiceIndex";
import { launchBench, launchBifurcation, resolveLaunch } from "../sections/PciBench";

const PKG = "pci-bench-bifurcation";
const FILE = "presets/pci-bench/bifurcation.launch.ts";
const LESSONS = ["cp-bifurcation-two-stent-choosing", "cp-bifurcation-two-stent-dk-crush", "cp-bifurcation-two-stent-culotte"];
const ids = (ctx: LabContext) => tipsFor(ctx, 20).map((t) => t.id);

/** Do the current step with the module's choices. */
function next(s: BifState): BifState {
  const st = currentStep(s)!;
  const r = applyStep(s, st.id, referenceInput(BIF_PRESETS.find((g) => g.id === s.presetId)!, s.technique!, st));
  expect(r.ok, r.message).toBe(true);
  return r.state;
}

describe("bifurcation.launch.ts", () => {
  it("declares every bifurcation preset, and only those, under the pci-bench sim, beside the other bench files", () => {
    expect(launch.sim).toBe("pci-bench");
    expect(launch.scenarios!.map((s) => s.id).sort()).toEqual(BIF_PRESETS.map((g) => g.id).sort());
    expect(launch.scenarios!.map((s) => s.id).sort()).toEqual(["bif-culotte", "bif-dk-crush", "bif-provisional", "bif-tap"]);
    for (const g of BIF_PRESETS) expect(BENCH_BY_ID[g.id], g.id).toBeUndefined();
    const known = buildKnownLaunch({
      [FILE]: { launch },
      "presets/pci-bench/core.launch.ts": { launch: core },
      "presets/pci-bench/measure.launch.ts": { launch: measure },
      "presets/pci-bench/platforms.launch.ts": { launch: platforms },
    });
    expect(known.problems).toEqual([]);
  });

  it("every named lessonId and caseId resolves and every link passes validation", () => {
    const known = buildKnownLaunch({ [FILE]: { launch } });
    const errs = validateLaunchLinks({ tracks: TRACKS, cases: ALL_CASES }, known).filter((e) => e.includes("bif-") || e.includes(FILE));
    expect(errs).toEqual([]);
    const caseIds = new Set(ALL_CASES.map((c) => c.id));
    for (const sc of launch.scenarios!) for (const c of sc.caseIds ?? []) expect(caseIds.has(c), c).toBe(true);
  });

  it("practiceIndex lists every scenario under its lessons, and under cp-bifurcation-two-stent-choosing, -dk-crush and -culotte", () => {
    for (const sc of launch.scenarios!) {
      for (const lessonId of sc.lessonIds) {
        const e = practiceForLesson(lessonId).filter((x) => x.sim === "pci-bench" && x.scenario === sc.id && x.source.endsWith(FILE));
        expect(e.length, `${sc.id} under ${lessonId}`).toBeGreaterThan(0);
        expect(e[0].params.scenario).toBe(sc.id);
      }
    }
    const listed = (lessonId: string) => practiceForLesson(lessonId).filter((x) => x.source.endsWith(FILE)).map((x) => x.scenario);
    expect(listed(LESSONS[0]).sort()).toEqual(launch.scenarios!.map((s) => s.id).sort());
    expect(listed(LESSONS[1])).toContain("bif-dk-crush");
    expect(listed(LESSONS[2])).toContain("bif-culotte");
  });

  it("a launch opens each preset at each of its starts, and the practice entries open the bifurcation bench", () => {
    for (const sc of launch.scenarios!) {
      for (const st of sc.starts ?? []) {
        const start = typeof st === "string" ? st : st.id;
        const b = launchBifurcation({ scenario: sc.id, start });
        expect(b, `${sc.id} ${start}`).not.toBeNull();
        expect(b!.session.state.presetId).toBe(sc.id);
        if (start === "plan") expect(b!.session.state.technique).toBeNull();
        else expect(currentStep(b!.session.state)?.id, `${sc.id} ${start}`).toBe(start.replace(/^[a-z-]+:/, ""));
        // the lesion bench does not take them
        expect(launchBench({ scenario: sc.id, start })).toBeNull();
      }
    }
    for (const e of PRACTICE_INDEX.byLesson.get(LESSONS[0]) ?? []) if (e.source.endsWith(FILE)) expect(launchBifurcation(e.params), e.scenario).not.toBeNull();
  });

  it("a lesson can link a preset at a technique step: {preset, start} and {preset, technique, step} open at the same step and validate", () => {
    const known = buildKnownLaunch({ [FILE]: { launch } });
    const links: LaunchParams[] = [
      { preset: "bif-dk-crush", start: "crush" },
      { preset: "bif-dk-crush", technique: "dk-crush", step: "6" },
      { preset: "bif-dk-crush", technique: "dk-crush", step: "crush" },
      { preset: "bif-tap", start: "tap:final-pot", modality: "IVUS", mode: "supervised" },
    ];
    for (const params of links) {
      const errs: string[] = [];
      checkLaunchParams("pci-bench", params, known, "link", errs);
      expect(errs, JSON.stringify(params)).toEqual([]);
    }
    const a = launchBifurcation({ preset: "bif-dk-crush", start: "crush" })!;
    const b = launchBifurcation({ preset: "bif-dk-crush", technique: "dk-crush", step: "6" })!;
    expect(a.session.state.next).toBe(6);
    expect(b.session.state.next).toBe(6);
    expect(bifTipContext(a.session.state)).toEqual(bifTipContext(b.session.state));
    const tap = launchBifurcation({ preset: "bif-tap", start: "tap:final-pot", modality: "IVUS", mode: "supervised" })!;
    expect(tap.session.state.technique).toBe("tap");
    expect(tap.session.modality).toBe("IVUS");
    expect(tap.mode).toBe("supervised");
    expect(launchBifurcation({ preset: "bif-dk-crush", technique: "dk-crush", step: "99" })).toBeNull();
    expect(launchBifurcation({ preset: "bif-dk-crush", technique: "nope" })).toBeNull();
    // a step without its technique (the plan's {preset, step} shape) is read as the start; the validator still
    // asks for the technique, but at run time it opens the bifurcation bench at that step, never anything else
    for (const step of ["crush", "6"]) {
      const r = launchBifurcation({ preset: "bif-dk-crush", step })!;
      expect(r, step).not.toBeNull();
      expect(r.session.state.technique, step).toBe("dk-crush");
      expect(r.session.state.next, step).toBe(6);
    }
    const errs: string[] = [];
    checkLaunchParams("pci-bench", { preset: "bif-dk-crush", step: "6" }, known, "link", errs);
    expect(errs.length).toBeGreaterThan(0);
  });

  it("a launch naming a bifurcation preset opens the bifurcation bench or nothing, never the lesion bench", () => {
    expect(resolveLaunch({ preset: "bif-dk-crush", step: "crush" })).toMatchObject({ workspace: "bifurcation" });
    expect(resolveLaunch({ scenario: "bif-tap", start: "tap:final-pot" })).toMatchObject({ workspace: "bifurcation" });
    // malformed bifurcation links report failure instead of opening the default lesion
    expect(resolveLaunch({ preset: "bif-dk-crush", step: "nope" })).toBeNull();
    expect(resolveLaunch({ preset: "bif-dk-crush", technique: "dk-crush", step: "99" })).toBeNull();
    expect(resolveLaunch({ scenario: "bif-dk-crush", technique: "nope" })).toBeNull();
    // the workspace alone opens the first bifurcation preset at the technique choice
    const ws = resolveLaunch({ workspace: "bifurcation" })!;
    expect(ws.workspace).toBe("bifurcation");
    if (ws.workspace === "bifurcation") {
      expect(ws.session.state.presetId).toBe(BIF_PRESETS[0].id);
      expect(ws.session.state.technique).toBeNull();
    }
    // the lesion bench is unchanged
    expect(resolveLaunch({ scenario: Object.keys(BENCH_BY_ID)[0] })).toMatchObject({ workspace: "lesion" });
    expect(resolveLaunch({})).toMatchObject({ workspace: "lesion" });
    expect(resolveLaunch({ scenario: "no-such-lesion" })).toBeNull();
  });
});

describe("tips from the bifurcation presets", () => {
  it("bif-tap: after the action that raises side-branch-compromise, the TAP steps bring pci-tap-protrusion and pci-tap-final-pot", () => {
    let s = launchBifurcation({ scenario: "bif-tap", start: "wire-both" })!.session.state;
    expect(s.technique).toBe("provisional");
    s = runReference(s, 4);
    expect(bifTipContext(s).events).not.toContain("side-branch-compromise");
    // step 4 deploys the LAD stent over the jailed diagonal wire: the action that raises it
    s = next(s);
    expect(bifTipContext(s).events).toContain("side-branch-compromise");
    s = runReference(s, stepCount("provisional"));
    // the diagonal still needs a stent after rewiring, kissing and final POT: bail out to TAP
    s = escalate(s, "tap").state;
    s = runReference(s, 3);
    const atProtrusion = bifTipContext(s, "IVUS");
    expect(atProtrusion).toMatchObject({ lab: "pci", phase: "stent", technique: "tap", step: 3, imaging: "ivus" });
    expect(atProtrusion.events).toEqual(expect.arrayContaining(["bifurcation", "side-branch-compromise"]));
    expect(ids(atProtrusion)).toContain("pci-tap-protrusion");
    s = runReference(s, 7);
    const atFinalPot = bifTipContext(s, "IVUS");
    expect(atFinalPot).toMatchObject({ phase: "optimise", technique: "tap", step: 7 });
    expect(atFinalPot.events).toContain("side-branch-compromise");
    expect(ids(atFinalPot)).toContain("pci-tap-final-pot");
    // the two tips name different phases (stent, optimise), so each shows at its own TAP step
    expect(ids(atFinalPot)).not.toContain("pci-tap-protrusion");
    // once the bail-out run is over the side branch is stented and kissed: the event is no longer held
    const done = runReference(s, 99);
    expect(bifTipContext(done).events).not.toContain("side-branch-compromise");
    expect(ids(bifTipContext(done))).not.toContain("pci-optimise-side-branch-loss");
  });

  it("bif-provisional: after the MV stent jails the diagonal, the POT and side-branch assessment tips show", () => {
    let s = launchBifurcation({ scenario: "bif-provisional", start: "pot" })!.session.state;
    const ctx = bifTipContext(s);
    expect(ctx).toMatchObject({ phase: "optimise", technique: "provisional", step: 5 });
    expect(ctx.events).toContain("side-branch-compromise");
    expect(ids(ctx)).toEqual(expect.arrayContaining(["pci-bif-pot-size-position", "pci-bif-assess-side-branch"]));
    s = runReference(s, 8);
    expect(ids(bifTipContext(s))).toEqual(expect.arrayContaining(["pci-bif-kissing-size"]));
  });

  it("at the plan phase the two-stent planning tips show; the left main preset adds its vessel", () => {
    const plan = bifTipContext(launchBifurcation({ scenario: "bif-dk-crush" })!.session.state);
    expect(plan).toMatchObject({ lab: "pci", phase: "plan", vessel: "LM" });
    expect(tipsFor(plan, 60).map((t) => t.id)).toEqual(expect.arrayContaining(["pci-dkcrush-sb-protrusion", "pci-twostent-two-step-kiss", "pci-twostent-final-pot"]));
  });
});

describe("waiting.ts entries naming this package", () => {
  it("there are none, so none is left unsatisfiable and the pci waiting count does not grow", () => {
    expect(WAITING_TIPS.filter((g) => g.raisedBy === PKG)).toEqual([]);
  });
});
