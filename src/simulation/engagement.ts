import type {
  Difficulty,
  EngagementKind,
  EngagementState,
  CatheterType,
  Vec3,
  CoronaryTarget,
  AnatomyVariant,
} from "../types";
import type { AnatomyModel, Ostium } from "./anatomy";
import { LV_MARGIN } from "./anatomy";
import {
  V,
  add,
  scale,
  sub,
  dot,
  distance,
  normalize,
  clamp01,
} from "../utils/math";

export interface ControlState {
  // --- Actual delivered state at the tip (what the anatomy physically sees). ---
  /** how far the catheter is advanced from its natural seat (advance +, withdraw -) */
  insertion: number;
  /** accumulated torque delivered to the tip, radians (clockwise +) */
  torque: number;

  // --- Commanded state at the hub (what the operator's hands have dialled in). ---
  /** commanded insertion at the hub; the tip lags toward this */
  cmdInsertion: number;
  /** commanded torque at the hub; the tip lags toward this */
  cmdTorque: number;

  // --- Spring integrator velocities (internal to the dynamics model). ---
  vInsertion: number;
  vTorque: number;

  /** wire lead beyond the catheter tip */
  wireInsertion: number;

  // --- Pseudo-haptic surfacing (0..1 unless noted), read by the UI. ---
  /** stored twist not yet delivered to the tip (rad) — torque wind-up */
  windup: number;
  /** stored forward push not yet delivered to the tip (>= 0) */
  forwardPressure: number;
  /** overall resistance felt right now, 0..1 */
  resistance: number;
  /** transient torque-whip magnitude (decays each tick), 0..1 */
  whip: number;

  /** legacy: consecutive advance inputs without seating (over-push proxy) */
  pushStreak: number;
}

export const initialControls = (): ControlState => ({
  insertion: 0,
  torque: 0,
  cmdInsertion: 0,
  cmdTorque: 0,
  vInsertion: 0,
  vTorque: 0,
  wireInsertion: 0,
  windup: 0,
  forwardPressure: 0,
  resistance: 0,
  whip: 0,
  pushStreak: 0,
});

const clampNum = (v: number, a: number, b: number): number =>
  Math.max(a, Math.min(b, v));

export interface DynamicsStep {
  controls: ControlState;
  /** the catheter buckled forward past the cusp into the LV this step */
  prolapsed: boolean;
  /** stored torque snapped the tip suddenly (whip release) this step */
  whipReleased: boolean;
}

