// ---------------------------------------------------------------------------
// The recovery ward (proc-recovery-ward; lessons hb-after-the-procedure-monitoring,
// pm-monitoring-watch, cm-flow-embolism-stroke, cm-flow-embolism-oedema-cholesterol
// and pm-to-the-root-advance).
//
// After closure the patient goes to the ward, where time runs faster than on the
// table (the session's recovery time-lapse). The learner writes the observation
// schedule and the mobilisation plan for the access route; the nurse takes each
// set of observations at the times the schedule gives (and at no other time), and
// the learner reviews each set. Oxford's routine (src/content/manual/cath-handbook/
// 09-after-the-procedure.ts, the arrival steps at :284-306 and the table at :311-315):
// pulse and blood pressure on arrival, a quick neurological check and a look at every
// access site; observations every 15 minutes in the first hour, every 30 minutes in
// the second, then hourly; the radial site every 15 minutes until the band is off;
// the femoral site with the femoral, popliteal and pedal pulses every 15 minutes
// until the patient is mobile; three-lead ECG monitoring after a stent. Mobilisation
// (the same file :345-350): about 1 hour before walking after radial access or a
// closure device; after a 6 F femoral arterial puncture flat for 1 hour after the
// line comes out and walking from 2 1/2 hours (Oxford ch 11), or after 3 hours of
// bed rest (Oxford ch 3); the plan is graded against either.
//
// Events happen at set times (closure.ts DelayedKind: the access haematomas, and
// chest-pain-post-pci, tamponade, stroke and creatinine-rise). A finding is visible
// only at an observation that includes it: a haematoma at a site check (or once it
// is large enough for the patient to complain), the haemodynamics of a tamponade at
// a set of observations (or when the patient becomes faint), so a skipped set lets
// it grow. Chest pain and a stroke are reported by the patient when they begin (a stent
// thrombosis once the engine's ischaemia shows, so an ECG then records it); a
// rising creatinine is a result at the 48-72 hour review. Each event, once found,
// opens a first-action menu with right and wrong options; nothing on it names the
// problem. The first action, a complete and safe response, and whether the event
// was acted on before the next set of observations are scored in the ledger. The
// first actions are the lesson's (09-after-the-procedure.ts :368-373 'Recognising
// trouble after the case', and its pitfalls :408-416; 02-flow-embolism.ts :626-636
// 'When a deficit appears'; 06-access-complications.ts 'Access-site bleeding' and
// the haematoma grading table for the forearm, :254 for the groin).
//
// What the events do to the patient is the engine's: a haematoma bleeds (the
// session's active bleeds) until it is compressed; a tamponade fills the
// pericardium (setPericardialInflow) until it is drained; a stent thrombosis
// occludes the stented vessel (setOcclusion: the engine's ischaemia, chest pain and
// ST elevation follow) until the operator reopens it. The ECG and the echo read the
// engine. The ward's numbers are MODEL PARAMETERS (docs/realism/facts/
// pkg-proc-recovery-ward.md) unless a source is named.
//
// At the table: an end-of-case neurological check (ask the patient to speak and
// move all four limbs; Brilakis 5.5 in 02-flow-embolism.ts :620 and :668), and an
// embolic stroke on the table after a flushed clot or air (the session's
// clot-flushed and air-embolism criticals): the patient's new deficit raises
// 'neuro-deficit', the attending stops the case, and the stroke pathway is scored
// (06-to-the-root.ts :1352-1357: stop, call the stroke team, emergency CT with CT
// angiography; the heparin given bears on thrombolysis).
//
// Follow-up vignettes: the 48-72 hour creatinine, and cholesterol embolisation weeks
// later in a patient with a diseased aorta whose catheters were exchanged without a
// wire (the diagnostic lab reports wireless exchanges in its LabReport), to be told
// apart from acute limb ischaemia and contrast nephropathy (02-flow-embolism.ts
// :770-797).
//
// This file imports CaseSession as a type only (caseSession.ts imports it). The
// session builds one Ward and gives it a WardHost: what it reads from the session
// and the few things it may do to it.
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../content/lab/tips";
import type { LabRaises } from "../../content/lab/raisable/waiting";
import type { Vitals } from "../patient/engine";
import type { CaseSession, LogKind } from "./caseSession";
import type { LabReport } from "./handover";
import type { DelayedEvent } from "../access/closure";
import { easyGradeFromSize, haematomaCm } from "../access/closure";
import { SeededRng } from "../patient/rng";

// ---------------------------------------------------------------------------
// Oxford's routine (sourced) and the ward's model parameters
// ---------------------------------------------------------------------------

/** Oxford's recovery routine (09-after-the-procedure.ts :311-315 and :345-350). Minutes. */
export const OXFORD_WARD = {
  /** observations every 15 min in the first hour, every 30 min in the second, then hourly */
  vitalsEveryMin: [15, 30, 60] as [number, number, number],
  /** radial site every 15 minutes until the band is off; femoral site and pulses every 15 minutes until mobile */
  siteEveryMin: 15,
  /** radial access or a closure device: walking after about 1 hour */
  walkShortMin: 60,
  /** 6 F femoral arterial puncture: flat for 1 hour after the line comes out, walking from 2 1/2 hours (Oxford ch 11) */
  femoralFlatMin: 60,
  femoralWalkMin: 150,
  /** Oxford ch 3: usually up and about once 3 hours of bed rest have passed */
  femoralWalkAltMin: 180,
};

/** MODEL PARAMETERS of the ward (docs/realism/facts/pkg-proc-recovery-ward.md). */
export const MP_WARD = {
  /** 'about 1 hour' to walk after radial access or a device, accepted from this many minutes ... */
  walkShortFromMin: 45,
  /** ... to this many */
  walkShortToMin: 90,
  /** bed rest flat after radial access or a device accepted up to this long (min) */
  flatShortMaxMin: 30,
  /** Oxford's 'small femoral sheath' (short mobilisation, like radial access or a device): up to this size (F); Oxford's longer plan is for 6 F */
  smallFemoralSheathMaxFr: 5,
  /** an arrival set is taken when the plan is written within this time of arrival (s) */
  arrivalWindowS: 15 * 60,
  /** a haematoma is felt at a site check from this volume (mL) */
  palpableMl: 2,
  /** the patient complains of a swelling without a site check from this volume (mL) */
  reportMl: 60,
  /** a set of observations shows a tamponade when the systolic is below this (mmHg) ... */
  lowSysMmHg: 100,
  /** ... or the heart rate above this (bpm) */
  highHr: 100,
  /** the patient becomes faint (and calls the nurse) without a set once the systolic falls below this (mmHg) */
  faintSysMmHg: 85,
  /** the echo shows an effusion from this volume, and right heart collapse from this one (mL) */
  echoEffusionMl: 30,
  echoCollapseMl: 120,
  /** each first action on the ward takes this long (s) */
  actionS: 30,
  /**
   * a stent thrombosis is reported by the patient once the engine's ischaemia shows (its ST elevation meets the
   * STEMI criteria), and at the latest this long after the occlusion (s)
   */
  occlusionPainMaxS: 120,
  /** the attending stops the case this long after a stroke on the table is seen if the learner has done nothing (s) */
  tableStopAfterS: 60,
  /** a stent thrombosis occludes the stented vessel here (0..1 along it) when the case gives no lesion position */
  stentParamDefault: 0.3,
  /** an embolic stroke follows a flushed clot, or air flushed into the root, with these chances (a case's scenario may make it certain) */
  tableStrokeAfterClot: 0.3,
  tableStrokeAfterAir: 0.1,
  /** cholesterol embolisation at follow-up in a patient with a diseased aorta and wireless exchanges (a case's scenario may make it certain) */
  cholesterolChance: 0.1,
};

// ---------------------------------------------------------------------------
// The plan
// ---------------------------------------------------------------------------

export type WardRoute = "radial" | "femoral";
/** How the working site was closed. */
export type WardClosure = "radial-band" | "manual" | "device";
export type ObsKind = "vitals" | "neuro" | "site" | "pulses";

