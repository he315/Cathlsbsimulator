// ---------------------------------------------------------------------------
// Real-scale heart frame used by the X-ray renderer.
//
// Frame: the anatomy's aortic frame (mm), origin at the aortic valve,
// +x patient left, +y superior, +z anterior. The long axis L runs from the
// centre of the base (atrioventricular) plane to the LV apex (left, inferior,
// anterior). Epicardial vessels are described in surface coordinates:
//   ell ∈ [-1, 1]  position along the long axis (-1 base … +1 apex); values
//                  below -1 lie above the base plane (atrial side, used for
//                  the sinoatrial and AV-nodal arteries)
//   phi            angle around the long axis: 0 anterior, +90° the obtuse
//                  (left lateral) margin, -90° the acute (right) margin,
//                  ±180° the diaphragmatic surface
//   h              height above the epicardium along the surface normal, mm
//                  (epicardial fat; negative = intramyocardial, e.g. septal
//                  perforators or a myocardial bridge)
//
// Shape: the ventricular mass is the smooth union of an LV ellipsoid and a
// right-anterior RV ellipsoid (heartShape.ts adds the atria, outflow tract and
// fat and fits the renderer's primitives to the same surface). The anterior
// and posterior interventricular grooves are where the two ellipsoids meet;
// their phi(u) curves are tabulated here for the coronary routing.
//
// Motion: surfacePoint applies the displacement field of heartMotion.ts to the
// rest position of a material point (ell, phi, h), so the coronaries and the
// fitted silhouette move with one field.
// ---------------------------------------------------------------------------

import type { Vec3 } from "../../types";
import { displace } from "./heartMotion";

export interface Ellipsoid {
  c: Vec3;
  /** local axes (unit vectors) */
  ax: [Vec3, Vec3, Vec3];
  /** half sizes along the local axes, mm */
  half: [number, number, number];
}

/** Long-axis orientation. Defaults reproduce the original heart (azimuth 45° towards the left from anterior, 42° below horizontal). */
export interface HeartAxis {
  /** angle of the long axis in the horizontal plane, from anterior (+z) towards the patient's left (+x), degrees */
  azimuthDeg?: number;
  /** angle of the long axis below the horizontal, degrees (larger = more vertical heart) */
  elevationDeg?: number;
  /** rotation of the ventricles about the long axis, degrees (positive = anticlockwise seen from the apex) */
  rollDeg?: number;
}

/** Shape modes (multiplicative, 1 = nominal). Model parameters, sampled by the anatomy genome. */
export interface HeartShapeModes {
  /** LV short-axis radii (LVH or dilatation widen it) */
  lvWidth?: number;
  /** RV size */
  rvWidth?: number;
  /** base-to-apex length */
  length?: number;
}

export interface HeartFrame {
  base: Vec3; // centre of the atrioventricular (base) plane
  len: number; // base-to-apex length
  L: Vec3; // long axis unit vector, base → apex
  A: Vec3; // anterior unit vector (⊥ L)
  S: Vec3; // lateral unit vector (⊥ L, A), towards the patient's left
  rA: number; // anterior extent at the widest point (RV side)
  rAp: number; // posterior extent (LV inferolateral wall)
  rS: number; // left lateral extent (obtuse margin)
  rSr: number; // right lateral extent (RV, acute margin)
  /** convenience: geometric centre of the ventricular mass */
  centre: Vec3;
  /** half the base–apex length (for compatibility) */
  a: number;
  /** overall size factor */
  scale?: number;
  /** LV epicardial ellipsoid (rest) */
  lv?: Ellipsoid;
  /** RV epicardial ellipsoid (rest) */
  rv?: Ellipsoid;
  /** anterior interventricular groove: phi (deg) at u = i / (GROOVE_N - 1); NaN beyond the RV apex */
  aiv?: number[];
  /** posterior interventricular groove: phi (deg, in (90, 270)) at u = i / (GROOVE_N - 1); NaN beyond the RV apex */
  piv?: number[];
  axis?: Required<HeartAxis>;
  modes?: Required<HeartShapeModes>;
}

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const add = (p: Vec3, q: Vec3): Vec3 => v(p.x + q.x, p.y + q.y, p.z + q.z);
const sub = (p: Vec3, q: Vec3): Vec3 => v(p.x - q.x, p.y - q.y, p.z - q.z);
const sc = (p: Vec3, k: number): Vec3 => v(p.x * k, p.y * k, p.z * k);
const dot = (p: Vec3, q: Vec3) => p.x * q.x + p.y * q.y + p.z * q.z;
const cross = (p: Vec3, q: Vec3): Vec3 => v(p.y * q.z - p.z * q.y, p.z * q.x - p.x * q.z, p.x * q.y - p.y * q.x);
const nrm = (p: Vec3): Vec3 => {
  const l = Math.hypot(p.x, p.y, p.z) || 1;
  return v(p.x / l, p.y / l, p.z / l);
};

