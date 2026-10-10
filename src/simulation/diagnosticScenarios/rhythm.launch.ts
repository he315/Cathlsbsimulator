// Engine-free launch metadata for the scenarios of rhythm.ts (diag-rhythm-haemodynamic-events, with
// found-launch-links): the lessons each one practises. The ids, titles and lessons must match rhythm.ts
// (scenarios.test.ts checks).
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-vf-causes", title: "VF after an injection: what was the catheter doing?", lessonIds: ["cp-complex-patients-lab-arrest", "cm-patient-complications-arrhythmia", "pm-lab-drugs-antiarrhythmics"] },
    { id: "diag-vagal-vs-bleed", title: "A slow pulse and a falling pressure: vagal, or not?", lessonIds: ["cm-patient-complications-vasovagal", "cm-patient-complications-hypotension", "pm-lab-drugs-antiarrhythmics"] },
    { id: "diag-amplatz-hypotension", title: "The pressure falls with the Amplatz deep", lessonIds: ["cm-patient-complications-hypotension", "hb-specific-conditions-ar-right"] },
    { id: "diag-lv-vt", title: "VT during the ventriculogram: which treatment?", lessonIds: ["pm-lab-drugs-antiarrhythmics", "cm-patient-complications-arrhythmia"] },
    { id: "diag-bradycardia-pace", title: "A slow rhythm after the right coronary run", lessonIds: ["cm-patient-complications-arrhythmia", "pm-lab-drugs-antiarrhythmics"] },
    { id: "diag-arrhythmia-contraindications", title: "Fast AF: is that drug safe for this patient?", lessonIds: ["pm-lab-drugs-antiarrhythmics", "cm-patient-complications-arrhythmia"] },
  ],
};
