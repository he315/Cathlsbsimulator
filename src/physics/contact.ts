// ---------------------------------------------------------------------------
// Contact between rod segments and vessel walls, with Coulomb friction.
//
// Per substep:
//   1. detect():   query the lumen union for every free segment; a segment
//      that has left the lumen is projected back onto the wall and its contact
//      is activated. Contacts persist while the wall still pushes.
//   2. mobility(): fold the contact into the segment's 6×6 mobility before the
//      direct solve. The wall-normal row is hard (removed from the mobility);
//      the two tangential rows of the contact point (axial slide, and
//      circumferential slide including spin about the rod axis) are damped by
//      a linearised friction coefficient η, so friction acts inside the same
//      linear solve as the rod's elasticity:
//          W' = W − W Gᵀ (D + G W Gᵀ)⁻¹ G W,   D = diag(0, 1/(hη), 1/(hη)).
//   3. after():    from the joint forces read the normal load N on each
//      contact, release contacts the wall is pulling, and update η from the
//      measured slip speed with a regularised Coulomb law and a Stribeck drop
//      from static to kinetic friction:
//          μ(v) = μk + (μs − μk) exp(−v / vS),   η = μ(v) N / √(v² + vε²).
//      Below vε the contact creeps very slowly (static friction); once it
//      slides faster the resistance falls to μk·N. The drop from μs to μk with
//      speed is what releases stored torque suddenly as whip.
//
// Extra hard rows ("rails") constrain a segment to slide along a line, used
// for a catheter tip tracking over a wire.
// ---------------------------------------------------------------------------

import { Rod } from "./rod";
import { RodWorkspace, baseMobility, jointForceOnBody } from "./xpbd";
import { LumenSet, type LumenHit, type RodLumenFlags, regionFrictionScale, LUMEN_ROOT } from "./lumen";
import { qrot, qaddRot } from "./math3";

export interface FrictionParams {
  /** creep speed below which a contact behaves as stuck (mm/s) — model parameter */
  vEps: number;
  /** Stribeck speed for the static-to-kinetic drop (mm/s) — model parameter */
  vStribeck: number;
  /** force with which a rod tip must press the closed valve centre to cross it (N) — model parameter */
  valveCrossForce: number;
}

export const DEFAULT_FRICTION: FrictionParams = { vEps: 0.4, vStribeck: 3, valveCrossForce: 0.08 };

export interface Rail {
  body: number;
  /** point on the guiding line */
  px: number;
  py: number;
  pz: number;
  /** unit direction of the line */
  tx: number;
  ty: number;
  tz: number;
}

const MAXR = 6;
/** segments at least this long (mm) also keep their two ends inside the lumen */
const LONG_SEGMENT = 6;

export class RodContacts {
  readonly n: number;
  hints: Int32Array;
  readonly nTubesMax: number;
  hit: LumenHit = { slack: 0, nx: 0, ny: 0, nz: 0, region: 0, lumen: 0, s: 0, floor: false };
  /** last lumen hit per body (region, slack) for telemetry and the classifier */
  slack: Float64Array;
  region: Int16Array;
  lumen: Int16Array;
  floor: Uint8Array;
  flags: RodLumenFlags = { crossedValve: false };
  rails: Rail[] = [];
  /** keep the ends of long segments inside too (needed in narrow, sharply bending routes) */
  endContacts = true;
  /** contact-point rows and generalised reactions, scratch */
  private G = new Float64Array(6 * MAXR);
  private D = new Float64Array(MAXR);
  private WG = new Float64Array(6 * MAXR);
  private S = new Float64Array(MAXR * MAXR);
  private X = new Float64Array(MAXR * 6);
  private F = new Float64Array(6);
  private tmp = new Float64Array(8);
  /** end-point contacts of long segments (a long straight segment could otherwise lie across a narrow lumen) */
  private hintsEnd: Int32Array;
  endActive: Uint8Array;
  private endNrm: Float64Array;
  private endOff: Float64Array;
  private pe = new Float64Array(3);
  /** sum of normal contact loads (N) last substep */
  totalNormal = 0;
  /** sum of friction loads μN (N) last substep */
  totalFriction = 0;
  /**
   * Stick-slip state per body: 1 while the contact creeps (slip speed at most vEps, static friction),
   * 0 once it slides (slip speed at least the Stribeck speed, kinetic friction); in between the
   * previous state holds (hysteresis).
   */
  stuck: Uint8Array;
  /** count of stick-to-slip transitions (a stuck contact under load that breaks free) since creation */
  slipEvents = 0;
  /** normal load (N) released by the last stick-to-slip transition */
  lastSlipLoad = 0;

