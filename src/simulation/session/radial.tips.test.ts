// access-radial-sequence: tip integration and practice links. The events the radial sequence raises are the
// session's own (CASE_SESSION_EVENTS in caseSession.ts: radial-spasm, radial-loop, perforation, bleeding,
// wire-resistance), declared for the reachability report through the full case's `raises`
// (src/ui/access/caseTips.ts reads CASE_SESSION_EVENTS); the extremely tortuous arm's subclavian tortuosity is
// its scenario's scripted case property.
//   npx vitest run src/simulation/session/radial.tips.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession, CASE_SESSION_EVENTS, type CaseSession } from "./caseSession";
import { aimedPose } from "./autopilot";
import { TIP_BY_ID, tipsFor, type LabContext } from "../../content/lab/tips";
import { WAITING_TIPS, DEFERRED_RETARGETS, type LabRaises } from "../../content/lab/raisable/waiting";
import { caseTipContexts, raises as caseRaises } from "../../ui/access/caseTips";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";
import { launch as radialLaunch } from "./scenarios/radial.launch";
import { SCENARIO_BY_ID } from "./scenarios/index";

const PACKAGE = "access-radial-sequence";
/** The tips the plan's tip integration names for this package. */
const PLAN_TIPS = [
  "access-radial-one-ml-local",
  "access-radial-puncture-spasm",
  "access-radial-wire-resists",
  "access-radial-thin-sheath-vasodilator",
  "access-radial-heparin-timing",
  "access-cx-radial-loop-bat",
  "access-cx-radial-perforation-cover",
  "access-radial-spasm-no-traction",
];

const ids = (ctx: LabContext) => tipsFor(ctx, 20).map((t) => t.id);
/** The case's access contexts at a workspace now. */
const access = (s: CaseSession, w: Parameters<typeof caseTipContexts>[1]) => caseTipContexts(s, w).filter((c) => c.lab === "access");

