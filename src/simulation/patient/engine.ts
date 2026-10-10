// ---------------------------------------------------------------------------
// Patient engine: one seeded patient on the shared CardiacClock.
//
// The engine drives the clock (session code calls engine.advance(dt) instead
// of clock.advance(dt)), so the R waves that time the X-ray heart motion, the
// ECG, the pressures, the monitor beep and the mentor timeline are the same
// beats. Each fixed step (circulation.ts DT = 0.4 ms) it:
//   1. advances the clock and hands the beat timing to circulation.step()
//      (lumped LV/RV/aorta model with this patient's parameters),
//   2. computes the catheter-tip pressure (transducer.ts tip chamber) and runs
//      it through the transducer chain to the displayed pressure,
//   3. records monitor samples at 250 Hz (12-lead ECG, arterial pressure,
//      pleth).
// Every 50 ms (slow tick) it updates drugs, coronary supply per myocardial
// region, ischaemia, rhythm, autonomic tone, circulation parameters, SpO2,
// NIBP, alarms and contrast/renal thresholds.
//
// The formulary (found-patient-formulary) adds: giveDrug() for every drug and
// route of pharmacology.ts with the interaction flags; infusions of pressors,
// inotropes and IV antiplatelet agents; oxygen as an FiO2 term in the SpO2
// target; ongoing haemorrhage and a vasodilated state as inputs for the
// hypotension causes; a dynamic LVOT obstruction for an obstructive HCM
// profile; diuresis; IV adrenaline at arrest doses with a pulse giving VT;
// rightHeart() (RA, PA, PCWP from LVEDP, CO, SVR); thrombusHazard() from the
// antithrombotic effect; and the contrast ceiling from contrastBudget.ts.
//
// physiology-hyperaemia-and-adenosine adds, all off or inert by default so the
// other labs behave as before: an opt-in adenosine hazard model
// (setAdenosineHazards) in which a high-risk intracoronary dose (above
// 100 µg into the RCA or a dominant circumflex, or a fast push) can bring AV
// block without an escape rhythm, atrial fibrillation or R-on-T VF; recent
// caffeine (setRecentCaffeine); the injection's vessel and speed on giveDrug;
// and the bedside orders those arrhythmias need: cough(), temporary pacing
// (setPacing) and synchronised cardioversion (cardiovert), beside the existing
// CPR, charge and shock.
//
// diag-rhythm-haemodynamic-events adds, all off or inert by default: an opt-in
// injection hazard model (setInjectionHazards, MP_INJECTION_HAZARD in
// responses.ts) in which the diagnostic lab judges each push by what it did
// (injectionHazard: a conus, damped, wedged or plugging injection; a free
// trace carries no trigger) and the contrast an obstructing catheter holds in
// the artery (contrastDwell), with sustained VT from catheter contact with the
// LV wall, its reversion on an antiarrhythmic, SVT ended by AV nodal block and
// AF that reverts; forceRhythm gains AF, SVT and 2:1 block; and a volume
// deficit (setVolumeDeficit, EngineOptions.volumeDeficitMl) for a dry patient.
//
// No DOM access: the engine can run in a worker; snapshot()/restore() give
// exact replay (the fixed-step accumulator makes results independent of how
// advance() calls are split).
// ---------------------------------------------------------------------------

import type { Lesion, VesselId } from "../../types";
import type { CoronaryTree } from "../../render/xray/coronaryTree";
import type { TelemetryEvent, Snapshotable } from "../session/types";
import { CardiacClock, type ClockState, type RhythmKind, type BeatEvent } from "../clock/cardiacClock";
import { step as circStep, initialState, Circulation, oxygenation, DT as CIRC_DT, type Patient as CircPatient, type SimState, type BeatStats } from "../circulation";
import { generatePatient, lesionsFromProfile, type PatientProfile } from "./patient";
import { SeededRng } from "./rng";
import { coronaryFlowFor, defaultFlowMap, supplyFor, vesselFlowProfile, phasicFlow, type CoronaryFlowMap, type FlowModifiers, type RegionSupply, type Territory } from "./coronaryFlow";
import { Pharmacology, ADENOSINE, DRUGS, MP_INTERACTION, type DoseOrder, type DrugId, type Route, type InfusionOrder, type InfusionDrug, type DrugEffects, type PharmaState, type InteractionFlag } from "./pharmacology";
import { Responses, MP_RESP, MP_INJECTION_HAZARD, injectionVfPerMl, dwellVfProbability, tipSpasmModelFor, type InjectionHazardInput, type InjectionHazardModel, type TipSpasmModel, type ResponsesState, type Symptoms, type ReactionKind, type ReactionComponents, type ReactionCourse } from "./responses";
import { LiveRadialSpasm, type LiveRadialSetup, type LiveRadialSnapshot } from "../access/radialSpasm";
import { contrastBudgetForProfile, crossedPoints, type ContrastBudget, type ContrastBudgetInput } from "./contrastBudget";
import { Rhythm, type RhythmState, type ShockOutcome, type BaseRhythm } from "./rhythm";
import { TipChamber, Transducer, classifyTip, DEFAULT_LINE, P_BED, type TipInput, type TipPressureState, type TransducerState, type LineSpec, type Dynamic } from "./transducer";
import { LEADS, ventricularVcg, pWaveVcg, pPeakBeforeR, fWaveVcg, vfVcg, leadsFromVcg, stMm, stemiCriteria, type EcgBeat, type Lead, type Vec3f, type BeatMorph } from "../ecg12";

export const SAMPLE_HZ = 250;
const STEPS_PER_SAMPLE = Math.round(1 / SAMPLE_HZ / CIRC_DT); // 10
const SLOW_DT = 0.05;
const TICKS_PER_S = 1e7;
const STEP_TICKS = Math.round(CIRC_DT * TICKS_PER_S);
const lastOf = <T>(a: T[]): T | undefined => a[a.length - 1];

// MODEL PARAMETERS (engine level)
export const MP_ENGINE = {
  /** baroreflex heart-rate gain, bpm per mmHg below the baseline MAP, and its limits */
  baroHrGain: 0.6,
  baroHrMin: -12,
  baroHrMax: 45,
  /** baroreflex vascular tone gain per mmHg (fraction), limit */
  baroSvrGain: 0.004,
  baroSvrMax: 0.25,
  /** ventricular escape rate in complete heart block, bpm */
  escapeRate: 38,
  /** pericardial pressure: P = k (exp(V / v0) − 1), mmHg */
  periK: 0.5,
  periV0: 60,
  /**
   * ceiling of the pericardial pressure on the ventricles, mmHg: above the venous filling pressure the
   * heart has stopped filling already, so a larger effusion ends in no output, not in a larger number
   */
  periMaxMmHg: 40,
  /** with an effusion, a ventricle squeezed by it empties to this volume and no further, mL */
  ventMinMl: 0,
  /** chest compression rate (per min) and external pressure amplitude (mmHg) */
  cprRate: 110,
  cprAmp: 70,
  /** pulse transit to the finger, s, and pleth low-pass, s */
  plethDelay: 0.25,
  plethTau: 0.06,
  /** SpO2 averaging, s */
  spo2Tau: 8,
  /** NIBP measurement duration, s, and error SD, mmHg */
  nibpDuration: 30,
  nibpSd: 4,
  /** premature ventricular beat chance per beat with the catheter touching the LV */
  pvcPerBeatLvContact: 0.3,
  /** transducer offset before zeroing: SD, mmHg */
  zeroDriftSd: 9,
  /** VT induced by ischaemia/reperfusion: rate and duration */
  vtRate: 175,
  /** a supraventricular tachycardia's rate when none is given, bpm (diag-rhythm-haemodynamic-events) */
  svtRate: 180,
  /** aortic valve inertance (mmHg·s²/mL) and closing regurgitant volume (mL): a 6-8 mmHg incisura */
  aorticValveInertance: 0.0003,
  aorticValveCloseMl: 1.0,
};

/**
 * Patient coupling of the PCI lab (pci-patient-coupling). MODEL PARAMETERS (docs/realism/facts/pkg-pci-patient-coupling.md):
 * settings of the simulator, not clinical values. Each is inert by default (no effusion, no regurgitation, no
 * refractory shocks), so a lab that does not use them behaves as before.
 */
export const MP_COUPLING = {
  /**
   * Pulsus paradoxus under an effusion: the pericardial constraint on the heart swings with breathing, this
   * share of the pericardial pressure above it at full inspiration and below it at full expiration (symmetric
   * over a breath, so the mean constraint is unchanged). The circulation model has one pericardial pressure for
   * both ventricles, so the swing stands for the interdependence that takes filling from the left heart on
   * inspiration. Off unless a lab turns it on (setPulsusParadoxus: the PCI lab), and no effect without an effusion.
   */
  pulsusShare: 0.6,
  /** the breath's full excursion of the clock's respiration signal (CardiacClock's default tidal excursion) */
  pulsusTidal: 0.22,
  /** beats read for the pulsus paradoxus read-out (the systolic swing over at least one breath) */
  pulsusBeats: 10,
  /** acute aortic regurgitation through a cusp held open by a guide, at severity 1: root-to-LV conductance, mL/s per mmHg */
  arConductanceMlSPerMmHg: 8,
  /**
   * With setDisplayedDampingClass on (the PCI lab), a trace the line shows with a pulse below this share of the
   * pulse at the catheter tip (the mean of the last beats) is classed as damped, whatever damps it (contrast or a
   * plug in the lumen, a bulky device in the guide, air): the class the operator reads from the monitor.
   */
  displayedDampedPulseShare: 0.5,
};

/**
 * The left heart task (diag-lv-aorta-task). MODEL PARAMETERS (docs/realism/facts/pkg-diag-lv-aorta-task.md),
 * inert by default: no mitral regurgitation and no atrial contraction until a lab sets them, so every other
 * lab is unchanged.
 *   mrConductanceMlSPerMmHg  LV-to-LA conductance at mitral regurgitation severity 1, mL/s per mmHg
 *   atrialKickMmHg           peak left atrial pressure added by atrial contraction (the a wave)
 *   avOpenTauS               decay of the running peak of aortic valve flow that scales the valve's opening
 */
export const MP_LEFT_HEART = {
  mrConductanceMlSPerMmHg: 1.2,
  atrialKickMmHg: 6,
  avOpenTauS: 4,
};

/** What one closed beat of the left heart gave (diag-lv-aorta-task): forward and mitral regurgitant volumes, mL. */
export interface LeftHeartBeat {
  forwardMl: number;
  mrMl: number;
  /** regurgitant fraction of the total LV output, 0..1 */
  regurgitantFraction: number;
  lvedp: number;
}

/** Formulary-level engine parameters (MODEL PARAMETERS; docs/realism/facts/S9.md). */
export const MP_FORMULARY_ENGINE = {
  /** FiO2 added per L/min of supplemental oxygen and its ceiling (a MODEL conversion, not a sourced one) */
  fio2PerLpm: 0.04,
  maxFio2: 0.6,
  /** fraction of a hypoventilation or airway desaturation that oxygen at maxFio2 relieves */
  o2HypoventRelief: 0.75,
  /** fraction of the shunt (oedema) desaturation that oxygen at maxFio2 relieves */
  o2ShuntRelief: 0.35,
  /** over-sedation: respiratory depression at which it starts and below which it ends */
  overSedationOn: 0.45,
  overSedationOff: 0.3,
  /** IV adrenaline: VT is drawn once when the pro-arrhythmic drive exceeds this, with this chance */
  adrenalineVtDrive: 0.5,
  adrenalineVtP: 0.5,
};

/**
 * Dynamic LVOT obstruction in obstructive HCM (MODEL PARAMETERS). The obstruction fraction O rises
 * with contractility and heart rate and falls with preload and afterload; the effective LV
 * contractility is scaled by (1 − O) / (1 − rest), so the patient is at rest on arrival and an
 * inotrope or a vasodilator lowers the output while a pure vasopressor raises it (lesson
 * pm-lab-drugs-pressors, 04-lab-drugs.ts:650 and 675; nitrates, 04-lab-drugs.ts:311).
 */
export const MP_LVOT = { rest: 0.3, inotropyExp: 2, hrExp: 1, preloadExp: 1.5, afterloadExp: 1, max: 0.85 };

/**
 * Thrombus hazard for a thrombotic lesion (MODEL PARAMETERS): base rate per second per thrombotic
 * lesion, scaled by a seeded patient factor (log-normal, median 1) and by the antithrombotic
 * effect (pharmacology.ts thrombusHazardMult). Labs draw thrombus events from the rate.
 */
export const MP_THROMBUS = { basePerS: 1 / 900, seedLogSd: 0.3 };

/** Thrombus hazard for a profile, its lesions and the drug effects now (pure; engine.thrombusHazard() calls it). */
export function thrombusHazardFor(profile: PatientProfile, lesions: Lesion[], fx: Pick<DrugEffects, "thrombusHazardMult" | "stentThrombosisMult" | "antithrombotic">): {
  baseRatePerS: number;
  ratePerS: number;
  multiplier: number;
  stentThrombosisMult: number;
  antithrombotic: number;
} {
  const n = lesions.filter((l) => l.kind === "thrombotic").length;
  const seedFactor = new SeededRng("thrombus:" + profile.seed).logNormal(1, MP_THROMBUS.seedLogSd);
  const base = n * MP_THROMBUS.basePerS * seedFactor;
  return { baseRatePerS: base, ratePerS: base * fx.thrombusHazardMult, multiplier: fx.thrombusHazardMult, stentThrombosisMult: fx.stentThrombosisMult, antithrombotic: fx.antithrombotic };
}

/** What rightHeart() returns: the filling pressures and output a right heart catheter reads. */
export interface RightHeartNumbers {
  /** right atrial (systemic venous) mean pressure, mmHg */
  raMmHg: number;
  /** pulmonary artery mean pressure, mmHg */
  paMeanMmHg: number;
  /** pulmonary capillary wedge pressure, taken as the LVEDP, mmHg */
  pcwpMmHg: number;
  /** cardiac output, L/min */
  coLMin: number;
  /** mean arterial pressure (true aortic), mmHg */
  mapMmHg: number;
  /** systemic vascular resistance, dyn·s·cm⁻⁵ (80 × (MAP − RA) / CO) and Wood units */
  svrDyn: number;
  svrWood: number;
}

/**
 * Where an intracoronary dose went and how it was given (physiology-hyperaemia-and-adenosine). Only
 * the adenosine hazard model reads it, and only when it is on (setAdenosineHazards).
 */
export interface InjectionDetail {
  /** the artery injected (the guide's vessel): the RCA, or the LCx when it is dominant, supplies the AV node */
  vessel?: string;
  /** a fast push rather than a slow injection */
  fast?: boolean;
  /**
   * The whole intracoronary bolus as given, µg, when it reaches the artery in parts (the guide holds
   * some of it until the flush): the AV block draw and the high-risk rule judge the bolus, not the part.
   */
  bolusUg?: number;
  /** the rest of a bolus already given (carried out of the guide by the flush): no new AV block or hazard draw */
  continuation?: boolean;
}

/** An adenosine arrhythmia of the hazard model. */
export type AdenosineArrhythmia = "af" | "vf" | "no-escape";

/**
 * The adenosine hazard model (physiology-hyperaemia-and-adenosine), off by default. A high-risk
 * intracoronary dose draws at most one arrhythmia with these chances; a scenario can force the next
 * one. The existing AV block draw (ADENOSINE.completeAvBlock scaled by dose) is unchanged and runs
 * first; the hazard model draws from its own generator, so turning it on moves no other draw.
 */
export interface AdenosineHazardModel {
  afP: number;
  vfP: number;
  noEscapeP: number;
  /** the outcome of the next high-risk injection, certain (a scenario's), or null */
  force: AdenosineArrhythmia | null;
}

/**
 * Adenosine hazards (physiology-hyperaemia-and-adenosine).
 *
 * Sourced: what counts as high risk, "no more than 100 µg intracoronary into the RCA or a dominant
 * circumflex", and a fast injection (Brilakis 3.2 and 12.2, lessons pm-physiology-indices,
 * 14-physiology.ts:478-488, and pm-lab-drugs-microvascular, 04-lab-drugs.ts:505 and 556); the three
 * arrhythmias and their order (AV block resolving in seconds, block without an escape rhythm needing
 * brief CPR and temporary pacing, R-on-T VF after a pause, AF that may revert or need cardioversion;
 * same tables).
 *
 * Every chance, delay and duration below is a MODEL PARAMETER (none is sourced): afP, vfP and
 * noEscapeP for one high-risk injection; vfDelayS, the pause before the R-on-T beat; noEscapeHoldS,
 * how long block without an escape rhythm outlasts the drug's AV nodal drive; afSelfRevertP and
 * afRevertS, the chance AF reverts by itself and when; cardioversionAfSuccess, one synchronised shock
 * restoring sinus rhythm from adenosine AF; coughS, coughRatePerMin and coughAmpMmHg, the pressure
 * pulses forceful coughing generates in the chest (cough CPR).
 */
export const MP_ADENOSINE_HAZARDS = {
  highDoseUg: 100,
  afP: 0.15,
  vfP: 0.05,
  noEscapeP: 0.2,
  vfDelayS: 2,
  noEscapeHoldS: 15,
  afSelfRevertP: 0.5,
  afRevertS: 30,
  cardioversionAfSuccess: 0.9,
  coughS: 4,
  coughRatePerMin: 40,
  coughAmpMmHg: 40,
};

/** The result of giveDrug(). */
export type GiveResult = { ok: true; flags: InteractionFlag[] } | { ok: false; reason: "route" | "infusion-only" | "dose"; text: string };

/** A painful or vagal stimulus the engine is told of ('sheath-removal': a sheath pulled under compression). */
export type StimulusKind = "puncture" | "sheath" | "radial-spasm" | "cocktail" | "balloon" | "catheter" | "sheath-removal";

/**
 * Vagal prevention at the access steps (proc-anaphylaxis-vagal; cm-patient-complications-vasovagal,
 * 'Preventing it': generous local anaesthetic before the sheath, Brilakis 11.1; saline running before
 * a femoral sheath is removed, Brilakis 11.1). The engine scales a stimulus's vagal magnitude with it.
 */
