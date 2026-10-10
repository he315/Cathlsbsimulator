// Render smoke tests of the transducer set-up (haemo-transducer-and-setup): SetupPanel shows what an
// operator sees and no truth until the diagnosis; TracePanel shows it with the study at hand (passed or
// taken from the catheter controls) and reads through the set-up; the debrief compares recorded with
// true pressures.
//   npx vitest run src/ui/haemo/setupPanel.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { SCENARIO_BY_ID } from "../../simulation/haemo";
import { diagnosisOptions, displayedMeasure, haemoStudyReducer, initialStudy, preparedSetup, shownChambers, studyScenario, type HaemoAction, type HaemoStudyState } from "../../simulation/haemoStudy";
import SetupPanel, { flushStrip } from "./SetupPanel";
import TracePanel from "./TracePanel";
import CatheterPanel from "./CatheterPanel";

const play = (st: HaemoStudyState, ...as: HaemoAction[]) => as.reduce(haemoStudyReducer, st);
const noop = () => {};
const html = (el: Parameters<typeof renderToString>[0]) => renderToString(el).replace(/<!-- -->/g, "");

describe("SetupPanel", () => {
  it("shows the controls and what is visible, with no verdict or truth before the diagnosis", () => {
    const st = play(initialStudy("normal", "setup-overdamped-air"), { type: "setup-fast-flush" });
    const out = html(createElement(SetupPanel, { study: st, dispatch: noop }));
    for (const s of ["Transducer and manifold", "Mid-thoracic level", "Zero", "Fast flush", "What did the flush show?", "Inspect the manifold", "air bubble"]) expect(out).toContain(s);
    expect(out).not.toContain("Set-up debrief");
    expect(out).not.toMatch(/the line was overdamped/);
    // the assistant's hidden bubble does not show until inspected
    const hidden = html(createElement(SetupPanel, { study: initialStudy("normal", "setup-hidden-bubble"), dispatch: noop }));
    expect(hidden).not.toContain(">air bubble<");
    const looked = html(createElement(SetupPanel, { study: play(initialStudy("normal", "setup-hidden-bubble"), { type: "manifold-inspect" }), dispatch: noop }));
    expect(looked).toContain(">air bubble<");
  });

  it("the debrief after the diagnosis: checks, flush readings, recorded against true pressures, the critical error", () => {
    let st = play(initialStudy("pah", "setup-v4-level"), { type: "rhc-advance" }, { type: "record" }, { type: "setup-fast-flush" }, { type: "setup-read-flush", reading: "overdamped" }, { type: "manifold-inject" });
    st = play(st, { type: "answer", index: diagnosisOptions(SCENARIO_BY_ID.pah).indexOf(SCENARIO_BY_ID.pah.diagnosis) });
    const out = html(createElement(SetupPanel, { study: st, dispatch: noop }));
    expect(out).toContain("Set-up debrief");
    expect(out).toContain("read as overdamped; the line was optimal");
    expect(out).toContain("not level");
    expect(out).not.toContain("Critical error");
    const air = play(initialStudy("normal", "setup-table-move"), { type: "rhc-advance" }, { type: "manifold-inject" }, { type: "answer", index: 0 });
    expect(html(createElement(SetupPanel, { study: air, dispatch: noop }))).toContain("Critical error: air was injected");
  });

  it("the V4 preset does not highlight where the transducer was levelled until the learner levels it", () => {
    const v4Button = (out: string) => /<button[^>]*class="([^"]*)"[^>]*>Level with the V4 electrode/.exec(out)?.[1] ?? "";
    const st = initialStudy("pah", "setup-v4-level");
    const out = html(createElement(SetupPanel, { study: st, dispatch: noop }));
    expect(out).toContain("Level with the V4 electrode");
    expect(v4Button(out)).not.toContain("btn-accent");
    expect(out).not.toMatch(/btn-accent[^"]*"[^>]*>(Mid-thoracic level|Level with the table top)/);
    // chosen by the learner, it is highlighted
    expect(v4Button(html(createElement(SetupPanel, { study: play(st, { type: "setup-level", landmark: "v4" }), dispatch: noop })))).toContain("btn-accent");
    // the debrief says how it was set up
    const done = play(st, { type: "answer", index: 0 });
    expect(html(createElement(SetupPanel, { study: done, dispatch: noop }))).toContain("levelled the transducer with the V4 electrode");
  });

  it("the flush strip has a time grid and shows the long line ringing at a longer period", () => {
    const period = (pts: { t: number; p: number }[]) => {
      // the first two maxima after the release (the lowest point of the first undershoot)
      const iMin = pts.reduce((b, q, i) => (q.p < pts[b].p ? i : b), 0);
      const peaks: number[] = [];
      for (let i = iMin + 1; i < pts.length - 1 && peaks.length < 2; i++) if (pts[i].p > pts[i - 1].p && pts[i].p >= pts[i + 1].p) peaks.push(pts[i].t);
      return peaks.length === 2 ? peaks[1] - peaks[0] : NaN;
    };
    const std = period(flushStrip(preparedSetup(), 5));
    const long = period(flushStrip({ ...preparedSetup(), line: { ...preparedSetup().line, long: true } }, 5));
    expect(long).toBeGreaterThan(std * 1.5);
    const out = html(createElement(SetupPanel, { study: play(initialStudy("normal", "setup-underdamped-long-line"), { type: "setup-fast-flush" }), dispatch: noop }));
    expect(out).toContain("grid 40 ms");
    expect(out).toContain('class="monitor rounded-md"');
    expect(out).not.toContain("#4FD6EE");
  });

  it("the flush strip rings on an optimal line and not on an overdamped one", () => {
    const swings = (pts: { p: number }[]) => {
      let n = 0;
      for (let i = 2; i < pts.length; i++) if ((pts[i].p - pts[i - 1].p) * (pts[i - 1].p - pts[i - 2].p) < 0) n++;
      return n;
    };
    // turning points: the end of the flush, then one per oscillation on release
    expect(swings(flushStrip(initialStudy("normal").setup!, 5))).toBeGreaterThanOrEqual(3);
    expect(swings(flushStrip(initialStudy("normal", "setup-overdamped-air").setup!, 5))).toBeLessThanOrEqual(1);
  });
});

