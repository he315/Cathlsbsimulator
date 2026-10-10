// ---------------------------------------------------------------------------
// Discrete Cosserat rod: a chain of short rigid segments ("bodies"), each with
// a centre position and an orientation quaternion, joined end to end by joints
// that carry the rod's elasticity (stretch/shear, bending, torsion).
//
// Conventions
// - Bodies are ordered hub (index 0) to tip (index n-1).
// - Each body's local z axis (d3) is the rod tangent pointing towards the tip;
//   local x and y (d1, d2) are the material directors. A rest curvature that
//   bends the rod towards +d1 is a positive rotation about +d2.
// - Material coordinate u is the distance from the device tip (u = 0 at the
//   tip), so catheter shapes are written "from the tip back".
// - Units: millimetres, seconds, newtons. Bending stiffness EI in N·mm²,
//   torsional stiffness GJ in N·mm², axial stiffness EA in N.
// - Joint k joins body k (proximal, "a") and body k+1 (distal, "b").
//
// Masses are not physical: the rod lives in blood, where viscous drag makes
// its motion quasi-static at frame rates (see facts/S7.md). Each body gets a
// drag "mass" m = c·l·h (c a drag coefficient per unit length, a model
// parameter) so an XPBD step is an implicit, overdamped (gradient-flow) step.
// ---------------------------------------------------------------------------

import { qexp, qfromFrame, qmul, qrot } from "./math3";

/** A material profile along the device, indexed by distance from the tip (mm). */
export type Profile = (u: number) => number;

/** Rest curvature (local rotation rate, 1/mm) at material distance u from the tip. */
export type CurvatureProfile = (u: number, out: Float64Array) => void;

export interface RodSpec {
  /** stable identifier, e.g. "JL4" or "wire035J" */
  id: string;
  /** total device length (mm) */
  length: number;
  /** contact (outer) radius (mm) */
  radius: number;
  /** lumen radius for nested devices (mm); 0 for a solid wire */
  innerRadius: number;
  /** bending stiffness EI(u) (N·mm²) */
  EI: Profile;
  /** torsional stiffness GJ(u) (N·mm²) */
  GJ: Profile;
  /** axial stiffness EA (N) */
  EA: number;
  /** rest curvature (rotation per mm, in the material frame) */
  rest: CurvatureProfile;
  /** static and kinetic Coulomb friction against the vessel wall */
  muStatic: number;
  muKinetic: number;
  /** segment lengths: fine near the tip, coarse along the shaft */
  segFine: number;
  segFineZone: number;
  segCoarse: number;
}

export interface RodParams {
  /** substep (s) */
  h: number;
  /** lateral drag per unit length (N·s/mm²) — model parameter, see facts/S7.md */
  dragLat: number;
  /** axial-spin drag per unit length (N·mm·s/mm) — model parameter */
  dragSpin: number;
}

/** Segment lengths from hub to tip for a device. */
export function segmentLengths(spec: Pick<RodSpec, "length" | "segFine" | "segFineZone" | "segCoarse">): number[] {
  const out: number[] = [];
  let u = 0;
  let l = spec.segFine;
  while (u < spec.length - 1e-9) {
    if (u >= spec.segFineZone) l = Math.min(spec.segCoarse, l * 1.3);
    let take = Math.min(l, spec.length - u);
    // avoid a sliver at the hub: merge it into the previous segment
    if (spec.length - u - take < 0.35 * l && spec.length - u - take > 0) take = spec.length - u;
    out.push(take);
    u += take;
  }
  return out.reverse();
}

