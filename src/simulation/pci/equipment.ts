// ---------------------------------------------------------------------------
// The PCI equipment catalogue: guides, coronary wires, balloons, stents,
// covered stents, microcatheters, guide extensions, aspiration and imaging
// catheters, atherectomy, laser and the retrieval and bail-out devices, with
// the information printed on the box. This is the one catalogue the PCI lab
// tray and indeflator, the IVUS and OCT bench and the scenario packs read.
//
// Every spec carries `sources` (where each sourced value is written in the
// module text, as "<lesson id>: <place>", or in docs/SIM_FACTS.md) and
// `modelParam` (true, or the list of fields that are MODEL PARAMETERS).
// docs/realism/facts/pci-equipment.md lists every value with its source.
// Names are generic: no product names reach the screen.
//
// Values inherited from the earlier version of this file cite FDA labels
// (P070015, P110010, K211349, P200041, K222538) through a facts file (C3.md)
// that is not in the repository; they are kept, tagged "inherited:" in
// `sources`, and listed as unverified in the facts file. The guide back-up
// ordering cites Ikari 2005 through docs/realism/facts/S7.md (#15).
// ---------------------------------------------------------------------------

import type { ImagingModality, LabEvent } from "../../content/lab/tips";

export type ShaftKind = "rx" | "otw";
/** Guide sizes the lab offers (Brilakis Table 30.4 lists 5 to 8 Fr). */
export type GuideFrench = 5 | 6 | 7 | 8;
export const GUIDE_FRENCH: readonly GuideFrench[] = [5, 6, 7, 8];

/** Lesson ids of the module text the sources point into. */
export const SRC = {
  guideChoice: "pm-wiring-guide-choice",
  wireChoice: "pm-wiring-wire-choice",
  microcatheters: "pm-wiring-microcatheters",
  extensionDevice: "eq-sheaths-guides-extension-device",
  extensionUse: "eq-sheaths-guides-extension-use",
  balloonsStandard: "eq-balloons-stents-cart-standard",
  balloonsSpecialty: "eq-balloons-stents-cart-specialty",
  stentBuild: "eq-balloons-stents-cart-stent-build",
  cart: "eq-balloons-stents-cart-cart",
  perforationLarge: "cm-perforation-large-vessel",
  calciumSetup: "cp-calcium-setup",
  calciumBalloons: "cp-calcium-balloons",
  calciumIvl: "cp-calcium-ivl",
  calciumRota: "cp-calcium-rota",
  calciumOrbital: "cp-calcium-orbital",
  calciumLaser: "cp-calcium-laser",
  aspiration: "cp-acs-thrombus-aspiration",
  imagingWhich: "pm-imaging-when-which",
  imagingIvus: "pm-imaging-ivus",
  imagingOct: "pm-imaging-oct",
  epd: "cp-prior-cabg-epd",
  physiologySetup: "pm-physiology-setup",
} as const;

const src = (lesson: string, where: string) => `${lesson}: ${where}`;
const SIM_FACTS = (where: string) => `docs/SIM_FACTS.md: ${where}`;
const INHERITED = (where: string) => `inherited: ${where}`;

/** inches to millimetres */
export const IN_MM = 25.4;
const mmOf = (inch: number) => Math.round(inch * IN_MM * 100) / 100;

// ---------------------------------------------------------------------------
// Guides
// ---------------------------------------------------------------------------
export type GuideFamily = "JL" | "JR" | "EBU" | "AL" | "AR" | "IKL" | "IKR" | "WR" | "HS" | "MP";

export interface GuideSpec {
  id: string;
  label: string;
  family: GuideFamily;
  side: "left" | "right" | "both";
  /** opposite-wall support: the curve leans on the contralateral aortic wall (extra-backup, Amplatz) */
  oppositeWall: boolean;
  /** back-up force at 6 F, coaxial, seated at the ostium (N) — MODEL PARAMETER (ordering from the sources) */
  backupN: number;
  /** back-up on one side when it differs from backupN (N) — MODEL PARAMETER (Oxford grades AL2 differently left and right) */
  backupBySide?: Partial<Record<"left" | "right", number>>;
  /** total turning of the guide's curves the coronary wire passes (rad) — MODEL PARAMETER */
  curveTurning: number;
  /** how readily the tip deep-seats when pulled on or pushed (0..1) — MODEL PARAMETER */
  deepSeatEase: number;
  note: string;
  sources: string[];
  modelParam: true | string[];
}

const GUIDE_MP = ["backupN", "curveTurning", "deepSeatEase"];
const GUIDE_ORDER_SRC = [
  src(SRC.guideChoice, "'Design choices that set support' table (Brilakis 9.7, Oxford ch 8): extra-support over JL for the left, AL over JR for the RCA"),
  src(SRC.guideChoice, "'Guide shapes for PCI by target and route' table: Oxford's support grading (LAD JL3.5/4 least, AL2 middle, XB/EBU 3.5 most; Cx JL4/5 least, AL2 middle, EBU 3.5-4 most; RCA JR4 least, AR1/2 middle, hockey stick or AL1/2 most)"),
  "docs/realism/facts/S7.md: #15 Ikari 2005 (PMID 16327043): back-up rises with catheter size, the angle on the reverse side of the aorta and the contact area",
];
const guide = (o: Omit<GuideSpec, "sources" | "modelParam"> & { extraSources?: string[] }): GuideSpec => {
  const { extraSources, ...rest } = o;
  return { ...rest, sources: [...GUIDE_ORDER_SRC, ...(extraSources ?? [])], modelParam: GUIDE_MP };
};

const LEFT_SIZES_SRC = src(SRC.guideChoice, "shape table: EBU 3.0-3.5 for the LAD, EBU 3.75 or XB 3.5 in most cases, EBU 4.0-4.5 for the circumflex");
const JL_SIZES_SRC = src(SRC.guideChoice, "'Curve size and the aortic root': JL made in 3.5, 4, 5 and 6");

export const GUIDES: GuideSpec[] = [
  guide({ id: "JL3.5", label: "Judkins left 3.5", family: "JL", side: "left", oppositeWall: false, backupN: 0.3, curveTurning: 3.6, deepSeatEase: 0.5, note: "Coaxial and easy to engage; modest back-up.", extraSources: [JL_SIZES_SRC] }),
  guide({ id: "JL4", label: "Judkins left 4", family: "JL", side: "left", oppositeWall: false, backupN: 0.26, curveTurning: 3.8, deepSeatEase: 0.5, note: "Easy engagement; back-up is limited for complex lesions.", extraSources: [JL_SIZES_SRC] }),
  guide({ id: "JL5", label: "Judkins left 5", family: "JL", side: "left", oppositeWall: false, backupN: 0.24, curveTurning: 4.0, deepSeatEase: 0.45, note: "For a wider aortic root; back-up is limited.", extraSources: [JL_SIZES_SRC] }),
  guide({ id: "EBU3.0", label: "Extra-backup 3.0", family: "EBU", side: "left", oppositeWall: true, backupN: 0.58, curveTurning: 3.1, deepSeatEase: 0.38, note: "A smaller extra-backup curve: favours the LAD.", extraSources: [LEFT_SIZES_SRC] }),
  guide({ id: "EBU3.5", label: "Extra-backup 3.5", family: "EBU", side: "left", oppositeWall: true, backupN: 0.62, curveTurning: 3.2, deepSeatEase: 0.35, note: "Leans on the opposite aortic wall: strong back-up for the left coronary.", extraSources: [LEFT_SIZES_SRC] }),
  guide({ id: "EBU3.75", label: "Extra-backup 3.75", family: "EBU", side: "left", oppositeWall: true, backupN: 0.66, curveTurning: 3.2, deepSeatEase: 0.35, note: "As the 3.5 for a wider aortic root.", extraSources: [LEFT_SIZES_SRC] }),
  guide({ id: "EBU4.0", label: "Extra-backup 4.0", family: "EBU", side: "left", oppositeWall: true, backupN: 0.68, curveTurning: 3.3, deepSeatEase: 0.33, note: "A larger extra-backup curve: favours the circumflex.", extraSources: [LEFT_SIZES_SRC] }),
  guide({ id: "EBU4.5", label: "Extra-backup 4.5", family: "EBU", side: "left", oppositeWall: true, backupN: 0.7, curveTurning: 3.4, deepSeatEase: 0.3, note: "The largest extra-backup curve, for a wide root or the circumflex.", extraSources: [LEFT_SIZES_SRC] }),
  guide({ id: "IKL", label: "Ikari left", family: "IKL", side: "left", oppositeWall: true, backupN: 0.56, curveTurning: 3.3, deepSeatEase: 0.38, note: "A radial left guide listed with the extra-backup families.", extraSources: [src(SRC.guideChoice, "shape table: radial PCI of the left main and LAD, 'EBU or XB families, or the Ikari left'")] }),
  guide({ id: "JR4", label: "Judkins right 4", family: "JR", side: "right", oppositeWall: false, backupN: 0.2, curveTurning: 2.6, deepSeatEase: 0.6, note: "The usual right coronary guide; back-up is poor unless deep-seated." }),
  guide({ id: "AR1", label: "Amplatz right 1", family: "AR", side: "right", oppositeWall: false, backupN: 0.32, curveTurning: 2.9, deepSeatEase: 0.6, note: "Moderate back-up for an upward right coronary." }),
  guide({ id: "AR2", label: "Amplatz right 2", family: "AR", side: "right", oppositeWall: false, backupN: 0.34, curveTurning: 3.0, deepSeatEase: 0.58, note: "Moderate back-up; a dilated root may need the larger curve.", extraSources: [src(SRC.guideChoice, "'Curve size and the aortic root': a dilated root may engage more easily with AR1 or AR2, or AL1 or AL2")] }),
  guide({ id: "AL1", label: "Amplatz left 1", family: "AL", side: "both", oppositeWall: true, backupN: 0.7, curveTurning: 3.9, deepSeatEase: 0.7, note: "Very strong back-up from the sinus floor. Can dissect the ostium if it dives in." }),
  guide({ id: "AL2", label: "Amplatz left 2", family: "AL", side: "both", oppositeWall: true, backupN: 0.48, backupBySide: { right: 0.72 }, curveTurning: 4.0, deepSeatEase: 0.68, note: "Middle back-up for the left system, strong for the RCA. Needs careful handling." }),
  guide({ id: "IKR", label: "Ikari right", family: "IKR", side: "right", oppositeWall: true, backupN: 0.5, curveTurning: 3.0, deepSeatEase: 0.55, note: "A radial right guide listed with the Amplatz left 1 for RCA PCI.", extraSources: [src(SRC.guideChoice, "shape table: radial RCA PCI 'AL1, Ikari right or 3D Right; avoid JR guides'")] }),
  guide({ id: "WR", label: "Williams right", family: "WR", side: "right", oppositeWall: false, backupN: 0.28, curveTurning: 2.8, deepSeatEase: 0.55, note: "Engages with little or no manipulation; helps with aorto-ostial RCA lesions.", extraSources: [src(SRC.guideChoice, "shape table, RCA row: 'The Williams right engages with little or no manipulation and helps with aorto-ostial RCA lesions'")] }),
  guide({ id: "HS", label: "Hockey stick", family: "HS", side: "right", oppositeWall: true, backupN: 0.66, curveTurning: 3.1, deepSeatEase: 0.6, note: "Strong back-up for the RCA." }),
  guide({ id: "MP", label: "Multipurpose", family: "MP", side: "both", oppositeWall: false, backupN: 0.3, curveTurning: 2.4, deepSeatEase: 0.65, note: "For downward-pointing grafts; usually less support than an Amplatz.", extraSources: [src(SRC.guideChoice, "shape table: right-sided vein graft JR4 or multipurpose; for a left-sided graft multipurpose and LCB shapes usually support less")] }),
];

