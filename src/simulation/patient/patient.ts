// ---------------------------------------------------------------------------
// Seeded patient generator.
//
// One seed gives one patient: demographics and habitus, indication, coronary
// disease (bootstrapped as a whole row from the AngioCAD table conditioned on
// indication, n = 376, so segment-to-segment correlation is the real one),
// LV function, baseline haemodynamics and rhythm, renal function and contrast
// budget, allergies, anticoagulation, anxiety and vagal tone, radial calibre
// and root size.
//
// Sources (see docs/realism/facts/S9.md):
// - AngioCAD rows: Hosseini MS et al., Zenodo 2025, doi:10.5281/zenodo.15826856 (CC BY 4.0).
// - Cockcroft-Gault creatinine clearance and 2021 CKD-EPI creatinine eGFR.
// - Maximum acceptable contrast dose (Cigarroa) and contrast/CrCl ratios: SIM_FACTS item 22.
// Every other distribution below is a MODEL PARAMETER and is named as such.
// ---------------------------------------------------------------------------

import type { AnatomyCase, CaseChart, Dominance, Lesion, PathologyKind, RootSize, VesselId } from "../../types";
import type { CoronaryTree } from "../../render/xray/coronaryTree";
import { pde5Active, type DoacAgent, type Pde5Agent } from "./pharmacology";
import { SeededRng, hashSeed } from "./rng";
import {
  ANGIOCAD_ROWS,
  ANGIOCAD_SEGMENTS,
  ANGIOCAD_GRADES,
  ANGIOCAD_INDICATIONS,
  ANGIOCAD_SOURCE,
  type AngioCadIndication,
  type AngioCadRow,
  type AngioCadSegment,
} from "./angiocadPriors";

export type Indication = AngioCadIndication;
export type Sex = "M" | "F";

export const INDICATION_LABEL: Record<Indication, string> = {
  SA: "Stable angina",
  UA: "Unstable angina",
  NSTEMI: "Non-ST-elevation myocardial infarction",
  STEMI: "ST-elevation myocardial infarction",
};

/** Grade index 0..6 (NL, 1-25, 26-50, 51-75, 76-90, 91-99, 100). */
export type Grade = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface PatientProfile {
  seed: string;
  sex: Sex;
  ageY: number;
  heightCm: number;
  weightKg: number;
  bmi: number;
  /** body habitus for the imaging chain (1 = average adult); derived from BMI */
  habitus: number;
  indication: Indication;
  angiocad: {
    /** source row (the bootstrapped AngioCAD patient) */
    rowId: string;
    /** n of the conditioning table */
    n: number;
    grades: Record<AngioCadSegment, Grade>;
  };
  dominance: Dominance;
  risk: { diabetes: boolean; smoker: boolean; hypertension: boolean; dyslipidaemia: boolean };
  /** LV ejection fraction, % */
  lvef: number;
  /** target LV end-diastolic pressure, mmHg (model parameter) */
  lvedp: number;
  baseline: {
    hr: number;
    sbp: number;
    dbp: number;
    rhythm: "sinus" | "af";
    qtc: number;
    respRate: number;
  };
  renal: {
    creatinineMgDl: number;
    creatinineUmolL: number;
    /** Cockcroft-Gault creatinine clearance, mL/min (actual body weight) */
    crclMlMin: number;
    /** 2021 CKD-EPI creatinine eGFR, mL/min/1.73 m² */
    egfr: number;
    /** maximum acceptable contrast dose (Cigarroa), mL */
    macdMl: number;
  };
  allergies: { contrast: "none" | "previous-mild" | "previous-severe"; other: string[] };
  anticoagulation: "none" | "warfarin" | "doac";
  /** 0 calm … 1 very anxious */
  anxiety: number;
  /** 0 low … 1 very vagal */
  vagalTone: number;
  /** pain sensitivity multiplier (1 = average) */
  painSensitivity: number;
  radialDiamMm: number;
  rootSize: RootSize;
  /** heparin response: baseline ACT (s) and sensitivity multiplier */
  act: { baseline: number; sensitivity: number };
  /** the culprit segment for an acute coronary syndrome, if any */
  culprit: { segment: AngioCadSegment; grade: Grade } | null;
  // --- optional facts set by scenarios and presets (never drawn by generatePatient, so seeded
  // patients are unchanged); the engine and its formulary read them ---
  /** obstructive hypertrophic cardiomyopathy: the engine adds a dynamic LVOT obstruction */
  lvot?: { obstructive: boolean };
  /**
   * Aortic stenosis: the effective aortic valve orifice area, cm² (diag-pressure-transducer). The
   * engine applies it to the circulation after calibration, so the same arteries carry the
   * slow-rising, low-amplitude pulse of a narrowed valve. Absent: a normal valve.
   */
  aorticValveAreaCm2?: number;
  /** loss of systemic vascular tone at rest, 0..1 (vasoplegia, sepsis); applied after calibration */
  vasodilation?: number;
  /** a PDE-5 inhibitor taken before the procedure (nitrate interaction within its window) */
  pde5?: { agent: Pde5Agent; hoursAgo: number };
  /** the DOAC behind anticoagulation "doac", with the time since the last dose and its effect now 0..1 */
  doac?: { agent: DoacAgent; hoursSinceDose: number; effect?: number };
  /** contrast given in the recent past (a CT), counted against today's ceiling by contrastBudget */
  recentContrast?: { ml: number; daysAgo: number }[];
  /** a known accessory pathway (pre-excitation) */
  preExcitation?: boolean;
}

