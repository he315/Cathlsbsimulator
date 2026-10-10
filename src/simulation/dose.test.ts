import { describe, expect, it } from "vitest";
import {
  AKR_LIMIT_HIGH_MGY_MIN,
  AKR_LIMIT_MGY_MIN,
  Adrc,
  DEFAULT_SETTINGS,
  FDA_POINT_FROM_DETECTOR_MM,
  IRP_FROM_ISO_MM,
  LEGACY_AP_IODINE_GAIN,
  LEGACY_AP_METAL_GAIN,
  PATH_MODEL,
  SID_MM,
  SOD_MM,
  imageParamsFromAdrc,
  kermaIrpPerPulse,
  patientPath,
  steadyState,
  targetDetectorNGy,
  techniqueFor,
  type AdrcSettings,
  type AdrcState,
} from "../render/xray/adrc";
import {
  DOSE_TRIGGERS,
  DoseTracker,
  bodyFromHabitus,
  fieldAreaAtIrpCm2,
  operatorSideFactor,
  type BeamGeometry,
  type OperatorSetup,
} from "./dose";
import type { CArm, Vec3 } from "../types";

const S = (o: Partial<AdrcSettings> = {}): AdrcSettings => ({ ...DEFAULT_SETTINGS, ...o });
const rateAt = (cArm: CArm, o: Partial<AdrcSettings> = {}, habitus = 1) =>
  steadyState(S(o), patientPath(cArm, { habitus })).kermaRateIrpMGyMin;

/** iso with the back skin at the IRP (15 cm below the iso), body centred */
const ISO: Vec3 = { x: 0, y: 0, z: bodyFromHabitus(1).cz - bodyFromHabitus(1).b + 150 };

function geo(cArm: CArm, fieldMm = 230, shutters?: [number, number, number, number], iso: Vec3 = ISO): BeamGeometry {
  return { cArm, iso, fieldMm, shutters };
}

/** run the beam for `seconds` at a fixed angle, rendering at `fps` */
function runBeam(
  tr: DoseTracker,
  cArm: CArm,
  settings: Partial<AdrcSettings>,
  seconds: number,
  opts: { fps?: number; habitus?: number; shutters?: [number, number, number, number]; iso?: Vec3; operator?: OperatorSetup } = {},
): AdrcState {
  const fps = opts.fps ?? 15;
  const s = S(settings);
  const path = patientPath(cArm, { habitus: opts.habitus ?? 1 });
  const st = steadyState(s, path);
  const n = Math.round(seconds * fps);
  for (let i = 0; i < n; i++) {
    tr.expose({
      adrc: st,
      dtS: 1 / fps,
      geometry: geo(cArm, s.fieldMm, opts.shutters, opts.iso ?? ISO),
      body: bodyFromHabitus(opts.habitus ?? 1),
      operator: opts.operator,
    });
  }
  return st;
}

