// ---------------------------------------------------------------------------
// Packed segment format for the analytic vessel and device integrator.
//
// A vessel, catheter, wire or device is a chain of round cones (tapered
// capsules: the convex hull of two spheres). Each segment is 24 floats, which
// the GPU reads as 6 RGBA32F texels:
//
//   T0  p0.x  p0.y  p0.z  r0        start centre (mm, patient frame), radius
//   T1  p1.x  p1.y  p1.z  r1        end centre, radius
//   T2  c0    c1    k     group     concentration at each end, laminar profile
//                                   depth k (0 plug flow ... 1 parabolic),
//                                   material group (integer)
//   T3  e.x   e.y   e.z   hostC     elliptical section: thin-axis direction
//                                   (perpendicular to the axis) scaled by
//                                   (wide / thin - 1); zero = round; host slot C
//   T4  nS.x  nS.y  nS.z  hostA     start clip plane through p0 (inward
//                                   normal; zero = spherical end cap) and host
//                                   slot A
//   T5  nE.x  nE.y  nE.z  hostB     end clip plane through p1, host slot B
//
// A host slot holds -1 (empty), a single segment index (>= 0), a range of up
// to HOST_RANGE_MAX (31) consecutive segment indices encoded as
// -2 - (first * 32 + count - 1), or, with the count field at its reserved
// value 31, a reference to an extension list: -2 - (k * 32 + 31), where k is
// a texel of SegmentBatch.hostExtra holding up to HOST_EXT_MAX further slot
// values (singles or ranges), four per texel, ended by -1. All of this is
// exact in float32 below 2^24 / 32 = 524,288 segments. tubesToSegments uses
// slot C for the earlier segments of the same chain (joints without a plane),
// slot A for the parent segments at a branch origin and slots B (then A, then
// an extension list) for other members of the same vessel family that a
// segment overlaps: siblings or cousins running into each other, or a
// branch re-entering its parent. Plane normals have length 1 at chain
// joints (made by addChain), FLAT_END at the cut ends of open tubes and
// USER_PLANE when given to addSegment; only unit-length planes join a
// neighbour.
//
// Union without double counting is built into the geometry rather than
// sorted per ray:
//   * Chain joints. Consecutive segments of a chain are cut by the plane that
//     bisects the joint (normal along the sum of the two axis directions), so
//     they partition the chain's solid: every point is counted once. For a
//     locally constant radius and a gentle bend the partition is exact (on
//     each side of the bisector the nearer axis is that side's, so a point
//     inside the other capsule is inside this one too). A joint where it is
//     not (a bend tight for the radius, so the planes at the two ends of a
//     segment would cross inside the tube, or a radius step above 15 %) gets
//     no plane; instead the later segment removes the chords of the earlier
//     segments it overlaps (a range in slot C). Chain ends keep spherical
//     caps (no square ends).
//   * Branch origins. The first segments of a branch that start inside their
//     parent's lumen carry a host range: every parent segment they overlap
//     (found by scanning outward from the branch point along the parent).
//     Their chord minus the union of the hosts' chords is what they add, so
//     the overlap is counted once, at the parent's concentration.
//     Subtracting each host's kept chord in turn removes their union whether
//     or not those chords overlap one another.
//   * Other overlaps within a vessel family (familyOverlaps): every segment
//     has a priority (tree depth, tube, index) and removes the overlapping
//     segments of higher priority, so host relations never form a cycle and
//     each point is counted once, by its highest-priority member.
//   * Hollow shells (catheter wall, stent sleeve, calcium rim) are an outer
//     chain plus an inner chain of opposite sign on the same points: outer
//     solid minus inner solid, exact for any ray. Their ends are cut flat (an
//     open tube), with the plane normal stored at length FLAT_END so it is not
//     mistaken for a joint.
// The per-ray work is then a sum of independent clipped chords, with no
// per-pixel list and therefore no overflow at any depth complexity.
//
// Material: group g has mu = (R bone/soft, G iodine, B metal) per unit
// concentration; a chord adds mu x integral of c along it, c linear in the
// clamped axial coordinate (end caps carry the end value), times the mean
// laminar factor (1 - k rho^2 / R^2) over the chord.
// ---------------------------------------------------------------------------

import type { Vec3 } from "../../../types";
import type { TubeSpec, XrayLikeScene } from "./types";

export const SEG_FLOATS = 24;
export const SEG_TEXELS = 6;
/** floats per segment in the optional previous-frame array: q0.xyz, 0, q1.xyz, 0 */
export const PREV_FLOATS = 8;

export interface SegmentGroup {
  /** material per unit concentration: R bone/soft-tissue excess, G iodine, B metal (per mm) */
  mu: [number, number, number];
  /**
   * Wall thickness in mm when the group is one side of a hollow shell (outer or inner surface),
   * otherwise Infinity. Used to decide where pixels need several rays (anti-aliasing of thin
   * rims, which neither surface shows on its own).
   */
  featureMm: number;
  name?: string;
}

export interface SegmentMotion {
  /** time between `prev` and the current positions, s (one frame) */
  dtS: number;
  /** X-ray pulse width, s; positions are integrated over [-pulse/2, +pulse/2] */
  pulseS: number;
}

export interface SegmentBatch {
  count: number;
  /** count * SEG_FLOATS */
  data: Float32Array;
  groups: SegmentGroup[];
  /** optional segment end positions one frame earlier (count * PREV_FLOATS), for blur and velocity */
  prev?: Float32Array | null;
  motion?: SegmentMotion | null;
  /**
   * Channel gains the image chain applies after this pass (1, iodineGain, metalGain). Used only
   * when several sub-samples are averaged as transmission rather than path length.
   */
  gains?: [number, number, number];
  /** host extension lists (four slot values per texel; see encodeHostExt), or null */
  hostExtra?: Float32Array | null;
  /** set by tubesToSegments: layout signature for reusing host slots (TubesToSegmentsOptions.topologyFrom) */
  topologyKey?: string;
  /** set by tubesToSegments: overlapping segment pairs within a family left to add (no free host slot) */
  unresolvedOverlaps?: number;
}

const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

