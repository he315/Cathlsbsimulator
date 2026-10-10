// ============================================================================
// CathMaster — core type definitions
// Educational simulation only. Not a medical device.
// ============================================================================

import type { QuizMemory } from "../simulation/srs";
import type { LabEvent } from "../content/lab/tips";
import type { Sex } from "../simulation/patient/patient";

export type Vec3 = { x: number; y: number; z: number };

// ---------------------------------------------------------------------------
// Catheters & wires
// ---------------------------------------------------------------------------

export type CatheterCategory =
  | "diagnostic"
  | "guide"
  | "universal"
  | "pigtail";

export type CoronaryTarget = "left" | "right" | "both" | "root" | "lv";

export type RootSize = "small" | "normal" | "dilated";

export interface CatheterBehaviour {
  /** effective lateral reach of the tip across the root (abstract units ~mm) */
  reach: number;
  /** natural azimuth the preshaped tip points toward, in radians (root frame) */
  naturalAzimuth: number;
  /** natural seating height above the valve plane (abstract units) */
  seatHeight: number;
  /** how strongly torque rotates the tip (0..1) */
  torqueResponse: number;
  /** how strongly advancing lowers the tip / risks prolapse (0..1) */
  pushResponse: number;
  /** tendency to prolapse into LV when advanced (0..1) */
  prolapseTendency: number;
  /** tendency to deep-seat / damp when engaged (0..1) */
  deepEngagementRisk: number;
  /** which coronary this catheter is shaped to find */
  shapedFor: CoronaryTarget;
  /** ideal root size for this catheter */
  idealRootSize: RootSize;
}

export interface CatheterType {
  id: string;
  name: string;
  category: CatheterCategory;
  target: CoronaryTarget;
  curveSize: string;
  support: "low" | "moderate" | "high";
  aggressiveness: "gentle" | "moderate" | "aggressive";
  bestUse: string;
  usualTarget: string;
  bestAnatomy: string;
  badAnatomy: string;
  commonMistakes: string[];
  teachingTips: string[];
  /** one-line "how you seat this catheter" cue shown by the coach before engagement */
  seatCue?: string;
  behaviour: CatheterBehaviour;
}

export interface WireType {
  id: string;
  name: string;
  stiffness: "soft" | "medium" | "stiff";
  tipShape: "J" | "straight" | "angled";
  safetyProfile: "safe" | "moderate" | "risky";
  /** tendency to enter the LV / probe branches (0..1) */
  danger: number;
  teachingTips: string[];
}

// ---------------------------------------------------------------------------
// Anatomy & cases
// ---------------------------------------------------------------------------

export type Dominance = "right" | "left" | "codominant";

export type AccessRoute = "femoral" | "radial-right" | "radial-left";

export type AnatomyVariant =
  | "normal-root"
  | "small-root"
  | "dilated-root"
  | "rotated-root"
  | "horizontal-aorta"
  | "vertical-aorta"
  | "high-rca"
  | "anterior-rca"
  | "superior-rca"
  | "shepherds-crook-rca"
  | "short-lm"
  | "long-lm"
  | "separate-ostia"
  | "ramus"
  | "tortuous-rca"
  | "tortuous-iliac"
  | "tortuous-subclavian"
  | "radial-loop"
  // --- Shared case model (found-case-model-types). These are typed here once
  // for the diagnostic scenarios, the PCI scenario registry and the full case.
  // The random generator's VARIANT_POOL is an explicit list, so none of them
  // appears in a random case until a package adds it there with a low prior.
  // Coronary origin anomalies
  | "anomalous-lcx-right-sinus"
  | "anomalous-lcx-from-rca"
  | "anomalous-rca-left-sinus"
  | "anomalous-lm-right-sinus"
  | "high-ostia"
  | "conus-separate-ostium"
  // Coronary course and termination
  | "myocardial-bridge"
  | "fistula-lad-pa"
  // Aortic root and arch
  | "very-dilated-root"
  | "arteria-lusoria"
  // Iliac and aortic route
  | "iliac-stenosis"
  | "iliac-stent"
  | "iliac-occlusion"
  | "aortic-occlusion"
  | "aaa"
  // Body habitus
  | "tall-patient";

export type PathologyKind =
  | "none"
  | "mild-irregularity"
  | "moderate-stenosis"
  | "severe-stenosis"
  | "critical-lad"
  | "left-main"
  | "ostial-rca"
  | "mid-rca"
  | "lcx-om"
  | "diffuse"
  | "cto"
  | "thrombotic"
  | "calcified"
  | "spasm";

