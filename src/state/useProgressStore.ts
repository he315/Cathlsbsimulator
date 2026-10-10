// ---------------------------------------------------------------------------
// Progress store: Academy progress, the simulator logbook, EPA entrustment and
// spaced practice of procedural skills (stream S12, track I4).
//
// No game mechanics: XP, level titles and the day streak were removed. The
// legacy fields (level, xp, streak) stay in the saved profile, frozen and
// never shown, so an exported profile keeps everything it had.
//
// Every lab writes one logbook row per finished session:
//   - diagnostic lab: recordAttempt (called by useSimulatorStore.finishCase)
//   - labs that report a key and a score: recordSim (kept for compatibility)
//   - labs that report the full session: logSession (the rich API; useLabRun in
//     src/ui/lab/labRun.ts calls it once per run with the case id, mode,
//     scenario, decisions and metrics)
//   - Real angiograms exam sets: recordReadingExam
// Entrustment, the final assessment and the skill schedule are recomputed from
// the logbook after every write.
//
// Practice sessions the lab did not label take the mode of the level in force
// (labPolicy): guided as assistant up to level II, supervised at III, independent
// from IV. Exams are registered when the case loads (beginExam); leaving before the
// end, or closing the app, logs a failed first attempt (abandonExam, and hydrate).
// ---------------------------------------------------------------------------

import { create } from "zustand";
import type { CaseAttempt, MistakeCode, TrainingIntensity, Difficulty } from "../types";
import { loadJSON, saveJSON, todayStr } from "../utils/storage";
import { review, reviewSkill, type QuizMemory } from "../simulation/srs";
import { deriveAll, knowledgeByEpa, labPolicy } from "../progress/competency";
import { dayOf, LOGBOOK_MAX, logbookCsv, logbookJson, migrateRows, rowFromAbandonedExam, rowFromAttempt, rowFromReadingExam, rowFromSession, rowFromSim } from "../progress/logbook";
import { skillKey } from "../progress/schedule";
import type { EpaId, LogbookEntry, LogMode, LogSessionInput, PendingExam, ProgressProfileV2 } from "../progress/types";
import type { AssessmentMode, EntrustmentLevel as MentorLevel } from "../mentor/types";
import type { VisibilityPolicy } from "../mentor/visibility";
import { cleanDecision, isDecisionRecord, MAX_DECISIONS_PER_RUN } from "../mentor/ledger";

const KEY = "progress";

export type Profile = ProgressProfileV2;

export function defaultProfile(now = Date.now()): Profile {
  return {
    schema: 2,
    createdAt: now,
    // legacy fields (frozen, never shown)
    level: 1,
    xp: 0,
    streak: 0,
    intensity: "trainee",
    difficulty: "beginner",
    currentDay: 1,
    lastActiveDate: "",
    totalTrainingSeconds: 0,
    casesCompleted: 0,
    attempts: [],
    mistakes: {},
    completedDays: [],
    examResults: {},
    spacedRepetition: [],
    lessonsDone: {},
    quizMemory: {},
    caseRecords: {},
    simRecords: {},
    logbook: [],
    entrustment: {},
    skillMemory: {},
    master: { passed: false, components: {} },
    pendingExams: [],
    seenExamItems: {},
  };
}

/** Reading-exam items seen, per drill: item → date last shown (an array from an early build gets today's date). */
function seenItems(v: unknown, today: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const [drill, items] of Object.entries(obj<Record<string, unknown>>(v, {}))) {
    if (Array.isArray(items)) out[drill] = Object.fromEntries(items.filter((x): x is string => typeof x === "string").map((k) => [k, today]));
    else if (items && typeof items === "object") out[drill] = Object.fromEntries(Object.entries(items as Record<string, unknown>).filter((e): e is [string, string] => typeof e[1] === "string"));
  }
  return out;
}

/** Did a stored object hold any learner data worth converting? */
function hadData(r: Partial<Profile>): boolean {
  const n = (v: unknown) => (Array.isArray(v) ? v.length : v && typeof v === "object" ? Object.keys(v).length : 0);
  return n(r.attempts) + n(r.simRecords) + n(r.lessonsDone) + n(r.quizMemory) + n(r.examResults) + n(r.caseRecords) > 0 || (typeof r.casesCompleted === "number" && r.casesCompleted > 0);
}

