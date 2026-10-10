// ---------------------------------------------------------------------------
// Pressure-wire session (physiology-engine-unify-and-setup).
//
// One reducer for a pressure-wire study, shared by the physiology lab and the
// PCI lab's pressure-wire console (HANDOVER 6.5: one front end, not two). It
// is built on pci/pressureWire.ts (the wire's offset, drift, equalisation
// window and drift check) and the physiology engine (physiology.ts: Gould
// losses, autoregulation, phasic flow), and adds the set-up of lesson
// pm-physiology-setup (Brilakis 12.2, Oxford ch 8) with its faults:
//
//   step 1  zero the wire outside the body          fault "no-zero": a loose connection
//   step 2  introduce it and bring the sensor to    fault "wire-deformed": a balloon left in the guide
//           the guide tip                           fault "ebu-lcx": an oversized EBU sends the wire into the circumflex
//   step 3  introducer out, guide flushed,          faults "introducer", "contrast", "air-aortic",
//           equalise when the waveforms superimpose "deep-equalise" (sensor parked too deep), "offset-waveforms"
//                                                   (a wire whose Pd lags Pa: the means match, the shapes do not)
//   step 4  cross and go distal; hyperaemia, record, pullback, drift check
//
// The reducer is pure and engine-free: the lab drives it with a model clock
// ({ type: "tick", dt, patient }) and feeds the patient engine's mean aortic
// pressure and heart rate into the case each step, so the indices follow the
// patient while physiology.ts keeps its own numbers (at equal MAP the console
// reads exactly physiology.indices; pwSession.test.ts checks it). The aortic
// (guide) channel goes through the Transducer of patient/transducer.ts: air in
// the aortic line (Transducer.setAir) and contrast in the guide
// (Transducer.setContrast) damp it, and the lab applies the same settings to
// the engine's own transducer for the trace on the screen.
//
// What the console shows (Pa, Pd, Pd/Pa, the trace) is what an operator sees.
// Why a reading is wrong (PwRecord.problems, waveformMismatch) is kept for the
// debrief and for guided teaching aids only.
//
// Sourced: the sensor 3 cm from the tip, equalisation at the guide tip, the
// drift window 0.98-1.02 and the cut-offs (pressureWire.ts, physiology.ts
// CUTOFF, lesson pm-physiology-setup and pm-physiology-pullback); the causes
// and remedies of each fault (Brilakis 12.2.1-12.2.4, lesson pm-physiology-
// setup troubleshooting table). Every magnitude below marked MP_ is a MODEL
// PARAMETER: none comes from a source.
//
// Hyperaemia (physiology-hyperaemia-and-adenosine, lesson pm-physiology-indices
// and pm-lab-drugs-microvascular). The operator chooses the agent, route and
// dose: intracoronary adenosine with a dose (µg) and an injection speed into the
// guide's vessel, then a guide flush so the whole dose reaches the artery; IV
// adenosine at a rate (µg/kg/min) through a chosen vein (the hand-vein cannula,
// a large antecubital vein or a central vein); or 8 mL of contrast for contrast
// FFR (cut-off 0.83). The hyperaemia fraction h that physiology.indices reads is
// the patient engine's adenosine effect, evaluated in closed form from
// pharmacology.ts (the same compartments, time constants and dose-response as
// Pharmacology.step), normalised so that the lower standard dose (IV
// 140 µg/kg/min at steady state, IC 100 µg left or 50 µg right at its peak,
// the lower ends of the module's ranges) counts as maximal. Failure states follow Brilakis's causes of failed
// hyperaemia: a tissued hand-vein cannula, saline given instead of adenosine, a
// very low dose, recent caffeine, a guide disengaged before an IC bolus, and the
// early-reading artefact while the guide trace is disturbed by the injection or
// before the flush. A reading at h < MP_SUBMAXIMAL_H is flagged submaximal (for
// the debrief and guided aids only; the console never says why). The legacy
// actions without a dose or site ({ type: "hyperaemia", mode: "iv" | "ic" })
// keep the time-compressed curves they always had, so other callers behave as
// before. The lab's engine is told what the operator did by
// applyPwActionToEngine (bedside orders included: cough, CPR, pacing, charge,
// shock, synchronised cardioversion).
//
// Left main and aorto-ostial (physiology-left-main-and-ostial): the presets of
// physiology.ts LEFT_MAIN_PRESETS are listed too (LEFT_MAIN_PW_PRESETS). In a
// branched one the operator steers the wire into the LAD or the circumflex
// (action "branch", PwSessionState.lmBranch); the session reads the path ostium,
// left main, that branch, records which branch each measurement came from, and
// keeps the last pullback of each branch for comparison. A decision the case
// also accepts (CoronaryCase.alsoAccepted) scores as correct (decisionAccepted).
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../content/lab/tips";
import type { PatientEngine, Vitals } from "../patient/engine";
import type { Dominance } from "../../types";
import { ADENOSINE, MP_ADENOSINE_IV_OFF_TAU_S, icAdenosineEffectSiteUg, icAdenosineHyperaemiaOf, icAdenosinePeakHyperaemia, ivAdenosineSteadyLevel, ivAdenosineTauS } from "../patient/pharmacology";
import { CUTOFF, HR, LEFT_MAIN_PRESETS, PHYSIOLOGY_CASES, WFP, aorticPressure, presetView, reading, thermodilution, type CaseDecision, type CoronaryCase, type Lesion, type LeftMainPreset } from "../physiology";
import { DEFAULT_LINE, Transducer, classifyTip, type Dynamic, type TipPressureState } from "../patient/transducer";
import { EQUALISE_MAX_MM, EQUALISE_MIN_MM, MP_DRIFT_SD, MP_ZERO_OFFSET_SD_MMHG, SENSOR_FROM_TIP_MM, equaliseValidAt, icAdenosineHyperaemia, initialPressureWire, measure, stepPressureWire, type PressureWireState } from "./pressureWire";
import { normal, rngFrom, type RngState } from "./rng";
import { MP_DEFIB } from "../patient/rhythm";

export { EQUALISE_MAX_MM, EQUALISE_MIN_MM, MP_DRIFT_SD, MP_ZERO_OFFSET_SD_MMHG, SENSOR_FROM_TIP_MM, equaliseValidAt };

// --- MODEL PARAMETERS -----------------------------------------------------------

/** Offset of a wire that has not been zeroed, SD in mmHg — MODEL PARAMETER. */
export const MP_UNZEROED_SD_MMHG = 20;
/** Introducer left in the haemostatic valve: the guide pressure leaks and reads low by this much, mmHg — MODEL PARAMETER. */
export const MP_INTRODUCER_LEAK_MMHG = 3;
/** ... and is damped (first-order lag of this time constant, s) — MODEL PARAMETER. */
export const MP_INTRODUCER_TAU_S = 0.05;
/** Air trapped in the aortic line in the "air-aortic" fault, mL (Transducer.setAir) — MODEL PARAMETER. */
export const MP_AIR_ML = 0.05;
/** Fraction of the guide filled with contrast after an angiographic injection (Transducer.setContrast) — MODEL PARAMETER. */
export const MP_GUIDE_CONTRAST = 1;
/** Phase lag of Pd behind Pa on the faulty wire of "offset-waveforms", fraction of the cycle — MODEL PARAMETER. */
export const MP_WAVE_LAG = 0.05;
/**
 * Waveforms "superimpose" when the RMS difference of their shapes (means removed) over a beat is at
 * most this, mmHg — MODEL PARAMETER (an undamaged, flushed system with the default line reads about 1).
 */
export const MP_MISMATCH_RMS_MMHG = 2;
/** Left main length: the wire tip passes the bifurcation this far beyond the guide tip, mm — MODEL PARAMETER. */
export const MP_LM_LENGTH_MM = 10;
/**
 * IV adenosine: hyperaemia builds over this long, s (time-compressed from 60-90 s, lesson
 * pm-physiology-indices) — MODEL PARAMETER. The patient engine runs the drug's own onset
 * (pharmacology.ts ADENOSINE.timeToMaxIvS) for the blood pressure and heart rate response.
 */
export const MP_IV_RAMP_S = 20;
/** A pullback from the distal vessel to the guide tip takes this long, s (time-compressed) — MODEL PARAMETER. */
export const MP_PULLBACK_S = 9;
/** Hyperaemia below this fraction counts as none (resting conditions) — MODEL PARAMETER. */
export const MP_REST_H = 0.05;
/** Hyperaemia at or above this fraction counts as maximal — MODEL PARAMETER. */
export const MP_MAX_H = 0.95;
/** The patient's MAP is fed into the case rounded to this step, mmHg, so physiology.ts's cache stays small — MODEL PARAMETER. */
export const MP_MAP_STEP = 0.5;
/** A reading counts as distal to every lesion only this far (fraction of the vessel) beyond the deepest one — MODEL PARAMETER. */
export const MP_DISTAL_MARGIN = 0.15;
/** A pullback is a hyperaemic (FFR) pullback above this hyperaemia fraction, else a resting one — MODEL PARAMETER. */
export const MP_PULLBACK_FFR_H = 0.5;
/** Thermodilution needs the sensor at least this far along the vessel (fraction): "the distal vessel" — MODEL PARAMETER. */
export const MP_THERMO_DISTAL_X = 0.6;
/** Transient set-up events stay active this long after they were last raised, s (the shared TRANSIENT_HOLD_S of eventLog.ts). */
export const PW_EVENT_HOLD_S = 30;

// --- hyperaemia (physiology-hyperaemia-and-adenosine) ------------------------------------

/** An FFR read below this hyperaemia fraction is flagged submaximal — MODEL PARAMETER (the package's acceptance threshold). */
export const MP_SUBMAXIMAL_H = 0.9;
/** Contrast FFR: the ischaemic cut-off is 0.83 rather than 0.80 (Brilakis, lesson pm-physiology-indices, 14-physiology.ts:422 and 443). */
export const CONTRAST_FFR_CUTOFF = 0.83;
/** Contrast for contrast FFR: the usual volume, mL (14-physiology.ts:421). */
export const CONTRAST_FFR_ML = 8;
/** IV adenosine, µg/kg/min: 140-180 (Brilakis, 14-physiology.ts:410; section 3.2 gives 140 through a central or large peripheral vein). */
export const IV_ADENOSINE_UG_KG_MIN = { low: ADENOSINE.ivStandardUgKgMin, high: 180 } as const;
/**
 * The most intracoronary adenosine the module allows into the RCA or a dominant circumflex, µg ("no more
 * than 100 µg", Brilakis 3.2 and 12.2: 14-physiology.ts:478-482, 04-lab-drugs.ts:505 and 586).
 */
export const IC_ADENOSINE_RCA_MAX_UG = 100;
/**
 * The intracoronary dose the legacy IC action gives, µg: left main 200, RCA 100 (14-physiology.ts:410,
 * "RCA 50-100 µg; left main 200 µg"; the RCA dose is the ceiling the lesson sets).
 */
export const IC_ADENOSINE_LEGACY_UG = { left: 200, right: 100 } as const;
/**
 * The lower end of the module's intracoronary dose ranges, µg, taken as the dose that gives maximal
 * hyperaemia: RCA 50 (14-physiology.ts:410, "RCA 50-100 µg"), left 100 (04-lab-drugs.ts:436, "left main
 * 100-200 µg"; the physiology chapter gives 200, 14-physiology.ts:410).
 */
export const IC_ADENOSINE_MAXIMAL_UG = { left: 100, right: 50 } as const;
/** Brilakis reads IV-adenosine FFR 1-3 minutes after starting the infusion (14-physiology.ts:438): the earliest, s. */
export const IV_READ_AFTER_S = 60;
/** Fraction of an IC bolus still in the guide until the guide is flushed — MODEL PARAMETER. */
export const MP_GUIDE_HOLDUP = 0.4;
/** Fraction of an IC bolus (or of the flush behind it) that reaches the artery while the guide is disengaged — MODEL PARAMETER. */
export const MP_DISENGAGED_DELIVERY = 0.2;
/** Fraction of an infusion a tissued hand-vein cannula delivers to the circulation — MODEL PARAMETER. */
export const MP_TISSUED_DELIVERED = 0.1;
/** An injection through the guide raises the guide (aortic) pressure by this much, mmHg, decaying with MP_INJECTION_TAU_S — MODEL PARAMETERS. */
export const MP_INJECTION_ARTEFACT_MMHG = 8;
export const MP_INJECTION_TAU_S = 1.2;
/** The guide trace counts as recovered from an injection this long after it, s — MODEL PARAMETER. */
export const MP_INJECTION_RECOVERY_S = 3;
/**
 * Contrast hyperaemia (submaximal; "has some vasodilator effect", 14-physiology.ts:422): peak fraction, rise
 * time constant, plateau and decay, s — MODEL PARAMETERS. The peak is chosen so that the sourced contrast
 * cut-off (0.83) and the FFR cut-off (0.80) select the same lesions in physiology.ts's mid-LAD model.
 */
export const MP_CONTRAST_H = 0.8;
export const MP_CONTRAST_RISE_S = 1.5;
export const MP_CONTRAST_PLATEAU_S = 8;
export const MP_CONTRAST_DECAY_S = 4;
/**
 * A contrast FFR counts as read during the contrast effect only while the hyperaemia is at least this
 * fraction of the contrast peak (MP_CONTRAST_H) — MODEL PARAMETER. Earlier it is read before the effect
 * has built; later, the effect has passed and the reading is the resting Pd/Pa.
 */
export const MP_CONTRAST_READ_FRAC = 0.9;
/** Temporary pacing rate the order sets, bpm — MODEL PARAMETER. */
export const MP_PACING_RATE_BPM = 70;
/** VF counts as defibrillated at once by a shock within this long of its onset, s — MODEL PARAMETER (debrief). */
export const MP_ORDER_WINDOW_S = 120;
/**
 * Adenosine heart block that ends within this long of its onset, s, has been rightly watched even with no
 * explicit order (it "resolves in seconds", 14-physiology.ts:478) — MODEL PARAMETER (debrief).
 */