export interface WardSchedule {
  /** on arrival: pulse and blood pressure, a quick neurological check, a look at every access site */
  arrival: { vitals: boolean; neuro: boolean; site: boolean };
  /** observation interval (min) in the first hour, the second hour and after; null: none in that period */
  vitalsMin: [number | null, number | null, number | null];
  /** access-site check interval (min); null: none after arrival */
  siteMin: number | null;
  /** until when the site checks go on */
  siteUntil: "band-off" | "mobile" | "first-hour";
  /** the femoral, popliteal and pedal pulses with each site check */
  distalPulses: boolean;
  /** three-lead ECG monitoring */
  ecgMonitor: boolean;
}

/** Minutes from arrival on the ward (for a femoral line, the closure: the line out). */
export interface WardMobilisation {
  flatMin: number;
  walkMin: number;
}

export interface WardPlan {
  schedule: WardSchedule;
  mobilise: WardMobilisation;
  /** session time the plan was written (s) */
  setAt: number;
}

/** Oxford's schedule for a route (with ECG monitoring after a stent). */
export function oxfordSchedule(route: WardRoute, stent = false): WardSchedule {
  return {
    arrival: { vitals: true, neuro: true, site: true },
    vitalsMin: [...OXFORD_WARD.vitalsEveryMin],
    siteMin: OXFORD_WARD.siteEveryMin,
    siteUntil: route === "radial" ? "band-off" : "mobile",
    distalPulses: route === "femoral",
    ecgMonitor: stent,
  };
}

/** Oxford's mobilisation for a closure: about 1 hour after radial or a device; flat 1 hour, walking from 2 1/2 hours after a manual femoral closure. */
export function oxfordMobilisation(closure: WardClosure): WardMobilisation {
  return closure === "manual" ? { flatMin: OXFORD_WARD.femoralFlatMin, walkMin: OXFORD_WARD.femoralWalkMin } : { flatMin: 0, walkMin: OXFORD_WARD.walkShortMin };
}

export interface PlanItemGrade {
  id: string;
  label: string;
  correct: boolean;
  expected: string;
  given: string;
}
export interface PlanGrade {
  correct: boolean;
  items: PlanItemGrade[];
}

const every = (m: number | null) => (m === null ? "none" : `every ${m} min`);

/**
 * The schedule against Oxford's routine for the route. An interval no longer than Oxford's in each period is
 * accepted (nursing judgement may observe more often, 09-after-the-procedure.ts :311); no observations in a period,
 * a radial site check less often than every 15 minutes or stopping before the band is off, a femoral site check
 * without the distal pulses or stopping before the patient is mobile, and no ECG monitoring after a stent are wrong.
 */
export function gradeSchedule(s: WardSchedule, o: { route: WardRoute; stent: boolean }): PlanGrade {
  const items: PlanItemGrade[] = [];
  const a = s.arrival;
  items.push({
    id: "arrival",
    label: "On arrival",
    correct: a.vitals && a.neuro && a.site,
    expected: "Pulse and blood pressure, a quick neurological check and every access site",
    given: [a.vitals && "pulse and blood pressure", a.neuro && "neurological check", a.site && "access site"].filter(Boolean).join(", ") || "nothing",
  });
  const ox = OXFORD_WARD.vitalsEveryMin;
  const v = s.vitalsMin;
  items.push({
    id: "vitals",
    label: "Observations",
    correct: v.every((m, i) => m !== null && m > 0 && m <= ox[i]),
    expected: "Every 15 min in the first hour, every 30 min in the second, then hourly",
    given: `First hour ${every(v[0])}, second hour ${every(v[1])}, then ${every(v[2])}`,
  });
  const siteOk = s.siteMin !== null && s.siteMin > 0 && s.siteMin <= OXFORD_WARD.siteEveryMin;
  const untilOk = o.route === "radial" ? s.siteUntil === "band-off" : s.siteUntil === "mobile";
  const untilWords = { "band-off": "until the band is off", mobile: "until the patient is mobile", "first-hour": "for the first hour" }[s.siteUntil];
  items.push({
    id: "site",
    label: o.route === "radial" ? "Radial site checks" : "Femoral site checks",
    correct: siteOk && untilOk && (o.route === "radial" || s.distalPulses),
    expected: o.route === "radial" ? "Every 15 min until the band is off" : "Every 15 min until mobile, with the femoral, popliteal and pedal pulses",
    given: `${every(s.siteMin)} ${untilWords}${o.route === "femoral" ? (s.distalPulses ? ", with the distal pulses" : ", without the distal pulses") : ""}`,
  });
  if (o.stent)
    items.push({ id: "ecg", label: "ECG monitoring after a stent", correct: s.ecgMonitor, expected: "Three-lead ECG monitoring", given: s.ecgMonitor ? "Three-lead ECG monitoring" : "No ECG monitoring" });
  return { correct: items.every((i) => i.correct), items };
}

/**
 * The mobilisation plan against Oxford's guide for the closure (both Oxford chapters accepted after a manual femoral
 * closure). After a manual closure of a small femoral sheath (MP_WARD.smallFemoralSheathMaxFr or less) Oxford's short
 * plan is accepted, as after radial access or a device, and so is the longer plan for a 6 F puncture.
 */
export function gradeMobilisation(m: WardMobilisation, closure: WardClosure, sheathFr?: number): PlanItemGrade {
  const given = `${m.flatMin ? `Flat for ${m.flatMin} min, ` : "No bed rest flat, "}walking from ${m.walkMin} min`;
  const shortOk = m.flatMin <= MP_WARD.flatShortMaxMin && m.walkMin >= MP_WARD.walkShortFromMin && m.walkMin <= MP_WARD.walkShortToMin && m.walkMin >= m.flatMin;
  if (closure === "manual") {
    const longOk = m.flatMin >= OXFORD_WARD.femoralFlatMin && m.walkMin >= OXFORD_WARD.femoralWalkMin && m.walkMin <= OXFORD_WARD.femoralWalkAltMin;
    if (sheathFr !== undefined && sheathFr <= MP_WARD.smallFemoralSheathMaxFr)
      return { id: "mobilise", label: "Mobilisation after a manual closure of a small femoral sheath", correct: shortOk || longOk, expected: "The time before walking can be short, about 1 hour, after a small femoral sheath", given };
    return { id: "mobilise", label: "Mobilisation after a manual femoral closure", correct: longOk, expected: "Flat for 1 hour after the line is out, walking from 2 1/2 hours (Oxford ch 11; 3 hours of bed rest in ch 3)", given };
  }
  return { id: "mobilise", label: closure === "device" ? "Mobilisation after a closure device" : "Mobilisation after radial access", correct: shortOk, expected: "Walking after about 1 hour, without bed rest", given };
}

// ---------------------------------------------------------------------------
// Ward events and their first-action menus
// ---------------------------------------------------------------------------

/** The events the ward presents: the access haematomas, the four new delayed kinds, and the stroke on the table. */
export type WardEventKind = "forearm-haematoma" | "groin-haematoma" | "chest-pain-post-pci" | "tamponade" | "stroke" | "creatinine-rise" | "table-stroke";
/** Delayed kinds that always present through the ward. */
export const WARD_DELAYED_KINDS = ["chest-pain-post-pci", "tamponade", "stroke", "creatinine-rise"] as const;
/** Access haematomas, which present through the ward once its plan is written (before that, as the nurse finds them). */
export const WARD_HAEMATOMA_KINDS = ["forearm-haematoma", "groin-haematoma"] as const;
/** Results reviewed at follow-up, not on the ward's clock. */
export const WARD_FOLLOW_UP_KINDS = ["creatinine-rise"] as const;

export type WardActionId =
  | "compress"
  | "mark-grade"
  | "escalate"
  | "recheck-later"
  | "band-off"
  | "ecg-12"
  | "call-operator"
  | "nitrate"
  | "reassure"
  | "troponin-wait"
  | "senior-fluids"
  | "echo"
  | "pericardiocentesis"
  | "fluids-only"
  | "site-hb"
  | "abc"
  | "onset-time"
  | "stroke-team"
  | "neuro-exam"
  | "ct-cta"
  | "review-drugs"
  | "aspirin"
  | "heparin"
  | "observe-hour"
  | "hydrate"
  | "repeat-creatinine"
  | "hold-nephrotoxic"
  | "discharge"
  | "restrict-fluids"
  | "stop-case"
  | "finish-study"
  | "more-heparin";