// --- knowledge source (Academy quiz items per module), loaded with the content chunk ---
let knowledgeModules: { id: string; quizIds: string[] }[] | null = null;

/** Give the store the Academy's module → quiz item index (used for entrustment level I). */
export function setKnowledgeModules(mods: { id: string; quizIds: string[] }[] | null): void {
  knowledgeModules = mods;
}

const obj = <T extends object>(v: unknown, fallback: T): T => (v && typeof v === "object" && !Array.isArray(v) ? (v as T) : fallback);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Skill schedule replayed from the logbook (used when migrating). */
function skillsFromRows(rows: LogbookEntry[]): Record<string, QuizMemory> {
  const mem: Record<string, QuizMemory> = {};
  for (const r of [...rows].sort((a, b) => a.t - b.t)) {
    if (r.aggregateOf) continue;
    for (const e of r.epas) mem[skillKey(e)] = reviewSkill(mem[skillKey(e)], r.passed, r.date, r.t);
  }
  return mem;
}

/** Recompute entrustment and the final assessment from the logbook. */
export function recompute(p: Profile, today = todayStr()): Profile {
  const knowledge = knowledgeModules ? knowledgeByEpa(knowledgeModules, p.quizMemory) : undefined;
  const { entrustment, master } = deriveAll(p.logbook, { today, knowledge, master: p.master, prev: p.entrustment });
  const next: Profile = { ...p, entrustment, master };
  if (master.passed && !p.master?.passed) {
    const prev = p.examResults["master-assessment"] ?? { best: 0, passed: false, attempts: 0 };
    next.examResults = { ...p.examResults, "master-assessment": { best: 100, passed: true, attempts: prev.attempts + 1 } };
  }
  return next;
}

/**
 * Load any saved profile (schema 1 or 2, or an import) without losing data.
 * Schema-1 profiles get a logbook built from their stored attempts and one
 * summary row per simulator key; the retired "obsessive" intensity becomes
 * "intensive". Nothing is deleted.
 */
export function migrateProfile(raw: unknown, now = Date.now(), today = todayStr()): Profile {
  const base = defaultProfile(now);
  const r = obj<Partial<Profile>>(raw, {});
  const merged: Profile = {
    ...base,
    ...r,
    attempts: arr(r.attempts),
    completedDays: arr(r.completedDays),
    spacedRepetition: arr(r.spacedRepetition),
    mistakes: obj(r.mistakes, {}),
    examResults: obj(r.examResults, {}),
    lessonsDone: obj(r.lessonsDone, {}),
    quizMemory: obj(r.quizMemory, {}),
    caseRecords: obj(r.caseRecords, {}),
    simRecords: obj(r.simRecords, {}),
    logbook: trimDecisions(
      arr<LogbookEntry>(r.logbook)
        .filter((x) => x && typeof x === "object" && Array.isArray(x.epas))
        .map(cleanRunFields)
    ),
    entrustment: obj(r.entrustment, {}),
    skillMemory: obj(r.skillMemory, {}),
    master: obj(r.master, base.master),
    pendingExams: arr<PendingExam>(r.pendingExams).filter((x) => x && typeof x === "object" && typeof x.caseId === "string"),
    seenExamItems: seenItems(r.seenExamItems, today),
    schema: 2,
  };
  if ((merged.intensity as string) === "obsessive") merged.intensity = "intensive";
  if (r.schema !== 2) {
    const rows = migrateRows(r as Partial<Profile>);
    merged.logbook = [...rows, ...merged.logbook].sort((a, b) => a.t - b.t);
    merged.skillMemory = { ...skillsFromRows(rows), ...merged.skillMemory };
    // A first run (nothing stored) or an empty object is a new profile, not a conversion.
    if (hadData(r)) merged.migratedAt = now;
    else delete merged.migratedAt;
  }
  return recompute(merged, today);
}

/** What the level in force asks of the lab for the session being launched (labPolicy). */
export interface ActivePolicy {
  epa: EpaId;
  caseId?: string;
  mode: AssessmentMode;
  entrustment: MentorLevel;
  visibility: VisibilityPolicy;
}

