// ---------------------------------------------------------------------------
// The full case's emergencies (proc-anaphylaxis-vagal): the anaphylaxis order
// set, the vasovagal reaction and its look-alikes, and vagal prevention at
// puncture, sheath insertion and sheath removal.
//
// This file holds what the session module (modules/emergencies.ts), the order
// section (src/ui/access/orders/Emergency.tsx) and the scenarios
// (scenarios/emergencies.ts) share: the orders with their sourced doses, the
// tryptase windows, the local anaesthetic volumes, the scoring rules as pure
// functions, and a port onto the patient engine's emergency methods (the
// session's PatientPort does not carry them; the module reaches them by duck
// typing, as the planning module reaches setOxygen).
//
// Sources (module text, src/content/manual/**):
//   ANAPHYLAXIS   pm-lab-drugs-contrast-reactions (pci-manual/04-lab-drugs.ts):
//                 the treatment table (Brilakis 3.3 and 3.6, Oxford ch 10) and
//                 the RCUK 2021 steps: 0.5 mg IM (0.5 mL of 1 mg/mL) into the
//                 anterolateral thigh, repeated after 5 minutes; a crystalloid
//                 bolus of 500-1000 mL, up to 3-5 litres in severe shock;
//                 refractory after two IM doses: a low-dose infusion with
//                 expert help; chlorphenamine 10 mg IV and hydrocortisone
//                 200 mg IV (Oxford); nebulised salbutamol 5 mg (Oxford);
//                 tryptase: the first sample as soon as feasible without
//                 delaying treatment, the second 1-2 hours after onset (no
//                 later than 4 hours), the third at least 24 hours after
//                 resolution or at follow-up.
//   VASOVAGAL     cm-patient-complications-vasovagal (complication-management/
//                 05-patient-complications.ts): atropine 0.5-1.0 mg IV
//                 (Oxford), 0.5 mg repeated to 3 mg (Brilakis); fast saline;
//                 improvement expected within a few minutes (Oxford).
//   LOCAL         pm-access (pci-manual/05-access.ts): femoral 10-20 mL
//                 (Brilakis) or 10 mL of 1% lidocaine (Oxford); radial about
//                 1 mL (Brilakis) or 1-2 mL (Oxford).
// Every other number below is a MODEL PARAMETER (MP_EMERGENCIES), a session
// setting rather than a clinical value.
//
// Engine-light: imports types only, so the order section and the scenarios can
// import it without the engine.
// ---------------------------------------------------------------------------

import type { DrugId, InfusionDrug, InfusionOrder, Route } from "../patient/pharmacology";
import type { ReactionKind } from "../patient/responses";
import type { EmergencyModel, GiveResult, StimulusKind, Vitals } from "../patient/engine";

// ---------------------------------------------------------------------------
// Sourced doses and windows
// ---------------------------------------------------------------------------

/** The anaphylaxis order set's doses (pm-lab-drugs-contrast-reactions; see the header). */
export const ANAPHYLAXIS = {
  /** RCUK 2021 and Oxford: adrenaline 0.5 mg IM, that is 0.5 mL of the 1 mg/mL strength (µg) */
  imAdrenalineUg: 500,
  imAdrenalineMl: 0.5,
  imStrengthMgPerMl: 1,
  /** RCUK 2021: repeat IM after 5 minutes if airway, breathing or circulation problems persist (s) */
  repeatAfterS: 300,
  /** RCUK 2021: refractory anaphylaxis is no improvement after two appropriate IM doses */
  refractoryAfterDoses: 2,
  /** RCUK 2021: a rapid crystalloid bolus of 500-1000 mL; up to 3-5 litres in severe anaphylactic shock (mL) */
  fluidBolusMl: [500, 1000] as const,
  fluidUpToMl: [3000, 5000] as const,
  /** Oxford ch 10: chlorphenamine 10 mg IV, hydrocortisone 200 mg IV, nebulised salbutamol 5 mg (mg) */
  chlorphenamineMg: 10,
  hydrocortisoneMg: 200,
  salbutamolMg: 5,
  /** the arrest dose: 1 mg IV (FORMULARY_REFERENCE, 04-lab-drugs.ts:654), never with a pulse (µg) */
  ivArrestDoseUg: 1000,
} as const;

/** RCUK 2021 tryptase timing (pm-lab-drugs-contrast-reactions, the 'Tryptase' step), s after onset. */
export const TRYPTASE = {
  /** the second sample: 1-2 hours after onset */
  secondFromS: 3600,
  secondIdealToS: 7200,
  /** ... no later than 4 hours */
  secondLatestS: 4 * 3600,
  /** the third: at least 24 hours after resolution, or at follow-up */
  thirdAfterResolutionS: 24 * 3600,
} as const;

