import { describe, it, expect } from "vitest";
import {
  PHYSIOLOGY_CASES,
  PHYS_BY_ID,
  CUTOFF,
  ffr,
  restingIndices,
  pullback,
  thermodilution,
  reading,
  flow,
  lesionCoeffs,
  indices,
  resistances,
  toBranched,
  branchView,
  indicesBranched,
  pullbackBranched,
  solveJunction,
  aorticPressure,
  compression,
  JUNCTION_MAX_ITER,
  LEFT_MAIN_PRESET_BY_ID,
  CUTOFF_SOURCES,
  MP_TD_CV,
  MP_TD_CV_INCONSISTENT,
  TD_AGREEMENT,
  distalBeat,
  hyperaemiaMarkers,
  tdAgree,
  tdInjectionConsistent,
  tdSpread,
  waveformChange,
  type BranchedCase,
  type CoronaryCase,
} from "./physiology";
import { MP_SUBMAXIMAL_H } from "./pci/pwSession";

const single = (ds: number): CoronaryCase => ({
  ...PHYS_BY_ID["lad-intermediate"],
  diffuse: 0.05,
  lesions: [{ id: "x", pos: 0.4, ds, lengthMm: 10 }],
});

describe("stenosis physics", () => {
  it("pressure-loss coefficients rise steeply with severity and with length", () => {
    const a = lesionCoeffs({ id: "a", pos: 0.5, ds: 0.5, lengthMm: 10 }, 3);
    const b = lesionCoeffs({ id: "b", pos: 0.5, ds: 0.7, lengthMm: 10 }, 3);
    const c = lesionCoeffs({ id: "c", pos: 0.5, ds: 0.7, lengthMm: 20 }, 3);
    expect(b.A).toBeGreaterThan(a.A * 5);
    expect(b.B).toBeGreaterThan(a.B * 5);
    expect(c.A).toBeCloseTo(2 * b.A, 6);
    expect(c.B).toBeCloseTo(b.B, 6);
  });

  it("FFR falls monotonically with diameter stenosis", () => {
    let prev = 1.01;
    for (const ds of [0.2, 0.4, 0.5, 0.6, 0.7, 0.8]) {
      const v = ffr(single(ds));
      expect(v).toBeLessThan(prev);
      prev = v;
    }
  });

  it("a 60% focal lesion sits near the familiar thresholds for FFR, resting Pd/Pa and the wave-free ratio", () => {
    const c = single(0.6);
    const f = ffr(c);
    const r = restingIndices(c);
    expect(f).toBeGreaterThan(0.72);
    expect(f).toBeLessThan(0.82);
    expect(r.nhpr).toBeGreaterThan(0.84);
    expect(r.nhpr).toBeLessThan(0.92);
    expect(r.pdpa).toBeGreaterThan(r.nhpr); // whole-cycle resting ratio is less severe than diastolic
    expect(f).toBeLessThan(r.nhpr); // hyperaemia exaggerates the gradient
  });

  it("distal pressure never falls below venous pressure and Pd ≤ Pa with no drift", () => {
    const c = single(0.9);
    for (let t = 0; t < 1; t += 0.01) {
      const r = reading(c, t, 1, 1, false, 0);
      expect(r.pd).toBeGreaterThanOrEqual(4.99);
      expect(r.pd).toBeLessThanOrEqual(r.pa + 1e-9);
    }
  });

  it("resting flow is held by autoregulation until reserve is exhausted", () => {
    expect(flow(single(0.5), 0).q).toBeCloseTo(1, 2);
    expect(flow(single(0.85), 0).q).toBeLessThan(0.99);
  });

  it("coronary flow is mostly diastolic", () => {
    const c = single(0.3);
    const sys = reading(c, 0.25 * (60 / 70), 1, 0, false, 0).q;
    const dia = reading(c, 0.7 * (60 / 70), 1, 0, false, 0).q;
    expect(dia).toBeGreaterThan(2 * sys);
  });
});

