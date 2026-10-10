import { describe, it, expect, beforeEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { CaseAttempt, ScoreState, SimMode } from "../types";
import { initScore, computeScores } from "../simulation/scoring";
import { CASE_LIBRARY, resolveCase } from "../simulation/caseGenerator";
import { PCI_SCENARIOS } from "../simulation/angioPci";
import { TRACKS } from "../content";
import {
  DIAGNOSTIC_EPAS,
  LADDER_PARAMS,
  MODULE_EVIDENCE,
  PCI_BASES,
  classifyCase,
  examCaseIds,
  heldOutRun,
  isExamCase,
  ladderFor,
  practiceCaseIds,
  simKeyEpas,
  DIAG_SPECS,
  examCases,
  READING_EXAM,
  applyPciVariant,
  pciVariantById,
} from "../content/mentor/catalogue";
import { deriveAll, deriveEntrustment, deriveMaster, EPA_IDS, EPAS, labPolicy, rungCleared, countedRungPasses, ENTRUST_RULES, MASTER_ASSESSMENT, knowledgeByEpa, passesToday, LEVEL_LABEL } from "./competency";
import { logbookCsv, migrateRows, rowFromAbandonedExam, rowFromAttempt as rowFromAttemptRaw, rowFromReadingExam, rowFromSession, rowFromSim, standardsVerdict, standardsForRow, meetsSourcedStandards, LOGBOOK_MAX } from "./logbook";
import { DIAGNOSTIC_FULL_STUDY, ENGAGEMENT_TASK } from "../mentor/standards";
import { DISCLAIMER } from "../data/teachingText";
import { allExamIds, dailyChallenge, dueSkills, EXAM_BANDS, interleavedSet, nextPracticeCase, pickExamCase, pickMasterCase, skillKey } from "./schedule";
import { moduleMastery3 } from "./mastery";
import { examSet, seenKey, setsLeft } from "./readingExam";
import { defaultProfile, migrateProfile, useProgressStore } from "../state/useProgressStore";
import { reviewSkill } from "../simulation/srs";
import type { EntrustmentRecord, EpaId, LogbookEntry } from "./types";

// --- helpers -------------------------------------------------------------------
const DAY = 86400000;
const T0 = Date.UTC(2026, 8, 1, 10); // 2026-09-01
const at = (day: number, h = 0) => T0 + day * DAY + h * 3600000;
const dateOf = (day: number) => new Date(at(day)).toISOString().slice(0, 10);

function score(over: Partial<ScoreState> = {}): ScoreState {
  return computeScores({ ...initScore(), injections: 4, selectiveInjections: 4, diagnosticInjections: 4, contrastVolume: 30, fluoroTime: 90, ...over });
}

function attempt(caseId: string, t: number, opts: { mode?: SimMode; passed?: boolean; critical?: boolean } = {}): CaseAttempt {
  const c = resolveCase(caseId)!;
  const s = score(opts.critical ? { dissections: 1 } : {});
  return { id: `a-${caseId}-${t}`, caseId, caseName: c.name, timestamp: t, mode: opts.mode ?? "case", score: s, mistakes: opts.critical ? ["dissection"] : [], passed: opts.critical ? false : opts.passed ?? true };
}

/**
 * Mentor metrics that meet both of the mentor's diagnostic standard sets (DIAGNOSTIC_FULL_STUDY
 * and ENGAGEMENT_TASK in src/mentor/standards.ts), as a lab logs them through useLabRun.
 */
const MEETS_STANDARDS: Record<string, number> = {
  standardisedLoops: 8,
  procTimeS: 420,
  fluoroS: 120,
  contrastMl: 40,
  criticalErrors: 0,
  "viewCoverage.missing": 0,
  injectWhileDamped: 0,
  lvEntries: 0,
  aspirateCompliance: 1,
};

/**
 * Diagnostic levels III and IV count only exam rows that meet the mentor's sourced standards,
 * so the ladder tests below log their exam attempts with the mentor's metrics, as the
 * diagnostic lab will once it reports them. Practice rows keep the legacy shape (no metrics).
 * rowFromAttemptRaw is the logbook's own function, used where a test needs a row without metrics.
 */
function rowFromAttempt(...args: Parameters<typeof rowFromAttemptRaw>): LogbookEntry {
  const row = rowFromAttemptRaw(...args);
  return row.mode === "exam" ? { ...row, metrics: { ...MEETS_STANDARDS } } : row;
}

const ladderCase = (epa: EpaId, rung: number, i = 0) => ladderFor(epa).diagnostic!.rungs[rung - 1].caseIds[i];
const examCase = (epa: EpaId, minRung: number, i = 0) => ladderFor(epa).diagnostic!.exam.filter((r) => r.rung >= minRung).flatMap((r) => r.caseIds)[i];

// ---------------------------------------------------------------------------
describe("case ladders and the held-out exam pool", () => {
  it("every diagnostic EPA has 6 rungs, monotone in difficulty, all reproducible", () => {
    for (const epa of DIAGNOSTIC_EPAS) {
      const d = ladderFor(epa).diagnostic!;
      expect(d.rungs).toHaveLength(LADDER_PARAMS.rungs);
      for (let r = 0; r < d.rungs.length; r++) {
        expect(d.rungs[r].caseIds.length).toBeGreaterThanOrEqual(3);
        if (r > 0) expect(d.rungs[r].min).toBeGreaterThanOrEqual(d.rungs[r - 1].max);
      }
      // mean difficulty strictly rises from rung 1 to rung 6
      const key = DIAG_SPECS[epa]!.key;
      const mean = (ids: string[]) => ids.reduce((a, id) => a + key(resolveCase(id)!), 0) / ids.length;
      expect(mean(d.rungs[5].caseIds)).toBeGreaterThan(mean(d.rungs[0].caseIds));
      for (const id of [...practiceCaseIds(epa), ...examCaseIds(epa)]) {
        const c = resolveCase(id);
        expect(c, id).toBeTruthy();
        expect(DIAG_SPECS[epa]!.keep(c!)).toBe(true);
      }
    }
  });

  it("exam cases are disjoint from practice and the library, and cover rungs 3 and 5+", () => {
    const practice = new Set(DIAGNOSTIC_EPAS.flatMap((e) => practiceCaseIds(e)));
    const library = new Set(CASE_LIBRARY.map((c) => c.id));
    for (const epa of DIAGNOSTIC_EPAS) {
      const exam = examCaseIds(epa);
      expect(exam.length).toBeGreaterThanOrEqual(6);
      for (const id of exam) {
        expect(practice.has(id)).toBe(false);
        expect(library.has(id)).toBe(false);
        expect(isExamCase(epa, id)).toBe(true);
      }
      expect(examCase(epa, 3)).toBeTruthy();
      expect(examCase(epa, 5)).toBeTruthy();
      const anatomy = (id: string) => JSON.stringify(resolveCase(id)!.lesions) + resolveCase(id)!.variants.join() + resolveCase(id)!.rootSize + resolveCase(id)!.accessRoute + resolveCase(id)!.dominance;
      // no exam case is the same seed as a practice case; anatomy may coincide by chance, the case id never does
      expect(new Set(exam).size).toBe(exam.length);
      void anatomy;
    }
  });

  it("classifies catalogue ids back to their EPA, rung and pool", () => {
    for (const epa of DIAGNOSTIC_EPAS) {
      const id = ladderCase(epa, 4);
      expect(classifyCase(id)).toEqual({ epa, rung: 4, exam: false });
      const x = examCase(epa, 5);
      const c = classifyCase(x);
      expect(c.epa).toBe(epa);
      expect(c.exam).toBe(true);
      expect(c.rung).toBeGreaterThanOrEqual(5);
    }
    expect(classifyCase(CASE_LIBRARY[0].id).exam).toBe(false);
    expect(classifyCase("angio-exam:grade:12")).toEqual({ epa: "lesion-assess", rung: 2, exam: true });
  });

  it("practice selectors never hand out an exam case", () => {
    const exam = allExamIds();
    const book: LogbookEntry[] = [];
    for (let s = 0; s < 200; s++) for (const epa of DIAGNOSTIC_EPAS) expect(exam.has(nextPracticeCase(book, epa, `s${s}`)!)).toBe(false);
    // clear rungs 1-4 everywhere, then draw interleaved sets and daily challenges
    let day = 0;
    for (const epa of DIAGNOSTIC_EPAS) for (let i = 0; i < 2; i++) book.push(rowFromAttempt(attempt(ladderCase(epa, 4, i), at(day++))));
    for (let s = 0; s < 50; s++) {
      for (const it of interleavedSet(book, 12, `i${s}`)) expect(exam.has(it.caseId)).toBe(false);
      const { entrustment } = deriveAll(book, { today: dateOf(day) });
      const dc = dailyChallenge(book, entrustment, {}, dateOf(day + s))!;
      expect(exam.has(dc.caseId)).toBe(false);
    }
  });

  it("interleaving alternates EPAs and uses cleared rungs only", () => {
    const book: LogbookEntry[] = [];
    let d = 0;
    for (const epa of ["lca-engage", "rca-engage", "diag-study"] as EpaId[]) for (let i = 0; i < 2; i++) book.push(rowFromAttempt(attempt(ladderCase(epa, 2, i), at(d++))));
    const set = interleavedSet(book, 9, "x");
    expect(set.length).toBe(9);
    for (let i = 1; i < set.length; i++) expect(set[i].epa).not.toBe(set[i - 1].epa);
    for (const it of set) expect(it.rung).toBeLessThanOrEqual(rungCleared(book, it.epa));
  });

  it("PCI ladders: base scenario is rung 1, variants rise in difficulty, exam variants held out", () => {
    for (const b of PCI_BASES) {
      const s = PCI_SCENARIOS.find((x) => x.id === b.id)!;
      expect(s, b.id).toBeTruthy();
      expect([s.target.severity, s.target.lengthMm, s.target.position, s.calcium, s.difficulty]).toEqual([b.severity, b.lengthMm, b.position, b.calcium, b.difficulty]);
      const l = ladderFor(b.epa).pci!;
      expect(l.rungs[0][0].id).toBe(`pci-${b.id}`);
      const keys = l.rungs.map((r) => r.map((v) => v.key));
      for (let r = 2; r < keys.length; r++) expect(Math.min(...keys[r])).toBeGreaterThanOrEqual(Math.max(...keys[r - 1]));
      const practice = new Set(l.rungs.flat().map((v) => v.id));
      for (const v of l.exam) {
        expect(practice.has(v.id)).toBe(false);
        expect(isExamCase(b.epa, v.id)).toBe(true);
      }
      const v = l.rungs[3][0];
      expect(pciVariantById(v.id)).toEqual(v);
      const applied = applyPciVariant(s, v);
      expect(applied.target.lengthMm).toBe(v.lengthMm);
      expect(applied.target.vessel).toBe(s.target.vessel);
    }
    expect(simKeyEpas("pci-lad-focal")).toEqual([{ epa: "pci-simple", rung: 1 }]);
    expect(simKeyEpas("pci-bench").map((x) => x.epa)).toContain("lesion-assess");
  });

  it("reading hold-out removes about a fifth of runs, deterministically", () => {
    const ids = Array.from({ length: 2000 }, (_, i) => `run-${i}`);
    const held = ids.filter(heldOutRun).length;
    expect(held / ids.length).toBeGreaterThan(0.15);
    expect(held / ids.length).toBeLessThan(0.25);
    expect(ids.filter(heldOutRun)).toEqual(ids.filter(heldOutRun));
  });
});

// ---------------------------------------------------------------------------
describe("EPA definitions", () => {
  it("defines every EPA with ten Cate's eight sections and an EAPCI expectation", () => {
    expect(EPAS.length).toBe(18);
    for (const plan of ["access-radial", "access-femoral", "lca-engage", "rca-engage", "diag-study", "diag-report", "lesion-assess", "pci-simple", "pci-calcium", "pci-stemi", "pci-cto", "complication-bailout"]) expect(EPA_IDS).toContain(plan);
    for (const e of EPAS) {
      expect(e.title.length).toBeGreaterThan(10);
      expect(e.specification && e.limitations && e.risks).toBeTruthy();
      expect(e.competencies.length).toBeGreaterThan(0);
      expect(e.ksae.knowledge && e.ksae.skills && e.ksae.attitudes && e.ksae.experience).toBeTruthy();
      expect(e.sources.length).toBeGreaterThan(0);
      expect(e.expected.length).toBeGreaterThan(0);
      expect(e.expiryDays).toBeGreaterThan(0);
    }
  });

  it("every module evidence entry names a real module and real EPAs", () => {
    const mods = new Set(TRACKS.flatMap((t) => t.modules.map((m) => m.id)));
    // manual-curriculum modules (src/content/manual/**) are mapped ahead of being written; MANUAL_COMPLETE=1 requires them all
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
    const pending = (id: string) => env.MANUAL_COMPLETE !== "1" && /^(pm|cp|cm|eq|hb)-/.test(id);
    for (const [id, ev] of Object.entries(MODULE_EVIDENCE)) {
      if (!mods.has(id) && pending(id)) continue;
      expect(mods.has(id), id).toBe(true);
      for (const e of ev.epas) expect(EPA_IDS).toContain(e);
    }
  });
});

// ---------------------------------------------------------------------------
describe("entrustment", () => {
  const epa: EpaId = "rca-engage";

  function toLevel2(book: LogbookEntry[], startDay = 0): number {
    let d = startDay;
    for (let i = 0; i < 3; i++) book.push(rowFromAttempt(attempt(ladderCase(epa, 2 + (i % 2), i), at(d++))));
    // clear rung 4 for exam eligibility toward III
    for (let i = 0; i < 2; i++) book.push(rowFromAttempt(attempt(ladderCase(epa, 4, i), at(d++))));
    return d;
  }

  it("level I from the first session, level II after three distinct practice passes", () => {
    const book: LogbookEntry[] = [];
    book.push(rowFromAttempt(attempt(ladderCase(epa, 1), at(0), { passed: false })));
    let r = deriveEntrustment(epa, book, { today: dateOf(1) });
    expect(r.awarded).toBe(1);
    book.push(rowFromAttempt(attempt(ladderCase(epa, 1), at(1))));
    book.push(rowFromAttempt(attempt(ladderCase(epa, 1), at(2)))); // same case again: not distinct
    book.push(rowFromAttempt(attempt(ladderCase(epa, 2), at(3))));
    r = deriveEntrustment(epa, book, { today: dateOf(4) });
    expect(r.awarded).toBe(1);
    book.push(rowFromAttempt(attempt(ladderCase(epa, 2, 1), at(4))));
    r = deriveEntrustment(epa, book, { today: dateOf(5) });
    expect(r.awarded).toBe(2);
    expect(r.awardedOn[2]).toBe(dateOf(4));
  });

  it("level I from knowledge alone when the linked quiz items are retained", () => {
    expect(deriveEntrustment("haemo-cath", [], { today: dateOf(0), knowledge: { "haemo-cath": 0.7 } }).awarded).toBe(1);
    expect(deriveEntrustment("haemo-cath", [], { today: dateOf(0), knowledge: { "haemo-cath": 0.3 } }).awarded).toBe(0);
    const k = knowledgeByEpa([{ id: "hd-basics", quizIds: ["a", "b"] }], { a: { reps: 2 }, b: { reps: 0 } });
    expect(k["haemo-cath"]).toBe(0.5);
  });

  it("awards level III after two exam passes on distinct held-out cases on two days", () => {
    const book: LogbookEntry[] = [];
    const d = toLevel2(book);
    book.push(rowFromAttempt(attempt(examCase(epa, 3, 0), at(d), { mode: "exam" })));
    expect(deriveEntrustment(epa, book, { today: dateOf(d) }).awarded).toBe(2);
    book.push(rowFromAttempt(attempt(examCase(epa, 3, 1), at(d + 1), { mode: "exam" })));
    const r = deriveEntrustment(epa, book, { today: dateOf(d + 1) });
    expect(r.awarded).toBe(3);
    expect(r.exams.passes).toBe(2);
  });

  it("refuses level III for two passes on the same day", () => {
    const book: LogbookEntry[] = [];
    const d = toLevel2(book);
    book.push(rowFromAttempt(attempt(examCase(epa, 3, 0), at(d, 1), { mode: "exam" })));
    book.push(rowFromAttempt(attempt(examCase(epa, 3, 1), at(d, 3), { mode: "exam" })));
    const r = deriveEntrustment(epa, book, { today: dateOf(d) });
    expect(r.awarded).toBe(2);
    expect(r.examProgress).toMatchObject({ have: 2, days: 1, needDays: 2 });
  });

  it("refuses on a critical error: the count toward the next level starts again", () => {
    const book: LogbookEntry[] = [];
    const d = toLevel2(book);
    book.push(rowFromAttempt(attempt(examCase(epa, 3, 0), at(d), { mode: "exam" })));
    book.push(rowFromAttempt(attempt(examCase(epa, 3, 1), at(d + 1), { mode: "exam", critical: true })));
    book.push(rowFromAttempt(attempt(examCase(epa, 3, 2), at(d + 2), { mode: "exam" })));
    let r = deriveEntrustment(epa, book, { today: dateOf(d + 2) });
    expect(r.awarded).toBe(2);
    expect(r.exams.criticalFails).toBe(1);
    book.push(rowFromAttempt(attempt(examCase(epa, 3, 3), at(d + 3), { mode: "exam" })));
    r = deriveEntrustment(epa, book, { today: dateOf(d + 3) });
    expect(r.awarded).toBe(3);
  });

  it("does not count a repeated exam case, a practice case run in exam mode, or exams before level II", () => {
    const book: LogbookEntry[] = [];
    book.push(rowFromAttempt(attempt(examCase(epa, 3, 0), at(0), { mode: "exam" }))); // before level II
    const d = toLevel2(book, 1);
    book.push(rowFromAttempt(attempt(examCase(epa, 3, 0), at(d), { mode: "exam" }))); // seen case
    const practiceInExam = rowFromAttempt(attempt(ladderCase(epa, 5), at(d + 1), { mode: "exam" }));
    expect(practiceInExam.mode).toBe("independent");
    book.push(practiceInExam);
    book.push(rowFromAttempt(attempt(examCase(epa, 3, 1), at(d + 2), { mode: "exam" })));
    expect(deriveEntrustment(epa, book, { today: dateOf(d + 2) }).awarded).toBe(2);
  });

  it("expires after the EPA's period without a pass, schedules a refresher, and a pass restores it", () => {
    const book: LogbookEntry[] = [];
    const d = toLevel2(book);
    const expiry = EPAS.find((e) => e.id === epa)!.expiryDays;
    let r = deriveEntrustment(epa, book, { today: dateOf(d - 1 + expiry) });
    expect(r.expired).toBe(false);
    r = deriveEntrustment(epa, book, { today: dateOf(d + expiry + 1) });
    expect(r.expired).toBe(true);
    expect(r.awarded).toBe(2);
    expect(r.effective).toBe(1);
    const due = dueSkills({}, { [epa]: r }, dateOf(d + expiry + 1));
    expect(due).toContainEqual({ epa, reason: "refresher", due: dateOf(d + expiry + 1) });
    expect(labPolicy(r).mode).toBe("guided");
    book.push(rowFromAttempt(attempt(ladderCase(epa, 3, 2), at(d + expiry + 1))));
    r = deriveEntrustment(epa, book, { today: dateOf(d + expiry + 1), prev: { [epa]: r } });
    expect(r.expired).toBe(false);
    expect(r.effective).toBe(2);
  });

  it("level IV needs three further passes at rung 5+, and level V needs the final assessment", () => {
    const book: LogbookEntry[] = [];
    let d = 0;
    // every component to level IV
    for (const e of MASTER_ASSESSMENT.components.filter((x) => DIAGNOSTIC_EPAS.includes(x))) {
      for (let i = 0; i < 3; i++) book.push(rowFromAttempt(attempt(ladderCase(e, 2, i), at(d++))));
      for (let i = 0; i < 2; i++) book.push(rowFromAttempt(attempt(ladderCase(e, 4, i), at(d++))));
      book.push(rowFromAttempt(attempt(examCase(e, 3, 0), at(d++), { mode: "exam" })));
      book.push(rowFromAttempt(attempt(examCase(e, 3, 1), at(d++), { mode: "exam" })));
      const x5 = ladderFor(e).diagnostic!.exam.filter((r) => r.rung >= 5).flatMap((r) => r.caseIds).filter((id) => id !== examCase(e, 3, 0) && id !== examCase(e, 3, 1));
      for (let i = 0; i < 3; i++) book.push(rowFromAttempt(attempt(x5[i], at(d++), { mode: "exam" })));
      expect(deriveEntrustment(e, book, { today: dateOf(d) }).awarded).toBe(4);
    }
    // diag-report (reading) to level IV with exam sets
    const rd: EpaId = "diag-report";
    for (let i = 0; i < 3; i++) book.push(rowFromSim("angio-artery", 80, at(d++)));
    for (let i = 0; i < 2; i++) book.push(rowFromReadingExam("view", 100 + i, 0.8, 18, at(d++)));
    for (let i = 0; i < 3; i++) book.push(rowFromReadingExam("plan", 200 + i, 0.8, 8, at(d++)));
    expect(deriveEntrustment(rd, book, { today: dateOf(d) }).awarded).toBe(4);
    let all = deriveAll(book, { today: dateOf(d) });
    expect(all.master.passed).toBe(false);
    expect(all.entrustment["diag-study"].awarded).toBe(4);
    // the final assessment: one more held-out pass at rung 5+ per component, inside 14 days
    const start = d;
    for (const e of MASTER_ASSESSMENT.components) {
      if (e === "diag-report") {
        book.push(rowFromReadingExam("collaterals", 900, 0.85, 12, at(d++)));
        continue;
      }
      const pick = pickMasterCase(book, e, "m");
      expect("caseId" in pick).toBe(true);
      if ("caseId" in pick) book.push(rowFromAttempt(attempt(pick.caseId, at(d++), { mode: "exam" })));
    }
    expect(d - start).toBeLessThanOrEqual(MASTER_ASSESSMENT.windowDays);
    all = deriveAll(book, { today: dateOf(d) });
    expect(all.master.passed).toBe(true);
    expect(all.entrustment["diag-study"].awarded).toBe(5);
    expect(all.entrustment["haemo-cath"].awarded).toBe(0);
  });

  it("a critical error inside the final-assessment window voids it", () => {
    const l4 = { "access-radial": dateOf(0), "lca-engage": dateOf(0), "rca-engage": dateOf(0), "diag-study": dateOf(0), "diag-report": dateOf(0) } as Record<EpaId, string>;
    const book: LogbookEntry[] = [];
    let d = 1;
    for (const e of MASTER_ASSESSMENT.components) {
      if (e === "diag-report") book.push(rowFromReadingExam("collaterals", 901, 0.9, 12, at(d++)));
      else book.push(rowFromAttempt(attempt(examCase(e, 5, 0), at(d++), { mode: "exam" })));
      if (e === "lca-engage") book.push(rowFromAttempt(attempt(examCase(e, 5, 1), at(d++), { mode: "exam", critical: true })));
    }
    expect(deriveMaster(book, l4).passed).toBe(false);
    // without the critical error the same passes complete it
    const clean = book.filter((r) => r.criticalErrors === 0);
    expect(deriveMaster(clean, l4).passed).toBe(true);
  });

  it("exam case choice: refused below level II, then an unseen held-out case at the required rung", () => {
    const book: LogbookEntry[] = [];
    const r0 = deriveEntrustment(epa, book, { today: dateOf(0) });
    expect("refused" in pickExamCase(book, epa, r0, "a")).toBe(true);
    const d = toLevel2(book);
    const r = deriveEntrustment(epa, book, { today: dateOf(d) });
    for (let s = 0; s < 30; s++) {
      const pick = pickExamCase(book, epa, r, `a${s}`);
      // level III exams draw from rungs 3-4 only, keeping rungs 5-6 for level IV and the final assessment
      expect("caseId" in pick && isExamCase(epa, pick.caseId) && pick.rung >= 3 && pick.rung <= 4 && pick.toward === 3).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
describe("exam integrity", () => {
  const COMPONENTS = MASTER_ASSESSMENT.components.filter((x) => DIAGNOSTIC_EPAS.includes(x));

  it("the held-out pool is generated on demand: many unseen cases per band, never practice or library cases", () => {
    const practice = new Set(DIAGNOSTIC_EPAS.flatMap((e) => practiceCaseIds(e)));
    const library = new Set(CASE_LIBRARY.map((c) => c.id));
    for (const epa of DIAGNOSTIC_EPAS) {
      for (const band of [EXAM_BANDS[3], EXAM_BANDS[4]]) {
        const got = examCases(epa, { ...band, count: 40 });
        expect(got.length, `${epa} ${band.minRung}`).toBe(40);
        expect(new Set(got.map((g) => g.caseId)).size).toBe(40);
        for (const g of got) {
          expect(g.rung).toBeGreaterThanOrEqual(band.minRung);
          expect(g.rung).toBeLessThanOrEqual(band.maxRung);
          expect(practice.has(g.caseId) || library.has(g.caseId)).toBe(false);
          expect(classifyCase(g.caseId)).toEqual({ epa, rung: g.rung, exam: true });
          expect(DIAG_SPECS[epa]!.keep(resolveCase(g.caseId)!)).toBe(true);
        }
      }
      // every rung 1..6 receives held-out cases
      for (let r = 1; r <= 6; r++) expect(examCases(epa, { minRung: r, maxRung: r, count: 5 }).length).toBe(5);
    }
    // an X-seed id for another EPA, or one that fails the EPA's filter, is not an exam case of it
    const other = examCases("lca-engage", { minRung: 3, count: 1 })[0].caseId;
    expect(isExamCase("rca-engage", other)).toBe(false);
  });

  it("fail, fail, critical error, abandoned and pass all the way to level V without running out", () => {
    const book: LogbookEntry[] = [];
    let d = 0;
    const exam = (e: EpaId, outcome: "pass" | "fail" | "critical" | "abandon", pick: { caseId: string }) => {
      if (outcome === "abandon") book.push(rowFromAbandonedExam(pick.caseId, undefined, at(d)));
      else book.push(rowFromAttempt(attempt(pick.caseId, at(d), { mode: "exam", passed: outcome === "pass", critical: outcome === "critical" })));
      d++;
    };
    const toward3 = ["fail", "fail", "critical", "abandon", "pass", "fail", "pass"] as const;
    const toward4 = ["fail", "critical", "abandon", "fail", "pass", "pass", "critical", "pass", "pass", "pass"] as const;
    for (const e of COMPONENTS) {
      for (let i = 0; i < 3; i++) book.push(rowFromAttempt(attempt(ladderCase(e, 2, i), at(d++))));
      for (let i = 0; i < 2; i++) book.push(rowFromAttempt(attempt(ladderCase(e, 4, i), at(d++))));
      for (const o of toward3) {
        const pick = pickExamCase(book, e, deriveEntrustment(e, book, { today: dateOf(d) }), `s${d}`);
        expect("caseId" in pick, `${e} III ${o}`).toBe(true);
        if (!("caseId" in pick)) return;
        expect(pick.rung).toBeLessThanOrEqual(4);
        exam(e, o, pick);
      }
      expect(deriveEntrustment(e, book, { today: dateOf(d) }).awarded).toBe(3);
      for (const o of toward4) {
        const pick = pickExamCase(book, e, deriveEntrustment(e, book, { today: dateOf(d) }), `s${d}`);
        expect("caseId" in pick, `${e} IV ${o}`).toBe(true);
        if (!("caseId" in pick)) return;
        expect(pick.rung).toBeGreaterThanOrEqual(5);
        exam(e, o, pick);
      }
      expect(deriveEntrustment(e, book, { today: dateOf(d) }).awarded).toBe(4);
    }
    for (let i = 0; i < 3; i++) book.push(rowFromSim("angio-artery", 80, at(d++)));
    for (let i = 0; i < 2; i++) book.push(rowFromReadingExam("view", 100 + i, 0.8, 18, at(d++)));
    for (let i = 0; i < 3; i++) book.push(rowFromReadingExam("plan", 200 + i, 0.8, 8, at(d++)));
    // the final assessment after a failed and an abandoned attempt per component: fresh unseen cases every time
    const start = d;
    for (const e of COMPONENTS) {
      for (const o of ["fail", "abandon", "pass"] as const) {
        const pick = pickMasterCase(book, e, `m${d}`);
        expect("caseId" in pick, `${e} master ${o}`).toBe(true);
        if ("caseId" in pick) book.push(o === "abandon" ? rowFromAbandonedExam(pick.caseId, undefined, at(d)) : rowFromAttempt(attempt(pick.caseId, at(d), { mode: "exam", passed: o === "pass" })));
      }
      d++;
    }
    book.push(rowFromReadingExam("collaterals", 900, 0.85, 12, at(d++)));
    expect(d - start).toBeLessThanOrEqual(MASTER_ASSESSMENT.windowDays);
    // no case was ever examined twice
    const examIds = book.filter((r) => r.mode === "exam").map((r) => r.caseId);
    expect(new Set(examIds).size).toBe(examIds.length);
    const all = deriveAll(book, { today: dateOf(d) });
    expect(all.master.passed).toBe(true);
    for (const e of MASTER_ASSESSMENT.components) expect(all.entrustment[e].awarded).toBe(5);
  });

  it("final assessment: a component exam later on the day level IV was awarded counts", () => {
    const l4 = Object.fromEntries(MASTER_ASSESSMENT.components.map((e) => [e, { date: dateOf(0), t: at(0, 1) }])) as Record<EpaId, { date: string; t: number }>;
    const rows = (h: number) =>
      MASTER_ASSESSMENT.components.map((e, i) =>
        e === "diag-report" ? rowFromReadingExam("collaterals", 950 + h, 0.9, 12, at(0, h)) : rowFromAttempt(attempt(examCases(e, { minRung: 5, count: 3 })[i % 3].caseId, at(0, h), { mode: "exam" }))
      );
    expect(deriveMaster(rows(2), l4).passed).toBe(true); // same day, after the award
    expect(deriveMaster(rows(0), l4).passed).toBe(false); // same day, before the award
    // with only the award date known (an award carried over), the next day is the first that counts
    const dates = Object.fromEntries(MASTER_ASSESSMENT.components.map((e) => [e, dateOf(0)])) as Record<EpaId, string>;
    expect(deriveMaster(rows(2), dates).passed).toBe(false);
    // end to end: deriveAll passes the award time through
    const book: LogbookEntry[] = [];
    let d = 0;
    const e: EpaId = "lca-engage";
    for (let i = 0; i < 3; i++) book.push(rowFromAttempt(attempt(ladderCase(e, 2, i), at(d++))));
    for (let i = 0; i < 2; i++) book.push(rowFromAttempt(attempt(ladderCase(e, 4, i), at(d++))));
    for (const id of examCases(e, { ...EXAM_BANDS[3], count: 2 })) book.push(rowFromAttempt(attempt(id.caseId, at(d++), { mode: "exam" })));
    const x = examCases(e, { ...EXAM_BANDS[4], count: 3 });
    x.forEach((id) => book.push(rowFromAttempt(attempt(id.caseId, at(d++, 1), { mode: "exam" }))));
    const rec = deriveAll(book, { today: dateOf(d) }).entrustment[e];
    expect(rec.awarded).toBe(4);
    expect(rec.awardedAt?.[4]).toBe(at(d - 1, 1));
  });

  it("reading exams: a failed set resets the count toward the next level", () => {
    const rd: EpaId = "diag-report";
    const book: LogbookEntry[] = [];
    let d = 0;
    for (let i = 0; i < 3; i++) book.push(rowFromSim("angio-artery", 80, at(d++)));
    book.push(rowFromReadingExam("view", 1, 0.8, 18, at(d++)));
    book.push(rowFromReadingExam("occlusion", 1, 0.5, 12, at(d++))); // failed: resets
    book.push(rowFromReadingExam("collaterals", 1, 0.8, 12, at(d++)));
    let r = deriveEntrustment(rd, book, { today: dateOf(d) });
    expect(r.awarded).toBe(2);
    expect(r.examProgress.have).toBe(1);
    book.push(rowFromReadingExam("plan", 1, 0.8, 8, at(d++)));
    r = deriveEntrustment(rd, book, { today: dateOf(d) });
    expect(r.awarded).toBe(3);
    // an abandoned set is a failed set
    const ab = rowFromReadingExam("plan", 2, 0, 8, at(d++), { answered: 3 });
    expect(ab).toMatchObject({ mode: "exam", passed: false, score: 0 });
  });

  it("reading exam sets use unseen held-out items, then items past the washout, else none", () => {
    const run = (pid: string, artery: "LCA" | "RCA") => ({ id: `${pid}-${artery}`, dataset: "CADICA" as const, patientId: pid, base: "/x/", frames: ["1.png"], fps: 15, artery });
    const patients = Array.from({ length: 15 }, (_, i) => ({ id: `p${i}`, dataset: "CADICA" as const, runs: [run(`p${i}`, "LCA"), run(`p${i}`, "RCA")] }));
    let seed = 3;
    const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const full = examSet("artery", patients, {}, dateOf(0), 0, r)!.items.length;
    expect(full).toBe(12);
    expect(setsLeft("artery", patients, {}, full)).toBe(3);
    const seen: Record<string, string> = {};
    const sizes: number[] = [];
    for (;;) {
      const got = examSet("artery", patients, seen, dateOf(0), full, r);
      if (!got || got.reused) break;
      for (const it of got.items) {
        expect(seen[seenKey("artery", it)]).toBeUndefined(); // never shown before
        seen[seenKey("artery", it)] = dateOf(0);
      }
      sizes.push(got.items.length);
    }
    expect(sizes).toEqual([12, 12, 6]);
    expect(setsLeft("artery", patients, seen, full)).toBe(0);
    // inside the washout nothing is offered; after it, seen items return
    expect(examSet("artery", patients, seen, dateOf(READING_EXAM.washoutDays - 1), full, r)).toBeNull();
    expect(examSet("artery", patients, seen, dateOf(READING_EXAM.washoutDays), full, r)?.reused).toBe(true);
  });

  it("only passed rung sessions count toward the daily cap notice", () => {
    const book: LogbookEntry[] = [];
    const ids = ladderFor("lca-engage").diagnostic!.rungs[0].caseIds;
    for (let i = 0; i < 3; i++) book.push(rowFromAttempt(attempt(ids[i], at(0, i), { passed: false })));
    book.push(rowFromAttempt(attempt(ids[3], at(0, 4))));
    expect(passesToday(book, "lca-engage", dateOf(0))).toBe(1);
  });
});

// ---------------------------------------------------------------------------
describe("blocked practice and spaced skills", () => {
  it("counts at most the daily cap of rung passes per EPA per day", () => {
    const book: LogbookEntry[] = [];
    const ids = ladderFor("lca-engage").diagnostic!.rungs.flatMap((r) => r.caseIds).slice(0, 8);
    ids.forEach((id, i) => book.push(rowFromAttempt(attempt(id, at(0, i)))));
    expect(countedRungPasses(book, "lca-engage").length).toBe(LADDER_PARAMS.dailyCountedPasses);
    ids.forEach((id, i) => book.push(rowFromAttempt(attempt(id, at(1, i)))));
    // the same cases again on day 2 are not distinct; only the 4 unused ones count
    expect(countedRungPasses(book, "lca-engage").length).toBe(8);
  });

  it("massed passes before the due date do not extend a skill's interval; a failure always reschedules", () => {
    let m = reviewSkill(undefined, true, "2026-10-01", 1);
    expect(m.due).toBe("2026-10-02");
    m = reviewSkill(m, true, "2026-10-01", 2);
    m = reviewSkill(m, true, "2026-10-01", 3);
    expect(m.due).toBe("2026-10-02");
    expect(m.attempts).toBe(3);
    m = reviewSkill(m, true, "2026-10-02", 4);
    expect(m.interval).toBe(3);
    m = reviewSkill(m, false, "2026-10-03", 5);
    expect(m.due).toBe("2026-10-04");
  });
});

// ---------------------------------------------------------------------------
describe("logbook", () => {
  it("diagnostic rows carry the session fields and EPAs", () => {
    const id = ladderCase("diag-study", 3);
    const r = rowFromAttempt(attempt(id, at(0)));
    expect(r.epas[0]).toBe("diag-study");
    expect(r.epas).toEqual(expect.arrayContaining(["lca-engage", "rca-engage"]));
    expect(r.rungs["diag-study"]).toBe(3);
    expect(r).toMatchObject({ lab: "diagnostic", runs: 4, fluoroS: 90, contrastMl: 30, criticalErrors: 0, passed: true, role: "first operator, direct supervision" });
    expect(r.access).toBe(resolveCase(id)!.accessRoute);
  });

  it("lab rows map keys to EPAs and pass thresholds", () => {
    expect(rowFromSim("haemo", 72, at(0))).toMatchObject({ lab: "haemo", epas: ["haemo-cath"], passed: true });
    expect(rowFromSim("iabp", 60, at(0)).passed).toBe(false);
    expect(rowFromSim("pci-rca-cto", 66, at(0))).toMatchObject({ lab: "pci", epas: ["pci-cto"], passed: true, caseId: "pci-rca-cto" });
    expect(rowFromSim("angio-grade", 65, at(0))).toMatchObject({ lab: "angio-reading", epas: ["lesion-assess"], passed: false });
    const s = rowFromSession({ lab: "pci", caseId: "pci-lad-focal", mode: "supervised", passed: true, devices: ["EBU3.5", "workhorse wire", "3.0x15 stent"], karMGy: 410, kapGyCm2: 38, complications: ["edge dissection"], criticalErrors: 0 });
    expect(s).toMatchObject({ epas: ["pci-simple"], rungs: { "pci-simple": 1 }, role: "first operator, direct supervision", karMGy: 410 });
    const exam = rowFromSession({ lab: "haemo", source: "haemo", caseId: "haemo-scenario-3", mode: "exam", passed: true });
    expect(exam.mode).toBe("independent"); // not a held-out case
  });

  it("exports CSV with a header and one line per row, quoting commas", () => {
    const rows = [rowFromAttempt(attempt(ladderCase("lca-engage", 1), at(0))), rowFromSim("tavi", 90, at(1))];
    rows[1].notes = 'said "ok", then left';
    const csv = logbookCsv(rows).split("\n");
    expect(csv).toHaveLength(3);
    expect(csv[0].startsWith("date,t,lab")).toBe(true);
    expect(csv[2]).toContain('"said ""ok"", then left"');
  });
});

// ---------------------------------------------------------------------------
describe("profile migration", () => {
  const old = () => ({
    createdAt: T0 - 30 * DAY,
    level: 4,
    xp: 3120,
    intensity: "obsessive",
    difficulty: "intermediate",
    currentDay: 40,
    streak: 9,
    lastActiveDate: "2026-08-30",
    totalTrainingSeconds: 5000,
    casesCompleted: 3,
    attempts: [attempt(CASE_LIBRARY[0].id, at(-3)), attempt(CASE_LIBRARY[1].id, at(-2), { passed: false }), attempt(ladderCase("rca-engage", 2), at(-1))],
    mistakes: { "lv-entry": { code: "lv-entry", count: 2, lastSeen: T0, contexts: ["x"] } },
    completedDays: [1, 2],
    examResults: { old: { best: 80, passed: true, attempts: 1 } },
    spacedRepetition: [],
    lessonsDone: { "dx-access-1": T0 },
    quizMemory: { q1: reviewSkill(undefined, true, "2026-08-30", 1) },
    caseRecords: { c1: { best: 70, attempts: 2, last: T0 } },
    simRecords: { haemo: { runs: 5, best: 88, last: at(-4) }, "pci-lad-focal": { runs: 2, best: 70, last: at(-5) } },
  });

  it("keeps every old field and builds the logbook from attempts and sim records", () => {
    const p = migrateProfile(old(), T0, dateOf(0));
    expect(p.schema).toBe(2);
    expect(p.attempts).toHaveLength(3);
    expect(p.xp).toBe(3120);
    expect(p.streak).toBe(9);
    expect(p.level).toBe(4);
    expect(p.intensity).toBe("intensive");
    expect(p.lessonsDone).toEqual({ "dx-access-1": T0 });
    expect(p.quizMemory.q1).toBeTruthy();
    expect(p.caseRecords.c1.best).toBe(70);
    expect(p.simRecords.haemo.runs).toBe(5);
    expect(p.examResults.old.passed).toBe(true);
    expect(p.logbook).toHaveLength(5);
    expect(p.logbook.every((r) => r.migrated)).toBe(true);
    const haemo = p.logbook.find((r) => r.source === "haemo")!;
    expect(haemo.aggregateOf).toBe(5);
    expect(p.entrustment["rca-engage"]!.awarded).toBeGreaterThanOrEqual(1);
    expect(p.skillMemory[skillKey("rca-engage")]).toBeTruthy();
    expect(p.migratedAt).toBe(T0);
  });

  it("does not migrate twice and survives junk", () => {
    const p = migrateProfile(old(), T0, dateOf(0));
    const again = migrateProfile(JSON.parse(JSON.stringify(p)), T0 + DAY, dateOf(1));
    expect(again.logbook).toHaveLength(p.logbook.length);
    expect(again.migratedAt).toBe(T0);
    const junk = migrateProfile({ attempts: "nope", logbook: [null, 3], simRecords: [] }, T0, dateOf(0));
    expect(junk.logbook).toEqual([]);
    expect(junk.attempts).toEqual([]);
    expect(migrateProfile(null, T0).schema).toBe(2);
    // a first run or an empty object is a new profile, not a converted one
    expect(migrateProfile(null, T0).migratedAt).toBeUndefined();
    expect(migrateProfile({}, T0).migratedAt).toBeUndefined();
    expect(migrateRows({})).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
describe("store", () => {
  beforeEach(() => useProgressStore.setState({ profile: defaultProfile(), hydrated: true }));

  it("every finished session writes one logbook row", () => {
    const st = useProgressStore.getState();
    st.recordAttempt(attempt(ladderCase("lca-engage", 1), Date.now()));
    st.recordSim("haemo", 80);
    st.recordSim("pci-lcx-stemi", 70);
    st.logSession({ lab: "mcs", source: "impella", caseId: "impella-cs1", mode: "guided", passed: true });
    st.recordReadingExam("grade", 7, 0.75, 12);
    const p = useProgressStore.getState().profile;
    expect(p.logbook).toHaveLength(5);
    expect(p.attempts).toHaveLength(1);
    expect(p.simRecords.haemo.runs).toBe(1);
    expect(p.entrustment["lca-engage"]!.awarded).toBe(1);
    expect(p.examResults["epa:lesion-assess"].attempts).toBe(1);
    expect(p.skillMemory[skillKey("mcs-support")]).toBeTruthy();
    expect(JSON.parse(useProgressStore.getState().exportLogbook("json")).rows).toHaveLength(5);
  });

  it("practice sessions take the mode of the level in force; exams keep theirs", () => {
    const st = useProgressStore.getState();
    st.recordAttempt(attempt(ladderCase("lca-engage", 1), Date.now()));
    st.recordAttempt(attempt(ladderCase("lca-engage", 1, 1), Date.now(), { mode: "challenge" }));
    st.recordSim("haemo", 80);
    let rows = useProgressStore.getState().profile.logbook;
    expect(rows.map((r) => [r.mode, r.role])).toEqual([
      ["guided", "assistant"],
      ["guided", "assistant"],
      ["guided", "assistant"],
    ]);
    // at level III on rca-engage the same launch is supervised
    const book: LogbookEntry[] = [];
    let d = -40;
    for (let i = 0; i < 3; i++) book.push(rowFromAttempt(attempt(ladderCase("rca-engage", 2 + (i % 2), i), Date.now() + d++ * DAY)));
    for (let i = 0; i < 2; i++) book.push(rowFromAttempt(attempt(ladderCase("rca-engage", 4, i), Date.now() + d++ * DAY)));
    for (const x of examCases("rca-engage", { ...EXAM_BANDS[3], count: 2 })) book.push(rowFromAttempt(attempt(x.caseId, Date.now() + d++ * DAY, { mode: "exam" })));
    useProgressStore.setState({ profile: migrateProfile({ ...defaultProfile(), schema: 2, logbook: book }) });
    expect(useProgressStore.getState().profile.entrustment["rca-engage"]!.effective).toBe(3);
    expect(useProgressStore.getState().setActivePolicy("rca-engage").mode).toBe("supervised");
    useProgressStore.getState().recordAttempt(attempt(ladderCase("rca-engage", 5), Date.now()));
    rows = useProgressStore.getState().profile.logbook;
    expect(rows[rows.length - 1]).toMatchObject({ mode: "supervised", role: "first operator, direct supervision" });
  });

  it("an exam counts as attempted when it loads; leaving logs a failed first attempt", () => {
    const book: LogbookEntry[] = [];
    let d = -20;
    for (let i = 0; i < 3; i++) book.push(rowFromAttempt(attempt(ladderCase("rca-engage", 2 + (i % 2), i), Date.now() + d++ * DAY)));
    for (let i = 0; i < 2; i++) book.push(rowFromAttempt(attempt(ladderCase("rca-engage", 4, i), Date.now() + d++ * DAY)));
    useProgressStore.setState({ profile: migrateProfile({ ...defaultProfile(), schema: 2, logbook: book }) });
    const st = () => useProgressStore.getState();
    const p0 = st().profile;
    const pick = pickExamCase(p0.logbook, "rca-engage", p0.entrustment["rca-engage"], "seed");
    if (!("caseId" in pick)) throw new Error(pick.refused);
    st().beginExam({ caseId: pick.caseId, epa: "rca-engage", kind: "diagnostic", rung: pick.rung });
    expect(st().profile.pendingExams).toHaveLength(1);
    // the same seed no longer offers the loaded case
    const again = pickExamCase(st().profile.logbook, "rca-engage", st().profile.entrustment["rca-engage"], "seed", st().profile.pendingExams);
    expect("caseId" in again && again.caseId !== pick.caseId).toBe(true);
    st().abandonExam(pick.caseId);
    st().abandonExam(pick.caseId); // idempotent
    const rows = st().profile.logbook.filter((r) => r.mode === "exam");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ caseId: pick.caseId, passed: false, role: "first operator, examined" });
    expect(st().profile.pendingExams).toHaveLength(0);
    expect(st().profile.entrustment["rca-engage"]!.exams.attempts).toBe(1);
    // a finished exam closes its pending entry, and a later abandon does nothing
    const p2 = pickExamCase(st().profile.logbook, "rca-engage", st().profile.entrustment["rca-engage"], "x");
    if (!("caseId" in p2)) throw new Error(p2.refused);
    st().beginExam({ caseId: p2.caseId, epa: "rca-engage", kind: "diagnostic", rung: p2.rung });
    st().recordAttempt(attempt(p2.caseId, Date.now(), { mode: "exam" }));
    st().abandonExam(p2.caseId);
    expect(st().profile.pendingExams).toHaveLength(0);
    expect(st().profile.logbook.filter((r) => r.mode === "exam").map((r) => r.passed)).toEqual([false, true]);
  });

  it("an exam still pending when the app starts again is logged as failed", () => {
    const store = new Map<string, string>();
    const shim = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
    const prev = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", { value: shim, configurable: true, writable: true });
    try {
      const id = examCases("lca-engage", { minRung: 3, count: 1 })[0].caseId;
      const saved = { ...defaultProfile(), pendingExams: [{ caseId: id, epa: "lca-engage", kind: "diagnostic", rung: 3, startedT: Date.now() - 3600000 }] };
      store.set("cathmaster:v1:progress", JSON.stringify(saved));
      useProgressStore.getState().hydrate();
      const p = useProgressStore.getState().profile;
      expect(p.pendingExams).toHaveLength(0);
      expect(p.logbook.filter((r) => r.mode === "exam")).toMatchObject([{ caseId: id, passed: false }]);
      expect(p.migratedAt).toBeUndefined();
    } finally {
      if (prev) Object.defineProperty(globalThis, "localStorage", prev);
      else delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  });

  it("reading exams record the items shown so a later set can exclude them", () => {
    const st = () => useProgressStore.getState();
    st().beginExam({ caseId: "angio-exam:occlusion:1", epa: "diag-report", kind: "reading", rung: 4, drill: "occlusion", items: 6, seen: ["r1", "r2"] });
    st().abandonExam("angio-exam:occlusion:1", 2);
    st().beginExam({ caseId: "angio-exam:occlusion:2", epa: "diag-report", kind: "reading", rung: 4, drill: "occlusion", items: 6, seen: ["r2", "r3"] });
    st().recordReadingExam("occlusion", 2, 0.9, 6);
    const p = st().profile;
    expect(Object.keys(p.seenExamItems.occlusion).sort()).toEqual(["r1", "r2", "r3"]);
    expect(Object.values(p.seenExamItems.occlusion).every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))).toBe(true);
    // an early build stored a plain list: it loads with today's date
    expect(migrateProfile({ ...defaultProfile(), schema: 2, seenExamItems: { view: ["a"] } }, T0, dateOf(0)).seenExamItems).toEqual({ view: { a: dateOf(0) } });
    expect(p.pendingExams).toHaveLength(0);
    expect(p.logbook.map((r) => [r.caseId, r.passed])).toEqual([
      ["angio-exam:occlusion:1", false],
      ["angio-exam:occlusion:2", true],
    ]);
  });

  it("a PCI skill card is graded by the next finished session on its scenario", () => {
    const st = () => useProgressStore.getState();
    st().armCard("pci-simple:wire-in-septal", "wire-in-septal" as never, "pci-lad-focal");
    st().recordSim("pci-rca-cto", 90); // another scenario: not graded
    expect(st().profile.quizMemory["pci-simple:wire-in-septal"]).toBeUndefined();
    st().recordSim("pci-lad-focal", 80);
    expect(st().profile.quizMemory["pci-simple:wire-in-septal"]).toMatchObject({ reps: 1 });
  });

  it("import runs the migration", () => {
    const ok = useProgressStore.getState().importJSON(JSON.stringify({ attempts: [attempt(CASE_LIBRARY[2].id, T0)], xp: 10 }));
    expect(ok).toBe(true);
    expect(useProgressStore.getState().profile.logbook).toHaveLength(1);
    expect(useProgressStore.getState().importJSON("[1,2]")).toBe(false);
    expect(useProgressStore.getState().importJSON("{bad")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
describe("three-part module mastery", () => {
  const mod = TRACKS.flatMap((t) => t.modules).find((m) => m.id === "pci-procedure")!;
  const allRead = Object.fromEntries(mod.lessons.map((l) => [l.id, 1]));
  const allQuiz = Object.fromEntries(mod.quiz.map((q) => [q.id, { ...reviewSkill(undefined, true, "2026-10-01", 1), reps: 2 }]));

  it("a PCI module cannot reach 100% without its skill evidence", () => {
    const m = moduleMastery3(mod, { lessonsDone: allRead, quizMemory: allQuiz, logbook: [] });
    expect(m.read).toBe(1);
    expect(m.quiz).toBe(1);
    expect(m.apply).toBe(0);
    expect(m.overall).toBeLessThan(100);
    // the base scenario passed on two separate days clears rung 1 (the only playable rung)
    const book = [rowFromSim("pci-lad-focal", 80, at(0)), rowFromSim("pci-lad-focal", 80, at(0, 2))];
    expect(moduleMastery3(mod, { lessonsDone: allRead, quizMemory: allQuiz, logbook: book }).overall).toBeLessThan(100);
    book.push(rowFromSim("pci-lad-focal", 80, at(1)));
    const m2 = moduleMastery3(mod, { lessonsDone: allRead, quizMemory: allQuiz, logbook: book });
    // two distinct passes on rung 1 of pci-simple clear it (the playable rung)
    expect(m2.skill![0]).toMatchObject({ epa: "pci-simple", cleared: 1, target: 1 });
    expect(m2.overall).toBe(100);
  });

  it("image reading counts pooled balanced accuracy on the module's drills", () => {
    const dx = TRACKS.flatMap((t) => t.modules).find((m) => m.id === "dx-interpretation")!;
    const read = Object.fromEntries(dx.lessons.map((l) => [l.id, 1]));
    const quiz = Object.fromEntries(dx.quiz.map((q) => [q.id, { ...reviewSkill(undefined, true, "2026-10-01", 1), reps: 2 }]));
    const constant = ["estimate", "locate", "occlusion"].flatMap((drill) => Array.from({ length: 12 }, (_, i) => ({ drill, ref: i % 2, ans: 0 })));
    const m = moduleMastery3(dx, { lessonsDone: read, quizMemory: quiz, logbook: [] }, constant);
    expect(m.reading!.every((r) => r.value === 0)).toBe(true);
    expect(m.overall).toBeLessThan(100);
    const expert = constant.map((r) => ({ ...r, ans: r.ref }));
    expect(moduleMastery3(dx, { lessonsDone: read, quizMemory: quiz, logbook: [] }, expert).overall).toBe(100);
  });
});

// ---------------------------------------------------------------------------
describe("no game mechanics left in the UI", () => {
  const root = join(__dirname, "..");
  const files = [
    "App.tsx",
    "ui/sections/Dashboard.tsx",
    "ui/sections/Analytics.tsx",
    "ui/sections/Pathway.tsx",
    "ui/sections/CaseLibrary.tsx",
    "ui/sections/Challenge.tsx",
    "ui/sections/DailyPlan.tsx",
    "ui/sections/Review.tsx",
    "ui/sections/Settings.tsx",
    "ui/content/QuizRunner.tsx",
    "data/curriculum.ts",
  ];
  it.each(files)("%s has no XP, streak or level-title text", (f) => {
    const p = join(root, f);
    if (!existsSync(p)) return;
    const s = readFileSync(p, "utf8");
    expect(s).not.toMatch(/\bXP\b/);
    expect(s).not.toMatch(/streak/i);
    expect(s).not.toMatch(/levelDef|\bLEVELS\b/);
    expect(s).not.toMatch(/Aortic Root Novice|Projection Master|Advanced Diagnostic Angiographer|obsessive.*10 h/i);
  });
});

// ---------------------------------------------------------------------------
describe("screens render with a populated profile (server-side smoke test)", () => {
  it("renders every progression screen without throwing", async () => {
    const { createElement: h } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { useUiStore } = await import("../state/useUiStore");
    await (await import("../ui/content/useContent")).loadContent();
    // Server rendering reads each store's initial state (zustand's server snapshot), so the
    // test writes the scenario into that object as well as into the live state.
    const serverSnap = <T extends object>(st: { getInitialState: () => T }, patch: Partial<T>) => Object.assign(st.getInitialState(), patch);
    // a learner at level II on rca-engage with one exam pass, plus lab sessions
    const book: LogbookEntry[] = [];
    let d = 0;
    for (let i = 0; i < 3; i++) book.push(rowFromAttempt(attempt(ladderCase("rca-engage", 2 + (i % 2), i), at(d++))));
    for (let i = 0; i < 2; i++) book.push(rowFromAttempt(attempt(ladderCase("rca-engage", 4, i), at(d++))));
    book.push(rowFromAttempt(attempt(examCase("rca-engage", 3, 0), at(d++), { mode: "exam" })));
    book.push(rowFromSim("haemo", 80, at(d++)), rowFromSim("pci-lad-focal", 55, at(d++)));
    const p = migrateProfile({ ...defaultProfile(T0), schema: 2, logbook: book }, T0, dateOf(d));
    useProgressStore.setState({ profile: p, hydrated: true });
    serverSnap(useProgressStore, { profile: p, hydrated: true });
    const screens = [
      ["Dashboard", (await import("../ui/sections/Dashboard")).default],
      ["Analytics", (await import("../ui/sections/Analytics")).default],
      ["Challenge", (await import("../ui/sections/Challenge")).default],
      ["DailyPlan", (await import("../ui/sections/DailyPlan")).default],
      ["Settings", (await import("../ui/sections/Settings")).default],
      ["CaseLibrary", (await import("../ui/sections/CaseLibrary")).default],
      ["Review", (await import("../ui/sections/Review")).default],
      ["Pathway", (await import("../ui/sections/Pathway")).default],
    ] as const;
    for (const [name, C] of screens) {
      const html = renderToString(h(C));
      expect(html.length, name).toBeGreaterThan(100);
      expect(html, name).not.toMatch(/\bXP\b|day streak/);
    }
    for (const tab of ["competencies", "logbook", "trends"] as const) {
      serverSnap(useUiStore, { progressTab: tab, focusEpa: "rca-engage" });
      const html = renderToString(h((await import("../ui/sections/Analytics")).default));
      expect(html.length).toBeGreaterThan(500);
      if (tab === "competencies") expect(html).toContain("Engage the right coronary artery");
      if (tab === "logbook") {
        const plain = html.replace(/<!-- -->/g, "");
        expect(plain).toContain("first operator, examined");
      }
    }
    serverSnap(useUiStore, { pathway: { trackId: "pci-core", moduleId: "pci-procedure", tab: "cases" } });
    const mod = renderToString(h((await import("../ui/sections/Pathway")).default));
    expect(mod).toContain("Apply: evidence this module needs");
    expect(mod).toContain("Perform PCI of a simple lesion");
    const challenge = renderToString(h((await import("../ui/sections/Challenge")).default));
    expect(challenge.replace(/<!-- -->/g, "")).toContain("Exam passes toward the next level: 1 of 2");
    serverSnap(useProgressStore, { profile: defaultProfile(), hydrated: false });
  }, 240_000);
});

// ---------------------------------------------------------------------------
describe("honest entrustment labels (progression-labels)", () => {
  it("no level label or detail says 'without direct supervision'; every label names the simulator", () => {
    for (const L of [0, 1, 2, 3, 4, 5] as const) {
      const { short, detail } = LEVEL_LABEL[L];
      for (const text of [short, detail]) {
        expect(text.toLowerCase(), `level ${L}`).not.toContain("without direct supervision");
        expect(text, `level ${L}`).toMatch(/simulator/i);
      }
      expect(short.toLowerCase(), `level ${L}`).not.toMatch(/^independent$/);
    }
  });

  it("level IV states it is simulator entrustment and repeats the disclaimer's supervision rule", () => {
    const rule = "under direct expert supervision";
    expect(DISCLAIMER).toContain(rule);
    expect(LEVEL_LABEL[4].detail).toMatch(/simulator only/i);
    expect(LEVEL_LABEL[4].detail).toContain(rule);
    expect(LEVEL_LABEL[5].detail).toContain(rule);
  });
});

// ---------------------------------------------------------------------------
describe("diagnostic levels III and IV rest on the mentor's sourced standards (progression-labels)", () => {
  const epa: EpaId = "diag-study";

  /** A diagnostic attempt whose composite (scoring.ts finalScore) is 90. */
  function attempt90(caseId: string, t: number, mode: SimMode = "case"): CaseAttempt {
    const a = attempt(caseId, t, { mode });
    return { ...a, score: { ...a.score, finalScore: 90 }, passed: true };
  }

  /** Level II on diag-study from practice rows without mentor metrics (the legacy shape). */
  function practiceToLevel2(book: LogbookEntry[]): number {
    let d = 0;
    for (let i = 0; i < 3; i++) book.push(rowFromAttemptRaw(attempt90(ladderCase(epa, 2 + (i % 2), i), at(d++))));
    for (let i = 0; i < 2; i++) book.push(rowFromAttemptRaw(attempt90(ladderCase(epa, 4, i), at(d++))));
    return d;
  }

  const exam90 = (i: number, day: number, metrics?: Record<string, number>): LogbookEntry => {
    const row = rowFromAttemptRaw(attempt90(examCase(epa, 3, i), at(day), "exam"));
    return metrics ? { ...row, metrics } : row;
  };

  it("practice rows without mentor metrics still count toward levels I and II on the formative score", () => {
    const book: LogbookEntry[] = [];
    const d = practiceToLevel2(book);
    expect(book.every((r) => r.metrics === undefined && r.score === 90 && r.passed)).toBe(true);
    const r = deriveEntrustment(epa, book, { today: dateOf(d) });
    expect(r.awarded).toBe(2);
    expect(r.practicePasses).toBe(5);
  });

  it("a full-study exam with finalScore 90 and a failed DIAGNOSTIC_FULL_STUDY standard does not count toward level III; one that passes does", () => {
    const book: LogbookEntry[] = [];
    const d = practiceToLevel2(book);
    // contrast at the Jensen 2016 ceiling fails the standard (contrast < 50 mL)
    const failing = { ...MEETS_STANDARDS, contrastMl: 50 };
    const f1 = exam90(0, d, failing);
    const f2 = exam90(1, d + 1, failing);
    expect(f1.lab).toBe("diagnostic");
    expect(f1.mode).toBe("exam");
    expect(f1.score).toBe(90);
    expect(f1.passed).toBe(true);
    expect(standardsForRow(f1)).toBe(DIAGNOSTIC_FULL_STUDY);
    const v = standardsVerdict(f1)!;
    expect(v.set).toBe("full-study");
    expect(v.measured).toBe(true);
    expect(v.passed).toBe(false);
    expect(v.results.filter((x) => !x.pass).map((x) => x.standard.id)).toEqual(["diag-contrast"]);
    expect(meetsSourcedStandards(f1)).toBe(false);
    book.push(f1, f2);
    let r = deriveEntrustment(epa, book, { today: dateOf(d + 1) });
    expect(r.awarded).toBe(2);
    expect(r.examProgress.have).toBe(0);
    expect(r.exams).toMatchObject({ attempts: 2, passes: 0, criticalFails: 0 });
    expect(r.next).toContain("passing standards");
    // two more held-out exams with the same composite that meet every standard award level III
    const p1 = exam90(2, d + 2, { ...MEETS_STANDARDS });
    const p2 = exam90(3, d + 3, { ...MEETS_STANDARDS });
    expect(standardsVerdict(p1)!.passed).toBe(true);
    expect(meetsSourcedStandards(p1)).toBe(true);
    book.push(p1, p2);
    r = deriveEntrustment(epa, book, { today: dateOf(d + 3) });
    expect(r.awarded).toBe(3);
    expect(r.awardedOn[3]).toBe(dateOf(d + 3));
    expect(r.exams.passes).toBe(2);
  });

  it("an exam row without mentor metrics, or without the literature metrics, does not count toward level III", () => {
    const book: LogbookEntry[] = [];
    const d = practiceToLevel2(book);
    const bare = exam90(0, d);
    expect(bare.metrics).toBeUndefined();
    expect(standardsVerdict(bare)).toMatchObject({ measured: false, passed: false });
    const { standardisedLoops: _omit, ...partial } = MEETS_STANDARDS;
    const noLoops = exam90(1, d + 1, partial);
    expect(standardsVerdict(noLoops)).toMatchObject({ measured: false, passed: false });
    book.push(bare, noLoops);
    expect(deriveEntrustment(epa, book, { today: dateOf(d + 1) }).awarded).toBe(2);
  });

  it("a passing standards verdict does not lift a row the lab marked failed, or one with a critical error", () => {
    const failed = { ...exam90(0, 10, { ...MEETS_STANDARDS }), passed: false };
    expect(meetsSourcedStandards(failed)).toBe(false);
    const critical = { ...exam90(1, 11, { ...MEETS_STANDARDS }), criticalErrors: 1 };
    expect(meetsSourcedStandards(critical)).toBe(false);
    // critical errors are read from the row as well as from the metrics
    expect(standardsVerdict(critical)!.passed).toBe(false);
  });

  it("single-coronary rows are judged on the engagement task, as the mentor's debrief judges them", () => {
    const row = rowFromAttemptRaw(attempt(examCase("rca-engage", 3, 0), at(0), { mode: "exam" }));
    expect(row.epas).not.toContain("diag-study");
    expect(standardsForRow(row)).toBe(ENGAGEMENT_TASK);
    expect(standardsVerdict({ ...row, metrics: { ...MEETS_STANDARDS } })).toMatchObject({ set: "engagement", measured: true, passed: true });
    expect(standardsVerdict({ ...row, metrics: { ...MEETS_STANDARDS, injectWhileDamped: 1 } })!.passed).toBe(false);
    // rows of labs the standards do not cover keep their own pass rule
    const reading = rowFromReadingExam("view", 1, 0.8, 18, at(0));
    expect(standardsVerdict(reading)).toBeUndefined();
    expect(meetsSourcedStandards(reading)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe("stored profiles recomputed on load (progression-labels)", () => {
  /** A logbook that reached level III on rca-engage, its exams logged with or without mentor metrics. */
  function bookToLevel3(withMetrics: boolean, startDay = -40): LogbookEntry[] {
    const book: LogbookEntry[] = [];
    let d = startDay;
    const now = Date.now();
    for (let i = 0; i < 3; i++) book.push(rowFromAttemptRaw(attempt(ladderCase("rca-engage", 2 + (i % 2), i), now + d++ * DAY)));
    for (let i = 0; i < 2; i++) book.push(rowFromAttemptRaw(attempt(ladderCase("rca-engage", 4, i), now + d++ * DAY)));
    for (const x of examCases("rca-engage", { ...EXAM_BANDS[3], count: 2 })) {
      const row = rowFromAttemptRaw(attempt(x.caseId, now + d++ * DAY, { mode: "exam" }));
      book.push(withMetrics ? { ...row, metrics: { ...MEETS_STANDARDS } } : row);
    }
    return book;
  }

  /** The entrustment cache a profile stored before this rule: what the legacy composite rule awarded. */
  function legacyCache(book: LogbookEntry[]): Record<EpaId, EntrustmentRecord> {
    const asLegacyRule = book.map((r) => (r.mode === "exam" && r.passed ? { ...r, metrics: { ...MEETS_STANDARDS } } : r));
    return deriveAll(asLegacyRule, { today: todayIso() }).entrustment;
  }
  const todayIso = () => new Date().toISOString().slice(0, 10);

  it("a legacy level III earned on the composite score alone is withdrawn on load, and no EPA rises", () => {
    const book = bookToLevel3(false);
    const stored = legacyCache(book);
    expect(stored["rca-engage"].awarded).toBe(3);
    const p = migrateProfile({ ...defaultProfile(), schema: 2, logbook: book, entrustment: stored });
    expect(p.entrustment["rca-engage"]!.awarded).toBe(2);
    expect(p.entrustment["rca-engage"]!.awardedOn[3]).toBeUndefined();
    for (const e of EPA_IDS) {
      expect(p.entrustment[e]!.awarded, e).toBeLessThanOrEqual(stored[e].awarded);
      expect(p.entrustment[e]!.effective, e).toBeLessThanOrEqual(stored[e].effective);
    }
    // loading the recomputed profile again changes nothing
    const again = migrateProfile(JSON.parse(JSON.stringify(p)));
    for (const e of EPA_IDS) expect(again.entrustment[e]!.awarded, e).toBe(p.entrustment[e]!.awarded);
  });

  it("a level III earned on the standards survives the reload unchanged", () => {
    const book = bookToLevel3(true);
    const stored = deriveAll(book, { today: todayIso() }).entrustment;
    expect(stored["rca-engage"].awarded).toBe(3);
    const p = migrateProfile(JSON.parse(JSON.stringify({ ...defaultProfile(), schema: 2, logbook: book, entrustment: stored })));
    expect(p.logbook.filter((r) => r.mode === "exam").every((r) => r.metrics?.standardisedLoops === 8)).toBe(true);
    for (const e of EPA_IDS) expect(p.entrustment[e]!.awarded, e).toBe(stored[e].awarded);
  });

  it("rows that meet the standards but failed the lab's own pass never lift a stored level", () => {
    const book = bookToLevel3(true).map((r) => (r.mode === "exam" ? { ...r, passed: false } : r));
    const stored = legacyCache(book);
    expect(stored["rca-engage"].awarded).toBe(2);
    const p = migrateProfile({ ...defaultProfile(), schema: 2, logbook: book, entrustment: stored });
    for (const e of EPA_IDS) expect(p.entrustment[e]!.awarded, e).toBeLessThanOrEqual(stored[e].awarded);
    expect(p.entrustment["rca-engage"]!.awarded).toBe(2);
  });

  it("an award whose evidence was trimmed from a full logbook is kept, as every award is", () => {
    const epa: EpaId = "rca-engage";
    const prev: EntrustmentRecord = {
      ...deriveEntrustment(epa, [], { today: "2026-09-30" }),
      awarded: 3,
      effective: 3,
      awardedOn: { 1: "2026-01-02", 2: "2026-02-01", 3: "2026-03-01" },
    };
    const filler = rowFromSim("haemo", 80, at(0));
    const later = rowFromAttemptRaw(attempt(ladderCase(epa, 5), at(28)));
    const full = Array.from({ length: LOGBOOK_MAX - 1 }, (_, i) => ({ ...filler, id: `f${i}` }));
    const kept = deriveEntrustment(epa, [...full, later], { today: dateOf(28), prev: { [epa]: prev } });
    expect(kept.awarded).toBe(3);
    expect(kept.awardedOn[3]).toBe("2026-03-01");
    // with room left in the logbook the history is held, so the same award is re-judged
    const judged = deriveEntrustment(epa, [later], { today: dateOf(28), prev: { [epa]: prev } });
    expect(judged.awarded).toBe(2);
  });

  it("a stored final assessment resting on withdrawn level IV awards is derived again", () => {
    const today = dateOf(30);
    const prev: Partial<Record<EpaId, EntrustmentRecord>> = {};
    const book: LogbookEntry[] = [];
    let d = 0;
    for (const e of MASTER_ASSESSMENT.components) {
      const base = deriveEntrustment(e, [], { today });
      prev[e] = { ...base, awarded: 5, effective: 5, awardedOn: { 1: dateOf(0), 2: dateOf(1), 3: dateOf(2), 4: dateOf(3), 5: dateOf(4) } };
      if (DIAGNOSTIC_EPAS.includes(e)) book.push(rowFromAttemptRaw(attempt(ladderCase(e, 1), at(d++))));
    }
    const master = { passed: true, passedOn: dateOf(4), components: {} };
    const all = deriveAll(book, { today, prev, master });
    expect(all.master.passed).toBe(false);
    for (const e of MASTER_ASSESSMENT.components.filter((x) => DIAGNOSTIC_EPAS.includes(x))) expect(all.entrustment[e].awarded, e).toBeLessThanOrEqual(2);
    // the reading component is not a diagnostic-lab EPA: its awards are kept
    expect(all.entrustment["diag-report"].awardedOn[4]).toBe(dateOf(3));
    // level V rested on the withdrawn final assessment: no component keeps it
    expect(all.entrustment["diag-report"].awardedOn[5]).toBeUndefined();
    expect(all.entrustment["diag-report"].awarded).toBe(4);
    for (const e of EPA_IDS) {
      expect(all.entrustment[e].awardedOn[5], e).toBeUndefined();
      expect(all.entrustment[e].awarded, e).toBeLessThan(5);
    }
  });

  it("a stored final assessment that still holds keeps every component's level V", () => {
    const today = dateOf(30);
    const prev: Partial<Record<EpaId, EntrustmentRecord>> = {};
    for (const e of MASTER_ASSESSMENT.components) {
      const base = deriveEntrustment(e, [], { today });
      prev[e] = { ...base, awarded: 5, effective: 5, awardedOn: { 1: dateOf(0), 2: dateOf(1), 3: dateOf(2), 4: dateOf(3), 5: dateOf(4) } };
    }
    const master = { passed: true, passedOn: dateOf(4), components: {} };
    // a full logbook whose rows no longer hold these EPAs' history: every award is kept, so the final assessment holds
    const filler = rowFromSim("haemo", 80, at(0));
    const full = Array.from({ length: LOGBOOK_MAX }, (_, i) => ({ ...filler, id: `f${i}` }));
    const all = deriveAll(full, { today, prev, master });
    expect(all.master.passed).toBe(true);
    for (const e of MASTER_ASSESSMENT.components) expect(all.entrustment[e].awardedOn[5], e).toBe(dateOf(4));
  });
});
