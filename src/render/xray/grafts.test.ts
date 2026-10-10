// ---------------------------------------------------------------------------
// Bypass grafts in the shared coronary tree (diag-grafts-svg): the aortic ostia in the module's usual order, the
// grown courses, the physics lumens, graft and native injections (the graft as a source into the native bed beyond
// its anastomosis, competitive washout and back-filling), the occluded stump on an aortogram, the ring markers, and
// the search rule behind graft-not-found.
//   npx vitest run src/render/xray/grafts.test.ts
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AnatomyCase, Graft, Lesion, Vec3 } from "../../types";
import { scenarioCase } from "../../simulation/caseGenerator";
import { GRAFT_OSTIUM, GRAFT_PREFIX, GraftSearch, GRAFT_SEARCH, buildAnatomy, graftSiteByName, toWorld, type AnatomyModel } from "../../simulation/anatomy";
import { buildCoronaryTree, samplePos, GRAFT_LESION, type CoronaryTree, type TreeGraft } from "./coronaryTree";
import { GRAFT_FLOW, THETA_MAX_S, contrastField, graftCompetition, graftTransportNet, transportNet } from "./contrastTransport";
import { buildXrayScene, type BolusView } from "./sceneBuilder";
import { motionAt, clockStateAt } from "./heartMotion";
import { coronaryInputsFromRenderTree, graftLumenId } from "../../physics/coronaryLumens";
import { IODINE_MG_PER_ML, planTrace, standardPlan, lumenForFrench } from "../../simulation/injection";
import { MU } from "./thorax";
import { graftBolus, graftHardware } from "../../ui/sim/FluoroView";
import { CATHETERS } from "../../data/catheters";
import { catheterSpec } from "../../physics/catheterShapes";

const CMP = "diag-graft-imaging-competitive-flow";
const MAP = "diag-graft-roadmap-aortogram";

function setup(id: string, seed = "1", edit?: (c: AnatomyCase) => AnatomyCase) {
  let c = scenarioCase(id, seed)!;
  if (edit) c = edit(c);
  const model = buildAnatomy(c);
  const tree = buildCoronaryTree(model, c);
  return { c, model, tree };
}
const graftOf = (tree: CoronaryTree, id: string): TreeGraft => tree.grafts!.find((g) => g.graft.id === id)!;
const level = (t: string) => (t === "OM1" || t === "OM2" || t === "LCx" ? "cx" : t === "LAD" || t === "D1" || t === "D2" ? "lad" : "rca");

// --- the scene, sampled near a point ---------------------------------------------------------------

const HR = 72;
/** World position of a tree sample in a scene built at time t without breathing (the scene's own placement). */
function worldAt(model: AnatomyModel, tree: CoronaryTree, s: TreeGraft["samples"][number], t: number): Vec3 {
  const m = motionAt(clockStateAt(t, HR), tree.heart);
  return toWorld(model, samplePos(tree.heart, s, m));
}
/** Largest iodine attenuation of any vessel tube point within r mm of p. */
function iodineNear(scene: ReturnType<typeof buildXrayScene>["scene"], p: Vec3, r = 1.2): number {
  let best = 0;
  for (const tb of scene.tubes) {
    for (let j = 0; j < tb.pts.length; j++) {
      const q = tb.pts[j];
      if (Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z) > r) continue;
      const mu = Array.isArray(tb.mu[0]) ? (tb.mu as [number, number, number][])[j] : (tb.mu as [number, number, number]);
      if (mu && mu[1] > best) best = mu[1];
    }
  }
  return best;
}
function scene(c: AnatomyCase, model: AnatomyModel, tree: CoronaryTree, bolus: BolusView | null, t: number) {
  return buildXrayScene({
    model,
    caseData: c,
    tree,
    catheterRoot: [],
    french: 6,
    bolus,
    t,
    heartRate: HR,
    breathHold: 0,
    cArm: { laoRao: 30, cranialCaudal: 0 },
    mode: "cine",
    frame: 1,
    thoraxSegments: false,
    segments: false,
  });
}
/** A standard 3 s hand injection on a side, seen `t` s after the press. */
function bolus(side: "left" | "right", t: number, extra: Partial<BolusView> = {}): BolusView {
  const trace = planTrace({ ...standardPlan(side, lumenForFrench(6, false), 3), primed: 1 });
  return { filled: side === "left" ? ["LM", "LAD", "LCx", "D1", "D2", "OM1", "OM2", "SEPTAL", "RAMUS"] : ["RCA", "CONUS", "AM", "PDA", "PLV"], plume: "none", side, t, injectDur: 3, peak: 1, trace, seat: { capture: 1, seal: 0.3 }, ...extra };
}

