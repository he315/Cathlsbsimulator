// physiology-left-main-and-ostial: the left main and aorto-ostial presets of physiology.ts show their
// teaching points (lessons pm-physiology-subsets, cp-left-main-assess, cp-ostial-assess), and the
// seated-guide obstruction is calibrated to the study Brilakis cites (module cp-ostial).
//   npx vitest run src/simulation/physiology.leftMain.test.ts
import { describe, expect, it } from "vitest";
import {
  CUTOFF,
  LEFT_MAIN_PRESETS,
  LEFT_MAIN_PRESET_BY_ID,
  OSTIAL_RCA,
  PHYS_BY_ID,
  aorticPressure,
  bifurcationPos,
  branchView,
  ffr,
  ffrVenousCorrected,
  flow,
  presetView,
  pullback,
  reading,
  indices,
  restingIndices,
  warmPhysiology,
  withSideHoles,
  withoutLesions,
  type CoronaryCase,
} from "./physiology";
import { classifyTip } from "./patient/transducer";
import { LEFT_MAIN_LAUNCH_ENABLED, LEFT_MAIN_SCENARIOS, launch } from "../content/lab/presets/physiology/leftMain.launch";

const M = (id: string) => LEFT_MAIN_PRESET_BY_ID[id].model!;
const V = (id: string, branch?: string) => presetView(LEFT_MAIN_PRESET_BY_ID[id], branch);

/** Steps of a hyperaemic pullback (distal → ostium) larger than `min`, with where they happen (x along the path). */
function steps(c: CoronaryCase, min = 0.05, n = 60): { x: number; d: number }[] {
  const pb = pullback(c, 1, n);
  return pb
    .slice(1)
    .map((p, i) => ({ x: (p.x + pb[i].x) / 2, d: p.ratio - pb[i].ratio }))
    .filter((s) => s.d > min);
}
/** Steps inside the left main (between the ostium and the bifurcation). */
const lmSteps = (c: CoronaryCase, min = 0.05) => steps(c, min).filter((s) => s.x <= bifurcationPos(c)! + 1e-9);

/** The engaged guide's pressure classified as the pressure-wire session does it (transducer.classifyTip at the ostium). */
function guideClass(c: CoronaryCase, h: number): string {
  let ts = -Infinity,
    td = Infinity,
    as = -Infinity,
    ad = Infinity;
  for (let i = 0; i < 120; i++) {
    const ph = i / 120;
    const p = reading(c, (ph * 60) / 70, 0, h, true, 0).pa;
    const a = aorticPressure(c.map, ph);
    ts = Math.max(ts, p);
    td = Math.min(td, p);
    as = Math.max(as, a);
    ad = Math.min(ad, a);
  }
  return classifyTip({ location: "ostium" }, ts, td, as, ad);
}

describe("the presets", () => {
  it("are the ten the plan names, with titles that do not give the answer away", () => {
    expect(LEFT_MAIN_PRESETS.map((p) => p.id).sort()).toEqual(
      ["lm-significant", "lm-ostial-lcx", "lm-masked-by-lad", "lm-jailed-lcx-075", "lm-jailed-lcx-085", "lm-discordant", "lm-high-ra", "ostial-lm-damped", "ostial-rca-engaged", "lm-intermediate"].sort()
    );
    // the pressure-wire session's rule for preset titles (pwSession.test.ts), and no verdicts
    for (const p of LEFT_MAIN_PRESETS) expect(p.title, p.id).not.toMatch(/pitfall|drift|wedge|air|contrast|introducer|zero|deform|offset|circumflex|mask|significant|discordan|damp|jailed lcx|ffr/i);
    // ids do not collide with the core presets' cases
    for (const p of LEFT_MAIN_PRESETS) expect(PHYS_BY_ID[p.id]).toBeUndefined();
  });

  it("leftMain.launch.ts declares every preset and no other, with the presets' own titles (published only once the lab registers them)", () => {
    expect(launch.sim).toBe("physiology");
    expect(LEFT_MAIN_SCENARIOS.map((s) => s.id).sort()).toEqual(LEFT_MAIN_PRESETS.map((p) => p.id).sort());
    for (const p of LEFT_MAIN_PRESETS) expect(LEFT_MAIN_SCENARIOS.find((s) => s.id === p.id)!.title, p.id).toBe(p.title);
    expect(launch.scenarios).toEqual(LEFT_MAIN_LAUNCH_ENABLED ? LEFT_MAIN_SCENARIOS : []);
  });

  it("left main presets report vessel LM with both branches; ostial presets raise aorto-ostial-lesion", () => {
    for (const p of LEFT_MAIN_PRESETS) {
      if (p.model) {
        expect(p.case.vessel, p.id).toBe("LM");
        expect(p.branches.map((b) => b.id)).toEqual(["LAD", "LCx"]);
        expect(p.events).toContain("left-main-lesion");
      } else expect(p.branches).toEqual([]);
    }
    expect(LEFT_MAIN_PRESET_BY_ID["ostial-lm-damped"].events).toContain("aorto-ostial-lesion");
    expect(LEFT_MAIN_PRESET_BY_ID["ostial-rca-engaged"].events).toContain("aorto-ostial-lesion");
    expect(LEFT_MAIN_PRESET_BY_ID["lm-significant"].events).not.toContain("aorto-ostial-lesion");
    // the jailed branch is assessed first
    expect(V("lm-jailed-lcx-075").branched?.branch).toBe("LCx");
  });
});

