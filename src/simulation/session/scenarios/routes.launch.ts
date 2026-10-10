// Launch metadata for the full case's route-decision scenarios (engine-free: types only). Each scenario
// is listed under the lessons it practises (the same lessonIds as scenarios/routes.ts): the five-step
// cases under the site-choice lesson, the peripheral findings under the peripheral background lesson,
// the radial spasm cases under the spasm lesson, and lima-graft, whose access-site haematoma is found
// only by inspecting the site, under the monitoring lesson too. The planning scenario 'dialysis-fistula'
// (scenarios/planning.ts) is linked here under the site-choice lesson (a fistula arm is one of step 1's
// exclusions) and the peripheral background lesson (its history step asks about dialysis fistulas).
// Every case opens at the chart, before the route is chosen; no mode is set, so the learner's level
// decides.
import type { LaunchFile } from "../../../content/schema";

const SITE = "pm-access-site-choice";
const PERIPHERAL = "hb-background-peripheral";
const SPASM = "pm-engaging-spasm";
const WATCH = "pm-monitoring-watch";

export const launch: LaunchFile = {
  sim: "procedure",
  scenarios: [
    { id: "lima-graft", title: "Route choice: a patient with a LIMA graft", lessonIds: [SITE, WATCH] },
    { id: "arteria-lusoria", title: "Route choice: an abnormal right subclavian on CT", lessonIds: [SITE, PERIPHERAL] },
    { id: "complex-pci-8fr", title: "Route and sheath for a calcified CTO", lessonIds: [SITE] },
    { id: "impalpable-femorals", title: "Route choice: claudication in both calves", lessonIds: [PERIPHERAL] },
    { id: "axillofemoral-graft", title: "Peripheral disease: an axillofemoral graft", lessonIds: [PERIPHERAL] },
    { id: "aaa-mural-thrombus", title: "Peripheral disease: an aneurysm with thrombus", lessonIds: [PERIPHERAL] },
    { id: "right-groin-plug-60d", title: "Route choice: a recent closure device in the groin", lessonIds: [SITE, PERIPHERAL] },
    { id: "spasm-high-risk", title: "Radial access planning (1)", lessonIds: [SPASM] },
    { id: "very-small-radial", title: "Radial access planning (2)", lessonIds: [SPASM] },
  ],
  links: [{ scenario: "dialysis-fistula", title: "Route choice: a dialysis fistula in the arm", lessonIds: [SITE, PERIPHERAL] }],
};
