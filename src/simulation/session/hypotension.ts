// ---------------------------------------------------------------------------
// The full case's hypotension and pulmonary oedema (proc-hypotension-pressors):
// what the session module (modules/hypotension.ts), the infusion and order
// section (src/ui/access/orders/Infusions.tsx with
// src/ui/access/InfusionPanel.tsx) and the scenarios (scenarios/hypotension.ts)
// share. The causes themselves, with their signatures and drug rules, are the
// shared model in src/simulation/patient/hypotensionCauses.ts; this file holds
// the case's side: the infusion catalogue with its sourced doses, the orders,
// the oedema regimen and the scoring rules as pure functions.
//
// Sources (module text, src/content/manual/**):
//   PRESSOR RANGES  pm-lab-drugs-pressors, the drug table (Brilakis 3.6,
//                   pci-manual/04-lab-drugs.ts:650-655; FORMULARY_REFERENCE in
//                   pharmacology.ts): phenylephrine 50-100 µg IV bolus, then
//                   0.5-1.4 µg/kg/min; noradrenaline 0.1-0.5 µg/kg/min;
//                   vasopressin 0.03 U/min rising by 0.005 U/min every 10-15
//                   minutes to 0.1 U/min; dopamine 5-10 µg/kg/min (inotrope),
//                   10-20 µg/kg/min (vasopressor); adrenaline 2-10 µg/min in
//                   cardiogenic shock; dobutamine 2-20 µg/kg/min (ESC 2021,
//                   'start inotropes at low doses and uptitrate'; Brilakis
//                   prints 10-40); 'give through a central line if possible'.
//                   Isoprenaline 5-10 µg/min (Oxford, 04-lab-drugs.ts:886).
//   VASOPRESSOR TRIGGER  Brilakis: a mean arterial pressure below 60 mmHg
//                   (04-lab-drugs.ts:662).
//   OEDEMA          cm-flow-embolism-oedema-cholesterol (complication-
//                   management/02-flow-embolism.ts:715-745): at risk with LV
//                   impairment, a raised LVEDP, severe aortic or mitral stenosis
//                   or dialysis (Oxford); above an LVEDP of 30 mmHg oedema is
//                   likely (Oxford ch 4); treatment: high-flow oxygen, sit up,
//                   furosemide 80-100 mg IV, IV nitrate only if the systolic is
//                   above 100 mmHg (Brilakis's GTN 10 µg/min, +10 every 5
//                   minutes to 200), CPAP, consider an IABP with haemodynamic
//                   compromise. The wrong options (a fluid bolus, a nitrate at
//                   low pressure) are the lab request's (cm-flow-embolism#8).
// Every other number below is a MODEL PARAMETER (MP_HYPOTENSION, the syringe
// strengths and the order times): settings of the simulator, not clinical
// values. Syringe strengths in particular are local protocol; the ones offered
// exist only so the pump can show a rate in mL/h.
//
// Engine-light: types only from the engine.
// ---------------------------------------------------------------------------

import type { InfusionDrug } from "../patient/pharmacology";
import type { BridgeDrug } from "../patient/hypotensionCauses";

// ---------------------------------------------------------------------------
// The infusion catalogue
// ---------------------------------------------------------------------------

/** The infusions the panel offers. */
export type PumpDrug = Extract<InfusionDrug, "phenylephrine" | "noradrenaline" | "vasopressin" | "dopamine" | "adrenaline" | "dobutamine" | "isoprenaline" | "gtn">;

