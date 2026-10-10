// ---------------------------------------------------------------------------
// Rule group: drugs in the diagnostic lab (diag-lab-drugs). These rules only
// stop actions: their `when` never holds, so an attending running them stays
// silent about drugs, and the lab's drug module (src/ui/sim/modules/drugs.ts)
// asks them before an operator gives an intracoronary or intra-arterial
// syringe ('give-ic') and before the team is asked to give a drug ('give'). The
// module passes what it is about to give as DrugMentorCtx.drugAction. They are
// exported as DRUG_RULES; `rules` (what RULES collects) is empty for the reason
// given at the foot of the file.
//
//   ic-drug-abnormal-trace       an intracoronary drug through a damped or
//                                ventricularised trace (safety)
//   ia-lidocaine                 lidocaine into the artery (safety)
//   nitrate-caution              a nitrate with a caution from the module text:
//                                PDE-5 window, RV infarction, hypovolaemia,
//                                obstructive HCM (safety)
//   antiarrhythmic-contraindicated  amiodarone, verapamil or flecainide with a
//                                flag from the formulary's interaction table
//                                (long QT, pre-excited AF, unpaced high-grade
//                                block, poor LV) (safety)
//   dose-outside-module-range    a dose above both the order and the largest
//                                dose the module text states for the drug
//                                and route (a misheard dose confirmed at the
//                                read-back) (technique: blocks in guided and
//                                supervised modes, left to the debrief in
//                                independent and exam modes)
//   nitrate-dose-band            an intracoronary nitrate above the dose the
//                                systolic pressure allows, or more nitrate into
//                                a falling pressure (technique)
//
// Sources (module text): the dose by systolic pressure, Brilakis 6.3,
// src/content/manual/pci-manual/04-lab-drugs.ts:251; the cautions, Brilakis 3.2
// and 6.3, lines 308-312; intra-arterial lidocaine can cause seizures, Brilakis
// (07-engaging.ts:1321, 05-access.ts:816); the antiarrhythmic cautions, the
// antiarrhythmics table (04-lab-drugs.ts:788-799, 856-857, 430); no
// intracoronary injection through a ventricularised trace (pm-interpreting#8,
// 09-interpreting.ts:1137). The lines never name the planted problem at the
// stop: they send the learner back to the chart, the ECG or the pressure.
//
// This file imports types only from the rule registry (registries.test.ts).
// ---------------------------------------------------------------------------

import type { MentorCtx } from "../context";
import type { MentorRule, RulePreAction } from "../rules";
import type { DrugId, InteractionId, Route } from "../../simulation/patient/pharmacology";
import type { NitrateCaution } from "../../simulation/patient/patient";
import { DAMPED_KINDS } from "../types";

/** Position of this group in RULES (after the diagnostic (100) and PCI (200) groups). */
export const order = 310;

/** Where an operator's syringe goes in: the manifold, a needle through the Y-connector, or the sheath's side arm; 'team' for a drug the team gives. */
export type DrugVia = "manifold" | "y-connector" | "sheath" | "team";

/** What the lab is about to give, passed to the rules with the attending's context. */
export interface DrugAction {
  drug: DrugId;
  /** in the formulary unit (DRUGS[drug].unit) */
  dose: number;
  route: Route;
  via: DrugVia;
  /** the systolic pressure the monitor shows now, mmHg (null: none shown) */
  systolic: number | null;
  /** the patient's nitrate cautions now (nitrateCautions in patient.ts) */
  cautions: readonly NitrateCaution[];
  /** the formulary's interaction flags a dose would raise now (engine.interactionFlags) */
  flags: readonly InteractionId[];
  /** seconds since the last vasodilator was given (null: none this case) */
  sinceVasodilatorS: number | null;
  /** the dose the operator ordered (`dose` is what was drawn up: a misheard read-back differs) */
  orderedDose?: number;
  /** the largest dose the module text states for this drug given this way (the drugs menu); null or absent: none stated */
  statedMaxDose?: number | null;
}

