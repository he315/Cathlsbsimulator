import { describe, expect, it } from "vitest";
import { drawBurst, initialIndeflator, occluding, pullNegative, screwTo, stepIndeflator, Z_999, MP_BURST_SD } from "./indeflator";
import { DEVICE_BY_ID, chartDiameter, boxLabel } from "./equipment";
import { rngFrom } from "./rng";

function run(rate: number, target: number, seconds: number, rbp = 14, spec = 15) {
  let s = screwTo(initialIndeflator(), target, rate);
  const trace: number[] = [];
  for (let t = 0; t < seconds; t += 0.05) {
    s = stepIndeflator(s, 0.05, rbp, spec).s;
    trace.push(s.atm);
  }
  return { s, trace };
}

describe("indeflator", () => {
  it("the screw rate sets the pressure rise; the first atmospheres are slower while the balloon unfolds", () => {
    const slow = run(1, 10, 12);
    const fast = run(4, 10, 4);
    expect(fast.s.atm).toBeGreaterThan(slow.s.atm);
    expect(fast.s.atm).toBeCloseTo(10, 5);
    // time to 2 atm (unfolding) is longer per atm than from 2 to 6 atm
    const t2 = slow.trace.findIndex((p) => p >= 2) * 0.05;
    const t6 = slow.trace.findIndex((p) => p >= 3.9) * 0.05;
    expect(t2 / 2).toBeGreaterThan((t6 - t2) / 1.9);
    expect(fast.s.maxRise).toBeGreaterThan(3);
  });

  it("deflation to empty takes time that scales with the device's deflation specification", () => {
    const empty = (spec: number) => {
      let s = run(4, 12, 4, 20, spec).s;
      s = pullNegative(s);
      let t = 0;
      while (occluding(s) && t < 60) {
        s = stepIndeflator(s, 0.05, 20, spec).s;
        t += 0.05;
      }
      let tFull = t;
      while (s.fill > 0 && tFull < 60) {
        s = stepIndeflator(s, 0.05, 20, spec).s;
        tFull += 0.05;
      }
      return { occludedFor: t, empty: tFull, count: s.count };
    };
    const small = empty(DEVICE_BY_ID.nc.deflateSpecS!(2.5, 12));
    const big = empty(DEVICE_BY_ID.des.deflateSpecS!(4, 28));
    expect(big.empty).toBeGreaterThan(small.empty);
    // within the labelled specification
    expect(big.empty).toBeLessThanOrEqual(21);
    expect(small.empty).toBeLessThanOrEqual(15);
    expect(small.occludedFor).toBeGreaterThan(1);
    expect(small.count).toBe(1);
  });

  it("records time above the rated burst pressure and the occlusion time of each inflation", () => {
    const r = run(3, 16, 10, 14);
    expect(r.s.tAboveRbp).toBeGreaterThan(3);
    expect(r.s.tOccluded).toBeGreaterThan(8);
    expect(r.s.peak).toBeCloseTo(16, 5);
  });

  it("burst pressures: 99.9% of balloons survive the rated burst pressure (the FDA definition)", () => {
    const rng = rngFrom("burst");
    let failAtRbp = 0;
    let failAtRbp4 = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) {
      const b = drawBurst(rng, 14);
      if (b <= 14) failAtRbp++;
      if (b <= 18) failAtRbp4++;
    }
    expect(failAtRbp / n).toBeLessThan(0.003);
    expect(failAtRbp4 / n).toBeGreaterThan(0.1);
    expect(Z_999 * MP_BURST_SD).toBeGreaterThan(4);
  });

  it("compliance: the stent chart is the published one; a non-compliant balloon grows less than a semi-compliant one", () => {
    expect(chartDiameter(DEVICE_BY_ID.des, 3.0, 9)).toBeCloseTo(2.97, 2);
    expect(chartDiameter(DEVICE_BY_ID.des, 3.5, 16)).toBeCloseTo(3.93, 2);
    const sc = chartDiameter(DEVICE_BY_ID.sc, 3.0, 14) - chartDiameter(DEVICE_BY_ID.sc, 3.0, 6);
    const nc = chartDiameter(DEVICE_BY_ID.nc, 3.0, 20) - chartDiameter(DEVICE_BY_ID.nc, 3.0, 12);
    expect(sc).toBeGreaterThan(1.5 * nc);
    expect(nc / 3.0).toBeLessThan(0.1); // under 10% growth from nominal to RBP
    const label = boxLabel(DEVICE_BY_ID.des, 3.0, 18);
    expect(label.rbpAtm).toBe(16);
    expect(label.nominalAtm).toBe(9);
    expect(label.chart.source).toBe("ifu");
    expect(boxLabel(DEVICE_BY_ID.sc, 2.5, 15).chart.source).toBe("model");
  });
});