export interface VagalPrevention {
  /** local anaesthetic at the working site that has had time to act, as a fraction of an adequate dose (0 none, 1 adequate) */
  local: number;
  /** saline running through a drip */
  salineRunning: boolean;
}

/**
 * MODEL PARAMETERS of the vagal prevention scaling (not sourced): the extra vagal magnitude of a
 * puncture or sheath with no effective local anaesthetic (on top of the pain the session already
 * passes), and the share of a sheath removal's magnitude saline running removes. The removal's
 * magnitude by site kind is the caller's (MP_EMERGENCIES.removalMagnitude in session/emergencies.ts).
 */
export const MP_VAGAL_PREVENTION = {
  noLocalGain: 0.6,
  salineRelief: 0.6,
};

/**
 * The procedure lab's emergency model (proc-anaphylaxis-vagal), off by default: the other labs never
 * set it and behave as before.
 */
export interface EmergencyModel {
  /** contrast given during a reaction worsens it */
  reactionEscalation: boolean;
  /** the vagal vasodilation follows the slowing with this time constant, s */
  vagalSvrLagS: number;
  /** vagal prevention at the access steps (null: no scaling) */
  prevention: VagalPrevention | null;
}

export interface EngineOptions {
  /** an existing profile, or a seed to generate one */
  profile?: PatientProfile;
  seed?: string | number;
  /** the session's clock; the engine drives it */
  clock?: CardiacClock;
  /** the rendered coronary tree and the lesions it was built with (otherwise a default network and the profile's lesions) */
  tree?: CoronaryTree;
  lesions?: Lesion[];
  line?: LineSpec;
  /** fit the circulation to the profile's targets (default true) */
  calibrate?: boolean;
  /** seconds of monitor history (default 12) */
  monitorSeconds?: number;
  /**
   * Aortic stenosis: the effective aortic valve orifice area, cm² (diag-pressure-transducer); else
   * the profile's aorticValveAreaCm2; absent, a normal valve. Applied after calibration.
   */
  aorticValveAreaCm2?: number;
  /**
   * A circulating volume missing on arrival, mL (diag-rhythm-haemodynamic-events: a fasted, dry patient),
   * taken from the stressed volume once the patient is built (setVolumeDeficit). Absent: none.
   */
  volumeDeficitMl?: number;
}

/** What the injection hazard model is told of a push (InjectionHazardInput without the parts the engine knows). */
export type InjectionHazardDetail = Partial<InjectionHazardInput>;

/**
 * The lowest stressed venous volume a volume deficit leaves, mL. MODEL PARAMETER: the same floor the
 * engine keeps for bleeding and diuresis (the slow tick's Math.max(20, ...)).
 */
const MIN_STRESSED_ML = 20;

/**
 * The LV myocardium region by region, for the ventriculogram's wall motion (diag-lv-aorta-render,
 * lvGram.ts). One entry per LV region of the coronary flow map (RV regions are left out).
 */
export interface LvWallRegion {
  /** unit vector from the heart centre to the region, Frank axes (x left, y inferior, z posterior) */
  dir: [number, number, number];
  territory: Territory;
  /** resting demand (mL/s): the region's share of LV mass */
  demand: number;
  /** ischaemia and necrosis, 0..1 */
  ischaemia: number;
  necrosis: number;
}

export interface LvWallState {
  regions: LvWallRegion[];
  /** the profile's LVEF (%) and the current beat's (%) */
  baselineEf: number;
  ef: number;
  /** the beat now under way is an ectopic one (the engine's rhythm) */
  ectopic: boolean;
}

export interface Alarm {
  id: string;
  level: "high" | "medium" | "low";
  text: string;
  since: number;
}

export interface ArtNumbers {
  sys: number;
  dia: number;
  mean: number;
}

export interface Vitals {
  t: number;
  /** displayed heart rate (null when it cannot be counted, as in VF) */
  hr: number | null;
  rhythm: string;
  rhythmKind: BaseRhythm;
  av: 0 | 1 | 2 | 3;
  /** transduced arterial pressure as displayed (depends on zeroing, levelling, damping and tip position) */
  art: ArtNumbers | null;
  /** true central aortic pressure (for the mentor and debrief, not for display in solo mode) */
  aortaTrue: ArtNumbers;
  tipState: TipPressureState;
  spo2: number | null;
  respRate: number;
  nibp: (ArtNumbers & { at: number }) | null;
  nibpRunning: boolean;
  /** ST deviation per lead, mm */
  st: Record<Lead, number>;
  stemi: { met: boolean; groups: string[] };
  lvedp: number;
  strokeVolume: number;
  cardiacOutput: number;
  ef: number;
  /** true ACT now (s); shown only after a measurement */
  actTrue: number;
  contrast: { totalMl: number; macdMl: number; fractionOfMacd: number; perCrCl: number; crclMlMin: number };
  ischaemia: Record<Territory, number>;
  symptoms: Symptoms;
  alarms: Alarm[];
  alarmsSilencedUntil: number;
  transducer: { zeroed: boolean; heightCm: number } & Dynamic;
  defib: { charged: number; charging: boolean; cleared: boolean; shocks: number };
  cpr: boolean;
  pericardialMl: number;
  /** breathing: drug respiratory depression 0..1, FiO2, oxygen flow, an oedema index 0..1 and the over-sedation state */
  respiratory: { depression: number; fio2: number; oxygenLpm: number; oedema: number; overSedated: boolean };
  /** the contrast reaction's skin, airway and circulation components (truth, for the debrief) */
  reaction: ReactionComponents;
  /** antithrombotic effects 0..1 (truth, for the debrief) */
  antithrombotic: { antiplatelet: number; anticoagulant: number; combined: number; p2y12: number; gpi: number; aspirin: number };
  /** volumes lost: blood (haemorrhage input), urine (diuresis), mL */
  losses: { bloodMl: number; urineMl: number };
}

interface BeatAcc {
  n: number;
  aoMax: number;
  aoMin: number;
  aoSum: number;
  saSum: number;
  saMax: number;
  saMin: number;
  tipMax: number;
  tipMin: number;
  tipSum: number;
  rdMax: number;
  rdMin: number;
  rdSum: number;
  lvMax: number;
  lvLast: number;
  vMax: number;
  vMin: number;
  avSum: number;
}

const newAcc = (): BeatAcc => ({ n: 0, aoMax: -1e9, aoMin: 1e9, aoSum: 0, saSum: 0, saMax: -1e9, saMin: 1e9, tipMax: -1e9, tipMin: 1e9, tipSum: 0, rdMax: -1e9, rdMin: 1e9, rdSum: 0, lvMax: -1e9, lvLast: 0, vMax: -1e9, vMin: 1e9, avSum: 0 });

interface BeatSummary {
  t: number;
  rr: number;
  ao: ArtNumbers;
  sa: ArtNumbers;
  tip: ArtNumbers;
  reading: ArtNumbers;
  lvSys: number;
  lvedp: number;
  edv: number;
  esv: number;
  sv: number;
}

/** Ring buffer of monitor samples at SAMPLE_HZ. */
export class TraceRing {
  readonly size: number;
  readonly t: Float64Array;
  readonly ecg: Float32Array[]; // 12 leads
  readonly art: Float32Array;
  readonly pleth: Float32Array;
  readonly aoTrue: Float32Array;
  readonly tipTrue: Float32Array;
  head = 0;
  count = 0;
  constructor(seconds: number) {
    this.size = Math.round(seconds * SAMPLE_HZ);
    this.t = new Float64Array(this.size);
    this.ecg = LEADS.map(() => new Float32Array(this.size));
    this.art = new Float32Array(this.size);
    this.pleth = new Float32Array(this.size);
    this.aoTrue = new Float32Array(this.size);
    this.tipTrue = new Float32Array(this.size);
  }
  /** index of the k-th most recent sample (0 = newest) */
  idx(k: number): number {
    return (this.head - 1 - k + this.size * 2) % this.size;
  }
  clear() {
    this.head = 0;
    this.count = 0;
  }
}

export interface EngineSnapshot {
  profileSeed: string;
  clock: ReturnType<CardiacClock["snapshot"]>;
  circ: SimState;
  pat: CircPatient;
  base: { ees: number; rees: number; rsys: number; hr: number; map: number; sys?: number; vSV?: number };
  /**
   * the coronary network the regional arrays belong to: the lesions, a fingerprint of the rendered
   * tree (null for the default network) and the region count. Optional for older snapshots.
   */
  network?: { lesions: Lesion[]; treeKey: string | null; regions: number };
  acc: number;
  stepCount: number;
  lastBeat: number;
  venousShift: number;
  fluidPending: { ml: number; rate: number }[];
  lostMl: number;
  periMl: number;
  periInflow: number;
  tip: TipInput;
  tipP: number;
  tipQ: number;
  transducer: TransducerState;
  pharm: PharmaState;
  resp: ResponsesState;
  rhythm: RhythmState;
  rng: number;
  occlusions: Record<string, { vessel: string; param: number; fraction: number }>;
  microvascular: Record<number, number>;
  beatAcc: BeatAcc;
  beats: BeatSummary[];
  cur: EcgBeat;
  prev: EcgBeat | null;
  prevRR: number;
  atrialT: number;
  ectopicNext: boolean;
  compensate: number | null;
  slowAcc: number;
  spo2: number;
  plethLp: number;
  nibp: { running: boolean; startedAt: number; last: (ArtNumbers & { at: number }) | null; intervalMin: number | null; nextAt: number | null };
  alarmPending: Record<string, { since: number; on: boolean }>;
  sinusHr: number;
  activeAlarms: Alarm[];
  saRing: number[];
  silencedUntil: number;
  renalAnnounced: string[];
  adenosineBlockArmed: boolean;
  adenosineAv: boolean;
  events: TelemetryEvent[];
  beatEvents: BeatEvent[];
  mapSmooth: number;
  /** proc-anaphylaxis-vagal: vagal prevention and the sheath-removal generator (optional for older snapshots) */
  em?: { prevention: VagalPrevention | null; vagalRng: number };
  /** the live radial spasm of a radial case (diag-spasm-states); absent when the engine has none */
  radial?: LiveRadialSnapshot;
  /** the catheter-tip spasm model (diag-spasm-states); absent when it is off */
  tipSpasm?: TipSpasmModel;
  /** physiology-hyperaemia-and-adenosine: the adenosine hazard model and its state, pacing, coughing (optional for older snapshots) */
  adn?: {
    model: AdenosineHazardModel | null;
    rng: number;
    pending: AdenosineArrhythmia | null;
    /** optional for snapshots taken before the pending arrhythmia expired */
    pendingUntil?: number | null;
    noEscape: boolean;
    noEscapeUntil: number | null;
    vfAt: number | null;
    af: boolean;
    afRevertAt: number | null;
    pacingRate: number | null;
    coughUntil: number;
  };
  /** pci-patient-coupling: aortic regurgitation and refractory shocks (optional for older snapshots) */
  coupling?: { ar: number; refractoryVf: number; pulsus?: boolean; dampedClass?: boolean };
  /** diag-lv-aorta-task: mitral regurgitation and atrial contraction (optional; absent when neither is on) */
  leftHeart?: { mr: number; atrial: boolean };
  /** diag-rhythm-haemodynamic-events: the injection hazard model and its generator (absent when it is off) */
  inj?: { model: InjectionHazardModel; rng: number };
  /** formulary state; optional so that older snapshots restore */
  form?: {
    oxygenLpm: number;
    haemorrhageMlS: number;
    vasodilation: number;
    bledMl: number;
    urineMl: number;
    adrVtDrawn: boolean;
    proVfArmed: boolean;
    overSedated: boolean;
    svSmooth: number;
    paSmooth: number;
    budgetAnnounced: number[];
    /** contrast total at the last budget check, mL (optional for older snapshots) */
    budgetPrevMl?: number;
  };
}

export class PatientEngine implements Snapshotable<EngineSnapshot> {
  readonly profile: PatientProfile;
  readonly clock: CardiacClock;
  readonly transducer: Transducer;
  readonly trace: TraceRing;
  readonly pharm: Pharmacology;
  readonly resp: Responses;
  readonly rhythm: Rhythm;
  flow: CoronaryFlowMap;
  lesions: Lesion[];

  private rng: SeededRng;
  private s: SimState;
  private pat: CircPatient;
  private base: { ees: number; rees: number; rsys: number; hr: number; map: number; sys?: number; vSV?: number } = { ees: 2, rees: 0.6, rsys: 1, hr: 70, map: 93 };
  /** the rendered tree behind this.flow (null: default network) and its fingerprint */
  private tree: CoronaryTree | null = null;
  private treeKey: string | null = null;
  /** trees this engine has used, by fingerprint, so restore() can rebuild an earlier network */
  private trees = new Map<string, CoronaryTree>();
  private acc = 0;
  private stepCount = 0;
  private lastBeat = 0;
  private venousShift = 0;
  private fluidPending: { ml: number; rate: number }[] = [];
  /** pci-patient-coupling: acute aortic regurgitation (0 none .. 1), shocks that fail whatever their energy, the last flow modifiers */
  private arSeverity = 0;
  private refractoryVf = 0;
  private lastFlowMods: FlowModifiers | null = null;
  private pulsusOn = false;
  private dampedClassOn = false;
  /** diag-lv-aorta-task: mitral regurgitation severity (0 none .. 1), atrial contraction on, the beat's MR volume */
  private mrSeverity = 0;
  private atrialOn = false;
  private mrBeatMl = 0;
  private avBeatMl = 0;
  private lastLeftBeat: LeftHeartBeat | null = null;
  private avPeak = 0;
  /** coronaryFlowScale's cache: the supplies it was read from, the resting flows of that network, the scales read */
  private flowScaleMemo: { supplies: RegionSupply[]; restKey: string; restQ: number[] | null; byVessel: Map<string, number> } | null = null;
  private suppliesVer = 0;
  private lostMl = 0;
  private periMl = 0;
  private periInflow = 0;
  private tip: TipInput = { location: "outside" };
  private tipChamber = new TipChamber();
  private occlusions: Record<string, { vessel: string; param: number; fraction: number }> = {};
  private microvascular: Record<number, number> = {};
  private beatAcc = newAcc();
  private beats: BeatSummary[] = [];
  private cur: EcgBeat = { morph: "normal", qt: 0.38, st: [0, 0, 0], tExtra: [0, 0, 0] };
  private prev: EcgBeat | null = null;
  private prevRR = 0.85;
  private atrialT = 0;
  private ectopicNext = false;
  private compensate: number | null = null;
  private slowAcc = 0;
  private spo2 = 97;
  private plethLp = 0;
  private nibp: EngineSnapshot["nibp"] = { running: false, startedAt: 0, last: null, intervalMin: null, nextAt: null };
  private alarmPending: Record<string, { since: number; on: boolean }> = {};
  private silencedUntil = -1;
  private renalAnnounced: string[] = [];
  private adenosineBlockArmed = false;
  private adenosineAv = false;
  private events: TelemetryEvent[] = [];
  private beatEvents: BeatEvent[] = [];
  private mapSmooth = 93;
  private sinusHr = 70;
  private oxygenLpm = 0;
  private haemorrhageMlS = 0;
  private vasodilationRt = 0;
  private bledMl = 0;
  private urineMl = 0;
  private adrVtDrawn = false;
  private proVfArmed = false;
  private overSedated = false;
  private svSmooth = 4;
  private paSmooth = 15;
  private budgetAnnounced: number[] = [];
  /** proc-anaphylaxis-vagal: vagal prevention (null: stimuli unscaled) and the generator of the sheath-removal draw, kept apart so no other draw moves */
  private vagalPrevention: VagalPrevention | null = null;
  private vagalRng: SeededRng;
  /** contrast total at the last budget check, mL (crossedPoints) */
  private budgetPrevMl = 0;
  /** physiology-hyperaemia-and-adenosine: the hazard model (null: off) and its own generator */
  private adnModel: AdenosineHazardModel | null = null;
  private adnRng: SeededRng;
  /** the arrhythmia the last high-risk injection drew, fired when its AV nodal effect begins */
  private adnPending: AdenosineArrhythmia | null = null;
  /** ... or dropped at this time (that injection's time to maximum and plateau) when its AV nodal effect never began */
  private adnPendingUntil: number | null = null;
  /** complete block without an escape rhythm (ventricular standstill), and when it may end */
  private adnNoEscape = false;
  private adnNoEscapeUntil: number | null = null;
  /** R-on-T VF due at this time (after the pause) */
  private adnVfAt: number | null = null;
  /** adenosine AF, and when it reverts by itself (null: it does not) */
  private adnAf = false;
  private adnAfRevertAt: number | null = null;
  /** temporary pacing rate, bpm (null: off) */
  private pacingRate: number | null = null;
  /** diag-rhythm-haemodynamic-events: the injection hazard model (null: off, the legacy draw) and its own generator */
  private injModel: InjectionHazardModel | null = null;
  private injRng: SeededRng;
  /** forceful coughing until this time (patient clock s) */
  private coughUntil = -1;
  private activeAlarms: Alarm[] = [];
  /** diag-spasm-states: the live radial spasm of a radial case (null: none, the default) */
  private radialHost: LiveRadialSpasm | null = null;
  private fx: DrugEffects;
  private supplies: RegionSupply[] = [];
  private lastInfo: ReturnType<typeof circStep> | null = null;
  private vitalsCache: Vitals | null = null;
  private ecgTmp: Vec3f = [0, 0, 0];
  private leadTmp = new Float32Array(12);
  private saRing: Float32Array;
  private ecgSeed: number;

