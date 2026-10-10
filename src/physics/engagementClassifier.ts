// ---------------------------------------------------------------------------
// Read-only engagement classifier: describes where a catheter tip is from the
// rod geometry and contact loads. It never moves anything and has no
// difficulty-dependent thresholds: what is hard comes from the anatomy.
//
// Geometric predicates
// - Which lumen holds the tip: a coronary lumen (and which vessel), the root,
//   the valve orifice / left ventricle, or the aorta and access route.
// - Depth: tip arclength along the coronary beyond the ostium (mm).
// - Coaxiality: tip tangent · vessel axis at the tip (1 = perfectly coaxial).
// - Wall load: summed normal contact force on the distal 10 mm (N).
// - Open fraction: share of the ostial lumen area the catheter leaves open
//   for flow (1 − (r_cath / r_vessel)² inside the vessel, less when the tip is
//   wedged against the wall). This is the input S9 needs for damping and S5
//   for contrast transport.
// - Prolapse: the distal catheter has folded in the sinus (tip pointing back
//   up with the curve below it) or crossed into the ventricle.
// ---------------------------------------------------------------------------

import type { EngagementKind } from "../types";
import type { AnatomyModel } from "../simulation/anatomy";
import { LumenSet, Region, REGION_NAMES, queryTube, type LumenHit } from "./lumen";

export type OstiumName = "lm" | "rca" | "conus" | "left2";

export interface EngagementReading {
  /** region of the lumen holding the tip */
  region: string;
  regionCode: number;
  /** coronary vessel holding the tip, or null */
  vessel: string | null;
  ostium: OstiumName | null;
  side: "left" | "right" | null;
  /** depth beyond the ostium along the vessel (mm); negative = short of it */
  depthMm: number;
  /** tip tangent · vessel axis (−1..1); 0 when not near a coronary */
  coaxiality: number;
  /** distances from the tip to the ostia (mm) */
  distanceToLm: number;
  distanceToRca: number;
  /** cosine between the tip direction and each ostium's take-off axis */
  alignmentLm: number;
  alignmentRca: number;
  /** tip height above the valve plane (mm) */
  tipHeight: number;
  /** summed wall normal force over the distal 10 mm (N) */
  wallForce: number;
  /** fraction of the ostial lumen area left open (1 = unobstructed) */
  openFraction: number;
  /** 0..1 risk of pressure damping / ventricularisation */
  dampingRisk: number;
  inLV: boolean;
  prolapsed: boolean;
  /**
   * When the distal catheter is folded down onto the valve with the tip above the fold: how far
   * (degrees) the fold exceeds the device's preformed curve over the same length (NaN otherwise, or
   * when the preformed shape is unknown). Prolapse needs more than PROLAPSE_EXCESS_DEG.
   */
  foldExcessDeg: number;
  /** legacy engagement kind for the existing store and UI */
  kind: EngagementKind;
  selective: boolean;
  deep: boolean;
  conus: boolean;
}

export interface ClassifierInput {
  lumens: LumenSet;
  model: AnatomyModel;
  /** catheter centre-line nodes hub → tip (x,y,z) */
  nodes: ArrayLike<number>;
  count: number;
  /** unit tip tangent */
  tipDir: ArrayLike<number>;
  /** catheter outer radius (mm) */
  radius: number;
  /** per-node wall normal force (N), same order as nodes (optional) */
  nodeForce?: ArrayLike<number>;
  crossedValve: boolean;
  /** distance back from the tip node at which the tip is evaluated (mm), default 1.5 */
  tipInset?: number;
  /**
   * Unit tangents of the device's free (preformed) shape, tip first, one per mm of arclength from
   * the tip (3 numbers each, pointing towards the tip). With them the prolapse rule separates a fold
   * the preformed curve does not explain from a preformed hook seated in a cusp (Amplatz).
   */
  restTangents?: ArrayLike<number>;
}

/**
 * Excess folding (degrees) that counts as prolapse when the preformed shape is known: the catheter's
 * total turning between the tip and the shaft 10 mm above the fold exceeds its free shape's total
 * turning over the same arclength by more than this. Model parameter placed between the two
 * populations measured in the scripted runs (docs/realism/wave2/I3.md, all six solver
 * configurations): a Judkins right 4 pushed on in the left sinus folds 127 to 185 degrees beyond its
 * free shape; Amplatz hooks seated in the cusp (wave-1 and current shapes) stay within -9 to 66
 * degrees of theirs.
 */
export const PROLAPSE_EXCESS_DEG = 90;

/** Classifier switches for comparisons (tests, calibration): preformedFold false restores the wave-1 rule (no preformed-shape check). */
export const classifierOptions = { preformedFold: true };

/** Depth beyond the ostium at which the tip counts as deep (mm). Geometric: past the ostial funnel (4 mm) plus one catheter diameter. */
const DEEP_MM = 6.5;
/** Coaxial: tip within 45° of the vessel axis (cos 45° ≈ 0.7). */
const COAXIAL = 0.7;