export interface SegmentOptions {
  /** laminar profile depth (0 = uniform) */
  k?: number;
  /** elliptical section: direction of the thin axis and thin/wide ratio */
  thinDir?: Vec3 | null;
  thinRatio?: number;
  /** end positions one frame earlier */
  prev?: [Vec3, Vec3] | null;
  /** inward normals of clip planes through p0 / p1 (null = spherical cap) */
  startPlane?: Vec3 | null;
  endPlane?: Vec3 | null;
  /** host segment indices whose clipped chords are removed from this one (up to three) */
  hosts?: [number, number] | [number, number, number];
  /**
   * Host ranges instead of single hosts: up to three [first, count] runs of consecutive segments
   * (count up to HOST_RANGE_MAX), filling slots A, B, C in order. Overrides `hosts`.
   */
  hostRanges?: [number, number][];
}

export interface ChainOptions {
  /** laminar profile depth per sample or for the whole chain (0 = uniform) */
  k?: number | number[];
  /** flattened cross-section: direction of the thin axis and its semi-axis per sample */
  thin?: { dir: Vec3[]; r: number[] };
  /** the same chain one frame earlier (same length), for motion blur and velocity */
  prevPts?: Vec3[];
  /**
   * Cut the chain flat at both ends instead of capping it with spheres: a tube's open end
   * (catheter tip, stent or balloon edge). Spherical caps suit vessels.
   */
  flatEnds?: boolean;
}

/** Length of a flat-end plane normal (joint planes are unit length). */
export const FLAT_END = 2;
/** Length of a plane normal given to addSegment (no neighbour: never back-filled). */
export const USER_PLANE = 3;

/** Largest number of consecutive segments one host slot can name. */
export const HOST_RANGE_MAX = 31;
/** The count field value that marks an extension-list reference. */
const HOST_EXT_CODE = 31;
/** Largest number of slot values in one extension list (four texels, the last ending in -1). */
export const HOST_EXT_MAX = 15;
/** Float offsets of the three host slots in a record, in the order A, B, C (T4.w, T5.w, T3.w). */
export const HOST_SLOT_OFFSETS = [19, 23, 15] as const;

/** Encode `count` consecutive host segments starting at `first` as one slot value. */
export function encodeHostRange(first: number, count: number): number {
  if (count <= 0) return -1;
  if (count === 1) return first;
  if (count > HOST_RANGE_MAX) throw new Error(`host range of ${count} exceeds ${HOST_RANGE_MAX}`);
  if (first < 0 || first >= 2 ** 24 / 32) throw new Error(`host range start ${first} out of range`);
  return -2 - (first * 32 + count - 1);
}

/** Encode a reference to the extension list starting at hostExtra texel k. */
export function encodeHostExt(k: number): number {
  if (k < 0 || k >= 2 ** 24 / 32) throw new Error(`host extension ${k} out of range`);
  return -2 - (k * 32 + HOST_EXT_CODE);
}

/**
 * Decode a slot value into [first, count]: count 0 = empty, count -1 = an extension list whose
 * first texel is `first` (see expandHostSlot).
 */
export function decodeHostSlot(v: number): [number, number] {
  if (v >= 0) return [v, 1];
  if (v > -1.5) return [0, 0];
  const code = -v - 2;
  const c = code % 32;
  const first = (code - c) / 32;
  return c === HOST_EXT_CODE ? [first, -1] : [first, c + 1];
}

/** Every segment index a slot value names, following an extension list in `extra`. */
export function expandHostSlot(v: number, extra?: ArrayLike<number> | null): number[] {
  const [f, c] = decodeHostSlot(v);
  const out: number[] = [];
  if (c > 0) for (let k = 0; k < c; k++) out.push(f + k);
  else if (c < 0 && extra)
    for (let q = 0; q <= HOST_EXT_MAX && f * 4 + q < extra.length; q++) {
      const e = extra[f * 4 + q];
      if (e > -1.5 && e < 0) break;
      const [g, n] = decodeHostSlot(e);
      for (let k = 0; k < n; k++) out.push(g + k);
    }
  return out;
}

/** Bend beyond which a joint gets no bisector plane: |a + b| / 2 below this (about 157 degrees). */
const MIN_BISECTOR = 0.2;
/**
 * Plane partition limit: r tan(theta / 2) over the shorter adjacent segment. MODEL PARAMETER (0.5):
 * beyond it the planes at the two ends of a segment can cross inside the tube.
 */
const JOINT_PLANE_LIMIT = 0.5;
/** Radius step between adjacent samples above which a joint uses hosts. MODEL PARAMETER (1.15). */
const RADIUS_STEP_LIMIT = 1.15;
/**
 * How far back along a chain a segment looks for earlier segments it overlaps through a joint
 * without a plane. MODEL PARAMETER (8): sample spacing in the coronary tree is about the radius,
 * so a tight bend overlaps a few samples back.
 */
const CHAIN_HOST_BACK = 8;
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/** Smallest distance between segments [p0, p1] and [q0, q1] (flat arrays, offsets into d). */
function segSegDist(d: Float32Array, i: number, j: number): number {
  const a = i * SEG_FLOATS,
    b = j * SEG_FLOATS;
  const ux = d[a + 4] - d[a],
    uy = d[a + 5] - d[a + 1],
    uz = d[a + 6] - d[a + 2];
  const vx = d[b + 4] - d[b],
    vy = d[b + 5] - d[b + 1],
    vz = d[b + 6] - d[b + 2];
  const wx = d[a] - d[b],
    wy = d[a + 1] - d[b + 1],
    wz = d[a + 2] - d[b + 2];
  const A = ux * ux + uy * uy + uz * uz,
    B = ux * vx + uy * vy + uz * vz,
    C = vx * vx + vy * vy + vz * vz;
  const D = ux * wx + uy * wy + uz * wz,
    E = vx * wx + vy * wy + vz * wz;
  const den = A * C - B * B;
  let s = den > 1e-12 ? (B * E - C * D) / den : 0;
  s = Math.min(1, Math.max(0, s));
  let t = C > 1e-12 ? (B * s + E) / C : 0;
  if (t < 0 || t > 1) {
    t = Math.min(1, Math.max(0, t));
    s = A > 1e-12 ? Math.min(1, Math.max(0, (B * t - D) / A)) : 0;
  }
  const dx = wx + s * ux - t * vx,
    dy = wy + s * uy - t * vy,
    dz = wz + s * uz - t * vz;
  return Math.hypot(dx, dy, dz);
}

/** Do the solids of segments i and j overlap (axis distance below the sum of the larger radii)? */
function segOverlap(d: Float32Array, i: number, j: number): boolean {
  const ri = Math.max(d[i * SEG_FLOATS + 3], d[i * SEG_FLOATS + 7]);
  const rj = Math.max(d[j * SEG_FLOATS + 3], d[j * SEG_FLOATS + 7]);
  return segSegDist(d, i, j) < ri + rj;
}