// ---------------------------------------------------------------------------
describe("ADRC program and limits", () => {
  const thick = [8, 12, 16, 20, 24, 28, 32, 36, 40, 44];

  it("keeps fluoroscopy pulse width within 6-12.5 ms and cine within 3-8 ms", () => {
    for (const t of thick) {
      for (const level of ["low", "normal", "high"] as const) {
        for (const pps of [7.5, 15, 30] as const) {
          const f = steadyState(S({ mode: "fluoro", fluoroLevel: level, fluoroPps: pps }), t).technique;
          expect(f.pulseMs).toBeGreaterThanOrEqual(6 - 1e-6);
          expect(f.pulseMs).toBeLessThanOrEqual(12.5 + 1e-6);
        }
      }
      const c = steadyState(S({ mode: "cine" }), t).technique;
      expect(c.pulseMs).toBeGreaterThanOrEqual(3 - 1e-6);
      expect(c.pulseMs).toBeLessThanOrEqual(8 + 1e-6);
    }
  });

  it("keeps kVp within 60-125 and never lowers kVp as the patient thickens", () => {
    for (const mode of ["fluoro", "cine"] as const) {
      let lastKv = 0;
      for (let t = 5; t <= 45; t += 0.5) {
        const { tech } = techniqueFor(S({ mode }), t);
        expect(tech.kvp).toBeGreaterThanOrEqual(60);
        expect(tech.kvp).toBeLessThanOrEqual(125 + 1e-9);
        expect(tech.kvp).toBeGreaterThanOrEqual(lastKv - 1e-6);
        lastKv = tech.kvp;
      }
    }
  });

  it("steps the Cu filter down as the patient thickens (fluoroscopy)", () => {
    const cu = [10, 15, 22, 27, 30, 40].map((t) => techniqueFor(S(), t).tech.cuMm);
    for (let i = 1; i < cu.length; i++) expect(cu[i]).toBeLessThanOrEqual(cu[i - 1]);
    expect(cu[0]).toBe(0.9);
    expect(cu[cu.length - 1]).toBe(0.1);
  });

  it("holds the detector on target until a limit binds", () => {
    for (const t of [12, 18, 24, 28]) {
      const st = steadyState(S(), t);
      expect(st.limit).toBe("none");
      expect(st.signalRel).toBeGreaterThan(0.97);
      expect(st.signalRel).toBeLessThan(1.03);
    }
  });

  it("never exceeds the regulatory air kerma rate in fluoroscopy; cine is exempt", () => {
    for (const t of thick) {
      for (const pps of [7.5, 15, 30] as const) {
        const n = steadyState(S({ fluoroPps: pps }), t);
        expect(n.akrFdaMGyMin).toBeLessThanOrEqual(AKR_LIMIT_MGY_MIN * 1.0001);
        const h = steadyState(S({ fluoroPps: pps, fluoroLevel: "high" }), t);
        expect(h.akrFdaMGyMin).toBeLessThanOrEqual(AKR_LIMIT_HIGH_MGY_MIN * 1.0001);
      }
    }
    const c = steadyState(S({ mode: "cine", cinePps: 15 }), 34);
    expect(c.akrFdaMGyMin).toBeGreaterThan(AKR_LIMIT_MGY_MIN);
  });

  it("never exceeds the AKR limit between trajectory nodes (dense thickness scan)", () => {
    const toFda = ((SOD_MM - IRP_FROM_ISO_MM) / (SID_MM - FDA_POINT_FROM_DETECTOR_MM)) ** 2;
    let worst = 0;
    for (const level of ["low", "normal", "high"] as const) {
      for (const pps of [7.5, 15, 30] as const) {
        for (const fieldMm of [150, 200, 250, 300]) {
          const s = S({ fluoroLevel: level, fluoroPps: pps, fieldMm });
          const lim = level === "high" ? AKR_LIMIT_HIGH_MGY_MIN : AKR_LIMIT_MGY_MIN;
          for (let t = 0; t <= 60; t += 0.37) {
            const { tech, limit } = techniqueFor(s, t);
            const akr = kermaIrpPerPulse(tech, s) * pps * 60 * toFda;
            worst = Math.max(worst, akr / lim);
            expect(akr).toBeLessThanOrEqual(lim * (1 + 1e-6));
            if (akr > lim * 0.999) expect(limit === "akr" || limit === "akr-high").toBe(true);
          }
        }
      }
    }
    expect(worst).toBeGreaterThan(0.999); // the scan does reach the limit
  });

  it("lets detector dose and noise rise once the limit binds", () => {
    const at = steadyState(S(), 40);
    expect(at.limit).toBe("akr");
    expect(at.signalRel).toBeLessThan(0.6);
    const ok = steadyState(S(), 20);
    expect(at.image.noiseRel / ok.image.noiseRel).toBeGreaterThan(1.3);
  });

  it("makes steep LAO cranial in a large patient noisier than AP (SD ratio)", () => {
    const steep = steadyState(S(), patientPath({ laoRao: 50, cranialCaudal: 30 }, { habitus: 1.3 }));
    const ap = steadyState(S(), patientPath({ laoRao: 0, cranialCaudal: 0 }, { habitus: 1 }));
    expect(steep.limit).toBe("akr");
    const sdRatio = steep.image.noiseRel / ap.image.noiseRel;
    expect(sdRatio).toBeGreaterThan(1.15);
    // and a thinner kVp-heavy beam lowers iodine contrast
    expect(steep.image.iodineGain).toBeLessThan(ap.image.iodineGain);
  });

  it("gives fluoroscopy less detector dose per frame than cine", () => {
    for (const fieldMm of [150, 170, 200, 230, 250]) {
      for (const level of ["low", "normal", "high"] as const) {
        expect(targetDetectorNGy(S({ mode: "fluoro", fluoroLevel: level, fieldMm }))).toBeLessThan(targetDetectorNGy(S({ mode: "cine", fieldMm })));
      }
      const f = steadyState(S({ fieldMm }), 20);
      const c = steadyState(S({ mode: "cine", fieldMm }), 20);
      expect(f.detectorNGy).toBeLessThan(c.detectorNGy);
      expect(f.image.counts).toBeLessThan(c.image.counts);
    }
  });

  it("raises patient dose monotonically with thickness up to the limit", () => {
    let last = 0;
    for (let t = 10; t <= 45; t += 1) {
      const r = steadyState(S(), t).kermaRateIrpMGyMin;
      expect(r).toBeGreaterThanOrEqual(last * 0.999);
      last = r;
    }
  });

  it("orders fluoroscopy levels low < normal < high, about 2x per step", () => {
    const low = steadyState(S({ fluoroLevel: "low" }), 20).kermaRateIrpMGyMin;
    const nor = steadyState(S({ fluoroLevel: "normal" }), 20).kermaRateIrpMGyMin;
    const high = steadyState(S({ fluoroLevel: "high" }), 20).kermaRateIrpMGyMin;
    expect(nor / low).toBeGreaterThan(1.5);
    expect(nor / low).toBeLessThan(2.6);
    expect(high / nor).toBeGreaterThan(1.5);
    expect(high / nor).toBeLessThan(2.6);
  });

  it("doubles the fluoroscopy dose rate when the pulse rate doubles", () => {
    const r75 = steadyState(S({ fluoroPps: 7.5 }), 22).kermaRateIrpMGyMin;
    const r15 = steadyState(S({ fluoroPps: 15 }), 22).kermaRateIrpMGyMin;
    const r30 = steadyState(S({ fluoroPps: 30 }), 22).kermaRateIrpMGyMin;
    expect(r15 / r75).toBeCloseTo(2, 2);
    expect(r30 / r15).toBeCloseTo(2, 2);
  });

  it("raises the dose rate with magnification (smaller field), about 1/FOV", () => {
    const big = steadyState(S({ fieldMm: 250 }), 20);
    const small = steadyState(S({ fieldMm: 150 }), 20);
    const ratio = small.kermaRateIrpMGyMin / big.kermaRateIrpMGyMin;
    expect(ratio).toBeGreaterThan(1.4);
    expect(ratio).toBeLessThan(2.0);
    // and the image is noisier per rendered pixel despite the higher dose
    expect(small.image.noiseRel).toBeGreaterThan(big.image.noiseRel);
  });

  it("lowers dose with the grid out (air gap) by about a third", () => {
    const gin = steadyState(S({ grid: true }), 22).kermaRateIrpMGyMin;
    const gout = steadyState(S({ grid: false }), 22).kermaRateIrpMGyMin;
    const red = 1 - gout / gin;
    // Partridge et al. 2006: 23-39% lower DAP with gridless air-gap angiography
    expect(red).toBeGreaterThan(0.23);
    expect(red).toBeLessThan(0.39);
  });

  it("lowers iodine and metal effectiveness as kVp rises", () => {
    const thin = steadyState(S({ mode: "cine" }), 16);
    const thickSt = steadyState(S({ mode: "cine" }), 34);
    expect(thickSt.technique.kvp).toBeGreaterThan(thin.technique.kvp);
    expect(thickSt.image.iodineGain).toBeLessThan(thin.image.iodineGain);
    expect(thickSt.image.metalGain).toBeLessThan(thin.image.metalGain);
  });

  it("stays near the published reference levels for a standard 20 cm patient", () => {
    // Simantirakis et al. 2013: reference levels 29 mGy/min (fluoroscopy) and 0.23 mGy/frame (cine)
    const f = steadyState(S({ fluoroPps: 15 }), 20);
    const c = steadyState(S({ mode: "cine" }), 20);
    expect(f.kermaRateIrpMGyMin).toBeLessThan(29);
    expect(f.kermaRateIrpMGyMin).toBeGreaterThan(3);
    expect(c.kermaIrpPerPulseMGy).toBeLessThan(0.23);
    expect(c.kermaIrpPerPulseMGy).toBeGreaterThan(0.03);
  });
});

