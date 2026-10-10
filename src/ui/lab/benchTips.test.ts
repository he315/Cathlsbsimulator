// The IVUS and OCT bench's tip context (pci-bench-imaging-unify).
//   npx vitest run src/ui/lab/benchTips.test.ts
import { describe, expect, it } from "vitest";
import { LAB_EVENTS, LAB_PHASES } from "../../content/lab/tips";
import { BENCH_BY_ID, BENCH_LESIONS, applyPrep, deploy, initialState, preImaging, type PrepAction } from "../../simulation/pciBench";
import { BENCH_EVENT_TIPS, BENCH_STEPS, benchCaseEvents, benchEvents, benchTipContext, benchVessel, raises } from "./benchTips";

const prep = (id: string, actions: PrepAction[]) => actions.reduce((s, a) => applyPrep(BENCH_BY_ID[id], s, a), initialState());

describe("bench tip context", () => {
  it("calcified RCA after a 2.5 mm non-compliant balloon at 12 atm: phase lesion-prep with balloon-undilatable", () => {
    const l = BENCH_BY_ID["calcified-rca"];
    const st = prep("calcified-rca", [{ kind: "balloon", balloon: "non-compliant", diameter: 2.5, atm: 12 }]);
    const ctx = benchTipContext(l, "prep", st, null, "IVUS");
    expect(ctx.lab).toBe("pci");
    expect(ctx.phase).toBe("lesion-prep");
    expect(ctx.events).toContain("balloon-undilatable");
    expect(ctx.events).toContain("calcified-lesion");
    expect(ctx.vessel).toBe("RCA");
    expect(ctx.imaging).toBe("ivus");
  });

  it("distal-lm gives vessel LM, with the left main, bifurcation and large-vessel case events", () => {
    const l = BENCH_BY_ID["distal-lm"];
    expect(benchVessel(l)).toBe("LM");
    const ctx = benchTipContext(l, "image", initialState(), null, "IVUS");
    expect(ctx.vessel).toBe("LM");
    expect(ctx.events).toEqual(expect.arrayContaining(["left-main-lesion", "bifurcation", "large-vessel"]));
  });

  it("the image step is plan until a modality is chosen, then imaging with the modality; each step has its phase", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const st = initialState();
    expect(benchTipContext(l, "image", st, null, null)).toMatchObject({ phase: "plan" });
    expect(benchTipContext(l, "image", st, null, null).imaging).toBeUndefined();
    expect(benchTipContext(l, "image", st, null, "OCT")).toMatchObject({ phase: "imaging", imaging: "oct" });
    const phases = BENCH_STEPS.map((s) => benchTipContext(l, s, st, null, "IVUS").phase);
    expect(phases).toEqual(["imaging", "lesion-prep", "stent", "optimise", "imaging"]);
  });

  it("vessel-size and length classes come from the reference lumen and the lesion length", () => {
    // long-taper: 28 mm of disease
    expect(benchCaseEvents(BENCH_BY_ID["long-taper"])).toContain("long-lesion");
    // focal LAD: a 3.4 mm proximal and a 3.0 mm distal reference lumen, 12 mm long: no size class
    const focal = benchCaseEvents(BENCH_BY_ID["focal-lad"]);
    expect(focal).not.toContain("large-vessel");
    expect(focal).not.toContain("small-vessel");
    expect(focal).not.toContain("long-lesion");
    // the left main's proximal reference lumen is over 4.0 mm
    expect(preImaging(BENCH_BY_ID["distal-lm"], "IVUS").proxRefLumen).toBeGreaterThanOrEqual(4);
    // small diagonal: a distal reference lumen under 2.5 mm with a larger EEM (outward remodelling), 10 mm long
    const small = preImaging(BENCH_BY_ID["small-diagonal"], "IVUS");
    expect(small.distRefLumen).toBeLessThan(2.5);
    expect(small.distRefEem).toBeGreaterThan(small.distRefLumen);
    const sd = benchCaseEvents(BENCH_BY_ID["small-diagonal"]);
    expect(sd).toContain("small-vessel");
    expect(sd).not.toContain("large-vessel");
    expect(sd).not.toContain("long-lesion");
    expect(benchVessel(BENCH_BY_ID["small-diagonal"])).toBeUndefined();
  });

  it("an expansion under 80% raises stent-underexpanded once the stent is deployed, not before", () => {
    const l = BENCH_BY_ID["calcified-rca"];
    const st = prep("calcified-rca", [{ kind: "balloon", balloon: "semi-compliant", diameter: 3.0, atm: 12 }]);
    const r = deploy(l, st, { diameter: 3.5, lengthMm: 23, proxEdge: 9, atm: 14 }, [], "IVUS");
    expect(r.expansion).toBeLessThan(80);
    expect(benchEvents(l, "optimise", st, r)).toContain("stent-underexpanded");
    expect(benchEvents(l, "assess", st, r)).toContain("stent-underexpanded");
    expect(benchEvents(l, "stent", st, r)).not.toContain("stent-underexpanded");
  });

  it("a perforation, dissection or no-reflow adds the complication phase", () => {
    const l = BENCH_BY_ID["calcified-rca"];
    const st = prep("calcified-rca", [{ kind: "rota", burrMm: 2.5 }]);
    const ctx = benchTipContext(l, "prep", st, null, "IVUS");
    expect(ctx.events).toContain("perforation");
    expect(ctx.phases).toEqual(["complication"]);
    expect(benchTipContext(BENCH_BY_ID["focal-lad"], "prep", initialState(), null, "IVUS").phases).toBeUndefined();
  });

  it("a minor no-reflow event (transient slow flow) raises slow-flow only; the major post-dilatation no-reflow raises both", () => {
    const l = BENCH_BY_ID["lipid-acs"];
    const st = prep("lipid-acs", [{ kind: "balloon", balloon: "semi-compliant", diameter: 3.5, atm: 8 }]);
    expect(st.events.some((e) => e.kind === "no-reflow" && e.severity === "minor")).toBe(true);
    const ctx = benchTipContext(l, "prep", st, null, "OCT");
    expect(ctx.events).toContain("slow-flow");
    expect(ctx.events).not.toContain("no-reflow");
    expect(ctx.phases).toBeUndefined();
    const r = deploy(l, initialState(), { diameter: 3.5, lengthMm: 20, proxEdge: 8, atm: 12 }, [{ diameter: 4.0, atm: 20, where: "full" }], "OCT");
    expect(r.events.some((e) => e.kind === "no-reflow" && e.severity === "major")).toBe(true);
    const after = benchTipContext(l, "optimise", initialState(), r, "OCT");
    expect(after.events).toEqual(expect.arrayContaining(["no-reflow", "slow-flow"]));
    expect(after.phases).toEqual(["complication"]);
  });

  it("raises uses the shared vocabulary and claims only what the lesions and the procedure can raise", () => {
    const phases = LAB_PHASES.pci as readonly string[];
    for (const p of raises.phases) expect(phases).toContain(p);
    for (const e of raises.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
    for (const evs of Object.values(BENCH_EVENT_TIPS)) for (const e of evs) expect(raises.events).toContain(e);
    for (const l of BENCH_LESIONS) for (const e of benchCaseEvents(l)) expect(raises.events).toContain(e);
    expect(raises.events).toContain("stent-underexpanded");
    // the small-diagonal lesion's distal reference lumen is under 2.5 mm, so small-vessel is claimed
    expect(raises.events).toContain("small-vessel");
    expect(raises.imaging).toEqual(["ivus", "oct"]);
  });
});
