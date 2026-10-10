// ---------------------------------------------------------------------------
// Torque-directed right heart catheterisation (haemo-rhc-manoeuvre).
//
// The haemodynamics lab's right heart catheter is steered by hand: it is
// flushed, inserted through the sheath, advanced, withdrawn and turned, and it
// goes where the anatomy and the technique take it. The topology is the pacing
// lab's chamber-zone model (src/simulation/pacing.ts: LeadState, moveLead,
// rotateLead, directionOf, nextZone, prevZone, ZONE_LEN), used through its
// exported functions only and without changing what ZONE_LEN means. This file
// adds a catheter profile and two zones of its own on a separate map
// (RHC_ZONE_LEN): a renal vein side branch off the IVC and the wedge position
// beyond the pulmonary artery. The pacing zones it relies on:
//   femoral   IVC → RA (the tip pointing laterally catches in a hepatic vein);
//             from the RA without a loop the catheter runs up into the SVC, a
//             lateral push forms a loop against the RA wall, and only from the
//             loop does it prolapse across the tricuspid valve (Oxford ch 4:
//             "Often you must form a loop in the right atrium").
//   jugular   SVC → RA → RV directly when the tip points at the valve.
//   RV        inflow → apex (default), septum (posterior) or RVOT (superior,
//             cranial), RVOT → PA.
//
// What follows the technique (each rule cites the module text or is a MODEL
// PARAMETER listed in docs/realism/facts/pkg-haemo-rhc-manoeuvre.md):
//   - the tip catches in a venous side branch on the femoral passage; back off
//     and turn it (hb-cardiac-catheterisation-rhc, step 2);
//   - the RV is entered only from an RA loop on the femoral route (step 3);
//   - ventricular ectopy on entering the RV (step 4), and ectopy and runs of VT
//     whose hazard grows with the force of the manipulation and is highest in
//     the outflow tract (table "Ectopy or ventricular tachycardia");
//   - the PA is reached by withdrawing off the apex, turning the tip cranially
//     and advancing (step 5); a deep breath helps it across (step 7);
//   - the wedge is reached by a gentle advance on inspiration (step 7), with
//     the balloon up for a balloon-tipped catheter;
//   - torque that does not reach the tip winds up the shaft (catheter-kink);
//   - a knot after prolonged, forceful manipulation (accumulated turns and
//     time in the heart), with Oxford's bail-out: call for help, do not pull
//     tight, try the wire, otherwise tighten it and remove it with the sheath
//     ("A knotted catheter"); pulling it tight before help is called is a
//     critical error;
//   - AF from atrial manipulation, in the three variants of hb-background-general
//     (tip haemo-bg-af-in-lab): self-limiting, severe compromise (oxygen and
//     heparin, then a synchronised shock), milder compromise (heparin, then
//     flecainide without structural heart disease, or amiodarone).
//
// Nothing here names a position or a complication on the live screen: the
// messages say what an operator feels and sees (resistance, the tip turning
// off its line on screening, ectopics on the monitor). The events go to the
// tip context through the study's 'raise' action (rhcSyncActions); the
// complications are named in the debrief (rhcDecisions, rhcErrors).
//
// Pure and deterministic: the random draws come from a seeded generator kept
// in the state, and time is passed in by the caller (seconds of lab time).
// ---------------------------------------------------------------------------

import type { LabEvent } from "../content/lab/tips";
import type { DecisionRecord } from "../mentor/ledger";
import { inspiration } from "./haemo";
import type { HaemoAction, HaemoStudyState, RhcCatheter } from "./haemoStudy";
import {
  directionOf,
  initialLead,
  moveLead,
  nextZone,
  PERFORATION_PUSH,
  prevZone,
  rotateLead,
  ZONE_LEN,
  type LeadState,
  type LeadZone,
  type TipDirection,
} from "./pacing";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The catheter in the operator's hands. */
export type RhcProfile = "multipurpose" | "balloon" | "pigtail";
export const RHC_PROFILES: readonly RhcProfile[] = ["multipurpose", "balloon", "pigtail"];
/** The venous route (the pacing model's femoral and right internal jugular routes). */
export type RhcRoute = "femoral" | "rij";
/** The zones this file adds on its own map. */
export type RhcExtraZone = "renal" | "wedge";
export type RhcZone = LeadZone | RhcExtraZone;

/** Length of the zones this file adds (model cm, as ZONE_LEN). MODEL PARAMETER. */
export const RHC_ZONE_LEN: Readonly<Record<RhcExtraZone, number>> = { renal: 3, wedge: 1 };

export const RHC_PRESETS = ["rhc-femoral-mp", "rhc-knot-risk", "rhc-af", "rhc-rvot-irritable"] as const;
export type RhcPresetId = (typeof RHC_PRESETS)[number];
export const isRhcPreset = (x: unknown): x is RhcPresetId => typeof x === "string" && (RHC_PRESETS as readonly string[]).includes(x);

export type AfVariant = "self-limiting" | "severe" | "mild";
export const AF_VARIANTS: readonly AfVariant[] = ["self-limiting", "severe", "mild"];

/** A management step during an arrhythmia (no doses: the haemo lab has no drug engine). */
export type RhcTreatment = "oxygen" | "heparin" | "sync-cardioversion" | "unsync-shock" | "flecainide" | "amiodarone";
export const RHC_TREATMENTS: readonly { id: RhcTreatment; label: string }[] = [
  { id: "oxygen", label: "High-flow oxygen" },
  { id: "heparin", label: "IV heparin" },
  { id: "sync-cardioversion", label: "Synchronised shock" },
  { id: "unsync-shock", label: "Unsynchronised shock" },
  { id: "flecainide", label: "Flecainide" },
  { id: "amiodarone", label: "Amiodarone" },
];

export interface RhcVt {
  start: number;
  /** last manipulation that provoked or kept it going */
  lastProvoked: number;
  /** lasted long enough not to stop on its own */
  sustained: boolean;
}

export interface RhcAf {
  start: number;
  variant: AfVariant;
  /** ventricular rate, /min */
  rate: number;
  /** last atrial manipulation (keeps a self-limiting episode going) */
  lastProvoked: number;
  treatments: { id: RhcTreatment; t: number }[];
  /** time it ended, or null while it lasts */
  endedAt: number | null;
  /** a severe episode went past AF_PROMPT_S without a synchronised shock (noted once) */
  late?: boolean;
}

export interface RhcKnot {
  formedAt: number;
  helpAt: number | null;
  wireTriedAt: number | null;
  tightAt: number | null;
  /** withdrawals against the knot */
  pulls: number;
  resolved: "undone" | "removed" | null;
}