interface ProgressStore {
  profile: Profile;
  hydrated: boolean;
  /**
   * Session only: the policy for the session just launched from a progression screen.
   * Labs read it to set hints, overlays and mentor fading (integration note in I4.md);
   * the logbook applies its mode to unlabelled practice sessions in any case.
   */
  activePolicy: ActivePolicy | null;
  setActivePolicy: (epa: EpaId, caseId?: string, exam?: boolean) => ActivePolicy;
  /** register an exam when its held-out case is loaded: from now on the case is attempted */
  beginExam: (e: Omit<PendingExam, "startedT"> & { startedT?: number; seen?: string[] }) => void;
  /** an exam left before the end: logs a failed first attempt (no-op once it finished) */
  abandonExam: (caseId: string, answered?: number) => void;
  hydrate: () => void;
  persist: () => void;
  /** recompute entrustment for today (expiry depends on the date) */
  refresh: () => void;
  recordAttempt: (a: CaseAttempt) => void;
  addMistakes: (codes: MistakeCode[], context: string) => void;
  addTrainingTime: (seconds: number) => void;
  completeDay: (day: number) => void;
  setCurrentDay: (day: number) => void;
  setIntensity: (i: TrainingIntensity) => void;
  setDifficulty: (d: Difficulty) => void;
  recordExam: (id: string, score: number, passed: boolean) => void;
  markLessonDone: (lessonId: string) => void;
  answerQuiz: (quizId: string, correct: boolean) => void;
  recordCase: (caseId: string, score: number) => void;
  /** labs that report only a key and a 0..100 score: one logbook row per call */
  recordSim: (simKey: string, score: number) => void;
  /** labs that report the whole session: one logbook row */
  logSession: (s: LogSessionInput) => LogbookEntry;
  /** a finished Real angiograms exam set on held-out runs */
  recordReadingExam: (drill: string, setNo: number, balancedAccuracy: number, n: number) => void;
  /** grade a mentor skill card ("<epa>:<code>") in the shared quiz memory */
  reviewCard: (cardId: string, passed: boolean) => void;
  /**
   * A skill card was launched on this case: the next finished attempt on it grades the
   * card (passed, with no critical error and without the card's own mistake recurring).
   */
  armCard: (cardId: string, code: MistakeCode, caseId: string) => void;
  exportJSON: () => string;
  exportLogbook: (format: "csv" | "json") => string;
  importJSON: (json: string) => boolean;
  reset: () => void;
}

const save = (p: Profile) => saveJSON(KEY, p);

/** The skill card waiting for its case to finish (session only). */
let armedCard: { id: string; code: MistakeCode; caseId: string } | null = null;

/** Mode of the level in force for an EPA, for sessions the lab did not label. */
const policyModeOf =
  (p: Profile) =>
  (epa: EpaId | undefined): LogMode | undefined =>
    epa ? labPolicy(p.entrustment[epa]).mode : undefined;

/** Most metrics a logbook row keeps (storage bound; MODEL PARAMETER of the app, not of the patient). */
export const MAX_METRICS_PER_ROW = 32;
/** Only the most recent rows keep their decisions (the logbook lives in one localStorage key). */
export const DECISION_ROWS_KEPT = 200;

/** Finite numeric metrics only, at most MAX_METRICS_PER_ROW, names up to 64 characters. */
function cleanMetrics(m: unknown): Record<string, number> | undefined {
  if (!m || typeof m !== "object" || Array.isArray(m)) return undefined;
  const out: Record<string, number> = {};
  let n = 0;
  for (const [k, v] of Object.entries(m as Record<string, unknown>)) {
    if (n >= MAX_METRICS_PER_ROW) break;
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    out[k.slice(0, 64)] = v;
    n++;
  }
  return n ? out : undefined;
}

