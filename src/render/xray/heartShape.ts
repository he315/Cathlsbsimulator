// ---------------------------------------------------------------------------
// The beating heart silhouette as renderer primitives.
//
// heart.ts defines the ventricular surface the coronaries ride on as the
// smooth union of an LV and an RV ellipsoid. This module turns the same shape
// into AnatShape primitives for the exact-interval anatomy shader (thorax.ts /
// XrayRenderer.ts): ventricular myocardium, a thin epicardial fat shell (the
// lungs are carved around it, so it draws the heart-lung border), the atria
// and appendage, the outflow tract and a cardiophrenic fat pad. Each frame the
// ventricular ellipsoids are refitted to the deformed surface (an affine
// least-squares fit to control points moved by heartMotion), so the border
// beats with exactly the motion of the vessels on it. The atria and outflow
// tract follow the base.
//
// Cost: two 4×4 normal-equation solves and two 3×3 eigen-decompositions per
// frame over ~120 control points (about 0.05 ms), so the shader and its budget
// are unchanged; the number of primitives is fixed (10).
//
// diag-lv-aorta-render exports the pieces the ventriculogram needs (ventricleAffine,
// heartChambers): the LV cavity rides on the same affine fit as the drawn wall, and
// the opacified left atrium is the atrium drawn here. heartShapes is unchanged.
// ---------------------------------------------------------------------------

import type { Vec3 } from "../../types";
import type { AnatShape } from "./thorax";
import { restPoint, rvWeight, V3, type Ellipsoid, type HeartFrame, type Motion } from "./heart";
import { displace } from "./heartMotion";

const v3 = V3.v,
  add = V3.add,
  sub = V3.sub,
  sc = V3.sc,
  dot = V3.dot,
  nrm = V3.nrm;

/** Epicardial fat shell thickness (mm): within the 2-4 mm of the plan (model parameter). */
export const FAT_SHELL_MM = 3;
/** Fat attenuation excess over soft tissue per mm (same value as thorax MU.fatExcess). */
const FAT_EXCESS = -0.0025;

/** Names of the primitives, in output order (stable for the thorax integration). */
export const HEART_SHAPE_NAMES = [
  "lv myocardium",
  "lv epicardial fat",
  "rv myocardium",
  "rv epicardial fat",
  "right atrium",
  "left atrium",
  "left atrial appendage",
  "right ventricular outflow",
  "cardiophrenic fat pad",
  "aortic root",
] as const;

export interface HeartShapeOptions {
  /** fat shell thickness, mm */
  fatMm?: number;
  /** fat excess attenuation per mm (defaults to the thorax value) */
  fatExcess?: number;
}

interface Ctrl {
  ell: number;
  phi: number;
  p: Vec3;
}

interface Rig {
  lvCtrl: Ctrl[];
  rvCtrl: Ctrl[];
  /** anchors for the atria and outflow tract (material coordinates above / at the base) */
  raAnchor: Ctrl[];
  laAnchor: Ctrl[];
  rvotAnchor: Ctrl[];
  apexAnchor: Ctrl[];
  rest: Rest;
}

interface Rest {
  ra: Ellipsoid;
  la: Ellipsoid;
  laa: Ellipsoid;
  rvot: Ellipsoid;
  pad: Ellipsoid;
  root: Ellipsoid;
}

const rigs = new WeakMap<HeartFrame, Rig>();

function ctrlAt(H: HeartFrame, ell: number, phi: number): Ctrl {
  return { ell, phi, p: restPoint(H, ell, phi, 0) };
}

