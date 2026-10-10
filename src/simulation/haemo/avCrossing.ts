// ---------------------------------------------------------------------------
// The aortic valve study of the haemodynamics lab (haemo-aortic-stenosis-studies).
//
// Three parts, one pure reducer:
//   1. Cross or not. The learner reads the echo report (HaemoScenario.avStudy)
//      and decides. Crossing when the non-invasive data did not call for it is
//      an unnecessary crossing (isUnnecessaryCrossing, the rule the diagnostic
//      lab's AS crossing shares).
//   2. The crossing. Catheter (5 F AL1, JR4, pigtail) and wire (straight
//      hydrophilic, standard J, stiff straight), an optional aortogram for the
//      leaflet opening, attempts at the orifice that succeed with a per-attempt
//      probability (MODEL PARAMETERS, not clinical success rates), a
//      manipulation-quality monitor that flags forceful movement, an embolic
//      risk that rises with time at the valve, forceful moves and valve passages
//      (qualitative only), a possible neurological event after a high-risk
//      crossing, and the exchange to a pigtail over an exchange-length J wire.
//      Sources: lesson hb-specific-conditions-as ('Deciding whether to cross',
//      'Crossing the stenotic valve', Oxford ch 5; Omran 2003).
//   3. The measurement. The gradient by a second arterial catheter
//      (simultaneous), against the sheath side-arm (femoral) or by pullback
//      (peak-to-peak, and the catheter comes back out of the LV); and, in the
//      low-flow low-gradient scenarios, the staged dobutamine study with a
//      results table the learner fills in (Academy lesson hd-valves-as-area).
//
// Framework-free and deterministic (a seeded draw per attempt), so the tests
// drive it directly. The panel (src/ui/haemo/ValvePanel.tsx) keeps the
// haemodynamic study (src/simulation/haemoStudy.ts) in step: the catheter in
// the LV, the arterial side-arm and the hypotension event.
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../content/lab/tips";
import type { LabRaises } from "../../content/lab/raisable/waiting";
import type { DecisionRecord } from "../../mentor/ledger";
import { gorlinAVA } from "../calc";
import { SCENARIO_BY_ID, aorticGradient, applyModifier, gorlinLive, measure, sample, timeline, type CtCalciumScore, type HaemoScenario, type LiveGorlin } from "../haemo";
import { CALC_TOLERANCE, HAEMO_HYPOTENSION_MAP, withinTolerance } from "../haemoStudy";

// ---------------------------------------------------------------------------
// Kit
// ---------------------------------------------------------------------------

export type CrossCatheter = "AL1" | "JR4" | "pigtail";
export type CrossWire = "straight-hydrophilic" | "standard-j" | "stiff-straight";

/** Generic names only. */
export const CROSS_CATHETERS: readonly { id: CrossCatheter; label: string; note: string }[] = [
  { id: "AL1", label: "5 F AL1", note: "Points the wire at the orifice; Oxford's catheter for a stenotic valve" },
  { id: "JR4", label: "5 F JR4", note: "Can direct the wire at a valve that is hard to cross" },
  { id: "pigtail", label: "5 F pigtail", note: "Sits safely in the cavity, but its loop does not aim a wire" },
];
export const CROSS_WIRES: readonly { id: CrossWire; label: string; note: string }[] = [
  { id: "straight-hydrophilic", label: "straight hydrophilic", note: "Oxford's wire for crossing a stenotic valve" },
  { id: "standard-j", label: "standard J", note: "Atraumatic in the aorta; the J will not enter a small orifice" },
  { id: "stiff-straight", label: "stiff straight", note: "Straight, but stiff at the leaflets" },
];
export const catheterLabel = (c: CrossCatheter | null) => CROSS_CATHETERS.find((x) => x.id === c)?.label ?? "none";
export const wireLabel = (w: CrossWire | null) => CROSS_WIRES.find((x) => x.id === w)?.label ?? "none";

/** The kit Oxford gives for a stenotic valve (hb-specific-conditions-as, 'Crossing the stenotic valve', step 2). */
export const RECOMMENDED_KIT = { catheter: "AL1", wire: "straight-hydrophilic" } as const satisfies { catheter: CrossCatheter; wire: CrossWire };

// ---------------------------------------------------------------------------
// MODEL PARAMETERS of the crossing. The lesson gives an order (an AL1 aiming a straight hydrophilic
// wire crosses a stenotic valve where a pigtail does not; an aortogram's landmark helps), not rates:
// none of these is a clinical success rate, and the lab never shows them.
// ---------------------------------------------------------------------------

