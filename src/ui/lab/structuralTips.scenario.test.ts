// Tip integration of the structural lab, driven from scenarios of
// src/content/lab/presets/structural/core.launch.ts (structural-tips-and-tavi-course): the launch
// links and the practice index, the course tips in the coronary obstruction scenario, and the
// waiting.ts entries this package was expected to make satisfiable.
//   npx vitest run src/ui/lab/structuralTips.scenario.test.ts
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabContext, type LabEvent, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { buildKnownLaunch } from "../../content/validateLaunch";
import { launch } from "../../content/lab/presets/structural/core.launch";
import { TAVI_SCENARIOS, assessTavi, courseRng, taviCourse } from "../../simulation/tavi";
import { TEER_SCENARIOS } from "../../simulation/teer";
import { LAAO_PRESET_IDS, LAAO_SCENARIOS } from "../../simulation/laao";
import { practiceForLesson } from "../content/practiceIndex";
import StructuralLab, { resolveStructuralLaunch } from "../sections/StructuralLab";
import TaviLab from "../structural/TaviLab";
import TeerLab from "../structural/TeerLab";
import LaaoLab from "../structural/LaaoLab";
import { RootInjectionView } from "../structural/TaviViews";
import { LAAO_STEPS, TAVI_STEPS, TEER_STEPS, laaoTipContext, raises, taviTipContext, teerTipContext } from "./structuralTips";

const PKG = "structural-tips-and-tavi-course";
const TAVI_LESSONS = ["hb-tavi-candidate", "hb-tavi-workup", "hb-tavi-procedure"];

/** The same rule as reachability.test.ts: a trigger can match given what a lab raises. */
function satisfiable(tip: LabTip, when: TipTrigger, r: LabRaises): boolean {
  if (tip.lab !== r.lab) return false;
  const any = (want: readonly string[] | undefined, have: readonly string[] | undefined) => !want?.length || want.some((x) => (have ?? []).includes(x));
  return (
    any(when.phase, r.phases) &&
    any(when.event, r.events) &&
    (when.requires ?? []).every((e) => r.events.includes(e)) &&
    any(when.procedure, r.procedures) &&
    any(when.route, r.routes) &&
    any(when.technique, r.techniques) &&
    any(when.imaging, r.imaging)
  );
}

const WAITING = WAITING_TIPS.filter((g) => g.raisedBy === PKG).flatMap((g) => g.tips);

/**
 * Waiting tips that the reachability report counts as satisfiable from the lab's merged raises, but
 * that no structural context shows yet: transseptal tips drawn for the position or complication phase
 * or for a patient event, while the TEER and LAAO puncture is a single access step with no events.
 * structural-transseptal-hands-on builds the transseptal steps and events they need.
 */
const UNION_ONLY: Record<string, string> = {
  "structural-ts-two-movements": "position with the transseptal procedure",
  "structural-ts-resistant-wire-first": "position with the transseptal procedure",
  "structural-ts-aortic-puncture-hold": "position or complication with the transseptal procedure",
  "structural-ts-vagal-st": "st-elevation or bradycardia during the transseptal puncture",
  "structural-ts-posterior-delayed-tamponade": "hypotension with the transseptal procedure",
};

