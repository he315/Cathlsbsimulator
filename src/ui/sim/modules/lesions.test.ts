// The lesion morphology scenarios through the scenario script module (diag-lesion-morphologies):
// the CTO case raises 'total-occlusion' and 'cto' on the first run of the occluded artery, the tips
// written for it then appear in the views phase, and every waiting.ts entry naming this package is
// satisfiable from the labs' own raises exports.
//   npx vitest run src/ui/sim/modules/lesions.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../../state/useSimulatorStore";
import { scenarioCase } from "../../../simulation/caseGenerator";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { raises as diagnosticRaises } from "../../lab/diagnosticContext";
import { DIAG_SCENARIOS, scenariosEvents } from "../../../simulation/diagnosticScenarios";
import { scenarios as lesionScenarios } from "../../../simulation/diagnosticScenarios/lesions";
import type { AnatomyCase } from "../../../types";
import { DiagnosticLabSession } from "../labSession";
import { SCRIPT_MODULE_ID, ScenarioScript, raises as scriptRaises } from "./script";

const g = () => useSimulatorStore.getState();
afterEach(() => g().setPedalImaging(false));

function session(c: AnatomyCase): DiagnosticLabSession {
  g().loadCase(c, "free");
  return new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
}
const scriptOf = (s: DiagnosticLabSession) => s.modules.find((m) => m.id === SCRIPT_MODULE_ID) as ScenarioScript;
const tipIds = (s: DiagnosticLabSession) => tipsFor(s.tipContext(), 20).map((t) => t.id);

/** Seat the catheter in a coronary and film a diagnostic run there: the views phase. */
function filmed(s: DiagnosticLabSession, side: "left" | "right") {
  const kind = side === "left" ? "selective-lm" : "selective-rca";
  useSimulatorStore.setState({ engagement: { ...g().engagement, kind, target: side, isSelective: true } });
  useSimulatorStore.setState({ bolus: { filled: side === "left" ? ["LM", "LAD"] : ["RCA"], plume: "none", side, phase: 0.5, duration: 60, progress: 1, intensity: 1, peak: 1, diagnostic: true, filmed: true, counted: true, labEnded: true } });
  s.step(0.01);
  useSimulatorStore.setState({ bolus: null, engagement: { ...g().engagement, kind, target: side, isSelective: true } });
}

