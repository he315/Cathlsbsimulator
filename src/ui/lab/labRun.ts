// ---------------------------------------------------------------------------
// One run of a lab (found-lab-session-plumbing): the session mode and tip
// policy, the learner's help requests, the decision ledger and the single
// logbook row, for every lab. It replaces the dev labs' useLabSession and the
// ad hoc recordSim calls at the end of each lab.
//
//   const run = useLabRun("angio-pci", runCaseId("angio-pci", "lad-focal"), launch?.mode);
//   const { tips, visible } = useContextTips(ctx, run);
//   run.askHelp();                        // supervised / independent: tips from now on
//   run.decide({ id, t, stage, ... });    // each scored decision
//   run.finish({ score, passed, ... });   // once: one logbook row
//
// The policy comes from resolveLabPolicy (src/ui/lab/visibility.ts) for the
// diagnostic labs and from the level in force on the lab's EPA for the others;
// a launch mode (a lesson's or case's 'Practise this in the lab' link) overrides
// the level-derived mode. A run's caseId is "<sim>:<scenario>[~variant]", so the
// logbook and debrief link back to the launch params; its source is the lab's
// old sim key, so simKeyEpas still maps the run onto its EPAs.
// ---------------------------------------------------------------------------

import { useCallback, useMemo, useRef, useState } from "react";
import type { LaunchMode, LaunchSim } from "../../content/schema";
import type { SimMode } from "../../types";
import type { AssessmentMode } from "../../mentor/types";
import { visibilityFor } from "../../mentor/visibility";
import { DecisionLedger, type DecisionRecord } from "../../mentor/ledger";
import { caseFor, classifyCase, simKeyEpas } from "../../content/mentor/catalogue";
import { labelForKey } from "../../progress/logbook";
import { labPolicy } from "../../progress/competency";
import type { EpaId, LogbookEntry, LogLab, LogSessionInput } from "../../progress/types";
import { useProgressStore } from "../../state/useProgressStore";
import { resolveLabPolicy, type LabPolicy, type ProgressLike } from "./visibility";
import { selectTips, tipsVisible, type TipsModule } from "./useLabTips";
import type { LabContext, LabTip } from "../../content/lab/tips";

// --- case ids and sim keys ----------------------------------------------------

/** The run's case id: "<sim>:<scenario>[~variant]", or the sim alone when the lab has no scenario. */
export function runCaseId(sim: LaunchSim, scenario?: string | null, variant?: string | null): string {
  if (!scenario) return sim;
  return `${sim}:${scenario}${variant ? `~${variant}` : ""}`;
}

/** The parts of a run case id (null when it is not one). */
export function parseRunCaseId(id: string): { sim: string; scenario?: string; variant?: string } | null {
  const m = /^([a-z][a-z-]*)(?::([^~]+)(?:~(.+))?)?$/.exec(id);
  if (!m) return null;
  return { sim: m[1], ...(m[2] ? { scenario: m[2] } : {}), ...(m[3] ? { variant: m[3] } : {}) };
}

/** The logbook lab of each launch destination (the same grouping as simKeyLab). */
export const LAB_OF_SIM: Record<LaunchSim, LogLab> = {
  cathlab: "diagnostic",
  procedure: "procedure",
  views: "angio-reading",
  haemo: "haemo",
  "pci-bench": "pci-bench",
  physiology: "physiology",
  iabp: "mcs",
  impella: "mcs",
  ecmo: "mcs",
  tavi: "structural",
  teer: "structural",
  laao: "structural",
  pacing: "bedside",
  pericardiocentesis: "bedside",
  "angio-real": "angio-reading",
  "angio-pci": "pci",
  // the timed pressure-trace drill trains a diagnostic-lab skill (diag-pressure-recognition-drill)
  pressure: "diagnostic",
};

/** Labs whose policy is the diagnostic one (resolveLabPolicy with the case catalogue). */
const DIAGNOSTIC_SIMS: readonly LaunchSim[] = ["cathlab", "procedure"];