describe("launch links", () => {
  const ids = launch.scenarios!.map((x) => x.id);

  it("declares every TAVI, TEER and LAAO scenario, and only those, under the tavi sim", () => {
    expect(launch.sim).toBe("tavi");
    // structural-laao-device-mechanics declares its presets in laao.launch.ts (structuralTips.laao.test.ts checks them)
    const all = [...TAVI_SCENARIOS, ...TEER_SCENARIOS, ...LAAO_SCENARIOS].map((x) => x.id).filter((id) => !(LAAO_PRESET_IDS as readonly string[]).includes(id));
    expect(ids.slice().sort()).toEqual(all.slice().sort());
    expect(ids).toContain("tavi-coronary-obstruction");
    const known = buildKnownLaunch({ "core.launch.ts": { launch } });
    expect(known.problems).toEqual([]);
  });

  it("each scenario starts at its first step; the obstruction scenario at assess", () => {
    for (const sc of launch.scenarios!) {
      const starts = (sc.starts ?? []).map((x) => (typeof x === "string" ? x : x.id));
      if (sc.id === "tavi-coronary-obstruction") expect(starts).toEqual(["assess"]);
      else if (sc.id.startsWith("tavi-")) expect(starts).toEqual(["plan"]);
      else if (sc.id.startsWith("teer-")) expect(starts).toEqual(["plan"]);
      else expect(starts).toEqual(["measure"]);
      for (const st of starts) expect([...TAVI_STEPS, ...TEER_STEPS, ...LAAO_STEPS] as string[]).toContain(st);
    }
  });

  it("practiceIndex lists every TAVI scenario in core.launch.ts under lessons hb-tavi-candidate, hb-tavi-workup, hb-tavi-procedure", () => {
    for (const lessonId of TAVI_LESSONS) {
      const listed = practiceForLesson(lessonId).filter((e) => e.source.endsWith("presets/structural/core.launch.ts")).map((e) => e.scenario);
      for (const sc of TAVI_SCENARIOS) expect(listed, `${sc.id} under ${lessonId}`).toContain(sc.id);
    }
  });

  it("practiceIndex lists every scenario in core.launch.ts under each lesson it names", () => {
    for (const sc of launch.scenarios!)
      for (const lessonId of sc.lessonIds) {
        const entries = practiceForLesson(lessonId).filter((e) => e.sim === "tavi" && e.scenario === sc.id);
        expect(entries.length, `${sc.id} under ${lessonId}`).toBeGreaterThan(0);
        expect(entries[0].params.scenario).toBe(sc.id);
      }
  });

  it("a launch for any of the three sims opens the procedure that owns the scenario", () => {
    expect(resolveStructuralLaunch("tavi", { scenario: "teer-fmr" })).toEqual({ tab: "teer", scenario: "teer-fmr", start: null, mode: null });
    expect(resolveStructuralLaunch("teer", { scenario: "laao-cactus", mode: "exam" })).toMatchObject({ tab: "laao", scenario: "laao-cactus", mode: "exam" });
    expect(resolveStructuralLaunch("laao", { scenario: "tavi-coronary-obstruction", start: "assess" })).toMatchObject({ tab: "tavi", start: "assess" });
    expect(resolveStructuralLaunch("tavi", { scenario: "tavi-standard", step: "plan", mode: "nonsense" })).toMatchObject({ tab: "tavi", start: "plan", mode: null });
    expect(resolveStructuralLaunch("teer", { scenario: "no-such-case" })).toEqual({ tab: "teer", scenario: null, start: null, mode: null });
  });

  it("the lab and its three procedures render", () => {
    expect(renderToString(createElement(StructuralLab))).toContain("Structural heart lab");
    expect(renderToString(createElement(TaviLab, {}))).toContain("Planning CT");
    expect(renderToString(createElement(TeerLab, {}))).toContain("Baseline TOE");
    expect(renderToString(createElement(LaaoLab, {}))).toContain("Measure at each angle");
  });

  it("the root injection names the vessels and the view, and its accessible name describes what is opacified", () => {
    const before = renderToString(createElement(RootInjectionView, { injection: null }));
    expect(before).toContain("LCA");
    expect(before).toContain("RCA");
    expect(before).toContain("LAO projection");
    const blocked = renderToString(createElement(RootInjectionView, { injection: { t: 75, leftFills: false, rightFills: true } }));
    expect(blocked).toContain('aria-label="Root injection at 1:15, LAO projection: right coronary opacified to its branches; left coronary ostium only"');
    const open = renderToString(createElement(RootInjectionView, { injection: { t: 75, leftFills: true, rightFills: true } }));
    expect(open).toContain("left coronary opacified to its branches");
    expect(open).not.toContain("ostium only");
  });
});

