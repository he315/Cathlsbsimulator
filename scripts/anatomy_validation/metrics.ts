// ---------------------------------------------------------------------------
// Simulator-side anatomy and motion metrics, computed with the same definitions
// as the real-library tools in ./library (the anatomy-motion audit):
//   - projected tree extent (p2-p98 of the vessel mask) per standard view, mm at
//     the iso-centre plane (library: mask pixels × 2.0 mm / catheter width)
//   - tangent-angle band RMS of projected centrelines (library/spectrum.mjs)
//   - projected LM+LAD length (library/shape.mjs)
//   - landmark motion at 10/30/50/70/90% of a centreline: P10-P90 range along the
//     principal axis (library/track.mjs) and frame-to-frame steps at 15 frames/s
//     on the 512 px library scale (0.307 mm/px)
//   - mid-tree transect crossings on a synthetic contrast-only raster
//     (library/transect2.mjs; raster as in the audit's simraster.ts) and an
//     opacified-area proxy
// Used by src/render/xray/anatomy.test.ts and by sim_metrics.ts (CLI).
// ---------------------------------------------------------------------------

import type { CArm, Vec3 } from "../../src/types";
import { cameraBasis } from "../../src/simulation/projection";
import { toWorld, type AnatomyModel } from "../../src/simulation/anatomy";
import { samplePos, type CoronaryTree, type TreeVessel } from "../../src/render/xray/coronaryTree";
import type { Motion } from "../../src/render/xray/heart";
import { motionAt, clockStateAt } from "../../src/render/xray/heartMotion";
import { tangentBandRms } from "../../src/render/xray/tortuosity";

export const SOD = 760;
export const SID = 1060;
/** library scale: 512 px ≈ 157 mm at the catheter plane (6 F) */
export const MM_PER_PX_512 = 0.307;

export type P2 = [number, number];

/** Perspective projection onto the plane through the iso-centre perpendicular to the beam, mm (x right, y up). */
export function projector(cArm: CArm, iso: Vec3): (p: Vec3) => P2 {
  const b = cameraBasis(cArm);
  const src = { x: iso.x + b.forward.x * SOD, y: iso.y + b.forward.y * SOD, z: iso.z + b.forward.z * SOD };
  return (p: Vec3) => {
    const d = { x: p.x - src.x, y: p.y - src.y, z: p.z - src.z };
    // distance along the beam axis (-forward) from the source
    const along = -(d.x * b.forward.x + d.y * b.forward.y + d.z * b.forward.z);
    const k = SOD / Math.max(1, along);
    const q = { x: src.x + d.x * k - iso.x, y: src.y + d.y * k - iso.y, z: src.z + d.z * k - iso.z };
    return [q.x * b.right.x + q.y * b.right.y + q.z * b.right.z, q.x * b.up.x + q.y * b.up.y + q.z * b.up.z];
  };
}

const isTwigOrCollateral = (v: TreeVessel) => v.name.includes("twig") || v.name.startsWith("collateral");

/** Bounding-box centre of one side's named vessels at rest (world), like sceneBuilder.treeCentre. */
export function sideCentre(tree: CoronaryTree, model: AnatomyModel, side: "left" | "right" | "both"): Vec3 {
  let x0 = Infinity,
    y0 = Infinity,
    z0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity,
    z1 = -Infinity;
  for (const v of tree.vessels) {
    if (isTwigOrCollateral(v) || (side !== "both" && v.side !== side)) continue;
    for (const s of v.samples) {
      const p = toWorld(model, samplePos(tree.heart, s));
      x0 = Math.min(x0, p.x);
      y0 = Math.min(y0, p.y);
      z0 = Math.min(z0, p.z);
      x1 = Math.max(x1, p.x);
      y1 = Math.max(y1, p.y);
      z1 = Math.max(z1, p.z);
    }
  }
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: (z0 + z1) / 2 };
}

/**
 * Projected extent (p2-p98, mm) of a side's vessels with radius ≥ minR, points weighted by
 * radius so the statistic follows mask area as on the real images.
 */