describe("both branches with pullback localise the step (acceptance)", () => {
  it("'lm-significant': both branches abnormal, and both pullbacks step up across the left main", () => {
    for (const b of ["LAD", "LCx"]) {
      const v = V("lm-significant", b);
      expect(ffr(v), b).toBeLessThanOrEqual(CUTOFF.ffr);
      expect(lmSteps(v).length, b).toBe(1);
      expect(steps(v).length, b).toBe(1);
    }
  });

  it("'lm-ostial-lcx': only the LCx pullback shows a step, at the LCx ostium; the LAD is normal", () => {
    const lad = V("lm-ostial-lcx", "LAD");
    const lcx = V("lm-ostial-lcx", "LCx");
    expect(ffr(lad)).toBeGreaterThan(CUTOFF.ffr);
    expect(ffr(lcx)).toBeLessThanOrEqual(CUTOFF.ffr);
    expect(steps(lad)).toEqual([]);
    const s = steps(lcx);
    expect(s.length).toBe(1);
    // beyond the bifurcation, in the first millimetres of the circumflex: not in the left main
    expect(s[0].x).toBeGreaterThan(bifurcationPos(lcx)!);
    expect(lmSteps(lcx)).toEqual([]);
  });

  it("'lm-masked-by-lad': the LAD lesion hides the left main; removed, the circumflex value falls below 0.80 and the left main step grows", () => {
    const m = M("lm-masked-by-lad");
    const withLad = branchView(m, "LCx");
    const without = branchView(withoutLesions(m, ["lad-proximal"]), "LCx");
    const before = ffr(withLad);
    const after = ffr(without);
    // the circumflex reads normal while the LAD lesion limits the flow the left main carries...
    expect(before).toBeGreaterThan(CUTOFF.ffr);
    // ...and the same left main is significant once the LAD lesion is gone (Brilakis 17.12)
    expect(after).toBeLessThanOrEqual(CUTOFF.ffr);
    expect(after).toBeLessThan(before - 0.03);
    const stepBefore = lmSteps(withLad, 0.01)[0].d;
    const stepAfter = lmSteps(without, 0.01)[0].d;
    expect(stepAfter).toBeGreaterThan(stepBefore);
    // the LAD itself is clearly abnormal, so its value says nothing about the left main
    expect(ffr(branchView(m, "LAD"))).toBeLessThan(0.6);
    // the left main carries less flow with the LAD lesion in place
    expect(flow(branchView(m, "LAD"), 1).q + flow(withLad, 1).q).toBeLessThan(flow(branchView(withoutLesions(m, ["lad-proximal"]), "LAD"), 1).q + flow(without, 1).q);
  });

  it("the session's 'stent' on a path lesion is honoured through the view's lesions (a treated left main restores both branches)", () => {
    const v = V("lm-significant", "LAD");
    const treated = { ...v, lesions: v.lesions.filter((l) => l.id !== "lm") };
    expect(ffr(treated)).toBeGreaterThan(0.95);
    expect(ffr(presetView(LEFT_MAIN_PRESET_BY_ID["lm-significant"], "LCx", ["lm"]))).toBeGreaterThan(0.95);
  });

  it("'lm-intermediate' (the IVUS grey-zone hand-off): both branches above 0.80", () => {
    for (const b of ["LAD", "LCx"]) expect(ffr(V("lm-intermediate", b))).toBeGreaterThan(CUTOFF.ffr);
    expect(M("lm-intermediate").decision).toBe("defer");
  });
});

