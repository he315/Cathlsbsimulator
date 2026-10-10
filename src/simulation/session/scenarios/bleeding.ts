// The full case's retroperitoneal bleed scenarios (access-cx-bleeding-retroperitoneal): the lessons
// cm-access-complications-femoral-bleeding (complication-management/06-access-complications.ts: 'Suspecting it'
// and Brilakis Fig. 29.4) and cm-patient-complications-bleeding (05-patient-complications.ts: reversal, the
// retroperitoneal bleed, antiplatelet therapy after it). The session module modules/bleeding.ts runs the bleed;
// the orders are src/ui/access/orders/Bleeding.tsx. The case presents the signs (sweating, back or low abdominal
// pain, a falling pressure, a soft groin) a minute after the learner takes over; nothing names the bleed.
//
// What each scenario sets (scenario settings: MODEL PARAMETERS of the scenario unless cited; none is a population
// value). 'Initial' is the blood already behind the peritoneum when the signs appear (a retroperitoneal bleed is
// found late); the rate is the whole-blood loss while it bleeds untreated.
//   rp-on-table          still on the table after a diagnostic study through a high femoral puncture (the
//                        team's entry above the lowest point of the inferior epigastric artery, as
//                        closure-fem-high-stick), contrast on board: a large-vessel bleed from the external
//                        iliac artery (initial 1100 mL, 60 mL/min); bladder, the other groin, balloon, covered stent;
//   rp-no-bleed-found    on the table, the same high puncture: a haematoma that has stopped bleeding (initial
//                        600 mL, a last 200 mL slowly): the bladder is dented, the angiogram shows no bleeding
//                        point, so conservative management under the general measures;
//   rp-cangrelor         on the table after PCI to the circumflex for an NSTEMI with a cangrelor infusion still
//                        running (30 µg/kg then 4 µg/kg/min, pci-manual/03-antithrombotics.ts:1017) and aspirin, in
//                        a 71-year-old woman with a BMI of about 37 and a high puncture, with a slow pulse (the
//                        module's case cm-access-complications-case-retroperitoneal: 'HR 52 bpm'): stop the
//                        infusion, reverse heparin after the diagnosis, and the oral P2Y12 plan once controlled
//                        (initial 1000 mL, 55 mL/min; vagal level 0.5 for 300 s, as rp-recovery-unstable). The
//                        case's uncontrolled hypertension at the puncture is not set: the scenario has no such start;
//   rp-recovery-unstable in recovery after a femoral case: a small-branch bleed (the inferior epigastric artery;
//                        initial 1300 mL, 60 mL/min) with a slow pulse (a vagal component, 'bradycardia is common'):
//                        unstable, so straight back to the laboratory, not CT;
//   rp-recovery-stable   in recovery: a haematoma that has stopped (initial 350 mL, a last 150 mL slowly): stable,
//                        so CT, which shows no extravasation: conservative;
//   rp-ticagrelor        in recovery after PCI for unstable angina on aspirin and ticagrelor (180 mg load, pci-manual/
//                        03-antithrombotics.ts:730): a large-vessel bleed (initial 1200 mL, 50 mL/min); platelets
//                        may fail with ticagrelor; de-escalate to clopidogrel rather than stop dual therapy;
//   rp-doac-dabigatran   in recovery, a man in atrial fibrillation on dabigatran (last dose 8 hours before):
//                        a small-branch bleed (initial 1000 mL, 45 mL/min); idarucizumab (EHRA 2021, in the lesson);
//   rp-doac-apixaban     in recovery, a woman in atrial fibrillation on apixaban (last dose 10 hours before): a
//                        haematoma that has stopped (initial 400 mL, a last 200 mL slowly), stable: CT; andexanet
//                        alfa or prothrombin complex concentrate if the bleeding threatens life.
// The on-table cases carry the contrast of the team's study (90 mL, 150 mL after PCI) so the bladder is
// opacified; the recovery cases are past the point where the bladder can be screened. Each has a fixed seed.
import type { ProcedureScenario } from "./index";
import type { CaseSession } from "../caseSession";
import type { EmergenciesModule } from "../modules/emergencies";
import type { BleedConfig, BleedingModule } from "../modules/bleeding";

const ACCESS = "cm-access-complications-femoral-bleeding";
const BLEED = "cm-patient-complications-bleeding";
const IV = "pm-antithrombotics-iv";

