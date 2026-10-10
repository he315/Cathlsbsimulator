// ---------------------------------------------------------------------------
// Inflation: the indeflator (screw to a pressure, pull negative), balloon
// rupture, and the lesion's response to an inflation (a balloon dilates, a
// stent deploys, a balloon inside a stent post-dilates) with the
// complication draws. inflate and deflate are the instant compatibility path
// kept for headless tests.
//
// The lesion response to dilatation remains a teaching model (calcium
// resistance, recoil, modification by scoring and lithotripsy); device
// diameters come from the compliance charts in equipment.ts.
//
// pci-indeflator: the lesion's yield is the shared model of lesionYield.ts
// (pressure, hold and calcium), so the bench and the lab dilate lesions the
// same way. The outcomes of an inflation follow the operator's technique:
//  - balloon-undilatable: a balloon in the lesion that keeps a waist at or
//    above its rated burst pressure after a hold of MP_UNDILATABLE_HOLD_S;
//  - rupture above the drawn burst pressure (the needle falls, contrast puffs
//    out, with the dissection, perforation and air draws of the rupture);
//  - the cutting-balloon rule (about 1 atm every 5 s, not above its rated
//    pressure: the catalogue's maxInflateAtmPerS and rbpAtm), broken at the
//    cost of a higher dissection draw;
//  - pulling a balloon back before it has emptied drags the guide into the
//    artery (guide depth) with an ostial dissection draw (withdrawBeforeDeflation);
//  - acute recoil of a stent at an aorto-ostial lesion, opened again by a
//    post-dilatation (stent-recoil);
//  - after the first predilatation, the state of the stent-or-not decision
//    (good result, slow flow, flow-limiting dissection, persistent waist,
//    very small distal vessel), recorded as the truth for the debrief and, for
//    a drill, drawn by seed (predilatationStart).
// No live message names a complication the operator has not seen; the record
// (st.inflation) is the debrief's.
// ---------------------------------------------------------------------------

import type { VesselId } from "../../../types";
import type { Device } from "../state";
import { DEVICE_BY_ID, chartDiameter } from "../equipment";
import { emptyNow, holdSeconds, lockScrew, MP_HOLD_BAND_ATM, pullNegative, screwTo, secondsAtRbp, setPressure } from "../indeflator";
import { hasWaist, lesionYield, MP_WAIST_RATIO } from "../lesionYield";
import { THIN_STRUT_DES, ringCount } from "../stentGeometry";
import { bendIntegrals, branchesOf, pathTo, takeOff } from "../geometry";
import { chance, rnd, rngFrom } from "../rng";
import { cloneCx, onInflation, onStent, type CxNote } from "../../complications/engine";
import { newComplication, note } from "../../complications/common";
import { flowLimit, maybeGuideDissection } from "../../complications/dissection";
import { timiFor } from "../../complications/noReflow";
import { afterKiss, carinaShiftMm, type SideBranchExposure } from "../../complications/sideBranch";
import { applyBailout } from "../../complications/engine";
import { kissEffectiveDiameter } from "../stentGeometry";
import { ostiaUnderStents } from "./wire";
import {
  activeRailOf,
  railsOf,
  selectRail,
  twoWires,
  withRail,
  inflationOf,
  lesionCover,
  lesionShape,
  log,
  refDAt,
  sampleAtMm,
  specOf,
  syncMirrors,
  tele,
  withNotes,
  type InflationRecord,
  type PciGeom,
  type PciScenario,
  type PciState,
  type RailState,
  type Placed,
  type PredilOutcome,
} from "../state";
import { loadDevice, moveDevice, removeDevice } from "./devices";
import { aortoOstial } from "./imaging";

/** Melon-seeding: a fast pressure rise squeezes the balloon out of a rubbery lesion — MODEL PARAMETERS. */
export const MP_MELON_RISE_ATM_S = 2.5;
export const MP_MELON_GRIP_ATM = 3;

// --- model parameters of pci-indeflator (docs/realism/facts/pkg-pci-indeflator.md) ------------------

/**
 * A waist at or above the rated burst pressure after a hold of this long (s) makes the lesion
 * balloon-undilatable: the module's usual non-compliant hold is 10-20 s (pm-prep-and-stent, 'Step 9:
 * inflating the balloon', Brilakis 9.7.9) and the plan's rule names 10 s.
 */
export const MP_UNDILATABLE_HOLD_S = 10;
/** A repeat inflation to the same pressure is applied to the lesion again when held this long (s) — MODEL PARAMETER. */
export const MP_REAPPLY_HOLD_S = 5;
/** A placed stent reaching less than this fraction of its expanded diameter at the lesion is under-expanded — MODEL PARAMETER (the plan's 0.8; the bench's 80%). */
export const MP_STENT_EXPANSION_RATIO = 0.8;
/** A balloon pulled before it has emptied grips the lesion at least this much (0..1, wings still open) — MODEL PARAMETER. */
export const MP_PULL_GRIP_MIN = 0.3;
/** Fill fraction at which a balloon pulled before it has emptied grips fully (the grip rises linearly to it) — MODEL PARAMETER. */
export const MP_PULL_GRIP_FULL_FILL = 0.25;
/** Fraction of the pull that drags a fully gripping balloon's guide into the artery — MODEL PARAMETER. */
export const MP_PULL_GUIDE_DRAW = 0.8;
/** Coaxiality the guide loses per mm it is dragged in — MODEL PARAMETER. */
export const MP_PULL_COAX_LOSS_PER_MM = 0.05;
/** Deepest the guide can be dragged (mm beyond the ostium): the guide engine's own seating limit (guide.ts seatGuide). */
export const MP_GUIDE_MAX_DEPTH_MM = 8;
/** A cutting balloon inflated too fast scores the wall more: its dissection draw sees this much more oversizing — MODEL PARAMETER. */
export const MP_CUTTING_FAST_RATIO_BUMP = 0.1;
/** Chance that a stent at an aorto-ostial lesion recoils after it expands, and the share of that chance after a post-dilatation — MODEL PARAMETERS. */
export const MP_OSTIAL_RECOIL_P = 0.35;
export const MP_RECOIL_REPEAT = 0.5;
/** Share of the stent's diameter at the lesion lost to acute recoil — MODEL PARAMETER. */
export const MP_OSTIAL_RECOIL_FRAC = 0.15;
/** A dissection of NHLBI type D or worse (flowLimit at least this) limits flow — MODEL PARAMETER (dissection.ts flowLimit of type D). */
export const MP_FLOW_LIMITING = 0.35;
/**
 * The module's small-vessel class: a reference under this (mm) is a small vessel (cp-other-complex-vessel-size,
 * Brilakis; the bench uses the same 2.5 mm, src/ui/lab/benchTips.ts). Kept as the class; the stent-or-not
 * state reads the narrower MP_VERY_SMALL_DISTAL_MM.
 */
export const SMALL_VESSEL_MM = 2.5;
/**
 * The stent-or-not drill's 'very small distal vessel' (the lab request's state, narrower than the small-vessel
 * class): a distal reference lumen under this (mm) — MODEL PARAMETER.
 */
export const MP_VERY_SMALL_DISTAL_MM = 2.0;
/** Where the distal reference is read: this far beyond the lesion's distal shoulder (mm) — MODEL PARAMETER. */
export const MP_DISTAL_REF_MM = 5;
/**
 * Melon-seeding risk factors the module names (pm-prep-and-stent, 'Watermelon seeding': a severe or
 * sharply angulated lesion, a short balloon, inflating too fast): a balloon this long or shorter is
 * short, and a lesion bending this much (deg) doubles the risk — MODEL PARAMETERS.
 */
export const MP_MELON_SHORT_MM = 12;
export const MP_MELON_ANGLE_DEG = 45;
/**
 * melonSeedRisk's base: MP_MELON_BASE x (rise - MP_MELON_RISE_ATM_S + 1), stepPci's coefficient
 * (actions/step.ts); the cap of the combined risk; the clamp on the short-balloon factor — MODEL PARAMETERS.
 */
