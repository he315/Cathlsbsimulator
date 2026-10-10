// diag-injection-run-quality in the image: the classifier's vessel at the tip limits what a push fills (a tip in the
// LAD of a short left main fills the LAD alone), and, with the lab's opt-in (BolusView.rootFill), a non-selective root
// injection or an aortogram fills each ostium's arteries by its share of the injection (contrastTransport
// rootInjectionShares), so a sinus injection finds a circumflex arising from the right sinus.
//   npx vitest run src/render/xray/runFill.test.ts
import { describe, expect, it } from "vitest";
import type { AnatomyCase, AnatomyVariant, CArm, VesselId } from "../../types";
import { buildAnatomy, type AnatomyModel } from "../../simulation/anatomy";
import { scenarioCase } from "../../simulation/caseGenerator";
import { catheterPath } from "../../ui/sim/helpers";
import { catheterById } from "../../data/catheters";
import { buildCoronaryTree, type CoronaryTree } from "./coronaryTree";
import { buildXrayScene, ostialRootOf, vesselSubtree, type BolusView, type SceneInput } from "./sceneBuilder";
import { ROOT_INJECTION } from "./contrastTransport";
import { isShortLeftMain, shortLmBranch } from "../../simulation/engagement";

const LAO30: CArm = { laoRao: 30, cranialCaudal: 0 };

function sceneInput(model: AnatomyModel, c: AnatomyCase, tree: CoronaryTree, tipAt: { x: number; y: number; z: number }, bolus: BolusView, over: Partial<SceneInput> = {}): SceneInput {
  const os = model.lm;
  const root = catheterPath(model, { pos: tipAt, dir: os.dir, height: tipAt.y, az: os.az, radius: model.sinusRadius, cram: 0, gap: 0 }, catheterById("JL4"));
  return { model, caseData: c, tree, catheterRoot: root, french: 6, bolus, t: 0, cArm: LAO30, mode: "cine", frame: 1, field: 200, breathHold: 0.7, ...over };
}

const fillOf = (tree: CoronaryTree, side: "left" | "right") => [...new Set(tree.vessels.filter((v) => v.side === side).map((v) => v.fillId))] as VesselId[];

describe("the classifier's vessel at the tip", () => {
  it("with classifier vessel LAD in a short-LM case the filled set excludes LCx; without it the left injection fills the circumflex too", () => {
    const c = scenarioCase("diag-short-lm-superselective", "1")!;
    expect(c.variants).toContain("short-lm");
    const model = buildAnatomy(c);
    const tree = buildCoronaryTree(model, c);
    // the usual JL4 seated in this short left main enters the LAD (the session's classifier rule)
    expect(isShortLeftMain(model)).toBe(true);
    expect(shortLmBranch(model, catheterById("JL4")!)).toBe("LAD");
    const bolus: BolusView = { filled: fillOf(tree, "left"), plume: "none", side: "left", t: 2.2, injectDur: 2.2, peak: 1 };
    const all = buildXrayScene(sceneInput(model, c, tree, model.lm.pos, bolus)).contrast!.vessels;
    const lad = buildXrayScene(sceneInput(model, c, tree, model.lm.pos, { ...bolus, vessel: "LAD" })).contrast!.vessels;
    const lcxSystem = [...vesselSubtree(tree, "LCx")!];
    expect(lcxSystem.length).toBeGreaterThan(1);
    expect(all).toContain("LAD");
    expect(all).toContain("LCx");
    expect(lad).toContain("LAD");
    for (const n of lcxSystem) expect(lad, n).not.toContain(n);
    expect(lad).not.toContain("LM");
    // everything the LAD run fills descends from the LAD
    const ladSystem = vesselSubtree(tree, "LAD")!;
    for (const n of lad) expect(ladSystem.has(n), n).toBe(true);
    // a vessel the tree does not have leaves the side's fill as it was
    expect(buildXrayScene(sceneInput(model, c, tree, model.lm.pos, { ...bolus, vessel: "NO-SUCH" })).contrast!.vessels).toEqual(all);
  });
});

describe("a non-selective root injection fills the coronaries by its share at each ostium", () => {
  const mk = (id: string, variants: AnatomyVariant[]): AnatomyCase => ({
    id,
    name: id,
    difficulty: 1,
    accessRoute: "femoral",
    rootSize: "normal",
    rootRotationDeg: 0,
    aortaTiltDeg: 0,
    dominance: "right",
    variants,
    pathology: "none",
    lesions: [],
    recommendedCatheters: [],
    acceptableCatheters: [],
    requiredViews: [],
    traps: [],
    objectives: [],
    teachingSummary: "",
  });

  it("an anomalous circumflex from the right sinus fills on a right sinus injection, more than the left main; an aortogram reaches every ostium alike", () => {
    const c = mk("rq-anomalous-lcx", ["anomalous-lcx-right-sinus"]);
    const model = buildAnatomy(c);
    const tree = buildCoronaryTree(model, c);
    const roots = ostialRootOf(tree);
    // the circumflex has its own ostium (it is its own root) on the right
    const lcx = tree.vessels.find((v) => v.name === "LCx")!;
    expect(lcx.side).toBe("right");
    expect(roots.get("LCx")).toBe("LCx");
    const tip = { x: model.rca.pos.x * 0.8, y: model.rca.pos.y, z: model.rca.pos.z * 0.8 };
    const root: BolusView = { filled: [], plume: "root", side: null, t: 2.2, injectDur: 2.2, peak: 0.3, rootFill: true };
    // without the lab's opt-in the scene keeps its default: the sinus cloud only
    const plain = buildXrayScene(sceneInput(model, c, tree, tip, { ...root, rootFill: undefined })).contrast!;
    expect(plain.vessels).toEqual([]);
    expect(plain.rootShares).toBeUndefined();
    const res = buildXrayScene(sceneInput(model, c, tree, tip, root)).contrast!;
    expect(res.rootShares).toBeDefined();
    const sh = res.rootShares!;
    expect(sh.LCx).toBeGreaterThan(0);
    expect(sh.RCA).toBeGreaterThan(0);
    expect(sh.LCx).toBeGreaterThan(sh.LM ?? 0);
    expect(Math.max(...Object.values(sh))).toBeLessThanOrEqual(ROOT_INJECTION.sinusMax + 1e-9);
    expect(res.vessels).toContain("LCx");
    expect(res.vessels).toContain("RCA");
    // an aortogram reaches each ostium with the same share
    const ao = buildXrayScene(sceneInput(model, c, tree, { x: 0, y: model.sinusTopY + 10, z: 0 }, { ...root, aortogram: true })).contrast!;
    expect(new Set(Object.values(ao.rootShares!))).toEqual(new Set([ROOT_INJECTION.aortogram]));
    expect(ao.vessels).toEqual(expect.arrayContaining(["LCx", "RCA", "LM"]));
  });

  it("a selective injection does not take root shares and fills its own side as before", () => {
    const c = mk("rq-usual", []);
    const model = buildAnatomy(c);
    const tree = buildCoronaryTree(model, c);
    const sel: BolusView = { filled: fillOf(tree, "right"), plume: "none", side: "right", t: 2.2, injectDur: 2.2, peak: 1, rootFill: true };
    const res = buildXrayScene(sceneInput(model, c, tree, model.rca.pos, sel)).contrast!;
    expect(res.rootShares).toBeUndefined();
    expect(res.vessels).toContain("RCA");
    expect(res.vessels.some((n) => tree.vessels.find((v) => v.name === n)!.side === "left")).toBe(false);
  });
});
