// ---------------------------------------------------------------------------
// Simulator logbook: one row per finished session in any lab, with the
// indication, access route, devices, runs, fluoroscopy time, Ka,r and KAP,
// contrast, complications, mode and role (the content's logbook lesson lists the
// same fields). Exportable as JSON or CSV. Also the migration of schema-1
// profiles (attempts and best-score sim records) into logbook rows.
// ---------------------------------------------------------------------------

import type { AccessRoute, AnatomyCase, CaseAttempt, ChartPreviousCatheter, ContrastOutcome, ProgressProfile, SimMode } from "../types";
import { classifyCase, estimateRung, caseFor, simKeyEpas, simKeyLab, isExamCase, readingRung, PCI_BASES, decodeGenId } from "../content/mentor/catalogue";
import { DIAGNOSTIC_FULL_STUDY, ENGAGEMENT_TASK, evaluateStandards, type PassingStandard, type StandardResult } from "../mentor/standards";
import type { Metrics } from "../mentor/metrics";
import type { EpaId, LogbookEntry, LogLab, LogMode, LogRole, LogSessionInput } from "./types";

/**
 * Model parameters: formative score at or above which a lab session counts as passed.
 * A formative pass counts toward entrustment levels I and II. In the diagnostic lab
 * (and the full case) it is not enough for levels III and IV: an exam row counts
 * toward those only when it also meets the mentor's sourced passing standards
 * (meetsSourcedStandards below).
 */
export const PASS_SCORE = {
  /** labs that report only a 0..100 score */
  default: 70,
  /** PCI lab: the debrief's own boundary for "Good result with points to improve" */
  pci: 65,
  /** real-angiogram drill sets: balanced accuracy x 100 */
  reading: 70,
} as const;

/** Most rows kept in the profile (oldest dropped first; export before that if needed). */
export const LOGBOOK_MAX = 2000;

/** The learner's role in the session, read from the mode (EAPCI wording). */
export function roleFor(mode: LogMode): LogRole {
  switch (mode) {
    case "guided":
      return "assistant";
    case "independent":
      return "first operator, independent";
    case "exam":
      return "first operator, examined";
    default:
      return "first operator, direct supervision";
  }
}

// ---------------------------------------------------------------------------
// Sourced standards for diagnostic levels III and IV
// ---------------------------------------------------------------------------

/** Labs whose rows are judged on the mentor's diagnostic standards (the cath lab and the full case). */
export const STANDARDS_GATED_LABS: readonly LogLab[] = ["diagnostic", "procedure"];

/**
 * The mentor's standards for a diagnostic row, chosen as the mentor chooses them
 * (src/mentor/index.ts defaultStandards): DIAGNOSTIC_FULL_STUDY for a study of both
 * coronaries, ENGAGEMENT_TASK for a single-coronary task. Undefined for other labs.
 */
export function standardsForRow(r: Pick<LogbookEntry, "lab" | "epas">): PassingStandard[] | undefined {
  if (!STANDARDS_GATED_LABS.includes(r.lab)) return undefined;
  return r.epas.includes("diag-study") ? DIAGNOSTIC_FULL_STUDY : ENGAGEMENT_TASK;
}

/**
 * A row's flat metrics (name to number, as useLabRun stores them) as the nested shape
 * evaluateStandards reads: "viewCoverage.missing" is also reachable as viewCoverage.missing.
 * criticalErrors is the larger of the metric and the row's own count.
 */
function metricsView(r: Pick<LogbookEntry, "metrics" | "criticalErrors">): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const m = r.metrics ?? {};
  for (const [k, v] of Object.entries(m)) {
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    if (!(k in out)) out[k] = v;
    if (!k.includes(".")) continue;
    const parts = k.split(".");
    let node: Record<string, unknown> = out;
    let ok = true;
    for (const part of parts.slice(0, -1)) {
      const next = node[part];
      if (next === undefined) node[part] = {};
      else if (next === null || typeof next !== "object") {
        ok = false;
        break;
      }
      node = node[part] as Record<string, unknown>;
    }
    if (ok) node[parts[parts.length - 1]] = v;
  }
  const own = typeof out.criticalErrors === "number" ? (out.criticalErrors as number) : 0;
  out.criticalErrors = Math.max(own, r.criticalErrors ?? 0);
  return out;
}

