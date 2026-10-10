// Launch metadata for the pericardiocentesis tab of the bedside lab (pericardiocentesis-tips-and-pci-handover).
// Engine-free: types only. The scenario ids are PERIC_SCENARIOS' (src/simulation/pericardiocentesis.ts);
// src/ui/lab/bedsideTips.scenario.test.ts checks both ways.
//
// from-pci-perforation continues the PCI patient: it takes the useLabHandoverStore transfer the PCI lab
// puts (engine snapshot and leak), and without one it opens on a stand-in perforated patient. The
// titles do not give the diagnosis or the answer away.
import type { LaunchFile } from "../../../schema";

const PERI = "cm-perforation-pericardiocentesis";
const FIRST = "cm-perforation-first-minutes";
const TAMP = "cm-perforation-tamponade";
const CABG = "cm-perforation-collateral-cabg";
// the Academy's bedside pericardiocentesis lessons (src/content/tracks/procedures-career.ts)
const ACAD_ECHO = "bed-peri-indications-echo";
const ACAD_TECH = "bed-peri-technique";
const ACAD_LAB = "bed-peri-complications-lab";

export const launch: LaunchFile = {
  sim: "pericardiocentesis",
  scenarios: [
    { id: "from-pci-perforation", title: "The perforated patient from the PCI lab", lessonIds: [PERI, FIRST, TAMP] },
    { id: "perforation-unstable", title: "Hypotension minutes after a perforation", lessonIds: [PERI, FIRST, TAMP] },
    { id: "perforation-stable-small", title: "Effusion after a distal wire exit", lessonIds: [FIRST, PERI] },
    { id: "post-cabg-loculated", title: "Hypotension after a perforation in a bypass patient", lessonIds: [CABG, PERI], caseIds: ["cm-perforation-case-distal-cabg"] },
    { id: "pci-perforation", title: "Coronary perforation and tamponade in the lab", lessonIds: [PERI, TAMP, ACAD_LAB] },
    { id: "malignant", title: "Breathless, with a large circumferential effusion", lessonIds: [ACAD_TECH, ACAD_ECHO] },
    { id: "post-surgical-posterior", title: "Hypotension six days after cardiac surgery", lessonIds: [ACAD_ECHO, CABG] },
    { id: "aortic-dissection", title: "Tearing chest pain and an effusion", lessonIds: [ACAD_ECHO] },
  ],
};