export const MP_BLOCK_SELF_RESOLVE_S = 20;

/** IV access: the hand-vein cannula already in, a large antecubital vein, or a central (femoral) vein. */
export type PwIvSite = "hand" | "peripheral" | "central";
export const PW_IV_SITES: readonly { id: PwIvSite; label: string }[] = [
  { id: "hand", label: "Hand-vein cannula" },
  { id: "peripheral", label: "Large antecubital vein" },
  { id: "central", label: "Central (femoral) vein" },
];

/** Why hyperaemia fails in a preset: a tissued hand-vein cannula, saline drawn up as adenosine, recent caffeine. */
export type PwHyperaemiaFault = "tissued-line" | "saline-swap" | "caffeine";

/** The adenosine hazard model a preset asks the lab's engine for: on (random), or one arrhythmia forced. */
export type PwAdenosineHazards = "on" | "af" | "vf" | "no-escape";

/** Bedside orders for adenosine arrhythmias (Brilakis 3.2 and 12.2; lessons pm-physiology-indices and pm-lab-drugs-microvascular). */
export type PwOrder = "cough" | "wait" | "cpr-start" | "cpr-stop" | "pace-on" | "pace-off" | "charge" | "clear" | "shock" | "cardiovert";

/** The last injection through the guide: IC adenosine (or the saline drawn up as it) or contrast. */
export interface PwInjection {
  t: number;
  agent: "adenosine" | "saline" | "contrast";
  /** the dose the operator gave, µg (0 for contrast) */
  doseUg: number;
  /** contrast volume, mL (0 for adenosine) */
  ml: number;
  side: "left" | "right";
  vessel: string;
  /** the guide was engaged when it was given */
  engaged: boolean;
  fast: boolean;
  /** what reached the artery and when (the bolus, then the flush behind it), µg */
  parts: { t: number; ug: number }[];
  flushedAt: number | null;
}

/** An IV infusion as given: rate, site, the fraction reaching the circulation, the agent, and the level when it started. */
export interface PwIvDetail {
  rate: number;
  site: PwIvSite;
  delivered: number;
  agent: "adenosine" | "saline";
  /** hyperaemia when this infusion (or its new rate) started */
  h0: number;
}

/** The defibrillator's state as its operator sees it (PwSessionState.defib). */
export interface PwDefib {
  /** lab time the current charge began, or null when it is not charging */
  chargingSince: number | null;
  charged: boolean;
}

/** The rhythm as the lab's monitor shows it (PwPatientInput.rhythm). */
export interface PwRhythm {
  kind: string;
  av: number;
}

/** An arrhythmia episode seen on the monitor (debrief). */
export interface PwArrhythmia {
  kind: "av-block" | "af" | "vf";
  t: number;
  end: number | null;
}

// --- presets ----------------------------------------------------------------------

export type PwFault = "no-zero" | "introducer" | "contrast" | "air-aortic" | "deep-equalise" | "offset-waveforms" | "ebu-lcx" | "wire-deformed";
export const PW_FAULTS: readonly PwFault[] = ["no-zero", "introducer", "contrast", "air-aortic", "deep-equalise", "offset-waveforms", "ebu-lcx", "wire-deformed"];

/**
 * How a study starts: "packet" with the wire still in its packet (the learner does steps 1 to 4), or
 * "at-tip" with the wire zeroed, introduced and the sensor at the guide tip by the assistant, the
 * introducer out and the guide flushed unless a fault says otherwise.
 */
export type PwStart = "packet" | "at-tip";

export interface PhysiologyPreset {
  id: string;
  /** the title in the lab and the practice list (does not give the answer away) */
  title: string;
  /** the case brief the learner reads */
  brief: string;
  case: CoronaryCase;
  faults: readonly PwFault[];
  start: PwStart;
  /** sensor position at an at-tip start, mm beyond the guide tip (default 0) */
  startSensorMm?: number;
  /** a fixed drift rate for this preset's first wire, mmHg/s (default drawn with MP_DRIFT_SD) */
  driftPerS?: number;
  /** the first wire's drift since its last equalisation goes no further than this, mmHg (the case's own drift) */
  driftCapMmHg?: number;
  /** case properties raised for the whole study (tip vocabulary) */
  events?: readonly LabEvent[];
  /** why hyperaemia fails in this study (physiology-hyperaemia-and-adenosine) */
  hyperaemiaFaults?: readonly PwHyperaemiaFault[];
  /** the adenosine hazard model the lab's engine runs (absent: off, as in every other preset) */
  adenosineHazards?: PwAdenosineHazards;
  /** an intracoronary bolus a colleague gave just before the study starts */
  startBolus?: { doseUg: number; fast: boolean };
  /** adenosine is contraindicated here, and why (the debrief checks it was avoided) */
  adenosineContraindicated?: string;
  /**
   * A left main or aorto-ostial preset (physiology-left-main-and-ostial, physiology.ts LEFT_MAIN_PRESETS):
   * its branched model, when it has one, and the branches the wire can be steered into. `case` is then the
   * default branch's view.
   */
  leftMain?: LeftMainPreset;
}

const BASE = Object.fromEntries(PHYSIOLOGY_CASES.map((c) => [c.id, c])) as Record<string, CoronaryCase>;
const LAD = BASE["lad-intermediate"];
const RCA = BASE["rca-negative"];

/** Titles for the teaching cases that do not name the pitfall (the lab's list and the practice index). */
const CASE_TITLES: Record<string, string> = {
  "lad-intermediate": "Intermediate mid-LAD lesion",
  "rca-negative": "Moderate mid-RCA lesion",
  tandem: "Two moderate LAD lesions",
  diffuse: "Long, irregular LAD",
  anoca: "Exertional angina with smooth coronaries",
  "guide-wedge": "Proximal LAD lesion after a diagnostic study",
  drift: "Borderline obtuse marginal lesion",
};

const AT_TIP = "Your assistant has zeroed and introduced the pressure wire and brought the sensor to the guide tip; check the set-up before you equalise.";

/** A short proximal LAD lesion within the first centimetre, for the sensor parked too deep. */
const PROXIMAL_LAD: CoronaryCase = {
  ...LAD,
  id: "proximal-lad",
  title: "Proximal LAD lesion",
  brief: "60-year-old man with exertional angina on two agents. Angiography: 65% proximal LAD stenosis, 6 mm long, just beyond the left main, in a 3.2 mm vessel.",
  refDiamMm: 3.2,
  lengthMm: 115,
  lesions: [{ id: "proximal", pos: 0.035, ds: 0.65, lengthMm: 6 }],
  diffuse: 0.08,
  decision: "treat",
  teaching: "A short proximal lesion sits within the first centimetre: a sensor parked deep has already crossed it, so equalising there cancels the gradient you came to measure.",
};

/**
 * The hyperaemia presets (physiology-hyperaemia-and-adenosine): the wire is set up at the guide tip by the
 * assistant, and the study is about the agent, its dose and route, the failures of hyperaemia and the
 * arrhythmias of adenosine. The titles do not name the failure.
 */
function hyperaemiaPresets(): PhysiologyPreset[] {
  const IC = "Measure FFR with intracoronary adenosine: choose the dose for the vessel and how fast to give it.";
  const IV = "Measure FFR with IV adenosine. A cannula is in the back of the left hand.";
  // a mid-LAD lesion a little milder than the teaching case: its FFR lies just below 0.80 and its contrast FFR between 0.80 and 0.83
  const CONTRAST_LAD: CoronaryCase = {
    ...LAD,
    id: "lad-asthma",
    title: "Mid-LAD lesion, adenosine contraindicated",
    brief: "64-year-old woman with asthma and exertional angina on two agents. Angiography: 59% mid-LAD stenosis, 12 mm long, in a 3.0 mm vessel.",
    lesions: [{ ...LAD.lesions[0], ds: 0.59 }],
    decision: "treat",
    teaching: "Adenosine is contraindicated in asthma (Oxford), so measure without it: a resting index, or contrast FFR with 8 mL of contrast, read against its own cut-off of 0.83 rather than 0.80. Here both point to a significant lesion.",
  };
  return [
    { id: "ic-rca-dose", title: "Hyperaemia 1: moderate mid-RCA lesion", brief: `${RCA.brief} ${AT_TIP} ${IC}`, case: RCA, faults: [], start: "at-tip", adenosineHazards: "on" },
    { id: "iv-tissued-line", title: "Hyperaemia 2: mid-LAD lesion", brief: `${LAD.brief} ${AT_TIP} ${IV}`, case: LAD, faults: [], start: "at-tip", hyperaemiaFaults: ["tissued-line"] },
    { id: "iv-caffeine", title: "Hyperaemia 3: mid-LAD lesion on a morning list", brief: `${LAD.brief} ${AT_TIP} ${IV}`, case: LAD, faults: [], start: "at-tip", hyperaemiaFaults: ["caffeine"] },
    { id: "saline-swap", title: "Hyperaemia 4: mid-LAD lesion", brief: `${LAD.brief} ${AT_TIP} The nurse has drawn up and hung the adenosine.`, case: LAD, faults: [], start: "at-tip", hyperaemiaFaults: ["saline-swap"] },
    {
      id: "contrast-ffr",
      title: "Hyperaemia 5: mid-LAD lesion in a patient with asthma",
      brief: `${CONTRAST_LAD.brief} ${AT_TIP}`,
      case: CONTRAST_LAD,
      faults: [],
      start: "at-tip",
      adenosineContraindicated: "asthma (Oxford)",
    },
    {
      id: "adenosine-vf",
      title: "Hyperaemia 6: moderate mid-RCA lesion, adenosine just given",
      brief: `${RCA.brief} ${AT_TIP} A colleague has just given 150 µg of intracoronary adenosine into the RCA as a fast push and stepped out; you take over at the table.`,
      case: RCA,
      faults: [],
      start: "at-tip",
      adenosineHazards: "vf",
      startBolus: { doseUg: 150, fast: true },
    },
  ];
}

/**
 * The hyperaemia presets are in the lab's list (PHYSIOLOGY_PRESETS, its case menu and the practice index
 * through hyperaemia.launch.ts) because the lab's rig, src/ui/sections/PhysiologyLab.tsx, gives its
 * engine what the operator does: setUpPwEngine after the engine is built, applyPwActionToEngine after
 * each action, pwPatientInput in each tick (PhysiologyLab.test.ts checks each). Without that the engine
 * would show adenosine's systemic signs after a saline swap or a tissued line, never turn the hazard
 * model on and never answer the bedside orders; setting this false holds them back again (with
 * hyperaemia.launch.ts's scenarios emptied), and physiologyTips.ts then stops declaring
 * PHYSIOLOGY_ADENOSINE_EVENTS.
 */
export const HYPERAEMIA_PRESETS_LISTED = true;

/** The hyperaemia presets (listed in the lab when HYPERAEMIA_PRESETS_LISTED; initialPwSession knows them either way). */
export const HYPERAEMIA_PRESETS: readonly PhysiologyPreset[] = hyperaemiaPresets();

/**
 * The left main and aorto-ostial presets (physiology-left-main-and-ostial): the branched cases of
 * physiology.ts LEFT_MAIN_PRESETS and the aorto-ostial RCA, each with its own title, brief and case
 * properties (events). Every study starts with the wire in its packet. In a branched preset the wire
 * goes into the branch the operator chooses (PwSessionState.lmBranch, action "branch"; the default is
 * the model's), and the session reads the path ostium, left main, that branch (physiology.ts
 * presetView), so a pullback from each branch shows where the step is.
 */
export const LEFT_MAIN_PW_PRESETS: readonly PhysiologyPreset[] = LEFT_MAIN_PRESETS.map(
  (p): PhysiologyPreset => ({ id: p.id, title: p.title, brief: p.brief, case: p.case, faults: [], start: "packet", events: p.events, leftMain: p })
);

const CORE_PRESETS: readonly PhysiologyPreset[] = [
  ...PHYSIOLOGY_CASES.map(
    (c): PhysiologyPreset => ({
      id: c.id,
      title: CASE_TITLES[c.id] ?? c.title,
      brief: c.brief,
      case: c,
      faults: [],
      start: "packet",
      // the drift case: the case's drift builds over 45 s after equalisation and then stays (as the lab always modelled it)
      ...(c.drift ? { driftPerS: c.drift / 45, driftCapMmHg: Math.abs(c.drift) } : {}),
    })
  ),
  { id: "fault-no-zero", title: "Pressure-wire set-up 1: mid-LAD lesion", brief: LAD.brief, case: LAD, faults: ["no-zero"], start: "packet" },
  { id: "fault-introducer", title: "Pressure-wire set-up 2: mid-LAD lesion", brief: `${LAD.brief} ${AT_TIP}`, case: LAD, faults: ["introducer"], start: "at-tip" },
  { id: "fault-contrast", title: "Pressure-wire set-up 3: mid-LAD lesion", brief: `${LAD.brief} ${AT_TIP}`, case: LAD, faults: ["contrast"], start: "at-tip" },
  { id: "fault-air-aortic", title: "Pressure-wire set-up 4: mid-LAD lesion", brief: `${LAD.brief} ${AT_TIP}`, case: LAD, faults: ["air-aortic"], start: "at-tip" },
  {
    id: "fault-deep-equalise",
    title: "Pressure-wire set-up 5: proximal LAD lesion",
    brief: `${PROXIMAL_LAD.brief} Your assistant has zeroed and introduced the pressure wire and advanced it; check where the sensor is before you equalise.`,
    case: PROXIMAL_LAD,
    faults: ["deep-equalise"],
    start: "at-tip",
    startSensorMm: 10,
  },
  { id: "fault-offset-waveforms", title: "Pressure-wire set-up 6: mid-LAD lesion", brief: `${LAD.brief} ${AT_TIP}`, case: LAD, faults: ["offset-waveforms"], start: "at-tip" },
  {
    id: "fault-ebu-lcx",
    title: "Pressure-wire set-up 7: mid-LAD lesion in a small woman",
    brief: "58-year-old woman of small build with CCS class II angina. Angiography: 60% mid-LAD stenosis, 12 mm long, in a 3.0 mm vessel. The guide is an EBU 4.0.",
    case: { ...LAD, brief: "58-year-old woman of small build with CCS class II angina. 60% mid-LAD stenosis, 12 mm long, in a 3.0 mm vessel." },
    faults: ["ebu-lcx"],
    start: "packet",
  },
  {
    id: "fault-wire-deformed",
    title: "Pressure-wire set-up 8: mid-LAD lesion",
    brief: `${LAD.brief} A balloon catheter from an earlier attempt is still in the guide.`,
    case: LAD,
    faults: ["wire-deformed"],
    start: "packet",
  },
];