export interface PatientOptions {
  /** force an indication; otherwise drawn from the AngioCAD indication mix (n = 376) */
  indication?: Indication;
  sex?: Sex;
  ageY?: number;
}

const GRADE_BANDS: [number, number][] = [
  [0, 0],
  [1, 25],
  [26, 50],
  [51, 75],
  [76, 90],
  [91, 99],
  [100, 100],
];

export function gradeBand(g: Grade): [number, number] {
  return GRADE_BANDS[g];
}

const rowsByIndication: Record<Indication, AngioCadRow[]> = { SA: [], UA: [], NSTEMI: [], STEMI: [] };
for (const r of ANGIOCAD_ROWS) rowsByIndication[ANGIOCAD_INDICATIONS[r[1]]].push(r);

/**
 * Draw an AngioCAD row: indication by its empirical frequency (n = 376) unless forced, then a row
 * uniformly. Numeric seeds use a Weyl (golden-ratio) sequence for the row so that any run of
 * consecutive seeds covers the table evenly (variance reduction; each seed is still one patient);
 * other seeds use the seeded generator.
 */
function drawRow(rng: SeededRng, seed: string, ind?: Indication): AngioCadRow {
  const rows = ind ? rowsByIndication[ind] : ANGIOCAD_ROWS;
  const n = Number(seed);
  const u = Number.isInteger(n) && seed.trim() !== "" ? (((n * 0.6180339887498949 + 0.5) % 1) + 1) % 1 : rng.next();
  rng.next(); // keep the generator's stream identical for both kinds of seed
  return rows[Math.min(rows.length - 1, Math.floor(u * rows.length))];
}

// --- renal formulas (sourced; docs/realism/facts/S9.md) -----------------------

/** Cockcroft-Gault: ((140 − age) × weight) / (72 × SCr), × 0.85 if female. SCr in mg/dL. */
export function cockcroftGault(ageY: number, weightKg: number, scrMgDl: number, sex: Sex): number {
  return (((140 - ageY) * weightKg) / (72 * scrMgDl)) * (sex === "F" ? 0.85 : 1);
}

/** 2021 CKD-EPI creatinine: 142 × min(SCr/κ,1)^α × max(SCr/κ,1)^−1.200 × 0.9938^age × 1.012 [female]. */
export function ckdEpi2021(ageY: number, scrMgDl: number, sex: Sex): number {
  const k = sex === "F" ? 0.7 : 0.9;
  const a = sex === "F" ? -0.241 : -0.302;
  const r = scrMgDl / k;
  return 142 * Math.pow(Math.min(r, 1), a) * Math.pow(Math.max(r, 1), -1.2) * Math.pow(0.9938, ageY) * (sex === "F" ? 1.012 : 1);
}

