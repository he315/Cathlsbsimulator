// ===========================================================================
// Simulated-run TIMI flow and frame-count drill (angio-expert-label-drills).
//
// Until a supervising reader has labelled real library runs (labels.ts), the 'timi' and
// 'frame-count' reading drills open this drill instead. Each run is a short simulated cine run of one
// coronary filmed through the diagnostic renderer (buildXrayScene and XrayRenderer, the scene the
// diagnostic lab draws) with the coronary flow beyond the proximal vessel reduced (TIMI 2 and 1) or the vessel
// occluded (TIMI 0), so that the proximal segment and the uninvolved arteries of the run fill normally and serve
// as the in-run comparison the module's TIMI 2 definition asks for (contrastTransport.ts scales filling by coronary
// flow). The engine therefore knows each run's flow: the TIMI grade comes from the transport by the module's definitions
// (pm-interpreting-flow: nothing beyond the obstruction is TIMI 0; contrast that never fills the whole
// distal bed during the run is TIMI 1; complete but perceptibly slower filling than an uninvolved bed is
// TIMI 2; filling as prompt as the uninvolved bed is TIMI 3), and the frame count is the model's count
// at the run's own frame rate. The learner grades and counts; the reveal shows the engine's values,
// labelled as model values.
//
// The pure part (specs, measurement, grading, scoring, the tip context) runs in Node and vitest; the
// browser part (renderSimFlowRun) needs WebGL2 and is used only by the Real angiograms section.
// ===========================================================================

import { buildAnatomy, type AnatomyModel } from "../../simulation/anatomy";
import { CASE_LIBRARY } from "../../simulation/caseGenerator";
import { buildCoronaryTree, type CoronaryTree, type Sample } from "../../render/xray/coronaryTree";
import { contrastField, transportNet, type TransportMods, type TransportNet } from "../../render/xray/contrastTransport";
import { CINE_RUN_S, LUMENS, STANDARD_PUSH_S, planTrace, standardPlan, type InjectionTrace } from "../../simulation/injection";
import type { LabContext, LabEvent } from "../../content/lab/tips";
import type { LabRaises } from "../../content/lab/raisable/waiting";
import { correctedFrameCount, frameCountNormals, type FrameCountNormals, type FrameVessel } from "./labels";
import type { AnatomyCase, Vec3, VesselId } from "../../types";

export type TimiGrade = 0 | 1 | 2 | 3;
export const TIMI_GRADES: readonly TimiGrade[] = [0, 1, 2, 3];
export const TIMI_LABEL: Record<TimiGrade, string> = {
  0: "TIMI 0: no perfusion",
  1: "TIMI 1: penetration without perfusion",
  2: "TIMI 2: partial perfusion",
  3: "TIMI 3: complete perfusion",
};

/** The simulated vessels and their side. */
export type SimFlowVessel = "LAD" | "LCx" | "RCA";
export const SIM_FLOW_SIDE: Record<SimFlowVessel, "left" | "right"> = { LAD: "left", LCx: "left", RCA: "right" };

/**
 * Where the model counts to: the fraction of the vessel's length at which the distal landmark sits. MODEL
 * PARAMETER: the same distal points at which the transport's frame-count analogue was calibrated to Gibson's
 * normal counts (src/render/xray/xray.test.ts, "reproduces the normal TIMI frame counts"); Gibson's own
 * landmark definitions are not used because they could not be verified (docs/curriculum/evidence/pm-interpreting.md).
 */
export const SIM_FLOW_LANDMARK: Record<SimFlowVessel, number> = { LAD: 0.9, LCx: 0.9, RCA: 0.85 };
/** Where the counted transit starts: just inside the vessel's origin (fraction of its length). MODEL PARAMETER, as the calibration. */
export const SIM_FLOW_ORIGIN = 0.02;
/** Where the TIMI 0 run's vessel is occluded (fraction of its length). MODEL PARAMETER. */
export const SIM_FLOW_OCCLUSION_AT = 0.35;

