// ---------------------------------------------------------------------------
// Timeline analysis of a recorded procedure: cine runs, engagement approaches,
// catheter tenures, pushing and damping episodes, PCI device history. Metrics,
// mistake detection, the debrief narrative and the replay timeline all read
// this one structure, so they agree with each other.
//
// Every threshold below is a model parameter for expert calibration unless its
// comment names a measured source (see docs/realism/facts/S11.md).
// ---------------------------------------------------------------------------

import type { CArm, EngagementKind, PressureKind } from "../types";
import { FrameTable, type ProcedureRecord } from "./telemetry";
import { DAMPED_KINDS, ENGAGEMENT_KINDS, PRESSURE_KINDS, type RecordedEvent } from "./types";

/** Case facts the analysis needs that are not in the telemetry. */
export interface CaseFacts {
  focus?: "left" | "right" | "both";
  acceptableCatheters?: string[];
  recommendedCatheters?: string[];
  /** ostium azimuths (rad) in the frame of the recorded tipAz */
  targetAz?: { left?: number; right?: number };
  /** PCI: lesion extent and reference along the wire route (mm) */
  lesion?: { startMm: number; endMm: number; refDiameterMm: number; mldMm?: number; lengthMm?: number };
}

export const ANALYSIS_PARAMS = {
  /** resistance above which advancing counts as pushing against resistance (model parameter) */
  pushResistance: 0.6,
  /** a pushing episode must last this long (s) (model parameter) */
  pushMinS: 1.0,
  /** a damped trace left this long without withdrawing is an ignored warning (s) (model parameter) */
  ignoredWarningS: 5,
  /** withdrawal that counts as acting on a warning (mm) (model parameter) */
  withdrawMm: 0.5,
  /** torque applied above the sinuses that counts as "working too high" (rad) (model parameter) */
  tooHighTorqueRad: 1.0,
  /** rotation away from the target ostium that counts as wrong-way torque (rad per 1 s window) (model parameter) */
  wrongRotationRad: 0.35,
  /** start the wrong-way check only within this angle of the target (rad) (model parameter) */
  wrongRotationWindowRad: 1.2,
  /** overshoot past the target azimuth that counts as over-rotation (rad) (model parameter) */
  overRotationRad: 0.5,
  /** catheter change after fewer failed attempts than this is early (model parameter) */
  earlyChangeAttempts: 2,
  /** catheter change after more failed attempts than this is late (model parameter) */
  lateChangeAttempts: 4,
  /** torque direction reversals smaller than this are ignored (rad) (model parameter) */
  reversalDeadbandRad: 0.05,
  /**
   * Minimum filming before contrast arrives (s). Measured: lower quartile of contrast
   * onset after the first frame in 75 real runs (docs/realism/research/mentor/opac_out.txt).
   */
  minPreContrastS: 0.27,
  /**
   * Fallback onset-to-peak when the transport does not report the peak (s). Measured: median
   * in the same 75 real runs (opac_out.txt, "ttp_s" all runs).
   */
  fallbackTimeToPeakS: 1.53,
  /** filming after the peak needed to see wash-out, in cardiac cycles (model parameter) */
  minPostPeakCycles: 1,
  /** balloon/reference ratio above which an inflation outside the lesion is oversized (model parameter) */
  oversizeRatio: 1.1,
  /** margin of normal vessel each side of a stent that counts as covered (mm) (model parameter) */
  landingMarginMm: 1.5,
};

export type AnalysisParams = typeof ANALYSIS_PARAMS;

export interface CineRun {
  id: string;
  startT: number;
  endT: number;
  durationS: number;
  cArm: CArm;
  side: "left" | "right" | "both" | null;
  injections: RecordedEvent[];
  ml: number;
  diagnostic: boolean;
  preContrastS: number | null;
  postPeakS: number | null;
  rr: number;
  /** null when the host cannot film before the injection (not measurable, excluded from measures) */
  preContrastOk: boolean | null;
  washoutOk: boolean;
  filledVessels: string[];
}

