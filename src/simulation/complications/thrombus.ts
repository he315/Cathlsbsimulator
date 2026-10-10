// ---------------------------------------------------------------------------
// Intracoronary thrombus: formation on equipment when anticoagulation is
// inadequate, and embolisation of an existing thrombus into distal twigs when
// the culprit is dilated.
//
// ACT targets 250-300 s with heparin alone (2011 ACCF/AHA/SCAI guideline, via
// S9 facts). Formation is therefore drawn when the ACT is below 250 s with
// devices in the vessel. Inadequate antithrombotic therapy and stent
// under-expansion are listed causes (Attachaipanich 2026). Rates and the
// embolisation draw are MODEL PARAMETERS.
// Bail-outs: aspiration thrombectomy, a heparin bolus (stops new formation),
// a glycoprotein IIb/IIIa inhibitor.
// ---------------------------------------------------------------------------

import { chance, hazardP, rnd, type RngState } from "../pci/rng";
import { newComplication, note, overt, treated } from "./common";
import type { Complication, CxContext, CxNote, CxState } from "./types";

/** Formation rate on equipment below the ACT target (per s, scaled by the ACT deficit) — MODEL PARAMETER. */
export const MP_THROMBUS_FORM_PER_S = 1 / 400;
export const ACT_TARGET_S = 250;

export function stepThrombusFormation(cx: CxState, dt: number, ctx: CxContext, site: { route: string[]; vessel: string; atMm: number }): CxNote[] {
  if (!ctx.devicesIn || ctx.act >= ACT_TARGET_S) return [];
  if (cx.list.some((c) => c.kind === "thrombus" && c.stage !== "resolved")) return [];
  const deficit = Math.min(1, (ACT_TARGET_S - ctx.act) / 130);
  if (!chance(cx.rng, hazardP(MP_THROMBUS_FORM_PER_S * deficit, dt))) return [];
  const c = newComplication(cx, ctx.t, "thrombus", {
    route: site.route,
    vessel: site.vessel,
    atMm: site.atMm,
    lengthMm: 4,
    severity: 0.3,
    grade: "filling defect",
    cause: `thrombus on the equipment with the ACT at ${Math.round(ctx.act)} s`,
    stage: "prodrome",
  });
  return [note(ctx.t, c, "cue", "warn", "A new hazy filling defect on the wire at the treated segment.")];
}

/** Growth and embolisation of a thrombus (per s) — MODEL PARAMETERS. */
export const MP_THROMBUS_GROW_PER_S = 1 / 120;

export function stepThrombus(c: Complication, dt: number, ctx: CxContext, rng: RngState): CxNote[] {
  if (c.stage === "resolved" || c.stage === "treated") return [];
  const notes: CxNote[] = [];
  const rate = MP_THROMBUS_GROW_PER_S * (ctx.act < ACT_TARGET_S ? 1 : 0.2);
  if (chance(rng, hazardP(rate, dt))) {
    c.severity = Math.min(1, c.severity + 0.25);
    if (c.severity >= 0.8 && !c.data.embolised) {
      c.data.embolised = 1;
      c.grade = "distal embolisation";
      overt(c, ctx.t);
      notes.push(note(ctx.t, c, "event", "danger", "Thrombus has embolised: distal branches are cut off and flow slows."));
    } else notes.push(note(ctx.t, c, "cue", "warn", "The filling defect is growing."));
  }
  return notes;
}

/** Embolisation of the culprit's own thrombus by a dilatation (overt at once). */
export function maybeEmbolisation(cx: CxState, t: number, o: { route: string[]; vessel: string; atMm: number; thrombus: boolean; ratio: number; aspirated: boolean }): { c: Complication | null; notes: CxNote[] } {
  if (!o.thrombus) return { c: null, notes: [] };
  if (cx.list.some((c) => c.kind === "thrombus" && c.data.embolised && c.stage !== "resolved")) return { c: null, notes: [] };
  const p = Math.min(0.8, 0.25 * (o.ratio >= 0.8 ? 1.5 : 1) * (o.aspirated ? 0.5 : 1));
  if (!chance(cx.rng, p)) return { c: null, notes: [] };
  const c = newComplication(cx, t, "thrombus", {
    route: o.route,
    vessel: o.vessel,
    atMm: o.atMm + 20 + 15 * rnd(cx.rng),
    lengthMm: 2,
    severity: 0.8,
    grade: "distal embolisation",
    cause: "thrombus embolised distally by the dilatation",
    stage: "overt",
    data: { embolised: 1 },
  });
  return { c, notes: [note(t, c, "event", "danger", "A distal branch is abruptly cut off after the dilatation: embolised thrombus.")] };
}

