// The bench's stent and optimisation panels and the longitudinal view's planned markers
// (pci-bench-stent-platforms-sizing), rendered to static markup.
//   npx vitest run src/ui/bench/StentPanel.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { BENCH_BY_ID, benchIvusContext, benchRegions, plannedDelivery, type Stent } from "../../simulation/pciBench";
import LongitudinalView, { longitudinalSamples } from "../imaging/LongitudinalView";
import StentPanel from "./StentPanel";
import OptimisePanel from "./OptimisePanel";

const noop = () => undefined;
/** static markup without React's text separators */
const render = (el: Parameters<typeof renderToString>[0]) => renderToString(el).replace(/<!-- -->/g, "");
const xs = (html: string, part: string) => [...html.matchAll(new RegExp(`<rect[^>]*data-part="${part}"[^>]*>`, "g"))].map((m) => ({ x: Number(/ x="([-0-9.]+)"/.exec(m[0])![1]), w: Number(/ width="([-0-9.]+)"/.exec(m[0])![1]) }));
const panel = (id: string, stent: Stent) => render(createElement(StentPanel, { lesion: BENCH_BY_ID[id], stent, setStent: noop, deploy: noop }));

describe("StentPanel", () => {
  it("draws the marker bands and the stent edges apart for a platform whose stent lies inside its markers", () => {
    const html = panel("taper-lad", { diameter: 3.0, lengthMm: 28, proxEdge: 10, atm: 12, platformId: "A" });
    const stent = xs(html, "stent")[0];
    const markers = xs(html, "marker-band");
    expect(markers).toHaveLength(2);
    // the proximal marker ends before the stent starts, the distal one starts after the stent ends
    expect(markers[0].x + markers[0].w).toBeLessThan(stent.x);
    expect(markers[1].x).toBeGreaterThan(stent.x + stent.w);
    // the magnified proximal end: the marker band beside, not over, the stent edge
    const zoomMarker = xs(html, "marker-zoom")[0];
    const edge = Number(/data-part="stent-edge"[^>]* x1="([-0-9.]+)"|x1="([-0-9.]+)"[^>]*data-part="stent-edge"/.exec(html)!.slice(1).find(Boolean));
    expect(zoomMarker.x + zoomMarker.w).toBeLessThan(edge);
    expect(html).toContain("0.9 mm inside the marker centre");
    expect(html).toContain("Platform A");
    expect(html).toContain("labelled post-dilatation limit for 3.00 mm: 3.50 mm");
  });

  it("a platform crimped at the centre of each marker draws the stent ends at the marker centres", () => {
    const html = panel("taper-lad", { diameter: 3.0, lengthMm: 28, proxEdge: 10, atm: 12, platformId: "C" });
    const stent = xs(html, "stent")[0];
    const [p, d] = xs(html, "marker-band");
    expect(p.x + p.w / 2).toBeCloseTo(stent.x, 1);
    expect(d.x + d.w / 2).toBeCloseTo(stent.x + stent.w, 1);
    expect(html).toContain("at the marker centre");
  });

  it("offers the five platforms and only the chosen platform's sizes", () => {
    const html = panel("small-distal-225", { diameter: 2.0, lengthMm: 12, proxEdge: 9, atm: 12, platformId: "B" });
    for (const id of ["A", "B", "C", "D", "E"]) expect(html).toMatch(new RegExp(`aria-pressed="(true|false)"[^>]*>${id}</button>`));
    expect(html).toContain(">2.00</button>");
    expect(panel("small-distal-225", { diameter: 2.25, lengthMm: 12, proxEdge: 9, atm: 12, platformId: "A" })).not.toContain(">2.00</button>");
  });

  it("swings the delivery system with each beat unless rapid pacing is on, and shows the recorded predilatation", () => {
    const st: Stent = { diameter: 3.0, lengthMm: 28, proxEdge: 10, atm: 12 };
    const moving = panel("taper-lad", st);
    expect(moving).toContain("<animateTransform");
    expect(moving).toContain("The stent swings with each beat.");
    expect(moving).toContain("predilated 10–38 mm");
    expect(moving).toContain("Rapid pacing during deployment");
    const paced = panel("taper-lad", { ...st, rapidPacing: true });
    expect(paced).not.toContain("<animateTransform");
    // a lesion that does not move never swings
    expect(panel("focal-lad", st)).not.toContain("<animateTransform");
  });

  it("marks the ostium of an aorto-ostial lesion", () => {
    expect(panel("ostial-rca-short", { diameter: 3.5, lengthMm: 15, proxEdge: 4, atm: 14 })).toContain('data-part="ostium"');
    expect(panel("focal-lad", { diameter: 3.0, lengthMm: 18, proxEdge: 10, atm: 12 })).not.toContain('data-part="ostium"');
  });
});