  constructor(opts: EngineOptions = {}) {
    this.profile = opts.profile ?? generatePatient(opts.seed ?? 1);
    const p = this.profile;
    this.rng = new SeededRng("engine:" + p.seed);
    this.ecgSeed = Math.floor(this.rng.next() * 1e6);
    this.vagalRng = new SeededRng("vagal:" + p.seed);
    this.adnRng = new SeededRng("adenosine:" + p.seed);
    this.injRng = new SeededRng("injection:" + p.seed);
    this.clock = opts.clock ?? new CardiacClock({ hr: p.baseline.hr, qtc: p.baseline.qtc, respRate: p.baseline.respRate, seed: Math.floor(this.rng.next() * 1e9) });
    this.clock.setHeartRate(p.baseline.hr);
    this.clock.setRhythm(p.baseline.rhythm === "af" ? "af" : "sinus");
    this.transducer = new Transducer(opts.line ?? DEFAULT_LINE, this.rng.normal(0, MP_ENGINE.zeroDriftSd));
    this.trace = new TraceRing(opts.monitorSeconds ?? 12);
    this.saRing = new Float32Array(Math.round(SAMPLE_HZ * 1));
    this.pharm = new Pharmacology(p.weightKg);
    this.pharm.setContext({ pde5: p.pde5, qtcS: p.baseline.qtc, preExcitation: p.preExcitation, af: p.baseline.rhythm === "af", lvef: p.lvef, hocm: !!p.lvot?.obstructive });
    if (p.anticoagulation === "doac" && p.doac) this.pharm.setDoac(p.doac.agent, p.doac.effect ?? 1);
    this.rhythm = new Rhythm(p.baseline.rhythm);
    this.lesions = (opts.lesions ?? lesionsFromProfile(p, opts.tree)).map((l) => ({ ...l }));
    this.rememberTree(opts.tree ?? null);
    this.flow = this.buildFlow(this.tree, this.lesions);
    this.resp = new Responses(this.flow.regions.length);
    this.fx = this.pharm.effects();

    // circulation parameters fitted to the profile
    this.pat = this.initialCirculation(opts.calibrate !== false);
    // a narrowed aortic valve is put in after the fit, so the same arteries carry its pulse (diag-pressure-transducer)
    const ava = opts.aorticValveAreaCm2 ?? p.aorticValveAreaCm2;
    if (ava !== undefined && ava > 0) this.pat.avaCm2 = ava;
    this.s = initialState(this.pat);
    this.warmUp();
    this.preloadAcs();
    if (opts.volumeDeficitMl !== undefined && opts.volumeDeficitMl > 0) this.setVolumeDeficit(opts.volumeDeficitMl);
    this.cur.qt = this.clock.endSystoleFor(60 / p.baseline.hr);
  }

  // -------------------------------------------------------------------------
  // setup
  // -------------------------------------------------------------------------

  private initialCirculation(calibrate: boolean): CircPatient {
    const p = this.profile;
    const mapT = p.baseline.dbp + (p.baseline.sbp - p.baseline.dbp) / 3;
    const ppT = p.baseline.sbp - p.baseline.dbp;
    const pat: CircPatient = {
      hr: p.baseline.hr,
      lv: { ees: 2.0 * Math.pow(p.lvef / 60, 1.4), v0: 10, p0: 0.17, lambda: 0.028 },
      rv: { ees: 0.6, v0: 10, p0: 0.25, lambda: 0.02 },
      rsys: 1.0 * (mapT / 93),
      rpul: 0.07,
      stressed: 860 + (p.lvedp - 10) * 20,
      shunt: 0.02,
      rhythm: "sinus",
      cSa: 1.35,
      // inertial aortic valve so the incisura appears at valve closure (MODEL PARAMETERS)
      lAv: MP_ENGINE.aorticValveInertance,
      avCloseMl: MP_ENGINE.aorticValveCloseMl,
    };
    if (calibrate) {
      // fixed-HR fit of contractility (LVEF), resistance (MAP), filling (LVEDP) and compliance (pulse pressure)
      const c = new Circulation(pat);
      c.run(4);
      for (let it = 0; it < 10; it++) {
        c.run(3);
        const a = c.average(3);
        if (!a) continue;
        const ef = (100 * (a.edv - a.esv)) / Math.max(1, a.edv);
        pat.lv.ees *= Math.pow(p.lvef / Math.max(5, ef), 1.1);
        pat.rsys *= Math.pow(mapT / Math.max(30, a.map), 0.9);
        const dv = 18 * (p.lvedp - a.lvedp);
        pat.stressed += dv;
        c.s.vSV += dv;
        pat.cSa = Math.min(3, Math.max(0.5, (pat.cSa ?? 1.35) * Math.pow(Math.max(10, a.pulsePressure) / ppT, 0.8)));
      }
    }
    this.base = { ees: pat.lv.ees, rees: pat.rv.ees, rsys: pat.rsys, hr: p.baseline.hr, map: mapT };
    this.mapSmooth = mapT;
    return pat;
  }

  private warmUp(): void {
    // settle the volumes at the baseline rate without touching the shared clock, then align the
    // circulation's beat to the clock
    this.pat.hr = this.profile.baseline.hr;
    const nWarm = Math.round(6 / CIRC_DT);
    const nTail = Math.round(2 / CIRC_DT);
    let sysMax = -Infinity;
    let saSum = 0;
    let svSum = 0;
    let paSum = 0;
    for (let i = 0; i < nWarm; i++) {
      const info = circStep(this.pat, {}, this.s, CIRC_DT);
      if (i >= nWarm - nTail) {
        sysMax = Math.max(sysMax, info.P.root);
        saSum += info.P.sa;
        svSum += info.P.sv;
        paSum += info.P.pa;
      }
    }
    // resting systolic pressure: the reference for the rate-pressure product (myocardial demand)
    this.base.sys = Number.isFinite(sysMax) ? sysMax : this.base.map + 25;
    // resting mean pressure as the circulation actually settles (equals the target when calibrated):
    // the baroreflex set point and the perfusion-pressure reference, so the patient is at rest on arrival
    const mapMeasured = saSum / nTail;
    if (Number.isFinite(mapMeasured) && mapMeasured > 30) {
      this.base.map = mapMeasured;
      this.mapSmooth = mapMeasured;
    }
    const cs = this.clock.state();
    this.lastBeat = cs.beat;
    this.s.beatT = cs.tInBeat;
    this.s.beat = cs.beat;
    this.beatAcc = newAcc();
    this.mrBeatMl = 0;
    this.avBeatMl = 0;
    this.sinusHr = this.profile.baseline.hr;
    // resting systemic venous volume: the preload reference of the LVOT obstruction model
    this.base.vSV = this.s.vSV;
    this.svSmooth = svSum / nTail;
    this.paSmooth = paSum / nTail;
  }

  /**
   * An acute coronary syndrome is already under way on arrival: ischaemia is preloaded only in the
   * regions downstream of the culprit (the thrombotic lesions), never in other territories.
   */
  private preloadAcs(): void {
    const p = this.profile;
    if (!p.culprit || p.indication === "SA") return;
    const culprit = new Set<number>();
    this.lesions.forEach((L, i) => {
      if (L.kind === "thrombotic") culprit.add(i);
    });
    if (!culprit.size) return;
    this.computeSupplies();
    this.supplies.forEach((sp, k) => {
      const r = this.flow.regions[k];
      if (!r.lesionIdx || !r.lesionIdx.some((i) => culprit.has(i))) return;
      if (sp.deficit > 0.3) {
        const stemi = p.indication === "STEMI";
        this.resp.preload(k, Math.min(1, sp.deficit), stemi ? 3600 : 1800, stemi ? 0.3 : 0.05, sp.restDeficit);
      }
    });
  }

  /** Fingerprint of a rendered tree: vessel names, sample counts and reference radii (FNV-1a). */
  static treeKey(tree: CoronaryTree): string {
    let h = 0x811c9dc5;
    const mix = (n: number) => {
      h ^= n & 0xffffffff;
      h = Math.imul(h, 0x01000193) >>> 0;
    };
    for (const v of tree.vessels) {
      for (let i = 0; i < v.name.length; i++) mix(v.name.charCodeAt(i));
      mix(v.samples.length);
      const rr = v.refRadii ?? v.radii;
      for (let i = 0; i < rr.length; i += 4) mix(Math.round(rr[i] * 1000));
      if (v.parent) mix(v.parent.index);
    }
    return `t${tree.vessels.length}-${h.toString(16)}`;
  }

  private rememberTree(tree: CoronaryTree | null): void {
    this.tree = tree;
    this.treeKey = tree ? PatientEngine.treeKey(tree) : null;
    if (tree && this.treeKey) {
      this.trees.set(this.treeKey, tree);
      if (this.trees.size > 16) this.trees.delete(this.trees.keys().next().value as string);
    }
  }

  private buildFlow(tree: CoronaryTree | null, lesions: Lesion[]): CoronaryFlowMap {
    return tree ? coronaryFlowFor(tree, lesions) : defaultFlowMap(lesions, this.profile.dominance);
  }

  /**
   * Replace the coronary network (new tree or lesions after PCI). Ischaemia restarts from the current supply.
   * The occlusions and the microvascular state are cleared, unless `opts.keepOcclusions` (pci-patient-coupling:
   * the PCI lab's sync after stenting keeps what other callers set, an air embolus or a hypotension cause's
   * occlusion, on the rebuilt network).
   */
  setCoronaryTree(tree: CoronaryTree | null, lesions: Lesion[] = this.lesions, opts: { keepOcclusions?: boolean } = {}): void {
    this.lesions = lesions.map((l) => ({ ...l }));
    const prevN = this.flow.regions.length;
    this.rememberTree(tree);
    this.flow = this.buildFlow(tree, this.lesions);
    if (this.flow.regions.length !== prevN) this.resp.resize(this.flow.regions.length);
    this.flowScaleMemo = null;
    if (opts.keepOcclusions) return;
    this.occlusions = {};
    this.microvascular = {};
  }

  // -------------------------------------------------------------------------
  // inputs
  // -------------------------------------------------------------------------

  /**
   * The effective aortic valve orifice area, cm² (null: a normal valve). Aortic stenosis gives a
   * slow-rising, low-amplitude aortic pulse with the tip free (diag-pressure-transducer).
   */
  get aorticValveAreaCm2(): number | null {
    return this.pat.avaCm2 ?? null;
  }

  /** Narrow (or, with null, restore) the aortic valve orifice from now on. */
  setAorticValveArea(cm2: number | null): void {
    if (cm2 === null || !(cm2 > 0)) delete this.pat.avaCm2;
    else this.pat.avaCm2 = cm2;
  }

  /** Catheter tip state from the device physics (S7) or tipFromEngagement(). */
  setTip(tip: TipInput): void {
    const was = this.tip.location;
    this.tip = { ...tip };
    if (was !== tip.location) this.emit("tip.location", { location: tip.location, side: tip.side });
  }

  get tipInput(): TipInput {
    return this.tip;
  }

  /**
   * Contrast delivered: into a coronary (by side), the aortic root or the LV (mL). With the injection
   * hazard model on and `hazard: false`, the caller has judged the push's VF hazard already
   * (injectionHazard, contrastDwell), so no VF draw is made here.
   */
  contrast(ml: number, side: "left" | "right" | "root" | "lv", opts: { hazard?: boolean } = {}): void {
    if (!(ml > 0)) return;
    const t = this.clock.state().t;
    const tipState = this.currentTipState();
    const skipVf = !!this.injModel && opts.hazard === false;
    const ev = this.resp.contrast(side === "lv" ? "root" : side, ml, tipState, !!this.tip.conus && side === "right", this.rng, t, this.profile.allergies.contrast, skipVf);
    this.emit("contrast.delivered", { ml, side, totalMl: this.resp.st.contrastTotalMl });
    if (ev.vf) this.triggerVf(ev.vf);
    if (side === "lv" && this.rng.chance(0.4)) this.ectopicNext = true;
    this.checkRenal();
  }

  // --- the injection hazard model (diag-rhythm-haemodynamic-events) ------------------------------

  /**
   * Turn the diagnostic lab's injection hazard model on (MP_INJECTION_HAZARD with these changes),
   * change it, or turn it off (null). Off by default: contrast() then draws the legacy hazard.
   */
  setInjectionHazards(m: Partial<InjectionHazardModel> | null): void {
    this.injModel = m === null ? null : { ...MP_INJECTION_HAZARD, ...(this.injModel ?? {}), ...m };
  }

  /** The injection hazard model now (a copy), or null when it is off. */
  injectionHazards(): InjectionHazardModel | null {
    return this.injModel ? { ...this.injModel } : null;
  }

  /**
   * Judge one push under the injection hazard model (on its own generator): `ml` into this side with
   * what the tip was doing when the push began (the engine's tip now for anything not given). Starts
   * VF and returns its reason when the draw fires; null when it does not or the model is off.
   */
  injectionHazard(ml: number, side: "left" | "right" | "root" | "lv", d: InjectionHazardDetail = {}): string | null {
    const m = this.injModel;
    if (!m || !(ml > 0) || this.rhythm.arrested) return null;
    const coronary = d.coronary ?? (side !== "root" && side !== "lv" && (this.tip.location === "ostium" || this.tip.location === "coronary"));
    const h: InjectionHazardInput = {
      tipState: d.tipState ?? this.currentTipState(),
      conus: d.conus ?? (!!this.tip.conus && side === "right"),
      gap: d.gap ?? this.tip.gap,
      coronary,
    };
    const { perMl, reason } = injectionVfPerMl(m, h);
    if (!(perMl > 0) || !this.injRng.chance(1 - Math.pow(1 - Math.min(1, perMl), ml))) return null;
    this.triggerVf(reason);
    return reason;
  }

  /**
   * Contrast held in the artery by an obstructing catheter for dtS seconds more (`ml` of it): the
   * model's dwell hazard, on its own generator. Starts VF and returns the reason when it fires.
   */
  contrastDwell(ml: number, dtS: number): string | null {
    const m = this.injModel;
    if (!m || this.rhythm.arrested) return null;
    const p = dwellVfProbability(m, ml, dtS);
    if (!(p > 0) || !this.injRng.chance(p)) return null;
    const reason = "contrast held in the artery by an obstructing catheter";
    this.triggerVf(reason);
    return reason;
  }

  /**
   * The model's slow-tick hazards (only while it is on): sustained VT from catheter contact with the
   * LV wall (more with a long QT), a sustained VT reverting once an antiarrhythmic acts, AF started in
   * the case reverting on one, and an SVT ended by AV nodal block.
   */
  private injectionHazardTick(t: number, dt: number): void {
    const m = this.injModel;
    if (!m || this.rhythm.arrested) return;
    const r = this.rhythm.st;
    const aa = this.fx.antiarrhythmic ?? 0;
    if (this.tip.location === "lv" && this.tip.lvContact && r.base !== "vt") {
      const longQt = this.profile.baseline.qtc >= MP_INTERACTION.longQtcS ? m.longQtVtGain : 1;
      if (this.injRng.chance(1 - Math.exp(-m.lvContactVtPerS * longQt * dt))) {
        this.rhythm.startVt(t, m.vtRateBpm, null);
        this.applyRhythmToClock(true);
        this.emit("rhythm.vt", { cause: "catheter contact with the LV wall" });
        return;
      }
    }
    if (r.base === "vt" && r.transientUntil === null && aa > m.antiarrhythmicOn && this.injRng.chance(1 - Math.exp(-m.vtRevertPerS * dt))) {
      this.rhythm.revert();
      this.applyRhythmToClock(true);
      this.emit("rhythm.sinus", { cause: "VT reverted on an antiarrhythmic" });
    } else if (r.base === "af" && r.afRate != null && r.underlying === "sinus" && aa > m.antiarrhythmicOn && this.injRng.chance(1 - Math.exp(-m.afRevertPerS * dt))) {
      this.rhythm.revert();
      this.applyRhythmToClock(true);
      this.emit("rhythm.sinus", { cause: "AF reverted on an antiarrhythmic" });
    } else if (r.base === "svt" && this.fx.avBlockDrive > m.svtBlockOn) {
      this.rhythm.revert();
      this.applyRhythmToClock(true);
      this.emit("rhythm.sinus", { cause: "SVT ended by AV nodal block" });
    }
  }

  /**
   * Take a circulating volume from the patient now, mL (a fasted, dry patient): out of the stressed
   * venous volume at once, down to MIN_STRESSED_ML. The baroreflex answers it as it answers bleeding.
   */
  setVolumeDeficit(ml: number): void {
    if (!(ml > 0)) return;
    this.s.vSV = Math.max(MIN_STRESSED_ML, this.s.vSV - ml);
    this.emit("patient.volume-deficit", { ml });
  }

  /** Blood lost through setHaemorrhage so far, mL (truth, for a bleed's findings and the debrief). */
  get bleedVolumeMl(): number {
    return this.bledMl;
  }

  /**
   * A painful or vagal stimulus. magnitude 0..1. With vagal prevention set (setEmergencyModel), a
   * puncture or sheath without effective local anaesthetic has a larger vagal magnitude. It is the
   * same draw, so a call that brings no vagal onset consumes the generator as before; a vagal onset
   * that the scaling adds takes the onset's two further draws, so the later draws of that seed (the
   * first-contrast reaction draw among them) shift. Incidence over many seeds is unchanged; per-seed
   * outcomes of a full case without an effective local may differ. 'sheath-removal' is a vagal
   * trigger without the procedural pain term, drawn from its own generator, scaled down while saline
   * runs.
   */
  stimulus(kind: StimulusKind, magnitude = 0.5): void {
    const pv = this.vagalPrevention;
    let ev;
    if (kind === "sheath-removal") {
      const m = magnitude * (pv?.salineRunning ? 1 - MP_VAGAL_PREVENTION.salineRelief : 1);
      ev = this.resp.vagalChallenge(m * this.profile.painSensitivity, this.profile.vagalTone, this.fx.sedation, this.vagalRng);
    } else {
      const k = pv && (kind === "puncture" || kind === "sheath") ? 1 + MP_VAGAL_PREVENTION.noLocalGain * (1 - Math.max(0, Math.min(1, pv.local))) : 1;
      ev = this.resp.pain(magnitude * k * this.profile.painSensitivity, this.profile.vagalTone, this.fx.sedation, this.rng);
    }
    this.emit("patient.stimulus", { kind, magnitude });
    if (ev.vagalOnset) this.emit("patient.vagal", { trigger: kind });
  }

  /**
   * Turn the procedure lab's emergency model on (proc-anaphylaxis-vagal), change it, or turn it off
   * (null). Off by default.
   */
  setEmergencyModel(m: Partial<EmergencyModel> | null): void {
    if (m === null) {
      this.vagalPrevention = null;
      this.resp.setCourse(null);
      return;
    }
    if (m.prevention !== undefined) this.vagalPrevention = m.prevention ? { ...m.prevention } : null;
    const c: Partial<Pick<ReactionCourse, "escalation" | "vagalSvrLagS">> = {};
    if (m.reactionEscalation !== undefined) c.escalation = m.reactionEscalation;
    if (m.vagalSvrLagS !== undefined) c.vagalSvrLagS = m.vagalSvrLagS;
    if (Object.keys(c).length || !this.resp.st.course) this.resp.setCourse(c);
  }

