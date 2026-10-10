// ---------------------------------------------------------------------------
// Bridge from the existing diagnostic simulator store (useSimulatorStore) to
// the mentor: frames and events for the recorder, and MentorInput for the
// attending, by subscribing to store changes. It reads the store through a
// structural type, so this file does not import the store module (which
// another stream owns and may be changing) and needs no edit to it.
//
// What it gives: a full timeline, metrics, mistakes, the attending and the
// debrief for the current diagnostic lab. What it cannot give: deterministic
// replay, because store actions are not logged as HostCommands. For replay the
// lab should drive a ReplayHost through RecordedSession (see wave1/S11.md).
// ---------------------------------------------------------------------------

import type { CArm, EngagementKind, PressureKind, SimEvent, VesselId } from "../../types";
import type { MentorInput } from "../context";
import type { ProcedureRecorder } from "../telemetry";
import { ENGAGEMENT_KINDS, PRESSURE_KINDS, type FrameSample } from "../types";

/** The parts of the simulator store state the bridge reads. */
export interface SimLike {
  engagement: { kind: EngagementKind; target: "left" | "right" | "both" | "root" | "lv" | null; conus: boolean; depth: number };
  pressure: { kind: PressureKind; systolic: number; diastolic: number };
  controls: { cmdInsertion: number; insertion: number; cmdTorque: number; torque: number; wireInsertion: number; resistance: number };
  tip: { pos: { x: number; y: number; z: number }; height: number; az: number };
  cArm: CArm;
  imaging: { field: number; pulseRate: number };
  fluoroLive: boolean;
  /** `intensity` (current opacity, 0..1) is read when present to find the bolus peak */
  bolus: { phase: number; duration: number; filled: VesselId[]; intensity?: number } | null;
  catheterId: string;
  fluoroTime: number;
  score: { contrastVolume: number };
  aspirated: "unknown" | "clean" | "no-return";
  events: SimEvent[];
  lastInjection: { outcome: string; diagnostic: boolean; volume: number; filledVessels: VesselId[]; fillOpacity?: number } | null;
  finished: boolean;
  /**
   * Lab shell with pedal imaging (S10): the cine pedal is the cine run, an injection is independent of
   * it, and pre-contrast filming is measurable. Absent or false: the legacy coupling (bolus = cine run).
   */
  pedalImaging?: boolean;
  pedal?: { fluoro: boolean; cine: boolean };
}

/** Beam state of a frame: 0 off, 1 fluoroscopy, 2 cine. */
function beamOf(s: SimLike): 0 | 1 | 2 {
  if (s.pedalImaging && s.pedal) return s.pedal.cine ? 2 : s.pedal.fluoro ? 1 : 0;
  return s.bolus ? 2 : s.fluoroLive ? 1 : 0;
}

/**
 * Fallback for the bolus peak when the store does not expose `bolus.intensity`.
 * This is not a physiological value: it mirrors advanceBolus() in
 * src/state/useSimulatorStore.ts, whose opacity envelope rises linearly to its
 * maximum at lifecycle phase 0.3 (end of wash-in) and holds until 0.55. If that
 * envelope changes, the bridge's live peak tracking (from bolus.intensity) follows
 * it automatically; only this fallback would need updating.
 */
export const LEGACY_BOLUS_MODEL = {
  /** lifecycle phase (0..1) at which the store's bolus first reaches peak opacity (copied from advanceBolus) */
  peakPhase: 0.3,
};

export const BRIDGE_PARAMS = {
  /** model parameter: the C-arm must rest this long (s) before its position counts as a chosen view */
  viewRestS: 0.5,
};

export interface StoreLike<S> {
  getState(): S;
  subscribe(listener: (s: S, prev: S) => void): () => void;
}

export interface BridgeClock {
  /** wall seconds since the case started */
  wall(): number;
  /** patient seconds (CardiacClock), defaults to wall */
  patient?(): number;
}

