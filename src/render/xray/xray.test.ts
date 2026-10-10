import { describe, it, expect } from "vitest";
import { buildAnatomy } from "../../simulation/anatomy";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import { buildCoronaryTree, samplePos, vesselLength } from "./coronaryTree";
import { buildThorax, MAX_ANAT, MAX_CARVE_SHAPES } from "./thorax";
import { buildXrayScene, contraction, treeCentre, LabImaging, COUNTS_CALIBRATION_FIELD_MM, CATHETER_OD_MM, CATHETER_WALL, type SceneInput } from "./sceneBuilder";
import { XrayRenderer, type MeterReading } from "./XrayRenderer";
import { CardiacClock } from "../../simulation/clock/cardiacClock";
import { CLUTTER_KEY, THORAX_SEGMENTS_KEY, type ClutterState } from "./clutter";
import { SEGMENTS_KEY, type SegmentBatch } from "./segments";
import type { TubeSpec } from "./thorax";
import { MU } from "./thorax";
import { contrastField, transportNet, thetaOnPath, stepResponse, DEFAULT_SEAT, THETA_MAX_S, type ContrastField } from "./contrastTransport";
import { CINE_RUN_S, LUMENS, OPERATOR_DELAY_S, planTrace, standardPlan, type InjectionTrace } from "../../simulation/injection";
import { phasicFlow } from "../../simulation/patient/coronaryFlow";

const c = CASE_LIBRARY[0];
const model = buildAnatomy(c);
const tree = buildCoronaryTree(model, c);
const dist = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
/** the main catheter's shaft: the first tube with the braided wall's attenuation (jacket filler, steel braid) */
const isWall = (t: TubeSpec) => !Array.isArray(t.mu[0]) && (t.mu as number[])[0] === 0 && (t.mu as number[])[1] === CATHETER_WALL.jacket && (t.mu as number[])[2] === CATHETER_WALL.braid;
const outerCath = (tubes: TubeSpec[]) => tubes.find(isWall)!;

describe("coronary tree", () => {
  it("has adult dimensions", () => {
    expect(vesselLength(tree, "LM")).toBeGreaterThan(5);
    expect(vesselLength(tree, "LM")).toBeLessThan(18);
    expect(vesselLength(tree, "LAD")).toBeGreaterThan(110);
    expect(vesselLength(tree, "LAD")).toBeLessThan(200);
    expect(vesselLength(tree, "RCA")).toBeGreaterThan(100);
    expect(vesselLength(tree, "RCA")).toBeLessThan(170);
    const lm = tree.vessels.find((v) => v.name === "LM")!;
    expect(lm.radii[0] * 2).toBeGreaterThan(3.5);
    const lad = tree.vessels.find((v) => v.name === "LAD")!;
    expect(lad.radii[lad.radii.length - 1]).toBeLessThan(lad.radii[0] / 2);
  });

  it("starts at the anatomy model's ostia, so engagement and the image agree", () => {
    const lm = tree.vessels.find((v) => v.name === "LM")!;
    const rca = tree.vessels.find((v) => v.name === "RCA")!;
    expect(dist(samplePos(tree.heart, lm.samples[0]), model.lm.pos)).toBeLessThan(0.01);
    expect(dist(samplePos(tree.heart, rca.samples[0]), model.rca.pos)).toBeLessThan(0.01);
  });

  it("is continuous (no jumps between samples)", () => {
    for (const v of tree.vessels) {
      for (let i = 1; i < v.samples.length; i++) {
        expect(dist(samplePos(tree.heart, v.samples[i]), samplePos(tree.heart, v.samples[i - 1]))).toBeLessThan(5);
      }
    }
  });

  it("a chronic occlusion gets collaterals from the other coronary; an acute one does not", () => {
    const cto = { ...c, id: "cto-collat", lesions: [{ vessel: "RCA" as const, position: 0.45, severity: 100, kind: "cto" as const }] };
    const t = buildCoronaryTree(buildAnatomy(cto), cto);
    const ch = t.vessels.filter((v) => v.name.startsWith("collateral"));
    expect(ch.length).toBeGreaterThan(0);
    expect(ch.every((v) => v.side === "left")).toBe(true);
    const rca = t.vessels.find((v) => v.name === "RCA")!;
    expect(rca.retro?.side).toBe("left");
    expect(rca.retro!.from).toBeGreaterThan(rca.occludedFrom);
    const acute = { ...c, id: "acute", lesions: [{ vessel: "RCA" as const, position: 0.45, severity: 100, kind: "thrombotic" as const }] };
    const ta = buildCoronaryTree(buildAnatomy(acute), acute);
    expect(ta.vessels.some((v) => v.name.startsWith("collateral"))).toBe(false);
  });

  it("a CTO stops contrast beyond the occlusion", () => {
    const cto = { ...c, id: "cto-test", lesions: [{ vessel: "LAD" as const, position: 0.4, severity: 100, kind: "cto" as const }] };
    const t = buildCoronaryTree(buildAnatomy(cto), cto);
    const lad = t.vessels.find((v) => v.name === "LAD")!;
    expect(lad.occludedFrom).toBeGreaterThan(0);
  });
});

