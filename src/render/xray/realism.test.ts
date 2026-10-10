// ---------------------------------------------------------------------------
// Realism gates computable on the CPU (no WebGL). Thresholds are read from
// datasets/library/realism_targets.json (scripts/realism/targets.py), never typed here.
//
// Three groups:
//  1. the targets file itself (complete, sane bands, AngioCAD kept out of temporal targets,
//     the audit's published medians reproduced);
//  2. capture invariants that hold now (cranial sign, exact frame timestamps, determinism);
//  3. gap gates: simulator quantities that the realism streams must move into the real bands
//     (vessel and catheter motion, contrast time course). They are always measured and printed;
//     the band assertion runs when REALISM_STRICT=1. Each owning stream activates its gate in its
//     own test file by importing the same helpers from src/dev/xrayCapture.ts and the same target
//     (see docs/realism/wave1/S0.md, "Activating a gate").
// ---------------------------------------------------------------------------
/// <reference types="vite/client" />
import { afterAll, describe, expect, it } from "vitest";
import { drillStats, wilson } from "../../ui/angio/RealOrSimDrill";
import { makeCamera } from "./sceneBuilder";
import {
  arrivalFeatures,
  catheterTipTrack,
  fieldBoxPx,
  findTarget,
  inBand,
  iodineSeries,
  landmarkMotionMm,
  motionStats,
  pixelScale,
  prepareScenario,
  px512PerNative,
  resolveSpec,
  runParams,
  simulateSequence,
  standardSpecs,
  timingFeatures,
  vesselTrack,
  type CaptureSpec,
  type RealismTarget,
} from "../../dev/xrayCapture";

// datasets/library/ is built locally and never committed: load it optionally so a checkout without the
// library still runs the invariants, and the library-dependent groups report as skipped
const LIB = import.meta.glob<{ default: unknown }>(
  ["../../../datasets/library/realism_targets.json", "../../../datasets/library/sim-clips/index.json", "../../../datasets/library/dominance/index.json", "../../../datasets/library/dominance-main/index.json"],
  { eager: true }
);
const libFile = (name: string) => LIB[`../../../datasets/library/${name}`]?.default;
const HAVE_TARGETS = !!libFile("realism_targets.json");
const doc = (libFile("realism_targets.json") ?? { targets: [], reproduction: [], temporalExclusions: [] }) as {
  targets: RealismTarget[];
  reproduction: { what: string; audit: number; harness: number | null; tol: number | null; within_tol: boolean | null; within_5pct: boolean | null; tol_reason?: string; information_only?: boolean }[];
  temporalExclusions: string[];
};
const simIndex = libFile("sim-clips/index.json");
const domDs = libFile("dominance/index.json");
const domMain = libFile("dominance-main/index.json");
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const STRICT = env.REALISM_STRICT === "1";