// ---------------------------------------------------------------------------
// Catheter dynamics.
//
// The tip does not teleport to whatever the operator dials in. Commanded
// insertion / torque (cmd*) drive the *actual* delivered insertion / torque
// through underdamped springs, so the tip has lag, torque builds up ("wind-up")
// against a constrained ostium and then snaps ("whip"), forward push meets
// resistance, and shoving a seated catheter makes it buckle (prolapse) toward
// the left ventricle. computeTip() still reads only the ACTUAL insertion/torque,
// so the whole engagement model downstream is unchanged.
// ---------------------------------------------------------------------------
export function stepDynamics(
  prev: ControlState,
  cath: CatheterType,
  model: AnatomyModel,
  dt: number
): DynamicsStep {
  const h = 0.008; // fixed substep for stability
  const steps = Math.max(1, Math.min(48, Math.ceil(Math.min(dt, 0.3) / h)));

  const c: ControlState = { ...prev, whip: prev.whip * Math.pow(0.86, steps) };
  let prolapsed = false;
  let whipReleased = false;

  const tr = cath.behaviour.torqueResponse; // 0..1
  const kT = 55 * (0.45 + 0.55 * tr); // torque stiffness
  const kI = 26; // insertion stiffness
  const prolapseBias = cath.behaviour.prolapseTendency; // 0..1

  for (let i = 0; i < steps; i++) {
    const tip = computeTip(model, cath, c);
    const cram = tip.cram; // how hard the preshape crams the cusp wall
    const belowSeat = Math.max(0, model.lm.height - tip.height);

    // --- Torque: underdamped spring; a constrained tip resists twisting so
    //     twist accumulates as wind-up and then releases as whip/overshoot. ---
    const constraint = clampNum(
      cram / 6 + (tip.height < model.sinusTopY ? 0.25 : 0),
      0,
      1
    );
    const mT = 1 + constraint * 3.0;
    const cTd = 2 * Math.sqrt(kT) * 0.55; // damping ratio ~0.55 → overshoot
    const aT = (kT * (c.cmdTorque - c.torque) - cTd * c.vTorque) / mT;
    c.vTorque += aT * h;
    c.torque += c.vTorque * h;

    // --- Insertion: resists advancing into a seated / crammed position;
    //     withdrawing is essentially free. ---
    const wantAdvance = c.cmdInsertion > c.insertion;
    const pushResist = clampNum(
      0.16 * cram + 0.1 * belowSeat + prolapseBias * 0.15,
      0,
      1
    );
    const mI = 1 + (wantAdvance ? pushResist * 5 : 0);
    const cId = 2 * Math.sqrt(kI) * 0.9;
    const aI = (kI * (c.cmdInsertion - c.insertion) - cId * c.vInsertion) / mI;
    c.vInsertion += aI * h;
    c.insertion += c.vInsertion * h;

    c.forwardPressure = Math.max(0, c.cmdInsertion - c.insertion);
    c.windup = c.cmdTorque - c.torque;

    // --- Buckle / prolapse: shoving hard against a seated tip suddenly gives. ---
    if (
      wantAdvance &&
      c.forwardPressure > 3.2 - prolapseBias &&
      pushResist > 0.5
    ) {
      c.insertion += 3.2; // the catheter plunges toward / past the cusp
      c.vInsertion = 0;
      c.cmdInsertion = c.insertion; // release the stored push
      c.whip = 1;
      prolapsed = true;
    }

    // --- Torque whip release: large stored twist snaps free. ---
    if (Math.abs(c.windup) > 0.9 && Math.abs(c.vTorque) > 4) {
      c.whip = Math.max(c.whip, clampNum(Math.abs(c.vTorque) / 8, 0, 1));
      whipReleased = true;
    }
  }

  c.resistance = clampNum(
    Math.max(c.forwardPressure / 4.5, Math.abs(c.windup) / 1.1, c.whip),
    0,
    1
  );

  return { controls: c, prolapsed, whipReleased };
}

const radial = (az: number): Vec3 => V(Math.cos(az), 0, Math.sin(az));

export interface TipState {
  pos: Vec3;
  dir: Vec3;
  height: number;
  az: number;
  radius: number;
  cram: number;
  gap: number;
}

export function computeTip(
  model: AnatomyModel,
  cath: CatheterType,
  controls: ControlState
): TipState {
  const b = cath.behaviour;
  const tipAz = b.naturalAzimuth + controls.torque * (0.55 + b.torqueResponse * 0.45);
  const tipRadius = Math.min(b.reach, model.sinusRadius + 1.5);
  const cram = Math.max(0, b.reach - model.sinusRadius);
  const gap = Math.max(0, model.sinusRadius - b.reach);
  const height = b.seatHeight - controls.insertion;

  const downY = -0.2 - cram * 0.08 - b.prolapseTendency * 0.12;
  const dir = normalize(add(radial(tipAz), V(0, downY, 0)));
  const pos = add(V(0, height, 0), scale(radial(tipAz), tipRadius));

  return { pos, dir, height, az: tipAz, radius: tipRadius, cram, gap };
}

/**
 * Capture radius and alignment tolerances of the analytic engagement model.
 * Distances are in model units (mm), alignments are cosines.
 */
export interface EngagementThresholds {
  /** ostium distance below which an aligned tip counts as selectively engaged */
  selDist: number;
  /** alignment above which a close tip counts as selectively engaged */
  alignSel: number;
  /** ostium distance below which the tip counts as near the ostium */
  nearDist: number;
  /** alignment above which a near tip counts as coaxial */
  alignCoax: number;
  /** depth beyond the ostium that counts as deep engagement */
  deep: number;
}

/**
 * The legacy difficulty-scaled rows. MODEL PARAMETERS (not sourced values).
 * Only the 'advanced' row is used in the labs: capture radius and tolerance do
 * not change with difficulty, which changes assistance (hints and attending
 * prompts) only. The other rows are reachable only through
 * computeEngagement(..., { difficultyScaled: true }), which no lab passes.
 */
