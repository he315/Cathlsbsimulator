// ---------------------------------------------------------------------------
// Pharmacology for the cath lab: what the operator gives, how much is in the
// patient now, and what it does.
//
// PK: one compartment per dose route with first-order elimination, plus an
// effect site that lags the plasma level (time constant tauE). Intracoronary
// adenosine has its own local compartment per coronary side. Oral and crushed
// doses pass through a gut compartment first (absorption time constant from
// ORAL_ONSET); infusions are a plasma amount with first-order elimination.
//
// Sourced values (docs/realism/facts/S9.md):
// - Heparin: volume of distribution 0.07 L/kg; protamine 1 mg neutralises
//   about 100 USP units (FDA heparin label). ACT target ranges for PCI (2011
//   ACCF/AHA/SCAI table reproduced in ASEAN Heart J 2014). ACT slope calibrated
//   to a mean ACT of 319.8 s 10 min after 100 U/kg (J Cardiovasc Thorac Res
//   2014, Hemochron). Dose-dependent half-life: about 30 min after 25 U/kg,
//   60 min after 100 U/kg and 150 min after 400 U/kg (Brilakis, lesson
//   pm-antithrombotics, src/content/manual/pci-manual/03-antithrombotics.ts:72).
// - Adenosine: IC 160-200 µg left, 60-100 µg right; IV 140 µg/kg/min; time to
//   maximal hyperaemia ~15 s IC and 80 s (femoral vein) / 112 s (peripheral
//   vein) IV; plateau 21 s (200 µg left) and 12 s (100 µg right); transient
//   complete AV block 11.6% IC and 4.4% IV (REC Interv Cardiol 2024 table).
// - The formulary added by found-patient-formulary: every dose the manuals
//   state is listed in FORMULARY_REFERENCE with its file and line in the module
//   text; the PDE-5 windows, the IMPRESSION opioid figures, the GP IIb/IIIa and
//   bivalirudin half-lives and the anaphylaxis doses are sourced the same way.
// Everything else (half-lives, effect-site lags, Emax and ED50 values, onset
// curves, interaction gains) is a MODEL PARAMETER chosen to give the right
// direction, onset and duration of each effect for teaching. They are named
// MP_* below or marked MODEL in a comment, and listed in docs/realism/facts/S9.md.
// ---------------------------------------------------------------------------

export type DrugId =
  | "heparin"
  | "protamine"
  | "gtn"
  | "adenosine"
  | "verapamil"
  | "atropine"
  | "metaraminol"
  | "phenylephrine"
  | "noradrenaline"
  | "adrenaline"
  | "midazolam"
  | "fentanyl"
  | "chlorphenamine"
  | "hydrocortisone"
  // sedation and its reversal
  | "flumazenil"
  | "naloxone"
  | "diazepam"
  | "propofol"
  // pressors, inotropes and chronotropes
  | "dobutamine"
  | "dopamine"
  | "vasopressin"
  | "isoprenaline"
  // pulmonary oedema and bronchospasm
  | "furosemide"
  | "salbutamol"
  // antiarrhythmics and adenosine antagonism
  | "amiodarone"
  | "lidocaine"
  | "metoprolol"
  | "flecainide"
  | "aminophylline"
  // microvascular vasodilators
  | "nicardipine"
  | "nitroprusside"
  // IV antiplatelet agents and bivalirudin
  | "eptifibatide"
  | "tirofiban"
  | "cangrelor"
  | "bivalirudin"
  // DOAC reversal
  | "idarucizumab"
  | "andexanet"
  | "pcc"
  // oral antiplatelet agents
  | "aspirin"
  | "clopidogrel"
  | "prasugrel"
  | "ticagrelor";

/** iv, intracoronary, intra-arterial, intramuscular, nebulised, oral (swallowed whole) and crushed (oral, crushed or chewed). */
export type Route = "iv" | "ic" | "ia" | "im" | "neb" | "oral" | "crushed";

export interface DoseOrder {
  drug: DrugId;
  /** amount in the drug's unit (DRUGS[drug].unit) */
  dose: number;
  route: Route;
  /** coronary side for intracoronary doses */
  side?: "left" | "right";
  /** given during a cardiac arrest (IV adrenaline: left out of the high-dose term once a pulse returns) */
  arrest?: boolean;
}

/** Drugs that run as an infusion (rate units in INFUSIONS). */
export type InfusionDrug =
  | "adenosine"
  | "noradrenaline"
  | "heparin"
  | "phenylephrine"
  | "adrenaline"
  | "dobutamine"
  | "dopamine"
  | "vasopressin"
  | "isoprenaline"
  | "gtn"
  | "amiodarone"
  | "cangrelor"
  | "eptifibatide"
  | "tirofiban"
  | "bivalirudin";

export interface InfusionOrder {
  drug: InfusionDrug;
  /** rate in INFUSIONS[drug].unit (adenosine µg/kg/min, noradrenaline µg/min, heparin U/h, …) */
  rate: number;
  /** venous access for adenosine timing */
  site?: "central" | "peripheral";
  /**
   * Fraction of the infusion that reaches the circulation, 0..1 (default 1). An infiltrated
   * ("tissued") cannula delivers little of it (physiology-hyperaemia-and-adenosine; lesson
   * pm-physiology-indices, 14-physiology.ts:460: an IV line that is not working, through infiltration,
   * is one of Brilakis's causes of failed hyperaemia). The caller sets the fraction (a MODEL PARAMETER).
   */
  delivered?: number;
}

export interface DrugSpec {
  label: string;
  unit: "U" | "µg" | "mg";
  routes: Route[];
  /** plasma half-life, s (for antiplatelet agents: the half-life of the effect) */
  halfLifeS: number;
  /** effect-site equilibration time constant, s */
  tauE: number;
  /** false: given only as an infusion (startInfusion), never as a bolus */
  bolus?: boolean;
}

// MODEL PARAMETERS unless stated (half-lives and effect-site lags; see docs/realism/facts/S9.md)
export const DRUGS: Record<DrugId, DrugSpec> = {
  heparin: { label: "Unfractionated heparin", unit: "U", routes: ["iv", "ia"], halfLifeS: 3600, tauE: 20 }, // half-life recomputed from level (heparinHalfLifeS)
  protamine: { label: "Protamine", unit: "mg", routes: ["iv"], halfLifeS: 600, tauE: 30 },
  gtn: { label: "Glyceryl trinitrate", unit: "µg", routes: ["ic", "iv", "ia"], halfLifeS: 180, tauE: 15 },
  adenosine: { label: "Adenosine", unit: "µg", routes: ["ic", "iv"], halfLifeS: 10, tauE: 3 },
  verapamil: { label: "Verapamil", unit: "mg", routes: ["ia", "iv", "ic"], halfLifeS: 4 * 3600, tauE: 60 },
  atropine: { label: "Atropine", unit: "mg", routes: ["iv", "im"], halfLifeS: 2.5 * 3600, tauE: 40 },
  metaraminol: { label: "Metaraminol", unit: "mg", routes: ["iv"], halfLifeS: 20 * 60, tauE: 45 },
  phenylephrine: { label: "Phenylephrine", unit: "µg", routes: ["iv"], halfLifeS: 5 * 60, tauE: 30 },
  noradrenaline: { label: "Noradrenaline", unit: "µg", routes: ["iv"], halfLifeS: 150, tauE: 30 },
  adrenaline: { label: "Adrenaline", unit: "µg", routes: ["iv", "im"], halfLifeS: 150, tauE: 15 },
  midazolam: { label: "Midazolam", unit: "mg", routes: ["iv"], halfLifeS: 2 * 3600, tauE: 120 },
  fentanyl: { label: "Fentanyl", unit: "µg", routes: ["iv"], halfLifeS: 45 * 60, tauE: 150 }, // effective (redistribution) half-life
  chlorphenamine: { label: "Chlorphenamine", unit: "mg", routes: ["iv", "im"], halfLifeS: 12 * 3600, tauE: 180 },
  hydrocortisone: { label: "Hydrocortisone", unit: "mg", routes: ["iv"], halfLifeS: 1.5 * 3600, tauE: 3600 },
  // flumazenil: shorter than midazolam, so sedation can return within 1-2 h (Hoffman 1993, lesson pm-lab-drugs-sedation)
  flumazenil: { label: "Flumazenil", unit: "mg", routes: ["iv"], halfLifeS: 50 * 60, tauE: 30 },
  naloxone: { label: "Naloxone", unit: "mg", routes: ["iv", "im"], halfLifeS: 60 * 60, tauE: 45 },
  diazepam: { label: "Diazepam", unit: "mg", routes: ["iv"], halfLifeS: 8 * 3600, tauE: 120 },
  propofol: { label: "Propofol", unit: "mg", routes: ["iv"], halfLifeS: 6 * 60, tauE: 40 },
  dobutamine: { label: "Dobutamine", unit: "µg", routes: ["iv"], halfLifeS: 2 * 60, tauE: 30, bolus: false },
  dopamine: { label: "Dopamine", unit: "µg", routes: ["iv"], halfLifeS: 2 * 60, tauE: 30, bolus: false },
  vasopressin: { label: "Vasopressin", unit: "U", routes: ["iv"], halfLifeS: 15 * 60, tauE: 60, bolus: false },
  isoprenaline: { label: "Isoprenaline", unit: "µg", routes: ["iv"], halfLifeS: 2 * 60, tauE: 20 },
  furosemide: { label: "Furosemide", unit: "mg", routes: ["iv"], halfLifeS: 90 * 60, tauE: 1200 },
  salbutamol: { label: "Salbutamol", unit: "mg", routes: ["neb"], halfLifeS: 4 * 3600, tauE: 120 },
  amiodarone: { label: "Amiodarone", unit: "mg", routes: ["iv"], halfLifeS: 4 * 3600, tauE: 300 },
  lidocaine: { label: "Lidocaine", unit: "mg", routes: ["iv"], halfLifeS: 90 * 60, tauE: 60 },
  metoprolol: { label: "Metoprolol", unit: "mg", routes: ["iv"], halfLifeS: 4 * 3600, tauE: 120 },
  flecainide: { label: "Flecainide", unit: "mg", routes: ["iv"], halfLifeS: 12 * 3600, tauE: 300 },
  aminophylline: { label: "Aminophylline", unit: "mg", routes: ["iv", "ic"], halfLifeS: 8 * 3600, tauE: 120 },
  nicardipine: { label: "Nicardipine", unit: "µg", routes: ["ic", "ia"], halfLifeS: 10 * 60, tauE: 20 },
  nitroprusside: { label: "Nitroprusside", unit: "µg", routes: ["ic", "iv"], halfLifeS: 2 * 60, tauE: 15 },
  // GP IIb/IIIa inhibitors: plasma half-life about 2 h with the effect following it (Schrör 2003, lesson pm-antithrombotics-iv-antiplatelet)
  eptifibatide: { label: "Eptifibatide", unit: "µg", routes: ["iv"], halfLifeS: 2 * 3600, tauE: 20 },
  tirofiban: { label: "Tirofiban", unit: "µg", routes: ["iv"], halfLifeS: 2 * 3600, tauE: 20 },
  // cangrelor: "short half-life" in the module (value not stated): MODEL 5 min
  cangrelor: { label: "Cangrelor", unit: "µg", routes: ["iv"], halfLifeS: 5 * 60, tauE: 20 },
  // bivalirudin: half-life 25 minutes (Brilakis, 03-antithrombotics.ts:475)
  bivalirudin: { label: "Bivalirudin", unit: "mg", routes: ["iv"], halfLifeS: 25 * 60, tauE: 10 },
  idarucizumab: { label: "Idarucizumab", unit: "mg", routes: ["iv"], halfLifeS: 10 * 3600, tauE: 30 },
  andexanet: { label: "Andexanet alfa", unit: "mg", routes: ["iv"], halfLifeS: 2 * 3600, tauE: 30 },
  pcc: { label: "Prothrombin complex concentrate", unit: "U", routes: ["iv"], halfLifeS: 12 * 3600, tauE: 60 },
  // oral antiplatelets: halfLifeS is the offset of the platelet effect (irreversible agents last the platelet lifespan)
  aspirin: { label: "Aspirin", unit: "mg", routes: ["oral", "crushed"], halfLifeS: 4 * 24 * 3600, tauE: 300 },
  clopidogrel: { label: "Clopidogrel", unit: "mg", routes: ["oral", "crushed"], halfLifeS: 4 * 24 * 3600, tauE: 600 },
  prasugrel: { label: "Prasugrel", unit: "mg", routes: ["oral", "crushed"], halfLifeS: 4 * 24 * 3600, tauE: 300 },
  ticagrelor: { label: "Ticagrelor", unit: "mg", routes: ["oral", "crushed"], halfLifeS: 12 * 3600, tauE: 300 },
};

