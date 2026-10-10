// The shared intravascular renderer and longitudinal view (pci-bench-imaging-unify), rendered from the
// one frame generator for bench and PCI-lab frames.
//   npx vitest run src/ui/imaging/imaging.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { BENCH_BY_ID, MP_BENCH_LCX_OSTIUM, benchIvusContext, deploy, initialState } from "../../simulation/pciBench";
import { MP_PENETRATION_MM, ivusFrame } from "../../simulation/pci/ivus";
import IntravascularView from "./IntravascularView";
import LongitudinalView, { longitudinalSamples, sampleOf } from "./LongitudinalView";

describe("IntravascularView", () => {
  it("draws an IVUS calcium frame with its shadow and an OCT frame with a bordered deposit, named for the modality and position", () => {
    const l = BENCH_BY_ID["calcified-rca"];
    const x = 20;
    const ivus = renderToString(createElement(IntravascularView, { frame: ivusFrame(benchIvusContext(l, null, null, "IVUS"), x) }));
    const oct = renderToString(createElement(IntravascularView, { frame: ivusFrame(benchIvusContext(l, null, null, "OCT"), x) }));
    expect(ivus).toContain('aria-label="IVUS frame at 20.0 mm"');
    expect(oct).toContain('aria-label="OCT frame at 20.0 mm"');
    // OCT draws the deposit with a bright border; IVUS a bright leading arc over a shadow
    expect(oct).toContain('stroke="#f0d7b6"');
    expect(ivus).toContain('fill="#060606"');
    // no finding is named in the image
    for (const html of [ivus, oct]) expect(html.toLowerCase()).not.toMatch(/calcium|lipid|dissection|thrombus/);
  });

  it("draws the struts of a deployed stent", () => {
    const l = BENCH_BY_ID["focal-lad"];
    const r = deploy(l, initialState(), { diameter: 3.0, lengthMm: 18, proxEdge: 12, atm: 12 }, [{ diameter: 3.25, atm: 18, where: "full" }], "OCT");
    const f = ivusFrame(benchIvusContext(l, initialState(), r, "OCT"), 20);
    const html = renderToString(createElement(IntravascularView, { frame: f }));
    expect((html.match(/<rect /g) ?? []).length).toBeGreaterThanOrEqual(f.struts.length);
  });

  it("fades the tissue beyond each modality's penetration depth with one radial mask", () => {
    const l = BENCH_BY_ID["lipid-acs"];
    for (const m of ["IVUS", "OCT"] as const) {
      const f = ivusFrame(benchIvusContext(l, null, null, m), 18);
      const html = renderToString(createElement(IntravascularView, { frame: f }));
      expect((html.match(/<mask /g) ?? []).length).toBe(1);
      expect(html).toMatch(/mask="url\(#depth-/);
      // the fade ends at the mean lumen radius plus the penetration depth (px of the 300-unit field)
      const meanLumen = f.lumen.reduce((a, b) => a + b, 0) / f.lumen.length;
      const end = Math.min(1, ((meanLumen + MP_PENETRATION_MM[m]) * 28) / 148);
      const offsets = [...html.matchAll(/<stop offset="([0-9.]+)"/g)].map((x) => Number(x[1]));
      expect(offsets[1]).toBeCloseTo(end, 6);
      expect(offsets[0]).toBeLessThan(offsets[1] + 1e-9);
    }
    // OCT images less deeply than IVUS
    expect(MP_PENETRATION_MM.OCT).toBeLessThan(MP_PENETRATION_MM.IVUS);
  });

  it("draws the side-branch ostium as an opening in the wall", () => {
    const l = BENCH_BY_ID["distal-lm"];
    const f = ivusFrame(benchIvusContext(l), MP_BENCH_LCX_OSTIUM.atMm);
    expect(f.sideBranch).not.toBeNull();
    const withOstium = renderToString(createElement(IntravascularView, { frame: f }));
    const without = renderToString(createElement(IntravascularView, { frame: { ...f, sideBranch: null } }));
    expect((withOstium.match(/<path /g) ?? []).length).toBe((without.match(/<path /g) ?? []).length + 1);
    expect(withOstium).toMatch(/<path d="M[^"]+ A[0-9.]+,[0-9.]+ 0 [01] 1 [^"]+ L[^"]+ A148,148 /);
  });
});

describe("LongitudinalView", () => {
  it("samples the pullback from the frame generator and renders it with the cursor", () => {
    const l = BENCH_BY_ID["long-taper"];
    const ctx = benchIvusContext(l, null, null, "IVUS");
    const samples = longitudinalSamples(ctx, 0, l.segmentMm, 50);
    expect(samples).toHaveLength(51);
    expect(samples[10]).toEqual(sampleOf(ivusFrame(ctx, samples[10].mm, 36)));
    expect(samples.every((s) => s.lumenR < s.eemR)).toBe(true);
    const html = renderToString(createElement(LongitudinalView, { samples, modality: "IVUS", cursorMm: 12, onCursor: () => undefined }));
    expect(html).toContain("IVUS longitudinal view, 0 to 50 mm, frame at 12.0 mm");
    expect(html).toContain('aria-label="Frame position along the pullback"');
    // the cursor in the design system's warn token, and labels large enough to read (15 units of a 760-unit width)
    expect(html).toContain('stroke="#E9B95A"');
    expect(html).not.toContain("#facc15");
    const sizes = [...html.matchAll(/font-size="([0-9.]+)"/g)].map((x) => Number(x[1]));
    expect(sizes.length).toBeGreaterThan(0);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(15);
  });
});