/** Rest placement of the non-ventricular primitives (model geometry in the heart frame). */
function restExtras(H: HeartFrame): Rest {
  const k = H.scale ?? 1;
  const L = H.L,
    A = H.A,
    S = H.S;
  const at = (l: number, a: number, s: number) => add(H.base, add(sc(L, l * H.len), add(sc(A, a), sc(S, s))));
  const axes: [Vec3, Vec3, Vec3] = [L, A, S];
  return {
    // right atrium: right of the base, above the tricuspid groove
    ra: { c: at(-0.18, 2 * k, -44 * k), ax: axes, half: [30 * k, 30 * k, 26 * k] },
    // left atrium: posterior and superior to the base
    la: { c: at(-0.25, -26 * k, 4 * k), ax: axes, half: [24 * k, 22 * k, 34 * k] },
    // left atrial appendage: small lobe on the upper left border, over the proximal circumflex
    laa: { c: at(-0.06, 10 * k, 40 * k), ax: axes, half: [16 * k, 9 * k, 11 * k] },
    // right ventricular outflow tract: anterior-superior, towards the pulmonary trunk
    rvot: { c: at(-0.12, 34 * k, -6 * k), ax: axes, half: [26 * k, 16 * k, 20 * k] },
    // cardiophrenic fat pad: under the right-inferior heart border, against the diaphragm
    pad: { c: at(0.35, -30 * k, -42 * k), ax: axes, half: [26 * k, 14 * k, 18 * k] },
    // aortic root (sinuses) at the valve
    root: { c: v3(0, 12, 0), ax: [v3(0, 1, 0), v3(1, 0, 0), v3(0, 0, 1)], half: [16, 17, 17] },
  };
}

function rigFor(H: HeartFrame): Rig {
  const hit = rigs.get(H);
  if (hit) return hit;
  const lvCtrl: Ctrl[] = [],
    rvCtrl: Ctrl[] = [];
  for (let i = 0; i < 9; i++) {
    const u = 0.04 + (0.92 * i) / 8;
    for (let j = 0; j < 16; j++) {
      const phi = -180 + j * 22.5;
      const w = rvWeight(H, u, phi);
      const c = ctrlAt(H, 2 * u - 1, phi);
      if (w > 0.6) rvCtrl.push(c);
      else if (w < 0.4) lvCtrl.push(c);
    }
  }
  const rest = restExtras(H);
  const rig: Rig = {
    lvCtrl,
    rvCtrl,
    raAnchor: [-130, -100, -70].map((phi) => ctrlAt(H, -1.12, phi)),
    laAnchor: [120, 160, 200].map((phi) => ctrlAt(H, -1.15, phi)),
    rvotAnchor: [-20, 0, 15].map((phi) => ctrlAt(H, -1.05, phi)),
    apexAnchor: [-150, -120].map((phi) => ctrlAt(H, -0.3, phi)),
    rest,
  };
  rigs.set(H, rig);
  return rig;
}

/** Solve a 4×4 linear system (Gaussian elimination with partial pivoting). */
function solve4(Mx: number[][], b: number[]): number[] {
  const a = Mx.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < 4; c++) {
    let p = c;
    for (let r = c + 1; r < 4; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
    [a[c], a[p]] = [a[p], a[c]];
    const d = a[c][c] || 1e-12;
    for (let r = 0; r < 4; r++) {
      if (r === c) continue;
      const f = a[r][c] / d;
      for (let k = c; k < 5; k++) a[r][k] -= f * a[c][k];
    }
  }
  return a.map((r, i) => r[4] / (a[i][i] || 1e-12));
}

/** Least-squares affine map Q ≈ M P + t; returns rows of [M | t]. */
function fitAffine(P: Vec3[], Q: Vec3[]): number[][] {
  const XtX = [0, 1, 2, 3].map(() => [0, 0, 0, 0]);
  const XtY = [0, 1, 2].map(() => [0, 0, 0, 0]);
  for (let i = 0; i < P.length; i++) {
    const x = [P[i].x, P[i].y, P[i].z, 1];
    const y = [Q[i].x, Q[i].y, Q[i].z];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) XtX[r][c] += x[r] * x[c];
      for (let d = 0; d < 3; d++) XtY[d][r] += x[r] * y[d];
    }
  }
  // slight ridge towards the identity keeps the fit stable when control points are few
  const lam = 1e-3 * P.length;
  for (let r = 0; r < 3; r++) XtX[r][r] += lam;
  return [0, 1, 2].map((d) => {
    const rhs = XtY[d].map((x, r) => x + (r === d ? lam : 0));
    return solve4(XtX, rhs);
  });
}