  /** The emergency model now (a copy); null when it is off. */
  emergencyModel(): EmergencyModel | null {
    const c = this.resp.st.course;
    if (!c && !this.vagalPrevention) return null;
    return { reactionEscalation: !!c?.escalation, vagalSvrLagS: c?.vagalSvrLagS ?? 0, prevention: this.vagalPrevention ? { ...this.vagalPrevention } : null };
  }

  /**
   * A scenario's contrast reaction (proc-anaphylaxis-vagal): `kind`, beginning `onsetS` after now.
   * The random draw at the first contrast is skipped, so a random case's incidence is unchanged
   * (only scenarios call this). `preArrest`: the late presentation with a bradycardia.
   */
  forceReaction(kind: Exclude<ReactionKind, "none">, onsetS: number, opts: { preArrest?: boolean } = {}): void {
    this.resp.forceReaction(kind, this.clock.state().t + Math.max(0, onsetS), opts);
  }

  /** Whether the reaction under way is the late, pre-arrest presentation (truth, for the debrief and the ledger). */
  reactionPreArrest(): boolean {
    return !!this.resp.st.course?.preArrest && this.resp.st.reaction.kind !== "none";
  }

  /** A scripted vagal episode now (level 0..1, held for holdS), as a scenario's look-alike. */
  forceVagal(level?: number, holdS?: number): void {
    this.resp.forceVagal(level, holdS);
    this.emit("patient.vagal", { trigger: "scenario" });
  }

  /**
   * Give a dose of any formulary drug by any of its routes, without throwing: the result says why
   * a dose was refused (route, infusion-only drug, no dose) and lists the interaction flags it
   * raised. Later packages call this rather than editing pharmacology.ts.
   */
  giveDrug(drug: DrugId, dose: number, route: Route, opts: { side?: "left" | "right" } & InjectionDetail = {}): GiveResult {
    const spec = DRUGS[drug];
    if (!spec) return { ok: false, reason: "route", text: `${drug} is not in the formulary` };
    if (spec.bolus === false) return { ok: false, reason: "infusion-only", text: `${spec.label} is given as an infusion` };
    if (!spec.routes.includes(route)) return { ok: false, reason: "route", text: `${spec.label} is not given by the ${route} route` };
    if (!(dose > 0)) return { ok: false, reason: "dose", text: "No dose" };
    const inj =
      opts.vessel !== undefined || opts.fast !== undefined || opts.bolusUg !== undefined || opts.continuation !== undefined
        ? { vessel: opts.vessel, fast: opts.fast, ...(opts.bolusUg !== undefined ? { bolusUg: opts.bolusUg } : {}), ...(opts.continuation ? { continuation: true } : {}) }
        : undefined;
    const flags = this.give({ drug, dose, route, side: opts.side }, inj);
    // a vasodilator into the radial artery, or intravenously, acts on a radial spasm (diag-spasm-states)
    if (this.radialHost && (drug === "gtn" || drug === "verapamil") && (route === "ia" || route === "iv")) this.radialHost.giveVasodilator(drug, dose, route);
    return { ok: true, flags };
  }

  /** The interaction flags a dose of this drug would raise now (no dose is given). */
  interactionFlags(drug: DrugId): InteractionFlag[] {
    this.pharm.setContext({ avBlock: this.rhythm.st.av, af: this.rhythm.st.base === "af", paced: this.rhythm.st.base === "paced" });
    return this.pharm.flagsFor(drug);
  }

  give(o: DoseOrder, inj?: InjectionDetail): InteractionFlag[] {
    const flags = this.interactionFlags(o.drug);
    this.pharm.give({ ...o, arrest: o.drug === "adrenaline" && this.rhythm.arrested });
    const t = this.clock.state().t;
    this.emit("drug.given", { drug: o.drug, dose: o.dose, route: o.route, side: o.side });
    for (const f of flags) this.emit("drug.interaction", { drug: f.drug, id: f.id, text: f.text });
    this.armProarrhythmia(o.drug, flags);
    // the rest of an intracoronary bolus carried out of the guide by the flush draws nothing new: the bolus was judged when it was given
    if (o.drug === "adenosine" && !(o.route === "ic" && inj?.continuation)) {
      // IC: the sourced 11.6% transient complete block at a standard dose, scaled by the dose of the
      // whole bolus. An IV bolus (SVT-type) is given to block the AV node, so block is likely (MODEL PARAMETER 0.6).
      const whole = o.route === "ic" ? (inj?.bolusUg ?? o.dose) : o.dose;
      const std = o.side === "right" ? ADENOSINE.icStandardUg.right[1] : ADENOSINE.icStandardUg.left[1];
      const p = o.route === "ic" ? ADENOSINE.completeAvBlock.ic * Math.min(1.5, whole / std) : 0.6 * Math.min(1, o.dose / 6000);
      if (this.rng.chance(p)) this.adenosineBlockArmed = true;
      if (this.adnModel && o.route === "ic" && this.adenosineHighRisk(whole, o.side, inj)) this.drawAdenosineHazard(t, o.side);
    }
    return flags;
  }

  startInfusion(o: InfusionOrder): void {
    const flags = o.drug === "adenosine" || o.drug === "noradrenaline" || o.drug === "heparin" ? [] : this.interactionFlags(o.drug);
    this.pharm.startInfusion(o);
    this.emit("drug.infusion", { drug: o.drug, rate: o.rate, site: o.site });
    for (const f of flags) this.emit("drug.interaction", { drug: f.drug, id: f.id, text: f.text });
    this.armProarrhythmia(o.drug, flags);
    if (o.drug === "adenosine" && this.rng.chance(ADENOSINE.completeAvBlock.iv)) this.adenosineBlockArmed = true;
  }

  /**
   * Turn the adenosine hazard model on (physiology-hyperaemia-and-adenosine), change it, or turn it off
   * (null). Off by default: a high-risk dose then only arms AV block as before.
   */
  setAdenosineHazards(m: Partial<AdenosineHazardModel> | null): void {
    if (m === null) {
      this.adnModel = null;
      this.adnPending = null;
      this.adnPendingUntil = null;
      return;
    }
    const H = MP_ADENOSINE_HAZARDS;
    this.adnModel = { afP: H.afP, vfP: H.vfP, noEscapeP: H.noEscapeP, force: null, ...(this.adnModel ?? {}), ...m };
  }

  /** The adenosine hazard model now (a copy), or null when it is off. */
  adenosineHazards(): AdenosineHazardModel | null {
    return this.adnModel ? { ...this.adnModel } : null;
  }

  /** Recent caffeine (blunts every adenosine effect, pharmacology.ts MP_CAFFEINE_ADENOSINE). */
  setRecentCaffeine(on: boolean): void {
    this.pharm.setContext({ caffeine: on });
    this.fx = this.pharm.effects();
  }

  /** The artery injected supplies the AV node: the RCA, or the circumflex of a left-dominant patient (by side when no vessel is named). */
  private avNodalArtery(side: "left" | "right" | undefined, vessel: string | undefined): boolean {
    if (vessel === "RCA") return true;
    if (vessel === "LCx") return this.profile.dominance === "left";
    if (vessel !== undefined) return false;
    return side === "right";
  }

  /** An intracoronary adenosine dose the module warns against: above 100 µg into the AV nodal artery, or a fast push. */
  private adenosineHighRisk(doseUg: number, side: "left" | "right" | undefined, inj: InjectionDetail | undefined): boolean {
    return !!inj?.fast || (doseUg > MP_ADENOSINE_HAZARDS.highDoseUg && this.avNodalArtery(side, inj?.vessel));
  }

  /**
   * Draw (or take the forced) arrhythmia of a high-risk injection given at time t; it fires when the AV
   * nodal effect begins, or is dropped when that injection's effect has passed without reaching the AV
   * node (a fast push into an artery that does not supply it).
   */
  private drawAdenosineHazard(t: number, side: "left" | "right" | undefined): void {
    const m = this.adnModel;
    if (!m) return;
    let out: AdenosineArrhythmia | null = m.force;
    if (out) m.force = null;
    else {
      const u = this.adnRng.next();
      out = u < m.vfP ? "vf" : u < m.vfP + m.afP ? "af" : u < m.vfP + m.afP + m.noEscapeP ? "no-escape" : null;
    }
    if (out) {
      this.adnPending = out;
      this.adnPendingUntil = t + ADENOSINE.timeToMaxIcS + (side === "right" ? ADENOSINE.plateauIcS.right : ADENOSINE.plateauIcS.left);
    }
  }

  /** The patient coughs forcefully (asked to): pressure pulses in the chest for MP_ADENOSINE_HAZARDS.coughS. */
  cough(): void {
    this.coughUntil = this.clock.state().t + MP_ADENOSINE_HAZARDS.coughS;
    this.emit("patient.cough", {});
  }

  /** Temporary pacing at a rate, bpm, or off (null): it captures when the patient's own ventricular rate is slower. */
  setPacing(rateBpm: number | null): void {
    this.pacingRate = rateBpm === null || !(rateBpm > 0) ? null : rateBpm;
    this.emit("pacing.set", { rate: this.pacingRate });
    this.applyRhythmToClock(true);
  }

  /** The temporary pacing rate, bpm, or null when it is off. */
  get pacing(): number | null {
    return this.pacingRate;
  }

  /**
   * A synchronised shock with the stored energy (DC cardioversion). It converts AF (with the chance
   * MP_ADENOSINE_HAZARDS.cardioversionAfSuccess) and VT; in VF or asystole there is no R wave to
   * synchronise to, so nothing is delivered and the charge is kept.
   */
  cardiovert(): ShockOutcome {
    const t = this.clock.state().t;
    const r = this.rhythm.st;
    const d = r.defib;
    if (d.charged <= 0) {
      this.emit("defib.cardiovert", { outcome: "not-charged" });
      return "not-charged";
    }
    if (r.base === "vf" || r.base === "asystole") {
      this.emit("defib.cardiovert", { outcome: "no-change", synchronised: false });
      return "no-change";
    }
    const joules = d.charged;
    const cleared = d.cleared;
    d.charged = 0;
    d.cleared = false;
    d.shocks++;
    d.lastShockT = t;
    let outcome: ShockOutcome = "no-change";
    if (r.base === "af" && r.underlying === "sinus" && this.adnRng.chance(MP_ADENOSINE_HAZARDS.cardioversionAfSuccess)) {
      r.base = "sinus";
      this.adnAf = false;
      this.adnAfRevertAt = null;
      outcome = "converted";
    } else if (r.base === "vt" || r.base === "svt") {
      r.base = r.underlying;
      r.transientUntil = null;
      outcome = "converted";
    } else if (r.base === "af" && r.afRate != null && r.underlying === "sinus" && this.injModel && this.injRng.chance(MP_ADENOSINE_HAZARDS.cardioversionAfSuccess)) {
      // AF started in the case under the injection hazard model: the same chance, on that model's generator
      r.base = "sinus";
      r.afRate = null;
      outcome = "converted";
    }
    if (outcome === "converted" && r.base === "sinus") r.afRate = null;
    this.emit("defib.cardiovert", { outcome, joules, cleared });
    if (joules > 0 && !cleared) this.emit("safety.shock-without-clear", {});
    if (outcome === "converted") this.applyRhythmToClock(true);
    return outcome;
  }

  /** Ventricular standstill of adenosine block without an escape rhythm: no beat for over 1.5 s. */
  private standstill(): boolean {
    if (!this.adnNoEscape || this.clock.state().rhythm !== "asystole") return false;
    const last = lastOf(this.beats);
    return !last || this.clock.state().t - last.t > 1.5;
  }

  /**
   * The adenosine arrhythmias of the hazard model, each slow tick (nothing happens while it has drawn
   * none). A drawn arrhythmia begins with the drug's AV nodal effect (drive above the first-degree
   * threshold of the slow tick): block without an escape rhythm, the pause before R-on-T VF, or AF.
   */
  private adenosineHazardTick(t: number, drive: number): void {
    const H = MP_ADENOSINE_HAZARDS;
    const r = this.rhythm.st;
    if (this.adnPending && drive <= 0.2 && this.adnPendingUntil !== null && t > this.adnPendingUntil) {
      // the injection's effect has passed without reaching the AV node: its arrhythmia is not kept for a later dose
      this.adnPending = null;
      this.adnPendingUntil = null;
    }
    if (this.adnPending && drive > 0.2) {
      const out = this.adnPending;
      this.adnPending = null;
      this.adnPendingUntil = null;
      if (out === "no-escape") {
        if (r.av < 3) this.rhythm.setAv(3, null);
        this.adenosineAv = true;
        this.adnNoEscape = true;
        this.adnNoEscapeUntil = null;
        this.emit("rhythm.av-block", { degree: 3, cause: "adenosine", escape: false });
        this.applyRhythmToClock(true);
      } else if (out === "vf") this.adnVfAt = t + H.vfDelayS;
      else if (out === "af" && r.base === "sinus") {
        r.base = "af";
        this.adnAf = true;
        this.adnAfRevertAt = this.adnRng.chance(H.afSelfRevertP) ? t + H.afRevertS : null;
        this.emit("rhythm.af", { cause: "adenosine" });
        this.applyRhythmToClock(true);
      }
    }
    if (this.adnVfAt !== null && t >= this.adnVfAt) {
      this.adnVfAt = null;
      this.triggerVf("adenosine: R on T after a pause");
    }
    if (this.adnAf) {
      if (r.base !== "af") {
        this.adnAf = false;
        this.adnAfRevertAt = null;
      } else if (this.adnAfRevertAt !== null && t >= this.adnAfRevertAt) {
        r.base = r.underlying;
        this.adnAf = false;
        this.adnAfRevertAt = null;
        this.emit("rhythm.sinus", { cause: "adenosine AF reverted" });
        this.applyRhythmToClock(true);
      }
    }
  }

  /** Amiodarone with a long QT or pre-excited AF (bolus or infusion): VF armed with MP_INTERACTION.proarrhythmiaP. */
  private armProarrhythmia(drug: DrugId, flags: InteractionFlag[]): void {
    if (drug === "amiodarone" && flags.some((f) => f.id === "long-qt-antiarrhythmic" || f.id === "pre-excitation-antiarrhythmic") && this.rng.chance(MP_INTERACTION.proarrhythmiaP)) this.proVfArmed = true;
  }

  /** Supplemental oxygen, L/min (0 = off): an FiO2 term in the SpO2 target. */
  setOxygen(lpm: number): void {
    this.oxygenLpm = Math.max(0, lpm);
    this.emit("oxygen.set", { lpm: this.oxygenLpm, fio2: this.fio2() });
  }

  /** Inspired oxygen fraction now. */
  fio2(): number {
    const M = MP_FORMULARY_ENGINE;
    return Math.min(M.maxFio2, 0.21 + M.fio2PerLpm * this.oxygenLpm);
  }

  /** Ongoing blood loss from the circulation (a bleeding site), mL/s (0 = none). */
  setHaemorrhage(mlPerS: number): void {
    this.haemorrhageMlS = Math.max(0, mlPerS);
    this.emit("patient.haemorrhage", { mlPerS: this.haemorrhageMlS });
  }

  /** Loss of vascular tone 0..1 from a cause script (vagal, reaction, sepsis), on top of the profile's. */
  setVasodilation(fraction: number): void {
    this.vasodilationRt = Math.max(0, Math.min(0.9, fraction));
  }

  stopInfusion(drug: InfusionDrug): void {
    this.pharm.stopInfusion(drug);
    this.emit("drug.infusion-stopped", { drug });
  }

  /**
   * Crystalloid bolus (mL) given over `overS` seconds. A negative volume takes that volume out of the
   * circulation over the same time (a lab's fasting deficit or a bleed's stressed share), at the same rate
   * as a positive one, never below the stressed-volume floor of the other losses (20 mL).
   */
  fluid(ml: number, overS = 120): void {
    this.fluidPending.push({ ml, rate: ml / Math.max(1, overS) });
    this.emit("fluid.given", { ml, overS });
  }

  /**
   * Stressed blood volume added (ml < 0: removed) over overS seconds without a fluid order and without a
   * telemetry event (diag-lv-aorta-task): a scenario's start state (a raised filling pressure) or the
   * volume load of a chamber injection. Orders go through fluid().
   */
  loadVolume(ml: number, overS = 1): void {
    if (!Number.isFinite(ml) || ml === 0) return;
    this.fluidPending.push({ ml, rate: ml / Math.max(0.05, overS) });
  }

  /** Balloon or device occlusion on a vessel (VesselId or tree vessel name) at a position 0..1. */
  setOcclusion(id: string, o: { vessel: VesselId | string; param: number; fraction: number }): void {
    const name = this.vesselName(o.vessel);
    if (!name) return;
    this.occlusions[id] = { vessel: name, param: o.param, fraction: Math.max(0, Math.min(1, o.fraction)) };
  }

  clearOcclusion(id: string): void {
    delete this.occlusions[id];
  }

  /** Slow flow or no-reflow beyond a point (severity 0..1 of microvascular capacity lost). */
  setNoReflow(vessel: VesselId | string, param: number, severity: number): void {
    const name = this.vesselName(vessel);
    if (!name) return;
    for (const r of this.flow.regions) {
      const pp = r.path.find((x) => x.vessel === name);
      if (!pp) continue;
      const beyond = pp.vessel === r.vessel ? r.p1 >= param : pp.param >= param;
      if (beyond) this.microvascular[r.id] = Math.max(0, 1 - severity);
    }
  }

  clearNoReflow(): void {
    this.microvascular = {};
  }

  /** Blood entering the pericardium (perforation), mL/s. */
  setPericardialInflow(mlPerS: number): void {
    this.periInflow = Math.max(0, mlPerS);
  }

  drainPericardium(ml: number): number {
    const d = Math.min(this.periMl, Math.max(0, ml));
    this.periMl -= d;
    this.emit("pericardium.drained", { ml: d });
    return d;
  }

  holdBreath(level: number | null): void {
    this.clock.holdBreath(level);
  }