// ---------------------------------------------------------------------------
describe.skipIf(!HAVE_TARGETS)("realism targets file (scripts/realism/targets.py)", () => {
  it("has well-formed targets with bands inside the observed range", () => {
    expect(doc.targets.length).toBeGreaterThan(200);
    for (const t of doc.targets) {
      expect(["lossless", "matched"]).toContain(t.pipeline);
      expect(t.n).toBeGreaterThan(0);
      expect(t.band[0]).toBeLessThanOrEqual(t.band[1]);
      expect(t.median >= t.band[0] - 1e-9 && t.median <= t.band[1] + 1e-9, `${t.metric} ${t.profile} ${t.pipeline}`).toBe(true);
      expect(t.method.length).toBeGreaterThan(10);
    }
  });

  it("covers every metric family of the plan's measurement targets", () => {
    const need: [string, Partial<{ profile: string; pipeline: string; artery: string; view: string }>][] = [
      ["noise.sigma_t", { pipeline: "lossless" }],
      ["noise.dark_bright_ratio", { pipeline: "lossless" }],
      ["noise.acf_lag1", { pipeline: "lossless" }],
      ["noise.acf_lag2", { pipeline: "lossless" }],
      ["noise.nps_low_frac", { pipeline: "lossless" }],
      ["noise.rho_temporal", { pipeline: "lossless" }],
      ["noise.sigma_t_by_grey20.200-219", { profile: "cd-main" }],
      ["settle.first_pair_ratio", { pipeline: "lossless" }],
      ["texture.bandpass_rms.bright", {}],
      ["spectrum.beta_lo", {}],
      ["ridges.pre_base", {}],
      ["local_contrast.pre", { artery: "LCA" }],
      ["vessel.rib-margin.fwhm_px", { pipeline: "lossless" }],
      ["vessel.endplate.depth", { pipeline: "lossless" }],
      ["edge.heart-border.overshoot", { pipeline: "lossless" }],
      ["halo_auto.overshoot", {}],
      ["vessel.vessel-large.w80_w20", { pipeline: "lossless" }],
      ["vessel.vessel-small.depth", { pipeline: "lossless" }],
      ["catheter.catheter.lumen_contrast", { pipeline: "lossless" }],
      ["grey.p5", { profile: "cd-ds+cd-main", artery: "LCA", view: "RAO-CAU" }],
      ["field.edge02_rel", {}],
      ["xtrack.motion-LAD.range_px", { pipeline: "lossless" }],
      ["xtrack.motion-RCA.step_max", { pipeline: "lossless" }],
      ["xtrack.motion-cath.range_px", { pipeline: "lossless" }],
      ["motion_block.median", {}],
      ["timing.f10_s", { pipeline: "lossless" }],
      ["timing.rise_s", { pipeline: "lossless" }],
      ["timing.wash50_after_peak_s", { pipeline: "lossless" }],
      ["timing.end_rel", { pipeline: "lossless" }],
      ["opacified.area10", {}],
      ["heart_rate.bpm", {}],
    ];
    const missing = need.filter(([m, o]) => !findTarget(doc, m, o)).map(([m]) => m);
    expect(missing).toEqual([]);
  });

  it("keeps AngioCAD (frame rate not stated) out of every temporal target", () => {
    expect(doc.temporalExclusions).toContain("angiocad");
    const temporal = /^(timing|settle|heart_rate|motion_block|xtrack|opacified|local_contrast\.peak|noise\.rho)/;
    expect(doc.targets.filter((t) => t.profile === "angiocad" && temporal.test(t.metric))).toEqual([]);
  });

  it("reproduces every checked audit value within its stated tolerance (5% unless the row gives a rounding reason)", () => {
    const checked = doc.reproduction.filter((r) => !r.information_only);
    expect(checked.length).toBeGreaterThan(100);
    for (const r of checked) {
      expect(r.within_tol, `${r.what}: audit ${r.audit}, harness ${r.harness}`).toBe(true);
      // a tolerance wider than 5% must say why
      if (!r.within_5pct) expect(r.tol_reason, r.what).toBeTruthy();
    }
  });

  it("reproduces the audit's headline medians within 5%", () => {
    const core = [
      "noise SD, Azurion lossless",
      "noise dark/bright ratio",
      "settling: first pair",
      "lung band-pass 4-32 px RMS",
      "timing rise 10-90% (frames)",
      "timing f10 frame",
      "timing end-of-run level",
      "grey p5 LCA RAO-CAU",
      "vessel LM_RAOcau FWHM px",
      "motion cd-01031-LCA-6:LAD_prox_x250 range px",
      "tortuosity 8-20 mm band, real LAD RAO cranial median",
      "NCC displacement P10-P90, RCA LAO median",
    ];
    for (const c of core) {
      const row = doc.reproduction.find((r) => r.what.startsWith(c));
      expect(row, c).toBeTruthy();
      expect(row!.within_5pct, `${c}: audit ${row!.audit}, harness ${row!.harness}`).toBe(true);
    }
  });

  it("splits sequence targets by view family and adds geometry and arrival targets", () => {
    expect(findTarget(doc, "timing.f50_s", { pipeline: "lossless", artery: "LCA", view: "RAO-CRA" })).toBeTruthy();
    expect(findTarget(doc, "opacified.area10", { artery: "LCA", view: "RAO-CRA" })).toBeTruthy();
    expect(findTarget(doc, "local_contrast.pre", { artery: "RCA", view: "LAO-0" })).toBeTruthy();
    const geo = { profile: "cd-ds+cd-main", pipeline: "matched" };
    for (const [m, a, v] of [
      ["tortuosity.b8_20", "LCA", "RAO-CRA"],
      ["tortuosity.b3_8", "RCA", "LAO-0"],
      ["shape.length_mm", "LCA", "RAO-CRA"],
      ["extent.width_mm", "LCA", "RAO-CAU"],
      ["motion_mm.p10p90", "RCA", "any"],
      ["motion_mm.speed_median", "LCA", "any"],
    ] as const)
      expect(findTarget(doc, m, { ...geo, artery: a, view: v }), `${m} ${a} ${v}`).toBeTruthy();
    const f0 = findTarget(doc, "arrival.at_frame0", { pipeline: "lossless", artery: "LCA" });
    expect(f0?.band).toEqual([0, 0]);
  });
});

