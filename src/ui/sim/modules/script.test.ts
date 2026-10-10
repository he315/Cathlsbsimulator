// The scenario script module (diag-scenario-registry): named scenarios raise the events their tips
// are written for, the script's conditions and actions, and the reachability of every waiting.ts
// entry this package is named for, from the lab's own raises exports.
//   npx vitest run src/ui/sim/modules/script.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../../state/useSimulatorStore";
import { CASE_LIBRARY, scenarioCase } from "../../../simulation/caseGenerator";
import { LAB_TIPS, TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { raises as diagnosticRaises } from "../../lab/diagnosticContext";
import { DIAG_SCENARIOS, type DiagScenario } from "../../../simulation/diagnosticScenarios";
import type { AnatomyCase } from "../../../types";
import { DiagnosticLabSession } from "../labSession";
import { SCRIPT_MODULE_ID, ScenarioScript, createScriptModule, raises as scriptRaises } from "./script";

const SESSION_MODULE_RAISES = import.meta.glob<LabRaises | readonly LabRaises[] | undefined>(["./*.ts", "!./index.ts", "!./*.test.ts"], { eager: true, import: "raises" });

const g = () => useSimulatorStore.getState();
afterEach(() => g().setPedalImaging(false));

function session(c: AnatomyCase, modules?: Parameters<typeof createScriptModule>[0] | null): DiagnosticLabSession {
  g().loadCase(c, "free");
  return new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, modules: modules === null ? [] : modules ? [createScriptModule(modules)] : undefined });
}
const scriptOf = (s: DiagnosticLabSession) => s.modules.find((m) => m.id === SCRIPT_MODULE_ID) as ScenarioScript;
const tipIds = (s: DiagnosticLabSession) => tipsFor(s.tipContext(), 20).map((t) => t.id);

describe("scenarios from core.launch.ts raise what their tips need", () => {
  it("diag-ohca-post-rosc: after the action that raises 'st-elevation', tipsFor(ctx, 20) includes diag-ohca-ecg-sorts", () => {
    const c = scenarioCase("diag-ohca-post-rosc")!;
    // without the script the case event alone does not show the tip
    const bare = session(c, null);
    expect(bare.tipContext()).toMatchObject({ phase: "setup", events: ["post-arrest", "stemi"] });
    expect(tipIds(bare)).not.toContain("diag-ohca-ecg-sorts");
    bare.dispose();
    // the registered script module raises the post-resuscitation ECG's ST elevation at once
    const s = session(c);
    expect(scriptOf(s).firedTriggers()).toEqual(["post-rosc-ecg"]);
    const ctx = s.tipContext();
    expect(ctx.phase).toBe("setup");
    expect(ctx.events).toEqual(expect.arrayContaining(["post-arrest", "st-elevation"]));
    expect(tipIds(s)).toContain("diag-ohca-ecg-sorts");
    // held for the case
    for (let i = 0; i < 40; i++) s.step(0.1);
    expect(s.tipContext().events).toContain("st-elevation");
    s.dispose();
  });

  it("diag-contrast-sensitive: after its first action, tipsFor(ctx, 20) includes diag-bg-contrast-heart-failure", () => {
    const c = scenarioCase("diag-contrast-sensitive")!;
    const s = session(c);
    expect(tipIds(s)).not.toContain("diag-bg-contrast-heart-failure");
    // 90 mL is past the warning (80%) of the stricter ceiling, 3.7 × eGFR 30 = 111 mL
    s.engine.contrast(90, "left");
    expect(s.engine.contrastBudget().status).toBe("warn");
    s.step(0.3);
    expect(scriptOf(s).firedTriggers()[0]).toBe("contrast-warning");
    expect(s.tipContext().events).toContain("high-contrast-volume");
    expect(tipIds(s)).toContain("diag-bg-contrast-heart-failure");
    s.dispose();
    // the same volume in the same patient without the script: the patient-event adapter's own
    // threshold (the Cigarroa fraction) has not been reached, so the event is the script's
    const bare = session(c, null);
    bare.engine.contrast(90, "left");
    bare.step(0.3);
    expect(bare.tipContext().events).not.toContain("high-contrast-volume");
    bare.dispose();
  });

  it("diag-scad-suspected: scad-suspected is in the context from the first frame, with diag-ocx-scad-setup at setup", () => {
    const s = session(scenarioCase("diag-scad-suspected")!);
    expect(s.tipContext().events).toContain("scad-suspected");
    expect(tipIds(s)).toContain("diag-ocx-scad-setup");
    s.dispose();
  });
});

