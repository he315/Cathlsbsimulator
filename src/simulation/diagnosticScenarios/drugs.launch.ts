// Engine-free launch metadata for the scenarios of drugs.ts (diag-lab-drugs, with found-launch-links):
// the lessons each one practises. The ids, titles and lessons must match drugs.ts (scenarios.test.ts
// checks).
import type { LaunchFile } from "../../content/schema";

export const launch: LaunchFile = {
  sim: "cathlab",
  scenarios: [
    { id: "diag-nitrate-dose-by-pressure", title: "Intracoronary nitrate: dose it by the pressure", lessonIds: ["pm-acquiring-test-nitrate", "pm-lab-drugs-nitrates", "pm-interpreting-spasm"] },
    { id: "diag-pde5-patient", title: "Tadalafil yesterday: is nitrate safe?", lessonIds: ["pm-lab-drugs-nitrates", "pm-planning-preparation"] },
    { id: "diag-nitrate-hypotension", title: "The pressure falls after nitrate", lessonIds: ["cm-patient-complications-hypotension", "pm-lab-drugs-nitrates"] },
    { id: "diag-nitrate-on-infusion", title: "On a nitrate infusion: a blunted bolus", lessonIds: ["pm-lab-drugs-nitrates"] },
  ],
};
