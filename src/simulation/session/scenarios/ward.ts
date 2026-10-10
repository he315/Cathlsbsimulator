// The full case's recovery ward scenarios (proc-recovery-ward): the ward as lesson hb-after-the-procedure-monitoring
// teaches it (src/content/manual/cath-handbook/09-after-the-procedure.ts: the arrival steps, the schedule table at
// :311-315, mobilisation at :345-350 and 'Recognising trouble after the case' at :365-373), the recovery observations of
// pm-monitoring-watch, the late stroke of cm-flow-embolism-stroke, the stroke on the table of pm-to-the-root-advance
// and cholesterol embolisation at follow-up (cm-flow-embolism-oedema-cholesterol).
//
// Every ward scenario but the stroke on the table opens at 'recovery': the autopilot has done the case with clean
// technique and closed the site (a patent radial band, or manual femoral compression once the ACT allowed it). The
// start state then records what the team's labs reported (teamLabReport: the PCI's stent, contrast and dose; the
// diagnostic lab's wireless exchanges), and the scenario's delayed events (closure.ts DelayedKind) begin at their
// time after closure. The learner writes the ward plan and runs the ward. The stroke on the table opens at
// 'post-diagnostic' with the catheter at the root and its lumen unflushed (the team's: clot has formed in it), so a
// flush before aspirating sends the clot into the aorta and, in this scenario, a stroke follows.
//
// What each scenario sets (scenario settings: MODEL PARAMETERS of the scenario unless cited):
//   ward-radial                      a radial PCI with one stent and a contrast load over the patient's ceiling; a dull
//                                    chest ache 50 min into the ward with no new ECG change (chest pain after a stent is
//                                    answered with an ECG first whatever it turns out to be, 09-after-the-procedure.ts :368);
//   ward-femoral-6f                  a 6 Fr femoral diagnostic study closed by manual compression: the femoral plan
//                                    (flat 1 hour, walking from 2 1/2 hours, groin and distal pulses every 15 minutes);
//   ward-forearm-haematoma           a radial diagnostic study; a forearm bleed from 20 min after closure, which grows
//                                    until it is found and compressed;
//   ward-chest-pain-post-pci         a radial PCI with one stent; 40 min into the ward the stented vessel occludes (the
//                                    engine's ischaemia, pain and ST elevation follow);
//   ward-tamponade-after-perforation a radial PCI whose perforation was sealed in the lab; blood collects in the pericardium
//                                    from 15 min after closure, 3 mL/min up to 140 mL (the engine's tamponade: the
//                                    systolic is still above 100 mmHg at the 45 min set and below it at the 60 min set);
//   ward-stroke-late                 a radial diagnostic study; a homonymous visual field loss 150 min after closure ('hours
//                                    after the study through late embolisation', 09-after-the-procedure.ts :372);
//   ward-creatinine-rise             chronic kidney disease and a large contrast load; a creatinine rise at the 48-72 hour
//                                    review over both definitions the lesson gives (44 µmol/L, Oxford; 26.5 µmol/L or 1.5 times
//                                    baseline, KDIGO via ESUR 2018: 09-after-the-procedure.ts :373);
//   table-embolic-stroke             the catheter left at the root unflushed; a flush without aspiration sends the clot on
//                                    and an embolic stroke follows (06-to-the-root.ts :1352-1357);
//   followup-cholesterol-emboli      a diseased aorta in which catheters were exchanged without a wire: the review three
//                                    weeks later (02-flow-embolism.ts :770-797).
// Every scenario has a fixed seed, so the drill is the same each time it is opened.
import type { ProcedureScenario, ScenarioDelayed } from "./index";
import type { CaseSession } from "../caseSession";
import type { EmergenciesModule } from "../modules/emergencies";
import type { LabReport, ReportedStent } from "../handover";

const MONITORING = "hb-after-the-procedure-monitoring";
const WATCH = "pm-monitoring-watch";
const STROKE = "cm-flow-embolism-stroke";
const CHOLESTEROL = "cm-flow-embolism-oedema-cholesterol";
const TO_THE_ROOT = "pm-to-the-root-advance";

/** No anticoagulant, no contrast allergy, sinus rhythm: nothing in the chart competes with the drill. */
const CLEAN = { anticoagulation: "none" as const, allergies: { contrast: "none" as const, other: [] }, rhythm: "sinus" as const };