export interface WardEventRule {
  /** the menu, in the order shown (it does not name the problem); an option with `after` is offered only once that action is done */
  options: { id: WardActionId; label: string; after?: WardActionId }[];
  /** right first actions */
  firstCorrect: WardActionId[];
  /** what a complete response holds */
  essential: WardActionId[];
  /** wrong actions (before `before`, if given) */
  harmful: { id: WardActionId; before?: WardActionId }[];
  expectedFirst: string;
  expectedResponse: string;
  lessonId: string;
  tipIds: string[];
}

const SITE_MENU_COMMON = (compress: string): WardEventRule["options"] => [
  { id: "recheck-later", label: "Note it and look again at the next check" },
  { id: "compress", label: compress },
  { id: "mark-grade", label: "Mark its edges and measure it" },
  { id: "escalate", label: "Tell the nurse in charge and the operator" },
];

/**
 * The first-action menus. Sources: the forearm haematoma, 06-access-complications.ts 'Access-site bleeding' (move
 * the band, a second band, press and elevate) and its grading table (extent graded; the doctor informed from grade
 * II), with pm-monitoring#9's escalation to the nurse in charge; the groin, the same file :254 (press just proximal
 * to the skin puncture); chest pain, tamponade, stroke and the creatinine, 09-after-the-procedure.ts :368-373 and
 * its pitfalls (:408-416: nitrate before a 12-lead ECG, hypotension treated as dehydration, a normal 48 hour
 * creatinine taken as the end of it); the stroke also 02-flow-embolism.ts :626-636 and :644 (aspirin before imaging
 * wrong); the stroke on the table 06-to-the-root.ts :1352-1357.
 */
export const WARD_EVENT_RULES: Record<WardEventKind, WardEventRule> = {
  "forearm-haematoma": {
    options: [...SITE_MENU_COMMON("Press over it: re-site the band or add a second band, arm raised"), { id: "band-off", label: "Take the band off to look at the puncture" }],
    firstCorrect: ["compress"],
    essential: ["compress", "mark-grade", "escalate"],
    harmful: [{ id: "recheck-later" }, { id: "band-off" }],
    expectedFirst: "Press over it: re-site the band or a second band, arm raised",
    expectedResponse: "Compress, mark and grade it, and tell the nurse in charge and the operator; never just wait",
    lessonId: "cm-access-complications-radial-bleeding",
    tipIds: ["access-post-radial-obs", "access-cx-forearm-haematoma-grade"],
  },
  "groin-haematoma": {
    options: SITE_MENU_COMMON("Press firmly just above the puncture"),
    firstCorrect: ["compress"],
    essential: ["compress", "mark-grade", "escalate"],
    harmful: [{ id: "recheck-later" }],
    expectedFirst: "Press firmly just proximal to the puncture",
    expectedResponse: "Compress, mark it, and tell the nurse in charge and the operator; never just wait",
    lessonId: "cm-access-complications-femoral-bleeding",
    tipIds: ["access-post-femoral-mobilise", "access-cx-groin-haematoma-press"],
  },
  "chest-pain-post-pci": {
    options: [
      { id: "nitrate", label: "Sublingual nitrate" },
      { id: "reassure", label: "Reassure, simple analgesia, review later" },
      { id: "ecg-12", label: "Record a 12-lead ECG" },
      { id: "troponin-wait", label: "Send a troponin and wait for the result" },
      { id: "call-operator", label: "Tell the operator" },
    ],
    firstCorrect: ["ecg-12"],
    essential: ["ecg-12", "call-operator"],
    harmful: [{ id: "nitrate", before: "ecg-12" }, { id: "reassure" }, { id: "troponin-wait", before: "call-operator" }],
    expectedFirst: "A 12-lead ECG, before any other action",
    expectedResponse: "A 12-lead ECG first, then the operator told; no nitrate before the ECG",
    lessonId: "hb-after-the-procedure-monitoring",
    tipIds: ["pci-post-chest-pain-ward"],
  },
  tamponade: {
    options: [
      { id: "fluids-only", label: "Fluids: the patient has been fasting; recheck in 30 minutes" },
      { id: "senior-fluids", label: "Call for senior help and give fluids while looking for the reversible causes" },
      { id: "site-hb", label: "Look at the access site and send a haemoglobin" },
      { id: "echo", label: "Bedside echocardiogram now" },
      // offered once the echo has been done (09-after-the-procedure.ts :372: echocardiography confirms it; then pericardiocentesis)
      { id: "pericardiocentesis", label: "Ask for immediate pericardiocentesis", after: "echo" },
      { id: "recheck-later", label: "Repeat the observations in 30 minutes" },
    ],
    firstCorrect: ["senior-fluids", "echo"],
    essential: ["senior-fluids", "echo", "pericardiocentesis"],
    harmful: [{ id: "fluids-only" }, { id: "recheck-later" }],
    expectedFirst: "Senior help and fluids while looking for the reversible causes, with a bedside echo",
    expectedResponse: "Senior help, fluids, an echo and pericardiocentesis; not put down to dehydration alone",
    lessonId: "hb-after-the-procedure-monitoring",
    tipIds: ["access-vasovagal-or-tamponade"],
  },
  stroke: {
    options: [
      { id: "observe-hour", label: "Reassure and reassess in an hour" },
      { id: "aspirin", label: "Aspirin 300 mg now" },
      { id: "abc", label: "Airway, breathing and circulation" },
      { id: "onset-time", label: "Record the time of onset" },
      { id: "stroke-team", label: "Call the stroke team now" },
      { id: "heparin", label: "Start heparin" },
      { id: "neuro-exam", label: "Full neurological examination, written in the notes" },
      { id: "ct-cta", label: "Urgent CT head with CT angiography" },
      { id: "review-drugs", label: "Review the anticoagulant and antiplatelet drugs given" },
    ],
    firstCorrect: ["abc"],
    essential: ["abc", "onset-time", "stroke-team", "neuro-exam", "ct-cta"],
    harmful: [{ id: "aspirin", before: "ct-cta" }, { id: "heparin", before: "ct-cta" }, { id: "observe-hour" }],
    expectedFirst: "Airway, breathing and circulation",
    expectedResponse: "ABC, onset time, the stroke team at once, an examination written down, CT with CT angiography; no antithrombotic before imaging",
    lessonId: "cm-flow-embolism-stroke",
    tipIds: ["diag-finish-neuro-check"],
  },
  "creatinine-rise": {
    options: [
      { id: "discharge", label: "Discharge: it will settle by itself" },
      { id: "hydrate", label: "Hydrate with normal saline" },
      { id: "restrict-fluids", label: "Restrict fluids" },
      { id: "repeat-creatinine", label: "Repeat the creatinine at 48-72 hours or later" },
      { id: "hold-nephrotoxic", label: "Withhold nephrotoxic drugs, metformin included" },
    ],
    firstCorrect: ["hydrate", "repeat-creatinine", "hold-nephrotoxic"],
    essential: ["hydrate", "repeat-creatinine"],
    harmful: [{ id: "discharge" }, { id: "restrict-fluids" }],
    expectedFirst: "Hydration and a repeat creatinine",
    expectedResponse: "Hydration with normal saline and a repeat creatinine at 48-72 hours or later",
    lessonId: "hb-after-the-procedure-monitoring",
    tipIds: ["pci-post-contrast-kidney"],
  },
  "table-stroke": {
    options: [
      { id: "finish-study", label: "Finish the coronary study first, then ask for a neurology opinion" },
      { id: "stop-case", label: "Stop the procedure" },
      { id: "more-heparin", label: "Give more heparin and carry on" },
      { id: "stroke-team", label: "Call the stroke team now" },
      { id: "ct-cta", label: "Emergency non-contrast CT head with CT angiography" },
    ],
    firstCorrect: ["stop-case", "stroke-team", "ct-cta"],
    essential: ["stop-case", "stroke-team", "ct-cta"],
    harmful: [{ id: "finish-study" }, { id: "more-heparin" }],
    expectedFirst: "Stop, call the stroke team, emergency CT with CT angiography",
    expectedResponse: "The stroke pathway started at once, without completing the coronary study",
    lessonId: "pm-to-the-root-advance",
    tipIds: ["diag-finish-neuro-check"],
  },
};

