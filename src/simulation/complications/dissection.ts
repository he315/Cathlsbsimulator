// ---------------------------------------------------------------------------
// Coronary dissection: a false lumen beside the true lumen.
//
// Exposures: balloon or stent to artery ratio (> 1.2 is a listed procedural
// risk factor), high pressure against calcium, a stent edge landing in
// plaque, dilating over a subintimal wire, a deep-seated or non-coaxial guide
// with forceful injection (Attachaipanich 2026, facts C3).
// Classification: NHLBI A-F (A radiolucency, B double lumen, C persistent
// extraluminal stain, D spiral, E persistent filling defect, F occlusion).
// Progression: forceful injections and devices pushed through the flap extend
// it; an unstented C-D dissection can become flow-limiting (E, F).
// Bail-out: a stent across the whole dissection seals it; stop forceful
// injections.
// Probabilities and rates are MODEL PARAMETERS.
// ---------------------------------------------------------------------------

import { chance, rnd, type RngState } from "../pci/rng";
import { newComplication, note, overt, spanCovers, spanOverlap, treated } from "./common";
import type { Complication, CxContext, CxNote, CxState } from "./types";

export const NHLBI = ["A", "B", "C", "D", "E", "F"] as const;
export type NhlbiType = (typeof NHLBI)[number];

/** Probability of a dissection after an inflation — MODEL PARAMETER shape. */
export function dissectionRisk(o: { ratio: number; calcium: 0 | 1 | 2; atm: number; waist: boolean; edgeInPlaque: boolean; subintimalWire: boolean; inLesion: boolean }): number {
  if (o.subintimalWire) return 1;
  let p = o.inLesion ? 0.03 : 0.01;
  p += 1.6 * Math.max(0, o.ratio - 1.1) * (1 + 0.5 * o.calcium);
  if (o.ratio > 1.2) p += 0.25;
  if (o.calcium === 2 && o.waist && o.atm >= 16) p += 0.35;
  if (o.edgeInPlaque) p += 0.3;
  return Math.max(0, Math.min(0.97, p));
}

function typeIndex(t: string): number {
  return Math.max(0, NHLBI.indexOf(t as NhlbiType));
}

/** Flow-limiting fraction of a dissection type (for occlusion and the patient) — MODEL PARAMETER. */
export function flowLimit(type: string): number {
  return [0, 0, 0.1, 0.35, 0.7, 1][typeIndex(type)];
}

/** Draw a dissection after an inflation. */
export function maybeDissection(
  cx: CxState,
  t: number,
  o: { route: string[]; vessel: string; atMm: number; lengthMm: number; ratio: number; calcium: 0 | 1 | 2; atm: number; waist: boolean; edgeInPlaque: boolean; subintimalWire: boolean; inLesion: boolean; cause: string }
): { c: Complication | null; notes: CxNote[] } {
  const p = dissectionRisk(o);
  if (!chance(cx.rng, p)) return { c: null, notes: [] };
  // severity of the tear: worse with oversizing, calcium and a subintimal wire
  const sev = Math.min(1, 0.25 + 1.4 * Math.max(0, o.ratio - 1.05) + 0.2 * o.calcium + (o.subintimalWire ? 0.6 : 0) + 0.25 * rnd(cx.rng));
  const type: NhlbiType = o.subintimalWire ? "D" : sev > 0.85 ? "D" : sev > 0.6 ? "C" : sev > 0.4 ? "B" : "A";
  const c = newComplication(cx, t, "dissection", {
    route: o.route,
    vessel: o.vessel,
    atMm: o.atMm,
    lengthMm: o.subintimalWire ? Math.max(15, o.lengthMm * 1.5) : Math.max(4, o.lengthMm * (0.5 + 0.6 * sev)),
    severity: sev,
    grade: type,
    cause: o.cause,
    stage: typeIndex(type) >= 2 ? "overt" : "prodrome",
    data: { stain: typeIndex(type) >= 2 ? 1 : 0 },
  });
  const notes: CxNote[] = [];
  if (c.stage === "prodrome") notes.push(note(t, c, "cue", "warn", "A faint linear lucency and haziness at the dilated segment."));
  else notes.push(note(t, c, "event", "danger", `Contrast stays outside the lumen after the run: a dissection (NHLBI type ${type}).`));
  return { c, notes };
}

/** Ostial dissection from a deep or non-coaxial guide with a forceful injection. */
export function maybeGuideDissection(cx: CxState, t: number, o: { side: "left" | "right"; depthMm: number; coaxial: number; forceful: boolean; vessel: string }): { c: Complication | null; notes: CxNote[] } {
  const p = (o.forceful ? 0.02 : 0.004) * (1 + 1.5 * Math.max(0, o.depthMm - 2)) * (1 + 2 * Math.max(0, 0.6 - o.coaxial));
  if (!chance(cx.rng, p)) return { c: null, notes: [] };
  const c = newComplication(cx, t, "dissection", {
    route: [o.vessel],
    vessel: o.vessel,
    atMm: 3,
    lengthMm: 6,
    severity: 0.6,
    grade: "C",
    cause: "guide catheter: deep or non-coaxial engagement with a forceful injection",
    stage: "overt",
    data: { stain: 1, ostial: 1 },
  });
  return { c, notes: [note(t, c, "event", "danger", "Contrast hangs at the ostium after the injection: an ostial dissection from the guide.")] };
}

