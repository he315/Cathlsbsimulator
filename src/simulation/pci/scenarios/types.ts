// ---------------------------------------------------------------------------
// PCI scenario definitions (pci-scenario-registry).
//
// A PciScenarioDef is the whole case a PCI scenario pack declares: the
// anatomy, every lesion (the shared Lesion type of src/types/index.ts, so a
// lesion means the same thing in the diagnostic lab, the PCI lab and the full
// case), the patient facts, the table set-up, the start states the lab can
// open at, the hidden mechanisms a seed draws, and the teaching points.
//
// Packs live in ./packs/*.ts (each exports `scenarios: PciScenarioDef[]`)
// with an engine-free sibling ./packs/<name>.launch.ts that the launch
// validator and the practice index read. registry.ts discovers both by glob;
// legacy.ts turns a definition into the engine's PciScenario.
//
// This file and the packs import types only, so the competency catalogue
// (src/content/mentor/catalogue.ts) can read the registry without loading an
// engine or the renderer.
// ---------------------------------------------------------------------------

import type { AccessRoute, AnatomyVariant, CalciumGrade, Dominance, Graft, Lesion, RootSize, TortuosityGrade } from "../../../types";
import type { LAB_PHASES, LabEvent } from "../../../content/lab/tips";
import type { EpaId } from "../../../progress/types";

/** A phase of the PCI lab's tip vocabulary (src/content/lab/tips.ts). */
export type PciPhase = (typeof LAB_PHASES)["pci"][number];

/** A lesion of a PCI scenario: the shared Lesion with its length required (the devices are sized to it). */
export type PciLesion = Lesion & { lengthMm: number };

export interface PciAnatomyDef {
  dominance: Dominance;
  rootSize: RootSize;
  /** model scale 0 straight .. 2 severe (the route the devices travel) */
  tortuosity: TortuosityGrade;
  variants: AnatomyVariant[];
  grafts?: Graft[];
}

/**
 * Patient facts that change the case (contrast budget, bleeding, haemodynamics, the plan after the
 * procedure). Every field is optional and absent means the engine's default patient. Each number a
 * pack sets is cited from the module text in a comment or labelled MODEL PARAMETER.
 */
export interface PciPatientDef {
  weightKg?: number;
  /** estimated glomerular filtration rate, mL/min/1.73 m² */
  eGfr?: number;
  singleKidney?: boolean;
  /** contrast already given that day (mL) */
  priorContrastMl?: number;
  plateletTrend?: "stable" | "falling";
  /** SCAI shock stage */
  shockStage?: "A" | "B" | "C" | "D" | "E";
  accessRoute?: AccessRoute;
  /** surgery planned soon after the procedure (shapes the stent and antiplatelet choice) */
  plannedSurgery?: boolean;
}

export interface PciSetupDef {
  /** guide the case opens with (an id of GUIDE_BY_ID in src/simulation/pci/equipment.ts) */
  guideDefault: string;
  /** further guides the attending accepts for this anatomy */
  guidesAcceptable?: string[];
  /** guide size (the engine models 6 and 7 Fr) */
  french?: 6 | 7;
  /** heparin given before the case (default true: the team has anticoagulated) */
  heparinised?: boolean;
  /**
   * the case opens with the guide in the aortic root, to be engaged by the operator. The default
   * start decides where the lab opens; when this is set, that start must agree (its guideEngaged is
   * the opposite) and the registry reports it when not.
   */
  guideInRoot?: boolean;
}

/** Where the wire is when a start state opens. */
export type PciStartWire = "in-guide" | "across";

/** A named start state: where the lab opens the case. */
export interface PciStartDef {
  id: string;
  title: string;
  /** the tip phase the lab is in when it opens here */
  phase: PciPhase;
  guideEngaged: boolean;
  /** default 'in-guide' */
  wire?: PciStartWire;
  /** events the lab keeps active for the run from this start (for example an armed complication) */
  events?: LabEvent[];
}

/**
 * A hidden mechanism a seed draws (for example which complication a lesion is prone to). The lab
 * never shows it on the live screens; the debrief names it.
 */
export interface PciHiddenAxis {
  id: string;
  /** how the debrief names the mechanism */
  label: string;
  /** the values and their relative weights (MODEL PARAMETER unless cited) */
  options: readonly { value: string; weight: number }[];
}

/**
 * What a seeded or ladder variant may change on the target lesion. The ladder in
 * src/content/mentor/catalogue.ts varies severity, length and position for every base; calcium
 * varies only where `calciumGrades` is set.
 */
export interface PciVariantAxes {
  /**
   * The two calcium grades a ladder variant takes: the first 60% of the time, else the second
   * (MODEL PARAMETER). A pair, not a range: [0, 2] never gives grade 1.
   */
  calciumGrades?: readonly [CalciumGrade, CalciumGrade];
}

export interface PciScenarioDef {
  id: string;
  title: string;
  /** clinical vignette (synthetic) */
  brief: string;
  /** the EPA this scenario trains */
  epa: EpaId;
  /** rung 1 of the EPA's PCI ladder (src/content/mentor/catalogue.ts takes the ladder bases from here) */
  ladderBase?: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5;
  side: "left" | "right";
  anatomy: PciAnatomyDef;
  /** every lesion of the case; `target` picks the one treated first */
  lesions: PciLesion[];
  /** index of the active target in `lesions` (default: the lesion with role 'target', else 0) */
  target?: number;
  /** case-wide events (for example 'stemi'), raised for the whole run; lesion events are each lesion's `sites` */
  events?: LabEvent[];
  patient?: PciPatientDef;
  setup: PciSetupDef;
  /** the start states, the first being the default unless `start` names another */
  starts: PciStartDef[];
  start?: string;
  hidden?: PciHiddenAxis[];
  /** equipment cart id (pci-equipment-tray); absent means the full catalogue */
  stock?: string;
  /** recommended working views (view preset ids) */
  views: string[];
  /** what the case teaches */
  points: string[];
  variantAxes?: PciVariantAxes;
}

/** What a scenario pack file in ./packs exports. */
export interface PciPackFile {
  scenarios: PciScenarioDef[];
}

/**
 * Fields the registry adds to the engine's PciScenario (src/simulation/pci/state.ts) so the
 * geometry, the anatomy case and the lab see every lesion. The legacy fields (target, calcium,
 * thrombus) stay the active target: a caller that overrides `target` overrides the target lesion.
 */
export interface PciScenarioExtras {
  /** the registry definition this scenario was built from */
  defId?: string;
  lesions?: PciLesion[];
  targetIdx?: number;
  anatomy?: PciAnatomyDef;
  accessRoute?: AccessRoute;
  /** the definition's further acceptable guides (setup.guidesAcceptable) */
  guidesAcceptable?: string[];
  /** case-wide events of the definition */
  events?: LabEvent[];
}