describe("TracePanel with the transducer set-up", () => {
  it("takes the study from the catheter controls, shows the set-up and reads through it", () => {
    const st = play(initialStudy("pah", "setup-v4-level"), { type: "rhc-advance" });
    const out = html(
      createElement(TracePanel, { scenario: studyScenario(st), shown: shownChambers(st), resp: true, pvc: false, onRecord: noop, children: createElement(CatheterPanel, { study: st, dispatch: noop }) })
    );
    expect(out).toContain("Transducer and manifold");
    const m = displayedMeasure(st, "RA");
    expect(out).toContain(`a${m.a} v${m.v} m${m.mean}`);
    // with the study passed directly, the same
    expect(html(createElement(TracePanel, { scenario: studyScenario(st), shown: shownChambers(st), resp: true, pvc: false, onRecord: noop, study: st, dispatch: noop }))).toContain("Transducer and manifold");
    // without a study it is the recorder it was
    expect(html(createElement(TracePanel, { scenario: studyScenario(st), shown: shownChambers(st), resp: true, pvc: false, onRecord: noop }))).not.toContain("Transducer and manifold");
  });

  it("a study set up before it began keeps the set-up panel collapsed: no manifold controls until opened", () => {
    const st = play(initialStudy("normal"), { type: "rhc-advance" });
    const out = html(createElement(TracePanel, { scenario: studyScenario(st), shown: shownChambers(st), resp: true, pvc: false, onRecord: noop, study: st, dispatch: noop }));
    expect(out).toContain("set up before the study");
    expect(out).not.toContain("Inspect the manifold");
    expect(out).not.toContain("Flush port");
    // a set-up preset shows the controls open
    const pre = initialStudy("normal", "setup-hidden-bubble");
    expect(html(createElement(TracePanel, { scenario: studyScenario(pre), shown: [], resp: true, pvc: false, onRecord: noop, study: pre, dispatch: noop }))).toContain("Inspect the manifold");
  });

  it("a set-up preset shows the line before any catheter; a normal study keeps the empty recorder", () => {
    const pre = initialStudy("normal", "setup-hidden-bubble");
    expect(html(createElement(TracePanel, { scenario: studyScenario(pre), shown: [], resp: true, pvc: false, onRecord: noop, study: pre, dispatch: noop }))).not.toContain("Insert the right heart catheter");
    const plain = initialStudy("normal");
    expect(html(createElement(TracePanel, { scenario: studyScenario(plain), shown: [], resp: true, pvc: false, onRecord: noop, study: plain, dispatch: noop }))).toContain("Insert the right heart catheter");
  });
});
