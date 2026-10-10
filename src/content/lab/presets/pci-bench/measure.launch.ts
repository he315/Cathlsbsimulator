// Launch metadata for the IVUS and OCT bench's measuring and planning presets (pci-bench-measure-and-plan).
// Engine-free: types only. The scenario ids are the ids of MEASURE_LESIONS (src/simulation/pciBench.ts),
// which BENCH_BY_ID holds beside the picker's lesions; src/ui/lab/benchTips.measure.test.ts checks both ways.
//
// Each preset opens at the first pullback with the modality still to choose: the learner commits to IVUS or
// OCT against the stated goal, runs the pullbacks, measures on the frames and enters the plan. The params are
// those of core.launch.ts (scenario, start, modality, mode). The grey-zone hand-off of the plan form opens the
// physiology lab at scenario "lm-intermediate", which physiology-left-main-and-ostial is to declare; until a
// physiology launch file declares it, the form shows the grey-zone notice without the button.
//
// The titles do not give the answer away: each names the vessel and what the angiogram shows.
import type { LaunchFile, LaunchStart } from "../../../schema";

const FROM_IMAGE: LaunchStart = { id: "image", title: "From the first pullback" };
const MODALITY = "pm-imaging-when-which";
const PLANNING = "pm-imaging-planning";
const OPTIMISATION = "pm-imaging-optimisation";

export const launch: LaunchFile = {
  sim: "pci-bench",
  scenarios: [
    {
      id: "ostial-lm-ivus",
      title: "Ostial left main narrowing with damping",
      lessonIds: [MODALITY, PLANNING, OPTIMISATION, "cp-left-main-assess"],
      starts: [FROM_IMAGE],
    },
    {
      id: "distal-lm-two-branch",
      title: "Distal left main bifurcation disease",
      lessonIds: [MODALITY, PLANNING, OPTIMISATION, "cp-left-main-assess", "cp-left-main-technique"],
      starts: [FROM_IMAGE],
    },
    {
      id: "aorto-ostial-rca",
      title: "Narrowed RCA ostium",
      lessonIds: [MODALITY, PLANNING, OPTIMISATION, "cp-ostial-assess"],
      starts: [FROM_IMAGE],
    },
    {
      id: "ckd-ivus",
      title: "Long mid-RCA disease, eGFR 24",
      lessonIds: [MODALITY, PLANNING, OPTIMISATION],
      starts: [FROM_IMAGE],
    },
    {
      id: "acs-culprit-oct",
      title: "NSTEMI with a hazy proximal LAD lesion",
      lessonIds: [MODALITY, PLANNING, OPTIMISATION, "pm-imaging-acs"],
      starts: [FROM_IMAGE],
    },
  ],
};
