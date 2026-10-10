// ---------------------------------------------------------------------------
// The bedside lab's tip context (pericardiocentesis-tips-and-pci-handover).
//
// pericardioTipContext(stage, flags, vitals) reports what the
// pericardiocentesis tab is doing now, in the shared tip vocabulary
// (src/content/lab/tips.ts, lab "bedside"):
//   procedures ['pericardiocentesis'], so that no pacing tip appears here and
//              no pericardiocentesis tip in the pacing tab
//   phase      the lab's stage: assess, decide, plan (window and trajectory),
//              needle (needle and confirmation), drain; the debrief reports
//              no context
//   events     perforation (from the hand-over from the PCI lab, or the
//              perforation presets), prior-cabg (the post-CABG preset), and
//              the patient events of the shared adapter
//              (src/ui/lab/patientEvents.ts): hypotension from the displayed
//              MAP with its hold, tamponade from the pericardial volume with a
//              low MAP, and pericardial-effusion once the echo shows one
// The pericardiocentesis tab never reports a deprecated stage alias
// (DEPRECATED_LAB_PHASES); the pacing tab reports "pacing" as a transitional
// alias until tip-retarget-catchup, as described below.
//
// pacingTipContext(stage, flags, vitals) reports the pacing tab
// (pacing-in-lab-scenarios-and-tips):
//   procedures ['pacing'], plus 'tcp' while external pacing is on
//   phase      the stage: assess (assess and bridge), access, position, test
//              (threshold and sensing), troubleshoot (the scripted events
//              after hand-over); the debrief reports no context
//   phases     ['pacing'] as well, the deprecated alias the bed-pace-* tips
//              still trigger on, until tip-retarget-catchup applies their
//              recorded retargets (raisable/waiting.ts DEFERRED_RETARGETS)
//              and removes the alias; refinePacingTips meanwhile applies those
//              recorded triggers at display time, so each tip shows at its
//              own stage
//   events     bradycardia, hypotension and av-block, from the shared adapter
//              (src/ui/lab/patientEvents.ts) reading the pacing monitor
//
// `raises` (below) is what this lab can report, both tabs; the reachability
// report (src/content/lab/reachability.test.ts) reads it. PERIC_RAISES and
// PACING_RAISES are each tab's own part.
//
// Types only from the tip registry, so the lab bundle does not pull the
// curriculum in with it.
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent, LabPhase, LabProcedure, LabTip } from "../../content/lab/tips";
import { DEFERRED_RETARGETS, type DeferredRetarget, type LabRaises } from "../../content/lab/raisable/waiting";
import { INITIAL_PATIENT_EVENT_STATE, patientEvents, type PatientEventState, type PatientVitals } from "./patientEvents";

/** The tabs of the bedside lab and the procedure each reports. */
export type BedsideTab = "pacing" | "pericardiocentesis";
export const BEDSIDE_TAB_PROCEDURES: Record<BedsideTab, readonly LabProcedure[]> = {
  pacing: ["pacing"],
  pericardiocentesis: ["pericardiocentesis"],
};

/** The stages of the pericardiocentesis lab (src/ui/bedside/PericardioLab.tsx). */
export type PericStage = "assess" | "decide" | "plan" | "needle" | "drain" | "debrief";
export const PERIC_STAGES: readonly PericStage[] = ["assess", "decide", "plan", "needle", "drain", "debrief"];

/** The phase each stage reports (null: no tips at that stage). */
export const PERIC_PHASE: Record<PericStage, LabPhase | null> = {
  assess: "assess",
  decide: "decide",
  plan: "plan",
  needle: "needle",
  drain: "drain",
  debrief: null,
};

/** The case events a run carries (from the hand-over or the preset). */
export const PERIC_CASE_EVENTS = ["perforation", "prior-cabg"] as const satisfies readonly LabEvent[];
/** The patient events this lab reads from the shared adapter. */
export const PERIC_PATIENT_EVENTS = ["hypotension", "tamponade", "pericardial-effusion"] as const satisfies readonly LabEvent[];

const KNOWN: readonly LabEvent[] = [...PERIC_CASE_EVENTS, ...PERIC_PATIENT_EVENTS];

export interface PericTipFlags {
  /** events active for the run or now: the hand-over's, the preset's and the adapter's */
  events?: readonly LabEvent[];
  /** the echo is in the room and being looked at (an effusion is then visible) */
  echo?: boolean;
}

