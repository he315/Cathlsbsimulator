// ---------------------------------------------------------------------------
// Direct XPBD solver for one discrete Cosserat rod.
//
// Each joint carries six constraint rows: three zero-stretch rows (the ends of
// neighbouring segments coincide; compliance from the axial stiffness EA) and
// three bend/twist rows on the relative rotation of the two segments
// (compliance L/EI about the bending axes and L/GJ about the tangent). The
// rows are linearised and the XPBD update (Macklin et al. 2016)
//
//     (J W Jᵀ + α/h²) Δλ = −C − (α/h²) λ
//
// is solved exactly. Because a joint only touches its two segments, the matrix
// is block tridiagonal (6×6 blocks) and a block-Cholesky/Thomas sweep solves it
// in O(n). This follows the direct solver for stiff rods of Deul et al. (2018),
// restricted to a chain. A direct solve propagates hub push and hub torque
// along the whole device in a single iteration, which Gauss–Seidel cannot do.
//
// Contacts and friction are folded in per segment before the solve: the
// segment's 6×6 mobility W is replaced by W' with the wall-normal direction
// removed and the tangential directions damped (see contact.ts). Kinematic
// segments (the hub held by the hand, a clamp) get W' = 0.
// ---------------------------------------------------------------------------

import { Rod } from "./rod";
import { chol6, qaddRot, qmul, qrot } from "./math3";

export class RodWorkspace {
  readonly n: number;
  Wp: Float64Array; // 36 per body
  Ja: Float64Array; // 36 per joint (with respect to body a = k)
  Jb: Float64Array; // 36 per joint (with respect to body b = k+1)
  Akk: Float64Array;
  Aoff: Float64Array;
  D: Float64Array;
  G: Float64Array;
  C: Float64Array;
  y: Float64Array;
  dl: Float64Array;
  Ta: Float64Array;
  Tb: Float64Array;
  q4: Float64Array;
  v3: Float64Array;
  v6: Float64Array;
  /** per-body displacement of the current iteration (6 per body) */
  delta: Float64Array;
  /** per-iteration body displacement magnitude (for diagnostics) */
  maxMove = 0;
  /** smallest step scale applied by the trust region in the last iteration (1 = full step) */
  stepScale = 1;
  /** per-body step scale of the last iteration */
  scale: Float64Array;
  failed = 0;

  constructor(n: number) {
    this.n = n;
    const J = Math.max(1, n - 1);
    this.Wp = new Float64Array(36 * n);
    this.Ja = new Float64Array(36 * J);
    this.Jb = new Float64Array(36 * J);
    this.Akk = new Float64Array(36 * J);
    this.Aoff = new Float64Array(36 * J);
    this.D = new Float64Array(36 * J);
    this.G = new Float64Array(36 * J);
    this.C = new Float64Array(6 * J);
    this.y = new Float64Array(6 * J);
    this.dl = new Float64Array(6 * J);
    this.Ta = new Float64Array(36);
    this.Tb = new Float64Array(36);
    this.q4 = new Float64Array(16);
    this.v3 = new Float64Array(12);
    this.v6 = new Float64Array(12);
    this.delta = new Float64Array(6 * n);
    this.scale = new Float64Array(n).fill(1);
  }
}

/** Base mobility (inverse drag-mass and inertia) of body i into ws.Wp; zero for kinematic bodies. */
export function baseMobility(rod: Rod, ws: RodWorkspace, i: number): void {
  const o = 36 * i;
  const W = ws.Wp;
  for (let k = 0; k < 36; k++) W[o + k] = 0;
  if (rod.kin[i]) return;
  const w = rod.w[i];
  W[o] = w;
  W[o + 7] = w;
  W[o + 14] = w;
  const t = ws.v3;
  qrot(rod.quat, 4 * i, 0, 0, 1, t, 0);
  const ax = t[0], ay = t[1], az = t[2];
  const ip = rod.ip[i], d = rod.ia[i] - ip;
  // rotational block at rows/cols 3..5: ip I + (ia - ip) a aᵀ
  W[o + 21] = ip + d * ax * ax;
  W[o + 22] = d * ax * ay;
  W[o + 23] = d * ax * az;
  W[o + 27] = d * ay * ax;
  W[o + 28] = ip + d * ay * ay;
  W[o + 29] = d * ay * az;
  W[o + 33] = d * az * ax;
  W[o + 34] = d * az * ay;
  W[o + 35] = ip + d * az * az;
}