/** Incremental builder: add groups, then segments or whole chains; finish() returns the batch. */
export class SegmentBatchBuilder {
  /** the packed records so far (grows; read through finish() for a batch) */
  data: Float32Array;
  private prev: Float32Array | null = null;
  private n = 0;
  readonly groups: SegmentGroup[] = [];
  /** host extension lists, four slot values per texel (see encodeHostExt) */
  hostExtra: number[] = [];

  constructor(capacity = 1024) {
    this.data = new Float32Array(Math.max(16, capacity) * SEG_FLOATS);
  }

  get count() {
    return this.n;
  }

  addGroup(mu: [number, number, number], featureMm = Infinity, name?: string): number {
    this.groups.push({ mu: [mu[0], mu[1], mu[2]], featureMm, name });
    return this.groups.length - 1;
  }

  private grow(need: number) {
    if (need * SEG_FLOATS <= this.data.length) return;
    let cap = this.data.length / SEG_FLOATS;
    while (cap < need) cap *= 2;
    const d = new Float32Array(cap * SEG_FLOATS);
    d.set(this.data);
    this.data = d;
    if (this.prev) {
      const p = new Float32Array(cap * PREV_FLOATS);
      p.set(this.prev);
      this.prev = p;
    }
  }

  private ensurePrev() {
    if (this.prev) return;
    this.prev = new Float32Array((this.data.length / SEG_FLOATS) * PREV_FLOATS);
    // segments added so far did not move: previous position = current
    for (let i = 0; i < this.n; i++) {
      const o = i * SEG_FLOATS;
      this.writePrev(i, v3(this.data[o], this.data[o + 1], this.data[o + 2]), v3(this.data[o + 4], this.data[o + 5], this.data[o + 6]));
    }
  }

  private writePrev(i: number, q0: Vec3, q1: Vec3) {
    const p = this.prev!;
    const o = i * PREV_FLOATS;
    p[o] = q0.x;
    p[o + 1] = q0.y;
    p[o + 2] = q0.z;
    p[o + 3] = 0;
    p[o + 4] = q1.x;
    p[o + 5] = q1.y;
    p[o + 6] = q1.z;
    p[o + 7] = 0;
  }

  /** Set slots A and B of segment i to single host segments (-1 = empty); slot C is kept. */
  setHosts(i: number, a: number, b: number) {
    this.data[i * SEG_FLOATS + 19] = a;
    this.data[i * SEG_FLOATS + 23] = b;
  }

  /** Set host slot `slot` (0 = A, 1 = B, 2 = C) of segment i to `count` segments from `first`. */
  setHostRange(i: number, slot: 0 | 1 | 2, first: number, count: number) {
    this.data[i * SEG_FLOATS + HOST_SLOT_OFFSETS[slot]] = encodeHostRange(first, count);
  }

  /** Raw host slot values of segment i: [A, B, C] (-1 = empty; see decodeHostSlot). */
  hostsOf(i: number): [number, number, number] {
    const o = i * SEG_FLOATS;
    return [this.data[o + 19], this.data[o + 23], this.data[o + 15]];
  }

  /** Every host segment index of segment i, slots A, B, C in order (extension lists followed). */
  hostList(i: number): number[] {
    return this.hostsOf(i).flatMap((v) => expandHostSlot(v, this.hostExtra));
  }

  /**
   * Set host slot `slot` (0 = A, 1 = B, 2 = C) of segment i to a list of slot values (singles
   * or encoded ranges): one value is stored directly, several go to an extension list (at most
   * HOST_EXT_MAX; returns how many were left out).
   */
  setHostList(i: number, slot: 0 | 1 | 2, values: number[]): number {
    const off = i * SEG_FLOATS + HOST_SLOT_OFFSETS[slot];
    if (values.length === 0) {
      this.data[off] = -1;
      return 0;
    }
    if (values.length === 1) {
      this.data[off] = values[0];
      return 0;
    }
    const keep = values.slice(0, HOST_EXT_MAX);
    const k = this.hostExtra.length / 4;
    this.hostExtra.push(...keep, -1);
    while (this.hostExtra.length % 4) this.hostExtra.push(-1);
    this.data[off] = encodeHostExt(k);
    return values.length - keep.length;
  }

  /** One round cone; returns its index. */
  addSegment(group: number, p0: Vec3, r0: number, p1: Vec3, r1: number, c0: number, c1: number, opt: SegmentOptions = {}): number {
    if (group < 0 || group >= this.groups.length) throw new Error(`segment group ${group} not defined`);
    // user planes are stored at length USER_PLANE: they have no chain neighbour to back-fill from
    const scale = (p: Vec3 | null | undefined): [number, number, number] => {
      if (!p) return [0, 0, 0];
      const l = Math.hypot(p.x, p.y, p.z);
      return l > 0 ? [(p.x / l) * USER_PLANE, (p.y / l) * USER_PLANE, (p.z / l) * USER_PLANE] : [0, 0, 0];
    };
    const sp = scale(opt.startPlane),
      ep = scale(opt.endPlane);
    const slots = [-1, -1, -1];
    if (opt.hostRanges) opt.hostRanges.slice(0, 3).forEach(([f, c], k) => (slots[k] = encodeHostRange(f, c)));
    else if (opt.hosts) opt.hosts.forEach((h, k) => (slots[k] = h));
    const i = this.writeSeg(
      group, p0.x, p0.y, p0.z, r0, p1.x, p1.y, p1.z, r1, c0, c1, opt.k ?? 0,
      opt.thinDir ? opt.thinDir.x : 0, opt.thinDir ? opt.thinDir.y : 0, opt.thinDir ? opt.thinDir.z : 0, opt.thinDir ? opt.thinRatio ?? 1 : 1,
      sp[0], sp[1], sp[2], ep[0], ep[1], ep[2],
      slots[0], slots[1], slots[2]
    );
    if (opt.prev) {
      this.ensurePrev();
      this.writePrev(i, opt.prev[0], opt.prev[1]);
    } else if (this.prev) this.writePrev(i, p0, p1);
    return i;
  }