export interface StandardsVerdict {
  /** which of the mentor's standard sets was applied */
  set: "full-study" | "engagement";
  /** the row carries the mentor's metrics: every literature-sourced and every critical standard is measurable */
  measured: boolean;
  /** measured and every standard met (unmeasurable non-critical simulator defaults pass, as in the debrief) */
  passed: boolean;
  results: StandardResult[];
}

/**
 * The mentor's verdict on a diagnostic row from its stored metrics (evaluateStandards
 * from src/mentor/standards.ts). Undefined for rows of labs the standards do not cover.
 * A row without metrics, or without the metrics the literature and critical standards
 * name, is not measured and does not pass.
 */
export function standardsVerdict(r: Pick<LogbookEntry, "lab" | "epas" | "metrics" | "criticalErrors">): StandardsVerdict | undefined {
  const standards = standardsForRow(r);
  if (!standards) return undefined;
  const set = standards === DIAGNOSTIC_FULL_STUDY ? "full-study" : "engagement";
  const hasMetrics = !!r.metrics && Object.keys(r.metrics).length > 0;
  const ev = evaluateStandards(metricsView(r) as unknown as Metrics, standards);
  const measured = hasMetrics && ev.results.every((x) => !x.missing || !(x.standard.critical || x.standard.source.kind === "literature"));
  return { set, measured, passed: measured && ev.passed, results: ev.results };
}

/**
 * Does a row count as a pass toward entrustment levels III and IV (and the final
 * assessment)? Every lab needs a passed row with no critical error; rows of the
 * diagnostic lab and the full case must also meet the mentor's sourced standards, so
 * a high formative score alone (PASS_SCORE, scoring.ts) counts toward levels I and II only.
 *
 * The lab's own pass (row.passed, the composite score) stays a necessary condition here,
 * alongside the standards, rather than being replaced by them. This keeps the rule that a
 * recompute never lifts a stored level, and it holds until the diagnostic lab logs mentor
 * metrics: the package that moves that lab onto useLabRun should either set row.passed
 * from the standards verdict or drop row.passed from this gate for measured rows.
 */
export function meetsSourcedStandards(r: Pick<LogbookEntry, "lab" | "epas" | "metrics" | "criticalErrors" | "passed">): boolean {
  if (!r.passed || r.criticalErrors > 0) return false;
  const v = standardsVerdict(r);
  return v ? v.passed : true;
}