/** Rate units of each infusion; the rate converts to an amount per second with the weight when perKg. */
export const INFUSIONS: Record<InfusionDrug, { unit: string; perKg: boolean; perHour: boolean }> = {
  adenosine: { unit: "µg/kg/min", perKg: true, perHour: false },
  noradrenaline: { unit: "µg/min", perKg: false, perHour: false },
  heparin: { unit: "U/h", perKg: false, perHour: true },
  phenylephrine: { unit: "µg/kg/min", perKg: true, perHour: false },
  adrenaline: { unit: "µg/min", perKg: false, perHour: false },
  dobutamine: { unit: "µg/kg/min", perKg: true, perHour: false },
  dopamine: { unit: "µg/kg/min", perKg: true, perHour: false },
  vasopressin: { unit: "U/min", perKg: false, perHour: false },
  isoprenaline: { unit: "µg/min", perKg: false, perHour: false },
  gtn: { unit: "µg/min", perKg: false, perHour: false },
  amiodarone: { unit: "mg/min", perKg: false, perHour: false },
  cangrelor: { unit: "µg/kg/min", perKg: true, perHour: false },
  eptifibatide: { unit: "µg/kg/min", perKg: true, perHour: false },
  tirofiban: { unit: "µg/kg/min", perKg: true, perHour: false },
  bivalirudin: { unit: "mg/kg/h", perKg: true, perHour: true },
};

// --- sourced heparin constants ---
/** heparin volume of distribution, L/kg (FDA label) */
export const HEPARIN_VD_L_PER_KG = 0.07;
/** USP units neutralised by 1 mg protamine (FDA heparin label) */
export const PROTAMINE_U_PER_MG = 100;
/** ACT targets for UFH-supported PCI, s (2011 ACCF/AHA/SCAI) */
export const ACT_TARGET = { noGpi: { hemotec: [250, 300], hemochron: [300, 350] }, withGpi: [200, 250] } as const;
/**
 * ACT rise per U/mL plasma heparin (MODEL PARAMETER calibrated so 100 U/kg gives a mean ACT of
 * about 320 s at 10 min with a 120 s baseline: J Cardiovasc Thorac Res 2014 reported 319.8 s).
 */
export const MP_ACT_SLOPE_S_PER_U_ML = 160;

/**
 * Heparin bolus half-lives stated in the module text (Brilakis, lesson pm-antithrombotics,
 * src/content/manual/pci-manual/03-antithrombotics.ts:72): "roughly 30 minutes after a 25 units/kg
 * bolus, 60 minutes after 100 units/kg and 150 minutes after 400 units/kg".
 */
export const HEPARIN_BOLUS_HALF_LIFE_MIN = [
  { uPerKg: 25, min: 30 },
  { uPerKg: 100, min: 60 },
  { uPerKg: 400, min: 150 },
] as const;

/**
 * Heparin half-life as a function of the plasma level: h(c) = a + b·c/(c + K) minutes (MODEL
 * PARAMETERS a, b, K fitted so that the time for the level to halve after each bolus of
 * HEPARIN_BOLUS_HALF_LIFE_MIN reproduces the stated half-life: 30, 60 and 150 min).
 */
export const MP_HEPARIN_HALF_LIFE = { aMin: 19, bMin: 512, kUmL: 11.8 };

// --- sourced adenosine constants ---
export const ADENOSINE = {
  icStandardUg: { left: [160, 200], right: [60, 100] },
  ivStandardUgKgMin: 140,
  timeToMaxIcS: 15,
  plateauIcS: { left: 21, right: 12 },
  timeToMaxIvS: { central: 80, peripheral: 112 },
  completeAvBlock: { ic: 0.116, iv: 0.044 },
} as const;

/** Heparin plasma half-life (s) for a plasma level (U/mL): saturable clearance lengthens it at higher levels. */
export function heparinHalfLifeS(cUmL: number): number {
  const m = MP_HEPARIN_HALF_LIFE;
  const c = Math.max(0, cUmL);
  return 60 * (m.aMin + (m.bMin * c) / (c + m.kUmL));
}

// --- interactions, windows and onset curves --------------------------------------

export type Pde5Agent = "sildenafil" | "vardenafil" | "avanafil" | "tadalafil";
export type DoacAgent = "dabigatran" | "apixaban" | "rivaroxaban" | "edoxaban";

/**
 * PDE-5 inhibitor windows within which a nitrate is not given, h (Brilakis 3.2, lesson
 * pm-lab-drugs-nitrates, src/content/manual/pci-manual/04-lab-drugs.ts:310: "avanafil, sildenafil
 * or vardenafil within 24 hours, tadalafil within 48 hours").
 */
export const PDE5_WINDOW_H: Record<Pde5Agent, number> = { sildenafil: 24, vardenafil: 24, avanafil: 24, tadalafil: 48 };

/**
 * Opioids and oral P2Y12 absorption (IMPRESSION, lesson pm-lab-drugs-sedation,
 * 04-lab-drugs.ts:154): morphine before a ticagrelor load cut total exposure by 36% and delayed
 * the peak from 2 to 4 hours. Applied to any opioid on board and to every oral P2Y12 inhibitor
 * (a MODEL extension of a ticagrelor and morphine trial).
 */
export const OPIOID_P2Y12 = { exposure: 0.64, peakDelay: 2 } as const;

/**
 * Time from an oral dose to its peak effect, s, per route. Ticagrelor swallowed whole: the
 * 2-hour peak plasma concentration of IMPRESSION (04-lab-drugs.ts:154). Clopidogrel: Brilakis's
 * "ideally at least 6 hours before PCI" for the 600 mg load (03-antithrombotics.ts:716), used as
 * its onset. Every other value, and every crushed value, is a MODEL PARAMETER (crushed faster).
 */
export const ORAL_ONSET_S: Record<"aspirin" | "clopidogrel" | "prasugrel" | "ticagrelor", { oral: number; crushed: number }> = {
  aspirin: { oral: 60 * 60, crushed: 30 * 60 },
  clopidogrel: { oral: 6 * 3600, crushed: 4 * 3600 },
  prasugrel: { oral: 2 * 3600, crushed: 1 * 3600 },
  ticagrelor: { oral: 2 * 3600, crushed: 1 * 3600 },
};

/** Patient facts the interaction table reads (set by the engine from the profile and the rhythm). */
export interface PharmaContext {
  pde5?: { agent: Pde5Agent; hoursAgo: number };
  /** corrected QT, s */
  qtcS?: number;
  /** a known accessory pathway (pre-excitation) */
  preExcitation?: boolean;
  /** atrial fibrillation now */
  af?: boolean;
  /** AV block degree now */
  avBlock?: 0 | 1 | 2 | 3;
  /** a pacemaker (or a temporary wire) is in */
  paced?: boolean;
  /** LV ejection fraction, % */
  lvef?: number;
  /** obstructive hypertrophic cardiomyopathy */
  hocm?: boolean;
  /**
   * Recent caffeine: it stops adenosine binding to its receptor, one of Brilakis's causes of failed
   * hyperaemia (lesson pm-physiology-when, 14-physiology.ts:98). Every adenosine effect is scaled by
   * MP_CAFFEINE_ADENOSINE (physiology-hyperaemia-and-adenosine). Absent: no caffeine.
   */
  caffeine?: boolean;
}

