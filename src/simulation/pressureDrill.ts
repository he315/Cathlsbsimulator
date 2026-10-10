// ===========================================================================
// Timed pressure-trace recognition drill (diag-pressure-recognition-drill).
//
// Every item is a trace the patient engine makes, not a drawing: a headless
// PatientEngine runs the item's script (a tip input from the transducer
// chain's tip chamber, a transducer fault, a valve area or a hypotension cause
// from the shared cause model) and the learner reads the monitor at real speed,
// names the trace and chooses the first action before the time limit, with a
// stated confidence. Each item runs as:
//
//   settle    MP_DRILL.settleS with the tip free in the aortic root; the
//             displayed pressure then is the item's baseline, which the stem
//             states ('judge each trace against the one you recorded before
//             engaging', 07-engaging.ts, Oxford ch 6)
//   pre       the item's run-up (an engaged catheter while a cause takes
//             effect, or a line fault already present), not shown
//   window    MP_DRILL.windowS shown at real speed; at MP_DRILL.eventAtS the
//             item's action happens: every item is one of two scripts, the
//             catheter advanced from the root to engage, or withdrawn from the
//             ostium to the root
//
// The stems do not name the answer: each states the catheter (end hole or
// side holes) and its script, and one context line (a drug given, the
// patient's state, a flush), the item's own or one drawn for it from a shared
// pool, so within every set each part of a stem is shared by several names.
//
// The items are the patterns of the lab request pm-engaging#0 (lesson
// pm-engaging-trace and pm-engaging-damping, 07-engaging.ts): a free aortic
// trace, damping, ventricularisation, a wedged tip, catheter-tip spasm
// ('ventricularises, then falls further a few seconds later'), the slow small
// pulse of aortic stenosis that only looks damped, true hypotension after a
// nitrate, after radial verapamil, in a vasovagal reaction and in a fasted
// hypovolaemic patient (Brilakis, 07-engaging.ts: 'so disengage first. If the
// trace stays low with the tip free in the root, check the transducer and its
// connections, and if the pressure is real, treat the patient'), a side-hole
// catheter whose trace stays normal over a wedged end hole (Oxford ch 6), and
// the line faults that damp every trace, already present when the window opens:
// air in the transducer, the transducer switched off and disconnected
// (07-engaging.ts, line 96 and 193), and the left ventricular trace of a tip
// that crossed the valve (TEACHING 'lv-danger', src/data/teachingText.ts).
// The first actions are the module's: withdraw slightly first for a damped,
// ventricularised or wedged trace, for spasm and for the ventricle (Brilakis 5.6, 5.8; 'a test
// injection is never part of the damping algorithm'), confirm a side-hole
// catheter's position on fluoroscopy before a gentle test puff (Oxford ch 6),
// check the transducer for a trace damped with the tip free, and for a low
// trace with the tip free check the transducer and treat the patient.
//
// The reveal's tips come from tipsFor with lab 'diagnostic', phase 'inject',
// the item's pressure kind and the events its trace raised (the same tip-state
// transitions the lab session raises, with wedged read as damped), keeping the
// tips tied to the trace (drillTips); `raises`
// below lists them for the reachability report. Agreement is Cohen's kappa on
// the names and calibration the Brier score of the stated confidence
// (src/ui/angio/library.ts); items are drawn by stratified sampling, one per
// item type of the chosen set, with a seeded generator, so a seed gives the
// same order every time.
//
// Every number below is a MODEL PARAMETER of the drill
// (docs/realism/facts/pkg-diag-pressure-recognition-drill.md) unless its
// source is named beside it. The engines keep their defaults: the drill sets
// only per-engine state (the tip, a fault, a valve area, a cause, the
// diagnostic lab's tip-spasm model with a faster rise for the spasm item).
// ===========================================================================

import { PatientEngine } from "./patient/engine";
import type { TipInput, TipPressureState, TransducerFault } from "./patient/transducer";
import { startHypotensionCause, type CauseRun } from "./patient/hypotensionCauses";
import { pressureSetups } from "./diagnosticScenarios/pressure";
import { brier, cohenKappa, rng, stratifiedSample, type Kappa } from "../ui/angio/library";
import { PATIENT_EVENT_THRESHOLDS } from "../ui/lab/patientEvents";
import { LAB_TIPS, tipsFor, type LabContext, type LabEvent, type LabTip } from "../content/lab/tips";
import type { LabRaises } from "../content/lab/raisable/waiting";
import type { PressureKind } from "../types";

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export const DRILL_ITEM_TYPES = [
  "free",
  "damped",
  "ventricularised",
  "wedged",
  "spasm",
  "aortic-stenosis",
  "hypo-nitrate",
  "hypo-verapamil",
  "hypo-vagal",
  "hypo-hypovolaemia",
  "side-hole-wedged",
  "line-air",
  "line-off",
  "line-disconnected",
  "lv",
] as const;
export type DrillItemType = (typeof DRILL_ITEM_TYPES)[number];

/** What the learner can call a trace. */
export const DRILL_NAMES = ["free", "damped", "ventricularised", "wedged", "spasm", "aortic-stenosis", "hypotension", "line-fault", "side-holes", "lv"] as const;
export type DrillName = (typeof DRILL_NAMES)[number];
export const DRILL_NAME_LABEL: Readonly<Record<DrillName, string>> = {
  free: "Free aortic trace",
  damped: "Damped",
  ventricularised: "Ventricularised",
  wedged: "Wedged: pressure lost at the tip",
  spasm: "Catheter-tip spasm",
  "aortic-stenosis": "Slow, small aortic stenosis pulse",
  hypotension: "True hypotension",
  "line-fault": "Transducer or line fault",
  "side-holes": "Normal only through side holes",
  lv: "Left ventricular trace",
};

