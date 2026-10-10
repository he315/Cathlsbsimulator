// realism-baseline: the capture set behind docs/realism/baseline.md. The scorecard's specs stay those
// of c1g0, the device scenes are drawn through the PCI lab's own pciDevices at four stages of a case
// driven through the PCI engine, the live-path specs film the labs, and a deliberately narrowed tree
// is a narrowed tree. GL-free (the browser half is checked through the dev hooks).
import { describe, expect, it } from "vitest";
import {
  DEVICE_SCENES,
  GUIDE_STAGE_WIRE_MM,
  LIVE_SEQUENCES,
  PCI_DEVICE_STAGES,
  REFERENCE_VIEWS,
  annotateLiveFrame,
  baselineSpecs,
  catheterAnnotation,
  iodineAmount,
  liveSpec,
  prepareScenario,
  resolveSpec,
  sceneInputAt,
  sceneTubes,
  simulateSequence,
  standardSpecs,
  type Prepared,
  type ResolvedSpec,
} from "./xrayCapture";
import { buildXrayScene } from "../render/xray/sceneBuilder";
import { pciDevices } from "../ui/sections/AngioPci";
import { BALLOON_SPEC, STENT_SPEC } from "../simulation/pciBench";
import { STANDARD_PUSH_S } from "../simulation/injection";
import type { Sample } from "../render/xray/coronaryTree";
import type { Vec3 } from "../types";

/** The scene of frame k of a spec, with the heart-surface mapping the scene builder handed out. */
function frame(R: ResolvedSpec, p: Prepared, k: number) {
  const sink: { place?: (sm: Sample) => Vec3 } = {};
  const inp = sceneInputAt(p, R, k, sink);
  const r = buildXrayScene(inp);
  return { inp, r, place: sink.place! };
}

describe("realism baseline: the scorecard specs are c1g0's", () => {
  it("the baseline set starts with the eight c1g0 sequences at their default settings", () => {
    const names = baselineSpecs("baseline").map((s) => s.name);
    // the eight sequences of datasets/tmp/captures/c1g0 (six reference views, fluoroscopy and flush companions)
    expect(names.slice(0, 8)).toEqual(["lad_raocau", "lad_raocra", "lad_apcra", "lad_laocra", "rca_lao", "rca_rao", "lad_raocau_fluoro", "lad_raocau_flush"]);
    expect(names.slice(0, 8)).toEqual(standardSpecs("baseline").map((s) => s.name));
    expect(REFERENCE_VIEWS).toHaveLength(6);
    // the resolved settings recorded in every c1g0 metadata file
    for (const s of standardSpecs("baseline")) {
      const R = resolveSpec(s);
      expect(R.role).toBe("scorecard");
      expect(R.devices).toBeNull();
      expect(R.narrowTree).toBeNull();
      expect([R.fieldCm, R.fps, R.t0, R.seed, R.warmup, R.res, R.profile, R.params, R.source]).toEqual([20, 15, 0, 1, 4, 768, null, null, "offscreen"]);
      if (s.mode === "fluoro") expect([R.nFrames, R.injection]).toEqual([40, null]);
      else if (s.catheter === "diagnostic") expect([R.nFrames, R.injection]).toEqual([12, null]);
      else expect([R.nFrames, R.injection]).toEqual([51, { at: 0, duration: STANDARD_PUSH_S, side: s.scenario === "rca-calcified" ? "right" : "left" }]);
    }
  });

  it("device and live runs carry their role, so report.py keeps them out of the pass count", () => {
    const dev = baselineSpecs("baseline").slice(8);
    expect(dev.map((s) => s.name)).toEqual(["dev_guide", "dev_wire", "dev_balloon", "dev_stent"]);
    expect(dev.map((s) => resolveSpec(s).role)).toEqual(["device", "device", "device", "device"]);
    expect(DEVICE_SCENES.map((d) => d.devices)).toEqual(PCI_DEVICE_STAGES);
    const pci = resolveSpec(liveSpec("baseline", "pci"));
    const diag = resolveSpec(liveSpec("baseline", "diagnostic"));
    expect([pci.role, pci.source, pci.name]).toEqual(["live", "pci-hook", LIVE_SEQUENCES.pci.name]);
    expect([diag.role, diag.source, diag.name]).toEqual(["live", "fluoro-hook", LIVE_SEQUENCES.diagnostic.name]);
    // a role can be given explicitly; devices are offscreen only
    expect(resolveSpec({ set: "x", name: "y", role: "device" }).role).toBe("device");
    expect(() => resolveSpec({ set: "x", name: "y", source: "pci-hook", devices: "wire" })).toThrow();
    expect(() => resolveSpec({ set: "x", name: "y", devices: "stent-x" as never })).toThrow();
  });
});