const THRESH: Readonly<Record<Difficulty, Readonly<EngagementThresholds>>> = Object.freeze({
  beginner: Object.freeze({ selDist: 7, alignSel: 0.85, nearDist: 12, alignCoax: 0.8, deep: 3.6 }),
  intermediate: Object.freeze({ selDist: 5, alignSel: 0.9, nearDist: 10, alignCoax: 0.85, deep: 2.8 }),
  advanced: Object.freeze({ selDist: 3.6, alignSel: 0.94, nearDist: 8, alignCoax: 0.9, deep: 2.2 }),
});

/** The single fixed set of engagement thresholds used at every difficulty (the 'advanced' row). */
export const FIXED_ENGAGEMENT_THRESHOLDS: Readonly<EngagementThresholds> = THRESH.advanced;

export interface EngagementOptions {
  /**
   * Scale the capture radius and tolerances with difficulty, as the model did
   * before HANDOVER 6.3 was addressed. Defaults to false: every difficulty uses
   * FIXED_ENGAGEMENT_THRESHOLDS. Kept for tests and comparison only.
   */
  difficultyScaled?: boolean;
  /**
   * Model the short left main's branch entry (shortLmBranch, diag-engagement-technique-set): a Judkins left the
   * root's size or smaller seated in a short left main is in the LAD, a damped deep-type seat. Defaults to false, so
   * every lab, preset and caller keeps the engine's established behaviour (a short left main seats like any other);
   * a caller that teaches the short left main (the diag-lm-damping-causes scenario) passes true. Diagnostic
   * catheters only: guides are never branched (the PCI guide stand-in, pci/guide.ts, is unchanged).
   */
  shortLmBranches?: boolean;
}

/** Shared default options, so the per-tick call allocates nothing. */
const NO_OPTS: EngagementOptions = Object.freeze({});

/** Shared options with the short left main's branch entry on (engagementOptionsFor), so the per-tick call allocates nothing. */
export const SHORT_LM_BRANCH_OPTS: Readonly<EngagementOptions> = Object.freeze({ shortLmBranches: true });

/**
 * The scenarios that teach the short left main's branch entry (diag-engagement-technique-set): with the short-lm
 * variant, the usual JL enters the LAD and one size larger images the circumflex. Every other case, the 'lm-deep'
 * and 'short-lm' presets included, keeps the established seat.
 */
export const SHORT_LM_BRANCH_SCENARIOS: readonly string[] = ["diag-lm-damping-causes"];

/**
 * The options a lab passes to computeEngagement for a case: SHORT_LM_BRANCH_OPTS for a short-lm case of a
 * SHORT_LM_BRANCH_SCENARIOS scenario, else the shared defaults. Returns one of two frozen objects, never a new one.
 * The diagnostic lab's store (useSimulatorStore.ts recompute) does not call it yet: reported with this package.
 */
export function engagementOptionsFor(c: { scenarioId?: string; variants?: readonly AnatomyVariant[] }): Readonly<EngagementOptions> {
  return c.scenarioId !== undefined && SHORT_LM_BRANCH_SCENARIOS.includes(c.scenarioId) && !!c.variants?.includes("short-lm") ? SHORT_LM_BRANCH_OPTS : NO_OPTS;
}

/** The thresholds computeEngagement applies for this difficulty and these options. */
export function engagementThresholds(
  difficulty: Difficulty,
  opts: EngagementOptions = NO_OPTS
): Readonly<EngagementThresholds> {
  if (opts.difficultyScaled !== true) return FIXED_ENGAGEMENT_THRESHOLDS;
  const row = THRESH[difficulty];
  if (!row) throw new Error(`engagementThresholds: unknown difficulty '${String(difficulty)}'`);
  return row;
}

type Thresh = EngagementThresholds;