/** A stored row with its decisions and metrics validated (rows loaded from storage or an import). */
function cleanRunFields(x: LogbookEntry): LogbookEntry {
  if (x.decisions === undefined && x.metrics === undefined) return x;
  const out: LogbookEntry = { ...x };
  delete out.decisions;
  delete out.metrics;
  if (Array.isArray(x.decisions)) {
    const d = x.decisions.filter(isDecisionRecord).slice(-MAX_DECISIONS_PER_RUN).map(cleanDecision);
    if (d.length) out.decisions = d;
  }
  const m = cleanMetrics(x.metrics);
  if (m) out.metrics = m;
  return out;
}

/** The logbook with decisions kept on the most recent DECISION_ROWS_KEPT rows only. */
function trimDecisions(book: LogbookEntry[]): LogbookEntry[] {
  const cutAt = book.length - DECISION_ROWS_KEPT;
  if (cutAt <= 0) return book;
  let changed = false;
  const out = book.map((r, i) => {
    if (i >= cutAt || r.decisions === undefined) return r;
    changed = true;
    const c = { ...r };
    delete c.decisions;
    return c;
  });
  return changed ? out : book;
}

/**
 * The run fields a lab reports through useLabRun (scenario, decisions, metrics), copied onto the
 * row rowFromSession built. Decisions are cleaned, bounded and capped; metrics keep finite numbers
 * only, at most MAX_METRICS_PER_ROW.
 */
export function withRunFields(row: LogbookEntry, input: LogSessionInput): LogbookEntry {
  const out: LogbookEntry = { ...row };
  if (input.scenarioId) out.scenarioId = input.scenarioId;
  if (input.decisions?.length) out.decisions = input.decisions.slice(-MAX_DECISIONS_PER_RUN).map(cleanDecision);
  const m = cleanMetrics(input.metrics);
  if (m) out.metrics = m;
  return out;
}

/** Logbook row for a pending exam that was never finished. */
function abandonedRow(e: PendingExam, answered = 0, t = e.startedT): LogbookEntry {
  if (e.kind === "reading" && e.drill) {
    const setNo = Number(e.caseId.split(":")[2]) || 0;
    return rowFromReadingExam(e.drill, setNo, 0, e.items ?? 0, t, { answered });
  }
  return rowFromAbandonedExam(e.caseId, e.caseName, t);
}

