// Launch metadata for the full case's discharge prescription scenarios (proc-discharge-prescription; engine-free:
// types only). The ids, titles and lessons are those of scenarios/discharge.ts. Each opens at 'recovery' (the team
// has done the PCI and closed the site; the learner writes the discharge prescription). All are listed under the
// discharge antiplatelet lesson (hb-after-the-procedure-dapt); those whose P2Y12 choice turns on the presentation or
// the anticoagulant also under the oral antiplatelet lesson (pm-antithrombotics-oral). The titles do not give the
// classification away. No mode is set: the learner's level decides.
import type { LaunchFile } from "../../../content/schema";

const DAPT = "hb-after-the-procedure-dapt";
const ORAL = "pm-antithrombotics-oral";
const AT_DISCHARGE = [{ id: "recovery", title: "PCI done: the discharge prescription" }];

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "dapt-stable", title: "Discharge after elective PCI (1)", lessonIds: [DAPT, ORAL], starts: AT_DISCHARGE },
    { id: "dapt-acs", title: "Discharge after PCI for NSTEMI (1)", lessonIds: [DAPT, ORAL], starts: AT_DISCHARGE },
    { id: "dapt-hbr-one-major", title: "Discharge after PCI for NSTEMI (2)", lessonIds: [DAPT, ORAL], starts: AT_DISCHARGE },
    { id: "dapt-hbr-two-minor", title: "Discharge after elective PCI (2)", lessonIds: [DAPT], starts: AT_DISCHARGE },
    { id: "dapt-af-acs", title: "Discharge on an anticoagulant (1)", lessonIds: [DAPT, ORAL], starts: AT_DISCHARGE },
    { id: "dapt-af-ischaemic", title: "Discharge on an anticoagulant (2)", lessonIds: [DAPT], starts: AT_DISCHARGE },
    { id: "dapt-surgery-planned", title: "Discharge with an operation planned", lessonIds: [DAPT], starts: AT_DISCHARGE },
  ],
};