describe("contrast", () => {
  const left = [...new Set(tree.vessels.filter((v) => v.side === "left").map((v) => v.fillId))];
  const sceneAt = (t: number) =>
    buildXrayScene({
      model,
      caseData: c,
      tree,
      catheterRoot: [model.lm.pos],
      french: 6,
      bolus: { filled: left, plume: "none", side: "left", t, injectDur: 1.8, peak: 1 },
      t: 0,
      cArm: { laoRao: 0, cranialCaudal: 0 },
      mode: "cine",
      frame: 1,
    }).scene;
  const lmIodine = (t: number) => {
    const lm = tree.vessels.find((v) => v.name === "LM")!;
    const tube = sceneAt(t).tubes.find((x) => Array.isArray(x.mu[0]) && x.pts.length === lm.samples.length);
    return (tube!.mu as [number, number, number][]).map((m) => m[1]);
  };
  it("opacifies the left main fully while the syringe is pushed", () => {
    const mu = lmIodine(1.0);
    expect(Math.min(...mu)).toBeGreaterThan(0.8 * Math.max(...mu));
  });
  it("washes the left main out after the injection", () => {
    expect(Math.max(...lmIodine(4.5))).toBeLessThan(0.05 * Math.max(...lmIodine(1.0)));
  });
});

describe("scene", () => {
  it("thorax has every anatomy shape and the carve list is valid", () => {
    const th = buildThorax({ resp: 0.3, heart: tree.heart });
    expect(th.anat.length).toBeLessThanOrEqual(MAX_ANAT);
    expect(th.anat[0].name).toBe("body");
    expect(th.anat.filter((a) => a.lung).length).toBe(2);
    // the anatomy shader carves with at most MAX_CARVE_SHAPES shapes (its carve array size)
    expect(th.anat.filter((a) => a.carve).length).toBeLessThanOrEqual(MAX_CARVE_SHAPES);
    expect(th.anat.filter((a) => a.carve).length).toBeGreaterThan(10);
    for (const a of th.anat) expect(Number.isFinite(a.mu)).toBe(true);
    expect(th.bones.length).toBeGreaterThan(50);
  });

  it("deep inspiration lowers the diaphragm", () => {
    const ex = buildThorax({ resp: 0, heart: tree.heart });
    const ins = buildThorax({ resp: 1, heart: tree.heart });
    const bottom = (s: { c: { y: number }; half: number[] }) => s.c.y - s.half[1];
    expect(bottom(ins.anat[1])).toBeLessThan(bottom(ex.anat[1]) - 20);
  });

  it("contraction envelope peaks in systole and is zero in late diastole", () => {
    expect(contraction(0.3)).toBeGreaterThan(0.9);
    expect(contraction(0.8)).toBe(0);
  });

  it("the catheter tip and the left main ostium project to the same place", () => {
    const tip = model.lm.pos;
    const root = [{ x: 0, y: 54, z: 0 }, { x: 8, y: 30, z: -4 }, tip];
    const { scene } = buildXrayScene({
      model,
      caseData: c,
      tree,
      catheterRoot: root,
      french: 5,
      bolus: { filled: ["LM", "LAD"], plume: "none", side: "left", t: 1, injectDur: 2.5, peak: 1 },
      t: 0,
      cArm: { laoRao: -22, cranialCaudal: -22 },
      mode: "cine",
      breathHold: 0.7,
      frame: 1,
    });
    const cath = outerCath(scene.tubes);
    const lm = scene.tubes.find((t) => Array.isArray(t.mu[0]))!;
    const a = XrayRenderer.project(scene.cam, cath.pts[cath.pts.length - 1]);
    const b = XrayRenderer.project(scene.cam, lm.pts[0]);
    expect(Math.hypot(a.u - b.u, a.v - b.v)).toBeLessThan(0.01);
    // the whole main tree is inside the field when centred on it
    const ctr = XrayRenderer.project(scene.cam, treeCentre(tree));
    expect(Math.abs(ctr.u)).toBeLessThan(0.05);
  });
});

// ---------------------------------------------------------------------------
// Wave-2 integration (I1): clock-driven motion, root and catheter coupling,
// thorax and clutter inputs, segments, dose-rate control and lab bookkeeping
// ---------------------------------------------------------------------------

const leftFill = [...new Set(tree.vessels.filter((v) => v.side === "left").map((v) => v.fillId))];
const lmRoot = [{ x: 0, y: 54, z: 0 }, { x: 8, y: 30, z: -4 }, model.lm.pos];
const base = (over: Partial<SceneInput> = {}): SceneInput => ({
  model,
  caseData: c,
  tree,
  catheterRoot: lmRoot,
  french: 6,
  bolus: { filled: leftFill, plume: "none", side: "left", t: 1, injectDur: 1.8, peak: 1 },
  t: 0,
  cArm: { laoRao: -22, cranialCaudal: -22 },
  mode: "cine",
  breathHold: 0.7,
  frame: 1,
  field: 200,
  ...over,
});
const last = <T,>(a: T[]): T => a[a.length - 1];

const lmTube = (tubes: TubeSpec[]) => {
  const lm = tree.vessels.find((v) => v.name === "LM")!;
  return tubes.find((x) => Array.isArray(x.mu[0]) && x.pts.length === (lm.fine?.samples.length ?? lm.samples.length))!;
};
/** a clock state at end-systole (largest base descent) */
const systole = () => {
  const k = new CardiacClock({ hr: 72 });
  k.advance(5 * (60 / 72) + 0.33); // a few beats in, then 330 ms after the R wave
  return k.state();
};

