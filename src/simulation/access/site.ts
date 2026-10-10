// ---------------------------------------------------------------------------
// Access-site anatomy for the ultrasound-guided puncture.
//
// Each site is a small local frame in millimetres:
//   x  along the limb, positive towards the heart (proximal);
//   y  across the limb, positive lateral (thumb side at the wrist, the outer
//      thigh at the groin);
//   z  depth below the skin, positive down.
// Vessels, tendons and nerves are straight tubes (centre line linear in x),
// which is what a 38 mm linear probe sees over a few centimetres. Bones are
// a cylinder (the radius) or a sphere (the femoral head).
//
// Sourced numbers are in docs/realism/facts/C5.md; everything else is marked
// MODEL PARAMETER here and listed there.
//
// The groin for the femoral puncture (access-femoral-puncture): the femoral
// head's centre is a landmark (headX), anterior-wall calcium is a list of
// calcified stretches of the CFA (the target window becomes the longest
// clear stretch), and the inferior epigastric and lateral circumflex iliac
// arteries are branches of the external iliac above the ligament, which the
// micro-wire can enter (ultrasound.ts). A scenario can set the CFA's depth
// (the 2 cm and 4 cm presets), the head, the calcium, the branch origins, a
// small CFA and an accessory profunda branch over the head.
//
// The wrist for the radial sequence (access-radial-sequence): the arm has a
// position (supinated with the wrist extended, the usual set-up; the left
// arm brought across the abdomen palm up, for a left radial in a patient with
// a LIMA graft; or a neutral, unsupinated forearm in a patient who cannot
// turn the hand palm up) and the wrist is extended or not. A neutral forearm
// carries the artery deeper and to the thumb side under the probe (MODEL);
// a wrist that is not extended leaves a bend just past the needle that the
// wire meets (ultrasound.ts). A scenario can set the arm, a patient who
// cannot supinate, a forearm the previous report called extremely tortuous,
// a tight radial loop and a case whose local anaesthetic is left to the
// operator (the radial fields of SiteOverrides).
// ---------------------------------------------------------------------------

import type { AccessRoute } from "../../types";
import type { PatientProfile } from "../patient/patient";
import { SeededRng } from "../patient/rng";

export type SiteKind = "radial" | "femoral";

/**
 * How the arm lies for a radial puncture (access-radial-sequence; lesson pm-access-radial-puncture, step 2):
 *   supinated    palm up on an arm board, the usual set-up for either wrist;
 *   across-body  the left arm brought across the abdomen palm up on pillows (a left radial worked from the right side);
 *   neutral      the forearm left unsupinated (a patient who cannot turn the hand palm up).
 */
export type ArmPosition = "supinated" | "across-body" | "neutral";
export const ARM_POSITIONS: readonly ArmPosition[] = ["supinated", "across-body", "neutral"];

/** The arm at a radial site (mutable: the operator positions it before the puncture). */
export interface ArmState {
  position: ArmPosition;
  /** the wrist is extended over a roll: it straightens the artery just past the puncture */
  wristExtended: boolean;
  /** the patient cannot supinate the forearm (a scenario setting): 'supinated' and 'across-body' are refused */
  cannotSupinate: boolean;
}

export interface UsTube {
  id: string;
  kind: "artery" | "vein" | "tendon" | "nerve";
  label: string;
  /** reference point of the centre line (mm) */
  xRef: number;
  yRef: number;
  zRef: number;
  /** slope of y and z per mm of x */
  dy: number;
  dz: number;
  /** radius at rest (mm) */
  r: number;
  /** extent along x */
  xFrom: number;
  xTo: number;
  /** probe pressure (0..1) at which it is fully compressed; above 1 it never collapses */
  compressAt: number;
  /** fractional radius change over the cardiac cycle (arteries only) */
  pulsatile: number;
}

export interface UsBone {
  kind: "radius" | "femoral-head";
  /** cylinder along x (radius bone) or sphere (femoral head) */
  shape: "cylinder" | "sphere";
  xRef: number;
  yRef: number;
  zRef: number;
  dz: number;
  r: number;
  xFrom: number;
  xTo: number;
}

export interface SiteLandmarks {
  /** the distal wrist crease (radial) or the inguinal crease (femoral) is x = 0 */
  creaseX: 0;
  /** recommended arteriotomy window along x */
  targetFrom: number;
  targetTo: number;
  /** femoral only */
  ligamentX?: number;
  bifurcationX?: number;
  headFrom?: number;
  headTo?: number;
  /** femoral only: centre of the femoral head along the limb (mm); its inferior border is headFrom */
  headX?: number;
}