export const useProgressStore = create<ProgressStore>((set, get) => {
  /** Append rows, update the skill schedule, recompute, save. */
  const addRows = (rows: LogbookEntry[], patch: Partial<Profile> = {}) =>
    set((s) => {
      let skillMemory = s.profile.skillMemory;
      for (const r of rows) {
        if (r.aggregateOf) continue;
        skillMemory = { ...skillMemory };
        for (const e of r.epas) skillMemory[skillKey(e)] = reviewSkill(skillMemory[skillKey(e)], r.passed, r.date, r.t);
      }
      const examResults = { ...s.profile.examResults, ...(patch.examResults ?? {}) };
      for (const r of rows) {
        if (r.mode !== "exam" || !r.epas[0]) continue;
        const id = `epa:${r.epas[0]}`;
        const prev = examResults[id] ?? { best: 0, passed: false, attempts: 0 };
        examResults[id] = { best: Math.max(prev.best, r.score ?? 0), passed: prev.passed || r.passed, attempts: prev.attempts + 1 };
      }
      const logbook = trimDecisions([...s.profile.logbook, ...rows].slice(-LOGBOOK_MAX));
      // A logged row closes the pending exam on the same case.
      const done = new Set(rows.map((r) => r.caseId));
      const pendingExams = (patch.pendingExams ?? s.profile.pendingExams).filter((e) => !done.has(e.caseId));
      const next = recompute({ ...s.profile, ...patch, examResults, logbook, skillMemory, pendingExams });
      save(next);
      return { profile: next };
    });

  const patch = (f: (p: Profile) => Partial<Profile>) =>
    set((s) => {
      const next = { ...s.profile, ...f(s.profile) };
      save(next);
      return { profile: next };
    });

  return {
    profile: defaultProfile(),
    hydrated: false,
    activePolicy: null,

    hydrate: () => {
      const raw = loadJSON<unknown>(KEY, null);
      const profile = migrateProfile(raw);
      profile.lastActiveDate = todayStr();
      save(profile);
      set({ profile, hydrated: true });
      // Exams still pending from an earlier session were left unfinished: failed first attempts.
      if (profile.pendingExams.length) {
        addRows(profile.pendingExams.map((e) => abandonedRow(e)), { pendingExams: [] });
      }
      // Level I uses the Academy's quiz items; they arrive with the content chunk.
      if (!knowledgeModules) {
        void import("../content/index")
          .then((m) => {
            setKnowledgeModules(m.TRACKS.flatMap((t) => t.modules.map((mod) => ({ id: mod.id, quizIds: mod.quiz.map((q) => q.id) }))));
            get().refresh();
          })
          .catch(() => undefined);
      }
    },

    persist: () => save(get().profile),

    refresh: () =>
      set((s) => {
        const next = recompute(s.profile);
        save(next);
        return { profile: next };
      }),

    setActivePolicy: (epa, caseId, exam = false) => {
      const pol = { epa, caseId, ...labPolicy(get().profile.entrustment[epa], exam) };
      set({ activePolicy: pol });
      return pol;
    },

    beginExam: (e) =>
      set((s) => {
        const { seen, ...rest } = e;
        const pend: PendingExam = { ...rest, startedT: e.startedT ?? Date.now() };
        let seenExamItems = s.profile.seenExamItems;
        if (seen?.length && e.drill) {
          const day = dayOf(pend.startedT);
          seenExamItems = { ...seenExamItems, [e.drill]: { ...(seenExamItems[e.drill] ?? {}), ...Object.fromEntries(seen.map((k) => [k, day])) } };
        }
        const next: Profile = { ...s.profile, seenExamItems, pendingExams: [...s.profile.pendingExams.filter((x) => x.caseId !== e.caseId), pend] };
        save(next);
        return { profile: next };
      }),

    abandonExam: (caseId, answered = 0) => {
      const e = get().profile.pendingExams.find((x) => x.caseId === caseId);
      if (!e) return;
      addRows([abandonedRow(e, answered, Date.now())]);
    },

    recordAttempt: (a) => {
      const row = rowFromAttempt(a, { policyMode: policyModeOf(get().profile) });
      const p = get().profile;
      let quizMemory = p.quizMemory;
      if (armedCard && armedCard.caseId === a.caseId) {
        const pass = row.passed && !a.mistakes.includes(armedCard.code);
        quizMemory = { ...quizMemory, [armedCard.id]: review(quizMemory[armedCard.id], pass, row.date, row.t) };
        armedCard = null;
      }
      addRows([row], { attempts: [...p.attempts, a].slice(-500), casesCompleted: p.casesCompleted + 1, quizMemory });
    },

    addMistakes: (codes, context) =>
      patch((p) => {
        const mistakes = { ...p.mistakes };
        const now = Date.now();
        for (const code of codes) {
          const cur = mistakes[code] ?? { code, count: 0, lastSeen: now, contexts: [] };
          mistakes[code] = { code, count: cur.count + 1, lastSeen: now, contexts: Array.from(new Set([...cur.contexts, context])).slice(-8) };
        }
        return { mistakes };
      }),

    addTrainingTime: (seconds) => patch((p) => ({ totalTrainingSeconds: p.totalTrainingSeconds + Math.max(0, seconds) })),

    completeDay: (day) =>
      patch((p) => ({
        completedDays: Array.from(new Set([...p.completedDays, day])).sort((a, b) => a - b),
        currentDay: Math.max(p.currentDay, day + 1),
      })),

    setCurrentDay: (day) => patch(() => ({ currentDay: Math.max(1, Math.min(365, day)) })),

    setIntensity: (i) => patch(() => ({ intensity: i === "obsessive" ? "intensive" : i })),

    setDifficulty: (d) => patch(() => ({ difficulty: d })),

    recordExam: (id, score, passed) =>
      patch((p) => {
        const prev = p.examResults[id] ?? { best: 0, passed: false, attempts: 0 };
        return { examResults: { ...p.examResults, [id]: { best: Math.max(prev.best, score), passed: prev.passed || passed, attempts: prev.attempts + 1 } } };
      }),

    markLessonDone: (lessonId) =>
      set((s) => {
        if (s.profile.lessonsDone[lessonId]) return {};
        const next = { ...s.profile, lessonsDone: { ...s.profile.lessonsDone, [lessonId]: Date.now() } };
        save(next);
        return { profile: next };
      }),

    answerQuiz: (quizId, correct) =>
      set((s) => {
        const mem = review(s.profile.quizMemory[quizId], correct, todayStr(), Date.now());
        let next: Profile = { ...s.profile, quizMemory: { ...s.profile.quizMemory, [quizId]: mem } };
        if (knowledgeModules) next = recompute(next);
        save(next);
        return { profile: next };
      }),

    recordCase: (caseId, score) =>
      patch((p) => {
        const prev = p.caseRecords[caseId];
        return { caseRecords: { ...p.caseRecords, [caseId]: { best: Math.max(prev?.best ?? 0, score), attempts: (prev?.attempts ?? 0) + 1, last: Date.now() } } };
      }),

    recordSim: (simKey, score) => {
      const t = Date.now();
      const p = get().profile;
      const prev = p.simRecords[simKey];
      const row = rowFromSim(simKey, score, t, { policyMode: policyModeOf(p) });
      let quizMemory = p.quizMemory;
      // A skill card armed for this lab (PCI cards: the scenario's sim key) is graded by this session.
      if (armedCard && armedCard.caseId === simKey) {
        quizMemory = { ...quizMemory, [armedCard.id]: review(quizMemory[armedCard.id], row.passed, row.date, row.t) };
        armedCard = null;
      }
      addRows([row], { quizMemory, simRecords: { ...p.simRecords, [simKey]: { runs: (prev?.runs ?? 0) + 1, best: Math.max(prev?.best ?? 0, score), last: t } } });
    },

    logSession: (input) => {
      // A run id ("<sim>:<scenario>[~variant]") is classified by the id the case catalogue knows
      // (EPA, rung, held-out exam, default name); the row keeps the run id.
      const { classifyId, ...rest } = input;
      const cid = classifyId && classifyId !== input.caseId ? classifyId : undefined;
      const built = rowFromSession(cid ? { ...rest, caseId: cid } : rest);
      const row = withRunFields(cid ? { ...built, caseId: input.caseId } : built, rest);
      const p = get().profile;
      // a pending exam registered on the catalogue id is closed by this run as well
      const pend = cid && p.pendingExams.some((e) => e.caseId === cid) ? { pendingExams: p.pendingExams.filter((e) => e.caseId !== cid) } : {};
      // A skill card armed on this lab's old sim key (PCI cards: "pci-<scenario>") is graded by the
      // run, as recordSim did, so a lab that moves to useLabRun keeps its cards.
      if (armedCard && input.source && armedCard.caseId === input.source) {
        const quizMemory = { ...p.quizMemory, [armedCard.id]: review(p.quizMemory[armedCard.id], row.passed, row.date, row.t) };
        armedCard = null;
        addRows([row], { quizMemory, ...pend });
        return row;
      }
      addRows([row], pend);
      return row;
    },

    recordReadingExam: (drill, setNo, ba, n) => addRows([rowFromReadingExam(drill, setNo, ba, n)]),

    reviewCard: (cardId, passed) =>
      patch((p) => ({ quizMemory: { ...p.quizMemory, [cardId]: review(p.quizMemory[cardId], passed, todayStr(), Date.now()) } })),

    armCard: (cardId, code, caseId) => {
      armedCard = { id: cardId, code, caseId };
    },

    exportJSON: () => JSON.stringify(get().profile, null, 2),

    exportLogbook: (format) => (format === "csv" ? logbookCsv(get().profile.logbook) : logbookJson(get().profile.logbook)),

    importJSON: (json) => {
      try {
        const parsed = JSON.parse(json) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
        const next = migrateProfile(parsed);
        save(next);
        set({ profile: next });
        return true;
      } catch {
        return false;
      }
    },

    reset: () => {
      const fresh = recompute(defaultProfile());
      save(fresh);
      set({ profile: fresh, activePolicy: null });
    },
  };
});

/** Entrustment record of one EPA (selector helper). */
export const selectEntrustment = (epa: EpaId) => (s: { profile: Profile }) => s.profile.entrustment[epa];
