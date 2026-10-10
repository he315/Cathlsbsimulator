// The post-CABG scenarios (diag-grafts-svg) and their event source, the scenario script: the practice index lists
// them under their lessons, the pack agrees with its .launch.ts, the operation note is written from the grafts, and
// in the lab the tips written for a damped graft ostium and for a graft not found appear after the actions that raise
// pressure-damped and graft-not-found; every waiting.ts entry naming diag-grafts-svg becomes satisfiable.
//   npx vitest run src/simulation/diagnosticScenarios/grafts.test.ts
import { afterEach, describe, expect, it } from "vitest";
import type { EngagementState } from "../../types";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { CASE_LIBRARY, scenarioCase } from "../caseGenerator";
import { buildAnatomy, GraftSearch } from "../anatomy";
import { practiceForLesson } from "../../ui/content/practiceIndex";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../content/lab/raisable/waiting";
import { conduitVessel, diagnosticContext, diagnosticStoreSlice, IDLE_SESSION_VIEW, raises as diagnosticRaises } from "../../ui/lab/diagnosticContext";
import { DiagnosticLabSession } from "../../ui/sim/labSession";
import { SCRIPT_MODULE_ID, raises as scriptRaises, type ScenarioScript } from "../../ui/sim/modules/script";
import { DIAG_SCENARIOS, diagScenarioById, scenariosEvents } from "./index";
import { launch } from "./grafts.launch";
import { GRAFT_NOT_FOUND_AFTER_S, operationNoteFor, scenarios } from "./grafts";

const g = () => useSimulatorStore.getState();
afterEach(() => g().loadCase(CASE_LIBRARY[0], "free"));
const cathlab = (lesson: string) => practiceForLesson(lesson).filter((e) => e.sim === "cathlab").map((e) => e.scenario);
const PACK = new Set(scenarios.map((s) => s.id));

function session(id: string, seed = "1"): DiagnosticLabSession {
  g().loadCase(scenarioCase(id, seed)!, "free");
  return new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
}
const scriptOf = (s: DiagnosticLabSession) => s.modules.find((m) => m.id === SCRIPT_MODULE_ID) as ScenarioScript;
/** Put the catheter where a hand would (the legacy classifier's terms), as the other tips tests do. */
function place(cath: string, kind: EngagementState["kind"], target: EngagementState["target"] = null) {
  // a change of catheter is an exchange (the session holds the exchange phase for a while): only when it differs
  if (g().catheterId !== cath) g().setCatheter(cath);
  useSimulatorStore.setState({ engagement: { ...g().engagement, kind, target, isSelective: false, isDeep: false, conus: false, depth: 0, quality: 0.8 } as EngagementState });
}

describe("the practice index and the pack", () => {
  it("lists diag-graft-search, diag-graft-imaging-competitive-flow and diag-graft-roadmap-aortogram under cp-prior-cabg-svg-find, cp-prior-cabg-svg-image and hb-cardiac-catheterisation-aortography", () => {
    expect(cathlab("cp-prior-cabg-svg-find")).toContain("diag-graft-search");
    expect(cathlab("cp-prior-cabg-svg-image")).toEqual(expect.arrayContaining(["diag-graft-imaging-competitive-flow", "diag-long-svg-run"]));
    expect(cathlab("hb-cardiac-catheterisation-aortography")).toContain("diag-graft-roadmap-aortogram");
    expect(cathlab("hb-background-depth")).toContain("diag-graft-roadmap-aortogram");
    expect(cathlab("pm-acquiring-cine")).toContain("diag-long-svg-run");
    for (const s of launch.scenarios ?? []) for (const l of s.lessonIds) expect(cathlab(l), `${s.id} under ${l}`).toContain(s.id);
  });

  it("the pack and its launch file agree, the registry holds the pack, and each chart's operation note is written from its grafts", () => {
    expect(scenarios.map((s) => s.id)).toEqual((launch.scenarios ?? []).map((s) => s.id));
    for (const s of scenarios) {
      expect(diagScenarioById(s.id)).toBe(s);
      expect(s.grafts?.length, s.id).toBeGreaterThan(0);
      expect(s.chart.operationNote).toBe(operationNoteFor(s.grafts!, Number(/(\d+) years ago/.exec(s.chart.operationNote!)![1])));
      expect(s.planted).toContain("operation-note");
      // the note names conduits and targets, not what has become of them
      expect(s.chart.operationNote).not.toMatch(/occlu|patent|stump|diseased/i);
      const c = scenarioCase(s.id, "1")!;
      // every graft the note lists has an aortic ostium this package's anatomy places, so the learner can find it
      // (in situ mammary grafts are diag-grafts-arterial's and appear in none of these cases)
      expect(buildAnatomy(c).grafts!.map((x) => x.id), s.id).toEqual(s.grafts!.map((x) => x.id));
      expect(s.chart.operationNote, s.id).not.toMatch(/mammary/);
    }
    // patent, diseased and occluded grafts all occur in the pack (the design's graft states)
    const states = new Set(scenarios.flatMap((s) => s.grafts!.map((x) => x.status)));
    expect([...states].sort()).toEqual(["diseased", "occluded", "patent"]);
    expect(diagScenarioById("diag-graft-imaging-competitive-flow")!.grafts!.find((x) => x.id === "svg-rca")!.status).toBe("diseased");
    expect(operationNoteFor([{ conduit: "svg", target: "OM1", position: 0.4, proximalSite: "aorta-high", status: "occluded", ringMarker: true }], 9)).toBe(
      "Coronary artery bypass grafting, 9 years ago: saphenous vein graft to the first obtuse marginal (ring marker at the aortic anastomosis)."
    );
  });
});