export function extent(tree: CoronaryTree, model: AnatomyModel, side: "left" | "right", cArm: CArm, opts: { minR?: number; catheter?: boolean; fieldMm?: number } = {}): { w: number; h: number } {
  const minR = opts.minR ?? 0.35;
  const proj = projector(cArm, sideCentre(tree, model, side));
  const xs: [number, number][] = [],
    ys: [number, number][] = [];
  const half = (opts.fieldMm ?? 157) / 2;
  if (opts.catheter ?? false) {
    // the library masks include the contrast-filled guiding catheter (peak minus pre-contrast frame):
    // add a 2 mm catheter from the ostium up the root and ascending aorta, clipped to the 512 px field
    const os = side === "left" ? model.lm.pos : model.rca.pos;
    const path: Vec3[] = [os, { x: os.x * 0.3, y: 30, z: os.z * 0.3 }, { x: 0, y: 60, z: -2 }, { x: 4, y: 100, z: -14 }, { x: 10, y: 140, z: -40 }];
    for (let k = 0; k < path.length - 1; k++) {
      const a = path[k],
        b = path[k + 1];
      const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z));
      for (let j = 0; j < n; j++) {
        const t = j / n;
        const [x, y] = proj(toWorld(model, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }));
        if (Math.abs(x) > half || Math.abs(y) > half) continue;
        xs.push([x, 1.0]);
        ys.push([y, 1.0]);
      }
    }
  }
  for (const v of tree.vessels) {
    if (v.side !== side || v.name.startsWith("collateral")) continue;
    for (let i = 0; i < v.samples.length; i++) {
      if (v.radii[i] < minR) continue;
      const [x, y] = proj(toWorld(model, samplePos(tree.heart, v.samples[i])));
      xs.push([x, v.radii[i]]);
      ys.push([y, v.radii[i]]);
    }
  }
  const wq = (a: [number, number][], p: number) => {
    a.sort((m, n) => m[0] - n[0]);
    const tot = a.reduce((s, x) => s + x[1], 0);
    let acc = 0;
    for (const [x, w] of a) {
      acc += w;
      if (acc >= p * tot) return x;
    }
    return a[a.length - 1][0];
  };
  return { w: wq(xs, 0.98) - wq(xs, 0.02), h: wq(ys, 0.98) - wq(ys, 0.02) };
}

/** World points of a chain of named vessels (e.g. ["LM", "LAD"]), parents first, joined at the origins. */
export function chainSamples(tree: CoronaryTree, chain: string[]) {
  const out: { v: TreeVessel; i: number }[] = [];
  for (let k = 0; k < chain.length; k++) {
    const v = tree.vessels.find((x) => x.name === chain[k]);
    if (!v) continue;
    const next = chain[k + 1] ? tree.vessels.find((x) => x.name === chain[k + 1]) : undefined;
    const end = next?.parent?.name === v.name ? next.parent.index : v.samples.length - 1;
    for (let i = k === 0 ? 0 : 1; i <= end; i++) out.push({ v, i });
  }
  return out;
}

export function projectedChain(tree: CoronaryTree, model: AnatomyModel, chain: string[], cArm: CArm, m?: Motion, iso?: Vec3): P2[] {
  const side = tree.vessels.find((x) => x.name === chain[0])?.side ?? "left";
  const proj = projector(cArm, iso ?? sideCentre(tree, model, side));
  return chainSamples(tree, chain).map(({ v, i }) => proj(toWorld(model, samplePos(tree.heart, v.samples[i], m))));
}

export function polylineLength(p: P2[]): number {
  let s = 0;
  for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return s;
}

/** Tangent-angle band RMS of a projected chain (library definition). */
export function chainBands(tree: CoronaryTree, model: AnatomyModel, chain: string[], cArm: CArm) {
  return tangentBandRms(projectedChain(tree, model, chain, cArm));
}

