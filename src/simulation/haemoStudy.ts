// ---------------------------------------------------------------------------
// Haemodynamic study session (haemo-study-session-and-tips).
//
// A pure reducer over one study in the haemodynamics lab: where the right
// heart and left heart catheters are, what has been recorded in each
// measurement set (pressures, simultaneous recordings, saturations), the
// learner's own calculations and the shock decision, the diagnosis, and the
// events raised for the study. From that state it derives the lab phase and
// the events the tip context reports (src/ui/lab/haemoTips.ts), the data
// checklist and the score.
//
// The learner calculates: CalcPanel takes the learner's numbers and grades
// them against gradedTruth() (derive() of src/simulation/haemo.ts, with the
// pulmonary flow taken from what the oximetry run can sample) within the
// tolerances below; the verdict and the reference value are shown only in
// guided mode (the verdict) and in the debrief, after the diagnosis is
// submitted.
//
// Framework-free and deterministic, so the tests drive it directly.
//
// Transducer set-up (haemo-transducer-and-setup): every study carries the
// set-up of its pressure transducers (TransducerSetup): where the transducer
// sits against the mid-thoracic level, whether it has been zeroed to air, the
// line between catheter and transducer (air, a kink, clot, a long extension)
// and the manifold with its ports. A normal study starts with the set-up done
// and reads true; a set-up preset (SETUP_PRESETS, opened as a start of a
// scenario by src/content/lab/presets/haemo/setup.launch.ts) starts with work
// to do, keeps the phase at 'setup' until the transducer is zeroed and level,
// and records what the recorder displays (the hydrostatic and zero offsets of
// the Transducer model and the line's damping), with the true values kept for
// the debrief.
// ---------------------------------------------------------------------------

import type { LabEvent, LabPhase } from "../content/lab/tips";
import type { DecisionRecord } from "../mentor/ledger";
import { fickCO, gorlinAVA, gorlinMVA, pvrWU, qpQs } from "./calc";
import { MMHG_PER_CM, Transducer, fastFlushReading, type FlushReading, type LineSpec } from "./patient/transducer";
import {
  SCENARIO_BY_ID,
  aorticGradient,
  derive,
  measure,
  mitralGradient,
  sample,
  timeline,
  withSet,
  type Chamber,
  type ChamberMeasure,
  type Derived,
  type HaemoScenario,
  type HaemoSetId,
  type SatSite,
} from "./haemo";

// ---------------------------------------------------------------------------
// Catheters and sites
// ---------------------------------------------------------------------------

/** The balloon-tipped right heart catheter's course. */
export const RHC_PATH: readonly Chamber[] = ["RA", "RV", "PA", "PCWP"];
/** An angiographic pigtail on the right side goes no further than the main PA: it cannot wedge. */
export const PIGTAIL_RHC_PATH: readonly Chamber[] = ["RA", "RV", "PA"];
export const SAT_SITES: readonly SatSite[] = ["SVC", "IVC", "RA", "RV", "PA", "Ao"];
/** Sites that make a sample part of a saturation run (PA and Ao alone are the Fick pair). */
export const RUN_SITES: readonly SatSite[] = ["SVC", "IVC", "RA", "RV"];

export type RhcCatheter = "balloon" | "pigtail";
export type LhcPosition = "none" | "Ao" | "LV";
/** The measurement set: "base" for a scenario without sets, else "pre" or "post". */
export type SetKey = "base" | HaemoSetId;

export const rhcPath = (c: RhcCatheter): readonly Chamber[] => (c === "pigtail" ? PIGTAIL_RHC_PATH : RHC_PATH);

// ---------------------------------------------------------------------------
// Model parameters and sourced thresholds
// ---------------------------------------------------------------------------

/**
 * A displayed mean arterial pressure below this raises "hypotension" (mmHg). The same value as
 * PATIENT_EVENT_THRESHOLDS.hypotensionMapMmHg in src/ui/lab/patientEvents.ts (MODEL PARAMETER there);
 * haemoTips.test.ts checks that they agree. The haemodynamic scenarios are steady, so no hold time applies.
 */
export const HAEMO_HYPOTENSION_MAP = 65;

/** Which calculations the learner enters. */
export type CalcKey = "co" | "ci" | "svr" | "pvr" | "tpg" | "qpqs" | "cpo" | "papi" | "ava" | "mva";
export const CALC_KEYS: readonly CalcKey[] = ["co", "ci", "svr", "pvr", "tpg", "qpqs", "cpo", "papi", "ava", "mva"];

export interface CalcTolerance {
  /** accepted when |entry − reference| is at most this */
  abs?: number;
  /** or when |entry − reference| / reference is at most this */
  rel?: number;
  /** where the tolerance comes from */
  source: string;
}

/**
 * Grading tolerances. CPO, PAPi and Qp:Qs come from the lab requests (pm-support-choice#1: CPO within
 * 0.02 W and PAPi within 0.1; the plan's design for this package: Qp:Qs within 0.1 and SVR within
 * 10%). The others are MODEL PARAMETERS: grading bands chosen for this lab, not clinical values.
 */
export const CALC_TOLERANCE: Readonly<Record<CalcKey, CalcTolerance>> = {
  co: { rel: 0.1, source: "MODEL PARAMETER" },
  ci: { rel: 0.1, source: "MODEL PARAMETER" },
  svr: { rel: 0.1, source: "lab-build-plan.json haemo-study-session-and-tips (SVR within 10%)" },
  pvr: { rel: 0.1, abs: 0.3, source: "MODEL PARAMETER" },
  tpg: { abs: 2, source: "MODEL PARAMETER" },
  qpqs: { abs: 0.1, source: "lab-build-plan.json haemo-study-session-and-tips (Qp:Qs within 0.1)" },
  cpo: { abs: 0.02, source: "lab request pm-support-choice#1 (CPO within 0.02 W)" },
  papi: { abs: 0.1, source: "lab request pm-support-choice#1 (PAPi within 0.1)" },
  ava: { abs: 0.1, source: "MODEL PARAMETER" },
  mva: { abs: 0.1, source: "MODEL PARAMETER" },
};

export interface CalcSpec {
  key: CalcKey;
  label: string;
  unit: string;
  /** decimals the reference is shown with in the debrief */
  dp: number;
  /** the formula, shown after an entry (or on request in guided mode) */
  formula: string;
  /** what the calculation needs, shown while it is not yet possible */
  need: string;
  /** the lesson that teaches it */
  lessonId: string;
}

export const CALCS: readonly CalcSpec[] = [
  { key: "co", label: "Fick cardiac output", unit: "L/min", dp: 2, formula: "VO₂ ÷ [13.6 × Hb × (SaO₂ − SvO₂)], VO₂ assumed 125 mL/min/m² × BSA; SvO₂ from the chamber proximal to any step-up", need: "arterial and mixed venous saturations", lessonId: "hb-cardiac-catheterisation-output" },
  { key: "ci", label: "Cardiac index", unit: "L/min/m²", dp: 2, formula: "CO ÷ BSA", need: "arterial and mixed venous saturations", lessonId: "hb-cardiac-catheterisation-output" },
  { key: "svr", label: "SVR", unit: "WU", dp: 1, formula: "(MAP − RAP) ÷ CO; × 80 for dyn·s·cm⁻⁵", need: "aortic and RA pressures, CO", lessonId: "hb-cardiac-catheterisation-resistance" },
  { key: "pvr", label: "PVR", unit: "WU", dp: 2, formula: "(mPAP − PAWP) ÷ Qp, Qp = VO₂ ÷ [13.6 × Hb × (PvO₂ − PaO₂)] with PvO₂ = SaO₂ (equal to CO without a shunt); abnormal above 2 WU (ESC/ERS 2022)", need: "PA and wedge pressures, pulmonary flow (Qp; equal to CO without a shunt: arterial and PA saturations)", lessonId: "hb-cardiac-catheterisation-resistance" },
  { key: "tpg", label: "Transpulmonary gradient", unit: "mmHg", dp: 0, formula: "mPAP − PAWP", need: "PA and wedge pressures", lessonId: "hb-cardiac-catheterisation-resistance" },
  { key: "qpqs", label: "Qp : Qs", unit: "", dp: 2, formula: "(SaO₂ − MvO₂) ÷ (PvO₂ − PaO₂); the pulmonary veins are not sampled here, so PvO₂ = SaO₂ (no right-to-left shunt)", need: "full saturation run", lessonId: "hb-cardiac-catheterisation-shunts" },
  { key: "cpo", label: "Cardiac power output", unit: "W", dp: 2, formula: "MAP × CO ÷ 451", need: "aortic pressure and CO", lessonId: "pm-support-choice-shock" },
  { key: "papi", label: "PAPi", unit: "", dp: 2, formula: "(PA systolic − PA diastolic) ÷ RA mean", need: "PA and RA pressures", lessonId: "pm-support-choice-shock" },
  { key: "ava", label: "Aortic valve area (Gorlin)", unit: "cm²", dp: 2, formula: "CO ÷ (HR × SEP × 44.3 × √mean gradient); Gorlin assumes a fixed orifice", need: "simultaneous LV + aortic pressures, CO", lessonId: "hb-specific-conditions-as" },
  { key: "mva", label: "Mitral valve area (Gorlin)", unit: "cm²", dp: 2, formula: "CO ÷ (HR × DFP × 37.7 × √mean gradient); the wedge overestimates the true LA–LV gradient", need: "simultaneous LV + wedge pressures, CO", lessonId: "hb-specific-conditions-mitral" },
];
export const CALC_BY_KEY: Readonly<Record<CalcKey, CalcSpec>> = Object.fromEntries(CALCS.map((c) => [c.key, c])) as Record<CalcKey, CalcSpec>;

