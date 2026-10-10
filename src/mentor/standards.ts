// ---------------------------------------------------------------------------
// Passing standards. Every threshold carries its source, and the debrief shows
// it next to the value. Three kinds of source:
//   - literature: a criterion quoted from a paper that was opened (facts/S11.md)
//   - expert calibration: a local benchmark built from trainer runs in this simulator
//   - simulator default: a model parameter, named as such, to be replaced by calibration
// Progression decisions use the per-metric standards; the composite score is
// formative only and is never shown during a case.
// ---------------------------------------------------------------------------

import { metricValue, type Metrics } from "./metrics";

export type StandardOp = "<" | "<=" | ">" | ">=" | "==";

export interface StandardSource {
  id: string;
  kind: "literature" | "expert-calibration" | "simulator-default";
  /** short label shown next to the threshold */
  label: string;
  citation?: string;
  url?: string;
}

export interface PassingStandard {
  id: string;
  /** EPA or task this standard applies to */
  epa: string;
  /** dotted metric path, e.g. "contrastMl" or "criticalErrors" (arrays count their length) */
  metric: string;
  op: StandardOp;
  value: number;
  /** display name and unit */
  label: string;
  unit?: string;
  source: StandardSource;
  /** failing it fails the attempt regardless of the rest */
  critical?: boolean;
}

export const SOURCES = {
  jensen2016: {
    id: "jensen-2016",
    kind: "literature",
    label: "Jensen 2016 (EuroIntervention RCT criterion)",
    citation: "Jensen UJ, Jensen J, Ahlberg G, Tornvall P. Virtual reality training in coronary angiography and its transfer effect to real-life catheterisation lab. EuroIntervention. 2016;11(13):1434-1441. doi:10.4244/EIJY15M06_05",
    url: "https://eurointervention.pcronline.com/article/virtual-reality-training-in-coronary-angiography-and-its-transfer-effect-to-real-life-catheterisation-lab",
  },
  simDefault: {
    id: "simulator-default",
    kind: "simulator-default",
    label: "Simulator default (model parameter, awaiting expert calibration)",
  },
} satisfies Record<string, StandardSource>;

/**
 * Full diagnostic study (both coronaries). Jensen 2016 required "a complete CA with
 * eight standardised cine loops in less than ten minutes, fluoroscopy time less than
 * three minutes and using less than 50 ml of contrast". Zero critical errors and
 * full segment coverage are simulator defaults added on top.
 */
export const DIAGNOSTIC_FULL_STUDY: PassingStandard[] = [
  { id: "diag-loops", epa: "diag-study", metric: "standardisedLoops", op: ">=", value: 8, label: "Standardised cine loops", source: SOURCES.jensen2016 },
  { id: "diag-time", epa: "diag-study", metric: "procTimeS", op: "<", value: 600, label: "Procedure time", unit: "s", source: SOURCES.jensen2016 },
  { id: "diag-fluoro", epa: "diag-study", metric: "fluoroS", op: "<", value: 180, label: "Fluoroscopy time", unit: "s", source: SOURCES.jensen2016 },
  { id: "diag-contrast", epa: "diag-study", metric: "contrastMl", op: "<", value: 50, label: "Contrast", unit: "mL", source: SOURCES.jensen2016 },
  { id: "diag-critical", epa: "diag-study", metric: "criticalErrors", op: "==", value: 0, label: "Critical errors", source: SOURCES.simDefault, critical: true },
  { id: "diag-coverage", epa: "diag-study", metric: "viewCoverage.missing", op: "==", value: 0, label: "Required segments not seen in two clean views", source: SOURCES.simDefault },
];

/** Single-coronary engagement task: no literature criterion found; simulator defaults. */
export const ENGAGEMENT_TASK: PassingStandard[] = [
  { id: "eng-critical", epa: "engage", metric: "criticalErrors", op: "==", value: 0, label: "Critical errors", source: SOURCES.simDefault, critical: true },
  { id: "eng-damped", epa: "engage", metric: "injectWhileDamped", op: "==", value: 0, label: "Injections on a damped trace", source: SOURCES.simDefault, critical: true },
  { id: "eng-lv", epa: "engage", metric: "lvEntries", op: "==", value: 0, label: "LV entries", source: SOURCES.simDefault },
  { id: "eng-aspirate", epa: "engage", metric: "aspirateCompliance", op: ">=", value: 1, label: "Injections with a clean aspirate", source: SOURCES.simDefault },
];

