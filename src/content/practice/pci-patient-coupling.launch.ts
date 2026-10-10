// Engine-free practice links of pci-patient-coupling (found-launch-links): the patient responds to what was done
// in the PCI lab. The links follow lab-build-plan.json's lessonAndCaseLinks for this package:
//   - hypotension with a hidden cause on lad-focal, supervised: the pressure falls from one of the PCI lab's
//     causes (an open Y-connector valve, a damping or deep guide, contrast or thrombus in the guide, a bulky
//     device, a guide holding an aortic cusp open) or a shared one (tamponade, a vasovagal reaction, a nitrate or
//     verapamil, bleeding), drawn from the run's seed and never named on the live screens
//     (src/simulation/pci/hypotension.ts); the learner runs the false-reading checks and the three groups;
//   - VF at reperfusion on lcx-stemi: the occluded circumflex is opened from the wire-across start and VF
//     follows; the defibrillator console shocks it;
//   - arrest with mechanical CPR on lcx-stemi: VF a few seconds after the wire-across start that the first
//     shocks do not end, so compressions start and the compression device is fitted (its piston shows in the
//     PA view) while the PCI goes on in oblique views.
// The plan names the starts 'vf-reperfusion' and 'arrest-wire-across'; the core pack (owned by
// pci-scenario-registry) does not declare them and this file cannot add a start the lab cannot open, so they
// are variants that the lab session reads (PciLabSession ARRHYTHMIA_VARIANTS), opened at the core pack's
// 'wire-across' start. 'vf-refractory' is the same reperfusion VF with shocks that fail at first. The
// hypotension variants are 'hypotension-<cause>' (the plan's 'hypotension-*'); lessons link the hidden one,
// 'hypotension-unknown'.
import type { LaunchFile, LaunchVariant } from "../schema";

const HYPOTENSION_CAUSES = [
  "valve-open",
  "guide-damping",
  "deep-engagement",
  "contrast-in-guide",
  "thrombus-in-guide",
  "bulky-device",
  "cusp-open",
  "tamponade",
  "vagal",
  "gtn-pde5",
  "verapamil",
  "bleeding",
] as const;

const HYPOTENSION_VARIANTS: LaunchVariant[] = [
  { id: "hypotension-unknown", title: "hypotension with a hidden cause" },
  ...HYPOTENSION_CAUSES.map((c) => ({ id: `hypotension-${c}`, title: `hypotension: ${c.replace(/-/g, " ")}` })),
];

const ARRHYTHMIA_VARIANTS: LaunchVariant[] = [
  { id: "vf-reperfusion", title: "VF at reperfusion" },
  { id: "vf-refractory", title: "VF at reperfusion that the first shocks do not end" },
  { id: "arrest-wire-across", title: "arrest with the wire across" },
];

export const launch: LaunchFile = {
  sim: "angio-pci",
  links: [
    {
      scenario: "lad-focal",
      start: "wire-across",
      variant: "hypotension-unknown",
      mode: "supervised",
      title: "The pressure falls during PCI of a mid-LAD lesion: find the cause (wire across)",
      lessonIds: ["cm-patient-complications-hypotension", "pm-monitoring-pressure"],
      adds: { variants: HYPOTENSION_VARIANTS },
    },
    {
      scenario: "lcx-stemi",
      start: "wire-across",
      variant: "vf-reperfusion",
      title: "VF as the occluded circumflex opens: defibrillate and finish (wire across)",
      lessonIds: ["cm-patient-complications-arrhythmia", "cp-complex-patients-lab-arrest"],
      adds: { variants: ARRHYTHMIA_VARIANTS },
    },
    {
      scenario: "lcx-stemi",
      start: "wire-across",
      variant: "arrest-wire-across",
      title: "Arrest during primary PCI: shocks, compressions and the mechanical compression device (wire across)",
      lessonIds: ["cp-complex-patients-lab-arrest", "pm-support-choice-cpr"],
    },
  ],
};
