// Launch metadata for the hands-on transseptal puncture (structural-transseptal-hands-on).
// Engine-free: types only. The ids match TS_PRESETS (src/simulation/transseptal.ts);
// src/ui/lab/structuralTips.transseptal.test.ts checks both ways.
//
// Each preset is a transseptal drill in the TEER lab: it opens at the transseptal step on a TEER
// patient, runs the puncture by hand from the SVC to a secured left atrium, the removal of the left
// atrial catheters and the stage's own debrief. The ordinary TEER and LAAO scenarios
// (core.launch.ts) also start their puncture with this stage, and go on to the device.
// The titles describe the patient, not the complication the drill holds.
import type { LaunchFile, LaunchStart } from "../../../schema";

const TS_LESSONS = ["hb-mitral-tricuspid-laa-ts-setup", "hb-mitral-tricuspid-laa-ts-cross"];
const AT_PUNCTURE: LaunchStart[] = [{ id: "transseptal", title: "From the loaded transseptal system" }];

export const launch: LaunchFile = {
  sim: "teer",
  scenarios: [
    { id: "ts-standard", title: "Transseptal puncture for TEER", lessonIds: [...TS_LESSONS], starts: AT_PUNCTURE },
    { id: "ts-thick-septum", title: "Thick septum after surgery and radiotherapy", lessonIds: [...TS_LESSONS], starts: AT_PUNCTURE },
    { id: "ts-floppy-septum", title: "Floppy, aneurysmal septum", lessonIds: [...TS_LESSONS, "hb-mitral-tricuspid-laa-teer-procedure"], caseIds: ["hb-mitral-tricuspid-laa-case-teer-flail"], starts: AT_PUNCTURE },
    { id: "ts-aortic-puncture", title: "Dilated aortic root", lessonIds: [...TS_LESSONS], starts: AT_PUNCTURE },
    { id: "ts-vagal", title: "Routine TEER work-up, no previous surgery", lessonIds: [...TS_LESSONS], starts: AT_PUNCTURE },
    { id: "ts-delayed-tamponade", title: "Large atrium, posterior target", lessonIds: [...TS_LESSONS], starts: AT_PUNCTURE },
    { id: "ts-pacing-lead", title: "Dual-chamber pacemaker", lessonIds: [...TS_LESSONS], starts: AT_PUNCTURE },
  ],
};
