// Launch metadata for the full case's recovery ward scenarios (proc-recovery-ward; engine-free: types only).
// The ids, titles and lessons are those of scenarios/ward.ts. The ward scenarios open at 'recovery' (the team has
// done the case and closed the site; the learner writes the ward plan and runs the ward) and are listed under the
// recovery lesson (hb-after-the-procedure-monitoring), the monitoring lesson (pm-monitoring-watch) and, for those
// whose arrival neurological check and late deficit belong to it, the stroke lesson (cm-flow-embolism-stroke). The
// stroke on the table opens at 'post-diagnostic' (the catheter at the root) under pm-to-the-root-advance and the
// stroke lesson; the cholesterol follow-up opens at 'recovery' under the cholesterol embolisation lesson. The titles do
// not give the problem away. No mode is set: the learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const MONITORING = "hb-after-the-procedure-monitoring";
const WATCH = "pm-monitoring-watch";
const STROKE = "cm-flow-embolism-stroke";
const CHOLESTEROL = "cm-flow-embolism-oedema-cholesterol";
const TO_THE_ROOT = "pm-to-the-root-advance";
const ON_WARD = [{ id: "recovery", title: "On the ward after closure" }];
const AT_ROOT = [{ id: "post-diagnostic", title: "Catheter at the root" }];

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "ward-radial", title: "On the ward after a radial case (1)", lessonIds: [MONITORING, WATCH, STROKE], starts: ON_WARD },
    { id: "ward-femoral-6f", title: "On the ward after a femoral case", lessonIds: [MONITORING, WATCH, STROKE], starts: ON_WARD },
    { id: "ward-forearm-haematoma", title: "On the ward after a radial case (2)", lessonIds: [MONITORING, WATCH, STROKE], starts: ON_WARD },
    { id: "ward-chest-pain-post-pci", title: "On the ward after a stent (1)", lessonIds: [MONITORING, WATCH], starts: ON_WARD },
    { id: "ward-tamponade-after-perforation", title: "On the ward after a stent (2)", lessonIds: [MONITORING], starts: ON_WARD },
    { id: "ward-stroke-late", title: "On the ward after a radial case (3)", lessonIds: [STROKE, MONITORING], starts: ON_WARD },
    { id: "ward-creatinine-rise", title: "After a long case: the review", lessonIds: [MONITORING], starts: ON_WARD },
    { id: "table-embolic-stroke", title: "Back at the root after the films", lessonIds: [TO_THE_ROOT, STROKE], starts: AT_ROOT },
    { id: "followup-cholesterol-emboli", title: "Follow-up: painful feet", lessonIds: [CHOLESTEROL], starts: ON_WARD },
  ],
};
