// The full case's emergency scenarios (proc-anaphylaxis-vagal): contrast anaphylaxis in an at-risk
// patient and its pre-arrest presentation, the vasovagal reaction at sheath removal with its
// prevention, and the tamponade look-alike. The learner treats each through the emergency orders
// (src/ui/access/orders/Emergency.tsx, the session module modules/emergencies.ts); nothing on the
// screen names the reaction.
//
// What each scenario sets (scenario settings: MODEL PARAMETERS of the scenario unless cited; none is
// a population value). The reaction and the vagal episode are forced through the engine
// (engine.forceReaction, engine.forceVagal), so the random reaction draw of a random case is never
// touched.
//   anaphylaxis-asthmatic        a woman with asthma and hay fever (asthma and atopy: Oxford's
//                                highest-risk groups, pm-lab-drugs-contrast-reactions), opened after
//                                the angiogram with the first left coronary run given (8 mL); a severe
//                                reaction begins 2 minutes later ('usually within 15 minutes of the
//                                first injection', Oxford, the same lesson's table);
//   anaphylaxis-prearrest-brady  the late presentation: the reaction begins as the case opens and,
//                                as it deepens, the rate falls with the skin and airway signs present
//                                ('bradycardia in anaphylaxis is usually a late sign, often just
//                                before cardiac arrest', RCUK 2021 in the same table), so the rate
//                                alone cannot call it vagal;
//   vagal-mimic                  a young, anxious man (cm-patient-complications-vasovagal: 'young
//                                anxious men most often') at femoral sheath removal: a vasovagal
//                                reaction is scripted at the pull, with the cuff cycling every minute;
//   vagal-no-local               a very vagal, anxious patient opened at the chart: the local
//                                anaesthetic (as a dose, with its time to work) and saline before
//                                removal decide how often the vagal reaction comes (the removal draw
//                                is armed for these two drills only, so a random case is unchanged);
//   vagal-removal-no-saline      the same patient type opened with the femoral sheath in for removal:
//                                saline running and atropine or fluid ready before the pull;
//   tamponade-mimic              hypotension at femoral sheath removal after a case with a temporary
//                                pacing wire (Oxford's history for tamponade, cm-patient-complications-
//                                vasovagal 'The mimics'): blood collects in the pericardium from the
//                                pull (0.5 mL/s, stopping at 155 mL), with a fast rate and no response
//                                to atropine.
// The scenarios that open past the chart call the module's learnerControl in their start state, so an
// episode the autopilot's own steps brought on (a puncture faint in a vagal patient) is not scored.
// Each has a fixed seed and an elective indication, so the drill is the same each time it is opened.
import type { ProcedureScenario } from "./index";
import type { CaseSession } from "../caseSession";
import type { EmergenciesModule } from "../modules/emergencies";
import { cycleCuff, scriptPericardialBleed, scriptReaction, scriptVagal } from "../emergencies";

const REACTIONS = "pm-lab-drugs-contrast-reactions";
const VAGAL = "cm-patient-complications-vasovagal";
const TAMPONADE = "cm-perforation-tamponade";

/** The first left coronary run of the angiogram, mL (scenario setting). */
const FIRST_RUN_ML = 8;
/** anaphylaxis-asthmatic: the reaction begins this long after the first run, s (within Oxford's 15 minutes). */
const ASTHMATIC_ONSET_S = 120;
/** tamponade-mimic: blood into the pericardium from the pull, mL/s (scenario setting). */
const TAMPONADE_ML_S = 0.5;
/**
 * tamponade-mimic: the bleed stops once the effusion holds this much, mL (scenario setting; MODEL
 * PARAMETER): a large effusion with a low pressure and a fast rate that waits for the learner, not one
 * that runs on to no output while the compression's time-lapse plays.
 */
const TAMPONADE_CAP_ML = 155;

const emergencies = (s: CaseSession) => s.mod<EmergenciesModule>("emergencies");

/**
 * The scenario's start state: the learner has the case from here (what the autopilot's steps left
 * open is not scored), then `then` sets the scenario's problem.
 */
const takeOver =
  (then?: (s: CaseSession) => void) =>
  (s: CaseSession): void => {
    emergencies(s)?.actions.learnerControl();
    then?.(s);
  };

/**
 * The first left coronary run given by the scenario (the reaction's trigger): on the case's contrast
 * total and in the record, as the angiogram's own runs would be.
 */
