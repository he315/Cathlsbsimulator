// Engine-free launch metadata for the scenarios of runs.ts (diag-injection-run-quality, with
// found-launch-links): the lessons each one practises. The ids, titles and lessons must match runs.ts
// (scenarios.test.ts checks).
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-streaming-weak-injection", title: "Runs that stream: fill the artery or call it non-diagnostic", lessonIds: ["pm-acquiring-cine", "pm-interpreting-pitfalls", "pm-interpreting-anomalies"] },
    { id: "diag-high-flow-as-streaming", title: "High coronary flow in severe aortic stenosis: streaming that is not disease", lessonIds: ["pm-interpreting-pitfalls", "cp-complex-patients-tavr-before", "pm-acquiring-cine"] },
    { id: "diag-4fr-ectatic", title: "A small diagnostic catheter in a large ectatic RCA", lessonIds: ["pm-acquiring-cine", "pm-interpreting-morphology"] },
    { id: "diag-short-lm-superselective", title: "The missing circumflex of a short left main", lessonIds: ["pm-interpreting-pitfalls", "pm-engaging-left"] },
    { id: "diag-run-mechanics", title: "Recording a run: pedal, push, breath-hold and panning", lessonIds: ["pm-acquiring-cine"] },
    { id: "diag-qfr-acquisition", title: "Filming an intermediate lesion for angiography-derived FFR", lessonIds: ["pm-physiology-derived", "pm-acquiring-views"] },
  ],
};
