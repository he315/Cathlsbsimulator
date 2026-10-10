// The full case's forearm haematoma scenarios (access-cx-forearm): the forearm haematoma graded and treated by its
// grade, and compartment syndrome escalated at once, as lesson cm-access-complications-radial-bleeding teaches it
// (src/content/manual/complication-management/06-access-complications.ts: the chart Brilakis reproduces from
// Bertrand, :633-647; the cuff, :623-627; Oxford's compartment syndrome table, :694-703), with the traction case of
// pm-engaging-spasm (lab request pm-engaging#4: a sheath pulled out through spasm, then a forearm haematoma graded and
// managed). The session module modules/forearm.ts runs the haematoma; the card is in RecoveryPanel.tsx.
//
// Every scenario opens at 'recovery': the autopilot has done a right radial diagnostic study with clean technique and
// put the band on with patent haemostasis; the learner writes the ward plan and has the patient. Nothing in the title
// or on the screen names the grade.
//
// What each scenario sets (scenario settings: MODEL PARAMETERS of the scenario, none a population value). 'Initial' is
// the blood already in the forearm when it begins; the rate is the source's own rate before the ACT, an infusion, the
// pressure and the measures act on it (src/simulation/access/forearm.ts).
//   forearm-grade-1        a small swelling at the wrist above the band (initial 8 mL, 0.25 mL/min, stopping on its
//                          own at 14 mL: grade I throughout), found by looking or by the nurse's site check;
//   forearm-grade-3        the nurse calls: the forearm has swollen above the band (initial 110 mL, about 13.5 cm from
//                          the puncture, below the elbow: grade III; 2.5 mL/min), which the cuff, ice and the band
//                          stop within minutes and which goes on to the elbow and beyond untreated;
//   forearm-grade-4        after PCI with cangrelor still running (30 µg/kg then 4 µg/kg/min, pci-manual/
//                          03-antithrombotics.ts:1017): the swelling reaches above the elbow (initial 370 mL, 1.2 mL/min
//                          before the infusion's effect), so the infusion is stopped among the measures;
//   forearm-compartment    a large forearm haematoma below the elbow (initial 300 mL, 3 mL/min) in a small woman (Oxford's
//                          risk factors: female sex, small body size, :699) whose compartment signs appear 3 minutes
//                          after the nurse's call: then only the surgical call is right, and further compression wrong;
//   forearm-after-traction the team pulled a sheath gripped by spasm out against resistance (the handover says so): a
//                          fast forearm bleed (initial 40 mL, 10 mL/min; the closure model's avulsion bleeds 12-25 mL/min,
//                          closure.ts MP_RADIAL_CLOSURE) that the patient reports once it is large, and that reaches
//                          compartment syndrome if the measures are late.
// Each has a fixed seed, so the drill is the same each time it is opened.
import type { ProcedureScenario } from "./index";
import type { CaseSession } from "../caseSession";
import type { EmergenciesModule } from "../modules/emergencies";
import type { ForearmConfig, ForearmModule } from "../modules/forearm";
import type { LabReport, ReportedStent } from "../handover";

const RADIAL_BLEEDING = "cm-access-complications-radial-bleeding";
const SPASM = "pm-engaging-spasm";

/** No anticoagulant, no contrast allergy, sinus rhythm: nothing in the chart competes with the drill. */
const CLEAN = { anticoagulation: "none" as const, allergies: { contrast: "none" as const, other: [] }, rhythm: "sinus" as const };

/** Cangrelor: 30 µg/kg IV bolus, then 4 µg/kg/min (pci-manual/03-antithrombotics.ts:1017). */
const CANGRELOR = { bolusUgKg: 30, infusionUgKgMin: 4 };

/** The team's PCI stent in forearm-grade-4 (a generic platform; nominal sizes as a scenario setting). */
const LAD_STENT: ReportedStent = { vessel: "LAD", segment: null, diameterMm: 3, lengthMm: 18, platform: "Drug-eluting stent", maxAtm: 14, postDilated: true };

const emergencies = (s: CaseSession) => s.mod<EmergenciesModule>("emergencies");
const forearm = (s: CaseSession) => s.mod<ForearmModule>("forearm");

type DrugPort = {
  give(o: { drug: string; dose: number; route: string }): void;
  startInfusion?(o: { drug: string; rate: number }): void;
};
const drugs = (s: CaseSession) => s.patient as unknown as DrugPort;

