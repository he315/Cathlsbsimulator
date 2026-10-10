// Launch metadata for the bifurcation bench (pci-bench-bifurcation). Engine-free: types only. The scenario
// ids are the ids of BIF_PRESETS (src/simulation/bench/bifurcation.ts); src/ui/lab/benchTips.bifurcation.test.ts
// checks both ways.
//
// Params: scenario (or preset) a bifurcation preset; start a step of the preset's technique, by id ("crush")
// or as "technique:step" where two techniques share the id ("tap:final-pot"), reached by the module's
// choices ("plan", the default, opens at the technique choice); technique and step (a number or an id) as
// the launch vocabulary has them, so a lesson can link {preset:'bif-dk-crush', technique:'dk-crush',
// step:'6'}; modality IVUS | OCT; mode. On the TAP preset a TAP start runs the provisional sequence first and
// escalates to TAP, which is how the module teaches it (TAP as the bail-out after provisional MV stenting).
//
// The titles name the vessel and the bifurcation, not the answer.
import type { LaunchFile, LaunchStart } from "../../../schema";

const PLAN: LaunchStart = { id: "plan", title: "From the technique choice" };
const CHOOSING = "cp-bifurcation-two-stent-choosing";

export const launch: LaunchFile = {
  sim: "pci-bench",
  scenarios: [
    {
      id: "bif-provisional",
      title: "Bifurcation bench: mid-LAD across a large diagonal",
      lessonIds: ["cp-bifurcation-provisional-setup", "cp-bifurcation-provisional-pot", "cp-bifurcation-provisional-sb", CHOOSING],
      caseIds: ["cp-bifurcation-provisional-case-lad-diagonal"],
      starts: [
        PLAN,
        { id: "position-mv-stent", title: "Wired and prepared: size and place the MV stent" },
        { id: "pot", title: "MV stent deployed: POT" },
        { id: "kiss", title: "Side branch rewired: kissing balloons" },
        { id: "final-pot", title: "Kissed: final POT" },
      ],
    },
    {
      id: "bif-tap",
      title: "Bifurcation bench: LAD and a diagonal at close to a right angle",
      lessonIds: ["cp-bifurcation-two-stent-t-tap", "cp-bifurcation-provisional-sb", CHOOSING, "cp-bifurcation-two-stent-crush-variants"],
      caseIds: ["cp-bifurcation-two-stent-case-diagonal-tap"],
      starts: [
        PLAN,
        { id: "deliver-sb-stent", title: "Provisional result, diagonal still compromised: TAP" },
        { id: "set-protrusion", title: "TAP: set the side-branch stent" },
        { id: "tap:kiss", title: "TAP: kiss" },
        { id: "tap:final-pot", title: "TAP: final POT" },
      ],
    },
    {
      id: "bif-dk-crush",
      title: "Bifurcation bench: distal left main, true bifurcation",
      lessonIds: ["cp-bifurcation-two-stent-dk-crush", CHOOSING, "cp-bifurcation-two-stent-crush-variants", "cp-left-main-distal"],
      caseIds: ["cp-bifurcation-two-stent-case-lm-dk-crush"],
      starts: [
        PLAN,
        { id: "position-sb-stent", title: "DK crush: place the side-branch stent" },
        { id: "crush", title: "DK crush: crush" },
        { id: "first-kiss", title: "DK crush: first kiss" },
        { id: "second-kiss", title: "DK crush: second kiss" },
        { id: "final-pot", title: "DK crush: final POT" },
      ],
    },
    {
      id: "bif-culotte",
      title: "Bifurcation bench: LAD and a diagonal of similar size",
      lessonIds: ["cp-bifurcation-two-stent-culotte", CHOOSING],
      starts: [
        PLAN,
        { id: "first-stent", title: "Culotte: the first stent" },
        { id: "pot", title: "Culotte: POT before recrossing" },
        { id: "second-stent", title: "Culotte: the second stent" },
        { id: "kiss", title: "Culotte: kiss" },
      ],
    },
  ],
};
