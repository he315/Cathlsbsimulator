// ---------------------------------------------------------------------------
// Per-patient pulmonary vascular trees for the X-ray background.
//
// The lung markings on a fluoroscopy frame are mostly pulmonary arteries and
// veins: branching blood-filled tubes in aerated lung, seen side-on as thin
// dense lines and end-on as dots. The trees are grown by space colonisation
// (attraction points scattered through each lung, Runions et al. 2007 style
// algorithm, implemented here from the description: nodes step towards the
// mean direction of the attraction points they are nearest to, points are
// removed once a node comes close). Radii then follow a pipe model from the
// leaves upwards, so the trunk calibre emerges from the number of leaves.
//
// The real arterial tree has about 15 diameter-defined orders down to the
// capillaries (Huang et al. 1996, J Appl Physiol 81:2123, doi
// 10.1152/jappl.1996.81.5.2123); only the visible generations are grown here
// down to LEAF_RADIUS (0.45 mm); short terminal twigs starting at 0.9 x LEAF_RADIUS (0.405 mm) and
// tapering to 0.07 mm stand in for the finer orders, so the plan's 0.35-0.4 mm visibility limit falls
// within the twigs.
//
// Everything is seeded and built once per patient (cached): the per-frame cost
// is zero. Positions are in the thorax frame at end-expiration (resp 0); the
// caller supplies breathing displacements from the lung geometry.
// ---------------------------------------------------------------------------

import type { Vec3 } from "../../types";

/** Deterministic pseudo-random generator (mulberry32). */
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Model parameter: radius of the smallest grown (space-colonisation) vessels, mm. It is above the
 * plan's 0.35-0.4 mm visibility limit on purpose: the terminal twigs (0.405 mm tapering to 0.07 mm)
 * cover that limit, and with 2,000 attraction points per lung and tree type a 0.45 mm leaf gives the
 * pipe model a hilar artery radius above 4 mm. Lowering it to 0.4 would shrink every radius by 11 %.
 */
export const LEAF_RADIUS = 0.45;
/**
 * Model parameter: most vessel segments (grown tree plus twigs) per patient. Twigs are thinned
 * deterministically when the tree would exceed it, so the segment pass's vessel cost is bounded
 * (about 0.8 ms GPU at 768 px on an Apple M4 for this many; S4.md).
 */
export const VESSEL_SEGMENT_BUDGET = 18000;
/** Model parameter: pipe-model exponent r_parent^g = sum r_child^g (between area-preserving 2 and Murray's 3). */
export const PIPE_EXPONENT = 2.05;

export interface Ellipsoid {
  c: Vec3;
  half: [number, number, number];
}

/** A region the trees must not grow into (mediastinum, heart, diaphragm domes): ellipsoid or capped y-cylinder in world axes. */
export interface Exclusion {
  type: 0 | 1;
  c: Vec3;
  /** local axes (unit) and half sizes, as Shape in thorax.ts */
  ax: [Vec3, Vec3, Vec3];
  half: [number, number, number];
}

export interface TreeRoot {
  /** hilum position */
  p: Vec3;
  /** initial branch directions (lobar arteries or veins), each grown a few steps before colonisation starts */
  dirs: Vec3[];
  /** 0 artery, 1 vein */
  kind: 0 | 1;
  /** index of the lung it serves */
  lung: number;
}

export interface PulmonaryOptions {
  seed: number;
  lungs: Ellipsoid[];
  roots: TreeRoot[];
  exclude: Exclusion[];
  /** attraction points per lung and tree kind (model parameter; sets the number of leaves) */
  attractors?: number;
  /** growth step (mm) */
  step?: number;
  /** unresolved terminal twigs added at each leaf (model parameter; fine lung markings) */
  twigs?: number;
  /**
   * length scale of the growth (step, attraction and kill radii, twig length, simplification run):
   * pass the patient's linear lung size relative to the reference so the tree has the same topology,
   * leaf count and segment count in every habitus. Default 1.
   */
  scale?: number;
  /** most vessel segments after simplification (default VESSEL_SEGMENT_BUDGET); twigs are thinned to fit */
  maxSegments?: number;
}