/** A stretch of the target artery's anterior wall that is calcified (femoral; site x, mm). */
export interface WallCalcium {
  fromX: number;
  toX: number;
}

export interface AccessSite {
  kind: SiteKind;
  route: AccessRoute;
  side: "right" | "left";
  tubes: UsTube[];
  bones: UsBone[];
  /** subcutaneous fat thickness (mm) */
  fatMm: number;
  /** arterial wall thickness (mm) */
  wallMm: number;
  /** id of the target artery (the one the sheath goes into) */
  arteryId: string;
  landmarks: SiteLandmarks;
  /** default imaging depth (mm) */
  depthMm: number;
  /** needle angle the textbook technique uses (deg from the skin) */
  typicalAngleDeg: number;
  /** femoral: calcified stretches of the target artery's anterior wall (empty when none) */
  calcium: WallCalcium[];
  /**
   * Femoral: small branches of the external iliac artery a micropuncture wire can enter (the inferior
   * epigastric medially, the lateral circumflex iliac laterally; Brilakis 4.2, step 7). They are drawn
   * on ultrasound and fluoroscopy and steer the micro-wire course; the needle model does not puncture
   * them (they arise above the inguinal ligament, beyond the puncture window). Empty at the wrist.
   */
  branches: UsTube[];
  /** radial: the arm (null at the groin) */
  arm?: ArmState | null;
}

/** MODEL PARAMETERS for the access anatomy (see facts/C5.md for the sourced ones). */
export const MP_SITE = {
  /** radial: venae comitantes radius (mm) and their offset from the artery wall (mm) */
  radialVeinR: 0.6,
  radialVeinGap: 0.8,
  /** a vein collapses fully at this probe pressure (0..1) */
  radialVeinCompress: 0.3,
  femoralVeinCompress: 0.45,
  /** arteries only flatten at the top of the pressure range */
  arteryCompress: 1.6,
  /** pulsatile radius change (fraction) */
  radialPulsatile: 0.05,
  femoralPulsatile: 0.04,
  /** wall thickness (mm) */
  radialWall: 0.25,
  femoralWall: 0.45,
  /** radius bone: radius (mm) and its offset deep and lateral to the artery (mm) */
  radiusBoneR: 8,
  radiusBoneDeep: 6,
  radiusBoneLat: 5,
  /** flexor carpi radialis tendon: radius and medial offset (mm) */
  fcrR: 2.2,
  fcrMedial: 7,
  /** femoral vein radius (mm) */
  femoralVeinR: 5.5,
  /** femoral nerve radius and lateral offset from the artery wall (mm) */
  femoralNerveR: 2.5,
  femoralNerveLat: 4,
  /** posterior dive of the CFA towards the ligament (mm depth per mm of x) */
  cfaDive: 0.12,
  /** femoral head radius (mm) and its gap below the artery's back wall (mm) */
  femoralHeadR: 24,
  femoralHeadGap: 14,
  /** subcutaneous fat at the wrist (mm), and at the groin per BMI unit above 20 */
  wristFat: 1.6,
  groinFatBase: 4,
  groinFatPerBmi: 0.9,
  /** imaging depth defaults (mm) */
  radialDepth: 16,
  femoralDepth: 45,
  /** femoral head: lateral offset of its centre from the CFA centre line (mm) */
  femoralHeadLat: 6,
  /** groin fat left above a scenario's near-wall depth preset (mm): fascia and muscle below the fat */
  presetFasciaMm: 4.5,
  /** inferior epigastric and lateral circumflex iliac arteries: radius (mm), origin above the ligament (mm),
   *  length drawn (mm), and their course per mm of x (y: medial or lateral; z: towards the skin) */
  branchR: 1.1,
  ieaAboveLigament: 4,
  lciaAboveLigament: 7,
  branchLen: 60,
  branchDy: 0.55,
  branchDz: -0.25,
  /** accessory profunda: radius as a share of the CFA radius, origin below the head centre (mm), course */
  accessoryProfundaShare: 0.4,
  accessoryProfundaBelowHead: 4,
  /** a calcified stretch must leave this much clear artery (mm) to remain the target window */
  clearWindowMm: 6,
  /**
   * A neutral (unsupinated) forearm: the radial artery lies this much deeper (mm) and this much further to the
   * thumb side (mm) under a probe held where it would be on a supinated wrist (access-radial-sequence).
   */
  neutralDeeperMm: 3,
  neutralLateralMm: 3,
};

