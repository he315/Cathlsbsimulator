// ---------------------------------------------------------------------------
// Competency case catalogue (stream S12, track I4).
//
// For every EPA this file defines a ladder of rungs 1..6 of rising difficulty
// (progressive learning, Grover 2017, doi 10.1016/j.gie.2017.03.1529) and a
// held-out exam pool whose cases never appear in practice.
//
// - Diagnostic EPAs: cases come from generateBatch(preset, n, seedBase) and are
//   sorted by a difficulty key built from caseDifficultyAxes. Practice seeds start
//   with "L:", exam seeds with "X:"; both are reproducible through resolveCase().
//   The exam pool has no fixed size: held-out cases are generated on demand from
//   the X-seed sequence (examCases), so failures, abandoned attempts and the final
//   assessment never run it dry. `exam` lists the first few per rung for display.
// - Reading EPAs: rungs are the real-angiogram drills in a fixed order; the exam
//   draws from library runs that the practice drills never show (heldOutRun).
// - PCI EPAs: rung 1 is the lab's base scenario (a registry definition marked
//   ladderBase, src/simulation/pci/scenarios/); rungs 2..6 are seeded variants of
//   it (severity, length, position, calcium) that resolveScenario() in
//   src/simulation/pci/scenarios/generate.ts builds for the lab.
// - Haemodynamics, MCS, structural and bedside EPAs: one practice rung (the lab
//   as it stands); exams need the lab to report a held-out case id.
//
// Every count and threshold here is a model parameter (facts/I4.md).
// ---------------------------------------------------------------------------

import type { AnatomyCase } from "../../types";
import { caseDifficultyAxes, generateBatch, resolveCase } from "../../simulation/caseGenerator";
import type { EpaId } from "../../progress/types";
import { PCI_SCENARIO_DEFS, targetIndex } from "../../simulation/pci/scenarios/registry";

/** Model parameters. */
export const LADDER_PARAMS = {
  rungs: 6,
  /** practice cases per rung */
  practicePerRung: 5,
  /** held-out exam cases listed per rung for display (the pool itself is generated on demand) */
  examPerRung: 3,
  /** most X-seed indices scanned per EPA when looking for unseen exam cases */
  examScanMax: 6000,
  /** candidates drawn per preset before sorting and trimming */
  candidatesPerPreset: 60,
  /** distinct passes at a rung (or above) that clear it and unlock the next */
  passesToClear: 2,
  /** blocked practice: counted rung passes per EPA per day (Moulton 2006: distributed beats massed) */
  dailyCountedPasses: 4,
} as const;

export type LadderKind = "diagnostic" | "reading" | "pci" | "lab";

export interface DiagnosticRung {
  rung: number;
  /** case ids (gen|preset|seed), reproducible with resolveCase */
  caseIds: string[];
  /** difficulty key range of the rung */
  min: number;
  max: number;
}

export interface ReadingRung {
  rung: number;
  /** a real-angiogram drill id, or a lab sim key */
  drill: string;
  label: string;
  /** "drill" = Real angiograms section; "sim" = a lab */
  kind: "drill" | "sim";
}

export interface PciVariant {
  id: string;
  base: string;
  rung: number;
  /** severity %, length mm, position 0..1 along the vessel, calcium 0..2 */
  severity: number;
  lengthMm: number;
  position: number;
  calcium: 0 | 1 | 2;
  key: number;
}

export interface Ladder {
  epa: EpaId;
  kind: LadderKind;
  /** rungs that can be played today */
  playableRungs: number;
  diagnostic?: { rungs: DiagnosticRung[]; exam: DiagnosticRung[] };
  reading?: ReadingRung[];
  pci?: { base: string; rungs: PciVariant[][]; exam: PciVariant[] };
  /** sim keys whose sessions count for this EPA (lab ladders) */
  simKeys?: string[];
}

// ---------------------------------------------------------------------------
// Diagnostic ladders
// ---------------------------------------------------------------------------

interface DiagSpec {
  presets: string[];
  keep: (c: AnatomyCase) => boolean;
  key: (c: AnatomyCase) => number;
}

const focusOf = (c: AnatomyCase): "left" | "right" | "both" => {
  const r = c.requiredViews.some((v) => v.startsWith("rca"));
  const l = c.requiredViews.some((v) => !v.startsWith("rca"));
  return r && l ? "both" : r ? "right" : "left";
};

const axes = caseDifficultyAxes;

