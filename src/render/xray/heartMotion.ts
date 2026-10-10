// ---------------------------------------------------------------------------
// Heart motion field, driven by the patient clock (ClockState).
//
// A material point of the heart at surface coordinates (ell, phi, h) with rest
// position p0 moves by u(p0, t), the sum of:
//   - longitudinal base descent towards a nearly fixed apex, largest at the
//     annulus and fading to zero at the apex. Its amplitude varies round the
//     ring: lateral tricuspid annulus (the acute margin, where the RCA runs)
//     about 26 mm, mitral annulus 13-17 mm, anterior aortic plane 14 mm
//     (Ochs 2017, CMR, 209 healthy adults; see docs/realism/facts/S3.md).
//   - twist about the long axis: the apex turns anticlockwise and the base
//     clockwise, seen from the apex (means of Cheng 2017 and Halcsik 2026: apex +9.7°, base -5.4°;
//     Buckberg 2011 for the sign and the timing of untwisting).
//   - radial thickening (epicardium moves inwards a little).
//   - whole-heart translation towards the left, inferior and anterior during
//     contraction (Shechter 2006, biplane angiography), and a whole-heart
//     rotation about the base (the apical thrust; model parameter fitted to
//     the library's scan-line tracks).
//   - an acute-margin swing of the RV free wall towards the septum.
//   - a regional phase lead of the RV (and so the RCA) over the LV.
//
// Timing follows the cardiac cycle in seconds, not in phase units: an
// electromechanical delay and isovolumic contraction, ejection up to the
// clock's end-systole (Bazett-scaled, so systole shortens less than diastole
// with rising heart rate), isovolumic relaxation, rapid filling with a fast
// return, a diastasis that shrinks and vanishes as the heart rate rises, and an
// atrial kick that completes the return at end-diastole. Durations other than
// end-systole are model parameters (named below).
//
// The aortic root follows the base descent, attenuated with height above the
// valve because the ascending aorta tethers it; rootDisplacement() gives the
// motion at any height so the catheter tip can bob with the ostium.
// ---------------------------------------------------------------------------

import type { Vec3 } from "../../types";
import type { ClockState } from "../../simulation/clock/cardiacClock";
import type { HeartFrame, Motion, MotionAmplitudes, MotionEnvelopes } from "./heart";

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const D2R = Math.PI / 180;

/**
 * Default amplitudes.
 * - apexRotDeg, baseRotDeg: mean of two opened sources: Cheng et al. 2017 (doi:10.1532/hsf.1655), normal hearts,
 *   CMR feature tracking, apex anticlockwise 10.2 ± 4.8°, base clockwise 7.0 ± 3.3° (seen from the apex); Halcsik et
 *   al. 2026 (doi:10.21037/qims-2026-1-0138), 3D speckle tracking in healthy non-pregnant controls, apical rotation
 *   9.2 ± 3.2°, basal -3.8 ± 1.8°. Means: apex +9.7°, base -5.4°.
 * - mapseLateral 16, mapseSeptal 13, aapse 14, tapse 26 mm: Ochs et al. 2017 (doi:10.1007/s10554-016-1058-y), CMR,
 *   209 healthy adults: MAPSE anterolateral/inferolateral 16 ± 3, inferoseptal 13 ± 3, AAPSE 14 ± 3, TAPSE 26 ± 4 mm.
 * - radial, trans, rvSwing, wholeRot: model parameters, fitted so projected motion matches the library measurements
 *   (scripts/anatomy_validation/fit_motion.ts: NCC landmark P10-P90 RCA LAO 17.95 mm, LAD RAO cranial 8.25 mm,
 *   ratio 2.18; and the xtrack scan-line tracks of the RCA and LAD). radial 0.12 is about twice a physiological
 *   epicardial inward motion (it was kept: lowering it shrinks the across-vessel LAD motion the fit is short of).
 *   The translation direction (left, inferior, anterior) is from Shechter et al. 2006 (doi:10.1109/TMI.2005.862752).
 */