export interface PumpSpec {
  drug: PumpDrug;
  /** generic name, sentence case */
  label: string;
  /** the rate unit the module text doses it in */
  unit: "µg/kg/min" | "µg/min" | "U/min";
  /** the engine's infusion unit is per minute without weight (µg/min, U/min) while the dose is per kg */
  engineToKg: boolean;
  /** the module's range for this use, in `unit` */
  range: readonly [number, number];
  /** where the range comes from (full provenance, for docs/realism) */
  source: string;
  /** the learner-facing citation for the range (the module text only, no file references) */
  cite: string;
  /** what the drug does, for the team's read-back (the lesson's table) */
  action: "vasopressor" | "vasopressor-inotrope" | "inotrope" | "chronotrope" | "vasodilator";
  /** syringe strengths offered (MODEL PARAMETERS: local protocol decides), in µg/mL or U/mL */
  strengths: readonly number[];
  strengthUnit: "µg/mL" | "U/mL";
  /** the panel's rate step */
  step: number;
}

export const PUMPS: readonly PumpSpec[] = [
  { drug: "noradrenaline", label: "Noradrenaline", unit: "µg/kg/min", engineToKg: true, range: [0.1, 0.5], source: "Brilakis 3.6, 04-lab-drugs.ts:651", cite: "Brilakis 3.6", action: "vasopressor-inotrope", strengths: [40, 80], strengthUnit: "µg/mL", step: 0.05 },
  { drug: "phenylephrine", label: "Phenylephrine", unit: "µg/kg/min", engineToKg: false, range: [0.5, 1.4], source: "Brilakis 3.6, 04-lab-drugs.ts:650", cite: "Brilakis 3.6", action: "vasopressor", strengths: [100, 200], strengthUnit: "µg/mL", step: 0.1 },
  { drug: "vasopressin", label: "Vasopressin", unit: "U/min", engineToKg: false, range: [0.03, 0.1], source: "Brilakis 3.6, 04-lab-drugs.ts:652", cite: "Brilakis 3.6", action: "vasopressor", strengths: [0.4, 1], strengthUnit: "U/mL", step: 0.005 },
  { drug: "dopamine", label: "Dopamine", unit: "µg/kg/min", engineToKg: false, range: [5, 20], source: "Brilakis 3.6, 04-lab-drugs.ts:653", cite: "Brilakis 3.6", action: "vasopressor-inotrope", strengths: [1600, 3200], strengthUnit: "µg/mL", step: 1 },
  { drug: "adrenaline", label: "Adrenaline", unit: "µg/min", engineToKg: false, range: [2, 10], source: "Brilakis 3.6, 04-lab-drugs.ts:654", cite: "Brilakis 3.6", action: "vasopressor-inotrope", strengths: [40, 80], strengthUnit: "µg/mL", step: 1 },
  { drug: "dobutamine", label: "Dobutamine", unit: "µg/kg/min", engineToKg: false, range: [2, 20], source: "ESC 2021 in the lesson, 04-lab-drugs.ts:655", cite: "ESC 2021 in the lesson", action: "inotrope", strengths: [2500, 5000], strengthUnit: "µg/mL", step: 0.5 },
  { drug: "isoprenaline", label: "Isoprenaline", unit: "µg/min", engineToKg: false, range: [5, 10], source: "Oxford, 04-lab-drugs.ts:886", cite: "Oxford", action: "chronotrope", strengths: [20, 40], strengthUnit: "µg/mL", step: 1 },
  { drug: "gtn", label: "Glyceryl trinitrate", unit: "µg/min", engineToKg: false, range: [10, 200], source: "Brilakis 3.2, 04-lab-drugs.ts:254", cite: "Brilakis 3.2", action: "vasodilator", strengths: [500, 1000], strengthUnit: "µg/mL", step: 10 },
];

export const PUMP_BY_DRUG: Readonly<Record<PumpDrug, PumpSpec>> = Object.fromEntries(PUMPS.map((p) => [p.drug, p])) as Record<PumpDrug, PumpSpec>;

/** The engine rate (INFUSIONS units in pharmacology.ts) for a dose rate in the panel's unit. */
export function engineRate(spec: Pick<PumpSpec, "engineToKg">, rate: number, weightKg: number): number {
  return spec.engineToKg ? rate * weightKg : rate;
}