export interface Approach {
  side: "left" | "right";
  startT: number;
  endT: number;
  catheterId: string;
  success: boolean;
}

export interface Episode {
  startT: number;
  endT: number;
  kind: string;
  /** did the operator act (withdraw) during it */
  acted?: boolean;
}

export interface CatheterTenure {
  id: string;
  startT: number;
  endT: number;
  failedApproaches: { left: number; right: number };
  successes: { left: number; right: number };
}

export interface Analysis {
  t0: number;
  t1: number;
  frames: FrameTable;
  events: RecordedEvent[];
  runs: CineRun[];
  approaches: Approach[];
  catheters: CatheterTenure[];
  pushing: Episode[];
  damped: Episode[];
  lvEntries: number[];
  deepEntries: number[];
  belowValveEntries: number[];
  injections: RecordedEvent[];
  injectionsOutsideCine: RecordedEvent[];
  firstSelective: { left?: number; right?: number };
  torqueTravelHigh: number;
  wrongRotations: number[];
  overRotations: number[];
  insufficientWithdrawals: number[];
  economy: { insertionTravelMm: number; torqueTravelRad: number; torqueReversals: number };
  complications: RecordedEvent[];
  bailouts: RecordedEvent[];
  hints: RecordedEvent[];
  mentor: RecordedEvent[];
}

const ENG = (i: number): EngagementKind => ENGAGEMENT_KINDS[i] ?? "not-in-root";
const PRESS = (i: number): PressureKind => PRESSURE_KINDS[i] ?? "aortic";

export function sideOf(k: EngagementKind | string): "left" | "right" | null {
  if (k.endsWith("-lm")) return "left";
  if (k.endsWith("-rca")) return "right";
  return null;
}
const isApproach = (k: string) => k.startsWith("near-") || k.startsWith("coaxial-");
const isSelective = (k: string) => k.startsWith("selective-") || k.startsWith("deep-");
const isRetreat = (k: string) => ["sinus-level", "ascending-aorta", "not-in-root", "below-valve", "in-lv", "non-selective"].includes(k);

export function wrapAngle(a: number): number {
  let x = a % (2 * Math.PI);
  if (x > Math.PI) x -= 2 * Math.PI;
  if (x < -Math.PI) x += 2 * Math.PI;
  return x;
}

const num = (v: unknown, d = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : d);
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);