/** The first action the learner chooses. */
export const DRILL_ACTIONS = ["inject", "withdraw", "aspirate", "check-transducer", "screen", "treat-patient"] as const;
export type DrillAction = (typeof DRILL_ACTIONS)[number];
export const DRILL_ACTION_LABEL: Readonly<Record<DrillAction, string>> = {
  inject: "Test puff, then inject",
  withdraw: "Withdraw slightly",
  aspirate: "Aspirate the catheter",
  "check-transducer": "Check the transducer and line",
  screen: "Confirm the position on fluoroscopy first",
  "treat-patient": "Treat the patient",
};

/** The sets a launch can open (LaunchParams 'set'). */
export const DRILL_SETS = ["damping", "hypotension", "faults", "all"] as const;
export type DrillSet = (typeof DRILL_SETS)[number];
export const DRILL_SET_LABEL: Readonly<Record<DrillSet, string>> = {
  damping: "Damped or not",
  hypotension: "Low pressure: catheter, line or patient",
  faults: "Line faults",
  all: "Every pattern",
};

/** The scenario ids of src/content/practice/diag-pressure-recognition-drill.launch.ts, by set. */
export const DRILL_SCENARIO_OF_SET: Readonly<Record<DrillSet, string>> = {
  damping: "pressure-damping",
  hypotension: "pressure-hypotension",
  faults: "pressure-faults",
  all: "pressure-all",
};

/** The set a launch names: its 'set' param, else its scenario id; null when it names neither. */
export function drillSetFromParams(p: Record<string, string> | null | undefined): DrillSet | null {
  if (!p) return null;
  if (p.set && (DRILL_SETS as readonly string[]).includes(p.set)) return p.set as DrillSet;
  const bySc = (Object.keys(DRILL_SCENARIO_OF_SET) as DrillSet[]).find((s) => DRILL_SCENARIO_OF_SET[s] === p.scenario);
  return bySc ?? null;
}

// ---------------------------------------------------------------------------
// Model parameters
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of the drill (not sourced unless stated). */
export const MP_DRILL = {
  /** seconds with the tip free in the root before anything, for the baseline */
  settleS: 4,
  /** seconds of trace shown per item */
  windowS: 8,
  /** seconds into the window at which the item's action happens */
  eventAtS: 3,
  /** seconds from the start of the trace in which the learner must answer (the lab request asks for a time limit; its length is not sourced) */
  answerLimitS: 12,
  /** step of the headless run, s */
  stepS: 0.02,
  /** the displayed class is sampled this often in the window, s */
  sampleEveryS: 0.25,
  /** the open fraction of the ostium (TipInput.gap) for a coaxial seat, for a seat against the wall, for a seat that obstructs the ostium, and for a tip pushed deep */
  gap: { coaxial: 0.8, damped: 0.15, ventricularised: 0.11, wedged: 0, spasmSeat: 0.11 },
  /** tip wall contact (model units, TipInput.wallContact) of a seat that provokes spasm, and of an ordinary seat */
  wallContact: { spasm: 1.6, seat: 0.1 },
  /**
   * The rise of catheter-tip spasm for the spasm item, s. The module text says the trace 'ventricularises
   * and then falls a few seconds after engagement' (07-engaging.ts, Oxford ch 6); the diagnostic lab's
   * model rises with MP_TIP_SPASM.riseTauS (25 s), so the drill's own engine is given this faster rise.
   */
  spasmRiseTauS: 1.5,
  /** run-up seconds of each hypotension cause before the window (the cause takes effect while the catheter is engaged) */
  causeLeadS: { "gtn-pde5": 60, verapamil: 60, vagal: 30, fasting: 270 } as Readonly<Record<string, number>>,
  /** air a flush leaves in the transducer for the air item, mL */
  lineAirMl: 0.3,
  /** seconds a line fault is present before the window: it is on the trace when the window opens, and the displayed class reads damped from the window's first sample on every drill patient (pressureDrill.test.ts) */
  faultLeadS: 6,
  /** items per item type in a set (stratified sampling) */
  perType: 1,
} as const;

/**
 * True hypotension: a systolic below about 90 mmHg (the physiologist's call-out in the Oxford team model,
 * 07-engaging.ts line 155, 'as a rule of thumb a systolic below 90 mmHg'; labTeam.ts MP_CALLOUT_SYSTOLIC_MMHG).
 */
export const DRILL_HYPOTENSION_SYS_MMHG = 90;

/** The severe aortic stenosis valve area of the diag-as-pulse-not-damping scenario (diagnosticScenarios/pressure.ts; MODEL PARAMETER inside the module's severe band). */
export const DRILL_AS_AVA_CM2 = pressureSetups["diag-as-pulse-not-damping"].aorticValveAreaCm2 ?? 0.7;

/**
 * Patients the items are drawn on (generatePatient seeds, all in sinus rhythm), checked by pressureDrill.test.ts
 * for every item type: on each of them every item's trace reads its label and each hypotension cause takes the
 * true systolic below DRILL_HYPOTENSION_SYS_MMHG. MODEL PARAMETERS (a choice of seeds; patients with a higher
 * resting pressure keep a systolic above 90 mmHg after the vasodilator causes, and the gap bands of damping and
 * ventricularisation shift a little from patient to patient).
 */
export const DRILL_PATIENTS: readonly string[] = ["pd-4", "pd-21", "pd-22", "pd-33", "pd-49"];

// ---------------------------------------------------------------------------
// Item specifications
// ---------------------------------------------------------------------------

