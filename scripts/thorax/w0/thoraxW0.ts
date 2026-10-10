// Frozen wave-0 copy for the S4 harness baseline (development only).
// ---------------------------------------------------------------------------
// Thoracic anatomy for the X-ray renderer, in the aortic frame (mm):
// origin at the aortic valve, +x patient left, +y superior, +z anterior.
//
// Large soft-tissue/air structures (body, lungs, mediastinum, liver, stomach
// gas, trachea and bronchi) are solved exactly per ray with interval
// arithmetic in the renderer, so the lungs are properly carved around the
// heart. Bones (vertebrae, pedicles, processes, sternum, scapulae, ribs,
// clavicles) add their excess attenuation on top. Attenuation values are
// linear coefficients per mm at a ~60 keV effective energy: soft tissue
// ≈ 0.020, lung ≈ 0.0054, cortical bone ≈ 0.06, cancellous ≈ 0.03.
// Breathing lowers the diaphragm, extends the lungs and lifts the ribs.
// ---------------------------------------------------------------------------

import type { Vec3 } from "../../../src/types";
import type { HeartFrame } from "../../../src/render/xray/heart";

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
}

/** Fixed order of the exact-geometry anatomy shapes (the shader relies on it). */
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
} as const;
export const ANAT_COUNT = 19;
/**
 * Structures the lungs are carved around (their union, exactly per ray): the
 * mediastinum and both hemidiaphragms, so the lung bases sit on two domes and
 * the heart rests on the diaphragm.
 */
export const CARVE = [11, 4, 5, 12, 13, 14, 15, 16, 17, 6, 18];

/** Diaphragm descent at full inspiration (mm); the heart rides on it (see sceneBuilder). */
export const DIAPHRAGM_DESCENT = 32;

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const I3: [Vec3, Vec3, Vec3] = [v(1, 0, 0), v(0, 1, 0), v(0, 0, 1)];
const add = (a: Vec3, b: Vec3) => v(a.x + b.x, a.y + b.y, a.z + b.z);
const sc = (a: Vec3, k: number) => v(a.x * k, a.y * k, a.z * k);
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

export interface ThoraxOptions {
  /** 0 end-expiration … 1 deep inspiration */
  resp: number;
  /** body habitus scale (1 average, 0.9 slim, 1.15 large) */
  habitus?: number;
  /** heart frame (so the mediastinum follows the heart) */
  heart: HeartFrame;
  /** heart translation from breathing, applied by the caller to the heart frame too */
  heartShift?: Vec3;
}

export interface Thorax {
  anat: AnatShape[]; // body first; at most MAX_ANAT
  bones: BonePrim[];
  tubes: TubeSpec[];
}

