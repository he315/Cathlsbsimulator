// The coronary function test panel (physiology-anoca-cft): the traces it draws from the model (the
// aortic trace stops while acetylcholine goes in through the guide, AV block draws P waves without
// their QRS, ST change shows in the ST segment) and a static render that names no endotype before the
// classification.
//   npx vitest run src/ui/physiology/CftPanel.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { ANOCA_PRESETS, cftReducer, initialCftState, type CftAction, type CftState } from "../../simulation/physiology/ach";
import CftPanel, { angioStripLesions, cftEcgAt, cftPaAt, cftPdAt } from "./CftPanel";
import VesselStrip from "./VesselStrip";

const run = (s: CftState, ...as: CftAction[]) => as.reduce(cftReducer, s);
const tick = (s: CftState, seconds: number) => {
  for (let i = 0; i < seconds * 2; i++) s = cftReducer(s, { type: "tick", dt: 0.5 });
  return s;
};
const sample = (f: (t: number) => number, t0: number, t1: number, n = 400) => Array.from({ length: n }, (_, i) => f(t0 + ((t1 - t0) * i) / n));

describe("traces", () => {
  it("the pressure traces are finite and pulsatile; the aortic trace is flat at zero while acetylcholine goes in through the guide", () => {
    let s = tick(initialCftState("anoca-normal"), 5);
    const pa = sample((t) => cftPaAt(s, t), 2, 5);
    const pd = sample((t) => cftPdAt(s, t), 2, 5);
    expect(pa.every(Number.isFinite) && pd.every(Number.isFinite)).toBe(true);
    expect(Math.max(...pa) - Math.min(...pa)).toBeGreaterThan(30);
    s = run(s, { type: "check", item: "pads" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "guide" });
    s = tick(s, 5);
    expect(cftPaAt(s, s.t)).toBe(0);
    expect(Number.isFinite(cftPdAt(s, s.t))).toBe(true);
  });

  it("the distal trace falls away from the aortic trace during severe epicardial spasm", () => {
    let s = tick(initialCftState("anoca-epicardial-spasm"), 5);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const gap0 = mean(sample((t) => cftPaAt(s, t) - cftPdAt(s, t), s.t - 3, s.t));
    s = run(s, { type: "check", item: "pads" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "microcatheter" });
    s = tick(s, 25);
    const gap = mean(sample((t) => cftPaAt(s, t) - cftPdAt(s, t), s.t - 3, s.t));
    expect(gap0).toBeLessThan(5);
    expect(gap).toBeGreaterThan(20);
  });

  it("the ECG: one QRS per beat in sinus rhythm; with RCA block the P waves outnumber the QRS complexes; ST elevation lifts the ST segment", () => {
    const peaks = (xs: number[], thr: number) => xs.filter((x, i) => i > 0 && x > thr && xs[i - 1] <= thr).length;
    let s = tick(initialCftState("anoca-normal"), 6);
    const sinus = sample((t) => cftEcgAt(s, t), 0, 6, 3000);
    expect(peaks(sinus, 0.6)).toBeGreaterThanOrEqual(6);
    s = run(s, { type: "check", item: "pads" }, { type: "check", item: "pacing" }, { type: "ach", regimen: "uk-bolus", side: "right", route: "guide" });
    s = tick(s, 12);
    const blocked = sample((t) => cftEcgAt(s, t), s.t - 6, s.t, 3000);
    const qrs = peaks(blocked, 0.6);
    const p = peaks(blocked.map((x, i) => (x > 0.1 && x < 0.2 ? x : 0)), 0.12);
    expect(qrs).toBeLessThan(5);
    expect(p).toBeGreaterThan(qrs);
    // ST: the epicardial spasm preset during its response
    let e = tick(initialCftState("anoca-epicardial-spasm"), 2);
    const stBefore = cftEcgAt(e, 0.3 + Math.floor(e.t / (60 / 70)) * (60 / 70));
    e = run(e, { type: "check", item: "pads" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "microcatheter" });
    e = tick(e, 20);
    expect(Math.abs(stBefore)).toBeLessThan(0.05);
    const st = sample((t) => cftEcgAt(e, t), e.t - 3, e.t, 3000);
    expect(Math.max(...st.filter((x) => x > 0.2 && x < 0.5))).toBeGreaterThan(0.25);
  });
});

describe("the panel (static render)", () => {
  it("renders each preset's study with its brief, the protocol controls and the console, naming no endotype before the classification", () => {
    for (const p of ANOCA_PRESETS) {
      const html = renderToString(createElement(CftPanel, { presetId: p.id, mode: "independent" })).replace(/<!-- -->/g, "");
      expect(html).toContain(p.brief.slice(0, 40));
      for (const label of ["Inject room-temperature saline", "Drift check at the ostium", "Start IV adenosine", "Defibrillator pads and ECG leads on", "Record the endotype"]) expect(html, label).toContain(label);
      // the teaching text and the debrief appear only after the classification
      expect(html).not.toContain(p.teaching.slice(0, 40));
      expect(html).not.toContain("The study</div>");
      // no teaching aid outside guided mode
      expect(html).not.toContain("Teaching aid");
    }
  });
});

describe("the angiogram on the live screen", () => {
  it("outside the guided aids the strip shows the narrowing as judged by eye, never the measured constriction", () => {
    let checked = 0;
    for (const seed of ["1", "2", "3", "4", "5", "6"]) {
      let s = tick(initialCftState("anoca-epicardial-spasm", seed), 2);
      s = run(s, { type: "gtn", doseUg: 200 }, { type: "check", item: "pads" }, { type: "ach", regimen: "uk-bolus", side: "left", route: "microcatheter" });
      s = tick(s, 18);
      s = run(s, { type: "angio", view: "rao-caudal" });
      const a = s.angios[s.angios.length - 1];
      const live = angioStripLesions(s, false);
      expect(live[0].ds).toBe(a.looks);
      expect(Math.round(a.looks * 100) % 10).toBe(0);
      expect(angioStripLesions(s, true)[0].ds).toBe(a.constriction);
      const exact = `${Math.round(a.constriction * 100)}%`;
      if (Math.round(a.constriction * 100) % 10 === 0) continue;
      const html = renderToString(createElement(VesselStrip, { lesions: live, lengthMm: 60, sensorMm: 60, sensorFromTipMm: 30, wireIn: true, guideEngaged: true, disabled: true }));
      expect(html).not.toContain(exact);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
});
