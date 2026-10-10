// ---------------------------------------------------------------------------
// Shared intravascular imaging types (pci-bench-imaging-unify).
//
// The PCI lab and the IVUS and OCT bench describe a diseased segment the same
// way, so one frame generator (src/simulation/pci/ivus.ts), one set of
// optimisation criteria (./criteria.ts) and one renderer
// (src/ui/imaging/IntravascularView.tsx) serve both. Engine-free: types and
// small pure helpers only.
// ---------------------------------------------------------------------------

/** Intravascular imaging modality, as the engines and the bench name it (the tip vocabulary uses "ivus" | "oct"). */
export type Modality = "IVUS" | "OCT";
export const MODALITIES: readonly Modality[] = ["IVUS", "OCT"];

/** A calcium deposit along the segment: its extent, arc and thickness at the fullest point. */
export interface Calcium {
  startMm: number;
  lengthMm: number;
  arcDeg: number;
  thicknessMm: number;
  nodule?: boolean;
}

/** A lipid pool: its arc and, where the scenario states it, the fibrous cap thickness (µm). */
export interface LipidPool {
  arcDeg: number;
  capUm?: number;
}

/** Thrombus type as intravascular imaging shows it (OCT: red thrombus attenuates, white thrombus does not). */
export type ThrombusType = "red" | "white";

/** A side branch leaving the imaged segment: its ostium position, its direction and its diameter. */
export interface ImagingSideBranch {
  atMm: number;
  /** direction of the ostium in the cross-section (rad) */
  angle: number;
  diameterMm: number;
}

/**
 * The diseased segment as the frame generator reads it. The PCI lab's calcium grade (0, 1 or 2) and
 * lipid flag are accepted as they are (angioPci.ts and pci/actions/imaging.ts compile unchanged) and
 * mapped onto a Calcium and a LipidPool by normaliseLesion (src/simulation/pci/ivus.ts).
 */
export interface ImagingLesion {
  startMm: number;
  endMm: number;
  /**
   * Plaque burden along the segment (0 … 1). When given, the EEM at a position is the native lumen
   * divided by √(1 − PB), so the lumen and the EEM areas are those of the profile; otherwise the EEM is
   * the healthy reference scaled by the background plaque burden (MP_PB_BACKGROUND).
   */
  pb?: (mm: number) => number;
  /** a calcium deposit, or the PCI lab's calcium grade (0 none, 1 moderate, 2 severe) */
  calcium?: Calcium | 0 | 1 | 2;
  /** a lipid pool, or the PCI lab's lipid flag */
  lipid?: LipidPool | boolean;
  /** thrombus over the lesion, with its type */
  thrombus?: ThrombusType;
}

/** One optimisation criterion with the measured value and the target it was judged against. */
export interface ImagingCriterion {
  id: "expansion" | "msa" | "malapposition" | "edge-plaque-burden";
  label: string;
  ok: boolean;
  /** the measured value (%, mm² or mm; for edge plaque burden the worse edge, as a fraction) */
  value: number;
  /** the threshold the value was compared with, in the same unit */
  target: number;
}

/** What the criteria read from a run: the stent measures and the edge plaque burdens. */
export interface OptimisationSummary {
  /** minimal stent area, mm² */
  msa: number;
  /** expansion against the reference, % */
  expansionPct: number;
  /** largest strut-to-wall distance, mm */
  maxMalappositionMm: number;
  /** plaque burden at the proximal and distal stent edges (0 … 1) */
  proxEdgePb: number;
  distEdgePb: number;
}

/** The tip vocabulary's name for a modality. */
export function tipModality(m: Modality): "ivus" | "oct" {
  return m === "IVUS" ? "ivus" : "oct";
}
