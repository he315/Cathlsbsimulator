// Engine-free launch metadata for the scenarios of route.ts (diag-route-wire-led-radial, with
// found-launch-links): the lessons each one practises. The ids, titles and lessons must match
// route.ts (scenarios.test.ts checks).
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-wire-leads-to-root", title: "From the sheath to the root: the wire leads", lessonIds: ["pm-to-the-root-advance"] },
    { id: "diag-radial-loop-algorithm", title: "Resistance in the forearm: the radial loop algorithm", lessonIds: ["pm-to-the-root-radial"] },
    { id: "diag-exchange-long-wire", title: "Changing catheters without losing the route: the exchange-length wire", lessonIds: ["pm-engaging-exchange"] },
  ],
};
