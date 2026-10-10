// Engine-free practice links of angio-expert-label-drills (found-launch-links): the reading drills of the
// Real angiograms section that are scored against a supervising reader's labels (src/ui/angio/labels.ts),
// listed under the lessons they practise. 'timi' and 'frame-count' open the simulated-run drill
// (src/ui/angio/simFlowDrill.ts), whose flow the engine knows, until at least 20 library runs carry labels
// for them, and the real-run drill afterwards. The other drills say 'not yet labelled' until their labels
// exist. The ids must match LABEL_DRILL_IDS in labels.ts (labels.test.ts checks).
import type { LaunchFile } from "../schema";

export const launch: LaunchFile = {
  sim: "angio-real",
  drills: [
    { id: "timi", title: "Grade TIMI flow on cine runs", lessonIds: ["pm-interpreting-flow"] },
    { id: "frame-count", title: "Count TIMI frames at the run's frame rate", lessonIds: ["pm-interpreting-flow"] },
    { id: "morphology", title: "Describe the lesion: thrombus, calcium and dissection (expert-labelled runs)", lessonIds: ["pm-interpreting-morphology"] },
    { id: "collateral-grade", title: "Grade collaterals: Rentrop, Werner and the channel (expert-labelled runs)", lessonIds: ["pm-interpreting-collaterals"] },
    { id: "medina", title: "Score bifurcations by Medina (expert-labelled runs)", lessonIds: ["cp-bifurcation-provisional-assess"] },
    { id: "calcium", title: "Grade calcium before the contrast arrives (expert-labelled runs)", lessonIds: ["cp-calcium-recognise"] },
    { id: "classify", title: "Classify the lesion: ACC/AHA type and SCAI class (expert-labelled runs)", lessonIds: ["pm-planning-classification"] },
    { id: "segment", title: "Name the SYNTAX segment by dominance (expert-labelled runs)", lessonIds: ["pm-acquiring-anatomy"] },
  ],
};
