// Launch metadata for the physiology lab's hyperaemia presets (physiology-hyperaemia-and-adenosine).
// Engine-free: types only. The ids and titles are those of the hyperaemia presets in
// src/simulation/pci/pwSession.ts (HYPERAEMIA_PRESETS; physiologyTips.hyperaemia.test.ts checks both
// ways). They are listed (pwSession.HYPERAEMIA_PRESETS_LISTED) now that the lab's rig gives its engine
// what the operator does. Each practises choosing the agent, route and dose of the vasodilator, recognising failed
// hyperaemia and managing adenosine's arrhythmias, so each is listed under lesson
// pm-physiology-indices (vasodilators, failed hyperaemia, artefacts and adenosine's hazards) and under
// pm-lab-drugs-microvascular (adenosine's doses by vessel, the guide flush and its rhythm problems).
// The titles do not name the failure or the arrhythmia.
import type { LaunchFile, LaunchScenario } from "../../../schema";

const LESSONS = ["pm-physiology-indices", "pm-lab-drugs-microvascular"];

/** The hyperaemia scenarios, ready to list. */
export const HYPERAEMIA_SCENARIOS: LaunchScenario[] = [
  { id: "ic-rca-dose", title: "Hyperaemia 1: moderate mid-RCA lesion", lessonIds: LESSONS },
  { id: "iv-tissued-line", title: "Hyperaemia 2: mid-LAD lesion", lessonIds: LESSONS },
  { id: "iv-caffeine", title: "Hyperaemia 3: mid-LAD lesion on a morning list", lessonIds: LESSONS },
  { id: "saline-swap", title: "Hyperaemia 4: mid-LAD lesion", lessonIds: LESSONS },
  { id: "contrast-ffr", title: "Hyperaemia 5: mid-LAD lesion in a patient with asthma", lessonIds: LESSONS },
  { id: "adenosine-vf", title: "Hyperaemia 6: moderate mid-RCA lesion, adenosine just given", lessonIds: LESSONS },
];

export const launch: LaunchFile = {
  sim: "physiology",
  scenarios: HYPERAEMIA_SCENARIOS,
};