/**
 * Sourced values (facts/C5.md):
 * - radial artery depth 0.43 ± 0.13 cm, measured 2 cm proximal to the distal wrist crease, lateral to the flexor
 *   carpi radialis tendon (Sheikh 2024, Cureus, PMC11346669);
 * - radial calibre from the patient profile (S9, Hasan 2025);
 * - CFA diameter 9.8 mm (men) and 8.2 mm (women); CFA depth "usually does not exceed 2 cm"; the femoral vein lies
 *   medial and posterior; the bifurcation lies over the inguinal crease in 76.5%; crease to ligament 6.7 cm on
 *   average; the CFA lies mostly over the femoral head (Anaesthesiol Intensive Ther 2026, PMC13384217).
 */
export const SOURCED_SITE = {
  radialDepthMeanMm: 4.3,
  radialDepthSdMm: 1.3,
  radialMeasureXMm: 20,
  cfaDiamMaleMm: 9.8,
  cfaDiamFemaleMm: 8.2,
  cfaMaxUsualDepthMm: 20,
  bifurcationOverCreaseShare: 0.765,
  creaseToLigamentMm: 67,
};

function siteKind(route: AccessRoute): SiteKind {
  return route === "femoral" ? "femoral" : "radial";
}

/**
 * Overrides a full-case scenario can set on the site anatomy (proc-foundation-scenarios-ledger).
 * Each replaces the drawn value after every random draw has been made, so a site built without
 * overrides is the same as before, and one built with them differs only in the fields named.
 * Values are scenario settings (MODEL PARAMETERS of that scenario), not population data.
 */
export interface SiteOverrides {
  /** radial: depth of the artery's near wall below the skin (mm) */
  radialDepthMm?: number;
  /** subcutaneous fat (mm); at the groin the artery moves deeper by the same amount */
  fatMm?: number;
  /** femoral: inguinal ligament position above the crease (mm) */
  ligamentX?: number;
  /** femoral: CFA bifurcation position relative to the crease (mm, positive proximal) */
  bifurcationX?: number;
  /** target artery radius (mm); for the radial artery prefer the profile's radialDiamMm */
  arteryRadiusMm?: number;
  /**
   * femoral: depth of the CFA's near wall below the skin at the crease (mm). The depth presets of
   * access-femoral-puncture are about 2 cm and about 4 cm (Brilakis 4.2, step 6: 'for an artery about
   * 2 cm deep ... for one about 4 cm deep'). The fat follows unless fatMm is set.
   */
  nearWallMm?: number;
  /** femoral: centre of the femoral head along the limb (mm from the crease); default 0.45 x ligamentX */
  headX?: number;
  /** femoral: calcified stretches of the CFA's anterior wall (site x, mm) */
  calcium?: WallCalcium[];
  /** femoral: origin of the inferior epigastric artery (site x, mm); default just above the ligament */
  ieaOriginX?: number;
  /** femoral: origin of the lateral circumflex iliac artery (site x, mm); default just above the ligament */
  lciaOriginX?: number;
  /** femoral: a small accessory profunda branch from the lateral CFA over the femoral head (Brilakis 4.2, step 15) */
  accessoryProfunda?: boolean;
  /** femoral: a small CFA, its diameter (mm) */
  smallCfaMm?: number;
  /** radial: how the team has laid the arm (default: supinated for a right radial, across the body for a left) */
  armPosition?: ArmPosition;
  /** radial: the wrist not extended at the start (default extended) */
  wristFlexed?: boolean;
  /** radial: the patient cannot supinate the forearm (the arm lies neutral and cannot be turned palm up) */
  cannotSupinate?: boolean;
  /**
   * radial: the previous report called the radial or subclavian route extremely tortuous (Brilakis 4.3, in
   * pm-access-radial-sheath: the case where the heparin may be held until a catheter reaches the aortic root)
   */
  extremeTortuosity?: boolean;
  /** radial: the radial loop (the case's 'radial-loop' variant) is tight: no 0.035 inch wire crosses it, only balloon-assisted tracking */
  tightLoop?: boolean;
  /** the team leaves the local anaesthetic to the operator: the autopilot playing to 'access' stops after the time-out */
  localByOperator?: boolean;
}

