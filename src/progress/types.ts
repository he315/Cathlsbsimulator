// ---------------------------------------------------------------------------
// Progression data model (stream S12, wave-2 track I4).
//
// Replaces the old game progression (XP, level titles, day streak) with:
//   - a simulator logbook: one row per finished session in any lab;
//   - EPA-style entrustment per competency, mapped onto the EAPCI 2020 levels
//     of competence I-V (facts/I4.md);
//   - spaced practice of procedural skills (one SM-2 record per EPA).
//
// ProgressProfile in src/types/index.ts is owned by S1 and still carries the
// legacy fields (level, xp, streak). They are kept, frozen and never shown,
// so an exported profile loses nothing; ProgressProfileV2 adds the new fields.
// ---------------------------------------------------------------------------

import type { AccessRoute, ProgressProfile } from "../types";
import type { QuizMemory } from "../simulation/srs";
import type { DecisionRecord } from "../mentor/ledger";

/** Competency domains the task names: diagnostic angiography, PCI steps, haemodynamics, MCS, structural. */
export type CompetencyDomain = "diagnostic" | "pci" | "haemodynamics" | "mcs" | "structural";

export type EpaId =
  // diagnostic angiography (plan S12)
  | "access-radial"
  | "access-femoral"
  | "lca-engage"
  | "rca-engage"
  | "diag-study"
  | "diag-report"
  | "lesion-assess"
  // PCI steps (plan S12)
  | "pci-simple"
  | "pci-calcium"
  | "pci-stemi"
  | "pci-cto"
  | "complication-bailout"
  // haemodynamics, MCS, structural (task I4)
  | "haemo-cath"
  | "coronary-physiology"
  | "mcs-support"
  | "structural-tavi"
  | "structural-mitral-laao"
  | "bedside-emergency";

/**
 * Entrustment level 0..5. 1..5 are the EAPCI 2020 levels of competence I..V
 * (Van Belle 2021, doi 10.4244/EIJ-D-18-00448); 0 means no evidence yet.
 */
export type EntrustLevel = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * How the session was run. guided / supervised / independent / exam are the
 * mentor's assessment modes (src/mentor/types.ts). "practice" is a session from
 * a lab that does not report a mode yet (counted as supervised practice, never as exam).
 */
export type LogMode = "guided" | "supervised" | "independent" | "exam" | "practice";

/** The learner's role in the session, read from the mode (EAPCI wording). */
export type LogRole = "assistant" | "first operator, direct supervision" | "first operator, independent" | "first operator, examined";

export type LogLab =
  | "diagnostic"
  | "procedure"
  | "pci"
  | "pci-bench"
  | "physiology"
  | "haemo"
  | "mcs"
  | "structural"
  | "bedside"
  | "angio-reading";

/** One finished simulator session. */
export interface LogbookEntry {
  id: string;
  /** epoch ms at the end of the session */
  t: number;
  /** yyyy-mm-dd (same calendar as the spaced-repetition store) */
  date: string;
  lab: LogLab;
  /** the recording key the lab used (sim key, or "attempt" for the diagnostic store) */
  source: string;
  caseId: string;
  caseName: string;
  /** EPAs this session is evidence for; the first is the primary one */
  epas: EpaId[];
  /** ladder rung per EPA (1..6) where it can be determined */
  rungs: Partial<Record<EpaId, number>>;
  mode: LogMode;
  role: LogRole;
  indication?: string;
  access?: AccessRoute;
  /** catheters, wires, balloons, stents and other devices used */
  devices: string[];
  /** cine runs acquired */
  runs?: number;
  fluoroS?: number;
  /** reference air kerma, mGy */
  karMGy?: number;
  /** kerma-area product, Gy·cm² */
  kapGyCm2?: number;
  contrastMl?: number;
  complications: string[];
  criticalErrors: number;
  /** formative composite 0..100 (internal analytics, never a progression criterion on its own) */
  score?: number;
  passed: boolean;
  durationS?: number;
  hints?: number;
  /** free-text or debrief headline */
  notes?: string;
  /** row created when an old profile was migrated */
  migrated?: boolean;
  /** a migrated summary standing for this many earlier sessions (no per-session detail survives) */
  aggregateOf?: number;
  /** the scenario the lab ran (launch param "scenario"), when the lab has scenarios */
  scenarioId?: string;
  /** scored decisions of the run (src/mentor/ledger.ts), in the order they were made */
  decisions?: DecisionRecord[];
  /** lab-specific measures of the run (name → number), for the debrief and later analysis */
  metrics?: Record<string, number>;
}

