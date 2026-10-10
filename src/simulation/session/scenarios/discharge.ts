// The full case's discharge prescription scenarios (proc-discharge-prescription): the antiplatelet plan at
// discharge as lesson hb-after-the-procedure-dapt teaches it (src/content/manual/cath-handbook/
// 09-after-the-procedure.ts) and the P2Y12 choice of pm-antithrombotics-oral (src/content/manual/pci-manual/
// 03-antithrombotics.ts). Each opens at 'recovery': the team has done the PCI with clean technique and closed the
// radial site, and the start state records the team's PCI report (its stents, contrast and dose), so the learner
// has the case from the discharge prescription (the Discharge workspace). The team's PCI treated the patient's own
// lesion (the culprit of an acute coronary syndrome, else the tightest lesion): the reported stents are in that
// vessel, the engine's network takes the lesion as stented (setCoronaryTree, as the PCI lab's sync does) and the
// ischaemia of the presentation is over (the infarct the engine has grown is kept), so the patient on the ward is
// reperfused and at rest, not in ongoing ischaemia. The case facts the prescription reads
// (bloods, history, the anticoagulant, planned surgery, the follow-up) are DISCHARGE_CASES in ../discharge.ts; the
// patient's age, sex, weight and creatinine are set here, so the eGFR on the chart is the profile's.
//
// What each scenario sets (scenario settings: MODEL PARAMETERS of the scenario unless cited):
//   dapt-stable          stable angina, one LAD stent, no bleeding risk criterion; nosebleeds at the 12-day follow-up;
//   dapt-acs             NSTEMI, one stent, no bleeding risk criterion (prasugrel or ticagrelor, 12 months);
//   dapt-hbr-one-major   the lesson's check (09-after-the-procedure.ts:521): a 68-year-old woman after NSTEMI with an
//                        eGFR about 26 and haemoglobin 12.4 g/dL (one major criterion; the Hb is not minor in a woman);
//   dapt-hbr-two-minor   a 77-year-old man after elective PCI with an eGFR about 52: age and the kidneys, two minor
//                        criteria;
//   dapt-af-acs          the lesson's check (:567): a 72-year-old man on apixaban for atrial fibrillation after NSTEMI,
//                        ischaemic risk not unusually high;
//   dapt-af-ischaemic    a man on rivaroxaban for atrial fibrillation after a STEMI with a previous stent
//                        thrombosis and two long overlapping stents (ischaemic risk dominates: triple therapy up to a month);
//   dapt-surgery-planned elective PCI in a woman listed for a hip replacement in 4 months.
// The ACS scenarios set a left ventricular ejection fraction (ACS_LVEF): the generated NSTEMI patients drew a severely
// impaired ventricle, which the discharge prescription does not turn on and which the case facts do not mention.
// Every scenario has a fixed seed, so the drill is the same each time it is opened; the seeds of dapt-acs,
// dapt-hbr-one-major, dapt-af-acs and dapt-hbr-two-minor were chosen for a resting pulse in the normal range (the
// first draws had a resting sinus tachycardia, or a sinus bradycardia, that the prescription does not turn on).
import type { ProcedureScenario } from "./index";
import type { CaseSession } from "../caseSession";
import type { EmergenciesModule } from "../modules/emergencies";
import type { LabReport, ReportedStent } from "../handover";
import type { PatientEngine } from "../../patient/engine";
import type { Lesion, VesselId } from "../../../types";

const DAPT = "hb-after-the-procedure-dapt";
const ORAL = "pm-antithrombotics-oral";

/**
 * No contrast allergy, sinus rhythm, no anticoagulant unless the scenario sets one, and a radial artery the team's
 * sheath fits (2.8 mm: a scenario setting, MODEL PARAMETER), so the attending has no sheath to criticise in a case
 * the team ran with clean technique.
 */
const CLEAN = { anticoagulation: "none" as const, allergies: { contrast: "none" as const, other: [] }, rhythm: "sinus" as const, radialDiamMm: 2.8 };

