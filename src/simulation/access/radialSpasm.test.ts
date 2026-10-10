// access-radial-sequence: the shared radial spasm model (radialSpasm.ts); diag-spasm-states: the live
// state in the coronary labs (probability, grip, hub force, avulsion, pain and the measures).
//   npx vitest run src/simulation/access/radialSpasm.test.ts
import { describe, expect, it } from "vitest";
import {
  LiveRadialSpasm,
  MP_RADIAL_LIVE,
  MP_RADIAL_SPASM,
  avulses,
  freshRadialSpasm,
  gripForceN,
  gripTorqueNmm,
  hubAxialForceN,
  spasmPain,
  spasmProbability,
  radialLumenScale,
  spasmDrive,
  spasmFlash,
  spasmOnExchange,
  spasmOnPass,
  spasmRelief,
  spasmTarget,
  stepRadialSpasm,
  type RadialSpasmFactors,
} from "./radialSpasm";
import { MP_SESSION } from "../session/caseSession";

/** A relaxed, older man with a good artery, a working local and no sheath yet. */
const CALM: RadialSpasmFactors = {
  radialDiamMm: 2.8,
  ageY: 66,
  female: false,
  smoker: false,
  anxiety: 0.2,
  pain: 0,
  sheathOdMm: null,
  exchanges: 0,
  vasodilator: 0,
  nitrate: 0,
  vasopressor: false,
};

const settle = (f: RadialSpasmFactors, s = freshRadialSpasm(), seconds = 300) => {
  for (let t = 0; t < seconds; t += 1) stepRadialSpasm(s, f, 1);
  return s;
};

describe("radial spasm: the drive", () => {
  it("each risk factor of the lesson's table raises the drive, and each appears as a term", () => {
    const base = spasmDrive(CALM).drive;
    const cases: [Partial<RadialSpasmFactors>, string][] = [
      [{ radialDiamMm: 1.8 }, "small-artery"],
      [{ ageY: 30 }, "younger"],
      [{ female: true }, "female"],
      [{ smoker: true }, "smoker"],
      [{ anxiety: 0.9 }, "anxiety"],
      [{ pain: 1 }, "pain"],
      [{ sheathOdMm: 2.67, radialDiamMm: 2.0 }, "sheath"],
      [{ exchanges: 3 }, "exchanges"],
      [{ vasopressor: true }, "vasopressor"],
    ];
    for (const [o, id] of cases) {
      const d = spasmDrive({ ...CALM, ...o });
      expect(d.drive, id).toBeGreaterThan(base);
      expect(d.terms.map((t) => t.id), id).toContain(id);
    }
  });

  it("a sheath no bigger than most of the artery adds nothing; a larger one adds in proportion", () => {
    expect(spasmDrive({ ...CALM, sheathOdMm: 2.4 }).terms.some((t) => t.id === "sheath")).toBe(false);
    const a = spasmDrive({ ...CALM, radialDiamMm: 2.2, sheathOdMm: 2.46 }).drive;
    const b = spasmDrive({ ...CALM, radialDiamMm: 2.2, sheathOdMm: 3.02 }).drive;
    expect(b).toBeGreaterThan(a);
  });

  it("an intra-arterial vasodilator or a local nitrate relieves it; the larger of the two counts", () => {
    expect(spasmRelief({ vasodilator: 0, nitrate: 0 })).toBe(0);
    expect(spasmRelief({ vasodilator: 1, nitrate: 0 })).toBeCloseTo(MP_RADIAL_SPASM.vasodilatorRelief);
    expect(spasmRelief({ vasodilator: 0, nitrate: 1 })).toBeCloseTo(MP_RADIAL_SPASM.nitrateRelief);
    expect(spasmRelief({ vasodilator: 0.5, nitrate: 1 })).toBeCloseTo(MP_RADIAL_SPASM.nitrateRelief);
    const st = freshRadialSpasm();
    const tight = { ...CALM, radialDiamMm: 1.8, anxiety: 0.9 };
    expect(spasmTarget(st, { ...tight, vasodilator: 0.6 })).toBeLessThan(spasmTarget(st, tight));
  });
});