export class Rod {
  readonly spec: RodSpec;
  readonly n: number;
  /** body lengths (hub → tip) */
  readonly len: Float64Array;
  /** material distance from the tip to each body centre */
  readonly u: Float64Array;
  /** material distance from the tip to each joint */
  readonly uJ: Float64Array;
  pos: Float64Array;
  quat: Float64Array;
  prevPos: Float64Array;
  prevQuat: Float64Array;
  /** inverse translational drag-mass per body */
  w: Float64Array;
  /** inverse rotational inertia perpendicular / about the axis */
  ip: Float64Array;
  ia: Float64Array;
  /** kinematic bodies (moved by the hands, not the solver) */
  kin: Uint8Array;
  /** rest relative rotation per joint (quaternion, local frame of body a) */
  restQ: Float64Array;
  /** rest rotation vector per joint (for composite blending) */
  restRot: Float64Array;
  /** compliance per joint: stretch (mm/N), bend and twist (1/(N·mm)) */
  alS: Float64Array;
  alB: Float64Array;
  alT: Float64Array;
  /** stiffness per joint (cached for composite blending) */
  EIj: Float64Array;
  GJj: Float64Array;
  /** accumulated Lagrange multipliers (6 per joint) within the current substep */
  lambda: Float64Array;
  /** generalised external force per body (fx fy fz tx ty tz), cleared each substep */
  fext: Float64Array;
  /** contact radius per body */
  radius: Float64Array;
  /** joint lengths */
  readonly Lj: Float64Array;

  // contact state, per body
  cActive: Uint8Array;
  cN: Float64Array; // normal force (N), lagged one substep
  cNrm: Float64Array; // outward wall normal (3)
  cMu: Float64Array; // friction coefficient for this contact
  cEta: Float64Array; // linearised friction (N·s/mm)
  cSlip: Float64Array; // slip speed (mm/s), last substep
  cRegion: Int16Array; // region code of the lumen in contact
  cMoved: Float64Array; // contact-point displacement during the substep (3)

  constructor(spec: RodSpec, params: RodParams, lengths?: number[]) {
    this.spec = spec;
    const lens = lengths ?? segmentLengths(spec);
    const n = lens.length;
    this.n = n;
    this.len = Float64Array.from(lens);
    this.u = new Float64Array(n);
    let acc = 0;
    for (let i = n - 1; i >= 0; i--) {
      this.u[i] = acc + lens[i] / 2;
      acc += lens[i];
    }
    this.uJ = new Float64Array(Math.max(0, n - 1));
    this.Lj = new Float64Array(Math.max(0, n - 1));
    for (let k = 0; k < n - 1; k++) {
      this.uJ[k] = this.u[k + 1] + lens[k + 1] / 2;
      this.Lj[k] = 0.5 * (lens[k] + lens[k + 1]);
    }
    this.pos = new Float64Array(3 * n);
    this.quat = new Float64Array(4 * n);
    this.prevPos = new Float64Array(3 * n);
    this.prevQuat = new Float64Array(4 * n);
    for (let i = 0; i < n; i++) this.quat[4 * i + 3] = 1;
    this.w = new Float64Array(n);
    this.ip = new Float64Array(n);
    this.ia = new Float64Array(n);
    this.kin = new Uint8Array(n);
    const J = Math.max(0, n - 1);
    this.restQ = new Float64Array(4 * J);
    this.restRot = new Float64Array(3 * J);
    this.alS = new Float64Array(J);
    this.alB = new Float64Array(J);
    this.alT = new Float64Array(J);
    this.EIj = new Float64Array(J);
    this.GJj = new Float64Array(J);
    this.lambda = new Float64Array(6 * J);
    this.fext = new Float64Array(6 * n);
    this.radius = new Float64Array(n).fill(spec.radius);
    this.cActive = new Uint8Array(n);
    this.cN = new Float64Array(n);
    this.cNrm = new Float64Array(3 * n);
    this.cMu = new Float64Array(n);
    this.cEta = new Float64Array(n);
    this.cSlip = new Float64Array(n);
    this.cRegion = new Int16Array(n).fill(-1);
    this.cMoved = new Float64Array(3 * n);
    this.setMasses(params);
    this.setMaterial(spec);
  }