export type InteractionId =
  | "pde5-nitrate"
  | "nitrate-infusion-blunts-bolus"
  | "opioid-delays-p2y12"
  | "long-qt-antiarrhythmic"
  | "pre-excitation-antiarrhythmic"
  | "high-grade-block-av-nodal"
  | "poor-lv-negative-inotrope"
  | "hocm-inotrope"
  | "hocm-nitrate";

export interface Interaction {
  id: InteractionId;
  drugs: DrugId[];
  /** what the interaction does in the engine */
  effect: string;
  /** module text location, or MODEL PARAMETER */
  source: string;
}

/**
 * The interaction table. Where a gain is applied, it is a MODEL PARAMETER (MP_INTERACTION); the
 * existence and direction of each interaction is from the module text.
 */
export const INTERACTIONS: Interaction[] = [
  {
    id: "pde5-nitrate",
    drugs: ["gtn", "nitroprusside"],
    effect: "Within the PDE-5 window, nitrate venodilation and arteriolar dilation are multiplied by MP_INTERACTION.pde5NitrateGain.",
    source: "Brilakis 3.2, 04-lab-drugs.ts:310 (nitroprusside: MODEL extension)",
  },
  {
    id: "nitrate-infusion-blunts-bolus",
    drugs: ["gtn"],
    effect: "A running IV nitrate infusion blunts the response to a nitrate bolus by up to MP_INTERACTION.nitrateToleranceMax.",
    source: "Oxford, 04-lab-drugs.ts:261",
  },
  {
    id: "opioid-delays-p2y12",
    drugs: ["clopidogrel", "prasugrel", "ticagrelor"],
    effect: "An opioid on board at the time of an oral load slows absorption (peak delayed twofold) and lowers exposure to 64%.",
    source: "IMPRESSION, 04-lab-drugs.ts:154",
  },
  {
    id: "long-qt-antiarrhythmic",
    drugs: ["amiodarone"],
    effect: "Flagged; with a QTc at or above MP_INTERACTION.longQtcS, a chance MP_INTERACTION.proarrhythmiaP of VF (torsades or VF).",
    source: "Antiarrhythmics table, 04-lab-drugs.ts:799",
  },
  {
    id: "pre-excitation-antiarrhythmic",
    drugs: ["amiodarone"],
    effect: "Flagged; with pre-excitation and atrial fibrillation, a chance MP_INTERACTION.proarrhythmiaP of VF.",
    source: "Antiarrhythmics table, 04-lab-drugs.ts:799",
  },
  {
    id: "high-grade-block-av-nodal",
    drugs: ["amiodarone", "verapamil"],
    effect: "Flagged when second- or third-degree block is present without pacing.",
    source: "Amiodarone, 04-lab-drugs.ts:798; verapamil 'beware heart block', 04-lab-drugs.ts:430",
  },
  {
    id: "poor-lv-negative-inotrope",
    drugs: ["verapamil", "flecainide"],
    effect: "Flagged when the LVEF is below MP_INTERACTION.poorLvefPct.",
    source: "Oxford: verapamil not with impaired LV function, flecainide only without structural heart disease, 04-lab-drugs.ts:856-857",
  },
  {
    id: "hocm-inotrope",
    drugs: ["dobutamine", "dopamine", "adrenaline", "isoprenaline"],
    effect: "Inotropy worsens the dynamic LVOT obstruction in the engine (MP_LVOT), so the pressure can fall.",
    source: "Pressors table, 04-lab-drugs.ts:650 and 675",
  },
  {
    id: "hocm-nitrate",
    drugs: ["gtn", "nitroprusside"],
    effect: "Lower preload and afterload worsen the dynamic LVOT obstruction in the engine (MP_LVOT).",
    source: "04-lab-drugs.ts:311",
  },
];

/** Interaction gains and limits (MODEL PARAMETERS unless the comment names a source). */
export const MP_INTERACTION = {
  /** nitrate systemic vasodilation multiplier within the PDE-5 window */
  pde5NitrateGain: 2.5,
  /** largest fraction of a nitrate bolus response lost during a nitrate infusion */
  nitrateToleranceMax: 0.6,
  /** nitrate infusion plasma amount (µg) at which half that blunting applies */
  nitrateToleranceUg: 100,
  /** QTc taken as prolonged for the amiodarone caution, s (the module gives no number) */
  longQtcS: 0.47,
  /** LVEF taken as poor, % (the module gives no number) */
  poorLvefPct: 40,
  /** chance of VF when amiodarone is given with a long QT or pre-excited AF */
  proarrhythmiaP: 0.25,
};

export interface InteractionFlag {
  id: InteractionId;
  drug: DrugId;
  text: string;
}

/** The interaction flags raised by giving a drug in this context (no effect on the drug itself). */
export function interactionFlags(drug: DrugId, ctx: PharmaContext, opts: { elapsedS?: number; opioidOnBoard?: boolean; nitrateInfusion?: boolean } = {}): InteractionFlag[] {
  const out: InteractionFlag[] = [];
  const add = (id: InteractionId, text: string) => {
    if (INTERACTIONS.find((x) => x.id === id)?.drugs.includes(drug)) out.push({ id, drug, text });
  };
  if (pde5Active(ctx, opts.elapsedS ?? 0)) add("pde5-nitrate", `A PDE-5 inhibitor (${ctx.pde5!.agent}) was taken within its window.`);
  if (opts.nitrateInfusion) add("nitrate-infusion-blunts-bolus", "An IV nitrate infusion is running; the bolus response is blunted.");
  if (opts.opioidOnBoard) add("opioid-delays-p2y12", "An opioid is on board: oral P2Y12 absorption is delayed.");
  if (ctx.qtcS !== undefined && ctx.qtcS >= MP_INTERACTION.longQtcS) add("long-qt-antiarrhythmic", "Prolonged QT.");
  if (ctx.preExcitation && ctx.af) add("pre-excitation-antiarrhythmic", "Pre-excited atrial fibrillation.");
  if ((ctx.avBlock ?? 0) >= 2 && !ctx.paced) add("high-grade-block-av-nodal", "Second- or third-degree AV block without pacing.");
  if (ctx.lvef !== undefined && ctx.lvef < MP_INTERACTION.poorLvefPct) add("poor-lv-negative-inotrope", "Impaired LV function.");
  if (ctx.hocm) {
    add("hocm-inotrope", "Obstructive hypertrophic cardiomyopathy: inotropy worsens the obstruction.");
    add("hocm-nitrate", "Obstructive hypertrophic cardiomyopathy: lower preload worsens the obstruction.");
  }
  return out;
}

/** A PDE-5 inhibitor is within its window `elapsedS` after the context was set. */
export function pde5Active(ctx: PharmaContext, elapsedS: number): boolean {
  if (!ctx.pde5) return false;
  return ctx.pde5.hoursAgo + elapsedS / 3600 < PDE5_WINDOW_H[ctx.pde5.agent];
}

// --- state -------------------------------------------------------------------------

interface Bolus {
  drug: DrugId;
  route: Route;
  side?: "left" | "right";
  /** given during a cardiac arrest */
  arrest?: boolean;
  /** amount remaining in its compartment */
  a: number;
  /** effect-site amount (same units) */
  e: number;
  /** time since given, s */
  age: number;
  /** oral and crushed doses: amount still in the gut */
  g?: number;
  /** absorption time constant, s (oral and crushed) */
  tauAbs?: number;
  /** fraction of the gut amount that reaches the circulation (opioid interaction) */
  fAbs?: number;
}

interface Infusion extends InfusionOrder {
  /** effect level 0..1 of the target effect (adenosine) or amount in plasma (drug unit; heparin U) */
  level: number;
  on: boolean;
}

export interface PharmaState {
  boluses: Bolus[];
  infusions: Infusion[];
  /** heparin in plasma, U */
  heparinU: number;
  /** protamine still able to bind, mg */
  protamineMg: number;
  /** cumulative doses given, for the record */
  totals: Partial<Record<DrugId, number>>;
  /** seconds simulated since the engine started (PDE-5 window); optional for older snapshots */
  t?: number;
  /** a direct oral anticoagulant on board: agent and its anticoagulant effect 0..1 before reversal */
  doac?: { agent: DoacAgent; level: number };
}

export interface DrugEffects {
  /** additive heart-rate change, bpm */
  hrDelta: number;
  /** blocks vagal tone, 0..1 */
  vagolysis: number;
  /** AV nodal conduction slowing (PR prolongation, s) */
  prDelta: number;
  /** adenosine AV nodal block drive 0..1 (the engine draws a complete block with the sourced incidence) */
  avBlockDrive: number;
  /** systemic vascular resistance multiplier */
  svrMult: number;
  /** LV/RV contractility multiplier */
  inotropy: number;
  /** venodilation: stressed volume moved to the unstressed pool, mL */
  venodilationMl: number;
  /** epicardial vasodilation 0..1 (reverses spasm; nitrate) */
  epicardialDilation: number;
  /** coronary hyperaemia per side 0..1 */
  hyperaemia: { left: number; right: number };
  /** sedation 0 awake … 1 unrousable */
  sedation: number;
  /** analgesia 0..1 */
  analgesia: number;
  /** respiratory depression 0..1 */
  respDepression: number;
  /** antihistamine and steroid effect on allergic reactions 0..1 */
  antiAllergic: number;
  /** adrenergic rescue of anaphylaxis 0..1 */
  adrenergic: number;
  /** adenosine symptoms 0..1 (chest discomfort, dyspnoea, flushing) */
  adenosineSymptoms: number;
  /** plasma heparin, U/mL */
  heparinUmL: number;
  /** microvascular (resistance-vessel) dilation from an intracoronary agent 0..1 (no-reflow) */
  microvascularDilation: number;
  /** bronchodilation 0..1 (relieves the airway component of a reaction) */
  bronchodilation: number;
  /** antiarrhythmic effect 0..1 (lowers the ischaemic VF hazard) */
  antiarrhythmic: number;
  /** pro-arrhythmic drive 0..1 (IV adrenaline at arrest doses with a pulse) */
  proarrhythmia: number;
  /** urine output from a loop diuretic, mL/s (removed from the circulation) */
  diuresisMlS: number;
  /** platelet inhibition by aspirin, a P2Y12 inhibitor and a GP IIb/IIIa inhibitor, 0..1 each */
  aspirin: number;
  p2y12: number;
  gpi: number;
  /** combined antiplatelet effect 0..1 */
  antiplatelet: number;
  /** combined anticoagulant effect 0..1 (heparin, bivalirudin, a DOAC after any reversal) */
  anticoagulant: number;
  /** DOAC anticoagulant effect after reversal 0..1 */
  doacEffect: number;
  /** antithrombotic effect 0..1 (antiplatelet and anticoagulant together) */
  antithrombotic: number;
  /** multipliers (≤ 1) on the thrombus and stent-thrombosis hazards */
  thrombusHazardMult: number;
  stentThrombosisMult: number;
  /** ACT added by bivalirudin, s (before the patient's sensitivity) */
  bivalirudinActS: number;
}

