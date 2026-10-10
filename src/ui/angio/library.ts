// Loads the locally built real-angiogram library (served at /angio-library by
// the dev server; built from openly licensed datasets by scripts/angio_library).
import { useEffect, useState } from "react";
import { DRILL_PARAM_RULES } from "../../content/schema";
import { dueIds, review as srsReview, type QuizMemory } from "../../simulation/srs";
import type { MergedLabel } from "./labels";
import { STABLE_FACTS, type StableFact } from "../../content/decisions/revascStable";
import { ANGIOCAD_SEGMENTS, angioCadLesionClass, segmentVessel, type Artery } from "./syntax";

export type DatasetName = "CADICA" | "CoronaryDominance" | "AngioCAD";

export type Box = [number, number, number, number, string];

export interface LibRun {
  id: string;
  dataset: DatasetName;
  patientId: string;
  /** URL prefix for frame files */
  base: string;
  frames: string[];
  fps: number;
  artery?: "LCA" | "RCA" | null;
  keyframes?: number[];
  /** worst labelled stenosis grade (CADICA classes) */
  worst?: string | null;
  worstLabel?: string;
  /** frame number (1-based) → lesion boxes */
  boxes?: Record<string, Box[]>;
  /** C-arm angles from the DICOM header: primary (+LAO/−RAO), secondary (+cranial/−caudal) */
  angles?: { primary: number; secondary: number } | null;
  tags?: Record<string, boolean | null>;
  /**
   * Expert labels on this run, one per reader (src/ui/angio/labels.ts): merged from the dataset's labels.json and,
   * for display only, from Reader mode in this browser. Absent until a reader has labelled the run.
   */
  expert?: MergedLabel[];
}

export interface LibPatient {
  id: string;
  dataset: DatasetName;
  age?: string | null;
  sex?: string | null;
  indication?: string | null;
  lvef?: string | null;
  diabetes?: boolean;
  smoker?: boolean;
  hypertension?: boolean;
  dyslipidaemia?: boolean;
  vesselsAffected?: string | null;
  maxDegree?: string | null;
  dominance?: "left" | "right" | null;
  /** CoronaryDominance study category: occlusion, artefact, challenging (main set) or none (domain-shift set) */
  category?: string | null;
  /** AngioCAD segment grades */
  segments?: Record<string, string>;
  /** AngioCAD Gensini score (angiographic burden of coronary disease) */
  gensini?: number | null;
  runs: LibRun[];
}

export interface LibDataset {
  dataset: DatasetName;
  citation: string;
  doi: string;
  licence: string;
  licenceUrl: string;
  changes: string;
  system: string;
  subset?: string;
  patients: LibPatient[];
}

const SOURCES: { name: DatasetName; dir: string }[] = [
  { name: "CADICA", dir: "cadica" },
  { name: "CoronaryDominance", dir: "dominance" },
  { name: "CoronaryDominance", dir: "dominance-main" },
  { name: "AngioCAD", dir: "angiocad" },
];

interface RawRun extends Omit<LibRun, "dataset" | "patientId" | "base"> {
  dir?: string;
}
interface RawPatient extends Omit<LibPatient, "dataset" | "runs"> {
  runs: RawRun[];
}
export interface RawDataset extends Omit<LibDataset, "patients"> {
  patients: RawPatient[];
  /**
   * The folder's expert-label file beside index.json (src/ui/angio/labels.ts), e.g. "labels.json". Only folders
   * that declare it are asked for labels, so a library without labels makes no requests that fail.
   */
  labels?: string;
}

/** The library's folders: dataset name and directory under /angio-library. */
export const LIBRARY_SOURCES: readonly { name: DatasetName; dir: string }[] = SOURCES;

/** Turn one parsed index.json into a LibDataset (pure; also used by the tests). */
export function buildDataset(d: RawDataset, name: DatasetName, dir: string): LibDataset {
  // the label file is the loader's concern, not part of the dataset
  const { labels: _labels, ...rest } = d;
  return {
    ...rest,
    dataset: name,
    patients: d.patients.map((p) => ({
      ...p,
      dataset: name,
      runs: p.runs.map((run) => ({
        ...run,
        dataset: name,
        patientId: p.id,
        base: `/angio-library/${dir}/${run.dir ?? run.id}/`,
      })),
    })),
  };
}

/** A library folder whose index.json declares an expert-label file, and that file's URL. */
export interface LabelFileSource {
  name: DatasetName;
  dir: string;
  file: string;
}

/** The label file a parsed index.json declares, as a URL beside it, or null (pure; also used by the tests). */
export function labelFileOf(d: Pick<RawDataset, "labels">, dir: string): string | null {
  const f = typeof d.labels === "string" ? d.labels.trim() : "";
  // a plain file name beside index.json only: no folders, no other origins
  if (!f || !/^[\w.-]+\.json$/.test(f)) return null;
  return `/angio-library/${dir}/${f}`;
}

let cache: LibDataset[] | null = null;
let labelSources: LabelFileSource[] = [];
let pending: Promise<LibDataset[]> | null = null;

export function loadLibrary(): Promise<LibDataset[]> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = Promise.all(
      SOURCES.map(async (s) => {
        try {
          const r = await fetch(`/angio-library/${s.dir}/index.json`);
          if (!r.ok) return null;
          const raw = (await r.json()) as RawDataset;
          const file = labelFileOf(raw, s.dir);
          return { ds: buildDataset(raw, s.name, s.dir), label: file ? { name: s.name, dir: s.dir, file } : null };
        } catch {
          return null;
        }
      })
    ).then((arr) => {
      const ok = arr.filter((x): x is NonNullable<typeof x> => !!x);
      labelSources = ok.flatMap((x) => (x.label ? [x.label] : []));
      return (cache = mergeByName(ok.map((x) => x.ds)));
    });
  }
  return pending;
}

/** The library folders that declare an expert-label file in their index.json (after the library has loaded). */
export async function loadLabelSources(): Promise<LabelFileSource[]> {
  await loadLibrary();
  return labelSources.slice();
}

/** One dataset can be built in several parts (folders); present it as one. */
export function mergeByName(parts: LibDataset[]): LibDataset[] {
  const out: LibDataset[] = [];
  for (const d of parts) {
    const prev = out.find((x) => x.dataset === d.dataset);
    if (!prev) out.push({ ...d, patients: d.patients.slice() });
    else {
      prev.patients.push(...d.patients);
      if (d.subset) prev.subset = prev.subset ? `${prev.subset}; ${d.subset}` : d.subset;
    }
  }
  return out;
}

