// ---------------------------------------------------------------------------
// Shared types of the physical complication engine.
//
// Every complication follows one life cycle (Brilakis: prevent, recognise
// early, treat decisively; docs/reference/BRILAKIS_PRINCIPLES.md):
//   exposure (from the device physics) → seeded hazard draw → prodrome (a cue
//   on the image, the pressure or the patient) → progression if untreated →
//   bail-out actions with effects → treated or resolved.
// The draws use the generator in the state, so a replay of the same actions
// reproduces the same complications.
// ---------------------------------------------------------------------------

import type { RngState } from "../pci/rng";

export type ComplicationKind = "dissection" | "perforation" | "side-branch" | "no-reflow" | "thrombus" | "air";

export type Stage = "prodrome" | "overt" | "treated" | "resolved";

export interface Complication {
  id: string;
  kind: ComplicationKind;
  stage: Stage;
  /** onset, first overt sign, first effective treatment (procedure time, s) */
  t0: number;
  tOvert: number | null;
  tTreated: number | null;
  /** where: route vessels and path position (mm) and extent (mm) */
  route: string[];
  vessel: string;
  atMm: number;
  lengthMm: number;
  /** kind-specific severity 0..1 */
  severity: number;
  /** classification shown in the debrief: NHLBI type, Ellis type, TIMI flow */
  grade: string;
  /** what caused it (for the debrief) */
  cause: string;
  /** kind-specific numbers */
  data: Record<string, number>;
  /** bail-outs applied, in order */
  bailouts: string[];
  /**
   * The learner's structured assessment (pci-cx-recognition): when it was submitted (procedure time, s),
   * what was answered and whether it matched the complication. Absent, null, or a wrong cause: not yet
   * recognised, and the engine keeps every note that names or grades it out of the live log.
   */
  recognised?: Recognition | null;
}

/** What the learner can name as the cause of a change on the image or the monitor. */
export type RecognisedCause = ComplicationKind | "spasm";

/** Where a perforation is (the location asked with the Ellis grade). */
export type PerforationSite = "large-vessel" | "distal" | "collateral";

/**
 * A structured assessment (src/ui/pci/RecognitionForm.tsx): the cause, and the grade the cause asks for
 * (NHLBI type for a dissection, location and Ellis grade for a perforation), the TIMI flow grade, and the
 * flow-failure checklist the learner ticked.
 */
export interface RecognitionAnswer {
  cause: RecognisedCause;
  /** NHLBI A-F (dissection) */
  nhlbi?: string;
  /** Ellis I, II, III or III-CS (perforation) */
  ellis?: string;
  /** perforation location */
  site?: PerforationSite;
  /** TIMI flow grade 0-3 beyond the segment */
  timi?: number;
  /** the flow-failure checklist as ticked: wire kept, two projections or intravascular imaging, pressure, ECG and ACT checked */
  checks?: { wireKept?: boolean; imaged?: boolean; pressureEcgAct?: boolean };
}

/** The score of one assessment against the complication's kind, grade and data. */
export interface RecognitionScore {
  cause: boolean;
  /** NHLBI or Ellis type, when the cause asks for one (null: not asked) */
  grade: boolean | null;
  /** perforation location (null: not asked) */
  site: boolean | null;
  /** TIMI grade (null: not given) */
  timi: boolean | null;
  /** every item asked was right */
  correct: boolean;
  /** the true answers, for the debrief */
  truth: { cause: RecognisedCause; grade: string; site?: PerforationSite; timi: number };
}

export interface Recognition {
  /** procedure time of the submission (s) */
  t: number;
  answer: RecognitionAnswer;
  score: RecognitionScore;
  /** seconds from the first sign (onset, or the first overt sign when there was no prodrome) to the assessment */
  delayS: number;
  /** 1 for the first assessment of this complication; a reassessment after a wrong cause counts up */
  attempt?: number;
  /**
   * The first assessment of this complication, kept when a reassessment replaces the record (attempt 2 or
   * more): when it was made, what cause it named and whether it was right. The mentor's metrics score the
   * first assessment, and the debrief shows it.
   */
  first?: { t: number; cause: RecognisedCause; delayS: number; correct: boolean };
}

