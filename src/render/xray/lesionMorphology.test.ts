// Lesion morphologies and the shared collateral model (diag-lesion-morphologies): view-dependent
// severity of eccentric lumens, tapering references, branch lesions, spasm that relaxes with the
// engine's nitrate effect, thrombus, SCAD types, CTO stumps and collateral channels whose recipient
// fills late, and the case generator's morphology option.
//   npx vitest run src/render/xray/lesionMorphology.test.ts
import { describe, expect, it } from "vitest";
import type { CArm, Lesion } from "../../types";
import { buildAnatomy, type AnatomyModel } from "../../simulation/anatomy";
import { generateCase, scenarioCase } from "../../simulation/caseGenerator";
import { diagScenarioById } from "../../simulation/diagnosticScenarios";
import { heldScenarios } from "../../simulation/diagnosticScenarios/lesions";
import { cameraBasis } from "../../simulation/projection";
import { LUMENS, planTrace, standardPlan } from "../../simulation/injection";
import { PatientEngine } from "../../simulation/patient/engine";
import { catheterPath } from "../../ui/sim/helpers";
import { catheterById } from "../../data/catheters";
import { buildCoronaryTree, projectedStenosis, relaxSpasm, renderPath, COLLATERAL, MORPHOLOGY, type CoronaryTree, type TreeVessel } from "./coronaryTree";
import { buildXrayScene, VESSEL_PROFILE, type SceneInput } from "./sceneBuilder";
import { contrastField, lagOnPath, transportNet } from "./contrastTransport";
import type { TubeSpec } from "./thorax";

const RAO30: CArm = { laoRao: -30, cranialCaudal: 0 };
const LAO60: CArm = { laoRao: 60, cranialCaudal: 0 };
const AP: CArm = { laoRao: 0, cranialCaudal: 0 };
const LAT: CArm = { laoRao: 90, cranialCaudal: 0 };
const ORTHOGONAL_PAIRS: [CArm, CArm][] = [
  [RAO30, LAO60],
  [AP, LAT],
];
const dot = (a: CArm, b: CArm) => {
  const f = cameraBasis(a).forward,
    g = cameraBasis(b).forward;
  return f.x * g.x + f.y * g.y + f.z * g.z;
};

function setup(id: string, seed = "1", edit?: (l: Lesion[]) => Lesion[]) {
  // the registry, and the scenarios built but held back from it (diag-focal-rca-spasm)
  const c0 = scenarioCase(id, seed, (x) => diagScenarioById(x) ?? heldScenarios.find((s) => s.id === x))!;
  const c = edit ? { ...c0, lesions: edit(c0.lesions) } : c0;
  const model = buildAnatomy(c);
  const tree = buildCoronaryTree(model, c);
  return { c, model, tree };
}
const vessel = (t: CoronaryTree, lesionId: string) => t.vessels.find((v) => v.lesionId === lesionId && v.kind !== "twig")!;

function sceneInput(model: AnatomyModel, c: ReturnType<typeof setup>["c"], tree: CoronaryTree, over: Partial<SceneInput> = {}): SceneInput {
  const side = over.bolus?.side === "right" ? "right" : "left";
  const os = side === "left" ? model.lm : model.rca;
  const root = catheterPath(model, { pos: os.pos, dir: os.dir, height: os.height, az: os.az, radius: model.sinusRadius, cram: 0, gap: 0 }, catheterById(side === "left" ? "JL4" : "JR4"));
  return { model, caseData: c, tree, catheterRoot: root, french: 6, bolus: null, t: 0, cArm: RAO30, mode: "cine", frame: 1, field: 200, breathHold: 0.7, ...over };
}
const filledOf = (tree: CoronaryTree, side: "left" | "right") => [...new Set(tree.vessels.filter((v) => v.side === side).map((v) => v.fillId))];
const iodine = (tubes: TubeSpec[]) => {
  let s = 0;
  for (const tb of tubes) if (Array.isArray(tb.mu[0])) for (const m of tb.mu as [number, number, number][]) s += m[1];
  return s;
};

// ---------------------------------------------------------------------------