/** Cigarroa maximum acceptable contrast dose: 5 mL × weight (kg) / SCr (mg/dL), at most 300 mL. */
export function cigarroaMacd(weightKg: number, scrMgDl: number): number {
  return Math.min(300, (5 * weightKg) / scrMgDl);
}

/** mg/dL → µmol/L for creatinine (molar mass 113.12 g/mol: 1 mg/dL = 88.4 µmol/L). */
export const CREATININE_UMOL_PER_MGDL = 88.4;

// --- generator ----------------------------------------------------------------

export function generatePatient(seed: string | number, opts: PatientOptions = {}): PatientProfile {
  const seedStr = String(seed);
  const rng = new SeededRng("patient:" + seedStr);
  const row = drawRow(rng, seedStr, opts.indication);
  const indication = ANGIOCAD_INDICATIONS[row[1]];
  const grades = {} as Record<AngioCadSegment, Grade>;
  ANGIOCAD_SEGMENTS.forEach((s, i) => (grades[s] = Number(row[7][i]) as Grade));

  const sex: Sex = opts.sex ?? row[3];
  // AngioCAD age when present (jitter ±2 y, model parameter, keeps patients distinct); otherwise
  // an age from another row with the same indication.
  let age0 = row[2];
  if (age0 === null) {
    const withAge = rowsByIndication[indication].filter((r) => r[2] !== null);
    age0 = rng.pick(withAge)[2] as number;
  }
  const ageY = Math.round(opts.ageY ?? Math.min(92, Math.max(21, age0 + rng.range(-2, 2))));

  // Height and weight: MODEL PARAMETERS (adult distributions, not fitted to a population source).
  const heightCm = Math.round(sex === "M" ? rng.clampedNormal(174, 7, 155, 198) : rng.clampedNormal(161, 6.5, 143, 182));
  const bmi = Math.round(rng.clampedNormal(27.5, 4.5, 18.5, 45) * 10) / 10;
  const weightKg = Math.round(bmi * (heightCm / 100) ** 2);
  // habitus for the imaging chain: model mapping of BMI onto the 0.85-1.25 range used by S4/S6
  const habitus = Math.round(Math.min(1.25, Math.max(0.85, 1 + (bmi - 26) * 0.022)) * 100) / 100;

  const flags = row[6];
  const risk = { diabetes: !!(flags & 1), smoker: !!(flags & 2), hypertension: !!(flags & 4), dyslipidaemia: !!(flags & 8) };

  // LVEF from the row; when missing, from another row with the same indication (120 of 412 lack it).
  let ef = row[4];
  if (ef === null) {
    const withEf = rowsByIndication[indication].filter((r) => r[4] !== null);
    ef = rng.pick(withEf)[4] as number;
  }
  const lvef = Math.round(Math.min(70, Math.max(15, ef + rng.range(-2.5, 2.5))));

  // Haemodynamics: MODEL PARAMETERS anchored on the SIM_FACTS item 18 normal of 120/80 mmHg.
  const acs = indication !== "SA";
  const hr = Math.round(rng.clampedNormal(70 + (acs ? 6 : 0) + (lvef < 35 ? 8 : 0), 10, 50, 112));
  const sbp = Math.round(rng.clampedNormal(128 + 0.35 * (ageY - 60) + (risk.hypertension ? 9 : 0) - (lvef < 35 ? 10 : 0), 15, 96, 185));
  const dbp = Math.round(Math.min(sbp - 28, Math.max(52, rng.clampedNormal(sbp * 0.58, 6, 52, 104))));
  const lvedp = Math.round(Math.min(32, Math.max(6, 11 + (55 - lvef) * 0.22 + (indication === "STEMI" ? 3 : 0) + rng.normal(0, 3))));
  // AF prevalence rising with age: MODEL PARAMETER
  const pAf = Math.min(0.25, Math.max(0.01, 0.015 + 0.004 * (ageY - 50)));
  const rhythm: "sinus" | "af" = rng.chance(pAf) ? "af" : "sinus";
  const qtc = Math.round(rng.clampedNormal(0.41, 0.018, 0.37, 0.47) * 1000) / 1000;
  const respRate = Math.round(rng.clampedNormal(15, 2, 10, 22));

  // Renal: creatinine distribution is a MODEL PARAMETER; the formulas are sourced.
  const scr0 = rng.logNormal(sex === "M" ? 0.95 : 0.78, 0.22) * (1 + Math.max(0, ageY - 60) * 0.008) * (risk.diabetes ? 1.12 : 1);
  const creatinineMgDl = Math.round(Math.min(4.5, Math.max(0.5, scr0)) * 100) / 100;
  const renal = {
    creatinineMgDl,
    creatinineUmolL: Math.round(creatinineMgDl * CREATININE_UMOL_PER_MGDL),
    crclMlMin: Math.round(cockcroftGault(ageY, weightKg, creatinineMgDl, sex)),
    egfr: Math.round(ckdEpi2021(ageY, creatinineMgDl, sex)),
    macdMl: Math.round(cigarroaMacd(weightKg, creatinineMgDl)),
  };

  // Allergies and anticoagulation: MODEL PARAMETERS
  const ar = rng.next();
  const contrastAllergy: PatientProfile["allergies"]["contrast"] = ar < 0.006 ? "previous-severe" : ar < 0.03 ? "previous-mild" : "none";
  const other: string[] = [];
  if (rng.chance(0.08)) other.push("penicillin");
  if (rng.chance(0.03)) other.push("latex");
  if (rng.chance(0.02)) other.push("iodine-containing antiseptic");
  const anticoagulation: PatientProfile["anticoagulation"] = rhythm === "af" ? (rng.chance(0.75) ? "doac" : "warfarin") : rng.chance(0.02) ? "doac" : "none";

  // Temperament: MODEL PARAMETERS
  const anxiety = Math.round(Math.min(1, Math.max(0, rng.normal(acs ? 0.55 : 0.45, 0.2))) * 100) / 100;
  const vagalTone = Math.round(Math.min(1, Math.max(0, rng.normal(0.35 - (ageY - 60) * 0.004, 0.18))) * 100) / 100;
  const painSensitivity = Math.round(rng.logNormal(1, 0.3) * 100) / 100;
  // Radial artery calibre: MODEL PARAMETER (sex and size dependent)
  const radialDiamMm = Math.round(rng.clampedNormal((sex === "M" ? 2.7 : 2.35) + (heightCm - 168) * 0.01, 0.35, 1.6, 3.8) * 100) / 100;
  const rootRoll = rng.next();
  const rootSize: RootSize = rootRoll < 0.12 + (sex === "F" ? 0.1 : 0) ? "small" : rootRoll > 0.9 - (ageY > 70 ? 0.08 : 0) ? "dilated" : "normal";
  // ACT response: MODEL PARAMETERS (baseline and spread; the slope is calibrated in pharmacology.ts)
  const act = { baseline: Math.round(rng.clampedNormal(120, 12, 90, 160)), sensitivity: Math.round(rng.logNormal(1, 0.3) * 100) / 100 };

  const dominance: Dominance = row[5] === "R" ? "right" : "left";
  return {
    seed: seedStr,
    sex,
    ageY,
    heightCm,
    weightKg,
    bmi,
    habitus,
    indication,
    angiocad: { rowId: row[0], n: ANGIOCAD_SOURCE.nWithIndication, grades },
    dominance,
    risk,
    lvef,
    lvedp,
    baseline: { hr, sbp, dbp, rhythm, qtc, respRate },
    renal,
    allergies: { contrast: contrastAllergy, other },
    anticoagulation,
    anxiety,
    vagalTone,
    painSensitivity,
    radialDiamMm,
    rootSize,
    act,
    culprit: acs ? culpritOf(grades) : null,
  };
}

