// Launch metadata for the full case's hypotension and pulmonary oedema scenarios (engine-free: types
// only). The ids, titles and lessons are those of scenarios/hypotension.ts. Every hypotension case is
// listed under the pressors lesson; the bleeding, fasting and ischaemic cases also under the oedema
// lesson, because each turns on how much fluid the ventricle can take; the false transducer under the
// pressure monitoring lesson; tamponade under the tamponade lesson; the raised-LVEDP case under the
// oedema lesson. Each opens after the diagnostic run. No mode is set: the learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const PRESSORS = "pm-lab-drugs-pressors";
const OEDEMA = "cm-flow-embolism-oedema-cholesterol";
const MONITORING = "pm-monitoring-pressure";
const TAMPONADE = "cm-perforation-tamponade";

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "hypo-bleeding", title: "The pressure falls after the angiogram", lessonIds: [PRESSORS, OEDEMA] },
    { id: "hypo-fasting", title: "Low pressure in a patient who has not eaten or drunk", lessonIds: [PRESSORS, OEDEMA] },
    { id: "hypo-ischaemia", title: "Chest pain and a falling pressure", lessonIds: [PRESSORS, OEDEMA] },
    { id: "hypo-tamponade", title: "Low pressure and a fast pulse after a femoral case", lessonIds: [PRESSORS, TAMPONADE] },
    { id: "hypo-arrhythmia", title: "A slow pulse and a low pressure", lessonIds: [PRESSORS] },
    { id: "hypo-hcm", title: "Low pressure after the radial cocktail", lessonIds: [PRESSORS] },
    { id: "hypo-pde5-nitrate", title: "Low pressure after the nitrate", lessonIds: [PRESSORS] },
    { id: "hypo-verapamil", title: "Low pressure after more verapamil", lessonIds: [PRESSORS] },
    { id: "hypo-false-transducer", title: "The monitor shows a low pressure", lessonIds: [PRESSORS, MONITORING] },
    { id: "oedema-lvedp-high", title: "A weak ventricle and a high filling pressure", lessonIds: [OEDEMA] },
  ],
};