/** The vasovagal reaction's treatment (cm-patient-complications-vasovagal; see the header). */
export const VASOVAGAL = {
  /** Oxford: atropine 0.5-1.0 mg IV; Brilakis: 0.5 mg repeated as needed to 3 mg in total (mg) */
  atropineMg: [0.5, 1.0] as const,
  atropineMaxMg: 3,
} as const;

/** Local anaesthetic volumes by site (pm-access, 05-access.ts:455, 519 and 807), mL. */
export const LOCAL_ANAESTHETIC = {
  /** femoral: Brilakis 10-20 mL; Oxford 10 mL of 1% lidocaine */
  femoralMl: [10, 20] as const,
  /** radial: Brilakis about 1 mL; Oxford 1-2 mL; larger volumes flatten the artery */
  radialMl: [1, 2] as const,
} as const;

/** MODEL PARAMETERS of the session's emergencies (session settings, not clinical values). */
export const MP_EMERGENCIES = {
  /** IM adrenaline counts as prompt within this time of the reaction's first signs (s; lab request: 'within a short time of recognition') */
  imWithinS: 120,
  /** the repeat dose counts from this long after the first (s: 'after 5 minutes', with a minute's tolerance) */
  repeatFromS: 240,
  /** ... and is expected by this long after the first (s) */
  repeatByS: 480,
  /** after two doses, the infusion is expected within this time of the second (s) */
  infusionByS: 600,
  /** problems persist: the reaction's circulation or airway component at or above this, or MAP below 65 */
  persistLevel: 0.2,
  persistMapMmHg: 65,
  /** an adrenaline infusion above this rate counts as excessive (µg/min): above the module's 2-10 µg/min (04-lab-drugs.ts:654) */
  infusionExcessUgMin: 10,
  /** rates offered for the infusion (µg/min) */
  infusionRatesUgMin: [1, 2, 5, 10, 20] as const,
  /** an excessive rate gives a tachyarrhythmia after this long, which settles this long after the rate is reduced (s) */
  infusionTachyAfterS: 60,
  infusionSettleS: 30,
  /** time each kind of order takes (s): an IM or IV drug, a drug already drawn up, a nebuliser, an echo, a call */
  orderS: { im: 20, iv: 25, ready: 5, neb: 30, echo: 120, call: 15, sample: 30, note: 20, bleedCheck: 60, posture: 10 },
  /** a rapid crystalloid bolus runs in over this time (s) */
  bolusOverS: 300,
  /** the saline drip before sheath removal: volume and duration (mL, s) */
  salineDripMl: 500,
  salineDripS: 3600,
  /** legs raised: the volume moved to the central circulation, over this time (mL, s) */
  legsUpMl: 250,
  legsUpS: 30,
  /** high-flow oxygen (L/min; the engine's FiO2 ceiling applies) */
  oxygenLpm: 15,
  /** contrast per 'continue the angiogram' injection (mL) */
  injectionMl: 8,
  /** a vagal episode is symptomatic when, within this time of onset, HR < 50 or MAP < 65 (s) */
  vagalSymptomaticWithinS: 90,
  /** the vagal treatment (atropine or fluid) is expected within this time of onset (s) */
  vagalTreatWithinS: 180,
  /** no response: MAP still below 65 this long after the first treatment ('within a few minutes', Oxford) (s) */
  noResponseAfterS: 180,
  /** after the no-response line, a look for a mimic (echo or bleeding check) is expected within (s) */
  reconsiderWithinS: 300,
  /** a hypotension with HR at or above this is 'fast' (bpm), and calls for a look within (s) */
  fastHr: 100,
  fastLookWithinS: 300,
  /** a reaction counts as resolved below this level with MAP at or above 65 */
  resolvedLevel: 0.05,
  /** the vasovagal and fast-hypotension windows close this long after their onset (s) */
  episodeS: 900,
  /** the vagal vasodilation lags the slowing by this time constant (s) */
  vagalSvrLagS: 40,
  /** sheath removal: vagal magnitude by site (femoral, radial) */
  removalMagnitude: { femoral: 0.55, radial: 0.3 },
  /** the echo's read-out: a large effusion (with MAP below 65, chamber collapse), any effusion, and the blood loss or MAP that shows small hyperdynamic ventricles (mL, mL, mL, mmHg) */
  echo: { largeEffusionMl: 100, effusionMl: 20, hypovolaemicLossMl: 500, hypovolaemicMap: 55 },
  /** the bleeding check's read-out: a haematoma at the puncture from this volume, a fallen point-of-care haemoglobin above this blood loss (mL) */
  bleedCheck: { haematomaMl: 30, hbFallLossMl: 400 },
  /** a heart rate below this counts as the vagal slowing (symptomatic episode, the 'bradycardia' lab event) (bpm) */
  symptomaticHr: 50,
  /** a fast-rate hypotension is called once the MAP has stood below 65 this long (s) */
  fastHypotensionHoldS: 10,
  /** a reaction is not called resolved before this long after its onset (s) */
  resolvedMinS: 60,
  /**
   * The signs the patient says and the nurse sees, once each (0..1 levels): a symptom is said from
   * `speak` (itch from `itch`; the team patient's symptomSpeak and itchSpeak, team/params.ts), the
   * rash is seen from the reaction's skin level `skin` and the wheeze and swollen lips from its
   * airway level `airway`. Nothing said names the reaction.
   */
  signs: { speak: 0.5, itch: 0.4, skin: 0.3, airway: 0.3 },
} as const;