  constructor(n: number, nTubesMax = 24) {
    this.n = n;
    this.nTubesMax = nTubesMax;
    this.hints = new Int32Array(n * nTubesMax).fill(-1);
    this.slack = new Float64Array(n);
    this.region = new Int16Array(n).fill(-1);
    this.lumen = new Int16Array(n).fill(-999);
    this.floor = new Uint8Array(n);
    this.hintsEnd = new Int32Array(n * 2 * nTubesMax).fill(-1);
    this.endActive = new Uint8Array(2 * n);
    this.endNrm = new Float64Array(6 * n);
    this.endOff = new Float64Array(6 * n);
    this.stuck = new Uint8Array(n);
  }

  resetHints(): void {
    this.hints.fill(-1);
    this.hintsEnd.fill(-1);
  }

  /** Query lumens, project escaped segments back inside, activate/deactivate contacts. */
  detect(rod: Rod, lumens: LumenSet, start: number): void {
    const hit = this.hit;
    const nt = Math.min(this.nTubesMax, lumens.tubes.length);
    for (let i = start; i < rod.n; i++) {
      if (rod.kin[i]) {
        rod.cActive[i] = 0;
        continue;
      }
      const x = rod.pos[3 * i], y = rod.pos[3 * i + 1], z = rod.pos[3 * i + 2];
      lumens.query(x, y, z, rod.radius[i], this.flags, nt === lumens.tubes.length ? this.hints : null, i * this.nTubesMax, hit);
      this.slack[i] = hit.slack;
      this.region[i] = hit.region;
      this.lumen[i] = hit.lumen;
      this.floor[i] = hit.floor ? 1 : 0;
      if (hit.slack < 0) {
        // push back inside along the wall normal
        rod.pos[3 * i] += hit.slack * hit.nx;
        rod.pos[3 * i + 1] += hit.slack * hit.ny;
        rod.pos[3 * i + 2] += hit.slack * hit.nz;
        rod.cActive[i] = 1;
      } else if (hit.slack > 0.05 || rod.cN[i] <= 0) {
        rod.cActive[i] = 0;
      }
      if (rod.cActive[i]) {
        rod.cNrm[3 * i] = hit.nx;
        rod.cNrm[3 * i + 1] = hit.ny;
        rod.cNrm[3 * i + 2] = hit.nz;
        rod.cRegion[i] = hit.region;
        rod.cMu[i] = regionFrictionScale(hit.region);
      } else {
        rod.cN[i] = 0;
      }
      // the ends of a long segment must stay inside too
      this.endActive[2 * i] = 0;
      this.endActive[2 * i + 1] = 0;
      // (an end lies at most len/2 from the centre: with more slack than that it cannot be outside)
      if (this.endContacts && rod.len[i] >= LONG_SEGMENT && this.slack[i] < rod.len[i] / 2) {
        for (let e = 0; e < 2; e++) {
          const side = e === 0 ? -1 : 1;
          qrot(rod.quat, 4 * i, 0, 0, (side * rod.len[i]) / 2, this.pe, 0);
          const ox = this.pe[0], oy = this.pe[1], oz = this.pe[2];
          lumens.query(rod.pos[3 * i] + ox, rod.pos[3 * i + 1] + oy, rod.pos[3 * i + 2] + oz, rod.radius[i], this.flags, nt === lumens.tubes.length ? this.hintsEnd : null, (2 * i + e) * this.nTubesMax, hit);
          if (hit.slack >= 0) continue;
          // turn the segment about its centre so the end comes back to the wall
          const mx = hit.slack * hit.nx, my = hit.slack * hit.ny, mz = hit.slack * hit.nz;
          const l2 = ox * ox + oy * oy + oz * oz;
          qaddRot(rod.quat, 4 * i, (oy * mz - oz * my) / l2, (oz * mx - ox * mz) / l2, (ox * my - oy * mx) / l2);
          this.endActive[2 * i + e] = 1;
          this.endNrm[6 * i + 3 * e] = hit.nx;
          this.endNrm[6 * i + 3 * e + 1] = hit.ny;
          this.endNrm[6 * i + 3 * e + 2] = hit.nz;
          this.endOff[6 * i + 3 * e] = ox;
          this.endOff[6 * i + 3 * e + 1] = oy;
          this.endOff[6 * i + 3 * e + 2] = oz;
        }
      }
    }
    for (let ri = 0; ri < this.rails.length; ri++) {
      const r = this.rails[ri];
      const i = r.body;
      // project onto the line
      const dx = rod.pos[3 * i] - r.px, dy = rod.pos[3 * i + 1] - r.py, dz = rod.pos[3 * i + 2] - r.pz;
      const a = dx * r.tx + dy * r.ty + dz * r.tz;
      rod.pos[3 * i] = r.px + a * r.tx;
      rod.pos[3 * i + 1] = r.py + a * r.ty;
      rod.pos[3 * i + 2] = r.pz + a * r.tz;
    }
  }

