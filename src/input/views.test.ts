// Server-side render checks for the S8 views: they must render without a DOM,
// reflect hub roll, pins, grips and valve state in the markup, and keep the
// "no numbers on the table" rule. Set S8_DUMP=<dir> to write the table SVGs for
// a visual check.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import InputCalibration from "../ui/lab/InputCalibration";
import TableView, { LABEL_PX, labelFontSize, type TableState } from "../ui/lab/TableView";
import { defaultSettings } from "./settings";
import { createInputSystem } from "./system";

function sys(initial: Parameters<typeof createInputSystem>[0] = {}) {
  const s = defaultSettings();
  s.grip.switchMs = 0;
  return createInputSystem({ storage: null, settings: s, getPads: () => [], ...initial });
}

function svgOf(html: string): string {
  const m = html.match(/<svg[\s\S]*<\/svg>/);
  return m ? m[0] : "";
}

// no @types/node in this project: reach Node through untyped dynamic imports
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const dump = async (name: string, html: string) => {
  const dir = env.S8_DUMP;
  if (!dir) return;
  const fsName = "node:fs";
  const fs = (await import(/* @vite-ignore */ fsName)) as { writeFileSync(p: string, d: string): void };
  const svg = svgOf(html).replace('width="100%" height="100%"', 'width="1200" height="300"').replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  fs.writeFileSync(`${dir}/${name}.svg`, svg);
};

describe("TableView", () => {
  it("renders standalone and with an input system", async () => {
    const a = renderToStaticMarkup(createElement(TableView, {}));
    expect(a).toContain("<svg");
    const s = sys({ initialGrip: "catheter" });
    const b = renderToStaticMarkup(createElement(TableView, { input: s }));
    expect(b).toContain('aria-label="Catheter hub"');
    await dump("table-guide", b);
  });

  it("hub wings follow the hub roll", () => {
    const at = (roll: number) => svgOf(renderToStaticMarkup(createElement(TableView, { state: { hubRollRad: { catheter: roll } } })));
    expect(at(0)).not.toEqual(at(Math.PI / 2));
    expect(at(0)).toEqual(at(2 * Math.PI));
  });

  it("shows the valve state, the device hub and the left-hand pin", async () => {
    const s = sys({ initialGrip: "balloon" });
    s.emit({ t: "pin", target: "auto", on: true, source: "keyboard" });
    s.emit({ t: "grab", on: true, source: "mouse" });
    const st: Partial<TableState> = { present: ["sheath", "catheter", "wire014", "balloon"], valveOpen: true, insertedMm: { catheter: 950, balloon: 200 }, hubRollRad: { wire014: 0.7 } };
    const html = renderToStaticMarkup(createElement(TableView, { input: s, state: st }));
    expect(html).toContain("Valve open");
    expect(html).toContain('aria-label="Device hub"');
    await dump("table-pci-pinned", html);
    const closed = renderToStaticMarkup(createElement(TableView, { input: s, state: { ...st, valveOpen: false } }));
    expect(closed).toContain("Valve closed");
  });

  it("diagnostic setup with the J wire in and a syringe of blood", async () => {
    const s = sys({ initialGrip: "syringe", present: ["sheath", "catheter", "wire035"] });
    const html = renderToStaticMarkup(
      createElement(TableView, {
        input: s,
        state: { setup: "diagnostic", present: ["sheath", "catheter", "wire035"], tap: "contrast", syringe: { volMl: 6, contrastMl: 2, salineMl: 0, bloodMl: 4, airMl: 0.3 } },
      })
    );
    expect(html).toContain('aria-label="J wire"');
    await dump("table-diagnostic", html);
  });

  it("carries no numeric readouts (only equipment labels)", () => {
    const html = svgOf(renderToStaticMarkup(createElement(TableView, { input: sys() })));
    const texts = Array.from(html.matchAll(/<text[^>]*>([^<]*)<\/text>/g)).map((m) => m[1]);
    expect(texts.length).toBeGreaterThan(0);
    for (const t of texts) expect(t).not.toMatch(/\d/);
  });

  it("port labels render at 12 px or more at every documented strip height", () => {
    // the 1200 x 300 viewBox is scaled by min(width / 1200, height / 300); a wide strip is height-limited
    for (const height of [200, 220, 240, 300]) {
      const scale = height / 300;
      const html = svgOf(renderToStaticMarkup(createElement(TableView, { input: sys(), height })));
      const sizes = Array.from(html.matchAll(/<text[^>]*font-size="([\d.]+)"/g)).map((m) => Number(m[1]));
      expect(sizes.length).toBe(3);
      for (const fs of sizes) expect(fs * scale).toBeGreaterThanOrEqual(12);
    }
    // a narrow strip (width-limited) needs bigger user-unit text
    expect(labelFontSize(600 / 1200) * (600 / 1200)).toBeGreaterThanOrEqual(12);
    expect(labelFontSize(1) * 1).toBeGreaterThanOrEqual(LABEL_PX - 1e-9);
    expect(labelFontSize(NaN)).toBeGreaterThanOrEqual(12);
  });
});

describe("InputCalibration", () => {
  it("renders its panels without a DOM", () => {
    const html = renderToStaticMarkup(createElement(InputCalibration, { system: sys() }));
    for (const s of ["Devices", "Pedal test", "Calibration", "Gains and grips", "Try the grips", "Keys"]) expect(html).toContain(s);
    expect(html).toContain("Fluoroscopy pedal (hold)");
  });
});

describe("cost", () => {
  it("input frame and table render stay well inside a 66 ms frame budget", () => {
    const pads = [{ index: 0, id: "p", mapping: "standard", connected: true, axes: [0, -0.7, 0.4, 0], buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: i === 6, value: i === 6 ? 1 : 0 })) }];
    const s = sys({ initialGrip: "catheter", getPads: () => pads });
    s.keyboard.keyDown("KeyD");
    for (let i = 0; i < 200; i++) s.frame(16);
    const n = 5000;
    const t0 = performance.now();
    for (let i = 0; i < n; i++) {
      s.feedReaction({ device: "catheter", axial: 0.4, torsion: 1, snap: false, wedged: false });
      s.mouse.button(0, true);
      s.mouse.movement(1, -2, "raw");
      s.frame(16);
    }
    const frameMs = (performance.now() - t0) / n;
    const r0 = performance.now();
    const m = 50;
    for (let i = 0; i < m; i++) renderToStaticMarkup(createElement(TableView, { input: s, state: { hubRollRad: { catheter: i * 0.1 } } }));
    const renderMs = (performance.now() - r0) / m;
    // reported in docs/realism/wave1/S8.md
    console.log(`[S8 cost] input frame ${frameMs.toFixed(4)} ms, table render (SSR) ${renderMs.toFixed(3)} ms`);
    expect(frameMs).toBeLessThan(0.5);
    expect(renderMs).toBeLessThan(20);
  });
});