type Side = "left" | "right";
const seat = (side: Side, gap: number, extra: Partial<TipInput> = {}): TipInput => ({ location: "ostium", side, gap, wallContact: MP_DRILL.wallContact.seat, ...extra });
const ROOT: TipInput = { location: "aorta" };

/**
 * What the stem says happens in the window. Every item uses one of two scripts, so the stem's action does
 * not name the answer (each script is shared by several names in every set; pressureDrill.test.ts checks):
 *   seat      the catheter is in the root and at MP_DRILL.eventAtS it is advanced to engage the left main
 *   withdraw  the catheter is engaged and at MP_DRILL.eventAtS it is withdrawn to the root
 */
export type DrillScript = "seat" | "withdraw";

export interface DrillItemSpec {
  type: DrillItemType;
  /** the debrief's name of the pattern */
  title: string;
  /** what the stem says happens in the window */
  script: DrillScript;
  /** the catheter has side holes (stated on every item's stem, and set on its tip inputs) */
  sideHoles: boolean;
  /**
   * The item's own context line, shown on every draw (the drug given, the patient's state). Items without one
   * show a line drawn from DRILL_CONTEXT_POOL, so a context line does not name the answer.
   */
  context?: string;
  /** the correct name */
  name: DrillName;
  /** first actions that count as correct (the first is the module's) */
  actions: readonly DrillAction[];
  /** the class the displayed trace reads at the end of the window (vitals().tipState, as the operator sees it) */
  label: TipPressureState;
  /** the class of the tip itself at the end (classifyTip of the tip pressure, PatientEngine.physicalTipState) */
  tipLabel: TipPressureState;
  /** case events the item carries whatever its trace does (a drug given, the valve, a spasm) */
  events: readonly LabEvent[];
  /** why the answer is what it is, shown on the reveal */
  why: string;
  lessonId: string;
  sets: readonly DrillSet[];
  /** the patients it is drawn on */
  patients: readonly string[];
  /** the engine's valve area, cm² */
  valveAreaCm2?: number;
  /** the run-up before the window, not shown: the tip, its length, a hypotension cause, a line fault already present */
  pre?: { tip: TipInput; seconds: number; cause?: string; fault?: TransducerFault };
  /** air the line fault leaves in the transducer, mL (in place of the fault's own MP_FAULT_AIR_ML when larger) */
  airMl?: number;
  /** the tip at the start of the window, and what happens at MP_DRILL.eventAtS */
  start: TipInput;
  at: { tip?: TipInput; fault?: TransducerFault };
  /** the diagnostic lab's tip-spasm model, with the drill's rise (spasm item) */
  spasm?: boolean;
}

/** The context lines of the stems; an item without its own line shows one of these, drawn per session. */
export const DRILL_CONTEXT = {
  nitrate: "Intracoronary nitrate was given a minute ago.",
  verapamil: "Verapamil was given through the radial sheath a minute ago.",
  vagal: "The patient has gone quiet and clammy.",
  fasted: "Fasted since last night with no fluid running.",
  flushed: "The line was flushed from the manifold a minute ago.",
} as const;
export const DRILL_CONTEXT_POOL: readonly string[] = Object.values(DRILL_CONTEXT);

const G = MP_DRILL.gap;
const DAMPING_WHY =
  "A damped trace: do not inject. Withdraw slightly first, then aspirate, check the transducer and screen for a kink; if none restores the trace, remove the catheter under suction and aspirate the sheath (Brilakis 5.6). A test injection is never part of the damping algorithm.";

/** The root position of the side-hole catheter (the side-hole item and the air item). */
const ROOT_SH: TipInput = { location: "aorta", sideHoles: true };