describe("teaching cases", () => {
  it("each case leads to its intended decision", () => {
    expect(ffr(PHYS_BY_ID["lad-intermediate"])).toBeLessThanOrEqual(CUTOFF.ffr);
    expect(ffr(PHYS_BY_ID["rca-negative"])).toBeGreaterThan(CUTOFF.ffr);
    expect(ffr(PHYS_BY_ID.diffuse)).toBeLessThanOrEqual(0.82);
    const anoca = thermodilution(PHYS_BY_ID.anoca);
    expect(anoca.ffr).toBeGreaterThan(CUTOFF.ffr);
    expect(anoca.cfr).toBeLessThan(CUTOFF.cfr);
    expect(anoca.imr).toBeGreaterThanOrEqual(CUTOFF.imr);
  });

  it("normal microcirculation gives normal CFR and IMR", () => {
    const td = thermodilution(PHYS_BY_ID["rca-negative"]);
    expect(td.cfr).toBeGreaterThan(CUTOFF.cfr);
    expect(td.imr).toBeLessThan(CUTOFF.imr);
  });

  it("a wedged guide makes FFR read falsely normal", () => {
    const c = PHYS_BY_ID["guide-wedge"];
    expect(ffr(c)).toBeLessThanOrEqual(CUTOFF.ffr);
    expect(ffr(c, 1, true)).toBeGreaterThan(CUTOFF.ffr);
  });

  it("sensor drift pushes a positive FFR above the threshold", () => {
    const c = PHYS_BY_ID.drift;
    expect(ffr(c)).toBeLessThanOrEqual(CUTOFF.ffr);
    expect(ffr(c, 1, false, c.drift)).toBeGreaterThan(CUTOFF.ffr);
  });

  it("tandem lesions: the pullback shows two steps and lesions interact", () => {
    const c = PHYS_BY_ID.tandem;
    const pb = pullback(c, 1, 40);
    const steps = pb.slice(1).map((p, i) => p.ratio - pb[i].ratio);
    const big = steps.filter((d) => d > 0.05);
    expect(big.length).toBe(2);
    const afterMid = { ...c, lesions: c.lesions.filter((l) => l.id !== "mid") };
    const proxAlone = ffr(afterMid);
    // In tandem the distal lesion limits flow, so the proximal lesion's own step is smaller than
    // its gradient once the distal lesion is treated: hence "treat one, then re-measure".
    const stepProxInTandem = pb.find((p) => p.x < 0.2)!.ratio - pb.find((p) => p.x > 0.2 && p.x < 0.55)!.ratio;
    expect(1 - proxAlone).toBeGreaterThan(stepProxInTandem);
  });

  it("diffuse disease declines gradually without a dominant step", () => {
    const pb = pullback(PHYS_BY_ID.diffuse, 1, 40);
    const steps = pb.slice(1).map((p, i) => p.ratio - pb[i].ratio);
    expect(Math.max(...steps)).toBeLessThan(0.05);
    expect(pb[pb.length - 1].ratio - pb[0].ratio).toBeGreaterThan(0.15);
  });

  it("all cases have unique ids", () => {
    expect(new Set(PHYSIOLOGY_CASES.map((c) => c.id)).size).toBe(PHYSIOLOGY_CASES.length);
  });
});

