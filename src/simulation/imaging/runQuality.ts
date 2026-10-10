// ---------------------------------------------------------------------------
// Run quality (diag-injection-run-quality): what a hand injection did at the
// ostium and whether the cine run that filmed it can be read.
//
// Per injection (from the ostial mixing of its whole course, contrastTransport
// ostialSeries): the volume, the flow and the push, how long the artery was
// full, whether the jet streamed, whether the full artery spilled back into the
// aortic root (reflux), and how much missed the ostium. Per stored cine run:
// the push delay after the pedal, the frame rate, table motion, a change of
// field, the breath-hold, whether the run went on until the distal bed had
// filled, and for an intermediate lesion on the injected side the criteria of
// a run that angiography-derived FFR (QFR) can use: nitrate on board, frame
// rate, no panning and no zooming, a brisk injection, little foreshortening and
// no overlap at the lesion, and a second projection far enough from this one.
// A test puff (under TEST_PUFF_ML) is recorded with the tip's classification
// and is not judged as a run.
//
// Sources (module text):
//  - a vessel full for about 3 beats with reflux into the root, typically
//    5-10 mL left and 3-5 mL right; streaming (mixing of dark and light blood)
//    means the injection was too small or too slow (Oxford, pm-acquiring-cine,
//    src/content/manual/pci-manual/08-acquiring.ts:539, :570, :639, :654, :1808;
//    pm-interpreting-pitfalls, 09-interpreting.ts:608, :2026);
//  - pedal first, inject after 1-2 seconds (Oxford, 08-acquiring.ts:654);
//  - panning degrades the image of the segment being graded (Brilakis,
//    08-acquiring.ts:489, :544);
//  - QFR runs (FAVOR II Europe-Japan protocol, pm-physiology-derived,
//    src/content/manual/pci-manual/14-physiology.ts:1114-1121): intracoronary
//    nitroglycerin after the first projection, two projections with minimal
//    foreshortening and overlap, at least 12.5 frames per second, brisk
//    continuous injections, no zooming and no table movement;
//  - intermediate stenoses 40-90% (FAVOR III Europe, 14-physiology.ts:1142).
// Every other threshold is a MODEL PARAMETER (RUN_QUALITY below), listed in
// docs/realism/facts/pkg-diag-injection-run-quality.md.
//
// Pure functions; the diagnostic lab session (src/ui/sim/labSession.ts) feeds
// them and stores the result on the run (useSeriesStore StoredSeries.quality).
// ---------------------------------------------------------------------------

import type { CArm, Vec3 } from "../../types";
import type { InjectionTrace } from "../injection";
import type { OstialSeries } from "../../render/xray/contrastTransport";
import { cameraBasis } from "../projection";

