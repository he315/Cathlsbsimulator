// ---------------------------------------------------------------------------
// The scenario script (diag-scenario-registry): a diagnostic session module
// that runs the script of the named scenario the case was built from
// (src/simulation/diagnosticScenarios/, AnatomyCase.scenarioId).
//
// Conditions: lab time elapsed, the first injection of a side, the pressure at
// the catheter tip (the engine's tip state), the store's engagement, and the
// contrast used against the stricter contrast ceiling (contrastBudget.ts).
// Actions: raise a tip event into the session's EventLog, change the patient
// engine (rhythm, vascular tone, bleeding, a coronary occlusion), or put a
// fault in the pressure line. Each trigger fires once. Triggers whose
// conditions already hold when the session is built fire at once, so a
// scenario's history (for example scad-suspected) is in the tip context from
// the first frame.
//
// `raises` (read by the reachability report) is derived from the scenario
// registry: every case event a scenario holds and every event its script
// raises.
// ---------------------------------------------------------------------------

import type { LabRaises } from "../../../content/lab/raisable/waiting";
import { diagScenarioById, scenariosEvents, type DiagScenario, type ScenarioAction, type ScenarioCondition, type ScenarioTrigger } from "../../../simulation/diagnosticScenarios";
import type { DiagnosticLabSession } from "../labSession";
import type { SessionInjection, SessionModule, SessionModuleFactory } from "./index";

/** Seconds of lab time between evaluations of conditions that read the engine (MODEL PARAMETER: a quarter-second is below what an operator notices). */
export const SCRIPT_EVAL_S = 0.25;

/** The module's id in the session. */
export const SCRIPT_MODULE_ID = "scenario-script";

function needsEngine(c: ScenarioCondition): boolean {
  return c.tipState !== undefined || c.contrast !== undefined;
}

/** Run a scenario's script against a session. */
export class ScenarioScript implements SessionModule {
  readonly id = SCRIPT_MODULE_ID;
  /** the scenario whose script runs (null: the case is not a named scenario, or it has no script) */
  scenario: DiagScenario | null = null;
  private session: DiagnosticLabSession | null = null;
  private triggers: readonly ScenarioTrigger[] = [];
  private readonly fired = new Set<string>();
  private readonly injected = { left: false, right: false, any: false };
  private sinceEval = Infinity;

  constructor(private readonly lookup: (id: string) => DiagScenario | undefined = diagScenarioById) {}

  attach(session: DiagnosticLabSession) {
    this.session = session;
    const id = session.store.getState().caseData.scenarioId;
    this.scenario = (id && this.lookup(id)) || null;
    this.triggers = this.scenario?.script ?? [];
    this.evaluate(true);
    return () => {
      this.session = null;
    };
  }

  step(dt: number) {
    if (!this.triggers.length) return;
    this.sinceEval += dt;
    const engineDue = this.sinceEval >= SCRIPT_EVAL_S;
    if (engineDue) this.sinceEval = 0;
    this.evaluate(engineDue);
  }

  onInject(ev: SessionInjection) {
    this.injected[ev.side] = true;
    this.injected.any = true;
    this.evaluate(true);
  }

  /** Ids of the triggers that have fired, in firing order. */
  firedTriggers(): string[] {
    return [...this.fired];
  }

  private evaluate(engineDue: boolean) {
    const s = this.session;
    if (!s) return;
    for (const tr of this.triggers) {
      if (this.fired.has(tr.id)) continue;
      if (needsEngine(tr.when) && !engineDue) continue;
      if (!this.holds(tr.when, s)) continue;
      this.fired.add(tr.id);
      for (const a of tr.do) this.apply(a, s);
    }
  }

  private holds(c: ScenarioCondition, s: DiagnosticLabSession): boolean {
    if (c.afterS !== undefined && s.wall() < c.afterS) return false;
    if (c.firstInjection !== undefined && !this.injected[c.firstInjection]) return false;
    if (c.engagement !== undefined) {
      const k = s.store.getState().engagement?.kind;
      if (!k || !c.engagement.includes(k)) return false;
    }
    if (c.tipState !== undefined && !c.tipState.includes(s.engine.vitals().tipState)) return false;
    if (c.contrast !== undefined) {
      const st = s.engine.contrastBudget().status;
      if (c.contrast === "warn" ? st === "ok" : st !== "over") return false;
    }
    return true;
  }

  private apply(a: ScenarioAction, s: DiagnosticLabSession) {
    const t = s.wall();
    if (a.kind === "raise") {
      if (a.hold === "case") s.events.hold([a.event], t, "script");
      else s.events.raise(a.event, a.hold, t, "script");
    } else if (a.kind === "engine") {
      const e = s.engine;
      if (a.rhythm) e.forceRhythm(a.rhythm, "scenario");
      if (a.vasodilation !== undefined) e.setVasodilation(a.vasodilation);
      if (a.haemorrhageMlPerS !== undefined) e.setHaemorrhage(a.haemorrhageMlPerS);
      if (a.occlusion) e.setOcclusion(a.occlusion.id, { vessel: a.occlusion.vessel, param: a.occlusion.param, fraction: a.occlusion.fraction });
    } else {
      const tr = s.engine.transducer;
      if (a.airMl !== undefined) tr.setAir(a.airMl);
      if (a.openToAir !== undefined) tr.setOpenToAir(a.openToAir);
      if (a.heightCm !== undefined) tr.setHeight(a.heightCm);
    }
    s.notify();
  }
}

/** A factory for the script module with its own scenario lookup (tests pass fixtures). */
export function createScriptModule(lookup?: (id: string) => DiagScenario | undefined): SessionModuleFactory {
  return () => new ScenarioScript(lookup);
}

export const createSessionModule: SessionModuleFactory = createScriptModule();

/** What the scripts and the scenarios' case events can put into the diagnostic lab's context. */
export const raises: LabRaises = { lab: "diagnostic", phases: [], events: scenariosEvents() };