/** The pump's rate in mL/h for a dose rate and a syringe strength. */
export function pumpMlPerHour(spec: Pick<PumpSpec, "unit">, rate: number, strength: number, weightKg: number): number {
  const perMin = spec.unit === "µg/kg/min" ? rate * weightKg : rate;
  return strength > 0 ? Math.round(((perMin * 60) / strength) * 10) / 10 : 0;
}

/** Vasoactive drugs (pressors, inotropes, chronotropes), as opposed to the nitrate. */
export const VASOACTIVE: readonly PumpDrug[] = ["noradrenaline", "phenylephrine", "vasopressin", "dopamine", "adrenaline", "dobutamine", "isoprenaline"];
export const isVasoactive = (d: string): d is Extract<PumpDrug, BridgeDrug> => (VASOACTIVE as readonly string[]).includes(d);

// ---------------------------------------------------------------------------
// Sourced doses and thresholds
// ---------------------------------------------------------------------------

/** Atropine for heart block: 'Atropine 1 mg IV may improve AV nodal conduction' (04-lab-drugs.ts:886), mg. */
export const ATROPINE_BLOCK_MG = 1;

/** Pressor boluses and the vasopressor trigger (pm-lab-drugs-pressors; see the header). */
export const PRESSOR_DOSES = {
  /** phenylephrine 50-100 µg IV bolus (µg) */
  phenylephrineBolusUg: [50, 100] as const,
  /** Brilakis's trigger for a vasopressor: MAP below 60 mmHg */
  vasopressorMapMmHg: 60,
} as const;

/** The oedema regimen and its thresholds (cm-flow-embolism-oedema-cholesterol; see the header). */
export const OEDEMA = {
  /** Oxford: furosemide 80-100 mg IV (mg) */
  furosemideMg: [80, 100] as const,
  /** IV nitrate only if the systolic is above 100 mmHg (Oxford and Brilakis) */
  nitrateMinSbpMmHg: 100,
  /** Brilakis's GTN infusion: start at 10 µg/min, +10 every 5 minutes, maximum 200 (µg/min) */
  gtnStartUgMin: 10,
  gtnMaxUgMin: 200,
  /** Oxford ch 4: above an LVEDP of 30 mmHg pulmonary oedema is likely (mmHg) */
  lvedpLikelyMmHg: 30,
} as const;

