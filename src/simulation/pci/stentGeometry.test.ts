import { describe, expect, it } from "vitest";
import { THIN_STRUT_DES, deployStent, expansion, malapposition, markerPositions, ringCount, ringLengthAt, strutPolylines } from "./stentGeometry";

const straight = (s: number) => ({ p: { x: 0, y: 0, z: s }, T: { x: 0, y: 0, z: 1 }, N: { x: 1, y: 0, z: 0 }, B: { x: 0, y: 1, z: 0 } });

describe("procedural stent geometry", () => {
  it("ring count matches the labelled length; opening a ring shortens it (foreshortening)", () => {
    const n = ringCount(THIN_STRUT_DES, 18);
    expect(n).toBeGreaterThan(10);
    const nominal = deployStent(3.0, 18, () => 3.0, () => 3.0);
    expect(nominal.lengthMm).toBeGreaterThan(16);
    expect(nominal.lengthMm).toBeLessThan(20);
    expect(ringLengthAt(THIN_STRUT_DES, 3.0, 3.5)).toBeLessThan(ringLengthAt(THIN_STRUT_DES, 3.0, 3.0));
    const over = deployStent(3.0, 18, () => 3.5, () => 3.5);
    expect(over.lengthMm).toBeLessThan(nominal.lengthMm);
  });

  it("a stent under-expanded by 20% at the lesion has a visibly narrower ring envelope there", () => {
    // lesion in the middle third holds the rings to 80% of nominal
    const ringD = (u: number) => (u > 0.33 && u < 0.66 ? 0.8 * 3.0 : 3.0);
    const st = deployStent(3.0, 18, ringD, () => 3.0);
    const mid = st.rings.filter((_, i) => i / (st.rings.length - 1) > 0.4 && i / (st.rings.length - 1) < 0.6);
    const ends = [st.rings[0], st.rings[st.rings.length - 1]];
    for (const r of mid) expect(r.d).toBeLessThanOrEqual(0.8 * 3.0 + 1e-9);
    for (const r of ends) expect(r.d).toBeCloseTo(3.0, 6);
    expect(expansion(st).ratio).toBeLessThan(0.65);
    // the strut polylines follow the ring radii
    const poly = strutPolylines(st, straight);
    const radius = (pts: { x: number; y: number }[]) => Math.max(...pts.map((p) => Math.hypot(p.x, p.y)));
    const midIdx = st.rings.indexOf(mid[0]);
    expect(radius(poly.rings[midIdx])).toBeLessThan(0.85 * radius(poly.rings[0]));
    expect(poly.rings.length).toBe(st.rings.length);
    expect(poly.connectors.length).toBe((st.rings.length - 1) * THIN_STRUT_DES.connectorsPerGap);
  });

  it("rings smaller than the local lumen are malapposed (the strut-to-wall gap is measured)", () => {
    // tapering vessel: 3.6 mm proximally, 3.0 distally; stent at 3.0 mm
    const st = deployStent(3.0, 23, () => 3.0, (u) => 3.6 - 0.6 * u);
    const m = malapposition(st);
    expect(m.maxGapMm).toBeCloseTo(0.3, 1);
    expect(st.rings[st.rings.length - 1].gapMm).toBeLessThan(0.05);
  });

  it("proximal compression bunches the first rings and shortens the stent", () => {
    const a = deployStent(3.0, 18, () => 3.0, () => 3.0);
    const b = deployStent(3.0, 18, () => 3.0, () => 3.0, { compressionMm: 3 });
    expect(b.lengthMm).toBeLessThan(a.lengthMm - 0.5);
    const gap = (st: typeof a, i: number) => st.rings[i + 1].s0 - (st.rings[i].s0 + st.rings[i].len);
    expect(gap(b, 0)).toBeLessThan(gap(a, 0));
    expect(gap(b, b.rings.length - 2)).toBeCloseTo(gap(a, a.rings.length - 2), 6);
  });

  it("marker bands sit 0.4 mm beyond each stent end", () => {
    const [p, d] = markerPositions(THIN_STRUT_DES, 18);
    expect(p + THIN_STRUT_DES.markerLenMm / 2).toBeCloseTo(-0.4, 6);
    expect(d - THIN_STRUT_DES.markerLenMm / 2).toBeCloseTo(18.4, 6);
  });
});