// ---------------------------------------------------------------------------
// The orders
// ---------------------------------------------------------------------------

export type EmergencyActionId =
  | "stop-contrast"
  | "call-help"
  | "adrenaline-im"
  | "oxygen"
  | "fluid-500"
  | "fluid-1000"
  | "salbutamol"
  | "lie-flat-legs-up"
  | "sit-up"
  | "adrenaline-infusion"
  | "infusion-rate"
  | "infusion-stop"
  | "chlorphenamine"
  | "hydrocortisone"
  | "atropine-0.5"
  | "atropine-1"
  | "adrenaline-iv-1mg"
  | "more-contrast"
  | "tryptase"
  | "allergy-referral"
  | "record-agent"
  | "cpr-start"
  | "cpr-stop"
  | "echo"
  | "bleeding-check"
  | "local"
  | "saline-drip"
  | "atropine-ready"
  | "fluid-ready"
  | "cuff-cycle";

export interface EmergencyOrderSpec {
  id: EmergencyActionId;
  /** button label, sentence case, generic names only */
  label: string;
  group: "anaphylaxis" | "support" | "vagal" | "prevention" | "follow-up" | "look";
}

/**
 * The orders the section offers, in display order. Nothing here says which fits the patient: the
 * right and the wrong orders sit side by side, as on a real drug trolley.
 */
export const EMERGENCY_ORDERS: readonly EmergencyOrderSpec[] = [
  { id: "stop-contrast", label: "Stop the contrast", group: "anaphylaxis" },
  { id: "call-help", label: "Call for help (anaesthetist)", group: "anaphylaxis" },
  { id: "adrenaline-im", label: `Adrenaline ${ANAPHYLAXIS.imAdrenalineUg / 1000} mg IM (${ANAPHYLAXIS.imAdrenalineMl} mL of ${ANAPHYLAXIS.imStrengthMgPerMl} mg/mL)`, group: "anaphylaxis" },
  { id: "adrenaline-iv-1mg", label: `Adrenaline ${ANAPHYLAXIS.ivArrestDoseUg / 1000} mg IV`, group: "anaphylaxis" },
  { id: "chlorphenamine", label: `Chlorphenamine ${ANAPHYLAXIS.chlorphenamineMg} mg IV`, group: "anaphylaxis" },
  { id: "hydrocortisone", label: `Hydrocortisone ${ANAPHYLAXIS.hydrocortisoneMg} mg IV`, group: "anaphylaxis" },
  { id: "salbutamol", label: `Salbutamol ${ANAPHYLAXIS.salbutamolMg} mg nebulised`, group: "anaphylaxis" },
  { id: "more-contrast", label: "Continue the angiogram", group: "anaphylaxis" },
  { id: "oxygen", label: "High-flow oxygen", group: "support" },
  { id: "fluid-500", label: `Crystalloid ${ANAPHYLAXIS.fluidBolusMl[0]} mL rapid`, group: "support" },
  { id: "fluid-1000", label: `Crystalloid ${ANAPHYLAXIS.fluidBolusMl[1]} mL rapid`, group: "support" },
  { id: "lie-flat-legs-up", label: "Lie flat, legs raised", group: "support" },
  { id: "sit-up", label: "Sit the patient up", group: "support" },
  { id: "cuff-cycle", label: "Cuff every minute", group: "support" },
  { id: "cpr-start", label: "Start CPR", group: "support" },
  { id: "cpr-stop", label: "Stop CPR", group: "support" },
  { id: "atropine-0.5", label: `Atropine ${VASOVAGAL.atropineMg[0]} mg IV`, group: "vagal" },
  { id: "atropine-1", label: `Atropine ${VASOVAGAL.atropineMg[1]} mg IV`, group: "vagal" },
  { id: "echo", label: "Echo now", group: "look" },
  { id: "bleeding-check", label: "Check the groin, abdomen and haemoglobin", group: "look" },
  { id: "saline-drip", label: "Start a saline drip", group: "prevention" },
  { id: "atropine-ready", label: "Draw up atropine", group: "prevention" },
  { id: "fluid-ready", label: "Prepare a fluid bolus", group: "prevention" },
  { id: "tryptase", label: "Tryptase sample", group: "follow-up" },
  { id: "record-agent", label: "Record the agent and the reaction", group: "follow-up" },
  { id: "allergy-referral", label: "Refer to the allergy clinic", group: "follow-up" },
];