  /** Build each segment's mobility W' into ws.Wp (base mobility with contact and friction folded in). */
  mobility(rod: Rod, ws: RodWorkspace, h: number, start: number): void {
    for (let i = start; i < rod.n; i++) {
      baseMobility(rod, ws, i);
      if (rod.kin[i]) continue;
      const k = this.rowsFor(rod, i, h);
      if (k > 0) this.eliminate(ws.Wp, 36 * i, k);
    }
  }

  /** Assemble constraint rows for body i into this.G / this.D; returns the row count. */
  private rowsFor(rod: Rod, i: number, h: number): number {
    const G = this.G, D = this.D;
    let k = 0;
    if (rod.cActive[i]) {
      const nx = rod.cNrm[3 * i], ny = rod.cNrm[3 * i + 1], nz = rod.cNrm[3 * i + 2];
      // normal row [n, 0]
      G.fill(0, 0, 6);
      G[0] = nx; G[1] = ny; G[2] = nz;
      D[0] = 0;
      k = 1;
      const eta = rod.cEta[i];
      if (eta > 0) {
        // tangents: t1 = rod axis projected on the tangent plane, t2 = n × t1
        const t = this.tmp;
        qrot(rod.quat, 4 * i, 0, 0, 1, t, 0);
        let ax = t[0], ay = t[1], az = t[2];
        const dn = ax * nx + ay * ny + az * nz;
        ax -= dn * nx; ay -= dn * ny; az -= dn * nz;
        let l = Math.hypot(ax, ay, az);
        if (l < 1e-6) {
          // axis along the normal (tip pressing end-on): any tangent pair
          ax = ny; ay = -nx; az = 0;
          if (Math.hypot(ax, ay, az) < 1e-6) { ax = 0; ay = nz; az = -ny; }
          l = Math.hypot(ax, ay, az);
        }
        ax /= l; ay /= l; az /= l;
        const bx = ny * az - nz * ay, by = nz * ax - nx * az, bz = nx * ay - ny * ax;
        const r = rod.radius[i];
        // contact point offset c = r n; rows = [t, (c × t)] for t = a (axial) and t = b (circumferential)
        let o = 6 * k;
        G[o] = ax; G[o + 1] = ay; G[o + 2] = az;
        G[o + 3] = r * (ny * az - nz * ay);
        G[o + 4] = r * (nz * ax - nx * az);
        G[o + 5] = r * (nx * ay - ny * ax);
        D[k] = 1 / (h * eta);
        k++;
        o = 6 * k;
        G[o] = bx; G[o + 1] = by; G[o + 2] = bz;
        G[o + 3] = r * (ny * bz - nz * by);
        G[o + 4] = r * (nz * bx - nx * bz);
        G[o + 5] = r * (nx * by - ny * bx);
        D[k] = 1 / (h * eta);
        k++;
      }
    }
    for (let e = 0; e < 2; e++) {
      if (!this.endActive[2 * i + e] || k >= MAXR) continue;
      // hard row on the end point: [n, r_e × n]
      const nx = this.endNrm[6 * i + 3 * e], ny = this.endNrm[6 * i + 3 * e + 1], nz = this.endNrm[6 * i + 3 * e + 2];
      const rx = this.endOff[6 * i + 3 * e], ry = this.endOff[6 * i + 3 * e + 1], rz = this.endOff[6 * i + 3 * e + 2];
      const o = 6 * k;
      G[o] = nx; G[o + 1] = ny; G[o + 2] = nz;
      G[o + 3] = ry * nz - rz * ny;
      G[o + 4] = rz * nx - rx * nz;
      G[o + 5] = rx * ny - ry * nx;
      D[k] = 0;
      k++;
    }
    for (let ri = 0; ri < this.rails.length; ri++) {
      const rl = this.rails[ri];
      if (rl.body !== i || k > MAXR - 2) continue;
      // two hard rows perpendicular to the rail direction
      let ux = rl.ty, uy = -rl.tx, uz = 0;
      if (Math.hypot(ux, uy, uz) < 1e-3) { ux = 0; uy = rl.tz; uz = -rl.ty; }
      const l = Math.hypot(ux, uy, uz);
      ux /= l; uy /= l; uz /= l;
      const vx = rl.ty * uz - rl.tz * uy, vy = rl.tz * ux - rl.tx * uz, vz = rl.tx * uy - rl.ty * ux;
      let o = 6 * k;
      G.fill(0, o, o + 6);
      G[o] = ux; G[o + 1] = uy; G[o + 2] = uz;
      D[k] = 0;
      k++;
      o = 6 * k;
      G.fill(0, o, o + 6);
      G[o] = vx; G[o + 1] = vy; G[o + 2] = vz;
      D[k] = 0;
      k++;
    }
    return k;
  }