// ---------------------------------------------------------------------------
describe("ADRC loop dynamics", () => {
  it("follows a step in thickness with a first-order lag of about 2.5 frames", () => {
    const a = new Adrc({ startCm: 20, lagFrames: 2.5, meterLatency: 1 });
    const set = S();
    a.settle({ settings: set, waterCm: 20 });
    expect(a.equivalentCm).toBeCloseTo(20, 1);
    // step to 26 cm: the first frame still meters the old technique through the new patient
    const seq: number[] = [];
    for (let i = 0; i < 20; i++) seq.push(a.step({ settings: set, waterCm: 26 }).equivCm);
    const alpha = 1 - Math.exp(-1 / 2.5);
    expect(seq[0] - 20).toBeCloseTo(alpha * 6, 1);
    expect(seq[3]).toBeGreaterThan(24);
    expect(seq[19]).toBeCloseTo(26, 1);
    // monotone approach, no overshoot
    for (let i = 1; i < seq.length; i++) expect(seq[i]).toBeGreaterThanOrEqual(seq[i - 1] - 1e-9);
    expect(Math.max(...seq)).toBeLessThan(26.05);
  });

  it("gives the same result from a meter read-back as from the analytic path", () => {
    const set = S();
    const geoLoop = new Adrc({ startCm: 15 });
    const meterLoop = new Adrc({ startCm: 15 });
    let last: AdrcState | null = null;
    for (let i = 0; i < 40; i++) {
      geoLoop.step({ settings: set, waterCm: 24 });
      last = meterLoop.step({ settings: set, waterCm: 24, meter: last ? { frame: last.frame, signalRel: last.signalRel } : null });
    }
    expect(meterLoop.equivalentCm).toBeCloseTo(geoLoop.equivalentCm, 1);
    expect(last!.signalRel).toBeCloseTo(1, 1);
  });

  it("accepts a meter reading without a frame (taken as the exposure meterLatency steps back)", () => {
    const set = S();
    const geoLoop = new Adrc({ startCm: 15 });
    const meterLoop = new Adrc({ startCm: 15 });
    let last: AdrcState | null = null;
    for (let i = 0; i < 40; i++) {
      geoLoop.step({ settings: set, waterCm: 24 });
      last = meterLoop.step({ settings: set, waterCm: 24, meter: last ? { signalRel: last.signalRel } : null });
    }
    expect(last!.meterSource).toBe("meter");
    expect(meterLoop.equivalentCm).toBeCloseTo(geoLoop.equivalentCm, 1);
  });

  it("falls back to the analytic path when a meter frame does not match any exposure", () => {
    const set = S();
    const a = new Adrc({ startCm: 20 });
    let st: AdrcState | null = null;
    // a renderer frame counter that runs ahead of the controller's (pedal-up frames rendered too)
    for (let i = 0; i < 60; i++) st = a.step({ settings: set, waterCm: 28, meter: { frame: 1000 + 3 * i, signalRel: 0.8 } });
    expect(st!.meterSource).toBe("analytic-fallback");
    expect(st!.meterMisses).toBe(60);
    // the loop still converges on the patient instead of freezing at startCm
    expect(a.equivalentCm).toBeCloseTo(28, 1);
    expect(st!.signalRel).toBeCloseTo(1, 1);
    // a stale frame number (beyond the 16-exposure history) also falls back
    const stale = a.step({ settings: set, waterCm: 28, meter: { frame: 2, waterCm: 10 } });
    expect(stale.meterSource).toBe("analytic-fallback");
    expect(a.equivalentCm).toBeCloseTo(28, 1);
  });

  it("reports the analytic source when no meter is wired", () => {
    const a = new Adrc();
    expect(a.step({ settings: S(), waterCm: 20 }).meterSource).toBe("none");
    expect(a.step({ settings: S(), waterCm: 20 }).meterSource).toBe("analytic");
  });

  it("passes grid and pulse width to the image parameters and can keep the legacy AP calibration", () => {
    const ap = steadyState(S({ mode: "cine" }), 20);
    const phys = imageParamsFromAdrc(ap);
    expect(phys.gridIn).toBe(true);
    expect(phys.pulseWidthMs).toBe(ap.technique.pulseMs);
    expect(imageParamsFromAdrc(steadyState(S({ grid: false }), 20)).gridIn).toBe(false);
    const leg = imageParamsFromAdrc(ap, { calibration: "legacy-ap" });
    expect(leg.iodineGain).toBeCloseTo(LEGACY_AP_IODINE_GAIN, 6);
    expect(leg.metalGain).toBeCloseTo(LEGACY_AP_METAL_GAIN, 6);
    // relative change with thickness is preserved
    const thickSt = steadyState(S({ mode: "cine" }), 32);
    const r1 = imageParamsFromAdrc(thickSt).iodineGain / phys.iodineGain;
    const r2 = imageParamsFromAdrc(thickSt, { calibration: "legacy-ap" }).iodineGain / leg.iodineGain;
    expect(r2).toBeCloseTo(r1, 9);
  });

  it("keeps the cine AKR limit as Infinity through snapshot and restore", () => {
    const a = new Adrc();
    a.step({ settings: S({ mode: "cine" }), waterCm: 20 });
    const b = new Adrc();
    b.restore(a.snapshot());
    expect(b.state!.akrLimitMGyMin).toBe(Infinity);
  });

  it("carries the equivalent thickness from fluoroscopy into cine", () => {
    const a = new Adrc();
    a.settle({ settings: S(), waterCm: 27 });
    const first = a.step({ settings: S({ mode: "cine" }), waterCm: 27 });
    expect(first.equivCm).toBeCloseTo(27, 0);
    expect(first.signalRel).toBeGreaterThan(0.9);
  });

  it("snapshots and restores deterministically", () => {
    const a = new Adrc();
    for (let i = 0; i < 7; i++) a.step({ settings: S(), waterCm: 18 + i });
    const snap = a.snapshot();
    const run = (x: Adrc) => [0, 1, 2, 3].map((i) => x.step({ settings: S({ mode: i > 1 ? "cine" : "fluoro" }), waterCm: 30 }).technique.kvp);
    const r1 = run(a);
    const b = new Adrc();
    b.restore(snap);
    expect(run(b)).toEqual(r1);
  });
});

