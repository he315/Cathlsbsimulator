// access-multi-site: the tips the crossover case brings up at each site, its practice links, and the
// waiting.ts entries naming the package. The session (caseSession.ts) is the case's event source: the
// active site's route is what the tip context (src/ui/access/caseTips.ts) reports, so a radial case
// converted to the femoral artery shows the femoral tips, and each site's closure its own.
//   npx vitest run src/simulation/session/multiSite.tips.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession, type CaseSession } from "./caseSession";
import { crossover } from "./autopilot";
import { SCENARIO_BY_ID } from "./scenarios/index";
import { launch as crossoverLaunch } from "./scenarios/crossover.launch";
import * as TIPS from "../../content/lab/tips";
import { TIP_BY_ID, tipsFor, type LabContext, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, DEFERRED_RETARGETS, type LabRaises } from "../../content/lab/raisable/waiting";
import { TRACKS } from "../../content/index";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";
import { caseTipContexts, caseTipLimits, raises, selectCaseTips } from "../../ui/access/caseTips";

const PACKAGE = "access-multi-site";
const LESSON_IDS = new Set(TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => l.id))));
const ids = (t: readonly LabTip[]) => t.map((x) => x.id);

/** The access context the case reports at a workspace (the first access context with a phase). */
function accessContext(s: CaseSession, w: Parameters<typeof caseTipContexts>[1]): LabContext {
  const c = caseTipContexts(s, w).find((x) => x.lab === "access" && !!x.phase);
  if (!c) throw new Error(`no access context at ${w}`);
  return c;
}

/** The crossover scenario converted to the right femoral artery, sheath in. */
function crossedOver(seed: string): CaseSession {
  const { session: s } = newCaseSession({ seed, scenario: "crossover-heparinised" });
  crossover(s, "right");
  return s;
}

describe("tips at each site of the crossover case", () => {
  it("the scenario is the one crossover.launch.ts declares", () => {
    expect(crossoverLaunch.sim).toBe("procedure");
    for (const sc of crossoverLaunch.scenarios ?? []) expect(SCENARIO_BY_ID[sc.id]).toBeDefined();
  });

  it("at phase 'closure' the femoral site gives access-femoral-sheath-act; at phase 'femoral' access-crossover-anticoagulated-care", () => {
    const s = crossedOver("mst-xo-1");
    expect(s.accessStep().route).toBe("femoral");
    const closure = accessContext(s, "closure");
    expect(closure).toMatchObject({ lab: "access", phase: "closure", route: "femoral" });
    expect(ids(tipsFor(closure, 20))).toContain("access-femoral-sheath-act");
    // the site phase: the access workspace reports the femoral site with the step
    const atAccess = accessContext(s, "access");
    expect(atAccess.phases).toEqual(["femoral"]);
    const femoral: LabContext = { lab: "access", phase: "femoral", route: atAccess.route, events: atAccess.events };
    expect(ids(tipsFor(femoral, 20))).toContain("access-crossover-anticoagulated-care");
  });

  it("the case panel shows the crossover tip at the groin before the femoral puncture", () => {
    const { session: s } = newCaseSession({ seed: "mst-xo-panel", scenario: "crossover-heparinised" });
    s.removeCatheter();
    s.runPending();
    expect(s.addSite("femoral", "right")).not.toBeNull();
    expect(s.accessStep()).toEqual({ step: "puncture", site: "femoral", route: "femoral" });
    const shown = ids(selectCaseTips(TIPS, caseTipContexts(s, "access"), true, caseTipLimits("access")));
    expect(shown).toContain("access-crossover-anticoagulated-care");
  });

  it("before the crossover the radial site's closure brings up no femoral-only sheath tip; each site's closure reports its own route", () => {
    const { session: s } = newCaseSession({ seed: "mst-xo-2", scenario: "crossover-heparinised" });
    expect(accessContext(s, "closure").route).toBe("radial");
    const radialSite = s.activeSiteId;
    crossover(s, "right");
    expect(accessContext(s, "closure").route).toBe("femoral");
    expect(s.setActiveSite(radialSite)).toBe(true);
    const back = accessContext(s, "closure");
    expect(back.route).toBe("radial");
    expect(ids(selectCaseTips(TIPS, caseTipContexts(s, "closure"), true, caseTipLimits("closure")))).not.toContain("access-femoral-sheath-act");
  });

  it("the ledger's crossover decision names a tip and a lesson that resolve", () => {
    const { session: s } = newCaseSession({ seed: "mst-xo-3", scenario: "crossover-heparinised" });
    crossover(s, "right", { ultrasound: false });
    const d = s.decisions().find((x) => x.id === "crossover-puncture-guided")!;
    for (const id of d.tipIds ?? []) expect(TIP_BY_ID[id], id).toBeDefined();
    expect(LESSON_IDS.has(d.lessonId!)).toBe(true);
  });
});

