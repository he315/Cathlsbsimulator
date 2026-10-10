// Engine-free launch metadata for the scenarios of leftHeart.ts (diag-lv-aorta-task, with
// found-launch-links): the lessons each one practises. The ids, titles and lessons must match
// leftHeart.ts (scenarios.test.ts checks).
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-lv-gram-task", title: "The ventriculogram as a task: cross, LVEDP, injector, clean cycle, pullback", lessonIds: ["hb-cardiac-catheterisation-lv-gram", "hb-cardiac-catheterisation-lhc"] },
    { id: "diag-lv-gram-reading-set", title: "Reading ventriculograms: wall motion, territory, MR and the ungradable run", lessonIds: ["hb-cardiac-catheterisation-lv-gram", "hb-background-silhouette", "hb-specific-conditions-mitral"] },
    { id: "diag-aortogram-ar-grading", title: "The aortogram: clear of the leaflets, and the regurgitation graded", lessonIds: ["hb-cardiac-catheterisation-aortography", "hb-specific-conditions-ar-right"] },
    { id: "diag-difficult-valve-crossing", title: "The pigtail will not cross: the difficult-valve sequence", lessonIds: ["hb-cardiac-catheterisation-lhc"] },
    { id: "diag-as-cross-or-not", title: "Severe aortic stenosis: cross, or not?", lessonIds: ["hb-cardiac-catheterisation-lhc", "hb-specific-conditions-as"] },
    { id: "diag-tavi-workup", title: "The TAVI work-up study: coronaries, aortogram and the iliofemoral run", lessonIds: ["cp-complex-patients-tavr-before"] },
    { id: "diag-lv-stain-tamponade", title: "Against the wall: the test injection, the stain and the tamponade that follows", lessonIds: ["hb-cardiac-catheterisation-lv-gram", "cm-perforation-tamponade"] },
  ],
};
