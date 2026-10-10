// ---------------------------------------------------------------------------
// Background-texture metrics for S4 (thorax), as a TypeScript port of the
// research scripts so they can run in the browser harness on fresh renders.
//
// Every metric works on a 512 x 512 grey image (0..255, row-major, top-down):
//   texture()     port of docs/realism/research/texture.py (128-px tiles on a
//                 64-px grid, plane removed, Hann window, radial spectrum,
//                 brightness terciles, 4-32 px band-pass RMS = box3 - box33)
//   ridgeCount()  port of ridge.py ridges(): strict 1-D minimum over +-2 px,
//                 at least 12 levels below the 15 x 15 local mean
//   beta()        log-log slope of the radial spectrum of the central 256 px
//                 block (Hann, plane removed) over 0.008-0.08 cycles/px
//   localContrastP99()  99th percentile of (41 x 41 box mean - pixel) over
//                 the central 80 %
//   lungProfile() vertical profile variation in the lung (definition below)
//   ribAnisotropy() orientation concentration of spectral power in lung tiles
//                 (lattice check, critique item 27)
// The Python versions in scripts/thorax/thorax_metrics.py apply the same
// definitions to real library frames, so sim and real are measured alike.
// ---------------------------------------------------------------------------

export const N512 = 512;

/** Crop the outer 4 % (field border) and resample a square capture to 512 px, as texture.py does. */
export function toLib512(src: ArrayLike<number>, w: number): Float32Array {
  const out = new Float32Array(N512 * N512);
  const m = Math.floor(0.04 * w);
  const span = w - 1 - 2 * m;
  for (let y = 0; y < N512; y++)
    for (let x = 0; x < N512; x++) {
      const fx = m + (x * span) / 511,
        fy = m + (y * span) / 511;
      const x0 = Math.min(w - 2, Math.floor(fx)),
        y0 = Math.min(w - 2, Math.floor(fy));
      const ax = fx - x0,
        ay = fy - y0;
      const i = y0 * w + x0;
      out[y * N512 + x] = (src[i] * (1 - ax) + src[i + 1] * ax) * (1 - ay) + (src[i + w] * (1 - ax) + src[i + w + 1] * ax) * ay;
    }
  return out;
}

export function boxMean(img: ArrayLike<number>, r: number, W = N512, H = N512): Float64Array {
  const S = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let run = 0;
    for (let x = 0; x < W; x++) {
      run += img[y * W + x];
      S[(y + 1) * (W + 1) + x + 1] = S[y * (W + 1) + x + 1] + run;
    }
  }
  const out = new Float64Array(W * H);
  for (let y = 0; y < H; y++) {
    const y0 = Math.max(0, y - r),
      y1 = Math.min(H, y + r + 1);
    for (let x = 0; x < W; x++) {
      const x0 = Math.max(0, x - r),
        x1 = Math.min(W, x + r + 1);
      const s = S[y1 * (W + 1) + x1] - S[y0 * (W + 1) + x1] - S[y1 * (W + 1) + x0] + S[y0 * (W + 1) + x0];
      out[y * W + x] = s / ((y1 - y0) * (x1 - x0));
    }
  }
  return out;
}

function fft1(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i];
      re[i] = re[j];
      re[j] = t;
      t = im[i];
      im[i] = im[j];
      im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang),
      wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1,
        ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k,
          b = a + len / 2;
        const br = re[b] * cr - im[b] * ci,
          bi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - br;
        im[b] = im[a] - bi;
        re[a] += br;
        im[a] += bi;
        const t = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = t;
      }
    }
  }
}

/** |F|^2 of an n x n block (row-major), unnormalised. */
function power2(b: Float64Array, n: number): Float64Array {
  const re = new Float64Array(b),
    im = new Float64Array(n * n);
  const rr = new Float64Array(n),
    ri = new Float64Array(n);
  for (let pass = 0; pass < 2; pass++) {
    for (let a = 0; a < n; a++) {
      for (let k = 0; k < n; k++) {
        const idx = pass === 0 ? a * n + k : k * n + a;
        rr[k] = re[idx];
        ri[k] = im[idx];
      }
      fft1(rr, ri);
      for (let k = 0; k < n; k++) {
        const idx = pass === 0 ? a * n + k : k * n + a;
        re[idx] = rr[k];
        im[idx] = ri[k];
      }
    }
  }
  const p = new Float64Array(n * n);
  for (let i = 0; i < n * n; i++) p[i] = re[i] * re[i] + im[i] * im[i];
  return p;
}