describe("graft ostia on the anterior ascending aorta", () => {
  it("heights are ordered circumflex > LAD > RCA, all anterior to the native RCA ostium (every graft scenario, three root sizes, rotated roots)", () => {
    const ids = ["diag-graft-search", CMP, MAP, "diag-long-svg-run"];
    let checked = 0;
    for (const id of ids)
      for (const rootSize of ["small", "normal", "dilated"] as const)
        for (const rot of [-10, 0, 10]) {
          const c = { ...scenarioCase(id, "1")!, rootSize, rootRotationDeg: rot };
          const m = buildAnatomy(c);
          const sites = m.grafts ?? [];
          expect(sites.length, id).toBeGreaterThan(0);
          const h = (lv: string) => sites.filter((s) => level(s.graft.target) === lv).map((s) => s.ostium.height);
          const cx = h("cx"), lad = h("lad"), rca = h("rca");
          if (cx.length && lad.length) expect(Math.min(...cx)).toBeGreaterThan(Math.max(...lad));
          if (lad.length && rca.length) expect(Math.min(...lad)).toBeGreaterThan(Math.max(...rca));
          if (cx.length && rca.length) expect(Math.min(...cx)).toBeGreaterThan(Math.max(...rca));
          for (const s of sites) {
            expect(s.ostium.pos.z, `${id} ${s.id} anterior to the RCA ostium`).toBeGreaterThan(m.rca.pos.z);
            expect(s.ostium.height).toBeGreaterThan(m.sinusTopY);
          }
          checked++;
        }
    expect(checked).toBe(36);
    // the site table itself keeps the order
    expect(GRAFT_OSTIUM["aorta-high"].dHeightMm).toBeGreaterThan(GRAFT_OSTIUM["aorta-mid"].dHeightMm);
    expect(GRAFT_OSTIUM["aorta-mid"].dHeightMm).toBeGreaterThan(GRAFT_OSTIUM["aorta-low"].dHeightMm);
  });

  it("only aortic vein and radial grafts have an aortic ostium; a case without grafts has no graft field in its model or tree", () => {
    const { model } = setup("diag-graft-search");
    // the LIMA is in situ (diag-grafts-arterial places it)
    expect(model.grafts!.map((g) => g.id)).toEqual(["svg-om", "svg-rca"]);
    const lib = scenarioCase("diag-trace-recognition", "1")!;
    const m = buildAnatomy(lib);
    expect(m.grafts).toBeUndefined();
    expect(buildCoronaryTree(m, lib).grafts).toBeUndefined();
    const radial: Graft = { id: "rad-om", conduit: "radial", target: "OM1", position: 0.4, proximalSite: "aorta-high", status: "patent", ringMarker: false };
    expect(buildAnatomy({ ...lib, grafts: [radial] }).grafts!.map((g) => g.id)).toEqual(["rad-om"]);
    expect(graftSiteByName(model, GRAFT_PREFIX + "svg-om")?.id).toBe("svg-om");
  });
});

