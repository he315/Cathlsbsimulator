// ---------------------------------------------------------------------------
// Catheter rest-shape calibration against real silhouettes (traces.json).
//
//   CALIBRATE=eval npx vite-node src/physics/calibration/calibrate.ts      score the current catalogue
//   CALIBRATE=fit  npx vite-node src/physics/calibration/calibrate.ts -- jl|jr   coordinate search on a family's shape parameters
//   CALIBRATE=holdout npx vite-node src/physics/calibration/calibrate.ts    root orientation fitted on half the patients, scored on the other half
//
// Left runs (LCA) are scored against the Judkins left family, each size in the
// root it is made for (JL3.5 small, JL4 normal, JL5 dilated: Oxford notes,
// facts S7 #14); right runs (RCA) against the Judkins right 4 in the normal
// root. The catheter actually used in a real run is not recorded, so each run
// takes the best of the family's engaged states (shapeError.ts).
// ---------------------------------------------------------------------------

import type { TraceFile, RealTrace } from "./select";
import { engagedShapes, scoreTraces, summary, withLiveGeometry, NO_ORIENTATION, type RootOrientation, type SimShape, type TraceScore } from "./shapeError";
import { SHAPE_PARAMS } from "../catheterShapes";
import type { RootSize } from "../../types";

// traces.json holds catheter centrelines traced on real frames, so it lives with the data, not in the
// repository (datasets/MANIFEST.json). The optional glob keeps this module and its test building without it;
// copy the file here from the data folder to run the calibration.
const TRACE_FILES = import.meta.glob<{ default: TraceFile }>("./traces.json", { eager: true });
const traceFile: TraceFile | null = TRACE_FILES["./traces.json"]?.default ?? null;
/** Whether the real-silhouette traces are present (they are absent in a clone without the data). */
export const HAVE_TRACES = traceFile !== null;
export const TRACES: RealTrace[] = traceFile ? traceFile.traces : [];

export const LEFT_FAMILY: { catheter: string; root: RootSize }[] = [
  { catheter: "JL3.5", root: "small" },
  { catheter: "JL4", root: "normal" },
  { catheter: "JL5", root: "dilated" },
];
export const RIGHT_FAMILY: { catheter: string; root: RootSize }[] = [{ catheter: "JR4", root: "normal" }];

export function familyShapes(side: "left" | "right"): SimShape[] {
  const fam = side === "left" ? LEFT_FAMILY : RIGHT_FAMILY;
  return withLiveGeometry(() => fam.flatMap((m) => engagedShapes(m.catheter, m.root, side)));
}

/**
 * Orientation of the model's aortic frame that the library silhouettes call for (library-measured:
 * the joint fit below, CALIBRATE=fit; see docs/realism/wave2/I3.md). Used only for the comparison;
 * the renderer's placement of the aortic frame is the anatomy owners' (S3, S4) decision.
 */
export const FITTED_ORIENTATION: RootOrientation = { zDeg: 10, xDeg: 40 };

export function evaluate(
  side: "left" | "right",
  W = 60,
  o: RootOrientation = FITTED_ORIENTATION,
  traces: RealTrace[] = TRACES,
  shapes: SimShape[] = familyShapes(side)
): { scores: TraceScore[]; shapes: number; sum: ReturnType<typeof summary> } {
  const tr = traces.filter((t) => t.artery === (side === "left" ? "LCA" : "RCA"));
  const scores = scoreTraces(tr, shapes, W, o);
  return { scores, shapes: shapes.length, sum: summary(scores) };
}

/** Study of a library run id, e.g. "cd-01030-LCA-2" -> "01030". The library has no separate patient identifier; each study is taken as one patient. */
export function studyOf(id: string): string {
  return id.split("-")[1] ?? id;
}

/**
 * Two-fold split by patient: the studies, in numeric order, are dealt alternately to the two halves,
 * so no patient has runs on both sides of the split.
 */
export function splitByPatient(traces: RealTrace[]): [RealTrace[], RealTrace[]] {
  const studies = [...new Set(traces.map((t) => studyOf(t.id)))].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
  const fold = new Map(studies.map((s, i) => [s, i % 2]));
  return [traces.filter((t) => fold.get(studyOf(t.id)) === 0), traces.filter((t) => fold.get(studyOf(t.id)) === 1)];
}

export interface OrientationGrid {
  zDeg: number[];
  xDeg: number[];
}

/** Grid of the held-out check: 5 degree steps over -10..30 (z) and 0..60 (x), wider than the fitted value on every side. */
export const HOLDOUT_GRID: OrientationGrid = { zDeg: [-10, -5, 0, 5, 10, 15, 20, 25, 30], xDeg: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60] };