export const MP_MELON_BASE = 0.3;
export const MP_MELON_RISK_MAX = 0.95;
export const MP_MELON_SHORT_FACTOR_MIN = 0.5;
export const MP_MELON_SHORT_FACTOR_MAX = 1.5;
/** The stent-or-not drill's seeded outcomes and their weights (a 'small-vessel' outcome comes only from the anatomy) — MODEL PARAMETERS. */
export const PREDIL_OUTCOME_WEIGHTS: readonly { outcome: Exclude<PredilOutcome, "small-vessel">; weight: number }[] = [
  { outcome: "good", weight: 0.4 },
  { outcome: "slow-flow", weight: 0.2 },
  { outcome: "dissection", weight: 0.2 },
  { outcome: "waist", weight: 0.2 },
];
/** Resistance the drill gives a lesion drawn to keep a waist (a fibrocalcific lesion) — MODEL PARAMETER. */
export const MP_DRILL_WAIST_RESISTANCE = 0.9;
/** The drill's predilatation balloon: this fraction of the reference, semi-compliant, at this pressure — MODEL PARAMETERS. */
export const MP_PREDIL_SIZE_RATIO = 0.85;
export const MP_PREDIL_ATM = 12;
/** The drill's predilatation balloon is at least this much longer than the lesion (mm) — MODEL PARAMETER. */
export const MP_PREDIL_LENGTH_MARGIN_MM = 2;
/** The drill's imposed slow flow: no-reflow severity MIN + SPAN x a uniform draw (0..1) — MODEL PARAMETERS. */
export const MP_PREDIL_NOREFLOW_SEV_MIN = 0.3;
export const MP_PREDIL_NOREFLOW_SEV_SPAN = 0.25;
/**
 * The drill's imposed flow-limiting dissection: severity MIN + SPAN x a uniform draw, and a length of the
 * lesion's span plus EXTRA, at least MIN_LEN (mm) — MODEL PARAMETERS.
 */
export const MP_PREDIL_DISSECTION_SEV_MIN = 0.85;
export const MP_PREDIL_DISSECTION_SEV_SPAN = 0.1;
export const MP_PREDIL_DISSECTION_EXTRA_MM = 4;
export const MP_PREDIL_DISSECTION_MIN_LEN_MM = 6;

/** Set the indeflator: screw to `atm` at `rate` atm/s (the lab steps time with stepPci). */
export function setIndeflator(st: PciState, atm: number, rate = 2): PciState {
  const dev = st.device;
  if (!dev) return st;
  if (dev.stage !== "in-guide" || dev.centreMm < dev.lengthMm / 2 - 1) return log(st, "warn", "The device is still in the guide.");
  if (dev.ruptured) return log(st, "warn", "The balloon has ruptured: it will not hold pressure. Remove it.");
  if (dev.kind === "ivus" || dev.kind === "extension") return st;
  if (st.ind.locked) return st;
  let n: PciState = { ...st, ind: screwTo(st.ind, atm, rate), device: { ...dev, inflated: true } };
  // a new inflation: the balloon is empty and the screw was not already turned in (each tick of the screw
  // before the balloon has filled belongs to the same inflation)
  if (st.ind.fill < 0.05 && (st.ind.negative || st.ind.target <= 0.2)) {
    n = tele(n, "inflate-start", { kind: dev.kind, diameter: dev.diameter });
    if (dev.kind !== "balloon" && !st.injectedSinceDeviceMove) n = { ...n, counters: { ...n.counters, deployWithoutRun: n.counters.deployWithoutRun + 1 } };
  }
  // the cutting-balloon rule: about 1 atm every 5 s and not above its rated pressure (the catalogue's label),
  // counted once per inflation (the screw is turned in ticks): a later tick only adds to that inflation's record
  const spec = specOf(dev);
  if (spec.maxInflateAtmPerS !== undefined && atm > n.ind.atm) {
    const fast = rate > spec.maxInflateAtmPerS + 1e-9;
    const high = atm > spec.rbpAtm(dev.diameter) + 1e-9;
    if (fast || high) {
      const i = cuttingRecordIndex(n);
      if (i < 0) {
        const rec = inflationOf(n);
        n = { ...n, inflation: { ...rec, cuttingRuleBreaches: rec.cuttingRuleBreaches + 1 } };
        n = tele(n, "cutting-balloon-rule", { rate, atm, fast, high, maxRate: spec.maxInflateAtmPerS, rbp: spec.rbpAtm(dev.diameter) });
      } else {
        const e = n.log[i];
        const data = { ...e.data, rate: Math.max(Number(e.data.rate) || 0, rate), atm: Math.max(Number(e.data.atm) || 0, atm), fast: e.data.fast === true || fast, high: e.data.high === true || high };
        n = { ...n, log: [...n.log.slice(0, i), { ...e, data }, ...n.log.slice(i + 1)] };
      }
    }
  }
  return n;
}

/** Index in st.log of this inflation's 'cutting-balloon-rule' record (after its 'inflate-start'), or -1. */
function cuttingRecordIndex(st: PciState): number {
  for (let i = st.log.length - 1; i >= 0; i--) {
    const k = st.log[i].kind;
    if (k === "cutting-balloon-rule") return i;
    if (k === "inflate-start") return -1;
  }
  return -1;
}

/** Lock (hold the plunger: the pressure holds, the screw does not turn) or unlock the indeflator. */
export function lockIndeflator(st: PciState, locked: boolean): PciState {
  if (!!st.ind.locked === locked) return st;
  return tele({ ...st, ind: lockScrew(st.ind, locked) }, "indeflator-lock", { locked });
}

/** Pull negative: deflate. The effect of the inflation on the lesion is applied at its peak pressure, after its hold. */
export function pullIndeflatorNegative(s: PciScenario, g: PciGeom, st0: PciState): PciState {
  const dev = st0.device;
  if (!dev) return st0;
  if (st0.ind.locked) return st0;
  let st = st0;
  const holdS = holdSeconds(st.ind);
  // a repeat inflation to the same pressure, held, works on the lesion again (prolonged inflations)
  const repeat = dev.kind === "balloon" && dev.appliedAtm > 0 && holdS >= MP_REAPPLY_HOLD_S && st.ind.peak >= dev.appliedAtm - MP_HOLD_BAND_ATM;
  if ((st.ind.peak > dev.appliedAtm + 0.4 || repeat) && !dev.ruptured && st.ind.peak > 0.5) {
    st = applyInflation(s, g, st, st.ind.peak, false, holdS, rateBreach(st));
    st = undilatableCheck(s, g, st);
  }
  return { ...st, ind: pullNegative(st.ind) };
}

/** The current inflation broke the cutting-balloon rule (its 'cutting-balloon-rule' record follows its start). */
function rateBreach(st: PciState): boolean {
  for (let i = st.log.length - 1; i >= 0; i--) {
    const k = st.log[i].kind;
    if (k === "cutting-balloon-rule") return st.log[i].data.fast === true;
    if (k === "inflate-start") return false;
  }
  return false;
}

/**
 * After an inflation is applied: a balloon in the lesion that keeps a waist at or above its rated burst
 * pressure after a hold of MP_UNDILATABLE_HOLD_S is undilatable ('balloon-undilatable' record).
 */
function undilatableCheck(s: PciScenario, g: PciGeom, st: PciState): PciState {
  if (!balloonUndilatableNow(s, g, st)) return st;
  const rec = inflationOf(st);
  const dev = st.device!;
  return tele({ ...st, inflation: { ...rec, undilatable: rec.undilatable + 1 } }, "balloon-undilatable", { atm: st.ind.peak, holdS: secondsAtRbp(st.ind), specId: dev.specId, diameter: dev.diameter });
}

/**
 * Is the balloon on the wire keeping a waist in the lesion at or above its rated burst pressure after a
 * hold of MP_UNDILATABLE_HOLD_S (the waist the operator sees on fluoroscopy)? Read while the pressure is
 * held, and by pullIndeflatorNegative just before it deflates.
 */
export function balloonUndilatableNow(s: Pick<PciScenario, "calcium">, g: PciGeom, st: PciState): boolean {
  return undilatableAt(st, g.lesion, s.calcium);
}