export const DEFAULT_AMPLITUDES: Required<MotionAmplitudes> = {
  contractility: 1,
  apexRotDeg: 9.7,
  baseRotDeg: -5.4,
  mapseLateral: 16,
  mapseSeptal: 13,
  tapse: 26,
  aapse: 14,
  radial: 0.12, // model parameter (fitted with scripts/anatomy_validation/fit_motion.ts)
  trans: v(1.92, -1.92, 1.536), // model parameter (direction from Shechter 2006; size refitted with wholeRot and rvSwing, fit_motion.ts)
  rvSwing: 15, // model parameter (refitted with the RCA terms of fit_motion.ts; 17 moved the acute marginal >3 mm inside the fitted silhouette)
  // whole-heart rotation about the base centre, 5.8° at end-systole: the apex moves forwards, upwards and to the right
  // (the apical thrust) while the base is held by the great vessels. Model parameter fitted with fit_motion.ts against
  // the xtrack lines and the NCC P10-P90 (a systolic whole-heart swing exists: Negishi et al. 2015,
  // doi:10.1016/j.echo.2015.05.011; no opened source gives its size in the catheter-lab frame).
  wholeRot: v(0, -5, 3),
};

// ---- timing model parameters (s) ----
/** R wave to the onset of shortening (electromechanical delay plus isovolumic contraction) at RR 1 s; model parameter */
export const T_ONSET = 0.045;
/**
 * Exponent of the coronary rest windows' scaling with RR: duration ∝ RR^REST_EXP. Derived from Jahnke et al. 2006
 * (doi:10.1148/radiol.2383042019): rest periods at 82.6 and 61.3 beats/min (RR 726 and 979 ms) were 111.8 and
 * 201.8 ms for the left coronary artery (exponent 1.97) and 83.1 and 134.8 ms for the RCA (1.62); 1.8 is the mean.
 * It scales the end-systolic hold (T_ES_HOLD) and the end-diastolic pause (T_ATRIAL_END), the rest windows that
 * remain above 80 beats/min; applying it to those two windows is a model extrapolation (Jahnke measured whole rest
 * periods, not these sub-windows). The onset delay is not scaled by it (ONSET_EXP).
 */
export const REST_EXP = 1.8;
/** rest-window scale for a beat (1 at RR 1 s) */
const restScale = (rr: number) => Math.pow(Math.min(1.5, Math.max(0.3, rr)), REST_EXP);
/**
 * Onset delay for a beat: T_ONSET at RR 1 s, shortening only weakly with the cycle (RR^ONSET_EXP). The pre-ejection
 * interval changes far less with heart rate than the rest windows do (it is linear in RR with a small slope, Van der
 * Hoeven et al. 1977, doi:10.1136/hrt.39.3.242; no constant taken). ONSET_EXP is a model parameter: 45 ms at 60
 * beats/min, 34 ms at 110, 31 ms at 130.
 */
export const ONSET_EXP = 0.5;
const onsetFor = (rr: number) => T_ONSET * Math.pow(Math.min(1.5, Math.max(0.3, rr)), ONSET_EXP);
/**
 * End-systolic hold at RR 1 s: the annulus keeps its end-systolic position for the first part of isovolumic
 * relaxation (an end-systolic rest period exists: Shechter et al. 2005, doi:10.1118/1.1836291, about 76-80 ms below
 * 1 mm displacement). The 60 ms (at most 80% of isovolumic relaxation) and its scaling with RR^REST_EXP (the exponent of the Jahnke 2006 rest periods,
 * extrapolated to this window) are model parameters.
 */