describe("jailed circumflex, discordance and filling pressures", () => {
  it("the jailed circumflex reads about 0.75 in one preset and about 0.85 in the other, though both look 75% narrowed", () => {
    const a = V("lm-jailed-lcx-075", "LCx");
    const b = V("lm-jailed-lcx-085", "LCx");
    expect(ffr(a)).toBeGreaterThan(0.72);
    expect(ffr(a)).toBeLessThan(0.78);
    expect(ffr(b)).toBeGreaterThan(0.82);
    expect(ffr(b)).toBeLessThan(0.88);
    const la = a.lesions.find((l) => l.id === "lcx-jailed")!;
    const lb = b.lesions.find((l) => l.id === "lcx-jailed")!;
    expect(la.looksDs).toBe(0.75);
    expect(lb.looksDs).toBe(0.75);
    expect(M("lm-jailed-lcx-075").decision).toBe("treat");
    expect(M("lm-jailed-lcx-085").decision).toBe("defer");
    // the stented left main and LAD are normal
    expect(ffr(V("lm-jailed-lcx-075", "LAD"))).toBeGreaterThan(0.95);
  });

  it("'lm-discordant': FFR 0.80 or less with a resting wave-free ratio above 0.89 in both branches", () => {
    for (const b of ["LAD", "LCx"]) {
      const v = V("lm-discordant", b);
      expect(ffr(v), b).toBeLessThanOrEqual(CUTOFF.ffr);
      expect(restingIndices(v).nhpr, b).toBeGreaterThan(CUTOFF.nhpr);
    }
  });

  it("'lm-high-ra': Pd/Pa reads above 0.80 while the venous-corrected FFR is 0.80 or less; the same lesion reads lower at a normal right atrial pressure", () => {
    const v = V("lm-high-ra", "LAD");
    expect(v.pv).toBe(22);
    expect(ffr(v)).toBeGreaterThan(CUTOFF.ffr);
    expect(ffrVenousCorrected(v)).toBeLessThanOrEqual(CUTOFF.ffr);
    expect(ffr(branchView({ ...M("lm-high-ra"), pv: 5 }, "LAD"))).toBeLessThan(ffr(v));
    expect(M("lm-high-ra").decision).toBe("imaging");
  });
});

/**
 * Intermediate reference lesions for the seated-guide fit: focal stenoses near the ostium of a 3.0-3.5
 * mm vessel, disengaged FFR around the study's mean (0.83). MODEL PARAMETERS of the fit, not data.
 */
const OSTIAL_REFERENCE_LESIONS: CoronaryCase[] = (
  [
    [3.5, 0.6, 8],
    [3.5, 0.65, 8],
    [3.0, 0.55, 10],
    [3.0, 0.6, 10],
    [3.2, 0.62, 8],
    [3.5, 0.68, 6],
    [3.0, 0.5, 12],
    [3.2, 0.58, 10],
  ] as const
).map(([refDiamMm, ds, lengthMm]) => ({
  ...PHYS_BY_ID["rca-negative"],
  id: `ostial-ref-${refDiamMm}-${ds}`,
  refDiamMm,
  lesions: [{ id: "ostium", pos: 0.02, ds, lengthMm }],
  cfrPotential: 3.6,
  guideObstructs: true,
  ostialGuide: true,
}));