/** The options offered now for an event, given the actions already done (an option with `after` waits for that action). */
export function wardOptionsNow(kind: WardEventKind, done: readonly WardActionId[]): WardEventRule["options"] {
  return WARD_EVENT_RULES[kind].options.filter((o) => !o.after || done.includes(o.after));
}

/** Grade a sequence of actions for an event: the first, and the response so far (pure). */
export function gradeWardActions(kind: WardEventKind, actions: readonly WardActionId[]): { firstCorrect: boolean | null; harmful: WardActionId | null; complete: boolean } {
  const r = WARD_EVENT_RULES[kind];
  let harmful: WardActionId | null = null;
  actions.forEach((a, i) => {
    if (harmful) return;
    const h = r.harmful.find((x) => x.id === a);
    if (h && (!h.before || !actions.slice(0, i).includes(h.before))) harmful = a;
  });
  return { firstCorrect: actions.length ? r.firstCorrect.includes(actions[0]) : null, harmful, complete: r.essential.every((e) => actions.includes(e)) };
}

// ---------------------------------------------------------------------------
// Cholesterol embolisation at follow-up (02-flow-embolism.ts :770-797)
// ---------------------------------------------------------------------------

export type CholesterolDx = "cholesterol-embolisation" | "acute-limb-ischaemia" | "contrast-nephropathy";
export type CholesterolPlan = "supportive" | "limb-angiography" | "anticoagulate";
export const CHOLESTEROL_DX_LABEL: Record<CholesterolDx, string> = {
  "acute-limb-ischaemia": "Acute limb ischaemia",
  "cholesterol-embolisation": "Cholesterol embolisation",
  "contrast-nephropathy": "Contrast nephropathy alone",
};
export const CHOLESTEROL_PLAN_LABEL: Record<CholesterolPlan, string> = {
  "limb-angiography": "Emergency limb angiography",
  supportive: "Supportive: careful hydration, blood pressure control, renal advice early",
  anticoagulate: "Start full anticoagulation",
};
/** What the patient shows (seen and felt only; the module's pattern: livedo, blue toes, palpable pulses, a creatinine still rising beyond 2 weeks, eosinophilia). */
export const CHOLESTEROL_VIGNETTE =
  "Review three weeks after the procedure: painful feet with a lace-like purple mottling over both legs and two blue toes. Both foot pulses are easy to feel. The creatinine has gone on rising since the case, and the full blood count shows a raised eosinophil count.";

export function gradeCholesterol(dx: CholesterolDx, plan: CholesterolPlan): { dxCorrect: boolean; planCorrect: boolean } {
  return { dxCorrect: dx === "cholesterol-embolisation", planCorrect: plan === "supportive" };
}

// ---------------------------------------------------------------------------
// The ward's state
// ---------------------------------------------------------------------------

/** One set of observations, as the nurse charted it. */
export interface WardSet {
  /** session time of the set (s): the scheduled time */
  atS: number;
  /** minutes since arrival on the ward */
  atMin: number;
  kinds: ObsKind[];
  hr?: number | null;
  bp?: { sys: number; dia: number };
  spo2?: number | null;
  rr?: number;
  rhythm?: string;
  site?: string;
  pulses?: string;
  neuro?: string;
  /** what the nurse adds to this set (a finding of an event first seen here) */
  remark?: string;
  reviewedAt: number | null;
}

export type WardFoundBy = "site" | "vitals" | "report" | "bloods";

export interface WardEventState {
  id: string;
  kind: WardEventKind;
  onsetS: number;
  foundS: number | null;
  foundBy: WardFoundBy | null;
  /** the delayed event behind it (none for the stroke on the table) */
  ev: DelayedEvent | null;
  /** a haematoma's volume when found, and when its bleeding was stopped (mL, s) */
  mlAtFind: number | null;
  stoppedAt: number | null;
  /** what the nurse or patient said when it was found */
  report: string | null;
  actions: { id: WardActionId; t: number; result?: string }[];
  resolvedAt: number | null;
  /** a stent thrombosis (a chest pain event with the stented vessel occluded) */
  occluded?: boolean;
  /** pericardial inflow running (mL/s) */
  inflowMlS?: number;
  /** the response has been scored */
  scored?: boolean;
}

/** What the ward reads from the session and may do to it (built by caseSession.ts). */
export interface WardHost {
  now(): number;
  vitals(): Vitals;
  /** the working site's route and closure */
  route(): WardRoute;
  closure(): WardClosure;
  /** the working site's sheath size (F) */
  sheathFr(): number;
  /** a radial band is still on */
  bandOn(): boolean;
  /** a stent was placed (a LabReport with stents, or the case's own PCI) */
  stented(): boolean;
  /** the stented vessel and position for a stent thrombosis, or null */
  stentSite(): { vessel: string; param: number } | null;
  /** the access site as it looks and feels now (no event), and the pulses at and beyond it against the start */
  siteText(): string;
  pulseText(): string;
  heparinU(): number;
  sex(): "M" | "F";
  baselineCreatinineUmolL(): number;
  /** the team played the case to the ward (a scenario opened at 'recovery'): the table's checks were not the learner's */
  teamTable(): boolean;
  /** when the last catheter came out, or null */
  catheterOutAt(): number | null;
  /** a step is under way on the session's clock */
  busy(): boolean;
  decide: CaseSession["decide"];
  log(kind: LogKind, text: string): void;
  spend(s: number, label: string): void;
  holdTip(events: LabEvent[]): void;
  clearTip(e: LabEvent): void;
  /** the delayed event's bleeding into the engine starts (haematoma), and stops */
  bleed(ev: DelayedEvent): void;
  stopBleed(ev: DelayedEvent): void;
  /** a haematoma found on the ward (presented, its tip events and complication, as the session presents delayed events) */
  present(ev: DelayedEvent, finding: string, severity: "minor" | "major"): void;
  occlude(id: string, vessel: string, param: number): void;
  clearOcclusion(id: string): void;
  pericardialInflow(mlPerS: number): void;
  drainPericardium(ml: number): number;
  seed: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
/** Minutes as h:mm. */
export const hm = (min: number) => `${Math.floor(min / 60)}:${pad(Math.round(min % 60))}`;
const round = (x: number, k = 1) => Math.round(x * k) / k;

export class Ward {
  /** session time the patient reached the ward (the recovery hook), or null */
  arrivedAt: number | null = null;
  plan: WardPlan | null = null;
  readonly sets: WardSet[] = [];
  readonly events: WardEventState[] = [];
  /** when the patient was asked to speak and move all four limbs at the table (s), and what was found */
  tableNeuroCheck: { t: number; finding: string } | null = null;
  /** the case's lab reports (the PCI's stents, the diagnostic lab's wireless exchanges) */
  readonly reports: LabReport[] = [];
  /** the aorta was diseased on the study (a scenario's start state) */
  aortaDiseased = false;
  /** a scenario makes the next table embolism a stroke, and the cholesterol vignette certain */
  private forceTableStroke = false;
  private forceCholesterol = false;
  /** the cholesterol vignette, once presented, and its assessment */
  cholesterol: { at: number; present: boolean; text: string; assessed: { dx: CholesterolDx; plan: CholesterolPlan; correct: boolean } | null } | null = null;
  /** the 48-72 hour review was done */
  followUpAt: number | null = null;
  private lastStepRel = -Infinity;
  private mobileLogged = false;
  private closed = false;
  private n = 0;
  /** the found count step() last reported (a finding made outside step(), at an onset, is reported by the next step) */
  private foundSeen = 0;
  /** the next scheduled set (s since arrival) after `from`, valid while the clock is in [from, next) or, with none, [from, to) */
  private dueCache: { from: number; to: number; next: number | null } | null = null;
  private readonly rng: SeededRng;

  constructor(private readonly host: WardHost) {
    this.rng = new SeededRng(`ward:${host.seed}`);
  }