/**
 * Fixed, difficulty-free tolerance for detecting conus over-selection, a hazard
 * check rather than target capture. MODEL PARAMETERS (not sourced values): the
 * selective distance and alignment of the former 'intermediate' row. In the
 * analytic root a JR4, JR3.5, AR or IKR tip placed on the conus ostium lines up
 * with its take-off axis at a cosine of about 0.93 (measured on a normal
 * right-dominant test case), so judging the conus against the coronary
 * capture alignment (FIXED_ENGAGEMENT_THRESHOLDS.alignSel, 0.94) would make
 * conus over-selection, and the VF it can provoke, unreachable.
 */
export const CONUS_OVERSELECTION_THRESHOLDS: Readonly<Pick<EngagementThresholds, "selDist" | "alignSel">> =
  Object.freeze({ selDist: THRESH.intermediate.selDist, alignSel: THRESH.intermediate.alignSel });

function conusThresholds(
  t: Readonly<EngagementThresholds>,
  opts: EngagementOptions
): Readonly<Pick<EngagementThresholds, "selDist" | "alignSel">> {
  // the legacy scaled model judged the conus with the scaled row itself
  return opts.difficultyScaled === true ? t : CONUS_OVERSELECTION_THRESHOLDS;
}

interface OstiumEval {
  distance: number;
  alignment: number;
  depth: number;
}

function evalOstium(tip: TipState, ost: Ostium): OstiumEval {
  const d = distance(tip.pos, ost.pos);
  const alignment = dot(tip.dir, ost.dir);
  const depth = dot(sub(tip.pos, ost.pos), ost.dir);
  return { distance: d, alignment, depth };
}

function qualityOf(e: OstiumEval, t: Thresh): number {
  const distQ = clamp01(1 - e.distance / (t.nearDist + 2));
  const alignQ = clamp01((e.alignment - 0.55) / 0.45);
  return clamp01(distQ * alignQ);
}

// ---------------------------------------------------------------------------
// The short left main (diag-engagement-technique-set). Oxford: with a short
// left main a Judkins left keeps entering the LAD selectively, and a JL one
// size larger usually lets the tip sit back into the circumflex (pm-engaging-
// left, src/content/manual/pci-manual/07-engaging.ts:551-560, :608; tip
// diag-short-lm-size-up); selective entry into the LAD or circumflex of a
// short left main is one cause of a damped left main trace (:101, and
// diag-lm-damping-causes). How short, and what "one size larger" means
// against the root, are MODEL PARAMETERS
// (docs/realism/facts/pkg-diag-engagement-technique-set.md).
// ---------------------------------------------------------------------------

/**
 * A left main shorter than this (mm along the model's LM polyline) is short. MODEL PARAMETER: the anatomy's
 * short left main is 5.8 mm along its polyline and the usual one 9.5 mm (anatomy.ts lmLen 5 and 9 mm, with the
 * bifurcation 3 mm lower).
 */
export const MP_SHORT_LM_MM = 7;

/**
 * A Judkins left whose reach exceeds the sinus radius by at least this (mm) is one size larger than the root
 * needs, and sits back at the circumflex of a short left main. MODEL PARAMETER: the catalogue's Judkins left
 * reaches step by 3-4 mm a size (data/catheters.ts), and a curve matched to the root has a reach equal to the
 * sinus radius (small 14, normal 18, dilated 24 mm).
 */
export const MP_SHORT_LM_LCX_REACH_MM = 2.5;

/** Length of the model's left main (mm along its polyline), or null when it has none (separate ostia). */
export function leftMainLengthMm(model: AnatomyModel): number | null {
  const lm = model.vessels.find((v) => v.id === "LM");
  if (!lm || lm.points.length < 2) return null;
  let len = 0;
  for (let i = 1; i < lm.points.length; i++) len += distance(lm.points[i - 1], lm.points[i]);
  return len;
}

/** The model's left main is short (MP_SHORT_LM_MM). */
export const isShortLeftMain = (model: AnatomyModel): boolean => {
  const len = leftMainLengthMm(model);
  return len !== null && len < MP_SHORT_LM_MM;
};

/**
 * Which branch a Judkins left seated in a short left main enters: the LAD with a curve the root's size or
 * smaller, the circumflex ostium with one at least MP_SHORT_LM_LCX_REACH_MM larger. Null when the left main is
 * not short or the catheter is not a diagnostic Judkins left (a guide is never branched). computeEngagement applies
 * it only with opts.shortLmBranches.
 */