export const DRILL_ITEMS: Readonly<Record<DrillItemType, DrillItemSpec>> = {
  free: {
    type: "free",
    title: "Free aortic trace",
    script: "seat",
    sideHoles: false,
    name: "free",
    actions: ["inject"],
    label: "aortic",
    tipLabel: "aortic",
    events: [],
    why: "The trace after seating matches the root trace before it in height and shape, dicrotic notch included: a free trace. A test puff confirms a coaxial position; look at the trace and the ECG again before each run.",
    lessonId: "pm-engaging-trace",
    sets: ["damping", "hypotension", "faults", "all"],
    patients: DRILL_PATIENTS,
    start: ROOT,
    at: { tip: seat("left", G.coaxial) },
  },
  damped: {
    type: "damped",
    title: "Damped trace",
    script: "seat",
    sideHoles: false,
    name: "damped",
    actions: ["withdraw"],
    label: "damped",
    tipLabel: "damped",
    events: [],
    why: `After seating, the trace falls away from the root trace in height and shape and loses its notch. ${DAMPING_WHY}`,
    lessonId: "pm-engaging-damping",
    sets: ["damping", "hypotension", "faults", "all"],
    patients: DRILL_PATIENTS,
    start: ROOT,
    at: { tip: seat("left", G.damped) },
  },
  ventricularised: {
    type: "ventricularised",
    title: "Ventricularised trace",
    script: "seat",
    sideHoles: false,
    name: "ventricularised",
    actions: ["withdraw"],
    label: "ventricularised",
    tipLabel: "ventricularised",
    events: [],
    why: "Systole is kept but the diastolic pressure is low and rises through diastole: the tip obstructs the ostium (an ostial lesion, the wall, spasm or a small branch). Withdraw until the aortic trace returns and image from just outside the ostium (Brilakis 5.8).",
    lessonId: "pm-engaging-damping",
    sets: ["damping", "all"],
    patients: DRILL_PATIENTS,
    start: ROOT,
    at: { tip: seat("left", G.ventricularised) },
  },
  wedged: {
    type: "wedged",
    title: "Wedged tip",
    script: "seat",
    sideHoles: false,
    name: "wedged",
    actions: ["withdraw"],
    label: "wedged",
    tipLabel: "wedged",
    events: [],
    why: `The pulse is nearly lost and the pressure low: the end hole is wedged. Contrast here can dissect the vessel. ${DAMPING_WHY}`,
    lessonId: "pm-engaging-damping",
    sets: ["damping", "faults", "all"],
    patients: DRILL_PATIENTS,
    start: ROOT,
    at: { tip: seat("left", G.wedged) },
  },
  spasm: {
    type: "spasm",
    title: "Catheter-tip spasm",
    script: "seat",
    sideHoles: false,
    name: "spasm",
    actions: ["withdraw"],
    label: "wedged",
    tipLabel: "wedged",
    events: ["ostial-spasm"],
    why: "The trace ventricularises on seating and then keeps falling a few seconds later, with the catheter not moved: catheter-tip spasm (Oxford ch 6). Withdraw until the aortic trace returns, re-engage carefully (coaxial, not deep) and give intracoronary nitrate only once the trace is free; then record an image showing the spasm has gone.",
    lessonId: "pm-engaging-damping",
    sets: ["damping", "all"],
    patients: DRILL_PATIENTS,
    start: ROOT,
    at: { tip: seat("left", G.spasmSeat, { wallContact: MP_DRILL.wallContact.spasm }) },
    spasm: true,
  },
  "aortic-stenosis": {
    type: "aortic-stenosis",
    title: "Aortic stenosis: slow and small, not damped",
    script: "seat",
    sideHoles: false,
    name: "aortic-stenosis",
    actions: ["inject"],
    label: "aortic",
    tipLabel: "aortic",
    events: ["aortic-stenosis"],
    why: "The pulse is small and slow-rising, but it was the same in the root before seating: the parvus et tardus pulse of aortic stenosis, not damping. Judge each trace against the one recorded before engaging (Oxford ch 6); the tip is free, so the test puff can follow.",
    lessonId: "pm-engaging-trace",
    sets: ["damping", "hypotension", "all"],
    patients: DRILL_PATIENTS,
    valveAreaCm2: DRILL_AS_AVA_CM2,
    start: ROOT,
    at: { tip: seat("left", G.coaxial) },
  },
  "hypo-nitrate": {
    type: "hypo-nitrate",
    title: "True hypotension after a nitrate",
    script: "withdraw",
    sideHoles: false,
    context: DRILL_CONTEXT.nitrate,
    name: "hypotension",
    actions: ["treat-patient", "check-transducer"],
    label: "aortic",
    tipLabel: "aortic",
    events: ["vasodilator-given", "pde5-recent"],
    why: "The pressure stays low with the tip free in the root and the pulse is preserved: the patient's own pressure. The notes showed a PDE-5 inhibitor taken the day before, which deepens the fall after a nitrate. Check the transducer, then treat: no more nitrate, fluid, and a vasopressor if the fall is severe or persists (Brilakis 3.2, 6.3).",
    lessonId: "pm-engaging-trace",
    sets: ["hypotension", "faults", "all"],
    patients: DRILL_PATIENTS,
    pre: { tip: seat("left", G.coaxial), seconds: MP_DRILL.causeLeadS["gtn-pde5"], cause: "gtn-pde5" },
    start: seat("left", G.coaxial),
    at: { tip: ROOT },
  },
  "hypo-verapamil": {
    type: "hypo-verapamil",
    title: "True hypotension after radial verapamil",
    script: "withdraw",
    sideHoles: false,
    context: DRILL_CONTEXT.verapamil,
    name: "hypotension",
    actions: ["treat-patient", "check-transducer"],
    label: "aortic",
    tipLabel: "aortic",
    events: ["vasodilator-given"],
    why: "Low with the tip free in the root and a preserved pulse: verapamil's vasodilation, one of Brilakis's usual causes of real hypotension at angiography. Check the transducer, then treat: no further verapamil, fluid, and a vasopressor if the fall is severe or persists.",
    lessonId: "pm-engaging-trace",
    sets: ["hypotension", "all"],
    patients: DRILL_PATIENTS,
    pre: { tip: seat("left", G.coaxial), seconds: MP_DRILL.causeLeadS.verapamil, cause: "verapamil" },
    start: seat("left", G.coaxial),
    at: { tip: ROOT },
  },
  "hypo-vagal": {
    type: "hypo-vagal",
    title: "True hypotension in a vasovagal reaction",
    script: "withdraw",
    sideHoles: false,
    context: DRILL_CONTEXT.vagal,
    name: "hypotension",
    actions: ["treat-patient", "check-transducer"],
    label: "aortic",
    tipLabel: "aortic",
    events: ["vagal"],
    why: "Slow, then low, and still low with the tip free in the root: a vasovagal reaction. Check the line, then treat the patient: legs up, atropine and fast saline, and look for another cause if it does not recover within a few minutes.",
    lessonId: "pm-engaging-trace",
    sets: ["hypotension", "all"],
    patients: DRILL_PATIENTS,
    pre: { tip: seat("left", G.coaxial), seconds: MP_DRILL.causeLeadS.vagal, cause: "vagal" },
    start: seat("left", G.coaxial),
    at: { tip: ROOT },
  },
  "hypo-hypovolaemia": {
    type: "hypo-hypovolaemia",
    title: "True hypotension in a fasted patient",
    script: "withdraw",
    sideHoles: false,
    name: "hypotension",
    actions: ["treat-patient", "check-transducer"],
    label: "aortic",
    tipLabel: "aortic",
    events: [],
    why: "Low and fast with the tip free in the root: hypovolaemia in a patient fasted since the night before with no fluid running (Brilakis). Check the transducer, then treat the patient with fluid.",
    lessonId: "pm-engaging-trace",
    sets: ["hypotension", "faults", "all"],
    patients: DRILL_PATIENTS,
    pre: { tip: seat("left", G.coaxial), seconds: MP_DRILL.causeLeadS.fasting, cause: "fasting" },
    start: seat("left", G.coaxial),
    at: { tip: ROOT },
  },
  "side-hole-wedged": {
    type: "side-hole-wedged",
    title: "Side holes over a wedged end hole",
    script: "seat",
    sideHoles: true,
    name: "side-holes",
    actions: ["screen"],
    label: "aortic",
    tipLabel: "aortic",
    events: [],
    why: "The trace stays normal, but the side holes keep sampling the aorta while the end hole is wedged (Oxford ch 6): with side holes a normal trace reassures less. The trace alone cannot tell this from a free trace; the catheter's side holes decide the name. Confirm the position on fluoroscopy, keep the test puff gentle, and watch the ECG and the patient.",
    lessonId: "pm-engaging-trace",
    sets: ["damping", "faults", "all"],
    patients: DRILL_PATIENTS,
    start: ROOT_SH,
    at: { tip: seat("left", G.wedged, { sideHoles: true }) },
  },
  "line-air": {
    type: "line-air",
    title: "Air in the transducer",
    script: "seat",
    sideHoles: true,
    name: "line-fault",
    actions: ["check-transducer"],
    label: "damped",
    tipLabel: "aortic",
    events: [],
    why: "The trace was already damped in the root, against the root pressure recorded first, before the catheter moved, and seating changed nothing: the line, not the tip. A bubble left in the transducer by a flush damps every trace; clear it, and confirm with a fast flush (07-engaging.ts: 'fixing the transducer last when it is the cause').",
    lessonId: "pm-engaging-damping",
    sets: ["damping", "faults", "all"],
    patients: DRILL_PATIENTS,
    pre: { tip: ROOT_SH, seconds: MP_DRILL.faultLeadS, fault: "air-bubble" },
    airMl: MP_DRILL.lineAirMl,
    start: ROOT_SH,
    at: { tip: seat("left", G.coaxial, { sideHoles: true }) },
  },
  "line-off": {
    type: "line-off",
    title: "Transducer switched off to the patient",
    script: "withdraw",
    sideHoles: false,
    name: "line-fault",
    actions: ["check-transducer"],
    label: "damped",
    tipLabel: "aortic",
    events: [],
    why: "The trace is flat at the pressure it held while the catheter was engaged, and stays flat with the tip withdrawn free into the root: the transducer is off to the patient. Turn it back to the patient before anything else.",
    lessonId: "pm-engaging-damping",
    sets: ["hypotension", "faults", "all"],
    patients: DRILL_PATIENTS,
    pre: { tip: seat("left", G.coaxial), seconds: MP_DRILL.faultLeadS, fault: "off" },
    start: seat("left", G.coaxial),
    at: { tip: ROOT },
  },
  "line-disconnected": {
    type: "line-disconnected",
    title: "Pressure line disconnected",
    script: "withdraw",
    sideHoles: false,
    name: "line-fault",
    actions: ["check-transducer"],
    label: "damped",
    tipLabel: "aortic",
    events: [],
    why: "The trace is a flat line near zero while engaged and stays flat with the tip withdrawn free into the root: the line is disconnected (atmosphere at the transducer). Reconnect it and look again before any injection.",
    lessonId: "pm-engaging-damping",
    sets: ["faults", "all"],
    patients: DRILL_PATIENTS,
    pre: { tip: seat("left", G.coaxial), seconds: MP_DRILL.faultLeadS, fault: "disconnected" },
    start: seat("left", G.coaxial),
    at: { tip: ROOT },
  },
  // The left ventricular trace of the old Pressure safety page (TEACHING 'lv-danger', src/data/teachingText.ts:
  // a catheter that crosses the valve gives an LV trace, an injection there is a ventriculogram, withdraw to the
  // root rather than push); LVEDP 3-12 mmHg is Oxford's normal (cath-handbook 05-specific-conditions.ts).
  lv: {
    type: "lv",
    title: "Left ventricular trace",
    script: "seat",
    sideHoles: false,
    name: "lv",
    actions: ["withdraw"],
    label: "lv",
    tipLabel: "lv",
    events: [],
    why: "The systolic pressure holds but the diastolic falls each beat to the ventricle's own low level (Oxford gives a normal LVEDP of 3-12 mmHg): the tip crossed the aortic valve as it was advanced. An injection here is a ventriculogram, never a coronary picture. Withdraw to the root rather than pushing, then engage again.",
    lessonId: "pm-engaging-trace",
    sets: ["damping", "all"],
    patients: DRILL_PATIENTS,
    start: ROOT,
    at: { tip: { location: "lv", lvContact: false } },
  },
};

