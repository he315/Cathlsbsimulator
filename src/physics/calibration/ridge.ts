// ---------------------------------------------------------------------------
// Dark-line (catheter) tracing in a single fluoroscopy frame. Pure functions
// on a grey image; no I/O (trace.ts does the file work). Used to trace the
// catheter silhouette in the pre-contrast first frame of real runs for the
// rest-shape calibration.
//
// Method (all parameters below are tracing parameters, chosen on the library
// frames and checked visually on the QC sheets, not physical constants):
// 1. Gaussian smoothing at sigma = 2 px (a 6 F catheter is about 6.5 px wide
//    at the library scale; the optimal line-detector scale is w / (2 sqrt 3)
//    ~ 1.9 px) and the Hessian by central differences.
// 2. Dark-line strength R = lambda1 - |lambda2| (lambda1 the larger
//    eigenvalue, positive across a dark valley), clipped at 0, scaled by
//    sigma^2; the line direction is the eigenvector of lambda2.
// 3. Entry candidates: local maxima of R in a band along the top of the
//    exposed field (catheters enter the field from above in every view of the
//    library used here) and along the side edges.
// 4. Ridge following from each entry: 1.5 px steps, turning at most 24 deg
//    per step (minimum radius ~ 3.6 px ~ 1.1 mm, tighter than any catheter
//    curve), choosing the direction with the strongest mean R over a 6 px
//    look-ahead, then re-centring across the line on the R-weighted
//    centroid. The trace ends where the look-ahead strength stays below 30%
//    of the shaft's median strength for 5 steps (the tip), leaves the field
//    or meets itself.
// 5. Outer width across the line (10-90% of the edge gradient extrema) along
//    the trace, for the per-run scale check.
// ---------------------------------------------------------------------------

import type { Grey } from "./image";

export interface RidgeMap {
  w: number;
  h: number;
  /** dark-line strength */
  R: Float32Array;
  /** unit line direction (along the line) */
  ux: Float32Array;
  uy: Float32Array;
  /** smoothed image */
  G: Float32Array;
  /** exposed field bounding box (inclusive) */
  field: { x0: number; y0: number; x1: number; y1: number };
}

export function gaussBlur(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const r = Math.ceil(3 * sigma);
  const k = new Float32Array(2 * r + 1);
  let s = 0;
  for (let i = -r; i <= r; i++) {
    k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma));
    s += k[i + r];
  }
  for (let i = 0; i < k.length; i++) k[i] /= s;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let a = 0;
      for (let i = -r; i <= r; i++) {
        const xx = Math.min(w - 1, Math.max(0, x + i));
        a += k[i + r] * src[y * w + xx];
      }
      tmp[y * w + x] = a;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let a = 0;
      for (let i = -r; i <= r; i++) {
        const yy = Math.min(h - 1, Math.max(0, y + i));
        a += k[i + r] * tmp[yy * w + x];
      }
      out[y * w + x] = a;
    }
  }
  return out;
}

/** Exposed-field box: rows and columns whose grey-level spread exceeds that of a flat collimator border. */
export function exposedField(im: Grey): { x0: number; y0: number; x1: number; y1: number } {
  const { w, h, px } = im;
  const colSd = (x: number) => {
    let s = 0, s2 = 0;
    for (let y = 0; y < h; y += 2) {
      const v = px[y * w + x];
      s += v;
      s2 += v * v;
    }
    const n = Math.ceil(h / 2);
    return Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2));
  };
  const rowSd = (y: number) => {
    let s = 0, s2 = 0;
    for (let x = 0; x < w; x += 2) {
      const v = px[y * w + x];
      s += v;
      s2 += v * v;
    }
    const n = Math.ceil(w / 2);
    return Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2));
  };
  // a border column/row is nearly uniform; the exposed field is textured (tracing parameter: SD 4)
  let x0 = 0, x1 = w - 1, y0 = 0, y1 = h - 1;
  while (x0 < w / 3 && colSd(x0) < 4) x0++;
  while (x1 > (2 * w) / 3 && colSd(x1) < 4) x1--;
  while (y0 < h / 3 && rowSd(y0) < 4) y0++;
  while (y1 > (2 * h) / 3 && rowSd(y1) < 4) y1--;
  // the collimator edge itself is a strong step: stay 6 px inside it
  return { x0: x0 + 6, y0: y0 + 6, x1: x1 - 6, y1: y1 - 6 };
}

