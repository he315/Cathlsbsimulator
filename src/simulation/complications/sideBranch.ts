// ---------------------------------------------------------------------------
// Side-branch compromise after main-vessel stenting.
//
// Mechanism: plaque and carina shift into the side-branch ostium as the main
// vessel is stented. Predictors in bifurcation registries include a true
// bifurcation (disease on both sides of the carina), the main-vessel to
// side-branch diameter ratio and thrombus burden (Korean Circ J 2026;
// Front Cardiovasc Med 2025; facts C3). Reported incidences: 7.4% in LAD
// bifurcation PCI and 19.6% of bifurcation lesions in another series. The
// risk model below is a MODEL PARAMETER calibrated to land near those rates
// (about 5% for a non-true bifurcation, 15-25% for a true one); the
// bifurcation angle and stent-to-vessel ratio terms are model assumptions.
// Progression: a pinched ostium can close. Bail-out: rewire the branch
// through the struts and dilate its ostium (kissing balloon).
//
// pci-two-rail-engine: with two rails the exposure carries the carina shift
// (carinaShiftMm: how far the expanding stent pushes the carina into the
// ostium, from the stent's excess over the distal main vessel), which then
// takes the place of the stent-to-vessel ratio term. Without it (one wire)
// the risk is exactly as before. The shift and its weight are MODEL
// PARAMETERS (docs/realism/facts/pkg-pci-two-rail-engine.md).
// ---------------------------------------------------------------------------

import { chance, hazardP, rnd, type RngState } from "../pci/rng";
import { newComplication, note, overt, treated } from "./common";
import type { Complication, CxContext, CxNote, CxState } from "./types";

export interface SideBranchExposure {
  branch: string;
  parentRoute: string[];
  atMm: number;
  /** branch reference diameter and main-vessel diameter at the origin (mm) */
  sbD: number;
  mvD: number;
  /** angle between the branch and the main vessel's forward direction (rad) */
  angle: number;
  /** plaque at the carina on both sides (lesion spans the origin) */
  trueBifurcation: boolean;
  /** stent diameter over the main-vessel reference */
  stentRatio: number;
  thrombus: boolean;
  /**
   * how far the stent pushes the carina into the ostium (mm, carinaShiftMm; pci-two-rail-engine). Absent:
   * the stent-to-vessel ratio term alone, as before the two-rail engine.
   */
  carinaShiftMm?: number;
}

/** Carina shift of a stent sized to the distal main vessel: this share of its excess over the distal vessel (mm per mm) — MODEL PARAMETER. */
export const MP_CARINA_SHIFT_PER_MM = 0.5;
/** Plaque shift at the carina even with a stent that fits: a true bifurcation, otherwise (mm) — MODEL PARAMETERS. */
export const MP_CARINA_SHIFT_TRUE_MM = 0.2;
export const MP_CARINA_SHIFT_BASE_MM = 0.05;
/** Weight of the carina shift (as a fraction of the branch diameter, above MP_CARINA_SHIFT_FREE) in the risk — MODEL PARAMETERS. */
export const MP_CARINA_SHIFT_RISK = 3;
export const MP_CARINA_SHIFT_FREE = 0.05;

/** The carina shift (mm) a stent expanded to `stentD` makes at a branch whose distal main vessel is `mvDistalD`. */
export function carinaShiftMm(stentD: number, mvDistalD: number, trueBifurcation: boolean): number {
  return MP_CARINA_SHIFT_PER_MM * Math.max(0, stentD - mvDistalD) + (trueBifurcation ? MP_CARINA_SHIFT_TRUE_MM : MP_CARINA_SHIFT_BASE_MM);
}

export function sideBranchRisk(e: SideBranchExposure): number {
  let p = 0.04;
  if (e.trueBifurcation) p *= 5;
  p *= Math.max(0.6, e.mvD / Math.max(0.5, e.sbD) / 1.4);
  if (e.angle < 0.7) p *= 1.3;
  if (e.carinaShiftMm !== undefined) p *= 1 + MP_CARINA_SHIFT_RISK * Math.max(0, e.carinaShiftMm / Math.max(0.5, e.sbD) - MP_CARINA_SHIFT_FREE);
  else p *= 1 + 3 * Math.max(0, e.stentRatio - 1.05);
  if (e.thrombus) p *= 1.6;
  return Math.min(0.85, p);
}

