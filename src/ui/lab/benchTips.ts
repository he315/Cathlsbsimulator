// ---------------------------------------------------------------------------
// The IVUS and OCT bench's tip context (pci-bench-imaging-unify), in the PCI
// lab's vocabulary (src/content/lab/tips.ts, lab "pci"), so the PCI tips of the
// imaging, preparation, stenting and optimisation lessons appear on the bench
// at the step they apply to.
//
// Phase by step: image before a modality is chosen is "plan", image after it is
// "imaging"; prep "lesion-prep"; stent "stent"; optimise "optimise"; the final
// pullback (assess) "imaging". While a perforation, a dissection or no-reflow
// is present the phase list adds "complication". The modality chosen is
// LabContext.imaging; a left main lesion reports vessel "LM".
//
// Events:
//   from the procedure (BenchEvent kinds):  underexpanded-balloon -> balloon-undilatable,
//     balloon-rupture, perforation, dissection, no-reflow -> no-reflow and slow-flow
//     (a minor no-reflow event, transient slow flow, -> slow-flow only), burr-stall ->
//     slow-flow and burr-deceleration, stent-overdilated -> none yet
//   from the deployed stent (BENCH_RESULT_EVENTS): a stent that opened and then lost diameter
//     (result.underexpansion "recoil", or recoil beyond MP_RECOIL_SIGNIFICANT_MM) -> stent-recoil;
//     an expansion below 80% (SIM_FACTS §12) that is not recoil (a waist that never opened) ->
//     stent-underexpanded. As in the PCI lab's inflation source (src/ui/lab/pciEvents/inflation.ts),
//     a recoiled stent does not also raise stent-underexpanded, so pci-ostial-recoil and
//     pci-ostial-stent-underexpanded are told apart (cp-ostial-troubleshoot, Brilakis 15.1.10).
//   for the whole case (raised from the lesion definition, which the brief states):
//     BenchLesion.flags (bifurcation, aorto-ostial-lesion, in-stent-lesion,
//     scad-suspected, cto), left-main-lesion, calcified-lesion (the brief describes
//     fluoroscopic calcium), and the vessel-size classes of cp-other-complex-vessel-size
//     and cp-other-complex-long-lesions: small-vessel (distal reference lumen under
//     2.5 mm, Brilakis), large-vessel (proximal reference lumen 4.0 mm or more,
//     Brilakis) and long-lesion (over 20 mm: ACC/AHA type C, Oxford Table 8.2;
//     SYNTAX, Brilakis 7.1).
// The vessel size is read from the reference lumen, as the module defines vessel
// size; the plan's design named the proximal EEM, which would class every bench
// segment (EEM 4.1 to 5.6 mm) as large.
//
// `raises` (below) is what the bench can report, derived from every bench lesion (ALL_BENCH_LESIONS:
// the picker's, the measuring presets and the platform presets) and merged with the bifurcation
// bench's declaration (BIF_RAISES, src/simulation/bench/bifurcation.ts), which no globbed file
// declared before; the reachability report (src/content/lab/reachability.test.ts) reads it.
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent, LabPhase, TipVessel } from "../../content/lab/tips";
import type { LabRaises } from "../../content/lab/raisable/waiting";
import { tipModality, type Modality } from "../../simulation/imaging/types";
import { EXPANSION_MIN_PCT } from "../../simulation/imaging/criteria";
import { ALL_BENCH_LESIONS, MP_RECOIL_SIGNIFICANT_MM, preImaging, type BenchEvent, type BenchLesion, type BenchState, type EventKind, type StentResult } from "../../simulation/pciBench";
import { BIF_RAISES } from "../../simulation/bench/bifurcation";

export type BenchStep = "image" | "prep" | "stent" | "optimise" | "assess";
export const BENCH_STEPS: readonly BenchStep[] = ["image", "prep", "stent", "optimise", "assess"];

/** The phase each step reports once the modality is chosen (image before it is "plan"). */
export const BENCH_STEP_PHASE: Record<BenchStep, LabPhase> = { image: "imaging", prep: "lesion-prep", stent: "stent", optimise: "optimise", assess: "imaging" };

/** Vessel size and length classes (cp-other-complex-vessel-size: Brilakis; cp-other-complex-long-lesions: Oxford Table 8.2, Brilakis 7.1). */
export const SMALL_VESSEL_MM = 2.5;
export const LARGE_VESSEL_MM = 4.0;
export const LONG_LESION_MM = 20;

/** The tip events each bench event kind raises. */
export const BENCH_EVENT_TIPS: Record<EventKind, readonly LabEvent[]> = {
  "underexpanded-balloon": ["balloon-undilatable"],
  "balloon-rupture": ["balloon-rupture"],
  perforation: ["perforation"],
  dissection: ["dissection"],
  "no-reflow": ["no-reflow", "slow-flow"],
  "burr-stall": ["slow-flow", "burr-deceleration"],
  // no lab tip event names post-dilatation beyond a stent's limit yet; the bench reports the event and scores it
  "stent-overdilated": [],
};

/**
 * The tip events of one bench event. A minor no-reflow event is transient slow flow (debris from a lipid-rich
 * segment), so it raises slow-flow only; the major post-dilatation no-reflow raises no-reflow as well.
 */
export function benchEventTips(e: Pick<BenchEvent, "kind" | "severity">): readonly LabEvent[] {
  if (e.kind === "no-reflow" && e.severity === "minor") return ["slow-flow"];
  return BENCH_EVENT_TIPS[e.kind];
}

