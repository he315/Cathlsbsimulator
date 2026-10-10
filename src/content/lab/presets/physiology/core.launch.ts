// Launch metadata for the physiology lab's presets (physiology-engine-unify-and-setup).
// Engine-free: types only. The ids match PHYSIOLOGY_PRESETS in src/simulation/pci/pwSession.ts
// (physiologyTips.test.ts checks both ways): one preset for each teaching case of
// src/simulation/physiology.ts and one for each pressure-wire set-up fault of lesson
// pm-physiology-setup (Brilakis 12.2.1-12.2.4). Every study starts with the set-up, so every
// preset is listed under pm-physiology-setup, and under the lessons whose teaching it practises
// as well. The titles are the presets' own, written so that the practice list does not name the
// fault or the pitfall.
import type { LaunchFile } from "../../../schema";

const SETUP = "pm-physiology-setup";

export const launch: LaunchFile = {
  sim: "physiology",
  scenarios: [
    { id: "lad-intermediate", title: "Intermediate mid-LAD lesion", lessonIds: [SETUP, "pm-physiology-indices"] },
    { id: "rca-negative", title: "Moderate mid-RCA lesion", lessonIds: [SETUP, "pm-physiology-when", "pm-physiology-indices"] },
    { id: "tandem", title: "Two moderate LAD lesions", lessonIds: [SETUP, "pm-physiology-pullback"], caseIds: ["pm-physiology-case-lad"] },
    { id: "diffuse", title: "Long, irregular LAD", lessonIds: [SETUP, "pm-physiology-pullback"] },
    { id: "anoca", title: "Exertional angina with smooth coronaries", lessonIds: [SETUP, "pm-physiology-microvascular"], caseIds: ["pm-physiology-case-anoca"] },
    { id: "guide-wedge", title: "Proximal LAD lesion after a diagnostic study", lessonIds: [SETUP, "pm-physiology-pullback", "pm-physiology-subsets"] },
    { id: "drift", title: "Borderline obtuse marginal lesion", lessonIds: [SETUP, "pm-physiology-pullback"] },
    { id: "fault-no-zero", title: "Pressure-wire set-up 1: mid-LAD lesion", lessonIds: [SETUP] },
    { id: "fault-introducer", title: "Pressure-wire set-up 2: mid-LAD lesion", lessonIds: [SETUP] },
    { id: "fault-contrast", title: "Pressure-wire set-up 3: mid-LAD lesion", lessonIds: [SETUP] },
    { id: "fault-air-aortic", title: "Pressure-wire set-up 4: mid-LAD lesion", lessonIds: [SETUP, "pm-monitoring-transducers"] },
    { id: "fault-deep-equalise", title: "Pressure-wire set-up 5: proximal LAD lesion", lessonIds: [SETUP] },
    { id: "fault-offset-waveforms", title: "Pressure-wire set-up 6: mid-LAD lesion", lessonIds: [SETUP] },
    { id: "fault-ebu-lcx", title: "Pressure-wire set-up 7: mid-LAD lesion in a small woman", lessonIds: [SETUP] },
    { id: "fault-wire-deformed", title: "Pressure-wire set-up 8: mid-LAD lesion", lessonIds: [SETUP] },
  ],
};