export type VesselId =
  | "LM"
  | "LAD"
  | "LCx"
  | "RCA"
  | "D1"
  | "D2"
  | "OM1"
  | "OM2"
  | "RAMUS"
  | "SEPTAL"
  | "PDA"
  | "PLV"
  | "CONUS"
  | "AM";

/** How the lesion looks and behaves on the angiogram. Absent means the
 *  current behaviour, which renders every lesion as a concentric narrowing. */
export type LesionMorphology = "concentric" | "thrombus" | "spasm" | "scad" | "cto";

/** Spontaneous coronary artery dissection angiographic type, as Brilakis
 *  defines 1, 2A, 2B and 3 (diag-lesion-morphologies renders them). */
export type ScadType = "1" | "2A" | "2B" | "3";

/** Calcium on the PCI engine's model grade 0..2 (0 none, 2 the heaviest), as
 *  coronaryWire.ts and ivus.ts already use it. */
export type CalciumGrade = 0 | 1 | 2;

/** TIMI thrombus grade 0..5 (an occluded vessel is grade 5 until flow is restored). */
export type ThrombusGrade = 0 | 1 | 2 | 3 | 4 | 5;

/** Medina bifurcation class: [proximal main vessel, distal main vessel, side branch],
 *  1 where that segment has a significant narrowing. */
export type MedinaClass = readonly [0 | 1, 0 | 1, 0 | 1];

/** What a lesion is in this case: the planned target, a non-culprit lesion
 *  that may be treated or staged, or a bystander that is only reported. */
export type LesionRole = "target" | "non-culprit" | "bystander";

/** Model scale for channel or vessel tortuosity: 0 straight, 1 moderate, 2 severe. */
export type TortuosityGrade = 0 | 1 | 2;

/** Werner collateral channel grade CC0..CC2 (lab request pm-interpreting). */
export type WernerGrade = 0 | 1 | 2;

/** Rentrop grade 0..3 of collateral filling of the recipient (lab request pm-interpreting). */
export type RentropGrade = 0 | 1 | 2 | 3;

/** A collateral channel from a donor to a recipient vessel (CTO and severe disease). */
export interface CollateralChannel {
  donor: VesselId;
  recipient: VesselId;
  type: "septal" | "epicardial";
  wernerCC: WernerGrade;
  rentrop: RentropGrade;
  tortuosity: TortuosityGrade;
}

/** A side branch at a lesion (bifurcation and branch-ostial lesions). */
export interface LesionSideBranch {
  vessel: VesselId;
  /** angle between the side branch and the distal main vessel, degrees */
  angleDeg: number;
  /** side-branch reference diameter, mm */
  diameterMm: number;
}

/** Chronic total occlusion detail for a lesion with morphology 'cto'. */
export interface LesionCto {
  /** proximal cap shape */
  stump: "tapered" | "blunt";
  /** occluded segment length, mm */
  lengthMm: number;
  collaterals: CollateralChannel[];
}

/** Lipid-rich plaque seen on intravascular imaging. */
export interface LesionLipid {
  /** lipid arc, degrees */
  arcDeg: number;
  /** fibrous cap thickness, micrometres */
  capUm: number;
}

export interface Lesion {
  vessel: VesselId;
  /** 0..1 along the vessel polyline */
  position: number;
  /** percent diameter stenosis 0..100 */
  severity: number;
  kind: PathologyKind;
  /** angiographic lesion length, shoulder to shoulder (mm); a default by kind when absent */
  lengthMm?: number;

  // --- Optional morphology (found-case-model-types). Every field is optional
  // and absent means the current behaviour, so existing cases are unchanged.
  /** 0 concentric .. 1 fully eccentric lumen; projected severity then depends on the view */
  eccentricity?: number;
  /** direction of the eccentric plaque about the vessel axis, degrees */
  orientationDeg?: number;
  /** reference diameter fall across the lesion, proximal minus distal reference (mm) */
  taperMm?: number;
  /** 0..1 along the lesion, proximal to distal shoulder, where a side branch leaves
   *  (the branch is described by sideBranch when present) */
  branchAt?: number;
  morphology?: LesionMorphology;
  /** a narrowing that relieves with intracoronary nitrate (spasm) */
  nitrateResponsive?: boolean;
  /** with morphology 'scad' */
  scadType?: ScadType;
  calcium?: CalciumGrade;
  /** calcium arc on intravascular imaging, degrees */
  calciumArcDeg?: number;
  thrombusGrade?: ThrombusGrade;
  lipid?: LesionLipid;
  /** scenario events this lesion raises when it is the active target
   *  (for example 'cto', 'bifurcation', 'aorto-ostial-lesion', 'branch-ostial-lesion') */
  sites?: LabEvent[];
  medina?: MedinaClass;
  sideBranch?: LesionSideBranch;
  role?: LesionRole;
  /** with morphology 'cto' */
  cto?: LesionCto;
}