describe("crossover practice links", () => {
  it("practiceIndex lists every scenario in crossover.launch.ts under lessons pm-antithrombotics-heparin and pm-antithrombotics-oac", () => {
    const want = ["pm-antithrombotics-heparin", "pm-antithrombotics-oac"];
    for (const sc of crossoverLaunch.scenarios ?? []) {
      expect(SCENARIO_BY_ID[sc.id].lessonIds).toEqual(want);
      for (const lessonId of want) {
        expect(LESSON_IDS.has(lessonId), lessonId).toBe(true);
        const entries = practiceForLesson(lessonId).filter((e) => e.sim === "procedure" && e.scenario === sc.id);
        expect(entries).toHaveLength(1);
        // it opens where the wire is: the fluoroscopy workspace, at the autopilot's sheath-in stage
        expect(entries[0].params).toMatchObject({ scenario: sc.id, start: "sheath-in", workspace: "fluoro" });
      }
    }
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("crossover.launch"))).toEqual([]);
  });
});

describe("waiting tips naming the package", () => {
  /** The case's raises merged per lab (as the reachability report merges them). */
  const merged = new Map<string, { phases: Set<string>; events: Set<string>; routes: Set<string>; procedures: Set<string> }>();
  for (const r of raises as readonly LabRaises[]) {
    const m = merged.get(r.lab) ?? { phases: new Set(), events: new Set(), routes: new Set(), procedures: new Set() };
    r.phases.forEach((x) => m.phases.add(x));
    r.events.forEach((x) => m.events.add(x));
    r.routes?.forEach((x) => m.routes.add(x));
    r.procedures?.forEach((x) => m.procedures.add(x));
    merged.set(r.lab, m);
  }
  const any = (want: readonly string[] | undefined, have: Set<string>) => !want?.length || want.some((x) => have.has(x));
  const satisfiable = (lab: string, w: TipTrigger) => {
    const m = merged.get(lab);
    return !!m && any(w.phase, m.phases) && any(w.event, m.events) && (w.requires ?? []).every((e) => m.events.has(e)) && any(w.route, m.routes) && any(w.procedure, m.procedures);
  };

  it("every waiting.ts entry naming access-multi-site is satisfiable by what the full case raises", () => {
    const waiting = WAITING_TIPS.filter((g) => g.raisedBy === PACKAGE);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PACKAGE);
    for (const g of waiting) for (const id of g.tips) expect(satisfiable(TIP_BY_ID[id].lab, TIP_BY_ID[id].when), id).toBe(true);
    for (const d of deferred) expect(satisfiable(TIP_BY_ID[d.tipId].lab, d.when), d.tipId).toBe(true);
    // this revision of waiting.ts names the package in no entry: the count of waiting access tips it can lower is zero
    expect(waiting.length + deferred.length).toBe(0);
  });

  it("the two crossover tips are satisfiable in the access lab from the case's raises", () => {
    for (const id of ["access-femoral-sheath-act", "access-crossover-anticoagulated-care"]) expect(satisfiable("access", TIP_BY_ID[id].when), id).toBe(true);
  });
});