/** Constraint values and Jacobians of joint k into ws.C / ws.Ja / ws.Jb. */
function jointRows(rod: Rod, ws: RodWorkspace, k: number): void {
  const a = k, b = k + 1;
  const pos = rod.pos, quat = rod.quat;
  const v = ws.v3;
  qrot(quat, 4 * a, 0, 0, rod.len[a] / 2, v, 0);
  const rax = v[0], ray = v[1], raz = v[2];
  qrot(quat, 4 * b, 0, 0, -rod.len[b] / 2, v, 0);
  const rbx = v[0], rby = v[1], rbz = v[2];
  const c = 6 * k;
  ws.C[c] = pos[3 * a] + rax - pos[3 * b] - rbx;
  ws.C[c + 1] = pos[3 * a + 1] + ray - pos[3 * b + 1] - rby;
  ws.C[c + 2] = pos[3 * a + 2] + raz - pos[3 * b + 2] - rbz;

  // bend/twist: d = conj(r0) ⊗ conj(qa) ⊗ qb ; C = 2 Im(d) (sign-fixed)
  const q4 = ws.q4;
  const qa = 4 * a, qb = 4 * b, r = 4 * k;
  // P = conj(r0) ⊗ conj(qa)
  q4[0] = -rod.restQ[r]; q4[1] = -rod.restQ[r + 1]; q4[2] = -rod.restQ[r + 2]; q4[3] = rod.restQ[r + 3];
  q4[4] = -quat[qa]; q4[5] = -quat[qa + 1]; q4[6] = -quat[qa + 2]; q4[7] = quat[qa + 3];
  qmul(q4, 0, q4, 4, q4, 8); // P at 8
  qmul(q4, 8, quat, qb, q4, 12); // d at 12
  const sgn = q4[15] < 0 ? -1 : 1;
  ws.C[c + 3] = 2 * sgn * q4[12];
  ws.C[c + 4] = 2 * sgn * q4[13];
  ws.C[c + 5] = 2 * sgn * q4[14];

  // M[:,i] = Im(P ⊗ (e_i, 0) ⊗ qb) * sgn ; J_b,rot = +M, J_a,rot = −M
  const Px = q4[8], Py = q4[9], Pz = q4[10], Pw = q4[11];
  const bx = quat[qb], by = quat[qb + 1], bz = quat[qb + 2], bw = quat[qb + 3];
  const Ja = ws.Ja, Jb = ws.Jb, o = 36 * k;
  for (let i = 0; i < 36; i++) {
    Ja[o + i] = 0;
    Jb[o + i] = 0;
  }
  // positional rows: Ja = [I, -[ra]x], Jb = [-I, +[rb]x]
  Ja[o] = 1; Ja[o + 7] = 1; Ja[o + 14] = 1;
  Jb[o] = -1; Jb[o + 7] = -1; Jb[o + 14] = -1;
  // -[ra]x = [[0, raz, -ray], [-raz, 0, rax], [ray, -rax, 0]]
  Ja[o + 3] = 0; Ja[o + 4] = raz; Ja[o + 5] = -ray;
  Ja[o + 9] = -raz; Ja[o + 10] = 0; Ja[o + 11] = rax;
  Ja[o + 15] = ray; Ja[o + 16] = -rax; Ja[o + 17] = 0;
  // +[rb]x = [[0, -rbz, rby], [rbz, 0, -rbx], [-rby, rbx, 0]]
  Jb[o + 3] = 0; Jb[o + 4] = -rbz; Jb[o + 5] = rby;
  Jb[o + 9] = rbz; Jb[o + 10] = 0; Jb[o + 11] = -rbx;
  Jb[o + 15] = -rby; Jb[o + 16] = rbx; Jb[o + 17] = 0;
  for (let col = 0; col < 3; col++) {
    // e = unit vector col; t = P ⊗ (e,0)
    const ex = col === 0 ? 1 : 0, ey = col === 1 ? 1 : 0, ez = col === 2 ? 1 : 0;
    const tx = Pw * ex + Py * ez - Pz * ey;
    const ty = Pw * ey + Pz * ex - Px * ez;
    const tz = Pw * ez + Px * ey - Py * ex;
    const tw = -(Px * ex + Py * ey + Pz * ez);
    // m = t ⊗ qb, imaginary part
    const mx = tw * bx + tx * bw + ty * bz - tz * by;
    const my = tw * by - tx * bz + ty * bw + tz * bx;
    const mz = tw * bz + tx * by - ty * bx + tz * bw;
    // rows 3..5, rotational column 3+col
    Jb[o + 18 + 3 + col] = sgn * mx;
    Jb[o + 24 + 3 + col] = sgn * my;
    Jb[o + 30 + 3 + col] = sgn * mz;
    Ja[o + 18 + 3 + col] = -sgn * mx;
    Ja[o + 24 + 3 + col] = -sgn * my;
    Ja[o + 30 + 3 + col] = -sgn * mz;
  }
}

