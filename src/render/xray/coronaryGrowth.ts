// ---------------------------------------------------------------------------
// Coronary tree growth: topology, course and calibre of every vessel for one
// anatomy genome, on the heart surface of heart.ts.
//
// 1. Named vessels are routed on the heart surface: the LAD in the anterior
//    interventricular groove, the circumflex and RCA in the atrioventricular
//    groove, the PDA in the posterior interventricular groove, diagonals to the
//    anterolateral wall, septal perforators into the septum (below the
//    epicardium), obtuse marginals along the obtuse margin, RV and acute
//    marginal branches across the RV free wall, posterolateral branches, the
//    AV-nodal artery turning up at the crux and the sinoatrial nodal artery
//    towards the SVC-right atrial junction. Proximal courses leave the ostia
//    along the ostial direction on a curvature-limited cubic and never climb
//    above the bifurcation.
// 2. Band-limited tortuosity (tortuosity.ts) is added in the local surface
//    frame, then every vessel is resampled by arc length. The LAD also gets a
//    long course meander, mostly in depth within the groove fat.
//    Every new vessel keeps clear of the lumens already placed (an occupancy
//    hash of rest positions with provisional radii): named branches try
//    narrower or wider courses and are cut short only as a last resort; small
//    branches start clear of every vessel but their host and stop before
//    touching one, so no branch re-enters its parent and no two lumens of a
//    tree run through each other.
// 3. Smaller branches fill the remaining epicardium by greedy space
//    colonisation on a coverage-distance field: a branch starts where the
//    neighbouring myocardium is furthest from any vessel and grows into the gap
//    until it nears another vessel's territory (three generations, the last
//    down to about 0.4 mm radius), so there is no parallel comb. Territory
//    ownership is nearest-vessel with an order offset: the LAD keeps a strip
//    along itself and the apex, the small branches drain the gaps.
// 4. Calibres follow the Huo-Kassab flow-diameter law D ∝ Q^(3/7)
//    (Gong et al. 2016, doi:10.1152/ajpheart.00084.2016; the exponent 7/3 of
//    D^(7/3) = ΣD_i^(7/3) fitted normal human bifurcations best in
//    Medrano-Gracia et al. 2017). Q at each sample is the myocardial territory
//    (surface area nearest to the downstream samples, RV free wall weighted by
//    a model factor) fed downstream of it. The flow constant puts the proximal
//    LAD at the genome's left main x the Dodge 1992 LAD/LM ratio; the RCA and
//    circumflex systems are each pulled towards the Dodge mean for the
//    dominance. The first diagonal, first marginal and ramus are given at least
//    their near-ostial diameters from Divia Paul 2018 (relative to the left
//    main), and the first of a series is not systematically the smaller.
// 5. Every sample of a named vessel gets its SYNTAX segment label
//    (syntaxscore.org segment definitions).
//
// The result depends only on the genome and the ostia, so it is cached and
// lesions, stents and occlusions are applied on top without regrowing.
// ---------------------------------------------------------------------------

import type { Vec3, VesselId } from "../../types";
import type { AnatomyModel, GraftSite } from "../../simulation/anatomy";
import { Rng } from "../../utils/random";
import { makeHeart, restPoint, grooveAt, rvApexU, rvWeight, surfaceRadius, V3, type HeartFrame } from "./heart";
import type { AnatomyGenome } from "./coronaryAtlas";
import { tortuosityOffsets } from "./tortuosity";

/** One centre-line sample: either on the heart surface, fixed in the aortic frame, or a blend. */
export interface Sample {
  ell: number;
  phi: number;
  h: number;
  /** fixed aortic-frame point (ostium region) */
  fixed?: Vec3;
  /** 0 = fully fixed, 1 = fully on the moving heart surface */
  w: number;
}

export type Territory = "lv" | "rv" | "septal" | "atrial";
export type VesselKind = "main" | "branch" | "twig";

export interface GrownVessel {
  name: string;
  fillId: VesselId;
  lesionId: VesselId | null;
  side: "left" | "right";
  kind: VesselKind;
  generation: number;
  samples: Sample[];
  /** arc length from this vessel's first sample (rest geometry), mm */
  lenMm: number[];
  parent?: { name: string; index: number };
  territory: Territory;
  /** SYNTAX segment label per sample (null where SYNTAX does not score the vessel) */
  segment: (string | null)[];
  /** myocardial bridge: sample range and systolic compression depth */
  bridge?: { i0: number; i1: number; depth: number };
  /** healthy radius per sample (flow law), mm */
  radius: number[];
  /** relative territory flow per sample */
  flow: number[];
  /** tortuosity offsets per sample (lateral, height; mm) for stent straightening */
  tort?: { lat: Float32Array; hgt: Float32Array };
}

export interface Topology {
  key: string;
  heart: HeartFrame;
  genome: AnatomyGenome;
  vessels: GrownVessel[];
  buildMs: number;
  stats: { samples: number; vessels: number; twigs: number; totalLengthMm: number; coverage: number };
  /** named vessels that no course variant kept clear of the placed ones, cut short (validation output) */
  cuts?: { name: string; keptMm: number; fullMm: number; blocker: string; at: number; blockerSample: number; hostIndex: number }[];
}

const v3 = V3.v;
const add = V3.add,
  sub = V3.sub,
  sc = V3.sc,
  dot = V3.dot,
  nrm = V3.nrm,
  cross = V3.cross;
const len3 = (p: Vec3) => Math.hypot(p.x, p.y, p.z);
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: Vec3, b: Vec3, t: number) => v3(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const smooth01 = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
/** softplus with knee width s (mm): smooth max(0, x) */
const softplus = (x: number, s: number) => (x / s > 30 ? x : s * Math.log1p(Math.exp(x / s)));
/** smooth clamp of a height to [lo, hi] with knee width s: about the identity well inside, never outside */
const softRange = (h: number, lo: number, hi: number, s: number) => {
  const a = lo + softplus(h - lo, s);
  return hi - softplus(hi - a, s);
};
const D2R = Math.PI / 180;

/**
 * Course meander of the LAD (tortuosity.ts courseDeg, 35-90 mm wavelengths) and the damping of the RCA's longest octave:
 * model parameters calibrated so that the projected 20-60 mm band approaches the library medians (LAD RAO cranial
 * 13.85°, RCA LAO 11.6°; scripts/anatomy_validation/sim_metrics.ts tortuosity).
 */
const LAD_COURSE_DEG = 7;
/**
 * The LAD's course meander is mostly in depth: it rises and sinks in the fat of the anterior groove (seen in profile
 * on the anterior border in RAO views), up to LAD_H_MAX mm above the myocardium. Model parameters.
 */
const LAD_COURSE_HEIGHT = 4;
const LAD_H_MAX = 8;
/**
 * The LAD's depth meander stays in the groove fat: its mid course is lifted LAD_FAT_LIFT mm (ramping in over LIFT_RAMP mm
 * from the surface entry, out towards the apex) and its height saturates smoothly (knee LAD_SOFT mm) between the
 * epicardial floor (0.6 mm) and LAD_H_MAX, so it never dips into the myocardium outside a flagged bridge. Model parameters.
 */
const LAD_FAT_LIFT = 2;
const LAD_SOFT = 0.5;
const LIFT_RAMP: [number, number] = [8, 30];
const RCA_LOW_OCTAVE = 0.5;
/** height lift and ceiling (mm) of a looping (tortuous) RCA in the AV-groove fat: model parameters */
const RCA_LOOP_LIFT = 1.5;
const RCA_LOOP_H_MAX = 8;
/** Sample spacing after resampling: named vessels and branches, small branches (mm). */
export const STEP_MAIN = 1.0;
export const STEP_TWIG = 1.4;
/** AV-groove position (ell) and height in the groove fat (mm): model parameters */
const AVE = -0.94;
const H_GROOVE = 3.2;
const H_EPI = 2.4;
/** territory weight of RV free wall relative to LV (thinner wall): model parameter */
const RV_WEIGHT = 0.4;
/** territory weight per mm of septal perforator and of nodal arteries (mm² per mm): model parameters */
const SEPTAL_W = 7.5;
/** extra territory weight of the first septal perforator (the "more pronounced" first septal, Kesieme 2024): model parameter */
const S1_WEIGHT = 2;
/**
 * Septal territory weight by order: the first few septals drain most of the septum (S1 x S1_WEIGHT, then S2-S5 x
 * SEPTAL_ORDER_W), the later ones are small (0.6 falling to 0.2). Model parameters (in RAO views the first four or five
 * septals are the visible comb below the LAD; the later ones are thread-like).
 */
const SEPTAL_ORDER_W = [1.5, 1.35, 1.2, 1.0];
function septalWeight(name: string): number {
  const k = +name.slice(1);
  if (!(k >= 1)) return 1;
  return k === 1 ? S1_WEIGHT : k <= 5 ? SEPTAL_ORDER_W[k - 2] : Math.max(0.2, 0.6 - 0.1 * (k - 6));
}
/** turn of the left main course from the ostial direction towards the patient's left and front: model parameter */
const LM_TURN: Vec3 = { x: 0.1, y: -0.1, z: 0.55 };

// ---- anomalous origins and the fistula (diag-anatomy-variants); every value is a MODEL PARAMETER ----
/** Distance along the RCA at which a circumflex arising from the proximal RCA leaves it (mm). */
export const LCX_FROM_RCA_MM = 6;
/** Clearance of an interarterial left main from the sinus wall (mm). */
const LM_COURSE_CLEAR_MM = 4;
/** Name of the fistula vessel in the tree (fillId LAD: it fills with a left injection). */
export const FISTULA_VESSEL = "FISTULA";
/**
 * Where a fistula from the LAD drains: on the anterior wall of the pulmonary trunk above the pulmonary valve, in the
 * aortic frame relative to the sinus radius R: x = R + dx, y = y, z = R + dz (mm). The trunk is thorax.ts PA_TRUNK.
 */
export const FISTULA_DRAIN = { dx: 4, y: 24, dz: 6 } as const;
/** Tortuosity of the fistula relative to the patient's index (fistulae are tortuous). */
export const FISTULA_TORTUOSITY = 1.8;
/** The fistula widens towards its drainage by this factor over its length. */
export const FISTULA_WIDENING = 1.3;

/** Where the left main bifurcates: its usual position (the anomalous left main from the right sinus reaches the same bed). */
export function lmBifurcation(model: AnatomyModel, g: Pick<AnatomyGenome, "lm" | "variants">): Vec3 {
  if (g.lm.separateOstia) return model.lm.pos;
  const os = g.variants.includes("anomalous-lm-right-sinus") && model.usual ? model.usual.lm : model.lm;
  return add(os.pos, sc(nrm(add(os.dir, LM_TURN)), g.lm.lengthMm));
}

/** Fixed course of a left main from the right sinus: forwards round the front of the root (between the aorta and the pulmonary trunk), then to the bifurcation. */
function interarterialLm(model: AnatomyModel, B: Vec3): Sample[] {
  const os = model.lm.pos;
  const R = model.sinusRadius + LM_COURSE_CLEAR_MM;
  const a0 = Math.atan2(os.z, os.x);
  let a1 = Math.atan2(B.z, B.x) + 25 * D2R;
  // the anterior way round: azimuth decreasing through 90 degrees
  while (a1 > a0) a1 -= 2 * Math.PI;
  const pts: Vec3[] = [os];
  const n = 8;
  for (let k = 1; k <= n; k++) {
    const t = k / n;
    const a = a0 + (a1 - a0) * t;
    const r = lerp(model.sinusRadius + 1, R, smooth01(t * 3));
    pts.push(v3(Math.cos(a) * r, lerp(os.y, B.y + 2, t), Math.sin(a) * r));
  }
  const out: Sample[] = [];
  for (let k = 0; k < pts.length; k++) out.push(...fixedPath(pts[k], k + 1 < pts.length ? pts[k + 1] : B, 0.5));
  return out;
}

/** The fistula's drainage point on the pulmonary trunk (aortic frame). */
export function fistulaDrain(model: AnatomyModel): Vec3 {
  const R = model.sinusRadius;
  return v3(R + FISTULA_DRAIN.dx, FISTULA_DRAIN.y, R + FISTULA_DRAIN.dz);
}
const ATRIAL_W = 6;
/** territory (mm²) given to every terminal tip, for the myocardium beyond the end of the drawn branch: model parameter */
const TIP_TERRITORY = 50;

// ---------------------------------------------------------------------------
// geometry helpers
// ---------------------------------------------------------------------------

function catmull(a: number, b: number, c: number, d: number, t: number) {
  const t2 = t * t,
    t3 = t2 * t;
  return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
}

/** Rest position of a sample (build time, uncached). */
export function restOf(H: HeartFrame, s: Sample): Vec3 {
  if (s.fixed && s.w <= 0) return s.fixed;
  const p = restPoint(H, s.ell, s.phi, s.h);
  if (!s.fixed || s.w >= 1) return p;
  return lerp3(s.fixed, p, s.w);
}

/** Inverse of the surface map (approximate): surface coordinates of a world point. */
function toSurface(H: HeartFrame, q: Vec3): { ell: number; phi: number; h: number } {
  const r = sub(q, H.base);
  const l = dot(r, H.L);
  const a = dot(r, H.A),
    s = dot(r, H.S);
  const u = l / H.len;
  const phi = Math.atan2(s, a) / D2R;
  const rr = Math.hypot(a, s);
  return { ell: 2 * u - 1, phi, h: rr - surfaceRadius(H, u, phi) };
}

type Node = { ell: number; phi: number; h?: number };

/** Dense surface path through nodes (Catmull-Rom in surface coordinates, phi unwrapped). */
function surfacePath(nodes: Node[], phi0?: number): Sample[] {
  const pts: { ell: number; phi: number; h: number }[] = [];
  for (const n of nodes) {
    let phi = n.phi;
    const prev = pts.length ? pts[pts.length - 1].phi : phi0;
    if (prev !== undefined) {
      while (phi - prev > 180) phi -= 360;
      while (phi - prev < -180) phi += 360;
    }
    pts.push({ ell: n.ell, phi, h: n.h ?? H_EPI });
  }
  if (pts.length === 1) return [{ ...pts[0], w: 1 }];
  const out: Sample[] = [];
  const get = (i: number) => pts[clamp(i, 0, pts.length - 1)];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = get(i - 1),
      b = get(i),
      c = get(i + 1),
      d = get(i + 2);
    const K = 24;
    for (let k = 0; k < K; k++) {
      const t = k / K;
      out.push({ ell: Math.min(0.997, catmull(a.ell, b.ell, c.ell, d.ell, t)), phi: catmull(a.phi, b.phi, c.phi, d.phi, t), h: catmull(a.h, b.h, c.h, d.h, t), w: 1 });
    }
  }
  const last = pts[pts.length - 1];
  out.push({ ell: Math.min(0.997, last.ell), phi: last.phi, h: last.h, w: 1 });
  return out;
}

/**
 * Surface coordinates whose rest position is (close to) a world point: inverse map, then a few Newton
 * steps on (ell, phi) in the tangent plane and on h along the normal.
 */
