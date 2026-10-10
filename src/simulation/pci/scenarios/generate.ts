// ---------------------------------------------------------------------------
// Resolving a PCI scenario for a run (pci-scenario-registry).
//
// resolveScenario(id, variant) gives the definition, the engine scenario and
// the hidden draws for one run:
//  - no variant: the definition as written;
//  - a ladder variant id (pci-<id>~L3, ~L3 or L3; ~X for held-out exam
//    variants): the competency ladder's own variant from
//    src/content/mentor/catalogue.ts (pciVariantById), applied to the active
//    target lesion with applyPciVariant, so the lab and the logbook agree;
//  - anything else is a seed: the definition as written, with its hidden
//    mechanisms and the engine's random draws following the seed.
// The result is deterministic: the same id, variant and seed give the same
// scenario, draws and seed.
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../../content/lab/tips";
import { applyPciVariant, pciVariantById, type PciVariant } from "../../../content/mentor/catalogue";
import { rnd, rngFrom } from "../rng";
import { pciScenarioDef, scenarioEvents, targetIndex, type RegisteredPciScenario } from "./registry";
import { toPciScenario, type PciRuntimeScenario } from "./legacy";
import type { PciHiddenAxis, PciScenarioDef } from "./types";

export interface ResolvedPciScenario {
  def: RegisteredPciScenario;
  /** the engine scenario (the ladder variant applied to the active target, if any) */
  scenario: PciRuntimeScenario;
  /** the ladder variant, when the variant named one */
  variant: PciVariant | null;
  /** the seed of this run's random draws; undefined keeps the engine's default (pci-<scenario id>) */
  seed?: string;
  /** hidden mechanism id to the value drawn (never shown on live screens; the debrief names them) */
  hidden: Record<string, string>;
  targetIdx: number;
  /** scenario events for the whole run (registry.scenarioEvents) */
  events: LabEvent[];
}

const LADDER_VARIANT = /^(?:pci-([a-z0-9-]+?))?~?([LX]\d+)$/;

/** The full ladder id for a variant of a scenario, or null when `variant` is not a ladder variant id. */
export function ladderVariantId(scenarioId: string, variant: string): string | null {
  const m = LADDER_VARIANT.exec(variant);
  if (!m) return null;
  if (m[1] !== undefined && m[1] !== scenarioId) return null;
  return `pci-${scenarioId}~${m[2]}`;
}

/** Draw each hidden mechanism of a definition from a seed (weighted, deterministic). */
export function drawHidden(axes: readonly PciHiddenAxis[] | undefined, seed: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const ax of axes ?? []) {
    const total = ax.options.reduce((a, o) => a + Math.max(0, o.weight), 0);
    if (!(total > 0)) continue;
    let u = rnd(rngFrom(`${seed}:hidden:${ax.id}`)) * total;
    let pick = ax.options[ax.options.length - 1].value;
    for (const o of ax.options) {
      u -= Math.max(0, o.weight);
      if (u < 0) {
        pick = o.value;
        break;
      }
    }
    out[ax.id] = pick;
  }
  return out;
}

/** The definition with a ladder variant applied to its active target lesion. */
function withVariant(def: PciScenarioDef, v: PciVariant): PciScenarioDef {
  const idx = targetIndex(def);
  return { ...def, lesions: def.lesions.map((l, i) => (i === idx ? { ...l, severity: v.severity, lengthMm: v.lengthMm, position: v.position, calcium: v.calcium } : l)) };
}

/**
 * Resolve a scenario id and an optional variant (ladder variant id or seed) for a run.
 * Throws for an unknown scenario, or a ladder variant id that does not belong to it.
 */
export function resolveScenario(id: string, variant?: string | null, opts: { seed?: string | null } = {}): ResolvedPciScenario {
  const def = pciScenarioDef(id);
  if (!def) throw new Error(`resolveScenario: unknown PCI scenario "${id}"`);
  let v: PciVariant | null = null;
  let seed = opts.seed ?? undefined;
  if (variant) {
    const ladderId = ladderVariantId(id, variant);
    if (ladderId) {
      v = pciVariantById(ladderId) ?? null;
      if (!v || v.base !== id) throw new Error(`resolveScenario: no ladder variant "${variant}" for scenario "${id}"`);
    } else if (LADDER_VARIANT.test(variant)) {
      throw new Error(`resolveScenario: variant "${variant}" belongs to another scenario than "${id}"`);
    } else seed = seed ?? variant;
  }
  const targetIdx = targetIndex(def);
  const applied = v ? withVariant(def, v) : def;
  const base = toPciScenario(applied, targetIdx);
  // applyPciVariant gives the id, title and target the ladder and the logbook use; the extras stay.
  const scenario: PciRuntimeScenario = v ? { ...base, ...applyPciVariant(base, v) } : base;
  const hidden = drawHidden(def.hidden, seed ?? (v ? v.id : `pci-${def.id}`));
  return { def, scenario, variant: v, seed, hidden, targetIdx, events: scenarioEvents(applied, targetIdx) };
}