/** The recorder's read-out of a valve timing (s, 2 dp) and a mean gradient (whole mmHg), as the lab shows them. */
const shownTiming = (x: number) => Math.round(x * 100) / 100;
const shownGradient = (x: number) => Math.round(x);

/**
 * What the study grades against: derive() of the set, with two changes so that the reference is what a
 * learner can reach from the screen.
 * - The pulmonary flow (Qp, and with it Qp:Qs and PVR) takes the pulmonary venous saturation as the
 *   arterial saturation. The oximetry run has no pulmonary venous sample, so that is the value the
 *   learner can use (the Qp:Qs formula shown says so); derive() keeps the scenario's hidden pulmonary
 *   venous saturation, and the debrief shows the difference. Identical without a pulmonary venous value.
 * - The Gorlin areas use the recorder's mean gradient (whole mmHg) and SEP or DFP (2 dp), the values
 *   the calculation panel shows; derive() uses the unrounded ones. Where derive() gives no area (mean
 *   gradient 2 mmHg or less) neither does this.
 */
export function gradedTruth(s: HaemoScenario): Derived {
  const d = derive(s);
  const tl = d.timeline;
  const out: Derived = {
    ...d,
    aortic: { ...d.aortic, ava: Number.isFinite(d.aortic.ava) ? gorlinAVA(d.co, s.hr, shownTiming(tl.sep), shownGradient(d.aortic.mean)) : NaN },
    mitral: { ...d.mitral, mva: Number.isFinite(d.mitral.mva) ? gorlinMVA(d.co, s.hr, shownTiming(tl.dfp), shownGradient(d.mitral.mean)) : NaN },
  };
  if (s.sats.pv === undefined) return out;
  const pv = s.sats.Ao;
  const qp = fickCO(d.vo2, s.hb, pv, s.sats.PA);
  return { ...out, qp, qpqs: qpQs(s.sats.Ao, d.mixedVenous, pv, s.sats.PA), pvr: pvrWU(d.mpap, d.pawp, qp) };
}

/** The reference value of a calculation, from gradedTruth() (NaN when it does not apply, e.g. no valve gradient). */
export function referenceValue(d: Derived, key: CalcKey): number {
  switch (key) {
    case "co":
      return d.co;
    case "ci":
      return d.ci;
    case "svr":
      return d.svr;
    case "pvr":
      return d.pvr;
    case "tpg":
      return d.tpg;
    case "qpqs":
      return d.qpqs;
    case "cpo":
      return d.cpo;
    case "papi":
      return d.papi;
    case "ava":
      return d.aortic.ava;
    case "mva":
      return d.mitral.mva;
  }
}

/** Is an entry within tolerance of the reference? */
export function withinTolerance(key: CalcKey, entry: number, ref: number): boolean {
  if (!Number.isFinite(entry) || !Number.isFinite(ref)) return false;
  const t = CALC_TOLERANCE[key];
  const err = Math.abs(entry - ref);
  const eps = 1e-9;
  if (t.abs !== undefined && err <= t.abs + eps) return true;
  if (t.rel !== undefined && Math.abs(ref) > 0 && err / Math.abs(ref) <= t.rel + eps) return true;
  return false;
}

// ---------------------------------------------------------------------------
// The shock decision table (pm-support-choice-rv, 'Decision points after PCI in the shock protocol
// Brilakis reproduces'; pm-support-choice-shock, 'Recalculate after PCI' and 'Escalate if CPO stays
// below 0.6'; Brilakis, Manual of PCI, as cited there).
// ---------------------------------------------------------------------------

export const SHOCK_CPO_W = 0.6;
export const SHOCK_PAPI = 0.9;

export type ShockAction = "wean" | "right-sided" | "more-support";
export const SHOCK_ACTIONS: readonly { id: ShockAction; label: string }[] = [
  { id: "wean", label: "Wean vasopressors and inotropes" },
  { id: "right-sided", label: "Consider right-sided support" },
  { id: "more-support", label: "Consider more left-sided support" },
];

export interface ShockRow {
  finding: string;
  action: string;
  /** the action the lab grades as correct for this row */
  expected: ShockAction;
}

/** The rows of the table, in the module's order. */
export const SHOCK_TABLE: readonly ShockRow[] = [
  { finding: "CPO above 0.6 W and PAPi above 0.9", action: "Wean vasopressors and inotropes; decide whether the pump comes out in the lab or stays", expected: "wean" },
  { finding: "CPO below 0.6 W, PAPi below 0.9", action: "Consider right-sided support", expected: "right-sided" },
  { finding: "CPO below 0.6 W, PAPi above 0.9", action: "Consider more support: a more powerful device, or transfer to an LVAD or transplant centre", expected: "more-support" },
  { finding: "CPO above 0.6 W, PAPi below 0.9", action: "Consider right-sided support if RV dysfunction is suspected clinically", expected: "right-sided" },
];
export const SHOCK_TABLE_SOURCE = "pm-support-choice-rv (decision points after PCI, National Cardiogenic Shock Initiative protocol reproduced by Brilakis)";

/** The table row for a CPO and PAPi (above means strictly above the threshold). */
export function shockRow(cpo: number, papi: number): ShockRow {
  const cpoOk = cpo > SHOCK_CPO_W;
  const papiOk = papi > SHOCK_PAPI;
  if (cpoOk && papiOk) return SHOCK_TABLE[0];
  if (!cpoOk && !papiOk) return SHOCK_TABLE[1];
  if (!cpoOk) return SHOCK_TABLE[2];
  return SHOCK_TABLE[3];
}

// ---------------------------------------------------------------------------
// Transducer set-up (haemo-transducer-and-setup)
// ---------------------------------------------------------------------------
//
// Sources: the mid-thoracic level is 'halfway between the front of the sternum and the table'
// (pm-monitoring-transducers, tip haemo-mon-zero-level: ESC/ERS 2022 and Kovacs, as the module quotes
// them); zero to air through the manifold's distal port (pm-monitoring-transducers, 'Zero to air';
// hb-cardiac-catheterisation-setup, tip haemo-setup-manifold-check); a table raised after zeroing with
// a pole-mounted transducer makes every pressure read high (pm-monitoring-transducers, the check after
// 'Levelling: why the landmark matters'); the fast-flush outcomes (the same lesson, 'Doing and reading
// the test (Michard 2024)'); the hydrostatic offset is physics (MMHG_PER_CM, about 0.74 mmHg per cm).
// Geometry, line dimensions and offsets below are MODEL PARAMETERS.

export type TransducerMount = "pole" | "table";
export type LevelLandmark = "mid-thoracic" | "v4" | "table";

/** Front-to-back depth of the chest, cm. MODEL PARAMETER: the V4 electrode on the front of the chest sits 10 cm above the mid-thoracic level. */
export const MP_CHEST_DEPTH_CM = 20;
/** How far the table moves in the table-move preset, cm (the module's check: the table raised for a difficult femoral venous puncture). MODEL PARAMETER. */
export const MP_TABLE_MOVE_CM = 10;
/** A transducer within this height of the mid-thoracic level counts as level, cm. MODEL PARAMETER (under 1 mmHg). */
export const MP_HAEMO_LEVEL_TOL_CM = 1;
/** The offset an unzeroed transducer reads at atmosphere, mmHg. MODEL PARAMETER. */
export const MP_UNZEROED_OFFSET_MMHG = 6;
/** Air in the transducer dome in the overdamped preset, mL (the plan's acceptance test: 0.3 mL). */
export const MP_PRESET_AIR_ML = 0.3;
/** Inner radius of a kinked pressure line, mm. MODEL PARAMETER. */
export const MP_KINK_RMM = 0.2;
/**
 * The haemodynamic line: a 100 cm fluid-filled catheter and a short line to the transducer, with the
 * damping of its manifold, stopcocks and connectors. MODEL PARAMETERS chosen so that the line sits in
 * the sourced band (facts S9 §transducer: natural frequency above 24 Hz, damping 0.64-0.7 optimal,
 * one or two oscillations after a fast flush): about 25.7 Hz and a damping of about 0.6, so that
 * Transducer.dynamic() calls it optimal and the fast flush shows one visible oscillation. The
 * diagnostic lab's DEFAULT_LINE is unchanged.
 */
export const HAEMO_LINE: LineSpec = { catheterCm: 100, catheterRmm: 0.45, lineCm: 30, lineRmm: 0.9, dampingGain: 5.8 };
/** Length of the long extension line of the underdamped preset, cm (the plan's acceptance test: 300 cm). */
export const HAEMO_LONG_LINE_CM = 300;
/** Inner radius of the long extension line, mm. MODEL PARAMETER (with the gain below: about 12 Hz). */
export const MP_LONG_LINE_RMM = 0.4;
/**
 * Damping gain of the line with the long extension. MODEL PARAMETER: the module says that longer
 * tubing makes resonance more likely, with several oscillations and a systolic overshoot
 * (pm-monitoring-transducers, 'Doing and reading the test'); the lumped model cannot ring through a
 * longer line by itself (its Poiseuille resistance always damps more), so the extension carries a lower
 * gain: about 12 Hz and a damping of about 0.28, three visible oscillations after a fast flush.
 */
