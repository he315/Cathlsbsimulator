// ---------------------------------------------------------------------------
// Contrast ceilings: one module that every lab reads (PCI lab, diagnostic lab,
// full case), so the ceiling, the warning and the announcements are computed
// the same way everywhere.
//
// Rules, as the module text states them:
// - Brilakis: stop before contrast volume (mL) reaches 3.7 × GFR (mL/min)
//   (lesson cm-patient-complications-contrast, src/content/manual/
//   complication-management/05-patient-complications.ts:698-699, Brilakis 2.6
//   and 1.1), lower in chronic kidney disease or a single kidney, counting
//   recent contrast such as a CT. In CTO PCI his stopping rule uses the
//   estimated creatinine clearance: "contrast above 3.7 × creatinine
//   clearance" (cath-handbook/03-safe-practice.ts:861).
// - Oxford: no more than 5–7 mL/kg depending on the agent (Oxford ch 4,
//   05-patient-complications.ts:710-711); it ignores renal function.
// - Advanced kidney disease (eGFR below 30): ideally less contrast than the
//   creatinine clearance; a ratio above 2 predicts injury (Brilakis 28.3,
//   05-patient-complications.ts:704-705). Reported as an advisory.
//
// MODEL PARAMETERS (CONTRAST_BUDGET_DEFAULTS, docs/realism/facts/S9.md): the
// warning threshold (80% of the stricter ceiling), the announcement points
// (50% and 100%), the Oxford figure used by default (5 mL/kg, the stricter end
// of the stated range) and the window within which earlier contrast counts
// (7 days: "how long to wait after a CT is not stated in either book",
// 05-patient-complications.ts:735).
// ---------------------------------------------------------------------------

import type { PatientProfile } from "./patient";

export interface RuleSource {
  /** the manual and its section */
  book: string;
  /** location in the module text (src/content/manual/…, file:line) */
  where: string;
}

export interface ContrastRule {
  id: "brilakis-gfr" | "brilakis-crcl-cto" | "oxford-weight";
  label: string;
  /** the formula as the manual states it */
  formula: string;
  /** the ceiling before recent contrast is subtracted, mL */
  ceilingMl: number;
  /** the ceiling left for today after recent contrast, mL (never below 0) */
  availableMl: number;
  source: RuleSource;
}

export interface ContrastAdvisory {
  id: "advanced-ckd-below-crcl";
  text: string;
  /** the advised limit, mL */
  limitMl: number;
  source: RuleSource;
}

export interface ContrastBudgetInput {
  /** eGFR, mL/min/1.73 m² (the Brilakis rule's GFR) */
  egfr: number;
  /** calculated creatinine clearance, mL/min (CTO rule and the advanced-CKD advisory) */
  crclMlMin?: number;
  weightKg: number;
  /** CTO PCI: Brilakis's rule uses the creatinine clearance */
  cto?: boolean;
  /** contrast already given today in this procedure, mL */
  usedMl?: number;
  /** contrast given before today's procedure (a CT), counted within the recent window */
  recent?: { ml: number; daysAgo: number }[];
  /** Oxford mL/kg figure (5–7 by agent; default CONTRAST_BUDGET_DEFAULTS.oxfordMlPerKg) */
  oxfordMlPerKg?: number;
  /** warning threshold as a fraction of the stricter ceiling (default 0.8) */
  warnFraction?: number;
  /** announcement points as fractions of the stricter ceiling (default 0.5 and 1) */
  announceAt?: number[];
  /** recent window, days (default 7) */
  recentWindowDays?: number;
  /** a planned limit set at the brief, mL, used instead of the stricter rule when lower */
  planMl?: number;
}

export interface ContrastBudget {
  rules: ContrastRule[];
  advisories: ContrastAdvisory[];
  /** recent contrast counted against today's ceiling, mL */
  recentMl: number;
  /** the rule with the lower available ceiling */
  stricter: ContrastRule;
  /** the ceiling used for today, mL: the stricter rule's available ceiling, or the plan if lower */
  ceilingMl: number;
  usedMl: number;
  remainingMl: number;
  /** used / ceiling */
  fraction: number;
  /** warning at this volume, mL */
  warnAtMl: number;
  warnFraction: number;
  /** announcement volumes, mL, with their fractions */
  announcements: { fraction: number; ml: number }[];
  status: "ok" | "warn" | "over";
}

/** Defaults (MODEL PARAMETERS except where the comment names a source). */
export const CONTRAST_BUDGET_DEFAULTS = {
  /** Brilakis's multiplier (sourced: 3.7 × GFR) */
  brilakisMultiplier: 3.7,
  /** Oxford's stated range, mL/kg (sourced) */
  oxfordRangeMlPerKg: [5, 7] as [number, number],
  /** Oxford figure used unless the agent's is given: the stricter end (MODEL) */
  oxfordMlPerKg: 5,
  /** warning threshold, fraction of the stricter ceiling (MODEL, LAB_BUILD_PLAN section 4) */
  warnFraction: 0.8,
  /** announcements, fractions of the stricter ceiling (MODEL, LAB_BUILD_PLAN section 4) */
  announceAt: [0.5, 1] as number[],
  /** days within which earlier contrast counts (MODEL: neither manual states it) */
  recentWindowDays: 7,
  /** eGFR below which the advanced-CKD advisory applies (sourced, Brilakis 28.3) */
  advancedCkdEgfr: 30,
};