// ---------------------------------------------------------------------------
// Named presets (found-patient-formulary): profiles that the formulary's tests and the labs'
// scenarios share. Each is a seeded patient with a few facts set; nothing here is drawn from a
// population source beyond generatePatient itself.
// ---------------------------------------------------------------------------

export type PresetId = "lcx-stemi" | "hcm-obstructive" | "vasodilated";

/**
 * A preset patient and the lesions it is built with.
 * - lcx-stemi: the PCI lab's lcx-stemi case (src/simulation/angioPci.ts, scenario "lcx-stemi"): a
 *   54-year-old man with an inferolateral STEMI and a thrombotic 99% LCx lesion at 0.42, 16 mm.
 * - hcm-obstructive: a stable patient with obstructive hypertrophic cardiomyopathy and no coronary
 *   disease (dynamic LVOT obstruction in the engine, MP_LVOT).
 * - vasodilated: a stable patient with no coronary disease and a 40% loss of vascular tone at rest
 *   (MODEL PARAMETER), the vasodilatory mechanism of the pressors lesson.
 */
export function presetPatient(id: PresetId, seed: string | number = id): { profile: PatientProfile; lesions: Lesion[] } {
  const clear = (p: PatientProfile): PatientProfile => {
    const grades = { ...p.angiocad.grades };
    for (const s of ANGIOCAD_SEGMENTS) grades[s] = 0;
    return { ...p, angiocad: { ...p.angiocad, grades }, culprit: null, baseline: { ...p.baseline, rhythm: "sinus" } };
  };
  switch (id) {
    case "lcx-stemi": {
      // the drawn anatomy is cleared so that the grades, the culprit and the lesion agree; the STEMI
      // baseline rhythm is kept
      const p = generatePatient(seed, { indication: "STEMI", sex: "M", ageY: 54 });
      const c = clear(p);
      const grades = { ...c.angiocad.grades, "Prox LCx": 5 as Grade };
      const lesions: Lesion[] = [{ vessel: "LCx", position: 0.42, severity: 99, kind: "thrombotic", lengthMm: 16 }];
      return { profile: { ...c, baseline: p.baseline, angiocad: { ...c.angiocad, grades }, culprit: { segment: "Prox LCx", grade: 5 } }, lesions };
    }
    case "hcm-obstructive": {
      const p = clear(generatePatient(seed, { indication: "SA" }));
      return { profile: { ...p, lvef: Math.max(60, p.lvef), lvot: { obstructive: true } }, lesions: [] };
    }
    case "vasodilated": {
      const p = clear(generatePatient(seed, { indication: "SA" }));
      return { profile: { ...p, vasodilation: 0.4 }, lesions: [] };
    }
  }
}

