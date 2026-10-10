// Engine-free launch metadata for the scenarios of pressure.ts (diag-pressure-transducer, with
// found-launch-links): the lessons each one practises. The ids, titles and lessons must match
// pressure.ts (scenarios.test.ts checks).
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-damping-causes", title: "Damping: name it and work the steps", lessonIds: ["pm-engaging-trace", "pm-engaging-damping"] },
    { id: "diag-aspiration-failures", title: "A catheter that will not aspirate", lessonIds: ["pm-engaging-damping", "pm-to-the-root-advance"] },
    { id: "diag-transducer-faults", title: "Every trace looks wrong: check the line", lessonIds: ["pm-engaging-trace"] },
    { id: "diag-as-pulse-not-damping", title: "Aortic stenosis: a slow pulse, not damping", lessonIds: ["pm-engaging-trace", "hb-specific-conditions-as"] },
  ],
};