  /** Write one record from scalars (no allocation); returns its index. */
  private writeSeg(
    group: number,
    ax: number, ay: number, az: number, r0: number,
    bx: number, by: number, bz: number, r1: number,
    c0: number, c1: number, k: number,
    tx: number, ty: number, tz: number, thinRatio: number,
    sx: number, sy: number, sz: number, ex: number, ey: number, ez: number,
    hA: number, hB: number, hC: number
  ): number {
    this.grow(this.n + 1);
    const d = this.data;
    const o = this.n * SEG_FLOATS;
    d[o] = ax;
    d[o + 1] = ay;
    d[o + 2] = az;
    d[o + 3] = r0 > 0 ? r0 : 0;
    d[o + 4] = bx;
    d[o + 5] = by;
    d[o + 6] = bz;
    d[o + 7] = r1 > 0 ? r1 : 0;
    d[o + 8] = c0;
    d[o + 9] = c1;
    d[o + 10] = k < 0 ? 0 : k > 1 ? 1 : k;
    d[o + 11] = group;
    let qx = 0,
      qy = 0,
      qz = 0;
    if (thinRatio < 0.999 && (tx !== 0 || ty !== 0 || tz !== 0)) {
      // thin axis made perpendicular to the segment axis, scaled by (wide / thin - 1)
      const vx = bx - ax,
        vy = by - ay,
        vz = bz - az;
      const vl2 = vx * vx + vy * vy + vz * vz;
      let nx = tx,
        ny = ty,
        nz = tz;
      if (vl2 > 1e-18) {
        const dd = (nx * vx + ny * vy + nz * vz) / vl2;
        nx -= dd * vx;
        ny -= dd * vy;
        nz -= dd * vz;
      }
      const nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (nl > 1e-6) {
        const kk = 1 / Math.max(0.02, thinRatio) - 1;
        qx = (nx / nl) * kk;
        qy = (ny / nl) * kk;
        qz = (nz / nl) * kk;
      }
    }
    d[o + 12] = qx;
    d[o + 13] = qy;
    d[o + 14] = qz;
    d[o + 15] = hC;
    d[o + 16] = sx;
    d[o + 17] = sy;
    d[o + 18] = sz;
    d[o + 19] = hA;
    d[o + 20] = ex;
    d[o + 21] = ey;
    d[o + 22] = ez;
    d[o + 23] = hB;
    return this.n++;
  }

  /**
   * A polyline of samples with per-sample radius and concentration (scalar or per sample).
   * Interior joints get bisector clip planes; the chain ends keep spherical caps. Returns the
   * index of the first segment (the chain's segments are consecutive; segment i joins samples
   * i and i + 1).
   */
  addChain(group: number, pts: Vec3[], r: number[], c: number | number[], opt: ChainOptions = {}): number {
    const n = pts.length;
    const first = this.n;
    if (n === 0) return first;
    if (group < 0 || group >= this.groups.length) throw new Error(`segment group ${group} not defined`);
    const cArr = typeof c === "number" ? null : c;
    const kArr = opt.k === undefined || typeof opt.k === "number" ? null : opt.k;
    const kConst = typeof opt.k === "number" ? opt.k : 0;
    const prevOk = !!opt.prevPts && opt.prevPts.length === n;
    if (n === 1) {
      // a lone sample is a sphere
      const c0 = cArr ? cArr[0] : (c as number);
      this.addSegment(group, pts[0], r[0], pts[0], r[0], c0, c0, { k: kArr ? kArr[0] : kConst, prev: prevOk ? [opt.prevPts![0], opt.prevPts![0]] : null });
      return first;
    }
    // unit directions and lengths of the segments (length 0: no direction)
    const ns = n - 1;
    const dir = new Float64Array(ns * 3);
    const len = new Float64Array(ns);
    for (let i = 0; i < ns; i++) {
      const a = pts[i],
        b = pts[i + 1];
      const x = b.x - a.x,
        y = b.y - a.y,
        z = b.z - a.z;
      const l = Math.sqrt(x * x + y * y + z * z);
      len[i] = l;
      if (l > 1e-9) {
        dir[i * 3] = x / l;
        dir[i * 3 + 1] = y / l;
        dir[i * 3 + 2] = z / l;
      }
    }
    // bisector plane normal at interior joint j (between segments j-1 and j), or none where the
    // plane partition is not exact enough (see the header): tight bend or radius step
    const pl = new Float64Array(n * 3);
    const has = new Uint8Array(n);
    for (let j = 1; j < n - 1; j++) {
      if (len[j - 1] <= 1e-9 || len[j] <= 1e-9) continue;
      const ax = dir[(j - 1) * 3],
        ay = dir[(j - 1) * 3 + 1],
        az = dir[(j - 1) * 3 + 2];
      const bx = dir[j * 3],
        by = dir[j * 3 + 1],
        bz = dir[j * 3 + 2];
      const mx = ax + bx,
        my = ay + by,
        mz = az + bz;
      const l = Math.sqrt(mx * mx + my * my + mz * mz);
      if (l <= 2 * MIN_BISECTOR) continue;
      let cosT = ax * bx + ay * by + az * bz;
      cosT = cosT > 1 ? 1 : cosT < -1 ? -1 : cosT;
      const tanHalf = Math.sqrt((1 - cosT) / (1 + cosT));
      if (Math.max(r[j - 1], r[j], r[j + 1]) * tanHalf > JOINT_PLANE_LIMIT * Math.min(len[j - 1], len[j])) continue;
      const s1 = Math.max(r[j - 1], r[j]) / Math.max(1e-9, Math.min(r[j - 1], r[j]));
      const s2 = Math.max(r[j], r[j + 1]) / Math.max(1e-9, Math.min(r[j], r[j + 1]));
      if (s1 > RADIUS_STEP_LIMIT || s2 > RADIUS_STEP_LIMIT) continue;
      has[j] = 1;
      pl[j * 3] = mx / l;
      pl[j * 3 + 1] = my / l;
      pl[j * 3 + 2] = mz / l;
    }
    const thin = opt.thin;
    for (let i = 0; i < ns; i++) {
      let tx = 0,
        ty = 0,
        tz = 0,
        ratio = 1;
      if (thin) {
        // equal treatment of both ends: mean thin direction and mean aspect ratio
        const a = thin.dir[i],
          b = thin.dir[i + 1];
        const s = a.x * b.x + a.y * b.y + a.z * b.z < 0 ? -1 : 1;
        tx = a.x + s * b.x;
        ty = a.y + s * b.y;
        tz = a.z + s * b.z;
        const wide = 0.5 * (r[i] + r[i + 1]);
        const th = 0.5 * (Math.max(0.2, thin.r[i]) + Math.max(0.2, thin.r[i + 1]));
        ratio = wide > 0 ? Math.min(1, th / wide) : 1;
      }
      const a = pts[i],
        b = pts[i + 1];
      const hs = i > 0 && has[i] === 1;
      const he = i < ns - 1 && has[i + 1] === 1;
      // flat (cut) chain ends: a plane across the axis, its normal scaled by FLAT_END so the
      // integrator can tell it from a joint plane (the plane test only uses the sign)
      const fs = !!opt.flatEnds && i === 0 && len[0] > 1e-9;
      const fe = !!opt.flatEnds && i === ns - 1 && len[ns - 1] > 1e-9;
      // inward normals: the start plane faces along the chain, the end plane against it
      const idx = this.writeSeg(
        group, a.x, a.y, a.z, r[i], b.x, b.y, b.z, r[i + 1],
        cArr ? cArr[i] : (c as number), cArr ? cArr[i + 1] : (c as number), kArr ? 0.5 * (kArr[i] + kArr[i + 1]) : kConst,
        tx, ty, tz, ratio,
        hs ? pl[i * 3] : fs ? FLAT_END * dir[0] : 0,
        hs ? pl[i * 3 + 1] : fs ? FLAT_END * dir[1] : 0,
        hs ? pl[i * 3 + 2] : fs ? FLAT_END * dir[2] : 0,
        he ? -pl[(i + 1) * 3] : fe ? -FLAT_END * dir[i * 3] : 0,
        he ? -pl[(i + 1) * 3 + 1] : fe ? -FLAT_END * dir[i * 3 + 1] : 0,
        he ? -pl[(i + 1) * 3 + 2] : fe ? -FLAT_END * dir[i * 3 + 2] : 0,
        -1, -1, -1
      );
      if (prevOk) {
        this.ensurePrev();
        this.writePrev(idx, opt.prevPts![i], opt.prevPts![i + 1]);
      } else if (this.prev) this.writePrev(idx, a, b);
    }
    // across a joint without a plane the two sides overlap: each segment removes the chords of
    // the earlier segments it overlaps through such a joint (up to CHAIN_HOST_BACK back), as one
    // range in slot C. Segments in that range that are joined to this one by planes only add
    // nothing: their kept chords lie on the other side of a shared plane.
    for (let i = 1; i < ns; i++) {
      let open = false;
      let deepest = -1;
      for (let k = i - 1; k >= Math.max(0, i - CHAIN_HOST_BACK); k--) {
        if (has[k + 1] === 0) open = true;
        if (open && segOverlap(this.data, first + k, first + i)) deepest = k;
      }
      if (deepest >= 0) this.data[(first + i) * SEG_FLOATS + 15] = encodeHostRange(first + deepest, i - deepest);
    }
    return first;
  }