describe("scene integration (I1)", () => {
  it("takes the heart phase from the clock: the beat is the same at equal clock states, whatever t says", () => {
    const k = systole();
    const a = buildXrayScene(base({ clock: k, t: 0 }));
    const b = buildXrayScene(base({ clock: k, t: 123.4 }));
    expect(a.contraction).toBeGreaterThan(0.5);
    expect(b.contraction).toBeCloseTo(a.contraction, 10);
    expect(lmTube(b.scene.tubes).pts[5]).toEqual(lmTube(a.scene.tubes).pts[5]);
  });

  it("keeps the legacy catheter tip on the left main ostium in systole (root and ostium move together)", () => {
    const k = systole();
    const r = buildXrayScene(base({ clock: k }));
    const tip = last(outerCath(r.scene.tubes).pts);
    const ost = lmTube(r.scene.tubes).pts[0];
    const a = XrayRenderer.project(r.scene.cam, tip);
    const b = XrayRenderer.project(r.scene.cam, ost);
    expect(Math.hypot(a.u - b.u, a.v - b.v)).toBeLessThan(0.01);
    // the ostium really moved (root motion), and without the tether the tip would be left behind
    const rest = buildXrayScene(base({ clock: { ...k, tInBeat: 0, phase: 0, systole: true } }));
    const b0 = XrayRenderer.project(rest.scene.cam, lmTube(rest.scene.tubes).pts[0]);
    expect(Math.hypot(b.u - b0.u, b.v - b0.v)).toBeGreaterThan(0.01);
    const loose = buildXrayScene(base({ clock: k, legacyCatheter: false }));
    const c2 = XrayRenderer.project(loose.scene.cam, last(outerCath(loose.scene.tubes).pts));
    expect(Math.hypot(c2.u - b.u, c2.v - b.v)).toBeGreaterThan(0.01);
  });

  it("never tethers a rod-solver centre line (catheterNodes are drawn as given)", () => {
    const k = systole();
    const nodes = [{ x: 0, y: 120, z: 0 }, { x: 0, y: 54, z: 0 }, { x: 8, y: 30, z: -4 }, model.lm.pos];
    const r = buildXrayScene(base({ clock: k, catheterNodes: nodes }));
    const tip = last(outerCath(r.scene.tubes).pts);
    const rest = buildXrayScene(base({ clock: { ...k, tInBeat: 0, phase: 0 }, catheterNodes: nodes }));
    expect(tip).toEqual(last(outerCath(rest.scene.tubes).pts));
  });

  it("breathing follows the clock unless a breath-hold is given", () => {
    const k = new CardiacClock({ hr: 70 });
    k.advance(2.1);
    const st = k.state();
    expect(buildXrayScene(base({ clock: st, breathHold: null })).resp).toBeCloseTo(st.resp, 10);
    expect(buildXrayScene(base({ clock: st, breathHold: 0.7 })).resp).toBe(0.7);
  });

  it("feeds the thorax segment pass and the lung clutter uniforms, per patient", () => {
    const r = buildXrayScene(base());
    const ex = r.scene.extra!;
    expect(ex[THORAX_SEGMENTS_KEY]).toBeTruthy();
    const cl = ex[CLUTTER_KEY] as ClutterState;
    expect(cl.lungs.length).toBe(2);
    // the patient seed defaults to the coronary genome's seed (the case id): another seed changes the thorax
    const other = buildXrayScene(base({ patientSeed: "someone-else" }));
    expect(other.scene.anat[0].half).not.toEqual(r.scene.anat[0].half);
    expect((other.scene.extra![CLUTTER_KEY] as ClutterState).seed).not.toBe(cl.seed);
    // ribbon thorax on request
    const rib = buildXrayScene(base({ thoraxSegments: false }));
    expect(rib.scene.extra![THORAX_SEGMENTS_KEY]).toBeUndefined();
    expect(rib.scene.tubes.length).toBeGreaterThan(r.scene.tubes.length);
  });

  it("merges the beating heart silhouette into the thorax (the ventricle shape changes in systole)", () => {
    const k = systole();
    const sys = buildXrayScene(base({ clock: k }));
    const dia = buildXrayScene(base({ clock: { ...k, tInBeat: 0.75, phase: 0.9 } }));
    const lv = (s: typeof sys) => s.scene.anat.find((a) => a.name === "ventricles")!;
    expect(lv(sys).half).not.toEqual(lv(dia).half);
    expect(sys.scene.anat.length).toBe(dia.scene.anat.length);
  });

  it("moves vessels, catheters, wires and devices to the segment integrator when asked, keeping them for CPU readers", () => {
    const on = buildXrayScene(base({ segments: true }));
    const off = buildXrayScene(base({ segments: false }));
    const batch = on.scene.extra![SEGMENTS_KEY] as SegmentBatch;
    expect(batch.count).toBeGreaterThan(100);
    expect(batch.unresolvedOverlaps ?? 0).toBeLessThanOrEqual(3);
    const moved = on.scene.extra!.segmentTubes as TubeSpec[];
    expect(on.scene.tubes.length + moved.length).toBe(off.scene.tubes.length);
    expect(outerCath(on.scene.tubes)).toBeUndefined();
    expect(outerCath(moved)).toBeTruthy();
    expect(lmTube(moved)).toBeTruthy();
    expect(batch.gains).toEqual([1, on.params.iodineGain, on.params.metalGain]);
  });

  it("replaces the kV formula with the dose-rate controller, keeping the noise calibration at the 200 mm field", () => {
    const ap = buildXrayScene(base({ cArm: { laoRao: 0, cranialCaudal: 0 }, field: COUNTS_CALIBRATION_FIELD_MM }));
    expect(ap.exposure.technique.kvp).toBeGreaterThan(59);
    expect(ap.params.counts).toBeGreaterThan(1300);
    expect(ap.params.counts).toBeLessThan(1700);
    expect(ap.params.gridIn).toBe(true);
    expect(ap.params.pulseWidthMs).toBeGreaterThan(2.9);
    // a steep projection is thicker: higher kVp, lower iodine contrast
    const steep = buildXrayScene(base({ cArm: { laoRao: 50, cranialCaudal: 30 }, field: 200 }));
    expect(steep.exposure.equivCm).toBeGreaterThan(ap.exposure.equivCm);
    expect(steep.exposure.technique.kvp).toBeGreaterThanOrEqual(ap.exposure.technique.kvp);
    expect(steep.params.iodineGain).toBeLessThanOrEqual(ap.params.iodineGain);
    // magnification: fewer quanta per rendered pixel
    const mag = buildXrayScene(base({ cArm: { laoRao: 0, cranialCaudal: 0 }, field: 150 }));
    expect(mag.params.counts).toBeLessThan(ap.params.counts);
    // fluoroscopy gets fewer quanta than cine
    const fl = buildXrayScene(base({ cArm: { laoRao: 0, cranialCaudal: 0 }, mode: "fluoro", bolus: null }));
    expect(fl.params.counts).toBeLessThan(ap.params.counts / 2);
    expect(fl.params.mode).toBe("fluoro");
    expect(ap.params.mode).toBe("cine");
  });

  it("passes run bookkeeping and the profile to the image chain", () => {
    const r = buildXrayScene(base({ framesSinceStart: 7, profile: "B" }));
    expect(r.params.framesSinceStart).toBe(7);
    expect(r.params.profile).toBe("B");
    expect(buildXrayScene(base()).params.framesSinceStart).toBeUndefined();
  });
});