export function buildThorax(o: ThoraxOptions): Thorax {
  const k = o.habitus ?? 1;
  const r = o.resp;
  const hs = o.heartShift ?? v(0, 0, 0);
  const H = o.heart;
  const anat: Shape[] = [];

  // body: elliptic cylinder along y
  anat[ANAT.BODY] = { type: 1, c: v(0, -40, -38), ax: I3, half: [176 * k, 320, 114 * k] };
  // lungs extend downwards on inspiration (the domes descend)
  // the left lung leaves a cardiac notch: less of it wraps in front of and behind the heart
  // chest wall (muscle, fat, ribs) about 3 cm thick laterally
  anat[ANAT.LUNG_R] = { type: 0, c: v(-86 * k, 28 - 14 * r, -44), ax: I3, half: [56 * k, 136 + 18 * r, 86 * k] };
  anat[ANAT.LUNG_L] = { type: 0, c: v(96 * k, 16 - 16 * r, -58), ax: I3, half: [48 * k, 134 + 20 * r, 74 * k] };
  // heart (ventricular mass) aligned with the heart frame, plus RA and the upper mediastinum
  const hc = add(add(H.base, sc(H.L, H.len * 0.44)), hs);
  anat[ANAT.HEART] = { type: 0, c: hc, ax: [H.L, H.A, H.S], half: [H.len * 0.6, (H.rA + H.rAp) * 0.5 + 4, (H.rS + H.rSr) * 0.5 + 4] };
  // pericardial sac with its fat: slightly larger than the ventricular mass; the lungs are carved around it
  anat[ANAT.HEART_FAT] = { type: 0, c: hc, ax: [H.L, H.A, H.S], half: [H.len * 0.6 + 10, (H.rA + H.rAp) * 0.5 + 20, (H.rS + H.rSr) * 0.5 + 20] };
  anat[ANAT.RA] = { type: 0, c: add(v(-40, -12, -6), sc(hs, 0.8)), ax: I3, half: [30, 40, 32] };
  // superior mediastinum: great vessels, thymus remnant, LA behind the root
  anat[ANAT.MEDIA] = { type: 0, c: add(v(4, 36, -26), sc(hs, 0.4)), ax: I3, half: [40, 85, 46] };
  // posterior mediastinum: descending aorta, oesophagus, azygos and paravertebral tissue behind the heart
  anat[ANAT.POST_MEDIA] = { type: 0, c: v(22, -36, -84), ax: I3, half: [56, 150, 38] };
  // the structures that make up the cardiac and mediastinal borders
  anat[ANAT.LA] = { type: 0, c: add(v(12, -8, -48), sc(hs, 0.6)), ax: I3, half: [40, 25, 27] };
  anat[ANAT.PA_TRUNK] = { type: 0, c: add(v(24, 30, 14), sc(hs, 0.4)), ax: axesFrom(v(0.35, 1, -0.45), v(1, 0, 0)), half: [34, 15, 15] };
  anat[ANAT.AORTIC_KNOB] = { type: 0, c: add(v(10, 92, -32), sc(hs, 0.2)), ax: I3, half: [24, 17, 28] };
  anat[ANAT.RVOT] = { type: 0, c: add(v(8, -6, 26), sc(hs, 0.9)), ax: I3, half: [32, 30, 22] };
  anat[ANAT.SVC] = { type: 1, c: add(v(-30, 62, -10), sc(hs, 0.3)), ax: I3, half: [11, 46, 11] };
  // hemidiaphragms: the liver under the right dome (higher) and the spleen and stomach
  // under the left; both domes are highest centrally and fall away steeply behind
  const dd = DIAPHRAGM_DESCENT * r;
  anat[ANAT.LIVER] = { type: 0, c: v(-62 * k, -160 - dd, -12), ax: I3, half: [125 * k, 92, 125 * k] };
  anat[ANAT.LEFT_DOME] = { type: 0, c: v(58 * k, -176 - dd, -14), ax: I3, half: [112 * k, 92, 122 * k] };
  // gastric air bubble just under the left dome
  anat[ANAT.STOMACH] = { type: 0, c: v(74 * k, -116 - dd, -48), ax: I3, half: [26, 12, 22] };
  anat[ANAT.TRACHEA] = { type: 1, c: v(-4, 150, -42), ax: I3, half: [9, 72, 9] };
  // main bronchi from the carina (~y 78)
  const carina = v(-4, 78, -44);
  const br = (end: Vec3, rad: number): Shape => {
    const mid = sc(add(carina, end), 0.5);
    const d = add(end, sc(carina, -1));
    const len = Math.hypot(d.x, d.y, d.z);
    const [ax0, ax1, ax2] = axesFrom(d, v(1, 0, 0));
    // capped cylinder axis is local y → reorder axes so local y follows the bronchus
    return { type: 1, c: mid, ax: [ax1, ax0, ax2], half: [rad, len / 2, rad] };
  };
  anat[ANAT.BRONCH_R] = br(v(-42, 56, -50), 7);
  anat[ANAT.BRONCH_L] = br(v(44, 48, -54), 6);

  // ---- bones -------------------------------------------------------------
  const bones: BonePrim[] = [];
  const spineX = -4;
  const spineZ = -112;
  // vertebral levels: T1 at y≈+185 down to L2 at about −235
  const levels = 19;
  for (let i = 0; i < levels; i++) {
    const t = i / (levels - 1);
    const height = 19 + 9 * t; // thoracic bodies smaller, lumbar larger
    const y = 185 - i * (height + 5.5);
    const rx = (14 + 10 * t) * k;
    const rz = (12 + 7 * t) * k;
    const c = v(spineX, y, spineZ + 4 * Math.sin(t * Math.PI)); // gentle kyphosis
    // cortical shell + cancellous core
    bones.push({ type: 1, c, ax: I3, half: [rx, height / 2, rz], mu: MU.cortical });
    bones.push({ type: 1, c, ax: I3, half: [rx - 1.6, height / 2 - 1.4, rz - 1.6], mu: MU.cancellous - MU.cortical });
    // pedicles (the "eyes" of the vertebra on an AP view)
    for (const s of [-1, 1]) {
      // pedicles: cortical rings seen end-on (the "owl eyes")
      const pc = v(spineX + s * (rx - 3), y + 3, spineZ - rz - 7);
      bones.push({ type: 0, c: pc, ax: I3, half: [4.5, 7, 9], mu: MU.cortical * 0.9 });
      bones.push({ type: 0, c: pc, ax: I3, half: [3, 5.2, 8], mu: -MU.cortical * 0.75 });
      // transverse processes (faint, behind the pedicles)
      bones.push({ type: 0, c: v(spineX + s * (rx + 12), y + 2, spineZ - rz - 16), ax: I3, half: [13, 4.5, 5.5], mu: MU.cortical * 0.35 });
    }
    // spinous process, sloping downwards
    bones.push({ type: 0, c: v(spineX, y - 10, spineZ - rz - 30), ax: axesFrom(v(0, -0.7, -1), v(1, 0, 0)), half: [22, 4, 4], mu: MU.cortical * 0.7 });
  }
  // sternum (manubrium + body)
  bones.push({ type: 2, c: v(0, 70 + 6 * r, 70), ax: I3, half: [15, 95, 5], mu: MU.cancellous * 1.6 });
  // scapulae
  for (const s of [-1, 1]) {
    bones.push({ type: 0, c: v(s * 112 * k, 110, -132), ax: axesFrom(v(s * 0.35, 1, 0.15), v(1, 0, 0)), half: [78, 48, 4], mu: MU.cortical * 0.5 });
  }

  // ---- ribs and clavicles (tubes) ---------------------------------------
  const tubes: TubeSpec[] = [];
  const rib = (n: number, side: number) => {
    const yHead = 172 - (n - 1) * 25.5;
    const W = (108 + Math.min(1, n / 7) * 50) * k; // thoracic half-width grows to mid-chest
    const D = (82 + Math.min(1, n / 6) * 28) * k;
    const zc = -38;
    const pts: Vec3[] = [];
    const radii: number[] = [];
    const thick: number[] = [];
    const outward: Vec3[] = [];
    const thetaEnd = n <= 10 ? 150 - (n > 7 ? (n - 7) * 10 : 0) : 95 + (12 - n) * 10; // floating ribs end laterally
    const drop = (n <= 2 ? 30 : n <= 7 ? 72 : 58) * (1 - 0.18 * r); // anterior ends rise on inspiration
    for (let th = 18; th <= thetaEnd; th += 4) {
      const a = (th * Math.PI) / 180;
      const f = (th - 18) / (thetaEnd - 18);
      const x = side * (W - 10) * Math.sin(a);
      const z = zc - (D - 10) * Math.cos(a);
      // posterior part rises slightly, then the rib slopes down to its anterior end
      const y = yHead + 8 * Math.sin(Math.min(1, f * 3) * Math.PI) - drop * Math.pow(f, 1.35);
      pts.push(v(x, y, z));
      // flat band, broad face outwards: rounder near the spine, wider and thinner anteriorly
      radii.push(5.0 + 1.6 * Math.min(1, f * 1.6));
      thick.push(3.6 - 1.2 * f);
      outward.push(nrm(v(Math.sin(a) * side / (W - 10), 0, -Math.cos(a) / (D - 10))));
    }
    // cortical shell (outer) and marrow (inner): the shell seen edge-on draws the rib margins
    tubes.push({ pts, r: radii, mu: [MU.cortical, 0, 0], thin: { dir: outward, r: thick } });
    tubes.push({
      pts,
      r: radii.map((x) => x - 1.3),
      mu: [MU.cancellous - MU.cortical, 0, 0],
      thin: { dir: outward, r: thick.map((x) => x - 0.9) },
    });
    // costal cartilage to the sternum (ribs 1–7)
    if (n <= 7) {
      const last = pts[pts.length - 1];
      const st = v(side * 14, 150 - (n - 1) * 17, 66);
      const cart: Vec3[] = [];
      for (let i = 0; i <= 6; i++) cart.push(add(sc(last, 1 - i / 6), sc(st, i / 6)));
      tubes.push({ pts: cart, r: cart.map(() => 4.2), mu: [MU.cartilage, 0, 0] });
    }
  };
  for (let n = 1; n <= 12; n++) {
    rib(n, -1);
    rib(n, 1);
  }
  for (const s of [-1, 1]) {
    const cl = [v(s * 18, 196, 62), v(s * 60, 206, 50), v(s * 105, 204, 22), v(s * 150, 196, -8)];
    const r0 = cl.map(() => 6.5);
    tubes.push({ pts: cl, r: r0, mu: [MU.cortical, 0, 0] });
    tubes.push({ pts: cl, r: r0.map((x) => x - 1.6), mu: [MU.cancellous - MU.cortical, 0, 0] });
  }
  // pulmonary vessels: branching trees from each hilum give the lung markings
  for (const t of pulmonaryTrees(r)) tubes.push(t);
  return { anat: withMaterials(anat), bones, tubes };
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
  };
  return anat.map((s, i) => ({ ...s, ...(M[i] ?? { mu: 0 }) }));
}