/** The vitals the shared adapter reads, from the lab's picture of the patient at lab time t (s). */
export function pericardioVitals(t: number, h: { hr: number; sbp: number; dbp: number; map: number }, pericardialMl: number): PatientVitals {
  return { t, hr: h.hr, rhythmKind: "sinus", art: { sys: h.sbp, dia: h.dbp, mean: h.map }, pericardialMl };
}

/**
 * The pericardiocentesis tab's tip context now. Events are the flags' (the run's case events and
 * the adapter's patient events, which carry the hypotension hold) and, when vitals are given, the
 * patient events read from them with `prev` as the adapter state (the tamponade rule needs no
 * hold). Only the names this lab declares in `raises` are reported.
 */
export function pericardioTipContext(stage: PericStage, flags: PericTipFlags = {}, vitals?: PatientVitals, prev: PatientEventState = INITIAL_PATIENT_EVENT_STATE): LabContext | null {
  const phase = PERIC_PHASE[stage];
  if (!phase) return null;
  const events: LabEvent[] = [];
  const add = (e: LabEvent) => {
    if (KNOWN.includes(e) && !events.includes(e)) events.push(e);
  };
  for (const e of flags.events ?? []) add(e);
  if (vitals) for (const e of patientEvents(vitals, prev, { echo: !!flags.echo }).events) add(e);
  return { lab: "bedside", phase, procedures: [...BEDSIDE_TAB_PROCEDURES.pericardiocentesis], events };
}

// ---------------------------------------------------------------------------
// The pacing tab (pacing-in-lab-scenarios-and-tips)
// ---------------------------------------------------------------------------

/** The stages of the pacing lab (src/ui/bedside/PacingLab.tsx). */
export type PacingStage = "assess" | "access" | "position" | "test" | "events" | "debrief";
export const PACING_STAGES: readonly PacingStage[] = ["assess", "access", "position", "test", "events", "debrief"];

/** The phase each stage reports (null: no tips at that stage). */
export const PACING_PHASE: Record<PacingStage, LabPhase | null> = {
  assess: "assess",
  access: "access",
  position: "position",
  test: "test",
  events: "troubleshoot",
  debrief: null,
};

/**
 * The deprecated alias the bed-pace-* tips trigger on today (LAB_PHASES.bedside "pacing"), reported
 * beside the stage until tip-retarget-catchup moves those tips onto the stage phases. Typed without a
 * cast on purpose: once the alias leaves the vocabulary this line stops compiling, and that package
 * then deletes PACING_ALIAS_PHASES and refinePacingTips here.
 */
export const PACING_ALIAS_PHASES: readonly LabPhase[] = ["pacing"];

/** The patient events the pacing tab reads from the shared adapter. */
export const PACING_PATIENT_EVENTS = ["bradycardia", "hypotension", "av-block"] as const satisfies readonly LabEvent[];

export interface PacingTipFlags {
  /** events active now: the adapter's (they carry the hypotension hold) and any the run adds */
  events?: readonly LabEvent[];
  /** external (transcutaneous) pacing is on */
  tcp?: boolean;
}

/** What the pacing monitor shows, as the shared adapter reads it. */
export interface PacingMonitorView {
  hr: number;
  sys: number;
  dia: number;
  map: number;
  /** % of ventricular beats paced in the window */
  pacedPct: number;
  /** atrial activity on the strip (P waves) */
  atrial: boolean;
  /** dissociated P waves and QRS complexes on the strip: complete AV block */
  avBlock: boolean;
}

/** The vitals the shared adapter reads, from the pacing monitor at lab time t (s). */
export function pacingVitals(t: number, m: PacingMonitorView): PatientVitals {
  // ventricular standstill with P waves on the strip is read as the slowest bradycardia, not as asystole
  const rhythmKind = m.pacedPct >= 50 ? "paced" : m.hr > 0 || m.atrial ? "sinus" : "asystole";
  return { t, hr: m.hr, rhythmKind, av: m.avBlock ? 3 : 0, art: { sys: m.sys, dia: m.dia, mean: m.map } };
}

/**
 * The pacing tab's tip context now: the stage's phase with the transitional alias, procedures
 * ['pacing'] (and 'tcp' while external pacing is on), and the events of the flags and, when vitals
 * are given, of the shared adapter with `prev` as its state. Only PACING_PATIENT_EVENTS are reported.
 */