  /** Drag masses for the current substep. */
  setMasses(p: RodParams): void {
    for (let i = 0; i < this.n; i++) {
      const l = this.len[i];
      const m = p.dragLat * l * p.h;
      this.w[i] = 1 / m;
      // perpendicular rotation: a slender segment rotating about its centre
      const Ip = m * (l * l) / 12 + m * this.spec.radius * this.spec.radius * 0.25;
      this.ip[i] = 1 / Ip;
      const Ia = p.dragSpin * l * p.h;
      this.ia[i] = 1 / Ia;
    }
  }

  /** Stiffness and rest shape from the device spec (no nesting). */
  setMaterial(spec: RodSpec): void {
    const k3 = new Float64Array(3);
    for (let k = 0; k < this.n - 1; k++) {
      const u = this.uJ[k];
      // body 0 is the hub, held rigidly by the hand: the first joint only spans half of body 1
      const L = k === 0 ? this.len[1] / 2 : this.Lj[k];
      const EI = spec.EI(u);
      const GJ = spec.GJ(u);
      this.EIj[k] = EI;
      this.GJj[k] = GJ;
      this.alB[k] = L / EI;
      this.alT[k] = L / GJ;
      this.alS[k] = L / spec.EA;
      spec.rest(u, k3);
      this.restRot[3 * k] = k3[0] * L;
      this.restRot[3 * k + 1] = k3[1] * L;
      this.restRot[3 * k + 2] = k3[2] * L;
      qexp(k3[0] * L, k3[1] * L, k3[2] * L, this.restQ, 4 * k);
    }
  }

  /** Set the rest rotation of joint k from a rotation vector (radians, local frame). */
  setRest(k: number, rx: number, ry: number, rz: number): void {
    this.restRot[3 * k] = rx;
    this.restRot[3 * k + 1] = ry;
    this.restRot[3 * k + 2] = rz;
    qexp(rx, ry, rz, this.restQ, 4 * k);
  }