describe("radial tips in the full case", () => {
  it("in scenario radial-normal, after the action that raises 'radial-spasm', tipsFor(ctx, 20) includes access-radial-puncture-spasm", () => {
    const { session: s } = newCaseSession({ scenario: "radial-normal" });
    const [before] = access(s, "access");
    expect(before.phases).toEqual(["radial"]);
    expect(ids(before)).toContain("access-radial-one-ml-local");
    expect(ids(before)).not.toContain("access-radial-puncture-spasm");
    // the action: repeated painful passes without local anaesthetic, then a needle move into the tight artery
    const miss = { ...aimedPose(s), entryY: aimedPose(s).entryY + 8 };
    for (let k = 0; k < 4 && !s.activeEvents().includes("radial-spasm"); k++) {
      s.placeNeedle(miss);
      s.advanceNeedle(6);
      s.advanceNeedle(-6);
      s.wait(5);
      s.runPending();
      s.placeNeedle(miss);
      s.advanceNeedle(1);
      s.advanceNeedle(-1);
    }
    expect(s.activeEvents()).toContain("radial-spasm");
    const [ctx] = access(s, "access");
    expect(ctx.events).toContain("radial-spasm");
    expect(ids(ctx)).toContain("access-radial-puncture-spasm");
    // the spasm also opens the access complication context, where the no-traction tip is written
    expect(access(s, "access").some((c) => c.phase === "complication" && ids(c).includes("access-radial-spasm-no-traction"))).toBe(true);
  });

  it("after the action that raises 'radial-loop' (radial-loop: a forearm image of the loop), tipsFor(ctx, 20) includes access-cx-radial-loop-bat", () => {
    const { session: s } = newCaseSession({ scenario: "radial-loop" });
    s.prepCatheter("TIG");
    s.runPending();
    s.loadCatheter("TIG");
    s.beamOn = true;
    s.tipImaged = true;
    const loop = s.route.segments.find((x) => x.id === "loop")!;
    for (let i = 0; i < 300 && s.wire.pos < loop.start; i++) {
      s.commandWire(1.2, 0);
      s.commandCatheter(1.2);
      s.tick(0.033);
    }
    expect(s.activeEvents()).not.toContain("radial-loop");
    s.forearmAngiogram();
    expect(s.activeEvents()).toContain("radial-loop");
    const [ctx] = access(s, "fluoro");
    expect(ctx).toMatchObject({ lab: "access", phase: "wire", route: "radial" });
    expect(ids(ctx)).toContain("access-cx-radial-loop-bat");
    // at the access workspace (the radial site, the sheath in) the forearm resistance tip is there too
    const [atAccess] = access(s, "access");
    expect(atAccess.phases).toEqual(["radial"]);
    expect(ids(atAccess)).toEqual(expect.arrayContaining(["access-cx-radial-loop-bat", "access-radial-wire-resists"]));
  });

  it("the perforation's tip comes with the leak and goes once it is sealed", () => {
    const { session: s } = newCaseSession({ scenario: "radial-forced-perforation" });
    const has = () => access(s, "fluoro").some((c) => ids(c).includes("access-cx-radial-perforation-cover"));
    expect(has()).toBe(true);
    s.beamOn = true;
    s.tipImaged = true;
    expect(s.startBat(4)).toBe(true);
    s.runPending();
    for (let i = 0; i < 400 && s.radialSeq.bat; i++) {
      s.advanceBat(1.2);
      s.tick(0.033);
    }
    s.sealPerforation("catheter");
    s.runPending();
    s.tick(2);
    expect(has()).toBe(false);
  });

  it("radial-tortuous-extreme: the diagnostic lab's heparin tip for a tortuous arm appears in the case, beside the access heparin tip", () => {
    const { session: s } = newCaseSession({ scenario: "radial-tortuous-extreme" });
    expect(caseTipContexts(s, "table").some((c) => c.lab === "diagnostic" && ids(c).includes("diag-delay-heparin-tortuous-arm"))).toBe(true);
    expect(access(s, "access").some((c) => ids(c).includes("access-radial-heparin-timing"))).toBe(true);
  });

  it("every waiting.ts entry naming access-radial-sequence becomes satisfiable (there are none), and the plan's tips are satisfiable by the case's raises", () => {
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PACKAGE);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PACKAGE);
    // no entry waits on this package, so the access lab's waiting count falls by at least their number (zero)
    expect(waiting.length + deferred.length).toBe(0);
    for (const e of ["radial-spasm", "radial-loop", "perforation", "bleeding", "wire-resistance"] as const) expect(CASE_SESSION_EVENTS as readonly string[]).toContain(e);
    const acc = caseRaises.find((r) => r.lab === "access")!;
    const satisfiable = (r: LabRaises, id: string) => {
      const w = TIP_BY_ID[id].when;
      if (w.phase?.length && !w.phase.some((p) => r.phases.includes(p))) return false;
      if (w.event?.length && !w.event.some((e) => r.events.includes(e))) return false;
      if (w.requires?.length && !w.requires.every((e) => r.events.includes(e))) return false;
      if (w.route?.length && !w.route.some((x) => (r.routes ?? []).includes(x))) return false;
      return true;
    };
    for (const id of PLAN_TIPS) {
      expect(TIP_BY_ID[id], id).toBeDefined();
      expect(satisfiable(acc, id), id).toBe(true);
    }
  });
});

describe("radial practice links", () => {
  const LESSONS = ["pm-access-radial-puncture", "pm-access-radial-sheath", "pm-engaging-spasm"];

  it("practiceIndex lists the scenarios radial-normal, radial-small, radial-anxious-young under lessons pm-access-radial-puncture, pm-access-radial-sheath, pm-engaging-spasm (from src/simulation/session/scenarios/radial.launch.ts)", () => {
    for (const lessonId of LESSONS)
      for (const id of ["radial-normal", "radial-small", "radial-anxious-young"]) {
        const e = practiceForLesson(lessonId).filter((x) => x.sim === "procedure" && x.scenario === id);
        expect(e.length, `${id} under ${lessonId}`).toBeGreaterThan(0);
        expect(e[0].source).toMatch(/radial\.launch\.ts$/);
      }
  });

  it("every radial scenario is declared in the launch file with its title and lessons, and listed under them", () => {
    const decl = new Map((radialLaunch.scenarios ?? []).map((x) => [x.id, x]));
    const all = ["radial-normal", "radial-small", "radial-anxious-young", "radial-lima-left", "radial-no-supination", "radial-bleb", "radial-loop", "radial-tortuous-extreme", "radial-forced-perforation"];
    expect([...decl.keys()].sort()).toEqual([...all].sort());
    for (const id of all) {
      const sc = SCENARIO_BY_ID[id];
      expect(sc, id).toBeDefined();
      expect(decl.get(id)?.title, id).toBe(sc.title);
      expect(decl.get(id)?.lessonIds, id).toEqual(sc.lessonIds);
      expect(PRACTICE_INDEX.known.scenarios.get("procedure")?.has(id), id).toBe(true);
      for (const l of sc.lessonIds) expect(practiceForLesson(l).some((e) => e.sim === "procedure" && e.scenario === id), `${id} under ${l}`).toBe(true);
    }
  });
});