const firstRun = (s: CaseSession): void => {
  s.totals = { ...s.totals, contrastMl: s.totals.contrastMl + FIRST_RUN_ML };
  s.log.push({ t: Math.round(s.tS * 10) / 10, kind: "event", text: `First left coronary run: ${FIRST_RUN_ML} mL of contrast (${Math.round(s.totals.contrastMl)} mL so far).` });
};

/** The prevention drills: the sheath-removal vagal draw and its scoring are armed for the case (modules/emergencies.ts). */
const ARM_REMOVAL = { at: "arrival", run: (s: CaseSession) => emergencies(s)?.actions.armRemovalDrill() };

/** A patient with no reaction, no anticoagulant and sinus rhythm, so the emergency is the only problem. */
const CLEAN = { anticoagulation: "none" as const, allergies: { contrast: "none" as const, other: [] }, rhythm: "sinus" as const };

export const scenarios: ProcedureScenario[] = [
  {
    id: "anaphylaxis-asthmatic",
    title: "Unwell after the first injection",
    lessonIds: [REACTIONS, VAGAL, TAMPONADE],
    seed: "anaphylaxis-asthmatic",
    access: "radial-right",
    indication: "SA",
    start: "post-diagnostic",
    profile: { ...CLEAN, sex: "F", ageY: 46, anxiety: 0.5 },
    chart: { allergies: "No known contrast reaction. Asthma since childhood, on an inhaled steroid; hay fever." },
    state: takeOver((s) => {
      if (scriptReaction(s, "severe", ASTHMATIC_ONSET_S, FIRST_RUN_ML)) firstRun(s);
    }),
  },
  {
    id: "anaphylaxis-prearrest-brady",
    title: "Unwell after the angiogram: a slow pulse",
    lessonIds: [REACTIONS, VAGAL, TAMPONADE],
    seed: "anaphylaxis-prearrest-brady",
    access: "radial-right",
    indication: "SA",
    start: "post-diagnostic",
    profile: { ...CLEAN, sex: "M", ageY: 63, allergies: { contrast: "previous-mild", other: [] } },
    state: takeOver((s) => {
      if (scriptReaction(s, "severe", 0, FIRST_RUN_ML, { preArrest: true })) firstRun(s);
    }),
  },
  {
    id: "vagal-mimic",
    title: "Unwell at sheath removal",
    lessonIds: [REACTIONS, VAGAL, TAMPONADE],
    seed: "vagal-mimic",
    access: "femoral",
    indication: "SA",
    start: "closure",
    profile: { ...CLEAN, sex: "M", ageY: 32, anxiety: 0.85, vagalTone: 0.9 },
    state: takeOver(),
    script: [
      {
        at: "sheath-pull",
        run: (s) => {
          cycleCuff(s, 1);
          scriptVagal(s);
        },
      },
    ],
  },
  {
    id: "vagal-no-local",
    title: "A nervous patient: puncture to sheath removal",
    lessonIds: [VAGAL],
    seed: "vagal-no-local",
    access: "femoral",
    indication: "SA",
    start: "chart",
    profile: { ...CLEAN, sex: "M", ageY: 38, anxiety: 0.85, vagalTone: 0.9 },
    script: [ARM_REMOVAL],
  },
  {
    id: "vagal-removal-no-saline",
    title: "Femoral sheath removal in a nervous patient",
    lessonIds: [VAGAL],
    seed: "vagal-removal-no-saline",
    access: "femoral",
    indication: "SA",
    start: "closure",
    profile: { ...CLEAN, sex: "M", ageY: 36, anxiety: 0.85, vagalTone: 0.9 },
    state: takeOver(),
    script: [ARM_REMOVAL],
  },
  {
    id: "tamponade-mimic",
    title: "Hypotension at sheath removal after a pacing wire",
    lessonIds: [VAGAL, TAMPONADE],
    seed: "tamponade-mimic",
    access: "femoral",
    indication: "SA",
    start: "closure",
    profile: { ...CLEAN, sex: "F", ageY: 71 },
    state: takeOver(),
    script: [
      { at: "arrival", log: { kind: "nurse", text: "Handover: a temporary pacing wire was placed through the right femoral vein during this case and has been taken out." } },
      {
        at: "sheath-pull",
        run: (s) => {
          cycleCuff(s, 1);
          if (scriptPericardialBleed(s, TAMPONADE_ML_S)) emergencies(s)?.actions.capPericardium(TAMPONADE_CAP_ML);
        },
      },
    ],
  },
];