export const EMERGENCY_ORDER_BY_ID: Readonly<Record<EmergencyActionId, EmergencyOrderSpec | undefined>> = Object.fromEntries(EMERGENCY_ORDERS.map((o) => [o.id, o])) as Record<EmergencyActionId, EmergencyOrderSpec | undefined>;

// ---------------------------------------------------------------------------
// Pure rules
// ---------------------------------------------------------------------------

/** Where a tryptase sample falls (RCUK 2021 windows; TRYPTASE). */
export type TryptaseWindow = "first" | "second" | "third" | "none";

export interface TryptaseVerdict {
  window: TryptaseWindow;
  correct: boolean;
  /** what the debrief says was done, short */
  given: string;
}

/**
 * Classify a tryptase sample at `t` (s): `onsetS` the reaction's first signs (null: no reaction),
 * `firstAdrenalineS` the first adrenaline dose (null: none yet), `resolvedS` when it resolved (null:
 * not yet), `earlier` the windows of the samples already taken. A first sample is right as soon as
 * treatment has started and before the second window; the second within 1-4 hours of onset (ideally
 * 1-2); the third at least 24 hours after resolution. Anything else is outside the windows.
 */
export function classifyTryptase(t: number, onsetS: number | null, firstAdrenalineS: number | null, resolvedS: number | null, earlier: readonly TryptaseWindow[] = []): TryptaseVerdict {
  const h = (s: number) => `${Math.round((s / 3600) * 10) / 10} h`;
  const min = (s: number) => `${Math.round(s / 60)} min`;
  if (onsetS === null || t < onsetS) return { window: "none", correct: false, given: "Tryptase sent with no reaction to date" };
  const since = t - onsetS;
  if (resolvedS !== null && t - resolvedS >= TRYPTASE.thirdAfterResolutionS) return { window: "third", correct: !earlier.includes("third"), given: `Sample ${h(t - resolvedS)} after resolution` };
  if (since < TRYPTASE.secondFromS) {
    if (firstAdrenalineS === null || t < firstAdrenalineS) return { window: "none", correct: false, given: `Sample at ${min(since)}, before any adrenaline` };
    if (earlier.includes("first")) return { window: "none", correct: false, given: `A further sample at ${min(since)}, before the 1-2 hour window` };
    return { window: "first", correct: true, given: `First sample at ${min(since)}, after adrenaline` };
  }
  if (since <= TRYPTASE.secondLatestS) {
    if (earlier.includes("second")) return { window: "none", correct: false, given: `A further sample at ${h(since)}` };
    return { window: "second", correct: true, given: `Second sample at ${h(since)} after onset` };
  }
  return { window: "none", correct: false, given: `Sample at ${h(since)} after onset, outside the windows` };
}

/** The local anaesthetic range for a site kind (mL), and whether a volume is within it. */
export function localRange(site: "femoral" | "radial"): readonly [number, number] {
  return site === "femoral" ? LOCAL_ANAESTHETIC.femoralMl : LOCAL_ANAESTHETIC.radialMl;
}

/**
 * The local anaesthetic's adequacy for the vagal prevention scaling (0..1): the volume against the
 * lower end of the site's range, zero until it has had `onsetS` to act. A radial volume above the
 * range still anaesthetises (its harm, a flattened artery, is the puncture model's).
 */
export function localAdequacy(site: "femoral" | "radial", ml: number, givenAtS: number | null, nowS: number, onsetS: number): number {
  if (givenAtS === null || !(ml > 0) || nowS - givenAtS < onsetS) return 0;
  return Math.max(0, Math.min(1, ml / localRange(site)[0]));
}

