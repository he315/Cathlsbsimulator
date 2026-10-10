// ---------------------------------------------------------------------------
// PCI scenarios: the registered cases, the anatomy case each one builds, and
// the state a named start opens at.
//
// The scenarios come from the registry (src/simulation/pci/scenarios/), which
// scenario packs extend by adding files. PCI_SCENARIOS and SCENARIO_BY_ID are
// the engine-shaped view of it (legacy.ts): the core four are unchanged in
// content, so every existing reader sees what it saw before.
// ---------------------------------------------------------------------------

import type { AnatomyCase, Lesion } from "../../../types";
import { initialPci, log, syncWire, tele, wireOf, type InitOptions, type PciGeom, type PciScenario, type PciState } from "../state";
import { initialGuide } from "../guide";
import { MP_DANGER_D, MP_DANGER_END_MM } from "../coronaryWire";
import { pathTo, radiusAtMm, routeEndMm } from "../geometry";
import { PCI_SCENARIO_DEFS, startOf } from "../scenarios/registry";
import { lesionsOf, toPciScenario, type PciRuntimeScenario } from "../scenarios/legacy";
import { resolveScenario } from "../scenarios/generate";
import type { PciScenarioDef, PciStartDef } from "../scenarios/types";

export type { PciScenario } from "../state";

/** Build the anatomy case for a scenario: every lesion, the dominance, root and variants of its anatomy. */
export function scenarioCase(s: PciScenario): AnatomyCase {
  const r = s as PciRuntimeScenario;
  const lesions: Lesion[] = lesionsOf(r);
  const a = r.anatomy;
  const c: AnatomyCase = {
    id: "pci-" + s.id,
    name: s.title,
    difficulty: s.difficulty,
    accessRoute: r.accessRoute ?? "radial-right",
    rootSize: a?.rootSize ?? "normal",
    rootRotationDeg: 0,
    aortaTiltDeg: 0,
    dominance: a?.dominance ?? "right",
    variants: a ? [...a.variants] : [],
    pathology: s.target.kind,
    lesions,
    recommendedCatheters: [s.guide],
    acceptableCatheters: [...new Set([s.guide, ...(r.guidesAcceptable ?? [])])],
    requiredViews: s.views,
    traps: [],
    objectives: [],
    teachingSummary: s.points.join(" "),
  };
  if (a?.grafts?.length) c.grafts = a.grafts.map((g) => ({ ...g }));
  if (r.defId) c.scenarioId = r.defId;
  if (r.events?.length) c.events = [...r.events];
  return c;
}

/** The registered scenarios the lab offers (held-out exam scenarios excluded), in registry order. */
export const PCI_SCENARIOS: PciScenario[] = PCI_SCENARIO_DEFS.filter((d) => !d.heldOut).map((d) => toPciScenario(d));

export const SCENARIO_BY_ID: Record<string, PciScenario> = Object.fromEntries(PCI_SCENARIOS.map((s) => [s.id, s]));

/**
 * The engine scenario for a lab scenario id: a registered id ('rca-cto'), or a ladder variant id as
 * the lab and resolvePciLaunch name it ('rca-calcified~L3', with or without the 'pci-' prefix), which
 * is not in PCI_SCENARIOS. Undefined for an id the registry and the ladder do not know, so a caller
 * holding only an id never needs a non-null find.
 */
export function pciScenarioById(id: string): PciScenario | undefined {
  const bare = id.replace(/^pci-/, "");
  const known = SCENARIO_BY_ID[bare];
  if (known) return known;
  const [base, rung, ...rest] = bare.split("~");
  if (!base || rest.length) return undefined;
  try {
    return resolveScenario(base, rung ? `~${rung}` : undefined).scenario;
  } catch {
    return undefined;
  }
}

/** What a start needs: the definition, the engine scenario built from it and an optional seed. */
export interface StartRequest {
  def: PciScenarioDef;
  scenario: PciScenario;
  /** a launch seed: the engine's random draws (complications, devices, wire) follow it */
  seed?: string;
}

/** Initial options for a start of a definition (guide position, guide, heparin, seed). */
export function startInitOptions(def: PciScenarioDef, start: PciStartDef, seed?: string): InitOptions {
  const o: InitOptions = { guideEngaged: start.guideEngaged, guide: def.setup.guideDefault, heparinised: def.setup.heparinised ?? true };
  if (seed !== undefined) o.seed = seed;
  return o;
}

/**
 * MODEL PARAMETERS of the 'across' start (where a start state parks the wire, not anatomy or device
 * data): the tip goes this far beyond the distal shoulder, at least MIN_MM beyond it, at least
 * END_MARGIN_MM short of the wire engine's end-of-vessel danger zone, and in a lumen at least
 * LUMEN_MARGIN_MM wider than the engine's danger diameter.
 */
export const MP_START_WIRE = { BEYOND_MM: 30, MIN_MM: 5, END_MARGIN_MM: 5, LUMEN_MARGIN_MM: 0.5 } as const;

/**
 * The state a named start opens at (the definition's default start when `startId` is absent).
 * 'in-guide' starts are initialPci with the start's guide position; an 'across' start then parks the
 * workhorse wire in the true lumen beyond the target lesion, out of the distal danger zone.
 * Throws for a start the definition does not declare.
 */
export function startPci(req: StartRequest, g: PciGeom, startId?: string | null): PciState {
  const start = startOf(req.def, startId);
  if (!start) throw new Error(`startPci: scenario ${req.def.id} has no start "${startId}"`);
  let st = initialPci(req.scenario, startInitOptions(req.def, start, req.seed));
  const french = req.def.setup.french ?? 6;
  if (french !== 6) st = { ...st, guide: initialGuide(st.guide.id, start.guideEngaged, french) };
  if ((start.wire ?? "in-guide") === "across") st = parkWireAcross(st, g);
  return tele(st, "scenario-start", { scenario: req.def.id, start: start.id, phase: start.phase });
}

/** Park the wire beyond the active target lesion (a start state, not an operator action). */
function parkWireAcross(st0: PciState, g: PciGeom): PciState {
  const route = pathTo(g, g.lesion.vessel);
  const end = routeEndMm(g, route);
  const P = MP_START_WIRE;
  const lo = g.lesion.endMm + P.MIN_MM;
  let tip = Math.min(g.lesion.endMm + P.BEYOND_MM, end - MP_DANGER_END_MM - P.END_MARGIN_MM);
  // step back from vessel too small for the tip (the wire engine's distal danger zone)
  while (tip > lo && 2 * radiusAtMm(g, route, tip) < MP_DANGER_D + P.LUMEN_MARGIN_MM) tip -= 1;
  tip = Math.max(lo, tip);
  const w = wireOf({ ...st0, guide: { ...st0.guide, engaged: true } });
  const placed = { ...w, route, tipMm: tip, crossed: true, guideEngaged: true, fold: null, caught: null, subintimal: null, stallMm: 0, tipForceGf: 0, axialN: 0 };
  const st = syncWire(st0, placed);
  return log(st, "info", "Workhorse wire across the lesion with its tip in the distal vessel.");
}