  // defibrillator and CPR
  charge(joules = 200): void {
    this.rhythm.charge(this.clock.state().t, joules);
    this.emit("defib.charge", { joules });
  }
  clearForShock(): void {
    this.rhythm.clear();
    this.emit("defib.clear", {});
  }
  shock(): ShockOutcome {
    const t = this.clock.state().t;
    const rs = this.rhythm.st;
    if (this.refractoryVf > 0 && rs.base === "vf" && rs.defib.charged > 0) {
      // refractory VF (setRefractoryVf): the shock is delivered and fails, whatever its energy
      this.refractoryVf--;
      const d = rs.defib;
      const joules = d.charged;
      const cleared = d.cleared;
      d.charged = 0;
      d.cleared = false;
      d.shocks++;
      d.lastShockT = t;
      const arrestS = rs.arrestOnset !== null ? t - rs.arrestOnset : 0;
      this.emit("defib.shock", { outcome: "still-vf", joules, cleared, arrestS: Math.round(arrestS), refractory: true });
      if (!cleared) this.emit("safety.shock-without-clear", {});
      return "still-vf";
    }
    const r = this.rhythm.shock(t, this.rng);
    this.emit("defib.shock", { outcome: r.outcome, joules: r.joules, cleared: r.cleared, arrestS: Math.round(r.arrestS) });
    if (r.joules > 0 && !r.cleared) this.emit("safety.shock-without-clear", {});
    if (r.outcome === "converted") this.applyRhythmToClock(true);
    return r.outcome;
  }
  setCpr(on: boolean): void {
    this.rhythm.setCpr(on);
    this.emit(on ? "cpr.start" : "cpr.stop", {});
  }

  /** The next `shocks` shocks in VF fail whatever their energy (a refractory VF scenario; 0 ends it). pci-patient-coupling. */
  setRefractoryVf(shocks: number): void {
    this.refractoryVf = Math.max(0, Math.floor(shocks));
  }

  /**
   * Breathing swings the pericardial constraint under an effusion (pulsus paradoxus, MP_COUPLING.pulsusShare)
   * from now on. Off by default, so a lab that does not turn it on keeps the earlier effusion behaviour.
   */
  setPulsusParadoxus(on: boolean): void {
    this.pulsusOn = on;
  }

  /** Shocks in VF still to fail (setRefractoryVf). */
  get refractoryShocks(): number {
    return this.refractoryVf;
  }

  /**
   * Acute aortic regurgitation from now on, severity 0..1 (a guide holding a cusp open; 0 or null: none).
   * pci-patient-coupling; MP_COUPLING.arConductanceMlSPerMmHg at severity 1.
   */
  setAorticRegurgitation(severity: number | null): void {
    this.arSeverity = severity && severity > 0 ? Math.min(1, severity) : 0;
  }

  get aorticRegurgitation(): number {
    return this.arSeverity;
  }

  /**
   * Mitral regurgitation from now on, severity 0..1 (diag-lv-aorta-task: a pigtail on the mitral apparatus,
   * or a scenario's MR; 0 or null: none). MP_LEFT_HEART.mrConductanceMlSPerMmHg at severity 1.
   */
  setMitralRegurgitation(severity: number | null): void {
    if (this.mrSeverity === 0 && !this.atrialOn && severity && severity > 0) {
      this.mrBeatMl = 0;
      this.avBeatMl = 0;
    }
    this.mrSeverity = severity && severity > 0 ? Math.min(1, severity) : 0;
    if (this.mrSeverity > 0) this.pat.mrConductance = MP_LEFT_HEART.mrConductanceMlSPerMmHg * this.mrSeverity;
    else delete this.pat.mrConductance;
    if (this.mrSeverity === 0 && !this.atrialOn) this.lastLeftBeat = null;
  }

  get mitralRegurgitation(): number {
    return this.mrSeverity;
  }

  /**
   * Atrial contraction on the left atrium (diag-lv-aorta-task): the a wave on the LV diastolic trace, after
   * which the LVEDP is read. Off by default (the earlier model had none); not while the rhythm has no
   * organised atrial activity is the caller's choice.
   */
  setAtrialContraction(on: boolean): void {
    if (on && !this.atrialOn && this.mrSeverity === 0) {
      this.mrBeatMl = 0;
      this.avBeatMl = 0;
    }
    this.atrialOn = on;
    if (on) this.pat.atrialKickMmHg = MP_LEFT_HEART.atrialKickMmHg;
    else delete this.pat.atrialKickMmHg;
    if (this.mrSeverity === 0 && !this.atrialOn) this.lastLeftBeat = null;
  }

  get atrialContraction(): boolean {
    return this.atrialOn;
  }

  /** The last closed beat of the left heart (forward and mitral regurgitant volumes); null unless MR or atrial contraction is on. */
  leftHeartBeat(): LeftHeartBeat | null {
    return this.lastLeftBeat;
  }

  /**
   * How far the aortic valve is open now, 0 (closed) .. 1: the forward flow through it as a share of its
   * recent peak (MP_LEFT_HEART.avOpenTauS). Read only; the rod model's systolic valve opening
   * (src/physics/lumen.ts valveControlInput) is driven from it.
   */
  aorticValveOpening(): number {
    const q = Math.max(0, this.lastInfo?.F.av ?? 0);
    return this.avPeak > 1 ? Math.min(1, q / this.avPeak) : 0;
  }

  /**
   * Class the tip state from the trace the line shows as well as from the tip (pci-patient-coupling; off by
   * default): an aortic tip whose displayed pulse has fallen below MP_COUPLING.displayedDampedPulseShare of the
   * tip's own pulse reads 'damped', as the operator sees it. Off: the class follows the tip alone, as before.
   */
  setDisplayedDampingClass(on: boolean): void {
    this.dampedClassOn = on;
    this.vitalsCache = null;
  }

  // --- catheter-tip and radial spasm (diag-spasm-states) ---------------------------------

  /**
   * Turn the diagnostic lab's catheter-tip spasm model on (responses.ts TipSpasmModel), or off (null:
   * the legacy dynamics every other lab keeps). Off by default.
   */
  setTipSpasmModel(m: TipSpasmModel | null): void {
    this.resp.tipSpasm = m ? { ...m, gain: { ...m.gain } } : null;
  }

  /** The catheter-tip spasm model now (a copy), or null. */
  tipSpasmModel(): TipSpasmModel | null {
    const m = this.resp.tipSpasm;
    return m ? { ...m, gain: { ...m.gain } } : null;
  }

  /** The model for this patient's coronary tree: a smaller ostium is more susceptible (tipSpasmSusceptibility). */
  tipSpasmModelForTree(): TipSpasmModel {
    return tipSpasmModelFor(ostialRadii(this.tree));
  }

  /** Catheter-tip spasm on each side now (0 none … 0.9; truth, for the image and the debrief); fills `out` when given. */
  tipSpasm(out: { left: number; right: number } = { left: 0, right: 0 }): { left: number; right: number } {
    out.left = this.resp.st.spasm.left;
    out.right = this.resp.st.spasm.right;
    return out;
  }

  /** The epicardial dilation of the drugs now (0..1; the cached effects of the last step, no recompute). */
  get epicardialDilation(): number {
    return this.fx.epicardialDilation;
  }

  /**
   * Forearm pain from a radial spasm (diag-spasm-states), magnitude 0..1: the radial host's pain
   * (LiveRadialSpasm.hurt), reported as the vitals' symptoms.forearmPain and to the patient's voice
   * ('patient.stimulus' of kind 'radial-spasm', as the full case's), and not the procedural chest pain:
   * it enters neither chestPain nor the sympathetic drive nor the afterload. `vagal`: a severe insult
   * (an avulsion) also makes the vagal draw of a painful stimulus, without the chest pain. Nothing
   * without a radial artery.
   */
  forearmPain(magnitude: number, opts: { vagal?: boolean } = {}): void {
    const r = this.radialHost;
    if (!r) return;
    const m = Math.max(0, Math.min(1, Number.isFinite(magnitude) ? magnitude : 0));
    r.hurt(m);
    this.vitalsCache = null;
    this.emit("patient.stimulus", { kind: "radial-spasm", magnitude: m, forearm: true });
    if (opts.vagal) {
      const ev = this.resp.vagalChallenge(m * this.profile.painSensitivity, this.profile.vagalTone, this.fx.sedation, this.rng);
      if (ev.vagalOnset) this.emit("patient.vagal", { trigger: "radial-spasm" });
    }
  }

  /**
   * Give the patient a radial artery in the procedure (diag-spasm-states): a live radial spasm host
   * (radialSpasm.ts LiveRadialSpasm) from the profile's artery, age, sex and smoking with the sheath
   * and any scenario start, stepped on the patient clock with the patient's anxiety, sedation and
   * running vasopressors. Vasodilators given into the artery (giveDrug route 'ia') act on it, and
   * intravenous ones at their smaller share. null removes it. Off by default.
   */
  setRadialAccess(o: (Partial<LiveRadialSetup> & { sheathOdMm: number }) | null): void {
    if (!o) {
      this.radialHost = null;
      return;
    }
    const p = this.profile;
    this.radialHost = new LiveRadialSpasm(
      { radialDiamMm: p.radialDiamMm, ageY: p.ageY, female: p.sex === "F", smoker: !!p.risk?.smoker, ...o },
      this.clock.state().t,
    );
  }

  /** The live radial spasm host, or null (no radial artery in the procedure). */
  get radial(): LiveRadialSpasm | null {
    return this.radialHost;
  }

  /** An intravenous vasopressor infusion is running (the radial spasm drive). */
  vasopressorRunning(): boolean {
    return this.pharm.st.infusions.some((i) => i.on && i.rate > 0 && VASOPRESSOR_INFUSIONS.has(i.drug));
  }

  /** The tip state from the catheter tip alone (the hazards of an injection), whatever the line shows. */
  physicalTipState(): TipPressureState {
    return this.currentTipState();
  }

  /** Increases each time the regional supplies are recomputed (a reader can cache what it derives from them). */
  get suppliesVersion(): number {
    return this.suppliesVer;
  }

  /**
   * Pulsus paradoxus as the arterial line shows it: the swing in systolic arterial pressure over the last
   * MP_COUPLING.pulsusBeats beats (at least one breath), mmHg; 0 with fewer than four beats.
   */
  pulsusParadoxus(): number {
    const b = this.beats.slice(-MP_COUPLING.pulsusBeats);
    if (b.length < 4) return 0;
    let hi = -Infinity;
    let lo = Infinity;
    for (const x of b) {
      hi = Math.max(hi, x.sa.sys);
      lo = Math.min(lo, x.sa.sys);
    }
    return hi - lo;
  }

  /**
   * The live mean flow into a tree vessel over its flow at rest (pci-patient-coupling): the engine's flow now
   * against the flow the same network, occlusions, spasm and microvascular state would carry at the resting
   * perfusion pressure and demand, without hyperaemia or a catheter in the ostium. 1 at rest; near 0 in VF
   * without compressions; above 1 with hyperaemia. 1 for a vessel outside the flow map.
   */
  coronaryFlowScale(vessel: string): number {
    const m = this.lastFlowMods;
    if (!m || !this.flow.vessels[vessel] || !this.supplies.length) return 1;
    // cached per supply update; the resting flows are kept until the network, the occlusions, spasm or the
    // microvascular state change (they change at most once per slow tick)
    let memo = this.flowScaleMemo;
    if (!memo || memo.supplies !== this.supplies) {
      const restKey = JSON.stringify([m.occlusions, m.spasm, m.microvascular]);
      memo = { supplies: this.supplies, restKey, restQ: memo && memo.restKey === restKey ? memo.restQ : null, byVessel: new Map() };
      this.flowScaleMemo = memo;
    }
    const hit = memo.byVessel.get(vessel);
    if (hit !== undefined) return hit;
    if (!memo.restQ) {
      const restM: FlowModifiers = { ...m, perfusion: 1, demand: 1, hyperaemia: { left: 0, right: 0 }, ostial: { left: 1, right: 1 } };
      memo.restQ = this.flow.regions.map((r) => supplyFor(r, this.flow, restM).q);
    }
    const live = vesselFlowProfile(this.flow, vessel, this.supplies.map((x) => x.q))[0] ?? 0;
    const rest = vesselFlowProfile(this.flow, vessel, memo.restQ)[0] ?? 0;
    const x = rest > 1e-6 ? live / rest : 1;
    memo.byVessel.set(vessel, x);
    return x;
  }

  /** Measure the ACT now (point-of-care). */
  measureAct(): number {
    const act = Math.round(this.pharm.act(this.profile.act.baseline, this.profile.act.sensitivity));
    this.emit("act.measured", { act, heparinUmL: Math.round(this.pharm.heparinUmL() * 100) / 100 });
    return act;
  }

  startNibp(): void {
    if (this.nibp.running) return;
    this.nibp.running = true;
    this.nibp.startedAt = this.clock.state().t;
  }

  setNibpInterval(minutes: number | null): void {
    this.nibp.intervalMin = minutes;
    this.nibp.nextAt = minutes ? this.clock.state().t + minutes * 60 : null;
  }

  silenceAlarms(seconds = 120): void {
    this.silencedUntil = this.clock.state().t + seconds;
  }

  /** What a right heart catheter reads now: RA, PA, PCWP (from the LVEDP), CO and SVR. */
  rightHeart(): RightHeartNumbers {
    const v = this.vitals();
    const ra = this.svSmooth;
    const co = Math.max(0.05, v.cardiacOutput);
    const map = v.aortaTrue.mean;
    const wood = (map - ra) / co;
    return { raMmHg: ra, paMeanMmHg: this.paSmooth, pcwpMmHg: v.lvedp, coLMin: v.cardiacOutput, mapMmHg: map, svrDyn: 80 * wood, svrWood: wood };
  }

  /** Thrombus and stent-thrombosis hazards now (seeded base rate × antithrombotic effect). */
  thrombusHazard(): ReturnType<typeof thrombusHazardFor> {
    return thrombusHazardFor(this.profile, this.lesions, this.fx);
  }

  /** The contrast ceilings for this patient with today's total (contrastBudget.ts). */
  contrastBudget(opts: Omit<ContrastBudgetInput, "egfr" | "crclMlMin" | "weightKg" | "usedMl"> = {}): ContrastBudget {
    return contrastBudgetForProfile(this.profile, { ...opts, usedMl: this.resp.st.contrastTotalMl });
  }

  // -------------------------------------------------------------------------
  // outputs
  // -------------------------------------------------------------------------

  /** Telemetry since the last call. */
  drainEvents(): TelemetryEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  /** R waves since the last call (monitor beep, gating). */
  drainBeats(): BeatEvent[] {
    const b = this.beatEvents;
    this.beatEvents = [];
    return b;
  }

  get time(): number {
    return this.clock.state().t;
  }

  clockState(): ClockState {
    return this.clock.state();
  }

  vitals(): Vitals {
    if (!this.vitalsCache) this.vitalsCache = this.computeVitals();
    return this.vitalsCache;
  }

  /** Instantaneous mean-flow profile along a tree vessel (mL/s per sample) times the phasic factor now. */
  coronaryFlow(vessel: string, phasic = true): Float32Array {
    const q = this.supplies.map((s) => s.q);
    const prof = vesselFlowProfile(this.flow, vessel, q);
    if (!phasic) return prof;
    const side = this.flow.vessels[vessel]?.side ?? "left";
    const k = phasicFlow(this.clock.state().phase, side);
    for (let i = 0; i < prof.length; i++) prof[i] *= k;
    return prof;
  }

  /** Current mean flow per region (mL/s) and deficit. */
  regionSupply(): RegionSupply[] {
    return this.supplies;
  }

  /**
   * Regional ischaemia and necrosis of the LV myocardium, with the LVEF, for the ventriculogram
   * (lvGram.segmentsFromEngine maps the regions to wall segments). Read only: nothing changes.
   */
  lvWallState(): LvWallState {
    const st = this.resp.st;
    const regions: LvWallRegion[] = [];
    this.flow.regions.forEach((r, k) => {
      if (r.rv) return;
      regions.push({ dir: [r.dir[0], r.dir[1], r.dir[2]], territory: r.territory, demand: r.demand, ischaemia: st.isch[k] ?? 0, necrosis: st.necro[k] ?? 0 });
    });
    const b = lastOf(this.beats);
    const ef = b ? (100 * (b.edv - b.esv)) / Math.max(1, b.edv) : this.profile.lvef;
    return { regions, baselineEf: this.profile.lvef, ef, ectopic: this.cur.morph === "ectopic" };
  }

  /** 12-lead ECG over the last `seconds` (default 10) at 250 Hz, oldest first. */
  ecg12(seconds = 10): { rate: number; leads: Record<Lead, Float32Array> } {
    const n = Math.min(this.trace.count, Math.round(seconds * SAMPLE_HZ));
    const out = {} as Record<Lead, Float32Array>;
    LEADS.forEach((l, li) => {
      const a = new Float32Array(n);
      for (let k = 0; k < n; k++) a[n - 1 - k] = this.trace.ecg[li][this.trace.idx(k)];
      out[l] = a;
    });
    return { rate: SAMPLE_HZ, leads: out };
  }

  // -------------------------------------------------------------------------
  // simulation
  // -------------------------------------------------------------------------

  /** Advance patient time by dt seconds (fixed internal steps; any split of dt gives the same result). */
  advance(dt: number): void {
    if (!(dt > 0)) return;
    // integer time base (0.1 µs ticks) so that any split of the same span gives the same steps
    this.acc += Math.round(Math.min(dt, 120) * TICKS_PER_S);
    while (this.acc >= STEP_TICKS) {
      this.acc -= STEP_TICKS;
      this.stepOnce();
    }
    this.vitalsCache = null;
  }