export const T_ES_HOLD = 0.06;
/** isovolumic relaxation; model parameter */
export const T_IVR = 0.07;
/** rapid filling (fast return of the annulus); model parameter */
export const T_RAPID = 0.16;
/** atrial contraction window before the next R wave: [rr - T_ATRIAL_START, rr - T_ATRIAL_END]; model parameters */
export const T_ATRIAL_START = 0.15;
export const T_ATRIAL_END = 0.01;
/** RV lead over the LV; model parameter */
export const T_RV_LEAD = 0.03;
/** fraction of the excursion still to be recovered by the atrial kick after rapid filling; model parameter */
export const ATRIAL_SHARE = 0.25;
/** longitudinal excursion lost during isovolumic relaxation; model parameter */
const IVR_RETURN = 0.1;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const rc = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x)); // raised cosine 0→1
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Durations of the diastolic sub-phases for one beat, compressed when diastole is short (fast heart rates). */
function diastolicTiming(rr: number, es: number) {
  let ivr = T_IVR,
    rapid = T_RAPID;
  let aStart = rr - T_ATRIAL_START;
  // the end-diastolic pause before the next R wave shortens with the other rest windows (at fast rates the atrial
  // kick runs into the next isovolumic contraction)
  const aEnd = rr - T_ATRIAL_END * restScale(rr);
  const avail = aStart - es;
  if (avail < ivr + rapid) {
    // compress relaxation and rapid filling, down to 45% of nominal; beyond that the atrial kick
    // fuses with rapid filling (E/A fusion) and starts when rapid filling ends
    const k = Math.max(0.45, avail / (ivr + rapid));
    ivr *= k;
    rapid *= k;
    aStart = Math.max(aStart, es + ivr + rapid);
  }
  return { ivr, rapid, aStart: Math.min(aStart, aEnd - 0.02), aEnd };
}

/** Longitudinal shortening envelope at tInBeat (0 end-diastole … 1 end-systole). */
export function longEnvelope(t: number, rr: number, es: number): number {
  const tt = ((t % rr) + rr) % rr;
  const { ivr, rapid, aStart, aEnd } = diastolicTiming(rr, es);
  const t0 = onsetFor(rr);
  if (tt < t0) return 0;
  if (tt < es) {
    const x = (tt - t0) / Math.max(0.05, es - t0);
    // ejection: faster early (peak annular velocity in the first third of ejection)
    return rc(Math.pow(clamp01(x), 0.8));
  }
  const tRel = es + ivr;
  const tRapid = tRel + rapid;
  // end-systolic rest: the annulus holds its end-systolic position for the first part of isovolumic relaxation
  const hold = Math.min(ivr * 0.8, T_ES_HOLD * restScale(rr));
  let val: number;
  if (tt < es + hold) val = 1;
  else if (tt < tRel) val = 1 - IVR_RETURN * ((tt - es - hold) / Math.max(1e-3, ivr - hold));
  else if (tt < tRapid) {
    const top = 1 - IVR_RETURN;
    val = top - (top - ATRIAL_SHARE) * rc((tt - tRel) / Math.max(1e-3, rapid));
  } else {
    // diastasis: slow drift
    const span = Math.max(1e-3, aStart - tRapid);
    val = ATRIAL_SHARE - 0.03 * clamp01((tt - tRapid) / span);
  }
  if (tt >= aStart) {
    const start = tt < tRapid ? val : ATRIAL_SHARE - 0.03;
    val = Math.min(val, start * (1 - rc((tt - aStart) / Math.max(1e-3, aEnd - aStart))));
  }
  return clamp01(val);
}

/** Twist envelope: rises with ejection and untwists during isovolumic relaxation and early rapid filling (Buckberg 2011). */
export function twistEnvelope(t: number, rr: number, es: number): number {
  const tt = ((t % rr) + rr) % rr;
  const { ivr, rapid } = diastolicTiming(rr, es);
  const t0 = onsetFor(rr);
  if (tt < t0) return 0;
  if (tt < es) return rc(Math.pow(clamp01((tt - t0) / Math.max(0.05, es - t0)), 0.9));
  if (tt < es + ivr) return 1 - 0.45 * ((tt - es) / Math.max(1e-3, ivr));
  if (tt < es + ivr + rapid * 0.6) return 0.55 * (1 - rc((tt - es - ivr) / Math.max(1e-3, rapid * 0.6)));
  return 0;
}

/** All envelopes for a clock state. */
export function envelopesAt(s: Pick<ClockState, "tInBeat" | "rr" | "endSystole">): MotionEnvelopes {
  const { tInBeat: t, rr, endSystole: es } = s;
  const long = longEnvelope(t, rr, es);
  return {
    long,
    longRv: longEnvelope(t + T_RV_LEAD, rr, es),
    twist: twistEnvelope(t, rr, es),
    radial: long,
    trans: long,
  };
}

/**
 * Myocardial bridge compression (0 … 1): zero in diastole, maximal at end-systole, released during
 * relaxation and rapid filling (systolic "milking"). Multiply a bridged segment's radius by
 * (1 - depth × bridgeCompression).
 */