/** Thresholds of the run analysis. */
export const RUN_QUALITY = {
  /** Oxford's target: the vessel full for about 3 beats (module text) */
  beatsMin: 3,
  /** strength entering the artery at or above which it counts as full (0..1). MODEL PARAMETER. */
  fullInlet: 0.8,
  /**
   * Contrast (full-strength equivalent, mL) spilled back from the full artery into the root at or above which the run
   * shows reflux. MODEL PARAMETER: the lab's 6 Fr diagnostic lumen at the hand's largest force (2.8 mL/s, facts I1.md)
   * exceeds the native flow only in systole, so a seated tip spills a few tenths of a millilitre over a 4-8 mL push
   * (measured values in docs/realism/facts/pkg-diag-injection-run-quality.md); a wedged tip (seal 0.9) spills less.
   */
  refluxMinMl: 0.1,
  /** mean mixing deficiency of the push at or above which the run streams (0..1). MODEL PARAMETER. */
  streamingIndex: 0.5,
  /** a push smaller than this is a test puff, not a run (mL). MODEL PARAMETER (the plan's value). */
  testPuffMl: 3,
  /** flow above which the syringe counts as pushing (mL/s). MODEL PARAMETER. */
  pushingMlS: 0.05,
  /** Oxford: inject after 1-2 seconds of pedal (s; module text) */
  pushDelayS: { min: 1, max: 2 },
  /** table speed during cine above which the run is panned (mm/s). MODEL PARAMETER. */
  panSpeedMmS: 5,
  /** table travel during cine above which the run is panned (mm). MODEL PARAMETER. */
  panTravelMm: 3,
  /** share of the run with the breath held below which the patient was breathing during it. MODEL PARAMETER. */
  breathHeldShare: 0.9,
  /** FAVOR II: at least 12.5 frames per second (module text) */
  qfrFps: 12.5,
  /** FAVOR III Europe's intermediate stenoses: 40-90% diameter (module text) */
  qfrLesionPct: { min: 40, max: 90 },
  /** the two QFR projections at least this far apart (degrees between the beam axes). MODEL PARAMETER (FAVOR II asks for minimal overlap and foreshortening, not an angle). */
  qfrPairDeg: 25,
  /** projected over true length of the lesion segment below which it is foreshortened (0..1). MODEL PARAMETER. */
  foreshorteningMin: 0.8,
  /** another vessel crossing the lesion's projection closer than this beyond the two radii overlaps it (mm). MODEL PARAMETER. */
  overlapMarginMm: 0.5,
  /** vessel points this close to the lesion in 3D are its own neighbourhood (a branch origin), not an overlap (mm). MODEL PARAMETER. */
  overlapNearMm: 6,
  /** epicardial dilation (the engine's nitrate effect, 0..1) at or above which nitrate is on board. MODEL PARAMETER. */
  nitrateDilation: 0.02,
} as const;

// ---------------------------------------------------------------------------
// One injection
// ---------------------------------------------------------------------------

export interface InjectionQuality {
  /** volume pushed (mL) */
  volumeMl: number;
  peakFlowMlS: number;
  /** mean flow while pushing (mL/s) */
  meanFlowMlS: number;
  /** time the syringe pushed (s) */
  pushS: number;
  /** a push under RUN_QUALITY.testPuffMl */
  testPuff: boolean;
  /** mean mixing deficiency while pushing (0 well mixed .. 1 streaming) */
  streamingIndex: number;
  /** contrast spilled back from the full artery into the root (full-strength equivalent, mL) */
  refluxMl: number;
  reflux: boolean;
  /** jet that missed the ostium (mL) */
  missedMl: number;
  /**
   * time the artery was full (s): from the first moment the strength entering it reached RUN_QUALITY.fullInlet to
   * the last such moment, plus the time that last full-strength contrast takes to pass along the artery to its
   * distal bed (the washout the caller passes: the transport's median terminal transit over the flow scale), as a
   * reader counts the beats from the first full frame until the contrast has run off; brief diastolic dilution in
   * between is the streaming index's concern, not this count's
   */
  opacifiedS: number;
  /** the same in beats */
  beatsOpacified: number;
  /** the jet streamed (streamingIndex at or above the threshold) */
  streaming: boolean;
  /** full for fewer than RUN_QUALITY.beatsMin beats */
  underfilled: boolean;
}

/**
 * Judge one injection from its ostial mixing (contrastTransport ostialSeries), the beat length (s) and the washout
 * (s): how long full-strength contrast that has entered the ostium takes to pass along the artery to its distal bed
 * (TransportNet.thetaEnd of the side over its flow scale; 0 counts the inlet alone).
 */
