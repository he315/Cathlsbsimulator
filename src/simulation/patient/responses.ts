// ---------------------------------------------------------------------------
// Responses: what the patient's heart and body do with each exposure.
//
// Inputs every slow tick: the coronary supply of each myocardial region (from
// coronaryFlow.ts with balloon occlusions, a wedged catheter, spasm and
// no-reflow applied), contrast delivered into each coronary, procedural pain,
// drugs on board and tip-wall contact. Outputs: regional ischaemia and
// necrosis, the ST injury and T-wave vectors for the 12-lead ECG, the LV and
// RV contractility deficit, vagal and contrast-reaction effects on heart rate
// and vascular tone, chest pain and other symptoms, and hazard draws for
// arrhythmias.
//
// Sourced: contrast reaction incidence (pooled acute adverse reactions 1.03%,
// severe 0.0141%, from Suh et al.'s meta-analysis as reported in the
// Diagnostics 2026 review; 7.17% in the highest-risk group, patients with
// asthma, cardiac insufficiency and especially a previous reaction, which is
// used here for a previous reaction) (facts S9 §contrast). Every time
// constant, gain and hazard below is a MODEL PARAMETER (MP_*).
//
// A reaction has three components (reactionComponents): skin (itch,
// flushing), airway (wheeze, dyspnoea, desaturation) and circulation
// (vasodilation, capillary leak, tachycardia). Adrenaline treats all three;
// nebulised salbutamol relieves the airway component only (Oxford, lesson
// pm-lab-drugs-contrast-reactions). Without a bronchodilator the three are
// equal to the reaction level, as before.
//
// The procedure lab's emergencies (proc-anaphylaxis-vagal) add, all off by
// default so the other labs behave as before (setCourse):
//   - a forced reaction (forceReaction) for a scenario's at-risk patient: the
//     random draw is then skipped, so it never changes a random case's
//     incidence; with `preArrest` the circulation component brings a late
//     bradycardia (bradycardia in anaphylaxis is usually a late sign, often
//     just before cardiac arrest: RCUK 2021 in pm-lab-drugs-contrast-reactions,
//     the 'Contrast reaction or vasovagal reaction?' table), which atropine
//     only partly lifts;
//   - escalation: contrast given once a reaction has begun raises its peak
//     (lab request pm-lab-drugs#11, 'more contrast worsens the reaction');
//   - a vagal vasodilator lag: the vascular component of a vagal episode
//     follows the slowing ('Slows, usually before the pressure falls', the
//     same table; cm-patient-complications-vasovagal);
//   - forceVagal for scripted vagal episodes, and vagalChallenge, a vagal
//     trigger without the procedural pain term (sheath removal).
// Every gain and time constant of these is a MODEL PARAMETER (MP_EMERGENCY).
// ---------------------------------------------------------------------------

import type { CoronaryFlowMap, RegionSupply } from "./coronaryFlow";
import type { DrugEffects } from "./pharmacology";
import type { SeededRng } from "./rng";
import type { Vec3f } from "../ecg12";

export const CONTRAST_REACTION = {
  anyAcute: 0.0103,
  severe: 0.000141,
  withPreviousReaction: 0.0717,
} as const;

export const MP_RESP = {
  /** ischaemia onset and recovery time constants, s */
  ischOnTauS: 20,
  ischOffTauS: 45,
  /** necrosis accrues once ischaemia exceeds 0.8, time constant, s */
  necroTauS: 1500,
  /** ST injury gain, mV per unit of (LV mass fraction × ischaemia) */
  stGain: 1.0,
  /** hyperacute T gain and how long it lasts after onset, s */
  tHyperGain: 0.6,
  tHyperS: 150,
  /** reperfusion T inversion gain per unit necrosis */
  tInvertGain: 0.45,
  /** contractility deficit per unit ischaemic LV mass */
  lvDeficitGain: 0.75,
  rvDeficitGain: 0.6,
  /** contrast washout from the myocardium, s */
  contrastTauS: 6,
  /** heart-rate slowing per mL of contrast in the right / left coronary (fraction of HR, saturating) */
  contrastBradyRight: 0.07,
  contrastBradyLeft: 0.025,
  /** VF hazard per mL injected with the tip in the conus, ventricularised in the RCA, or wedged */
  vfPerMlConus: 0.03,
  vfPerMlRightDamped: 0.01,
  vfPerMlWedged: 0.004,
  /** VF hazard per mL in a normal selective injection */
  vfPerMlNormal: 0.0002,
  /** ischaemic VF hazard per second at a squared ischaemic LV mass of 1 */
  ischVfPerS: 0.0006,
  /** chance that reperfusion of a large territory gives accelerated idioventricular rhythm */
  reperfusionAivr: 0.35,
  /** vagal episode: probability gain per trigger, effect on HR and SVR, durations */
  vagalTriggerGain: 0.5,
  vagalHrDrop: 0.45,
  vagalSvrDrop: 0.4,
  vagalOnsetTauS: 8,
  vagalHoldS: 120,
  vagalOffTauS: 60,
  /** catheter-tip spasm: rise and fall, and the gain from wall contact */
  spasmTauS: 25,
  spasmGain: 0.7,
  /** contrast reaction onset after first exposure, s; share of non-severe that are moderate */
  reactionOnsetS: [60, 300] as [number, number],
  moderateShare: 0.12,
  /** fraction of the airway component a full bronchodilator effect relieves */
  bronchodilatorAirwayRelief: 0.7,
  /** fraction of the ischaemic VF hazard a full antiarrhythmic effect removes */
  antiarrhythmicVfRelief: 0.5,
};