export const V3 = { v, add, sc, dot, cross, nrm, sub };

/** Number of entries in the groove tables. */
export const GROOVE_N = 41;

const D2R = Math.PI / 180;

/** Rotate p about unit axis k by angle a (radians), right-handed. */
export function rotateAbout(p: Vec3, k: Vec3, a: number): Vec3 {
  const c = Math.cos(a),
    s = Math.sin(a);
  const kd = dot(k, p);
  const kx = cross(k, p);
  return v(p.x * c + kx.x * s + k.x * kd * (1 - c), p.y * c + kx.y * s + k.y * kd * (1 - c), p.z * c + kx.z * s + k.z * kd * (1 - c));
}

// ---- nominal geometry (model parameters; overall size calibrated against projected tree extents
//      measured from the CoronaryDominance library, see scripts/anatomy_validation/) ----
/** base-plane centre relative to the aortic valve centre, mm (model parameter) */
const BASE = v(22, -12, -27);
/** base-to-apex length at scale 1, mm (model parameter) */
const LEN = 88;
// LV ellipsoid: centre along L (fraction of len), half sizes (L fraction, anterior mm, lateral mm)
const LV_LC = 0.14,
  LV_HL = 0.86,
  LV_HA = 43,
  LV_HS = 45;
// RV ellipsoid: centre (L fraction, anterior mm, lateral mm; negative = right), half sizes
const RV_LC = 0.36,
  RV_HL = 0.56,
  RV_AC = 6,
  RV_SC = -20,
  RV_HA = 49,
  RV_HS = 45;
/** smooth-union blending length, mm: the interventricular grooves are fat-filled, not creases */
const BLEND = 3;

/**
 * Build the heart frame.
 * @param scale overall size (1 = average adult)
 * @param axis long-axis orientation
 * @param modes shape modes
 * @param baseOffset shift of the whole heart (mm), used to seat the grooves against the aortic root
 */
export function makeHeart(scale = 1, axis: HeartAxis = {}, modes: HeartShapeModes = {}, baseOffset?: Vec3): HeartFrame {
  const ax: Required<HeartAxis> = { azimuthDeg: axis.azimuthDeg ?? 45, elevationDeg: axis.elevationDeg ?? 42, rollDeg: axis.rollDeg ?? 0 };
  const md: Required<HeartShapeModes> = { lvWidth: modes.lvWidth ?? 1, rvWidth: modes.rvWidth ?? 1, length: modes.length ?? 1 };
  const az = ax.azimuthDeg * D2R,
    el = ax.elevationDeg * D2R;
  const L = nrm(v(Math.sin(az) * Math.cos(el), -Math.sin(el), Math.cos(az) * Math.cos(el)));
  const len = LEN * scale * md.length;
  const base = baseOffset ? add(BASE, baseOffset) : BASE;
  // lateral axis from the patient's left, anterior axis completes the frame
  const xHat = v(1, 0, 0);
  let S = nrm(sub(xHat, sc(L, dot(xHat, L))));
  let A = nrm(cross(L, S));
  if (A.z < 0) A = sc(A, -1);
  if (ax.rollDeg) {
    S = rotateAbout(S, L, ax.rollDeg * D2R);
    A = rotateAbout(A, L, ax.rollDeg * D2R);
  }
  const k = scale;
  const lv: Ellipsoid = {
    c: add(base, sc(L, LV_LC * len)),
    ax: [L, A, S],
    half: [LV_HL * len, LV_HA * k * md.lvWidth, LV_HS * k * md.lvWidth],
  };
  const rv: Ellipsoid = {
    c: add(add(base, sc(L, RV_LC * len)), add(sc(A, RV_AC * k), sc(S, RV_SC * k * md.rvWidth))),
    ax: [L, A, S],
    half: [RV_HL * len, RV_HA * k * md.rvWidth, RV_HS * k * md.rvWidth],
  };
  const H: HeartFrame = {
    base,
    len,
    L,
    A,
    S,
    rA: RV_AC * k + RV_HA * k * md.rvWidth,
    rAp: LV_HA * k * md.lvWidth,
    rS: LV_HS * k * md.lvWidth,
    rSr: -RV_SC * k * md.rvWidth + RV_HS * k * md.rvWidth,
    centre: add(base, sc(L, len * 0.45)),
    a: len / 2,
    scale,
    lv,
    rv,
    axis: ax,
    modes: md,
  };
  H.aiv = grooveTable(H, true);
  H.piv = grooveTable(H, false);
  return H;
}