describe("graft courses in the tree", () => {
  it("each graft runs from its aortic ostium (carried by the root) to its anastomosis on the target vessel, and is not part of the native vessels", () => {
    for (const id of ["diag-graft-search", CMP, MAP, "diag-long-svg-run"]) {
      const { model, tree } = setup(id);
      expect(tree.grafts!.length, id).toBe(model.grafts!.length);
      for (const g of tree.grafts!) {
        expect(tree.vessels.some((v) => v.name === g.name)).toBe(false);
        const s0 = g.samples[0];
        expect(s0.w).toBe(0);
        const p0 = samplePos(tree.heart, s0);
        expect(Math.hypot(p0.x - g.graft.ostium.x, p0.y - g.graft.ostium.y, p0.z - g.graft.ostium.z)).toBeLessThan(0.5);
        const tv = tree.vessels.find((v) => v.name === g.graft.anastomosis.vessel)!;
        expect(tv.lesionId ?? tv.fillId).toBe(g.graft.target);
        const pe = samplePos(tree.heart, g.samples[g.samples.length - 1]);
        const pa = samplePos(tree.heart, tv.samples[g.graft.anastomosis.index]);
        expect(Math.hypot(pe.x - pa.x, pe.y - pa.y, pe.z - pa.z), `${id} ${g.name} meets its target`).toBeLessThan(1.5);
        expect(g.pathMm[g.pathMm.length - 1]).toBeGreaterThan(40);
        expect(g.side).toBe(model.grafts!.find((x) => x.treeName === g.name)!.side);
      }
    }
  });

  it("a diseased graft is narrowed near its ostium; an occluded graft is a short stump", () => {
    const d = setup(CMP, "1", (c) => ({ ...c, grafts: c.grafts!.map((g) => (g.id === "svg-lad" ? { ...g, status: "diseased" } : g)) }));
    const lad = graftOf(d.tree, "svg-lad");
    const minR = Math.min(...lad.radii.slice(0, 20));
    expect(minR / lad.refRadii![0]).toBeCloseTo(1 - GRAFT_LESION.diseased.severity / 100, 1);
    const om = graftOf(d.tree, "svg-om");
    expect(om.occludedFrom).toBeGreaterThan(0);
    expect(om.pathMm[om.occludedFrom]).toBeGreaterThanOrEqual(GRAFT_LESION.stumpMm);
    expect(om.pathMm[om.occludedFrom]).toBeLessThan(GRAFT_LESION.stumpMm + 2);
  });

  it("a native occlusion beyond which a patent graft is anastomosed grows no automatic collaterals; one whose graft is occluded keeps them", () => {
    // RCA CTO with a patent graft to the distal RCA
    expect(setup(CMP).tree.vessels.filter((v) => v.kind === "collateral").length).toBe(0);
    // the same graft occluded: the occluded RCA bed fills through collaterals again
    const occ = setup(CMP, "1", (c) => ({ ...c, grafts: c.grafts!.map((g) => (g.id === "svg-rca" ? { ...g, status: "occluded" } : g)) }));
    expect(occ.tree.vessels.some((v) => v.kind === "collateral")).toBe(true);
  });
});

describe("physics lumens", () => {
  it("every graft is a lumen opening on the aorta; an occluded graft's lumen is only its stump", () => {
    const { tree } = setup(CMP);
    const inputs = coronaryInputsFromRenderTree(tree, { contraction: 0 });
    for (const g of tree.grafts!) {
      const lumen = inputs.find((x) => x.name === g.name)!;
      expect(lumen, g.name).toBeDefined();
      expect(graftLumenId(lumen.name)).toBe(g.graft.id);
      expect(lumen.side).toBe(g.side);
      expect(Math.hypot(lumen.pts[0].x - g.graft.ostium.x, lumen.pts[0].y - g.graft.ostium.y, lumen.pts[0].z - g.graft.ostium.z)).toBeLessThan(0.5);
      if (g.occludedFrom >= 0) expect(lumen.pts.length).toBeLessThanOrEqual(g.occludedFrom + 1);
    }
    // the diseased right graft's lumen carries its stenosis (the rod sees the narrowing a few millimetres in)
    const sick = graftOf(tree, "svg-rca");
    expect(sick.graft.status).toBe("diseased");
    const sl = inputs.find((x) => x.name === sick.name)!;
    expect(Math.min(...sl.radii.slice(0, 20)) / sl.radii[0]).toBeLessThan(1 - 0.8 * (GRAFT_LESION.diseased.severity / 100));
    // the native lumens are unchanged
    expect(inputs.filter((x) => !graftLumenId(x.name)).map((x) => x.name)).toEqual(coronaryInputsFromRenderTree({ ...tree, grafts: undefined }, { contraction: 0 }).map((x) => x.name));
  });
});