type Summary = ReturnType<typeof summary>;

export interface HeldOutResult {
  /** per fold: orientation fitted on the other half, and the scores of this half at it */
  folds: { train: number; test: number; fitted: RootOrientation; onBoundary: boolean; left: Summary; right: Summary }[];
  /** every run scored at the orientation fitted on the half it is not in */
  heldOut: { left: Summary; right: Summary };
  /** the same runs at the renderer's orientation (vertical root) and at FITTED_ORIENTATION (fitted on all runs) */
  vertical: { left: Summary; right: Summary };
  inSample: { left: Summary; right: Summary };
}

/**
 * Held-out check of the root orientation: fit it on one half of the patients (same cost as the joint
 * fit, CALIBRATE=fit: median + 0.1 x mean of the per-run errors, both arteries) over `grid`, score the
 * other half at it, and swap. Shapes are fixed (the catalogue's engaged states).
 */
export function heldOutOrientation(L: SimShape[], R: SimShape[], grid: OrientationGrid = HOLDOUT_GRID, W = 60, traces: RealTrace[] = TRACES): HeldOutResult {
  const cost = (s: Summary) => s.median + 0.1 * s.mean;
  const key = (o: RootOrientation) => `${o.zDeg},${o.xDeg}`;
  const orients: RootOrientation[] = [];
  for (const z of grid.zDeg) for (const x of grid.xDeg) orients.push({ zDeg: z, xDeg: x });
  for (const o of [NO_ORIENTATION, FITTED_ORIENTATION]) if (!orients.some((p) => key(p) === key(o))) orients.push(o);
  // every run's score at every orientation, computed once
  const byKey = new Map<string, Map<string, TraceScore>>();
  const left = traces.filter((t) => t.artery === "LCA"), right = traces.filter((t) => t.artery === "RCA");
  for (const o of orients) {
    const m = new Map<string, TraceScore>();
    for (const s of scoreTraces(left, L, W, o)) m.set(s.id, s);
    for (const s of scoreTraces(right, R, W, o)) m.set(s.id, s);
    byKey.set(key(o), m);
  }
  const at = (o: RootOrientation, ts: RealTrace[]) => ts.map((t) => byKey.get(key(o))!.get(t.id)!);
  const sides = (o: RootOrientation, ts: RealTrace[]) => ({
    left: summary(at(o, ts.filter((t) => t.artery === "LCA"))),
    right: summary(at(o, ts.filter((t) => t.artery === "RCA"))),
  });
  const halves = splitByPatient(traces);
  const folds: HeldOutResult["folds"] = [];
  const pooled: TraceScore[] = [];
  for (const k of [0, 1]) {
    const train = halves[1 - k], test = halves[k];
    let best = { c: Infinity, o: NO_ORIENTATION };
    for (const o of orients.slice(0, grid.zDeg.length * grid.xDeg.length)) {
      const s = sides(o, train);
      const c = cost(s.left) + cost(s.right);
      if (c < best.c) best = { c, o };
    }
    const onBoundary =
      best.o.zDeg === grid.zDeg[0] || best.o.zDeg === grid.zDeg[grid.zDeg.length - 1] || best.o.xDeg === grid.xDeg[0] || best.o.xDeg === grid.xDeg[grid.xDeg.length - 1];
    folds.push({ train: train.length, test: test.length, fitted: best.o, onBoundary, ...sides(best.o, test) });
    pooled.push(...at(best.o, test));
  }
  const ids = new Set(traces.filter((t) => t.artery === "LCA").map((t) => t.id));
  return {
    folds,
    heldOut: { left: summary(pooled.filter((s) => ids.has(s.id))), right: summary(pooled.filter((s) => !ids.has(s.id))) },
    vertical: sides(NO_ORIENTATION, traces),
    inSample: sides(FITTED_ORIENTATION, traces),
  };
}

function fmt(s: ReturnType<typeof summary>): string {
  return `n ${s.n}, median ${s.median.toFixed(2)} mm, IQR ${s.p25.toFixed(2)}-${s.p75.toFixed(2)}, mean ${s.mean.toFixed(2)}, within 2 mm ${(100 * s.within2).toFixed(0)}%`;
}