  finish(extra: Partial<Pick<SegmentBatch, "motion" | "gains">> = {}): SegmentBatch {
    return {
      count: this.n,
      data: this.data.subarray(0, this.n * SEG_FLOATS),
      groups: this.groups,
      prev: this.prev ? this.prev.subarray(0, this.n * PREV_FLOATS) : null,
      motion: extra.motion ?? null,
      gains: extra.gains,
      hostExtra: this.hostExtra.length ? Float32Array.from(this.hostExtra) : null,
    };
  }
}

// ---------------------------------------------------------------------------
// TubeSpec -> segments
// ---------------------------------------------------------------------------

export interface TubesToSegmentsOptions {
  /**
   * Automatic branch detection (default true): a tube whose first point coincides with a point
   * of another tube of the same material direction, and which then leaves it (its second point
   * is not that tube's neighbouring point), is a branch of it: its first segments, while they
   * start inside the parent's lumen, have the parent's chords there removed. Coaxial overlays
   * (a coil over a wire core, a calcium or stent shell on the lumen's points) are left alone,
   * so they add.
   */
  autoJoin?: boolean;
  /**
   * Explicit branch relation, overriding the automatic rule for a tube: the parent tube index
   * and the parent sample index the branch leaves from (or null for none).
   */
  parentOf?: (tube: TubeSpec, index: number) => { tube: number; at: number } | null | undefined;
  /** laminar profile depth k for a tube (default 0) */
  laminar?: (tube: TubeSpec, index: number) => number;
  /** the same tubes one frame earlier (matched by index and length), for motion blur and velocity */
  prevTubes?: TubeSpec[] | null;
  motion?: SegmentMotion | null;
  gains?: [number, number, number];
  /**
   * Union within vessel families (default true): overlaps between members of a branching tree
   * beyond the branch origins (siblings running into each other, a branch re-entering its
   * parent) are counted once. See familyOverlaps.
   */
  familyUnion?: boolean;
  /**
   * The previous frame's batch from the same tubes: when its topologyKey matches (same tubes,
   * point counts and materials), its branch and family host slots (A, B) are reused instead of
   * searched again, which is most of tubesToSegments' cost. Chain joints are always recomputed.
   */
  topologyFrom?: SegmentBatch | null;
}

interface Part {
  tube: number;
  dir: [number, number, number];
  mags: number[];
  key: string;
}

const EPS_DIR = 1e-6;

/** Split a tube's material into parts whose per-sample vectors share one direction. */
function materialParts(t: TubeSpec, index: number): Part[] {
  const n = t.pts.length;
  const per = Array.isArray(t.mu[0]);
  const muAt = (i: number): [number, number, number] => (per ? (t.mu as [number, number, number][])[i] : (t.mu as [number, number, number]));
  // dominant direction: the sample with the largest magnitude
  let best = -1,
    bm = 0;
  for (let i = 0; i < (per ? n : 1); i++) {
    const m = muAt(i);
    const l = Math.hypot(m[0], m[1], m[2]);
    if (l > bm) {
      bm = l;
      best = i;
    }
  }
  if (best < 0) return []; // nothing attenuates
  const m0 = muAt(best);
  const dir: [number, number, number] = [m0[0] / bm, m0[1] / bm, m0[2] / bm];
  let proportional = true;
  const mags: number[] = [];
  for (let i = 0; i < n; i++) {
    const m = muAt(i);
    const a = m[0] * dir[0] + m[1] * dir[1] + m[2] * dir[2];
    const rx = m[0] - a * dir[0],
      ry = m[1] - a * dir[1],
      rz = m[2] - a * dir[2];
    if (Math.hypot(rx, ry, rz) > EPS_DIR * Math.max(1e-9, Math.hypot(m[0], m[1], m[2]))) proportional = false;
    mags.push(a);
  }
  const key = (d: [number, number, number]) => d.map((x) => Math.round(x * 1e6)).join(",");
  if (proportional) return [{ tube: index, dir, mags, key: key(dir) }];
  // general case: one part per channel
  const out: Part[] = [];
  for (let ch = 0; ch < 3; ch++) {
    const mg: number[] = [];
    let any = false;
    for (let i = 0; i < n; i++) {
      const v = muAt(i)[ch];
      if (v !== 0) any = true;
      mg.push(v);
    }
    if (!any) continue;
    const d: [number, number, number] = [0, 0, 0];
    d[ch] = 1;
    out.push({ tube: index, dir: d, mags: mg, key: key(d) });
  }
  return out;
}

