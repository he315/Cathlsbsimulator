// access-femoral-puncture: tip integration and practice links. The events the femoral puncture raises
// are the session's own (CASE_SESSION_EVENTS in caseSession.ts), declared for the reachability report
// through the full case's `raises` (src/ui/access/caseTips.ts reads CASE_SESSION_EVENTS).
import { describe, it, expect } from "vitest";
import { newCaseSession, CASE_SESSION_EVENTS, type CaseSession } from "./caseSession";
import { aimedPose, advanceToFlash, markFemoralHead } from "./autopilot";
import { tubeAt } from "../access/site";
import { TIP_BY_ID, tipsFor, tipScore, type LabContext } from "../../content/lab/tips";
import { WAITING_TIPS, DEFERRED_RETARGETS, type LabRaises } from "../../content/lab/raisable/waiting";
import { caseTipContexts, raises as caseRaises } from "../../ui/access/caseTips";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";
import { launch as femoralLaunch } from "./scenarios/femoral.launch";
import { SCENARIO_BY_ID } from "./scenarios/index";

const PACKAGE = "access-femoral-puncture";
const REQUEST_TIPS = [
  // pm-access#1
  "access-femoral-head-marker",
  "access-femoral-scan-bifurcation",
  "access-femoral-deep-move-caudal",
  "access-needle-flashback-check",
  // pm-access#2
  "access-femoral-vein-redirect",
  "access-femoral-screen-micro-wire",
  "access-femoral-repuncture-wrong-height",
  "access-wire-never-push",
];

/** The access contexts the full case reports at the access workspace now. */
const accessCtxs = (s: CaseSession): LabContext[] => caseTipContexts(s, "access").filter((c) => c.lab === "access");
/** Does any of the case's access contexts at the access workspace bring up this tip? */
const shown = (s: CaseSession, id: string) => accessCtxs(s).some((c) => tipScore(TIP_BY_ID[id], c) !== null);

describe("femoral puncture tips in the full case", () => {
  it("in scenario fem-normal, at phase 'femoral', tipsFor(ctx, 20) includes access-femoral-head-marker and access-femoral-scan-bifurcation", () => {
    const s = newCaseSession({ scenario: "fem-normal" }).session;
    const { site, route } = s.accessStep();
    expect(site).toBe("femoral");
    const ctx: LabContext = { lab: "access", phase: "femoral", route, events: s.activeEvents() };
    const ids = tipsFor(ctx, 20).map((t) => t.id);
    expect(ids).toContain("access-femoral-head-marker");
    expect(ids).toContain("access-femoral-scan-bifurcation");
    // the case's own context at the access workspace reports the femoral site with the puncture step
    const own = accessCtxs(s)[0];
    expect(own.phase).toBe("puncture");
    expect(own.phases).toEqual(["femoral"]);
    const ownIds = tipsFor(own, 20).map((t) => t.id);
    expect(ownIds).toContain("access-femoral-head-marker");
    expect(ownIds).toContain("access-femoral-scan-bifurcation");
  });

  it("every tip of the two lab requests is brought up by the case at the step it belongs to", () => {
    // the femoral site at the puncture: the femoral tips and the hub check
    const s = newCaseSession({ scenario: "fem-deep-4cm" }).session;
    for (const id of ["access-femoral-head-marker", "access-femoral-scan-bifurcation", "access-femoral-deep-move-caudal", "access-needle-flashback-check", "access-femoral-screen-micro-wire", "access-femoral-repuncture-wrong-height"]) expect(shown(s, id), id).toBe(true);
    // dark blood at the hub: redirect laterally
    const v = newCaseSession({ scenario: "fem-normal" }).session;
    expect(shown(v, "access-femoral-vein-redirect")).toBe(false);
    v.pm.probe.pressure = 0;
    const vein = v.site.tubes.find((t) => t.id === "cfv")!;
    const x = (v.site.landmarks.targetFrom + v.site.landmarks.targetTo) / 2;
    const c = tubeAt(vein, x);
    const L = c.z / Math.sin(Math.PI / 4);
    v.placeNeedle({ entryX: x - L * Math.cos(Math.PI / 4), entryY: c.y, angleDeg: 45, yawDeg: 0 });
    for (let i = 0; i < 700 && v.flashback().kind === "none"; i++) v.advanceNeedle(0.1);
    expect(v.activeEvents()).toContain("venous-flashback");
    expect(shown(v, "access-femoral-vein-redirect")).toBe(true);
    // the wire at the needle: never push against resistance
    const w = newCaseSession({ scenario: "fem-normal" }).session;
    markFemoralHead(w);
    w.placeNeedle(aimedPose(w));
    expect(advanceToFlash(w)).toBe(true);
    w.advanceNeedle(0.6);
    w.advanceAccessWire(5);
    expect(w.accessStep().step).toBe("wire");
    expect(shown(w, "access-wire-never-push")).toBe(true);
  });

  it("the case declares the events the femoral puncture raises, with the femoral phase and route", () => {
    for (const e of ["wrong-height", "wire-misdirected", "wire-resistance", "venous-flashback", "no-flashback"] as const) expect(CASE_SESSION_EVENTS as readonly string[]).toContain(e);
    const access = caseRaises.find((r) => r.lab === "access")!;
    for (const e of ["wrong-height", "wire-misdirected", "wire-resistance", "venous-flashback", "no-flashback"]) expect(access.events, e).toContain(e);
    expect(access.phases).toContain("femoral");
    expect(access.routes).toContain("femoral");
  });

  it("every waiting.ts entry naming access-femoral-puncture becomes satisfiable (there are none), and the request tips are satisfiable by the case's raises", () => {
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
    for (const id of REQUEST_TIPS) {
      expect(TIP_BY_ID[id], id).toBeDefined();
      expect(satisfiable(access, id), id).toBe(true);
    }
  });
});

