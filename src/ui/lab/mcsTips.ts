// ---------------------------------------------------------------------------
// The MCS lab's tip context (mcs-console-split-select-and-tips).
//
// mcsTipContext(console, stage, stats, flags) reports what a console is doing
// now, in the shared tip vocabulary (src/content/lab/tips.ts):
//   lab        "mcs"
//   procedures the console's device (iabp, impella, ecmo); "large-bore" while
//              a large-bore device is being inserted (the microaxial pump and
//              VA-ECMO consoles at stage insert); "impella" as well while a
//              microaxial pump vents the LV on the VA-ECMO console
//   phase      the console's stage: select (the device-choice step), insert
//              (cannulae in, circuit not yet running), position (a pump just
//              placed, before it is run up), manage, wean (the learner has
//              begun weaning), complication; "complication" is added as a
//              further phase while a complication event is active
//   events     from the beat statistics and what the console shows: suction
//              (the pump reports it), pump-migration (the placement signal is
//              ventricular, or the pump sits in the aorta), limb-ischaemia (a
//              sustained leg NIRS below 50%, lesson
//              pm-support-devices-ecmo-cannulate), and the patient events of
//              the shared adapter (src/ui/lab/patientEvents.ts: hypotension
//              from the displayed MAP with its hold, VF from the rhythm), or,
//              at the device-choice step, the profile's own (profileEvents in
//              src/simulation/mcs/deviceChoice.ts); a case's own complication:
//              bleeding on the balloon pump console's retroperitoneal-bleed case
//              (lesson pm-support-devices-iabp-run), air while a bubble sits in
//              the arterial side of the cannula joint on the VA-ECMO console's
//              ECPR case (lesson pm-support-devices-ecmo-cannulate)
//
// `raises` (below) is what this lab can report; the reachability report
// (src/content/lab/reachability.test.ts) reads it. Later MCS packages add
// what their insertion, removal and fault stages raise.
//
// Types only from the tip registry, so the lab bundle does not pull the
// curriculum in with it.
// ---------------------------------------------------------------------------

import type { LabContext, LabEvent, LabPhase, LabProcedure } from "../../content/lab/tips";
import type { LabRaises } from "../../content/lab/raisable/waiting";
import type { BeatStats, ImpellaPosition } from "../../simulation/circulation";
import type { PatientVitals } from "./patientEvents";

export type McsConsole = "iabp" | "impella" | "ecmo";
export const MCS_CONSOLES: readonly McsConsole[] = ["iabp", "impella", "ecmo"];

/** The stages of a console run; each is an MCS lab phase of the tip vocabulary. */
export type McsStage = "select" | "insert" | "position" | "manage" | "wean" | "complication";
export const MCS_STAGES: readonly McsStage[] = ["select", "insert", "position", "manage", "wean", "complication"];

/** Leg NIRS below this, sustained, calls for a distal perfusion cannula, % (lesson pm-support-devices-ecmo-cannulate). */
export const LEG_NIRS_ISCHAEMIA = 50;

/** What a console shows beyond the beat statistics. */
export interface McsTipFlags {
  /** patient events from the shared adapter (hypotension with its hold, vf), the profile's at the device-choice step, or the case's complication (bleeding, air) */
  events?: readonly LabEvent[];
  /** the microaxial pump's position, when one is running */
  impellaPosition?: ImpellaPosition;
  /** leg NIRS of the cannulated leg, % */
  legNirs?: number;
  /** a microaxial pump is venting the LV on the VA-ECMO console */
  vent?: boolean;
}

/** Events that put the console in its complication phase as well as its stage. */
export const COMPLICATION_EVENTS: readonly LabEvent[] = ["pump-migration", "limb-ischaemia", "bleeding", "air"];

/** The events present now, from the stats and the console's flags (each once, in a fixed order). */
export function mcsEvents(stats: BeatStats | null, flags: McsTipFlags = {}): LabEvent[] {
  const out: LabEvent[] = [];
  const add = (e: LabEvent) => {
    if (!out.includes(e)) out.push(e);
  };
  for (const e of flags.events ?? []) add(e);
  if (stats?.suction) add("suction");
  if (flags.impellaPosition === "ventricle" || flags.impellaPosition === "aorta") add("pump-migration");
  if (flags.legNirs !== undefined && flags.legNirs < LEG_NIRS_ISCHAEMIA) add("limb-ischaemia");
  return out;
}

/** The tip context of a console now. */
export function mcsTipContext(kind: McsConsole, stage: McsStage, stats: BeatStats | null, flags: McsTipFlags = {}): LabContext {
  const events = mcsEvents(stats, flags);
  const procedures: LabProcedure[] = [kind];
  if (stage === "insert" && kind !== "iabp") procedures.push("large-bore");
  if (kind === "ecmo" && flags.vent) procedures.push("impella");
  const ctx: LabContext = { lab: "mcs", phase: stage as LabPhase, procedures, events };
  if (stage !== "complication" && events.some((e) => COMPLICATION_EVENTS.includes(e))) ctx.phases = ["complication"];
  return ctx;
}

/**
 * The vitals the shared patient-event adapter reads, from a console's beat statistics: the
 * arterial line's mean (the consoles show it), the rate and the rhythm. `t` is the console's
 * model time, so the hypotension hold runs in lab time.
 */
export function mcsVitals(stats: BeatStats | null, rhythm: "sinus" | "vf", hr: number, t: number): PatientVitals {
  const v: PatientVitals = { t, hr, rhythmKind: rhythm === "vf" ? "vf" : "sinus" };
  if (stats) v.art = { sys: stats.sys, dia: stats.dia, mean: stats.map };
  return v;
}

/** What the MCS lab can report (the reachability report reads this). */
export const raises: LabRaises = {
  lab: "mcs",
  phases: MCS_STAGES,
  // patient events: hypotension from the displayed MAP and vf from the rhythm (the shared adapter);
  // the device-choice profiles add ventilated (profileEvents); the balloon pump console's
  // retroperitoneal-bleed case raises bleeding, the VA-ECMO console's arterial bubble raises air
  events: ["hypotension", "vf", "ventilated", "suction", "pump-migration", "limb-ischaemia", "bleeding", "air"],
  procedures: ["iabp", "impella", "ecmo", "large-bore"],
};