describe("LabImaging (I1)", () => {
  const fakeRenderer = (m: Partial<MeterReading> | null) => ({ lastMeter: m }) as unknown as XrayRenderer;

  it("counts frames within a run and restarts on a mode change or beam-off", () => {
    const lab = new LabImaging({ hr: 70, seed: "x" });
    expect(lab.frame("fluoro", null).framesSinceStart).toBe(0);
    expect(lab.frame("fluoro", null).framesSinceStart).toBe(1);
    expect(lab.frame("cine", null).framesSinceStart).toBe(0);
    expect(lab.frame("cine", null).breathHold).toBe(0.7);
    lab.beamOff(1000);
    expect(lab.frame("cine", null).framesSinceStart).toBe(0);
  });

  it("advances one patient clock by wall time, capped for hidden-tab gaps", () => {
    const lab = new LabImaging({ hr: 60 });
    lab.tick(0);
    lab.tick(500);
    expect(lab.clock.state().t).toBeCloseTo(0.5, 6);
    lab.tick(500 + 60_000);
    expect(lab.clock.state().t).toBeCloseTo(2.5, 6);
  });

  it("hands each new meter reading to the controller once, as a water-equivalent path", () => {
    const lab = new LabImaging();
    const m1 = { primaryTransmission: Math.exp(-4) } as MeterReading;
    lab.frame("fluoro", fakeRenderer(m1)); // run start: a reading from before the run is ignored
    const f = lab.frame("fluoro", fakeRenderer(m1));
    expect(f.meter).toBeNull(); // same object as before: not new
    const m2 = { primaryTransmission: Math.exp(-4) } as MeterReading;
    const g = lab.frame("fluoro", fakeRenderer(m2));
    expect(g.meter && "waterCm" in g.meter ? g.meter.waterCm : NaN).toBeCloseTo(20, 6);
  });

  it("books dose for exposed frames with the controller's state", () => {
    const lab = new LabImaging();
    let t = 0;
    for (let i = 0; i < 30; i++) {
      const f = lab.frame("cine", null);
      const r = buildXrayScene(base({ clock: f.clock, adrc: f.adrc, exposure: f.exposure, framesSinceStart: f.framesSinceStart }));
      lab.expose(r, { laoRao: -22, cranialCaudal: -22 }, 200, (t += 1000 / 15));
    }
    expect(lab.dose.totals.karMGy.total).toBeGreaterThan(0);
    expect(lab.dose.totals.cineFrames ?? 30).toBeGreaterThan(0);
    expect(lab.lastExposure?.settings.mode).toBe("cine");
  });
});

// ---------------------------------------------------------------------------
// Step 2 (I1): hand injection -> ostial mixing -> 1D transport (contrastTransport.ts)
// ---------------------------------------------------------------------------

