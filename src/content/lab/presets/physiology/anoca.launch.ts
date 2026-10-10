// Launch metadata for the physiology lab's coronary function test presets (physiology-anoca-cft).
// Engine-free: types only. The ids and titles are those of ANOCA_PRESETS in
// src/simulation/physiology/ach.ts (ach.test.ts checks both ways): microvascular angina, epicardial
// vasospasm, microvascular spasm and a normal study, one for each answer the lesson's response table
// gives. Each practises the coronary function test of lesson pm-physiology-microvascular (GTN,
// resting and hyperaemic thermodilution, CFR, IMR and FFR, the drift check, acetylcholine) and the
// IV adenosine hyperaemia of pm-physiology-indices; the titles do not name the endotype.
//
// Held back: the study runs in src/ui/physiology/CftPanel.tsx, which the physiology lab
// (src/ui/sections/PhysiologyLab.tsx) does not yet mount, and the lab's launch (launchPreset) refuses
// a preset the pressure-wire session does not know. Neither file belongs to this package. Until the
// lab opens these presets in the panel, ANOCA_LAUNCH_ENABLED stays false, so no lesson links to a
// scenario the lab cannot open and the lab's tip context does not declare the acetylcholine events
// (src/ui/lab/physiologyTips.ts). Setting it true publishes all four.
import type { LaunchFile, LaunchScenario } from "../../../schema";

const LESSONS = ["pm-physiology-microvascular", "pm-physiology-indices"];

/** Whether the physiology lab can open the presets below (see the note above). */
export const ANOCA_LAUNCH_ENABLED: boolean = false;

/** The scenarios this file declares once ANOCA_LAUNCH_ENABLED is true. */
export const ANOCA_SCENARIOS: LaunchScenario[] = [
  { id: "anoca-cmd", title: "Coronary function test 1: exertional angina, smooth coronaries", lessonIds: LESSONS, caseIds: ["pm-physiology-case-anoca"] },
  { id: "anoca-epicardial-spasm", title: "Coronary function test 2: angina at rest and on exertion", lessonIds: LESSONS },
  { id: "anoca-microvascular-spasm", title: "Coronary function test 3: exertional and rest angina, normal stress test", lessonIds: LESSONS },
  { id: "anoca-normal", title: "Coronary function test 4: atypical chest pain, smooth coronaries", lessonIds: LESSONS },
];

export const launch: LaunchFile = {
  sim: "physiology",
  scenarios: ANOCA_LAUNCH_ENABLED ? ANOCA_SCENARIOS : [],
};