/** Plane-detrended, Hann-windowed block and the window energy (as imlib.radial_ps). */
function prepBlock(img: ArrayLike<number>, x0: number, y0: number, n: number, W = N512): { b: Float64Array; wsum: number } {
  const b = new Float64Array(n * n);
  let m = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) m += b[j * n + i] = img[(y0 + j) * W + x0 + i];
  m /= n * n;
  const c = (n - 1) / 2;
  let sxv = 0,
    syv = 0,
    sxx = 0;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const v = b[j * n + i] - m;
      sxv += (i - c) * v;
      syv += (j - c) * v;
      sxx += (i - c) * (i - c);
    }
  const ax = sxv / sxx,
    ay = syv / sxx;
  const w = new Float64Array(n);
  // imlib.hann2: w[i] = 0.5 - 0.5 cos(2 pi i / (n - 1))
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  let wsum = 0;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const hw = w[j] * w[i];
      wsum += hw * hw;
      b[j * n + i] = (b[j * n + i] - m - ax * (i - c) - ay * (j - c)) * hw;
    }
  return { b, wsum };
}

/** Radially averaged power spectrum, integer-radius bins (imlib.radial_ps). */
export function radialPs(img: ArrayLike<number>, x0: number, y0: number, n: number, W = N512): [number, number][] {
  const { b, wsum } = prepBlock(img, x0, y0, n, W);
  const P = power2(b, n);
  const nb = n / 2;
  const acc = new Float64Array(nb),
    cnt = new Float64Array(nb);
  for (let v = 0; v < n; v++) {
    const fv = v <= n / 2 ? v : v - n;
    for (let u = 0; u < n; u++) {
      const fu = u <= n / 2 ? u : u - n;
      const k = Math.floor(Math.hypot(fu, fv) + 0.5);
      if (k >= 1 && k < nb) {
        acc[k] += P[v * n + u] / wsum;
        cnt[k]++;
      }
    }
  }
  const out: [number, number][] = [];
  for (let k = 1; k < nb; k++) if (cnt[k]) out.push([k / n, acc[k] / cnt[k]]);
  return out;
}

export function loglogSlope(ps: [number, number][], f0: number, f1: number): number {
  const pts = ps.filter(([f, p]) => f >= f0 && f <= f1 && p > 0).map(([f, p]) => [Math.log(f), Math.log(p)]);
  if (pts.length < 3) return NaN;
  const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  let sxx = 0,
    sxy = 0;
  for (const [x, y] of pts) {
    sxx += (x - mx) ** 2;
    sxy += (x - mx) * (y - my);
  }
  return sxy / sxx;
}

const median = (a: number[]) => {
  const s = a.filter((x) => x === x).sort((p, q) => p - q);
  return s.length ? s[Math.floor(s.length / 2)] : NaN;
};

export interface TextureClass {
  mean_grey: number;
  slope_lo: number;
  slope_hi: number;
  bandRms: number;
  power: Record<string, number>;
}