// ---------------------------------------------------------------------------
// Pre-procedure facts read by the full case's chart (proc-chart-planted-problems). Pure helpers:
// generatePatient draws none of this, so every seeded patient is unchanged.
// ---------------------------------------------------------------------------

/**
 * MODEL PARAMETERS (proc-chart-planted-problems; not population values):
 * - childbearingMaxAgeY: the age up to which a woman is taken to be of childbearing potential, for
 *   the pregnancy test the checklist asks for (Brilakis's checklist and Oxford's check-in name the
 *   group, not an age; src/content/manual/pci-manual/01-planning.ts, tests table and check-in steps);
 * - residual anticoagulant effect on the baseline ACT, s: a DOAC taken inside its hold window
 *   (dabigatran, a direct thrombin inhibitor, more), and warfarin per INR unit above 1.
 */
export const MP_PRE_PROCEDURE = {
  childbearingMaxAgeY: 50,
  doacActRiseS: 20,
  dabigatranActRiseS: 40,
  warfarinActRisePerInrS: 15,
};

/** A woman the checklist asks to be tested for pregnancy (MP_PRE_PROCEDURE.childbearingMaxAgeY). */
export function childbearingPotential(p: Pick<PatientProfile, "sex" | "ageY">): boolean {
  return p.sex === "F" && p.ageY <= MP_PRE_PROCEDURE.childbearingMaxAgeY;
}

/**
 * The rise in the baseline ACT (s) from an oral anticoagulant still acting: a DOAC within its hold
 * window (scaled by its effect now, default full) or warfarin at the INR given. MODEL PARAMETERS
 * (MP_PRE_PROCEDURE); 0 when neither applies.
 */
export function residualAnticoagActRiseS(o: { doac?: { agent: DoacAgent; effect?: number }; inr?: number | null }): number {
  if (o.doac) return Math.round((o.doac.agent === "dabigatran" ? MP_PRE_PROCEDURE.dabigatranActRiseS : MP_PRE_PROCEDURE.doacActRiseS) * Math.max(0, Math.min(1, o.doac.effect ?? 1)));
  if (o.inr && o.inr > 1) return Math.round(MP_PRE_PROCEDURE.warfarinActRisePerInrS * (o.inr - 1));
  return 0;
}

