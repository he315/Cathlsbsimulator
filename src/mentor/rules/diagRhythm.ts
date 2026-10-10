// ---------------------------------------------------------------------------
// Rule group: rhythm orders in the diagnostic lab (diag-rhythm-haemodynamic-
// events). Like the drug rules (diagDrugs.ts), these only stop actions: their
// `when` never holds, and the lab session's rhythm orders (the 'rhythm'
// capability in src/ui/sim/labSession.ts, the Rhythm tab) ask them before the
// team is asked to give an antiarrhythmic or a rate drug ('give'). The orders
// pass what is about to be given, with the chart's facts, as
// RhythmMentorCtx.rhythmAction. They are exported as RHYTHM_RULES; `rules`
// (what RULES collects) is empty for the reason diagDrugs.ts gives.
//
//   chart-long-qt-amiodarone       amiodarone with a long QT on the chart's ECG
//                                  or the monitor (safety)
//   pre-excited-af-nodal           amiodarone, verapamil or adenosine in
//                                  pre-excited AF (safety)
//   flecainide-structural          flecainide with structural heart disease on
//                                  the chart: coronary disease, a valve lesion
//                                  or an abnormal echo (safety)
//   svt-drug-in-vt                 adenosine or verapamil for a broad-complex
//                                  tachycardia (safety)
//   unpaced-block-nodal            amiodarone, verapamil or metoprolol with
//                                  second- or third-degree block and no pacing
//                                  (safety)
//   verapamil-poor-lv              verapamil with impaired LV function on the
//                                  chart or a significant hypotension (safety)
//
// Sources (module text): amiodarone is avoided in long QT, pre-excited AF and
// high-grade block without pacing (Brilakis; pci-manual/04-lab-drugs.ts:813,
// 912, 936); flecainide only for the patient with no known structural heart
// disease, which Oxford takes to mean no history of coronary or valve disease
// and a normal echo (04-lab-drugs.ts:939, 1373); verapamil and adenosine are
// Oxford's SVT drugs, not VT drugs (04-lab-drugs.ts:1358); verapamil not with
// impaired LV function or significant hypotension (Oxford, 04-lab-drugs.ts:857).
// The lines never name
// the chart's planted problem at the stop: they send the learner back to the
// ECG, the echo and the history.
//
// Also here (pure, for the debrief): the vagal time limit. The module text says
// to note the time when atropine is given and, if there is no clear improvement
// within a few minutes, reconsider and look for infarction, tamponade or
// bleeding (complication-management/05-patient-complications.ts:328 and the tip
// diag-vagal-sequence, line 1871). vagalTimeLimitFinding reads the session's
// record of it.
//
// This file imports types only from the rule registry (registries.test.ts).
// ---------------------------------------------------------------------------

import type { MentorCtx } from "../context";
import type { MentorRule, RulePreAction } from "../rules";
import type { DrugId } from "../../simulation/patient/pharmacology";

/** Position of this group in RULES (after the drug rules, 310). */
export const order = 320;

/** What the lab is about to give for a rhythm, with the chart's facts, passed to the rules. */
export interface RhythmDrugAction {
  drug: DrugId;
  /** in the formulary unit */
  dose: number;
  /** the QTc on the chart's ECG or the patient's monitor, s (null: not known) */
  qtcS: number | null;
  /** the QTc at and above which the QT counts as long, s (the formulary's MP_INTERACTION.longQtcS) */
  longQtcS: number;
  /** pre-excitation on the chart's ECG */
  preExcitation: boolean;
  /** the rhythm on the monitor (the engine's base rhythm) */
  rhythm: string;
  /** AV block on the monitor: 0 none, 1 first degree, 2 second degree, 3 complete */
  avBlock: 0 | 1 | 2 | 3;
  /** a pacing wire or pads are pacing now */
  paced: boolean;
  /** structural heart disease on the chart (coronary or valve disease, an abnormal echo) */
  structural: boolean;
  /** the LVEF on the chart's echo (or the patient's), %, and the LVEF below which it counts as impaired (the formulary's MP_INTERACTION.poorLvefPct) */
  lvef: number | null;
  poorLvefPct: number;
  /** the systolic pressure the monitor shows, mmHg (null: none), and the systolic below which the hypotension counts as significant */
  systolic: number | null;
  lowSystolicMmHg: number;
}

