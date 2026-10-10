// Test fixture for practiceIndex.test.ts (excluded from the runtime practice index and the
// content test by the __fixtures__ pattern). Ids here are invented and name no real scenario.
import type { LaunchFile } from "../../../content/schema";

export const launch: LaunchFile = {
  sim: "haemo",
  scenarios: [
    {
      id: "fixture-practice",
      title: "Fixture practice scenario",
      lessonIds: ["x"],
      starts: [{ id: "at-start", title: "At the start" }],
      variants: ["v1", { id: "vx", heldOut: true }],
    },
    { id: "fixture-exam", title: "Fixture exam scenario", lessonIds: [], heldOut: true },
  ],
};
