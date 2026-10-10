// pci-intravascular-imaging: the imaging catheter as render/imagingCatheter.ts draws it (rest geometry).
// It cancels core's balloon-like drawing of the device exactly, draws nothing without an imaging catheter
// (so the baseline scenes are unchanged), and its transducer moves back along the vessel during the
// motorised pullback while a rotational catheter's sheath tip stays where the run started.
//   npx vitest run src/ui/pci/render/imagingCatheter.test.ts
import { describe, expect, it } from "vitest";
import { samplePos } from "../../../render/xray/coronaryTree";
import { deflate, inflate, loadDevice, moveDevice, removeDevice, stepPci } from "../../../simulation/angioPci";
import { advanceImaging, loadImaging, setImagingSettings, startImagingRun } from "../../../simulation/pci/actions/imaging";
import { sampleAtMm } from "../../../simulation/pci/geometry";
import { setup, start, wireToTarget } from "../../../simulation/pci/testSetup";
import { PCI_RENDER_MODULES, pciDevices, type PciDrawContext } from "../pciDevicesRender";
import { draw as coreDraw } from "./core";
import { TRANSDUCER_MU, MARKER_MU, draw, imagingCatheterLayout } from "./imagingCatheter";
import type { Vec3 } from "../../../types";

const su = setup("lad-focal");
const x: PciDrawContext = { s: su.s, tree: su.tree, place: (sm) => samplePos(su.tree.heart, sm), ctx: { bolusT: null, injecting: false }, atm: 0 };
const metal = (mu: unknown) => (Array.isArray(mu) ? (mu as number[])[2] : 0);
const centroid = (pts: Vec3[]): Vec3 => ({ x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length, z: pts.reduce((s, p) => s + p.z, 0) / pts.length });
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

function crossed() {
  let st = wireToTarget(su, start(su), 40);
  st = loadDevice(st, "balloon", "semi-compliant", 2.5, 12);
  st = moveDevice(st, su.g.lesion.centreMm - st.device!.centreMm);
  st = removeDevice(deflate(inflate(su.s, su.g, st, 10)));
  st = loadImaging(st, "ivus", { assisted: true });
  for (let i = 0; i < 80 && st.device!.centreMm < su.g.lesion.endMm + 15; i++) st = advanceImaging(su.s, su.g, st, 2);
  return st;
}

describe("render/imagingCatheter.ts (pci-intravascular-imaging)", () => {
  it("is a registered render module drawn after core, and draws nothing without an imaging catheter", () => {
    const ids = PCI_RENDER_MODULES.map((m) => m.id);
    expect(ids).toContain("imaging-catheter");
    expect(ids.indexOf("imaging-catheter")).toBeGreaterThan(ids.indexOf("core"));
    const wire = wireToTarget(su, start(su), 20);
    expect(draw(wire, su.g, x).tubes).toEqual([]);
    const balloon = moveDevice(loadDevice(wire, "balloon", "semi-compliant", 2.5, 12), 40);
    expect(draw(balloon, su.g, x).tubes).toEqual([]);
  });

  it("cancels core's device drawing exactly and draws the transducer on the catheter", () => {
    const st = crossed();
    expect(st.device!.centreMm).toBeGreaterThan(su.g.lesion.endMm);
    const mine = draw(st, su.g, x).tubes;
    const core = coreDraw(st, su.g, x).tubes.filter((t) => {
      const mu = t.mu as number[];
      return (mu[0] === 0.02 && mu[2] === 0) || mu[2] === 3.2;
    });
    const neg = mine.filter((t) => (t.mu as number[]).some((m) => m < 0));
    expect(neg.length).toBe(core.length);
    neg.forEach((t, i) => {
      expect(t.pts).toEqual(core[i].pts);
      expect((t.mu as number[]).map((m) => -m)).toEqual(core[i].mu);
    });
    expect(mine.filter((t) => metal(t.mu) === TRANSDUCER_MU)).toHaveLength(1);
    expect(mine.filter((t) => metal(t.mu) === MARKER_MU).length).toBeGreaterThan(0);
    // the composed drawing keeps it
    expect(pciDevices(su.s, st, su.g, su.tree, x.place, x.ctx, 0).tubes.some((t) => metal(t.mu) === TRANSDUCER_MU)).toBe(true);
  });

  it("the transducer moves back along the vessel during the motorised pullback; the rotational sheath tip stays", () => {
    let st = startImagingRun(su.s, su.g, setImagingSettings(crossed(), { speedMmS: 1 }));
    const transducer = (s: typeof st) => centroid(draw(s, su.g, x).tubes.find((t) => metal(t.mu) === TRANSDUCER_MU)!.pts);
    const lay0 = imagingCatheterLayout(st)!;
    const p0 = transducer(st);
    for (let i = 0; i < 40; i++) st = stepPci(su.s, su.g, st, 0.25);
    const lay1 = imagingCatheterLayout(st)!;
    expect(lay1.elementMm).toBeCloseTo(lay0.elementMm - 10, 6);
    expect(lay1.tipMm).toBeCloseTo(lay0.tipMm, 6);
    const p1 = transducer(st);
    // it moved by about the 10 mm pulled back (the vessel curves, so the chord is a little shorter)
    expect(dist(p0, p1)).toBeGreaterThan(6);
    const expected = samplePos(su.tree.heart, sampleAtMm(su.g, st.route, lay1.elementMm)!.s);
    expect(dist(p1, expected)).toBeLessThan(1.5);
  });
});