/** The lab's presets: its case menu, its launches and the practice index. */
export const PHYSIOLOGY_PRESETS: readonly PhysiologyPreset[] = [...CORE_PRESETS, ...(HYPERAEMIA_PRESETS_LISTED ? HYPERAEMIA_PRESETS : []), ...LEFT_MAIN_PW_PRESETS];

/** The lab's presets by id (a launch names one of these). */
export const PRESET_BY_ID: Readonly<Record<string, PhysiologyPreset>> = Object.fromEntries(PHYSIOLOGY_PRESETS.map((p) => [p.id, p]));
/** Every preset a session can start from, the unlisted hyperaemia presets included. */
const ANY_PRESET_BY_ID: Readonly<Record<string, PhysiologyPreset>> = Object.fromEntries([...CORE_PRESETS, ...HYPERAEMIA_PRESETS, ...LEFT_MAIN_PW_PRESETS].map((p) => [p.id, p]));

/** A preset by id, listed or not (undefined when unknown). */
export function physiologyPreset(id: string): PhysiologyPreset | undefined {
  return ANY_PRESET_BY_ID[id];
}

// --- state ------------------------------------------------------------------------

/**
 * The hyperaemic agent running. The legacy forms (no detail) keep their time-compressed curves; the
 * detailed ones follow the engine's adenosine model (hyperaemia below). After an infusion or a bolus is
 * stopped the effect washes out from `wash.h`.
 */
export type PwHyperaemia =
  | { mode: "none"; wash?: { t: number; h: number } }
  | { mode: "iv"; t0: number; detail?: PwIvDetail }
  | { mode: "ic"; t0: number; detailed?: boolean }
  | { mode: "contrast"; t0: number };

/** One line of the console log (newest first in PwSessionState.log). */
export interface PwLogEntry {
  t: number;
  label: string;
  value: string;
  /** what the console itself would say (shown in every mode) */
  note?: string;
  /** a teaching note on why: guided practice and the debrief only */
  aid?: string;
  /** the console flags it (a refused action, an out-of-range drift check) */
  bad?: boolean;
}

/** A recorded measurement, with the reasons it cannot be trusted (debrief and guided aids only). */
export interface PwRecord {
  kind: "rest" | "ffr" | "drift-check" | "pullback" | "tmn-rest" | "tmn-hyp";
  /** for an FFR: the agent (contrast FFR has its own cut-off) */
  agent?: "iv" | "ic" | "contrast";
  t: number;
  sensorMm: number;
  pdpa: number;
  wfp: number;
  h: number;
  valid: boolean;
  problems: string[];
  /** the branch of a left main the sensor was in (branched presets only) */
  branch?: string;
}

/** The equalisation in force, and the set-up at the moment it was done. */
export interface PwEqualisation {
  t: number;
  sensorMm: number;
  /** the sensor was within the equalisation window (pressureWire.equaliseValidAt) */
  atTip: boolean;
  /** the waveforms did not superimpose (waveformMismatch) when the means were matched */
  mismatch: boolean;
  rmsMmHg: number;
  introducer: boolean;
  contrast: boolean;
  air: boolean;
  zeroed: boolean;
  h: number;
  wireId: number;
}

export interface PwSessionState {
  presetId: string;
  seed: string;
  /** lab time, s */
  t: number;
  /** the patient's mean aortic pressure (rounded, MP_MAP_STEP) and heart rate, from the engine */
  map: number;
  hr: number;
  rng: RngState;
  /** faults still present (each is removed by its remedy) */
  faults: PwFault[];
  /** the wire: offset (mmHg, everything added to Pd), drift, equalisation (pressureWire.ts) */
  wire: PressureWireState;
  /** wires opened in this study (1 = the first) */
  wireId: number;
  /** where the wire is: in its packet (or withdrawn), or in the guide */
  wireIn: boolean;
  zeroed: boolean;
  /** a zero was attempted with the wire already in the guide (it had to come out) */
  zeroedInBody: boolean;
  /** the wire went into the guide before it had been zeroed */
  introducedUnzeroed: boolean;
  connectionsChecked: boolean;
  introducer: boolean;
  /** a balloon or other device is still in the guide */
  deviceInGuide: boolean;
  wireDeformed: boolean;
  /** the wire was introduced while a device was in the guide */
  introducedPastDevice: boolean;
  /** Pd phase lag of this wire (offset-waveforms) */
  wireLag: number;
  contrastFrac: number;
  airMl: number;
  guideEngaged: boolean;
  guidesChanged: number;
  /** sensor position, mm beyond the guide tip (negative: inside the guide) */
  sensorMm: number;
  /** the wire is in the target vessel or has gone into the side branch at the bifurcation */
  branch: "target" | "side";
  /**
   * The branch of a left main the wire is in, or will be steered into once it passes the bifurcation
   * (a branched preset, physiology-left-main-and-ostial); null for an unbranched vessel.
   */
  lmBranch: string | null;
  /** the last completed pullback in each branch of a left main (branched presets), for comparing the two */
  branchPullbacks: Partial<Record<string, { kind: "FFR" | "resting"; pts: { x: number; ratio: number }[] }>>;
  gtn: boolean;
  hyper: PwHyperaemia;
  eq: PwEqualisation | null;
  pullback: { active: boolean; kind: "FFR" | "resting"; fromMm: number; speedMmS: number; pts: { x: number; ratio: number }[] } | null;
  td: { rest?: number; hyp?: number };
  treated: string[];
  log: PwLogEntry[];
  records: PwRecord[];
  /** set-up events and the lab time they were last raised */
  raised: Partial<Record<LabEvent, number>>;
  disengagedForHyp: boolean;
  /** the actions the operator has taken in this study (types, once each), for the set-up panel's ticks */
  did: PwAction["type"][];
  /** the drift check after the last hyperaemic or resting measurement */
  driftCheck: { t: number; pdpa: number; ok: boolean; atTip: boolean } | null;
  decision: string | null;
  // --- hyperaemia and adenosine (physiology-hyperaemia-and-adenosine) ---
  /** the hyperaemia faults still present (saline-swap goes once the drugs are checked) */
  hyperFaults: PwHyperaemiaFault[];
  /** what the operator has checked: the cannula, the drug labels, caffeine */
  checked: { line: boolean; drug: boolean; caffeine: boolean };
  /** the last injection through the guide */
  inj: PwInjection | null;
  /** every intracoronary adenosine dose given (debrief: dose by vessel, injection speed) */
  icDoses: { t: number; doseUg: number; vessel: string; fast: boolean; engaged: boolean }[];
  /** adenosine given at all (IV or IC, the operator's intention) */
  adenosineGiven: boolean;
  /** bedside orders, oldest first */
  orders: { t: number; order: PwOrder }[];
  /**
   * The defibrillator as its operator sees it: charging since a lab time, or charged. It follows the
   * engine when the lab passes the engine's defibrillator (PwPatientInput.defib), else the engine's
   * charge time (MP_DEFIB.chargeTimeS). A shock or synchronised shock is delivered, and recorded as an
   * order, only when it is charged.
   */
  defib: PwDefib;
  cpr: boolean;
  pacing: boolean;
  /** the monitor's rhythm when the lab passes it, and the arrhythmia episodes seen */
  rhythm: PwRhythm | null;
  arrhythmias: PwArrhythmia[];
  /** the patient's coronary dominance, when the lab's engine has told the study (setUpPwEngine): a dominant circumflex supplies the AV node */
  dominance?: Dominance;
}

export interface PwPatientInput {
  map?: number;
  hr?: number;
  /** the monitor's rhythm (engine vitals rhythmKind and av), for the arrhythmia record of the debrief */
  rhythm?: PwRhythm;
  /** the engine's defibrillator (engine vitals defib): charging, and the energy stored (J, 0 when not charged) */
  defib?: { charging: boolean; charged: number };
}

export type PwAction =
  | { type: "tick"; dt: number; patient?: PwPatientInput }
  | { type: "zero" }
  | { type: "check-connections" }
  | { type: "new-wire" }
  | { type: "remove-device" }
  | { type: "introduce" }
  | { type: "remove-introducer" }
  | { type: "flush-guide" }
  | { type: "flush-aortic-line" }
  | { type: "gtn" }
  | { type: "sensor"; mm: number }
  | { type: "advance"; dmm: number }
  | { type: "equalise" }
  | { type: "change-guide" }
  | { type: "reshape-wire" }
  | { type: "guide"; engaged: boolean }
  | { type: "hyperaemia"; mode: "none" }
  /** IV adenosine; with a rate or a site it follows the engine's model (else the legacy 140 µg/kg/min ramp) */
  | { type: "hyperaemia"; mode: "iv"; rateUgKgMin?: number; site?: PwIvSite }
  /** an IC adenosine bolus; with a dose it follows the engine's model and needs a guide flush (else the legacy curve) */
  | { type: "hyperaemia"; mode: "ic"; doseUg?: number; fast?: boolean }
  /** contrast through the guide for contrast FFR (CONTRAST_FFR_ML by default) */
  | { type: "hyperaemia"; mode: "contrast"; ml?: number }
  | { type: "check-line" }
  | { type: "check-drug" }
  | { type: "ask-caffeine" }
  | { type: "order"; order: PwOrder }
  | { type: "measure-rest" }
  | { type: "measure-ffr" }
  | { type: "pullback" }
  | { type: "drift-check" }
  | { type: "thermo"; state: "rest" | "hyp" }
  | { type: "stent"; lesionId: string }
  /** steer the wire into another branch of a left main (withdrawn to the left main first when it is past the bifurcation) */
  | { type: "branch"; id: string }
  | { type: "decide"; id: string };

const LOG_MAX = 16;
const roundMap = (m: number) => Math.round(m / MP_MAP_STEP) * MP_MAP_STEP;

/** A fresh study of a preset (unknown ids fall back to the first preset). */
export function initialPwSession(presetId: string, seed: string | number = presetId): PwSessionState {
  const p = ANY_PRESET_BY_ID[presetId] ?? PHYSIOLOGY_PRESETS[0];
  const seedStr = String(seed);
  const rng = rngFrom(`pw:${p.id}:${seedStr}`);
  const wire0 = initialPressureWire(rng);
  const wire: PressureWireState = { ...wire0, driftPerS: p.driftPerS ?? wire0.driftPerS };
  const has = (f: PwFault) => p.faults.includes(f);
  const atTip = p.start === "at-tip";
  return {
    presetId: p.id,
    seed: seedStr,
    t: 0,
    map: roundMap(p.case.map),
    hr: HR,
    rng,
    faults: [...p.faults],
    wire: atTip ? wire : { ...wire, offset: wire.offset + normal(rng, 0, MP_UNZEROED_SD_MMHG) },
    wireId: 1,
    wireIn: atTip,
    zeroed: atTip,
    zeroedInBody: false,
    introducedUnzeroed: false,
    connectionsChecked: false,
    introducer: atTip ? has("introducer") : false,
    deviceInGuide: has("wire-deformed"),
    wireDeformed: false,
    introducedPastDevice: false,
    wireLag: has("offset-waveforms") ? MP_WAVE_LAG : 0,
    // after the angiogram the guide holds contrast; an assistant's at-tip set-up has flushed it unless the fault says not
    contrastFrac: atTip && !has("contrast") ? 0 : MP_GUIDE_CONTRAST,
    airMl: has("air-aortic") ? MP_AIR_ML : 0,
    guideEngaged: true,
    guidesChanged: 0,
    sensorMm: atTip ? (p.startSensorMm ?? 0) : -SENSOR_FROM_TIP_MM,
    branch: "target",
    lmBranch: defaultBranchOf(p),
    branchPullbacks: {},
    gtn: false,
    hyper: { mode: "none" },
    eq: null,
    pullback: null,
    td: {},
    treated: [],
    log: [],
    records: [],
    raised: {},
    disengagedForHyp: false,
    did: [],
    driftCheck: null,
    decision: null,
    hyperFaults: [...(p.hyperaemiaFaults ?? [])],
    checked: { line: false, drug: false, caffeine: false },
    inj: null,
    icDoses: [],
    adenosineGiven: false,
    orders: [],
    defib: { chargingSince: null, charged: false },
    cpr: false,
    pacing: false,
    rhythm: null,
    arrhythmias: [],
    ...startBolus(p),
  };
}

/** The branch a study of a branched preset starts in (the model's default), or null for an unbranched vessel. */
function defaultBranchOf(p: PhysiologyPreset): string | null {
  const m = p.leftMain?.model;
  return m ? (m.defaultBranch ?? m.branches[0].id) : null;
}