  // -------------------------------------------------------------------------
  // arrival and the plan
  // -------------------------------------------------------------------------

  /** The patient reaches the ward (the session's recovery hook). */
  arrive(t: number): void {
    if (this.arrivedAt !== null) return;
    this.arrivedAt = t;
    // what was found before the ward (a stroke on the table) is not a call from the ward's nurse
    this.foundSeen = this.n;
  }

  get arrived(): boolean {
    return this.arrivedAt !== null;
  }

  /** Minutes since arrival. */
  minutesIn(t = this.host.now()): number {
    return this.arrivedAt === null ? 0 : (t - this.arrivedAt) / 60;
  }

  /**
   * Write the observation schedule and mobilisation plan (once). Both are scored, with the end-of-case
   * neurological check at the table (unless the team did the table); an arrival set is taken now when the plan
   * is written soon after arrival.
   */
  setPlan(schedule: WardSchedule, mobilise: WardMobilisation): { schedule: PlanGrade; mobilise: PlanItemGrade } | null {
    if (this.arrivedAt === null || this.plan) return null;
    const now = this.host.now();
    this.plan = { schedule: structuredCloneish(schedule), mobilise: { ...mobilise }, setAt: now };
    const route = this.host.route();
    const closure = this.host.closure();
    const g = gradeSchedule(schedule, { route, stent: this.host.stented() });
    this.dueCache = null;
    const wrong = g.items.filter((i) => !i.correct);
    this.host.decide({
      id: "ward-schedule",
      stage: "recovery",
      label: "Observation schedule for the ward, for the access route",
      correct: g.correct,
      expected: g.items.map((i) => i.expected).join("; "),
      given: wrong.length ? wrong.map((i) => `${i.label}: ${i.given}`).join("; ") : "Oxford's routine",
      lessonId: "hb-after-the-procedure-monitoring",
      tipIds: route === "radial" ? ["access-post-radial-obs", "access-post-pulses-start-end"] : ["access-post-femoral-mobilise", "access-post-pulses-start-end"],
    });
    const mg = gradeMobilisation(mobilise, closure, this.host.sheathFr());
    this.host.decide({ id: "ward-mobilisation", stage: "recovery", label: mg.label, correct: mg.correct, expected: mg.expected, given: mg.given, lessonId: "hb-after-the-procedure-monitoring", tipIds: ["access-post-femoral-mobilise", "access-post-radial-obs"] });
    if (!this.host.teamTable()) this.scoreTableNeuroCheck();
    this.host.log("action", "Ward plan written: observations and mobilisation.");
    const rel = now - this.arrivedAt;
    if (rel <= MP_WARD.arrivalWindowS) {
      const a = schedule.arrival;
      const kinds = [a.vitals && "vitals", a.neuro && "neuro", a.site && "site", a.site && schedule.distalPulses && "pulses"].filter(Boolean) as ObsKind[];
      if (kinds.length) this.takeSet(now, kinds);
    }
    this.lastStepRel = rel;
    return { schedule: g, mobilise: mg };
  }

  /** The end-of-case neurological check at the table, scored once the ward's plan is written (or the ward closes without one). */
  private scoreTableNeuroCheck(): void {
    const out = this.host.catheterOutAt();
    const c = this.tableNeuroCheck && (out === null || this.tableNeuroCheck.t >= out - 0.05) ? this.tableNeuroCheck : null;
    this.host.decide({
      id: "ward-table-neuro-check",
      stage: "table",
      label: "Neurology checked before the patient left the table",
      correct: !!c,
      expected: "Ask the patient to speak and to move all four limbs before leaving the table",
      given: c ? "Speech and all four limbs checked" : this.tableNeuroCheck ? "Checked only before the last catheter came out" : "Not checked",
      lessonId: "cm-flow-embolism-stroke",
      tipIds: ["diag-finish-neuro-check"],
    });
  }

  /** The written plan graded as setPlan graded it (for the guided summary), or null before the plan. */
  planGrades(): { schedule: PlanGrade; mobilise: PlanItemGrade } | null {
    if (!this.plan) return null;
    return {
      schedule: gradeSchedule(this.plan.schedule, { route: this.host.route(), stent: this.host.stented() }),
      mobilise: gradeMobilisation(this.plan.mobilise, this.host.closure(), this.host.sheathFr()),
    };
  }

  // -------------------------------------------------------------------------
  // the clock
  // -------------------------------------------------------------------------

  /** The scheduled times (s since arrival) in (fromRel, toRel], with what each includes. */
  dueBetween(fromRel: number, toRel: number): { rel: number; kinds: ObsKind[] }[] {
    const p = this.plan;
    if (!p || toRel <= fromRel) return [];
    const s = p.schedule;
    const out = new Map<number, Set<ObsKind>>();
    const add = (rel: number, k: ObsKind) => {
      if (rel <= fromRel || rel > toRel) return;
      const key = round(rel, 1000);
      (out.get(key) ?? out.set(key, new Set()).get(key)!).add(k);
    };
    // observations: the first hour, the second hour, then the third period up to toRel
    const periods: [number, number, number | null][] = [
      [0, 3600, s.vitalsMin[0]],
      [3600, 7200, s.vitalsMin[1]],
      [7200, Infinity, s.vitalsMin[2]],
    ];
    for (const [a, b, m] of periods) {
      if (m === null || !(m > 0)) continue;
      const step = m * 60;
      const end = Math.min(b, toRel);
      for (let k = Math.max(1, Math.ceil((Math.max(fromRel, a) - a) / step)); a + k * step <= end; k++) add(a + k * step, "vitals");
    }
    if (s.siteMin !== null && s.siteMin > 0) {
      const step = s.siteMin * 60;
      const until = s.siteUntil === "first-hour" ? 3600 : s.siteUntil === "mobile" ? p.mobilise.walkMin * 60 : Infinity;
      const end = Math.min(until, toRel);
      for (let k = Math.max(1, Math.ceil(fromRel / step)); k * step <= end; k++) {
        add(k * step, "site");
        if (s.distalPulses) add(k * step, "pulses");
      }
    }
    return [...out.entries()].sort((x, y) => x[0] - y[0]).map(([rel, kinds]) => ({ rel, kinds: [...kinds] }));
  }

  /** The next scheduled set after rel (s since arrival), looked ahead 6 hours, or null; cached until the clock reaches it. */
  private nextDueAfter(rel: number): number | null {
    const c = this.dueCache;
    if (c && rel >= c.from && (c.next !== null ? rel < c.next : rel < c.to)) return c.next;
    const to = rel + 6 * 3600;
    const next = this.dueBetween(rel, to)[0];
    this.dueCache = { from: rel, to, next: next ? next.rel : null };
    return this.dueCache.next;
  }

  /** The next scheduled set after now (s since arrival), or null. */
  nextDueRel(): number | null {
    if (!this.plan || this.arrivedAt === null) return null;
    return this.nextDueAfter(this.host.now() - this.arrivedAt);
  }

