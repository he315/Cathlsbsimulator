// ---------------------------------------------------------------------------
// The left heart tasks (diag-lv-aorta-task): a diagnostic session module, and
// the controls the table-side Left heart tab (src/ui/lab/controls/tabs/
// LeftHeartTab.tsx) and the image (FluoroView) use through the 'leftHeart'
// capability.
//
// The pigtail's work beyond the coronaries, as the module text teaches it
// (hb-cardiac-catheterisation, src/content/manual/cath-handbook/
// 04-cardiac-catheterisation.ts): cross the valve, read the LVEDP after the a
// wave, set the power injector for it (src/simulation/powerInjector.ts), film
// a ventriculogram or an aortogram, record the pullback and take the catheter
// out over the wire; and the complications that follow from technique.
//
// Where the tip is in the ventricle comes from its position along the LV
// (the rod model's LV, src/physics/lumen.ts lvGeom, when the rod mechanics
// runs; the depth below the valve plane and the side the curve faces in the
// simple model): mid-cavity, the outflow tract, the apex (ectopy), the mitral
// apparatus (catheter-induced MR and ectopy), the papillary region (the
// pigtail caught there will not move until rotated and withdrawn, scripted on
// the simple model's static LV) and the wall (an injection there stains the
// myocardium; the stain leaks into the pericardium and, later, tamponade).
// In the root, a pigtail on the leaflets makes regurgitation
// (catheter-induced AR: the module text's own words are that the catheter must
// not interfere with the leaflets; that it creates or exaggerates AR is the
// author's design choice, labelled so in hb-cardiac-catheterisation#2), and an
// Amplatz pushed onto the valve opens a cusp and the pressure falls.
//
// The difficult valve and a stenotic valve (the scenario's valve,
// src/simulation/diagnosticScenarios/leftHeart.ts): in the simple model the
// pigtail and the J wire do not cross; a JR4 or Amplatz with a straight or
// hydrophilic wire crosses on an attempt with the haemodynamics lab's
// probability (src/simulation/haemo/avCrossing.ts), and a pigtail follows a
// wire left across. In severe aortic stenosis the lab asks first whether
// crossing is indicated (the chart's echo), and valve passages and time at
// the valve are the embolic-risk score avCrossing.ts defines. With the rod
// mechanics the solver decides the crossing (lumen.ts VALVE_OPENING).
//
// Events for the tips (phase lv-aorta from diagnosticContext): lv-ectopy,
// high-lvedp (a recorded LVEDP above 25 mmHg), papillary-entrapment,
// catheter-induced-regurgitation, myocardial-stain, tamponade,
// pulmonary-oedema, hypotension, catheter-too-deep (the tip against the
// wall) and engage-fail (repeated failed valve passes).
//
// Nothing here tells the operator what they could not see: the step log
// records what each action showed (a trace, a number the haemodynamic system
// marks, what the echo shows); the position class is shown only as a guided
// aid (the visibility policy's state chips); the score and the reader's
// comparison are for the debrief. Every number that does not cite the module
// text is a MODEL PARAMETER (docs/realism/facts/pkg-diag-lv-aorta-task.md).
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../../content/lab/tips";
import type { LabRaises } from "../../../content/lab/raisable/waiting";
import type { CArm, Vec3 } from "../../../types";
import { catheterById, catheterFrench } from "../../../data/catheters";
import { lumenForCatheter, LUMENS, type CatheterLumen, type InjectionTrace } from "../../../simulation/injection";
import { AORTOGRAM_SETTINGS, LV_GRAM_SETTINGS, PowerInjector, type PowerInjection, type PowerInjectorSettings } from "../../../simulation/powerInjector";
import { lvGeom } from "../../../physics/lumen";
import { leftHeartSetups, type LeftHeartFindings, type LeftHeartSetup, type LvSegmentName, type LvWallClass } from "../../../simulation/diagnosticScenarios/leftHeart";
import { LV_RULES, LVEDP_RULES, type LvAction, type LvMentorCtx, type LvTipPosition } from "../../../mentor/rules/diagLv";
import { MentorEngine, type DeferredNote } from "../../../mentor/mentor";
import type { MentorInput, PreAction } from "../../../mentor/context";
import type { MentorUtterance } from "../../../mentor/types";
import { mentorInputFromSim } from "../../../mentor/bridge/simulatorStore";
import { segmentsFromEngine, LV_SEGMENTS, type LvGramSpec, type LvSegment } from "../../../render/xray/lvGram";
import { wallMotionClassOf, wallMotionScale, type WallMotionClass } from "../../../render/xray/heartMotion";
import { MP_CALLOUT_HOLD_S, MP_CALLOUT_SYSTOLIC_MMHG } from "../../lab/labTeam";
import { attemptDraw, crossingProbability, embolicRisk, embolicRiskScore, isUnnecessaryCrossing, seedOf, type CrossCatheter, type CrossWire, type EmbolicRisk } from "../../../simulation/haemo/avCrossing";
import { EXCHANGE_WIRE_LEAD } from "../../lab/diagnosticContext";
import type { LeftHeartTask } from "../../../state/useSimulatorStore";
import type { SessionInjection, SessionModule } from "./index";
import type { DiagnosticLabSession } from "../labSession";

/** The module's id in the session. */
export const LEFT_HEART_MODULE_ID = "left-heart";

/** The events this module raises in the diagnostic lab. */
export const LEFT_HEART_EVENTS = [
  "lv-ectopy",
  "high-lvedp",
  "papillary-entrapment",
  "catheter-induced-regurgitation",
  "myocardial-stain",
  "tamponade",
  "pulmonary-oedema",
  "hypotension",
  "catheter-too-deep",
  "engage-fail",
] as const satisfies readonly LabEvent[];

/** What the module reports (the reachability report reads it): the left heart's events at lv-aorta, and the removal over the wire. */
export const raises: LabRaises = {
  lab: "diagnostic",
  phases: ["lv-aorta", "exchange"],
  events: LEFT_HEART_EVENTS,
  routes: ["femoral", "radial"],
};

/**
 * MODEL PARAMETERS of the module (docs/realism/facts/pkg-diag-lv-aorta-task.md) unless a line cites the module text.
 *   simpleCavityMm      simple model: depth below the valve plane from the base of the cavity to the apex
 *   bands               long-axis fractions (0 base .. 1 apex): outflow below `outflow`; papillary region from
 *                       `papillaryFrom` to `apex` on the posterior side; apex from `apex`; wall from `wall`
 *   posteriorSin        the curve faces posteriorly (towards the mitral apparatus and papillary muscles) when the
 *                       sine of its azimuth is below this
 *   wallQ               rod model: the tip is against the wall beyond this share of the cavity's radius
 *   leafletMm           a tip in the root this close above the valve plane lies on the leaflets
 *   catheterMr, catheterAr, amplatzAr   severities (0..1) of the regurgitation a catheter makes (catheterAr on the
 *                       engine's acute open-cusp coupling, MP_COUPLING.arConductanceMlSPerMmHg: a small leak, not a cusp
 *                       held open)
 *   leafletDwellS       seconds a pigtail rests on the leaflets before it makes regurgitation (a transit does not)
 *   entrapAfterS        seconds in the papillary region before the pigtail is caught
 *   freeTorqueRad       rotation of the hub (either way) that frees it, with a withdrawal of freeWithdraw
 *   holdInsertionMm     a caught pigtail is held within this of where it was caught
 *   stain               contrast pushed into the wall from which a stain shows (mL), the share of the jet that
 *                       goes into the myocardium while the tip is against the wall, the pericardial leak per mL
 *                       of contrast in the wall (mL/s), its delay after the run (s) and how long it bleeds (s)
 *   tamponadeMl         pericardial volume from which the tamponade event is raised
 *   oedemaVolumePerMl   volume load (mL of stressed volume) per mL of an LV power injection: the contrast's osmotic
 *                       effect (the module text: contrast raises LVEDP, 04-cardiac-catheterisation.ts:213)
 *   oedemaWatchS        seconds after an LV run in which a rise of the LVEDP above the oedema line is that run's
 *   oxygenLpm           high-flow oxygen (the module text gives no flow)
 *   whip                a power injection at or above `rateMlS` with a rise below `riseS` moves the catheter
 *                       (the module text: the rise time exists to reduce catheter whip, :1248)
 *   lvedpVolumePerMmHg  stressed volume per mmHg of LVEDP (the patient engine's own calibration, engine.ts)
 *   lvedpSettle         the start state's LVEDP is corrected every `everyS` for the first `forS` seconds by `gain` of the error
 *   failedPassesForEngageFail  failed valve passes before engage-fail is raised
 *   valveZoneMm         a tip within this above the valve plane is at the valve (passes, time at the valve)
 *   clearS              seconds after the push that the power injection's contrast stays on the image
 *   holdS               event holds (s)
 *   severityPerGrade    engine MR severity (0..1) per angiographic grade of the scenario's MR (grade IV: 1)
 *   arSeverityPerGrade  engine AR severity per angiographic grade of the scenario's (chronic) AR, on the open-cusp coupling
 *   compensatedArSettleS  a scenario with chronic AR and no LVEDP of its own holds the engine's resting LVEDP for this
 *                       long at the start (the compensated, dilated ventricle of chronic AR)
 *   drainFractionPerS   share of the pericardial volume a drain left in removes per second, besides the leak
 */