const hit: LumenHit = { slack: 0, nx: 0, ny: 0, nz: 0, region: 0, lumen: 0, s: 0, floor: false };
const hit2: LumenHit = { slack: 0, nx: 0, ny: 0, nz: 0, region: 0, lumen: 0, s: 0, floor: false };

export function classifyEngagement(inp: ClassifierInput): EngagementReading {
  const { lumens, model, nodes, count } = inp;
  const ti = 3 * (count - 1);
  const dx = inp.tipDir[0], dy = inp.tipDir[1], dz = inp.tipDir[2];
  // evaluate 1.5 mm back from the very tip: the last segment's centre, which the contacts keep inside a lumen
  const inset = inp.tipInset ?? 1.5;
  const tx = nodes[ti] - dx * inset, ty = nodes[ti + 1] - dy * inset, tz = nodes[ti + 2] - dz * inset;
  // sample the tip a little inside the catheter end (the last node is the very tip)
  lumens.query(tx, ty, tz, Math.max(0.1, inp.radius * 0.5), { crossedValve: inp.crossedValve }, null, 0, hit);
  const regionCode = hit.region;
  const dist = (p: { x: number; y: number; z: number }) => Math.hypot(tx - p.x, ty - p.y, tz - p.z);
  const align = (d: { x: number; y: number; z: number }) => dx * d.x + dy * d.y + dz * d.z;
  const distanceToLm = Math.min(dist(model.lm.pos), model.leftOstium2 ? dist(model.leftOstium2.pos) : Infinity);
  const distanceToRca = dist(model.rca.pos);
  const alignmentLm = align(model.lm.dir);
  const alignmentRca = align(model.rca.dir);

  // coronary lumen holding the tip: the best-fitting coronary tube that contains it
  let vessel: string | null = null;
  let side: "left" | "right" | null = null;
  let depth = -Infinity;
  let coax = 0;
  let rVessel = 0;
  let bestSlack = -Infinity;
  for (let k = lumens.nFixedTubes; k < lumens.tubes.length; k++) {
    const t = lumens.tubes[k];
    if (tx < t.bbMin[0] || tx > t.bbMax[0] || ty < t.bbMin[1] || ty > t.bbMax[1] || tz < t.bbMin[2] || tz > t.bbMax[2]) continue;
    const seg = queryTube(t, tx, ty, tz, 0, -1, hit2);
    // the tip centre lies within the vessel, or within one catheter radius of it (wedged at a junction)
    if (hit2.slack < -inp.radius) continue;
    const d = (t.offsetMm ?? 0) + hit2.s - 3; // the tube starts 3 mm inside the root
    if (d <= -1.5) continue;
    if (hit2.slack <= bestSlack) continue;
    bestSlack = hit2.slack;
    vessel = t.vessel ?? t.name;
    side = t.side ?? null;
    depth = d;
    const o = 3 * seg;
    let ax = t.pts[o + 3] - t.pts[o], ay = t.pts[o + 4] - t.pts[o + 1], az = t.pts[o + 5] - t.pts[o + 2];
    const l = Math.hypot(ax, ay, az) || 1;
    ax /= l; ay /= l; az /= l;
    coax = dx * ax + dy * ay + dz * az;
    rVessel = t.rad[seg];
  }

  // prolapse: tip pointing back up with the catheter folded below it in the root, or in the ventricle
  let lowest = Infinity;
  let lowI = -1, lowU = 0;
  let u = 0;
  for (let i = count - 2; i >= 0 && u < 200; i--) {
    const o = 3 * i;
    u += Math.hypot(nodes[o + 3] - nodes[o], nodes[o + 4] - nodes[o + 1], nodes[o + 5] - nodes[o + 2]);
    if (u > 15 && nodes[o + 1] < lowest) {
      lowest = nodes[o + 1];
      lowI = i;
      lowU = u;
    }
  }
  const inLV = regionCode === Region.LV || (regionCode === Region.Orifice && ty < 0) || (inp.crossedValve && ty < 0);
  const inRoot = regionCode === Region.Root || regionCode === Region.Orifice;
  // the distal catheter has looped down onto the valve and comes back up: the lowest point of the curve
  // lies at the valve and the tip is well above it
  let folded = lowest < lumens.root.hCoapt + 6 && ty > lowest + 12 && (inRoot || regionCode === Region.Ascending);
  let foldExcessDeg = NaN;
  if (folded && inp.restTangents && lowI > 0) {
    // the fold must exceed what the preformed curve explains: the catheter's total turning from the
    // tip back to the shaft 10 mm above the lowest point, against the free shape's total turning over
    // the same arclength (a preformed hook seated in a cusp turns as much as its free shape does)
    let uu = lowU, j = lowI;
    while (j > 0 && nodes[3 * j + 1] < lowest + 10 && uu < 260) {
      uu += Math.hypot(nodes[3 * j] - nodes[3 * j - 3], nodes[3 * j + 1] - nodes[3 * j - 2], nodes[3 * j + 2] - nodes[3 * j - 1]);
      j--;
    }
    let measured = 0;
    let px = dx, py = dy, pz = dz;
    for (let i = count - 2; i >= j; i--) {
      let sx = nodes[3 * i + 3] - nodes[3 * i], sy = nodes[3 * i + 4] - nodes[3 * i + 1], sz = nodes[3 * i + 5] - nodes[3 * i + 2];
      const sl = Math.hypot(sx, sy, sz);
      if (sl < 1e-9) continue;
      sx /= sl; sy /= sl; sz /= sl;
      measured += Math.acos(Math.max(-1, Math.min(1, sx * px + sy * py + sz * pz)));
      px = sx; py = sy; pz = sz;
    }
    const rt = inp.restTangents;
    const nR = Math.floor(rt.length / 3);
    const kEnd = Math.min(nR - 1, Math.round(uu));
    let preformed = 0;
    for (let k = 1; k <= kEnd; k++) {
      preformed += Math.acos(Math.max(-1, Math.min(1, rt[3 * k - 3] * rt[3 * k] + rt[3 * k - 2] * rt[3 * k + 1] + rt[3 * k - 1] * rt[3 * k + 2])));
    }
    foldExcessDeg = ((measured - preformed) * 180) / Math.PI;
    if (classifierOptions.preformedFold) folded = foldExcessDeg > PROLAPSE_EXCESS_DEG;
  }
  const prolapsed = inLV || folded;

  // wall load on the distal 10 mm
  let wallForce = 0;
  if (inp.nodeForce) {
    let uu = 0;
    for (let i = count - 1; i > 0 && uu < 10; i--) {
      const o = 3 * i;
      uu += Math.hypot(nodes[o] - nodes[o - 3], nodes[o + 1] - nodes[o - 2], nodes[o + 2] - nodes[o - 1]);
      wallForce += inp.nodeForce[i] ?? 0;
    }
  }

  // open fraction of the ostial lumen
  let openFraction = 1;
  if (vessel !== null && rVessel > 0) {
    const share = Math.min(1, (inp.radius * inp.radius) / (rVessel * rVessel));
    const inVessel = Math.max(0, Math.min(1, (depth + 1.5) / 4)); // 0 at the funnel mouth → 1 past it
    // a tip against the vessel wall (not coaxial) closes more of the lumen
    const wedge = Math.max(0, Math.min(1, (0.9 - coax) / 0.6)) * inVessel;
    openFraction = Math.max(0, 1 - share * inVessel - 0.5 * wedge * (1 - share));
  }
  const dampingRisk = Math.max(0, Math.min(1, (1 - openFraction) * 1.3 + Math.min(0.3, wallForce)));

  const ostium: OstiumName | null =
    vessel === null ? null : vessel === "CONUS" ? "conus" : side === "right" ? "rca" : model.leftOstium2 && vessel === "LCx" ? "left2" : "lm";
  const conus = ostium === "conus";

  // legacy kind
  let kind: EngagementKind;
  let selective = false;
  let deep = false;
  const isLeft = side === "left";
  if (inLV) kind = "in-lv";
  else if (vessel !== null && depth > -0.5) {
    if (depth > DEEP_MM) {
      deep = true;
      kind = isLeft ? "deep-lm" : "deep-rca";
    } else if (coax > COAXIAL) {
      selective = true;
      kind = isLeft ? "selective-lm" : "selective-rca";
    } else kind = isLeft ? "near-lm" : "near-rca";
  } else if (inRoot || regionCode === Region.Coronary) {
    const nearL = distanceToLm < 8, nearR = distanceToRca < 8;
    if (nearL || nearR) {
      const left = distanceToLm <= distanceToRca;
      const a = left ? alignmentLm : alignmentRca;
      kind = a > 0.8 ? (left ? "coaxial-lm" : "coaxial-rca") : left ? "near-lm" : "near-rca";
    } else kind = prolapsed ? "below-valve" : ty < lumens.root.yTop ? "non-selective" : "sinus-level";
  } else if (regionCode === Region.Ascending) kind = "ascending-aorta";
  else kind = "not-in-root";

  return {
    region: REGION_NAMES[regionCode] ?? "unknown",
    regionCode,
    vessel,
    ostium,
    side,
    depthMm: vessel === null ? -Math.min(distanceToLm, distanceToRca) : depth,
    coaxiality: coax,
    distanceToLm,
    distanceToRca,
    alignmentLm,
    alignmentRca,
    tipHeight: ty - model.valvePlaneY,
    wallForce,
    openFraction,
    dampingRisk,
    inLV,
    prolapsed,
    foldExcessDeg,
    kind,
    selective,
    deep,
    conus,
  };
}