export function analyseInjection(series: OstialSeries, trace: Pick<InjectionTrace, "volumeMl">, rrS: number, washoutS = 0): InjectionQuality {
  const P = RUN_QUALITY;
  const dt = series.dt;
  let pushN = 0;
  let defic = 0;
  let qSum = 0;
  let peak = 0;
  let reflux = 0;
  let missed = 0;
  let first = -1;
  let last = -1;
  for (let k = 0; k < series.n; k++) {
    const q = series.qInj[k];
    peak = Math.max(peak, q);
    reflux += series.overflow[k] * series.jet[k] * dt;
    missed += Math.max(0, series.missed[k]) * dt;
    if (q > P.pushingMlS) {
      pushN++;
      defic += series.deficiency[k];
      qSum += q;
    }
    if (series.inlet[k] >= P.fullInlet) {
      if (first < 0) first = k;
      last = k;
    }
  }
  const volumeMl = trace.volumeMl;
  const streamingIndex = pushN ? defic / pushN : 1;
  const opacifiedS = first >= 0 ? (last - first + 1) * dt + Math.max(0, Number.isFinite(washoutS) ? washoutS : 0) : 0;
  const beatsOpacified = opacifiedS / Math.max(0.25, rrS);
  return {
    volumeMl,
    peakFlowMlS: peak,
    meanFlowMlS: pushN ? qSum / pushN : 0,
    pushS: pushN * dt,
    // under the threshold (a syringe of exactly that volume pushed empty is not a puff)
    testPuff: volumeMl < P.testPuffMl - 1e-6,
    streamingIndex,
    refluxMl: reflux,
    reflux: reflux >= P.refluxMinMl,
    missedMl: missed,
    opacifiedS,
    beatsOpacified,
    streaming: streamingIndex >= P.streamingIndex,
    underfilled: beatsOpacified < P.beatsMin,
  };
}

// ---------------------------------------------------------------------------
// The view of a lesion
// ---------------------------------------------------------------------------

export interface LesionView {
  /** projected over true length of the lesion segment (1 seen side on, 0 end on) */
  foreshortening: number;
  /** another vessel's projection crosses the lesion's */
  overlap: boolean;
  /** the beam axis of this view (unit vector, for the separation of two views) */
  axis: Vec3;
}

/** The beam axis of a C-arm position (unit vector from the source towards the detector's view direction). */
export function beamAxis(cArm: CArm): Vec3 {
  return cameraBasis(cArm).forward;
}

/** Angle between two views' beam axes (degrees). */
export function viewSeparationDeg(a: CArm, b: CArm): number {
  const x = beamAxis(a);
  const y = beamAxis(b);
  const d = Math.max(-1, Math.min(1, x.x * y.x + x.y * y.y + x.z * y.z));
  return (Math.acos(d) * 180) / Math.PI;
}

/**
 * How a view shows a lesion: the lesion segment's projected over true length, and whether another vessel's
 * projection crosses the lesion's (closer than the two radii plus RUN_QUALITY.overlapMarginMm in the detector
 * plane, ignoring vessel points within RUN_QUALITY.overlapNearMm of the lesion in 3D, which are its own
 * neighbourhood). Positions in world mm.
 */
export function lesionView(cArm: CArm, lesion: { pts: readonly Vec3[]; radiusMm: number }, others: readonly { pts: readonly Vec3[]; radii: readonly number[] }[]): LesionView {
  const B = cameraBasis(cArm);
  const pr = (p: Vec3) => ({ x: p.x * B.right.x + p.y * B.right.y + p.z * B.right.z, y: p.x * B.up.x + p.y * B.up.y + p.z * B.up.z });
  let L = 0;
  let Lp = 0;
  for (let i = 1; i < lesion.pts.length; i++) {
    const a = lesion.pts[i - 1];
    const b = lesion.pts[i];
    L += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    const pa = pr(a);
    const pb = pr(b);
    Lp += Math.hypot(pb.x - pa.x, pb.y - pa.y);
  }
  const foreshortening = L > 1e-6 ? Math.min(1, Lp / L) : 1;
  const c = lesion.pts[Math.floor(lesion.pts.length / 2)] ?? { x: 0, y: 0, z: 0 };
  const pc = pr(c);
  let overlap = false;
  for (const o of others) {
    for (let i = 0; i < o.pts.length && !overlap; i++) {
      const p = o.pts[i];
      if (Math.hypot(p.x - c.x, p.y - c.y, p.z - c.z) < RUN_QUALITY.overlapNearMm) continue;
      const pp = pr(p);
      if (Math.hypot(pp.x - pc.x, pp.y - pc.y) < lesion.radiusMm + (o.radii[i] ?? 0) + RUN_QUALITY.overlapMarginMm) overlap = true;
    }
    if (overlap) break;
  }
  return { foreshortening, overlap, axis: B.forward };
}