describe("eccentric lumens: the %DS depends on the view", () => {
  it("an eccentric lesion (0.6) gives projected %DS differing by at least 15 points between orthogonal views; a concentric one by under 2", () => {
    for (const [a, b] of ORTHOGONAL_PAIRS) expect(Math.abs(dot(a, b))).toBeLessThan(1e-9);
    const { c, model, tree } = setup("diag-eccentric-orthogonal");
    expect(c.lesions[0].eccentricity).toBe(0.6);
    const ra = projectedStenosis(tree, model, 0, RAO30)!;
    const la = projectedStenosis(tree, model, 0, LAO60)!;
    expect(Math.abs(ra.pctDS - la.pctDS)).toBeGreaterThanOrEqual(15);
    // the same lesion concentric: the view does not change the %DS
    const conc = setup("diag-eccentric-orthogonal", "1", (ls) => ls.map((l) => ({ ...l, eccentricity: 0 })));
    for (const [p, q] of ORTHOGONAL_PAIRS) {
      const x = projectedStenosis(conc.tree, conc.model, 0, p)!.pctDS;
      const y = projectedStenosis(conc.tree, conc.model, 0, q)!.pctDS;
      expect(Math.abs(x - y)).toBeLessThan(2);
      expect(x).toBeCloseTo(72, 0);
    }
    // other seeds of the scenario: some orthogonal pair still differs by 15 points; the worst view is the lesion's severity
    for (const seed of ["2", "3"]) {
      const s = setup("diag-eccentric-orthogonal", seed);
      const best = Math.max(...ORTHOGONAL_PAIRS.map(([p, q]) => Math.abs(projectedStenosis(s.tree, s.model, 0, p)!.pctDS - projectedStenosis(s.tree, s.model, 0, q)!.pctDS)));
      expect(best, `seed ${seed}`).toBeGreaterThanOrEqual(15);
    }
    const views: CArm[] = [];
    for (let lao = -90; lao <= 90; lao += 15) for (const cc of [-30, 0, 30]) views.push({ laoRao: lao, cranialCaudal: cc });
    const all = views.map((v) => projectedStenosis(tree, model, 0, v)!.pctDS);
    expect(Math.max(...all)).toBeLessThanOrEqual(72.5);
    expect(Math.max(...all)).toBeGreaterThan(65);
    // the mildest view sees roughly the major axis: severity x (1 - eccentricity)
    expect(Math.min(...all)).toBeLessThan(40);
  });

  it("the default ribbon path draws the eccentric lumen as a flattened tube; the segment integrator path draws it round", () => {
    const { c, model, tree } = setup("diag-eccentric-orthogonal");
    const inp = sceneInput(model, c, tree, { bolus: { filled: filledOf(tree, "left"), plume: "none", side: "left", t: 1.6, injectDur: 2.2, peak: 1 } });
    const ribbon = buildXrayScene({ ...inp, segments: false });
    const flat = ribbon.scene.tubes.filter((t) => t.thin);
    expect(flat.length).toBe(1);
    const th = flat[0].thin!;
    for (let i = 0; i < th.r.length; i++) expect(th.r[i]).toBeLessThanOrEqual(flat[0].r[i] + 1e-9);
    expect(Math.min(...th.r.map((r, i) => r / flat[0].r[i]))).toBeLessThan(0.6);
    // the vessel is still drawn whole: the pieces meet at shared samples
    const lad = vessel(tree, "LAD");
    const n = renderPath(lad).samples.length;
    const pieces = ribbon.scene.tubes.filter((t) => Array.isArray(t.mu[0]) && (t === flat[0] || t.pts.includes(flat[0].pts[0]) || t.pts.includes(flat[0].pts[flat[0].pts.length - 1])));
    expect(pieces.reduce((s, t) => s + t.pts.length, 0)).toBe(n + 2);
    const seg = buildXrayScene({ ...inp, segments: true });
    const segTubes = (seg.scene.extra?.segmentTubes as TubeSpec[] | undefined) ?? [];
    expect(segTubes.some((t) => t.thin)).toBe(false);
  });

  it("on a calcified eccentric lesion the calcium shell follows the moved lumen and clears its major axis, with or without contrast", () => {
    const { c, model, tree } = setup("diag-eccentric-orthogonal", "1", (ls) => ls.map((l) => ({ ...l, kind: "calcified" as const })));
    expect(vessel(tree, "LAD").calcium.length).toBeGreaterThan(0);
    const lit = buildXrayScene({ ...sceneInput(model, c, tree, { bolus: { filled: filledOf(tree, "left"), plume: "none", side: "left", t: 1.6, injectDur: 2.2, peak: 1 } }), segments: false });
    const flat = lit.scene.tubes.find((t) => t.thin)!;
    const shellOf = (tubes: TubeSpec[]) => tubes.find((t) => !Array.isArray(t.mu[0]) && (t.mu as number[])[0] === -VESSEL_PROFILE.calciumMu && t.pts.length > 1)!;
    const shell = shellOf(lit.scene.tubes);
    const sub = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
    const dotv = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => a.x * b.x + a.y * b.y + a.z * b.z;
    let checked = 0;
    for (let i = 0; i < flat.pts.length; i++) {
      const p = flat.pts[i];
      let k = 0;
      for (let j = 1; j < shell.pts.length; j++) if (dotv(sub(p, shell.pts[j]), sub(p, shell.pts[j])) < dotv(sub(p, shell.pts[k]), sub(p, shell.pts[k]))) k = j;
      if (k === 0 || k === shell.pts.length - 1) continue; // beyond the calcified span
      const T0 = sub(shell.pts[k + 1], shell.pts[k - 1]);
      const n = Math.hypot(T0.x, T0.y, T0.z);
      const T = { x: T0.x / n, y: T0.y / n, z: T0.z / n };
      const off = sub(p, shell.pts[k]);
      const a = dotv(off, T);
      const perp = Math.hypot(off.x - a * T.x, off.y - a * T.y, off.z - a * T.z);
      // the ellipse lies within its major radius of its centre; it stays inside the shell's inner wall
      expect(perp + flat.r[i], `sample ${i}`).toBeLessThanOrEqual(shell.r[k] + 0.1);
      checked++;
    }
    expect(checked).toBeGreaterThan(3);
    // without contrast the shell is the same one (the moved lumen does not depend on the bolus)
    const dark = buildXrayScene({ ...sceneInput(model, c, tree), segments: false });
    const shell0 = shellOf(dark.scene.tubes);
    expect(shell0.r).toEqual(shell.r);
    for (let j = 0; j < shell.pts.length; j++) expect(Math.hypot(shell0.pts[j].x - shell.pts[j].x, shell0.pts[j].y - shell.pts[j].y, shell0.pts[j].z - shell.pts[j].z)).toBeLessThan(1e-9);
  });

  it("a lesion without morphology fields keeps its round lumen, its radii and no shape beyond the reference", () => {
    const { tree } = setup("diag-eccentric-orthogonal", "1", (ls) => ls.map(({ eccentricity: _e, orientationDeg: _o, ...l }) => l));
    const lad = vessel(tree, "LAD");
    expect(lad.shape?.minor).toBeUndefined();
    expect(lad.fine?.shape?.minor).toBeUndefined();
    expect(lad.shape!.ref.length).toBe(lad.radii.length);
  });
});