const q = (a: number[], p: number) => {
  const s = [...a].sort((x, y) => x - y);
  if (!s.length) return NaN;
  const i = (s.length - 1) * p;
  const lo = Math.floor(i),
    hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
};
export const quantile = q;

export interface LandmarkMotion {
  /** P10-P90 along the principal axis, mm, per landmark */
  p1090: number[];
  /** frame-to-frame step at 512 scale (px): median, p90, max per landmark (full in-plane) */
  stepMedianPx: number[];
  stepP90Px: number[];
  stepMaxPx: number[];
  /** range across the vessel (perpendicular to the rest tangent), px at 512 scale */
  crossRangePx: number[];
  /**
   * frame-to-frame step of the across-vessel component only, px at 512 scale: median and p90 per landmark.
   * This is what docs/realism/research/xtrack.py measures on real cines (vessel centre along a fixed scan line
   * across the vessel), so it is the comparable quantity for the xtrack step ranges.
   */
  crossStepMedianPx: number[];
  crossStepP90Px: number[];
  /** median speed mm/s per landmark */
  speedMedian: number[];
}

/**
 * Landmark motion along a chain at 10/30/50/70/90% of its length, sampled at `fps` for `seconds`
 * at heart rate `hr`, with the table fixed at the rest centre (no breathing).
 */
export function landmarkMotion(tree: CoronaryTree, model: AnatomyModel, chain: string[], cArm: CArm, hr = 65, fps = 15, seconds = 4, fracs = [0.1, 0.3, 0.5, 0.7, 0.9], toCrux = true): LandmarkMotion {
  const side = tree.vessels.find((x) => x.name === chain[0])?.side ?? "left";
  const iso = sideCentre(tree, model, side);
  const proj = projector(cArm, iso);
  let cs = chainSamples(tree, chain);
  // the RCA is traced to the crux (PDA origin) on library cines
  if (toCrux && chain.length === 1 && chain[0] === "RCA") {
    const pda = tree.vessels.find((v) => v.name === "PDA" && v.parent?.name === "RCA");
    if (pda) cs = cs.slice(0, pda.parent!.index + 1);
  }
  const rest = cs.map(({ v, i }) => proj(toWorld(model, samplePos(tree.heart, v.samples[i]))));
  const L = [0];
  for (let i = 1; i < rest.length; i++) L.push(L[i - 1] + Math.hypot(rest[i][0] - rest[i - 1][0], rest[i][1] - rest[i - 1][1]));
  const idx = fracs.map((f) => {
    const t = f * L[L.length - 1];
    let i = 0;
    while (i < L.length - 1 && L[i] < t) i++;
    return i;
  });
  const n = Math.round(seconds * fps);
  const series: P2[][] = idx.map(() => []);
  for (let k = 0; k < n; k++) {
    const m = motionAt(clockStateAt(k / fps + 0.013, hr));
    idx.forEach((i, j) => {
      const { v, i: si } = cs[i];
      series[j].push(proj(toWorld(model, samplePos(tree.heart, v.samples[si], m))));
    });
  }
  const out: LandmarkMotion = { p1090: [], stepMedianPx: [], stepP90Px: [], stepMaxPx: [], crossRangePx: [], crossStepMedianPx: [], crossStepP90Px: [], speedMedian: [] };
  series.forEach((S, j) => {
    // principal axis
    const mx = S.reduce((a, p) => a + p[0], 0) / S.length,
      my = S.reduce((a, p) => a + p[1], 0) / S.length;
    let sxx = 0,
      sxy = 0,
      syy = 0;
    for (const [x, y] of S) {
      sxx += (x - mx) ** 2;
      sxy += (x - mx) * (y - my);
      syy += (y - my) ** 2;
    }
    const th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const ax = [Math.cos(th), Math.sin(th)];
    const proj1 = S.map(([x, y]) => (x - mx) * ax[0] + (y - my) * ax[1]);
    out.p1090.push(q(proj1, 0.9) - q(proj1, 0.1));
    const steps: number[] = [];
    for (let k = 1; k < S.length; k++) steps.push(Math.hypot(S[k][0] - S[k - 1][0], S[k][1] - S[k - 1][1]));
    out.stepMedianPx.push(q(steps, 0.5) / MM_PER_PX_512);
    out.stepP90Px.push(q(steps, 0.9) / MM_PER_PX_512);
    out.stepMaxPx.push(Math.max(...steps) / MM_PER_PX_512);
    out.speedMedian.push(q(steps, 0.5) * fps);
    // across the vessel at rest
    const i = idx[j];
    const a = rest[Math.max(0, i - 2)],
      b = rest[Math.min(rest.length - 1, i + 2)];
    const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nrm = [-(b[1] - a[1]) / tl, (b[0] - a[0]) / tl];
    const cross = S.map(([x, y]) => x * nrm[0] + y * nrm[1]);
    out.crossRangePx.push((Math.max(...cross) - Math.min(...cross)) / MM_PER_PX_512);
    const cst: number[] = [];
    for (let k = 1; k < cross.length; k++) cst.push(Math.abs(cross[k] - cross[k - 1]));
    out.crossStepMedianPx.push(q(cst, 0.5) / MM_PER_PX_512);
    out.crossStepP90Px.push(q(cst, 0.9) / MM_PER_PX_512);
  });
  return out;
}

