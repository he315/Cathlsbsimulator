// Launch metadata for the full case's crossover scenario (engine-free: types only).
// The scenario opens at the autopilot's 'sheath-in' stage with the wire stopped in the arm, and the
// lessons open it on the fluoroscopy workspace, where the wire is. The lessons are the scenario's own
// (crossover.ts lessonIds); they are listed on the link rather than on the scenario entry so that each
// lesson has one entry, the one that opens at fluoroscopy.
import type { LaunchFile } from "../../../content/schema";

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    {
      id: "crossover-heparinised",
      title: "Failed radial in a heparinised patient",
      lessonIds: [],
      starts: [{ id: "sheath-in", title: "Radial wire will not pass" }],
    },
  ],
  links: [
    {
      scenario: "crossover-heparinised",
      start: "sheath-in",
      title: "Failed radial in a heparinised patient",
      params: { workspace: "fluoro" },
      lessonIds: ["pm-antithrombotics-heparin", "pm-antithrombotics-oac"],
    },
  ],
};
