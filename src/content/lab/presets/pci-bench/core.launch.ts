// Launch metadata for the IVUS and OCT bench's core scenarios (pci-bench-imaging-unify).
// Engine-free: types only. The scenario ids are the ids of BENCH_LESIONS (src/simulation/pciBench.ts);
// src/ui/lab/benchTips.scenario.test.ts checks both ways.
//
// Launch params the bench reads (src/ui/sections/PciBench.tsx, launchBench):
//   scenario   a BENCH_LESIONS id
//   start      the step the bench opens at: "image" (the first pullback, modality still to choose),
//              "prep" (imaging done, preparation next) or "stent" (direct stenting, no preparation).
//              A later step needs the earlier steps' choices, so no later start is offered. A direct
//              caller may pass the same value as "step"; "start" is the validated key (a "step"
//              param is a technique step number in the launch schema).
//   modality   "IVUS" or "OCT": the modality is already chosen (otherwise the learner chooses it)
//   mode       guided | supervised | independent | exam
//
// The titles do not give the answer away: each names the vessel and what the angiogram shows.
import type { LaunchFile, LaunchStart } from "../../../schema";

const FROM_IMAGE: LaunchStart = { id: "image", title: "From the first pullback" };
const FROM_PREP: LaunchStart = { id: "prep", title: "Imaging done: prepare the lesion" };
const DIRECT: LaunchStart = { id: "stent", title: "Direct stenting" };

export const launch: LaunchFile = {
  sim: "pci-bench",
  scenarios: [
    {
      id: "focal-lad",
      title: "Focal mid-LAD stenosis",
      lessonIds: ["pm-imaging-planning", "pm-imaging-optimisation", "pm-prep-and-stent-deploy", "pm-prep-and-stent-result"],
      starts: [FROM_IMAGE, FROM_PREP, DIRECT],
    },
    {
      id: "long-taper",
      title: "Long, tapering LAD disease",
      lessonIds: ["cp-other-complex-long-lesions", "pm-imaging-planning", "pm-imaging-optimisation", "pm-prep-and-stent-result"],
      starts: [FROM_IMAGE, FROM_PREP],
    },
    {
      id: "calcified-rca",
      title: "Mid-RCA stenosis with fluoroscopic calcium",
      lessonIds: ["cp-calcium-strategy", "cp-calcium-balloons", "cp-calcium-ivl", "cp-calcium-rota", "pm-prep-and-stent-prep-why"],
      caseIds: ["pm-prep-and-stent-case-calcified-rca"],
      starts: [FROM_IMAGE, FROM_PREP],
    },
    {
      id: "lipid-acs",
      title: "NSTEMI culprit in the proximal LCx",
      lessonIds: ["pm-imaging-acs"],
      starts: [FROM_IMAGE, FROM_PREP, DIRECT],
    },
    {
      id: "distal-lm",
      title: "Distal left main into the LAD",
      lessonIds: ["cp-left-main-distal", "cp-left-main-technique", "cp-other-complex-vessel-size", "pm-imaging-when-which"],
      caseIds: ["cp-left-main-case-distal"],
      starts: [FROM_IMAGE, FROM_PREP],
    },
    {
      id: "small-diagonal",
      title: "Focal diagonal stenosis, small on the first injection",
      lessonIds: ["cp-other-complex-vessel-size"],
      starts: [FROM_IMAGE, FROM_PREP],
    },
  ],
  links: [
    // the modality lessons open the bench with that modality already chosen
    { scenario: "focal-lad", start: "image", title: "Focal mid-LAD stenosis · IVUS", params: { modality: "IVUS" }, lessonIds: ["pm-imaging-ivus"] },
    { scenario: "distal-lm", start: "image", title: "Distal left main into the LAD · IVUS", params: { modality: "IVUS" }, lessonIds: ["pm-imaging-ivus"] },
    { scenario: "calcified-rca", start: "image", title: "Mid-RCA stenosis with fluoroscopic calcium · OCT", params: { modality: "OCT" }, lessonIds: ["pm-imaging-oct"] },
    { scenario: "lipid-acs", start: "image", title: "NSTEMI culprit in the proximal LCx · OCT", params: { modality: "OCT" }, lessonIds: ["pm-imaging-oct", "pm-imaging-acs"] },
  ],
};
