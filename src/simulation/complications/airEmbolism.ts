// ---------------------------------------------------------------------------
// Coronary air embolism.
//
// Cause: air left in the guide or manifold, most often after a device is
// introduced or exchanged without aspirating and flushing the guide; also a
// ruptured balloon that was not prepared (Suastika 2016; Attachaipanich 2026;
// facts C3). Incidence 0.1-0.3% of catheterisations (Suastika 2016).
// Prodrome: a bubble visible in the manifold or guide hub before the
// injection. Event: round radiolucent bubbles carried distally with the
// contrast; ST elevation, bradycardia, hypotension, AV block and ventricular
// arrhythmias; harm scales with the volume of air (animal data cited by the
// review).
// Bail-outs: 100% oxygen, aspirate through the guide, forceful saline or
// contrast to disperse, atropine and pressors, defibrillation for VF.
// Air volumes, clearance times and the VF risk are MODEL PARAMETERS.
// ---------------------------------------------------------------------------

import { chance, hazardP, normal, type RngState } from "../pci/rng";
import { newComplication, note, treated } from "./common";
import type { Complication, CxContext, CxNote, CxState } from "./types";

/** Air drawn into the guide by one device introduction through an open valve without aspiration (mL, log-normal median) — MODEL PARAMETER. */
export const MP_AIR_PER_INSERT_ML = 0.15;
/** Air from a ruptured unprepared balloon (mL) — MODEL PARAMETER. */
export const MP_AIR_RUPTURE_ML = 0.3;
/** Bubble clearance time constant (s), and the effect of oxygen, aspiration and forceful saline — MODEL PARAMETERS. */
export const MP_AIR_TAU_S = 60;
export const MP_AIR_OXYGEN = 0.5;
/** Volume (mL) for a full occlusion of the territory, and VF risk per second per mL above 0.5 mL — MODEL PARAMETERS. */
export const MP_AIR_FULL_ML = 0.4;
export const MP_AIR_VF_PER_S_PER_ML = 0.01;

/** A device went in through an opened valve: air enters the guide unless it was aspirated since. */
export function deviceIntroduced(cx: CxState, rng: RngState, prepared: boolean): CxNote[] {
  if (cx.aspirated) return [];
  const ml = MP_AIR_PER_INSERT_ML * Math.exp(normal(rng, 0, 0.6)) * (prepared ? 1 : 1.8);
  cx.guideAirMl += ml;
  return [{ t: 0, id: "guide", kind: "air", type: "cue", tone: "warn", text: "A small bubble is visible in the manifold line." }];
}

/** Aspirating and flushing the guide removes air from it. */
export function aspirateGuide(cx: CxState): void {
  cx.guideAirMl = 0;
  cx.aspirated = true;
}

/** An injection carries the guide's air into the coronary. */
export function injectAir(cx: CxState, t: number, o: { route: string[]; vessel: string; side: "left" | "right" }): { c: Complication | null; notes: CxNote[] } {
  if (cx.guideAirMl <= 0.01) return { c: null, notes: [] };
  const ml = cx.guideAirMl;
  cx.guideAirMl = 0;
  const sev = Math.min(1, ml / MP_AIR_FULL_ML);
  const c = newComplication(cx, t, "air", {
    route: o.route,
    vessel: o.vessel,
    atMm: 20,
    lengthMm: 0,
    severity: sev,
    grade: `${ml.toFixed(2)} mL`,
    cause: "air injected from the guide (not aspirated after a device was introduced)",
    stage: "overt",
    data: { ml, bubbleMm: 20, side: o.side === "left" ? 0 : 1 },
  });
  return { c, notes: [note(t, c, "event", "danger", "Round lucent bubbles travel down the vessel with the contrast: air embolism.")] };
}

/** Air from a ruptured balloon that was not prepared. */
export function ruptureAir(cx: CxState, t: number, o: { route: string[]; vessel: string; atMm: number; side: "left" | "right" }): { c: Complication | null; notes: CxNote[] } {
  const ml = MP_AIR_RUPTURE_ML;
  const c = newComplication(cx, t, "air", {
    route: o.route,
    vessel: o.vessel,
    atMm: o.atMm,
    lengthMm: 0,
    severity: Math.min(1, ml / MP_AIR_FULL_ML),
    grade: `${ml.toFixed(2)} mL`,
    cause: "air released from a ruptured balloon that had not been prepared",
    stage: "overt",
    data: { ml, bubbleMm: o.atMm, side: o.side === "left" ? 0 : 1 },
  });
  return { c, notes: [note(t, c, "event", "danger", "Air escapes from the ruptured balloon into the vessel.")] };
}