describe("realism baseline: PCI device scenes drawn through pciDevices", () => {
  const specFor = (stage: (typeof PCI_DEVICE_STAGES)[number]) => resolveSpec({ ...baselineSpecs("baseline").find((s) => s.name === `dev_${stage}`)!, warmup: 0, nFrames: 2 });

  it("each stage is a state the PCI engine reached: guide engaged, wire across, balloon inflated, stent deployed", () => {
    const guide = prepareScenario("lad-focal", { devices: "guide" }).pci!;
    const wire = prepareScenario("lad-focal", { devices: "wire" }).pci!;
    const balloon = prepareScenario("lad-focal", { devices: "balloon" }).pci!;
    const stent = prepareScenario("lad-focal", { devices: "stent" }).pci!;
    const les = wire.g.lesion;
    // the wire tip just out of the guide, in the proximal left main
    expect(guide.st.route).toEqual(["LM"]);
    expect(guide.st.tipMm).toBeGreaterThanOrEqual(GUIDE_STAGE_WIRE_MM);
    expect(guide.st.tipMm).toBeLessThan(GUIDE_STAGE_WIRE_MM + 1);
    expect(guide.st.guide.engaged).toBe(true);
    expect(guide.st.device).toBeNull();
    expect(wire.st.route).toContain(les.vessel);
    expect(wire.st.tipMm).toBeGreaterThan(les.endMm + 20);
    const d = balloon.st.device!;
    expect(d.kind).toBe("balloon");
    expect(d.inflated).toBe(true);
    expect(d.atm).toBe(BALLOON_SPEC["semi-compliant"].nominalAtm);
    expect(Math.abs(d.centreMm - les.centreMm)).toBeLessThan(1);
    expect(d.lengthMm).toBeGreaterThanOrEqual(les.endMm - les.startMm);
    expect(stent.st.device).toBeNull();
    expect(stent.st.stents).toHaveLength(1);
    expect(stent.st.stents[0].fromMm).toBeLessThanOrEqual(les.startMm);
    expect(stent.st.stents[0].toMm).toBeGreaterThanOrEqual(les.endMm);
    expect(stent.steps.some((s) => s.atm === STENT_SPEC.nominalAtm)).toBe(true);
  });

  it("the scene holds exactly the scorecard scene plus the tubes pciDevices draws for the stage", () => {
    const ref = resolveSpec({ set: "t", name: "lad_raocra", view: "raocranial", scenario: "lad-focal", warmup: 0, nFrames: 2 });
    const base = frame(ref, prepareScenario("lad-focal"), 0);
    const nRef = sceneTubes(base.r.scene).length;
    const added: Record<string, number> = {};
    for (const stage of PCI_DEVICE_STAGES) {
      const R = specFor(stage);
      const p = prepareScenario(R.scenario, { devices: R.devices });
      const f = frame(R, p, 0);
      const dev = pciDevices(p.s, p.pci!.st, p.pci!.g, p.tree, f.place, { bolusT: f.inp.bolus ? f.inp.bolus.t : null, injecting: true }, p.pci!.atm);
      added[stage] = dev.tubes.length;
      expect(sceneTubes(f.r.scene).length).toBe(nRef + dev.tubes.length);
    }
    // guide stage and wire: the wire's shaft and radiopaque coil; balloon (contrast-filled balloon and two markers on the wire);
    // stent (two shell tubes on the wire)
    expect(added.guide).toBe(2);
    expect(added.wire).toBe(2);
    expect(added.balloon).toBe(added.wire + 3);
    expect(added.stent).toBe(added.wire + 2);
  });

  it("the guide-stage scene keeps the reference scene's catheter and iodine and adds only the short wire", () => {
    const ref = resolveSpec({ set: "t", name: "lad_raocra", view: "raocranial", scenario: "lad-focal", warmup: 0, nFrames: 12 });
    const a = simulateSequence(ref, { warmup: false });
    const b = simulateSequence({ ...specFor("guide"), nFrames: 12 }, { warmup: false });
    expect(b.map((f) => iodineAmount(f.scene))).toEqual(a.map((f) => iodineAmount(f.scene)));
    expect(catheterAnnotation(b[5].scene, 768)).toEqual(catheterAnnotation(a[5].scene, 768));
    // the scene is no longer the twin's: the extra tubes are the wire stub in the left main, a few mm long
    const extra = sceneTubes(b[5].scene).slice(sceneTubes(a[5].scene).length);
    expect(extra.length).toBe(2);
    const len = (pts: Vec3[]) => pts.slice(1).reduce((acc, q, i) => acc + Math.hypot(q.x - pts[i].x, q.y - pts[i].y, q.z - pts[i].z), 0);
    for (const t of extra) {
      expect(len(t.pts)).toBeGreaterThan(GUIDE_STAGE_WIRE_MM - 1);
      expect(len(t.pts)).toBeLessThan(GUIDE_STAGE_WIRE_MM + 5);
    }
  });

  it("an inflated balloon stops antegrade contrast beyond it, as in the lab (pciFlowMods)", () => {
    const R = (stage: "wire" | "balloon") => ({ ...specFor(stage), nFrames: 30 });
    const io = (stage: "wire" | "balloon") => simulateSequence(R(stage), { warmup: false }).map((f) => iodineAmount(f.scene));
    const w = io("wire"),
      b = io("balloon");
    expect(Math.max(...b)).toBeLessThan(Math.max(...w));
  });

  it("device scenes are deterministic", () => {
    const R = { ...specFor("stent"), nFrames: 6 };
    const a = simulateSequence(R, { warmup: false }).map((f) => iodineAmount(f.scene));
    const b = simulateSequence(R, { warmup: false }).map((f) => iodineAmount(f.scene));
    expect(a).toEqual(b);
  });
});

