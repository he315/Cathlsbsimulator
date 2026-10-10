// Engine-free launch metadata for the scenarios of grafts.ts (diag-grafts-svg, with found-launch-links): the lessons
// each one practises. The ids, titles and lessons must match grafts.ts (scenarios.test.ts checks). diag-graft-search,
// the first post-CABG case, is listed by core.launch.ts under cp-prior-cabg-svg-find.
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-graft-imaging-competitive-flow", title: "Image the vein grafts and read competitive flow", lessonIds: ["cp-prior-cabg-svg-image"] },
    { id: "diag-graft-roadmap-aortogram", title: "Graft not found: the aortogram as a road map", lessonIds: ["hb-cardiac-catheterisation-aortography", "hb-background-depth"] },
    { id: "diag-long-svg-run", title: "A long vein graft: film until the distal bed fills", lessonIds: ["pm-acquiring-cine", "cp-prior-cabg-svg-image"] },
  ],
};
