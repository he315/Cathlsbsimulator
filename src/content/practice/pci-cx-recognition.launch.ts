// Engine-free practice links of pci-cx-recognition (found-launch-links): complication recognition in the PCI
// lab. Complications arise from technique and show as cues (the image, the trace, the patient) until the
// learner assesses them with the Assess control (src/ui/pci/RecognitionForm.tsx): the cause-finding
// checklist when flow fails, the cause, the NHLBI type of a dissection, the location and Ellis grade of a
// perforation and the TIMI flow grade, scored for correctness and time to recognition.
//   - lad-focal, supervised: flow failure after dilatation of a focal mid-LAD lesion (cause-finding before
//     treatment: dissection, embolisation and no-reflow, thrombus, air), listed under the no-reflow, plaque
//     and thrombus embolisation, acute closure and dissection lessons;
//   - rca-calcified: high pressure and oversizing against calcium, which dissects and perforates, so the
//     NHLBI and the Ellis grading are practised as well (the perforation lesson links here only).
// The plan names starts 'closure-timi0' (lad-focal opening in the closed state) and 'perforation-ellis3'
// (rca-calcified); the core pack (owned by pci-scenario-registry) does not declare them and this file
// cannot add a start the lab cannot open, so both links open at 'wire-across', where the learner dilates
// and the complication follows from the technique (the titles say so), until the pack adds those starts;
// then the starts and the tips test's start (recognition.tips.test.ts) change to the plan's.
import type { LaunchFile } from "../schema";

const RECOGNITION_LESSONS = ["cm-flow-embolism-noreflow", "cm-flow-embolism-plaque-thrombus", "cm-principles-closure-acute"];

export const launch: LaunchFile = {
  sim: "angio-pci",
  links: [
    {
      scenario: "lad-focal",
      start: "wire-across",
      mode: "supervised",
      title: "Recognise the cause when flow fails after dilating a mid-LAD lesion (wire across; dilate first)",
      lessonIds: [...RECOGNITION_LESSONS, "cm-principles-closure-dissection"],
    },
    {
      scenario: "rca-calcified",
      start: "wire-across",
      title: "Recognise and grade a dissection or perforation on a calcified mid-RCA lesion (wire across; dilate first)",
      lessonIds: [...RECOGNITION_LESSONS, "cm-perforation-classify"],
    },
  ],
};