export function bailoutThrombus(c: Complication, action: string, t: number, rng: RngState): CxNote[] {
  if (c.stage === "resolved") return [];
  if (action === "aspiration-thrombectomy") {
    c.bailouts.push(action);
    if (chance(rng, c.data.embolised ? 0.5 : 0.8)) {
      treated(c, t, true);
      return [note(t, c, "effect", "good", c.data.embolised ? "Aspiration retrieves the embolus; the branch fills again." : "Aspiration removes the thrombus.")];
    }
    c.severity = Math.max(0.2, c.severity - 0.3);
    if (c.tTreated === null) c.tTreated = t;
    return [note(t, c, "effect", "info", "Some thrombus is aspirated; a residual defect remains.")];
  }
  // pci-flow-closure: an embolised thrombus responds to a GP IIb/IIIa inhibitor or cangrelor (Brilakis 5.5, 25.2)
  if ((action === "gp2b3a" || action === "cangrelor") && c.data.embolised) return antiplateletOnEmbolus(c, action, t);
  if (action === "heparin" || action === "gp2b3a" || action === "cangrelor") {
    c.bailouts.push(action);
    if (c.tTreated === null) c.tTreated = t;
    if (c.stage !== "overt") c.stage = "treated";
    return [note(t, c, "effect", "info", action === "heparin" ? "Heparin given: the thrombus stops growing." : action === "cangrelor" ? "Cangrelor given: the thrombus stops growing." : "Glycoprotein IIb/IIIa inhibitor given: the thrombus stops growing.")];
  }
  return [];
}

// ===========================================================================
// pci-flow-closure: embolised thrombus and the thrombotic closure start.
// ===========================================================================

/** Severity an IV antiplatelet agent removes from an embolised thrombus, and below which it has cleared — MODEL PARAMETERS. */
export const MP_EMBOLUS_ANTIPLATELET_CUT = 0.4;
export const MP_EMBOLUS_CLEARED = 0.35;

/** A GP IIb/IIIa inhibitor or cangrelor on an embolised thrombus: the platelet-rich embolus shrinks and the branch fills again. */
function antiplateletOnEmbolus(c: Complication, action: string, t: number): CxNote[] {
  c.bailouts.push(action);
  if (c.tTreated === null) c.tTreated = t;
  c.severity = Math.max(0, c.severity * (1 - MP_EMBOLUS_ANTIPLATELET_CUT));
  if (c.severity < MP_EMBOLUS_CLEARED) {
    treated(c, t, true);
    return [note(t, c, "effect", "good", "The embolised thrombus clears; the branch fills again.")];
  }
  c.stage = "treated";
  return [note(t, c, "effect", "good", "The cut-off branch begins to fill again.")];
}

/**
 * Seed an occlusive thrombus at the treated segment for a start state (no draw): thrombosis on the equipment
 * with a low ACT, embolised so that the vessel is closed beyond it (overt at once).
 */
export function seedThrombosis(cx: CxState, t: number, o: { route: string[]; vessel: string; atMm: number; act: number }): { c: Complication; notes: CxNote[] } {
  const c = newComplication(cx, t, "thrombus", {
    route: o.route,
    vessel: o.vessel,
    atMm: o.atMm,
    lengthMm: 6,
    severity: 0.9,
    grade: "distal embolisation",
    cause: `thrombosis at the treated segment with the ACT at ${Math.round(o.act)} s`,
    stage: "overt",
    data: { embolised: 1 },
  });
  return { c, notes: [note(t, c, "event", "danger", "The vessel is cut off at the treated segment by thrombus.")] };
}