export type RhcErrorId =
  | "knot-pulled-tight-before-help"
  | "knot-tightened-before-wire"
  | "inserted-unflushed"
  | "forceful-pa-advance"
  | "cardioversion-self-limiting"
  | "unsynchronised-shock"
  | "af-shock-late"
  | "flecainide-structural"
  | "af-drug-without-heparin";

export interface RhcError {
  id: RhcErrorId;
  t: number;
  critical: boolean;
  text: string;
}

export interface RhcState {
  profile: RhcProfile;
  route: RhcRoute;
  preset: RhcPresetId | null;
  /** seeded generator state (uint32) */
  seed: number;
  /** lab time of the last step, s */
  t: number;
  flushed: boolean;
  inserted: boolean;
  /** the pacing lead model carries zone, position, rotation, push and the RA loop */
  lead: LeadState;
  /** a zone of this file's own map the tip is in (beyond the lead's zone), or null */
  extra: RhcExtraZone | null;
  extraPos: number;
  /** the femoral passage: whether the first passage up the IVC has been made, and the direction in which the tip catches a side branch */
  ivcPassed: boolean;
  trap: TipDirection | null;
  balloon: boolean;
  wire: boolean;
  /** rotation stored in the shaft that did not reach the tip, degrees (signed) */
  windup: number;
  /** turns of the tip in the heart (knot risk), and seconds spent in the RA loop or the RV */
  turns: number;
  heartS: number;
  /** the deep breath asked for lasts until this time */
  breathUntil: number;
  ectopyUntil: number;
  vt: RhcVt | null;
  af: RhcAf | null;
  knot: RhcKnot | null;
  /** furthest milestone this catheter has reached (0 out, 1 RA, 2 RV, 3 PA, 4 wedge) and when progress was last made */
  furthest: number;
  progressAt: number;
  /** furthest milestone of the whole study, over every passage (for the debrief) */
  bestReached: number;
  /** hub rotation in the current burst of turning: degrees turned since `from` (a burst lasts RHC_TURN_BURST_S) */
  turnBurst: { from: number; deg: number };
  /** episodes so far, for the debrief */
  vtRuns: number;
  afEpisodes: AfVariant[];
  /** irritability of the ventricle (a preset), multiplies the ectopy and VT hazards */
  irritability: number;
  /** probability of AF per atrial manipulation (a preset raises it) */
  afHazard: number;
  /** probability that the tip catches a side branch on the first femoral passage */
  sideBranchHazard: number;
  /** the AF variant the next episode takes, when a preset fixes it */
  afVariant: AfVariant | null;
  errors: RhcError[];
  /** what the operator noticed on the last action */
  messages: string[];
  /** rhythm changes, for the ECG strip: kind and rate from time t */
  rhythm: { t: number; kind: RhcRhythmKind; rate: number }[];
}

export type RhcRhythmKind = "sinus" | "ectopy" | "vt" | "af";

/** What the step needs from the study around the catheter. */
export interface RhcEnv {
  /** spontaneous respiration on the recorder */
  resp: boolean;
  /** the patient has structural heart disease (flecainide is then not the drug) */
  structural?: boolean;
  /** sinus rate of the scenario, /min */
  hr?: number;
}

export type RhcAction =
  | { type: "flush" }
  | { type: "insert" }
  | { type: "advance"; cm: number }
  | { type: "withdraw"; cm: number }
  | { type: "rotate"; deg: number }
  | { type: "profile"; profile: RhcProfile }
  | { type: "route"; route: RhcRoute }
  | { type: "balloon"; up: boolean }
  | { type: "wire"; on: boolean }
  | { type: "deep-breath" }
  | { type: "call-help" }
  | { type: "wire-advance" }
  | { type: "pull-tight" }
  | { type: "remove-with-sheath" }
  | { type: "treat"; treatment: RhcTreatment }
  | { type: "tick" };

// ---------------------------------------------------------------------------
// Model parameters (docs/realism/facts/pkg-haemo-rhc-manoeuvre.md)
// ---------------------------------------------------------------------------

