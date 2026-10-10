// The right heart catheter controls (haemo-rhc-manoeuvre): the hands-on controls, the fluoroscopy and
// ECG strip render from the catheter, nothing on the live screen names a position or a complication,
// and the passage's debrief names them once the study is submitted.
//   npx vitest run src/ui/haemo/catheterPanel.rhc.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { haemoStudyReducer, initialStudy } from "../../simulation/haemoStudy";
import { RHC_STEP, initialRhc, rhcStep, type RhcAction, type RhcState } from "../../simulation/rightHeartCatheter";
import CatheterPanel, { RhcDebrief, isNewStudy } from "./CatheterPanel";
import RhcFluoro, { beats, drawnLead, heldFrame, tipPoint } from "./RhcFluoro";

const noop = () => undefined;
const html = (el: Parameters<typeof renderToString>[0]) => renderToString(el).replace(/<!-- -->/g, "");
const play = (st: RhcState, ...as: RhcAction[]) => as.reduce((s, a) => rhcStep(s, a, s.t + 1, { resp: false, hr: 70 }), st);

describe("the right heart catheter controls", () => {
  it("render the hands-on controls, the two fluoroscopy views and the ECG strip, without naming a position or complication", () => {
    const out = html(createElement(CatheterPanel, { study: initialStudy("normal"), dispatch: noop }));
    for (const s of ["Right heart catheter", "multipurpose", "balloon-tipped", "pigtail", "femoral vein", "Flush and connect", "Insert", "Advance", "Push", "Withdraw", "Turn", "Ask for a deep breath", "Pass a soft J wire", "Call an experienced operator", "Pull it tight", "Remove with the sheath", "Synchronised shock", "ECG II", "AP", "LAT"])
      expect(out, s).toContain(s);
    expect(out).not.toMatch(/knot|renal|hepatic|side branch|outflow|fibrillation/i);
    // before flushing nothing nudges the learner towards Insert
    const insertClass = /<button[^>]*class="([^"]*)"[^>]*>Insert<\/button>/.exec(out)?.[1];
    expect(insertClass).toBeDefined();
    expect(insertClass).not.toMatch(/btn-accent/);
    // the left heart and the old controls the other packages rely on are still there
    expect(out).toContain("cross into LV");
    expect(out).toContain("sheath side-arm");
    expect(out).toContain("wedge");
  });

  it("the fluoroscopy draws the extra zones from the end of the lead zone they leave, and the ECG strip has beats in every rhythm", () => {
    const inBranch = play({ ...initialRhc("rhc-femoral-mp", 3) }, { type: "insert" }, ...Array.from({ length: 8 }, () => ({ type: "advance", cm: RHC_STEP.firm }) as RhcAction));
    expect(inBranch.extra).toBe("renal");
    expect(drawnLead(inBranch)?.zone).toBe("ivc");
    expect(tipPoint(inBranch, "ap")).not.toBeNull();
    const img = html(createElement(RhcFluoro, { st: inBranch, now: inBranch.t, sinusRate: 70, live: true }));
    expect(img).toContain("FLUORO");
    // a rhythm log with each kind: beats in each window
    const log: RhcState = { ...initialRhc(), rhythm: [{ t: 0, kind: "sinus", rate: 70 }, { t: 10, kind: "vt", rate: 180 }, { t: 20, kind: "af", rate: 160 }, { t: 30, kind: "ectopy", rate: 70 }] };
    for (const [a, b] of [[2, 8], [12, 18], [22, 28], [32, 38]]) expect(beats(log, a, b, 70).filter((x) => x.t >= a && x.t <= b).length, `${a}-${b}`).toBeGreaterThan(3);
    const vt = beats(log, 12, 18, 70).filter((x) => x.t >= 12);
    expect(vt.every((x) => x.wide)).toBe(true);
  });

  it("the debrief names a knot pulled tight before help as critical", () => {
    let st = initialRhc("rhc-knot-risk", 11);
    for (let i = 0; i < 60 && !st.knot; i++) st = rhcStep(st, { type: "rotate", deg: i % 2 ? 90 : -90 }, i + 1, { resp: false });
    st = rhcStep(st, { type: "pull-tight" }, st.t + 1, { resp: false });
    const out = html(createElement(RhcDebrief, { st }));
    expect(out).toContain("Right heart passage debrief");
    expect(out).toContain("Critical:");
    expect(out).toMatch(/pulled tight before help/);
    expect(out).toContain("A knot formed.");
  });

  it("a new study is told apart from toggles on a fresh one: resp, art-line, extrasystoles, raises and the answer keep the passage", () => {
    const fresh = initialStudy("normal");
    const seen = fresh.sets;
    expect(isNewStudy(null, fresh)).toBe(true);
    for (const a of [{ type: "resp", on: false }, { type: "art-line", on: true }, { type: "pvc", on: true }, { type: "raise", event: "engage-fail" }, { type: "answer", index: 0 }] as const) {
      const next = haemoStudyReducer(fresh, a);
      expect(next, a.type).not.toBe(fresh);
      expect(next.lastAction, a.type).toBe("start");
      expect(isNewStudy(seen, next), a.type).toBe(false);
    }
    // a load of the same scenario (a repeat), or another one, is a new study
    expect(isNewStudy(seen, haemoStudyReducer(fresh, { type: "load", scenarioId: "normal" }))).toBe(true);
    expect(isNewStudy(seen, initialStudy("normal"))).toBe(true);
    // once the study has moved on from its start, nothing is a new study until a load
    expect(isNewStudy(seen, haemoStudyReducer(fresh, { type: "rhc-advance" }))).toBe(false);
  });

  it("the ECG strip's beats keep their times as the window scrolls", () => {
    const log: RhcState = {
      ...initialRhc(),
      rhythm: [{ t: 0, kind: "sinus", rate: 70 }, { t: 9.3, kind: "ectopy", rate: 70 }, { t: 12.4, kind: "af", rate: 160 }, { t: 14.1, kind: "vt", rate: 180 }, { t: 15.2, kind: "sinus", rate: 70 }],
    };
    const inOverlap = (bs: ReturnType<typeof beats>, a: number, b: number) => bs.filter((x) => x.t >= a && x.t <= b).map((x) => `${x.t.toFixed(6)}:${x.kind}:${x.wide}`);
    for (const [a0, a1, b0, b1] of [[10.75, 16.75, 11, 17], [3.1, 9.1, 3.9, 9.9], [6, 12, 6.25, 12.25]]) {
      const x = inOverlap(beats(log, a0, a1, 70), b0, a1);
      const y = inOverlap(beats(log, b0, b1, 70), b0, a1);
      expect(x.length, `${a0}`).toBeGreaterThan(2);
      expect(y, `${a0}`).toEqual(x);
    }
  });

  it("without screening the image holds the last frame: the lead and the overlay stay where they were", () => {
    const at = play({ ...initialRhc(null, 2), flushed: true, sideBranchHazard: 0 }, { type: "insert" }, { type: "advance", cm: RHC_STEP.firm });
    const on = (st: RhcState, live: boolean) => html(createElement(RhcFluoro, { st, now: st.t, sinusRate: 70, live }));
    const moved = play(at, { type: "advance", cm: RHC_STEP.firm }, { type: "advance", cm: RHC_STEP.firm });
    expect(on(moved, true)).not.toBe(on(at, true));
    // screening stops at `at`; the catheter moves on; the frame held is still `at`, until screening resumes
    let frame = heldFrame(at, at, true);
    frame = heldFrame(frame, moved, false);
    expect(frame).toBe(at);
    expect(on(frame, false)).not.toBe(on(moved, false));
    expect(heldFrame(frame, moved, true)).toBe(moved);
    // with the catheter out there is nothing to hold
    const out = { ...moved, inserted: false };
    expect(heldFrame(frame, out, false)).toBe(out);
    const held = on(at, false);
    expect(held).toContain("LIH");
    expect(held).toContain('opacity="0.75"');
  });
});
