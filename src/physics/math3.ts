// ---------------------------------------------------------------------------
// Small dense linear algebra and quaternion helpers for the rod solver.
// Everything works on Float64Array storage with explicit offsets so the hot
// loops allocate nothing. Quaternions are stored (x, y, z, w).
// 6x6 matrices are row-major, 36 entries.
// ---------------------------------------------------------------------------

/** out = a ⊗ b (Hamilton product). Safe when out aliases a or b only through the temporaries. */
export function qmul(a: ArrayLike<number>, ao: number, b: ArrayLike<number>, bo: number, out: Float64Array, oo: number): void {
  const ax = a[ao], ay = a[ao + 1], az = a[ao + 2], aw = a[ao + 3];
  const bx = b[bo], by = b[bo + 1], bz = b[bo + 2], bw = b[bo + 3];
  out[oo] = aw * bx + ax * bw + ay * bz - az * by;
  out[oo + 1] = aw * by - ax * bz + ay * bw + az * bx;
  out[oo + 2] = aw * bz + ax * by - ay * bx + az * bw;
  out[oo + 3] = aw * bw - ax * bx - ay * by - az * bz;
}

/** Rotate vector (vx,vy,vz) by unit quaternion q at offset qo; writes to out[oo..oo+2]. */
export function qrot(q: ArrayLike<number>, qo: number, vx: number, vy: number, vz: number, out: Float64Array, oo: number): void {
  const x = q[qo], y = q[qo + 1], z = q[qo + 2], w = q[qo + 3];
  // t = 2 * cross(q.xyz, v)
  const tx = 2 * (y * vz - z * vy);
  const ty = 2 * (z * vx - x * vz);
  const tz = 2 * (x * vy - y * vx);
  out[oo] = vx + w * tx + (y * tz - z * ty);
  out[oo + 1] = vy + w * ty + (z * tx - x * tz);
  out[oo + 2] = vz + w * tz + (x * ty - y * tx);
}

/** Normalise the quaternion at offset o in place. */
export function qnormalize(q: Float64Array, o: number): void {
  const l = Math.hypot(q[o], q[o + 1], q[o + 2], q[o + 3]) || 1;
  q[o] /= l;
  q[o + 1] /= l;
  q[o + 2] /= l;
  q[o + 3] /= l;
}

/** q ← normalize(q + ½ (θ, 0) ⊗ q): apply a small world-frame rotation vector θ. */
export function qaddRot(q: Float64Array, o: number, tx: number, ty: number, tz: number): void {
  const x = q[o], y = q[o + 1], z = q[o + 2], w = q[o + 3];
  // (θ,0) ⊗ q
  const rx = tx * w + ty * z - tz * y;
  const ry = -tx * z + ty * w + tz * x;
  const rz = tx * y - ty * x + tz * w;
  const rw = -tx * x - ty * y - tz * z;
  q[o] = x + 0.5 * rx;
  q[o + 1] = y + 0.5 * ry;
  q[o + 2] = z + 0.5 * rz;
  q[o + 3] = w + 0.5 * rw;
  qnormalize(q, o);
}

/** Quaternion from a rotation vector (axis * angle). */
export function qexp(vx: number, vy: number, vz: number, out: Float64Array, oo: number): void {
  const a = Math.hypot(vx, vy, vz);
  if (a < 1e-12) {
    out[oo] = 0.5 * vx;
    out[oo + 1] = 0.5 * vy;
    out[oo + 2] = 0.5 * vz;
    out[oo + 3] = 1;
    qnormalize(out, oo);
    return;
  }
  const s = Math.sin(a / 2) / a;
  out[oo] = vx * s;
  out[oo + 1] = vy * s;
  out[oo + 2] = vz * s;
  out[oo + 3] = Math.cos(a / 2);
}

/** Quaternion that rotates unit vector a onto unit vector b (shortest arc). */
export function qfromTo(ax: number, ay: number, az: number, bx: number, by: number, bz: number, out: Float64Array, oo: number): void {
  const d = ax * bx + ay * by + az * bz;
  if (d < -0.999999) {
    // opposite: rotate π about any axis perpendicular to a
    let px = 0, py = -az, pz = ay;
    if (Math.abs(ax) < 0.9) {
      px = 0; py = -az; pz = ay;
    } else {
      px = az; py = 0; pz = -ax;
    }
    const l = Math.hypot(px, py, pz) || 1;
    out[oo] = px / l;
    out[oo + 1] = py / l;
    out[oo + 2] = pz / l;
    out[oo + 3] = 0;
    return;
  }
  const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx;
  out[oo] = cx;
  out[oo + 1] = cy;
  out[oo + 2] = cz;
  out[oo + 3] = 1 + d;
  qnormalize(out, oo);
}