export const GUIDE_BY_ID: Record<string, GuideSpec> = Object.fromEntries(GUIDES.map((x) => [x.id, x]));

/** French size scaling of back-up (larger guides hold more: Oxford ranks 8 F above 7 F above 6 F). Exponent is a MODEL PARAMETER. */
export const MP_FRENCH_BACKUP_EXP = 1.5;

/** Guide lumen and outer diameter by French size (Brilakis Table 30.4, quoted in eq-sheaths-guides-extension-device and pm-wiring-guide-choice). */
export interface GuideLumen {
  /** inner diameter range (in) */
  idIn: [number, number];
  /** inner diameter range (mm) as printed */
  idMm: [number, number];
  /** outer diameter (in, mm) */
  odIn: number;
  odMm: number;
}
export const GUIDE_LUMEN: Record<GuideFrench, GuideLumen> = {
  5: { idIn: [0.058, 0.059], idMm: [1.47, 1.5], odIn: 0.066, odMm: 1.67 },
  6: { idIn: [0.07, 0.072], idMm: [1.78, 1.83], odIn: 0.079, odMm: 2.0 },
  7: { idIn: [0.081, 0.081], idMm: [2.06, 2.06], odIn: 0.092, odMm: 2.33 },
  8: { idIn: [0.09, 0.091], idMm: [2.29, 2.31], odIn: 0.105, odMm: 2.67 },
};
export const GUIDE_LUMEN_SOURCES = [
  src(SRC.extensionDevice, "'Guide lumens by size (Brilakis Table 30.4)'"),
  src(SRC.guideChoice, "'French size, lumen and length': outer and inner diameters by French size"),
];
/** Inner diameter of each guide size (inches), the lower end of the printed range (Brilakis Table 30.4). */
export const GUIDE_ID_IN: Record<GuideFrench, number> = { 5: 0.058, 6: 0.07, 7: 0.081, 8: 0.09 };
/** Minimum guide inner diameter for rapid-exchange balloons and stents up to 4 mm (inches): inherited, FDA P070015 / P110010. Not printed on the box: a 5 Fr guide (0.058 in) meets it, while the catalogue asks for 6 Fr. */
export const RX_MIN_GUIDE_ID_IN = 0.056;
/** Guide lengths (cm): most are 100 cm; 90 cm for retrograde CTO or distal targets; 125 cm for very tall patients or tortuous aortas (pm-wiring-guide-choice). */
export const GUIDE_LENGTHS_CM = [90, 100, 125] as const;
export type GuideLengthCm = (typeof GUIDE_LENGTHS_CM)[number];
export const GUIDE_LENGTH_SOURCES = [src(SRC.guideChoice, "'French size, lumen and length': Length; Side holes")];

/** Smallest guide whose lumen (lower end of its printed range) takes a rigid device of `mm` diameter, or null if no 5-8 Fr guide does. */
export function smallestGuideForMm(mm: number): GuideFrench | null {
  for (const fr of GUIDE_FRENCH) if (GUIDE_LUMEN[fr].idMm[0] >= mm) return fr;
  return null;
}

// ---------------------------------------------------------------------------
// Coronary wires
// ---------------------------------------------------------------------------
/** Brilakis's seven categories (pm-wiring-wire-choice), with the polymer-jacketed and support groups split as the module text describes them. */
export type WireKind = "workhorse" | "polymer" | "polymer-tapered" | "cto" | "support" | "support-waved" | "atherectomy" | "externalisation" | "pressure";
export type WireCategory = "workhorse" | "polymer-jacketed" | "stiff-tip" | "support" | "atherectomy" | "externalisation" | "pressure";
export type WireCoating = "uncoated" | "hydrophilic-coil" | "polymer-jacket";

export interface WireSpec {
  label: string;
  note: string;
  category: WireCategory;
  /** whether the wire is meant to cross a lesion: "no" for the waved support wire, "discouraged" for atherectomy wires (pm-wiring-wire-choice) */
  crossing: "yes" | "discouraged" | "no";
  /** lengths offered (cm) */
  lengthsCm: number[];
  /**
   * Tip load (gf): the force that buckles the tip — MODEL PARAMETER within the sourced ranges
   * (workhorse usually 1 g or less; soft non-tapered polymer-jacketed about 0.8-2.1 g; stiff
   * polymer-jacketed about 1.7-4.1 g: pm-wiring-wire-choice).
   */
  tipLoadGf: number;
  /** tip diameter (inches): 0.014 standard, tapered tips smaller — MODEL PARAMETER for the tapered tips */
  tipIn: number;
  /** coating — MODEL PARAMETER per kind (the categories are sourced) */
  coating: WireCoating;
  /** coating friction coefficient (static) against vessel wall — MODEL PARAMETER */
  muStatic: number;
  muKinetic: number;
  /** torsional stiffness of the shaft GJ (N·mm²) — MODEL PARAMETER */
  GJ: number;
  /** bending stiffness of the distal 30 mm (N·mm²) — MODEL PARAMETER */
  EItip: number;
  /** shaft support for device delivery (multiplies the rail's straightening) — MODEL PARAMETER */
  support: number;
  /** relative distal perforation and dissection risk (polymer-jacketed and stiff tips higher: pm-wiring-wire-choice) — MODEL PARAMETER */
  injuryFactor: number;
  /** extra acceptance window for branch entry (rad): slippery tips find side branches — MODEL PARAMETER */
  branchSeek: number;
  /** radiopaque distal coil length (mm) — MODEL PARAMETER (pressure wire: 30 mm, sourced) */
  opaqueMm: number;
  /** pressure sensor distance from the tip (mm); pressure wires only (sourced: 3 cm) */
  sensorMm?: number;
  sources: string[];
  modelParam: true | string[];
}

const WIRE_MP = ["tipLoadGf", "coating", "muStatic", "muKinetic", "GJ", "EItip", "support", "injuryFactor", "branchSeek", "opaqueMm"];
const WIRE_TABLE = src(SRC.wireChoice, "'Brilakis's seven categories' table");
const WIRE_LENGTHS = src(SRC.wireChoice, "'Short wires are about 180-190 cm; exchange lengths are 300 cm'");

export const WIRE_SPEC: Record<WireKind, WireSpec> = {
  workhorse: {
    label: "Workhorse wire",
    note: "Light tip load, soft and steerable. The default for most lesions.",
    category: "workhorse",
    crossing: "yes",
    lengthsCm: [180, 190, 300],
    tipLoadGf: 0.7,
    tipIn: 0.014,
    coating: "hydrophilic-coil",
    muStatic: 0.12,
    muKinetic: 0.08,
    GJ: 26,
    EItip: 2.5,
    support: 1,
    injuryFactor: 1,
    branchSeek: 0,
    opaqueMm: 30,
    sources: [WIRE_TABLE, WIRE_LENGTHS],
    modelParam: WIRE_MP,
  },
  polymer: {
    label: "Polymer-jacketed wire (soft, non-tapered)",
    note: "Slides through tortuous or very tight lesions; tracks easily into small branches and is more likely to perforate distally. Exchange it before balloons and stents.",
    category: "polymer-jacketed",
    crossing: "yes",
    lengthsCm: [180, 190, 300],
    tipLoadGf: 1.0,
    tipIn: 0.014,
    coating: "polymer-jacket",
    muStatic: 0.05,
    muKinetic: 0.035,
    GJ: 18,
    EItip: 2.0,
    support: 0.9,
    injuryFactor: 2.5,
    branchSeek: 0.14,
    opaqueMm: 30,
    sources: [WIRE_TABLE, src(SRC.wireChoice, "'The other families': soft non-tapered jacketed wires, tip loads about 0.8-2.1 g"), WIRE_LENGTHS],
    modelParam: [...WIRE_MP, "lengthsCm"],
  },
  "polymer-tapered": {
    label: "Polymer-jacketed wire (tapered, stiffer)",
    note: "A tapered, stiffer jacketed tip, mostly a CTO tool. High risk of dissection and distal perforation in an ordinary vessel.",
    category: "polymer-jacketed",
    crossing: "yes",
    lengthsCm: [190, 300],
    tipLoadGf: 2.5,
    tipIn: 0.01,
    coating: "polymer-jacket",
    muStatic: 0.05,
    muKinetic: 0.035,
    GJ: 24,
    EItip: 3.5,
    support: 1,
    injuryFactor: 3.2,
    branchSeek: 0.08,
    opaqueMm: 30,
    sources: [WIRE_TABLE, src(SRC.wireChoice, "'The other families': soft tapered and stiff polymer-jacketed wires are mostly CTO tools; stiff ones about 1.7-4.1 g")],
    modelParam: [...WIRE_MP, "tipIn", "lengthsCm"],
  },
  cto: {
    label: "Stiff-tip wire",
    note: "High tip load and a tapered tip for penetrating an occlusion cap. Dangerous in a normal vessel: exchange it once across.",
    category: "stiff-tip",
    crossing: "yes",
    lengthsCm: [190, 300],
    tipLoadGf: 9,
    tipIn: 0.009,
    coating: "uncoated",
    muStatic: 0.09,
    muKinetic: 0.06,
    GJ: 34,
    EItip: 6,
    support: 1.2,
    injuryFactor: 4,
    branchSeek: -0.05,
    opaqueMm: 20,
    sources: [WIRE_TABLE],
    modelParam: [...WIRE_MP, "tipIn", "lengthsCm"],
  },
  support: {
    label: "Extra-support wire",
    note: "Floppy tip on a stiff shaft: straightens bends and helps deliver devices. Can create pseudo-lesions.",
    category: "support",
    crossing: "yes",
    lengthsCm: [190, 300],
    tipLoadGf: 1.0,
    tipIn: 0.014,
    coating: "hydrophilic-coil",
    muStatic: 0.12,
    muKinetic: 0.08,
    GJ: 32,
    EItip: 3,
    support: 1.6,
    injuryFactor: 1.2,
    branchSeek: 0,
    opaqueMm: 30,
    sources: [WIRE_TABLE, src(SRC.wireChoice, "'Support wires': strong shafts with soft tips; 300 cm versions exist")],
    modelParam: WIRE_MP,
  },
  "support-waved": {
    label: "Support wire with distal waves",
    note: "Three small waves lift the delivery segment off the wall. Not a crossing wire: exchange it in through a microcatheter once another wire has crossed.",
    category: "support",
    crossing: "no",
    lengthsCm: [190, 300],
    tipLoadGf: 0.8,
    tipIn: 0.014,
    coating: "uncoated",
    muStatic: 0.12,
    muKinetic: 0.08,
    GJ: 30,
    EItip: 3,
    support: 1.5,
    injuryFactor: 1.1,
    branchSeek: -0.04,
    opaqueMm: 30,
    sources: [WIRE_TABLE, src(SRC.wireChoice, "'Support wires': three waves beginning 6 cm from the tip, over the next 6 cm, each 3 mm high; exchanged in, not a crossing wire")],
    modelParam: [...WIRE_MP, "lengthsCm"],
  },
  atherectomy: {
    label: "Atherectomy wire",
    note: "A 330 cm wire with a thin shaft and a spring tip the burr cannot pass. Cross with a workhorse and exchange this wire in through a microcatheter.",
    category: "atherectomy",
    crossing: "discouraged",
    lengthsCm: [330],
    tipLoadGf: 1.2,
    tipIn: 0.014,
    coating: "uncoated",
    muStatic: 0.14,
    muKinetic: 0.1,
    GJ: 12,
    EItip: 2.2,
    support: 0.8,
    injuryFactor: 1.3,
    branchSeek: -0.02,
    opaqueMm: 30,
    sources: [WIRE_TABLE, src(SRC.calciumRota, "'Components of the rotational atherectomy system': wire 330 cm, 0.009 in. shaft, 0.014 in. spring tip"), src(SRC.wireChoice, "'Atherectomy wires': wiring directly with it is possible but hard in practice")],
    modelParam: WIRE_MP,
  },
  externalisation: {
    label: "Externalisation wire",
    note: "A very long wire for retrograde CTO work, taken out through the antegrade guide.",
    category: "externalisation",
    crossing: "no",
    lengthsCm: [330, 350],
    tipLoadGf: 1.0,
    tipIn: 0.014,
    coating: "hydrophilic-coil",
    muStatic: 0.1,
    muKinetic: 0.07,
    GJ: 20,
    EItip: 2.4,
    support: 1.0,
    injuryFactor: 1.2,
    branchSeek: 0,
    opaqueMm: 30,
    sources: [WIRE_TABLE],
    modelParam: WIRE_MP,
  },
  pressure: {
    label: "Pressure wire",
    note: "A 0.014 in wire with a pressure sensor 3 cm from the tip, at the end of the radiopaque segment. Torque is less precise than a workhorse wire.",
    category: "pressure",
    crossing: "yes",
    lengthsCm: [180, 300],
    tipLoadGf: 1.0,
    tipIn: 0.014,
    coating: "hydrophilic-coil",
    muStatic: 0.13,
    muKinetic: 0.09,
    GJ: 15,
    EItip: 2.5,
    support: 0.9,
    injuryFactor: 1.2,
    branchSeek: 0,
    opaqueMm: 30,
    sensorMm: 30,
    sources: [WIRE_TABLE, src(SRC.physiologySetup, "'The wire': pressure sensor about 3 cm from the tip, where the radiopaque tip meets the shaft")],
    modelParam: [...WIRE_MP, "lengthsCm"],
  },
};