/** An advance of this much or less is gentle; more is firm (model cm). MODEL PARAMETER. */
export const RHC_GENTLE_CM = 1;
/** The step sizes the panel offers (model cm). MODEL PARAMETER. */
export const RHC_STEP = { gentle: 0.5, firm: 2 } as const;
/** Push against a terminal position never reaches the pacing model's perforation push: the catheter buckles instead (model cm). MODEL PARAMETER. */
export const RHC_MAX_PUSH = PERFORATION_PUSH * 0.9;
/** Share of a hub rotation that reaches the tip, by catheter (the soft J wire adds RHC_WIRE_TORQUE). MODEL PARAMETER. */
export const RHC_TORQUE: Readonly<Record<RhcProfile, number>> = { multipurpose: 0.85, balloon: 0.5, pigtail: 0.7 };
export const RHC_WIRE_TORQUE = 0.1;
/** Stored shaft rotation at which the tip no longer follows the hub (catheter-kink), degrees. MODEL PARAMETER. */
export const RHC_KINK_WINDUP_DEG = 360;
/** Time constant of the stored rotation relaxing, s. MODEL PARAMETER. */
export const RHC_WINDUP_RELAX_S = 15;
/** A withdrawal in the RV counts as this share of an advance of the same length for the ventricular hazards. MODEL PARAMETER. */
export const RHC_WITHDRAW_FORCE = 0.5;
/** Force of a turn of the hub for the ventricular hazards: this much per 90 degrees. MODEL PARAMETER. */
export const RHC_TURN_FORCE_PER_90 = 0.5;
/** Hub rotation within one burst of turning (RHC_TURN_BURST_S) that counts as a forceful turn for the knot, degrees. MODEL PARAMETER. */
export const RHC_FORCEFUL_TURN_DEG = 90;
/** A burst of turning: rotations of the hub within this many seconds of the first add up, s. MODEL PARAMETER. */
export const RHC_TURN_BURST_S = 2;
/** Sinus rate when the scenario gives none, /min. MODEL PARAMETER. */
export const RHC_DEFAULT_HR = 70;
/** Seconds without progress before engage-fail (the plan's design value, lab-build-plan.json tipIntegration). MODEL PARAMETER. */
export const RHC_ENGAGE_FAIL_S = 45;
/** Probability that the tip catches a side branch on the first femoral passage, by catheter (balloon up lowers it). MODEL PARAMETER. */
export const RHC_SIDE_BRANCH_P: Readonly<Record<RhcProfile, number>> = { multipurpose: 0.3, balloon: 0.15, pigtail: 0.2 };
export const RHC_BALLOON_UP_SIDE_BRANCH = 0.3;
/** Ectopy and VT hazards per manipulation in the RV: base probabilities, zone weights (the outflow tract highest, Oxford ch 4 and ch 10), and the force law. MODEL PARAMETERS. */
export const RHC_P_ECTOPY = 0.25;
export const RHC_P_ECTOPY_ON_ENTRY = 0.8;
export const RHC_P_VT = 0.02;
export const RHC_ZONE_IRRITABILITY: Readonly<Partial<Record<LeadZone, number>>> = { "rv-inflow": 0.5, "rv-apex": 1, "rv-septum": 1, rvot: 3 };
/** Balloon up halves the ventricular hazards (a floating tip). MODEL PARAMETER. */
export const RHC_BALLOON_UP_HAZARD = 0.5;
export const RHC_P_MAX = 0.9;
/** Ectopy lasts this long after the last provocation, s. MODEL PARAMETER. */
export const RHC_ECTOPY_S = 3;
/** A VT run stops this long after the last provocation unless the tip is pressed into the ventricle, s. MODEL PARAMETER. */
export const RHC_VT_RUN_S = 4;
/** A run lasting this long is sustained: it stops only with a synchronised shock, s. MODEL PARAMETER. */
export const RHC_VT_SUSTAINED_S = 30;
/** VT lasting this long lowers the arterial pressure (hypotension), s. MODEL PARAMETER. */
export const RHC_VT_HYPOTENSION_S = 10;
/** VT rate, /min. MODEL PARAMETER. */
export const RHC_VT_RATE = 180;
/** Probability that the tip bounces back off the pulmonary valve without a breath in, from the outflow tract. MODEL PARAMETER. */
export const RHC_P_RVOT_BOUNCE = 0.5;
export const RHC_P_RVOT_BOUNCE_BALLOON = 0.2;
/** Inspiration (0..1) at or above which an advance wedges or crosses into the PA as on a breath in. MODEL PARAMETER. */
export const RHC_INSP_THRESHOLD = 0.5;
/** How long a deep breath asked for is held, s. MODEL PARAMETER. */
export const RHC_DEEP_BREATH_S = 4;
/** Knot risk: turns and seconds in the RA loop or the RV that make up one unit of risk, and the probability per manipulation once the risk reaches 1. MODEL PARAMETERS. */
export const RHC_KNOT_TURNS = 6;
export const RHC_KNOT_TIME_S = 600;
export const RHC_P_KNOT = 0.3;
/** Probability that advancing the wire undoes a knot ("now and then", Oxford ch 4). MODEL PARAMETER. */
export const RHC_P_KNOT_UNDO = 0.35;
/** AF: base probability per atrial manipulation, the preset's, the share of episodes that stop on their own ("most episodes stop", hb-background-general), and their timing. MODEL PARAMETERS. */
export const RHC_P_AF = 0.01;
export const RHC_P_AF_PRESET = 0.5;
export const RHC_AF_SELF_LIMITING_SHARE = 0.8;
export const RHC_AF_SELF_S = 60;
export const RHC_AF_DRUG_S = 30;
export const RHC_AF_PROMPT_S = 120;
/** AF ventricular rates by variant, /min: severe above Oxford's 150 (tip haemo-bg-af-in-lab), mild below it. MODEL PARAMETERS. */
export const RHC_AF_RATE: Readonly<Record<AfVariant, number>> = { "self-limiting": 130, severe: 165, mild: 120 };
/** Oxford's severe-compromise rate (tip haemo-bg-af-in-lab, Oxford ch 10). */
export const AF_SEVERE_RATE = 150;
/** Presets: ventricular irritability of 'rhc-rvot-irritable', and the preloaded knot risk of 'rhc-knot-risk'. MODEL PARAMETERS. */
export const RHC_IRRITABLE = 2.5;
export const RHC_KNOT_RISK_PRELOAD = { turns: 5, heartS: 420 } as const;

/** Events this catheter reports to the tip context. */
export const RHC_EVENTS = ["engage-fail", "catheter-kink", "catheter-knot", "vt", "atrial-fibrillation", "hypotension"] as const satisfies readonly LabEvent[];
export type RhcEvent = (typeof RHC_EVENTS)[number];

// ---------------------------------------------------------------------------
// Seeded generator
// ---------------------------------------------------------------------------