/** The attending's context with the drug about to be given. */
export interface DrugMentorCtx extends MentorCtx {
  drugAction?: DrugAction;
}

const actionOf = (c: MentorCtx): DrugAction | undefined => (c as DrugMentorCtx).drugAction;

/**
 * Brilakis's intracoronary nitroglycerin before angiography, by systolic pressure (6.3,
 * 04-lab-drugs.ts:251): above 120 mmHg 200 µg; 100-120 mmHg 100 µg; below 100 mmHg 50 µg or none.
 */
export const NITRATE_DOSE_LADDER = {
  /** systolic above this, mmHg: highUg */
  highAboveMmHg: 120,
  highUg: 200,
  /** systolic from this to highAboveMmHg, mmHg: midUg */
  midFromMmHg: 100,
  midUg: 100,
  /** below midFromMmHg: lowUg or none */
  lowUg: 50,
} as const;

/**
 * Seconds after a vasodilator within which a systolic below 100 mmHg is taken as the vasodilator's
 * fall, so no more nitrate is given ("Repeating doses into falling pressure; give no more",
 * 09-interpreting.ts:1139). MODEL PARAMETER: the same few minutes the vasodilator-given event is held
 * (cm-patient-complications#10; nitroglycerin's half-life 1.5-7.5 minutes, 04-lab-drugs.ts:321).
 */
export const MP_RECENT_VASODILATOR_S = 300;

/** The largest intracoronary nitroglycerin dose (µg) the ladder allows at this systolic pressure; null when no pressure is shown. */
export function nitrateDoseLimitUg(systolic: number | null, sinceVasodilatorS: number | null = null): number | null {
  if (systolic === null || !Number.isFinite(systolic)) return null;
  const L = NITRATE_DOSE_LADDER;
  if (systolic > L.highAboveMmHg) return L.highUg;
  if (systolic >= L.midFromMmHg) return L.midUg;
  // the bottom band's "or none": none into a vasodilator's fall
  if (sinceVasodilatorS !== null && sinceVasodilatorS < MP_RECENT_VASODILATOR_S) return 0;
  return L.lowUg;
}

const NITRATES: readonly DrugId[] = ["gtn"];
const ANTIARRHYTHMIC_FLAGS: readonly InteractionId[] = ["long-qt-antiarrhythmic", "pre-excitation-antiarrhythmic", "high-grade-block-av-nodal", "poor-lv-negative-inotrope"];
const ANTIARRHYTHMICS: readonly DrugId[] = ["amiodarone", "verapamil", "flecainide"];
const never = () => false;
const operatorGives = (a: RulePreAction) => a === "give-ic";
const anyGive = (a: RulePreAction) => a === "give-ic" || a === "give";

