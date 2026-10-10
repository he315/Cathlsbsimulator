// ---------------------------------------------------------------------------
// Patient events from the patient engine (found-lab-session-plumbing): one
// adapter from PatientEngine vitals to the tip vocabulary's patient events, so
// that a hypotension, VF or contrast-reaction tip appears in every lab that
// runs the engine (diagnostic, PCI, full case, physiology), from the same
// rules. A lab calls the adapter once per monitor update and raises what it
// returns into its EventLog; the log's hold keeps a transient event visible.
//
// What the adapter reads is what the operator could see or be told: the
// arterial line while it shows an arterial waveform (the catheter tip in the
// aorta), else the last cuff reading, the monitor rhythm
// and rate, SpO2, the ST analysis, the patient's symptoms, the contrast count
// and the ACT only once it has been measured. Values the lab cannot show
// without an investigation are gated by an observation the lab passes in: the
// LVEDP only while the catheter is in the LV (the trace is on the monitor), a
// pericardial effusion only while an echo is being looked at. Tamponade and VF
// are raised at once (LAB_BUILD_PLAN section 2: their cues stay immediate).
//
// Thresholds are below, each with its source or labelled MODEL PARAMETER. A lab
// may pass its own (an ACT goal for its procedure, a contrast ceiling from
// contrastBudget) through PatientEventOptions.
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../content/lab/tips";
import type { Vitals } from "../../simulation/patient/engine";
import type { EventLog } from "./eventLog";

/** The patient events this adapter can raise (for a lab's `raises` declaration). */
export const PATIENT_EVENTS = [
  "hypotension",
  "bradycardia",
  "vf",
  "vt",
  "atrial-fibrillation",
  "av-block",
  "st-elevation",
  "chest-pain",
  "contrast-reaction",
  "desaturation",
  "pulmonary-oedema",
  "high-lvedp",
  "pericardial-effusion",
  "tamponade",
  "low-act",
  "high-contrast-volume",
] as const satisfies readonly LabEvent[];

export type PatientEvent = (typeof PATIENT_EVENTS)[number];

/**
 * ACT goals named by the module text, s (lesson pm-antithrombotics-heparin, its goal table). A lab
 * passes the goal of its procedure as PatientEventOptions.actGoalS; the two manuals differ, so
 * both are kept.
 */
export const ACT_GOALS_S = {
  /** Brilakis 2.8 and 3.4: heparin alone, Hemochron device, 300-350 s */
  heparinHemochron: 300,
  /** Brilakis 3.4: heparin alone, HemoTec device, 250-300 s */
  heparinHemotec: 250,
  /** Brilakis 3.4 and 3.5: with a GP IIb/IIIa inhibitor or cangrelor, 200-250 s */
  withGpiOrCangrelor: 200,
  /** Oxford ch 8: kept above 250-300 s by operators who use the ACT */
  oxfordGeneral: 250,
} as const;

export interface PatientEventThresholds {
  /** hypotension: displayed mean arterial pressure below this, mmHg (MODEL PARAMETER, LAB_BUILD_PLAN found-lab-session-plumbing) */
  hypotensionMapMmHg: number;
  /** ... held for at least this long, s (MODEL PARAMETER, same source) */
  hypotensionHoldS: number;
  /** bradycardia: displayed heart rate below this, bpm (LAB_BUILD_PLAN found-lab-session-plumbing; MODEL PARAMETER) */
  bradycardiaHr: number;
  /** desaturation: SpO2 below this, % (MODEL PARAMETER: the engine's own SpO2 alarm limit, engine.ts alarmTick) */
  desaturationSpo2: number;
  /** chest pain: the patient's pain score (0-10) at or above this (MODEL PARAMETER) */
  chestPainScore: number;
  /** high LVEDP: above the normal range, mmHg (Oxford ch 4, lesson hb-cardiac-catheterisation-lhc: normal 3-12 mmHg) */
  highLvedpMmHg: number;
  /** pulmonary oedema likely: LVEDP above this, mmHg (Oxford ch 4, lessons hb-cardiac-catheterisation-lhc and cm-flow-embolism-oedema-cholesterol) */
  oedemaLvedpMmHg: number;
  /** pulmonary oedema on the clinical picture: breathlessness (0-1) at or above this together with desaturation (MODEL PARAMETER) */
  oedemaDyspnoea: number;
  /** low ACT: a measured ACT below this, s (default Oxford ch 8 and Brilakis 3.4 HemoTec, 250 s; see ACT_GOALS_S) */
  actGoalS: number;
  /** high contrast volume: this fraction of the maximum acceptable contrast dose (LAB_BUILD_PLAN section 4: warn at 80% of the ceiling; MODEL PARAMETER) */
  contrastFraction: number;
  /** pericardial effusion seen on echo: at least this volume, mL (MODEL PARAMETER) */
  effusionMl: number;
  /** tamponade: at least this pericardial volume together with a displayed MAP below hypotensionMapMmHg, mL (MODEL PARAMETER) */
  tamponadeMl: number;
}