/**
 * The recording key the lab used before useLabRun (LogbookEntry.source), so simKeyEpas still maps
 * the run onto its EPAs: "pci-<scenario>[~variant]" for the PCI lab, the full case's "full-case",
 * otherwise the sim id (haemo, physiology, pci-bench, iabp, tavi, pacing and the others).
 */
export function sourceForSim(sim: LaunchSim, scenario?: string | null, variant?: string | null): string {
  if (sim === "angio-pci") return scenario ? `pci-${scenario}${variant ? `~${variant}` : ""}` : "pci";
  if (sim === "procedure") return "full-case";
  return sim;
}

/**
 * The id the case catalogue knows a run by (classifyCase, caseFor, an active policy's caseId): the
 * PCI variant key ("pci-<base>[~variant]", the run's source) for the PCI lab, otherwise the part of
 * a run id after "<sim>:" (a diagnostic case id, or a scenario). An id that is not a run id of this
 * sim (a raw case id) is returned as it is.
 */
export function catalogueId(sim: LaunchSim, caseId: string, source?: string): string {
  const p = parseRunCaseId(caseId);
  if (!p || p.sim !== sim || !p.scenario) return caseId;
  if (sim === "angio-pci") return source && source.startsWith("pci-") ? source : sourceForSim(sim, p.scenario, p.variant);
  return caseId.slice(sim.length + 1);
}

/** The source a run id implies when the lab gives none (sourceForSim with the id's scenario and variant). */
function defaultSource(sim: LaunchSim, caseId: string): string {
  const p = parseRunCaseId(caseId);
  return p && p.sim === sim ? sourceForSim(sim, p.scenario, p.variant) : sourceForSim(sim);
}

// --- policy -------------------------------------------------------------------

/** The run's policy: the lab policy, and the launch mode when one overrode the level. */
export interface RunPolicy extends LabPolicy {
  /** the launch asked for this mode (it overrides the level-derived one) */
  launchMode?: LaunchMode;
}

export interface RunPolicyInput {
  sim: LaunchSim;
  caseId: string;
  /** the old sim key (default sourceForSim) */
  source?: string;
  launchMode?: LaunchMode | null;
  /** the diagnostic lab's SimMode (exam, tutorials); other labs leave it out */
  simMode?: SimMode;
  /** the EPA the run is evidence for, when the lab knows it */
  epa?: EpaId;
  progress: ProgressLike | null;
}

/**
 * The EPA a run belongs to: the lab's own, the case catalogue's (pass the catalogue id, see
 * catalogueId; a run id is resolved here too), else the first one its sim key maps to.
 */
export function runEpa(caseId: string, source: string, epa?: EpaId, sim?: LaunchSim): EpaId | undefined {
  const cid = sim ? catalogueId(sim, caseId, source) : caseId;
  return epa ?? classifyCase(cid).epa ?? simKeyEpas(source)[0]?.epa;
}

export function resolveRunPolicy(i: RunPolicyInput): RunPolicy {
  const source = i.source ?? defaultSource(i.sim, i.caseId);
  const cid = catalogueId(i.sim, i.caseId, source);
  const active = i.progress?.activePolicy ?? null;
  let base: LabPolicy;
  if (DIAGNOSTIC_SIMS.includes(i.sim) && !i.epa) {
    // resolveLabPolicy matches the active policy and the catalogue by the catalogue's case id
    const progress = i.progress && active && active.caseId === i.caseId && cid !== i.caseId ? { ...i.progress, activePolicy: { ...active, caseId: cid } } : i.progress;
    base = resolveLabPolicy(i.simMode ?? "free", cid, progress);
  } else {
    const epa = runEpa(cid, source, i.epa);
    const activeHere = !!active && (active.caseId === i.caseId || active.caseId === cid || active.caseId === source);
    if (i.simMode === "exam") {
      base = { mode: "exam", entrustment: activeHere ? active!.entrustment : 2, visibility: visibilityFor("exam"), source: "exam", epa: activeHere ? active!.epa : epa };
    } else if (activeHere && active!.mode !== "exam") {
      base = { mode: active!.mode, entrustment: active!.entrustment, visibility: active!.visibility, source: "active", epa: active!.epa };
    } else {
      const p = labPolicy(epa ? i.progress?.profile.entrustment[epa] : undefined);
      base = { mode: p.mode, entrustment: p.entrustment, visibility: p.visibility, source: "level", epa };
    }
  }
  const lm = i.launchMode ?? undefined;
  if (!lm || lm === base.mode) return lm ? { ...base, launchMode: lm } : base;
  return {
    ...base,
    mode: lm,
    visibility: lm === "exam" ? visibilityFor("exam") : visibilityFor(lm, base.entrustment),
    source: lm === "exam" ? "exam" : base.source,
    launchMode: lm,
  };
}