/** Build the access-site anatomy for a patient (deterministic per seed); `o` applies a scenario's site overrides. */
export function buildAccessSite(route: AccessRoute, profile: Pick<PatientProfile, "seed" | "sex" | "bmi" | "radialDiamMm">, o: SiteOverrides = {}): AccessSite {
  const rng = new SeededRng(`site:${profile.seed}:${route}`);
  const kind = siteKind(route);
  const side: "right" | "left" = route === "radial-left" ? "left" : "right";
  if (kind === "radial") {
    const rA = o.arteryRadiusMm ?? profile.radialDiamMm / 2;
    // depth: sourced mean and SD, a little deeper with a higher BMI (model parameter 0.05 mm per BMI unit)
    const drawn = Math.max(2.2, Math.min(8, rng.normal(SOURCED_SITE.radialDepthMeanMm, SOURCED_SITE.radialDepthSdMm * 0.6) + (profile.bmi - 27) * 0.05));
    // the arm (after every draw, so a site built without these overrides is unchanged)
    const arm: ArmState = {
      position: o.cannotSupinate ? "neutral" : (o.armPosition ?? (side === "left" ? "across-body" : "supinated")),
      wristExtended: !o.wristFlexed,
      cannotSupinate: !!o.cannotSupinate,
    };
    const neutral = arm.position === "neutral";
    const depth = (o.radialDepthMm ?? drawn) + (neutral ? MP_SITE.neutralDeeperMm : 0);
    const zA = depth + rA; // centre (the measured depth is taken to the near wall)
    const yA = neutral ? MP_SITE.neutralLateralMm : 0;
    const dz = 0.03; // MODEL PARAMETER: the artery deepens slowly proximally under brachioradialis
    const tubes: UsTube[] = [
      { id: "radial-artery", kind: "artery", label: "Radial artery", xRef: 0, yRef: yA, zRef: zA, dy: 0, dz, r: rA, xFrom: -15, xTo: 120, compressAt: MP_SITE.arteryCompress, pulsatile: MP_SITE.radialPulsatile },
      {
        id: "vena-comitans-lat",
        kind: "vein",
        label: "Vena comitans",
        xRef: 0,
        yRef: yA + rA + MP_SITE.radialVeinGap + MP_SITE.radialVeinR,
        zRef: zA - 0.3,
        dy: 0,
        dz,
        r: MP_SITE.radialVeinR,
        xFrom: -15,
        xTo: 120,
        compressAt: MP_SITE.radialVeinCompress,
        pulsatile: 0,
      },
      {
        id: "vena-comitans-med",
        kind: "vein",
        label: "Vena comitans",
        xRef: 0,
        yRef: yA - rA - MP_SITE.radialVeinGap - MP_SITE.radialVeinR * 1.1,
        zRef: zA - 0.2,
        dy: 0,
        dz,
        r: MP_SITE.radialVeinR * 1.1,
        xFrom: -15,
        xTo: 120,
        compressAt: MP_SITE.radialVeinCompress,
        pulsatile: 0,
      },
      { id: "fcr", kind: "tendon", label: "Flexor carpi radialis tendon", xRef: 0, yRef: yA - MP_SITE.fcrMedial, zRef: zA - 0.6, dy: 0, dz: 0.02, r: MP_SITE.fcrR, xFrom: -15, xTo: 70, compressAt: 9, pulsatile: 0 },
    ];
    const bones: UsBone[] = [
      { kind: "radius", shape: "cylinder", xRef: 0, yRef: yA + MP_SITE.radiusBoneLat, zRef: zA + rA + MP_SITE.radiusBoneDeep + MP_SITE.radiusBoneR, dz: 0.04, r: MP_SITE.radiusBoneR, xFrom: -20, xTo: 200 },
    ];
    return {
      kind,
      route,
      side,
      tubes,
      bones,
      fatMm: o.fatMm ?? MP_SITE.wristFat,
      wallMm: MP_SITE.radialWall,
      arteryId: "radial-artery",
      // the measurement site of the sourced depth is 2 cm above the crease; MODEL PARAMETER window 10-35 mm
      landmarks: { creaseX: 0, targetFrom: 10, targetTo: 35 },
      depthMm: MP_SITE.radialDepth,
      typicalAngleDeg: 35,
      calcium: [],
      branches: [],
      arm,
    };
  }

  // femoral
  const male = profile.sex === "M";
  const rDrawn = ((male ? SOURCED_SITE.cfaDiamMaleMm : SOURCED_SITE.cfaDiamFemaleMm) / 2) * rng.clampedNormal(1, 0.08, 0.8, 1.2);
  const rA = o.arteryRadiusMm ?? (o.smallCfaMm !== undefined ? o.smallCfaMm / 2 : rDrawn);
  const fatDrawn = MP_SITE.groinFatBase + Math.max(0, profile.bmi - 20) * MP_SITE.groinFatPerBmi;
  // depth to the near wall at the crease: fat plus a thin fascial layer (model), so that a lean patient sits well
  // under the sourced 2 cm and an obese one exceeds it
  const nearWallDrawn = Math.max(7, fatDrawn + rng.range(3, 6));
  // a scenario's depth preset replaces the drawn depth (after the draw, so the other draws are unchanged)
  const nearWall = o.nearWallMm ?? nearWallDrawn;
  const fat = o.fatMm ?? (o.nearWallMm !== undefined ? Math.max(3, o.nearWallMm - MP_SITE.presetFasciaMm) : fatDrawn);
  const zA = nearWall + rA;
  const ligamentDrawn = Math.round(SOURCED_SITE.creaseToLigamentMm * rng.clampedNormal(1, 0.18, 0.6, 1.4));
  // bifurcation: over the crease in about three quarters (sourced share), higher in the rest (model spread)
  const bifDrawn = rng.next() < SOURCED_SITE.bifurcationOverCreaseShare ? Math.round(rng.range(-12, 10)) : Math.round(rng.range(14, 34));
  const ligamentX = o.ligamentX ?? ligamentDrawn;
  const bifurcationX = o.bifurcationX ?? bifDrawn;
  const yA = 0;
  const dz = MP_SITE.cfaDive;
  const veinR = MP_SITE.femoralVeinR * rng.clampedNormal(1, 0.1, 0.8, 1.25);
  const tubes: UsTube[] = [
    { id: "cfa", kind: "artery", label: "Common femoral artery", xRef: 0, yRef: yA, zRef: zA, dy: 0, dz, r: rA, xFrom: bifurcationX, xTo: ligamentX + 40, compressAt: MP_SITE.arteryCompress, pulsatile: MP_SITE.femoralPulsatile },
    {
      id: "sfa",
      kind: "artery",
      label: "Superficial femoral artery",
      xRef: bifurcationX,
      yRef: yA - rA * 0.25,
      zRef: zA + dz * bifurcationX - 0.5,
      dy: 0.14, // medial as it runs distally (x decreasing)
      dz: 0.03,
      r: rA * 0.78,
      xFrom: -70,
      xTo: bifurcationX,
      compressAt: MP_SITE.arteryCompress,
      pulsatile: MP_SITE.femoralPulsatile,
    },
    {
      id: "pfa",
      kind: "artery",
      label: "Profunda femoris artery",
      xRef: bifurcationX,
      yRef: yA + rA * 0.3,
      zRef: zA + dz * bifurcationX + 1,
      dy: -0.18, // lateral as it runs distally
      dz: -0.3, // and deep
      r: rA * 0.72,
      xFrom: -70,
      xTo: bifurcationX,
      compressAt: MP_SITE.arteryCompress,
      pulsatile: MP_SITE.femoralPulsatile,
    },
    {
      id: "cfv",
      kind: "vein",
      label: "Common femoral vein",
      xRef: 0,
      yRef: yA - rA - veinR - 1.2,
      zRef: zA + 2.5,
      dy: 0.02,
      dz: dz * 0.8,
      r: veinR,
      xFrom: -70,
      xTo: ligamentX + 40,
      compressAt: MP_SITE.femoralVeinCompress,
      pulsatile: 0,
    },
    { id: "femoral-nerve", kind: "nerve", label: "Femoral nerve", xRef: 0, yRef: yA + rA + MP_SITE.femoralNerveLat + MP_SITE.femoralNerveR, zRef: zA - 0.5, dy: 0, dz, r: MP_SITE.femoralNerveR, xFrom: -40, xTo: ligamentX + 40, compressAt: 9, pulsatile: 0 },
  ];
  // the femoral head lies under the CFA, centred between the crease and the ligament (model placement)
  const headX = o.headX ?? Math.round(ligamentX * 0.45);
  const headTop = zA + dz * headX + rA + MP_SITE.femoralHeadGap;
  // over the femoral head, below the ligament and above the bifurcation; a short CFA leaves a narrow window
  let tFrom = Math.max(bifurcationX + 5, headX - MP_SITE.femoralHeadR * 0.6);
  let tTo = Math.min(ligamentX - 15, headX + MP_SITE.femoralHeadR * 0.6);
  if (tTo - tFrom < 6) {
    tFrom = bifurcationX + 3;
    tTo = Math.max(tFrom + 6, ligamentX - 8);
  }
  // anterior-wall calcium: the window is the longest clear stretch of it, when one is long enough
  const calcium = (o.calcium ?? []).map((c) => ({ fromX: Math.min(c.fromX, c.toX), toX: Math.max(c.fromX, c.toX) }));
  if (calcium.length) {
    const clear = clearStretches(tFrom, tTo, calcium);
    const best = clear.sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
    if (best && best[1] - best[0] >= MP_SITE.clearWindowMm) [tFrom, tTo] = best;
  }
  const bones: UsBone[] = [
    { kind: "femoral-head", shape: "sphere", xRef: headX, yRef: yA + MP_SITE.femoralHeadLat, zRef: headTop + MP_SITE.femoralHeadR, dz: 0, r: MP_SITE.femoralHeadR, xFrom: headX - MP_SITE.femoralHeadR, xTo: headX + MP_SITE.femoralHeadR },
  ];
  // the accessory profunda (a scenario setting): a small artery from the lateral CFA wall over the head, running
  // distally, laterally and deep; the needle can enter it
  if (o.accessoryProfunda) {
    const ox = headX - MP_SITE.accessoryProfundaBelowHead;
    const ra = rA * MP_SITE.accessoryProfundaShare;
    tubes.push({ id: "accessory-profunda", kind: "artery", label: "Accessory profunda artery", xRef: ox, yRef: yA + rA + ra * 0.6, zRef: zA + dz * ox + rA * 0.4, dy: -0.25, dz: -0.2, r: ra, xFrom: -40, xTo: ox, compressAt: MP_SITE.arteryCompress, pulsatile: MP_SITE.femoralPulsatile });
  }
  // the inferior epigastric (medial) and lateral circumflex iliac (lateral) arteries arise from the external
  // iliac above the ligament and run cranially, away from it and towards the abdominal wall (model course)
  const branch = (id: string, label: string, ox: number, side: -1 | 1): UsTube => ({
    id,
    kind: "artery",
    label,
    xRef: ox,
    yRef: yA + side * (rA + MP_SITE.branchR),
    zRef: zA + dz * ox,
    dy: side * MP_SITE.branchDy,
    dz: MP_SITE.branchDz,
    r: MP_SITE.branchR,
    xFrom: ox,
    xTo: ox + MP_SITE.branchLen,
    compressAt: MP_SITE.arteryCompress,
    pulsatile: MP_SITE.femoralPulsatile,
  });
  const branches: UsTube[] = [
    branch("iea", "Inferior epigastric artery", o.ieaOriginX ?? ligamentX + MP_SITE.ieaAboveLigament, -1),
    branch("lcia", "Lateral circumflex iliac artery", o.lciaOriginX ?? ligamentX + MP_SITE.lciaAboveLigament, 1),
  ];
  return {
    kind,
    route,
    side,
    tubes,
    bones,
    fatMm: fat,
    wallMm: MP_SITE.femoralWall,
    arteryId: "cfa",
    landmarks: {
      creaseX: 0,
      targetFrom: tFrom,
      targetTo: tTo,
      ligamentX,
      bifurcationX,
      headFrom: headX - MP_SITE.femoralHeadR,
      headTo: headX + MP_SITE.femoralHeadR,
      headX,
    },
    depthMm: Math.max(MP_SITE.femoralDepth, Math.round(zA + rA + 20)),
    typicalAngleDeg: 45,
    calcium,
    branches,
  };
}

