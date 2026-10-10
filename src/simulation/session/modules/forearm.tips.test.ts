// access-cx-forearm: tip integration and practice links. The forearm module reports 'haematoma' once the swelling is
// found (events: the case's access contexts at the radial site, closure in the recovery workspace and complication),
// and its own access complication context with 'limb-ischaemia' while the compartment signs are present
// (tipContexts). modules/forearm.ts exports `raises` for the reachability report.
//   npx vitest run src/simulation/session/modules/forearm.tips.test.ts
import { describe, it, expect } from "vitest";
import { newCaseSession, type CaseSession } from "../caseSession";
import { TIP_BY_ID, tipsFor, type LabContext } from "../../../content/lab/tips";
import { WAITING_TIPS, DEFERRED_RETARGETS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { caseTipContexts, isModuleTipContext } from "../../../ui/access/caseTips";
import { PRACTICE_INDEX, practiceForLesson } from "../../../ui/content/practiceIndex";
import { forearmOf, raises } from "./forearm";
import { scenarios } from "../scenarios/forearm";
import { launch } from "../scenarios/forearm.launch";

const PACKAGE = "access-cx-forearm";
const ids = (ctx: LabContext | undefined) => (ctx ? tipsFor(ctx, 20).map((t) => t.id) : []);
const closureCtx = (s: CaseSession) => caseTipContexts(s, "recovery").find((c) => c.lab === "access" && c.phase === "closure");
const run = (s: CaseSession, min: number) => {
  s.wait(min * 60);
  s.runPending();
};

describe("forearm haematoma tips in the full case", () => {
  it("in scenario forearm-grade-1, after the action that raises 'haematoma', tipsFor(ctx, 20) includes access-cx-forearm-haematoma-grade and access-radial-band-bleeding", () => {
    const s = newCaseSession({ scenario: "forearm-grade-1" }).session;
    run(s, 4);
    // before the swelling is found: the radial closure context on the ward, without the haematoma tips
    const before = closureCtx(s)!;
    expect(before).toMatchObject({ lab: "access", phase: "closure", route: "radial" });
    expect(s.activeEvents()).not.toContain("haematoma");
    expect(ids(before)).not.toContain("access-cx-forearm-haematoma-grade");
    // the action: the learner looks at the forearm and finds the swelling
    forearmOf(s)!.actions.look();
    expect(s.activeEvents()).toContain("haematoma");
    const after = closureCtx(s)!;
    const got = ids(after);
    expect(got).toContain("access-cx-forearm-haematoma-grade");
    expect(got).toContain("access-radial-band-bleeding");
    // the case's complication context opens too, and the module's own context leads the panel with the grade tip
    const all = caseTipContexts(s, "recovery");
    expect(all.some((c) => c.lab === "access" && c.phase === "complication" && !isModuleTipContext(c))).toBe(true);
    const own = all.find((c) => isModuleTipContext(c))!;
    expect(ids(own)).toContain("access-cx-forearm-haematoma-grade");
  });

  it("in forearm-compartment the module's context carries limb-ischaemia with the signs, and brings up access-cx-compartment-call", () => {
    const s = newCaseSession({ scenario: "forearm-compartment" }).session;
    run(s, 6);
    const own = caseTipContexts(s, "recovery").find((c) => isModuleTipContext(c))!;
    expect(own).toMatchObject({ lab: "access", phase: "complication", route: "radial", events: ["haematoma", "limb-ischaemia"] });
    expect(ids(own)).toContain("access-cx-compartment-call");
    // limb-ischaemia stays in the module's access context: the PCI and diagnostic contexts do not carry it
    expect(caseTipContexts(s, "recovery").filter((c) => c.lab !== "access").some((c) => c.events?.includes("limb-ischaemia"))).toBe(false);
  });

  it("every waiting.ts entry naming access-cx-forearm becomes satisfiable (there are none), and the package's tips are satisfiable by the module's raises", () => {
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PACKAGE);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PACKAGE);
    // no entry waits on this package, so the access lab's waiting count falls by at least their number (zero)
    expect(waiting.length + deferred.length).toBe(0);
    const satisfiable = (r: LabRaises, id: string) => {
      const w = TIP_BY_ID[id].when;
      if (w.phase?.length && !w.phase.some((p) => (r.phases as readonly string[]).includes(p))) return false;
      if (w.event?.length && !w.event.some((e) => r.events.includes(e))) return false;
      if (w.requires?.length && !w.requires.every((e) => r.events.includes(e))) return false;
      if (w.route?.length && !w.route.some((x) => (r.routes ?? []).includes(x))) return false;
      return true;
    };
    const access = raises.find((r) => r.lab === "access")!;
    for (const id of ["access-cx-forearm-haematoma-grade", "access-radial-band-bleeding", "access-cx-compartment-call"]) {
      expect(TIP_BY_ID[id], id).toBeDefined();
      expect(satisfiable(access, id), id).toBe(true);
    }
    expect(access.events).toContain("limb-ischaemia");
  });

  it("practiceIndex lists the scenarios forearm-grade-1, forearm-grade-3, forearm-grade-4 under lessons cm-access-complications-radial-bleeding, pm-engaging-spasm (from src/simulation/session/scenarios/forearm.launch.ts)", () => {
    for (const lesson of ["cm-access-complications-radial-bleeding", "pm-engaging-spasm"]) {
      const listed = practiceForLesson(lesson).filter((e) => e.sim === "procedure").map((e) => e.scenario);
      for (const id of ["forearm-grade-1", "forearm-grade-3", "forearm-grade-4"]) expect(listed, `${lesson}:${id}`).toContain(id);
    }
    const known = PRACTICE_INDEX.known.scenarios.get("procedure")!;
    for (const id of ["forearm-grade-1", "forearm-grade-3", "forearm-grade-4", "forearm-compartment", "forearm-after-traction"]) {
      expect(known.has(id), id).toBe(true);
      expect(known.get(id)!.file).toMatch(/scenarios\/forearm\.launch\.ts$/);
      expect(known.get(id)!.starts.has("recovery"), id).toBe(true);
    }
    // the launch metadata and the scenarios agree on ids, titles and lessons
    expect(launch.scenarios!.map((x) => x.id)).toEqual(scenarios.map((x) => x.id));
    for (const sc of scenarios) {
      const l = launch.scenarios!.find((x) => x.id === sc.id)!;
      expect(l.title).toBe(sc.title);
      expect(l.lessonIds).toEqual(sc.lessonIds);
      expect(sc.start).toBe("recovery");
    }
  });
});