/**
 * balloonUndilatableNow for a lesion span alone (the tip context's snapshot has the target's span on its
 * route, not the geometry): the balloon's overlap with [startMm, endMm] on the lesion's vessel.
 */
export function undilatableAt(st: PciState, lesion: { vessel: string; startMm: number; endMm: number }, calcium: 0 | 1 | 2 = 0): boolean {
  const dev = st.device;
  if (!dev || dev.kind !== "balloon" || dev.ruptured) return false;
  const spec = specOf(dev);
  const rbp = spec.rbpAtm(dev.diameter);
  // while held (once deflating, the 'balloon-undilatable' record of that deflation stands for it)
  if (st.ind.negative) return false;
  const atm = st.ind.atm;
  if (atm < rbp - MP_HOLD_BAND_ATM || secondsAtRbp(st.ind) < MP_UNDILATABLE_HOLD_S) return false;
  const from = dev.centreMm - dev.lengthMm / 2;
  const to = dev.centreMm + dev.lengthMm / 2;
  if (!st.route.includes(lesion.vessel)) return false;
  const cover = Math.max(0, Math.min(to, lesion.endMm) - Math.max(from, lesion.startMm)) / Math.max(0.5, lesion.endMm - lesion.startMm);
  if (cover <= 0.05) return false;
  if (st.stents.some((p) => Math.max(0, Math.min(to, p.toMm) - Math.max(from, p.fromMm)) > 0)) return false;
  return hasWaist({ resistance: st.resistance, atm, holdS: holdSeconds(st.ind), calcium });
}

/**
 * Melon-seeding risk of one fast pressure rise (0..1): zero at or below MP_MELON_RISE_ATM_S, rising with
 * the rate as stepPci's draw does, and higher for a short balloon and an angulated lesion (the module's
 * risk factors). For stepPci to adopt (src/simulation/pci/actions/step.ts draws with the rate alone).
 */
export function melonSeedRisk(o: { riseAtmS: number; balloonLengthMm: number; angulationDeg: number }): number {
  if (o.riseAtmS <= MP_MELON_RISE_ATM_S) return 0;
  const base = MP_MELON_BASE * (o.riseAtmS - MP_MELON_RISE_ATM_S + 1);
  const short = Math.max(MP_MELON_SHORT_FACTOR_MIN, Math.min(MP_MELON_SHORT_FACTOR_MAX, MP_MELON_SHORT_MM / Math.max(1, o.balloonLengthMm)));
  const bend = 1 + Math.max(0, o.angulationDeg) / MP_MELON_ANGLE_DEG;
  return Math.min(MP_MELON_RISK_MAX, base * short * bend);
}

/** How much the route bends across the target lesion (deg): the angulation of the lesion. */
export function lesionAngulationDeg(g: PciGeom, route: string[]): number {
  if (!route.includes(g.lesion.vessel)) return 0;
  return (bendIntegrals(g, route, g.lesion.startMm, g.lesion.endMm).turning * 180) / Math.PI;
}

/**
 * Pull the balloon (or stent delivery balloon) back by `mm` before it has emptied: it grips the lesion
 * and drags the guide into the artery (guide depthMm rises, coaxiality falls) with an ostial dissection
 * draw, as for a forceful pull (pm-prep-and-stent, 'Step 11: withdraw the balloon into the guide':
 * guide-induced dissection). The balloon moves back only by what the guide does not take. Returns the
 * state unchanged when the balloon has emptied (the usual withdrawal applies) or is still in the guide.
 */
export function withdrawBeforeDeflation(s: PciScenario, g: PciGeom, st0: PciState, mm: number): PciState {
  const dev = st0.device;
  if (!dev || mm <= 0 || st0.ind.fill <= 0) return st0;
  if (dev.kind !== "balloon" && dev.kind !== "stent" && dev.kind !== "covered-stent") return st0;
  if (dev.stage !== "in-guide" || dev.centreMm + dev.lengthMm / 2 <= 0) return st0;
  const grip = Math.min(1, MP_PULL_GRIP_MIN + st0.ind.fill / MP_PULL_GRIP_FULL_FILL);
  const gs = st0.guide;
  const room = Math.max(0, MP_GUIDE_MAX_DEPTH_MM - gs.depthMm);
  const drawIn = Math.min(room, MP_PULL_GUIDE_DRAW * grip * mm);
  // the lesion holds the balloon by its grip: only the rest of the pull moves it back
  const moved = (1 - grip) * mm;
  const guide = { ...gs, depthMm: gs.depthMm + drawIn, coaxial: Math.max(0.2, gs.coaxial - MP_PULL_COAX_LOSS_PER_MM * drawIn) };
  let st: PciState = { ...st0, guide, device: { ...dev, centreMm: dev.centreMm - moved } };
  const rec = inflationOf(st);
  st = { ...st, inflation: { ...rec, pulledBeforeDeflation: rec.pulledBeforeDeflation + 1, guideDrawnInMm: rec.guideDrawnInMm + drawIn } };
  st = tele(st, "pull-before-deflation", { fill: st0.ind.fill, drawInMm: drawIn, depthMm: guide.depthMm });
  if (drawIn > 0.3) st = log(st, "warn", "The guide moves into the artery as the balloon is pulled.");
  // the guide engine's ostial dissection draw at the new depth and coaxiality, as for a forceful pull; its own
  // note speaks of an injection and names the dissection, so the cause and the cue are this mechanism's (the
  // dissection shows on the next injection, as any other)
  const cx = cloneCx(st.cx);
  const r = maybeGuideDissection(cx, st.t, { side: s.side, depthMm: guide.depthMm, coaxial: guide.coaxial, forceful: true, vessel: st.route[0] ?? g.lesion.vessel });
  if (!r.c) return { ...st, cx };
  r.c.cause = "guide drawn into the artery by a balloon pulled before it had emptied";
  return withNotes({ ...st, cx }, [note(st.t, r.c, "cue", "warn", "The guide tip sits deeper in the ostium.")]);
}

/**
 * Compatibility: inflate the device to `atm` at once (deploys a stent).
 *
 * @deprecated Use setIndeflator, stepPci and pullIndeflatorNegative (inflation over time). Kept for
 * headless tests and the assisted UI path until pci-lab-shell-session removes its UI callers.
 */
export function inflate(s: PciScenario, g: PciGeom, st0: PciState, atm: number): PciState {
  const dev = st0.device;
  if (!dev || dev.centreMm < dev.lengthMm / 2) return log(st0, "warn", "The device is still in the guide.");
  let st: PciState = { ...st0, ind: setPressure(st0.ind, atm), device: { ...dev, atm, inflated: true } };
  if (atm > dev.burstAtm) return rupture(s, g, st, atm);
  return applyInflation(s, g, st, atm, false);
}

/**
 * Compatibility: empty the balloon at once.
 *
 * @deprecated Use pullIndeflatorNegative and stepPci (deflation takes seconds). Kept for headless tests
 * and the assisted UI path until pci-lab-shell-session removes its UI callers.
 */
export function deflate(st: PciState): PciState {
  if (!st.device?.inflated && st.ind.fill <= 0.05) return st;
  const d0 = st.device!;
  // a deployed stent stays; its balloon comes back as an ordinary balloon
  const dev = d0.kind === "stent" || d0.kind === "covered-stent" ? { ...d0, kind: "balloon" as const, balloon: "semi-compliant" as const, deployed: true } : d0;
  return { ...st, ind: emptyNow(st.ind), device: { ...dev, inflated: false, atm: 0 } };
}

function rupture(s: PciScenario, g: PciGeom, st0: PciState, atm: number): PciState {
  const dev = st0.device!;
  const spec = specOf(dev);
  let st: PciState = { ...st0, balloonRupture: true, device: { ...dev, ruptured: true, inflated: false, atm: 0 }, ind: emptyNow(st0.ind) };
  st = log(st, "danger", `Balloon rupture at ${atm.toFixed(0)} atm (rated burst ${spec.rbpAtm(dev.diameter)} atm): the pressure falls away and contrast puffs out.`);
  st = tele(st, "balloon-rupture", { atm });
  return applyInflation(s, g, st, atm, true);
}