/** A colleague's bolus at the start of the study (startBolus): given with the guide engaged, not yet flushed. */
function startBolus(p: PhysiologyPreset): Partial<PwSessionState> {
  const b = p.startBolus;
  if (!b) return {};
  const side = vesselSide(p.case.vessel);
  const inj: PwInjection = { t: 0, agent: "adenosine", doseUg: b.doseUg, ml: 0, side, vessel: p.case.vessel, engaged: true, fast: b.fast, parts: [{ t: 0, ug: b.doseUg * (1 - MP_GUIDE_HOLDUP) }], flushedAt: null };
  return { hyper: { mode: "ic", t0: 0, detailed: true }, inj, icDoses: [{ t: 0, doseUg: b.doseUg, vessel: p.case.vessel, fast: b.fast, engaged: true }], adenosineGiven: true };
}

/** The coronary side of a vessel (an intracoronary dose's side). */
export function vesselSide(vessel: string): "left" | "right" {
  return vessel === "RCA" ? "right" : "left";
}

// --- read-outs (pure) ---------------------------------------------------------------

export function sessionPreset(s: PwSessionState): PhysiologyPreset {
  return ANY_PRESET_BY_ID[s.presetId] ?? PHYSIOLOGY_PRESETS[0];
}

// one case object per session state (states are never mutated once returned), so the trace's
// per-sample reads do not build a new case each time
const SESSION_CASE = new WeakMap<PwSessionState, CoronaryCase>();
const MEASURED_CASE = new WeakMap<PwSessionState, CoronaryCase>();

// branch views of the branched presets, by preset, branch, treated lesions and MAP: the same object while
// they are unchanged, so physiology.ts's per-case network cache holds across the model clock's ticks
const BRANCH_VIEWS = new Map<string, CoronaryCase>();

/** The branch view of a branched preset (physiology.ts presetView), memoised; `map` overrides the case's own when given. */
function branchViewOf(p: PhysiologyPreset, branch: string, treated: readonly string[], map?: number): CoronaryCase {
  const key = `${p.id}|${branch}|${treated.join(",")}|${map ?? ""}`;
  let c = BRANCH_VIEWS.get(key);
  if (!c) {
    const v = presetView(p.leftMain!, branch, treated);
    c = map === undefined ? v : { ...v, map };
    if (BRANCH_VIEWS.size > 400) BRANCH_VIEWS.clear();
    BRANCH_VIEWS.set(key, c);
  }
  return c;
}

/** The branch of a left main the study reads, or null (an unbranched vessel). */
function activeBranch(s: PwSessionState, p: PhysiologyPreset = sessionPreset(s)): string | null {
  return p.leftMain?.model && s.lmBranch ? s.lmBranch : null;
}

/**
 * The vessel the wire runs along, as the angiogram shows it before any treatment: the preset's case, or
 * in a branched preset the path ostium, left main, the branch the wire is in (physiology.ts presetView).
 */
export function pathCase(s: PwSessionState): CoronaryCase {
  const p = sessionPreset(s);
  const b = activeBranch(s, p);
  return b ? branchViewOf(p, b, []) : p.case;
}

/** Every lesion of a preset: those of its case, or in a branched preset those of the left main and of every branch. */
export function presetLesions(p: PhysiologyPreset): Lesion[] {
  const m = p.leftMain?.model;
  return m ? [...m.lm.lesions, ...m.branches.flatMap((b) => b.case.lesions)] : [...p.case.lesions];
}

/** The decision is the preset's, or one the case also accepts (physiology.ts CoronaryCase.alsoAccepted). */
export function decisionAccepted(p: PhysiologyPreset, id: string | null): boolean {
  return id !== null && (id === p.case.decision || !!p.case.alsoAccepted?.includes(id as CaseDecision));
}

/** The case as it is now: the preset's lesions less the treated ones, at the patient's MAP (in a branched preset, the active branch's view). */
export function sessionCase(s: PwSessionState): CoronaryCase {
  let c = SESSION_CASE.get(s);
  if (!c) {
    const p = sessionPreset(s);
    const b = activeBranch(s, p);
    if (b) c = branchViewOf(p, b, s.treated, s.map);
    else {
      const base = p.case;
      c = { ...base, map: s.map, lesions: base.lesions.filter((l) => !s.treated.includes(l.id)) };
    }
    SESSION_CASE.set(s, c);
  }
  return c;
}

/** The vessel the sensor is in: the target, or a normal side branch when the wire went the wrong way. */
export function measuredCase(s: PwSessionState): CoronaryCase {
  const c = sessionCase(s);
  if (s.branch !== "side") return c;
  let m = MEASURED_CASE.get(s);
  if (!m) {
    m = { ...c, id: `${c.id}:side-branch`, vessel: c.vessel === "LAD" ? "LCx" : "LAD", lesions: [], diffuse: 0.05 };
    MEASURED_CASE.set(s, m);
  }
  return m;
}

/** Sensor position along the case's vessel, 0 (guide tip, or inside the guide) to 1 (distal end). */
export function sensorX(s: PwSessionState): number {
  const c = pathCase(s);
  return Math.max(0, Math.min(1, s.sensorMm / Math.max(1, c.lengthMm)));
}

/** The patient has had caffeine (a preset fact). */
export function caffeineOf(s: PwSessionState): boolean {
  return !!sessionPreset(s).hyperaemiaFaults?.includes("caffeine");
}

/** IV adenosine at the lower standard rate (140 µg/kg/min) at steady state: the reference for maximal hyperaemia. */
const IV_REF = ivAdenosineSteadyLevel(ADENOSINE.ivStandardUgKgMin);
/** The peak of the lower end of the module's IC dose range of each side (IC_ADENOSINE_MAXIMAL_UG): the reference for maximal hyperaemia. */
const IC_REF: Readonly<Record<"left" | "right", number>> = {
  left: icAdenosinePeakHyperaemia(IC_ADENOSINE_MAXIMAL_UG.left, "left"),
  right: icAdenosinePeakHyperaemia(IC_ADENOSINE_MAXIMAL_UG.right, "right"),
};

/** Steady-state hyperaemia (normalised) of an infusion as given. */
export function ivTargetHyperaemia(d: Pick<PwIvDetail, "rate" | "delivered" | "agent">, caffeine: boolean): number {
  if (d.agent === "saline") return 0;
  return Math.min(1, ivAdenosineSteadyLevel(d.rate, { delivered: d.delivered, caffeine }) / IV_REF);
}

/** Hyperaemia (normalised) of an intracoronary injection at time t: adenosine by the engine's model, contrast by its own curve. */
export function injectionHyperaemia(inj: PwInjection, t: number, caffeine: boolean): number {
  if (inj.agent === "contrast") return contrastHyperaemia(t - inj.t);
  if (inj.agent !== "adenosine") return 0;
  let e = 0;
  for (const p of inj.parts) e += icAdenosineEffectSiteUg(p.ug, inj.side, t - p.t);
  return Math.min(1, icAdenosineHyperaemiaOf(e, inj.side, { caffeine }) / IC_REF[inj.side]);
}

/** Contrast hyperaemia `dt` seconds after the injection (MP_CONTRAST_*). */
export function contrastHyperaemia(dt: number): number {
  if (!(dt > 0)) return 0;
  const rise = 1 - Math.exp(-dt / MP_CONTRAST_RISE_S);
  const fall = dt > MP_CONTRAST_PLATEAU_S ? Math.exp(-(dt - MP_CONTRAST_PLATEAU_S) / MP_CONTRAST_DECAY_S) : 1;
  return MP_CONTRAST_H * rise * fall;
}

/**
 * Hyperaemia fraction now (0 rest, 1 maximal). Detailed agents: the engine's adenosine model (IV: first
 * order towards the steady level of the rate actually delivered, with the sourced time to maximum at the
 * site; IC: the bolus and its flush through the local compartment), or the contrast curve. Legacy
 * agents: the time-compressed IV ramp, or the IC bolus curve of pressureWire.ts.
 */
export function hyperaemia(s: PwSessionState, t = s.t): number {
  const hy = s.hyper;
  if (hy.mode === "none") return hy.wash && t >= hy.wash.t ? hy.wash.h * Math.exp(-(t - hy.wash.t) / MP_ADENOSINE_IV_OFF_TAU_S) : 0;
  const dt = t - hy.t0;
  if (hy.mode === "iv") {
    const d = hy.detail;
    if (!d) return Math.min(1, Math.max(0, dt / MP_IV_RAMP_S));
    const target = ivTargetHyperaemia(d, caffeineOf(s));
    if (dt <= 0) return d.h0;
    return target + (d.h0 - target) * Math.exp(-dt / ivAdenosineTauS(d.site === "central" ? "central" : "peripheral"));
  }
  if (hy.mode === "contrast") return s.inj ? injectionHyperaemia(s.inj, t, false) : contrastHyperaemia(dt);
  if (!hy.detailed || !s.inj) return icAdenosineHyperaemia(dt);
  return injectionHyperaemia(s.inj, t, caffeineOf(s));
}

/** The guide (aortic) pressure artefact of the last injection and its flush now, mmHg (MP_INJECTION_*). */
export function injectionArtefact(s: Pick<PwSessionState, "inj" | "t">, t = s.t): number {
  const inj = s.inj;
  if (!inj) return 0;
  let a = t >= inj.t ? MP_INJECTION_ARTEFACT_MMHG * Math.exp(-(t - inj.t) / MP_INJECTION_TAU_S) : 0;
  const f = inj.flushedAt;
  if (f !== null && t >= f) a += MP_INJECTION_ARTEFACT_MMHG * Math.exp(-(t - f) / MP_INJECTION_TAU_S);
  return a;
}

/** Seconds since the last injection through the guide (the bolus or its flush), or Infinity. */
export function sinceInjection(s: Pick<PwSessionState, "inj" | "t">): number {
  const inj = s.inj;
  if (!inj) return Infinity;
  return s.t - Math.max(inj.t, inj.flushedAt ?? -Infinity);
}

/** A detailed agent (dose, rate or site given) is running. */
function detailed(hy: PwHyperaemia): boolean {
  return (hy.mode === "iv" && !!hy.detail) || (hy.mode === "ic" && !!hy.detailed) || hy.mode === "contrast";
}

/** The aortic (guide) line as set up now: the Transducer's dynamics, and the introducer's leak and lag. */
export interface AorticLine {
  dynamic: Dynamic;
  airMl: number;
  contrastFrac: number;
  leakMmHg: number;
  tauS: number;
}

const LINE_CACHE = new Map<string, Dynamic>();
export function aorticLine(s: Pick<PwSessionState, "airMl" | "contrastFrac" | "introducer">): AorticLine {
  const key = `${s.airMl}|${s.contrastFrac}`;
  let d = LINE_CACHE.get(key);
  if (!d) {
    const tr = new Transducer(DEFAULT_LINE, 0);
    tr.setAir(s.airMl);
    tr.setContrast(s.contrastFrac);
    d = tr.dynamic();
    LINE_CACHE.set(key, d);
  }
  return { dynamic: d, airMl: s.airMl, contrastFrac: s.contrastFrac, leakMmHg: s.introducer ? MP_INTRODUCER_LEAK_MMHG : 0, tauS: s.introducer ? MP_INTRODUCER_TAU_S : 0 };
}

export interface ConsoleReading {
  /** mean aortic (guide) pressure, mean distal (sensor) pressure, mmHg */
  pa: number;
  pd: number;
  pdpa: number;
  /** wave-free (iFR-type) ratio */
  wfp: number;
  q: number;
}

/**
 * What the console reads now, at the sensor's position and the hyperaemia of the moment (or the
 * ones given). With no set-up error on the channels it is physiology.indices(case, x, h, engaged,
 * offset) exactly (pressureWire.measure with 200 samples per cycle, as indices uses).
 */
export function consoleReading(s: PwSessionState, at: { x?: number; h?: number } = {}): ConsoleReading {
  const c = measuredCase(s);
  const x = at.x ?? sensorX(s);
  const h = at.h ?? hyperaemia(s);
  const art = injectionArtefact(s);
  const r = measure(c, x, h, s.wire.offset, s.guideEngaged, { paOffset: -aorticLine(s).leakMmHg + art, pdLagPhase: s.wireLag, n: 200 });
  return { pa: r.pa, pd: r.pd, pdpa: r.pdpa, wfp: r.wfp, q: r.q };
}

const SHAPE_N = 120;
const SHAPE_CACHE = new Map<string, number>();

/** The beat as the console displays it: Pa through the aortic line, Pd from the sensor (both at N phases). */
export function displayedBeat(s: PwSessionState, at: { x?: number; h?: number } = {}): { pa: number[]; pd: number[] } {
  const c = measuredCase(s);
  const x = at.x ?? sensorX(s);
  const h = at.h ?? hyperaemia(s);
  const T = 60 / HR;
  const line = aorticLine(s);
  const pTip: number[] = [];
  const pd: number[] = [];
  for (let i = 0; i < SHAPE_N; i++) {
    const ph = i / SHAPE_N;
    pTip.push(reading(c, ph * T, x, h, s.guideEngaged, 0).pa);
    pd.push(reading(c, (ph - s.wireLag) * T, x, h, s.guideEngaged, s.wire.offset).pd);
  }
  // the aortic line: Transducer chain (air, contrast), then the introducer's leak and lag; settle over 3 beats
  const tr = new Transducer(DEFAULT_LINE, 0);
  tr.setAir(s.airMl);
  tr.setContrast(s.contrastFrac);
  tr.zero();
  const mean = pTip.reduce((a, b) => a + b, 0) / SHAPE_N;
  tr.st.x = mean;
  let lp = mean;
  const dt = 0.00025;
  const beats = 4;
  const steps = Math.round((beats * T) / dt);
  const pa = new Array<number>(SHAPE_N).fill(mean);
  for (let k = 0; k < steps; k++) {
    const t = k * dt;
    const f = ((t / T) % 1) * SHAPE_N;
    const i0 = Math.floor(f) % SHAPE_N;
    const u = pTip[i0] + (pTip[(i0 + 1) % SHAPE_N] - pTip[i0]) * (f - Math.floor(f));
    const y = tr.step(dt, u);
    lp = line.tauS > 0 ? lp + (y - lp) * Math.min(1, dt / line.tauS) : y;
    if (t >= (beats - 1) * T) {
      const j = Math.floor(((t - (beats - 1) * T) / T) * SHAPE_N);
      if (j >= 0 && j < SHAPE_N) pa[j] = lp - line.leakMmHg;
    }
  }
  return { pa, pd };
}