let counter = 0;
export function rowId(t: number): string {
  counter = (counter + 1) % 1e6;
  return `lb-${t.toString(36)}-${counter.toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Local calendar day (yyyy-mm-dd) in the same convention as the spaced-repetition store. */
export function dayOf(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

/** Map the diagnostic store's SimMode to a logbook mode. */
export function modeFromSim(mode: SimMode): LogMode {
  switch (mode) {
    case "exam":
      return "exam";
    case "tutorial-lm":
    case "tutorial-rca":
    case "root-drill":
      return "guided";
    case "challenge":
      return "independent";
    default:
      return "practice";
  }
}

/** EPAs a diagnostic case is evidence for: its catalogue EPA first, then focus and access. */
export function diagnosticEpas(c: AnatomyCase | undefined, caseId: string): { epas: EpaId[]; rungs: Partial<Record<EpaId, number>> } {
  const cls = classifyCase(caseId);
  const epas: EpaId[] = [];
  const rungs: Partial<Record<EpaId, number>> = {};
  if (cls.epa) {
    epas.push(cls.epa);
    if (cls.rung) rungs[cls.epa] = cls.rung;
  }
  if (c) {
    const right = c.requiredViews.some((v) => v.startsWith("rca"));
    const left = c.requiredViews.some((v) => !v.startsWith("rca"));
    const add = (e: EpaId) => {
      if (!epas.includes(e)) epas.push(e);
      if (rungs[e] === undefined) {
        const r = estimateRung(e, c);
        if (r) rungs[e] = r;
      }
    };
    if (left && right) add("diag-study");
    if (left) add("lca-engage");
    if (right) add("rca-engage");
    add(c.accessRoute === "femoral" ? "access-femoral" : "access-radial");
  }
  return { epas, rungs };
}

export function criticalFromAttempt(a: CaseAttempt): number {
  const s = a.score;
  return (s.dangerousInjections ?? 0) + (s.dissections ?? 0) + (s.airEmbolisms ?? 0) + (s.arrhythmias ?? 0);
}

function complicationsFromAttempt(a: CaseAttempt): string[] {
  const s = a.score;
  const out: string[] = [];
  if (s.dissections) out.push(`dissection ×${s.dissections}`);
  if (s.airEmbolisms) out.push(`air embolism ×${s.airEmbolisms}`);
  if (s.arrhythmias) out.push(`ventricular fibrillation ×${s.arrhythmias}`);
  if (s.dangerousInjections) out.push(`dangerous injection ×${s.dangerousInjections}`);
  if (s.lvEntries) out.push(`LV entry ×${s.lvEntries}`);
  return out;
}

/**
 * Mode for a practice session from the level in force (labPolicy): sessions the lab
 * did not label (case, challenge, labs without a mode) take the policy's mode. Exams
 * and tutorials keep their own.
 */
export function applyPolicyMode(mode: LogMode, policy: LogMode | undefined): LogMode {
  if (!policy || mode === "exam" || mode === "guided" || policy === "exam") return mode;
  return policy;
}

/** Logbook row for a finished diagnostic case (useSimulatorStore.finishCase → recordAttempt). */
export function rowFromAttempt(a: CaseAttempt, extra: { migrated?: boolean; policyMode?: (epa: EpaId | undefined) => LogMode | undefined } = {}): LogbookEntry {
  const c = caseFor(a.caseId);
  const { epas, rungs } = diagnosticEpas(c, a.caseId);
  let mode = modeFromSim(a.mode);
  // Exam credit needs a held-out case; an exam-mode run on any other case is logged as independent practice.
  if (mode === "exam" && !epas.some((e) => isExamCase(e, a.caseId))) mode = "independent";
  else if (mode !== "exam") mode = applyPolicyMode(mode, extra.policyMode?.(epas[0]));
  return {
    id: rowId(a.timestamp),
    t: a.timestamp,
    date: dayOf(a.timestamp),
    lab: "diagnostic",
    source: "attempt",
    caseId: a.caseId,
    caseName: a.caseName,
    epas,
    rungs,
    mode,
    role: roleFor(mode),
    indication: c ? indicationOf(c) : undefined,
    access: c?.accessRoute,
    devices: [],
    runs: a.score.diagnosticInjections,
    fluoroS: Math.round(a.score.fluoroTime),
    contrastMl: Math.round(a.score.contrastVolume),
    complications: complicationsFromAttempt(a),
    criticalErrors: criticalFromAttempt(a),
    score: Math.round(a.score.finalScore),
    passed: a.passed && criticalFromAttempt(a) === 0,
    hints: a.score.hintsUsed,
    notes: a.mistakes.length ? `Mistakes: ${a.mistakes.join(", ")}` : undefined,
    ...(extra.migrated ? { migrated: true } : {}),
  };
}

function indicationOf(c: AnatomyCase): string {
  const focus = c.requiredViews.some((v) => v.startsWith("rca")) && c.requiredViews.some((v) => !v.startsWith("rca")) ? "Diagnostic study" : c.requiredViews.some((v) => v.startsWith("rca")) ? "Right coronary angiography" : "Left coronary angiography";
  return c.pathology !== "none" ? `${focus}; ${c.pathology.replace(/-/g, " ")}` : focus;
}

/** Logbook row for a lab that reports only a key and a score (recordSim). */
export function rowFromSim(key: string, score: number, t: number, extra: { migrated?: boolean; aggregateOf?: number; policyMode?: (epa: EpaId | undefined) => LogMode | undefined } = {}): LogbookEntry {
  const lab = simKeyLab(key);
  const map = simKeyEpas(key);
  const epas = map.map((m) => m.epa);
  const mode = applyPolicyMode("practice", extra.policyMode?.(epas[0]));
  const rungs: Partial<Record<EpaId, number>> = {};
  for (const m of map) if (m.rung) rungs[m.epa] = m.rung;
  const threshold = lab === "pci" ? PASS_SCORE.pci : lab === "angio-reading" ? PASS_SCORE.reading : PASS_SCORE.default;
  const pci = lab === "pci" ? PCI_BASES.find((b) => key === `pci-${b.id}` || key.startsWith(`pci-${b.id}~`)) : undefined;
  return {
    id: rowId(t),
    t,
    date: dayOf(t),
    lab,
    source: key,
    // The lab does not say which scenario it ran, so each session is its own case.
    caseId: pci ? key : `${key}#${t}`,
    caseName: labelForKey(key),
    epas,
    rungs,
    mode,
    role: roleFor(mode),
    devices: [],
    complications: [],
    criticalErrors: 0,
    score: Math.round(score),
    passed: score >= threshold,
    ...(extra.migrated ? { migrated: true } : {}),
    ...(extra.aggregateOf ? { aggregateOf: extra.aggregateOf } : {}),
  };
}