/** MODEL PARAMETERS of the emergency course (proc-anaphylaxis-vagal); none is a sourced value. */
export const MP_EMERGENCY = {
  /** reaction peak added per mL of contrast given after the reaction has begun, and its ceiling */
  escalationPerMl: 0.02,
  escalationMax: 0.6,
  /** pre-arrest bradycardia: reaction level at which it begins and the level of its full effect */
  preArrestFrom: 0.4,
  preArrestFull: 0.8,
  /** heart-rate fraction lost at the full effect, and the share of it atropine (full vagolysis) lifts */
  preArrestHrDrop: 0.65,
  preArrestAtropineShare: 0.4,
  /** a forced vagal episode: target level and hold, s (the episode then wears off as a drawn one does) */
  forcedVagalLevel: 0.95,
  forcedVagalHoldS: 240,
};

/** The emergency course options and their state (proc-anaphylaxis-vagal); absent means off. */
export interface ReactionCourse {
  /** contrast during a reaction raises its peak */
  escalation: boolean;
  /** the vagal vasodilation follows the vagal level with this time constant, s (0: at once) */
  vagalSvrLagS: number;
  /** the forced reaction is the late, pre-arrest presentation (bradycardia with skin and airway signs) */
  preArrest: boolean;
  /** peak added by contrast during the reaction */
  boost: number;
  /** the vagal level the vascular tone follows (with vagalSvrLagS) */
  vagalSvr: number;
}

/** The three components of a contrast reaction, 0..1 each. */
export interface ReactionComponents {
  skin: number;
  airway: number;
  circulation: number;
}

export type ReactionKind = "none" | "mild" | "moderate" | "severe";

export interface ResponsesState {
  isch: number[];
  necro: number[];
  deficit: number[];
  /**
   * smoothed supply-failure deficit per region (RegionSupply.restDeficit): what transmurality is
   * judged on, so demand ischaemia with intact resting supply stays subendocardial. Optional so
   * snapshots taken before it existed still restore (treated as equal to deficit).
   */
  supplyDeficit?: number[];
  /** seconds since ischaemia began in a region (−1 when not ischaemic) */
  onsetAge: number[];
  peakIsch: number[];
  contrast: { left: number; right: number };
  vagal: number;
  vagalTarget: number;
  vagalHold: number;
  procPain: number;
  spasm: { left: number; right: number };
  reaction: { kind: ReactionKind; drawn: boolean; onsetAt: number | null; level: number };
  /** cumulative contrast that reached the circulation, mL */
  contrastTotalMl: number;
  /** the emergency course (proc-anaphylaxis-vagal); absent in the other labs and in older snapshots */
  course?: ReactionCourse;
}

export interface Symptoms {
  /** 0..10 */
  chestPain: number;
  nausea: number;
  dyspnoea: number;
  flushing: number;
  itch: number;
  anxiety: number;
  drowsy: number;
  /** conscious level: 1 alert … 0 unresponsive */
  conscious: number;
  /** forearm pain of a radial spasm, 0..10 (diag-spasm-states; only with a radial artery in the procedure) */
  forearmPain?: number;
}

export interface ResponseInputs {
  t: number;
  dt: number;
  supplies: RegionSupply[];
  fm: CoronaryFlowMap;
  fx: DrugEffects;
  /** tip-wall contact on each side (0..1) */
  wall: { left: number; right: number };
  vagalTone: number;
  painSensitivity: number;
  anxietyBaseline: number;
  /** arrest or profound hypotension for consciousness */
  arrested: boolean;
  map: number;
  lvedp: number;
  rng: SeededRng;
}

export interface ResponseEvents {
  vf?: string;
  aivr?: boolean;
  vagalOnset?: boolean;
  reactionOnset?: ReactionKind;
}

/**
 * The catheter-tip spasm model of the diagnostic lab (diag-spasm-states), set by its session module
 * (Responses.tipSpasm, PatientEngine.setTipSpasmModel). Off by default: every other lab keeps the
 * legacy dynamics above (MP_RESP.spasmGain and spasmTauS, relaxing with spasmTauS once the contact
 * ends). With the model on, the wall contact provokes a spasm whose gain is larger in a small artery
 * (gain per side), and once provoked the spasm holds after the catheter is withdrawn, relaxing slowly
 * (holdTauS) unless intracoronary nitrate relieves it (nitrateTauS at a full epicardial dilation):
 * the module text's sequence of withdrawal, nitrate and a 1-2 minute wait (pm-interpreting-spasm).
 * Every value is a MODEL PARAMETER.
 */
