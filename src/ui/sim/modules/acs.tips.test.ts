// The ACS scenarios through the scenario script module (diag-acs-scenarios): the STEMI cases hold
// st-elevation from the presenting ECG, so the STEMI tips appear at the setup and engagement phases;
// the postpartum SCAD dissects on deep intubation; the iatrogenic occlusion's ST elevation comes
// from the patient engine during the study; and every waiting.ts entry naming this package is
// satisfiable from the labs' own raises exports.
//   npx vitest run src/ui/sim/modules/acs.tips.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../../state/useSimulatorStore";
import { scenarioCase } from "../../../simulation/caseGenerator";
import { TIP_BY_ID, tipsFor, type LabTip, type TipTrigger } from "../../../content/lab/tips";
import { WAITING_TIPS, type LabRaises } from "../../../content/lab/raisable/waiting";
import { raises as diagnosticRaises } from "../../lab/diagnosticContext";
import { scenariosEvents } from "../../../simulation/diagnosticScenarios";
import { scenarios as acsScenarios } from "../../../simulation/diagnosticScenarios/acs";
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

describe("the ACS scenarios raise what their tips need", () => {
  it("diag-stemi-anterior: after the action that raises 'st-elevation' (the presenting ECG), tipsFor(ctx, 20) includes diag-stemi-predict-artery and diag-stemi-engagement-order", () => {
    const s = session(scenarioCase("diag-stemi-anterior")!);
    expect(scriptOf(s).firedTriggers()).toEqual(["presenting-ecg"]);
    const setup = s.tipContext();
    expect(setup.phase).toBe("setup");
    expect(setup.events).toEqual(expect.arrayContaining(["stemi", "st-elevation"]));
    expect(tipIds(s)).toContain("diag-stemi-predict-artery");
    // after the time-out, at the left coronary: the engagement order
    s.setTimeOutDone(true);
    // a hand on the catheter: it is in the root
    g().commandInsertion(1);
    s.step(0.1);
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "near-lm", target: "left", isSelective: false } });
    s.step(0.05);
    const engage = s.tipContext();
    expect(engage.phase).toBe("engage-left");
    const ids = tipIds(s);
    expect(ids).toContain("diag-stemi-predict-artery");
    expect(ids).toContain("diag-stemi-engagement-order");
    // held for the case
    for (let i = 0; i < 20; i++) s.step(0.1);
    expect(s.tipContext().events).toContain("st-elevation");
    s.dispose();
  });

  it("the inferior, posterior and arrest cases hold st-elevation from the start; the stable arrest without ST elevation does not", () => {
    for (const id of ["diag-stemi-inferior-rv", "diag-stemi-posterior", "diag-ohca-st-elevation", "diag-scad-postpartum"]) {
      const s = session(scenarioCase(id)!);
      expect(s.tipContext().events, id).toContain("st-elevation");
      s.dispose();
    }
    const stable = session(scenarioCase("diag-ohca-no-st")!);
    expect(stable.tipContext().events).toContain("post-arrest");
    expect(stable.tipContext().events).not.toContain("st-elevation");
    stable.dispose();
  });

  it("diag-scad-postpartum: scad-suspected from the start shows diag-ocx-scad-setup; deep intubation of the left main dissects it, held for the case", () => {
    const s = session(scenarioCase("diag-scad-postpartum")!);
    expect(tipIds(s)).toContain("diag-ocx-scad-setup");
    expect(s.tipContext().events).not.toContain("dissection");
    s.setTimeOutDone(true);
    s.step(0.1);
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "selective-lm", target: "left", isSelective: true, isDeep: false } });
    s.step(0.3);
    expect(scriptOf(s).firedTriggers()).not.toContain("deep-intubation-dissection");
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "deep-lm", target: "left", isSelective: true, isDeep: true } });
    s.step(0.3);
    expect(scriptOf(s).firedTriggers()).toContain("deep-intubation-dissection");
    expect(s.tipContext().events).toContain("dissection");
    for (let i = 0; i < 20; i++) s.step(0.1);
    expect(s.tipContext().events).toContain("dissection");
    s.dispose();
  });

  it("diag-scad-postpartum: a normal left injection followed by a damped trace, with no injection into it, does not dissect", () => {
    const s = session(scenarioCase("diag-scad-postpartum")!);
    s.setTimeOutDone(true);
    s.step(0.1);
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "selective-lm", target: "left", isSelective: true, isDeep: false } });
    expect(s.startInjection()).toBe(true);
    s.step(0.2);
    // the trace damps afterwards; the learner sees it and withdraws without injecting
    const vitals = s.engine.vitals.bind(s.engine);
    s.engine.vitals = () => ({ ...vitals(), tipState: "damped" });
    for (let i = 0; i < 10; i++) s.step(0.1);
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "near-lm", target: "left", isSelective: false, isDeep: false } });
    for (let i = 0; i < 5; i++) s.step(0.1);
    expect(scriptOf(s).firedTriggers().filter((id) => /dissection/.test(id))).toEqual([]);
    expect(s.tipContext().events).not.toContain("dissection");
    s.dispose();
  });

  it("diag-iatrogenic-occlusion: nothing until the first right coronary run; the embolus then raises st-elevation from the patient during the study, and diag-stemi-during-cath appears", () => {
    const s = session(scenarioCase("diag-iatrogenic-occlusion")!);
    s.setTimeOutDone(true);
    s.step(0.1);
    expect(s.tipContext().events).not.toContain("st-elevation");
    useSimulatorStore.setState({ engagement: { ...g().engagement, kind: "selective-rca", target: "right", isSelective: true } });
    expect(s.startInjection()).toBe(true);
    expect(scriptOf(s).firedTriggers()).toEqual(["embolus"]);
    let t = 0;
    while (!s.tipContext().events?.includes("st-elevation") && t < 240) {
      s.step(0.2);
      t += 0.2;
    }
    const ctx = s.tipContext();
    expect(ctx.events).toContain("st-elevation");
    expect(["inject", "views", "engage-right"]).toContain(ctx.phase);
    // the views phase after the run: the during-catheterisation tip
    useSimulatorStore.setState({ bolus: { filled: ["RCA"], plume: "none", side: "right", phase: 0.5, duration: 60, progress: 1, intensity: 1, peak: 1, diagnostic: true, filmed: true, counted: true, labEnded: true } });
    s.injector.finish();
    s.step(0.01);
    useSimulatorStore.setState({ bolus: null });
    s.step(0.01);
    const after = s.tipContext();
    expect(after.phase).toBe("views");
    expect(after.events).toContain("st-elevation");
    expect(tipIds(s)).toContain("diag-stemi-during-cath");
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

describe("reachability", () => {
  it("the script module's raises include this pack's events (derived from the registry)", () => {
    for (const e of scenariosEvents(acsScenarios)) expect(scriptRaises.events).toContain(e);
    expect(scriptRaises.events).toEqual(expect.arrayContaining(["stemi", "st-elevation", "post-arrest", "vasopressor", "scad-suspected", "dissection", "chest-pain", "nste-acs"]));
  });

  it("every waiting.ts entry naming diag-acs-scenarios is satisfiable, so the diagnostic lab's waiting count falls by at least their number", () => {
    const mine = WAITING_TIPS.filter((w) => w.raisedBy === "diag-acs-scenarios");
    const ids = mine.flatMap((w) => w.tips);
    expect(ids).toContain("diag-ohca-ecg-sorts");
    const rs = [...(Array.isArray(diagnosticRaises) ? diagnosticRaises : [diagnosticRaises]), scriptRaises] as LabRaises[];
    for (const id of ids) {
      const tip = TIP_BY_ID[id];
      expect(tip, id).toBeDefined();
      expect(satisfiable(tip, rs), id).toBe(true);
    }
    // and the ACS tips this package is for
    for (const id of ["diag-stemi-predict-artery", "diag-stemi-engagement-order", "diag-ohca-ecg-sorts", "diag-ocx-scad-setup", "diag-stemi-during-cath"]) expect(satisfiable(TIP_BY_ID[id], rs), id).toBe(true);
  });
});