/**
 * The lesion's response to an inflation at `atm` (a balloon dilates; a stent deploys; a balloon inside a
 * stent post-dilates), and the complication draws.
 */
function applyInflation(s: PciScenario, g: PciGeom, st0: PciState, atm: number, ruptured: boolean, holdS = 0, fastCutting = false): PciState {
  const dev = st0.device!;
  const spec = specOf(dev);
  let st: PciState = { ...st0, device: { ...dev, atm: ruptured ? 0 : atm, appliedAtm: Math.max(dev.appliedAtm, atm) } };
  const from = dev.centreMm - dev.lengthMm / 2;
  const to = dev.centreMm + dev.lengthMm / 2;
  const ref = g.lesion.refDiameter;
  const at = sampleAtMm(g, st.route, Math.max(0, dev.centreMm));
  const localRef = at ? refDAt(g, st.route, dev.centreMm) : ref;
  const dDev = chartDiameter(spec, dev.diameter, atm);
  const isStent = (dev.kind === "stent" || dev.kind === "covered-stent") && !dev.deployed;
  // with two rails, a balloon centred in a side branch whose origin lies under a stent dilates the branch
  // through the struts, not the stent (pci-two-rail-engine; one wire keeps the earlier overlap rule)
  const sbThrough = twoWires(st) && !isStent && branchUnderStentAt(g, st, dev.centreMm);
  // such a balloon's proximal part lies in the stented parent: the parent's lesion under the stent is not its
  // lesion (a lesion in the branch itself still is)
  const cover = sbThrough && at?.v.name !== g.lesion.vessel ? 0 : lesionCover(g, st.route, from, to);
  // an old restenosed stent the case opened with (the in-stent start) is the lesion's: a balloon over the lesion inside it dilates the lesion
  const inStent = !sbThrough && st.stents.some((p) => Math.max(0, Math.min(to, p.toMm) - Math.max(from, p.fromMm)) > 0 && !(p.restenosed && cover > 0.05));
  const vesselAt = at?.v;
  const vId = (vesselAt?.lesionId ?? g.lesion.vessel) as VesselId;
  const ratio = dDev / Math.max(0.5, localRef);
  const eemD = localRef / Math.sqrt(1 - 0.35);
  const ratioToEem = dDev / eemD;
  // the dissection draw of a cutting balloon inflated faster than its label allows
  const ratioCx = ratio + (fastCutting ? MP_CUTTING_FAST_RATIO_BUMP : 0);
  let waist = false;
  const notes: CxNote[] = [];

  st = tele(st, isStent ? "deploy" : "inflate", {
    kind: isStent ? "stent" : dev.balloon,
    diameter: dev.diameter,
    atm,
    localRefMm: localRef,
    inLesion: cover > 0.05,
    inStent,
    fromMm: from,
    toMm: to,
  });

  if (!isStent) {
    // ---- balloon ----
    if (!ruptured && cover > 0.05 && !inStent) {
      const modify = dev.balloon === "ivl" ? 0.45 : dev.balloon === "scoring" && atm >= spec.nominalAtm(dev.diameter) ? 0.15 : dev.balloon === "non-compliant" && atm >= 18 && s.calcium ? 0.08 : 0;
      if (modify > 0) {
        st = { ...st, resistance: Math.max(0.05, st.resistance - modify) };
        st = log(st, "good", dev.balloon === "ivl" ? "Lithotripsy pulses delivered: the calcium is fractured and the lesion is more compliant." : "The plaque yields under the scoring balloon.");
      }
      const dAch = dDev * lesionYield({ resistance: st.resistance, atm, holdS, calcium: s.calcium });
      waist = dAch < dDev * MP_WAIST_RATIO;
      // acute recoil: the lesion keeps about three quarters of what the balloon gained
      const cur = ref * (1 - st.severity / 100);
      const gained = cover >= 0.75 ? cur + 0.75 * Math.max(0, dAch - cur) : cur + 0.3 * Math.max(0, dAch - cur);
      st = { ...st, severity: Math.max(0, Math.round(100 * (1 - Math.min(ref, gained) / ref))), predilated: true };
      st = log(st, waist ? "warn" : "info", waist ? `A waist persists at ${atm.toFixed(0)} atm: the lesion is not yielding.${s.calcium ? " Consider a scoring balloon or lithotripsy before stenting." : ""}` : `Balloon fully expanded at ${atm.toFixed(0)} atm (${dDev.toFixed(2)} mm).`);
      if (cover < 0.75) st = log(st, "warn", "The balloon covered only part of the lesion.");
    } else if (sbThrough && !ruptured) {
      st = tele(st, "sb-dilatation", { branch: st.route[st.route.length - 1], diameter: dev.diameter, atm });
      st = log(st, "info", `Side-branch balloon inflated through the stent struts at ${atm.toFixed(0)} atm.`);
    } else if (!inStent && !ruptured) {
      if (ratio > 1.1) st = { ...st, counters: { ...st.counters, oversizedOutsideLesion: st.counters.oversizedOutsideLesion + 1 } };
      st = log(st, "warn", "Balloon inflated away from the lesion.");
    }
    // post-dilatation inside a stent: rings within the balloon open to the balloon (up to the platform's limit)
    if (inStent && !ruptured) {
      st = { ...st, counters: { ...st.counters, postdilatedInStent: true } };
      const stents = st.stents.map((p) => {
        const inside = Math.max(0, Math.min(to, p.toMm) - Math.max(from, p.fromMm));
        if (inside <= 0) return p;
        const limit = (DEVICE_BY_ID.des.dilatationLimit ?? ((d: number) => d + 0.75))(p.nominal);
        const n = p.ringD.length;
        const ringD = p.ringD.map((d, i) => {
          const mm = p.fromMm + ((p.toMm - p.fromMm) * (i + 0.5)) / n;
          if (mm < from || mm > to) return d;
          const inLes = st.route.includes(g.lesion.vessel) && mm >= g.lesion.startMm && mm <= g.lesion.endMm;
          const f = inLes ? lesionShape(g, mm) : 0;
          const ach = dDev * lesionYield({ resistance: st.resistance * 0.6 * f, atm, holdS, calcium: s.calcium, onsetAtm: 8 });
          return Math.max(d, Math.min(limit + 0.25, ach));
        });
        const atLesion = lesionRingMin(g, st.route, p.fromMm, p.toMm, ringD) ?? p.atLesion;
        // a balloon inside the oval segment a kiss left rounds it again (the final POT; pci-two-rail-engine)
        const rounded = p.oval && from <= p.oval.fromMm + 0.5 && to >= p.oval.toMm - 0.5 ? { oval: null } : {};
        return { ...p, ringD, diameter: Math.max(p.diameter, Math.min(dDev, limit)), atLesion: Math.max(p.atLesion, atLesion), ...(p.recoilMm ? { recoilMm: 0 } : {}), ...rounded };
      });
      st = { ...st, stents };
      if (twoWires(st)) st = potAcrossTakeoff(g, st, from, to);
      // a post-dilated stent that had recoiled may recoil again (less often)
      st = recoilDraw(s, g, st, stents.map((p, i) => (p.fromMm < to && p.toMm > from && st0.stents[i]?.recoilMm ? i : -1)).filter((i) => i >= 0), MP_RECOIL_REPEAT);
      const covering = stents.find((p) => !p.restenosed && p.fromMm <= g.lesion.endMm && p.toMm >= g.lesion.startMm);
      if (covering && cover > 0) st = { ...st, severity: Math.max(0, Math.round(100 * (1 - Math.min(ref, covering.atLesion) / ref))) };
      const overhang = st.stents.reduce((m, p) => Math.max(m, Math.max(0, p.fromMm - from) + Math.max(0, to - p.toMm)), 0);
      st = log(st, "info", `Post-dilatation at ${atm.toFixed(0)} atm (${dDev.toFixed(2)} mm).`);
      if (overhang > 2 && ratio > 1.05 && atm >= 14) {
        const r = onInflation(st.cx, st.t, inflationEvent(s, g, st, { from, to, device: "balloon", ratio: ratio + 0.15, ratioToEem, atm, waist, inLesion: false, edgeInPlaque: true, ruptured, prepared: dev.prepared, beyondLimit: dDev > (DEVICE_BY_ID.des.dilatationLimit?.(dev.diameter) ?? 9) }));
        st = { ...st, cx: r.cx };
        notes.push(...r.notes);
        st = log(st, "warn", "High pressure beyond the stent edge.");
      }
    }
    if (!(inStent && !ruptured)) {
      const r = onInflation(st.cx, st.t, inflationEvent(s, g, st, { from, to, device: "balloon", ratio: ratioCx, ratioToEem, atm, waist, inLesion: cover > 0.05, edgeInPlaque: false, ruptured, prepared: dev.prepared, beyondLimit: false }));
      st = { ...st, cx: r.cx };
      notes.push(...r.notes);
    } else {
      const limit = DEVICE_BY_ID.des.dilatationLimit?.(st.stents.find((p) => p.toMm >= from && p.fromMm <= to)?.nominal ?? dev.diameter) ?? 9;
      if (dDev > limit + 0.1 || ratioToEem > 1.1) {
        const r = onInflation(st.cx, st.t, inflationEvent(s, g, st, { from, to, device: "balloon", ratio, ratioToEem, atm, waist, inLesion: false, edgeInPlaque: false, ruptured, prepared: dev.prepared, beyondLimit: dDev > limit + 0.1 }));
        st = { ...st, cx: r.cx };
        notes.push(...r.notes);
        if (dDev > limit + 0.1) st = log(st, "warn", `Dilated beyond the stent's limit (${limit.toFixed(2)} mm).`);
      }
    }
    st = withNotes(st, notes);
    // the first predilatation of the lesion: the state of the stent-or-not decision (the debrief's truth)
    if (!ruptured && !inStent && cover > 0.05 && !st0.predilated && st.stents.length === 0 && !inflationOf(st).predil) {
      const outcome = classifyPredilatation(s, g, st, waist);
      st = { ...st, inflation: { ...inflationOf(st), predil: { t: st.t, outcome, imposed: false } } };
      st = tele(st, "predilatation-result", { outcome });
    }
    return st;
  }

  // ---- stent deployment ----
  if (atm > spec.rbpAtm(dev.diameter) + 2) st = log(st, "warn", `Deployed above the rated burst pressure (${spec.rbpAtm(dev.diameter)} atm).`);
  const rEff = st.resistance * (st.predilated ? 0.6 : 1);
  const dAch = Math.min(dDev, dDev * lesionYield({ resistance: rEff, atm, holdS, calcium: s.calcium }));
  waist = dAch < dDev * MP_WAIST_RATIO;
  const n = ringCount(THIN_STRUT_DES, dev.lengthMm);
  const ringD: number[] = [];
  for (let i = 0; i < n; i++) {
    const mm = from + ((to - from) * (i + 0.5)) / n;
    const inLes = st.route.includes(g.lesion.vessel) && mm >= g.lesion.startMm && mm <= g.lesion.endMm;
    const f = inLes ? lesionShape(g, mm) : 0;
    ringD.push(dDev - (dDev - dAch) * f);
  }
  const atLesion = cover > 0 ? (lesionRingMin(g, st.route, from, to, ringD) ?? dAch) * 0.97 : dDev;
  const placed: Placed = {
    vessel: vId,
    fromMm: from,
    toMm: to,
    diameter: dDev,
    atLesion,
    route: st.route.slice(),
    nominal: dev.diameter,
    labelLengthMm: dev.lengthMm,
    ringD,
    compressionMm: 0,
    covered: dev.kind === "covered-stent",
  };
  st = { ...st, stents: [...st.stents, placed], device: { ...st.device!, inflated: !ruptured } };
  if (cover <= 0 && dev.kind === "stent") {
    st = log({ ...st, geographicMiss: true }, "danger", "The stent was deployed away from the lesion.");
  }
  const margin = 1.5;
  const missProx = cover > 0 && from > g.lesion.startMm - margin;
  const missDist = cover > 0 && to < g.lesion.endMm + margin;
  if (missProx || missDist) {
    st = { ...st, geographicMiss: true };
    st = log(st, "danger", `Geographic miss: the ${missProx ? "proximal" : "distal"} stent edge lands in diseased vessel.`);
  }
  if (cover > 0) {
    const residual = Math.max(0, Math.round(100 * (1 - Math.min(ref, placed.atLesion) / ref)));
    st = { ...st, severity: cover >= 0.95 ? residual : Math.max(residual, Math.round(st0.severity * 0.5)) };
  }
  // complications of the deployment, then what the stent covers (dissections sealed, side branches at risk)
  const ev = inflationEvent(s, g, st, {
    from,
    to,
    device: dev.kind === "covered-stent" ? "covered-stent" : "stent",
    ratio,
    ratioToEem,
    atm,
    waist,
    inLesion: cover > 0.05,
    edgeInPlaque: missProx || missDist,
    ruptured,
    prepared: dev.prepared,
    beyondLimit: false,
  });
  const r1 = onInflation(st.cx, st.t, ev);
  notes.push(...r1.notes);
  const r2 = onStent(r1.cx, st.t, { route: st.route, fromMm: from, toMm: to, covered: dev.kind === "covered-stent", sideBranches: sideBranchesUnder(s, g, st, from, to, dDev) });
  notes.push(...r2.notes);
  st = { ...st, cx: r2.cx };
  // the other rail's wire beside the stent is now jailed under it (pci-two-rail-engine)
  if (twoWires(st)) st = jailOtherRail(g, st, st.stents.length - 1);
  st = log(
    st,
    waist ? "warn" : "good",
    waist
      ? `Stent deployed at ${atm.toFixed(0)} atm but under-expanded at the lesion (about ${dAch.toFixed(1)} mm against ${dDev.toFixed(1)} mm for that pressure). Post-dilate with a non-compliant balloon.`
      : `Stent deployed at ${atm.toFixed(0)} atm: ${dDev.toFixed(2)} mm.`
  );
  st = withNotes(st, notes);
  // acute recoil of a stent at an aorto-ostial lesion (after it has expanded)
  if (!ruptured && cover > 0) st = recoilDraw(s, g, st, [st.stents.length - 1], 1);
  return st;
}

