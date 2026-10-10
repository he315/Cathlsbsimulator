// ---------------------------------------------------------------------------
// Builds traces.json, the real catheter silhouettes the shape calibration and
// its test use, from the raw tracer output (trace.ts) and the visual QC
// decisions (qc-decisions.json):
//
//   TRACE_SELECT=1 npx vite-node src/physics/calibration/select.ts -- raw-lca.json raw-rca.json
//
// Each accepted trace is converted to mm at the library's 6F scale
// (0.3077 mm/px: median catheter-shaft width 6.5 px over 1,072 runs taken as
// 2.0 mm; docs/realism/facts/S0.md), with image y flipped (x right, y up),
// truncated to the distal 100 mm and resampled at 1 mm, tip first. The per-
// run outer width in px is kept for the scale-sensitivity check.
// ---------------------------------------------------------------------------

import { nodeMods, repoRoot } from "./image";
import { resamplePolyline } from "./ridge";
import type { RawTrace } from "./trace";

/** Library 6F scale (S0 facts: 2.0 mm / 6.5 px). */
export const MM_PER_PX = 2.0 / 6.5;

export interface RealTrace {
  id: string;
  artery: "LCA" | "RCA";
  /** DICOM positioner primary (+LAO) and secondary (+cranial) angles, degrees */
  primary: number;
  secondary: number;
  /** outer catheter width in px measured along the trace (per-run scale check) */
  widthPx: number | null;
  /** tip first, mm, x right, y up, 1 mm spacing, distal 100 mm at most */
  mm: [number, number][];
}

export interface TraceFile {
  scaleMmPerPx: number;
  source: string;
  qc: string;
  traces: RealTrace[];
}

export function toRealTrace(t: RawTrace, maxMm = 100): RealTrace {
  const mm = t.px.map(([x, y]) => [x * MM_PER_PX, -y * MM_PER_PX] as [number, number]);
  const r = resamplePolyline(mm, 1).slice(0, maxMm + 1);
  return {
    id: t.id,
    artery: t.artery,
    primary: Math.round(t.primary * 100) / 100,
    secondary: Math.round(t.secondary * 100) / 100,
    widthPx: t.widthPx === null ? null : Math.round(t.widthPx * 100) / 100,
    mm: r.map(([x, y]) => [Math.round(x * 100) / 100, Math.round(y * 100) / 100] as [number, number]),
  };
}

const proc = (globalThis as { process?: { argv?: string[]; env?: Record<string, string | undefined> } }).process;
if (proc?.env?.TRACE_SELECT === "1") {
  const { fs, path } = await nodeMods();
  const args = (proc.argv ?? []).slice(2).filter((a) => a !== "--" && !/select\.ts$/.test(a));
  const dir = path.join(repoRoot(), "src/physics/calibration");
  const qc = JSON.parse(new TextDecoder().decode(fs.readFileSync(path.join(dir, "qc-decisions.json")))) as {
    method: string;
    LCA: { accepted: string[] };
    RCA: { accepted: string[] };
  };
  const accepted = new Set([...qc.LCA.accepted, ...qc.RCA.accepted]);
  const raws: RawTrace[] = [];
  for (const f of args) raws.push(...(JSON.parse(new TextDecoder().decode(fs.readFileSync(f))) as RawTrace[]));
  const traces = raws.filter((r) => accepted.has(r.id)).map((r) => toRealTrace(r));
  const file: TraceFile = {
    scaleMmPerPx: MM_PER_PX,
    source: "CoronaryDominance (Kruzhilov et al., Sci Data 2025, CC0), first frame of each run, datasets/library/dominance*/",
    qc: qc.method,
    traces,
  };
  fs.writeFileSync(path.join(dir, "traces.json"), JSON.stringify(file));
  console.log(`traces.json: ${traces.filter((t) => t.artery === "LCA").length} LCA, ${traces.filter((t) => t.artery === "RCA").length} RCA`);
}