export interface TipSpasmModel {
  /** gain from wall contact per side (MP_RESP.spasmGain times the vessel's susceptibility) */
  gain: { left: number; right: number };
  /** rise time constant while the contact provokes it, s */
  riseTauS: number;
  /** fall time constant once the contact ends, without nitrate, s */
  holdTauS: number;
  /** fall time constant once the nitrate's relief is full (MP_TIP_SPASM.fullReliefAt), s */
  nitrateTauS: number;
}

/** MODEL PARAMETERS of TipSpasmModel and its susceptibility. */
export const MP_TIP_SPASM = {
  riseTauS: 25,
  holdTauS: 300,
  nitrateTauS: 20,
  /** the epicardial dilation (pharmacology DrugEffects) at which the nitrate's relief is full: about that of 100 µg intracoronary in its first minutes */
  fullReliefAt: 0.5,
  /** the ostial radius (mm) of an average right coronary in the generator (about 1.9-2.0 mm, a dominant RCA); a smaller vessel is more susceptible */
  refRadiusMm: 1.9,
  /** susceptibility (gain multiplier) as (refRadiusMm / ostial radius)^2, between 1 and this */
  maxScale: 2.2,
  /** the contact share below which no spasm is provoked (the legacy model's 0.2) */
  contactFree: 0.2,
  /** the ceiling of a provoked spasm (the legacy model's 0.9) */
  max: 0.9,
};

/** The susceptibility of a side from its ostial radius (mm): (refRadiusMm / r)^2, clamped to 1 … maxScale. */
export function tipSpasmSusceptibility(ostialRadiusMm: number | null | undefined): number {
  if (!(ostialRadiusMm !== null && ostialRadiusMm !== undefined && ostialRadiusMm > 0)) return 1;
  return Math.max(1, Math.min(MP_TIP_SPASM.maxScale, (MP_TIP_SPASM.refRadiusMm / ostialRadiusMm) ** 2));
}

/** The diagnostic lab's model for a patient with these ostial radii (mm, null when unknown). */
export function tipSpasmModelFor(ostialRadiusMm: { left: number | null; right: number | null }): TipSpasmModel {
  return {
    gain: { left: MP_RESP.spasmGain * tipSpasmSusceptibility(ostialRadiusMm.left), right: MP_RESP.spasmGain * tipSpasmSusceptibility(ostialRadiusMm.right) },
    riseTauS: MP_TIP_SPASM.riseTauS,
    holdTauS: MP_TIP_SPASM.holdTauS,
    nitrateTauS: MP_TIP_SPASM.nitrateTauS,
  };
}

/**
 * The diagnostic lab's injection hazard model (diag-rhythm-haemodynamic-events): VF comes from what
 * the injection did, not from a fixed rule. The module text names the triggers: a conus injection, a
 * damped or plugged vessel and contrast that could not clear (tip diag-vf-catheter-cause and
 * diag-vf-shock-then-amiodarone, Brilakis 6.5 and 15.1, Oxford ch 10; lesson cm-patient-complications-
 * arrhythmia, 'VF after an injection'). A selective injection with a free trace carries none of them,
 * so in this model it carries no injection hazard (ischaemic VF is the engine's separate hazard).
 * Sustained VT from catheter contact with the LV wall, its reversion with an antiarrhythmic on board,
 * SVT terminated by AV nodal block and AF reverting are part of the same model. Off by default
 * (PatientEngine.setInjectionHazards): every other lab keeps the legacy draw in Responses.contrast.
 * Every value is a MODEL PARAMETER (docs/realism/facts/pkg-diag-rhythm-haemodynamic-events.md).
 */
export interface InjectionHazardModel {
  /** VF hazard per mL into the conus branch (the legacy model's MP_RESP.vfPerMlConus) */
  conusPerMl: number;
  /** ... per mL through a damped or ventricularised trace, either coronary */
  dampedPerMl: number;
  /** ... per mL with a wedged catheter (the legacy MP_RESP.vfPerMlWedged) */
  wedgedPerMl: number;
  /** ... per mL with a free trace (0: no trigger) */
  freePerMl: number;
  /** small-branch plugging: added per mL at a fully plugged ostium (gap 0), falling to none at plugGapFree */
  pluggingPerMl: number;
  /** the gap around the tip (TipInput.gap) at and above which nothing is plugged */
  plugGapFree: number;
  /** contrast dwell: VF hazard per mL of contrast held in the artery, per second it is held */
  dwellPerMlS: number;
  /** sustained VT per second of catheter contact with the LV wall, and the gain with a long QT */
  lvContactVtPerS: number;
  longQtVtGain: number;
  /** the VT rate, bpm */
  vtRateBpm: number;
  /** a sustained VT reverts with this chance per second once the antiarrhythmic effect is above antiarrhythmicOn */
  vtRevertPerS: number;
  antiarrhythmicOn: number;
  /** AF started in the case reverts with this chance per second once the antiarrhythmic effect is above antiarrhythmicOn */
  afRevertPerS: number;
  /** an SVT terminates when AV nodal block (adenosine, DrugEffects.avBlockDrive) exceeds this */
  svtBlockOn: number;
}