// ---------------------------------------------------------------------------
describe("angulation and habitus", () => {
  it("matches Kuon 2004 angulation ratios (the fit of the path model)", () => {
    const ap = rateAt({ laoRao: 0, cranialCaudal: 0 });
    expect(rateAt({ laoRao: 100, cranialCaudal: 0 }) / ap).toBeCloseTo(3.7, 1);
    expect(rateAt({ laoRao: -100, cranialCaudal: 0 }) / ap).toBeCloseTo(3.7, 1);
    expect(rateAt({ laoRao: 0, cranialCaudal: 30 }) / ap).toBeCloseTo(2.5, 1);
    expect(rateAt({ laoRao: 0, cranialCaudal: -30 }) / ap).toBeCloseTo(2.5, 1);
    expect(PATH_MODEL.LAT_DENSITY).toBeGreaterThan(PATH_MODEL.AP_DENSITY * 0.5);
  });

  it("raises Ka,r with steeper angulation", () => {
    const ap = rateAt({ laoRao: 0, cranialCaudal: 0 });
    const lao30 = rateAt({ laoRao: 30, cranialCaudal: 0 });
    const lao45cra25 = rateAt({ laoRao: 45, cranialCaudal: 25 });
    const lao60cra30 = rateAt({ laoRao: 60, cranialCaudal: 30 });
    expect(lao30).toBeGreaterThan(ap);
    expect(lao45cra25).toBeGreaterThan(lao30);
    expect(lao60cra30).toBeGreaterThan(lao45cra25);
    // independent check against Kuon 2004 (not fitted): LAO 60 / caudal 20 vs PA caudal 30, reported 2.6x
    const r = rateAt({ laoRao: 60, cranialCaudal: -20 }) / rateAt({ laoRao: 0, cranialCaudal: -30 });
    expect(r).toBeGreaterThan(1.5);
    expect(r).toBeLessThan(3.5);
  });

  it("raises Ka,r with habitus", () => {
    const c: CArm = { laoRao: -30, cranialCaudal: 0 };
    expect(rateAt(c, {}, 1.15)).toBeGreaterThan(rateAt(c, {}, 1));
    expect(rateAt(c, {}, 1)).toBeGreaterThan(rateAt(c, {}, 0.9));
  });
});