/** Effect gains and ED50s of the formulary (MODEL PARAMETERS; units are the drug's own). */
export const MP_FORMULARY = {
  /** benzodiazepine potency: midazolam-equivalent mg per mg of diazepam (from the manuals' dose ranges, midazolam 0.5–2.5 mg against diazepam 2–10 mg, Oxford ch 1) */
  diazepamPerMidazolam: 4,
  /** competitive reversal: effective amount = amount / (1 + antagonist / Ki), mg */
  flumazenilKiMg: 0.08,
  naloxoneKiMg: 0.06,
  propofolSedationEd50Mg: 40,
  propofolRespEd50Mg: 80,
  /** dobutamine (µg/kg/min): inotropy, chronotropy, β2 vasodilation */
  dobutamineIno: 0.6,
  dobutamineInoEd50: 7,
  dobutamineHr: 20,
  dobutamineHrEd50: 10,
  dobutamineSvr: 0.12,
  /** dopamine (µg/kg/min): inotropic and chronotropic at 5–10, vasopressor above 10 (pressors table, 04-lab-drugs.ts:653) */
  dopamineIno: 0.4,
  dopamineInoEd50: 5,
  dopamineHr: 25,
  dopamineHrEd50: 7,
  dopamineSvr: 0.6,
  dopamineSvrEd50: 14,
  /** vasopressin (U/min): pure vasoconstriction, half-maximal at the 0.03 U/min starting rate (04-lab-drugs.ts:652) */
  vasopressinSvr: 0.7,
  vasopressinEd50: 0.03,
  /** isoprenaline (µg in the body): sinus rate, little AV conduction (rarely improves AV conduction, 04-lab-drugs.ts:886) */
  isoprenalineHr: 40,
  isoprenalineEd50Ug: 10,
  /** furosemide (mg): early venodilation, later diuresis (mL/s) */
  furosemideVenoMl: 80,
  furosemideEd50Mg: 40,
  furosemideDiuresisMlS: 0.25,
  /** salbutamol (mg, nebulised): bronchodilation */
  salbutamolEd50Mg: 2.5,
  /** antiarrhythmic ED50s, mg */
  amiodaroneEd50Mg: 150,
  lidocaineEd50Mg: 50,
  metoprololEd50Mg: 5,
  flecainideEd50Mg: 100,
  /** aminophylline (mg) at which adenosine effects are halved */
  aminophyllineHalfMg: 100,
  /** fraction of an intracoronary microvascular vasodilator dose that acts systemically */
  icSystemicFraction: 0.35,
  nitroprussideSvr: 0.35,
  nitroprussideEd50Ug: 150,
  nicardipineSvr: 0.1,
  nicardipineEd50Ug: 300,
  microvascularEd50Ug: 100,
  /** IV adrenaline at arrest doses (µg) with a pulse: severe hypertension and VT drive */
  adrenalineHighEd50Ug: 400,
  adrenalineHighSvr: 1.5,
  /** antiplatelet ED50s: aspirin, clopidogrel, prasugrel, ticagrelor (mg in the effect pool); cangrelor, eptifibatide, tirofiban (µg/kg) */
  aspirinEd50Mg: 40,
  clopidogrelEd50Mg: 250,
  prasugrelEd50Mg: 12,
  ticagrelorEd50Mg: 40,
  cangrelorEd50UgKg: 8,
  eptifibatideEd50UgKg: 60,
  tirofibanEd50UgKg: 8,
  /** heparin anticoagulant effect half-maximal at this plasma level, U/mL; bivalirudin at this amount, mg/kg */
  heparinEffectUmL: 0.5,
  bivalirudinEffectMgKg: 0.5,
  /**
   * ACT rise per mg/kg of bivalirudin in the body, s: calibrated so the sourced regimen (0.75 mg/kg
   * then 1.75 mg/kg/h, 03-antithrombotics.ts:315-316) reaches the goal it shares with heparin
   * (300–350 s, 03-antithrombotics.ts:476) with a 120 s baseline.
   */
  bivalirudinActSPerMgKg: 190,
  /** DOAC reversal: idarucizumab mg for full dabigatran reversal (the 5 g dose, 05-patient-complications.ts:980); andexanet and PCC half-maximal amounts and PCC's ceiling */
  idarucizumabFullMg: 5000,
  andexanetEd50Mg: 400,
  pccEd50U: 1500,
  pccMaxReversal: 0.6,
  /** DOAC effect half-life, s */
  doacHalfLifeS: 12 * 3600,
  /** hazard reductions at full effect: thrombus (antiplatelet, anticoagulant), stent thrombosis */
  thrombusAp: 0.6,
  thrombusAc: 0.5,
  stentAp: 0.8,
  stentAc: 0.3,
  /** an opioid counts as on board for the P2Y12 interaction above this analgesia */
  opioidOnBoardAnalgesia: 0.2,
};

const hill = (x: number, ed50: number, n = 1) => (x <= 0 ? 0 : Math.pow(x, n) / (Math.pow(x, n) + Math.pow(ed50, n)));

const ORAL_DRUGS = new Set<DrugId>(["aspirin", "clopidogrel", "prasugrel", "ticagrelor"]);
const P2Y12_ORAL = new Set<DrugId>(["clopidogrel", "prasugrel", "ticagrelor"]);

const DRUG_IDS = Object.keys(DRUGS) as DrugId[];

export class Pharmacology {
  st: PharmaState = { boluses: [], infusions: [], heparinU: 0, protamineMg: 0, totals: {}, t: 0 };
  ctx: PharmaContext = {};
  /** effects() scratch: per-drug effect-site totals and route slots, reused on every call */
  private readonly tot = {} as Record<DrugId, number>;
  private readonly slot = { adIcL: 0, adIcR: 0, adIv: 0, npIc: 0, npIv: 0, nicIc: 0, adrIvPulse: 0, furA: 0 };
  constructor(public weightKg: number) {}

  /** Patient facts for the interaction table (PDE-5 window, QT, pre-excitation, AV block, LVEF, HOCM). */
  setContext(ctx: PharmaContext): void {
    this.ctx = { ...this.ctx, ...ctx };
  }

  /** A direct oral anticoagulant on board, with its effect 0..1 now (the engine sets it from the profile). */
  setDoac(agent: DoacAgent, level: number): void {
    this.st.doac = { agent, level: Math.max(0, Math.min(1, level)) };
  }

  give(o: DoseOrder): void {
    const spec = DRUGS[o.drug];
    if (spec.bolus === false) throw new Error(`${spec.label} is given as an infusion in this simulator`);
    if (!spec.routes.includes(o.route)) throw new Error(`${spec.label} is not given by the ${o.route} route in this simulator`);
    if (!(o.dose > 0)) return;
    this.st.totals[o.drug] = (this.st.totals[o.drug] ?? 0) + o.dose;
    if (o.drug === "heparin") {
      this.st.heparinU += o.dose;
      return;
    }
    if (o.drug === "protamine") {
      this.st.protamineMg += o.dose;
      return;
    }
    if (ORAL_DRUGS.has(o.drug) && (o.route === "oral" || o.route === "crushed")) {
      const onset = ORAL_ONSET_S[o.drug as keyof typeof ORAL_ONSET_S][o.route];
      const opioid = P2Y12_ORAL.has(o.drug) && this.opioidOnBoard();
      this.st.boluses.push({
        drug: o.drug,
        route: o.route,
        a: 0,
        e: 0,
        age: 0,
        g: o.dose,
        tauAbs: (onset / 3) * (opioid ? OPIOID_P2Y12.peakDelay : 1),
        fAbs: opioid ? OPIOID_P2Y12.exposure : 1,
      });
      return;
    }
    this.st.boluses.push({ drug: o.drug, route: o.route, side: o.side, arrest: o.arrest || undefined, a: o.dose, e: 0, age: 0 });
  }

  /** An opioid is acting (analgesia above MP_FORMULARY.opioidOnBoardAnalgesia from fentanyl). */
  opioidOnBoard(): boolean {
    const fen = this.st.boluses.filter((b) => b.drug === "fentanyl").reduce((a, b) => a + b.e, 0);
    return hill((fen / Math.max(40, this.weightKg)) * 70, 50) > MP_FORMULARY.opioidOnBoardAnalgesia;
  }

  /** An IV nitrate infusion is running. */
  nitrateInfusionRunning(): boolean {
    return this.st.infusions.some((i) => i.drug === "gtn" && i.on);
  }

  /** Interaction flags for a dose now. */
  flagsFor(drug: DrugId): InteractionFlag[] {
    return interactionFlags(drug, this.ctx, { elapsedS: this.st.t ?? 0, opioidOnBoard: P2Y12_ORAL.has(drug) && this.opioidOnBoard(), nitrateInfusion: drug === "gtn" && this.nitrateInfusionRunning() });
  }

  startInfusion(o: InfusionOrder): void {
    if (!INFUSIONS[o.drug]) throw new Error(`${o.drug} is not given as an infusion in this simulator`);
    const cur = this.st.infusions.find((i) => i.drug === o.drug);
    if (cur) Object.assign(cur, { delivered: undefined }, o, { on: true });
    else this.st.infusions.push({ ...o, level: 0, on: true });
  }