/** The stem's action sentence for an item: the catheter (side holes or not) and its script. */
export function drillStemAction(type: DrillItemType): string {
  const spec = DRILL_ITEMS[type];
  const cath = spec.sideHoles ? "A side-hole left Judkins" : "An end-hole left Judkins";
  return spec.script === "seat"
    ? `${cath} is in the root; at ${MP_DRILL.eventAtS} s it is advanced to engage the left main.`
    : `${cath} is engaged in the left main; at ${MP_DRILL.eventAtS} s it is withdrawn to the root.`;
}

/** The parts a stem of an item can show: its action sentence and the context lines it can be drawn with. */
export function drillStemParts(type: DrillItemType): { action: string; contexts: readonly string[] } {
  const own = DRILL_ITEMS[type].context;
  return { action: drillStemAction(type), contexts: own ? [own] : DRILL_CONTEXT_POOL };
}

/** The stem shown for a drawn item: its context line (its own, or the one drawn for it) and its action sentence. */
export function drillStem(ref: DrillItemRef): string {
  const spec = DRILL_ITEMS[ref.type];
  const context = spec.context ?? ref.context ?? "";
  return context ? `${context} ${drillStemAction(ref.type)}` : drillStemAction(ref.type);
}

/** The item types of a set, in catalogue order. */
export function setTypes(set: DrillSet): DrillItemType[] {
  return DRILL_ITEM_TYPES.filter((t) => DRILL_ITEMS[t].sets.includes(set));
}