/**
 * RMS difference of the displayed Pa and Pd beat shapes, means removed, mmHg: whether the two
 * waveforms superimpose (Brilakis 12.2: a system can match the means while the waveforms stay apart).
 */
export function waveformRms(s: PwSessionState, at: { x?: number; h?: number } = {}): number {
  const x = at.x ?? sensorX(s);
  const h = at.h ?? hyperaemia(s);
  const c = measuredCase(s);
  const key = JSON.stringify([c.id, s.map, c.lesions, Math.round(x * 200), Math.round(h * 50), s.guideEngaged, s.airMl, s.contrastFrac, s.introducer, s.wireLag]);
  const hit = SHAPE_CACHE.get(key);
  if (hit !== undefined) return hit;
  const { pa, pd } = displayedBeat(s, { x, h });
  const ma = pa.reduce((a, b) => a + b, 0) / SHAPE_N;
  const md = pd.reduce((a, b) => a + b, 0) / SHAPE_N;
  let ss = 0;
  for (let i = 0; i < SHAPE_N; i++) ss += (pa[i] - ma - (pd[i] - md)) ** 2;
  const rms = Math.sqrt(ss / SHAPE_N);
  if (SHAPE_CACHE.size > 400) SHAPE_CACHE.clear();
  SHAPE_CACHE.set(key, rms);
  return rms;
}

/** The waveforms do not superimpose now (the mismatch flag). */
export function waveformMismatch(s: PwSessionState, at: { x?: number; h?: number } = {}): boolean {
  return waveformRms(s, at) > MP_MISMATCH_RMS_MMHG;
}

const GUIDE_CACHE = new Map<string, TipPressureState>();

/**
 * The guide pressure as the operator sees it, in the tip vocabulary: a guide that obstructs the ostium
 * while engaged is classified from the tip pressure against the aortic pressure (transducer.classifyTip);
 * otherwise an overdamped aortic line (air, contrast) or a leaking valve (introducer in) reads damped.
 */
export function guidePressure(s: PwSessionState): TipPressureState {
  const c = sessionCase(s);
  if (c.guideObstructs && s.guideEngaged) {
    const k = obstructedTip(c, s);
    if (k !== "aortic") return k;
  }
  const line = aorticLine(s);
  if (line.dynamic.verdict === "overdamped" || line.tauS > 0) return "damped";
  return "aortic";
}

/** The engaged, obstructing guide's tip classification (memoised on the case, MAP, hyperaemia step and treated lesions). */
function obstructedTip(c: CoronaryCase, s: PwSessionState): TipPressureState {
  const hStep = Math.round(hyperaemia(s) * 50);
  const key = `${c.id}|${s.map}|${hStep}|${s.treated.join()}`;
  const hit = GUIDE_CACHE.get(key);
  if (hit !== undefined) return hit;
  const h = hStep / 50;
  const T = 60 / HR;
  let tipSys = -Infinity,
    tipDia = Infinity,
    aoSys = -Infinity,
    aoDia = Infinity;
  for (let i = 0; i < SHAPE_N; i++) {
    const ph = i / SHAPE_N;
    const p = reading(c, ph * T, 0, h, true, 0).pa;
    const a = aorticPressure(c.map, ph);
    tipSys = Math.max(tipSys, p);
    tipDia = Math.min(tipDia, p);
    aoSys = Math.max(aoSys, a);
    aoDia = Math.min(aoDia, a);
  }
  const k = classifyTip({ location: "ostium" }, tipSys, tipDia, aoSys, aoDia);
  if (GUIDE_CACHE.size > 400) GUIDE_CACHE.clear();
  GUIDE_CACHE.set(key, k);
  return k;
}

/** The wire tip, mm beyond the guide tip. */
export const wireTipMm = (s: Pick<PwSessionState, "sensorMm">) => s.sensorMm + SENSOR_FROM_TIP_MM;

/** Set-up events active now (raised within PW_EVENT_HOLD_S). */
export function activeSetupEvents(s: PwSessionState, t = s.t): LabEvent[] {
  return (Object.keys(s.raised) as LabEvent[]).filter((e) => t - (s.raised[e] ?? -Infinity) <= PW_EVENT_HOLD_S);
}

/** Everything that makes a reading untrustworthy now (for the debrief and guided aids). */
export function readingProblems(s: PwSessionState, kind: PwRecord["kind"]): string[] {
  const out: string[] = [];
  const c = sessionCase(s);
  const h = hyperaemia(s);
  const x = sensorX(s);
  if (!s.zeroed) out.push("the wire was never zeroed");
  if (!s.eq) out.push("the wire was not equalised");
  else {
    if (!s.eq.atTip) out.push(`equalised with the sensor ${s.eq.sensorMm > EQUALISE_MAX_MM ? `${Math.round(s.eq.sensorMm)} mm into the vessel` : "inside the guide"}, not at the guide tip`);
    if (s.eq.mismatch) out.push("equalised while the waveforms did not superimpose");
    if (s.eq.h > MP_REST_H) out.push("equalised during hyperaemia");
    if (s.eq.wireId !== s.wireId) out.push("the wire in use was never equalised");
  }
  const line = aorticLine(s);
  if (line.leakMmHg > 0) out.push("the introducer is in the haemostatic valve");
  if (s.contrastFrac > 0) out.push("contrast in the guide");
  if (s.airMl > 0) out.push("air in the aortic line");
  if (s.wireLag > 0) out.push("the Pd and Pa waveforms are offset (a faulty wire)");
  if (s.branch === "side") out.push("the wire is in the side branch, not the target vessel");
  const deepest = Math.max(0, ...c.lesions.map((l) => l.pos));
  // a drift check is taken at the guide tip and a pullback ends there: neither is a distal reading
  if (kind !== "drift-check" && kind !== "pullback" && c.lesions.length && x < deepest + MP_DISTAL_MARGIN) out.push("the sensor is not distal to every lesion");
  if (kind === "ffr") {
    const contrastFfr = s.hyper.mode === "contrast";
    if (!contrastFfr && h < MP_SUBMAXIMAL_H) {
      out.push("submaximal hyperaemia");
      out.push(...hyperaemiaCauses(s));
    }
    if (s.guideEngaged && c.guideObstructs) out.push("the guide damps the aortic pressure while engaged");
    const inj = s.inj;
    if (inj && (s.hyper.mode === "ic" || s.hyper.mode === "contrast") && detailed(s.hyper)) {
      if (inj.agent !== "contrast" && inj.flushedAt === null) out.push("read early: the guide was not flushed after the intracoronary bolus");
      else if (sinceInjection(s) < MP_INJECTION_RECOVERY_S) out.push("read early: the guide trace had not recovered from the injection");
    }
    // contrast FFR is read during the contrast effect: before it has built, or after it has passed (the resting Pd/Pa), it is not one
    if (contrastFfr && h < MP_CONTRAST_H * MP_CONTRAST_READ_FRAC && sinceInjection(s) >= MP_INJECTION_RECOVERY_S) {
      const dt = inj ? s.t - inj.t : s.hyper.mode === "contrast" ? s.t - s.hyper.t0 : Infinity;
      out.push(dt > MP_CONTRAST_PLATEAU_S ? "read after the contrast effect had passed" : "read early: the contrast effect had not built up");
    }
  }
  if (kind === "rest" && h > MP_REST_H) out.push("hyperaemia was still active");
  return out;
}

/** Why hyperaemia is short of maximal now, as far as the study knows (debrief and guided aids only). */
export function hyperaemiaCauses(s: PwSessionState): string[] {
  const out: string[] = [];
  const hy = s.hyper;
  if (hy.mode === "iv" && hy.detail) {
    const d = hy.detail;
    if (d.agent === "saline") out.push("saline was given instead of adenosine");
    if (d.delivered < 1) out.push("the infusion ran into a tissued hand-vein cannula");
    if (d.agent === "adenosine" && d.rate < IV_ADENOSINE_UG_KG_MIN.low) out.push("a very low infusion rate");
    if (s.t - hy.t0 < IV_READ_AFTER_S) out.push("read before the infusion had run for a minute");
  }
  if (hy.mode === "ic" && hy.detailed && s.inj) {
    const inj = s.inj;
    if (inj.agent === "saline") out.push("saline was given instead of adenosine");
    if (!inj.engaged) out.push("the guide was disengaged when the bolus was given");
    if (inj.agent === "adenosine" && inj.doseUg < IC_ADENOSINE_MAXIMAL_UG[inj.side]) out.push("an intracoronary dose below the usual range");
  }
  if (caffeineOf(s) && s.adenosineGiven) out.push("recent caffeine blunts adenosine");
  return out;
}

/** Short names of the bedside orders for the log. */
const ORDER_LABEL: Record<PwOrder, string> = {
  cough: "Cough hard, please",
  wait: "Waiting and watching the monitor",
  "cpr-start": "CPR started",
  "cpr-stop": "CPR stopped",
  "pace-on": `Temporary pacing on, ${MP_PACING_RATE_BPM}/min`,
  "pace-off": "Temporary pacing off",
  charge: "Defibrillator charging",
  clear: "Stand clear",
  shock: "Shock delivered",
  cardiovert: "Synchronised shock delivered",
};

/** The arrhythmia the monitor shows now, in the debrief's terms. */
function arrhythmiaOf(r: PwRhythm | null | undefined): PwArrhythmia["kind"] | null {
  if (!r) return null;
  if (r.kind === "vf") return "vf";
  if (r.kind === "af") return "af";
  if (r.av === 3) return "av-block";
  return null;
}

// --- reducer -----------------------------------------------------------------------

function log(s: PwSessionState, e: Omit<PwLogEntry, "t">): PwSessionState {
  return { ...s, log: [{ t: s.t, ...e }, ...s.log].slice(0, LOG_MAX) };
}

function raise(s: PwSessionState, e: LabEvent): PwSessionState {
  return { ...s, raised: { ...s.raised, [e]: s.t } };
}

function withoutFault(s: PwSessionState, f: PwFault): PwFault[] {
  return s.faults.filter((x) => x !== f);
}

/** Move the sensor to `mm`, honouring the guide, a deformed tip, and the bifurcation. */
function moveSensor(s0: PwSessionState, mm: number): PwSessionState {
  let s = s0;
  if (!s.wireIn) return s;
  const c = pathCase(s);
  let target = Math.max(-SENSOR_FROM_TIP_MM, Math.min(c.lengthMm, mm));
  // a deformed tip will not steer across the first lesion
  if (s.wireDeformed && target > s.sensorMm) {
    const first = Math.min(...c.lesions.map((l) => (l.pos - l.lengthMm / c.lengthMm / 2) * c.lengthMm));
    const stopTip = Number.isFinite(first) ? first : c.lengthMm;
    if (target + SENSOR_FROM_TIP_MM > stopTip) {
      target = Math.min(target, stopTip - SENSOR_FROM_TIP_MM);
      s = raise(log(s, { label: "Wire", value: "will not cross", note: "the tip buckles at the lesion and does not steer", bad: true }), "wire-not-crossing");
    }
  }
  const tipBefore = wireTipMm(s);
  const tipAfter = target + SENSOR_FROM_TIP_MM;
  let branch = s.branch;
  if (tipAfter <= MP_LM_LENGTH_MM) branch = "target";
  else if (tipBefore <= MP_LM_LENGTH_MM && s.faults.includes("ebu-lcx")) branch = "side";
  s = { ...s, sensorMm: target, branch };
  if (branch === "side" && s0.branch !== "side") s = log(raise(s, "wire-side-branch"), { label: "Wire", value: "circumflex", note: "the wire has gone into the circumflex, not the LAD", bad: true });
  return s;
}

/**
 * Steer the wire into another branch of a left main. A wire whose tip is past the bifurcation is first
 * withdrawn until the tip is back in the left main (the sensor 3 cm behind it), then the operator advances
 * it again; the equalisation stands. Refused while a pullback runs.
 */
function steerBranch(s: PwSessionState, id: string): PwSessionState {
  const p = sessionPreset(s);
  const m = p.leftMain?.model;
  const to = p.leftMain?.branches.find((b) => b.id === id);
  if (!m || !to || s.lmBranch === id) return s;
  if (s.pullback?.active) return log(s, { label: "Wire", value: "pullback running", note: "finish the pullback before steering into the other branch", bad: true });
  const n: PwSessionState = { ...s, lmBranch: id, pullback: null };
  if (!s.wireIn) return log(n, { label: "Wire", value: `for the ${to.label}`, note: `it will be steered into the ${to.label} at the bifurcation` });
  const lmMm = m.lm.lengthMm;
  const back = wireTipMm(s) > lmMm;
  return log(
    { ...n, sensorMm: back ? Math.min(s.sensorMm, lmMm - SENSOR_FROM_TIP_MM) : s.sensorMm },
    { label: "Wire", value: `steered into the ${to.label}`, note: back ? "withdrawn to the left main first; advance it again" : `it will enter the ${to.label} at the bifurcation` }
  );
}

/** Remove the wire from the guide (to zero it, to change the guide or for a new wire). */
function withdrawWire(s: PwSessionState): PwSessionState {
  const did = s.did.filter((t) => t !== "remove-introducer" && t !== "equalise");
  return { ...s, did, wireIn: false, introducer: false, sensorMm: -SENSOR_FROM_TIP_MM, branch: "target", eq: null, pullback: null, wire: { ...s.wire, equalised: false, equalisedAt: null } };
}

