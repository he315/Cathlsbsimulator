// ---------------------------------------------------------------------------
// Pre-brief and time-out.
//
// Before the case the learner commits to a plan (access, first and backup
// catheters, planned views, contrast budget, anticipated difficulty; for PCI
// the guide, wire, strategy and heparin) and answers 2-4 case questions. A
// time-out checklist must be completed before the beam is enabled in
// supervised and exam modes (visibility.ts beamAllowed). NatSSIPs 2 places the
// Time Out as the final check before the procedure (facts/S11.md). The debrief
// compares the plan with what happened.
// ---------------------------------------------------------------------------

import type { AccessRoute, CaseChart } from "../types";
import { contrastBudget, CONTRAST_BUDGET_DEFAULTS } from "../simulation/patient/contrastBudget";
import { PDE5_WINDOW_H, type Pde5Agent } from "../simulation/patient/pharmacology";
import type { ChartProblem } from "../simulation/diagnosticScenarios";
import type { WireKind } from "../simulation/angioPci";
import type { Analysis } from "./analysis";
import { viewFamily } from "./coverage";

export interface ProcedurePlan {
  access: AccessRoute;
  catheters: { left?: string; right?: string; backup: string[] };
  /** planned views as view preset ids (data/viewPresets.ts) */
  plannedViews: string[];
  contrastBudgetMl: number;
  /** free-text or picked anticipated difficulties */
  anticipated: string[];
  // PCI
  guide?: string;
  wire?: WireKind;
  strategy?: "direct-stent" | "predilate" | "prep-calcium" | "aspirate-thrombus" | "dual-injection";
  heparinUnitsPerKg?: number;
}

export interface PrebriefOption {
  id: string;
  text: string;
}

export interface PrebriefQuestion {
  id: string;
  prompt: string;
  options: PrebriefOption[];
  /** ids of acceptable options */
  correct: string[];
  /** shown after the answer */
  teaching: string;
}

export interface Prebrief {
  key: string;
  title: string;
  /** the case as the attending would present it at the table */
  presentation: string;
  questions: PrebriefQuestion[];
  /** sensible defaults for the plan form (never the answer to a question) */
  planDefaults: Partial<ProcedurePlan>;
}

export interface TimeOutItem {
  id: string;
  text: string;
  /** PCI only */
  pci?: boolean;
}

/** The time-out checklist, adapted for the cath lab from the NatSSIPs Time Out step. */
export const TIME_OUT_ITEMS: TimeOutItem[] = [
  { id: "patient", text: "Patient identity, procedure and indication confirmed" },
  { id: "allergy", text: "Contrast allergy or previous contrast reaction checked" },
  { id: "renal", text: "Renal function reviewed and contrast budget agreed" },
  { id: "anticoag", text: "Anticoagulation and antiplatelet status known" },
  { id: "access", text: "Access site and route agreed, with a backup" },
  { id: "devices", text: "Catheters, wires and backup devices available" },
  { id: "heparin", text: "Heparin plan and activated clotting time check agreed", pci: true },
];

export interface TimeOutState {
  checked: Record<string, boolean>;
  completedAt?: number;
}

export function timeOutItems(lab: "diagnostic" | "pci"): TimeOutItem[] {
  return TIME_OUT_ITEMS.filter((i) => !i.pci || lab === "pci");
}

export function timeOutComplete(state: TimeOutState, lab: "diagnostic" | "pci"): boolean {
  return timeOutItems(lab).every((i) => state.checked[i.id]);
}

export interface AnswerResult {
  questionId: string;
  chosen: string;
  correct: boolean;
}

export function gradeAnswers(qs: PrebriefQuestion[], answers: Record<string, string>): AnswerResult[] {
  return qs.map((q) => ({ questionId: q.id, chosen: answers[q.id] ?? "", correct: q.correct.includes(answers[q.id] ?? "") }));
}

// --- plan versus execution ------------------------------------------------------

export interface PlanItem {
  id: string;
  label: string;
  planned: string;
  actual: string;
  /** true when execution matched the plan, false when it did not, null when not comparable */
  kept: boolean | null;
}

/**
 * Compare the plan with the recorded case. Planned views are matched by view
 * family (coverage.ts viewFamily), since operators adjust the angles per patient.
 */