/** PCI: no literature passing criterion found; simulator defaults from the existing debrief checks. */
export const PCI_STANDARD: PassingStandard[] = [
  { id: "pci-critical", epa: "pci", metric: "criticalErrors", op: "==", value: 0, label: "Critical errors", source: SOURCES.simDefault, critical: true },
  { id: "pci-residual", epa: "pci", metric: "residualDS", op: "<", value: 20, label: "Residual stenosis", unit: "%", source: SOURCES.simDefault },
  { id: "pci-positioning", epa: "pci", metric: "deployWithoutPositioningRun", op: "==", value: 0, label: "Stents deployed without a positioning run", source: SOURCES.simDefault },
  { id: "pci-oversize", epa: "pci", metric: "oversizedOutsideLesion", op: "==", value: 0, label: "Oversized inflations outside the lesion", source: SOURCES.simDefault },
  { id: "pci-beyond-wire", epa: "pci", metric: "deviceBeyondWire", op: "==", value: 0, label: "Device advanced beyond the wire", source: SOURCES.simDefault, critical: true },
];

export interface StandardResult {
  standard: PassingStandard;
  value: number | undefined;
  pass: boolean;
  /** not measurable for this attempt (metric missing) */
  missing: boolean;
}

export function compare(v: number, op: StandardOp, ref: number): boolean {
  switch (op) {
    case "<":
      return v < ref;
    case "<=":
      return v <= ref;
    case ">":
      return v > ref;
    case ">=":
      return v >= ref;
    case "==":
      return Math.abs(v - ref) < 1e-9;
  }
}

export function evaluateStandards(m: Metrics, standards: PassingStandard[]): { results: StandardResult[]; passed: boolean; criticalFailed: boolean } {
  const results = standards.map((s) => {
    const v = metricValue(m, s.metric);
    return { standard: s, value: v, missing: v === undefined, pass: v !== undefined && compare(v, s.op, s.value) };
  });
  const criticalFailed = results.some((r) => r.standard.critical && !r.missing && !r.pass);
  const passed = !criticalFailed && results.every((r) => r.missing || r.pass);
  return { results, passed, criticalFailed };
}

/** Plain text of a threshold, e.g. "< 600 s (Jensen 2016 ...)". */
export function describeStandard(s: PassingStandard): string {
  return `${s.op} ${s.value}${s.unit ? " " + s.unit : ""}`;
}

/**
 * Formative composite, 0..100: the fraction of standards met. Shown only in the
 * debrief, with the per-metric table, and never used for progression.
 */
export function formativeScore(results: StandardResult[]): number {
  const scored = results.filter((r) => !r.missing);
  if (!scored.length) return 0;
  return Math.round((100 * scored.filter((r) => r.pass).length) / scored.length);
}

// --- Expert calibration -------------------------------------------------------------

export interface BenchmarkMetric {
  metric: string;
  n: number;
  mean: number;
  sd: number;
  median: number;
  min: number;
  max: number;
}

export interface Benchmark {
  kind: "cathmaster-benchmark";
  version: 1;
  epa: string;
  createdAt: number;
  /** who ran the benchmark cases (free text, local only) */
  createdBy?: string;
  /** case ids the experts ran */
  cases: string[];
  metrics: BenchmarkMetric[];
  /**
   * How the standard is derived from the expert distribution. "mean" uses the expert mean
   * as the proficiency level; "mean+sd" allows one SD of slack. A local choice, shown in the UI.
   */
  rule: "mean" | "mean+sd" | "max";
}