/** f += Jᵀ v for a Jacobian of the form [[sI, X], [0, Y]] (6×6 at jo). */
function addJt(Jm: Float64Array, jo: number, v: Float64Array, vo: number, f: Float64Array): void {
  const s = Jm[jo];
  const p0 = v[vo], p1 = v[vo + 1], p2 = v[vo + 2], r0 = v[vo + 3], r1 = v[vo + 4], r2 = v[vo + 5];
  f[0] += s * p0;
  f[1] += s * p1;
  f[2] += s * p2;
  for (let c = 0; c < 3; c++) {
    f[3 + c] +=
      Jm[jo + 3 + c] * p0 + Jm[jo + 9 + c] * p1 + Jm[jo + 15 + c] * p2 +
      Jm[jo + 21 + c] * r0 + Jm[jo + 27 + c] * r1 + Jm[jo + 33 + c] * r2;
  }
}

/** In-place forward substitution L x = b (L lower 6x6 at lo). */
function fwd6(L: Float64Array, lo: number, b: Float64Array, bo: number): void {
  for (let i = 0; i < 6; i++) {
    let t = b[bo + i];
    for (let m = 0; m < i; m++) t -= L[lo + 6 * i + m] * b[bo + m];
    b[bo + i] = t / L[lo + 7 * i];
  }
}

/** In-place backward substitution Lᵀ x = b. */
function bwd6(L: Float64Array, lo: number, b: Float64Array, bo: number): void {
  for (let i = 5; i >= 0; i--) {
    let t = b[bo + i];
    for (let m = i + 1; m < 6; m++) t -= L[lo + 6 * m + i] * b[bo + m];
    b[bo + i] = t / L[lo + 7 * i];
  }
}

/**
 * out (+)= J1 W J2ᵀ for Jacobians of the form [[s I, X], [0, Y]] (3×3 blocks) and a symmetric 6×6 W.
 * s is read from J[0]. sc is scratch (≥ 36).
 */
