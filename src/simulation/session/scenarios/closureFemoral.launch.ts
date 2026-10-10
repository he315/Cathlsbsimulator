// Launch metadata for the full case's femoral closure scenarios (access-closure-femoral-manual;
// engine-free: types only). The ids, titles and lessons are those of scenarios/closureFemoral.ts. Every
// one opens at 'closure' (the sheath in, the catheter out): the closure algorithm's cases under the
// planning lesson, the three core ones also under the compression and heparin lessons; the compression
// cases under the compression lesson, the reactions also under the vasovagal and tamponade lessons and
// the high ACT also under the heparin lesson. The titles do not give the anatomy or the reaction away.
// No mode is set: the learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const PLAN = "pm-closure-plan";
const COMPRESS = "pm-closure-femoral-compression";
const HEPARIN = "pm-antithrombotics-heparin";
const VAGAL = "cm-patient-complications-vasovagal";
const TAMPONADE = "cm-perforation-tamponade";
const AT_CLOSURE = [{ id: "closure", title: "Sheath in, catheter out" }];

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "closure-fem-standard", title: "Femoral closure: plan it and press", lessonIds: [PLAN, COMPRESS, HEPARIN], starts: AT_CLOSURE },
    { id: "closure-fem-high-stick", title: "Femoral closure: read the entry first (1)", lessonIds: [PLAN, COMPRESS, HEPARIN], starts: AT_CLOSURE },
    { id: "closure-fem-below-bif", title: "Femoral closure: read the entry first (2)", lessonIds: [PLAN, COMPRESS, HEPARIN], starts: AT_CLOSURE },
    // closure-fem-branch is linked to no lesson until the femoral angiogram draws the sheath in the branch
    { id: "closure-fem-branch", title: "Femoral closure: read the entry first (3)", lessonIds: [], starts: AT_CLOSURE },
    { id: "closure-fem-small-artery", title: "Femoral closure: size the artery", lessonIds: [PLAN], starts: AT_CLOSURE },
    { id: "closure-fem-calcified", title: "Femoral closure: read the entry first (4)", lessonIds: [PLAN], starts: AT_CLOSURE },
    { id: "closure-fem-old-plug", title: "Femoral closure: read the entry first (5)", lessonIds: [PLAN], starts: AT_CLOSURE },
    { id: "closure-fem-staged-pci", title: "Femoral closure: plan it (2)", lessonIds: [PLAN], starts: AT_CLOSURE },
    { id: "compression-vagal", title: "Femoral compression: unwell under your hands", lessonIds: [COMPRESS, VAGAL], starts: AT_CLOSURE },
    { id: "compression-tamponade-mimic", title: "Femoral compression: hypotension after a PCI", lessonIds: [COMPRESS, VAGAL, TAMPONADE], starts: AT_CLOSURE },
    { id: "compression-act-high", title: "Femoral compression: when may the sheath come out?", lessonIds: [COMPRESS, HEPARIN], starts: AT_CLOSURE },
  ],
};