export interface VesselNode {
  p: Vec3;
  parent: number;
  r: number;
  kind: 0 | 1;
  lung: number;
  children: number[];
}

export interface PulmonaryForest {
  nodes: VesselNode[];
  /** polylines between branch points, root to leaf order, with radii (mm) */
  chains: { pts: Vec3[]; r: number[]; kind: 0 | 1; lung: number }[];
  leaves: number;
  /** terminal twigs left out to keep within the segment budget */
  twigsDropped?: number;
}

const v = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const sub = (a: Vec3, b: Vec3) => v(a.x - b.x, a.y - b.y, a.z - b.z);
const add = (a: Vec3, b: Vec3) => v(a.x + b.x, a.y + b.y, a.z + b.z);
const sc = (a: Vec3, k: number) => v(a.x * k, a.y * k, a.z * k);
const len = (a: Vec3) => Math.hypot(a.x, a.y, a.z);
const nrm = (a: Vec3) => {
  const l = len(a) || 1;
  return v(a.x / l, a.y / l, a.z / l);
};
const dotv = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;

function inside(e: Exclusion, p: Vec3): boolean {
  const d = sub(p, e.c);
  const x = dotv(d, e.ax[0]) / e.half[0],
    y = dotv(d, e.ax[1]) / e.half[1],
    z = dotv(d, e.ax[2]) / e.half[2];
  return e.type === 0 ? x * x + y * y + z * z < 1 : x * x + z * z < 1 && Math.abs(y) < 1;
}

function inLung(l: Ellipsoid, p: Vec3, shrink = 1): boolean {
  const x = (p.x - l.c.x) / (l.half[0] * shrink),
    y = (p.y - l.c.y) / (l.half[1] * shrink),
    z = (p.z - l.c.z) / (l.half[2] * shrink);
  return x * x + y * y + z * z < 1;
}

/** Uniform hash grid of node indices. */
class Grid {
  private m = new Map<number, number[]>();
  constructor(private cell: number) {}
  private key(ix: number, iy: number, iz: number) {
    return ((ix + 512) * 1024 + (iy + 512)) * 1024 + (iz + 512);
  }
  add(i: number, p: Vec3) {
    const k = this.key(Math.floor(p.x / this.cell), Math.floor(p.y / this.cell), Math.floor(p.z / this.cell));
    const a = this.m.get(k);
    if (a) a.push(i);
    else this.m.set(k, [i]);
  }
  /** indices in the 27 cells around p */
  near(p: Vec3, out: number[]) {
    out.length = 0;
    const ix = Math.floor(p.x / this.cell),
      iy = Math.floor(p.y / this.cell),
      iz = Math.floor(p.z / this.cell);
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++)
        for (let c = -1; c <= 1; c++) {
          const s = this.m.get(this.key(ix + a, iy + b, iz + c));
          if (s) for (const i of s) out.push(i);
        }
    return out;
  }
}

