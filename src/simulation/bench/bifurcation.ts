// ---------------------------------------------------------------------------
// The bifurcation bench (pci-bench-bifurcation): a main vessel (MV) with a
// proximal and a distal reference, a side branch (SB) at an angle, and the
// carina between them, on which provisional stenting, TAP (with reverse crush
// as the other bail-out), DK crush and culotte are built one step at a time, in
// the order of the shared step catalogue (src/simulation/pci/technique/steps.ts).
// Each step takes the learner's choices (sizes, positions, pressures, the strut
// for each rewiring, one- or two-step kisses, each POT position), applies the
// module's rules and changes the bench state, so a wrong choice shows on the
// cross-section and longitudinal views (src/ui/imaging/BifurcationView.tsx).
//
// Outputs: SB ostial metal coverage, the oval index of the proximal stent at the
// carina, the neocarina length, the double-layer length, proximal malapposition,
// distal MV stretch and the Finet effective diameter of each kiss.
//
// The rules, with their source in the module text:
//   cp-bifurcation-two-stent-dk-crush (Brilakis 16.2): park a balloon 1:1 to the distal MV; SB stent
//     2-3 mm proud of the ostium (1-2 mm is TAP's); deploy at 10-12 atm, then the pulled-back balloon
//     at 20 atm; a crush balloon sized to the proximal MV stays proximal to the carina (else the distal
//     MV may dissect), a distally sized one is followed by a POT (the left main case's step); first
//     rewiring through a proximal strut, second through a distal strut; two-step kisses; POT with the
//     distal edge at the carina; final POT. Ormiston's micro-CT of bench crush: 53% of the SB ostium
//     covered by metal after a one-step kiss, 33% after a two-step kiss.
//   Finet (same lesson and cp-bifurcation-provisional-sb): effective diameter 0.678 x (d1 + d2),
//     similar to the proximal MV; 3.0 + 2.5 in a 3.5 mm vessel (3.73) and 2.75 + 2.5 (3.56) are
//     similar, 3.5 + 2.5 (4.07) is not.
//   cp-bifurcation-two-stent-culotte: the more angulated branch first (Brilakis; Oxford stents the MV
//     first); each platform's post-dilatation limit must reach the proximal MV; POT before recrossing;
//     distal cells; open the struts before the second stent; the kiss expands the double layer.
//   cp-bifurcation-two-stent-t-tap: TAP from a stented, rewired, kissed and re-POTed MV; SB stent 1-2 mm
//     into the MV (more lengthens the neocarina); deflate the MV balloon first; final POT just short of
//     the neocarina (further crushes the protruding struts). Brilakis's chart: TAP for 70-90 degrees,
//     reverse crush or culotte below 70 (cp-bifurcation-provisional-sb).
//   cp-bifurcation-provisional-setup and -pot (Brilakis 16.2, 10.2): MV stent sized to the distal MV on
//     a platform that reaches the proximal MV, with at least 6 mm (8-10 mm better) proximal to the carina
//     (the shortest POT balloons are 6 mm); a stent sized to the proximal MV shifts the carina into the
//     SB and can dissect the distal MV; POT balloon 1:1 to the proximal MV, no longer than the stent
//     proximal to the carina, distal marker at the carina, never beyond (too distal compromises the SB
//     and stretches the distal MV, too proximal leaves the stent underexpanded next to the SB ostium);
//     an oversized POT balloon makes SB compromise more likely; final POT corrects the oval shape the
//     kiss leaves.
//
// Everything else is a MODEL PARAMETER (the MP_ constants below): the tolerances that turn "1:1",
// "at the carina" and "similar" into numbers, the coverage of a single jailing layer, the kiss's
// ovalisation and the residual values. The strut geometry is a simplified teaching geometry: the
// coverage is one number per ostium, not a strut-by-strut model. The geometries of the presets come
// from the module's cases where a comment says so; the rest are teaching geometry.
//
// Tip context (bifTipContext): lab "pci"; phase and step from the step the learner is at (plan before
// a technique is chosen); technique; events bifurcation, left-main-lesion for the left main preset,
// side-branch-compromise while the SB ostium is jailed or narrowed in provisional stenting and its
// bail-outs (and held for the rest of a bail-out run, whose indication it is), and dissection with the
// complication phase after a dissection. A planned two-stent technique jails the SB by design, so its
// jailing does not raise side-branch-compromise. The plan says a distal-cell rewire clears the event;
// here it clears at the kiss through that cell, so the kissing tips, which name the event, still show
// while the kiss is chosen.
// ---------------------------------------------------------------------------

import type { BifTechnique, LabContext, LabEvent, LabPhase, TipVessel } from "../../content/lab/tips";
import { tipModality, type Modality } from "../imaging/types";
import { balloonSizes, benchBalloonDevice } from "../pciBench";
import { TECHNIQUE_STEPS, stepAt, stepById, stepCount, stepLabel, techniqueSteps, type TechniqueStep } from "../pci/technique/steps";
import { checkPostDilatation, platformFor, platformsReaching, type PlatformId } from "./platforms";

// ---------------------------------------------------------------------------
// Model parameters
// ---------------------------------------------------------------------------

/** "1:1", "sized to" and "similar": the diameter tolerance (mm) — MODEL PARAMETER (the plan's 0.25 mm for Finet). */
export const MP_SIZE_TOL_MM = 0.25;
/** "At the carina": how far beyond the carina a distal marker may sit (mm) — MODEL PARAMETER. */
export const MP_CARINA_BEYOND_TOL_MM = 0.5;
/** A POT marker more than this proximal to the carina is "too proximal" (mm) — MODEL PARAMETER (the module's exercise moves it 3 mm). */
export const MP_POT_PROXIMAL_TOL_MM = 2;
/** The proximal MV counts as "clearly larger" than the distal from this difference (mm) — MODEL PARAMETER. */
export const MP_CLEARLY_LARGER_MM = 0.5;
/** SB ostial metal coverage of one jailing layer before any kiss, by cell design — MODEL PARAMETER. */
export const MP_JAIL_COVERAGE: Record<"open" | "closed", number> = { open: 0.45, closed: 0.6 };
/** Coverage of crushed layers before the kiss — MODEL PARAMETER. */
export const MP_CRUSHED_COVERAGE = 0.8;
/** Coverage after a kiss through crushed layers (Ormiston micro-CT, cp-bifurcation-two-stent-dk-crush 'Why two steps?'). */
export const CRUSH_KISS_COVERAGE = { "one-step": 0.53, "two-step": 0.33 } as const;
/** A single jailing layer after a kiss, as a share of the crushed figures — MODEL PARAMETER. */
export const MP_SINGLE_LAYER_FACTOR = 0.6;
/** Extra coverage left by a rewiring through the wrong strut — MODEL PARAMETER. */
export const MP_WRONG_CELL_COVERAGE = 0.15;
/** Coverage added when the MV balloon is deflated last in the TAP kiss (struts pressed into the SB ostium) — MODEL PARAMETER. */
export const MP_TAP_SB_FIRST_COVERAGE = 0.2;
/** The oval index a kiss leaves: 1 + this x (smaller / larger balloon) — MODEL PARAMETER. */
export const MP_KISS_OVAL = 0.3;
/** The oval index up to which the proximal stent counts as round — MODEL PARAMETER. */
export const MP_ROUND_OVAL_INDEX = 1.1;
/** Opening the struts into the unstented culotte branch leaves this share of the ostial metal — MODEL PARAMETER. */
export const MP_OPEN_STRUTS_FACTOR = 0.6;
/** Coverage added when the second culotte stent goes in through struts that were not opened — MODEL PARAMETER. */
export const MP_UNOPENED_SECOND_STENT_COVERAGE = 0.1;
/** Coverage added at the SB ostium by a POT beyond the carina (provisional family, SB unstented) — MODEL PARAMETER. */
export const MP_POT_BEYOND_COVERAGE = 0.1;
/** The share of the TAP neocarina left after a POT crushes the protruding struts — MODEL PARAMETER. */
export const MP_NEOCARINA_CRUSH_FACTOR = 0.3;
/** Points the result loses per major finding and per minor finding (a failure scores 0) — MODEL PARAMETER. */
export const MP_SCORE_MAJOR = 10;
export const MP_SCORE_MINOR = 3;
/** TAP: how far beyond the SB ostium the SB stent sits when first delivered, before its protrusion is set (mm) — MODEL PARAMETER. */
export const MP_TAP_DELIVER_BEYOND_MM = 2;
/** The SB balloon diameter a branch-balloon step assumes when none is given (mm) — MODEL PARAMETER. */
export const MP_BRANCH_BALLOON_DEFAULT_MM = 2.0;
/** The distal marker of the POT after a distally sized crush balloon when none is given (mm from the carina; − proximal) — MODEL PARAMETER. */
export const MP_CRUSH_POT_MARKER_MM = -0.5;
/** Finet's coefficient (Brilakis 16.2, cp-bifurcation-two-stent-dk-crush). */
export const FINET_COEFFICIENT = 0.678;
/** The shortest POT balloons are 6 mm; 8-10 mm of stent proximal to the carina is better (cp-bifurcation-provisional-setup). */
export const POT_MIN_PROXIMAL_MM = 6;
export const POT_BETTER_PROXIMAL_MM = 8;

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export type BifPresetId = "bif-provisional" | "bif-tap" | "bif-dk-crush" | "bif-culotte";

/** The techniques the bench builds step by step (the catalogue holds every technique). */
export const BENCH_TECHNIQUES: readonly BifTechnique[] = ["provisional", "dk-crush", "culotte", "tap", "reverse-crush"];
/** Bail-outs from provisional stenting the bench offers (TAP and reverse crush; culotte has its own sequence). */
export const BAILOUTS: readonly BifTechnique[] = ["tap", "reverse-crush"];

export interface TechniqueOption {
  technique: BifTechnique;
  verdict: "best" | "acceptable" | "flag";
  why: string;
  source: string;
}