/** One draw in [0, 1) from the state's generator (mulberry32); advances st.seed. */
function draw(st: RhcState): number {
  let a = (st.seed + 0x6d2b79f5) >>> 0;
  st.seed = a;
  a = Math.imul(a ^ (a >>> 15), a | 1);
  a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
  return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const entryZone = (route: RhcRoute): LeadZone => (route === "femoral" ? "ivc" : "svc");
const RV_ZONES: readonly LeadZone[] = ["rv-inflow", "rv-apex", "rv-septum", "rvot"];
const ATRIAL_ZONES: readonly LeadZone[] = ["ra", "raa", "cs"];

export function initialRhc(preset: RhcPresetId | null = null, seed = 1): RhcState {
  const st: RhcState = {
    profile: "multipurpose",
    route: "femoral",
    preset,
    seed: seed >>> 0,
    t: 0,
    flushed: false,
    inserted: false,
    lead: initialLead("femoral"),
    extra: null,
    extraPos: 0,
    ivcPassed: false,
    trap: null,
    balloon: false,
    wire: false,
    windup: 0,
    turns: 0,
    heartS: 0,
    breathUntil: -1,
    ectopyUntil: -1,
    vt: null,
    af: null,
    knot: null,
    furthest: 0,
    progressAt: 0,
    bestReached: 0,
    turnBurst: { from: -1e9, deg: 0 },
    vtRuns: 0,
    afEpisodes: [],
    irritability: 1,
    afHazard: RHC_P_AF,
    sideBranchHazard: RHC_SIDE_BRANCH_P.multipurpose,
    afVariant: null,
    errors: [],
    messages: [],
    rhythm: [{ t: 0, kind: "sinus", rate: 0 }],
  };
  if (!preset) return st;
  // every preset is the femoral route with a multipurpose catheter (lab request hb-cardiac-catheterisation#5)
  st.flushed = true;
  switch (preset) {
    case "rhc-femoral-mp":
      // the first passage catches a side branch, so the learner meets it
      st.sideBranchHazard = 1;
      break;
    case "rhc-knot-risk":
      // a long passage already: the catheter in the RV inflow from an RA loop, with knot risk built up
      placeAt(st, "rv-inflow", 1, true);
      st.turns = RHC_KNOT_RISK_PRELOAD.turns;
      st.heartS = RHC_KNOT_RISK_PRELOAD.heartS;
      break;
    case "rhc-af": {
      placeAt(st, "ra", 2, false);
      st.afHazard = RHC_P_AF_PRESET;
      // the episode's variant varies with the seed, so repeated practice meets all three
      st.afVariant = AF_VARIANTS[Math.floor(draw(st) * AF_VARIANTS.length) % AF_VARIANTS.length];
      break;
    }
    case "rhc-rvot-irritable":
      placeAt(st, "rvot", 1.5, true);
      st.lead = rotateLead(st.lead, 270); // pointing cranially (superior)
      st.irritability = RHC_IRRITABLE;
      break;
  }
  return st;
}

/** Put the catheter in a zone as a preset's starting position (the femoral passage done). */
function placeAt(st: RhcState, zone: LeadZone, pos: number, loop: boolean): void {
  st.inserted = true;
  st.ivcPassed = true;
  st.lead = { ...initialLead("femoral"), zone, pos: Math.min(pos, ZONE_LEN[zone]), loop };
  st.furthest = milestoneOf(st);
  st.bestReached = st.furthest;
  st.progressAt = 0;
}

/** The zone of the tip on the combined map. */
export function rhcZone(st: RhcState): RhcZone | null {
  if (!st.inserted) return null;
  return st.extra ?? st.lead.zone;
}

/** Milestone of the current position: 0 out, 1 venous or RA, 2 RV, 3 PA, 4 wedge. */
function milestoneOf(st: RhcState): number {
  const z = rhcZone(st);
  if (!z) return 0;
  if (z === "wedge") return 4;
  if (z === "pa") return 3;
  if ((RV_ZONES as readonly string[]).includes(z)) return 2;
  if (z === "ra" || z === "raa" || z === "cs") return 1;
  return 0;
}

/** The furthest milestone this catheter goes for (a pigtail stops in the PA). */
const goalOf = (st: RhcState) => (st.profile === "pigtail" ? 3 : 4);

/** Inspiration now: a deep breath asked for, otherwise the respiratory cycle of the recorder (src/simulation/haemo.ts inspiration()). */
export function rhcInspiration(st: RhcState, env: Pick<RhcEnv, "resp">): number {
  if (st.t < st.breathUntil) return 1;
  return env.resp ? inspiration(st.t) : 0;
}

const torqueOf = (st: RhcState) => (st.knot && !st.knot.resolved ? 0 : Math.min(0.95, RHC_TORQUE[st.profile] + (st.wire ? RHC_WIRE_TORQUE : 0)));

const knotActive = (st: RhcState) => !!st.knot && !st.knot.resolved && st.inserted;
const inHeartForKnot = (st: RhcState) => st.inserted && !st.extra && ((RV_ZONES as readonly string[]).includes(st.lead.zone) || (st.lead.zone === "ra" && st.lead.loop));

/** The knot risk: one unit of RHC_KNOT_TURNS turns plus one of RHC_KNOT_TIME_S seconds in the RA loop or RV. */
export function knotRisk(st: Pick<RhcState, "turns" | "heartS">): number {
  return st.turns / RHC_KNOT_TURNS + st.heartS / RHC_KNOT_TIME_S;
}

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

function rhythmNow(st: RhcState, env: RhcEnv): { kind: RhcRhythmKind; rate: number } {
  if (st.vt) return { kind: "vt", rate: RHC_VT_RATE };
  if (st.af && st.af.endedAt === null) return { kind: "af", rate: st.af.rate };
  if (st.t < st.ectopyUntil) return { kind: "ectopy", rate: env.hr ?? RHC_DEFAULT_HR };
  return { kind: "sinus", rate: env.hr ?? RHC_DEFAULT_HR };
}

function noteRhythm(st: RhcState, env: RhcEnv): void {
  const r = rhythmNow(st, env);
  const last = st.rhythm[st.rhythm.length - 1];
  if (!last || last.kind !== r.kind || last.rate !== r.rate) {
    st.rhythm = [...st.rhythm, { t: st.t, kind: r.kind, rate: r.rate }].slice(-40);
  }
}

/** Advance time-based processes to t. */
function advanceTime(st: RhcState, t: number, env: RhcEnv): void {
  const dt = Math.max(0, t - st.t);
  st.t = Math.max(st.t, t);
  if (dt > 0) {
    st.windup *= Math.exp(-dt / RHC_WINDUP_RELAX_S);
    if (Math.abs(st.windup) < 0.5) st.windup = 0;
    if (inHeartForKnot(st)) st.heartS += dt;
  }
  // VT stops a while after the last provocation, unless the tip is pressed into the ventricle; a long run is sustained
  if (st.vt) {
    if (!st.vt.sustained && st.t - st.vt.start >= RHC_VT_SUSTAINED_S) st.vt = { ...st.vt, sustained: true };
    const pressed = st.inserted && !st.extra && (st.lead.zone === "rvot" || st.lead.zone === "rv-apex" || st.lead.zone === "rv-septum") && st.lead.push > 0;
    if (!st.vt.sustained && !pressed && st.t >= st.vt.lastProvoked + RHC_VT_RUN_S) {
      st.vt = null;
      st.messages.push("The broad-complex rhythm has stopped.");
    } else if (pressed) st.vt = { ...st.vt, lastProvoked: st.t };
  }
  // AF: a self-limiting episode stops a while after the atrium is left alone; a mild one after heparin and a drug
  const af = st.af;
  if (af && af.endedAt === null) {
    if (af.variant === "self-limiting" && st.t >= af.lastProvoked + RHC_AF_SELF_S) st.af = { ...af, endedAt: st.t };
    else if (af.variant === "mild") {
      const drug = af.treatments.find((x) => x.id === "flecainide" || x.id === "amiodarone");
      if (drug && st.t >= drug.t + RHC_AF_DRUG_S) st.af = { ...af, endedAt: st.t };
    } else if (af.variant === "severe" && !af.late && st.t - af.start > RHC_AF_PROMPT_S) {
      st.af = { ...af, late: true };
      addError(st, "af-shock-late", false, "AF with severe compromise went on beyond the lab's two-minute limit (a model threshold) without a synchronised shock.");
    }
    if (st.af && st.af.endedAt !== null) st.messages.push("The rhythm is regular again.");
  }
  noteRhythm(st, env);
}

function addError(st: RhcState, id: RhcErrorId, critical: boolean, text: string): void {
  if (st.errors.some((e) => e.id === id)) return;
  st.errors = [...st.errors, { id, t: st.t, critical, text }];
}

// ---------------------------------------------------------------------------
// Hazards
// ---------------------------------------------------------------------------

/** Ectopy and VT after a manipulation of the given force in the ventricle (zones: the ventricular zones the tip worked in; default where it is now). */
function ventricularHazards(st: RhcState, force: number, entered: boolean, zones: readonly LeadZone[] = st.inserted && !st.extra ? [st.lead.zone] : []): void {
  if (!st.inserted) return;
  const zf = Math.max(0, ...zones.map((z) => RHC_ZONE_IRRITABILITY[z] ?? 0));
  if (!zf) return;
  const damp = st.balloon && st.profile === "balloon" ? RHC_BALLOON_UP_HAZARD : 1;
  const k = zf * st.irritability * damp;
  const pE = Math.min(RHC_P_MAX, entered ? RHC_P_ECTOPY_ON_ENTRY : RHC_P_ECTOPY * force * k);
  if (draw(st) < pE) {
    if (st.t >= st.ectopyUntil) st.messages.push("Ectopics on the monitor.");
    st.ectopyUntil = st.t + RHC_ECTOPY_S;
  }
  const pV = Math.min(RHC_P_MAX, RHC_P_VT * force * force * k);
  if (draw(st) < pV) {
    if (!st.vt) {
      st.vt = { start: st.t, lastProvoked: st.t, sustained: false };
      st.vtRuns += 1;
      st.messages.push("A run of broad-complex tachycardia on the monitor.");
    } else st.vt = { ...st.vt, lastProvoked: st.t };
  } else if (st.vt) st.vt = { ...st.vt, lastProvoked: st.t };
}

/** AF after a manipulation with the tip in the atrium. */
function atrialHazard(st: RhcState): void {
  if (!st.inserted || st.extra || !(ATRIAL_ZONES as readonly string[]).includes(st.lead.zone)) return;
  if (st.af && st.af.endedAt === null) {
    st.af = { ...st.af, lastProvoked: st.t };
    return;
  }
  if (draw(st) >= st.afHazard) return;
  const variant: AfVariant = st.afVariant ?? (draw(st) < RHC_AF_SELF_LIMITING_SHARE ? "self-limiting" : draw(st) < 0.5 ? "mild" : "severe");
  st.af = { start: st.t, variant, rate: RHC_AF_RATE[variant], lastProvoked: st.t, treatments: [], endedAt: null };
  st.afEpisodes = [...st.afEpisodes, variant];
  st.messages.push("The rhythm has become irregular, with no P waves.");
}

/** A knot may form once the risk has built up, on a forceful manipulation or a turn in the heart. */
function knotHazard(st: RhcState, forceful: boolean): void {
  if (st.knot && !st.knot.resolved) return;
  if (!inHeartForKnot(st) || !forceful || knotRisk(st) < 1) return;
  if (draw(st) < RHC_P_KNOT) {
    st.knot = { formedAt: st.t, helpAt: null, wireTriedAt: null, tightAt: null, pulls: 0, resolved: null };
    st.messages.push("The catheter no longer follows the hub as it did.");
  }
}

// ---------------------------------------------------------------------------
// Movement
// ---------------------------------------------------------------------------

/** Advance the tip by cm (model units), with the femoral side branches, the outflow tract and the wedge on this file's map. */
function advance(st: RhcState, cm: number, env: RhcEnv): void {
  if (!st.inserted || cm <= 0) return;
  const firm = cm > RHC_GENTLE_CM;
  if (knotActive(st)) {
    st.messages.push("The catheter does not move on as it should.");
    return;
  }
  const startZone = st.lead.zone;
  const worked: LeadZone[] = [startZone];
  let entered = false;
  let remaining = cm;
  let lead = { ...st.lead };
  const push = (d: number, msg?: string) => {
    lead.push = Math.min(RHC_MAX_PUSH, lead.push + d);
    if (msg) st.messages.push(msg);
    remaining = 0;
  };
  for (let guard = 0; remaining > 1e-9 && guard < 20; guard++) {
    if (st.extra) {
      const room = RHC_ZONE_LEN[st.extra] - st.extraPos;
      if (remaining <= room) {
        st.extraPos += remaining;
        remaining = 0;
      } else {
        st.extraPos = RHC_ZONE_LEN[st.extra];
        push(remaining - room, st.extra === "renal" ? "Resistance: the catheter will not advance further." : "Firm resistance at the wedge.");
      }
      break;
    }
    const len = ZONE_LEN[lead.zone];
    const room = len - lead.pos;
    if (remaining <= room) {
      lead = moveLead(lead, remaining).lead;
      remaining = 0;
      break;
    }
    lead = moveLead(lead, room).lead;
    remaining -= room;
    const dir = directionOf(lead.rot);
    // femoral passage: the first passage may catch a side branch in the direction the tip points; the renal vein catches a posterior tip
    if (lead.zone === "ivc" && lead.route === "femoral") {
      if (!st.ivcPassed) {
        st.ivcPassed = true;
        const p = st.sideBranchHazard * (st.balloon && st.profile === "balloon" ? RHC_BALLOON_UP_SIDE_BRANCH : 1);
        if (dir !== "lateral" && draw(st) < p) st.trap = dir;
      }
      if (dir === "posterior" || (st.trap !== null && dir === st.trap)) {
        st.extra = "renal";
        st.extraPos = 0;
        st.messages.push("The tip turns off the line of the IVC on screening.");
        continue;
      }
    }
    // outflow tract to PA: helped across on a breath in, otherwise the tip may bounce off the valve
    if (lead.zone === "rvot") {
      const insp = rhcInspiration(st, env);
      const pBounce = insp >= RHC_INSP_THRESHOLD ? 0 : st.balloon && st.profile === "balloon" ? RHC_P_RVOT_BOUNCE_BALLOON : RHC_P_RVOT_BOUNCE;
      if (draw(st) < pBounce) {
        push(remaining, "The tip flicks against the outflow tract and will not go on.");
        break;
      }
    }
    // PA to wedge: a gentle advance on a breath in (balloon up for a balloon-tipped catheter); a pigtail stays in the PA
    if (lead.zone === "pa") {
      const insp = rhcInspiration(st, env);
      if (st.profile === "pigtail") {
        push(remaining, "The pigtail will go no further.");
        break;
      }
      const ready = !firm && insp >= RHC_INSP_THRESHOLD && (st.profile !== "balloon" || st.balloon);
      if (ready) {
        st.extra = "wedge";
        st.extraPos = 0;
        continue;
      }
      push(remaining, "The catheter does not move on.");
      break;
    }
    const nz = nextZone(lead);
    if (nz === "loop") {
      if (!lead.loop) st.messages.push("The catheter buckles into a loop in the atrium.");
      lead.loop = true;
      remaining = 0;
      break;
    }
    if (nz === null) {
      const buckle = lead.zone === "rv-apex" || lead.zone === "rv-septum";
      push(remaining, buckle ? "The catheter buckles: pushing further only bends it." : "Resistance: the catheter will not advance further.");
      break;
    }
    if ((RV_ZONES as readonly string[]).includes(nz) && !(RV_ZONES as readonly string[]).includes(lead.zone)) entered = true;
    if (nz === "svc" && lead.route === "femoral") st.messages.push("The tip runs up past the heart on screening.");
    lead = { ...lead, zone: nz, pos: 0 };
    worked.push(nz);
  }
  st.lead = lead;
  if (firm && (startZone === "pa" || worked.includes("pa"))) addError(st, "forceful-pa-advance", false, "A firm push in the pulmonary artery: Oxford advances gently, on inspiration, until gentle resistance is felt.");
  const force = (cm / RHC_GENTLE_CM) * (1 + lead.push);
  // the hazard of the most irritable ventricular zone the tip worked in (a firm push through the outflow tract counts there)
  ventricularHazards(st, force, entered, st.extra ? [] : worked);
  if (startZone === "ra" || (ATRIAL_ZONES as readonly string[]).includes(st.lead.zone)) atrialHazard(st);
  knotHazard(st, firm || lead.push > 0);
}

/** Withdraw the tip by cm; at the sheath the catheter comes out. */
function withdraw(st: RhcState, cm: number): void {
  if (!st.inserted || cm <= 0) return;
  if (knotActive(st)) {
    const k = st.knot!;
    st.knot = { ...k, pulls: k.pulls + 1 };
    if (k.pulls === 0) {
      st.messages.push("The catheter will not withdraw freely.");
      return;
    }
    pullTight(st);
    return;
  }
  let remaining = cm;
  const lead = { ...st.lead };
  const d = Math.min(lead.push, remaining);
  lead.push -= d;
  remaining -= d;
  if (st.extra && remaining > 0) {
    if (remaining < st.extraPos) {
      st.extraPos -= remaining;
      remaining = 0;
    } else {
      remaining -= st.extraPos;
      st.extra = null;
      st.extraPos = 0;
    }
  }
  st.lead = lead;
  if (remaining <= 0) return;
  // at the near end of the entry zone (nothing before it on the pacing map) the catheter comes out
  if (st.lead.zone === entryZone(st.route) && prevZone(st.lead) === null && st.lead.pos <= 1e-9 && !st.extra) {
    removeCatheter(st, "The catheter is out through the sheath.");
    return;
  }
  st.lead = moveLead(st.lead, -remaining).lead;
  // withdrawing from the apex is part of the manoeuvre; a gentle manipulation in the RV still counts a little
  if ((RV_ZONES as readonly string[]).includes(st.lead.zone)) ventricularHazards(st, (cm / RHC_GENTLE_CM) * RHC_WITHDRAW_FORCE, false);
}

function removeCatheter(st: RhcState, msg: string): void {
  st.inserted = false;
  // out of the sheath it has to be flushed and connected again before it goes back in
  st.flushed = false;
  st.lead = initialLead(st.route);
  st.extra = null;
  st.extraPos = 0;
  st.balloon = false;
  st.windup = 0;
  st.messages.push(msg);
}

function rotate(st: RhcState, deg: number): void {
  if (!st.inserted || deg === 0) return;
  const k = torqueOf(st);
  const eff = deg * k;
  st.windup += deg - eff;
  const before = directionOf(st.lead.rot);
  st.lead = rotateLead(st.lead, eff);
  if (inHeartForKnot(st)) st.turns += Math.abs(eff) / 360;
  if (k === 0) st.messages.push("Turning the hub does not turn the tip.");
  else if (Math.abs(st.windup) >= RHC_KINK_WINDUP_DEG) st.messages.push("The tip no longer follows the hub; the shaft is winding up.");
  else if (before === directionOf(st.lead.rot) && Math.abs(deg) >= 45) st.messages.push("The tip barely turns.");
  // a turn in the ventricle or the atrium is a manipulation too
  const force = (Math.abs(deg) / 90) * RHC_TURN_FORCE_PER_90;
  ventricularHazards(st, force, false);
  atrialHazard(st);
  // turns of the hub in quick succession add up: a burst of RHC_FORCEFUL_TURN_DEG or more is forceful
  const burst = st.t - st.turnBurst.from <= RHC_TURN_BURST_S ? { from: st.turnBurst.from, deg: st.turnBurst.deg + Math.abs(deg) } : { from: st.t, deg: Math.abs(deg) };
  st.turnBurst = burst;
  knotHazard(st, burst.deg >= RHC_FORCEFUL_TURN_DEG);
}

// ---------------------------------------------------------------------------
// Knot bail-out
// ---------------------------------------------------------------------------

function pullTight(st: RhcState): void {
  const k = st.knot;
  if (!k || k.resolved) return;
  if (k.tightAt === null) {
    if (k.helpAt === null) addError(st, "knot-pulled-tight-before-help", true, "The knotted catheter was pulled tight before help was called. Oxford: call an experienced operator at once and do not pull the catheter tight.");
    else if (k.wireTriedAt === null) addError(st, "knot-tightened-before-wire", false, "The knot was tightened before trying to undo it by advancing the wire (Oxford ch 4).");
  }
  st.knot = { ...st.knot!, tightAt: k.tightAt ?? st.t };
  st.messages.push("The loop on screening pulls small and tight.");
}

// ---------------------------------------------------------------------------
// The step
// ---------------------------------------------------------------------------

/** Apply an action at lab time t (s). Returns a new state; the old one is not changed. */
export function rhcStep(prev: RhcState, a: RhcAction, t: number, env: RhcEnv = { resp: true }): RhcState {
  const st: RhcState = { ...prev, messages: [] };
  advanceTime(st, t, env);
  switch (a.type) {
    case "tick":
      break;
    case "flush":
      if (!st.flushed) st.messages.push("Flushed and connected to the transducer.");
      st.flushed = true;
      break;
    case "insert":
      if (st.inserted) break;
      if (!st.flushed) addError(st, "inserted-unflushed", false, "The catheter went in before it was flushed and connected (Oxford ch 4, step 1).");
      st.inserted = true;
      st.lead = initialLead(st.route);
      st.extra = null;
      st.extraPos = 0;
      st.windup = 0;
      // a new catheter: no turns, time in the heart or progress of its own (the knot record stays for the debrief;
      // the side branch is the patient's, so where it catches stays)
      st.turns = 0;
      st.heartS = 0;
      st.turnBurst = { from: -1e9, deg: 0 };
      st.furthest = 0;
      st.wire = false;
      st.balloon = false;
      st.progressAt = st.t;
      st.messages.push("The catheter is in through the sheath.");
      break;
    case "advance":
      advance(st, a.cm, env);
      break;
    case "withdraw":
      withdraw(st, a.cm);
      break;
    case "rotate":
      rotate(st, a.deg);
      break;
    case "profile":
      if (st.inserted || a.profile === st.profile) break;
      st.profile = a.profile;
      st.balloon = false;
      // a different catheter, not yet flushed
      st.flushed = false;
      if (st.preset !== "rhc-femoral-mp") st.sideBranchHazard = RHC_SIDE_BRANCH_P[a.profile];
      st.furthest = 0;
      break;
    case "route":
      if (st.inserted || a.route === st.route) break;
      st.route = a.route;
      st.lead = initialLead(a.route);
      st.furthest = 0;
      break;
    case "balloon":
      if (st.profile !== "balloon") break;
      st.balloon = a.up;
      break;
    case "wire":
      st.wire = a.on && st.inserted;
      if (a.on && st.inserted) st.messages.push("Soft J wire inside the catheter.");
      break;
    case "deep-breath":
      st.breathUntil = st.t + RHC_DEEP_BREATH_S;
      st.messages.push("The patient takes a deep breath in and holds it.");
      break;
    case "call-help":
      if (st.knot && !st.knot.resolved && st.knot.helpAt === null) st.knot = { ...st.knot, helpAt: st.t };
      st.messages.push("An experienced operator is on the way.");
      break;
    case "wire-advance": {
      if (!st.inserted) break;
      st.wire = true;
      const k = st.knot;
      if (!k || k.resolved) {
        st.messages.push("The wire advances inside the catheter.");
        break;
      }
      st.knot = { ...k, wireTriedAt: k.wireTriedAt ?? st.t };
      if (k.tightAt === null && draw(st) < RHC_P_KNOT_UNDO) {
        st.knot = { ...st.knot, resolved: "undone" };
        st.turns = 0;
        st.windup = 0;
        st.messages.push("As the wire advances the loop opens out and the tip follows the hub again.");
      } else st.messages.push("The loop on screening is unchanged.");
      break;
    }
    case "pull-tight":
      if (knotActive(st)) pullTight(st);
      break;
    case "remove-with-sheath": {
      const k = st.knot;
      if (!k || k.resolved || !st.inserted) break;
      if (k.tightAt === null) {
        st.messages.push("The loop is too large to come into the sheath.");
        break;
      }
      st.knot = { ...k, resolved: "removed" };
      removeCatheter(st, "The tightened knot is brought to the sheath and removed with it. Expect bleeding from the vein.");
      break;
    }
    case "treat":
      treat(st, a.treatment, env);
      break;
  }
  // progress toward the goal (engage-fail counts from the last one)
  const m = milestoneOf(st);
  if (m > st.furthest) {
    st.furthest = m;
    st.progressAt = st.t;
  }
  st.bestReached = Math.max(st.bestReached, st.furthest);
  noteRhythm(st, env);
  return st;
}

function treat(st: RhcState, id: RhcTreatment, env: RhcEnv): void {
  // only the listed management steps; an unknown id (from the DEV hook or a future caller) changes nothing
  const listed = RHC_TREATMENTS.find((x) => x.id === id);
  if (!listed) return;
  const af = st.af && st.af.endedAt === null ? st.af : null;
  st.messages.push(`${listed.label} given.`);
  if (id === "unsync-shock" && (af || st.vt)) addError(st, "unsynchronised-shock", false, "An unsynchronised shock: Oxford's advice for poorly tolerated VT or AF is synchronised cardioversion.");
  if (st.vt && (id === "sync-cardioversion" || id === "unsync-shock")) {
    st.vt = null;
    st.messages.push("Sinus rhythm after the shock.");
  }
  if (!af) return;
  st.af = { ...af, treatments: [...af.treatments, { id, t: st.t }] };
  if (id === "sync-cardioversion" || id === "unsync-shock") {
    if (af.variant === "self-limiting") addError(st, "cardioversion-self-limiting", false, "A shock for AF that would have stopped on its own: most episodes started by atrial irritation end without treatment (Oxford ch 10).");
    st.af = { ...st.af!, endedAt: st.t };
    st.messages.push("Sinus rhythm after the shock.");
  }
  if (id === "flecainide" || id === "amiodarone") {
    if (!af.treatments.some((x) => x.id === "heparin")) addError(st, "af-drug-without-heparin", false, "A rhythm drug before heparin: Oxford gives heparin first.");
    if (id === "flecainide" && env.structural) addError(st, "flecainide-structural", false, "Flecainide with structural heart disease: Oxford gives amiodarone then.");
  }
}

// ---------------------------------------------------------------------------
// Read-outs
// ---------------------------------------------------------------------------

/** The events the catheter reports now (to the tip context, through the study's 'raise'). */
export function rhcEvents(st: RhcState): RhcEvent[] {
  const out: RhcEvent[] = [];
  // the femoral passage up to the RV (the stage the engage-fail tips teach: a side branch, the RA loop); recording
  // in the RV or PA, or a jugular passage, is not a failure to engage
  if (st.inserted && st.route === "femoral" && st.furthest < 2 && st.t - st.progressAt >= RHC_ENGAGE_FAIL_S) out.push("engage-fail");
  if (knotActive(st) || (st.inserted && Math.abs(st.windup) >= RHC_KINK_WINDUP_DEG)) out.push("catheter-kink");
  if (knotActive(st)) out.push("catheter-knot");
  if (st.vt) out.push("vt");
  if (st.af && st.af.endedAt === null) out.push("atrial-fibrillation");
  if ((st.vt && st.t - st.vt.start >= RHC_VT_HYPOTENSION_S) || (st.af && st.af.endedAt === null && st.af.variant === "severe")) out.push("hypotension");
  return out;
}

/** The rhythm on the monitor now. */
export function rhcRhythm(st: RhcState, env: RhcEnv = { resp: true }): { kind: RhcRhythmKind; rate: number } {
  return rhythmNow(st, env);
}

/** The rhythm on the monitor at time t (from the state's log of changes). */
export function rhythmAt(st: RhcState, t: number): { kind: RhcRhythmKind; rate: number } {
  let r = st.rhythm[0] ?? { t: 0, kind: "sinus" as const, rate: 0 };
  for (const x of st.rhythm) if (x.t <= t) r = x;
  return { kind: r.kind, rate: r.rate };
}

/** The study's chamber index for the catheter's position (RHC_PATH or PIGTAIL_RHC_PATH of haemoStudy.ts): -1 out, 0 RA (and the veins), 1 RV, 2 PA, 3 wedge. */
export function rhcChamberIndex(st: RhcState): number {
  const z = rhcZone(st);
  if (!z) return -1;
  if (z === "wedge") return st.profile === "pigtail" ? 2 : 3;
  if (z === "pa") return 2;
  if ((RV_ZONES as readonly string[]).includes(z)) return 1;
  return 0;
}

/** The study's catheter for this profile (the balloon and the multipurpose both reach the wedge). */
export const studyCatheterOf = (p: RhcProfile): RhcCatheter => (p === "pigtail" ? "pigtail" : "balloon");

/** Whether the tip direction rounds to the cranial (superior) sector. */
export const pointsCranially = (st: RhcState) => directionOf(st.lead.rot) === "superior";
export const tipDirection = (st: RhcState): TipDirection => directionOf(st.lead.rot);

// ---------------------------------------------------------------------------
// The study
// ---------------------------------------------------------------------------

export interface RhcSync {
  actions: HaemoAction[];
  /** the events this catheter raised on the study (it clears only these) */
  owned: LabEvent[];
  /** whether the catheter turned the trace's extrasystoles on */
  pvcOwned: boolean;
  /** the catheter's chamber index this sync brought the study to (pass it back as lastChamber) */
  chamber: number;
}

/**
 * The study actions that bring the haemodynamic study in line with the catheter: the catheter type,
 * the chamber on the recorder, the events for the tip context (engage-fail only while the left heart
 * catheter is out, so it is not read as a left-heart crossing failure), and the trace's extrasystoles
 * while ectopy lasts. `owned` is what an earlier sync raised, so an event a launch raised stays.
 * `lastChamber` is the catheter's chamber at the last sync (-2: never synced): the recorder is moved
 * only when the catheter's own chamber changed (or its type did), so a chamber move the study received
 * from elsewhere (a dev hook's rhc-advance) is not undone by the next tick.
 */
export function rhcSyncActions(
  study: Pick<HaemoStudyState, "rhc" | "rhcCatheter" | "raised" | "pvc" | "lhc">,
  next: RhcState,
  owned: readonly LabEvent[] = [],
  pvcOwned = false,
  lastChamber = -2
): RhcSync {
  const actions: HaemoAction[] = [];
  let rhc = study.rhc;
  const cath = studyCatheterOf(next.profile);
  const target = rhcChamberIndex(next);
  let move = target !== lastChamber;
  if (cath !== study.rhcCatheter) {
    actions.push({ type: "rhc-catheter", catheter: cath });
    rhc = -1;
    move = true;
  }
  if (move) {
    for (; rhc < target; rhc++) actions.push({ type: "rhc-advance" });
    for (; rhc > target; rhc--) actions.push({ type: "rhc-withdraw" });
  }
  const want = new Set<LabEvent>(rhcEvents(next).filter((e) => e !== "engage-fail" || study.lhc === "none"));
  const raised = new Set(study.raised);
  const nowOwned = new Set(owned.filter((e) => raised.has(e)));
  for (const e of want)
    if (!raised.has(e)) {
      actions.push({ type: "raise", event: e });
      nowOwned.add(e);
    }
  for (const e of [...nowOwned])
    if (!want.has(e)) {
      actions.push({ type: "clear-event", event: e });
      nowOwned.delete(e);
    }
  const ectopy = next.t < next.ectopyUntil && next.inserted;
  let pvc = pvcOwned;
  if (ectopy && !study.pvc) {
    actions.push({ type: "pvc", on: true });
    pvc = true;
  } else if (!ectopy && pvcOwned && study.pvc) {
    actions.push({ type: "pvc", on: false });
    pvc = false;
  } else if (!study.pvc) pvc = false;
  return { actions, owned: [...nowOwned], pvcOwned: pvc, chamber: target };
}

// ---------------------------------------------------------------------------
// Debrief
// ---------------------------------------------------------------------------

export type RhcDecision = Omit<DecisionRecord, "t">;

const LESSON_RHC = "hb-cardiac-catheterisation-rhc";
const LESSON_AF = "hb-background-general";

/** The scored decisions of the passage so far: the knot bail-out and the AF management, for the run's ledger. */
export function rhcDecisions(st: RhcState): RhcDecision[] {
  const out: RhcDecision[] = [];
  const k = st.knot;
  if (k && (k.tightAt !== null || k.resolved)) {
    const tightBeforeHelp = st.errors.some((e) => e.id === "knot-pulled-tight-before-help");
    out.push({
      id: "rhc-knot-bailout",
      stage: "right-heart",
      label: "Knotted catheter",
      correct: k.helpAt !== null && !tightBeforeHelp && !st.errors.some((e) => e.id === "knot-tightened-before-wire"),
      expected: "Call for help, do not pull tight, try the wire, then tighten and remove with the sheath",
      given:
        k.resolved === "undone"
          ? k.helpAt === null
            ? "Knot undone with the wire, help not called"
            : "Help called, knot undone with the wire"
          : tightBeforeHelp
            ? "Pulled tight before help was called"
            : k.wireTriedAt === null
              ? "Tightened before trying the wire"
              : "Help called, wire tried, tightened and removed",
      lessonId: LESSON_RHC,
      tipIds: ["haemo-rhc-knot"],
    });
  }
  for (const [i, v] of st.afEpisodes.entries()) {
    if (!st.af || i !== st.afEpisodes.length - 1 || st.af.endedAt === null) continue;
    const tr = st.af.treatments.map((x) => x.id);
    const shocked = tr.includes("sync-cardioversion");
    // severe compromise: oxygen and heparin both given before the synchronised shock
    const shockAt = st.af.treatments.find((x) => x.id === "sync-cardioversion")?.t ?? Infinity;
    const before = (id: RhcTreatment) => st.af!.treatments.some((x) => x.id === id && x.t <= shockAt);
    const prepared = before("oxygen") && before("heparin");
    const correct =
      v === "self-limiting"
        ? !tr.includes("sync-cardioversion") && !tr.includes("unsync-shock")
        : v === "severe"
          ? shocked && prepared && !tr.includes("unsync-shock") && !st.af.late
          : tr.includes("heparin") && (tr.includes("flecainide") || tr.includes("amiodarone")) && !st.errors.some((e) => e.id === "flecainide-structural" || e.id === "af-drug-without-heparin");
    out.push({
      id: "rhc-af-management",
      stage: "right-heart",
      label: "AF during the right heart study",
      correct,
      expected: v === "self-limiting" ? "Leave the atrium and watch: no shock" : v === "severe" ? "Oxygen and heparin, then a synchronised shock" : "Heparin, then flecainide without structural heart disease, or amiodarone",
      given: tr.length ? tr.map((x) => RHC_TREATMENTS.find((y) => y.id === x)?.label ?? x).join(", ") : "Watched",
      lessonId: LESSON_AF,
      tipIds: ["haemo-bg-af-in-lab"],
    });
  }
  return out;
}

/** A plain account of the passage for the debrief: what was reached and what happened. */
export function rhcSummary(st: RhcState): string[] {
  const reached = ["the vein", "the right atrium", "the right ventricle", "the pulmonary artery", "the wedge"][Math.max(st.bestReached ?? 0, st.furthest)] ?? "the vein";
  const out = [`Furthest position reached: ${reached}.`];
  if (st.trap !== null) out.push("The tip caught in a venous side branch on the femoral passage.");
  if (st.vtRuns) out.push(`Runs of VT: ${st.vtRuns} (forceful manipulation in the RV, highest risk in the outflow tract).`);
  if (st.knot) out.push(st.knot.resolved === "undone" ? "A knot formed and was undone with the wire." : st.knot.resolved === "removed" ? "A knot formed and was removed with the sheath." : "A knot formed.");
  for (const v of st.afEpisodes) out.push(`AF from atrial manipulation (${v === "self-limiting" ? "self-limiting" : v === "severe" ? "with severe compromise" : "with milder compromise"}).`);
  return out;
}