/** A forceful injection or a device pushed through the flap extends it. */
export function propagate(c: Complication, t: number, rng: RngState, o: { psi?: number; device?: boolean }): CxNote[] {
  if (c.stage === "treated" || c.stage === "resolved") return [];
  const notes: CxNote[] = [];
  const force = o.device ? 0.5 : Math.max(0, ((o.psi ?? 0) - 80) / 150);
  // pci-flow-closure: an aortocoronary dissection's stain in the sinus grows with every injection into the vessel
  if (c.data.aortic && !o.device) notes.push(...growAorticStain(c, t, force));
  if (force <= 0) return notes;
  const grow = force * (2 + 5 * rnd(rng));
  c.lengthMm += grow;
  const idx = typeIndex(c.grade);
  if (idx < 4 && chance(rng, 0.25 * force * (1 + c.severity))) {
    c.grade = NHLBI[Math.min(4, idx + 1)];
    c.severity = Math.min(1, c.severity + 0.15);
    c.data.stain = typeIndex(c.grade) >= 2 ? 1 : 0;
    if (overt(c, t)) notes.push(note(t, c, "event", "danger", `The dissection extends and now stains (NHLBI type ${c.grade}).`));
    else notes.push(note(t, c, "cue", "danger", `The dissection extends (NHLBI type ${c.grade}).`));
  } else notes.push(note(t, c, "cue", "warn", "The dissection plane lengthens with the injection."));
  return notes;
}

/** Untreated progression: a staining dissection may become flow-limiting. Rate per second — MODEL PARAMETER. */
export const MP_DISSECTION_CLOSE_PER_S = 1 / 240;

export function stepDissection(c: Complication, dt: number, ctx: CxContext, rng: RngState): CxNote[] {
  if (c.stage === "treated" || c.stage === "resolved") return [];
  const notes: CxNote[] = [];
  const idx = typeIndex(c.grade);
  if (idx >= 2 && idx < 5) {
    const lam = MP_DISSECTION_CLOSE_PER_S * (0.5 + c.severity) * (ctx.act < 250 ? 1.5 : 1);
    if (chance(rng, 1 - Math.exp(-lam * dt))) {
      c.grade = NHLBI[idx + 1];
      c.severity = Math.min(1, c.severity + 0.2);
      if (overt(c, ctx.t)) {
        /* first overt sign */
      }
      notes.push(
        note(ctx.t, c, "event", "danger", c.grade === "F" ? "The dissected vessel occludes: no antegrade flow beyond it (NHLBI type F)." : "A persistent filling defect: the dissection now limits flow (NHLBI type E).")
      );
    }
  }
  return notes;
}

/** A stent across the whole dissection seals it; partial cover shortens it. */
export function stentOver(c: Complication, t: number, s: { route: string[]; fromMm: number; toMm: number }): CxNote[] {
  if (c.stage === "treated" || c.stage === "resolved") return [];
  // pci-flow-closure: an aortocoronary dissection is sealed only by a stent that covers the ostium
  if (c.data.aortic) return ostialStentOver(c, t, s);
  const a = c.atMm - c.lengthMm / 2,
    b = c.atMm + c.lengthMm / 2;
  if (spanCovers(s.route, s.fromMm, s.toMm, c.route, a, b, 0.5)) {
    c.bailouts.push("stent-cover");
    treated(c, t, true);
    c.data.stain = 0;
    return [note(t, c, "effect", "good", "The stent covers the whole dissection: it is sealed and flow is restored.")];
  }
  const ov = spanOverlap(s.route, s.fromMm, s.toMm, c.route, a, b);
  if (ov > 0) {
    c.bailouts.push("stent-cover");
    // what remains is the uncovered part beyond the nearer stent edge
    const left = Math.max(0, s.fromMm - a);
    const right = Math.max(0, b - s.toMm);
    const keep = Math.max(left, right);
    c.atMm = left > right ? a + left / 2 : s.toMm + right / 2;
    c.lengthMm = Math.max(1, keep);
    return [note(t, c, "effect", "warn", "The stent covers part of the dissection; a flap remains beyond its edge.")];
  }
  return [];
}

// ===========================================================================
// pci-flow-closure: the aortocoronary dissection, the closure start's
// dissection and a wire re-crossing a dissected segment.
//
// Aortocoronary dissection (cm-principles-closure#5): contrast stains from the
// RCA ostium into the sinus after a forceful injection through a deep or
// wedged guide. Every further injection into the vessel enlarges the stain;
// an ostial stent that covers the ostium, protruding 1-2 mm into the aorta
// (the request's teaching, 01-principles-closure.ts), seals it. The stain's
// size, its growth per injection and the re-crossing chances are MODEL
// PARAMETERS (docs/realism/facts/pkg-pci-flow-closure.md).
// ===========================================================================

