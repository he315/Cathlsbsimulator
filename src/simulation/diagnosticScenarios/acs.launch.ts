// Engine-free launch metadata for the scenarios of acs.ts (diag-acs-scenarios): the lessons each one
// practises. The ids, titles and lessons must match acs.ts (scenarios.test.ts checks). The culprit
// study diag-two-candidate-culprits belongs to lesions.launch.ts; this package gives it its previous
// study (ACS_CASES in acs.ts) without relisting it.
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-stemi-anterior", title: "STEMI call: predict the artery, then engage", lessonIds: ["cp-acs-thrombus-ecg", "pm-target-culprit"] },
    { id: "diag-stemi-inferior-rv", title: "Chest pain and a slow pulse: predict, then image", lessonIds: ["cp-acs-thrombus-ecg", "pm-target-culprit"] },
    { id: "diag-stemi-posterior", title: "Crushing chest pain: which leads?", lessonIds: ["cp-acs-thrombus-ecg", "pm-target-culprit"] },
    { id: "diag-lbbb-paced", title: "Ongoing pain and a wide QRS: activate or not?", lessonIds: ["cp-acs-thrombus-ecg"] },
    { id: "diag-ohca-st-elevation", title: "Resuscitated collapse at a station: where next?", lessonIds: ["cp-complex-patients-ohca"] },
    { id: "diag-ohca-no-st", title: "Resuscitated collapse at home: where next?", lessonIds: ["cp-complex-patients-ohca"] },
    { id: "diag-scad-postpartum", title: "Postpartum STEMI: engage gently, inject softly", lessonIds: ["cp-other-complex-scad", "cp-acs-thrombus-ecg"] },
    { id: "diag-no-visible-culprit", title: "An ACS with no visible culprit: the next steps", lessonIds: ["pm-target-culprit"] },
    { id: "diag-iatrogenic-occlusion", title: "New ST elevation during the study", lessonIds: ["cm-principles-closure-pmi"] },
  ],
};
