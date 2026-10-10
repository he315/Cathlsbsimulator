// ---------------------------------------------------------------------------
// The physiology lab's tip context (physiology-engine-unify-and-setup).
//
// physiologyTipContext(session, vitals, flags) reports a pressure-wire study
// in the shared tip vocabulary (src/content/lab/tips.ts), as a PCI-lab context
// at phase "physiology" (the pressure-wire tips are PCI tips; the PCI lab's
// console uses the same session and so the same context):
//   vessel    the target vessel of the preset (LAD, LCx, RCA, LM, SVG)
//   pressure  the guide pressure as the operator sees it: classified with
//             transducer.classifyTip while a guide that obstructs the ostium
//             is engaged, damped while the aortic line is overdamped (air,
//             contrast in the guide) or the valve leaks (introducer in), and
//             the engine's own tip classification when it reports one
//   events    the set-up events the session raised (wire-side-branch,
//             wire-not-crossing, pressure-damped, held for PW_EVENT_HOLD_S),
//             the patient events of the engine (patientEvents.ts: hypotension,
//             bradycardia and AV block from adenosine, and with the adenosine
//             hazard model of the hyperaemia presets atrial fibrillation and
//             VF), the preset's case properties and any events a launch added
//             for the run
//
// Air in the aortic line is reported through the pressure (damped) and the
// pressure-damped event, not as the event "air": that event names air in the
// coronary circulation, whose tips (oxygen, aspirate the guide) do not apply
// to a bubble in the transducer line.
//
// `raises` (below) is what this lab can report; the reachability report
// (src/content/lab/reachability.test.ts) reads it.
//
// rankPhysiologyTips orders the matching tips for the panel: the conditions
// they match first (tipScore), then the tips of the lesson for the step the study is at
// (setting up, measuring, pullback and drift check), so the few tips shown
// follow the study instead of the registry order.
//
// The coronary function test (physiology-anoca-cft, src/simulation/physiology/ach.ts) has its own
// context, cftTipContext: phase "physiology", 'ach-provocation' only while an acetylcholine dose is
// being given or its response read (ach.achProvocation), bradycardia and AV block from the
// acetylcholine slowing and the RCA block, 'coronary-spasm' while the vessel is in spasm and
// 'chest-pain' while the patient has pain. The adenosine part of the study raises none of these, and
// physiologyTipContext never reports 'ach-provocation' (not even from a preset or a launch): an
// adenosine study must never show the acetylcholine tips. rankCftTips drops the adenosine-specific tips
// (wait and cough for adenosine block, the adenosine RCA dose) while acetylcholine is running, where
// they would give the wrong management. The lab declares the acetylcholine events only once the
// presets are published (anoca.launch.ts ANOCA_LAUNCH_ENABLED: the lab must mount the panel first).
//
// Types only from the tip registry, so the lab bundle does not pull the
// curriculum in with it.
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent, LabTip, TipVessel } from "../../content/lab/tips";
import type { LabRaises } from "../../content/lab/raisable/waiting";
import type { PressureKind } from "../../types";
import type { TipPressureState } from "../../simulation/patient/transducer";
import { EQUALISE_MAX_MM, HYPERAEMIA_PRESETS_LISTED, PHYSIOLOGY_PRESETS, activeSetupEvents, guidePressure, hyperaemia, sessionCase, sessionPreset, MP_REST_H, type PwSessionState } from "../../simulation/pci/pwSession";
import { ANOCA_LAUNCH_ENABLED } from "../../content/lab/presets/physiology/anoca.launch";
import { MP_SPASM_EVENT_CONSTRICTION, achProvocation, activeDose, cftPreset, cftVitals, constrictionNow, type CftState } from "../../simulation/physiology/ach";
import { PATIENT_EVENT_THRESHOLDS, patientEvents, type PatientVitals } from "./patientEvents";
import type { TipsModule } from "./useLabTips";