/**
 * The xtrack measurement (docs/realism/research/xtrack.py) on a simulated vessel: a fixed horizontal ("h") or
 * vertical ("v") scan line through a landmark at rest; in every frame the vessel's crossing of that line nearest
 * the previous crossing is found, and its position along the line is tracked. Returns the range and the
 * frame-to-frame step median and p90, px at the 512 scale, at 15 frames/s over 2 s (the xtrack runs tracked
 * 18-31 frames).
 */
export function scanlineMotion(tree: CoronaryTree, model: AnatomyModel, chain: string[], cArm: CArm, frac: number, orient: "h" | "v", hr = 65, fps = 15, seconds = 2): { range: number; stepMedian: number; stepP90: number } | null {
  const side = tree.vessels.find((x) => x.name === chain[0])?.side ?? "left";
  const proj = projector(cArm, sideCentre(tree, model, side));
  let cs = chainSamples(tree, chain);
  if (chain.length === 1 && chain[0] === "RCA") {
    const pda = tree.vessels.find((v) => v.name === "PDA" && v.parent?.name === "RCA");
    if (pda) cs = cs.slice(0, pda.parent!.index + 1);
  }
  const at = (m?: Motion) => cs.map(({ v, i }) => proj(toWorld(model, samplePos(tree.heart, v.samples[i], m))));
  const rest = at();
  const L = [0];
  for (let i = 1; i < rest.length; i++) L.push(L[i - 1] + Math.hypot(rest[i][0] - rest[i - 1][0], rest[i][1] - rest[i - 1][1]));
  let li = 0;
  while (li < L.length - 1 && L[li] < frac * L[L.length - 1]) li++;
  const P0 = rest[li];
  const a = orient === "h" ? 1 : 0; // coordinate fixed by the line (y for a horizontal line)
  const line = P0[a];
  let pos = P0[1 - a];
  const track: number[] = [];
  const n = Math.round(seconds * fps);
  for (let k = 0; k < n; k++) {
    const P = at(motionAt(clockStateAt(k / fps + 0.013, hr)));
    let best: number | null = null;
    for (let i = 1; i < P.length; i++) {
      const u = P[i - 1][a] - line,
        w = P[i][a] - line;
      if (u === w || u * w > 0) continue;
      const t = u / (u - w);
      const c = P[i - 1][1 - a] + t * (P[i][1 - a] - P[i - 1][1 - a]);
      if (best === null || Math.abs(c - pos) < Math.abs(best - pos)) best = c;
    }
    if (best === null || Math.abs(best - pos) > 14 * MM_PER_PX_512) continue; // lost (xtrack search window 14 px)
    pos = best;
    track.push(pos);
  }
  if (track.length < n / 2) return null;
  const st: number[] = [];
  for (let k = 1; k < track.length; k++) st.push(Math.abs(track[k] - track[k - 1]) / MM_PER_PX_512);
  return { range: (Math.max(...track) - Math.min(...track)) / MM_PER_PX_512, stepMedian: q(st, 0.5), stepP90: q(st, 0.9) };
}