// ---------------------------------------------------------------------------
// Bypass grafts
// ---------------------------------------------------------------------------

export type GraftConduit = "svg" | "radial" | "lima" | "rima";

export type GraftStatus = "patent" | "diseased" | "occluded";

/** Where a graft's proximal end arises. Aortic sites lie on the anterior
 *  ascending aorta: circumflex grafts highest, LAD and diagonal grafts just
 *  above the left ostium, RCA grafts lowest and anterior (Oxford's usual
 *  order, lab request cp-prior-cabg). In situ mammary grafts arise from the
 *  subclavian; a composite graft arises from another graft. */
export type GraftProximalSite =
  | "aorta-high"
  | "aorta-mid"
  | "aorta-low"
  | "left-subclavian"
  | "right-subclavian"
  | "composite";

/** A further distal anastomosis of a sequential (jump) graft. */
export interface GraftAnastomosis {
  target: VesselId;
  /** 0..1 along the target vessel polyline */
  position: number;
}

export interface Graft {
  /** stable id within the case, when a package needs to refer to one graft */
  id?: string;
  conduit: GraftConduit;
  /** native vessel of the (first) distal anastomosis */
  target: VesselId;
  /** 0..1 along the target vessel polyline of the distal anastomosis */
  position: number;
  proximalSite: GraftProximalSite;
  status: GraftStatus;
  /** a radio-opaque ring marker at the aortic anastomosis */
  ringMarker: boolean;
  /** further distal anastomoses of a sequential graft, in order */
  sequential?: GraftAnastomosis[];
}

// ---------------------------------------------------------------------------
// Case chart (the patient record a case carries)
// ---------------------------------------------------------------------------

/** Same values as Sex in src/simulation/patient/patient.ts, reused so the two cannot drift. */
export type ChartSex = Sex;

export type ChartValve = "aortic" | "mitral" | "tricuspid" | "pulmonary";

export interface ChartValveFinding {
  valve: ChartValve;
  lesion: "stenosis" | "regurgitation";
  severity: "mild" | "moderate" | "severe";
}

export interface ChartEcho {
  /** LV ejection fraction, % */
  lvef?: number;
  valves?: ChartValveFinding[];
  /** free-text report line */
  note?: string;
}

export interface ChartDrug {
  /** drug name as the chart shows it */
  name: string;
  /** formulary id, where the drug has one */
  drugId?: string;
  /** dose as written on the chart */
  dose?: string;
  route?: string;
  /** hours before the procedure start that the last dose was taken; absent if not recorded */
  lastDoseHoursAgo?: number;
  /** the drug has been held for the procedure */
  held?: boolean;
}

export interface ChartAllergies {
  contrast?: "none" | "previous-mild" | "previous-severe";
  other?: string[];
}

export type ChartPregnancyStatus =
  | "not-applicable"
  | "test-negative"
  | "test-not-done"
  | "possible"
  | "pregnant";

export interface ChartPriorProcedure {
  /** what was done, as the chart shows it */
  procedure: string;
  /** days before this case */
  daysAgo: number;
  /** recorded reference air kerma, Gy, if known */
  airKermaGy?: number;
}

export interface ChartArmPressure {
  systolic: number;
  diastolic: number;
}

export interface ChartArrestHistory {
  rhythm?: "vf" | "vt" | "pea" | "asystole" | "unknown";
  witnessed?: boolean;
  /** minutes from arrest to return of spontaneous circulation */
  minutesToRosc?: number;
  note?: string;
}

/** What the patient has consented to. */
export type ChartConsentScope = "diagnostic-only" | "diagnostic-and-ad-hoc-pci" | "planned-pci";

/** A catheter that worked on a previous study of this patient. */
export interface ChartPreviousCatheter {
  target: CoronaryTarget | "graft";
  /** catheter id from the catalogue */
  catheterId: string;
  route?: AccessRoute;
}