  stopInfusion(drug: InfusionDrug): void {
    const cur = this.st.infusions.find((i) => i.drug === drug);
    if (cur) cur.on = false;
  }

  heparinUmL(): number {
    return this.st.heparinU / (HEPARIN_VD_L_PER_KG * this.weightKg * 1000);
  }

  /** ACT (s) for a baseline and a patient sensitivity multiplier (heparin and bivalirudin). */
  act(baseline: number, sensitivity: number): number {
    const biv = this.bivalirudinMgKg();
    const base = baseline + MP_ACT_SLOPE_S_PER_U_ML * sensitivity * this.heparinUmL();
    return biv > 0 ? base + MP_FORMULARY.bivalirudinActSPerMgKg * sensitivity * biv : base;
  }

  /** Bivalirudin in the body, mg/kg (boluses and infusion). */
  bivalirudinMgKg(): number {
    let mg = 0;
    for (const b of this.st.boluses) if (b.drug === "bivalirudin") mg += b.a;
    for (const i of this.st.infusions) if (i.drug === "bivalirudin") mg += i.level;
    return mg / Math.max(1, this.weightKg);
  }

  /** Infusion rate in its own units (INFUSIONS) equivalent to the plasma amount now (steady-state rate). */
  infusionRateEq(drug: InfusionDrug): number {
    const inf = this.st.infusions.find((i) => i.drug === drug);
    if (!inf) return 0;
    const u = INFUSIONS[drug];
    const ke = Math.LN2 / DRUGS[drug].halfLifeS;
    return (inf.level * ke * (u.perHour ? 3600 : 60)) / (u.perKg ? Math.max(1, this.weightKg) : 1);
  }

  step(dt: number): void {
    const s = this.st;
    s.t = (s.t ?? 0) + dt;
    // heparin elimination with a level-dependent half-life; protamine binds heparin quickly
    const c = this.heparinUmL();
    s.heparinU *= Math.exp((-Math.LN2 * dt) / heparinHalfLifeS(c));
    if (s.protamineMg > 0 && s.heparinU > 0) {
      const bind = Math.min(s.protamineMg, (s.heparinU / PROTAMINE_U_PER_MG) * Math.min(1, dt / 30));
      s.protamineMg -= bind;
      s.heparinU = Math.max(0, s.heparinU - bind * PROTAMINE_U_PER_MG);
    }
    s.protamineMg *= Math.exp((-Math.LN2 * dt) / DRUGS.protamine.halfLifeS);
    if (s.doac) s.doac.level *= Math.exp((-Math.LN2 * dt) / MP_FORMULARY.doacHalfLifeS);
    for (const inf of s.infusions) {
      if (inf.drug === "heparin") {
        if (inf.on) s.heparinU += (inf.rate / 3600) * dt;
        continue;
      }
      if (inf.drug === "adenosine") {
        // effect level approaches its target with the sourced time to maximal hyperaemia (≈ 3 time constants)
        const tau = (inf.site === "peripheral" ? ADENOSINE.timeToMaxIvS.peripheral : ADENOSINE.timeToMaxIvS.central) / 3;
        const target = inf.on ? hill(inf.delivered === undefined ? inf.rate : inf.rate * Math.max(0, Math.min(1, inf.delivered)), MP_ADENOSINE_IV_ED50, 2) : 0;
        const k = inf.on ? tau : MP_ADENOSINE_IV_OFF_TAU_S;
        inf.level += (target - inf.level) * (1 - Math.exp(-dt / k));
        continue;
      }
      if (inf.drug === "noradrenaline") {
        // noradrenaline: plasma amount, µg
        const ke = Math.LN2 / DRUGS.noradrenaline.halfLifeS;
        inf.level += ((inf.on ? inf.rate / 60 : 0) - ke * inf.level) * dt;
        continue;
      }
      // every other infusion: plasma amount in the drug's unit, exact first-order step
      const u = INFUSIONS[inf.drug];
      const ke = Math.LN2 / DRUGS[inf.drug].halfLifeS;
      const inPerS = inf.on ? (inf.rate * (u.perKg ? this.weightKg : 1)) / (u.perHour ? 3600 : 60) : 0;
      const ss = inPerS / ke;
      inf.level = ss + (inf.level - ss) * Math.exp(-ke * dt);
    }
    s.infusions = s.infusions.filter((i) => i.on || i.level > 1e-3 || i.drug === "heparin");
    for (const b of s.boluses) {
      const spec = DRUGS[b.drug];
      if (b.g !== undefined && b.g > 0) {
        const absorbed = b.g * (1 - Math.exp(-dt / Math.max(1, b.tauAbs ?? 600)));
        b.g -= absorbed;
        b.a += absorbed * (b.fAbs ?? 1);
      }
      let hl = spec.halfLifeS;
      if (b.drug === "adenosine" && b.route === "ic") hl = (b.side === "right" ? ADENOSINE.plateauIcS.right : ADENOSINE.plateauIcS.left) * MP_ADENOSINE_IC_HALFLIFE_PER_PLATEAU;
      b.a *= Math.exp((-Math.LN2 * dt) / hl);
      const tauE = b.drug === "adenosine" && b.route === "ic" ? ADENOSINE.timeToMaxIcS / 4 : b.route === "im" ? spec.tauE * 4 : spec.tauE;
      b.e += (b.a - b.e) * (1 - Math.exp(-dt / tauE));
      b.age += dt;
    }
    s.boluses = s.boluses.filter((b) => b.a > 1e-4 * DOSE_FLOOR[b.drug] || b.e > 1e-4 * DOSE_FLOOR[b.drug] || (b.g ?? 0) > 1e-4 * DOSE_FLOOR[b.drug]);
  }