export function bridgeCompression(s: Pick<ClockState, "tInBeat" | "rr" | "endSystole"> | Motion): number {
  if ("contraction" in s) return s.bridge ?? smoothstep(0.3, 0.95, s.env?.long ?? s.contraction);
  return smoothstep(0.3, 0.95, longEnvelope(s.tInBeat, s.rr, s.endSystole));
}

export interface MotionOptions {
  /** per-patient amplitudes (merged over the defaults) */
  amp?: MotionAmplitudes;
}

/**
 * Motion for a clock state: what samplePos / surfacePoint accept. Fixed (aortic-frame) samples move
 * with the aortic root, so callers must move the catheter with rootDisplacement() as well.
 */
export function motionAt(state: Pick<ClockState, "tInBeat" | "rr" | "endSystole"> & Partial<ClockState>, _H?: HeartFrame, opts: MotionOptions = {}): Motion {
  const rhythm = state.rhythm;
  if (rhythm === "asystole" || rhythm === "vf") {
    // no coordinated contraction: VF gives a small fast quiver, asystole none
    const q = rhythm === "vf" ? 0.06 * (0.5 + 0.5 * Math.sin((state.t ?? 0) * 2 * Math.PI * 5.3)) : 0;
    return { contraction: q, env: { long: q, longRv: q, twist: q * 0.5, radial: q, trans: q }, amp: opts.amp, bridge: 0, rootMoves: true };
  }
  const env = envelopesAt(state);
  return { contraction: env.long, env, amp: opts.amp, bridge: smoothstep(0.3, 0.95, env.long), rootMoves: true };
}

/** Legacy motion from a single contraction value (no root motion). */
export function motionFromContraction(e: number): Motion {
  return { contraction: e };
}

/** A ClockState-like object for a time and heart rate, for callers without a CardiacClock (tests, previews). */
export function clockStateAt(t: number, hr = 65, qtc = 0.4): Pick<ClockState, "t" | "hr" | "tInBeat" | "rr" | "endSystole" | "phase" | "systole" | "beat"> {
  const rr = 60 / hr;
  const beat = Math.floor(t / rr);
  const tInBeat = t - beat * rr;
  const endSystole = Math.min(0.9 * rr, qtc * Math.sqrt(rr));
  return { t, hr, tInBeat, rr, endSystole, phase: tInBeat / rr, systole: tInBeat < endSystole, beat };
}

function amps(m: Motion): Required<MotionAmplitudes> {
  return m.amp ? { ...DEFAULT_AMPLITUDES, ...m.amp } : DEFAULT_AMPLITUDES;
}

function envOf(m: Motion): MotionEnvelopes {
  if (m.env) return m.env;
  const e = m.contraction;
  return { long: e, longRv: e, twist: e, radial: e, trans: e };
}

/** Wrap an angle to (-180, 180]. */
const wrap = (a: number) => {
  let x = ((a + 180) % 360 + 360) % 360 - 180;
  if (x === -180) x = 180;
  return x;
};

/** RV free-wall weight and position (0 at the grooves, 1 mid free wall) from the groove tables. */
function rvRegion(H: HeartFrame, u: number, phiDeg: number): { w: number; mid: number } {
  const uu = Math.max(0, Math.min(1, u));
  const aiv = grooveAtSafe(H, "aiv", uu);
  let piv = grooveAtSafe(H, "piv", uu);
  if (piv > 0) piv -= 360; // posterior groove expressed on the right side (e.g. -170)
  let phi = wrap(phiDeg);
  if (phi > aiv + 40) phi -= 360; // far left / posterior: outside the RV span
  const span = aiv - piv;
  const f = (aiv - phi) / span; // 0 at the anterior groove, 1 at the posterior groove
  const ramp = 10 / span;
  const w = smoothstep(-ramp, ramp, f) * smoothstep(-ramp, ramp, 1 - f);
  // the RV does not reach the apex
  const apexFade = 1 - smoothstep(0.75, 0.92, uu);
  // the free wall moves almost as a whole; only close to the grooves does the septal value take over
  return { w: w * apexFade, mid: Math.sqrt(Math.max(0, Math.sin(Math.PI * clamp01(f)))) };
}