/** Chance that one attempt at the orifice gets the wire across, by catheter (before the wire factor). */
export const CROSS_P_CATHETER: Readonly<Record<CrossCatheter, number>> = { AL1: 0.4, JR4: 0.25, pigtail: 0.08 };
/** Multiplier on that chance by wire. */
export const CROSS_P_WIRE: Readonly<Record<CrossWire, number>> = { "straight-hydrophilic": 1, "stiff-straight": 0.6, "standard-j": 0.3 };
/** Multiplier once an aortogram has shown where the leaflets open. */
export const CROSS_P_AORTOGRAM = 1.25;
/** Forceful pushing does not cross more often; it buckles the wire against the leaflets. */
export const CROSS_P_FORCEFUL = 1;
export const CROSS_P_MAX = 0.7;
/** Seconds of wire work at the valve per attempt. */
export const ATTEMPT_SECONDS: Readonly<Record<AttemptStyle, number>> = { controlled: 15, forceful: 10 };
/** Embolic risk score: time at the valve (per this many seconds), each forceful move, each valve passage. */
export const RISK_SECONDS = 120;
export const RISK_PER_FORCEFUL = 0.6;
export const RISK_PER_PASSAGE = 0.3;
/** Score bands of the qualitative embolic risk. */
export const RISK_RISING = 1;
export const RISK_HIGH = 2;
/** Manipulation quality: 100 less this per forceful move, and one point per this many seconds at the valve beyond the allowance. */
export const QUALITY_PER_FORCEFUL = 15;
export const QUALITY_ALLOWANCE_S = 90;
export const QUALITY_SECONDS_PER_POINT = 3;

export type AttemptStyle = "controlled" | "forceful";

/** The chance that one attempt crosses (MODEL PARAMETER). */
export function crossingProbability(catheter: CrossCatheter, wire: CrossWire, aortogram: boolean, style: AttemptStyle = "controlled"): number {
  const p = CROSS_P_CATHETER[catheter] * CROSS_P_WIRE[wire] * (aortogram ? CROSS_P_AORTOGRAM : 1) * (style === "forceful" ? CROSS_P_FORCEFUL : 1);
  return Math.min(CROSS_P_MAX, p);
}

/** Expected attempts to cross with a kit (geometric mean, 1/p). */
export const expectedAttempts = (catheter: CrossCatheter, wire: CrossWire, aortogram = false) => 1 / crossingProbability(catheter, wire, aortogram);