  effects(): DrugEffects {
    const eff: DrugEffects = {
      hrDelta: 0,
      vagolysis: 0,
      prDelta: 0,
      avBlockDrive: 0,
      svrMult: 1,
      inotropy: 1,
      venodilationMl: 0,
      epicardialDilation: 0,
      hyperaemia: { left: 0, right: 0 },
      sedation: 0,
      analgesia: 0,
      respDepression: 0,
      antiAllergic: 0,
      adrenergic: 0,
      adenosineSymptoms: 0,
      heparinUmL: this.heparinUmL(),
      microvascularDilation: 0,
      bronchodilation: 0,
      antiarrhythmic: 0,
      proarrhythmia: 0,
      diuresisMlS: 0,
      aspirin: 0,
      p2y12: 0,
      gpi: 0,
      antiplatelet: 0,
      anticoagulant: 0,
      doacEffect: 0,
      antithrombotic: 0,
      thrombusHazardMult: 1,
      stentThrombosisMult: 1,
      bivalirudinActS: 0,
    };
    // one pass over the boluses into reused per-drug totals (effect-site amounts) and route slots
    const tot = this.tot;
    for (const k of DRUG_IDS) tot[k] = 0;
    const sl = this.slot;
    sl.adIcL = sl.adIcR = sl.adIv = sl.npIc = sl.npIv = sl.nicIc = sl.adrIvPulse = sl.furA = 0;
    for (const b of this.st.boluses) {
      tot[b.drug] += b.e;
      switch (b.drug) {
        case "adenosine":
          if (b.route === "iv") sl.adIv += b.e;
          else if (b.route === "ic") {
            if (b.side === "left") sl.adIcL += b.e;
            else if (b.side === "right") sl.adIcR += b.e;
          }
          break;
        case "nitroprusside":
          if (b.route === "ic") sl.npIc += b.e;
          else if (b.route === "iv") sl.npIv += b.e;
          break;
        case "nicardipine":
          if (b.route === "ic") sl.nicIc += b.e;
          break;
        case "adrenaline":
          if (b.route === "iv" && !b.arrest) sl.adrIvPulse += b.e;
          break;
        case "furosemide":
          sl.furA += b.a;
          break;
      }
    }
    const infLevel = (drug: InfusionDrug) => this.st.infusions.find((i) => i.drug === drug)?.level ?? 0;
    const w = this.weightKg;
    const MF = MP_FORMULARY;
    const MI = MP_INTERACTION;

    // nitrate: epicardial dilation, venodilation, mild arteriolar dilation, reflex tachycardia.
    // A running nitrate infusion adds its plasma amount and blunts the bolus response; within a
    // PDE-5 window the systemic vasodilation is multiplied.
    const gtnInf = infLevel("gtn");
    const tolerance = gtnInf > 0 ? 1 - MI.nitrateToleranceMax * hill(gtnInf, MI.nitrateToleranceUg) : 1;
    const gtn = gtnInf > 0 ? tot.gtn * tolerance + gtnInf : tot.gtn;
    const pde5 = pde5Active(this.ctx, this.st.t ?? 0) ? MI.pde5NitrateGain : 1;
    const eG = hill(gtn, 60);
    eff.epicardialDilation = Math.max(eff.epicardialDilation, eG);
    eff.venodilationMl += 160 * hill(gtn, 250) * pde5;
    eff.svrMult *= pde5 === 1 ? 1 - 0.12 * hill(gtn, 250) : Math.max(0.3, 1 - 0.12 * pde5 * hill(gtn, 250));
    eff.hrDelta += 6 * hill(gtn, 250);

    // adenosine: IC hyperaemia per side, AV nodal block drive, symptoms; IV infusion level.
    // Aminophylline (an A1 antagonist) scales every adenosine effect down.
    const amino = tot.aminophylline;
    const adK = amino > 0 ? 1 / (1 + amino / MF.aminophyllineHalfMg) : 1;
    const adL = amino > 0 ? sl.adIcL * adK : sl.adIcL;
    const adR = amino > 0 ? sl.adIcR * adK : sl.adIcR;
    // recent caffeine lowers the maximum of every adenosine effect (MP_CAFFEINE_ADENOSINE); without it the factor is exactly 1
    const caf = this.ctx.caffeine ? MP_CAFFEINE_ADENOSINE : 1;
    eff.hyperaemia.left = hill(adL, MP_ADENOSINE_IC_ED50.left, 3) * caf;
    eff.hyperaemia.right = hill(adR, MP_ADENOSINE_IC_ED50.right, 3) * caf;
    // AV nodal drive: half-maximal at the upper standard dose of each side (MODEL)
    const icDrive = Math.max(hill(adR, ADENOSINE.icStandardUg.right[1], 2), hill(adL, ADENOSINE.icStandardUg.left[1], 2)) * caf;
    const ivAd = this.st.infusions.find((i) => i.drug === "adenosine");
    const ivLevel = (ivAd ? (amino > 0 ? ivAd.level * adK : ivAd.level) : 0) * caf;
    eff.hyperaemia.left = Math.max(eff.hyperaemia.left, ivLevel);
    eff.hyperaemia.right = Math.max(eff.hyperaemia.right, ivLevel);
    eff.avBlockDrive = Math.max(icDrive, ivLevel);
    eff.adenosineSymptoms = Math.max(0.6 * icDrive, ivLevel);
    eff.svrMult *= 1 - 0.18 * ivLevel; // systemic vasodilation (MODEL)
    eff.hrDelta += 14 * ivLevel; // reflex tachycardia with IV infusion (MODEL)
    const adIv = amino > 0 ? sl.adIv * adK : sl.adIv; // IV bolus (SVT-type), transient
    eff.avBlockDrive = Math.max(eff.avBlockDrive, hill(adIv, 4000, 2) * caf);

    // verapamil: AV nodal slowing, negative chronotropy, vasodilation
    const ver = tot.verapamil;
    eff.prDelta += 0.05 * hill(ver, 5);
    eff.hrDelta -= 10 * hill(ver, 5);
    eff.svrMult *= 1 - 0.12 * hill(ver, 5);
    eff.inotropy *= 1 - 0.08 * hill(ver, 5);

    // atropine: vagolysis
    const atr = tot.atropine;
    eff.vagolysis = Math.max(eff.vagolysis, hill(atr, 0.35));
    eff.hrDelta += 18 * hill(atr, 0.8);

    // vasopressors (an infusion's plasma amount adds to the bolus effect amount)
    const met = tot.metaraminol;
    eff.svrMult *= 1 + 0.7 * hill(met, 1);
    eff.venodilationMl -= 120 * hill(met, 1);
    const phe = tot.phenylephrine + infLevel("phenylephrine");
    eff.svrMult *= 1 + 0.6 * hill(phe, 150);
    eff.venodilationMl -= 100 * hill(phe, 150);
    const na = this.st.infusions.find((i) => i.drug === "noradrenaline")?.level ?? 0; // µg in plasma
    eff.svrMult *= 1 + 0.9 * hill(na, 5);
    eff.inotropy *= 1 + 0.25 * hill(na, 5);
    eff.venodilationMl -= 150 * hill(na, 5);
    const adrInf = infLevel("adrenaline");
    const adr = tot.adrenaline + adrInf;
    eff.hrDelta += 35 * hill(adr, 150);
    eff.inotropy *= 1 + 0.6 * hill(adr, 150);
    eff.svrMult *= 1 + 0.5 * hill(adr, 300);
    eff.adrenergic = Math.max(eff.adrenergic, hill(adr, 80));
    // IV adrenaline at arrest doses with a pulse: severe hypertension and a VT drive (the engine draws VT).
    // A dose given during an arrest is left out, so return of circulation does not count it as "with a pulse".
    const adrIv = sl.adrIvPulse;
    if (adrIv > 0) {
      const high = hill(adrIv, MF.adrenalineHighEd50Ug, 3);
      eff.svrMult *= 1 + MF.adrenalineHighSvr * high;
      eff.proarrhythmia = Math.max(eff.proarrhythmia, high);
    }

    // inotropes and chronotropes (infusion-only drugs act through their steady-state-equivalent rate)
    const dob = this.infusionRateEq("dobutamine");
    if (dob > 0) {
      eff.inotropy *= 1 + MF.dobutamineIno * hill(dob, MF.dobutamineInoEd50);
      eff.hrDelta += MF.dobutamineHr * hill(dob, MF.dobutamineHrEd50);
      eff.svrMult *= 1 - MF.dobutamineSvr * hill(dob, MF.dobutamineHrEd50);
      eff.adrenergic = Math.max(eff.adrenergic, 0.3 * hill(dob, MF.dobutamineInoEd50));
    }
    const dop = this.infusionRateEq("dopamine");
    if (dop > 0) {
      eff.inotropy *= 1 + MF.dopamineIno * hill(dop, MF.dopamineInoEd50);
      eff.hrDelta += MF.dopamineHr * hill(dop, MF.dopamineHrEd50);
      eff.svrMult *= 1 + MF.dopamineSvr * hill(dop, MF.dopamineSvrEd50, 3);
      eff.venodilationMl -= 80 * hill(dop, MF.dopamineSvrEd50, 3);
    }
    const vaso = this.infusionRateEq("vasopressin");
    if (vaso > 0) eff.svrMult *= 1 + MF.vasopressinSvr * hill(vaso, MF.vasopressinEd50);
    const iso = tot.isoprenaline + infLevel("isoprenaline");
    if (iso > 0) {
      eff.hrDelta += MF.isoprenalineHr * hill(iso, MF.isoprenalineEd50Ug);
      eff.inotropy *= 1 + 0.3 * hill(iso, MF.isoprenalineEd50Ug);
      eff.svrMult *= 1 - 0.15 * hill(iso, MF.isoprenalineEd50Ug);
    }

    // sedation and analgesia: flumazenil antagonises benzodiazepines and naloxone opioids, competitively
    const flu = tot.flumazenil;
    const nal = tot.naloxone;
    const benzo = tot.midazolam + tot.diazepam / MF.diazepamPerMidazolam;
    const opioid = tot.fentanyl;
    const mid = ((flu > 0 ? benzo / (1 + flu / MF.flumazenilKiMg) : benzo) / Math.max(40, w)) * 70; // midazolam-equivalent mg per 70 kg
    const fen = ((nal > 0 ? opioid / (1 + nal / MF.naloxoneKiMg) : opioid) / Math.max(40, w)) * 70;
    eff.sedation = Math.min(1, hill(mid, 3.5) + 0.4 * hill(fen, 150));
    eff.analgesia = Math.min(1, hill(fen, 50) + 0.15 * hill(mid, 3));
    eff.respDepression = Math.min(1, hill(mid, 8, 2) * 0.6 + hill(fen, 200, 2) * 0.6 + hill(mid, 3) * hill(fen, 75) * 0.5);
    const prop = (tot.propofol / Math.max(40, w)) * 70;
    if (prop > 0) {
      eff.sedation = Math.min(1, eff.sedation + hill(prop, MF.propofolSedationEd50Mg));
      eff.respDepression = Math.min(1, eff.respDepression + 0.7 * hill(prop, MF.propofolRespEd50Mg, 2));
      eff.svrMult *= 1 - 0.15 * hill(prop, MF.propofolSedationEd50Mg);
      eff.inotropy *= 1 - 0.05 * hill(prop, MF.propofolSedationEd50Mg);
    }
    eff.svrMult *= 1 - 0.06 * eff.sedation;

    // anti-allergic
    eff.antiAllergic = Math.min(1, hill(tot.chlorphenamine, 5) + 0.5 * hill(tot.hydrocortisone, 100));
    // bronchodilation (nebulised salbutamol) with a mild tachycardia
    const sal = tot.salbutamol;
    if (sal > 0) {
      eff.bronchodilation = hill(sal, MF.salbutamolEd50Mg);
      eff.hrDelta += 8 * hill(sal, 5);
    }

    // furosemide: venodilation within minutes (plasma amount), diuresis later (effect site)
    const furA = sl.furA;
    if (furA > 0) {
      eff.venodilationMl += MF.furosemideVenoMl * hill(furA, MF.furosemideEd50Mg);
      eff.diuresisMlS = MF.furosemideDiuresisMlS * hill(tot.furosemide, MF.furosemideEd50Mg);
    }

    // antiarrhythmics
    const ami = tot.amiodarone + infLevel("amiodarone");
    if (ami > 0) {
      const h = hill(ami, MF.amiodaroneEd50Mg);
      eff.antiarrhythmic = Math.max(eff.antiarrhythmic, h);
      eff.prDelta += 0.04 * h;
      eff.hrDelta -= 8 * h;
      // hypotension from vasodilation and depressed contractility (antiarrhythmics table, 04-lab-drugs.ts:797)
      eff.svrMult *= 1 - 0.1 * h;
      eff.inotropy *= 1 - 0.06 * h;
    }
    const lid = tot.lidocaine;
    if (lid > 0) eff.antiarrhythmic = Math.max(eff.antiarrhythmic, hill(lid, MF.lidocaineEd50Mg));
    const meto = tot.metoprolol;
    if (meto > 0) {
      const h = hill(meto, MF.metoprololEd50Mg);
      eff.hrDelta -= 15 * h;
      eff.prDelta += 0.03 * h;
      eff.inotropy *= 1 - 0.1 * h;
      eff.antiarrhythmic = Math.max(eff.antiarrhythmic, 0.5 * h);
    }
    const fle = tot.flecainide;
    if (fle > 0) {
      const h = hill(fle, MF.flecainideEd50Mg);
      eff.antiarrhythmic = Math.max(eff.antiarrhythmic, h);
      eff.inotropy *= 1 - 0.15 * h;
      eff.prDelta += 0.02 * h;
    }

    // microvascular vasodilators: local effect from the IC dose, systemic from IV plus a fraction of IC
    const npIc = sl.npIc;
    const npIv = sl.npIv;
    if (npIc + npIv > 0) {
      const sys = npIv + MF.icSystemicFraction * npIc;
      eff.microvascularDilation = Math.max(eff.microvascularDilation, hill(npIc, MF.microvascularEd50Ug));
      eff.svrMult *= Math.max(0.3, 1 - MF.nitroprussideSvr * hill(sys, MF.nitroprussideEd50Ug) * pde5);
      eff.venodilationMl += 60 * hill(sys, MF.nitroprussideEd50Ug) * pde5;
      eff.hrDelta += 6 * hill(sys, MF.nitroprussideEd50Ug);
    }
    const nic = tot.nicardipine;
    if (nic > 0) {
      const nicIc = sl.nicIc;
      eff.microvascularDilation = Math.max(eff.microvascularDilation, hill(nicIc, MF.microvascularEd50Ug));
      eff.svrMult *= 1 - MF.nicardipineSvr * hill(MF.icSystemicFraction * nic, MF.nicardipineEd50Ug);
    }

    // antiplatelet agents
    const perKg = (x: number) => x / Math.max(1, w);
    eff.aspirin = hill(tot.aspirin, MF.aspirinEd50Mg);
    eff.p2y12 = Math.max(
      hill(tot.clopidogrel, MF.clopidogrelEd50Mg),
      hill(tot.prasugrel, MF.prasugrelEd50Mg),
      hill(tot.ticagrelor, MF.ticagrelorEd50Mg),
      hill(perKg(tot.cangrelor + infLevel("cangrelor")), MF.cangrelorEd50UgKg)
    );
    eff.gpi = Math.max(hill(perKg(tot.eptifibatide + infLevel("eptifibatide")), MF.eptifibatideEd50UgKg), hill(perKg(tot.tirofiban + infLevel("tirofiban")), MF.tirofibanEd50UgKg));
    eff.antiplatelet = 1 - (1 - 0.3 * eff.aspirin) * (1 - 0.6 * eff.p2y12) * (1 - 0.9 * eff.gpi);

    // anticoagulants and reversal
    const biv = this.bivalirudinMgKg();
    eff.bivalirudinActS = MF.bivalirudinActSPerMgKg * biv;
    if (this.st.doac && this.st.doac.level > 0) {
      const d = this.st.doac;
      let reversal = 0;
      if (d.agent === "dabigatran") reversal = Math.min(1, tot.idarucizumab / MF.idarucizumabFullMg);
      else reversal = hill(tot.andexanet, MF.andexanetEd50Mg);
      reversal = 1 - (1 - reversal) * (1 - MF.pccMaxReversal * hill(tot.pcc, MF.pccEd50U));
      eff.doacEffect = d.level * (1 - reversal);
    }
    eff.anticoagulant = 1 - (1 - hill(eff.heparinUmL, MF.heparinEffectUmL)) * (1 - hill(biv, MF.bivalirudinEffectMgKg)) * (1 - eff.doacEffect);
    eff.antithrombotic = 1 - (1 - eff.antiplatelet) * (1 - eff.anticoagulant);
    eff.thrombusHazardMult = (1 - MF.thrombusAp * eff.antiplatelet) * (1 - MF.thrombusAc * eff.anticoagulant);
    eff.stentThrombosisMult = (1 - MF.stentAp * eff.antiplatelet) * (1 - MF.stentAc * eff.anticoagulant);
    return eff;
  }