function fitSurface(H: HeartFrame, p: Vec3): { ell: number; phi: number; h: number } {
  let q = toSurface(H, p);
  let s: Sample = { ell: clamp(q.ell, -1.6, 0.99), phi: q.phi, h: q.h, w: 1 };
  for (let it = 0; it < 4; it++) {
    const r = restOf(H, s);
    const d = sub(p, r);
    const J = jacobian(H, s);
    const N = nrm(cross(J[1], J[0]));
    const dh = dot(d, N) * (dot(N, sub(restPoint(H, s.ell, s.phi, s.h + 1), r)) >= 0 ? 1 : -1);
    const [de, dp] = toParamDelta(J, sub(d, sc(N, dot(d, N))));
    s = { ell: clamp(s.ell + clamp(de, -0.1, 0.1), -1.6, 0.99), phi: s.phi + clamp(dp, -20, 20), h: s.h + clamp(dh, -10, 10), w: 1 };
    q = s;
  }
  return { ell: s.ell, phi: s.phi, h: s.h };
}

/** Unit tangent at the start of a dense surface path (rest geometry). */
function startTangent(H: HeartFrame, path: Sample[]): Vec3 {
  return nrm(sub(restOf(H, path[Math.min(path.length - 1, 6)]), restOf(H, path[0])));
}

/**
 * Cubic Bezier from a fixed point with a start tangent onto the first sample of a surface path, leaving
 * along the start tangent and arriving along the path's own tangent (no kink at the junction). Each sample
 * carries the surface coordinates of its own rest position, so at rest the blend changes nothing, and in
 * motion the course passes smoothly from the root's motion (w = 0) to the heart's (w = 1).
 */
function bridgePath(H: HeartFrame, p0: Vec3, t0: Vec3, entry: Sample, t1: Vec3, opts: { climbOk?: boolean; c0?: number; c1?: number } = {}): Sample[] {
  const p3 = restOf(H, entry);
  const d = dist(p0, p3);
  let a = nrm(t0);
  // monotone in height: the vessel never leaves the ostium upwards unless a variant asks for it
  if (!opts.climbOk && a.y > 0) a = nrm(v3(a.x, Math.min(0, a.y) - 0.05, a.z));
  const p1 = add(p0, sc(a, d * (opts.c0 ?? 0.4)));
  const p2 = sub(p3, sc(nrm(t1), d * (opts.c1 ?? 0.35)));
  const n = Math.max(6, Math.round(d / 0.5));
  const out: Sample[] = [];
  for (let k = 0; k < n; k++) {
    const t = k / n;
    const u = 1 - t;
    const p = add(add(sc(p0, u * u * u), sc(p1, 3 * u * u * t)), add(sc(p2, 3 * u * t * t), sc(p3, t * t * t)));
    // the blend weight rises smoothly; the moving surface takes over towards the entry
    const w = t * t * (3 - 2 * t);
    const sc0 = k === 0 ? { ell: entry.ell, phi: entry.phi, h: entry.h } : fitSurface(H, p);
    // keep phi continuous with the entry (the surface path is unwrapped from it)
    let phi = sc0.phi;
    while (phi - entry.phi > 180) phi -= 360;
    while (phi - entry.phi < -180) phi += 360;
    out.push({ ell: sc0.ell, phi, h: sc0.h, fixed: p, w: w * 0.999 });
  }
  return out;
}

/** Fixed polyline samples (aortic frame), excluding the end point. */
function fixedPath(a: Vec3, b: Vec3, step = 0.5): Sample[] {
  const n = Math.max(1, Math.round(dist(a, b) / step));
  const out: Sample[] = [];
  for (let k = 0; k < n; k++) out.push({ ell: -1, phi: 0, h: 0, fixed: lerp3(a, b, k / n), w: 0 });
  return out;
}

/** Cumulative rest arc length. */
function arcLengths(H: HeartFrame, s: Sample[]): number[] {
  const out = [0];
  let prev = restOf(H, s[0]);
  for (let i = 1; i < s.length; i++) {
    const p = restOf(H, s[i]);
    out.push(out[i - 1] + dist(p, prev));
    prev = p;
  }
  return out;
}

function lerpSample(a: Sample, b: Sample, f: number): Sample {
  const s: Sample = { ell: lerp(a.ell, b.ell, f), phi: lerp(a.phi, b.phi, f), h: lerp(a.h, b.h, f), w: lerp(a.w, b.w, f) };
  if (a.fixed && b.fixed) s.fixed = lerp3(a.fixed, b.fixed, f);
  else if (a.fixed || b.fixed) s.fixed = a.fixed ?? b.fixed;
  return s;
}

/** Resample by rest arc length at `step` mm (first and last samples kept). */
function resample(H: HeartFrame, s: Sample[], step: number): { samples: Sample[]; len: number[] } {
  const L = arcLengths(H, s);
  const total = L[L.length - 1];
  const n = Math.max(1, Math.round(total / step));
  const out: Sample[] = [];
  const lens: number[] = [];
  let j = 0;
  for (let k = 0; k <= n; k++) {
    const target = (total * k) / n;
    while (j < L.length - 2 && L[j + 1] < target) j++;
    const seg = L[j + 1] - L[j];
    const f = seg > 1e-9 ? clamp((target - L[j]) / seg, 0, 1) : 0;
    out.push(lerpSample(s[j], s[j + 1] ?? s[j], f));
  }
  // recompute exact lengths of the resampled polyline (rest)
  const L2 = arcLengths(H, out);
  for (const x of L2) lens.push(x);
  return { samples: out, len: lens };
}

/** Surface tangent-plane basis at a sample: ∂p/∂ell and ∂p/∂phi (per unit and per degree). */
function jacobian(H: HeartFrame, s: Sample): [Vec3, Vec3] {
  const de = 0.003,
    dp = 0.6;
  const e = Math.min(s.ell, 0.994);
  const pe = sc(sub(restPoint(H, e + de, s.phi, 0), restPoint(H, e - de, s.phi, 0)), 1 / (2 * de));
  const pp = sc(sub(restPoint(H, e, s.phi + dp, 0), restPoint(H, e, s.phi - dp, 0)), 1 / (2 * dp));
  return [pe, pp];
}

/** Express a tangent-plane displacement (world, mm) as (dell, dphi) by least squares. */
function toParamDelta(J: [Vec3, Vec3], d: Vec3): [number, number] {
  const [a, b] = J;
  const aa = dot(a, a),
    ab = dot(a, b),
    bb = dot(b, b);
  const ad = dot(a, d),
    bd = dot(b, d);
  const det = aa * bb - ab * ab;
  if (Math.abs(det) < 1e-9) return [0, 0];
  return [(bb * ad - ab * bd) / det, (aa * bd - ab * ad) / det];
}

/**
 * Add band-limited tortuosity to the surface part of a dense path (w = 1 samples), in place.
 * Returns the offsets used (mm) per sample.
 */
function addTortuosity(H: HeartFrame, s: Sample[], seed: string, index: number, opts: { corkscrew?: boolean; straightStartMm?: number; lowOctave?: number; highOctave?: number; courseDeg?: number; courseHeight?: number; hMin?: number; hMax?: number; softRange?: number; lift?: (i: number) => number; protect?: (i: number) => number }): { lat: Float64Array; hgt: Float64Array } {
  // arc length measured from the first sample on the heart surface, so the undulation starts from zero
  // where the proximal (aortic-frame) course joins it and the junction stays smooth
  const L0 = arcLengths(H, s);
  const first = Math.max(0, s.findIndex((x) => x.w >= 1));
  const L = L0.map((x) => Math.max(0, x - L0[first]));
  const offs = tortuosityOffsets(seed, L, { index, corkscrew: opts.corkscrew, straightStartMm: opts.straightStartMm, lowOctave: opts.lowOctave, highOctave: opts.highOctave, courseDeg: opts.courseDeg, courseHeight: opts.courseHeight });
  const P = s.map((x) => restOf(H, x));
  const out = { lat: new Float64Array(s.length), hgt: new Float64Array(s.length) };
  for (let i = 0; i < s.length; i++) {
    const sm = s[i];
    if (sm.w < 1) continue;
    // near the apex the surface coordinates are singular: keep the course smooth there
    const apexDamp = 1 - smooth01((sm.ell - 0.94) / 0.05);
    const k = (opts.protect ? opts.protect(i) : 1) * apexDamp;
    if (k <= 0) continue;
    const a = P[Math.max(0, i - 1)],
      b = P[Math.min(s.length - 1, i + 1)];
    const T = nrm(sub(b, a));
    const J = jacobian(H, sm);
    const N = nrm(cross(J[1], J[0]));
    const B = nrm(cross(T, N));
    if (!Number.isFinite(B.x)) continue;
    const lat = offs.lat[i] * k,
      hgt = offs.hgt[i] * k;
    const [de, dp] = toParamDelta(J, sc(B, lat));
    sm.ell = Math.min(0.996, sm.ell + clamp(de, -0.05, 0.05));
    sm.phi += clamp(dp, -25, 25);
    // epicardial vessels stay in the fat (hMin-hMax above the myocardium, default 0.6-6 mm); a course that already
    // lies outside that range before the undulation (septal, bridge, nodal) keeps its own floor or ceiling
    const hMax = opts.hMax ?? 6;
    const hMin = opts.hMin ?? 0.6;
    const h0 = sm.h;
    // a protected deep run (myocardial bridge) keeps its depth: no lift, and the undulation may not raise it by more
    // than 0.5 mm (else the bridge could float out of the myocardium and lose its systolic compression)
    const deepRun = h0 < hMin && opts.protect !== undefined && opts.protect(i) < 1;
    let h = h0 + hgt + (opts.lift && !deepRun ? opts.lift(i) * k : 0);
    if (deepRun) h = Math.min(h, h0 + 0.5);
    // soft range: the course saturates smoothly towards the floor and ceiling (no flat-bottomed kinks)
    if (opts.softRange && h0 >= hMin && h0 <= hMax) h = softRange(h, hMin, hMax, opts.softRange);
    sm.h = clamp(h, Math.min(hMin, h0), Math.max(hMax, h0));
    out.lat[i] = lat;
    out.hgt[i] = hgt;
  }
  return out;
}

// ---------------------------------------------------------------------------
// coverage grid (distance from the epicardium to the nearest vessel; territory owner)
// ---------------------------------------------------------------------------

const NU = 60,
  NP = 120;

interface Grid {
  pos: Vec3[];
  area: Float64Array;
  rv: Float64Array;
  /** true distance to the nearest vessel (growth gating) */
  d: Float64Array;
  /** ownership distance: true distance plus the owner's order offset (OWN_PENALTY) */
  e: Float64Array;
  owner: Int32Array; // vessel index
  ownerS: Int32Array; // sample index
  rowR: Float64Array; // typical radius per row
}

function makeGrid(H: HeartFrame): Grid {
  const n = NU * NP;
  const pos: Vec3[] = new Array(n);
  const area = new Float64Array(n);
  const rv = new Float64Array(n);
  const rowR = new Float64Array(NU);
  const du = 0.995 / NU,
    dphi = 360 / NP;
  for (let i = 0; i < NU; i++) {
    const u = (i + 0.5) * du;
    let rmin = Infinity;
    for (let j = 0; j < NP; j++) {
      const phi = -180 + (j + 0.5) * dphi;
      const e = 2 * u - 1;
      const p = restPoint(H, e, phi, 0);
      pos[i * NP + j] = p;
      const pu = sub(restPoint(H, Math.min(0.999, e + 2 * du * 0.5), phi, 0), restPoint(H, e - 2 * du * 0.5, phi, 0));
      const pp = sub(restPoint(H, e, phi + dphi / 2, 0), restPoint(H, e, phi - dphi / 2, 0));
      area[i * NP + j] = len3(cross(pu, pp));
      rv[i * NP + j] = rvWeight(H, u, phi);
      rmin = Math.min(rmin, surfaceRadius(H, u, phi));
    }
    rowR[i] = Math.max(4, rmin);
  }
  return { pos, area, rv, d: new Float64Array(n).fill(1e9), e: new Float64Array(n).fill(1e9), owner: new Int32Array(n).fill(-1), ownerS: new Int32Array(n).fill(-1), rowR };
}

function cellOf(H: HeartFrame, ell: number, phi: number): number {
  const u = (ell + 1) / 2;
  if (u < 0 || u >= 0.995) return -1;
  const i = clamp(Math.floor((u / 0.995) * NU), 0, NU - 1);
  let p = ((phi + 180) % 360 + 360) % 360;
  const j = clamp(Math.floor(p / (360 / NP)), 0, NP - 1);
  return i * NP + j;
}

/**
 * Territory ownership offset by vessel order (mm added to the distance when deciding which vessel drains a patch of
 * epicardium). The trunks get a small bonus (negative offset) so that the distal LAD keeps the apex and its Dodge
 * calibre while the space-filling branches drain the gaps between the named vessels. Model parameters.
 */
const OWN_PENALTY: Record<VesselKind, number> = { main: 3, branch: 2.5, twig: -2.5 };
/** the LAD drains the apex (and the inferior apex when it wraps round): a larger bonus, model parameter */
const LAD_OWN_PENALTY = -4.5;
/** extra LAD bonus over the apical quarter of the ventricle (rows from APEX_ROW): the apex is LAD territory in most hearts; model parameter */
const LAD_APEX_PENALTY = -10;
/** fraction of the LAD's length from which it keeps its own strip of territory (model parameter) */
const LAD_OWN_FROM = 0.35;
const APEX_ROW = Math.floor(NU * 0.72);

function gridInsert(H: HeartFrame, g: Grid, p: Vec3, s: Sample, vi: number, si: number, R = 20, pen = 0, apexPen = 0): void {
  const u = (s.ell + 1) / 2;
  if (u < -0.05 || u > 1.01) return;
  const ic = clamp(Math.floor((clamp(u, 0, 0.994) / 0.995) * NU), 0, NU - 1);
  const dI = Math.ceil(R / (H.len / NU)) + 1;
  for (let i = Math.max(0, ic - dI); i <= Math.min(NU - 1, ic + dI); i++) {
    const dJ = Math.min(NP / 2, Math.ceil((R / g.rowR[i]) / D2R / (360 / NP)) + 1);
    const jc = Math.floor((((s.phi + 180) % 360 + 360) % 360) / (360 / NP));
    for (let dj = -dJ; dj <= dJ; dj++) {
      const j = (((jc + dj) % NP) + NP) % NP;
      const c = i * NP + j;
      const q = g.pos[c];
      const dx = q.x - p.x,
        dy = q.y - p.y,
        dz = q.z - p.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < g.d[c] * g.d[c]) g.d[c] = Math.sqrt(d2);
      const de = Math.sqrt(d2) + pen + (i >= APEX_ROW ? apexPen : 0);
      if (de < g.e[c]) {
        g.e[c] = de;
        g.owner[c] = vi;
        g.ownerS[c] = si;
      }
    }
  }
}

function gridD(H: HeartFrame, g: Grid, ell: number, phi: number): number {
  const c = cellOf(H, ell, phi);
  return c < 0 ? 0 : g.d[c];
}

// ---------------------------------------------------------------------------
// vessel assembly
// ---------------------------------------------------------------------------

interface Spec {
  name: string;
  fillId: VesselId;
  lesionId: VesselId | null;
  side: "left" | "right";
  kind: VesselKind;
  territory: Territory;
  parent?: { name: string; index: number };
  /** dense path (fixed + blend + surface) */
  dense: Sample[];
  tort: { index: number; corkscrew?: boolean; straightStartMm?: number; lowOctave?: number; highOctave?: number; courseDeg?: number; courseHeight?: number; hMin?: number; hMax?: number; softRange?: number; liftMm?: number };
  step: number;
  bridge?: { fromMm: number; toMm: number; depth: number };
}

