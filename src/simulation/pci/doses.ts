// ---------------------------------------------------------------------------
// Sourced antithrombotic dosing for the PCI lab's orders (pci-antithrombotic-orders).
//
// Every dose below carries the place in the module text it comes from
// (src/content/manual/pci-manual/03-antithrombotics.ts, lesson ids
// pm-antithrombotics-heparin, -alternatives, -oral and -iv). Where Brilakis and
// Oxford, or Brilakis and the product information, differ, both are kept and
// the lab shows both. Values not stated in the module text are labelled
// MODEL PARAMETER here and in docs/realism/facts/pkg-pci-antithrombotic-orders.md.
//
// These are teaching values: the console and the debrief say so
// (TEACHING_VALUES_NOTE). The drugs themselves are in the shared formulary
// (src/simulation/patient/pharmacology.ts, found-patient-formulary); this file
// only computes what an order should be and checks an order against it.
//
// Pure and engine-free.
// ---------------------------------------------------------------------------

const F = "pci-manual/03-antithrombotics.ts";

/** Where a dose comes from. */
export interface DoseSource {
  who: "Brilakis" | "Oxford" | "Product information" | "Brilakis and Oxford";
  loc: string;
  /** module text file and line (src/content/manual/...) */
  at: string;
}

const src = (who: DoseSource["who"], loc: string, line: number): DoseSource => ({ who, loc, at: `${F}:${line}` });

/** Shown with every dose the lab computes and in the debrief. */
export const TEACHING_VALUES_NOTE = "Teaching values from the module text: follow local protocol and the product information.";

// ---------------------------------------------------------------------------
// Unfractionated heparin
// ---------------------------------------------------------------------------

export const HEPARIN_PCI = {
  /** U/kg bolus with no GP IIb/IIIa inhibitor and no cangrelor (Brilakis 3.4 and 20.3; Oxford the same range) */
  aloneUPerKg: [70, 100] as const,
  /** U/kg with a GP IIb/IIIa inhibitor or cangrelor (Brilakis 3.4 and 20.3) */
  withIvAntiplateletUPerKg: [50, 70] as const,
  sources: { alone: src("Brilakis and Oxford", "3.4 and 20.3", 64), withIvAntiplatelet: src("Brilakis", "3.4 and 20.3", 65) },
} as const;

/** The PCI heparin bolus range for a weight, U (rounded to the nearest 100 U). */
export function heparinBolusU(weightKg: number, ivAntiplatelet: boolean): { rangeUPerKg: readonly [number, number]; rangeU: [number, number]; source: DoseSource } {
  const r = ivAntiplatelet ? HEPARIN_PCI.withIvAntiplateletUPerKg : HEPARIN_PCI.aloneUPerKg;
  const round = (x: number) => Math.round(x / 100) * 100;
  return { rangeUPerKg: r, rangeU: [round(r[0] * weightKg), round(r[1] * weightKg)], source: ivAntiplatelet ? HEPARIN_PCI.sources.withIvAntiplatelet : HEPARIN_PCI.sources.alone };
}

// ---------------------------------------------------------------------------
// Protamine
// ---------------------------------------------------------------------------

export const PROTAMINE_RULES = {
  /** mg per 100 U of heparin (Brilakis 3.4) */
  brilakisMgPer100U: [1, 1.5] as const,
  /** units of heparin neutralised by 1 mg when given within `oxfordWithinMin` of the heparin (Oxford) */
  oxfordUPerMg: [80, 100] as const,
  oxfordWithinMin: 15,
  /** never more than this, mg (Brilakis 3.4 and 26.2) */
  maxMg: 50,
  /** no faster than this, mg/min (Brilakis 26.2) */
  maxRateMgPerMin: 5,
  /** Oxford gives it as an infusion over this long, min */
  oxfordOverMin: 10,
  /** a reaction typically comes this long after the dose, min (Brilakis 3.4) */
  reactionOnsetMin: [5, 10] as const,
  sources: {
    brilakis: src("Brilakis", "3.4", 217),
    oxford: src("Oxford", "ch 8", 218),
    cap: src("Brilakis", "3.4 and 26.2", 218),
    rate: src("Brilakis", "26.2", 205),
    oxfordRate: src("Oxford", "ch 8", 205),
    reaction: src("Brilakis", "3.4", 205),
    risks: src("Brilakis", "3.4", 210),
  },
} as const;

