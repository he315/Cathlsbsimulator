// The full case's crossover scenario (access-multi-site): a radial case in a patient already given
// heparin, opened at fluoroscopy with the wire stopped in the forearm. It does not pass whatever the
// operator does, so the case goes on through a second access site: the femoral artery, punctured with
// ultrasound and fluoroscopy because the patient is anticoagulated (Brilakis 4.1; Oxford ch 3,
// 'Anticoagulation issues', as cited by the tip access-crossover-anticoagulated-care), and both sites
// are closed in turn, the femoral sheath only once the ACT has fallen (access-femoral-sheath-act).
//
// Scenario settings, all MODEL PARAMETERS (none is a population value):
//   - an elective case (stable angina), so the case can wait out the ACT before the femoral
//     sheath comes out without an acute coronary syndrome running its own course;
//   - the radial-loop variant, with the loop made impassable (CaseSession.obstructRoute);
//   - the autopilot's sheath-in stage: right radial sheath, the radial heparin dose and the
//     intra-arterial verapamil the lab offers (SOURCED_DOSES, cited in caseSession.ts);
//   - the TIG catheter (the autopilot's radial catheter) on the wire, and the wire advanced in 1 mm
//     pushes with the beam on until a push no longer moves it (WIRE_STALL_MM).
// What the learner is shown is what the operator sees and feels: the wire stops and buckles on
// fluoroscopy. No message says the radial route has failed. Only the guided readout, a guided aid
// shown in guided mode, names the segment the wire is in (the loop); the lesson link sets no mode,
// so the learner's level decides, and in the other modes nothing on screen names it.
import type { ProcedureScenario } from "./index";
import type { CaseSession } from "../caseSession";

/** A push that moves the wire less than this (mm) has stalled (MODEL PARAMETER, scenario setting). */
const WIRE_STALL_MM = 0.05;

/** The start state: catheter on the wire in the arm, the wire stopped where it does not pass. */
function wireStopsInTheArm(s: CaseSession): void {
  s.obstructRoute("loop");
  s.prepCatheter("TIG");
  s.runPending();
  if (!s.loadCatheter("TIG")) return;
  s.beamOn = true;
  s.tipImaged = true;
  for (let i = 0; i < 3000; i++) {
    const before = s.wire.pos;
    s.commandWire(1, 0);
    s.commandCatheter(1);
    s.tick(0.033);
    if (s.wire.pos - before < WIRE_STALL_MM) break;
  }
  s.beamOn = false;
}

export const scenarios: ProcedureScenario[] = [
  {
    id: "crossover-heparinised",
    title: "Failed radial in a heparinised patient",
    lessonIds: ["pm-antithrombotics-heparin", "pm-antithrombotics-oac"],
    access: "radial-right",
    indication: "SA",
    variants: ["radial-loop"],
    start: "sheath-in",
    state: wireStopsInTheArm,
  },
];
