// ---------------------------------------------------------------------------
// Generic stent platforms of the IVUS and OCT bench, and the bench's sizing and
// positioning presets (pci-bench-stent-platforms-sizing).
//
// What the module text states (eq-balloons-stents-cart-stent-build, 'Size facts
// to know before choosing a platform', Brilakis 10.1, 10.2, 22.3; Fig. 10.1
// charts five platforms):
//   - the smallest drug-eluting stent is 2.0 mm, available on one platform;
//   - one platform is made up to 5.0 mm, expandable to 5.75 mm;
//   - another's 4.0 mm stent also expands to 5.75 mm;
//   - a third's 3.5 and 4.0 mm stents expand to 5.5 mm;
//   - for the 3.5–4.0 mm band the labelled limits run from about 4.5 to 5.5 mm
//     on the platforms that chart that band;
//   - peripheral stents can be used in vessels of 6 mm or more.
// Structure (same lesson, Oxford's design table): closed cells give high radial
// strength and coverage, open cells flexibility and side-branch access. Struts
// (same lesson, Brilakis): thinner struts make a stent more deliverable, often at
// the cost of visibility. Markers (cp-ostial-stent, Brilakis 15.1.10): in most
// drug-eluting stents the stent lies just inside the markers, but at least one
// platform is crimped at the centre of each marker. Recoil (cp-ostial-
// troubleshoot, Brilakis 15.1.10): use stents with strong radial strength at
// aorto-coronary lesions.
//
// Platform A is the catalogue's drug-eluting stent (src/simulation/pci/equipment.ts,
// its chart, sizes and dilatation limits), so a bench run that never picks a
// platform behaves as before. Every other number below that is not in the list
// above is a MODEL PARAMETER and is marked so in the platform's `modelParam`.
// All platforms share the catalogue stent's compliance chart (MODEL PARAMETER:
// the platforms differ in sizes, limits, struts, cells and markers, not in
// compliance). Names are generic (HANDOVER 6.5).
// ---------------------------------------------------------------------------

import { DEVICE_BY_ID } from "../pci/equipment";
import { THIN_STRUT_DES, centredMarkerBeyondMm, deriveDesign, type StentDesign } from "../pci/stentGeometry";
import type { BenchLesion } from "../pciBench";

export type PlatformId = "A" | "B" | "C" | "D" | "E";

/** The labelled post-dilatation limit of one nominal size band of a platform. */
export interface LimitBand {
  fromMm: number;
  toMm: number;
  limitMm: number;
  /** where the module states it, or null for a MODEL PARAMETER */
  source: string | null;
}

export interface StentPlatform {
  id: PlatformId;
  label: string;
  /** one line for the picker */
  summary: string;
  design: StentDesign;
  diameters: readonly number[];
  lengths: readonly number[];
  bands: readonly LimitBand[];
  cell: "open" | "closed";
  radialStrength: "standard" | "strong";
  /** the labelled post-dilatation limit of a nominal size (the band that holds it, else the nearest band) */
  limit: (nominal: number) => number;
  /** whether the platform is made in this nominal size */
  offers: (nominal: number) => boolean;
  sources: readonly string[];
  modelParam: readonly string[];
}

const SIZE_FACTS = "eq-balloons-stents-cart-stent-build, 'Size facts to know before choosing a platform' (Brilakis 10.1, 10.2, 22.3)";
const DESIGN_TABLE = "eq-balloons-stents-cart-stent-build, 'Three structural designs' (Oxford, Intracoronary stents)";
const MARKERS = "cp-ostial-stent, step 'Prepare to deploy' (Brilakis 15.1.10): the stent lies just inside the markers in most drug-eluting stents; at least one platform is crimped at the centre of each marker";
const RADIAL = "cp-ostial-troubleshoot, 'The four problems' (Brilakis 15.1.10, Fig. 15.10): stents with strong radial strength at aorto-coronary lesions";

const DES = DEVICE_BY_ID.des;

function bandFor(bands: readonly LimitBand[], nominal: number): LimitBand {
  const inBand = bands.find((b) => nominal >= b.fromMm - 1e-9 && nominal <= b.toMm + 1e-9);
  if (inBand) return inBand;
  return bands.reduce((best, b) => {
    const dist = (x: LimitBand) => Math.min(Math.abs(nominal - x.fromMm), Math.abs(nominal - x.toMm));
    return dist(b) < dist(best) ? b : best;
  }, bands[0]);
}

