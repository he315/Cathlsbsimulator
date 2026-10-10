// access-route-decision: the tips the route plan brings up, the module's events, the practice links of
// routes.launch.ts and the waiting.ts entries naming the package.
//   npx vitest run src/simulation/session/modules/routePlan.tips.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession, type CaseSession } from "../caseSession";
import { gainAccess, prepare } from "../autopilot";
import { caseTipContexts } from "../../../ui/access/caseTips";
import { LAB_EVENTS, TIP_BY_ID, tipsFor, type LabContext, type TipTrigger } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS } from "../../../content/lab/raisable/waiting";
import { TRACKS } from "../../../content/index";
import { PRACTICE_INDEX, practiceForLesson } from "../../../ui/content/practiceIndex";
import { SCENARIO_BY_ID } from "../scenarios/index";
import { launch } from "../scenarios/routes.launch";
import { ROUTE_CARDS } from "../scenarios/routes";
import { ROUTE_PLAN_EVENTS, raises, routePlanOf } from "./routePlan";

const PACKAGE = "access-route-decision";
const LESSON_IDS = new Set(TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => l.id))));
const ids = (ctx: LabContext) => tipsFor(ctx, 20).map((t) => t.id);
const accessAt = (s: CaseSession, w: Parameters<typeof caseTipContexts>[1], phase?: string) => {
  const c = caseTipContexts(s, w).find((x) => x.lab === "access" && (phase ? x.phase === phase : !!x.phase));
  if (!c) throw new Error(`no access context at ${w}`);
  return c;
};

/** lima-graft on the left radial, the plan confirmed, access gained and heparin given. */
function limaOnTheLeft(): CaseSession {
  const { session: s } = newCaseSession({ scenario: "lima-graft" });
  const m = routePlanOf(s)!;
  m.actions.setPlan({ site: "radial-left", sheathType: "thin", fallback: "femoral-right", spasm: { sedation: true, local: true, verapamil: true, gtn: false } });
  m.actions.confirm();
  s.runPending();
  prepare(s);
  gainAccess(s);
  s.order("heparin-radial");
  s.runPending();
  return s;
}