/** The team's PCI stent (a generic platform; nominal sizes as a scenario setting). */
const LAD_STENT: ReportedStent = { vessel: "LAD", segment: null, diameterMm: 3, lengthMm: 18, platform: "Drug-eluting stent", maxAtm: 14, postDilated: true };

/**
 * MODEL PARAMETERS (scenario settings): the air kerma and kerma-area product the team's run books per minute of
 * fluoroscopy, so a team report carries a plausible dose with its time (no source; they set only the case totals).
 */
const DOSE_PER_FLUORO_MIN = { karMGy: 25, kapGyCm2: 3 };

/** A lab report from the team's lab (contrast mL, fluoroscopy min; scenario settings). */
function report(lab: LabReport["lab"], o: { stents?: ReportedStent[]; contrastMl: number; fluoroMin: number; durationMin: number; wirelessExchanges?: number; complications?: LabReport["complications"] }): LabReport {
  return {
    lab,
    stents: o.stents ?? [],
    finalTimi: o.stents?.length ? 3 : null,
    complications: o.complications ?? [],
    contrastMl: o.contrastMl,
    dose: { fluoroS: o.fluoroMin * 60, karMGy: o.fluoroMin * DOSE_PER_FLUORO_MIN.karMGy, kapGyCm2: o.fluoroMin * DOSE_PER_FLUORO_MIN.kapGyCm2 },
    durationS: o.durationMin * 60,
    residual: [],
    ...(o.wirelessExchanges !== undefined ? { wirelessExchanges: o.wirelessExchanges } : {}),
  };
}

const emergencies = (s: CaseSession) => s.mod<EmergenciesModule>("emergencies");

/** The learner has the case from here, after the team's labs (and anything else the team did). */
const onWard =
  (reports: LabReport[], then?: (s: CaseSession) => void) =>
  (s: CaseSession): void => {
    emergencies(s)?.actions.learnerControl();
    for (const r of reports) s.teamLabReport(r);
    then?.(s);
  };

/** The PCI the team did in the PCI scenarios: one LAD stent (contrast as a scenario setting). */
const teamPci = (contrastMl: number, extra: Partial<Parameters<typeof report>[1]> = {}) => report("angio-pci", { stents: [LAD_STENT], contrastMl, fluoroMin: 14, durationMin: 50, ...extra });

/** ward-creatinine-rise: the creatinine before the procedure and at 48 hours (µmol/L; scenario settings). */
const CREATININE_BEFORE = 160;
const CREATININE_48H = 218;

const delayed = (d: ScenarioDelayed): ScenarioDelayed[] => [d];

