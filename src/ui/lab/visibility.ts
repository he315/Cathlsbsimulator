// ---------------------------------------------------------------------------
// What the cath lab screens may show, per session. In a real lab the operator
// reads the image and the pressure trace; nothing on the screens says
// "engaged", "trace clean" or gives a score. The lab reads one LabPolicy at case
// load:
//
//   exam mode (SimMode "exam")              -> visibilityFor("exam"), mentor safety-only
//   a launch from a progression screen      -> its activePolicy, when its caseId is this case
//   otherwise                               -> labPolicy(entrustment of the case's EPA)
//   tutorials and drills                    -> guided, entrustment 1
//
// The PCI lab (pci-assessment-policy-qca) reads the same rules with
// opts.lab "pci": the EPA is the scenario's own (def.epa), an exam is the
// launch's mode or the progression's active exam policy for this case
// (pciSimMode), and a launch mode overrides the level-derived mode
// (resolveRunPolicy in labRun.ts). There are no PCI tutorials.
//
// On top of the mentor policy the lab screens apply the shell rule from the
// plan (S10 task 1): no state chips, coach line, live scores or traps on any lab
// screen in any mode. Teaching explanations live only in the attending drawer,
// which is offered in guided practice only.
// ---------------------------------------------------------------------------

import type { SimMode } from "../../types";
import type { AssessmentMode, EntrustmentLevel } from "../../mentor/types";
import { visibilityFor, type VisibilityPolicy } from "../../mentor/visibility";
import { labPolicy } from "../../progress/competency";
import { classifyCase } from "../../content/mentor/catalogue";
import type { EntrustmentRecord, EpaId } from "../../progress/types";

export interface LabPolicy {
  mode: AssessmentMode;
  entrustment: EntrustmentLevel;
  visibility: VisibilityPolicy;
  /** where the policy came from */
  source: "exam" | "active" | "level" | "tutorial";
  epa?: EpaId;
}

/** The EPA a diagnostic case outside the catalogue is practised under (a full diagnostic study). */
export const DEFAULT_DIAGNOSTIC_EPA: EpaId = "diag-study";

export interface ProgressLike {
  activePolicy: { epa: EpaId; caseId?: string; mode: AssessmentMode; entrustment: EntrustmentLevel; visibility: VisibilityPolicy } | null;
  profile: { entrustment: Partial<Record<EpaId, EntrustmentRecord>> };
}

const TUTORIAL: SimMode[] = ["tutorial-lm", "tutorial-rca", "root-drill"];

/** Which lab's rules: the diagnostic lab's (the default) or the PCI lab's. */
export type PolicyLab = "diagnostic" | "pci";

export interface ResolveLabPolicyOptions {
  /** default "diagnostic" */
  lab?: PolicyLab;
  /** the EPA the case is practised under (the PCI scenario's def.epa); default the case catalogue's */
  epa?: EpaId;
  /** further ids the progression may know this case by (a PCI run id and its sim key) */
  aliases?: readonly string[];
}

/** Does the progression's active policy name this case (by its id or one of its aliases)? */
function activeFor(progress: ProgressLike | null, ids: readonly string[]): ProgressLike["activePolicy"] {
  const a = progress?.activePolicy ?? null;
  return a && a.caseId !== undefined && ids.includes(a.caseId) ? a : null;
}

/**
 * The PCI lab's SimMode: "exam" when the progression's active policy is an exam of this case (a held-out
 * exam launched from a progression screen), else "free". The launch's own mode is applied on top by
 * resolveRunPolicy (labRun.ts), so a launch with mode=exam is an exam whatever this returns.
 */
export function pciSimMode(caseIds: readonly string[], progress: ProgressLike | null): SimMode {
  return activeFor(progress, caseIds)?.mode === "exam" ? "exam" : "free";
}