/**
 * Wire kinds whose sourced crossing rule is "yes". Until the engine scores the crossing rule, a live lab
 * selector should offer only these, so a learner cannot cross a lesion with a wire the module text calls
 * "not a crossing wire".
 */
export const CROSSING_WIRE_KINDS: readonly WireKind[] = (Object.keys(WIRE_SPEC) as WireKind[]).filter((k) => WIRE_SPEC[k].crossing === "yes");

/** Grams-force to newtons. */
export const GF = 0.00980665;

// ---------------------------------------------------------------------------
// Balloons, stents and the other devices
// ---------------------------------------------------------------------------
/** How the PCI engine treats a balloon on inflation (the engine and the lab UI key on these four). */
export type BalloonKind = "semi-compliant" | "non-compliant" | "scoring" | "ivl";
/** The balloon categories of the catalogue (Brilakis's eight, with the standard and plaque modification groups split). */
export type BalloonType =
  | BalloonKind
  | "small"
  | "microdilation"
  | "otw"
  | "cutting"
  | "scoring-wire"
  | "very-high-pressure"
  | "dcb"
  | "trapping"
  | "re-entry"
  | "flaring";

export type DeviceClass =
  | "balloon"
  | "stent"
  | "covered-stent"
  | "microcatheter"
  | "extension"
  | "aspiration"
  | "ivus"
  | "oct"
  | "atherectomy"
  | "laser"
  | "snare"
  | "embolic-protection"
  | "coil"
  | "re-entry";

/** The kind of device inside a class, where a class has several (e.g. rotational and orbital atherectomy). */
export type DeviceKindTag =
  | "rotational"
  | "orbital"
  | "excimer"
  | "rotational-ivus"
  | "phased-array-ivus"
  | "oct"
  | "sandwich-ptfe"
  | "polyurethane"
  | "large"
  | "small"
  | "angulated"
  | "deflectable"
  | "dual-lumen"
  | "plaque-modification"
  | "standard"
  | "trapping"
  | "catheter-in-catheter"
  | "coronary"
  | "aortic"
  | "sheath-filter"
  | "otw-filter"
  | "coil-014"
  | "coil-018"
  | "crossing-catheter";

export interface ComplianceChart {
  /** pressures (atm) */
  atm: number[];
  /** diameters (mm) at those pressures */
  mm: number[];
  /** "ifu" = rows copied from a published chart; "model" = a linear MODEL PARAMETER chart */
  source: "ifu" | "model";
}

export interface DeviceSpec {
  id: string;
  cls: DeviceClass;
  /** engine behaviour on inflation */
  balloon?: BalloonKind;
  /** catalogue category of a balloon (equals `balloon` for the four standard kinds) */
  balloonType?: BalloonType;
  kind?: DeviceKindTag;
  label: string;
  shaft: ShaftKind;
  /** sizes offered: mm for balloons, stents, burrs and snares; French for extensions and aspiration catheters (see sizeUnit) */
  diameters: number[];
  /** lengths offered (mm); for extensions the cylinder length in cm (see lengthUnit) */
  lengths: number[];
  sizeUnit?: "mm" | "Fr" | "none";
  lengthUnit?: "mm" | "cm" | "none";
  nominalAtm: (d: number) => number;
  rbpAtm: (d: number) => number;
  chart: (d: number) => ComplianceChart;
  /** crossing profile (mm) */
  profileMm: (d: number) => number;
  /** bending stiffness of the device's crossing segment (N·mm²) — MODEL PARAMETER */
  EI: number;
  /** maximum post-dilatation diameter (stents) */
  dilatationLimit?: (d: number) => number;
  /** maximum deflation time specification (s) */
  deflateSpecS?: (d: number, l: number) => number;
  /** minimum guide (French), or null when no 5-8 Fr guide takes it */
  minFrench: (d: number) => GuideFrench | null;
  /** smallest guide in which the device can be trapped with a balloon, where the sources state it */
  trapMinFrench?: GuideFrench;
  /** guide in which this device and a blocking balloon pass together ('block and deliver'), where stated */
  blockAndDeliverFrench?: GuideFrench;
  usableCm: number;
  /** other usable lengths offered (cm), e.g. 135 and 150 cm microcatheters */
  usableCmOptions?: number[];
  /** inner diameter (in) of a lumen device by size (extensions), as [low, high] */
  innerDiameterIn?: (d: number) => [number, number];
  /** fastest safe inflation (atm per s), cutting balloons */
  maxInflateAtmPerS?: number;
  /** foreshortening at each end on expansion (mm) */
  shorteningMmPerEnd?: number;
  /** profile multiplier after a first inflation (small balloons lose profile) — MODEL PARAMETER */
  profileAfterInflation?: number;
  /** a single central marker (small balloons): the marker segment is the thickest point */
  singleMarker?: boolean;
  /** lesion entry profile (mm) where printed */
  entryProfileMm?: number;
  /** imaging catheters */
  imaging?: { modality: ImagingModality; tech: "rotational" | "phased-array" | "oct"; frequencyMHz?: [number, number]; pullbackMmS: number[]; guideHandInjectionMinFrench?: GuideFrench };
  /** rotational and orbital devices: direction to advance and the turn limit */
  rotation?: { advance: "clockwise" | "anticlockwise"; maxTurns?: number };
  /** contrast can be injected through the device lumen */
  contrastThroughLumen?: boolean;
  /** wire compatibility (in) of a lumen device or coil */
  wireIn?: number;
  /** vessel range (mm) a size treats (filters, snares) */
  vesselRangeMm?: (d: number) => [number, number];
  /** speeds (rpm) for atherectomy */
  speedsRpm?: number[];
  /** energy settings (laser) */
  laser?: { hz: [number, number]; fluence: [number, number]; onS: number; offS: number };
  notes: string[];
  sources: string[];
  modelParam: true | string[];
}

/** Linear compliance chart from nominal diameter at nominal pressure and a fractional growth per atm. */
function linearChart(d: number, nominal: number, rbp: number, fracPerAtm: number, lo = 2): ComplianceChart {
  const atm: number[] = [];
  const mm: number[] = [];
  for (let p = Math.max(lo, nominal - 6); p <= rbp + 2; p++) {
    atm.push(p);
    mm.push(Math.round(100 * d * (1 + fracPerAtm * (p - nominal))) / 100);
  }
  return { atm, mm, source: "model" };
}

/** Semi-compliant growth per atm — MODEL PARAMETER (about +0.3 mm from nominal to RBP for a 3.0 mm balloon). */
export const MP_SC_FRAC_PER_ATM = 0.0125;
/** Non-compliant growth per atm: "approximately 0.8% per atm" (inherited: FDA P200041 SSED bench table). */
export const NC_FRAC_PER_ATM = 0.008;
/** Lithotripsy balloon growth per atm — MODEL PARAMETER. */
export const MP_IVL_FRAC_PER_ATM = 0.004;
/** Very-high-pressure twin-layer balloon growth per atm — MODEL PARAMETER (less than an ordinary non-compliant balloon). */
export const MP_VHP_FRAC_PER_ATM = 0.004;
/** Default use-by date printed on a box when a scenario plants none — MODEL PARAMETER. */
export const MP_DEFAULT_USE_BY = "2028-06-30";

/** In vitro stent inner diameter (mm) by pressure (inherited: FDA P070015 Table 14-1, 8 to 18 atm). */
const DES_TABLE: Record<string, number[]> = {
  "2.5": [2.46, 2.52, 2.58, 2.63, 2.68, 2.72, 2.75, 2.78, 2.81, 2.84, 2.87],
  "2.75": [2.74, 2.81, 2.87, 2.92, 2.97, 3.01, 3.05, 3.08, 3.11, 3.14, 3.18],
  "3": [2.9, 2.97, 3.04, 3.1, 3.15, 3.19, 3.23, 3.26, 3.3, 3.33, 3.36],
  "3.5": [3.46, 3.55, 3.63, 3.69, 3.75, 3.8, 3.84, 3.89, 3.93, 3.97, 4.0],
  "4": [3.86, 3.95, 4.03, 4.1, 4.17, 4.23, 4.28, 4.33, 4.37, 4.42, 4.46],
};
const DES_ATM = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

function desChart(d: number): ComplianceChart {
  const row = DES_TABLE[String(d)];
  if (row) return { atm: DES_ATM.slice(), mm: row.slice(), source: "ifu" };
  return linearChart(d, d < 2.9 ? 8 : 9, 16, 0.009);
}

const EMPTY_CHART = (): ComplianceChart => ({ atm: [], mm: [], source: "model" });
const NO_PRESSURE = { nominalAtm: () => 0, rbpAtm: () => 0, chart: EMPTY_CHART };

/** Rotational burr sizes and their minimum guides (cp-calcium-setup and cp-calcium-rota, Brilakis Table 19.1). */
export const BURR_SIZES_MM = [1.25, 1.5, 1.75, 2.0, 2.15, 2.25, 2.38, 2.5] as const;
export function burrMinFrench(d: number): GuideFrench | null {
  if (d <= 1.75) return 6;
  if (d <= 2.0) return 7;
  if (d <= 2.25) return 8;
  // 2.38 and 2.5 mm: the module text gives no guide; neither fits the 2.29-2.31 mm lumen of an 8 Fr guide (Table 30.4)
  return null;
}

/** Guide extension inner diameters by size (in), Brilakis Table 30.5 (eq-sheaths-guides-extension-device). */
export const EXTENSION_ID_IN: Record<string, [number, number]> = {
  "5": [0.041, 0.046],
  "5.5": [0.051, 0.051],
  "6": [0.056, 0.057],
  "7": [0.062, 0.063],
  "8": [0.071, 0.072],
};
/** The same table in mm, as printed. */
export const EXTENSION_ID_MM: Record<string, [number, number]> = {
  "5": [1.04, 1.17],
  "5.5": [1.3, 1.3],
  "6": [1.42, 1.45],
  "7": [1.57, 1.6],
  "8": [1.8, 1.83],
};
/** Inner diameter (in) of a guide extension of a size listed in Table 30.5; any other size is an error, never a guess. */
export function extensionInnerDiameterIn(fr: number): [number, number] {
  const row = EXTENSION_ID_IN[String(fr)];
  if (!row) throw new Error(`No guide extension inner diameter for ${fr} Fr: Table 30.5 lists ${Object.keys(EXTENSION_ID_IN).join(", ")} Fr`);
  return row;
}