describe("femoral puncture practice links", () => {
  const LESSONS = ["pm-access-femoral-puncture", "pm-access-seldinger", "pm-access-femoral-sheath"];

  it("practiceIndex lists fem-normal, fem-high-bif and fem-calcified-anterior under pm-access-femoral-puncture, pm-access-seldinger and pm-access-femoral-sheath (from femoral.launch.ts)", () => {
    for (const lessonId of LESSONS)
      for (const id of ["fem-normal", "fem-high-bif", "fem-calcified-anterior"]) {
        const e = practiceForLesson(lessonId).filter((x) => x.sim === "procedure" && x.scenario === id);
        expect(e.length, `${id} under ${lessonId}`).toBeGreaterThan(0);
        expect(e[0].source).toMatch(/femoral\.launch\.ts$/);
      }
  });

  it("every femoral scenario is declared in the launch file with its title and lessons, and listed under them", () => {
    const decl = new Map((femoralLaunch.scenarios ?? []).map((x) => [x.id, x]));
    for (const id of ["fem-normal", "fem-high-bif", "fem-calcified-anterior", "fem-deep-4cm", "fem-shallow-2cm", "fem-plugged-needle", "fem-micro-wire-iea", "fem-micro-wire-lcia", "fem-micro-wire-down-leg", "fem-entry-below-head"]) {
      const sc = SCENARIO_BY_ID[id];
      expect(sc, id).toBeDefined();
      expect(decl.get(id)?.title, id).toBe(sc.title);
      expect(PRACTICE_INDEX.known.scenarios.get("procedure")?.has(id), id).toBe(true);
      // listed under the scenario's own lessons, by its entry or by a link
      for (const l of sc.lessonIds) expect(practiceForLesson(l).some((e) => e.sim === "procedure" && e.scenario === id), `${id} under ${l}`).toBe(true);
    }
    // the case that opens with the wire in is opened on the fluoroscopy workspace, where the wire is screened
    const below = practiceForLesson("pm-access-femoral-sheath").find((e) => e.scenario === "fem-entry-below-head")!;
    expect(below.params.workspace).toBe("fluoro");
    expect(below.params.start).toBe("access");
  });
});