/**
 * Acute recoil (aorto-ostial lesions, cp-ostial-troubleshoot: the stent lacks the radial strength to hold
 * the lesion open): each listed stent over an aorto-ostial target recoils with MP_OSTIAL_RECOIL_P x
 * `factor`, losing MP_OSTIAL_RECOIL_FRAC of its diameter at the lesion. The draw uses the inflation
 * record's own generator.
 */
function recoilDraw(s: PciScenario, g: PciGeom, st0: PciState, idx: number[], factor: number): PciState {
  if (!idx.length || !aortoOstial(s, g) || !st0.route.includes(g.lesion.vessel)) return st0;
  const rec: InflationRecord = inflationOf(st0);
  const rng = { ...rec.rng };
  let st: PciState = st0;
  const stents = st.stents.slice();
  let any = false;
  for (const i of idx) {
    const p = stents[i];
    if (!p || p.fromMm > g.lesion.endMm || p.toMm < g.lesion.startMm) continue;
    if (!chance(rng, MP_OSTIAL_RECOIL_P * factor)) continue;
    const lossMm = MP_OSTIAL_RECOIL_FRAC * p.atLesion;
    const n = p.ringD.length;
    const ringD = p.ringD.map((d, k) => {
      const mm = p.fromMm + ((p.toMm - p.fromMm) * (k + 0.5)) / n;
      return mm >= g.lesion.startMm && mm <= g.lesion.endMm ? d - MP_OSTIAL_RECOIL_FRAC * d * lesionShape(g, mm) : d;
    });
    stents[i] = { ...p, ringD, atLesion: p.atLesion - lossMm, recoilMm: lossMm };
    any = true;
  }
  st = { ...st, stents, inflation: { ...rec, rng } };
  if (!any) return st;
  const ref = g.lesion.refDiameter;
  const covering = stents.find((p) => !p.restenosed && p.fromMm <= g.lesion.endMm && p.toMm >= g.lesion.startMm);
  if (covering) st = { ...st, severity: Math.max(0, Math.round(100 * (1 - Math.min(ref, covering.atLesion) / ref))) };
  st = tele(st, "stent-recoil", { recoilMm: stents.filter((p) => p.recoilMm).map((p) => p.recoilMm) });
  return log(st, "warn", "After deflation the stent at the ostium is narrower than it was at full inflation.");
}