describe("graft and native injections", () => {
  it("with a native proximal occlusion and a patent graft, a native injection does not fill the distal territory and a graft injection does", () => {
    // the scenario's right graft is diseased (a damped ostium); here it is the patent graft of the acceptance
    const { c, model, tree } = setup(CMP, "1", (x) => ({ ...x, grafts: x.grafts!.map((g) => (g.id === "svg-rca" ? { ...g, status: "patent" } : g)) }));
    const g = graftOf(tree, "svg-rca");
    const rca = tree.vessels.find((v) => v.name === g.graft.anastomosis.vessel)!;
    expect(rca.occludedFrom).toBeGreaterThan(0);
    expect(rca.occludedFrom).toBeLessThan(g.graft.anastomosis.index);
    // the graft network reaches the native vessel beyond the anastomosis, and back to the occlusion's cap
    const gnet = graftTransportNet(tree, g.name)!;
    const th = gnet.vessels.get(rca.name)!.theta;
    const k = g.graft.anastomosis.index;
    const distal = Math.min(rca.samples.length - 1, k + Math.round((rca.samples.length - 1 - k) * 0.6));
    expect(th[distal]).toBeLessThan(THETA_MAX_S - 1);
    expect(th[rca.occludedFrom - 1]).toBe(THETA_MAX_S);
    // and nothing on the left
    for (const v of tree.vessels) if (v.side === "left") expect(gnet.vessels.has(v.name), v.name).toBe(false);
    // in the image, 4 s after the press: the distal RCA carries iodine on the graft run, none on the native run
    const t = 4;
    const p = worldAt(model, tree, rca.samples[distal], t);
    const native = scene(c, model, tree, bolus("right", t), t).scene;
    const viaGraft = scene(c, model, tree, bolus("right", t, { graft: g.name }), t).scene;
    expect(iodineNear(native, p)).toBeLessThan(1e-4);
    expect(iodineNear(viaGraft, p)).toBeGreaterThan(0.02);
    // the proximal RCA, before the occlusion, fills on the native run and not on the graft run
    const prox = worldAt(model, tree, rca.samples[Math.max(1, Math.floor(rca.occludedFrom / 2))], t);
    expect(iodineNear(native, prox)).toBeGreaterThan(0.02);
    expect(iodineNear(viaGraft, prox)).toBeLessThan(1e-4);
    // the graft itself fills on its own run
    expect(iodineNear(viaGraft, worldAt(model, tree, g.samples[Math.floor(g.samples.length / 2)], t))).toBeGreaterThan(0.02);
  });

  it("with a stenosed native vessel, competitive washout appears beyond the anastomosis on the native run; without the stenosis it does not", () => {
    const { c, model, tree } = setup(CMP);
    const g = graftOf(tree, "svg-lad");
    const native = transportNet(tree, c.lesions);
    const comp = graftCompetition(tree, native, c.lesions).find((x) => x.graft === g.name)!;
    expect(comp.share).toBeGreaterThan(0.3);
    const lad = tree.vessels.find((v) => v.name === g.graft.anastomosis.vessel)!;
    expect(comp.washout.get(lad.name)).toBe(g.graft.anastomosis.index);
    // in the image: the LAD beyond the anastomosis is fainter with the graft than in the same patient without it
    const t = 4;
    const k = g.graft.anastomosis.index;
    const beyond = Math.min(lad.samples.length - 1, k + 8);
    const p = worldAt(model, tree, lad.samples[beyond], t);
    const noGraftCase = { ...c, grafts: c.grafts!.filter((x) => x.id !== "svg-lad") };
    const noGraftModel = buildAnatomy(noGraftCase);
    const noGraftTree = buildCoronaryTree(noGraftModel, noGraftCase);
    const withG = iodineNear(scene(c, model, tree, bolus("left", t), t).scene, p);
    const without = iodineNear(scene(noGraftCase, noGraftModel, noGraftTree, bolus("left", t), t).scene, worldAt(noGraftModel, noGraftTree, noGraftTree.vessels.find((v) => v.name === lad.name)!.samples[beyond], t));
    expect(without).toBeGreaterThan(0.02);
    expect(withG / without).toBeCloseTo(1 - comp.share, 1);
    // the same graft with a mild native lesion: no competitive washout
    const mild = c.lesions.map((l): Lesion => (l.vessel === "LAD" ? { ...l, severity: 30, kind: "mild-irregularity" } : l));
    expect(graftCompetition(tree, transportNet(tree, mild), mild).find((x) => x.graft === g.name)!.share).toBe(0);
    // the graft back-fills from its anastomosis on the native run, and the native column does not reach its aortic end
    expect(comp.backfill!.theta[g.samples.length - 1]).toBeLessThan(THETA_MAX_S);
    expect(comp.backfill!.theta[0]).toBe(THETA_MAX_S);
  });

  it("from a graft to an open native vessel, the retrograde column stops a short way back (competitive flow); an occluded graft fills only its stump", () => {
    const { tree } = setup(CMP);
    const g = graftOf(tree, "svg-lad");
    const net = graftTransportNet(tree, g.name)!;
    const lad = tree.vessels.find((v) => v.name === g.graft.anastomosis.vessel)!;
    const th = net.vessels.get(lad.name)!.theta;
    const k = g.graft.anastomosis.index;
    for (let i = 0; i < k; i++) if (th[i] < THETA_MAX_S) expect(lad.pathMm[k] - lad.pathMm[i]).toBeLessThanOrEqual(GRAFT_FLOW.competitiveRetroMm + 1e-6);
    expect(net.vessels.has("LM")).toBe(false);
    const stump = graftOf(tree, "svg-om");
    const sn = graftTransportNet(tree, stump.name)!;
    expect([...sn.vessels.keys()]).toEqual([stump.name]);
    expect(sn.vessels.get(stump.name)!.theta[stump.occludedFrom]).toBe(THETA_MAX_S);
  });

  it("a diseased graft carries less flow than a patent one and still fills the native bed beyond its anastomosis (the scenario's right graft)", () => {
    const sick = setup(CMP);
    const g = graftOf(sick.tree, "svg-rca");
    expect(g.graft.status).toBe("diseased");
    const well = setup(CMP, "1", (x) => ({ ...x, grafts: x.grafts!.map((y) => (y.id === "svg-rca" ? { ...y, status: "patent" } : y)) }));
    const gw = graftOf(well.tree, "svg-rca");
    const ns = graftTransportNet(sick.tree, g.name)!;
    const nw = graftTransportNet(well.tree, gw.name)!;
    expect(ns.rest.right).toBeCloseTo(GRAFT_FLOW.restMlS * GRAFT_FLOW.diseasedShare, 6);
    expect(nw.rest.right).toBeCloseTo(GRAFT_FLOW.restMlS, 6);
    // contrast reaches the anastomosis later through the diseased graft
    const endS = ns.vessels.get(g.name)!.theta;
    const endW = nw.vessels.get(gw.name)!.theta;
    expect(endS[endS.length - 1]).toBeGreaterThan(endW[endW.length - 1]);
    // and the distal RCA beyond the occlusion still fills from it, on the network and in the image
    const rca = sick.tree.vessels.find((v) => v.name === g.graft.anastomosis.vessel)!;
    const k = g.graft.anastomosis.index;
    const distal = Math.min(rca.samples.length - 1, k + Math.round((rca.samples.length - 1 - k) * 0.6));
    expect(ns.vessels.get(rca.name)!.theta[distal]).toBeLessThan(THETA_MAX_S - 1);
    const t = 5;
    const viaGraft = scene(sick.c, sick.model, sick.tree, bolus("right", t, { graft: g.name }), t).scene;
    expect(iodineNear(viaGraft, worldAt(sick.model, sick.tree, rca.samples[distal], t))).toBeGreaterThan(0.02);
  });

  it("the live flow modifiers act on a graft run: no-reflow beyond the anastomosis slows the distal fill, a flow scale slows it too, and the cache keeps them apart", () => {
    const { tree } = setup("diag-long-svg-run");
    const g = graftOf(tree, "svg-pda");
    const tv = tree.vessels.find((v) => v.name === g.graft.anastomosis.vessel)!;
    const k = g.graft.anastomosis.index;
    const rest = graftTransportNet(tree, g.name)!;
    const nr = graftTransportNet(tree, g.name, { noReflow: { vessel: tv.name, param: tv.param[k], scale: 0.3 } })!;
    const slow = graftTransportNet(tree, g.name, { flowScale: { [tv.name]: 0.5 } })!;
    expect(nr).not.toBe(rest);
    expect(graftTransportNet(tree, g.name)).toBe(rest);
    const distal = Math.min(tv.samples.length - 1, k + Math.round((tv.samples.length - 1 - k) * 0.6));
    const th = (n: typeof rest) => n.vessels.get(tv.name)!.theta[distal];
    expect(th(rest)).toBeLessThan(THETA_MAX_S - 1);
    expect(th(nr)).toBeGreaterThan(th(rest) * 1.5);
    expect(th(slow)).toBeGreaterThan(th(rest) * 1.2);
    // no-reflow beyond the anastomosis limits the graft's own flow and marks the ends beyond it as impaired (the blush);
    // the bed reached retrograde from the anastomosis is not beyond the no-reflow point
    expect(nr.rest.right).toBeLessThan(rest.rest.right);
    expect(nr.impaired.right).toBeGreaterThan(0);
    expect(nr.impaired.right).toBeLessThan(1);
    expect(rest.impaired.right).toBe(0);
  });

  it("a long graft takes longer to fill its distal bed than a native run (the run must be kept going)", () => {
    const { tree } = setup("diag-long-svg-run");
    const g = graftOf(tree, "svg-pda");
    const gnet = graftTransportNet(tree, g.name)!;
    // a native right coronary run in a patient without disease
    const lib = setup("diag-trace-recognition");
    const native = transportNet(lib.tree, lib.c.lesions);
    expect(g.pathMm[g.pathMm.length - 1]).toBeGreaterThan(100);
    expect(gnet.thetaEnd.right).toBeGreaterThan(native.thetaEnd.right);
    // the field: 1.5 s after the press the distal bed is still filling, by 5 s it is full
    const trace = planTrace({ ...standardPlan("right", lumenForFrench(6, false), 3), primed: 1 });
    const at = (t: number) => contrastField({ net: gnet, side: "right", trace, t, phase: 0, rr: 60 / HR }).at(gnet.thetaEnd.right);
    expect(at(1.5)).toBeLessThan(at(5));
  });

  it("on an aortogram an occluded graft shows as its stump; a ring marker is metal on every frame", () => {
    const { c, model, tree } = setup(CMP);
    const stump = graftOf(tree, "svg-om");
    const t = 3;
    const aorto: BolusView = { ...bolus("left", t), side: null, plume: "root", filled: [], aortogram: true };
    const res = scene(c, model, tree, aorto, t);
    // the stump fills with the root: at least half the opacified aorta's iodine per unit volume, and nothing beyond it
    const full = MU.iodinePerMg * IODINE_MG_PER_ML;
    expect(res.lvGram!.aorta).toBeGreaterThan(0);
    expect(iodineNear(res.scene, worldAt(model, tree, stump.samples[2], t), 1.5)).toBeGreaterThan(0.5 * full * res.lvGram!.aorta);
    expect(iodineNear(res.scene, worldAt(model, tree, stump.samples[stump.occludedFrom + 15], t), 1)).toBeLessThan(1e-6);
    // ring markers (svg-lad and svg-om carry one): steel rings in the metal channel without contrast
    const plain = scene(c, model, tree, null, t).scene;
    const rings = plain.tubes.filter((tb) => !Array.isArray(tb.mu[0]) && (tb.mu as number[])[2] > 0.5 && tb.pts.length === 25);
    expect(rings.length).toBe(c.grafts!.filter((g) => g.ringMarker).length);
  });
});