function platform(p: Omit<StentPlatform, "limit" | "offers">): StentPlatform {
  return {
    ...p,
    limit: (nominal) => bandFor(p.bands, nominal).limitMm,
    offers: (nominal) => p.diameters.some((d) => Math.abs(d - nominal) < 1e-9),
  };
}

/** Bands of the catalogue stent, read from its dilatation limit at each of its sizes. */
function catalogueBands(): LimitBand[] {
  const lim = DES.dilatationLimit;
  if (!lim) throw new Error("platforms: the catalogue stent has no dilatation limit");
  const out: LimitBand[] = [];
  for (const d of DES.diameters) {
    const l = lim(d);
    const last = out[out.length - 1];
    if (last && last.limitMm === l) last.toMm = d;
    else out.push({ fromMm: d, toMm: d, limitMm: l, source: null });
  }
  for (const b of out) b.source = b.limitMm === 5.75 ? `${SIZE_FACTS}: largest 5.0 mm, expandable to 5.75 mm` : "catalogue drug-eluting stent (equipment.ts DES_SRC, inherited)";
  return out;
}

/** The strut thickness of each platform (mm), thinnest first — MODEL PARAMETERS except A's (THIN_STRUT_DES, inherited). */
export const MP_PLATFORM_STRUT_MM: Record<PlatformId, number> = { A: THIN_STRUT_DES.strutMm, B: 0.06, C: 0.074, D: 0.09, E: 0.12 };

/** How much of a lesion's elastic recoil a platform lets through: standard 1, strong radial strength 0.2 — MODEL PARAMETER. */
export const MP_RADIAL_STRENGTH_RECOIL_FACTOR: Record<StentPlatform["radialStrength"], number> = { standard: 1, strong: 0.2 };