  /** W ← W − W Gᵀ (D + G W Gᵀ)⁻¹ G W for k rows in this.G. */
  private eliminate(W: Float64Array, wo: number, k: number): void {
    const G = this.G, D = this.D, WG = this.WG, S = this.S, X = this.X;
    // WG (6×k) = W Gᵀ
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < k; c++) {
        let s = 0;
        for (let m = 0; m < 6; m++) s += W[wo + 6 * r + m] * G[6 * c + m];
        WG[r * MAXR + c] = s;
      }
    }
    // S (k×k) = D + G W Gᵀ
    for (let a = 0; a < k; a++) {
      for (let b = 0; b < k; b++) {
        let s = 0;
        for (let m = 0; m < 6; m++) s += G[6 * a + m] * WG[m * MAXR + b];
        S[a * MAXR + b] = s + (a === b ? D[a] : 0);
      }
    }
    // Cholesky of S in place (lower)
    for (let j = 0; j < k; j++) {
      let s = S[j * MAXR + j];
      for (let m = 0; m < j; m++) s -= S[j * MAXR + m] * S[j * MAXR + m];
      if (!(s > 1e-300)) return; // degenerate (duplicate rows): skip elimination
      const d = Math.sqrt(s);
      S[j * MAXR + j] = d;
      for (let i = j + 1; i < k; i++) {
        let t = S[i * MAXR + j];
        for (let m = 0; m < j; m++) t -= S[i * MAXR + m] * S[j * MAXR + m];
        S[i * MAXR + j] = t / d;
      }
    }
    // X (k×6) = S⁻¹ WGᵀ
    for (let col = 0; col < 6; col++) {
      // forward
      for (let i = 0; i < k; i++) {
        let t = WG[col * MAXR + i];
        for (let m = 0; m < i; m++) t -= S[i * MAXR + m] * X[m * 6 + col];
        X[i * 6 + col] = t / S[i * MAXR + i];
      }
      // backward
      for (let i = k - 1; i >= 0; i--) {
        let t = X[i * 6 + col];
        for (let m = i + 1; m < k; m++) t -= S[m * MAXR + i] * X[m * 6 + col];
        X[i * 6 + col] = t / S[i * MAXR + i];
      }
    }
    // W -= WG X
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        let s = 0;
        for (let m = 0; m < k; m++) s += WG[r * MAXR + m] * X[m * 6 + c];
        W[wo + 6 * r + c] -= s;
      }
    }
  }

  /** Reactions, contact release, slip speeds and friction update after the substep's solve. */
  after(rod: Rod, ws: RodWorkspace, h: number, start: number, fp: FrictionParams, final = true): void {
    const F = this.F;
    const t = this.tmp;
    let totN = 0, totF = 0;
    for (let i = start; i < rod.n; i++) {
      // slip of the contact point over the substep (also used to warm-start friction on contact)
      const dx = rod.pos[3 * i] - rod.prevPos[3 * i];
      const dy = rod.pos[3 * i + 1] - rod.prevPos[3 * i + 1];
      const dz = rod.pos[3 * i + 2] - rod.prevPos[3 * i + 2];
      if (!rod.cActive[i] || rod.kin[i]) {
        rod.cN[i] = 0;
        if (final) this.stuck[i] = 0;
        continue;
      }
      // rotation over the substep: δq = q ⊗ conj(q_prev), θ ≈ 2 Im(δq)
      const q = rod.quat, p = rod.prevQuat, o = 4 * i;
      const qx = q[o], qy = q[o + 1], qz = q[o + 2], qw = q[o + 3];
      const px = -p[o], py = -p[o + 1], pz = -p[o + 2], pw = p[o + 3];
      let rx = qw * px + qx * pw + qy * pz - qz * py;
      let ry = qw * py - qx * pz + qy * pw + qz * px;
      let rz = qw * pz + qx * py - qy * px + qz * pw;
      const rw = qw * pw - qx * px - qy * py - qz * pz;
      if (rw < 0) { rx = -rx; ry = -ry; rz = -rz; }
      const thx = 2 * rx, thy = 2 * ry, thz = 2 * rz;
      const nx = rod.cNrm[3 * i], ny = rod.cNrm[3 * i + 1], nz = rod.cNrm[3 * i + 2];
      const r = rod.radius[i];
      // contact point velocity: Δx + θ × (r n)
      let vx = dx + r * (thy * nz - thz * ny);
      let vy = dy + r * (thz * nx - thx * nz);
      let vz = dz + r * (thx * ny - thy * nx);
      const vn = vx * nx + vy * ny + vz * nz;
      vx -= vn * nx; vy -= vn * ny; vz -= vn * nz;
      const slip = Math.hypot(vx, vy, vz) / h;
      rod.cSlip[i] = slip;
      // normal load from the joint forces pushing the segment outwards (+ external force)
      jointForceOnBody(rod, ws, i, h, F, 0);
      for (let m = 0; m < 6; m++) F[m] += rod.fext[6 * i + m];
      let N = F[0] * nx + F[1] * ny + F[2] * nz;
      void t;
      if (N <= 0) {
        if (final) {
          rod.cActive[i] = 0;
          rod.cN[i] = 0;
          rod.cEta[i] = 0;
          this.stuck[i] = 0;
        }
        continue;
      }
      // valve crossing: a distal segment pressing the closed valve near its centre
      if (final && this.floor[i] && this.lumen[i] === LUMEN_ROOT && i >= rod.n - 10 && N > fp.valveCrossForce) {
        const rho = Math.hypot(rod.pos[3 * i], rod.pos[3 * i + 2]);
        this.flags.crossedValve ||= rho < this.crossRadius;
      }
      rod.cN[i] = N;
      if (final) {
        // stick-slip events (for hazards, haptics and audio): a loaded stuck contact that breaks free
        // (model parameter: loads below 0.01 N are not counted)
        if (slip <= fp.vEps) this.stuck[i] = 1;
        else if (slip >= fp.vStribeck && this.stuck[i]) {
          this.stuck[i] = 0;
          if (N > 0.01) {
            this.slipEvents++;
            this.lastSlipLoad = N;
          }
        }
      }
      const ms = rod.spec.muStatic * rod.cMu[i];
      const mk = rod.spec.muKinetic * rod.cMu[i];
      const mu = mk + (ms - mk) * Math.exp(-slip / fp.vStribeck);
      rod.cEta[i] = mu > 0 ? (mu * N) / Math.sqrt(slip * slip + fp.vEps * fp.vEps) : 0;
      totN += N;
      totF += mu * N;
    }
    if (final) {
      this.totalNormal = totN;
      this.totalFriction = totF;
    }
  }

  /** radius (mm) inside which a pressing tip opens the closed valve (set from the root geometry) */
  crossRadius = 6;

  /** Leave the ventricle state once no segment is below the coaptation height. */
  updateValveFlag(rod: Rod, lumens: LumenSet, start: number): void {
    if (!this.flags.crossedValve) return;
    const yC = lumens.root.hCoapt;
    for (let i = start; i < rod.n; i++) {
      const y = rod.pos[3 * i + 1];
      if (y < yC && Math.hypot(rod.pos[3 * i], rod.pos[3 * i + 2]) < lumens.root.R) return;
    }
    this.flags.crossedValve = false;
  }
}
