// ---------------------------------------------------------------------------
// Thoracic anatomy for the X-ray renderer, in the aortic frame (mm):
// origin at the aortic valve, +x patient left, +y superior, +z anterior.
//
// Large soft-tissue/air structures (body, lungs, heart, mediastinum, great
// vessels, liver, stomach gas, trachea and bronchi) are solved exactly per ray
// with interval arithmetic in the renderer, so the lungs are carved around the
// heart and mediastinum. Bones (vertebral bodies with endplates, ring
// pedicles, processes, sternum, scapulae) add their excess attenuation on top
// as analytic solids. Ribs, clavicles, costal cartilage and the pulmonary
// vessel trees are polylines: either ribbon tubes (legacy path, works with the
// renderer as it is) or exact cone segments for the thorax segment pass
// (clutter.ts ThoraxSegmentPass) when `segments: true`.
//
// Every patient gets a seeded thorax genome (habitus, chest shape, diaphragm
// height, rib and spine variation, pulmonary trees). Attenuation values are
// linear coefficients per mm at a single effective energy: see MU.
// Breathing lowers the diaphragm, extends the lungs and lifts the ribs; the
// ventricular silhouette follows the contraction envelope.
// ---------------------------------------------------------------------------

import type { Vec3 } from "../../types";
import { restPoint, surfacePoint, type HeartFrame, type Motion } from "./heart";
import { growPulmonaryTrees, prng, type Exclusion, type PulmonaryForest, type TreeRoot } from "./pulmonaryTree";
import { buildHardware, type HardwareGeometry, type HardwareSpec } from "./hardware";

export const MU = {
  soft: 0.02,
  lungExcess: -0.0146,
  airExcess: -0.02,
  liverExcess: 0.0012,
  fatExcess: -0.0025,
  cortical: 0.019, // excess over soft tissue
  cancellous: 0.0065,
  cartilage: 0.0035,
  /** iodine: excess per mm per mg I/mL */
  iodinePerMg: 0.00067,
  /**
   * Cortical excess for thin cortical shells (rib cortex, vertebral endplates, pedicle walls).
   * NIST XCOM (ICRU-44 cortical bone 1.92 g/cm3, soft tissue 1.06 g/cm3) gives an excess of
   * 0.0387 /mm at 60 keV and 0.0235 /mm at 80 keV (docs/realism/facts/S4.md). The renderer's
   * effective energy is about 60 keV (MU.soft 0.020 against NIST soft tissue 0.0217 /mm at 60 keV;
   * steel wire 0.95 /mm = NIST iron at 60 keV), so the 60 keV value is used. The bulk MU.cortical
   * above is kept for the calibration of other code.
   */
  corticalShell: 0.038,
  /** Model parameter: marrow-filled rib interior, excess over soft tissue (low, so ribs read as margins, not bands). */
  ribMarrow: 0.0032,
};

export type ShapeType = 0 | 1 | 2; // ellipsoid | capped cylinder (local y axis) | box

export interface Shape {
  type: ShapeType;
  c: Vec3;
  /** local axes (unit vectors) */
  ax: [Vec3, Vec3, Vec3];
  /** half sizes along the local axes */
  half: [number, number, number];
}

/**
 * An exactly solved anatomy shape with its material. Every shape adds mu × path length to the
 * line integral, except LUNG shapes, which add mu only over the part of their path not covered
 * by the union of CARVE shapes (the lungs are carved around the mediastinum and diaphragm).
 */
export interface AnatShape extends Shape {
  /** attenuation excess over its surroundings, per mm (the body itself carries soft tissue) */
  mu: number;
  lung?: boolean;
  carve?: boolean;
  name?: string;
}

/** Most anatomy shapes the renderer accepts (shader array size). */
export const MAX_ANAT = 32;
/** Most carve shapes the renderer's lung carving accepts (XrayRenderer ANAT_FS sorts them per ray). */
export const MAX_CARVE_SHAPES = 20;

/** Additive primitive: bone (excess attenuation in the soft/bone channel) and/or iodine (contrast channel). */
export interface BonePrim extends Shape {
  mu: number;
  /** iodine attenuation per mm (contrast-filled cavities such as the aortic root or LV) */
  muI?: number;
}

/** Ribbon tube: centre line, radius and per-channel attenuation (R bone/soft, G iodine, B metal). */
export interface TubeSpec {
  pts: Vec3[];
  /** radius, or the wide semi-axis when the cross-section is flattened */
  r: number[];
  mu: [number, number, number] | [number, number, number][];
  /** flattened (elliptical) cross-section: direction of the thin axis and its semi-axis at each point */
  thin?: { dir: Vec3[]; r: number[] };
  /**
   * Radial distribution of the iodine channel across the lumen: 0 (default) uniform; 1 all of it in a
   * parabolic profile peaked on the axis (same amount per unit length). Opacified coronaries use a
   * partial core (sceneBuilder VESSEL_PROFILE); the other channels are always uniform.
   */
  core?: number;
}

/** Index of each exact-geometry anatomy shape in Thorax.anat (the body stays first). */
export const ANAT = {
  BODY: 0,
  LUNG_R: 1,
  LUNG_L: 2,
  HEART: 3,
  RA: 4,
  MEDIA: 5,
  LIVER: 6,
  STOMACH: 7,
  TRACHEA: 8,
  BRONCH_R: 9,
  BRONCH_L: 10,
  HEART_FAT: 11,
  POST_MEDIA: 12,
  LA: 13,
  PA_TRUNK: 14,
  AORTIC_KNOB: 15,
  RVOT: 16,
  SVC: 17,
  LEFT_DOME: 18,
  DESC_AORTA: 19,
  ASC_AORTA: 20,
  /** right-ventricular fat envelope (carve) */
  RV_FAT: 21,
  LAA: 22,
  FAT_PAD: 23,
  /** right-ventricular mass */
  RV: 24,
  /**
   * Anterior mediastinum and pericardial sac in front of the ventricles (carve, soft tissue): the
   * retrosternal fat, thymic remnant and pericardium between the heart and the anterior chest wall,
   * where the lungs leave the cardiac notch (C1, wave 2).
   */
  ANT_MEDIA: 25,
  /**
   * Inferior vena cava between the right atrium and the liver (carve, soft tissue; C1, wave 2): without
   * it the right lung closed under the atrium and drew the atrium as an isolated disc.
   */
  IVC: 26,
  /**
   * Non-aerated dependent lung under the heart (carve, soft tissue; C1, wave 2): the left ventricular fat
   * envelope swept posteriorly (supine: towards the table) by ANATOMY_TUNE.retro.depth. See retrocardiac().
   */
  RETRO: 27,
  /** present only for genomes with breast tissue */
  BREAST_R: 28,
  BREAST_L: 29,
} as const;
/** Shapes present in every thorax (breasts are optional and come after). */
export const ANAT_COUNT = 28;
/**
 * Structures the lungs are carved around (their union, exactly per ray): the mediastinum, heart,
 * great vessels and both hemidiaphragms, so the lung bases sit on two domes and the heart rests on
 * the diaphragm. At most MAX_CARVE_SHAPES.
 */
export const CARVE = [11, 4, 5, 12, 13, 14, 15, 16, 17, 6, 18, 19, 20, 21, 22, 23, 25, 26, 27];

/** Diaphragm descent at full inspiration (mm); the heart rides on it (see sceneBuilder). */
export const DIAPHRAGM_DESCENT = 32;

/** Blood-filled vessel within aerated lung (excess over lung). */
export const LUNG_VESSEL_MU = 0.0135;

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const I3: [Vec3, Vec3, Vec3] = [v(1, 0, 0), v(0, 1, 0), v(0, 0, 1)];
const add = (a: Vec3, b: Vec3) => v(a.x + b.x, a.y + b.y, a.z + b.z);
const sub = (a: Vec3, b: Vec3) => v(a.x - b.x, a.y - b.y, a.z - b.z);
const sc = (a: Vec3, k: number) => v(a.x * k, a.y * k, a.z * k);
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const vlen = (a: Vec3) => Math.hypot(a.x, a.y, a.z);
const lerpV = (a: Vec3, b: Vec3, t: number) => v(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
const nrm = (a: Vec3) => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return v(a.x / l, a.y / l, a.z / l);
};
const cross = (p: Vec3, q: Vec3): Vec3 => v(p.y * q.z - p.z * q.y, p.z * q.x - p.x * q.z, p.x * q.y - p.y * q.x);

/** Orthonormal axes with the first axis along `a` and the second as close as possible to `hint`. */
function axesFrom(a: Vec3, hint: Vec3): [Vec3, Vec3, Vec3] {
  const x = nrm(a);
  const z = nrm(cross(x, hint));
  const y = nrm(cross(z, x));
  return [x, y, z];
}
/** Axes whose local y (the capped-cylinder axis) runs along `a`. */
function yAxes(a: Vec3): [Vec3, Vec3, Vec3] {
  const y = nrm(a);
  const hint = Math.abs(y.x) < 0.9 ? v(1, 0, 0) : v(0, 0, 1);
  const z = nrm(cross(hint, y));
  const x = nrm(cross(y, z));
  return [x, y, z];
}

// ---------------------------------------------------------------------------
// Thorax genome
// ---------------------------------------------------------------------------

/**
 * Per-patient thorax parameters. Ranges are model parameters chosen to give visibly different
 * patients; the habitus range 0.85-1.25 is the plan's. Seeded from the case id.
 */
export interface ThoraxGenome {
  seed: number;
  /** body habitus scale (1 average, 0.85 slim, 1.25 large): scales the body and soft tissue */
  habitus: number;
  /** lateral and antero-posterior chest scale on top of habitus */
  width: number;
  depth: number;
  /** hemidiaphragm dome height offset (mm, positive higher) */
  diaphragm: number;
  /** vertical lung extent scale */
  lungHeight: number;
  /** anterior rib slope scale */
  ribDrop: number;
  /** rib cross-section size scale */
  ribSize: number;
  /** lateral spine offset (mm), scoliosis and kyphosis amplitudes (mm, model parameters) */
  spineShift: number;
  scoliosis: number;
  kyphosis: number;
  /** epicardial fat shell thickness (mm) */
  heartFat: number;
  /** aortic knob prominence 0..1 (unfolding with age) */
  aortaUnfold: number;
  /** pulmonary tree seed */
  treeSeed: number;
  /** breast soft tissue present */
  breasts: boolean;
}

/** The reference patient (seedless buildThorax): average habitus, symmetric, no extra soft tissue. */
export const REFERENCE_GENOME: ThoraxGenome = {
  seed: 0,
  habitus: 1,
  width: 1,
  depth: 1,
  diaphragm: 0,
  lungHeight: 1,
  ribDrop: 1,
  ribSize: 1,
  spineShift: 0,
  scoliosis: 1.5,
  kyphosis: 22,
  heartFat: 3,
  aortaUnfold: 0.3,
  treeSeed: 7,
  breasts: false,
};