export const MP_LONG_LINE_DAMPING_GAIN = 1;
/** The line with the long extension in place of the short line. */
export const HAEMO_LONG_LINE: LineSpec = { ...HAEMO_LINE, lineCm: HAEMO_LONG_LINE_CM, lineRmm: MP_LONG_LINE_RMM, dampingGain: MP_LONG_LINE_DAMPING_GAIN };

export const LEVEL_LANDMARKS: readonly { id: LevelLandmark; label: string }[] = [
  { id: "mid-thoracic", label: "Mid-thoracic level (halfway between the front of the sternum and the table)" },
  { id: "v4", label: "Level with the V4 electrode (front of the chest)" },
  { id: "table", label: "Level with the table top" },
];

/** Height of a landmark above the table top, cm. */
export function landmarkHeightCm(l: LevelLandmark): number {
  return l === "mid-thoracic" ? MP_CHEST_DEPTH_CM / 2 : l === "v4" ? MP_CHEST_DEPTH_CM : 0;
}

/** The manifold's ports (MODEL PARAMETER: four; the module describes 3-5). Generic names. */
export const MANIFOLD_PORTS: readonly string[] = ["Pressure line", "Contrast", "Saline flush", "Waste"];

export interface ManifoldPort {
  /** air in the port */
  air: boolean;
  /** the air is not visible until the manifold is inspected (an assistant's manifold) */
  hidden: boolean;
}

export type LineFix = "reprime" | "straighten" | "aspirate" | "standard-line";
export const LINE_FIXES: readonly { id: LineFix; label: string }[] = [
  { id: "reprime", label: "Re-prime the line and transducer dome" },
  { id: "straighten", label: "Check the line for a kink" },
  { id: "aspirate", label: "Aspirate and flush the catheter" },
  { id: "standard-line", label: "Replace the extension with a short standard line" },
];

export const SETUP_PRESETS = ["setup-v4-level", "setup-table-move", "setup-overdamped-air", "setup-underdamped-long-line", "setup-hidden-bubble"] as const;
export type SetupPresetId = (typeof SETUP_PRESETS)[number];
export const isSetupPreset = (x: unknown): x is SetupPresetId => typeof x === "string" && (SETUP_PRESETS as readonly string[]).includes(x);

export interface FlushReadingEntry {
  given: FlushReading;
  expected: FlushReading;
}

/** What the transducer looked like at a level check (an operator's observation, not a number). */
export type LevelObservation = "level" | "above" | "below";

export interface TransducerSetup {
  /** the set-up preset this study practises, or null for a study whose set-up was done before it began */
  preset: SetupPresetId | null;
  mount: TransducerMount;
  /** table-top height relative to where it was when the study began, cm (+ up) */
  tableCm: number;
  /** transducer height relative to the table top's starting height, cm */
  transducerCm: number;
  /** the landmark the learner last levelled the transducer at (null: not levelled by the learner in this study; the panel highlights only this) */
  landmark: LevelLandmark | null;
  /** offset the transducer reads at atmosphere before zeroing, and the offset removed at the last zero, mmHg */
  drift: number;
  zeroRef: number;
  zeroed: boolean;
  /** the transducer stopcock is open to air */
  openToAir: boolean;
  /** zero pressed with the transducer not open to air (refused, as a monitor refuses a pulsatile zero) */
  zeroRefused: number;
  line: { long: boolean; airMl: number; kinked: boolean; clot: boolean };
  /** the line fault the study began with, for the debrief */
  startFault: "air" | "long-line" | null;
  /** fast flushes run, the reading of the last one, and whether the learner has read it */
  flushes: number;
  lastFlush: { reading: FlushReading; oscillations: number } | null;
  awaitingReading: boolean;
  readings: FlushReadingEntry[];
  manifold: ManifoldPort[];
  inspected: boolean;
  injections: number;
  /** air went into the patient through the manifold (a critical error) */
  airInjected: boolean;
  /** the table-move preset raises the table at the first catheter move after the set-up is done */
  tableMovePending: boolean;
  tableMoved: boolean;
  /** the transducer was re-levelled after the table moved */
  relevelledAfterMove: boolean;
  /** a pressure was recorded after the table moved with the transducer not level again (the re-levelling missed) */
  recordedBeforeRelevel: boolean;
  levelChecks: number;
  lastCheck: LevelObservation | null;
  /** pressures recorded with the set-up at fault, and with it right */
  recordsFaulty: number;
  recordsClean: number;
}

const cleanManifold = (): ManifoldPort[] => MANIFOLD_PORTS.map(() => ({ air: false, hidden: false }));
const unflushedManifold = (): ManifoldPort[] => MANIFOLD_PORTS.map(() => ({ air: true, hidden: false }));

/** The set-up of a study that begins with the transducer level, zeroed, a clean line and a flushed manifold. */
export function preparedSetup(): TransducerSetup {
  return {
    preset: null,
    mount: "pole",
    tableCm: 0,
    transducerCm: landmarkHeightCm("mid-thoracic"),
    landmark: "mid-thoracic",
    drift: 0,
    zeroRef: 0,
    zeroed: true,
    openToAir: false,
    zeroRefused: 0,
    line: { long: false, airMl: 0, kinked: false, clot: false },
    startFault: null,
    flushes: 0,
    lastFlush: null,
    awaitingReading: false,
    readings: [],
    manifold: cleanManifold(),
    inspected: false,
    injections: 0,
    airInjected: false,
    tableMovePending: false,
    tableMoved: false,
    relevelledAfterMove: false,
    recordedBeforeRelevel: false,
    levelChecks: 0,
    lastCheck: null,
    recordsFaulty: 0,
    recordsClean: 0,
  };
}

/** A set-up still to be done: transducer on the pole at table height, not zeroed, every manifold port with air. */
function freshSetup(preset: SetupPresetId): TransducerSetup {
  return { ...preparedSetup(), preset, transducerCm: landmarkHeightCm("table"), landmark: null, drift: MP_UNZEROED_OFFSET_MMHG, zeroed: false, manifold: unflushedManifold() };
}

/** The set-up a preset begins with. */
export function presetSetup(preset: SetupPresetId): TransducerSetup {
  switch (preset) {
    case "setup-v4-level":
      // set up by someone else: zeroed and flushed, but levelled with the V4 electrode. The landmark is
      // not recorded as chosen (null), so the panel does not show where it was put until it is checked;
      // the debrief says so (preset 'setup-v4-level').
      return { ...preparedSetup(), preset, transducerCm: landmarkHeightCm("v4"), landmark: null };
    case "setup-table-move":
      return { ...freshSetup(preset), tableMovePending: true };
    case "setup-overdamped-air":
      return { ...freshSetup(preset), line: { long: false, airMl: MP_PRESET_AIR_ML, kinked: false, clot: false }, startFault: "air" };
    case "setup-underdamped-long-line":
      return { ...freshSetup(preset), line: { long: true, airMl: 0, kinked: false, clot: false }, startFault: "long-line" };
    case "setup-hidden-bubble": {
      // the manifold an assistant prepared: every port flushed but one, whose bubble does not show until inspected
      const manifold = cleanManifold();
      manifold[1] = { air: true, hidden: true };
      return { ...freshSetup(preset), manifold };
    }
  }
}

/** Height of the transducer above the mid-thoracic level now, cm (+ above: reads low). */
export function heightAboveLevelCm(su: TransducerSetup): number {
  return su.transducerCm - (su.tableCm + landmarkHeightCm("mid-thoracic"));
}

export const isLevel = (su: TransducerSetup): boolean => Math.abs(heightAboveLevelCm(su)) <= MP_HAEMO_LEVEL_TOL_CM;

/** The transducer is zeroed, level and open to the patient: the readings are referred to the right level. */
export const setupComplete = (su: TransducerSetup): boolean => su.zeroed && isLevel(su) && !su.openToAir;

/** The static offset the recorder adds to every pressure: hydrostatic (transducer height) and zero (unzeroed drift), mmHg. */
export function setupOffsetMmHg(su: TransducerSetup): number {
  return -heightAboveLevelCm(su) * MMHG_PER_CM + (su.drift - su.zeroRef);
}

/** The line between catheter and transducer as a LineSpec. */
export function setupLineSpec(su: TransducerSetup): LineSpec {
  const base = su.line.long ? HAEMO_LONG_LINE : HAEMO_LINE;
  // a kink narrows the line and damps it, whatever line it is
  return su.line.kinked ? { ...base, lineRmm: MP_KINK_RMM, dampingGain: HAEMO_LINE.dampingGain } : base;
}

/** A key for what decides the line's dynamics: its spec, air and clot. */
function lineKey(su: TransducerSetup): string {
  const l = setupLineSpec(su);
  return `${l.catheterCm}|${l.catheterRmm}|${l.lineCm}|${l.lineRmm}|${l.dampingGain}|${su.line.airMl}|${su.line.clot}`;
}