/**
 * A branch start may sit up to this far from the parent sample (mm); MODEL PARAMETER (0.1):
 * the coronary tree's branch starts are within 0.05 mm of their parent sample (measured).
 */
const BRANCH_TOL_MM = 0.1;
/** A branch's segments are checked against its parent up to this many from its start (MODEL PARAMETER). */
const BRANCH_SEGS_MAX = 16;
/** The outward scan along the parent stops after this many consecutive misses (MODEL PARAMETER). */
const BRANCH_SCAN_GAP = 3;

/**
 * Convert renderer ribbon tubes to segments unchanged in meaning: per-sample radius and
 * material, flattened cross-sections, negative inner shells (analytic hollow shells), with
 * joints and branch origins counted once. One material group per tube part.
 */
export function tubesToSegments(tubes: TubeSpec[], opt: TubesToSegmentsOptions = {}): SegmentBatch {
  const autoJoin = opt.autoJoin ?? true;
  const gb = new SegmentBatchBuilder(tubes.reduce((s, t) => s + Math.max(1, t.pts.length - 1), 0));
  // 1. material parts, one group each, emitted in tube order
  const partsOfTube: Part[][] = tubes.map(() => []);
  const firstSeg: number[][] = tubes.map(() => []);
  const groupOf: number[][] = tubes.map(() => []);
  // shells (a tube sharing another tube's points): open tubes, cut flat at their ends
  const shellTubes = new Set<number>();
  {
    const firstOwner = new Map<Vec3[], number>();
    tubes.forEach((t, i) => {
      const o = firstOwner.get(t.pts);
      if (o === undefined) firstOwner.set(t.pts, i);
      else {
        shellTubes.add(i);
        shellTubes.add(o);
      }
    });
  }
  tubes.forEach((t, i) => {
    if (t.pts.length === 0) return;
    for (const p of materialParts(t, i)) {
      const g = gb.addGroup(p.dir);
      partsOfTube[i].push(p);
      groupOf[i].push(g);
      const pt = opt.prevTubes?.[i];
      const prevPts = pt && pt.pts.length === t.pts.length ? pt.pts : undefined;
      const k = opt.laminar ? opt.laminar(t, i) : 0;
      firstSeg[i].push(gb.addChain(g, t.pts, t.r, p.mags, { k, thin: t.thin, prevPts, flatEnds: shellTubes.has(i) }));
    }
  });
  // 2. shells: a tube on another tube's points with a smaller radius; both surfaces carry the
  // wall thickness as their anti-aliasing feature
  const ownerOfPts = new Map<Vec3[], number>();
  tubes.forEach((t, i) => {
    if (!partsOfTube[i].length) return;
    const o = ownerOfPts.get(t.pts);
    if (o === undefined) {
      ownerOfPts.set(t.pts, i);
      return;
    }
    const outer = tubes[o];
    let wall = Infinity;
    for (let k = 0; k < t.r.length && k < outer.r.length; k++) wall = Math.min(wall, Math.abs(outer.r[k] - t.r[k]));
    if (!isFinite(wall)) return;
    for (const g of [...groupOf[i], ...groupOf[o]]) gb.groups[g].featureMm = Math.min(gb.groups[g].featureMm, Math.max(0.01, wall));
  });
  // 3. branch origins: the child's first segments, while they overlap the parent, remove the
  // chords of every parent segment they overlap (slot A: one contiguous range, found by scanning
  // outward from the branch point along the parent in both directions)
  const parentTube = new Int32Array(tubes.length).fill(-1);
  const linkBranch = (a: number, i: number, b: number) => {
    parentTube[b] = a;
    if (topo) return; // host slots come from the previous batch
    const A = tubes[a],
      B = tubes[b];
    for (let pa = 0; pa < partsOfTube[a].length; pa++)
      for (let pb = 0; pb < partsOfTube[b].length; pb++) {
        if (partsOfTube[a][pa].key !== partsOfTube[b][pb].key) continue;
        const fa = firstSeg[a][pa],
          fb = firstSeg[b][pb];
        const nA = Math.max(1, A.pts.length - 1);
        const nB = Math.max(1, B.pts.length - 1);
        const d = gb.data;
        for (let j = 0; j < nB && j < BRANCH_SEGS_MAX; j++) {
          const seg = fb + j;
          // scan until BRANCH_SCAN_GAP consecutive parent segments miss; the hits form one range
          // (gaps inside it are harmless: a host that misses this segment removes nothing)
          let lo = Infinity,
            hi = -Infinity;
          for (const dir of [-1, 1]) {
            let miss = 0;
            for (let k = dir < 0 ? Math.min(i - 1, nA - 1) : Math.max(0, i); k >= 0 && k < nA; k += dir) {
              if (segOverlap(d, fa + k, seg)) {
                miss = 0;
                lo = Math.min(lo, k);
                hi = Math.max(hi, k);
              } else if (++miss >= BRANCH_SCAN_GAP) break;
            }
          }
          if (lo > hi) break;
          // clamp an over-long run around the branch point (not seen on the coronary tree; the
          // family pass below still catches what is left out)
          if (hi - lo + 1 > HOST_RANGE_MAX) {
            lo = Math.max(lo, Math.min(i - (HOST_RANGE_MAX >> 1), hi - HOST_RANGE_MAX + 1));
            hi = lo + HOST_RANGE_MAX - 1;
          }
          gb.setHostRange(seg, 0, fa + lo, hi - lo + 1);
        }
      }
  };
  // host slots A and B reused from the previous frame's batch when the layout is the same
  const topoKey = topologyKeyOf(tubes, partsOfTube);
  const topo = opt.topologyFrom && opt.topologyFrom.topologyKey === topoKey && opt.topologyFrom.count === gb.count ? opt.topologyFrom : null;
  const done = new Set<number>();
  // with reused host slots the links are not needed (they only feed the slots)
  if (opt.parentOf && !topo) {
    tubes.forEach((t, b) => {
      const p = opt.parentOf!(t, b);
      if (p === undefined) return;
      done.add(b);
      if (p && p.tube !== b && tubes[p.tube] && p.at >= 0 && p.at < tubes[p.tube].pts.length) linkBranch(p.tube, p.at, b);
    });
  }
  if (autoJoin && tubes.length > 1 && !topo) {
    // first points in a hash of 1 mm cells, entered in all 27 cells around them, so a query of one
    // cell finds starts within the tolerance
    const size = 1 << Math.ceil(Math.log2(Math.max(64, tubes.length * 64)));
    const head = new Int32Array(size).fill(-1);
    const nextE: number[] = [];
    const tubeE: number[] = [];
    const cellHash = (x: number, y: number, z: number) => ((Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 0) & (size - 1);
    tubes.forEach((t, i) => {
      if (t.pts.length < 2 || !partsOfTube[i].length || done.has(i)) return;
      const p = t.pts[0];
      const cx = Math.round(p.x),
        cy = Math.round(p.y),
        cz = Math.round(p.z);
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++)
          for (let dz = -1; dz <= 1; dz++) {
            const h = cellHash(cx + dx, cy + dy, cz + dz);
            nextE.push(head[h]);
            tubeE.push(i);
            head[h] = nextE.length - 1;
          }
    });
    for (let a = 0; a < tubes.length; a++) {
      if (!partsOfTube[a].length) continue;
      const T = tubes[a];
      const P = T.pts;
      for (let i = 0; i < P.length; i++) {
        let e = head[cellHash(Math.round(P[i].x), Math.round(P[i].y), Math.round(P[i].z))];
        while (e >= 0) {
          const b = tubeE[e];
          e = nextE[e];
          if (b === a || done.has(b)) continue;
          const B = tubes[b];
          if (B.pts === P) continue;
          // a start on (or within a tenth of a millimetre of) one of A's samples
          const tol = Math.min(BRANCH_TOL_MM, 0.25 * Math.min(T.r[i], B.r[0]));
          if (dist(B.pts[0], P[i]) > tol) continue;
          // coaxial overlay: B continues along A's own points (shared or sliced points)
          const ov = (i + 1 < P.length && dist(B.pts[1], P[i + 1]) <= tol) || (i > 0 && dist(B.pts[1], P[i - 1]) <= tol);
          if (ov) continue;
          linkBranch(a, i, b);
          done.add(b);
        }
      }
    }
  }
  let unresolved = 0;
  if (topo) {
    const d = gb.data,
      t = topo.data;
    for (let i = 0; i < gb.count; i++) {
      d[i * SEG_FLOATS + 19] = t[i * SEG_FLOATS + 19];
      d[i * SEG_FLOATS + 23] = t[i * SEG_FLOATS + 23];
    }
    if (topo.hostExtra) gb.hostExtra = Array.from(topo.hostExtra);
    unresolved = topo.unresolvedOverlaps ?? 0;
  } else if (opt.familyUnion ?? true) unresolved = familyOverlaps(gb, tubes, partsOfTube, firstSeg, parentTube, shellTubes);
  const out = gb.finish({ motion: opt.motion ?? null, gains: opt.gains });
  out.topologyKey = topoKey;
  out.unresolvedOverlaps = unresolved;
  return out;
}