// ---------------------------------------------------------------------------
// pci-indeflator: the indeflator driven through the PCI engine (setIndeflator, stepPci,
// pullIndeflatorNegative), its outcomes and the shared lesion-yield model.
//   npx vitest run src/simulation/pci/indeflator.test.ts
// ---------------------------------------------------------------------------
import { holdSeconds, lockScrew, MP_DEFLATE_OF_SPEC, MP_UNFOLD_ATM, secondsAtRbp } from "./indeflator";
import { hasWaist, holdFactor, lesionYield, MP_WAIST_RATIO, waistDiameter } from "./lesionYield";
import { setup, start, wireToTarget, type Setup } from "./testSetup";
import { loadDevice, moveDevice, requestDevice, stepPci, type PciScenario, type PciState } from "../angioPci";
import {
  MP_STENT_EXPANSION_RATIO,
  MP_UNDILATABLE_HOLD_S,
  PREDIL_OUTCOME_WEIGHTS,
  balloonUndilatableNow,
  classifyPredilatation,
  deflate,
  drawPredilatationOutcome,
  imposePredilatationOutcome,
  inflate,
  lesionAngulationDeg,
  lockIndeflator,
  melonSeedRisk,
  predilatationStart,
  pullIndeflatorNegative,
  setIndeflator,
  stentExpansionRatio,
  withdrawBeforeDeflation,
  distalReferenceMm,
  MP_VERY_SMALL_DISTAL_MM,
  SMALL_VESSEL_MM,
} from "./actions/inflation";
import { inflationOf } from "./state";
import { cloneCx } from "../complications/engine";
import { maybeGuideDissection } from "../complications/dissection";

const across = new Map<string, PciState>();
/** The scenario with the wire across the lesion (cached per scenario and seed). */
function wired(su: Setup, seed: number | string = 1): PciState {
  const k = `${su.s.id}:${seed}:${JSON.stringify(su.s.target)}`;
  let st = across.get(k);
  if (!st) {
    st = wireToTarget(su, start(su, { seed }));
    across.set(k, st);
  }
  return st;
}
/** A device loaded (team-assisted) and centred on the lesion. */
function onLesion(su: Setup, st0: PciState, kind: "balloon" | "stent", balloon: "semi-compliant" | "non-compliant", d: number, l: number, offsetMm = 0): PciState {
  const st = loadDevice(st0, kind, balloon, d, l);
  return moveDevice(st, su.g.lesion.centreMm + offsetMm - st.device!.centreMm);
}
/** Step the engine until `until` holds or `maxS` passes; returns the state and the time taken. */
function stepUntil(su: Setup, st0: PciState, dt: number, maxS: number, until: (x: PciState) => boolean): { st: PciState; t: number } {
  let st = st0;
  let t = 0;
  while (t < maxS - 1e-9 && !until(st)) {
    st = stepPci(su.s, su.g, st, dt);
    t += dt;
  }
  return { st, t };
}

