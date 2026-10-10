// Launch metadata for the physiology lab's left main and aorto-ostial presets (physiology-left-main-and-
// ostial). Engine-free: types only. The ids and titles are those of LEFT_MAIN_PRESETS in
// src/simulation/physiology.ts (physiology.leftMain.test.ts checks both ways).
//
// Every preset practises lesson pm-physiology-subsets (aorto-ostial lesions and the left main, Brilakis
// 12.3); the left main presets also practise cp-left-main-assess, the ostial ones cp-ostial-assess, the
// jailed circumflex presets cp-left-main-distal and pm-physiology-after-pci, and the discordant preset
// pm-physiology-indices. "lm-intermediate" is the preset the IVUS bench's grey-zone hand-off opens
// (src/ui/bench/PlanForm.tsx GREY_ZONE_HANDOFF).
//
// The titles name the vessel and what the angiogram shows, not the answer.
//
// Published: the pressure-wire session (src/simulation/pci/pwSession.ts LEFT_MAIN_PW_PRESETS) registers
// all ten, and the lab (src/ui/sections/PhysiologyLab.tsx) opens them with the branch selector, so the
// practice lists link to them and the IVUS bench's grey-zone hand-off (src/ui/bench/PlanForm.tsx
// greyZoneHandoffAvailable) opens "lm-intermediate". Setting LEFT_MAIN_LAUNCH_ENABLED to false holds all
// ten back again (physiologyTips.leftMain.test.ts checks that the session and this file agree).
import type { LaunchFile, LaunchScenario } from "../../../schema";

const SUBSETS = "pm-physiology-subsets";
const LM = "cp-left-main-assess";
const OSTIAL = "cp-ostial-assess";
const JAILED = ["cp-left-main-distal", "pm-physiology-after-pci"];

/** Whether the physiology lab can open the presets below (see the note above). */
export const LEFT_MAIN_LAUNCH_ENABLED: boolean = true;

/** The scenarios this file declares once LEFT_MAIN_LAUNCH_ENABLED is true. */
export const LEFT_MAIN_SCENARIOS: LaunchScenario[] = [
  { id: "lm-significant", title: "Distal left main stenosis", lessonIds: [SUBSETS, LM] },
  { id: "lm-ostial-lcx", title: "Distal left main and LCx ostium narrowing", lessonIds: [SUBSETS, LM] },
  { id: "lm-masked-by-lad", title: "Distal left main with proximal LAD disease", lessonIds: [SUBSETS, LM] },
  { id: "lm-jailed-lcx-075", title: "Left main cross-over stent: the jailed side branch 1", lessonIds: [SUBSETS, LM, ...JAILED] },
  { id: "lm-jailed-lcx-085", title: "Left main cross-over stent: the jailed side branch 2", lessonIds: [SUBSETS, LM, ...JAILED] },
  { id: "lm-discordant", title: "Left main stenosis with typical angina", lessonIds: [SUBSETS, LM, "pm-physiology-indices"] },
  { id: "lm-high-ra", title: "Left main stenosis in a breathless patient", lessonIds: [SUBSETS, LM] },
  { id: "ostial-lm-damped", title: "Ostial left main narrowing", lessonIds: [SUBSETS, LM, OSTIAL] },
  { id: "ostial-rca-engaged", title: "Ostial RCA narrowing", lessonIds: [SUBSETS, OSTIAL] },
  { id: "lm-intermediate", title: "Intermediate left main stenosis", lessonIds: [SUBSETS, LM] },
];

export const launch: LaunchFile = {
  sim: "physiology",
  scenarios: LEFT_MAIN_LAUNCH_ENABLED ? LEFT_MAIN_SCENARIOS : [],
};
