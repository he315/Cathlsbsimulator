// Launch metadata for the core PCI scenario pack (engine-free: types only).
//
// Scenario ids and starts match ./core.ts (scenarios.test.ts checks). The lessons listed are those
// whose PCI-lab drill names the scenario in its task ("In the PCI lab (calcified mid-RCA) ..."), so
// each of them shows 'Practise this in the lab' for it. The variants are the practice rungs of the
// EPA's PCI ladder (src/content/mentor/catalogue.ts): ids pci-<scenario>~L0 .. ~L24, that is
// (rungs - 1) x practicePerRung of LADDER_PARAMS; launch.test.ts checks the count against the
// catalogue. The held-out exam variants (~X) are not declared, so no lesson or case can link them.
import type { LaunchFile, LaunchVariant } from "../../../../content/schema";

const PRACTICE_VARIANTS = 25;

const ladder = (id: string): LaunchVariant[] =>
  Array.from({ length: PRACTICE_VARIANTS }, (_, i) => ({ id: `pci-${id}~L${i}`, title: `ladder variant L${i}` }));

const starts = [
  { id: "guide-in-root", title: "Guide in the aortic root" },
  { id: "guide-engaged", title: "Guide engaged" },
  { id: "wire-across", title: "Wire across the lesion" },
];

export const launch: LaunchFile = {
  sim: "angio-pci",
  scenarios: [
    {
      id: "lad-focal",
      title: "Focal mid-LAD stenosis",
      lessonIds: [
        "pm-antithrombotics-heparin",
        "pm-interpreting-stenosis",
        "pm-wiring-guide-choice",
        "pm-wiring-wire-choice",
        "pm-wiring-shape-load",
        "pm-prep-and-stent-balloon-inflate",
        "pm-physiology-after-pci",
        "pm-imaging-optimisation",
        "cp-ostial-branch-prep",
        "cp-bifurcation-provisional-setup",
        "cp-bifurcation-provisional-jailed",
        "cp-bifurcation-provisional-sb",
        "cp-left-main-technique",
        "cm-principles-closure-acute",
        "cm-principles-closure-side-branch",
        "cm-equipment-loss-wire",
        "cm-patient-complications-contrast-budget",
        "hb-lab-and-radiation-reduce",
      ],
      starts,
      variants: ladder("lad-focal"),
    },
    {
      id: "rca-calcified",
      title: "Calcified mid-RCA stenosis",
      lessonIds: [
        "pm-planning-bailout",
        "pm-monitoring-position",
        "pm-lab-drugs-microvascular",
        "pm-interpreting-morphology",
        "pm-wiring-guide-choice",
        "pm-wiring-wire-choice",
        "pm-wiring-tortuosity",
        "pm-prep-and-stent-prep-why",
        "pm-prep-and-stent-delivery",
        "pm-prep-and-stent-support",
        "cp-ostial-prep",
        "cp-calcium-recognise",
        "cp-calcium-setup",
        "cp-calcium-rota-complications",
        "cp-uncrossable-first-line",
        "cp-uncrossable-ablation-subintimal",
        "cp-uncrossable-extension-combined",
        "cp-uncrossable-undilatable-beyond",
        "cm-principles-closure-forecast",
        "cm-perforation-classify",
        "cm-perforation-large-vessel",
        "cm-equipment-loss-stent",
        "eq-sheaths-guides-extension-device",
        "eq-sheaths-guides-extension-use",
        "eq-balloons-stents-cart-specialty",
      ],
      starts,
      variants: ladder("rca-calcified"),
    },
    {
      id: "lcx-stemi",
      title: "Inferolateral STEMI: occluded circumflex",
      lessonIds: [
        "pm-monitoring-crisis",
        "pm-antithrombotics-iv",
        "pm-interpreting-flow",
        "pm-target-culprit",
        "pm-target-multivessel-stemi",
        "pm-wiring-guide-choice",
        "pm-wiring-wire-choice",
        "pm-wiring-navigate",
        "cp-acs-thrombus-ppci",
        "cp-acs-thrombus-thrombus",
        "cp-acs-thrombus-aspiration",
        "cp-complex-patients-shock-culprit",
        "cp-other-complex-stent-thrombosis",
        "cm-principles-closure-pmi",
        "cm-flow-embolism-noreflow",
      ],
      starts,
      variants: ladder("lcx-stemi"),
    },
    {
      id: "rca-cto",
      title: "Chronic total occlusion of the mid RCA",
      lessonIds: [
        "pm-interpreting-collaterals",
        "pm-wiring-guide-choice",
        "pm-wiring-wire-choice",
        "pm-wiring-microcatheters",
        "pm-imaging-coreg-ct",
        "cp-cto-strategy-setup",
        "cp-cto-strategy-angiogram",
        "cp-cto-strategy-hybrid",
        "cp-cto-antegrade-awe-kit",
        "cp-cto-antegrade-awe-crossing",
        "cp-cto-antegrade-parallel",
        "cp-cto-antegrade-adr-track",
        "cp-cto-antegrade-move-cap",
        "cp-cto-retrograde-septal",
        "cp-cto-retrograde-epicardial",
        "cp-cto-retrograde-grafts",
        "cp-cto-retrograde-reverse-cart",
        "cp-cto-retrograde-connect",
        "cp-cto-retrograde-complications",
        "cp-uncrossable-support-microcatheter",
        "cm-principles-closure-stopping",
        "cm-flow-embolism-air",
        "cm-perforation-distal",
        "cm-patient-complications-radiation",
        "eq-sheaths-guides-length",
        "eq-balloons-stents-cart-cart",
        "hb-the-operator-programme",
        "hb-safe-practice-mindset",
      ],
      caseIds: ["cx-case-rca-cto", "cp-cto-antegrade-case-rca"],
      starts,
      variants: ladder("rca-cto"),
    },
  ],
};