  /**
   * Advance the ward to the session time now: sets due since the last step are taken, the events are stepped
   * (growth, findings). Returns whether something was found since the last step, here or at an event's onset (chest
   * pain and a stroke are reported when they begin): the session cuts a running recovery lapse short.
   */
  step(): boolean {
    if (this.arrivedAt === null) return false;
    const now = this.host.now();
    const rel = now - this.arrivedAt;
    let found = false;
    if (this.plan) {
      // the schedule is read only when a set is due (the cached next time), not on every tick
      const next = this.nextDueAfter(this.lastStepRel);
      if (next === null ? rel - this.lastStepRel > 6 * 3600 : rel >= next) {
        // site checks 'until the band is off' stop once every band is off
        const bandRuleOver = this.plan.schedule.siteUntil === "band-off" && !this.host.bandOn();
        for (const d of this.dueBetween(this.lastStepRel, rel)) {
          const kinds = bandRuleOver ? d.kinds.filter((k) => k !== "site" && k !== "pulses") : d.kinds;
          if (kinds.length && this.takeSet(this.arrivedAt + d.rel, kinds)) found = true;
        }
      }
      this.lastStepRel = rel;
      const walk = this.plan.mobilise.walkMin * 60;
      if (!this.mobileLogged && rel >= walk) {
        this.mobileLogged = true;
        this.host.log("nurse", "The patient is up and walking, as the plan says.");
      }
    }
    // events found without a set: a report from the patient
    for (const e of this.events) {
      if (e.foundS !== null || e.resolvedAt !== null) continue;
      if (e.kind === "chest-pain-post-pci" && e.ev) {
        // an occluded stent: the pain is reported once the ischaemia is there, so the ECG taken at once shows it
        if (this.host.vitals().stemi.met || now - e.onsetS >= MP_WARD.occlusionPainMaxS) {
          this.find(e, "report", e.ev.report);
          found = true;
        }
      } else if ((e.kind === "forearm-haematoma" || e.kind === "groin-haematoma") && this.mlAt(e, now) >= MP_WARD.reportMl) {
        this.find(e, "report", `The patient complains of a painful swelling at the ${e.kind === "groin-haematoma" ? "groin" : "forearm"}: ${this.sizeText(e, now)}.`);
        found = true;
      } else if (e.kind === "tamponade" && this.host.vitals().aortaTrue.sys < MP_WARD.faintSysMmHg) {
        this.find(e, "report", "The patient feels faint and clammy and asks for the nurse.");
        found = true;
      }
    }
    // a tamponade's inflow ends once its volume has gone in
    for (const e of this.events)
      if (e.kind === "tamponade" && e.inflowMlS && e.ev && now - e.onsetS >= (e.ev.totalMl / Math.max(1e-6, e.ev.bleedMlMin)) * 60) {
        e.inflowMlS = 0;
        this.host.pericardialInflow(0);
      }
    const fresh = this.n !== this.foundSeen;
    this.foundSeen = this.n;
    return found || fresh;
  }

  /** Take a set of observations (and find what it shows). Returns whether an event was first seen in it. */
  private takeSet(atS: number, kinds: ObsKind[]): boolean {
    const v = this.host.vitals();
    const set: WardSet = { atS: round(atS, 10), atMin: round(this.minutesIn(atS), 10), kinds, reviewedAt: null };
    if (kinds.includes("vitals")) {
      set.hr = v.hr === null ? null : Math.round(v.hr);
      set.bp = { sys: Math.round(v.aortaTrue.sys), dia: Math.round(v.aortaTrue.dia) };
      set.spo2 = v.spo2 === null ? null : Math.round(v.spo2);
      set.rr = Math.round(v.respRate);
      if (this.plan?.schedule.ecgMonitor) set.rhythm = v.rhythm;
    }
    if (kinds.includes("neuro")) set.neuro = this.neuroText();
    if (kinds.includes("site")) set.site = this.siteNow(atS);
    if (kinds.includes("pulses")) set.pulses = this.host.pulseText();
    this.sets.push(set);
    let found = false;
    for (const e of this.events) {
      if (e.foundS !== null || e.resolvedAt !== null) continue;
      if ((e.kind === "forearm-haematoma" || e.kind === "groin-haematoma") && kinds.includes("site") && this.mlAt(e, atS) >= MP_WARD.palpableMl) {
        set.remark = `A tender swelling at the ${e.kind === "groin-haematoma" ? "groin" : "wrist and forearm"}, ${this.sizeText(e, atS)}.`;
        this.find(e, "site", set.remark);
        found = true;
      } else if (e.kind === "tamponade" && kinds.includes("vitals") && ((set.bp && set.bp.sys < MP_WARD.lowSysMmHg) || (set.hr != null && set.hr > MP_WARD.highHr))) {
        set.remark = `Pulse ${set.hr ?? "-"}, pressure ${set.bp!.sys}/${set.bp!.dia}; the patient looks pale.`;
        this.find(e, "vitals", set.remark);
        found = true;
      }
    }
    return found;
  }

  private neuroText(): string {
    const s = this.events.find((e) => (e.kind === "stroke" || e.kind === "table-stroke") && e.foundS !== null);
    return s ? (s.report ?? "A new deficit.") : "Speaks normally; moves all four limbs.";
  }

  /** The site as the nurse finds it: a haematoma under way is felt from MP_WARD.palpableMl. */
  private siteNow(atS: number): string {
    const h = this.events.find((e) => (e.kind === "forearm-haematoma" || e.kind === "groin-haematoma") && this.mlAt(e, atS) >= MP_WARD.palpableMl);
    return h ? `Swelling ${this.sizeText(h, atS)}` : this.host.siteText();
  }

  /** A haematoma's volume at time t (mL): it grows at its rate from onset until it is compressed or reaches its total. */
  mlAt(e: WardEventState, t: number): number {
    if (!e.ev) return 0;
    const end = e.stoppedAt !== null ? Math.min(t, e.stoppedAt) : t;
    return Math.max(0, Math.min(e.ev.totalMl, (e.ev.bleedMlMin * Math.max(0, end - e.onsetS)) / 60));
  }

  private sizeText(e: WardEventState, t: number): string {
    return `about ${haematomaCm(this.mlAt(e, t))} cm across`;
  }

  // -------------------------------------------------------------------------
  // events
  // -------------------------------------------------------------------------

  /** Does the ward present this delayed event (rather than the session's nurse report at its time)? */
  takes(ev: DelayedEvent): boolean {
    if ((WARD_FOLLOW_UP_KINDS as readonly string[]).includes(ev.kind)) return false;
    if ((WARD_DELAYED_KINDS as readonly string[]).includes(ev.kind)) return this.arrived;
    return (WARD_HAEMATOMA_KINDS as readonly string[]).includes(ev.kind) && !!this.plan;
  }

  /**
   * A delayed event begins (the session found its time). A stroke and chest pain without an occlusion are reported
   * at once; a stent thrombosis is reported by step() once the engine's ischaemia shows.
   */
  onset(ev: DelayedEvent, followUp = false): WardEventState | null {
    const kind = ev.kind as WardEventKind;
    if (!(kind in WARD_EVENT_RULES) || kind === "table-stroke") return null;
    const now = this.host.now();
    const e: WardEventState = { id: this.idFor(kind), kind, onsetS: now, foundS: null, foundBy: null, ev, mlAtFind: null, stoppedAt: null, report: null, actions: [], resolvedAt: null };
    this.events.push(e);
    if (kind === "forearm-haematoma" || kind === "groin-haematoma") this.host.bleed(ev);
    else if (kind === "tamponade") {
      e.inflowMlS = ev.bleedMlMin / 60;
      this.host.pericardialInflow(e.inflowMlS);
    } else if (kind === "chest-pain-post-pci") {
      const site = ev.severity === "major" ? this.host.stentSite() : null;
      if (site) {
        e.occluded = true;
        this.host.occlude(`ward-${e.id}`, site.vessel, site.param);
      } else this.find(e, "report", ev.report);
    } else if (kind === "stroke") this.find(e, "report", ev.report);
    else if (kind === "creatinine-rise" && followUp) this.find(e, "bloods", ev.finding);
    return e;
  }

  private idFor(kind: WardEventKind): string {
    const same = this.events.filter((x) => x.kind === kind).length;
    return same ? `${kind}-${same + 1}` : kind;
  }

  private find(e: WardEventState, by: WardFoundBy, report: string): void {
    const now = this.host.now();
    e.foundS = round(now, 10);
    e.foundBy = by;
    e.report = report;
    this.n++;
    if (e.kind === "forearm-haematoma" || e.kind === "groin-haematoma") {
      e.mlAtFind = round(this.mlAt(e, now), 10);
      const g = easyGradeFromSize(haematomaCm(e.mlAtFind), false, false);
      if (e.ev) this.host.present(e.ev, report, g >= 3 || e.ev.severity === "major" ? "major" : "minor");
      this.host.log("nurse", report);
    } else {
      this.host.log(e.kind === "creatinine-rise" ? "result" : "nurse", report);
      if (e.kind === "chest-pain-post-pci") this.host.holdTip(["chest-pain"]);
      if (e.kind === "stroke" || e.kind === "table-stroke") this.host.holdTip(["neuro-deficit"]);
    }
  }