export function shortLmBranch(model: AnatomyModel, cath: CatheterType): "LAD" | "LCx" | null {
  if (cath.category === "guide" || !/^JL/.test(cath.id) || !isShortLeftMain(model)) return null;
  return cath.behaviour.reach >= model.sinusRadius + MP_SHORT_LM_LCX_REACH_MM ? "LCx" : "LAD";
}

/**
 * Classify the tip against the ostia (the analytic engagement model, and the
 * fallback when no PhysicsDevices implementation is registered).
 *
 * `difficulty` no longer changes the classification: capture radius and
 * tolerance are FIXED_ENGAGEMENT_THRESHOLDS at every difficulty unless
 * `opts.difficultyScaled` is true (tests only).
 */
export function computeEngagement(
  model: AnatomyModel,
  cath: CatheterType,
  controls: ControlState,
  difficulty: Difficulty,
  opts: EngagementOptions = NO_OPTS
): EngagementState {
  const tip = computeTip(model, cath, controls);
  const t = engagementThresholds(difficulty, opts);

  const lmEval = evalOstium(tip, model.lm);
  const rcaOwnEval = evalOstium(tip, model.rca);
  const conusEval = evalOstium(tip, model.conus);
  // Conus over-selection: the tip is selectively in the conus branch — closer &
  // better aligned to it than to the RCA ostium proper, and genuinely near it.
  const tc = conusThresholds(t, opts);
  const conusSelected =
    conusEval.distance < tc.selDist &&
    conusEval.alignment > tc.alignSel &&
    conusEval.distance < rcaOwnEval.distance;
  // The circumflex's own ostium belongs to the sinus it opens in (diag-engagement-technique-set): a separate
  // LAD/LCx ostium in the left sinus is part of the "left" side, a circumflex arising in the right sinus is
  // part of the "right" side, so that engaging it selectively gives the right injection's fill list (which
  // draws the circumflex when it arises on the right, anatomy.ts injectionFill), not a left one without it.
  const ost2 = model.leftOstium2 ? evalOstium(tip, model.leftOstium2) : null;
  const ost2Right = !!ost2 && model.sinusOf?.lcx === "right";
  const leftEval = ost2 && !ost2Right && ost2.distance < lmEval.distance ? ost2 : lmEval;
  const rcaEval = ost2 && ost2Right && ost2.distance < rcaOwnEval.distance ? ost2 : rcaOwnEval;

  const nearest =
    leftEval.distance <= rcaEval.distance
      ? { side: "left" as CoronaryTarget, e: leftEval }
      : { side: "right" as CoronaryTarget, e: rcaEval };

  const base: EngagementState = {
    kind: "sinus-level",
    target: null,
    distanceToLm: leftEval.distance,
    distanceToRca: rcaEval.distance,
    alignmentLm: leftEval.alignment,
    alignmentRca: rcaEval.alignment,
    tipHeight: tip.height,
    depth: nearest.e.depth,
    isSelective: false,
    isDeep: false,
    isDangerous: false,
    conus: false,
    quality: 0,
    message: "",
  };

  // --- Zone checks first ---
  if (tip.height < model.valvePlaneY - LV_MARGIN) {
    return {
      ...base,
      kind: "in-lv",
      isDangerous: true,
      message:
        "This is below the valve plane — the tip is in the left ventricle. Do not inject. Withdraw to the root and reassess.",
    };
  }
  if (tip.height > model.sinusTopY) {
    return {
      ...base,
      kind: "ascending-aorta",
      message:
        "Too high — the tip is in the ascending aorta above the sinuses. Advance gently to bring it down to the sinus level where engagement is possible.",
    };
  }

  // Conus over-selection — the tip has ridden up into the conus branch. Reads as
  // engaged but is sub-selective and DANGEROUS: a conus injection can cause VF.
  if (conusSelected) {
    return {
      ...base,
      kind: "selective-rca",
      target: "right",
      conus: true,
      isDangerous: true,
      quality: 0.3,
      message:
        "Conus branch over-selection — the tip is up in the conus (first RCA branch). Do NOT inject: a conus injection can trigger VF. Withdraw slightly to drop onto the RCA ostium.",
    };
  }

  const side = nearest.side;
  const e = nearest.e;
  const isLeft = side === "left";
  const kSel: EngagementKind = isLeft ? "selective-lm" : "selective-rca";
  const kDeep: EngagementKind = isLeft ? "deep-lm" : "deep-rca";
  const kCoax: EngagementKind = isLeft ? "coaxial-lm" : "coaxial-rca";
  const kNear: EngagementKind = isLeft ? "near-lm" : "near-rca";
  const label = isLeft ? "left main" : "RCA";
  const quality = qualityOf(e, t);

  // --- Selective / deep ---
  if (e.distance < t.selDist && e.alignment > t.alignSel) {
    // a Judkins left seated in a short left main is in a branch (diag-engagement-technique-set): the usual size
    // or smaller enters the LAD, which damps like a deep seat; one size larger sits back at the circumflex. Opt-in
    // (opts.shortLmBranches), so the presets and labs that do not teach it keep the established seat.
    if (opts.shortLmBranches === true && isLeft && e === lmEval && shortLmBranch(model, cath) === "LAD") {
      return {
        ...base,
        kind: "deep-lm",
        target: side,
        isDeep: true,
        isDangerous: true,
        quality: quality * 0.6,
        message: "The tip has gone past the ostium into a branch and is obstructing flow. Expect damping. Withdraw slightly until the pressure is free before injecting.",
      };
    }
    if (e.depth > t.deep || (cath.behaviour.deepEngagementRisk > 0.55 && e.depth > t.deep * 0.7)) {
      return {
        ...base,
        kind: kDeep,
        target: side,
        isDeep: true,
        isDangerous: true,
        quality: quality * 0.6,
        message: `Deep ${label} engagement — the tip is too far into the vessel and is obstructing flow. Expect damping. Withdraw slightly until the pressure normalises before injecting.`,
      };
    }
    return {
      ...base,
      kind: kSel,
      target: side,
      isSelective: true,
      quality,
      message: `Good selective ${label} engagement. The tip is seated and coaxial. Choose a view that lays out your target segment, then inject.`,
    };
  }

  // --- Coaxial but not seated / near ---
  if (e.distance < t.nearDist) {
    if (e.alignment > t.alignCoax) {
      // aligned but a bit far — usually a height/reach issue
      const heightNote =
        tip.height > (isLeft ? model.lm.height : model.rca.height) + 2
          ? "The tip is a touch high; come down gently."
          : tip.height < (isLeft ? model.lm.height : model.rca.height) - 2
          ? "The tip is a touch low; withdraw slightly toward the cusp."
          : cath.behaviour.reach < model.sinusRadius - 1
          ? "The curve is falling short of the ostium — consider a larger catheter for this root."
          : "Fine-tune with a small torque and gentle seating.";
      return {
        ...base,
        kind: kCoax,
        target: side,
        quality: quality * 0.8,
        message: `Coaxial with the ${label} but not yet seated. ${heightNote}`,
      };
    }
    return {
      ...base,
      kind: kNear,
      target: side,
      quality: quality * 0.5,
      message: `Near the ${label} but not coaxial — the tip points across the ostium. Rotate gently to align rather than advancing.`,
    };
  }

  // --- In the root but not near an ostium ---
  const inSinus = tip.height >= 2 && tip.height <= model.sinusTopY;
  if (inSinus) {
    const reachNote =
      cath.behaviour.reach < model.sinusRadius - 2
        ? " The catheter curve looks too small for this root."
        : cath.behaviour.reach > model.sinusRadius + 2
        ? " The catheter curve looks too large for this root."
        : "";
    return {
      ...base,
      kind: "non-selective",
      target: null,
      quality: 0.15,
      message: `At the sinus level but not engaged. An injection here would opacify the root, not a coronary.${reachNote} Torque toward the ${leftEval.distance < rcaEval.distance ? "left" : "right"} cusp and seat gently.`,
    };
  }

  return {
    ...base,
    kind: "sinus-level",
    message:
      "In the aortic root. Bring the tip to the sinus level and torque toward a coronary cusp to engage.",
  };
}