/** The team's stents (generic platform; nominal sizes as scenario settings). The vessel written here is used only without the engine: the start state puts the stents in the vessel the team treated (afterPci). */
const stent = (vessel: ReportedStent["vessel"], diameterMm: number, lengthMm: number): ReportedStent => ({ vessel, segment: null, diameterMm, lengthMm, platform: "Drug-eluting stent", maxAtm: 16, postDilated: true });

/** MODEL PARAMETERS (scenario settings): the air kerma and kerma-area product per minute of fluoroscopy of the team's run. */
const DOSE_PER_FLUORO_MIN = { karMGy: 25, kapGyCm2: 3 };

/** The team's PCI report (contrast mL, fluoroscopy min: scenario settings). */
function teamPci(stents: ReportedStent[], contrastMl = 150, fluoroMin = 12): LabReport {
  return {
    lab: "angio-pci",
    stents,
    finalTimi: 3,
    complications: [],
    contrastMl,
    dose: { fluoroS: fluoroMin * 60, karMGy: fluoroMin * DOSE_PER_FLUORO_MIN.karMGy, kapGyCm2: fluoroMin * DOSE_PER_FLUORO_MIN.kapGyCm2 },
    durationS: 45 * 60,
    residual: [],
  };
}

/**
 * MODEL PARAMETERS (scenario settings): the stented lesion's diameter stenosis after the team's PCI (%; the report has
 * no residual stenosis and TIMI 3 flow) and the ejection fraction of the ACS scenarios' patients (%).
 */
const STENTED_RESIDUAL_PCT = 0;
const ACS_LVEF = 55;
/**
 * MODEL PARAMETER (scenario setting): the team's time on the ward before the learner takes the case (s). It is longer
 * than a transient tip event's hold (TRANSIENT_HOLD_S, src/ui/lab/eventLog.ts), so what the monitor read during the
 * team's PCI has gone by the time the learner looks.
 */
const TEAM_SETTLE_S = 60;

/** The lesion the team's PCI treated: the acute culprit (a thrombotic lesion) if there is one, else the tightest. */
export function treatedLesionIndex(lesions: readonly Lesion[]): number {
  let best = -1;
  lesions.forEach((l, i) => {
    if (best < 0) return void (best = i);
    const b = lesions[best];
    const lt = l.kind === "thrombotic";
    const bt = b.kind === "thrombotic";
    if ((lt && !bt) || (lt === bt && l.severity > b.severity)) best = i;
  });
  return best;
}

/** The engine behind the session's patient port (the full case's PatientEngine; absent for another port). */
function engineOf(s: CaseSession): PatientEngine | null {
  const p = s.patient as Partial<PatientEngine>;
  return typeof p.setCoronaryTree === "function" && Array.isArray(p.lesions) && p.resp ? (p as PatientEngine) : null;
}

/**
 * The team's PCI on the patient: the treated lesion (and, for an acute syndrome, every thrombotic lesion) taken as
 * stented in the engine's network, and the ischaemia of the presentation ended in every region (the necrosis the
 * engine has grown is kept: the infarct stays). Returns the treated vessel, which the report's stents take.
 */
function reperfuse(s: CaseSession): VesselId | null {
  const eng = engineOf(s);
  if (!eng || !eng.lesions.length) return null;
  const k = treatedLesionIndex(eng.lesions);
  const vessel = eng.lesions[k].vessel;
  const treated = eng.lesions.map((l, i) => (i === k || l.kind === "thrombotic" ? { ...l, kind: "mild-irregularity" as const, severity: STENTED_RESIDUAL_PCT } : { ...l }));
  // the default network (the full case's engine has no rendered tree): as the PCI lab's sync, occlusions kept
  eng.setCoronaryTree(null, treated, { keepOcclusions: true });
  const st = eng.resp.st;
  for (let r = 0; r < eng.resp.regionCount; r++) eng.resp.preload(r, 0, -1, st.necro[r] ?? 0, 0);
  return vessel;
}

/** The learner has the case from the discharge prescription, after the team's PCI (its stents in the treated vessel). */
const afterPci =
  (report: LabReport) =>
  (s: CaseSession): void => {
    s.mod<EmergenciesModule>("emergencies")?.actions.learnerControl();
    const vessel = reperfuse(s);
    s.teamLabReport(vessel ? { ...report, stents: report.stents.map((x) => ({ ...x, vessel })) } : report);
    s.wait(TEAM_SETTLE_S, "The team settles the patient on the ward");
    s.runPending();
  };