/**
 * MODEL PARAMETER: Oxford says to give less protamine when more than 15 minutes have passed, without a
 * figure. The lab scales Oxford's range by the heparin left, using Brilakis's 60-minute half-life
 * after 100 U/kg (03-antithrombotics.ts:72) from the 15-minute mark.
 */
export const MP_OXFORD_LATE_HALF_LIFE_MIN = 60;

/** The protamine risk factors Brilakis 3.4 lists (03-antithrombotics.ts:210). */
export type ProtamineRisk = "isophane-insulin" | "fish-allergy" | "vasectomy" | "poor-lv" | "pulmonary-hypertension";
export const PROTAMINE_RISK_LABEL: Readonly<Record<ProtamineRisk, string>> = {
  "isophane-insulin": "Earlier isophane or protamine zinc insulin",
  "fish-allergy": "Fish allergy",
  vasectomy: "Vasectomy",
  "poor-lv": "Severely impaired LV function",
  "pulmonary-hypertension": "Abnormal pulmonary haemodynamics before the case",
};

export interface ProtamineDose {
  /** Brilakis's range for the heparin given, mg (uncapped) */
  brilakisMg: [number, number];
  /** Oxford's range for the heparin given at this time, mg (uncapped; reduced after 15 minutes) */
  oxfordMg: [number, number];
  /** Oxford's 'less later' applied */
  oxfordReduced: boolean;
  /** the lowest dose both ranges accept (or Brilakis's lower bound when they do not overlap), mg, uncapped */
  suggestedMg: number;
  /** what to give: the suggestion capped at 50 mg */
  doseMg: number;
  capped: boolean;
  sources: DoseSource[];
}

/** Protamine for `heparinU` units given `minutesSince` minutes ago. */
export function protamineDose(heparinU: number, minutesSince: number): ProtamineDose {
  const R = PROTAMINE_RULES;
  const u = Math.max(0, heparinU);
  const brilakisMg: [number, number] = [(u / 100) * R.brilakisMgPer100U[0], (u / 100) * R.brilakisMgPer100U[1]];
  const late = minutesSince > R.oxfordWithinMin;
  const left = late ? Math.pow(0.5, (minutesSince - R.oxfordWithinMin) / MP_OXFORD_LATE_HALF_LIFE_MIN) : 1;
  const oxfordMg: [number, number] = [(u / R.oxfordUPerMg[1]) * left, (u / R.oxfordUPerMg[0]) * left];
  const lo = Math.max(brilakisMg[0], oxfordMg[0]);
  const hi = Math.min(brilakisMg[1], oxfordMg[1]);
  const suggestedMg = lo <= hi ? lo : brilakisMg[0];
  const doseMg = Math.min(R.maxMg, suggestedMg);
  return { brilakisMg, oxfordMg, oxfordReduced: late, suggestedMg, doseMg, capped: suggestedMg > R.maxMg, sources: [R.sources.brilakis, R.sources.oxford, R.sources.cap] };
}

/** The rate of a protamine dose given over `overMin` minutes, and whether it keeps to the limit. */
export function protamineRate(doseMg: number, overMin: number): { mgPerMin: number; ok: boolean; oxfordOk: boolean } {
  const mgPerMin = overMin > 0 ? doseMg / overMin : Infinity;
  return { mgPerMin, ok: mgPerMin <= PROTAMINE_RULES.maxRateMgPerMin + 1e-9, oxfordOk: overMin >= PROTAMINE_RULES.oxfordOverMin };
}

/**
 * MODEL PARAMETERS: the chance of a protamine reaction (systemic hypotension with pulmonary
 * vasoconstriction, Brilakis 3.4). The module text gives the direction (slow administration lowers
 * the risk; the listed patients are at higher risk) but no incidence: the base chance, the factors and
 * the ceiling are simulator settings. The reaction's depth is a loss of vascular tone (engine
 * setVasodilation) that peaks over `riseS` and wears off with `halfLifeS`.
 */