export const MP_INJECTION_HAZARD: Readonly<InjectionHazardModel> = {
  conusPerMl: MP_RESP.vfPerMlConus,
  dampedPerMl: MP_RESP.vfPerMlRightDamped,
  wedgedPerMl: MP_RESP.vfPerMlWedged,
  freePerMl: 0,
  pluggingPerMl: 0.01,
  plugGapFree: 0.2,
  dwellPerMlS: 0.0008,
  lvContactVtPerS: 0.004,
  longQtVtGain: 3,
  vtRateBpm: 165,
  vtRevertPerS: 0.02,
  antiarrhythmicOn: 0.3,
  afRevertPerS: 0.01,
  svtBlockOn: 0.3,
};

/** What an injection did, for the hazard model: the trace at the tip, the conus, the gap around the tip. */
export interface InjectionHazardInput {
  tipState: string;
  conus: boolean;
  /** TipInput.gap at the push (absent: unknown, no plugging term) */
  gap?: number;
  /** the tip was in the ostium or a coronary (a root puff or an LV injection carries no coronary hazard) */
  coronary: boolean;
}

/** The VF hazard per mL of one push under the model, and the reason the debrief gives (pure). */
export function injectionVfPerMl(m: InjectionHazardModel, h: InjectionHazardInput): { perMl: number; reason: string } {
  if (!h.coronary) return { perMl: 0, reason: "contrast into the aortic root" };
  if (h.conus) return { perMl: m.conusPerMl, reason: "injection into the conus branch" };
  let perMl = m.freePerMl;
  let reason = "selective injection with a free trace";
  if (h.tipState === "wedged") {
    perMl = m.wedgedPerMl;
    reason = "injection with a wedged catheter";
  } else if (h.tipState === "damped" || h.tipState === "ventricularised") {
    perMl = m.dampedPerMl;
    reason = `injection through a ${h.tipState} trace`;
  }
  if (h.gap !== undefined && Number.isFinite(h.gap) && h.gap < m.plugGapFree && m.plugGapFree > 0) {
    const plug = 1 - Math.max(0, h.gap) / m.plugGapFree;
    perMl += m.pluggingPerMl * plug;
    if (plug > 0.5 && perMl > 0) reason += ", the catheter plugging the vessel";
  }
  return { perMl, reason };
}

/** The probability that a push of `ml` under the model brings VF (pure). */
export function injectionVfProbability(m: InjectionHazardModel, ml: number, h: InjectionHazardInput): number {
  const { perMl } = injectionVfPerMl(m, h);
  return perMl > 0 && ml > 0 ? 1 - Math.pow(1 - Math.min(1, perMl), ml) : 0;
}

/** The probability of VF while `ml` of contrast is held in the artery for dtS seconds (pure). */
export function dwellVfProbability(m: InjectionHazardModel, ml: number, dtS: number): number {
  return ml > 0 && dtS > 0 ? 1 - Math.exp(-m.dwellPerMlS * ml * dtS) : 0;
}

export class Responses {
  st: ResponsesState;
  /** the diagnostic lab's catheter-tip spasm model (diag-spasm-states); null: the legacy dynamics */
  tipSpasm: TipSpasmModel | null = null;
  constructor(nRegions: number) {
    this.st = {
      isch: new Array(nRegions).fill(0),
      necro: new Array(nRegions).fill(0),
      deficit: new Array(nRegions).fill(0),
      supplyDeficit: new Array(nRegions).fill(0),
      onsetAge: new Array(nRegions).fill(-1),
      peakIsch: new Array(nRegions).fill(0),
      contrast: { left: 0, right: 0 },
      vagal: 0,
      vagalTarget: 0,
      vagalHold: 0,
      procPain: 0,
      spasm: { left: 0, right: 0 },
      reaction: { kind: "none", drawn: false, onsetAt: null, level: 0 },
      contrastTotalMl: 0,
    };
  }

  /** Resize after the flow map changes (new tree): ischaemia carries over by nothing; regions differ. */
  resize(n: number) {
    const s = this.st;
    s.isch = new Array(n).fill(0);
    s.necro = new Array(n).fill(0);
    s.deficit = new Array(n).fill(0);
    s.supplyDeficit = new Array(n).fill(0);
    s.onsetAge = new Array(n).fill(-1);
    s.peakIsch = new Array(n).fill(0);
  }

  /** Number of regions the state arrays describe. */
  get regionCount(): number {
    return this.st.isch.length;
  }

