// Launch metadata for the full case's emergency scenarios (engine-free: types only). The ids, titles
// and lessons are those of scenarios/emergencies.ts. The three cases a learner must tell apart
// (contrast anaphylaxis, its pre-arrest presentation with a slow pulse, and the vasovagal reaction at
// sheath removal) are listed under the contrast reactions lesson, the vasovagal lesson and the
// tamponade lesson, each of which teaches the discrimination; the prevention cases under the
// vasovagal lesson; the tamponade look-alike under the vasovagal and tamponade lessons. Each opens at
// its own start. No mode is set: the learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const REACTIONS = "pm-lab-drugs-contrast-reactions";
const VAGAL = "cm-patient-complications-vasovagal";
const TAMPONADE = "cm-perforation-tamponade";

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "anaphylaxis-asthmatic", title: "Unwell after the first injection", lessonIds: [REACTIONS, VAGAL, TAMPONADE] },
    { id: "anaphylaxis-prearrest-brady", title: "Unwell after the angiogram: a slow pulse", lessonIds: [REACTIONS, VAGAL, TAMPONADE] },
    { id: "vagal-mimic", title: "Unwell at sheath removal", lessonIds: [REACTIONS, VAGAL, TAMPONADE] },
    { id: "vagal-no-local", title: "A nervous patient: puncture to sheath removal", lessonIds: [VAGAL] },
    { id: "vagal-removal-no-saline", title: "Femoral sheath removal in a nervous patient", lessonIds: [VAGAL] },
    { id: "tamponade-mimic", title: "Hypotension at sheath removal after a pacing wire", lessonIds: [VAGAL, TAMPONADE] },
  ],
};