describe("the live lab's graft bolus and hardware (FluoroView)", () => {
  it("an injection with the tip in a graft lumen is a graft injection; a pigtail root injection in a graft case is an aortogram; other cases are untouched", () => {
    const b = { plume: "none" as const, lv: false };
    expect(graftBolus(b, { graftAtTip: "GRAFT:svg-rca", catheterId: "JR4", hasGrafts: true }).graft).toBe("GRAFT:svg-rca");
    expect(graftBolus(b, { graftAtTip: "RCA", catheterId: "JR4", hasGrafts: true }).graft).toBeUndefined();
    expect(graftBolus({ plume: "root" as const, lv: false }, { graftAtTip: null, catheterId: "PIG", hasGrafts: true }).aortogram).toBe(true);
    expect(graftBolus({ plume: "root" as const, lv: false }, { graftAtTip: null, catheterId: "PIG", hasGrafts: false })).toEqual({ plume: "root", lv: false });
    const c = scenarioCase("diag-graft-search", "1")!;
    const hw = graftHardware(c)!;
    expect(hw.sternalWires).toBeGreaterThanOrEqual(5);
    expect(hw.sternalWires).toBeLessThanOrEqual(7);
    expect(hw.graftClips).toBe(true);
    expect(graftHardware(scenarioCase("diag-trace-recognition", "1")!)).toBeNull();
  });
});