export interface PhysiologyTipFlags {
  /** the patient events of this update (PatientEventAdapter.update, which keeps the hypotension hold) */
  patientEvents?: readonly LabEvent[];
  /** events a launch added for the whole run */
  extra?: readonly LabEvent[];
}

/** Set-up events the session raises. */
export const PHYSIOLOGY_SETUP_EVENTS: readonly LabEvent[] = ["wire-side-branch", "wire-not-crossing", "pressure-damped"];

/**
 * Patient events the lab's engine produces (patientEvents.ts): adenosine (IV or IC, given to the
 * engine by the rig) draws AV block with its sourced incidence, with the slow rate and the fall in
 * pressure that follow; a patient with a slow resting rate reads bradycardia (PhysiologyLab.test.ts
 * drives the rig to each of these). Nothing in this lab gives the engine ischaemia or desaturation, so
 * those are not declared.
 */
export const PHYSIOLOGY_PATIENT_EVENTS: readonly LabEvent[] = ["hypotension", "bradycardia", "av-block"];

/**
 * The arrhythmias of the engine's adenosine hazard model, which the hyperaemia presets turn on
 * (physiology-hyperaemia-and-adenosine: a dose above 100 µg into the RCA or a dominant circumflex, or
 * a fast push, can bring AF or R-on-T VF; pwSession.setUpPwEngine). physiologyTips.hyperaemia.test.ts
 * drives the engine to each. The lab declares them while the hyperaemia presets are listed
 * (pwSession.HYPERAEMIA_PRESETS_LISTED): its rig runs setUpPwEngine, which turns the model on for them.
 */
export const PHYSIOLOGY_ADENOSINE_EVENTS: readonly LabEvent[] = ["atrial-fibrillation", "vf"];

const VESSELS: readonly string[] = ["LM", "LAD", "LCx", "RCA", "SVG", "LIMA", "RIMA", "radial-graft"];
const PRESSURES: Partial<Record<TipPressureState, PressureKind>> = { aortic: "aortic", damped: "damped", ventricularised: "ventricularised", wedged: "wedged", lv: "lv" };

/** The guide pressure in the tip vocabulary: the session's own reading, or the engine's when it sees worse. */
export function physiologyPressure(session: PwSessionState, vitals?: Pick<PatientVitals, "tipState"> | null): PressureKind {
  const own = guidePressure(session);
  if (own !== "aortic") return PRESSURES[own] ?? "damped";
  const eng = vitals?.tipState;
  if (eng && eng !== "aortic" && PRESSURES[eng]) return PRESSURES[eng]!;
  return "aortic";
}

/** The tip context of a pressure-wire study now. */
export function physiologyTipContext(session: PwSessionState, vitals?: PatientVitals | null, flags: PhysiologyTipFlags = {}): LabContext {
  const preset = sessionPreset(session);
  const pressure = physiologyPressure(session, vitals);
  const events = new Set<LabEvent>(activeSetupEvents(session));
  if (pressure === "damped" || pressure === "wedged") events.add("pressure-damped");
  if (pressure === "ventricularised") events.add("pressure-ventricularised");
  for (const e of preset.events ?? []) events.add(e);
  const pe = flags.patientEvents ?? (vitals ? patientEvents(vitals).events : []);
  for (const e of pe) events.add(e);
  for (const e of flags.extra ?? []) events.add(e);
  // a pressure-wire study gives no acetylcholine, whatever a preset or a launch says
  for (const e of ACH_ONLY_EVENTS) events.delete(e);
  const ctx: LabContext = { lab: "pci", phase: "physiology", pressure, events: [...events] };
  if (VESSELS.includes(preset.case.vessel)) ctx.vessel = preset.case.vessel as TipVessel;
  return ctx;
}

/** Every case property the presets declare (raised for the whole study). */
export const PHYSIOLOGY_PRESET_EVENTS: readonly LabEvent[] = [...new Set(PHYSIOLOGY_PRESETS.flatMap((p) => p.events ?? []))];

