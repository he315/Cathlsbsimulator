// Test fixture: a practice link file that adds a start to a scenario declared in demo.launch.ts.
import type { LaunchFile } from "../../../content/schema";

export const launch: LaunchFile = {
  sim: "haemo",
  links: [
    {
      scenario: "fixture-practice",
      start: "late-start",
      mode: "supervised",
      lessonIds: ["y"],
      caseIds: ["case-z"],
      adds: { starts: [{ id: "late-start", title: "Later start" }] },
    },
  ],
};
