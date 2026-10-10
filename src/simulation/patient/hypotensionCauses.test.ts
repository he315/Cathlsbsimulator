// proc-hypotension-pressors: the shared hypotension-cause model. Each core cause started on a patient
// engine gives its signature (the right heart pattern of its mechanism), the drug rules follow the
// pressors lesson, and labs can register their own causes.
//   npx vitest run src/simulation/patient/hypotensionCauses.test.ts
import { describe, expect, it } from "vitest";
import { PatientEngine } from "./engine";
import { generatePatient, presetPatient, type PatientProfile } from "./patient";
import {
  CORE_CAUSES,
  HYPOTENSION_MECHANISMS,
  RHC_REFERENCE,
  bridgeVerdict,
  cardiacIndex,
  classifyRightHeart,
  hypotensionCause,
  hypotensionCauses,
  makeObstructiveHcm,
  registerHypotensionCause,
  startHypotensionCause,
  type HypotensionCause,
} from "./hypotensionCauses";

const ready = (profile: PatientProfile) => {
  const e = new PatientEngine({ profile });
  e.advance(8);
  return e;
};
/** Advance in the session's 5 s slices, ticking the cause's run as a lab does. */
const run = (e: PatientEngine, s: number, r?: { tick: (p: PatientEngine, dt: number) => void } | null) => {
  for (let t = 0; t < s; t += 5) {
    e.advance(5);
    r?.tick(e, 5);
  }
};
const pattern = (e: PatientEngine) => classifyRightHeart(e.rightHeart(), e.profile, e.vitals().hr ?? null);
const healthy = (seed: string) => ({ ...generatePatient(seed, { indication: "SA" }), lvef: 60 });

describe("registry", () => {
  it("holds the core causes, one per id, each with a known mechanism, a treatment and a lesson", () => {
    const ids = hypotensionCauses().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["bleeding", "fasting", "ischaemia", "tamponade", "arrhythmia", "vagal", "reaction", "gtn-pde5", "verapamil", "hcm-vasodilator", "transducer-high", "damped-line"]) expect(hypotensionCause(id), id).toBeDefined();
    for (const c of CORE_CAUSES) {
      expect(HYPOTENSION_MECHANISMS).toContain(c.mechanism);
      expect(c.treatments.length).toBeGreaterThan(0);
      expect(c.lessonId).toMatch(/^[a-z]+-/);
      expect(c.source.length).toBeGreaterThan(10);
    }
  });

  it("lets a lab register its own cause, and refuses a duplicate or an unknown mechanism", () => {
    const extra: HypotensionCause = {
      id: "test-guide-valve",
      mechanism: "cardiac",
      label: "A guide holding the aortic valve open",
      signature: { filling: "high", output: "low", ra: "normal", rate: "fast", cuff: "low" },
      treatment: "Reposition the guide",
      treatments: ["support"],
      bridge: { right: [], acceptable: [], otherwise: "Reposition the guide", expected: "Reposition the guide", causeFirst: true },
      lessonId: "pm-lab-drugs-pressors",
      source: "test",
      start: () => null,
    };
    registerHypotensionCause(extra);
    expect(hypotensionCause("test-guide-valve")).toBe(extra);
    // the same cause from the same source again (a reload) replaces it; another source, or a core id, throws
    const reloaded = { ...extra };
    expect(() => registerHypotensionCause(reloaded)).not.toThrow();
    expect(hypotensionCause("test-guide-valve")).toBe(reloaded);
    expect(() => registerHypotensionCause({ ...extra, source: "another lab" })).toThrow(/already registered/);
    expect(() => registerHypotensionCause({ ...extra, id: "bleeding" })).toThrow(/already registered/);
    expect(() => registerHypotensionCause({ ...extra, id: "test-bad", mechanism: "spooky" as never })).toThrow(/unknown mechanism/);
  });
});