// ---------------------------------------------------------------------------
// Nitrate cautions and the chart's nitrate infusion (diag-lab-drugs). Pure helpers: generatePatient
// draws none of this, so every seeded patient and the engine's defaults are unchanged.
// ---------------------------------------------------------------------------

/**
 * Reasons not to give a nitrate, or to give less, from the module text (Brilakis 3.2 and 6.3, lesson
 * pm-lab-drugs-nitrates, src/content/manual/pci-manual/04-lab-drugs.ts:308-311): hypovolaemia (for
 * example fasted without IV fluid), right ventricular infarction, a PDE-5 inhibitor within its window
 * (24 h; 48 h for tadalafil, PDE5_WINDOW_H) and obstructive hypertrophic cardiomyopathy. A low
 * systolic pressure is the dose ladder's own concern (the attending's rule in
 * src/mentor/rules/diagDrugs.ts), not a fact of the patient.
 */
export type NitrateCaution = "pde5" | "rv-infarction" | "hypovolaemia" | "hocm";

/** Patient history a profile does not carry, from a scenario or the chart (an RV infarction, a fasted and dry patient). */
export type NitrateHistoryFact = "rv-infarction" | "hypovolaemia";

/**
 * The nitrate cautions of this patient now: a PDE-5 inhibitor still within its window `elapsedS`
 * after the profile was drawn (pde5Active, the formulary's own rule), an obstructive HCM profile, and
 * the history facts passed in. In the module text's order.
 */
export function nitrateCautions(p: Pick<PatientProfile, "pde5" | "lvot">, o: { elapsedS?: number; facts?: readonly NitrateHistoryFact[] } = {}): NitrateCaution[] {
  const out: NitrateCaution[] = [];
  if (o.facts?.includes("hypovolaemia")) out.push("hypovolaemia");
  if (o.facts?.includes("rv-infarction")) out.push("rv-infarction");
  if (pde5Active({ pde5: p.pde5 }, o.elapsedS ?? 0)) out.push("pde5");
  if (p.lvot?.obstructive) out.push("hocm");
  return out;
}

/**
 * A running IV nitrate infusion on the chart, µg/min: a drug with formulary id 'gtn' given IV whose
 * dose is written as a rate ("50 µg/min", "50 mcg/min" or "50 micrograms/min"), not held. Null when
 * there is none. The rate is the chart's; Brilakis's IV regimen runs from 10 µg/min to at most
 * 200 µg/min (04-lab-drugs.ts:254), and a rate outside it is not trusted (null).
 */
export function chartNitrateInfusionUgMin(chart: Pick<CaseChart, "drugs"> | undefined): number | null {
  for (const d of chart?.drugs ?? []) {
    if ((d.drugId ?? "").toLowerCase() !== "gtn" || d.held) continue;
    if (!/^iv$/i.test((d.route ?? "").trim())) continue;
    const m = (d.dose ?? "").match(/(\d+(?:\.\d+)?)\s*(?:µg|mcg|ug|micrograms?)\s*\/\s*min/i);
    if (!m) continue;
    const rate = Number(m[1]);
    if (rate >= NITRATE_INFUSION_RANGE_UG_MIN[0] && rate <= NITRATE_INFUSION_RANGE_UG_MIN[1]) return rate;
  }
  return null;
}

/** Brilakis's IV nitroglycerin range, µg/min: start at 10, at most 200 (3.2; 04-lab-drugs.ts:254). */
export const NITRATE_INFUSION_RANGE_UG_MIN: readonly [number, number] = [10, 200];

/** The most severe segment (ties: the more proximal in table order). */
export function culpritOf(grades: Record<AngioCadSegment, Grade>): { segment: AngioCadSegment; grade: Grade } | null {
  let best: AngioCadSegment | null = null;
  for (const s of ANGIOCAD_SEGMENTS) if (grades[s] >= 4 && (!best || grades[s] > grades[best])) best = s;
  return best ? { segment: best, grade: grades[best] } : null;
}

// ---------------------------------------------------------------------------
// Lesions
// ---------------------------------------------------------------------------