/**
 * How each grade's run is made, per vessel: a regional slow-flow modifier beyond the proximal vessel
 * (TransportMods.noReflow: the resting flow beyond the point times `scale`) at the side's normal flow, so that the
 * proximal segment and, on the left, the other artery fill promptly beside the slow one (pm-interpreting-flow grades
 * TIMI 2 against the proximal segment or an uninvolved artery); an occlusion of the vessel for TIMI 0. The RCA's
 * TIMI 1 run also lowers the side's flow scale (contrastTransport TransportInput.flowScale), because the short RCA
 * fills during the push at any regional scale alone; the right side has no other artery to compare with. The LCx
 * settings are not among SIM_FLOW_SPECS and keep the side-wide flow scale. MODEL PARAMETERS chosen so that the
 * transport, graded by engineGrade below, gives the grade (simFlowDrill.test.ts checks every spec); they are not
 * physiological flows.
 */
export interface SimFlowSetting {
  flowScale: number;
  occluded: boolean;
  /** regional slow flow beyond this fraction of the vessel's length, at this share of resting flow */
  slowBeyond?: { at: number; scale: number };
}
export const SIM_FLOW_SETTINGS: Record<SimFlowVessel, Record<TimiGrade, SimFlowSetting>> = {
  LAD: {
    3: { flowScale: 1, occluded: false },
    2: { flowScale: 1, occluded: false, slowBeyond: { at: 0.3, scale: 0.45 } },
    1: { flowScale: 1, occluded: false, slowBeyond: { at: 0.3, scale: 0.06 } },
    0: { flowScale: 1, occluded: true },
  },
  LCx: { 3: { flowScale: 1, occluded: false }, 2: { flowScale: 0.35, occluded: false }, 1: { flowScale: 0.06, occluded: false }, 0: { flowScale: 1, occluded: true } },
  RCA: {
    3: { flowScale: 1, occluded: false },
    2: { flowScale: 1, occluded: false, slowBeyond: { at: 0.3, scale: 0.35 } },
    1: { flowScale: 0.06, occluded: false, slowBeyond: { at: 0.3, scale: 0.3 } },
    0: { flowScale: 1, occluded: true },
  },
};
export const simFlowSetting = (vessel: SimFlowVessel, timi: TimiGrade): SimFlowSetting => SIM_FLOW_SETTINGS[vessel][timi];

/**
 * Grading thresholds on the transport, MODEL PARAMETERS (the module's definitions are qualitative):
 *  - beyondShare: contrast beyond the obstruction below this share of the normal run's strength there is "none";
 *  - fillShare: the distal landmark has "filled" once it reaches this share of its strength in the normal run;
 *  - slowRatio: filling the landmark takes more than this multiple of the normal run's transit is "perceptibly slower".
 */
export const SIM_FLOW_GRADING = { beyondShare: 0.05, fillShare: 0.5, slowRatio: 1.4 } as const;

/** Run length (s): the lab's cine run plus time to see the distal bed fill and begin to clear. MODEL PARAMETER. */
export const SIM_FLOW_RUN_S = CINE_RUN_S + 1.6;
/** Frame-count tolerance (frames at the run's rate) within which a learner's count is scored as agreeing. MODEL PARAMETER. */
export const SIM_FRAME_TOLERANCE = 3;

export interface SimFlowSpec {
  id: string;
  vessel: SimFlowVessel;
  timi: TimiGrade;
  /** acquisition rate of the rendered run (frames per second) */
  fps: number;
}

/**
 * The drill's runs: every grade on the LAD and the RCA, at the two rates of the real library (10 and 15 frames
 * per second), so that counts at different rates have to be compared through the rate.
 */
export const SIM_FLOW_SPECS: readonly SimFlowSpec[] = (["LAD", "RCA"] as const).flatMap((vessel) =>
  TIMI_GRADES.flatMap((timi) => [15, 10].map((fps) => ({ id: `sim-${vessel.toLowerCase()}-timi${timi}-${fps}`, vessel, timi, fps })))
);

// ---------------------------------------------------------------------------
// The simulated patient (a normal heart of the diagnostic case library, lesions removed)
// ---------------------------------------------------------------------------

/** The diagnostic case the runs are filmed on: the library's first case, without its lesions (a normal tree). */
export const SIM_FLOW_CASE_ID = CASE_LIBRARY[0].id;

