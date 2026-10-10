// ---------------------------------------------------------------------------
// Raise every MistakeCode from the recorded procedure. Before this layer only
// 9 of the 24 codes were ever raised (mentoring audit); each code below has an
// explicit, testable definition on the analysis timeline. Each raised mistake
// carries the wall time of its first occurrence, which the debrief uses as the
// decision point to rewind to.
// ---------------------------------------------------------------------------

import type { MistakeCode } from "../types";
import { ANALYSIS_PARAMS, type Analysis, type CaseFacts } from "./analysis";
import type { DiagnosticMetrics, Metrics } from "./metrics";
import { DAMPED_KINDS, type MistakeTally } from "./types";

export interface MistakeEvidence {
  code: MistakeCode;
  /** wall time of the occurrence */
  tWall: number;
  note: string;
}

export interface MistakeOptions {
  facts?: CaseFacts;
  /** budgets (plan or standard); exceeding them raises excess-fluoro / excess-contrast */
  budgets?: { fluoroS?: number; contrastMl?: number };
  /** structured-report or identification errors (vessel-misid) with their times */
  misidentifications?: { tWall: number; note: string }[];
}

export const ALL_MISTAKES: MistakeCode[] = [
  "too-high",
  "too-low",
  "lv-entry",
  "wrong-catheter",
  "too-much-pushing",
  "insufficient-withdrawal",
  "wrong-rotation",
  "over-rotation",
  "non-coaxial",
  "deep-engagement",
  "damped-injection",
  "non-selective-injection",
  "poor-view",
  "vessel-misid",
  "excess-fluoro",
  "excess-contrast",
  "ignored-pressure-warning",
  "catheter-changed-early",
  "catheter-changed-late",
  "lv-injection",
  "dissection",
  "air-embolism",
  "vf-arrest",
  "no-aspirate",
];

/** Codes that are safety-critical (a single occurrence matters). */
export const SAFETY_CODES: MistakeCode[] = ["lv-injection", "damped-injection", "dissection", "air-embolism", "vf-arrest", "no-aspirate", "ignored-pressure-warning", "lv-entry", "deep-engagement", "too-much-pushing", "insufficient-withdrawal"];

export function severityOf(code: MistakeCode): "safety" | "technique" | "efficiency" {
  if (SAFETY_CODES.includes(code)) return "safety";
  if (code === "excess-fluoro" || code === "excess-contrast" || code === "catheter-changed-late" || code === "catheter-changed-early") return "efficiency";
  return "technique";
}