describe("diag-cto-contralateral-collaterals raises what its tips need", () => {
  it("after the action that raises 'total-occlusion' (the first run of the occluded right coronary), tipsFor(ctx, 20) includes diag-cto-strategy-defer-adhoc and diag-interp-collateral-long-run", () => {
    const c = scenarioCase("diag-cto-contralateral-collaterals")!;
    const s = session(c);
    s.setTimeOutDone(true);
    s.step(0.1);
    // a filmed left run: the views phase, but the occlusion has not been seen yet
    filmed(s, "left");
    expect(s.tipContext().phase).toBe("views");
    expect(s.tipContext().events).not.toContain("total-occlusion");
    expect(tipIds(s)).not.toContain("diag-cto-strategy-defer-adhoc");
    // the first injection of the right coronary: the script raises total-occlusion and cto for the case
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "selective-rca", target: "right", isSelective: true } });
    expect(s.startInjection()).toBe(true);
    expect(scriptOf(s).firedTriggers()).toEqual(["occlusion-seen"]);
    // the push ends and the run is filmed: back in the views phase
    s.injector.finish();
    s.step(0.1);
    filmed(s, "right");
    const ctx = s.tipContext();
    expect(ctx.phase).toBe("views");
    expect(ctx.events).toEqual(expect.arrayContaining(["total-occlusion", "cto"]));
    const ids = tipIds(s);
    expect(ids).toContain("diag-cto-strategy-defer-adhoc");
    expect(ids).toContain("diag-interp-collateral-long-run");
    // held for the case
    for (let i = 0; i < 20; i++) s.step(0.1);
    expect(s.tipContext().events).toContain("total-occlusion");
    s.dispose();
  });

  it("diag-two-candidate-culprits: the left run raises thrombus and total-occlusion, the right run (the chronic occlusion) total-occlusion and cto; diag-scad-types holds scad-suspected from the start", () => {
    const two = session(scenarioCase("diag-two-candidate-culprits")!);
    two.setTimeOutDone(true);
    two.step(0.1);
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "selective-lm", target: "left", isSelective: true } });
    expect(two.startInjection()).toBe(true);
    expect(scriptOf(two).firedTriggers()).toEqual(["left-run"]);
    expect(two.tipContext().events).toEqual(expect.arrayContaining(["thrombus", "total-occlusion"]));
    expect(two.tipContext().events).not.toContain("cto");
    two.injector.finish();
    two.step(0.1);
    filmed(two, "left");
    // the first run of the right coronary: the non-culprit chronic occlusion raises cto, so the CTO tips appear
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "selective-rca", target: "right", isSelective: true } });
    expect(two.startInjection()).toBe(true);
    expect(scriptOf(two).firedTriggers()).toEqual(["left-run", "right-run"]);
    two.injector.finish();
    two.step(0.1);
    filmed(two, "right");
    expect(two.tipContext().events).toEqual(expect.arrayContaining(["thrombus", "total-occlusion", "cto"]));
    expect(tipIds(two)).toContain("diag-cto-strategy-defer-adhoc");
    two.dispose();
    const scad = session(scenarioCase("diag-scad-types", "4")!);
    expect(scad.tipContext().events).toContain("scad-suspected");
    expect(tipIds(scad)).toContain("diag-ocx-scad-setup");
    scad.dispose();
  });

  it("a non-selective root puff fills no coronary, so it raises nothing; the selective run of the same side then raises the occlusion", () => {
    const rootPuff = (s: DiagnosticLabSession, side: "left" | "right") => {
      useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "non-selective", target: side, isSelective: false, isDeep: false } });
      expect(s.startInjection()).toBe(true);
      expect(g().lastInjection?.outcome).toBe("root-puff");
      s.injector.finish();
      for (let i = 0; i < 4; i++) s.step(0.1);
    };
    const selective = (s: DiagnosticLabSession, side: "left" | "right") => {
      useSimulatorStore.setState({ engagement: { ...g().engagement, kind: side === "left" ? "selective-lm" : "selective-rca", target: side, isSelective: true, isDeep: false } });
      expect(s.startInjection()).toBe(true);
    };
    // the CTO case: a right root puff shows no occlusion and raises neither total-occlusion nor cto
    const cto = session(scenarioCase("diag-cto-contralateral-collaterals")!);
    cto.setTimeOutDone(true);
    cto.step(0.1);
    rootPuff(cto, "right");
    expect(scriptOf(cto).firedTriggers()).toEqual([]);
    expect(cto.tipContext().events).not.toContain("total-occlusion");
    expect(cto.tipContext().events).not.toContain("cto");
    selective(cto, "right");
    expect(scriptOf(cto).firedTriggers()).toEqual(["occlusion-seen"]);
    expect(cto.tipContext().events).toEqual(expect.arrayContaining(["total-occlusion", "cto"]));
    cto.dispose();
    // two candidate culprits: a left root puff raises neither total-occlusion nor thrombus
    const two = session(scenarioCase("diag-two-candidate-culprits")!);
    two.setTimeOutDone(true);
    two.step(0.1);
    rootPuff(two, "left");
    expect(scriptOf(two).firedTriggers()).toEqual([]);
    expect(two.tipContext().events).not.toContain("total-occlusion");
    expect(two.tipContext().events).not.toContain("thrombus");
    selective(two, "left");
    expect(scriptOf(two).firedTriggers()).toEqual(["left-run"]);
    expect(two.tipContext().events).toEqual(expect.arrayContaining(["total-occlusion", "thrombus"]));
    two.dispose();
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
  it("the script module's raises include the pack's events (derived from the registry)", () => {
    for (const e of scenariosEvents(lesionScenarios)) expect(scriptRaises.events).toContain(e);
    expect(scriptRaises.events).toEqual(expect.arrayContaining(["total-occlusion", "cto", "thrombus", "scad-suspected"]));
  });

  it("every waiting.ts entry naming diag-lesion-morphologies is satisfiable, so the diagnostic lab's waiting count falls by at least their number", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === "diag-lesion-morphologies").flatMap((w) => w.tips);
    expect(mine).toEqual(["diag-cto-strategy-defer-adhoc", "diag-interp-collateral-long-run"]);
    // before: the script module raising the events of every pack except this one
    const others = DIAG_SCENARIOS.filter((s) => !lesionScenarios.includes(s));
    const before: LabRaises[] = [diagnosticRaises, { ...scriptRaises, events: scenariosEvents(others) }];
    const after: LabRaises[] = [diagnosticRaises, scriptRaises];
    expect(mine.filter((id) => satisfiable(TIP_BY_ID[id], before))).toEqual([]);
    expect(mine.filter((id) => !satisfiable(TIP_BY_ID[id], after))).toEqual([]);
    const waiting = new Set(WAITING_TIPS.filter((w) => w.lab === "diagnostic").flatMap((w) => w.tips));
    const stillWaiting = (rs: LabRaises[]) => LAB_TIPS.filter((t) => waiting.has(t.id) && !satisfiable(t, rs)).length;
    const fell = stillWaiting(before) - stillWaiting(after);
    console.info(`diagnostic tips listed in waiting.ts and still not satisfiable: ${stillWaiting(before)} -> ${stillWaiting(after)}`);
    expect(fell).toBeGreaterThanOrEqual(mine.length);
  });
});