/** MODEL PARAMETERS of the case's hypotension and oedema (session settings, not clinical values). */
export const MP_HYPOTENSION = {
  /** the displayed mean pressure below which an episode opens, held this long (mmHg, s; the lab's hypotension event, patientEvents.ts) */
  episodeMapMmHg: 65,
  episodeHoldS: 10,
  /** an episode closes once the true and displayed means have stood at or above the threshold this long (s) */
  episodeCloseS: 180,
  /** the cause is expected to be treated within this time of the episode's onset (s) */
  causeTreatWithinS: 600,
  /** a dobutamine start above this counts as starting high (µg/kg/min): ESC 2021 'start at low doses', its range beginning at 2 */
  dobutamineLowStartUgKgMin: 5,
  /** time each kind of order takes (s) */
  orderS: { drug: 20, pump: 30, check: 10, cuff: 40, rhc: 300, rhcModelled: 20, posture: 10, call: 15 },
  /** one unit of red cells as given in the model: volume and time (mL, s) */
  bloodUnitMl: 300,
  bloodUnitS: 600,
  /** a saline bolus runs in over (s) */
  salineOverS: 300,
  /** a dose above this multiple of the top of the module's range counts as escalating (the offer of support) */
  escalateAboveTop: 1,
  /** the support offer also comes when the mean stays below the vasopressor trigger this long on a pressor (s) */
  escalateLowOnPressorS: 300,
  /** arrhythmia hazard per minute while a vasoactive drug runs above its range (dopamine at any vasopressor dose: SOAP II's excess) */
  arrhythmiaPerMin: 0.25,
  arrhythmiaDopamineFactor: 2,
  /** a high-dose arrhythmia settles this long after every drug is back within range or stopped (s) */
  arrhythmiaSettleS: 30,
  /** MODEL PARAMETER: the high-dose arrhythmia comes as non-sustained runs of VT, each this long (s) */
  arrhythmiaRunS: 15,
  /** MODEL PARAMETER: a further run follows this long after the last while a drug stays above its range (s) */
  arrhythmiaRunGapS: 60,
  /** rebound: a true mean above this on a pressor once the cause is fixed (mmHg), to be reduced within (s) */
  reboundMapMmHg: 105,
  reboundHoldS: 60,
  reboundReduceWithinS: 300,
  /** the attending's first question if a pressor is ordered with no confirm check done (only in mentor mode 'full') */
  confirmChecks: ["cuff", "zero", "level", "flush-line", "check-trace"] as const,
  /** oedema: at risk below this LVEF (%; 'LV impairment', no figure in the module), and the event's SpO2 and LVEDP (%, mmHg) */
  oedemaRiskLvef: 40,
  oedemaSpo2: 92,
  /** oedema resolves at or above this SpO2 with the LVEDP below this, held this long (%, mmHg, s) */
  oedemaResolvedSpo2: 94,
  oedemaResolvedLvedp: 25,
  oedemaResolvedHoldS: 60,
  /** an at-risk load (IV fluid plus contrast since arrival) at or above this raises 'high-contrast-volume' (mL) */
  atRiskLoadMl: 800,
  /** a fluid bolus at or above this in an at-risk patient with a raised LVEDP is the oedema decision (mL) */
  bolusMl: 500,
  /** CPAP in the model: oxygen at the mask's ceiling and a preload reduction (mL out of the central circulation, over s) */
  cpapPreloadMl: 250,
  cpapOverS: 120,
  /** high-flow oxygen (L/min; the engine's FiO2 ceiling applies) */
  oxygenLpm: 15,
  /** sitting up moves this volume out of the central circulation (mL, s) */
  sitUpMl: 150,
  sitUpS: 30,
  /** the case's signs, said once each (0..1 levels of the engine's symptoms) */
  speakLevel: 0.5,
} as const;

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type HypoOrderId =
  // is it real
  | "cuff"
  | "zero"
  | "level"
  | "flush-line"
  | "check-trace"
  // the right heart
  | "rhc"
  // volume
  | "saline-250"
  | "saline-500"
  | "saline-1000"
  | "blood-unit"
  // the cause
  | "control-bleeding"
  | "drain-pericardium"
  | "pace"
  | "atropine"
  // pressor boluses
  | "phenylephrine-50"
  | "phenylephrine-100"
  // oedema
  | "oxygen"
  | "sit-up"
  | "furosemide-80"
  | "furosemide-100"
  | "cpap";

export interface HypoOrderSpec {
  id: HypoOrderId;
  /** button label, sentence case, generic names only */
  label: string;
  group: "confirm" | "look" | "volume" | "cause" | "bolus" | "oedema";
}