/** Eigen-decomposition of a symmetric 3×3 matrix (cyclic Jacobi). */
function eigSym3(m: number[][]): { values: number[]; vectors: Vec3[] } {
  const a = m.map((r) => [...r]);
  const V = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  for (let sweep = 0; sweep < 12; sweep++) {
    let off = Math.abs(a[0][1]) + Math.abs(a[0][2]) + Math.abs(a[1][2]);
    if (off < 1e-10) break;
    for (const [p, q] of [
      [0, 1],
      [0, 2],
      [1, 2],
    ]) {
      if (Math.abs(a[p][q]) < 1e-14) continue;
      const th = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1),
        s = t * c;
      for (let k = 0; k < 3; k++) {
        const akp = a[k][p],
          akq = a[k][q];
        a[k][p] = c * akp - s * akq;
        a[k][q] = s * akp + c * akq;
      }
      for (let k = 0; k < 3; k++) {
        const apk = a[p][k],
          aqk = a[q][k];
        a[p][k] = c * apk - s * aqk;
        a[q][k] = s * apk + c * aqk;
      }
      for (let k = 0; k < 3; k++) {
        const vkp = V[k][p],
          vkq = V[k][q];
        V[k][p] = c * vkp - s * vkq;
        V[k][q] = s * vkp + c * vkq;
      }
      off = 0;
    }
  }
  return { values: [a[0][0], a[1][1], a[2][2]], vectors: [0, 1, 2].map((j) => v3(V[0][j], V[1][j], V[2][j])) };
}

/** Apply an affine map to an ellipsoid: centre moves, shape matrix becomes M E Mᵀ. */
function mapEllipsoid(e: Ellipsoid, T: Affine): Ellipsoid {
  const M = T.map((r) => r.slice(0, 3));
  const t = T.map((r) => r[3]);
  const c = v3(dot(v3(M[0][0], M[0][1], M[0][2]), e.c) + t[0], dot(v3(M[1][0], M[1][1], M[1][2]), e.c) + t[1], dot(v3(M[2][0], M[2][1], M[2][2]), e.c) + t[2]);
  // E = Σ h_i² a_i a_iᵀ
  const E = [0, 1, 2].map(() => [0, 0, 0]);
  for (let i = 0; i < 3; i++) {
    const a = [e.ax[i].x, e.ax[i].y, e.ax[i].z];
    const h2 = e.half[i] * e.half[i];
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) E[r][q] += h2 * a[r] * a[q];
  }
  const ME = M.map((row) => [0, 1, 2].map((q) => row[0] * E[0][q] + row[1] * E[1][q] + row[2] * E[2][q]));
  const MEMt = ME.map((row) => [0, 1, 2].map((q) => row[0] * M[q][0] + row[1] * M[q][1] + row[2] * M[q][2]));
  const { values, vectors } = eigSym3(MEMt);
  // keep the axis order closest to the original (long axis first): best of the six permutations
  const perms = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ];
  let order = perms[0],
    bestScore = -1;
  for (const pm of perms) {
    const sc = Math.abs(dot(vectors[pm[0]], e.ax[0])) + Math.abs(dot(vectors[pm[1]], e.ax[1])) + Math.abs(dot(vectors[pm[2]], e.ax[2]));
    if (sc > bestScore) {
      bestScore = sc;
      order = pm;
    }
  }
  const ax = order.map((j) => nrm(vectors[j])) as [Vec3, Vec3, Vec3];
  // right-handed
  const cr = V3.cross(ax[0], ax[1]);
  if (dot(cr, ax[2]) < 0) ax[2] = sc(ax[2], -1);
  return { c, ax, half: order.map((j) => Math.sqrt(Math.max(1e-6, values[j]))) as [number, number, number] };
}

function moved(H: HeartFrame, cs: Ctrl[], m: Motion): Vec3[] {
  return cs.map((c) => add(c.p, displace(H, c.ell, c.phi, 0, c.p, m)));
}

function meanShift(H: HeartFrame, cs: Ctrl[], m: Motion | undefined): Vec3 {
  if (!m) return v3(0, 0, 0);
  const Q = moved(H, cs, m);
  let x = 0,
    y = 0,
    z = 0;
  for (let i = 0; i < cs.length; i++) {
    x += Q[i].x - cs[i].p.x;
    y += Q[i].y - cs[i].p.y;
    z += Q[i].z - cs[i].p.z;
  }
  return v3(x / cs.length, y / cs.length, z / cs.length);
}

