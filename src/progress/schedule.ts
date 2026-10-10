// ---------------------------------------------------------------------------
// Practice scheduling: spaced practice of procedural skills alongside quiz
// items, the next rung of an EPA ladder, interleaved review of mastered rungs,
// the daily challenge, and the choice of an unseen exam case.
//
// Distributed rather than massed practice: Moulton 2006 (doi
// 10.1097/01.sla.0000234808.85789.6a). Progressive difficulty: Grover 2017
// (doi 10.1016/j.gie.2017.03.1529). Interleaving mastered rungs and the
// daily cap are model parameters (facts/I4.md).
// ---------------------------------------------------------------------------

import { dueIds, type QuizMemory } from "../simulation/srs";
import { examCaseIds, examCases, fnv, ladderFor, LADDER_PARAMS, DIAGNOSTIC_EPAS } from "../content/mentor/catalogue";
import { countedRungPasses, ENTRUST_RULES, EPA_IDS, passesToday, rungCleared } from "./competency";
import type { EntrustmentRecord, EpaId, LogbookEntry } from "./types";

export const skillKey = (epa: EpaId): string => `skill:${epa}`;
export const epaOfSkillKey = (k: string): EpaId | null => (k.startsWith("skill:") ? (k.slice(6) as EpaId) : null);

export interface DueSkill {
  epa: EpaId;
  reason: "spaced" | "refresher";
  /** yyyy-mm-dd it fell due (refreshers: today) */
  due: string;
}

/** Procedural skills due today: SM-2 due dates plus expired entrustment (refreshers). */
export function dueSkills(skillMemory: Record<string, QuizMemory>, entrustment: Partial<Record<EpaId, EntrustmentRecord>>, today: string): DueSkill[] {
  const out: DueSkill[] = [];
  const seen = new Set<EpaId>();
  for (const e of EPA_IDS) {
    if (entrustment[e]?.expired) {
      out.push({ epa: e, reason: "refresher", due: today });
      seen.add(e);
    }
  }
  for (const k of dueIds(skillMemory, today)) {
    const e = epaOfSkillKey(k);
    if (!e || seen.has(e) || !EPA_IDS.includes(e)) continue;
    out.push({ epa: e, reason: "spaced", due: skillMemory[k].due });
    seen.add(e);
  }
  return out;
}

/** The rung a learner should practise next on an EPA (the first one not yet cleared). */
export function nextRung(logbook: LogbookEntry[], epa: EpaId): number {
  const l = ladderFor(epa);
  return Math.min(Math.max(1, l.playableRungs), rungCleared(logbook, epa) + 1);
}

/**
 * Next practice case on an EPA ladder: a case on the next rung that has not been
 * passed yet, rotating by a seed so repeated calls vary. Diagnostic ladders only
 * (other ladders open their lab or drill).
 */
export function nextPracticeCase(logbook: LogbookEntry[], epa: EpaId, seed = ""): string | null {
  const l = ladderFor(epa);
  if (!l.diagnostic) return null;
  const r = nextRung(logbook, epa);
  const rung = l.diagnostic.rungs.find((x) => x.rung === r) ?? l.diagnostic.rungs[0];
  const passed = new Set(countedRungPasses(logbook, epa).map((p) => p.caseId));
  const fresh = rung.caseIds.filter((id) => !passed.has(id));
  const pool = fresh.length ? fresh : rung.caseIds;
  if (!pool.length) return null;
  return pool[fnv(`${epa}:${seed}`) % pool.length];
}

export interface InterleavedItem {
  epa: EpaId;
  caseId: string;
  rung: number;
}

/**
 * Interleaved retention set: cases from rungs already cleared, drawn round-robin
 * across EPAs so no two consecutive items train the same EPA when avoidable.
 */
export function interleavedSet(logbook: LogbookEntry[], n: number, seed: string): InterleavedItem[] {
  const pools: { epa: EpaId; items: InterleavedItem[] }[] = [];
  for (const epa of DIAGNOSTIC_EPAS) {
    const cleared = rungCleared(logbook, epa);
    if (!cleared) continue;
    const l = ladderFor(epa).diagnostic!;
    const items = l.rungs
      .filter((r) => r.rung <= cleared)
      .flatMap((r) => r.caseIds.map((caseId) => ({ epa, caseId, rung: r.rung })))
      .sort((a, b) => fnv(`${seed}:${a.caseId}`) - fnv(`${seed}:${b.caseId}`));
    if (items.length) pools.push({ epa, items });
  }
  const out: InterleavedItem[] = [];
  let i = 0;
  while (out.length < n && pools.some((p) => p.items.length)) {
    const p = pools[i % pools.length];
    const it = p.items.shift();
    if (it) out.push(it);
    i++;
  }
  return out;
}

/**
 * Weakest due EPA among the playable diagnostic ladders: a due skill first (refreshers,
 * then the most overdue), else the lowest level in force, else the lowest rung cleared.
 */