export function useLibrary(): { data: LibDataset[] | null; loading: boolean } {
  const [data, setData] = useState<LibDataset[] | null>(cache);
  useEffect(() => {
    let alive = true;
    if (!cache) loadLibrary().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, []);
  return { data, loading: data === null };
}

export const GRADES = ["p0_20", "p20_50", "p50_70", "p70_90", "p90_98", "p99", "p100"] as const;
export const GRADE_LABEL: Record<string, string> = {
  p0_20: "< 20%",
  p20_50: "20–49%",
  p50_70: "50–69%",
  p70_90: "70–89%",
  p90_98: "90–98%",
  p99: "99% (subtotal)",
  p100: "100% (occluded)",
};

/** Describe C-arm angles the way operators say them. */
export function angleName(a?: { primary: number; secondary: number } | null): string {
  if (!a) return "angles not recorded";
  const p = Math.round(a.primary);
  const s = Math.round(a.secondary);
  const side = Math.abs(p) < 5 ? "AP" : p > 0 ? `LAO ${p}°` : `RAO ${-p}°`;
  const tilt = Math.abs(s) < 5 ? "" : s > 0 ? ` cranial ${s}°` : ` caudal ${-s}°`;
  return side + tilt;
}

/** Nearest standard projection name for real C-arm angles. */
export function standardView(a?: { primary: number; secondary: number } | null): string | null {
  if (!a) return null;
  const { primary: p, secondary: s } = a;
  const ap = Math.abs(p) < 15;
  if (ap && s >= 15) return "AP cranial";
  if (ap && s <= -15) return "AP caudal";
  if (ap) return "AP";
  if (p < 0 && s >= 15) return "RAO cranial";
  if (p < 0 && s <= -15) return "RAO caudal";
  if (p < 0) return "RAO";
  if (p >= 70) return "Left lateral";
  if (s >= 15) return "LAO cranial";
  if (s <= -15) return "LAO caudal (spider)";
  return "LAO";
}

/** Every name standardView can return, in teaching order. */
export const VIEW_NAMES = [
  "RAO caudal",
  "RAO",
  "RAO cranial",
  "AP caudal",
  "AP",
  "AP cranial",
  "LAO caudal (spider)",
  "LAO",
  "LAO cranial",
  "Left lateral",
] as const;

// ===========================================================================
// Reading-drill logic (pure, unit-tested in src/content/content.test.ts)
// ===========================================================================

// ---------------------------------------------------------------------------
// Stenosis classes
// ---------------------------------------------------------------------------

/**
 * Per-run grading bins. CADICA labels each lesion box in seven classes; the drill
 * groups them into the four visual categories in which Sen et al. 2018
 * (doi 10.5830/CVJA-2018-024) reported inter-observer agreement: <50%, 50-69%,
 * 70-89% and 90-99%. CADICA's 100% (total occlusion) class joins the top bin.
 * lo/hi are the bin limits in percent diameter stenosis.
 */
export const GRADE_BINS = [
  { id: "lt50", label: "< 50%", grades: ["p0_20", "p20_50"], lo: 0, hi: 49 },
  { id: "50_69", label: "50–69%", grades: ["p50_70"], lo: 50, hi: 69 },
  { id: "70_89", label: "70–89%", grades: ["p70_90"], lo: 70, hi: 89 },
  { id: "90_100", label: "90–100%", grades: ["p90_98", "p99", "p100"], lo: 90, hi: 100 },
] as const;

/** Bin index (0-3) of a CADICA grade, or -1 if the grade is unknown or empty. */
export function gradeBin(grade?: string | null): number {
  if (!grade) return -1;
  return GRADE_BINS.findIndex((b) => (b.grades as readonly string[]).includes(grade));
}

/** Bin index of a percentage estimate (0-100). */
export function percentBin(pct: number): number {
  if (!Number.isFinite(pct)) return -1;
  const p = Math.round(Math.max(0, Math.min(100, pct)));
  return GRADE_BINS.findIndex((b) => p >= b.lo && p <= b.hi);
}

/** Signed distance (percentage points) from an estimate to a bin; 0 inside the bin. */
export function distanceToBin(pct: number, bin: number): number {
  const b = GRADE_BINS[bin];
  if (!b) return NaN;
  if (pct < b.lo) return pct - b.lo;
  if (pct > b.hi) return pct - b.hi;
  return 0;
}

/**
 * Inter-observer agreement between three visual operators by stenosis category,
 * Sen et al. 2018 (Cardiovasc J Afr 29(5):278-282, doi 10.5830/CVJA-2018-024),
 * abstract: kappa 0.323 (<50%), 0.261 (50-69%), 0.406 (70-89%), 0.5813 (90-99%).
 * Indexed like GRADE_BINS. See docs/realism/facts/S13.md.
 */
export const SEN2018_KAPPA = [0.323, 0.261, 0.406, 0.5813] as const;
/** Sen 2018: QCA percent diameter vs percent area stenosis on the same 155 lesions (mean ± SD). */
export const SEN2018_QCA = { diameterMean: 58.4, diameterSd: 14.5, areaMean: 80.6, areaSd: 11.2, lesions: 155, operators: 3 } as const;

/**
 * CADICA patient-level "most severe stenosis" uses three native classes. The
 * index.json spells them inconsistently ("> 70%", ">70%", "< 20%", "<20%",
 * "20-50%"), which made the old free-text comparison fail for 36 of 42 patients.
 */
export const PATIENT_DEGREE_CLASSES = ["<20%", "20-50%", ">70%"] as const;
export type PatientDegree = (typeof PATIENT_DEGREE_CLASSES)[number];

/** Map any spelling of a CADICA patient degree label to its native class, or null. */
export function normaliseDegree(s?: string | null): PatientDegree | null {
  if (!s) return null;
  const t = s.replace(/\s+/g, "").replace(/[–—]/g, "-").replace(/%/g, "").toLowerCase();
  if (/^<20$/.test(t) || t === "0-20") return "<20%";
  if (/^20-(49|50)$/.test(t)) return "20-50%";
  if (/^>70$/.test(t) || /^>=?70$/.test(t)) return ">70%";
  return null;
}

// ---------------------------------------------------------------------------
// Agreement statistics
// ---------------------------------------------------------------------------

/** Confusion matrix counts m[ref][answer] over category indices 0..k-1. */
export function confusion(ref: number[], ans: number[], k: number): number[][] {
  const m = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  for (let i = 0; i < ref.length; i++) {
    const r = ref[i];
    const a = ans[i];
    if (r >= 0 && r < k && a >= 0 && a < k) m[r][a] += 1;
  }
  return m;
}

/** Mean per-class recall over the reference classes present. A constant answer scores 1/K. */
export function balancedAccuracy(ref: number[], ans: number[]): number {
  const classes = [...new Set(ref)];
  if (!classes.length) return NaN;
  let sum = 0;
  for (const c of classes) {
    let n = 0;
    let hit = 0;
    for (let i = 0; i < ref.length; i++)
      if (ref[i] === c) {
        n++;
        if (ans[i] === c) hit++;
      }
    sum += hit / n;
  }
  return sum / classes.length;
}

export interface Kappa {
  kappa: number;
  /** approximate 95% CI, SE = sqrt(po(1-po) / (n (1-pe)^2)) (Cohen 1960 large-sample form) */
  lo: number;
  hi: number;
  po: number;
  pe: number;
  n: number;
}

/**
 * Cohen's kappa between reference and answers. With `weights: "linear"` the
 * categories are treated as ordered (weighted kappa, 1 - |i-j|/(k-1), k = nCats
 * when given, else the span of the categories seen).
 * A rater who always gives the same answer has kappa 0 (po equals pe).
 */
export function cohenKappa(ref: number[], ans: number[], weights: "none" | "linear" = "none", nCats?: number): Kappa {
  const n = Math.min(ref.length, ans.length);
  const cats = [...new Set([...ref.slice(0, n), ...ans.slice(0, n)])].sort((a, b) => a - b);
  const k = cats.length;
  if (n === 0) return { kappa: NaN, lo: NaN, hi: NaN, po: NaN, pe: NaN, n: 0 };
  const idx = new Map(cats.map((c, i) => [c, i]));
  const span = weights === "linear" ? Math.max(1, nCats ? nCats - 1 : cats[k - 1] - cats[0]) : 1;
  const w = (a: number, b: number) => (weights === "linear" ? 1 - Math.abs(cats[a] - cats[b]) / span : a === b ? 1 : 0);
  const pr = new Array<number>(k).fill(0);
  const pa = new Array<number>(k).fill(0);
  let po = 0;
  for (let i = 0; i < n; i++) {
    const r = idx.get(ref[i])!;
    const a = idx.get(ans[i])!;
    pr[r] += 1 / n;
    pa[a] += 1 / n;
    po += w(r, a) / n;
  }
  let pe = 0;
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) pe += w(i, j) * pr[i] * pa[j];
  if (1 - pe < 1e-12) {
    // Both raters constant and identical: agreement is undefined; report 0 (no information beyond chance).
    return { kappa: 0, lo: 0, hi: 0, po, pe, n };
  }
  const kappa = (po - pe) / (1 - pe);
  const se = Math.sqrt(Math.max(0, po * (1 - po)) / (n * (1 - pe) * (1 - pe)));
  return { kappa, lo: kappa - 1.96 * se, hi: kappa + 1.96 * se, po, pe, n };
}