describe("classification", () => {
  it("follows Brilakis's right heart pattern: low/low hypovolaemia, high/low cardiac failure, high output vasodilation", () => {
    const body = { heightCm: 175, weightKg: 80 };
    const ci = (co: number) => cardiacIndex(co, body.heightCm, body.weightKg);
    expect(ci(4)).toBeLessThan(RHC_REFERENCE.ciTypical[0]);
    expect(classifyRightHeart({ raMmHg: 0.6, pcwpMmHg: 1, coLMin: 3 }, body).mechanism).toBe("hypovolaemia");
    expect(classifyRightHeart({ raMmHg: 2, pcwpMmHg: 26, coLMin: 3 }, body).mechanism).toBe("cardiac");
    // right ventricular failure or tamponade: low left-sided filling, high RA
    expect(classifyRightHeart({ raMmHg: 9, pcwpMmHg: 6, coLMin: 3 }, body).mechanism).toBe("cardiac");
    expect(classifyRightHeart({ raMmHg: 3, pcwpMmHg: 8, coLMin: 8.5 }, body).mechanism).toBe("vasodilation");
    // a slow rate is a cardiac cause whatever the filling
    expect(classifyRightHeart({ raMmHg: 2, pcwpMmHg: 7, coLMin: 3 }, body, 38).mechanism).toBe("cardiac");
  });
});

describe("causes on the engine give their signatures", () => {
  // The raw engine has no sedation and a resting pressure of its own, so these compare each patient
  // with itself; the scenarios' absolute patterns are tested in src/simulation/session/hypotension.test.ts.
  it("bleeding: the RA, the filling, the output and the pressure fall with the blood lost; control stops it", () => {
    const e = ready(generatePatient("h1", { indication: "SA" }));
    const rh0 = e.rightHeart();
    const r = startHypotensionCause("bleeding", e)!;
    run(e, 480, r);
    const rh = e.rightHeart();
    expect(rh.mapMmHg).toBeLessThan(rh0.mapMmHg - 10);
    expect(rh.raMmHg).toBeLessThan(rh0.raMmHg * 0.7);
    expect(rh.pcwpMmHg).toBeLessThan(rh0.pcwpMmHg * 0.6);
    expect(rh.coLMin).toBeLessThan(rh0.coLMin * 0.9);
    expect(e.vitals().losses.bloodMl).toBeGreaterThan(300);
    expect(r.treat(e, "control-bleeding")).toBe(true);
    expect(r.stopped()).toBe(true);
    const lost = e.vitals().losses.bloodMl;
    run(e, 60, r);
    expect(e.vitals().losses.bloodMl).toBeCloseTo(lost, 0);
  });

  it("fasting: the filling, the output and the pressure fall without any blood loss", () => {
    const e = ready(generatePatient("h1", { indication: "SA" }));
    const rh0 = e.rightHeart();
    const r = startHypotensionCause("fasting", e)!;
    run(e, 360, r);
    const rh = e.rightHeart();
    expect(rh.pcwpMmHg).toBeLessThan(rh0.pcwpMmHg * 0.75);
    expect(rh.coLMin).toBeLessThan(rh0.coLMin * 0.95);
    expect(rh.mapMmHg).toBeLessThan(rh0.mapMmHg - 5);
    expect(e.vitals().losses.bloodMl).toBe(0);
  });

  it("ischaemia in an impaired ventricle: high wedge and low output", () => {
    const e = ready({ ...generatePatient("hc-isch", { indication: "SA" }), lvef: 35 });
    const r = startHypotensionCause("ischaemia", e)!;
    run(e, 360, r);
    const p = pattern(e);
    expect(p.filling).toBe("high");
    expect(e.rightHeart().pcwpMmHg).toBeGreaterThan(RHC_REFERENCE.wedgeHighMmHg);
    expect(p.output).toBe("low");
    expect(p.mechanism).toBe("cardiac");
  });

  it("tamponade: the RA rises, the output and the pressure fall; the drain takes the blood out", () => {
    const e = ready(healthy("h1"));
    const ra0 = e.rightHeart().raMmHg;
    const map0 = e.vitals().aortaTrue.mean;
    const r = startHypotensionCause("tamponade", e)!;
    run(e, 400, r);
    expect(e.rightHeart().raMmHg).toBeGreaterThan(ra0 + 1.5);
    expect(pattern(e).output).toBe("low");
    expect(pattern(e).mechanism).toBe("cardiac");
    const low = e.vitals().aortaTrue.mean;
    expect(low).toBeLessThan(map0 - 25);
    r.treat(e, "drain-pericardium");
    run(e, 120, r);
    expect(e.vitals().pericardialMl).toBeLessThan(20);
    expect(e.vitals().aortaTrue.mean).toBeGreaterThan(low + 15);
  });

  it("complete heart block: a slow rate and a low output; pacing restores the rate", () => {
    const e = ready(healthy("hc-chb"));
    const r = startHypotensionCause("arrhythmia", e)!;
    run(e, 60, r);
    expect(e.vitals().hr!).toBeLessThan(RHC_REFERENCE.slowHr);
    expect(pattern(e).mechanism).toBe("cardiac");
    r.treat(e, "pace");
    run(e, 30, r);
    expect(e.vitals().hr!).toBeGreaterThan(RHC_REFERENCE.slowHr);
  });

  it("drug vasodilation: a high output and a low pressure that wears off with the drug", () => {
    const e = ready(healthy("hc-vd"));
    const map0 = e.vitals().aortaTrue.mean;
    const r = startHypotensionCause("gtn-pde5", e)!;
    run(e, 120, r);
    const low = e.vitals().aortaTrue.mean;
    expect(low).toBeLessThan(map0 - 15);
    expect(pattern(e).output).toBe("high");
    expect(pattern(e).mechanism).toBe("vasodilation");
    run(e, 1800, r);
    expect(e.vitals().aortaTrue.mean).toBeGreaterThan(low + 8);
  });

  it("a transducer above the heart reads low while the patient's pressure is unchanged", () => {
    const e = ready(healthy("hc-tx"));
    e.setTip({ location: "aorta", gap: 1, valveOpen: false });
    e.transducer.zero();
    e.advance(5);
    const shown0 = e.vitals().art!.mean;
    const true0 = e.vitals().aortaTrue.mean;
    startHypotensionCause("transducer-high", e);
    e.advance(5);
    expect(e.vitals().art!.mean).toBeLessThan(shown0 - 20);
    expect(Math.abs(e.vitals().aortaTrue.mean - true0)).toBeLessThan(5);
  });
});