describe("tapering reference", () => {
  it("the reference falls by taperMm across the lesion; the proximal reference alone overstates the %DS", () => {
    const { model, tree } = setup("diag-tapering-reference");
    const lad = vessel(tree, "LAD");
    const sh = lad.fine!.shape!;
    const site = tree.lesionSites![0];
    const at = (t: number) => {
      let k = 0;
      for (let i = 0; i < lad.fine!.param.length; i++) if (Math.abs(lad.fine!.param[i] - t) < Math.abs(lad.fine!.param[k] - t)) k = i;
      return k;
    };
    const i0 = at(site.lo!),
      i1 = at(site.hi!);
    // the fall in reference diameter across the lesion, beyond the flow law's own taper there
    const natural = 2 * (lad.refRadii![Math.floor(lad.fine!.baseIndex[i0])] - lad.refRadii![Math.floor(lad.fine!.baseIndex[i1])]);
    const fall = 2 * (sh.ref[i0] - sh.ref[i1]);
    expect(fall).toBeGreaterThan(0.85);
    expect(fall).toBeLessThan(1.15 + Math.max(0, natural));
    const v = projectedStenosis(tree, model, 0, RAO30)!;
    const proximalOnly = 100 * (1 - v.mldMm / (2 * sh.ref[i0]));
    expect(v.pctDS).toBeCloseTo(58, 0);
    expect(proximalOnly - v.pctDS).toBeGreaterThan(4);
  });
});

describe("a lesion at a side branch", () => {
  it("the lesion is placed so that its largest nearby branch leaves at branchAt, and Medina's third digit narrows the branch ostium", () => {
    const { tree } = setup("diag-lesion-at-branch");
    const site = tree.lesionSites![0];
    expect(site.branch).toBeDefined();
    const lad = vessel(tree, "LAD");
    const br = tree.vessels.find((v) => v.name === site.branch)!;
    expect(br.parent?.name).toBe("LAD");
    expect(br.kind).not.toBe("twig");
    const tb = lad.param[br.parent!.index];
    // branchAt 0.5: the branch leaves at the middle of the lesion
    expect(Math.abs(tb - site.position)).toBeLessThan(0.01);
    expect(tb).toBeGreaterThan(site.lo!);
    expect(tb).toBeLessThan(site.hi!);
    // Medina 1,1,0: the branch ostium is free; 1,1,1: it is narrowed
    expect(br.radii[1] / br.refRadii![1]).toBeGreaterThan(0.9);
    const both = setup("diag-lesion-at-branch", "1", (ls) => ls.map((l) => ({ ...l, medina: [1, 1, 1] as const })));
    const br2 = both.tree.vessels.find((v) => v.name === both.tree.lesionSites![0].branch)!;
    expect(Math.min(...br2.radii.slice(0, 4).map((r, i) => r / br2.refRadii![i]))).toBeLessThan(0.6);
  });
});