/** The stretches of [from, to] clear of every calcified range. */
function clearStretches(from: number, to: number, calcium: readonly WallCalcium[]): [number, number][] {
  let out: [number, number][] = [[from, to]];
  for (const c of calcium) {
    const next: [number, number][] = [];
    for (const [a, b] of out) {
      if (c.toX <= a || c.fromX >= b) next.push([a, b]);
      else {
        if (c.fromX > a) next.push([a, c.fromX]);
        if (c.toX < b) next.push([c.toX, b]);
      }
    }
    out = next;
  }
  return out;
}

/** Is site x on a calcified stretch of the target artery's anterior wall? */
export function calcifiedAt(site: Pick<AccessSite, "calcium">, x: number): boolean {
  const cs = site.calcium;
  for (let i = 0; i < cs.length; i++) if (x >= cs[i].fromX && x <= cs[i].toX) return true;
  return false;
}

/**
 * Where an arterial entry at site x lies against the femoral head (Brilakis 4.2, step 8: the entry should
 * be over the lower half of the head): below its inferior border, over its lower half, over its upper
 * half, or above it. null at the wrist.
 */
export function entryVsHead(site: Pick<AccessSite, "kind" | "landmarks">, x: number): "below" | "lower-half" | "upper-half" | "above" | null {
  const lm = site.landmarks;
  if (site.kind !== "femoral" || lm.headFrom === undefined || lm.headTo === undefined) return null;
  const mid = lm.headX ?? (lm.headFrom + lm.headTo) / 2;
  if (x < lm.headFrom) return "below";
  if (x <= mid) return "lower-half";
  if (x <= lm.headTo) return "upper-half";
  return "above";
}