describe("tips at the moments the pack's event source raises their names", () => {
  it("diag-graft-search: after the action that raises 'pressure-damped' (a damped trace at the graft ostium), tipsFor(ctx, 20) includes diag-svg-damped", () => {
    const s = session("diag-graft-search");
    try {
      s.setTimeOutDone(true);
      // the catheter has reached the root (the session sets this on the first hand movement or image)
      s.rootReached = true;
      // a Judkins right sought along the anterior aorta where the vein grafts arise
      place("JR4", "ascending-aorta");
      expect(s.tipContext()).toMatchObject({ phase: "engage-graft", vessel: "SVG" });
      expect(tipsFor(s.tipContext(), 20).map((t) => t.id)).not.toContain("diag-svg-damped");
      // the action: the tip at a stenosed graft ostium damps the trace (the store's pressure class)
      useSimulatorStore.setState({ pressure: { ...g().pressure, kind: "damped" } });
      const ctx = s.tipContext();
      expect(ctx.events).toContain("pressure-damped");
      expect(tipsFor(ctx, 20).map((t) => t.id)).toContain("diag-svg-damped");
    } finally {
      s.dispose();
    }
    // the same moment with the tip read by the rod mechanics in the graft's lumen (DiagnosticPhysicsReading.graft)
    const c = scenarioCase("diag-graft-search", "1")!;
    const store = diagnosticStoreSlice({ engagement: { kind: "near-lm", target: "left", isSelective: false, isDeep: false, conus: false, quality: 0.6 }, pressure: { kind: "damped" }, catheterId: "JR4", caseData: c, finished: false });
    const ctx = diagnosticContext({ store, session: IDLE_SESSION_VIEW, physics: { tipZone: "root", vessel: "GRAFT:svg-om", graft: conduitVessel("svg") } });
    expect(ctx).toMatchObject({ phase: "engage-graft", vessel: "SVG" });
    expect(tipsFor(ctx, 20).map((t) => t.id)).toContain("diag-svg-damped");
  });

  it("diag-graft-imaging-competitive-flow asks for the right graft's ostial stenosis to be recorded, not for a damped trace the rod's pressure does not yet give there", () => {
    const sc = diagScenarioById("diag-graft-imaging-competitive-flow")!;
    const ids = sc.checks.map((x) => x.id);
    expect(ids).toContain("ostial-stenosis");
    expect(ids).not.toContain("damped");
    expect(sc.checks.find((x) => x.id === "ostial-stenosis")!.text).not.toMatch(/damped trace .* recognised/i);
  });

  // Not yet the acceptance line's live check: in diag-graft-search no session module steps GraftSearch with the rod
  // tip, so no lab action raises graft-not-found there (a graft-search session module, registered in
  // src/ui/sim/modules/index.ts, is open work outside this package). This test checks the two halves separately:
  // the rule fires once for the graft sought, and the tips follow once the event is active (set by hand here).
  it("diag-graft-search: the GraftSearch rule fires once after repeated failed attempts at a listed graft's level, and with graft-not-found active tipsFor(ctx, 20) includes diag-graft-not-found (the event set by hand: no live source in this case yet)", () => {
    const c = scenarioCase("diag-graft-search", "1")!;
    const model = buildAnatomy(c);
    const om = model.grafts!.find((x) => x.id === "svg-om")!;
    const search = new GraftSearch(model.grafts!);
    const o = om.ostium.pos;
    const fired: string[] = [];
    for (let a = 0; a < 6; a++) {
      for (let k = 0; k < 20; k++) fired.push(...search.step(0.1, { x: o.x * 0.8, y: o.y, z: o.z * 0.8 }, null).map((x) => x.id));
      for (let k = 0; k < 30; k++) fired.push(...search.step(0.1, { x: o.x * 0.8, y: o.y - 20, z: o.z * 0.8 }, null).map((x) => x.id));
    }
    expect(fired).toEqual(["svg-om"]);
    const store = diagnosticStoreSlice({ engagement: { kind: "ascending-aorta", target: null, isSelective: false, isDeep: false, conus: false, quality: 0 }, pressure: { kind: "aortic" }, catheterId: "JR4", caseData: c, finished: false });
    const before = diagnosticContext({ store, session: IDLE_SESSION_VIEW });
    expect(tipsFor(before, 20).map((t) => t.id)).not.toContain("diag-graft-not-found");
    const ctx = diagnosticContext({ store, session: IDLE_SESSION_VIEW, active: ["prior-cabg", "graft-not-found"] });
    expect(ctx.phase).toBe("engage-graft");
    expect(tipsFor(ctx, 20).map((t) => t.id)).toEqual(expect.arrayContaining(["diag-graft-not-found", "diag-aortogram-graft-roadmap"]));
  });

  it("the road-map scenario's script raises graft-not-found in the lab when a graft is still being sought from the ascending aorta long into the case; the other cases do not script it", () => {
    // only the case whose premise is a graft not found uses the time stand-in (grafts.ts header): in the others the
    // learner may have found every graft and be back in the aorta at that time
    const scripted = scenarios.filter((s) => (s.script ?? []).some((t) => t.do.some((a) => a.kind === "raise" && a.event === "graft-not-found"))).map((s) => s.id);
    expect(scripted).toEqual(["diag-graft-roadmap-aortogram"]);
    for (const id of scripted) {
      const s = session(id);
      try {
        s.setTimeOutDone(true);
        s.rootReached = true;
        place("JR4", "ascending-aorta");
        for (let k = 0; k < 200; k++) s.step(0.1); // past the exchange hold of the catheter just loaded
        // lab time passes (the session steps at most 0.1 s at a time) with the catheter still searching the aorta;
        // the script module is evaluated with the store's engagement as the hands leave it
        const script = scriptOf(s);
        const until = (t: number) => {
          while (s.wall() < t) s.step(0.1);
          place("JR4", "ascending-aorta");
          script.step(0.25);
        };
        expect(s.activeEvents(), id).not.toContain("graft-not-found");
        until(GRAFT_NOT_FOUND_AFTER_S - 5);
        expect(script.firedTriggers(), id).toEqual([]);
        until(GRAFT_NOT_FOUND_AFTER_S + 1);
        expect(script.firedTriggers(), id).toEqual(["graft-not-found"]);
        const ctx = s.tipContext();
        expect(ctx.events, id).toContain("graft-not-found");
        expect(tipsFor(ctx, 20).map((t) => t.id), id).toEqual(expect.arrayContaining(["diag-graft-not-found", "diag-aortogram-graft-roadmap"]));
      } finally {
        s.dispose();
      }
    }
  });
});