/** A Transducer carrying the set-up: line, air, clot, height, zero and stopcock (its second-order state at rest). */
export function setupTransducer(su: TransducerSetup): Transducer {
  const tr = new Transducer(setupLineSpec(su), su.drift);
  syncTransducer(tr, su);
  return tr;
}

/** Bring a running Transducer's set-up in line with the study's, keeping its second-order state. */
export function syncTransducer(tr: Transducer, su: TransducerSetup): void {
  const spec = setupLineSpec(su);
  if (tr.line.lineCm !== spec.lineCm || tr.line.lineRmm !== spec.lineRmm || tr.line.catheterCm !== spec.catheterCm || tr.line.catheterRmm !== spec.catheterRmm) tr.line = spec;
  tr.setAir(su.line.airMl);
  tr.setLumenPlug(su.line.clot);
  tr.setHeight(heightAboveLevelCm(su));
  tr.setOpenToAir(su.openToAir);
  tr.st.drift = su.drift;
  tr.st.zeroRef = su.zeroRef;
  tr.st.zeroed = su.zeroed;
}

/** What a fast flush on the line would show now. */
export function lineReading(su: TransducerSetup): { reading: FlushReading; oscillations: number } {
  const k = lineKey(su);
  const hit = READING_CACHE.get(k);
  if (hit) return hit;
  const tr = new Transducer(setupLineSpec(su));
  tr.setAir(su.line.airMl);
  tr.setLumenPlug(su.line.clot);
  const out = fastFlushReading(tr.dynamic());
  if (READING_CACHE.size > 100) READING_CACHE.clear();
  READING_CACHE.set(k, out);
  return out;
}
const READING_CACHE = new Map<string, { reading: FlushReading; oscillations: number }>();

/** What is wrong with the set-up now (for the debrief and the recorded pressures; never shown live). */
export type SetupFault = "not-level" | "not-zeroed" | "open-to-air" | FlushReading;
export function setupFaults(su: TransducerSetup): SetupFault[] {
  const out: SetupFault[] = [];
  if (!isLevel(su)) out.push("not-level");
  if (!su.zeroed) out.push("not-zeroed");
  if (su.openToAir) out.push("open-to-air");
  const r = lineReading(su).reading;
  if (r !== "optimal") out.push(r);
  return out;
}

/** The set-up of a study (a state from before the set-up existed reads as prepared). */
export const studySetup = (st: { setup?: TransducerSetup }): TransducerSetup => st.setup ?? PREPARED;
const PREPARED = preparedSetup();

// --- what the recorder displays ---

/** Internal step of the transducer chain, s (Transducer.step asks for 0.5 ms or less). */
export const CHAIN_DT_S = 0.0005;

interface Distortion {
  dSys: number;
  dDia: number;
  dMean: number;
  /** displayed pulse amplitude over the true one */
  gain: number;
}
const DISTORTION_CACHE = new Map<string, Distortion>();

/**
 * The line's distortion of one chamber's beat: run the true waveform (end-expiration, no ectopy) through
 * the Transducer at CHAIN_DT_S until it settles and compare the displayed beat with the true one.
 */
function lineDistortion(s: HaemoScenario, c: Chamber, su: TransducerSetup, key: string): Distortion {
  const k = `${key}|${c}|${lineKey(su)}`;
  const hit = DISTORTION_CACHE.get(k);
  if (hit) return hit;
  const tr = new Transducer(setupLineSpec(su));
  tr.setAir(su.line.airMl);
  tr.setLumenPlug(su.line.clot);
  tr.zero();
  const opt = { respiration: false, pvc: false };
  const T = timeline(s).T;
  const m = measure(s, c);
  tr.st.x = m.mean;
  const warm = Math.max(4, 4 * T);
  let t = 0;
  for (; t < warm; t += CHAIN_DT_S) tr.step(CHAIN_DT_S, sample(s, c, t, opt));
  let maxD = -Infinity,
    minD = Infinity,
    sumD = 0,
    maxT = -Infinity,
    minT = Infinity,
    sumT = 0,
    n = 0;
  const end = t + 2 * T;
  for (; t < end; t += CHAIN_DT_S) {
    const p = sample(s, c, t + CHAIN_DT_S, opt);
    const y = tr.step(CHAIN_DT_S, p);
    maxD = Math.max(maxD, y);
    minD = Math.min(minD, y);
    sumD += y;
    maxT = Math.max(maxT, p);
    minT = Math.min(minT, p);
    sumT += p;
    n++;
  }
  const out: Distortion = { dSys: maxD - maxT, dDia: minD - minT, dMean: (sumD - sumT) / n, gain: maxT - minT > 0.5 ? (maxD - minD) / (maxT - minT) : 1 };
  if (DISTORTION_CACHE.size > 500) DISTORTION_CACHE.clear();
  DISTORTION_CACHE.set(k, out);
  return out;
}

const roundM = (m: ChamberMeasure): ChamberMeasure => {
  const r = (x?: number) => (x === undefined ? undefined : Math.round(x));
  return { sys: r(m.sys)!, dia: r(m.dia)!, mean: r(m.mean)!, edp: r(m.edp), a: r(m.a), v: r(m.v) };
};

/**
 * The recorder's read-out of a chamber through the study's transducer set-up. With the set-up done and
 * an optimal line it is measure() exactly. A transducer off level or unzeroed shifts every value by the
 * same offset; a transducer open to air reads only its zero offset; a line that is not optimal changes
 * the systolic and diastolic values (and the a and v waves and EDP with the pulse) while the mean
 * stays close.
 */
export function displayedMeasure(st: HaemoStudyState, c: Chamber): ChamberMeasure {
  const s = studyScenario(st);
  const m = measure(s, c);
  const su = studySetup(st);
  if (su === PREPARED || (setupComplete(su) && su.drift === su.zeroRef && heightAboveLevelCm(su) === 0 && lineReading(su).reading === "optimal")) return m;
  if (su.openToAir) {
    const z = su.drift - su.zeroRef;
    return roundM({ sys: z, dia: z, mean: z, edp: m.edp === undefined ? undefined : z, a: m.a === undefined ? undefined : z, v: m.v === undefined ? undefined : z });
  }
  const off = setupOffsetMmHg(su);
  let out: ChamberMeasure = { ...m };
  if (lineReading(su).reading !== "optimal") {
    const d = lineDistortion(s, c, su, `${st.scenarioId}|${st.set}`);
    const mean = m.mean + d.dMean;
    const dia = m.dia + d.dDia;
    out = {
      sys: m.sys + d.dSys,
      dia,
      mean,
      edp: m.edp === undefined ? undefined : dia + (m.edp - m.dia) * d.gain,
      a: m.a === undefined ? undefined : mean + (m.a - m.mean) * d.gain,
      v: m.v === undefined ? undefined : mean + (m.v - m.mean) * d.gain,
    };
  }
  return roundM({
    sys: out.sys + off,
    dia: out.dia + off,
    mean: out.mean + off,
    edp: out.edp === undefined ? undefined : out.edp + off,
    a: out.a === undefined ? undefined : out.a + off,
    v: out.v === undefined ? undefined : out.v + off,
  });
}