export function detectMistakes(a: Analysis, m: Metrics, o: MistakeOptions = {}): { tally: MistakeTally; evidence: MistakeEvidence[] } {
  const ev: MistakeEvidence[] = [];
  const add = (code: MistakeCode, tWall: number, note: string) => ev.push({ code, tWall, note });
  const facts = o.facts ?? {};

  // --- position ---------------------------------------------------------------
  if (a.torqueTravelHigh >= ANALYSIS_PARAMS.tooHighTorqueRad) {
    const t = firstFrameWhere(a, (eng) => eng === 1) ?? a.t0;
    add("too-high", t, "Torque was applied while the tip sat above the sinuses, where no ostium can be reached.");
  }
  for (const t of a.belowValveEntries) add("too-low", t, "The tip dropped below the sinuses towards the valve plane.");
  for (const t of a.lvEntries) add("lv-entry", t, "The tip crossed the valve into the ventricle.");
  for (const t of a.deepEntries) add("deep-engagement", t, "The catheter seated deep in the vessel.");
  for (const t of a.insufficientWithdrawals) add("insufficient-withdrawal", t, "The catheter was advanced further from a dangerous position instead of being withdrawn.");
  for (const e of a.pushing) add("too-much-pushing", e.startT, "The catheter was pushed against resistance.");
  for (const e of a.events) if (e.kind === "mistake" && e.data?.code === "too-much-pushing" && !a.pushing.some((p) => Math.abs(p.startT - e.tWall) < 2)) add("too-much-pushing", e.tWall, "Forward pressure built up against a tip that was not seating.");
  for (const t of a.wrongRotations) add("wrong-rotation", t, "Torque turned the tip away from the ostium.");
  for (const t of a.overRotations) add("over-rotation", t, "The tip swung past the ostium.");

  // --- catheters ------------------------------------------------------------------
  const acceptable = facts.acceptableCatheters;
  if (acceptable && acceptable.length) {
    for (const c of a.catheters) if (c.id !== "initial" && c.id !== "?" && !acceptable.includes(c.id)) add("wrong-catheter", c.startT, `${c.id} does not suit this root and take-off.`);
  }
  const P = { early: ANALYSIS_PARAMS.earlyChangeAttempts, late: ANALYSIS_PARAMS.lateChangeAttempts };
  a.catheters.slice(0, -1).forEach((c, i) => {
    const failed = c.failedApproaches.left + c.failedApproaches.right;
    const succeeded = c.successes.left + c.successes.right;
    const next = a.catheters[i + 1];
    if (succeeded === 0 && failed < P.early && (!acceptable || acceptable.includes(c.id))) add("catheter-changed-early", next.startT, `${c.id} was exchanged after ${failed} attempt${failed === 1 ? "" : "s"}.`);
  });
  for (const c of a.catheters) {
    const worst = Math.max(c.failedApproaches.left, c.failedApproaches.right);
    if (worst > P.late) add("catheter-changed-late", c.endT, `${worst} failed approaches with ${c.id} before changing.`);
  }

  // --- injections -------------------------------------------------------------------
  for (const e of a.injections) {
    const d = e.data ?? {};
    const press = String(d.pressure ?? "");
    const outcome = String(d.outcome ?? "");
    const eng = String(d.engagement ?? "");
    if (outcome === "lv-injection" || press === "lv") add("lv-injection", e.tWall, "Contrast went into the ventricle.");
    else if (DAMPED_KINDS.includes(press as never) || outcome === "deep-reflux") add("damped-injection", e.tWall, `Injected on a ${press || "damped"} trace.`);
    if (outcome === "root-puff" || outcome === "weak") add("non-selective-injection", e.tWall, "The injection filled the root, not the coronary.");
    if (eng.startsWith("near-")) add("non-coaxial", e.tWall, "Injected with the tip near the ostium but not coaxial.");
    if (d.aspirated !== "clean") add("no-aspirate", e.tWall, "No clean aspirate since the tip last moved.");
  }
  for (const d of a.damped) if (!d.acted && d.endT - d.startT >= ANALYSIS_PARAMS.ignoredWarningS) add("ignored-pressure-warning", d.startT, "The trace stayed damped without a withdrawal.");

  // --- complications ------------------------------------------------------------------
  for (const c of a.complications) {
    const k = String(c.data?.kind ?? "");
    if (k === "dissection") add("dissection", c.tWall, "Catheter-induced dissection.");
    else if (k === "air-embolism") add("air-embolism", c.tWall, "Air embolism.");
    else if (k === "vf") add("vf-arrest", c.tWall, "Ventricular fibrillation after a conus or damped injection.");
  }
  for (const e of a.events) if (e.kind === "mistake" && typeof e.data?.code === "string" && !["too-much-pushing"].includes(e.data.code)) {
    const code = e.data.code as MistakeCode;
    if (ALL_MISTAKES.includes(code) && !ev.some((x) => x.code === code && Math.abs(x.tWall - e.tWall) < 1)) add(code, e.tWall, "Raised by the simulator.");
  }

  // --- views and identification ---------------------------------------------------------
  if (m.lab === "diagnostic") {
    const dm = m as DiagnosticMetrics;
    if (dm.viewCoverage && (dm.viewCoverage.missing.length || dm.viewCoverage.foreshortenedOnly.length)) {
      const labels = [...new Set([...dm.viewCoverage.foreshortenedOnly, ...dm.viewCoverage.missing])];
      add("poor-view", a.runs[a.runs.length - 1]?.endT ?? a.t1, `Not shown in two clean views: segment ${labels.join(", ")}.`);
    }
  }
  for (const v of o.misidentifications ?? []) add("vessel-misid", v.tWall, v.note);
  for (const e of a.events) if (e.kind === "id-answer" && e.data?.correct === false) add("vessel-misid", e.tWall, "A vessel was named incorrectly.");

  // --- budgets -------------------------------------------------------------------------
  const b = o.budgets ?? {};
  if (b.fluoroS !== undefined && m.fluoroS > b.fluoroS) add("excess-fluoro", crossing(a, "tFluoro", b.fluoroS), `Fluoroscopy ${fmtS(m.fluoroS)} against a budget of ${fmtS(b.fluoroS)}.`);
  if (b.contrastMl !== undefined && m.contrastMl > b.contrastMl) add("excess-contrast", crossingContrast(a, b.contrastMl), `Contrast ${Math.round(m.contrastMl)} mL against a budget of ${b.contrastMl} mL.`);

  ev.sort((x, y) => x.tWall - y.tWall);
  const tally: MistakeTally = {};
  for (const e of ev) tally[e.code] = (tally[e.code] ?? 0) + 1;
  return { tally, evidence: ev };
}

function firstFrameWhere(a: Analysis, f: (eng: number) => boolean): number | undefined {
  for (let i = 0; i < a.frames.length; i++) if (f(a.frames.value(i, "eng"))) return a.frames.value(i, "tWall");
  return undefined;
}

function crossing(a: Analysis, k: "tFluoro", v: number): number {
  for (let i = 0; i < a.frames.length; i++) if (a.frames.value(i, k) > v) return a.frames.value(i, "tWall");
  return a.t1;
}

function crossingContrast(a: Analysis, v: number): number {
  let s = 0;
  for (const e of a.injections) {
    s += typeof e.data?.ml === "number" ? e.data.ml : 0;
    if (s > v) return e.tWall;
  }
  return a.t1;
}

function fmtS(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.round(s - m * 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}