function stats(xs: number[]): Omit<BenchmarkMetric, "metric"> {
  const n = xs.length;
  const s = xs.slice().sort((a, b) => a - b);
  const mean = s.reduce((a, b) => a + b, 0) / Math.max(1, n);
  const sd = n > 1 ? Math.sqrt(s.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
  const median = n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0;
  return { n, mean, sd, median, min: s[0] ?? 0, max: s[n - 1] ?? 0 };
}

/** Build a benchmark from trainer runs (Expert calibration mode). */
export function buildBenchmark(epa: string, runs: { caseId: string; metrics: Metrics }[], metrics: string[], rule: Benchmark["rule"] = "mean", createdBy?: string, now = Date.now()): Benchmark {
  return {
    kind: "cathmaster-benchmark",
    version: 1,
    epa,
    createdAt: now,
    createdBy,
    cases: [...new Set(runs.map((r) => r.caseId))],
    metrics: metrics.map((metric) => {
      const xs = runs.map((r) => metricValue(r.metrics, metric)).filter((v): v is number => v !== undefined);
      return { metric, ...stats(xs) };
    }),
    rule,
  };
}

/**
 * Turn a benchmark into passing standards ("lower is better" for every metric unless listed).
 * The zero-critical-errors standard is always kept, marked critical and labelled as a
 * simulator default, unless the benchmark itself measures criticalErrors: an expert
 * distribution must not license a safety error.
 */
export function standardsFromBenchmark(b: Benchmark, higherIsBetter: string[] = ["standardisedLoops", "aspirateCompliance", "pressureCheckCompliance"], labels: Record<string, string> = {}): PassingStandard[] {
  const kept = b.metrics.filter((m) => m.n > 0);
  const nLabel = kept.length ? Math.min(...kept.map((m) => m.n)) : 0;
  const src: StandardSource = { id: `expert-${b.createdAt}`, kind: "expert-calibration", label: `Local expert benchmark (n = ${nLabel}, ${b.rule})` };
  const out: PassingStandard[] = kept.map((m) => {
    const hi = higherIsBetter.includes(m.metric);
    const slack = b.rule === "mean+sd" ? m.sd : 0;
    const value = b.rule === "max" ? (hi ? m.min : m.max) : hi ? m.mean - slack : m.mean + slack;
    const st: PassingStandard = { id: `bench-${m.metric}`, epa: b.epa, metric: m.metric, op: hi ? ">=" : "<=", value: Math.round(value * 100) / 100, label: labels[m.metric] ?? m.metric, source: src };
    if (m.metric === "criticalErrors") st.critical = true;
    return st;
  });
  if (!out.some((s) => s.metric === "criticalErrors"))
    out.push({ id: `bench-critical`, epa: b.epa, metric: "criticalErrors", op: "==", value: 0, label: labels.criticalErrors ?? "Critical errors", source: SOURCES.simDefault, critical: true });
  return out;
}

export function exportBenchmark(b: Benchmark): string {
  return JSON.stringify(b, null, 2);
}

/** Parse and validate an imported benchmark. Throws with a readable message. */
export function importBenchmark(json: string): Benchmark {
  let v: unknown;
  try {
    v = JSON.parse(json);
  } catch {
    throw new Error("The file is not valid JSON.");
  }
  const b = v as Partial<Benchmark>;
  if (!b || b.kind !== "cathmaster-benchmark" || b.version !== 1) throw new Error("This is not a benchmark file from this simulator.");
  if (typeof b.epa !== "string" || !Array.isArray(b.metrics)) throw new Error("The benchmark is missing its EPA or metrics.");
  if (!["mean", "mean+sd", "max"].includes(String(b.rule))) throw new Error("Unknown benchmark rule.");
  if (typeof b.createdAt !== "number" || !Number.isFinite(b.createdAt)) throw new Error("The benchmark is missing its creation time.");
  if (b.cases !== undefined && (!Array.isArray(b.cases) || b.cases.some((c) => typeof c !== "string"))) throw new Error("The benchmark case list is malformed.");
  const fin = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
  for (const m of b.metrics as unknown[]) {
    const e = m as Partial<BenchmarkMetric> | null;
    const bad = (why: string) => new Error(`Bad metric entry (${why}): ${JSON.stringify(m).slice(0, 80)}`);
    if (!e || typeof e !== "object" || typeof e.metric !== "string") throw bad("no metric name");
    if (!fin(e.n) || e.n < 0 || !Number.isInteger(e.n)) throw bad("n must be a whole number");
    if (e.n === 0) continue; // dropped when standards are built
    if (!fin(e.mean)) throw bad("mean must be a number");
    // the fields the chosen rule reads must be usable, or the standard would be NaN and fail silently
    if (b.rule === "mean+sd" && (!fin(e.sd) || e.sd < 0)) throw bad("the mean+sd rule needs a non-negative sd");
    if (b.rule === "max" && (!fin(e.min) || !fin(e.max) || e.min > e.max)) throw bad("the max rule needs min and max");
    for (const k of ["sd", "median", "min", "max"] as const) if (e[k] !== undefined && !fin(e[k])) throw bad(`${k} must be a number`);
  }
  return { ...(b as Benchmark), cases: b.cases ?? [] };
}