describe("branched left main solver (physiology-left-main-and-ostial, acceptance)", () => {
  it("an unbranched case gives identical results through the branched solver", () => {
    for (const c of PHYSIOLOGY_CASES) {
      const bc = toBranched(c);
      for (const x of [0, 0.3, 0.5, 1])
        for (const h of [0, 0.5, 1])
          for (const engaged of [false, true]) {
            const a = indices(c, x, h, engaged, 0.5);
            const b = indicesBranched(bc, c.vessel, x, h, engaged, 0.5);
            expect(b.pdpa, `${c.id} x=${x} h=${h} engaged=${engaged}`).toBe(a.pdpa);
            expect(b.wfpRatio).toBe(a.wfpRatio);
            expect(b.q).toBe(a.q);
          }
      const v = branchView(bc, c.vessel);
      expect(resistances(v, false)).toEqual(resistances(c, false));
      expect(flow(v, 0.7)).toEqual(flow(c, 0.7));
      expect(thermodilution(v)).toEqual(thermodilution(c));
      expect(pullbackBranched(bc, c.vessel, 1, 20)).toEqual(pullback(c, 1, 20));
    }
  });

  const lm95 = (ds: number): BranchedCase => {
    const m = LEFT_MAIN_PRESET_BY_ID["lm-significant"].model!;
    return { ...m, lm: { ...m.lm, lesions: [{ ...m.lm.lesions[0], ds }] } };
  };

  it("the junction solver converges at 95% diameter stenosis, at every phase, at rest and at hyperaemia", () => {
    const bc = lm95(0.95);
    // the resistances the solver uses for this network (autoregulated at rest, minimal at hyperaemia)
    const R = bc.branches.map((b) => resistances(branchView(bc, b.id)));
    const ks = bc.branches.map((b) => {
      const k = b.case.lesions.reduce((acc, l) => ({ A: acc.A + lesionCoeffs(l, b.case.refDiamMm).A, B: acc.B + lesionCoeffs(l, b.case.refDiamMm).B }), { A: 0, B: 0 });
      return k;
    });
    const up = lesionCoeffs(bc.lm.lesions[0], bc.lm.refDiamMm);
    let maxIt = 0;
    for (const h of [0, 1])
      for (let i = 0; i < 120; i++) {
        const ph = i / 120;
        const Rs = R.map((r) => (r.rRest - h * (r.rRest - r.rHyp)) * compression(ph));
        const drive = aorticPressure(bc.map, ph) - 5;
        const sol = solveJunction(drive, up, Rs, ks);
        expect(sol.converged, `h=${h} phase=${ph}`).toBe(true);
        maxIt = Math.max(maxIt, sol.iterations);
        // the balance holds: drive - u = LM loss(Q total), and each branch carries its own flow at u
        expect(drive - sol.u - (up.A * sol.qTotal + up.B * sol.qTotal ** 2)).toBeCloseTo(0, 6);
        sol.q.forEach((q, j) => expect(Rs[j] * q + ks[j].A * q + ks[j].B * q * q).toBeCloseTo(sol.u, 6));
        expect(sol.qTotal).toBeCloseTo(sol.q[0] + sol.q[1], 12);
      }
    expect(maxIt).toBeLessThan(JUNCTION_MAX_ITER);
    // and the indices are sane: severe, ordered by severity, distal pressure above venous
    const v = branchView(bc, "LAD");
    const f95 = ffr(v);
    expect(Number.isFinite(f95)).toBe(true);
    expect(f95).toBeGreaterThan(0.05);
    expect(f95).toBeLessThan(ffr(branchView(lm95(0.9), "LAD")));
    for (let t = 0; t < 1; t += 0.05) expect(reading(v, t, 1, 1, false, 0).pd).toBeGreaterThanOrEqual(4.99);
  });

  it("a left main lesion lowers both branches; a branch lesion lowers its own branch most (parallel branches share the left main)", () => {
    const bc = LEFT_MAIN_PRESET_BY_ID["lm-ostial-lcx"].model!;
    const lad = ffr(branchView(bc, "LAD"));
    const lcx = ffr(branchView(bc, "LCx"));
    expect(lcx).toBeLessThan(lad - 0.1);
    const sig = LEFT_MAIN_PRESET_BY_ID["lm-significant"].model!;
    expect(Math.abs(ffr(branchView(sig, "LAD")) - ffr(branchView(sig, "LCx")))).toBeLessThan(0.02);
  });
});