const shift = (e: Ellipsoid, d: Vec3): Ellipsoid => ({ c: add(e.c, d), ax: e.ax, half: e.half });
const inflate = (e: Ellipsoid, mm: number): Ellipsoid => ({ c: e.c, ax: e.ax, half: [e.half[0] + mm, e.half[1] + mm, e.half[2] + mm] });

/** Fitted ventricular ellipsoids for a motion state (rest when m is omitted). */
export function fitVentricles(H: HeartFrame, m?: Motion): { lv: Ellipsoid; rv: Ellipsoid } {
  if (!H.lv || !H.rv) throw new Error("heartShape needs a heart frame with ventricular ellipsoids (makeHeart)");
  if (!m || (!m.contraction && !m.env)) return { lv: H.lv, rv: H.rv };
  return { lv: mapEllipsoid(H.lv, ventricleAffine(H, m, "lv")), rv: mapEllipsoid(H.rv, ventricleAffine(H, m, "rv")) };
}

/** An affine map of the aortic frame: rows of [M | t], so p' = M p + t. Read-only: fits are shared between callers. */
export type Affine = readonly (readonly number[])[];

const IDENTITY: Affine = Object.freeze([Object.freeze([1, 0, 0, 0]), Object.freeze([0, 1, 0, 0]), Object.freeze([0, 0, 1, 0])]);

/**
 * The last motion state's fits and chambers per heart frame. One frame's callers (heartShapes, and a
 * ventriculogram's cavity, atrium and RV in lvGram.ts) pass the same Motion object, so the least-squares
 * fits are done once per frame. Motion objects are treated as immutable (motionAt returns a new one).
 */
const fitCache = new WeakMap<HeartFrame, { m: Motion; contraction: number; lv?: Affine; rv?: Affine; ch?: HeartChambers }>();
const restChambers = new WeakMap<HeartFrame, HeartChambers>();
function fitsFor(H: HeartFrame, m: Motion) {
  let e = fitCache.get(H);
  if (!e || e.m !== m || e.contraction !== m.contraction) {
    e = { m, contraction: m.contraction };
    fitCache.set(H, e);
  }
  return e;
}

/**
 * The least-squares affine map that carries the LV (or RV) myocardium from rest to a motion state:
 * the same fit fitVentricles applies to the epicardial ellipsoid, so a structure inside the ventricle
 * (the endocardial cavity of a ventriculogram, lvGram.ts) moves with the drawn wall. Identity at rest.
 */
export function ventricleAffine(H: HeartFrame, m?: Motion, which: "lv" | "rv" = "lv"): Affine {
  if (!m || (!m.contraction && !m.env)) return IDENTITY;
  const e = fitsFor(H, m);
  const hit = e[which];
  if (hit) return hit;
  const rig = rigFor(H);
  const cs = which === "lv" ? rig.lvCtrl : rig.rvCtrl;
  const T: Affine = fitAffine(
    cs.map((c) => c.p),
    moved(H, cs, m)
  );
  e[which] = T;
  return T;
}

/** Apply an affine map to a point. */
export function applyAffine(T: Affine, p: Vec3): Vec3 {
  return v3(T[0][0] * p.x + T[0][1] * p.y + T[0][2] * p.z + T[0][3], T[1][0] * p.x + T[1][1] * p.y + T[1][2] * p.z + T[1][3], T[2][0] * p.x + T[2][1] * p.y + T[2][2] * p.z + T[2][3]);
}

/** Apply the linear part of an affine map to a direction (not normalised). */
export function applyLinear(T: Affine, d: Vec3): Vec3 {
  return v3(T[0][0] * d.x + T[0][1] * d.y + T[0][2] * d.z, T[1][0] * d.x + T[1][1] * d.y + T[1][2] * d.z, T[2][0] * d.x + T[2][1] * d.y + T[2][2] * d.z);
}

/** The heart's chambers as ellipsoids at a motion state (aortic frame), the ones heartShapes draws. */
export interface HeartChambers {
  lv: Ellipsoid;
  rv: Ellipsoid;
  ra: Ellipsoid;
  la: Ellipsoid;
  laa: Ellipsoid;
  rvot: Ellipsoid;
  pad: Ellipsoid;
  root: Ellipsoid;
}

