// Launch metadata for the full case's endovascular control and cold-leg scenarios (access-cx-endovascular-control;
// engine-free: types only). The ids, titles and lessons are those of scenarios/endovascular.ts. Every case opens at
// 'closure' (the sheath in, the catheter out) except livedo-not-ali, which opens in recovery. The three core bleeds
// (a large vessel, the common femoral artery after a large-bore case, a small branch) are listed under the femoral
// bleeding, large-bore and limb lessons (the limb lesson for the leg checked after the fix, 06-access-complications
// .ts:997); the other bleeds under the femoral bleeding lesson; the cold legs under the limb lesson. The titles do
// not name the injury or the cause. No mode is set: the learner's level decides.
//
// livedo-not-ali is listed under the limb lesson by a link that opens it on the fluoroscopy workspace, where the
// leg's controls are (EndovascularPanel under the image; the recovery workspace has none), as crossover.launch.ts
// does for its scenario; its scenario entry carries no lesson so that the lesson has one entry, the one that opens
// there.
import type { LaunchFile } from "../../../content/schema";

const BLEED = "cm-access-complications-femoral-bleeding";
const LARGE = "cm-access-complications-large-bore";
const LIMB = "cm-access-complications-limb";
const ON_TABLE = [{ id: "closure", title: "On the table, sheath in" }];
const IN_RECOVERY = [{ id: "recovery", title: "In recovery" }];

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "bleed-external-iliac", title: "A falling pressure on the table after a femoral case", lessonIds: [BLEED, LARGE, LIMB], starts: ON_TABLE },
    { id: "bleed-cfa", title: "Bleeding at the groin after a large-bore case", lessonIds: [BLEED, LARGE, LIMB], starts: ON_TABLE },
    { id: "bleed-iea-branch", title: "A falling pressure on the table after a femoral case (2)", lessonIds: [BLEED, LARGE, LIMB], starts: ON_TABLE },
    { id: "bleed-lcia-branch", title: "A falling pressure on the table after a femoral case (3)", lessonIds: [BLEED], starts: ON_TABLE },
    { id: "bleed-distal-pinhole", title: "A falling pressure on the table after a femoral case (4)", lessonIds: [BLEED], starts: ON_TABLE },
    { id: "dissection-iliac", title: "A painful foot at the end of a femoral case", lessonIds: [LIMB], starts: ON_TABLE },
    { id: "dissection-cfa", title: "A painful foot at the end of a femoral case (2)", lessonIds: [LIMB], starts: ON_TABLE },
    { id: "plug-intraluminal", title: "A painful foot after the groin was closed", lessonIds: [LIMB], starts: ON_TABLE },
    { id: "leg-embolus", title: "A painful foot at the end of a femoral case (3)", lessonIds: [LIMB], starts: ON_TABLE },
    { id: "livedo-not-ali", title: "Recovery: a painful foot after a femoral case", lessonIds: [], starts: IN_RECOVERY },
  ],
  links: [
    {
      scenario: "livedo-not-ali",
      start: "recovery",
      title: "Recovery: a painful foot after a femoral case",
      params: { workspace: "fluoro" },
      lessonIds: [LIMB],
    },
  ],
};