const proc = (globalThis as { process?: { argv?: string[]; env?: Record<string, string | undefined> } }).process;
const mode = proc?.env?.CALIBRATE;
if (mode === "eval") {
  for (const side of ["left", "right"] as const) {
    const shapes = familyShapes(side);
    for (const [W, o] of [[40, FITTED_ORIENTATION], [60, FITTED_ORIENTATION], [60, NO_ORIENTATION]] as [number, RootOrientation][]) {
      const t0 = performance.now();
      const r = evaluate(side, W, o, TRACES, shapes);
      const by: Record<string, number> = {};
      for (const s of r.scores) by[s.catheter] = (by[s.catheter] ?? 0) + 1;
      console.log(`${side} W=${W} mm, root orientation ${JSON.stringify(o)}: ${r.shapes} engaged states; ${fmt(r.sum)}; best match ${JSON.stringify(by)} (${((performance.now() - t0) / 1000).toFixed(1)} s)`);
    }
  }
}

if (mode === "fit") {
  // Alternating search: (a) the root orientation on a grid, both arteries, shapes fixed; (b) a coordinate
  // search on each family's shape parameters at that orientation. Cost per artery: median + 0.1 x mean
  // of the per-run errors over the distal 60 mm (the median is robust to runs made with another catheter).
  const cost = (s: ReturnType<typeof summary>) => s.median + 0.1 * s.mean;
  const o: RootOrientation = { ...FITTED_ORIENTATION };
  const rounds = Number(proc?.env?.ROUNDS ?? 2);
  const fams = ((proc?.argv ?? []).slice(2).filter((a) => a !== "--" && !/calibrate\.ts$/.test(a))[0] ?? "jl,jr").split(",") as (keyof typeof SHAPE_PARAMS)[];
  for (let round = 0; round < rounds; round++) {
    // (a) orientation
    const L = familyShapes("left"), R = familyShapes("right");
    let best = { c: Infinity, z: o.zDeg, x: o.xDeg };
    for (let z = o.zDeg - 10; z <= o.zDeg + 10; z += 5) {
      for (let x = o.xDeg - 10; x <= o.xDeg + 10; x += 5) {
        const oo = { zDeg: z, xDeg: x };
        const c = cost(evaluate("left", 60, oo, TRACES, L).sum) + cost(evaluate("right", 60, oo, TRACES, R).sum);
        if (c < best.c) best = { c, z, x };
      }
    }
    o.zDeg = best.z;
    o.xDeg = best.x;
    console.log(`round ${round}: orientation ${JSON.stringify(o)} cost ${best.c.toFixed(3)}`);
    // (b) shapes
    for (const fam of fams) {
      const side = fam === "jl" ? "left" : "right";
      const P = SHAPE_PARAMS[fam] as Record<string, number>;
      const keys = Object.keys(P);
      const step: Record<string, number> = {};
      for (const k of keys) step[k] = (Math.abs(P[k]) * 0.15 || 1) * Math.pow(0.6, round);
      let cur = evaluate(side, 60, o);
      let curC = cost(cur.sum);
      console.log(`  ${fam} start ${JSON.stringify(P)}: ${fmt(cur.sum)}`);
      for (const k of keys) {
        for (const dir of [1, -1]) {
          let improved = false;
          for (let rep = 0; rep < 4; rep++) {
            const old = P[k];
            P[k] = old + dir * step[k];
            const r = evaluate(side, 60, o);
            const c = cost(r.sum);
            if (c < curC - 1e-3) {
              cur = r;
              curC = c;
              improved = true;
              console.log(`    ${k} ${old.toFixed(2)} -> ${P[k].toFixed(2)}: ${fmt(r.sum)}`);
            } else {
              P[k] = old;
              break;
            }
          }
          if (improved) break;
        }
      }
      console.log(`  ${fam} end ${JSON.stringify(P)}: ${fmt(cur.sum)}`);
    }
  }
}

if (mode === "holdout") {
  const t0 = performance.now();
  const L = familyShapes("left"), R = familyShapes("right");
  const coarse = proc?.env?.GRID === "coarse";
  const r = heldOutOrientation(L, R, coarse ? { zDeg: [0, 10, 20], xDeg: [0, 20, 40, 60] } : HOLDOUT_GRID);
  for (const [i, f] of r.folds.entries()) {
    console.log(`fold ${i}: fitted on ${f.train} runs -> ${JSON.stringify(f.fitted)}${f.onBoundary ? " (on the grid boundary)" : ""}; held-out ${f.test} runs: left ${fmt(f.left)}; right ${fmt(f.right)}`);
  }
  console.log(`held-out, pooled: left ${fmt(r.heldOut.left)}; right ${fmt(r.heldOut.right)}`);
  console.log(`in-sample (FITTED_ORIENTATION): left ${fmt(r.inSample.left)}; right ${fmt(r.inSample.right)}`);
  console.log(`vertical root (renderer): left ${fmt(r.vertical.left)}; right ${fmt(r.vertical.right)}`);
  console.log(`${((performance.now() - t0) / 1000).toFixed(0)} s`);
}
