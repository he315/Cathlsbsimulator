// The full case's radial access scenarios (access-radial-sequence): Brilakis's radial sequence (4.3) as the
// lessons teach it (pm-access-radial-puncture, steps 1-5, and pm-access-radial-sheath, steps 6-10), with the
// forearm complications of cm-access-complications-radial-bleeding and the heparin timing of
// pm-antithrombotics-heparin. The patient presets are those of lab request pm-access#4 (normal radial, small
// radial, younger anxious patient, LIMA graft requiring the left radial, a patient unable to supinate), with
// the bleb, the loop, the extremely tortuous arm and the forced perforation of the other requests.
//
// What each scenario sets (scenario settings, MODEL PARAMETERS of the scenario unless cited; none is a
// population value):
//   radial-normal          a 64-year-old man with a 2.7 mm radial artery and little anxiety: the textbook
//                          wrist. Ready to puncture with the local anaesthetic left to the learner, so the
//                          volume is theirs (about 1 mL after aspirating; Brilakis 4.3, step 4);
//   radial-small           a 1.8 mm radial artery in a small woman: hard to enter and prone to spasm ('A small
//                          artery is hard to enter and prone to spasm', pm-access-radial-puncture, step 3);
//   radial-anxious-young   a very anxious 31-year-old woman with a 2.2 mm artery: younger patients, women and
//                          anxiety are spasm risk factors (the lesson's 'Spasm at the puncture' table), and
//                          sedation is its prevention;
//   radial-lima-left       a LIMA graft: the left radial (pm-access-radial-puncture, step 2: 'Use it when the
//                          patient has a patent LIMA graft'); the team has left the arm at the side with the
//                          wrist resting, so it has to be brought across the abdomen and the wrist extended;
//   radial-no-supination   a forearm that cannot be turned palm up: the wrist is not the route (the distal
//                          radial or the femoral artery);
//   radial-bleb            the team has infiltrated 4 mL at the wrist (the lesson's check question): the artery
//                          is flat for a minute or two; wait or move along it (step 4);
//   radial-loop            a tight radial loop at the radial-brachial junction that no 0.035 inch wire crosses:
//                          image the forearm resistance, then balloon-assisted tracking (tip
//                          access-cx-radial-loop-bat); opens with the sheath in;
//   radial-tortuous-extreme the previous report called the subclavian route extremely tortuous: the heparin
//                          may be held until the catheter reaches the aortic root (Brilakis 4.3, in
//                          pm-access-radial-sheath steps 9-10); a loop that opens to an aimed wire and a
//                          tortuous subclavian;
//   radial-forced-perforation a hydrophilic wire forced against a tight loop has perforated the forearm artery
//                          (the team's start state): keep the wire, image, cross, and cover the hole with the
//                          catheter, which seals it in this scripted run (tip access-cx-radial-perforation-cover).
// Every scenario is an elective case for stable angina with a fixed seed, so the drill is the same each time.
import type { ProcedureScenario } from "./index";
import type { CaseSession } from "../caseSession";

const PUNCTURE = "pm-access-radial-puncture";
const SHEATH = "pm-access-radial-sheath";
const SPASM = "pm-engaging-spasm";
const HEPARIN = "pm-antithrombotics-heparin";
const FOREARM = "cm-access-complications-radial-bleeding";

/** No anticoagulant, no contrast allergy, sinus rhythm: nothing in the chart competes with the drill. */
const CLEAN = { anticoagulation: "none" as const, allergies: { contrast: "none" as const }, rhythm: "sinus" as const };

const ELECTIVE = { indication: "SA" as const, access: "radial-right" as const };

/** radial-bleb: what the team infiltrated at the wrist (mL): the lesson's check question ('After 4 mL of lidocaine around the wrist'). */
const TEAM_BLEB_ML = 4;

/** The team's 4 mL, just given at the probe over the artery. */
function teamBleb(s: CaseSession): void {
  s.runPending();
  s.giveLocal(TEAM_BLEB_ML, { aspirate: true, byTeam: true });
  s.runPending();
}

/**
 * radial-forced-perforation's start state: the catheter in over a hydrophilic wire, the wire forced against the tight
 * loop until it perforated (a fixed seed, so the same push each time), left where it stopped.
 */
function forcedPerforation(s: CaseSession): void {
  s.runPending();
  s.setWireKind("hydrophilic");
  s.prepCatheter("TIG");
  s.runPending();
  if (!s.loadCatheter("TIG")) return;
  s.beamOn = true;
  s.tipImaged = true;
  for (let i = 0; i < 2000 && !s.wire.perforation; i++) {
    s.commandWire(1.2, 0);
    s.commandCatheter(1.2);
    s.tick(0.033);
  }
  s.runPending();
  s.beamOn = false;
  // the perforation and the wire's position are the team's; the seal over the catheter holds in this run
  s.scriptRadial({ perforationIsTeams: true, sealOutcome: "seal" });
}