/** Grow the arterial and venous trees of both lungs. Deterministic for a given seed and geometry. */
export function growPulmonaryTrees(o: PulmonaryOptions): PulmonaryForest {
  const rnd = prng(o.seed * 2654435761 + 17);
  const ks = o.scale ?? 1;
  const step = (o.step ?? 3.2) * ks;
  const influence = 24 * ks; // model parameter: attraction radius (mm at scale 1)
  const kill = 5.5 * ks; // model parameter: attraction point removal distance (mm at scale 1)
  const nAttr = o.attractors ?? 1400;
  const nodes: VesselNode[] = [];
  const addNode = (p: Vec3, parent: number, kind: 0 | 1, lung: number) => {
    nodes.push({ p, parent, r: 0, kind, lung, children: [] });
    if (parent >= 0) nodes[parent].children.push(nodes.length - 1);
    return nodes.length - 1;
  };

  // each (lung, kind) pair grows independently from its own attraction points
  const groups = new Map<string, TreeRoot[]>();
  for (const r of o.roots) {
    const k = `${r.lung}:${r.kind}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  for (const [, roots] of groups) {
    const lung = o.lungs[roots[0].lung];
    const kind = roots[0].kind;
    // attraction points: uniform in the lung (slightly shrunk from the pleura), outside the exclusions
    const A: Vec3[] = [];
    let guard = 0;
    while (A.length < nAttr && guard++ < nAttr * 40) {
      const p = v(
        lung.c.x + (rnd() * 2 - 1) * lung.half[0],
        lung.c.y + (rnd() * 2 - 1) * lung.half[1],
        lung.c.z + (rnd() * 2 - 1) * lung.half[2],
      );
      if (!inLung(lung, p, 0.93)) continue;
      if (o.exclude.some((e) => inside(e, p))) continue;
      A.push(p);
    }
    const alive = new Uint8Array(A.length).fill(1);
    let aliveCount = A.length;
    // each attraction point keeps its nearest node within the influence radius; new nodes update
    // only the points around them (grid of points), so an iteration is linear in the points
    const nearest = new Int32Array(A.length).fill(-1);
    const nd = new Float64Array(A.length).fill(influence * influence);
    const agrid = new Grid(influence);
    A.forEach((p, a) => agrid.add(a, p));
    const nearBuf: number[] = [];
    const push = (p: Vec3, parent: number) => {
      const i = addNode(p, parent, kind, roots[0].lung);
      for (const a of agrid.near(p, nearBuf)) {
        if (!alive[a]) continue;
        const d = sub(A[a], p);
        const dd = d.x * d.x + d.y * d.y + d.z * d.z;
        if (dd < nd[a]) {
          nd[a] = dd;
          nearest[a] = i;
        }
      }
      return i;
    };
    // roots and their lobar stems (a few straight steps so branches fan out from the hilum)
    for (const r of roots) {
      const h = push(r.p, -1);
      for (const d of r.dirs) {
        let prev = h;
        let p = r.p;
        const dn = nrm(d);
        for (let k = 0; k < 6; k++) {
          p = add(p, sc(dn, step * 1.4));
          prev = push(p, prev);
        }
      }
    }
    for (let it = 0; it < 220 && aliveCount > 0; it++) {
      const pull = new Map<number, Vec3>();
      for (let a = 0; a < A.length; a++) {
        if (!alive[a] || nearest[a] < 0) continue;
        if (nd[a] < kill * kill) {
          alive[a] = 0;
          aliveCount--;
          continue;
        }
        const best = nearest[a];
        const dir = nrm(sub(A[a], nodes[best].p));
        const cur = pull.get(best);
        pull.set(best, cur ? add(cur, dir) : dir);
      }
      if (!pull.size) break;
      let grew = 0;
      for (const [i, s] of pull) {
        // a little wander (model parameter) keeps branches from being ruler-straight
        const d = nrm(add(nrm(s), v((rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.3)));
        const p = add(nodes[i].p, sc(d, step));
        if (!inLung(lung, p, 0.97)) continue;
        if (o.exclude.some((e) => inside(e, p))) continue;
        // no duplicate child in (almost) the same place
        if (nodes[i].children.some((c) => len(sub(nodes[c].p, p)) < step * 0.4)) continue;
        push(p, i);
        grew++;
      }
      if (!grew) break;
    }
  }

  // radii: pipe model from leaves (children always come after parents, so a reverse sweep works)
  const g = PIPE_EXPONENT;
  const acc = new Float64Array(nodes.length);
  let leaves = 0;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (!n.children.length) {
      acc[i] = Math.pow(LEAF_RADIUS, g);
      leaves++;
    }
    n.r = Math.pow(acc[i], 1 / g);
    if (n.parent >= 0) acc[n.parent] += acc[i];
  }

  // chains between branch points
  const chains: PulmonaryForest["chains"] = [];
  const startChain = (from: number, first: number) => {
    const pts: Vec3[] = [nodes[from].p];
    const r: number[] = [nodes[first].r];
    let cur = first;
    for (;;) {
      const n = nodes[cur];
      pts.push(n.p);
      r.push(n.r);
      if (n.children.length !== 1) break;
      cur = n.children[0];
    }
    // leaves taper to nothing over the last sample (no square cut ends)
    const end = nodes[cur];
    if (!end.children.length) r[r.length - 1] = LEAF_RADIUS * 0.3;
    chains.push({ pts, r, kind: nodes[first].kind, lung: nodes[first].lung });
    for (const c of end.children) startChain(cur, c);
  };
  for (let i = 0; i < nodes.length; i++) if (nodes[i].parent < 0) for (const c of nodes[i].children) startChain(i, c);
  // terminal twigs: each leaf stands for a subtree too fine to grow; a few short tapering branches
  // continue it so the periphery carries fine markings instead of stopping at blunt leaves
  const nTw = o.twigs ?? 2;
  const twigChains: PulmonaryForest["chains"] = [];
  if (nTw > 0) {
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.children.length || n.parent < 0) continue;
      const lung = o.lungs[n.lung];
      const dir0 = nrm(sub(n.p, nodes[n.parent].p));
      for (let t = 0; t < nTw; t++) {
        let d = nrm(add(dir0, v((rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.6)));
        // model parameters: 6-15 mm long, two bent steps, radius 0.405 -> 0.25 -> 0.07 mm
        const L = (6 + rnd() * 9) * ks;
        const pts: Vec3[] = [n.p];
        const r: number[] = [LEAF_RADIUS * 0.9];
        let p = n.p;
        let ok = true;
        for (let k = 1; k <= 2; k++) {
          d = nrm(add(d, v((rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.6)));
          p = add(p, sc(d, L / 2));
          if (!inLung(lung, p, 0.98) || o.exclude.some((e) => inside(e, p))) {
            ok = k > 1;
            break;
          }
          pts.push(p);
          r.push(LEAF_RADIUS * (k === 1 ? 0.55 : 0.15));
        }
        if (ok && pts.length > 1) twigChains.push({ pts, r, kind: n.kind, lung: n.lung });
      }
    }
  }
  const grown = chains.map((ch) => simplifyChain(ch, 9 * ks));
  // segment budget: keep an evenly spread subset of the twigs when the tree would exceed it
  const budget = o.maxSegments ?? VESSEL_SEGMENT_BUDGET;
  const segs = (a: PulmonaryForest["chains"]) => a.reduce((s, c) => s + c.pts.length - 1, 0);
  const room = budget - segs(grown);
  const twigSegs = segs(twigChains);
  let kept = twigChains;
  if (twigSegs > room) {
    const frac = Math.max(0, room) / Math.max(1, twigSegs);
    kept = twigChains.filter((_, i) => Math.floor((i + 1) * frac) > Math.floor(i * frac));
  }
  return { nodes, chains: [...grown, ...kept], leaves, twigsDropped: twigChains.length - kept.length };
}

/**
 * Merge nearly collinear samples (deviation under 0.25 mm and runs under 9 mm) so a chain is
 * drawn with as few segments as its curvature needs.
 */
function simplifyChain(ch: PulmonaryForest["chains"][number], maxRun = 9): PulmonaryForest["chains"][number] {
  const { pts, r } = ch;
  if (pts.length <= 2) return ch;
  const keep = [0];
  let a = 0;
  for (let i = 2; i < pts.length; i++) {
    const A = pts[a],
      B = pts[i];
    const ab = sub(B, A);
    const L = len(ab);
    let ok = L < maxRun;
    for (let k = a + 1; ok && k < i; k++) {
      const ap = sub(pts[k], A);
      const t = Math.max(0, Math.min(1, dotv(ap, ab) / (L * L || 1)));
      if (len(sub(ap, sc(ab, t))) > 0.25) ok = false;
    }
    if (!ok) {
      keep.push(i - 1);
      a = i - 1;
    }
  }
  keep.push(pts.length - 1);
  return { ...ch, pts: keep.map((i) => pts[i]), r: keep.map((i) => r[i]) };
}

/** Number of drawn segments in a forest. */
export function segmentCount(f: PulmonaryForest, minR = 0): number {
  let n = 0;
  for (const c of f.chains) for (let i = 1; i < c.pts.length; i++) if (Math.max(c.r[i - 1], c.r[i]) >= minR) n++;
  return n;
}