export interface BifGeometry {
  id: BifPresetId;
  title: string;
  /** what the operator knows: vessel, Medina, angle, the imaging references */
  brief: string;
  vessel: TipVessel;
  leftMain: boolean;
  mvName: string;
  distName: string;
  sbName: string;
  /** reference diameters (mm) */
  proxRefMm: number;
  distRefMm: number;
  sbRefMm: number;
  angleDeg: number;
  medina: readonly [number, number, number];
  /** severe: the SB still needs a stent after rewiring and kissing */
  sbOstialDisease: "mild" | "severe";
  /** drawn lengths (mm) */
  proxLenMm: number;
  distLenMm: number;
  sbLenMm: number;
  techniques: readonly TechniqueOption[];
  sources: readonly string[];
  modelParam: readonly string[];
}

const PROV_CASE = "cp-bifurcation-provisional-case-lad-diagonal (findings: proximal LAD 3.5, LAD beyond the diagonal 3.0, diagonal 2.75 mm at about 50 degrees, Medina 1,1,0, 30% diagonal ostium)";
const TAP_CASE = "cp-bifurcation-two-stent-case-diagonal-tap (proximal LAD 3.5, LAD beyond the diagonal 3.0, diagonal 2.5 mm at about 80 degrees)";
const LM_CASE = "cp-bifurcation-two-stent-case-lm-dk-crush (Medina 1,1,1; circumflex 2.75 mm, LAD-circumflex angle about 60 degrees; IVUS left main 4.0, proximal LAD 3.0 mm)";
const CHART = "cp-bifurcation-provisional-sb, step 5 (Brilakis's chart: TAP for 70-90 degrees, reverse crush or culotte below 70; Oxford prefers TAP under 90)";
const CHOOSE = "cp-bifurcation-two-stent-choosing";
const PLANNED_ANGLE = `${CHOOSE}, 'Planned two-stent strategy (Brilakis)' step 3 (70-90 degrees: T-stenting; under 70: DK crush or culotte, DK crush preferred in most cases)`;
const CHOICE_TABLE = `${CHOOSE}, 'What else steers the choice' (culotte suits an SB and distal MV of similar size)`;

export const BIF_PRESETS: readonly BifGeometry[] = [
  {
    id: "bif-provisional",
    title: "Mid-LAD across a large diagonal",
    brief: "Mid-LAD stenosis starting just proximal to a large first diagonal and continuing beyond it (Medina 1,1,0); short mild narrowing at the diagonal ostium, diagonal at about 50°. IVUS references: proximal LAD 3.5 mm, LAD beyond the diagonal 3.0 mm, diagonal 2.75 mm.",
    vessel: "LAD",
    leftMain: false,
    mvName: "LAD",
    distName: "distal LAD",
    sbName: "diagonal",
    proxRefMm: 3.5,
    distRefMm: 3.0,
    sbRefMm: 2.75,
    angleDeg: 50,
    medina: [1, 1, 0],
    sbOstialDisease: "mild",
    proxLenMm: 16,
    distLenMm: 20,
    sbLenMm: 14,
    techniques: [
      { technique: "provisional", verdict: "best", why: "Provisional stenting with the diagonal wired is the case's best strategy.", source: PROV_CASE },
      {
        technique: "dk-crush",
        verdict: "flag",
        why: "The diagonal ostium is only mildly and briefly diseased, so its occlusion risk is low: the algorithm leads to provisional stenting, and the angle chooses a two-stent technique only once two stents are needed.",
        source: `${PROV_CASE}; ${CHOOSE}`,
      },
      {
        technique: "culotte",
        verdict: "flag",
        why: "The diagonal ostium is only mildly and briefly diseased, so its occlusion risk is low: the algorithm leads to provisional stenting, not a planned second stent.",
        source: `${PROV_CASE}; ${CHOOSE}`,
      },
    ],
    sources: [PROV_CASE],
    modelParam: ["drawn lengths", "the diagonal ostial disease as 'mild' (clears after a kiss through a distal strut)"],
  },
  {
    id: "bif-tap",
    title: "LAD and a diagonal at close to a right angle",
    brief: "LAD stenosis across a diagonal that leaves at about 80°, with disease at the diagonal ostium (Medina 1,1,1). IVUS references: proximal LAD 3.5 mm, LAD beyond the diagonal 3.0 mm, diagonal 2.5 mm. The plan is provisional stenting.",
    vessel: "LAD",
    leftMain: false,
    mvName: "LAD",
    distName: "distal LAD",
    sbName: "diagonal",
    proxRefMm: 3.5,
    distRefMm: 3.0,
    sbRefMm: 2.5,
    angleDeg: 80,
    medina: [1, 1, 1],
    sbOstialDisease: "severe",
    proxLenMm: 16,
    distLenMm: 20,
    sbLenMm: 14,
    techniques: [
      { technique: "provisional", verdict: "best", why: "Provisional first; a side-branch stent only once rewiring, kissing and repeat POT have left a poor result.", source: "cp-bifurcation-two-stent-t-tap pitfalls; cp-bifurcation-provisional-sb step 5" },
      { technique: "tap", verdict: "best", why: "TAP is Brilakis's bail-out for a side branch at 70-90°.", source: CHART },
      { technique: "reverse-crush", verdict: "flag", why: "Brilakis's chart keeps reverse crush and culotte for angles below 70°; this diagonal leaves at about 80°.", source: CHART },
      { technique: "dk-crush", verdict: "flag", why: "A planned DK crush is for side branches under 70°; at about 80° Brilakis's algorithm gives T-stenting, and here the plan is provisional with TAP as the bail-out.", source: PLANNED_ANGLE },
      {
        technique: "culotte",
        verdict: "flag",
        why: "A planned culotte is for side branches under 70°, and it suits an SB of similar size to the distal MV; this diagonal leaves at about 80° and is smaller (2.5 against 3.0 mm).",
        source: `${PLANNED_ANGLE}; ${CHOICE_TABLE}`,
      },
    ],
    sources: [TAP_CASE, CHART],
    modelParam: ["drawn lengths", "Medina 1,1,1 and the ostial disease as 'severe' (the diagonal still needs a stent after the provisional sequence)"],
  },
  {
    id: "bif-dk-crush",
    title: "Distal left main, true bifurcation",
    brief: "Distal left main stenosis extending into the ostial LAD and ostial circumflex (Medina 1,1,1); circumflex 2.75 mm with an 80% stenosis about 12 mm long, LAD-circumflex angle about 60°. IVUS references: left main 4.0 mm, proximal LAD 3.0 mm.",
    vessel: "LM",
    leftMain: true,
    mvName: "left main into LAD",
    distName: "LAD",
    sbName: "circumflex",
    proxRefMm: 4.0,
    distRefMm: 3.0,
    sbRefMm: 2.75,
    angleDeg: 60,
    medina: [1, 1, 1],
    sbOstialDisease: "severe",
    proxLenMm: 14,
    distLenMm: 20,
    sbLenMm: 16,
    techniques: [
      { technique: "dk-crush", verdict: "best", why: "A true left main bifurcation: Brilakis prefers a planned two-stent technique, especially DK crush (DKCRUSH-V); the angle under 70° also points to it.", source: `${LM_CASE}, step s1` },
      { technique: "provisional", verdict: "acceptable", why: "Defensible (EBC MAIN), but this is a true left main bifurcation with 12 mm of circumflex disease.", source: `${LM_CASE}, step s1` },
      { technique: "culotte", verdict: "flag", why: "In left main bifurcations culotte was inferior to DK crush in DKCRUSH-III.", source: "cp-bifurcation-two-stent-culotte" },
      { technique: "reverse-crush", verdict: "acceptable", why: "If provisional stenting leaves the circumflex compromised, Brilakis's bail-out below 70° is reverse crush or culotte.", source: CHART },
    ],
    sources: [LM_CASE],
    modelParam: ["drawn lengths"],
  },
  {
    id: "bif-culotte",
    title: "LAD and a diagonal of similar size",
    brief: "LAD stenosis across a large diagonal of about the same size as the LAD beyond it, leaving at about 45° (Medina 1,1,1). IVUS references: proximal LAD 3.75 mm, LAD beyond the diagonal 2.75 mm, diagonal 2.75 mm. A planned culotte.",
    vessel: "LAD",
    leftMain: false,
    mvName: "LAD",
    distName: "distal LAD",
    sbName: "diagonal",
    proxRefMm: 3.75,
    distRefMm: 2.75,
    sbRefMm: 2.75,
    angleDeg: 45,
    medina: [1, 1, 1],
    sbOstialDisease: "severe",
    proxLenMm: 16,
    distLenMm: 20,
    sbLenMm: 14,
    techniques: [
      { technique: "culotte", verdict: "best", why: "Brilakis places culotte as the technique for bifurcations whose SB and distal MV are of similar size, below 70°.", source: `cp-bifurcation-two-stent-culotte; ${CHART}` },
      {
        technique: "dk-crush",
        verdict: "acceptable",
        why: "Under 70° Brilakis's algorithm gives DK crush or culotte and prefers DK crush in most cases; culotte is the one that suits branches of similar size, as here.",
        source: `${PLANNED_ANGLE}; ${CHOICE_TABLE}`,
      },
      {
        technique: "provisional",
        verdict: "acceptable",
        why: "Defensible: EBC TWO found no difference between provisional T-stenting and a planned culotte for side branches of at least 2.5 mm with ostial disease, though the lesson sets this one up for a planned culotte.",
        source: `${CHOOSE}, 'The trials behind the choices' (EBC TWO)`,
      },
      { technique: "reverse-crush", verdict: "acceptable", why: "If provisional stenting leaves the diagonal compromised, Brilakis's bail-out below 70° is reverse crush or culotte.", source: CHART },
    ],
    sources: ["cp-bifurcation-two-stent-culotte (SB and distal MV of similar size)", CHART],
    // MODEL PARAMETER: the whole geometry. Branches of the same size (the culotte lesson's rule) and a proximal
    // reference that follows the Finet relation the module gives (0.678 x (2.75 + 2.75) = 3.73 mm), so a kiss
    // with each balloon sized 1:1 to its branch fits the proximal MV.
    modelParam: ["the whole geometry (teaching geometry chosen to fit the lesson's rule and the Finet relation; no module case)"],
  },
];