export const PLATFORMS: readonly StentPlatform[] = [
  platform({
    id: "A",
    label: "Platform A",
    summary: "Thin-strut cobalt-chromium, 2.25–5.0 mm, open cell, stent just inside the markers",
    design: THIN_STRUT_DES,
    diameters: DES.diameters.slice(),
    lengths: DES.lengths.slice(),
    bands: catalogueBands(),
    cell: "open",
    radialStrength: "standard",
    sources: ["equipment.ts 'des' (sizes, chart and dilatation limits)", SIZE_FACTS, MARKERS],
    modelParam: ["cell", "the 4.5 mm stent's limit (equipment.ts modelParam)"],
  }),
  platform({
    id: "B",
    label: "Platform B",
    summary: "Ultrathin struts, from 2.0 mm (the smallest made), 2.0–4.0 mm, open cell",
    design: deriveDesign(THIN_STRUT_DES, { strutMm: MP_PLATFORM_STRUT_MM.B, strutWidthMm: 0.08 }),
    diameters: [2.0, 2.25, 2.5, 2.75, 3.0, 3.5, 4.0],
    lengths: [8, 12, 15, 18, 22, 26, 30, 38],
    bands: [
      { fromMm: 2.0, toMm: 2.25, limitMm: 2.75, source: null },
      { fromMm: 2.5, toMm: 3.0, limitMm: 3.75, source: null },
      { fromMm: 3.5, toMm: 4.0, limitMm: 4.75, source: null },
    ],
    cell: "open",
    radialStrength: "standard",
    sources: [`${SIZE_FACTS}: smallest 2.0 mm, on one platform; 3.5–4.0 mm band limits about 4.5–5.5 mm`],
    modelParam: ["every band limit (4.75 mm lies inside the module's 4.5–5.5 mm range for the 3.5–4.0 mm band)", "strut thickness and width", "lengths", "cell"],
  }),
  platform({
    id: "C",
    label: "Platform C",
    summary: "Thin struts, 2.25–4.0 mm, open cell, stent ends at the centre of each marker",
    design: deriveDesign(THIN_STRUT_DES, { strutMm: MP_PLATFORM_STRUT_MM.C, markerBeyondMm: centredMarkerBeyondMm(THIN_STRUT_DES) }),
    diameters: [2.25, 2.5, 2.75, 3.0, 3.5, 4.0],
    lengths: [8, 12, 15, 18, 23, 28, 33, 38],
    bands: [
      { fromMm: 2.25, toMm: 2.75, limitMm: 3.5, source: null },
      { fromMm: 3.0, toMm: 3.5, limitMm: 4.75, source: null },
      { fromMm: 4.0, toMm: 4.0, limitMm: 5.75, source: `${SIZE_FACTS}: another platform's 4.0 mm stent also expands to 5.75 mm` },
    ],
    cell: "open",
    radialStrength: "standard",
    sources: [SIZE_FACTS, MARKERS],
    modelParam: ["the 2.25–3.5 mm band limits", "strut thickness", "lengths", "cell", "which platform carries the centred markers"],
  }),
  platform({
    id: "D",
    label: "Platform D",
    summary: "Thin struts, 2.25–4.0 mm, open cell, 3.5 and 4.0 mm stents to 5.5 mm",
    design: deriveDesign(THIN_STRUT_DES, { strutMm: MP_PLATFORM_STRUT_MM.D }),
    diameters: [2.25, 2.5, 2.75, 3.0, 3.5, 4.0],
    lengths: [8, 12, 16, 20, 24, 28, 32, 38],
    bands: [
      { fromMm: 2.25, toMm: 3.0, limitMm: 3.75, source: null },
      { fromMm: 3.5, toMm: 4.0, limitMm: 5.5, source: `${SIZE_FACTS}: a third platform's 3.5 and 4.0 mm stents expand to 5.5 mm` },
    ],
    cell: "open",
    radialStrength: "standard",
    sources: [SIZE_FACTS],
    modelParam: ["the 2.25–3.0 mm band limit", "strut thickness", "lengths", "cell"],
  }),
  platform({
    id: "E",
    label: "Platform E",
    summary: "Thicker struts, closed cell (strong radial strength), 2.5–4.0 mm",
    design: deriveDesign(THIN_STRUT_DES, { strutMm: MP_PLATFORM_STRUT_MM.E, strutWidthMm: 0.12, connectorsPerGap: 6, crowns: (d) => (d <= 3.0 ? 8 : 10) }),
    diameters: [2.5, 2.75, 3.0, 3.5, 4.0],
    lengths: [9, 13, 16, 18, 23, 28, 33],
    bands: [
      { fromMm: 2.5, toMm: 3.0, limitMm: 3.5, source: null },
      { fromMm: 3.5, toMm: 4.0, limitMm: 4.5, source: `${SIZE_FACTS}: the 3.5–4.0 mm band's limits start at about 4.5 mm` },
    ],
    cell: "closed",
    radialStrength: "strong",
    sources: [SIZE_FACTS, DESIGN_TABLE, RADIAL],
    modelParam: ["the 2.5–3.0 mm band limit", "strut thickness and width (inside the 50–140 µm span of the module's ISAR-STEREO-2 figures)", "crowns and connectors", "lengths"],
  }),
];

export const PLATFORM_BY_ID: Record<PlatformId, StentPlatform> = Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<PlatformId, StentPlatform>;

/** The platform a bench run uses when none is chosen: the catalogue's drug-eluting stent. */
export const DEFAULT_PLATFORM_ID: PlatformId = "A";

/** The platform of an id (the default for none or an unknown id). */
export function platformFor(id?: string | null): StentPlatform {
  return (id && PLATFORM_BY_ID[id as PlatformId]) || PLATFORM_BY_ID[DEFAULT_PLATFORM_ID];
}

/** The labelled post-dilatation limit of a platform's nominal size (mm). */
export function platformLimit(id: string | null | undefined, nominal: number): number {
  return platformFor(id).limit(nominal);
}

export interface PostDilatationCheck {
  limitMm: number;
  balloonMm: number;
  /** the balloon reaches beyond the labelled limit */
  over: boolean;
  /** by how much (mm, 0 within the limit) */
  byMm: number;
}

/**
 * A post-dilatation (or POT) balloon diameter against the stent's labelled limit (cp-left-main-technique and
 * cp-other-complex-vessel-size: post-dilate proximally only within the platform's limit). The balloon diameter
 * is the one reached at the inflation pressure, from its chart.
 */