/**
 * Chamber ellipsoids for a motion state (rest when m is omitted): the fitted ventricles, and the atria,
 * appendage, outflow tract and fat pad moved with their anchors. heartShapes draws exactly these; a
 * ventriculogram uses the left atrium for mitral regurgitation (lvGram.ts).
 */
export function heartChambers(H: HeartFrame, m?: Motion): HeartChambers {
  const e = m ? fitsFor(H, m) : null;
  const hit = e ? e.ch : restChambers.get(H);
  if (hit) return hit;
  const ch = chambersOf(H, m);
  if (e) e.ch = ch;
  else restChambers.set(H, ch);
  return ch;
}

function chambersOf(H: HeartFrame, m?: Motion): HeartChambers {
  const rig = rigFor(H);
  const { lv, rv } = fitVentricles(H, m);
  const R = rig.rest;
  return {
    lv,
    rv,
    ra: shift(R.ra, meanShift(H, rig.raAnchor, m)),
    la: shift(R.la, meanShift(H, rig.laAnchor, m)),
    laa: shift(R.laa, meanShift(H, rig.laAnchor, m)),
    rvot: shift(R.rvot, meanShift(H, rig.rvotAnchor, m)),
    pad: shift(R.pad, sc(meanShift(H, rig.apexAnchor, m), 0.6)),
    root: R.root,
  };
}

/**
 * Renderer primitives for the heart at a motion state, in the aortic frame (apply the same
 * world transform as the rest of the anatomy: toWorld and the breathing shift).
 * Order and names: HEART_SHAPE_NAMES.
 */
export function heartShapes(H: HeartFrame, m?: Motion, o: HeartShapeOptions = {}): AnatShape[] {
  const fat = o.fatMm ?? FAT_SHELL_MM;
  const fx = o.fatExcess ?? FAT_EXCESS;
  const { lv, rv, ra, la, laa, rvot, pad, root } = heartChambers(H, m);
  const shape = (e: Ellipsoid, mu: number, name: string, carve = false): AnatShape => ({ type: 0, c: e.c, ax: e.ax, half: e.half, mu, name, ...(carve ? { carve: true } : {}) });
  // inside a ventricle the myocardium (+|fat|/2) cancels its fat shell (-|fat|/2): net soft tissue;
  // the shell alone (between the two surfaces) is fat, and the lungs are carved around the shells
  return [
    shape(lv, -fx * 0.5, HEART_SHAPE_NAMES[0]),
    shape(inflate(lv, fat), fx * 0.5, HEART_SHAPE_NAMES[1], true),
    shape(rv, -fx * 0.5, HEART_SHAPE_NAMES[2]),
    shape(inflate(rv, fat), fx * 0.5, HEART_SHAPE_NAMES[3], true),
    shape(ra, 0, HEART_SHAPE_NAMES[4], true),
    shape(la, 0, HEART_SHAPE_NAMES[5], true),
    shape(laa, 0, HEART_SHAPE_NAMES[6], true),
    shape(rvot, 0, HEART_SHAPE_NAMES[7], true),
    shape(pad, fx, HEART_SHAPE_NAMES[8], true),
    shape(root, 0, HEART_SHAPE_NAMES[9], true),
  ];
}

/** Ray from `o` along unit `d`: exit distance through an ellipsoid (or -1). */
function rayExit(e: Ellipsoid, o: Vec3, d: Vec3): number {
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
  if (disc < 0) return -1;
  return (-b + Math.sqrt(disc)) / (2 * a);
}

/**
 * Signed distance from a point to the silhouette surface (union of the carved shells and chambers)
 * along the ray from the heart's long axis through the point: positive when the point lies inside.
 */
export function insideSilhouette(H: HeartFrame, shapes: AnatShape[], p: Vec3): number {
  const rel = sub(p, H.base);
  const along = dot(rel, H.L);
  const o = add(H.base, sc(H.L, along));
  const radial = sub(p, o);
  const r = Math.hypot(radial.x, radial.y, radial.z);
  const d = r > 1e-6 ? sc(radial, 1 / r) : H.A;
  let exit = -1;
  for (const s of shapes) {
    if (!s.carve) continue;
    exit = Math.max(exit, rayExit(s as Ellipsoid, o, d));
  }
  return exit - r;
}