describe("spasm relaxes with the engine's nitrate effect", () => {
  const rcaTube = (tubes: TubeSpec[], v: TreeVessel) => tubes.find((t) => Array.isArray(t.mu[0]) && t.r.length === renderPath(v).samples.length)!;
  const renderedSeverity = (tube: TubeSpec, v: TreeVessel) => {
    const ref = v.fine!.shape!.ref;
    return 1 - Math.min(...tube.r.map((r, i) => r / ref[i]));
  };

  it("a spasm lesion's rendered severity falls as the engine's GTN effect rises", () => {
    const { c, model, tree } = setup("diag-focal-rca-spasm");
    const rca = vessel(tree, "RCA");
    const engine = new PatientEngine({ seed: c.id, tree, lesions: c.lesions });
    const doses = [0, 50, 200];
    const dil: number[] = [];
    const sev: number[] = [];
    const truth: number[] = [];
    for (const extra of doses) {
      if (extra > 0) expect(engine.giveDrug("gtn", extra, "ic", { side: "right" }).ok).toBe(true);
      if (extra > 0) engine.advance(20);
      const d = engine.pharm.effects().epicardialDilation;
      dil.push(d);
      const r = buildXrayScene(sceneInput(model, c, tree, { epicardialDilation: { left: 0, right: d }, bolus: { filled: filledOf(tree, "right"), plume: "none", side: "right", t: 1.6, injectDur: 2, peak: 1 } }));
      sev.push(renderedSeverity(rcaTube(r.scene.tubes, rca), rca));
      truth.push(projectedStenosis(tree, model, 0, LAO60, { dilation: d })!.pctDS);
    }
    expect(dil[0]).toBe(0);
    expect(dil[1]).toBeGreaterThan(dil[0]);
    expect(dil[2]).toBeGreaterThan(dil[1]);
    // no nitrate: the lesion at its full severity (75%)
    expect(sev[0]).toBeCloseTo(0.75, 1);
    expect(sev[1]).toBeLessThan(sev[0] - 0.05);
    expect(sev[2]).toBeLessThan(sev[1] - 0.02);
    expect(truth[1]).toBeLessThan(truth[0]);
    expect(truth[2]).toBeLessThan(truth[1]);
  });

  it("a narrowing that does not respond to nitrate stays, and the other side's dilation does not relax it", () => {
    const fixed = setup("diag-focal-rca-spasm", "1", (ls) => ls.map((l) => ({ ...l, nitrateResponsive: false })));
    const rca = vessel(fixed.tree, "RCA");
    expect(relaxSpasm(rca.radii, rca.shape, 0.9)).toBe(rca.radii);
    const { c, model, tree } = setup("diag-focal-rca-spasm");
    const v = vessel(tree, "RCA");
    const inp = (d: SceneInput["epicardialDilation"]) => sceneInput(model, c, tree, { epicardialDilation: d, bolus: { filled: filledOf(tree, "right"), plume: "none", side: "right", t: 1.6, injectDur: 2, peak: 1 } });
    const none = renderedSeverity(rcaTube(buildXrayScene(inp(0)).scene.tubes, v), v);
    const leftOnly = renderedSeverity(rcaTube(buildXrayScene(inp({ left: 0.9, right: 0 })).scene.tubes, v), v);
    expect(leftOnly).toBeCloseTo(none, 9);
  });
});