export function checkPostDilatation(p: StentPlatform, nominal: number, balloonMm: number): PostDilatationCheck {
  const limitMm = p.limit(nominal);
  const byMm = Math.max(0, balloonMm - limitMm);
  return { limitMm, balloonMm, over: byMm > 1e-6, byMm };
}

/** The platforms whose limit for a nominal size reaches a target diameter (the left main, a large proximal segment). */
export function platformsReaching(nominal: number, targetMm: number): StentPlatform[] {
  return PLATFORMS.filter((p) => p.offers(nominal) && p.limit(nominal) >= targetMm - 1e-9);
}

/** The nearest size a platform offers (for switching platforms with a size already chosen). */
export function nearestOffered(sizes: readonly number[], d: number): number {
  return sizes.reduce((a, b) => (Math.abs(b - d) < Math.abs(a - d) ? b : a), sizes[0]);
}

// ---------------------------------------------------------------------------
// Sizing and positioning presets. All dimensions, plaque burdens, calcium,
// motion and recoil values are MODEL PARAMETERS of the teaching lesions unless
// a comment names the module text they come from.
// ---------------------------------------------------------------------------

/** EEM at a reference lumen for the presets' background plaque burden of 0.3: lumen / √0.7. */
const eemOf = (lumenMm: number) => Math.round((100 * lumenMm) / Math.sqrt(0.7)) / 100;

/** The stent swing of the moving presets (mm, with each beat) — MODEL PARAMETER. */
export const MP_STENT_SWING_MM = { taper: 2, ostial: 3 } as const;

/** The elastic recoil of the recoil preset's ostium: the share of the acute gain lost after deployment — MODEL PARAMETER. */
export const MP_OSTIAL_RECOIL_FRACTION = 0.4;