/**
 * Simulated counterpart of an xtrack line (reference.json xtrackLines): the vessel chain and the landmark position
 * along it, from the line name (prox 0.2, mid 0.45 or 0.5 on the RCA, distal 0.75; position on the vessel is
 * read from the name only, the exact real line positions are not mapped). Catheter, OM and LCx lines are skipped.
 */
export function xtrackSpec(line: { line: string }): { vessel: "LAD" | "RCA"; chain: string[]; frac: number } | null {
  const n = line.line;
  const frac = /prox/.test(n) ? 0.2 : /mid/.test(n) ? (n.startsWith("RCA") ? 0.5 : 0.45) : /dist/.test(n) ? 0.75 : NaN;
  if (!Number.isFinite(frac)) return null;
  if (n.startsWith("LAD")) return { vessel: "LAD", chain: ["LM", "LAD"], frac };
  if (n.startsWith("RCA")) return { vessel: "RCA", chain: ["RCA"], frac };
  return null;
}

// ---------------------------------------------------------------------------
// generator artefacts (the S2b counts, docs/realism/wave1/S2b.md "For S3b")
// ---------------------------------------------------------------------------

export interface TreeArtefacts {
  /** branches whose axis, after leaving the parent's lumen, comes back inside it more than 4 parent samples from the origin */
  reentry: { child: string; sample: number; parentSample: number; origin: number }[];
  /** same-tree pairs that are not parent and child whose axes pass within 0.9 x the larger radius (free samples only) */
  interpenetration: { a: string; ia: number; b: string; ib: number; d: number }[];
  /** left-right tree pairs whose lumens intersect (the integrator adds families; informative) */
  crossFamily: number;
}

/**
 * Re-entry and interpenetration counts on the rest geometry with the healthy radii, by the definitions of the S2b
 * review: a branch "re-enters" its parent when its axis, having left the parent's lumen (axis distance above the sum of
 * the two radii), comes back inside the parent's lumen (axis distance below the parent radius) more than 4 parent samples
 * from its origin. Two members of one tree that are not parent and child "interpenetrate" when their axes pass within
 * 0.9 x the larger of the two radii; samples still inside the vessel's own parent at its origin are not counted, but a
 * grandchild that starts inside its grandparent is. Collaterals are skipped.
 */
