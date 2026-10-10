// Launch metadata for the full case's planning scenarios (engine-free: types only). Each scenario is
// listed under the lessons it practises (the same lessonIds as scenarios/planning.ts): the chart
// review cases under the planning lessons that teach their problem, the checklist case, which opens
// ready to puncture, under the table set-up lesson that teaches Oxford's pre-puncture checklist. The
// anticoagulant, kidney and metformin chart reviews are listed under that lesson too: each opens at
// the chart, so the checklist is part of the case.
// No mode is set: the learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const ASSESS = "pm-planning-assessment";
const PREP = "pm-planning-preparation";
const CONSENT = "pm-planning-consent";
const TABLE = "pm-to-the-root-table";

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "doac-recent", title: "Chart review: a recent anticoagulant dose", lessonIds: [ASSESS, PREP, TABLE] },
    { id: "warfarin-inr-unchecked", title: "Chart review: warfarin and the INR", lessonIds: [ASSESS, PREP, TABLE] },
    { id: "metformin-ckd", title: "Chart review: diabetes and the kidneys", lessonIds: [ASSESS, PREP, TABLE] },
    { id: "contrast-allergy-unpremedicated", title: "Chart review: a previous contrast reaction", lessonIds: [PREP] },
    { id: "pde5-24h", title: "Chart review: the patient's own medicines", lessonIds: [PREP] },
    { id: "closure-device-90d", title: "Chart review: the groin history", lessonIds: [ASSESS] },
    { id: "dialysis-fistula", title: "Chart review: the arms", lessonIds: [ASSESS] },
    { id: "bloods-old", title: "Chart review: the blood results", lessonIds: [ASSESS] },
    { id: "surgery-planned", title: "Chart review: can this patient have a stent?", lessonIds: [ASSESS] },
    { id: "dnacpr-unsuspended", title: "Chart review: resuscitation status", lessonIds: [CONSENT] },
    { id: "pregnancy-test", title: "Chart review: a young woman before angiography", lessonIds: [ASSESS] },
    { id: "checklist", title: "Pre-puncture checklist", lessonIds: [TABLE], starts: [{ id: "access", title: "Ready to puncture" }] },
  ],
};
