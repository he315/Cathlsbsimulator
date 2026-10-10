// The full case's hypotension and pulmonary oedema scenarios (proc-hypotension-pressors). Each opens
// after the diagnostic run with the catheter in the aorta on the pressure line, and the scenario's
// cause starts as the learner takes the case over (the session module modules/hypotension.ts runs it
// from the shared cause model, src/simulation/patient/hypotensionCauses.ts). The learner confirms the
// pressure is real, finds the mechanism (a right heart read-out is one order away) and treats it
// through the infusion and order section (src/ui/access/orders/Infusions.tsx); nothing on the screen
// names the cause.
//
// What each scenario sets (scenario settings: MODEL PARAMETERS of the scenario unless cited; none is a
// population value; the causes' own settings are MP_CAUSES in hypotensionCauses.ts):
//   hypo-bleeding          a femoral case with a bleed into a hidden space from the start (no
//                          swelling at the puncture): hypovolaemia (Brilakis 28.1);
//   hypo-fasting           a patient fasted and dry on arrival, the deficit of MP_CAUSES: 'poor
//                          hydration after fasting' (Brilakis 28.1; Oxford: a slow IV infusion is
//                          often all that is needed);
//   hypo-ischaemia         an impaired ventricle (LVEF 35%) whose left anterior descending and
//                          circumflex arteries close: ischaemic LV failure (cardiac failure);
//   hypo-tamponade         blood collecting in the pericardium after a femoral case (cardiac failure:
//                          'drain the pericardium');
//   hypo-arrhythmia        complete heart block in an impaired ventricle (LVEF 35%) (cardiac
//                          failure: 'correct the rhythm');
//   hypo-hcm               obstructive hypertrophic cardiomyopathy with vasodilator hypotension after
//                          the radial cocktail (the lesson's check question: phenylephrine, no
//                          inotrope);
//   hypo-pde5-nitrate      a PDE-5 inhibitor taken 8 hours before (within the 24-hour sildenafil window,
//                          pharmacology.ts PDE5_WINDOW_H) and intra-arterial nitrate through the sheath:
//                          drug-induced vasodilation;
//   hypo-verapamil         a patient given the higher intra-arterial verapamil dose
//                          (SOURCED_DOSES.verapamilHighMg): drug-induced vasodilation;
//   hypo-false-transducer  a transducer that has ended up 35 cm above the heart (MP_CAUSES): the
//                          line reads low while the patient is well (pci-mon-false-hypotension);
//   oedema-lvedp-high      an impaired ventricle (LVEF 30%) with a raised filling pressure (a central
//                          volume given before the learner takes over, MODEL PARAMETER), told at
//                          handover as the LVEDP the engine shows: a fluid bolus brings on pulmonary
//                          oedema (cm-flow-embolism-oedema-cholesterol).
// Each has a fixed seed and an elective indication, so the drill is the same each time it is opened.
import type { ProcedureScenario } from "./index";
import type { CaseSession } from "../caseSession";
import type { EmergenciesModule } from "../modules/emergencies";
import type { HypotensionModule } from "../modules/hypotension";
import { makeObstructiveHcm, type HypotensionEnginePort } from "../../patient/hypotensionCauses";

const PRESSORS = "pm-lab-drugs-pressors";
const OEDEMA = "cm-flow-embolism-oedema-cholesterol";
const MONITORING = "pm-monitoring-pressure";
const TAMPONADE = "cm-perforation-tamponade";

/** oedema-lvedp-high: the central volume that raises the filling pressure before the learner takes over (mL; MODEL PARAMETER). */
const OEDEMA_PRELOAD_ML = 470;
/** ... and the time it is given to settle (s). */
const OEDEMA_SETTLE_S = 90;

const hypo = (s: CaseSession) => s.mod<HypotensionModule>("hypotension");
const emergencies = (s: CaseSession) => s.mod<EmergenciesModule>("emergencies");
const port = (s: CaseSession) => s.patient as unknown as HypotensionEnginePort;

/**
 * The scenario's start state: the learner has the case from here (what the autopilot's steps left
 * open is not scored by the emergencies module), then `then` runs and the cause starts.
 */
