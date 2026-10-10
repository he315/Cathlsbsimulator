// ---------------------------------------------------------------------------
// What the screen may show the learner in each assessment mode. In a real lab
// the operator reads the image and the pressure trace; there is no label that
// says "engaged". The labs read this policy instead of showing answers in
// every mode (mentoring audit, "Assessment integrity").
// ---------------------------------------------------------------------------

import type { AssessmentMode, EntrustmentLevel } from "./types";

export interface VisibilityPolicy {
  /** engagement-state chips ("Engaged", "Near LM") */
  stateChips: boolean;
  /** the live coach line under the image */
  coachLine: boolean;
  /** anatomy overlays (labels, ostia, valve plane, transparent vessels) */
  overlays: { labels: boolean; ostia: boolean; valvePlane: boolean; transparent: boolean; toggleable: boolean };
  /** the case traps list before the case */
  traps: boolean;
  /** QCA: shown automatically, only after the learner's own estimate, or not at all */
  qca: "auto" | "after-estimate" | "off";
  /** recommended views listed in bold */
  recommendedViews: boolean;
  /** wire position read-outs in mm and "across the lesion" text */
  wireReadout: boolean;
  /** hints: free, costed (counted against entrustment), or off */
  hints: "free" | "costed" | "off";
  /** attending behaviour */
  mentor: "full" | "faded" | "safety-only";
  /** time-out must be completed before the beam is enabled */
  timeOutRequired: boolean;
  /** scores and metrics are never shown during a case in any mode */
  liveScores: false;
}

export function visibilityFor(mode: AssessmentMode, entrustment: EntrustmentLevel = 2): VisibilityPolicy {
  const base = { liveScores: false as const };
  switch (mode) {
    case "guided":
      return {
        ...base,
        stateChips: entrustment <= 1,
        coachLine: false,
        overlays: { labels: true, ostia: true, valvePlane: true, transparent: entrustment <= 1, toggleable: true },
        traps: true,
        qca: "after-estimate",
        recommendedViews: true,
        wireReadout: entrustment <= 1,
        hints: "free",
        mentor: "full",
        timeOutRequired: false,
      };
    case "supervised":
      return {
        ...base,
        stateChips: false,
        coachLine: false,
        overlays: { labels: false, ostia: false, valvePlane: false, transparent: false, toggleable: true },
        traps: false,
        qca: "after-estimate",
        recommendedViews: false,
        wireReadout: false,
        hints: "costed",
        mentor: "faded",
        timeOutRequired: true,
      };
    case "independent":
      return {
        ...base,
        stateChips: false,
        coachLine: false,
        overlays: { labels: false, ostia: false, valvePlane: false, transparent: false, toggleable: true },
        traps: false,
        qca: "after-estimate",
        recommendedViews: false,
        wireReadout: false,
        hints: "costed",
        mentor: "safety-only",
        timeOutRequired: false,
      };
    case "exam":
      return {
        ...base,
        stateChips: false,
        coachLine: false,
        overlays: { labels: false, ostia: false, valvePlane: false, transparent: false, toggleable: false },
        traps: false,
        qca: "after-estimate",
        recommendedViews: false,
        wireReadout: false,
        hints: "off",
        mentor: "safety-only",
        timeOutRequired: true,
      };
  }
}

/** The beam may be enabled only after the time-out in modes that require one. */
export function beamAllowed(mode: AssessmentMode, timeOutDone: boolean): boolean {
  return !visibilityFor(mode).timeOutRequired || timeOutDone;
}