export const BIF_BY_ID: Record<string, BifGeometry> = Object.fromEntries(BIF_PRESETS.map((g) => [g.id, g]));

export function isBifPreset(id: string | null | undefined): id is BifPresetId {
  return !!id && id in BIF_BY_ID;
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface BifStent {
  branch: "mv" | "sb";
  nominalMm: number;
  platformId: PlatformId;
  lengthMm: number;
  /** MV stent: length proximal to the carina; SB stent: protrusion into the MV (mm) */
  proxMm: number;
  deployed: boolean;
  crushed: boolean;
}

export type FindingKind =
  | "technique-choice"
  | "park-balloon-size"
  | "stent-size"
  | "platform-limit"
  | "mv-stent-short"
  | "carina-shift"
  | "protrusion-short"
  | "protrusion-long"
  | "deploy-pressure"
  | "crush-balloon-past-carina"
  | "crush-not-optimised"
  | "wrong-cell"
  | "wire-behind-stent"
  | "one-step-kiss"
  | "kiss-oversized"
  | "kiss-undersized"
  | "deflate-order"
  | "pot-oversized"
  | "pot-undersized"
  | "pot-over-limit"
  | "pot-too-long"
  | "pot-too-proximal"
  | "distal-overstretch"
  | "neocarina-crushed"
  | "struts-not-opened"
  | "double-layer-underexpanded"
  | "culotte-first-branch"
  | "step-skipped"
  | "sb-left-compromised"
  | "sb-misjudged"
  | "sb-stent-unneeded"
  | "distal-dissection"
  | "sb-edge-dissection";

export interface BifFinding {
  step: number;
  stepId: string;
  technique: BifTechnique;
  kind: FindingKind;
  /** failure ends the run; major counts as a critical error */
  severity: "minor" | "major" | "failure";
  text: string;
  source?: string;
  /** "image": an operator sees it on angiography or imaging now; "debrief": named after the final assessment */
  shows: "image" | "debrief";
}

export interface StepRecord {
  technique: BifTechnique;
  n: number;
  id: string;
  input: StepInput;
  skipped: boolean;
  /** no finding of major or failure severity at this step */
  valid: boolean;
}

export interface KissRecord {
  mode: "one-step" | "two-step";
  mvMm: number;
  sbMm: number;
  finetMm: number;
}

export interface BifState {
  presetId: BifPresetId;
  /** null while the technique is being chosen (phase plan) */
  technique: BifTechnique | null;
  /** the next step to do (1-based); above the step count the technique is finished */
  next: number;
  history: StepRecord[];
  escalatedFrom: BifTechnique | null;
  mvStent: BifStent | null;
  sbStent: BifStent | null;
  /** culotte: the branch stented first */
  firstBranch: "mv" | "sb" | null;
  /** culotte: the second stent's length back into the proximal MV (mm) */
  secondProxMm: number;
  mvBalloonMm: number | null;
  sbWire: "in" | "jailed" | "rewired" | "removed";
  rewireCell: "proximal" | "distal" | null;
  /** the rewiring passed behind the stent (no POT before it) */
  wireBehind: boolean;
  /** the SB ostium is covered by struts not yet opened by a kiss */
  sbJailed: boolean;
  sbCompromised: boolean;
  /** side-branch-compromise is held as the indication of a bail-out run */
  compromiseHeld: boolean;
  /** SB ostial metal coverage (0..1) */
  sbCoverage: number;
  /** layers of metal at the SB ostium (crushed SB stent counts two) */
  ostialLayers: number;
  /** mean diameter and oval index of the proximal stent at the carina */
  proxD: number;
  oval: number;
  /** largest diameter reached in the distal MV stent (mm) */
  distalMaxD: number;
  neocarinaMm: number;
  doubleLayerMm: number;
  crushedMm: number;
  strutsOpened: boolean;
  lastKiss: KissRecord | null;
  kisses: number;
  potCount: number;
  findings: BifFinding[];
  failure: BifFinding | null;
}

export interface StepInput {
  skip?: boolean;
  /** stent: nominal diameter, platform, labelled length, MV length proximal to the carina */
  stentMm?: number;
  platformId?: PlatformId;
  lengthMm?: number;
  proxMm?: number;
  /** SB stent protrusion into the MV (mm) */
  protrusionMm?: number;
  /** deployment pressure and the pulled-back reinflation (atm) */
  atm?: number;
  postAtm?: number;
  /** balloon diameter, length and the distal marker's position relative to the carina (+ beyond, mm) */
  balloonMm?: number;
  balloonLenMm?: number;
  markerMm?: number;
  /** crush: a POT after a distally sized crush balloon */
  potMm?: number;
  potLenMm?: number;
  potMarkerMm?: number;
  /** rewiring strut */
  cell?: "proximal" | "distal";
  /** kiss */
  kiss?: "one-step" | "two-step";
  sbBalloonMm?: number;
  deflate?: "mv-first" | "sb-first" | "together";
  /** culotte: the branch stented first */
  branch?: "mv" | "sb";
  /** provisional step 6: the learner's judgement of the side branch, read from the images */
  sbJudged?: "compromised" | "open";
}

export interface StepResult {
  state: BifState;
  ok: boolean;
  /** why a step was refused (ok false), or what the step did */
  message: string;
}

export function newBifState(presetId: BifPresetId): BifState {
  const g = BIF_BY_ID[presetId] ?? BIF_PRESETS[0];
  return {
    presetId: g.id,
    technique: null,
    next: 1,
    history: [],
    escalatedFrom: null,
    mvStent: null,
    sbStent: null,
    firstBranch: null,
    secondProxMm: 0,
    mvBalloonMm: null,
    sbWire: "in",
    rewireCell: null,
    wireBehind: false,
    sbJailed: false,
    sbCompromised: false,
    compromiseHeld: false,
    sbCoverage: 0,
    ostialLayers: 0,
    proxD: 0,
    oval: 1,
    distalMaxD: 0,
    neocarinaMm: 0,
    doubleLayerMm: 0,
    crushedMm: 0,
    strutsOpened: false,
    lastKiss: null,
    kisses: 0,
    potCount: 0,
    findings: [],
    failure: null,
  };
}

export const geometryOf = (s: Pick<BifState, "presetId">): BifGeometry => BIF_BY_ID[s.presetId];

/** Finet's effective diameter of two kissing balloons: 0.678 x (d1 + d2). */
export function finetDiameter(d1: number, d2: number): number {
  return FINET_COEFFICIENT * (d1 + d2);
}

/** Whether a kissing pair's effective diameter is within the tolerance of the proximal reference. */
export function kissPairAccepted(d1: number, d2: number, proxRefMm: number): boolean {
  return Math.abs(finetDiameter(d1, d2) - proxRefMm) <= MP_SIZE_TOL_MM + 1e-9;
}

/** The step the learner is at, or null before a technique is chosen and after its last step. */
export function currentStep(s: BifState): TechniqueStep | null {
  return s.technique ? stepAt(s.technique, s.next) ?? null : null;
}

/** The step the run is at for the learner: the step that failed once the run has failed, else the next step. */
export function shownStep(s: BifState): TechniqueStep | null {
  const f = s.failure;
  if (f && s.technique && f.technique === s.technique && f.step >= 1) return stepAt(s.technique, f.step) ?? currentStep(s);
  return currentStep(s);
}

export function isFinished(s: BifState): boolean {
  return !!s.technique && s.next > stepCount(s.technique);
}

/** Whether the run has ended in a failure state. */
export const hasFailed = (s: BifState) => s.failure !== null;

// ---------------------------------------------------------------------------
// Technique choice and escalation
// ---------------------------------------------------------------------------

/** Choose the technique (plan phase). Refused when the preset does not offer it or a technique is already running. */
export function chooseTechnique(s: BifState, t: BifTechnique): StepResult {
  const g = geometryOf(s);
  if (s.technique) return { state: s, ok: false, message: "A technique is already under way." };
  const opt = plannedTechniques(g).find((o) => o.technique === t);
  if (!opt) return { state: s, ok: false, message: `This bench does not start ${TECHNIQUE_STEPS[t].name} on this bifurcation.` };
  const ns: BifState = { ...s, technique: t, next: 1, findings: [...s.findings] };
  if (opt.verdict === "flag") addFinding(ns, 0, "plan", "technique-choice", "minor", opt.why, opt.source, "debrief");
  return { state: ns, ok: true, message: `${TECHNIQUE_STEPS[t].name} chosen.` };
}

/**
 * The techniques the plan step offers on a preset, in the fixed catalogue order (provisional, DK crush,
 * culotte) whatever their verdicts, so the order gives nothing away; bail-outs come later, by escalation.
 */
export function plannedTechniques(g: BifGeometry): TechniqueOption[] {
  return BENCH_TECHNIQUES.filter((t) => !BAILOUTS.includes(t))
    .map((t) => g.techniques.find((o) => o.technique === t))
    .filter((o): o is TechniqueOption => !!o);
}

/** The technique a launch without one runs: the preset's first planned technique with the verdict "best". */
export function defaultTechnique(g: BifGeometry): BifTechnique {
  const planned = plannedTechniques(g);
  return (planned.find((o) => o.verdict === "best") ?? planned[0]).technique;
}

/** Whether the bail-outs are offered: a provisional run at its final assessment step (before the run is logged). */
export function escalationOffered(s: BifState): boolean {
  return s.technique === "provisional" && !s.failure && s.next === stepCount("provisional");
}

/** Whether a provisional run at its final assessment step leaves the SB compromised, so a bail-out is indicated (escalate() also takes one that is not, and names it in the debrief). */
export function canEscalate(s: BifState): boolean {
  return escalationOffered(s) && s.sbCompromised;
}

/**
 * Escalate a provisional run to a bail-out the preset offers (TAP or reverse crush): the run continues on the
 * same stents, at the bail-out's step 1. The learner judges whether the SB needs it: a bail-out on an SB that
 * is not compromised is taken and named in the debrief.
 */
export function escalate(s: BifState, t: BifTechnique): StepResult {
  if (!BAILOUTS.includes(t)) return { state: s, ok: false, message: "The bench's bail-outs are TAP and reverse crush." };
  if (!escalationOffered(s)) return { state: s, ok: false, message: "A bail-out comes after the provisional sequence, before its final assessment." };
  const g = geometryOf(s);
  if (!g.techniques.some((o) => o.technique === t)) return { state: s, ok: false, message: `This bench does not offer ${TECHNIQUE_STEPS[t].name} as a bail-out on this bifurcation.` };
  const ns: BifState = { ...s, technique: t, next: 1, escalatedFrom: "provisional", compromiseHeld: true, findings: [...s.findings] };
  // the learner judges whether the SB needs a stent; a bail-out on an SB that was not compromised is named in the debrief
  if (!s.sbCompromised)
    addFinding(ns, 0, "bail-out", "sb-stent-unneeded", "minor", `The ${g.sbName} was not compromised after the provisional sequence: the side-branch stent was not needed.`, PSB, "debrief");
  const opt = g.techniques.find((o) => o.technique === t);
  if (opt?.verdict === "flag") addFinding(ns, 0, "plan", "technique-choice", "minor", opt.why, opt.source, "debrief");
  return { state: ns, ok: true, message: `Bail-out: ${TECHNIQUE_STEPS[t].name}.` };
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

function addFinding(s: BifState, n: number, stepId: string, kind: FindingKind, severity: BifFinding["severity"], text: string, source: string | undefined, shows: BifFinding["shows"]) {
  const f: BifFinding = { step: n, stepId, technique: s.technique ?? "provisional", kind, severity, text, source, shows };
  s.findings = [...s.findings, f];
  if (severity === "failure" && !s.failure) s.failure = f;
}

const near = (a: number, b: number) => Math.abs(a - b) <= MP_SIZE_TOL_MM + 1e-9;

/** The strut each rewiring should take: the module's rule per technique and step (either where it names none). */
export const EXPECTED_CELL: Partial<Record<BifTechnique, Record<string, "proximal" | "distal" | "either">>> = {
  provisional: { "rewire-distal-cell": "distal" },
  "dk-crush": { "rewire-proximal-strut": "proximal", "rewire-distal-strut": "distal" },
  culotte: { "rewire-distal-cell": "distal", "rewire-first-branch": "distal" },
  "mini-crush": { "rewire-proximal-strut": "proximal" },
  "reverse-crush": { "rewire-sb": "distal", "rewire-sb-stent": "either" },
};

/** Steps whose skipping the bench refuses: they place, deploy, crush or remove devices the later steps need. */
const NOT_SKIPPABLE: ReadonlySet<TechniqueStep["action"]> = new Set(["wire", "predilate", "park-balloon", "position-stent", "deploy-stent", "crush", "remove", "branch-balloon", "final-assessment", "deploy-both"]);

/** Whether a step may be left out: not a device step, and a rewiring only where the module makes it conditional (the later steps need the wire). */
export function canSkip(step: TechniqueStep): boolean {
  if (NOT_SKIPPABLE.has(step.action)) return false;
  return step.action !== "rewire" || !!step.optional;
}

const DK = "cp-bifurcation-two-stent-dk-crush";
const CUL = "cp-bifurcation-two-stent-culotte";
const TAPL = "cp-bifurcation-two-stent-t-tap";
const PSET = "cp-bifurcation-provisional-setup";
const PPOT = "cp-bifurcation-provisional-pot";
const PSB = "cp-bifurcation-provisional-sb";

/** Coverage of a single jailing layer, by the platform's cell design. */
function jailCoverage(platformId: PlatformId): number {
  return MP_JAIL_COVERAGE[platformFor(platformId).cell];
}

/** The provisional family raises side-branch-compromise; planned two-stent techniques jail the SB by design. */
function provisionalFamily(t: BifTechnique | null): boolean {
  return t === "provisional" || t === "tap" || t === "reverse-crush";
}

/**
 * Apply the current step. `stepId` must be the step the learner is at (steps unlock in order); a failed
 * run takes no further step. Returns the new state; the input state is not changed.
 */
export function applyStep(s0: BifState, stepId: string, input: StepInput = {}): StepResult {
  if (!s0.technique) return { state: s0, ok: false, message: "Choose the technique first." };
  if (s0.failure) return { state: s0, ok: false, message: "This run has failed; restart the bench." };
  const t = s0.technique;
  const step = currentStep(s0);
  if (!step) return { state: s0, ok: false, message: "The technique is finished." };
  if (step.id !== stepId) {
    const asked = stepById(t, stepId);
    return { state: s0, ok: false, message: asked ? `Step ${asked.n} is not open yet: do step ${step.n} (${stepLabel(step, false)}) first.` : `No step "${stepId}" in ${t}.` };
  }
  const g = geometryOf(s0);
  const s: BifState = { ...s0, findings: [...s0.findings] };
  const before = s.findings.length;
  const n = step.n;
  const find = (kind: FindingKind, severity: BifFinding["severity"], text: string, source: string, shows: BifFinding["shows"] = "debrief") => addFinding(s, n, step.id, kind, severity, text, source, shows);

  if (input.skip) {
    if (!canSkip(step)) return { state: s0, ok: false, message: `Step ${n} (${stepLabel(step, false)}) cannot be left out: later steps need it.` };
    const lesson = TECHNIQUE_STEPS[t].lessonId;
    if (step.action === "kiss" && t === "culotte") find("double-layer-underexpanded", "major", "The final kiss was left out: the double layer in the proximal MV may stay under-expanded (Oxford makes the culotte kiss mandatory).", CUL);
    else if (step.action === "pot" && !step.optional) find("step-skipped", "major", `Step ${n} (${step.name}) was left out.`, lesson);
    else if (step.action === "pot" && step.optional && t === "dk-crush" && g.proxRefMm - g.distRefMm >= MP_CLEARLY_LARGER_MM) find("step-skipped", "minor", "No POT although the proximal MV is clearly larger: the wire back into the SB may pass under the MV stent.", DK);
    else if (step.action === "open-struts") find("struts-not-opened", "minor", "The struts into the unstented branch were not opened before the second stent.", CUL);
    else if (!step.optional) find("step-skipped", step.action === "kiss" ? "major" : "minor", `Step ${n} (${step.name}) was left out.`, lesson);
    return finishStep(s0, s, step, input, true, before);
  }

  const msg = applyAction(s, g, t, step, input, find);
  if (typeof msg === "object") return { state: s0, ok: false, message: msg.refuse };
  return finishStep(s0, s, step, input, false, before, msg);
}

function finishStep(s0: BifState, s: BifState, step: TechniqueStep, input: StepInput, skipped: boolean, before: number, message = ""): StepResult {
  const t = s0.technique!;
  const fresh = s.findings.slice(before);
  const valid = !fresh.some((f) => f.severity !== "minor");
  s.history = [...s0.history, { technique: t, n: step.n, id: step.id, input, skipped, valid }];
  s.next = s0.next + 1;
  return { state: s, ok: true, message: message || (skipped ? `Step ${step.n} left out.` : `Step ${step.n} done.`) };
}

type Find = (kind: FindingKind, severity: BifFinding["severity"], text: string, source: string, shows?: BifFinding["shows"]) => void;

/** The physical effect of one step; a { refuse } result leaves the state unchanged. */
function applyAction(s: BifState, g: BifGeometry, t: BifTechnique, step: TechniqueStep, inp: StepInput, find: Find): string | { refuse: string } {
  switch (step.action) {
    case "wire":
      s.sbWire = "in";
      return "Both branches wired.";
    case "predilate":
      return "Main vessel prepared.";
    case "park-balloon": {
      const b = inp.balloonMm ?? g.distRefMm;
      s.mvBalloonMm = b;
      if ((t === "dk-crush" || t === "t-stent") && !near(b, g.distRefMm)) find("park-balloon-size", "minor", `The parked MV balloon (${b} mm) is not 1:1 to the ${g.distName} (${g.distRefMm} mm).`, DK);
      return `${b} mm balloon parked in the MV.`;
    }
    case "position-stent":
      return positionStent(s, g, t, step, inp, find);
    case "deploy-stent":
      return deployStent(s, g, t, step, inp, find);
    case "remove":
      if (t === "t-stent") {
        s.sbWire = "removed";
        s.mvBalloonMm = null;
      }
      return "Removed.";
    case "angiogram": {
      const sbEdge = s.findings.find((f) => f.kind === "sb-edge-dissection");
      return sbEdge ? "The angiogram shows the SB edge dissection; it is treated now, before the next step." : "Angiogram: no new problem.";
    }
    case "crush":
      return crush(s, g, t, step, inp, find);
    case "rewire":
      return rewire(s, g, t, step, inp, find);
    case "branch-balloon":
      if (s.sbWire !== "rewired" && s.sbWire !== "in") return { refuse: "The side branch has no wire to take a balloon." };
      return `${inp.balloonMm ?? MP_BRANCH_BALLOON_DEFAULT_MM} mm balloon in the side branch.`;
    case "open-struts":
      s.strutsOpened = true;
      s.sbCoverage = Math.max(0, s.sbCoverage * MP_OPEN_STRUTS_FACTOR);
      return "Struts opened into the unstented branch.";
    case "kiss":
      return kiss(s, g, t, step, inp, find);
    case "pot":
      return pot(s, g, t, step, inp, find);
    case "assess-branch": {
      // the learner judges from the images; the answer is named only in the debrief (at once in guided mode)
      const judged = inp.sbJudged;
      if (judged && (judged === "compromised") !== s.sbCompromised)
        find(
          "sb-misjudged",
          "minor",
          s.sbCompromised
            ? `The ${g.sbName} was judged open, but its ostium was narrowed behind the struts: rewire it through a distal strut and kiss.`
            : `The ${g.sbName} was judged compromised, but its ostium was open after the POT: no further side-branch treatment was needed.`,
          PSB,
          "debrief"
        );
      return judged ? `Side branch assessed: judged ${judged === "compromised" ? "compromised" : "open"}.` : "Side branch assessed.";
    }
    case "final-assessment":
      return finalAssessment(s, g, t, step, find);
    case "deploy-both":
      return { refuse: "The bench does not build simultaneous stenting." };
  }
}

function positionStent(s: BifState, g: BifGeometry, t: BifTechnique, step: TechniqueStep, inp: StepInput, find: Find): string | { refuse: string } {
  if (step.branch === "mv") {
    const d = inp.stentMm ?? 3.0;
    const pid = inp.platformId ?? "A";
    const p = platformFor(pid);
    if (!p.offers(d)) return { refuse: `${p.label} is not made in ${d} mm.` };
    const prox = inp.proxMm ?? 8;
    s.mvStent = { branch: "mv", nominalMm: d, platformId: p.id, lengthMm: inp.lengthMm ?? 24, proxMm: prox, deployed: false, crushed: false };
    if (d >= g.proxRefMm - MP_SIZE_TOL_MM && !near(d, g.distRefMm)) find("carina-shift", "major", `A ${d} mm stent sized to the proximal MV shifts the carina into the ${g.sbName} and can dissect the ${g.distName}.`, PSET);
    else if (!near(d, g.distRefMm)) find("stent-size", "minor", `The ${d} mm MV stent is not sized to the ${g.distName} (${g.distRefMm} mm).`, PSET);
    if (p.limit(d) < g.proxRefMm - 1e-9) find("platform-limit", "major", `${p.label}'s ${d} mm stent is labelled to ${p.limit(d)} mm, short of the ${g.proxRefMm} mm proximal MV it must reach at POT.`, PSET);
    if (prox <= 0) find("mv-stent-short", "major", "A stent ending at the carina leaves the bifurcation untreated.", PSET);
    else if (prox < POT_MIN_PROXIMAL_MM) find("mv-stent-short", "major", `${prox} mm of stent proximal to the carina is too short for any POT balloon (the shortest are ${POT_MIN_PROXIMAL_MM} mm).`, PSET);
    else if (prox < POT_BETTER_PROXIMAL_MM) find("mv-stent-short", "minor", `${prox} mm proximal to the carina takes a POT balloon; 8-10 mm is better.`, PSET);
    return `${d} mm MV stent positioned, ${prox} mm proximal to the carina.`;
  }
  // SB stent: the TAP and reverse-crush delivery steps set its size; the protrusion steps set its position
  if (t === "tap" && step.id === "deliver-sb-stent") {
    if (s.sbWire !== "rewired") return { refuse: `The ${g.sbName} has no wire through the MV stent struts.` };
    const d = inp.stentMm ?? g.sbRefMm;
    s.sbStent = { branch: "sb", nominalMm: d, platformId: inp.platformId ?? "A", lengthMm: inp.lengthMm ?? 15, proxMm: -MP_TAP_DELIVER_BEYOND_MM, deployed: false, crushed: false };
    if (!near(d, g.sbRefMm)) find("stent-size", "minor", `The ${d} mm SB stent is not sized to the ${g.sbName} (${g.sbRefMm} mm).`, TAPL);
    return `${d} mm SB stent delivered beyond the ostium.`;
  }
  const prot = inp.protrusionMm ?? 1;
  const existing = s.sbStent;
  const d = inp.stentMm ?? existing?.nominalMm ?? g.sbRefMm;
  const pid = inp.platformId ?? existing?.platformId ?? "A";
  if (!platformFor(pid).offers(d)) return { refuse: `${platformFor(pid).label} is not made in ${d} mm.` };
  s.sbStent = { branch: "sb", nominalMm: d, platformId: pid, lengthMm: inp.lengthMm ?? existing?.lengthMm ?? 15, proxMm: prot, deployed: false, crushed: false };
  if (!existing && !near(d, g.sbRefMm)) find("stent-size", "minor", `The ${d} mm SB stent is not sized to the ${g.sbName} (${g.sbRefMm} mm).`, DK);
  if (t === "dk-crush" || t === "reverse-crush") {
    if (prot < 2 - 1e-9)
      find(
        "protrusion-short",
        t === "dk-crush" ? "failure" : "major",
        `The SB stent stands only ${prot} mm into the MV (DK and reverse crush need 2-3 mm): part of the ostium may be left unscaffolded and need a further stent.`,
        t === "dk-crush" ? DK : "cp-bifurcation-two-stent-crush-variants",
        "image"
      );
    else if (prot > 3 + 1e-9) find("protrusion-long", "minor", `${prot} mm of protrusion: erring long costs little, but the crushed segment is longer.`, DK);
  } else if (t === "tap") {
    if (prot < 1 - 1e-9) find("protrusion-short", "major", `${prot} mm of protrusion may leave part of the ostium uncovered (TAP: 1-2 mm).`, TAPL, "image");
    else if (prot > 2 + 1e-9) find("protrusion-long", "major", `${prot} mm of protrusion lengthens the neocarina (TAP: 1-2 mm).`, TAPL, "image");
  } else if (t === "t-stent") {
    if (prot < 0) find("protrusion-short", "major", "The SB stent stops short of the ostium: part of it stays unscaffolded.", TAPL, "image");
  } else if (t === "mini-crush") {
    if (prot < 1 - 1e-9) find("protrusion-short", "major", "The SB stent must protrude just enough to cover both lips of the ostium.", "cp-bifurcation-two-stent-crush-variants", "image");
  }
  return `SB stent positioned ${prot} mm into the MV.`;
}

function deployStent(s: BifState, g: BifGeometry, t: BifTechnique, step: TechniqueStep, inp: StepInput, find: Find): string | { refuse: string } {
  const branch = step.branch === "first" ? inp.branch ?? "sb" : step.branch === "second" ? (s.firstBranch === "mv" ? "sb" : "mv") : step.branch;
  if (t === "culotte") return deployCulotte(s, g, step, branch as "mv" | "sb", inp, find);
  if (branch === "sb") {
    const st = s.sbStent;
    if (!st) return { refuse: "Position the SB stent first." };
    if (t === "tap" && s.mvBalloonMm === null) return { refuse: "Put the MV balloon across the SB take-off first; it stays in place, uninflated, while the SB stent is deployed." };
    const atm = inp.atm ?? 12;
    if (t === "dk-crush" || t === "t-stent") {
      if (atm > 12) find("sb-edge-dissection", "major", `The SB stent was deployed straight to ${atm} atm: the distal SB edge can dissect (deploy at 10-12 atm, then the pulled-back balloon at 20 atm).`, DK, "image");
      else if (atm < 10) find("deploy-pressure", "minor", `The SB stent was deployed at ${atm} atm, below the 10-12 atm the module gives.`, DK, "debrief");
      const post = inp.postAtm ?? 20;
      if (post < 20 - 1e-9) find("deploy-pressure", "minor", `The pulled-back SB stent balloon was reinflated at ${post} atm, not at high pressure (20 atm): the SB stent may stay underexpanded.`, DK, "debrief");
    }
    s.sbStent = { ...st, deployed: true };
    s.sbCompromised = false;
    s.sbJailed = false;
    if (t === "tap" || t === "t-stent") s.neocarinaMm = Math.max(0, st.proxMm);
    if (t === "tap") {
      // the SB stent covers the ostium; the MV struts already opened into it stay as the last kiss left them
      s.ostialLayers = 1;
    }
    return `SB stent deployed at ${atm} atm.`;
  }
  // MV stent: provisional stenting positioned it at the step before; the two-stent techniques choose it here
  let st = s.mvStent;
  if (t === "provisional" && !st) return { refuse: "Position the MV stent first." };
  if (t !== "provisional") {
    const d = inp.stentMm ?? 3.0;
    const p = platformFor(inp.platformId ?? "A");
    if (!p.offers(d)) return { refuse: `${p.label} is not made in ${d} mm.` };
    st = { branch: "mv", nominalMm: d, platformId: p.id, lengthMm: inp.lengthMm ?? 24, proxMm: inp.proxMm ?? 8, deployed: false, crushed: false };
    if (d >= g.proxRefMm - MP_SIZE_TOL_MM && !near(d, g.distRefMm)) find("carina-shift", "major", `A ${d} mm MV stent sized to the proximal MV can dissect the ${g.distName}.`, DK);
    else if (!near(d, g.distRefMm)) find("stent-size", "minor", `The ${d} mm MV stent is not sized to the ${g.distName} (${g.distRefMm} mm).`, DK);
    if (p.limit(d) < g.proxRefMm - 1e-9) find("platform-limit", "major", `${p.label}'s ${d} mm stent is labelled to ${p.limit(d)} mm, short of the ${g.proxRefMm} mm proximal MV.`, "cp-bifurcation-provisional-setup; cp-left-main-technique");
    if (st.proxMm < POT_MIN_PROXIMAL_MM) find("mv-stent-short", "major", `${st.proxMm} mm of stent proximal to the carina is too short for a POT balloon.`, PSET);
  }
  if (!st) return { refuse: "No MV stent." };
  s.mvStent = { ...st, deployed: true };
  if (t === "provisional" && s.sbWire === "in") s.sbWire = "jailed";
  if (t === "dk-crush") s.sbWire = s.sbWire === "rewired" ? "jailed" : s.sbWire;
  s.proxD = st.nominalMm;
  s.oval = 1;
  s.distalMaxD = Math.max(s.distalMaxD, st.nominalMm);
  if (st.nominalMm >= g.proxRefMm - MP_SIZE_TOL_MM && !near(st.nominalMm, g.distRefMm)) {
    s.distalMaxD = Math.max(s.distalMaxD, st.nominalMm);
    addDissection(s, g, find);
  }
  // the MV stent jails the SB ostium (in DK crush over the crushed layers)
  s.sbJailed = true;
  s.lastKiss = t === "dk-crush" ? s.lastKiss : null;
  if (t === "dk-crush") {
    s.ostialLayers = 3;
    s.sbCoverage = Math.max(s.sbCoverage, MP_CRUSHED_COVERAGE);
    s.doubleLayerMm = s.crushedMm;
    s.rewireCell = null;
  } else {
    s.ostialLayers = 1;
    s.sbCoverage = jailCoverage(st.platformId);
  }
  if (provisionalFamily(t)) s.sbCompromised = true;
  return `${st.nominalMm} mm MV stent deployed.`;
}

function addDissection(s: BifState, g: BifGeometry, find: Find) {
  if (s.findings.some((f) => f.kind === "distal-dissection")) return;
  find("distal-dissection", "major", `Dissection of the ${g.distName} at the distal edge.`, PSET, "image");
}

function deployCulotte(s: BifState, g: BifGeometry, step: TechniqueStep, branch: "mv" | "sb", inp: StepInput, find: Find): string | { refuse: string } {
  const d = inp.stentMm ?? (branch === "sb" ? g.sbRefMm : g.distRefMm);
  const p = platformFor(inp.platformId ?? "A");
  if (!p.offers(d)) return { refuse: `${p.label} is not made in ${d} mm.` };
  const prox = inp.proxMm ?? 8;
  const ref = branch === "sb" ? g.sbRefMm : g.distRefMm;
  const name = branch === "sb" ? g.sbName : g.distName;
  if (!near(d, ref)) find("stent-size", "minor", `The ${d} mm stent is not sized to the ${name} (${ref} mm).`, CUL);
  if (p.limit(d) < g.proxRefMm - 1e-9) find("platform-limit", "major", `${p.label}'s ${d} mm stent is labelled to ${p.limit(d)} mm: the POTs to ${g.proxRefMm} mm would overstretch and deform it.`, CUL);
  const st: BifStent = { branch, nominalMm: d, platformId: p.id, lengthMm: inp.lengthMm ?? 18, proxMm: prox, deployed: true, crushed: false };
  if (step.id === "first-stent") {
    s.firstBranch = branch;
    if (branch === "mv") find("culotte-first-branch", "minor", `The first stent went into the less angulated branch: Brilakis stents the more angulated branch (here the ${g.sbName}) first; Oxford's version stents the MV first.`, CUL);
    if (branch === "sb") s.sbStent = st;
    else s.mvStent = st;
    s.proxD = d;
    s.oval = 1;
    if (branch === "mv") s.distalMaxD = Math.max(s.distalMaxD, d);
    // the other branch is jailed by the first stent
    s.sbJailed = true;
    s.ostialLayers = 1;
    s.sbCoverage = jailCoverage(p.id);
    return `First stent deployed from the ${name} back ${prox} mm into the proximal MV.`;
  }
  // second stent, inside the proximal part of the first
  if (s.sbWire !== "rewired") return { refuse: "The unstented branch has no wire through the first stent." };
  if (branch === "sb") s.sbStent = st;
  else s.mvStent = st;
  s.secondProxMm = prox;
  const firstProx = (s.firstBranch === "mv" ? s.mvStent : s.sbStent)?.proxMm ?? 0;
  s.doubleLayerMm = Math.min(prox, branch === "sb" ? s.mvStent?.proxMm ?? firstProx : s.sbStent?.proxMm ?? firstProx);
  if (!s.strutsOpened) s.sbCoverage = Math.min(1, s.sbCoverage + MP_UNOPENED_SECOND_STENT_COVERAGE);
  // the second stent jails the first branch
  s.sbJailed = true;
  s.rewireCell = null;
  s.sbWire = "jailed";
  s.oval = 1;
  s.proxD = Math.min(s.proxD, d);
  if (branch === "mv") s.distalMaxD = Math.max(s.distalMaxD, d);
  return `Second stent deployed from the ${name} inside the first.`;
}

function crush(s: BifState, g: BifGeometry, t: BifTechnique, step: TechniqueStep, inp: StepInput, find: Find): string | { refuse: string } {
  const st = s.sbStent;
  if (!st?.deployed) return { refuse: "There is no deployed SB stent to crush." };
  const b = inp.balloonMm ?? s.mvBalloonMm ?? g.distRefMm;
  const marker = inp.markerMm ?? 0;
  const source = t === "dk-crush" ? DK : "cp-bifurcation-two-stent-crush-variants";
  const proximallySized = b > g.distRefMm + MP_SIZE_TOL_MM;
  if (proximallySized && marker > MP_CARINA_BEYOND_TOL_MM + 1e-9) {
    s.distalMaxD = Math.max(s.distalMaxD, b);
    find("crush-balloon-past-carina", t === "dk-crush" ? "failure" : "major", `A ${b} mm crush balloon sized to the proximal MV reached ${marker} mm past the carina: the ${g.distName} may dissect.`, source, "image");
    addDissection(s, g, find);
  }
  s.sbStent = { ...st, crushed: true };
  s.crushedMm = Math.max(0, st.proxMm);
  s.ostialLayers = 2;
  s.sbCoverage = MP_CRUSHED_COVERAGE;
  s.sbJailed = true;
  s.rewireCell = null;
  if (s.sbWire === "in" || s.sbWire === "rewired") s.sbWire = "jailed";
  // a distally sized crush balloon is followed by a POT (the left main case)
  if (!proximallySized && t === "dk-crush" && g.proxRefMm - g.distRefMm >= MP_CLEARLY_LARGER_MM) {
    if (inp.potMm === undefined) find("crush-not-optimised", "minor", "The crush balloon was sized to the distal MV and no POT followed: the crushed segment in the proximal MV is left unoptimised before the rewiring.", `${DK}; cp-bifurcation-two-stent-case-lm-dk-crush`);
    else {
      const r = potEffect(s, g, t, inp.potMm, inp.potLenMm ?? 8, inp.potMarkerMm ?? MP_CRUSH_POT_MARKER_MM, 1e9, find, "crush POT");
      if (typeof r === "object") return r;
    }
  }
  return `SB stent crushed with a ${b} mm balloon${inp.potMm !== undefined ? ", then POT" : ""}.`;
}

function rewire(s: BifState, g: BifGeometry, t: BifTechnique, step: TechniqueStep, inp: StepInput, find: Find): string | { refuse: string } {
  const cell = inp.cell ?? "distal";
  const expected = EXPECTED_CELL[t]?.[step.id] ?? "distal";
  if (expected !== "either" && cell !== expected) {
    const why =
      expected === "proximal"
        ? "after a crush the wire goes through a proximal strut, so the SB balloon presses the crushed struts back towards the carina; a distal strut risks pushing the crushed stent away from it"
        : "after a fresh stent across the SB the wire goes through a distal strut at the carina, which scaffolds the ostium better";
    find("wrong-cell", "major", `Rewired through a ${cell} strut: ${why}.`, t === "dk-crush" ? DK : t === "culotte" ? CUL : PSB);
  }
  // a culotte rewiring without the POT before it may pass behind the stent
  s.wireBehind = false;
  if (t === "culotte" && step.id === "rewire-distal-cell" && s.potCount === 0) {
    s.wireBehind = true;
    find("wire-behind-stent", "major", "Rewired without a POT first: the cells stay small and the wire may pass behind the stent.", CUL, "debrief");
  }
  s.sbWire = "rewired";
  s.rewireCell = cell;
  return `Side branch rewired through a ${cell} strut.`;
}

function kiss(s: BifState, g: BifGeometry, t: BifTechnique, step: TechniqueStep, inp: StepInput, find: Find): string | { refuse: string } {
  if (s.sbWire !== "rewired" && !(t === "tap" && s.sbStent?.deployed)) return { refuse: "The side branch has no wire through the struts: rewire it before kissing." };
  if (t === "t-stent" && s.sbWire !== "rewired") s.sbWire = "rewired";
  const mv = inp.balloonMm ?? s.mvBalloonMm ?? g.distRefMm;
  const sb = inp.sbBalloonMm ?? g.sbRefMm;
  const mode = inp.kiss ?? "two-step";
  const fin = finetDiameter(mv, sb);
  const src = t === "provisional" ? PSB : DK;
  if (fin > g.proxRefMm + MP_SIZE_TOL_MM + 1e-9) find("kiss-oversized", "major", `0.678 x (${mv} + ${sb}) = ${fin.toFixed(2)} mm overstretches the ${g.proxRefMm} mm proximal MV.`, src, "debrief");
  else if (fin < g.proxRefMm - MP_SIZE_TOL_MM - 1e-9) find("kiss-undersized", "minor", `0.678 x (${mv} + ${sb}) = ${fin.toFixed(2)} mm is too small to shape the ${g.proxRefMm} mm proximal stent.`, src, "debrief");
  if (mode === "one-step" && (t === "dk-crush" || t === "culotte")) find("one-step-kiss", "minor", "A one-step kiss leaves more metal across the SB ostium than a two-step kiss.", t === "dk-crush" ? DK : CUL, "debrief");
  // metal left at the ostium
  const crushedLayers = s.ostialLayers >= 2;
  let cov = crushedLayers ? CRUSH_KISS_COVERAGE[mode] : CRUSH_KISS_COVERAGE[mode] * MP_SINGLE_LAYER_FACTOR;
  // the strut the last rewiring should have taken (a provisional rewiring for a bail-out's kiss)
  const lastRewire = [...s.history].reverse().find((h) => !h.skipped && stepAt(h.technique, h.n)?.action === "rewire");
  const want = lastRewire ? EXPECTED_CELL[lastRewire.technique]?.[lastRewire.id] ?? "distal" : undefined;
  const cellOk = !want || want === "either" || s.rewireCell === want;
  if (!cellOk) cov += MP_WRONG_CELL_COVERAGE;
  if (s.wireBehind) cov += MP_WRONG_CELL_COVERAGE;
  if (t === "tap") {
    const order = inp.deflate ?? "mv-first";
    if (order === "sb-first") {
      cov += MP_TAP_SB_FIRST_COVERAGE;
      find("deflate-order", "major", "The SB balloon went down first: the MV balloon pressed the protruding struts into the SB ostium.", TAPL, "image");
    } else if (order === "together") find("deflate-order", "minor", "Deflate the MV balloon first in the TAP kiss.", TAPL, "debrief");
    // in TAP the SB stent covers the ostium; what remains is metal of the MV stent and the neocarina
  }
  s.sbCoverage = Math.min(1, cov);
  s.lastKiss = { mode, mvMm: mv, sbMm: sb, finetMm: fin };
  s.kisses += 1;
  s.oval = 1 + MP_KISS_OVAL * (Math.min(mv, sb) / Math.max(mv, sb));
  // the kiss widens the proximal stent into an oval; its mean diameter does not pass the vessel's reference
  s.proxD = Math.max(s.proxD, Math.min(fin, g.proxRefMm));
  s.distalMaxD = Math.max(s.distalMaxD, mv);
  // a kiss through the right cell opens the jailed ostium; ostial disease that needs a stent persists
  if (cellOk && !s.wireBehind) {
    s.sbJailed = false;
    if (g.sbOstialDisease === "mild" || s.sbStent?.deployed) s.sbCompromised = false;
  }
  return `Kiss with ${mv} and ${sb} mm balloons (${mode}); Finet effective diameter ${fin.toFixed(2)} mm.`;
}

/**
 * The POT's effect: diameter, platform limit, length within the stent proximal to the carina, and position
 * against the carina (or, after TAP, against the neocarina).
 */
function potEffect(s: BifState, g: BifGeometry, t: BifTechnique, b: number, len: number, marker: number, stentProxMm: number, find: Find, label = "POT"): string | { refuse: string } {
  const stent = t === "culotte" ? (s.firstBranch === "mv" ? s.mvStent : s.sbStent) ?? s.mvStent : s.mvStent ?? s.sbStent;
  if (!stent?.deployed) return { refuse: "There is no stent in the proximal MV to optimise." };
  const src = t === "tap" ? TAPL : t === "provisional" ? PPOT : t === "culotte" ? CUL : DK;
  if (b > g.proxRefMm + MP_SIZE_TOL_MM + 1e-9) {
    find("pot-oversized", "major", `The ${b} mm ${label} balloon is larger than the ${g.proxRefMm} mm proximal MV: SB compromise becomes more likely.`, PPOT, "debrief");
    if (provisionalFamily(t) && !s.sbStent?.deployed) s.sbCompromised = true;
  } else if (b < g.proxRefMm - MP_SIZE_TOL_MM - 1e-9) find("pot-undersized", "minor", `The ${b} mm ${label} balloon is smaller than the ${g.proxRefMm} mm proximal MV: the proximal stent stays malapposed.`, PPOT, "image");
  for (const st of [s.mvStent, s.sbStent]) {
    if (!st?.deployed || st.crushed) continue;
    if (st.branch === "sb" && t !== "culotte") continue;
    const chk = checkPostDilatation(platformFor(st.platformId), st.nominalMm, b);
    if (chk.over) find("pot-over-limit", "major", `${b} mm is beyond the ${chk.limitMm} mm labelled limit of the ${st.nominalMm} mm stent: it is overstretched and deformed.`, "cp-bifurcation-provisional-setup; cp-left-main-technique");
  }
  if (marker - len < -stentProxMm - 1e-9) find("pot-too-long", "major", `The ${len} mm ${label} balloon reaches beyond the stent's proximal edge into unstented vessel.`, PPOT, "image");
  // TAP's final POT stops just short of the neocarina, which stands proximal to the carina by the protrusion
  if (t === "tap" && s.neocarinaMm > 0) {
    const neo = -s.neocarinaMm;
    if (marker > neo + 1e-9) {
      find("neocarina-crushed", "major", `The ${label} balloon's distal marker went ${(marker - neo).toFixed(1)} mm past the neocarina: it crushes the protruding SB struts.`, TAPL, "image");
      s.neocarinaMm = Math.max(0, s.neocarinaMm * MP_NEOCARINA_CRUSH_FACTOR);
      s.sbCoverage = Math.min(1, s.sbCoverage + MP_TAP_SB_FIRST_COVERAGE);
    }
    s.proxD = Math.max(s.proxD, Math.min(b, g.proxRefMm + MP_SIZE_TOL_MM));
    if (marker >= neo - MP_POT_PROXIMAL_TOL_MM - 1e-9) s.oval = 1;
    s.potCount += 1;
    return `${label} with a ${b} mm balloon, distal marker ${marker} mm from the carina.`;
  }
  if (marker > MP_CARINA_BEYOND_TOL_MM + 1e-9) {
    // beyond the carina: corrects the proximal shape but stretches the distal MV and may compromise the SB
    s.distalMaxD = Math.max(s.distalMaxD, b);
    if (b > g.distRefMm + MP_SIZE_TOL_MM + 1e-9) find("distal-overstretch", "major", `The ${b} mm ${label} balloon's distal marker sits ${marker} mm beyond the carina: it overstretches the ${g.distRefMm} mm ${g.distName}.`, PPOT, "image");
    if (provisionalFamily(t) && !s.sbStent?.deployed) {
      s.sbCompromised = true;
      s.sbCoverage = Math.min(1, s.sbCoverage + MP_POT_BEYOND_COVERAGE);
    }
    s.oval = 1;
    s.proxD = Math.max(s.proxD, Math.min(b, g.proxRefMm + MP_SIZE_TOL_MM));
  } else if (marker < -MP_POT_PROXIMAL_TOL_MM - 1e-9) {
    // too proximal: the stent next to the SB ostium stays as it was
    find("pot-too-proximal", "minor", `The distal marker sat ${-marker} mm proximal to the carina: the stent stays underexpanded right next to the SB ostium.`, PPOT, "image");
  } else {
    s.oval = 1;
    s.proxD = Math.max(s.proxD, Math.min(b, g.proxRefMm + MP_SIZE_TOL_MM));
  }
  s.potCount += 1;
  return `${label} with a ${b} mm balloon, distal marker ${marker} mm from the carina.`;
}

function pot(s: BifState, g: BifGeometry, t: BifTechnique, step: TechniqueStep, inp: StepInput, find: Find): string | { refuse: string } {
  const b = inp.balloonMm ?? g.proxRefMm;
  const len = inp.balloonLenMm ?? 8;
  const marker = inp.markerMm ?? 0;
  const stent = t === "culotte" ? ((s.firstBranch === "mv" ? s.mvStent : s.sbStent) ?? s.mvStent) : s.mvStent;
  const proxMm = t === "culotte" ? Math.max(stent?.proxMm ?? 0, s.secondProxMm) : stent?.proxMm ?? 0;
  return potEffect(s, g, t, b, len, marker, proxMm, find);
}

function finalAssessment(s: BifState, g: BifGeometry, t: BifTechnique, step: TechniqueStep, find: Find): string {
  if (t === "provisional" && s.sbCompromised) find("sb-left-compromised", "minor", `The ${g.sbName} is still compromised at the end of the provisional sequence: escalate to an SB stent (TAP or reverse crush) or accept the result.`, PSB, "image");
  if (t === "culotte" && s.kisses === 0) find("double-layer-underexpanded", "major", "No kiss after the second stent: the double layer may stay under-expanded.", CUL);
  if (t === "dk-crush" && s.kisses < 2) find("step-skipped", "major", "DK crush needs both kisses.", DK);
  // a final POT is a step of provisional (4b), DK crush and TAP; in culotte it is optional (Brilakis step 10)
  if (s.oval > MP_ROUND_OVAL_INDEX + 1e-9 && s.kisses > 0 && t !== "culotte") find("step-skipped", "minor", `The proximal stent is left oval (index ${s.oval.toFixed(2)}): a final POT after the kiss corrects it.`, PPOT, "image");
  return "Final assessment done.";
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

export interface BifMetrics {
  /** SB ostial metal coverage (%) */
  sbOstiumMetalPct: number;
  /** proximal stent at the carina: major / minor diameter (1 = round) */
  ovalIndex: number;
  neocarinaMm: number;
  doubleLayerMm: number;
  /** proximal stent mean diameter and its gap to the wall (mm) */
  proxStentMm: number;
  proxMalappositionMm: number;
  /** largest diameter in the distal MV over its reference (%) */
  distalStretchPct: number;
  finetMm: number | null;
  sbCompromised: boolean;
}

export function bifMetrics(s: BifState): BifMetrics {
  const g = geometryOf(s);
  const proxStentMm = s.mvStent?.deployed || s.sbStent?.deployed ? s.proxD : 0;
  return {
    sbOstiumMetalPct: Math.round(s.sbCoverage * 100),
    ovalIndex: Math.round(s.oval * 100) / 100,
    neocarinaMm: Math.round(s.neocarinaMm * 10) / 10,
    doubleLayerMm: Math.round(s.doubleLayerMm * 10) / 10,
    proxStentMm: Math.round(proxStentMm * 100) / 100,
    proxMalappositionMm: proxStentMm ? Math.max(0, Math.round(((g.proxRefMm - proxStentMm) / 2) * 100) / 100) : 0,
    distalStretchPct: s.distalMaxD ? Math.round((100 * s.distalMaxD) / g.distRefMm) : 0,
    finetMm: s.lastKiss ? Math.round(s.lastKiss.finetMm * 100) / 100 : null,
    sbCompromised: s.sbCompromised,
  };
}

/** The run's result for the logbook: 100 less MP_SCORE_MAJOR per major finding and MP_SCORE_MINOR per minor; a failure scores 0. */
export function bifOutcome(s: BifState): { score: number; passed: boolean; criticalErrors: number; findings: BifFinding[] } {
  const major = s.findings.filter((f) => f.severity !== "minor").length;
  const minor = s.findings.length - major;
  const score = s.failure ? 0 : Math.max(0, 100 - MP_SCORE_MAJOR * major - MP_SCORE_MINOR * minor);
  return { score, passed: !s.failure && major === 0 && isFinished(s), criticalErrors: major, findings: s.findings };
}

/** The findings a live screen may name now: those an operator sees on imaging; all of them once the technique is finished (or in guided mode). */
export function visibleFindings(s: BifState, guided: boolean): BifFinding[] {
  return guided || isFinished(s) || s.failure ? s.findings : s.findings.filter((f) => f.shows === "image");
}

// ---------------------------------------------------------------------------
// Tip context
// ---------------------------------------------------------------------------

/** The bench's tip context: phase and step from the step the learner is at, technique, and the bifurcation's events. */
export function bifTipContext(s: BifState, modality: Modality | null = null): LabContext {
  const g = geometryOf(s);
  const events: LabEvent[] = ["bifurcation"];
  if (g.leftMain) events.push("left-main-lesion");
  // a bail-out run holds the event (the TAP and reverse-crush tips need it at their steps) until the run is over
  if ((s.sbCompromised && provisionalFamily(s.technique)) || (s.compromiseHeld && !isFinished(s))) events.push("side-branch-compromise");
  const dissected = s.findings.some((f) => f.kind === "distal-dissection" || f.kind === "sb-edge-dissection");
  if (dissected) events.push("dissection");
  let phase: LabPhase = "plan";
  let phases: LabPhase[] = [];
  const ctx: LabContext = { lab: "pci", phase, events, vessel: g.vessel };
  if (s.technique) {
    ctx.technique = s.technique;
    const st = shownStep(s);
    if (st) {
      phase = st.phase;
      phases = [...(st.alsoPhases ?? [])];
      ctx.step = st.n;
    } else {
      phase = "imaging";
      ctx.step = stepCount(s.technique);
    }
  }
  if (dissected) phases.push("complication");
  ctx.phase = phase;
  if (phases.length) ctx.phases = phases;
  if (modality) ctx.imaging = tipModality(modality);
  return ctx;
}

/** Every phase, event and technique the bench can report (for the reachability report, once a globbed event source declares it). */
export const BIF_RAISES = {
  lab: "pci" as const,
  phases: [...new Set<LabPhase>(["plan", "complication", ...BENCH_TECHNIQUES.flatMap((t) => techniqueSteps(t).flatMap((st) => [st.phase, ...(st.alsoPhases ?? [])]))])],
  events: ["bifurcation", "left-main-lesion", "side-branch-compromise", "dissection"] as LabEvent[],
  techniques: [...BENCH_TECHNIQUES],
  imaging: ["ivus", "oct"] as ("ivus" | "oct")[],
};

// ---------------------------------------------------------------------------
// Reference runs: the module's choices for each step, used for launch starts and scripted tests
// ---------------------------------------------------------------------------

const NC_SIZES = () => balloonSizes("non-compliant");
const NC_LENGTHS = () => benchBalloonDevice("non-compliant").lengths.slice();
const nearestSize = (sizes: readonly number[], d: number) => sizes.reduce((a, b) => (Math.abs(b - d) < Math.abs(a - d) - 1e-9 ? b : a), sizes[0]);

/** The kissing pair (non-compliant sizes, no larger than each branch) whose Finet diameter is closest to the proximal reference. */
export function bestKissPair(g: BifGeometry): { mv: number; sb: number } {
  let best = { mv: g.distRefMm, sb: g.sbRefMm, err: Infinity };
  for (const mv of NC_SIZES()) for (const sb of NC_SIZES()) {
    if (mv > g.distRefMm + 1e-9 || sb > g.sbRefMm + 1e-9) continue;
    // closest to the proximal reference; between equals, the balloons nearest their own branches
    const err = Math.abs(finetDiameter(mv, sb) - g.proxRefMm) + 0.01 * ((mv - g.distRefMm) ** 2 + (sb - g.sbRefMm) ** 2);
    if (err < best.err) best = { mv, sb, err };
  }
  return { mv: best.mv, sb: best.sb };
}

/** A platform whose limit for a nominal size reaches the proximal MV (the catalogue's when it does). */
function platformReaching(d: number, target: number): PlatformId {
  const list = platformsReaching(d, target);
  return (list.find((p) => p.id === "A") ?? list[0])?.id ?? "A";
}

/** The module's choice at each step of a technique on a preset. */
export function referenceInput(g: BifGeometry, t: BifTechnique, step: TechniqueStep): StepInput {
  const pot: StepInput = { balloonMm: nearestSize(NC_SIZES(), g.proxRefMm), balloonLenMm: Math.min(...NC_LENGTHS()), markerMm: 0 };
  const kissPair = bestKissPair(g);
  const mvD = nearestSize(platformFor("A").diameters, g.distRefMm);
  const sbD = nearestSize(platformFor("A").diameters, g.sbRefMm);
  const mvStent: StepInput = { stentMm: mvD, platformId: platformReaching(mvD, g.proxRefMm), lengthMm: 24, proxMm: 9 };
  switch (step.action) {
    case "park-balloon":
      return { balloonMm: nearestSize(NC_SIZES(), g.distRefMm) };
    case "position-stent":
      if (step.branch === "mv") return mvStent;
      if (t === "tap" && step.id === "deliver-sb-stent") return { stentMm: sbD, platformId: "A", lengthMm: 15 };
      return { stentMm: sbD, platformId: "A", lengthMm: 15, protrusionMm: t === "tap" ? 1.5 : t === "t-stent" ? 0.5 : t === "mini-crush" ? 1.5 : 2.5 };
    case "deploy-stent":
      if (t === "culotte") {
        if (step.id === "first-stent") return { branch: "sb", stentMm: sbD, platformId: platformReaching(sbD, g.proxRefMm), lengthMm: 18, proxMm: 8 };
        return { stentMm: mvD, platformId: platformReaching(mvD, g.proxRefMm), lengthMm: 18, proxMm: 8 };
      }
      if (step.branch === "sb") return { atm: 12, postAtm: 20 };
      return { ...mvStent, atm: 12 };
    case "crush":
      return { balloonMm: nearestSize(NC_SIZES(), g.distRefMm), markerMm: 0, potMm: pot.balloonMm, potLenMm: pot.balloonLenMm, potMarkerMm: -0.5 };
    case "rewire": {
      const c = EXPECTED_CELL[t]?.[step.id] ?? "distal";
      return { cell: c === "either" ? "distal" : c };
    }
    case "branch-balloon":
      return { balloonMm: kissPair.sb };
    case "kiss":
      return { balloonMm: kissPair.mv, sbBalloonMm: kissPair.sb, kiss: "two-step", deflate: "mv-first" };
    case "pot":
      // TAP's final POT stops just short of the neocarina, which stands one protrusion proximal to the carina
      return t === "tap" ? { ...pot, markerMm: -2 } : pot;
    default:
      return {};
  }
}

/** Run a technique's reference inputs from the current step up to (not including) step `untilN`. */
export function runReference(s0: BifState, untilN: number): BifState {
  let s = s0;
  const g = geometryOf(s);
  while (s.technique && s.next < untilN && !isFinished(s) && !s.failure) {
    const st = currentStep(s)!;
    const r = applyStep(s, st.id, referenceInput(g, s.technique, st));
    if (!r.ok) throw new Error(`bifurcation reference run refused at ${s.technique} step ${st.n}: ${r.message}`);
    s = r.state;
  }
  return s;
}

/**
 * The state a launch opens at: the preset, its technique (the plan's first unless named), and a start step
 * (an id, a number, or "technique:step") reached by the module's choices. "plan" (or no start) opens at the
 * technique choice.
 * A bail-out start (a step of TAP or reverse crush on the TAP preset, or the bail-out named as the
 * technique) runs the provisional sequence first and escalates. Null when the preset, technique or step is
 * unknown.
 */
export function bifStartState(presetId: string, opts: { technique?: string | null; start?: string | number | null } = {}): BifState | null {
  if (!isBifPreset(presetId)) return null;
  const g = BIF_BY_ID[presetId];
  const s0 = newBifState(g.id);
  let start = opts.start === undefined || opts.start === null || String(opts.start).trim() === "" ? "plan" : String(opts.start).trim();
  let wanted = opts.technique ? (opts.technique.trim() as BifTechnique) : null;
  // "technique:step" names a step of a technique whose id another technique shares (tap:final-pot)
  const colon = start.indexOf(":");
  if (colon > 0) {
    const t = start.slice(0, colon) as BifTechnique;
    if (wanted && wanted !== t) return null;
    wanted = t;
    start = start.slice(colon + 1);
  }
  const planned = plannedTechniques(g).map((o) => o.technique);
  const preferred = defaultTechnique(g);
  const bailouts = g.techniques.map((o) => o.technique).filter((t) => BAILOUTS.includes(t));
  let bail: BifTechnique | null = null;
  if (wanted && BAILOUTS.includes(wanted)) {
    if (!bailouts.includes(wanted)) return null;
    bail = wanted;
  } else if (!wanted && start !== "plan" && !stepIdOrNumber(preferred, start)) {
    bail = bailouts.find((t) => stepIdOrNumber(t, start) !== undefined && !/^\d+$/.test(start)) ?? null;
  }
  if (bail) {
    const prov = chooseTechnique(s0, "provisional");
    if (!prov.ok) return null;
    const e = escalate(runReference(prov.state, stepCount("provisional")), bail);
    if (!e.ok) return null;
    if (start === "plan") return e.state;
    const target = stepIdOrNumber(bail, start);
    return target === undefined ? null : runReference(e.state, target);
  }
  if (start === "plan" && !wanted) return s0;
  const t = wanted ?? preferred;
  if (!planned.includes(t)) return null;
  const chosen = chooseTechnique(s0, t);
  if (!chosen.ok) return null;
  if (start === "plan") return chosen.state;
  const target = stepIdOrNumber(t, start);
  return target === undefined ? null : runReference(chosen.state, target);
}

function stepIdOrNumber(t: BifTechnique, ref: string): number | undefined {
  if (/^\d+$/.test(ref)) {
    const n = Number(ref);
    return n >= 1 && n <= stepCount(t) ? n : undefined;
  }
  return stepById(t, ref)?.n;
}