/** Analyse a record. Works on records from any host (fields it needs are optional). */
export function analyse(record: ProcedureRecord, facts: CaseFacts = {}, params: AnalysisParams = ANALYSIS_PARAMS): Analysis {
  const frames = FrameTable.from(record.frames);
  const events = record.events.slice().sort((a, b) => a.tWall - b.tWall || a.step - b.step || a.cmd - b.cmd);
  const n = frames.length;
  const t0 = n ? frames.value(0, "tWall") : events[0]?.tWall ?? 0;
  const tEnd = events.find((e) => e.kind === "case-end")?.tWall;
  const t1 = Math.max(tEnd ?? 0, n ? frames.value(n - 1, "tWall") : 0, events.length ? events[events.length - 1].tWall : 0);

  // --- cine runs ---------------------------------------------------------------
  const runs: CineRun[] = [];
  const injections = events.filter((e) => e.kind === "inject");
  let open: RecordedEvent | null = null;
  for (const e of events) {
    if (e.kind === "cine-start") open = e;
    else if (e.kind === "cine-end" && open) {
      const start = open;
      const inj = injections.filter((i) => i.tWall >= start.tWall - 1e-6 && i.tWall <= e.tWall + 1e-6);
      const d = e.data ?? {};
      const durationS = num(d.durationS, e.tWall - start.tWall);
      const rr = num(d.rr, 60 / 72);
      // A host whose bolus starts with the injection (the legacy store) cannot film before contrast
      // arrives; it reports injectStartS: null (or preContrastMeasurable: false) and the run's
      // pre-contrast check is then "not measurable" (null) rather than failed.
      const preMeasurable = d.injectStartS !== null && d.preContrastMeasurable !== false;
      const injectStart = !preMeasurable ? null : d.injectStartS !== undefined ? num(d.injectStartS) : inj.length ? inj[0].tWall - start.tWall : null;
      const peak =
        d.peakS !== undefined && d.peakS !== null
          ? num(d.peakS)
          : injectStart !== null
          ? injectStart + params.fallbackTimeToPeakS
          : !preMeasurable
          ? params.fallbackTimeToPeakS
          : null;
      const postPeakS = peak !== null ? durationS - peak : null;
      const sides = new Set(inj.map((i) => str(i.data?.side)).filter(Boolean));
      const side = (str(d.side) || (sides.size > 1 ? "both" : [...sides][0]) || null) as CineRun["side"];
      const diagnostic = inj.some((i) => i.data?.diagnostic === true);
      runs.push({
        id: `run${runs.length + 1}`,
        startT: start.tWall,
        endT: e.tWall,
        durationS,
        cArm: { laoRao: num(d.laoRao, num(start.data?.laoRao)), cranialCaudal: num(d.cranCaud, num(start.data?.cranCaud)) },
        side,
        injections: inj,
        ml: inj.reduce((a, i) => a + num(i.data?.ml), 0),
        diagnostic,
        preContrastS: injectStart,
        postPeakS,
        rr,
        preContrastOk: !preMeasurable ? null : injectStart !== null && injectStart >= params.minPreContrastS,
        washoutOk: postPeakS !== null && postPeakS >= params.minPostPeakCycles * rr,
        filledVessels: inj.flatMap((i) => (Array.isArray(i.data?.filledVessels) ? (i.data!.filledVessels as string[]) : [])),
      });
      open = null;
    }
  }
  const inRun = (t: number) => runs.some((r) => t >= r.startT - 1e-6 && t <= r.endT + 1e-6) || (open !== null && t >= open.tWall);
  const injectionsOutsideCine = injections.filter((i) => !inRun(i.tWall));

  // --- engagement approaches and catheter tenures ----------------------------------
  const approaches: Approach[] = [];
  const firstSelective: Analysis["firstSelective"] = {};
  const lvEntries: number[] = [];
  const deepEntries: number[] = [];
  const belowValveEntries: number[] = [];
  const catheters: CatheterTenure[] = [];
  const startCath = str(record.meta.context?.catheterId, "initial");
  let cur: CatheterTenure = { id: startCath, startT: t0, endT: t1, failedApproaches: { left: 0, right: 0 }, successes: { left: 0, right: 0 } };
  catheters.push(cur);
  let ap: Approach | null = null;
  const closeApproach = (t: number, success: boolean) => {
    if (!ap) return;
    ap.endT = t;
    ap.success = success;
    approaches.push(ap);
    if (success) cur.successes[ap.side]++;
    else cur.failedApproaches[ap.side]++;
    ap = null;
  };
  let succeededSide: "left" | "right" | null = null;
  for (const e of events) {
    if (e.kind === "catheter") {
      closeApproach(e.tWall, false);
      cur.endT = e.tWall;
      cur = { id: str(e.data?.id, "?"), startT: e.tWall, endT: t1, failedApproaches: { left: 0, right: 0 }, successes: { left: 0, right: 0 } };
      catheters.push(cur);
      succeededSide = null;
      continue;
    }
    if (e.kind !== "engagement") continue;
    const to = str(e.data?.to);
    const side = sideOf(to);
    if (to === "in-lv") lvEntries.push(e.tWall);
    // too low: the "below-valve" class, or (legacy engine) its "sinus-level" class, which it uses for
    // the band just above the valve plane (tip height under 2 mm in its root frame)
    if (to === "below-valve" || (to === "sinus-level" && heightAt(frames, e.tWall) < 2)) belowValveEntries.push(e.tWall);
    if (to.startsWith("deep-")) deepEntries.push(e.tWall);
    if (side && isSelective(to)) {
      if (firstSelective[side] === undefined && to.startsWith("selective-") && !e.data?.conus) firstSelective[side] = e.tWall;
      if (ap && ap.side === side) closeApproach(e.tWall, true);
      else if (!ap && succeededSide !== side) {
        approaches.push({ side, startT: e.tWall, endT: e.tWall, catheterId: cur.id, success: true });
        cur.successes[side]++;
      }
      succeededSide = side;
    } else if (side && isApproach(to)) {
      if (ap && ap.side !== side) closeApproach(e.tWall, false);
      if (!ap && succeededSide !== side) ap = { side, startT: e.tWall, endT: e.tWall, catheterId: cur.id, success: false };
    } else if (isRetreat(to)) {
      closeApproach(e.tWall, false);
      succeededSide = null;
    }
  }
  closeApproach(t1, false);

  // --- frame-based episodes ----------------------------------------------------
  const pushing: Episode[] = [];
  const damped: Episode[] = [];
  const wrongRotations: number[] = [];
  const overRotations: number[] = [];
  const insufficientWithdrawals: number[] = [];
  let pushStart = -1;
  let dampStart = -1;
  let dampMaxIns = 0;
  let dampMinIns = 0;
  let dangerStart = -1;
  let dangerIns = 0;
  let dangerFlagged = false;
  let torqueHigh = 0;
  let insTravel = 0;
  let torqTravel = 0;
  let reversals = 0;
  let lastDir = 0;
  let accDir = 0;
  let lastWrong = -Infinity;
  for (let i = 0; i < n; i++) {
    const t = frames.value(i, "tWall");
    const eng = ENG(frames.value(i, "eng"));
    const press = PRESS(frames.value(i, "press"));
    const res = frames.value(i, "resistance");
    const ci = frames.value(i, "cmdInsertion");
    const ins = frames.value(i, "insertion");
    if (i > 0) {
      const dCi = ci - frames.value(i - 1, "cmdInsertion");
      const dCt = frames.value(i, "cmdTorque") - frames.value(i - 1, "cmdTorque");
      insTravel += Math.abs(dCi);
      torqTravel += Math.abs(dCt);
      if (eng === "ascending-aorta") torqueHigh += Math.abs(dCt);
      // torque reversals with a deadband
      accDir += dCt;
      if (Math.abs(accDir) > params.reversalDeadbandRad) {
        const dir = Math.sign(accDir);
        if (lastDir !== 0 && dir !== lastDir) reversals++;
        lastDir = dir;
        accDir = 0;
      }
      // pushing against resistance: advancing while the resistance is high
      const advancing = dCi > 1e-4 || frames.value(i, "cmdInsertion") - ins > 1;
      if (res >= params.pushResistance && advancing) {
        if (pushStart < 0) pushStart = frames.value(i - 1, "tWall");
      } else if (pushStart >= 0) {
        if (t - pushStart >= params.pushMinS) pushing.push({ startT: pushStart, endT: t, kind: "push" });
        pushStart = -1;
      }
    }
    // damped episodes and whether the operator withdrew
    if (DAMPED_KINDS.includes(press)) {
      if (dampStart < 0) {
        dampStart = t;
        dampMaxIns = ins;
        dampMinIns = ins;
      }
      dampMinIns = Math.min(dampMinIns, ins);
    } else if (dampStart >= 0) {
      damped.push({ startT: dampStart, endT: t, kind: "damped", acted: dampMaxIns - dampMinIns >= params.withdrawMm || t - dampStart < params.ignoredWarningS });
      dampStart = -1;
    }
    // dangerous positions where the operator kept advancing
    const danger = eng === "in-lv" || eng.startsWith("deep-") || eng === "dangerous";
    if (danger) {
      if (dangerStart < 0) {
        dangerStart = t;
        dangerIns = ci;
        dangerFlagged = false;
      } else if (!dangerFlagged && ci - dangerIns > 1) {
        insufficientWithdrawals.push(t);
        dangerFlagged = true;
      }
    } else dangerStart = -1;
    // wrong-way and over-rotation near an ostium
    const target = (eng.endsWith("-rca") ? facts.targetAz?.right : eng.endsWith("-lm") ? facts.targetAz?.left : undefined) ?? (eng === "sinus-level" ? nearestTarget(facts, frames.value(i, "tipAz")) : undefined);
    if (target !== undefined && i > 0) {
      const j = frames.indexAt(t - 1);
      if (j < i) {
        const azNow = frames.value(i, "tipAz");
        const azThen = frames.value(j, "tipAz");
        const errNow = wrapAngle(azNow - target);
        const errThen = wrapAngle(azThen - target);
        const dTorque = frames.value(i, "cmdTorque") - frames.value(j, "cmdTorque");
        const moved = wrapAngle(azNow - azThen);
        if (Math.abs(errThen) < params.wrongRotationWindowRad && Math.abs(errNow) - Math.abs(errThen) > params.wrongRotationRad && Math.sign(moved) === Math.sign(dTorque) && Math.sign(errNow) === Math.sign(errThen) && t - lastWrong > 3) {
          wrongRotations.push(t);
          lastWrong = t;
        }
        if (Math.sign(errNow) !== Math.sign(errThen) && Math.abs(errNow) > params.overRotationRad && Math.abs(errThen) < Math.PI / 2 && t - lastWrong > 3) {
          overRotations.push(t);
          lastWrong = t;
        }
      }
    }
  }
  const tLast = n ? frames.value(n - 1, "tWall") : t1;
  if (pushStart >= 0 && tLast - pushStart >= params.pushMinS) pushing.push({ startT: pushStart, endT: tLast, kind: "push" });
  if (dampStart >= 0) damped.push({ startT: dampStart, endT: tLast, kind: "damped", acted: dampMaxIns - dampMinIns >= params.withdrawMm || tLast - dampStart < params.ignoredWarningS });
  for (const e of events) if (e.kind === "whip" && num(e.data?.magnitude) >= 0.5) overRotations.push(e.tWall);

  return {
    t0,
    t1,
    frames,
    events,
    runs,
    approaches,
    catheters,
    pushing,
    damped,
    lvEntries,
    deepEntries,
    belowValveEntries,
    injections,
    injectionsOutsideCine,
    firstSelective,
    torqueTravelHigh: torqueHigh,
    wrongRotations,
    overRotations: [...new Set(overRotations)].sort((a, b) => a - b),
    insufficientWithdrawals,
    economy: { insertionTravelMm: insTravel, torqueTravelRad: torqTravel, torqueReversals: reversals },
    complications: events.filter((e) => e.kind === "complication"),
    bailouts: events.filter((e) => e.kind === "bailout"),
    hints: events.filter((e) => e.kind === "hint"),
    mentor: events.filter((e) => e.kind === "mentor"),
  };
}

function heightAt(f: FrameTable, t: number): number {
  const i = f.indexAt(t);
  return i < 0 ? Infinity : f.value(i, "tipHeight");
}

function nearestTarget(f: CaseFacts, az: number): number | undefined {
  const l = f.targetAz?.left;
  const r = f.targetAz?.right;
  if (l === undefined) return r;
  if (r === undefined) return l;
  return Math.abs(wrapAngle(az - l)) <= Math.abs(wrapAngle(az - r)) ? l : r;
}

/** Engagement and pressure class at a wall time (from frames). */
export function stateAt(a: Analysis, t: number): { eng: EngagementKind; press: PressureKind } {
  const i = a.frames.indexAt(t);
  if (i < 0) return { eng: "not-in-root", press: "aortic" };
  return { eng: ENG(a.frames.value(i, "eng")), press: PRESS(a.frames.value(i, "press")) };
}