export const MP_LEFT_HEART_TASK = {
  simpleCavityMm: 70,
  bands: { outflow: 0.2, papillaryFrom: 0.4, apex: 0.68, wall: 0.92 },
  posteriorSin: -0.5,
  wallQ: 0.86,
  leafletMm: 4,
  catheterMr: 0.55,
  catheterAr: 0.04,
  leafletDwellS: 2,
  amplatzAr: 0.8,
  entrapAfterS: 1.5,
  freeTorqueRad: 0.6,
  freeWithdrawMm: 3,
  holdInsertionMm: 0.5,
  stain: { minMl: 0.5, wallShare: 0.3, leakMlSPerMl: 0.12, delayS: 20, bleedS: 240 },
  tamponadeMl: 120,
  oedemaVolumePerMl: 4,
  oedemaWatchS: 120,
  oxygenLpm: 15,
  whip: { rateMlS: 13, riseS: 0.1, depthMm: 6 },
  lvedpVolumePerMmHg: 20,
  lvedpSettle: { everyS: 2.5, forS: 20, gain: 0.8 },
  failedPassesForEngageFail: 3,
  valveZoneMm: 5,
  clearS: 8,
  holdS: { ectopy: 10, regurg: 20, tooDeep: 5, hypotension: 30 },
  severityPerGrade: 0.25,
  arSeverityPerGrade: 0.03,
  compensatedArSettleS: 30,
  drainFractionPerS: 0.05,
};

/**
 * The module text's figures this module uses: the hand test injection of 10 mL (the problems table,
 * 04-cardiac-catheterisation.ts:1287), furosemide 80–100 mg IV and an IV nitrate only above a systolic of
 * 100 mmHg for oedema on the table (src/content/manual/complication-management/02-flow-embolism.ts:833).
 */
export const LEFT_HEART_SOURCED = { testInjectionMl: 10, furosemideMg: 80, nitrateAboveSystolic: 100 } as const;

/** Position of the tip for the left heart tasks. */
export type LvPosition = LvTipPosition;

/** What the view of a run profiles (the module text: RAO 30 anterior, apical, inferior; LAO cranial septal and posterolateral). */
export type RunView = "rao" | "lao-cranial" | "lao" | "other";

export const VIEW_SEGMENTS: Record<RunView, readonly LvSegment[]> = {
  rao: ["anterior", "apical", "inferior"],
  "lao-cranial": ["septal", "posterolateral"],
  lao: ["septal", "posterolateral"],
  other: [],
};

/** The view of a C-arm position (MODEL PARAMETER bands round RAO 30 and LAO 60 cranial 20). */
export function runViewOf(c: CArm): RunView {
  if (c.laoRao <= -15 && Math.abs(c.cranialCaudal) < 15) return "rao";
  if (c.laoRao >= 40 && c.cranialCaudal >= 10) return "lao-cranial";
  if (c.laoRao >= 40) return "lao";
  return "other";
}

/** Global LV function from the LVEF (MODEL PARAMETER bands, for the reader's global grade). */
export type GlobalFunction = "normal" | "mild" | "moderate" | "severe";
export const GLOBAL_FUNCTION: readonly GlobalFunction[] = ["normal", "mild", "moderate", "severe"];
export function globalFunctionOf(ef: number): GlobalFunction {
  return ef >= 55 ? "normal" : ef >= 45 ? "mild" : ef >= 35 ? "moderate" : "severe";
}

const WALL_CLASSES: readonly WallMotionClass[] = ["normal", "hypokinetic", "akinetic", "dyskinetic"];

/**
 * The tip's position class. In the ventricle, from its long-axis fraction f (0 base .. 1 apex), whether it faces
 * posteriorly (towards the mitral apparatus and the papillary muscles) and whether it is against the wall; in the
 * root, from its height above the valve plane.
 */
export function lvPositionOf(o: { inLv: boolean; f: number; posterior: boolean; againstWall: boolean; heightAboveValve: number; sinusTop: number }): LvPosition {
  const B = MP_LEFT_HEART_TASK.bands;
  if (o.inLv) {
    if (o.againstWall || o.f >= B.wall) return "wall";
    if (o.f >= B.apex) return "apex";
    if (o.f < B.outflow) return o.posterior ? "mitral" : "outflow";
    if (o.posterior && o.f >= B.papillaryFrom) return "papillary";
    return "mid-cavity";
  }
  if (o.heightAboveValve < MP_LEFT_HEART_TASK.leafletMm) return "leaflets";
  if (o.heightAboveValve > o.sinusTop) return "ascending";
  return "root";
}

/** The rod model's LV frame of a point (aortic frame, mm): long-axis fraction and the share of the cavity radius. */
export function lvFrameOf(p: Vec3): { f: number; q: number; posterior: boolean } {
  const L = lvGeom();
  const dx = p.x - L.c.x, dy = p.y - L.c.y, dz = p.z - L.c.z;
  const p1 = (dx * L.u1.x + dy * L.u1.y + dz * L.u1.z) / L.a;
  const p2 = (dx * L.u2.x + dy * L.u2.y + dz * L.u2.z) / L.b;
  const p3 = (dx * L.u3.x + dy * L.u3.y + dz * L.u3.z) / L.b;
  return { f: (p1 + 1) / 2, q: Math.hypot(p1, p2, p3), posterior: p.z < L.c.z - 0.3 * L.b };
}

/** A step the operator took on the left heart, with what it showed. */
export type LeftHeartStep =
  | "task"
  | "lvedp"
  | "purge"
  | "arm"
  | "settings"
  | "fire"
  | "stop-injection"
  | "stopped-by-attending"
  | "test-injection"
  | "pullback-start"
  | "pullback"
  | "free-entrapment"
  | "crossing-question"
  | "crossing-answer"
  | "cross"
  | "cross-failed"
  | "iliac-station"
  | "echo"
  | "pericardiocentesis"
  | "drain"
  | "heparin-review"
  | "oxygen"
  | "sit-up"
  | "diuretic"
  | "nitrate"
  | "cpap"
  | "iabp"
  | "admit"
  | "removed"
  | "reading"
  | "patient";

export interface LeftHeartStepEntry {
  step: LeftHeartStep;
  /** lab time, s */
  t: number;
  /** what the operator saw or did (shown in the tab's log) */
  observed: string;
}

/** One filmed or unfilmed chamber run. */
export interface LeftHeartRun {
  id: number;
  kind: "lv" | "root" | "iliac";
  via: "power" | "hand";
  t: number;
  position: LvPosition;
  settings: PowerInjectorSettings | null;
  volumeMl: number;
  view: RunView;
  cArm: CArm;
  /** cine was running during the push */
  filmed: boolean;
  beats: number;
  ectopicBeats: number;
  /** the catheter lay on the mitral apparatus or the leaflets during the run */
  catheterMr: boolean;
  catheterAr: boolean;
  /** contrast went into the wall */
  stainMl: number;
  /** the case's truth for this run (for the reader's comparison in the debrief) */
  truth: RunTruth;
  /** the left heart as the run showed it (the reader's end-diastolic and end-systolic frames are drawn from it) */
  spec: LvGramSpec;
}

export interface RunTruth {
  global: GlobalFunction;
  ef: number;
  segments: Record<LvSegment, WallMotionClass>;
  mr: number;
  ar: number;
  territory: "LAD" | "RCA" | "LCx" | null;
  label: string;
}

/** The learner's reading of one run (LvGramReader). */
export interface RunReading {
  runId: number;
  ungradable: boolean;
  global?: GlobalFunction;
  segments?: Partial<Record<LvSegment, WallMotionClass>>;
  mr?: number;
  ar?: number;
  territory?: "LAD" | "RCA" | "LCx" | "none";
}

/** The comparison of one reading with the run's truth (the debrief's; within one grade counts). */
export interface ReadingComparison {
  runId: number;
  /** the run was not gradable (ectopics, or the catheter on the mitral apparatus or the leaflets) */
  shouldBeUngradable: boolean;
  ungradableCorrect: boolean;
  global: { expected: GlobalFunction; given: GlobalFunction | null; withinOne: boolean } | null;
  segments: { segment: LvSegment; expected: WallMotionClass; given: WallMotionClass | null; withinOne: boolean }[];
  mr: { expected: number; given: number | null; withinOne: boolean } | null;
  ar: { expected: number; given: number | null; withinOne: boolean } | null;
  territory: { expected: string; given: string | null; correct: boolean } | null;
}

/** What the debrief reads (never shown live). */
export interface LeftHeartScore {
  task: LeftHeartTask | null;
  lvedpRecorded: number | null;
  lvedpRecordedBeforeInjection: boolean | null;
  /** power injections from the apex, papillary region or wall (counted whether tested or not) */
  riskyPositionInjections: number;
  untestedRiskyInjections: number;
  settingsForLvedp: boolean | null;
  airCheckBeforeArming: boolean;
  cleanCycleRecorded: boolean;
  pullbackRecorded: boolean;
  removedOverWire: boolean | null;
  aortogramOnLeaflets: number;
  stain: boolean;
  tamponade: { onsetT: number; echoT: number | null; pericardiocentesisT: number | null; drain: boolean; heparinReviewed: boolean; hrRising: boolean } | null;
  oedema: { onsetT: number; firstActions: LeftHeartStep[] } | null;
  crossing: { passes: number; failedPasses: number; valveTimeS: number; crossedAt: number | null; escalation: string[]; unnecessary: boolean; risk: EmbolicRisk; riskScore: number; askedIndicated: boolean | null };
  entrapments: number;
  amplatzOnValve: { t: number; repositionedAfterS: number | null }[];
  /** the attending's stops (runs not fired) */
  stops: MentorUtterance[];
  /** what the attending said on runs it allowed */
  notes: MentorUtterance[];
  deferred: DeferredNote[];
  readings: ReadingComparison[];
}