describe("radial spasm: the state over time", () => {
  it("rises quickly to its target and relaxes slowly once the drive falls", () => {
    const tight = { ...CALM, radialDiamMm: 1.8, anxiety: 0.9, pain: 1 };
    const s = freshRadialSpasm();
    stepRadialSpasm(s, tight, MP_RADIAL_SPASM.tauRiseS * 3);
    expect(s.level).toBeGreaterThan(0.9 * spasmTarget(s, tight));
    const up = s.level;
    // the drive falls (local working, sedation): after one rise time it has relaxed only partly
    stepRadialSpasm(s, CALM, MP_RADIAL_SPASM.tauRiseS);
    expect(s.level).toBeLessThan(up);
    expect(s.level).toBeGreaterThan(spasmTarget(s, CALM) + 0.5 * (up - spasmTarget(s, CALM)));
    // and after several minutes it is back near the calm target
    settle(CALM, s, 600);
    expect(s.level).toBeLessThan(spasmTarget(s, CALM) + 0.02);
  });

  it("repeated passes add an impulse (the first does not), more when they hurt; waiting lets it fade", () => {
    const quiet = settle(CALM);
    const l0 = quiet.level;
    spasmOnPass(quiet, false);
    expect(quiet.impulse).toBe(0);
    spasmOnPass(quiet, false);
    const i2 = quiet.impulse;
    expect(i2).toBeCloseTo(MP_RADIAL_SPASM.passImpulse);
    spasmOnPass(quiet, true);
    expect(quiet.impulse - i2).toBeCloseTo(MP_RADIAL_SPASM.passImpulse + MP_RADIAL_SPASM.painfulPassImpulse, 5);
    stepRadialSpasm(quiet, CALM, 30);
    expect(quiet.level).toBeGreaterThan(l0 + 0.2);
    settle(CALM, quiet, 900);
    expect(quiet.impulse).toBeLessThan(0.01);
    expect(quiet.level).toBeLessThan(l0 + 0.02);
  });

  it("an exchange adds an impulse", () => {
    const s = settle(CALM);
    spasmOnExchange(s);
    expect(s.impulse).toBeCloseTo(MP_RADIAL_SPASM.exchangeImpulse);
  });

  it("the tone narrows the lumen and slows, then spoils, the flash", () => {
    expect(radialLumenScale(0)).toBe(1);
    expect(radialLumenScale(1)).toBeCloseTo(MP_RADIAL_SPASM.lumenAtFull);
    expect(radialLumenScale(0.5)).toBeLessThan(1);
    expect(spasmFlash(0.1)).toBe("brisk");
    expect(spasmFlash(MP_RADIAL_SPASM.slowFlashAt)).toBe("slow");
    expect(spasmFlash(MP_RADIAL_SPASM.poorFlashAt)).toBe("poor");
  });

  it("is pure state: two steps of 1 s and one of 2 s land close together, and nothing is drawn at random", () => {
    const f = { ...CALM, anxiety: 0.8, pain: 1 };
    const a = freshRadialSpasm();
    const b = freshRadialSpasm();
    stepRadialSpasm(a, f, 1);
    stepRadialSpasm(a, f, 1);
    stepRadialSpasm(b, f, 2);
    expect(a.level).toBeCloseTo(b.level, 6);
    const c = freshRadialSpasm();
    stepRadialSpasm(c, f, 2);
    expect(c).toEqual(b);
  });
});

