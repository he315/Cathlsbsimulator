// Launch metadata for the full case's femoral puncture scenarios (engine-free: types only). The ids,
// titles and lessons are those of scenarios/femoral.ts. Each scenario opens ready to puncture
// (its own start), so the lessons list the scenario entry itself; the case that opens with the
// micro-wire already in (fem-entry-below-head) is linked on its own, at the fluoroscopy workspace,
// where the wire is screened. No mode is set: the learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const PUNCTURE = "pm-access-femoral-puncture";
const SELDINGER = "pm-access-seldinger";
const SHEATH = "pm-access-femoral-sheath";
const READY = [{ id: "access", title: "Ready to puncture" }];

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "fem-normal", title: "Femoral puncture: the standard groin", lessonIds: [PUNCTURE, SELDINGER, SHEATH], starts: READY },
    { id: "fem-high-bif", title: "Femoral puncture: where does it divide?", lessonIds: [PUNCTURE, SELDINGER, SHEATH], starts: READY },
    { id: "fem-calcified-anterior", title: "Femoral puncture: a calcified common femoral artery", lessonIds: [PUNCTURE, SELDINGER, SHEATH], starts: READY },
    { id: "fem-deep-4cm", title: "Femoral puncture: a deep artery", lessonIds: [PUNCTURE], starts: READY },
    { id: "fem-shallow-2cm", title: "Femoral puncture: a lean groin", lessonIds: [PUNCTURE], starts: READY },
    { id: "fem-plugged-needle", title: "Femoral puncture: no blood at the hub", lessonIds: [PUNCTURE, SELDINGER], starts: READY },
    { id: "fem-micro-wire-iea", title: "Micropuncture wire: where is it going? (1)", lessonIds: [SHEATH, SELDINGER], starts: READY },
    { id: "fem-micro-wire-lcia", title: "Micropuncture wire: where is it going? (2)", lessonIds: [SHEATH, SELDINGER], starts: READY },
    { id: "fem-micro-wire-down-leg", title: "Micropuncture wire: where is it going? (3)", lessonIds: [SHEATH, SELDINGER], starts: READY },
    { id: "fem-entry-below-head", title: "Micropuncture wire in: screen it before the sheath", lessonIds: [], starts: READY },
  ],
  links: [
    {
      scenario: "fem-entry-below-head",
      start: "access",
      title: "Micropuncture wire in: screen it before the sheath",
      params: { workspace: "fluoro" },
      lessonIds: [SHEATH],
    },
  ],
};