/** The lab session as the left heart module uses it (DiagnosticLabSession satisfies it structurally). */
export type LeftHeartHost = Pick<
  DiagnosticLabSession,
  "store" | "engine" | "tree" | "model" | "events" | "physics" | "physicsReading" | "pedal" | "injector" | "caseId" | "wall" | "startInjection" | "controlsPolicy" | "provideCapability" | "notify"
>;

const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);

function lumenOf(catheterId: string): CatheterLumen {
  const c = catheterById(catheterId);
  if (!c) return LUMENS["diag-6"];
  try {
    return lumenForCatheter({ french: catheterFrench(c.id), guide: c.category === "guide" });
  } catch {
    return LUMENS["diag-6"];
  }
}

const famOf = (id: string): "PIG" | "AL" | "JR" | "other" => (/^PIG/.test(id) ? "PIG" : /^AL/.test(id) ? "AL" : /^JR/.test(id) ? "JR" : "other");
const crossCatheterOf = (id: string): CrossCatheter | null => {
  const f = famOf(id);
  return f === "PIG" ? "pigtail" : f === "AL" ? "AL1" : f === "JR" ? "JR4" : null;
};
const crossWireOf = (wireId: string): CrossWire => (wireId === "STRAIGHT" || wireId === "HYDRO" ? "straight-hydrophilic" : wireId === "SUPPORT" ? "stiff-straight" : "standard-j");

/** The findings a scenario's seed picks (a reading set picks one by the case id). */
export function findingsFor(setup: LeftHeartSetup, caseId: string): LeftHeartFindings {
  const f = setup.findings;
  if (!Array.isArray(f)) return f as LeftHeartFindings;
  const list = f as readonly LeftHeartFindings[];
  return list[seedOf(caseId) % list.length];
}

/**
 * The left heart controls of one lab session. Read-outs say what the operator would see; the score is the
 * debrief's.
 */
export class LeftHeartControl {
  readonly steps: LeftHeartStepEntry[] = [];
  readonly runs: LeftHeartRun[] = [];
  readonly readings: RunReading[] = [];
  readonly injector = new PowerInjector(null);
  readonly setup: LeftHeartSetup | null;
  readonly findings: LeftHeartFindings | null;
  /** the recorded LVEDP (the haemodynamic system's mark on the LV trace), mmHg */
  lvedp: number | null = null;
  /** the lab asked whether crossing a stenotic valve is indicated, and the answer */
  crossQuestion: { asked: boolean; answer: boolean | null } = { asked: false, answer: null };
  /** the pigtail is pulled back to above the aortic bifurcation for the iliofemoral run */
  iliacStation = false;
  /** a pullback is being recorded */
  pullbackRecording = false;
  /** the attending's stops and deferred notes on the left heart */
  readonly stops: MentorUtterance[] = [];
  readonly notes: MentorUtterance[] = [];
  readonly deferred: DeferredNote[] = [];
  private version = 0;
  private position: LvPosition = "other";
  private inLv = false;
  private positionSince = 0;
  private testedAt: { position: LvPosition; t: number } | null = null;
  private lastPedalCine = false;
  private power: { shot: PowerInjection; run: LeftHeartRun; lvRun: boolean; whipped: boolean; finished: boolean } | null = null;
  private runBeat = -1;
  private ownMr = false;
  private ownAr = 0;
  /** the scenario's MR and AR severities (applySetup), restored when the catheter's own regurgitation ends */
  private scenarioMr = 0;
  private scenarioAr = 0;
  private entrapped: { insertion: number; torque: number; t: number } | null = null;
  private entrapmentCount = 0;
  private entrapReady = true;
  private stain: { segment: LvSegment; t: number; pushEndT: number; ml: number } | null = null;
  private leak: { from: number; until: number; mlS: number } | null = null;
  private drainLeft = false;
  private tamponade: LeftHeartScore["tamponade"] = null;
  private oedema: { onsetT: number } | null = null;
  private oedemaWatchUntil = -Infinity;
  private lastLvRunEnd = -Infinity;
  private hypoSince: number | null = null;
  private hrAtHypoStart: number | null = null;
  private crossing = { passes: 0, failedPasses: 0, valveTimeS: 0, crossedAt: null as number | null, escalation: [] as string[], atValve: false, attempts: 0 };
  private wireAcross = false;
  private lastWireLead = 0;
  private lastCatheterId: string;
  private amplatz: { t: number; repositionedAfterS: number | null }[] = [];
  private amplatzOn: number | null = null;
  private amplatzPushed = false;
  private lastInsertion = 0;
  private pullback: { lvSys: number | null; sideArmSys: number | null } = { lvSys: null, sideArmSys: null };
  private lastEctopyCheck = -Infinity;
  private lastTooDeep = -Infinity;
  private specCache: { t: number; spec: LvGramSpec } | null = null;
  private lvedpBeforeFirstLvRun: boolean | null = null;
  private airCheckBeforeArming = true;
  private settingsForLvedp: boolean | null = null;
  private riskyInjections = 0;
  private untestedRiskyInjections = 0;
  private aortogramOnLeaflets = 0;
  private removedOverWire: boolean | null = null;

  constructor(readonly host: LeftHeartHost) {
    const st = host.store.getState();
    const id = st.caseData.scenarioId;
    this.setup = (id && leftHeartSetups[id]) || null;
    this.findings = this.setup ? findingsFor(this.setup, st.caseData.id) : null;
    this.lastCatheterId = st.catheterId;
    this.lastWireLead = st.controls.wireInsertion;
  }

  /** bumped whenever anything the tab shows changes */
  get rev(): number {
    return this.version;
  }

  private changed() {
    this.version++;
    this.host.notify();
  }

  private log(step: LeftHeartStep, observed: string) {
    this.steps.push({ step, t: this.host.wall(), observed });
    this.changed();
  }

  // --- the start state ---------------------------------------------------------------

  /** Apply the scenario's start: the catheter, the valve area, the LVEDP, atrial contraction. */
  applySetup(): void {
    const s = this.setup;
    const h = this.host;
    if (!s) return;
    const st = h.store.getState();
    if (s.catheterId !== st.catheterId && catheterById(s.catheterId)) {
      const changes = st.score.catheterChanges;
      st.setCatheter(s.catheterId);
      h.store.setState((x) => ({ score: { ...x.score, catheterChanges: changes } }));
      this.lastCatheterId = s.catheterId;
    }
    h.engine.setAtrialContraction(true);
    // the scenario's own regurgitation (the findings' grade) on the engine, so it has its haemodynamic effect
    const F = this.findings;
    this.scenarioMr = F?.mr ? F.mr * MP_LEFT_HEART_TASK.severityPerGrade : 0;
    this.scenarioAr = F?.ar ? F.ar * MP_LEFT_HEART_TASK.arSeverityPerGrade : 0;
    // the resting LVEDP before the scenario's regurgitation loads the ventricle
    const resting = h.engine.vitals().lvedp;
    if (this.scenarioMr > 0) h.engine.setMitralRegurgitation(this.scenarioMr);
    if (this.scenarioAr > 0) h.engine.setAorticRegurgitation(this.scenarioAr);
    const M = MP_LEFT_HEART_TASK;
    if (s.lvedpMmHg !== undefined) {
      const now = h.engine.vitals().lvedp;
      const dv = (s.lvedpMmHg - now) * M.lvedpVolumePerMmHg;
      if (Math.abs(dv) > 1) h.engine.loadVolume(dv, 1);
      this.lvedpSettle = { target: s.lvedpMmHg, next: h.wall() + M.lvedpSettle.everyS, until: h.wall() + Math.max(M.lvedpSettle.forS, this.scenarioAr > 0 ? M.compensatedArSettleS : 0) };
    } else if (this.scenarioAr > 0) {
      // chronic AR is compensated (a dilated, compliant ventricle): the regurgitant load does not raise the resting LVEDP
      this.lvedpSettle = { target: resting, next: h.wall() + M.lvedpSettle.everyS, until: h.wall() + M.compensatedArSettleS };
    }
  }

  /** The start state's LVEDP is reached by a few corrections over the first seconds (the volume to pressure relation is not linear). */
  private lvedpSettle: { target: number; next: number; until: number } | null = null;
  private settleLvedp(t: number) {
    const L = this.lvedpSettle;
    if (!L) return;
    if (t > L.until) {
      this.lvedpSettle = null;
      return;
    }
    if (t < L.next) return;
    L.next = t + MP_LEFT_HEART_TASK.lvedpSettle.everyS;
    const err = L.target - this.host.engine.vitals().lvedp;
    if (Math.abs(err) > 0.5) this.host.engine.loadVolume(err * MP_LEFT_HEART_TASK.lvedpVolumePerMmHg * MP_LEFT_HEART_TASK.lvedpSettle.gain, 1);
  }

  // --- what the operator sets ---------------------------------------------------------

  task(): LeftHeartTask | null {
    return this.host.store.getState().leftHeartTask;
  }

  setTask(t: LeftHeartTask | null) {
    const st = this.host.store.getState();
    if (st.leftHeartTask === t) return;
    st.setLeftHeartTask(t);
    this.host.engine.setAtrialContraction(true);
    this.log("task", t === "ventriculogram" ? "Left ventriculogram planned." : t === "aortogram" ? "Aortogram planned." : "Left heart task ended.");
  }