export function treeArtefacts(tree: CoronaryTree): TreeArtefacts {
  const V = tree.vessels.filter((v) => v.kind !== "collateral" && !v.name.startsWith("collateral"));
  const byName = new Map(V.map((v, i) => [v.name, i]));
  const P = V.map((v) => v.samples.map((s) => samplePos(tree.heart, s)));
  const R = V.map((v) => v.refRadii ?? v.radii);
  const parentIdx = V.map((v) => (v.parent ? byName.get(v.parent.name) ?? -1 : -1));
  const segDist = (p: Vec3, a: Vec3, b: Vec3): { d: number; t: number } => {
    const abx = b.x - a.x,
      aby = b.y - a.y,
      abz = b.z - a.z;
    const L2 = abx * abx + aby * aby + abz * abz;
    const t = L2 > 1e-12 ? Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby + (p.z - a.z) * abz) / L2)) : 0;
    return { d: Math.hypot(p.x - a.x - abx * t, p.y - a.y - aby * t, p.z - a.z - abz * t), t };
  };
  /** nearest point of vessel w's polyline to p: distance, fractional sample index and radius there */
  const nearest = (w: number, p: Vec3, k0 = 0, k1 = Infinity) => {
    let best = { d: Infinity, k: 0, r: 0 };
    const Q = P[w];
    for (let k = Math.max(0, k0); k < Math.min(Q.length - 1, k1); k++) {
      const { d, t } = segDist(p, Q[k], Q[k + 1]);
      if (d < best.d) best = { d, k: k + t, r: R[w][k] + (R[w][k + 1] - R[w][k]) * t };
    }
    if (Q.length === 1) best = { d: Math.hypot(p.x - Q[0].x, p.y - Q[0].y, p.z - Q[0].z), k: 0, r: R[w][0] };
    return best;
  };
  // first sample of each vessel that has fully left its parent's lumen
  const leave = V.map((v, i) => {
    const pi = parentIdx[i];
    if (pi < 0) return 0;
    for (let j = 0; j < v.samples.length; j++) {
      const n = nearest(pi, P[i][j]);
      if (n.d > n.r + R[i][j]) return j;
    }
    return v.samples.length;
  });
  const reentry: TreeArtefacts["reentry"] = [];
  V.forEach((v, i) => {
    const pi = parentIdx[i];
    if (pi < 0) return;
    const origin = v.parent!.index;
    for (let j = leave[i] + 1; j < v.samples.length; j++) {
      const n = nearest(pi, P[i][j]);
      if (n.d < n.r && Math.abs(n.k - origin) > 4) {
        reentry.push({ child: v.name, sample: j, parentSample: Math.round(n.k), origin });
        return;
      }
    }
  });
  const ancestors = V.map((_, i) => {
    const s = new Set<number>();
    for (let p = parentIdx[i], k = 0; p >= 0 && k < 16; p = parentIdx[p], k++) s.add(p);
    return s;
  });
  // spatial hash of the free samples, 4 mm cells
  const CELL = 4;
  const key = (p: Vec3) => `${Math.floor(p.x / CELL)},${Math.floor(p.y / CELL)},${Math.floor(p.z / CELL)}`;
  const grid = new Map<string, [number, number][]>();
  V.forEach((v, i) =>
    P[i].forEach((p, j) => {
      const k = key(p);
      const a = grid.get(k);
      if (a) a.push([i, j]);
      else grid.set(k, [[i, j]]);
    })
  );
  const pairs = new Map<string, TreeArtefacts["interpenetration"][number]>();
  let crossFamily = 0;
  const crossSeen = new Set<string>();
  V.forEach((v, i) => {
    for (let j = leave[i]; j < v.samples.length; j++) {
      const p = P[i][j];
      const cx = Math.floor(p.x / CELL),
        cy = Math.floor(p.y / CELL),
        cz = Math.floor(p.z / CELL);
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++)
          for (let dz = -1; dz <= 1; dz++) {
            const cell = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
            if (!cell) continue;
            for (const [w, k] of cell) {
              if (w === i || parentIdx[i] === w || parentIdx[w] === i) continue;
              const pk = P[w][k];
              const dd = Math.hypot(p.x - pk.x, p.y - pk.y, p.z - pk.z);
              if (dd > 4) continue;
              if (V[w].side !== v.side) {
                // different trees: lumens intersecting
                const n = nearest(w, p, k - 1, k + 1);
                if (n.d < n.r + R[i][j]) {
                  const pk2 = i < w ? `${i}|${w}` : `${w}|${i}`;
                  if (!crossSeen.has(pk2)) {
                    crossSeen.add(pk2);
                    crossFamily++;
                  }
                }
                continue;
              }
              // the other vessel's samples count when free, or when it is an ancestor of this one (grandparent lumen)
              if (k < leave[w] && !ancestors[i].has(w)) continue;
              const n = nearest(w, p, k - 1, k + 1);
              const lim = 0.9 * Math.max(R[i][j], n.r);
              if (n.d < lim) {
                const pk2 = i < w ? `${i}|${w}` : `${w}|${i}`;
                if (!pairs.has(pk2)) pairs.set(pk2, { a: v.name, ia: j, b: V[w].name, ib: Math.round(n.k), d: n.d });
              }
            }
          }
    }
  });
  return { reentry, interpenetration: [...pairs.values()], crossFamily };
}