const KEY_LABEL: Record<string, string> = {
  haemo: "Haemodynamics lab",
  physiology: "Pressure wire",
  "pci-bench": "PCI bench (IVUS/OCT)",
  iabp: "IABP console",
  impella: "Impella console",
  ecmo: "VA-ECMO circuit",
  tavi: "TAVI lab",
  teer: "TEER lab",
  laao: "LAAO lab",
  pacing: "Temporary pacing",
  pericardiocentesis: "Pericardiocentesis",
  "angio-cases": "Real angiograms: patient cases",
  "angio-segments": "Real angiograms: segments",
};

export function labelForKey(key: string): string {
  if (KEY_LABEL[key]) return KEY_LABEL[key];
  if (key.startsWith("angio-")) return `Real angiograms: ${key.slice(6)} drill set`;
  if (key.startsWith("pci-")) return `PCI: ${key.slice(4).replace(/~/, " variant ").replace(/-/g, " ")}`;
  return key;
}

/** Logbook row from a lab that reports a full session (the rich API). */
export function rowFromSession(s: LogSessionInput): LogbookEntry {
  const t = s.t ?? Date.now();
  let epas = s.epas ?? [];
  let rungs = { ...(s.rungs ?? {}) };
  if (!epas.length) {
    if (s.lab === "diagnostic" || s.lab === "procedure") {
      const d = diagnosticEpas(caseFor(s.caseId), s.caseId);
      epas = d.epas;
      rungs = { ...d.rungs, ...rungs };
    } else {
      const m = simKeyEpas(s.source ?? s.caseId);
      epas = m.map((x) => x.epa);
      for (const x of m) if (x.rung && rungs[x.epa] === undefined) rungs[x.epa] = x.rung;
    }
  }
  const cls = classifyCase(s.caseId);
  if (cls.epa && cls.rung && rungs[cls.epa] === undefined) rungs[cls.epa] = cls.rung;
  if (cls.epa && !epas.includes(cls.epa)) epas = [cls.epa, ...epas];
  let mode = s.mode;
  if (mode === "exam" && !epas.some((e) => isExamCase(e, s.caseId))) mode = "independent";
  const critical = s.criticalErrors ?? 0;
  return {
    id: rowId(t),
    t,
    date: dayOf(t),
    lab: s.lab,
    source: s.source ?? s.lab,
    caseId: s.caseId,
    caseName: s.caseName ?? labelForKey(s.caseId),
    epas,
    rungs,
    mode,
    role: roleFor(mode),
    indication: s.indication,
    access: s.access,
    devices: s.devices ?? [],
    runs: s.runs,
    fluoroS: s.fluoroS,
    karMGy: s.karMGy,
    kapGyCm2: s.kapGyCm2,
    contrastMl: s.contrastMl,
    complications: s.complications ?? [],
    criticalErrors: critical,
    score: s.score,
    passed: s.passed && critical === 0,
    durationS: s.durationS,
    hints: s.hints,
    notes: s.notes,
  };
}