export function pacingTipContext(stage: PacingStage, flags: PacingTipFlags = {}, vitals?: PatientVitals, prev: PatientEventState = INITIAL_PATIENT_EVENT_STATE): LabContext | null {
  const phase = PACING_PHASE[stage];
  if (!phase) return null;
  const events: LabEvent[] = [];
  const add = (e: LabEvent) => {
    if ((PACING_PATIENT_EVENTS as readonly LabEvent[]).includes(e) && !events.includes(e)) events.push(e);
  };
  for (const e of flags.events ?? []) add(e);
  if (vitals) for (const e of patientEvents(vitals, prev).events) add(e);
  const procedures: LabProcedure[] = [...BEDSIDE_TAB_PROCEDURES.pacing];
  if (flags.tcp) procedures.push("tcp");
  return { lab: "bedside", phase, phases: [...PACING_ALIAS_PHASES], procedures, events };
}

/** tipScore's shape (src/content/lab/tips.ts), passed in so this file stays free of the tip registry. */
export type TipScoreFn = (tip: LabTip, ctx: LabContext) => number | null;

/**
 * The bed-pace-* tips shown at the stage they belong to while their recorded retargets wait
 * (DEFERRED_RETARGETS): a tip with a recorded trigger is kept only if that trigger matches the
 * context without the alias phase. Tips without one, and every tip once tip-retarget-catchup has
 * applied the edits and removed the entries, pass through unchanged, in the order given.
 */
export function refinePacingTips(tips: readonly LabTip[], ctx: LabContext, score: TipScoreFn, retargets: readonly DeferredRetarget[] = DEFERRED_RETARGETS): LabTip[] {
  const pending = new Map(retargets.map((d) => [d.tipId, d]));
  const bare: LabContext = { ...ctx, phases: (ctx.phases ?? []).filter((p) => !PACING_ALIAS_PHASES.includes(p)) };
  return tips.filter((t) => {
    const d = pending.get(t.id);
    return !d || score({ ...t, when: d.when }, bare) !== null;
  });
}

/** The tip module functions the pacing tab needs (src/content/lab/tips.ts), passed in. */
export interface PacingTipsModule {
  tipsFor: (ctx: LabContext, limit?: number) => LabTip[];
  tipScore: TipScoreFn;
}

/** How many tips the pacing tab shows at once (DEFAULT_TIP_LIMIT of src/ui/lab/useLabTips.ts). */
export const PACING_TIP_LIMIT = 5;

/**
 * The tips the pacing tab shows: none while the policy hides them (exams; supervised and
 * independent practice before the learner asks), else the context's tips at their own stage
 * (refinePacingTips), best first, up to `limit`.
 */
export function pacingTips(mod: PacingTipsModule | null, ctx: LabContext | null, visible: boolean, limit = PACING_TIP_LIMIT): LabTip[] {
  if (!mod || !ctx || !visible) return [];
  return refinePacingTips(mod.tipsFor(ctx, 200), ctx, mod.tipScore).slice(0, limit);
}

// ---------------------------------------------------------------------------
// What the bedside lab can report
// ---------------------------------------------------------------------------

/** The pericardiocentesis tab's declaration. */
export const PERIC_RAISES: LabRaises = {
  lab: "bedside",
  phases: ["assess", "decide", "plan", "needle", "drain"],
  events: [...PERIC_CASE_EVENTS, ...PERIC_PATIENT_EVENTS],
  procedures: ["pericardiocentesis"],
};

/** The pacing tab's declaration (the alias phase included: the context reports it). */
export const PACING_RAISES: LabRaises = {
  lab: "bedside",
  phases: [...PACING_STAGES.map((s) => PACING_PHASE[s]).filter((p): p is LabPhase => p !== null), ...PACING_ALIAS_PHASES],
  events: [...PACING_PATIENT_EVENTS],
  procedures: ["pacing", "tcp"],
};

const union = <T,>(a: readonly T[], b: readonly T[]): T[] => [...a, ...b.filter((x) => !a.includes(x))];

/** What the bedside lab can report, both tabs (the reachability report reads this). */
export const raises: LabRaises = {
  lab: "bedside",
  phases: union(PERIC_RAISES.phases, PACING_RAISES.phases),
  events: union(PERIC_RAISES.events, PACING_RAISES.events),
  procedures: union(PERIC_RAISES.procedures ?? [], PACING_RAISES.procedures ?? []),
};