  /** Place the rod along a polyline so its tip sits at arclength sTip; frames by parallel transport. */
  placeAlong(path: ArrayLike<number>, sTip: number, roll = 0): void {
    const np = path.length / 3;
    const cum = new Float64Array(np);
    for (let i = 1; i < np; i++) {
      cum[i] = cum[i - 1] + Math.hypot(path[3 * i] - path[3 * i - 3], path[3 * i + 1] - path[3 * i - 2], path[3 * i + 2] - path[3 * i - 1]);
    }
    const at = (s: number, out: number[]) => {
      const total = cum[np - 1];
      let ss = s;
      let i = 0;
      if (ss <= 0) {
        // extrapolate backwards along the first segment
        const dx = path[3] - path[0], dy = path[4] - path[1], dz = path[5] - path[2];
        const l = Math.hypot(dx, dy, dz) || 1;
        out[0] = path[0] + (dx / l) * ss;
        out[1] = path[1] + (dy / l) * ss;
        out[2] = path[2] + (dz / l) * ss;
        out[3] = dx / l; out[4] = dy / l; out[5] = dz / l;
        return;
      }
      if (ss >= total) {
        // extrapolate forwards along the last segment
        const o = 3 * (np - 2);
        const dx = path[o + 3] - path[o], dy = path[o + 4] - path[o + 1], dz = path[o + 5] - path[o + 2];
        const l = Math.hypot(dx, dy, dz) || 1;
        const e = ss - total;
        out[0] = path[o + 3] + (dx / l) * e;
        out[1] = path[o + 4] + (dy / l) * e;
        out[2] = path[o + 5] + (dz / l) * e;
        out[3] = dx / l; out[4] = dy / l; out[5] = dz / l;
        return;
      }
      while (i < np - 2 && cum[i + 1] < ss) i++;
      const t = (ss - cum[i]) / Math.max(1e-9, cum[i + 1] - cum[i]);
      const dx = path[3 * i + 3] - path[3 * i], dy = path[3 * i + 4] - path[3 * i + 1], dz = path[3 * i + 5] - path[3 * i + 2];
      const l = Math.hypot(dx, dy, dz) || 1;
      out[0] = path[3 * i] + dx * t;
      out[1] = path[3 * i + 1] + dy * t;
      out[2] = path[3 * i + 2] + dz * t;
      out[3] = dx / l; out[4] = dy / l; out[5] = dz / l;
    };
    // body centres from the tip backwards
    const p = [0, 0, 0, 0, 0, 0];
    let s = sTip;
    const centres: number[][] = [];
    for (let i = this.n - 1; i >= 0; i--) {
      const l = this.len[i];
      at(s - l / 2, p);
      centres[i] = [p[0], p[1], p[2], p[3], p[4], p[5]];
      s -= l;
    }
    // parallel transport a reference normal from the hub
    let nx = 0, ny = 0, nz = 1;
    {
      const t = centres[0];
      // choose a normal not parallel to the tangent
      if (Math.abs(t[5]) > 0.9) { nx = 1; ny = 0; nz = 0; }
      const d = nx * t[3] + ny * t[4] + nz * t[5];
      nx -= d * t[3]; ny -= d * t[4]; nz -= d * t[5];
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
    }
    let ptx = centres[0][3], pty = centres[0][4], ptz = centres[0][5];
    for (let i = 0; i < this.n; i++) {
      const c = centres[i];
      const tx = c[3], ty = c[4], tz = c[5];
      // transport n from previous tangent to this tangent
      const d = nx * tx + ny * ty + nz * tz;
      nx -= d * tx; ny -= d * ty; nz -= d * tz;
      let l = Math.hypot(nx, ny, nz);
      if (l < 1e-6) {
        // tangent flipped: rebuild from previous tangent
        nx = pty * tz - ptz * ty; ny = ptz * tx - ptx * tz; nz = ptx * ty - pty * tx;
        l = Math.hypot(nx, ny, nz) || 1;
      }
      nx /= l; ny /= l; nz /= l;
      // apply roll about the tangent
      const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
      const cr = Math.cos(roll), sr = Math.sin(roll);
      const d1x = nx * cr + bx * sr, d1y = ny * cr + by * sr, d1z = nz * cr + bz * sr;
      const d2x = ty * d1z - tz * d1y, d2y = tz * d1x - tx * d1z, d2z = tx * d1y - ty * d1x;
      this.pos[3 * i] = c[0];
      this.pos[3 * i + 1] = c[1];
      this.pos[3 * i + 2] = c[2];
      qfromFrame(d1x, d1y, d1z, d2x, d2y, d2z, tx, ty, tz, this.quat, 4 * i);
      ptx = tx; pty = ty; ptz = tz;
    }
    this.prevPos.set(this.pos);
    this.prevQuat.set(this.quat);
    this.lambda.fill(0);
  }

  /** Place the rod in its rest shape starting from a clamped hub pose (for free-space tests). */
  placeRest(hx: number, hy: number, hz: number, hubQ: ArrayLike<number>): void {
    const q = new Float64Array(4);
    q[0] = hubQ[0]; q[1] = hubQ[1]; q[2] = hubQ[2]; q[3] = hubQ[3];
    const tmp = new Float64Array(4);
    const v = new Float64Array(3);
    // body 0 centre such that it starts at the hub point
    qrot(q, 0, 0, 0, this.len[0] / 2, v, 0);
    let ex = hx + 2 * v[0], ey = hy + 2 * v[1], ez = hz + 2 * v[2];
    this.pos[0] = hx + v[0]; this.pos[1] = hy + v[1]; this.pos[2] = hz + v[2];
    this.quat.set(q, 0);
    for (let i = 1; i < this.n; i++) {
      qmul(q, 0, this.restQ, 4 * (i - 1), tmp, 0);
      q.set(tmp);
      qrot(q, 0, 0, 0, this.len[i] / 2, v, 0);
      this.pos[3 * i] = ex + v[0];
      this.pos[3 * i + 1] = ey + v[1];
      this.pos[3 * i + 2] = ez + v[2];
      ex += 2 * v[0]; ey += 2 * v[1]; ez += 2 * v[2];
      this.quat.set(q, 4 * i);
    }
    this.prevPos.set(this.pos);
    this.prevQuat.set(this.quat);
    this.lambda.fill(0);
  }