/** The standard groin of the closure scenarios (fem-normal's), and the high-stick inferior epigastric artery and entry. */
const GROIN = { ligamentX: 66, headX: 30, bifurcationX: -4 };
const HIGH_IEA_X = 48;
const HIGH_ENTRY_X = 52;

/** Cangrelor: 30 µg/kg IV bolus, then 4 µg/kg/min (pci-manual/03-antithrombotics.ts:1017). */
const CANGRELOR = { bolusUgKg: 30, infusionUgKgMin: 4 };
/** Aspirin 300 mg load (Oxford) and ticagrelor 180 mg load (pci-manual/03-antithrombotics.ts:709, 730). */
const ASPIRIN_LOAD_MG = 300;
const TICAGRELOR_LOAD_MG = 180;

const bleeding = (s: CaseSession) => s.mod<BleedingModule>("bleeding");
const emergencies = (s: CaseSession) => s.mod<EmergenciesModule>("emergencies");

type DrugPort = {
  give(o: { drug: string; dose: number; route: string }): void;
  startInfusion?(o: { drug: string; rate: number }): void;
};
const drugs = (s: CaseSession) => s.patient as unknown as DrugPort;

/** The learner has the case from here; the bleed is configured and presents `onsetAfterMin` later. */
const takeOver =
  (cfg: BleedConfig, then?: (s: CaseSession) => void) =>
  (s: CaseSession): void => {
    emergencies(s)?.actions.learnerControl();
    then?.(s);
    const m = bleeding(s);
    m?.actions.configure(cfg);
    m?.actions.learnerControl();
  };

/** The team's puncture moved above the lowest point of the inferior epigastric artery (the sheath stays where it is). */
const highEntry = (s: CaseSession) => void s.relocateTeamPuncture({ x: HIGH_ENTRY_X });

const onTable = { access: "femoral" as const, start: "closure" as const, site: { ...GROIN, ieaOriginX: HIGH_IEA_X } };
const inRecovery = { access: "femoral" as const, start: "recovery" as const, site: GROIN };
/** A patient with no reaction and no anticoagulant, so the bleed is the only problem. */
const CLEAN = { anticoagulation: "none" as const, allergies: { contrast: "none" as const, other: [] } };

const TABLE_REPORT = "She says her lower back aches and she feels sick; she is pale, clammy and sweating.";
const RECOVERY_REPORT = "Recovery nurse: he is sweating and says he has a low backache; his last cuff pressure was lower than before.";

