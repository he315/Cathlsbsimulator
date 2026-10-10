// pci-guide-engagement: render/guide.ts adds the part of a deep-seated guide inside the coronary and nothing
// else (a guide at the ostium or out of it leaves the image unchanged); guideCatheterRoot gives the course
// of a guide out of the ostium from the analytic model's tip.
//   npx vitest run src/ui/pci/render/guide.test.ts
import { describe, expect, it } from "vitest";
import { PCI_RENDER_MODULES, type PciDrawContext } from "../pciDevicesRender";
import { samplePos } from "../../../render/xray/coronaryTree";
import { setup, start } from "../../../simulation/pci/testSetup";
import { initialGuide, seat } from "../../../simulation/pci/guide";
import { draw, guideCatheterNodes, guideCatheterRoot, guideInjectionSeat } from "./guide";
import type { Vec3 } from "../../../types";

const su = setup("lad-focal");
const ctxOf = (): PciDrawContext => ({ s: su.s, tree: su.tree, place: (sm) => samplePos(su.tree.heart, sm), ctx: { bolusT: null, injecting: false }, atm: 0 });
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe("render/guide.ts (pci-guide-engagement)", () => {
  it("is a registered render module drawn after core", () => {
    const ids = PCI_RENDER_MODULES.map((m) => m.id);
    expect(ids).toContain("guide");
    expect(ids.indexOf("guide")).toBeGreaterThan(ids.indexOf("core"));
  });

  it("draws nothing for a guide at the ostium or out of it, and the intravascular part of a deep seat", () => {
    const st = start(su, { guide: "EBU3.5" });
    expect(draw(st, su.g, ctxOf()).tubes).toEqual([]);
    expect(draw({ ...st, guide: { ...st.guide, engaged: false, depthMm: -15 } }, su.g, ctxOf()).tubes).toEqual([]);
    const deep = { ...st, guide: seat(st.guide, 5) };
    expect(deep.guide.depthMm).toBeGreaterThan(3);
    const tubes = draw(deep, su.g, ctxOf()).tubes;
    expect(tubes).toHaveLength(2);
    // outer wall then an empty lumen, along the left main for the guide's depth
    expect(tubes[0].r[0]).toBeCloseTo(1, 6);
    expect((tubes[1].mu as number[])[2]).toBeLessThan(0);
    const pts = tubes[0].pts;
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += dist(pts[i - 1], pts[i]);
    expect(len).toBeGreaterThan(deep.guide.depthMm * 0.8);
    expect(len).toBeLessThan(deep.guide.depthMm * 1.6);
  });

  it("draws an 8 Fr guide at its own outer diameter, and re-samples only when the depth or size changes", () => {
    const st = start(su, { guide: "EBU3.5" });
    const deep = { ...st, guide: { ...seat(st.guide, 5), french: 8 as const } };
    const x = ctxOf();
    const a = draw(deep, su.g, x).tubes;
    expect(a[0].r[0]).toBeCloseTo(2.67 / 2, 6);
    // the same seat and placement: the same points, no new samples
    const b = draw(deep, su.g, x).tubes;
    expect(b[0].pts).toBe(a[0].pts);
    // a new placement re-places the same samples; a deeper seat draws further
    const c = draw(deep, su.g, ctxOf()).tubes;
    expect(c[0].pts).not.toBe(a[0].pts);
    expect(c[0].pts).toEqual(a[0].pts);
    const deeper = draw({ ...deep, guide: { ...deep.guide, depthMm: deep.guide.depthMm + 1 } }, su.g, x).tubes;
    expect(deeper[0].pts.length).toBeGreaterThan(a[0].pts.length);
  });

  it("the guide's course in the root follows its hub out of the ostium; no rod nodes without the physics", () => {
    const st = start(su, { guide: "EBU3.5" });
    const seated = guideCatheterRoot(su.model, st, "left");
    const out = guideCatheterRoot(su.model, { ...st, guide: { ...st.guide, engaged: false, depthMm: -15 } }, "left");
    const tipS = seated[seated.length - 1];
    const tipO = out[out.length - 1];
    expect(tipO.y).toBeGreaterThan(tipS.y + 5);
    expect(guideCatheterNodes(null)).toBeNull();
  });

  it("the cine seat follows the guide: a root flush out of the ostium, a full capture engaged, a sealed jet deep", () => {
    const root = { ...initialGuide("EBU3.5", false), zone: "root" as const };
    const near = { ...root, zone: "near" as const };
    const coaxial = { ...initialGuide("EBU3.5", true), coaxial: 1 };
    const offAxis = { ...coaxial, coaxial: 0.3 };
    const deep = { ...coaxial, depthMm: 5, sideHoles: true };
    expect(guideInjectionSeat(root).capture).toBeLessThan(0.1);
    expect(guideInjectionSeat(near).capture).toBeGreaterThan(guideInjectionSeat(root).capture);
    expect(guideInjectionSeat(coaxial)).toEqual({ capture: 1, seal: 0.3 });
    expect(guideInjectionSeat(offAxis).capture).toBeCloseTo(0.55, 5);
    expect(guideInjectionSeat(deep)).toEqual({ capture: 1, seal: 0.9 });
  });
});