/** An intracoronary adenosine bolus of `doseUg` (or the saline drawn up as it), slow or a fast push, through the guide. */
function giveIc(s: PwSessionState, doseUg: number, fast: boolean): PwSessionState {
  if (!(doseUg > 0) || !Number.isFinite(doseUg)) return log(s, { label: "Adenosine", value: "no dose", note: "enter the intracoronary dose in µg", bad: true });
  const c = sessionPreset(s).case;
  const side = vesselSide(c.vessel);
  const agent = s.hyperFaults.includes("saline-swap") ? "saline" : "adenosine";
  // what reaches the artery now: the bolus less what stays in the guide, or little of it with the guide disengaged
  const now = agent === "adenosine" ? doseUg * (1 - MP_GUIDE_HOLDUP) * (s.guideEngaged ? 1 : MP_DISENGAGED_DELIVERY) : 0;
  const inj: PwInjection = { t: s.t, agent, doseUg, ml: 0, side, vessel: c.vessel, engaged: s.guideEngaged, fast, parts: [{ t: s.t, ug: now }], flushedAt: null };
  const n: PwSessionState = {
    ...s,
    hyper: { mode: "ic", t0: s.t, detailed: true },
    inj,
    adenosineGiven: true,
    icDoses: [...s.icDoses, { t: s.t, doseUg, vessel: c.vessel, fast, engaged: s.guideEngaged }],
  };
  return log(n, { label: "Adenosine", value: `IC bolus ${Math.round(doseUg)} µg`, note: `${fast ? "fast push" : "slow injection"} into the ${c.vessel}${s.guideEngaged ? "" : " (guide disengaged)"}` });
}

/** Contrast through the guide for contrast FFR. */
function giveContrast(s: PwSessionState, ml: number): PwSessionState {
  const v = ml > 0 && Number.isFinite(ml) ? ml : CONTRAST_FFR_ML;
  const c = sessionPreset(s).case;
  const inj: PwInjection = { t: s.t, agent: "contrast", doseUg: 0, ml: v, side: vesselSide(c.vessel), vessel: c.vessel, engaged: s.guideEngaged, fast: false, parts: [], flushedAt: null };
  return log({ ...s, hyper: { mode: "contrast", t0: s.t }, inj }, { label: "Contrast", value: `${v} mL through the guide`, note: "for contrast FFR" });
}

/** Start (or change) IV adenosine at a rate through a site; the effect carries on from where it is. */
function startIv(s: PwSessionState, rate: number, site: PwIvSite): PwSessionState {
  if (!(rate > 0) || !Number.isFinite(rate)) return log(s, { label: "Adenosine", value: "no rate", note: "enter the infusion rate in µg/kg/min", bad: true });
  const hy = s.hyper;
  const h0 = (hy.mode === "iv" && hy.detail) || hy.mode === "none" ? hyperaemia(s) : 0;
  const agent = s.hyperFaults.includes("saline-swap") ? "saline" : "adenosine";
  const delivered = site === "hand" && s.hyperFaults.includes("tissued-line") ? MP_TISSUED_DELIVERED : 1;
  const label = PW_IV_SITES.find((x) => x.id === site)?.label ?? site;
  return log({ ...s, hyper: { mode: "iv", t0: s.t, detail: { rate, site, delivered, agent, h0 } }, adenosineGiven: true }, { label: "Adenosine", value: `IV infusion ${Math.round(rate)} µg/kg/min`, note: label.toLowerCase() });
}

/** The monitor shows a rhythm with no R wave for a synchronised shock (the engine's cardiovert delivers nothing then). */
function noRWave(r: PwRhythm | null): boolean {
  return r !== null && (r.kind === "vf" || r.kind === "asystole");
}

/**
 * A bedside order: logged, and given to the patient engine by applyPwActionToEngine. A shock or a
 * synchronised shock before the defibrillator has charged delivers nothing, as the engine's does: it is
 * logged as not delivered and not recorded as an order. A synchronised shock with no R wave on the
 * monitor (VF, asystole) delivers nothing either and the charge is kept.
 */
function order(s: PwSessionState, o: PwOrder): PwSessionState {
  if ((o === "shock" || o === "cardiovert") && !s.defib.charged)
    return log(s, { label: "Order", value: "Not charged: no shock delivered", note: "the defibrillator had not finished charging", bad: true });
  if (o === "cardiovert" && noRWave(s.rhythm))
    return log(s, { label: "Order", value: "No synchronised shock delivered", note: "there is no R wave to synchronise to; the charge is kept", bad: true });
  let n: PwSessionState = { ...s, orders: [...s.orders, { t: s.t, order: o }] };
  if (o === "charge") n = { ...n, defib: { ...n.defib, chargingSince: n.t } };
  if (o === "shock" || o === "cardiovert") n = { ...n, defib: { ...n.defib, charged: false } };
  if (o === "cpr-start") n = { ...n, cpr: true };
  if (o === "cpr-stop") n = { ...n, cpr: false };
  if (o === "pace-on") n = { ...n, pacing: true };
  if (o === "pace-off") n = { ...n, pacing: false };
  return log(n, { label: "Order", value: ORDER_LABEL[o] });
}

/**
 * The reducer. An action counts as done (PwSessionState.did, the set-up panel's ticks) only when it
 * changed the study and was not refused: a refusal logs a `bad` entry (an out-of-range drift check
 * is bad too, but the check was done).
 */
export function pwSessionReducer(s: PwSessionState, a: PwAction): PwSessionState {
  const n = reduce(s, a);
  if (a.type === "tick" || n === s || n.did.includes(a.type)) return n;
  const refused = n.log[0] !== undefined && n.log[0] !== s.log[0] && !!n.log[0].bad && a.type !== "drift-check";
  if (refused) return n;
  return { ...n, did: [...n.did, a.type] };
}