  snapshot(): PharmaState {
    return JSON.parse(JSON.stringify(this.st));
  }
  restore(s: PharmaState): void {
    this.st = JSON.parse(JSON.stringify(s));
  }
}

/** IC adenosine ED50 per side for hyperaemia (µg; MODEL PARAMETER placing the sourced standard doses near maximal effect). */
export const MP_ADENOSINE_IC_ED50 = { left: 40, right: 20 };
/** IV adenosine ED50 (µg/kg/min; MODEL PARAMETER: 140 µg/kg/min gives ≥ 0.9 of maximal hyperaemia). */
export const MP_ADENOSINE_IV_ED50 = 45;
/** IV adenosine offset time constant after stopping (s; MODEL PARAMETER). */
export const MP_ADENOSINE_IV_OFF_TAU_S = 20;
/** IC adenosine local half-life as a fraction of the sourced plateau duration (MODEL PARAMETER). */
export const MP_ADENOSINE_IC_HALFLIFE_PER_PLATEAU = 0.6;
/**
 * Recent caffeine: every adenosine effect (hyperaemia, AV nodal drive, systemic effects) is scaled by
 * this — MODEL PARAMETER (physiology-hyperaemia-and-adenosine). The direction is sourced (caffeine stops
 * adenosine binding, Brilakis, lesson pm-physiology-when, 14-physiology.ts:98); the size is not. Chosen
 * so that a standard IV infusion leaves the hyperaemia clearly submaximal.
 */
export const MP_CAFFEINE_ADENOSINE = 0.55;

// --- adenosine in closed form ----------------------------------------------------------
// The same model as Pharmacology.step and effects() above, solved for one dose or one infusion, so a
// caller without an engine (the pressure-wire session, src/simulation/pci/pwSession.ts) reads the
// hyperaemia of a dose at any moment (physiology-hyperaemia-and-adenosine). Pharmacology steps the
// local compartment (first-order loss, half-life MP_ADENOSINE_IC_HALFLIFE_PER_PLATEAU x the sourced
// plateau) and the effect site (time constant ADENOSINE.timeToMaxIcS / 4); for a bolus D given at
// t = 0 the effect-site amount is D kE / (kE - ke) (exp(-ke t) - exp(-kE t)).

/** Effect-site amount of an intracoronary adenosine bolus, µg, `tS` seconds after it reached the artery. */
export function icAdenosineEffectSiteUg(doseUg: number, side: "left" | "right", tS: number): number {
  if (!(doseUg > 0) || !(tS > 0)) return 0;
  const hl = (side === "right" ? ADENOSINE.plateauIcS.right : ADENOSINE.plateauIcS.left) * MP_ADENOSINE_IC_HALFLIFE_PER_PLATEAU;
  const ke = Math.LN2 / hl;
  const kE = 4 / ADENOSINE.timeToMaxIcS;
  return ((doseUg * kE) / (kE - ke)) * (Math.exp(-ke * tS) - Math.exp(-kE * tS));
}

/** Coronary hyperaemia (0..1, as DrugEffects.hyperaemia) from an intracoronary effect-site amount, µg. */
export function icAdenosineHyperaemiaOf(effectSiteUg: number, side: "left" | "right", opts: { caffeine?: boolean } = {}): number {
  return hill(effectSiteUg, side === "right" ? MP_ADENOSINE_IC_ED50.right : MP_ADENOSINE_IC_ED50.left, 3) * (opts.caffeine ? MP_CAFFEINE_ADENOSINE : 1);
}

/** The highest hyperaemia an intracoronary bolus reaches (its effect-site peak), 0..1. */
export function icAdenosinePeakHyperaemia(doseUg: number, side: "left" | "right", opts: { caffeine?: boolean } = {}): number {
  if (!(doseUg > 0)) return 0;
  const hl = (side === "right" ? ADENOSINE.plateauIcS.right : ADENOSINE.plateauIcS.left) * MP_ADENOSINE_IC_HALFLIFE_PER_PLATEAU;
  const ke = Math.LN2 / hl;
  const kE = 4 / ADENOSINE.timeToMaxIcS;
  const tPeak = Math.log(kE / ke) / (kE - ke);
  return icAdenosineHyperaemiaOf(icAdenosineEffectSiteUg(doseUg, side, tPeak), side, opts);
}

/** Time constant of the IV adenosine effect at a venous site, s (a third of the sourced time to maximal hyperaemia). */
export function ivAdenosineTauS(site: "central" | "peripheral" = "central"): number {
  return (site === "peripheral" ? ADENOSINE.timeToMaxIvS.peripheral : ADENOSINE.timeToMaxIvS.central) / 3;
}

/** Steady-state IV adenosine effect (0..1) of a rate, µg/kg/min, of which `delivered` reaches the circulation. */
export function ivAdenosineSteadyLevel(rateUgKgMin: number, opts: { delivered?: number; caffeine?: boolean } = {}): number {
  const d = opts.delivered === undefined ? 1 : Math.max(0, Math.min(1, opts.delivered));
  return hill(rateUgKgMin * d, MP_ADENOSINE_IV_ED50, 2) * (opts.caffeine ? MP_CAFFEINE_ADENOSINE : 1);
}

/** IV adenosine effect (0..1) `tS` seconds after the infusion started from nothing. */
export function ivAdenosineLevelAt(rateUgKgMin: number, site: "central" | "peripheral", tS: number, opts: { delivered?: number; caffeine?: boolean } = {}): number {
  if (!(tS > 0)) return 0;
  return ivAdenosineSteadyLevel(rateUgKgMin, opts) * (1 - Math.exp(-tS / ivAdenosineTauS(site)));
}

/** Amount below which a bolus is dropped (as a multiple of 1e-4), in the drug's unit (MODEL). */
const DOSE_FLOOR: Record<DrugId, number> = {
  heparin: 100,
  protamine: 1,
  gtn: 10,
  adenosine: 10,
  verapamil: 0.5,
  atropine: 0.1,
  metaraminol: 0.1,
  phenylephrine: 10,
  noradrenaline: 1,
  adrenaline: 10,
  midazolam: 0.5,
  fentanyl: 10,
  chlorphenamine: 1,
  hydrocortisone: 10,
  flumazenil: 0.01,
  naloxone: 0.01,
  diazepam: 0.5,
  propofol: 1,
  dobutamine: 10,
  dopamine: 10,
  vasopressin: 0.01,
  isoprenaline: 1,
  furosemide: 1,
  salbutamol: 0.1,
  amiodarone: 1,
  lidocaine: 1,
  metoprolol: 0.1,
  flecainide: 1,
  aminophylline: 1,
  nicardipine: 1,
  nitroprusside: 1,
  eptifibatide: 10,
  tirofiban: 1,
  cangrelor: 1,
  bivalirudin: 0.1,
  idarucizumab: 10,
  andexanet: 10,
  pcc: 10,
  aspirin: 1,
  clopidogrel: 1,
  prasugrel: 0.1,
  ticagrelor: 1,
};

/**
 * Dose statements of the manuals for every formulary drug, with their location in the module text
 * (src/content/manual/**; file:line). These are teaching references for the labs' order panels and
 * the debrief, not doses the engine applies by itself. `quote` is a fragment of that line, which a
 * test checks is still there.
 */