/**
 * Minimum guide for the laser catheter: 6 Fr for the 0.9 mm catheter (module text); for the larger catheters,
 * the smallest guide whose lumen (lower end of Table 30.4) is at least the catheter diameter, with no
 * clearance allowance, and never below 6 Fr; null when no 5-8 Fr guide takes it. MODEL PARAMETER (derived).
 */
export function laserMinFrench(d: number): GuideFrench | null {
  if (d <= 0.9) return 6;
  const fr = smallestGuideForMm(d);
  return fr === null ? null : (Math.max(6, fr) as GuideFrench);
}

/** The 5 Fr catheter-in-catheter system through a 6 Fr guide: 0.059 in. (1.50 mm), Table 30.5. */
export const CATHETER_IN_CATHETER_ID_IN = 0.059;

/** Over-the-wire filter size (mm) to target vessel range (mm), Brilakis Table 18.1 as printed (cp-prior-cabg-epd). */
export const OTW_FILTER_RANGES: Record<string, [number, number]> = { "3": [3.0, 3.0], "4": [3.1, 4.0], "5": [4.1, 5.0], "6": [4.5, 6.0], "7": [5.5, 6.0] };

const SC_SRC = INHERITED("semi-compliant nominal 6 atm, RBP 14 atm, lengths 6-30 mm, crossing profile 0.031 in. for 3.0 mm (FDA K211349)");
const NC_SRC = INHERITED("non-compliant and scoring nominal 12 atm, RBP 20 atm, about 0.8% per atm, deflation < 15 s (FDA P200041 SSED); NC RBP 20-22 atm for 2-4 mm (FDA K222538)");
const DES_SRC = INHERITED("DES compliance chart, nominal and RBP, lengths and dilatation limits (FDA P070015 Table 14-1); deflation 16-21 s (FDA P110010 Table 6.1)");