// --- reachability ----------------------------------------------------------------

function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, rs: readonly LabRaises[]): boolean {
  const has = (key: "phases" | "events" | "routes" | "procedures" | "techniques" | "imaging", x: string) => rs.some((r) => ((r[key] ?? []) as readonly string[]).includes(x));
  const any = (want: readonly string[] | undefined, key: Parameters<typeof has>[0]) => !want?.length || want.some((x) => has(key, x));
  return any(phases, "phases") && any(when.event, "events") && (when.requires ?? []).every((e) => has("events", e)) && any(when.procedure, "procedures") && any(when.route, "routes") && any(when.technique, "techniques") && any(when.imaging, "imaging");
}
const satisfiable = (tip: LabTip, rs: readonly LabRaises[]) => (tip.lab === "diagnostic" ? satisfiableIn(tip.when, tip.when.phase, rs) : (tip.alsoIn ?? []).some((a) => a.lab === "diagnostic" && satisfiableIn(tip.when, a.phase, rs)));

describe("reachability", () => {
  it("every waiting.ts entry naming diag-grafts-svg becomes satisfiable, so the diagnostic lab's waiting count falls by at least their number", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === "diag-grafts-svg").flatMap((w) => w.tips);
    expect(mine).toEqual(expect.arrayContaining(["diag-aortogram-graft-roadmap", "diag-graft-not-found"]));
    expect(scriptRaises.events).toContain("graft-not-found");
    const others = DIAG_SCENARIOS.filter((s) => !PACK.has(s.id));
    const before: LabRaises[] = [diagnosticRaises, { lab: "diagnostic", phases: [], events: scenariosEvents(others) }];
    const after: LabRaises[] = [diagnosticRaises, scriptRaises];
    expect(mine.filter((id) => satisfiable(TIP_BY_ID[id], before))).toEqual([]);
    expect(mine.filter((id) => !satisfiable(TIP_BY_ID[id], after))).toEqual([]);
    const waiting = new Set(WAITING_TIPS.filter((w) => w.lab === "diagnostic").flatMap((w) => w.tips));
    const stillWaiting = (rs: LabRaises[]) => LAB_TIPS.filter((t) => waiting.has(t.id) && !satisfiable(t, rs)).length;
    console.info(`diagnostic tips listed in waiting.ts and still not satisfiable: ${stillWaiting(before)} -> ${stillWaiting(after)}`);
    expect(stillWaiting(before) - stillWaiting(after)).toBeGreaterThanOrEqual(mine.length);
  });
});