export function resolveLabPolicy(simMode: SimMode, caseId: string, progress: ProgressLike | null, opts: ResolveLabPolicyOptions = {}): LabPolicy {
  if (opts.lab === "pci") return resolvePciPolicy(simMode, caseId, progress, opts);
  const active = progress?.activePolicy ?? null;
  if (simMode === "exam") {
    const epa = active?.caseId === caseId ? active.epa : classifyCase(caseId).epa;
    return { mode: "exam", entrustment: active?.caseId === caseId ? active.entrustment : 2, visibility: visibilityFor("exam"), source: "exam", epa };
  }
  if (active && active.caseId === caseId && active.mode !== "exam") {
    return { mode: active.mode, entrustment: active.entrustment, visibility: active.visibility, source: "active", epa: active.epa };
  }
  if (TUTORIAL.includes(simMode)) return { mode: "guided", entrustment: 1, visibility: visibilityFor("guided", 1), source: "tutorial" };
  const epa = classifyCase(caseId).epa ?? DEFAULT_DIAGNOSTIC_EPA;
  const p = labPolicy(progress?.profile.entrustment[epa]);
  return { mode: p.mode, entrustment: p.entrustment, visibility: p.visibility, source: "level", epa };
}

/**
 * The PCI lab's policy: exam from the SimMode or the progression's active exam of this case; else the
 * active policy of this case; else the level in force on the scenario's EPA (no level yet: guided).
 */
function resolvePciPolicy(simMode: SimMode, caseId: string, progress: ProgressLike | null, opts: ResolveLabPolicyOptions): LabPolicy {
  const active = activeFor(progress, [caseId, ...(opts.aliases ?? [])]);
  const epa = opts.epa ?? classifyCase(caseId).epa;
  if (simMode === "exam" || active?.mode === "exam") {
    return { mode: "exam", entrustment: active ? active.entrustment : 2, visibility: visibilityFor("exam"), source: "exam", epa: active?.epa ?? epa };
  }
  if (active) return { mode: active.mode, entrustment: active.entrustment, visibility: active.visibility, source: "active", epa: active.epa };
  const p = labPolicy(epa ? progress?.profile.entrustment[epa] : undefined);
  return { mode: p.mode, entrustment: p.entrustment, visibility: p.visibility, source: "level", epa };
}

/** What the lab shell renders, from a policy. */
export interface LabScreens {
  /** engagement chips, pressure-class chips, coach line, live scores, traps: never on a lab screen */
  stateChips: false;
  coachLine: false;
  liveScores: false;
  traps: false;
  /** the attending drawer (explanations, hints on request): guided practice only */
  attendingDrawer: boolean;
  /** spoken and captioned attending lines (safety stops in every mode; the drawer adds the rest) */
  captions: boolean;
  /** hints on request */
  hints: VisibilityPolicy["hints"];
  /** teaching aids that are not on a real lab screen (the 3D anatomy): guided practice only, never in exams */
  teachingAids: boolean;
  /** the case objectives list (outside exams, when the policy lists recommended views) */
  objectives: boolean;
  /** QCA rule: the trainee's visual estimate first */
  qca: VisibilityPolicy["qca"];
  /** anatomy overlays may be switched on */
  overlaysToggleable: boolean;
  /**
   * Coach read-outs (where the wire tip and the device are relative to the lesion, the procedure log):
   * a teaching aid, offered only with teachingAids, inside the attending drawer, and off until the
   * learner switches them on.
   */
  coachReadouts: boolean;
}

export function labScreens(p: LabPolicy): LabScreens {
  const guided = p.mode === "guided";
  const teachingAids = guided && p.visibility.overlays.toggleable;
  return {
    stateChips: false,
    coachLine: false,
    liveScores: false,
    traps: false,
    attendingDrawer: guided,
    captions: true,
    hints: p.visibility.hints,
    teachingAids,
    objectives: p.mode !== "exam" && p.visibility.recommendedViews,
    qca: p.visibility.qca,
    overlaysToggleable: p.visibility.overlays.toggleable,
    coachReadouts: teachingAids,
  };
}

/** Human label for the session mode (header chip). */
export function modeLabel(p: LabPolicy): string {
  switch (p.mode) {
    case "guided":
      return "Guided practice";
    case "supervised":
      return "Supervised practice";
    case "independent":
      return "Independent practice";
    case "exam":
      return "Exam";
  }
}