describe("the indeflator in the PCI engine (pci-indeflator)", () => {
  it("screwTo 12 atm at 3 atm/s reaches 12 atm after about 4 s of stepPci at 0.25 s (the first 2 atm slower while the balloon unfolds)", () => {
    const su = setup("lad-focal");
    let st = onLesion(su, wired(su), "balloon", "non-compliant", 2.5, 12);
    st = setIndeflator(st, 12, 3);
    const r = stepUntil(su, st, 0.25, 20, (x) => x.ind.atm >= 12 - 1e-9);
    expect(r.st.ind.atm).toBeCloseTo(12, 6);
    // 12 atm at 3 atm/s is 4 s; the unfolding of the first MP_UNFOLD_ATM adds under a second
    expect(r.t).toBeGreaterThanOrEqual(4);
    expect(r.t).toBeLessThanOrEqual(5);
    expect(MP_UNFOLD_ATM).toBe(2);
    // the balloon filled over those seconds and occludes; the needle holds the target
    expect(r.st.ind.fill).toBe(1);
    expect(r.st.device!.inflated).toBe(true);
    const held = stepUntil(su, r.st, 0.25, 3, () => false).st;
    expect(held.ind.atm).toBeCloseTo(12, 6);
    expect(holdSeconds(held.ind)).toBeGreaterThanOrEqual(2.9);
  });

  it("deflation of a 3.0 non-compliant balloon takes seconds, scaled to its labelled deflation time (at least the model's share of it, within it)", () => {
    const su = setup("lad-focal");
    let st = onLesion(su, wired(su), "balloon", "non-compliant", 3.0, 12);
    const spec = DEVICE_BY_ID.nc.deflateSpecS!(3.0, 12);
    st = setIndeflator(st, 14, 3);
    st = stepUntil(su, st, 0.25, 15, (x) => x.ind.atm >= 14 - 1e-9).st;
    st = stepUntil(su, st, 0.25, 10, () => false).st;
    st = pullIndeflatorNegative(su.s, su.g, st);
    const r = stepUntil(su, st, 0.25, 60, (x) => x.ind.fill === 0);
    expect(r.st.ind.fill).toBe(0);
    expect(r.t).toBeGreaterThanOrEqual(MP_DEFLATE_OF_SPEC * spec);
    expect(r.t).toBeLessThanOrEqual(spec);
    // until then the device cannot be moved by the usual path
    const early = stepUntil(su, st, 0.25, 2, () => false).st;
    expect(early.ind.fill).toBeGreaterThan(0.05);
    expect(moveDevice(early, -5).device!.centreMm).toBe(early.device!.centreMm);
  });

  it("inflating past the drawn burst pressure ruptures the balloon (seeded) and logs balloon-rupture; just below it does not", () => {
    const su = setup("lad-focal");
    const burstOf = (seed: number) => onLesion(su, wired(su, seed), "balloon", "non-compliant", 3.0, 12).device!.burstAtm;
    // seeded: the same seed draws the same burst pressure, another seed another one; all above the rated burst pressure
    expect(burstOf(3)).toBe(burstOf(3));
    expect(burstOf(3)).not.toBe(burstOf(4));
    expect(burstOf(3)).toBeGreaterThan(DEVICE_BY_ID.nc.rbpAtm(3.0));
    const st0 = onLesion(su, wired(su, 3), "balloon", "non-compliant", 3.0, 12);
    const burst = st0.device!.burstAtm;
    expect(burst).toBeLessThan(29);
    const below = stepUntil(su, setIndeflator(st0, burst - 0.5, 2), 0.25, 20, () => false).st;
    expect(below.balloonRupture).toBe(false);
    const r = stepUntil(su, setIndeflator(st0, Math.min(30, burst + 1), 2), 0.25, 20, (x) => x.balloonRupture);
    expect(r.st.balloonRupture).toBe(true);
    expect(r.st.device!.ruptured).toBe(true);
    const rec = r.st.log.find((e) => e.kind === "balloon-rupture");
    expect(rec).toBeDefined();
    expect(rec!.data.atm as number).toBeGreaterThan(burst);
    // the needle falls
    expect(r.st.ind.atm).toBeLessThan(0);
    expect(r.st.events.some((e) => /contrast puffs out/.test(e.text))).toBe(true);
  });

  // stepPci (actions/step.ts) still draws melon-seeding from the rate alone: the engine arm separates the two
  // balloons by rate; balloon length and angulation are tested on melonSeedRisk until step.ts adopts it
  it("the melon-seed counter increments at 6 atm/s and not at 1 atm/s (stepPci, rate); melonSeedRisk adds balloon length and angulation", () => {
    const su = setup("lad-focal");
    const ang = lesionAngulationDeg(su.g, wired(su).route);
    expect(ang).toBeGreaterThan(0);
    const seeds = (len: number, rate: number) => {
      let n = 0;
      for (let seed = 1; seed <= 6; seed++) {
        let st = onLesion(su, wired(su, seed), "balloon", "semi-compliant", 2.5, len, 2);
        st = setIndeflator(st, 10, rate);
        st = stepUntil(su, st, 0.05, 12, () => false).st;
        n += st.counters.melonSeeds;
      }
      return n;
    };
    expect(seeds(8, 6)).toBeGreaterThan(0);
    expect(seeds(15, 1)).toBe(0);
    // the shared risk: a short balloon in an angulated lesion inflated fast slips more than a long one inflated slowly
    expect(melonSeedRisk({ riseAtmS: 3.5, balloonLengthMm: 8, angulationDeg: ang })).toBeGreaterThan(melonSeedRisk({ riseAtmS: 3.5, balloonLengthMm: 15, angulationDeg: 0 }));
    expect(melonSeedRisk({ riseAtmS: 1, balloonLengthMm: 15, angulationDeg: ang })).toBe(0);
  });

  it("withdrawal before full deflation increases the guide's depthMm and raises the ostial dissection hazard above a quiet guide's; after full deflation it does neither", () => {
    const su = setup("lad-focal");
    const inflated = (seed: number) => {
      let st = onLesion(su, wired(su, seed), "balloon", "semi-compliant", 2.5, 12);
      st = stepUntil(su, setIndeflator(st, 10, 3), 0.25, 8, () => false).st;
      return stepUntil(su, pullIndeflatorNegative(su.s, su.g, st), 0.25, 1, () => false).st;
    };
    const st = inflated(1);
    expect(st.ind.fill).toBeGreaterThan(0);
    const pulled = withdrawBeforeDeflation(su.s, su.g, st, 6);
    expect(pulled.guide.depthMm).toBeGreaterThan(st.guide.depthMm + 1);
    expect(pulled.guide.coaxial).toBeLessThan(st.guide.coaxial);
    expect(inflationOf(pulled).pulledBeforeDeflation).toBe(1);
    expect(pulled.log.some((e) => e.kind === "pull-before-deflation")).toBe(true);
    // the hazard: across seeds a pull before deflation dissects the ostium from the guide more often than the
    // same guide's draw where it sat, without force (the baseline, from the same generator state)
    const guideDissections = (x: PciState) => x.cx.list.filter((c) => c.kind === "dissection" && /guide/.test(c.cause)).length;
    let early = 0;
    let baseline = 0;
    let late = 0;
    let dissected: { before: PciState; after: PciState } | null = null;
    for (let seed = 1; seed <= 40; seed++) {
      const a = inflated(seed);
      const pulledA = withdrawBeforeDeflation(su.s, su.g, a, 10);
      const n = guideDissections(pulledA) - guideDissections(a);
      early += n;
      if (n > 0 && !dissected) dissected = { before: a, after: pulledA };
      const cx = cloneCx(a.cx);
      if (maybeGuideDissection(cx, a.t, { side: su.s.side, depthMm: a.guide.depthMm, coaxial: a.guide.coaxial, forceful: false, vessel: a.route[0] ?? su.g.lesion.vessel }).c) baseline++;
      const empty = stepUntil(su, a, 0.25, 30, (x) => x.ind.fill === 0).st;
      const b = withdrawBeforeDeflation(su.s, su.g, empty, 10);
      expect(b).toBe(empty);
      late += guideDissections(b) - guideDissections(empty);
    }
    expect(early).toBeGreaterThan(baseline);
    expect(late).toBe(0);
    // the dissection's cause is this mechanism's, and the live log names no dissection (the cue: the guide sits deeper)
    expect(dissected, "a guide dissection within 40 seeds").not.toBeNull();
    const fresh = dissected!.after.cx.list.filter((c) => !dissected!.before.cx.list.some((o) => o.id === c.id));
    expect(fresh.some((c) => c.kind === "dissection" && /pulled before/.test(c.cause))).toBe(true);
    const newEvents = dissected!.after.events.slice(dissected!.before.events.length);
    expect(newEvents.some((e) => /dissection|injection/i.test(e.text))).toBe(false);
    expect(newEvents.some((e) => /guide tip sits deeper/.test(e.text))).toBe(true);
  });

  it("a non-compliant balloon held at its rated burst pressure in rca-calcified keeps a waist: balloon-undilatable after a hold of 10 s, not before", () => {
    const su = setup("rca-calcified");
    let st = onLesion(su, wired(su), "balloon", "non-compliant", 3.0, 12);
    const rbp = DEVICE_BY_ID.nc.rbpAtm(3.0);
    // a waist at 14 atm that persists at the rated pressure (the shared yield model)
    expect(hasWaist({ resistance: st.resistance, atm: 14, calcium: 2 })).toBe(true);
    expect(hasWaist({ resistance: st.resistance, atm: rbp, holdS: 20, calcium: 2 })).toBe(true);
    st = stepUntil(su, setIndeflator(st, rbp, 3), 0.25, 12, (x) => x.ind.atm >= rbp - 1e-9).st;
    st = stepUntil(su, st, 0.25, 5, () => false).st;
    expect(secondsAtRbp(st.ind)).toBeLessThan(MP_UNDILATABLE_HOLD_S);
    expect(balloonUndilatableNow(su.s, su.g, st)).toBe(false);
    st = stepUntil(su, st, 0.25, 6, () => false).st;
    expect(secondsAtRbp(st.ind)).toBeGreaterThanOrEqual(MP_UNDILATABLE_HOLD_S);
    expect(balloonUndilatableNow(su.s, su.g, st)).toBe(true);
    const after = pullIndeflatorNegative(su.s, su.g, st);
    expect(after.log.some((e) => e.kind === "balloon-undilatable")).toBe(true);
    expect(inflationOf(after).undilatable).toBe(1);
    expect(after.events.some((e) => /^A waist persists/.test(e.text))).toBe(true);
    // the same hold in a lesion without calcium opens fully
    const lad = setup("lad-focal");
    let open = onLesion(lad, wired(lad), "balloon", "non-compliant", 2.5, 12);
    open = stepUntil(lad, setIndeflator(open, rbp, 3), 0.25, 30, () => false).st;
    expect(balloonUndilatableNow(lad.s, lad.g, open)).toBe(false);
  });

  it("the lock holds the plunger: a locked indeflator neither turns nor pulls negative", () => {
    const su = setup("lad-focal");
    let st = onLesion(su, wired(su), "balloon", "semi-compliant", 2.5, 12);
    st = stepUntil(su, setIndeflator(st, 8, 4), 0.25, 5, () => false).st;
    st = lockIndeflator(st, true);
    expect(setIndeflator(st, 14, 4).ind).toBe(st.ind);
    expect(pullIndeflatorNegative(su.s, su.g, st)).toBe(st);
    expect(stepUntil(su, st, 0.25, 4, () => false).st.ind.atm).toBeCloseTo(8, 6);
    st = lockIndeflator(st, false);
    expect(pullIndeflatorNegative(su.s, su.g, st).ind.negative).toBe(true);
    expect(lockScrew(initialIndeflator(), true).locked).toBe(true);
  });

  it("locking while the pressure is still rising holds it where it is", () => {
    const su = setup("lad-focal");
    let st = onLesion(su, wired(su), "balloon", "semi-compliant", 2.5, 12);
    st = stepUntil(su, setIndeflator(st, 12, 2), 0.25, 10, (x) => x.ind.atm >= 4).st;
    const at = st.ind.atm;
    expect(at).toBeGreaterThanOrEqual(4);
    expect(at).toBeLessThan(5);
    st = lockIndeflator(st, true);
    expect(st.ind.target).toBeCloseTo(at, 9);
    const held = stepUntil(su, st, 0.25, 3, () => false).st;
    expect(held.ind.atm).toBeCloseTo(at, 6);
    expect(held.ind.locked).toBe(true);
  });

  it("the cutting-balloon rule: faster than its labelled 1 atm per 5 s, or above its rated pressure, is recorded", () => {
    const su = setup("lad-focal");
    const base = onLesion(su, wired(su), "balloon", "semi-compliant", 2.5, 10);
    const cut: PciState = { ...base, device: { ...base.device!, specId: "cutting", balloon: "scoring" } };
    const spec = DEVICE_BY_ID.cutting;
    expect(spec.maxInflateAtmPerS).toBeCloseTo(0.2, 6);
    expect(inflationOf(setIndeflator(cut, 8, spec.maxInflateAtmPerS!)).cuttingRuleBreaches).toBe(0);
    expect(inflationOf(setIndeflator(cut, 8, 1)).cuttingRuleBreaches).toBe(1);
    expect(inflationOf(setIndeflator(cut, spec.rbpAtm(2.5) + 2, spec.maxInflateAtmPerS!)).cuttingRuleBreaches).toBe(1);
  });

  it("a stent at an aorto-ostial lesion may recoil after it expands; a post-dilatation opens it again", () => {
    const su = setup("rca-calcified", { events: ["aorto-ostial-lesion"] } as Partial<PciScenario>);
    let recoiled: PciState | null = null;
    let deployments = 0;
    for (let seed = 1; seed <= 12 && !recoiled; seed++) {
      const st = onLesion(su, wired(su, seed), "stent", "semi-compliant", 3.0, 23);
      const out = deflate(inflate(su.s, su.g, st, 14));
      deployments++;
      if (out.stents[0].recoilMm) recoiled = out;
    }
    expect(recoiled, `a recoil within ${deployments} deployments`).not.toBeNull();
    const p = recoiled!.stents[0];
    expect(p.recoilMm!).toBeGreaterThan(0);
    expect(recoiled!.log.some((e) => e.kind === "stent-recoil")).toBe(true);
    // without the aorto-ostial lesion no stent recoils
    const plain = setup("rca-calcified");
    for (let seed = 1; seed <= 6; seed++) expect(deflate(inflate(plain.s, plain.g, onLesion(plain, wired(plain, seed), "stent", "semi-compliant", 3.0, 23), 14)).stents[0].recoilMm ?? 0).toBe(0);
    // post-dilatation with a non-compliant balloon: the recoil is opened (it may recoil again, less often)
    let post: PciState = { ...recoiled!, device: null, ind: initialIndeflator() };
    post = onLesion(su, post, "balloon", "non-compliant", 3.0, 12);
    post = deflate(inflate(su.s, su.g, post, 20));
    expect(post.stents[0].atLesion).toBeGreaterThan(p.atLesion);
  });

  it("stent expansion ratio: below the model's 0.8 the stent is under-expanded", () => {
    expect(MP_STENT_EXPANSION_RATIO).toBe(0.8);
    expect(stentExpansionRatio({ atLesion: 2.2, diameter: 3.0 })).toBeLessThan(MP_STENT_EXPANSION_RATIO);
    expect(stentExpansionRatio({ atLesion: 2.7, diameter: 3.0 })).toBeGreaterThan(MP_STENT_EXPANSION_RATIO);
  });
});

