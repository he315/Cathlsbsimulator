// Engine-free practice links of pci-intravascular-imaging (found-launch-links): IVUS and OCT in the PCI lab
// (the imaging console, src/ui/pci/consoles/ImagingConsole.tsx), listed under the imaging lessons they
// practise. Both open at the core pack's 'wire across' start, where imaging begins (guide engaged, wire in
// the distal vessel):
//   - rca-calcified: the catheter will not cross until the lesion is prepared; a stent deployed at nominal
//     pressure is underexpanded on the run, and the image, post-dilate, image again loop is practised on the
//     stent actually deployed (pm-imaging-optimisation), with the OCT calcium rule asked before preparation;
//   - lad-focal: IVUS (rotational or phased-array, with clear view) and OCT acquisition, its purge,
//     calibration, mode and flush, on a focal lesion (pm-imaging-ivus, pm-imaging-oct).
// The start states the plan names for these links ('stent-deployed-underexpanded', 'stent-deployed') and
// the 'oct-6fr' variant are not start states the core pack declares, and this file cannot add a start the
// lab cannot open; the links use 'wire-across' until the core pack adds them.
import type { LaunchFile } from "../schema";

const LESSONS = ["pm-imaging-ivus", "pm-imaging-oct", "pm-imaging-optimisation"];

export const launch: LaunchFile = {
  sim: "angio-pci",
  links: [
    { scenario: "rca-calcified", start: "wire-across", title: "Image, post-dilate and image again on a calcified mid-RCA stent", lessonIds: LESSONS },
    { scenario: "lad-focal", start: "wire-across", title: "Acquire IVUS and OCT on a focal mid-LAD lesion", lessonIds: [...LESSONS, "pm-imaging-when-which"] },
  ],
};