export function ridgeMap(im: Grey, sigma = 2): RidgeMap {
  const { w, h } = im;
  const G = gaussBlur(im.px, w, h, sigma);
  const R = new Float32Array(w * h);
  const ux = new Float32Array(w * h);
  const uy = new Float32Array(w * h);
  const s2 = sigma * sigma;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gxx = G[i + 1] - 2 * G[i] + G[i - 1];
      const gyy = G[i + w] - 2 * G[i] + G[i - w];
      const gxy = 0.25 * (G[i + w + 1] - G[i + w - 1] - G[i - w + 1] + G[i - w - 1]);
      const tr = gxx + gyy;
      const det = gxx * gyy - gxy * gxy;
      const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
      const l1 = tr / 2 + disc;
      const l2 = tr / 2 - disc;
      R[i] = Math.max(0, l1 - Math.abs(l2)) * s2;
      // eigenvector of l2 (along the line): (gxy, l2 - gxx) or (l2 - gyy, gxy)
      let ex = gxy, ey = l2 - gxx;
      if (Math.abs(ex) + Math.abs(ey) < 1e-9) {
        ex = l2 - gyy;
        ey = gxy;
      }
      const l = Math.hypot(ex, ey) || 1;
      ux[i] = ex / l;
      uy[i] = ey / l;
    }
  }
  return { w, h, R, ux, uy, G, field: exposedField(im) };
}

export function bilinear(a: Float32Array, w: number, h: number, x: number, y: number): number {
  const x0 = Math.max(0, Math.min(w - 2, Math.floor(x))), y0 = Math.max(0, Math.min(h - 2, Math.floor(y)));
  const fx = Math.max(0, Math.min(1, x - x0)), fy = Math.max(0, Math.min(1, y - y0));
  const i = y0 * w + x0;
  return a[i] * (1 - fx) * (1 - fy) + a[i + 1] * fx * (1 - fy) + a[i + w] * (1 - fx) * fy + a[i + w + 1] * fx * fy;
}

export interface TraceResult {
  /** centre line, entry first, px (x right, y down) */
  pts: [number, number][];
  /** mean dark-line strength along the trace */
  meanR: number;
  /** median strength of the first 40 steps (shaft) */
  shaftR: number;
  /** why the trace ended */
  end: "tip" | "field" | "self" | "steps";
}

const STEP = 1.5;
const MAX_TURN = (24 * Math.PI) / 180;
const LOOK = [1.5, 3, 4.5, 6];

function inField(m: RidgeMap, x: number, y: number): boolean {
  const f = m.field;
  return x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1;
}

function lookScore(m: RidgeMap, x: number, y: number, dx: number, dy: number): number {
  let s = 0;
  for (const k of LOOK) s += bilinear(m.R, m.w, m.h, x + dx * k, y + dy * k);
  return s / LOOK.length;
}

/** Re-centre a point across the line on the R-weighted centroid within +-2.5 px. */
function recentre(m: RidgeMap, x: number, y: number, dx: number, dy: number): [number, number] {
  const nx = -dy, ny = dx;
  let sw = 0, st = 0;
  for (let t = -2.5; t <= 2.5; t += 0.5) {
    const r = bilinear(m.R, m.w, m.h, x + nx * t, y + ny * t);
    sw += r;
    st += r * t;
  }
  const t = sw > 0 ? Math.max(-1, Math.min(1, st / sw)) : 0;
  return [x + nx * t, y + ny * t];
}

/** Follow the dark line from (x, y) heading (dx, dy). */
export function followRidge(m: RidgeMap, x: number, y: number, dx: number, dy: number, maxSteps = 1400): TraceResult {
  const pts: [number, number][] = [[x, y]];
  const scores: number[] = [];
  let low = 0;
  let end: TraceResult["end"] = "steps";
  let ref = 0;
  for (let it = 0; it < maxSteps; it++) {
    let best = -Infinity, bdx = dx, bdy = dy;
    for (let a = -MAX_TURN; a <= MAX_TURN + 1e-9; a += MAX_TURN / 6) {
      const c = Math.cos(a), s = Math.sin(a);
      const ex = dx * c - dy * s, ey = dx * s + dy * c;
      // slight preference for going straight (tracing parameter)
      const sc = lookScore(m, x, y, ex, ey) * (1 - 0.15 * Math.abs(a) / MAX_TURN);
      if (sc > best) {
        best = sc;
        bdx = ex;
        bdy = ey;
      }
    }
    scores.push(best);
    if (it === 40) {
      const s = scores.slice().sort((a, b) => a - b);
      ref = s[Math.floor(s.length / 2)];
    }
    const thr = it >= 40 ? 0.3 * ref : 0.3 * Math.max(...scores);
    if (best < thr) {
      low++;
      if (low >= 5) {
        // back off the low steps: the tip is the last strong point
        pts.splice(pts.length - (low - 1), low - 1);
        end = "tip";
        break;
      }
    } else low = 0;
    let nx = x + bdx * STEP, ny = y + bdy * STEP;
    [nx, ny] = recentre(m, nx, ny, bdx, bdy);
    const ddx = nx - x, ddy = ny - y, l = Math.hypot(ddx, ddy) || 1;
    // direction: blend of the chosen heading and the re-centred step
    dx = 0.5 * bdx + 0.5 * (ddx / l);
    dy = 0.5 * bdy + 0.5 * (ddy / l);
    const dl = Math.hypot(dx, dy) || 1;
    dx /= dl;
    dy /= dl;
    x = nx;
    y = ny;
    if (!inField(m, x, y)) {
      end = "field";
      break;
    }
    // meeting itself (more than 15 px of path back)
    let self = false;
    for (let k = 0; k < pts.length - 12; k++) {
      if (Math.hypot(pts[k][0] - x, pts[k][1] - y) < 2) {
        self = true;
        break;
      }
    }
    if (self) {
      end = "self";
      break;
    }
    pts.push([x, y]);
  }
  let sum = 0;
  for (const p of pts) sum += bilinear(m.R, m.w, m.h, p[0], p[1]);
  return { pts, meanR: sum / pts.length, shaftR: ref, end };
}