describe("OptimisePanel", () => {
  it("shows the deployed platform's limit and warns when the balloon reaches beyond it", () => {
    // the default 3.25 mm balloon at 18 atm (about 3.4 mm) against platform B's 2.25 mm stent, labelled to 2.75 mm
    const over = render(createElement(OptimisePanel, { post: [], stentLimitMm: 3.5, onInflate: noop, onClear: noop, finish: noop, stent: { diameter: 2.25, lengthMm: 12, proxEdge: 9, atm: 12, platformId: "B" } }));
    expect(over).toContain("stent limit 2.75 mm");
    expect(over).toContain("beyond the stent&#x27;s labelled post-dilatation limit of 2.75 mm");
    const within = render(createElement(OptimisePanel, { post: [], stentLimitMm: 3.5, onInflate: noop, onClear: noop, finish: noop, stent: { diameter: 3.0, lengthMm: 18, proxEdge: 9, atm: 12, platformId: "A" } }));
    expect(within).toContain("stent limit 3.50 mm");
    expect(within).not.toContain("beyond the stent");
    // without a stent the given limit stands (as before)
    expect(render(createElement(OptimisePanel, { post: [], stentLimitMm: 4.5, onInflate: noop, onClear: noop, finish: noop }))).toContain("stent limit 4.50 mm");
  });

  it("offers the ostial flare only for an aorto-ostial lesion", () => {
    const args = { post: [], stentLimitMm: 4.5, onInflate: noop, onClear: noop, finish: noop };
    expect(render(createElement(OptimisePanel, { ...args, lesion: BENCH_BY_ID["ostial-overhang"] }))).toContain("flare the ostium");
    expect(render(createElement(OptimisePanel, { ...args, lesion: BENCH_BY_ID["focal-lad"] }))).not.toContain("flare the ostium");
  });
});

describe("LongitudinalView: planned markers and regions without a lumen", () => {
  it("draws the planned stent's marker bands outside its outline, and shades the aorta and uncleared blood", () => {
    const l = BENCH_BY_ID["ostial-rca-short"];
    const planned = plannedDelivery(l, { diameter: 3.5, lengthMm: 15, proxEdge: 4, atm: 14 });
    expect(planned.markers[0][1]).toBeLessThan(planned.fromMm);
    expect(planned.markers[1][0]).toBeGreaterThan(planned.toMm);
    const samples = longitudinalSamples(benchIvusContext(l, null, null, "IVUS"), 0, l.segmentMm, 40);
    const html = render(createElement(LongitudinalView, { samples, modality: "IVUS", cursorMm: 8, planned, regions: benchRegions(l, "IVUS") }));
    expect(xs(html, "planned-marker")).toHaveLength(2);
    expect(html).toContain('data-part="region-aorta"');
    const ect = BENCH_BY_ID["ectatic-rca"];
    expect(benchRegions(ect, "OCT").some((r) => r.kind === "uncleared")).toBe(true);
    expect(benchRegions(ect, "IVUS")).toEqual([]);
    // without the new props the view is as before
    expect(render(createElement(LongitudinalView, { samples, modality: "IVUS", cursorMm: 8 }))).not.toContain("planned-marker");
  });
});
