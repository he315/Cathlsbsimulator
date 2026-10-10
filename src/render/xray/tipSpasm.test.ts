// diag-spasm-states: catheter-tip spasm in the image (coronaryTree.ts tipSpasmRadii, sceneBuilder.ts
// SceneInput.spasm) and what the live view passes (FluoroView.tsx tipSpasmView).
//   npx vitest run src/render/xray/tipSpasm.test.ts
import { describe, expect, it } from "vitest";
import type { CArm } from "../../types";
import { buildAnatomy, type AnatomyModel } from "../../simulation/anatomy";
import { scenarioCase } from "../../simulation/caseGenerator";
import { catheterPath } from "../../ui/sim/helpers";
import { catheterById } from "../../data/catheters";
import { MP_SPASM_VIEW, tipSpasmView } from "../../ui/sim/FluoroView";
import { MP_TIP_SPASM_RENDER, buildCoronaryTree, renderPath, tipSpasmRadii, type CoronaryTree, type TreeVessel } from "./coronaryTree";
import { buildXrayScene, type SceneInput } from "./sceneBuilder";
import type { TubeSpec } from "./thorax";

const LAO30: CArm = { laoRao: 30, cranialCaudal: 0 };

function setup(id = "diag-catheter-tip-spasm-rca") {
  const c = scenarioCase(id, "1")!;
  const model = buildAnatomy(c);
  const tree = buildCoronaryTree(model, c);
  return { c, model, tree };
}

function sceneInput(model: AnatomyModel, c: ReturnType<typeof setup>["c"], tree: CoronaryTree, over: Partial<SceneInput> = {}): SceneInput {
  const os = model.rca;
  const root = catheterPath(model, { pos: os.pos, dir: os.dir, height: os.height, az: os.az, radius: model.sinusRadius, cram: 0, gap: 0 }, catheterById("JR4"));
  const filled = [...new Set(tree.vessels.filter((v) => v.side === "right").map((v) => v.fillId))];
  return {
    model,
    caseData: c,
    tree,
    catheterRoot: root,
    french: 6,
    bolus: { filled, plume: "none", side: "right", t: 1.6, injectDur: 2, peak: 1 },
    t: 0,
    cArm: LAO30,
    mode: "cine",
    frame: 1,
    field: 200,
    breathHold: 0.7,
    ...over,
  };
}

const rcaTrunk = (tree: CoronaryTree) => tree.vessels.find((v) => v.name === "RCA" && !v.parent)!;
const tubeOf = (tubes: TubeSpec[], v: TreeVessel) => tubes.find((t) => Array.isArray(t.mu[0]) && t.r.length === renderPath(v).samples.length)!;

describe("tipSpasmRadii: a smooth concentric narrowing round the catheter tip", () => {
  const radii = Array.from({ length: 41 }, () => 1.5);
  const path = Array.from({ length: 41 }, (_, i) => i * 0.5);

  it("is the identity with no spasm", () => {
    expect(tipSpasmRadii(radii, path, 4, 0)).toBe(radii);
  });

  it("narrows most at the centre by the engine's severity, tapers to nothing at halfLengthMm and leaves the rest", () => {
    const out = tipSpasmRadii(radii, path, 6, 0.3);
    const at = path.indexOf(6);
    expect(out[at]).toBeCloseTo(1.5 * (1 - MP_TIP_SPASM_RENDER.gain * 0.3), 6);
    for (let i = 0; i < path.length; i++) {
      const d = Math.abs(path[i] - 6);
      if (d >= MP_TIP_SPASM_RENDER.halfLengthMm) expect(out[i]).toBe(1.5);
      else expect(out[i]).toBeLessThan(1.5);
      if (i > 0 && path[i] <= 6) expect(out[i]).toBeLessThanOrEqual(out[i - 1] + 1e-12);
    }
    // never closed: at the strongest spasm the lumen keeps minShare of its radius
    expect(Math.min(...tipSpasmRadii(radii, path, 6, 1))).toBeCloseTo(1.5 * MP_TIP_SPASM_RENDER.minShare, 6);
  });
});

describe("SceneInput.spasm draws the engine's catheter-tip spasm", () => {
  it("narrows the RCA round the tip on a right injection; nothing changes without it or on the other side", () => {
    const { c, model, tree } = setup();
    const rca = rcaTrunk(tree);
    const plain = buildXrayScene(sceneInput(model, c, tree));
    const none = buildXrayScene(sceneInput(model, c, tree, { spasm: { side: "right", atMm: 4, severity: 0 } }));
    const left = buildXrayScene(sceneInput(model, c, tree, { spasm: { side: "left", atMm: 4, severity: 0.5 } }));
    const sp = buildXrayScene(sceneInput(model, c, tree, { spasm: { side: "right", atMm: 4, severity: 0.4 } }));
    const r0 = tubeOf(plain.scene.tubes, rca).r;
    expect(tubeOf(none.scene.tubes, rca).r).toEqual(r0);
    expect(tubeOf(left.scene.tubes, rca).r).toEqual(r0);
    const r1 = tubeOf(sp.scene.tubes, rca).r;
    const pm = renderPath(rca).pathMm;
    let deepest = 1;
    for (let i = 0; i < r0.length; i++) {
      const share = r1[i] / r0[i];
      if (Math.abs(pm[i] - 4) >= MP_TIP_SPASM_RENDER.halfLengthMm) expect(share).toBeCloseTo(1, 9);
      deepest = Math.min(deepest, share);
    }
    // a visible narrowing: more than a third of the diameter at its centre
    expect(1 - deepest).toBeGreaterThan(0.35);
  });
});

describe("tipSpasmView: what the live image passes from the engine (FluoroView)", () => {
  it("centres the spasm just beyond the catheter tip, keeps it there after withdrawal, and draws nothing without one", () => {
    const last = { left: null, right: null } as { left: number | null; right: number | null };
    expect(tipSpasmView({ left: 0, right: 0 }, { location: "aorta" }, null, last)).toBeNull();
    const engaged = tipSpasmView({ left: 0, right: 0.3 }, { location: "ostium", side: "right" }, 5, last)!;
    expect(engaged).toEqual({ side: "right", atMm: 5 + MP_SPASM_VIEW.tipBeyondMm, severity: 0.3 });
    // withdrawn to the aorta: the spasm stays where the tip was until it relaxes
    const out = tipSpasmView({ left: 0, right: 0.2 }, { location: "aorta" }, null, last)!;
    expect(out.atMm).toBe(5 + MP_SPASM_VIEW.tipBeyondMm);
    // a tip just inside the ostium: at least ostialMm in
    expect(tipSpasmView({ left: 0.2, right: 0 }, { location: "ostium", side: "left" }, 0, last)!.atMm).toBe(MP_SPASM_VIEW.ostialMm);
    expect(tipSpasmView({ left: 0.005, right: 0 }, { location: "aorta" }, null, last)).toBeNull();
  });
});