interface SimPatient {
  c: AnatomyCase;
  model: AnatomyModel;
  tree: CoronaryTree;
}
let patient: SimPatient | null = null;
export function simFlowPatient(): SimPatient {
  if (!patient) {
    const c0 = CASE_LIBRARY[0];
    const c: AnatomyCase = { ...c0, lesions: [] };
    const model = buildAnatomy(c);
    patient = { c, model, tree: buildCoronaryTree(model, c) };
  }
  return patient;
}

/** The transport modifiers of a grade's run: an occlusion of the vessel for TIMI 0, regional slow flow where the setting has it. */
export function simFlowMods(spec: Pick<SimFlowSpec, "vessel" | "timi">, tree: CoronaryTree = simFlowPatient().tree): TransportMods {
  const set = simFlowSetting(spec.vessel, spec.timi);
  if (!set.occluded && !set.slowBeyond) return {};
  const v = tree.vessels.find((x) => x.name === spec.vessel);
  if (!v) throw new Error(`simFlowDrill: the simulated tree has no ${spec.vessel}`);
  const pAt = (f: number) => v.param[Math.round(f * (v.param.length - 1))];
  const mods: TransportMods = {};
  if (set.occluded) mods.occlusions = [{ vessel: spec.vessel, param: pAt(SIM_FLOW_OCCLUSION_AT), fraction: 1 }];
  if (set.slowBeyond) mods.noReflow = { vessel: spec.vessel, param: pAt(set.slowBeyond.at), scale: set.slowBeyond.scale };
  return mods;
}

const traces = new Map<string, InjectionTrace>();
/** The standard hand injection of the side through a 6 Fr diagnostic catheter (injection.ts). */
export function simFlowTrace(side: "left" | "right"): InjectionTrace {
  let t = traces.get(side);
  if (!t) traces.set(side, (t = planTrace(standardPlan(side, LUMENS["diag-6"]))));
  return t;
}

// ---------------------------------------------------------------------------
// Measurement on the transport (no GL)
// ---------------------------------------------------------------------------

export interface FlowMeasure {
  vessel: SimFlowVessel;
  /** time (s from the press) the origin first reaches half its peak strength in the run */
  tOrigin: number;
  /** time the distal landmark first reaches fillShare of its normal-run peak, or null when it never does in the run */
  tLandmark: number | null;
  /** the landmark's peak strength in the run over its peak in the normal run (0..) */
  landmarkShare: number;
  /** the peak strength just beyond the occlusion point over the normal run's peak there */
  beyondShare: number;
  /** landmark transit (tLandmark - tOrigin) over the normal run's, or null when the landmark never fills */
  transitRatio: number | null;
}

const SAMPLE_HZ = 60;

function thetaAt(net: TransportNet, vessel: string, frac: number): number {
  const th = net.vessels.get(vessel)?.theta;
  if (!th) throw new Error(`simFlowDrill: no transport for ${vessel}`);
  return th[Math.round(frac * (th.length - 1))];
}

interface Curve {
  ts: number[];
  origin: number[];
  landmark: number[];
  beyond: number[];
}

const curves = new Map<string, Curve>();
/** Strength curves at the origin, the landmark and just beyond the occlusion point, sampled at SAMPLE_HZ over the run. */
function curveFor(vessel: SimFlowVessel, timi: TimiGrade): Curve {
  const key = `${vessel}|${timi}`;
  const hit = curves.get(key);
  if (hit) return hit;
  const { tree } = simFlowPatient();
  const side = SIM_FLOW_SIDE[vessel];
  const net = transportNet(tree, [], simFlowMods({ vessel, timi }, tree));
  const a = thetaAt(net, vessel, SIM_FLOW_ORIGIN);
  const b = thetaAt(net, vessel, SIM_FLOW_LANDMARK[vessel]);
  const c = thetaAt(net, vessel, Math.min(1, SIM_FLOW_OCCLUSION_AT + 0.1));
  const trace = simFlowTrace(side);
  const rr = 60 / 72;
  const out: Curve = { ts: [], origin: [], landmark: [], beyond: [] };
  for (let i = 0; i <= Math.round(SIM_FLOW_RUN_S * SAMPLE_HZ); i++) {
    const t = i / SAMPLE_HZ;
    const f = contrastField({ net, side, trace, t, phase: (t / rr) % 1, rr, flowScale: simFlowSetting(vessel, timi).flowScale });
    out.ts.push(t);
    out.origin.push(f.at(a));
    out.landmark.push(f.at(b));
    out.beyond.push(f.at(c));
  }
  curves.set(key, out);
  return out;
}