// ---------------------------------------------------------------------------
// synthetic contrast-only raster and transect crossings (library/transect2.mjs)
// ---------------------------------------------------------------------------

const N = 512;

function boxMean(px: Float32Array, R: number): Float32Array {
  const W = N,
    H = N;
  const I = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let row = 0;
    for (let x = 0; x < W; x++) {
      row += px[y * W + x];
      I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + row;
    }
  }
  const out = new Float32Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const x0 = Math.max(0, x - R),
        x1 = Math.min(W, x + R + 1),
        y0 = Math.max(0, y - R),
        y1 = Math.min(H, y + R + 1);
      out[y * W + x] = (I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0]) / ((x1 - x0) * (y1 - y0));
    }
  return out;
}

function vesselness(px: Float32Array): Float32Array {
  const m = boxMean(px, 7),
    b = boxMean(px, 1);
  const v = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) v[i] = Math.max(0, m[i] - b[i]);
  return v;
}

function maskFrom(v: Float32Array, hi = 12, lo = 7, minArea = 80, border = 24): Uint8Array {
  const m = new Uint8Array(N * N);
  const stack: number[] = [];
  for (let y = border; y < N - border; y++)
    for (let x = border; x < N - border; x++)
      if (v[y * N + x] > hi) {
        m[y * N + x] = 1;
        stack.push(y * N + x);
      }
  while (stack.length) {
    const i = stack.pop()!,
      x = i % N,
      y = (i / N) | 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx,
          yy = y + dy;
        if (xx < border || yy < border || xx >= N - border || yy >= N - border) continue;
        const j = yy * N + xx;
        if (!m[j] && v[j] > lo) {
          m[j] = 1;
          stack.push(j);
        }
      }
  }
  const lab = new Int32Array(N * N);
  let L = 0;
  for (let i = 0; i < N * N; i++)
    if (m[i] && !lab[i]) {
      L++;
      const st = [i],
        comp = [i];
      lab[i] = L;
      while (st.length) {
        const k = st.pop()!,
          x = k % N,
          y = (k / N) | 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx,
              yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
            const j = yy * N + xx;
            if (m[j] && !lab[j]) {
              lab[j] = L;
              st.push(j);
              comp.push(j);
            }
          }
      }
      if (comp.length < minArea) for (const k of comp) m[k] = 0;
    }
  return m;
}

function countRowsDetailed(v: Float32Array): { counts: number[]; rows: { y: number; xs: number[] }[] } | null {
  const m = maskFrom(v, 12, 7, 80, 24);
  const ys: number[] = [];
  for (let i = 0; i < N * N; i++) if (m[i]) ys.push((i / N) | 0);
  if (ys.length < 500) return null;
  ys.sort((a, b) => a - b);
  const y0 = ys[Math.floor(ys.length * 0.1)],
    y1 = ys[Math.floor(ys.length * 0.9)];
  const counts: number[] = [];
  const rows: { y: number; xs: number[] }[] = [];
  for (let f = 0.3; f <= 0.71; f += 0.1) {
    const y = Math.round(y0 + (y1 - y0) * f);
    const row: number[] = [];
    for (let x = 0; x < N; x++) {
      let s = 0;
      for (let k = -2; k <= 2; k++) s += v[(y + k) * N + x];
      row.push(s / 5);
    }
    const xs: number[] = [];
    for (let x = 26; x < N - 26; x++) if (row[x] > 7 && row[x] >= Math.max(...row.slice(x - 3, x + 4)) && row[x] > row[x + 1]) xs.push(x);
    counts.push(xs.length);
    rows.push({ y, xs });
  }
  return { counts, rows };
}