interface SegmentMap {
  vessel: VesselId;
  /** SYNTAX labels that make up this AngioCAD segment (coronaryGrowth.ts labelling) */
  syntax: string[];
  /** fraction of the SYNTAX span covered by this AngioCAD segment */
  part: [number, number];
  /** position along the named vessel when no tree is given (model fallback) */
  fallback: number;
}

/** AngioCAD segment → simulator vessel and SYNTAX segment(s). Left dominance moves PDA/PLB to the LCx system. */
export function segmentMap(seg: AngioCadSegment, dominance: Dominance): SegmentMap {
  const left = dominance === "left";
  switch (seg) {
    case "LM":
      return { vessel: "LM", syntax: ["5"], part: [0.2, 0.8], fallback: 0.5 };
    case "Prox LAD":
      return { vessel: "LAD", syntax: ["6"], part: [0.15, 0.85], fallback: 0.12 };
    case "Mid LAD":
      return { vessel: "LAD", syntax: ["7"], part: [0.1, 0.9], fallback: 0.42 };
    case "Dist LAD":
      return { vessel: "LAD", syntax: ["8"], part: [0.1, 0.7], fallback: 0.75 };
    case "D1":
      return { vessel: "D1", syntax: ["9"], part: [0.05, 0.5], fallback: 0.2 };
    case "D2":
      return { vessel: "D2", syntax: ["10"], part: [0.05, 0.5], fallback: 0.2 };
    case "Prox LCx":
      return { vessel: "LCx", syntax: ["11"], part: [0.15, 0.85], fallback: 0.15 };
    case "Mid LCx":
      return { vessel: "LCx", syntax: ["13"], part: [0.05, 0.45], fallback: 0.45 };
    case "Dist LCx":
      return { vessel: "LCx", syntax: ["13"], part: [0.55, 0.9], fallback: 0.78 };
    case "OM":
      return { vessel: "OM1", syntax: ["12a"], part: [0.05, 0.5], fallback: 0.25 };
    case "Prox RCA":
      return { vessel: "RCA", syntax: ["1"], part: [0.15, 0.9], fallback: 0.12 };
    case "Mid RCA":
      return { vessel: "RCA", syntax: ["2"], part: [0.1, 0.9], fallback: 0.42 };
    case "Dist RCA":
      return { vessel: "RCA", syntax: ["3"], part: [0.1, 0.85], fallback: 0.72 };
    case "PDA":
      return { vessel: "PDA", syntax: [left ? "15" : "4"], part: [0.05, 0.5], fallback: 0.25 };
    case "PLB":
      return { vessel: "PLV", syntax: [left ? "14" : "16"], part: [0.05, 0.5], fallback: 0.25 };
  }
}

function syntaxParamRange(tree: CoronaryTree, vessel: VesselId, labels: string[]): [number, number] | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of tree.vessels) {
    if (v.lesionId !== vessel || !v.segment) continue;
    for (let i = 0; i < v.segment.length; i++) {
      const s = v.segment[i];
      if (s && labels.includes(s)) {
        lo = Math.min(lo, v.param[i]);
        hi = Math.max(hi, v.param[i]);
      }
    }
  }
  return lo < hi ? [lo, hi] : null;
}

/**
 * Lesion kind. Only the culprit of an acute coronary syndrome is thrombotic; every other total
 * occlusion (in any indication) is taken as a chronic total occlusion with collaterals, which is
 * the usual finding for a non-culprit occlusion.
 */
function lesionKind(seg: AngioCadSegment, g: Grade, ind: Indication, isCulprit: boolean): PathologyKind {
  if (g === 6) return isCulprit && ind !== "SA" ? "thrombotic" : "cto";
  if (isCulprit && ind !== "SA" && g >= 4) return "thrombotic";
  if (seg === "LM" && g >= 3) return "left-main";
  if (g >= 4) return "severe-stenosis";
  if (g === 3) return "moderate-stenosis";
  return "mild-irregularity";
}

/**
 * Lesions for a patient. Severity is uniform within the published band; position is inside the
 * SYNTAX span of the segment when a coronary tree is given (S3b labels), else a fallback position.
 * Lesion length: MODEL PARAMETER (log-normal, median 12 mm; 18 mm for occlusions).
 */
