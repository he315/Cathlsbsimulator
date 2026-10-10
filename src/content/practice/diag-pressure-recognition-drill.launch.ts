// Engine-free practice links of diag-pressure-recognition-drill (found-launch-links): the timed pressure-trace
// recognition drill (src/ui/sections/PressureTrainer.tsx, items in src/simulation/pressureDrill.ts), one
// scenario per set of traces, listed under the two lessons of pm-engaging that teach reading the trace and
// working a damped one (src/content/manual/pci-manual/07-engaging.ts). The trainer reads the set from the
// scenario id or from a 'set' param (damping, hypotension, faults, all); the ids must match
// DRILL_SCENARIO_OF_SET in pressureDrill.ts (pressureDrill.test.ts checks).
import type { LaunchFile } from "../schema";

const LESSONS = ["pm-engaging-trace", "pm-engaging-damping"];

export const launch: LaunchFile = {
  sim: "pressure",
  scenarios: [
    { id: "pressure-damping", title: "Pressure drill: damped, ventricularised, or only looks it", lessonIds: LESSONS },
    { id: "pressure-hypotension", title: "Pressure drill: a low trace, catheter, line or patient", lessonIds: LESSONS },
    { id: "pressure-faults", title: "Pressure drill: line faults that damp every trace", lessonIds: LESSONS },
    { id: "pressure-all", title: "Pressure drill: every pattern against the clock", lessonIds: LESSONS },
  ],
};