/** Ray from `o` along unit `d`: [entry, exit] distances through an ellipsoid, or null. */
function rayEllipsoid(e: Ellipsoid, o: Vec3, d: Vec3): [number, number] | null {
  const r = sub(o, e.c);
  let a = 0,
    b = 0,
    c = -1;
  for (let i = 0; i < 3; i++) {
    const oi = dot(r, e.ax[i]) / e.half[i];
    const di = dot(d, e.ax[i]) / e.half[i];
    a += di * di;
    b += 2 * oi * di;
    c += oi * oi;
  }
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const q = Math.sqrt(disc);
  return [(-b - q) / (2 * a), (-b + q) / (2 * a)];
}

/** Direction around the long axis for an angle phi (deg). */
export function radialDir(H: HeartFrame, phiDeg: number): Vec3 {
  const p = phiDeg * D2R;
  return add(sc(H.A, Math.cos(p)), sc(H.S, Math.sin(p)));
}

/** Smooth maximum (polynomial, C1) with blending length k; at most k/4 above the true maximum. */
function smax(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + (h * h * k) / 4;
}

/** Exit distances of the LV and RV ellipsoids along the ray at (u, phi); RV is NaN where it is not part of the surface. */
function exits(H: HeartFrame, u: number, phiDeg: number): [number, number] {
  const o = add(H.base, sc(H.L, u * H.len));
  const d = radialDir(H, phiDeg);
  const l = rayEllipsoid(H.lv!, o, d);
  const rl = l ? Math.max(0, l[1]) : 0;
  const r = rayEllipsoid(H.rv!, o, d);
  // the RV counts where its far wall lies beyond the LV wall and the two overlap (no gap along the ray)
  const rr = r && r[1] > 0 && r[0] < rl + 2 ? r[1] : NaN;
  return [rl, rr];
}

/** Radial distance of the epicardium from the long axis at u ∈ [0, 1] (rest), mm. */
export function surfaceRadius(H: HeartFrame, u: number, phiDeg: number): number {
  if (!H.lv || !H.rv) return legacyRadius(H, u, phiDeg);
  if (u < 0) {
    // above the base plane: the atrial side tapers gently (used only for the nodal arteries)
    return surfaceRadius(H, 0, phiDeg) * Math.max(0.55, 1 + 0.9 * u);
  }
  const uu = Math.min(u, 0.9995);
  const [rl, rr] = exits(H, uu, phiDeg);
  return Number.isNaN(rr) ? rl : smax(rl, rr, BLEND);
}

/** Which ventricle forms the surface at (u, phi): 1 = RV, 0 = LV (smooth across the grooves). */
export function rvWeight(H: HeartFrame, u: number, phiDeg: number): number {
  if (!H.lv || !H.rv) return Math.sin(phiDeg * D2R) < 0 && Math.cos(phiDeg * D2R) > -0.5 ? 1 : 0;
  const [rl, rr] = exits(H, Math.max(0, Math.min(u, 0.9995)), phiDeg);
  if (Number.isNaN(rr)) return 0;
  return 1 / (1 + Math.exp(-(rr - rl) / 1.5));
}

/** Legacy radius profile (used only if a frame without ellipsoids is passed in). */
export function profile(u: number): number {
  const uu = Math.min(1, Math.max(0, u));
  return Math.sqrt(Math.max(0, 1 - Math.pow(uu, 2.6))) * (0.84 + 0.16 * Math.min(1, uu / 0.3));
}

function legacyRadius(H: HeartFrame, u: number, phiDeg: number): number {
  const rho = profile(u);
  const p = phiDeg * D2R;
  const c = Math.cos(p),
    s = Math.sin(p);
  const ra = (c >= 0 ? H.rA : H.rAp) * rho;
  const rs = (s >= 0 ? H.rS : H.rSr) * rho;
  return Math.hypot(ra * c, rs * s);
}

