// Engine-free practice links of pci-pressure-wire-console (found-launch-links): the pressure wire in the PCI
// lab (the pressure-wire console, src/ui/pci/consoles/PressureWireConsole.tsx), listed under the lessons that
// teach it. Every link opens the core pack's focal mid-LAD case at 'guide-engaged', where the working wire is
// still in the guide and can be exchanged for the pressure wire:
//   - the set-up, equalisation at the guide tip, hyperaemia, the pullback and the drift check, and the
//     post-PCI pullback (pm-physiology-after-pci);
//   - the same case with a faulty aortic line, by the lab's own launch key 'pwFault' (src/simulation/pci/
//     actions/pressure.ts pwFaultsFromParams): air in the aortic line, an unzeroed transducer (both stop
//     equalisation) and a loose transducer (it drifts) (pm-monitoring-transducers);
//   - the pullback co-registered on the stored angiogram (pm-imaging-coreg-ct).
// The plan also links the jailed side-branch FFR to 'lad-diag-provisional' at 'post-mv-stent' and names the
// faulty line as a 'line-air' variant. That scenario and start do not exist yet (pci-bifurcation-provisional
// adds them), and a variant id is read by the scenario resolver as a seed, so the faults use the lab's own
// key instead; the jailed-branch measurement is practised in lad-focal once the stent has pinched the
// diagonal, until the provisional scenario lands.
import type { LaunchFile } from "../schema";

export const launch: LaunchFile = {
  sim: "angio-pci",
  links: [
    {
      scenario: "lad-focal",
      start: "guide-engaged",
      title: "Exchange for the pressure wire, equalise at the guide tip and measure a focal mid-LAD lesion before and after PCI",
      lessonIds: ["pm-physiology-after-pci"],
    },
    {
      scenario: "lad-focal",
      start: "guide-engaged",
      params: { pwFault: "line-air" },
      title: "Equalise the pressure wire with a faulty aortic line: air in the line",
      lessonIds: ["pm-monitoring-transducers"],
    },
    {
      scenario: "lad-focal",
      start: "guide-engaged",
      params: { pwFault: "transducer-unzeroed" },
      title: "Equalise the pressure wire with a faulty aortic line: the transducer not zeroed",
      lessonIds: ["pm-monitoring-transducers"],
    },
    {
      scenario: "lad-focal",
      start: "guide-engaged",
      params: { pwFault: "transducer-loose" },
      title: "Find the drift of a loose transducer on the pressure-wire pullback",
      lessonIds: ["pm-monitoring-transducers"],
    },
    {
      scenario: "lad-focal",
      start: "guide-engaged",
      title: "Co-register a pressure-wire pullback on the stored angiogram",
      lessonIds: ["pm-imaging-coreg-ct"],
    },
  ],
};