/** Brier score of stated confidence (0-1) that each answer was right. 0 is perfect; always 0.5 confident scores 0.25. */
export function brier(conf: number[], correct: boolean[]): number {
  const n = Math.min(conf.length, correct.length);
  if (!n) return NaN;
  let s = 0;
  for (let i = 0; i < n; i++) s += (conf[i] - (correct[i] ? 1 : 0)) ** 2;
  return s / n;
}

/** Mean signed difference answer - reference (positive = over-calling). */
export function signedBias(ref: number[], ans: number[]): number {
  const n = Math.min(ref.length, ans.length);
  if (!n) return NaN;
  let s = 0;
  for (let i = 0; i < n; i++) s += ans[i] - ref[i];
  return s / n;
}

/** Confidence-calibration table: stated confidence bins vs observed accuracy. */
export function calibrationBins(conf: number[], correct: boolean[], edges = [0, 0.6, 0.8, 1.0001]) {
  const out: { lo: number; hi: number; n: number; meanConf: number; accuracy: number }[] = [];
  for (let b = 0; b < edges.length - 1; b++) {
    let n = 0;
    let c = 0;
    let k = 0;
    for (let i = 0; i < conf.length; i++)
      if (conf[i] >= edges[b] && conf[i] < edges[b + 1]) {
        n++;
        c += conf[i];
        if (correct[i]) k++;
      }
    out.push({ lo: edges[b], hi: Math.min(1, edges[b + 1]), n, meanConf: n ? c / n : NaN, accuracy: n ? k / n : NaN });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Sampling
// ---------------------------------------------------------------------------

/** Small deterministic PRNG (mulberry32) so sets are reproducible in tests. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(a: readonly T[], r: () => number = Math.random): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/**
 * Stratified sample: the same number of items from every class (the size of the
 * smallest class if that is less than `perClass`), returned in random order.
 * Classes with no items are skipped; null classes are excluded.
 */
export function stratifiedSample<T>(items: readonly T[], classOf: (t: T) => string | number | null, perClass: number, r: () => number = Math.random): T[] {
  const groups = new Map<string | number, T[]>();
  for (const it of items) {
    const c = classOf(it);
    if (c === null) continue;
    const g = groups.get(c);
    if (g) g.push(it);
    else groups.set(c, [it]);
  }
  if (!groups.size) return [];
  const n = Math.min(perClass, ...[...groups.values()].map((g) => g.length));
  const out: T[] = [];
  for (const g of groups.values()) out.push(...shuffled(g, r).slice(0, n));
  return shuffled(out, r);
}

// ---------------------------------------------------------------------------
// Projection ambiguity
// ---------------------------------------------------------------------------

export interface ViewCall {
  nominal: string;
  /** every view name reachable by moving either angle by up to `tol` degrees */
  accepted: string[];
  borderline: boolean;
}

/**
 * The standard-view boundaries (15° from AP, 15° cranial/caudal, LAO 70°) are
 * conventions, not anatomy. A run within `tol` degrees of a boundary may be
 * called by either neighbouring name: 564 of 1,625 CoronaryDominance runs (34.7%)
 * are within 5°.
 */
export function viewCall(a: { primary: number; secondary: number }, tol = 5): ViewCall {
  const nominal = standardView(a)!;
  const acc = new Set<string>([nominal]);
  const steps = [-tol, 0, tol];
  for (const dp of steps) for (const ds of steps) acc.add(standardView({ primary: a.primary + dp, secondary: a.secondary + ds })!);
  const accepted = VIEW_NAMES.filter((v) => acc.has(v));
  return { nominal, accepted, borderline: accepted.length > 1 };
}

// ---------------------------------------------------------------------------
// Lesion localisation
// ---------------------------------------------------------------------------

/** True if image point (x, y) is inside the box enlarged by `margin` of its width and height on each side. */
export function boxHit(b: Box | [number, number, number, number], x: number, y: number, margin = 0.1): boolean {
  const [bx, by, bw, bh] = b;
  const mx = bw * margin;
  const my = bh * margin;
  return x >= bx - mx && x <= bx + bw + mx && y >= by - my && y <= by + bh + my;
}

/** The box on `frame` (1-based) hit by the click, if any. */
export function hitBox(run: LibRun, frame: number, x: number, y: number, margin = 0.1): Box | null {
  const bs = (run.boxes?.[String(frame)] ?? []).filter((b) => boxHit(b, x, y, margin));
  if (bs.length <= 1) return bs[0] ?? null;
  // Overlapping boxes: the one whose centre is nearest the click, relative to its size.
  const d = (b: Box) => Math.hypot((x - (b[0] + b[2] / 2)) / Math.max(1, b[2]), (y - (b[1] + b[3] / 2)) / Math.max(1, b[3]));
  return bs.reduce((a, b) => (d(b) < d(a) ? b : a));
}

/** Labelled frames of a run (1-based), in order. */
export function boxedFrames(run: LibRun): number[] {
  return Object.keys(run.boxes ?? {})
    .map(Number)
    .filter((f) => (run.boxes?.[String(f)]?.length ?? 0) > 0)
    .sort((a, b) => a - b);
}

/** Worst CADICA grade among the boxes drawn on one frame. */
export function worstOnFrame(run: LibRun, frame: number): string | null {
  const bs = run.boxes?.[String(frame)] ?? [];
  let best = -1;
  let g: string | null = null;
  for (const b of bs) {
    const i = (GRADES as readonly string[]).indexOf(b[4]);
    if (i > best) {
      best = i;
      g = b[4];
    }
  }
  return g;
}

// ---------------------------------------------------------------------------
// Study order (next-view planning)
// ---------------------------------------------------------------------------

/**
 * Acquisition order of a study's runs. CoronaryDominance run ids end in the
 * series number across both arteries (cd-01029-LCA-7, cd-01029-RCA-8), so the
 * trailing integer orders the study.
 */
export function studyOrder(p: LibPatient): LibRun[] {
  const num = (r: LibRun) => {
    const m = /-(\d+)$/.exec(r.id);
    return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
  };
  return p.runs.slice().sort((a, b) => num(a) - num(b));
}

/** Studies usable for next-view planning: CoronaryDominance, at least `minRuns` runs with angles. */
export function planningStudies(patients: LibPatient[], minRuns = 3): LibPatient[] {
  return patients.filter((p) => p.dataset === "CoronaryDominance" && p.runs.filter((r) => r.angles).length >= minRuns && p.runs.every((r) => r.angles));
}

// ---------------------------------------------------------------------------
// Per-item results (learning curves) and deep links
// ---------------------------------------------------------------------------

export interface DrillResult {
  /** epoch ms */
  t: number;
  drill: string;
  runId: string;
  /** reference and answer class indices (drill-specific) */
  ref: number;
  ans: number;
  correct: boolean;
  /** stated confidence 0-1 */
  conf: number;
  /** set number, so results can be grouped into sets */
  set: number;
}

const RESULTS_KEY = "cathmaster:v1:angio-results";
const RESULTS_MAX = 5000;

export function loadResults(): DrillResult[] {
  try {
    const raw = globalThis.localStorage?.getItem(RESULTS_KEY);
    return raw ? (JSON.parse(raw) as DrillResult[]) : [];
  } catch {
    return [];
  }
}

export function saveResults(add: DrillResult[]): void {
  try {
    const all = [...loadResults(), ...add].slice(-RESULTS_MAX);
    globalThis.localStorage?.setItem(RESULTS_KEY, JSON.stringify(all));
  } catch {
    // storage full or unavailable: results are kept for this session only
  }
}

/** SRS key for a run in a drill; QuizMemory items keyed by run id. */
export function srsKey(drill: string, runId: string): string {
  return `angio:${drill}:${runId}`;
}

export function parseSrsKey(key: string): { drill: string; runId: string } | null {
  const m = /^angio:([a-z-]+):(.+)$/.exec(key);
  return m ? { drill: m[1], runId: m[2] } : null;
}

/** Deep link from Academy content into a specific drill (consumed once by RealAngiograms). */
let pendingDrill: { drill: string; params?: Record<string, string> } | null = null;
export function requestDrill(drill: string, params?: Record<string, string>): void {
  pendingDrill = { drill, params };
}
/** Read the pending request without clearing it (safe in a double-invoked render). */
export function peekRequestedDrill(): { drill: string; params?: Record<string, string> } | null {
  return pendingDrill;
}
export function clearRequestedDrill(): void {
  pendingDrill = null;
}
export function takeRequestedDrill(): { drill: string; params?: Record<string, string> } | null {
  const p = pendingDrill;
  pendingDrill = null;
  return p;
}

/**
 * Hook for drills built by other streams (the expert-label drills of
 * angio-expert-label-drills register here from RealAngiograms.tsx). A stream registers a
 * drill at module load; the Real angiograms section lists registered drills after its
 * own and opens one when a lesson link names its id. Nothing is registered by this file.
 */
export interface ExtraDrillProps {
  /** practice runs (held-out exam patients excluded), with any expert labels merged */
  runs: LibRun[];
  patients: LibPatient[];
  data: LibDataset[];
  /** parameters from the lesson link that opened the drill */
  params?: Record<string, string>;
}
export interface ExtraDrillGate {
  /** the drill has what it needs (for a label drill: at least the gate's number of labelled runs) */
  open: boolean;
  /** shown beside the drill's name, for example "not yet labelled (3 of 20 runs)" */
  note: string;
}
export interface ExtraDrill {
  id: string;
  label: string;
  /** a React component; it receives the section's practice runs */
  component: (props: ExtraDrillProps) => unknown;
  /** whether the drill can be practised on these runs; a closed drill still opens, to say why */
  gate?: (runs: readonly LibRun[]) => ExtraDrillGate;
}
const extraDrills: ExtraDrill[] = [];
export function registerAngioDrill(d: ExtraDrill): void {
  if (!extraDrills.some((x) => x.id === d.id)) extraDrills.push(d);
}
export function registeredAngioDrills(): readonly ExtraDrill[] {
  return extraDrills;
}

/** Find a run by id across the loaded library. */
export function findRun(data: LibDataset[] | null, id: string): LibRun | null {
  if (!data) return null;
  for (const d of data) for (const p of d.patients) for (const r of p.runs) if (r.id === id) return r;
  return null;
}

// ===========================================================================
// Drill item builders (pure; the UI renders them, the tests simulate readers)
// ===========================================================================

export type DrillKind = "artery" | "dominance" | "occlusion" | "collaterals" | "view" | "grade" | "locate" | "estimate" | "plan";

export type DrillMode = "choice" | "locate" | "estimate";

export interface DrillItem {
  drill: DrillKind;
  mode: DrillMode;
  /** run id the SRS memory and result log are keyed by */
  key: string;
  run: LibRun;
  /** runs the learner may review before answering (run first) */
  runs?: LibRun[];
  question: string;
  options: string[];
  /** reference option index */
  answer: number;
  /** option indices also scored correct (borderline projections); includes answer */
  accepted: number[];
  /** shown after answering */
  explain: string;
  /** 1-based frame the player opens on */
  startFrame?: number;
  /** lesion boxes outlined without grades (estimate drill) */
  outline?: Record<string, Box[]>;
  /** locate drill: the frame shown carries an expert lesion box */
  lesion?: boolean;
  /** next-view planning: views acquired later in the study (half credit) */
  laterViews?: string[];
  /** next-view planning: the runs already acquired, in order */
  shown?: LibRun[];
}

export interface DrillContext {
  runs: LibRun[];
  patients: LibPatient[];
  /** view drill: "accept" scores either neighbouring name within 5°, "exclude" leaves borderline runs out */
  borderline?: "accept" | "exclude";
  /** set by applyDrillParams when a lesson restricts the drill to one coronary injection */
  artery?: "LCA" | "RCA";
}

export const DRILL_LABEL: Record<DrillKind, string> = {
  artery: "Left or right?",
  dominance: "Dominance",
  occlusion: "Occluded RCA?",
  collaterals: "Collaterals?",
  view: "Name the projection",
  grade: "Grade the stenosis",
  locate: "Find the lesion",
  estimate: "Estimate the stenosis",
  plan: "Plan the next view",
};

/** Items per class in one set (model parameters chosen for a 5-10 minute set). */
export const PER_CLASS: Record<DrillKind, number> = {
  artery: 6,
  dominance: 5,
  occlusion: 6,
  collaterals: 6,
  view: 2,
  grade: 3,
  locate: 8,
  estimate: 3,
  plan: 8,
};

const opt = (labels: readonly string[], i: number) => ({ options: labels.slice(), answer: i, accepted: [i] });

function middle<T>(a: T[]): T | undefined {
  return a[Math.floor((a.length - 1) / 2)];
}

/** One item for a run in a drill, or null if the run cannot be used for that drill. */
export function itemFor(drill: DrillKind, run: LibRun, ctx: DrillContext): DrillItem | null {
  const patient = ctx.patients.find((p) => p.id === run.patientId && p.dataset === run.dataset);
  const base = { drill, key: run.id, run };
  switch (drill) {
    case "artery": {
      if (run.artery !== "LCA" && run.artery !== "RCA") return null;
      const lca = run.artery === "LCA";
      return {
        ...base,
        mode: "choice",
        question: "Which coronary artery has been injected?",
        ...opt(["Left coronary artery", "Right coronary artery"], lca ? 0 : 1),
        explain: lca
          ? "Left system: the left main divides into the LAD and circumflex; septal perforators leave the LAD at right angles."
          : "Right system: a single vessel in the right AV groove giving the conus and acute marginals, then the PDA and posterolateral branches at the crux.",
      };
    }
    case "dominance": {
      if (!patient?.dominance || !patient.runs.length) return null;
      const first = patient.runs.find((x) => x.artery === "RCA") ?? patient.runs[0];
      if (first.id !== run.id) return null;
      const right = patient.dominance === "right";
      return {
        ...base,
        mode: "choice",
        runs: [first, ...patient.runs.filter((x) => x !== first)],
        question: "Coronary dominance? Review the left and right runs before you answer.",
        ...opt(["Right dominant", "Left dominant"], right ? 0 : 1),
        explain: right
          ? "Expert label: right dominant. The RCA reaches the crux and gives the posterior descending artery and posterolateral branches."
          : "Expert label: left dominant. The circumflex continues in the AV groove to the crux and gives the posterior descending artery; the RCA is small and ends early.",
      };
    }
    case "occlusion":
    case "collaterals": {
      // Same-domain negatives only. Every tagged run comes from the CoronaryDominance
      // main set; the domain-shift set has no occlusion or collateral tags at all, so
      // taking negatives from it would let the acquisition domain give the answer.
      // Within the main set the artefact tag is also confounded with the label, so
      // makeSet pairs positives and negatives within the same artefact stratum
      // (nuisanceStratum). Runs flagged uncertain are left out.
      const artery = drill === "occlusion" ? "RCA" : "LCA";
      if (run.dataset !== "CoronaryDominance" || run.artery !== artery || !patient) return null;
      if (librarySubset(run) !== "dominance-main" || run.tags?.uncertain === true) return null;
      const v = run.tags?.[drill];
      if (v !== true && v !== false) return null;
      const pos = v === true;
      // A negative must come from a study with no run tagged for this finding.
      if (!pos && patient.runs.some((r) => r.tags?.[drill] === true)) return null;
      return {
        ...base,
        mode: "choice",
        question:
          drill === "occlusion" ? "Right coronary injection. Is the RCA totally occluded?" : "Left coronary injection. Does it fill the right coronary artery through collaterals?",
        ...opt(["Yes", "No"], pos ? 0 : 1),
        explain:
          drill === "occlusion"
            ? pos
              ? "Expert label: RCA occlusion. The contrast column stops abruptly in a stump or a tapered end and the distal vessel does not fill from this injection. It usually fills late from the left through collaterals."
              : "Expert label: no RCA occlusion. Contrast reaches the crux and the posterior branches."
            : pos
              ? "Expert label: collaterals from the left coronary. Late in the run, fine septal or epicardial channels fill the distal RCA backwards. Keep filming until the collaterals and the distal vessel have filled."
              : "Expert label: no collaterals. The left coronary fills its own territory only.",
      };
    }
    case "view": {
      if (!run.angles) return null;
      const call = viewCall(run.angles);
      if (call.borderline && ctx.borderline === "exclude") return null;
      const answer = VIEW_NAMES.indexOf(call.nominal as (typeof VIEW_NAMES)[number]);
      const accepted = (ctx.borderline === "exclude" ? [call.nominal] : call.accepted).map((v) => VIEW_NAMES.indexOf(v as (typeof VIEW_NAMES)[number]));
      return {
        ...base,
        mode: "choice",
        question: "Which projection is this? Use the spine, the diaphragm, the catheter course and the vessel layout.",
        options: VIEW_NAMES.slice(),
        answer,
        accepted,
        explain:
          `Recorded C-arm angles: ${angleName(run.angles)} (${call.nominal}).` +
          (call.borderline
            ? ` These angles are within 5° of a naming boundary, so ${call.accepted.join(" or ")} is scored correct. The boundaries are conventions, not anatomy.`
            : ""),
      };
    }
    case "grade": {
      const bin = gradeBin(run.worst);
      if (bin < 0 || !run.boxes || !Object.keys(run.boxes).length) return null;
      return {
        ...base,
        mode: "choice",
        question: "Grade the most severe stenosis in this run (percent diameter stenosis, visual estimate).",
        ...opt(
          GRADE_BINS.map((b) => b.label),
          bin
        ),
        explain: `Expert label: ${GRADE_LABEL[run.worst!] ?? run.worst} (${GRADE_BINS[bin].label}). The expert boxes are now shown on the keyframes. Three operators grading the same lesions agreed only moderately: kappa ${SEN2018_KAPPA[bin]} in the ${GRADE_BINS[bin].label.replace("90–100%", "90–99%")} category (Sen 2018).`,
      };
    }
    case "locate": {
      if (run.dataset !== "CADICA") return null;
      const frames = boxedFrames(run);
      if (frames.length) {
        const f = middle(frames)!;
        const worst = worstOnFrame(run, f);
        const bin = gradeBin(worst);
        const bs = run.boxes?.[String(f)] ?? [];
        const listed = bs.map((b) => GRADE_LABEL[b[4]] ?? b[4]).join(", ");
        return {
          ...base,
          mode: "locate",
          question:
            bs.length > 1
              ? "Click a stenosis on this frame, or say there is none. Then grade the lesion you clicked."
              : "Click the stenosis on this frame, or say there is none. Then grade the lesion you clicked.",
          options: GRADE_BINS.map((b) => b.label),
          // answer: the worst lesion on the frame (used for stratification); grading is
          // scored against the box the learner actually hit (scoreLocate).
          answer: Math.max(0, bin),
          accepted: [Math.max(0, bin)],
          startFrame: f,
          lesion: true,
          explain:
            bs.length > 1
              ? `The experts boxed ${bs.length} lesions on frame ${f} (${listed}). A click inside any box, enlarged by 10% of its size on each side, is a hit, and your grade is compared with that box.`
              : `Expert box on frame ${f}: ${listed || "lesion"}. A click inside the box, enlarged by 10% of its size on each side, is a hit.`,
        };
      }
      // Negatives: runs the experts labelled with no lesion, shown on a labelled keyframe.
      if (run.worst !== null || !run.keyframes?.length) return null;
      return {
        ...base,
        mode: "locate",
        question: "Click the most important stenosis on this frame, or say there is none. Then grade it.",
        options: GRADE_BINS.map((b) => b.label),
        answer: -1,
        accepted: [],
        startFrame: middle(run.keyframes),
        lesion: false,
        explain: "Expert label: no lesion in this run.",
      };
    }
    case "estimate": {
      if (run.dataset !== "CADICA") return null;
      const frames = boxedFrames(run);
      const f = frames.find((x) => (run.boxes?.[String(x)]?.length ?? 0) === 1) ?? null;
      if (f === null) return null;
      const b = run.boxes![String(f)][0];
      const bin = gradeBin(b[4]);
      if (bin < 0) return null;
      return {
        ...base,
        mode: "estimate",
        question: "Estimate the percent diameter stenosis of the outlined lesion.",
        options: GRADE_BINS.map((x) => x.label),
        answer: bin,
        accepted: [bin],
        startFrame: f,
        outline: { [String(f)]: [b] },
        explain: `Expert label: ${GRADE_LABEL[b[4]] ?? b[4]}.`,
      };
    }
    case "plan": {
      if (!patient || run.dataset !== "CoronaryDominance" || !run.angles) return null;
      const order = studyOrder(patient);
      const i = order.findIndex((r) => r.id === run.id);
      if (i < 2 || order.length < 3 || order.some((r) => !r.angles)) return null;
      const call = viewCall(run.angles);
      const answer = VIEW_NAMES.indexOf(call.nominal as (typeof VIEW_NAMES)[number]);
      const shown = order.slice(0, i);
      const later = order.slice(i + 1).map((r) => standardView(r.angles)!);
      return {
        ...base,
        mode: "choice",
        runs: shown,
        shown,
        laterViews: later,
        question: `${shown.length} runs of this study have been acquired. The next run was a ${run.artery === "RCA" ? "right" : "left"} coronary injection. Which projection would you take next?`,
        options: VIEW_NAMES.slice(),
        answer,
        accepted: call.accepted.map((v) => VIEW_NAMES.indexOf(v as (typeof VIEW_NAMES)[number])),
        explain:
          `The operator's next run: ${run.artery ?? ""} ${angleName(run.angles)} (${call.nominal}). ` +
          `Full sequence: ${order.map((r, k) => `${k + 1}. ${r.artery ?? ""} ${standardView(r.angles)}`).join("; ")}. ` +
          "This compares your plan with one operator's practice, not with a gold standard; a view the operator took later in the study scores half.",
      };
    }
  }
}

function candidateRuns(drill: DrillKind, ctx: DrillContext): LibRun[] {
  if (drill === "dominance") return ctx.patients.filter((p) => p.dominance && p.runs.length).map((p) => p.runs.find((x) => x.artery === "RCA") ?? p.runs[0]);
  if (drill === "plan") return planningStudies(ctx.patients).flatMap((p) => studyOrder(p).slice(2));
  return ctx.runs;
}

/** Library folder a run was built from (for example "dominance" or "dominance-main"). */
export function librarySubset(run: LibRun): string | null {
  const m = /^\/angio-library\/([^/]+)\//.exec(run.base);
  return m ? m[1] : null;
}

/**
 * Nuisance stratum for the yes/no CoronaryDominance drills: library subset and
 * artefact tag. Positives and negatives are paired within a stratum, so neither
 * the acquisition domain nor the presence of an artefact predicts the answer.
 */
export function nuisanceStratum(run: LibRun): string {
  return `${librarySubset(run) ?? "?"}|artefact=${run.tags?.artefact === true}`;
}

/** Class used to stratify a drill's items. */
export function stratum(it: DrillItem): string {
  switch (it.drill) {
    case "locate":
      return it.lesion ? `pos-${it.answer}` : "neg";
    case "plan":
      return it.run.patientId;
    case "occlusion":
    case "collaterals":
      return `${it.answer}|${nuisanceStratum(it.run)}`;
    default:
      return String(it.answer);
  }
}

/** Drills whose sets have equal numbers per reference class (plan follows operator practice instead). */
export const STRATIFIED_DRILLS: readonly DrillKind[] = ["artery", "dominance", "occlusion", "collaterals", "view", "grade", "locate", "estimate"];

/**
 * Positive/negative pairs matched on the nuisance stratum. Returns the pairs
 * available per stratum (min of positives and negatives) for reporting.
 */
export function matchedPairs(items: DrillItem[], r: () => number = Math.random): { pairs: [DrillItem, DrillItem][]; perStratum: Record<string, number> } {
  const by = new Map<string, { pos: DrillItem[]; neg: DrillItem[] }>();
  for (const it of items) {
    const k = nuisanceStratum(it.run);
    const g = by.get(k) ?? { pos: [], neg: [] };
    (it.answer === 0 ? g.pos : g.neg).push(it);
    by.set(k, g);
  }
  const pairs: [DrillItem, DrillItem][] = [];
  const perStratum: Record<string, number> = {};
  for (const [k, g] of by) {
    const p = shuffled(g.pos, r);
    const q = shuffled(g.neg, r);
    const n = Math.min(p.length, q.length);
    perStratum[k] = n;
    for (let i = 0; i < n; i++) pairs.push([p[i], q[i]]);
  }
  return { pairs, perStratum };
}

/**
 * A stratified set: the same number of items from every reference class, so a
 * reader who always gives the same answer scores chance balanced accuracy and
 * kappa 0. Locate draws equal numbers of lesion and no-lesion frames, with the
 * lesion frames spread evenly across grade bins. Occlusion and collaterals draw
 * positive/negative pairs matched on library subset and artefact tag. Plan draws
 * one item per study and is not stratified: its reference is one operator's choice.
 */
export function makeSet(drill: DrillKind, ctx: DrillContext, r: () => number = Math.random): DrillItem[] {
  const items = candidateRuns(drill, ctx)
    .map((run) => itemFor(drill, run, ctx))
    .filter((x): x is DrillItem => !!x);
  if (drill === "plan") {
    const studies = shuffled([...new Set(items.map((i) => i.run.patientId))], r).slice(0, PER_CLASS.plan);
    return studies.map((s) => {
      const of = items.filter((i) => i.run.patientId === s);
      return of[Math.floor(r() * of.length)];
    });
  }
  if (drill === "locate") {
    const pos = items.filter((i) => i.lesion);
    const neg = items.filter((i) => !i.lesion);
    const nPos = PER_CLASS.locate;
    const perBin = Math.ceil(nPos / GRADE_BINS.length);
    const p = stratifiedSample(pos, (i) => i.answer, perBin, r).slice(0, nPos);
    const q = shuffled(neg, r).slice(0, p.length);
    const k = Math.min(p.length, q.length);
    return shuffled([...p.slice(0, k), ...q.slice(0, k)], r);
  }
  if (drill === "occlusion" || drill === "collaterals") {
    const { pairs } = matchedPairs(items, r);
    return shuffled(shuffled(pairs, r).slice(0, PER_CLASS[drill]).flat(), r);
  }
  return stratifiedSample(items, (i) => i.answer, PER_CLASS[drill], r);
}

/** Rebuild the item for a due SRS key (`angio:<drill>:<runId>`). */
export function itemForKey(key: string, ctx: DrillContext): DrillItem | null {
  const k = parseSrsKey(key);
  if (!k) return null;
  const run = ctx.runs.find((r) => r.id === k.runId);
  if (!run || !(k.drill in DRILL_LABEL)) return null;
  return itemFor(k.drill as DrillKind, run, { ...ctx, borderline: "accept" });
}

// ---------------------------------------------------------------------------
// Answers and set summaries
// ---------------------------------------------------------------------------

export interface DrillAnswer {
  /** reference class (choice: option index; locate: 1 lesion / 0 none; estimate: grade bin) */
  ref: number;
  /** answer class on the same scale */
  ans: number;
  correct: boolean;
  /** 0-1 credit (plan: 0.5 for a view taken later) */
  credit: number;
  /** stated confidence 0-1 */
  conf: number;
  /** locate: click hit an expert box */
  hit?: boolean;
  /** locate: the expert box that was hit (its grade is the grading reference) */
  hitBox?: Box;
  /** locate and estimate: grade bins (expert, learner) when graded */
  gradeRef?: number;
  gradeAns?: number;
  /** estimate: the learner's percent and its signed distance to the expert bin */
  pct?: number;
  dist?: number;
}

/** Score a choice answer. For accepted neighbours the effective reference becomes the answer. */
export function scoreChoice(it: DrillItem, choice: number, conf: number): DrillAnswer {
  const ok = it.accepted.includes(choice);
  let credit = ok ? 1 : 0;
  if (!ok && it.drill === "plan" && it.laterViews?.includes(it.options[choice])) credit = 0.5;
  return { ref: ok ? choice : it.answer, ans: choice, correct: ok, credit, conf };
}

/** Score a locate answer: click = null means "no lesion". */
export function scoreLocate(it: DrillItem, click: { x: number; y: number; frame: number } | null, grade: number | null, conf: number): DrillAnswer {
  const ref = it.lesion ? 1 : 0;
  const ans = click ? 1 : 0;
  const box = click && it.lesion && click.frame === it.startFrame ? hitBox(it.run, click.frame, click.x, click.y) : null;
  const hit = !!box;
  const correct = it.lesion ? hit : !click;
  // Grade against the lesion the learner marked, not the worst one on the frame.
  const boxBin = box ? gradeBin(box[4]) : -1;
  return {
    ref,
    ans,
    correct,
    credit: correct ? 1 : 0,
    conf,
    hit,
    hitBox: box ?? undefined,
    gradeRef: hit && boxBin >= 0 ? boxBin : undefined,
    gradeAns: hit && boxBin >= 0 && grade !== null ? grade : undefined,
  };
}

export function scoreEstimate(it: DrillItem, pct: number, conf: number): DrillAnswer {
  const ansBin = percentBin(pct);
  const ok = ansBin === it.answer;
  return { ref: it.answer, ans: ansBin, correct: ok, credit: ok ? 1 : 0, conf, gradeRef: it.answer, gradeAns: ansBin, pct, dist: distanceToBin(pct, it.answer) };
}

export interface SetSummary {
  n: number;
  /** mean credit */
  score: number;
  accuracy: number;
  balancedAccuracy: number;
  /** 1 / number of reference classes: what a constant answer scores */
  chance: number;
  kappa: Kappa;
  /** ordinal drills (grade, estimate, locate grading): linear weighted kappa */
  weightedKappa?: Kappa;
  brier: number;
  /** grade, estimate and locate grading: mean bin difference, positive = over-calling */
  bias?: number;
  /** grade drill: dichotomy at 70% (significant vs not) */
  significance?: { balancedAccuracy: number; kappa: Kappa };
  /** locate: grading on hits */
  grading?: { n: number; balancedAccuracy: number; weightedKappa: Kappa; bias: number };
  /** locate: hits / lesion frames */
  hitRate?: number;
  /** estimate: mean signed distance outside the expert bin, percentage points */
  meanDistance?: number;
}

export function summarise(drill: DrillKind, ans: DrillAnswer[]): SetSummary {
  const ref = ans.map((a) => a.ref);
  const got = ans.map((a) => a.ans);
  const n = ans.length;
  const ordinal = drill === "grade" || drill === "estimate";
  const s: SetSummary = {
    n,
    score: n ? ans.reduce((x, a) => x + a.credit, 0) / n : NaN,
    accuracy: n ? ans.filter((a) => a.correct).length / n : NaN,
    balancedAccuracy: balancedAccuracy(ref, got),
    chance: n ? 1 / new Set(ref).size : NaN,
    kappa: cohenKappa(ref, got),
    weightedKappa: ordinal ? cohenKappa(ref, got, "linear", GRADE_BINS.length) : undefined,
    brier: brier(
      ans.map((a) => a.conf),
      ans.map((a) => a.correct)
    ),
  };
  if (ordinal) s.bias = signedBias(ref, got);
  if (drill === "grade") {
    const r2 = ref.map((x) => (x >= 2 ? 1 : 0));
    const a2 = got.map((x) => (x >= 2 ? 1 : 0));
    s.significance = { balancedAccuracy: balancedAccuracy(r2, a2), kappa: cohenKappa(r2, a2) };
  }
  if (drill === "estimate") {
    const d = ans.map((a) => a.dist ?? 0);
    s.meanDistance = d.length ? d.reduce((x, y) => x + y, 0) / d.length : NaN;
  }
  if (drill === "locate") {
    const pos = ans.filter((a) => a.ref === 1);
    s.hitRate = pos.length ? pos.filter((a) => a.hit).length / pos.length : NaN;
    const g = ans.filter((a) => a.gradeRef !== undefined && a.gradeAns !== undefined);
    const gr = g.map((a) => a.gradeRef!);
    const ga = g.map((a) => a.gradeAns!);
    s.grading = { n: g.length, balancedAccuracy: balancedAccuracy(gr, ga), weightedKappa: cohenKappa(gr, ga, "linear", GRADE_BINS.length), bias: signedBias(gr, ga) };
  }
  return s;
}

/**
 * Raw accuracy of the best constant answer on a set of choice items. In a
 * stratified set without borderline acceptance this is 1/K. Accepting either
 * name near a projection boundary raises it (one name can be right on
 * neighbouring classes), and the plan drill follows operator practice, so the
 * report shows this figure as the raw-accuracy baseline.
 */
export function constantBaseline(items: DrillItem[]): { option: string; accuracy: number } | null {
  const choice = items.filter((i) => i.mode === "choice");
  if (!choice.length) return null;
  const k = Math.max(...choice.map((i) => i.options.length));
  let best = { option: "", accuracy: -1 };
  for (let c = 0; c < k; c++) {
    const acc = choice.filter((i) => i.accepted.includes(c)).length / choice.length;
    if (acc > best.accuracy) best = { option: choice[0].options[c] ?? String(c), accuracy: acc };
  }
  return best;
}

/** Chance level of balanced accuracy for a list of reference classes: 1 / number of classes present. */
export function chanceLevel(ref: number[]): number {
  const k = new Set(ref).size;
  return k ? 1 / k : NaN;
}

// ---------------------------------------------------------------------------
// Spaced repetition for real-angiogram reads (own namespace)
// ---------------------------------------------------------------------------

/**
 * Real-angiogram reads are scheduled with the same SM-2 variant as quiz items
 * (src/simulation/srs.ts) but stored under their own key, so the quiz Review
 * page and the dashboard's quiz due count stay consistent until those pages
 * list real-angiogram reads too (integration step in docs/realism/wave1/S13.md).
 */
export const ANGIO_SRS_KEY = "cathmaster:v1:angio-srs";

export function loadAngioMemory(): Record<string, QuizMemory> {
  try {
    const raw = globalThis.localStorage?.getItem(ANGIO_SRS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, QuizMemory>) : {};
  } catch {
    return {};
  }
}

function saveAngioMemory(m: Record<string, QuizMemory>): void {
  try {
    globalThis.localStorage?.setItem(ANGIO_SRS_KEY, JSON.stringify(m));
  } catch {
    // storage unavailable: the schedule lasts for this session only
  }
}

/** Record one read and return the updated memory. */
export function recordAngioRead(key: string, correct: boolean, today: string, now: number = Date.now()): Record<string, QuizMemory> {
  const m = loadAngioMemory();
  m[key] = srsReview(m[key], correct, today, now);
  saveAngioMemory(m);
  return m;
}

/** Keys of real-angiogram reads due today or overdue (most overdue first). */
export function angioDueKeys(today: string, memory: Record<string, QuizMemory> = loadAngioMemory()): string[] {
  return dueIds(memory, today).filter((k) => !!parseSrsKey(k));
}

/**
 * Move angio:* records that an earlier build wrote into the quiz memory into
 * this namespace. Returns the quiz memory without them (null if there were none).
 */
export function migrateAngioMemory(quizMemory: Record<string, QuizMemory>): Record<string, QuizMemory> | null {
  const keys = Object.keys(quizMemory).filter((k) => parseSrsKey(k));
  if (!keys.length) return null;
  const m = loadAngioMemory();
  for (const k of keys) if (!m[k] || (m[k].last ?? 0) < (quizMemory[k].last ?? 0)) m[k] = quizMemory[k];
  saveAngioMemory(m);
  const rest: Record<string, QuizMemory> = {};
  for (const [k, v] of Object.entries(quizMemory)) if (!parseSrsKey(k)) rest[k] = v;
  return rest;
}

// ---------------------------------------------------------------------------
// Drill parameters from Academy content
// ---------------------------------------------------------------------------

/**
 * Apply a drill block's parameters (validated against DRILL_PARAM_RULES in
 * src/content/schema.ts) to the drill context. Unknown keys are ignored here
 * because the validator rejects them in content.
 */
export function applyDrillParams(ctx: DrillContext, drill: string, params?: Record<string, string>): DrillContext {
  const rules = DRILL_PARAM_RULES[drill as keyof typeof DRILL_PARAM_RULES];
  if (!params || !rules) return ctx;
  let out = ctx;
  const artery = params.artery;
  if (artery && rules.artery?.includes(artery)) out = { ...out, runs: out.runs.filter((r) => r.artery === artery), artery: artery as "LCA" | "RCA" };
  const bl = params.borderline;
  if (bl && rules.borderline?.includes(bl)) out = { ...out, borderline: bl as "accept" | "exclude" };
  return out;
}

/** Plain-language description of applied parameters, for the drill header. */
export function describeDrillParams(params?: Record<string, string>): string | null {
  if (!params) return null;
  const parts: string[] = [];
  if (params.artery === "LCA") parts.push("left coronary injections only");
  if (params.artery === "RCA") parts.push("right coronary injections only");
  if (params.borderline === "exclude") parts.push("borderline projections left out");
  if (params.borderline === "accept") parts.push("either name accepted near a boundary");
  if (params.part === "missing-facts") parts.push("the decision step: count the vessels, then name the facts the dataset does not record");
  return parts.length ? parts.join("; ") : null;
}

/** Library base rates a guessing strategy would exploit without stratification. */
export function baseRates(ctx: DrillContext) {
  const rate = (xs: boolean[]) => (xs.length ? xs.filter(Boolean).length / xs.length : NaN);
  const doms = ctx.patients.filter((p) => p.dominance);
  const arts = ctx.runs.filter((r) => r.artery === "LCA" || r.artery === "RCA");
  const graded = ctx.runs.filter((r) => r.dataset === "CADICA");
  const angled = ctx.runs.filter((r) => r.angles);
  return {
    rightDominant: rate(doms.map((p) => p.dominance === "right")),
    lca: rate(arts.map((r) => r.artery === "LCA")),
    noLesion: rate(graded.map((r) => !r.worst || r.worst === "p0_20")),
    borderlineViews: rate(angled.map((r) => viewCall(r.angles!).borderline)),
  };
}

// ===========================================================================
// Revascularisation decision on real AngioCAD studies (angio-decision-drills)
//
// AngioCAD records, per patient: age, sex, a diagnosis label (SA, UA, NSTEMI,
// STEMI), LVEF for some, diabetes, smoking, hypertension, dyslipidaemia,
// dominance, a Gensini score and 15 segment grades. Nothing else is shown and
// nothing is generated for a real patient (LAB_BUILD_PLAN section 7,
// pm-target#1): the plan drill's 'missing-facts' step counts the diseased
// vessels from the runs, then asks which of the facts the decision needs
// (src/content/decisions/revascStable.ts STABLE_FACTS) the dataset does not
// record. The SYNTAX drill (src/ui/angio/syntax.ts) marks lesions on the same
// studies.
// ===========================================================================

/**
 * AngioCAD studies for the stable decision drills: practice patients with segment grades and runs whose
 * diagnosis label is stable angina ('SA'), since the algorithm is the stable one. Dominance is needed for
 * the SYNTAX drill and is checked there. A study whose grades are all normal but whose Gensini score is
 * above 0 is left out: a Gensini score above 0 needs at least one graded lesion, so its grades cannot serve
 * as the answer key (some stable-angina studies in the dataset itself are like this).
 */
export function revascStudies(patients: readonly LibPatient[]): LibPatient[] {
  return patients.filter(
    (p) =>
      p.dataset === "AngioCAD" &&
      p.indication === "SA" &&
      p.runs.length > 0 &&
      !!p.segments &&
      Object.keys(p.segments).length > 0 &&
      !gradesContradictGensini(p)
  );
}

/** The segment grades are all normal ('NL') yet the dataset's Gensini score is above 0. */
export function gradesContradictGensini(p: LibPatient): boolean {
  return !!p.segments && Object.values(p.segments).every((g) => g === "NL") && (p.gensini ?? 0) > 0;
}

/** AngioCAD's diagnosis labels in words (the dataset's own categories). */
const ANGIOCAD_LABEL: Record<string, string> = { SA: "stable angina", UA: "unstable angina", NSTEMI: "NSTEMI", STEMI: "STEMI" };

/** One field the dataset records for a patient, as the drill shows it. */
export interface DatasetField {
  id: string;
  label: string;
  value: string;
}

/**
 * The dataset's own fields for a patient, before the reveal: demographics, the diagnosis label, LVEF when
 * recorded, the risk-factor flags and dominance. The segment grades and the Gensini score are the answer to the
 * vessel count and are shown only after it.
 */
export function angioCadFields(p: LibPatient): DatasetField[] {
  const yn = (b?: boolean) => (b === undefined ? "not recorded" : b ? "yes" : "no");
  return [
    { id: "age", label: "Age", value: p.age ? `${p.age} years` : "not recorded" },
    { id: "sex", label: "Sex", value: p.sex === "M" ? "male" : p.sex === "F" ? "female" : "not recorded" },
    { id: "indication", label: "Diagnosis (dataset label)", value: p.indication ? ANGIOCAD_LABEL[p.indication] ?? p.indication : "not recorded" },
    { id: "lvef", label: "LVEF", value: p.lvef ?? "not recorded" },
    { id: "diabetes", label: "Diabetes", value: yn(p.diabetes) },
    { id: "hypertension", label: "Hypertension", value: yn(p.hypertension) },
    { id: "dyslipidaemia", label: "Dyslipidaemia", value: yn(p.dyslipidaemia) },
    { id: "smoker", label: "Smoker", value: yn(p.smoker) },
    { id: "dominance", label: "Dominance", value: p.dominance ?? "not recorded" },
  ];
}

/**
 * The extent of disease from the AngioCAD grades: the arteries (LAD with its diagonals, circumflex with the
 * obtuse marginal, RCA, and the PDA and posterolateral branch with the dominant artery) with a segment graded
 * 51% or more, and the left main. The band 51-75 and above is a stenosis over 50% (the threshold of Brilakis's
 * prognostic table in pm-target-ccs-why); 26-50 is not.
 */
export function angioCadExtent(p: Pick<LibPatient, "segments" | "dominance">): { vessels: 0 | 1 | 2 | 3; arteries: Artery[]; leftMain: boolean; proximalLad: boolean } {
  const dom = p.dominance === "left" ? "left" : "right";
  const arteries = new Set<Artery>();
  let leftMain = false;
  for (const s of ANGIOCAD_SEGMENTS) {
    if (angioCadLesionClass(p.segments?.[s]) !== "lesion") continue;
    const v = segmentVessel(s, dom);
    if (v === "LM") leftMain = true;
    else arteries.add(v);
  }
  const list = (["LAD", "LCx", "RCA"] as const).filter((a) => arteries.has(a));
  return { vessels: list.length as 0 | 1 | 2 | 3, arteries: list, leftMain, proximalLad: angioCadLesionClass(p.segments?.["Prox LAD"]) === "lesion" };
}

/**
 * The decision's facts the dataset records for this patient (the rest are missing): the extent and the
 * complexity from the runs and grades, diabetes from its flag, and LV function when LVEF is recorded.
 * Symptoms are not recorded: the diagnosis label names a category, not the patient's symptoms now or how
 * limiting they are.
 */
export function recordedFacts(p: LibPatient): StableFact[] {
  const out: StableFact[] = ["extent", "complexity"];
  if (p.diabetes !== undefined) out.push("diabetes");
  if (p.lvef) out.push("lv-function");
  return out;
}

/** The facts the learner would still need (STABLE_FACTS less what the dataset records). */
export function missingFacts(p: LibPatient): StableFact[] {
  const have = new Set(recordedFacts(p));
  return STABLE_FACTS.map((f) => f.id).filter((id) => !have.has(id));
}

export interface MissingFactsScore {
  /** per fact: missing in the dataset, chosen by the learner, and whether the choice is right */
  rows: { id: StableFact; label: string; missing: boolean; chosen: boolean; correct: boolean }[];
  correct: number;
  total: number;
}

/** Score the facts a learner says are missing against the dataset (every fact counts once). */
export function scoreMissingFacts(p: LibPatient, chosen: Iterable<string>): MissingFactsScore {
  const want = new Set<string>(missingFacts(p));
  const got = new Set(chosen);
  const rows = STABLE_FACTS.map((f) => {
    const missing = want.has(f.id);
    const isChosen = got.has(f.id);
    return { id: f.id, label: f.label, missing, chosen: isChosen, correct: missing === isChosen };
  });
  return { rows, correct: rows.filter((r) => r.correct).length, total: rows.length };
}

/** Studies per set in the decision drills (MODEL PARAMETER: a set of about 10 minutes). */
export const REVASC_SET_SIZE = 5;

/** A set of studies for a decision drill, without repeats. */
export function revascSet(studies: readonly LibPatient[], r: () => number = Math.random, n = REVASC_SET_SIZE): LibPatient[] {
  return shuffled(studies, r).slice(0, n);
}