// --- the coronary function test (physiology-anoca-cft) ----------------------------------------

/** Events only the acetylcholine test raises (never a pressure-wire study, never adenosine). */
export const ACH_ONLY_EVENTS: readonly LabEvent[] = ["ach-provocation"];

/** What the coronary function test raises: the acetylcholine dose, its slowing and RCA block, spasm and pain. */
export const CFT_EVENTS: readonly LabEvent[] = ["ach-provocation", "bradycardia", "av-block", "coronary-spasm", "chest-pain"];

/** The coronary function test's raises (declared in `raises` once the presets are published). */
export const CFT_RAISES: LabRaises = { lab: "pci", phases: ["physiology"], events: CFT_EVENTS };

/** The events of the coronary function test now. */
export function cftEvents(s: CftState): LabEvent[] {
  const ev: LabEvent[] = [];
  if (achProvocation(s)) ev.push("ach-provocation");
  const v = cftVitals(s);
  if (v.hr < PATIENT_EVENT_THRESHOLDS.bradycardiaHr) ev.push("bradycardia");
  if (v.av === 3) ev.push("av-block");
  if (constrictionNow(s) >= MP_SPASM_EVENT_CONSTRICTION) ev.push("coronary-spasm");
  if (v.pain >= PATIENT_EVENT_THRESHOLDS.chestPainScore) ev.push("chest-pain");
  return ev;
}

/** The tip context of a coronary function test now: the vessel is the one the acetylcholine is going into. */
export function cftTipContext(s: CftState, flags: { extra?: readonly LabEvent[] } = {}): LabContext {
  const events = new Set<LabEvent>(cftEvents(s));
  for (const e of flags.extra ?? []) if (!ACH_ONLY_EVENTS.includes(e)) events.add(e);
  const d = activeDose(s);
  const vessel = d?.side === "right" ? "RCA" : cftPreset(s).case.vessel;
  const ctx: LabContext = { lab: "pci", phase: "physiology", pressure: "aortic", events: [...events] };
  if (VESSELS.includes(vessel)) ctx.vessel = vessel as TipVessel;
  return ctx;
}

/** Tips about adenosine that would give the wrong management during acetylcholine testing. */
export const ADENOSINE_ONLY_TIPS: readonly string[] = ["pci-adenosine-block-cough-wait", "pci-adenosine-rca-dose", "pci-arrest-adenosine-cough", "pci-phys-ic-adenosine-flush"];

/**
 * Order the coronary function test's tips: while acetylcholine is running, the adenosine-only tips go
 * last; the conditions matched decide next, then the microvascular lesson's tips, then registry order.
 */
export function rankCftTips(mod: Pick<TipsModule, "tipScore"> | null, tips: readonly LabTip[], ctx: LabContext, limit = 5): LabTip[] {
  const ach = !!ctx.events?.includes("ach-provocation");
  // during acetylcholine the adenosine-only tips give the wrong management: removed, not just ranked last
  const usable = ach ? tips.filter((tip) => !ADENOSINE_ONLY_TIPS.includes(tip.id)) : tips;
  if (!mod) return usable.slice(0, limit);
  return usable
    .map((tip, i) => {
      const score = mod.tipScore(tip, ctx) ?? -1;
      return { tip, i, cond: Math.floor(score), score, lesson: tip.lessonId === "pm-physiology-microvascular" ? 1 : 0 };
    })
    .sort((a, b) => b.cond - a.cond || b.lesson - a.lesson || b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.tip);
}