describe("aorto-ostial measurement with the guide seated or disengaged (acceptance)", () => {
  it("the fit: over the reference lesions the seated guide reads FFR about 0.04 high without side holes and about 0.02 with them", () => {
    const err = (side: boolean) => OSTIAL_REFERENCE_LESIONS.reduce((s, c) => s + ffr(withSideHoles(c, side), 1, true) - ffr(c, 1, false), 0) / OSTIAL_REFERENCE_LESIONS.length;
    const mean = OSTIAL_REFERENCE_LESIONS.reduce((s, c) => s + ffr(c), 0) / OSTIAL_REFERENCE_LESIONS.length;
    expect(mean).toBeGreaterThan(0.78);
    expect(mean).toBeLessThan(0.86);
    expect(err(false)).toBeGreaterThan(0.035);
    expect(err(false)).toBeLessThan(0.045);
    expect(err(true)).toBeGreaterThan(0.015);
    expect(err(true)).toBeLessThan(0.025);
  });

  it("'ostial-rca-engaged': FFR engaged exceeds disengaged by 0.03-0.05 without side holes and by about half that with them", () => {
    const c = V("ostial-rca-engaged");
    expect(c).toBe(OSTIAL_RCA);
    const off = ffr(c, 1, false);
    const on = ffr(c, 1, true);
    const onSide = ffr(withSideHoles(c, true), 1, true);
    expect(on - off).toBeGreaterThanOrEqual(0.03);
    expect(on - off).toBeLessThanOrEqual(0.05);
    const ratio = (onSide - off) / (on - off);
    expect(ratio).toBeGreaterThan(0.35);
    expect(ratio).toBeLessThan(0.65);
    // the seated guide turns a significant lesion into an apparently negative one
    expect(off).toBeLessThanOrEqual(CUTOFF.ffr);
    expect(on).toBeGreaterThan(CUTOFF.ffr);
  });

  it("the error comes through the obstruction path: the seated guide limits hyperaemic flow, and the guide's own pressure is damped", () => {
    const c = OSTIAL_RCA;
    expect(flow(c, 1, true).q).toBeLessThan(flow(c, 1, false).q * 0.95);
    // the aortic pressure itself is unchanged; the guide tip reads below it in diastole (damped), and
    // only while engaged
    expect(["damped", "ventricularised"]).toContain(guideClass(c, 0));
    expect(["damped", "ventricularised"]).toContain(guideClass(c, 1));
    // with side holes the trace looks normal at rest although the tip still obstructs at hyperaemia
    expect(guideClass(withSideHoles(c, true), 0)).toBe("aortic");
    expect(flow(withSideHoles(c, true), 1, true).q).toBeLessThan(flow(c, 1, false).q);
  });

  it("'ostial-lm-damped': the seated guide damps the trace and lifts both branches above 0.80; disengaged both are 0.80 or less", () => {
    for (const b of ["LAD", "LCx"]) {
      const v = V("ostial-lm-damped", b);
      const off = ffr(v, 1, false);
      const on = ffr(v, 1, true);
      expect(off, b).toBeLessThanOrEqual(CUTOFF.ffr);
      expect(on, b).toBeGreaterThan(CUTOFF.ffr);
      // the per-vessel fit taken per branch in the left main (MP_OSTIAL_GUIDE): about 0.06, a model
      // extrapolation of the cited single-vessel mean of 0.04 (individual lesions vary around it), not the
      // 0.10 the guide would give on the total flow. Pinned so the value cannot drift unnoticed.
      expect(on - off, b).toBeGreaterThanOrEqual(0.05);
      expect(on - off, b).toBeLessThanOrEqual(0.07);
      expect(["damped", "ventricularised"]).toContain(guideClass(v, 0));
    }
    expect(M("ostial-lm-damped").guideSideHoles).toBeFalsy();
  });

  it("a seated guide makes the resting indices read high as well, never low (Brilakis 12.3: damping makes FFR and resting indices artificially high)", () => {
    const views = [V("ostial-rca-engaged"), V("ostial-lm-damped", "LAD"), V("ostial-lm-damped", "LCx")];
    for (const v of views) {
      const on = indices(v, 1, 0, true);
      const off = indices(v, 1, 0, false);
      expect(on.wfpRatio, v.id).toBeGreaterThan(off.wfpRatio);
      expect(on.pdpa, v.id).toBeGreaterThan(off.pdpa);
      // the resting flow falls while the guide obstructs: the microcirculation is not re-set around the guide
      expect(flow(v, 0, true).q, v.id).toBeLessThan(flow(v, 0, false).q);
    }
  });

  it("presets without an ostial lesion do not obstruct with the guide engaged", () => {
    for (const p of LEFT_MAIN_PRESETS.filter((x) => !["ostial-lm-damped", "ostial-rca-engaged"].includes(x.id))) {
      const v = presetView(p);
      expect(v.guideObstructs, p.id).toBeFalsy();
      expect(ffr(v, 1, true)).toBe(ffr(v, 1, false));
    }
  });
});

describe("decisions follow the module's rules", () => {
  it("each preset's decision matches its physiology", () => {
    const min = (id: string) => Math.min(...["LAD", "LCx"].map((b) => ffr(V(id, b))));
    expect(min("lm-significant")).toBeLessThanOrEqual(CUTOFF.ffr);
    expect(M("lm-significant").decision).toBe("treat");
    expect(M("lm-ostial-lcx").decision).toBe("treat");
    expect(M("lm-masked-by-lad").decision).toBe("imaging");
    // imaging is the alternative in the left main, not a requirement: the serial-lesion route is accepted too
    expect(M("lm-masked-by-lad").alsoAccepted).toEqual(["treat-first-then-remeasure"]);
    expect(V("lm-masked-by-lad").alsoAccepted).toEqual(["treat-first-then-remeasure"]);
    expect(M("lm-discordant").decision).toBe("treat");
    expect(M("ostial-lm-damped").decision).toBe("treat");
    expect(OSTIAL_RCA.decision).toBe("treat");
    expect(min("lm-intermediate")).toBeGreaterThan(CUTOFF.ffr);
  });
});

describe("the render path of a branch view", () => {
  it("reuses its scratch buffers without changing the readings: the same sample gives the same values after other samples", () => {
    const v = V("lm-significant", "LCx");
    warmPhysiology(v);
    const first = reading(v, 0.3, 0.7, 1, false, 0);
    for (let i = 0; i < 50; i++) reading(v, i * 0.017, i / 50, i % 2 ? 0 : 0.5, false, 0);
    reading(branchView(M("lm-significant"), "LAD"), 0.3, 0.7, 1, false, 0);
    expect(reading(v, 0.3, 0.7, 1, false, 0)).toEqual(first);
  });
});