/** Deterministic pseudo-random generator (mulberry32). */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LUNG_VESSEL_MU = 0.0135; // blood-filled vessel within aerated lung (excess over lung)

/** Branching pulmonary arterial/venous trees radiating from the hila. */
function pulmonaryTrees(resp: number): TubeSpec[] {
  const out: TubeSpec[] = [];
  const rnd = prng(7);
  const grow = (start: Vec3, dir: Vec3, len: number, rad: number, depth: number, side: number) => {
    const pts: Vec3[] = [start];
    const radii: number[] = [rad];
    let p = start;
    let d = nrm(dir);
    const steps = Math.max(3, Math.round(len / 6));
    for (let i = 1; i <= steps; i++) {
      // gentle wandering
      d = nrm(add(d, v((rnd() - 0.5) * 0.25, (rnd() - 0.5) * 0.25 - 0.04, (rnd() - 0.5) * 0.25)));
      p = add(p, sc(d, len / steps));
      // stay inside the thorax: pull back towards the lung centre if drifting out
      const lc = side < 0 ? v(-80, 20 - 15 * resp, -42) : v(84, 10 - 15 * resp, -46);
      const q = v((p.x - lc.x) / 62, (p.y - lc.y) / 130, (p.z - lc.z) / 82);
      if (q.x * q.x + q.y * q.y + q.z * q.z > 0.85) d = nrm(add(d, sc(nrm(add(lc, sc(p, -1))), 0.6)));
      pts.push(p);
      radii.push(rad * (1 - 0.35 * (i / steps)));
    }
    out.push({ pts, r: radii, mu: [LUNG_VESSEL_MU, 0, 0] });
    if (depth <= 0 || rad < 0.45) return;
    const nChild = depth > 3 ? 2 : rnd() < 0.7 ? 2 : 3;
    for (let c = 0; c < nChild; c++) {
      const spread = 0.45 + rnd() * 0.5;
      const nd = nrm(add(d, v((rnd() - 0.5) * spread * 2, (rnd() - 0.5) * spread * 2, (rnd() - 0.5) * spread * 1.4)));
      grow(p, nd, len * (0.62 + rnd() * 0.18), rad * 0.68, depth - 1, side);
    }
  };
  // right hilum (lower than the left), left hilum
  const hilaR = v(-38, 26 - 10 * resp, -44);
  const hilaL = v(40, 34 - 10 * resp, -50);
  const lobes: [Vec3, Vec3, number][] = [
    [hilaR, v(-0.5, 0.75, 0.1), -1],
    [hilaR, v(-0.85, 0.1, 0.25), -1],
    [hilaR, v(-0.55, -0.8, 0.0), -1],
    [hilaR, v(-0.35, -0.7, -0.5), -1],
    [hilaL, v(0.45, 0.8, 0.1), 1],
    [hilaL, v(0.85, 0.05, 0.25), 1],
    [hilaL, v(0.5, -0.8, -0.1), 1],
    [hilaL, v(0.3, -0.7, -0.55), 1],
  ];
  for (const [h, d, side] of lobes) grow(h, d, 34, 5.5, 5, side);
  return out;
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
