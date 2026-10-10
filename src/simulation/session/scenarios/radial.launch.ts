// Launch metadata for the full case's radial access scenarios (engine-free: types only). The ids, titles and
// lessons are those of scenarios/radial.ts. The three patient presets of the radial puncture (the standard
// wrist, a small artery, a young anxious patient) are listed under both radial access lessons and the spasm
// lesson; the LIMA, unsupinated and bleb presets under the puncture lesson; the loop and the perforation
// under the forearm complications lesson (the loop under the sheath lesson too, whose step 6 images
// forearm resistance); the extremely tortuous arm under the heparin lesson and the sheath lesson. No mode
// is set: the learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const PUNCTURE = "pm-access-radial-puncture";
const SHEATH = "pm-access-radial-sheath";
const SPASM = "pm-engaging-spasm";
const HEPARIN = "pm-antithrombotics-heparin";
const FOREARM = "cm-access-complications-radial-bleeding";
const READY = [{ id: "access", title: "Ready to puncture" }];
const SHEATH_IN = [{ id: "sheath-in", title: "Sheath in" }];

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "radial-normal", title: "Radial puncture: the standard wrist", lessonIds: [PUNCTURE, SHEATH, SPASM], starts: READY },
    { id: "radial-small", title: "Radial puncture: a small radial artery", lessonIds: [PUNCTURE, SHEATH, SPASM], starts: READY },
    { id: "radial-anxious-young", title: "Radial puncture: a young, anxious patient", lessonIds: [PUNCTURE, SHEATH, SPASM], starts: READY },
    { id: "radial-lima-left", title: "Left radial puncture for a LIMA graft", lessonIds: [PUNCTURE], starts: READY },
    { id: "radial-no-supination", title: "Radial access: a forearm that will not turn", lessonIds: [PUNCTURE], starts: READY },
    { id: "radial-bleb", title: "Radial puncture: a large bleb of local anaesthetic", lessonIds: [PUNCTURE], starts: READY },
    { id: "radial-loop", title: "Radial access: the wire stops in the forearm", lessonIds: [SHEATH, FOREARM], starts: SHEATH_IN },
    { id: "radial-tortuous-extreme", title: "Radial access in an extremely tortuous arm: when to give the heparin", lessonIds: [HEPARIN, SHEATH], starts: READY },
    { id: "radial-forced-perforation", title: "Radial access: a perforation in the forearm", lessonIds: [FOREARM], starts: SHEATH_IN },
  ],
};