/** Stain at the sinus-stain start (mm from the ostium up the sinus and aortic wall), and its growth per injection — MODEL PARAMETERS. */
export const MP_AORTIC_STAIN_START_MM = 8;
export const MP_AORTIC_STAIN_PER_INJECTION_MM = 4;
/** Protrusion of an ostial stent into the aorta that seals the ostium (mm): at least the first, the second is the request's upper bound. */
export const OSTIAL_PROTRUSION_MM = [1, 2] as const;

function growAorticStain(c: Complication, t: number, force: number): CxNote[] {
  c.data.stainMm = (c.data.stainMm ?? MP_AORTIC_STAIN_START_MM) + MP_AORTIC_STAIN_PER_INJECTION_MM * (1 + force);
  c.data.injectionsAfter = (c.data.injectionsAfter ?? 0) + 1;
  c.severity = Math.min(1, c.severity + 0.03);
  return [note(t, c, "cue", "danger", "The stain in the sinus is larger after this injection and is spreading up the aortic wall.")];
}

/** An ostial stent: seals the aortocoronary dissection when it covers the ostium with at least 1 mm in the aorta and the whole flap. */
function ostialStentOver(c: Complication, t: number, s: { route: string[]; fromMm: number; toMm: number }): CxNote[] {
  const last = c.route[c.route.length - 1];
  if (!s.route.includes(last) && !s.route.includes(c.vessel)) return [];
  const b = c.atMm + c.lengthMm / 2;
  const protrusion = -s.fromMm;
  if (s.toMm < c.atMm - c.lengthMm / 2) return [];
  c.bailouts.push("stent-cover");
  c.data.protrusionMm = protrusion;
  if (protrusion >= OSTIAL_PROTRUSION_MM[0] - 1e-9 && s.toMm >= b + 0.5) {
    treated(c, t, true);
    c.data.stain = 0;
    return [note(t, c, "effect", "good", "The stent covers the ostium: the entry is sealed and the stain no longer fills.")];
  }
  return [note(t, c, "effect", "warn", protrusion < OSTIAL_PROTRUSION_MM[0] ? "The stent edge sits inside the ostium: contrast still enters the stain from the sinus." : "The stent covers the ostium but not the whole flap beyond it.")];
}

/** Seed the sinus-stain start: an ostial dissection from the guide with contrast staining the sinus (overt, no draw). */
export function seedAortocoronaryDissection(cx: CxState, t: number, o: { route: string[]; vessel: string; cause?: string }): { c: Complication; notes: CxNote[] } {
  const c = newComplication(cx, t, "dissection", {
    route: o.route,
    vessel: o.vessel,
    atMm: 3,
    lengthMm: 6,
    severity: 0.6,
    grade: "C",
    cause: o.cause ?? "aortocoronary dissection: forceful injection through a deep, wedged Amplatz guide in the RCA",
    stage: "overt",
    data: { stain: 1, ostial: 1, aortic: 1, stainMm: MP_AORTIC_STAIN_START_MM, injectionsAfter: 0 },
  });
  return { c, notes: [note(t, c, "event", "danger", "Contrast hangs at the RCA ostium and stains the right sinus: an aortocoronary dissection.")] };
}

/** Seed the closure start's dissection: flow-limiting (NHLBI E or F) at the dilated segment (overt, no draw). */
export function seedClosureDissection(cx: CxState, t: number, o: { route: string[]; vessel: string; atMm: number; lengthMm: number; grade?: "D" | "E" | "F" }): { c: Complication; notes: CxNote[] } {
  const grade = o.grade ?? "F";
  const c = newComplication(cx, t, "dissection", {
    route: o.route,
    vessel: o.vessel,
    atMm: o.atMm,
    lengthMm: o.lengthMm,
    severity: grade === "D" ? 0.75 : 0.9,
    grade,
    cause: "spiral dissection after predilatation",
    stage: "overt",
    data: { stain: 1 },
  });
  return { c, notes: [note(t, c, "event", "danger", `A spiral dissection at the dilated segment (NHLBI type ${grade}).`)] };
}

/** Chance that a wire re-crossing an unsealed dissection of this NHLBI type tracks into the false lumen — MODEL PARAMETERS. */
export const MP_RECROSS_SUBINTIMAL: Record<NhlbiType, number> = { A: 0.02, B: 0.08, C: 0.2, D: 0.35, E: 0.45, F: 0.6 };

/** The chance a wire re-crossing this dissection goes subintimal (0 once it is sealed). */
export function recrossSubintimalP(c: Complication): number {
  if (c.kind !== "dissection" || c.stage === "treated" || c.stage === "resolved") return 0;
  return MP_RECROSS_SUBINTIMAL[(NHLBI as readonly string[]).includes(c.grade) ? (c.grade as NhlbiType) : "A"];
}
