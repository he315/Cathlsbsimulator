// The drug scenarios through the diagnostic session (diag-lab-drugs): the catheter-tip spasm of
// diag-nitrate-dose-by-pressure raises 'ostial-spasm' and the spasm tips appear, a vasodilator raises
// 'vasodilator-given', the PDE-5 case is a case property, the practice index lists the scenarios under
// their lessons, and every waiting.ts entry naming this package is satisfiable from the labs' own
// raises exports.
//   npx vitest run src/ui/sim/modules/drugs.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../../state/useSimulatorStore";
import { scenarioCase } from "../../../simulation/caseGenerator";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { raises as diagnosticRaises } from "../../lab/diagnosticContext";
import { DIAG_SCENARIOS, scenariosEvents } from "../../../simulation/diagnosticScenarios";
import { scenarios as drugScenarios } from "../../../simulation/diagnosticScenarios/drugs";
import { scenarios as spasmScenarios } from "../../../simulation/diagnosticScenarios/spasm";
import { launch as drugLaunch } from "../../../simulation/diagnosticScenarios/drugs.launch";
import { practiceForLesson } from "../../content/practiceIndex";
import type { AnatomyCase } from "../../../types";
import { DiagnosticLabSession } from "../labSession";
import { SCRIPT_MODULE_ID, ScenarioScript, raises as scriptRaises } from "./script";
import { DRUGS_MODULE_ID, raises as drugRaises, type DrugOrders } from "./drugs";

const g = () => useSimulatorStore.getState();
afterEach(() => g().setPedalImaging(false));

function session(c: AnatomyCase, mode?: "guided" | "supervised" | "independent"): DiagnosticLabSession {
  g().loadCase(c, "free");
  if (mode) useSimulatorStore.setState({ policy: { ...g().policy, mode } });
  return new DiagnosticLabSession(useSimulatorStore, null, null, { team: false });
}
const scriptOf = (s: DiagnosticLabSession) => s.modules.find((m) => m.id === SCRIPT_MODULE_ID) as ScenarioScript;
const drugsOf = (s: DiagnosticLabSession) => s.modules.find((m) => m.id === DRUGS_MODULE_ID) as DrugOrders;
const tipIds = (s: DiagnosticLabSession) => tipsFor(s.tipContext(), 20).map((t) => t.id);
const run = (s: DiagnosticLabSession, sec: number) => {
  for (let i = 0; i < Math.round(sec * 10); i++) s.step(0.1);
};

/** Seat the catheter in a coronary and film a diagnostic run there: the views phase. */
function filmed(s: DiagnosticLabSession, side: "left" | "right") {
  const kind = side === "left" ? "selective-lm" : "selective-rca";
  useSimulatorStore.setState({ engagement: { ...g().engagement, kind, target: side, isSelective: true } });
  useSimulatorStore.setState({ bolus: { filled: side === "left" ? ["LM", "LAD"] : ["RCA"], plume: "none", side, phase: 0.5, duration: 60, progress: 1, intensity: 1, peak: 1, diagnostic: true, filmed: true, counted: true, labEnded: true } });
  s.step(0.01);
  useSimulatorStore.setState({ bolus: null, engagement: { ...g().engagement, kind, target: side, isSelective: true } });
}

describe("diag-nitrate-dose-by-pressure raises what its tips need", () => {
  it("after the action that raises 'ostial-spasm' (a JR seated deep in the small RCA ventricularises it), tipsFor(ctx, 20) includes diag-acq-spasm-repeat-view and diag-ostial-spasm-withdraw-nitrate", () => {
    const s = session(scenarioCase("diag-nitrate-dose-by-pressure")!);
    s.setTimeOutDone(true);
    run(s, 1);
    // a coaxial, free seat in the RCA and a filmed run: views, but no spasm
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "selective-rca", target: "right", isSelective: true, isDeep: false, quality: 0.9 } });
    run(s, 2);
    filmed(s, "right");
    expect(s.tipContext().phase).toBe("views");
    expect(s.tipContext().events).not.toContain("ostial-spasm");
    expect(tipIds(s)).not.toContain("diag-ostial-spasm-withdraw-nitrate");
    // seated deep: the trace ventricularises, the script raises ostial-spasm
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "deep-rca", target: "right", isSelective: true, isDeep: true } });
    run(s, 3);
    expect(["ventricularised", "damped"]).toContain(s.tipState);
    expect(scriptOf(s).firedTriggers()).toEqual(["tip-spasm"]);
    // withdrawn to a free seat and the same view filmed again: the views phase, the spasm still held
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "selective-rca", target: "right", isSelective: true, isDeep: false, quality: 0.9 } });
    run(s, 2);
    filmed(s, "right");
    const ctx = s.tipContext();
    expect(ctx.phase).toBe("views");
    expect(ctx.events).toContain("ostial-spasm");
    const ids = tipIds(s);
    expect(ids).toContain("diag-acq-spasm-repeat-view");
    expect(ids).toContain("diag-ostial-spasm-withdraw-nitrate");
    s.dispose();
  });

  it("intracoronary nitrate raises vasodilator-given into the context, and diag-nitrate-dose-by-pressure shows while the syringe is pushed", () => {
    const s = session(scenarioCase("diag-nitrate-dose-by-pressure")!, "independent");
    s.setTimeOutDone(true);
    run(s, 1);
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "selective-lm", target: "left", isSelective: true, isDeep: false, quality: 0.9 } });
    run(s, 2);
    const m = drugsOf(s);
    expect(m.order({ entryId: "gtn", dose: 100, via: "manifold" }).ok).toBe(true);
    expect(m.give().ok).toBe(true);
    expect(s.tipContext().events).toContain("vasodilator-given");
    // the plunger down: the inject phase, and the dose tip
    expect(s.startInjection()).toBe(true);
    expect(s.tipContext().phase).toBe("inject");
    expect(tipIds(s)).toContain("diag-nitrate-dose-by-pressure");
    s.injector.finish();
    s.dispose();
  });

  it("diag-pde5-patient holds pde5-recent from the first frame (the chart's tadalafil, inside its 48 h window)", () => {
    const s = session(scenarioCase("diag-pde5-patient")!);
    expect(s.tipContext().phase).toBe("setup");
    expect(s.tipContext().events).toContain("pde5-recent");
    s.dispose();
    // the module holds it from the chart alone, in a case that does not declare it
    const c = scenarioCase("diag-nitrate-dose-by-pressure")!;
    c.chart = { ...c.chart!, drugs: [...(c.chart!.drugs ?? []), { name: "Vardenafil", drugId: "vardenafil", lastDoseHoursAgo: 6 }] };
    const t = session(c);
    expect(t.tipContext().events).toContain("pde5-recent");
    t.dispose();
  });
});