/** texture.py analyse(): per brightness tercile of 128-px tiles. */
export function texture(img: Float32Array): Record<"dark" | "mid" | "bright", TextureClass> {
  type T = { x: number; y: number; mean: number; slo: number; shi: number; ps: [number, number][] };
  const tiles: T[] = [];
  for (let y0 = 0; y0 <= 512 - 128; y0 += 64)
    for (let x0 = 0; x0 <= 512 - 128; x0 += 64) {
      let m = 0;
      for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) m += img[(y0 + j) * 512 + x0 + i];
      m /= 128 * 128;
      const ps = radialPs(img, x0, y0, 128);
      tiles.push({ x: x0, y: y0, mean: m, slo: loglogSlope(ps, 0.016, 0.1), shi: loglogSlope(ps, 0.1, 0.3), ps });
    }
  tiles.sort((a, b) => a.mean - b.mean);
  const n = tiles.length;
  const cls = { dark: tiles.slice(0, Math.floor(n / 3)), mid: tiles.slice(Math.floor(n / 3), Math.floor((2 * n) / 3)), bright: tiles.slice(Math.floor((2 * n) / 3)) };
  const b3 = boxMean(img, 1),
    b33 = boxMean(img, 16);
  const out = {} as Record<"dark" | "mid" | "bright", TextureClass>;
  for (const k of ["dark", "mid", "bright"] as const) {
    const ts = cls[k];
    const rms: number[] = [];
    for (const t of ts) {
      let s = 0,
        c = 0;
      for (let j = t.y + 16; j < t.y + 112; j += 2)
        for (let i = t.x + 16; i < t.x + 112; i += 2) {
          const d = b3[j * 512 + i] - b33[j * 512 + i];
          s += d * d;
          c++;
        }
      rms.push(Math.sqrt(s / c));
    }
    const power: Record<string, number> = {};
    for (const f of [0.016, 0.031, 0.062, 0.125, 0.25]) {
      power[String(f)] = median(ts.map((t) => t.ps.reduce((best, q) => (Math.abs(q[0] - f) < Math.abs(best[0] - f) ? q : best))[1]));
    }
    out[k] = {
      mean_grey: ts.reduce((s, t) => s + t.mean, 0) / ts.length,
      slope_lo: median(ts.map((t) => t.slo)),
      slope_hi: median(ts.map((t) => t.shi)),
      bandRms: median(rms),
      power,
    };
  }
  return out;
}

/** ridge.py ridges(): thin dark-line pixel counts by depth (12-25, 25-50, >50). */
export function ridgeCount(img: Float32Array): [number, number, number] {
  const m = boxMean(img, 7);
  const W = 512;
  const cnt: [number, number, number] = [0, 0, 0];
  for (let y = 2; y < 510; y++)
    for (let x = 2; x < 510; x++) {
      const o = y * W + x;
      const v = img[o];
      const d = m[o] - v;
      if (d < 12) continue;
      if ((v < img[o - 2] && v < img[o + 2]) || (v < img[o - 2 * W] && v < img[o + 2 * W])) cnt[d < 25 ? 0 : d < 50 ? 1 : 2]++;
    }
  return cnt;
}

/** Spectral slope beta of the central 256 px block over 0.008-0.08 cycles/px (sign flipped: positive). */
export function beta(img: Float32Array): number {
  return -loglogSlope(radialPs(img, 128, 128, 256), 0.008, 0.08);
}

/** 99th percentile of (41 x 41 box mean - pixel) over the central 80 %. */
export function localContrastP99(img: Float32Array): number {
  const m = boxMean(img, 20);
  const v: number[] = [];
  for (let y = 51; y < 461; y++) for (let x = 51; x < 461; x++) v.push(m[y * 512 + x] - img[y * 512 + x]);
  v.sort((a, b) => a - b);
  return v[Math.floor(0.99 * (v.length - 1))];
}

/**
 * Vertical lung profile variation. Columns whose mean over rows 64-448 lies in the brightest
 * quartile of column means are lung columns (aerated lung is brightest). For each of up to
 * 8 such columns spread across the image, take a 5-column-averaged vertical profile over
 * rows 64-448, remove a 41-px running mean (large-scale shading), and report half of
 * (p95 - p5) of the residual. Returns the median over the columns.
 */
export function lungProfile(img: Float32Array): number {
  const colMean: [number, number][] = [];
  for (let x = 40; x < 472; x++) {
    let s = 0;
    for (let y = 64; y < 448; y++) s += img[y * 512 + x];
    colMean.push([x, s / 384]);
  }
  const sorted = [...colMean].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, Math.floor(sorted.length / 4)).map((c) => c[0]).sort((a, b) => a - b);
  const pick: number[] = [];
  for (let k = 0; k < 8 && top.length; k++) pick.push(top[Math.floor(((k + 0.5) / 8) * top.length)]);
  const res: number[] = [];
  for (const x of pick) {
    const prof: number[] = [];
    for (let y = 44; y < 468; y++) {
      let s = 0;
      for (let dx = -2; dx <= 2; dx++) s += img[y * 512 + Math.min(511, Math.max(0, x + dx))];
      prof.push(s / 5);
    }
    const r: number[] = [];
    for (let i = 20; i < prof.length - 20; i++) {
      let s = 0;
      for (let k = -20; k <= 20; k++) s += prof[i + k];
      r.push(prof[i] - s / 41);
    }
    r.sort((a, b) => a - b);
    res.push((r[Math.floor(0.95 * (r.length - 1))] - r[Math.floor(0.05 * (r.length - 1))]) / 2);
  }
  return median(res);
}