function reduce(s: PwSessionState, a: PwAction): PwSessionState {
  switch (a.type) {
    case "tick": {
      const dt = Math.max(0, a.dt);
      let wire = stepPressureWire(s.wire, dt);
      const cap = s.wireId === 1 ? sessionPreset(s).driftCapMmHg : undefined;
      if (cap !== undefined) {
        // the drift since the last equalisation stops at the preset's cap
        const lim = (v: number) => Math.max(-cap, Math.min(cap, v));
        wire = { ...wire, offset: s.wire.offset + lim(s.wire.driftPerS * wire.sinceEqualiseS) - lim(s.wire.driftPerS * s.wire.sinceEqualiseS) };
      }
      let n: PwSessionState = { ...s, t: s.t + dt, wire };
      if (a.patient?.map !== undefined && Number.isFinite(a.patient.map)) n.map = roundMap(a.patient.map);
      if (a.patient?.hr !== undefined && Number.isFinite(a.patient.hr)) n.hr = a.patient.hr;
      if (a.patient?.rhythm) {
        const was = arrhythmiaOf(s.rhythm);
        const now = arrhythmiaOf(a.patient.rhythm);
        n.rhythm = { ...a.patient.rhythm };
        if (now !== was) {
          const arr = n.arrhythmias.map((x) => (x.end === null && x.kind === was ? { ...x, end: n.t } : x));
          n.arrhythmias = now ? [...arr, { kind: now, t: n.t, end: null }] : arr;
        }
      }
      // the defibrillator: the engine's when the lab passes it, else the engine's charge time
      const pd = a.patient?.defib;
      if (pd) {
        const charged = pd.charged > 0;
        const chargingSince = pd.charging ? (s.defib.chargingSince ?? n.t) : null;
        if (charged !== s.defib.charged || chargingSince !== s.defib.chargingSince) n.defib = { charged, chargingSince };
      } else if (s.defib.chargingSince !== null && n.t - s.defib.chargingSince >= MP_DEFIB.chargeTimeS - 1e-6) n.defib = { charged: true, chargingSince: null };
      if (n.pullback?.active) {
        const pb = n.pullback;
        const mm = Math.max(0, n.sensorMm - pb.speedMmS * dt);
        n = moveSensor(n, mm);
        const r = consoleReading(n);
        const pts = [...pb.pts, { x: sensorX(n), ratio: pb.kind === "FFR" ? r.pdpa : r.wfp }];
        n = { ...n, pullback: { ...pb, pts, active: mm > 0 } };
        if (mm <= 0) {
          n = log(n, { label: `${pb.kind === "FFR" ? "Hyperaemic" : "Resting"} pullback`, value: "done", note: "read the steps on the curve" });
          const problems = readingProblems(n, "pullback");
          const b = activeBranch(n);
          n = { ...n, records: [...n.records, { kind: "pullback", t: n.t, sensorMm: n.sensorMm, pdpa: r.pdpa, wfp: r.wfp, h: hyperaemia(n), valid: problems.length === 0, problems, ...(b ? { branch: b } : {}) }] };
          if (b) n = { ...n, branchPullbacks: { ...n.branchPullbacks, [b]: { kind: pb.kind, pts } } };
        }
      }
      if (n.branch === "side" && n.wireIn) n = raise(n, "wire-side-branch");
      if (n.wireIn && guidePressure(n) !== "aortic") n = raise(n, "pressure-damped");
      return n;
    }
    case "zero": {
      if (s.wireIn) {
        const out = withdrawWire(s);
        return log({ ...out, zeroedInBody: true }, { label: "Zero", value: "wire withdrawn", note: "the wire must come out of the guide to be zeroed outside the body", bad: true });
      }
      if (s.faults.includes("no-zero") && !s.connectionsChecked) return log(s, { label: "Zero", value: "failed", note: "the console will not zero the wire", bad: true });
      if (s.zeroed) return log(s, { label: "Zero", value: "already zeroed" });
      const rng = { ...s.rng };
      const offset = normal(rng, 0, MP_ZERO_OFFSET_SD_MMHG);
      return log({ ...s, rng, zeroed: true, wire: { ...s.wire, offset } }, { label: "Zero", value: "zeroed outside the body" });
    }
    case "check-connections": {
      const loose = s.faults.includes("no-zero") && !s.connectionsChecked;
      const n = { ...s, connectionsChecked: true, faults: loose ? withoutFault(s, "no-zero") : s.faults };
      return log(n, { label: "Connections", value: loose ? "one was loose: secured" : "all tight" });
    }
    case "new-wire": {
      const out = withdrawWire(s);
      const rng = { ...s.rng };
      const offset = normal(rng, 0, MP_UNZEROED_SD_MMHG);
      const driftPerS = normal(rng, 0, MP_DRIFT_SD);
      const faults = out.faults.filter((f) => f !== "offset-waveforms");
      return log(
        { ...out, rng, faults, wireId: s.wireId + 1, zeroed: false, wireDeformed: false, wireLag: 0, wire: { ...out.wire, offset, driftPerS, sinceEqualiseS: 0, equalised: false, equalisedAt: null } },
        { label: "Wire", value: "new pressure wire opened", note: "flush and zero it outside the body" }
      );
    }
    case "remove-device":
      if (!s.deviceInGuide) return s;
      return log({ ...s, deviceInGuide: false, faults: s.wireDeformed ? s.faults : withoutFault(s, "wire-deformed") }, { label: "Guide", value: "balloon removed" });
    case "introduce": {
      if (s.wireIn) return s;
      const deformed = s.deviceInGuide;
      const n: PwSessionState = {
        ...s,
        // the introducer goes back in with the wire, whatever was ticked before
        did: s.did.filter((t) => t !== "remove-introducer"),
        wireIn: true,
        introducer: true,
        sensorMm: -SENSOR_FROM_TIP_MM,
        branch: "target",
        introducedUnzeroed: s.introducedUnzeroed || !s.zeroed,
        wireDeformed: s.wireDeformed || deformed,
        introducedPastDevice: s.introducedPastDevice || deformed,
      };
      return log(n, { label: "Wire", value: "introduced", note: "through the valve with the introducer; the tip is at the guide tip" });
    }
    case "remove-introducer":
      if (!s.wireIn) return log(s, { label: "Introducer", value: "no wire in the guide", bad: true });
      if (!s.introducer) return log(s, { label: "Introducer", value: "not in the valve", bad: true });
      return log({ ...s, introducer: false, faults: withoutFault(s, "introducer") }, { label: "Introducer", value: "removed from the valve" });
    case "flush-guide": {
      let n: PwSessionState = { ...s, contrastFrac: 0, faults: withoutFault(s, "contrast") };
      const inj = s.inj;
      if (inj && inj.flushedAt === null && inj.agent !== "contrast") {
        // the flush carries the rest of the bolus out of the guide (Brilakis: so the whole dose reaches the artery)
        const ug = inj.agent === "adenosine" ? inj.doseUg * MP_GUIDE_HOLDUP * (s.guideEngaged ? 1 : MP_DISENGAGED_DELIVERY) : 0;
        n = { ...n, inj: { ...inj, flushedAt: s.t, parts: [...inj.parts, { t: s.t, ug }] } };
      }
      return log(n, { label: "Guide", value: "flushed with saline" });
    }
    case "flush-aortic-line":
      return log({ ...s, airMl: 0, faults: withoutFault(s, "air-aortic") }, { label: "Aortic line", value: "flushed and zeroed" });
    case "gtn":
      return log({ ...s, gtn: true }, { label: "Nitrate", value: "intracoronary nitrate given" });
    case "sensor":
      if (s.pullback?.active) return s;
      return moveSensor(s, a.mm);
    case "advance":
      if (s.pullback?.active) return s;
      return moveSensor(s, s.sensorMm + a.dmm);
    case "equalise": {
      if (!s.wireIn) return log(s, { label: "Equalise", value: "no wire", note: "the wire is not in the guide", bad: true });
      if (!s.zeroed) return log(s, { label: "Equalise", value: "refused", note: "the wire has not been zeroed", bad: true });
      const r = consoleReading(s);
      const rms = waveformRms(s);
      const eq: PwEqualisation = {
        t: s.t,
        sensorMm: s.sensorMm,
        atTip: equaliseValidAt(s.sensorMm),
        mismatch: rms > MP_MISMATCH_RMS_MMHG,
        rmsMmHg: rms,
        introducer: s.introducer,
        contrast: s.contrastFrac > 0,
        air: s.airMl > 0,
        zeroed: s.zeroed,
        h: hyperaemia(s),
        wireId: s.wireId,
      };
      const wire: PressureWireState = { ...s.wire, equalised: true, offset: s.wire.offset - (r.pd - r.pa), sinceEqualiseS: 0, equalisedAt: s.sensorMm };
      const aid = !eq.atTip ? "the sensor is not at the guide tip" : eq.mismatch ? "the means match but the waveforms do not superimpose" : undefined;
      return log({ ...s, wire, eq }, { label: "Equalise", value: "Pd/Pa 1.00", ...(aid ? { aid } : {}) });
    }
    case "change-guide": {
      const out = withdrawWire(s);
      return log(
        { ...out, did: out.did.filter((t) => t !== "flush-guide"), faults: withoutFault(out, "ebu-lcx"), guidesChanged: s.guidesChanged + 1, contrastFrac: MP_GUIDE_CONTRAST, guideEngaged: true },
        { label: "Guide", value: "changed to a better-fitting guide", note: "wire withdrawn; re-engaged with a test injection" }
      );
    }
    case "reshape-wire": {
      if (s.wireDeformed) return log(s, { label: "Wire", value: "cannot be reshaped", note: "the tip is kinked at the sensor region: open a new wire", bad: true });
      return log(s, { label: "Wire", value: "tip reshaped" });
    }
    case "guide": {
      if (s.guideEngaged === a.engaged) return s;
      return log({ ...s, guideEngaged: a.engaged }, { label: "Guide", value: a.engaged ? "re-engaged" : "disengaged slightly" });
    }
    case "hyperaemia": {
      if (a.mode === "none") {
        if (s.hyper.mode === "none") return s;
        const wash = detailed(s.hyper) ? { wash: { t: s.t, h: hyperaemia(s) } } : {};
        return log({ ...s, hyper: { mode: "none", ...wash } }, { label: s.hyper.mode === "contrast" ? "Contrast" : "Adenosine", value: "stopped" });
      }
      if (a.mode === "ic") {
        if (a.doseUg === undefined && a.fast === undefined) return log({ ...s, hyper: { mode: "ic", t0: s.t } }, { label: "Adenosine", value: "IC bolus" });
        return giveIc(s, a.doseUg ?? NaN, !!a.fast);
      }
      if (a.mode === "contrast") return giveContrast(s, a.ml ?? CONTRAST_FFR_ML);
      if (a.rateUgKgMin === undefined && a.site === undefined)
        // 140 µg/kg/min: the lower end of the IV range, lesson pm-physiology-indices (140-180 µg/kg/min)
        return log({ ...s, hyper: { mode: "iv", t0: s.t } }, { label: "Adenosine", value: "IV infusion 140 µg/kg/min" });
      return startIv(s, a.rateUgKgMin ?? ADENOSINE.ivStandardUgKgMin, a.site ?? "hand");
    }
    case "check-line": {
      const hy = s.hyper;
      const site = hy.mode === "iv" && hy.detail ? hy.detail.site : "hand";
      const tissued = site === "hand" && s.hyperFaults.includes("tissued-line");
      const n = { ...s, checked: { ...s.checked, line: true } };
      if (site !== "hand") return log(n, { label: "IV line", value: "flushes freely", note: "no swelling at the site" });
      // the console states what is seen; the judgement on the site is a teaching aid (guided practice and debrief)
      if (tissued) return log(n, { label: "IV line", value: "tissued", note: "the back of the hand is swollen around the cannula", aid: "the infusion is running into the tissues: give adenosine through a large or central vein" });
      return log(n, { label: "IV line", value: "flushes freely", note: "a cannula in a small hand vein", aid: "a small hand vein is a poor site for adenosine: a large or central vein is better" });
    }
    case "check-drug": {
      const swapped = s.hyperFaults.includes("saline-swap");
      const n = { ...s, checked: { ...s.checked, drug: true }, hyperFaults: s.hyperFaults.filter((f) => f !== "saline-swap") };
      return log(n, { label: "Drug check", value: swapped ? "saline, not adenosine" : "adenosine, as labelled", ...(swapped ? { note: "the syringe and the bag held saline: adenosine drawn up again; give it again" } : {}) });
    }
    case "ask-caffeine": {
      const had = caffeineOf(s);
      return log({ ...s, checked: { ...s.checked, caffeine: true } }, { label: "Patient", value: had ? "coffee this morning" : "no caffeine today" });
    }
    case "order":
      return order(s, a.order);
    case "measure-rest": {
      if (!s.wireIn) return log(s, { label: "Resting indices", value: "no wire", bad: true });
      const r = consoleReading(s);
      const problems = readingProblems(s, "rest");
      const b = activeBranch(s);
      const rec: PwRecord = { kind: "rest", t: s.t, sensorMm: s.sensorMm, pdpa: r.pdpa, wfp: r.wfp, h: hyperaemia(s), valid: problems.length === 0, problems, ...(b ? { branch: b } : {}) };
      let n: PwSessionState = { ...s, records: [...s.records, rec], driftCheck: null };
      n = log(n, { label: "Wave-free ratio (iFR-type)", value: r.wfp.toFixed(2), note: `threshold ≤ ${CUTOFF.nhpr}`, ...(problems.length ? { aid: problems.join(" · ") } : {}) });
      return log(n, { label: "Resting Pd/Pa", value: r.pdpa.toFixed(2), note: `threshold ≤ ${CUTOFF.pdpa}` });
    }
    case "measure-ffr": {
      if (!s.wireIn) return log(s, { label: "FFR", value: "no wire", bad: true });
      const h = hyperaemia(s);
      // a console cannot tell whether the drug worked: only "no agent running" is refused (the legacy curves refuse once they have worn off)
      if (s.hyper.mode === "none" || (!detailed(s.hyper) && h < MP_REST_H)) return log(s, { label: "FFR", value: "no adenosine", note: "no hyperaemic agent is running", bad: true });
      const r = consoleReading(s);
      const problems = readingProblems(s, "ffr");
      const agent = s.hyper.mode;
      const b = activeBranch(s);
      const rec: PwRecord = { kind: "ffr", agent, t: s.t, sensorMm: s.sensorMm, pdpa: r.pdpa, wfp: r.wfp, h, valid: problems.length === 0, problems, ...(b ? { branch: b } : {}) };
      const n: PwSessionState = { ...s, records: [...s.records, rec], driftCheck: null, disengagedForHyp: s.disengagedForHyp || !s.guideEngaged };
      if (agent === "contrast") return log(n, { label: "Contrast FFR", value: r.pdpa.toFixed(2), note: `threshold ≤ ${CONTRAST_FFR_CUTOFF}`, ...(problems.length ? { aid: problems.join(" · ") } : {}) });
      return log(n, { label: `FFR (${agent === "ic" ? "IC bolus" : "IV infusion"})`, value: r.pdpa.toFixed(2), note: `threshold ≤ ${CUTOFF.ffr}`, ...(problems.length ? { aid: problems.join(" · ") } : {}) });
    }
    case "pullback": {
      if (!s.wireIn || s.sensorMm <= 0) return log(s, { label: "Pullback", value: "nothing to pull back", note: "the sensor is at the guide tip", bad: true });
      const h = hyperaemia(s);
      if ((s.hyper.mode === "ic" || s.hyper.mode === "contrast") && (h > MP_REST_H || detailed(s.hyper))) return log(s, { label: "Pullback", value: "not now", note: "an IC bolus does not last long enough; use IV adenosine or a resting index", bad: true });
      const ivDetail = s.hyper.mode === "iv" && !!s.hyper.detail;
      // a detailed infusion: the console knows only how long it has run (Brilakis reads 1-3 minutes after starting)
      if (s.hyper.mode === "iv" && (ivDetail ? s.t - s.hyper.t0 < IV_READ_AFTER_S : h < MP_MAX_H)) return log(s, { label: "Pullback", value: "wait", note: "hyperaemia not yet at steady state", bad: true });
      const kind = ivDetail || h > MP_PULLBACK_FFR_H ? "FFR" : "resting";
      const r = consoleReading(s);
      return { ...s, pullback: { active: true, kind, fromMm: s.sensorMm, speedMmS: s.sensorMm / MP_PULLBACK_S, pts: [{ x: sensorX(s), ratio: kind === "FFR" ? r.pdpa : r.wfp }] } };
    }
    case "drift-check": {
      if (!s.wireIn) return log(s, { label: "Drift check", value: "no wire", bad: true });
      if (!equaliseValidAt(s.sensorMm)) return log(s, { label: "Drift check", value: "move sensor", note: "pull the sensor back to the guide tip first", bad: true });
      if (!detailed(s.hyper) && hyperaemia(s) > MP_REST_H) return log(s, { label: "Drift check", value: "wait", note: "check at rest", bad: true });
      const r = consoleReading(s);
      const ok = Math.abs(r.pdpa - 1) <= CUTOFF.drift;
      const problems = ok ? [] : ["Pd/Pa at the guide tip outside 0.98-1.02"];
      const n: PwSessionState = { ...s, driftCheck: { t: s.t, pdpa: r.pdpa, ok, atTip: true }, records: [...s.records, { kind: "drift-check", t: s.t, sensorMm: s.sensorMm, pdpa: r.pdpa, wfp: r.wfp, h: 0, valid: ok, problems }] };
      return log(n, { label: "Pd/Pa at guide tip", value: r.pdpa.toFixed(2), note: ok ? "within 0.98-1.02" : "outside 0.98-1.02: re-equalise and repeat", bad: !ok });
    }
    case "thermo": {
      const h = hyperaemia(s);
      if (!s.wireIn || sensorX(s) < MP_THERMO_DISTAL_X) return log(s, { label: "Thermodilution", value: "move sensor", note: "position the sensor in the distal vessel", bad: true });
      const ivSteady = s.hyper.mode === "iv" && (s.hyper.detail ? s.t - s.hyper.t0 >= IV_READ_AFTER_S : h >= MP_MAX_H);
      if (a.state === "hyp" && !ivSteady) return log(s, { label: "Thermodilution", value: "wait", note: "needs steady IV hyperaemia", bad: true });
      if (a.state === "rest" && h > MP_REST_H) return log(s, { label: "Thermodilution", value: "wait", note: "needs resting conditions", bad: true });
      const td = thermodilution(measuredCase(s));
      const v = a.state === "rest" ? td.tmnRest : td.tmnHyp;
      const n: PwSessionState = { ...s, td: { ...s.td, [a.state]: v } };
      return log(n, { label: `Tmn (${a.state === "rest" ? "rest" : "hyperaemia"})`, value: `${v.toFixed(2)} s`, note: "mean of 3 × 3 mL saline injections" });
    }
    case "stent": {
      if (s.treated.includes(a.lesionId)) return s;
      const name = presetLesions(sessionPreset(s)).find((l) => l.id === a.lesionId)?.label ?? a.lesionId;
      return log({ ...s, treated: [...s.treated, a.lesionId], records: [], driftCheck: null, branchPullbacks: {} }, { label: "Stent", value: `${name} lesion stented`, note: "re-measure" });
    }
    case "branch":
      return steerBranch(s, a.id);
    case "decide":
      if (s.decision) return s;
      return { ...s, decision: a.id };
  }
}

// --- the study's own check: what the debrief shows ------------------------------------

export interface PwProcessItem {
  id: string;
  label: string;
  ok: boolean;
  lessonId: string;
  tipIds?: string[];
}

/** The last hyperaemic or resting measurement (the one a decision rests on), or null. */
export function lastMeasurement(s: PwSessionState): PwRecord | null {
  for (let i = s.records.length - 1; i >= 0; i--) if (s.records[i].kind === "ffr" || s.records[i].kind === "rest") return s.records[i];
  return null;
}

/** The set-up and technique items that apply to this study, each with whether it was done. */
export function processItems(s: PwSessionState): PwProcessItem[] {
  const p = sessionPreset(s);
  const has = (f: PwFault) => p.faults.includes(f);
  const eq = s.eq;
  const last = lastMeasurement(s);
  const items: PwProcessItem[] = [
    { id: "zero-outside", label: "Wire zeroed outside the body before it entered the guide", ok: !s.zeroedInBody && !s.introducedUnzeroed && s.zeroed, lessonId: "pm-physiology-setup", tipIds: ["pci-phys-zero-outside"] },
    { id: "introducer-out", label: "Introducer removed before equalising", ok: !!eq && !eq.introducer, lessonId: "pm-physiology-setup", tipIds: ["pci-phys-equalise-at-tip"] },
    { id: "guide-flushed", label: "Guide flushed with saline before equalising", ok: !!eq && !eq.contrast, lessonId: "pm-physiology-setup", tipIds: ["pci-phys-equalise-at-tip"] },
    { id: "aortic-line", label: "Aortic line flushed, free of air, before equalising", ok: !!eq && !eq.air, lessonId: "pm-physiology-setup", tipIds: ["pci-mon-aortic-line-physiology"] },
    { id: "equalise-at-tip", label: "Equalised with the sensor at the guide tip", ok: !!eq && eq.atTip, lessonId: "pm-physiology-setup", tipIds: ["pci-phys-equalise-at-tip"] },
    { id: "waveforms", label: "Equalised only once the waveforms superimposed", ok: !!eq && !eq.mismatch, lessonId: "pm-physiology-setup", tipIds: ["pci-phys-equalise-fail"] },
    { id: "valid-measurement", label: "No measurement accepted with mismatched waveforms or a faulty set-up", ok: !!last && last.valid, lessonId: "pm-physiology-setup", tipIds: ["pci-phys-equalise-fail"] },
    { id: "drift-check", label: "Drift check at the end", ok: !!s.driftCheck, lessonId: "pm-physiology-pullback", tipIds: ["pci-phys-drift-check"] },
  ];
  if (has("offset-waveforms")) items.push({ id: "wire-changed", label: "Wire changed when equalisation still failed", ok: s.wireId > 1 && !s.faults.includes("offset-waveforms"), lessonId: "pm-physiology-setup", tipIds: ["pci-phys-equalise-fail"] });
  if (has("ebu-lcx")) items.push({ id: "guide-changed", label: "Guide changed when the wire kept entering the wrong branch", ok: s.guidesChanged > 0, lessonId: "pm-physiology-setup", tipIds: ["pci-phys-wire-wrong-branch"] });
  if (has("wire-deformed")) items.push({ id: "device-out", label: "Other devices removed from the guide before the wire went in", ok: !s.introducedPastDevice || s.wireId > 1, lessonId: "pm-physiology-setup" });
  const lm = p.leftMain?.model;
  // an intermediate left main is measured from both branches (Brilakis 12.3, 17.12; lesson pm-physiology-subsets), unless
  // the case is one where physiology cannot settle it and imaging is the answer
  if (lm && lm.lm.lesions.length && p.case.decision !== "imaging") {
    const measured = new Set(s.records.filter((r) => (r.kind === "ffr" || r.kind === "rest") && r.valid && r.branch).map((r) => r.branch));
    items.push({ id: "both-branches", label: "Left main measured from both branches", ok: lm.branches.every((b) => measured.has(b.id)), lessonId: "pm-physiology-subsets", tipIds: ["pci-phys-left-main-both-branches"] });
  }
  if (p.case.guideObstructs) items.push({ id: "disengaged", label: "Guide disengaged during hyperaemic measurement", ok: s.disengagedForHyp, lessonId: "pm-physiology-pullback", tipIds: ["pci-phys-damped-guide"] });
  return [...items, ...hyperaemiaItems(s)];
}