describe("live radial spasm (diag-spasm-states)", () => {
  /** A small artery in a younger anxious woman, a 6 Fr sheath in, no vasodilator yet. */
  const AT_RISK: RadialSpasmFactors = { ...CALM, radialDiamMm: 2.1, ageY: 45, female: true, anxiety: 0.5, sheathOdMm: 2.46 };

  it("spasm probability rises with sheath size and exchanges and falls with the cocktail", () => {
    const p5 = spasmProbability({ ...AT_RISK, sheathOdMm: 2.46 });
    const p6 = spasmProbability({ ...AT_RISK, sheathOdMm: 2.67 });
    const p7 = spasmProbability({ ...AT_RISK, sheathOdMm: 3.02 });
    expect(p6).toBeGreaterThan(p5);
    expect(p7).toBeGreaterThan(p6);
    const e0 = spasmProbability({ ...AT_RISK, sheathOdMm: 2.67, exchanges: 0 });
    const e2 = spasmProbability({ ...AT_RISK, sheathOdMm: 2.67, exchanges: 2 });
    const e4 = spasmProbability({ ...AT_RISK, sheathOdMm: 2.67, exchanges: 4 });
    expect(e2).toBeGreaterThan(e0);
    expect(e4).toBeGreaterThan(e2);
    // the cocktail through the sheath (Oxford's verapamil 2.5 mg and nitroglycerin 200 µg, pm-access-radial-sheath)
    const h = new LiveRadialSpasm({ radialDiamMm: 2.1, ageY: 45, female: true, smoker: false, sheathOdMm: 2.67, exchanges: 2 });
    const before = h.probability({ anxiety: 0.5, vasopressor: false });
    h.giveVasodilator("verapamil", 2.5, "ia");
    h.giveVasodilator("gtn", 200, "ia");
    const after = h.probability({ anxiety: 0.5, vasopressor: false });
    expect(after).toBeLessThan(before);
    expect(after).toBeLessThan(0.5 * before);
    // and the probability is a probability
    for (const p of [p5, p6, p7, e0, e2, e4, before, after]) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it("at spasm 0.8 the hub axial force for a 10 mm withdrawal is at least twice baseline, and turning drags too", () => {
    const g = { catheterOdMm: 2.0, radialDiamMm: 2.2, contactMm: 120 };
    // a 10 mm withdrawal over 1 s
    const base = hubAxialForceN({ ...g, level: 0 }, -10);
    const at08 = hubAxialForceN({ ...g, level: 0.8 }, -10);
    expect(base).toBeGreaterThan(0);
    expect(at08).toBeGreaterThanOrEqual(2 * base);
    // the grip grows with the tone, and is nothing in a relaxed artery
    expect(gripForceN({ ...g, level: 0 })).toBe(0);
    expect(gripForceN({ ...g, level: 0.5 })).toBeGreaterThan(gripForceN({ ...g, level: 0.3 }));
    expect(gripForceN({ ...g, level: 0.8 })).toBeGreaterThan(gripForceN({ ...g, level: 0.5 }));
    expect(gripTorqueNmm({ ...g, level: 0.8 })).toBeGreaterThan(0);
    // a lubricious solution eases it
    expect(gripForceN({ ...g, level: 0.8, lubricated: 0.4 })).toBeLessThan(gripForceN({ ...g, level: 0.8 }));
  });

  it("a forceful pull through a gripping spasm avulses the artery; a gentle one, or a relaxed artery, does not", () => {
    const g = { catheterOdMm: 2.0, radialDiamMm: 2.2, contactMm: 120 };
    const forceful = hubAxialForceN({ ...g, level: 0.8 }, -40);
    const gentle = hubAxialForceN({ ...g, level: 0.8 }, -3);
    expect(avulses(0.8, forceful)).toBe(true);
    expect(avulses(0.8, gentle)).toBe(false);
    expect(avulses(0.3, hubAxialForceN({ ...g, level: 0.3 }, -40))).toBe(false);
    expect(avulses(MP_RADIAL_LIVE.avulsionLevel, 100)).toBe(false);
  });

  it("the spasm hurts, more when the catheter is moved", () => {
    expect(spasmPain(0.1, true)).toBe(0);
    expect(spasmPain(0.8, true)).toBeGreaterThan(spasmPain(0.8, false));
    expect(spasmPain(0.8, false)).toBeGreaterThan(0);
  });

  it("the measures: vasodilators by route (intravenously when the side port will not aspirate), nitrate under the skin and the tongue, warmth, the cuff for 5 minutes, and no lidocaine into the artery", () => {
    const tight = { anxiety: 0.6, vasopressor: false };
    const run = (act: (h: LiveRadialSpasm) => void) => {
      const h = new LiveRadialSpasm({ radialDiamMm: 1.9, ageY: 34, female: true, smoker: true, sheathOdMm: 2.67, exchanges: 2, startLevel: 0.75 });
      act(h);
      for (let t = 1; t <= 420; t++) h.step(t, tight);
      return h.level;
    };
    const nothing = run(() => {});
    expect(nothing).toBeGreaterThan(MP_RADIAL_LIVE.significantAt);
    for (const [name, act] of [
      ["IA verapamil", (h: LiveRadialSpasm) => h.giveVasodilator("verapamil", 2.5, "ia")],
      ["IA nitroglycerin", (h: LiveRadialSpasm) => h.giveVasodilator("gtn", 200, "ia")],
      ["SC nitroglycerin", (h: LiveRadialSpasm) => h.measure("sc-gtn")],
      ["SL nitroglycerin", (h: LiveRadialSpasm) => h.measure("sl-gtn")],
      ["warmth", (h: LiveRadialSpasm) => h.measure("warmth")],
      ["cuff", (h: LiveRadialSpasm) => h.measure("cuff")],
      ["nerve block", (h: LiveRadialSpasm) => h.measure("nerve-block")],
    ] as const) expect(run(act), name).toBeLessThan(nothing - 0.05);
    // an intra-arterial order through a side port that will not aspirate goes intravenously, at a smaller local effect
    const h = new LiveRadialSpasm({ radialDiamMm: 2, ageY: 50, female: false, smoker: false, sheathOdMm: 2.67 });
    expect(h.giveVasodilator("verapamil", 2.5, "ia", false).route).toBe("iv");
    const ivEffect = h.vasodilatorEffect();
    const h2 = new LiveRadialSpasm({ radialDiamMm: 2, ageY: 50, female: false, smoker: false, sheathOdMm: 2.67 });
    h2.giveVasodilator("verapamil", 2.5, "ia");
    expect(h2.vasodilatorEffect()).toBeGreaterThan(ivEffect);
    // the cuff relieves only after it has been held for 5 minutes and let down
    const c = new LiveRadialSpasm({ radialDiamMm: 2, ageY: 50, female: false, smoker: false, sheathOdMm: 2.67 });
    expect(c.measure("cuff").ok).toBe(true);
    expect(c.measure("cuff").ok).toBe(false);
    c.step(MP_RADIAL_LIVE.cuffHoldS - 1, tight);
    expect(c.measureRelief()).toBe(0);
    c.step(MP_RADIAL_LIVE.cuffHoldS + 1, tight);
    expect(c.measureRelief()).toBeGreaterThan(0.5);
    expect(c.cuffAt).toBeNull();
    // lidocaine into the artery is refused
    const l = c.measure("ia-lidocaine");
    expect(l.ok).toBe(false);
    expect(l.text).toMatch(/seizures/);
  });

  it("an intravenous vasopressor makes it worse, and the host survives a snapshot", () => {
    const run = (vasopressor: boolean) => {
      const h = new LiveRadialSpasm({ radialDiamMm: 2.3, ageY: 61, female: false, smoker: false, sheathOdMm: 2.67 });
      for (let t = 1; t <= 120; t++) h.step(t, { anxiety: 0.3, vasopressor });
      return h;
    };
    expect(run(true).level).toBeGreaterThan(run(false).level);
    const h = run(true);
    h.measure("warmth");
    const back = LiveRadialSpasm.restore(h.snapshot());
    expect(back.snapshot()).toEqual(h.snapshot());
  });
});

describe("the live host keeps itself small and agrees with the full case (diag-spasm-states review)", () => {
  it("the local vasodilator effect and its fall are the full case's (caseSession.ts MP_SESSION): one radial spasm model", () => {
    for (const k of ["gtnEffectPer100Ug", "gtnTauS", "verapamilEffectPerMg", "verapamilTauS"] as const) expect(MP_RADIAL_LIVE[k], k).toBe(MP_SESSION[k]);
  });

  it("drops spent doses and decaying measures but keeps a nerve block, and steps with the same factors as factors() returns", () => {
    const h = new LiveRadialSpasm({ radialDiamMm: 2.1, ageY: 45, female: true, smoker: false, sheathOdMm: 2.67 });
    h.giveVasodilator("gtn", 200, "ia");
    h.measure("warmth");
    h.measure("nerve-block");
    h.step(10, { anxiety: 0.4, vasopressor: false, sedation: 0.2 });
    expect(h.doses.length).toBe(1);
    expect(h.measures.length).toBe(2);
    const f = h.factors();
    expect(f.anxiety).toBeCloseTo(0.4, 9);
    expect(h.factors()).not.toBe(f);
    // an hour on: the nitroglycerin and the warmth are spent, the nerve block lasts
    for (let t = 20; t <= 4000; t += 10) h.step(t, { anxiety: 0.4, vasopressor: false });
    expect(h.doses.length).toBe(0);
    expect(h.measures.map((m) => m.id)).toEqual(["nerve-block"]);
    expect(h.vasodilatorEffect()).toBe(0);
  });

  it("forearm pain: hurt() holds the larger pain, it falls with painTauS, and the snapshot carries it", () => {
    const h = new LiveRadialSpasm({ radialDiamMm: 2.1, ageY: 45, female: true, smoker: false, sheathOdMm: 2.67 });
    h.hurt(0.6);
    h.hurt(0.3);
    expect(h.pain).toBeCloseTo(0.6, 9);
    expect(LiveRadialSpasm.restore(h.snapshot()).pain).toBeCloseTo(0.6, 9);
    h.step(MP_RADIAL_LIVE.painTauS, { anxiety: 0, vasopressor: false });
    expect(h.pain).toBeCloseTo(0.6 * Math.exp(-1), 6);
    // an older snapshot without the pain restores without it
    const { pain: _p, ...old } = h.snapshot();
    expect(LiveRadialSpasm.restore(old).pain).toBe(0);
  });
});