/** The attending's context with the rhythm order about to be given. */
export interface RhythmMentorCtx extends MentorCtx {
  rhythmAction?: RhythmDrugAction;
}

const actionOf = (c: MentorCtx): RhythmDrugAction | undefined => (c as RhythmMentorCtx).rhythmAction;
const never = () => false;
const gives = (a: RulePreAction) => a === "give";

/** Whether the QT counts as long for this action. */
export const longQt = (a: Pick<RhythmDrugAction, "qtcS" | "longQtcS">): boolean => a.qtcS !== null && a.qtcS >= a.longQtcS;

const NODAL: readonly DrugId[] = ["amiodarone", "verapamil", "adenosine"];
const BLOCK_SLOWING: readonly DrugId[] = ["amiodarone", "verapamil", "metoprolol"];

export const RHYTHM_RULES: MentorRule[] = [
  {
    id: "chart-long-qt-amiodarone",
    title: "Amiodarone with a long QT",
    severity: "safety",
    phase: "complication",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      return gives(a) && !!d && d.drug === "amiodarone" && longQt(d);
    },
    anchor: "monitor",
    cooldownS: 5,
    lines: {
      1: () => "Before amiodarone: is there anything on the ECG that worries you?",
      2: () => "Look at the resting ECG on the chart and measure the QT on the monitor.",
      3: () => "This patient's ECG makes amiodarone dangerous: it can bring torsades or VF.",
      4: () => "No amiodarone with this QT. Shock it synchronised under sedation, or choose another drug.",
      5: () => "Stop. Not amiodarone for this patient: look at the QT.",
    },
  },
  {
    id: "pre-excited-af-nodal",
    title: "A nodal drug in pre-excited AF",
    severity: "safety",
    phase: "complication",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      return gives(a) && !!d && d.preExcitation && d.rhythm === "af" && NODAL.includes(d.drug);
    },
    anchor: "monitor",
    cooldownS: 5,
    lines: {
      1: () => "Is that drug safe with this ECG?",
      2: () => "Look at the resting ECG on the chart again.",
      3: () => "With this ECG, blocking the AV node can speed the ventricles dangerously.",
      4: () => "Not a nodal drug here. If he becomes unstable, a synchronised shock.",
      5: () => "Stop. Check the resting ECG before that drug.",
    },
  },
  {
    id: "flecainide-structural",
    title: "Flecainide with structural heart disease",
    severity: "safety",
    phase: "complication",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      return gives(a) && !!d && d.drug === "flecainide" && d.structural;
    },
    anchor: "plan",
    cooldownS: 5,
    lines: {
      1: () => "Who is flecainide safe for?",
      2: () => "Go through the history and the echo on the chart.",
      3: () => "This heart is not the one flecainide is for.",
      4: () => "Flecainide only without structural heart disease. Think of a shock or another drug.",
      5: () => "Stop. Not flecainide in this heart.",
    },
  },
  {
    id: "svt-drug-in-vt",
    title: "An SVT drug for a broad-complex tachycardia",
    severity: "safety",
    phase: "complication",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      return gives(a) && !!d && d.rhythm === "vt" && (d.drug === "adenosine" || d.drug === "verapamil");
    },
    anchor: "monitor",
    cooldownS: 5,
    lines: {
      1: () => "What is the rhythm on the monitor?",
      2: () => "Look at the width of the QRS.",
      3: () => "That drug is for a narrow-complex tachycardia, not this one.",
      4: () => "Treat a broad-complex tachycardia as VT: a synchronised shock, or a VT drug.",
      5: () => "Stop. Not that drug for this rhythm.",
    },
  },
  {
    id: "unpaced-block-nodal",
    title: "A drug that slows conduction, in high-grade block without pacing",
    severity: "safety",
    phase: "complication",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      return gives(a) && !!d && d.avBlock >= 2 && !d.paced && BLOCK_SLOWING.includes(d.drug);
    },
    anchor: "monitor",
    cooldownS: 5,
    lines: {
      1: () => "What is the conduction doing on the monitor?",
      2: () => "Look at the P waves and the QRS complexes together.",
      3: () => "That drug slows conduction further in this block.",
      4: () => "Pace first; then think about the drug.",
      5: () => "Stop. Not with this block and no pacing.",
    },
  },
  {
    id: "verapamil-poor-lv",
    title: "Verapamil with a poor ventricle or a low pressure",
    severity: "safety",
    phase: "complication",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      if (!gives(a) || !d || d.drug !== "verapamil") return false;
      return (d.lvef !== null && d.lvef < d.poorLvefPct) || (d.systolic !== null && d.systolic < d.lowSystolicMmHg);
    },
    anchor: "plan",
    cooldownS: 5,
    lines: {
      1: () => "What will verapamil do to this heart?",
      2: () => "Look at the echo on the chart and the pressure on the monitor.",
      3: () => "This ventricle or this pressure will not take a negative inotrope.",
      4: () => "Not verapamil here: adenosine, or a synchronised shock if he is unstable.",
      5: () => "Stop. Not verapamil for this patient.",
    },
  },
];