export function planVsExecution(plan: ProcedurePlan, a: Analysis, presets: { id: string; cArm: { laoRao: number; cranialCaudal: number } }[]): PlanItem[] {
  const items: PlanItem[] = [];
  const used = a.catheters.map((c) => c.id).filter((x) => x !== "initial" && x !== "?");
  const first = used[0] ?? (typeof a.events.find((e) => e.kind === "catheter")?.data?.id === "string" ? String(a.events.find((e) => e.kind === "catheter")!.data!.id) : "");
  const plannedFirst = [plan.catheters.left, plan.catheters.right].filter(Boolean) as string[];
  if (plannedFirst.length) {
    const kept = plannedFirst.every((c) => used.includes(c));
    items.push({ id: "catheters", label: "Catheters", planned: plannedFirst.join(", "), actual: used.length ? used.join(" then ") : first || "none recorded", kept });
  }
  if (plan.catheters.backup.length) {
    const backupUsed = used.filter((c) => !plannedFirst.includes(c));
    items.push({
      id: "backup",
      label: "Backup catheter",
      planned: plan.catheters.backup.join(", "),
      actual: backupUsed.length ? backupUsed.join(", ") : "not needed",
      kept: backupUsed.length ? backupUsed.every((c) => plan.catheters.backup.includes(c)) : null,
    });
  }
  if (plan.plannedViews.length) {
    const acquired = new Set(a.runs.filter((r) => r.diagnostic).map((r) => viewFamily(r.cArm)));
    const plannedFam = plan.plannedViews.map((id) => {
      const p = presets.find((x) => x.id === id);
      return { id, fam: p ? viewFamily(p.cArm) : id };
    });
    const missed = plannedFam.filter((p) => !acquired.has(p.fam));
    items.push({
      id: "views",
      label: "Planned views",
      planned: plannedFam.map((p) => p.fam).join(", "),
      actual: [...acquired].join(", ") || "none",
      kept: missed.length === 0,
    });
  }
  const ml = a.injections.reduce((s, e) => s + (typeof e.data?.ml === "number" ? e.data.ml : 0), 0);
  if (plan.contrastBudgetMl > 0) items.push({ id: "contrast", label: "Contrast budget", planned: `${plan.contrastBudgetMl} mL`, actual: `${Math.round(ml)} mL`, kept: ml <= plan.contrastBudgetMl });
  if (plan.anticipated.length) {
    const happened = a.events.filter((e) => e.kind === "complication" || e.kind === "engagement").map((e) => String(e.data?.kind ?? e.data?.to ?? ""));
    items.push({ id: "anticipated", label: "Anticipated difficulty", planned: plan.anticipated.join("; "), actual: happened.includes("in-lv") ? "LV entry occurred" : a.approaches.some((x) => !x.success) ? `${a.approaches.filter((x) => !x.success).length} failed approaches` : "smooth", kept: null });
  }
  return items;
}