export const DEVICES: DeviceSpec[] = [
  // ----- standard balloons (the first four keep their ids; deviceFor() finds a kind's first entry) -----
  {
    id: "sc",
    cls: "balloon",
    balloon: "semi-compliant",
    balloonType: "semi-compliant",
    label: "Semi-compliant balloon",
    shaft: "rx",
    diameters: [1.5, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0],
    lengths: [6, 8, 12, 15, 20, 25, 30],
    nominalAtm: () => 6,
    rbpAtm: () => 14,
    chart: (d) => linearChart(d, 6, 14, MP_SC_FRAC_PER_ATM),
    profileMm: (d) => 0.79 * Math.sqrt(d / 3),
    EI: 3,
    deflateSpecS: () => 15,
    minFrench: () => 6,
    usableCm: 142,
    notes: ["Pre-dilatation. Grows with pressure: check the chart before going above nominal."],
    sources: [SC_SRC, src(SRC.balloonsStandard, "compliance table: semi-compliant more flexible and easier to deliver than non-compliant")],
    modelParam: ["chart", "profileMm (scaled from the 3.0 mm value)", "EI", "usableCm"],
  },
  {
    id: "nc",
    cls: "balloon",
    balloon: "non-compliant",
    balloonType: "non-compliant",
    label: "Non-compliant balloon",
    shaft: "rx",
    diameters: [2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0, 4.5, 5.0],
    lengths: [6, 8, 12, 15, 20],
    nominalAtm: () => 12,
    rbpAtm: (d) => (d <= 4 ? 20 : 18),
    chart: (d) => linearChart(d, 12, d <= 4 ? 20 : 18, NC_FRAC_PER_ATM, 4),
    profileMm: (d) => 0.9 * Math.sqrt(d / 3),
    EI: 5,
    deflateSpecS: () => 15,
    minFrench: () => 6,
    usableCm: 142,
    notes: ["High-pressure post-dilatation inside the stent. Keep it within the stent edges."],
    sources: [NC_SRC, src(SRC.balloonsStandard, "compliance table: non-compliant harder to deliver, higher crossing profile and less flexible (Brilakis 19.9.3)")],
    modelParam: ["profileMm", "EI", "usableCm", "rbpAtm above 4 mm"],
  },
  {
    id: "scoring",
    cls: "balloon",
    balloon: "scoring",
    balloonType: "scoring",
    label: "Scoring balloon",
    shaft: "rx",
    diameters: [2.0, 2.5, 3.0, 3.5, 4.0],
    lengths: [10, 15, 20],
    nominalAtm: () => 12,
    rbpAtm: () => 20,
    chart: (d) => linearChart(d, 12, 20, NC_FRAC_PER_ATM, 4),
    profileMm: (d) => 1.0 * Math.sqrt(d / 3),
    EI: 7,
    deflateSpecS: () => 15,
    minFrench: () => 6,
    usableCm: 139,
    notes: ["Spiral struts score fibrocalcific plaque and stop the balloon slipping. No slow inflation needed."],
    sources: [NC_SRC, src(SRC.balloonsSpecialty, "plaque modification table: spiral scoring balloon, no slow inflation needed; all are less deliverable than standard balloons")],
    modelParam: ["profileMm", "EI", "usableCm", "diameters", "lengths"],
  },
  {
    id: "ivl",
    cls: "balloon",
    balloon: "ivl",
    balloonType: "ivl",
    label: "Lithotripsy balloon",
    shaft: "rx",
    diameters: [2.5, 3.0, 3.5, 4.0],
    lengths: [12],
    nominalAtm: () => 6,
    rbpAtm: () => 10,
    chart: (d) => linearChart(d, 6, 10, MP_IVL_FRAC_PER_ATM, 2),
    // printed crossing profile about 0.044 in. (0.043 in. at 2.5 mm, up to 0.046 in. at 4.0 mm); linear between
    profileMm: (d) => mmOf(0.043 + ((Math.min(4, Math.max(2.5, d)) - 2.5) / 1.5) * 0.003),
    EI: 6,
    deflateSpecS: () => 15,
    minFrench: () => 6,
    usableCm: 138,
    notes: ["Size 1:1 to the reference. Pulses at 4 atm: 10 per cycle, at most 80 per catheter.", "May not cross a tight lesion."],
    sources: [
      src(SRC.calciumIvl, "'The coronary lithotripsy catheter as printed': 2.5-4.0 mm, 12 mm, 0.014 in. wire, 6 Fr, 138 cm, crossing profile 0.043-0.046 in., 80 pulses"),
      SIM_FACTS("§16 lithotripsy: pulses at 4 atm or less, 6 atm nominal, 10 atm RBP, 10 pulses per cycle"),
    ],
    modelParam: ["chart", "EI", "profileMm between the printed end values"],
  },
  // ----- small and specialty balloons -----
  {
    id: "small",
    cls: "balloon",
    balloon: "semi-compliant",
    balloonType: "small",
    label: "Small low-profile balloon",
    shaft: "rx",
    diameters: [1.0, 1.25, 1.5],
    lengths: [10, 15, 20, 30],
    nominalAtm: () => 6,
    rbpAtm: () => 14,
    chart: (d) => linearChart(d, 6, 14, MP_SC_FRAC_PER_ATM),
    profileMm: (d) => mmOf(0.024) * Math.sqrt(d / 1.2),
    EI: 2,
    deflateSpecS: () => 15,
    minFrench: () => 6,
    usableCm: 142,
    profileAfterInflation: 1.25,
    singleMarker: true,
    notes: ["Single central marker: the marker segment is the thickest point.", "A longer balloon lets the thin front part enter before the marker meets the hardest segment.", "Loses its profile once inflated: use a new one to try again."],
    sources: [
      src(SRC.balloonsStandard, "'Small balloons for crossing' table (Brilakis 30.9.2, 23.1.1): 1.0 mm low-profile balloons; small balloons 1.5 mm or less single marker, rapid exchange, compliant, long"),
      src(SRC.balloonsStandard, "'Profile' list: single-marker balloons thickest at the marker; a longer balloon (20-30 mm); balloons lose their profile once inflated"),
    ],
    modelParam: ["nominalAtm", "rbpAtm", "chart", "profileMm (scaled from the printed microdilation profile)", "profileAfterInflation", "EI", "usableCm"],
  },
  {
    id: "microdilation",
    cls: "balloon",
    balloon: "semi-compliant",
    balloonType: "microdilation",
    label: "Microdilation catheter",
    shaft: "rx",
    diameters: [1.2],
    lengths: [12],
    nominalAtm: () => 6,
    rbpAtm: () => 14,
    chart: (d) => linearChart(d, 6, 14, MP_SC_FRAC_PER_ATM),
    profileMm: () => mmOf(0.024),
    entryProfileMm: mmOf(0.017),
    EI: 2,
    deflateSpecS: () => 15,
    minFrench: () => 6,
    usableCm: 142,
    profileAfterInflation: 1.25,
    notes: ["Kink-resistant hydrophilic shaft for balloon-uncrossable lesions.", "Entry profile 0.017 in., crossing profile 0.024 in."],
    sources: [src(SRC.balloonsStandard, "'Profile' list: a 1.20 × 12 mm microdilation catheter, entry profile 0.017 in., crossing profile 0.024 in."), src(SRC.balloonsStandard, "'Small balloons for crossing' table")],
    modelParam: ["nominalAtm", "rbpAtm", "chart", "profileAfterInflation", "EI", "usableCm"],
  },
  {
    id: "otw",
    cls: "balloon",
    balloon: "semi-compliant",
    balloonType: "otw",
    label: "Over-the-wire balloon",
    shaft: "otw",
    diameters: [1.25, 1.5, 2.0, 2.5, 3.0],
    lengths: [10, 15, 20],
    nominalAtm: () => 6,
    rbpAtm: () => 14,
    chart: (d) => linearChart(d, 6, 14, MP_SC_FRAC_PER_ATM),
    profileMm: (d) => 0.82 * Math.sqrt(d / 3),
    EI: 4,
    deflateSpecS: () => 15,
    minFrench: () => 6,
    trapMinFrench: 7,
    usableCm: 142,
    contrastThroughLumen: true,
    notes: ["The wire runs its whole length: exchanges need an exchange-length wire or trapping.", "Pushes less well than the rapid-exchange version; allows wire exchange and distal contrast.", "Too bulky to trap in a 6 Fr guide."],
    sources: [
      src(SRC.balloonsStandard, "'From the hub to the tip': over-the-wire balloons, exchange-length wire, mostly CTO use"),
      src(SRC.balloonsStandard, "'Profile' list: rapid-exchange crossing balloons push better; the over-the-wire version allows wire exchange and contrast injection"),
      src(SRC.cart, "compatibility table: a 6 Fr guide is too small to trap over-the-wire balloons"),
    ],
    modelParam: ["nominalAtm", "rbpAtm", "chart", "profileMm", "EI", "usableCm", "diameters", "lengths", "trapMinFrench 7 (6 Fr is stated too small)"],
  },
  {
    id: "cutting",
    cls: "balloon",
    balloon: "scoring",
    balloonType: "cutting",
    label: "Cutting balloon",
    shaft: "rx",
    diameters: [2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0],
    lengths: [6, 10, 15],
    nominalAtm: () => 6,
    rbpAtm: () => 12,
    chart: (d) => linearChart(d, 6, 12, NC_FRAC_PER_ATM, 2),
    profileMm: (d) => 1.08 * Math.sqrt(d / 3),
    EI: 8,
    deflateSpecS: () => 15,
    minFrench: () => 6,
    usableCm: 142,
    maxInflateAtmPerS: 0.2,
    notes: ["Inflate and deflate slowly: about 1 atm every 5 seconds.", "Usually 6-8 atm; not above 12 atm (14 atm in the undilatable-lesion chapter).", "Deflate fully before withdrawing: the blades injure the artery."],
    sources: [
      src(SRC.balloonsSpecialty, "plaque modification table: cutting balloon, blades 0.005 in., about 1 atm every 5 s, usually 6-8 atm, not above 12 atm (9.7.9; 23.2.3 says avoid more than 14 atm); high crossing profile"),
      src(SRC.calciumBalloons, "cutting balloon row: 6-8 atm, ceiling 12 atm (ch 9) or 14 atm (ch 23)"),
    ],
    modelParam: ["nominalAtm (the low end of the usual 6-8 atm)", "chart", "profileMm", "EI", "usableCm", "diameters", "lengths"],
  },
  {
    id: "scoring-wire",
    cls: "balloon",
    balloon: "scoring",
    balloonType: "scoring-wire",
    label: "Wire-alongside scoring balloon",
    shaft: "rx",
    diameters: [0.6],
    lengths: [5],
    nominalAtm: () => 25,
    rbpAtm: () => 30,
    chart: (d) => linearChart(d, 25, 30, NC_FRAC_PER_ATM, 10),
    profileMm: () => 0.75,
    EI: 4,
    deflateSpecS: () => 15,
    minFrench: () => 6,
    usableCm: 142,
    notes: ["A 0.6 mm, 5 mm balloon beside the coronary wire: inflation drives the wire into the plaque.", "Back-load the wire so that it runs along the balloon."],
    sources: [src(SRC.balloonsSpecialty, "plaque modification table: wire-alongside scoring balloon, 0.6 mm, 5 mm long, nominal 25 atm, rated burst 30 atm")],
    modelParam: ["chart", "profileMm", "EI", "usableCm"],
  },
  {
    id: "vhp",
    cls: "balloon",
    balloon: "non-compliant",
    balloonType: "very-high-pressure",
    label: "Very-high-pressure balloon",
    shaft: "rx",
    diameters: [2.0, 2.5, 3.0, 3.5, 4.0],
    lengths: [10, 15],
    nominalAtm: () => 10,
    rbpAtm: () => 35,
    chart: (d) => linearChart(d, 10, 35, MP_VHP_FRAC_PER_ATM, 4),
    profileMm: (d) => 0.95 * Math.sqrt(d / 3),
    EI: 6,
    deflateSpecS: () => 15,
    minFrench: () => 6,
    usableCm: 142,
    notes: ["A twin-layer non-compliant balloon that expands evenly at very high pressure.", "Usually used at 30-35 atm; rated burst pressure 35 atm in the case report. Rupture risk 2-3%."],
    sources: [src(SRC.balloonsSpecialty, "'Very-high-pressure and lithotripsy balloons' table: more than 40 atm possible; usually 30-35 atm; rated burst 35 atm in a 2010 four-case report; rupture risk 2%-3% (Brilakis 30.9.7, 9.7.9; Raja 2010; Secco 2019)")],
    modelParam: ["nominalAtm", "chart", "profileMm", "EI", "usableCm", "diameters", "lengths"],
  },
  {
    id: "dcb",
    cls: "balloon",
    balloon: "semi-compliant",
    balloonType: "dcb",
    label: "Drug-coated balloon",
    shaft: "rx",
    diameters: [2.0, 2.5, 3.0, 3.5, 4.0],
    lengths: [10, 15, 20, 25, 30],
    nominalAtm: () => 7,
    rbpAtm: () => 14,
    chart: (d) => linearChart(d, 7, 14, MP_SC_FRAC_PER_ATM),
    profileMm: (d) => 0.95 * Math.sqrt(d / 3),
    EI: 4,
    deflateSpecS: () => 15,
    minFrench: () => 6,
    usableCm: 142,
    notes: ["Carries a drug (most often paclitaxel or sirolimus) released into the wall on inflation.", "Prepare the lesion first; devices differ, so results with one cannot be assumed for another."],
    sources: [src(SRC.balloonsSpecialty, "'Drug-coated, trapping and ostial balloons': drug-coated balloons, paclitaxel or sirolimus; restenosis, bifurcations, small vessels; no class effect")],
    modelParam: ["nominalAtm", "rbpAtm", "chart", "profileMm", "EI", "usableCm", "diameters", "lengths"],
  },
  {
    id: "trap",
    cls: "balloon",
    balloon: "semi-compliant",
    balloonType: "trapping",
    label: "Trapping balloon",
    shaft: "rx",
    diameters: [2.5, 3.0],
    lengths: [20],
    nominalAtm: () => 8,
    rbpAtm: () => 20,
    chart: (d) => linearChart(d, 8, 20, MP_SC_FRAC_PER_ATM),
    profileMm: () => 0.7,
    EI: 2,
    deflateSpecS: () => 15,
    minFrench: () => 6,
    usableCm: 115,
    notes: ["No wire lumen: lower profile, resists kinking.", "2.5 mm for a 6-7 Fr guide, 3.0 mm for a 7-8 Fr guide; 20 mm or longer; 15-20 atm.", "Back-bleed before the next injection."],
    sources: [
      src(SRC.balloonsSpecialty, "'Trapping balloons': 2.5 mm for 6-7 Fr, 3.0 mm for 7-8 Fr, 20 mm or more; dedicated trapping balloons have no wire lumen"),
      src(SRC.microcatheters, "'Trapping a microcatheter, in outline': inflate to 15-20 atm; back-bleed"),
    ],
    modelParam: ["nominalAtm", "rbpAtm (set at the top of the 15-20 atm trapping range)", "chart", "profileMm", "EI", "usableCm"],
  },
  {
    id: "flare",
    cls: "balloon",
    balloon: "non-compliant",
    balloonType: "flaring",
    label: "Dual-balloon ostial flaring catheter",
    shaft: "rx",
    diameters: [3.0, 3.5, 4.0, 4.5],
    lengths: [8],
    nominalAtm: () => 8,
    rbpAtm: () => 16,
    chart: (d) => linearChart(d, 8, 16, NC_FRAC_PER_ATM, 4),
    profileMm: (d) => 1.2 * Math.sqrt(d / 3),
    EI: 9,
    deflateSpecS: () => 15,
    minFrench: () => 6,
    usableCm: 140,
    notes: ["Proximal anchoring balloon up to 14 mm, low pressure, inflated with a 1 mL syringe, sits in the aorta.", "Distal balloon 8 mm long, inflated with an inflation device.", "Proximal marker in the aorta, middle marker at the ostium."],
    sources: [src(SRC.balloonsSpecialty, "'Dual-balloon ostial flaring catheter': anchoring balloon up to 14 mm with a 1 mL syringe; distal balloon 8 mm long, 3.0-4.5 mm; three markers")],
    modelParam: ["nominalAtm", "rbpAtm", "chart", "profileMm", "EI", "usableCm", "minFrench"],
  },
  // ----- stents -----
  {
    id: "des",
    cls: "stent",
    label: "Drug-eluting stent (thin-strut cobalt-chromium)",
    shaft: "rx",
    diameters: [2.25, 2.5, 2.75, 3.0, 3.5, 4.0, 4.5, 5.0],
    lengths: [8, 12, 15, 18, 23, 28, 33, 38, 48],
    nominalAtm: (d) => (d < 2.9 ? 8 : 9),
    rbpAtm: () => 16,
    chart: desChart,
    profileMm: (d) => 1.05 * Math.sqrt(d / 3),
    EI: 14,
    dilatationLimit: (d) => (d <= 3.0 ? 3.5 : d <= 4.0 ? 4.5 : 5.75),
    deflateSpecS: (d) => (d >= 3.5 ? 21 : 16),
    minFrench: () => 6,
    usableCm: 143,
    notes: ["Labelled diameter is the expanded inner diameter.", "Markers sit just beyond each stent end.", "Do not dilate beyond the stated limit."],
    sources: [
      DES_SRC,
      src(SRC.stentBuild, "'Size facts' table (Brilakis 10.1, 10.2, 22.3): largest 5.0 mm expandable to 5.75 mm; longest 60 mm in Europe and 40 mm in the US; shafts 140-145 cm"),
    ],
    modelParam: ["chart for 2.25, 4.5 and 5.0 mm", "dilatationLimit for 4.5 mm (the sourced 5.75 mm is for the 5.0 mm stent)", "lengths 33-48 mm (within the sourced 60 mm)", "profileMm", "EI"],
  },
  {
    id: "covered",
    cls: "covered-stent",
    kind: "sandwich-ptfe",
    label: "Covered stent (two-layer PTFE)",
    shaft: "rx",
    diameters: [2.8, 3.5, 4.0, 4.5, 4.8],
    lengths: [16, 19, 26],
    nominalAtm: () => 15,
    rbpAtm: () => 18,
    chart: (d) => linearChart(d, 15, 18, NC_FRAC_PER_ATM, 8),
    profileMm: (d) => 1.45 * Math.sqrt(d / 3),
    EI: 22,
    dilatationLimit: () => 5,
    deflateSpecS: () => 21,
    minFrench: (d) => (d <= 4.0 ? 6 : 7),
    blockAndDeliverFrench: 8,
    shorteningMmPerEnd: 1.6,
    usableCm: 140,
    notes: ["Bail-out for a large-vessel perforation. At least 15 atm; higher pressure for up to 60 s is preferred.", "Shortens up to 1.6 mm at each end: overlap generously.", "Bulky and stiff; hard to pass through earlier stents."],
    sources: [
      src(SRC.perforationLarge, "covered stent comparison table: diameters 2.8, 3.5, 4.0, 4.5 and 4.8 mm; lengths 16, 19 and 26 mm; 6 Fr (2.8-4.0 mm), 7 Fr (4.5 and 4.8 mm); at least 15 atm (its nominal pressure); shortens up to 1.6 mm at each end; block and deliver usually 8 Fr"),
      src(SRC.cart, "compatibility table: sandwich PTFE covered stent 6 Fr for 2.8-4.0 mm, 7 Fr for 4.5 and 4.8 mm; with a balloon through an 8 Fr guide"),
    ],
    modelParam: ["rbpAtm", "chart", "dilatationLimit", "profileMm", "EI", "deflateSpecS", "usableCm"],
  },
  {
    id: "covered-pu",
    cls: "covered-stent",
    kind: "polyurethane",
    label: "Covered stent (single-layer polyurethane)",
    shaft: "rx",
    diameters: [2.5, 3.0, 3.5, 4.0, 4.5, 5.0],
    lengths: [15, 20, 26],
    nominalAtm: () => 11,
    rbpAtm: () => 16,
    chart: (d) => linearChart(d, 11, 16, NC_FRAC_PER_ATM, 6),
    profileMm: (d) => 1.15 * Math.sqrt(d / 3),
    EI: 15,
    dilatationLimit: (d) => (d <= 3.0 ? 3.5 : d <= 4.0 ? 4.65 : 5.63),
    deflateSpecS: () => 21,
    minFrench: (d) => (d <= 4.0 ? 5 : 6),
    usableCm: 140,
    notes: ["Bail-out for a large-vessel perforation. Easier to deliver than the two-layer design.", "Can occasionally come off its balloon."],
    sources: [
      src(SRC.perforationLarge, "covered stent comparison table: diameters 2.5-5.0 mm in 0.5 mm steps; lengths 15, 20 and 26 mm; 5 Fr (2.5-4.0 mm), 6 Fr (4.5 and 5.0 mm); post-dilatable to 3.50, 4.65 and 5.63 mm"),
      src(SRC.stentBuild, "'Covered stent designs in Brilakis 30.18.1': easier to deliver but can occasionally come off its balloon"),
    ],
    modelParam: ["nominalAtm", "rbpAtm", "chart", "profileMm", "EI", "deflateSpecS", "usableCm"],
  },
  // ----- microcatheters -----
  ...(
    [
      ["mc-large", "large", "Microcatheter (large outer diameter)", 0.034, 0.018, "Wire support for antegrade CTO crossing and any other microcatheter task. Can be spun, but over-spinning damages it.", "large outer diameter row"],
      ["mc-small", "small", "Microcatheter (small outer diameter)", 0.026, 0.016, "Small, tortuous vessels and retrograde collaterals. Braided versions without a coil are mainly pushed; aggressive rotation can break the tip.", "small outer diameter row"],
      ["mc-angulated", "angulated", "Angulated microcatheter (fixed tip)", 0.031, 0.017, "Fixed 45, 90 or 120 degree tips for side branches at difficult angles; can stop a wire prolapsing into a branch.", "angulated row: fixed-angle versions in 45, 90 and 120 degree tips"],
      ["mc-deflectable", "deflectable", "Deflectable-tip microcatheter", 0.038, 0.017, "Bends up to 90 degrees with a 2.5 mm radius; take care in arteries under 2.5 mm and straighten it before moving it. Fits a 6 Fr guide; trapping it or parallel wiring needs 8 Fr.", "angulated row: deflectable tip up to 90 degrees, 2.5 mm bend radius, fits a 6 Fr guide; trapping or parallel wiring needs an 8 Fr guide"],
      ["mc-dual", "dual-lumen", "Dual-lumen microcatheter", 0.042, 0.017, "Places a second wire beside the first: side branches, jailed branches, reversed wire. Hard to deliver; remove it with a trapping balloon.", "dual-lumen row"],
      ["mc-plaque", "plaque-modification", "Plaque modification microcatheter", 0.029, 0.015, "Advance anticlockwise and withdraw clockwise, at most 20 turns in one direction. Contrast cannot be injected through it.", "plaque modification row: stranded-steel type advanced anticlockwise, withdrawn clockwise, no more than 20 turns, no contrast"],
    ] as const
  ).map(
    ([id, kind, label, tipIn, lumenIn, note, row]): DeviceSpec => ({
      id,
      cls: "microcatheter",
      kind,
      label,
      shaft: "otw",
      diameters: [0],
      lengths: [0],
      sizeUnit: "none",
      lengthUnit: "none",
      ...NO_PRESSURE,
      profileMm: () => mmOf(tipIn),
      EI: kind === "deflectable" ? 9 : kind === "dual-lumen" ? 8 : kind === "small" ? 3 : 5,
      minFrench: () => 6,
      trapMinFrench: kind === "deflectable" ? 8 : 6,
      usableCm: 150,
      usableCmOptions: [135, 150],
      wireIn: 0.014,
      contrastThroughLumen: kind !== "plaque-modification",
      rotation: kind === "plaque-modification" ? { advance: "anticlockwise", maxTurns: 20 } : undefined,
      notes: [note, `Tip outer diameter ${tipIn.toFixed(3)} in., lumen ${lumenIn.toFixed(3)} in. (teaching values).`, "Load the wire into it first and introduce the pair together; flush after contrast."],
      sources: [
        src(SRC.microcatheters, `'Microcatheter categories (Brilakis 30.6)' table, ${row}`),
        src(SRC.microcatheters, "'What a microcatheter does for you': all take a 0.014 in. wire; flush after contrast"),
        src(SRC.extensionDevice, "'The device', trapping version: works best with 135 cm microcatheters; 150 cm ones are often too long"),
        src(SRC.cart, "compatibility table: 6 Fr guides with a 0.071 in. lumen can trap low-profile microcatheters"),
      ],
      modelParam: ["tip outer diameter and lumen", "profileMm", "EI", "minFrench (other than the deflectable type)"],
    })
  ),
  // ----- guide extensions -----
  {
    id: "extension",
    cls: "extension",
    kind: "standard",
    label: "Guide extension catheter",
    shaft: "rx",
    diameters: [5, 5.5, 6, 7, 8],
    lengths: [25, 40],
    sizeUnit: "Fr",
    lengthUnit: "cm",
    ...NO_PRESSURE,
    profileMm: () => 1.7,
    EI: 10,
    minFrench: (fr) => Math.min(8, Math.max(5, Math.ceil(fr))) as GuideFrench,
    innerDiameterIn: extensionInnerDiameterIn,
    usableCm: 150,
    notes: ["A short cylinder on a push rod, advanced through the guide into the vessel: more back-up, but it can damp pressure and injure the vessel.", "Leaves a lumen about two French smaller than the guide's.", "Keep the collar inside the guide."],
    sources: [
      src(SRC.extensionDevice, "'Inner diameters of guide extensions by size (Brilakis Table 30.5)'"),
      src(SRC.extensionDevice, "'The device': cylinder 25 cm in most designs, 40 cm for some; overall usable length 145-150 cm; proximal collar"),
      src(SRC.extensionUse, "drill: 'add a matched guide extension'; case eq-sheaths-guides-case-stuck-stent: 'a matched 6 Fr extension'"),
    ],
    modelParam: ["profileMm", "EI", "minFrench (matched to the guide; 5.5 Fr assumed for a 6 Fr guide)"],
  },
  {
    id: "extension-trap",
    cls: "extension",
    kind: "trapping",
    label: "Guide extension with trapping balloon",
    shaft: "rx",
    diameters: [6, 7, 8],
    lengths: [13],
    sizeUnit: "Fr",
    lengthUnit: "cm",
    ...NO_PRESSURE,
    profileMm: () => 1.8,
    EI: 11,
    minFrench: (fr) => Math.min(8, Math.max(6, Math.ceil(fr))) as GuideFrench,
    innerDiameterIn: extensionInnerDiameterIn,
    usableCm: 150,
    notes: ["A balloon just proximal to the collar pins a short wire inside the guide.", "Works best with 135 cm microcatheters.", "The 8 Fr size allows an orbital crown to be trapped."],
    sources: [src(SRC.extensionDevice, "'The device', trapping version: 6-8 Fr, cylinder 13 cm, best with 135 cm microcatheters"), src(SRC.extensionDevice, "'What fits': orbital crown trapping through an 8 Fr extension with a built-in trapping balloon")],
    modelParam: ["profileMm", "EI", "innerDiameterIn (assumed as Table 30.5 for the same size)"],
  },
  {
    id: "extension-5in6",
    cls: "extension",
    kind: "catheter-in-catheter",
    label: "Catheter-in-catheter system (5 Fr in 6 Fr)",
    shaft: "otw",
    diameters: [5],
    lengths: [120],
    sizeUnit: "Fr",
    lengthUnit: "cm",
    ...NO_PRESSURE,
    profileMm: () => 1.67,
    EI: 12,
    minFrench: () => 6,
    innerDiameterIn: () => [CATHETER_IN_CATHETER_ID_IN, CATHETER_IN_CATHETER_ID_IN],
    usableCm: 120,
    notes: ["No push rod: a 120 cm, 5 Fr catheter passed through a standard 6 Fr guide.", "Inner diameter 0.059 in., about a 5 Fr guide."],
    sources: [src(SRC.extensionDevice, "'The device', catheter-in-catheter version: 120 cm, 5 Fr through a 6 Fr guide"), src(SRC.extensionDevice, "Table 30.5: 5 Fr catheter in a 6 Fr guide, 0.059 in. (1.50 mm)")],
    modelParam: ["profileMm", "EI"],
  },
  // ----- aspiration -----
  {
    id: "aspiration",
    cls: "aspiration",
    label: "Aspiration catheter",
    shaft: "rx",
    diameters: [6, 7],
    lengths: [0],
    sizeUnit: "Fr",
    lengthUnit: "none",
    ...NO_PRESSURE,
    profileMm: (fr) => (fr >= 7 ? 1.7 : 1.45),
    EI: 6,
    minFrench: (fr) => (fr >= 7 ? 7 : 6),
    usableCm: 140,
    notes: ["A rapid-exchange lumen for the wire and a larger lumen for aspiration to a locking vacuum syringe.", "The 7 Fr catheter removes more thrombus but needs a 7 Fr guide; a 6 Fr catheter will not enter a 6 Fr guide that holds a buddy wire.", "Can damp the guide pressure in a 6 Fr guide."],
    sources: [src(SRC.aspiration, "aspiration catheter list: dual lumen, locking vacuum syringe; 7 Fr removes more thrombus but needs a 7 Fr guide; a 6 Fr catheter will not go into a 6 Fr guide with a buddy wire; damping in a 6 Fr guide")],
    modelParam: ["profileMm", "EI", "usableCm"],
  },
  // ----- imaging -----
  {
    id: "ivus",
    cls: "ivus",
    kind: "rotational-ivus",
    label: "IVUS imaging catheter (rotational)",
    shaft: "rx",
    diameters: [0],
    lengths: [0],
    sizeUnit: "none",
    lengthUnit: "none",
    ...NO_PRESSURE,
    profileMm: () => 1.0,
    EI: 4,
    minFrench: () => 6,
    usableCm: 135,
    imaging: { modality: "ivus", tech: "rotational", frequencyMHz: [40, 60], pullbackMmS: [0.5, 1, 10] },
    notes: ["Advance beyond the lesion, then a motorised pullback.", "Flush before it enters the body. Lower profile than the phased-array catheter; measures length on a motorised pullback."],
    sources: [
      src(SRC.imagingIvus, "'The two IVUS catheter families (Brilakis table 13.4 and 30.17)': rotational, flush first, easier crossing, higher resolution, length measurement"),
      src(SRC.imagingWhich, "rotational IVUS: Brilakis lists catheters of 40-60 MHz"),
      src(SRC.imagingIvus, "pullback: usually 1-10 mm/s depending on the catheter (Brilakis); 0.5-1.0 mm/s (Oxford)"),
    ],
    modelParam: ["profileMm", "EI", "usableCm", "minFrench"],
  },
  {
    id: "ivus-phased",
    cls: "ivus",
    kind: "phased-array-ivus",
    label: "IVUS imaging catheter (phased-array)",
    shaft: "rx",
    diameters: [0],
    lengths: [0],
    sizeUnit: "none",
    lengthUnit: "none",
    ...NO_PRESSURE,
    profileMm: () => 1.15,
    EI: 5,
    minFrench: () => 6,
    usableCm: 135,
    imaging: { modality: "ivus", tech: "phased-array", frequencyMHz: [20, 20], pullbackMmS: [0.5, 1] },
    notes: ["No preparation. Press clear view in a roomy segment before crossing.", "Harder to deliver, lower resolution, jumps during pullback; images close to its tip (short-tip version 2.5 mm)."],
    sources: [src(SRC.imagingIvus, "'The two IVUS catheter families' table: phased-array no preparation, harder crossing, lower resolution (an example at 20 MHz), jumps, CTO use"), src(SRC.imagingWhich, "solid-state IVUS: a short-tip version puts the imaging element 2.5 mm from the tip")],
    modelParam: ["profileMm", "EI", "usableCm", "minFrench"],
  },
  {
    id: "oct",
    cls: "oct",
    kind: "oct",
    label: "OCT imaging catheter",
    shaft: "rx",
    diameters: [0],
    lengths: [0],
    sizeUnit: "none",
    lengthUnit: "none",
    ...NO_PRESSURE,
    profileMm: () => 0.95,
    EI: 4,
    minFrench: () => 5,
    usableCm: 135,
    imaging: { modality: "oct", tech: "oct", pullbackMmS: [18, 36], guideHandInjectionMinFrench: 6 },
    notes: ["Clear the blood with a contrast flush for the run: 36 mm/s survey or 18 mm/s high resolution.", "Through a 5 Fr guide a hand injection does not clear the lumen: use a power injector or a 6 Fr guide."],
    sources: [src(SRC.imagingOct, "'Before you start': guide usually 6 Fr or larger for a hand injection; 5 Fr needs a power injector"), src(SRC.imagingOct, "'The two acquisition modes' table (Brilakis table 13.3): 75 mm at 36 mm/s, 54 mm at 18 mm/s")],
    modelParam: ["profileMm", "EI", "usableCm"],
  },
  // ----- atherectomy and laser -----
  {
    id: "rota",
    cls: "atherectomy",
    kind: "rotational",
    label: "Rotational atherectomy burr",
    shaft: "otw",
    diameters: [...BURR_SIZES_MM],
    lengths: [0],
    sizeUnit: "mm",
    lengthUnit: "none",
    ...NO_PRESSURE,
    profileMm: (d) => d,
    EI: 7,
    minFrench: burrMinFrench,
    usableCm: 135,
    speedsRpm: [135000, 180000],
    notes: ["Diamond crystals on the leading edge only: it ablates forwards and can be trapped on the way back.", "Burr-to-artery ratio about 0.5; 1.5 mm is the usual burr.", "1.25-1.75 mm in a 6 Fr guide, 2.0 mm in 7 Fr, 2.15-2.25 mm in 8 Fr."],
    sources: [
      src(SRC.calciumRota, "'Components of the rotational atherectomy system': eight sizes 1.25-2.5 mm; leading-edge diamonds"),
      src(SRC.calciumSetup, "guide step: burrs 1.25-1.75 mm through 6 Fr, 2.0 mm at least 7 Fr, 2.15-2.25 mm at least 8 Fr (Table 19.1)"),
      SIM_FACTS("§15 rotational atherectomy: 135,000-180,000 rpm"),
    ],
    modelParam: ["EI", "usableCm", "minFrench for 2.38 and 2.5 mm (none of 5-8 Fr, by the Table 30.4 lumens)"],
  },
  {
    id: "orbital",
    cls: "atherectomy",
    kind: "orbital",
    label: "Orbital atherectomy crown",
    shaft: "otw",
    diameters: [1.25],
    lengths: [0],
    sizeUnit: "mm",
    lengthUnit: "none",
    ...NO_PRESSURE,
    profileMm: () => 1.25,
    EI: 8,
    minFrench: () => 6,
    trapMinFrench: 7,
    usableCm: 135,
    speedsRpm: [5000, 80000, 120000],
    notes: ["An eccentric diamond-coated crown whose orbit widens with speed: 80,000 or 120,000 rpm, glide at 5,000 rpm.", "Can be trapped with a balloon in a 7 or 8 Fr guide, not in 6 Fr and not alongside a standard extension.", "Not in recently placed stents."],
    sources: [
      src(SRC.calciumOrbital, "device table: eccentric 1.25 mm crown, 6 Fr guide compatible; 80,000 and 120,000 rpm, glide 5,000 rpm; not in recently placed stents"),
      src(SRC.calciumSetup, "crown trapping in 7 or 8 Fr, not 6 Fr, not alongside an ordinary extension (Table 19.2)"),
    ],
    modelParam: ["EI", "usableCm"],
  },
  {
    id: "laser",
    cls: "laser",
    kind: "excimer",
    label: "Excimer laser catheter",
    shaft: "rx",
    diameters: [0.9, 1.4, 1.7, 2.0],
    lengths: [0],
    sizeUnit: "mm",
    lengthUnit: "none",
    ...NO_PRESSURE,
    profileMm: (d) => d,
    EI: 5,
    minFrench: laserMinFrench,
    usableCm: 140,
    laser: { hz: [25, 80], fluence: [30, 80], onS: 10, offS: 5 },
    notes: ["The 0.9 mm catheter, compatible with 6 Fr guides, is nearly always used in coronaries.", "Lases 10 s on, 5 s off; 25-80 Hz, 30-80 mJ/mm².", "The console takes about 5 minutes to warm up."],
    sources: [src(SRC.calciumLaser, "'The laser system (Brilakis 30.11)': 308 nm; 25-80 Hz; 30-80 mJ/mm²; catheters 0.9, 1.4, 1.7 and 2.0 mm; 0.9 mm compatible with 6 Fr; 10 s on, 5 s off"), src(SRC.calciumSetup, "'The team': the laser console needs about 5 minutes to warm up")],
    modelParam: ["EI", "usableCm", "minFrench for 1.4-2.0 mm (derived from the Table 30.4 lumens with no clearance allowance)"],
  },
  // ----- retrieval and bail-out -----
  {
    id: "snare-coronary",
    cls: "snare",
    kind: "coronary",
    label: "Snare (coronary)",
    shaft: "otw",
    diameters: [2, 3, 4],
    lengths: [0],
    sizeUnit: "mm",
    lengthUnit: "none",
    ...NO_PRESSURE,
    profileMm: () => 1.0,
    EI: 3,
    minFrench: () => 6,
    usableCm: 150,
    notes: ["Retrieves lost or entrapped equipment. Three-loop snares preferred.", "Keep the collapsing tool: it is needed to reintroduce the snare."],
    sources: [src(SRC.cart, "compatibility table: coronary snares 2-4 mm; three-loop snares preferred; keep the collapsing tool")],
    modelParam: ["profileMm", "EI", "minFrench", "usableCm", "diameters (steps within 2-4 mm)"],
  },
  {
    id: "snare-aortic",
    cls: "snare",
    kind: "aortic",
    label: "Snare (aortic)",
    shaft: "otw",
    diameters: [18, 30, 45],
    lengths: [0],
    sizeUnit: "mm",
    lengthUnit: "none",
    ...NO_PRESSURE,
    profileMm: () => 2.0,
    EI: 4,
    minFrench: () => 6,
    vesselRangeMm: (d) => (d <= 18 ? [18, 30] : d <= 30 ? [18, 30] : [27, 45]),
    usableCm: 120,
    notes: ["Large snares for the aorta: 18-30 mm or 27-45 mm."],
    sources: [src(SRC.cart, "compatibility table: aortic snares 27-45 mm or 18-30 mm")],
    modelParam: ["profileMm", "EI", "minFrench", "usableCm"],
  },
  {
    id: "epd-sheath",
    cls: "embolic-protection",
    kind: "sheath-filter",
    label: "Filter embolic protection (sheath-delivered filter wire)",
    shaft: "rx",
    diameters: [3.5, 5.5],
    lengths: [0],
    sizeUnit: "mm",
    lengthUnit: "none",
    ...NO_PRESSURE,
    // 3.2 Fr crossing profile; 1 Fr = 1/3 mm
    profileMm: () => 3.2 / 3,
    EI: 3,
    minFrench: () => 6,
    vesselRangeMm: (d) => (d <= 3.5 ? [2.25, 3.5] : [3.5, 5.5]),
    usableCm: 190,
    usableCmOptions: [190, 300],
    notes: ["The wire crosses with the filter folded in its sheath; 110 µm pores.", "Landing zone at least 25 mm (small) or 30 mm (large). Retrieved with a separate sheath."],
    sources: [src(SRC.epd, "'The two filters' table: two sizes 2.25-3.5 and 3.5-5.5 mm; landing zone 25 or 30 mm; 6 Fr; 110 µm pores; crossing profile 3.2 Fr; wires 190 and 300 cm")],
    modelParam: ["EI"],
  },
  {
    id: "epd-otw",
    cls: "embolic-protection",
    kind: "otw-filter",
    label: "Filter embolic protection (over-the-wire filter)",
    shaft: "otw",
    diameters: [3, 4, 5, 6, 7],
    lengths: [0],
    sizeUnit: "mm",
    lengthUnit: "none",
    ...NO_PRESSURE,
    profileMm: () => 1.1,
    EI: 3,
    minFrench: () => 6,
    vesselRangeMm: (d) => OTW_FILTER_RANGES[String(d)] ?? [3, 6],
    usableCm: 190,
    usableCmOptions: [190, 320],
    notes: ["Any 0.014 in. wire crosses first; the filter is exchanged in through a dual-ended catheter.", "Land it 4-5 cm beyond the lesion; heparin-coated nitinol mesh."],
    sources: [src(SRC.epd, "'The two filters' table: over-the-wire filter, at least 6 Fr, 4-5 cm landing, capture wire 190 cm or 320/190 cm"), src(SRC.epd, "'Sizing the over-the-wire filter (Brilakis Table 18.1)'")],
    modelParam: ["profileMm", "EI"],
  },
  {
    id: "coil-014",
    cls: "coil",
    kind: "coil-014",
    label: "Coil (0.014 in. compatible)",
    shaft: "otw",
    diameters: [2, 3, 4],
    lengths: [0],
    sizeUnit: "mm",
    lengthUnit: "none",
    ...NO_PRESSURE,
    profileMm: () => mmOf(0.014),
    EI: 1,
    minFrench: () => 6,
    wireIn: 0.014,
    usableCm: 150,
    notes: ["Passes through the standard microcatheters used in CTO PCI.", "Detachable coils can be retrieved until released; pushable coils cannot."],
    sources: [src(SRC.cart, "compatibility table: 0.014 in.-compatible coils pass through standard CTO microcatheters; 'More on the rescue devices': pushable and detachable coils")],
    modelParam: ["diameters", "EI", "minFrench", "usableCm"],
  },
  {
    id: "coil-018",
    cls: "coil",
    kind: "coil-018",
    label: "Coil (0.018 in. compatible)",
    shaft: "otw",
    diameters: [2, 3, 4],
    lengths: [0],
    sizeUnit: "mm",
    lengthUnit: "none",
    ...NO_PRESSURE,
    profileMm: () => mmOf(0.018),
    EI: 1,
    minFrench: () => 6,
    wireIn: 0.018,
    usableCm: 150,
    notes: ["Needs a larger microcatheter (around 2.4-2.5 Fr): plan it in advance."],
    sources: [src(SRC.cart, "compatibility table: 0.018 in. coils need a larger microcatheter"), src(SRC.microcatheters, "'What a microcatheter does for you': most cannot deliver 0.018 in. coils; larger microcatheters around 2.4-2.5 Fr will")],
    modelParam: ["diameters", "EI", "minFrench", "usableCm"],
  },
  {
    id: "reentry",
    cls: "re-entry",
    balloon: "semi-compliant",
    balloonType: "re-entry",
    label: "Dissection re-entry balloon",
    shaft: "otw",
    diameters: [2.5],
    lengths: [10],
    nominalAtm: () => 4,
    rbpAtm: () => 6,
    chart: (d) => linearChart(d, 4, 6, NC_FRAC_PER_ATM, 2),
    profileMm: () => 1.1,
    EI: 7,
    minFrench: () => 6,
    trapMinFrench: 7,
    usableCm: 140,
    notes: ["A flat 2.5 × 10 mm balloon with two opposed side ports, inflated at 4 atm so that one port faces the true lumen.", "Too large to trap in a 6 Fr guide."],
    sources: [src(SRC.cart, "'More on the rescue devices', dissection re-entry equipment: flat 2.5 × 10 mm balloon, two opposed side ports, 4 atm"), src(SRC.cart, "compatibility table: a 6 Fr guide is too small to trap dissection re-entry devices")],
    modelParam: ["rbpAtm", "chart", "profileMm", "EI", "minFrench", "usableCm", "trapMinFrench 7 (6 Fr is stated too small)"],
  },
  {
    id: "reentry-crossing",
    cls: "re-entry",
    kind: "crossing-catheter",
    label: "Dissection crossing catheter",
    shaft: "otw",
    diameters: [1.0],
    lengths: [0],
    sizeUnit: "mm",
    lengthUnit: "none",
    ...NO_PRESSURE,
    profileMm: () => 1.0,
    EI: 12,
    minFrench: () => 6,
    trapMinFrench: 7,
    usableCm: 140,
    notes: ["A stiff metallic over-the-wire catheter with a 1 mm blunt, rounded, hydrophilic tip, spun rapidly to advance through an occlusion."],
    sources: [src(SRC.cart, "'More on the rescue devices', dissection re-entry equipment: 1 mm blunt rounded hydrophilic tip, spun rapidly")],
    modelParam: ["EI", "minFrench", "usableCm", "trapMinFrench"],
  },
];