function grooveAtSafe(H: HeartFrame, which: "aiv" | "piv", u: number): number {
  const t = which === "aiv" ? H.aiv : H.piv;
  if (!t || !t.length) return which === "aiv" ? 15 : 190;
  const x = u * (t.length - 1);
  const i = Math.floor(x);
  let a = t[Math.min(t.length - 1, i)],
    b = t[Math.min(t.length - 1, i + 1)];
  // beyond the RV apex: hold the last finite value
  if (Number.isNaN(a) || Number.isNaN(b)) {
    let k = Math.min(t.length - 1, i);
    while (k > 0 && Number.isNaN(t[k])) k--;
    a = b = Number.isNaN(t[k]) ? (which === "aiv" ? 15 : 190) : t[k];
  }
  return a + (b - a) * (x - i);
}

/** Mitral-ring annular descent by angle on the LV free wall (mm), from the Ochs 2017 regional MAPSE values. */
function lvAnnularDescent(phiDeg: number, a: Required<MotionAmplitudes>): number {
  // anterior (phi 0) ≈ AAPSE/anterior MAPSE, lateral and inferior ≈ lateral MAPSE
  const c = Math.cos(phiDeg * D2R);
  const lateral = 1 - Math.max(0, c); // 0 anterior … 1 lateral/inferior
  return a.aapse + (a.mapseLateral - a.aapse) * lateral;
}

/**
 * Displacement of a material point (rest position p0) for motion m, in the aortic frame (mm).
 * Called by heart.ts surfacePoint for every vessel sample each frame.
 */
export function displace(H: HeartFrame, ell: number, phiDeg: number, h: number, p0: Vec3, m: Motion): Vec3 {
  const a = amps(m);
  const env = envOf(m);
  const c = a.contractility;
  const u = (ell + 1) / 2;
  const { w: wRv, mid } = rvRegion(H, u, phiDeg);
  const L = H.L;
  // --- longitudinal base descent ---
  const dLv = lvAnnularDescent(phiDeg, a);
  const dRv = a.mapseSeptal + (a.tapse - a.mapseSeptal) * mid;
  const dAnn = (1 - wRv) * dLv + wRv * dRv;
  // fades to the apex; above the base plane the atria stretch, so it fades upwards too
  const fade = u >= 0 ? 1 - Math.min(1, u) : Math.max(0, 1 + u / 0.5);
  const eL = (1 - wRv) * env.long + wRv * env.longRv;
  const descent = c * dAnn * fade * eL;
  // --- twist about the long axis (right-handed about L = anticlockwise seen from the apex) ---
  const uc = Math.max(0, Math.min(1, u));
  let rotDeg = a.baseRotDeg + (a.apexRotDeg - a.baseRotDeg) * uc;
  if (u < 0) rotDeg = a.baseRotDeg * Math.max(0, 1 + u / 0.3);
  const th = c * rotDeg * env.twist * D2R;
  const rx = p0.x - H.base.x,
    ry = p0.y - H.base.y,
    rz = p0.z - H.base.z;
  const along = rx * L.x + ry * L.y + rz * L.z;
  // radial vector from the axis
  const qx = rx - L.x * along,
    qy = ry - L.y * along,
    qz = rz - L.z * along;
  const cs = Math.cos(th) - 1,
    sn = Math.sin(th);
  // Rodrigues on the radial vector (q ⊥ L): q(cos-1) + (L×q) sin
  const kx = L.y * qz - L.z * qy,
    ky = L.z * qx - L.x * qz,
    kz = L.x * qy - L.y * qx;
  let dx = qx * cs + kx * sn,
    dy = qy * cs + ky * sn,
    dz = qz * cs + kz * sn;
  // --- radial thickening (inwards), not above the base ---
  const kr = u >= 0 ? -a.radial * c * env.radial : 0;
  dx += qx * kr;
  dy += qy * kr;
  dz += qz * kr;
  // --- RV free wall swing towards the septum (inwards on the free wall) ---
  if (wRv > 0 && u >= 0) {
    const ql = Math.hypot(qx, qy, qz) || 1;
    const sw = (-a.rvSwing * c * wRv * mid * env.longRv * (1 - uc * 0.5)) / ql;
    dx += qx * sw;
    dy += qy * sw;
    dz += qz * sw;
  }
  // --- longitudinal and whole-heart translation ---
  const tr = c * env.trans;
  dx += L.x * descent + a.trans.x * tr;
  dy += L.y * descent + a.trans.y * tr;
  dz += L.z * descent + a.trans.z * tr;
  // --- whole-heart rotation about the centre of the base plane (the great vessels hold the base; the apex swings) ---
  const w = a.wholeRot;
  const wl = Math.hypot(w.x, w.y, w.z);
  if (wl > 1e-9 && tr !== 0) {
    const rf = u >= 0 ? 1 : Math.max(0, 1 + u / 0.5); // fades above the base like the descent
    const ang = wl * D2R * tr * rf;
    if (ang !== 0) {
      const ax = w.x / wl,
        ay = w.y / wl,
        az = w.z / wl;
      // position after the other terms, relative to the pivot
      const px = rx + dx,
        py = ry + dy,
        pz = rz + dz;
      const ca = Math.cos(ang) - 1,
        sa = Math.sin(ang);
      const kd = ax * px + ay * py + az * pz;
      dx += px * ca + (ay * pz - az * py) * sa - ax * kd * ca;
      dy += py * ca + (az * px - ax * pz) * sa - ay * kd * ca;
      dz += pz * ca + (ax * py - ay * px) * sa - az * kd * ca;
    }
  }
  void h;
  return v(dx, dy, dz);
}

