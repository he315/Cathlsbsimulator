// Engine-free practice links of diag-rod-physics (found-launch-links): the two cath lab scenarios that
// need the rod mechanics, listed under the lessons they practise. The scenario data lives with the rod
// mechanics (src/ui/physics/physicsDevices.ts ROD_SCENARIOS, opened through labScenarioById in
// src/ui/sim/labSession.ts); the ids, titles and lessons here must match it (physicsDevices.test.ts checks).
import type { LaunchFile } from "../schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-lm-fold-over-j-wire", title: "Left main over a looped J wire", lessonIds: ["pm-engaging-left", "pm-engaging-fail"] },
    { id: "diag-rca-dive-and-conus", title: "Dominant right coronary: the dive and the conus", lessonIds: ["pm-engaging-rca", "pm-engaging-fail"] },
  ],
};