const firstAt = (ts: number[], v: number[], level: number): number | null => {
  const i = v.findIndex((x) => x >= level);
  return i < 0 ? null : ts[i];
};

/** Measure one grade's run of a vessel on the transport. */
export function measureFlow(vessel: SimFlowVessel, timi: TimiGrade): FlowMeasure {
  const run = curveFor(vessel, timi);
  const ref = curveFor(vessel, 3);
  const peak = (v: number[]) => Math.max(0, ...v);
  const refLand = peak(ref.landmark);
  const tO = firstAt(run.ts, run.origin, 0.5 * peak(run.origin)) ?? 0;
  const tL = firstAt(run.ts, run.landmark, SIM_FLOW_GRADING.fillShare * refLand);
  const refO = firstAt(ref.ts, ref.origin, 0.5 * peak(ref.origin)) ?? 0;
  const refL = firstAt(ref.ts, ref.landmark, SIM_FLOW_GRADING.fillShare * refLand);
  const transitRatio = tL !== null && refL !== null && refL > refO ? (tL - tO) / (refL - refO) : null;
  return {
    vessel,
    tOrigin: tO,
    tLandmark: tL,
    landmarkShare: refLand > 0 ? peak(run.landmark) / refLand : 0,
    beyondShare: peak(ref.beyond) > 0 ? peak(run.beyond) / peak(ref.beyond) : 0,
    transitRatio,
  };
}

/** The TIMI grade the transport shows, by the module's definitions and the SIM_FLOW_GRADING thresholds. */
export function engineGrade(m: FlowMeasure): TimiGrade {
  if (m.beyondShare < SIM_FLOW_GRADING.beyondShare) return 0;
  if (m.tLandmark === null) return 1;
  if (m.transitRatio !== null && m.transitRatio > SIM_FLOW_GRADING.slowRatio) return 2;
  return 3;
}

/**
 * The model's frame count of a run: frames from the origin's half-rise to the landmark's filling, at the run's
 * frame rate; null when the landmark never fills during the run (TIMI 0 and 1 have no count).
 */
export function modelFrameCount(m: FlowMeasure, fps: number): number | null {
  if (m.tLandmark === null) return null;
  return Math.max(0, Math.round((m.tLandmark - m.tOrigin) * fps));
}

// ---------------------------------------------------------------------------
// Drill items, answers and scoring
// ---------------------------------------------------------------------------

export interface SimFlowTruth {
  /** the engine's grade (model value) */
  timi: TimiGrade;
  /** the model's frame count at the run's rate, or null when the landmark never fills (model value) */
  frameCount: number | null;
  fps: number;
  /** the count corrected for the LAD (divided by 1.7) at the run's rate; null with no count */
  corrected: number | null;
  /** published normal counts scaled to this run's rate, only when refs carries verified normals with their frame rate */
  normals: FrameCountNormals | null;
  /** every value here is the model's, not an observer's */
  source: "model";
}

export interface SimFlowItem {
  spec: SimFlowSpec;
  truth: SimFlowTruth;
  question: string;
  /** what the model counts between, in words */
  landmark: string;
}

const LANDMARK_TEXT: Record<SimFlowVessel, string> = {
  LAD: "the distal LAD near the apex (the model's landmark, 90% along the vessel)",
  LCx: "the distal circumflex (the model's landmark, 90% along the vessel)",
  RCA: "the distal RCA at the crux (the model's landmark, 85% along the vessel)",
};

const frameVessel = (v: SimFlowVessel): FrameVessel => (v === "LAD" ? "LAD" : v === "LCx" ? "LCx" : "RCA");

/** The truth of one run, from the engine. */
export function simFlowTruth(spec: SimFlowSpec): SimFlowTruth {
  const m = measureFlow(spec.vessel, spec.timi);
  const frames = modelFrameCount(m, spec.fps);
  return {
    timi: engineGrade(m),
    frameCount: frames,
    fps: spec.fps,
    corrected: frames === null ? null : correctedFrameCount(frames, { vessel: frameVessel(spec.vessel), runFps: spec.fps }),
    normals: frameCountNormals(spec.fps),
    source: "model",
  };
}