export const DEVICE_BY_ID: Record<string, DeviceSpec> = Object.fromEntries(DEVICES.map((d) => [d.id, d]));

export function deviceFor(kind: "balloon" | "stent", balloon: BalloonKind): DeviceSpec {
  if (kind === "stent") return DEVICE_BY_ID.des;
  return DEVICES.find((d) => d.balloon === balloon) ?? DEVICE_BY_ID.sc;
}

/** Devices of one class, in catalogue order. */
export function devicesOf(cls: DeviceClass): DeviceSpec[] {
  return DEVICES.filter((d) => d.cls === cls);
}

/** The device has an inflatable element with a labelled pressure. */
export function inflatable(spec: DeviceSpec): boolean {
  return spec.rbpAtm(spec.diameters[0]) > 0;
}

/** Diameter (mm) of a device at a pressure, read from its compliance chart (linear between rows, held flat below the first row). */
export function chartDiameter(spec: DeviceSpec, d: number, atm: number): number {
  const c = spec.chart(d);
  if (!c.atm.length) return d;
  if (atm <= c.atm[0]) {
    // below the chart: unfolding; a folded balloon reaches its working shape by about 2 atm (MODEL PARAMETER)
    const f = Math.max(0, Math.min(1, atm / Math.max(1, Math.min(c.atm[0], 2))));
    return c.mm[0] * (0.35 + 0.65 * f);
  }
  for (let i = 1; i < c.atm.length; i++) {
    if (atm <= c.atm[i]) {
      const f = (atm - c.atm[i - 1]) / (c.atm[i] - c.atm[i - 1]);
      return c.mm[i - 1] + (c.mm[i] - c.mm[i - 1]) * f;
    }
  }
  const n = c.atm.length;
  const slope = (c.mm[n - 1] - c.mm[n - 2]) / (c.atm[n - 1] - c.atm[n - 2]);
  return c.mm[n - 1] + slope * (atm - c.atm[n - 1]);
}

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------
/** The lumen (mm, lower end of the printed range) left for devices: the guide's, or the extension's when one is in (0 for an extension size Table 30.5 does not list). */
export function lumenLeftMm(guideFr: GuideFrench, extensionFr: number | null = null): number {
  if (extensionFr === null) return GUIDE_LUMEN[guideFr].idMm[0];
  const ext = EXTENSION_ID_MM[String(extensionFr)];
  // an extension size not in Table 30.5 leaves no known bore: nothing is passed through it
  return ext ? ext[0] : 0;
}