// ---------------------------------------------------------------------------
// After predilatation: the stent-or-not decision
// ---------------------------------------------------------------------------

/** The distal reference lumen (mm) beyond the target lesion. */
export function distalReferenceMm(g: PciGeom, route: string[]): number {
  const r = route.includes(g.lesion.vessel) ? route : [...route, g.lesion.vessel];
  return refDAt(g, r, g.lesion.endMm + MP_DISTAL_REF_MM);
}

/**
 * What a predilatation has left, read from the state (the truth; for the debrief, never a live screen):
 * a flow-limiting dissection, then slow flow without one, then a waist that persists, then a very small
 * distal vessel, else a good result. `waist` is the last inflation's waist when the caller knows it.
 */
export function classifyPredilatation(s: Pick<PciScenario, "calcium">, g: PciGeom, st: PciState, waist?: boolean): PredilOutcome {
  const live = st.cx.list.filter((c) => c.stage !== "resolved" && c.stage !== "treated");
  if (live.some((c) => c.kind === "dissection" && flowLimit(c.grade) >= MP_FLOW_LIMITING)) return "dissection";
  if (st.slowFlow || live.some((c) => c.kind === "no-reflow")) return "slow-flow";
  if (waist ?? lastWaist(st)) return "waist";
  if (distalReferenceMm(g, st.route) < MP_VERY_SMALL_DISTAL_MM) return "small-vessel";
  return "good";
}

/** The operator's last inflation message said a waist remained. */
function lastWaist(st: PciState): boolean {
  for (let i = st.events.length - 1; i >= 0; i--) {
    const text = st.events[i].text;
    if (/^A waist persists/.test(text)) return true;
    if (/^Balloon fully expanded/.test(text)) return false;
  }
  return false;
}

/** Draw the stent-or-not drill's outcome from a seed (PREDIL_OUTCOME_WEIGHTS). */
export function drawPredilatationOutcome(seed: string | number): Exclude<PredilOutcome, "small-vessel"> {
  const r = rnd(rngFrom(`predilatation:${seed}`));
  const total = PREDIL_OUTCOME_WEIGHTS.reduce((a, w) => a + w.weight, 0);
  let acc = 0;
  for (const w of PREDIL_OUTCOME_WEIGHTS) {
    acc += w.weight / total;
    if (r < acc) return w.outcome;
  }
  return PREDIL_OUTCOME_WEIGHTS[PREDIL_OUTCOME_WEIGHTS.length - 1].outcome;
}

/**
 * Give a predilatation whose physical result was good the drill's drawn outcome: slow flow without a
 * dissection (a no-reflow complication at TIMI 2, a cue), or a flow-limiting dissection (NHLBI type D).
 * A 'waist' is set before the inflation (predilatationStart); 'good' changes nothing. The complication
 * enters through the complication engine's own records, so it progresses and answers bail-outs as any
 * other; the cue is what the operator sees on the next run.
 */
export function imposePredilatationOutcome(s: PciScenario, g: PciGeom, st0: PciState, outcome: PredilOutcome): PciState {
  const rec = inflationOf(st0);
  const rng = { ...rec.rng };
  const cx = cloneCx(st0.cx);
  const route = st0.route.includes(g.lesion.vessel) ? st0.route.slice() : [...st0.route, g.lesion.vessel];
  const vessel = sampleAtMm(g, route, g.lesion.centreMm)?.v.name ?? g.lesion.vessel;
  const notes: CxNote[] = [];
  if (outcome === "slow-flow" && !cx.list.some((c) => c.kind === "no-reflow" && c.stage !== "resolved")) {
    const sev = MP_PREDIL_NOREFLOW_SEV_MIN + MP_PREDIL_NOREFLOW_SEV_SPAN * rnd(rng);
    const c = newComplication(cx, st0.t, "no-reflow", { route, vessel, atMm: g.lesion.centreMm, lengthMm: 0, severity: sev, grade: timiFor(sev), cause: "distal embolisation of plaque debris after predilatation", stage: "prodrome" });
    notes.push(note(st0.t, c, "cue", "warn", "Contrast clears slowly from the vessel beyond the treated segment."));
  }
  if (outcome === "dissection" && !cx.list.some((c) => c.kind === "dissection" && c.stage !== "resolved" && flowLimit(c.grade) >= MP_FLOW_LIMITING)) {
    const c = newComplication(cx, st0.t, "dissection", {
      route,
      vessel,
      atMm: g.lesion.centreMm,
      lengthMm: Math.max(MP_PREDIL_DISSECTION_MIN_LEN_MM, g.lesion.endMm - g.lesion.startMm + MP_PREDIL_DISSECTION_EXTRA_MM),
      severity: MP_PREDIL_DISSECTION_SEV_MIN + MP_PREDIL_DISSECTION_SEV_SPAN * rnd(rng),
      grade: "D",
      cause: "dilatation of the lesion",
      stage: "overt",
      data: { stain: 1 },
    });
    notes.push(note(st0.t, c, "event", "danger", "Contrast stays outside the lumen at the dilated segment and flow beyond it is slower."));
  }
  const st: PciState = { ...st0, cx, inflation: { ...rec, rng, predil: { t: st0.t, outcome, imposed: true } } };
  return tele(withNotes(syncMirrors(st), notes), "predilatation-result", { outcome, imposed: true });
}

/**
 * The stent-or-not drill's start (for the scenario pack's 'post-predilatation' start, which the core pack
 * does not declare yet): with the wire across, the team predilates the lesion with a semi-compliant
 * balloon of MP_PREDIL_SIZE_RATIO of the reference at MP_PREDIL_ATM and removes it; the outcome is drawn
 * from `seed` (or given). A drawn waist makes the lesion fibrocalcific before the inflation; slow flow and
 * a dissection are given after it when the inflation itself drew no complication (a waist or a small
 * distal vessel may come with them).
 */
export function predilatationStart(s: PciScenario, g: PciGeom, st0: PciState, o: { seed?: string | number; outcome?: Exclude<PredilOutcome, "small-vessel"> } = {}): PciState {
  const outcome = o.outcome ?? drawPredilatationOutcome(o.seed ?? `${s.id}:${st0.rng.s}`);
  let st: PciState = outcome === "waist" ? { ...st0, resistance: Math.max(st0.resistance, MP_DRILL_WAIST_RESISTANCE) } : st0;
  const spec = DEVICE_BY_ID.sc;
  const want = MP_PREDIL_SIZE_RATIO * g.lesion.refDiameter;
  const d = spec.diameters.filter((x) => x <= want + 1e-9).pop() ?? spec.diameters[0];
  const span = g.lesion.endMm - g.lesion.startMm;
  const len = spec.lengths.find((l) => l >= span + MP_PREDIL_LENGTH_MARGIN_MM) ?? spec.lengths[spec.lengths.length - 1];
  st = loadDevice(st, "balloon", "semi-compliant", d, len);
  if (!st.device) return st;
  st = moveDevice(st, g.lesion.centreMm - st.device.centreMm);
  st = inflate(s, g, st, MP_PREDIL_ATM);
  st = removeDevice({ ...deflate(st), valveOpen: true });
  // a complication the inflation itself drew is kept; a waist or the anatomy's small distal vessel stays with
  // the drawn complication (slow flow or a dissection can come with either)
  const physical = inflationOf(st).predil?.outcome ?? "good";
  if (physical === "dissection" || physical === "slow-flow" || outcome === "good" || outcome === "waist") return st;
  return imposePredilatationOutcome(s, g, st, outcome);
}

/**
 * Is a placed stent under-expanded by the model's expansion ratio (its diameter at the lesion below
 * MP_STENT_EXPANSION_RATIO of its expanded diameter), until imaging measures it?
 */
export function stentExpansionRatio(p: Pick<Placed, "atLesion" | "diameter">): number {
  return p.atLesion / Math.max(0.1, p.diameter);
}

