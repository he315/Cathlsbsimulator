// The full case's default scenario (proc-foundation-scenarios-ledger): a random patient with
// nothing overridden, opened at the chart. 'New patient' opens it; a lesson link may ask for any
// start stage, and the autopilot plays the case to that stage with clean technique.
import type { ProcedureScenario } from "./index";

export const scenarios: ProcedureScenario[] = [
  {
    id: "default",
    title: "Random patient",
    lessonIds: ["pm-access-seldinger"],
  },
];