const COMPLICATIONS: readonly LabEvent[] = ["perforation", "dissection", "no-reflow"];

// local copy of TIP_VESSELS so this chunk does not import the curriculum registry
const TIP_VESSEL_IDS: readonly TipVessel[] = ["LM", "LAD", "LCx", "RCA", "SVG", "LIMA", "RIMA", "radial-graft"];

/** The tip vessel of a bench lesion: "LM" for a left main lesion, else the vessel when it is a tip vessel. */
export function benchVessel(l: BenchLesion): TipVessel | undefined {
  if (l.leftMain) return "LM";
  return TIP_VESSEL_IDS.find((v) => v === l.vessel);
}

/** The events the lesion carries for the whole case (scenario properties and size classes). */
export function benchCaseEvents(l: BenchLesion): LabEvent[] {
  const out: LabEvent[] = [...(l.flags ?? [])];
  if (l.leftMain) out.push("left-main-lesion");
  if (l.calcium && l.plaque === "calcified") out.push("calcified-lesion");
  const pre = preImaging(l, "IVUS");
  if (pre.distRefLumen < SMALL_VESSEL_MM) out.push("small-vessel");
  if (pre.proxRefLumen >= LARGE_VESSEL_MM) out.push("large-vessel");
  if (l.endMm - l.startMm > LONG_LESION_MM) out.push("long-lesion");
  return out;
}

/**
 * The tip events the deployed stent itself can raise (beside BENCH_EVENT_TIPS, which is keyed by the
 * procedure's EventKind and stays so): its recoil and its underexpansion.
 */
export const BENCH_RESULT_EVENTS = ["stent-recoil", "stent-underexpanded"] as const satisfies readonly LabEvent[];
export type BenchResultEvent = (typeof BENCH_RESULT_EVENTS)[number];

/** Whether the deployed stent recoiled: the engine's verdict, or a diameter loss beyond MP_RECOIL_SIGNIFICANT_MM. */
export function stentRecoiled(result: Pick<StentResult, "underexpansion" | "recoilMm">): boolean {
  return result.underexpansion === "recoil" || result.recoilMm > MP_RECOIL_SIGNIFICANT_MM;
}

/** The deployed stent's own events: stent-recoil when it recoiled, else stent-underexpanded below 80% expansion. */
export function benchResultEvents(result: Pick<StentResult, "underexpansion" | "recoilMm" | "expansion">): BenchResultEvent[] {
  if (stentRecoiled(result)) return ["stent-recoil"];
  return result.expansion < EXPANSION_MIN_PCT ? ["stent-underexpanded"] : [];
}

/** The events of the procedure so far: the preparation's, and after deployment the stent's, its recoil and its expansion. */
export function benchProcedureEvents(st: BenchState, result: StentResult | null): LabEvent[] {
  const evs: BenchEvent[] = result ? result.events : st.events;
  const out: LabEvent[] = [];
  for (const e of evs) for (const t of benchEventTips(e)) out.push(t);
  if (result) out.push(...benchResultEvents(result));
  return out;
}

/** Every event the bench reports now, each once. The result counts only once the stent is deployed (optimise and assess). */
export function benchEvents(l: BenchLesion, step: BenchStep, st: BenchState, result: StentResult | null): LabEvent[] {
  const deployed = step === "optimise" || step === "assess" ? result : null;
  return [...new Set<LabEvent>([...benchCaseEvents(l), ...benchProcedureEvents(st, deployed)])];
}

/** The bench's tip context at a step. `modality` is null until the learner chooses IVUS or OCT. */
export function benchTipContext(l: BenchLesion, step: BenchStep, st: BenchState, result: StentResult | null, modality: Modality | null): LabContext {
  const phase: LabPhase = step === "image" && !modality ? "plan" : BENCH_STEP_PHASE[step];
  const events = benchEvents(l, step, st, result);
  const ctx: LabContext = { lab: "pci", phase, events };
  if (events.some((e) => COMPLICATIONS.includes(e))) ctx.phases = ["complication"];
  const vessel = benchVessel(l);
  if (vessel) ctx.vessel = vessel;
  if (modality) ctx.imaging = tipModality(modality);
  return ctx;
}

/** What the lesion bench reports: its phases, the procedure's and the stent's events, and every bench lesion's case events. */
export const LESION_BENCH_RAISES: LabRaises = {
  lab: "pci",
  phases: ["plan", "imaging", "lesion-prep", "stent", "optimise", "complication"],
  events: [...new Set<LabEvent>([...Object.values(BENCH_EVENT_TIPS).flat(), ...BENCH_RESULT_EVENTS, ...ALL_BENCH_LESIONS.flatMap(benchCaseEvents)])],
  imaging: ["ivus", "oct"],
};

/**
 * What the bench can report (the reachability report reads this): the lesion bench's declaration, with the
 * case events of the lesions it actually has (every bench lesion, launch presets included), so a class no
 * lesion belongs to is not claimed (small-vessel comes from the small-diagonal lesion), merged with the
 * bifurcation bench's phases, events and techniques (BIF_RAISES).
 */
export const raises: LabRaises = {
  lab: "pci",
  phases: [...new Set<LabPhase>([...LESION_BENCH_RAISES.phases, ...BIF_RAISES.phases])],
  events: [...new Set<LabEvent>([...LESION_BENCH_RAISES.events, ...BIF_RAISES.events])],
  techniques: [...BIF_RAISES.techniques],
  imaging: ["ivus", "oct"],
};