describe("the script's conditions and actions", () => {
  const base = DIAG_SCENARIOS[0];
  const fixture = (script: DiagScenario["script"]): ((id: string) => DiagScenario | undefined) => (id) => (id === "fixture-script" ? { ...base, id: "fixture-script", script } : undefined);
  const routine = { ...CASE_LIBRARY[0], scenarioId: "fixture-script" };

  it("fires a timed trigger once, after its time, and raises with a transient or a case hold", () => {
    const s = session(routine, fixture([
      { id: "late", when: { afterS: 2 }, do: [{ kind: "raise", event: "chest-pain", hold: 3 }] },
      { id: "case", when: { afterS: 1 }, do: [{ kind: "raise", event: "post-arrest", hold: "case" }] },
    ]));
    const sc = scriptOf(s);
    expect(sc.firedTriggers()).toEqual([]);
    for (let i = 0; i < 12; i++) s.step(0.1);
    expect(sc.firedTriggers()).toEqual(["case"]);
    for (let i = 0; i < 10; i++) s.step(0.1);
    expect(sc.firedTriggers()).toEqual(["case", "late"]);
    expect(s.activeEvents()).toEqual(expect.arrayContaining(["chest-pain", "post-arrest"]));
    for (let i = 0; i < 40; i++) s.step(0.1);
    expect(s.activeEvents()).not.toContain("chest-pain");
    expect(s.activeEvents()).toContain("post-arrest");
    expect(sc.firedTriggers()).toEqual(["case", "late"]);
    s.dispose();
  });

  it("the first injection of a side, an engine action and a line fault", () => {
    const s = session(routine, fixture([
      { id: "right", when: { firstInjection: "right" }, do: [{ kind: "raise", event: "vagal" }] },
      { id: "any", when: { firstInjection: "any" }, do: [{ kind: "engine", vasodilation: 0.4 }, { kind: "transducer", airMl: 0.05 }] },
    ]));
    const sc = scriptOf(s);
    sc.onInject({ t: 0, side: "left", outcome: null, catheterId: "JL4" });
    expect(sc.firedTriggers()).toEqual(["any"]);
    expect(s.engine.transducer.st.airMl).toBe(0.05);
    sc.onInject({ t: 1, side: "right", outcome: null, catheterId: "JR4" });
    expect(sc.firedTriggers()).toEqual(["any", "right"]);
    expect(s.activeEvents()).toContain("vagal");
    s.dispose();
  });

  it("a case that is not a named scenario runs no script", () => {
    const s = session(CASE_LIBRARY[0]);
    expect(scriptOf(s).scenario).toBeNull();
    s.step(0.5);
    expect(scriptOf(s).firedTriggers()).toEqual([]);
    s.dispose();
  });
});

// --- reachability ----------------------------------------------------------------

function satisfiableIn(when: TipTrigger, phases: readonly string[] | undefined, rs: readonly LabRaises[]): boolean {
  const has = (key: "phases" | "events" | "routes" | "procedures" | "techniques" | "imaging", x: string) => rs.some((r) => ((r[key] ?? []) as readonly string[]).includes(x));
  const any = (want: readonly string[] | undefined, key: Parameters<typeof has>[0]) => !want?.length || want.some((x) => has(key, x));
  return any(phases, "phases") && any(when.event, "events") && (when.requires ?? []).every((e) => has("events", e)) && any(when.procedure, "procedures") && any(when.route, "routes") && any(when.technique, "techniques") && any(when.imaging, "imaging");
}
const satisfiable = (tip: LabTip, rs: readonly LabRaises[]) => (tip.lab === "diagnostic" ? satisfiableIn(tip.when, tip.when.phase, rs) : (tip.alsoIn ?? []).some((a) => a.lab === "diagnostic" && satisfiableIn(tip.when, a.phase, rs)));

function diagnosticRaisesAll(exclude?: string): LabRaises[] {
  const out: LabRaises[] = [diagnosticRaises];
  for (const [file, exp] of Object.entries(SESSION_MODULE_RAISES)) {
    if (!exp || file === exclude) continue;
    for (const r of Array.isArray(exp) ? exp : [exp as LabRaises]) if (r.lab === "diagnostic") out.push(r);
  }
  return out;
}

describe("reachability", () => {
  it("raises is derived from the registry: every case event and scripted event", () => {
    for (const s of DIAG_SCENARIOS) {
      for (const e of s.events) expect(scriptRaises.events).toContain(e);
      for (const tr of s.script ?? []) for (const a of tr.do) if (a.kind === "raise") expect(scriptRaises.events).toContain(a.event);
    }
    expect(scriptRaises.events).toEqual(expect.arrayContaining(["post-arrest", "st-elevation", "high-contrast-volume", "scad-suspected"]));
  });

  it("every waiting.ts entry naming diag-scenario-registry is satisfiable, so the diagnostic lab's waiting count falls by at least their number", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === "diag-scenario-registry").flatMap((w) => w.tips);
    expect(mine.length).toBeGreaterThan(0);
    const before = diagnosticRaisesAll("./script.ts");
    const after = diagnosticRaisesAll();
    expect(mine.filter((id) => satisfiable(TIP_BY_ID[id], before))).toEqual([]);
    expect(mine.filter((id) => !satisfiable(TIP_BY_ID[id], after))).toEqual([]);
    const waiting = new Set(WAITING_TIPS.filter((w) => w.lab === "diagnostic").flatMap((w) => w.tips));
    const stillWaiting = (rs: LabRaises[]) => LAB_TIPS.filter((t) => waiting.has(t.id) && !satisfiable(t, rs)).length;
    const fell = stillWaiting(before) - stillWaiting(after);
    console.info(`diagnostic tips listed in waiting.ts and still not satisfiable: ${stillWaiting(before)} -> ${stillWaiting(after)}`);
    expect(fell).toBeGreaterThanOrEqual(mine.length);
  });
});