export const PATIENT_EVENT_THRESHOLDS: Readonly<PatientEventThresholds> = {
  hypotensionMapMmHg: 65,
  hypotensionHoldS: 10,
  bradycardiaHr: 50,
  desaturationSpo2: 90,
  chestPainScore: 3,
  highLvedpMmHg: 12,
  oedemaLvedpMmHg: 30,
  oedemaDyspnoea: 0.5,
  actGoalS: ACT_GOALS_S.oxfordGeneral,
  contrastFraction: 0.8,
  effusionMl: 20,
  tamponadeMl: 100,
};

/** The vitals the adapter reads: PatientEngine's Vitals, of which every field but t may be missing (labs without a full engine). */
export type PatientVitals = Pick<Vitals, "t"> &
  Partial<Pick<Vitals, "hr" | "rhythmKind" | "av" | "art" | "nibp" | "spo2" | "stemi" | "lvedp" | "tipState" | "contrast" | "symptoms" | "pericardialMl">>;

/** What the operator has measured or is looking at, which gates values the monitor does not show. */
export interface PatientObservations {
  /** the last measured ACT, s (null or absent: not measured yet) */
  actMeasuredS?: number | null;
  /** an echo is being looked at (shows a pericardial effusion) */
  echo?: boolean;
  /** the LV pressure is on the monitor; default: vitals.tipState === "lv" */
  lvTrace?: boolean;
}

export interface PatientEventOptions {
  thresholds?: Partial<PatientEventThresholds>;
  /** a contrast ceiling check from contrastBudget, replacing the fraction-of-MACD rule */
  contrastHigh?: (contrast: NonNullable<PatientVitals["contrast"]>) => boolean;
}

/** What the adapter carries from one update to the next. */
export interface PatientEventState {
  /** lab time since which the displayed MAP has been below the hypotension threshold */
  lowMapSince: number | null;
}

export const INITIAL_PATIENT_EVENT_STATE: Readonly<PatientEventState> = { lowMapSince: null };

/**
 * The mean arterial pressure the operator can read: the transduced line while it shows an arterial
 * waveform (tipState "aortic", or a lab that reports no tip state), else the last cuff reading. The
 * line measures the pressure at the catheter tip (engine.ts Vitals.art), so in the LV or with a
 * damped, wedged or ventricularised trace its mean is not the patient's MAP. Null when neither is
 * available.
 */
export function displayedMap(v: PatientVitals): number | null {
  const arterial = v.tipState === undefined || v.tipState === "aortic";
  const m = arterial ? (v.art?.mean ?? v.nibp?.mean) : v.nibp?.mean;
  return typeof m === "number" && Number.isFinite(m) ? m : null;
}

/**
 * The patient events present at vitals.t, and the state for the next call. Pass the returned state
 * back as `prev` on the next update; the hypotension hold is measured in vitals.t (lab time).
 */
export function patientEvents(
  v: PatientVitals,
  prev: PatientEventState = INITIAL_PATIENT_EVENT_STATE,
  obs: PatientObservations = {},
  opts: PatientEventOptions = {}
): { events: PatientEvent[]; state: PatientEventState } {
  const th = opts.thresholds ? { ...PATIENT_EVENT_THRESHOLDS, ...opts.thresholds } : PATIENT_EVENT_THRESHOLDS;
  return patientEventsWith(th, v, prev, obs, opts.contrastHigh);
}