// ---------------------------------------------------------------------------
// One item's trace on its own engine
// ---------------------------------------------------------------------------

/** The pressure kind of the lab tips for a tip state (wedged reads as damped, as in the lab's context). */
export function pressureKindOf(s: TipPressureState): PressureKind | undefined {
  if (s === "aortic" || s === "damped" || s === "ventricularised" || s === "lv") return s;
  if (s === "wedged") return "damped";
  return undefined;
}

/**
 * One item running on its own patient engine: built and run up to the window on construction, then
 * advanced through the window (and beyond, while the learner answers) by the caller. Deterministic: the same
 * type and patient give the same trace. With `deferPre` the run-up is left to the caller, in slices of
 * `preStep` (the fasting cause's run-up is minutes of engine time, too long to compute in one frame).
 */
export class DrillRun {
  readonly engine: PatientEngine;
  readonly spec: DrillItemSpec;
  /** the displayed pressure with the tip free in the root before anything (the stem's baseline) */
  readonly baseline: { sys: number; dia: number };
  /** the tip now */
  tip: TipInput;
  private cause: CauseRun | null = null;
  private applied = false;
  private nextSample = 0;
  /** run-up seconds still to run before the window */
  private preLeft = 0;
  private windowT0 = NaN;
  /** air the item's line fault leaves in the transducer (spec.airMl), mL */
  private airMl: number | null = null;
  /** the displayed class sampled through the window (every MP_DRILL.sampleEveryS) */
  readonly classes: TipPressureState[] = [];

  constructor(
    type: DrillItemType,
    readonly patientSeed: string,
    opts: { deferPre?: boolean } = {},
  ) {
    const spec = DRILL_ITEMS[type];
    this.spec = spec;
    const e = new PatientEngine({ seed: patientSeed, ...(spec.valveAreaCm2 !== undefined ? { aorticValveAreaCm2: spec.valveAreaCm2 } : {}) });
    this.engine = e;
    e.transducer.zero();
    // the class the operator reads: a trace the line shows damped is damped (pci-patient-coupling's option)
    e.setDisplayedDampingClass(true);
    if (spec.spasm) e.setTipSpasmModel({ ...e.tipSpasmModelForTree(), riseTauS: MP_DRILL.spasmRiseTauS });
    this.tip = ROOT;
    e.setTip(ROOT);
    e.advance(MP_DRILL.settleS);
    const art = e.vitals().art;
    this.baseline = { sys: Math.round(art?.sys ?? 0), dia: Math.round(art?.dia ?? 0) };
    if (spec.airMl !== undefined) this.airMl = spec.airMl;
    if (spec.pre) {
      this.setTip(spec.pre.tip);
      if (spec.pre.cause) this.cause = startHypotensionCause(spec.pre.cause, e);
      if (spec.pre.fault) this.applyFault(spec.pre.fault);
      this.preLeft = spec.pre.seconds;
    }
    if (!opts.deferPre) this.preStep(Infinity);
  }

  /** The run-up is done and the window has begun. */
  get ready(): boolean {
    return Number.isFinite(this.windowT0);
  }

  /** patient time at the start of the window (NaN until the run-up is done) */
  get t0(): number {
    return this.windowT0;
  }

  /** Run up to `seconds` more of the run-up; true once the window has begun. */
  preStep(seconds: number): boolean {
    if (this.ready) return true;
    const h = Math.min(Math.max(0, seconds), this.preLeft);
    if (h > 0) this.run(h);
    this.preLeft -= h;
    if (this.preLeft <= 1e-9) {
      this.setTip(this.spec.start);
      this.engine.drainEvents();
      this.windowT0 = this.engine.time;
    }
    return this.ready;
  }

  private setTip(tip: TipInput) {
    this.tip = tip;
    this.engine.setTip(tip);
  }

  private applyFault(f: TransducerFault) {
    const tr = this.engine.transducer;
    tr.setFault(f);
    if (f === "air-bubble" && this.airMl !== null) tr.setAir(Math.max(tr.st.airMl, this.airMl));
  }

  /** seconds of the window shown so far (0 before the run-up is done) */
  get elapsed(): number {
    return this.ready ? this.engine.time - this.windowT0 : 0;
  }

  private run(seconds: number) {
    let left = seconds;
    while (left > 1e-9) {
      const h = Math.min(MP_DRILL.stepS, left);
      this.engine.advance(h);
      this.cause?.tick(this.engine, h);
      left -= h;
    }
  }

  /** Advance the window by dt (wall time when it plays, any length headless), applying the item's action on time. */
  advance(dt: number): void {
    if (!this.ready) this.preStep(Infinity);
    let left = Math.max(0, dt);
    while (left > 1e-9) {
      const toEvent = !this.applied ? MP_DRILL.eventAtS - this.elapsed : Infinity;
      const h = Math.min(MP_DRILL.stepS, left, toEvent > 1e-9 ? toEvent : MP_DRILL.stepS);
      this.engine.advance(h);
      this.cause?.tick(this.engine, h);
      left -= h;
      if (!this.applied && this.elapsed >= MP_DRILL.eventAtS - 1e-9) this.applyEvent();
      if (this.elapsed >= this.nextSample && this.nextSample <= MP_DRILL.windowS + 1e-9) {
        this.classes.push(this.engine.vitals().tipState);
        this.nextSample += MP_DRILL.sampleEveryS;
      }
    }
    // the drill reads no telemetry; keep the engine's queue empty
    this.engine.drainEvents();
  }