/** Attenuation of the root's systolic motion with height above the valve plane (model parameter: tethering by the ascending aorta). */
export function rootAttenuation(yAboveValve: number): number {
  if (yAboveValve <= 0) return 1;
  return 0.1 + 0.9 * Math.exp(-yAboveValve / 22);
}

/**
 * Displacement of the aortic root at a height above the valve plane (aortic frame, mm): the
 * anterior aortic plane descends along the long axis (AAPSE, Ochs 2017), attenuated with height,
 * plus half the whole-heart translation. `H` supplies the long axis (defaults to the nominal heart axis).
 */
export function rootDisplacement(s: Pick<ClockState, "tInBeat" | "rr" | "endSystole"> | Motion, yAboveValve = 14, H?: Pick<HeartFrame, "L">, amp?: MotionAmplitudes): Vec3 {
  const m: Motion = "contraction" in s ? s : motionAt(s, undefined, { amp });
  if ("contraction" in s && !s.rootMoves) return v(0, 0, 0);
  const a = amp ? { ...DEFAULT_AMPLITUDES, ...amp } : amps(m);
  const env = envOf(m);
  const L = H?.L ?? NOMINAL_L;
  const k = a.contractility * a.aapse * rootAttenuation(yAboveValve) * env.long;
  const t = a.contractility * env.trans * 0.5;
  return v(L.x * k + a.trans.x * t, L.y * k + a.trans.y * t, L.z * k + a.trans.z * t);
}

/** Nominal long axis (azimuth 45°, 42° below horizontal) for callers without a heart frame. */
const NOMINAL_L: Vec3 = (() => {
  const az = 45 * D2R,
    el = 42 * D2R;
  return v(Math.sin(az) * Math.cos(el), -Math.sin(el), Math.cos(az) * Math.cos(el));
})();

/**
 * Coupling of an engaged catheter to the root motion as a function of distance from its tip (mm):
 * 1 at the tip, decaying along the shaft (model parameter: 45 mm length constant, so the shaft above
 * the root moves a few millimetres, as measured on library cines, about 15 px at 512). Use only for
 * the legacy catheter path: a rod solver running in moving lumens already carries this motion.
 */
export function catheterTether(sFromTipMm: number): number {
  return Math.exp(-Math.max(0, sFromTipMm) / 45);
}

/**
 * Still fraction for tests and validation: share of frames whose mean landmark speed is below a threshold.
 * series[k][i] is the position of landmark i at frame k. The threshold is `frac` × the 95th-percentile speed
 * of this series, or an absolute speed (mm/s) when `absMmS` is given (comparable across heart rates).
 */
