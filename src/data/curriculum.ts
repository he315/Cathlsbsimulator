import type { CurriculumPhase, TrainingIntensity } from "../types";

export const PHASES: CurriculumPhase[] = [
  {
    id: 1,
    name: "Orientation & Safety",
    dayStart: 1,
    dayEnd: 14,
    focus: "Cath-lab basics, root and cusp anatomy, the LV danger zone, safe injection.",
    topics: [
      "Cath lab basics",
      "Aorta and root anatomy",
      "Cusp anatomy",
      "Valve plane",
      "Coronary ostia",
      "LV danger zone",
      "Pressure waveform basics",
      "Avoiding unsafe injection",
      "Fluoroscopy orientation",
    ],
  },
  {
    id: 2,
    name: "Aortic Root & Catheter Level",
    dayStart: 15,
    dayEnd: 45,
    focus: "Controlling catheter tip height; stopping at the sinus level; withdraw-and-reassess.",
    topics: [
      "Stopping the wire at the correct root level",
      "Ascending aorta vs root vs LV",
      "Catheter tip height",
      "Coaxiality",
      "Push / pull / torque basics",
      "Why the catheter enters the LV",
      "Withdraw and reassess",
    ],
  },
  {
    id: 3,
    name: "Left Coronary Engagement",
    dayStart: 46,
    dayEnd: 90,
    focus: "Judkins left catheters, root sizing, coaxial left main engagement, damping.",
    topics: [
      "JL3.5 basics",
      "JL4 basics",
      "Small root vs large root",
      "Left main ostium targeting",
      "Avoiding deep left main engagement",
      "Damping recognition",
      "Non-selective vs selective injection",
      "Left coronary angiographic views",
    ],
  },
  {
    id: 4,
    name: "RCA Engagement",
    dayStart: 91,
    dayEnd: 135,
    focus: "Judkins right, RCA ostium orientation, torque + withdrawal, take-off variants.",
    topics: [
      "JR4 basics",
      "RCA ostium orientation",
      "Anterior / superior / high take-off",
      "Clockwise / counter-clockwise torque",
      "Gentle withdrawal technique",
      "Conus branch confusion",
      "Non-selective RCA injection",
      "Damping and ventricularisation",
    ],
  },
  {
    id: 5,
    name: "Fluoroscopy & Projections",
    dayStart: 136,
    dayEnd: 180,
    focus: "How 3D anatomy becomes 2D angiography; standard projections and what they show.",
    topics: [
      "AP / LAO / RAO",
      "Cranial / caudal angulation",
      "LAO caudal (spider)",
      "RAO caudal",
      "RAO cranial",
      "LAO cranial",
      "RCA LAO / RAO views",
      "Identifying vessels from projections",
    ],
  },
  {
    id: 6,
    name: "Coronary Anatomy Mastery",
    dayStart: 181,
    dayEnd: 225,
    focus: "Full vessel map, dominance, ostial locations, take-off angles and variants.",
    topics: [
      "LM / LAD / septals / diagonals",
      "LCx / obtuse marginals",
      "Intermediate / ramus",
      "Dominance",
      "RCA / PDA / PLV",
      "Conus / acute marginal",
      "Common variants",
      "Ostial locations and take-off angles",
    ],
  },
  {
    id: 7,
    name: "Diagnostic Angiography Cases",
    dayStart: 226,
    dayEnd: 270,
    focus: "Complete diagnostic studies: catheter and view choice, opacification, efficiency.",
    topics: [
      "Complete diagnostic studies",
      "Choosing catheters and views",
      "Adequate vs inadequate opacification",
      "Avoiding unnecessary contrast and fluoro",
      "Structured reporting",
      "Identifying missing views",
    ],
  },
  {
    id: 8,
    name: "Difficult Anatomy & Troubleshooting",
    dayStart: 271,
    dayEnd: 315,
    focus: "Dilated/small/horizontal/vertical roots, tortuosity, high take-offs, catheter switching.",
    topics: [
      "Dilated / small aortic root",
      "Horizontal / vertical aorta",
      "Tortuous subclavian / iliac / radial loops",
      "High RCA take-off, anomalous suspicion",
      "Difficult LM engagement",
      "Catheter too small / too large",
      "Switching catheters rationally",
    ],
  },
  {
    id: 9,
    name: "Mastery & Stress Testing",
    dayStart: 316,
    dayEnd: 365,
    focus: "Timed, fluoro-only, no-hint complex cases; complication recognition; final assessment.",
    topics: [
      "Timed full cases",
      "Fluoro-only mode",
      "No anatomy labels, no hints",
      "Complex variants",
      "Complication recognition",
      "Randomised cases and viva questions",
      "Mistake-pattern correction",
      "Final assessment on held-out exam cases",
    ],
  },
];

export const phaseForDay = (day: number): CurriculumPhase =>
  PHASES.find((p) => day >= p.dayStart && day <= p.dayEnd) ??
  PHASES[PHASES.length - 1];

// The old game progression (points, level titles) and the 10-hour schedule
// were removed with the game mechanics (stream S12).
// Progression is now EPA entrustment from the logbook: src/progress/competency.ts.

export const INTENSITY_MINUTES: Record<TrainingIntensity, number> = {
  casual: 20,
  trainee: 60,
  intensive: 180,
  /** retired option: old profiles are migrated to "intensive" */
  obsessive: 180,
};

export const INTENSITY_LABEL: Record<TrainingIntensity, string> = {
  casual: "Light: 20 min a day",
  trainee: "Standard: 60 min a day",
  intensive: "Intensive: 3 h a day",
  obsessive: "Intensive: 3 h a day",
};

/** The options offered in Settings. */
export const INTENSITY_OPTIONS: TrainingIntensity[] = ["casual", "trainee", "intensive"];