export function weakestDueEpa(logbook: LogbookEntry[], entrustment: Partial<Record<EpaId, EntrustmentRecord>>, skillMemory: Record<string, QuizMemory>, today: string): EpaId {
  const due = dueSkills(skillMemory, entrustment, today).filter((d) => DIAGNOSTIC_EPAS.includes(d.epa));
  if (due.length) {
    due.sort((a, b) => (a.reason === b.reason ? (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) : a.reason === "refresher" ? -1 : 1));
    return due[0].epa;
  }
  const ranked = [...DIAGNOSTIC_EPAS].sort((a, b) => {
    const la = entrustment[a]?.effective ?? 0;
    const lb = entrustment[b]?.effective ?? 0;
    return la - lb || rungCleared(logbook, a) - rungCleared(logbook, b) || DIAGNOSTIC_EPAS.indexOf(a) - DIAGNOSTIC_EPAS.indexOf(b);
  });
  return ranked[0];
}

/** Daily challenge: the next rung of the weakest due EPA, the same case all day. */
export function dailyChallenge(logbook: LogbookEntry[], entrustment: Partial<Record<EpaId, EntrustmentRecord>>, skillMemory: Record<string, QuizMemory>, today: string): { epa: EpaId; rung: number; caseId: string } | null {
  const epa = weakestDueEpa(logbook, entrustment, skillMemory, today);
  const caseId = nextPracticeCase(logbook, epa, `daily:${today}`);
  return caseId ? { epa, rung: nextRung(logbook, epa), caseId } : null;
}

/** True when today's counted rung passes on this EPA have reached the blocked-practice cap. */
export function overDailyCap(logbook: LogbookEntry[], epa: EpaId, today: string): boolean {
  return passesToday(logbook, epa, today) >= LADDER_PARAMS.dailyCountedPasses;
}

export interface ExamChoice {
  epa: EpaId;
  caseId: string;
  rung: number;
  /** level the exam counts toward */
  toward: 3 | 4;
}

/** Model parameter: unseen candidates the seeded choice picks among. */
const EXAM_CHOICES = 5;

/** Exam cases already attempted (any logged exam row) or loaded and not yet finished. */
export function attemptedExamIds(logbook: LogbookEntry[], pending: { caseId: string }[] = []): Set<string> {
  return new Set([...logbook.filter((r) => r.mode === "exam").map((r) => r.caseId), ...pending.map((p) => p.caseId)]);
}

/** Rung band each exam draws from: level III from rungs 3-4, level IV and the final assessment from 5-6. */
export const EXAM_BANDS = {
  3: { minRung: ENTRUST_RULES.level3.minRung, maxRung: ENTRUST_RULES.level4.minRung - 1 },
  4: { minRung: ENTRUST_RULES.level4.minRung, maxRung: LADDER_PARAMS.rungs },
} as const;

/**
 * Exam eligibility and an unseen held-out case in the band for the next level, or the
 * reason it is refused. Level III exams use rungs 3-4 only, so they never consume the
 * rung 5-6 cases that level IV and the final assessment need; the pool is generated on
 * demand and does not run out.
 */
export function pickExamCase(logbook: LogbookEntry[], epa: EpaId, rec: EntrustmentRecord | undefined, seed: string, pending: { caseId: string }[] = []): ExamChoice | { refused: string } {
  const l = ladderFor(epa);
  if (!l.diagnostic) return { refused: l.kind === "reading" ? "Reading exams run in the Real angiograms section." : "This lab does not offer held-out exam cases yet." };
  const level = rec?.awarded ?? 0;
  if (level < 2) return { refused: `Exam mode opens at level II. ${rec?.next ?? ""}`.trim() };
  if (level >= 4) return { refused: "Level IV already awarded; the final assessment draws its own unseen cases." };
  const toward = (level === 2 ? 3 : 4) as 3 | 4;
  const band = EXAM_BANDS[toward];
  if (rungCleared(logbook, epa) < band.minRung - 1) return { refused: `Clear rung ${band.minRung - 1} in practice first (cleared: ${rungCleared(logbook, epa)}).` };
  const pool = examCases(epa, { ...band, exclude: attemptedExamIds(logbook, pending), count: EXAM_CHOICES });
  if (!pool.length) return { refused: "No unseen held-out case could be generated for this rung band." };
  const pick = pool[fnv(`${epa}:${seed}`) % pool.length];
  return { epa, caseId: pick.caseId, rung: pick.rung, toward };
}

/** Master (final) assessment: an unseen exam case at rung 5 or 6 for a component EPA. */
export function pickMasterCase(logbook: LogbookEntry[], epa: EpaId, seed: string, pending: { caseId: string }[] = []): ExamChoice | { refused: string } {
  const l = ladderFor(epa);
  if (!l.diagnostic) return { refused: "This component's exam runs in the Real angiograms section." };
  const pool = examCases(epa, { ...EXAM_BANDS[4], exclude: attemptedExamIds(logbook, pending), count: EXAM_CHOICES });
  if (!pool.length) return { refused: "No unseen held-out case could be generated at rung 5 or above." };
  const pick = pool[fnv(`master:${epa}:${seed}`) % pool.length];
  return { epa, caseId: pick.caseId, rung: pick.rung, toward: 4 };
}

/** Listed exam ids of every EPA (for the test that practice never shows them). */
export function allExamIds(): Set<string> {
  return new Set(DIAGNOSTIC_EPAS.flatMap((e) => examCaseIds(e)));
}