export const MP_PROTAMINE_REACTION = {
  baseP: 0.03,
  /** multiplies the chance when the rate is above 5 mg/min */
  fastFactor: 4,
  /** multiplies the chance when the dose is above 50 mg */
  overCapFactor: 2,
  /** multiplies the chance for each listed risk factor */
  riskFactor: 2,
  maxP: 0.7,
  /**
   * vascular tone lost at the peak (0..1), a slow and a fast dose: deep enough that a drawn reaction takes
   * a standard patient's mean pressure below the lab's 65 mmHg hypotension threshold against the
   * baroreflex ('typically severe hypotension', 03-antithrombotics.ts:1213), deeper after a fast push
   */
  level: 0.7,
  levelFast: 0.8,
  riseS: 60,
  halfLifeS: 600,
} as const;

/** The chance of a protamine reaction for a dose, a rate and the number of listed risk factors. */
export function protamineReactionP(o: { doseMg: number; mgPerMin: number; risks?: number }): number {
  const M = MP_PROTAMINE_REACTION;
  let p = M.baseP;
  if (o.mgPerMin > PROTAMINE_RULES.maxRateMgPerMin + 1e-9) p *= M.fastFactor;
  if (o.doseMg > PROTAMINE_RULES.maxMg + 1e-9) p *= M.overCapFactor;
  p *= Math.pow(M.riskFactor, Math.max(0, o.risks ?? 0));
  return Math.min(M.maxP, p);
}

// ---------------------------------------------------------------------------
// IV antiplatelet agents (Brilakis 3.5; Oxford ch 8)
// ---------------------------------------------------------------------------

export type IvAntiplatelet = "eptifibatide" | "tirofiban" | "cangrelor";

/** A bolus and infusion regimen for a patient, with what blocks it. */
export interface IvRegimen {
  drug: IvAntiplatelet | "bivalirudin";
  /** bolus per kg in the formulary unit (µg/kg; bivalirudin mg/kg) */
  bolusPerKg: number;
  /** number of boluses and the gap between them, min */
  boluses: number;
  bolusGapMin?: number;
  /** the bolus is given over this long, min (tirofiban) */
  bolusOverMin?: number;
  /** total bolus for the weight in the formulary unit (each bolus) */
  bolusTotal: number;
  /** infusion rate to give, in the formulary infusion unit (µg/kg/min; bivalirudin mg/kg/h) */
  rate: number;
  rateUnit: "µg/kg/min" | "mg/kg/h";
  /** the rate was reduced for the kidneys */
  renalReduced: boolean;
  /** Brilakis's rate when the product information differs (both are shown) */
  brilakisRate?: number;
  /** a reason the drug must not be given, with its source */
  blocked: { reason: string; source: DoseSource } | null;
  sources: DoseSource[];
  notes: string[];
}

export const EPTIFIBATIDE = {
  bolusUgKg: 180,
  boluses: 2,
  bolusGapMin: 10,
  infusionUgKgMin: 2.0,
  halvedUgKgMin: 1.0,
  /** Brilakis halves at a creatinine clearance of 60 mL/min or less */
  brilakisHalveAtOrBelow: 60,
  /** the US product information halves below 50 mL/min and contraindicates dialysis */
  productHalveBelow: 50,
  sources: { dose: src("Brilakis", "3.5", 1024), renal: src("Brilakis", "3.5", 1025), product: src("Product information", "US label (lesson pm-antithrombotics-iv)", 1025) },
} as const;

export const TIROFIBAN = {
  bolusUgKg: 25,
  bolusOverMin: 3,
  infusionUgKgMin: 0.15,
  halvedUgKgMin: 0.075,
  /** halved at a creatinine clearance of 60 mL/min or less */
  halveAtOrBelow: 60,
  sources: { dose: src("Brilakis", "3.5", 1031), renal: src("Brilakis", "3.5", 1032) },
} as const;

export const CANGRELOR = {
  bolusUgKg: 30,
  infusionUgKgMin: 4,
  /** for at least 2 hours or the procedure, whichever is longer */
  minHours: 2,
  sources: { dose: src("Brilakis", "3.5", 1017), oral: src("Brilakis", "3.5", 1124) },
} as const;

export const BIVALIRUDIN = {
  bolusMgKg: 0.75,
  infusionMgKgH: 1.75,
  /** creatinine clearance below 30 mL/min */
  lowCrclMgKgH: 1.0,
  lowCrclBelow: 30,
  dialysisMgKgH: 0.25,
  halfLifeMin: 25,
  /** the run-on after the case, at the normal-renal-function rate only, h */
  runOnMaxH: 4,
  sources: {
    bolus: src("Brilakis", "3.4", 315),
    infusion: src("Brilakis", "3.4", 316),
    lowCrcl: src("Brilakis", "3.4", 318),
    dialysis: src("Brilakis", "3.4", 319),
    halfLife: src("Brilakis", "3.4", 320),
    act: src("Brilakis", "3.4", 321),
    noAntidote: src("Brilakis", "3.4", 322),
  },
} as const;