export function maybeSideBranch(cx: CxState, t: number, e: SideBranchExposure): { c: Complication | null; notes: CxNote[] } {
  if (cx.list.some((c) => c.kind === "side-branch" && c.vessel === e.branch && c.stage !== "resolved")) return { c: null, notes: [] };
  if (!chance(cx.rng, sideBranchRisk(e))) return { c: null, notes: [] };
  const narrowing = 0.5 + 0.5 * rnd(cx.rng);
  const closed = narrowing > 0.9;
  const c = newComplication(cx, t, "side-branch", {
    route: [...e.parentRoute, e.branch],
    vessel: e.branch,
    atMm: e.atMm,
    lengthMm: 3,
    severity: narrowing,
    grade: closed ? "TIMI 0-1" : "TIMI 2",
    cause: e.trueBifurcation ? "carina and plaque shift at a true bifurcation" : "carina shift after main-vessel stenting",
    stage: closed ? "overt" : "prodrome",
    data: e.carinaShiftMm !== undefined ? { sbD: e.sbD, carinaShiftMm: e.carinaShiftMm } : { sbD: e.sbD },
  });
  return {
    c,
    notes: [
      closed
        ? note(t, c, "event", "danger", `The ${branchName(e.branch)} no longer fills after the stent.`)
        : note(t, c, "cue", "warn", `The ostium of the ${branchName(e.branch)} looks pinched and fills slowly after the stent.`),
    ],
  };
}

/** A pinched ostium closes at this rate when left alone (per s) — MODEL PARAMETER. */
export const MP_SB_CLOSE_PER_S = 1 / 300;

export function stepSideBranch(c: Complication, dt: number, ctx: CxContext, rng: RngState): CxNote[] {
  if (c.stage !== "prodrome") return [];
  if (chance(rng, hazardP(MP_SB_CLOSE_PER_S * (ctx.act < 250 ? 1.5 : 1), dt))) {
    c.severity = 1;
    c.grade = "TIMI 0-1";
    overt(c, ctx.t);
    return [note(ctx.t, c, "event", "danger", `The ${branchName(c.vessel)} has closed.`)];
  }
  return [];
}

/** Rewiring the branch, then dilating its ostium (kissing balloon), restores it. */
export function bailoutSideBranch(c: Complication, action: string, t: number, o: { wireInBranch: boolean; balloonInBranch: boolean }): CxNote[] {
  if (c.stage === "resolved") return [];
  if (action === "rewire-side-branch") {
    if (!o.wireInBranch) return [note(t, c, "effect", "warn", "The wire is not in the side branch yet.")];
    c.bailouts.push(action);
    c.data.rewired = 1;
    if (c.severity >= 0.9) {
      c.severity = 0.8;
      c.grade = "TIMI 2";
    }
    return [note(t, c, "effect", "info", `Wire through the struts into the ${branchName(c.vessel)}: some flow returns.`)];
  }
  if (action === "kissing-balloon") {
    if (!c.data.rewired || !o.balloonInBranch) return [note(t, c, "effect", "warn", "Rewire the side branch through the struts and place a balloon in its ostium first.")];
    c.bailouts.push(action);
    c.severity = 0.2;
    c.grade = "TIMI 3";
    treated(c, t, true);
    return [note(t, c, "effect", "good", `Ostial dilatation of the ${branchName(c.vessel)}: it fills normally again.`)];
  }
  return [];
}

/**
 * Narrowing left at the ostium after a kiss through a proximal cell: the struts stay across the ostium
 * (cp-bifurcation-provisional-sb: a proximal cell pushes the struts into the main-vessel lumen and scaffolds
 * the ostium less well) — MODEL PARAMETER (the size of the residual is a teaching value).
 */
export const MP_PROXIMAL_CELL_RESIDUAL = 0.45;

/**
 * What a kiss leaves at a compromised branch, by the cell the branch wire crossed (pci-two-rail-engine): a
 * distal or carina cell keeps the result of the kissing bail-out (the carina shift is taken back); a
 * proximal cell leaves struts across the ostium and a residual narrowing. Call after the 'kissing-balloon'
 * bail-out. Returns the notes (none: what remains shows on the next injection and on imaging).
 */
export function afterKiss(c: Complication, cell: "distal" | "carina" | "proximal" | null): CxNote[] {
  if (c.kind !== "side-branch" || !c.bailouts.includes("kissing-balloon")) return [];
  c.data.carinaShiftMm = 0;
  if (cell === "proximal") {
    c.severity = Math.max(c.severity, MP_PROXIMAL_CELL_RESIDUAL);
    c.data.strutsAcrossOstium = 1;
  }
  return [];
}

function branchName(n: string): string {
  if (/^D\d/.test(n)) return `diagonal branch (${n})`;
  if (/^S\d/.test(n)) return `septal branch (${n})`;
  if (/^OM\d/.test(n)) return `obtuse marginal branch (${n})`;
  if (n === "LCx") return "circumflex";
  if (n === "LAD") return "LAD";
  return `${n} branch`;
}