export const scenarios: ProcedureScenario[] = [
  {
    id: "rp-on-table",
    title: "Back pain and a falling pressure on the table",
    lessonIds: [ACCESS, BLEED],
    seed: "rp-on-table",
    indication: "SA",
    ...onTable,
    profile: { ...CLEAN, sex: "F", ageY: 72, heightCm: 160, weightKg: 62, rhythm: "sinus" },
    state: takeOver({ source: "large-vessel", initialMl: 1100, rateMlMin: 60, totalMl: 2600, onsetAfterMin: 1, teamContrastMl: 90, report: TABLE_REPORT }, highEntry),
  },
  {
    id: "rp-no-bleed-found",
    title: "A falling pressure on the table (2)",
    lessonIds: [ACCESS, BLEED],
    seed: "rp-no-bleed-found",
    indication: "SA",
    ...onTable,
    profile: { ...CLEAN, sex: "M", ageY: 68, rhythm: "sinus" },
    state: takeOver({ source: "haematoma-no-active", initialMl: 600, rateMlMin: 20, totalMl: 200, onsetAfterMin: 1, teamContrastMl: 90, report: "He says his back aches and he feels faint; he is sweating." }, highEntry),
  },
  {
    id: "rp-cangrelor",
    title: "A falling pressure at the end of a PCI",
    lessonIds: [ACCESS, BLEED, IV],
    seed: "rp-cangrelor",
    indication: "NSTEMI",
    ...onTable,
    profile: { ...CLEAN, sex: "F", ageY: 71, heightCm: 158, weightKg: 92, rhythm: "sinus" },
    script: [{ at: "arrival", log: { kind: "nurse", text: "Handover: PCI to the circumflex with a drug-eluting stent; cangrelor running since the start, aspirin given; the guide and wire are out." } }],
    state: takeOver({ source: "large-vessel", initialMl: 1000, rateMlMin: 55, totalMl: 2600, onsetAfterMin: 1, teamContrastMl: 150, p2y12: "cangrelor", aspirin: true, vagal: { level: 0.5, holdS: 300 }, report: TABLE_REPORT }, (s) => {
      highEntry(s);
      const kg = s.profile.weightKg;
      drugs(s).give({ drug: "aspirin", dose: ASPIRIN_LOAD_MG, route: "oral" });
      drugs(s).give({ drug: "cangrelor", dose: CANGRELOR.bolusUgKg * kg, route: "iv" });
      drugs(s).startInfusion?.({ drug: "cangrelor", rate: CANGRELOR.infusionUgKgMin });
    }),
  },
  {
    id: "rp-recovery-unstable",
    title: "Recovery: back pain and a slow pulse",
    lessonIds: [ACCESS, BLEED],
    seed: "rp-recovery-unstable",
    indication: "SA",
    ...inRecovery,
    profile: { ...CLEAN, sex: "M", ageY: 64, rhythm: "sinus" },
    state: takeOver({ source: "small-branch", initialMl: 1300, rateMlMin: 60, totalMl: 2800, onsetAfterMin: 1, vagal: { level: 0.5, holdS: 300 }, report: RECOVERY_REPORT }),
  },
  {
    id: "rp-recovery-stable",
    title: "Recovery: a backache after a femoral case",
    lessonIds: [ACCESS, BLEED],
    seed: "rp-recovery-stable",
    indication: "SA",
    ...inRecovery,
    profile: { ...CLEAN, sex: "F", ageY: 70, rhythm: "sinus" },
    state: takeOver({ source: "haematoma-no-active", initialMl: 350, rateMlMin: 10, totalMl: 150, onsetAfterMin: 1, report: "Recovery nurse: she has a dull ache low in her back and looks a little pale; the cuff pressure is a bit lower than at arrival." }),
  },
  {
    id: "rp-ticagrelor",
    title: "Recovery after PCI: a falling pressure",
    lessonIds: [BLEED],
    seed: "rp-ticagrelor",
    indication: "UA",
    ...inRecovery,
    profile: { ...CLEAN, sex: "M", ageY: 59, rhythm: "sinus" },
    script: [{ at: "arrival", log: { kind: "nurse", text: "Handover: PCI to the RCA with a drug-eluting stent; aspirin and ticagrelor loaded before the case." } }],
    state: takeOver({ source: "large-vessel", initialMl: 1200, rateMlMin: 50, totalMl: 2600, onsetAfterMin: 1, p2y12: "ticagrelor", aspirin: true, report: RECOVERY_REPORT }, (s) => {
      drugs(s).give({ drug: "aspirin", dose: ASPIRIN_LOAD_MG, route: "oral" });
      drugs(s).give({ drug: "ticagrelor", dose: TICAGRELOR_LOAD_MG, route: "oral" });
    }),
  },
  {
    id: "rp-doac-dabigatran",
    title: "Recovery: a falling pressure in a patient on an anticoagulant (1)",
    lessonIds: [BLEED],
    seed: "rp-doac-dabigatran",
    indication: "SA",
    ...inRecovery,
    profile: { allergies: { contrast: "none", other: [] }, sex: "M", ageY: 76, rhythm: "af", doac: { agent: "dabigatran", hoursSinceDose: 8 } },
    state: takeOver({ source: "small-branch", initialMl: 1000, rateMlMin: 45, totalMl: 2400, onsetAfterMin: 1, report: RECOVERY_REPORT }),
  },
  {
    id: "rp-doac-apixaban",
    title: "Recovery: a falling pressure in a patient on an anticoagulant (2)",
    lessonIds: [BLEED],
    seed: "rp-doac-apixaban",
    indication: "SA",
    ...inRecovery,
    profile: { allergies: { contrast: "none", other: [] }, sex: "F", ageY: 79, rhythm: "af", doac: { agent: "apixaban", hoursSinceDose: 10 } },
    state: takeOver({ source: "haematoma-no-active", initialMl: 400, rateMlMin: 12, totalMl: 200, onsetAfterMin: 1, report: "Recovery nurse: she has a backache and feels sick; the cuff pressure is a little lower than at arrival." }),
  },
];