const LAD = [stent("LAD", 3, 18)];

export const scenarios: ProcedureScenario[] = [
  {
    id: "dapt-stable",
    title: "Discharge after elective PCI (1)",
    lessonIds: [DAPT, ORAL],
    seed: "dapt-stable",
    indication: "SA",
    access: "radial-right",
    start: "recovery",
    profile: { ...CLEAN, sex: "M", ageY: 62, weightKg: 80, creatinineUmolL: 85 },
    state: afterPci(teamPci(LAD)),
  },
  {
    id: "dapt-acs",
    title: "Discharge after PCI for NSTEMI (1)",
    lessonIds: [DAPT, ORAL],
    seed: "dapt-acs-i",
    indication: "NSTEMI",
    access: "radial-right",
    start: "recovery",
    profile: { ...CLEAN, sex: "M", ageY: 58, weightKg: 84, creatinineUmolL: 80, lvef: ACS_LVEF },
    state: afterPci(teamPci([stent("RCA", 3.5, 22)])),
  },
  {
    id: "dapt-hbr-one-major",
    title: "Discharge after PCI for NSTEMI (2)",
    lessonIds: [DAPT, ORAL],
    seed: "dapt-hbr-one-major-j",
    indication: "NSTEMI",
    access: "radial-right",
    start: "recovery",
    profile: { ...CLEAN, sex: "F", ageY: 68, weightKg: 66, creatinineUmolL: 185, lvef: ACS_LVEF },
    state: afterPci(teamPci([stent("LCx", 2.75, 15)], 90)),
  },
  {
    id: "dapt-hbr-two-minor",
    title: "Discharge after elective PCI (2)",
    lessonIds: [DAPT],
    seed: "dapt-hbr-two-minor-g",
    indication: "SA",
    access: "radial-right",
    start: "recovery",
    profile: { ...CLEAN, sex: "M", ageY: 77, weightKg: 74, creatinineUmolL: 124 },
    state: afterPci(teamPci(LAD, 110)),
  },
  {
    id: "dapt-af-acs",
    title: "Discharge on an anticoagulant (1)",
    lessonIds: [DAPT, ORAL],
    seed: "dapt-af-acs-h",
    indication: "NSTEMI",
    access: "radial-right",
    start: "recovery",
    profile: { ...CLEAN, sex: "M", ageY: 72, weightKg: 82, creatinineUmolL: 95, lvef: ACS_LVEF, rhythm: "af", anticoagulation: "doac", doac: { agent: "apixaban", hoursSinceDose: 36 } },
    chart: { anticoag: "Apixaban 5 mg twice daily for atrial fibrillation; held before the procedure." },
    state: afterPci(teamPci([stent("RCA", 3, 24)])),
  },
  {
    id: "dapt-af-ischaemic",
    title: "Discharge on an anticoagulant (2)",
    lessonIds: [DAPT],
    seed: "dapt-af-ischaemic",
    indication: "STEMI",
    access: "radial-right",
    start: "recovery",
    profile: { ...CLEAN, sex: "M", ageY: 66, weightKg: 90, creatinineUmolL: 88, rhythm: "af", anticoagulation: "doac", doac: { agent: "rivaroxaban", hoursSinceDose: 30 } },
    chart: { anticoag: "Rivaroxaban 20 mg once daily for atrial fibrillation; held before the procedure." },
    state: afterPci(teamPci([stent("LAD", 3, 38), stent("LAD", 3.5, 28)], 220, 20)),
  },
  {
    id: "dapt-surgery-planned",
    title: "Discharge with an operation planned",
    lessonIds: [DAPT],
    seed: "dapt-surgery-planned",
    indication: "SA",
    access: "radial-right",
    start: "recovery",
    profile: { ...CLEAN, sex: "F", ageY: 66, weightKg: 70, creatinineUmolL: 75 },
    state: afterPci(teamPci([stent("RCA", 3, 18)], 120)),
  },
];