describe("route plan tips", () => {
  it("in lima-graft, after the action that raises 'radial-spasm', tipsFor(ctx, 20) includes access-radial-spasm-no-traction", () => {
    const s = limaOnTheLeft();
    s.prepCatheter("TIG");
    s.runPending();
    expect(s.loadCatheter("TIG")).toBe(true);
    // the wire meets an arm artery it cannot pass and is pushed on (a stand-in for a wire forced up the arm)
    s.obstructRoute("brachial");
    s.beamOn = true;
    s.tipImaged = true;
    for (let i = 0; i < 400 && !s.activeEvents().includes("radial-spasm"); i++) s.commandWire(1, 0);
    expect(s.activeEvents()).toContain("radial-spasm");
    const comp = accessAt(s, "fluoro", "complication");
    expect(comp.route).toBe("radial");
    expect(ids(comp)).toContain("access-radial-spasm-no-traction");
  });

  it("in lima-graft, after its first look at the site (inspectSite) finds the haematoma, tipsFor(ctx, 20) includes access-mon-pulses-site", () => {
    const s = limaOnTheLeft();
    const m = routePlanOf(s)!;
    // the haematoma grows under heparin, unseen: nothing raises it
    s.wait(7 * 60);
    s.runPending();
    expect(s.pm.st.haematomaMl).toBeGreaterThan(0);
    expect(s.activeEvents()).not.toContain("haematoma");
    expect(ids(accessAt(s, "table"))).not.toContain("access-mon-pulses-site");
    const found = m.actions.inspectSite();
    s.runPending();
    expect(found).toMatch(/swelling/);
    expect(s.activeEvents()).toContain("haematoma");
    expect(ids(accessAt(s, "table"))).toContain("access-mon-pulses-site");
    // found while small: the monitoring decision is correct at closure
    expect(m.state.haematoma!.ml).toBeLessThan(15);
  });

  it("at the chart the access plan context carries the proposed route: the plan's tips follow it", () => {
    const { session: s } = newCaseSession({ scenario: "axillofemoral-graft" });
    const m = routePlanOf(s)!;
    // booked femoral: the femoral-only plan tips are up
    let plan = accessAt(s, "chart", "plan");
    expect(plan.route).toBe("femoral");
    for (const id of ["access-site-five-steps", "access-bg-pulses-both-groins", "access-bg-axillofemoral", "access-sheath-plan-size", "access-sheath-femoral-length-tip"]) expect(ids(plan), id).toContain(id);
    // proposing the radial artery moves the context: the femoral-only tip goes
    m.actions.setPlan({ site: "radial-right" });
    plan = accessAt(s, "chart", "plan");
    expect(plan.route).toBe("radial");
    expect(ids(plan)).not.toContain("access-bg-axillofemoral");
    for (const id of ["access-site-five-steps", "access-cabg-left-radial", "access-complex-pci-femoral", "access-anticoagulated-go-radial"]) expect(ids(plan), id).toContain(id);
  });

  it("raises names only registered events, and the module reports none until a haematoma is found", () => {
    for (const e of ROUTE_PLAN_EVENTS) expect(LAB_EVENTS as readonly string[]).toContain(e);
    for (const r of raises) for (const e of r.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
    const { session: s } = newCaseSession({ scenario: "lima-graft" });
    expect(routePlanOf(s)!.events!()).toEqual([]);
  });

  it("every waiting.ts entry naming access-route-decision is satisfiable, so the access lab's waiting count falls by at least their number", () => {
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PACKAGE).flatMap((w) => w.tips);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PACKAGE);
    // what the full case raises for the access lab with this module: the case's own phases, routes and events, and 'haematoma'
    const satisfiable = (w: TipTrigger) =>
      (!w.phase?.length || w.phase.some((p) => ["plan", "puncture", "wire", "sheath", "radial", "femoral", "closure", "complication"].includes(p))) &&
      (!w.event?.length || w.event.some((e) => (LAB_EVENTS as readonly string[]).includes(e)));
    for (const id of waiting) expect(satisfiable(TIP_BY_ID[id].when), id).toBe(true);
    for (const d of deferred) expect(satisfiable(d.when), d.tipId).toBe(true);
    // this revision of waiting.ts names the package in no entry: the fall it must produce is zero
    expect(waiting.length + deferred.length).toBe(0);
    // the tips the plan is built around exist (they wait on proc-tip-context, which is built)
    for (const id of ["access-site-five-steps", "access-cabg-left-radial", "access-complex-pci-femoral", "access-bg-pulses-both-groins", "access-bg-axillofemoral", "access-bg-aaa-thrombus", "access-anticoagulated-go-radial", "access-radial-spasm-no-traction", "diag-radial-spasm-release", "access-mon-pulses-site", "access-sheath-plan-size"])
      expect(TIP_BY_ID[id], id).toBeDefined();
  });
});

describe("route practice links", () => {
  const want: Record<string, string[]> = {
    "pm-access-site-choice": ["lima-graft", "dialysis-fistula", "arteria-lusoria", "complex-pci-8fr", "right-groin-plug-60d"],
    "hb-background-peripheral": ["impalpable-femorals", "axillofemoral-graft", "aaa-mural-thrombus", "arteria-lusoria", "right-groin-plug-60d", "dialysis-fistula"],
    "pm-engaging-spasm": ["spasm-high-risk", "very-small-radial"],
    "pm-monitoring-watch": ["lima-graft"],
  };

  it("practiceIndex lists lima-graft, dialysis-fistula and arteria-lusoria under pm-access-site-choice, the peripheral cases under hb-background-peripheral and the spasm cases under pm-engaging-spasm", () => {
    for (const [lessonId, scenarios] of Object.entries(want)) {
      expect(LESSON_IDS.has(lessonId), lessonId).toBe(true);
      const listed = practiceForLesson(lessonId).filter((e) => e.sim === "procedure").map((e) => e.scenario);
      for (const id of scenarios) expect(listed, `${lessonId} ${id}`).toContain(id);
    }
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("routes.launch"))).toEqual([]);
  });

  it("every scenario in routes.launch.ts exists with the same lessons, opens at the chart and has a card", () => {
    expect(launch.sim).toBe("procedure");
    for (const sc of launch.scenarios ?? []) {
      const def = SCENARIO_BY_ID[sc.id];
      expect(def, sc.id).toBeDefined();
      expect(def.lessonIds, sc.id).toEqual(sc.lessonIds);
      expect(def.start ?? "chart", sc.id).toBe("chart");
      expect(ROUTE_CARDS[sc.id], sc.id).toBeDefined();
    }
    for (const l of launch.links ?? []) expect(SCENARIO_BY_ID[l.scenario!], l.scenario).toBeDefined();
  });
});