export interface CxNote {
  t: number;
  id: string;
  kind: ComplicationKind;
  /**
   * "cue": what the operator could see or hear; "event": a change of stage; "effect": a bail-out's result;
   * "label": a text that names or grades a complication the learner has not yet recognised. The engine
   * keeps labels on CxState.labels (debrief data) and returns a neutral cue in their place, so only cue
   * notes of an unrecognised complication reach the live log (pci-cx-recognition).
   */
  type: "cue" | "event" | "effect" | "label";
  tone: "info" | "warn" | "danger" | "good";
  text: string;
}

export interface CxState {
  list: Complication[];
  rng: RngState;
  nextId: number;
  /** air waiting in the guide or manifold (mL), from devices introduced through an open valve */
  guideAirMl: number;
  /** true when the guide has been aspirated and flushed since the valve was last opened */
  aspirated: boolean;
  /**
   * Notes that name or grade a complication before the learner recognised it, in order (type 'label'):
   * debrief data, never the live log. Absent in a state saved before pci-cx-recognition.
   */
  labels?: CxNote[];
  /**
   * Image cues of a complication the learner has not recognised, held until the next contrast run shows
   * the change (a dissection, a perforation or slow flow is not seen on fluoroscopy without contrast):
   * released by an injection (onInjection, releaseHeldCues). Absent in a state saved before.
   */
  heldCues?: CxNote[];
  /** procedure time of the last contrast run through the guide (onInjection), or absent/null when none yet */
  lastRunT?: number | null;
}

export type Bailout =
  | "stent-cover"
  | "prolonged-inflation"
  | "protamine"
  | "covered-stent"
  | "coil"
  | "pericardiocentesis"
  | "ic-adenosine"
  | "ic-verapamil"
  | "ic-nitroprusside"
  | "ic-epinephrine"
  | "aspiration-thrombectomy"
  | "heparin"
  | "gp2b3a"
  | "oxygen"
  | "aspirate-guide"
  | "forceful-saline"
  | "atropine"
  | "pacing"
  | "defibrillation"
  | "rewire-side-branch"
  | "kissing-balloon"
  | "stop-injections";

/** What the complications ask of the patient engine (S9) now. */
export interface PatientEffects {
  occlusions: { id: string; vessel: string; param: number; fraction: number }[];
  noReflow: { vessel: string; param: number; severity: number } | null;
  /** pericardial inflow (mL/s) */
  pericardialMlS: number;
  /** vagal or ischaemic stimulus strength this moment (0..1) for a bradycardic, hypotensive reaction */
  vagal: number;
  /** risk of VF this moment (per second) from air or ischaemia the engine does not model */
  vfPerS: number;
}

/** Inputs from the procedure each step. */
export interface CxContext {
  t: number;
  /** true ACT (s) */
  act: number;
  /** protamine has been given */
  protamine: boolean;
  /** an inflated balloon now: its route span (path mm) and its diameter to the local reference */
  balloon: { route: string[]; fromMm: number; toMm: number; ratio: number } | null;
  /** stents in place: their route spans */
  stents: { route: string[]; fromMm: number; toMm: number; covered: boolean; d: number }[];
  /** devices in the coronary now (wire, balloon, stent delivery): for thrombus formation on equipment */
  devicesIn: boolean;
  /** the patient breathes 100% oxygen */
  oxygen: boolean;
  /** vessel diameter (mm) at a route position, reference (healthy) */
  refDiameterAt: (route: string[], mm: number) => number;
  /** 0..1 position of a route position on its vessel (for occlusions) */
  paramAt: (route: string[], mm: number) => { vessel: string; param: number } | null;
}