describe("contrast transport", () => {
  const healthy = buildCoronaryTree(model, { ...c, lesions: [] });
  const net = transportNet(healthy, []);
  const std = (side: "left" | "right" = "left") => planTrace(standardPlan(side, LUMENS["guide-6"]));
  const fieldAt = (t: number, o: { trace?: InjectionTrace; side?: "left" | "right"; seat?: { capture: number; seal: number }; flowScale?: number; n?: typeof net } = {}): ContrastField =>
    contrastField({ net: o.n ?? net, side: o.side ?? "left", trace: o.trace ?? std(o.side ?? "left"), t, phase: (t * 72) / 60 % 1, rr: 60 / 72, seat: o.seat, flowScale: o.flowScale });
  const theta = (name: string, frac: number, n = net) => {
    const th = n.vessels.get(name)!.theta;
    return th[Math.round(frac * (th.length - 1))];
  };
  /** first time (s) the strength at theta reaches `level`, sampled at 120 Hz */
  const arrival = (th: number, level: number, o: Parameters<typeof fieldAt>[1] = {}) => {
    for (let t = 0; t < 8; t += 1 / 120) if (fieldAt(t, o).at(th) >= level) return t;
    return Infinity;
  };

  it("the cine opens on pre-contrast frames: nothing in the artery before the push", () => {
    for (const t of [0, 0.1, OPERATOR_DELAY_S - 0.02]) {
      const f = fieldAt(t);
      expect(f.at(0)).toBe(0);
      expect(f.injecting).toBe(false);
    }
    expect(fieldAt(OPERATOR_DELAY_S + 0.4).at(0)).toBeGreaterThan(0.8);
  });

  it("transit times grow along each vessel and continue from the parent at each branch point", () => {
    for (const v of healthy.vessels) {
      const th = net.vessels.get(v.name)!.theta;
      for (let i = 1; i < th.length; i++) expect(th[i]).toBeGreaterThanOrEqual(th[i - 1]);
      if (v.parent && v.kind !== "collateral") {
        const p = net.vessels.get(v.parent.name)!.theta;
        expect(th[0]).toBeCloseTo(p[Math.min(p.length - 1, v.parent.index)], 5);
      }
    }
  });

  it("branches split the flow: the front reaches the proximal tree before the distal tree", () => {
    const lm = arrival(theta("LM", 0.5), 0.5);
    const ladMid = arrival(theta("LAD", 0.5), 0.5);
    const ladEnd = arrival(theta("LAD", 0.9), 0.5);
    expect(lm).toBeLessThan(ladMid);
    expect(ladMid).toBeLessThan(ladEnd);
  });

  it("reproduces the normal TIMI frame counts (Gibson 1996) within two standard deviations", () => {
    // half-rise at the vessel origin to half-rise at the distal landmark, at 30 frames/s
    const tfc = (name: string, side: "left" | "right", frac: number) => {
      const a = theta(name, 0.02), b = theta(name, frac);
      const sa: number[] = [], sb: number[] = [], ts: number[] = [];
      for (let t = 0; t < 5; t += 1 / 120) {
        const f = fieldAt(t, { side });
        sa.push(f.at(a)); sb.push(f.at(b)); ts.push(t);
      }
      const ma = Math.max(...sa), mb = Math.max(...sb);
      return (ts[sb.findIndex((x) => x >= 0.5 * mb)] - ts[sa.findIndex((x) => x >= 0.5 * ma)]) * 30;
    };
    const lad = tfc("LAD", "left", 0.9);
    const lcx = tfc("LCx", "left", 0.9);
    const rca = tfc("RCA", "right", 0.85);
    expect(Math.abs(lad - 36.2)).toBeLessThan(2 * 2.6);
    expect(Math.abs(lcx - 22.2)).toBeLessThan(2 * 4.1);
    expect(Math.abs(rca - 20.4)).toBeLessThan(2 * 3.0);
  });

  /** TIMI frame count analogue (30 frames/s) from the LAD origin to `frac` of its length, and the distal peak inside a standard run */
  const ladTfc = (n: typeof net, frac = 0.85) => {
    const th = n.vessels.get("LAD")!.theta;
    const a = th[Math.round(0.02 * (th.length - 1))], b = th[Math.round(frac * (th.length - 1))];
    const sa: number[] = [], sb: number[] = [], ts: number[] = [];
    for (let t = 0; t < 8; t += 1 / 120) {
      const f = fieldAt(t, { n });
      sa.push(f.at(a)); sb.push(f.at(b)); ts.push(t);
    }
    const ma = Math.max(...sa), mb = Math.max(...sb);
    const ib = sb.findIndex((x) => x >= 0.5 * mb);
    return { tfc: (ts[ib] - ts[sa.findIndex((x) => x >= 0.5 * ma)]) * 30, peakInRun: Math.max(...sb.slice(0, Math.round(CINE_RUN_S * 120))) };
  };
  const withLesion = (severity: number, kind: "severe-stenosis" | "thrombotic" | "cto" = "severe-stenosis", position = 0.38) => {
    // same case id: the same anatomy genome, only the lesion differs
    const cs = { ...c, lesions: [{ vessel: "LAD" as const, position, severity, kind, lengthMm: 12 }] };
    return transportNet(buildCoronaryTree(model, cs), cs.lesions);
  };

  it("slows contrast beyond a stenosis only when it is haemodynamically significant", () => {
    const base0 = theta("LAD", 0.9);
    const mild = withLesion(50, "severe-stenosis", 0.3);
    const severe = withLesion(95, "severe-stenosis", 0.3);
    expect(Math.abs(theta("LAD", 0.9, mild) - base0) / base0).toBeLessThan(0.1);
    expect(theta("LAD", 0.9, severe)).toBeGreaterThan(1.2 * base0);
    // the other branches are not slowed
    expect(Math.abs(theta("LCx", 0.9, severe) - theta("LCx", 0.9)) / theta("LCx", 0.9)).toBeLessThan(0.1);
  });

  it("a stable 80-90 % stenosis keeps TIMI 3 flow: the distal vessel fills inside a standard run, the frame count about a third longer (Li 2021)", () => {
    const none = ladTfc(net);
    const ratios: number[] = [];
    let prev = 1;
    for (const sev of [80, 85, 90]) {
      const r = ladTfc(withLesion(sev));
      const ratio = r.tfc / none.tfc;
      ratios.push(ratio);
      expect(r.peakInRun).toBeGreaterThan(0.85 * none.peakInRun); // fully opacified distal vessel within the run
      expect(ratio).toBeGreaterThan(1.03);
      expect(ratio).toBeLessThan(1.8); // never TIMI 1-like
      expect(ratio).toBeGreaterThanOrEqual(prev - 0.02); // tighter is never faster
      prev = ratio;
    }
    const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    // Li et al. 2021: corrected TIMI frame count 28.56 (flow-limiting) vs 21.64, a ratio of 1.32
    expect(mean).toBeGreaterThan(1.15);
    expect(mean).toBeLessThan(1.5);
  });

  it("an acute (thrombotic) 90 % lesion slows the distal filling far more than a chronic one: TIMI 1-2", () => {
    const chronic = ladTfc(withLesion(90));
    const acute = ladTfc(withLesion(90, "thrombotic"));
    expect(acute.tfc).toBeGreaterThan(1.5 * chronic.tfc);
    expect(acute.peakInRun).toBeLessThan(0.6 * chronic.peakInRun);
  });

  it("an inflated balloon stops antegrade contrast beyond it and leaves the rest of the tree alone", () => {
    const lad = healthy.vessels.find((v) => v.name === "LAD")!;
    const p = lad.param[Math.round(0.4 * (lad.param.length - 1))];
    const occ = transportNet(healthy, [], { occlusions: [{ vessel: "LAD", param: p, fraction: 1 }] });
    expect(theta("LAD", 0.9, occ)).toBe(THETA_MAX_S);
    // proximal to the balloon the LAD still fills (more slowly: only the branches above the balloon take flow)
    expect(theta("LAD", 0.1, occ)).toBeLessThan(1);
    expect(Math.abs(theta("LCx", 0.9, occ) - theta("LCx", 0.9)) / theta("LCx", 0.9)).toBeLessThan(0.1);
    for (const t of [1, 2, 3, 4]) expect(fieldAt(t, { n: occ }).at(theta("LAD", 0.9, occ))).toBe(0);
    expect(fieldAt(2, { n: occ }).at(theta("LAD", 0.1, occ))).toBeGreaterThan(0.8);
    expect(occ.impaired.left).toBeGreaterThan(0.05);
    expect(net.impaired.left).toBe(0);
  });

  it("regional no-reflow slows the vessel beyond it; hyperaemia speeds the whole tree", () => {
    const nr = transportNet(healthy, [], { noReflow: { vessel: "LAD", param: 0.4, scale: 0.3 } });
    expect(theta("LAD", 0.9, nr)).toBeGreaterThan(1.8 * theta("LAD", 0.9));
    expect(Math.abs(theta("LCx", 0.9, nr) - theta("LCx", 0.9)) / theta("LCx", 0.9)).toBeLessThan(0.1);
    expect(nr.impaired.left).toBeGreaterThan(0.05);
    const hyp = transportNet(healthy, [], { hyperaemia: { left: 1, right: 0 } });
    expect(theta("LAD", 0.9, hyp)).toBeLessThan(0.6 * theta("LAD", 0.9));
    expect(hyp.rest.left).toBeGreaterThan(2 * net.rest.left);
  });

  it("a 5 Fr diagnostic catheter by hand still opacifies the artery, more dilutely than 6 Fr", () => {
    const peak = (cath: (typeof LUMENS)[keyof typeof LUMENS]) => {
      const tr = planTrace(standardPlan("left", cath));
      let prox = 0, mid = 0;
      for (let t = 0; t < CINE_RUN_S; t += 1 / 60) {
        const f = fieldAt(t, { trace: tr });
        prox = Math.max(prox, f.at(theta("LAD", 0.1)));
        mid = Math.max(mid, f.at(theta("LAD", 0.5)));
      }
      return { prox, mid };
    };
    const d5 = peak(LUMENS["diag-5"]);
    const d6 = peak(LUMENS["diag-6"]);
    expect(d5.prox).toBeGreaterThan(0.8);
    expect(d5.mid).toBeGreaterThan(0.5);
    expect(d5.mid).toBeLessThan(d6.mid);
  });

  it("washes out proximal first, with the distal tree persisting", () => {
    const tr = std();
    const after = (tr.pushEnd ?? 2) + 1.2;
    const f = fieldAt(after);
    const prox = f.at(theta("LM", 0.5));
    const dist = f.at(theta("LAD", 0.85));
    expect(prox).toBeLessThan(0.5 * fieldAt(1.5).at(theta("LM", 0.5)));
    expect(dist).toBeGreaterThan(prox);
    // long after the run everything has cleared
    expect(fieldAt(tr.q.length * tr.dt + 6).at(theta("LAD", 0.85))).toBeLessThan(0.08);
  });

  it("a weak push mixes poorly: phasic dilution bands and streaks", () => {
    const weak = planTrace({ ...standardPlan("left", LUMENS["guide-6"]), targetFlow: 1.0 });
    const inlet: number[] = [];
    let streaky = 1;
    for (let t = 1.0; t < 2.0; t += 1 / 60) {
      const f = fieldAt(t, { trace: weak });
      inlet.push(f.now.inlet);
      for (let k = 0; k < 20; k++) streaky = Math.min(streaky, f.streak(theta("LAD", k / 20), 3.1));
    }
    expect(Math.max(...inlet) - Math.min(...inlet)).toBeGreaterThan(0.15); // banding through the beat
    expect(inlet.reduce((a, b) => a + b, 0) / inlet.length).toBeLessThan(0.8); // diluted on average
    expect(streaky).toBeLessThan(0.9);
    // a full push is not streaky (behind the front: blood released once the push was established)
    const f = fieldAt(1.5);
    for (let k = 0; k < 10; k++) expect(f.streak(theta("LAD", k / 20), 3.1)).toBeGreaterThan(0.97);
  });

  it("refluxes into the sinus when the push exceeds what the coronary takes; a sealing tip overdrives instead", () => {
    const hard = planTrace({ kind: "forceful", side: "left", catheter: LUMENS["guide-6"] });
    const free = fieldAt(1.5, { trace: hard, seat: { capture: 1, seal: 0 } });
    const sealed = fieldAt(1.5, { trace: hard, seat: { capture: 1, seal: 0.95 } });
    expect(free.sinus).toBeGreaterThan(0.01);
    expect(sealed.sinus).toBeLessThan(0.5 * free.sinus);
    expect(sealed.now.qCoronary).toBeGreaterThan(free.now.qCoronary);
    expect(sealed.S).toBeGreaterThan(free.S); // overdriven flow moves the contrast faster
  });

  it("a non-selective tip opacifies the sinus, not the artery", () => {
    const f = fieldAt(1.5, { seat: { capture: 0, seal: 0 } });
    expect(f.at(0)).toBe(0);
    expect(f.sinus).toBeGreaterThan(0.02);
  });

  it("myocardial blush follows the arteries, outlasts their washout and clears within a few beats (TMP grade 3)", () => {
    const tr = std();
    const end = tr.pushEnd ?? 2.1;
    const b = (t: number) => fieldAt(t).blush;
    expect(b(OPERATOR_DELAY_S + 0.3)).toBeLessThan(0.02);
    let peak = 0, tPeak = 0;
    for (let t = 0; t < 10; t += 0.05) if (b(t) > peak) { peak = b(t); tPeak = t; }
    expect(peak).toBeGreaterThan(0.3);
    expect(tPeak).toBeGreaterThan(end - 0.5);
    // three beats (72/min) into the washout after the peak: well down, not gone
    const later = b(tPeak + 3 * (60 / 72));
    expect(later).toBeLessThan(0.6 * peak);
    expect(b(tPeak + 8)).toBeLessThan(0.1 * peak);
  });

  it("slow flow delays the arrival", () => {
    const th = theta("LAD", 0.6);
    expect(arrival(th, 0.5, { flowScale: 0.3 })).toBeGreaterThan(arrival(th, 0.5) + 0.3);
  });

  it("the step response is a dispersed plug plus laminar streaming", () => {
    expect(stepResponse(0, 1, 0.3)).toBe(0);
    expect(stepResponse(10, 1, 0.3)).toBeGreaterThan(0.94);
    // laminar streaming: a thin early leading edge from half the transit time
    expect(stepResponse(0.6, 1, 1)).toBeGreaterThan(0);
    expect(stepResponse(0.45, 1, 1)).toBe(0);
    expect(stepResponse(1, 1, 0)).toBeCloseTo(0.5, 2);
  });

  it("uses the S9 phasic coronary flow (diastolic predominance on the left)", () => {
    expect(phasicFlow(0.8, "left")).toBeGreaterThan(phasicFlow(0.2, "left"));
    expect(net.rest.left).toBeGreaterThan(net.rest.right * 0.8);
    expect(DEFAULT_SEAT.capture).toBe(1);
  });
});