  /** The events found and not yet resolved, in the order found. */
  openEvents(): WardEventState[] {
    return this.events.filter((e) => e.foundS !== null && e.resolvedAt === null).sort((a, b) => (a.foundS ?? 0) - (b.foundS ?? 0));
  }

  /** The first scheduled set taken after the event was found (s), or null. */
  private nextSetAfter(e: WardEventState): number | null {
    if (e.foundS === null) return null;
    const s = this.sets.find((x) => x.atS > (e.foundS as number) + 0.05);
    return s ? s.atS : null;
  }

  /**
   * The learner acts on a found event. The first action, the response (harm or completion) and whether it was
   * acted on before the next set are scored once each. Returns what the action showed, or null when refused.
   */
  act(eventId: string, action: WardActionId): string | null {
    const e = this.events.find((x) => x.id === eventId);
    if (!e || e.foundS === null || e.resolvedAt !== null || this.host.busy()) return null;
    const rule = WARD_EVENT_RULES[e.kind];
    if (!wardOptionsNow(e.kind, e.actions.map((a) => a.id)).some((o) => o.id === action)) return null;
    const now = this.host.now();
    const first = e.actions.length === 0;
    const result = this.effect(e, action);
    e.actions.push({ id: action, t: round(now, 10), ...(result ? { result } : {}) });
    const label = rule.options.find((o) => o.id === action)!.label;
    this.host.log("action", `${label}.`);
    if (result) this.host.log("result", result);
    const ids = e.actions.map((a) => a.id);
    const g = gradeWardActions(e.kind, ids);
    const base = e.kind === "table-stroke" ? "table-stroke" : `ward-${e.id}`;
    if (first) {
      this.host.decide({ id: `${base}-first`, stage: e.kind === "table-stroke" ? "table" : "recovery", label: `${eventTitle(e.kind)}: the first action`, correct: !!g.firstCorrect, expected: rule.expectedFirst, given: label, lessonId: rule.lessonId, tipIds: rule.tipIds });
      if (e.kind !== "table-stroke" && e.kind !== "creatinine-rise" && e.foundBy !== "report") {
        const next = this.nextSetAfter(e);
        this.host.decide({
          id: `${base}-recognised`,
          stage: "recovery",
          label: `${eventTitle(e.kind)}: acted on at the observation where it first appeared`,
          correct: next === null,
          expected: "Acted on before the next set of observations",
          given: next === null ? `Acted on ${round((now - (e.foundS as number)) / 60, 10)} min after it was found` : "Not acted on until after the next set",
          lessonId: rule.lessonId,
          tipIds: rule.tipIds,
        });
      }
    }
    if (g.harmful || g.complete) this.scoreResponse(e, g.harmful);
    if (g.complete) this.resolve(e);
    this.host.spend(MP_WARD.actionS, label);
    return result ?? label;
  }

  private scoreResponse(e: WardEventState, harmful: WardActionId | null): void {
    const base = e.kind === "table-stroke" ? "table-stroke" : `ward-${e.id}`;
    const id = `${base}-response`;
    if (e.scored) return;
    e.scored = true;
    const rule = WARD_EVENT_RULES[e.kind];
    const given = e.actions.map((a) => lowerFirst(rule.options.find((o) => o.id === a.id)?.label ?? a.id)).join(", then ");
    this.host.decide({
      id,
      stage: e.kind === "table-stroke" ? "table" : "recovery",
      label: `${eventTitle(e.kind)}: a complete and safe response`,
      correct: harmful === null,
      expected: rule.expectedResponse,
      given: harmful ? `${capital(given)} (${lowerFirst(rule.options.find((o) => o.id === harmful)!.label)} is wrong here)` : capital(given),
      lessonId: rule.lessonId,
      tipIds: rule.tipIds,
    });
  }

  /** What an action shows or does (the engine's state is read, and the event's course changed). */
  private effect(e: WardEventState, a: WardActionId): string | undefined {
    const v = this.host.vitals();
    const now = this.host.now();
    switch (a) {
      case "ecg-12":
        return ecgText(v);
      case "echo":
        return v.pericardialMl >= MP_WARD.echoCollapseMl
          ? "A large pericardial effusion with the right ventricle collapsing in diastole."
          : v.pericardialMl >= MP_WARD.echoEffusionMl
            ? "A pericardial effusion; the right heart still fills."
            : "No pericardial effusion; the ventricles contract normally.";
      case "pericardiocentesis": {
        if (e.kind !== "tamponade") return undefined;
        e.inflowMlS = 0;
        this.host.pericardialInflow(0);
        const ml = this.host.drainPericardium(10000);
        return ml > 0 ? `The operator drains ${Math.round(ml)} mL of blood from the pericardium under echo guidance.` : "Nothing is drained.";
      }
      case "compress":
        if ((e.kind === "forearm-haematoma" || e.kind === "groin-haematoma") && e.stoppedAt === null) {
          e.stoppedAt = now;
          if (e.ev) this.host.stopBleed(e.ev);
          return `The swelling stops growing: ${this.sizeText(e, now)}.`;
        }
        return undefined;
      case "mark-grade":
        return e.kind === "forearm-haematoma" || e.kind === "groin-haematoma" ? `Edges marked: ${this.sizeText(e, now)}.` : undefined;
      case "call-operator":
        if (e.occluded) {
          e.occluded = false;
          this.host.clearOcclusion(`ward-${e.id}`);
          return "The operator reviews the ECG and takes the patient back to the lab.";
        }
        return "The operator comes to see the patient.";
      case "review-drugs":
        return `Heparin ${this.host.heparinU()} U in the lab; the stroke team weighs it for thrombolysis.`;
      case "ct-cta":
        if (e.kind === "table-stroke" || e.kind === "stroke") return `Requested. Heparin given in the lab: ${this.host.heparinU()} U, which the stroke team weighs for thrombolysis.`;
        return undefined;
      case "onset-time":
        return `Onset recorded at ${hm(this.minutesIn(e.foundS ?? now))} on the ward clock.`;
      default:
        return undefined;
    }
  }

  private resolve(e: WardEventState): void {
    e.resolvedAt = round(this.host.now(), 10);
    if (e.kind === "chest-pain-post-pci") this.host.clearTip("chest-pain");
    if (e.occluded) {
      e.occluded = false;
      this.host.clearOcclusion(`ward-${e.id}`);
    }
  }

  // -------------------------------------------------------------------------
  // the table
  // -------------------------------------------------------------------------

  /** A scenario's start state: the next embolism on the table is a stroke (and the cholesterol vignette presents). */
  scriptTableStroke(): void {
    this.forceTableStroke = true;
  }
  scriptCholesterol(): void {
    this.forceCholesterol = true;
  }

  /** The end-of-case neurological check at the table (speech and all four limbs). Returns what was found. */
  neuroCheckAtTable(): string {
    const s = this.events.find((e) => e.kind === "table-stroke");
    const finding = s ? (s.report ?? "A new deficit.") : `${this.host.sex() === "M" ? "He" : "She"} speaks clearly and moves all four limbs.`;
    this.tableNeuroCheck = { t: round(this.host.now(), 10), finding };
    return finding;
  }

  /**
   * Clot or air sent into the aorta: an embolic stroke follows with MP_WARD's chance (certain when a scenario
   * scripts it). Returns the stroke event, or null.
   */
  tableEmbolism(cause: "clot" | "air"): WardEventState | null {
    if (this.events.some((e) => e.kind === "table-stroke")) return null;
    const chance = cause === "clot" ? MP_WARD.tableStrokeAfterClot : MP_WARD.tableStrokeAfterAir;
    const draw = this.rng.next();
    if (!this.forceTableStroke && draw >= chance) return null;
    this.forceTableStroke = false;
    const he = this.host.sex() === "M" ? "He" : "She";
    const his = this.host.sex() === "M" ? "his" : "her";
    const now = this.host.now();
    const e: WardEventState = { id: "table-stroke", kind: "table-stroke", onsetS: now, foundS: null, foundBy: null, ev: null, mlAtFind: null, stoppedAt: null, report: null, actions: [], resolvedAt: null };
    this.events.push(e);
    this.find(e, "report", `${he} cannot find ${his} words and ${his} right hand is weak.`);
    return e;
  }