/**
 * Lattice check: in each bright-tercile 128-px tile, the 2D power in the 0.02-0.12 cycles/px
 * annulus is binned by orientation (12 bins of 15 degrees); the concentration is the share of
 * the strongest two adjacent bins (1/6 = isotropic). A crossing rib lattice gives two strong
 * orientations; this reports the median concentration and the median share of the second
 * strongest non-adjacent orientation peak (lattice = two separate peaks).
 */
export function anisotropy(img: Float32Array): { conc: number; second: number } {
  const tiles: { x: number; y: number; mean: number }[] = [];
  for (let y0 = 0; y0 <= 384; y0 += 64)
    for (let x0 = 0; x0 <= 384; x0 += 64) {
      let m = 0;
      for (let j = 0; j < 128; j += 2) for (let i = 0; i < 128; i += 2) m += img[(y0 + j) * 512 + x0 + i];
      tiles.push({ x: x0, y: y0, mean: m });
    }
  tiles.sort((a, b) => b.mean - a.mean);
  const sel = tiles.slice(0, Math.floor(tiles.length / 3));
  const conc: number[] = [],
    second: number[] = [];
  for (const t of sel) {
    const { b } = prepBlock(img, t.x, t.y, 128);
    const P = power2(b, 128);
    const bins = new Float64Array(12);
    for (let v = 0; v < 128; v++) {
      const fv = (v <= 64 ? v : v - 128) / 128;
      for (let u = 0; u < 128; u++) {
        const fu = (u <= 64 ? u : u - 128) / 128;
        const f = Math.hypot(fu, fv);
        if (f < 0.02 || f > 0.12) continue;
        let a = Math.atan2(fv, fu);
        if (a < 0) a += Math.PI;
        bins[Math.min(11, Math.floor((a / Math.PI) * 12))] += P[v * 128 + u];
      }
    }
    const tot = bins.reduce((s, x) => s + x, 0) || 1;
    let best = 0,
      bi = 0;
    for (let i = 0; i < 12; i++) {
      const s = bins[i] + bins[(i + 1) % 12];
      if (s > best) {
        best = s;
        bi = i;
      }
    }
    let sec = 0;
    for (let i = 0; i < 12; i++) {
      const d = Math.min(Math.abs(i - bi), 12 - Math.abs(i - bi));
      if (d < 3) continue;
      sec = Math.max(sec, bins[i] + bins[(i + 1) % 12]);
    }
    conc.push(best / tot);
    second.push(sec / tot);
  }
  return { conc: median(conc), second: median(second) };
}

export interface BackgroundMetrics {
  lungBandRms: number;
  lungPower0125: number;
  lungSlopeHi: number;
  midBandRms: number;
  darkBandRms: number;
  beta: number;
  lc99: number;
  ridge: number;
  lungProfile: number;
  greyP5: number;
  greyP50: number;
  greyP95: number;
  aniso: { conc: number; second: number };
}

export function allMetrics(img: Float32Array): BackgroundMetrics {
  const t = texture(img);
  const r = ridgeCount(img);
  const s = Array.from(img).sort((a, b) => a - b);
  const q = (p: number) => s[Math.floor(p * (s.length - 1))];
  return {
    lungBandRms: t.bright.bandRms,
    lungPower0125: t.bright.power["0.125"],
    lungSlopeHi: t.bright.slope_hi,
    midBandRms: t.mid.bandRms,
    darkBandRms: t.dark.bandRms,
    beta: beta(img),
    lc99: localContrastP99(img),
    ridge: r[0] + r[1] + r[2],
    lungProfile: lungProfile(img),
    greyP5: q(0.05),
    greyP50: q(0.5),
    greyP95: q(0.95),
    aniso: anisotropy(img),
  };
}