/** A lab report from the team's lab (contrast mL, fluoroscopy min; scenario settings). */
function report(lab: LabReport["lab"], o: { stents?: ReportedStent[]; contrastMl: number; fluoroMin: number; durationMin: number }): LabReport {
  return {
    lab,
    stents: o.stents ?? [],
    finalTimi: o.stents?.length ? 3 : null,
    complications: [],
    contrastMl: o.contrastMl,
    // no dose figures: the drill does not use them (scenario setting)
    dose: { fluoroS: o.fluoroMin * 60, karMGy: 0, kapGyCm2: 0 },
    durationS: o.durationMin * 60,
    residual: [],
  };
}

/** The learner has the patient on the ward from here; the haematoma begins `onsetAfterMin` later. */
const onWard =
  (cfg: ForearmConfig, o: { handover?: string; reports?: LabReport[]; then?: (s: CaseSession) => void } = {}) =>
  (s: CaseSession): void => {
    emergencies(s)?.actions.learnerControl();
    for (const r of o.reports ?? []) s.teamLabReport(r);
    o.then?.(s);
    if (o.handover) s.logEntry("nurse", o.handover);
    const m = forearm(s);
    m?.actions.configure(cfg);
    m?.actions.learnerControl();
  };

const onTheWard = { access: "radial-right" as const, start: "recovery" as const, indication: "SA" as const };

export const scenarios: ProcedureScenario[] = [
  {
    id: "forearm-grade-1",
    title: "On the ward after a radial case: the wrist",
    lessonIds: [RADIAL_BLEEDING, SPASM],
    seed: "forearm-grade-1",
    ...onTheWard,
    profile: { ...CLEAN, sex: "F", ageY: 64 },
    state: onWard({ initialMl: 8, sourceMlMin: 0.25, capMl: 14, onsetAfterMin: 2 }, { handover: "Handover from the lab: right radial diagnostic study, band on with the pleth kept." }),
  },
  {
    id: "forearm-grade-3",
    title: "On the ward after a radial case: the forearm (1)",
    lessonIds: [RADIAL_BLEEDING, SPASM],
    seed: "forearm-grade-3",
    ...onTheWard,
    profile: { ...CLEAN, sex: "M", ageY: 67 },
    state: onWard(
      { initialMl: 110, sourceMlMin: 2.5, onsetAfterMin: 1, report: "The nurse calls: the forearm has swollen above the band and the patient says it aches." },
      { handover: "Handover from the lab: right radial diagnostic study, band on with the pleth kept." }
    ),
  },
  {
    id: "forearm-grade-4",
    title: "On the ward after a radial PCI: the arm",
    lessonIds: [RADIAL_BLEEDING, SPASM],
    seed: "forearm-grade-4",
    ...onTheWard,
    profile: { ...CLEAN, sex: "M", ageY: 71 },
    state: onWard(
      { initialMl: 370, sourceMlMin: 1.2, onsetAfterMin: 1, infusion: "cangrelor", report: "The nurse calls: the swelling of the arm now reaches above the elbow." },
      {
        handover: "Handover from the lab: PCI to the LAD with a drug-eluting stent through the right radial artery; cangrelor running since the start; band on.",
        reports: [report("angio-pci", { stents: [LAD_STENT], contrastMl: 160, fluoroMin: 14, durationMin: 50 })],
        then: (s) => {
          const kg = s.profile.weightKg;
          drugs(s).give({ drug: "cangrelor", dose: CANGRELOR.bolusUgKg * kg, route: "iv" });
          drugs(s).startInfusion?.({ drug: "cangrelor", rate: CANGRELOR.infusionUgKgMin });
        },
      }
    ),
  },
  {
    id: "forearm-compartment",
    title: "On the ward after a radial case: the forearm (2)",
    lessonIds: [RADIAL_BLEEDING],
    seed: "forearm-compartment",
    ...onTheWard,
    profile: { ...CLEAN, sex: "F", ageY: 78, heightCm: 152, weightKg: 48 },
    state: onWard(
      { initialMl: 300, sourceMlMin: 3, onsetAfterMin: 1, compartmentAfterMin: 3, report: "The nurse calls: the forearm is swollen and tight, and the patient is in a lot of pain." },
      { handover: "Handover from the lab: right radial diagnostic study, band on." }
    ),
  },
  {
    id: "forearm-after-traction",
    title: "On the ward after a difficult sheath removal",
    lessonIds: [SPASM, RADIAL_BLEEDING],
    seed: "forearm-after-traction",
    ...onTheWard,
    profile: { ...CLEAN, sex: "F", ageY: 58, heightCm: 158, weightKg: 55 },
    state: onWard(
      { initialMl: 40, sourceMlMin: 10, onsetAfterMin: 2 },
      { handover: "Handover from the lab: right radial diagnostic study; the sheath was gripped by spasm at the end and was pulled out against resistance; band on." }
    ),
  },
];
