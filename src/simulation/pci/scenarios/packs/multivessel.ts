// ---------------------------------------------------------------------------
// Multivessel scenario pack (pci-budgets-stop-rules).
//
//  - multivessel-stable: stable multivessel disease in a patient with chronic
//    kidney disease (eGFR 45) whose diagnostic study earlier the same day used
//    60 mL of contrast. Serial lesions in the RCA (a moderate proximal and a
//    severe distal stenosis), a severe proximal LAD and a severe circumflex
//    stenosis, and a non-critical distal left main. The RCA is the target
//    opened first; the lab tracks the contrast against the patient's ceiling
//    (3.7 × 45 = 166.5 mL less the 60 mL given this morning: 106.5 mL,
//    src/simulation/pci/budgets.ts), the air kerma and the elapsed time, and
//    the stop-or-continue checkpoint asks whether to finish, stage or stop as
//    the counters rise (pm-target-timing: treat the lesion in hand, stage the
//    rest when contrast or dose is high, Brilakis 7.3 and 7.4).
//
// The engine treats one target at a time; the other lesions are drawn, carried
// by the patient engine and named in the brief, and are what the learner
// stages. The lesion values and the vignette are teaching values of a
// synthetic case (the age, sex and other risk factors are the seed's patient,
// so the vignette names none). The patient facts are cited: eGFR 45 is the plan's worked
// example (lab-build-plan.json, pci-budgets-stop-rules acceptance), and recent
// contrast is counted against the ceiling as the module text says
// (complication-management/05-patient-complications.ts:698-699). The anatomy
// is the lab's generic tree (right dominance, normal root, radial access).
// ---------------------------------------------------------------------------

import type { PciScenarioDef } from "../types";
import { STANDARD_PCI_STARTS } from "./core";

const starts = () => STANDARD_PCI_STARTS.map((s) => ({ ...s }));

export const scenarios: PciScenarioDef[] = [
  {
    id: "multivessel-stable",
    title: "Stable multivessel disease with kidney disease",
    brief:
      "Synthetic case. Class III angina despite medical therapy, with chronic kidney disease (eGFR 45 mL/min/1.73 m²). The diagnostic study this morning used 60 mL of contrast and showed serial RCA stenoses (moderate proximal, severe distal), a severe proximal LAD stenosis, a severe mid-circumflex stenosis and a non-critical distal left main. The heart team favoured PCI. Treat the RCA first; decide at each checkpoint whether to go on to the left system today or stage it.",
    epa: "pci-simple",
    difficulty: 4,
    side: "right",
    anatomy: { dominance: "right", rootSize: "normal", tortuosity: 0, variants: [] },
    lesions: [
      { vessel: "RCA", position: 0.15, severity: 60, lengthMm: 8, kind: "moderate-stenosis", calcium: 0, role: "non-culprit" },
      { vessel: "RCA", position: 0.62, severity: 85, lengthMm: 12, kind: "severe-stenosis", calcium: 0, role: "target" },
      { vessel: "LAD", position: 0.25, severity: 80, lengthMm: 14, kind: "severe-stenosis", calcium: 0, role: "non-culprit" },
      { vessel: "LCx", position: 0.45, severity: 75, lengthMm: 10, kind: "severe-stenosis", calcium: 0, role: "non-culprit" },
      { vessel: "LM", position: 0.8, severity: 40, lengthMm: 5, kind: "mild-irregularity", calcium: 0, role: "bystander" },
    ],
    target: 1,
    patient: { accessRoute: "radial-right", eGfr: 45, priorContrastMl: 60 },
    setup: { guideDefault: "JR4", french: 6, heparinised: true, guideInRoot: true },
    starts: starts(),
    views: ["rcalao", "rcarao", "rcacranial"],
    points: [
      "Set the contrast ceiling at the brief from the patient's eGFR, and subtract the contrast already given today: 3.7 × 45 less 60 mL leaves about 106 mL.",
      "With serial lesions in one artery, treat the distal one first unless the proximal lesion damps the guide, causes ischaemia or blocks devices, and finish every significant lesion in that artery in this sitting.",
      "When contrast or dose is already high, finish the lesion in hand and stage the rest, especially the complex ones.",
      "Use the contrast-sparing moves: small injections, the wire as a roadmap, imaging instead of extra runs.",
    ],
  },
];