/** Build a quaternion from an orthonormal frame given by columns d1, d2, d3 (local x, y, z in world). */
export function qfromFrame(
  d1x: number, d1y: number, d1z: number,
  d2x: number, d2y: number, d2z: number,
  d3x: number, d3y: number, d3z: number,
  out: Float64Array, oo: number
): void {
  // rotation matrix columns are d1, d2, d3
  const m00 = d1x, m01 = d2x, m02 = d3x;
  const m10 = d1y, m11 = d2y, m12 = d3y;
  const m20 = d1z, m21 = d2z, m22 = d3z;
  const tr = m00 + m11 + m22;
  let x: number, y: number, z: number, w: number;
  if (tr > 0) {
    const s = Math.sqrt(tr + 1) * 2;
    w = 0.25 * s;
    x = (m21 - m12) / s;
    y = (m02 - m20) / s;
    z = (m10 - m01) / s;
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    w = (m21 - m12) / s;
    x = 0.25 * s;
    y = (m01 + m10) / s;
    z = (m02 + m20) / s;
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    w = (m02 - m20) / s;
    x = (m01 + m10) / s;
    y = 0.25 * s;
    z = (m12 + m21) / s;
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
    w = (m10 - m01) / s;
    x = (m02 + m20) / s;
    y = (m12 + m21) / s;
    z = 0.25 * s;
  }
  out[oo] = x;
  out[oo + 1] = y;
  out[oo + 2] = z;
  out[oo + 3] = w;
  qnormalize(out, oo);
}

// ---------------------------------------------------------------------------
// 6x6 helpers
// ---------------------------------------------------------------------------

/** In-place Cholesky factorisation of a symmetric positive definite 6x6 (lower triangle kept). Returns false on failure. */
export function chol6(a: Float64Array, o: number): boolean {
  for (let j = 0; j < 6; j++) {
    let s = a[o + j * 6 + j];
    for (let k = 0; k < j; k++) {
      const l = a[o + j * 6 + k];
      s -= l * l;
    }
    if (!(s > 1e-300)) return false;
    const d = Math.sqrt(s);
    a[o + j * 6 + j] = d;
    for (let i = j + 1; i < 6; i++) {
      let t = a[o + i * 6 + j];
      for (let k = 0; k < j; k++) t -= a[o + i * 6 + k] * a[o + j * 6 + k];
      a[o + i * 6 + j] = t / d;
    }
  }
  return true;
}

/** Solve L Lᵀ x = b for one 6-vector, with the factor at offset lo. b and x may alias. */
export function cholSolve6(L: Float64Array, lo: number, b: Float64Array, bo: number, x: Float64Array, xo: number): void {
  // forward: L y = b
  let y0 = b[bo] / L[lo];
  let y1 = (b[bo + 1] - L[lo + 6] * y0) / L[lo + 7];
  let y2 = (b[bo + 2] - L[lo + 12] * y0 - L[lo + 13] * y1) / L[lo + 14];
  let y3 = (b[bo + 3] - L[lo + 18] * y0 - L[lo + 19] * y1 - L[lo + 20] * y2) / L[lo + 21];
  let y4 = (b[bo + 4] - L[lo + 24] * y0 - L[lo + 25] * y1 - L[lo + 26] * y2 - L[lo + 27] * y3) / L[lo + 28];
  let y5 = (b[bo + 5] - L[lo + 30] * y0 - L[lo + 31] * y1 - L[lo + 32] * y2 - L[lo + 33] * y3 - L[lo + 34] * y4) / L[lo + 35];
  // backward: Lᵀ x = y
  y5 = y5 / L[lo + 35];
  y4 = (y4 - L[lo + 34] * y5) / L[lo + 28];
  y3 = (y3 - L[lo + 27] * y4 - L[lo + 33] * y5) / L[lo + 21];
  y2 = (y2 - L[lo + 20] * y3 - L[lo + 26] * y4 - L[lo + 32] * y5) / L[lo + 14];
  y1 = (y1 - L[lo + 13] * y2 - L[lo + 19] * y3 - L[lo + 25] * y4 - L[lo + 31] * y5) / L[lo + 7];
  y0 = (y0 - L[lo + 6] * y1 - L[lo + 12] * y2 - L[lo + 18] * y3 - L[lo + 24] * y4 - L[lo + 30] * y5) / L[lo];
  x[xo] = y0;
  x[xo + 1] = y1;
  x[xo + 2] = y2;
  x[xo + 3] = y3;
  x[xo + 4] = y4;
  x[xo + 5] = y5;
}

/** Invert a symmetric 3x3 [a b c; b d e; c e f] (row-major 9 into out); returns false if singular. */
export function invSym3(m: Float64Array, mo: number, out: Float64Array, oo: number): boolean {
  const a = m[mo], b = m[mo + 1], c = m[mo + 2], d = m[mo + 4], e = m[mo + 5], f = m[mo + 8];
  const A = d * f - e * e;
  const B = -(b * f - c * e);
  const C = b * e - c * d;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-300) return false;
  const id = 1 / det;
  out[oo] = A * id;
  out[oo + 1] = B * id;
  out[oo + 2] = C * id;
  out[oo + 3] = B * id;
  out[oo + 4] = (a * f - c * c) * id;
  out[oo + 5] = -(a * e - b * c) * id;
  out[oo + 6] = C * id;
  out[oo + 7] = out[oo + 5];
  out[oo + 8] = (a * d - b * b) * id;
  return true;
}

/** Deterministic pseudo-random generator (mulberry32). */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