/** Centre line of a tube at x. */
export function tubeAt(t: UsTube | UsBone, x: number): { y: number; z: number } {
  const dy = "dy" in t ? t.dy : 0;
  return { y: t.yRef + dy * (x - t.xRef), z: t.zRef + t.dz * (x - t.xRef) };
}

/** Normalised arterial pulse shape over the beat (0 at end-diastole, 1 at the systolic peak). MODEL PARAMETER shape. */
export function pulseShape(phase: number): number {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.12) return p / 0.12;
  return Math.exp(-(p - 0.12) / 0.22);
}

/** A multiplier on a tube's radii from outside the probe (a radial artery's tone, a bleb of local anaesthetic pressing on it). */
export interface LumenScale {
  ry: number;
  rz: number;
}

/**
 * Effective radii of a tube now: lateral and vertical semi-axes (compression flattens it vertically). `scale`
 * (access-radial-sequence) narrows the lumen further: the radial artery's tone (both axes) and a bleb of local
 * anaesthetic (the vertical axis); without it the radii are as before.
 */
export function tubeRadii(t: UsTube, pressure: number, phase: number, scale?: LumenScale | null): { ry: number; rz: number } {
  const pulse = t.kind === "artery" ? 1 + t.pulsatile * (pulseShape(phase) - 0.4) : 1;
  const r = t.r * pulse;
  const c = Math.max(0, Math.min(1, pressure / t.compressAt));
  // a vein flattens and widens a little; an artery resists until the top of the range
  const squash = t.kind === "vein" ? c : t.kind === "artery" ? Math.max(0, (pressure - 0.75) / 0.25) * 0.55 : 0;
  const ry = r * (1 + 0.25 * squash);
  const rz = r * Math.max(0.02, 1 - squash);
  return scale ? { ry: ry * scale.ry, rz: Math.max(r * 0.02, rz * scale.rz) } : { ry, rz };
}