/** Layout signature: same tubes, point counts and material parts give the same segment indices. */
function topologyKeyOf(tubes: TubeSpec[], parts: Part[][]): string {
  let h = 2166136261;
  const mix = (x: number) => {
    h = Math.imul(h ^ x, 16777619) >>> 0;
  };
  mix(tubes.length);
  for (let i = 0; i < tubes.length; i++) {
    mix(tubes[i].pts.length);
    mix(parts[i].length);
    for (const p of parts[i]) for (let k = 0; k < p.key.length; k++) mix(p.key.charCodeAt(k));
  }
  return `${tubes.length}:${h.toString(16)}`;
}

/** Spatial hash cell for the family pass, mm (MODEL PARAMETER: about a coronary diameter). */
const FAMILY_CELL_MM = 2;

/**
 * Overlaps within a vessel family (a tree joined by branch links) that the chain joints and the
 * branch-origin ranges do not cover: siblings or cousins that run into each other, a branch that
 * re-enters its parent beyond its origin, a twig that reaches its grandparent. Every segment gets
 * a priority (tree depth of its tube, then tube index, then segment index); a segment removes
 * the chords of the overlapping segments of higher priority (lower depth, earlier tube) that it
 * does not already list, as up to two contiguous ranges in its free slots (B, then A). All host
 * relations point from lower to higher priority, so they cannot form a cycle, and every point
 * inside several members of a family is counted once, by its highest-priority member, as long as
 * no segment needs more ranges than it has free slots. Returns the number of overlapping pairs
 * left unresolved (they add, as before).
 */
