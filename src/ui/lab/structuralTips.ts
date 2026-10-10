// ---------------------------------------------------------------------------
// The structural heart lab's tip context (structural-tips-and-tavi-course).
//
// Each of the three procedures reports its step in the shared tip vocabulary
// (src/content/lab/tips.ts, lab "structural"), with the procedure, so that a
// tip written for one procedure never appears in another that shares the same
// phase names (hb-additional-procedures#8):
//   TAVI   plan, access, position, deploy, assess: the step is the phase;
//          procedures ['tavi']
//   TEER   plan; transseptal as access with ['teer','transseptal']; steer as
//          position; grasp as deploy; assess
//   LAAO   measure and size as plan; transseptal as access with
//          ['laao','transseptal']; deploy (with position while the sheath and
//          device are still being placed, before unsheathing); pass as assess
// The debrief reports no context: tips are for the procedure, the debrief has
// its own teaching.
//
// Events come from the TAVI post-deployment course (taviCourse in
// src/simulation/tavi.ts) at the assess step: hypotension, st-elevation,
// bradycardia and av-block, through the shared patient-event adapter
// (src/ui/lab/patientEvents.ts) so the thresholds and the hypotension hold are
// those of every other lab. While any of them is active the phase list adds
// "complication". Unpaced complete heart block without ST elevation accounts for
// the low pressure on screen, so hypotension is not reported with it
// (attributeCourseEvents). Rapid pacing is intended, so the course is read only from the
// moment pacing stops.
//
// structural-transseptal-hands-on: the TEER and LAAO transseptal step runs the hands-on puncture
// (src/simulation/transseptal.ts, src/ui/structural/TransseptalStage.tsx). It reports access with
// the host and transseptal procedures; position too from the moment the tip sits on the fossa (the
// tent is being positioned, then crossed and secured); and the stage's events: low-act until the ACT
// is in range after the crossing, air at the hub, hypotension, st-elevation and bradycardia for the
// septal reflex and for air, hypotension and tamponade for a haemopericardium or a delayed posterior
// exit. "complication" is added while a monitor event is active or once the learner has read an
// aortic trace (or advanced into the aorta); low-act and air alone do not add it.
//
// `raises` (below) is what this lab can report; the reachability report
// (src/content/lab/reachability.test.ts) reads it.
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent, LabPhase, LabProcedure } from "../../content/lab/tips";
import type { LabRaises } from "../../content/lab/raisable/waiting";
import { courseAt, type CourseSample, type TaviCourse } from "../../simulation/tavi";
import { TRANSSEPTAL_EVENTS, complicationActive, inPositionPhase, transseptalEvents, type TsHost, type TsState } from "../../simulation/transseptal";
import { PatientEventAdapter, type PatientVitals } from "./patientEvents";

export type StructuralProcedureLab = "tavi" | "teer" | "laao";

export type TaviStep = "plan" | "access" | "position" | "deploy" | "assess" | "debrief";
export type TeerStep = "plan" | "transseptal" | "steer" | "grasp" | "assess" | "debrief";
export type LaaoStep = "measure" | "transseptal" | "size" | "deploy" | "pass" | "debrief";

export const TAVI_STEPS: readonly TaviStep[] = ["plan", "access", "position", "deploy", "assess", "debrief"];
export const TEER_STEPS: readonly TeerStep[] = ["plan", "transseptal", "steer", "grasp", "assess", "debrief"];
export const LAAO_STEPS: readonly LaaoStep[] = ["measure", "transseptal", "size", "deploy", "pass", "debrief"];

/** The phase each step reports (null: no tips at that step). */
export const TAVI_PHASE: Record<TaviStep, LabPhase | null> = { plan: "plan", access: "access", position: "position", deploy: "deploy", assess: "assess", debrief: null };
export const TEER_PHASE: Record<TeerStep, LabPhase | null> = { plan: "plan", transseptal: "access", steer: "position", grasp: "deploy", assess: "assess", debrief: null };
export const LAAO_PHASE: Record<LaaoStep, LabPhase | null> = { measure: "plan", transseptal: "access", size: "plan", deploy: "deploy", pass: "assess", debrief: null };

/** The events the TAVI course can raise. */
export const TAVI_COURSE_EVENTS = ["hypotension", "st-elevation", "bradycardia", "av-block"] as const satisfies readonly LabEvent[];

/** The vitals the shared adapter reads, from one moment of the course. */
export function courseVitals(s: CourseSample): PatientVitals {
  return {
    t: s.t,
    hr: s.hr,
    rhythmKind: s.rhythm === "paced" ? "paced" : "sinus",
    av: s.rhythm === "chb" ? 3 : 0,
    art: { sys: s.sys, dia: s.dia, mean: s.map },
    // the course carries the ST shift of one territory; 1 mm is the limb-lead STEMI threshold the
    // patient engine uses (stemiCriteria in src/simulation/ecg12.ts, Fourth Universal Definition)
    stemi: { met: s.stMm >= 1, groups: [] },
  };
}