  private applyEvent() {
    this.applied = true;
    const at = this.spec.at;
    if (at.tip) this.setTip(at.tip);
    if (at.fault) this.applyFault(at.fault);
  }

  /** The class the displayed trace reads now, and the tip's own class. */
  state(): { label: TipPressureState; tipLabel: TipPressureState } {
    return { label: this.engine.vitals().tipState, tipLabel: this.engine.physicalTipState() };
  }
}

/** What an item's trace was, measured on the headless run through the whole window. */
export interface DrillTraceResult {
  type: DrillItemType;
  patientSeed: string;
  /** the displayed class at the end of the window */
  label: TipPressureState;
  /** the tip's own class at the end (classifyTip of the tip pressure) */
  tipLabel: TipPressureState;
  /** the tip input at the end */
  tip: TipInput;
  /** the displayed classes sampled through the window */
  classes: TipPressureState[];
  baseline: { sys: number; dia: number };
  /** displayed and true numbers at the end */
  end: { sys: number; dia: number; trueSys: number; hr: number | null };
  /** the events the item raises for the tips: its own and those of its trace */
  events: LabEvent[];
}

/** Events of a trace: the tip-state transitions the lab session raises (wedged as damped), the patient's and the line's. */
function traceEvents(run: DrillRun): LabEvent[] {
  const out = new Set<LabEvent>(run.spec.events);
  // classes after the window's action: before it the tip is where it was, and the run-up is not shown
  const after = run.classes.slice(Math.floor(MP_DRILL.eventAtS / MP_DRILL.sampleEveryS));
  if (after.some((c) => c === "damped" || c === "wedged")) out.add("pressure-damped");
  if (after.some((c) => c === "ventricularised")) out.add("pressure-ventricularised");
  const e = run.engine;
  const v = e.vitals();
  if (e.transducer.faults().length) out.add("transducer-fault");
  if (run.tip.location === "aorta" && v.aortaTrue.sys < DRILL_HYPOTENSION_SYS_MMHG) out.add("hypotension");
  if (typeof v.hr === "number" && v.hr < PATIENT_EVENT_THRESHOLDS.bradycardiaHr) out.add("bradycardia");
  return DRILL_EVENTS.filter((x) => out.has(x));
}

const RESULTS = new Map<string, DrillTraceResult>();

/** Run an item headless through its window (cached: items are computed once, when first needed). */
export function runDrillItem(type: DrillItemType, patientSeed: string): DrillTraceResult {
  const key = `${type}|${patientSeed}`;
  const hit = RESULTS.get(key);
  if (hit) return hit;
  const run = new DrillRun(type, patientSeed);
  run.advance(MP_DRILL.windowS);
  const v = run.engine.vitals();
  const s = run.state();
  const res: DrillTraceResult = {
    type,
    patientSeed,
    label: s.label,
    tipLabel: s.tipLabel,
    tip: { ...run.tip },
    classes: [...run.classes],
    baseline: run.baseline,
    end: { sys: v.art?.sys ?? NaN, dia: v.art?.dia ?? NaN, trueSys: v.aortaTrue.sys, hr: v.hr },
    events: traceEvents(run),
  };
  RESULTS.set(key, res);
  return res;
}

// ---------------------------------------------------------------------------
// Tips and what the drill raises
// ---------------------------------------------------------------------------

/** Every event a drill item can raise (the reachability report reads `raises`). */
export const DRILL_EVENTS: readonly LabEvent[] = [
  "pressure-damped",
  "pressure-ventricularised",
  "ostial-spasm",
  "aortic-stenosis",
  "hypotension",
  "bradycardia",
  "vagal",
  "vasodilator-given",
  "pde5-recent",
  "transducer-fault",
];

/** What the drill reports to the lab tips: the diagnostic lab at the injection step. */
export const raises: LabRaises = { lab: "diagnostic", phases: ["inject"], events: DRILL_EVENTS };

/** The tip context of an item's reveal: lab 'diagnostic', phase 'inject', its pressure kind and its events. */
export function drillContext(r: Pick<DrillTraceResult, "label" | "events">): LabContext {
  const pressure = pressureKindOf(r.label);
  return { lab: "diagnostic", phase: "inject", events: [...r.events], ...(pressure ? { pressure } : {}) };
}

/** A tip tied to the trace: its trigger names an event, a required event or a pressure kind, which the item's context matched. */
function tiedToTrace(t: LabTip): boolean {
  const w = t.when;
  return !!(w.event?.length || w.requires?.length || w.pressure?.length);
}

/**
 * The one step-only tip the reveal keeps: it ends 'inject only on a free trace', so it goes with the items
 * whose right first action is to inject, and never beside a trace the module forbids injecting into.
 */
const INJECT_STEP_TIP = "diag-test-puff-then-recheck";

/**
 * Tips shown on an item's reveal: of the tips for its context (tipsFor's order), those tied to what the
 * trace raised or read as, and the test-puff tip where the right first action is to inject. Tips that
 * match on the injection step alone (radiation, nitrate dosing, breath-hold) are left to the cath lab.
 */