function familyOverlaps(gb: SegmentBatchBuilder, tubes: TubeSpec[], partsOfTube: Part[][], firstSeg: number[][], parentTube: Int32Array, shellTubes: Set<number>): number {
  const nT = tubes.length;
  // depth and family (root) per tube; a cycle in the links (malformed input) stops the walk
  const depth = new Int32Array(nT).fill(-1);
  const root = new Int32Array(nT).fill(-1);
  for (let t = 0; t < nT; t++) {
    let r = t,
      dd = 0;
    while (parentTube[r] >= 0 && dd <= nT) {
      r = parentTube[r];
      dd++;
    }
    depth[t] = dd;
    root[t] = r;
  }
  // segment -> tube, part key id; only tubes in a family of two or more, not shells
  const inFamily = new Uint8Array(nT);
  for (let t = 0; t < nT; t++) if (parentTube[t] >= 0 && !shellTubes.has(t) && !shellTubes.has(root[t])) inFamily[t] = inFamily[root[t]] = 1;
  const n = gb.count;
  const segTube = new Int32Array(n).fill(-1);
  const segKey = new Int32Array(n).fill(-1);
  const keyId = new Map<string, number>();
  let any = false;
  for (let t = 0; t < nT; t++) {
    if (!inFamily[t]) continue;
    const ns = Math.max(1, tubes[t].pts.length - 1);
    partsOfTube[t].forEach((p, k) => {
      let id = keyId.get(p.key);
      if (id === undefined) keyId.set(p.key, (id = keyId.size));
      for (let j = 0; j < ns; j++) {
        segTube[firstSeg[t][k] + j] = t;
        segKey[firstSeg[t][k] + j] = id;
      }
      any = true;
    });
  }
  if (!any) return 0;
  const d = gb.data;
  // segment AABBs into a hash of FAMILY_CELL_MM cells
  const size = 1 << Math.ceil(Math.log2(Math.max(1024, n * 16)));
  const head = new Int32Array(size).fill(-1);
  let nextE = new Int32Array(n * 8);
  let segE = new Int32Array(n * 8);
  let nE = 0;
  const cellHash = (x: number, y: number, z: number) => ((Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 0) & (size - 1);
  const box = new Int32Array(n * 6);
  const inv = 1 / FAMILY_CELL_MM;
  for (let i = 0; i < n; i++) {
    if (segTube[i] < 0) continue;
    const o = i * SEG_FLOATS;
    const r = Math.max(d[o + 3], d[o + 7]);
    for (let k = 0; k < 3; k++) {
      box[i * 6 + k] = Math.floor((Math.min(d[o + k], d[o + 4 + k]) - r) * inv);
      box[i * 6 + 3 + k] = Math.floor((Math.max(d[o + k], d[o + 4 + k]) + r) * inv);
    }
    for (let x = box[i * 6]; x <= box[i * 6 + 3]; x++)
      for (let y = box[i * 6 + 1]; y <= box[i * 6 + 4]; y++)
        for (let z = box[i * 6 + 2]; z <= box[i * 6 + 5]; z++) {
          const h = cellHash(x, y, z);
          if (nE === nextE.length) {
            const a = new Int32Array(nE * 2),
              b = new Int32Array(nE * 2);
            a.set(nextE);
            b.set(segE);
            nextE = a;
            segE = b;
          }
          nextE[nE] = head[h];
          segE[nE] = i;
          head[h] = nE++;
        }
  }
  const lists = (i: number, j: number) => {
    // does segment i already name j in one of its host slots?
    for (const off of HOST_SLOT_OFFSETS) {
      const v = d[i * SEG_FLOATS + off];
      const [f, c] = decodeHostSlot(v);
      if (c > 0 ? j >= f && j < f + c : c < 0 && expandHostSlot(v, gb.hostExtra).includes(j)) return true;
    }
    return false;
  };
  // higher priority: lower depth, then lower tube index, then lower segment index
  const before = (j: number, i: number) => {
    const tj = segTube[j],
      ti = segTube[i];
    if (depth[tj] !== depth[ti]) return depth[tj] < depth[ti];
    if (tj !== ti) return tj < ti;
    return j < i;
  };
  const stamp = new Int32Array(n).fill(-1);
  let unresolved = 0;
  const hits: number[] = [];
  for (let i = 0; i < n; i++) {
    const ti = segTube[i];
    if (ti < 0) continue;
    hits.length = 0;
    for (let x = box[i * 6]; x <= box[i * 6 + 3]; x++)
      for (let y = box[i * 6 + 1]; y <= box[i * 6 + 4]; y++)
        for (let z = box[i * 6 + 2]; z <= box[i * 6 + 5]; z++) {
          for (let e = head[cellHash(x, y, z)]; e >= 0; e = nextE[e]) {
            const j = segE[e];
            if (stamp[j] === i) continue;
            stamp[j] = i;
            const tj = segTube[j];
            // the same tube is the chain's business; other families and materials add
            if (tj === ti || root[tj] !== root[ti] || segKey[j] !== segKey[i]) continue;
            if (!before(j, i) || !segOverlap(d, i, j) || lists(i, j) || lists(j, i)) continue;
            hits.push(j);
          }
        }
    if (!hits.length) continue;
    // one range per tube, nearest tubes first, into the free slots (B, then A)
    const byTube = new Map<number, [number, number, number]>();
    for (const j of hits) {
      const tj = segTube[j];
      const dj = segSegDist(d, i, j);
      const cur = byTube.get(tj);
      if (!cur) byTube.set(tj, [j, j, dj]);
      else {
        cur[0] = Math.min(cur[0], j);
        cur[1] = Math.max(cur[1], j);
        cur[2] = Math.min(cur[2], dj);
      }
    }
    const runs = [...byTube.values()].sort((a, b) => a[2] - b[2]);
    const vals: number[] = [];
    for (const [lo, hi] of runs) {
      // an over-long run is split into ranges of at most HOST_RANGE_MAX
      for (let f = lo; f <= hi; f += HOST_RANGE_MAX) vals.push(encodeHostRange(f, Math.min(HOST_RANGE_MAX, hi - f + 1)));
    }
    const freeB = d[i * SEG_FLOATS + 23] === -1,
      freeA = d[i * SEG_FLOATS + 19] === -1;
    if (vals.length <= (freeB ? 1 : 0) + (freeA ? 1 : 0)) {
      if (freeB) d[i * SEG_FLOATS + 23] = vals.shift()!;
      if (vals.length) d[i * SEG_FLOATS + 19] = vals.shift()!;
    } else {
      // more than the free slots: slots A and B and the new runs go to one extension list in A
      const all = [d[i * SEG_FLOATS + 19], d[i * SEG_FLOATS + 23]].filter((v) => v !== -1);
      if (all.some((v) => decodeHostSlot(v)[1] < 0)) {
        unresolved += vals.length; // already an extension list (not produced by this pass)
        continue;
      }
      d[i * SEG_FLOATS + 23] = -1;
      unresolved += gb.setHostList(i, 0, [...all, ...vals]);
    }
  }
  return unresolved;
}

/**
 * Feature flag helper: move a scene's tubes onto the segment pass. Returns a new scene whose
 * `tubes` holds only the tubes `keep` selects (default none) and whose `extra.segments` holds
 * the rest as a SegmentBatch.
 */
export function segmentsFromScene<S extends XrayLikeScene>(scene: S, opt: TubesToSegmentsOptions & { keep?: (t: TubeSpec) => boolean } = {}): S {
  const keep = opt.keep ?? (() => false);
  const kept: TubeSpec[] = [];
  const moved: TubeSpec[] = [];
  for (const t of scene.tubes) (keep(t) ? kept : moved).push(t);
  const batch = tubesToSegments(moved, opt);
  return { ...scene, tubes: kept, extra: { ...(scene.extra ?? {}), segments: batch } };
}