describe("the lesion-yield model (pci-indeflator)", () => {
  it("an instant inflation gives the engine's earlier formula exactly; a hold opens a little more, less so in calcium", () => {
    for (const [r, atm] of [
      [0.62, 14],
      [0.32, 10],
      [0.08, 6],
      [0.62, 24],
    ] as const) {
      expect(lesionYield({ resistance: r, atm })).toBeCloseTo(1 - r * Math.max(0, 1 - Math.max(0, atm - 6) / 20), 12);
    }
    expect(lesionYield({ resistance: 0.62, atm: 14, holdS: 30 })).toBeGreaterThan(lesionYield({ resistance: 0.62, atm: 14 }));
    expect(holdFactor(30, 2)).toBeGreaterThan(holdFactor(30, 0));
    expect(holdFactor(0, 2)).toBe(1);
    expect(waistDiameter(3.0, { resistance: 0.62, atm: 14 })).toBeLessThan(3.0 * MP_WAIST_RATIO);
    expect(hasWaist({ resistance: 0.08, atm: 12 })).toBe(false);
  });
});

describe("after predilatation: the stent-or-not decision (pci-indeflator)", () => {
  it("the first predilatation records its result (the truth, for the debrief)", () => {
    const su = setup("lad-focal");
    let st = onLesion(su, wired(su), "balloon", "semi-compliant", 2.5, 15);
    st = deflate(inflate(su.s, su.g, st, 12));
    const rec = inflationOf(st).predil;
    expect(rec).not.toBeNull();
    expect(rec!.outcome).toBe(classifyPredilatation(su.s, su.g, st));
    expect(st.log.some((e) => e.kind === "predilatation-result")).toBe(true);
  });

  it("the drill draws its outcome by seed with the model's weights, and each drawn state is what the engine then holds", () => {
    const n = 4000;
    const count = new Map<string, number>();
    for (let i = 0; i < n; i++) {
      const o = drawPredilatationOutcome(i);
      count.set(o, (count.get(o) ?? 0) + 1);
    }
    const total = PREDIL_OUTCOME_WEIGHTS.reduce((a, w) => a + w.weight, 0);
    for (const w of PREDIL_OUTCOME_WEIGHTS) expect(Math.abs((count.get(w.outcome) ?? 0) / n - w.weight / total)).toBeLessThan(0.03);
    expect(drawPredilatationOutcome("x")).toBe(drawPredilatationOutcome("x"));
    const su = setup("lad-focal");
    const slow = predilatationStart(su.s, su.g, wired(su), { outcome: "slow-flow" });
    expect(slow.device).toBeNull();
    expect(slow.slowFlow).toBe(true);
    expect(inflationOf(slow).predil!.outcome).toBe("slow-flow");
    expect(slow.dissection).toBeNull();
    const dis = predilatationStart(su.s, su.g, wired(su), { outcome: "dissection" });
    expect(dis.dissection).not.toBeNull();
    expect(classifyPredilatation(su.s, su.g, dis)).toBe("dissection");
    const waist = predilatationStart(su.s, su.g, wired(su), { outcome: "waist" });
    expect(inflationOf(waist).predil!.outcome).toBe("waist");
    const good = predilatationStart(su.s, su.g, wired(su), { outcome: "good" });
    // lad-focal's distal reference (about 2.2 mm) is above the drill's very small distal vessel
    expect(distalReferenceMm(su.g, good.route)).toBeGreaterThan(MP_VERY_SMALL_DISTAL_MM);
    expect(inflationOf(good).predil!.outcome).toBe("good");
    expect(imposePredilatationOutcome(su.s, su.g, good, "good").slowFlow).toBe(good.slowFlow);
  });

  it("a very small distal vessel comes from the anatomy: the LAD lesion moved distally leaves 'small-vessel'", () => {
    // the drill's very small distal vessel is narrower than the module's small-vessel class
    expect(MP_VERY_SMALL_DISTAL_MM).toBeLessThan(SMALL_VESSEL_MM);
    const base = setup("lad-focal");
    const su = setup("lad-focal", { target: { ...base.s.target, position: 0.65 } });
    const st = wired(su);
    expect(st.route).toContain(su.g.lesion.vessel);
    expect(distalReferenceMm(su.g, st.route)).toBeLessThan(MP_VERY_SMALL_DISTAL_MM);
    // a clean state with no waist reads 'small-vessel'; the same state in lad-focal reads 'good'
    expect(classifyPredilatation(su.s, su.g, st, false)).toBe("small-vessel");
    expect(classifyPredilatation(base.s, base.g, wired(base), false)).toBe("good");
  });

  it("the drug-coated balloon is on the cart", () => {
    const su = setup("lad-focal");
    const st = requestDevice(wired(su), "dcb", 3.0, 20);
    expect(st.device?.specId).toBe("dcb");
  });
});