// ---------------------------------------------------------------------------
// One stored cine run
// ---------------------------------------------------------------------------

export type RunTag =
  | "no-injection"
  | "test-puff"
  | "non-selective"
  | "streaming"
  | "no-reflux"
  | "underfilled"
  | "non-diagnostic"
  | "injected-before-cine"
  | "early-injection"
  | "late-injection"
  | "stopped-early"
  | "panned"
  | "zoomed"
  | "free-breathing"
  | "low-frame-rate"
  | "qfr-suitable";

export type QfrCriterionId = "nitrate" | "frame-rate" | "no-panning" | "no-zoom" | "brisk-injection" | "foreshortening" | "overlap" | "second-projection";

export interface QfrCriterion {
  id: QfrCriterionId;
  ok: boolean;
  text: string;
}

export interface RunLesion {
  /** the lesion's vessel (the case's lesion id) and severity (% diameter) */
  vessel: string;
  severityPct: number;
  view: LesionView;
  /** nitrate on board when the run was filmed */
  nitrate: boolean;
  /** the largest separation from another stored run of the same lesion (degrees), null with none */
  pairSeparationDeg: number | null;
}

export interface RunQualityInput {
  /** the push filmed by the run, or null when the run filmed none */
  injection: InjectionQuality | null;
  /** the tip was engaged in a coronary (or a graft) when the push began; false for a root puff */
  selective: boolean;
  /** the tip's classification when the push began (the engagement kind, and the tree vessel when known) */
  tip: { kind: string; vessel?: string | null };
  /** seconds from the first cine frame to the start of the push (negative: the push began before the pedal) */
  pushDelayS: number | null;
  /** seconds of cine after the push ended (null: the push outlasted the run) */
  tailS: number | null;
  /** seconds after the push for contrast to reach the distal bed */
  distalArrivalS: number;
  fps: number;
  /** table during the run: the fastest speed (mm/s) and the distance moved (mm) */
  table: { maxSpeedMmS: number; travelMm: number };
  /** the detector field changed during the run */
  fieldChanged: boolean;
  /** share of the run with the breath held (0..1) */
  breathHeldShare: number;
  /** an intermediate lesion on the injected side, when the run shows one */
  lesion?: RunLesion | null;
}

export interface RunQuality {
  tags: RunTag[];
  /** the run cannot be read: no injection filmed, a streaming or underfilled artery, or no reflux */
  nonDiagnostic: boolean;
  injection: InjectionQuality | null;
  tip: { kind: string; vessel?: string | null };
  pushDelayS: number | null;
  fps: number;
  table: { maxSpeedMmS: number; travelMm: number };
  breathHeldShare: number;
  /** the QFR check (applicable with an intermediate lesion on the injected side) */
  qfr: { applicable: boolean; ok: boolean; criteria: QfrCriterion[] };
  lesion?: RunLesion | null;
}

