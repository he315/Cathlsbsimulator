// pci-equipment-tray: the balloon's filling as render/balloonFill.ts draws it. It follows core's inflated
// balloon exactly (the same centre line and radii), so the balloon carries the prep station's mixture: a
// saline or unprepared balloon nets no iodine, 1:2 is fainter than 1:1, residual air leaves a lucent gap
// at the proximal end, and a device the assisted path loaded draws nothing here (the baseline scenes are
// unchanged).
//   npx vitest run src/ui/pci/render/balloonFill.test.ts
import { describe, expect, it } from "vitest";
import { samplePos } from "../../../render/xray/coronaryTree";
import { MU, type TubeSpec } from "../../../render/xray/thorax";
import { inflate, loadDevice, moveDevice, type PciState } from "../../../simulation/angioPci";
import { advanceDevice, applySuction, backloadDevice, checkLabel, connectIndeflator, fillPrepSyringe, requestDevice, setValve } from "../../../simulation/pci/actions/devices";
import { setup, start, wireToTarget } from "../../../simulation/pci/testSetup";
import type { BalloonMixture } from "../../../simulation/pci/state";
import { PCI_RENDER_MODULES, type PciDrawContext } from "../pciDevicesRender";
import { draw as coreDraw } from "./core";
import { CORE_BALLOON_MG_PER_ML, draw, inflatedRadii } from "./balloonFill";

const su = setup("lad-focal");
const x: PciDrawContext = { s: su.s, tree: su.tree, place: (sm) => samplePos(su.tree.heart, sm), ctx: { bolusT: null, injecting: false }, atm: 0 };
const iodineOf = (t: TubeSpec) => (t.mu as number[])[1];

/** A balloon taken through the tray (mixture, suction cycles), in the lesion and inflated to 10 atm. */
function inflated(mixture: BalloonMixture | null, cycles = 3): PciState {
  let st = wireToTarget(su, start(su), 40);
  st = checkLabel(requestDevice(st, "sc", 2.5, 12));
  if (mixture) {
    st = fillPrepSyringe(st, mixture);
    for (let i = 0; i < cycles; i++) st = applySuction(st);
    st = connectIndeflator(st);
  }
  st = advanceDevice(su.s, su.g, setValve(backloadDevice(st), true), 1);
  st = moveDevice(st, su.g.lesion.centreMm - st.device!.centreMm);
  return inflate(su.s, su.g, st, 10);
}

/** core's balloon fill tube (its iodine channel at 175 mg/mL). */
const coreFill = (st: PciState) => coreDraw(st, su.g, x).tubes.find((t) => Math.abs(iodineOf(t) - MU.iodinePerMg * CORE_BALLOON_MG_PER_ML) < 1e-12)!;

describe("render/balloonFill.ts (pci-equipment-tray)", () => {
  it("is a registered render module drawn after core, and draws nothing for the assisted path's devices", () => {
    const ids = PCI_RENDER_MODULES.map((m) => m.id);
    expect(ids).toContain("balloon-fill");
    expect(ids.indexOf("balloon-fill")).toBeGreaterThan(ids.indexOf("core"));
    let st = wireToTarget(su, start(su), 40);
    st = loadDevice(st, "balloon", "semi-compliant", 2.5, 12);
    st = moveDevice(st, su.g.lesion.centreMm - st.device!.centreMm);
    expect(draw(st, su.g, x).tubes).toEqual([]);
    expect(draw(inflate(su.s, su.g, st, 10), su.g, x).tubes).toEqual([]);
  });

  it("follows core's inflated balloon exactly: the same radii, so the correction nets the mixture's iodine", () => {
    const st = inflated("1:2");
    expect(st.device!.inflated).toBe(true);
    const core = coreFill(st);
    const prof = inflatedRadii(st, su.g)!;
    expect(prof.r).toEqual(core.r);
    const mine = draw(st, su.g, x).tubes;
    expect(mine).toHaveLength(1);
    expect(mine[0].r).toEqual(core.r);
    expect(mine[0].pts).toEqual(core.pts);
    expect(iodineOf(core) + iodineOf(mine[0])).toBeCloseTo(MU.iodinePerMg * (350 / 3), 9);
  });

  it("a 1:1 balloon is drawn as core draws it; saline and an unprepared balloon net no iodine", () => {
    expect(draw(inflated("1:1"), su.g, x).tubes).toEqual([]);
    for (const st of [inflated("saline"), inflated(null)]) {
      const tubes = draw(st, su.g, x).tubes;
      expect(tubes.length).toBeGreaterThan(0);
      expect(iodineOf(coreFill(st)) + iodineOf(tubes[0])).toBeCloseTo(0, 12);
    }
  });

  it("residual air leaves a lucent gap at the proximal end", () => {
    const st = inflated("1:1", 1);
    expect(st.device!.airFraction).toBeCloseTo(0.25, 9);
    const tubes = draw(st, su.g, x).tubes;
    expect(tubes).toHaveLength(1);
    const gap = tubes[0];
    const prof = inflatedRadii(st, su.g)!;
    expect(gap.pts.length).toBeGreaterThanOrEqual(2);
    expect(gap.pts.length).toBeLessThan(prof.sm.length);
    // the gap starts at the balloon's proximal end and cancels core's 1:1 fill there
    expect(gap.pts[0]).toEqual(coreFill(st).pts[0]);
    expect(iodineOf(gap) + iodineOf(coreFill(st))).toBeCloseTo(0, 12);
  });
});
