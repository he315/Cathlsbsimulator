// ---------------------------------------------------------------------------
// The haemodynamics lab's tip context (haemo-study-session-and-tips).
//
// haemoTipContext(study) reports what the study is doing now, in the shared
// tip vocabulary (src/content/lab/tips.ts):
//   phase   setup before any catheter; right-heart with the right heart
//           catheter anywhere from RA to wedge; left-heart with the pigtail in
//           the aortic root or LV; valves for a simultaneous LV + aortic or
//           LV + wedge recording in a valve study; shunts during a saturation
//           run; calculations while the calculation panel is open
//           (studyPhase in src/simulation/haemoStudy.ts)
//   events  the scenario's own condition (HaemoScenario.events: aortic-stenosis,
//           mitral-stenosis, hocm, constriction, restriction, tamponade,
//           pulmonary-embolism, pulmonary-hypertension, atrial-shunt,
//           ventricular-shunt, cardiogenic-shock), events a launch or a later
//           package raised for the study, and hypotension once a low mean
//           arterial pressure is on the screen. The torque-directed right heart
//           catheter (haemo-rhc-manoeuvre, src/simulation/rightHeartCatheter.ts,
//           driven from src/ui/haemo/CatheterPanel.tsx) raises its events on the
//           study with the study's 'raise' action: engage-fail after 45 s
//           without progress (only while the left heart catheter is out),
//           catheter-kink when torque does not reach the tip, catheter-knot,
//           vt, atrial-fibrillation and hypotension (lasting VT, AF with severe
//           compromise)
//   catheter PIG for an angiographic pigtail
//   pressure lv or aortic for the pressure on the pigtail
//
// `raises` (below) is what this lab can report; the reachability report
// (src/content/lab/reachability.test.ts) reads it. Later haemodynamic packages
// export their own from their event sources.
//
// Types only from the tip registry, so the lab bundle does not pull the
// curriculum in with it.
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent } from "../../content/lab/tips";
import type { LabRaises } from "../../content/lab/raisable/waiting";
import { HAEMO_SCENARIOS } from "../../simulation/haemo";
import { HAEMO_DYNAMIC_EVENTS, HAEMO_STUDY_PHASES, studyCatheter, studyEvents, studyPhase, type HaemoStudyState } from "../../simulation/haemoStudy";
import { RHC_EVENTS } from "../../simulation/rightHeartCatheter";

/** The tip context of a study now. */
export function haemoTipContext(study: HaemoStudyState): LabContext {
  const { phase, phases } = studyPhase(study);
  const ctx: LabContext = { lab: "haemo", phase, events: studyEvents(study) };
  if (phases.length) ctx.phases = phases;
  const catheter = studyCatheter(study);
  if (catheter) ctx.catheter = catheter;
  if (study.lhc === "LV") ctx.pressure = "lv";
  else if (study.lhc === "Ao") ctx.pressure = "aortic";
  return ctx;
}

/** Every scenario event the library declares (raised for the whole study). */
export const HAEMO_SCENARIO_EVENTS: readonly LabEvent[] = [...new Set(HAEMO_SCENARIOS.flatMap((s) => s.events ?? []))];

/** What the haemodynamics lab can report (the reachability report reads this). */
export const raises: LabRaises = {
  lab: "haemo",
  phases: HAEMO_STUDY_PHASES,
  events: [...new Set<LabEvent>([...HAEMO_SCENARIO_EVENTS, ...HAEMO_DYNAMIC_EVENTS, ...RHC_EVENTS])],
};