describe("chronic total occlusion and the collateral channels", () => {
  /** half-peak times (s since the press) of the donor at the channel origin and of the recipient at the channel entry */
  function halfPeaks(id: string, seed: string) {
    const { c, tree } = setup(id, seed);
    const net = transportNet(tree, c.lesions);
    const ch = tree.vessels.find((v) => v.kind === "collateral")!;
    const donor = tree.vessels.find((v) => v.name === ch.parent!.name)!;
    const thO = net.vessels.get(donor.name)!.theta[ch.parent!.index];
    const rec = tree.vessels.find((v) => v.retro?.entries.some((e) => e.channel === ch.name))!;
    const lag = lagOnPath(net, rec, rec.samples.length);
    const lagE = Math.min(...[...lag].filter(Number.isFinite));
    const trace = planTrace(standardPlan(ch.side, LUMENS["diag-6"]));
    const ser: { t: number; d: number; r: number }[] = [];
    let arrival: number | null = null;
    for (let k = 0; k <= 120; k++) {
      const t = k * 0.1;
      const cf = contrastField({ net, side: ch.side, trace, t, phase: (t / 0.83) % 1, rr: 0.83 });
      arrival ??= cf.arrival;
      ser.push({ t, d: cf.at(thO), r: rec.retro!.gain * cf.late(lagE) });
    }
    const t50 = (k: "d" | "r") => {
      const pk = Math.max(...ser.map((s) => s[k]));
      return ser.find((s) => s[k] >= pk / 2)!.t;
    };
    return { donor: t50("d"), recipient: t50("r"), arrival: arrival!, peakR: Math.max(...ser.map((s) => s.r)), peakD: Math.max(...ser.map((s) => s.d)) };
  }

  it("the CTO recipient reaches half its peak opacity later than the donor and only after more than 2 s", () => {
    for (const id of ["diag-cto-contralateral-collaterals", "diag-two-candidate-culprits"])
      for (const seed of ["1", "2", "3"]) {
        const h = halfPeaks(id, seed);
        const at = `${id} seed ${seed}`;
        expect(h.recipient, at).toBeGreaterThan(h.donor);
        expect(h.recipient, at).toBeGreaterThan(2);
        expect(h.recipient - h.arrival, at).toBeGreaterThan(2);
        // fainter than the donor's own opacity
        expect(h.peakR, at).toBeLessThan(0.7 * h.peakD);
      }
  });

  it("a donor run fills the recipient late: nothing at 1.5 s, filling by 6 s, without antegrade contrast beyond the cap", () => {
    const { c, model, tree } = setup("diag-cto-contralateral-collaterals");
    // only the retrograde filling can show: no vessel is listed as antegrade-filled
    const at = (t: number) => iodine(buildXrayScene(sceneInput(model, c, tree, { bolus: { filled: [], plume: "none", side: "left", t, injectDur: 2.2, peak: 1 } })).scene.tubes);
    expect(at(1.5)).toBe(0);
    expect(at(6)).toBeGreaterThan(0);
    // a right injection stops at the proximal cap
    const rca = vessel(tree, "RCA");
    expect(rca.occludedFrom).toBeGreaterThan(0);
  });

  it("channels follow the lesion's description: septal from a septal branch, Werner calibre and speed, Rentrop extent beyond the distal cap", () => {
    const { tree } = setup("diag-cto-contralateral-collaterals");
    const ch = tree.vessels.filter((v) => v.kind === "collateral");
    expect(ch.map((v) => v.channel!.type)).toEqual(["septal", "epicardial"]);
    expect(tree.vessels.find((v) => v.name === ch[0].parent!.name)!.territory).toBe("septal");
    for (const v of ch) {
      expect(v.side).toBe("left");
      expect(v.channel!.speedMmS).toBe(COLLATERAL.speedMmS[1]);
      expect(Math.max(...v.radii)).toBeLessThanOrEqual(COLLATERAL.radiusMm[1] * 1.15 + 1e-9);
    }
    const rca = vessel(tree, "RCA");
    // Rentrop 3: the RCA fills back to the distal cap, 25 mm beyond the proximal cap, not into the occluded segment
    const gap = rca.pathMm[rca.retro!.from] - rca.pathMm[rca.occludedFrom];
    expect(gap).toBeGreaterThan(24);
    expect(gap).toBeLessThan(28);
    expect(tree.vessels.find((v) => v.lesionId === "PDA")!.retro?.entries.length).toBe(1);
    // Rentrop 2: only the distal epicardial vessel; Rentrop 1: side branches only
    const r2 = setup("diag-cto-contralateral-collaterals", "1", (ls) => ls.map((l) => ({ ...l, cto: { ...l.cto!, collaterals: l.cto!.collaterals.map((x) => ({ ...x, rentrop: 2 as const })) } })));
    const rca2 = vessel(r2.tree, "RCA");
    expect(rca2.retro!.from).toBeGreaterThan(rca.retro!.from + 10);
    const r1 = setup("diag-cto-contralateral-collaterals", "1", (ls) => ls.map((l) => ({ ...l, cto: { ...l.cto!, collaterals: l.cto!.collaterals.map((x) => ({ ...x, rentrop: 1 as const })) } })));
    expect(vessel(r1.tree, "RCA").retro).toBeUndefined();
    expect(r1.tree.vessels.some((v) => v.retro && v.lesionId !== "RCA")).toBe(true);
    // CC2 channels are wider and faster than CC1
    expect(COLLATERAL.radiusMm[2]).toBeGreaterThan(COLLATERAL.radiusMm[1]);
    expect(COLLATERAL.speedMmS[2]).toBeGreaterThan(COLLATERAL.speedMmS[1]);
  });

  it("a tapered stump narrows over millimetres before the cap; a blunt one stays wide to the cap", () => {
    const radiusBefore = (stump: "tapered" | "blunt", mm: number) => {
      const { tree } = setup("diag-cto-contralateral-collaterals", "1", (ls) => ls.map((l) => ({ ...l, cto: { ...l.cto!, stump } })));
      const rca = vessel(tree, "RCA");
      const f = rca.fine!;
      const total = rca.pathMm[rca.pathMm.length - 1] - rca.pathMm[0];
      const t = tree.lesionSites![0].position - mm / total;
      let k = 0;
      for (let i = 0; i < f.param.length; i++) if (Math.abs(f.param[i] - t) < Math.abs(f.param[k] - t)) k = i;
      return f.radii[k] / f.shape!.ref[k];
    };
    expect(radiusBefore("tapered", 3)).toBeLessThan(0.75);
    expect(radiusBefore("blunt", 3)).toBeGreaterThan(0.95);
    expect(MORPHOLOGY.stumpTaperMm).toBeGreaterThan(MORPHOLOGY.stumpBluntMm);
  });

  it("a CTO without its own description keeps the automatic channels, now timed by the same transport", () => {
    const { tree, c } = setup("diag-cto-contralateral-collaterals", "1", (ls) => ls.map(({ morphology: _m, cto: _c, ...l }) => l));
    const ch = tree.vessels.filter((v) => v.kind === "collateral");
    expect(ch.length).toBeGreaterThan(0);
    const net = transportNet(tree, c.lesions);
    const rca = vessel(tree, "RCA");
    expect(rca.retro!.gain).toBe(COLLATERAL.autoGain);
    expect([...net.vessels.get(rca.name)!.lag!].some(Number.isFinite)).toBe(true);
  });
});

