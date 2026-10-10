// Launch metadata for the full case's default scenario (engine-free: types only).
// The starts are the autopilot's stages (src/simulation/session/scenarios/index.ts, SCENARIO_STARTS).
// The access lesson opens the case at the chart; the root-table and closure lessons link to the
// start that fits what they teach, so the learner does not replay the earlier steps first.
import type { LaunchFile } from "../../../content/schema";

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    {
      id: "default",
      title: "Random patient",
      lessonIds: ["pm-access-seldinger"],
      starts: [
        { id: "chart", title: "At the chart" },
        { id: "access", title: "Ready to puncture" },
        { id: "sheath-in", title: "Sheath in" },
        { id: "post-diagnostic", title: "After the angiogram" },
        { id: "closure", title: "Ready for closure" },
        { id: "recovery", title: "In recovery" },
      ],
    },
  ],
  links: [
    { scenario: "default", start: "sheath-in", lessonIds: ["pm-to-the-root-table"] },
    { scenario: "default", start: "closure", lessonIds: ["pm-closure-plan"] },
  ],
};