/** Groove table: phi at each u where the LV and RV walls meet (anterior or posterior side). */
function grooveTable(H: HeartFrame, anterior: boolean): number[] {
  const out: number[] = [];
  for (let i = 0; i < GROOVE_N; i++) {
    const u = (i / (GROOVE_N - 1)) * 0.999;
    // scan for the sign change of (rRV - rLV); anterior groove in [-90, 100], posterior in [80, 290] (wide enough
    // for the sampled axis roll, which turns the whole ventricular mass about the long axis)
    const lo = anterior ? -90 : 80,
      hi = anterior ? 100 : 290;
    let found = NaN;
    let prev: number | null = null;
    const steps = 140;
    const f = (phi: number) => {
      const [rl, rr] = exits(H, u, phi);
      return Number.isNaN(rr) ? -1 : rr - rl;
    };
    for (let k = 0; k <= steps; k++) {
      const phi = anterior ? lo + ((hi - lo) * k) / steps : hi - ((hi - lo) * k) / steps;
      const val = f(phi);
      if (prev !== null && Math.sign(val) !== Math.sign(prev)) {
        // RV (positive) on the right side: anterior groove is the RV→LV transition going leftwards
        let a = anterior ? phi - (hi - lo) / steps : phi + (hi - lo) / steps,
          b = phi;
        for (let it = 0; it < 30; it++) {
          const m = (a + b) / 2;
          if (Math.sign(f(m)) === Math.sign(f(a))) a = m;
          else b = m;
        }
        found = (a + b) / 2;
        if (prev > 0) break; // the RV→LV transition is the groove
      }
      prev = val;
    }
    out.push(found);
  }
  // holes before the RV apex (the scan missed the seam at one level): fill from the finite neighbours, so the
  // table is NaN only beyond the RV apex, where there is no groove
  const fin = out.map((x, i) => (Number.isFinite(x) ? i : -1)).filter((i) => i >= 0);
  if (fin.length) {
    const lastFin = fin[fin.length - 1];
    for (let i = 0; i < lastFin; i++) {
      if (Number.isFinite(out[i])) continue;
      const a = [...fin].reverse().find((j) => j < i),
        b = fin.find((j) => j > i)!;
      out[i] = a === undefined ? out[b] : out[a] + ((out[b] - out[a]) * (i - a)) / (b - a);
    }
  }
  return out;
}

/** Phi of a groove at u (deg), interpolated; extrapolated beyond the RV apex along the last direction. */
export function grooveAt(H: HeartFrame, which: "aiv" | "piv", u: number): number {
  const t = which === "aiv" ? H.aiv : H.piv;
  if (!t || !t.some((x) => Number.isFinite(x))) return which === "aiv" ? 12 : 180;
  const x = Math.max(0, Math.min(1, u)) * (GROOVE_N - 1);
  // last finite entry
  let last = GROOVE_N - 1;
  while (last > 0 && Number.isNaN(t[last])) last--;
  if (x >= last) {
    const a = t[Math.max(0, last - 4)],
      b = t[last];
    const slope = (b - a) / 4;
    return b + slope * Math.min(6, x - last) * 0.5;
  }
  const i = Math.floor(x),
    f = x - i;
  const a = t[i],
    b = t[Math.min(last, i + 1)];
  if (Number.isNaN(a)) return b;
  if (Number.isNaN(b)) return a;
  return a + (b - a) * f;
}

/** u at which the RV stops forming part of the surface (the RV apex along the anterior groove). */
export function rvApexU(H: HeartFrame): number {
  const t = H.aiv;
  if (!t) return 0.85;
  let last = GROOVE_N - 1;
  while (last > 0 && Number.isNaN(t[last])) last--;
  return (last / (GROOVE_N - 1)) * 0.999;
}

/** Rest epicardial point (h = 0) at surface coordinates. */
function restSurface(H: HeartFrame, ell: number, phiDeg: number): Vec3 {
  const u = (ell + 1) / 2;
  const r = surfaceRadius(H, u, phiDeg);
  return add(add(H.base, sc(H.L, u * H.len)), sc(radialDir(H, phiDeg), r));
}