function lesionRingMin(g: PciGeom, route: string[], from: number, to: number, ringD: number[]): number | null {
  if (!route.includes(g.lesion.vessel)) return null;
  let m = Infinity;
  const n = ringD.length;
  for (let i = 0; i < n; i++) {
    const mm = from + ((to - from) * (i + 0.5)) / n;
    if (mm >= g.lesion.startMm && mm <= g.lesion.endMm) m = Math.min(m, ringD[i]);
  }
  return Number.isFinite(m) ? m : null;
}

function inflationEvent(
  s: PciScenario,
  g: PciGeom,
  st: PciState,
  o: { from: number; to: number; device: "balloon" | "stent" | "covered-stent"; ratio: number; ratioToEem: number; atm: number; waist: boolean; inLesion: boolean; edgeInPlaque: boolean; ruptured: boolean; prepared: boolean; beyondLimit: boolean }
) {
  const at = sampleAtMm(g, st.route, Math.max(0, (o.from + o.to) / 2));
  return {
    route: st.route.slice(),
    vessel: at?.v.name ?? g.lesion.vessel,
    fromMm: o.from,
    toMm: o.to,
    device: o.device,
    ratio: o.ratio,
    ratioToEem: o.ratioToEem,
    atm: o.atm,
    waist: o.waist,
    calcium: o.inLesion ? s.calcium : (0 as const),
    inLesion: o.inLesion,
    edgeInPlaque: o.edgeInPlaque,
    subintimalWire: !!st.wire.subintimal && st.route.includes(g.lesion.vessel) && o.to > st.wire.subintimal.fromMm,
    rupture: o.ruptured,
    prepared: o.prepared,
    beyondLimit: o.beyondLimit,
    thrombus: s.thrombus,
    lipid: !!s.lipid || s.target.kind === "thrombotic",
    lesionLengthMm: s.target.lengthMm,
    aspirated: st.aspirated,
    side: s.side,
    vesselD: refDAt(g, st.route, Math.max(0, (o.from + o.to) / 2)),
  };
}