  /** Pre-load ischaemia (an acute coronary syndrome that is already under way on arrival). */
  preload(region: number, isch: number, onsetAgeS: number, necro = 0, supplyDeficit?: number) {
    this.st.isch[region] = isch;
    if (supplyDeficit !== undefined) {
      this.st.deficit[region] = supplyDeficit;
      (this.st.supplyDeficit ??= new Array(this.st.isch.length).fill(0))[region] = supplyDeficit;
    }
    this.st.onsetAge[region] = onsetAgeS;
    this.st.peakIsch[region] = isch;
    this.st.necro[region] = necro;
  }

  /**
   * Contrast delivered into a coronary (or the root). Returns a VF trigger reason when the hazard
   * draw fires. tipState is the current tip pressure class. `skipVf` (diag-rhythm-haemodynamic-events):
   * the caller judges the injection's VF hazard itself (PatientEngine.injectionHazard, the diagnostic
   * lab's technique model), so no VF draw is made here and the generator is not consumed for one;
   * absent, the legacy hazard below, as before.
   */
  contrast(side: "left" | "right" | "root", ml: number, tipState: string, conus: boolean, rng: SeededRng, t: number, previousReaction: "none" | "previous-mild" | "previous-severe", skipVf = false): ResponseEvents {
    const s = this.st;
    const ev: ResponseEvents = {};
    if (ml <= 0) return ev;
    s.contrastTotalMl += ml;
    if (side !== "root") s.contrast[side] += ml;
    // more contrast during a reaction that has begun worsens it (the emergency course only)
    const c = s.course;
    if (c?.escalation && s.reaction.kind !== "none" && s.reaction.onsetAt !== null && t >= s.reaction.onsetAt) c.boost = Math.min(MP_EMERGENCY.escalationMax, c.boost + MP_EMERGENCY.escalationPerMl * ml);
    if (!s.reaction.drawn) {
      s.reaction.drawn = true;
      const pAny = previousReaction === "none" ? CONTRAST_REACTION.anyAcute : CONTRAST_REACTION.withPreviousReaction;
      const pSevere = CONTRAST_REACTION.severe * (pAny / CONTRAST_REACTION.anyAcute);
      const r = rng.next();
      if (r < pSevere) s.reaction.kind = "severe";
      else if (r < pAny) s.reaction.kind = rng.chance(MP_RESP.moderateShare) ? "moderate" : "mild";
      if (s.reaction.kind !== "none") s.reaction.onsetAt = t + rng.range(MP_RESP.reactionOnsetS[0], MP_RESP.reactionOnsetS[1]);
    }
    let perMl = MP_RESP.vfPerMlNormal;
    let reason = "contrast injection";
    if (conus) {
      perMl = MP_RESP.vfPerMlConus;
      reason = "injection into the conus branch";
    } else if (side === "right" && (tipState === "ventricularised" || tipState === "damped")) {
      perMl = MP_RESP.vfPerMlRightDamped;
      reason = "injection with a damped (ventricularised) RCA pressure";
    } else if (tipState === "wedged") {
      perMl = MP_RESP.vfPerMlWedged;
      reason = "injection with a wedged catheter";
    }
    if (side === "root" || skipVf) perMl = 0;
    if (perMl > 0 && rng.chance(1 - Math.pow(1 - perMl, ml))) ev.vf = reason;
    return ev;
  }

  /** A painful or vagal stimulus (puncture, sheath, radial spasm, balloon); magnitude 0..1. */
  pain(magnitude: number, vagalTone: number, sedation: number, rng: SeededRng): ResponseEvents {
    const s = this.st;
    s.procPain = Math.min(10, s.procPain + 10 * magnitude);
    const p = Math.min(0.9, MP_RESP.vagalTriggerGain * vagalTone * magnitude * (1 - 0.4 * sedation));
    if (s.vagalTarget < 0.2 && rng.chance(p)) {
      s.vagalTarget = 0.6 + 0.4 * rng.next();
      s.vagalHold = MP_RESP.vagalHoldS * (0.5 + rng.next());
      return { vagalOnset: true };
    }
    return {};
  }

  /**
   * A vagal trigger without procedural pain (sheath removal under compression): the same draw as
   * pain() with the magnitude given, from the caller's generator.
   */
  vagalChallenge(magnitude: number, vagalTone: number, sedation: number, rng: SeededRng): ResponseEvents {
    const s = this.st;
    const p = Math.min(0.9, MP_RESP.vagalTriggerGain * vagalTone * magnitude * (1 - 0.4 * sedation));
    if (s.vagalTarget < 0.2 && rng.chance(p)) {
      s.vagalTarget = 0.6 + 0.4 * rng.next();
      s.vagalHold = MP_RESP.vagalHoldS * (0.5 + rng.next());
      return { vagalOnset: true };
    }
    return {};
  }

  /** A scripted vagal episode at `level` (0..1) held for `holdS`, then wearing off as a drawn one does. */
  forceVagal(level = MP_EMERGENCY.forcedVagalLevel, holdS = MP_EMERGENCY.forcedVagalHoldS): void {
    this.st.vagalTarget = Math.max(0, Math.min(1, level));
    this.st.vagalHold = Math.max(0, holdS);
  }