/** The patient record a case carries. Only demographics are required; every
 *  other item is shown when present. */
export interface CaseChart {
  /** years */
  ageY: number;
  sex: ChartSex;
  heightCm: number;
  weightKg: number;
  creatinineUmolL?: number;
  /** mL/min/1.73 m2 */
  egfr?: number;
  echo?: ChartEcho;
  drugs?: ChartDrug[];
  allergies?: ChartAllergies;
  pregnancy?: ChartPregnancyStatus;
  priorFluoroProcedures?: ChartPriorProcedure[];
  /** skin findings at previous beam entry sites */
  skinFindings?: string[];
  /** previous cardiac surgery operation note (grafts and their sites) */
  operationNote?: string;
  armPressures?: { left?: ChartArmPressure; right?: ChartArmPressure };
  arrestHistory?: ChartArrestHistory;
  /** id of the 12-lead ECG shown with the chart */
  ecgId?: string;
  consentScope?: ChartConsentScope;
  previousCatheters?: ChartPreviousCatheter[];
}

export interface AnatomyCase {
  id: string;
  name: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  accessRoute: AccessRoute;
  rootSize: RootSize;
  /** degrees the root/ostia are rotated about the aortic axis */
  rootRotationDeg: number;
  /** degrees the ascending aorta tilts (horizontal/vertical variant) */
  aortaTiltDeg: number;
  dominance: Dominance;
  variants: AnatomyVariant[];
  pathology: PathologyKind;
  lesions: Lesion[];
  recommendedCatheters: string[];
  acceptableCatheters: string[];
  requiredViews: string[];
  traps: string[];
  objectives: string[];
  teachingSummary: string;
  // --- Optional shared case model (found-case-model-types); absent on
  // library and generated cases, so they are unchanged.
  /** the named scenario this case was built from */
  scenarioId?: string;
  /** case-wide events, raised for the whole case and gated with TipTrigger.requires */
  events?: LabEvent[];
  chart?: CaseChart;
  grafts?: Graft[];
}

// ---------------------------------------------------------------------------
// Simulation state
// ---------------------------------------------------------------------------

export type EngagementKind =
  | "not-in-root"
  | "ascending-aorta"
  | "sinus-level"
  | "below-valve"
  | "in-lv"
  | "near-lm"
  | "coaxial-lm"
  | "selective-lm"
  | "deep-lm"
  | "near-rca"
  | "coaxial-rca"
  | "selective-rca"
  | "deep-rca"
  | "non-selective"
  | "dangerous";

export interface EngagementState {
  kind: EngagementKind;
  target: CoronaryTarget | null;
  distanceToLm: number;
  distanceToRca: number;
  alignmentLm: number;
  alignmentRca: number;
  tipHeight: number;
  depth: number;
  isSelective: boolean;
  isDeep: boolean;
  isDangerous: boolean;
  /** the tip has over-selected the conus branch (RCA) — injecting here risks VF */
  conus: boolean;
  quality: number; // 0..1 opacification/engagement quality
  message: string;
}

export type PressureKind =
  | "aortic"
  | "lv"
  | "damped"
  | "ventricularised"
  | "wedged"
  | "noisy"
  | "dissected";

export interface PressureState {
  kind: PressureKind;
  systolic: number;
  diastolic: number;
  quality: number; // 0..1 trace stability
  warning: "none" | "caution" | "danger";
  label: string;
}

export type ContrastOutcome =
  | "none"
  | "root-puff"
  | "selective-lca"
  | "selective-rca"
  | "weak"
  | "deep-reflux"
  | "lv-injection";

export interface ContrastResult {
  outcome: ContrastOutcome;
  diagnostic: boolean;
  volume: number;
  filledVessels: VesselId[];
  message: string;
  safety: "ok" | "caution" | "danger";
}

export type MistakeCode =
  | "too-high"
  | "too-low"
  | "lv-entry"
  | "wrong-catheter"
  | "too-much-pushing"
  | "insufficient-withdrawal"
  | "wrong-rotation"
  | "over-rotation"
  | "non-coaxial"
  | "deep-engagement"
  | "damped-injection"
  | "non-selective-injection"
  | "poor-view"
  | "vessel-misid"
  | "excess-fluoro"
  | "excess-contrast"
  | "ignored-pressure-warning"
  | "catheter-changed-early"
  | "catheter-changed-late"
  | "lv-injection"
  | "dissection"
  | "air-embolism"
  | "vf-arrest"
  | "no-aspirate";