/** Reading-exam row for a held-out drill set (Real angiograms, exam mode). */
export function rowFromReadingExam(drill: string, setNo: number, balancedAccuracy: number, n: number, t = Date.now(), abandoned?: { answered: number }): LogbookEntry {
  const epa = (["diag-report", "lesion-assess"] as EpaId[]).find((e) => readingRung(e, drill));
  const score = abandoned ? 0 : Math.round(100 * (Number.isFinite(balancedAccuracy) ? balancedAccuracy : 0));
  return rowFromSession({
    lab: "angio-reading",
    source: `angio-${drill}`,
    caseId: readingExamCaseId(drill, setNo),
    caseName: `Real angiograms exam: ${drill} (${n} items)`,
    epas: epa ? [epa] : [],
    rungs: epa ? { [epa]: readingRung(epa, drill) } : {},
    mode: "exam",
    score,
    passed: !abandoned && score >= PASS_SCORE.reading,
    notes: abandoned ? `Left after ${abandoned.answered} of ${n} items: counted as a failed set.` : undefined,
    t,
  });
}

const readingExamCaseId = (drill: string, setNo: number) => `angio-exam:${drill}:${setNo}`;

/**
 * A diagnostic exam left before the end: a failed first attempt on the held-out case
 * (no critical error recorded, since the case was not finished).
 */
export function rowFromAbandonedExam(caseId: string, caseName: string | undefined, t: number): LogbookEntry {
  const row = rowFromSession({
    lab: "diagnostic",
    source: "attempt",
    caseId,
    caseName: caseName ?? caseFor(caseId)?.name ?? caseId,
    mode: "exam",
    passed: false,
    score: 0,
    notes: "Left before the end: counted as a failed first attempt.",
    t,
  });
  const c = caseFor(caseId);
  return { ...row, indication: c ? indicationOf(c) : undefined, access: c?.accessRoute };
}

// ---------------------------------------------------------------------------
// Migration (schema 1 → 2)
// ---------------------------------------------------------------------------

/**
 * Rows for an old profile: one per stored diagnostic attempt (all fields the
 * attempt kept), and one summary row per simulator key, because the old store
 * kept only the run count and best score for those.
 */