  /**
   * A scenario's reaction: `kind` beginning at session time `onsetAt` (s, patient clock). The random
   * draw at the first contrast is skipped (drawn), so it is never made on top of this one.
   */
  forceReaction(kind: Exclude<ReactionKind, "none">, onsetAt: number, opts: { preArrest?: boolean } = {}): void {
    this.st.reaction = { kind, drawn: true, onsetAt, level: 0 };
    if (opts.preArrest) this.setCourse({ preArrest: true });
  }

  /** Turn the emergency course on (or change its options); null turns it off. */
  setCourse(o: Partial<Pick<ReactionCourse, "escalation" | "vagalSvrLagS" | "preArrest">> | null): void {
    if (o === null) {
      delete this.st.course;
      return;
    }
    const c = this.st.course ?? { escalation: false, vagalSvrLagS: 0, preArrest: false, boost: 0, vagalSvr: this.st.vagal };
    if (o.escalation !== undefined) c.escalation = o.escalation;
    if (o.vagalSvrLagS !== undefined) c.vagalSvrLagS = Math.max(0, o.vagalSvrLagS);
    if (o.preArrest !== undefined) c.preArrest = o.preArrest;
    this.st.course = c;
  }

  tick(i: ResponseInputs): ResponseEvents {
    const s = this.st;
    const ev: ResponseEvents = {};
    const { dt, fm } = i;
    const lvTotal = fm.regions.reduce((a, r) => a + (r.rv ? 0 : r.demand), 0) || 1;
    let wasLarge = 0;
    let nowSmall = 0;
    for (let k = 0; k < fm.regions.length; k++) {
      const r = fm.regions[k];
      const d = i.supplies[k]?.deficit ?? 0;
      s.deficit[k] += (d - s.deficit[k]) * Math.min(1, dt / 3);
      const sd = s.supplyDeficit ?? (s.supplyDeficit = s.deficit.slice());
      sd[k] += ((i.supplies[k]?.restDeficit ?? d) - sd[k]) * Math.min(1, dt / 3);
      const I = s.isch[k];
      const before = I;
      if (d > 0.02) {
        s.isch[k] = I + (d - I) * (1 - Math.exp(-dt / MP_RESP.ischOnTauS)) * (d > I ? 1 : 0.3);
        if (s.onsetAge[k] < 0) s.onsetAge[k] = 0;
      } else {
        s.isch[k] = I * Math.exp(-dt / (MP_RESP.ischOffTauS * (1 + s.necro[k] * 3)));
      }
      if (s.onsetAge[k] >= 0) s.onsetAge[k] += dt;
      if (s.isch[k] < 0.02 && d <= 0.02) s.onsetAge[k] = -1;
      s.peakIsch[k] = Math.max(s.peakIsch[k] * Math.exp(-dt / 600), s.isch[k]);
      if (s.isch[k] > 0.8) s.necro[k] = Math.min(1, s.necro[k] + ((s.isch[k] - 0.8) / 0.2) * (dt / MP_RESP.necroTauS));
      if (!r.rv) {
        if (before > 0.5) wasLarge += r.demand / lvTotal;
        if (before > 0.5 && d < 0.15) nowSmall += r.demand / lvTotal;
      }
    }
    // reperfusion of a large territory → accelerated idioventricular rhythm (sometimes)
    if (nowSmall > 0.12 && wasLarge > 0.12 && i.rng.chance(MP_RESP.reperfusionAivr * Math.min(1, dt / 2))) ev.aivr = true;

    // ischaemic VF hazard
    const lvIsch = this.lvIschaemia(fm);
    const aa = i.fx.antiarrhythmic ?? 0;
    const vfK = aa > 0 ? 1 - MP_RESP.antiarrhythmicVfRelief * aa : 1;
    if (i.rng.chance(1 - Math.exp(-MP_RESP.ischVfPerS * lvIsch * lvIsch * dt * vfK))) ev.vf = "ischaemia";

    // contrast washout
    s.contrast.left *= Math.exp(-dt / MP_RESP.contrastTauS);
    s.contrast.right *= Math.exp(-dt / MP_RESP.contrastTauS);

    // vagal episode dynamics
    if (s.vagalTarget > 0) {
      if (s.vagalHold > 0) s.vagalHold -= dt;
      else s.vagalTarget *= Math.exp(-dt / MP_RESP.vagalOffTauS);
      if (s.vagalTarget < 0.02) s.vagalTarget = 0;
    }
    s.vagal += (s.vagalTarget - s.vagal) * (1 - Math.exp(-dt / MP_RESP.vagalOnsetTauS));
    const course = s.course;
    if (course) course.vagalSvr = course.vagalSvrLagS > 0 ? course.vagalSvr + (s.vagal - course.vagalSvr) * (1 - Math.exp(-dt / course.vagalSvrLagS)) : s.vagal;
    s.procPain *= Math.exp(-dt / 20);

    // catheter-tip spasm, reversed by nitrate
    for (const side of ["left", "right"] as const) {
      const m = this.tipSpasm;
      if (!m) {
        const target = Math.min(0.9, MP_RESP.spasmGain * Math.max(0, i.wall[side] - 0.2)) * (1 - i.fx.epicardialDilation);
        s.spasm[side] += (target - s.spasm[side]) * (1 - Math.exp(-dt / (target < s.spasm[side] && i.fx.epicardialDilation > 0.3 ? 8 : MP_RESP.spasmTauS)));
        continue;
      }
      // diag-spasm-states: provoked by the contact, held once provoked, relieved by nitrate
      const D = Math.max(0, Math.min(1, i.fx.epicardialDilation));
      const target = Math.min(MP_TIP_SPASM.max, m.gain[side] * Math.max(0, i.wall[side] - MP_TIP_SPASM.contactFree)) * (1 - D);
      const relief = Math.min(1, D / MP_TIP_SPASM.fullReliefAt);
      const tau = target >= s.spasm[side] ? m.riseTauS : m.holdTauS + (m.nitrateTauS - m.holdTauS) * relief;
      s.spasm[side] += (target - s.spasm[side]) * (1 - Math.exp(-dt / Math.max(1e-3, tau)));
    }

    // contrast reaction
    const rx = s.reaction;
    if (rx.kind !== "none" && rx.onsetAt !== null && i.t >= rx.onsetAt) {
      if (rx.level === 0) ev.reactionOnset = rx.kind;
      const peak = Math.min(1, (rx.kind === "severe" ? 1 : rx.kind === "moderate" ? 0.5 : 0.2) + (s.course?.boost ?? 0));
      const rescue = rx.kind === "mild" ? Math.max(i.fx.antiAllergic, i.fx.adrenergic) : i.fx.adrenergic + 0.3 * i.fx.antiAllergic;
      const target = peak * (1 - Math.min(1, rescue));
      rx.level += (target - rx.level) * (1 - Math.exp(-dt / (target > rx.level ? 45 : 90)));
      rx.level = Math.max(rx.level, 1e-4);
    }
    return ev;
  }