describe("coronary function test physics (physiology-anoca-cft)", () => {
  it("thermodilution without options gives the exact means as before; with a learner-chosen count each state gets that many injections", () => {
    const c = PHYS_BY_ID.anoca;
    const exact = thermodilution(c);
    expect(exact.injections).toBeUndefined();
    expect(thermodilution(c, {})).toEqual(exact);
    const five = thermodilution(c, { injections: 5, seed: "x" });
    expect(five.injections!.rest.length).toBe(5);
    expect(five.injections!.hyp.length).toBe(5);
    // the mean of the last three, close to the exact value with a consistent technique
    expect(Math.abs(five.tmnRest / exact.tmnRest - 1)).toBeLessThan(4 * MP_TD_CV);
    expect(five.cfr).toBeCloseTo(five.tmnRest / five.tmnHyp, 12);
    // the same seed gives the same draws
    expect(thermodilution(c, { injections: 5, seed: "x" })).toEqual(five);
  });

  it("acceptance: three inconsistent injections scatter more than three consistent ones (and agree within 10% less often)", () => {
    const c = PHYS_BY_ID.anoca;
    let g = 0,
      b = 0,
      ag = 0,
      ab = 0;
    const N = 300;
    for (let k = 0; k < N; k++) {
      const good = thermodilution(c, { injections: 3, consistent: true, seed: `s${k}` }).injections!.rest;
      const bad = thermodilution(c, { injections: 3, consistent: false, seed: `s${k}` }).injections!.rest;
      g += tdSpread(good);
      b += tdSpread(bad);
      if (tdAgree(good)) ag++;
      if (tdAgree(bad)) ab++;
    }
    expect(MP_TD_CV_INCONSISTENT).toBeGreaterThan(MP_TD_CV);
    expect(b / N).toBeGreaterThan((2 * g) / N);
    expect(ag).toBeGreaterThan(0.9 * N);
    expect(ab).toBeLessThan(0.6 * N);
  });

  it("three transit times agree within 10%; an injection is consistent when brisk, 3-4 mL and the same volume as the first", () => {
    expect(TD_AGREEMENT).toBe(0.1);
    expect(tdAgree([0.8, 0.84, 0.86])).toBe(true);
    expect(tdAgree([0.8, 0.84, 0.9])).toBe(false);
    expect(tdAgree([0.8, 0.82])).toBe(false);
    expect(tdInjectionConsistent({ volumeMl: 3, brisk: true })).toBe(true);
    expect(tdInjectionConsistent({ volumeMl: 3, brisk: false })).toBe(false);
    expect(tdInjectionConsistent({ volumeMl: 5, brisk: true })).toBe(false);
    expect(tdInjectionConsistent({ volumeMl: 4, brisk: true }, { volumeMl: 3 })).toBe(false);
  });

  it("hyperaemia markers: absent at rest, all present at maximal hyperaemia with IV adenosine; no systemic signs without it", () => {
    for (const c of [PHYS_BY_ID.anoca, PHYS_BY_ID["rca-negative"]]) {
      expect(hyperaemiaMarkers(c, 0, true).confirmed).toBe(false);
      const m = hyperaemiaMarkers(c, 1, true);
      expect(m).toMatchObject({ systemic: true, ventricularised: true, notchLost: true, separated: true, confirmed: true });
      expect(m.separationMmHg).toBeGreaterThan(hyperaemiaMarkers(c, 0, true).separationMmHg);
      expect(hyperaemiaMarkers(c, 1, false).confirmed).toBe(false);
    }
    expect(waveformChange(0)).toBe(0);
    expect(waveformChange(1)).toBe(1);
  });

  it("the markers read as confirmed only once hyperaemia is maximal for the study (the session's submaximal threshold)", () => {
    for (const c of [PHYS_BY_ID.anoca, PHYS_BY_ID["rca-negative"]]) {
      for (let k = 0; k < 90; k++) expect(hyperaemiaMarkers(c, k / 100, true).confirmed).toBe(false);
      expect(hyperaemiaMarkers(c, MP_SUBMAXIMAL_H, true).ventricularised).toBe(true);
      expect(hyperaemiaMarkers(c, MP_SUBMAXIMAL_H, true).notchLost).toBe(true);
    }
  });

  it("the distal beat loses its dicrotic notch and dips in early diastole at hyperaemia", () => {
    const c = PHYS_BY_ID["rca-negative"];
    // the notch: the rebound after the incisura, from phase 0.375 to 0.4125 (80 samples per beat)
    const notchDepth = (pd: number[]) => pd[33] - pd[30];
    const rest = distalBeat(c, 0);
    const hyp = distalBeat(c, 1);
    expect(rest.pd.length).toBe(80);
    expect(notchDepth(rest.pd)).toBeGreaterThan(0.5);
    expect(notchDepth(hyp.pd)).toBeLessThan(0);
    const gap = (b: { pa: number[]; pd: number[] }) => Math.max(...b.pa.map((p, i) => p - b.pd[i]).slice(36, 60));
    expect(gap(hyp)).toBeGreaterThan(gap(rest) + 2);
  });

  it("the cut-offs of the coronary function test are in CUTOFF with their sources", () => {
    expect(CUTOFF.cfr).toBe(2.0);
    expect(CUTOFF.cfrUk).toBe(2.5);
    expect(CUTOFF.imr).toBe(25);
    expect(CUTOFF.cftDrift).toBe(0.03);
    for (const k of ["cfr", "cfrUk", "imr", "ffr", "cftDrift"] as const) expect(CUTOFF_SOURCES[k]).toMatch(/pm-physiology-microvascular/);
  });
});