// ---------------------------------------------------------------------------
// occupancy: rest positions of every placed vessel with a provisional radius, so that new vessels keep clear of the
// ones already placed (no branch re-entering its parent, no lumen running through another one)
// ---------------------------------------------------------------------------

/** extra clearance between two lumens, mm (model parameter) */
export const CLEAR_MARGIN = 0.3;
/** room left for the twig tortuosity added after the growth step (mm): model parameter */
const TWIG_TORT_ROOM = 0.4;
const OCC_CELL = 3;

/**
 * Provisional radius (mm) of a vessel before the flow law runs, by kind and position along it: generous on purpose,
 * because the clearance has to hold for the final calibres (model parameters; checked against the final radii by
 * scripts/anatomy_validation/artefact_report.ts).
 */
function provisionalRadius(gv: GrownVessel, i: number, lmD: number): number {
  const f = gv.lenMm[i] / Math.max(1, gv.lenMm[gv.lenMm.length - 1]);
  const k = lmD / 4.5;
  if (gv.name === "LM") return lmD / 2;
  if (gv.kind === "main") return k * lerp(1.95, 0.8, f);
  if (gv.kind === "twig") return lerp(gv.generation <= 1 ? 0.6 : gv.generation === 2 ? 0.45 : 0.35, 0.18, f);
  if (gv.territory === "septal") return k * lerp(0.8, 0.3, f);
  if (gv.territory === "atrial") return 0.5;
  return k * lerp(1.25, 0.45, f);
}

class Occupancy {
  private cells = new Map<number, number[]>();
  /** per entry: vessel index, sample index */
  ev: number[] = [];
  es: number[] = [];
  pos: Vec3[][] = [];
  rad: Float32Array[] = [];
  maxR = 0;
  private key(x: number, y: number, z: number) {
    return ((Math.floor(x / OCC_CELL) + 512) * 1024 + (Math.floor(y / OCC_CELL) + 512)) * 1024 + (Math.floor(z / OCC_CELL) + 512);
  }
  addVessel(vi: number, P: Vec3[], R: Float32Array): void {
    this.pos[vi] = P;
    this.rad[vi] = R;
    for (let j = 0; j < P.length; j++) {
      const k = this.key(P[j].x, P[j].y, P[j].z);
      const e = this.ev.length;
      this.ev.push(vi);
      this.es.push(j);
      const c = this.cells.get(k);
      if (c) c.push(e);
      else this.cells.set(k, [e]);
      if (R[j] > this.maxR) this.maxR = R[j];
    }
  }
  /** Calls fn(vessel, sample) for entries within `rad` (cell-coarse) of p. */
  near(p: Vec3, rad: number, fn: (vi: number, si: number) => boolean | void): void {
    const n = Math.ceil(rad / OCC_CELL);
    const cx = Math.floor(p.x / OCC_CELL),
      cy = Math.floor(p.y / OCC_CELL),
      cz = Math.floor(p.z / OCC_CELL);
    for (let dx = -n; dx <= n; dx++)
      for (let dy = -n; dy <= n; dy++)
        for (let dz = -n; dz <= n; dz++) {
          const c = this.cells.get(((cx + dx + 512) * 1024 + (cy + dy + 512)) * 1024 + (cz + dz + 512));
          if (!c) continue;
          for (const e of c) if (fn(this.ev[e], this.es[e]) === true) return;
        }
  }
  /** Distance from p to vessel vi's polyline around sample si, and the radius there. */
  segDist(vi: number, si: number, p: Vec3): { d: number; r: number } {
    const P = this.pos[vi],
      R = this.rad[vi];
    let best = { d: dist(p, P[si]), r: R[si] };
    for (const k of [si - 1, si]) {
      if (k < 0 || k + 1 >= P.length) continue;
      const a = P[k],
        b = P[k + 1];
      const ab = sub(b, a);
      const L2 = dot(ab, ab);
      const t = L2 > 1e-12 ? clamp(dot(sub(p, a), ab) / L2, 0, 1) : 0;
      const d = dist(p, add(a, sc(ab, t)));
      if (d < best.d) best = { d, r: R[k] + (R[k + 1] - R[k]) * t };
    }
    return best;
  }
}

/** What a new vessel may touch: its host near its origin (and the host's own lineage there). */
interface ClearOpts {
  /** vessel index of the parent */
  host?: number;
  /** origin sample on the parent */
  hostIndex?: number;
  /** parent samples within this many of the origin are not obstacles */
  hostWin?: number;
  /** first own sample to test */
  from?: number;
  /** extra clearance (mm), e.g. for tortuosity still to come */
  extra?: number;
  /** vessel indices that are no obstacle */
  ignore?: Set<number>;
  /**
   * Near-origin length (mm): within it the new vessel is still leaving the bifurcation, so the host window widens by
   * the vessel's own arc length (an acute or recurrent take-off runs beside its parent for a few mm), and the first
   * `nearMm` of a sibling leaving the same parent within the host window are no obstacle (adjacent origins).
   */
  nearMm?: number;
  /** vessel indices of the siblings that leave the host within the host window */
  siblings?: Set<number>;
}

