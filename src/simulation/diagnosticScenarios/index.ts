// ---------------------------------------------------------------------------
// Named diagnostic scenarios (diag-scenario-registry).
//
// A scenario is one patient: a case spec for the anatomy, a patient chart
// (src/types CaseChart), the case-wide events it raises for the tips, and an
// optional script of timed or conditional events. scenarioCase(id, seed) in
// src/simulation/caseGenerator.ts turns it into an AnatomyCase with the id
// 'scn|<id>|<seed>', which resolveCase and reconstructCase decode; the lab
// session seeds the thorax, the coronary genome and the patient engine from
// that one id and takes weight, renal function, LVEF and drugs from the chart.
//
// Packs are discovered by glob: every src/simulation/diagnosticScenarios/*.ts
// other than this file, the .launch.ts metadata files and the tests exports
// `scenarios: DiagScenario[]`. A later package adds a pack file instead of
// editing this one. Each pack has a .launch.ts beside it with the same ids
// (engine-free metadata for the lesson links and the practice index;
// scenarios.test.ts checks that the two agree).
//
// Packs import types only (from here, src/types and caseGenerator), so the
// case generator can import this registry without a cycle.
// ---------------------------------------------------------------------------

import type { CaseChart, EngagementKind, Graft, Lesion } from "../../types";
import type { CaseSpec } from "../caseGenerator";
import type { LabEvent } from "../../content/lab/tips";
import type { LaunchMode } from "../../content/schema";
import type { TipPressureState } from "../patient/transducer";
import type { Indication } from "../patient/patient";

// --- the script ---------------------------------------------------------------

/**
 * When a scripted trigger fires. Every field given must hold at once; a trigger with no field fires
 * on the session's first step.
 */
export interface ScenarioCondition {
  /** at least this many seconds of lab time have passed */
  afterS?: number;
  /** the first injection of this side has been given ('any': the first injection of the case) */
  firstInjection?: "left" | "right" | "any";
  /** the pressure at the catheter tip (the engine's tip state) is one of these */
  tipState?: readonly TipPressureState[];
  /** the catheter's engagement (the diagnostic store's engagement kind) is one of these */
  engagement?: readonly EngagementKind[];
  /**
   * the contrast used has reached the warning ('warn') or the ceiling ('over') of the stricter
   * contrast rule (src/simulation/patient/contrastBudget.ts, with its defaults)
   */
  contrast?: "warn" | "over";
}

/** Raise a tip event. hold 'case' keeps it for the rest of the case; a number holds it for that many seconds; absent, the event log's default hold. */
export interface RaiseAction {
  kind: "raise";
  event: LabEvent;
  hold?: "case" | number;
}

/** Change the patient engine (src/simulation/patient/engine.ts). Values are the scenario's MODEL PARAMETERS. */
export interface EngineAction {
  kind: "engine";
  rhythm?: "vf" | "vt" | "asystole" | "aivr" | "sinus" | "chb";
  /** loss of vascular tone, 0..1 */
  vasodilation?: number;
  /** ongoing blood loss, mL/s */
  haemorrhageMlPerS?: number;
  /** a coronary occlusion by the engine's own id */
  occlusion?: { id: string; vessel: string; param: number; fraction: number };
}

/** A fault in the pressure line (src/simulation/patient/transducer.ts). Values are the scenario's MODEL PARAMETERS. */
export interface TransducerAction {
  kind: "transducer";
  /** air in the line, mL */
  airMl?: number;
  openToAir?: boolean;
  /** transducer height above the phlebostatic axis, cm */
  heightCm?: number;
}

export type ScenarioAction = RaiseAction | EngineAction | TransducerAction;

export interface ScenarioTrigger {
  /** unique within the scenario */
  id: string;
  when: ScenarioCondition;
  do: readonly ScenarioAction[];
}

/** A success criterion of the scenario (what the debrief checks), written from the lab request. */
export interface ScenarioCheck {
  id: string;
  text: string;
  /** the lesson that teaches it */
  lessonId?: string;
}

// --- the scenario ---------------------------------------------------------------

/**
 * Problems a chart can plant, each asked about at the pre-brief (src/mentor/prebrief.ts
 * chartQuestions): pregnancy status not documented, a PDE-5 inhibitor within its window, the
 * contrast ceiling from the eGFR, a previous radiation skin injury, and the operation note after
 * CABG.
 */
export type ChartProblem = "pregnancy" | "pde5" | "egfr-ceiling" | "skin-injury" | "operation-note";

