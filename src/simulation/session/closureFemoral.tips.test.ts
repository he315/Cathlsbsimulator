// access-closure-femoral-manual: tip integration and lesson links. The events the femoral closure raises are the
// session's own (CASE_SESSION_EVENTS in caseSession.ts: act-high, bleeding, haematoma) and the patient's
// (bradycardia, hypotension through the shared adapter and the emergencies module), declared for the
// reachability report through the full case's `raises` (src/ui/access/caseTips.ts reads CASE_SESSION_EVENTS).
import { describe, it, expect } from "vitest";
import { newCaseSession, CASE_SESSION_EVENTS, type CaseSession } from "./caseSession";
import { scriptVagal } from "./emergencies";
import { TIP_BY_ID, tipsFor, tipScore, type LabContext } from "../../content/lab/tips";
import { WAITING_TIPS, DEFERRED_RETARGETS, type LabRaises } from "../../content/lab/raisable/waiting";
import { caseTipContexts, raises as caseRaises } from "../../ui/access/caseTips";
import { practiceForLesson } from "../../ui/content/practiceIndex";
import { launch } from "./scenarios/closureFemoral.launch";
import { scenarios } from "./scenarios/closureFemoral";

const PACKAGE = "access-closure-femoral-manual";
const CLOSURE_TIPS = [
  "access-closure-sheath-stays",
  "access-closure-device-criteria",
  "access-closure-high-stick",
  "access-closure-reprep-skin",
  "access-compression-prepare",
  "access-compression-hands-above",
  "access-femoral-sheath-act",
  "access-vagal-prevention",
];
const EVENT_TIPS = ["access-compression-bleeding", "access-compression-vasovagal", "access-vasovagal-or-tamponade", "access-closure-hypotension-retroperitoneal"];

const closureCtx = (s: CaseSession): LabContext => ({ lab: "access", phase: "closure", route: "femoral", events: s.activeEvents() });
const ids = (ctx: LabContext) => tipsFor(ctx, 20).map((t) => t.id);
/** Does any of the case's access contexts at this workspace bring up the tip? */
const shownAt = (s: CaseSession, ws: Parameters<typeof caseTipContexts>[1], id: string) => caseTipContexts(s, ws).filter((c) => c.lab === "access").some((c) => tipScore(TIP_BY_ID[id], c) !== null);