/** What a lab passes to logSession(); missing fields are filled from the case and mode. */
export interface LogSessionInput {
  lab: LogLab;
  source?: string;
  caseId: string;
  caseName?: string;
  /** explicit EPAs; otherwise inferred from the lab, source and case */
  epas?: EpaId[];
  rungs?: Partial<Record<EpaId, number>>;
  mode: LogMode;
  indication?: string;
  access?: AccessRoute;
  devices?: string[];
  runs?: number;
  fluoroS?: number;
  karMGy?: number;
  kapGyCm2?: number;
  contrastMl?: number;
  complications?: string[];
  criticalErrors?: number;
  score?: number;
  passed: boolean;
  durationS?: number;
  hints?: number;
  notes?: string;
  t?: number;
  /** the scenario the lab ran (caseId is "<sim>:<scenario>[~variant]" for scenario labs) */
  scenarioId?: string;
  /** scored decisions of the run (useLabRun's decide) */
  decisions?: DecisionRecord[];
  /** lab-specific measures of the run */
  metrics?: Record<string, number>;
  /**
   * The id the case catalogue knows the run by (a PCI variant key "pci-<base>[~variant]" or a
   * diagnostic case id), when caseId is a run id "<sim>:<scenario>[~variant]". The logbook
   * classifies the row (EPA, rung, held-out exam, case name) and closes a pending exam by this id;
   * the stored row keeps caseId. Not stored on the row.
   */
  classifyId?: string;
}

/** Derived entrustment state for one EPA (recomputed from the logbook, cached in the profile). */
export interface EntrustmentRecord {
  epa: EpaId;
  /** highest level awarded (awards are kept; expiry lowers the effective level only) */
  awarded: EntrustLevel;
  /** level in force today, after expiry */
  effective: EntrustLevel;
  /** yyyy-mm-dd per awarded level */
  awardedOn: Partial<Record<EntrustLevel, string>>;
  /** epoch ms of the session that completed each award, where the logbook still holds it */
  awardedAt?: Partial<Record<EntrustLevel, number>>;
  /** last passed session for this EPA (any mode) */
  lastPassed?: string;
  expired: boolean;
  /** days until expiry (negative once expired); undefined without a pass */
  daysToExpiry?: number;
  /** what is still missing for the next level, in plain words */
  next: string;
  /** counted exam passes toward the next level */
  examProgress: { have: number; need: number; days: number; needDays: number };
  practicePasses: number;
  exams: { attempts: number; passes: number; criticalFails: number };
  /** the highest ladder rung cleared (passed twice) in practice */
  rungCleared: number;
}

export interface MasterAssessmentState {
  passed: boolean;
  passedOn?: string;
  /** per component EPA: the qualifying exam pass, if any, inside the current window */
  components: Partial<Record<EpaId, { date: string; caseId: string } | null>>;
}

export interface ProgressProfileV2 extends ProgressProfile {
  /** schema version of this profile; 2 = logbook and entrustment */
  schema: 2;
  logbook: LogbookEntry[];
  entrustment: Partial<Record<EpaId, EntrustmentRecord>>;
  /** spaced practice of procedural skills: "skill:<epa>" → SM-2 memory */
  skillMemory: Record<string, QuizMemory>;
  master: MasterAssessmentState;
  /**
   * Exams started and not yet finished. A held-out case counts as attempted from the
   * moment it is loaded; leaving before the end (or closing the app) logs a failed
   * first attempt.
   */
  pendingExams: PendingExam[];
  /** reading exams: library items already shown in an exam set, per drill: item key (run id or "patient:<id>") → yyyy-mm-dd last shown */
  seenExamItems: Record<string, Record<string, string>>;
  /** epoch ms when this profile was migrated from schema 1, if it was */
  migratedAt?: number;
}

export interface PendingExam {
  caseId: string;
  epa: EpaId;
  kind: "diagnostic" | "reading";
  rung: number;
  /** epoch ms when the exam case was loaded */
  startedT: number;
  caseName?: string;
  /** reading exams: the drill and the number of items in the set */
  drill?: string;
  items?: number;
}