/** A 10 Hz frame from the store state. */
export function frameFromSim(s: SimLike, tWall: number, tPatient: number, step: number): FrameSample {
  return {
    tWall,
    tPatient,
    tFluoro: s.fluoroTime,
    step,
    cmdInsertion: s.controls.cmdInsertion,
    insertion: s.controls.insertion,
    cmdTorque: s.controls.cmdTorque,
    torque: s.controls.torque,
    wireInsertion: s.controls.wireInsertion,
    tipX: s.tip.pos.x,
    tipY: s.tip.pos.y,
    tipZ: s.tip.pos.z,
    tipHeight: s.tip.height,
    tipAz: s.tip.az,
    depth: s.engagement.depth,
    eng: Math.max(0, ENGAGEMENT_KINDS.indexOf(s.engagement.kind)),
    press: Math.max(0, PRESSURE_KINDS.indexOf(s.pressure.kind)),
    sys: s.pressure.systolic,
    dia: s.pressure.diastolic,
    resistance: s.controls.resistance,
    laoRao: s.cArm.laoRao,
    cranCaud: s.cArm.cranialCaudal,
    field: s.imaging.field,
    pps: s.imaging.pulseRate,
    beam: beamOf(s),
    syringe: 0,
    contrastMl: s.score.contrastVolume,
    karMGy: 0,
    kapGyCm2: 0,
    hr: 0,
    wireTipMm: NaN,
    deviceMm: NaN,
  };
}

/** The attending's input from the store state. */
export function mentorInputFromSim(s: SimLike, prev: SimLike | null, tWall: number, targetSide?: "left" | "right"): MentorInput {
  const side = s.engagement.target === "left" || s.engagement.target === "right" ? s.engagement.target : targetSide;
  return {
    tWall,
    lab: "diagnostic",
    engagement: s.engagement.kind,
    conus: s.engagement.conus,
    pressure: s.pressure.kind,
    sys: s.pressure.systolic,
    dia: s.pressure.diastolic,
    resistance: s.controls.resistance,
    advancing: !!prev && s.controls.cmdInsertion > prev.controls.cmdInsertion + 1e-4,
    insertion: s.controls.insertion,
    aspirated: s.aspirated,
    beam: beamOf(s),
    cArm: s.cArm,
    catheterId: s.catheterId,
    targetSide: side,
  };
}

/**
 * Turn store changes into recorder events (engagement and pressure changes,
 * catheter exchanges, views, beam, aspirations, injections with cine, and the
 * store's own safety events). Returns the events emitted, for tests.
 */
export function diffEvents(s: SimLike, p: SimLike, opts: { peakPhase?: number } = {}): { kind: string; data?: Record<string, unknown> }[] {
  const out: { kind: string; data?: Record<string, unknown> }[] = [];
  if (s.engagement.kind !== p.engagement.kind) out.push({ kind: "engagement", data: { from: p.engagement.kind, to: s.engagement.kind, side: s.engagement.target ?? undefined, conus: s.engagement.conus || undefined } });
  if (s.pressure.kind !== p.pressure.kind) out.push({ kind: "pressure", data: { from: p.pressure.kind, to: s.pressure.kind, sys: s.pressure.systolic, dia: s.pressure.diastolic } });
  if (s.catheterId !== p.catheterId) out.push({ kind: "catheter", data: { id: s.catheterId, previous: p.catheterId } });
  const pedalMode = !!s.pedalImaging && !!s.pedal && !!p.pedal;
  if (pedalMode) {
    if (s.pedal!.fluoro !== p.pedal!.fluoro) out.push({ kind: s.pedal!.fluoro ? "fluoro-on" : "fluoro-off" });
  } else if (s.fluoroLive !== p.fluoroLive) out.push({ kind: s.fluoroLive ? "fluoro-on" : "fluoro-off" });
  if (s.aspirated !== p.aspirated && s.aspirated !== "unknown") out.push({ kind: "aspirate", data: { result: s.aspirated } });
  // pedal imaging: the cine run is the cine pedal interval; its injection (if any) is timed inside it, so
  // pre-contrast filming is measured by the analysis from the inject event's time
  if (pedalMode && s.pedal!.cine && !p.pedal!.cine) out.push({ kind: "cine-start", data: { laoRao: s.cArm.laoRao, cranCaud: s.cArm.cranialCaudal } });
  // the store starts a bolus on a successful injection (its cine run, in the legacy coupling)
  if (s.bolus && !p.bolus && s.lastInjection) {
    if (!pedalMode) out.push({ kind: "cine-start", data: { laoRao: s.cArm.laoRao, cranCaud: s.cArm.cranialCaudal } });
    out.push({
      kind: "inject",
      data: {
        ml: s.lastInjection.volume,
        outcome: s.lastInjection.outcome,
        diagnostic: s.lastInjection.diagnostic,
        pressure: p.pressure.kind,
        engagement: p.engagement.kind,
        aspirated: p.aspirated,
        side: p.engagement.target === "left" || p.engagement.target === "right" ? p.engagement.target : undefined,
        filledVessels: s.lastInjection.filledVessels,
      },
    });
  }
  // The store's cine run and its injection start together, so the learner cannot film before
  // contrast arrives: pre-contrast filming is reported as not measurable (injectStartS: null),
  // not as zero. The peak comes from the tracked opacity (opts.peakPhase) or the store's envelope.
  if (pedalMode && !s.pedal!.cine && p.pedal!.cine) out.push({ kind: "cine-end", data: { laoRao: s.cArm.laoRao, cranCaud: s.cArm.cranialCaudal } });
  if (!pedalMode && !s.bolus && p.bolus) {
    const peakPhase = opts.peakPhase ?? LEGACY_BOLUS_MODEL.peakPhase;
    out.push({ kind: "cine-end", data: { laoRao: s.cArm.laoRao, cranCaud: s.cArm.cranialCaudal, durationS: p.bolus.duration, injectStartS: null, preContrastMeasurable: false, peakS: p.bolus.duration * peakPhase } });
  }
  // the store's own events that have no state signature
  for (const e of s.events.slice(p.events.length)) {
    if (e.code === "vf-arrest") {
      out.push({ kind: "inject", data: { ml: 0, outcome: "conus", diagnostic: false, pressure: p.pressure.kind, engagement: p.engagement.kind, aspirated: p.aspirated } });
      out.push({ kind: "complication", data: { kind: "vf" } });
    } else if (e.code === "air-embolism") {
      out.push({ kind: "inject", data: { ml: 0, outcome: "air", diagnostic: false, pressure: p.pressure.kind, engagement: p.engagement.kind, aspirated: p.aspirated } });
      out.push({ kind: "complication", data: { kind: "air-embolism" } });
    } else if (e.code === "dissection") out.push({ kind: "complication", data: { kind: "dissection" } });
    else if (e.code === "too-much-pushing") out.push({ kind: "mistake", data: { code: "too-much-pushing" } });
  }
  return out;
}

