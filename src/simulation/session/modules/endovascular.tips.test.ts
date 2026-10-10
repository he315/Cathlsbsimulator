// access-cx-endovascular-control: the endovascular module's tips and launch links. After the learner's action
// the module reports 'bleeding', 'limb-ischaemia' or 'dissection', which opens the case's femoral access
// complication context (src/ui/access/caseTips.ts); a large-bore bleed opens an MCS complication context too.
//   npx vitest run src/simulation/session/modules/endovascular.tips.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession, type CaseSession } from "../caseSession";
import { crossover } from "../autopilot";
import { caseTipContexts, raises as caseRaises } from "../../../ui/access/caseTips";
import { LAB_EVENTS, LAB_PHASES, LAB_TIPS, TIP_BY_ID, tipsFor, type LabContext } from "../../../content/lab/tips";
import { DEFERRED_RETARGETS, WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { practiceForLesson } from "../../../ui/content/practiceIndex";
import { launch } from "../scenarios/endovascular.launch";
import { scenarios } from "../scenarios/endovascular";
import { ENDO_EVENTS, endovascularOf, raises, type EndovascularModule } from "./endovascular";
import { MP_ENDO } from "../../access/endovascular";

const PKG = "access-cx-endovascular-control";
const ids = (ctx: LabContext | undefined | null, n = 20) => (ctx ? tipsFor(ctx, n).map((t) => t.id) : []);
const complication = (s: CaseSession) => caseTipContexts(s, "fluoro").find((c) => c.lab === "access" && c.phase === "complication");

function run(s: CaseSession, sec: number): void {
  s.wait(sec);
  s.runPending();
}
function untilOnset(s: CaseSession, m: EndovascularModule): void {
  for (let t = 0; t <= 240 && !m.state.bleed && !m.state.leg; t += 5) run(s, 5);
  expect(!!m.state.bleed || !!m.state.leg).toBe(true);
}

/** The reachability report's satisfiability rule, on this module's and the case's declarations. */
function satisfiable(tipId: string, declared: readonly LabRaises[]): boolean {
  const tip = TIP_BY_ID[tipId];
  if (!tip) return false;
  const lab = declared.filter((r) => r.lab === tip.lab);
  const events = [...new Set(lab.flatMap((r) => [...r.events]))];
  const routes: (LabContext["route"] | undefined)[] = [undefined, ...new Set(lab.flatMap((r) => [...(r.routes ?? [])]))];
  const phases: (string | undefined)[] = [undefined, ...new Set(lab.flatMap((r) => [...r.phases]))];
  const procs = [...new Set(lab.flatMap((r) => [...(r.procedures ?? [])]))];
  return phases.some((phase) =>
    routes.some((route) =>
      tipsFor({ lab: tip.lab, ...(phase ? { phase: phase as LabContext["phase"] } : {}), ...(route ? { route } : {}), ...(procs.length ? { procedures: procs } : {}), events }, 1000).some((t) => t.id === tipId),
    ),
  );
}

describe("endovascular tips", () => {
  it("in scenario bleed-external-iliac, after the action that raises 'bleeding', tipsFor(ctx, 20) includes access-cx-iliofemoral-balloon-first and access-cx-small-branch-embolise", () => {
    const { session: s } = newCaseSession({ scenario: "bleed-external-iliac" });
    const m = endovascularOf(s)!;
    untilOnset(s, m);
    // the bleed alone raises nothing: the signs are in the log, the name is the learner's
    expect(s.activeEvents()).not.toContain("bleeding");
    expect(complication(s)).toBeUndefined();
    m.actions.suspect();
    expect(s.activeEvents()).toContain("bleeding");
    const ctx = complication(s)!;
    expect(ctx).toEqual(expect.objectContaining({ lab: "access", phase: "complication", route: "femoral" }));
    expect(ids(ctx)).toContain("access-cx-iliofemoral-balloon-first");
    expect(ids(ctx)).toContain("access-cx-small-branch-embolise");
  });

  it("acting on the bleed raises it too: the first crossover angiogram", () => {
    const { session: s } = newCaseSession({ scenario: "bleed-iea-branch" });
    const m = endovascularOf(s)!;
    untilOnset(s, m);
    crossover(s, "left");
    s.runPending();
    expect(m.actions.startCrossover().ok).toBe(true);
    expect(s.activeEvents()).not.toContain("bleeding");
    m.actions.angiogram();
    expect(s.activeEvents()).toContain("bleeding");
    expect(ids(complication(s))).toContain("access-cx-small-branch-embolise");
  });

  it("bleed-cfa (a large-bore case): the suspicion opens the MCS complication context with mcs-cx-covered-stent-site", () => {
    const { session: s } = newCaseSession({ scenario: "bleed-cfa" });
    const m = endovascularOf(s)!;
    untilOnset(s, m);
    expect(m.tipContexts!()).toEqual([]);
    m.actions.suspect();
    const mcs = caseTipContexts(s, "fluoro").find((c) => c.lab === "mcs");
    expect(mcs).toEqual(expect.objectContaining({ phase: "complication", procedures: ["large-bore"] }));
    expect(ids(mcs)).toContain("mcs-cx-covered-stent-site");
    // a bleed that is not a large-bore case has no MCS context
    const other = newCaseSession({ scenario: "bleed-external-iliac" }).session;
    const m2 = endovascularOf(other)!;
    untilOnset(other, m2);
    m2.actions.suspect();
    expect(m2.tipContexts!()).toEqual([]);
  });

  it("a cold leg: naming it raises limb-ischaemia (the six Ps and the closure-device tips), reading a flap raises dissection", () => {
    const { session: s } = newCaseSession({ scenario: "dissection-iliac" });
    const m = endovascularOf(s)!;
    untilOnset(s, m);
    m.actions.examineLeg();
    expect(s.activeEvents()).not.toContain("limb-ischaemia");
    m.actions.callLeg("ali");
    expect(s.activeEvents()).toContain("limb-ischaemia");
    const leg = ids(complication(s));
    expect(leg).toContain("access-cx-cold-leg-six-ps");
    expect(leg).toContain("access-closure-cold-leg");
    crossover(s, "left");
    s.runPending();
    m.actions.startCrossover("hydrophilic");
    m.actions.angiogram();
    m.actions.read("flap");
    expect(s.activeEvents()).toContain("dissection");
    expect(ids(complication(s))).toContain("access-cx-iliac-dissection-crossover");
  });

  it("raises names only registered events and phases, and every waiting.ts entry naming this package becomes satisfiable", () => {
    for (const e of ENDO_EVENTS) expect(LAB_EVENTS as readonly string[]).toContain(e);
    for (const r of raises) {
      for (const e of r.events) expect(LAB_EVENTS as readonly string[]).toContain(e);
      for (const p of r.phases) expect(LAB_PHASES[r.lab] as readonly string[]).toContain(p);
    }
    const withMine: LabRaises[] = [...raises, ...caseRaises];
    const waiting = WAITING_TIPS.filter((w) => w.raisedBy === PKG).flatMap((w) => w.tips);
    const deferred = DEFERRED_RETARGETS.filter((d) => d.raisedBy === PKG);
    expect(waiting.length).toBeGreaterThan(0);
    for (const id of waiting) {
      expect(satisfiable(id, withMine), id).toBe(true);
      // ... and not without this module (the case alone has no cause to raise them)
      expect(satisfiable(id, caseRaises), `${id} without the module`).toBe(false);
    }
    expect(deferred).toEqual([]);
    // the reachability waiting count for the access lab falls by at least their number
    const access = LAB_TIPS.filter((t) => t.lab === "access").map((t) => t.id);
    const before = access.filter((id) => satisfiable(id, caseRaises)).length;
    const after = access.filter((id) => satisfiable(id, withMine)).length;
    expect(after - before).toBeGreaterThanOrEqual(waiting.length);
    // the request's tips are all satisfiable from what the case and this module declare
    for (const id of ["access-cx-iliofemoral-balloon-first", "access-cx-small-branch-embolise", "mcs-cx-covered-stent-site", "access-cx-iliac-dissection-crossover", "access-cx-cold-leg-six-ps", "access-closure-cold-leg"]) {
      expect(TIP_BY_ID[id], id).toBeDefined();
      expect(satisfiable(id, withMine), id).toBe(true);
    }
  });

  it("every ledger record this module writes names tips and a lesson that exist", () => {
    const { session: s } = newCaseSession({ scenario: "livedo-not-ali" });
    const m = endovascularOf(s)!;
    untilOnset(s, m);
    m.actions.examineLeg();
    m.actions.callLeg("ali");
    m.actions.legAngiography();
    m.actions.treatLeg("supportive");
    const mine = s.decisions().filter((d) => d.id.startsWith("endo-"));
    expect(mine.length).toBeGreaterThanOrEqual(3);
    for (const d of mine) for (const id of d.tipIds ?? []) expect(TIP_BY_ID[id], `${d.id}: ${id}`).toBeDefined();
  });
});

describe("live hazards: the learner's own technique", () => {
  it("a femoral angiogram against a damped trace can raise a cold leg later; a clean trace never does", () => {
    let hits = 0;
    for (let k = 0; k < 12; k++) {
      const { session: s } = newCaseSession({ seed: `endo-hz-${k}`, access: "femoral", start: "closure" });
      const m = endovascularOf(s)!;
      const site = s.activeSite;
      // the learner injects through the sheath with a damped trace (the record the session keeps)
      site.femoralAngio = { t: s.tS + 1, ml: 10, laoDeg: 0, magnified: false, wireIn: false, waveform: "damped" };
      run(s, 5);
      run(s, MP_ENDO.legOnsetS + 10);
      if (m.state.leg) {
        hits++;
        expect(m.state.leg.source).toBe("technique");
        expect(m.state.leg.lesion.cause).toBe("iliac-dissection");
        expect(s.log.some((l) => /foot hurts/.test(l.text))).toBe(true);
      }
    }
    expect(hits).toBeGreaterThan(0);
    expect(hits).toBeLessThan(12);
    const { session: s } = newCaseSession({ seed: "endo-hz-clean", access: "femoral", start: "closure" });
    s.activeSite.femoralAngio = { t: s.tS + 1, ml: 10, laoDeg: 0, magnified: false, wireIn: true, waveform: "arterial" };
    run(s, MP_ENDO.legOnsetS + 20);
    expect(endovascularOf(s)!.state.leg).toBeNull();
  });
});

describe("endovascular.launch.ts and the practice index", () => {
  it("practiceIndex lists the scenarios bleed-external-iliac, bleed-cfa, bleed-iea-branch under lessons cm-access-complications-femoral-bleeding, cm-access-complications-large-bore, cm-access-complications-limb (from src/simulation/session/scenarios/endovascular.launch.ts)", () => {
    for (const l of ["cm-access-complications-femoral-bleeding", "cm-access-complications-large-bore", "cm-access-complications-limb"])
      for (const id of ["bleed-external-iliac", "bleed-cfa", "bleed-iea-branch"]) expect(practiceForLesson(l).some((e) => e.sim === "procedure" && e.scenario === id), `${id} under ${l}`).toBe(true);
  });

  it("the launch file and the scenario file list the same ten scenarios, with the same titles and lessons (a scenario's own entry and its links together)", () => {
    // a scenario's lessons are those of its entry and of the links naming it (livedo-not-ali's lesson is on its link)
    const lessonsOf = (id: string, own: string[]) => [...own, ...(launch.links ?? []).filter((k) => k.scenario === id).flatMap((k) => k.lessonIds)];
    const fromLaunch = (launch.scenarios ?? []).map((x) => ({ id: x.id, title: x.title, lessonIds: lessonsOf(x.id, x.lessonIds) }));
    expect(fromLaunch).toEqual(scenarios.map((x) => ({ id: x.id, title: x.title, lessonIds: x.lessonIds })));
    expect(scenarios).toHaveLength(10);
    for (const sc of launch.scenarios ?? []) {
      for (const l of lessonsOf(sc.id, sc.lessonIds)) expect(practiceForLesson(l).some((e) => e.scenario === sc.id), `${sc.id} under ${l}`).toBe(true);
      expect(sc.starts?.map((x) => (typeof x === "string" ? x : x.id))).toEqual([scenarios.find((x) => x.id === sc.id)!.start]);
      // titles do not name the injury or the cause
      expect(sc.title).not.toMatch(/iliac|femoral artery|epigastric|circumflex|dissect|plug|embol|cholesterol|livedo|extravas/i);
    }
  });

  it("livedo-not-ali opens from its lesson on the fluoroscopy workspace, where the leg's controls are, and is listed once", () => {
    const entries = practiceForLesson("cm-access-complications-limb").filter((e) => e.scenario === "livedo-not-ali");
    expect(entries).toHaveLength(1);
    expect(entries[0].params.workspace).toBe("fluoro");
    expect(entries[0].params.start).toBe("recovery");
  });

  it("plug-intraluminal: the team's collagen plug closes the groin before the leg presents", () => {
    const { session: s } = newCaseSession({ scenario: "plug-intraluminal" });
    expect(s.sites[0].closure.femoral).not.toBeNull();
  });
});