describe("graft catheters", () => {
  it("the left and right coronary bypass shapes are in the catalogue and the rod physics", () => {
    for (const id of ["MP", "AL1", "LCB", "RCB"]) {
      expect(CATHETERS.some((x) => x.id === id), id).toBe(true);
      expect(catheterSpec(id).arcs.length, id).toBeGreaterThan(1);
    }
  });
});

describe("the graft search (graft-not-found)", () => {
  it("repeated failed attempts near the LAD graft level raise graft-not-found for that graft once; engaging it first prevents it", () => {
    const { model } = setup(CMP);
    const lad = model.grafts!.find((g) => g.id === "svg-lad")!;
    const o = lad.ostium.pos;
    const near: Vec3 = { x: o.x * 0.8, y: o.y + 1, z: o.z * 0.8 };
    const away: Vec3 = { x: o.x * 0.8, y: o.y - 15, z: o.z * 0.8 };
    const run = (engageAt: number | null) => {
      const s = new GraftSearch(model.grafts!);
      const fired: string[] = [];
      for (let a = 0; a < GRAFT_SEARCH.attempts + 1; a++) {
        for (let k = 0; k < 20; k++) fired.push(...s.step(0.1, near, engageAt !== null && a >= engageAt ? lad.treeName : null).map((x) => x.id));
        for (let k = 0; k < 30; k++) fired.push(...s.step(0.1, away, null).map((x) => x.id));
      }
      return { fired, s };
    };
    const failed = run(null);
    expect(failed.fired).toEqual(["svg-lad"]);
    expect(failed.s.progress(lad.treeName)!.attempts).toBeGreaterThanOrEqual(GRAFT_SEARCH.attempts);
    expect(run(1).fired).toEqual([]);
    // time spent at the level counts too
    const s = new GraftSearch(model.grafts!);
    const out: string[] = [];
    for (let k = 0; k < GRAFT_SEARCH.dwellS * 10 + 5; k++) out.push(...s.step(0.1, near, null).map((x) => x.id));
    expect(out).toEqual(["svg-lad"]);
  });

  it("the levels' bands do not overlap: each height on the anterior wall is at one graft's level at most, the graft nearest it in height", () => {
    for (const id of [CMP, MAP]) {
      const { model } = setup(id);
      const sites = model.grafts!;
      const lad = sites.find((x) => level(x.graft.target) === "lad")!;
      const o = lad.ostium.pos;
      const r = Math.hypot(o.x, o.z) * 0.8;
      const az = Math.atan2(o.z, o.x);
      const lo = Math.min(...sites.map((x) => x.ostium.pos.y)) - 6;
      const hi = Math.max(...sites.map((x) => x.ostium.pos.y)) + 6;
      for (let y = lo; y <= hi; y += 0.25) {
        const s = new GraftSearch(sites);
        s.step(1, { x: r * Math.cos(az), y, z: r * Math.sin(az) }, null);
        const at = sites.filter((x) => s.progress(x.treeName)!.dwellS > 0);
        expect(at.length, `${id} at ${y.toFixed(2)}`).toBeLessThanOrEqual(1);
        if (at.length) {
          const facing = sites.filter((x) => x.ostium.pos.x * Math.cos(az) + x.ostium.pos.z * Math.sin(az) > 0);
          const dy = (x: (typeof sites)[number]) => Math.abs(x.ostium.pos.y - y);
          expect(dy(at[0])).toBeLessThanOrEqual(GRAFT_SEARCH.levelMm + 1e-9);
          expect(dy(at[0])).toBeLessThanOrEqual(Math.min(...facing.map(dy)) + 1e-9);
        }
      }
      // sweeps up and down within the LAD graft's band count only at the LAD graft
      const s = new GraftSearch(sites);
      const fired: string[] = [];
      const others = sites.filter((x) => x !== lad).map((x) => Math.abs(x.ostium.pos.y - o.y));
      const half = Math.min(GRAFT_SEARCH.levelMm, Math.min(...others) / 2) - 0.25;
      for (let a = 0; a < GRAFT_SEARCH.attempts + 1; a++) {
        for (let k = 0; k < 20; k++) fired.push(...s.step(0.1, { x: o.x * 0.8, y: o.y + half * (k < 10 ? 1 : -1), z: o.z * 0.8 }, null).map((x) => x.id));
        // away from every level: the catheter turned to the back of the aorta
        for (let k = 0; k < 30; k++) fired.push(...s.step(0.1, { x: -o.x * 0.8, y: o.y, z: -o.z * 0.8 }, null).map((x) => x.id));
      }
      expect(fired, id).toEqual([lad.id]);
      for (const x of sites) if (x !== lad) expect(s.progress(x.treeName)!.attempts, `${id} ${x.id}`).toBe(0);
    }
  });
});