  /** The stroke on the table, found and not yet answered with the pathway. */
  get tableStroke(): WardEventState | null {
    return this.events.find((e) => e.kind === "table-stroke") ?? null;
  }

  // -------------------------------------------------------------------------
  // follow-up
  // -------------------------------------------------------------------------

  /** The cholesterol vignette applies: a diseased aorta and catheters exchanged without a wire. */
  cholesterolRisk(): boolean {
    return this.aortaDiseased && this.reports.some((r) => (r.wirelessExchanges ?? 0) > 0);
  }

  /** The review weeks later: the vignette when it applies and its draw (or the scenario) says so; otherwise a well patient. */
  presentCholesterolFollowUp(): { present: boolean; text: string } | null {
    if (this.arrivedAt === null || this.cholesterol) return null;
    const present = this.cholesterolRisk() && (this.forceCholesterol || this.rng.next() < MP_WARD.cholesterolChance);
    const text = present ? CHOLESTEROL_VIGNETTE : "Review three weeks after the procedure: well, the access site healed, the foot pulses normal and the creatinine back to baseline.";
    this.cholesterol = { at: round(this.host.now(), 10), present, text, assessed: null };
    this.host.log("nurse", text);
    return { present, text };
  }

  assessCholesterol(dx: CholesterolDx, plan: CholesterolPlan): { dxCorrect: boolean; planCorrect: boolean } | null {
    const c = this.cholesterol;
    if (!c || !c.present || c.assessed) return null;
    const g = gradeCholesterol(dx, plan);
    c.assessed = { dx, plan, correct: g.dxCorrect && g.planCorrect };
    this.host.decide({
      id: "followup-cholesterol-assessment",
      stage: "recovery",
      label: "Follow-up: the pattern named and managed",
      correct: g.dxCorrect && g.planCorrect,
      expected: "Cholesterol embolisation: supportive care; no emergency limb angiography for a limb with palpable pulses",
      given: `${CHOLESTEROL_DX_LABEL[dx]}: ${lowerFirst(CHOLESTEROL_PLAN_LABEL[plan])}`,
      lessonId: "cm-flow-embolism-oedema-cholesterol",
      tipIds: ["diag-exchange-over-wire"],
    });
    this.host.log("action", "Follow-up assessment recorded.");
    return g;
  }

  /** The ward's own record is closed (the case ends): sets not reviewed and events not answered are scored. */
  close(): void {
    if (this.closed) return;
    this.closed = true;
    const missed = this.sets.filter((x) => x.reviewedAt === null).length;
    // no plan written although the ward was the case's work (a scenario opened on the ward, an event there, or time
    // run on the ward past the arrival window): the schedule and the mobilisation plan are scored as not written. A
    // case finished as the patient reaches the ward (the autopilot's runs) is not scored for a ward it never ran.
    if (this.arrivedAt !== null && !this.plan && (this.host.teamTable() || this.events.length > 0 || this.host.now() - this.arrivedAt > MP_WARD.arrivalWindowS)) {
      const route = this.host.route();
      const g = gradeSchedule(oxfordSchedule(route, this.host.stented()), { route, stent: this.host.stented() });
      const mg = gradeMobilisation(oxfordMobilisation(this.host.closure()), this.host.closure(), this.host.sheathFr());
      this.host.decide({
        id: "ward-schedule",
        stage: "recovery",
        label: "Observation schedule for the ward, for the access route",
        correct: false,
        expected: g.items.map((i) => i.expected).join("; "),
        given: "No plan written",
        lessonId: "hb-after-the-procedure-monitoring",
        tipIds: route === "radial" ? ["access-post-radial-obs", "access-post-pulses-start-end"] : ["access-post-femoral-mobilise", "access-post-pulses-start-end"],
      });
      this.host.decide({ id: "ward-mobilisation", stage: "recovery", label: mg.label, correct: false, expected: mg.expected, given: "No plan written", lessonId: "hb-after-the-procedure-monitoring", tipIds: ["access-post-femoral-mobilise", "access-post-radial-obs"] });
      if (!this.host.teamTable()) this.scoreTableNeuroCheck();
    }
    // the sets are scored only when there was a plan (and so a chart); the events are scored whatever happened
    if (this.plan)
      this.host.decide({
      id: "ward-sets-reviewed",
      stage: "recovery",
      label: "Each set of observations reviewed",
      correct: missed === 0,
      expected: "Every set the nurse charted reviewed",
      given: missed ? `${missed} of ${this.sets.length} sets not reviewed` : `All ${this.sets.length} sets reviewed`,
      lessonId: "hb-after-the-procedure-monitoring",
      tipIds: ["access-post-pulses-start-end"],
    });
    for (const e of this.openEvents()) {
      const rule = WARD_EVENT_RULES[e.kind];
      const base = e.kind === "table-stroke" ? "table-stroke" : `ward-${e.id}`;
      const stage = e.kind === "table-stroke" ? "table" : "recovery";
      if (!e.actions.length) this.host.decide({ id: `${base}-first`, stage, label: `${eventTitle(e.kind)}: the first action`, correct: false, expected: rule.expectedFirst, given: "No action", lessonId: rule.lessonId, tipIds: rule.tipIds });
      if (!e.scored) {
        e.scored = true;
        this.host.decide({ id: `${base}-response`, stage, label: `${eventTitle(e.kind)}: a complete and safe response`, correct: false, expected: rule.expectedResponse, given: "Not completed", lessonId: rule.lessonId, tipIds: rule.tipIds });
      }
    }
  }

  /** Mark a set reviewed. */
  review(i: number): boolean {
    const s = this.sets[i];
    if (!s || s.reviewedAt !== null) return false;
    s.reviewedAt = round(this.host.now(), 10);
    return true;
  }

  /** Mark every set charted so far reviewed. */
  reviewAll(): number {
    let n = 0;
    this.sets.forEach((_, i) => {
      if (this.review(i)) n++;
    });
    return n;
  }

  /** How many events have been found (a counter the panel watches). */
  get foundCount(): number {
    return this.n;
  }
}

/** A neutral title for an event's card: what the nurse brings, not what it is. */
export function eventTitle(kind: WardEventKind): string {
  switch (kind) {
    case "forearm-haematoma":
    case "groin-haematoma":
      return "The access site";
    case "creatinine-rise":
      return "The bloods at review";
    case "table-stroke":
      return "On the table";
    default:
      return "The nurse calls";
  }
}

const capital = (t: string) => (t ? t[0].toUpperCase() + t.slice(1) : t);
/** A label run into a sentence: only its first letter lowered, so acronyms (ECG, CT) keep their capitals. */
export const lowerFirst = (t: string) => (t ? t[0].toLowerCase() + t.slice(1) : t);

/** The 12-lead ECG as read from the engine: ST elevation with the groups it meets, ST depression, or no new change. */
export function ecgText(v: Pick<Vitals, "rhythm" | "st" | "stemi">): string {
  if (v.stemi.met) return `${v.rhythm}; ST elevation in the ${v.stemi.groups.join(" and ")} leads.`;
  const dep = Object.values(v.st).some((x) => x <= -1);
  return dep ? `${v.rhythm}; new ST depression.` : `${v.rhythm}; no new ST change.`;
}

/** A shallow copy of a schedule (its nested parts copied too). */
function structuredCloneish(s: WardSchedule): WardSchedule {
  return { ...s, arrival: { ...s.arrival }, vitalsMin: [...s.vitalsMin] as WardSchedule["vitalsMin"] };
}

/**
 * What the ward raises, for the reachability report: the access closure (both routes) and a haematoma at the
 * access site; at the PCI finish, chest pain and a high contrast volume (the latter from the case's own
 * contrast, held when a lab's report takes it over the budget); at the diagnostic finish, a new neurological
 * deficit (on the ward or on the table).
 */
export const raises: readonly LabRaises[] = [
  { lab: "access", phases: ["closure", "complication"], events: ["haematoma"], routes: ["radial", "femoral"] },
  { lab: "pci", phases: ["finish"], events: ["chest-pain", "high-contrast-volume"] },
  { lab: "diagnostic", phases: ["finish"], events: ["neuro-deficit"], routes: ["radial", "femoral"] },
];