/** Settings in which an IV antiplatelet agent is not started (03-antithrombotics.ts:1112-1115). */
export type IvAvoidContext = "cto" | "perforation" | "scad" | "svg";
export const IV_ANTIPLATELET_AVOID: Readonly<Record<IvAvoidContext, { text: string; source: DoseSource }>> = {
  cto: { text: "Not given in CTO PCI, even after successful crossing and stenting.", source: src("Brilakis", "21.3", 1112) },
  perforation: { text: "Stop any GP IIb/IIIa inhibitor or cangrelor at a coronary perforation; do not start one after a distal wire perforation.", source: src("Brilakis", "26.2 and 26.4", 1113) },
  scad: { text: "Generally avoided in spontaneous coronary artery dissection.", source: src("Brilakis", "22.1", 1114) },
  svg: { text: "Not used routinely in saphenous vein graft PCI.", source: src("Brilakis and Oxford", "3.5; ch 8", 1115) },
};

export interface RenalFacts {
  weightKg: number;
  crclMlMin: number;
  dialysis?: boolean;
}

/** The eptifibatide regimen: the product information's renal rule applied, Brilakis's shown beside it. */
export function eptifibatideRegimen(p: RenalFacts): IvRegimen {
  const E = EPTIFIBATIDE;
  const brilakisHalved = p.dialysis || p.crclMlMin <= E.brilakisHalveAtOrBelow;
  const productHalved = p.dialysis || p.crclMlMin < E.productHalveBelow;
  const rate = productHalved ? E.halvedUgKgMin : E.infusionUgKgMin;
  const brilakisRate = brilakisHalved ? E.halvedUgKgMin : E.infusionUgKgMin;
  return {
    drug: "eptifibatide",
    bolusPerKg: E.bolusUgKg,
    boluses: E.boluses,
    bolusGapMin: E.bolusGapMin,
    bolusTotal: Math.round(E.bolusUgKg * p.weightKg),
    rate,
    rateUnit: "µg/kg/min",
    renalReduced: productHalved,
    ...(brilakisRate !== rate ? { brilakisRate } : {}),
    blocked: p.dialysis ? { reason: "Eptifibatide is contraindicated in a patient dependent on dialysis.", source: E.sources.product } : null,
    sources: [E.sources.dose, E.sources.renal, E.sources.product],
    notes: [
      `Brilakis halves the infusion at a creatinine clearance of ${E.brilakisHalveAtOrBelow} mL/min or less; the product information halves it below ${E.productHalveBelow} mL/min. The lesson says to follow the product information.`,
    ],
  };
}

/** The tirofiban regimen (halved at a creatinine clearance of 60 mL/min or less). */
export function tirofibanRegimen(p: RenalFacts): IvRegimen {
  const T = TIROFIBAN;
  const halved = !!p.dialysis || p.crclMlMin <= T.halveAtOrBelow;
  return {
    drug: "tirofiban",
    bolusPerKg: T.bolusUgKg,
    boluses: 1,
    bolusOverMin: T.bolusOverMin,
    bolusTotal: Math.round(T.bolusUgKg * p.weightKg),
    rate: halved ? T.halvedUgKgMin : T.infusionUgKgMin,
    rateUnit: "µg/kg/min",
    renalReduced: halved,
    blocked: null,
    sources: [T.sources.dose, T.sources.renal],
    notes: [],
  };
}

/** The cangrelor regimen (no renal adjustment). */
export function cangrelorRegimen(p: RenalFacts): IvRegimen {
  const C = CANGRELOR;
  return {
    drug: "cangrelor",
    bolusPerKg: C.bolusUgKg,
    boluses: 1,
    bolusTotal: Math.round(C.bolusUgKg * p.weightKg),
    rate: C.infusionUgKgMin,
    rateUnit: "µg/kg/min",
    renalReduced: false,
    blocked: null,
    sources: [C.sources.dose, C.sources.oral],
    notes: [
      `Run for at least ${C.minHours} hours or the length of the procedure, whichever is longer.`,
      "Ticagrelor may be loaded at any time; clopidogrel or prasugrel immediately after the infusion stops.",
    ],
  };
}