export const PLATFORM_LESIONS: BenchLesion[] = [
  {
    // pm-prep-and-stent-deploy's bench task: a LAD tapering from 3.5 to 2.75 mm over a 24 mm lesion predilated over 28 mm
    id: "taper-lad",
    title: "Tapering LAD after a long predilatation",
    vessel: "LAD",
    brief:
      "A long LAD lesion in a vessel that tapers distally. It was predilated with a 28 mm balloon from 10 to 38 mm along the pullback, and the stent swings with each beat. Choose the platform, size and length, position by the markers and deploy.",
    segmentMm: 50,
    eemPoints: [
      [0, eemOf(3.5)],
      [50, eemOf(2.75)],
    ],
    eemProx: eemOf(3.5),
    eemDist: eemOf(2.75),
    startMm: 12,
    endMm: 36,
    pbMax: 0.78,
    pbShoulder: 0.5,
    shoulderMm: 2,
    pbBackground: 0.3,
    plaque: "fibrous",
    predilatation: { fromMm: 10, toMm: 38, label: "semi-compliant balloon, 28 mm long" },
    motion: { amplitudeMm: MP_STENT_SWING_MM.taper, towards: "distal" },
    teaching:
      "This LAD tapered from about 3.5 mm proximally to 2.75 mm distally, with a 24 mm lesion. Size the stent to the distal reference and make it long enough to cover every segment the predilatation balloon touched (10 to 38 mm here): anything left uncovered is a geographic miss. Then post-dilate the proximal part to the proximal reference, on a platform whose labelled post-dilatation limit reaches it. If the stent swings with each beat, wait for a stable position or use rapid pacing (Brilakis 10.1 and 10.2).",
  },
  {
    // cp-left-main-technique and eq-balloons-stents-cart-stent-build's check: a 4.8 mm distal left main into a 3.5 mm proximal LAD
    id: "lm-lad-crossover",
    title: "Distal left main crossover into the LAD",
    vessel: "Left main",
    leftMain: true,
    brief:
      "Distal left main disease running into the proximal LAD; the circumflex is free. Plan a crossover stent from the LAD into the left main with proximal optimisation.",
    segmentMm: 40,
    eemPoints: [
      [0, eemOf(4.8)],
      [11, eemOf(4.75)],
      [12, 3.95],
      [40, 3.95],
    ],
    eemProx: eemOf(4.8),
    eemDist: 3.95,
    startMm: 5,
    endMm: 18,
    pbMax: 0.72,
    pbShoulder: 0.5,
    shoulderMm: 2,
    pbBackground: 0.3,
    plaque: "fibrous",
    flags: ["bifurcation"],
    sideBranches: [{ atMm: 11.5, angle: (100 * Math.PI) / 180, diameterMm: 3.5 }],
    teaching:
      "The left main measured about 4.8 mm and the proximal LAD about 3.5 mm. Size the crossover stent to the LAD (the distal reference) and choose a platform whose labelled post-dilatation limit reaches the left main diameter, because the proximal part will be optimised to it; a 3.5 mm stent whose limit stops at 4.5 mm cannot be opened to 4.8 mm. Peripheral stents exist for vessels of 6 mm or more (Brilakis 17.10 and 10.2).",
  },
  {
    // cp-other-complex-vessel-size: a vessel under 2.5 mm is small (Brilakis 22.3)
    id: "small-distal-225",
    title: "Small distal LAD",
    vessel: "LAD",
    brief:
      "Diabetic patient with stable angina. A focal stenosis in the distal LAD, which measured about 1.9 mm on the first injection, before nitroglycerin. Image it, then choose the device.",
    segmentMm: 30,
    eemPoints: [
      [0, eemOf(2.5)],
      [11, eemOf(2.4)],
      [15, 3.1],
      [19, eemOf(2.3)],
      [30, eemOf(2.25)],
    ],
    eemProx: eemOf(2.5),
    eemDist: eemOf(2.25),
    startMm: 11,
    endMm: 19,
    pbMax: 0.82,
    pbShoulder: 0.5,
    shoulderMm: 1.5,
    pbBackground: 0.3,
    plaque: "fibrous",
    spasm: { angioRefMm: 1.9, afterNitrateRefMm: 2.25 },
    dcbOption: true,
    teaching:
      "Give nitroglycerin before judging a small vessel: spasm made this one look 1.9 mm. Imaging shows the true size and outward remodelling at the lesion. Prepare without oversizing (a balloon larger than the vessel dissects, and the dissection needs a longer stent), avoid atherectomy, and use the shortest stent that covers the lesion; a drug-coated balloon is another option in small vessels (Brilakis 22.3; Oxford ch 8).",
  },
  {
    // cp-other-complex-vessel-size's check: a 4.5 mm ectatic proximal RCA tapering to 3.5 mm
    id: "ectatic-rca",
    title: "Ectatic proximal RCA tapering distally",
    vessel: "RCA",
    brief: "Exertional angina. An ectatic proximal RCA tapering distally, with a mid-vessel stenosis. Choose the imaging, then size and optimise the stent.",
    segmentMm: 50,
    eemPoints: [
      [0, eemOf(4.5)],
      [18, eemOf(4.3)],
      [32, eemOf(3.6)],
      [50, eemOf(3.5)],
    ],
    eemProx: eemOf(4.5),
    eemDist: eemOf(3.5),
    startMm: 20,
    endMm: 30,
    pbMax: 0.8,
    pbShoulder: 0.5,
    shoulderMm: 2,
    pbBackground: 0.3,
    plaque: "fibrous",
    ectatic: true,
    goal: {
      text: "Size a stent in a large, tapering vessel and check the proximal result.",
      patient: "Exertional angina; normal renal function.",
      correctModality: "IVUS",
      reasonId: "large-vessel",
      reason: "IVUS is better in large and ectatic vessels: complete contrast filling for OCT is hard to achieve in a big artery (Brilakis 22.3), and infrared light penetrates less deeply than ultrasound (Oxford ch 8).",
    },
    teaching:
      "This RCA measured about 4.5 mm proximally, tapering to 3.5 mm. In a large or ectatic artery the OCT flush clears the lumen incompletely; IVUS gives the whole image. Size the stent to the distal reference, then post-dilate the proximal segment with a larger, shorter non-compliant balloon matched to the proximal reference, within the stent's labelled limit (Brilakis 22.3 and 10.2; Oxford ch 8).",
  },
  {
    id: "ostial-rca-short",
    title: "Aorto-ostial RCA: placing the stent at the ostium",
    vessel: "RCA",
    brief: "Stable angina. The RCA ostium is narrowed, with ventricularisation of the pressure on engagement. Place the stent so that it covers the ostium, by its markers.",
    segmentMm: 40,
    eemProx: eemOf(4.0),
    eemDist: eemOf(3.6),
    startMm: 5,
    endMm: 12,
    pbMax: 0.74,
    pbShoulder: 0.5,
    shoulderMm: 2,
    pbBackground: 0.3,
    plaque: "fibrous",
    flags: ["aorto-ostial-lesion"],
    ostial: { aortaMm: 5 },
    teaching:
      "An aorto-ostial stent must cover the ostium with 1–2 mm in the aorta. Know where your platform's stent ends sit against its markers: in most the stent lies just inside them, so a proximal marker placed at the ostium leaves the stent short of it. A stent that stops short still looks treated on the check angiogram, because the balloon's shoulder dilated the true ostium; confirm coverage with IVUS after deployment, and cover a missed ostium with another stent (Brilakis 15.1.10).",
  },
  {
    id: "ostial-overhang",
    title: "Aorto-ostial RCA with a swinging stent",
    vessel: "RCA",
    brief: "Stable angina. A narrowed RCA ostium; the guide is unstable and the stent swings with each beat. Place and deploy the stent at the ostium.",
    segmentMm: 40,
    eemProx: eemOf(4.0),
    eemDist: eemOf(3.6),
    startMm: 5,
    endMm: 12,
    pbMax: 0.74,
    pbShoulder: 0.5,
    shoulderMm: 2,
    pbBackground: 0.3,
    plaque: "fibrous",
    flags: ["aorto-ostial-lesion"],
    ostial: { aortaMm: 5 },
    motion: { amplitudeMm: MP_STENT_SWING_MM.ostial, towards: "proximal" },
    teaching:
      "Breath-hold, the indeflator connected and rapid pacing when the stent swings help the stent land where it was placed. Too much overhang into the aorta is flared with a short (6–8 mm) oversized balloon half in the aorta, or a dual-balloon flaring catheter; snaring is kept for a stent of which more than half protrudes (Brilakis 15.1.10).",
  },
  {
    id: "ostial-fibrotic",
    title: "Aorto-ostial RCA, calcified on fluoroscopy",
    vessel: "RCA",
    brief: "Elderly patient with angina. A narrowed, calcified RCA ostium; the pressure damps on engagement. Plan the preparation and the stent.",
    segmentMm: 40,
    eemProx: eemOf(4.0),
    eemDist: eemOf(3.6),
    startMm: 5,
    endMm: 13,
    pbMax: 0.76,
    pbShoulder: 0.5,
    shoulderMm: 2,
    pbBackground: 0.3,
    plaque: "calcified",
    calcium: { startMm: 5, lengthMm: 7, arcDeg: 290, thicknessMm: 0.8 },
    flags: ["aorto-ostial-lesion"],
    ostial: { aortaMm: 5 },
    teaching:
      "Aorto-ostial lesions are often fibrotic and calcified: avoid primary stenting and prepare meticulously. A waist that never opened is underexpansion, treated as a balloon-undilatable lesion (high-pressure non-compliant inflations, lithotripsy or a very-high-pressure balloon, laser), not with a second stent, which is kept for recoil (Brilakis 15.1.10 and 23.2).",
  },
  {
    // cp-ostial-troubleshoot's example: an ostial left main whose drug-eluting stent recoiled after deployment
    id: "ostial-recoil",
    title: "Ostial left main stenosis",
    vessel: "Left main",
    leftMain: true,
    brief: "Exertional angina. The left main ostium is narrowed with damping on engagement; the rest of the left system is smooth. Prepare, stent and optimise the ostium.",
    segmentMm: 26,
    eemProx: eemOf(4.6),
    eemDist: eemOf(4.4),
    startMm: 4,
    endMm: 10,
    pbMax: 0.8,
    pbShoulder: 0.5,
    shoulderMm: 2,
    pbBackground: 0.3,
    plaque: "fibrous",
    flags: ["aorto-ostial-lesion"],
    ostial: { aortaMm: 4 },
    recoil: { fromMm: 4, toMm: 8, fraction: MP_OSTIAL_RECOIL_FRACTION },
    teaching:
      "Recoil is a stent that opened and then lost diameter, because it lacks the radial strength to hold the aorto-ostial wall; underexpansion is a waist that never opened. Use stents with strong radial strength at aorto-coronary lesions. When a stent recoils, post-dilate again and wait a few minutes; if it recoils again, a stent with strong radial strength can be implanted inside it (Brilakis 15.1.10).",
  },
];