export function migrateRows(p: Partial<ProgressProfile>): LogbookEntry[] {
  const rows: LogbookEntry[] = [];
  for (const a of p.attempts ?? []) {
    try {
      rows.push(rowFromAttempt(a, { migrated: true }));
    } catch {
      // a malformed attempt is kept in `attempts` and skipped here
    }
  }
  for (const [key, rec] of Object.entries(p.simRecords ?? {})) {
    if (!rec || !rec.runs) continue;
    const row = rowFromSim(key, rec.best ?? 0, rec.last || p.createdAt || Date.now(), { migrated: true, aggregateOf: rec.runs });
    row.notes = `Imported summary: ${rec.runs} session${rec.runs === 1 ? "" : "s"} before the logbook existed; best score ${rec.best}.`;
    rows.push(row);
  }
  return rows.sort((a, b) => a.t - b.t);
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const CSV_COLUMNS: (keyof LogbookEntry)[] = [
  "date",
  "t",
  "lab",
  "caseName",
  "caseId",
  "epas",
  "mode",
  "role",
  "indication",
  "access",
  "devices",
  "runs",
  "fluoroS",
  "karMGy",
  "kapGyCm2",
  "contrastMl",
  "complications",
  "criticalErrors",
  "passed",
  "score",
  "durationS",
  "notes",
];

function cell(v: unknown): string {
  if (v === undefined || v === null) return "";
  const s = Array.isArray(v) ? v.join("; ") : typeof v === "boolean" ? (v ? "yes" : "no") : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function logbookCsv(rows: LogbookEntry[]): string {
  const head = CSV_COLUMNS.join(",");
  const body = rows.map((r) => CSV_COLUMNS.map((c) => cell(c === "t" ? new Date(r.t).toISOString() : r[c])).join(","));
  return [head, ...body].join("\n");
}

export function logbookJson(rows: LogbookEntry[]): string {
  return JSON.stringify({ format: "cathmaster-logbook", version: 1, exported: new Date().toISOString(), rows }, null, 2);
}

/** Totals for the logbook header. */
export function logbookTotals(rows: LogbookEntry[]) {
  const live = rows.filter((r) => !r.aggregateOf);
  const sum = (f: (r: LogbookEntry) => number | undefined) => live.reduce((a, r) => a + (f(r) ?? 0), 0);
  return {
    sessions: live.length + rows.filter((r) => r.aggregateOf).reduce((a, r) => a + (r.aggregateOf ?? 0), 0),
    logged: live.length,
    exams: live.filter((r) => r.mode === "exam").length,
    examPasses: live.filter((r) => r.mode === "exam" && r.passed).length,
    fluoroS: sum((r) => r.fluoroS),
    contrastMl: sum((r) => r.contrastMl),
    complications: live.reduce((a, r) => a + r.complications.length, 0),
    critical: sum((r) => r.criticalErrors),
  };
}

/** Is the id a generated catalogue case that can be replayed? */
export function replayable(caseId: string): boolean {
  return !!decodeGenId(caseId) && !!caseFor(caseId);
}

// ---------------------------------------------------------------------------
// Catheters that worked, per patient (diag-engagement-technique-set)
//
// "At the end, record the catheters that worked so the next operator can do
// the same" (tip diag-root-previous-catheters, pm-to-the-root-choice; lab
// request pm-to-the-root#7). The record is kept per patient: a scenario
// case's id names the scenario and its seed, a generated case's id its preset
// and seed, so the same id is the same patient. It holds the last catheter
// that gave a diagnostic run on each side, and the catheters the learner
// stated at the pre-brief (for the debrief's comparison with the route and
// the root). The pre-brief shows the record in the chart next time, as the
// chart's own previous catheters are shown (mentor/prebrief.ts chartRows).
// Stored in its own localStorage key, beside the profile; every read and
// write is guarded, so without storage (tests, private windows) nothing is
// kept and nothing fails.
// ---------------------------------------------------------------------------

/** localStorage key of the per-patient catheter record. */
export const WORKED_CATHETERS_KEY = "cathmaster-worked-catheters";
/** Most patients the record keeps (the oldest dropped first). Storage bound, not a clinical value. */
export const WORKED_CATHETERS_MAX = 200;

/** The catheters stated before a case (the pre-brief's catheter step). */
export interface StatedCatheters {
  access: AccessRoute;
  left?: string;
  right?: string;
  guide?: string;
  french?: number;
  guideFrench?: number;
}

/** What is kept for one patient. */
export interface WorkedCatheters {
  /** the last catheter that gave a diagnostic run of each side */
  left?: string;
  right?: string;
  /** the route they worked from */
  route?: AccessRoute;
  /** epoch ms of the last change */
  t: number;
  /** the catheters stated at the last pre-brief */
  stated?: StatedCatheters;
}

/** The storage the record uses (a localStorage-shaped object). */
export interface WorkedStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): WorkedStorage | null {
  try {
    const ls = (globalThis as { localStorage?: WorkedStorage }).localStorage;
    return ls && typeof ls.getItem === "function" ? ls : null;
  } catch {
    return null;
  }
}

/** The patient a case id stands for: the id itself (one scenario and seed, or one preset and seed, is one patient). */
export const patientKey = (caseId: string): string => caseId;

/** Every patient's record (empty without storage or with an unreadable value). */
export function readWorkedCatheters(storage: WorkedStorage | null = defaultStorage()): Record<string, WorkedCatheters> {
  if (!storage) return {};
  try {
    const raw = storage.getItem(WORKED_CATHETERS_KEY);
    const v = raw ? (JSON.parse(raw) as unknown) : {};
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, WorkedCatheters>) : {};
  } catch {
    return {};
  }
}