const takeOver =
  (causeId: string | null, then?: (s: CaseSession) => void) =>
  (s: CaseSession): void => {
    emergencies(s)?.actions.learnerControl();
    then?.(s);
    if (causeId) hypo(s)?.actions.startCause(causeId);
    else hypo(s)?.actions.learnerControl();
  };

/** A patient with no reaction, no anticoagulant and sinus rhythm, so the low pressure is the only problem. */
const CLEAN = { anticoagulation: "none" as const, allergies: { contrast: "none" as const, other: [] }, rhythm: "sinus" as const };

const base = (id: string, title: string, lessonIds: string[], o: Partial<ProcedureScenario>): ProcedureScenario => ({
  id,
  title,
  lessonIds,
  seed: id,
  access: "radial-right",
  indication: "SA",
  start: "post-diagnostic",
  ...o,
});

export const scenarios: ProcedureScenario[] = [
  base("hypo-bleeding", "The pressure falls after the angiogram", [PRESSORS, OEDEMA], {
    access: "femoral",
    profile: { ...CLEAN, sex: "F", ageY: 74 },
    state: takeOver("bleeding"),
  }),
  base("hypo-fasting", "Low pressure in a patient who has not eaten or drunk", [PRESSORS, OEDEMA], {
    profile: { ...CLEAN, sex: "F", ageY: 81 },
    script: [{ at: "arrival", log: { kind: "nurse", text: "Handover: nil by mouth since last night and no drip so far." } }],
    state: takeOver("fasting"),
  }),
  base("hypo-ischaemia", "Chest pain and a falling pressure", [PRESSORS, OEDEMA], {
    profile: { ...CLEAN, sex: "M", ageY: 66, lvef: 35 },
    state: takeOver("ischaemia"),
  }),
  base("hypo-tamponade", "Low pressure and a fast pulse after a femoral case", [PRESSORS, TAMPONADE], {
    access: "femoral",
    profile: { ...CLEAN, sex: "F", ageY: 70 },
    state: takeOver("tamponade"),
  }),
  base("hypo-arrhythmia", "A slow pulse and a low pressure", [PRESSORS], {
    // a seed with a lower resting pressure, so the slow rate takes the mean below 65
    seed: "hypo-arrhythmia-29",
    profile: { ...CLEAN, sex: "M", ageY: 77, lvef: 35 },
    state: takeOver("arrhythmia"),
  }),
  base("hypo-hcm", "Low pressure after the radial cocktail", [PRESSORS], {
    profile: { ...CLEAN, sex: "M", ageY: 52, lvef: 65 },
    chart: { history: "Hypertrophic obstructive cardiomyopathy, followed in clinic; exertional chest pain." },
    state: takeOver("hcm-vasodilator", (s) => {
      makeObstructiveHcm(port(s));
    }),
  }),
  base("hypo-pde5-nitrate", "Low pressure after the nitrate", [PRESSORS], {
    profile: { ...CLEAN, sex: "M", ageY: 58, pde5: { agent: "sildenafil", hoursAgo: 8 } },
    state: takeOver("gtn-pde5", (s) => {
      s.order("gtn");
      s.runPending();
    }),
  }),
  base("hypo-verapamil", "Low pressure after more verapamil", [PRESSORS], {
    profile: { ...CLEAN, sex: "F", ageY: 69 },
    state: takeOver("verapamil", (s) => {
      s.order("verapamil-high");
      s.runPending();
    }),
  }),
  base("hypo-false-transducer", "The monitor shows a low pressure", [PRESSORS, MONITORING], {
    // a seed whose resting pressure sits where the offset takes the line below 65 mean
    seed: "hypo-false-transducer-28",
    profile: { ...CLEAN },
    state: takeOver("transducer-high"),
  }),
  base("oedema-lvedp-high", "A weak ventricle and a high filling pressure", [OEDEMA], {
    profile: { ...CLEAN, sex: "M", ageY: 72, lvef: 30 },
    state: takeOver(null, (s) => {
      port(s).fluid?.(OEDEMA_PRELOAD_ML, 30);
      s.wait(OEDEMA_SETTLE_S, "Settling");
      s.runPending();
      const lvedp = Math.round(s.patient.vitals().lvedp);
      s.log.push({ t: Math.round(s.tS * 10) / 10, kind: "nurse", text: `Handover: the LVEDP on the left heart pressure was ${lvedp} mmHg.` });
    }),
  }),
];