function jwj(
  J1: Float64Array, o1: number, W: Float64Array, wo: number, J2: Float64Array, o2: number,
  out: Float64Array, oo: number, acc: boolean, sc: Float64Array, fresh: boolean
): void {
  const s1 = J1[o1], s2 = J2[o2];
  // P = X1 Wrr, Q = Y1 Wrr, R = X1 Wrp (Wrp = Wprᵀ), S = Y1 Wrp  (reused when !fresh: same J1 and W)
  if (fresh) for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let p = 0, q = 0, rr = 0, ss = 0;
      for (let m = 0; m < 3; m++) {
        const x1 = J1[o1 + 6 * r + 3 + m], y1 = J1[o1 + 18 + 6 * r + 3 + m];
        const wrr = W[wo + 18 + 6 * m + 3 + c];
        const wrp = W[wo + 18 + 6 * m + c];
        p += x1 * wrr;
        q += y1 * wrr;
        rr += x1 * wrp;
        ss += y1 * wrp;
      }
      sc[3 * r + c] = p;
      sc[9 + 3 * r + c] = q;
      sc[18 + 3 * r + c] = rr;
      sc[27 + 3 * r + c] = ss;
    }
  }
  const ss12 = s1 * s2;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      // TL = s1 s2 Wpp + s1 Wpr X2ᵀ + s2 X1 Wrp + P X2ᵀ
      // TR = s1 Wpr Y2ᵀ + P Y2ᵀ ; BL = s2 Y1 Wrp + Q X2ᵀ ; BR = Q Y2ᵀ
      let tl = ss12 * W[wo + 6 * r + c] + s2 * sc[18 + 3 * r + c];
      let tr = 0, bl = s2 * sc[27 + 3 * r + c], br = 0;
      for (let m = 0; m < 3; m++) {
        const x2 = J2[o2 + 6 * c + 3 + m], y2 = J2[o2 + 18 + 6 * c + 3 + m];
        const wpr = W[wo + 6 * r + 3 + m];
        const P = sc[3 * r + m], Q = sc[9 + 3 * r + m];
        tl += (s1 * wpr + P) * x2;
        tr += (s1 * wpr + P) * y2;
        bl += Q * x2;
        br += Q * y2;
      }
      if (acc) {
        out[oo + 6 * r + c] += tl;
        out[oo + 6 * r + 3 + c] += tr;
        out[oo + 18 + 6 * r + c] += bl;
        out[oo + 18 + 6 * r + 3 + c] += br;
      } else {
        out[oo + 6 * r + c] = tl;
        out[oo + 6 * r + 3 + c] = tr;
        out[oo + 18 + 6 * r + c] = bl;
        out[oo + 18 + 6 * r + 3 + c] = br;
      }
    }
  }
}

export interface SolveOptions {
  h: number;
  /** trust region per iteration: max translation (mm) and rotation (rad) of any body */
  maxMove: number;
  maxRot: number;
  /** "rod" (default): one scale for the whole rod; "joint": per-body scales, multipliers scaled per joint */
  trust?: "joint" | "rod";
}

/**
 * One XPBD iteration on the rod's internal constraints, using ws.Wp as the per-body mobility
 * (filled by the caller with baseMobility and contact elimination). Accumulates rod.lambda.
 */
