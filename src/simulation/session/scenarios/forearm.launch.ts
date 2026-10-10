// Launch metadata for the full case's forearm haematoma scenarios (access-cx-forearm; engine-free: types only). The
// ids, titles and lessons are those of scenarios/forearm.ts. Every case opens at 'recovery' (the team has done a
// right radial case and put the band on; the learner has the patient on the ward). The grading cases are listed
// under the radial bleeding lesson (cm-access-complications-radial-bleeding) and the spasm lesson (pm-engaging-spasm),
// whose access request asks for the haematoma to be graded and managed; the compartment case under the radial bleeding
// lesson; the traction case under both, the spasm lesson first. The titles do not give the grade away. No mode is set:
// the learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const RADIAL_BLEEDING = "cm-access-complications-radial-bleeding";
const SPASM = "pm-engaging-spasm";
const ON_WARD = [{ id: "recovery", title: "On the ward after closure" }];

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "forearm-grade-1", title: "On the ward after a radial case: the wrist", lessonIds: [RADIAL_BLEEDING, SPASM], starts: ON_WARD },
    { id: "forearm-grade-3", title: "On the ward after a radial case: the forearm (1)", lessonIds: [RADIAL_BLEEDING, SPASM], starts: ON_WARD },
    { id: "forearm-grade-4", title: "On the ward after a radial PCI: the arm", lessonIds: [RADIAL_BLEEDING, SPASM], starts: ON_WARD },
    { id: "forearm-compartment", title: "On the ward after a radial case: the forearm (2)", lessonIds: [RADIAL_BLEEDING], starts: ON_WARD },
    { id: "forearm-after-traction", title: "On the ward after a difficult sheath removal", lessonIds: [SPASM, RADIAL_BLEEDING], starts: ON_WARD },
  ],
};