/**
 * Synthetic contrast-only image of one side of the tree at the library scale (0.3077 mm/px at iso),
 * iodine contrast 0.162 per mm of chord on a background of 150, 3×3 blur, Gaussian noise SD 3.2
 * (as the audit's simraster.ts), then the library transect count. Also the fraction of the central
 * 76% darker than background by more than 10 levels (opacified-area proxy without background
 * texture, processing or blush).
 */
export function rasterMetrics(
  tree: CoronaryTree,
  model: AnatomyModel,
  side: "left" | "right",
  cArm: CArm,
  seed = 1
): { crossings: number[] | null; median: number; area10: number; image: Uint8Array; peaks: { y: number; vessels: string[] }[] } {
  const MMPX = 0.3077;
  const proj = projector(cArm, sideCentre(tree, model, side));
  const chord = new Float32Array(N * N);
  // vessel with the largest chord at each pixel (for naming the counted crossings)
  const who = new Int32Array(N * N).fill(-1);
  for (let vi = 0; vi < tree.vessels.length; vi++) {
    const v = tree.vessels[vi];
    if (v.side !== side || v.name.startsWith("collateral")) continue;
    const P = v.samples.map((s) => proj(toWorld(model, samplePos(tree.heart, s))));
    for (let i = 0; i < P.length - 1; i++) {
      const ax = N / 2 + P[i][0] / MMPX,
        ay = N / 2 - P[i][1] / MMPX,
        bx = N / 2 + P[i + 1][0] / MMPX,
        by = N / 2 - P[i + 1][1] / MMPX;
      const r = v.radii[i] / MMPX;
      const seg = Math.hypot(bx - ax, by - ay),
        steps = Math.max(1, Math.ceil(seg / 0.5));
      for (let k = 0; k < steps; k++) {
        const cx = ax + ((bx - ax) * k) / steps,
          cy = ay + ((by - ay) * k) / steps;
        for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++)
          for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
            if (x < 0 || y < 0 || x >= N || y >= N) continue;
            const dd = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
            if (dd < r + 0.5) {
              const c = 2 * Math.sqrt(Math.max(0, r * r - Math.min(dd, r) ** 2)) * MMPX;
              if (c > chord[y * N + x] || who[y * N + x] < 0) {
                if (c >= chord[y * N + x]) who[y * N + x] = vi;
                chord[y * N + x] = Math.max(chord[y * N + x], c);
              }
            }
          }
      }
    }
  }
  let rs = 12345 + seed;
  const rnd = () => ((rs = (rs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const img = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) img[i] = 150 * Math.exp(-0.162 * chord[i]);
  const bl = new Float32Array(N * N).fill(150);
  for (let y = 1; y < N - 1; y++)
    for (let x = 1; x < N - 1; x++) {
      let s = 0;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) s += img[(y + a) * N + x + b];
      bl[y * N + x] = s / 9;
    }
  let dark = 0,
    tot = 0;
  const m0 = Math.round(N * 0.12),
    m1 = N - m0;
  for (let y = m0; y < m1; y++)
    for (let x = m0; x < m1; x++) {
      tot++;
      if (150 - bl[y * N + x] > 10) dark++;
    }
  const px = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) {
    const g = Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
    px[i] = Math.max(0, Math.min(255, Math.round(bl[i] + 3.2 * g)));
  }
  const det = countRowsDetailed(vesselness(px));
  const cnt = det ? det.counts : null;
  // name each counted crossing by the vessel drawn nearest to the peak (within 4 px along the row)
  const peaks = (det?.rows ?? []).map(({ y, xs }) => ({
    y,
    vessels: xs.map((x) => {
      for (let d = 0; d <= 4; d++)
        for (const xx of [x - d, x + d]) {
          for (let dy = -2; dy <= 2; dy++) {
            const w = who[(y + dy) * N + xx];
            if (w >= 0) return tree.vessels[w].name;
          }
        }
      return "?";
    }),
  }));
  return { crossings: cnt, median: cnt ? q(cnt, 0.5) : NaN, area10: dark / tot, image: Uint8Array.from(px), peaks };
}