/** The reaction's problems persist now (RCUK: 'airway, breathing or circulation problems persist'). */
export function reactionPersists(v: Pick<Vitals, "reaction" | "aortaTrue">): boolean {
  return v.reaction.circulation >= MP_EMERGENCIES.persistLevel || v.reaction.airway >= MP_EMERGENCIES.persistLevel || v.aortaTrue.mean < MP_EMERGENCIES.persistMapMmHg;
}

/** What an echo shows now: a pericardial effusion by volume, or the filling and function (an investigation the learner asked for). */
export function echoFinding(pericardialMl: number, mapMmHg: number, bloodLostMl: number): string {
  const E = MP_EMERGENCIES.echo;
  if (pericardialMl >= E.largeEffusionMl && mapMmHg < MP_EMERGENCIES.persistMapMmHg) return "Echo: a large pericardial effusion with right ventricular diastolic collapse.";
  if (pericardialMl >= E.effusionMl) return "Echo: a pericardial effusion, without chamber collapse.";
  if (bloodLostMl >= E.hypovolaemicLossMl || mapMmHg < E.hypovolaemicMap) return "Echo: no pericardial effusion; small, hyperdynamic ventricles.";
  return "Echo: no pericardial effusion; the ventricles fill and contract normally.";
}

// ---------------------------------------------------------------------------
// The engine port
// ---------------------------------------------------------------------------

/**
 * The patient engine's methods the emergencies use (PatientEngine has every one; a test double may
 * leave some out, and the module then skips that effect).
 */
export interface EmergencyEnginePort {
  giveDrug?(drug: DrugId, dose: number, route: Route): GiveResult;
  give?(o: { drug: DrugId; dose: number; route: Route }): unknown;
  startInfusion?(o: InfusionOrder): void;
  stopInfusion?(drug: InfusionDrug): void;
  setOxygen?(lpm: number): void;
  setCpr?(on: boolean): void;
  fluid?(ml: number, overS?: number): void;
  contrast?(ml: number, side: "left" | "right" | "root" | "lv"): void;
  stimulus?(kind: StimulusKind, magnitude?: number): void;
  setEmergencyModel?(m: Partial<EmergencyModel> | null): void;
  forceReaction?(kind: Exclude<ReactionKind, "none">, onsetS: number, opts?: { preArrest?: boolean }): void;
  forceVagal?(level?: number, holdS?: number): void;
  reactionPreArrest?(): boolean;
  forceRhythm?(kind: "vf" | "vt" | "asystole" | "aivr" | "sinus" | "chb", reason?: string): void;
  setPericardialInflow?(mlPerS: number): void;
  startNibp?(): void;
  setNibpInterval?(minutes: number | null): void;
  vitals?(): Vitals;
}

/** The engine behind a session's patient, as the emergencies' port. */
export function emergencyEngine(s: { patient: unknown }): EmergencyEnginePort {
  return s.patient as EmergencyEnginePort;
}

// ---------------------------------------------------------------------------
// Scenario helpers (used by scenarios/emergencies.ts through public methods only)
// ---------------------------------------------------------------------------

/**
 * A scenario's at-risk patient (asthma, atopy, a previous reaction): the reaction is forced to begin
 * `onsetS` after the first injection, which is given here (`ml` into the left coronary, the
 * angiogram's first run). Forcing it before the injection skips the random draw.
 */
export function scriptReaction(s: { patient: unknown }, kind: Exclude<ReactionKind, "none">, onsetS: number, ml: number, opts: { preArrest?: boolean } = {}): boolean {
  const e = emergencyEngine(s);
  if (!e.forceReaction) return false;
  e.forceReaction(kind, onsetS, opts);
  e.contrast?.(ml, "left");
  return true;
}

/** A scripted vasovagal reaction now (the look-alike), with the cuff cycling as at sheath removal. */
export function scriptVagal(s: { patient: unknown }, level?: number, holdS?: number): boolean {
  const e = emergencyEngine(s);
  if (!e.forceVagal) return false;
  e.forceVagal(level, holdS);
  return true;
}

/** A scripted bleed into the pericardium (the tamponade look-alike), mL/s. */
export function scriptPericardialBleed(s: { patient: unknown }, mlPerS: number): boolean {
  const e = emergencyEngine(s);
  if (!e.setPericardialInflow) return false;
  e.setPericardialInflow(mlPerS);
  return true;
}

/** Non-invasive pressure every `minutes` (Brilakis 11.1: telemetry and non-invasive pressure monitoring at removal). */
export function cycleCuff(s: { patient: unknown }, minutes = 1): void {
  const e = emergencyEngine(s);
  e.startNibp?.();
  e.setNibpInterval?.(minutes);
}