describe("the package's facts file", () => {
  it("every constant docs/realism/facts/pkg-diag-grafts-svg.md lists is named in the file it gives, with the values in the code", () => {
    const repo = join(__dirname, "..", "..", "..");
    const md = readFileSync(join(repo, "docs", "realism", "facts", "pkg-diag-grafts-svg.md"), "utf8");
    const rows = md.split("\n").filter((l) => /^\| `/.test(l));
    expect(rows.length).toBeGreaterThan(20);
    for (const row of rows) {
      const [name, file] = row.split("|").slice(1, 3).map((x) => x.trim());
      const src = readFileSync(join(repo, file), "utf8");
      for (const n of [...name.matchAll(/`([\w.]+)`/g)].map((m) => m[1].split(".").pop()!)) expect(src, `${n} in ${file}`).toMatch(new RegExp(`\\b${n}\\b`));
    }
    const cell = (n: string) => rows.find((l) => l.startsWith(`| \`${n}\``))!.split("|")[3];
    expect(cell("GRAFT_SEARCH.levelMm")).toContain(String(GRAFT_SEARCH.levelMm));
    expect(cell("GRAFT_FLOW.restMlS")).toContain(String(GRAFT_FLOW.restMlS));
    expect(cell("GRAFT_FLOW.diseasedShare")).toContain(String(GRAFT_FLOW.diseasedShare));
    expect(cell("GRAFT_LESION.diseased")).toContain(`severity ${GRAFT_LESION.diseased.severity}`);
  });
});