describe("thrombus", () => {
  it("an acute thrombotic occlusion ends in a convex meniscus with haze; it grows no collaterals", () => {
    const { tree } = setup("diag-two-candidate-culprits");
    const lcx = vessel(tree, "LCx");
    const f = lcx.fine!;
    const sh = f.shape!;
    const site = tree.lesionSites![0];
    const total = lcx.pathMm[lcx.pathMm.length - 1] - lcx.pathMm[0];
    const near = (mm: number) => {
      const t = site.position + mm / total;
      let k = 0;
      for (let i = 0; i < f.param.length; i++) if (Math.abs(f.param[i] - t) < Math.abs(f.param[k] - t)) k = i;
      return k;
    };
    const R = sh.ref[near(0)];
    // a dome: still most of the lumen half a radius before the cut, closed at it
    expect(f.radii[near(-R / 2)] / sh.ref[near(-R / 2)]).toBeGreaterThan(0.6);
    expect(f.radii[near(0)] / sh.ref[near(0)]).toBeLessThan(0.05);
    expect(Math.max(...sh.haze!)).toBeGreaterThan(0.9);
    // the only channels are the RCA CTO's, from the left anterior descending
    for (const v of tree.vessels.filter((x) => x.kind === "collateral")) expect(v.channel!.recipient).toBe("PDA");
  });

  it("a non-occlusive thrombus is an intraluminal filling defect: a tube of negative iodine inside the lumen, never below zero", () => {
    const { c, model, tree } = setup("diag-two-candidate-culprits", "1", (ls) => ls.map((l) => (l.vessel === "LCx" ? { ...l, severity: 60, thrombusGrade: 3 as const } : l)));
    const r = buildXrayScene(sceneInput(model, c, tree, { bolus: { filled: filledOf(tree, "left"), plume: "none", side: "left", t: 1.8, injectDur: 2.2, peak: 1 } }));
    const neg = r.scene.tubes.filter((t) => Array.isArray(t.mu[0]) && (t.mu as [number, number, number][]).some((m) => m[1] < 0));
    // the filling defect, and the haze's inner wall (below)
    expect(neg.length).toBe(2);
    const lcx = vessel(tree, "LCx");
    const lumen = r.scene.tubes.find((t) => Array.isArray(t.mu[0]) && t.r.length === renderPath(lcx).samples.length)!;
    const d = neg.find((t) => t.r.every((x, j) => x < lumen.r[lumen.pts.indexOf(t.pts[j])]))!;
    expect(d).toBeDefined();
    // inside the lumen: narrower than it, and removing at most the lumen's own iodine at each point
    for (let j = 0; j < d.pts.length; j++) {
      const i = lumen.pts.indexOf(d.pts[j]);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(d.r[j]).toBeLessThan(lumen.r[i]);
      expect(-(d.mu as [number, number, number][])[j][1]).toBeLessThanOrEqual((lumen.mu as [number, number, number][])[i][1] + 1e-12);
    }
    // the defect's length follows the TIMI thrombus grade (3: half to two vessel diameters)
    const len = (d.pts.length - 1) * 0.25;
    // the reference diameter at the defect (the lumen there is narrowed by the lesion's severity)
    const D = 2 * Math.max(...d.pts.map((p) => lcx.fine!.shape!.ref[lumen.pts.indexOf(p)]));
    expect(len).toBeGreaterThan(0.5 * D);
    expect(len).toBeLessThan(2 * D);
  });

  it("the haze is a halo round the lumen: the iodine it adds inside the lumen is taken back out, so the lumen is not denser", () => {
    const { c, model, tree } = setup("diag-two-candidate-culprits", "1", (ls) => ls.map((l) => (l.vessel === "LCx" ? { ...l, severity: 60, thrombusGrade: 3 as const } : l)));
    const r = buildXrayScene(sceneInput(model, c, tree, { bolus: { filled: filledOf(tree, "left"), plume: "none", side: "left", t: 1.8, injectDur: 2.2, peak: 1 } }));
    const lcx = vessel(tree, "LCx");
    const lumen = r.scene.tubes.find((t) => Array.isArray(t.mu[0]) && t.r.length === renderPath(lcx).samples.length)!;
    const mu = (t: TubeSpec) => t.mu as [number, number, number][];
    const at = (t: TubeSpec) => t.pts.map((p) => lumen.pts.indexOf(p));
    const onLumen = r.scene.tubes.filter((t) => t !== lumen && Array.isArray(t.mu[0]) && at(t).every((i) => i >= 0));
    const outer = onLumen.find((t) => at(t).every((i, j) => t.r[j] > lumen.r[i] + 1e-9) && mu(t).some((m) => m[1] > 0))!;
    const inner = onLumen.find((t) => at(t).every((i, j) => Math.abs(t.r[j] - lumen.r[i]) < 1e-9) && mu(t).some((m) => m[1] < 0))!;
    expect(outer).toBeDefined();
    expect(inner).toBeDefined();
    expect(inner.pts).toEqual(outer.pts);
    for (let j = 0; j < outer.pts.length; j++) expect(mu(inner)[j][1]).toBeCloseTo(-mu(outer)[j][1], 12);
    expect(Math.max(...mu(outer).map((m) => m[1]))).toBeGreaterThan(0);
  });

  it("TIMI thrombus grade 0 (no thrombus) draws no filling defect, no haze and no stipple", () => {
    const { c, model, tree } = setup("diag-two-candidate-culprits", "1", (ls) => ls.map((l) => (l.vessel === "LCx" ? { ...l, severity: 60, thrombusGrade: 0 as const } : l)));
    const lcx = vessel(tree, "LCx");
    expect(lcx.shape?.defect).toBeUndefined();
    expect(lcx.shape?.haze).toBeUndefined();
    expect(lcx.fine?.shape?.defect).toBeUndefined();
    expect(lcx.thrombus).toEqual([]);
    const r = buildXrayScene(sceneInput(model, c, tree, { bolus: { filled: filledOf(tree, "left"), plume: "none", side: "left", t: 1.8, injectDur: 2.2, peak: 1 } }));
    expect(r.scene.tubes.filter((t) => Array.isArray(t.mu[0]) && (t.mu as [number, number, number][]).some((m) => m[1] < 0)).length).toBe(0);
  });
});

