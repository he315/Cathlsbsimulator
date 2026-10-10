// Launch metadata for the full case's upsizing, sheath preparation and femoral angiogram scenarios
// (access-femoral-upsizing-angiogram; engine-free: types only). The ids, titles and lessons are those of
// scenarios/upsizing.ts. Each opens at its own start (the team has punctured: the micro-wire in, or the
// sheath in), so the lessons list the scenario entry itself. The two angiogram cases are also linked on
// their own at the fluoroscopy workspace, where the angiogram is taken and read. No mode is set: the
// learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const SHEATH = "pm-access-femoral-sheath";
const TROUBLE = "pm-access-troubleshoot";
const TABLE = "pm-to-the-root-table";
const RADIAL_SHEATH = "pm-access-radial-sheath";
const MICRO_WIRE_IN = [{ id: "access", title: "Micro-wire in, screened" }];
const SHEATH_IN = [{ id: "access", title: "Sheath in, over a wire" }];

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "fem-upsizing", title: "Femoral sheath: upsize, prepare and image", lessonIds: [SHEATH, TROUBLE, TABLE], starts: MICRO_WIRE_IN },
    { id: "fem-obese-scar", title: "Femoral sheath: the dilator will not pass (1)", lessonIds: [SHEATH, TROUBLE, TABLE], starts: MICRO_WIRE_IN },
    { id: "fem-kinked-micro-wire", title: "Femoral sheath: the dilator will not pass (2)", lessonIds: [SHEATH, TROUBLE, TABLE], starts: MICRO_WIRE_IN },
    { id: "fem-poor-track", title: "Femoral sheath: the sheath will not advance", lessonIds: [TROUBLE, SHEATH], starts: MICRO_WIRE_IN },
    { id: "fem-wire-kinks", title: "Femoral sheath: the wire bends as the sheath goes in", lessonIds: [TROUBLE, SHEATH], starts: MICRO_WIRE_IN },
    { id: "fem-subintimal-sheath", title: "Femoral sheath: check it before you use it", lessonIds: [TROUBLE, SHEATH], starts: MICRO_WIRE_IN },
    { id: "fem-angio-high", title: "Femoral angiogram: where did it go in? (1)", lessonIds: [], starts: SHEATH_IN },
    { id: "fem-angio-below-bif", title: "Femoral angiogram: where did it go in? (2)", lessonIds: [], starts: SHEATH_IN },
    { id: "radial-sheath-prep", title: "Radial sheath: clear it before the catheter", lessonIds: [TABLE, RADIAL_SHEATH], starts: [{ id: "access", title: "Sheath just in" }] },
  ],
  links: [
    { scenario: "fem-angio-high", start: "access", title: "Femoral angiogram: where did it go in? (1)", params: { workspace: "fluoro" }, lessonIds: [SHEATH] },
    { scenario: "fem-angio-below-bif", start: "access", title: "Femoral angiogram: where did it go in? (2)", params: { workspace: "fluoro" }, lessonIds: [SHEATH] },
  ],
};