export function stillFraction(series: Vec3[][], fps: number, frac = 0.25, absMmS?: number): number {
  const speeds: number[] = [];
  for (let k = 1; k < series.length; k++) {
    let s = 0;
    for (let i = 0; i < series[k].length; i++) {
      const p = series[k][i],
        q = series[k - 1][i];
      s += Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
    }
    speeds.push((s / series[k].length) * fps);
  }
  const sorted = [...speeds].sort((x, y) => x - y);
  const thr = absMmS ?? frac * (sorted[Math.floor(0.95 * (sorted.length - 1))] || 1);
  return speeds.filter((x) => x < thr).length / Math.max(1, speeds.length);
}

// ---- endocardial wall motion (ventriculogram cavity, diag-lv-aorta-render) ----------------------
//
// The opacified LV cavity of a ventriculogram (lvGram.ts) is drawn from the endocardium, whose
// systolic inward excursion differs by segment. The epicardial field above is not changed by it:
// the coronaries and the silhouette keep their motion, so every other render is as before.

/** Wall-motion classes read on a ventriculogram (module text: hb-cardiac-catheterisation, "Reading the ventriculogram"). */
export type WallMotionClass = "normal" | "hypokinetic" | "akinetic" | "dyskinetic";

/**
 * Systolic endocardial excursion of a segment as a share of the normal inward excursion: 1 uniform
 * concentric contraction, below 1 reduced, 0 absent, negative paradoxical (outward). The class names
 * are the module's; the numbers are MODEL PARAMETERS (diag-lv-aorta-render), chosen so that each class
 * is distinct by eye on a cine run, not measured.
 */
export const WALL_MOTION_SCALE: Record<WallMotionClass, number> = {
  normal: 1,
  hypokinetic: 0.45,
  akinetic: 0,
  dyskinetic: -0.3,
};

/**
 * Normal endocardial motion of the LV cavity at end-systole (MODEL PARAMETERS, diag-lv-aorta-render):
 * - radialShortening: share of the end-diastolic cavity radius lost at end-systole by a normal segment.
 *   With the longitudinal shortening below it gives the nominal cavity an ejection fraction of about
 *   60% (lvGram.test.ts checks the volumes); it is not a measured fractional shortening.
 * - longShortenMm: base-to-apex shortening of the cavity (the annulus descends towards a nearly fixed
 *   apex); the mean of the lateral and septal MAPSE of DEFAULT_AMPLITUDES (Ochs 2017, see above).
 * - apexExcursionMm: axial excursion of the apical endocardium for a scale of 1 (inwards; a dyskinetic
 *   apex moves outwards by the scale times this).
 */
export const LV_ENDOCARDIUM = {
  radialShortening: 0.33,
  longShortenMm: (DEFAULT_AMPLITUDES.mapseLateral + DEFAULT_AMPLITUDES.mapseSeptal) / 2,
  apexExcursionMm: 6,
};

/** Excursion scale of a wall-motion class, or a numeric scale as given. */
export function wallMotionScale(w: WallMotionClass | number): number {
  return typeof w === "number" ? w : WALL_MOTION_SCALE[w];
}

/** The class nearest to an excursion scale (for a reader's grade or the debrief). */
export function wallMotionClassOf(k: number): WallMotionClass {
  if (k < -0.1) return "dyskinetic";
  if (k < 0.2) return "akinetic";
  if (k < 0.75) return "hypokinetic";
  return "normal";
}

/**
 * Endocardial radius at a contraction envelope (0 end-diastole … 1 end-systole) for a segment whose
 * excursion scale is k, under a global function scale g (1 normal; lvGram derives it from the LVEF).
 * A negative k moves the wall outwards (dyskinesis).
 */
export function endocardialRadius(r0: number, k: number, env: number, g = 1): number {
  return Math.max(0, r0 * (1 - LV_ENDOCARDIUM.radialShortening * g * k * Math.max(0, Math.min(1, env))));
}

/**
 * Contraction envelope of the LV endocardium for a clock state (0 end-diastole … 1 end-systole): the
 * radial envelope of the epicardial field, so the cavity and the vessels beat together. VF gives the
 * same small quiver and asystole none (motionAt).
 */
export function endocardialEnvelope(state: Pick<ClockState, "tInBeat" | "rr" | "endSystole"> & Partial<ClockState>): number {
  const m = motionAt(state);
  return m.env?.radial ?? m.contraction;
}