  /** Mass-weighted LV ischaemia (0..1). */
  lvIschaemia(fm: CoronaryFlowMap): number {
    let a = 0,
      tot = 0;
    fm.regions.forEach((r, k) => {
      if (r.rv) return;
      a += r.demand * this.st.isch[k];
      tot += r.demand;
    });
    return tot > 0 ? a / tot : 0;
  }

  rvIschaemia(fm: CoronaryFlowMap): number {
    let a = 0,
      tot = 0;
    fm.regions.forEach((r, k) => {
      if (!r.rv) return;
      a += r.demand * this.st.isch[k];
      tot += r.demand;
    });
    return tot > 0 ? a / tot : 0;
  }

  lvNecrosis(fm: CoronaryFlowMap): number {
    let a = 0,
      tot = 0;
    fm.regions.forEach((r, k) => {
      if (r.rv) return;
      a += r.demand * this.st.necro[k];
      tot += r.demand;
    });
    return tot > 0 ? a / tot : 0;
  }

  /** Ischaemia per territory (LV mass-weighted within each territory). */
  territories(fm: CoronaryFlowMap): Record<"LAD" | "LCx" | "RCA", number> {
    const a = { LAD: 0, LCx: 0, RCA: 0 };
    const t = { LAD: 0, LCx: 0, RCA: 0 };
    fm.regions.forEach((r, k) => {
      a[r.territory] += r.demand * this.st.isch[k];
      t[r.territory] += r.demand;
    });
    return { LAD: t.LAD ? a.LAD / t.LAD : 0, LCx: t.LCx ? a.LCx / t.LCx : 0, RCA: t.RCA ? a.RCA / t.RCA : 0 };
  }

  /**
   * ST injury and T-wave vectors (mV, Frank). Transmural ischaemia (a large supply failure: the
   * deficit that remains at resting demand) points the ST vector towards the region (ST elevation
   * in the leads facing it); subendocardial ischaemia (partial supply failure, or demand ischaemia
   * with intact resting supply) points it away (ST depression). The RV counts at half weight.
   */
  vectors(fm: CoronaryFlowMap): { st: Vec3f; t: Vec3f } {
    const s = this.st;
    const total = fm.regions.reduce((a, r) => a + r.demand * (r.rv ? 0.5 : 1), 0) || 1;
    const st: Vec3f = [0, 0, 0];
    const tv: Vec3f = [0, 0, 0];
    fm.regions.forEach((r, k) => {
      const w = (r.demand * (r.rv ? 0.5 : 1)) / total;
      const I = s.isch[k];
      const N = s.necro[k];
      if (I < 1e-3 && N < 1e-3) return;
      const x = ((s.supplyDeficit ? s.supplyDeficit[k] : s.deficit[k]) - 0.45) / 0.35;
      const trans = x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
      // persistent injury after necrosis keeps some elevation (MODEL)
      const inj = I * (trans - 0.5 * (1 - trans)) + 0.35 * N;
      const hyper = s.onsetAge[k] >= 0 ? I * trans * Math.max(0, 1 - s.onsetAge[k] / MP_RESP.tHyperS) : 0;
      const tw = MP_RESP.tHyperGain * hyper - MP_RESP.tInvertGain * N * (1 - I);
      for (let c = 0; c < 3; c++) {
        st[c] += MP_RESP.stGain * w * inj * r.dir[c];
        tv[c] += w * tw * r.dir[c];
      }
    });
    return { st, t: tv };
  }