class Builder {
  H: HeartFrame;
  g: AnatomyGenome;
  vessels: GrownVessel[] = [];
  byName = new Map<string, GrownVessel>();
  occ = new Occupancy();
  constructor(H: HeartFrame, g: AnatomyGenome) {
    this.H = H;
    this.g = g;
  }
  rng(name: string) {
    return new Rng(`grow:${this.g.seed}:${name}`);
  }
  /** Finalise and register a vessel: tortuosity, resampling, registration. */
  add(sp: Spec): GrownVessel {
    return this.register(this.make(sp));
  }
  /** Register a vessel made by make(): adds it to the tree and to the occupancy. */
  register(gv: GrownVessel): GrownVessel {
    const vi = this.vessels.length;
    this.vessels.push(gv);
    this.byName.set(gv.name, gv);
    const P = gv.samples.map((s) => restOf(this.H, s));
    const R = new Float32Array(gv.samples.length);
    for (let i = 0; i < R.length; i++) R[i] = provisionalRadius(gv, i, this.g.lm.diameterMm);
    this.occ.addVessel(vi, P, R);
    return gv;
  }
  /** Parent-window options for a vessel leaving `parent` at sample `index`. */
  clearFor(gv: GrownVessel): ClearOpts {
    if (!gv.parent) return {};
    const host = this.vessels.indexOf(this.byName.get(gv.parent.name)!);
    if (host < 0) return {};
    const rH = this.occ.rad[host]?.[gv.parent.index] ?? 1.5;
    const step = Math.max(0.5, gv.lenMm[1] - gv.lenMm[0] || 1);
    // the parent near the origin is no obstacle: as far as a branch needs to clear the parent's lumen at its take-off angle
    const hostWin = Math.ceil((2 * rH + 3) / Math.max(0.8, STEP_MAIN)) + 1;
    const siblings = new Set<number>();
    this.vessels.forEach((v, vi) => {
      if (v.parent && v.parent.name === gv.parent!.name && Math.abs(v.parent.index - gv.parent!.index) <= hostWin) siblings.add(vi);
    });
    // a vessel leaving the left main bifurcation has the other trunks (LAD, LCx) as siblings at the same point
    if (this.vessels[host].name === "LM") this.vessels.forEach((v, vi) => v.parent?.name === "LM" && siblings.add(vi));
    return { host, hostIndex: gv.parent.index, hostWin, from: Math.min(gv.samples.length - 1, Math.ceil((rH + 0.5) / step)), nearMm: 2 * rH + 3, siblings };
  }
  /**
   * First sample of a (not yet registered) vessel whose lumen would come closer to a placed vessel than the two
   * provisional radii plus CLEAR_MARGIN; -1 if it keeps clear. Re-approaching its own parent away from the origin
   * counts (re-entry).
   */
  firstConflict(gv: GrownVessel, o: ClearOpts = {}): number {
    const H = this.H;
    const lmD = this.g.lm.diameterMm;
    const extra = o.extra ?? 0;
    this.blocker = -1;
    for (let j = o.from ?? 0; j < gv.samples.length; j++) {
      const p = restOf(H, gv.samples[j]);
      const rj = provisionalRadius(gv, j, lmD);
      const reach = rj + this.occ.maxR + CLEAR_MARGIN + extra + 1;
      const near = o.nearMm !== undefined && gv.lenMm[j] <= o.nearMm;
      const win = (o.hostWin ?? 0) + (near ? Math.ceil(gv.lenMm[j] / STEP_MAIN) : 0);
      let hit = -1,
        hitK = -1;
      this.occ.near(p, reach, (w, k) => {
        if (w === o.host && Math.abs(k - (o.hostIndex ?? -99)) <= win) return;
        if (o.ignore && o.ignore.has(w)) return;
        if (near && o.siblings && o.siblings.has(w) && this.vessels[w].lenMm[k] <= o.nearMm!) return;
        const s = this.occ.segDist(w, k, p);
        if (s.d < rj + s.r + CLEAR_MARGIN + extra) {
          hit = w;
          hitK = k;
          return true;
        }
      });
      if (hit >= 0) {
        this.blocker = hit;
        this.blockerSample = hitK;
        return j;
      }
    }
    return -1;
  }
  /** vessel index that stopped the last firstConflict() call (-1 when it kept clear) */
  blocker = -1;
  blockerSample = -1;
  /** named vessels cut short by addClear (name, kept and full length in mm, blocking vessel) */
  cuts: { name: string; keptMm: number; fullMm: number; blocker: string; at: number; blockerSample: number; hostIndex: number }[] = [];
  /** Shorten an unregistered vessel to its first n samples. */
  truncate(gv: GrownVessel, n: number): GrownVessel {
    if (n >= gv.samples.length) return gv;
    gv.samples = gv.samples.slice(0, n);
    gv.lenMm = gv.lenMm.slice(0, n);
    gv.segment = gv.segment.slice(0, n);
    if (gv.tort) gv.tort = { lat: gv.tort.lat.slice(0, n), hgt: gv.tort.hgt.slice(0, n) };
    if (gv.bridge && gv.bridge.i1 >= n - 2) gv.bridge = gv.bridge.i0 < n - 4 ? { ...gv.bridge, i1: n - 3 } : undefined;
    return gv;
  }
  /**
   * Make a named vessel that keeps clear of the placed ones: tries the course variants in order (e.g. a narrower fan),
   * and if none keeps clear, the variant that runs longest before its first conflict, cut 3 samples before it (never
   * below `minSamples`).
   */
  addClear(variants: (() => Spec)[], minSamples = 10): GrownVessel {
    return this.addClearOrDrop(variants, minSamples, 0)!;
  }
  /**
   * As addClear(), but a vessel that no variant keeps clear for at least `dropBelowMm` is left out (returns null) instead
   * of being kept as a stub: the small-branch growth then fills its territory.
   */
  addClearOrDrop(variants: (() => Spec)[], minSamples: number, dropBelowMm: number): GrownVessel | null {
    let best: { gv: GrownVessel; at: number; blocker: number; bs: number } | null = null;
    for (const mk of variants) {
      const gv = this.make(mk());
      const at = this.firstConflict(gv, this.clearFor(gv));
      if (at < 0) return this.register(gv);
      if (!best || at > best.at) best = { gv, at, blocker: this.blocker, bs: this.blockerSample };
    }
    const full = best!.gv.lenMm[best!.gv.lenMm.length - 1];
    if (dropBelowMm > 0 && best!.gv.lenMm[Math.max(0, best!.at - 3)] < dropBelowMm) {
      this.cuts.push({ name: best!.gv.name, keptMm: 0, fullMm: full, blocker: this.vessels[best!.blocker]?.name ?? "?", at: best!.at, blockerSample: best!.bs, hostIndex: best!.gv.parent?.index ?? -1 });
      return null;
    }
    const cut = this.truncate(best!.gv, Math.max(minSamples, best!.at - 3));
    this.cuts.push({ name: cut.name, keptMm: cut.lenMm[cut.lenMm.length - 1], fullMm: full, blocker: this.vessels[best!.blocker]?.name ?? "?", at: best!.at, blockerSample: best!.bs, hostIndex: cut.parent?.index ?? -1 });
    return this.register(cut);
  }
  /** Finalise a vessel without registering it: tortuosity, resampling. */
  make(sp: Spec): GrownVessel {
    const H = this.H;
    let dense = sp.dense;
    // bridge: the vessel dips under a muscle band (intramyocardial course)
    if (sp.bridge) {
      const L = arcLengths(H, dense);
      const b = sp.bridge;
      const depth = -(this.g.bridge ? 2.47 : 2.5) - 1.3; // Hostiuc 2018 mean thickness + lumen half-width
      for (let i = 0; i < dense.length; i++) {
        const x = L[i];
        const ramp = Math.min(1, Math.max(0, Math.min((x - b.fromMm + 3) / 4, (b.toMm + 3 - x) / 4)));
        if (ramp > 0) dense[i].h = lerp(dense[i].h, depth, ramp * ramp * (3 - 2 * ramp));
      }
    }
    let tort: { lat: Float64Array; hgt: Float64Array } | undefined;
    if (sp.tort.index > 0) {
      const Lb = sp.bridge || sp.tort.liftMm ? arcLengths(H, dense) : null;
      const first = Math.max(0, dense.findIndex((x) => x.w >= 1));
      const liftMm = sp.tort.liftMm ?? 0;
      tort = addTortuosity(H, dense, `${this.g.seed}:${sp.name}`, sp.tort.index, {
        ...sp.tort,
        // the lift into the groove fat ramps in over LIFT_RAMP mm from where the course joins the heart surface
        lift: Lb && liftMm ? (i) => liftMm * smooth01((Lb[i] - Lb[first] - LIFT_RAMP[0]) / (LIFT_RAMP[1] - LIFT_RAMP[0])) : undefined,
        protect: Lb && sp.bridge ? (i) => (Lb[i] > sp.bridge!.fromMm - 4 && Lb[i] < sp.bridge!.toMm + 4 ? 0.3 : 1) : undefined,
      });
    }
    const { samples, len } = resample(H, dense, sp.step);
    // offsets at resampled positions (nearest dense sample by arc length)
    let tortR: GrownVessel["tort"];
    if (tort) {
      const Ld = arcLengths(H, dense);
      const lat = new Float32Array(samples.length),
        hgt = new Float32Array(samples.length);
      let j = 0;
      for (let i = 0; i < samples.length; i++) {
        const x = (len[i] / (len[len.length - 1] || 1)) * Ld[Ld.length - 1];
        while (j < Ld.length - 1 && Ld[j + 1] < x) j++;
        lat[i] = tort.lat[j];
        hgt[i] = tort.hgt[j];
      }
      tortR = { lat, hgt };
    }
    let bridge: GrownVessel["bridge"];
    if (sp.bridge) {
      // the intramyocardial run: the longest stretch of samples dipped below the epicardium
      let best: [number, number] | null = null;
      let start = -1;
      for (let i = 0; i <= samples.length; i++) {
        const dip = i < samples.length && samples[i].w >= 1 && samples[i].h < -1.5;
        if (dip && start < 0) start = i;
        if (!dip && start >= 0) {
          if (!best || i - 1 - start > best[1] - best[0]) best = [start, i - 1];
          start = -1;
        }
      }
      if (best) bridge = { i0: best[0], i1: best[1], depth: sp.bridge.depth };
    }
    // a branch always belongs to its parent's injection side (an anomalous circumflex from the right sinus
    // takes its marginals, posterolateral and nodal branches with it)
    const parentSide = sp.parent ? this.byName.get(sp.parent.name)?.side : undefined;
    const gv: GrownVessel = {
      name: sp.name,
      fillId: sp.fillId,
      lesionId: sp.lesionId,
      side: parentSide ?? sp.side,
      kind: sp.kind,
      generation: sp.kind === "twig" ? 2 : sp.kind === "branch" ? 1 : 0,
      samples,
      lenMm: len,
      parent: sp.parent,
      territory: sp.territory,
      segment: samples.map(() => null),
      bridge,
      radius: [],
      flow: [],
      tort: tortR,
    };
    return gv;
  }
  private taken = new Map<string, number[]>();
  /**
   * Origin index for a named side branch near a fraction of the parent's length, at least `gap` mm from
   * every other named origin on that parent (two branches leaving at one point cannot be told apart by
   * the wire, and real ones are not stacked).
   */
  pick(v: GrownVessel, frac: number, gap = 3.5): number {
    const used = this.taken.get(v.name) ?? [];
    const total = v.lenMm[v.lenMm.length - 1];
    const want = frac * total;
    let best = -1,
      bestD = Infinity;
    for (let i = 1; i < v.samples.length - 2; i++) {
      const x = v.lenMm[i];
      if (used.some((u) => Math.abs(u - x) < gap)) continue;
      const d = Math.abs(x - want);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    const i = best >= 0 ? best : this.at(v, frac);
    used.push(v.lenMm[i]);
    this.taken.set(v.name, used);
    return i;
  }
  /**
   * Origin candidates for a named branch: the picked index first, then the samples `offsets` (mm) away from it along the
   * parent that keep `gap` mm from every registered origin and lie in [lo, hi]. Nothing is registered (claim the one used).
   */
  originsNear(v: GrownVessel, i0: number, offsets: number[], lo = 1, hi = v.samples.length - 3, gap = 3.5): number[] {
    const used = this.taken.get(v.name) ?? [];
    const out: number[] = [];
    for (const d of offsets) {
      const want = v.lenMm[i0] + d;
      let i = i0;
      while (i < v.lenMm.length - 1 && v.lenMm[i] < want) i++;
      while (i > 0 && v.lenMm[i] > want) i--;
      i = clamp(i, lo, hi);
      if (out.includes(i)) continue;
      if (d !== 0 && used.some((u) => Math.abs(u - v.lenMm[i]) < gap)) continue;
      out.push(i);
    }
    return out.length ? out : [i0];
  }
  /** Peek at pick() without registering the origin. */
  peek(v: GrownVessel, frac: number, gap = 3.5): number {
    const used = this.taken.get(v.name);
    const i = this.pick(v, frac, gap);
    if (used) used.pop();
    else this.taken.delete(v.name);
    return i;
  }
  /** Register an origin chosen another way (terminal branches, crux branches). */
  claim(v: GrownVessel, i: number): number {
    const used = this.taken.get(v.name) ?? [];
    used.push(v.lenMm[i]);
    this.taken.set(v.name, used);
    return i;
  }
  /** Sample index on a vessel at a fraction of its length. */
  at(v: GrownVessel, frac: number): number {
    const target = frac * v.lenMm[v.lenMm.length - 1];
    let i = 0;
    while (i < v.lenMm.length - 1 && v.lenMm[i] < target) i++;
    return i;
  }
  /** Index on a vessel where phi first passes a value (direction-aware). */
  atPhi(v: GrownVessel, phi: number, from = 0): number {
    const s = v.samples;
    const dir = Math.sign(s[s.length - 1].phi - s[0].phi) || 1;
    for (let i = from; i < s.length; i++) if (s[i].w >= 1 && (s[i].phi - phi) * dir >= 0) return i;
    return s.length - 1;
  }
  /** Start node of a branch: the parent's sample at index i (surface coordinates, unwrapped). */
  origin(v: GrownVessel, i: number): Sample {
    const s = v.samples[i];
    return { ell: s.ell, phi: s.phi, h: s.h, w: 1 };
  }
}

// ---------------------------------------------------------------------------
// named vessels
// ---------------------------------------------------------------------------

/** LAD course in the anterior groove: the groove phi, kept on the LV side near the base where the LV-RV seam swings right. */
function ladPhi(H: HeartFrame, u: number): number {
  return Math.max(grooveAt(H, "aiv", u), 4) + 3;
}

/**
 * Entry of the LAD into the anterior groove: the first u where the groove point lies below the
 * bifurcation by `drop` mm, not to the right of it, and at least `minDist` away (no climb, no Z-kink).
 */
function aivEntry(H: HeartFrame, from: Vec3, drop: number, minDist: number): number {
  let best = -1,
    bestX = -Infinity;
  for (let u = 0.02; u <= 0.32; u += 0.005) {
    const p = restPoint(H, 2 * u - 1, ladPhi(H, u), H_GROOVE);
    if (p.y > from.y - drop || dist(p, from) < minDist) continue;
    if (p.x >= from.x - 2) return u;
    if (p.x > bestX) {
      bestX = p.x;
      best = u;
    }
  }
  return best > 0 ? best : 0.12;
}

function buildNamed(b: Builder, model: AnatomyModel): void {
  const H = b.H,
    g = b.g;
  const has = (x: string) => g.variants.includes(x);
  const right = g.dominance === "right",
    left = g.dominance === "left",
    co = g.dominance === "codominant";
  const ti = g.tortuosity.index;
  // crux: where the posterior interventricular groove meets the AV groove. The LV-RV seam of the shape
  // swings rightwards in the last millimetres below the base, so the groove angle is read a little lower.
  const crux = grooveAt(H, "piv", 0.3); // ~185 (expressed in (90, 270))
  const cruxR = crux - 360; // the same angle reached going round the right side

  // ======================= right coronary system =======================
  const anomRca = has("anomalous-rca-left-sinus");
  {
    const r = b.rng("RCA");
    const os = model.rca.pos;
    // entry into the right AV groove, below and to the right of the ostium
    // the right AV groove runs just below the right sinus: the RCA drops into it within a centimetre or two
    // the groove point nearest the ostium that lies below it (at least 2 mm), within -100…-20° (anterior right AV
    // groove), plus a small per-patient spread: the RCA drops into the groove within a centimetre or two
    // (an anomalous RCA from the left sinus crosses in front of the root first, then joins the groove further right)
    let ePhi = anomRca ? -48 : -36;
    if (!anomRca) {
      let best = Infinity;
      for (let ph = -100; ph <= -20; ph += 1) {
        const q = restPoint(H, AVE, ph, H_GROOVE);
        if (q.y > os.y - 2) continue;
        const d = dist(q, os);
        if (d < best) {
          best = d;
          ePhi = ph;
        }
      }
    }
    const entry: Sample = { ell: AVE, phi: ePhi - 4 * r.next(), h: H_GROOVE, w: 1 };
    const dir0 = model.rca.dir;
    const end = right ? cruxR - 6 - 7 * r.next() : co ? cruxR + 2 : -112 - 22 * r.next();
    const nodes: Node[] = [entry, { ell: AVE + 0.004, phi: Math.min(-50, entry.phi - 12), h: H_GROOVE }, { ell: AVE + 0.01, phi: -88, h: H_GROOVE }, { ell: AVE + 0.012, phi: -122, h: H_GROOVE }];
    if (right || co) nodes.push({ ell: AVE + 0.008, phi: -152, h: H_GROOVE }, { ell: AVE + 0.004, phi: cruxR, h: H_GROOVE });
    if (right) nodes.push({ ell: AVE + 0.002, phi: (cruxR + end) / 2, h: H_GROOVE }, { ell: AVE + 0.006, phi: end, h: H_GROOVE });
    else if (left) {
      while (nodes.length && nodes[nodes.length - 1].phi < end) nodes.pop();
      nodes.push({ ell: AVE + 0.012, phi: end, h: H_GROOVE });
    }
    const surf = surfacePath(nodes);
    const t1 = startTangent(H, surf);
    let bridge: Sample[];
    if (anomRca) {
      // interarterial course: forwards between the aorta and the pulmonary trunk, then right
      bridge = bridgePath(H, os, nrm(v3(-0.25, -0.05, 1)), entry, t1, { c0: 1.0, c1: 0.45 });
    } else if (has("shepherds-crook-rca")) {
      // superior loop: rises first, then turns down into the groove
      bridge = bridgePath(H, os, nrm(add(dir0, v3(0, 1.6, 0))), entry, t1, { climbOk: true, c0: 1.0, c1: 0.5 });
    } else bridge = bridgePath(H, os, dir0, entry, t1, { c0: 0.45, c1: 0.4 });
    b.add({
      name: "RCA",
      fillId: "RCA",
      lesionId: "RCA",
      side: "right",
      kind: "main",
      territory: "rv",
      dense: [...bridge, ...surf],
      // a looping RCA sits higher in the groove fat (RCA_LOOP_LIFT, ceiling RCA_LOOP_H_MAX) so its loops rise and sink
      // without dipping into the myocardium
      tort: g.tortuosity.rcaLoops
        ? { index: g.tortuosity.rcaIndex, straightStartMm: 10, lowOctave: 3.4, softRange: 0.5, liftMm: RCA_LOOP_LIFT, hMax: RCA_LOOP_H_MAX }
        : { index: g.tortuosity.rcaIndex, straightStartMm: 10, lowOctave: RCA_LOW_OCTAVE },
      step: STEP_MAIN,
    });
  }
  const rca = b.byName.get("RCA")!;
  // conus branch from its own ostium
  {
    const os = model.conus.pos;
    const entry: Sample = { ell: -0.99, phi: -16, h: 6, w: 1 };
    const csurf = surfacePath([entry, { ell: -0.95, phi: -2, h: 5 }, { ell: -0.88, phi: 10, h: 4 }, { ell: -0.8, phi: 16, h: 3 }]);
    const bridge = bridgePath(H, os, model.conus.dir, entry, startTangent(H, csurf), { climbOk: true, c0: 0.3, c1: 0.3 });
    b.add({
      name: "CONUS",
      fillId: "CONUS",
      lesionId: "CONUS",
      side: "right",
      kind: "branch",
      territory: "rv",
      dense: [...bridge, ...csurf],
      tort: { index: ti * 1.1, straightStartMm: 4 },
      step: STEP_MAIN,
    });
  }
  // RV branches across the free wall towards the RV apex
  {
    const r = b.rng("RV");
    const amIdx = b.atPhi(rca, -90);
    const n = g.rvBranches;
    for (let k = 0; k < n; k++) {
      const frac = (0.25 + (0.6 * (k + 0.3 + 0.4 * r.next())) / n) * (rca.lenMm[amIdx] / rca.lenMm[rca.lenMm.length - 1]);
      const i = b.pick(rca, Math.max(0.12, frac));
      const o = b.origin(rca, i);
      const reach = 0.55 + 0.35 * r.next() - 0.1 * k;
      b.addClear(
        [1, 0.4, 1.6].map((f) => () => ({
          name: k === 0 ? "RV" : `RV${k + 1}`,
          fillId: "RCA" as VesselId,
          lesionId: null,
          side: "right" as const,
          kind: "branch" as const,
          territory: "rv" as const,
          parent: { name: "RCA", index: i },
          dense: surfacePath([o, { ell: o.ell + 0.12, phi: o.phi + 6 * f, h: H_EPI }, { ell: o.ell + reach * 0.6, phi: o.phi + 14 * f, h: H_EPI }, { ell: Math.min(0.75, o.ell + reach), phi: o.phi + 20 * f, h: H_EPI }]),
          tort: { index: ti * 1.15, straightStartMm: 3 },
          step: STEP_MAIN,
        }))
      );
    }
  }
  // acute marginal
  {
    const r = b.rng("AM");
    const i = b.pick(rca, rca.lenMm[b.atPhi(rca, -88 - 6 * r.next())] / rca.lenMm[rca.lenMm.length - 1]);
    const o = b.origin(rca, i);
    const reach = 0.7 + 0.4 * r.next();
    b.addClear(
      [1, -0.5, 2].map((f) => () => ({
        name: "AM",
        fillId: "AM" as VesselId,
        lesionId: "AM" as VesselId,
        side: "right" as const,
        kind: "branch" as const,
        territory: "rv" as const,
        parent: { name: "RCA", index: i },
        dense: surfacePath([o, { ell: o.ell + 0.15, phi: o.phi + 3 * f, h: H_EPI }, { ell: o.ell + reach * 0.6, phi: o.phi + 6 * f, h: H_EPI }, { ell: Math.min(0.6, o.ell + reach), phi: o.phi + 9 * f, h: H_EPI }]),
        tort: { index: ti * 1.15, straightStartMm: 3 },
        step: STEP_MAIN,
      }))
    );
  }
  // sinoatrial nodal artery from the RCA
  if (g.saNodal === "RCA" || g.saNodal === "both") {
    const i = b.pick(rca, 0.08);
    const o = b.origin(rca, i);
    b.add({
      name: "SAN",
      fillId: "RCA",
      lesionId: null,
      side: "right",
      kind: "branch",
      territory: "atrial",
      parent: { name: "RCA", index: i },
      // up the anteromedial right atrial wall towards the SVC-right atrial junction, ending there: the course and
      // its length (about 40-55 mm) are model parameters (no opened source gives an angiographic SA-nodal length)
      dense: surfacePath([o, { ell: -1.05, phi: o.phi - 10, h: 2.5 }, { ell: -1.13, phi: o.phi - 24, h: 2.5 }, { ell: -1.2, phi: o.phi - 40, h: 2.5 }]),
      tort: { index: ti * 1.2, straightStartMm: 3 },
      step: STEP_MAIN,
    });
  }
  // the dominant artery at the crux: PDA, AV-nodal artery, posterolateral branches
  // drop: a first node straight down from the origin (u units) so the artery leaves the AV groove at a right angle;
  // dPhi: offset within the groove (degrees); lift: extra height in the groove fat (mm). Course variants used when the
  // default course would touch a placed vessel (model parameters).
  const pivPath = (o: Sample, uEnd: number, phiRef: number, v: { drop?: number; dPhi?: number; lift?: number } = {}): Node[] => {
    const out: Node[] = [o];
    const u0 = (o.ell + 1) / 2;
    const n = 6;
    const drop = v.drop ?? 0;
    if (drop > 0) out.push({ ell: o.ell + 2 * drop, phi: o.phi, h: H_GROOVE + (v.lift ?? 0) });
    for (let k = 1; k <= n; k++) {
      const u = lerp(u0 + 0.03 + drop * 1.6, uEnd, k / n);
      let phi = grooveAt(H, "piv", u);
      while (phi - phiRef > 180) phi -= 360;
      while (phi - phiRef < -180) phi += 360;
      out.push({ ell: 2 * u - 1, phi: phi + 2 + (v.dPhi ?? 0) * (1 - 0.6 * (k / n)), h: H_GROOVE + (v.lift ?? 0) * (1 - k / n) });
    }
    return out;
  };
  const PDA_VARIANTS: { drop?: number; dPhi?: number; lift?: number }[] = [{}, { drop: 0.025 }, { drop: 0.025, dPhi: -4 }, { drop: 0.04, dPhi: 4 }, { drop: 0.025, lift: 1.5 }];
  const pdaEndU = () => {
    const r = b.rng("PDAlen");
    return g.wrapAround ? 0.5 + 0.18 * r.next() : 0.72 + 0.16 * r.next();
  };
  const crossing = (host: GrownVessel, side: "left" | "right") => {
    // AV-nodal artery: a short U-turn up into the crux
    const ic = b.pick(host, host.lenMm[b.atPhi(host, side === "right" ? cruxR + 1 : crux - 1)] / host.lenMm[host.lenMm.length - 1]);
    const o = b.origin(host, ic);
    b.add({
      name: "AVN",
      fillId: host.fillId,
      lesionId: null,
      side,
      kind: "branch",
      territory: "atrial",
      parent: { name: host.name, index: ic },
      dense: surfacePath([o, { ell: o.ell - 0.05, phi: o.phi + 4, h: 0 }, { ell: -1.06, phi: o.phi + 2, h: -4 }, { ell: -1.12, phi: o.phi - 3, h: -7 }]),
      tort: { index: ti, straightStartMm: 2, hMin: -12 },
      step: STEP_MAIN,
    });
    return ic;
  };
  if (right || co) {
    const ic = co ? b.claim(rca, rca.samples.length - 1) : b.pick(rca, rca.lenMm[b.atPhi(rca, cruxR + 3)] / rca.lenMm[rca.lenMm.length - 1]);
    const o = b.origin(rca, ic);
    b.addClear(
      PDA_VARIANTS.map((pv) => () => ({
        name: "PDA",
        fillId: "PDA" as VesselId,
        lesionId: "PDA" as VesselId,
        side: "right" as const,
        kind: "branch" as const,
        territory: "lv" as const,
        parent: { name: "RCA", index: Math.min(ic, rca.samples.length - 1) },
        dense: surfacePath(pivPath(o, co ? pdaEndU() * 0.8 : pdaEndU(), o.phi, pv)),
        tort: { index: ti * 1.1, straightStartMm: 3 },
        step: STEP_MAIN,
      })),
      30
    );
    crossing(rca, "right");
  }
  if (right) {
    /** shortest posterolateral side branch drawn (mm): model parameter */
    const PL_MIN_MM = 15;
    // posterolateral branches from the RCA beyond the crux (the last is the RCA's terminal branch)
    const r = b.rng("PLV");
    const ic = b.atPhi(rca, cruxR);
    const n = g.plBranches;
    for (let k = 0; k < n; k++) {
      const i0 = k === 0 ? rca.samples.length - 1 : Math.round(lerp(ic + 4, rca.samples.length - 6, (n - k) / n));
      const lo = ic + 2,
        hi = rca.samples.length - 1;
      const iPick = k === 0 ? i0 : b.peek(rca, rca.lenMm[Math.max(ic + 2, Math.min(rca.samples.length - 3, i0))] / rca.lenMm[rca.lenMm.length - 1]);
      // origin alternatives a few mm along the RCA (the branches beyond the crux are crowded), then the fan variants
      const origins = k === 0 ? [i0] : b.originsNear(rca, clamp(iPick, lo, hi), [0, -4, 4, -8], lo, Math.min(hi, rca.samples.length - 3));
      const reach = 0.45 + 0.35 * r.next() - 0.08 * k;
      const pl = (oi: number, f: number) => () => {
        const o = b.origin(rca, oi);
        return {
          name: k === 0 ? "PLV" : `PL${k + 1}`,
          fillId: "PLV" as VesselId,
          lesionId: k === 0 ? ("PLV" as VesselId) : null,
          side: "right" as const,
          kind: "branch" as const,
          territory: "lv" as const,
          parent: { name: "RCA", index: oi },
          dense: surfacePath([o, { ell: o.ell + 0.1, phi: o.phi - 6 * f, h: H_EPI }, { ell: o.ell + reach * 0.6, phi: o.phi - 12 * f, h: H_EPI }, { ell: Math.min(0.5, o.ell + reach), phi: o.phi - 16 * f, h: H_EPI }]),
          tort: { index: ti * 1.1, straightStartMm: 3 },
          step: STEP_MAIN,
        };
      };
      // variants when the course would touch a placed vessel (usually the terminal PLV or the next branch): a narrower,
      // wider, no or a backward fan (a proximal branch otherwise runs under the next one's origin)
      // the terminal PLV is always kept; a further branch that cannot run PL_MIN_MM clear of the crowd beyond the crux is
      // left out (its territory goes to small branches) rather than drawn as a stub
      const gv = k === 0 ? b.addClear([1, 0.4, 1.6, 0, -0.6].map((f) => pl(i0, f))) : b.addClearOrDrop([1, 0.4, 1.6, 0, -0.6].flatMap((f) => origins.map((oi) => pl(oi, f))), 10, PL_MIN_MM);
      if (gv) b.claim(rca, gv.parent!.index);
    }
  }

  // ======================= left coronary system =======================
  // the left main runs leftwards between the left atrial appendage and the pulmonary trunk (model direction)
  const sep = g.lm.separateOstia;
  const B = lmBifurcation(model, g);
  if (!sep) {
    // a left main from the right sinus runs forwards between the aorta and the pulmonary trunk to its usual bifurcation
    const lmCourse = has("anomalous-lm-right-sinus") && model.usual ? interarterialLm(model, B) : fixedPath(model.lm.pos, B, 0.5);
    b.add({
      name: "LM",
      fillId: "LM",
      lesionId: "LM",
      side: "left",
      kind: "main",
      territory: "lv",
      dense: [...lmCourse, { ell: -1, phi: 0, h: 0, fixed: B, w: 0 }],
      tort: { index: 0 },
      step: STEP_MAIN,
    });
  }
  // proximal tangents: the LM bifurcation angle (genome) split about the bisector of the two entry directions
  const uLad = aivEntry(H, B, 1.5, 9);
  const ladEntry: Sample = { ell: 2 * uLad - 1, phi: ladPhi(H, uLad), h: H_GROOVE, w: 1 };
  const anomLcx = has("anomalous-lcx-right-sinus");
  // the circumflex from the proximal RCA (retroaortic): its origin on the RCA, before the RCA joins the groove
  const lcxFromRca = !anomLcx && has("anomalous-lcx-from-rca");
  const lcxRcaIndex = lcxFromRca ? b.pick(rca, LCX_FROM_RCA_MM / rca.lenMm[rca.lenMm.length - 1]) : -1;
  const lcxStart = lcxFromRca ? restOf(H, rca.samples[lcxRcaIndex]) : (sep || anomLcx) && model.leftOstium2 ? model.leftOstium2.pos : B;
  // left AV groove under the appendage, at or below the bifurcation height (no climb)
  const lcxPhi = 50 + 8 * b.rng("LCxEntry").next();
  let lcxEll = AVE + 0.004;
  while (lcxEll < -0.8 && restPoint(H, lcxEll, lcxPhi, H_GROOVE).y > B.y - 1) lcxEll += 0.01;
  const lcxEntry: Sample = { ell: lcxEll, phi: lcxPhi, h: H_GROOVE, w: 1 };
  const eL = nrm(sub(restOf(H, ladEntry), B));
  const eC = nrm(sub(restOf(H, lcxEntry), lcxStart));
  let tLad = eL,
    tLcx = eC;
  if (!sep && !anomLcx && !lcxFromRca) {
    // open (or close) the angle between the two take-offs towards the genome's LM bifurcation angle,
    // at most 30° away from the straight line to each groove entry, so the proximal course cannot loop
    const a0 = Math.acos(clamp(dot(eL, eC), -1, 1));
    const delta = clamp((g.lm.bifAngleDeg * D2R - a0) / 2, -30 * D2R, 30 * D2R);
    const n = nrm(cross(eC, eL)); // rotating eL about n by +delta moves it away from eC
    const rot = (p: Vec3, ax: Vec3, a: number) => add(add(sc(p, Math.cos(a)), sc(cross(ax, p), Math.sin(a))), sc(ax, dot(ax, p) * (1 - Math.cos(a))));
    if (Number.isFinite(n.x)) {
      tLad = rot(eL, n, delta);
      tLcx = rot(eC, n, -delta);
    }
  }
  // ---- LAD ----
  {
    const r = b.rng("LAD");
    const nodes: Node[] = [ladEntry];
    const uApexRv = rvApexU(H);
    const nSeg = 5;
    for (let k = 1; k <= nSeg; k++) {
      const u = lerp(uLad, Math.min(0.86, uApexRv - 0.02), k / nSeg);
      nodes.push({ ell: 2 * u - 1, phi: ladPhi(H, u), h: H_GROOVE - 0.2 * k });
    }
    const last = nodes[nodes.length - 1];
    if (g.wrapAround) {
      // over the apex close to its tip (the short way), then a short distance up the inferior wall
      const wrapEnd = 0.95 - 0.07 * r.next();
      const f = last.phi;
      let back = grooveAt(H, "piv", 0.9) + 4;
      while (back - f > 270) back -= 360;
      while (back - f < 90) back += 360;
      nodes.push(
        { ell: 0.9, phi: f + 4, h: 2 },
        { ell: 0.975, phi: f + 6, h: 1.5 },
        { ell: 0.997, phi: f + 10, h: 1.2 },
        { ell: 0.997, phi: f + 170, h: 1.2 },
        { ell: 0.975, phi: f + 178, h: 1.5 },
        { ell: 2 * wrapEnd - 1, phi: Math.min(back, f + 205), h: H_EPI }
      );
    } else {
      const endE = 0.8 + 0.17 * r.next();
      nodes.push({ ell: (last.ell + endE) / 2, phi: last.phi + 8, h: H_EPI }, { ell: endE, phi: last.phi + 18, h: H_EPI });
    }
    const ladSurf = surfacePath(nodes);
    const bridge = bridgePath(H, B, tLad, ladEntry, startTangent(H, ladSurf), { c0: 0.3, c1: 0.35 });
    const dense = [...bridge, ...ladSurf];
    let bridgeSpec: Spec["bridge"];
    if (g.bridge && g.bridge.vessel === "LAD") {
      const L = arcLengths(H, dense);
      const tot = L[L.length - 1];
      bridgeSpec = { fromMm: g.bridge.startFrac * tot, toMm: g.bridge.startFrac * tot + g.bridge.lengthMm, depth: g.bridge.depth };
    }
    b.add({
      name: "LAD",
      fillId: "LAD",
      lesionId: "LAD",
      side: "left",
      kind: "main",
      territory: "lv",
      parent: sep ? undefined : { name: "LM", index: b.byName.get("LM")!.samples.length - 1 },
      dense,
      tort: { index: ti, corkscrew: g.tortuosity.corkscrew, straightStartMm: 8, lowOctave: 1, courseDeg: LAD_COURSE_DEG, courseHeight: LAD_COURSE_HEIGHT, hMax: LAD_H_MAX, softRange: LAD_SOFT, liftMm: LAD_FAT_LIFT },
      step: STEP_MAIN,
      bridge: bridgeSpec,
    });
  }
  const lad = b.byName.get("LAD")!;
  // ---- LCx ----
  {
    const r = b.rng("LCx");
    const end = left ? crux : co ? crux - 6 : 105 + 10 * g.marginals + 8 * r.next();
    const nodes: Node[] = [lcxEntry];
    const n = 4;
    for (let k = 1; k <= n; k++) nodes.push({ ell: lerp(lcxEll, AVE + 0.014, k / n), phi: lerp(lcxEntry.phi, end, k / n), h: H_GROOVE });
    const lcxSurf = surfacePath(nodes);
    const t1 = startTangent(H, lcxSurf);
    let bridge: Sample[];
    if ((anomLcx && model.leftOstium2) || lcxFromRca) {
      // retroaortic course from the right sinus or the proximal RCA: behind the root, then into the left AV groove
      bridge = bridgePath(H, lcxStart, nrm(v3(0.2, -0.15, -1)), lcxEntry, t1, { c0: 0.6, c1: 0.5 });
    } else bridge = bridgePath(H, lcxStart, tLcx, lcxEntry, t1, { c0: 0.3, c1: 0.35 });
    b.add({
      name: "LCx",
      fillId: "LCx",
      lesionId: "LCx",
      // from the right sinus or the RCA it opacifies with a right-sided (sinus or RCA) injection
      side: anomLcx || lcxFromRca ? "right" : "left",
      kind: "main",
      territory: "lv",
      parent: lcxFromRca ? { name: "RCA", index: lcxRcaIndex } : sep || anomLcx ? undefined : { name: "LM", index: b.byName.get("LM")!.samples.length - 1 },
      dense: [...bridge, ...lcxSurf],
      tort: { index: ti, straightStartMm: 8, lowOctave: 0.6 },
      step: STEP_MAIN,
    });
  }
  const lcx = b.byName.get("LCx")!;
  // ---- ramus intermedius ----
  if (g.ramus && !sep) {
    const r = b.rng("RAMUS");
    const u = 0.07 + 0.03 * r.next();
    const phi0 = 36 + 8 * r.next();
    // variants when the course would touch the circumflex or the LAD: the take-off turned towards the LAD (w: its share of
    // the start tangent) and the groove entry moved round towards it (model parameters)
    const ramus = (dPhi: number, w: number) => () => {
      const entry: Sample = { ell: 2 * u - 1, phi: phi0 + dPhi, h: H_EPI + 0.5, w: 1 };
      const rsurf = surfacePath([entry, { ell: entry.ell + 0.3, phi: entry.phi + 10, h: H_EPI }, { ell: entry.ell + 0.65, phi: entry.phi + 16, h: H_EPI }, { ell: Math.min(0.5, entry.ell + 1.0), phi: entry.phi + 20, h: H_EPI }]);
      const bridge = bridgePath(H, B, nrm(add(sc(tLad, w), sc(tLcx, 1 - w))), entry, startTangent(H, rsurf), { c0: 0.4, c1: 0.4 });
      return {
        name: "RAMUS",
        fillId: "RAMUS" as VesselId,
        lesionId: "RAMUS" as VesselId,
        side: "left" as const,
        kind: "branch" as const,
        territory: "lv" as const,
        parent: { name: "LM", index: b.byName.get("LM")!.samples.length - 1 },
        dense: [...bridge, ...rsurf],
        tort: { index: ti * 1.1, straightStartMm: 5 },
        step: STEP_MAIN,
      };
    };
    b.addClear([ramus(0, 0.5), ramus(-6, 0.6), ramus(-12, 0.65), ramus(-6, 0.75), ramus(-16, 0.75), ramus(6, 0.4)], 30);
  }
  // ---- obtuse marginals ----
  {
    const r = b.rng("OM");
    const n = g.marginals;
    const lcxLen = lcx.lenMm[lcx.lenMm.length - 1];
    // the first marginal leaves the proximal circumflex, the others spread along it
    let frac = clamp(0.22 + 0.12 * r.next(), 0.15, 0.45);
    const lastFrac = left || co ? 0.62 : 0.86;
    for (let k = 0; k < n; k++) {
      const iPick = b.peek(lcx, frac, 4);
      const origins = b.originsNear(lcx, iPick, [0, 5, -4], 1, lcx.samples.length - 3, 4);
      const reach = (1.35 - 0.12 * k) * (0.8 + 0.3 * r.next());
      // the marginals fan out over the lateral and inferolateral wall (spread: model parameter)
      const fan0 = 16 + 10 * r.next();
      // variants when the course would touch a placed vessel: a narrower, then a wider fan, then a shorter reach
      const om = (fan: number, rch: number, i: number): Spec => {
        const o = b.origin(lcx, i);
        const dense = surfacePath([o, { ell: o.ell + rch * 0.2, phi: o.phi + fan * 0.3, h: H_EPI }, { ell: o.ell + rch * 0.55, phi: o.phi + fan * 0.65, h: H_EPI }, { ell: Math.min(0.75, o.ell + rch), phi: o.phi + fan, h: H_EPI }]);
        let bridgeSpec: Spec["bridge"];
        if (k === 0 && g.bridge && g.bridge.vessel === "OM1") {
          const L = arcLengths(H, dense);
          bridgeSpec = { fromMm: g.bridge.startFrac * L[L.length - 1], toMm: g.bridge.startFrac * L[L.length - 1] + g.bridge.lengthMm * 0.8, depth: g.bridge.depth };
        }
        return {
          name: `OM${k + 1}`,
          fillId: k === 0 ? "OM1" : k === 1 ? "OM2" : "LCx",
          lesionId: k === 0 ? "OM1" : k === 1 ? "OM2" : null,
          side: "left",
          kind: "branch",
          territory: "lv",
          parent: { name: "LCx", index: i },
          dense,
          tort: { index: ti * 1.1, straightStartMm: 4 },
          step: STEP_MAIN,
          bridge: bridgeSpec,
        };
      };
      const gv = b.addClear(([[1, 1], [0.5, 1], [1.5, 1], [1, 0.8]] as const).flatMap(([f, m]) => origins.map((i) => () => om(fan0 * f, reach * m, i))), 25);
      b.claim(lcx, gv.parent!.index);
      if (k < n - 1) frac += (lastFrac - frac) / (n - 1 - k) * (0.85 + 0.25 * r.next());
      void lcxLen;
    }
  }
  // ---- left-dominant / codominant posterior circulation ----
  if (left || co) {
    const r = b.rng("LPL");
    const i = b.pick(lcx, left ? 0.8 : 0.86);
    const o = b.origin(lcx, i);
    const rch = 0.75 + 0.2 * r.next();
    b.addClear(
      [1, 0.3, 1.8].map((f) => () => ({
        name: "PLV",
        fillId: "PLV" as VesselId,
        lesionId: "PLV" as VesselId,
        side: "left" as const,
        kind: "branch" as const,
        territory: "lv" as const,
        parent: { name: "LCx", index: i },
        dense: surfacePath([o, { ell: o.ell + 0.15, phi: o.phi - 3 * f, h: H_EPI }, { ell: o.ell + 0.45, phi: o.phi - 7 * f, h: H_EPI }, { ell: Math.min(0.4, o.ell + rch), phi: o.phi - 10 * f, h: H_EPI }]),
        tort: { index: ti * 1.1, straightStartMm: 3 },
        step: STEP_MAIN,
      })),
      25
    );
  }
  if (left) {
    const o = b.origin(lcx, b.claim(lcx, lcx.samples.length - 1));
    b.addClear(
      PDA_VARIANTS.map((pv) => () => ({
        name: "PDA",
        fillId: "PDA" as VesselId,
        lesionId: "PDA" as VesselId,
        side: "left" as const,
        kind: "branch" as const,
        territory: "lv" as const,
        parent: { name: "LCx", index: lcx.samples.length - 1 },
        dense: surfacePath(pivPath(o, pdaEndU(), o.phi, pv)),
        tort: { index: ti * 1.1, straightStartMm: 3 },
        step: STEP_MAIN,
      })),
      30
    );
    crossing(lcx, "left");
  }
  // ---- sinoatrial nodal artery from the circumflex (or the left main) ----
  if (g.saNodal === "LCx" || g.saNodal === "both" || g.saNodal === "LM") {
    const i = b.pick(lcx, g.saNodal === "LM" ? 0.03 : 0.12);
    const o = b.origin(lcx, i);
    b.add({
      name: g.saNodal === "both" ? "SAN2" : "SAN",
      fillId: "LCx",
      lesionId: null,
      side: "left",
      kind: "branch",
      territory: "atrial",
      parent: { name: "LCx", index: i },
      // round the roof of the left atrium towards the SVC-right atrial junction (course and length are model
      // parameters; it is longer than the RCA-origin artery because it has to cross the atrial roof)
      dense: surfacePath([o, { ell: -1.08, phi: o.phi + 25, h: 2.5 }, { ell: -1.2, phi: o.phi + 60, h: 2.5 }, { ell: -1.3, phi: o.phi + 95, h: 2.5 }]),
      tort: { index: ti * 1.2, straightStartMm: 3 },
      step: STEP_MAIN,
    });
  }
  // diagonals and septals last: the diagonals keep clear of the marginals and the ramus already placed (they supply the
  // anterolateral wall, the marginals the lateral wall)
  // ---- diagonals ----
  /** a diagonal variant with spread x f reaches (1 + DIAG_REACH_KEEP x (1 - f)) as far towards the apex: model parameter */
  const DIAG_REACH_KEEP = 0.4;
  {
    const r = b.rng("D");
    const n = g.diagonals;
    let frac = 0.1 + 0.12 * r.next();
    for (let k = 0; k < n; k++) {
      const iPick = b.peek(lad, frac, 4);
      const origins = b.originsNear(lad, iPick, [0, 5, -4, 10], 1, lad.samples.length - 3, 4);
      const reach = (0.8 - 0.1 * k) * (0.8 + 0.4 * r.next());
      const spread0 = 55 + 25 * r.next();
      const name = `D${k + 1}`;
      // variants when the course would touch a placed vessel (a marginal, the ramus, an earlier diagonal): a narrower
      // spread with a shorter reach, so the diagonal stays on the anterolateral wall
      const dg = (spread: number, rch: number, i: number): Spec => {
        const o = b.origin(lad, i);
        const dense = surfacePath([
          o,
          { ell: o.ell + rch * 0.15, phi: o.phi + spread * 0.38, h: H_EPI },
          { ell: o.ell + rch * 0.45, phi: o.phi + spread * 0.75, h: H_EPI },
          { ell: Math.min(0.93, o.ell + rch), phi: o.phi + spread, h: H_EPI },
        ]);
        let bridgeSpec: Spec["bridge"];
        if (k === 0 && g.bridge && g.bridge.vessel === "D1") {
          const L = arcLengths(H, dense);
          bridgeSpec = { fromMm: g.bridge.startFrac * L[L.length - 1], toMm: g.bridge.startFrac * L[L.length - 1] + g.bridge.lengthMm * 0.8, depth: g.bridge.depth };
        }
        return {
          name,
          fillId: k === 0 ? "D1" : k === 1 ? "D2" : "LAD",
          lesionId: k === 0 ? "D1" : k === 1 ? "D2" : null,
          side: "left",
          kind: "branch",
          territory: "lv",
          parent: { name: "LAD", index: i },
          dense,
          tort: { index: ti * 1.1, straightStartMm: 4 },
          step: STEP_MAIN,
          bridge: bridgeSpec,
        };
      };
      // a narrower spread runs further towards the apex (DIAG_REACH_KEEP), so the diagonal keeps its length
      const gv = b.addClear(
        [...[1, 0.8, 0.65, 0.5, 0.38].map((f) => [f, 1 + DIAG_REACH_KEEP * (1 - f)] as const), [1.25, 1] as const, [0.5, 0.75] as const].flatMap(([f, m]) => origins.map((i) => () => dg(spread0 * f, reach * m, i))),
        25
      );
      b.claim(lad, gv.parent!.index);
      frac += (0.62 - frac) / Math.max(1, n - k) * (0.8 + 0.4 * r.next());
    }
  }
  // ---- septal perforators (into the septum, below the epicardium) ----
  {
    const r = b.rng("S");
    const n = g.septals;
    let frac = 0.05 + 0.06 * r.next();
    // spread over the proximal two-thirds of the LAD (the septum it supplies); the first septal is the largest and
    // longest ("more pronounced", Kesieme 2024), later ones shorter (lengths and spacing: model parameters)
    const span = 0.62 / n;
    let sn = 0;
    for (let k = 0; k < n; k++) {
      const i = b.pick(lad, frac, 3.5);
      const o = b.origin(lad, i);
      const depth = (k === 0 ? 55 : 46 - (24 * k) / n) * (0.8 + 0.4 * r.next());
      const de = (k === 0 ? 0.3 : 0.25) - (0.08 * k) / n;
      // variants when the septal would run through the previous one (closely spaced late septals): a course turned
      // further into or out of the septum (fan factor f on the phi turn); one that cannot run 12 mm clear is left out
      const septal = (f: number) => (): Spec => ({
        name: `S${sn + 1}`,
        fillId: "SEPTAL",
        lesionId: sn === 0 ? "SEPTAL" : null,
        side: "left",
        kind: "branch",
        territory: "septal",
        parent: { name: "LAD", index: i },
        dense: surfacePath([o, { ell: o.ell + de * 0.25, phi: o.phi - 5 * f, h: o.h - 0.3 * depth }, { ell: o.ell + de * 0.6, phi: o.phi - 9 * f, h: o.h - 0.7 * depth }, { ell: o.ell + de, phi: o.phi - 12 * f, h: o.h - depth }]),
        tort: { index: ti * 0.9, straightStartMm: 3, hMin: -40 },
        step: STEP_MAIN,
      });
      // the first septal is always drawn (the "more pronounced" first septal)
      const gv = sn === 0 ? b.add(septal(1)()) : b.addClearOrDrop([1, 1.5, 0.5, 2].map(septal), 10, 12);
      if (gv) sn++;
      frac += span * (0.75 + 0.5 * r.next());
      if (frac > 0.7) break;
    }
  }
  // coronary-to-pulmonary-artery fistula (fistula-lad-pa): grown last, so every other vessel is placed as without it
  if (g.fistula) {
    const i = b.pick(lad, g.fistula.atFrac);
    const o = b.origin(lad, i);
    const p0 = restOf(H, lad.samples[i]);
    const drain = fistulaDrain(model);
    // grown from the drain on the pulmonary trunk (fixed with the root) to the LAD, then reversed: it leaves the LAD on
    // the heart surface and ends fixed on the trunk
    const back = bridgePath(H, drain, nrm(sub(p0, drain)), o, nrm(sub(p0, drain)), { c0: 0.35, c1: 0.45 }).reverse();
    b.add({
      name: FISTULA_VESSEL,
      fillId: "LAD",
      lesionId: null,
      side: "left",
      kind: "branch",
      // not myocardial supply: kept out of the coverage field and the small-branch growth (as the nodal arteries)
      territory: "atrial",
      parent: { name: "LAD", index: i },
      dense: [o, ...back],
      tort: { index: ti * FISTULA_TORTUOSITY, straightStartMm: 3 },
      step: STEP_MAIN,
    });
  }
}

// ---------------------------------------------------------------------------
// small-branch growth (space colonisation on the coverage field)
// ---------------------------------------------------------------------------

interface GrowParams {
  spacing: [number, number];
  gap: number;
  lMin: number;
  lMax: number;
  stop: number;
  angle: number[];
  hostMinLen: number;
  /** steering towards the apex per mm (territories drain apically) */
  apical: number;
}

const GEN: GrowParams[] = [
  // model parameters, tuned so that mid-tree transect crossings and opacified area approach the library values
  { spacing: [4, 8], gap: 4.6, lMin: 18, lMax: 90, stop: 2.2, angle: [25, 40, 55], hostMinLen: 15, apical: 0.15 },
  { spacing: [5, 9], gap: 4.2, lMin: 10, lMax: 45, stop: 2.2, angle: [30, 45, 65], hostMinLen: 14, apical: 0.12 },
  { spacing: [4, 7], gap: 3.8, lMin: 6, lMax: 22, stop: 2.2, angle: [40, 60, 80], hostMinLen: 12, apical: 0.1 },
];

function growTwigs(b: Builder, grid: Grid): number {
  const H = b.H;
  let count = 0;
  const twigCount = new Map<string, number>();
  for (let gen = 0; gen < GEN.length; gen++) {
    const P = GEN[gen];
    const rng = b.rng(`twigs${gen}`);
    const hosts = b.vessels.filter((v) =>
      gen === 0 ? v.kind !== "twig" && v.territory !== "septal" && v.territory !== "atrial" && v.name !== "LM" : v.kind === "twig" && v.generation === gen && v.lenMm[v.lenMm.length - 1] >= P.hostMinLen
    );
    // candidates along every host, both sides
    type Cand = { host: GrownVessel; i: number; side: number };
    const cands: Cand[] = [];
    for (const host of hosts) {
      const total = host.lenMm[host.lenMm.length - 1];
      // trunks give fewer small branches than the named branches (their territory goes to diagonals and marginals)
      const trunkF = host.kind === "main" ? 1.2 : 1;
      let s = 5 + rng.next() * P.spacing[1] * trunkF;
      while (s < total - 4) {
        const i = host.lenMm.findIndex((x) => x >= s);
        // the apical third is the LAD's own territory (small apical twigs only from the later generations)
        const apicalLad = host.name === "LAD" && host.samples[i].ell > 0.6;
        if (i > 0 && !apicalLad && host.samples[i].w >= 1 && host.samples[i].h > -2 && (host.samples[i].ell + 1) / 2 < 0.985) {
          cands.push({ host, i, side: rng.next() < 0.5 ? -1 : 1 });
        }
        s += (P.spacing[0] + rng.next() * (P.spacing[1] - P.spacing[0])) * trunkF;
      }
    }
    // random order so no host is favoured
    for (let k = cands.length - 1; k > 0; k--) {
      const j = Math.floor(rng.next() * (k + 1));
      [cands[k], cands[j]] = [cands[j], cands[k]];
    }
    for (const c of cands) {
      const host = c.host;
      const hostVi = b.vessels.indexOf(host);
      const s0 = host.samples[c.i];
      const p0 = restOf(H, s0);
      // the origin must lie clear of every vessel but the host (no twig starting inside its grandparent's lumen, or on
      // top of a sibling's origin)
      const rT0 = gen === 0 ? 0.6 : gen === 1 ? 0.45 : 0.35;
      {
        let blocked = false;
        b.occ.near(p0, rT0 + b.occ.maxR + CLEAR_MARGIN + 1, (w, k) => {
          if (w === hostVi) return;
          const s = b.occ.segDist(w, k, p0);
          if (s.d < rT0 + s.r + CLEAR_MARGIN) {
            blocked = true;
            return true;
          }
        });
        if (blocked) continue;
      }
      const rHost = b.occ.rad[hostVi]?.[c.i] ?? 1;
      const hostWin = Math.ceil((2 * rHost + 3) / Math.max(0.8, host.lenMm[1] - host.lenMm[0] || 1)) + 1;
      /** a step to p keeps clear of everything placed (the host only near the origin); extra room for the tortuosity to come */
      const clearAt = (p: Vec3, rT: number): boolean => {
        let ok = true;
        b.occ.near(p, rT + b.occ.maxR + CLEAR_MARGIN + TWIG_TORT_ROOM + 1, (w, k) => {
          if (w === hostVi && Math.abs(k - c.i) <= hostWin) return;
          const s = b.occ.segDist(w, k, p);
          if (s.d < rT + s.r + CLEAR_MARGIN + TWIG_TORT_ROOM) {
            ok = false;
            return true;
          }
        });
        return ok;
      };
      const pa = restOf(H, host.samples[Math.max(0, c.i - 1)]),
        pb = restOf(H, host.samples[Math.min(host.samples.length - 1, c.i + 1)]);
      const T = nrm(sub(pb, pa));
      const J = jacobian(H, s0);
      const N = nrm(cross(J[1], J[0]));
      const Bv = nrm(cross(T, N));
      // try both sides, a few take-off angles; score by the coverage gap a few mm out
      let best: { dir: Vec3; score: number } | null = null;
      for (const side of [c.side, -c.side]) {
        for (const a of P.angle) {
          const dir = nrm(add(sc(T, Math.cos(a * D2R)), sc(Bv, side * Math.sin(a * D2R))));
          let score = Infinity;
          for (const d of [5, 9, 14]) {
            const q = toSurface(H, add(p0, sc(dir, d)));
            score = Math.min(score, gridD(H, grid, q.ell, q.phi));
          }
          // prefer heading towards the apex (territories drain apically), mildly
          score += 1.2 * dot(dir, H.L);
          if (!best || score > best.score) best = { dir, score };
        }
      }
      if (!best || best.score < P.gap) continue;
      // grow
      const pts: Sample[] = [{ ell: s0.ell, phi: s0.phi, h: s0.h, w: 1 }];
      let p = p0;
      let dir = best.dir;
      let grown = 0;
      const lCap = Math.min(P.lMax, P.lMin + best.score * 3.2) * (0.8 + 0.4 * rng.next());
      let steps = 0;
      while (grown < lCap && steps++ < 2 * lCap) {
        const q = toSurface(H, add(p, dir));
        const u = (q.ell + 1) / 2;
        if (u > 0.985 || u < 0.01) break;
        const prev = pts[pts.length - 1];
        let phi = q.phi;
        while (phi - prev.phi > 180) phi -= 360;
        while (phi - prev.phi < -180) phi += 360;
        const hNext = lerp(prev.h, H_EPI, 0.25);
        const sm: Sample = { ell: q.ell, phi, h: hNext, w: 1 };
        const np = restOf(H, sm);
        const dHere = gridD(H, grid, sm.ell, sm.phi);
        if (grown > 5 && dHere < P.stop) break;
        // exact clearance from every placed lumen (the coverage grid is only 2 mm coarse): stop before touching one
        if (!clearAt(np, lerp(rT0, 0.18, Math.min(1, grown / Math.max(10, lCap))))) break;
        // steer towards the larger gap (finite difference across the path) and gently apically
        const Jq = jacobian(H, sm);
        const Nq = nrm(cross(Jq[1], Jq[0]));
        const lat = nrm(cross(dir, Nq));
        const qa = toSurface(H, add(np, sc(lat, 3))),
          qb = toSurface(H, add(np, sc(lat, -3)));
        const grad = (gridD(H, grid, qa.ell, qa.phi) - gridD(H, grid, qb.ell, qb.phi)) / 6;
        const apical = sub(H.L, sc(Nq, dot(H.L, Nq)));
        dir = nrm(add(add(dir, sc(lat, clamp(grad, -0.6, 0.6) * 0.5)), sc(nrm(apical), P.apical)));
        dir = nrm(sub(dir, sc(Nq, dot(dir, Nq))));
        const adv = dist(np, p);
        if (adv < 0.4) break; // no progress on the surface (stepping off it): stop
        pts.push(sm);
        grown += adv;
        p = np;
      }
      if (grown < P.lMin * 0.6 || pts.length < 4) continue;
      const k = twigCount.get(host.name) ?? 0;
      const gv = b.make({
        name: `${host.name}-twig${k}`,
        fillId: host.fillId,
        lesionId: null,
        side: host.side,
        kind: "twig",
        territory: host.territory === "rv" || rvWeight(H, (pts[pts.length - 1].ell + 1) / 2, pts[pts.length - 1].phi) > 0.5 ? "rv" : "lv",
        parent: { name: host.name, index: c.i },
        dense: densify(pts),
        tort: { index: b.g.tortuosity.index * 1.2, straightStartMm: 2, highOctave: 1.1 },
        step: STEP_TWIG,
      });
      gv.generation = gen + 1;
      // the final course (with its tortuosity) must keep clear too: cut it before the first conflict
      const at = b.firstConflict(gv, { host: hostVi, hostIndex: c.i, hostWin, from: 1 });
      if (at >= 0) b.truncate(gv, at - 2);
      if (gv.samples.length < 4 || gv.lenMm[gv.lenMm.length - 1] < P.lMin * 0.6) continue;
      twigCount.set(host.name, k + 1);
      b.register(gv);
      for (let i = 0; i < gv.samples.length; i++) gridInsert(H, grid, restOf(H, gv.samples[i]), gv.samples[i], b.vessels.length - 1, i, 18, OWN_PENALTY.twig);
      count++;
    }
  }
  return count;
}

/** Densify a coarse 1 mm path to ~0.5 mm (linear in surface coordinates). */
function densify(pts: Sample[]): Sample[] {
  const out: Sample[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    out.push(pts[i], lerpSample(pts[i], pts[i + 1], 0.5));
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// ---------------------------------------------------------------------------
// calibres: territory flows and the Huo-Kassab law
// ---------------------------------------------------------------------------

/** share of a cited-floor flow deficit given to the floored branch's own small branches (model parameter) */
const FLOOR_TO_BRANCHES = 0.6;
/** share of the territory-driven (log) deviation from the Dodge mean kept for the RCA and circumflex systems: model parameter */
const SYSTEM_KEEP = 0.3;
/** Huo-Kassab flow-diameter exponent: D ∝ Q^(3/7) (Gong et al. 2016). */
export const HK_EXPONENT = 3 / 7;
/** Dodge et al. 1992 (doi:10.1161/01.cir.86.1.232): proximal LAD 3.7 mm / left main 4.5 mm */
export const DODGE_LAD_TO_LM = 3.7 / 4.5;

function assignCalibres(b: Builder, grid: Grid): void {
  const H = b.H;
  const V = b.vessels;
  const idx = new Map(V.map((v, i) => [v.name, i]));
  // own territory weight per sample
  const own: Float64Array[] = V.map((v) => new Float64Array(v.samples.length));
  for (let c = 0; c < grid.owner.length; c++) {
    const vi = grid.owner[c];
    if (vi < 0) continue;
    const w = grid.area[c] * (grid.rv[c] > 0.5 ? RV_WEIGHT : 1);
    own[vi][grid.ownerS[c]] += w;
  }
  // surface territory alone (before the septal, nodal and tip additions), for sharing floor deficits
  const ownSurf = own.map((a) => Float64Array.from(a));
  V.forEach((v, vi) => {
    if (v.territory === "septal" || v.territory === "atrial") {
      const k = v.territory === "septal" ? SEPTAL_W * septalWeight(v.name) : ATRIAL_W;
      for (let i = 1; i < v.samples.length; i++) own[vi][i] += k * (v.lenMm[i] - v.lenMm[i - 1]);
    }
    // terminal samples own at least a sliver so tips keep a minimum calibre
    own[vi][v.samples.length - 1] += TIP_TERRITORY;
  });
  // accumulate flows from the leaves (children always come after their parents)
  const childAt: Map<number, { vi: number; at: number }[]> = new Map();
  V.forEach((v, vi) => {
    if (!v.parent) return;
    const pi = idx.get(v.parent.name);
    if (pi === undefined) return;
    const arr = childAt.get(pi) ?? [];
    arr.push({ vi, at: v.parent.index });
    childAt.set(pi, arr);
  });
  const accumulate = (): Float64Array[] => {
    const Q: Float64Array[] = V.map((v) => new Float64Array(v.samples.length));
    for (let vi = V.length - 1; vi >= 0; vi--) {
      const v = V[vi];
      const n = v.samples.length;
      const inflow = new Float64Array(n);
      for (const ch of childAt.get(vi) ?? []) inflow[Math.min(n - 1, ch.at)] += Q[ch.vi][0];
      let acc = 0;
      for (let i = n - 1; i >= 0; i--) {
        acc += own[vi][i] + inflow[i];
        Q[vi][i] = acc;
      }
    }
    return Q;
  };
  // arterial system of each vessel: the root of its parent chain. Calibre scaling is per system, so an anomalous
  // circumflex from the right sinus keeps the left-system scale even though it is injected from the right.
  const rootName = (v: GrownVessel): string => {
    let r = v;
    for (let k = 0; k < 16 && r.parent; k++) r = V[idx.get(r.parent.name) ?? -1] ?? r;
    return r.name;
  };
  // the circumflex system keeps its own (Dodge circumflex) scale even when it arises from the proximal RCA
  const underLcx = (v: GrownVessel): boolean => {
    let r: GrownVessel | undefined = v;
    for (let k = 0; k < 16 && r; k++) {
      if (r.name === "LCx") return true;
      r = r.parent ? V[idx.get(r.parent.name) ?? -1] : undefined;
    }
    return false;
  };
  const rightSystem = V.map((v) => {
    const r = rootName(v);
    return (r === "RCA" || r === "CONUS") && !(r === "RCA" && underLcx(v));
  });
  const sampleAt = (v: GrownVessel) => Math.max(0, v.samples.findIndex((s) => s.w >= 0.5));
  const lm = idx.get("LM");
  const iLad = idx.get("LAD")!;
  const iRca = idx.get("RCA");
  // flow constant: the proximal LAD to the genome's left main diameter times the Dodge 1992 ratio of proximal
  // LAD to left main (3.7 / 4.5 mm). Normal left mains are a little smaller than the flow law applied to their
  // two daughters predicts (Dodge: 4.5 vs 3.7 + 3.4 mm), so the LM itself keeps the genome value.
  const leftK = (Q: Float64Array[]) => (b.g.lm.diameterMm * DODGE_LAD_TO_LM) / Math.pow(Math.max(1e-6, Q[iLad][sampleAt(V[iLad])]), HK_EXPONENT);
  // named side branches with a cited near-ostial diameter (Divia Paul 2018, relative to the left main): when the
  // surface territory near the base gives them less, they get the missing flow spread along their length (they
  // drain the wall beyond the coverage grid's nearest-vessel split), which also feeds their parent upstream
  const floors: { vi: number; d: number }[] = [];
  const bd = b.g.branchDiameterMm;
  if (bd) {
    for (const [name, d] of [["D1", bd.d1], ["OM1", bd.om1], ["RAMUS", bd.ramus]] as const) {
      const vi = idx.get(name);
      if (vi !== undefined) floors.push({ vi, d });
    }
  }
  // the first diagonal and first marginal are not smaller than ρ x the largest later branch of their series, with ρ
  // drawn per patient from U(0.8, 1.1) (model parameter: the first branch of a series is the larger one in most
  // patients, not all; the surface territory near the base alone makes it systematically the smaller)
  const rs = b.rng("seriesRatio");
  const series: Record<string, { rho: number; later: RegExp }> = {
    D1: { rho: 0.8 + 0.3 * rs.next(), later: /^D[2-9]$/ },
    OM1: { rho: 0.8 + 0.3 * rs.next(), later: /^OM[2-9]$/ },
  };
  // circumflex system: the LCx and everything downstream of it (an anomalous LCx keeps this system)
  const inLcx = V.map((v) => {
    let r: GrownVessel | undefined = v;
    for (let k = 0; k < 16 && r; k++) {
      if (r.name === "LCx") return true;
      r = r.parent ? V[idx.get(r.parent.name) ?? -1] : undefined;
    }
    return false;
  });
  const iLcx = idx.get("LCx");
  const calib = b.g.lm.diameterMm / 4.5;
  /**
   * Scale of a system whose trunk takes the left flow constant: its trunk is kept near the Dodge 1992 mean for the
   * dominance (SYSTEM_KEEP of the territory-driven log deviation is kept, then clamped at ±1.5 SD; scaled like the left
   * main for sex and LVH), and the whole system is rescaled with it. Model choice: the surface territories alone
   * over- or under-size the RCA and circumflex against the LAD, which carries the left-main scale.
   */
  const systemScale = (Q: Float64Array[], k: number, vi: number | undefined, mu: number, sd: number) => {
    if (vi === undefined) return 1;
    const d = k * Math.pow(Math.max(1e-6, Q[vi][sampleAt(V[vi])]), HK_EXPONENT);
    const dMean = mu * calib;
    const shrunk = dMean * Math.pow(d / dMean, SYSTEM_KEEP);
    return Math.min((mu + 1.5 * sd) * calib, Math.max((mu - 1.5 * sd) * calib, shrunk)) / d;
  };
  // Dodge 1992: RCA proximal 3.9 ± 0.6 (right, also used for codominant) / 2.8 ± 0.5 mm (left dominant); LCx
  // proximal 3.4 ± 0.5 (right) / 4.2 ± 0.6 mm (left dominant)
  const [rMu, rSd] = b.g.dominance === "left" ? [2.8, 0.5] : [3.9, 0.6];
  const [cMu, cSd] = b.g.dominance === "left" ? [4.2, 0.6] : [3.4, 0.5];
  const scales = (Q: Float64Array[]) => {
    const k = leftK(Q);
    return { k, right: systemScale(Q, k, iRca, rMu, rSd), lcx: systemScale(Q, k, iLcx, cMu, cSd) };
  };
  const kOf = (sc: ReturnType<typeof scales>, vi: number) => sc.k * (rightSystem[vi] ? sc.right : inLcx[vi] ? sc.lcx : 1);
  let Q = accumulate();
  for (let it = 0; it < 8 && floors.length; it++) {
    const sc = scales(Q);
    let changed = false;
    for (const f of floors) {
      const v = V[f.vi];
      const kv = kOf(sc, f.vi);
      const at = Math.min(v.samples.length - 1, sampleAt(v) + 2);
      let d = f.d;
      const ser = series[v.name];
      if (ser) {
        for (let vj = 0; vj < V.length; vj++) {
          if (!ser.later.test(V[vj].name)) continue;
          const aj = Math.min(V[vj].samples.length - 1, sampleAt(V[vj]) + 2);
          d = Math.max(d, ser.rho * kOf(sc, vj) * Math.pow(Q[vj][aj], HK_EXPONENT));
        }
      }
      const qWant = Math.pow(d / kv, 1 / HK_EXPONENT);
      const deficit = qWant - Q[f.vi][at];
      if (deficit <= qWant * 0.01) continue;
      // part of it goes to the branch's own small branches, in proportion to the territory they already drain (they
      // carry the branch's flow out into its wall, so they are wider and visible further); the rest is spread along the
      // branch so that flow falls off along it (more drained near the origin), keeping the taper
      const desc: number[] = [];
      const stack = (childAt.get(f.vi) ?? []).map((c) => c.vi);
      while (stack.length) {
        const d = stack.pop()!;
        desc.push(d);
        for (const c of childAt.get(d) ?? []) stack.push(c.vi);
      }
      let dsum = 0;
      for (const d of desc) for (let i = 0; i < own[d].length; i++) dsum += ownSurf[d][i];
      const toDesc = dsum > 0 ? deficit * FLOOR_TO_BRANCHES : 0;
      if (toDesc > 0) for (const d of desc) for (let i = 0; i < own[d].length; i++) own[d][i] += (toDesc * ownSurf[d][i]) / dsum;
      const n = v.samples.length;
      let wsum = 0;
      const w = new Float64Array(n);
      for (let i = at; i < n; i++) wsum += w[i] = 1 - (0.7 * (i - at)) / Math.max(1, n - at);
      for (let i = at; i < n; i++) own[f.vi][i] += ((deficit - toDesc) * w[i]) / wsum;
      changed = true;
    }
    if (!changed) break;
    Q = accumulate();
  }
  const qLeft = lm !== undefined ? Q[lm][0] : (Q[iLad]?.[0] ?? 1) + (Q[idx.get("LCx")!]?.[0] ?? 0);
  const sc = scales(Q);
  V.forEach((v, vi) => {
    v.flow = Array.from(Q[vi]);
    const kk = kOf(sc, vi);
    v.radius = v.flow.map((q) => Math.max(0.1, (kk * Math.pow(q, HK_EXPONENT)) / 2));
  });
  // the left main itself carries the whole left flow along its length
  if (lm !== undefined) {
    const r0 = b.g.lm.diameterMm / 2;
    V[lm].radius = V[lm].radius.map(() => r0);
    V[lm].flow = V[lm].flow.map(() => qLeft);
  }
  // terminal ends taper to a fine tip (0.12 mm radius) over their last 4 mm: the column of contrast thins
  // out rather than stopping abruptly (vessels that continue into a terminal branch are not tapered)
  const continues = new Set(V.filter((v) => v.parent && v.parent.index >= (V[idx.get(v.parent.name)!]?.samples.length ?? 0) - 2).map((v) => v.parent!.name));
  for (const v of V) {
    if (continues.has(v.name) || v.name === "LM") continue;
    const total = v.lenMm[v.lenMm.length - 1];
    for (let i = 0; i < v.radius.length; i++) {
      const w = clamp((total - v.lenMm[i]) / 4, 0, 1);
      if (w < 1) v.radius[i] = Math.min(v.radius[i], 0.12 + (v.radius[i] - 0.12) * w);
    }
  }
  // fixed proximal samples own no territory: carry the first surface value back to the ostium
  for (const v of V) {
    let firstSurf = v.samples.findIndex((s) => s.w >= 0.5);
    if (firstSurf > 0 && v.name !== "LM") for (let i = 0; i < firstSurf; i++) v.radius[i] = Math.max(v.radius[i], v.radius[firstSurf]);
  }
  void H;
}

// ---------------------------------------------------------------------------
// anomalies after the calibres (diag-anatomy-variants)
// ---------------------------------------------------------------------------

/**
 * - An anomalous circumflex (from the right sinus or the proximal RCA) and everything it gives off fill with a
 *   right-sided injection: their fillId is the RCA's, so the lab's fill list for a left injection (the left vessels)
 *   leaves the lateral wall empty and a right injection fills it. lesionId and the SYNTAX labels stay the circumflex
 *   system's, so lesions and segment numbers follow the parent artery.
 * - The fistula takes the genome's lumen radius, widening towards its drainage (FISTULA_WIDENING), in place of the
 *   flow law's (it drains no myocardium).
 */
function anomalyFinish(b: Builder): void {
  const g = b.g;
  const anomLcx = g.variants.includes("anomalous-lcx-right-sinus") || g.variants.includes("anomalous-lcx-from-rca");
  if (anomLcx) {
    const under = (v: GrownVessel): boolean => {
      let r: GrownVessel | undefined = v;
      for (let k = 0; k < 16 && r; k++) {
        if (r.name === "LCx") return true;
        r = r.parent ? b.byName.get(r.parent.name) : undefined;
      }
      return false;
    };
    for (const v of b.vessels) if (under(v)) v.fillId = "RCA";
  }
  const f = b.byName.get(FISTULA_VESSEL);
  if (f && g.fistula) {
    const total = f.lenMm[f.lenMm.length - 1] || 1;
    f.radius = f.lenMm.map((x) => g.fistula!.radiusMm * (1 + (FISTULA_WIDENING - 1) * (x / total)));
  }
}

// ---------------------------------------------------------------------------
// SYNTAX segment labels
// ---------------------------------------------------------------------------

function labelSegments(b: Builder): void {
  const V = b.byName;
  const set = (v: GrownVessel | undefined, label: string | null, from = 0, to = Infinity) => {
    if (!v) return;
    for (let i = Math.max(0, from); i < Math.min(v.samples.length, to); i++) v.segment[i] = label;
  };
  const rca = V.get("RCA");
  if (rca) {
    // 1: ostium to half the distance to the acute margin; 2: to the acute margin; 3: to the PDA origin; then posterolateral (16)
    const am = b.atPhi(rca, -90);
    const half = rca.lenMm.findIndex((x) => x >= rca.lenMm[am] / 2);
    const pda = V.get("PDA");
    const pdaAt = pda && pda.parent?.name === "RCA" ? pda.parent.index : rca.samples.length;
    set(rca, "1", 0, half);
    set(rca, "2", half, am);
    set(rca, "3", am, pdaAt + 1);
    set(rca, "16", pdaAt + 1);
  }
  set(V.get("LM"), "5");
  const lad = V.get("LAD");
  if (lad) {
    const s1 = V.get("S1");
    const d2 = V.get("D2");
    const i6 = s1 ? s1.parent!.index : b.at(lad, 0.15);
    let i7 = d2 ? d2.parent!.index : b.at(lad, 0.55);
    if (i7 <= i6) i7 = Math.max(i6 + 1, b.at(lad, 0.55));
    set(lad, "6", 0, i6 + 1);
    set(lad, "7", i6 + 1, i7 + 1);
    set(lad, "8", i7 + 1);
    for (const [name, v] of V) {
      if (!/^D\d+$/.test(name)) continue;
      const n = +name.slice(1);
      const at = v.parent!.index;
      const label = n === 1 ? "9" : n === 2 ? "10" : at <= i7 ? "9a" : "10a";
      set(v, label);
    }
  }
  const lcx = V.get("LCx");
  if (lcx) {
    // 11: origin to and including the first obtuse marginal; 13 beyond (convention: from OM1 onwards)
    const oms = [...V.values()].filter((v) => /^OM\d+$/.test(v.name)).sort((a, c) => a.parent!.index - c.parent!.index);
    const i11 = oms.length ? oms[0].parent!.index : b.at(lcx, 0.3);
    set(lcx, "11", 0, i11 + 1);
    set(lcx, "13", i11 + 1);
    oms.forEach((v, k) => set(v, k === 0 ? "12a" : "12b"));
  }
  set(V.get("RAMUS"), "12");
  const pda = V.get("PDA");
  // segment numbers follow the parent artery, not the injection side (an anomalous LCx is injected from the right)
  if (pda) set(pda, pda.parent?.name === "RCA" ? "4" : "15");
  const pl = [...V.values()].filter((v) => v.name === "PLV" || /^PL\d+$/.test(v.name));
  for (const v of pl) {
    const right = v.parent?.name === "RCA";
    const n = v.name === "PLV" ? 0 : +v.name.slice(2) - 1;
    set(v, right ? (n === 0 ? "16" : n === 1 ? "16a" : n === 2 ? "16b" : "16c") : n === 0 ? "14" : n === 1 ? "14a" : "14b");
  }
}

// ---------------------------------------------------------------------------
// entry point and cache
// ---------------------------------------------------------------------------

const cache = new Map<string, Topology>();
const CACHE_MAX = 24;

function modelKey(model: AnatomyModel): string {
  const r = (p: Vec3) => [p.x, p.y, p.z].map((x) => Math.round(x * 100) / 100).join(",");
  return [r(model.lm.pos), r(model.lm.dir), r(model.rca.pos), r(model.rca.dir), r(model.conus.pos), r(model.conus.dir), model.leftOstium2 ? r(model.leftOstium2.pos) : "-"].join("|");
}

/** Grow (or fetch from the cache) the topology for a genome on an anatomy model's ostia. */
export function growTopology(model: AnatomyModel, genome: AnatomyGenome): Topology {
  const key = genome.key + "#" + modelKey(model);
  const hit = cache.get(key);
  if (hit) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const hg = genome.heart;
  const axis = { azimuthDeg: hg.azimuthDeg, elevationDeg: hg.elevationDeg, rollDeg: hg.rollDeg };
  const modes = { lvWidth: hg.lvWidth, rvWidth: hg.rvWidth, length: hg.length };
  let H = makeHeart(hg.scale, axis, modes);
  // seat the heart against the root: the top of the anterior interventricular groove must lie at or
  // below the left main bifurcation (else the LAD would climb); shift the heart down when it does not
  {
    const B = lmBifurcation(model, genome);
    const top = restPoint(H, 2 * 0.05 - 1, ladPhi(H, 0.05), H_GROOVE);
    const dy = top.y - (B.y - 1);
    if (dy > 0) H = makeHeart(hg.scale, axis, modes, v3(0, -Math.min(12, dy), 0));
  }
  const b = new Builder(H, genome);
  buildNamed(b, model);
  // coverage field from the named epicardial vessels
  const grid = makeGrid(H);
  b.vessels.forEach((v, vi) => {
    if (v.territory === "septal" || v.territory === "atrial") return;
    v.samples.forEach((s, si) => {
      if (s.w < 1 || s.h < -3) return;
      const lad = v.name === "LAD";
      // the LAD keeps its strip only beyond LAD_OWN_FROM of its length (mid and distal LAD calibre); proximally its
      // wall is drained by its branches
      const ladPen = lad ? (v.lenMm[si] >= LAD_OWN_FROM * v.lenMm[v.lenMm.length - 1] ? LAD_OWN_PENALTY : 0) : 0;
      gridInsert(H, grid, restOf(H, s), s, vi, si, lad ? 30 : 22, lad ? ladPen : OWN_PENALTY[v.kind], lad ? LAD_APEX_PENALTY : 0);
    });
  });
  const twigs = growTwigs(b, grid);
  assignCalibres(b, grid);
  labelSegments(b);
  anomalyFinish(b);
  // order: right system, then left (LM first), small branches after their hosts
  const named = b.vessels.filter((v) => v.kind !== "twig");
  const rightNamed = named.filter((v) => v.side === "right");
  const leftNamed = named.filter((v) => v.side === "left");
  const lmFirst = leftNamed.sort((a, c) => (a.name === "LM" ? -1 : c.name === "LM" ? 1 : 0));
  const twigList = b.vessels.filter((v) => v.kind === "twig");
  const vessels = [...rightNamed, ...lmFirst, ...twigList];
  let samples = 0,
    total = 0;
  for (const v of vessels) {
    samples += v.samples.length;
    total += v.lenMm[v.lenMm.length - 1];
  }
  let covered = 0,
    cells = 0;
  for (let c = 0; c < grid.d.length; c++) {
    cells++;
    if (grid.d[c] < 8) covered++;
  }
  const topo: Topology = {
    key,
    heart: H,
    genome,
    vessels,
    buildMs: (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0,
    stats: { samples, vessels: vessels.length, twigs, totalLengthMm: total, coverage: covered / cells },
    cuts: b.cuts,
  };
  cache.set(key, topo);
  while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value as string);
  return topo;
}

/** Clear the topology cache (tests and memory pressure). */
export function clearTopologyCache(): void {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Bypass grafts (diag-grafts-svg)
//
// A vein or radial graft sewn onto the ascending aorta (anatomy.ts graftSites) runs from its aortic ostium forwards
// along its take-off, curves onto the front of the heart and follows the epicardium, a few millimetres off it, to an
// end-to-side anastomosis on its target vessel, which it meets along the vessel's own direction. The course is a
// fixed (root-carried) segment, a bridge that passes from the root's motion to the heart's, and a surface path, so
// the graft beats with the heart where it lies on it and with the root where it leaves the aorta. The grafts are not
// part of the grown topology (the flow model, the twigs and the cache do not see them); coronaryTree.ts adds them to
// the tree as CoronaryTree.grafts.
// ---------------------------------------------------------------------------


/** Course and calibre of a graft. MODEL PARAMETERS (the module text gives no graft geometry). */
export const GRAFT_COURSE = {
  /** straight take-off from the aortic wall before the graft curves towards the heart (mm) */
  takeoffMm: 12,
  /** height of the course above the epicardium where it lies on the heart (mm) */
  liftMm: 3,
  /** the last part of the course runs beside the target vessel along its direction (mm before the anastomosis) */
  approachMm: 10,
  /** where the course meets the heart, as a share of the straight line from the take-off to the approach */
  landingShare: 0.35,
  /** lumen radius by conduit (mm): a saphenous vein graft about 4.5 mm across, a radial artery graft about 3 mm */
  radiusMm: { svg: 2.2, radial: 1.5 } as Record<"svg" | "radial", number>,
  /** resampling step along the graft (mm) */
  stepMm: 1.0,
};

/** One graft's grown course (rest geometry and samples in the tree's sample convention). */
export interface GraftCourse {
  site: GraftSite;
  samples: Sample[];
  /** arc length from the aortic ostium, mm */
  lenMm: number[];
  /** healthy lumen radius per sample, mm */
  radius: number[];
  /** the grown vessel the graft is anastomosed to and the sample index of the anastomosis */
  target: { name: string; index: number };
}

/**
 * The courses of a model's aortic grafts on a grown topology. A graft whose target vessel the topology does not have
 * (a vessel this genome lacks) is left out.
 */
export function growGrafts(topo: Topology, model: AnatomyModel): GraftCourse[] {
  const H = topo.heart;
  const out: GraftCourse[] = [];
  for (const site of model.grafts ?? []) {
    const g = site.graft;
    const tv = topo.vessels.find((v) => v.lesionId === g.target && v.kind !== "twig") ?? topo.vessels.find((v) => v.name === g.target);
    if (!tv || tv.samples.length < 4) continue;
    const total = tv.lenMm[tv.lenMm.length - 1] || 1;
    let k = tv.lenMm.findIndex((x) => x / total >= g.position);
    if (k < 0) k = tv.samples.length - 1;
    k = clamp(k, 2, tv.samples.length - 1);
    const E = tv.samples[k];
    // the approach: alongside the target vessel, a little proximal to the anastomosis and lifted off it
    let kPre = k;
    while (kPre > 0 && tv.lenMm[k] - tv.lenMm[kPre] < GRAFT_COURSE.approachMm) kPre--;
    const pre = tv.samples[kPre];
    // the take-off from the aorta (fixed in the root's frame)
    const p0 = site.ostium.pos;
    const d0 = nrm(site.ostium.dir);
    const p1 = add(p0, sc(d0, GRAFT_COURSE.takeoffMm));
    // the landing on the heart: the surface point under the straight line from the take-off towards the approach,
    // GRAFT_COURSE.landingShare of the way along it (so the course bends gently onto the heart), no nearer the apex
    // than the target
    const fit = fitSurface(H, lerp3(p1, restOf(H, pre), GRAFT_COURSE.landingShare));
    const landing: Node = { ell: clamp(fit.ell, -0.95, Math.min(0.9, E.ell)), phi: fit.phi, h: GRAFT_COURSE.liftMm };
    const lift = GRAFT_COURSE.liftMm;
    const surf = surfacePath([landing, { ell: pre.ell, phi: pre.phi, h: Math.max(pre.h, 0) + lift }, { ell: E.ell, phi: E.phi, h: E.h }]);
    if (surf.length < 2) continue;
    const t1 = startTangent(H, surf);
    const bridge = bridgePath(H, p1, d0, surf[0], t1, { c0: 0.45, c1: 0.45 });
    const raw: Sample[] = [...fixedPath(p0, p1), ...bridge, ...surf];
    const { samples, len } = resample(H, raw, GRAFT_COURSE.stepMm);
    const r = GRAFT_COURSE.radiusMm[g.conduit === "radial" ? "radial" : "svg"];
    out.push({ site, samples, lenMm: len, radius: samples.map(() => r), target: { name: tv.name, index: k } });
  }
  return out;
}