  /**
   * Whether the left heart controls are in play: a left heart scenario, a pigtail in use, a task chosen, the
   * ventricle entered, a run or a complication of this module, or the attending's crossing question. The
   * Left heart tab shows only then, so a coronary study's strip is as before.
   */
  inPlay(): boolean {
    const st = this.host.store.getState();
    return !!this.setup || famOf(st.catheterId) === "PIG" || !!st.leftHeartTask || this.crossing.passes > 0 || this.runs.length > 0 || !!this.stain || !!this.tamponade || !!this.oedema || this.crossQuestion.asked || this.severeAs();
  }

  /**
   * Whether the left heart is in play for the engine's side effects: a left heart scenario, a pigtail, or a task
   * chosen. Otherwise (a coronary study with a JR4 or JL4 slipping into the LV) the engine keeps the defaults the
   * other labs rely on: no atrial contraction switched on here, and the transducer's own lvContact.
   */
  private engaged(): boolean {
    return !!this.setup || famOf(this.host.store.getState().catheterId) === "PIG" || !!this.task();
  }

  /** The tip's position class, shown only where the policy shows state chips (a guided aid); null otherwise. */
  positionAid(): LvPosition | null {
    return this.host.controlsPolicy().visibility.stateChips ? this.position : null;
  }

  /** The catheter is in the ventricle and its trace is the LV's (the operator sees the LV trace). */
  lvTraceShown(): boolean {
    return this.host.engine.vitals().tipState === "lv";
  }

  /** Record the LVEDP: the haemodynamic system marks the end-diastolic pressure after the a wave on the LV trace. */
  recordLvedp(): number | null {
    if (!this.lvTraceShown()) {
      this.log("lvedp", "No LV trace: the catheter is not in the ventricle.");
      return null;
    }
    const v = this.host.engine.vitals();
    const x = Math.round(v.lvedp);
    this.lvedp = x;
    this.log("lvedp", `LVEDP ${x} mmHg (end-diastole, after the a wave).`);
    if (x > LVEDP_RULES.reduceAboveMmHg) this.host.events.hold(["high-lvedp"], this.host.wall(), "left-heart");
    return x;
  }

  // --- the power injector --------------------------------------------------------------

  setInjector(s: Partial<PowerInjectorSettings>) {
    this.injector.set(s);
    this.log("settings", `Injector set: ${this.injector.settings.volumeMl} mL at ${this.injector.settings.rateMlS} mL/s, rise ${this.injector.settings.riseS} s, limit ${this.injector.settings.pressureLimitPsi} psi.`);
  }

  /** The presets on the console: the module text's settings. */
  presets(): { id: string; label: string; settings: Partial<PowerInjectorSettings> }[] {
    return [
      { id: "lv-usual", label: "Ventriculogram 35 mL at 12 mL/s", settings: { volumeMl: LV_GRAM_SETTINGS.usual.volumeMl[1], rateMlS: 12, riseS: LV_GRAM_SETTINGS.riseS[0] } },
      { id: "lv-reduced", label: "Reduced 30 mL at 10 mL/s", settings: { volumeMl: LV_GRAM_SETTINGS.reduced.volumeMl, rateMlS: LV_GRAM_SETTINGS.reduced.rateMlS, riseS: LV_GRAM_SETTINGS.riseS[0] } },
      { id: "aortogram", label: "Aortogram 50 mL at 20 mL/s", settings: { volumeMl: 50, rateMlS: AORTOGRAM_SETTINGS.rateMlS, riseS: LV_GRAM_SETTINGS.riseS[0] } },
      { id: "iliac", label: "Iliofemoral 20 mL at 20 mL/s", settings: { volumeMl: 20, rateMlS: 20, riseS: LV_GRAM_SETTINGS.riseS[0] } },
    ];
  }

  /** The air check: the reservoir purged and the line run wet as it is connected to the catheter. */
  purge() {
    this.injector.connect(lumenOf(this.host.store.getState().catheterId));
    if (this.injector.state === "done") this.injector.reset();
    this.injector.purge();
    this.log("purge", "Air expelled; contrast running from the line as it was connected.");
  }

  arm(): boolean {
    this.injector.connect(lumenOf(this.host.store.getState().catheterId));
    if (this.injector.state === "done") this.injector.reset();
    const ok = this.injector.arm();
    if (!ok && this.injector.lastRefusal === "air-check") this.airCheckBeforeArming = false;
    this.log("arm", ok ? "Injector armed: it fires with the cine pedal." : this.injector.lastRefusal === "air-check" ? "The injector will not arm: the air check has not been done." : "The injector will not arm: it is not connected.");
    return ok;
  }

  disarm() {
    this.injector.disarm();
    this.changed();
  }

  /** Stop the power injection now (the operator watching the screen). */
  stopInjection() {
    if (this.injector.state !== "firing") return;
    this.injector.stop(this.host.wall());
    const shot = this.power?.shot;
    this.log("stop-injection", shot ? `Injection stopped after ${shot.trace.volumeMl.toFixed(0)} mL.` : "Injection stopped.");
    if (this.power) this.endPowerRun();
  }

  /** The hand test injection: the 10 mL syringe pushed through the catheter (the session's syringe). */
  testInjection(): boolean {
    return this.host.startInjection();
  }

  // --- the pullback, the entrapment, the station -----------------------------------------

  startPullback() {
    this.pullbackRecording = true;
    this.pullback = { lvSys: null, sideArmSys: null };
    this.log("pullback-start", "Recording: pull back from the ventricle to the aorta under pressure, the sheath side arm on the second line.");
  }

  /** Rotate gently and withdraw: the move that frees a caught pigtail (the module text's fix). */
  rotateAndWithdraw() {
    const st = this.host.store.getState();
    st.commandTorque(MP_LEFT_HEART_TASK.freeTorqueRad + 0.05);
    st.commandInsertion(-(MP_LEFT_HEART_TASK.freeWithdrawMm + 1));
    this.log("free-entrapment", "Rotated gently and withdrawn.");
  }

  /** The pigtail pulled back to just above the aortic bifurcation for the iliofemoral run (or back up to the root). */
  setIliacStation(on: boolean) {
    if (on && (this.inLv || famOf(this.host.store.getState().catheterId) !== "PIG")) return;
    this.iliacStation = on;
    this.log("iliac-station", on ? "Pigtail pulled back to just above the aortic bifurcation; table lowered and panned to both femoral heads." : "Pigtail back up to the root.");
  }

  /** Answer the attending's question whether crossing the stenotic valve is indicated. */
  answerCrossing(indicated: boolean) {
    this.crossQuestion = { asked: true, answer: indicated };
    this.log("crossing-answer", indicated ? "Crossing judged indicated." : "Crossing judged not indicated: the echo answers the question.");
  }

  /** The chart's echo calls the valve severely stenotic (or the scenario's valve is stenotic). */
  severeAs(): boolean {
    if (this.setup?.valve === "stenotic") return true;
    const v = this.host.store.getState().caseData.chart?.echo?.valves ?? [];
    return v.some((x) => x.valve === "aortic" && x.lesion === "stenosis" && x.severity === "severe");
  }

  // --- complications management ----------------------------------------------------------

  echo() {
    const ml = this.host.engine.vitals().pericardialMl;
    const t = this.host.wall();
    if (this.tamponade && this.tamponade.echoT === null) this.tamponade.echoT = t;
    // MODEL PARAMETER: a rough echo size from the pericardial volume
    const mm = ml < 20 ? 0 : Math.round(clamp(4 + ml / 25, 4, 30));
    this.log("echo", mm === 0 ? "Echo: no pericardial effusion." : `Echo: a pericardial effusion, about ${mm} mm, with right heart collapse${ml > MP_LEFT_HEART_TASK.tamponadeMl ? "" : " not yet seen"}.`);
  }

  pericardiocentesis() {
    const t = this.host.wall();
    const got = this.host.engine.drainPericardium(10000);
    if (this.tamponade && this.tamponade.pericardiocentesisT === null) this.tamponade.pericardiocentesisT = t;
    this.log("pericardiocentesis", got > 1 ? `Pericardiocentesis: ${Math.round(got)} mL of blood-stained fluid drained.` : "Pericardiocentesis: no fluid.");
  }

  leaveDrain() {
    this.drainLeft = true;
    if (this.tamponade) this.tamponade.drain = true;
    this.log("drain", "Pericardial drain left in, on free drainage.");
  }

  reviewHeparin() {
    if (this.tamponade) this.tamponade.heparinReviewed = true;
    this.log("heparin-review", "Anticoagulation reviewed with the team.");
  }

  oxygen() {
    this.host.engine.setOxygen(MP_LEFT_HEART_TASK.oxygenLpm);
    this.oedemaAction("oxygen", "High-flow oxygen on.");
  }

  sitUp() {
    this.oedemaAction("sit-up", "Patient sat up as far as the table allows.");
  }

  diuretic() {
    const r = this.host.engine.giveDrug("furosemide", LEFT_HEART_SOURCED.furosemideMg, "iv");
    this.oedemaAction("diuretic", r.ok ? `Furosemide ${LEFT_HEART_SOURCED.furosemideMg} mg IV given.` : `Furosemide not given: ${r.text}`);
  }

  nitrate() {
    const sys = this.host.engine.vitals().art?.sys ?? null;
    if (sys === null || sys <= LEFT_HEART_SOURCED.nitrateAboveSystolic) {
      this.oedemaAction("nitrate", `IV nitrate held: the systolic is ${sys === null ? "not shown" : Math.round(sys) + " mmHg"}.`);
      return;
    }
    this.oedemaAction("nitrate", "IV nitrate infusion asked for (systolic above 100 mmHg).");
  }

