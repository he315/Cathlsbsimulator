// Launch metadata for the multivessel scenario pack (pci-budgets-stop-rules; engine-free: types only).
//
// Scenario ids, titles and starts match ./multivessel.ts (the registry checks). The links follow
// lab-build-plan.json's lessonAndCaseLinks for this package: the contrast and planning lessons link to
// rca-calcified (the contrast-budget lesson; see the note at its link) and multivessel-stable; the CTO stop rules to rca-cto at its 'long-case'
// variant, which this file adds: the attempt opens part-way through a long case (100 minutes, 4.5 Gy,
// 150 mL: BUDGET_CARRY_VARIANTS in src/simulation/pci/budgets.ts), so the 5 Gy rule and the checkpoint are
// reached within the session. The radiation lessons list both. Links already declared by the core pack's
// launch file (rca-calcified under pm-planning-bailout, lad-focal under cm-patient-complications-contrast-budget,
// rca-cto under cm-principles-closure-stopping and cm-patient-complications-radiation) are not repeated.
import type { LaunchFile } from "../../../../content/schema";

const starts = [
  { id: "guide-in-root", title: "Guide in the aortic root" },
  { id: "guide-engaged", title: "Guide engaged" },
  { id: "wire-across", title: "Wire across the lesion" },
];

const LONG_CASE = { id: "long-case", title: "Long attempt: 100 minutes in, 4.5 Gy" };

export const launch: LaunchFile = {
  sim: "angio-pci",
  scenarios: [
    {
      id: "multivessel-stable",
      title: "Stable multivessel disease with kidney disease",
      lessonIds: [
        "cm-patient-complications-contrast-budget",
        "cm-patient-complications-kidney",
        "cm-patient-complications-radiation",
        "cm-principles-closure-stopping",
        "pm-planning-bailout",
        "pm-target-timing",
      ],
      starts,
    },
  ],
  links: [
    // rca-calcified's brief describes kidney disease, but its definition sets no renal facts yet (the engine draws the
    // seed's patient), so it is linked under the contrast-budget lesson only; the kidney lesson opens multivessel-stable
    { scenario: "rca-calcified", lessonIds: ["cm-patient-complications-contrast-budget"] },
    {
      scenario: "rca-cto",
      variant: "long-case",
      title: "Chronic total occlusion of the mid RCA · a long attempt at the stop rules",
      lessonIds: ["cp-cto-strategy-hybrid", "cm-principles-closure-stopping", "cm-patient-complications-contrast-budget", "cm-patient-complications-kidney", "cm-patient-complications-radiation"],
      adds: { variants: [LONG_CASE] },
    },
  ],
};