/** What the registry collects into RULES. Empty, as for diagDrugs.ts: these rules only stop actions (RHYTHM_RULES). */
export const rules: MentorRule[] = [];

// ---------------------------------------------------------------------------
// The vagal time limit, for the debrief
// ---------------------------------------------------------------------------

/** What the session records about a vagal-looking fall (the 'rhythm' capability's record().vagal). */
export interface VagalWatchRecord {
  /** lab time the first vagal treatment went in (atropine, legs up or fast saline), s; null: none */
  treatedAt: number | null;
  /** the time limit the learner set for the vagal diagnosis, s; null: none set */
  limitS: number | null;
  /** lab time the limit was set, s */
  limitSetAt: number | null;
  /** lab time the learner reconsidered the cause, s, and what they looked for */
  reconsideredAt: number | null;
  reconsideredAs: string | null;
}

/**
 * The longest a vagal diagnosis is held without improvement before the cause is reconsidered, s.
 * MODEL PARAMETER for 'a few minutes' (the module text gives no number): five minutes.
 */
export const MP_VAGAL_RECONSIDER_S = 300;

/** The debrief's finding on the vagal time limit: was one set, and was the cause reconsidered in time. */
export function vagalTimeLimitFinding(v: VagalWatchRecord, opts: { recovered: boolean }): { ok: boolean; text: string } {
  if (v.treatedAt === null) return { ok: true, text: "No vagal treatment was given." };
  const set = v.limitS !== null && v.limitSetAt !== null;
  const reconsideredIn = v.reconsideredAt !== null ? v.reconsideredAt - v.treatedAt : null;
  if (opts.recovered) return { ok: set, text: set ? "A time limit was set for the vagal diagnosis, and the pressure recovered within it." : "The pressure recovered, but no time limit was set for the vagal diagnosis: note the time when atropine goes in." };
  if (reconsideredIn === null) return { ok: false, text: "The pressure did not recover and the cause was never reconsidered: after a few minutes without improvement, look for bleeding, tamponade or infarction." };
  const inTime = reconsideredIn <= MP_VAGAL_RECONSIDER_S;
  const when = `${Math.round(reconsideredIn)} s after the first vagal treatment`;
  if (!set) return { ok: false, text: `The cause was reconsidered ${when}, but no time limit had been set.` };
  return { ok: inTime, text: inTime ? `A time limit was set and the cause was reconsidered ${when}.` : `A time limit was set, but the cause was reconsidered only ${when}.` };
}
