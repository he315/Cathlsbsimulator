// ---------------------------------------------------------------------------
// Stent optimisation criteria shared by the PCI lab and the IVUS and OCT bench
// (pci-bench-imaging-unify): pciBench.deploy() and ivusSummary() both judge
// their measures here. The measures themselves come from one geometry (the
// frames' rings are deploy()'s rings), and src/simulation/pci/ivus.test.ts checks
// that the bench's verdicts and its frames' verdicts agree.
//
// Expansion has two definitions, and each caller says which it uses:
//   mean     MSA over the mean of the proximal and distal reference lumen areas
//            (EAPCI 2018, SIM_FACTS §12): ivusSummary's default, the PCI lab's
//   halves   each half of the stent against its nearest reference lumen (the
//            ILUMIEN approach): pciBench.deploy(), and ivusSummary with
//            { expansion: "halves" } for the bench's frames
//
// Thresholds (docs/SIM_FACTS.md §12, EAPCI 2018 consensus, Räber et al.,
// Eur Heart J 2018;39:3281-3300):
//   expansion        relative stent expansion > 80% of the reference
//   MSA              > 5.5 mm² by IVUS, > 4.5 mm² by OCT outside the left main;
//                    > 7 mm² distal left main, > 8 mm² proximal left main (IVUS)
//   malapposition    < 0.4 mm axial distance is tolerated (the consensus frames it
//                    as the tolerable limit, not a trigger)
//   edges            plaque burden < 50% at both stent edges
// ---------------------------------------------------------------------------

import type { ImagingCriterion, Modality, OptimisationSummary } from "./types";

/** Relative stent expansion threshold, % (SIM_FACTS §12). */
export const EXPANSION_MIN_PCT = 80;
/** Minimal stent area outside the left main, mm² (SIM_FACTS §12). */
export const MSA_MIN_MM2: Record<Modality, number> = { IVUS: 5.5, OCT: 4.5 };
/** Minimal stent area in the left main by IVUS, mm² (SIM_FACTS §12; §13 for the 5-6-7-8 data). */
export const MSA_MIN_LM_MM2 = { distal: 7, proximal: 8 } as const;
/** Tolerable acute malapposition, mm axial distance (SIM_FACTS §12). */
export const MALAPPOSITION_MAX_MM = 0.4;
/** Plaque burden at a stent edge, fraction (SIM_FACTS §12). */
export const EDGE_PB_MAX = 0.5;

export interface CriteriaOptions {
  leftMain?: boolean;
  /** which part of the left main the stent treats (default distal) */
  leftMainSegment?: "distal" | "proximal";
  modality: Modality;
}

/** The MSA target for a segment and modality, with the wording the bench shows. */
export function msaTarget(o: CriteriaOptions): { mm2: number; basis: string } {
  if (o.leftMain) {
    const seg = o.leftMainSegment ?? "distal";
    return { mm2: MSA_MIN_LM_MM2[seg], basis: `${seg} left main, IVUS` };
  }
  return { mm2: MSA_MIN_MM2[o.modality], basis: o.modality };
}

/**
 * The four EAPCI criteria for a run's measures. `expansionLabel` lets a caller name the reference its
 * expansion was taken against (the bench uses each half of the stent against its nearest reference).
 */
export function optimisationCriteria(s: OptimisationSummary, o: CriteriaOptions, expansionLabel = "Expansion > 80% of the mean reference lumen area"): ImagingCriterion[] {
  const t = msaTarget(o);
  const edge = Math.max(s.proxEdgePb, s.distEdgePb);
  return [
    { id: "expansion", label: expansionLabel, ok: s.expansionPct > EXPANSION_MIN_PCT, value: s.expansionPct, target: EXPANSION_MIN_PCT },
    { id: "msa", label: `MSA > ${t.mm2} mm² (${t.basis})`, ok: s.msa > t.mm2, value: s.msa, target: t.mm2 },
    { id: "malapposition", label: `Malapposition < ${MALAPPOSITION_MAX_MM} mm`, ok: s.maxMalappositionMm < MALAPPOSITION_MAX_MM, value: s.maxMalappositionMm, target: MALAPPOSITION_MAX_MM },
    { id: "edge-plaque-burden", label: "Plaque burden < 50% at both edges", ok: edge < EDGE_PB_MAX, value: edge, target: EDGE_PB_MAX },
  ];
}