export interface StoreBridge {
  /** stop listening */
  detach(): void;
  /** take a frame now (call from the lab's frame loop; the recorder decimates to 10 Hz) */
  sample(): void;
}

/**
 * Subscribe a recorder (and optionally an attending) to the simulator store.
 * The C-arm "view" event is emitted once the arm has rested for `viewRestS`.
 */
export function attachSimulatorStore<S extends SimLike>(
  store: StoreLike<S>,
  rec: ProcedureRecorder,
  clock: BridgeClock,
  /** viewRestS: model parameter, seconds the arm must rest before a "view" event (default BRIDGE_PARAMS.viewRestS) */
  opts: { onInput?: (i: MentorInput) => void; viewRestS?: number } = {},
): StoreBridge {
  let step = 0;
  let lastArm = store.getState().cArm;
  let armMovedAt = -Infinity;
  let armReported = true;
  const stamp = (kind: string, data?: Record<string, unknown>) => {
    const t = clock.wall();
    rec.event({ kind, data, tWall: t, tPatient: clock.patient ? clock.patient() : t, step, cmd: 0, ext: true });
  };
  // peak of the live bolus: the lifecycle phase at which its opacity first reached its maximum
  let peakMax = -Infinity;
  let peakPhase: number | undefined;
  const unsub = store.subscribe((s, p) => {
    step++;
    if (s.bolus && !p.bolus) {
      peakMax = -Infinity;
      peakPhase = undefined;
    }
    if (s.bolus && typeof s.bolus.intensity === "number" && s.bolus.intensity > peakMax + 1e-9) {
      peakMax = s.bolus.intensity;
      peakPhase = s.bolus.phase;
    }
    for (const e of diffEvents(s, p, { peakPhase })) stamp(e.kind, e.data);
    if (s.cArm.laoRao !== lastArm.laoRao || s.cArm.cranialCaudal !== lastArm.cranialCaudal) {
      lastArm = s.cArm;
      armMovedAt = clock.wall();
      armReported = false;
    }
    if (s.finished && !p.finished) stamp("case-end", { reason: "finished" });
    opts.onInput?.(mentorInputFromSim(s, p, clock.wall()));
  });
  const sample = () => {
    const s = store.getState();
    const t = clock.wall();
    if (!armReported && t - armMovedAt >= (opts.viewRestS ?? BRIDGE_PARAMS.viewRestS)) {
      armReported = true;
      stamp("view", { laoRao: s.cArm.laoRao, cranCaud: s.cArm.cranialCaudal });
    }
    rec.sample(frameFromSim(s, t, clock.patient ? clock.patient() : t, step));
  };
  return { detach: unsub, sample };
}