/** Side branches whose origin lies under a stent span. */
function sideBranchesUnder(s: PciScenario, g: PciGeom, st: PciState, from: number, to: number, dStent: number): SideBranchExposure[] {
  const out: SideBranchExposure[] = [];
  for (const vName of st.route) {
    for (const b of branchesOf(g, vName)) {
      if (st.route.includes(b.c.name)) continue;
      if (b.atMm < from + 0.5 || b.atMm > to - 0.5) continue;
      const to3 = takeOff(g, b.c);
      if (2 * to3.childRadius < 1.0) continue;
      const mvD = refDAt(g, st.route, b.atMm);
      const L = g.lesion;
      const trueBif = vName === L.vessel && b.atMm >= L.startMm - 1 && b.atMm <= L.endMm + 1 && st.severity > 30;
      const e: SideBranchExposure = {
        branch: b.c.name,
        parentRoute: pathTo(g, vName),
        atMm: b.atMm,
        sbD: 2 * to3.childRadius,
        mvD,
        angle: to3.polar,
        trueBifurcation: trueBif,
        stentRatio: dStent / Math.max(0.5, mvD),
        thrombus: s.thrombus,
      };
      // with two rails the exposure follows the carina shift (pci-two-rail-engine): the stent's excess over the
      // distal main vessel beyond the branch; one wire keeps the earlier stent-to-vessel ratio term
      if (twoWires(st)) e.carinaShiftMm = carinaShiftMm(dStent, refDAt(g, st.route, Math.min(to, b.atMm + MP_DISTAL_MV_REF_MM)), trueBif);
      out.push(e);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Two rails: jailing, kissing and the final POT (pci-two-rail-engine)
// ---------------------------------------------------------------------------

/** The distal main-vessel reference for the carina shift is read this far beyond the branch origin (mm) — MODEL PARAMETER. */
export const MP_DISTAL_MV_REF_MM = 3;
/** The proximal reference of a kiss is read this far proximal to the carina, inside the side-by-side segment (mm) — MODEL PARAMETER. */
export const MP_KISS_PROX_REF_MM = 3;
/**
 * A kiss leaves the proximal stent oval: its long-to-short axis ratio is 1 + this x (the smaller balloon over
 * the larger), corrected by a final POT — MODEL PARAMETER, the bench's MP_KISS_OVAL (src/simulation/bench/
 * bifurcation.ts, 0.3), so the bench and the lab ovalise the same way.
 */
export const MP_KISS_OVAL = 0.3;

/**
 * Jail the other rail's wire under a stent just deployed beside it: a wire in a branch whose origin lies under
 * the stent (the jailed side-branch wire), or along the stent's own vessel beyond its proximal end (a jailed
 * buddy wire). Logged as the operator sees it (the second wire now runs outside the stent).
 */
function jailOtherRail(g: PciGeom, st0: PciState, stentIdx: number): PciState {
  const p = st0.stents[stentIdx];
  const other: 0 | 1 = activeRailOf(st0) === 0 ? 1 : 0;
  const w = railsOf(st0)[other].wire;
  if (!p || !w || w.tipMm <= p.fromMm) return st0;
  let branch: string | null = null;
  let at = p.toMm;
  for (const v of w.route) {
    if (p.route.includes(v)) continue;
    const c = g.byName.get(v);
    const parent = c?.parent?.name;
    if (!parent || !p.route.includes(parent)) break;
    const o = branchesOf(g, parent).find((b) => b.c.name === v);
    if (o && o.atMm > p.fromMm && o.atMm < p.toMm && w.tipMm > o.atMm) {
      branch = v;
      at = o.atMm;
    }
    break;
  }
  if (!branch) {
    // alongside in the stent's own vessel (a buddy wire)
    const last = w.route[w.route.length - 1];
    if (!p.route.includes(last) || w.route.some((v) => !p.route.includes(v))) return st0;
    branch = last;
    at = Math.min(p.toMm, w.tipMm);
  }
  const jailedMm = Math.max(0, at - p.fromMm);
  let st = withRail(st0, other, () => ({ jailed: { stentIdx, branch: branch!, atMm: at, jailedMm, t: st0.t }, cell: null, crossing: null }));
  st = tele(st, "wire-jailed", { rail: other, stentIdx, branch, jailedMm });
  return log(st, "info", "The second wire is now jailed outside the stent.");
}

/**
 * A post-dilatation inside a stent whose distal end lies beyond the proximal edge of a branch ostium a wire
 * has been rewired through (a final POT with its marker at the carina): the balloon across the take-off
 * narrows the opened cell in front of the branch (cp-bifurcation-provisional-sb, Andreasen 2020 as the module
 * gives it). Recorded on the crossing (narrowed) and as 'pot-across-takeoff'; a balloon kept proximal to
 * the take-off leaves it.
 */
function potAcrossTakeoff(g: PciGeom, st0: PciState, from: number, to: number): PciState {
  let st = st0;
  const rails = railsOf(st);
  for (const i of [0, 1] as const) {
    const c = rails[i].crossing;
    if (!c || c.narrowed) continue;
    // a balloon on the branch wire is not the POT, and neither is the main-vessel balloon of a kiss (a balloon in the branch beside it)
    if (activeRailOf(st) === i && st.route.includes(c.branch)) continue;
    const sb = rails[i].device;
    if (sb && sb.stage === "in-guide" && sb.centreMm + sb.lengthMm / 2 > c.atMm) continue;
    const o = ostiaUnderStents(g, st.stents).find((x) => x.branch === c.branch && x.stentIdx === c.stentIdx);
    if (!o || !(to > o.proxMm && from < o.proxMm)) continue;
    st = withRail(st, i, (r) => ({ crossing: r.crossing ? { ...r.crossing, narrowed: true } : null }));
    st = tele(st, "pot-across-takeoff", { rail: i, branch: c.branch, distalMm: to, takeoffMm: o.proxMm });
  }
  return st;
}

/** The device centre lies in a side branch whose origin is under a deployed stent (the active rail's route). */
function branchUnderStentAt(g: PciGeom, st: PciState, centreMm: number): boolean {
  return ostiaUnderStents(g, st.stents).some((o) => st.route.includes(o.branch) && centreMm > o.atMm);
}

/**
 * Kissing balloons: with a balloon on each rail, one in the main vessel across the carina and one in the side
 * branch's ostium, both inflated together to `atm` (the compatibility inflation of each, then the kiss). The
 * main-vessel balloon dilates as any balloon inside the stent; the proximal segment where the two lie side by
 * side opens to their effective diameter (Finet: 0.678 x the sum of the two, stentGeometry kissEffectiveDiameter),
 * up to the platform's limit, and is left oval until a final POT. A compromised branch rewired through the
 * struts is treated by the kiss ('kissing-balloon' bail-out), with what the cell the branch wire crossed leaves
 * (sideBranch.ts afterKiss). Both balloons stay up until deflateKiss. The record 'kissing' carries the pair,
 * the effective diameter and the proximal reference (the truth for the debrief).
 */
export function kissBalloons(s: PciScenario, g: PciGeom, st0: PciState, atm: number): PciState {
  if (!twoWires(st0)) return log(st0, "warn", "Kissing needs a balloon on each of two wires.");
  const rails = railsOf(st0);
  const balloonOut = (d: Device | null) => !!d && d.kind === "balloon" && d.stage === "in-guide" && d.centreMm - d.lengthMm / 2 > 0 && !d.ruptured;
  if (!balloonOut(rails[0].device) || !balloonOut(rails[1].device)) return log(st0, "warn", "Kissing needs a balloon out of the guide on each wire.");
  if (rails.some((r) => r.device!.inflated || r.ind.fill > 0.05)) return log(st0, "warn", "Deflate both balloons before the kiss.");
  // a balloon on a jailed wire lies outside the stent: the branch is rewired through the struts first
  if (rails.some((r) => r.jailed)) return log(st0, "warn", "Rewire the side branch through the stent struts before kissing: the jailed wire runs outside the stent.");
  // where the kiss is: the main-vessel stent and the branch origin under it (kissSite), else (a buddy pair in one
  // vessel) the last stent placed, with no side-by-side geometry
  const site = kissSite(g, st0, rails);
  const sbRail: 0 | 1 = site ? site.sbRail : 1;
  const mvRail: 0 | 1 = sbRail === 0 ? 1 : 0;
  const back = activeRailOf(st0);
  // inflate the main-vessel balloon (dilating inside the stent), then the branch balloon (through the struts:
  // its own dissection and oversizing draws and the 'sb-dilatation' record)
  let st = inflate(s, g, selectRail(st0, mvRail), atm);
  const dMv = chartDiameter(specOf(st.device!), st.device!.diameter, atm);
  st = inflate(s, g, selectRail(st, sbRail), atm);
  const sbDev = st.device!;
  const dSb = chartDiameter(specOf(sbDev), sbDev.diameter, atm);
  const sbRoute = st.route.slice();
  const branch = site ? site.branch : (() => {
    const last = st.stents.length ? st.stents[st.stents.length - 1] : null;
    return last ? sbRoute.find((v) => !last.route.includes(v)) ?? null : null;
  })();
  // the side-by-side segment: where the two balloons overlap proximal to the branch origin
  const mvDev = railsOf(st)[mvRail].device!;
  const o = site ? ostiaUnderStents(g, st.stents).find((x) => x.branch === site.branch && x.stentIdx === site.stentIdx) : undefined;
  const eff = kissEffectiveDiameter(dMv, dSb);
  const proxRef = site && o ? refDAt(g, st.stents[site.stentIdx].route, Math.max(0, o.proxMm - MP_KISS_PROX_REF_MM)) : refDAt(g, sbRoute, Math.max(0, sbDev.centreMm));
  if (site && o) {
    // the stent as the two inflations left it (the main-vessel balloon has post-dilated it)
    const cur = st.stents[site.stentIdx];
    const sideFrom = Math.max(mvDev.centreMm - mvDev.lengthMm / 2, sbDev.centreMm - sbDev.lengthMm / 2);
    const sideTo = o.atMm;
    const limit = (DEVICE_BY_ID.des.dilatationLimit ?? ((d: number) => d + 0.75))(cur.nominal);
    const n = cur.ringD.length;
    const ringD = cur.ringD.map((d, k) => {
      const mm = cur.fromMm + ((cur.toMm - cur.fromMm) * (k + 0.5)) / n;
      return mm >= sideFrom && mm <= sideTo ? Math.max(d, Math.min(limit + 0.25, eff)) : d;
    });
    const stents = st.stents.slice();
    stents[site.stentIdx] = { ...cur, ringD, oval: sideTo > sideFrom ? { fromMm: Math.max(cur.fromMm, sideFrom), toMm: sideTo, ratio: 1 + MP_KISS_OVAL * (Math.min(dMv, dSb) / Math.max(dMv, dSb)) } : null };
    st = { ...st, stents };
  }
  // the branch: treated by the kiss when it was rewired through the struts
  const cell = railsOf(st)[sbRail].cell;
  if (branch && st.cx.list.some((c) => c.kind === "side-branch" && c.vessel === branch && c.stage !== "resolved")) {
    const r = applyBailout(st.cx, "kissing-balloon", st.t, { wireInBranch: (v) => v === branch, balloonInBranch: (v) => v === branch });
    for (const c of r.cx.list) if (c.kind === "side-branch" && c.vessel === branch) afterKiss(c, cell);
    st = withNotes({ ...st, cx: r.cx }, r.notes);
  }
  st = tele(st, "kissing", { atm, mvRail, sbRail, branch, stentIdx: site ? site.stentIdx : null, dMv, dSb, effectiveMm: eff, proximalRefMm: proxRef, ratio: eff / Math.max(0.5, proxRef), cell });
  st = log(st, "info", `Kissing inflation at ${atm.toFixed(0)} atm: both balloons up together.`);
  return selectRail(st, back);
}

/**
 * Where a kiss is (the latest stent first): a deployed stent over a branch origin with one rail's wire in that
 * branch and the other rail's balloon centred inside the stent on the stent's own vessel. Null when no stent
 * and origin fit (a buddy pair in one vessel).
 */
function kissSite(g: PciGeom, st: PciState, rails: readonly [RailState, RailState]): { stentIdx: number; branch: string; sbRail: 0 | 1 } | null {
  const ostia = ostiaUnderStents(g, st.stents);
  for (let stentIdx = st.stents.length - 1; stentIdx >= 0; stentIdx--) {
    const p = st.stents[stentIdx];
    for (const o of ostia) {
      if (o.stentIdx !== stentIdx) continue;
      for (const sbRail of [1, 0] as const) {
        const sbW = rails[sbRail].wire;
        const mv = rails[sbRail === 0 ? 1 : 0];
        if (!sbW || !mv.wire || !mv.device || !sbW.route.includes(o.branch) || mv.wire.route.includes(o.branch)) continue;
        const c = mv.device.centreMm;
        if (c < p.fromMm || c > p.toMm) continue;
        const at = sampleAtMm(g, mv.wire.route, c);
        if (!at || !p.route.includes(at.v.name)) continue;
        return { stentIdx, branch: o.branch, sbRail };
      }
    }
  }
  return null;
}

/** Deflate both kissing balloons (the compatibility deflation of each rail's balloon). */
export function deflateKiss(st0: PciState): PciState {
  if (!twoWires(st0)) return deflate(st0);
  const back = activeRailOf(st0);
  let st = st0;
  for (const i of [0, 1] as const) {
    st = selectRail(st, i);
    if (st.device && (st.device.inflated || st.ind.fill > 0.05)) st = deflate(st);
  }
  return tele(selectRail(st, back), "kissing-deflated", {});
}

/** Both rails' balloons are up together (a kiss in progress). */
export function kissing(st: PciState): boolean {
  if (!twoWires(st)) return false;
  return railsOf(st).every((r) => !!r.device && r.device.inflated);
}

/**
 * Helper shared with another action module: rupture, which stepPci calls when a balloon passes its
 * burst pressure. The default export is not re-exported by angioPci.ts's `export *`, so it stays out
 * of the public facade.
 */
const inflationInternal = { rupture };
export default inflationInternal;