/** A deterministic draw in [0, 1) for attempt n of a study (mulberry32 on the seed and the attempt). */
export function attemptDraw(seed: number, n: number): number {
  let a = (seed ^ Math.imul(n + 1, 0x9e3779b9)) >>> 0;
  a = (a + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** A stable seed from a scenario id. */
export function seedOf(id: string): number {
  let h = 2166136261;
  for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// Gradients by method (lesson hb-specific-conditions-as, 'Measuring the gradient')
// ---------------------------------------------------------------------------

export type GradientMethod = "simultaneous" | "femoral" | "pullback";
export const GRADIENT_METHODS: readonly { id: GradientMethod; label: string; note: string }[] = [
  { id: "simultaneous", label: "LV + second aortic catheter", note: "simultaneous LV and aortic pressures: the true mean gradient" },
  { id: "femoral", label: "LV + sheath side-arm", note: "LV against femoral pressure: less accurate" },
  { id: "pullback", label: "Pullback LV to aorta", note: "peak-to-peak on successive beats; the catheter comes back out of the LV" },
];

/**
 * The femoral trace as a delayed, amplified copy of the central aortic one (Academy lesson
 * hd-waveforms-left, 'Aorta': peripherally the systolic and pulse pressures rise and the upstroke is
 * delayed). Both values are MODEL PARAMETERS.
 */
export const FEMORAL_DELAY_S = 0.06;
export const FEMORAL_PULSE_AMPLIFICATION = 1.12;

/** Sampling options of the valve study's traces (no respiration, no ectopics), hoisted so render paths allocate nothing per sample. */
export const NO_RESP = { respiration: false, pvc: false } as const;

/** Femoral pressure at time t (no respiration), from the central aortic trace. */
export function femoralPressure(s: HaemoScenario, t: number): number {
  const ao = sample(s, "Ao", t - FEMORAL_DELAY_S, NO_RESP);
  return s.ao.dia + (ao - s.ao.dia) * FEMORAL_PULSE_AMPLIFICATION;
}

/** Mean LV-femoral gradient over the LV ejection period, read on the overlay as recorded (no time shift), mmHg. */
export function femoralGradient(s: HaemoScenario): number {
  const tl = timeline(s);
  let sum = 0;
  const M = 200;
  for (let i = 0; i <= M; i++) {
    const t = tl.tAO + (tl.sep * i) / M;
    sum += Math.max(0, sample(s, "LV", t, NO_RESP) - femoralPressure(s, t));
  }
  return sum / (M + 1);
}

/** What the recorder gives for a method, in whole mmHg: the mean gradient (simultaneous, femoral) or the peak-to-peak difference (pullback). */
export interface GradientReading {
  method: GradientMethod;
  mean?: number;
  peakToPeak?: number;
}

export function gradientReading(s: HaemoScenario, method: GradientMethod): GradientReading {
  if (method === "simultaneous") return { method, mean: Math.round(aorticGradient(s).mean) };
  if (method === "femoral") return { method, mean: Math.round(femoralGradient(s)) };
  return { method, peakToPeak: measure(s, "LV").sys - measure(s, "Ao").sys };
}

// ---------------------------------------------------------------------------
// Low-flow low-gradient aortic stenosis (Academy lesson hd-valves-as-area, 'Interpreting the
// dobutamine response' and 'Invasive dobutamine study'; lesson hb-specific-conditions-as,
// 'Low-flow low-gradient stenosis: the decision sequence', 2025 ESC/EACTS)
// ---------------------------------------------------------------------------

export const LFLG = {
  /** valve area at or below which stenosis is severe (cm²) */
  severeAreaCm2: 1.0,
  /** mean gradient at or above which stenosis is severe, and at which the infusion stops (mmHg) */
  severeMeanGradient: 40,
  /** stroke volume rise that defines flow reserve (fraction) */
  flowReserveSvRise: 0.2,
  /** stroke volume index at or below which flow is low (mL/m²) */
  lowFlowSvi: 35,
  source: "hd-valves-as-area (interpreting the dobutamine response); hb-specific-conditions-as (2025 ESC/EACTS)",
} as const;

/**
 * CT valve calcium thresholds (Agatston units) from lesson hb-specific-conditions-as, step 3 of the
 * low-flow low-gradient sequence (2025 ESC/EACTS): severe above, very specific above, unlikely below.
 */
export const CT_CALCIUM_AU = {
  male: { severe: 2000, verySpecific: 3000, unlikely: 1600 },
  female: { severe: 1200, verySpecific: 1600, unlikely: 800 },
} as const;

export type CtCalciumReading = "very-specific" | "severe" | "inconclusive" | "unlikely";
export function ctCalciumReading(c: CtCalciumScore): CtCalciumReading {
  const t = CT_CALCIUM_AU[c.sex];
  if (c.agatston > t.verySpecific) return "very-specific";
  if (c.agatston > t.severe) return "severe";
  if (c.agatston < t.unlikely) return "unlikely";
  return "inconclusive";
}
export const CT_CALCIUM_TEXT: Record<CtCalciumReading, string> = {
  "very-specific": "above the very specific threshold: severe stenosis",
  severe: "above the severe threshold",
  inconclusive: "between the thresholds: inconclusive",
  unlikely: "below the threshold: severe stenosis unlikely",
};

/** Reasons the module gives to stop the infusion that the lab can show: a mean gradient of 40 mmHg or more, and hypotension (the lab's mean arterial pressure threshold). */
export function stopCriteria(g: Pick<LiveGorlin, "meanGradient" | "map">): string[] {
  const out: string[] = [];
  if (g.meanGradient >= LFLG.severeMeanGradient) out.push("mean gradient 40 mmHg or more");
  if (g.map < HAEMO_HYPOTENSION_MAP) out.push("hypotension");
  return out;
}

/** The stage the infusion ends at: the first stage on dobutamine that meets a stop criterion, else the top dose. */
export function peakStageIndex(s: HaemoScenario): number {
  const mods = s.modifiers ?? [];
  for (let i = 1; i < mods.length; i++) if (stopCriteria(gorlinLive(s, mods[i])).length) return i;
  return mods.length - 1;
}

export type LflgResponse = "true-severe" | "pseudo-severe" | "no-flow-reserve" | "indeterminate";
export const LFLG_RESPONSE_TEXT: Record<LflgResponse, string> = {
  "true-severe": "true severe stenosis: flow reserve, the gradient reaches 40 mmHg or more and the area stays at or below 1.0 cm²",
  "pseudo-severe": "pseudo-severe stenosis: flow reserve, the area rises above 1.0 cm² and the gradient stays below 40 mmHg",
  "no-flow-reserve": "no flow reserve: the stroke volume rises by less than 20%, so the study is indeterminate and the CT calcium score helps decide",
  indeterminate: "flow reserve without a clear answer from the gradient and area",
};

/** How the scenario responds to dobutamine, from its baseline and peak stages (the reading the lesson's table gives). */
export function lflgResponse(s: HaemoScenario): LflgResponse | null {
  const mods = s.modifiers;
  if (!mods || mods.length < 2) return null;
  const base = gorlinLive(s, mods[0]);
  const peak = gorlinLive(s, mods[peakStageIndex(s)]);
  if (peak.sv / base.sv - 1 < LFLG.flowReserveSvRise) return "no-flow-reserve";
  if (peak.meanGradient >= LFLG.severeMeanGradient && peak.ava <= LFLG.severeAreaCm2) return "true-severe";
  if (peak.ava > LFLG.severeAreaCm2 && peak.meanGradient < LFLG.severeMeanGradient) return "pseudo-severe";
  return "indeterminate";
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type CrossDecision = "cross" | "no-cross";
/** The neurological event after a high-risk crossing: none, waiting for the learner's answer, answered. */
export type NeuroState = "none" | "pending" | "stopped" | "continued";

export interface RecordedGradient extends GradientReading {
  /** dobutamine stage index when recorded (null without an infusion) */
  stage: number | null;
}

/** What the learner entered for one value of a stage row. */
export interface StageEntry {
  value: number;
  attempts: number;
  accepted: boolean;
  firstAccepted: boolean;
}

/** One row of the dobutamine results table: the read-outs as recorded, and the learner's entries. */
export interface StageRecord {
  dose: number;
  hr: number;
  /** output (thermodilution, L/min, 2 dp) */
  co: number;
  /** systolic ejection period (s, 2 dp) */
  sep: number;
  /** mean gradient by the method in use (whole mmHg) */
  meanGradient: number;
  method: "simultaneous" | "femoral";
  /** mean arterial pressure (whole mmHg) */
  map: number;
  sv?: StageEntry;
  ava?: StageEntry;
}

export interface AvStudyState {
  scenarioId: string;
  seed: number;
  decision: CrossDecision | null;
  catheter: CrossCatheter | null;
  wire: CrossWire | null;
  aortogram: boolean;
  attempts: number;
  forceful: number;
  /** seconds of wire work at the valve */
  valveTimeS: number;
  wireAcross: boolean;
  /** a catheter is in the LV (the crossing catheter, or the pigtail after the exchange) */
  inLv: boolean;
  /** valve passages so far (a pullback and a re-cross count again) */
  passages: number;
  /** the pigtail is in the LV (crossed with it, or exchanged over an exchange-length J wire) */
  pigtailInLv: boolean;
  /** the crossing catheter was exchanged for a pigtail at least once */
  exchanged: boolean;
  secondArterial: boolean;
  neuro: NeuroState;
  gradients: RecordedGradient[];
  /** dobutamine: the stage now (index into the scenario's modifiers), null before the baseline */
  stage: number | null;
  infusionStopped: boolean;
  /** the dose went up after a stop criterion was met */
  pastStop: boolean;
  stages: Partial<Record<number, StageRecord>>;
  ctShown: boolean;
  /** the last thing the manipulation monitor flagged (live: what the operator feels and sees) */
  flag: string | null;
}

export function initialAvStudy(scenarioId: string, seed = seedOf(scenarioId)): AvStudyState {
  return {
    scenarioId,
    seed,
    decision: null,
    catheter: null,
    wire: null,
    aortogram: false,
    attempts: 0,
    forceful: 0,
    valveTimeS: 0,
    wireAcross: false,
    inLv: false,
    passages: 0,
    pigtailInLv: false,
    exchanged: false,
    secondArterial: false,
    neuro: "none",
    gradients: [],
    stage: null,
    infusionStopped: false,
    pastStop: false,
    stages: {},
    ctShown: false,
    flag: null,
  };
}

export type AvAction =
  | { type: "decide"; decision: CrossDecision }
  | { type: "catheter"; catheter: CrossCatheter }
  | { type: "wire"; wire: CrossWire }
  /** an aortogram through the catheter in the aortic root */
  | { type: "aortogram"; inRoot: boolean }
  /** one attempt at the orifice with the catheter in the aortic root */
  | { type: "attempt"; style: AttemptStyle; inRoot: boolean }
  /** follow the wire with the catheter into the LV */
  | { type: "advance" }
  /** exchange the crossing catheter for a pigtail over an exchange-length J wire */
  | { type: "exchange" }
  | { type: "neuro"; response: "stop" | "continue" }
  | { type: "second-arterial"; on: boolean }
  /** record the gradient by a method; the femoral method needs the sheath side-arm on the recorder */
  | { type: "record-gradient"; method: GradientMethod; artLine: boolean }
  /** the catheter left the LV by another route (the catheter controls) */
  | { type: "withdraw" }
  /** dobutamine: take the baseline, raise the dose, stop the infusion */
  | { type: "dobutamine"; step: "baseline" | "increase" | "stop" }
  /** record the stage's read-outs; the output needs the right heart catheter in the PA or wedge */
  | { type: "record-stage"; artLine: boolean; outputReady: boolean }
  | { type: "stage-entry"; stage: number; field: "sv" | "ava"; value: number }
  | { type: "show-ct" };

// ---------------------------------------------------------------------------
// Derived views
// ---------------------------------------------------------------------------

export const avScenario = (st: AvStudyState): HaemoScenario => SCENARIO_BY_ID[st.scenarioId];

/** Is this an aortic valve study (a scenario with an echo report and a cross-or-not decision)? */
export const isAvStudy = (s: HaemoScenario | undefined): boolean => !!s?.avStudy;

export type EmbolicRisk = "low" | "rising" | "high";
export function embolicRiskScore(st: Pick<AvStudyState, "valveTimeS" | "forceful" | "passages">): number {
  return st.valveTimeS / RISK_SECONDS + RISK_PER_FORCEFUL * st.forceful + RISK_PER_PASSAGE * st.passages;
}
/** Qualitative embolic risk (MODEL PARAMETER bands): it rises with time at the valve, forceful moves and valve passages. */
export function embolicRisk(st: Pick<AvStudyState, "valveTimeS" | "forceful" | "passages">): EmbolicRisk {
  const r = embolicRiskScore(st);
  return r >= RISK_HIGH ? "high" : r >= RISK_RISING ? "rising" : "low";
}

/** Manipulation quality, 0-100 (MODEL PARAMETER): forceful moves and long wire work at the valve cost points. */
export function manipulationQuality(st: Pick<AvStudyState, "valveTimeS" | "forceful">): number {
  const q = 100 - QUALITY_PER_FORCEFUL * st.forceful - Math.max(0, st.valveTimeS - QUALITY_ALLOWANCE_S) / QUALITY_SECONDS_PER_POINT;
  return Math.max(0, Math.min(100, Math.round(q)));
}

/**
 * The scoring rule for an unnecessary crossing, shared with the diagnostic lab's aortic stenosis
 * crossing (diag-lv-aorta-task): the valve was passed when the non-invasive data did not call for it.
 * The embolic risk comes from valve passage itself (Omran 2003, as the lesson reports it).
 */
export function isUnnecessaryCrossing(crossingIndicated: boolean, valvePassed: boolean): boolean {
  return valvePassed && !crossingIndicated;
}

/** Has the wire or a catheter passed the valve in this study? */
export const valvePassed = (st: AvStudyState): boolean => st.wireAcross || st.passages > 0;

/** Was this study's crossing unnecessary? */
export function unnecessaryCrossing(st: AvStudyState): boolean {
  const spec = avScenario(st)?.avStudy;
  return !!spec && isUnnecessaryCrossing(spec.crossingIndicated, valvePassed(st));
}

/**
 * The stage whose haemodynamics are on the traces now: the dose stage while the infusion runs, the
 * baseline once it has been stopped (the effect wears off), null before the baseline.
 */
export function liveStageIndex(st: Pick<AvStudyState, "stage" | "infusionStopped">): number | null {
  if (st.stage === null) return null;
  return st.infusionStopped ? 0 : st.stage;
}

/** The scenario as it is now: at the dobutamine stage while the infusion runs, at the baseline once it is stopped, else itself. */
export function avStageScenario(st: AvStudyState): HaemoScenario {
  const s = avScenario(st);
  const i = liveStageIndex(st);
  const m = i === null ? null : s.modifiers?.[i];
  return m ? applyModifier(s, m) : s;
}

/** The read-outs of the stage on the traces now (null before the baseline). */
export function currentStageLive(st: AvStudyState): LiveGorlin | null {
  const s = avScenario(st);
  const i = liveStageIndex(st);
  if (i === null || !s.modifiers?.[i]) return null;
  return gorlinLive(s, s.modifiers[i]);
}

/** Events the valve study raises now: hypotension while the infusion has the mean arterial pressure below the lab's threshold. */
export function avStudyEvents(st: AvStudyState): LabEvent[] {
  const g = currentStageLive(st);
  return g && !st.infusionStopped && g.map < HAEMO_HYPOTENSION_MAP ? ["hypotension"] : [];
}

/** What the crossing controls may do now. */
export function canAttempt(st: AvStudyState): boolean {
  return st.decision === "cross" && !!st.catheter && !!st.wire && !st.wireAcross && !st.inLv && st.neuro !== "pending" && st.neuro !== "stopped";
}

/** Which stage-row values are graded, from the recorded read-outs: SV = CO / HR; AVA by Gorlin from the recorded numbers. */
export function stageReference(r: StageRecord, field: "sv" | "ava"): number {
  if (field === "sv") return (r.co * 1000) / r.hr;
  return r.meanGradient > 0 ? gorlinAVA(r.co, r.hr, r.sep, r.meanGradient) : NaN;
}

/** Tolerances of the stage table: AVA as the calculation panel's (MODEL PARAMETER); stroke volume within 10% (MODEL PARAMETER). */
export const STAGE_SV_REL_TOLERANCE = 0.1;
export function stageEntryOk(r: StageRecord, field: "sv" | "ava", value: number): boolean {
  const ref = stageReference(r, field);
  if (!Number.isFinite(value) || !Number.isFinite(ref)) return false;
  if (field === "ava") return withinTolerance("ava", value, ref);
  return Math.abs(value - ref) <= Math.abs(ref) * STAGE_SV_REL_TOLERANCE + 1e-9;
}
export const AVA_TOLERANCE = CALC_TOLERANCE.ava;

// ---------------------------------------------------------------------------
// The reducer
// ---------------------------------------------------------------------------

const FLAGS = {
  forceful: "Forceful push at the valve: the wire buckled against the leaflets",
  long: "Prolonged wire work at the valve",
};

export function avStudyReducer(st: AvStudyState, a: AvAction): AvStudyState {
  const s = avScenario(st);
  if (!s?.avStudy) return st;
  const halted = st.neuro === "pending" || st.neuro === "stopped";
  switch (a.type) {
    case "decide":
      // the decision stands once anything has been tried at the valve
      if (st.attempts > 0 || valvePassed(st) || st.decision === a.decision) return st;
      return { ...st, decision: a.decision };
    case "catheter":
      if (st.inLv || st.wireAcross || st.catheter === a.catheter) return st;
      return { ...st, catheter: a.catheter };
    case "wire":
      if (st.inLv || st.wireAcross || st.wire === a.wire) return st;
      return { ...st, wire: a.wire };
    case "aortogram":
      if (!a.inRoot || st.decision !== "cross" || halted) return st;
      return { ...st, aortogram: true };
    case "attempt": {
      if (!a.inRoot || !canAttempt(st)) return st;
      const p = crossingProbability(st.catheter!, st.wire!, st.aortogram, a.style);
      const crossed = attemptDraw(st.seed, st.attempts) < p;
      const forceful = st.forceful + (a.style === "forceful" ? 1 : 0);
      const valveTimeS = st.valveTimeS + ATTEMPT_SECONDS[a.style];
      const flag = a.style === "forceful" ? FLAGS.forceful : valveTimeS > QUALITY_ALLOWANCE_S ? FLAGS.long : null;
      return { ...st, attempts: st.attempts + 1, forceful, valveTimeS, wireAcross: crossed, flag };
    }
    case "advance": {
      if (!st.wireAcross || st.inLv || halted) return st;
      const next: AvStudyState = { ...st, inLv: true, passages: st.passages + 1, pigtailInLv: st.catheter === "pigtail", flag: null };
      // a crossing after high-risk manipulation is followed by a neurological event the learner must answer
      if (st.neuro === "none" && embolicRisk(next) === "high") next.neuro = "pending";
      return next;
    }
    case "exchange":
      if (!st.inLv || st.pigtailInLv || halted) return st;
      return { ...st, pigtailInLv: true, exchanged: true };
    case "neuro":
      if (st.neuro !== "pending") return st;
      return { ...st, neuro: a.response === "stop" ? "stopped" : "continued" };
    case "second-arterial":
      if (st.secondArterial === a.on || st.decision !== "cross") return st;
      return { ...st, secondArterial: a.on };
    case "record-gradient": {
      if (!st.inLv || halted) return st;
      if (a.method === "simultaneous" && !st.secondArterial) return st;
      if (a.method === "femoral" && !a.artLine) return st;
      const rec: RecordedGradient = { ...gradientReading(avStageScenario(st), a.method), stage: liveStageIndex(st) };
      const next = { ...st, gradients: [...st.gradients, rec] };
      // a pullback brings the catheter back into the aorta: the LV pressure is lost until the valve is crossed again
      return a.method === "pullback" ? { ...next, inLv: false, wireAcross: false, pigtailInLv: false } : next;
    }
    case "withdraw":
      if (!st.inLv && !st.wireAcross) return st;
      return { ...st, inLv: false, wireAcross: false, pigtailInLv: false };
    case "dobutamine": {
      const mods = s.modifiers;
      if (!mods?.length || st.infusionStopped || halted) return st;
      if (a.step === "baseline") return st.stage === null && st.inLv ? { ...st, stage: 0 } : st;
      if (st.stage === null) return st;
      if (a.step === "stop") return { ...st, infusionStopped: true };
      if (st.stage >= mods.length - 1) return st;
      const met = stopCriteria(gorlinLive(s, mods[st.stage])).length > 0 && st.stage > 0;
      return { ...st, stage: st.stage + 1, pastStop: st.pastStop || met };
    }
    case "record-stage": {
      if (st.stage === null || st.infusionStopped || !st.inLv || !a.outputReady || halted) return st;
      const method = st.secondArterial ? "simultaneous" : a.artLine ? "femoral" : null;
      if (!method) return st;
      const x = avStageScenario(st);
      const g = gorlinLive(s, s.modifiers![st.stage]);
      const prev = st.stages[st.stage];
      const r: StageRecord = {
        dose: g.dose,
        hr: g.hr,
        co: Math.round(g.co * 100) / 100,
        sep: Math.round(g.sep * 100) / 100,
        meanGradient: gradientReading(x, method).mean!,
        method,
        map: Math.round(g.map),
        sv: prev?.sv,
        ava: prev?.ava,
      };
      return { ...st, stages: { ...st.stages, [st.stage]: r } };
    }
    case "stage-entry": {
      const r = st.stages[a.stage];
      if (!r || !Number.isFinite(a.value)) return st;
      const ok = stageEntryOk(r, a.field, a.value);
      const prev = r[a.field];
      const e: StageEntry = { value: a.value, attempts: (prev?.attempts ?? 0) + 1, accepted: ok, firstAccepted: prev ? prev.firstAccepted : ok };
      return { ...st, stages: { ...st.stages, [a.stage]: { ...r, [a.field]: e } } };
    }
    case "show-ct": {
      if (!s.avStudy.ctCalcium || st.ctShown) return st;
      // with a dobutamine study the score comes after it (the lesson's sequence); otherwise with the report
      if (s.modifiers?.length && !st.infusionStopped) return st;
      return { ...st, ctShown: true };
    }
  }
}

// ---------------------------------------------------------------------------
// Debrief: the scored decisions of the study, for the run's ledger
// ---------------------------------------------------------------------------

export type AvDecision = Omit<DecisionRecord, "t">;

const LESSON = "hb-specific-conditions-as";

/** The decisions the study scores, as the run's ledger records them (only those the learner has reached). */
export function avDecisions(st: AvStudyState): AvDecision[] {
  const s = avScenario(st);
  const spec = s?.avStudy;
  if (!spec) return [];
  const out: AvDecision[] = [];
  if (st.decision) {
    const want: CrossDecision = spec.crossingIndicated ? "cross" : "no-cross";
    const text = (d: CrossDecision) => (d === "cross" ? "Cross the valve" : "Do not cross: coronary angiography only");
    out.push({ id: "av-cross-decision", stage: "left-heart", label: "Cross the aortic valve or not", correct: st.decision === want, expected: text(want), given: text(st.decision), lessonId: LESSON, tipIds: ["haemo-as-cross-only-if-discordant"] });
  }
  if (valvePassed(st)) {
    out.push({ id: "av-unnecessary-crossing", stage: "left-heart", label: "Valve passage", correct: !unnecessaryCrossing(st), expected: spec.crossingIndicated ? "Crossed: indicated" : "Not crossed", given: "Crossed", lessonId: LESSON, tipIds: ["haemo-as-cross-only-if-discordant"] });
  }
  if (st.attempts > 0 && st.catheter && st.wire) {
    const ok = st.catheter === RECOMMENDED_KIT.catheter && st.wire === RECOMMENDED_KIT.wire;
    out.push({ id: "av-crossing-kit", stage: "left-heart", label: "Crossing catheter and wire", correct: ok, expected: `${catheterLabel(RECOMMENDED_KIT.catheter)} with a ${wireLabel(RECOMMENDED_KIT.wire)} wire`, given: `${catheterLabel(st.catheter)} with a ${wireLabel(st.wire)} wire`, lessonId: LESSON, tipIds: ["haemo-as-al1-straight-wire"] });
    out.push({ id: "av-manipulation", stage: "left-heart", label: "Wire manipulation at the valve", correct: st.forceful === 0, expected: "Controlled movements only", given: st.forceful ? `${st.forceful} forceful push${st.forceful > 1 ? "es" : ""}, ${st.valveTimeS} s at the valve` : `Controlled, ${st.valveTimeS} s at the valve`, lessonId: LESSON, tipIds: ["haemo-as-al1-straight-wire"] });
  }
  if (st.neuro === "stopped" || st.neuro === "continued") {
    out.push({ id: "av-neuro-event", stage: "left-heart", label: "Neurological event after crossing", correct: st.neuro === "stopped", expected: "Stop manipulation and call the stroke team", given: st.neuro === "stopped" ? "Stopped and called the stroke team" : "Carried on with the study", lessonId: LESSON });
  }
  if (st.gradients.length) {
    const first = st.gradients[0].method;
    out.push({ id: "av-gradient-method", stage: "valves", label: "First gradient recorded", correct: first === "simultaneous", expected: "Simultaneous LV and aortic pressures before any pullback", given: GRADIENT_METHODS.find((m) => m.id === first)!.label, lessonId: LESSON, tipIds: ["haemo-as-simultaneous-gradient"] });
  }
  if (s.modifiers?.length && st.stage !== null) {
    const visited = Object.keys(st.stages).length;
    const rows = Object.values(st.stages).filter((r): r is StageRecord => !!r);
    const filled = rows.filter((r) => r.sv?.firstAccepted && r.ava?.firstAccepted).length;
    out.push({ id: "av-stage-table", stage: "calculations", label: "Dobutamine results table", correct: visited >= 2 && filled === visited, expected: "Every stage recorded with stroke volume and Gorlin area worked out", given: `${filled} of ${visited} stage rows right at the first entry`, lessonId: "hd-valves-as-area" });
    out.push({ id: "av-dobutamine-stop", stage: "valves", label: "Stopping the infusion", correct: !st.pastStop, expected: "Stop at a mean gradient of 40 mmHg or more, or hypotension", given: st.pastStop ? "Dose raised after a stop criterion" : "Stopped in time", lessonId: "hd-valves-as-area" });
  }
  return out;
}

/** A short debrief of the crossing for the learner, after the study (quality and risk are not shown live outside guided mode). */
export function crossingSummary(st: AvStudyState): { quality: number; risk: EmbolicRisk; attempts: number; seconds: number; unnecessary: boolean } {
  return { quality: manipulationQuality(st), risk: embolicRisk(st), attempts: st.attempts, seconds: st.valveTimeS, unnecessary: unnecessaryCrossing(st) };
}

// ---------------------------------------------------------------------------
// What this event source reports (the haemodynamics lab's tip context reports these through
// src/ui/lab/haemoTips.ts: the scenario events through HaemoScenario.events, hypotension through
// the 'raise' action of the study)
// ---------------------------------------------------------------------------

export const raises: LabRaises = {
  lab: "haemo",
  phases: ["left-heart", "valves"],
  events: ["aortic-stenosis", "low-flow-aortic-stenosis", "hypotension"],
};