/** patientEvents with the thresholds already merged (the adapter merges them once). */
function patientEventsWith(
  th: Readonly<PatientEventThresholds>,
  v: PatientVitals,
  prev: PatientEventState,
  obs: PatientObservations,
  contrastHigh: PatientEventOptions["contrastHigh"]
): { events: PatientEvent[]; state: PatientEventState } {
  const out: PatientEvent[] = [];
  const add = (e: PatientEvent) => {
    if (!out.includes(e)) out.push(e);
  };

  // rhythm (the monitor)
  const rk = v.rhythmKind;
  if (rk === "vf") add("vf");
  if (rk === "vt") add("vt");
  if (rk === "af") add("atrial-fibrillation");
  if (v.av === 3) add("av-block");
  const organised = rk !== "vf" && rk !== "asystole";
  if (organised && typeof v.hr === "number" && v.hr < th.bradycardiaHr) add("bradycardia");

  // pressure, with its hold; with no readable pressure (no line, a non-arterial trace and no cuff
  // reading) the hold carries over and nothing is raised
  const map = displayedMap(v);
  let lowMapSince: number | null = null;
  if (map === null) lowMapSince = prev.lowMapSince;
  else if (map < th.hypotensionMapMmHg) {
    lowMapSince = prev.lowMapSince ?? v.t;
    if (v.t - lowMapSince >= th.hypotensionHoldS) add("hypotension");
  }

  // ECG, oximetry and the patient
  if (v.stemi?.met) add("st-elevation");
  if (typeof v.spo2 === "number" && v.spo2 < th.desaturationSpo2) add("desaturation");
  if (v.symptoms) {
    if (v.symptoms.chestPain >= th.chestPainScore) add("chest-pain");
    // itch comes only from a contrast reaction in the engine (responses.ts symptoms)
    if (v.symptoms.itch > 0) add("contrast-reaction");
  }

  // LV filling pressure, while the LV trace is on the monitor
  const lvTrace = obs.lvTrace ?? v.tipState === "lv";
  if (lvTrace && typeof v.lvedp === "number") {
    if (v.lvedp > th.highLvedpMmHg) add("high-lvedp");
    if (v.lvedp > th.oedemaLvedpMmHg) add("pulmonary-oedema");
  }
  // on the clinical picture: breathless and desaturated with a raised LVEDP on the LV trace
  if (lvTrace && v.symptoms && v.symptoms.dyspnoea >= th.oedemaDyspnoea && out.includes("desaturation") && typeof v.lvedp === "number" && v.lvedp > th.highLvedpMmHg) add("pulmonary-oedema");

  // pericardium: tamponade at once (low pressure with a large collection); an effusion only on echo
  const peri = v.pericardialMl ?? 0;
  if (peri >= th.tamponadeMl && map !== null && map < th.hypotensionMapMmHg) add("tamponade");
  if (obs.echo && peri >= th.effusionMl) add("pericardial-effusion");

  // anticoagulation, only once measured
  if (typeof obs.actMeasuredS === "number" && obs.actMeasuredS < th.actGoalS) add("low-act");

  // contrast
  if (v.contrast) {
    const high = contrastHigh ? contrastHigh(v.contrast) : v.contrast.fractionOfMacd >= th.contrastFraction;
    if (high) add("high-contrast-volume");
  }

  return { events: out, state: { lowMapSince } };
}

/**
 * The adapter with its state, for a lab's update loop: update() returns the events present now and,
 * when the adapter has a log, raises each into it (a transient hold that is refreshed while the
 * event persists).
 */
export class PatientEventAdapter {
  private st: PatientEventState = { ...INITIAL_PATIENT_EVENT_STATE };
  private last: PatientEvent[] = [];
  private readonly th: Readonly<PatientEventThresholds>;

  constructor(
    private readonly log?: EventLog,
    private readonly opts: PatientEventOptions = {},
    private readonly source = "patient"
  ) {
    this.th = opts.thresholds ? { ...PATIENT_EVENT_THRESHOLDS, ...opts.thresholds } : PATIENT_EVENT_THRESHOLDS;
  }

  update(v: PatientVitals, obs: PatientObservations = {}): PatientEvent[] {
    const r = patientEventsWith(this.th, v, this.st, obs, this.opts.contrastHigh);
    this.st = r.state;
    this.last = r.events;
    if (this.log) for (const e of r.events) this.log.raise(e, undefined, v.t, this.source);
    return r.events;
  }

  /** The events of the last update. */
  current(): PatientEvent[] {
    return this.last.slice();
  }

  state(): PatientEventState {
    return { ...this.st };
  }

  reset(): void {
    this.st = { ...INITIAL_PATIENT_EVENT_STATE };
    this.last = [];
  }
}