export const DRUG_RULES: MentorRule[] = [
  {
    id: "ic-drug-abnormal-trace",
    title: "Intracoronary drug through an abnormal trace",
    severity: "safety",
    phase: "inject",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      return operatorGives(a) && !!d && d.route === "ic" && (c.damped || DAMPED_KINDS.includes(c.pressure));
    },
    anchor: "pressure",
    cooldownS: 5,
    lines: {
      1: () => "Before that goes in, what is the pressure telling you?",
      2: () => "Look at the trace at the tip.",
      3: () => "The trace isn't free. Whatever you push goes against the wall or into a narrowed ostium.",
      4: () => "Come back until the aortic trace returns, re-engage gently, then give it.",
      5: () => "Stop. Not through that trace.",
    },
  },
  {
    id: "ia-lidocaine",
    title: "Lidocaine into the artery",
    severity: "safety",
    phase: "access",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      return anyGive(a) && !!d && d.drug === "lidocaine" && (d.route === "ia" || d.route === "ic");
    },
    anchor: "syringe",
    cooldownS: 5,
    lines: {
      1: () => "Where is that lidocaine going?",
      2: () => "Think about what lidocaine does in the arterial circulation.",
      3: () => "Lidocaine into the artery can cause seizures.",
      4: () => "Lidocaine goes around the artery, never into it. Use a vasodilator through the sheath.",
      5: () => "Stop. No lidocaine into the artery.",
    },
  },
  {
    id: "nitrate-caution",
    title: "Nitrate with a reason to withhold it",
    severity: "safety",
    phase: "inject",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      return anyGive(a) && !!d && NITRATES.includes(d.drug) && d.cautions.length > 0;
    },
    anchor: "plan",
    cooldownS: 5,
    lines: {
      1: () => "Before any nitrate: is there a reason not to give it?",
      2: () => "Go through the chart and the history again: medicines, the ECG, the echo, the fluids.",
      3: () => "This patient has a reason to withhold nitrate. Find it on the chart.",
      4: () => "No nitrate. If you need a vasodilator, think again about why.",
      5: () => "Stop. Check the chart before any nitrate.",
    },
  },
  {
    id: "antiarrhythmic-contraindicated",
    title: "Antiarrhythmic with a contraindication",
    severity: "safety",
    phase: "complication",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      return anyGive(a) && !!d && ANTIARRHYTHMICS.includes(d.drug) && d.flags.some((f) => ANTIARRHYTHMIC_FLAGS.includes(f));
    },
    anchor: "monitor",
    cooldownS: 5,
    lines: {
      1: () => "Is this drug safe in this patient?",
      2: () => "Look at the ECG, the rhythm and the echo before you choose.",
      3: () => "Something on the ECG or the echo makes that drug dangerous here.",
      4: () => "Choose by stability and by what this patient's heart can take: a shock or pacing may be safer.",
      5: () => "Stop. Not that drug for this patient: look at the ECG and the echo first.",
    },
  },
  {
    id: "dose-outside-module-range",
    title: "Dose above the order and the stated range",
    severity: "technique",
    phase: "inject",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      if (!anyGive(a) || !d || d.statedMaxDose === null || d.statedMaxDose === undefined) return false;
      // a dose the operator chose (a menu dose or one typed as Other) is the operator's; only a syringe
      // holding more than the order and more than the module text states is stopped
      return d.dose > Math.max(d.statedMaxDose, d.orderedDose ?? d.dose);
    },
    anchor: "syringe",
    cooldownS: 5,
    lines: {
      1: () => "What's in that syringe?",
      2: () => "Check the syringe against what you asked for.",
      3: () => "That syringe doesn't match the order you gave.",
      4: () => "Read the label and the volume back against your order before anything goes in.",
      5: () => "Stop. Read the syringe label against your order.",
    },
  },
  {
    id: "nitrate-dose-band",
    title: "Nitrate dose above what the pressure allows",
    severity: "technique",
    phase: "inject",
    lab: "diagnostic",
    when: never,
    persistS: 0,
    stopOn: (a, c) => {
      const d = actionOf(c);
      if (!operatorGives(a) || !d || !NITRATES.includes(d.drug) || d.route !== "ic") return false;
      const max = nitrateDoseLimitUg(d.systolic, d.sinceVasodilatorS);
      return max !== null && d.dose > max;
    },
    anchor: "monitor",
    cooldownS: 5,
    lines: {
      1: () => "What's the systolic pressure?",
      2: () => "Match the nitrate dose to the systolic.",
      3: () => "That dose is more than this pressure allows.",
      4: () => "Above 120 systolic 200 micrograms, 100 to 120 give 100, below 100 give 50 or none; none into a falling pressure.",
      5: () => "Hold that. Check the pressure and the dose.",
    },
  },
];

/**
 * What the registry collects into RULES (src/mentor/rules/index.ts). Empty for now: these rules only
 * stop actions, the lab's drug module asks them through its own MentorEngine (DRUG_RULES), and the
 * live attending has no 'give-ic' or 'give' hook yet. mentor.test.ts runs a firing scenario for every
 * rule in RULES, which an action-only rule cannot have; DRUG_RULES joins RULES once that test covers
 * action-only rules and useAttending routes the drug stops through the live attending (reported to
 * the plan owner with diag-lab-drugs).
 */
export const rules: MentorRule[] = [];