  /** Skin, airway and circulation components of the reaction now (bronchodilation relieves the airway). */
  reactionComponents(fx: DrugEffects): ReactionComponents {
    const rx = this.st.reaction.level;
    const bd = fx.bronchodilation ?? 0;
    return { skin: rx, airway: bd > 0 ? rx * (1 - MP_RESP.bronchodilatorAirwayRelief * bd) : rx, circulation: rx };
  }

  /** Effects on heart rate (multiplier) and systemic tone from vagal, contrast and reaction. */
  autonomic(fx: DrugEffects): { hrMult: number; svrMult: number; leakMlS: number; spo2Drop: number; hrDelta: number } {
    const s = this.st;
    const block = 1 - fx.vagolysis;
    const vag = s.vagal * block;
    const brady = 1 - Math.min(0.5, MP_RESP.contrastBradyRight * s.contrast.right + MP_RESP.contrastBradyLeft * s.contrast.left) * (0.4 + 0.6 * block);
    const rc = this.reactionComponents(fx);
    const rx = rc.circulation;
    const aw = rc.airway;
    const c = s.course;
    // the vascular tone follows the vagal level with the course's lag (at once without a course)
    const vagSvr = c ? c.vagalSvr : s.vagal;
    // the late, pre-arrest presentation: the tachycardia gives way to a bradycardia as the reaction deepens
    const E = MP_EMERGENCY;
    const pre = c?.preArrest ? Math.max(0, Math.min(1, (rx - E.preArrestFrom) / (E.preArrestFull - E.preArrestFrom))) : 0;
    const preHr = pre > 0 ? 1 - E.preArrestHrDrop * pre * (1 - E.preArrestAtropineShare * fx.vagolysis) : 1;
    return {
      hrMult: (1 - MP_RESP.vagalHrDrop * vag) * brady * preHr,
      svrMult: (1 - MP_RESP.vagalSvrDrop * vagSvr * (1 - 0.3 * fx.vagolysis)) * (1 - 0.6 * rx),
      leakMlS: rx > 0.3 ? (rx - 0.3) * 6 : 0,
      spo2Drop: aw > 0.3 ? (aw - 0.3) * 14 : 0,
      hrDelta: 30 * rx * (1 - pre),
    };
  }

  symptoms(fm: CoronaryFlowMap, fx: DrugEffects, i: { painSensitivity: number; anxietyBaseline: number; arrested: boolean; map: number; lvedp: number }): Symptoms {
    const s = this.st;
    const lv = this.lvIschaemia(fm) + 0.5 * this.rvIschaemia(fm);
    const ischPain = 10 * (lv / (lv + 0.08)) * Math.min(1, lv * 12);
    const pain = Math.min(10, (ischPain + s.procPain) * i.painSensitivity * (1 - 0.7 * fx.analgesia));
    const rc = this.reactionComponents(fx);
    const rx = rc.skin;
    const aw = rc.airway;
    const unresponsive = i.arrested || i.map < 35;
    return {
      chestPain: Math.round(pain * 10) / 10,
      nausea: Math.min(1, s.vagal * 1.2 + 0.2 * fx.adenosineSymptoms),
      dyspnoea: Math.min(1, Math.max(0, (i.lvedp - 22) / 12) + 0.7 * fx.adenosineSymptoms + (aw > 0.3 ? aw : 0)),
      flushing: Math.min(1, 0.8 * fx.adenosineSymptoms + rx),
      itch: s.reaction.kind !== "none" && rx > 0 ? Math.min(1, rx * 3) : 0,
      anxiety: Math.min(1, Math.max(0, i.anxietyBaseline * (1 - 0.8 * fx.sedation) + pain * 0.04)),
      drowsy: fx.sedation,
      conscious: unresponsive ? 0 : Math.max(0, 1 - fx.sedation * 0.8 - Math.max(0, (55 - i.map) / 40)),
    };
  }

  snapshot(): ResponsesState {
    return JSON.parse(JSON.stringify(this.st));
  }
  restore(s: ResponsesState): void {
    this.st = JSON.parse(JSON.stringify(s));
    if (!this.st.supplyDeficit || this.st.supplyDeficit.length !== this.st.deficit.length) this.st.supplyDeficit = this.st.deficit.slice();
  }
}