export const CONTRAST_RULE_SOURCES: Record<ContrastRule["id"] | ContrastAdvisory["id"], RuleSource> = {
  "brilakis-gfr": { book: "Brilakis 2.6 and 1.1", where: "complication-management/05-patient-complications.ts:698" },
  "brilakis-crcl-cto": { book: "Brilakis (CTO stopping rules)", where: "cath-handbook/03-safe-practice.ts:861" },
  "oxford-weight": { book: "Oxford ch 4", where: "complication-management/05-patient-complications.ts:710" },
  "advanced-ckd-below-crcl": { book: "Brilakis 28.3", where: "complication-management/05-patient-complications.ts:704" },
};

const round1 = (x: number) => Math.round(x * 10) / 10;

/** Both ceilings, the stricter one, recent contrast, the warning and the announcement points. */
export function contrastBudget(i: ContrastBudgetInput): ContrastBudget {
  const D = CONTRAST_BUDGET_DEFAULTS;
  const windowD = i.recentWindowDays ?? D.recentWindowDays;
  const recentMl = (i.recent ?? []).filter((r) => r.daysAgo >= 0 && r.daysAgo <= windowD).reduce((a, r) => a + Math.max(0, r.ml), 0);
  const avail = (c: number) => round1(Math.max(0, c - recentMl));
  const rules: ContrastRule[] = [];
  if (i.cto && i.crclMlMin !== undefined) {
    const c = round1(D.brilakisMultiplier * i.crclMlMin);
    rules.push({ id: "brilakis-crcl-cto", label: "Brilakis: 3.7 × creatinine clearance (CTO)", formula: "Stop before contrast (mL) exceeds 3.7 × creatinine clearance (mL/min)", ceilingMl: c, availableMl: avail(c), source: CONTRAST_RULE_SOURCES["brilakis-crcl-cto"] });
  } else {
    const c = round1(D.brilakisMultiplier * i.egfr);
    rules.push({ id: "brilakis-gfr", label: "Brilakis: 3.7 × GFR", formula: "Stop before contrast (mL) reaches 3.7 × GFR (mL/min)", ceilingMl: c, availableMl: avail(c), source: CONTRAST_RULE_SOURCES["brilakis-gfr"] });
  }
  const mlKg = i.oxfordMlPerKg ?? D.oxfordMlPerKg;
  const ox = round1(mlKg * i.weightKg);
  rules.push({ id: "oxford-weight", label: `Oxford: ${mlKg} mL/kg`, formula: "No more than 5–7 mL/kg, depending on the agent", ceilingMl: ox, availableMl: avail(ox), source: CONTRAST_RULE_SOURCES["oxford-weight"] });
  const advisories: ContrastAdvisory[] = [];
  if (i.egfr < D.advancedCkdEgfr && i.crclMlMin !== undefined) {
    advisories.push({ id: "advanced-ckd-below-crcl", text: "eGFR below 30: ideally less contrast (mL) than the creatinine clearance (mL/min); a ratio above 2 predicts injury.", limitMl: round1(i.crclMlMin), source: CONTRAST_RULE_SOURCES["advanced-ckd-below-crcl"] });
  }
  const stricter = rules.reduce((a, b) => (b.availableMl < a.availableMl ? b : a));
  const ceilingMl = i.planMl !== undefined && i.planMl < stricter.availableMl ? round1(Math.max(0, i.planMl)) : stricter.availableMl;
  const usedMl = Math.max(0, i.usedMl ?? 0);
  const warnFraction = i.warnFraction ?? D.warnFraction;
  const fraction = ceilingMl > 0 ? usedMl / ceilingMl : usedMl > 0 ? Infinity : 0;
  return {
    rules,
    advisories,
    recentMl,
    stricter,
    ceilingMl,
    usedMl,
    remainingMl: round1(Math.max(0, ceilingMl - usedMl)),
    fraction,
    warnAtMl: round1(ceilingMl * warnFraction),
    warnFraction,
    announcements: (i.announceAt ?? D.announceAt).map((f) => ({ fraction: f, ml: round1(ceilingMl * f) })),
    status: fraction >= 1 ? "over" : fraction >= warnFraction ? "warn" : "ok",
  };
}

/** The budget for a generated patient (eGFR and creatinine clearance from the profile, recent contrast from it). */
export function contrastBudgetForProfile(p: PatientProfile, opts: Omit<ContrastBudgetInput, "egfr" | "crclMlMin" | "weightKg"> = {}): ContrastBudget {
  return contrastBudget({ ...opts, egfr: p.renal.egfr, crclMlMin: p.renal.crclMlMin, weightKg: p.weightKg, recent: opts.recent ?? p.recentContrast });
}

/**
 * The announcement and warning points crossed between two running totals (fractions of the
 * ceiling, in order), for a lab that announces each once.
 */
export function crossedPoints(budget: ContrastBudget, prevMl: number, nowMl: number): number[] {
  const points = [...new Set([...budget.announcements.map((a) => a.fraction), budget.warnFraction])].sort((a, b) => a - b);
  if (!(budget.ceilingMl > 0)) return nowMl > prevMl && prevMl <= 0 ? points : [];
  return points.filter((f) => prevMl < f * budget.ceilingMl && nowMl >= f * budget.ceilingMl);
}