  cpap() {
    this.oedemaAction("cpap", "CPAP asked for.");
  }

  considerIabp() {
    this.oedemaAction("iabp", "Balloon pump support considered.");
  }

  admit() {
    this.oedemaAction("admit", "Admission to the coronary care unit arranged.");
  }

  private oedemaActions: LeftHeartStep[] = [];
  private oedemaAction(step: LeftHeartStep, text: string) {
    if (this.oedema) this.oedemaActions.push(step);
    this.log(step, text);
  }

  // --- the ventriculogram reader ----------------------------------------------------------

  /** Runs the reader can grade: filmed LV or root runs, newest first. */
  readableRuns(): LeftHeartRun[] {
    return this.runs.filter((r) => r.filmed && (r.kind === "lv" || r.kind === "root")).slice().reverse();
  }

  submitReading(r: RunReading) {
    const i = this.readings.findIndex((x) => x.runId === r.runId);
    if (i >= 0) this.readings.splice(i, 1);
    this.readings.push(r);
    this.log("reading", `Run ${r.runId} read${r.ungradable ? ": declared ungradable" : ""}.`);
  }

  /** Whether the reader's comparison may be shown now: after the case, or as a guided aid. */
  comparisonShown(): boolean {
    const st = this.host.store.getState();
    return st.finished || this.host.controlsPolicy().mode === "guided";
  }

  /** Compare a reading with its run's truth (within one grade counts as correct). */
  compare(r: RunReading): ReadingComparison | null {
    const run = this.runs.find((x) => x.id === r.runId);
    if (!run) return null;
    const T = run.truth;
    // an LV run is ungradable with the catheter on the mitral apparatus or without one clean cycle; a root run with the catheter on the leaflets
    const shouldBeUngradable = run.kind === "lv" ? run.catheterMr || (run.beats > 0 && run.ectopicBeats >= run.beats) : run.catheterAr;
    const within = (a: number, b: number) => Math.abs(a - b) <= 1;
    const segs = VIEW_SEGMENTS[run.view];
    return {
      runId: run.id,
      shouldBeUngradable,
      ungradableCorrect: r.ungradable === shouldBeUngradable,
      global: run.kind === "lv" ? { expected: T.global, given: r.global ?? null, withinOne: r.global !== undefined && within(GLOBAL_FUNCTION.indexOf(T.global), GLOBAL_FUNCTION.indexOf(r.global)) } : null,
      segments:
        run.kind === "lv"
          ? segs.map((sg) => {
              const given = r.segments?.[sg] ?? null;
              return { segment: sg, expected: T.segments[sg], given, withinOne: given !== null && within(WALL_CLASSES.indexOf(T.segments[sg]), WALL_CLASSES.indexOf(given)) };
            })
          : [],
      mr: run.kind === "lv" ? { expected: T.mr, given: r.mr ?? null, withinOne: r.mr !== undefined && within(T.mr, r.mr) } : null,
      ar: run.kind === "root" ? { expected: T.ar, given: r.ar ?? null, withinOne: r.ar !== undefined && within(T.ar, r.ar) } : null,
      territory: run.kind === "lv" && T.territory !== undefined ? { expected: T.territory ?? "none", given: r.territory ?? null, correct: (r.territory ?? null) === (T.territory ?? "none") } : null,
    };
  }

  // --- the image ------------------------------------------------------------------------------

  /**
   * What the ventriculogram and aortogram show now (SceneInput.lvGram): the case's findings combined with the
   * engine's ischaemia (the worse excursion of the two per segment), the catheter-induced regurgitation, the
   * engine's ectopic beat and a stain. Cached for 0.2 s of lab time.
   */
  sceneSpec(): LvGramSpec {
    const h = this.host;
    const t = h.wall();
    if (this.specCache && t - this.specCache.t < 0.2 && t >= this.specCache.t) return this.specCache.spec;
    const w = h.engine.lvWallState();
    const eng = segmentsFromEngine(h.tree.heart, w, {});
    const f = this.findings;
    const segments: Partial<Record<LvSegment, WallMotionClass | number>> = {};
    for (const s of LV_SEGMENTS) {
      const e = eng.segments?.[s];
      const c = f?.segments?.[s as LvSegmentName];
      const ke = e === undefined ? 1 : wallMotionScale(e);
      const kc = c === undefined ? 1 : wallMotionScale(c as LvWallClass);
      segments[s] = Math.min(ke, kc);
    }
    const spec: LvGramSpec = {
      segments,
      ef: f?.ef ?? eng.ef,
      ectopic: w.ectopic,
      ...(f?.mr ? { mr: f.mr } : {}),
      ...(f?.ar ? { ar: f.ar } : {}),
      ...(f?.thrombus ? { thrombus: true } : {}),
      ...(f?.takotsubo ? { takotsubo: true } : {}),
      ...(f?.vsd ? { vsd: {} } : {}),
      ...(f?.anomalousCx ? { anomalousCx: true } : {}),
      ...(this.severeAs() ? { aorticStenosis: true } : {}),
      ...(this.ownMr ? { catheterMr: true } : {}),
      ...(this.ownAr > 0 && famOf(h.store.getState().catheterId) === "PIG" ? { catheterAr: true } : {}),
      ...(this.stain ? { stain: { segment: this.stain.segment, pericardial: this.stain.ml > MP_LEFT_HEART_TASK.stain.minMl * 2, strength: clamp(this.stain.ml / 10, 0.2, 1), ...(this.power && !this.power.finished ? {} : { sinceS: Math.max(0, t - this.stain.pushEndT) }) } } : {}),
    };
    this.specCache = { t, spec };
    return spec;
  }

  /** The power injection's bolus for the scene (null when none is on the image). */
  sceneBolus(): { trace: InjectionTrace; t: number; kind: "lv" | "root" | "iliac"; pushS: number } | null {
    const p = this.power;
    if (!p) return null;
    const el = this.injector.elapsed(this.host.wall());
    const tr = p.shot.trace;
    if (el === null || el > (tr.pushEnd ?? 0) + MP_LEFT_HEART_TASK.clearS) return null;
    return { trace: tr, t: el, kind: p.run.kind, pushS: Math.max(0.1, (tr.pushEnd ?? el) - tr.pushStart) };
  }

  // --- events ---------------------------------------------------------------------------------

  /** Events true while a state lasts (merged into the tip context by the session). */
  events(): LabEvent[] {
    const out: LabEvent[] = [];
    if (this.entrapped) out.push("papillary-entrapment");
    if (this.ownMr || this.ownAr > 0) out.push("catheter-induced-regurgitation");
    if (this.tamponade && this.host.engine.vitals().pericardialMl > MP_LEFT_HEART_TASK.tamponadeMl / 2) out.push("tamponade");
    if (this.oedema) out.push("pulmonary-oedema");
    return out;
  }

  // --- the step ---------------------------------------------------------------------------------

  step(dt: number) {
    const h = this.host;
    let st = h.store.getState();
    const t = h.wall();
    const model = h.model;
    this.settleLvedp(t);
    // where the tip is
    const phys = h.physics?.active ? h.physicsReading : null;
    if (!phys) this.gateCrossing(st, t, st.tip.height - model.valvePlaneY);
    st = h.store.getState();
    const inLv = st.engagement.kind === "in-lv" || st.engagement.kind === "below-valve" || phys?.tipZone === "lv";
    const heightAbove = st.tip.height - model.valvePlaneY;
    let f = 0,
      posterior = false,
      againstWall = false;
    if (inLv) {
      if (phys) {
        const fr = lvFrameOf(st.tip.pos);
        f = fr.f;
        posterior = fr.posterior;
        againstWall = fr.q >= MP_LEFT_HEART_TASK.wallQ;
      } else {
        f = clamp(-heightAbove / MP_LEFT_HEART_TASK.simpleCavityMm, 0, 1.5);
        posterior = Math.sin(st.tip.az) < MP_LEFT_HEART_TASK.posteriorSin;
        againstWall = f >= MP_LEFT_HEART_TASK.bands.wall;
      }
    }
    const pos = this.iliacStation ? "other" : lvPositionOf({ inLv, f, posterior, againstWall, heightAboveValve: heightAbove, sinusTop: model.sinusTopY - model.valvePlaneY });
    if (pos !== this.position) {
      this.position = pos;
      this.positionSince = t;
      this.changed();
    }
    if (inLv && !this.inLv) {
      if (this.engaged()) h.engine.setAtrialContraction(true);
      if (this.crossing.crossedAt === null) this.crossing.crossedAt = t;
      this.crossing.passes++;
      this.crossing.escalation.push(`${st.catheterId} over ${st.wireId}`);
      // a wire leading through the valve stays across for the exchange
      if (st.controls.wireInsertion > 1) this.wireAcross = true;
    }
    this.inLv = inLv;

    this.trackCatheter(st, t);
    this.trackValveTime(dt, heightAbove, inLv);
    if (this.engaged()) this.trackTipContact(inLv, pos);
    this.trackRegurgitation(st, pos, inLv, t);
    if (!phys) this.trackEntrapment(st, pos, t);
    this.trackEctopy(inLv, t);
    if (pos === "wall" && t - this.lastTooDeep > 1) {
      this.lastTooDeep = t;
      h.events.raise("catheter-too-deep", MP_LEFT_HEART_TASK.holdS.tooDeep, t, "left-heart");
    }
    this.trackPedal(st, t);
    this.trackPowerRun(t, dt);
    this.trackPullback(inLv);
    this.trackComplications(dt, t);
  }

