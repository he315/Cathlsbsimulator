// ---------------------------------------------------------------------------
// Coronary perforation (Ellis 1994): I extraluminal crater without
// extravasation; II pericardial or myocardial blush; III extravasation through
// a frank (≥ 1 mm) hole, or III cavity spilling into a chamber.
//
// Exposures: wire tip load pushed in small or distal vessels (the commonest
// cause, mostly hydrophilic wires), balloon rupture against calcium, a device
// expanded beyond the vessel wall, post-dilatation beyond the stent's limit.
// Leak: none in type I, slow in II, fast in III, into the pericardium through
// the S9 patient engine (tamponade, then pericardiocentesis); anticoagulation
// keeps it bleeding.
// Bail-outs (Attachaipanich 2026, facts C3): balloon tamponade at or just
// proximal to the hole for 5-10 min at 1:1 and low pressure; heparin reversal
// with protamine once devices are out; a covered stent for a large-vessel
// hole; coil embolisation of a distal-vessel hole; pericardiocentesis for
// tamponade.
// Leak rates, seal rates and draw shapes are MODEL PARAMETERS.
// ---------------------------------------------------------------------------

import { chance, hazardP, rnd, type RngState } from "../pci/rng";
import { balloonAt, newComplication, note, overt, spanCovers, treated } from "./common";
import type { Complication, CxContext, CxNote, CxState } from "./types";

export type EllisType = "I" | "II" | "III" | "III-CS";

/** Leak into the pericardium (mL/s) by type, before anticoagulation — MODEL PARAMETERS. */
export const MP_LEAK_II = 0.03;
export const MP_LEAK_III_PER_MM2 = 0.12;
/** Spontaneous sealing rate of type I-II (per s), and seal rates under balloon tamponade (per s) — MODEL PARAMETERS. */
export const MP_SEAL_SPONT = 1 / 240;
export const MP_SEAL_TAMPONADE_SMALL = 1 / 90;
export const MP_SEAL_TAMPONADE_LARGE = 1 / 600;
/** Wire perforation hazard per gf·mm pushed in the danger zone — MODEL PARAMETER. */
export const MP_WIRE_PERF_PER_GFMM = 0.01;

function leakFor(c: Complication): number {
  if (c.grade === "I") return 0;
  if (c.grade === "II") return MP_LEAK_II;
  // frank hole: scales with the hole area (∝ vessel diameter²)
  const d = c.data.vesselD ?? 3;
  return MP_LEAK_III_PER_MM2 * d * d * (c.grade === "III-CS" ? 0.2 : 1);
}

/** Draw a wire perforation from a distal push exposure. */
export function maybeWirePerforation(cx: CxState, t: number, o: { route: string[]; vessel: string; atMm: number; gfMm: number; vesselD: number; hydrophilic: boolean }): { c: Complication | null; notes: CxNote[] } {
  const p = hazardP(MP_WIRE_PERF_PER_GFMM, o.gfMm);
  if (!chance(cx.rng, p)) return { c: null, notes: [] };
  const type: EllisType = rnd(cx.rng) < (o.hydrophilic ? 0.55 : 0.3) ? "II" : "I";
  const c = newComplication(cx, t, "perforation", {
    route: o.route,
    vessel: o.vessel,
    atMm: o.atMm,
    lengthMm: 1,
    severity: type === "II" ? 0.4 : 0.15,
    grade: type,
    cause: o.hydrophilic ? "distal wire perforation with a hydrophilic or stiff wire" : "distal wire perforation",
    stage: "prodrome",
    data: { vesselD: o.vesselD, distal: 1, leak: 0 },
  });
  c.data.leak = leakFor(c);
  return { c, notes: [note(t, c, "cue", "warn", type === "I" ? "A tiny contrast crater beyond the wire tip." : "A small blush of contrast beyond the wire tip that does not wash out.")] };
}

/** Draw a perforation from a device inflation. */
export function maybeDevicePerforation(
  cx: CxState,
  t: number,
  o: { route: string[]; vessel: string; atMm: number; ratioToEem: number; rupture: boolean; calcium: 0 | 1 | 2; beyondLimit: boolean; vesselD: number }
): { c: Complication | null; notes: CxNote[] } {
  let p = 0;
  if (o.ratioToEem > 1.1) p += Math.min(0.9, 2.5 * (o.ratioToEem - 1.1));
  if (o.rupture) p += o.calcium === 2 ? 0.45 : o.calcium === 1 ? 0.15 : 0.04;
  if (o.beyondLimit) p += 0.1;
  if (!chance(cx.rng, Math.min(0.97, p))) return { c: null, notes: [] };
  const big = o.ratioToEem > 1.25 || (o.rupture && o.calcium === 2);
  const type: EllisType = big ? (rnd(cx.rng) < 0.12 ? "III-CS" : "III") : rnd(cx.rng) < 0.5 ? "II" : "I";
  const c = newComplication(cx, t, "perforation", {
    route: o.route,
    vessel: o.vessel,
    atMm: o.atMm,
    lengthMm: 2,
    severity: type.startsWith("III") ? 0.9 : type === "II" ? 0.4 : 0.15,
    grade: type,
    cause: o.rupture ? "balloon rupture against calcium" : "device expanded beyond the vessel wall",
    stage: type.startsWith("III") ? "overt" : "prodrome",
    data: { vesselD: o.vesselD, distal: 0, leak: 0 },
  });
  c.data.leak = leakFor(c);
  const notes: CxNote[] = [];
  if (c.stage === "overt") notes.push(note(t, c, "event", "danger", type === "III-CS" ? "A jet of contrast streams from the vessel into a cardiac chamber (Ellis type III, cavity spilling)." : "A jet of contrast streams out of the vessel into the pericardium (Ellis type III perforation)."));
  else notes.push(note(t, c, "cue", "warn", type === "I" ? "A small crater of contrast outside the vessel wall at the treated segment." : "A blush of contrast outside the vessel at the treated segment."));
  return { c, notes };
}

