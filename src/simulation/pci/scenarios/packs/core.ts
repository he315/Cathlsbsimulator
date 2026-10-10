// ---------------------------------------------------------------------------
// Core PCI scenario pack: the four scenarios the PCI lab has always had
// (focal LAD, calcified RCA, circumflex STEMI, RCA CTO), unchanged in content.
// Their lesions, guide, views and teaching points are those of the earlier
// hard-coded PCI_SCENARIOS; scenarios.test.ts checks that the engine state
// built from them is identical. The lesson links, starts and variants are in
// the engine-free sibling core.launch.ts.
//
// The lab's anatomy for these cases is the generic one it always used: a
// normal root, right dominance, no anatomical variants, radial access.
// ---------------------------------------------------------------------------

import type { PciAnatomyDef, PciScenarioDef, PciStartDef } from "../types";

/**
 * Start states every core scenario offers (other packs may import them): the guide in the root
 * (the default), the guide engaged with the wire in it, and a workhorse wire already across the
 * target lesion for practising lesion preparation and stenting.
 */
export const STANDARD_PCI_STARTS: readonly PciStartDef[] = [
  { id: "guide-in-root", title: "Guide in the aortic root", phase: "guide", guideEngaged: false, wire: "in-guide" },
  { id: "guide-engaged", title: "Guide engaged", phase: "wire", guideEngaged: true, wire: "in-guide" },
  { id: "wire-across", title: "Wire across the lesion", phase: "lesion-prep", guideEngaged: true, wire: "across" },
];

const GENERIC_ANATOMY: PciAnatomyDef = { dominance: "right", rootSize: "normal", tortuosity: 0, variants: [] };

const starts = (): PciStartDef[] => STANDARD_PCI_STARTS.map((s) => ({ ...s }));

export const scenarios: PciScenarioDef[] = [
  {
    id: "lad-focal",
    title: "Focal mid-LAD stenosis",
    brief:
      "Synthetic case. 58-year-old man with exertional angina despite two anti-anginal drugs; non-invasive testing showed anterior ischaemia. Diagnostic angiography: a focal mid-LAD stenosis just after the first diagonal.",
    epa: "pci-simple",
    ladderBase: true,
    difficulty: 2,
    side: "left",
    anatomy: { ...GENERIC_ANATOMY },
    lesions: [{ vessel: "LAD", position: 0.38, severity: 85, lengthMm: 12, kind: "severe-stenosis", calcium: 0, role: "target" }],
    patient: { accessRoute: "radial-right" },
    setup: { guideDefault: "EBU3.5", french: 6, heparinised: true, guideInRoot: true },
    starts: starts(),
    views: ["raocranial", "laocranial", "apcranial"],
    points: [
      "Steer the wire past the diagonal and the septal perforators into the distal LAD.",
      "Size the stent to the distal reference and cover the lesion with a couple of millimetres of normal vessel at each end.",
      "Post-dilate with a non-compliant balloon inside the stent, not beyond its edges.",
    ],
    // The ladder varies calcium for this base only (catalogue.ts before the registry: none or moderate).
    variantAxes: { calciumGrades: [0, 1] },
  },
  {
    id: "rca-calcified",
    title: "Calcified mid-RCA stenosis",
    brief:
      "Synthetic case. 71-year-old woman with diabetes and chronic kidney disease, class III angina. A heavily calcified mid-RCA stenosis on angiography; contrast use matters.",
    epa: "pci-calcium",
    ladderBase: true,
    difficulty: 4,
    side: "right",
    anatomy: { ...GENERIC_ANATOMY },
    lesions: [{ vessel: "RCA", position: 0.45, severity: 80, lengthMm: 18, kind: "calcified", calcium: 2, role: "target" }],
    patient: { accessRoute: "radial-right" },
    setup: { guideDefault: "JR4", french: 6, heparinised: true, guideInRoot: true },
    starts: starts(),
    views: ["rcalao", "rcarao", "apcranial"],
    points: [
      "Prepare calcium before stenting: a balloon that will not fully expand at high pressure predicts an under-expanded stent.",
      "Scoring balloons or intravascular lithotripsy modify calcium; high pressure alone risks dissection or rupture.",
      "Keep contrast to a minimum in kidney disease.",
    ],
  },
  {
    id: "lcx-stemi",
    title: "Inferolateral STEMI: occluded circumflex",
    brief:
      "Synthetic case. 54-year-old man, 3 hours of chest pain with inferolateral ST elevation. The obtuse marginal territory is supplied by a thrombotic, subtotally occluded proximal-to-mid circumflex.",
    epa: "pci-stemi",
    ladderBase: true,
    difficulty: 3,
    side: "left",
    anatomy: { ...GENERIC_ANATOMY },
    lesions: [{ vessel: "LCx", position: 0.42, severity: 99, lengthMm: 16, kind: "thrombotic", calcium: 0, morphology: "thrombus", role: "target" }],
    events: ["stemi"],
    patient: { accessRoute: "radial-right" },
    setup: { guideDefault: "EBU3.5", french: 6, heparinised: true, guideInRoot: true },
    starts: starts(),
    views: ["raocaudal", "spider", "ap"],
    points: [
      "The circumflex leaves the left main at an angle: point the tip towards it, away from the LAD.",
      "A heavy thrombus burden risks distal embolisation and slow flow after aggressive balloon dilatation.",
      "Restore flow first, then size the stent once vasodilators have opened the distal vessel.",
    ],
  },
  {
    id: "rca-cto",
    title: "Chronic total occlusion of the mid RCA",
    brief:
      "Synthetic case. 63-year-old man with class III angina on maximal therapy and inferior ischaemia with viable myocardium. The mid RCA has been occluded for more than three months; the distal RCA fills from the left. A second catheter sits in the left coronary for dual injection.",
    epa: "pci-cto",
    ladderBase: true,
    difficulty: 5,
    side: "right",
    anatomy: { ...GENERIC_ANATOMY },
    lesions: [{ vessel: "RCA", position: 0.35, severity: 100, lengthMm: 18, kind: "cto", calcium: 1, morphology: "cto", sites: ["cto"], role: "target" }],
    patient: { accessRoute: "radial-right" },
    setup: { guideDefault: "JR4", french: 6, heparinised: true, guideInRoot: true },
    starts: starts(),
    views: ["rcalao", "rcarao", "lao30"],
    points: [
      "Inject both coronaries together: the right shows the proximal cap, the left fills the distal RCA through collaterals and shows the landing zone and the occlusion length.",
      "A workhorse wire buckles at the cap. Escalate to a stiff, tapered CTO wire, then exchange back to a workhorse wire once across.",
      "Confirm the wire is in the true lumen distally (contralateral injection) before any balloon.",
    ],
  },
];