// ---------------------------------------------------------------------------
describe("dose bookkeeping", () => {
  const AP: CArm = { laoRao: 0, cranialCaudal: 0 };

  it("halves KAP per frame when collimated to half the area, with Ka,r unchanged", () => {
    const a = new DoseTracker();
    const b = new DoseTracker();
    runBeam(a, AP, {}, 2);
    // close the left and right shutters by a quarter each: half the area
    runBeam(b, AP, {}, 2, { shutters: [0.25, 0.25, 0, 0] });
    expect(b.totals.kapGyCm2.total / a.totals.kapGyCm2.total).toBeCloseTo(0.5, 6);
    expect(b.totals.karMGy.total).toBeCloseTo(a.totals.karMGy.total, 6);
    expect(fieldAreaAtIrpCm2(230, [0.25, 0.25, 0, 0])).toBeCloseTo(fieldAreaAtIrpCm2(230) / 2, 6);
  });

  it("doubles the fluoroscopy dose rate when the pulse rate doubles", () => {
    const a = new DoseTracker();
    const b = new DoseTracker();
    runBeam(a, AP, { fluoroPps: 7.5 }, 3);
    runBeam(b, AP, { fluoroPps: 15 }, 3);
    expect(b.totals.karMGy.fluoro / a.totals.karMGy.fluoro).toBeCloseTo(2, 3);
    expect(b.live.akrMGyMin / a.live.akrMGyMin).toBeCloseTo(2, 2);
  });

  it("raises Ka,r and KAP with steeper angulation", () => {
    const a = new DoseTracker();
    const b = new DoseTracker();
    runBeam(a, AP, {}, 3);
    runBeam(b, { laoRao: 45, cranialCaudal: 25 }, {}, 3);
    expect(b.totals.karMGy.total).toBeGreaterThan(a.totals.karMGy.total * 1.5);
    expect(b.totals.kapGyCm2.total).toBeGreaterThan(a.totals.kapGyCm2.total * 1.5);
  });

  it("raises the dose rate with magnification", () => {
    const a = new DoseTracker();
    const b = new DoseTracker();
    runBeam(a, AP, { fieldMm: 230 }, 2);
    runBeam(b, AP, { fieldMm: 150 }, 2);
    expect(b.live.akrMGyMin).toBeGreaterThan(a.live.akrMGyMin * 1.3);
    // but KAP falls, because the beam is smaller
    expect(b.totals.kapGyCm2.total).toBeLessThan(a.totals.kapGyCm2.total);
  });

  it("keeps fluoroscopy and cine separate, counts frames and runs", () => {
    const tr = new DoseTracker();
    runBeam(tr, AP, { mode: "fluoro" }, 10);
    runBeam(tr, AP, { mode: "cine", cinePps: 15 }, 4);
    tr.idle(1);
    runBeam(tr, { laoRao: -30, cranialCaudal: 0 }, { mode: "cine", cinePps: 15 }, 3);
    tr.idle(1);
    const t = tr.totals;
    expect(t.fluoroTimeS).toBeCloseTo(10, 6);
    expect(t.cineTimeS).toBeCloseTo(7, 6);
    expect(t.cineFrames).toBeCloseTo(105, 6);
    expect(t.cineRuns).toBe(2);
    expect(t.karMGy.total).toBeCloseTo(t.karMGy.fluoro + t.karMGy.cine, 9);
    expect(t.karMGy.cine).toBeGreaterThan(0);
    // cine per second far above fluoroscopy per second
    expect(t.karMGy.cine / t.cineTimeS).toBeGreaterThan((3 * t.karMGy.fluoro) / t.fluoroTimeS);
    const runs = tr.drainEvents().filter((e) => e.kind === "dose.cine-run");
    expect(runs.length).toBe(2);
    expect(runs[0].data!.frames).toBe(60);
  });

  it("reports the live air kerma rate over the last second", () => {
    const tr = new DoseTracker();
    const st = runBeam(tr, AP, {}, 3);
    expect(tr.live.akrMGyMin / st.kermaRateIrpMGyMin).toBeCloseTo(1, 6);
    tr.idle(2);
    expect(tr.live.beamOn).toBe(false);
    expect(tr.live.akrMGyMin).toBe(0);
  });

  it("signals every 5 minutes of fluoroscopy", () => {
    const tr = new DoseTracker();
    runBeam(tr, AP, { fluoroPps: 7.5 }, 11 * 60, { fps: 5 });
    const ev = tr.drainEvents().filter((e) => e.kind === "dose.fluoro-5min");
    expect(ev.map((e) => e.data!.fluoroMin)).toEqual([5, 10]);
  });

  it("announces the follow-up trigger levels once each", () => {
    const tr = new DoseTracker();
    // a long, steep, large-patient cine-heavy case
    for (let i = 0; i < 40; i++) {
      runBeam(tr, { laoRao: 50, cranialCaudal: 30 }, { mode: "cine" }, 5, { habitus: 1.2 });
      tr.idle(1);
    }
    const kinds = tr
      .drainEvents()
      .filter((e) => e.kind === "dose.trigger")
      .map((e) => e.data!.metric);
    expect(tr.totals.karMGy.total).toBeGreaterThan(DOSE_TRIGGERS.karMGy);
    expect(kinds.filter((k) => k === "kar").length).toBe(1);
    expect(kinds).toContain("peakSkin");
  });

  it("announces an air kerma rate limit once per beam-on period", () => {
    const tr = new DoseTracker();
    runBeam(tr, { laoRao: 50, cranialCaudal: 30 }, {}, 2, { habitus: 1.3 });
    tr.idle(1);
    runBeam(tr, { laoRao: 50, cranialCaudal: 30 }, {}, 2, { habitus: 1.3 });
    const ev = tr.drainEvents().filter((e) => e.kind === "dose.akr-limit");
    expect(ev.length).toBe(2);
  });

  it("puts AP skin dose on the posterior midline and LAO 90 on the patient's right flank", () => {
    const tr = new DoseTracker();
    const st = runBeam(tr, AP, {}, 5);
    const m = tr.skinMap;
    let best = 0;
    let bestCol = -1;
    for (let c = 0; c < m.cols; c++) {
      for (let r = 0; r < m.rows; r++) {
        if (m.dose[r * m.cols + c] > best) {
          best = m.dose[r * m.cols + c];
          bestCol = c;
        }
      }
    }
    const psi = m.psi0Deg + bestCol * m.dPsiDeg;
    expect(Math.abs(psi)).toBeLessThan(12);
    // peak skin dose ~ Ka,r x table x backscatter x f (skin at the IRP)
    const kar = tr.totals.karMGy.total;
    expect(tr.totals.peakSkinMGy / kar).toBeGreaterThan(0.9);
    expect(tr.totals.peakSkinMGy / kar).toBeLessThan(1.3);
    expect(st.limit).toBe("none");

    const lat = new DoseTracker();
    runBeam(lat, { laoRao: 90, cranialCaudal: 0 }, {}, 5);
    const ml = lat.skinMap;
    let b2 = 0;
    let c2 = -1;
    for (let c = 0; c < ml.cols; c++) for (let r = 0; r < ml.rows; r++) if (ml.dose[r * ml.cols + c] > b2) { b2 = ml.dose[r * ml.cols + c]; c2 = c; }
    const psi2 = ml.psi0Deg + c2 * ml.dPsiDeg;
    // LAO 90: the tube is on the patient's right, psi = -90
    expect(psi2).toBeGreaterThan(-115);
    expect(psi2).toBeLessThan(-65);
  });

  it("spreads skin dose when the angle changes (lower peak skin dose than one fixed angle)", () => {
    const fixed = new DoseTracker();
    const varied = new DoseTracker();
    const views: CArm[] = [
      { laoRao: -30, cranialCaudal: 25 },
      { laoRao: 45, cranialCaudal: 25 },
      { laoRao: -20, cranialCaudal: -20 },
      { laoRao: 40, cranialCaudal: -30 },
    ];
    for (const v of views) runBeam(fixed, views[0], { mode: "cine" }, 4);
    for (const v of views) runBeam(varied, v, { mode: "cine" }, 4);
    const ratioFixed = fixed.totals.peakSkinMGy / fixed.totals.karMGy.total;
    const ratioVaried = varied.totals.peakSkinMGy / varied.totals.karMGy.total;
    expect(ratioVaried).toBeLessThan(ratioFixed * 0.8);
  });

  it("raises peak skin dose when the table is lowered (skin closer to the tube)", () => {
    const high = new DoseTracker();
    const low = new DoseTracker();
    runBeam(high, AP, {}, 5, { iso: ISO });
    runBeam(low, AP, {}, 5, { iso: { ...ISO, z: ISO.z + 80 } });
    expect(low.totals.karMGy.total).toBeCloseTo(high.totals.karMGy.total, 6);
    expect(low.totals.peakSkinMGy).toBeGreaterThan(high.totals.peakSkinMGy * 1.2);
  });

  it("scales operator scatter by angulation (Kuon 2004) and shielding", () => {
    expect(operatorSideFactor(0)).toBeCloseTo(1, 9);
    expect(operatorSideFactor(100)).toBeCloseTo(10.6 / 3.7, 6);
    expect(operatorSideFactor(-100)).toBeCloseTo(2.4 / 3.7, 6);
    const noShield: OperatorSetup = { access: "femoral", ceilingShield: false, tableSkirt: false };
    const shielded: OperatorSetup = { access: "femoral", ceilingShield: true, tableSkirt: true };
    const a = new DoseTracker();
    const b = new DoseTracker();
    const c = new DoseTracker();
    runBeam(a, AP, {}, 3, { operator: noShield });
    runBeam(b, { laoRao: 60, cranialCaudal: 0 }, {}, 3, { operator: noShield });
    runBeam(c, AP, {}, 3, { operator: shielded });
    // LAO: operator dose rises more than patient KAP
    const opRatio = b.totals.operatorEye.total / a.totals.operatorEye.total;
    const kapRatio = b.totals.kapGyCm2.total / a.totals.kapGyCm2.total;
    expect(opRatio).toBeGreaterThan(kapRatio * 1.5);
    expect(c.totals.operatorEye.total / a.totals.operatorEye.total).toBeCloseTo(0.15, 6);
    expect(c.totals.operatorLegs.total / a.totals.operatorLegs.total).toBeCloseTo(0.1, 6);
    // unshielded PA normal fluoroscopy is the reference rate
    expect(a.live.operatorRateRel).toBeCloseTo(1, 1);
  });

  it("lands a typical diagnostic angiogram near published patient dose levels", () => {
    // 5 min of fluoroscopy across the standard views and 8 cine runs of 4 s at 15 frames/s
    const views: CArm[] = [
      { laoRao: -30, cranialCaudal: -25 },
      { laoRao: -30, cranialCaudal: 25 },
      { laoRao: 0, cranialCaudal: 35 },
      { laoRao: 45, cranialCaudal: 25 },
      { laoRao: 45, cranialCaudal: -30 },
      { laoRao: 0, cranialCaudal: -30 },
      { laoRao: 40, cranialCaudal: 0 },
      { laoRao: -30, cranialCaudal: 0 },
    ];
    const tr = new DoseTracker();
    for (const v of views) {
      runBeam(tr, v, { mode: "fluoro" }, 300 / views.length, { fps: 5 });
      runBeam(tr, v, { mode: "cine" }, 4);
      tr.idle(5);
    }
    const t = tr.totals;
    // Neofotistou 2003 / Simantirakis 2013 reference levels for coronary angiography: 45 and 53 Gy cm2;
    // Agarwal 2014: median Ka,r 677 mGy for diagnostic catheterisation (US practice)
    expect(t.kapGyCm2.total).toBeGreaterThan(8);
    expect(t.kapGyCm2.total).toBeLessThan(60);
    expect(t.karMGy.total).toBeGreaterThan(100);
    expect(t.karMGy.total).toBeLessThan(1000);
    expect(t.peakSkinMGy).toBeLessThan(DOSE_TRIGGERS.peakSkinMGy);
  });

  it("snapshots and restores the tracker", () => {
    const a = new DoseTracker();
    runBeam(a, AP, {}, 2);
    runBeam(a, { laoRao: 30, cranialCaudal: 20 }, { mode: "cine" }, 1);
    const snap = a.snapshot();
    const b = new DoseTracker();
    b.restore(snap);
    runBeam(a, AP, {}, 1);
    runBeam(b, AP, {}, 1);
    expect(b.totals).toEqual(a.totals);
    expect(Array.from(b.skinMap.dose)).toEqual(Array.from(a.skinMap.dose));
    expect(b.drainEvents()).toEqual(a.drainEvents());
  });

  it("restores the patient time stamped on events emitted after a restore", () => {
    const a = new DoseTracker();
    const s = S({ mode: "cine" });
    const st = steadyState(s, patientPath(AP, { habitus: 1 }));
    for (let i = 0; i < 15; i++) a.expose({ adrc: st, dtS: 1 / 15, geometry: geo(AP, s.fieldMm), body: bodyFromHabitus(1), tPatient: 120 + i / 15 });
    a.drainEvents();
    const snap = a.snapshot();
    const b = new DoseTracker();
    b.expose({ adrc: st, dtS: 1 / 15, geometry: geo(AP, s.fieldMm), body: bodyFromHabitus(1), tPatient: 5 });
    b.restore(snap);
    b.idle(1); // closes the cine run and emits its event
    a.idle(1);
    const eb = b.drainEvents();
    const ea = a.drainEvents();
    expect(eb.length).toBeGreaterThan(0);
    expect(eb).toEqual(ea);
    for (const e of eb) expect(e.tPatient).toBeCloseTo(120 + 14 / 15, 9);
  });
});