describe("contrast in the scene", () => {
  const sceneWith = (t: number, over: Partial<SceneInput> = {}) => buildXrayScene(base({ bolus: { filled: leftFill, plume: "none", side: "left", t, injectDur: 1.8, peak: 1 }, ...over }));
  const vesselIodine = (r: ReturnType<typeof buildXrayScene>) => {
    let s = 0;
    for (const tb of r.scene.tubes) if (Array.isArray(tb.mu[0])) for (const m of tb.mu as [number, number, number][]) s += m[1];
    return s;
  };
  /** lumen tubes of the main catheter, hub side first: iodine mu of each part and its point count */
  const lumenParts = (r: ReturnType<typeof buildXrayScene>) => {
    const od = outerCath(r.scene.tubes);
    const i = r.scene.tubes.indexOf(od);
    const out: { mu: number; n: number }[] = [];
    // the lumen tubes follow the shaft: same course, the lumen's radius, the wall's material taken out again
    for (let k = i + 1; k < r.scene.tubes.length; k++) {
      const t = r.scene.tubes[k];
      if (Array.isArray(t.mu[0]) || !(t.r[0] < od.r[0]) || Math.abs((t.mu as number[])[2] + CATHETER_WALL.braid) > 1e-12) break;
      out.push({ mu: (t.mu as number[])[1] + CATHETER_WALL.jacket, n: t.pts.length });
    }
    return out;
  };
  /** lumen contents at the tip */
  const lumen = (r: ReturnType<typeof buildXrayScene>) => lumenParts(r).slice(-1)[0].mu;

  it("films pre-contrast frames, then the arteries fill, then wash out", () => {
    expect(vesselIodine(sceneWith(0.1))).toBe(0);
    const full = vesselIodine(sceneWith(1.6));
    expect(full).toBeGreaterThan(0);
    expect(vesselIodine(sceneWith(9))).toBeLessThan(0.05 * full);
    const r = sceneWith(1.6);
    expect(r.contrast?.injecting).toBe(true);
    expect(r.contrast?.arrival).toBeGreaterThan(OPERATOR_DELAY_S);
    expect(r.contrast!.volumeMl).toBeGreaterThan(2);
    expect(sceneWith(0.1).contrast?.injecting).toBe(false);
  });

  it("keeps a primed catheter lumen opacified and an empty one clear", () => {
    const full = MU.iodinePerMg * 350;
    // a hollow 6 Fr guide: outer diameter 2.0 mm (1 Fr = 1/3 mm), lumen from the injection model's table
    const g = sceneWith(0.1);
    const od = outerCath(g.scene.tubes);
    expect(od.r[0]).toBeCloseTo(CATHETER_OD_MM[6] / 2, 9);
    const lu = g.scene.tubes[g.scene.tubes.indexOf(od) + 1];
    expect(lu.r[0]).toBeCloseTo(LUMENS["guide-6"].idMm / 2, 9);
    expect(lu.pts).toEqual(od.pts.slice(od.pts.length - lu.pts.length));
    expect(lumen(sceneWith(0.1))).toBeCloseTo(full, 6); // primed with contrast before the push
    expect(lumen(sceneWith(1.0))).toBeCloseTo(full, 6);
    expect(lumen(buildXrayScene(base({ bolus: null })))).toBeCloseTo(0, 6);
    expect(lumen(buildXrayScene(base({ bolus: null, catheterContrast: 1 })))).toBeCloseTo(full, 6);
  });

  it("a flushed lumen fills from the hub during the push; another catheter's run leaves it as it is", () => {
    const full = MU.iodinePerMg * 350;
    const flushed = (t: number) => sceneWith(t, { catheterContrast: 0 });
    expect(lumen(flushed(0.1))).toBeCloseTo(0, 6); // saline before the push
    expect(lumenParts(flushed(0.1)).length).toBe(1);
    // part-way: contrast at the hub side of the visible course, saline still at the tip
    let split = false;
    for (let t = OPERATOR_DELAY_S; t < OPERATOR_DELAY_S + 1.2 && !split; t += 0.05) {
      const p = lumenParts(flushed(t));
      if (p.length === 2) {
        split = true;
        expect(p[0].mu).toBeCloseTo(full, 6);
        expect(p[1].mu).toBeCloseTo(0, 6);
      }
    }
    expect(split).toBe(true);
    expect(lumen(flushed(1.6))).toBeCloseTo(full, 6); // the dead volume is out: contrast to the tip
    // a contralateral run (live trace of the other catheter) does not fill the guide
    const other = planTrace(standardPlan("right", LUMENS["diag-6"]));
    const contra = sceneWith(1.2, { catheterContrast: 0.25, bolus: { filled: [], plume: "none", side: "right", t: 1.2, injectDur: 2.2, peak: 1, trace: other } });
    expect(lumenParts(contra).length).toBe(1);
    expect(lumen(contra)).toBeCloseTo(0.25 * full, 6);
  });

  it("beyond a chronic occlusion the vessel fills late and retrogradely through collaterals, never antegradely", () => {
    const cto = { ...c, id: "cto-collat", lesions: [{ vessel: "RCA" as const, position: 0.45, severity: 100, kind: "cto" as const }] };
    const m2 = buildAnatomy(cto);
    const t2 = buildCoronaryTree(m2, cto);
    // a left (donor) injection with no antegrade filling drawn: only the collateral-filled right vessels can show
    const at = (t: number) =>
      vesselIodine(buildXrayScene(base({ model: m2, caseData: cto, tree: t2, bolus: { filled: [], plume: "none", side: "left", t, injectDur: 2.2, peak: 1 } })));
    expect(at(0.9)).toBe(0);
    expect(at(4.5)).toBeGreaterThan(0);
    // the right injection stops at the occlusion
    const rca = t2.vessels.find((v) => v.name === "RCA")!;
    expect(rca.occludedFrom).toBeGreaterThan(0);
  });

  it("accepts a live injection trace and the tip's seat", () => {
    const tr = planTrace({ kind: "puff", side: "left", catheter: LUMENS["guide-6"] });
    const puff = vesselIodine(sceneWith(0.9, { bolus: { filled: leftFill, plume: "none", side: "left", t: 0.9, injectDur: 0.5, peak: 1, trace: tr } }));
    const none = vesselIodine(sceneWith(0.9, { bolus: { filled: leftFill, plume: "none", side: "left", t: 0.9, injectDur: 1.8, peak: 1, seat: { capture: 0, seal: 0 } } }));
    expect(puff).toBeGreaterThan(0);
    expect(none).toBe(0);
  });

  it("a non-selective injection (no side) fills the sinus cloud only", () => {
    const r = buildXrayScene(base({ bolus: { filled: [], plume: "root", side: null, t: 1.2, injectDur: 1.8, peak: 0.25 } }));
    expect(vesselIodine(r)).toBe(0);
    expect(r.scene.bones.some((b) => (b.muI ?? 0) > 0)).toBe(true);
  });

  it("theta on a dense render path interpolates the base samples", () => {
    const v = tree.vessels.find((x) => x.fine) ?? tree.vessels[0];
    const n0 = transportNet(tree, c.lesions);
    const th = thetaOnPath(n0, v, v.fine ? v.fine.samples.length : v.samples.length, v.fine?.baseIndex);
    for (let i = 1; i < th.length; i++) expect(th[i]).toBeGreaterThanOrEqual(th[i - 1] - 1e-6);
  });
});