describe("the practice index", () => {
  it("lists diag-nitrate-dose-by-pressure, diag-pde5-patient and diag-nitrate-hypotension under pm-acquiring-test-nitrate, pm-lab-drugs-nitrates and cm-patient-complications-hypotension (from drugs.launch.ts)", () => {
    const ids = (lesson: string) => practiceForLesson(lesson).filter((e) => e.sim === "cathlab").map((e) => e.scenario);
    expect(ids("pm-acquiring-test-nitrate")).toContain("diag-nitrate-dose-by-pressure");
    expect(ids("pm-lab-drugs-nitrates")).toEqual(expect.arrayContaining(["diag-nitrate-dose-by-pressure", "diag-pde5-patient", "diag-nitrate-hypotension", "diag-nitrate-on-infusion"]));
    expect(ids("cm-patient-complications-hypotension")).toContain("diag-nitrate-hypotension");
    for (const sc of drugLaunch.scenarios ?? []) for (const l of sc.lessonIds) expect(ids(l), `${sc.id} under ${l}`).toContain(sc.id);
    // every scenario of the pack is registered
    for (const sc of drugScenarios) expect(DIAG_SCENARIOS.some((x) => x.id === sc.id), sc.id).toBe(true);
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
  it("the drug module raises vasodilator-given and pde5-recent; the script module's raises include the pack's events (derived from the registry)", () => {
    expect(drugRaises).toEqual({ lab: "diagnostic", phases: [], events: ["vasodilator-given", "pde5-recent"] });
    for (const e of scenariosEvents(drugScenarios)) expect(scriptRaises.events).toContain(e);
    expect(scriptRaises.events).toEqual(expect.arrayContaining(["ostial-spasm", "pde5-recent", "stemi", "nste-acs"]));
  });

  it("every waiting.ts entry naming diag-lab-drugs is satisfiable; prints the diagnostic lab's waiting count before and after this package", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === "diag-lab-drugs").flatMap((w) => w.tips);
    expect(mine).toEqual(["diag-anaphylaxis-im-adrenaline"]);
    // the packs as they stood when this one landed: without it, and without the later spasm pack (diag-spasm-states), which raises ostial-spasm too
    const others = DIAG_SCENARIOS.filter((s) => !drugScenarios.includes(s) && !spasmScenarios.includes(s));
    const before: LabRaises[] = [diagnosticRaises, { ...scriptRaises, events: scenariosEvents(others) }];
    const after: LabRaises[] = [diagnosticRaises, scriptRaises, drugRaises];
    expect(mine.filter((id) => !satisfiable(TIP_BY_ID[id], after))).toEqual([]);
    // 'contrast-reaction' already comes from the patient-event adapter (found-lab-session-plumbing), so
    // this entry was satisfiable before this package landed; the count below says what did change
    const waiting = new Set(WAITING_TIPS.filter((w) => w.lab === "diagnostic").flatMap((w) => w.tips));
    const stillWaiting = (rs: LabRaises[]) => LAB_TIPS.filter((t) => waiting.has(t.id) && !satisfiable(t, rs)).map((t) => t.id);
    const b = stillWaiting(before);
    const a = stillWaiting(after);
    console.info(`diagnostic tips listed in waiting.ts and still not satisfiable: ${b.length} -> ${a.length} (now satisfiable: ${b.filter((id) => !a.includes(id)).join(", ") || "none"})`);
    // the plan's acceptance: the count falls by at least the number of entries naming this package
    expect(b.length - a.length).toBeGreaterThanOrEqual(mine.length);
    // the spasm tips (listed under diag-spasm-states) are satisfiable through this pack's ostial-spasm
    expect(a).not.toContain("diag-ostial-spasm-withdraw-nitrate");
    expect(a).not.toContain("diag-acq-spasm-repeat-view");
  });
});