// ---------------------------------------------------------------------------
describe("capture invariants", () => {
  it("cranial angulation puts the detector head-wards (sign fixed in wave 0)", () => {
    const iso = { x: 0, y: 0, z: 0 };
    expect(makeCamera({ laoRao: 0, cranialCaudal: 30 }, iso, 200).detC.y).toBeGreaterThan(0);
    expect(makeCamera({ laoRao: 0, cranialCaudal: -30 }, iso, 200).detC.y).toBeLessThan(0);
    expect(makeCamera({ laoRao: 30, cranialCaudal: 0 }, iso, 200).detC.x).toBeGreaterThan(0);
  });

  it("stamps frame k at exactly t0 + k / fps and keeps warm-up frames before 0", () => {
    const fr = simulateSequence({ set: "t", name: "ts", view: "raocaudal", fps: 15, nFrames: 15, t0: 0.37, injection: null, warmup: 2 });
    expect(fr.map((f) => f.k)).toEqual([-2, -1, ...Array.from({ length: 15 }, (_, k) => k)]);
    for (const f of fr) expect(f.t).toBe(0.37 + f.k / 15);
    expect(fr.filter((f) => f.k < 0).every((f) => f.mode === "fluoro" && f.bolusT === null)).toBe(true);
  });

  it("is deterministic: the same spec gives identical scenes and noise seeds", () => {
    const spec: CaptureSpec = { set: "t", name: "det", view: "rcalao", nFrames: 4, warmup: 0 };
    const a = simulateSequence(spec);
    const b = simulateSequence(spec);
    for (let i = 0; i < a.length; i++) {
      expect(a[i].params.seed).toBe(b[i].params.seed);
      expect(JSON.stringify(a[i].scene.cam)).toBe(JSON.stringify(b[i].scene.cam));
      expect(JSON.stringify(a[i].scene.tubes.slice(0, 40))).toBe(JSON.stringify(b[i].scene.tubes.slice(0, 40)));
    }
    expect(new Set(a.map((f) => f.params.seed)).size).toBe(a.length);
  });

  it("makes run bookkeeping explicit: framesSinceStart per frame, warm-up as its own fluoroscopy run", () => {
    const fr = simulateSequence({ set: "t", name: "rk", view: "raocaudal", nFrames: 5, warmup: 3, injection: null });
    expect(fr.map((f) => f.params.framesSinceStart)).toEqual([0, 1, 2, 0, 1, 2, 3, 4]);
    expect(fr.map((f) => f.params.mode)).toEqual(["fluoro", "fluoro", "fluoro", "cine", "cine", "cine", "cine", "cine"]);
    const R = resolveSpec({ set: "t", name: "pf", view: "raocaudal", profile: "B" });
    expect(R.profile).toBe("B");
    expect(runParams(fr[3].params, R, 0, "cine").profile).toBe("B");
    expect(resolveSpec({ set: "t", name: "pf", view: "raocaudal" }).profile).toBeNull();
  });

  it("predicts the scorecard's field box: the lab's square field fills the canvas", () => {
    const fr = simulateSequence({ set: "t", name: "fb", view: "raocaudal", nFrames: 1, warmup: 0, injection: null });
    expect(fieldBoxPx(fr[0].params, 768)).toEqual([0, 0, 768, 768]);
    expect(px512PerNative(768)).toBeCloseTo(511 / (768 - 1.01), 12);
    const c = fieldBoxPx({ field: "circle" }, 768);
    // the 0.985 disc: columns whose central-half coverage reaches 20% start a few px in
    expect(c[0]).toBeGreaterThan(0);
    expect(c[0]).toBeLessThan(40);
    expect(c[2]).toBe(768 - c[0]);
    expect(fieldBoxPx({ field: "square", shutters: [0.1, 0, 0, 0.05] }, 768)).toEqual([77, 0, 768, 730]);
  });

  it("captures the reference views plus a fluoroscopy companion", () => {
    const specs = standardSpecs("x");
    expect(specs.map((s) => s.name)).toContain("lad_raocra");
    const fl = specs.find((s) => s.mode === "fluoro");
    expect(fl?.injection).toBeNull();
    expect(standardSpecs("x", { fluoro: false }).some((s) => s.mode === "fluoro")).toBe(false);
  });

  it("films the lab's cine run by default (press with the first frame, a standard push, 51 frames at 15 frames/s)", () => {
    const R = resolveSpec({ set: "t", name: "d", view: "apcranial" });
    expect(R.nFrames).toBe(51);
    expect(R.fps).toBe(15);
    expect(R.injection?.at).toBe(0);
    expect(R.injection?.duration).toBe(2.2);
    expect(R.artery).toBe("LCA");
  });

  it("adds a cine companion without contrast for the unfilled-catheter rows", () => {
    const fl = standardSpecs("x").find((s) => s.name === "lad_raocau_flush");
    expect(fl?.mode).toBe("cine");
    expect(fl?.injection).toBeNull();
    expect(standardSpecs("x", { flush: false }).some((s) => s.name === "lad_raocau_flush")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// gap gates
// ---------------------------------------------------------------------------
interface GateRow {
  gate: string;
  owner: string;
  value: number;
  band: [number, number] | null;
  pass: boolean;
}
const report: GateRow[] = [];

function gate(name: string, owner: string, value: () => number, target: RealismTarget | undefined) {
  const row: GateRow = { gate: name, owner, value: NaN, band: target ? target.band : null, pass: false };
  it(`${name}: measured (owner ${owner})`, () => {
    row.value = value();
    row.pass = inBand(row.value, target);
    report.push(row);
    expect(Number.isFinite(row.value)).toBe(true);
    expect(target, `target for ${name}`).toBeTruthy();
  });
  it.runIf(STRICT)(`${name}: inside the real band`, () => {
    expect(row.value).toBeGreaterThanOrEqual(target!.band[0]);
    expect(row.value).toBeLessThanOrEqual(target!.band[1]);
  });
}

// three beats at the scene builder's default rate, 15 frames/s, no contrast needed for geometry
const BEATS3: Partial<CaptureSpec> = { fps: 15, nFrames: 38, injection: null, warmup: 0 };
const lossless = { pipeline: "lossless" };

describe.skipIf(!HAVE_TARGETS)("gap gates: cardiac motion (512-px analysis frame, px per 15 frames/s step)", () => {
  // the audit's tracked LAD lines are proximal-mid LAD in RAO caudal and AP cranial; RCA lines mid RCA in LAO
  const lad = () => motionStats(vesselTrack({ set: "g", name: "lad", view: "raocaudal", ...BEATS3 }, "LAD", 0.3));
  const rca = () => motionStats(vesselTrack({ set: "g", name: "rca", view: "rcalao", ...BEATS3 }, "RCA", 0.5));
  gate("LAD mid cross-vessel range", "S3a", () => lad().crossRange, findTarget(doc, "xtrack.motion-LAD.range_px", lossless));
  gate("LAD mid largest step", "S3a", () => lad().crossStepMax, findTarget(doc, "xtrack.motion-LAD.step_max", lossless));
  gate("RCA mid cross-vessel range", "S3a", () => rca().crossRange, findTarget(doc, "xtrack.motion-RCA.range_px", lossless));
  gate("RCA mid largest step", "S3a", () => rca().crossStepMax, findTarget(doc, "xtrack.motion-RCA.step_max", lossless));
  gate("catheter tip cross range (shaft target)", "S7", () => motionStats(catheterTipTrack({ set: "g", name: "cath", view: "rcalao", ...BEATS3 })).crossRange, findTarget(doc, "xtrack.motion-cath.range_px", lossless));
});

describe.skipIf(!HAVE_TARGETS)("gap gates: contrast time course (summed iodine, the lab's cine run)", () => {
  // the lab injects with the first cine frame; the real arrival band therefore tests run timing too
  const S = () => iodineSeries({ set: "g", name: "iod", view: "raocaudal", warmup: 0 });
  const feat = () => timingFeatures(S())!;
  gate("first appearance (10%) frame", "S5/S10", () => feat().f10 ?? NaN, findTarget(doc, "timing.f10", lossless));
  gate("rise 10-90% (frames)", "S5", () => feat().riseFrames ?? NaN, findTarget(doc, "timing.rise_frames", lossless));
  gate("end-of-run level (fraction of peak)", "S5", () => feat().endRel, findTarget(doc, "timing.end_rel", lossless));
  // run_analysis.py arrival definition (30% of the rise over the frame 0-1 baseline) on the iodine series
  const arr = () => arrivalFeatures(S(), 15)!;
  gate("contrast arrival, 30% of rise (s)", "S5/S10", () => arr().arrival30_s, findTarget(doc, "arrival.arrival30_s", { ...lossless, artery: "LCA" }));
  gate("contrast present in the first frame (0/1)", "S5/S10", () => arr().arrival_at_frame0, findTarget(doc, "arrival.at_frame0", { ...lossless, artery: "LCA" }));
});

describe.skipIf(!HAVE_TARGETS)("gap gates: cardiac motion in mm (landmarks 10-90% along the vessel, 6F-scale targets)", () => {
  const geo = { profile: "cd-ds+cd-main", pipeline: "matched" };
  const lad = () => landmarkMotionMm({ set: "g", name: "ladmm", view: "raocranial", ...BEATS3 }, "LCA");
  const rca = () => landmarkMotionMm({ set: "g", name: "rcamm", view: "rcalao", ...BEATS3 }, "RCA");
  gate("LAD landmark displacement P10-P90 (mm)", "S3a", () => lad().p10p90, findTarget(doc, "motion_mm.p10p90", { ...geo, artery: "LCA" }));
  gate("LAD landmark speed, median (mm/s)", "S3a", () => lad().speedMedian, findTarget(doc, "motion_mm.speed_median", { ...geo, artery: "LCA" }));
  gate("RCA landmark displacement P10-P90 (mm)", "S3a", () => rca().p10p90, findTarget(doc, "motion_mm.p10p90", { ...geo, artery: "RCA" }));
  gate("RCA landmark speed, median (mm/s)", "S3a", () => rca().speedMedian, findTarget(doc, "motion_mm.speed_median", { ...geo, artery: "RCA" }));
});

// ---------------------------------------------------------------------------
// anatomy gates from the plan's measurement targets (not library bands)
// ---------------------------------------------------------------------------
describe("anatomy gates (plan measurementTargets; owner S3b)", () => {
  const p = prepareScenario("lad-focal");
  const f0 = simulateSequence({ set: "g", name: "anat", view: "raocranial", nFrames: 1, warmup: 0, injection: null })[0];
  const vessel = (n: string) => p.tree.vessels.find((v) => v.name === n);

  it("records the LAD and LCx climb over their first 20 mm (plan: at most the bifurcation + 3 mm)", () => {
    const lm = vessel("LM")!;
    const bif = f0.place(lm.samples[lm.samples.length - 1]).y;
    const climb: Record<string, number> = {};
    for (const n of ["LAD", "LCx"]) {
      const v = vessel(n)!;
      const p0 = v.pathMm[0];
      const ys = v.samples.filter((_, i) => v.pathMm[i] - p0 <= 20).map((sm) => f0.place(sm).y);
      climb[n] = Math.max(...ys) - bif;
    }
    console.info(`proximal climb above the LM bifurcation (mm, world y head-wards): LAD ${climb.LAD.toFixed(1)}, LCx ${climb.LCx.toFixed(1)} (plan target <= 3)`);
    expect(Number.isFinite(climb.LAD) && Number.isFinite(climb.LCx)).toBe(true);
    if (STRICT) {
      expect(climb.LAD).toBeLessThanOrEqual(3);
      expect(climb.LCx).toBeLessThanOrEqual(3);
    }
  });

  it("records the LM bifurcation Finet ratio (Finet 2008: Dm = 0.678 (Dd1 + Dd2), mean of 173 bifurcations)", () => {
    const lm = vessel("LM")!,
      lad = vessel("LAD")!,
      lcx = vessel("LCx")!;
    const ref = (v: typeof lm, i: number) => (v.refRadii ?? v.radii)[i];
    const finet = ref(lm, lm.samples.length - 1) / (ref(lad, 0) + ref(lcx, 0));
    const murray = (ref(lad, 0) ** 3 + ref(lcx, 0) ** 3) / ref(lm, lm.samples.length - 1) ** 3;
    console.info(`LM bifurcation: Finet ratio ${finet.toFixed(3)} (literature mean 0.678; no spread in the abstract, so not asserted), Murray cube ratio ${murray.toFixed(2)}`);
    expect(finet).toBeGreaterThan(0.3);
    expect(finet).toBeLessThan(1.2);
  });

  it("checks the capture's mm per px against the library's 6F scale (0.3077 mm per 512-px analysis px)", () => {
    const { isoMmPerPx } = pixelScale(f0.scene.cam, 768);
    const per512 = isoMmPerPx / px512PerNative(768);
    console.info(`capture: ${isoMmPerPx.toFixed(4)} mm per canvas px at the iso-centre = ${per512.toFixed(4)} mm per 512-px analysis px (library 6F scale 0.3077)`);
    // the 20 cm field at 768 px is meant to match the library frame scale within 15%
    expect(Math.abs(per512 / (2.0 / 6.5) - 1)).toBeLessThan(0.15);
  });
});

// ---------------------------------------------------------------------------
// blinded real-or-simulated drill
// ---------------------------------------------------------------------------
describe("real-or-simulated drill statistics", () => {
  it("computes the Wilson 95% interval", () => {
    const [lo, hi] = wilson(26, 40);
    expect(lo).toBeCloseTo(0.4951, 3);
    expect(hi).toBeCloseTo(0.7787, 3);
    expect(wilson(0, 0)).toEqual([0, 1]);
  });
});

describe.skipIf(!simIndex || !domDs || !domMain)("real-or-simulated drill clips (datasets/library/sim-clips)", () => {
  const clips = ((simIndex ?? { clips: [] }) as unknown as { clips: { id: string; realRun: string | null; angles: { primary: number; secondary: number }; fps: number; frames: string[] }[] }).clips;
  const real = new Map<string, { angles?: { primary: number; secondary: number }; fps: number; frames: string[] }>();
  for (const d of [domDs ?? { patients: [] }, domMain ?? { patients: [] }] as unknown as { patients: { runs: { id: string; angles?: { primary: number; secondary: number }; fps: number; frames: string[] }[] }[] }[])
    for (const p of d.patients) for (const r of p.runs) real.set(r.id, r);

  it("pairs every simulated clip with a real run at the same angles (within 1 degree), rate and length", () => {
    expect(clips.length).toBeGreaterThanOrEqual(20);
    for (const c of clips) {
      const r = real.get(c.realRun ?? "");
      expect(r, c.id).toBeTruthy();
      expect(Math.abs(r!.angles!.primary - c.angles.primary)).toBeLessThanOrEqual(1);
      expect(Math.abs(r!.angles!.secondary - c.angles.secondary)).toBeLessThanOrEqual(1);
      expect(c.fps).toBe(r!.fps);
      expect(c.frames.length).toBe(Math.min(90, r!.frames.length));
    }
  });

  it("covers left and right coronary views", () => {
    const families = new Set(clips.map((c) => `${c.realRun?.includes("RCA") ? "RCA" : "LCA"}:${Math.sign(Math.round(c.angles.primary / 15))}:${Math.sign(Math.round(c.angles.secondary / 15))}`));
    expect([...families].some((f) => f.startsWith("RCA"))).toBe(true);
    expect([...families].filter((f) => f.startsWith("LCA")).length).toBeGreaterThanOrEqual(4);
  });

  it("computes accuracy and per-view accuracy from a 40-trial log", () => {
    const views = ["LCA RAO caudal", "LCA AP cranial", "RCA LAO", "LCA LAO cranial"];
    const log = Array.from({ length: 40 }, (_, i) => ({
      t: "", reader: "test", clip: `c${i % 10}`, realRun: `r${i % 10}`, artery: i % 4 === 2 ? "RCA" : "LCA", view: views[i % 4],
      realSide: (i % 2 ? "left" : "right") as "left" | "right", choice: (i % 3 ? "left" : "right") as "left" | "right", correct: false, rtMs: 1000 + i,
    })).map((t) => ({ ...t, correct: t.choice === t.realSide }));
    const s = drillStats(log);
    expect(s.n).toBe(40);
    expect(s.correct).toBe(log.filter((t) => t.correct).length);
    expect(s.byView.map((v) => v.view)).toEqual([...views].sort());
    expect(s.byView.reduce((a, v) => a + v.n, 0)).toBe(40);
    expect(s.meanRtMs).toBeCloseTo(1019.5, 6);
  });
});

afterAll(() => {
  if (!report.length) return;
  const lines = report.map((r) => `  ${r.pass ? "pass" : "GAP "}  ${r.gate.padEnd(44)} ${r.value.toFixed(2).padStart(8)}  band ${r.band ? `${r.band[0]}-${r.band[1]}` : "none"}  (${r.owner})`);
  console.info(`realism gap gates${STRICT ? " (strict)" : " (report only; REALISM_STRICT=1 asserts the bands)"}:\n${lines.join("\n")}`);
});