/** Is x inside a tube's extent? */
export const inExtent = (t: { xFrom: number; xTo: number }, x: number) => x >= t.xFrom && x <= t.xTo;

// ---------------------------------------------------------------------------
// The forearm after a radial injury (diag-spasm-states)
//
// A radial artery avulsed by a forceful pull through a gripping spasm bleeds
// into the forearm (the module text: forceful withdrawal of a gripped sheath
// or catheter can avulse the radial artery, leading to forearm bleeding and,
// in the worst case, compartment syndrome; pm-engaging-spasm,
// src/content/manual/pci-manual/07-engaging.ts line 1316). The haematoma
// starts at once and grows towards a ceiling; the forearm check at the end of
// the case finds a visible swelling, a tense forearm, or nothing. The volumes
// and the rate are MODEL PARAMETERS (docs/realism/facts/pkg-diag-spasm-states.md).
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of the forearm haematoma after an avulsion. */
export const MP_FOREARM_HAEMATOMA = {
  /** the volume at once (mL), and the further volume per newton of the pull above the avulsion force */
  avulsionMl: 30,
  perNewtonMl: 2,
  /** growth while nothing compresses it (mL/min) and its ceiling (mL) */
  mlPerMin: 6,
  capMl: 250,
  /** a swelling is visible from this volume (mL) and the forearm is tense from this volume (mL) */
  visibleMl: 20,
  tenseMl: 120,
};

/** A forearm haematoma after a radial injury. */
export interface ForearmHaematoma {
  cause: "avulsion";
  /** patient clock time of the injury, s */
  t0: number;
  /** volume at the injury, mL */
  ml0: number;
}

/** The haematoma a forceful pull through spasm leaves: the hub axial force (N) above the avulsion force (N). */
export function forearmHaematomaAfterAvulsion(t: number, hubAxialN: number, avulsionN: number): ForearmHaematoma {
  const M = MP_FOREARM_HAEMATOMA;
  return { cause: "avulsion", t0: t, ml0: Math.min(M.capMl, M.avulsionMl + Math.max(0, hubAxialN - avulsionN) * M.perNewtonMl) };
}

/** The haematoma's volume at time t (mL). */
export function forearmHaematomaMl(h: ForearmHaematoma, t: number): number {
  const M = MP_FOREARM_HAEMATOMA;
  return Math.min(M.capMl, h.ml0 + (Math.max(0, t - h.t0) / 60) * M.mlPerMin);
}