export const FORMULARY_REFERENCE: Partial<Record<DrugId, { dose: string; file: string; line: number; quote: string }[]>> = {
  midazolam: [{ dose: "0.5–1 mg IV, repeatable (Brilakis 3.1); 0.5–2.5 mg IV (Oxford ch 1)", file: "pci-manual/04-lab-drugs.ts", line: 62, quote: "0.5–1 mg IV, repeatable" }],
  diazepam: [{ dose: "2–10 mg IV as an emulsion (Oxford ch 1)", file: "pci-manual/04-lab-drugs.ts", line: 63, quote: "2–10 mg IV" }],
  fentanyl: [{ dose: "25–100 µg IV, repeatable (Brilakis 3.1)", file: "pci-manual/04-lab-drugs.ts", line: 64, quote: "25–100 µg IV, repeatable" }],
  flumazenil: [{ dose: "0.2 mg IV across 15 s; a further 0.2 mg at 45 s without response, then 1-minute steps to 1 mg (Brilakis 3.1)", file: "pci-manual/04-lab-drugs.ts", line: 124, quote: "0.2 mg IV, injected across 15 seconds" }],
  naloxone: [{ dose: "0.1–0.2 mg IV every 2–3 minutes to effect (Brilakis 3.1)", file: "pci-manual/04-lab-drugs.ts", line: 133, quote: "0.1–0.2 mg IV, repeated every 2–3 minutes" }],
  phenylephrine: [{ dose: "50–100 µg IV bolus, then 0.5–1.4 µg/kg/min", file: "pci-manual/04-lab-drugs.ts", line: 650, quote: "50–100 µg IV bolus, then 0.5–1.4 µg/kg/min" }],
  noradrenaline: [{ dose: "0.1–0.5 µg/kg/min infusion", file: "pci-manual/04-lab-drugs.ts", line: 651, quote: "0.1–0.5 µg/kg/min infusion" }],
  vasopressin: [{ dose: "0.03 U/min, rising by 0.005 U/min every 10–15 minutes to 0.1 U/min", file: "pci-manual/04-lab-drugs.ts", line: 652, quote: "0.03 U/min" }],
  dopamine: [{ dose: "5–10 µg/kg/min (inotrope); 10–20 µg/kg/min (vasopressor)", file: "pci-manual/04-lab-drugs.ts", line: 653, quote: "5–10 µg/kg/min (inotrope)" }],
  adrenaline: [
    { dose: "Arrest: 1 mg IV every 3–5 minutes; cardiogenic shock: 2–10 µg/min", file: "pci-manual/04-lab-drugs.ts", line: 654, quote: "1 mg IV repeated at 3–5 minute intervals" },
    { dose: "Anaphylaxis: 0.5 mg IM (0.5 mL of 1 mg/mL), repeated after 5 minutes (RCUK 2021)", file: "pci-manual/04-lab-drugs.ts", line: 1152, quote: "0.5 mg IM into the anterolateral thigh" },
  ],
  dobutamine: [{ dose: "Brilakis prints 10–40 µg/kg/min; ESC 2021 gives 2–20 µg/kg/min, start low", file: "pci-manual/04-lab-drugs.ts", line: 655, quote: "2–20 µg/kg/min" }],
  isoprenaline: [{ dose: "25–50 µg IV bolus, then 5–10 µg/min (Oxford)", file: "pci-manual/04-lab-drugs.ts", line: 886, quote: "bolus 25–50 µg, infusion 5–10 µg/min" }],
  gtn: [
    { dose: "IC 100–300 µg (Brilakis 3.2, 25.2)", file: "pci-manual/04-lab-drugs.ts", line: 250, quote: "100–300 µg" },
    { dose: "IV 10 µg/min, +10 µg/min every 5 minutes, maximum 200 µg/min (Brilakis 3.2)", file: "pci-manual/04-lab-drugs.ts", line: 254, quote: "Start at 10 µg/min" },
  ],
  nitroprusside: [{ dose: "100–300 µg IC (Brilakis); 50–100 µg IC, repeatable (Oxford)", file: "pci-manual/04-lab-drugs.ts", line: 425, quote: "100–300 µg intracoronary" }],
  nicardipine: [{ dose: "100–300 µg IC or intragraft; 100–200 µg into the radial artery (Brilakis)", file: "pci-manual/04-lab-drugs.ts", line: 421, quote: "100–300 µg intracoronary or intragraft" }],
  verapamil: [{ dose: "2–3 mg into the radial artery; 1 mg IC over 2 minutes (Brilakis)", file: "pci-manual/04-lab-drugs.ts", line: 429, quote: "2–3 mg into the radial artery" }],
  aminophylline: [{ dose: "250–300 mg IV over 10 minutes or 20–40 mg IC (Brilakis, atherectomy)", file: "pci-manual/04-lab-drugs.ts", line: 529, quote: "aminophylline 250–300 mg IV over 10 minutes" }],
  furosemide: [{ dose: "80–100 mg IV for pulmonary oedema (Oxford ch 10)", file: "pci-manual/04-lab-drugs.ts", line: 255, quote: "furosemide 80–100 mg IV" }],
  salbutamol: [{ dose: "Nebulised 5 mg for bronchospasm (Oxford)", file: "pci-manual/04-lab-drugs.ts", line: 1137, quote: "Nebulised salbutamol 5 mg" }],
  amiodarone: [
    { dose: "150 mg over 10 minutes, then 1 mg/min for 6 hours", file: "pci-manual/04-lab-drugs.ts", line: 788, quote: "150 mg over 10 minutes" },
    { dose: "Refractory VF: 300 mg IV push, then 1 mg/min for 6 hours", file: "pci-manual/04-lab-drugs.ts", line: 789, quote: "300 mg IV push" },
  ],
  lidocaine: [{ dose: "50 mg IV over 2 minutes, repeated every 5 minutes to 200 mg (Oxford)", file: "pci-manual/04-lab-drugs.ts", line: 1352, quote: "Lidocaine 50 mg IV across 2 minutes" }],
  metoprolol: [{ dose: "5 mg IV bolus, repeatable (Oxford)", file: "pci-manual/04-lab-drugs.ts", line: 832, quote: "5 mg bolus" }],
  flecainide: [{ dose: "2 mg/kg (maximum 150 mg) IV over 30 minutes, only with a good circulation and no structural heart disease (Oxford)", file: "pci-manual/04-lab-drugs.ts", line: 856, quote: "Flecainide 2 mg/kg (maximum 150 mg) IV over 30 minutes" }],
  atropine: [{ dose: "1 mg IV may improve AV nodal conduction", file: "pci-manual/04-lab-drugs.ts", line: 886, quote: "Atropine 1 mg IV may improve AV nodal conduction" }],
  heparin: [{ dose: "Half-life about 30 min after 25 U/kg, 60 min after 100 U/kg, 150 min after 400 U/kg (Brilakis)", file: "pci-manual/03-antithrombotics.ts", line: 72, quote: "roughly 30 minutes after a 25 units/kg bolus" }],
  cangrelor: [{ dose: "30 µg/kg IV bolus, then 4 µg/kg/min for at least 2 hours or the procedure", file: "pci-manual/03-antithrombotics.ts", line: 1017, quote: "30 µg/kg IV bolus, then 4 µg/kg/min" }],
  eptifibatide: [{ dose: "Two 180 µg/kg boluses 10 minutes apart, then 2.0 µg/kg/min (renal halving: see the lesson)", file: "pci-manual/03-antithrombotics.ts", line: 1024, quote: "Two boluses of 180 µg/kg, 10 minutes apart, then 2.0 µg/kg/min" }],
  tirofiban: [{ dose: "25 µg/kg over 3 minutes, then 0.15 µg/kg/min (0.075 at CrCl 60 mL/min or less)", file: "pci-manual/03-antithrombotics.ts", line: 1031, quote: "25 µg/kg over 3 minutes, then 0.15 µg/kg/min" }],
  bivalirudin: [
    { dose: "0.75 mg/kg IV bolus whatever the renal function", file: "pci-manual/03-antithrombotics.ts", line: 315, quote: "0.75 mg/kg IV, whatever the renal function" },
    { dose: "Infusion 1.75 mg/kg/h with normal kidneys", file: "pci-manual/03-antithrombotics.ts", line: 316, quote: "1.75 mg/kg/h" },
  ],
  aspirin: [{ dose: "325 mg load then 81–100 mg daily (Brilakis); 300 mg load then 75 mg daily (Oxford)", file: "pci-manual/03-antithrombotics.ts", line: 709, quote: "325 mg load, then 81–100 mg daily" }],
  clopidogrel: [{ dose: "600 mg load, ideally at least 6 hours before PCI, then 75 mg daily (Brilakis)", file: "pci-manual/03-antithrombotics.ts", line: 716, quote: "600 mg load, ideally at least 6 hours before PCI" }],
  prasugrel: [{ dose: "60 mg load, then 10 mg daily; 5 mg daily if under 60 kg or over 75 years (Brilakis)", file: "pci-manual/03-antithrombotics.ts", line: 723, quote: "60 mg load, then 10 mg daily" }],
  ticagrelor: [{ dose: "180 mg load, then 90 mg twice daily", file: "pci-manual/03-antithrombotics.ts", line: 730, quote: "180 mg load, then 90 mg twice daily" }],
  idarucizumab: [{ dose: "5 g IV as two 2.5 g doses for dabigatran (EHRA 2021)", file: "complication-management/05-patient-complications.ts", line: 980, quote: "idarucizumab, 5 g IV in two 2.5 g doses" }],
  andexanet: [{ dose: "A bolus then a 2-hour infusion, the regimen by drug and time since the last dose (EHRA 2021; no figure in the module)", file: "complication-management/05-patient-complications.ts", line: 980, quote: "andexanet alfa (a bolus, then a 2-hour infusion" }],
  pcc: [{ dose: "May be considered when a specific agent is unavailable (EHRA 2021; no figure in the module)", file: "complication-management/05-patient-complications.ts", line: 980, quote: "Prothrombin complex concentrate, or its activated form, may be considered" }],
  protamine: [{ dose: "Capped at 50 mg and given slowly, once all coronary equipment is out (Brilakis)", file: "complication-management/05-patient-complications.ts", line: 1262, quote: "capped at 50 mg, given slowly" }],
};