export interface DiagScenario {
  id: string;
  /**
   * The scenario's name outside the lab: the case library and the lessons' practice rows (the same
   * title as its .launch.ts entry). It may name what the case teaches.
   */
  title: string;
  /**
   * The case's name in the lab (AnatomyCase.name: the lab header and the pre-brief title, in every
   * mode, exams included). It states the presentation only: no lesion morphology and nothing the
   * chart plants (scenarios.test.ts checks).
   */
  caseName: string;
  /**
   * The indication the patient engine's seeded patient is drawn with (generatePatient), so that an
   * acute coronary syndrome on the chart is one in the engine and an elective case is not. Absent,
   * the seed draws it from the AngioCAD mix; every scenario with a history should set it.
   */
  indication?: Indication;
  /** the case as the attending presents it at the pre-brief */
  brief: string;
  /** lessons this scenario practises (the same ids as its .launch.ts entry) */
  lessonIds: string[];
  /** the curriculum module the case library lists it under */
  module: { id: string; title: string };
  /** the anatomy draw (root, dominance, access, focus, variants, pathology) */
  spec: CaseSpec;
  /** lesions replacing those the spec's pathology draws */
  lesions?: Lesion[];
  grafts?: Graft[];
  /** case-wide events, held for the whole case from the first frame */
  events: LabEvent[];
  chart: CaseChart;
  /**
   * The chart problems the pre-brief asks about. Absent: every problem the chart shows except the
   * eGFR ceiling, which is asked only below the eGFR of Brilakis's advanced-CKD advisory.
   */
  planted?: ChartProblem[];
  /**
   * Where the case opens: the catheter at the aortic root (the legacy lab's start) or the sheath.
   * Reserved: nothing reads it yet, and every scenario here opens at the root. The package that
   * starts cases at the sheath (diag-route-wire-led-radial in docs/curriculum/lab-build-plan.json)
   * reads it.
   */
  startAt: "root" | "sheath";
  script?: ScenarioTrigger[];
  /**
   * The success criteria, kept with the scenario for the debrief. Reserved: no package in
   * docs/curriculum/lab-build-plan.json grades them yet; scenarios.test.ts checks that each check's
   * lesson exists.
   */
  checks: ScenarioCheck[];
  /** the mode a launch without one opens it in (default: the learner's level) */
  mode?: LaunchMode;
  /** objectives replacing the generated defaults */
  objectives?: string[];
}

/** What a pack file exports. */
export interface DiagScenarioPack {
  scenarios?: DiagScenario[];
}

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Collect the scenarios of glob modules (path to module), in file-name order. A malformed pack, a
 * scenario without a kebab-case id or a chart, a duplicate scenario id or a repeated trigger id is an
 * error: with `onError` the error is reported and the offending pack or scenario skipped (the first
 * declaration of an id is kept); without it the collector throws.
 */
export function collectDiagScenarios(files: Record<string, unknown>, onError?: (message: string) => void): DiagScenario[] {
  const fail = (message: string) => {
    if (!onError) throw new Error(message);
    onError(message);
  };
  const out: DiagScenario[] = [];
  const seen = new Map<string, string>();
  for (const file of Object.keys(files).sort()) {
    const list = (files[file] as DiagScenarioPack | undefined)?.scenarios;
    if (!Array.isArray(list)) {
      fail(`diagnostic scenario pack ${file} does not export 'scenarios'`);
      continue;
    }
    scenario: for (const s of list) {
      if (!s || typeof s.id !== "string" || !KEBAB.test(s.id)) {
        fail(`a diagnostic scenario in ${file} has no kebab-case id`);
        continue;
      }
      if (seen.has(s.id)) {
        fail(`diagnostic scenario id '${s.id}' is declared in ${seen.get(s.id)} and ${file}`);
        continue;
      }
      if (!s.chart || typeof s.chart.ageY !== "number") {
        fail(`diagnostic scenario '${s.id}' has no chart`);
        continue;
      }
      const ids = new Set<string>();
      for (const tr of s.script ?? []) {
        if (ids.has(tr.id)) {
          fail(`diagnostic scenario '${s.id}' uses the trigger id '${tr.id}' twice`);
          continue scenario;
        }
        ids.add(tr.id);
      }
      seen.set(s.id, file);
      out.push(s);
    }
  }
  return out;
}

const PACKS = import.meta.glob<DiagScenarioPack>(["./*.ts", "!./index.ts", "!./*.launch.ts", "!./*.test.ts"], { eager: true });

/**
 * The registry's errors (see collectDiagScenarios). The registry is built at module load and the
 * case generator imports it, so an error here is reported rather than thrown: a bad pack drops out
 * and the app still starts. scenarios.test.ts requires this list to be empty.
 */
export const DIAG_SCENARIO_ERRORS: readonly string[] = [];

/** Every registered diagnostic scenario, in pack-file order. */
export const DIAG_SCENARIOS: readonly DiagScenario[] = collectDiagScenarios(PACKS, (m) => {
  (DIAG_SCENARIO_ERRORS as string[]).push(m);
  console.error(m);
});

const BY_ID = new Map(DIAG_SCENARIOS.map((s) => [s.id, s]));

export const diagScenarioById = (id: string): DiagScenario | undefined => BY_ID.get(id);

/** The events a scenario can put into the lab's context: its case events and those its script raises. */
export function scenarioEvents(s: DiagScenario): LabEvent[] {
  const out = new Set<LabEvent>(s.events);
  for (const tr of s.script ?? []) for (const a of tr.do) if (a.kind === "raise") out.add(a.event);
  return [...out];
}

/** The union of scenarioEvents over a list of scenarios (the script module's raises). */
export function scenariosEvents(list: readonly DiagScenario[] = DIAG_SCENARIOS): LabEvent[] {
  const out = new Set<LabEvent>();
  for (const s of list) for (const e of scenarioEvents(s)) out.add(e);
  return [...out];
}