/** What a level check shows the operator: the transducer against the mid-thoracic level. */
export function levelObservation(su: TransducerSetup): LevelObservation {
  const h = heightAboveLevelCm(su);
  return Math.abs(h) <= MP_HAEMO_LEVEL_TOL_CM ? "level" : h > 0 ? "above" : "below";
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface Recorded {
  chambers: Partial<Record<Chamber, ChamberMeasure>>;
  /**
   * The true values of chambers recorded through a set-up that changed the reading, and what was wrong
   * at the time (haemo-transducer-and-setup); for the debrief only. Absent when nothing was wrong.
   */
  truth?: Partial<Record<Chamber, ChamberMeasure>>;
  faults?: Partial<Record<Chamber, SetupFault[]>>;
  simLVAo: boolean;
  simLVW: boolean;
  simLVRVResp: boolean;
  sats: Partial<Record<SatSite, number>>;
  /** measured on the recorder from a simultaneous LV + aortic recording (mmHg) */
  aorticMeanGradient?: number;
  /** measured on the recorder from a simultaneous LV + wedge recording (mmHg) */
  mitralMeanGradient?: number;
}
export const EMPTY_RECORDED: Recorded = { chambers: {}, simLVAo: false, simLVW: false, simLVRVResp: false, sats: {} };

export interface CalcEntry {
  value: number;
  /** entries made so far (the first one counts for the score) */
  attempts: number;
  accepted: boolean;
  /** whether the first entry was accepted */
  firstAccepted: boolean;
}

export interface MeasurementSet {
  rec: Recorded;
  entries: Partial<Record<CalcKey, CalcEntry>>;
  /** the shock decision (post-PCI set only) */
  decision?: ShockAction;
}
const EMPTY_SET: MeasurementSet = { rec: EMPTY_RECORDED, entries: {} };

export type HaemoLastAction = "start" | "catheter" | "record" | "sat" | "calc" | "set" | "setup";

export interface HaemoStudyState {
  scenarioId: string;
  set: SetKey;
  rhc: number; // index into the catheter's path; -1 = not inserted
  rhcCatheter: RhcCatheter;
  lhc: LhcPosition;
  artLine: boolean;
  resp: boolean;
  pvc: boolean;
  /** which catheter moved last (decides the primary phase when both are in) */
  lastCatheter: "rhc" | "lhc" | null;
  sets: Partial<Record<SetKey, MeasurementSet>>;
  lastAction: HaemoLastAction;
  /** a saturation run is in progress (a run site was sampled and nothing else done since) */
  satRun: boolean;
  calcOpen: boolean;
  /** formulas the learner asked to see before entering (guided mode) */
  formulaShown: Partial<Record<CalcKey, boolean>>;
  /** index into diagnosisOptions(), once submitted */
  answer: number | null;
  /** events raised for the whole study from outside (a launch's events, later packages) */
  raised: LabEvent[];
  /** the transducer set-up (haemo-transducer-and-setup); absent in a state from before it existed (read as prepared) */
  setup?: TransducerSetup;
}

export type HaemoAction =
  | { type: "load"; scenarioId: string; start?: string | null; events?: readonly LabEvent[] }
  | { type: "rhc-advance" }
  | { type: "rhc-withdraw" }
  | { type: "rhc-catheter"; catheter: RhcCatheter }
  | { type: "lhc"; position: LhcPosition }
  | { type: "art-line"; on: boolean }
  | { type: "resp"; on: boolean }
  | { type: "pvc"; on: boolean }
  | { type: "record" }
  | { type: "sat"; site: SatSite }
  | { type: "calc-panel"; open: boolean }
  | { type: "enter"; key: CalcKey; value: number }
  | { type: "show-formula"; key: CalcKey }
  | { type: "decide"; action: ShockAction }
  | { type: "next-set" }
  | { type: "answer"; index: number }
  | { type: "raise"; event: LabEvent }
  | { type: "clear-event"; event: LabEvent }
  // transducer set-up (haemo-transducer-and-setup)
  | { type: "setup-level"; landmark: LevelLandmark }
  | { type: "setup-mount"; mount: TransducerMount }
  | { type: "setup-check-level" }
  | { type: "setup-table"; deltaCm: number }
  | { type: "setup-stopcock"; to: "air" | "patient" }
  | { type: "setup-zero" }
  | { type: "setup-fast-flush" }
  | { type: "setup-read-flush"; reading: FlushReading }
  | { type: "setup-fix"; fix: LineFix }
  | { type: "manifold-flush"; port: number }
  | { type: "manifold-inspect" }
  | { type: "manifold-inject" };

/** The first set of a scenario, or the named start ("pre" | "post") when it has sets. */
function startSet(s: HaemoScenario, start?: string | null): SetKey {
  if (!s.sets) return "base";
  return start === "post" ? "post" : "pre";
}

export function initialStudy(scenarioId: string, start?: string | null, events: readonly LabEvent[] = []): HaemoStudyState {
  const s = SCENARIO_BY_ID[scenarioId];
  if (!s) throw new Error(`unknown haemodynamic scenario "${scenarioId}"`);
  const set = startSet(s, start);
  return {
    scenarioId,
    set,
    rhc: -1,
    rhcCatheter: "balloon",
    lhc: "none",
    artLine: false,
    resp: true,
    pvc: false,
    lastCatheter: null,
    sets: { [set]: EMPTY_SET },
    lastAction: "start",
    satRun: false,
    calcOpen: false,
    formulaShown: {},
    answer: null,
    raised: [...new Set(events)],
    setup: isSetupPreset(start) ? presetSetup(start) : preparedSetup(),
  };
}

// ---------------------------------------------------------------------------
// Derived views
// ---------------------------------------------------------------------------

export function baseScenario(st: HaemoStudyState): HaemoScenario {
  return SCENARIO_BY_ID[st.scenarioId];
}

/** The scenario as measured in the current set. */
export function studyScenario(st: HaemoStudyState): HaemoScenario {
  const s = baseScenario(st);
  return withSet(s, st.set === "base" ? null : st.set);
}

export function currentSet(st: HaemoStudyState): MeasurementSet {
  return st.sets[st.set] ?? EMPTY_SET;
}

/** The truth the current set is graded against (gradedTruth() of derive()). */
export function studyTruth(st: HaemoStudyState): Derived {
  return gradedTruth(studyScenario(st));
}

/** The chambers on the recorder now. */
export function shownChambers(st: HaemoStudyState): Chamber[] {
  const shown: Chamber[] = [];
  const path = rhcPath(st.rhcCatheter);
  if (st.rhc >= 0) shown.push(path[Math.min(st.rhc, path.length - 1)]);
  if (st.lhc !== "none") shown.push(st.lhc);
  if (st.artLine && st.lhc !== "Ao") shown.push("Ao");
  return shown;
}

/** The checklist item the scenario needs. */
export interface ChecklistItem {
  key: string;
  label: string;
  ok: (r: Recorded) => boolean;
}

/**
 * An aortic valve study (a scenario with an echo report, haemo-aortic-stenosis-studies) whose echo leaves
 * the grade open, so the valve is crossed and the gradient measured (avStudy.crossingIndicated). False for
 * a scenario without the report and for one whose echo is concordant (the right answer is not to cross).
 */
export function aorticCrossingIndicated(s: HaemoScenario): boolean {
  return s.avStudy?.crossingIndicated === true;
}

/** The data a complete study of this scenario collects (unchanged for the original fifteen scenarios). */
export function dataChecklist(s: HaemoScenario): ChecklistItem[] {
  const base: ChecklistItem[] = [
    { key: "RA", label: "RA pressure", ok: (r) => !!r.chambers.RA },
    { key: "RV", label: "RV pressure", ok: (r) => !!r.chambers.RV },
    { key: "PA", label: "PA pressure", ok: (r) => !!r.chambers.PA },
    { key: "PCWP", label: "Wedge pressure", ok: (r) => !!r.chambers.PCWP },
    { key: "Ao", label: "Aortic pressure", ok: (r) => !!r.chambers.Ao },
    { key: "sats", label: "PA and arterial saturations", ok: (r) => r.sats.PA !== undefined && r.sats.Ao !== undefined },
  ];
  const extra: ChecklistItem[] = [];
  if (s.id === "aortic-stenosis" || s.id === "hocm" || aorticCrossingIndicated(s)) extra.push({ key: "lvao", label: "Simultaneous LV + aortic pressure", ok: (r) => r.simLVAo });
  if (s.id === "mitral-stenosis") extra.push({ key: "lvw", label: "Simultaneous LV + wedge", ok: (r) => r.simLVW });
  if (s.id === "constriction" || s.id === "restriction") extra.push({ key: "lvrv", label: "Simultaneous LV + RV with respiration", ok: (r) => r.simLVRVResp });
  if (s.category === "shunt") extra.push({ key: "run", label: "Full saturation run (SVC, IVC, RA, RV, PA, Ao)", ok: (r) => SAT_SITES.every((k) => r.sats[k] !== undefined) });
  if (s.id === "acute-ar" || s.id === "lv-shock" || s.id === "acute-mr") extra.push({ key: "LV", label: "LV pressure", ok: (r) => !!r.chambers.LV });
  return [...base, ...extra];
}

/** Is the arterial saturation and a mixed venous source recorded (the inputs of a Fick output)? */
export function haveFick(r: Recorded): boolean {
  return r.sats.Ao !== undefined && (r.sats.PA !== undefined || (r.sats.SVC !== undefined && r.sats.IVC !== undefined));
}

/** Gorlin's caveat for dynamic obstruction (carried over from the lab before the split). */
export const GORLIN_HOCM_NOTE = "Gorlin assumes a fixed orifice: not valid for dynamic LVOT obstruction";

/** Why a calculation does not apply to this scenario at all (shown instead of what it needs), if it does not. */
export function calcBlocked(st: HaemoStudyState, key: CalcKey): string | undefined {
  if (key === "ava" && studyScenario(st).pvcResponse === "hocm") return GORLIN_HOCM_NOTE;
  return undefined;
}

/** Can the learner do this calculation from what is recorded in the current set? */
export function calcAvailable(st: HaemoStudyState, key: CalcKey): boolean {
  if (calcBlocked(st, key)) return false;
  const r = currentSet(st).rec;
  const c = r.chambers;
  const fick = haveFick(r);
  const d = (): Derived => studyTruth(st);
  switch (key) {
    case "co":
    case "ci":
      return fick;
    case "svr":
      return fick && !!c.Ao && !!c.RA;
    case "pvr":
      return fick && r.sats.PA !== undefined && !!c.PA && !!c.PCWP;
    case "tpg":
      return !!c.PA && !!c.PCWP;
    case "qpqs":
      return SAT_SITES.every((k) => r.sats[k] !== undefined);
    case "cpo":
      return fick && !!c.Ao;
    case "papi":
      return !!c.PA && !!c.RA;
    case "ava":
      return r.simLVAo && fick && Number.isFinite(d().aortic.ava);
    case "mva":
      return r.simLVW && fick && Number.isFinite(d().mitral.mva);
  }
}

/** The calculations a complete study of this scenario includes (for the score). */
export function requiredCalcs(s: HaemoScenario): CalcKey[] {
  const keys: CalcKey[] = ["co"];
  const ev = s.events ?? [];
  if (s.category === "shock" || s.sets || s.id === "chip-elective") keys.push("cpo", "papi");
  // an aortic valve study with a concordant echo is not crossed, so it has no valve area to work out
  if (ev.includes("aortic-stenosis") && (!s.avStudy || s.avStudy.crossingIndicated)) keys.push("ava");
  if (ev.includes("mitral-stenosis")) keys.push("mva");
  if (s.category === "shunt") keys.push("qpqs");
  if (s.category === "pulmonary") keys.push("pvr");
  return keys;
}

/** Scenarios whose study includes the simultaneous valve recordings (phase 'valves'). */
export function isValveStudy(s: HaemoScenario): boolean {
  const ev = s.events ?? [];
  return s.category === "valve" || ev.includes("aortic-stenosis") || ev.includes("low-flow-aortic-stenosis") || ev.includes("mitral-stenosis") || ev.includes("hocm");
}

export interface StudyPhase {
  phase: LabPhase;
  /** further phases active at the same time (both catheters in) */
  phases: LabPhase[];
}

/**
 * The lab phase: 'calculations' while the calculation panel is open; 'shunts' during a saturation
 * run; 'valves' for a simultaneous LV + aortic or LV + wedge recording in a valve study; otherwise
 * 'right-heart' with the right heart catheter anywhere from RA to wedge and 'left-heart' with the
 * pigtail in the aortic root or LV (the catheter moved last first when both are in); 'setup' before
 * any catheter.
 */
export function studyPhase(st: HaemoStudyState): StudyPhase {
  if (st.calcOpen) return { phase: "calculations", phases: [] };
  if (st.satRun) return { phase: "shunts", phases: [] };
  const rh = st.rhc >= 0;
  const lh = st.lhc !== "none";
  const cath: LabPhase[] = [];
  if (rh) cath.push("right-heart");
  if (lh) cath.push("left-heart");
  if (st.lastCatheter === "lhc") cath.reverse();
  // the transducer set-up comes first: 'setup' until it is zeroed and level (the catheters' phases ride along)
  if (!setupComplete(studySetup(st))) return { phase: "setup", phases: cath };
  const shown = shownChambers(st);
  if (isValveStudy(baseScenario(st)) && shown.includes("LV") && (shown.includes("Ao") || shown.includes("PCWP"))) return { phase: "valves", phases: cath };
  if (!cath.length) return { phase: "setup", phases: [] };
  return { phase: cath[0], phases: cath.slice(1) };
}

/** Is the systemic arterial pressure on the screen or recorded in this set? */
export function arterialPressureSeen(st: HaemoStudyState): boolean {
  return shownChambers(st).includes("Ao") || !!currentSet(st).rec.chambers.Ao;
}

/** Events raised while the study runs (as opposed to the scenario's own); 'pressure-damped' and 'air' come from the transducer set-up. */
export const HAEMO_DYNAMIC_EVENTS = ["hypotension", "pressure-damped", "air"] as const satisfies readonly LabEvent[];

/**
 * The events the study reports now: the scenario's own (for the whole study), the ones raised from
 * outside, and 'hypotension' once a mean arterial pressure below HAEMO_HYPOTENSION_MAP is on the
 * screen or recorded in this set.
 */
export function studyEvents(st: HaemoStudyState): LabEvent[] {
  const out = new Set<LabEvent>([...(baseScenario(st).events ?? []), ...st.raised]);
  if (arterialPressureSeen(st) && measure(studyScenario(st), "Ao").mean < HAEMO_HYPOTENSION_MAP) out.add("hypotension");
  // the transducer set-up: an overdamped line once a trace or a flush shows it; air put into the patient
  const su = studySetup(st);
  if ((shownChambers(st).length > 0 || su.flushes > 0) && lineReading(su).reading === "overdamped") out.add("pressure-damped");
  if (su.airInjected) out.add("air");
  return [...out];
}

/** The catheter on the right side when it is an angiographic pigtail, or the pigtail of the left heart when only that is in. */
export function studyCatheter(st: HaemoStudyState): "PIG" | undefined {
  if (st.rhc >= 0 && st.rhcCatheter === "pigtail") return "PIG";
  if (st.rhc < 0 && st.lhc !== "none") return "PIG";
  return undefined;
}

// ---------------------------------------------------------------------------
// Diagnosis options and the score
// ---------------------------------------------------------------------------

function order(n: number, seed: string) {
  let h = 7;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

/** The diagnosis options in a fixed, scenario-seeded order (the same order as before the session). */
export function diagnosisOptions(s: HaemoScenario): string[] {
  const all = [s.diagnosis, ...s.distractors];
  return order(all.length, s.id).map((i) => all[i]);
}

/** The sets the study has visited, in order. */
export function visitedSets(st: HaemoStudyState): SetKey[] {
  return (["base", "pre", "post"] as SetKey[]).filter((k) => st.sets[k]);
}

/** Does the scenario ask for the shock decision (a post-PCI set)? */
export const needsDecision = (s: HaemoScenario): boolean => !!s.sets;

/** The expected shock action for the post-PCI set (null for a scenario without sets). */
export function expectedDecision(s: HaemoScenario): ShockAction | null {
  if (!s.sets) return null;
  const d = derive(withSet(s, "post"));
  return shockRow(d.cpo, d.papi).expected;
}

export interface StudyScore {
  score: number;
  passed: boolean;
  correct: boolean;
  metrics: Record<string, number>;
}

/**
 * Diagnosis 50, data collected 25 and calculations 25 (each required calculation in each visited set,
 * accepted at the first entry, plus the shock decision for a scenario with sets). Passed when the
 * diagnosis is right and, for a shock preset, the decision matches the table. The weights are MODEL
 * PARAMETERS of this lab's scoring.
 */
export function scoreStudy(st: HaemoStudyState): StudyScore {
  const s = baseScenario(st);
  const correct = st.answer !== null && diagnosisOptions(s)[st.answer] === s.diagnosis;
  const sets = visitedSets(st);
  const checklist = dataChecklist(s);
  let got = 0;
  let need = 0;
  let calcOk = 0;
  let calcNeed = 0;
  let attempts = 0;
  for (const k of sets) {
    const m = st.sets[k]!;
    need += checklist.length;
    got += checklist.filter((q) => q.ok(m.rec)).length;
    for (const key of requiredCalcs(s)) {
      calcNeed += 1;
      if (m.entries[key]?.firstAccepted) calcOk += 1;
    }
    for (const e of Object.values(m.entries)) attempts += e?.attempts ?? 0;
  }
  const expected = expectedDecision(s);
  const given = st.sets.post?.decision;
  const decisionCorrect = expected !== null && given === expected;
  if (expected !== null) {
    calcNeed += 1;
    if (decisionCorrect) calcOk += 1;
  }
  const dataFrac = need ? got / need : 0;
  const calcFrac = calcNeed ? calcOk / calcNeed : 0;
  const base = Math.round((correct ? 50 : 0) + 25 * dataFrac + 25 * calcFrac);
  const metrics: Record<string, number> = {
    dataCollected: got,
    dataRequired: need,
    calcsAccepted: calcOk - (decisionCorrect ? 1 : 0),
    calcsRequired: calcNeed - (expected !== null ? 1 : 0),
    calcAttempts: attempts,
    ...(expected !== null ? { decisionCorrect: decisionCorrect ? 1 : 0 } : {}),
  };
  const passed = correct && (expected === null || decisionCorrect);
  const su = studySetup(st);
  if (!su.preset) return { score: base, passed, correct, metrics };
  // a set-up preset: the study score weighs three quarters, the set-up checks one quarter (MODEL PARAMETERS),
  // and air injected through the manifold is a critical error that fails the study
  const checks = setupChecks(st);
  const met = checks.filter((c) => c.ok).length;
  const setupFrac = checks.length ? met / checks.length : 1;
  return {
    score: Math.round(0.75 * base + 25 * setupFrac),
    passed: passed && !su.airInjected,
    correct,
    metrics: {
      ...metrics,
      setupChecksMet: met,
      setupChecks: checks.length,
      flushReadingsCorrect: su.readings.filter((r) => r.given === r.expected).length,
      flushReadings: su.readings.length,
      recordedWithSetupFault: su.recordsFaulty,
      criticalErrors: su.airInjected ? 1 : 0,
    },
  };
}

export interface SetupCheck {
  key: string;
  label: string;
  ok: boolean;
}

/** The set-up checks a preset is scored on (shown in the debrief). */
export function setupChecks(st: HaemoStudyState): SetupCheck[] {
  const su = studySetup(st);
  if (!su.preset) return [];
  const out: SetupCheck[] = [
    { key: "level", label: "Transducer at the mid-thoracic level", ok: isLevel(su) },
    { key: "zero", label: "Zeroed to air", ok: su.zeroed },
    recordedCount(st) > 0
      ? { key: "records", label: "Every pressure in the final record taken with the transducer zeroed, level and a sound line", ok: finalRecordSound(st) }
      : { key: "records", label: "No pressures recorded, so the record could not be checked against the set-up", ok: false },
    { key: "flush", label: "Fast-flush test run and read correctly", ok: su.readings.length > 0 && su.readings.every((r) => r.given === r.expected) },
    { key: "air", label: "No air injected through the manifold", ok: !su.airInjected },
  ];
  if (su.startFault) out.push({ key: "line", label: su.startFault === "air" ? "Air cleared from the line" : "Long extension replaced", ok: lineReading(su).reading === "optimal" });
  if (su.tableMoved) out.push({ key: "relevel", label: "Transducer level again after the table moved (re-levelled, or carried by the table rail)", ok: su.relevelledAfterMove });
  if (su.manifold.some((p) => p.hidden) || su.preset === "setup-hidden-bubble") out.push({ key: "manifold", label: "Manifold inspected before injecting through it", ok: su.inspected || (!su.airInjected && su.injections === 0) });
  return out;
}

/** A scored set-up decision for the run's ledger (a decision record without its time). */
export type SetupDecision = Omit<DecisionRecord, "t">;

/** The lessons the set-up decisions open from the debrief. */
export const SETUP_LESSON_MONITORING = "pm-monitoring-transducers";
export const SETUP_LESSON_SETUP = "hb-cardiac-catheterisation-setup";

/** The three bedside readings of a fast-flush test, as pm-monitoring-transducers names them (see FLUSH_READINGS). */
const FLUSH_READING_LABEL: Record<FlushReading, string> = {
  optimal: "Normal damping (one or two oscillations)",
  overdamped: "Overdamped (no oscillations)",
  underdamped: "Underdamped (several oscillations)",
};

/** Where the re-levelling after a table move stands: no move, level again, not yet level, or missed (a pressure recorded first). */
function relevelState(su: TransducerSetup): "none" | "level" | "pending" | "missed" {
  if (!su.tableMoved) return "none";
  if (su.recordedBeforeRelevel) return "missed";
  return su.relevelledAfterMove ? "level" : "pending";
}

/**
 * The set-up decisions an action settles, for the run's ledger (the lab host logs them):
 * - each fast-flush reading the learner gives ('setup-flush-<n>'), graded against what the flush showed;
 * - air injected through the manifold ('setup-manifold-air'), the critical error of a set-up preset;
 *   in a preset the first clean injection is logged as right under the same id, and an air injection
 *   after it replaces that entry;
 * - re-levelling after the table moved ('setup-relevel'), logged again whenever the answer changes so
 *   the ledger always says what the set-up shows now: right when the transducer is level again
 *   (re-levelled at the mid-thoracic level, or carried level on the table rail), wrong again when it is
 *   moved off the level before the next pressure (levelled at another landmark, or the table moved
 *   again). A pressure recorded with the transducer not level again settles it as wrong for good
 *   (recordedBeforeRelevel), and a diagnosis submitted before re-levelling is wrong.
 * `decided` holds the ids the ledger already has (a clean injection is logged once).
 */
export function setupDecisions(prev: HaemoStudyState, next: HaemoStudyState, a: HaemoAction, decided: ReadonlySet<string> = new Set()): SetupDecision[] {
  if (next === prev) return [];
  const before = studySetup(prev);
  const su = studySetup(next);
  const out: SetupDecision[] = [];
  if (a.type === "setup-read-flush" && su.readings.length > before.readings.length) {
    const n = su.readings.length;
    const r = su.readings[n - 1];
    out.push({
      id: `setup-flush-${n}`,
      stage: "setup",
      label: n === 1 ? "Fast-flush test reading" : `Fast-flush test reading ${n}`,
      correct: r.given === r.expected,
      expected: FLUSH_READING_LABEL[r.expected],
      given: FLUSH_READING_LABEL[r.given],
      lessonId: SETUP_LESSON_MONITORING,
      tipIds: ["haemo-mon-fast-flush"],
    });
  }
  if (a.type === "manifold-inject" && su.injections > before.injections && !before.airInjected) {
    const manifold = { id: "setup-manifold-air", stage: "setup", label: "Manifold before injecting", expected: "Every port flushed and the manifold inspected, no air injected", lessonId: SETUP_LESSON_SETUP, tipIds: ["haemo-setup-manifold-check"] };
    if (su.airInjected) out.push({ ...manifold, correct: false, given: "Air injected through the manifold" });
    else if (su.preset && !decided.has(manifold.id)) out.push({ ...manifold, correct: true, given: "Injected with the manifold clear of air" });
  }
  const relevel = { id: "setup-relevel", stage: "setup", label: "Re-levelling after the table moved", expected: "Transducer level again before the next pressure (re-levelled, or carried on the table rail)", lessonId: SETUP_LESSON_MONITORING, tipIds: ["haemo-mon-zero-level"] };
  const was = relevelState(before);
  const now = relevelState(su);
  if (now === "missed") {
    if (was !== "missed") out.push({ ...relevel, correct: false, given: "Pressure recorded before re-levelling" });
  } else if (a.type === "answer" && now === "pending") {
    out.push({ ...relevel, correct: false, given: "Not re-levelled before the study ended" });
  } else if (now === "level" && was !== "level") {
    out.push({ ...relevel, correct: true, given: a.type === "setup-level" ? "Re-levelled at the mid-thoracic level" : "Carried level on the table rail" });
  } else if (now === "pending" && was === "level") {
    out.push({ ...relevel, correct: false, given: a.type === "setup-level" ? "Moved off the mid-thoracic level after re-levelling" : "Table moved again and the transducer not re-levelled" });
  }
  return out;
}

/**
 * The pressures the study ends with were all taken with the set-up right: at least one recorded, and
 * none in any visited set carrying a set-up fault. A pressure recorded through a fault and then
 * recorded again with the fault put right counts by its last recording (recordsFaulty still counts it).
 */
/** How many pressures the study's visited sets hold. */
export function recordedCount(st: HaemoStudyState): number {
  let n = 0;
  for (const k of visitedSets(st)) n += Object.keys(st.sets[k]!.rec.chambers).length;
  return n;
}

export function finalRecordSound(st: HaemoStudyState): boolean {
  let n = 0;
  for (const k of visitedSets(st)) {
    const rec = st.sets[k]!.rec;
    for (const c of Object.keys(rec.chambers) as Chamber[]) {
      n++;
      if ((rec.faults?.[c] ?? []).length > 0) return false;
    }
  }
  return n > 0;
}

export interface SetupDebriefRow {
  set: SetKey;
  chamber: Chamber;
  recorded: ChamberMeasure;
  truth: ChamberMeasure;
  faults: SetupFault[];
}

/** Recorded against true pressures, set by set, for the debrief (after the diagnosis is submitted). */
export function setupDebrief(st: HaemoStudyState): SetupDebriefRow[] {
  const rows: SetupDebriefRow[] = [];
  for (const k of visitedSets(st)) {
    const rec = st.sets[k]!.rec;
    const s = withSet(baseScenario(st), k === "base" ? null : k);
    for (const c of ["RA", "RV", "PA", "PCWP", "LV", "Ao"] as Chamber[]) {
      const m = rec.chambers[c];
      if (!m) continue;
      rows.push({ set: k, chamber: c, recorded: m, truth: rec.truth?.[c] ?? measure(s, c), faults: rec.faults?.[c] ?? [] });
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// The reducer
// ---------------------------------------------------------------------------

function patchSet(st: HaemoStudyState, f: (m: MeasurementSet) => MeasurementSet): HaemoStudyState {
  return { ...st, sets: { ...st.sets, [st.set]: f(currentSet(st)) } };
}

function moved(st: HaemoStudyState, patch: Partial<HaemoStudyState>, which: "rhc" | "lhc" | null): HaemoStudyState {
  return { ...st, ...patch, lastAction: "catheter", satRun: false, ...(which ? { lastCatheter: which } : {}) };
}

export function haemoStudyReducer(st: HaemoStudyState, a: HaemoAction): HaemoStudyState {
  // after the diagnosis is submitted the study is a record: only a reload changes it
  if (st.answer !== null && a.type !== "load" && a.type !== "calc-panel") return st;
  switch (a.type) {
    case "load":
      return initialStudy(a.scenarioId, a.start, a.events ?? []);
    case "rhc-advance": {
      const path = rhcPath(st.rhcCatheter);
      if (st.rhc >= path.length - 1) return st;
      const next = moved(st, { rhc: st.rhc + 1 }, "rhc");
      return withTableMove(st, next);
    }
    case "rhc-withdraw":
      if (st.rhc < 0) return st;
      return moved(st, { rhc: st.rhc - 1 }, "rhc");
    case "rhc-catheter": {
      if (a.catheter === st.rhcCatheter) return st;
      // changing catheter means withdrawing the one in place
      return moved(st, { rhcCatheter: a.catheter, rhc: -1 }, "rhc");
    }
    case "lhc":
      // only the positions the left-heart catheter can take (the reducer is reachable from dev hooks)
      if (!(["none", "Ao", "LV"] as string[]).includes(a.position)) return st;
      if (a.position === st.lhc) return st;
      return withTableMove(st, moved(st, { lhc: a.position }, "lhc"));
    case "art-line":
      return { ...st, artLine: a.on };
    case "resp":
      return { ...st, resp: a.on };
    case "pvc":
      return { ...st, pvc: a.on };
    case "record": {
      const shown = shownChambers(st);
      if (!shown.length) return st;
      const s = studyScenario(st);
      const su = studySetup(st);
      const faults = setupFaults(su);
      const next = patchSet(st, (m) => {
        const r = m.rec;
        const chambers = { ...r.chambers };
        let truth = r.truth;
        let faultsAt = r.faults;
        for (const c of shown) {
          const shownM = displayedMeasure(st, c);
          const trueM = measure(s, c);
          chambers[c] = shownM;
          // keep the true value for the debrief when the set-up changed the reading or was at fault
          if (su.preset || faults.length || !sameMeasure(shownM, trueM)) {
            truth = { ...truth, [c]: trueM };
            faultsAt = { ...faultsAt, [c]: faults };
          } else if (truth?.[c] || faultsAt?.[c]) {
            truth = { ...truth };
            faultsAt = { ...faultsAt };
            delete truth[c];
            delete faultsAt[c];
          }
        }
        const lvAo = shown.includes("LV") && shown.includes("Ao");
        const lvW = shown.includes("LV") && shown.includes("PCWP");
        return {
          ...m,
          rec: {
            ...r,
            chambers,
            ...(truth ? { truth } : {}),
            ...(faultsAt ? { faults: faultsAt } : {}),
            simLVAo: r.simLVAo || lvAo,
            simLVW: r.simLVW || lvW,
            simLVRVResp: r.simLVRVResp || (shown.includes("LV") && shown.includes("RV") && st.resp),
            ...(lvAo ? { aorticMeanGradient: shownGradient(aorticGradient(s).mean) } : {}),
            ...(lvW ? { mitralMeanGradient: shownGradient(mitralGradient(s)) } : {}),
          },
        };
      });
      const missed = su.tableMoved && !su.relevelledAfterMove;
      const setup = su.preset
        ? { ...su, recordsFaulty: su.recordsFaulty + (faults.length ? 1 : 0), recordsClean: su.recordsClean + (faults.length ? 0 : 1), recordedBeforeRelevel: su.recordedBeforeRelevel || missed }
        : missed && !su.recordedBeforeRelevel
          ? { ...su, recordedBeforeRelevel: true }
          : st.setup;
      return { ...next, ...(setup ? { setup } : {}), lastAction: "record", satRun: false };
    }
    case "sat": {
      const s = studyScenario(st);
      const next = patchSet(st, (m) => ({ ...m, rec: { ...m.rec, sats: { ...m.rec.sats, [a.site]: s.sats[a.site] } } }));
      return { ...next, lastAction: "sat", satRun: st.satRun || RUN_SITES.includes(a.site) };
    }
    case "calc-panel":
      return { ...st, calcOpen: a.open, lastAction: a.open ? "calc" : st.lastAction };
    case "enter": {
      if (!Number.isFinite(a.value) || !calcAvailable(st, a.key)) return st;
      const ref = referenceValue(studyTruth(st), a.key);
      const ok = withinTolerance(a.key, a.value, ref);
      return {
        ...patchSet(st, (m) => {
          const prev = m.entries[a.key];
          const entry: CalcEntry = { value: a.value, attempts: (prev?.attempts ?? 0) + 1, accepted: ok, firstAccepted: prev ? prev.firstAccepted : ok };
          return { ...m, entries: { ...m.entries, [a.key]: entry } };
        }),
        lastAction: "calc",
      };
    }
    case "show-formula":
      return { ...st, formulaShown: { ...st.formulaShown, [a.key]: true } };
    case "decide":
      if (st.set !== "post") return st;
      return patchSet(st, (m) => ({ ...m, decision: a.action }));
    case "next-set": {
      if (st.set !== "pre") return st;
      return { ...st, set: "post", sets: { ...st.sets, post: st.sets.post ?? EMPTY_SET }, lastAction: "set", satRun: false };
    }
    case "answer": {
      const n = diagnosisOptions(baseScenario(st)).length;
      if (a.index < 0 || a.index >= n) return st;
      return { ...st, answer: a.index };
    }
    case "raise":
      return st.raised.includes(a.event) ? st : { ...st, raised: [...st.raised, a.event] };
    case "clear-event":
      return st.raised.includes(a.event) ? { ...st, raised: st.raised.filter((e) => e !== a.event) } : st;
    default:
      return setupReducer(st, a);
  }
}

const sameMeasure = (a: ChamberMeasure, b: ChamberMeasure) => a.sys === b.sys && a.dia === b.dia && a.mean === b.mean && a.edp === b.edp && a.a === b.a && a.v === b.v;

/** Move the table: a table-mounted transducer moves with it (and stays level if it was), a pole-mounted one stays where it is. */
function moveTable(su: TransducerSetup, deltaCm: number): TransducerSetup {
  if (!deltaCm) return su;
  const after: TransducerSetup = { ...su, tableCm: su.tableCm + deltaCm, transducerCm: su.mount === "table" ? su.transducerCm + deltaCm : su.transducerCm, tableMoved: true };
  return { ...after, relevelledAfterMove: su.mount === "table" ? isLevel(after) : false };
}

/**
 * The table-move preset: the table goes up at the first catheter move after the set-up is done,
 * wherever the catheter is (a catheter put in before the set-up does not skip the move).
 */
function withTableMove(prev: HaemoStudyState, next: HaemoStudyState): HaemoStudyState {
  const su = studySetup(prev);
  if (!su.tableMovePending || !setupComplete(su)) return next;
  return { ...next, setup: moveTable({ ...su, tableMovePending: false }, MP_TABLE_MOVE_CM) };
}

type SetupAction = Extract<HaemoAction, { type: `setup-${string}` | `manifold-${string}` }>;

/** The transducer set-up actions. */
function setupReducer(st: HaemoStudyState, a: SetupAction): HaemoStudyState {
  const su = studySetup(st);
  const put = (setup: TransducerSetup): HaemoStudyState => ({ ...st, setup, lastAction: "setup" });
  switch (a.type) {
    case "setup-level": {
      const transducerCm = su.tableCm + landmarkHeightCm(a.landmark);
      return put({ ...su, transducerCm, landmark: a.landmark, relevelledAfterMove: su.tableMoved ? Math.abs(transducerCm - su.tableCm - landmarkHeightCm("mid-thoracic")) <= MP_HAEMO_LEVEL_TOL_CM : su.relevelledAfterMove });
    }
    case "setup-mount":
      // moving the transducer between the pole and the table rail keeps its height
      if (a.mount === su.mount || (a.mount !== "pole" && a.mount !== "table")) return st;
      return put({ ...su, mount: a.mount });
    case "setup-check-level":
      return put({ ...su, levelChecks: su.levelChecks + 1, lastCheck: levelObservation(su) });
    case "setup-table":
      if (!Number.isFinite(a.deltaCm)) return st;
      return put(moveTable(su, a.deltaCm));
    case "setup-stopcock":
      if ((a.to === "air") === su.openToAir) return st;
      return put({ ...su, openToAir: a.to === "air" });
    case "setup-zero":
      // the monitor zeroes only with the transducer open to air
      if (!su.openToAir) return put({ ...su, zeroRefused: su.zeroRefused + 1 });
      return put({ ...su, zeroRef: su.drift, zeroed: true });
    case "setup-fast-flush":
      return put({ ...su, flushes: su.flushes + 1, lastFlush: lineReading(su), awaitingReading: true });
    case "setup-read-flush":
      if (!su.awaitingReading || !su.lastFlush) return st;
      return put({ ...su, awaitingReading: false, readings: [...su.readings, { given: a.reading, expected: su.lastFlush.reading }] });
    case "setup-fix": {
      const line = { ...su.line };
      if (a.fix === "reprime") line.airMl = 0;
      else if (a.fix === "straighten") line.kinked = false;
      else if (a.fix === "aspirate") line.clot = false;
      else line.long = false;
      return put({ ...su, line, awaitingReading: false });
    }
    case "manifold-flush": {
      if (!Number.isInteger(a.port) || a.port < 0 || a.port >= su.manifold.length) return st;
      const manifold = su.manifold.map((p, i) => (i === a.port ? { air: false, hidden: false } : p));
      return put({ ...su, manifold });
    }
    case "manifold-inspect":
      return put({ ...su, inspected: true, manifold: su.manifold.map((p) => ({ ...p, hidden: false })) });
    case "manifold-inject": {
      // flushing the catheter through the manifold needs a catheter in the patient
      if (st.rhc < 0 && st.lhc === "none") return st;
      const air = su.manifold.some((p) => p.air);
      return put({ ...su, injections: su.injections + 1, airInjected: su.airInjected || air, manifold: air ? su.manifold.map(() => ({ air: false, hidden: false })) : su.manifold });
    }
    default:
      // an unrecognised action (e.g. from a dev hook) leaves the study as it was
      return st;
  }
}

/** Every phase the study reports (the reachability report reads them through haemoTips.ts). */
export const HAEMO_STUDY_PHASES = ["setup", "right-heart", "left-heart", "valves", "shunts", "calculations"] as const satisfies readonly LabPhase[];

/** Timeline values a learner reads off the recorder for the Gorlin formulas (s). */
export function recorderTimings(st: HaemoStudyState): { sep: number; dfp: number; hr: number } {
  const s = studyScenario(st);
  const tl = timeline(s);
  return { sep: tl.sep, dfp: tl.dfp, hr: s.hr };
}