/**
 * The patient events the course shows at course time t (s), read with the shared adapter from the
 * moment pacing stops (rapid pacing lowers the pressure on purpose). Pure: it replays the course
 * second by second up to t, so the hypotension hold is measured in course time.
 */
export function taviCourseEvents(course: TaviCourse, t: number): LabEvent[] {
  if (t < course.pacingEndS) return [];
  const adapter = new PatientEventAdapter();
  let last: LabEvent[] = [];
  const end = Math.min(t, course.samples[course.samples.length - 1].t);
  for (const s of course.samples) {
    if (s.t < course.pacingEndS) continue;
    if (s.t > end) break;
    last = adapter.update(courseVitals(s));
  }
  if (t > end) last = adapter.update({ ...courseVitals(courseAt(course, t)), t });
  return last.filter((e): e is LabEvent => (TAVI_COURSE_EVENTS as readonly string[]).includes(e));
}

function context(phase: LabPhase | null, procedures: LabProcedure[], events: LabEvent[] = [], phases: LabPhase[] = []): LabContext | null {
  if (!phase) return null;
  const ctx: LabContext = { lab: "structural", phase, procedures, events };
  const extra = [...phases];
  if (events.length && !extra.includes("complication")) extra.push("complication");
  if (extra.length) ctx.phases = extra;
  return ctx;
}

export interface TaviTipInput {
  step: TaviStep;
  /** the post-deployment course and the course time, at the assess step */
  course?: TaviCourse | null;
  courseT?: number;
}

/**
 * The course's events as the tip context reports them. While the monitor shows unpaced complete heart
 * block without ST elevation, the low pressure is put down to the slow rhythm on screen and hypotension
 * is not reported, so the pacing tip leads rather than "check the coronaries". Once the block is paced
 * (av-block clears) a pressure that is still low reports hypotension again. Everything this reads is
 * on the monitor; nothing hidden in the course (the obstruction, the coronary filling) gates it.
 */
export function attributeCourseEvents(events: LabEvent[]): LabEvent[] {
  const blockExplainsPressure = events.includes("av-block") && !events.includes("st-elevation");
  return blockExplainsPressure ? events.filter((e) => e !== "hypotension") : events;
}

/** The TAVI lab's tip context: the step is the phase; the course's events at the assess step. */
export function taviTipContext(i: TaviTipInput): LabContext | null {
  const events = i.step === "assess" && i.course ? attributeCourseEvents(taviCourseEvents(i.course, i.courseT ?? 0)) : [];
  return context(TAVI_PHASE[i.step], ["tavi"], events);
}

/**
 * The tip context of the hands-on transseptal puncture for a host procedure: access with
 * [host, 'transseptal'], position from the moment the tip sits on the fossa, the stage's events, and
 * complication while one has declared itself (see the header).
 */
export function transseptalTipContext(host: TsHost, ts: TsState): LabContext {
  const events = transseptalEvents(ts);
  const phases: LabPhase[] = [];
  if (inPositionPhase(ts)) phases.push("position");
  if (complicationActive(ts, events)) phases.push("complication");
  const ctx: LabContext = { lab: "structural", phase: "access", procedures: [host, "transseptal"], events };
  if (phases.length) ctx.phases = phases;
  return ctx;
}

/**
 * The TEER lab's tip context; the transseptal step is access with the transseptal procedure, and with
 * the stage's state (`transseptal`) it is the hands-on puncture's context.
 */
export function teerTipContext(i: { step: TeerStep; transseptal?: TsState | null }): LabContext | null {
  if (i.step === "transseptal" && i.transseptal) return transseptalTipContext("teer", i.transseptal);
  return context(TEER_PHASE[i.step], i.step === "transseptal" ? ["teer", "transseptal"] : ["teer"]);
}

/**
 * The LAAO lab's tip context; the transseptal step is access with the transseptal procedure. At the
 * deploy step the sheath and the device are still being positioned until unsheathing starts
 * (`unsheathed` false), so position is reported with deploy.
 */
export function laaoTipContext(i: { step: LaaoStep; unsheathed?: boolean; transseptal?: TsState | null }): LabContext | null {
  if (i.step === "transseptal" && i.transseptal) return transseptalTipContext("laao", i.transseptal);
  const phases: LabPhase[] = i.step === "deploy" && !i.unsheathed ? ["position"] : [];
  return context(LAAO_PHASE[i.step], i.step === "transseptal" ? ["laao", "transseptal"] : ["laao"], [], phases);
}

/** What the structural lab can report (the reachability report reads this). */
export const raises: LabRaises = {
  lab: "structural",
  phases: ["plan", "access", "position", "deploy", "assess", "complication"],
  events: [...TAVI_COURSE_EVENTS, ...TRANSSEPTAL_EVENTS.filter((e) => !(TAVI_COURSE_EVENTS as readonly string[]).includes(e))],
  procedures: ["tavi", "teer", "laao", "transseptal"],
};