function writeWorked(all: Record<string, WorkedCatheters>, storage: WorkedStorage | null): void {
  if (!storage) return;
  const keys = Object.keys(all);
  if (keys.length > WORKED_CATHETERS_MAX) {
    const drop = keys.sort((a, b) => (all[a].t ?? 0) - (all[b].t ?? 0)).slice(0, keys.length - WORKED_CATHETERS_MAX);
    for (const k of drop) delete all[k];
  }
  try {
    storage.setItem(WORKED_CATHETERS_KEY, JSON.stringify(all));
  } catch {
    // storage full or blocked: the record is a convenience, nothing else depends on it
  }
}

function updateWorked(caseId: string, f: (w: WorkedCatheters) => WorkedCatheters, storage: WorkedStorage | null): WorkedCatheters | undefined {
  if (!storage) return undefined;
  const all = readWorkedCatheters(storage);
  const key = patientKey(caseId);
  const next = f(all[key] ?? { t: 0 });
  all[key] = next;
  writeWorked(all, storage);
  return next;
}

/** A catheter gave a diagnostic run of a side for this patient. */
export function recordWorkedCatheter(caseId: string, side: "left" | "right", catheterId: string, route?: AccessRoute, t = Date.now(), storage: WorkedStorage | null = defaultStorage()): WorkedCatheters | undefined {
  return updateWorked(caseId, (w) => ({ ...w, [side]: catheterId, ...(route ? { route } : {}), t }), storage);
}

/** The catheters stated at the pre-brief for this patient. */
export function recordStatedCatheters(caseId: string, stated: StatedCatheters, t = Date.now(), storage: WorkedStorage | null = defaultStorage()): WorkedCatheters | undefined {
  return updateWorked(caseId, (w) => ({ ...w, stated: { ...stated }, t }), storage);
}

/** This patient's record, if any. */
export function workedCathetersFor(caseId: string, storage: WorkedStorage | null = defaultStorage()): WorkedCatheters | undefined {
  return readWorkedCatheters(storage)[patientKey(caseId)];
}

/** The record as the chart's previous catheters (mentor/prebrief.ts chartRows shows them as "Catheters that worked before"). */
export function previousCathetersOf(w: WorkedCatheters | undefined): ChartPreviousCatheter[] {
  if (!w) return [];
  const out: ChartPreviousCatheter[] = [];
  if (w.left) out.push({ target: "left", catheterId: w.left, ...(w.route ? { route: w.route } : {}) });
  if (w.right) out.push({ target: "right", catheterId: w.right, ...(w.route ? { route: w.route } : {}) });
  return out;
}

/**
 * The catheters that worked in one study, from its injections (the diagnostic session's SessionInjection shape):
 * the last catheter whose injection on each side was a selective run.
 */
export function workedFromInjections(injections: readonly { side: "left" | "right"; outcome: ContrastOutcome | null; catheterId: string }[]): { left?: string; right?: string } {
  const out: { left?: string; right?: string } = {};
  for (const i of injections) if (i.outcome === "selective-lca" || i.outcome === "selective-rca") out[i.side] = i.catheterId;
  return out;
}