/** Outward unit normal of the rest epicardium at surface coordinates (finite differences). */
export function surfaceNormal(H: HeartFrame, ell: number, phiDeg: number): Vec3 {
  const de = 0.004,
    dp = 0.8;
  const e0 = Math.min(ell, 0.996);
  const pu = sub(restSurface(H, e0 + de, phiDeg), restSurface(H, e0 - de, phiDeg));
  const pp = sub(restSurface(H, e0, phiDeg + dp), restSurface(H, e0, phiDeg - dp));
  let n = nrm(cross(pp, pu));
  const radial = radialDir(H, phiDeg);
  if (dot(n, radial) + 0.5 * dot(n, H.L) * Math.sign(ell) < 0) n = sc(n, -1);
  // at the very apex the normal turns to the long axis
  if (ell > 0.985) {
    const w = Math.min(1, (ell - 0.985) / 0.014);
    n = nrm(add(sc(n, 1 - w), sc(H.L, w)));
  }
  return n;
}

/** Rest position of a material point (no motion). */
export function restPoint(H: HeartFrame, ell: number, phiDeg: number, h = 2.5): Vec3 {
  const e = Math.min(ell, 0.999);
  const p = restSurface(H, e, phiDeg);
  if (!h) return p;
  return add(p, sc(surfaceNormal(H, e, phiDeg), h));
}

/**
 * Motion state. `contraction` alone (0 diastole … 1 end-systole) is the legacy
 * input and drives every component with one envelope. heartMotion.motionAt()
 * fills the time-based envelopes, the root motion and the bridge compression.
 */
export interface Motion {
  /** 0 diastole … 1 end-systole */
  contraction: number;
  /** time-based envelopes (0 end-diastole … 1 end-systole), from heartMotion.motionAt */
  env?: MotionEnvelopes;
  /** per-patient amplitude scaling and overrides */
  amp?: MotionAmplitudes;
  /** myocardial bridge compression 0 … 1 (see heartMotion.bridgeCompression) */
  bridge?: number;
  /** true when samples fixed in the aortic frame (ostia, left main) move with the aortic root */
  rootMoves?: boolean;
}

export interface MotionEnvelopes {
  /** LV longitudinal shortening (base descent) */
  long: number;
  /** RV longitudinal shortening (leads the LV) */
  longRv: number;
  /** twist (torsion) envelope: rises with ejection, untwists early in relaxation */
  twist: number;
  /** radial thickening */
  radial: number;
  /** whole-heart translation */
  trans: number;
}

/** Amplitudes (see heartMotion.DEFAULT_AMPLITUDES for values and sources). */
export interface MotionAmplitudes {
  /** global scale of all cardiac motion (contractility) */
  contractility?: number;
  /** apical rotation at end-systole, degrees (positive = anticlockwise seen from the apex) */
  apexRotDeg?: number;
  /** basal rotation at end-systole, degrees (negative = clockwise seen from the apex) */
  baseRotDeg?: number;
  /** annular descent: lateral mitral, septal mitral, lateral tricuspid, anterior (aortic) mm */
  mapseLateral?: number;
  mapseSeptal?: number;
  tapse?: number;
  aapse?: number;
  /** radial epicardial inward motion at end-systole, fraction of the radius */
  radial?: number;
  /** whole-heart translation at end-systole (aortic frame, mm) */
  trans?: Vec3;
  /** RV free-wall (acute margin) systolic swing towards the septum, mm */
  rvSwing?: number;
  /**
   * whole-heart rotation at end-systole about the centre of the base plane: rotation vector in the aortic frame
   * (direction = axis, right-handed; length = angle in degrees)
   */
  wholeRot?: Vec3;
}

/**
 * Surface point (with motion). ell ∈ [-1, 1] maps to u = (ell + 1) / 2 from
 * the base plane (0) to the apex (1).
 */
export function surfacePoint(H: HeartFrame, ell: number, phiDeg: number, h = 2.5, m?: Motion): Vec3 {
  const p0 = restPoint(H, ell, phiDeg, h);
  if (!m || (!m.contraction && !m.env)) return p0;
  return add(p0, displace(H, ell, phiDeg, h, p0, m));
}

/** Inward direction (towards the long axis) at a surface coordinate, for septal perforators. */
export function inwardAt(H: HeartFrame, ell: number, phiDeg: number): Vec3 {
  return sc(surfaceNormal(H, ell, phiDeg), -1);
}

/** Local heart coordinates of a world point: along L from the base, anterior, lateral. */
export function toHeartLocal(H: HeartFrame, p: Vec3): { l: number; a: number; s: number } {
  const r = sub(p, H.base);
  return { l: dot(r, H.L), a: dot(r, H.A), s: dot(r, H.S) };
}
