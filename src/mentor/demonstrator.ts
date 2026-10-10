// ---------------------------------------------------------------------------
// "Show me" demonstrator and expert comparison.
//
// The model-predictive demonstrator (short-horizon search over hub actions
// with the rod solver as forward model) is deferred to wave 3, after S7's
// manoeuvre tests, as the plan critique recommends: with an uncalibrated
// forward model it would demonstrate the simulator, not the technique. The
// interface is fixed here so the attending drawer and the input layer can be
// wired now.
//
// The expert comparison is implemented: economy-of-motion measures and a
// dynamic-time-warping distance between a learner's and an expert's hub
// trajectories (insertion and torque), from recorded frames.
// ---------------------------------------------------------------------------

import type { EngagementKind } from "../types";
import { ENGAGEMENT_KINDS, type HostCommand, type ReplayHost } from "./types";
import { FrameTable, type ProcedureRecord } from "./telemetry";

export interface DemoGoal {
  /** engagement class to reach, e.g. "selective-lm" */
  target: EngagementKind;
  /** maximum demonstration length (s) */
  horizonS: number;
}

export interface DemoStep {
  /** seconds from the start of the demonstration */
  t: number;
  cmd: HostCommand;
  /** what the attending says as the ghost hand moves */
  caption: string;
}

export interface DemoPlan {
  status: "ok" | "deferred" | "unreachable";
  steps: DemoStep[];
  reason?: string;
}

export interface Demonstrator {
  plan<S>(host: ReplayHost<S>, goal: DemoGoal): DemoPlan;
}

/** The wave-1 demonstrator: always deferred, never guesses. */
export const deferredDemonstrator: Demonstrator = {
  plan() {
    return { status: "deferred", steps: [], reason: "Demonstration is not available yet. It needs a calibrated catheter model as its forward model." };
  },
};

// --- economy of motion ---------------------------------------------------------------

export interface Economy {
  insertionTravelMm: number;
  torqueTravelRad: number;
  torqueReversals: number;
  /** wall time from start to the first selective or coaxial class (s), if reached */
  timeToCoaxialS?: number;
}

const COAXIAL = new Set(["coaxial-lm", "selective-lm", "coaxial-rca", "selective-rca"].map((k) => ENGAGEMENT_KINDS.indexOf(k as EngagementKind)));

export function economyOf(frames: FrameTable, deadband = 0.05): Economy {
  let ins = 0;
  let tq = 0;
  let rev = 0;
  let acc = 0;
  let last = 0;
  let tCoax: number | undefined;
  const t0 = frames.length ? frames.value(0, "tWall") : 0;
  for (let i = 0; i < frames.length; i++) {
    if (tCoax === undefined && COAXIAL.has(frames.value(i, "eng"))) tCoax = frames.value(i, "tWall") - t0;
    if (i === 0) continue;
    ins += Math.abs(frames.value(i, "cmdInsertion") - frames.value(i - 1, "cmdInsertion"));
    const d = frames.value(i, "cmdTorque") - frames.value(i - 1, "cmdTorque");
    tq += Math.abs(d);
    acc += d;
    if (Math.abs(acc) > deadband) {
      const s = Math.sign(acc);
      if (last !== 0 && s !== last) rev++;
      last = s;
      acc = 0;
    }
  }
  return { insertionTravelMm: ins, torqueTravelRad: tq, torqueReversals: rev, timeToCoaxialS: tCoax };
}

/** Dynamic time warping distance between two multivariate sequences (mean per-step cost). */
export function dtwDistance(a: number[][], b: number[][], window?: number): number {
  const n = a.length;
  const m = b.length;
  if (!n || !m) return Infinity;
  const w = Math.max(window ?? Math.max(n, m), Math.abs(n - m));
  const INF = Number.POSITIVE_INFINITY;
  let prev = new Float64Array(m + 1).fill(INF);
  let cur = new Float64Array(m + 1).fill(INF);
  prev[0] = 0;
  let prevLen = new Int32Array(m + 1);
  let curLen = new Int32Array(m + 1);
  for (let i = 1; i <= n; i++) {
    cur.fill(INF);
    curLen.fill(0);
    const lo = Math.max(1, i - w);
    const hi = Math.min(m, i + w);
    for (let j = lo; j <= hi; j++) {
      let d = 0;
      const x = a[i - 1];
      const y = b[j - 1];
      for (let k = 0; k < x.length; k++) d += (x[k] - y[k]) ** 2;
      d = Math.sqrt(d);
      let best = prev[j - 1];
      let len = prevLen[j - 1];
      if (prev[j] < best) {
        best = prev[j];
        len = prevLen[j];
      }
      if (cur[j - 1] < best) {
        best = cur[j - 1];
        len = curLen[j - 1];
      }
      cur[j] = d + best;
      curLen[j] = len + 1;
    }
    [prev, cur] = [cur, prev];
    [prevLen, curLen] = [curLen, prevLen];
  }
  return prev[m] / Math.max(1, prevLen[m]);
}

/** Hub trajectory (cmdInsertion mm, cmdTorque rad scaled to mm-equivalent) from a record. */
export function hubTrajectory(r: ProcedureRecord, torqueScaleMm = 5): number[][] {
  const f = FrameTable.from(r.frames);
  const out: number[][] = [];
  for (let i = 0; i < f.length; i++) out.push([f.value(i, "cmdInsertion"), f.value(i, "cmdTorque") * torqueScaleMm]);
  return out;
}

export interface ExpertComparison {
  learner: Economy;
  expert: Economy;
  /** learner / expert travel ratios (1 = as economical as the expert) */
  insertionRatio: number;
  torqueRatio: number;
  dtw: number;
}

export function compareToExpert(learner: ProcedureRecord, expert: ProcedureRecord): ExpertComparison {
  const lf = FrameTable.from(learner.frames);
  const ef = FrameTable.from(expert.frames);
  const l = economyOf(lf);
  const e = economyOf(ef);
  return {
    learner: l,
    expert: e,
    insertionRatio: e.insertionTravelMm > 0 ? l.insertionTravelMm / e.insertionTravelMm : Infinity,
    torqueRatio: e.torqueTravelRad > 0 ? l.torqueTravelRad / e.torqueTravelRad : Infinity,
    dtw: dtwDistance(hubTrajectory(learner), hubTrajectory(expert), 200),
  };
}