export const scenarios: ProcedureScenario[] = [
  {
    id: "ward-radial",
    title: "On the ward after a radial case (1)",
    lessonIds: [MONITORING, WATCH, STROKE],
    // a seed whose patient has a resting pulse and pressure in the normal range (another drew a resting bradycardia)
    seed: "ward-radial-c",
    indication: "SA",
    access: "radial-right",
    start: "recovery",
    profile: { ...CLEAN, sex: "M", ageY: 68, weightKg: 72, creatinineUmolL: 140 },
    delayed: delayed({
      kind: "chest-pain-post-pci",
      afterMin: 50,
      report: "The patient calls the nurse: a dull ache across the front of his chest since he lay back.",
      finding: "A dull central chest ache on the ward.",
      severity: "minor",
    }),
    state: onWard([teamPci(240)]),
  },
  {
    id: "ward-femoral-6f",
    title: "On the ward after a femoral case",
    lessonIds: [MONITORING, WATCH, STROKE],
    seed: "ward-femoral-6f",
    indication: "SA",
    access: "femoral",
    start: "recovery",
    profile: { ...CLEAN, sex: "F", ageY: 64 },
    state: onWard([report("cathlab", { contrastMl: 60, fluoroMin: 4, durationMin: 20 })]),
  },
  {
    id: "ward-forearm-haematoma",
    title: "On the ward after a radial case (2)",
    lessonIds: [MONITORING, WATCH, STROKE],
    seed: "ward-forearm-haematoma",
    indication: "SA",
    access: "radial-right",
    start: "recovery",
    profile: { ...CLEAN, sex: "F", ageY: 59 },
    delayed: delayed({
      kind: "forearm-haematoma",
      afterMin: 20,
      bleedMlMin: 1.2,
      totalMl: 150,
      report: "A swelling of the forearm above the band.",
      finding: "A forearm swelling above the band.",
      severity: "minor",
    }),
    state: onWard([report("cathlab", { contrastMl: 70, fluoroMin: 5, durationMin: 25 })]),
  },
  {
    id: "ward-chest-pain-post-pci",
    title: "On the ward after a stent (1)",
    lessonIds: [MONITORING, WATCH],
    seed: "ward-chest-pain-post-pci",
    indication: "SA",
    access: "radial-right",
    start: "recovery",
    profile: { ...CLEAN, sex: "M", ageY: 61 },
    delayed: delayed({
      kind: "chest-pain-post-pci",
      afterMin: 40,
      report: "The patient calls the nurse: a heavy pain in the centre of his chest, like the one he came in with.",
      finding: "Central chest pain on the ward after the stent.",
      severity: "major",
    }),
    state: onWard([teamPci(180)]),
  },
  {
    id: "ward-tamponade-after-perforation",
    title: "On the ward after a stent (2)",
    lessonIds: [MONITORING],
    seed: "ward-tamponade-after-perforation",
    indication: "SA",
    access: "radial-right",
    start: "recovery",
    profile: { ...CLEAN, sex: "F", ageY: 72 },
    delayed: delayed({ kind: "tamponade", afterMin: 15, bleedMlMin: 3, totalMl: 140, report: "", finding: "Blood collecting in the pericardium.", severity: "major" }),
    state: onWard([
      teamPci(200, {
        complications: [{ id: "coronary-perforation", label: "Distal wire perforation, sealed in the lab", t: 0, severity: "major", events: ["perforation"], resolved: true }],
      }),
    ]),
  },
  {
    id: "ward-stroke-late",
    title: "On the ward after a radial case (3)",
    lessonIds: [STROKE, MONITORING],
    seed: "ward-stroke-late",
    indication: "SA",
    access: "radial-right",
    start: "recovery",
    profile: { ...CLEAN, sex: "M", ageY: 74 },
    delayed: delayed({
      kind: "stroke",
      afterMin: 150,
      report: "The patient tells the nurse that everything to his left has gone dark, in both eyes.",
      finding: "A new loss of the left half of the visual field in both eyes.",
      severity: "major",
    }),
    state: onWard([report("cathlab", { contrastMl: 80, fluoroMin: 6, durationMin: 30 })]),
  },
  {
    id: "ward-creatinine-rise",
    title: "After a long case: the review",
    lessonIds: [MONITORING],
    seed: "ward-creatinine-rise",
    indication: "SA",
    access: "radial-right",
    start: "recovery",
    profile: { ...CLEAN, sex: "M", ageY: 77, weightKg: 70, creatinineUmolL: CREATININE_BEFORE },
    delayed: delayed({
      kind: "creatinine-rise",
      afterMin: 48 * 60,
      report: "The 48-hour bloods are back.",
      finding: `Creatinine at 48 hours: ${CREATININE_48H} µmol/L (before the procedure ${CREATININE_BEFORE} µmol/L).`,
      severity: "minor",
    }),
    state: onWard([teamPci(260)]),
  },
  {
    id: "table-embolic-stroke",
    title: "Back at the root after the films",
    lessonIds: [TO_THE_ROOT, STROKE],
    seed: "table-embolic-stroke",
    indication: "SA",
    access: "radial-right",
    start: "post-diagnostic",
    profile: { ...CLEAN, sex: "F", ageY: 69 },
    state: (s) => {
      emergencies(s)?.actions.learnerControl();
      s.ward.scriptTableStroke();
      s.teamLeftCatheterUnflushed();
    },
  },
  {
    id: "followup-cholesterol-emboli",
    title: "Follow-up: painful feet",
    lessonIds: [CHOLESTEROL],
    seed: "followup-cholesterol-emboli",
    indication: "SA",
    access: "femoral",
    start: "recovery",
    profile: { ...CLEAN, sex: "M", ageY: 74 },
    state: onWard([report("cathlab", { contrastMl: 90, fluoroMin: 7, durationMin: 35, wirelessExchanges: 2 })], (s) => {
      s.ward.aortaDiseased = true;
      s.ward.scriptCholesterol();
    }),
  },
];