describe("SCAD types", () => {
  const withType = (t: "1" | "2A" | "2B" | "3") => setup("diag-scad-types", "1", (ls) => ls.map((l) => ({ ...l, scadType: t })));
  const profile = (tree: CoronaryTree) => {
    const lad = vessel(tree, "LAD");
    const f = lad.fine!;
    return { lad, f, rel: f.radii.map((r, i) => r / f.shape!.ref[i]) };
  };

  it("2A is a long smooth narrowing with normal artery beyond; 2B runs to the tip; 3 is focal; 1 has a false lumen", () => {
    const narrowMm = (tree: CoronaryTree) => {
      const { lad, f, rel } = profile(tree);
      let n = 0;
      for (let i = 1; i < rel.length; i++) if (rel[i] < 0.6) n += f.pathMm[i] - f.pathMm[i - 1];
      return { n, tipNarrow: rel[rel.length - 1] < 0.6, lad };
    };
    const a = narrowMm(withType("2A").tree),
      b = narrowMm(withType("2B").tree),
      t3 = narrowMm(withType("3").tree);
    expect(a.n).toBeGreaterThan(20);
    expect(a.tipNarrow).toBe(false);
    expect(b.tipNarrow).toBe(true);
    expect(b.n).toBeGreaterThan(a.n);
    expect(t3.n).toBeLessThan(20);
    expect(t3.n).toBeGreaterThan(3);
    const one = withType("1");
    const lad1 = vessel(one.tree, "LAD");
    expect(Math.max(...lad1.fine!.shape!.falseR!)).toBeGreaterThan(0.5);
    expect(lad1.shape?.falseR).toBeDefined();
    expect(vessel(withType("2A").tree, "LAD").fine!.shape!.falseR).toBeUndefined();
  });

  it("type 1: the false lumen beside the true one holds contrast after the lumen has washed out", () => {
    const { c, model, tree } = withType("1");
    const at = (t: number) => {
      const r = buildXrayScene(sceneInput(model, c, tree, { bolus: { filled: filledOf(tree, "left"), plume: "none", side: "left", t, injectDur: 2.2, peak: 1 } }));
      const lad = vessel(tree, "LAD");
      const lumen = r.scene.tubes.find((x) => Array.isArray(x.mu[0]) && x.r.length === renderPath(lad).samples.length)!;
      const fl = r.scene.tubes.filter((x) => Array.isArray(x.mu[0]) && !lumen.pts.includes(x.pts[0]) && x.r.length > 4 && Math.max(...x.r) < 1.5);
      // the false lumen: points beside the lumen, not on it
      const flTube = fl.find((x) => Math.min(...x.pts.map((p) => Math.min(...lumen.pts.map((q) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z))))) > 0.3)!;
      const mean = (x: TubeSpec) => (x.mu as [number, number, number][]).reduce((s, m) => s + m[1], 0) / x.mu.length;
      return { lumen: mean(lumen), falseLumen: mean(flTube) };
    };
    const early = at(1.4),
      late = at(8);
    expect(early.lumen).toBeGreaterThan(early.falseLumen);
    expect(late.falseLumen).toBeGreaterThan(late.lumen);
    expect(late.falseLumen).toBeGreaterThan(0);
  });
});