export function drillTips(r: Pick<DrillTraceResult, "type" | "label" | "events">, limit = 4): LabTip[] {
  const injects = DRILL_ITEMS[r.type].actions.includes("inject");
  return tipsFor(drillContext(r), LAB_TIPS.length)
    .filter((t) => tiedToTrace(t) || (injects && t.id === INJECT_STEP_TIP))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// The session: order, answers and scores
// ---------------------------------------------------------------------------

/** A seed for the generator from a string or number (FNV-1a for strings). */
export function seedNumber(seed: string | number): number {
  if (typeof seed === "number" && Number.isFinite(seed)) return seed >>> 0;
  let h = 0x811c9dc5;
  for (const ch of String(seed)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export interface DrillItemRef {
  type: DrillItemType;
  patientSeed: string;
  /** the context line drawn for an item without its own (DRILL_CONTEXT_POOL) */
  context?: string;
}

/** The items of a set in the order a seed gives: MP_DRILL.perType per item type, on drawn patients, shuffled, each with its stem's context line. */
export function drillOrder(set: DrillSet, seed: string | number, perType: number = MP_DRILL.perType): DrillItemRef[] {
  const pool: DrillItemRef[] = [];
  for (const type of setTypes(set)) for (const patientSeed of DRILL_ITEMS[type].patients) pool.push({ type, patientSeed });
  const order = stratifiedSample(pool, (r) => r.type, perType, rng(seedNumber(`${set}:${seed}`)));
  // a context line for each item without its own, from its own generator so the order is unchanged
  const draw = rng(seedNumber(`${set}:${seed}:context`));
  return order.map((r) => (DRILL_ITEMS[r.type].context ? r : { ...r, context: DRILL_CONTEXT_POOL[Math.floor(draw() * DRILL_CONTEXT_POOL.length) % DRILL_CONTEXT_POOL.length] }));
}

export interface DrillAnswer {
  name: DrillName | null;
  action: DrillAction | null;
  /** stated confidence that the answer is right, 0..1 */
  confidence: number;
  /** seconds from the start of the trace to the answer */
  elapsedS: number;
}

export interface DrillMark {
  ref: DrillItemRef;
  spec: DrillItemSpec;
  result: DrillTraceResult;
  answer: DrillAnswer;
  nameCorrect: boolean;
  actionCorrect: boolean;
  inTime: boolean;
  /** name and action right within the time limit */
  correct: boolean;
  /** an injection chosen for a trace that must not be injected into (damped, ventricularised, wedged, spasm, a line fault, the left ventricle) */
  unsafeInjection: boolean;
  /** tips for the reveal */
  tips: LabTip[];
}

/** Item types on which the module forbids an injection. */
const NO_INJECTION: ReadonlySet<DrillName> = new Set<DrillName>(["damped", "ventricularised", "wedged", "spasm", "line-fault", "lv"]);

/** Mark one answer (pure). */
export function markAnswer(ref: DrillItemRef, answer: DrillAnswer, result: DrillTraceResult = runDrillItem(ref.type, ref.patientSeed)): DrillMark {
  const spec = DRILL_ITEMS[ref.type];
  const inTime = answer.elapsedS <= MP_DRILL.answerLimitS + 1e-9;
  const nameCorrect = answer.name === spec.name;
  const actionCorrect = answer.action !== null && spec.actions.includes(answer.action);
  return {
    ref,
    spec,
    result,
    answer,
    nameCorrect,
    actionCorrect,
    inTime,
    correct: inTime && nameCorrect && actionCorrect,
    unsafeInjection: answer.action === "inject" && NO_INJECTION.has(spec.name),
    tips: drillTips(result),
  };
}

export interface DrillSummary {
  n: number;
  correct: number;
  /** 0..100 */
  score: number;
  /** agreement of the names with the truth (Cohen's kappa over DRILL_NAMES) */
  kappa: Kappa;
  /** Brier score of the stated confidence against being right */
  brier: number;
  unsafeInjections: number;
  timedOut: number;
}

export function summarise(marks: readonly DrillMark[]): DrillSummary {
  const idx = (n: DrillName | null) => (n === null ? -1 : DRILL_NAMES.indexOf(n));
  const correct = marks.filter((m) => m.correct).length;
  return {
    n: marks.length,
    correct,
    score: marks.length ? Math.round((100 * correct) / marks.length) : 0,
    kappa: cohenKappa(
      marks.map((m) => idx(m.spec.name)),
      marks.map((m) => idx(m.answer.name)),
    ),
    brier: brier(
      marks.map((m) => m.answer.confidence),
      marks.map((m) => m.correct),
    ),
    unsafeInjections: marks.filter((m) => m.unsafeInjection).length,
    timedOut: marks.filter((m) => !m.inTime).length,
  };
}

/** A drill session: the items in order, the answers so far, and the reveal context of the last one. */
export class DrillSession {
  readonly items: DrillItemRef[];
  readonly marks: DrillMark[] = [];

  constructor(
    readonly set: DrillSet,
    readonly seed: string | number,
  ) {
    this.items = drillOrder(set, seed);
  }

  get index(): number {
    return this.marks.length;
  }
  get done(): boolean {
    return this.marks.length >= this.items.length;
  }
  current(): DrillItemRef | null {
    return this.items[this.marks.length] ?? null;
  }

  /** Answer the current item. */
  answer(a: DrillAnswer): DrillMark {
    const ref = this.current();
    if (!ref) throw new Error("the drill is finished");
    const m = markAnswer(ref, a);
    this.marks.push(m);
    return m;
  }

  /** The tip context of the last answered item (its reveal), or null before the first answer. */
  context(): LabContext | null {
    const m = this.marks[this.marks.length - 1];
    return m ? drillContext(m.result) : null;
  }

  summary(): DrillSummary {
    return summarise(this.marks);
  }
}