/** An extension of this size can go into this guide (matched or smaller). */
export function extensionFitsGuide(extensionFr: number, guideFr: GuideFrench): boolean {
  return Math.ceil(extensionFr) <= guideFr;
}

/**
 * Whether a device of size `d` can pass through a guide of `guideFr` (and an extension of `extensionFr`, if
 * any): the guide must be at least the device's minimum French, and a rigid device (burr, crown, laser tip)
 * or the device's crossing profile must not exceed the bore left by the extension.
 */
export function fitsThrough(spec: DeviceSpec, d: number, guideFr: GuideFrench, extensionFr: number | null = null): boolean {
  const min = spec.minFrench(d);
  if (min === null || guideFr < min) return false;
  if (extensionFr === null) return true;
  if (!extensionFitsGuide(extensionFr, guideFr)) return false;
  return spec.profileMm(d) <= lumenLeftMm(guideFr, extensionFr);
}

/** Trapping balloon size for a guide (eq-balloons-stents-cart-specialty, pm-wiring-microcatheters): 2.5 mm in 6-7 Fr, 3.0 mm in 7-8 Fr. */
export function trappingBalloonFor(guideFr: GuideFrench): number[] {
  if (guideFr <= 5) return [];
  if (guideFr === 6) return [2.5];
  if (guideFr === 7) return [2.5, 3.0];
  return [3.0];
}