describe("drug rules", () => {
  it("phenylephrine is right in obstructive HCM and an inotrope wrong; noradrenaline right in ischaemic shock and dopamine wrong", () => {
    const hcm = hypotensionCause("hcm-vasodilator")!;
    expect(bridgeVerdict(hcm, "phenylephrine").verdict).toBe("right");
    for (const d of ["dobutamine", "dopamine", "adrenaline"] as const) expect(bridgeVerdict(hcm, d).verdict).toBe("wrong");
    const isch = hypotensionCause("ischaemia")!;
    expect(bridgeVerdict(isch, "noradrenaline").verdict).toBe("right");
    expect(bridgeVerdict(isch, "dopamine").verdict).toBe("wrong");
    expect(bridgeVerdict(isch, "phenylephrine").why).toMatch(/afterload/);
    expect(hypotensionCause("bleeding")!.bridge.causeFirst).toBe(true);
    expect(hypotensionCause("transducer-high")!.bridge.right).toEqual([]);
    // zeroing does not remove a hydrostatic offset: only levelling treats a high transducer
    expect(hypotensionCause("transducer-high")!.treatments).toEqual(["level-transducer"]);
    // isoprenaline rarely improves conduction (04-lab-drugs.ts:886): acceptable while pacing is set up, not right
    const chb = hypotensionCause("arrhythmia")!;
    expect(chb.bridge.right).toEqual([]);
    expect(bridgeVerdict(chb, "isoprenaline").verdict).toBe("acceptable");
    expect(bridgeVerdict(chb, "isoprenaline").why).toMatch(/rarely improves conduction/);
  });

  it("makeObstructiveHcm: on a built engine, dobutamine then lowers the pressure and phenylephrine raises it", () => {
    const make = () => {
      const e = ready(healthy("hc-hocm"));
      makeObstructiveHcm(e);
      e.setVasodilation(0.35);
      run(e, 120);
      return e;
    };
    const a = make();
    const a0 = a.vitals().aortaTrue.mean;
    a.startInfusion({ drug: "dobutamine", rate: 10 });
    run(a, 180);
    expect(a.vitals().aortaTrue.mean).toBeLessThan(a0 - 5);
    const b = make();
    const b0 = b.vitals().aortaTrue.mean;
    b.giveDrug("phenylephrine", 100, "iv");
    b.startInfusion({ drug: "phenylephrine", rate: 0.5 });
    run(b, 180);
    expect(b.vitals().aortaTrue.mean).toBeGreaterThan(b0 + 5);
    // the preset HCM profile behaves the same way
    expect(presetPatient("hcm-obstructive", 3).profile.lvot?.obstructive).toBe(true);
  });
});