/** 32-bit FNV-1a hash of a string, or the number itself. */
export function seedFrom(s: string | number): number {
  if (typeof s === "number") return s >>> 0;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Seeded thorax genome. Seed 0 is the reference patient. */
export function thoraxGenome(seed: string | number): ThoraxGenome {
  const s = seedFrom(seed);
  if (s === 0) return { ...REFERENCE_GENOME };
  const r = prng(s ^ 0x9e3779b9);
  const gauss = () => {
    const u = Math.max(1e-9, r());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  };
  const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
  // habitus: right-skewed around 1.02 within 0.85-1.25 (model parameters)
  const habitus = clamp(1.02 + 0.1 * gauss() + 0.04 * Math.abs(gauss()), 0.85, 1.25);
  return {
    seed: s,
    habitus,
    width: clamp(1 + 0.035 * gauss(), 0.93, 1.07),
    depth: clamp(1 + 0.045 * gauss(), 0.91, 1.09),
    // larger patients have higher domes (model parameter)
    diaphragm: clamp(10 * gauss() + 30 * (habitus - 1), -16, 18),
    lungHeight: clamp(1 + 0.04 * gauss(), 0.92, 1.08),
    ribDrop: clamp(1 + 0.09 * gauss(), 0.82, 1.18),
    ribSize: clamp(1 + 0.06 * gauss(), 0.88, 1.12),
    spineShift: clamp(2 * gauss(), -5, 5),
    scoliosis: clamp(Math.abs(2.5 * gauss()), 0, 7),
    kyphosis: clamp(22 + 6 * gauss(), 10, 36),
    heartFat: clamp(3 + 1.2 * gauss() + 6 * (habitus - 1), 2, 7),
    aortaUnfold: clamp(r(), 0, 1),
    treeSeed: (s * 2246822519 + 3266489917) >>> 0,
    breasts: r() < 0.4,
  };
}

function genomeKey(g: ThoraxGenome) {
  return [g.seed, g.habitus, g.width, g.depth, g.diaphragm, g.lungHeight, g.ribDrop, g.ribSize, g.spineShift, g.scoliosis, g.kyphosis, g.treeSeed]
    .map((x) => (typeof x === "number" ? x.toFixed(4) : String(x)))
    .join("|");
}

// ---------------------------------------------------------------------------
// Segments for the thorax segment pass (layout shared with clutter.ts)
// ---------------------------------------------------------------------------

/**
 * Floats per segment. Each segment is a (possibly hollow, possibly elliptic) truncated cone
 * between two mitred end planes, so consecutive segments of a polyline join without gaps or
 * overlaps:
 *   [0..3]   p0.xyz, r0          [4..7]   p1.xyz, r1
 *   [8..11]  d0.xyz, inner       [12..15] d1.xyz, flat
 *   [16..19] muOut.rgb, sub      [20..23] muIn.rgb, 0
 *   [24..27] thinDir.xyz, 0      [28..31] n0.xyz, 0      [32..35] n1.xyz, 0
 * p(resp) = p + resp * d (breathing displacement per unit resp). inner: inner radius as a
 * fraction of the outer (0 = solid); muIn applies inside it, muOut in the shell. flat: thin
 * semi-axis / wide semi-axis (1 = round), thin axis along thinDir. sub = 1 lets sub-pixel
 * segments widen to about one pixel with their integral kept.
 */
export const SEG_FLOATS = 36;

export interface SegmentBuffer {
  data: Float32Array;
  count: number;
  /** changes whenever the data change (the pass re-uploads on a new key) */
  key: string;
}

export interface ThoraxSegments {
  /** static per patient: ribs, clavicles, cartilage, pulmonary trees and bronchi (positions at resp 0) */
  stat: SegmentBuffer;
  /** rebuilt every frame: hardware that moves with the heart (positions final, d = 0) */
  dyn: SegmentBuffer | null;
  /** breathing level for this frame (applied to stat through d) */
  resp: number;
}

export interface SegOpts {
  /** material (R, G, B) for the whole polyline, or one per segment (length pts - 1) */
  mu: [number, number, number] | [number, number, number][];
  muIn?: [number, number, number] | [number, number, number][];
  inner?: number | number[];
  flat?: number | number[];
  thin?: Vec3[];
  disp?: Vec3[];
  sub?: boolean;
}

/** 32-bit FNV-1a hash over the bit patterns of the first n floats (cache keys for GPU buffers). */
export function hashFloats(f: Float32Array, n = f.length): string {
  const u = new Uint32Array(f.buffer, f.byteOffset, Math.min(n, f.length));
  let h = 0x811c9dc5;
  for (let i = 0; i < u.length; i++) {
    h ^= u[i];
    h = Math.imul(h, 0x01000193);
    h ^= h >>> 13;
  }
  return (h >>> 0).toString(36);
}

/**
 * cos of the bend angle above which a joint is a hairpin: the bisector plane would make less than
 * acos(0.35) with each segment (cos(bend) = 2 x 0.35^2 - 1).
 */
const HAIRPIN_COS = 2 * 0.35 * 0.35 - 1;

/**
 * Drop zero-length segments and round hairpin joints (see SegmentList.polyline), carrying the
 * per-point (radius, inner, flat, thin, disp) and per-segment (mu, muIn) attributes along.
 * Returns the input unchanged when there is nothing to do.
 */
function roundHairpins(pts: Vec3[], r: number[], o: SegOpts): { pts: Vec3[]; r: number[]; o: SegOpts } {
  const n = pts.length;
  if (n < 2) return { pts, r, o };
  let need = false;
  for (let i = 0; i < n - 1 && !need; i++) {
    if (vlen(sub(pts[i + 1], pts[i])) < 1e-6) need = true;
    else if (i > 0 && dot(nrm(sub(pts[i], pts[i - 1])), nrm(sub(pts[i + 1], pts[i]))) < HAIRPIN_COS) need = true;
  }
  if (!need) return { pts, r, o };
  // pass 1: drop repeated points
  const K: number[] = [0];
  for (let i = 1; i < n; i++) if (vlen(sub(pts[i], pts[K[K.length - 1]])) >= 1e-6) K.push(i);
  if (K.length < 2) return { pts: [], r: [], o };
  // pass 2: round hairpins. ptSrc: source point of each output point; segSrc: source segment of
  // the output segment starting at each output point
  const P: Vec3[] = [pts[K[0]]];
  const ptSrc: number[] = [K[0]];
  const segSrc: number[] = [K[1] - 1];
  for (let j = 1; j < K.length; j++) {
    const i = K[j];
    const outSeg = j + 1 < K.length ? K[j + 1] - 1 : i - 1;
    if (j + 1 < K.length) {
      const prev = pts[K[j - 1]],
        p = pts[i],
        next = pts[K[j + 1]];
      const a = nrm(sub(p, prev)),
        b = nrm(sub(next, p));
      if (dot(a, b) < HAIRPIN_COS) {
        const eps = Math.min(0.4 * vlen(sub(p, prev)), 0.4 * vlen(sub(next, p)), Math.max(r[i] ?? 0.5, 0.5));
        const q1 = sub(p, sc(a, eps));
        let q2 = add(p, sc(b, eps));
        if (vlen(sub(q2, q1)) < 0.1 * eps) {
          // exact reversal: step sideways
          const side = nrm(cross(a, Math.abs(a.y) < 0.9 ? v(0, 1, 0) : v(1, 0, 0)));
          q2 = add(q1, sc(side, eps));
        }
        P.push(q1, q2);
        ptSrc.push(i, i);
        segSrc.push(segSrc[segSrc.length - 1], outSeg);
        continue;
      }
    }
    P.push(pts[i]);
    ptSrc.push(i);
    segSrc.push(outSeg);
  }
  const perPt = <T>(x: T[] | undefined) => (x ? ptSrc.map((s) => x[Math.min(s, x.length - 1)]) : undefined);
  const perSeg = <T>(x: T[]) => segSrc.slice(0, P.length - 1).map((s) => x[Math.max(0, Math.min(s, x.length - 1))]);
  const num = (x: number | number[] | undefined) => (Array.isArray(x) ? perPt(x) : x);
  const mat = (m: SegOpts["mu"] | undefined) => (m && Array.isArray(m[0]) ? perSeg(m as [number, number, number][]) : m);
  return {
    pts: P,
    r: perPt(r)!,
    o: { ...o, mu: mat(o.mu)!, muIn: mat(o.muIn), inner: num(o.inner), flat: num(o.flat), thin: perPt(o.thin), disp: perPt(o.disp) },
  };
}

/** Growable packed segment list. */
export class SegmentList {
  data = new Float32Array(SEG_FLOATS * 256);
  count = 0;
  private grow(n: number) {
    if ((this.count + n) * SEG_FLOATS <= this.data.length) return;
    const d = new Float32Array(Math.max(this.data.length * 2, (this.count + n) * SEG_FLOATS));
    d.set(this.data);
    this.data = d;
  }
  /**
   * Add a polyline as mitred segments. Consecutive segments share the bisector plane at their
   * joint, so they meet without gaps or overlaps. A hairpin (bend over about 139 degrees, where
   * the bisector would lie nearly along both segments) is first rounded: the joint is replaced by
   * two joints of half the bend each, joined by a short connector, so every joint keeps a shared
   * plane at least 45 degrees from both of its segments.
   */
  polyline(pts0: Vec3[], r0: number[], o0: SegOpts) {
    const { pts, r, o } = roundHairpins(pts0, r0, o0);
    const n = pts.length;
    if (n < 2) return;
    this.grow(n - 1);
    const dirs: Vec3[] = [];
    for (let i = 0; i < n - 1; i++) dirs.push(nrm(sub(pts[i + 1], pts[i])));
    // a closed loop (last point = first, e.g. wire loops and valve rings) is mitred across its seam too
    const closed = n > 3 && vlen(sub(pts[n - 1], pts[0])) < 1e-6 && dot(dirs[n - 2], dirs[0]) >= HAIRPIN_COS;
    const seam = closed ? nrm(add(dirs[n - 2], dirs[0])) : null;
    const mitre = (i: number) => (i === 0 ? seam ?? dirs[0] : i === n - 1 ? seam ?? dirs[n - 2] : nrm(add(dirs[i - 1], dirs[i])));
    const at = (x: number | number[] | undefined, i: number, dflt: number) => (x === undefined ? dflt : typeof x === "number" ? x : x[i]);
    for (let i = 0; i < n - 1; i++) {
      const f = this.data;
      const o0 = this.count * SEG_FLOATS;
      const p0 = pts[i],
        p1 = pts[i + 1];
      const d0 = o.disp ? o.disp[i] : v(0, 0, 0),
        d1 = o.disp ? o.disp[i + 1] : v(0, 0, 0);
      // one plane per joint, used by both segments that meet there
      const n0 = mitre(i),
        n1 = mitre(i + 1);
      const td = o.thin ? o.thin[i] : v(0, 0, 0);
      const pick = (m: SegOpts["mu"] | undefined): [number, number, number] => (!m ? [0, 0, 0] : Array.isArray(m[0]) ? (m as [number, number, number][])[i] : (m as [number, number, number]));
      const mo = pick(o.mu);
      const mi = pick(o.muIn);
      f.set(
        [
          p0.x, p0.y, p0.z, r[i],
          p1.x, p1.y, p1.z, r[i + 1],
          d0.x, d0.y, d0.z, Math.min(at(o.inner, i, 0), at(o.inner, i + 1, 0)),
          d1.x, d1.y, d1.z, (at(o.flat, i, 1) + at(o.flat, i + 1, 1)) / 2,
          mo[0], mo[1], mo[2], o.sub === false ? 0 : 1,
          mi[0], mi[1], mi[2], 0,
          td.x, td.y, td.z, 0,
          n0.x, n0.y, n0.z, 0,
          n1.x, n1.y, n1.z, 0,
        ],
        o0,
      );
      this.count++;
    }
  }
  /** The packed segments with a cache key. */
  buffer(key: string): SegmentBuffer {
    return { data: this.data.subarray(0, this.count * SEG_FLOATS), count: this.count, key };
  }
}

// ---------------------------------------------------------------------------
// Static (per-genome) geometry: spine layout, ribs, pulmonary trees
// ---------------------------------------------------------------------------

interface Level {
  c: Vec3;
  /** vertebral body axis (unit, roughly superior) */
  axis: Vec3;
  height: number;
  rx: number;
  rz: number;
  rot: number;
}

/** Model parameters: thoracic spine position in the aortic frame. */
const SPINE_X = -4;
const SPINE_Z = -104;

function spineLayout(g: ThoraxGenome): Level[] {
  const k = g.habitus;
  const rnd = prng(g.seed * 7919 + 101);
  const levels: Level[] = [];
  const N = 19; // T1 .. L2
  let y = 186;
  const pos: Vec3[] = [];
  const dims: { h: number; rx: number; rz: number; gap: number }[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    // model parameters: thoracic bodies smaller, lumbar larger; disc gaps 5-8 mm (plan)
    const h = (18 + 9 * t) * Math.sqrt(k) * (1 + (rnd() - 0.5) * 0.06);
    const gap = 5 + 3 * t;
    const rx = (14 + 10 * t) * k * (1 + (rnd() - 0.5) * 0.06);
    const rz = (12 + 7 * t) * k * (1 + (rnd() - 0.5) * 0.06);
    const yc = y - h / 2;
    y -= h + gap;
    // thoracic kyphosis (apex mid-thoracic, posterior) easing into the lumbar lordosis; centred so the
    // column keeps its mean depth. Model parameter: amplitude gives endplate tilts of about +-15 degrees,
    // so some endplates lie tangent to cranially angled beams and draw lines, as on real frames.
    const kyph = g.kyphosis * (Math.sin(Math.PI * Math.min(1, t / 0.78)) - 0.55) - (t > 0.78 ? (8 * (t - 0.78)) / 0.22 : 0);
    const x = SPINE_X + g.spineShift + g.scoliosis * Math.sin(Math.PI * (t * 1.2 + 0.1)) + (rnd() - 0.5) * 2.4;
    pos.push(v(x, yc, SPINE_Z - kyph));
    dims.push({ h, rx, rz, gap });
  }
  for (let i = 0; i < N; i++) {
    const a = pos[Math.max(0, i - 1)],
      b = pos[Math.min(N - 1, i + 1)];
    levels.push({ c: pos[i], axis: nrm(sub(a, b)), height: dims[i].h, rx: dims[i].rx, rz: dims[i].rz, rot: (rnd() - 0.5) * 0.1 });
  }
  return levels;
}

interface RibSample {
  p: Vec3;
  /** wide semi-axis, thin semi-axis, cortex thickness (mm), density factor */
  a: number;
  b: number;
  tc: number;
  dens: number;
  thin: Vec3;
}

interface RibModel {
  bone: RibSample[];
  /** costal cartilage centre line (may be empty) with radii */
  cart: Vec3[];
  cartR: number[];
}

/** Centripetal Catmull-Rom through planar control points, densely sampled. */
function catmull(pts: [number, number][], per = 24): [number, number][] {
  const out: [number, number][] = [];
  const P = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P(i - 1),
      p1 = P(i),
      p2 = P(i + 1),
      p3 = P(i + 2);
    const tj = (a: [number, number], b: [number, number]) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-3, 0.5);
    const t0 = 0,
      t1 = t0 + tj(p0, p1),
      t2 = t1 + tj(p1, p2),
      t3 = t2 + tj(p2, p3);
    for (let k = 0; k < per; k++) {
      const t = t1 + ((t2 - t1) * k) / per;
      const L = (a: [number, number], b: [number, number], ta: number, tb: number): [number, number] => {
        const w = (t - ta) / (tb - ta || 1e-6);
        return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w];
      };
      const A1 = L(p0, p1, t0, t1),
        A2 = L(p1, p2, t1, t2),
        A3 = L(p2, p3, t2, t3);
      const B1 = L(A1, A2, t0, t2),
        B2 = L(A2, A3, t1, t3);
      out.push(L(B1, B2, t1, t2));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

interface Frame {
  bodyC: Vec3;
  bodyHalf: [number, number, number];
}

function bodyFrame(g: ThoraxGenome): Frame {
  const k = g.habitus;
  // model parameters: elliptic body 352 x 252 mm at habitus 1, back skin about 70 mm behind the
  // vertebral bodies so the spinous processes lie inside it
  return { bodyC: v(0, -40, -46), bodyHalf: [176 * k * g.width, 320, 126 * k * g.depth] };
}

/** One rib (n 1..12, side -1 right / +1 left) at breathing level r. */
function ribModel(g: ThoraxGenome, lv: Level[], n: number, side: number, r: number, jit: number[]): RibModel {
  const k = g.habitus;
  const F = bodyFrame(g);
  const L = lv[n - 1];
  const bodyBack = F.bodyC.z - F.bodyHalf[2];
  const bodyFront = F.bodyC.z + F.bodyHalf[2];
  // model parameters: rib ring half-width, depth, slope; bucket- and pump-handle motion on inspiration
  let W = (108 + Math.min(1, n / 7) * 50) * k * g.width * (1 + 0.03 * r) * (1 + jit[0] * 0.04);
  if (n > 8) W *= 1 - 0.025 * (n - 8);
  const zBack = bodyBack + (34 + jit[1] * 4) * k;
  const zFront = bodyFront - (n === 1 ? 30 : n <= 7 ? 20 : 34 + (n - 8) * 8) * k + 4 * r;
  const zLat = (zBack + zFront) / 2 - 12;
  const sx = L.c.x;
  const ctrl: [number, number][] = [
    [sx + side * (L.rx + 2), L.c.z + 2],
    [sx + side * (L.rx + 15), L.c.z - L.rz - 14],
    [side * 0.4 * W, zBack],
    [side * 0.8 * W, zBack + 0.32 * (zLat - zBack) * 1.6],
    [side * W, zLat],
  ];
  const floating = n >= 11;
  if (!floating) ctrl.push([side * 0.9 * W, zLat + 0.72 * (zFront - zLat)]);
  if (n <= 7) ctrl.push([side * (n === 1 ? 0.28 : 0.3 + 0.03 * (n - 2)) * W, zFront]);
  else if (n <= 10) ctrl.push([side * (0.74 - 0.04 * (n - 8)) * W, zFront]);
  else ctrl.splice(ctrl.length - 1, 1, [side * W * 0.97, zLat + (n === 11 ? 18 : 6)]);
  const dense = catmull(ctrl);
  // arc length
  const s: number[] = [0];
  for (let i = 1; i < dense.length; i++) s.push(s[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const total = s[s.length - 1];
  const yHead = L.c.y + L.height * 0.5;
  const drop = (n <= 2 ? 30 : n <= 7 ? 72 : 58) * g.ribDrop * (1 - 0.18 * r) * (1 + jit[2] * 0.06);
  const step = 3.5;
  const m = Math.max(4, Math.round(total / step));
  const bone: RibSample[] = [];
  let j = 0;
  for (let q = 0; q <= m; q++) {
    const target = (q / m) * total;
    while (j < s.length - 2 && s[j + 1] < target) j++;
    const w = (target - s[j]) / (s[j + 1] - s[j] || 1);
    const x = dense[j][0] + (dense[j + 1][0] - dense[j][0]) * w;
    const z = dense[j][1] + (dense[j + 1][1] - dense[j][1]) * w;
    const f = q / m;
    // posterior part rises a little, then the rib slopes down to its anterior end; a small
    // per-rib wobble breaks the regular lattice of identical ribs
    const y = yHead + 6 * Math.sin(Math.min(1, f * 3) * Math.PI) - drop * Math.pow(f, 1.35) + jit[3] * 2.5 * Math.sin(f * Math.PI * 2 + jit[4] * 3);
    // model parameters (fitted to the measured rib-margin width and depth, see S4.md):
    // posterior ribs rounder with a thicker cortex, anterior ribs flatter, wider and thinner-walled
    const size = g.ribSize * (1 + jit[5] * 0.07) * (n === 1 ? 1.15 : n >= 11 ? 0.8 : 1);
    let a = (5.0 + 1.6 * Math.min(1, f * 1.6)) * size;
    let b = (3.7 - 1.2 * f) * size;
    const RB = ANATOMY_TUNE.ribs;
    let tc = RB.tcPost - (RB.tcPost - RB.tcAnt) * f;
    let dens = 1 - (1 - RB.densAnt) * Math.pow(f, 1.3);
    // the bony end tapers into the cartilage over its last 12 mm (no square cut ends)
    const fromEnd = (1 - f) * total;
    if (fromEnd < 12) {
      const u = fromEnd / 12;
      const e = 0.55 + 0.45 * u;
      a *= 0.85 + 0.15 * u;
      b *= e;
      tc *= e;
      dens *= e;
    }
    bone.push({ p: v(x, y, z), a, b, tc, dens, thin: v(0, 0, 0) });
  }
  // thin axis: outward from the chest axis, orthogonal to the rib tangent
  for (let i = 0; i < bone.length; i++) {
    const t = nrm(sub(bone[Math.min(bone.length - 1, i + 1)].p, bone[Math.max(0, i - 1)].p));
    const out = v(bone[i].p.x, 0, bone[i].p.z - (zBack + zFront) / 2);
    const o = sub(out, sc(t, dot(out, t)));
    bone[i].thin = nrm(vlen(o) > 1e-6 ? o : v(side, 0, 0));
  }
  // costal cartilage
  const cart: Vec3[] = [];
  const cartR: number[] = [];
  if (n <= 10) {
    const last = bone[bone.length - 1];
    const stY = n <= 7 ? 152 - (n - 1) * 16.5 + 6 * r : 152 - 6 * 16.5 - (n - 7) * 13 + 6 * r;
    const end = n <= 7 ? v(side * 14 * k, stY, bodyFront - 12) : v(side * (24 + (n - 8) * 16) * k, stY, bodyFront - 22 - (n - 8) * 6);
    const mid = v((last.p.x + end.x) / 2 + side * 6, (last.p.y + end.y) / 2 + (n <= 7 ? 2 : 0), Math.max(last.p.z, end.z) + 3);
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      // quadratic Bezier from the rib end through mid to the sternum
      const p = add(add(sc(last.p, (1 - t) * (1 - t)), sc(mid, 2 * (1 - t) * t)), sc(end, t * t));
      cart.push(p);
      cartR.push((last.a * 0.62) * (1 - t) + 3.0 * t);
    }
  }
  return { bone, cart, cartR };
}

interface StaticThorax {
  key: string;
  levels: Level[];
  ribs0: RibModel[];
  ribs1: RibModel[];
  forest: PulmonaryForest;
  lungs0: { c: Vec3; half: [number, number, number] }[];
  lungs1: { c: Vec3; half: [number, number, number] }[];
  vertebraBones: BonePrim[];
  segs: SegmentBuffer;
  legacyVessels: { pts0: Vec3[]; d: Vec3[]; r: number[] }[];
}

const staticCache = new Map<string, StaticThorax>();

/**
 * Anatomy constants refitted in wave 2 (track C1) on contact sheets of captures against the nearest-angle
 * library runs, axial and coronal slices (scripts/thorax/probe_c1_slice.ts) and line-integral maps
 * (scripts/thorax/probe_c1.ts); docs/realism/wave2/C1.md. Model parameters.
 * Exported mutable for calibration probes only; the renderer and the labs never write it.
 *   lungR / lungL: centre x and z (mm at habitus 1), half x and z of each lung ellipsoid. The lungs
 *     reach the midline: the mediastinal and cardiac carve shapes, not the ellipsoids, form their medial
 *     surfaces, so the heart borders, the paravertebral lines and the retrocardiac lung are drawn by the
 *     organs themselves (the two lungs are merged per ray, so an overlap is not counted twice);
 *   pericardium: extra growth (mm) of the ventricular fat envelopes the lungs are carved around
 *     (pericardial sac and the paracardial fat beyond the epicardial shell). 12 mm (C1 review round):
 *     with 0 the epicardial vessels lay exactly on the carve surface, so near the cardiac borders the
 *     rays through them crossed almost no heart and the distal tree projected over aerated lung.
 */
export const ANATOMY_TUNE = {
  lungR: { x: -70, z: -46, hx: 76, hz: 88 },
  lungL: { x: 70, z: -58, hx: 76, hz: 76 },
  pericardium: 12,
  /**
   * Hemidiaphragms (liver and right dome, left dome): apex height at end-expiration (mm, before the
   * genome's offset and the breathing descent), vertical half size (dome curvature) and antero-posterior
   * centre and half size of each dome ellipsoid. The right apex sits about 50 mm and the left about 35 mm
   * above the inferior heart border of the reference patient at end-expiration (the heart rests on the
   * central tendon between the domes, supine), so the domes cross the lower heart in cranial views as
   * on the library frames.
   */
  dome: { apexR: -30, apexL: -45, hy: 115, zR: -12, zL: -14, hzR: 125, hzL: 122 },
  /**
   * Posterior mediastinum and spinal column carve (vertebral bodies, posterior elements, paraspinal
   * muscles, oesophagus, azygos): centre x, z and half x, z. The lungs fill the paravertebral gutters
   * beside it.
   */
  postMedia: { x: -4, z: -112, hx: 22, hz: 52 },
  /** pulmonary trees: attraction points per lung and tree type, terminal twigs per leaf (space colonisation) */
  pulmonary: { attractors: 2000, twigs: 2 },
  /**
   * Dependent lung under the heart (supine): posterior depth (mm) over which the lung directly behind the
   * left ventricular fat envelope is not aerated (retrocardiac()). 0 = off.
   */
  retro: { depth: 40 },
  /**
   * Rib cross-section: cortical thickness (mm) at the posterior and anterior ends (linear along the rib) and
   * the density factor reached at the anterior end (wave 1: 1.0, 0.45, 0.3; S4.md, plan target cortex
   * 0.6-1.0 mm).
   */
  ribs: { tcPost: 1.0, tcAnt: 0.45, densAnt: 0.3 },
};

function lungShapes(g: ThoraxGenome, r: number): { c: Vec3; half: [number, number, number] }[] {
  const k = g.habitus;
  const dz = g.diaphragm;
  const one = (top: number, bot: number) => {
    const b = top - (top - bot) * g.lungHeight;
    return { cy: (top + b) / 2, hy: (top - b) / 2 };
  };
  const T = ANATOMY_TUNE;
  const R = one(164 + 4 * r, -108 + dz - 32 * r);
  const L = one(150 + 4 * r, -118 + dz - 36 * r);
  return [
    { c: v(T.lungR.x * k * g.width, R.cy, T.lungR.z), half: [T.lungR.hx * k * g.width, R.hy, T.lungR.hz * k * g.depth] },
    { c: v(T.lungL.x * k * g.width, L.cy, T.lungL.z), half: [T.lungL.hx * k * g.width, L.hy, T.lungL.hz * k * g.depth] },
  ];
}

/** Breathing displacement of a lung point: the affine map from the end-expiration lung to full inspiration. */
function lungDisp(l0: { c: Vec3; half: number[] }, l1: { c: Vec3; half: number[] }, p: Vec3): Vec3 {
  const q = v(l1.c.x + ((p.x - l0.c.x) * l1.half[0]) / l0.half[0], l1.c.y + ((p.y - l0.c.y) * l1.half[1]) / l0.half[1], l1.c.z + ((p.z - l0.c.z) * l1.half[2]) / l0.half[2]);
  return sub(q, p);
}

function getStatic(g: ThoraxGenome, heart: HeartFrame, rest: () => AnatShape[]): StaticThorax {
  const key = genomeKey(g) + `|${JSON.stringify(ANATOMY_TUNE)}|${[heart.base.x, heart.base.y, heart.base.z, heart.len, heart.L.x, heart.L.y, heart.L.z, heart.rS, heart.rA].map((x) => x.toFixed(2)).join(",")}`;
  const hit = staticCache.get(key);
  if (hit) return hit;
  const levels = spineLayout(g);
  const rj = prng(g.seed * 31337 + 5);
  const jits: number[][] = [];
  for (let i = 0; i < 24; i++) jits.push([0, 0, 0, 0, 0, 0].map(() => rj() * 2 - 1));
  const ribs0: RibModel[] = [],
    ribs1: RibModel[] = [];
  for (let n = 1; n <= 12; n++)
    for (const side of [-1, 1]) {
      const j = jits[(n - 1) * 2 + (side > 0 ? 1 : 0)];
      ribs0.push(ribModel(g, levels, n, side, 0, j));
      ribs1.push(ribModel(g, levels, n, side, 1, j));
    }
  const lungs0 = lungShapes(g, 0),
    lungs1 = lungShapes(g, 1);
  // pulmonary trees: grow in the end-expiration lungs, avoiding the carve shapes
  const exclude: Exclusion[] = rest()
    .filter((s) => s.carve && s.type !== 2)
    .map((s) => ({ type: s.type as 0 | 1, c: s.c, ax: s.ax, half: s.half }));
  const k = g.habitus;
  const hR = v(-40 * k, 22, -46),
    hL = v(42 * k, 30, -52);
  const vR = v(-36 * k, -6, -54),
    vL = v(38 * k, -2, -60);
  const roots: TreeRoot[] = [
    { p: hR, kind: 0, lung: 0, dirs: [v(-0.45, 0.85, 0.1), v(-0.9, 0.05, 0.3), v(-0.55, -0.8, 0.05), v(-0.4, -0.65, -0.55)] },
    { p: hL, kind: 0, lung: 1, dirs: [v(0.4, 0.85, 0.1), v(0.9, 0.05, 0.25), v(0.5, -0.8, -0.05), v(0.3, -0.6, -0.6)] },
    { p: vR, kind: 1, lung: 0, dirs: [v(-0.7, 0.6, 0.2), v(-0.85, -0.3, 0.1), v(-0.5, -0.7, -0.4)] },
    { p: vL, kind: 1, lung: 1, dirs: [v(0.7, 0.6, 0.2), v(0.85, -0.3, 0.1), v(0.45, -0.7, -0.45)] },
  ];
  // the same tree topology in every habitus: growth lengths scale with the linear lung size, so
  // the leaf and segment counts (and the segment pass's cost) do not grow with the patient
  const lungVol = (ls: { half: number[] }[]) => ls.reduce((s, l) => s + l.half[0] * l.half[1] * l.half[2], 0);
  const scale = Math.cbrt(lungVol(lungs0) / lungVol(lungShapes(REFERENCE_GENOME, 0)));
  const forest = growPulmonaryTrees({ seed: g.treeSeed, lungs: lungs0, roots, exclude, attractors: ANATOMY_TUNE.pulmonary.attractors, twigs: ANATOMY_TUNE.pulmonary.twigs, scale });

  // vertebral bones (static per genome; the spine does not move with breathing)
  const vertebraBones = vertebrae(levels);

  // static segments
  const S = new SegmentList();
  const ribDisp = (a: RibSample[], b: RibSample[]) => a.map((x, i) => sub(b[Math.min(i, b.length - 1)].p, x.p));
  for (let i = 0; i < ribs0.length; i++) {
    const r0 = ribs0[i],
      r1 = ribs1[i];
    const pts = r0.bone.map((x) => x.p);
    const disp = ribDisp(r0.bone, r1.bone);
    // cortical shell + marrow; the density falls from the posterior to the anterior rib
    const segMu = pts.slice(1).map((_, q) => {
      const dn = (r0.bone[q].dens + r0.bone[q + 1].dens) / 2;
      return [MU.corticalShell * dn, 0, 0] as [number, number, number];
    });
    const segIn = pts.slice(1).map((_, q) => {
      const dn = (r0.bone[q].dens + r0.bone[q + 1].dens) / 2;
      return [MU.ribMarrow * dn, 0, 0] as [number, number, number];
    });
    S.polyline(
      pts,
      r0.bone.map((x) => x.a),
      {
        mu: segMu,
        muIn: segIn,
        inner: r0.bone.map((x) => Math.max(0, 1 - x.tc / x.b)),
        flat: r0.bone.map((x) => x.b / x.a),
        thin: r0.bone.map((x) => x.thin),
        disp,
        sub: false,
      },
    );
    if (r0.cart.length > 1) {
      const cd = r0.cart.map((p, q) => sub(r1.cart[q] ?? p, p));
      S.polyline(r0.cart, r0.cartR, { mu: [MU.cartilage, 0, 0], disp: cd, sub: false });
    }
  }
  for (const cl of clavicles(g)) {
    const d = cl.pts.map(() => v(0, 3, 1.5)); // model parameter: clavicles rise a little on inspiration
    S.polyline(cl.pts, cl.r, { mu: [MU.corticalShell * 0.9, 0, 0], muIn: [MU.ribMarrow, 0, 0], inner: cl.r.map((x) => 1 - 1.4 / x), disp: d, sub: false });
  }
  // pulmonary vessels (arteries and veins) with their breathing displacement
  const legacyVessels: StaticThorax["legacyVessels"] = [];
  for (const ch of forest.chains) {
    const l0 = lungs0[ch.lung],
      l1 = lungs1[ch.lung];
    const d = ch.pts.map((p) => lungDisp(l0, l1, p));
    S.polyline(ch.pts, ch.r, { mu: [LUNG_VESSEL_MU, 0, 0], disp: d });
    if (Math.max(...ch.r) >= 2.0) legacyVessels.push({ pts0: ch.pts, d, r: ch.r });
  }
  // bronchi beside the larger arteries: air lumen in a thin wall (end-on they read as rings).
  // Large vessels (arteries and veins, radius >= 1.6 mm) on a 12 mm grid, so a bronchus point that would lie
  // inside another vessel (at a branch point a sibling or parent passes close) is dropped and the bronchus
  // split there: a bronchus never runs inside a vessel (C1 review round)
  const CELL = 12;
  const grid = new Map<string, { a: Vec3; b: Vec3; r: number }[]>();
  const cellKey = (x: number, y: number, z: number) => `${x},${y},${z}`;
  for (const ch of forest.chains) {
    if (Math.max(...ch.r) < 1.6) continue;
    for (let q = 0; q + 1 < ch.pts.length; q++) {
      const a = ch.pts[q],
        b = ch.pts[q + 1];
      const r = Math.max(ch.r[q], ch.r[q + 1]);
      const lo = [Math.min(a.x, b.x) - r, Math.min(a.y, b.y) - r, Math.min(a.z, b.z) - r].map((x) => Math.floor(x / CELL));
      const hi = [Math.max(a.x, b.x) + r, Math.max(a.y, b.y) + r, Math.max(a.z, b.z) + r].map((x) => Math.floor(x / CELL));
      for (let i = lo[0]; i <= hi[0]; i++)
        for (let j = lo[1]; j <= hi[1]; j++)
          for (let k2 = lo[2]; k2 <= hi[2]; k2++) {
            const key2 = cellKey(i, j, k2);
            const list = grid.get(key2);
            if (list) list.push({ a, b, r });
            else grid.set(key2, [{ a, b, r }]);
          }
    }
  }
  const insideVessel = (p: Vec3, margin: number) => {
    for (const sgm of grid.get(cellKey(Math.floor(p.x / CELL), Math.floor(p.y / CELL), Math.floor(p.z / CELL))) ?? []) {
      const ab = sub(sgm.b, sgm.a);
      const t = Math.max(0, Math.min(1, dot(sub(p, sgm.a), ab) / (dot(ab, ab) || 1)));
      if (vlen(sub(p, add(sgm.a, sc(ab, t)))) < sgm.r + margin) return true;
    }
    return false;
  };
  for (const ch of forest.chains) {
    if (ch.kind !== 0 || ch.r[0] < 1.6) continue;
    const l0 = lungs0[ch.lung],
      l1 = lungs1[ch.lung];
    // the bronchus runs alongside its artery: offset perpendicular to the local chain tangent
    // (towards posterior where that is defined, else carried over from the previous point), by the
    // two radii plus a 0.5 mm gap (model parameter), so it never lies inside or along the artery
    const rr = ch.r.map((x) => x * 0.9 + 0.4);
    let prevDir = v(0, 0, -1);
    const pts = ch.pts.map((p, q) => {
      const t = nrm(sub(ch.pts[Math.min(ch.pts.length - 1, q + 1)], ch.pts[Math.max(0, q - 1)]));
      const proj = (u: Vec3) => sub(u, sc(t, dot(u, t)));
      let d = proj(v(0, 0, -1));
      if (vlen(d) < 0.3) d = proj(prevDir);
      if (vlen(d) < 1e-3) d = proj(v(1, 0, 0));
      d = nrm(d);
      prevDir = d;
      return add(p, sc(d, ch.r[q] + rr[q] + 0.5));
    });
    // model parameter: wall about 15 % of the radius; lumen air (lung minus tissue). Runs of points outside
    // every large vessel only (see insideVessel)
    const ok = pts.map((p, q) => !insideVessel(p, 0.25 * rr[q]));
    for (let q0 = 0; q0 < pts.length; ) {
      if (!ok[q0]) {
        q0++;
        continue;
      }
      let q1 = q0;
      while (q1 + 1 < pts.length && ok[q1 + 1]) q1++;
      if (q1 > q0) {
        const run = pts.slice(q0, q1 + 1);
        S.polyline(run, rr.slice(q0, q1 + 1), {
          mu: [-MU.lungExcess * 0.9, 0, 0],
          muIn: [-(MU.soft + MU.lungExcess), 0, 0],
          inner: run.map(() => 0.82),
          disp: run.map((p) => lungDisp(l0, l1, p)),
        });
      }
      q0 = q1 + 1;
    }
  }
  const st: StaticThorax = {
    key,
    levels,
    ribs0,
    ribs1,
    forest,
    lungs0,
    lungs1,
    vertebraBones,
    segs: S.buffer(key),
    legacyVessels,
  };
  if (staticCache.size > 12) staticCache.delete(staticCache.keys().next().value as string);
  staticCache.set(key, st);
  return st;
}

/** Vertebral bodies (waisted cortical shells with endplates and rims), ring pedicles and processes. */
/** Stacked slabs per vertebral body (C1 review round; model parameter). */
const VERTEBRA_SLABS = 5;
/**
 * Concavity of the vertebral body walls: lateral and antero-posterior radius reduction (mm) at mid-height
 * relative to the walls next to the rims (model parameter, C1 review round; fitted on contact sheets of the
 * spine in LAO cranial and AP cranial against the library).
 */
const VERTEBRA_WAIST_MM: [number, number] = [2.2, 1.4];

function vertebrae(levels: Level[]): BonePrim[] {
  const out: BonePrim[] = [];
  const C = MU.corticalShell;
  for (const L of levels) {
    const ax = yAxes(L.axis);
    // small axial rotation per level
    const cr = Math.cos(L.rot),
      sr = Math.sin(L.rot);
    const ex = add(sc(ax[0], cr), sc(ax[2], sr)),
      ez = add(sc(ax[2], cr), sc(ax[0], -sr));
    const A: [Vec3, Vec3, Vec3] = [ex, ax[1], ez];
    const h2 = L.height / 2;
    // model parameters (fitted to the measured endplate width/depth, see S4.md): 1.1 mm lateral
    // cortex, about 1 mm endplates with rounded rims. The lateral and anterior walls are concave (C1 review
    // round: a single cylinder drew box-like bodies): the body is VERTEBRA_SLABS stacked open cylinders
    // whose radii follow a parabolic waist, VERTEBRA_WAIST_MM narrower at mid-height than next to the rims
    const hb = h2 - 1.2;
    for (let i = 0; i < VERTEBRA_SLABS; i++) {
      const cy = -1 + (2 * i + 1) / VERTEBRA_SLABS; // slab centre, -1..1 of the body half-height
      const w = 1 - cy * cy;
      const rxS = L.rx - 0.8 - VERTEBRA_WAIST_MM[0] * w,
        rzS = L.rz - 0.6 - VERTEBRA_WAIST_MM[1] * w;
      const c = add(L.c, sc(L.axis, cy * hb));
      const hh = hb / VERTEBRA_SLABS;
      out.push({ type: 1, c, ax: A, half: [rxS, hh, rzS], mu: MU.cortical });
      out.push({ type: 1, c, ax: A, half: [rxS - 1.1, hh, rzS - 1.1], mu: MU.cancellous - MU.cortical });
    }
    for (const s of [-1, 1]) {
      const ce = add(L.c, sc(L.axis, s * (h2 - 0.6)));
      // endplate: oblate ellipsoid, rounded rim
      out.push({ type: 0, c: ce, ax: A, half: [L.rx - 0.6, 0.75, L.rz - 0.4], mu: C * 0.9 });
      // ring apophysis: dense rim annulus about 3 mm high
      const cr2 = add(L.c, sc(L.axis, s * (h2 - 1.6)));
      out.push({ type: 1, c: cr2, ax: A, half: [L.rx, 1.5, L.rz], mu: C * 0.55 });
      out.push({ type: 1, c: cr2, ax: A, half: [L.rx - 1.6, 1.5, L.rz - 1.6], mu: -C * 0.55 });
    }
    for (const s of [-1, 1]) {
      // pedicles: cortical tubes running antero-posteriorly, seen end-on as rings ("owl eyes")
      const pc = add(add(L.c, sc(ex, s * (L.rx - 3.5))), add(sc(ez, -(L.rz + 6)), sc(L.axis, 2.5)));
      const pax: [Vec3, Vec3, Vec3] = [ex, ez, sc(L.axis, -1)];
      out.push({ type: 1, c: pc, ax: pax, half: [4.6, 4.5, 6.8], mu: C * 0.38 });
      out.push({ type: 1, c: pc, ax: pax, half: [3.1, 3.6, 5.3], mu: -C * 0.38 + MU.cancellous * 0.5 });
      // transverse processes (faint, behind the pedicles)
      out.push({ type: 0, c: add(add(L.c, sc(ex, s * (L.rx + 12))), add(sc(ez, -(L.rz + 16)), sc(L.axis, 2))), ax: A, half: [13, 4.5, 5.5], mu: MU.cortical * 0.35 });
    }
    // laminae and spinous process, sloping downwards
    out.push({ type: 0, c: add(L.c, add(sc(ez, -(L.rz + 18)), sc(L.axis, -2))), ax: A, half: [L.rx * 0.6, 6, 4], mu: MU.cortical * 0.3 });
    out.push({ type: 0, c: add(L.c, add(sc(ez, -(L.rz + 30)), sc(L.axis, -10))), ax: axesFrom(add(sc(L.axis, -0.7), sc(ez, -1)), ex), half: [20, 3.2, 3], mu: MU.cortical * 0.2 });
  }
  return out;
}

function clavicles(g: ThoraxGenome): { pts: Vec3[]; r: number[] }[] {
  const k = g.habitus;
  const F = bodyFrame(g);
  const front = F.bodyC.z + F.bodyHalf[2];
  const out: { pts: Vec3[]; r: number[] }[] = [];
  for (const s of [-1, 1]) {
    const ctrl: [number, number][] = [
      [s * 18, front - 16],
      [s * 60 * k, front - 28],
      [s * 105 * k, front - 56],
      [s * 150 * k * g.width, front - 86],
    ];
    const ys = [196, 206, 204, 196];
    const dense = catmull(ctrl, 6);
    const pts = dense.map((p, i) => {
      const f = i / (dense.length - 1);
      const y = ys[0] + (ys[1] - ys[0]) * Math.sin(Math.min(1, f * 2) * Math.PI * 0.5) - (f > 0.66 ? (f - 0.66) * 24 : 0);
      return v(p[0], y, p[1]);
    });
    out.push({ pts, r: pts.map(() => 6.2 * Math.sqrt(k)) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// buildThorax
// ---------------------------------------------------------------------------

export interface ThoraxOptions {
  /** 0 end-expiration … 1 deep inspiration */
  resp: number;
  /** body habitus scale (1 average, 0.9 slim, 1.15 large); overrides the genome's when given */
  habitus?: number;
  /** heart frame (so the mediastinum follows the heart) */
  heart: HeartFrame;
  /** heart translation from breathing, applied by the caller to the heart frame too */
  heartShift?: Vec3;
  /** patient seed (case id): selects the thorax genome. Omitted = the reference patient. */
  seed?: string | number;
  /** explicit genome (takes precedence over seed) */
  genome?: ThoraxGenome;
  /** ventricular contraction 0 diastole … 1 end-systole: the silhouette beats with it */
  contraction?: number;
  /** full heart motion state (heartMotion.motionAt); takes precedence over `contraction` for the silhouette */
  motion?: Motion;
  /**
   * Fitted heart primitives from the heart-shape stream (heartShape.ts heartShapes(H, m), already
   * moved by heartShift by the caller). Each named primitive replaces S4's shape in the matching
   * slot (HEART_SHAPE_SLOTS), so counts and the carve set are unchanged; "aortic root" and unknown
   * names are skipped.
   */
  heartShapes?: AnatShape[];
  /**
   * Draw ribs, clavicles, cartilage, pulmonary trees and hardware wires as exact segments for the
   * thorax segment pass (Thorax.segments) instead of ribbon tubes. Requires the pass to be
   * registered with the renderer; see docs/realism/wave1/S4.md.
   */
  segments?: boolean;
  /** optional hardware (sternal wires, clips, pacemaker, valves, ECG electrodes, table); null = none */
  hardware?: HardwareSpec | null;
}

export interface Thorax {
  anat: AnatShape[]; // body first; at most MAX_ANAT
  bones: BonePrim[];
  tubes: TubeSpec[];
  /** the patient's thorax genome */
  genome?: ThoraxGenome;
  /** exact segments for the thorax segment pass (only with `segments: true`) */
  segments?: ThoraxSegments;
  /** seed for the procedural lung clutter (clutter.ts) */
  clutterSeed?: number;
  /**
   * Bony rib centre lines at this breathing state (every second sample, about 7 mm apart) with the wide
   * semi-axis of the cross-section (mm), for CPU readers such as the capture harness's rib-margin
   * annotations. With `segments: true` the ribs are drawn by the thorax segment pass and are not in
   * `tubes`, so this is the only place they can be read from.
   */
  ribLines?: { pts: Vec3[]; a: number[] }[];
}

/** Does a shape contain point p? (world axes, as the renderer's interval test) */
export function shapeContains(s: Shape, p: Vec3): boolean {
  const d = sub(p, s.c);
  const x = dot(d, s.ax[0]) / s.half[0],
    y = dot(d, s.ax[1]) / s.half[1],
    z = dot(d, s.ax[2]) / s.half[2];
  if (s.type === 0) return x * x + y * y + z * z < 1;
  if (s.type === 1) return x * x + z * z < 1 && Math.abs(y) < 1;
  return Math.abs(x) < 1 && Math.abs(y) < 1 && Math.abs(z) < 1;
}

/** Least-squares affine map p -> A p + t taking the rest epicardium to its displaced position. */
function heartAffine(H: HeartFrame, m: Motion): { A: number[]; t: Vec3 } | null {
  const P0: Vec3[] = [],
    P1: Vec3[] = [];
  for (const ell of [-0.85, -0.5, -0.15, 0.2, 0.55, 0.85])
    for (let phi = -180; phi < 180; phi += 30) {
      P0.push(restPoint(H, ell, phi, 0));
      P1.push(surfacePoint(H, ell, phi, 0, m));
    }
  const n = P0.length;
  const m0 = sc(P0.reduce(add, v(0, 0, 0)), 1 / n),
    m1 = sc(P1.reduce(add, v(0, 0, 0)), 1 / n);
  const XX = new Array(9).fill(0),
    YX = new Array(9).fill(0);
  for (let i = 0; i < n; i++) {
    const x = sub(P0[i], m0),
      y = sub(P1[i], m1);
    const xa = [x.x, x.y, x.z],
      ya = [y.x, y.y, y.z];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) {
        XX[r * 3 + c] += xa[r] * xa[c];
        YX[r * 3 + c] += ya[r] * xa[c];
      }
  }
  const inv = inv3(XX);
  if (!inv) return null;
  const A = mul3(YX, inv);
  const Am0 = v(A[0] * m0.x + A[1] * m0.y + A[2] * m0.z, A[3] * m0.x + A[4] * m0.y + A[5] * m0.z, A[6] * m0.x + A[7] * m0.y + A[8] * m0.z);
  return { A, t: sub(m1, Am0) };
}

function mul3(a: number[], b: number[]): number[] {
  const o = new Array(9).fill(0);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) for (let k = 0; k < 3; k++) o[r * 3 + c] += a[r * 3 + k] * b[k * 3 + c];
  return o;
}
function inv3(m: number[]): number[] | null {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h,
    B = -(d * i - f * g),
    C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) return null;
  return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
}
/** Eigen-decomposition of a symmetric 3x3 matrix (cyclic Jacobi): eigenvalues and unit eigenvectors. */
function eigSym3(m: number[]): { val: number[]; vec: Vec3[] } {
  const a = [m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8]];
  const V = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (let sweep = 0; sweep < 12; sweep++) {
    for (const [p, q] of [
      [0, 1],
      [0, 2],
      [1, 2],
    ]) {
      const apq = a[p * 3 + q];
      if (Math.abs(apq) < 1e-12) continue;
      const th = (a[q * 3 + q] - a[p * 3 + p]) / (2 * apq);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const cs = 1 / Math.sqrt(t * t + 1),
        sn = t * cs;
      for (let k = 0; k < 3; k++) {
        const akp = a[k * 3 + p],
          akq = a[k * 3 + q];
        a[k * 3 + p] = cs * akp - sn * akq;
        a[k * 3 + q] = sn * akp + cs * akq;
      }
      for (let k = 0; k < 3; k++) {
        const apk = a[p * 3 + k],
          aqk = a[q * 3 + k];
        a[p * 3 + k] = cs * apk - sn * aqk;
        a[q * 3 + k] = sn * apk + cs * aqk;
      }
      for (let k = 0; k < 3; k++) {
        const vkp = V[k * 3 + p],
          vkq = V[k * 3 + q];
        V[k * 3 + p] = cs * vkp - sn * vkq;
        V[k * 3 + q] = sn * vkp + cs * vkq;
      }
    }
  }
  return { val: [a[0], a[4], a[8]], vec: [0, 1, 2].map((j) => v(V[j], V[3 + j], V[6 + j])) };
}
/** Image of an ellipsoid under an affine map (an ellipsoid; axes from the eigenvectors of N N^T). */
function transformEllipsoid(e: { c: Vec3; ax: [Vec3, Vec3, Vec3]; half: [number, number, number] }, f: { A: number[]; t: Vec3 }) {
  const ap = (p: Vec3) => v(f.A[0] * p.x + f.A[1] * p.y + f.A[2] * p.z, f.A[3] * p.x + f.A[4] * p.y + f.A[5] * p.z, f.A[6] * p.x + f.A[7] * p.y + f.A[8] * p.z);
  const cols = e.ax.map((a, i) => ap(sc(a, e.half[i])));
  // N N^T
  const NN = new Array(9).fill(0);
  for (const col of cols) {
    const q = [col.x, col.y, col.z];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) NN[r * 3 + c] += q[r] * q[c];
  }
  const { val, vec } = eigSym3(NN);
  // keep the axis order of the source (closest eigenvector to each source axis)
  const used = [false, false, false];
  const ax: Vec3[] = [],
    half: number[] = [];
  for (let i = 0; i < 3; i++) {
    let best = -1,
      bd = -1;
    for (let j = 0; j < 3; j++) {
      if (used[j]) continue;
      const d = Math.abs(dot(vec[j], e.ax[i]));
      if (d > bd) {
        bd = d;
        best = j;
      }
    }
    used[best] = true;
    ax.push(dot(vec[best], e.ax[i]) < 0 ? sc(vec[best], -1) : vec[best]);
    half.push(Math.sqrt(Math.max(1e-6, val[best])));
  }
  return { c: add(ap(e.c), f.t), ax: ax as [Vec3, Vec3, Vec3], half: half as [number, number, number] };
}

/** Axis-aligned half extents of a shape (world mm). */
function shapeExtent(s: Shape): [number, number, number] {
  const comp = (d: 0 | 1 | 2) => Math.sqrt(s.ax.reduce((a, ax, i) => a + ((d === 0 ? ax.x : d === 1 ? ax.y : ax.z) * s.half[i]) ** 2, 0));
  return [comp(0), comp(1), comp(2)];
}

/**
 * Model parameters (C1, wave 2): the anterior mediastinum carve. Between the ventricles and the
 * anterior chest wall the lungs leave the pericardium against the chest wall (the cardiac notch
 * and the retrosternal space), so a ray through the cardiac silhouette crosses little lung in front
 * of the heart; the lingula still covers the lateral left border and the lower lobes stay behind
 * the heart. Without this carve the ellipsoidal lungs ran in front of the ventricles and the heart
 * silhouette lost most of its contrast against the lung fields. Sizes are fractions of the
 * ventricular extent, fitted on the contact sheets against library frames (docs/realism/wave2/C1.md).
 */
const ANT_MEDIA_X_CENTRE = 0.42;
const ANT_MEDIA_X_HALF = 0.4;
const ANT_MEDIA_Y_HALF = 0.5;
/** inner surface of the anterior chest wall below the skin (mm), model parameter */
const ANT_CHEST_WALL_MM = 12;

function anteriorMediastinum(lv: Shape, rv: Shape, bodyFront: number): Shape {
  const el = shapeExtent(lv),
    er = shapeExtent(rv);
  const x0 = Math.min(lv.c.x - el[0], rv.c.x - er[0]),
    x1 = Math.max(lv.c.x + el[0], rv.c.x + er[0]);
  const y0 = Math.min(lv.c.y - el[1], rv.c.y - er[1]),
    y1 = Math.max(lv.c.y + el[1], rv.c.y + er[1]);
  const zc = (lv.c.z + rv.c.z) / 2;
  const front = bodyFront - ANT_CHEST_WALL_MM;
  return {
    type: 0,
    c: v(x0 + ANT_MEDIA_X_CENTRE * (x1 - x0), (y0 + y1) / 2, (zc + front) / 2),
    ax: I3,
    half: [ANT_MEDIA_X_HALF * (x1 - x0), ANT_MEDIA_Y_HALF * (y1 - y0), Math.max(10, (front - zc) / 2)],
  };
}

/**
 * Dependent lung under the heart (C1, wave 2). Supine, the heart rests on the left lower lobe and the lung
 * directly beneath it (towards the table, world -z) is compressed and poorly aerated, so a ray through the
 * ventricles crosses little aerated lung behind them. Modelled as the left ventricular fat envelope swept
 * posteriorly: the envelope translated by ANATOMY_TUNE.retro.depth along -z (the carve union of the two
 * keeps the frontal silhouette of the heart unchanged). Model parameter, fitted on the vessel-path probe
 * (scripts/thorax/probe_c1_heart.ts) and the contact sheets (docs/realism/wave2/C1.md).
 */
function retrocardiac(lvFat: Shape): Shape {
  const d = ANATOMY_TUNE.retro.depth;
  // the epicardial envelope without the pericardial growth: the compressed lung lies under the ventricle
  // itself, not under the pericardial fat at its medial edge (the right paravertebral gutter stays aerated)
  const g = ANATOMY_TUNE.pericardium;
  const half: [number, number, number] = [Math.max(1, lvFat.half[0] - g), Math.max(1, lvFat.half[1] - g), Math.max(1, lvFat.half[2] - g)];
  // it is left lower lobe: its medial edge stays at the left of the spine carve's right border, so the right
  // paravertebral gutter (right lower lobe) stays aerated
  const extX = Math.sqrt(lvFat.ax.reduce((a, ax, i) => a + (ax.x * half[i]) ** 2, 0));
  const PM = ANATOMY_TUNE.postMedia;
  const cx = Math.max(lvFat.c.x, PM.x - PM.hx + extX);
  return { type: lvFat.type, c: v(cx, lvFat.c.y, lvFat.c.z - d), ax: lvFat.ax, half };
}

/**
 * The venae cavae for a right atrium (C1, wave 2): the superior vena cava from above the azygos arch
 * into the upper atrium, the inferior vena cava from the lower atrium through the central tendon into
 * the liver. Both ends follow the atrium (which rides on the diaphragm), so breathing never opens a gap
 * between the cavae and the atrium, and the right lung does not close around the atrium as a disc.
 * Model parameters (radii 12 and 14 mm, joined to the atrium a quarter of its height from its centre).
 */
function venaeCavae(ra: Shape, hs: Vec3, k: number, dd: number): { svc: Shape; ivc: Shape } {
  const ext = shapeExtent(ra);
  const raC = ra.c;
  const cyl = (top: Vec3, bot: Vec3, rad: number): Shape => ({ type: 1, c: sc(add(top, bot), 0.5), ax: yAxes(sub(top, bot)), half: [rad, vlen(sub(top, bot)) / 2, rad] });
  const svc = cyl(add(v(-30, 108, -10), sc(hs, 0.2)), add(raC, v(4, ext[1] * 0.25, 0)), 12);
  const ivc = cyl(add(raC, v(4, -ext[1] * 0.25, -6)), v(-26 * k, ANATOMY_TUNE.dome.apexR - 70 - dd, -24), 14);
  return { svc, ivc };
}

/** The exact anatomy shapes for one frame (index = ANAT). */
function thoraxShapes(g: ThoraxGenome, H: HeartFrame, r: number, e: number, hs: Vec3, motion?: Motion): Shape[] {
  const k = g.habitus;
  const F = bodyFrame(g);
  const anat: Shape[] = [];

  anat[ANAT.BODY] = { type: 1, c: F.bodyC, ax: I3, half: F.bodyHalf };
  const lungs = lungShapes(g, r);
  anat[ANAT.LUNG_R] = { type: 0, c: lungs[0].c, ax: I3, half: lungs[0].half };
  anat[ANAT.LUNG_L] = { type: 0, c: lungs[1].c, ax: I3, half: lungs[1].half };

  // ventricles: the heart frame's LV and RV epicardial ellipsoids (heart.ts), moved by the affine
  // map that best fits the heart's own displacement field this frame, so the silhouette and the
  // coronaries beat together; the lungs are carved around a thin epicardial fat envelope
  const fat = g.heartFat;
  const mot: Motion | undefined = motion ?? (e > 0 ? { contraction: e } : undefined);
  const aff = H.lv && H.rv && mot ? heartAffine(H, mot) : null;
  const ell = (x: { c: Vec3; ax: [Vec3, Vec3, Vec3]; half: [number, number, number] }, grow: number): Shape => {
    const t = aff ? transformEllipsoid(x, aff) : x;
    return { type: 0, c: add(t.c, hs), ax: t.ax, half: [t.half[0] + grow, t.half[1] + grow, t.half[2] + grow] };
  };
  if (H.lv && H.rv) {
    anat[ANAT.HEART] = ell(H.lv, 2.5);
    anat[ANAT.HEART_FAT] = ell(H.lv, 2.5 + fat + ANATOMY_TUNE.pericardium);
    anat[ANAT.RV] = ell(H.rv, 2.5);
    anat[ANAT.RV_FAT] = ell(H.rv, 2.5 + fat + ANATOMY_TUNE.pericardium);
  } else {
    // legacy heart frame (one ellipsoid between the margins)
    const longHalf = H.len * 0.6 - 0.06 * H.len * e;
    const hcBase = add(add(H.base, sc(H.L, H.len * 0.44 + 0.06 * H.len * e)), hs);
    const hc = add(hcBase, add(sc(H.S, (H.rS - H.rSr) * 0.4), sc(H.A, (H.rA - H.rAp) * 0.4)));
    const radial = 1 - 0.05 * e;
    const hA = ((H.rA + H.rAp) / 2) * radial + 3;
    const hS = ((H.rS + H.rSr) / 2) * radial + 3;
    anat[ANAT.HEART] = { type: 0, c: hc, ax: [H.L, H.A, H.S], half: [longHalf, hA, hS] };
    anat[ANAT.HEART_FAT] = { type: 0, c: hc, ax: [H.L, H.A, H.S], half: [longHalf + fat + 2, hA + fat, hS + fat] };
    anat[ANAT.RV] = anat[ANAT.HEART];
    anat[ANAT.RV_FAT] = anat[ANAT.HEART_FAT];
  }
  // atria fill while the ventricles contract
  const atr = 1 + 0.04 * e;
  anat[ANAT.RA] = { type: 0, c: add(v(-40, -12, -6), sc(hs, 0.8)), ax: I3, half: [30 * atr, 40, 32 * atr] };
  anat[ANAT.MEDIA] = { type: 0, c: add(v(4, 36, -26), sc(hs, 0.4)), ax: I3, half: [38, 85, 44] };
  const PM = ANATOMY_TUNE.postMedia;
  anat[ANAT.POST_MEDIA] = { type: 0, c: v(PM.x, -36, PM.z), ax: I3, half: [PM.hx, 150, PM.hz] };
  anat[ANAT.LA] = { type: 0, c: add(v(12, -8, -48), sc(hs, 0.6)), ax: I3, half: [40 * atr, 25, 27 * atr] };
  anat[ANAT.PA_TRUNK] = { type: 0, c: add(v(24, 30, 14), sc(hs, 0.4)), ax: axesFrom(v(0.35, 1, -0.45), v(1, 0, 0)), half: [34, 15, 15] };
  anat[ANAT.AORTIC_KNOB] = { type: 0, c: add(v(10 + 6 * g.aortaUnfold, 92, -32), sc(hs, 0.2)), ax: I3, half: [24 + 6 * g.aortaUnfold, 17, 28] };
  anat[ANAT.RVOT] = { type: 0, c: add(v(8, -6, 26), sc(hs, 0.9)), ax: I3, half: [32, 30, 22] };
  const dd = DIAPHRAGM_DESCENT * r - g.diaphragm;
  const cav = venaeCavae(anat[ANAT.RA], hs, k, dd);
  anat[ANAT.SVC] = cav.svc;
  const D = ANATOMY_TUNE.dome;
  anat[ANAT.IVC] = cav.ivc;
  anat[ANAT.RETRO] = retrocardiac(anat[ANAT.HEART_FAT]);
  anat[ANAT.LIVER] = { type: 0, c: v(-62 * k, D.apexR - D.hy - dd, D.zR), ax: I3, half: [125 * k, D.hy, D.hzR * k] };
  anat[ANAT.LEFT_DOME] = { type: 0, c: v(58 * k, D.apexL - D.hy - dd, D.zL), ax: I3, half: [112 * k, D.hy, D.hzL * k] };
  // gastric air under the left dome (supine: a flat collection in the anterior stomach; model parameter)
  anat[ANAT.STOMACH] = { type: 0, c: v(78 * k, D.apexL - 52 - dd, -20), ax: I3, half: [24, 8, 18] };
  anat[ANAT.TRACHEA] = { type: 1, c: v(-4, 150, -42), ax: I3, half: [9, 72, 9] };
  const carina = v(-4, 78, -44);
  const br = (end: Vec3, rad: number): Shape => {
    const mid = sc(add(carina, end), 0.5);
    const d = sub(end, carina);
    return { type: 1, c: mid, ax: yAxes(d), half: [rad, vlen(d) / 2, rad] };
  };
  anat[ANAT.BRONCH_R] = br(v(-42, 56, -50), 7);
  anat[ANAT.BRONCH_L] = br(v(44, 48, -54), 6);
  // great vessels: descending aorta along the catheter's femoral course and the ascending aorta
  const daTop = add(v(22, 64, -70), sc(hs, 0.15)),
    daBot = v(24, -250, -86);
  anat[ANAT.DESC_AORTA] = { type: 1, c: sc(add(daTop, daBot), 0.5), ax: yAxes(sub(daTop, daBot)), half: [11.5, vlen(sub(daTop, daBot)) / 2, 11.5] };
  const aaBot = add(v(0, 8, 0), sc(hs, 0.45)),
    aaTop = add(v(3, 84, -12), sc(hs, 0.25));
  anat[ANAT.ASC_AORTA] = { type: 1, c: sc(add(aaTop, aaBot), 0.5), ax: yAxes(sub(aaTop, aaBot)), half: [15, vlen(sub(aaTop, aaBot)) / 2, 15] };
  // lobulation of the left heart border: left atrial appendage and the cardiophrenic fat pad
  anat[ANAT.LAA] = { type: 0, c: add(add(H.base, add(sc(H.S, H.rS * 0.92), add(sc(H.A, -H.rA * 0.15), sc(H.L, -H.len * 0.06)))), hs), ax: I3, half: [14 * atr, 10, 12] };
  anat[ANAT.FAT_PAD] = {
    type: 0,
    c: add(add(H.base, add(sc(H.L, H.len * 0.92), add(sc(H.S, H.rS * 0.45), v(0, -10, 0)))), sc(hs, 0.9)),
    ax: I3,
    half: [24 + 2 * fat, 13, 22 + fat],
  };
  anat[ANAT.ANT_MEDIA] = anteriorMediastinum(anat[ANAT.HEART], anat[ANAT.RV], F.bodyC.z + F.bodyHalf[2]);
  if (g.breasts) {
    const front = F.bodyC.z + F.bodyHalf[2];
    anat[ANAT.BREAST_R] = { type: 0, c: v(-74 * k, -46, front - 8), ax: I3, half: [58 * k, 52 * k, 38 * k] };
    anat[ANAT.BREAST_L] = { type: 0, c: v(74 * k, -46, front - 8), ax: I3, half: [58 * k, 52 * k, 38 * k] };
  }
  return anat;
}

export function buildThorax(o: ThoraxOptions): Thorax {
  const g0 = o.genome ?? (o.seed !== undefined ? thoraxGenome(o.seed) : REFERENCE_GENOME);
  const g: ThoraxGenome = o.habitus !== undefined ? { ...g0, habitus: o.habitus } : g0;
  const k = g.habitus;
  const r = o.resp;
  const e = Math.min(1, Math.max(0, o.contraction ?? 0));
  const hs = o.heartShift ?? v(0, 0, 0);
  const H = o.heart;
  const F = bodyFrame(g);
  const anat = thoraxShapes(g, H, r, e, hs, o.motion);
  let shapes = withMaterials(anat);
  if (o.heartShapes?.length) {
    shapes = mergeHeartShapes(shapes, o.heartShapes);
    // the cavae follow the fitted right atrium
    const cav = venaeCavae(shapes[ANAT.RA], hs, k, DIAPHRAGM_DESCENT * r - g.diaphragm);
    shapes[ANAT.SVC] = { ...shapes[ANAT.SVC], ...cav.svc };
    shapes[ANAT.IVC] = { ...shapes[ANAT.IVC], ...cav.ivc };
    // and the dependent lung follows the fitted left ventricular envelope
    shapes[ANAT.RETRO] = { ...shapes[ANAT.RETRO], ...retrocardiac(shapes[ANAT.HEART_FAT]) };
  }

  // ---- per-genome static geometry ----
  const st = getStatic(g, H, () => withMaterials(thoraxShapes(g, H, 0, 0, v(0, 0, 0))));

  // ---- bones ----
  const bones: BonePrim[] = [...st.vertebraBones];
  const front = F.bodyC.z + F.bodyHalf[2];
  // sternum: manubrium and body as flattened cortical shells; it rises a little on inspiration
  const stz = front - 12 + 3 * r;
  const sternum = (c: Vec3, half: [number, number, number]) => {
    bones.push({ type: 1, c, ax: I3, half, mu: MU.cortical * 0.9 });
    bones.push({ type: 1, c, ax: I3, half: [half[0] - 1.2, half[1] - 1.2, half[2] - 1.1], mu: MU.cancellous * 0.9 - MU.cortical * 0.9 });
  };
  sternum(v(0, 178 + 6 * r, stz), [24 * k, 22, 6]);
  sternum(v(0, 102 + 6 * r, stz + 1), [14 * k, 52, 5.5]);
  bones.push({ type: 0, c: v(0, 42 + 6 * r, stz), ax: I3, half: [7, 10, 3], mu: MU.cartilage });
  // scapulae: thin plates with a denser rim
  for (const s of [-1, 1]) {
    const ax = axesFrom(v(s * 0.35, 1, 0.15), v(1, 0, 0));
    const c = v(s * 112 * k * g.width, 110, F.bodyC.z - F.bodyHalf[2] + 30);
    bones.push({ type: 0, c, ax, half: [78, 48, 4], mu: MU.cortical * 0.75 });
    bones.push({ type: 0, c, ax, half: [75, 45, 2.8], mu: -MU.cortical * 0.75 + MU.cancellous * 0.5 });
  }

  // ---- ribs, clavicles, cartilage and pulmonary vessels ----
  const tubes: TubeSpec[] = [];
  let segments: ThoraxSegments | undefined;
  const hw: HardwareGeometry | null = o.hardware ? buildHardware(o.hardware, { resp: r, heart: H, heartShift: hs, contraction: e, habitus: k, bodyFront: front, bodyBack: F.bodyC.z - F.bodyHalf[2], bodyHalfX: F.bodyHalf[0], seed: g.seed }) : null;
  if (o.segments) {
    let dyn: SegmentBuffer | null = null;
    if (hw && hw.wires.length) {
      const D = new SegmentList();
      for (const w of hw.wires) D.polyline(w.pts, w.r, { mu: w.mu, muIn: w.muIn, inner: w.inner, flat: w.flat, thin: w.thin });
      // the key is a hash of the packed data itself, so any change of patient, heart frame, spec,
      // breathing or contraction re-uploads, and an identical frame does not (a few thousand floats)
      dyn = D.buffer(`hw${D.count}:${hashFloats(D.data, D.count * SEG_FLOATS)}`);
    }
    segments = { stat: st.segs, dyn, resp: r };
  } else {
    for (let i = 0; i < st.ribs0.length; i++) {
      const a = st.ribs0[i],
        b = st.ribs1[i];
      // every second sample (about 7 mm apart) keeps the ribbon path's CPU cost at the wave-0 level
      const keep = a.bone.map((_, q) => q).filter((q) => q % 2 === 0 || q === a.bone.length - 1);
      const bs = keep.map((q) => a.bone[q]);
      const pts = keep.map((q) => lerpV(a.bone[q].p, b.bone[Math.min(q, b.bone.length - 1)].p, r));
      const thinDir = bs.map((x) => x.thin);
      // cortical shell (outer) and marrow (inner): the shell seen edge-on draws the rib margins.
      // The two tubes share one points array so the renderer samples them identically.
      tubes.push({ pts, r: bs.map((x) => x.a), mu: [MU.corticalShell * 0.85, 0, 0], thin: { dir: thinDir, r: bs.map((x) => x.b) } });
      tubes.push({
        pts,
        r: bs.map((x) => Math.max(0.5, x.a - x.tc)),
        mu: [MU.ribMarrow - MU.corticalShell * 0.85, 0, 0],
        thin: { dir: thinDir, r: bs.map((x) => Math.max(0.3, x.b - x.tc)) },
      });
      if (a.cart.length > 1) tubes.push({ pts: a.cart.map((p, q) => lerpV(p, b.cart[q] ?? p, r)), r: a.cartR, mu: [MU.cartilage, 0, 0] });
    }
    for (const cl of clavicles(g)) {
      const pts = cl.pts.map((p) => add(p, v(0, 3 * r, 1.5 * r)));
      tubes.push({ pts, r: cl.r, mu: [MU.corticalShell * 0.9, 0, 0] });
      tubes.push({ pts, r: cl.r.map((x) => x - 1.4), mu: [MU.ribMarrow - MU.corticalShell * 0.9, 0, 0] });
    }
    for (const lv of st.legacyVessels) {
      tubes.push({ pts: lv.pts0.map((p, q) => add(p, sc(lv.d[q], r))), r: lv.r, mu: [LUNG_VESSEL_MU, 0, 0] });
    }
    if (hw)
      for (const w of hw.wires) {
        if (w.flat !== undefined && w.pts.length === 2) {
          // flat cans and discs: an ellipsoid in the soft/bone channel (the legacy path has no metal solids)
          const axis = sub(w.pts[1], w.pts[0]);
          const th = w.thin?.[0] ?? v(0, 1, 0);
          const ax0 = nrm(cross(th, axis));
          bones.push({ type: 0, c: sc(add(w.pts[0], w.pts[1]), 0.5), ax: [ax0, nrm(th), nrm(axis)], half: [w.r[0], w.r[0] * w.flat, vlen(axis) / 2], mu: w.mu[2] * 0.6 });
        } else {
          // a ribbon tube has one material: the shell and core materials weighted by their areas
          const ia = (w.inner ?? 0) ** 2;
          const mi = w.muIn ?? [0, 0, 0];
          tubes.push({ pts: w.pts, r: w.r, mu: [w.mu[0] * (1 - ia) + mi[0] * ia, w.mu[1] * (1 - ia) + mi[1] * ia, w.mu[2] * (1 - ia) + mi[2] * ia] });
        }
      }
  }
  if (hw) for (const b of hw.solids) bones.push(b);
  const ribLines = st.ribs0.map((a, i) => {
    const b = st.ribs1[i];
    const keep = a.bone.map((_, q) => q).filter((q) => q % 2 === 0 || q === a.bone.length - 1);
    return { pts: keep.map((q) => lerpV(a.bone[q].p, b.bone[Math.min(q, b.bone.length - 1)].p, r)), a: keep.map((q) => a.bone[q].a) };
  });
  return { anat: shapes, bones, tubes, genome: g, segments, clutterSeed: g.seed, ribLines };
}

/**
 * Slot of each heart-shape primitive (heartShape.ts HEART_SHAPE_NAMES) in Thorax.anat. The
 * fitted primitive replaces S4's own shape in that slot, so the shape count, the carve count and
 * the ANAT index map are unchanged. "aortic root" has no slot: ASC_AORTA already covers the root
 * and sinuses, so it is skipped (adding it would double the root's soft tissue).
 */
export const HEART_SHAPE_SLOTS: Readonly<Record<string, number>> = {
  "lv myocardium": ANAT.HEART,
  "lv epicardial fat": ANAT.HEART_FAT,
  "rv myocardium": ANAT.RV,
  "rv epicardial fat": ANAT.RV_FAT,
  "right atrium": ANAT.RA,
  "left atrium": ANAT.LA,
  "left atrial appendage": ANAT.LAA,
  "right ventricular outflow": ANAT.RVOT,
  "cardiophrenic fat pad": ANAT.FAT_PAD,
};
/** Heart-shape names that are deliberately not merged (covered by an S4 shape). */
export const HEART_SHAPE_SKIPPED = ["aortic root"] as const;

/**
 * Replace S4's heart shapes with the heart-shape stream's fitted primitives, by name. Geometry and
 * material come from the fitted primitive; the slot keeps S4's name and carve flag, so the anat
 * list keeps its length, order and carve set (at most MAX_ANAT shapes, at most MAX_CARVE_SHAPES
 * carving). Unknown names are ignored (never appended), so a newer heart-shape list cannot push the
 * anatomy past the shader limits or double-count a chamber.
 */
export function mergeHeartShapes(shapes: AnatShape[], heart: AnatShape[]): AnatShape[] {
  const out = [...shapes];
  const done = new Set<number>();
  for (const h of heart) {
    const i = h.name !== undefined ? HEART_SHAPE_SLOTS[h.name] : undefined;
    if (i === undefined || done.has(i) || !out[i]) continue;
    done.add(i);
    const slot = out[i];
    // the ventricular fat envelopes the lungs are carved around also take the pericardial sac (ANATOMY_TUNE)
    const g = i === ANAT.HEART_FAT || i === ANAT.RV_FAT ? ANATOMY_TUNE.pericardium : 0;
    const half: [number, number, number] = g ? [h.half[0] + g, h.half[1] + g, h.half[2] + g] : h.half;
    out[i] = { type: h.type, c: h.c, ax: h.ax, half, mu: h.mu, lung: false, carve: slot.carve, name: slot.name };
  }
  return out;
}

/** Materials for the standard thorax shapes (index = ANAT). */
function withMaterials(anat: Shape[]): AnatShape[] {
  const M: Record<number, Omit<AnatShape, keyof Shape>> = {
    [ANAT.BODY]: { mu: MU.soft, name: "body" },
    [ANAT.LUNG_R]: { mu: MU.lungExcess, lung: true, name: "right lung" },
    [ANAT.LUNG_L]: { mu: MU.lungExcess, lung: true, name: "left lung" },
    // epicardial fat is the shell between the fat envelope and the ventricular mass
    [ANAT.HEART]: { mu: -MU.fatExcess * 0.5, name: "ventricles" },
    [ANAT.HEART_FAT]: { mu: MU.fatExcess * 0.5, carve: true, name: "pericardial fat" },
    [ANAT.RA]: { mu: 0, carve: true, name: "right atrium" },
    [ANAT.MEDIA]: { mu: 0, carve: true, name: "superior mediastinum" },
    [ANAT.LIVER]: { mu: MU.liverExcess, carve: true, name: "liver and right hemidiaphragm" },
    [ANAT.STOMACH]: { mu: MU.airExcess, name: "gastric air" },
    [ANAT.TRACHEA]: { mu: MU.airExcess, name: "trachea" },
    [ANAT.BRONCH_R]: { mu: MU.airExcess, name: "right main bronchus" },
    [ANAT.BRONCH_L]: { mu: MU.airExcess, name: "left main bronchus" },
    [ANAT.POST_MEDIA]: { mu: 0, carve: true, name: "posterior mediastinum" },
    [ANAT.LA]: { mu: 0, carve: true, name: "left atrium" },
    [ANAT.PA_TRUNK]: { mu: 0, carve: true, name: "pulmonary trunk" },
    [ANAT.AORTIC_KNOB]: { mu: 0, carve: true, name: "aortic knob" },
    [ANAT.RVOT]: { mu: 0, carve: true, name: "right ventricular outflow" },
    [ANAT.SVC]: { mu: 0, carve: true, name: "superior vena cava" },
    [ANAT.LEFT_DOME]: { mu: 0, carve: true, name: "left hemidiaphragm" },
    [ANAT.DESC_AORTA]: { mu: 0, carve: true, name: "descending aorta" },
    [ANAT.ASC_AORTA]: { mu: 0, carve: true, name: "ascending aorta" },
    [ANAT.RV_FAT]: { mu: 0, carve: true, name: "right ventricular fat envelope" },
    [ANAT.RV]: { mu: 0, name: "right ventricle" },
    [ANAT.LAA]: { mu: 0, carve: true, name: "left atrial appendage" },
    [ANAT.FAT_PAD]: { mu: MU.fatExcess, carve: true, name: "cardiophrenic fat pad" },
    [ANAT.ANT_MEDIA]: { mu: 0, carve: true, name: "anterior mediastinum" },
    [ANAT.IVC]: { mu: 0, carve: true, name: "inferior vena cava" },
    [ANAT.RETRO]: { mu: 0, carve: true, name: "dependent lung under the heart" },
    // model parameter: breast tissue partly outside the body ellipse (fat-rich, below soft tissue)
    [ANAT.BREAST_R]: { mu: MU.soft * 0.6, name: "right breast" },
    [ANAT.BREAST_L]: { mu: MU.soft * 0.6, name: "left breast" },
  };
  const out: AnatShape[] = [];
  anat.forEach((s, i) => {
    if (s) out.push({ ...s, ...(M[i] ?? { mu: 0 }) });
  });
  return out;
}

// ---------------------------------------------------------------------------
// CPU reference of the anatomy pass (tests, exposure control)
// ---------------------------------------------------------------------------

/** Ray interval through a shape (same algebra as the renderer's GLSL interval()). Empty when [1, 0]. */
export function shapeInterval(s: Shape, ro: Vec3, rd: Vec3): [number, number] {
  const o0 = sub(ro, s.c);
  const o = v(dot(o0, s.ax[0]) / s.half[0], dot(o0, s.ax[1]) / s.half[1], dot(o0, s.ax[2]) / s.half[2]);
  const d = v(dot(rd, s.ax[0]) / s.half[0], dot(rd, s.ax[1]) / s.half[1], dot(rd, s.ax[2]) / s.half[2]);
  const E: [number, number] = [1, 0];
  if (s.type === 0) {
    const a = dot(d, d),
      b = 2 * dot(o, d),
      c = dot(o, o) - 1;
    const disc = b * b - 4 * a * c;
    if (disc <= 0) return E;
    const q = Math.sqrt(disc);
    return [(-b - q) / (2 * a), (-b + q) / (2 * a)];
  }
  if (s.type === 1) {
    const a = d.x * d.x + d.z * d.z,
      b = 2 * (o.x * d.x + o.z * d.z),
      c = o.x * o.x + o.z * o.z - 1;
    let tc: [number, number];
    if (a < 1e-10) {
      if (c > 0) return E;
      tc = [-1e9, 1e9];
    } else {
      const disc = b * b - 4 * a * c;
      if (disc <= 0) return E;
      const q = Math.sqrt(disc);
      tc = [(-b - q) / (2 * a), (-b + q) / (2 * a)];
    }
    let ty: [number, number];
    if (Math.abs(d.y) < 1e-10) {
      if (Math.abs(o.y) > 1) return E;
      ty = [-1e9, 1e9];
    } else {
      const t1 = (-1 - o.y) / d.y,
        t2 = (1 - o.y) / d.y;
      ty = [Math.min(t1, t2), Math.max(t1, t2)];
    }
    return [Math.max(tc[0], ty[0]), Math.min(tc[1], ty[1])];
  }
  const ts: number[] = [];
  let t0 = -1e9,
    t1 = 1e9;
  for (const [oo, dd] of [
    [o.x, d.x],
    [o.y, d.y],
    [o.z, d.z],
  ]) {
    if (Math.abs(dd) < 1e-12) {
      if (Math.abs(oo) > 1) return E;
      continue;
    }
    const a = (-1 - oo) / dd,
      b = (1 - oo) / dd;
    t0 = Math.max(t0, Math.min(a, b));
    t1 = Math.min(t1, Math.max(a, b));
  }
  void ts;
  return [t0, t1];
}

/**
 * Line integral of the exact anatomy shapes along one ray, as the renderer's anatomy pass computes
 * it (without clutter): non-lung shapes add mu x length, lungs add mu over the part of their
 * path outside the union of carve shapes. Also returns the aerated lung path and body interval.
 */
export function traceAnat(anat: AnatShape[], ro: Vec3, rd: Vec3): { P: number; lungPath: number; body: [number, number] } {
  const iv = anat.map((s) => shapeInterval(s, ro, rd));
  const L = (i: [number, number]) => Math.max(0, i[1] - i[0]);
  let P = 0,
    lungPath = 0;
  anat.forEach((s, i) => {
    if (!s.lung) P += s.mu * L(iv[i]);
  });
  // aerated lung: the union of the lung shapes (they may overlap at the midline) minus the union of the
  // carve shapes, as the renderer's ANAT_FS
  const lv: [number, number][] = [];
  let muLung = 0;
  anat.forEach((s, i) => {
    if (!s.lung || L(iv[i]) <= 0 || lv.length >= 4) return;
    lv.push(iv[i]);
    muLung = s.mu;
  });
  lv.sort((p, q) => p[0] - q[0]);
  const merged: [number, number][] = [];
  for (const x of lv) {
    const last = merged[merged.length - 1];
    if (last && x[0] <= last[1]) last[1] = Math.max(last[1], x[1]);
    else merged.push([x[0], x[1]]);
  }
  for (const Li of merged) {
    const a = L(Li);
    const cv: [number, number][] = [];
    anat.forEach((c, j) => {
      if (!c.carve || cv.length >= MAX_CARVE_SHAPES) return;
      const x: [number, number] = [Math.max(iv[j][0], Li[0]), Math.min(iv[j][1], Li[1])];
      if (x[1] > x[0]) cv.push(x);
    });
    cv.sort((p, q) => p[0] - q[0]);
    let covered = 0,
      cs = -1e9,
      ce = -1e9;
    for (const c of cv) {
      if (c[0] > ce) {
        covered += Math.max(0, ce - cs);
        cs = c[0];
        ce = c[1];
      } else ce = Math.max(ce, c[1]);
    }
    covered += Math.max(0, ce - cs);
    lungPath += Math.max(0, a - covered);
  }
  P += muLung * lungPath;
  return { P, lungPath, body: anat.length ? iv[0] : [1, 0] };
}

/** Number of exact segments in a thorax (for budgets and tests). */
export function thoraxSegmentCount(t: Thorax): number {
  return (t.segments?.stat.count ?? 0) + (t.segments?.dyn?.count ?? 0);
}

/** Aortic course for the catheter, by access route, joining the root shaft at (0, yTop, 0). */
export function aorticCourse(route: "femoral" | "radial-right" | "radial-left", yTop: number): Vec3[] {
  if (route === "femoral") {
    return [v(18, -330, -92), v(22, -240, -88), v(24, -120, -84), v(24, 0, -78), v(22, 55, -70), v(16, 88, -52), v(8, 100, -28), v(2, 94, -10), v(0, 80, -3), v(0, yTop, 0)];
  }
  if (route === "radial-left") {
    return [v(150, 150, -40), v(95, 128, -48), v(42, 108, -46), v(14, 100, -30), v(4, 90, -12), v(0, 78, -4), v(0, yTop, 0)];
  }
  // right radial: subclavian → innominate → ascending aorta
  return [v(-160, 150, -25), v(-100, 132, -18), v(-45, 112, -10), v(-18, 96, -4), v(-6, 82, -1), v(0, yTop, 0)];
}