export function simFlowItem(spec: SimFlowSpec): SimFlowItem {
  return {
    spec,
    truth: simFlowTruth(spec),
    question: `Grade the TIMI flow of this ${spec.vessel === "RCA" ? "right" : "left"} coronary run, then count the frames contrast takes from the vessel's origin to ${LANDMARK_TEXT[spec.vessel].split(" (")[0]}.`,
    landmark: LANDMARK_TEXT[spec.vessel],
  };
}

/** Deterministic PRNG for reproducible sets in tests. */
function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A set with the same number of runs of each grade (stratified), in random order. */
export function simFlowSet(perGrade = 2, r: () => number = Math.random, specs: readonly SimFlowSpec[] = SIM_FLOW_SPECS): SimFlowItem[] {
  const out: SimFlowSpec[] = [];
  for (const g of TIMI_GRADES) {
    const pool = specs.filter((s) => s.timi === g).slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    out.push(...pool.slice(0, perGrade));
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.map(simFlowItem);
}
export const simFlowSeeded = (seed: number, perGrade = 2) => simFlowSet(perGrade, mulberry(seed));

export interface SimFlowAnswer {
  timi: TimiGrade;
  /** frames counted, or null for "the landmark does not fill during the run" */
  frames: number | null;
  /** stated confidence (0..1) that the grade is right */
  conf: number;
}

export interface SimFlowScore {
  gradeCorrect: boolean;
  /** true when both agree there is no count, or the count is within SIM_FRAME_TOLERANCE frames of the model's */
  countCorrect: boolean;
  /** learner minus model (frames), when both counted */
  countError: number | null;
}

export function scoreSimFlow(item: SimFlowItem, a: SimFlowAnswer): SimFlowScore {
  const truth = item.truth;
  const gradeCorrect = a.timi === truth.timi;
  let countCorrect: boolean;
  let countError: number | null = null;
  if (truth.frameCount === null) countCorrect = a.frames === null;
  else if (a.frames === null) countCorrect = false;
  else {
    countError = a.frames - truth.frameCount;
    countCorrect = Math.abs(countError) <= SIM_FRAME_TOLERANCE;
  }
  return { gradeCorrect, countCorrect, countError };
}

/** The reveal's text for the model's values: always labelled as model values, with the run's rate and the LAD correction. */
export function describeTruth(item: SimFlowItem): string[] {
  const t = item.truth;
  const lines = [`Model value: ${TIMI_LABEL[t.timi]} (the engine's grade of this run, not an observer's).`];
  if (t.frameCount === null) lines.push(`Model frame count: none; contrast does not reach ${item.landmark} during the run.`);
  else {
    lines.push(`Model frame count: ${t.frameCount} frames at ${t.fps} frames per second, counted to ${item.landmark}.`);
    if (item.spec.vessel === "LAD" && t.corrected !== null) lines.push(`Corrected for the LAD (divided by 1.7): ${t.corrected.toFixed(1)} frames at ${t.fps} frames per second.`);
  }
  if (t.normals) lines.push(t.normals.text);
  else lines.push("No published normal count is shown: the frame rate of the original study has not been verified from the full paper, so a count at this rate cannot be compared with the published normals.");
  return lines;
}

// ---------------------------------------------------------------------------
// Tips: the reveal shows the diagnostic lab's tips for the views phase and the drill's event
// ---------------------------------------------------------------------------

/** Events the reveal of a simulated run adds to the context: slow-flow for the flow drills, total-occlusion for TIMI 0. */
export function simFlowEvents(item: Pick<SimFlowItem, "truth">): LabEvent[] {
  const ev: LabEvent[] = ["slow-flow"];
  if (item.truth.timi === 0) ev.push("total-occlusion");
  return ev;
}

export function simFlowTipContext(item: Pick<SimFlowItem, "truth">): LabContext {
  return { lab: "diagnostic", phase: "views", events: simFlowEvents(item) };
}

/** What this drill reports to the tip engine (read by the reachability report where its glob includes it). */
export const raises: LabRaises = { lab: "diagnostic", phases: ["views"], events: ["slow-flow", "total-occlusion"] };

// ---------------------------------------------------------------------------
// Browser: render a run through the diagnostic renderer (WebGL2). Not used in tests.
// ---------------------------------------------------------------------------

/** C-arm view a run is filmed in (the diagnostic view presets' angles for each artery). MODEL PARAMETER (choice of view). */
export const SIM_FLOW_VIEW: Record<SimFlowVessel, { laoRao: number; cranialCaudal: number }> = {
  LAD: { laoRao: -30, cranialCaudal: 30 },
  LCx: { laoRao: -30, cranialCaudal: -25 },
  RCA: { laoRao: 30, cranialCaudal: 0 },
};

export interface RenderedRun {
  id: string;
  fps: number;
  /** data URLs, one per frame */
  frames: string[];
}

const rendered = new Map<string, Promise<RenderedRun>>();

/**
 * Render a run's frames (data URLs) through the diagnostic renderer on a detached canvas. Cached per spec.
 * Rejects without WebGL2 (the drill then explains that the simulated runs need it).
 */
export function renderSimFlowRun(spec: SimFlowSpec, res = 512): Promise<RenderedRun> {
  const key = `${spec.id}|${res}`;
  let p = rendered.get(key);
  if (!p) {
    p = renderRun(spec, res);
    rendered.set(key, p);
    p.catch(() => rendered.delete(key));
  }
  return p;
}

async function renderRun(spec: SimFlowSpec, res: number): Promise<RenderedRun> {
  const [{ buildXrayScene }, { XrayRenderer }, { catheterById }, { catheterPath }] = await Promise.all([
    import("../../render/xray/sceneBuilder"),
    import("../../render/xray/XrayRenderer"),
    import("../../data/catheters"),
    import("../sim/helpers"),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = res;
  canvas.height = res;
  const xr = XrayRenderer.create(canvas);
  if (!xr) throw new Error("The simulated runs need WebGL2 with floating-point render targets, which this browser does not offer.");
  xr.resize(res);
  xr.setCaptureMode(true);
  const { c, model, tree } = simFlowPatient();
  const side = SIM_FLOW_SIDE[spec.vessel];
  const os = side === "left" ? model.lm : model.rca;
  const tip = { pos: os.pos, dir: os.dir, height: os.height, az: os.az, radius: model.sinusRadius, cram: 0, gap: 0 };
  const root = catheterPath(model, tip, catheterById(side === "left" ? "JL4" : "JR4"));
  const filled = [...new Set(tree.vessels.filter((v) => v.side === side).map((v) => v.fillId))] as VesselId[];
  const flowMods = simFlowMods(spec, tree);
  const n = Math.round(SIM_FLOW_RUN_S * spec.fps);
  const warmup = 4;
  const frames: string[] = [];
  try {
    for (let k = -warmup; k < n; k++) {
      const t = k / spec.fps;
      const cine = k >= 0;
      const r = buildXrayScene({
        model,
        caseData: { accessRoute: c.accessRoute, lesions: [], dominance: c.dominance },
        tree,
        catheterRoot: root as Vec3[],
        french: 6,
        guide: false,
        wire: null,
        bolus: cine ? { filled, plume: "none", side, t, injectDur: STANDARD_PUSH_S, peak: 1, trace: simFlowTrace(side) } : null,
        t,
        cArm: SIM_FLOW_VIEW[spec.vessel],
        field: 200,
        centreOn: side,
        mode: cine ? "cine" : "fluoro",
        breathHold: cine ? 0.7 : null,
        frame: 100000 + 1000 + k,
        framesSinceStart: cine ? k : k + warmup,
        flowScale: simFlowSetting(spec.vessel, spec.timi).flowScale,
        flowMods,
        extras: (_place: (s: Sample) => Vec3) => ({}),
      });
      xr.render(r.scene, { ...r.params, mode: cine ? "cine" : "fluoro", framesSinceStart: cine ? k : k + warmup });
      if (cine) frames.push(canvas.toDataURL("image/jpeg", 0.8));
      // yield to the page every few frames so the section stays responsive
      if (k % 6 === 0) await new Promise((ok) => setTimeout(ok, 0));
    }
  } finally {
    xr.dispose();
    xr.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
  return { id: spec.id, fps: spec.fps, frames };
}