  /** World tangent (local z) of body i into out[oo..]. */
  tangent(i: number, out: Float64Array, oo: number): void {
    qrot(this.quat, 4 * i, 0, 0, 1, out, oo);
  }

  /** Endpoint of body i: side = +1 distal end, -1 proximal end. */
  endPoint(i: number, side: number, out: Float64Array, oo: number): void {
    qrot(this.quat, 4 * i, 0, 0, side * this.len[i] / 2, out, oo);
    out[oo] += this.pos[3 * i];
    out[oo + 1] += this.pos[3 * i + 1];
    out[oo + 2] += this.pos[3 * i + 2];
  }

  /** Centreline nodes (n+1 points: the proximal end of each body and the tip). */
  nodes(out: Float32Array | Float64Array, oo = 0): number {
    const tmp = new Float64Array(3);
    for (let i = 0; i < this.n; i++) {
      this.endPoint(i, -1, tmp, 0);
      out[oo + 3 * i] = tmp[0];
      out[oo + 3 * i + 1] = tmp[1];
      out[oo + 3 * i + 2] = tmp[2];
    }
    this.endPoint(this.n - 1, 1, tmp, 0);
    out[oo + 3 * this.n] = tmp[0];
    out[oo + 3 * this.n + 1] = tmp[1];
    out[oo + 3 * this.n + 2] = tmp[2];
    return this.n + 1;
  }

  /** Total elastic energy stored in the joints (N·mm), relative to the rest shape; stretch optional. */
  elasticEnergy(includeStretch = true): number {
    const d = new Float64Array(4);
    const t = new Float64Array(4);
    const ra = new Float64Array(3);
    const rb = new Float64Array(3);
    let E = 0;
    for (let k = 0; k < this.n - 1; k++) {
      const a = k, b = k + 1;
      // relative rotation deviation d = conj(r0) ⊗ conj(qa) ⊗ qb
      const qa = 4 * a, qb = 4 * b;
      const cqa = [-this.quat[qa], -this.quat[qa + 1], -this.quat[qa + 2], this.quat[qa + 3]];
      qmul(cqa, 0, this.quat, qb, t, 0);
      const r = 4 * k;
      const cr = [-this.restQ[r], -this.restQ[r + 1], -this.restQ[r + 2], this.restQ[r + 3]];
      qmul(cr, 0, t, 0, d, 0);
      const sgn = d[3] < 0 ? -1 : 1;
      const cx = 2 * sgn * d[0], cy = 2 * sgn * d[1], cz = 2 * sgn * d[2];
      E += 0.5 * (cx * cx + cy * cy) / this.alB[k] + 0.5 * (cz * cz) / this.alT[k];
      if (!includeStretch) continue;
      qrot(this.quat, qa, 0, 0, this.len[a] / 2, ra, 0);
      qrot(this.quat, qb, 0, 0, -this.len[b] / 2, rb, 0);
      const sx = this.pos[3 * a] + ra[0] - this.pos[3 * b] - rb[0];
      const sy = this.pos[3 * a + 1] + ra[1] - this.pos[3 * b + 1] - rb[1];
      const sz = this.pos[3 * a + 2] + ra[2] - this.pos[3 * b + 2] - rb[2];
      E += 0.5 * (sx * sx + sy * sy + sz * sz) / this.alS[k];
    }
    return E;
  }
}