/** What the physiology lab (and the PCI lab's pressure-wire console) can report (the reachability report reads this). */
export const raises: LabRaises = {
  lab: "pci",
  phases: ["physiology"],
  events: [
    ...new Set<LabEvent>([
      ...PHYSIOLOGY_SETUP_EVENTS,
      "pressure-ventricularised",
      ...PHYSIOLOGY_PATIENT_EVENTS,
      ...(HYPERAEMIA_PRESETS_LISTED ? PHYSIOLOGY_ADENOSINE_EVENTS : []),
      ...PHYSIOLOGY_PRESET_EVENTS.filter((e) => !ACH_ONLY_EVENTS.includes(e)),
      ...(ANOCA_LAUNCH_ENABLED ? CFT_EVENTS : []),
    ]),
  ],
};

/** The step of the study, for ordering the tips. */
export type PhysiologyStep = "setup" | "measure" | "pullback";

export function physiologyStep(s: PwSessionState): PhysiologyStep {
  if (s.pullback || s.driftCheck || s.records.some((r) => r.kind === "ffr" || r.kind === "rest")) return "pullback";
  // the sensor still within the equalisation window at the guide tip: not yet across the lesion
  if (!s.eq || !s.wireIn || s.sensorMm <= EQUALISE_MAX_MM) return hyperaemia(s) > MP_REST_H ? "measure" : "setup";
  return "measure";
}

/** Lessons whose tips belong to each step (module text: pm-physiology and pm-monitoring). */
export const STEP_LESSONS: Record<PhysiologyStep, readonly string[]> = {
  setup: ["pm-physiology-setup", "pm-monitoring-transducers"],
  measure: ["pm-physiology-indices", "pm-lab-drugs-microvascular", "pm-physiology-when", "pm-physiology-subsets"],
  pullback: ["pm-physiology-pullback", "pm-physiology-after-pci"],
};

/** The lesson on special subsets (aorto-ostial, left main, grafts): its pressure tips are about an ostial lesion. */
const SUBSETS_LESSON = "pm-physiology-subsets";

/** The bail-out tip for a wire that will not equalise: moot once the wire in use equalised cleanly. */
const EQUALISE_FAIL_TIP = "pci-phys-equalise-fail";

/** The wire in use was equalised at the guide tip with superimposed waveforms. */
export function equalisedCleanly(s: PwSessionState): boolean {
  return !!s.eq && s.eq.atTip && !s.eq.mismatch && s.eq.wireId === s.wireId;
}

/**
 * Order matching tips for the panel: the conditions they match first (tipScore without the tone
 * bonus), then the tips of the step's lessons, then the tone bonus and registry order; at most `limit`. `tips` are the candidates (selectTips with a generous limit).
 * A tip of the subsets lesson that matched only on a damped guide pressure (the aorto-ostial advice)
 * goes to the end unless the guide obstructs the ostium in this case: a damped trace from contrast
 * or air in the line, or the introducer, is not an ostial lesion. The will-not-equalise bail-out also
 * goes to the end once the wire in use has equalised cleanly (equalisedCleanly).
 */
export function rankPhysiologyTips(mod: Pick<TipsModule, "tipScore"> | null, tips: readonly LabTip[], ctx: LabContext, session: PwSessionState, limit = 5): LabTip[] {
  if (!mod) return tips.slice(0, limit);
  const lessons = STEP_LESSONS[physiologyStep(session)];
  const ostial = !!sessionCase(session).guideObstructs;
  const equalised = equalisedCleanly(session);
  return tips
    .map((tip, i) => {
      const score = mod.tipScore(tip, ctx) ?? -1;
      const off = (!ostial && tip.lessonId === SUBSETS_LESSON && !!tip.when.pressure?.length) || (equalised && tip.id === EQUALISE_FAIL_TIP) ? 1 : 0;
      // the conditions matched (the integer part; cautions and bailouts add 0.5) decide first
      return { tip, i, off, cond: Math.floor(score), score, step: lessons.includes(tip.lessonId) && !(tip.lessonId === SUBSETS_LESSON && !ostial) ? 1 : 0 };
    })
    .sort((a, b) => a.off - b.off || b.cond - a.cond || b.step - a.step || b.score - a.score || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.tip);
}