/** What the forearm check finds at time t: nothing, a visible swelling, or a tense forearm. */
export function forearmFinding(h: ForearmHaematoma | null, t: number): { grade: "none" | "visible" | "tense"; ml: number; text: string } {
  const M = MP_FOREARM_HAEMATOMA;
  const ml = h ? forearmHaematomaMl(h, t) : 0;
  if (ml >= M.tenseMl) return { grade: "tense", ml, text: "The forearm is swollen and tense along the radial artery, and the patient has pain on moving the fingers." };
  if (ml >= M.visibleMl) return { grade: "visible", ml, text: "A swelling is coming up along the forearm above the wrist." };
  return { grade: "none", ml, text: "The forearm is soft, with no swelling." };
}

// ---------------------------------------------------------------------------
// Where a femoral puncture bleeds (diag-rhythm-haemodynamic-events)
//
// The module text: the site of the puncture decides much of the risk; above
// the femoral head and the origin of the inferior epigastric artery invites
// retroperitoneal bleeding, below the femoral head pseudoaneurysm and
// fistula (Brilakis 4.2.3; cm-access-complications-femoral-bleeding,
// src/content/manual/complication-management/06-access-complications.ts line
// 74). Blood that tracks up behind the peritoneum shows nothing at the groin
// until the patient is in shock (line 69), and a slow pulse is common with
// it, so a slow pulse does not make the fall vagal (lines 145 and 225). The
// diagnostic lab's hidden bleed (the vagal look-alike) takes its space from
// here; the rate and the share of vagal slowing are MODEL PARAMETERS
// (docs/realism/facts/pkg-diag-rhythm-haemodynamic-events.md).
// ---------------------------------------------------------------------------

/** MODEL PARAMETERS of a bleeding femoral puncture. */
export const MP_PUNCTURE_BLEED = {
  /**
   * a hidden retroperitoneal bleed from a high puncture, mL/s, and the volume after which it slows (mL):
   * a brisk bleed that a litre of fluid does not keep up with (the shared cause model's bleed slows after
   * 420 mL; this one is the shock-causing bleed the lesson's algorithm is for)
   */
  retroperitonealMlS: 3,
  retroperitonealSlowAfterMl: 1500,
  /** the vagal slowing that comes with it (0..1, the engine's vagal level) and how long it is held, s */
  slowPulseLevel: 0.55,
  slowPulseHoldS: 600,
  /** an entry over the femoral head that oozes into the groin, where it can be seen and felt, mL/s */
  groinMlS: 0.15,
} as const;

/** Where the blood from a femoral entry goes, and whether the operator can see it at the groin. */
export interface PunctureBleed {
  /** retroperitoneal: above the femoral head (hidden); groin: over the head (a visible haematoma); none at the wrist */
  space: "retroperitoneal" | "groin" | "none";
  /** the bleed's rate when the puncture bleeds, mL/s (MODEL PARAMETER) */
  rateMlS: number;
  /** the groin shows it (a haematoma that can be seen and felt) */
  visibleAtGroin: boolean;
  /** a slow pulse is common with it (Brilakis), so it can pass for a vagal reaction */
  slowPulse: boolean;
}

/**
 * Where a bleeding femoral entry at site x sends its blood: above the femoral head, behind the
 * peritoneum, hidden and often with a slow pulse; over or below the head, into the groin, where it
 * shows. At the wrist, nothing here (the forearm haematoma above is the radial bleed).
 */
export function punctureBleed(site: Pick<AccessSite, "kind" | "landmarks">, x: number): PunctureBleed {
  const where = entryVsHead(site, x);
  const M = MP_PUNCTURE_BLEED;
  if (where === null) return { space: "none", rateMlS: 0, visibleAtGroin: false, slowPulse: false };
  if (where === "above") return { space: "retroperitoneal", rateMlS: M.retroperitonealMlS, visibleAtGroin: false, slowPulse: true };
  return { space: "groin", rateMlS: M.groinMlS, visibleAtGroin: true, slowPulse: false };
}

/** A site x above the femoral head (a high puncture), mm: the head's upper border plus a margin; null at the wrist. */
export function highPunctureX(site: Pick<AccessSite, "kind" | "landmarks">, marginMm = 8): number | null {
  const lm = site.landmarks;
  if (site.kind !== "femoral" || lm.headTo === undefined) return null;
  return lm.headTo + Math.max(0.5, marginMm);
}