// --- the run --------------------------------------------------------------------

/** What a lab reports when the run ends; the rest of the logbook row comes from the run. */
export interface RunResult {
  score?: number;
  passed: boolean;
  criticalErrors?: number;
  complications?: string[];
  /** lab-specific measures (name → number) */
  metrics?: Record<string, number>;
  // optional session totals the logbook already knows how to store
  devices?: string[];
  runs?: number;
  fluoroS?: number;
  karMGy?: number;
  kapGyCm2?: number;
  contrastMl?: number;
  durationS?: number;
  access?: LogSessionInput["access"];
  indication?: string;
  notes?: string;
  epas?: EpaId[];
  rungs?: LogSessionInput["rungs"];
}

export interface LabRunOptions {
  sim: LaunchSim;
  caseId: string;
  launchMode?: LaunchMode | null;
  /** the old sim key (default sourceForSim(sim, scenario of the case id, variant of the case id)) */
  source?: string;
  /** logbook lab (default LAB_OF_SIM[sim]) */
  lab?: LogLab;
  /** scenario id (default: from the case id) */
  scenarioId?: string;
  caseName?: string;
  simMode?: SimMode;
  epa?: EpaId;
  /** the progress state the policy is read from (default: none, the level-0 policy) */
  progress?: ProgressLike | null;
  /** writes the logbook row (default useProgressStore.logSession) */
  log?: (s: LogSessionInput) => LogbookEntry;
  /** lab time, s, for help requests and decisions without a time (default 0) */
  clock?: () => number;
}

/** Header label for a session mode (the same wording as modeLabel in visibility.ts); LabModeBar shows it. */
export const MODE_LABEL: Record<AssessmentMode, string> = {
  guided: "Guided practice",
  supervised: "Supervised practice",
  independent: "Independent practice",
  exam: "Exam",
};

/** Names of the labs whose sim key has no logbook label (labelForKey covers the others). */
const LAB_NAME: Partial<Record<LaunchSim, string>> = {
  cathlab: "Diagnostic lab",
  procedure: "Full case",
  views: "Angiographic views",
  "angio-real": "Real angiograms",
};

/** Abbreviations written in capitals (or their usual case) in a scenario id read as a name. */
const ID_WORDS: Record<string, string> = { lad: "LAD", lcx: "LCx", rca: "RCA", lm: "LM", om: "OM", pda: "PDA", cto: "CTO", stemi: "STEMI", nstemi: "NSTEMI" };

/** A PCI sim key read as a name: "pci-lad-focal~L2" is "PCI: LAD focal variant L2". */
function pciKeyName(source: string): string {
  const [scenario, variant] = source.slice(4).split("~");
  const words = scenario.split("-").filter(Boolean).map((w) => ID_WORDS[w.toLowerCase()] ?? w);
  if (!words.length) return labelForKey(source);
  return `PCI: ${words.join(" ")}${variant ? ` variant ${variant}` : ""}`;
}