export function lesionsFromProfile(p: PatientProfile, tree?: CoronaryTree): Lesion[] {
  const rng = new SeededRng("lesions:" + p.seed);
  const out: Lesion[] = [];
  for (const seg of ANGIOCAD_SEGMENTS) {
    const g = p.angiocad.grades[seg];
    if (g === 0) continue;
    const m = segmentMap(seg, p.dominance);
    const span = tree ? syntaxParamRange(tree, m.vessel, m.syntax) : null;
    const u = m.part[0] + rng.next() * (m.part[1] - m.part[0]);
    const position = span ? span[0] + u * (span[1] - span[0]) : m.fallback + (u - 0.5) * 0.08;
    const [lo, hi] = GRADE_BANDS[g];
    const severity = g === 6 ? 100 : Math.round(lo + rng.next() * (hi - lo));
    const isCulprit = p.culprit?.segment === seg;
    out.push({
      vessel: m.vessel,
      position: Math.round(Math.min(0.97, Math.max(0.02, position)) * 1000) / 1000,
      severity,
      kind: lesionKind(seg, g, p.indication, isCulprit),
      lengthMm: Math.round(Math.min(35, Math.max(5, rng.logNormal(g === 6 ? 18 : 12, 0.35)))),
    });
  }
  return out;
}

/** Pathology summary for an AnatomyCase built from this patient. */
function pathologyFor(lesions: Lesion[]): PathologyKind {
  if (!lesions.length) return "none";
  const worst = [...lesions].sort((a, b) => b.severity - a.severity)[0];
  if (worst.vessel === "LM" && worst.severity >= 50) return "left-main";
  if (worst.kind === "cto" || worst.kind === "thrombotic") return worst.kind;
  if (worst.vessel === "LAD" && worst.severity >= 90) return "critical-lad";
  if (worst.severity >= 70) return "severe-stenosis";
  if (worst.severity >= 50) return "moderate-stenosis";
  return "mild-irregularity";
}

/**
 * Attach the patient to an existing case: dominance, root size and lesions come from the patient.
 * (caseGenerator.ts is owned elsewhere; this is the helper it calls, see docs/realism/wave1/S9.md.)
 */
export function caseWithPatient(c: AnatomyCase, p: PatientProfile, tree?: CoronaryTree): AnatomyCase {
  const lesions = lesionsFromProfile(p, tree);
  return { ...c, dominance: p.dominance, rootSize: p.rootSize, lesions, pathology: pathologyFor(lesions) };
}

/** A one-line referral vignette generated from the same sample (for the chart review). */
export function vignette(p: PatientProfile): string {
  const sex = p.sex === "M" ? "man" : "woman";
  const rf = [p.risk.diabetes && "diabetes", p.risk.hypertension && "hypertension", p.risk.dyslipidaemia && "dyslipidaemia", p.risk.smoker && "current smoker"].filter(Boolean).join(", ");
  const rhythm = p.baseline.rhythm === "af" ? "atrial fibrillation" : "sinus rhythm";
  return `${p.ageY}-year-old ${sex}, ${INDICATION_LABEL[p.indication].toLowerCase()}. ${rf ? rf[0].toUpperCase() + rf.slice(1) + ". " : ""}${rhythm[0].toUpperCase() + rhythm.slice(1)}, BP ${p.baseline.sbp}/${p.baseline.dbp}, HR ${p.baseline.hr}. LVEF ${p.lvef}%. Creatinine ${p.renal.creatinineUmolL} µmol/L (CrCl ${p.renal.crclMlMin} mL/min). Weight ${p.weightKg} kg.${p.allergies.contrast !== "none" ? " Previous contrast reaction." : ""}${p.anticoagulation !== "none" ? ` On ${p.anticoagulation === "doac" ? "a DOAC" : "warfarin"}.` : ""}`;
}

/** Numeric fingerprint of the haemodynamic parameters (tests: no two seeds identical). */
export function haemoFingerprint(p: PatientProfile): string {
  return [p.baseline.hr, p.baseline.sbp, p.baseline.dbp, p.lvef, p.lvedp, p.weightKg, p.baseline.qtc, p.baseline.rhythm].join("|");
}

export { ANGIOCAD_GRADES, ANGIOCAD_SEGMENTS, hashSeed };