describe("the case generator accepts the morphologies", () => {
  it("spec.morphology draws morphology details on the fitting lesions with its own stream; without it the case is the plain one", () => {
    const plain = generateCase("m-1", { pathology: "cto" });
    expect(plain.lesions.every((l) => l.morphology === undefined && l.cto === undefined)).toBe(true);
    const cto = generateCase("m-1", { pathology: "cto", morphology: "cto" });
    expect({ ...cto, lesions: [] }).toEqual({ ...plain, lesions: [] });
    expect(cto.lesions.map(({ morphology: _m, cto: _c, ...l }) => l)).toEqual(plain.lesions);
    const l = cto.lesions[0];
    expect(l.morphology).toBe("cto");
    expect(l.cto!.collaterals[0]).toMatchObject({ donor: "LAD", recipient: "PDA", type: "septal" });
    expect(generateCase("m-1", { pathology: "cto", morphology: "cto" })).toEqual(cto);
    // the generated CTO draws its channel
    const t = buildCoronaryTree(buildAnatomy(cto), cto);
    expect(t.vessels.filter((v) => v.kind === "collateral").length).toBe(1);

    expect(generateCase("m-2", { pathology: "thrombotic", morphology: "thrombus" }).lesions[0]).toMatchObject({ morphology: "thrombus" });
    expect(generateCase("m-3", { pathology: "spasm", morphology: "spasm" }).lesions[0]).toMatchObject({ morphology: "spasm", nitrateResponsive: true });
    expect(generateCase("m-4", { pathology: "moderate-stenosis", morphology: "scad" }).lesions[0].scadType).toMatch(/^(1|2A|2B|3)$/);
    const ecc = generateCase("m-5", { pathology: "severe-stenosis", eccentric: true }).lesions[0];
    expect(ecc.eccentricity).toBeGreaterThanOrEqual(0.4);
    expect(ecc.eccentricity).toBeLessThanOrEqual(0.8);
    // a morphology that does not fit leaves the lesion alone
    expect(generateCase("m-6", { pathology: "moderate-stenosis", morphology: "cto" }).lesions[0].morphology).toBeUndefined();
  });
});