/**
 * The logbook name of a run the lab did not name: the diagnostic case's own name; the PCI scenario
 * read from its sim key ("PCI: LAD focal"); otherwise the lab's label with the scenario
 * ("Haemodynamics lab: aortic stenosis"). Never the run id itself, which labelForKey would misread
 * ("angio-pci:..." as a drill set). The PCI scenario titles live in the simulation module, which the
 * shared lab code does not import (it stays out of every other lab's chunk), so a lab that has a
 * readable title for its case passes it as caseName.
 */
function defaultCaseName(sim: LaunchSim, cid: string, source: string, scenario?: string): string {
  if (DIAGNOSTIC_SIMS.includes(sim)) {
    const c = caseFor(cid);
    if (c?.name) return c.name;
  }
  if (source.startsWith("pci-")) return pciKeyName(source);
  const lab = LAB_NAME[sim] ?? labelForKey(source);
  return scenario ? `${lab}: ${scenario.replace(/-/g, " ")}` : lab;
}

/** A lab run without React: the hook wraps one of these. */
export class LabRun {
  readonly sim: LaunchSim;
  readonly caseId: string;
  readonly source: string;
  readonly lab: LogLab;
  readonly scenarioId?: string;
  readonly policy: RunPolicy;
  /** the id the case catalogue knows the run by (catalogueId), passed to the logbook as classifyId */
  readonly catalogueId: string;
  readonly caseName: string;
  private readonly log: (s: LogSessionInput) => LogbookEntry;
  private readonly clock: () => number;
  private readonly ledger = new DecisionLedger();
  private _helpAskedAt: number | null = null;
  private _hints = 0;
  private row: LogbookEntry | null = null;

  constructor(o: LabRunOptions) {
    const parsed = parseRunCaseId(o.caseId);
    const scenario = o.scenarioId ?? (parsed && parsed.sim === o.sim ? parsed.scenario : undefined);
    const variant = parsed && parsed.sim === o.sim ? parsed.variant : undefined;
    this.sim = o.sim;
    this.caseId = o.caseId;
    this.scenarioId = scenario;
    this.source = o.source ?? sourceForSim(o.sim, scenario, variant);
    this.lab = o.lab ?? LAB_OF_SIM[o.sim];
    this.catalogueId = catalogueId(o.sim, o.caseId, this.source);
    this.caseName = o.caseName ?? defaultCaseName(o.sim, this.catalogueId, this.source, scenario);
    this.policy = resolveRunPolicy({ sim: o.sim, caseId: o.caseId, source: this.source, launchMode: o.launchMode, simMode: o.simMode, epa: o.epa, progress: o.progress ?? null });
    this.log = o.log ?? ((s) => useProgressStore.getState().logSession(s));
    this.clock = o.clock ?? (() => 0);
  }

  get mode(): AssessmentMode {
    return this.policy.mode;
  }
  get helpAskedAt(): number | null {
    return this._helpAskedAt;
  }
  /** help requests counted against entrustment (costed hints only) */
  get hints(): number {
    return this._hints;
  }
  get finished(): boolean {
    return this.row !== null;
  }

  /**
   * The learner asks for help. In exams there is none (returns null). Supervised and independent
   * practice show tips from the first request on and count every request as a hint; guided
   * practice shows tips anyway and counts nothing. Returns the time of the first request.
   */
  askHelp(t: number = this.clock()): number | null {
    if (this.policy.mode === "exam" || this.policy.visibility.hints === "off") return null;
    if (this._helpAskedAt === null) this._helpAskedAt = t;
    if (this.policy.visibility.hints === "costed") this._hints++;
    return this._helpAskedAt;
  }

  /** Record a scored decision (a decision with the same id replaces the earlier one). */
  decide(rec: Omit<DecisionRecord, "t"> & { t?: number }): DecisionRecord {
    return this.ledger.add({ ...rec, t: rec.t ?? this.clock() });
  }

  decisions(): DecisionRecord[] {
    return this.ledger.all();
  }

  /** May the learner see tips now? */
  tipsVisible(): boolean {
    return tipsVisible(this);
  }