  private stepOnce(): void {
    const dt = CIRC_DT;
    this.clock.advance(dt);
    const cs = this.clock.state();
    if (cs.beat !== this.lastBeat) this.onBeat(cs);
    const pat = this.pat;
    // external pressure on the ventricles: pericardial effusion and chest compressions
    const peri = Math.min(MP_ENGINE.periMaxMmHg, MP_ENGINE.periK * (Math.exp(this.periMl / MP_ENGINE.periV0) - 1));
    // with an effusion the constraint rises on inspiration (pulsus paradoxus, MP_COUPLING.pulsusShare); none without one
    let ext = this.pulsusOn && peri > 0 ? peri * (1 + MP_COUPLING.pulsusShare * (2 * Math.min(1, cs.resp / MP_COUPLING.pulsusTidal) - 1)) : peri;
    if (this.rhythm.st.cpr) {
      const ph = (cs.t * MP_ENGINE.cprRate) / 60;
      const x = Math.max(0, Math.sin(2 * Math.PI * ph));
      ext += MP_ENGINE.cprAmp * x * x;
    }
    if (cs.t < this.coughUntil) {
      // forceful coughing: pressure pulses in the chest (cough CPR, MP_ADENOSINE_HAZARDS)
      const ph = (cs.t * MP_ADENOSINE_HAZARDS.coughRatePerMin) / 60;
      const x = Math.max(0, Math.sin(2 * Math.PI * ph));
      ext += MP_ADENOSINE_HAZARDS.coughAmpMmHg * x * x * x * x;
    }
    pat.pericardial = ext;
    this.s.beatT = cs.tInBeat;
    this.s.beat = cs.beat;
    const info = circStep(pat, {}, this.s, dt);

    this.lastInfo = info;
    if (this.arSeverity > 0 && info.P.root > info.P.lv) {
      // acute aortic regurgitation (a cusp held open): blood falls back from the root into the LV in diastole
      const q = Math.min(this.s.vRoot * 0.5, MP_COUPLING.arConductanceMlSPerMmHg * this.arSeverity * (info.P.root - info.P.lv) * dt);
      this.s.vRoot -= q;
      this.s.vLV += q;
    }
    if (this.mrSeverity > 0 || this.atrialOn) {
      // the left heart task's beat accumulators (diag-lv-aorta-task)
      this.mrBeatMl += (info.F.mr ?? 0) * dt;
      this.avBeatMl += Math.max(0, info.F.av) * dt;
    }
    {
      // the running peak of aortic valve flow, for the valve's systolic opening (aorticValveOpening)
      const q = Math.max(0, info.F.av);
      this.avPeak = q > this.avPeak ? q : this.avPeak * Math.exp(-dt / MP_LEFT_HEART.avOpenTauS);
    }
    if (this.periMl > 0) {
      // a ventricle squeezed by the effusion empties and no further: what it would have ejected past
      // empty goes back where it went (mass kept; without this the model's volumes run negative and
      // the pressures diverge under a large effusion)
      const floor = MP_ENGINE.ventMinMl;
      if (this.s.vLV < floor) {
        this.s.vRoot -= floor - this.s.vLV;
        this.s.vLV = floor;
        if (this.s.qAv !== undefined && this.s.qAv > 0) this.s.qAv = 0;
      }
      if (this.s.vRV < floor) {
        this.s.vPA -= floor - this.s.vRV;
        this.s.vRV = floor;
      }
    }
    if (this.periInflow > 0) {
      // blood leaves the arteries for the pericardium (no more than the arteries hold)
      const d = Math.min(this.periInflow * dt, Math.max(0, this.s.vSA));
      this.periMl += d;
      this.s.vSA -= d;
    }

    // tip and transducer
    const side = this.tip.side ?? "left";
    const restSide = side === "left" ? this.flow.leftRest : this.flow.rightRest;
    const h = side === "left" ? this.fx.hyperaemia.left : this.fx.hyperaemia.right;
    const rBed = (this.base.map - P_BED) / Math.max(0.05, restSide * (1 + h * (this.flow.cfr - 1)));
    const spasm = this.resp.st.spasm[side];
    const pTip = this.tipChamber.step(dt, this.tip, { pAo: info.P.root, pLv: info.P.lv, pRv: info.P.rv, phase: cs.phase, rBed, spasm });
    const reading = this.tip.valveOpen ? this.transducer.step(dt, 0) : this.transducer.step(dt, pTip);

    // beat accumulators
    const a = this.beatAcc;
    a.n++;
    a.aoMax = Math.max(a.aoMax, info.P.root);
    a.aoMin = Math.min(a.aoMin, info.P.root);
    a.aoSum += info.P.root;
    a.saMax = Math.max(a.saMax, info.P.sa);
    a.saMin = Math.min(a.saMin, info.P.sa);
    a.saSum += info.P.sa;
    a.tipMax = Math.max(a.tipMax, pTip);
    a.tipMin = Math.min(a.tipMin, pTip);
    a.tipSum += pTip;
    a.rdMax = Math.max(a.rdMax, reading);
    a.rdMin = Math.min(a.rdMin, reading);
    a.rdSum += reading;
    a.lvMax = Math.max(a.lvMax, info.P.lv);
    a.lvLast = info.P.lv;
    a.vMax = Math.max(a.vMax, this.s.vLV);
    a.vMin = Math.min(a.vMin, this.s.vLV);
    a.avSum += info.F.av * dt;

    // atrial timer for dissociated P waves
    this.atrialT += dt;
    const aRR = 60 / Math.max(30, this.sinusHr);
    if (this.atrialT >= aRR) this.atrialT -= aRR;

    this.stepCount++;
    if (this.stepCount % STEPS_PER_SAMPLE === 0) this.recordSample(cs, reading, pTip, info.P.root, info.P.sa);
    this.slowAcc += dt;
    if (this.slowAcc >= SLOW_DT - 1e-9) {
      this.slowAcc -= SLOW_DT;
      this.slowTick(cs);
    }
  }

  private onBeat(cs: ClockState): void {
    this.lastBeat = cs.beat;
    this.pat.hr = 60 / cs.rr;
    for (const b of this.clock.drainBeats()) this.beatEvents.push(b);
    if (this.beatEvents.length > 64) this.beatEvents.splice(0, this.beatEvents.length - 64);
    const a = this.beatAcc;
    if (a.n > 10) {
      const n = a.n;
      const num = (mx: number, mn: number, sum: number): ArtNumbers => ({ sys: mx, dia: mn, mean: sum / n });
      const bs: BeatSummary = {
        t: cs.t,
        rr: this.prevRR,
        ao: num(a.aoMax, a.aoMin, a.aoSum),
        sa: num(a.saMax, a.saMin, a.saSum),
        tip: num(a.tipMax, a.tipMin, a.tipSum),
        reading: num(a.rdMax, a.rdMin, a.rdSum),
        lvSys: a.lvMax,
        lvedp: a.lvLast,
        edv: a.vMax,
        esv: a.vMin,
        sv: a.avSum,
      };
      this.beats.push(bs);
      if (this.beats.length > 12) this.beats.shift();
      if (this.mrSeverity > 0 || this.atrialOn) {
        const tot = this.avBeatMl + this.mrBeatMl;
        this.lastLeftBeat = { forwardMl: this.avBeatMl, mrMl: this.mrBeatMl, regurgitantFraction: tot > 1e-6 ? this.mrBeatMl / tot : 0, lvedp: a.lvLast };
      }
    }
    // the left heart accumulators are per beat: they restart with every closed beat
    this.mrBeatMl = 0;
    this.avBeatMl = 0;
    this.beatAcc = newAcc();

    // ECG parameters of the new beat
    const v = this.resp.vectors(this.flow);
    const base = this.rhythm.st.base;
    let morph: BeatMorph = base === "vt" ? "vt" : base === "aivr" ? "aivr" : base === "paced" ? "paced" : "normal";
    const wasEctopic = this.ectopicNext;
    if (this.ectopicNext && morph === "normal") morph = "ectopic";
    this.ectopicNext = false;
    this.prev = this.cur;
    this.cur = { morph, qt: cs.endSystole, st: v.st, tExtra: v.t, qrsScale: 1 / Math.pow(this.profile.habitus, 1.2) };

    // compensatory pause after an ectopic beat; then a new ectopic chance
    if (this.compensate !== null) {
      const snap = this.clock.snapshot();
      snap.rr = this.compensate;
      this.clock.restore(snap);
      this.compensate = null;
    }
    if (wasEctopic) {
      // the ectopic beat came early: the next RR closes the gap to two sinus cycles
      const sinusRR = 60 / Math.max(30, this.clock.snapshot().hrTarget);
      this.compensate = Math.max(0.3, 2 * sinusRR - this.prevRR);
    }
    this.prevRR = cs.rr;
    if (this.tip.location === "lv" && this.tip.lvContact && this.rng.chance(MP_ENGINE.pvcPerBeatLvContact) && morph === "normal") this.prematureBeat();
  }

  /** Fire a premature ventricular beat at the next step (clock RR shortened through snapshot/restore). */
  private prematureBeat(): void {
    if (this.rhythm.arrested) return;
    const cs = this.clock.state();
    const snap = this.clock.snapshot();
    const coupling = Math.max(0.32, 0.55 * cs.rr);
    snap.rr = Math.max(cs.tInBeat + CIRC_DT, coupling);
    this.clock.restore(snap);
    this.ectopicNext = true;
  }

  private recordSample(cs: ClockState, reading: number, pTip: number, pAo: number, pSa: number): void {
    const tr = this.trace;
    const i = tr.head;
    tr.t[i] = cs.t;
    const v = this.ecgVector(cs);
    leadsFromVcg(v, this.leadTmp);
    // baseline wander with respiration and a little deterministic noise (MODEL)
    const wander = 0.04 * (cs.resp - 0.1);
    const nz = 0.008 * Math.sin(cs.t * 2 * Math.PI * 47.3 + this.ecgSeed) + 0.006 * Math.sin(cs.t * 2 * Math.PI * 31.1);
    const cpr = this.rhythm.st.cpr ? 0.9 * Math.sin((2 * Math.PI * cs.t * MP_ENGINE.cprRate) / 60) : 0;
    for (let l = 0; l < 12; l++) tr.ecg[l][i] = this.leadTmp[l] + wander * (l < 6 ? 0.6 : 1) + nz + cpr * (l === 1 ? 1 : 0.5);
    tr.art[i] = reading;
    tr.aoTrue[i] = pAo;
    tr.tipTrue[i] = pTip;
    // pleth: delayed, low-passed peripheral pressure pulse
    const ring = this.saRing;
    const ri = this.stepCount / STEPS_PER_SAMPLE;
    ring[ri % ring.length] = pSa;
    const d = Math.round(MP_ENGINE.plethDelay * SAMPLE_HZ);
    const delayed = ring[(ri - d + ring.length * 4) % ring.length];
    this.plethLp += (delayed - this.plethLp) * (1 - Math.exp(-1 / SAMPLE_HZ / MP_ENGINE.plethTau));
    tr.pleth[i] = this.plethLp;
    tr.head = (i + 1) % tr.size;
    tr.count = Math.min(tr.size, tr.count + 1);
  }

  /** The heart's dipole now (Frank, mV). */
  private ecgVector(cs: ClockState): Vec3f {
    const v = this.ecgTmp;
    v[0] = v[1] = v[2] = 0;
    const base = this.rhythm.st.base;
    const t = cs.tInBeat;
    if (base === "vf") {
      const since = this.rhythm.st.arrestOnset !== null ? cs.t - this.rhythm.st.arrestOnset : 0;
      return vfVcg(cs.t, since, this.ecgSeed, v);
    }
    if (base === "asystole") return v;
    // current beat, the T tail of the previous beat, and the onset of the next
    ventricularVcg(t, this.cur, v);
    if (this.prev && t + this.prevRR < this.prev.qt + 0.15) {
      const w = ventricularVcg(t + this.prevRR, this.prev, [0, 0, 0]);
      v[0] += w[0];
      v[1] += w[1];
      v[2] += w[2];
    }
    if (t > cs.rr - 0.16) {
      const nextBeat: EcgBeat = { ...this.cur, morph: this.ectopicNext ? "ectopic" : this.cur.morph === "ectopic" ? "normal" : this.cur.morph };
      const w = ventricularVcg(t - cs.rr, nextBeat, [0, 0, 0]);
      v[0] += w[0];
      v[1] += w[1];
      v[2] += w[2];
    }
    // atrial activity
    if (base === "af") return fWaveVcg(cs.t, this.ecgSeed, v);
    if (base === "vt" || base === "aivr" || base === "svt") return v;
    const pr = 0.16 + this.fx.prDelta + (this.rhythm.st.av === 1 ? 0.1 : 0);
    const pp = pPeakBeforeR(pr);
    if (this.rhythm.st.av === 3) {
      const aRR = 60 / Math.max(30, this.sinusHr);
      pWaveVcg(this.atrialT, v);
      pWaveVcg(this.atrialT - aRR, v);
      return v;
    }
    if (this.cur.morph !== "ectopic") pWaveVcg(t - (cs.rr - pp), v);
    if (this.rhythm.st.av === 2) pWaveVcg(t - (cs.rr / 2 - pp), v);
    return v;
  }

  private hrModel(): number {
    const p = this.profile;
    const auto = this.resp.autonomic(this.fx);
    const sym = this.resp.symptoms(this.flow, this.fx, { painSensitivity: p.painSensitivity, anxietyBaseline: p.anxiety, arrested: this.rhythm.arrested, map: this.mapSmooth, lvedp: lastOf(this.beats)?.lvedp ?? p.lvedp });
    const baro = Math.max(MP_ENGINE.baroHrMin, Math.min(MP_ENGINE.baroHrMax, MP_ENGINE.baroHrGain * (this.base.map - this.mapSmooth)));
    let hr = this.base.hr + baro * (1 - 0.7 * this.resp.st.vagal) + 10 * (sym.anxiety - p.anxiety) + 1.2 * sym.chestPain + this.fx.hrDelta + auto.hrDelta;
    hr *= auto.hrMult;
    hr *= 1 - 0.2 * this.fx.avBlockDrive;
    return Math.max(25, Math.min(190, hr));
  }

  private applyRhythmToClock(force = false): void {
    const r = this.rhythm.st;
    const sinus = this.hrModel();
    this.sinusHr = sinus;
    let rate = sinus;
    let kind: RhythmKind = "sinus";
    switch (r.base) {
      case "vf":
        kind = "vf";
        break;
      case "asystole":
        kind = "asystole";
        break;
      case "vt":
        kind = "vt";
        rate = r.ventricularRate;
        break;
      case "aivr":
        kind = "paced";
        rate = r.ventricularRate;
        break;
      case "paced":
        kind = "paced";
        break;
      case "svt":
        // a regular narrow-complex rhythm (the clock's regular rhythm; the beat stays a normal QRS)
        kind = "paced";
        rate = r.ventricularRate;
        break;
      case "af":
        kind = "af";
        rate = r.afRate ?? sinus * 1.1;
        break;
      default:
        kind = "sinus";
    }
    if (r.base === "sinus" || r.base === "af") {
      if (r.av === 3) {
        rate = MP_ENGINE.escapeRate;
        if (r.base === "sinus") kind = "paced"; // regular escape rhythm, no sinus arrhythmia
        // adenosine block without an escape rhythm (hazard model): ventricular standstill
        if (this.adnNoEscape) kind = "asystole";
      } else if (r.av === 2) rate = sinus / 2;
      // temporary pacing captures whenever the patient's own ventricular rate is slower
      if (this.pacingRate !== null && (kind === "asystole" || rate < this.pacingRate)) {
        kind = "paced";
        rate = this.pacingRate;
      }
    }
    const prevKind = this.clock.state().rhythm;
    if (force || prevKind !== kind) this.clock.setRhythm(kind);
    this.clock.setHeartRate(rate);
  }

  private computeSupplies(): void {
    const occ = Object.values(this.occlusions);
    const ostial = { left: 1, right: 1 };
    const spasmMap: Record<string, number> = {};
    const last = lastOf(this.beats);
    if (last && (this.tip.location === "ostium" || this.tip.location === "coronary")) {
      const f = Math.max(0, Math.min(1, (last.tip.mean - P_BED) / Math.max(10, last.ao.mean - P_BED)));
      if (this.tip.side === "right") ostial.right = f;
      else ostial.left = f;
    }
    for (const sd of ["left", "right"] as const) {
      const sp = this.resp.st.spasm[sd];
      const tipHere = (this.tip.location === "ostium" || this.tip.location === "coronary") && (this.tip.side ?? "left") === sd;
      if (sp > 0.01 && !tipHere) {
        for (const r of this.flow.regions) if (r.side === sd) spasmMap[r.path[0].vessel] = 1 - 0.8 * sp;
      }
    }
    const rpp0 = this.base.hr * (this.base.sys ?? this.base.map + 25);
    const lastHr = 60 / Math.max(0.25, this.clock.state().rr);
    const rpp = this.rhythm.arrested ? rpp0 : lastHr * (last?.ao.sys ?? this.base.sys ?? this.base.map + 25);
    const m: FlowModifiers = {
      occlusions: occ,
      ostial,
      spasm: spasmMap,
      microvascular: this.microvascular,
      hyperaemia: this.fx.hyperaemia,
      demand: Math.max(0.5, Math.min(3, rpp / rpp0)),
      perfusion: this.rhythm.arrested && !this.rhythm.st.cpr ? 0 : Math.max(0, (this.mapSmooth - P_BED) / (this.base.map - P_BED)),
    };
    this.lastFlowMods = m;
    this.supplies = this.flow.regions.map((r) => supplyFor(r, this.flow, m));
    this.suppliesVer++;
  }