/** Deterministic option shuffle (so stored order, where the answer is often first, is never the display order). */
export function shuffleOptions(qn: PrebriefQuestion, seed: string): PrebriefQuestion {
  let h = 2166136261;
  for (const ch of seed + "|" + qn.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const opts = qn.options.slice();
  for (let i = opts.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { ...qn, options: opts };
}

// --- the patient chart (diag-scenario-registry) ------------------------------------
//
// A named scenario carries a chart (src/types CaseChart). The pre-brief shows it as the operator
// would read it, and the attending asks about the problems planted in it: pregnancy status not
// documented, a PDE-5 inhibitor within its window, the eGFR ceiling, a previous radiation skin
// injury and, after CABG, the operation note. Each question cites the module text it is written
// from; nothing in the chart is flagged as the problem.

export interface ChartRow {
  id: string;
  label: string;
  value: string;
}

const PREGNANCY_TEXT: Record<NonNullable<CaseChart["pregnancy"]>, string | null> = {
  "not-applicable": null,
  "test-negative": "Pregnancy test negative",
  "test-not-done": "Not documented",
  possible: "Possibly pregnant",
  pregnant: "Pregnant",
};

const CONSENT_TEXT: Record<NonNullable<CaseChart["consentScope"]>, string> = {
  "diagnostic-only": "Diagnostic angiography only",
  "diagnostic-and-ad-hoc-pci": "Diagnostic angiography and ad hoc PCI",
  "planned-pci": "Planned PCI",
};

const hours = (h: number) => (h === 1 ? "1 hour" : `${h} hours`);

/** The chart as rows for the pre-brief (only what the chart records). */
export function chartRows(chart: CaseChart): ChartRow[] {
  const rows: ChartRow[] = [];
  const add = (id: string, label: string, value: string | null | undefined) => {
    if (value) rows.push({ id, label, value });
  };
  add("patient", "Patient", `${chart.ageY}-year-old ${chart.sex === "F" ? "woman" : "man"}, ${chart.heightCm} cm, ${chart.weightKg} kg`);
  const renal = [chart.creatinineUmolL !== undefined ? `creatinine ${chart.creatinineUmolL} µmol/L` : null, chart.egfr !== undefined ? `eGFR ${chart.egfr} mL/min/1.73 m²` : null].filter(Boolean).join(", ");
  // sentence case for "creatinine ..."; "eGFR" keeps its own capitalisation
  add("renal", "Renal function", renal ? (renal.startsWith("eGFR") ? renal : renal[0].toUpperCase() + renal.slice(1)) : null);
  if (chart.echo) {
    const bits = [chart.echo.lvef !== undefined ? `LVEF ${chart.echo.lvef}%` : null, ...(chart.echo.valves ?? []).map((v) => `${v.severity} ${v.valve} ${v.lesion}`)].filter(Boolean).join("; ");
    add("echo", "Echo", [bits, chart.echo.note].filter(Boolean).join(". ") || null);
  }
  add(
    "drugs",
    "Medicines",
    (chart.drugs ?? [])
      .map((d) => `${d.name}${d.dose ? ` ${d.dose}` : ""}${d.route ? ` (${d.route})` : ""}${d.held ? ", held" : ""}${d.lastDoseHoursAgo !== undefined ? `, last dose ${hours(d.lastDoseHoursAgo)} ago` : ""}`)
      .join("; ") || null
  );
  if (chart.allergies) {
    const c = chart.allergies.contrast;
    const parts = [c === "previous-severe" ? "Previous severe contrast reaction" : c === "previous-mild" ? "Previous mild contrast reaction" : c === "none" ? "No previous contrast reaction" : null, ...(chart.allergies.other ?? [])];
    add("allergies", "Allergies", parts.filter(Boolean).join("; ") || null);
  }
  add("pregnancy", "Pregnancy status", chart.pregnancy ? PREGNANCY_TEXT[chart.pregnancy] : null);
  add("prior", "Previous procedures under fluoroscopy", (chart.priorFluoroProcedures ?? []).map((p) => `${p.procedure}, ${p.daysAgo} days ago${p.airKermaGy !== undefined ? ` (air kerma ${p.airKermaGy} Gy)` : ""}`).join("; ") || null);
  add("skin", "Skin", (chart.skinFindings ?? []).join("; ") || null);
  add("operation", "Operation note", chart.operationNote);
  const arm = chart.armPressures;
  if (arm) add("arms", "Arm pressures", [arm.left ? `left ${arm.left.systolic}/${arm.left.diastolic}` : null, arm.right ? `right ${arm.right.systolic}/${arm.right.diastolic}` : null].filter(Boolean).join(", ") || null);
  const a = chart.arrestHistory;
  if (a) {
    const bits = [a.rhythm && a.rhythm !== "unknown" ? `first rhythm ${a.rhythm.toUpperCase()}` : null, a.witnessed !== undefined ? (a.witnessed ? "witnessed" : "unwitnessed") : null, a.minutesToRosc !== undefined ? `return of circulation after ${a.minutesToRosc} min` : null].filter(Boolean).join(", ");
    add("arrest", "Cardiac arrest", [bits ? bits[0].toUpperCase() + bits.slice(1) : null, a.note].filter(Boolean).join(". ") || null);
  }
  add("catheters", "Catheters that worked before", (chart.previousCatheters ?? []).map((p) => `${p.catheterId} (${p.target})${p.route ? ` via ${p.route.replace("-", " ")}` : ""}`).join("; ") || null);
  add("consent", "Consent", chart.consentScope ? CONSENT_TEXT[chart.consentScope] : null);
  return rows;
}

/** The PDE-5 inhibitor on the chart whose last dose is within its window, if any (PDE5_WINDOW_H, Brilakis 3.2). */
export function pde5WithinWindow(chart: CaseChart): { name: string; agent: Pde5Agent; hoursAgo: number; windowH: number } | null {
  for (const d of chart.drugs ?? []) {
    const id = (d.drugId ?? d.name).toLowerCase();
    if (!(id in PDE5_WINDOW_H) || d.lastDoseHoursAgo === undefined) continue;
    const windowH = PDE5_WINDOW_H[id as Pde5Agent];
    if (d.lastDoseHoursAgo < windowH) return { name: d.name, agent: id as Pde5Agent, hoursAgo: d.lastDoseHoursAgo, windowH };
  }
  return null;
}

/**
 * The questions the attending asks about the problems planted in a chart, most pressing first.
 * `planted` (a scenario's list) limits them to those problems; without it every problem the chart
 * shows is asked about, except the eGFR ceiling, which is then asked only below the eGFR of
 * Brilakis's advanced-CKD advisory (CONTRAST_BUDGET_DEFAULTS.advancedCkdEgfr, Brilakis 28.3).
 */
export function chartQuestions(chart: CaseChart | undefined, planted?: readonly ChartProblem[]): PrebriefQuestion[] {
  if (!chart) return [];
  const asks = (p: ChartProblem) => (planted ? planted.includes(p) : p !== "egfr-ceiling" || (chart.egfr !== undefined && chart.egfr < CONTRAST_BUDGET_DEFAULTS.advancedCkdEgfr));
  const qs: PrebriefQuestion[] = [];
  // pregnancy status not documented (Oxford ch 1 and ch 2; cath-handbook/01-lab-and-radiation.ts:603)
  if (asks("pregnancy") && chart.sex === "F" && (chart.pregnancy === "test-not-done" || chart.pregnancy === "possible")) {
    qs.push({
      id: "chart-pregnancy",
      prompt: "Her pregnancy status is not documented. Before the first exposure you:",
      options: [
        { id: "confirm", text: "Confirm and document her pregnancy status, following local policy" },
        { id: "low-rate", text: "Go ahead at a low frame rate" },
        { id: "apron", text: "Go ahead with a lead apron over her abdomen" },
        { id: "after", text: "Ask her after the procedure" },
      ],
      correct: ["confirm"],
      teaching:
        "In a woman of child-bearing potential, pregnancy status is confirmed and documented before any imaging (Oxford ch 1 and ch 2; Brilakis's checklist asks for a pregnancy test). Low frame-rate imaging is what Oxford suggests only when an essential procedure must go ahead in pregnancy.",
    });
  }
  // a PDE-5 inhibitor within its window (Brilakis 3.2; pci-manual/04-lab-drugs.ts:310)
  const pde5 = asks("pde5") ? pde5WithinWindow(chart) : null;
  if (pde5) {
    const windows = `avanafil, sildenafil or vardenafil within ${PDE5_WINDOW_H.sildenafil} hours, tadalafil within ${PDE5_WINDOW_H.tadalafil} hours`;
    qs.push({
      id: "chart-pde5",
      prompt: `The chart records ${pde5.name.toLowerCase()} ${hours(pde5.hoursAgo)} ago. If a narrowing looks like spasm, what about intracoronary nitroglycerin?`,
      options: [
        { id: "none", text: "No nitrate: the PDE-5 inhibitor is still within its window" },
        { id: "smaller", text: "A smaller dose is safe" },
        { id: "fluid", text: "Give it after a fluid bolus" },
        { id: "pressor", text: "Give it with a vasopressor drawn up" },
      ],
      correct: ["none"],
      teaching: `Brilakis 3.2: no nitroglycerin after ${windows}; giving the two together causes hypotension. If it has happened: no more nitrate, saline, and a vasopressor if the hypotension is severe or persists.`,
    });
  }
  // the eGFR ceiling (contrastBudget.ts: Brilakis 2.6 and 1.1, Oxford ch 4, Brilakis 28.3)
  if (asks("egfr-ceiling") && chart.egfr !== undefined) {
    const b = contrastBudget({ egfr: chart.egfr, weightKg: chart.weightKg });
    const gfr = b.rules.find((r) => r.id === "brilakis-gfr");
    const wt = b.rules.find((r) => r.id === "oxford-weight");
    if (gfr && wt && b.stricter.id === "brilakis-gfr") {
      const advanced = chart.egfr < CONTRAST_BUDGET_DEFAULTS.advancedCkdEgfr ? " Below an eGFR of 30, ideally use less contrast (mL) than the creatinine clearance (mL/min) (Brilakis 28.3)." : "";
      qs.push({
        id: "chart-egfr-ceiling",
        prompt: `eGFR ${chart.egfr} mL/min/1.73 m², weight ${chart.weightKg} kg. Which contrast ceiling do you agree at the time-out?`,
        options: [
          { id: "gfr", text: `${gfr.ceilingMl} mL (${CONTRAST_BUDGET_DEFAULTS.brilakisMultiplier} × eGFR)` },
          { id: "weight", text: `${wt.ceilingMl} mL (${CONTRAST_BUDGET_DEFAULTS.oxfordMlPerKg} mL/kg)` },
          { id: "none", text: "No fixed ceiling: as much as the study needs" },
        ],
        correct: ["gfr"],
        teaching: `Brilakis stops before the contrast volume (mL) reaches 3.7 × GFR (Brilakis 2.6 and 1.1). Oxford's 5–7 mL/kg ignores renal function, so here the renal rule is the stricter one.${advanced}`,
      });
    }
  }
  // a previous radiation skin injury (Brilakis 1.1 and 1.6; 01-lab-and-radiation.ts:672, 08-acquiring.ts:414)
  if (asks("skin-injury") && chart.skinFindings?.length) {
    const prior = chart.priorFluoroProcedures?.[0];
    qs.push({
      id: "chart-skin-injury",
      prompt: `On examination: ${chart.skinFindings[0].toLowerCase()}${prior ? `, after ${prior.procedure.toLowerCase()} ${prior.daysAgo} days ago` : ""}. How do you plan the imaging?`,
      options: [
        { id: "limit", text: "Fewer cine runs, and projections that keep the injured skin out of the beam" },
        { id: "usual", text: "The usual projections: the skin is healing" },
        { id: "faster", text: "Cine at a higher frame rate to keep the runs short" },
        { id: "collimate", text: "Collimate tightly; then the projections do not matter" },
      ],
      correct: ["limit"],
      teaching:
        "Ask about earlier procedures under fluoroscopy and look at the back before the first exposure. After a radiation skin injury Brilakis limits the cine runs and keeps the injured area out of the beam, or postpones or modifies the procedure (Brilakis 1.1 and 1.6). Collimation shrinks the field but does not stop one patch of skin taking the dose.",
    });
  }
  // after CABG: the operation note first (Brilakis 18.1; tip diag-graft-op-note-first)
  if (asks("operation-note") && chart.operationNote) {
    qs.push({
      id: "chart-operation-note",
      prompt: "Before the first graft injection you:",
      options: [
        { id: "note", text: "Read the operation note: every conduit, its target and where its ostium should be" },
        { id: "aortogram", text: "Start with an aortogram to find the grafts" },
        { id: "search", text: "Search the anterior aorta with a right catheter until something fills" },
        { id: "native", text: "Image the native arteries; the grafts will show themselves" },
      ],
      correct: ["note"],
      teaching:
        "Know every conduit, its target and where its ostium should be before you start, and review old films for the catheters that worked. In a non-urgent case Brilakis would delay rather than proceed without the surgical report (Brilakis 18.1).",
    });
  }
  return qs;
}

/**
 * A pre-brief with the chart's questions first (at most four questions in all) and, for a named
 * scenario, its own presentation and planted problems.
 */
export function prebriefWithChart(base: Prebrief, c: { id: string; chart?: CaseChart }, scenario?: { brief?: string; planted?: readonly ChartProblem[] }): Prebrief {
  const presentation = scenario?.brief;
  const chartQs = chartQuestions(c.chart, scenario?.planted).map((q) => shuffleOptions(q, c.id));
  const seen = new Set<string>();
  const questions = [...chartQs, ...base.questions].filter((q) => !seen.has(q.id) && !!seen.add(q.id)).slice(0, 4);
  return { ...base, presentation: presentation ?? base.presentation, questions };
}

// --- PCI: the plan, the forecast, the team time-out and the sign-out (pci-attending) ------------------
//
// The PCI pre-brief is followed by a plan form with one field per step of Brilakis's fourteen-step plan
// (pm-planning-steps, pci-manual/01-planning.ts:57-73; step 1, planning, is the form itself), the
// two or three likeliest complications from Brilakis's location tree with the first move for each
// (cm-principles-closure-forecast, complication-management/01-principles-closure.ts:84 and 160-169),
// the support plan (Brilakis 14.1.2, same file:137), the bail-out kit, the operator's own state and,
// for a CTO, the stopping rules (hb-safe-practice-mindset, cath-handbook/03-safe-practice.ts:1497).
// The plan is stored as a 'plan' event; the debrief compares it with what happened
// (pciPlanVsExecution). The content (step labels, options, lessons) is src/content/mentor/prebriefs.ts.

/** The plan's steps (Brilakis's steps 2 to 14; step 1 is the plan itself). */
export const PCI_PLAN_STEPS = ["monitoring", "drugs", "access", "guide", "angiography", "target", "wire", "preparation", "stent", "closure", "physiology", "imaging", "support"] as const;
export type PciPlanStepId = (typeof PCI_PLAN_STEPS)[number];

/** Brilakis's location tree, acute coronary complications (01-principles-closure.ts:84-85). */
export const FORECAST_COMPLICATIONS = [
  "dissection",
  "aorto-coronary-dissection",
  "thrombosis",
  "embolisation",
  "side-branch-occlusion",
  "spasm",
  "pseudolesion",
  "entrapment",
  "intramural-haematoma",
  "perforation",
] as const;
export type ForecastComplication = (typeof FORECAST_COMPLICATIONS)[number];

/** The support plan (Brilakis 14.1.2): a prophylactic device, a device on standby with access ready, or neither. */
export type SupportPlan = "prophylactic" | "standby" | "none";
/** The operator's own state, declared at the brief (pci-safe-state-check). */
export type OperatorState = "rested" | "tired" | "post-call";

export interface PciForecastItem {
  complication: ForecastComplication;
  /** the first move, as an option id of the content's first-move list */
  firstMove: string;
}

export interface PciPlan {
  /** the chosen option per step */
  steps: Partial<Record<PciPlanStepId, string>>;
  guideFrench: number;
  /** the contrast ceiling agreed for the case (mL; 0: none set) */
  contrastCeilingMl: number;
  forecast: PciForecastItem[];
  support: SupportPlan | null;
  /** bail-out kit confirmed in the room (option ids) */
  bailoutKit: string[];
  operatorState: OperatorState | null;
  /** the step most likely to go wrong (pci-safe-name-what-could-go-wrong), a plan step id */
  riskiestStep?: PciPlanStepId | null;
  /** CTO stopping rules (air kerma in Gy, contrast as a multiple of the creatinine clearance, minutes) */
  stopRules?: { karGy?: number; contrastXCrcl?: number; minutes?: number };
}

/** What the scenario says about the patient and the lesion, for the forecast, the support and the guide. */
export interface PciPlanFacts {
  calcium: 0 | 1 | 2;
  thrombus: boolean;
  cto: boolean;
  bifurcation: boolean;
  /** 0 none .. 2 severe */
  tortuosity: number;
  leftMain: boolean;
  /** the haemodynamics are abnormal (shock, low output) */
  abnormalHaemodynamics: boolean;
  /** the target was stented before */
  priorStent: boolean;
  lipid?: boolean;
}

/**
 * The complications the case's features predict (the risk-factor table of cm-principles-closure-forecast,
 * 01-principles-closure.ts:160-169), most likely first. Every case can dissect (the stent itself is a
 * cause), so dissection is always listed.
 */
export function expectedForecast(f: PciPlanFacts): ForecastComplication[] {
  const out: ForecastComplication[] = [];
  const add = (c: ForecastComplication) => {
    if (!out.includes(c)) out.push(c);
  };
  if (f.thrombus) {
    add("embolisation");
    add("thrombosis");
  }
  if (f.calcium >= 2) {
    add("dissection");
    add("entrapment");
  }
  if (f.cto) {
    add("aorto-coronary-dissection");
    add("perforation");
  }
  if (f.bifurcation) add("side-branch-occlusion");
  if (f.tortuosity >= 2) {
    add("pseudolesion");
    add("spasm");
  }
  if (f.lipid) add("embolisation");
  add("dissection");
  return out;
}

/**
 * The support plan Brilakis 14.1.2 gives for the case: abnormal haemodynamics with a high-risk lesion or
 * plan, prophylactic support; one without the other, a device on standby; neither, none. High risk
 * (Brilakis 14.1 table, 01-principles-closure.ts:126-132): an unprotected left main, severe calcium, a
 * bifurcation, a large thrombus, a CTO (a long complex procedure).
 */
export function expectedSupport(f: PciPlanFacts): SupportPlan {
  const highRisk = f.leftMain || f.calcium >= 2 || f.thrombus || f.cto || (f.bifurcation && f.tortuosity >= 2);
  if (f.abnormalHaemodynamics && highRisk) return "prophylactic";
  if (f.abnormalHaemodynamics || highRisk) return "standby";
  return "none";
}

/**
 * The guide size the plan needs (French). Most bifurcation techniques fit a 6 Fr guide, but V-stenting
 * and simultaneous kissing stents need at least 7 Fr (pci-manual/01-planning.ts:254 and 349; tip
 * pci-planning-guide-size): the stent option 'v-or-sks' needs 7, any other two-stent plan 6. For
 * atherectomy the module asks for 'a size that fits atherectomy' (01-planning.ts:349), which depends on
 * the burr; 7 Fr for a planned atherectomy is a MODEL PARAMETER (docs/realism/facts/pkg-pci-attending.md).
 */
export function guideFrenchNeeded(plan: Pick<PciPlan, "steps">): number {
  return plan.steps.preparation === "atherectomy" || plan.steps.stent === "v-or-sks" ? 7 : 6;
}

/** Engine complication kinds (src/simulation/complications/types.ts) a forecast item covers. */
export const FORECAST_ENGINE_KINDS: Record<ForecastComplication, readonly string[]> = {
  dissection: ["dissection"],
  "aorto-coronary-dissection": ["dissection"],
  thrombosis: ["thrombus"],
  embolisation: ["no-reflow", "thrombus", "air"],
  "side-branch-occlusion": ["side-branch"],
  spasm: [],
  pseudolesion: [],
  entrapment: [],
  "intramural-haematoma": ["dissection"],
  perforation: ["perforation"],
};

/** Did the forecast name a complication the engine produced? (engine kinds of the case) */
export function forecastMatches(forecast: readonly PciForecastItem[], engineKinds: readonly string[]): { matched: ForecastComplication[]; missed: string[] } {
  const matched = forecast.map((f) => f.complication).filter((c) => FORECAST_ENGINE_KINDS[c].some((k) => engineKinds.includes(k)));
  const covered = new Set(matched.flatMap((c) => FORECAST_ENGINE_KINDS[c]));
  return { matched, missed: [...new Set(engineKinds.filter((k) => !covered.has(k)))] };
}

/** The plan compared with the case (plan items for the debrief). */
export function pciPlanVsExecution(
  plan: PciPlan,
  o: { facts: PciPlanFacts; contrastMl: number; engineComplications: readonly string[]; guideFrenchUsed: number; imagingUsed: boolean; stopReached?: string | null }
): PlanItem[] {
  const items: PlanItem[] = [];
  const need = guideFrenchNeeded(plan);
  items.push({ id: "guide-size", label: "Guide size for the plan", planned: `${plan.guideFrench} Fr`, actual: `${o.guideFrenchUsed} Fr used; the plan needs ${need} Fr`, kept: plan.guideFrench >= need });
  items.push({
    id: "contrast-ceiling",
    label: "Contrast ceiling",
    planned: plan.contrastCeilingMl > 0 ? `${Math.round(plan.contrastCeilingMl)} mL` : "not set",
    actual: `${Math.round(o.contrastMl)} mL`,
    kept: plan.contrastCeilingMl > 0 ? o.contrastMl <= plan.contrastCeilingMl : false,
  });
  if (o.facts.priorStent) items.push({ id: "imaging", label: "Imaging for a previously stented target", planned: plan.steps.imaging ?? "none", actual: o.imagingUsed ? "imaging used" : "no imaging", kept: !!plan.steps.imaging && plan.steps.imaging !== "none" });
  const m = forecastMatches(plan.forecast, o.engineComplications);
  items.push({
    id: "forecast",
    label: "Complication forecast",
    planned: plan.forecast.map((f) => f.complication.replace(/-/g, " ")).join(", ") || "none named",
    actual: o.engineComplications.length ? o.engineComplications.join(", ") : "no complication",
    kept: o.engineComplications.length ? m.missed.length === 0 : null,
  });
  const support = expectedSupport(o.facts);
  items.push({ id: "support", label: "Support plan", planned: plan.support ?? "not chosen", actual: `Brilakis 14.1.2 for this case: ${support}`, kept: plan.support === support });
  if (o.facts.cto) items.push({ id: "stop-rules", label: "Stopping rules", planned: plan.stopRules && Object.keys(plan.stopRules).length ? "set" : "not set", actual: o.stopReached ? `reached: ${o.stopReached}` : "none reached", kept: !!plan.stopRules && Object.keys(plan.stopRules).length > 0 });
  return items;
}

// --- the PCI team time-out (pm-monitoring#4) ----------------------------------------------------------

/**
 * The PCI time-out's own items beyond TIME_OUT_ITEMS (Oxford, pm-monitoring-checklist,
 * pci-manual/02-monitoring.ts:800-808; tip pci-mon-time-out): the team knows the brief and sign in,
 * consent and the whiteboard, the equipment is checked and ready, the exposure is authorised under
 * IR(ME)R, who defibrillates, and the plan said aloud.
 */
export const PCI_TIME_OUT_ITEMS: TimeOutItem[] = [
  { id: "consent", text: "Consent signed and the procedure still indicated", pci: true },
  { id: "whiteboard", text: "Whiteboard read: haemoglobin, creatinine, weight, antiplatelets and loading, allergies, arterial site", pci: true },
  { id: "equipment-ready", text: "The equipment for the case checked and ready", pci: true },
  { id: "irmer", text: "Exposure authorised under IR(ME)R", pci: true },
  { id: "defib", text: "Who defibrillates agreed", pci: true },
  { id: "plan-aloud", text: "Plan said aloud: access, guide, anticoagulation and the bail-out kit", pci: true },
];

/** Every item the PCI time-out confirms. */
export function pciTimeOutItems(): TimeOutItem[] {
  return [...timeOutItems("pci"), ...PCI_TIME_OUT_ITEMS];
}

/** The team members who must be present for the time-out (src/simulation/team RoleId names, generic). */
export const PCI_TEAM_MEMBERS = [
  { id: "scrub", label: "scrub nurse" },
  { id: "radiographer", label: "radiographer" },
  { id: "physiologist", label: "physiologist" },
  { id: "sedation", label: "circulating nurse" },
] as const;
export type PciTeamMemberId = (typeof PCI_TEAM_MEMBERS)[number]["id"];

// --- the PCI sign-out (pm-monitoring#4, hb-the-operator#4, cm-principles-closure#8, hb-safe-practice#2) ---

/**
 * Sign-out steps (Oxford, pm-monitoring-checklist, 02-monitoring.ts:810-812; tip pci-mon-sign-out): the
 * equipment and sharps counted, every wire verified intact, anything left in place recorded, the
 * antiplatelet regimen with its duration and loading-dose status, and the recovery concerns.
 */
export interface PciSignOutState {
  equipmentCounted: boolean;
  sharpsCounted: boolean;
  /** the wires inspected: id to its finding ('intact' or 'damaged') */
  wiresChecked: Record<string, "intact" | "damaged">;
  /** a damaged wire's missing part recorded and acted on */
  damagedWireRecorded: boolean;
  /** what was chosen for the damaged wire (a DAMAGED_WIRE_ACTIONS id), or null */
  damagedWireAction: string | null;
  leftInPlace: string;
  antiplatelet: { regimen: string; durationMonths: number | null; loading: "given-in-lab" | "due-on-ward" | "already-loaded" | null };
  recoveryConcerns: string;
  /** complications: engine id to the learner's recorded final state */
  complications: Record<string, string>;
  /** tests ordered after a complication */
  ordered: { ecg: boolean; troponin: boolean; imaging: boolean };
  /** the learner's classification under the fifth universal definition, when one was asked */
  pmiClass: PmiClass | null;
  /** disclosure choice after a complication */
  disclosure: "now-awake" | "after-mm" | "partial" | null;
  incidentReport: boolean | null;
  /** logbook fields (Oxford, tip pci-operator-log-the-case) */
  logbook: { role: "first-operator" | "second-operator" | "observed" | null; presentation: string; complexity: string; techniques: string };
}

export function emptySignOut(): PciSignOutState {
  return {
    equipmentCounted: false,
    sharpsCounted: false,
    wiresChecked: {},
    damagedWireRecorded: false,
    damagedWireAction: null,
    leftInPlace: "",
    antiplatelet: { regimen: "", durationMonths: null, loading: null },
    recoveryConcerns: "",
    complications: {},
    ordered: { ecg: false, troponin: false, imaging: false },
    pmiClass: null,
    disclosure: null,
    incidentReport: null,
    logbook: { role: null, presentation: "", complexity: "", techniques: "" },
  };
}

/** What the sign-out must have before the patient leaves; empty when it may finish. */
export function signOutBlockers(s: PciSignOutState, o: { wires: readonly string[]; damagedWire: string | null; complications: readonly string[]; pmiAsked: boolean }): string[] {
  const out: string[] = [];
  if (!s.equipmentCounted || !s.sharpsCounted) out.push("Count the equipment and the sharps.");
  if (o.wires.some((w) => !s.wiresChecked[w])) out.push("Check every wire used is intact.");
  if (o.damagedWire && (s.wiresChecked[o.damagedWire] !== "damaged" || !s.damagedWireRecorded)) out.push("A wire is not intact: record what is missing and act on it before the patient leaves.");
  if (!s.antiplatelet.regimen || s.antiplatelet.durationMonths === null || !s.antiplatelet.loading) out.push("Record the antiplatelet regimen, its duration and the loading dose.");
  if (o.complications.some((id) => !s.complications[id])) out.push("Record each complication and how it ended.");
  if (o.pmiAsked && !s.pmiClass) out.push("Classify the result.");
  if (!s.logbook.role) out.push("Complete the logbook entry.");
  return out;
}

/** The wire-integrity check alone: the damaged wire is found and recorded (the finish gate of that variant). */
export function damagedWireResolved(s: PciSignOutState, damagedWire: string | null): boolean {
  return !damagedWire || (s.wiresChecked[damagedWire] === "damaged" && s.damagedWireRecorded);
}

// --- procedure-related myocardial infarction (cm-principles-closure#8; mills-5udmi-2026) ----------------

/**
 * The learner's classification: no acute myocardial injury, acute myocardial injury without infarction,
 * or procedure-related myocardial infarction.
 */
export type PmiClass = "no-injury" | "injury" | "procedure-mi";

/** A simulated result after the case: the troponin course, the clinical or ECG features and the echo. */
export interface PmiResult {
  /** serial troponin rising above the sex-specific 99th centile and the pre-procedure value */
  troponinRise: boolean;
  /** still rising at 6 hours (a pointer to imaging, not a threshold) */
  risingAt6h: boolean;
  /** symptoms of ischaemia, new ischaemic ECG change, new Q waves or unexplained deterioration under sedation */
  clinicalFeature: boolean;
  /** an angiographic complication was seen during the case */
  angiographicComplication: boolean;
  /** the complication arose during the index procedure (both criteria needed) */
  complicationOnTable: boolean;
  /** imaging: a new regional wall-motion abnormality in the territory */
  newWallMotion: boolean;
}

/**
 * The classification the fifth universal definition gives (cm-principles-closure-pmi,
 * 01-principles-closure.ts:1115-1119): injury needs a troponin rise; infarction needs injury with a
 * clinical or ECG feature and confirmation, and when the complication arose on the table both the
 * angiographic complication and the imaging finding; after an uncomplicated case one of them is enough.
 */
export function classifyPmi(r: PmiResult): PmiClass {
  if (!r.troponinRise) return "no-injury";
  if (!r.clinicalFeature) return "injury";
  const confirmed = r.complicationOnTable ? r.angiographicComplication && r.newWallMotion : r.angiographicComplication || r.newWallMotion;
  return confirmed ? "procedure-mi" : "injury";
}