export function solveRodIteration(rod: Rod, ws: RodWorkspace, opt: SolveOptions, pred?: Float64Array | null, start = 0): void {
  const n = rod.n;
  const J = n - 1;
  if (J - start < 1) return;
  const h2 = opt.h * opt.h;
  const { Ja, Jb, Akk, Aoff, D, G, C, y, dl, Wp, Ta } = ws;

  for (let k = start; k < J; k++) jointRows(rod, ws, k);

  // assemble blocks (structured: J = [[sI, X], [0, Y]])
  for (let k = start; k < J; k++) {
    const o = 36 * k;
    jwj(Ja, o, Wp, 36 * k, Ja, o, Akk, o, false, Ta, true);
    // body k+1 appears in A_kk (as b of joint k) and in A_{k,k+1}: share J_b W products
    jwj(Jb, o, Wp, 36 * (k + 1), Jb, o, Akk, o, true, Ta, true);
    if (k < J - 1) jwj(Jb, o, Wp, 36 * (k + 1), Ja, 36 * (k + 1), Aoff, o, false, Ta, false); // A_{k,k+1}
    // compliance on the diagonal
    const aS = rod.alS[k] / h2, aB = rod.alB[k] / h2, aT = rod.alT[k] / h2;
    Akk[o] += aS;
    Akk[o + 7] += aS;
    Akk[o + 14] += aS;
    Akk[o + 21] += aB;
    Akk[o + 28] += aB;
    Akk[o + 35] += aT;
    // rhs: -C - α̃ λ
    const c = 6 * k;
    const lam = rod.lambda;
    y[c] = -C[c] - aS * lam[c];
    y[c + 1] = -C[c + 1] - aS * lam[c + 1];
    y[c + 2] = -C[c + 2] - aS * lam[c + 2];
    y[c + 3] = -C[c + 3] - aB * lam[c + 3];
    y[c + 4] = -C[c + 4] - aB * lam[c + 4];
    y[c + 5] = -C[c + 5] - aT * lam[c + 5];
    if (pred) {
      // the predicted (external-force) displacement enters the linearised constraints
      const pa = 6 * k, pb = 6 * (k + 1);
      for (let r = 0; r < 6; r++) {
        let s = 0;
        for (let m = 0; m < 6; m++) s += Ja[o + 6 * r + m] * pred[pa + m] + Jb[o + 6 * r + m] * pred[pb + m];
        y[c + r] -= s;
      }
    }
  }

  // block Cholesky sweep: L_k L_kᵀ = A_kk − U_{k−1}ᵀ U_{k−1},  U_k = L_k⁻¹ A_{k,k+1}
  const tmp = ws.v6;
  for (let k = start; k < J; k++) {
    const o = 36 * k;
    for (let i = 0; i < 36; i++) D[o + i] = Akk[o + i];
    if (k > start) {
      const p = 36 * (k - 1);
      // D -= Uᵀ U (symmetric)
      for (let r = 0; r < 6; r++) {
        for (let cc = 0; cc <= r; cc++) {
          let sum = 0;
          for (let m = 0; m < 6; m++) sum += G[p + 6 * m + r] * G[p + 6 * m + cc];
          D[o + 6 * r + cc] -= sum;
          if (cc !== r) D[o + 6 * cc + r] -= sum;
        }
      }
      // y_k -= U_{k-1}ᵀ z_{k-1}
      const zp = 6 * (k - 1);
      for (let r = 0; r < 6; r++) {
        let sum = 0;
        for (let m = 0; m < 6; m++) sum += G[p + 6 * m + r] * y[zp + m];
        y[6 * k + r] -= sum;
      }
    }
    if (!chol6(D, o)) {
      // regularise and retry: a degenerate block (e.g. two kinematic neighbours)
      for (let i = 0; i < 36; i++) D[o + i] = Akk[o + i];
      for (let d = 0; d < 6; d++) D[o + 7 * d] += 1e-9 + Math.abs(D[o + 7 * d]) * 1e-6;
      ws.failed++;
      if (!chol6(D, o)) {
        for (let i = 0; i < 36; i++) D[o + i] = 0;
        for (let d = 0; d < 6; d++) D[o + 7 * d] = 1e6;
      }
    }
    // z_k = L_k⁻¹ y_k (in place)
    fwd6(D, o, y, 6 * k);
    if (k < J - 1) {
      // U_k = L_k⁻¹ A_{k,k+1}, column by column
      for (let col = 0; col < 6; col++) {
        for (let r = 0; r < 6; r++) tmp[r] = Aoff[o + 6 * r + col];
        fwd6(D, o, tmp, 0);
        for (let r = 0; r < 6; r++) G[o + 6 * r + col] = tmp[r];
      }
    }
  }
  // back substitution: Δλ_k = L_k⁻ᵀ (z_k − U_k Δλ_{k+1})
  for (let k = J - 1; k >= start; k--) {
    const c = 6 * k;
    for (let r = 0; r < 6; r++) dl[c + r] = y[c + r];
    if (k < J - 1) {
      const o = 36 * k;
      for (let r = 0; r < 6; r++) {
        let sum = 0;
        for (let m = 0; m < 6; m++) sum += G[o + 6 * r + m] * dl[c + 6 + m];
        dl[c + r] -= sum;
      }
    }
    bwd6(D, 36 * k, dl, c);
  }

  // apply: Δbody = W' (Jᵀ Δλ)
  const lam = rod.lambda;
  const D6 = ws.delta;
  let maxDm = 0, maxTm = 0;
  for (let i = start; i < n; i++) {
    const o6 = 6 * i;
    if (rod.kin[i]) {
      for (let r = 0; r < 6; r++) D6[o6 + r] = 0;
      continue;
    }
    // f = Ja(i)ᵀ dl_i (as body a of joint i) + Jb(i-1)ᵀ dl_{i-1} (as body b of joint i-1), using the
    // block structure J = [[sI, X], [0, Y]]: Jᵀ dl = [s·dl_p ; Xᵀ dl_p + Yᵀ dl_r]
    for (let r = 0; r < 6; r++) tmp[r] = 0;
    if (i < J) addJt(Ja, 36 * i, dl, 6 * i, tmp);
    if (i > start) addJt(Jb, 36 * (i - 1), dl, 6 * (i - 1), tmp);
    const wo = 36 * i;
    for (let r = 0; r < 6; r++) {
      let s = 0;
      for (let m = 0; m < 6; m++) s += Wp[wo + 6 * r + m] * tmp[m];
      D6[o6 + r] = s + (pred ? pred[o6 + r] : 0);
    }
    const dm = Math.hypot(D6[o6], D6[o6 + 1], D6[o6 + 2]);
    const tm = Math.hypot(D6[o6 + 3], D6[o6 + 4], D6[o6 + 5]);
    if (dm > maxDm) maxDm = dm;
    if (tm > maxTm) maxTm = tm;
  }
  // Trust region. Mode "rod" (default): one step scale s for the whole rod, so that no body moves
  // more than maxMove (mm) or turns more than maxRot (rad) in an iteration; the same s scales the
  // multiplier increments, so the accumulated λ (and every force read from it: hub reactions, grip
  // slip, contact loads, friction) matches the motion actually taken. A rod far from equilibrium then
  // relaxes along the exact Newton direction at a bounded speed, and the next iterations and substeps
  // finish the step. Mode "joint": each body has its own scale s_i and each joint's increment is
  // scaled by the smaller scale of its two bodies (consistent to first order; neighbouring bodies
  // clamped differently open their joint, which the next iteration closes).
  const sc = ws.scale;
  let sRod = 1;
  if (maxDm > opt.maxMove) sRod = opt.maxMove / maxDm;
  if (maxTm > opt.maxRot) sRod = Math.min(sRod, opt.maxRot / maxTm);
  const perJoint = opt.trust === "joint";
  let sMin = 1;
  for (let i = start; i < n; i++) {
    const o6 = 6 * i;
    let si = 1;
    if (!rod.kin[i]) {
      if (perJoint) {
        const dm = Math.hypot(D6[o6], D6[o6 + 1], D6[o6 + 2]);
        const tm = Math.hypot(D6[o6 + 3], D6[o6 + 4], D6[o6 + 5]);
        if (dm > opt.maxMove) si = opt.maxMove / dm;
        if (tm > opt.maxRot) si = Math.min(si, opt.maxRot / tm);
      } else si = sRod;
      rod.pos[3 * i] += si * D6[o6];
      rod.pos[3 * i + 1] += si * D6[o6 + 1];
      rod.pos[3 * i + 2] += si * D6[o6 + 2];
      qaddRot(rod.quat, 4 * i, si * D6[o6 + 3], si * D6[o6 + 4], si * D6[o6 + 5]);
    }
    sc[i] = si;
    if (si < sMin) sMin = si;
  }
  ws.stepScale = sMin;
  ws.maxMove = maxDm;
  for (let k = start; k < J; k++) {
    const sj = sc[k] < sc[k + 1] ? sc[k] : sc[k + 1];
    const c6 = 6 * k;
    for (let r = 0; r < 6; r++) lam[c6 + r] += sj * dl[c6 + r];
  }
}

/**
 * Generalised force (6) exerted on body i by its joints, from the accumulated multipliers:
 * F = (Jᵀ λ)_i / h². Uses the Jacobians from the last iteration.
 */
export function jointForceOnBody(rod: Rod, ws: RodWorkspace, i: number, h: number, out: Float64Array, oo: number): void {
  const J = rod.n - 1;
  const f = ws.v6;
  for (let r = 0; r < 6; r++) f[r] = 0;
  if (i < J) addJt(ws.Ja, 36 * i, rod.lambda, 6 * i, f);
  if (i > 0 && i - 1 < J) addJt(ws.Jb, 36 * (i - 1), rod.lambda, 6 * (i - 1), f);
  const ih2 = 1 / (h * h);
  for (let r = 0; r < 6; r++) out[oo + r] = f[r] * ih2;
}
