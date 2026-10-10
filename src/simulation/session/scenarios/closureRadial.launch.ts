// Launch metadata for the full case's radial closure scenarios (access-closure-radial; engine-free: types only).
// The ids, titles and lessons are those of scenarios/closureRadial.ts. The three closure drills open at
// 'closure' (the sheath in, the catheter out) and are listed under the radial closure lesson, the spasm lesson
// and the lesson on radial spasm at removal and late radial problems: each keeps the vasodilator before removal
// and a sheath that can grip. The high-ACT case is also under the heparin lesson, the flat-needle case under the
// forearm bleeding lesson. The proximal haematoma (the team's band centred distal to the hole, the sheath already
// out and the forearm filling) opens at 'closure' under the radial closure and forearm bleeding lessons. The two
// follow-up vignettes start from 'closure' (the team closes the wrist, the band comes off, and the closure
// workspace shows the follow-up form), under the late radial problems lesson. The titles do not give the problem away. No mode is set: the learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const RADIAL = "pm-closure-radial";
const SPASM = "pm-engaging-spasm";
const OTHER = "cm-access-complications-radial-other";
const BLEEDING = "cm-access-complications-radial-bleeding";
const HEPARIN = "pm-antithrombotics-heparin";
const AT_CLOSURE = [{ id: "closure", title: "Sheath in, catheter out" }];
// the follow-ups open on the closure workspace, where the follow-up form is (the team closes the wrist first)
const FOLLOW_UP = [{ id: "closure", title: "Follow-up after the case" }];

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "closure-radial-7fr-act320-gpi", title: "Radial closure: a big sheath, a long ACT", lessonIds: [RADIAL, SPASM, OTHER, HEPARIN], starts: AT_CLOSURE },
    { id: "closure-radial-flat-needle", title: "Radial closure: where is the hole?", lessonIds: [RADIAL, SPASM, OTHER, BLEEDING], starts: AT_CLOSURE },
    { id: "closure-radial-spasm-grip", title: "Radial closure: the sheath will not come", lessonIds: [RADIAL, SPASM, OTHER], starts: AT_CLOSURE },
    { id: "closure-radial-proximal-haematoma", title: "Radial closure: the forearm after the band", lessonIds: [RADIAL, BLEEDING], starts: AT_CLOSURE },
    { id: "radial-late-psa", title: "Radial follow-up: a lump at the wrist (1)", lessonIds: [OTHER], starts: FOLLOW_UP },
    { id: "radial-late-granuloma", title: "Radial follow-up: a lump at the wrist (2)", lessonIds: [OTHER], starts: FOLLOW_UP },
  ],
};