  private slowTick(cs: ClockState): void {
    const dt = SLOW_DT;
    const t = cs.t;
    const p = this.profile;
    this.pharm.step(dt);
    this.fx = this.pharm.effects();
    this.computeSupplies();
    const last = lastOf(this.beats);
    const mapNow = this.rhythm.arrested || this.standstill() ? (this.lastInfo?.P.sa ?? 0) : last?.sa.mean ?? this.base.map;
    this.mapSmooth += (mapNow - this.mapSmooth) * Math.min(1, dt / 3);

    const ev = this.resp.tick({
      t,
      dt,
      supplies: this.supplies,
      fm: this.flow,
      fx: this.fx,
      wall: {
        left: this.tip.side !== "right" && (this.tip.location === "ostium" || this.tip.location === "coronary") ? this.tip.wallContact ?? 0 : 0,
        right: this.tip.side === "right" && (this.tip.location === "ostium" || this.tip.location === "coronary") ? this.tip.wallContact ?? 0 : 0,
      },
      vagalTone: p.vagalTone,
      painSensitivity: p.painSensitivity,
      anxietyBaseline: p.anxiety,
      arrested: this.rhythm.arrested,
      map: this.mapSmooth,
      lvedp: last?.lvedp ?? p.lvedp,
      rng: this.rng,
    });
    if (ev.vf) this.triggerVf(ev.vf);
    if (ev.aivr && !this.rhythm.arrested) {
      this.rhythm.startAivr(t, 70 + this.rng.next() * 30, 10 + this.rng.next() * 25);
      this.emit("rhythm.aivr", { cause: "reperfusion" });
    }
    if (ev.reactionOnset) this.emit("patient.contrast-reaction", { severity: ev.reactionOnset as ReactionKind });

    // adenosine AV block: first-degree with any effect; complete block if drawn
    const drive = this.fx.avBlockDrive;
    const r = this.rhythm.st;
    if (drive > 0.3 && this.adenosineBlockArmed && r.av < 3) {
      this.rhythm.setAv(3, null);
      this.adenosineAv = true;
      this.emit("rhythm.av-block", { degree: 3, cause: "adenosine" });
    } else if (drive > 0.2 && r.av === 0) {
      this.rhythm.setAv(1, null);
      this.adenosineAv = true;
    }
    if (drive < 0.12 && this.adenosineAv) {
      // block without an escape rhythm outlasts the drug's drive by MP_ADENOSINE_HAZARDS.noEscapeHoldS (hazard model only)
      if (this.adnNoEscape && (this.adnNoEscapeUntil === null || t < this.adnNoEscapeUntil)) {
        if (this.adnNoEscapeUntil === null) this.adnNoEscapeUntil = t + MP_ADENOSINE_HAZARDS.noEscapeHoldS;
      } else {
        this.rhythm.setAv(0, null);
        this.adenosineAv = false;
        this.adenosineBlockArmed = false;
        if (this.adnNoEscape) {
          this.adnNoEscape = false;
          this.adnNoEscapeUntil = null;
          this.applyRhythmToClock(true);
        }
      }
    }
    if (this.adnPending || this.adnNoEscape || this.adnVfAt !== null || this.adnAf) this.adenosineHazardTick(t, drive);
    if (this.injModel) this.injectionHazardTick(t, dt);

    this.rhythm.tick(t, dt);
    this.applyRhythmToClock();

    // circulation parameters
    const auto = this.resp.autonomic(this.fx);
    const lvI = this.resp.lvIschaemia(this.flow);
    const lvN = this.resp.lvNecrosis(this.flow);
    const rvI = this.resp.rvIschaemia(this.flow);
    const sym = this.resp.symptoms(this.flow, this.fx, { painSensitivity: p.painSensitivity, anxietyBaseline: p.anxiety, arrested: this.rhythm.arrested, map: this.mapSmooth, lvedp: last?.lvedp ?? p.lvedp });
    const symp = 1 + 0.08 * sym.anxiety + 0.01 * sym.chestPain;
    if (this.radialHost) this.radialHost.step(t, { anxiety: sym.anxiety, vasopressor: this.vasopressorRunning(), sedation: this.fx.sedation });
    const vt = r.base === "vt" ? Math.max(0.35, 1 - (r.ventricularRate - 120) / 200) : 1;
    const pat = this.pat;
    pat.lv.ees = this.base.ees * this.fx.inotropy * Math.max(0.15, 1 - MP_RESP.lvDeficitGain * lvI - 0.5 * lvN) * (1 - r.stunning) * vt * symp;
    pat.rv.ees = this.base.rees * this.fx.inotropy * Math.max(0.2, 1 - MP_RESP.rvDeficitGain * rvI) * (1 - 0.5 * r.stunning);
    const baroSvr = Math.max(-MP_ENGINE.baroSvrMax, Math.min(MP_ENGINE.baroSvrMax, MP_ENGINE.baroSvrGain * (this.base.map - this.mapSmooth)));
    pat.rsys = this.base.rsys * this.fx.svrMult * auto.svrMult * (1 + baroSvr * (1 - this.resp.st.vagal)) * symp;
    const vd = this.vasodilationNow();
    if (vd > 0) pat.rsys *= 1 - vd;
    if (p.lvot?.obstructive) pat.lv.ees *= this.lvotFactor();
    pat.rhythm = r.base === "vf" ? "vf" : "sinus";
    // venous tone: venodilation moves stressed volume into the unstressed pool
    const target = this.fx.venodilationMl + 60 * this.fx.sedation;
    const dv = (target - this.venousShift) * (1 - Math.exp(-dt / 30));
    this.venousShift += dv;
    this.s.vSV = Math.max(20, this.s.vSV - dv);
    for (const f of this.fluidPending) {
      // a negative entry is removed at its rate like a positive one (pci-patient-coupling: Math.min of two
      // negatives took the whole volume in one step)
      const d = f.ml >= 0 ? Math.min(f.ml, f.rate * dt) : Math.max(f.ml, f.rate * dt);
      f.ml -= d;
      this.s.vSV = d >= 0 ? this.s.vSV + d : Math.max(20, this.s.vSV + d);
    }
    this.fluidPending = this.fluidPending.filter((f) => Math.abs(f.ml) > 1e-6);
    if (auto.leakMlS > 0) {
      const d = auto.leakMlS * dt;
      this.s.vSV = Math.max(20, this.s.vSV - d);
      this.lostMl += d;
    }
    if (this.haemorrhageMlS > 0) {
      const d = Math.min(this.haemorrhageMlS * dt, Math.max(0, this.s.vSV - 20));
      this.s.vSV -= d;
      this.bledMl += d;
    }
    if (this.fx.diuresisMlS > 0) {
      const d = Math.min(this.fx.diuresisMlS * dt, Math.max(0, this.s.vSV - 20));
      this.s.vSV -= d;
      this.urineMl += d;
    }

    // SpO2 (monitor averaging); supplemental oxygen relieves part of each desaturation
    const stats: BeatStats | null = last
      ? ({ pcwp: last.lvedp, nativeCO: (last.sv / Math.max(0.3, last.rr)) * 0.06, impellaFlow: 0, ecmoFlow: 0 } as unknown as BeatStats)
      : null;
    const sat = stats ? oxygenation(pat, stats, {}).rightRadialSat * 100 : 97;
    let target2: number;
    if (this.oxygenLpm > 0) {
      const M = MP_FORMULARY_ENGINE;
      const o2 = Math.min(1, (this.fio2() - 0.21) / (M.maxFio2 - 0.21));
      const satO2 = sat + (100 - sat) * M.o2ShuntRelief * o2;
      target2 = Math.min(100, satO2) - (9 * this.fx.respDepression + auto.spo2Drop) * (1 - M.o2HypoventRelief * o2);
    } else target2 = sat - 9 * this.fx.respDepression - auto.spo2Drop;
    this.spo2 += (target2 - this.spo2) * (1 - Math.exp(-dt / MP_ENGINE.spo2Tau));

    // right heart pressures for rightHeart()
    if (this.lastInfo) {
      this.svSmooth += (this.lastInfo.P.sv - this.svSmooth) * Math.min(1, dt / 3);
      this.paSmooth += (this.lastInfo.P.pa - this.paSmooth) * Math.min(1, dt / 3);
    }

    // over-sedation (respiratory depression with hysteresis)
    const rd = this.fx.respDepression;
    if (!this.overSedated && rd >= MP_FORMULARY_ENGINE.overSedationOn) {
      this.overSedated = true;
      this.emit("patient.over-sedation", { respDepression: Math.round(rd * 100) / 100 });
    } else if (this.overSedated && rd < MP_FORMULARY_ENGINE.overSedationOff) {
      this.overSedated = false;
      this.emit("patient.over-sedation-resolved", {});
    }

    // IV adrenaline at arrest doses with a pulse: VT drawn once per exposure
    const pro = this.fx.proarrhythmia;
    if (pro > MP_FORMULARY_ENGINE.adrenalineVtDrive && !this.adrVtDrawn && !this.rhythm.arrested) {
      this.adrVtDrawn = true;
      if (this.rng.chance(MP_FORMULARY_ENGINE.adrenalineVtP)) {
        this.rhythm.startVt(t, MP_ENGINE.vtRate, null);
        this.applyRhythmToClock(true);
        this.emit("rhythm.vt", { cause: "IV adrenaline with a pulse" });
      }
    } else if (pro < 0.1) this.adrVtDrawn = false;
    // amiodarone with a long QT or pre-excited AF: VF once the drug is acting
    if (this.proVfArmed && this.fx.antiarrhythmic > 0.3) {
      this.proVfArmed = false;
      this.triggerVf("torsades or VF after amiodarone");
    }

    this.nibpTick(t);
    this.vitalsCache = null;
    this.alarmTick(t);
  }

  /** Loss of vascular tone now: the profile's and the cause scripts' together. */
  private vasodilationNow(): number {
    const a = this.profile.vasodilation ?? 0;
    const b = this.vasodilationRt;
    return a > 0 || b > 0 ? 1 - (1 - a) * (1 - b) : 0;
  }

  /** LV contractility factor from the dynamic LVOT obstruction (obstructive HCM only), MP_LVOT. */
  private lvotFactor(): number {
    const M = MP_LVOT;
    const hrR = (60 / Math.max(0.25, this.clock.state().rr)) / Math.max(30, this.base.hr);
    const preR = this.s.vSV / Math.max(50, this.base.vSV ?? this.s.vSV);
    const aftR = this.pat.rsys / Math.max(0.05, this.base.rsys);
    const o = Math.min(M.max, M.rest * Math.pow(Math.max(0.2, this.fx.inotropy), M.inotropyExp) * Math.pow(Math.max(0.3, hrR), M.hrExp) * Math.pow(Math.max(0.2, preR), -M.preloadExp) * Math.pow(Math.max(0.2, aftR), -M.afterloadExp));
    return (1 - o) / (1 - M.rest);
  }

  private triggerVf(reason: string): void {
    if (this.rhythm.arrested) return;
    const t = this.clock.state().t;
    this.rhythm.startVf(t);
    this.applyRhythmToClock(true);
    this.emit("rhythm.vf", { cause: reason });
  }

  /** Force a rhythm (scenarios, teaching). */
  forceRhythm(kind: "vf" | "vt" | "asystole" | "aivr" | "sinus" | "chb" | "af" | "svt" | "mobitz2", reason = "scenario", rateBpm?: number): void {
    const t = this.clock.state().t;
    if (kind === "vf") return this.triggerVf(reason);
    if (kind === "vt") this.rhythm.startVt(t, rateBpm ?? MP_ENGINE.vtRate, null);
    // diag-rhythm-haemodynamic-events: AF at a set rate, a sustained SVT, 2:1 block
    if (kind === "af") this.rhythm.startAf(t, rateBpm ?? null);
    if (kind === "svt") this.rhythm.startSvt(t, rateBpm ?? MP_ENGINE.svtRate, null);
    if (kind === "mobitz2") this.rhythm.setAv(2, null);
    if (kind === "aivr") this.rhythm.startAivr(t, 80, 30);
    if (kind === "asystole") {
      this.rhythm.st.base = "asystole";
      this.rhythm.st.arrestOnset = t;
    }
    if (kind === "chb") this.rhythm.setAv(3, null);
    if (kind === "sinus") {
      this.rhythm.st.base = this.rhythm.st.underlying;
      this.rhythm.st.afRate = null;
      this.rhythm.st.arrestOnset = null;
      this.rhythm.setAv(0, null);
      this.adnNoEscape = false;
      this.adnNoEscapeUntil = null;
      this.adnAf = false;
      this.adnAfRevertAt = null;
      this.adnVfAt = null;
    }
    this.applyRhythmToClock(true);
    this.emit("rhythm.forced", { kind, reason });
  }

  private nibpTick(t: number): void {
    const n = this.nibp;
    if (!n.running && n.nextAt !== null && t >= n.nextAt) {
      n.running = true;
      n.startedAt = t;
    }
    if (n.running && t - n.startedAt >= MP_ENGINE.nibpDuration) {
      n.running = false;
      if (n.intervalMin) n.nextAt = t + n.intervalMin * 60;
      const recent = this.beats.slice(-6);
      if (this.rhythm.arrested || !recent.length || lastOf(recent)!.sa.sys - lastOf(recent)!.sa.dia < 8) {
        n.last = null;
        this.emit("nibp.failed", {});
        return;
      }
      const avg = (f: (b: BeatSummary) => number) => recent.reduce((a, b) => a + f(b), 0) / recent.length;
      const e = () => this.rng.normal(0, MP_ENGINE.nibpSd);
      const sys = Math.round(avg((b) => b.sa.sys) + e());
      const dia = Math.round(avg((b) => b.sa.dia) + e());
      n.last = { sys, dia, mean: Math.round(dia + (sys - dia) / 3), at: t };
      this.emit("nibp.result", { ...n.last });
    }
  }

  private alarmTick(t: number): void {
    const v = this.computeVitals();
    this.vitalsCache = v;
    const want: { id: string; level: Alarm["level"]; text: string; delay: number }[] = [];
    const base = this.rhythm.st.base;
    if (base === "vf") want.push({ id: "vf", level: "high", text: "Ventricular fibrillation", delay: 2 });
    if (base === "asystole") want.push({ id: "asys", level: "high", text: "Asystole", delay: 3 });
    if (base === "vt") want.push({ id: "vt", level: "high", text: "Ventricular tachycardia", delay: 2 });
    if (v.hr !== null && base !== "vt") {
      if (v.hr < 45) want.push({ id: "hr-low", level: v.hr < 35 ? "high" : "medium", text: `Heart rate low ${v.hr}`, delay: 5 });
      if (v.hr > 120) want.push({ id: "hr-high", level: "medium", text: `Heart rate high ${v.hr}`, delay: 5 });
    }
    if (v.art && this.tip.location !== "outside" && !this.transducer.st.openToAir && !this.transducer.st.flushing) {
      if (v.art.sys < 90) want.push({ id: "art-low", level: v.art.mean < 55 ? "high" : "medium", text: `Arterial pressure low ${Math.round(v.art.sys)}/${Math.round(v.art.dia)}`, delay: 6 });
      if (v.art.sys > 180) want.push({ id: "art-high", level: "medium", text: `Arterial pressure high ${Math.round(v.art.sys)}`, delay: 6 });
    }
    if (v.spo2 !== null && v.spo2 < 90) want.push({ id: "spo2", level: v.spo2 < 85 ? "high" : "medium", text: `SpO₂ low ${Math.round(v.spo2)}`, delay: 8 });
    if (v.spo2 === null && !this.rhythm.arrested) want.push({ id: "pleth", level: "low", text: "SpO₂: no pulse detected", delay: 8 });
    let worst: Lead | null = null;
    for (const l of LEADS) if (!worst || Math.abs(v.st[l]) > Math.abs(v.st[worst])) worst = l;
    if (worst && Math.abs(v.st[worst]) >= 2 && !this.rhythm.arrested) want.push({ id: "st", level: "low", text: `ST ${worst} ${v.st[worst] > 0 ? "+" : ""}${v.st[worst].toFixed(1)} mm`, delay: 10 });
    if (!this.transducer.st.zeroed && this.tip.location !== "outside") want.push({ id: "zero", level: "low", text: "Arterial line: zero required", delay: 1 });
    const ids = new Set(want.map((w) => w.id));
    for (const id of Object.keys(this.alarmPending)) {
      if (!ids.has(id)) {
        if (this.alarmPending[id].on) this.emit("alarm.off", { id });
        delete this.alarmPending[id];
      }
    }
    const active: Alarm[] = [];
    for (const w of want) {
      const ap = (this.alarmPending[w.id] ??= { since: t, on: false });
      if (t - ap.since >= w.delay) {
        active.push({ id: w.id, level: w.level, text: w.text, since: ap.since });
        if (!ap.on) {
          ap.on = true;
          this.emit("alarm.on", { id: w.id, level: w.level, text: w.text });
        }
      }
    }
    const order = { high: 0, medium: 1, low: 2 };
    active.sort((a, b) => order[a.level] - order[b.level] || a.since - b.since);
    this.activeAlarms = active;
    v.alarms = active;
  }

  private checkRenal(): void {
    const p = this.profile;
    const ml = this.resp.st.contrastTotalMl;
    const fr = ml / Math.max(1, p.renal.macdMl);
    const ratio = ml / Math.max(1, p.renal.crclMlMin);
    const marks: [string, boolean, Record<string, unknown>][] = [
      ["macd-50", fr >= 0.5, { metric: "macd", fraction: 0.5 }],
      ["macd-75", fr >= 0.75, { metric: "macd", fraction: 0.75 }],
      ["macd-100", fr >= 1, { metric: "macd", fraction: 1 }],
      ["ratio-2", ratio >= 2, { metric: "contrast/CrCl", threshold: 2, source: "Gurm 2011" }],
      ["ratio-3", ratio >= 3, { metric: "contrast/CrCl", threshold: 3, source: "Gurm 2011" }],
      ["ratio-3.7", ratio >= 3.7, { metric: "contrast/CrCl", threshold: 3.7, source: "Laskey 2007" }],
    ];
    // the shared contrast ceiling (contrastBudget.ts): warning and announcement points, once each
    const budget = this.contrastBudget();
    for (const f of crossedPoints(budget, this.budgetPrevMl, ml)) {
      if (this.budgetAnnounced.includes(f)) continue;
      this.budgetAnnounced.push(f);
      this.emit("contrast.budget", { fraction: f, warning: f === budget.warnFraction, contrastMl: Math.round(ml), ceilingMl: budget.ceilingMl, rule: budget.stricter.id, source: budget.stricter.source.book });
    }
    this.budgetPrevMl = ml;
    for (const [id, hit, data] of marks) {
      if (hit && !this.renalAnnounced.includes(id)) {
        this.renalAnnounced.push(id);
        this.emit("renal.threshold", {
          ...data,
          contrastMl: Math.round(ml),
          macdMl: p.renal.macdMl,
          crclMlMin: p.renal.crclMlMin,
          denominator: data.metric === "macd" ? "Cigarroa MACD = 5 mL × weight (kg) / creatinine (mg/dL), max 300 mL" : "Cockcroft-Gault creatinine clearance (mL/min), not eGFR",
        });
      }
    }
  }