export function stepAir(c: Complication, dt: number, ctx: CxContext, rng: RngState): CxNote[] {
  if (c.stage === "resolved") return [];
  // bubbles move distally and break up; oxygen speeds nitrogen washout
  const tau = MP_AIR_TAU_S * (ctx.oxygen ? MP_AIR_OXYGEN : 1) * (c.data.dispersed ? 0.35 : 1);
  c.data.ml = c.data.ml * Math.exp(-dt / tau);
  c.data.bubbleMm = (c.data.bubbleMm ?? 20) + dt * 15;
  c.severity = Math.min(1, c.data.ml / MP_AIR_FULL_ML);
  c.grade = `${c.data.ml.toFixed(2)} mL`;
  if (c.data.ml > 0.5 && chance(rng, hazardP(MP_AIR_VF_PER_S_PER_ML * (c.data.ml - 0.5), dt))) c.data.vfFlag = 1;
  if (c.data.ml < 0.01) {
    treated(c, ctx.t, true);
    return [note(ctx.t, c, "effect", "good", "The bubbles have cleared; flow is normal.")];
  }
  return [];
}

export function bailoutAir(c: Complication, action: string, t: number): CxNote[] {
  if (c.stage === "resolved") return [];
  if (action === "oxygen") {
    c.bailouts.push(action);
    if (c.tTreated === null) c.tTreated = t;
    return [note(t, c, "effect", "info", "100% oxygen by mask: nitrogen washes out of the bubbles faster.")];
  }
  if (action === "aspirate-guide") {
    c.bailouts.push(action);
    c.data.ml *= 0.7;
    if (c.tTreated === null) c.tTreated = t;
    return [note(t, c, "effect", "info", "Aspiration through the guide brings back some air.")];
  }
  if (action === "forceful-saline") {
    c.bailouts.push(action);
    c.data.dispersed = 1;
    if (c.tTreated === null) c.tTreated = t;
    return [note(t, c, "effect", "info", "Forceful injections break the bubbles up and push them distally.")];
  }
  if (action === "atropine") {
    c.bailouts.push(action);
    return [note(t, c, "effect", "info", "Atropine for the bradycardia.")];
  }
  // pci-flow-closure: the wire moved through the distal vessel and its side branches breaks the bubbles up (Brilakis, 02-flow-embolism.ts:939)
  if (action === "wire-through-bubbles") {
    c.bailouts.push(action);
    c.data.dispersed = 1;
    if (c.tTreated === null) c.tTreated = t;
    return [note(t, c, "effect", "info", "The wire tip moved through the distal branches breaks the bubbles up.")];
  }
  return [];
}

// ===========================================================================
// pci-flow-closure: the air start (cm-flow-embolism#5).
//
// A bubble enters the RCA after a large balloon was withdrawn without
// aspirating the guide: bradycardia, hypotension and inferior ST elevation
// follow from what the engine already does with air (patientEffects: the
// territory occluded by the bubble, a vagal stimulus). Some air is left in
// the guide, so a second injection before the system has been checked and
// aspirated gives a second air event. The volumes are MODEL PARAMETERS
// (docs/realism/facts/pkg-pci-flow-closure.md).
// ===========================================================================

/** Air in the coronary at the air start, and air still in the guide (mL) — MODEL PARAMETERS. */
export const MP_AIR_START_ML = 0.6;
export const MP_AIR_START_GUIDE_RESIDUAL_ML = 0.15;

/** Seed the air start: a bubble already in the vessel (overt) and residual air in the guide (no draw). */
export function seedAir(cx: CxState, t: number, o: { route: string[]; vessel: string; side: "left" | "right"; ml?: number; residualMl?: number; cause?: string }): { c: Complication; notes: CxNote[] } {
  const ml = o.ml ?? MP_AIR_START_ML;
  const c = newComplication(cx, t, "air", {
    route: o.route,
    vessel: o.vessel,
    atMm: 20,
    lengthMm: 0,
    severity: Math.min(1, ml / MP_AIR_FULL_ML),
    grade: `${ml.toFixed(2)} mL`,
    cause: o.cause ?? "air drawn into the guide when a large balloon was withdrawn without aspirating the guide, injected with the next run",
    stage: "overt",
    data: { ml, bubbleMm: 20, side: o.side === "left" ? 0 : 1 },
  });
  cx.guideAirMl += o.residualMl ?? MP_AIR_START_GUIDE_RESIDUAL_ML;
  cx.aspirated = false;
  return { c, notes: [note(t, c, "event", "danger", "Round lucent bubbles travel down the vessel with the contrast: air embolism.")] };
}

/** Seconds for an air volume to fall below the clearance threshold (stepAir's), with oxygen and dispersal as given. */
export function airClearanceS(ml: number, o: { oxygen?: boolean; dispersed?: boolean } = {}): number {
  const tau = MP_AIR_TAU_S * (o.oxygen ? MP_AIR_OXYGEN : 1) * (o.dispersed ? 0.35 : 1);
  return ml <= 0.01 ? 0 : tau * Math.log(ml / 0.01);
}