/** The bivalirudin regimen for the kidneys (bolus unchanged). */
export function bivalirudinRegimen(p: RenalFacts): IvRegimen {
  const B = BIVALIRUDIN;
  const rate = p.dialysis ? B.dialysisMgKgH : p.crclMlMin < B.lowCrclBelow ? B.lowCrclMgKgH : B.infusionMgKgH;
  return {
    drug: "bivalirudin",
    bolusPerKg: B.bolusMgKg,
    boluses: 1,
    bolusTotal: Math.round(B.bolusMgKg * p.weightKg * 10) / 10,
    rate,
    rateUnit: "mg/kg/h",
    renalReduced: rate !== B.infusionMgKgH,
    blocked: null,
    sources: [B.sources.bolus, B.sources.infusion, B.sources.lowCrcl, B.sources.dialysis, B.sources.act, B.sources.noAntidote],
    notes: [
      `Half-life ${B.halfLifeMin} minutes; no antidote: stop the infusion and treat the bleeding site.`,
      `The run-on of up to ${B.runOnMaxH} hours after the case is given only at the normal-renal-function rate.`,
    ],
  };
}

/** The regimen for an IV agent by id. */
export function ivRegimen(drug: IvAntiplatelet | "bivalirudin", p: RenalFacts): IvRegimen {
  if (drug === "eptifibatide") return eptifibatideRegimen(p);
  if (drug === "tirofiban") return tirofibanRegimen(p);
  if (drug === "cangrelor") return cangrelorRegimen(p);
  return bivalirudinRegimen(p);
}

/** Whether an ordered infusion rate is the regimen's for this patient (within 5%, MODEL PARAMETER tolerance). */
export const MP_RATE_TOLERANCE = 0.05;
export function rateMatches(reg: Pick<IvRegimen, "rate">, ordered: number): boolean {
  return Math.abs(ordered - reg.rate) <= reg.rate * MP_RATE_TOLERANCE + 1e-9;
}

// ---------------------------------------------------------------------------
// Oral loading (lesson pm-antithrombotics-oral)
// ---------------------------------------------------------------------------

export type OralAntiplatelet = "aspirin" | "clopidogrel" | "prasugrel" | "ticagrelor";

export const ORAL_LOADS: Readonly<Record<OralAntiplatelet, { loadMg: number; text: string; source: DoseSource }>> = {
  aspirin: { loadMg: 325, text: "325 mg load, then 81-100 mg daily", source: src("Brilakis", "3.5", 709) },
  clopidogrel: { loadMg: 600, text: "600 mg load, ideally at least 6 hours before PCI in stable patients, then 75 mg daily", source: src("Brilakis", "3.5", 716) },
  prasugrel: { loadMg: 60, text: "60 mg load, then 10 mg daily; 5 mg daily if under 60 kg or over 75 years", source: src("Brilakis", "3.5", 723) },
  ticagrelor: { loadMg: 180, text: "180 mg load, then 90 mg twice daily", source: src("Brilakis", "3.5", 730) },
};

/** Clopidogrel and prasugrel cannot bind while cangrelor runs (Brilakis 3.5, 03-antithrombotics.ts:1124). */
export function oralDuringCangrelorProblem(drug: OralAntiplatelet, cangrelorRunning: boolean): string | null {
  if (!cangrelorRunning || (drug !== "clopidogrel" && drug !== "prasugrel")) return null;
  return "Cangrelor stops clopidogrel and prasugrel binding: load them immediately after the infusion stops (ticagrelor may be given at any time).";
}

// ---------------------------------------------------------------------------
// Suspected HIT (lesson pm-antithrombotics-alternatives)
// ---------------------------------------------------------------------------

export const HIT_RULES = {
  /** every heparin source stops, including heparinised flushes, the pressure-line flush and the radial cocktail */
  allHeparin: src("Brilakis and Oxford", "3.4; chs 3, 4", 417),
  /** the 4Ts pretest probability before testing or treating (ASH 2018) */
  fourTs: src("Brilakis", "3.4 with ASH 2018", 412),
  /** type 2 HIT: a fall several days into heparin treatment */
  timing: src("Brilakis", "3.4", 407),
} as const;