  private computeVitals(): Vitals {
    const cs = this.clock.state();
    const p = this.profile;
    const recent = this.beats.slice(-4);
    const avg = (f: (b: BeatSummary) => number) => (recent.length ? recent.reduce((a, b) => a + f(b), 0) / recent.length : NaN);
    const arrested = this.rhythm.arrested;
    const vNow = this.lastInfo?.P.sa ?? 0;
    // adenosine block without an escape rhythm: the rate is the time since the last beat, the pressure the one now
    const still = this.standstill();
    const sinceLast = still ? cs.t - (lastOf(this.beats)?.t ?? cs.t) : 0;
    const hr = arrested ? null : recent.length ? Math.round(60 / Math.max(0.2, avg((b) => b.rr), sinceLast)) : p.baseline.hr;
    const art: ArtNumbers | null =
      this.tip.location === "outside" || this.tip.valveOpen
        ? null
        : recent.length && !arrested && !still
          ? { sys: avg((b) => b.reading.sys), dia: avg((b) => b.reading.dia), mean: avg((b) => b.reading.mean) }
          : this.trace.count
            ? { sys: this.trace.art[this.trace.idx(0)], dia: this.trace.art[this.trace.idx(0)], mean: this.trace.art[this.trace.idx(0)] }
            : null;
    const aoTrue: ArtNumbers = recent.length && !arrested && !still ? { sys: avg((b) => b.ao.sys), dia: avg((b) => b.ao.dia), mean: avg((b) => b.ao.mean) } : { sys: vNow, dia: vNow, mean: vNow };
    const lastB = lastOf(this.beats);
    let tipState: TipPressureState = lastB ? classifyTip(this.tip, lastB.tip.sys, lastB.tip.dia, lastB.ao.sys, lastB.ao.dia) : this.tip.location === "outside" ? "none" : "aortic";
    if (this.dampedClassOn && tipState === "aortic" && recent.length && !arrested && !still && !this.transducer.st.flushing && !((this.transducer.st.flushLeftS ?? 0) > 0)) {
      // the class the operator reads: a trace the line shows damped is damped, whatever the tip sees
      const shown = avg((b) => b.reading.sys - b.reading.dia);
      const atTip = avg((b) => b.tip.sys - b.tip.dia);
      if (atTip > 5 && shown < MP_COUPLING.displayedDampedPulseShare * atTip) tipState = "damped";
    }
    const st = stMm(this.cur.st);
    const stemi = stemiCriteria(st, p.sex, p.ageY);
    const pulse = lastB ? lastB.sa.sys - lastB.sa.dia : 0;
    const spo2 = arrested || pulse < 10 ? null : Math.round(Math.max(50, Math.min(100, this.spo2)));
    const sv = lastB?.sv ?? 0;
    const sym = this.resp.symptoms(this.flow, this.fx, { painSensitivity: p.painSensitivity, anxietyBaseline: p.anxiety, arrested, map: this.mapSmooth, lvedp: lastB?.lvedp ?? p.lvedp });
    const ml = this.resp.st.contrastTotalMl;
    const d = this.rhythm.st.defib;
    return {
      t: cs.t,
      hr,
      rhythm: this.rhythm.label(hr ?? 0, this.resp.st.vagal > 0.7 && (hr ?? 60) < 40),
      rhythmKind: this.rhythm.st.base,
      av: this.rhythm.st.av,
      art,
      aortaTrue: aoTrue,
      tipState,
      spo2,
      respRate: p.baseline.respRate + Math.round(6 * sym.dyspnoea) - Math.round(5 * this.fx.respDepression),
      nibp: this.nibp.last,
      nibpRunning: this.nibp.running,
      st,
      stemi: { met: stemi.met, groups: stemi.groups },
      lvedp: lastB?.lvedp ?? p.lvedp,
      strokeVolume: sv,
      cardiacOutput: lastB ? (sv / Math.max(0.25, lastB.rr)) * 0.06 : 0,
      ef: lastB ? (100 * (lastB.edv - lastB.esv)) / Math.max(1, lastB.edv) : p.lvef,
      actTrue: this.pharm.act(p.act.baseline, p.act.sensitivity),
      contrast: { totalMl: ml, macdMl: p.renal.macdMl, fractionOfMacd: ml / Math.max(1, p.renal.macdMl), perCrCl: ml / Math.max(1, p.renal.crclMlMin), crclMlMin: p.renal.crclMlMin },
      ischaemia: this.resp.territories(this.flow),
      // forearm pain of a radial spasm (0..10), only with a radial artery, so other vitals are as before
      symptoms: this.radialHost ? { ...sym, forearmPain: Math.round(Math.min(10, 10 * this.radialHost.pain * p.painSensitivity * (1 - 0.7 * this.fx.analgesia)) * 10) / 10 } : sym,
      alarms: this.activeAlarms,
      alarmsSilencedUntil: this.silencedUntil,
      transducer: { zeroed: this.transducer.st.zeroed, heightCm: this.transducer.st.heightCm, ...this.transducer.dynamic() },
      defib: { charged: d.charged, charging: !!d.charging, cleared: d.cleared, shocks: d.shocks },
      cpr: this.rhythm.st.cpr,
      pericardialMl: this.periMl,
      respiratory: {
        depression: this.fx.respDepression,
        fio2: this.fio2(),
        oxygenLpm: this.oxygenLpm,
        oedema: Math.max(0, Math.min(1, ((lastB?.lvedp ?? p.lvedp) - 22) / 20)),
        overSedated: this.overSedated,
      },
      reaction: this.resp.reactionComponents(this.fx),
      antithrombotic: { antiplatelet: this.fx.antiplatelet, anticoagulant: this.fx.anticoagulant, combined: this.fx.antithrombotic, p2y12: this.fx.p2y12, gpi: this.fx.gpi, aspirin: this.fx.aspirin },
      losses: { bloodMl: this.bledMl, urineMl: this.urineMl },
    };
  }

  private currentTipState(): TipPressureState {
    const b = lastOf(this.beats);
    if (this.tip.location === "outside") return "none";
    return b ? classifyTip(this.tip, b.tip.sys, b.tip.dia, b.ao.sys, b.ao.dia) : "aortic";
  }

  private vesselName(v: VesselId | string): string | null {
    if (this.flow.vessels[v]) return v;
    for (const vf of Object.values(this.flow.vessels)) if (vf.lesionId === v) return vf.name;
    return null;
  }

  private emit(kind: string, data: Record<string, unknown>): void {
    const t = this.clock.state().t;
    this.events.push({ tWall: t, tPatient: t, kind, data });
    if (this.events.length > 500) this.events.shift();
  }

  // -------------------------------------------------------------------------
  // snapshot
  // -------------------------------------------------------------------------

  snapshot(): EngineSnapshot {
    const c = <T>(x: T): T => JSON.parse(JSON.stringify(x));
    return {
      profileSeed: this.profile.seed,
      network: { lesions: c(this.lesions), treeKey: this.treeKey, regions: this.flow.regions.length },
      clock: this.clock.snapshot(),
      circ: { ...this.s },
      pat: c(this.pat),
      base: { ...this.base },
      acc: this.acc,
      stepCount: this.stepCount,
      lastBeat: this.lastBeat,
      venousShift: this.venousShift,
      fluidPending: c(this.fluidPending),
      lostMl: this.lostMl,
      periMl: this.periMl,
      periInflow: this.periInflow,
      tip: { ...this.tip },
      tipP: this.tipChamber.p,
      tipQ: this.tipChamber.qIn,
      transducer: this.transducer.snapshot(),
      pharm: this.pharm.snapshot(),
      resp: this.resp.snapshot(),
      rhythm: this.rhythm.snapshot(),
      rng: this.rng.state,
      em: { prevention: this.vagalPrevention ? { ...this.vagalPrevention } : null, vagalRng: this.vagalRng.state },
      occlusions: c(this.occlusions),
      microvascular: c(this.microvascular),
      beatAcc: { ...this.beatAcc },
      beats: c(this.beats),
      cur: c(this.cur),
      prev: this.prev ? c(this.prev) : null,
      prevRR: this.prevRR,
      atrialT: this.atrialT,
      ectopicNext: this.ectopicNext,
      compensate: this.compensate,
      slowAcc: this.slowAcc,
      spo2: this.spo2,
      plethLp: this.plethLp,
      nibp: c(this.nibp),
      alarmPending: c(this.alarmPending),
      sinusHr: this.sinusHr,
      activeAlarms: c(this.activeAlarms),
      saRing: Array.from(this.saRing),
      silencedUntil: this.silencedUntil,
      renalAnnounced: [...this.renalAnnounced],
      adenosineBlockArmed: this.adenosineBlockArmed,
      adenosineAv: this.adenosineAv,
      events: c(this.events),
      beatEvents: c(this.beatEvents),
      mapSmooth: this.mapSmooth,
      form: {
        oxygenLpm: this.oxygenLpm,
        haemorrhageMlS: this.haemorrhageMlS,
        vasodilation: this.vasodilationRt,
        bledMl: this.bledMl,
        urineMl: this.urineMl,
        adrVtDrawn: this.adrVtDrawn,
        proVfArmed: this.proVfArmed,
        overSedated: this.overSedated,
        svSmooth: this.svSmooth,
        paSmooth: this.paSmooth,
        budgetAnnounced: [...this.budgetAnnounced],
        budgetPrevMl: this.budgetPrevMl,
      },
      adn: {
        model: this.adnModel ? { ...this.adnModel } : null,
        rng: this.adnRng.state,
        pending: this.adnPending,
        pendingUntil: this.adnPendingUntil,
        noEscape: this.adnNoEscape,
        noEscapeUntil: this.adnNoEscapeUntil,
        vfAt: this.adnVfAt,
        af: this.adnAf,
        afRevertAt: this.adnAfRevertAt,
        pacingRate: this.pacingRate,
        coughUntil: this.coughUntil,
      },
      ...(this.radialHost ? { radial: this.radialHost.snapshot() } : {}),
      ...(this.resp.tipSpasm ? { tipSpasm: { ...this.resp.tipSpasm, gain: { ...this.resp.tipSpasm.gain } } } : {}),
      // only when in use, so a snapshot of an engine that never used them is as before
      ...(this.arSeverity > 0 || this.refractoryVf > 0 || this.pulsusOn || this.dampedClassOn
        ? { coupling: { ar: this.arSeverity, refractoryVf: this.refractoryVf, ...(this.pulsusOn ? { pulsus: true } : {}), ...(this.dampedClassOn ? { dampedClass: true } : {}) } }
        : {}),
      ...(this.mrSeverity > 0 || this.atrialOn ? { leftHeart: { mr: this.mrSeverity, atrial: this.atrialOn } } : {}),
      ...(this.injModel ? { inj: { model: { ...this.injModel }, rng: this.injRng.state } } : {}),
    };
  }

  /**
   * Restore a snapshot exactly, including the coronary network it was taken on. When the network
   * changed since (setCoronaryTree after stenting), it is rebuilt from the snapshot's lesions and the
   * tree with the snapshot's fingerprint: one this engine has used, or opts.tree. Throws when that
   * tree is unavailable or the regional arrays do not match the network.
   */
  restore(sn: EngineSnapshot, opts: { tree?: CoronaryTree | null } = {}): void {
    if (sn.profileSeed !== this.profile.seed) throw new Error("snapshot belongs to a different patient");
    const c = <T>(x: T): T => JSON.parse(JSON.stringify(x));
    if (sn.network) {
      const net = sn.network;
      const sameLesions = JSON.stringify(net.lesions) === JSON.stringify(this.lesions);
      if (net.treeKey !== this.treeKey || !sameLesions) {
        let tree: CoronaryTree | null = null;
        if (net.treeKey) {
          const given = opts.tree ?? null;
          tree = given && PatientEngine.treeKey(given) === net.treeKey ? given : this.trees.get(net.treeKey) ?? null;
          if (!tree) throw new Error(`snapshot was taken on coronary tree ${net.treeKey}, which this engine has not seen; pass it as restore(snapshot, { tree })`);
        }
        this.lesions = c(net.lesions);
        this.rememberTree(tree);
        this.flow = this.buildFlow(tree, this.lesions);
      }
      if (this.flow.regions.length !== net.regions) throw new Error(`snapshot network has ${net.regions} regions, rebuilt network has ${this.flow.regions.length}`);
    }
    if (sn.resp.isch.length !== this.flow.regions.length) throw new Error(`snapshot has ${sn.resp.isch.length} myocardial regions, the current network has ${this.flow.regions.length}`);
    this.clock.restore(sn.clock);
    this.s = { ...sn.circ };
    this.pat = c(sn.pat);
    this.base = { ...sn.base };
    this.acc = sn.acc;
    this.stepCount = sn.stepCount;
    this.lastBeat = sn.lastBeat;
    this.venousShift = sn.venousShift;
    this.fluidPending = c(sn.fluidPending);
    this.lostMl = sn.lostMl;
    this.periMl = sn.periMl;
    this.periInflow = sn.periInflow;
    this.tip = { ...sn.tip };
    this.tipChamber.p = sn.tipP;
    this.tipChamber.qIn = sn.tipQ;
    this.transducer.restore(sn.transducer);
    this.pharm.restore(sn.pharm);
    this.resp.restore(sn.resp);
    this.rhythm.restore(sn.rhythm);
    this.rng.state = sn.rng;
    this.occlusions = c(sn.occlusions);
    this.microvascular = c(sn.microvascular);
    this.beatAcc = { ...sn.beatAcc };
    this.beats = c(sn.beats);
    this.cur = c(sn.cur);
    this.prev = sn.prev ? c(sn.prev) : null;
    this.prevRR = sn.prevRR;
    this.atrialT = sn.atrialT;
    this.ectopicNext = sn.ectopicNext;
    this.compensate = sn.compensate;
    this.slowAcc = sn.slowAcc;
    this.spo2 = sn.spo2;
    this.plethLp = sn.plethLp;
    this.nibp = c(sn.nibp);
    this.alarmPending = c(sn.alarmPending);
    this.sinusHr = sn.sinusHr;
    this.activeAlarms = c(sn.activeAlarms);
    this.saRing.set(sn.saRing);
    this.silencedUntil = sn.silencedUntil;
    this.renalAnnounced = [...sn.renalAnnounced];
    this.adenosineBlockArmed = sn.adenosineBlockArmed;
    this.adenosineAv = sn.adenosineAv;
    this.events = c(sn.events);
    this.beatEvents = c(sn.beatEvents);
    this.mapSmooth = sn.mapSmooth;
    const f = sn.form;
    this.oxygenLpm = f?.oxygenLpm ?? 0;
    this.haemorrhageMlS = f?.haemorrhageMlS ?? 0;
    this.vasodilationRt = f?.vasodilation ?? 0;
    this.bledMl = f?.bledMl ?? 0;
    this.urineMl = f?.urineMl ?? 0;
    this.adrVtDrawn = f?.adrVtDrawn ?? false;
    this.proVfArmed = f?.proVfArmed ?? false;
    this.overSedated = f?.overSedated ?? false;
    this.svSmooth = f?.svSmooth ?? this.svSmooth;
    this.paSmooth = f?.paSmooth ?? this.paSmooth;
    this.budgetAnnounced = f ? [...f.budgetAnnounced] : [];
    // an older snapshot has no previous total: take the restored total, so passed points are not announced again
    this.budgetPrevMl = f?.budgetPrevMl ?? this.resp.st.contrastTotalMl;
    this.vagalPrevention = sn.em?.prevention ? { ...sn.em.prevention } : null;
    if (sn.em) this.vagalRng.state = sn.em.vagalRng;
    this.radialHost = sn.radial ? LiveRadialSpasm.restore(sn.radial) : null;
    this.setTipSpasmModel(sn.tipSpasm ?? null);
    const a = sn.adn;
    this.adnModel = a?.model ? { ...a.model } : null;
    if (a) this.adnRng.state = a.rng;
    this.adnPending = a?.pending ?? null;
    this.adnPendingUntil = a?.pendingUntil ?? null;
    this.adnNoEscape = a?.noEscape ?? false;
    this.adnNoEscapeUntil = a?.noEscapeUntil ?? null;
    this.adnVfAt = a?.vfAt ?? null;
    this.adnAf = a?.af ?? false;
    this.adnAfRevertAt = a?.afRevertAt ?? null;
    this.pacingRate = a?.pacingRate ?? null;
    this.coughUntil = a?.coughUntil ?? -1;
    this.arSeverity = sn.coupling?.ar ?? 0;
    this.refractoryVf = sn.coupling?.refractoryVf ?? 0;
    this.pulsusOn = !!sn.coupling?.pulsus;
    this.dampedClassOn = !!sn.coupling?.dampedClass;
    this.setMitralRegurgitation(sn.leftHeart?.mr ?? 0);
    this.setAtrialContraction(!!sn.leftHeart?.atrial);
    this.injModel = sn.inj?.model ? { ...sn.inj.model } : null;
    if (sn.inj) this.injRng.state = sn.inj.rng;
    this.mrBeatMl = 0;
    this.avBeatMl = 0;
    this.flowScaleMemo = null;
    this.fx = this.pharm.effects();
    this.computeSupplies();
    this.trace.clear();
    this.vitalsCache = null;
  }
}

export type { TipInput, TipPressureState, Territory, Lead, BaseRhythm, Symptoms };

/** The infusions that count as an intravenous vasopressor for radial spasm (Brilakis 4.3: 'intravenous vasopressors'). */
const VASOPRESSOR_INFUSIONS: ReadonlySet<InfusionDrug> = new Set<InfusionDrug>(["noradrenaline", "phenylephrine", "adrenaline", "vasopressin", "dopamine"]);

/**
 * The ostial radius (mm) of each side's trunk in a coronary tree (the RCA; the left main, else the LAD
 * at its origin), from the healthy radii; null without a tree or the vessel.
 */
export function ostialRadii(tree: CoronaryTree | null): { left: number | null; right: number | null } {
  if (!tree) return { left: null, right: null };
  const r0 = (name: string) => {
    const v = tree.vessels.find((x) => x.name === name && !x.parent);
    const r = v ? (v.refRadii ?? v.radii)[0] : undefined;
    return r !== undefined && r > 0 ? r : null;
  };
  return { left: r0("LM") ?? r0("LAD"), right: r0("RCA") };
}
