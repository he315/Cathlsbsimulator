// ---------------------------------------------------------------------------
// Full-case scenarios (proc-foundation-scenarios-ledger).
//
// Every src/simulation/session/scenarios/*.ts other than this file, the
// .launch.ts metadata files and tests is a scenario file: it exports
// `scenarios: ProcedureScenario[]`. Nothing lists the files; a package adds
// a scenario by adding a file here (with its engine-free .launch.ts beside it,
// which the practice index reads), never by editing this index or
// caseSession.ts.
//
// A scenario is the case a lesson asks for: patient overrides applied after
// generatePatient (renal function and the contrast ceiling are recomputed),
// chart text, site anatomy overrides, scripted events keyed by session hooks,
// delayed events after closure, and a start stage the autopilot fast-forwards
// to. The 'default' scenario overrides nothing: it is the random case that
// 'New patient' opens.
//
// Scenario files import CaseSession and its types with `import type` only:
// caseSession.ts imports this registry, so a value import would be a cycle.
// A scenario's numbers are scenario settings: each is either cited from the
// module text in a comment or labelled MODEL PARAMETER.
// ---------------------------------------------------------------------------

import type { AccessRoute, AnatomyVariant } from "../../../types";
import type { LabEvent } from "../../../content/lab/tips";
import type { LaunchMode } from "../../../content/schema";
import type { Indication, PatientProfile } from "../../patient/patient";
import type { SiteOverrides } from "../../access/site";
import type { DelayedEvent } from "../../access/closure";
import type { CaseSession, ChartItemId, LogKind } from "../caseSession";
import { CREATININE_UMOL_PER_MGDL, ckdEpi2021, cigarroaMacd, cockcroftGault } from "../../patient/patient";

/** Where a scenario opens: the autopilot plays the case to this point with clean technique. */
export type ScenarioStart = "chart" | "access" | "sheath-in" | "post-diagnostic" | "closure" | "recovery";
export const SCENARIO_STARTS: readonly ScenarioStart[] = ["chart", "access", "sheath-in", "post-diagnostic", "closure", "recovery"];
export const isScenarioStart = (s: unknown): s is ScenarioStart => typeof s === "string" && (SCENARIO_STARTS as readonly string[]).includes(s);

/**
 * Patient facts a scenario sets. Applied to the generated profile; derived values (BMI, creatinine
 * in both units, clearance, eGFR and the Cigarroa ceiling) are recomputed from the result.
 */
export interface ProfileOverrides {
  sex?: PatientProfile["sex"];
  ageY?: number;
  heightCm?: number;
  weightKg?: number;
  lvef?: number;
  /** serum creatinine, µmol/L (the chart's unit); renal function and the contrast ceiling follow */
  creatinineUmolL?: number;
  anticoagulation?: PatientProfile["anticoagulation"];
  doac?: PatientProfile["doac"];
  allergies?: Partial<PatientProfile["allergies"]>;
  rhythm?: PatientProfile["baseline"]["rhythm"];
  radialDiamMm?: number;
  pde5?: PatientProfile["pde5"];
  recentContrast?: PatientProfile["recentContrast"];
  anxiety?: number;
  vagalTone?: number;
}

/** Session moments a scripted event can be keyed to. Time hooks are '<moment>+<n>min', e.g. 'recovery+40min'. */
export type SessionHook =
  | "arrival"
  | "time-out"
  | "puncture"
  | "micro-wire"
  | "sheath-in"
  | "catheter-in"
  | "root"
  | "handover"
  | "return"
  | "catheter-out"
  | "sheath-pull"
  | "closure"
  | "recovery";
export const SESSION_HOOKS: readonly SessionHook[] = ["arrival", "time-out", "puncture", "micro-wire", "sheath-in", "catheter-in", "root", "handover", "return", "catheter-out", "sheath-pull", "closure", "recovery"];

/** A scripted event: when its hook fires, the session raises its events, logs its line, records its complication and runs `run`. */
export interface ScriptedEvent {
  /** a SessionHook, or '<hook>+<n>min' for n minutes after it */
  at: string;
  /** events raised for the rest of the case (the tip context reads them through session.activeEvents later) */
  events?: LabEvent[];
  log?: { kind: LogKind; text: string };
  complication?: { id: string; label: string; severity: "minor" | "major" };
  /** anything else, through public session methods only */
  run?: (s: CaseSession) => void;
}

/** A delayed event the scenario guarantees after closure, on top of those the risk model draws. */
export interface ScenarioDelayed {
  kind: DelayedEvent["kind"];
  /** minutes after closure */
  afterMin: number;
  bleedMlMin?: number;
  totalMl?: number;
  report: string;
  finding: string;
  severity: "minor" | "major";
}

export interface ProcedureScenario {
  id: string;
  title: string;
  /** lessons it practises (also in its .launch.ts, which is what the practice index reads) */
  lessonIds: string[];
  /** a fixed seed for the patient and anatomy; without one each launch draws a new patient */
  seed?: string;
  access?: AccessRoute;
  indication?: Indication;
  variants?: AnatomyVariant[];
  mode?: LaunchMode;
  profile?: ProfileOverrides;
  /** chart text that replaces the generated text of an item */
  chart?: Partial<Record<ChartItemId, string>>;
  site?: SiteOverrides;
  script?: ScriptedEvent[];
  delayed?: ScenarioDelayed[];
  /** the stage the case opens at (default 'chart') */
  start?: ScenarioStart;
  /** run after the fast-forward, through public session methods, for start states the autopilot does not reach */
  state?: (s: CaseSession) => void;
  /** reserved for held-out exams (as its .launch.ts entry says): never offered in the free-practice picker */
  heldOut?: boolean;
}