/** The orders, in display order. The right and the wrong sit side by side; nothing here says which fits. */
export const HYPO_ORDERS: readonly HypoOrderSpec[] = [
  { id: "cuff", label: "Cuff pressure now", group: "confirm" },
  { id: "zero", label: "Zero the transducer", group: "confirm" },
  { id: "level", label: "Level the transducer", group: "confirm" },
  { id: "flush-line", label: "Flush the line", group: "confirm" },
  { id: "check-trace", label: "Look at the trace", group: "confirm" },
  { id: "rhc", label: "Right heart numbers", group: "look" },
  { id: "saline-250", label: "Saline 250 mL", group: "volume" },
  { id: "saline-500", label: "Saline 500 mL", group: "volume" },
  { id: "saline-1000", label: "Saline 1000 mL", group: "volume" },
  { id: "blood-unit", label: "Red cells, one unit", group: "volume" },
  { id: "control-bleeding", label: "Control the bleeding site", group: "cause" },
  { id: "drain-pericardium", label: "Pericardial drain", group: "cause" },
  { id: "pace", label: "Temporary pacing wire", group: "cause" },
  { id: "atropine", label: `Atropine ${ATROPINE_BLOCK_MG} mg IV`, group: "cause" },
  { id: "phenylephrine-50", label: `Phenylephrine ${PRESSOR_DOSES.phenylephrineBolusUg[0]} µg IV`, group: "bolus" },
  { id: "phenylephrine-100", label: `Phenylephrine ${PRESSOR_DOSES.phenylephrineBolusUg[1]} µg IV`, group: "bolus" },
  { id: "oxygen", label: "High-flow oxygen", group: "oedema" },
  { id: "sit-up", label: "Sit the patient up", group: "oedema" },
  { id: "furosemide-80", label: `Furosemide ${OEDEMA.furosemideMg[0]} mg IV`, group: "oedema" },
  { id: "furosemide-100", label: `Furosemide ${OEDEMA.furosemideMg[1]} mg IV`, group: "oedema" },
  { id: "cpap", label: "CPAP", group: "oedema" },
];

export const HYPO_ORDER_BY_ID: Readonly<Record<HypoOrderId, HypoOrderSpec>> = Object.fromEntries(HYPO_ORDERS.map((o) => [o.id, o])) as Record<HypoOrderId, HypoOrderSpec>;

/** Mechanical support devices the escalation can open (MCS consoles, generic names). */
export type SupportDevice = "iabp" | "impella" | "ecmo";
export const SUPPORT_DEVICES: readonly { id: SupportDevice; label: string }[] = [
  { id: "iabp", label: "Balloon pump" },
  { id: "impella", label: "Microaxial flow pump" },
  { id: "ecmo", label: "VA-ECMO" },
];

// ---------------------------------------------------------------------------
// Pure rules
// ---------------------------------------------------------------------------

/** A dobutamine start: within ESC 2021's 2-20 µg/kg/min and low (MP_HYPOTENSION.dobutamineLowStartUgKgMin). */
export function dobutamineStartVerdict(rate: number): { correct: boolean; given: string } {
  const [lo, hi] = PUMP_BY_DRUG.dobutamine.range;
  if (rate > hi) return { correct: false, given: `Started at ${rate} µg/kg/min, above the 2-20 range` };
  if (rate > MP_HYPOTENSION.dobutamineLowStartUgKgMin) return { correct: false, given: `Started high, at ${rate} µg/kg/min` };
  if (rate < lo) return { correct: false, given: `Started at ${rate} µg/kg/min, below the 2-20 range` };
  return { correct: true, given: `Started low, at ${rate} µg/kg/min` };
}

/** A nitrate for pulmonary oedema: only with the systolic above 100 mmHg. */
export function nitrateVerdict(sbpMmHg: number): { correct: boolean; given: string } {
  const ok = sbpMmHg > OEDEMA.nitrateMinSbpMmHg;
  return { correct: ok, given: ok ? `Nitrate at a systolic of ${Math.round(sbpMmHg)} mmHg` : `Nitrate at a systolic of ${Math.round(sbpMmHg)} mmHg (100 or below)` };
}

/** Whether a rate is above the top of a drug's range (the escalation). */
export function aboveRange(drug: PumpDrug, rate: number): boolean {
  return rate > PUMP_BY_DRUG[drug].range[1] * MP_HYPOTENSION.escalateAboveTop + 1e-9;
}

/** The line a pressor should run through: central if a venous sheath is in, else peripheral until one is. */
export function lineVerdict(line: "central" | "peripheral", centralAvailable: boolean): { correct: boolean; given: string } {
  if (line === "central") return { correct: true, given: "Through the venous sheath (central)" };
  return centralAvailable ? { correct: false, given: "Peripheral, with a venous sheath in place" } : { correct: true, given: "Peripheral (no central access in place)" };
}