describe("tips in a scenario", () => {
  const s = TAVI_SCENARIOS.find((x) => x.id === "tavi-coronary-obstruction")!;

  it("in 'tavi-coronary-obstruction', after the release that raises 'hypotension', tipsFor(ctx, 20) includes structural-tavi-hypotension-coronary; at assess it includes structural-tavi-pacing-wire-decision", () => {
    const course = taviCourse(s, s.deployed!, assessTavi(s, s.deployed!), courseRng(s.id));
    // before: rapid pacing still running, the course raises nothing
    const before = taviTipContext({ step: "assess", course, courseT: 1 })!;
    expect(before.events).toEqual([]);
    expect(tipsFor(before, 20).map((t) => t.id)).not.toContain("structural-tavi-hypotension-coronary");
    expect(tipsFor(before, 20).map((t) => t.id)).toContain("structural-tavi-pacing-wire-decision");
    // the action: the valve was released and pacing stopped; the pressure stays low
    const ctx = taviTipContext({ step: "assess", course, courseT: 45 })!;
    expect(ctx.events).toContain("hypotension");
    const ids = tipsFor(ctx, 20).map((t) => t.id);
    expect(ids).toContain("structural-tavi-hypotension-coronary");
    expect(ids).toContain("structural-tavi-pacing-wire-decision");
    expect(ids[0]).toBe("structural-tavi-hypotension-coronary");
  });

  it("every waiting.ts entry naming this package becomes satisfiable", () => {
    expect(WAITING.length).toBeGreaterThan(30);
    const nowSatisfiable = WAITING.filter((id) => TIP_BY_ID[id] && satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, raises));
    expect(WAITING.filter((id) => !nowSatisfiable.includes(id))).toEqual([]);
    // the reachability waiting count for the structural lab falls by their number
    expect(nowSatisfiable.length).toBe(WAITING.length);
    // without this package's raises none of them is satisfiable
    const none: LabRaises = { lab: "structural", phases: [], events: [] };
    expect(WAITING.filter((id) => TIP_BY_ID[id] && satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, none))).toEqual([]);
  });

  it("which waiting tips a structural context can actually show now (the union over-approximates)", () => {
    const subsets = (xs: LabEvent[]): LabEvent[][] => xs.reduce<LabEvent[][]>((acc, x) => [...acc, ...acc.map((a) => [...a, x])], [[]]);
    const ctxs: (LabContext | null)[] = [];
    // TAVI: every step, and at assess every course scenario at every second
    for (const step of TAVI_STEPS) ctxs.push(taviTipContext({ step }));
    for (const sc of TAVI_SCENARIOS) {
      const p = sc.deployed ?? { access: "transfemoral" as const, platform: "balloon-expandable" as const, sizeMm: 26, targetDepthMm: 3, finalDepthMm: 6, predilatation: false, postDilatation: false, rapidPacing: true, coronaryProtection: false };
      const course = taviCourse(sc, p, assessTavi(sc, p), courseRng(sc.id));
      for (let t = 0; t <= course.durationS; t += 5) ctxs.push(taviTipContext({ step: "assess", course, courseT: t }));
    }
    // the course events in any combination at assess
    for (const e of subsets(["hypotension", "st-elevation", "bradycardia", "av-block"])) ctxs.push({ lab: "structural", phase: "assess", phases: e.length ? ["complication"] : undefined, procedures: ["tavi"], events: e });
    for (const step of TEER_STEPS) ctxs.push(teerTipContext({ step }));
    for (const step of LAAO_STEPS) ctxs.push(laaoTipContext({ step }), laaoTipContext({ step, unsheathed: true }));
    const shown = new Set(ctxs.flatMap((c) => (c ? tipsFor(c, 1000).map((t) => t.id) : [])));
    const unionOnly = WAITING.filter((id) => !shown.has(id));
    expect(unionOnly.sort()).toEqual(Object.keys(UNION_ONLY).sort());
  });

  it("raises no more than this package builds: the structural tips waiting on later packages stay unsatisfiable", () => {
    // structural packages built since this one raise their own tips (their tests check them); the rest wait
    const built = new Set([PKG, "structural-transseptal-hands-on"]);
    const later = WAITING_TIPS.filter((g) => g.lab === "structural" && !built.has(g.raisedBy)).flatMap((g) => g.tips);
    expect(later.length).toBeGreaterThan(5);
    for (const id of later) expect(satisfiable(TIP_BY_ID[id], TIP_BY_ID[id].when, raises), id).toBe(false);
    // every structural tip is either this package's or waits on a later one
    const listed = new Set(WAITING_TIPS.flatMap((g) => g.tips));
    expect(LAB_TIPS.filter((t) => t.lab === "structural" && !listed.has(t.id)).map((t) => t.id)).toEqual([]);
  });
});