/** The hyperaemia and adenosine items that apply to this study (physiology-hyperaemia-and-adenosine). */
export function hyperaemiaItems(s: PwSessionState): PwProcessItem[] {
  const p = sessionPreset(s);
  const items: PwProcessItem[] = [];
  const IND = "pm-physiology-indices";
  const DRUGS = "pm-lab-drugs-microvascular";
  const ffrs = s.records.filter((r) => r.kind === "ffr");
  const icFfrs = ffrs.filter((r) => r.agent === "ic");
  if (s.icDoses.some((d) => d.t > 0 || !p.startBolus)) {
    // the RCA, or a dominant circumflex, supplies the AV node (14-physiology.ts:483)
    const avNodal = (v: string) => v === "RCA" || (v === "LCx" && s.dominance === "left");
    const safe = s.icDoses.filter((d) => d.t > 0 || !p.startBolus).every((d) => !d.fast && !(avNodal(d.vessel) && d.doseUg > IC_ADENOSINE_RCA_MAX_UG));
    items.push({ id: "ic-dose", label: `Intracoronary adenosine injected slowly, no more than ${IC_ADENOSINE_RCA_MAX_UG} µg into the RCA or a dominant circumflex`, ok: safe, lessonId: DRUGS, tipIds: ["pci-adenosine-rca-dose"] });
  }
  if (icFfrs.length) items.push({ id: "ic-flush", label: "Guide flushed after the intracoronary bolus, FFR read once the trace had recovered", ok: icFfrs.every((r) => !r.problems.some((x) => x.startsWith("read early"))), lessonId: IND, tipIds: ["pci-phys-ic-adenosine-flush"] });
  const faults = p.hyperaemiaFaults ?? [];
  if (faults.length) {
    const found =
      (!faults.includes("tissued-line") || s.checked.line) && (!faults.includes("saline-swap") || s.checked.drug) && (!faults.includes("caffeine") || s.checked.caffeine);
    items.push({ id: "failed-hyperaemia", label: "Absent hyperaemia recognised and its cause found", ok: found, lessonId: IND, tipIds: ["pci-phys-no-hyperaemia", "pci-phys-iv-hyperaemia-signs"] });
  }
  if (p.adenosineContraindicated) items.push({ id: "no-adenosine", label: `Adenosine avoided: ${p.adenosineContraindicated}`, ok: !s.adenosineGiven, lessonId: IND });
  if (ffrs.some((r) => r.agent === "contrast")) items.push({ id: "contrast-ffr", label: `Contrast FFR read with a clean trace and judged at ${CONTRAST_FFR_CUTOFF}`, ok: ffrs.some((r) => r.agent === "contrast" && r.valid), lessonId: IND });
  // arrhythmias the monitor showed (when the lab passes the rhythm): the module's response to each
  // the orders given while the arrhythmia lasted (the order that ends it comes before the monitor shows the change)
  const ordersIn = (a: PwArrhythmia) => s.orders.filter((o) => o.t >= a.t && o.t <= (a.end ?? s.t));
  for (const a of s.arrhythmias) {
    const during = ordersIn(a);
    const os = during.map((o) => o.order);
    // a delivered shock within the window, and the VF ended (the orders record only delivered shocks)
    const shockedAtOnce = during.some((o) => o.order === "shock" && o.t - a.t <= MP_ORDER_WINDOW_S);
    if (a.kind === "vf") items.push({ id: `vf-${Math.round(a.t)}`, label: "Ventricular fibrillation defibrillated at once", ok: shockedAtOnce && a.end !== null, lessonId: DRUGS, tipIds: ["pci-arrest-adenosine-cough"] });
    if (a.kind === "av-block") {
      // watched without a shock: asked to cough or waited, or it passed by itself within the window as the module expects
      const watched = os.includes("cough") || os.includes("wait") || (a.end !== null && a.end - a.t <= MP_BLOCK_SELF_RESOLVE_S);
      items.push({ id: `block-${Math.round(a.t)}`, label: "Adenosine heart block: the patient asked to cough, and a wait (CPR and pacing only if it persisted), no shock", ok: watched && !os.includes("shock") && !os.includes("cardiovert"), lessonId: DRUGS, tipIds: ["pci-adenosine-block-cough-wait"] });
    }
    if (a.kind === "af") items.push({ id: `af-${Math.round(a.t)}`, label: "Adenosine AF: synchronised cardioversion if it did not revert, never an unsynchronised shock", ok: !os.includes("shock") && (a.end !== null || os.includes("cardiovert")), lessonId: DRUGS });
  }
  return items;
}

// --- the patient engine (the lab's rig) ------------------------------------------------

/** What the session asks of the lab's PatientEngine (a type only: the reducer stays engine-free). */
export type PwEngine = Pick<PatientEngine, "giveDrug" | "startInfusion" | "stopInfusion" | "contrast" | "setRecentCaffeine" | "setAdenosineHazards" | "cough" | "setCpr" | "setPacing" | "charge" | "clearForShock" | "shock" | "cardiovert"> & {
  /** the patient (PatientEngine.profile): its dominance decides whether the circumflex supplies the AV node */
  readonly profile?: { readonly dominance?: Dominance };
};

/** Intracoronary nitrate the legacy GTN action gives, µg (14-physiology.ts: "Intracoronary nitroglycerin 100-200 µg", "at most 200 µg"). */
export const IC_GTN_UG = 200;

/**
 * Prepare the lab's engine for a study: recent caffeine, the adenosine hazard model the preset asks for,
 * and a colleague's bolus given before the start. Call once, after the engine is built, and keep the
 * session it returns: it carries the patient's dominance (for the debrief's dose rule).
 */
export function setUpPwEngine(e: PwEngine, s: PwSessionState): PwSessionState {
  const p = sessionPreset(s);
  if (p.hyperaemiaFaults?.includes("caffeine")) e.setRecentCaffeine(true);
  if (p.adenosineHazards) e.setAdenosineHazards({ force: p.adenosineHazards === "on" ? null : p.adenosineHazards });
  const inj = s.inj;
  if (inj && inj.agent === "adenosine" && inj.t === 0 && s.t === 0 && inj.parts[0]?.ug > 0)
    e.giveDrug("adenosine", inj.parts[0].ug, "ic", { side: inj.side, vessel: inj.vessel, fast: inj.fast, bolusUg: bolusAsGiven(inj) });
  const dominance = e.profile?.dominance;
  return dominance && dominance !== s.dominance ? { ...s, dominance } : s;
}

/** The whole intracoronary bolus that heads for the artery: all of it with the guide engaged, little of it disengaged. */
function bolusAsGiven(inj: PwInjection): number {
  return inj.doseUg * (inj.engaged ? 1 : MP_DISENGAGED_DELIVERY);
}

/**
 * Give the engine what the operator did (the session's reducer has already run: `before` and `after`
 * are its states around action `a`). Legacy actions give what the lab always gave: IV adenosine at
 * 140 µg/kg/min through a central vein, an IC bolus of IC_ADENOSINE_LEGACY_UG for the side, the nitrate
 * at IC_GTN_UG. Detailed actions give the dose that reached the artery (the flush gives the rest), the
 * rate and site as delivered (none of a saline swap), contrast, and the bedside orders.
 */
export function applyPwActionToEngine(e: PwEngine, before: PwSessionState, after: PwSessionState, a: PwAction): void {
  if (after === before) return;
  const c = sessionPreset(after).case;
  const side = vesselSide(c.vessel);
  switch (a.type) {
    case "hyperaemia": {
      if (before.hyper.mode === "iv" && after.hyper.mode !== "iv") e.stopInfusion("adenosine");
      const hy = after.hyper;
      if (hy === before.hyper) return;
      if (hy.mode === "iv") {
        if (!hy.detail) {
          if (before.hyper.mode !== "iv") e.startInfusion({ drug: "adenosine", rate: ADENOSINE.ivStandardUgKgMin, site: "central" });
        } else if (hy.detail.agent === "saline") {
          if (before.hyper.mode === "iv") e.stopInfusion("adenosine");
        } else e.startInfusion({ drug: "adenosine", rate: hy.detail.rate, site: hy.detail.site === "central" ? "central" : "peripheral", ...(hy.detail.delivered < 1 ? { delivered: hy.detail.delivered } : {}) });
      }
      if (hy.mode === "ic") {
        if (!hy.detailed) e.giveDrug("adenosine", IC_ADENOSINE_LEGACY_UG[side], "ic", { side });
        else if (after.inj && after.inj !== before.inj && after.inj.agent === "adenosine" && after.inj.parts[0].ug > 0)
          e.giveDrug("adenosine", after.inj.parts[0].ug, "ic", { side, vessel: c.vessel, fast: after.inj.fast, bolusUg: bolusAsGiven(after.inj) });
      }
      if (hy.mode === "contrast" && after.inj && after.inj !== before.inj) e.contrast(after.inj.ml, side);
      return;
    }
    case "flush-guide": {
      const inj = after.inj;
      if (inj && inj.agent === "adenosine" && inj.flushedAt === after.t && before.inj?.flushedAt === null) {
        const rest = inj.parts[inj.parts.length - 1].ug;
        // the rest of the bolus already judged when it was given: no second AV block or hazard draw
        if (rest > 0) e.giveDrug("adenosine", rest, "ic", { side, vessel: inj.vessel, fast: false, continuation: true });
      }
      return;
    }
    case "gtn":
      e.giveDrug("gtn", IC_GTN_UG, "ic", { side });
      return;
    case "order":
      switch (a.order) {
        case "cough":
          e.cough();
          return;
        case "cpr-start":
          e.setCpr(true);
          return;
        case "cpr-stop":
          e.setCpr(false);
          return;
        case "pace-on":
          e.setPacing(MP_PACING_RATE_BPM);
          return;
        case "pace-off":
          e.setPacing(null);
          return;
        case "charge":
          e.charge();
          return;
        case "clear":
          e.clearForShock();
          return;
        // only a shock the session delivered (an undelivered one is not recorded as an order)
        case "shock":
          if (after.orders.length > before.orders.length) e.shock();
          return;
        case "cardiovert":
          if (after.orders.length > before.orders.length) e.cardiovert();
          return;
        case "wait":
          return;
      }
      return;
    default:
      return;
  }
}

/** What the session's tick takes from the engine: the mean aortic pressure, the rate, the rhythm and the defibrillator. */
export function pwPatientInput(v: Pick<Vitals, "aortaTrue" | "hr" | "rhythmKind" | "av"> & Partial<Pick<Vitals, "defib">>): PwPatientInput {
  return {
    map: v.aortaTrue.mean,
    ...(v.hr !== null && v.hr !== undefined ? { hr: v.hr } : {}),
    rhythm: { kind: v.rhythmKind, av: v.av },
    ...(v.defib ? { defib: { charging: v.defib.charging, charged: v.defib.charged } } : {}),
  };
}

export interface PwScore {
  score: number;
  passed: boolean;
  decisionCorrect: boolean;
  metrics: Record<string, number>;
}

/** The study's score: 50 for the decision, 50 shared by the process items that apply. */
export function scorePwSession(s: PwSessionState): PwScore {
  const p = sessionPreset(s);
  const items = processItems(s);
  const decisionCorrect = decisionAccepted(p, s.decision);
  const done = items.filter((i) => i.ok).length;
  const score = Math.round((decisionCorrect ? 50 : 0) + (50 * done) / Math.max(1, items.length));
  const last = lastMeasurement(s);
  return {
    score,
    passed: decisionCorrect && !!last?.valid,
    decisionCorrect,
    metrics: { processDone: done, processItems: items.length, measurements: s.records.filter((r) => r.kind === "ffr" || r.kind === "rest").length, invalidMeasurements: s.records.filter((r) => (r.kind === "ffr" || r.kind === "rest") && !r.valid).length, wires: s.wireId, guidesChanged: s.guidesChanged },
  };
}

/** The phasic window physiology.ts uses for the wave-free ratio (re-exported for plots). */
export const WAVE_FREE_WINDOW = WFP;