/** Untreated course: leak into the pericardium; I and II may seal or progress; tamponade by a balloon stops the leak. */
export function stepPerforation(c: Complication, dt: number, ctx: CxContext, rng: RngState): CxNote[] {
  if (c.stage === "resolved") return [];
  const notes: CxNote[] = [];
  const tamponade = balloonAt(ctx, c.route, c.atMm);
  // anticoagulation keeps the hole bleeding; protamine halves the leak
  const anticoag = ctx.act > 250 ? 1.2 : ctx.act > 180 ? 1 : 0.7;
  const rev = ctx.protamine ? 0.5 : 1;
  c.data.leak = tamponade ? 0 : leakFor(c) * anticoag * rev;
  if (tamponade) {
    c.data.tamponadeS = (c.data.tamponadeS ?? 0) + dt;
    if (!c.bailouts.includes("prolonged-inflation") && c.data.tamponadeS > 20) c.bailouts.push("prolonged-inflation");
  }
  const large = c.grade.startsWith("III") && !c.data.distal;
  const sealRate = tamponade ? (large ? MP_SEAL_TAMPONADE_LARGE : MP_SEAL_TAMPONADE_SMALL) * (ctx.protamine ? 2 : 1) : c.grade === "III" || c.grade === "III-CS" ? 0 : MP_SEAL_SPONT * (ctx.act > 250 ? 0.5 : 1) * (ctx.protamine ? 2 : 1);
  if (sealRate > 0 && chance(rng, hazardP(sealRate, dt))) {
    treated(c, ctx.t, true);
    c.data.leak = 0;
    notes.push(note(ctx.t, c, "effect", "good", tamponade ? "After prolonged balloon inflation the extravasation has stopped: the perforation is sealed." : "The small extravasation has stopped on its own."));
    return notes;
  }
  // a type I-II hole with continued manipulation or anticoagulation can grow — MODEL PARAMETER rate
  if ((c.grade === "I" || c.grade === "II") && !tamponade && c.stage !== "treated") {
    const grow = (c.grade === "I" ? 1 / 300 : 1 / 600) * (ctx.act > 250 ? 1.3 : 1);
    if (chance(rng, hazardP(grow, dt))) {
      c.grade = c.grade === "I" ? "II" : "III";
      c.severity = c.grade === "II" ? 0.4 : 0.8;
      c.data.leak = leakFor(c);
      if (overt(c, ctx.t)) {
        /* became overt */
      }
      notes.push(note(ctx.t, c, "event", "danger", c.grade === "II" ? "The contrast blush outside the vessel is spreading (Ellis type II)." : "The leak has become a jet (Ellis type III)."));
    }
  }
  return notes;
}

/** Covered stent: seals a large-vessel hole it covers. Coil: seals a distal small-vessel hole. */
export function bailoutPerforation(c: Complication, action: string, t: number, o: { span?: { route: string[]; fromMm: number; toMm: number } }): CxNote[] {
  if (c.stage === "resolved") return [];
  if (action === "covered-stent" && o.span && spanCovers(o.span.route, o.span.fromMm, o.span.toMm, c.route, c.atMm - 1, c.atMm + 1, 1)) {
    c.bailouts.push("covered-stent");
    treated(c, t, true);
    c.data.leak = 0;
    return [note(t, c, "effect", "good", "The covered stent seals the perforation: no further extravasation.")];
  }
  if (action === "coil" && (c.data.distal || (c.data.vesselD ?? 3) < 2.2)) {
    c.bailouts.push("coil");
    treated(c, t, true);
    c.data.leak = 0;
    return [note(t, c, "effect", "good", "Coil embolisation of the distal branch stops the leak (a small territory is sacrificed).")];
  }
  if (action === "coil") return [note(t, c, "effect", "warn", "Coiling is for a distal small-vessel hole; this one needs balloon tamponade and a covered stent.")];
  if (action === "covered-stent") return [note(t, c, "effect", "warn", "The covered stent does not cover the hole.")];
  return [];
}