/** What a scenario file exports. */
export interface ScenarioFile {
  scenarios?: ProcedureScenario[];
}

/** Collect the scenarios from glob modules (path to module). Throws on a malformed file or a duplicate id. */
export function collectScenarios(files: Record<string, unknown>): ProcedureScenario[] {
  const out: ProcedureScenario[] = [];
  const seen = new Map<string, string>();
  for (const file of Object.keys(files).sort()) {
    const list = (files[file] as ScenarioFile | undefined)?.scenarios;
    if (!Array.isArray(list)) throw new Error(`full-case scenario file ${file} does not export 'scenarios'`);
    for (const s of list) {
      if (!s || typeof s.id !== "string" || !s.id) throw new Error(`a full-case scenario in ${file} has no id`);
      if (seen.has(s.id)) throw new Error(`full-case scenario id '${s.id}' is declared in ${seen.get(s.id)} and ${file}`);
      if (s.start !== undefined && !isScenarioStart(s.start)) throw new Error(`full-case scenario '${s.id}' has an unknown start '${String(s.start)}'`);
      for (const ev of s.script ?? []) if (!isHookSpec(ev.at)) throw new Error(`full-case scenario '${s.id}' keys an event to an unknown hook '${ev.at}'`);
      seen.set(s.id, file);
      out.push(s);
    }
  }
  return out;
}

/** Parse a hook spec: 'sheath-pull' or 'recovery+40min'. */
export function parseHookSpec(at: string): { hook: SessionHook; afterS: number } | null {
  const m = /^([a-z-]+?)(?:\+(\d+(?:\.\d+)?)min)?$/.exec(at);
  if (!m || !(SESSION_HOOKS as readonly string[]).includes(m[1])) return null;
  return { hook: m[1] as SessionHook, afterS: m[2] ? Number(m[2]) * 60 : 0 };
}
export const isHookSpec = (at: unknown): at is string => typeof at === "string" && parseHookSpec(at) !== null;

/**
 * The profile with a scenario's overrides applied. Derived values follow the same sourced formulas
 * as generatePatient (Cockcroft-Gault, 2021 CKD-EPI, Cigarroa; docs/realism/facts/S9.md).
 */
export function applyProfileOverrides(p: PatientProfile, o: ProfileOverrides | undefined): PatientProfile {
  if (!o) return p;
  const sex = o.sex ?? p.sex;
  const ageY = o.ageY ?? p.ageY;
  const heightCm = o.heightCm ?? p.heightCm;
  const weightKg = o.weightKg ?? p.weightKg;
  const bodyChanged = o.heightCm !== undefined || o.weightKg !== undefined;
  const bmi = bodyChanged ? Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10 : p.bmi;
  const habitus = bodyChanged ? habitusFromBmi(bmi) : p.habitus;
  const creatinineMgDl = o.creatinineUmolL !== undefined ? Math.round((o.creatinineUmolL / CREATININE_UMOL_PER_MGDL) * 100) / 100 : p.renal.creatinineMgDl;
  const renal = {
    creatinineMgDl,
    creatinineUmolL: o.creatinineUmolL ?? Math.round(creatinineMgDl * CREATININE_UMOL_PER_MGDL),
    crclMlMin: Math.round(cockcroftGault(ageY, weightKg, creatinineMgDl, sex)),
    egfr: Math.round(ckdEpi2021(ageY, creatinineMgDl, sex)),
    macdMl: Math.round(cigarroaMacd(weightKg, creatinineMgDl)),
  };
  const out: PatientProfile = {
    ...p,
    sex,
    ageY,
    heightCm,
    weightKg,
    bmi,
    habitus,
    renal,
    lvef: o.lvef ?? p.lvef,
    anticoagulation: o.anticoagulation ?? (o.doac ? "doac" : p.anticoagulation),
    allergies: { ...p.allergies, ...(o.allergies ?? {}) },
    baseline: { ...p.baseline, rhythm: o.rhythm ?? p.baseline.rhythm },
    radialDiamMm: o.radialDiamMm ?? p.radialDiamMm,
    anxiety: o.anxiety ?? p.anxiety,
    vagalTone: o.vagalTone ?? p.vagalTone,
  };
  if (o.doac) out.doac = { ...o.doac };
  else if (out.anticoagulation !== "doac") delete out.doac;
  if (o.pde5) out.pde5 = { ...o.pde5 };
  if (o.recentContrast) out.recentContrast = o.recentContrast.map((r) => ({ ...r }));
  return out;
}

/**
 * Body habitus for the imaging chain from BMI. The same model mapping as generatePatient
 * (src/simulation/patient/patient.ts, the 'habitus for the imaging chain' line), duplicated here
 * until patient.ts exports it; keep the two in step.
 */
export function habitusFromBmi(bmi: number): number {
  return Math.round(Math.min(1.25, Math.max(0.85, 1 + (bmi - 26) * 0.022)) * 100) / 100;
}

// The literal patterns: every scenario file in this folder, not this index, the launch metadata or tests.
const FILES = import.meta.glob<ScenarioFile>(["./*.ts", "!./index.ts", "!./*.launch.ts", "!./*.test.ts"], { eager: true });

/** Every full-case scenario, in file-name order. */
export const PROCEDURE_SCENARIOS: readonly ProcedureScenario[] = collectScenarios(FILES);

export const SCENARIO_BY_ID: Readonly<Record<string, ProcedureScenario>> = Object.fromEntries(PROCEDURE_SCENARIOS.map((s) => [s.id, s]));

/** The scenario 'New patient' opens: a random case with nothing overridden. */
export const DEFAULT_SCENARIO_ID = "default";

export function scenarioById(id: string | null | undefined): ProcedureScenario | undefined {
  return id ? SCENARIO_BY_ID[id] : undefined;
}