  /** The catheter leaving the patient or exchanged: over the wire? */
  private trackCatheter(st: ReturnType<LeftHeartHost["store"]["getState"]>, t: number) {
    if (st.catheterId !== this.lastCatheterId) {
      const from = this.lastCatheterId;
      const overWire = this.lastWireLead >= EXCHANGE_WIRE_LEAD || !!this.host.physics?.active;
      if (famOf(from) === "PIG" && (this.runs.some((r) => r.kind === "lv") || this.crossing.passes > 0)) {
        this.removedOverWire = overWire;
        this.log("removed", overWire ? "Pigtail removed over the wire." : "Pigtail removed without a wire.");
      }
      if (!overWire) this.wireAcross = false;
      this.injector.connect(null);
      this.lastCatheterId = st.catheterId;
      this.iliacStation = false;
    } else if (this.lastWireLead >= 1 && st.controls.wireInsertion < 1 && !this.inLv) {
      // the wire pulled back into the catheter with the tip above the valve: nothing is left across
      this.wireAcross = false;
    }
    this.lastWireLead = st.controls.wireInsertion;
  }

  /**
   * The simple model has no valve: with the difficult valve, or a stenotic one, a tip that drops below the valve
   * plane without the kit that crosses it is put back on the valve (a failed pass). The kit: a JR4 or Amplatz with a
   * straight or hydrophilic wire leading, each attempt crossing with avCrossing.ts's probability; or any catheter
   * over a wire left across.
   */
  private gateCrossing(st: ReturnType<LeftHeartHost["store"]["getState"]>, t: number, heightAbove: number) {
    const s = this.setup;
    const stenotic = this.severeAs();
    if (!s || (s.valve === "normal" && !stenotic)) return;
    const inLvNow = st.engagement.kind === "in-lv" || st.engagement.kind === "below-valve";
    if (!inLvNow || this.inLvAllowed) {
      if (!inLvNow) this.inLvAllowed = false;
      return;
    }
    const mode = this.host.controlsPolicy().mode;
    const mustAnswer = stenotic && this.crossQuestion.answer === null && (mode === "guided" || mode === "exam");
    // the stenotic valve: ask first (logged once, when the question is first put)
    if (stenotic && !this.crossQuestion.asked) {
      this.crossQuestion = { asked: true, answer: null };
      if (mustAnswer) this.log("crossing-question", "The attending asks first: is crossing this valve indicated?");
      else this.changed();
    }
    const cc = crossCatheterOf(st.catheterId);
    const wire = crossWireOf(st.wireId);
    const wireLeading = st.controls.wireInsertion > 3;
    let crosses = false;
    if (!mustAnswer) {
      if (this.wireAcross) crosses = true;
      else if (cc && wireLeading && cc !== "pigtail") {
        const p = crossingProbability(cc, wire, false);
        const n = ++this.crossing.attempts;
        crosses = wire !== "standard-j" && attemptDraw(seedOf(this.host.caseId), n) < p;
      }
    }
    if (crosses) {
      this.inLvAllowed = true;
      this.log("cross", `${catheterById(st.catheterId)?.name ?? st.catheterId} across the valve over the ${wire === "straight-hydrophilic" ? "straight wire" : "wire"}.`);
      return;
    }
    // back onto the valve: the tip rests just above it
    const c = st.controls;
    const back = c.insertion - (-heightAbove + 1);
    this.host.store.setState({ controls: { ...c, insertion: back, cmdInsertion: Math.min(c.cmdInsertion, back), vInsertion: 0 } });
    const s2 = this.host.store.getState();
    s2.setDifficulty(s2.difficulty);
    // held at the valve while the question is unanswered: not a failed pass (the time there still counts for the
    // embolic-risk score, trackValveTime)
    if (mustAnswer) return;
    this.crossing.failedPasses++;
    this.log("cross-failed", "The catheter will not go through the valve.");
    if (this.crossing.failedPasses >= MP_LEFT_HEART_TASK.failedPassesForEngageFail) this.host.events.raise("engage-fail", undefined, t, "left-heart");
  }
  private inLvAllowed = false;

  private trackValveTime(dt: number, heightAbove: number, inLv: boolean) {
    const atValve = !inLv && heightAbove >= 0 && heightAbove < MP_LEFT_HEART_TASK.valveZoneMm;
    if (atValve && this.severeAs()) this.crossing.valveTimeS += dt;
    this.crossing.atValve = atValve;
  }

  /** Ectopy from the catheter touching the ventricle: the engine's tip input (lvContact) by the position. */
  private trackTipContact(inLv: boolean, pos: LvPosition) {
    const e = this.host.engine;
    const tip = e.tipInput;
    if (!inLv || tip.location !== "lv") return;
    const want = pos === "apex" || pos === "mitral" || pos === "papillary" || pos === "wall" || !!this.entrapped;
    if (!!tip.lvContact !== want) e.setTip({ ...tip, lvContact: want });
  }

  /** Catheter-induced regurgitation: on the mitral apparatus (MR), on the leaflets (AR), an Amplatz on the valve. */
  private trackRegurgitation(st: ReturnType<LeftHeartHost["store"]["getState"]>, pos: LvPosition, inLv: boolean, t: number) {
    const e = this.host.engine;
    const M = MP_LEFT_HEART_TASK;
    const fam = famOf(st.catheterId);
    // the pigtail's loop on the mitral apparatus (the module text's catheter-induced MR)
    const mr = inLv && pos === "mitral" && fam === "PIG";
    if (mr !== this.ownMr) {
      e.setMitralRegurgitation(mr ? Math.max(M.catheterMr, this.scenarioMr) : this.scenarioMr || null);
      this.ownMr = mr;
      if (mr) this.host.events.raise("catheter-induced-regurgitation", M.holdS.regurg, t, "left-heart");
      this.specCache = null;
    }
    const onLeaflets = !inLv && pos === "leaflets" && !this.iliacStation;
    // an Amplatz opens a cusp only when pushed onto the valve (cramming, or advanced while on the leaflets), not
    // for sitting in the cusp while its loop forms; once open it stays open until the catheter leaves the leaflets
    const insertion = st.controls.insertion;
    if (!(fam === "AL" && onLeaflets)) this.amplatzPushed = false;
    else if (st.tip.cram > 0 || insertion > this.lastInsertion + 0.05) this.amplatzPushed = true;
    this.lastInsertion = insertion;
    // a pigtail makes regurgitation only once it rests on the leaflets, not as it passes through them to cross
    const pigtailResting = fam === "PIG" && t - this.positionSince >= M.leafletDwellS;
    const ar = onLeaflets ? (fam === "AL" ? (this.amplatzPushed ? M.amplatzAr : 0) : pigtailResting ? M.catheterAr : 0) : 0;
    if (ar !== this.ownAr) {
      // the catheter's leak adds to the scenario's own (chronic) AR
      e.setAorticRegurgitation(ar > 0 ? Math.min(1, ar + this.scenarioAr) : this.scenarioAr || null);
      this.ownAr = ar;
      if (ar > 0) this.host.events.raise("catheter-induced-regurgitation", M.holdS.regurg, t, "left-heart");
      this.specCache = null;
    }
    // the Amplatz holding a cusp open and how soon it was repositioned
    const amplatzOpen = fam === "AL" && onLeaflets && this.amplatzPushed;
    if (amplatzOpen && this.amplatzOn === null) {
      this.amplatzOn = t;
      this.amplatz.push({ t, repositionedAfterS: null });
    } else if (this.amplatzOn !== null && !amplatzOpen) {
      const last = this.amplatz[this.amplatz.length - 1];
      if (last) last.repositionedAfterS = t - this.amplatzOn;
      this.amplatzOn = null;
    }
  }

  /**
   * The papillary region (the simple model's static LV): after a moment there the pigtail is caught and will not
   * move until the hub is rotated and the catheter withdrawn (the module text's fix: rotate gently either way and
   * withdraw). While caught, a push or a pull alone is held back.
   */
  private trackEntrapment(st: ReturnType<LeftHeartHost["store"]["getState"]>, pos: LvPosition, t: number) {
    const M = MP_LEFT_HEART_TASK;
    const c = st.controls;
    if (!this.entrapped) {
      // once freed, the pigtail is caught again only after it has left the papillary region
      if (pos !== "papillary") this.entrapReady = true;
      if (this.entrapReady && pos === "papillary" && famOf(st.catheterId) === "PIG" && t - this.positionSince >= M.entrapAfterS) {
        this.entrapped = { insertion: c.insertion, torque: c.cmdTorque, t };
        this.entrapmentCount++;
        this.host.events.raise("papillary-entrapment", undefined, t, "left-heart");
        this.changed();
      }
      return;
    }
    const e = this.entrapped;
    const rotated = Math.abs(c.cmdTorque - e.torque) >= M.freeTorqueRad;
    if (rotated && c.insertion <= e.insertion - M.freeWithdrawMm) {
      this.entrapped = null;
      this.entrapReady = false;
      this.host.events.clear("papillary-entrapment");
      this.log("free-entrapment", "The pigtail comes free.");
      return;
    }
    if (!rotated && Math.abs(c.insertion - e.insertion) > M.holdInsertionMm) {
      // it will not move: the shaft bows at the hub and the tip stays where it is
      const s2 = this.host.store;
      s2.setState({ controls: { ...c, insertion: e.insertion, cmdInsertion: e.insertion, vInsertion: 0 } });
      const s3 = s2.getState();
      s3.setDifficulty(s3.difficulty);
    }
  }