export interface SimEvent {
  t: number;
  code: MistakeCode | "engaged" | "diagnostic-injection" | "info";
  message: string;
  context?: string;
}

export interface ScoreState {
  fluoroTime: number; // seconds
  contrastVolume: number; // mL
  injections: number;
  selectiveInjections: number;
  nonSelectiveInjections: number;
  dangerousInjections: number;
  diagnosticInjections: number;
  lvEntries: number;
  dampedEvents: number;
  dissections: number;
  airEmbolisms: number;
  arrhythmias: number;
  successfulEngagements: number;
  hintsUsed: number;
  catheterChanges: number;
  safetyScore: number;
  efficiencyScore: number;
  anatomyScore: number;
  finalScore: number;
}

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type SimMode =
  | "free"
  | "tutorial-lm"
  | "tutorial-rca"
  | "root-drill"
  | "challenge"
  | "case"
  | "exam";

export interface CArm {
  laoRao: number; // negative = RAO, positive = LAO
  cranialCaudal: number; // negative = caudal, positive = cranial
}

// ---------------------------------------------------------------------------
// Curriculum & progress
// ---------------------------------------------------------------------------

export interface CurriculumPhase {
  id: number;
  name: string;
  dayStart: number;
  dayEnd: number;
  focus: string;
  topics: string[];
}

export type DrillKind =
  | "anatomy-warmup"
  | "wire-catheter"
  | "engagement"
  | "view"
  | "pressure-safety"
  | "case"
  | "pathology"
  | "reflection"
  | "challenge";

export interface DrillPlan {
  kind: DrillKind;
  title: string;
  minutes: number;
  target: string;
  section: SectionId;
}

export interface DailySession {
  day: number;
  phase: CurriculumPhase;
  title: string;
  drills: DrillPlan[];
  totalMinutes: number;
  adaptiveNote?: string;
}

export type SectionId =
  | "dashboard"
  | "pathway"
  | "case-studies"
  | "angio-real"
  | "angio-pci"
  | "review"
  | "references"
  | "glossary"
  | "calculators"
  | "haemo"
  | "pci-bench"
  | "physiology"
  | "mcs"
  | "structural-lab"
  | "bedside"
  | "daily"
  | "curriculum"
  | "free"
  | "procedure"
  | "challenge"
  | "anatomy"
  | "catheter-lab"
  | "view-trainer"
  | "pressure-trainer"
  | "atlas"
  | "cases"
  | "pathology"
  | "mistakes"
  | "analytics"
  | "settings";

export type TrainingIntensity = "casual" | "trainee" | "intensive" | "obsessive";

export interface MistakeRecord {
  code: MistakeCode;
  count: number;
  lastSeen: number;
  contexts: string[];
}

export interface CaseAttempt {
  id: string;
  caseId: string;
  caseName: string;
  timestamp: number;
  mode: SimMode;
  score: ScoreState;
  mistakes: MistakeCode[];
  passed: boolean;
}

export interface ProgressProfile {
  createdAt: number;
  level: number;
  xp: number;
  intensity: TrainingIntensity;
  difficulty: Difficulty;
  currentDay: number;
  streak: number;
  lastActiveDate: string; // yyyy-mm-dd
  totalTrainingSeconds: number;
  casesCompleted: number;
  attempts: CaseAttempt[];
  mistakes: Record<string, MistakeRecord>;
  completedDays: number[];
  examResults: Record<string, { best: number; passed: boolean; attempts: number }>;
  spacedRepetition: SrsItem[];
  // --- Academy (curriculum) progress -------------------------------------
  /** lessonId → epoch ms when read */
  lessonsDone: Record<string, number>;
  /** quiz item id → spaced-repetition memory */
  quizMemory: Record<string, QuizMemory>;
  /** case study id → best score and attempts */
  caseRecords: Record<string, { best: number; attempts: number; last: number }>;
  /** simulator key → runs and best score */
  simRecords: Record<string, { runs: number; best: number; last: number }>;
}

export interface SrsItem {
  id: string;
  topic: string;
  section: SectionId;
  ease: number;
  intervalDays: number;
  dueDate: string;
  reps: number;
}

export interface LevelDef {
  level: number;
  title: string;
  requirement: string;
  minCases: number;
  minSafety: number;
}