export const DIAG_SPECS: Partial<Record<EpaId, DiagSpec>> = {
  "access-radial": {
    presets: ["radial"],
    keep: (c) => c.accessRoute !== "femoral",
    key: (c) => 2 * axes(c).engagement + c.variants.filter((v) => v === "radial-loop" || v === "tortuous-subclavian").length * 2 + c.difficulty,
  },
  "access-femoral": {
    presets: ["rand", "left", "rca", "catheter-selection"],
    keep: (c) => c.accessRoute === "femoral",
    key: (c) => 2 * axes(c).engagement + axes(c).rca + c.difficulty,
  },
  "lca-engage": {
    presets: ["left", "lv-trap", "nonselective-trap", "dilated", "left-main"],
    keep: (c) => focusOf(c) !== "right",
    key: (c) => 2 * axes(c).engagement + c.difficulty,
  },
  "rca-engage": {
    presets: ["rca", "torque", "damping", "high-rca", "shepherds-crook"],
    keep: (c) => focusOf(c) !== "left",
    key: (c) => 2 * axes(c).rca + axes(c).engagement + c.difficulty,
  },
  "diag-study": {
    presets: ["rand", "views", "catheter-selection"],
    keep: (c) => focusOf(c) === "both",
    key: (c) => {
      const a = axes(c);
      return a.engagement + a.rca + a.view + c.difficulty;
    },
  },
};

export const DIAGNOSTIC_EPAS = Object.keys(DIAG_SPECS) as EpaId[];

function candidates(epa: EpaId, prefix: "L" | "X", n: number): AnatomyCase[] {
  const spec = DIAG_SPECS[epa]!;
  const seen = new Set<string>();
  const out: AnatomyCase[] = [];
  for (const p of spec.presets) {
    for (const c of generateBatch(p, n, `${prefix}:${epa}:${p}`)) {
      if (!spec.keep(c) || seen.has(c.id)) continue;
      seen.add(c.id);
      out.push(c);
    }
  }
  return out;
}