  /** Ectopic beats while the catheter is in the ventricle (the engine's beat morphology). */
  private trackEctopy(inLv: boolean, t: number) {
    if (!inLv || t - this.lastEctopyCheck < 0.1) return;
    this.lastEctopyCheck = t;
    if (this.host.engine.lvWallState().ectopic) this.host.events.raise("lv-ectopy", MP_LEFT_HEART_TASK.holdS.ectopy, t, "left-heart");
  }

  /** The cine pedal fires an armed injector, if the attending lets it. */
  private trackPedal(st: ReturnType<LeftHeartHost["store"]["getState"]>, t: number) {
    const cine = !!this.host.pedal.cine;
    const pressed = cine && !this.lastPedalCine;
    this.lastPedalCine = cine;
    if (!pressed || !this.injector.armed) return;
    this.firePower(st, t);
  }

  /** The action the rules judge, built from the state now. */
  lvAction(withSettings = true): LvAction {
    const task = this.task() ?? (this.inLv ? "ventriculogram" : "aortogram");
    return {
      task,
      position: this.position,
      lvedp: this.lvedp,
      testedHere: !!this.testedAt && this.testedAt.position === this.position && this.testedAt.t >= this.positionSince,
      ...(withSettings ? { settings: { volumeMl: this.injector.settings.volumeMl, rateMlS: this.injector.settings.rateMlS, riseS: this.injector.settings.riseS } } : {}),
    };
  }

  /** Ask the attending's left heart rules before an action (a fresh MentorEngine at the lab's policy, with these rules only). */
  consult(action: "power-inject" | "inject", lv: LvAction = this.lvAction(action === "power-inject")): { allow: boolean; utterance?: MentorUtterance; deferred: readonly DeferredNote[] } {
    const h = this.host;
    const pol = h.controlsPolicy();
    const engine = new MentorEngine({ mode: pol.mode, entrustment: pol.entrustment }, LV_RULES);
    const base = mentorInputFromSim(h.store.getState(), null, h.wall());
    const input: MentorInput & Pick<LvMentorCtx, "lvAction"> = { ...base, lvAction: lv };
    // 'power-inject' is a rule pre-action (RULE_PRE_ACTIONS in src/mentor/rules.ts); the engine passes it to stopOn unchanged
    const r = engine.preAction(action as unknown as PreAction, input);
    return { allow: r.allow, utterance: r.utterance, deferred: engine.deferred };
  }

  private firePower(st: ReturnType<LeftHeartHost["store"]["getState"]>, t: number) {
    const fam = famOf(st.catheterId);
    const engaged = st.engagement.isSelective || st.engagement.isDeep;
    if (engaged || (fam !== "PIG" && !this.inLv)) {
      this.injector.disarm();
      this.log("fire", "Not fired: the power injector is for the chambers and large vessels, through a pigtail.");
      return;
    }
    const lv = this.lvAction(true);
    const g = this.consult("power-inject", lv);
    for (const d of g.deferred) this.deferred.push(d);
    if (!g.allow) {
      if (g.utterance) this.stops.push(g.utterance);
      this.log("stopped-by-attending", g.utterance?.text ?? "Stopped.");
      return;
    }
    // an allowed run with a word from the attending is a note, not a stop
    if (g.utterance) this.notes.push(g.utterance);
    const kind: LeftHeartRun["kind"] = this.iliacStation ? "iliac" : this.inLv ? "lv" : "root";
    const shot = this.injector.fire(t, "left");
    if (!shot) return;
    // the store judges the injection (with the task set, the intended run is not an error). A power run is the
    // left heart task whether or not the tab's task was chosen, and the injector's air check (fire() needs the
    // purge and arm) stands in for the aspirate, so the store's air branch does not score a purged run
    if (!this.task() && kind !== "iliac") this.host.store.getState().setLeftHeartTask(kind === "lv" ? "ventriculogram" : "aortogram");
    this.host.store.setState({ aspirated: "clean" });
    this.host.store.getState().inject();
    const risky = kind === "lv" && (lv.position === "apex" || lv.position === "papillary" || lv.position === "wall");
    if (risky) {
      this.riskyInjections++;
      if (!lv.testedHere) this.untestedRiskyInjections++;
    }
    if (kind === "lv") {
      if (this.lvedpBeforeFirstLvRun === null) this.lvedpBeforeFirstLvRun = this.lvedp !== null;
      if (this.lvedp !== null && this.settingsForLvedp === null) {
        const S = shot.settings;
        this.settingsForLvedp = this.lvedp <= LVEDP_RULES.reduceAboveMmHg || (S.volumeMl <= LVEDP_RULES.reduced.volumeMl && S.rateMlS <= LVEDP_RULES.reduced.rateMlS);
      }
    }
    if (kind === "root" && lv.position === "leaflets") this.aortogramOnLeaflets++;
    const run = this.newRun(kind, "power", shot.settings, lv.position, t);
    this.power = { shot, run, lvRun: kind === "lv", whipped: false, finished: false };
    this.runBeat = this.host.engine.clockState().beat;
    this.log("fire", `Injector fired: ${shot.settings.volumeMl} mL at ${shot.settings.rateMlS} mL/s${shot.pressureLimited ? " (held at the pressure limit)" : ""}.`);
  }

  private newRun(kind: LeftHeartRun["kind"], via: LeftHeartRun["via"], settings: PowerInjectorSettings | null, position: LvPosition, t: number): LeftHeartRun {
    const st = this.host.store.getState();
    const run: LeftHeartRun = {
      id: this.runs.length + 1,
      kind,
      via,
      t,
      position,
      settings,
      volumeMl: 0,
      view: runViewOf(st.cArm),
      cArm: { ...st.cArm },
      filmed: !!this.host.pedal.cine,
      beats: 0,
      ectopicBeats: 0,
      catheterMr: this.ownMr,
      catheterAr: this.ownAr > 0,
      stainMl: 0,
      truth: this.truthNow(),
      spec: this.sceneSpec(),
    };
    this.runs.push(run);
    return run;
  }

  /** The case's truth now (the reader is compared with it). */
  truthNow(): RunTruth {
    const spec = this.sceneSpec();
    const segments = {} as Record<LvSegment, WallMotionClass>;
    for (const s of LV_SEGMENTS) segments[s] = spec.takotsubo ? (s === "apical" ? "dyskinetic" : "normal") : wallMotionClassOf(wallMotionScale(spec.segments?.[s] ?? "normal"));
    const ef = spec.ef ?? 60;
    return { global: globalFunctionOf(ef), ef, segments, mr: this.findings?.mr ?? 0, ar: this.findings?.ar ?? 0, territory: this.findings?.territory ?? null, label: this.findings?.label ?? "the patient's left heart" };
  }

  /** The power run while it lasts: whip, staining, beats; its end books the contrast. */
  private trackPowerRun(t: number, dt: number) {
    const p = this.power;
    if (!p || p.finished) return;
    const inj = this.injector;
    const run = p.run;
    const tr = p.shot.trace;
    const el = inj.elapsed(t) ?? 0;
    const pushing = el >= tr.pushStart && el < (tr.pushEnd ?? 0);
    // catheter whip: an abrupt high-flow start moves the catheter (the module text's reason for a rise time)
    if (pushing && !p.whipped && p.lvRun) {
      p.whipped = true;
      const S = p.shot.settings;
      if (S.rateMlS >= MP_LEFT_HEART_TASK.whip.rateMlS && S.riseS < MP_LEFT_HEART_TASK.whip.riseS && !this.host.physics?.active) {
        const st = this.host.store.getState();
        const c = st.controls;
        const x = c.insertion + MP_LEFT_HEART_TASK.whip.depthMm;
        this.host.store.setState({ controls: { ...c, insertion: x, cmdInsertion: x, vInsertion: 0 } });
        const s2 = this.host.store.getState();
        s2.setDifficulty(s2.difficulty);
        this.log("fire", "The catheter jumped as the injection started.");
      }
    }
    // contrast into the wall while the tip is there
    if (pushing && p.lvRun && this.position === "wall") {
      const i = Math.floor(el / tr.dt);
      const q = tr.q[i] ?? 0;
      run.stainMl += q * dt * MP_LEFT_HEART_TASK.stain.wallShare;
    }
    // beats during the run (cine and contrast in the ventricle): ectopic or clean
    const beat = this.host.engine.clockState().beat;
    if (beat !== this.runBeat) {
      this.runBeat = beat;
      if (this.host.pedal.cine && el <= (tr.pushEnd ?? 0) + 2) {
        run.filmed = true;
        run.beats++;
        if (this.host.engine.lvWallState().ectopic) run.ectopicBeats++;
      }
    }
    if (this.ownMr) run.catheterMr = true;
    if (this.ownAr > 0) run.catheterAr = true;
    inj.advance(t);
    if (inj.state === "done") this.endPowerRun();
  }

