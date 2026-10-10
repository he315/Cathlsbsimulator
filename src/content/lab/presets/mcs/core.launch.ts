// Launch metadata for the MCS lab's core scenarios (mcs-console-split-select-and-tips).
// Engine-free: types only. The device-choice presets are SELECT_PRESETS in
// src/simulation/mcs/deviceChoice.ts; the console cases are IABP_CASES, IMP_CASES and ECMO_CASES in
// src/ui/mcs/{IabpConsole,ImpellaConsole,EcmoConsole}.tsx (src/ui/mcs/mcs.test.ts checks both ways).
//
// A .launch.ts names one sim, and the MCS lab is one section with three consoles, so every core
// scenario is declared here under "impella", the console the device-choice request names
// (pm-support-choice#0). The lab resolves a scenario to its console whichever of its three sims a
// link names (resolveMcsLaunch in src/ui/sections/McsLab.tsx): a device-choice preset opens on the
// named console, a console case on the console that owns it. The titles are the scenarios' own,
// written so that the practice list does not give the device away.
//
// The device-choice presets sit under the support-choice lessons (when, which, shock, rv, cpr); the
// console cases sit under the device lessons they practise, as the package's lesson and case links
// ask. The practice and progress views do not key completion on the launch sim (practice rows open
// a launch; runs are logged by the console that ran them), so the shared "impella" sim does not
// misfile a run. The per-console launch files (iabp, pump, ecmo) belong to the later MCS packages.
import type { LaunchFile } from "../../../schema";

export const launch: LaunchFile = {
  sim: "impella",
  scenarios: [
    // the device-choice step
    { id: "select-chip-lm", title: "Planned left main PCI with a poor ventricle", lessonIds: ["pm-support-choice-when", "pm-support-choice-which"], caseIds: ["pm-support-choice-case-chip"] },
    { id: "select-mech-av", title: "Left main atherectomy after valve surgery", lessonIds: ["pm-support-choice-which"] },
    { id: "select-lv-thrombus", title: "PCI to the last remaining vessel after an anterior infarct", lessonIds: ["pm-support-choice-which"] },
    { id: "select-severe-ar", title: "Retrograde CTO PCI in a breathless man with a diastolic murmur", lessonIds: ["pm-support-choice-which"] },
    { id: "select-biv-hypoxaemia", title: "Extensive anterior STEMI, shocked and hypoxaemic", lessonIds: ["pm-support-choice-shock", "pm-support-choice-rv"], caseIds: ["pm-support-choice-case-shock"] },
    { id: "select-simple-lesion", title: "Stable angina with a focal RCA lesion", lessonIds: ["pm-support-choice-when"] },
    { id: "select-arrest", title: "VF arrest during primary PCI", lessonIds: ["pm-support-choice-when", "pm-support-choice-cpr"] },
    // the balloon pump console
    { id: "late-deflation", title: "Balloon pump ward call: 'the balloon looks odd'", lessonIds: ["pm-support-devices-iabp-run"] },
    { id: "early-inflation", title: "Balloon pump: new operator set-up", lessonIds: ["pm-support-devices-iabp-run"] },
    { id: "early-deflation", title: "Balloon pump: recurrent angina on support", lessonIds: ["pm-support-devices-iabp-run"] },
    { id: "late-inflation", title: "Balloon pump: poor augmentation", lessonIds: ["pm-support-devices-iabp-run"] },
    { id: "retroperitoneal-bleed", title: "Balloon pump: back pain and a falling haemoglobin", lessonIds: ["pm-support-devices-iabp-run", "cm-access-complications-large-bore"] },
    // the microaxial pump console
    { id: "escalate", title: "Anterior STEMI with cardiogenic shock on a microaxial pump", lessonIds: ["pm-support-devices-impella-run", "pm-support-choice-shock"] },
    { id: "suction", title: "Suction alarms after diuresis", lessonIds: ["pm-support-devices-impella-run"] },
    { id: "migrated", title: "Microaxial pump position alarm", lessonIds: ["pm-support-devices-impella-run"] },
    { id: "rv", title: "Low pump flows and a rising CVP", lessonIds: ["pm-support-devices-impella-run", "pm-support-choice-rv"] },
    // the VA-ECMO console
    { id: "ecpr", title: "Refractory VF: ECPR in the lab", lessonIds: ["pm-support-devices-ecmo-cannulate", "cp-complex-patients-lab-arrest"], caseIds: ["pm-support-devices-case-ecmo"] },
    { id: "distension", title: "VA-ECMO: flat arterial line and pink frothy secretions", lessonIds: ["pm-support-devices-ecmo-run"], caseIds: ["pm-support-devices-case-ecmo"] },
    { id: "harlequin", title: "VA-ECMO: blue head, pink legs", lessonIds: ["pm-support-devices-ecmo-run"], caseIds: ["pm-support-devices-case-ecmo"] },
  ],
};
