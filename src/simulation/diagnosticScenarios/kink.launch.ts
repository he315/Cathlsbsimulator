// Engine-free launch metadata for the scenarios of kink.ts (diag-catheter-kink, with
// found-launch-links): the lessons each one practises. The ids, titles and lessons must match
// kink.ts (scenarios.test.ts checks).
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-kink-tortuous-iliac", title: "The tip that will not follow the hub: a tortuous iliac", lessonIds: ["pm-engaging-torque", "eq-sheaths-guides-long-sheathless"] },
    { id: "diag-kink-subclavian", title: "A tortuous subclavian: torque that does not reach the tip", lessonIds: ["pm-engaging-torque", "cp-prior-cabg-arterial"] },
    { id: "diag-kink-radial-forearm", title: "A kink in the forearm: hold it with a cuff", lessonIds: ["pm-engaging-torque"] },
  ],
};