  /** Book the power injection's contrast and start what it causes (a stain, the volume load). */
  private endPowerRun() {
    const p = this.power;
    if (!p || p.finished) return;
    p.finished = true;
    const h = this.host;
    const t = h.wall();
    const vol = p.shot.trace.volumeMl;
    const run = p.run;
    run.volumeMl = vol;
    const st = h.store.getState();
    if (st.contrastSource === "syringe") st.bookContrast(vol);
    h.engine.contrast(vol, run.kind === "lv" ? "lv" : "root");
    if (run.kind === "lv") {
      this.lastLvRunEnd = t;
      this.oedemaWatchUntil = t + MP_LEFT_HEART_TASK.oedemaWatchS;
      h.engine.loadVolume(vol * MP_LEFT_HEART_TASK.oedemaVolumePerMl, 60);
      if (run.stainMl >= MP_LEFT_HEART_TASK.stain.minMl) this.startStain(run.stainMl, t);
      if (run.beats > run.ectopicBeats) this.cleanCycleRecorded = true;
    }
    this.injector.reset();
    this.specCache = null;
    this.changed();
  }
  private cleanCycleRecorded = false;

  private startStain(ml: number, t: number) {
    const seg: LvSegment = "apical";
    const S = MP_LEFT_HEART_TASK.stain;
    const prev = this.stain?.ml ?? 0;
    this.stain = { segment: seg, t, pushEndT: t, ml: prev + ml };
    this.host.events.hold(["myocardial-stain"], t, "left-heart");
    const big = ml > S.minMl * 2;
    if (big) {
      const mlS = S.leakMlSPerMl * ml;
      this.leak = { from: t + S.delayS, until: t + S.delayS + S.bleedS * (this.setup?.aneurysm ? 1.5 : 1), mlS };
    }
    this.log("fire", big ? "Contrast stays in the myocardium after the run: a stain." : "A small blush stays in the wall.");
  }

  /** The hand injection the session started: a test injection in the ventricle, or a hand run. */
  onHandInject(ev: SessionInjection) {
    const st = this.host.store.getState();
    const t = ev.t;
    if (this.inLv) {
      this.testedAt = { position: this.position, t };
      const atWall = this.position === "wall";
      const run = this.newRun("lv", "hand", null, this.position, t);
      run.volumeMl = LEFT_HEART_SOURCED.testInjectionMl;
      if (atWall) {
        run.stainMl = MP_LEFT_HEART_TASK.stain.minMl;
        this.startStain(MP_LEFT_HEART_TASK.stain.minMl, t);
      }
      this.log("test-injection", atWall ? "Hand test injection: the contrast stays in the wall." : this.position === "apex" ? "Hand test injection: ectopics; the contrast washes out of the apex." : "Hand test injection: the contrast mixes freely in the cavity.");
    } else if (famOf(st.catheterId) === "PIG" && this.position === "leaflets" && this.task() === "aortogram") {
      this.aortogramOnLeaflets++;
    }
  }

  /** The pullback: the LV systolic on the catheter and the sheath side arm's, then the aortic systolic as the tip comes back. */
  private trackPullback(inLv: boolean) {
    if (!this.pullbackRecording) return;
    const v = this.host.engine.vitals();
    if (inLv && v.tipState === "lv" && v.art) {
      this.pullback.lvSys = Math.max(this.pullback.lvSys ?? 0, v.art.sys);
      this.pullback.sideArmSys = v.aortaTrue.sys;
    } else if (!inLv && this.pullback.lvSys !== null && v.art && v.tipState === "aortic") {
      const lv = Math.round(this.pullback.lvSys);
      const ao = Math.round(v.art.sys);
      const side = this.pullback.sideArmSys !== null ? Math.round(this.pullback.sideArmSys) : null;
      this.pullbackRecording = false;
      this.pullbackDone = true;
      this.log("pullback", `Pullback recorded: LV ${lv} mmHg, aorta ${ao} mmHg${side !== null ? ` (side arm ${side} mmHg while in the LV)` : ""}; peak to peak ${Math.max(0, lv - ao)} mmHg.`);
    }
  }
  private pullbackDone = false;

  /** The stain's leak, the tamponade, the oedema and the low pressure that follow. */
  private trackComplications(dt: number, t: number) {
    const h = this.host;
    const e = h.engine;
    const M = MP_LEFT_HEART_TASK;
    // the leak from the stained myocardium into the pericardium
    const lk = this.leak;
    if (lk) {
      if (t >= lk.from && t < lk.until) e.setPericardialInflow(lk.mlS);
      else if (t >= lk.until) {
        e.setPericardialInflow(0);
        this.leak = null;
      }
    }
    if (this.drainLeft) {
      const v = e.vitals().pericardialMl;
      if (v > 1) e.drainPericardium(Math.min(v, (lk && t >= lk.from ? lk.mlS : 0) * dt + v * M.drainFractionPerS * dt));
    }
    const v = e.vitals();
    if (v.pericardialMl > M.tamponadeMl && !this.tamponade) {
      this.tamponade = { onsetT: t, echoT: null, pericardiocentesisT: null, drain: this.drainLeft, heparinReviewed: false, hrRising: false };
      h.events.raise("tamponade", undefined, t, "left-heart");
      this.changed();
    }
    // pulmonary oedema after an LV run in a patient whose LVEDP climbs above the module text's line
    if (!this.oedema && t <= this.oedemaWatchUntil && t > this.lastLvRunEnd && v.lvedp > LVEDP_RULES.oedemaAboveMmHg) {
      this.oedema = { onsetT: t };
      h.events.hold(["pulmonary-oedema"], t, "left-heart");
      this.log("patient", "The patient coughs and is short of breath; the saturation is falling.");
    }
    // hypotension: the true aortic systolic below the physiologist's call-out, for its hold
    const sys = v.aortaTrue.sys;
    if (v.hr !== null && sys < MP_CALLOUT_SYSTOLIC_MMHG) {
      if (this.hypoSince === null) {
        this.hypoSince = t;
        this.hrAtHypoStart = v.hr;
      } else if (t - this.hypoSince >= MP_CALLOUT_HOLD_S) {
        // only while one of this module's own complications is active: every other low pressure is the session's
        // to raise (labSession.ts, with the tip free in the root)
        const own = !!this.tamponade || !!this.oedema || !!this.stain || !!this.leak;
        if (own && !h.events.isActive("hypotension", t)) h.events.raise("hypotension", M.holdS.hypotension, t, "left-heart");
        if (this.tamponade && this.hrAtHypoStart !== null && v.hr > this.hrAtHypoStart + 5) this.tamponade.hrRising = true;
      }
    } else this.hypoSince = null;
  }

  /** The debrief's record. */
  score(): LeftHeartScore {
    const C = this.crossing;
    const st = { valveTimeS: C.valveTimeS, forceful: 0, passages: C.passes };
    const indicated = this.setup?.crossingIndicated ?? true;
    return {
      task: this.task(),
      lvedpRecorded: this.lvedp,
      lvedpRecordedBeforeInjection: this.lvedpBeforeFirstLvRun,
      riskyPositionInjections: this.riskyInjections,
      untestedRiskyInjections: this.untestedRiskyInjections,
      settingsForLvedp: this.settingsForLvedp,
      airCheckBeforeArming: this.airCheckBeforeArming,
      cleanCycleRecorded: this.cleanCycleRecorded,
      pullbackRecorded: this.pullbackDone,
      removedOverWire: this.removedOverWire,
      aortogramOnLeaflets: this.aortogramOnLeaflets,
      stain: !!this.stain,
      tamponade: this.tamponade ? { ...this.tamponade } : null,
      oedema: this.oedema ? { onsetT: this.oedema.onsetT, firstActions: this.oedemaActions.slice(0, 3) } : null,
      crossing: {
        passes: C.passes,
        failedPasses: C.failedPasses,
        valveTimeS: C.valveTimeS,
        crossedAt: C.crossedAt,
        escalation: C.escalation.slice(),
        unnecessary: this.severeAs() && isUnnecessaryCrossing(indicated, C.passes > 0),
        risk: embolicRisk(st),
        riskScore: embolicRiskScore(st),
        askedIndicated: this.crossQuestion.answer,
      },
      entrapments: this.entrapmentCount,
      amplatzOnValve: this.amplatz.map((a) => ({ ...a })),
      stops: this.stops.slice(),
      notes: this.notes.slice(),
      deferred: this.deferred.slice(),
      readings: this.readings.map((r) => this.compare(r)).filter((x): x is ReadingComparison => !!x),
    };
  }

  /** Clean up what the module set on the shared engine. */
  dispose() {
    const e = this.host.engine;
    if (this.ownMr || this.scenarioMr > 0) e.setMitralRegurgitation(null);
    if (this.ownAr > 0 || this.scenarioAr > 0) e.setAorticRegurgitation(null);
    if (this.leak) e.setPericardialInflow(0);
  }
}

declare module "../../lab/controls/types" {
  interface LabCapabilities {
    /** the left heart tasks (diag-lv-aorta-task, src/ui/sim/modules/leftHeart.ts) */
    leftHeart: LeftHeartControl;
  }
}

/** The left heart controls of a session (the capability), or null. */
export function leftHeartOf(session: { capability?: (k: "leftHeart") => LeftHeartControl | null } | null | undefined): LeftHeartControl | null {
  return session && typeof session.capability === "function" ? session.capability("leftHeart") : null;
}

export function createSessionModule(): SessionModule {
  let ctl: LeftHeartControl | null = null;
  return {
    id: LEFT_HEART_MODULE_ID,
    attach(session) {
      ctl = new LeftHeartControl(session);
      ctl.applySetup();
      session.provideCapability("leftHeart", ctl);
      return () => {
        ctl?.dispose();
        session.provideCapability("leftHeart", null);
        ctl = null;
      };
    },
    step(dt) {
      ctl?.step(dt);
    },
    onInject(ev) {
      ctl?.onHandInject(ev);
    },
    events() {
      return ctl ? ctl.events() : [];
    },
  };
}