export interface Entry {
  x: number;
  y: number;
  dx: number;
  dy: number;
  r: number;
}

/** Entry candidates: strong dark-line maxima in a band inside the top and side edges of the field. */
export function entryCandidates(m: RidgeMap, maxN = 8): Entry[] {
  const f = m.field;
  const out: Entry[] = [];
  const band = 6;
  // top band: maxima along x on row f.y0 + band
  const scan = (fixed: number, from: number, to: number, horiz: boolean, dx: number, dy: number) => {
    const vals: number[] = [];
    for (let t = from; t <= to; t++) vals.push(horiz ? bilinear(m.R, m.w, m.h, t, fixed) : bilinear(m.R, m.w, m.h, fixed, t));
    const sorted = vals.slice().sort((a, b) => a - b);
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    for (let i = 3; i < vals.length - 3; i++) {
      const v = vals[i];
      if (v < vals[i - 1] || v < vals[i + 1] || v < vals[i - 2] || v < vals[i + 2] || v < vals[i - 3] || v < vals[i + 3]) continue;
      if (v < 2 * p90 || v < 1.5) continue;
      const t = from + i;
      out.push({ x: horiz ? t : fixed, y: horiz ? fixed : t, dx, dy, r: v });
    }
  };
  scan(f.y0 + band, f.x0 + 4, f.x1 - 4, true, 0, 1);
  scan(f.x0 + band, f.y0 + 4, f.y1 - 4, false, 1, 0);
  scan(f.x1 - band, f.y0 + 4, f.y1 - 4, false, -1, 0);
  out.sort((a, b) => b.r - a.r);
  // the line direction at the entry, oriented into the field
  for (const e of out) {
    const i = Math.round(e.y) * m.w + Math.round(e.x);
    let ux = m.ux[i], uy = m.uy[i];
    if (ux * e.dx + uy * e.dy < 0) {
      ux = -ux;
      uy = -uy;
    }
    if (ux * e.dx + uy * e.dy > 0.3) {
      e.dx = ux;
      e.dy = uy;
    }
  }
  return out.slice(0, maxN);
}

/** Outer width (px) across the line at a trace point: distance between the steepest falling and rising edges. */
export function widthAt(G: Float32Array, w: number, h: number, x: number, y: number, ux: number, uy: number, half = 10): number | null {
  const nx = -uy, ny = ux;
  const prof: number[] = [];
  for (let t = -half; t <= half + 1e-9; t += 0.25) {
    let s = 0;
    for (let a = -2; a <= 2; a++) s += bilinear(G, w, h, x + nx * t + ux * a, y + ny * t + uy * a);
    prof.push(s / 5);
  }
  const mid = Math.floor(prof.length / 2);
  let im = mid;
  for (let i = mid - 8; i <= mid + 8; i++) if (prof[i] < prof[im]) im = i;
  let L = im, Rr = im;
  for (let i = im; i > 1; i--) {
    const g = prof[i + 1] - prof[i - 1];
    if (g < prof[L + 1] - prof[L - 1]) L = i;
  }
  for (let i = im; i < prof.length - 2; i++) {
    const g = prof[i + 1] - prof[i - 1];
    if (g > prof[Rr + 1] - prof[Rr - 1]) Rr = i;
  }
  const wd = (Rr - L) * 0.25;
  return wd > 2 && wd < 14 ? wd : null;
}

/**
 * Valley depth (grey levels) across the line at a point: the darker of the two side backgrounds
 * (+-6 px) minus the centre, on the smoothed image. A catheter is a valley; an edge or a gap is not.
 */
export function valleyDepth(G: Float32Array, w: number, h: number, x: number, y: number, ux: number, uy: number): number {
  const nx = -uy, ny = ux;
  const c = bilinear(G, w, h, x, y);
  const l = bilinear(G, w, h, x + 6 * nx, y + 6 * ny);
  const r = bilinear(G, w, h, x - 6 * nx, y - 6 * ny);
  return Math.min(l, r) - c;
}

/** Resample a polyline at a fixed arc-length step. */
export function resamplePolyline(pts: [number, number][], step: number): [number, number][] {
  if (pts.length < 2) return pts.slice();
  const out: [number, number][] = [[pts[0][0], pts[0][1]]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1][0], ay = pts[i - 1][1], bx = pts[i][0], by = pts[i][1];
    const L = Math.hypot(bx - ax, by - ay);
    let s = step - carry;
    while (s <= L) {
      out.push([ax + ((bx - ax) * s) / L, ay + ((by - ay) * s) / L]);
      s += step;
    }
    carry = L - (s - step);
  }
  return out;
}

export function polylineLength(pts: [number, number][]): number {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}