export const scenarios: ProcedureScenario[] = [
  {
    id: "radial-normal",
    title: "Radial puncture: the standard wrist",
    lessonIds: [PUNCTURE, SHEATH, SPASM],
    seed: "radial-normal",
    ...ELECTIVE,
    start: "access",
    profile: { ...CLEAN, sex: "M", ageY: 64, heightCm: 176, weightKg: 82, radialDiamMm: 2.7, anxiety: 0.3 },
    chart: { history: "No previous arterial access." },
    site: { localByOperator: true },
  },
  {
    id: "radial-small",
    title: "Radial puncture: a small radial artery",
    lessonIds: [PUNCTURE, SHEATH, SPASM],
    seed: "radial-small",
    ...ELECTIVE,
    start: "access",
    profile: { ...CLEAN, sex: "F", ageY: 58, heightCm: 154, weightKg: 55, radialDiamMm: 1.8, anxiety: 0.45 },
    chart: { history: "No previous arterial access." },
    site: { localByOperator: true },
  },
  {
    id: "radial-anxious-young",
    title: "Radial puncture: a young, anxious patient",
    lessonIds: [PUNCTURE, SHEATH, SPASM],
    seed: "radial-anxious",
    ...ELECTIVE,
    start: "access",
    profile: { ...CLEAN, sex: "F", ageY: 31, heightCm: 163, weightKg: 60, radialDiamMm: 2.2, anxiety: 0.95 },
    chart: { history: "Very anxious about the procedure; asked twice whether she will be awake. No previous arterial access." },
    site: { localByOperator: true },
  },
  {
    id: "radial-lima-left",
    title: "Left radial puncture for a LIMA graft",
    lessonIds: [PUNCTURE],
    seed: "radial-lima-left",
    indication: "SA",
    access: "radial-left",
    start: "access",
    profile: { ...CLEAN, sex: "M", ageY: 71, heightCm: 172, weightKg: 84, radialDiamMm: 2.6, anxiety: 0.35 },
    chart: { history: "CABG 9 years ago: left internal mammary artery to the LAD and a vein graft to the right coronary artery. No arterial access since." },
    site: { localByOperator: true, armPosition: "supinated", wristFlexed: true },
  },
  {
    id: "radial-no-supination",
    title: "Radial access: a forearm that will not turn",
    lessonIds: [PUNCTURE],
    seed: "radial-no-supination",
    ...ELECTIVE,
    start: "access",
    profile: { ...CLEAN, sex: "F", ageY: 69, heightCm: 160, weightKg: 66, radialDiamMm: 2.4, anxiety: 0.4 },
    chart: { history: "Rheumatoid arthritis with fixed deformity of both elbows and forearms: she cannot turn either hand palm up. No previous arterial access." },
    site: { localByOperator: true, cannotSupinate: true },
  },
  {
    id: "radial-bleb",
    title: "Radial puncture: a large bleb of local anaesthetic",
    lessonIds: [PUNCTURE],
    seed: "radial-bleb",
    ...ELECTIVE,
    start: "access",
    profile: { ...CLEAN, sex: "M", ageY: 62, heightCm: 178, weightKg: 85, radialDiamMm: 2.6, anxiety: 0.35 },
    chart: { history: "No previous arterial access." },
    site: { localByOperator: true },
    state: teamBleb,
  },
  {
    id: "radial-loop",
    title: "Radial access: the wire stops in the forearm",
    lessonIds: [SHEATH, FOREARM],
    seed: "radial-loop",
    ...ELECTIVE,
    start: "sheath-in",
    variants: ["radial-loop"],
    profile: { ...CLEAN, sex: "F", ageY: 66, heightCm: 158, weightKg: 62, radialDiamMm: 2.4, anxiety: 0.35 },
    chart: { history: "No previous arterial access." },
    site: { tightLoop: true },
  },
  {
    id: "radial-tortuous-extreme",
    title: "Radial access in an extremely tortuous arm: when to give the heparin",
    lessonIds: [HEPARIN, SHEATH],
    seed: "radial-tortuous",
    ...ELECTIVE,
    start: "access",
    variants: ["radial-loop", "tortuous-subclavian"],
    profile: { ...CLEAN, sex: "F", ageY: 77, heightCm: 157, weightKg: 61, radialDiamMm: 2.5, anxiety: 0.35 },
    chart: { history: "Right radial angiography 3 years ago: extreme tortuosity of the right subclavian artery; the catheter reached the aortic root only after several attempts." },
    site: { extremeTortuosity: true },
    // the previous report is known from the start: a case property every lab's tips see
    script: [{ at: "arrival", events: ["subclavian-tortuosity"] }],
  },
  {
    id: "radial-forced-perforation",
    title: "Radial access: a perforation in the forearm",
    lessonIds: [FOREARM],
    seed: "radial-perforation",
    ...ELECTIVE,
    start: "sheath-in",
    variants: ["radial-loop"],
    profile: { ...CLEAN, sex: "M", ageY: 70, heightCm: 170, weightKg: 78, radialDiamMm: 2.5, anxiety: 0.35 },
    chart: { history: "No previous arterial access." },
    site: { tightLoop: true },
    state: forcedPerforation,
  },
];