/**
 * A device can be trapped with a balloon in this guide, where the sources give the rule. An orbital crown
 * cannot be trapped alongside a standard extension at any size, but can through an 8 Fr extension with a
 * built-in trapping balloon (cp-calcium-setup, eq-sheaths-guides-extension-device).
 */
export function canTrapIn(spec: DeviceSpec, guideFr: GuideFrench, extension: { spec: DeviceSpec; fr: number } | null = null): boolean {
  if (extension && spec.kind === "orbital") return extension.spec.kind === "trapping" && extension.fr >= 8 && guideFr >= 8;
  return guideFr >= (spec.trapMinFrench ?? 6);
}

// ---------------------------------------------------------------------------
// Box label
// ---------------------------------------------------------------------------
export interface BoxLabel {
  title: string;
  size: string;
  lines: { k: string; v: string }[];
  chart: ComplianceChart;
  nominalAtm: number;
  rbpAtm: number;
  /** "chart carried from a published label (to be re-verified)" or "teaching model chart" */
  chartNote: string;
  /** use-by date printed on the box (YYYY-MM-DD) */
  useBy: string;
  /** the box is past its use-by date on `today` (for the engine and the debrief; the screen shows only the date) */
  expired: boolean;
}

export interface BoxLabelOptions {
  /** use-by date printed on this box (YYYY-MM-DD); a scenario may plant an expired one */
  useBy?: string;
  /** today's date in the case (YYYY-MM-DD); without it the box is not checked for expiry */
  today?: string;
}

function sizeText(spec: DeviceSpec, d: number, l: number): string {
  const unit = spec.sizeUnit ?? "mm";
  if (unit === "none") return "";
  if (unit === "Fr") return spec.lengthUnit === "cm" ? `${d} Fr, ${l} cm` : `${d} Fr`;
  if (spec.lengthUnit === "none" || !l) return `${d.toFixed(2)} mm`;
  return `${d.toFixed(2)} × ${l} mm`;
}

export function boxLabel(spec: DeviceSpec, d: number, l: number, opts: BoxLabelOptions = {}): BoxLabel {
  const lines: { k: string; v: string }[] = [];
  const nominal = spec.nominalAtm(d);
  const rbp = spec.rbpAtm(d);
  if (rbp > 0) {
    lines.push({ k: "Nominal pressure", v: `${nominal} atm` });
    lines.push({ k: "Rated burst pressure", v: `${rbp} atm` });
  }
  if (spec.maxInflateAtmPerS) lines.push({ k: "Inflation", v: `No faster than 1 atm every ${Math.round(1 / spec.maxInflateAtmPerS)} s` });
  if (spec.dilatationLimit) lines.push({ k: "Do not dilate beyond", v: `${spec.dilatationLimit(d).toFixed(2)} mm` });
  if (spec.shorteningMmPerEnd) lines.push({ k: "Shortening", v: `Up to ${spec.shorteningMmPerEnd} mm at each end` });
  if (spec.innerDiameterIn) {
    const [lo, hi] = spec.innerDiameterIn(d);
    lines.push({ k: "Inner diameter", v: lo === hi ? `${lo.toFixed(3)} in` : `${lo.toFixed(3)}–${hi.toFixed(3)} in` });
  }
  lines.push({ k: "Shaft", v: spec.shaft === "rx" ? "Rapid exchange" : "Over the wire" });
  const usable = spec.usableCmOptions?.length ? spec.usableCmOptions.join(" or ") : String(spec.usableCm);
  lines.push({ k: "Usable length", v: `${usable} cm` });
  if (spec.cls !== "extension" && spec.cls !== "coil") lines.push({ k: "Guidewire", v: `${(spec.wireIn ?? 0.014).toFixed(3)} in maximum` });
  const minF = spec.minFrench(d);
  lines.push({
    k: "Guide",
    v: minF === null ? "Larger than 8 F" : `${minF} F or larger`,
  });
  if (spec.deflateSpecS) lines.push({ k: "Deflation time (specification)", v: `≤ ${spec.deflateSpecS(d, l)} s` });
  for (const n of spec.notes) lines.push({ k: "Note", v: n });
  const useBy = opts.useBy ?? MP_DEFAULT_USE_BY;
  lines.push({ k: "Use by", v: useBy });
  const chart = spec.chart(d);
  return {
    title: spec.label,
    size: sizeText(spec, d, l),
    lines,
    chart,
    nominalAtm: nominal,
    rbpAtm: rbp,
    chartNote: !chart.atm.length ? "" : chart.source === "ifu" ? "In vitro chart carried from a published label (to be re-verified); lesion resistance not included." : "Teaching model chart; real charts differ by device.",
    useBy,
    expired: !!opts.today && opts.today > useBy,
  };
}

// ---------------------------------------------------------------------------
// Tip vocabulary: what the active device lets an event source raise
// ---------------------------------------------------------------------------
/** The device in use, as an event source sees it. */
export interface ActiveDevice {
  spec: DeviceSpec;
  /** diameter (or French size) in use */
  diameter: number;
  /** the device is in the coronary artery (out of the guide) */
  inArtery: boolean;
  /** inflated now (balloons), or running (atherectomy, laser) */
  active: boolean;
  /** pressure now (atm) */
  atm?: number;
  /** the device stopped at the lesion and will not go further */
  stalledAtLesion?: boolean;
  /** a waist remains on the balloon at this pressure */
  waist?: boolean;
  /** the balloon or stent has been inflated at least once in this lesion */
  inflatedBefore?: boolean;
}

/** Every event the catalogue maps a device onto (for an event source's `raises`). */
export const DEVICE_EVENTS: readonly LabEvent[] = [
  "atherectomy-rotational",
  "atherectomy-orbital",
  "laser-active",
  "ivl-active",
  "extension-in-place",
  "epd-deployed",
  "snare-in-use",
  "balloon-uncrossable",
  "balloon-undilatable",
  "stent-underexpanded",
];

/**
 * Events the active device lets an event source raise: its class and kind while in use, a balloon that
 * stalls at the lesion (balloon-uncrossable), a balloon that keeps a waist at or above its rated burst
 * pressure (balloon-undilatable), and a stent with a waist at or above its nominal pressure or after an
 * earlier inflation (stent-underexpanded).
 */
export function deviceTipEvents(a: ActiveDevice): LabEvent[] {
  const out: LabEvent[] = [];
  const { spec } = a;
  if (a.inArtery) {
    if (spec.cls === "extension") out.push("extension-in-place");
    if (spec.cls === "embolic-protection") out.push("epd-deployed");
    if (spec.cls === "snare") out.push("snare-in-use");
    if (a.active) {
      if (spec.kind === "rotational") out.push("atherectomy-rotational");
      if (spec.kind === "orbital") out.push("atherectomy-orbital");
      if (spec.cls === "laser") out.push("laser-active");
      if (spec.balloon === "ivl") out.push("ivl-active");
    }
  }
  const isBalloon = spec.cls === "balloon";
  if (isBalloon && a.stalledAtLesion && !a.active) out.push("balloon-uncrossable");
  if (isBalloon && a.waist && (a.atm ?? 0) >= spec.rbpAtm(a.diameter)) out.push("balloon-undilatable");
  // a stent still being inflated towards nominal is not yet underexpanded
  if ((spec.cls === "stent" || spec.cls === "covered-stent") && a.waist && (a.inflatedBefore || (a.active && (a.atm ?? 0) >= spec.nominalAtm(a.diameter)))) out.push("stent-underexpanded");
  return out;
}

/** The imaging modality of an imaging catheter, for LabContext.imaging. */
export function deviceImaging(spec: DeviceSpec | undefined): ImagingModality | undefined {
  return spec?.imaging?.modality;
}

// ---------------------------------------------------------------------------
// Bail-out and support options (MODEL PARAMETERS)
// ---------------------------------------------------------------------------
/** Extra back-up from a guide extension seated `depthMm` into the vessel (N). */
export const MP_EXTENSION_BACKUP_N = 0.55;
/** Buddy wire: friction reduction on the rail and extra back-up factor. */
export const MP_BUDDY_FRICTION = 0.8;
export const MP_BUDDY_BACKUP = 1.15;
/** Fraction of a device's advance that drags an unpinned wire forward: rapid exchange (distal 25 cm on the wire) vs over the wire. */
export const MP_WIRE_DRAG: Record<ShaftKind, number> = { rx: 0.3, otw: 0.65 };