  /** The tips for a context (or several) under the run's policy. */
  tips(mod: TipsModule | null, ctx: LabContext | readonly LabContext[] | null, limit?: number): LabTip[] {
    return selectTips(mod, ctx, this, limit);
  }

  /** End the run: one logbook row, written the first time only (later calls return the same row). */
  finish(r: RunResult): LogbookEntry {
    if (this.row) return this.row;
    const input: LogSessionInput = {
      lab: this.lab,
      source: this.source,
      caseId: this.caseId,
      ...(this.catalogueId !== this.caseId ? { classifyId: this.catalogueId } : {}),
      caseName: this.caseName,
      ...(this.scenarioId ? { scenarioId: this.scenarioId } : {}),
      mode: this.policy.mode,
      passed: r.passed,
      score: r.score,
      criticalErrors: r.criticalErrors ?? 0,
      complications: r.complications ?? [],
      decisions: this.ledger.all(),
      ...(r.metrics ? { metrics: r.metrics } : {}),
      hints: this._hints,
      ...(r.devices ? { devices: r.devices } : {}),
      ...(r.runs !== undefined ? { runs: r.runs } : {}),
      ...(r.fluoroS !== undefined ? { fluoroS: r.fluoroS } : {}),
      ...(r.karMGy !== undefined ? { karMGy: r.karMGy } : {}),
      ...(r.kapGyCm2 !== undefined ? { kapGyCm2: r.kapGyCm2 } : {}),
      ...(r.contrastMl !== undefined ? { contrastMl: r.contrastMl } : {}),
      ...(r.durationS !== undefined ? { durationS: r.durationS } : {}),
      ...(r.access ? { access: r.access } : {}),
      ...(r.indication ? { indication: r.indication } : {}),
      ...(r.notes ? { notes: r.notes } : {}),
      ...(r.epas ? { epas: r.epas } : {}),
      ...(r.rungs ? { rungs: r.rungs } : {}),
    };
    this.row = this.log(input);
    return this.row;
  }
}

// --- the hook -------------------------------------------------------------------

export interface UseLabRun {
  mode: AssessmentMode;
  policy: RunPolicy;
  helpAskedAt: number | null;
  hints: number;
  decisions: DecisionRecord[];
  finished: boolean;
  askHelp: (t?: number) => void;
  decide: (rec: Omit<DecisionRecord, "t"> & { t?: number }) => void;
  finish: (r: RunResult) => LogbookEntry;
  /** the underlying run (for dev hooks and the debrief) */
  run: LabRun;
}

/**
 * A lab run for a component. A new run starts when the sim, case or launch mode changes (a new
 * scenario or a relaunch); pass opts.runKey to start one for another reason (a restart).
 */
export function useLabRun(sim: LaunchSim, caseId: string, launchMode?: LaunchMode | null, opts: Omit<LabRunOptions, "sim" | "caseId" | "launchMode"> & { runKey?: string | number } = {}): UseLabRun {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const run = useMemo(() => {
    const st = useProgressStore.getState();
    return new LabRun({ progress: { activePolicy: st.activePolicy, profile: st.profile }, ...optsRef.current, sim, caseId, launchMode });
    // a run is fixed for its sim, case, launch mode and run key
  }, [sim, caseId, launchMode, opts.runKey]);
  const askHelp = useCallback(
    (t?: number) => {
      run.askHelp(t);
      bump();
    },
    [run, bump]
  );
  const decide = useCallback(
    (rec: Omit<DecisionRecord, "t"> & { t?: number }) => {
      run.decide(rec);
      bump();
    },
    [run, bump]
  );
  const finish = useCallback(
    (r: RunResult) => {
      const row = run.finish(r);
      bump();
      return row;
    },
    [run, bump]
  );
  return { mode: run.mode, policy: run.policy, helpAskedAt: run.helpAskedAt, hints: run.hints, decisions: run.decisions(), finished: run.finished, askHelp, decide, finish, run };
}
