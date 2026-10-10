// ---------------------------------------------------------------------------
// Three-part module mastery: read, quiz, apply.
//
//   read   lessons marked read
//   quiz   quiz items retained (at least 2 correct reviews in a row)
//   apply  skill: rungs cleared on the module's linked EPA ladders (MODULE_EVIDENCE)
//          image reading: balanced accuracy on the module's linked real drills
//          (the "drill" blocks in its lessons), pooled over every answer logged
//
// Overall mastery is the mean of the parts that apply to the module, so a module
// with skill or reading evidence cannot reach 100% until that evidence is passed.
// ---------------------------------------------------------------------------

import type { Module } from "../content/schema";
import { ladderFor, MODULE_EVIDENCE, LADDER_PARAMS } from "../content/mentor/catalogue";
import { rungCleared } from "./competency";
import type { EpaId, LogbookEntry } from "./types";
import type { QuizMemory } from "../simulation/srs";

/** Model parameters. */
export const MASTERY_PARAMS = {
  /** rung that must be cleared on each linked EPA for full "apply" credit (capped by the playable rungs) */
  targetRung: 2,
  /** pooled balanced accuracy for full reading credit */
  readingTarget: 0.8,
  /** answers needed before a drill's balanced accuracy is used */
  readingMinAnswers: 10,
} as const;

export interface DrillAnswerLog {
  drill: string;
  ref: number;
  ans: number;
}

export interface ModuleMastery {
  read: number;
  quiz: number;
  /** undefined when the module has no skill or reading evidence */
  apply?: number;
  skill?: { epa: EpaId; cleared: number; target: number; value: number }[];
  reading?: { drill: string; n: number; balancedAccuracy: number; value: number }[];
  overall: number;
}

/** Real-angiogram drills a module's lessons link to with "drill" blocks. */
export function moduleDrills(m: Module): string[] {
  const out = new Set<string>();
  for (const l of m.lessons) for (const b of l.blocks) if (b.kind === "drill" && b.target === "angio-real" && b.drill) out.add(b.drill);
  return [...out];
}

/** Balanced accuracy (mean per-class recall) over reference classes present. */
export function pooledBalancedAccuracy(rows: { ref: number; ans: number }[]): number {
  const classes = [...new Set(rows.map((r) => r.ref))];
  if (!classes.length) return NaN;
  const recalls = classes.map((c) => {
    const rc = rows.filter((r) => r.ref === c);
    return rc.filter((r) => r.ans === c).length / rc.length;
  });
  return recalls.reduce((a, b) => a + b, 0) / recalls.length;
}

export function moduleMastery3(m: Module, p: { lessonsDone: Record<string, number>; quizMemory: Record<string, QuizMemory>; logbook: LogbookEntry[] }, drillLog: DrillAnswerLog[] = []): ModuleMastery {
  const read = m.lessons.length ? m.lessons.filter((l) => p.lessonsDone[l.id]).length / m.lessons.length : 1;
  const quiz = m.quiz.length ? m.quiz.filter((q) => (p.quizMemory[q.id]?.reps ?? 0) >= 2).length / m.quiz.length : read;

  const ev = MODULE_EVIDENCE[m.id];
  const skill = ev?.skill
    ? ev.epas.map((epa) => {
        const target = Math.max(1, Math.min(MASTERY_PARAMS.targetRung, ladderFor(epa).playableRungs, LADDER_PARAMS.rungs));
        const cleared = rungCleared(p.logbook, epa);
        return { epa, cleared, target, value: Math.min(1, cleared / target) };
      })
    : undefined;

  const drills = moduleDrills(m);
  const reading = drills.length
    ? drills.map((drill) => {
        const rows = drillLog.filter((r) => r.drill === drill);
        const ba = rows.length >= MASTERY_PARAMS.readingMinAnswers ? pooledBalancedAccuracy(rows) : NaN;
        // Credit rises from chance (1 / classes) to the target.
        const k = new Set(rows.map((r) => r.ref)).size || 2;
        const chance = 1 / k;
        const value = Number.isFinite(ba) ? Math.max(0, Math.min(1, (ba - chance) / (MASTERY_PARAMS.readingTarget - chance))) : 0;
        return { drill, n: rows.length, balancedAccuracy: ba, value };
      })
    : undefined;

  const applyParts = [...(skill ?? []).map((s) => s.value), ...(reading ?? []).map((r) => r.value)];
  const apply = applyParts.length ? applyParts.reduce((a, b) => a + b, 0) / applyParts.length : undefined;
  const parts = apply === undefined ? [read, quiz] : [read, quiz, apply];
  const mean = parts.reduce((a, b) => a + b, 0) / parts.length;
  // Never round up to 100 while any part is short.
  const overall = parts.every((x) => x >= 1) ? 100 : Math.min(99, Math.round(mean * 100));
  return { read, quiz, apply, skill, reading, overall };
}

export function trackMastery3(modules: Module[], p: Parameters<typeof moduleMastery3>[1], drillLog: DrillAnswerLog[] = []): number {
  if (!modules.length) return 0;
  return Math.round(modules.reduce((a, m) => a + moduleMastery3(m, p, drillLog).overall, 0) / modules.length);
}