describe("femoral closure tips in the full case", () => {
  it("in scenario closure-fem-standard, after the action that raises 'bradycardia', tipsFor(ctx, 20) includes access-compression-vasovagal and access-vasovagal-or-tamponade", () => {
    const s = newCaseSession({ scenario: "closure-fem-standard" }).session;
    expect(ids(closureCtx(s))).not.toContain("access-compression-vasovagal");
    // the action: the sheath pulled under the fingers, and a vagal reaction at the pull (scripted here by the test,
    // as the compression-vagal scenario's sheath-pull hook scripts it; the scenario itself is covered in
    // compression.test.ts)
    expect(s.startCompression()).toBe(true);
    scriptVagal(s, 1);
    for (let i = 0; i < 36 && !s.activeEvents().includes("bradycardia"); i++) s.tick(5);
    expect(s.activeEvents()).toContain("bradycardia");
    const got = ids(closureCtx(s));
    expect(got).toContain("access-compression-vasovagal");
    expect(got).toContain("access-vasovagal-or-tamponade");
    // the case's own closure context says the same
    expect(shownAt(s, "closure", "access-compression-vasovagal")).toBe(true);
    expect(shownAt(s, "closure", "access-vasovagal-or-tamponade")).toBe(true);
  });

  it("at the closure workspace of a femoral case the closure tips come up; a high ACT and blood under the fingers bring up their own", () => {
    const s = newCaseSession({ scenario: "compression-act-high" }).session;
    for (const id of CLOSURE_TIPS) expect(shownAt(s, "closure", id), id).toBe(true);
    // access-femoral-sheath-act is phase-driven (closure, femoral; no event in its 'when'), so it is up before any
    // ACT is measured and act-high does not change its score: this checks the event itself, not the tip
    expect(ids(closureCtx(s))).toContain("access-femoral-sheath-act");
    const sheathAct = TIP_BY_ID["access-femoral-sheath-act"];
    expect(sheathAct.when.event ?? []).not.toContain("act-high");
    s.measureAct();
    s.runPending();
    expect(s.activeEvents()).toContain("act-high");
    expect(tipScore(sheathAct, closureCtx(s))).toBe(tipScore(sheathAct, { ...closureCtx(s), events: [] }));
    // pressing on the skin nick, well below the arteriotomy: blood at the nick and a swelling
    s.startCompression();
    s.setHands({ xMm: s.compression!.hole.xMm - 15, pressure: 0.6 });
    for (let m = 0; m < 3; m++) {
      s.holdCompression(1);
      s.runPending();
    }
    expect(s.activeEvents()).toContain("bleeding");
    expect(ids(closureCtx(s))).toContain("access-compression-bleeding");
  });

  it("the tamponade look-alike's hypotension brings up the hypotension tips at the closure", () => {
    const s = newCaseSession({ scenario: "compression-tamponade-mimic" }).session;
    s.startCompression();
    for (let i = 0; i < 120 && !s.activeEvents().includes("hypotension"); i++) s.tick(5);
    expect(s.activeEvents()).toContain("hypotension");
    const got = ids(closureCtx(s));
    expect(got).toContain("access-vasovagal-or-tamponade");
    expect(got).toContain("access-closure-hypotension-retroperitoneal");
  });

  // a content check of the tip only: nothing in this lab raises the PCI context (not evidence of tip integration)
  it("the PCI context with bleeding shows pci-protamine-only-after-equipment-out (tip content check)", () => {
    expect(ids({ lab: "pci", events: ["bleeding"] })).toContain("pci-protamine-only-after-equipment-out");
  });

  it("the case declares the events the closure raises, with the closure phase and the femoral route", () => {
    expect(CASE_SESSION_EVENTS as readonly string[]).toContain("act-high");
    const access = caseRaises.find((r) => r.lab === "access")!;
    for (const e of ["act-high", "bleeding", "haematoma", "bradycardia", "hypotension"]) expect(access.events, e).toContain(e);
    expect(access.phases).toContain("closure");
    expect(access.phases).toContain("complication");
    expect(access.routes).toContain("femoral");
  });

  it("every waiting.ts entry naming access-closure-femoral-manual becomes satisfiable (there are none), and the package's tips are satisfiable by the case's raises", () => {
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PACKAGE);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PACKAGE);
    // no entry waits on this package, so the access lab's waiting count falls by at least their number (zero)
    expect(waiting.length + deferred.length).toBe(0);
    const access = caseRaises.find((r) => r.lab === "access")!;
    const satisfiable = (r: LabRaises, id: string) => {
      const w = TIP_BY_ID[id].when;
      if (w.phase?.length && !w.phase.some((p) => r.phases.includes(p))) return false;
      if (w.event?.length && !w.event.some((e) => r.events.includes(e))) return false;
      if (w.requires?.length && !w.requires.every((e) => r.events.includes(e))) return false;
      if (w.route?.length && !w.route.some((x) => (r.routes ?? []).includes(x))) return false;
      return true;
    };
    for (const id of [...CLOSURE_TIPS, ...EVENT_TIPS]) {
      expect(TIP_BY_ID[id], id).toBeDefined();
      expect(satisfiable(access, id), id).toBe(true);
    }
  });
});

describe("closure scenarios: launch metadata and the practice index", () => {
  it("practiceIndex lists the scenarios closure-fem-standard, closure-fem-high-stick, closure-fem-below-bif under lessons pm-closure-plan, pm-closure-femoral-compression, pm-antithrombotics-heparin (from src/simulation/session/scenarios/closureFemoral.launch.ts)", () => {
    for (const l of ["pm-closure-plan", "pm-closure-femoral-compression", "pm-antithrombotics-heparin"])
      for (const id of ["closure-fem-standard", "closure-fem-high-stick", "closure-fem-below-bif"]) expect(practiceForLesson(l).some((e) => e.sim === "procedure" && e.scenario === id), `${id} under ${l}`).toBe(true);
  });

  it("the launch file and the scenario file list the same eleven scenarios, with the same titles and lessons, all at 'closure'", () => {
    const fromLaunch = (launch.scenarios ?? []).map((x) => ({ id: x.id, title: x.title, lessonIds: x.lessonIds }));
    expect(fromLaunch).toEqual(scenarios.map((x) => ({ id: x.id, title: x.title, lessonIds: x.lessonIds })));
    expect(scenarios).toHaveLength(11);
    for (const sc of scenarios) expect(sc.start, sc.id).toBe("closure");
    for (const sc of launch.scenarios ?? []) for (const l of sc.lessonIds) expect(practiceForLesson(l).some((e) => e.scenario === sc.id), `${sc.id} under ${l}`).toBe(true);
  });
});
