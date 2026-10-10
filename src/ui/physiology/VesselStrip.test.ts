// physiology-left-main-and-ostial: the vessel strip's branch selector and the trace's branch label.
//   npx vitest run src/ui/physiology/VesselStrip.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import VesselStrip, { shownDs } from "./VesselStrip";
import TraceView, { pdLabel } from "./TraceView";
import { LEFT_MAIN_PRESET_BY_ID, bifurcationPos, presetView } from "../../simulation/physiology";

const base = { sensorMm: 20, sensorFromTipMm: 30, wireIn: true, guideEngaged: true };

describe("VesselStrip with a branched case", () => {
  const p = LEFT_MAIN_PRESET_BY_ID["lm-jailed-lcx-085"];
  const c = presetView(p, "LCx");
  const lmMm = bifurcationPos(c)! * c.lengthMm;

  it("shows the left main, the other branch, and a selector with the active branch checked", () => {
    const html = renderToStaticMarkup(
      createElement(VesselStrip, { ...base, lesions: c.lesions, lengthMm: c.lengthMm, diffuse: c.diffuse, branches: { lmMm, options: p.branches, active: "LCx", onSelect: () => {} } })
    );
    expect(lmMm).toBeCloseTo(10, 9);
    expect(html).toContain("Wire in");
    expect(html).toMatch(/role="radio" aria-checked="true"[^>]*>LCx</);
    expect(html).toMatch(/role="radio" aria-checked="false"[^>]*>LAD</);
    expect(html).toContain(">LM<");
    expect(html).toContain("distal LCx");
  });

  it("labels the jailed ostium as the angiogram shows it (75%), not by the lumen that sets the pressure loss", () => {
    const jailed = c.lesions.find((l) => l.id === "lcx-jailed")!;
    expect(shownDs(jailed)).toBe(0.75);
    expect(jailed.ds).toBeLessThan(0.75);
    const html = renderToStaticMarkup(createElement(VesselStrip, { ...base, lesions: c.lesions, lengthMm: c.lengthMm, branches: { lmMm, options: p.branches, active: "LCx" } }));
    expect(html).toContain(">75%<");
    expect(html).not.toContain(`>${Math.round(jailed.ds * 100)}%<`);
    // read-only without onSelect
    expect(html).toMatch(/aria-checked="false" class="seg-btn " disabled=""/);
  });

  it("an unbranched vessel draws as before (no selector)", () => {
    const html = renderToStaticMarkup(createElement(VesselStrip, { ...base, lesions: [{ id: "x", pos: 0.4, ds: 0.6, lengthMm: 10 }], lengthMm: 110 }));
    expect(html).not.toContain("Wire in");
    expect(html).toContain("distal vessel");
    expect(html).toContain(">60%<");
  });
});

describe("TraceView", () => {
  it("names the branch on the distal channel and shows whether the guide is engaged", () => {
    expect(pdLabel("LAD")).toBe("Pd LAD");
    expect(pdLabel()).toBe("Pd");
    const html = renderToStaticMarkup(
      createElement(TraceView, { paAt: () => 90, pdAt: () => 70, clock: () => 0, readout: { pa: 90, pd: 70, pdpa: 0.78 }, branchLabel: "LCx", guide: "disengaged" })
    );
    expect(html).toContain("Pd LCx 70");
    expect(html).toContain("guide disengaged");
    const plain = renderToStaticMarkup(createElement(TraceView, { paAt: () => 90, pdAt: () => 70, clock: () => 0, readout: { pa: 90, pd: 70, pdpa: 0.78 } }));
    expect(plain).toContain("Pd 70");
    expect(plain).not.toContain("guide engaged");
  });
});