describe("realism baseline: live-path annotation and the narrowed-tree check", () => {
  it("a live frame is annotated from its scene alone, as the offscreen frame's catheter and iodine", () => {
    const R = resolveSpec({ set: "t", name: "lad_raocau", view: "raocaudal", scenario: "lad-focal", warmup: 0, nFrames: 8 });
    const f = simulateSequence(R, { warmup: false })[6];
    const ann = annotateLiveFrame(6, 6 / 15, f.bolusT, f.scene, f.params, R.res, true);
    expect(ann.iodine).toBe(iodineAmount(f.scene));
    expect(ann.catheter).toEqual(catheterAnnotation(f.scene, R.res));
    expect(ann.mode).toBe("cine");
    expect(ann.ribs!.length).toBeGreaterThan(0);
  });

  it("a deliberately narrowed left tree narrows the left coronaries only, and leaves the cached tree alone", () => {
    const plain = prepareScenario("lad-focal");
    const lad0 = plain.tree.vessels.find((v) => v.name === "LAD")!.radii.slice();
    const narrow = prepareScenario("lad-focal", { narrowTree: { side: "left", scale: 0.6 } });
    const lad = narrow.tree.vessels.find((v) => v.name === "LAD")!;
    lad.radii.forEach((r, i) => expect(r).toBeCloseTo(0.6 * lad0[i], 9));
    const rca0 = plain.tree.vessels.find((v) => v.name === "RCA")!.radii;
    expect(narrow.tree.vessels.find((v) => v.name === "RCA")!.radii).toEqual(rca0);
    expect(prepareScenario("lad-focal").tree.vessels.find((v) => v.name === "LAD")!.radii).toEqual(lad0);
    // and the LAD drawn in the built scene is narrower: the scene tubes that start at the LAD's placed
    // origin carry 0.6 of the plain scene's radius at every point (the scorecard's vessel rows read the
    // image these tubes make)
    const ladTubes = (narrowTree?: { side: "left" | "right"; scale: number }) => {
      const R = resolveSpec({ set: "t", name: "lad_raocau", view: "raocaudal", scenario: "lad-focal", warmup: 0, nFrames: 8, ...(narrowTree ? { narrowTree } : {}) });
      const p = prepareScenario(R.scenario, { narrowTree: R.narrowTree });
      const f = frame(R, p, 6);
      const o = f.place(p.tree.vessels.find((x) => x.name === "LAD")!.samples[0]);
      return sceneTubes(f.r.scene).filter((t) => Math.hypot(t.pts[0].x - o.x, t.pts[0].y - o.y, t.pts[0].z - o.z) < 1e-6);
    };
    const a = ladTubes();
    const b = ladTubes({ side: "left", scale: 0.6 });
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBe(a.length);
    a.forEach((t, j) => {
      expect(b[j].pts).toEqual(t.pts);
      expect(b[j].r.length).toBe(t.r.length);
      t.r.forEach((r, i) => expect(b[j].r[i] / r).toBeCloseTo(0.6, 6));
    });
  });
});
