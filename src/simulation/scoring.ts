// ---------------------------------------------------------------------------
// Diagnostic case scoring. Internal analytics only: the composite is shown in
// the debrief and kept in the logbook, but progression (entrustment) uses the
// pass flag, critical errors and the held-out exam rules in src/progress/.
// Hints are not penalised (asking for help is not an efficiency fault); the
// hint count is logged instead. Weights are model parameters.
// ---------------------------------------------------------------------------
import type { ScoreState } from "../types";
import { clamp } from "../utils/math";

export function initScore(): ScoreState {
  return {
    fluoroTime: 0,
    contrastVolume: 0,
    injections: 0,
    selectiveInjections: 0,
    nonSelectiveInjections: 0,
    dangerousInjections: 0,
    diagnosticInjections: 0,
    lvEntries: 0,
    dampedEvents: 0,
    dissections: 0,
    airEmbolisms: 0,
    arrhythmias: 0,
    successfulEngagements: 0,
    hintsUsed: 0,
    catheterChanges: 0,
    safetyScore: 100,
    efficiencyScore: 100,
    anatomyScore: 0,
    finalScore: 0,
  };
}

export interface ScoreTargets {
  contrastBudget: number; // mL considered efficient for the case
  fluoroBudget: number; // seconds
  requiredDiagnostic: number; // diagnostic runs needed
}

export function defaultTargets(): ScoreTargets {
  return { contrastBudget: 40, fluoroBudget: 120, requiredDiagnostic: 2 };
}

export function computeScores(
  s: ScoreState,
  targets: ScoreTargets = defaultTargets()
): ScoreState {
  // --- Safety ---
  let safety = 100;
  safety -= s.lvEntries * 12;
  safety -= s.dampedEvents * 6;
  safety -= s.dangerousInjections * 22;
  safety -= s.nonSelectiveInjections * 4;
  safety -= s.dissections * 45; // a coronary/aortic dissection is catastrophic
  safety -= s.airEmbolisms * 30; // air embolism is a serious avoidable error
  safety -= s.arrhythmias * 40; // VF is a life-threatening event
  safety = clamp(safety, 0, 100);

  // --- Efficiency ---
  const contrastOver = Math.max(0, s.contrastVolume - targets.contrastBudget);
  const fluoroOver = Math.max(0, s.fluoroTime - targets.fluoroBudget);
  const wastedInjections =
    s.injections - s.diagnosticInjections - s.selectiveInjections;
  let efficiency = 100;
  efficiency -= contrastOver * 0.8;
  efficiency -= fluoroOver * 0.4;
  efficiency -= Math.max(0, wastedInjections) * 4;
  efficiency = clamp(efficiency, 0, 100);

  // --- Anatomy / opacification ---
  const diagRatio =
    s.injections > 0 ? s.diagnosticInjections / s.injections : 0;
  let anatomy =
    Math.min(1, s.diagnosticInjections / targets.requiredDiagnostic) * 60 +
    diagRatio * 40;
  anatomy = clamp(anatomy, 0, 100);

  // --- Final with safety gate ---
  let final = safety * 0.4 + efficiency * 0.28 + anatomy * 0.32;
  if (s.dangerousInjections > 0) final = Math.min(final, 55);
  if (s.lvEntries > 1) final = Math.min(final, 60);
  if (s.dissections > 0) final = Math.min(final, 35); // a dissection fails the case
  if (s.airEmbolisms > 0) final = Math.min(final, 40);
  if (s.arrhythmias > 0) final = Math.min(final, 35); // VF fails the case
  final = clamp(Math.round(final), 0, 100);

  return {
    ...s,
    safetyScore: Math.round(safety),
    efficiencyScore: Math.round(efficiency),
    anatomyScore: Math.round(anatomy),
    finalScore: final,
  };
}

export function casePassed(s: ScoreState, targets = defaultTargets()): boolean {
  return (
    s.dangerousInjections === 0 &&
    s.dissections === 0 &&
    s.airEmbolisms === 0 &&
    s.arrhythmias === 0 &&
    s.diagnosticInjections >= targets.requiredDiagnostic &&
    s.finalScore >= 65
  );
}
