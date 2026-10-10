// Engine-free launch metadata for the scenarios of core.ts (found-launch-links): the lessons each
// one practises. The ids and lessons must match core.ts (scenarios.test.ts checks).
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-ohca-post-rosc", title: "Resuscitated arrest with ST elevation", lessonIds: ["cp-complex-patients-ohca"] },
    { id: "diag-contrast-sensitive", title: "Weak ventricle, tight valve, low eGFR", lessonIds: ["hb-background-general"] },
    { id: "diag-nitrate-pde5", title: "Spasm and a PDE-5 inhibitor", lessonIds: ["pm-lab-drugs-nitrates"] },
    { id: "diag-graft-search", title: "Find every graft in the operation note", lessonIds: ["cp-prior-cabg-svg-find"] },
    { id: "diag-scad-suspected", title: "Chest pain three weeks after delivery", lessonIds: ["cp-other-complex-scad"] },
    { id: "diag-trace-recognition", title: "Read the trace before every injection", lessonIds: ["pm-engaging-trace", "hb-lab-and-radiation-dose"] },
    { id: "diag-prior-radiation", title: "A healing skin injury from the last procedure", lessonIds: ["hb-lab-and-radiation-reduce", "pm-acquiring-setup"] },
  ],
};