/** Judge a stored cine run. */
export function assessRun(i: RunQualityInput): RunQuality {
  const P = RUN_QUALITY;
  const tags: RunTag[] = [];
  const inj = i.injection;
  const tag = (t: RunTag) => {
    if (!tags.includes(t)) tags.push(t);
  };
  let nonDiagnostic = false;
  if (!inj) {
    tag("no-injection");
    nonDiagnostic = true;
  } else if (inj.testPuff) tag("test-puff");
  else if (!i.selective) tag("non-selective");
  else {
    if (inj.streaming) tag("streaming");
    if (!inj.reflux) tag("no-reflux");
    if (inj.underfilled) tag("underfilled");
    nonDiagnostic = inj.streaming || !inj.reflux || inj.underfilled;
    if (nonDiagnostic) tag("non-diagnostic");
  }
  if (inj && !inj.testPuff && i.pushDelayS !== null) {
    if (i.pushDelayS < 0) tag("injected-before-cine");
    else if (i.pushDelayS < P.pushDelayS.min) tag("early-injection");
    else if (i.pushDelayS > P.pushDelayS.max) tag("late-injection");
  }
  if (inj && !inj.testPuff && (i.tailS === null || i.tailS < i.distalArrivalS)) tag("stopped-early");
  const panned = i.table.maxSpeedMmS > P.panSpeedMmS || i.table.travelMm > P.panTravelMm;
  if (panned) tag("panned");
  if (i.fieldChanged) tag("zoomed");
  if (i.breathHeldShare < P.breathHeldShare) tag("free-breathing");
  if (i.fps < P.qfrFps) tag("low-frame-rate");

  const lesion = i.lesion ?? null;
  const applicable = !!lesion && !!inj && !inj.testPuff && i.selective;
  const criteria: QfrCriterion[] = [];
  if (applicable && lesion && inj) {
    criteria.push({ id: "nitrate", ok: lesion.nitrate, text: "Intracoronary nitrate on board" });
    criteria.push({ id: "frame-rate", ok: i.fps >= P.qfrFps, text: `At least ${P.qfrFps} frames per second (${i.fps})` });
    criteria.push({ id: "no-panning", ok: !panned, text: "No table movement during the run" });
    criteria.push({ id: "no-zoom", ok: !i.fieldChanged, text: "No change of field during the run" });
    criteria.push({ id: "brisk-injection", ok: !inj.streaming && !inj.underfilled, text: "A brisk, continuous injection that fills the artery" });
    criteria.push({ id: "foreshortening", ok: lesion.view.foreshortening >= P.foreshorteningMin, text: "The lesion with little foreshortening" });
    criteria.push({ id: "overlap", ok: !lesion.view.overlap, text: "No vessel overlapping the lesion" });
    criteria.push({ id: "second-projection", ok: lesion.pairSeparationDeg !== null && lesion.pairSeparationDeg >= P.qfrPairDeg, text: `A second projection of the lesion at least ${P.qfrPairDeg} degrees from this one` });
  }
  const ok = applicable && criteria.every((c) => c.ok);
  if (ok) tag("qfr-suitable");
  return {
    tags,
    nonDiagnostic,
    injection: inj,
    tip: i.tip,
    pushDelayS: i.pushDelayS,
    fps: i.fps,
    table: i.table,
    breathHeldShare: i.breathHeldShare,
    qfr: { applicable, ok, criteria },
    lesion,
  };
}

/** How the run browser names a tag. */
export const RUN_TAG_LABEL: Readonly<Record<RunTag, string>> = {
  "no-injection": "No contrast",
  "test-puff": "Test puff",
  "non-selective": "Root injection",
  streaming: "Streaming",
  "no-reflux": "No reflux",
  underfilled: "Under 3 beats",
  "non-diagnostic": "Non-diagnostic",
  "injected-before-cine": "Injected before cine",
  "early-injection": "Injected under 1 s",
  "late-injection": "Injected after 2 s",
  "stopped-early": "Stopped before distal filling",
  panned: "Panned",
  zoomed: "Field changed",
  "free-breathing": "Breathing",
  "low-frame-rate": "Under 12.5 fps",
  "qfr-suitable": "QFR suitable",
};

/** The tags that describe how the run was acquired (what the operator did), as against how it filled. */
export const ACQUISITION_TAGS: readonly RunTag[] = ["no-injection", "test-puff", "non-selective", "injected-before-cine", "early-injection", "late-injection", "panned", "zoomed", "free-breathing", "low-frame-rate"];
