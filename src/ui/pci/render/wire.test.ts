// pci-wire-microcatheter: the wire's shaped tip, a subintimal course, the microcatheter and a selective
// microcatheter injection as render/wire.ts draws them (rest geometry, no heart motion).
//   npx vitest run src/ui/pci/render/wire.test.ts
import { describe, expect, it } from "vitest";
import { samplePos } from "../../../render/xray/coronaryTree";
import { moveWire, setWireKind, shapeTip } from "../../../simulation/angioPci";
import { checkMicroBackflow, injectMicrocatheter, loadMicrocatheter, moveMicrocatheter } from "../../../simulation/pci/actions/wire";
import { radiusAtMm, sampleAtMm } from "../../../simulation/pci/geometry";
import { setup, start, wireToTarget } from "../../../simulation/pci/testSetup";
import { PCI_RENDER_MODULES, pciDevices, type PciDrawContext } from "../pciDevicesRender";
import { draw as coreDraw } from "./core";
import { COIL_MU, SUBINTIMAL_OFFSET_MM, WIRE_MU, draw, reshaped } from "./wire";
import type { Vec3 } from "../../../types";

const su = setup("lad-focal");
const ctxOf = (): PciDrawContext => ({ s: su.s, tree: su.tree, place: (sm) => samplePos(su.tree.heart, sm), ctx: { bolusT: null, injecting: false }, atm: 0 });
const metal = (mu: unknown) => Array.isArray(mu) && typeof mu[2] === "number" ? (mu as number[])[2] : 0;
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe("render/wire.ts (pci-wire-microcatheter)", () => {
  it("is a registered render module drawn after core", () => {
    const ids = PCI_RENDER_MODULES.map((m) => m.id);
    expect(ids).toContain("wire");
    expect(ids.indexOf("wire")).toBeGreaterThan(ids.indexOf("core"));
  });

  it("leaves core's wire alone with the default shape; a reshaped tip cancels it exactly and draws the shape, so the tip shape changes the drawn wire", () => {
    const base = wireToTarget(su, start(su), 20);
    const x = ctxOf();
    expect(reshaped(base)).toBe(false);
    expect(draw(base, su.g, x).tubes).toEqual([]);
    const tipEnd = (st: typeof base) => {
      const tubes = draw(st, su.g, x).tubes;
      const core = coreDraw(st, su.g, x).tubes.filter((t) => metal(t.mu) === WIRE_MU || metal(t.mu) === COIL_MU);
      // the negative tubes are core's own wire tubes with the opposite attenuation
      const neg = tubes.filter((t) => metal(t.mu) < 0);
      expect(neg.length).toBe(core.length);
      neg.forEach((t, i) => {
        expect(t.pts).toEqual(core[i].pts);
        expect(metal(t.mu)).toBe(-metal(core[i].mu));
      });
      const shaft = tubes.find((t) => metal(t.mu) === WIRE_MU)!;
      return shaft.pts[shaft.pts.length - 1];
    };
    // reshaping needs the wire out of the coronary or a microcatheter: shape it through one
    let mc = loadMicrocatheter(base, "mc-large");
    mc = moveMicrocatheter(su.s, su.g, mc, 300);
    const short = shapeTip(mc, { primaryDeg: 45, primaryMm: 1, secondaryDeg: 0, secondaryMm: 0 });
    const long = shapeTip(mc, { primaryDeg: 80, primaryMm: 3, secondaryDeg: 0, secondaryMm: 0 });
    expect(reshaped(short) && reshaped(long)).toBe(true);
    const a = tipEnd(short);
    const b = tipEnd(long);
    expect(dist(a, b)).toBeGreaterThan(0.5);
    // the composed drawing still has one wire's worth of metal: the cancelled core wire plus the redrawn one
    const all = pciDevices(su.s, long, su.g, su.tree, x.place, x.ctx, 0).tubes;
    const sum = all.filter((t) => Math.abs(metal(t.mu)) === WIRE_MU).reduce((acc, t) => acc + Math.sign(metal(t.mu)), 0);
    expect(sum).toBe(1);
  });

  it("draws a subintimal segment outside the lumen contour by at least the radius plus 0.4 mm", () => {
    const cto = setup("rca-cto");
    let st = setWireKind(start(cto, { seed: 101 }), "cto");
    for (let seed = 101; seed < 160 && !st.wire.subintimal; seed++) {
      st = setWireKind(start(cto, { seed }), "cto");
      st = shapeTip(st, { primaryDeg: 70, primaryMm: 1.2, secondaryDeg: 0, secondaryMm: 0 });
      st = wireToTarget(cto, st, 4, 1);
    }
    expect(st.wire.subintimal).not.toBeNull();
    const x: PciDrawContext = { s: cto.s, tree: cto.tree, place: (sm) => samplePos(cto.tree.heart, sm), ctx: { bolusT: null, injecting: false }, atm: 0 };
    const shaft = draw(st, cto.g, x).tubes.find((t) => metal(t.mu) === WIRE_MU)!;
    expect(shaft).toBeDefined();
    // the shaft is drawn every 1.2 mm from the ostium: point k is at k x 1.2 mm along the route
    const from = st.wire.subintimal!.fromMm;
    let checked = 0;
    shaft.pts.forEach((p, k) => {
      const mm = k * 1.2;
      if (mm < from + 0.01 || mm > st.tipMm - st.wire.shape.primaryMm - 0.01) return;
      const centre = samplePos(cto.tree.heart, sampleAtMm(cto.g, st.route, mm)!.s);
      // at rest there is no swing: the point sits the lumen radius plus the offset outside the centre line
      expect(dist(p, centre)).toBeCloseTo(radiusAtMm(cto.g, st.route, mm) + SUBINTIMAL_OFFSET_MM, 3);
      checked++;
    });
    expect(checked).toBeGreaterThan(0);
  });

  it("draws the microcatheter to its tip, and a selective injection fills only the vessel beyond the tip", () => {
    let st = wireToTarget(su, start(su), 30);
    st = loadMicrocatheter(st, "mc-large");
    st = moveMicrocatheter(su.s, su.g, st, 60);
    const m = st.wire.micro!;
    expect(m.tipMm).toBeGreaterThan(20);
    const x = ctxOf();
    const mc = draw(st, su.g, x).tubes.filter((t) => Array.isArray(t.mu) && (t.mu as number[])[0] > 0);
    expect(mc.length).toBe(1);
    st = injectMicrocatheter(su.s, su.g, checkMicroBackflow(st));
    const iod = draw(st, su.g, x).tubes.filter((t) => Array.isArray(t.mu) && (t.mu as number[])[1] > 0);
    expect(iod.length).toBeGreaterThan(0);
    // every filled point lies at or beyond the microcatheter tip along the route
    const tipPt = samplePos(su.tree.heart, sampleAtMm(su.g, st.route, m.tipMm)!.s);
    const ostium = samplePos(su.tree.heart, sampleAtMm(su.g, st.route, 0)!.s);
    expect(dist(iod[0].pts[0], tipPt)).toBeLessThan(0.05);
    for (const t of iod) for (const p of t.pts) expect(dist(p, ostium)).toBeGreaterThan(dist(tipPt, ostium) * 0.5);
    // nothing proximal: the proximal LAD and the left main are not filled
    const prox = samplePos(su.tree.heart, sampleAtMm(su.g, st.route, Math.max(1, m.tipMm - 15))!.s);
    for (const t of iod) for (const p of t.pts) expect(dist(p, prox)).toBeGreaterThan(1);
    // the fill fades after a few seconds of procedure time
    expect(draw({ ...st, t: st.t + 10 }, su.g, x).tubes.filter((t) => Array.isArray(t.mu) && (t.mu as number[])[1] > 0)).toEqual([]);
    void moveWire;
  });
});
