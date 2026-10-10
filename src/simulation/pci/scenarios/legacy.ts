// ---------------------------------------------------------------------------
// From a registry definition to the engine's PciScenario (pci-scenario-registry).
//
// The PCI engine (src/simulation/pci/state.ts and the action modules) reads a
// single target: s.target, s.calcium and s.thrombus. toPciScenario fills them
// from the definition's active target lesion and carries every lesion, the
// anatomy and the access route as PciScenarioExtras, which the geometry
// (pci/geometry.ts) and the anatomy case (actions/scenario.ts) read. The
// legacy fields stay the source of the active target, so a caller that
// overrides `target` (a test, a ladder variant) changes the target lesion.
// ---------------------------------------------------------------------------

import type { PciScenario } from "../state";
import type { PciLesion, PciScenarioDef, PciScenarioExtras } from "./types";
import { targetIndex } from "./registry";

/** The engine's scenario with the registry's extra fields. */
export type PciRuntimeScenario = PciScenario & PciScenarioExtras;

/** A thrombotic lesion: thrombus morphology or a thrombus grade above 0. */
export const lesionHasThrombus = (l: PciLesion): boolean => l.morphology === "thrombus" || (l.thrombusGrade ?? 0) > 0;

/** The engine scenario for a definition, with lesion `idx` (default the definition's target) as the active target. */
export function toPciScenario(def: PciScenarioDef, idx = targetIndex(def)): PciRuntimeScenario {
  const l = def.lesions[idx];
  if (!l) throw new Error(`toPciScenario: ${def.id} has no lesion ${idx}`);
  const s: PciRuntimeScenario = {
    id: def.id,
    title: def.title,
    brief: def.brief,
    side: def.side,
    guide: def.setup.guideDefault,
    target: { vessel: l.vessel, position: l.position, severity: l.severity, lengthMm: l.lengthMm, kind: l.kind },
    calcium: l.calcium ?? 0,
    thrombus: lesionHasThrombus(l),
    views: [...def.views],
    points: [...def.points],
    difficulty: def.difficulty,
  };
  if (l.lipid) s.lipid = true;
  s.defId = def.id;
  s.lesions = def.lesions.map((x) => ({ ...x }));
  s.targetIdx = idx;
  s.anatomy = { ...def.anatomy, variants: [...def.anatomy.variants], ...(def.anatomy.grafts ? { grafts: def.anatomy.grafts.map((g) => ({ ...g })) } : {}) };
  if (def.patient?.accessRoute) s.accessRoute = def.patient.accessRoute;
  if (def.setup.guidesAcceptable?.length) s.guidesAcceptable = [...def.setup.guidesAcceptable];
  if (def.events?.length) s.events = [...def.events];
  return s;
}

/**
 * Every lesion of a runtime scenario as the anatomy sees it now: the stored lesions with the active
 * target taken from the legacy fields (target, calcium), so an override of `target` is honoured.
 * A plain PciScenario (no lesions) gives its single target.
 */
export function lesionsOf(s: PciRuntimeScenario): PciLesion[] {
  const t: PciLesion = { vessel: s.target.vessel, position: s.target.position, severity: s.target.severity, kind: s.target.kind, lengthMm: s.target.lengthMm };
  if (!s.lesions?.length) return [t];
  const idx = s.targetIdx ?? 0;
  return s.lesions.map((l, i) => (i === idx ? { ...l, ...t, calcium: s.calcium } : { ...l }));
}