const byKey = (key: (c: AnatomyCase) => number) => (a: AnatomyCase, b: AnatomyCase) => key(a) - key(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

function buildDiagnostic(epa: EpaId): { rungs: DiagnosticRung[]; exam: DiagnosticRung[] } {
  const spec = DIAG_SPECS[epa]!;
  const { rungs: R, practicePerRung: P, examPerRung: E, candidatesPerPreset: C } = LADDER_PARAMS;
  const pool = candidates(epa, "L", C).sort(byKey(spec.key));
  // Evenly spaced picks across the sorted pool keep the full difficulty range.
  const want = R * P;
  const picked: AnatomyCase[] = [];
  for (let i = 0; i < want && pool.length; i++) picked.push(pool[Math.min(pool.length - 1, Math.floor((i * pool.length) / want))]);
  const uniq = Array.from(new Map(picked.map((c) => [c.id, c])).values()).sort(byKey(spec.key));
  const rungs: DiagnosticRung[] = [];
  for (let r = 0; r < R; r++) {
    const part = uniq.slice(Math.floor((r * uniq.length) / R), Math.floor(((r + 1) * uniq.length) / R));
    const keys = part.map(spec.key);
    rungs.push({ rung: r + 1, caseIds: part.map((c) => c.id), min: keys.length ? Math.min(...keys) : NaN, max: keys.length ? Math.max(...keys) : NaN });
  }
  // Display list of the exam pool: the first E held-out cases per rung in the X-seed sequence.
  const exam: DiagnosticRung[] = rungs.map((r) => ({ rung: r.rung, caseIds: [], min: r.min, max: r.max }));
  for (let idx = 0; idx < LADDER_PARAMS.examScanMax && exam.some((r) => r.caseIds.length < E); idx++) {
    const hit = scanAt(epa, rungs, idx);
    if (!hit.rung) continue;
    const r = exam[hit.rung - 1];
    if (r.caseIds.length < E) r.caseIds.push(hit.id);
  }
  return { rungs, exam };
}

// ---------------------------------------------------------------------------
// Held-out exam pool, generated on demand
// ---------------------------------------------------------------------------

/** Id of the idx-th case in an EPA's X-seed sequence (presets in turn). */
function examSeedId(epa: EpaId, idx: number): string {
  const presets = DIAG_SPECS[epa]!.presets;
  const p = presets[idx % presets.length];
  return `gen|${p}|X:${epa}:${p}:${Math.floor(idx / presets.length)}`;
}

/**
 * Rung of a held-out case from the practice rungs' difficulty-key ranges. A key that
 * falls inside several ranges (ranges meet at their ends) goes to one of them by a
 * fixed hash of the id, so every rung receives exam cases; a key outside every range
 * goes to the rung with the nearest midpoint.
 */
function examRungIn(rungs: DiagnosticRung[], k: number, id: string): number | undefined {
  const live = rungs.filter((r) => r.caseIds.length);
  if (!live.length) return undefined;
  const inside = live.filter((r) => k >= r.min && k <= r.max);
  if (inside.length) return inside[fnv(`exam-rung:${id}`) % inside.length].rung;
  return live.reduce((best, r) => (Math.abs((r.min + r.max) / 2 - k) < Math.abs((best.min + best.max) / 2 - k) ? r : best)).rung;
}

/** Rung of an X-seed case id for an EPA, or undefined when the id is not a held-out case of it. */
function examRungOf(epa: EpaId, rungs: DiagnosticRung[], id: string): number | undefined {
  const hit = examRungCache.get(id);
  if (hit !== undefined) return hit ?? undefined;
  let out: number | undefined;
  const g = decodeGenId(id);
  const spec = DIAG_SPECS[epa];
  if (g && spec && spec.presets.includes(g.preset) && new RegExp(`^X:${epa}:${g.preset}:\\d+$`).test(g.seed)) {
    const c = resolveCase(id);
    if (c && spec.keep(c)) out = examRungIn(rungs, spec.key(c), id);
  }
  examRungCache.set(id, out ?? null);
  return out;
}

const examRungCache = new Map<string, number | null>();
/** Scanned X-seed sequence per EPA (grown lazily). */
const examScan = new Map<EpaId, { id: string; rung?: number }[]>();

function scanAt(epa: EpaId, rungs: DiagnosticRung[], idx: number): { id: string; rung?: number } {
  let list = examScan.get(epa);
  if (!list) examScan.set(epa, (list = []));
  while (list.length <= idx) {
    const id = examSeedId(epa, list.length);
    list.push({ id, rung: examRungOf(epa, rungs, id) });
  }
  return list[idx];
}

/**
 * Unseen held-out cases for an EPA with a rung inside [minRung, maxRung], in the
 * fixed X-seed order, at most `count`. The sequence is unbounded, so the pool does
 * not run out; examScanMax only bounds the work per request.
 */
export function examCases(epa: EpaId, o: { minRung: number; maxRung?: number; exclude?: Set<string>; count?: number }): { caseId: string; rung: number }[] {
  const d = ladderFor(epa).diagnostic;
  if (!d) return [];
  const max = o.maxRung ?? LADDER_PARAMS.rungs;
  const want = o.count ?? 1;
  const out: { caseId: string; rung: number }[] = [];
  for (let idx = 0; idx < LADDER_PARAMS.examScanMax && out.length < want; idx++) {
    const hit = scanAt(epa, d.rungs, idx);
    if (!hit.rung || hit.rung < o.minRung || hit.rung > max || o.exclude?.has(hit.id)) continue;
    out.push({ caseId: hit.id, rung: hit.rung });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Reading ladders (Real angiograms drills, then labs)
// ---------------------------------------------------------------------------

export const READING_LADDERS: Partial<Record<EpaId, ReadingRung[]>> = {
  "diag-report": [
    { rung: 1, drill: "artery", label: "Left or right coronary", kind: "drill" },
    { rung: 2, drill: "dominance", label: "Dominance", kind: "drill" },
    { rung: 3, drill: "view", label: "Name the projection", kind: "drill" },
    { rung: 4, drill: "occlusion", label: "Occluded RCA", kind: "drill" },
    { rung: 5, drill: "collaterals", label: "Collaterals", kind: "drill" },
    { rung: 6, drill: "plan", label: "Plan the next view", kind: "drill" },
  ],
  "lesion-assess": [
    { rung: 1, drill: "locate", label: "Find the lesion", kind: "drill" },
    { rung: 2, drill: "grade", label: "Grade the stenosis", kind: "drill" },
    { rung: 3, drill: "estimate", label: "Estimate the stenosis", kind: "drill" },
    { rung: 4, drill: "physiology", label: "Pressure wire", kind: "sim" },
    { rung: 5, drill: "pci-bench", label: "IVUS and OCT", kind: "sim" },
  ],
};

/** Rung of a reading drill or lab key inside an EPA's reading ladder. */
export function readingRung(epa: EpaId, drillOrKey: string): number | undefined {
  return READING_LADDERS[epa]?.find((r) => r.drill === drillOrKey)?.rung;
}

/**
 * Library material held out of practice for reading exams: a fixed hash of the key
 * puts about one in five into the exam pool. The Real angiograms section holds out
 * whole patients (key "<dataset>:<patientId>"), so neither a run nor a study of a
 * held-out patient appears in practice drills, the library browser or the cases.
 */
export function heldOutRun(key: string): boolean {
  return fnv(`exam-run:${key}`) % 5 === 0;
}

export const heldOutPatient = (dataset: string, patientId: string): boolean => heldOutRun(`${dataset}:${patientId}`);

/**
 * Model parameters of reading exam sets (facts/I4.md). The held-out library is finite
 * (about one patient in five), so a set may be smaller than a full practice set, but
 * never below minFraction of it or minItems; an item shown in an exam becomes eligible
 * again only after washoutDays, and only when unseen items cannot fill a set.
 */
export const READING_EXAM = { minFraction: 0.5, minItems: 4, washoutDays: 90 } as const;

/** Exam case id for a reading exam set. */
export const readingExamId = (drill: string, setNo: number): string => `angio-exam:${drill}:${setNo}`;

// ---------------------------------------------------------------------------
// PCI ladders
// ---------------------------------------------------------------------------

export interface PciBase {
  id: string;
  epa: EpaId;
  difficulty: number;
  severity: number;
  lengthMm: number;
  position: number;
  calcium: 0 | 1 | 2;
  /** the two calcium grades a variant takes, the first 60% of the time (absent: the base's grade) */
  calciumGrades?: readonly [0 | 1 | 2, 0 | 1 | 2];
}

/**
 * The PCI ladder bases: the registry's scenarios marked ladderBase, from their EPA and active target
 * lesion (src/simulation/pci/scenarios/registry.ts, engine-free, so this file stays free of render code).
 * One base per EPA: the registry reports a second ladderBase for an EPA as a problem.
 */
export const PCI_BASES: PciBase[] = PCI_SCENARIO_DEFS.filter((d) => d.ladderBase && !d.heldOut).map((d) => {
  const l = d.lesions[targetIndex(d)];
  const b: PciBase = { id: d.id, epa: d.epa, difficulty: d.difficulty, severity: l.severity, lengthMm: l.lengthMm, position: l.position, calcium: l.calcium ?? 0 };
  if (d.variantAxes?.calciumGrades) b.calciumGrades = d.variantAxes.calciumGrades;
  return b;
});

/** Variant difficulty: longer, more distal and more calcified lesions are harder (model parameter). */
const pciKey = (v: { severity: number; lengthMm: number; position: number; calcium: number }) => v.lengthMm / 6 + v.calcium * 2 + Math.abs(v.position - 0.4) * 5 + (v.severity >= 99 ? 1 : 0);

function pciVariants(baseId: string, prefix: "L" | "X", n: number): PciVariant[] {
  const b = PCI_BASES.find((x) => x.id === baseId)!;
  const out: PciVariant[] = [];
  for (let i = 0; i < n; i++) {
    const h = (salt: string) => (fnv(`${prefix}:${baseId}:${i}:${salt}`) % 10000) / 10000;
    const lengthMm = Math.round(Math.max(8, Math.min(38, b.lengthMm * (0.7 + h("len") * 1.3))));
    const position = Math.round(Math.max(0.15, Math.min(0.75, b.position + (h("pos") - 0.5) * 0.4)) * 100) / 100;
    const severity = b.severity >= 99 ? b.severity : Math.round(Math.max(70, Math.min(95, b.severity + (h("sev") - 0.5) * 20)));
    // a base with two calcium grades takes the first 60% of the time (model parameter)
    const calcium = (b.calciumGrades ? (h("ca") < 0.6 ? b.calciumGrades[0] : b.calciumGrades[1]) : b.calcium) as 0 | 1 | 2;
    const v = { severity, lengthMm, position, calcium };
    out.push({ id: `pci-${baseId}~${prefix}${i}`, base: baseId, rung: 0, ...v, key: pciKey(v) });
  }
  return out.sort((a, c) => a.key - c.key || (a.id < c.id ? -1 : 1));
}

function buildPci(epa: EpaId): Ladder["pci"] {
  const b = PCI_BASES.find((x) => x.epa === epa);
  if (!b) return undefined;
  const { rungs: R, practicePerRung: P, examPerRung: E } = LADDER_PARAMS;
  const base: PciVariant = { id: `pci-${b.id}`, base: b.id, rung: 1, severity: b.severity, lengthMm: b.lengthMm, position: b.position, calcium: b.calcium, key: pciKey(b) };
  const practice = pciVariants(b.id, "L", (R - 1) * P);
  const rungs: PciVariant[][] = [[base]];
  for (let r = 1; r < R; r++) rungs.push(practice.slice((r - 1) * P, r * P).map((v) => ({ ...v, rung: r + 1 })));
  const bounds = rungs.map((vs) => Math.max(...vs.map((v) => v.key)));
  const exam = pciVariants(b.id, "X", (R - 1) * E * 2)
    .map((v) => {
      const idx = bounds.findIndex((m) => v.key <= m);
      return { ...v, rung: Math.max(2, Math.min(R, idx === -1 ? R : idx + 1)) };
    })
    .filter((v, i, all) => all.slice(0, i).filter((x) => x.rung === v.rung).length < E);
  return { base: b.id, rungs, exam };
}

/** Parameters of a PCI scenario id (base or variant), for the PCI lab and the logbook. */
export function pciVariantById(id: string): PciVariant | undefined {
  const m = /^pci-([a-z-]+?)(?:~([LX])(\d+))?$/.exec(id);
  if (!m) return undefined;
  const b = PCI_BASES.find((x) => x.id === m[1]);
  if (!b) return undefined;
  const l = ladderFor(b.epa);
  const all = [...(l.pci?.rungs.flat() ?? []), ...(l.pci?.exam ?? [])];
  return all.find((v) => v.id === id);
}

/**
 * Apply a variant to a PCI scenario object (structurally typed so this file does not
 * import the PCI engine). The lab calls this with its own PciScenario.
 */
export function applyPciVariant<S extends { id: string; title: string; calcium: 0 | 1 | 2; target: { severity: number; lengthMm: number; position: number } }>(s: S, v: PciVariant): S {
  return { ...s, id: v.id.replace(/^pci-/, ""), title: v.rung > 1 ? `${s.title} (variant ${v.id.split("~")[1]})` : s.title, calcium: v.calcium, target: { ...s.target, severity: v.severity, lengthMm: v.lengthMm, position: v.position } };
}

// ---------------------------------------------------------------------------
// Lab ladders
// ---------------------------------------------------------------------------

export const LAB_SIM_KEYS: Partial<Record<EpaId, string[]>> = {
  "haemo-cath": ["haemo"],
  "coronary-physiology": ["physiology"],
  "mcs-support": ["iabp", "impella", "ecmo"],
  "structural-tavi": ["tavi"],
  "structural-mitral-laao": ["teer", "laao"],
  "bedside-emergency": ["pacing", "pericardiocentesis"],
  "complication-bailout": [],
};

// ---------------------------------------------------------------------------
// Public lookups
// ---------------------------------------------------------------------------

const cache = new Map<EpaId, Ladder>();

export function ladderFor(epa: EpaId): Ladder {
  const hit = cache.get(epa);
  if (hit) return hit;
  let l: Ladder;
  if (DIAG_SPECS[epa]) {
    const d = buildDiagnostic(epa);
    l = { epa, kind: "diagnostic", playableRungs: d.rungs.filter((r) => r.caseIds.length).length, diagnostic: d };
  } else if (READING_LADDERS[epa]) {
    l = { epa, kind: "reading", playableRungs: READING_LADDERS[epa]!.length, reading: READING_LADDERS[epa] };
  } else if (PCI_BASES.some((b) => b.epa === epa)) {
    // Variants need the PCI lab to accept a scenario; until then only rung 1 (the base scenario) is playable.
    l = { epa, kind: "pci", playableRungs: 1, pci: buildPci(epa) };
  } else {
    l = { epa, kind: "lab", playableRungs: 1, simKeys: LAB_SIM_KEYS[epa] ?? [] };
  }
  cache.set(epa, l);
  return l;
}

/** Decode a generated case id (gen|preset|seed). */
export function decodeGenId(id: string): { preset: string; seed: string } | null {
  if (!id.startsWith("gen|")) return null;
  const parts = id.split("|");
  return parts.length >= 3 ? { preset: parts[1], seed: parts.slice(2).join("|") } : null;
}

export interface CaseClass {
  /** EPA whose ladder or exam pool holds this case */
  epa?: EpaId;
  rung?: number;
  exam: boolean;
}

/** Where a case id sits in the catalogue (practice rung, exam pool, or nowhere). */
export function classifyCase(caseId: string): CaseClass {
  const g = decodeGenId(caseId);
  if (g) {
    const m = /^([LX]):([a-z-]+):/.exec(g.seed);
    if (m && DIAG_SPECS[m[2] as EpaId]) {
      const epa = m[2] as EpaId;
      const d = ladderFor(epa).diagnostic!;
      if (m[1] === "X") {
        const rung = examRungOf(epa, d.rungs, caseId);
        return { epa, rung, exam: rung !== undefined };
      }
      const r = d.rungs.find((x) => x.caseIds.includes(caseId));
      return { epa, rung: r?.rung, exam: false };
    }
    return { exam: false };
  }
  if (caseId.startsWith("angio-exam:")) {
    const drill = caseId.split(":")[1];
    const epa = (Object.keys(READING_LADDERS) as EpaId[]).find((e) => readingRung(e, drill));
    return { epa, rung: epa ? readingRung(epa, drill) : undefined, exam: !!epa };
  }
  const v = caseId.startsWith("pci-") ? pciVariantById(caseId) : undefined;
  if (v) {
    const epa = PCI_BASES.find((b) => b.id === v.base)!.epa;
    return { epa, rung: v.rung, exam: v.id.includes("~X") };
  }
  return { exam: false };
}

/** True only for cases in the EPA's held-out exam pool. */
export function isExamCase(epa: EpaId, caseId: string): boolean {
  const c = classifyCase(caseId);
  return c.exam && c.epa === epa;
}

/** Rung a non-catalogue diagnostic case would sit on, from the ladder's key ranges. */
export function estimateRung(epa: EpaId, c: AnatomyCase): number | undefined {
  const spec = DIAG_SPECS[epa];
  if (!spec) return undefined;
  const k = spec.key(c);
  const rungs = ladderFor(epa).diagnostic!.rungs.filter((r) => r.caseIds.length);
  if (!rungs.length) return undefined;
  const inside = rungs.filter((r) => k >= r.min && k <= r.max);
  if (inside.length) return inside[inside.length - 1].rung;
  return k < rungs[0].min ? rungs[0].rung : rungs[rungs.length - 1].rung;
}

/** All practice case ids for an EPA (rung order). */
export function practiceCaseIds(epa: EpaId): string[] {
  const l = ladderFor(epa);
  return l.diagnostic?.rungs.flatMap((r) => r.caseIds) ?? l.pci?.rungs.flat().map((v) => v.id) ?? [];
}

/** Exam case ids listed for display (the first few per rung; the pool itself is unbounded, see examCases). */
export function examCaseIds(epa: EpaId): string[] {
  const l = ladderFor(epa);
  return l.diagnostic?.exam.flatMap((r) => r.caseIds) ?? l.pci?.exam.map((v) => v.id) ?? [];
}

export function caseFor(id: string): AnatomyCase | undefined {
  return resolveCase(id);
}

/** Map a sim key (recordSim) to EPAs and rungs. */
export function simKeyEpas(key: string): { epa: EpaId; rung?: number }[] {
  if (key.startsWith("angio-")) {
    const drill = key.slice("angio-".length);
    if (drill === "cases") return [{ epa: "lesion-assess", rung: 3 }];
    if (drill === "segments") return [{ epa: "diag-report", rung: 3 }];
    return (Object.keys(READING_LADDERS) as EpaId[]).filter((e) => readingRung(e, drill)).map((epa) => ({ epa, rung: readingRung(epa, drill) }));
  }
  if (key === "pci-bench") return [{ epa: "lesion-assess", rung: 5 }, { epa: "pci-simple", rung: 1 }];
  if (key === "physiology") return [{ epa: "coronary-physiology", rung: 1 }, { epa: "lesion-assess", rung: 4 }];
  if (key.startsWith("pci-")) {
    const v = pciVariantById(key);
    if (v) return [{ epa: PCI_BASES.find((b) => b.id === v.base)!.epa, rung: v.rung }];
  }
  const out: { epa: EpaId; rung?: number }[] = [];
  for (const [epa, keys] of Object.entries(LAB_SIM_KEYS) as [EpaId, string[]][]) if (keys.includes(key)) out.push({ epa, rung: 1 });
  return out;
}

/** The lab a sim key belongs to. */
export function simKeyLab(key: string): import("../../progress/types").LogLab {
  if (key.startsWith("angio-")) return "angio-reading";
  if (key === "pci-bench") return "pci-bench";
  if (key === "physiology") return "physiology";
  if (key.startsWith("pci-")) return "pci";
  if (key === "haemo") return "haemo";
  if (["iabp", "impella", "ecmo"].includes(key)) return "mcs";
  if (["tavi", "teer", "laao"].includes(key)) return "structural";
  if (["pacing", "pericardiocentesis"].includes(key)) return "bedside";
  return "diagnostic";
}

// ---------------------------------------------------------------------------
// Module evidence: which EPAs a module's knowledge and skill parts refer to.
// skill = true means the module's "apply" part needs passes on that EPA's ladder.
// ---------------------------------------------------------------------------

export const MODULE_EVIDENCE: Record<string, { epas: EpaId[]; skill: boolean }> = {
  "fnd-heart": { epas: ["haemo-cath"], skill: false },
  "fnd-coronary-anatomy": { epas: ["diag-report", "lca-engage", "rca-engage"], skill: false },
  "fnd-physiology": { epas: ["coronary-physiology"], skill: false },
  "fnd-ecg": { epas: ["pci-stemi"], skill: false },
  "fnd-pharmacology": { epas: ["pci-simple"], skill: false },
  "fnd-safety": { epas: ["diag-study"], skill: false },
  "fnd-lab": { epas: ["access-radial", "access-femoral"], skill: false },
  "dx-indications": { epas: ["diag-study"], skill: false },
  "dx-access": { epas: ["access-radial", "access-femoral"], skill: true },
  "dx-catheters": { epas: ["lca-engage", "rca-engage"], skill: true },
  "dx-views": { epas: ["diag-study"], skill: true },
  "dx-interpretation": { epas: ["lesion-assess"], skill: false },
  "dx-anatomy-pitfalls": { epas: ["diag-report"], skill: false },
  "dx-grafts": { epas: ["diag-study"], skill: false },
  "dx-lv-aorta-report": { epas: ["diag-report"], skill: false },
  "hd-basics": { epas: ["haemo-cath"], skill: true },
  "hd-waveforms": { epas: ["haemo-cath"], skill: true },
  "hd-flow-resistance": { epas: ["haemo-cath"], skill: true },
  "hd-shunts": { epas: ["haemo-cath"], skill: true },
  "hd-valves": { epas: ["haemo-cath"], skill: true },
  "hd-pericardial-myocardial": { epas: ["haemo-cath"], skill: true },
  "phy-pressure-wire": { epas: ["coronary-physiology", "lesion-assess"], skill: true },
  "phy-angio-derived": { epas: ["coronary-physiology"], skill: false },
  "phy-microvascular": { epas: ["coronary-physiology"], skill: true },
  "phy-ivus": { epas: ["lesion-assess"], skill: true },
  "phy-oct": { epas: ["lesion-assess"], skill: true },
  "pci-indications": { epas: ["pci-simple"], skill: false },
  "pci-pharmacology": { epas: ["pci-simple"], skill: false },
  "pci-planning": { epas: ["lesion-assess"], skill: false },
  "pci-guides": { epas: ["pci-simple"], skill: false },
  "pci-wires": { epas: ["pci-simple"], skill: false },
  "pci-balloons-stents": { epas: ["pci-simple"], skill: true },
  "pci-procedure": { epas: ["pci-simple"], skill: true },
  "pci-after": { epas: ["access-radial", "access-femoral"], skill: false },
  "cx-bifurcation": { epas: ["pci-simple"], skill: false },
  "cx-left-main": { epas: ["pci-simple"], skill: false },
  "cx-calcium": { epas: ["pci-calcium"], skill: true },
  "cx-cto": { epas: ["pci-cto"], skill: true },
  "cx-grafts-thrombus": { epas: ["pci-stemi"], skill: false },
  "cx-high-risk": { epas: ["mcs-support"], skill: true },
  "comp-principles": { epas: ["complication-bailout"], skill: false },
  "comp-perforation": { epas: ["complication-bailout"], skill: true },
  "comp-dissection-flow": { epas: ["complication-bailout"], skill: true },
  "comp-equipment": { epas: ["complication-bailout"], skill: false },
  "comp-systemic-access": { epas: ["access-femoral"], skill: false },
  "comp-stent-failure": { epas: ["pci-simple"], skill: false },
  "mcs-stemi": { epas: ["pci-stemi"], skill: true },
  "mcs-arrest-nste": { epas: ["mcs-support"], skill: false },
  "mcs-shock": { epas: ["haemo-cath", "mcs-support"], skill: false },
  "mcs-iabp": { epas: ["mcs-support"], skill: true },
  "mcs-impella": { epas: ["mcs-support"], skill: true },
  "mcs-ecmo": { epas: ["mcs-support"], skill: true },
  "mcs-rv-bridges": { epas: ["mcs-support"], skill: false },
  "sh-imaging-transseptal": { epas: ["structural-mitral-laao"], skill: false },
  "sh-tavi-planning": { epas: ["structural-tavi"], skill: false },
  "sh-tavi-procedure": { epas: ["structural-tavi"], skill: true },
  "sh-tavi-complications": { epas: ["structural-tavi"], skill: false },
  "sh-mitral-tricuspid": { epas: ["structural-mitral-laao"], skill: true },
  "sh-laao": { epas: ["structural-mitral-laao"], skill: true },
  "sh-pfo-asd": { epas: ["haemo-cath"], skill: false },
  "bed-pacing": { epas: ["bedside-emergency"], skill: true },
  "bed-pericardiocentesis": { epas: ["bedside-emergency"], skill: true },
  "bed-access-closure": { epas: ["access-femoral"], skill: false },
  // --- manual curriculum (src/content/manual/**): knowledge evidence from the step-by-step modules ---
  "pm-planning": { epas: ["pci-simple"], skill: false },
  "pm-monitoring": { epas: ["diag-study"], skill: false },
  "pm-antithrombotics": { epas: ["pci-simple"], skill: false },
  "pm-lab-drugs": { epas: ["diag-study"], skill: false },
  "pm-access": { epas: ["access-radial", "access-femoral"], skill: true },
  "pm-to-the-root": { epas: ["lca-engage", "rca-engage"], skill: true },
  "pm-engaging": { epas: ["lca-engage", "rca-engage"], skill: true },
  "pm-acquiring": { epas: ["diag-study"], skill: true },
  "pm-interpreting": { epas: ["lesion-assess", "diag-report"], skill: false },
  "pm-target": { epas: ["lesion-assess", "pci-simple"], skill: false },
  "pm-wiring": { epas: ["pci-simple"], skill: true },
  "pm-prep-and-stent": { epas: ["pci-simple"], skill: true },
  "pm-closure": { epas: ["access-radial", "access-femoral"], skill: false },
  "pm-physiology": { epas: ["coronary-physiology"], skill: true },
  "pm-imaging": { epas: ["lesion-assess"], skill: true },
  "pm-support-choice": { epas: ["mcs-support"], skill: false },
  "pm-support-devices": { epas: ["mcs-support"], skill: true },
  "cp-ostial": { epas: ["pci-simple"], skill: false },
  "cp-bifurcation-provisional": { epas: ["pci-simple"], skill: false },
  "cp-bifurcation-two-stent": { epas: ["pci-simple"], skill: false },
  "cp-left-main": { epas: ["pci-simple", "mcs-support"], skill: false },
  "cp-prior-cabg": { epas: ["diag-study", "pci-simple"], skill: false },
  "cp-calcium": { epas: ["pci-calcium"], skill: true },
  "cp-acs-thrombus": { epas: ["pci-stemi"], skill: true },
  "cp-complex-patients": { epas: ["pci-stemi", "mcs-support"], skill: false },
  "cp-cto-strategy": { epas: ["pci-cto"], skill: true },
  "cp-cto-antegrade": { epas: ["pci-cto"], skill: true },
  "cp-cto-retrograde": { epas: ["pci-cto"], skill: false },
  "cp-other-complex": { epas: ["pci-simple"], skill: false },
  "cp-uncrossable": { epas: ["pci-calcium"], skill: false },
  "cm-principles-closure": { epas: ["complication-bailout"], skill: false },
  "cm-flow-embolism": { epas: ["complication-bailout"], skill: false },
  "cm-perforation": { epas: ["complication-bailout", "bedside-emergency"], skill: false },
  "cm-equipment-loss": { epas: ["complication-bailout"], skill: false },
  "cm-patient-complications": { epas: ["complication-bailout", "diag-study"], skill: false },
  "cm-access-complications": { epas: ["access-radial", "access-femoral"], skill: false },
  "eq-sheaths-guides": { epas: ["pci-simple"], skill: false },
  "eq-balloons-stents-cart": { epas: ["pci-simple"], skill: false },
  "hb-lab-and-radiation": { epas: ["diag-study"], skill: false },
  "hb-cardiac-catheterisation": { epas: ["haemo-cath"], skill: true },
  "hb-specific-conditions": { epas: ["haemo-cath"], skill: false },
  "hb-additional-procedures": { epas: ["bedside-emergency", "structural-mitral-laao"], skill: false },
  "hb-tavi": { epas: ["structural-tavi"], skill: true },
  "hb-mitral-tricuspid-laa": { epas: ["structural-mitral-laao"], skill: true },
  "hb-after-the-procedure": { epas: ["diag-report"], skill: false },
  "hb-background": { epas: ["diag-study"], skill: false },
};

/** Modules linked to an EPA (knowledge evidence for entrustment level I). */
export function modulesForEpa(epa: EpaId): string[] {
  return Object.entries(MODULE_EVIDENCE)
    .filter(([, e]) => e.epas.includes(epa))
    .map(([id]) => id);
}

// ---------------------------------------------------------------------------

/** FNV-1a 32-bit hash (deterministic hold-out and variant parameters). */
export function fnv(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
