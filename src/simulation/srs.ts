// ---------------------------------------------------------------------------
// Spaced repetition (a compact SM-2 variant) and mastery scoring.
//
// Every quiz item a learner answers gets a memory record. Correct answers push
// the next review further out (interval × ease); a wrong answer resets the
// item to tomorrow and lowers its ease. Pure functions so they are testable;
// the progress store persists the records.
//
// The same record schedules procedural skills ("skill:<epa>", reviewSkill) and
// the mentor's skill cards ("<epa>:<code>", S11). The interval constants are the
// SM-2 shape used since wave 1 (model parameters, docs/realism/facts/I4.md).
// ---------------------------------------------------------------------------

export interface QuizMemory {
  reps: number; // consecutive correct reviews
  ease: number; // 1.3 … 2.8
  interval: number; // days until next review
  due: string; // yyyy-mm-dd
  lapses: number;
  attempts: number;
  correct: number;
  last: number; // epoch ms
  lastCorrect: boolean;
}

const MIN_EASE = 1.3;
const MAX_EASE = 2.8;

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function newMemory(today: string): QuizMemory {
  return { reps: 0, ease: 2.3, interval: 0, due: today, lapses: 0, attempts: 0, correct: 0, last: 0, lastCorrect: false };
}

/** Update a memory record after an answer. `now` is epoch ms (for `last`). */
export function review(prev: QuizMemory | undefined, correct: boolean, today: string, now: number): QuizMemory {
  const m = prev ? { ...prev } : newMemory(today);
  m.attempts += 1;
  m.last = now;
  m.lastCorrect = correct;
  if (correct) {
    m.correct += 1;
    m.reps += 1;
    m.interval = m.reps === 1 ? 1 : m.reps === 2 ? 3 : Math.max(1, Math.round(m.interval * m.ease));
    m.ease = Math.min(MAX_EASE, m.ease + 0.1);
  } else {
    m.reps = 0;
    m.lapses += 1;
    m.interval = 1;
    m.ease = Math.max(MIN_EASE, m.ease - 0.2);
  }
  m.due = addDays(today, m.interval);
  return m;
}

export function isDue(m: QuizMemory | undefined, today: string): boolean {
  return !!m && m.due <= today;
}

/** Ids due today or overdue, most-overdue and most-lapsed first. */
export function dueIds(memory: Record<string, QuizMemory>, today: string): string[] {
  return Object.entries(memory)
    .filter(([, m]) => m.due <= today)
    .sort((a, b) => (a[1].due === b[1].due ? b[1].lapses - a[1].lapses : a[1].due < b[1].due ? -1 : 1))
    .map(([id]) => id);
}

/**
 * Spaced practice of a procedural skill. A failed session always reschedules
 * (tomorrow, lower ease). A passed session extends the interval only when the
 * skill was due: extra passes on the same skill before its due date are counted
 * but do not push it further out, so massed practice earns no extra spacing.
 */
export function reviewSkill(prev: QuizMemory | undefined, passed: boolean, today: string, now: number): QuizMemory {
  if (prev && passed && prev.due > today) {
    return { ...prev, attempts: prev.attempts + 1, correct: prev.correct + 1, last: now, lastCorrect: true };
  }
  return review(prev, passed, today, now);
}

/** Skill-card ids from the mentor (S11) have the form "<epa>:<mistake code>". */
export function isSkillCardId(id: string): boolean {
  return id.includes(":") && !id.startsWith("skill:") && !id.startsWith("angio:");
}

/** Split due ids into quiz items and mentor skill cards. */
export function partitionDue(ids: string[]): { quiz: string[]; cards: string[] } {
  const quiz: string[] = [];
  const cards: string[] = [];
  for (const id of ids) (isSkillCardId(id) ? cards : quiz).push(id);
  return { quiz, cards };
}

/**
 * Legacy two-part mastery (lessons and quiz), kept for components outside the
 * progression stream; the Academy uses moduleMastery3 in src/progress/mastery.ts.
 * Mastery of a module, 0–100: half from lessons read, half from quiz
 * performance (items answered correctly at their most recent attempt, with
 * unanswered items counting as not yet mastered).
 */
export function moduleMastery(
  lessonIds: string[],
  quizIds: string[],
  lessonsDone: Record<string, number>,
  memory: Record<string, QuizMemory>
): number {
  const lessonPart = lessonIds.length ? lessonIds.filter((id) => lessonsDone[id]).length / lessonIds.length : 1;
  const quizPart = quizIds.length ? quizIds.filter((id) => memory[id]?.lastCorrect).length / quizIds.length : lessonPart;
  return Math.round((lessonPart * 0.5 + quizPart * 0.5) * 100);
}
