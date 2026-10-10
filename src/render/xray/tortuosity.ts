// ---------------------------------------------------------------------------
// Band-limited 3D tortuosity for coronary centrelines.
//
// Real coronary arteries undulate at several scales. Traced on library cines
// (scripts/anatomy_validation, method of the anatomy-motion audit), the RMS of
// the projected tangent angle in difference-of-moving-average bands is:
//   3-8 mm wavelengths   9.0-18.6° (tracing-noise floor 6.6-7.5°)
//   8-20 mm              6.5-22.4° (LAD median 11.2°)
//   20-60 mm             7.8-35.9°
// The generator below produces lateral offsets in the local surface frame
// (in-surface normal, and height above the epicardium) as three octaves of
// randomly phased sinusoids with wavelengths spread over each band. The
// amplitudes are model parameters calibrated so that projections of the
// generated trees land in those ranges (anatomy.test.ts). A helical
// "corkscrew" mode, a minimum radius of curvature, straight ostia and a
// per-patient index complete it. An optional course octave (35-90 mm) gives a
// trunk its long meander. Offsets are applied before the vessel is
// resampled by arc length, so lesion positions in mm stay where they are put.
// ---------------------------------------------------------------------------

import { Rng } from "../../utils/random";

export interface Band {
  /** wavelength range, mm */
  lo: number;
  hi: number;
  /** target RMS tangent-angle contribution of the band at index 1, degrees (model parameter) */
  deg: number;
}

/** The three octaves (model parameters, calibrated in anatomy.test.ts against the library ranges). */
export const BANDS: Band[] = [
  { lo: 3.5, hi: 8, deg: 24 },
  { lo: 8, hi: 20, deg: 25 },
  { lo: 20, hi: 60, deg: 22 },
];

/** Minimum radius of curvature of the undulation, mm (model parameter). */
export const MIN_RADIUS_MM = 2.2;

/** Height undulation relative to the lateral one (vessels dip into the fat less than they snake): model parameter. */
export const HEIGHT_RATIO = 0.8;
/** the same for the longest octave (epicardial vessels do not leave the surface by centimetres): model parameter */
export const HEIGHT_RATIO_LOW = 0.3;

export interface TortuosityOptions {
  /** per-patient (and per-vessel class) index, 1 = median */
  index: number;
  /** helical corkscrew mode */
  corkscrew?: boolean;
  /** straight run at the start (ostium), mm */
  straightStartMm?: number;
  /** extra damping of the lowest octave (main trunks already curve with the heart), 0..1 */
  lowOctave?: number;
  /** extra factor on the shortest octave (small vessels wiggle more), default 1 */
  highOctave?: number;
  /**
   * RMS tangent angle (degrees, at this vessel's index) of an extra course octave with wavelengths COURSE_BAND (35-90 mm),
   * lateral only: the long meander of a trunk on the heart, which the library's "20-60 mm" band (differences of 21 and
   * 61 mm moving averages) responds to most. Default 0.
   */
  courseDeg?: number;
  /** height amplitude of the course octave relative to its lateral amplitude (default HEIGHT_RATIO_LOW / 2) */
  courseHeight?: number;
}

/** wavelength range of the course octave, mm (model parameter: where the library's 20-60 mm band filter responds) */
export const COURSE_BAND: Band = { lo: 35, hi: 90, deg: 0 };

export interface Offsets {
  /** in-surface lateral offset, mm, per sample */
  lat: Float64Array;
  /** height offset, mm, per sample */
  hgt: Float64Array;
}

interface Wave {
  k: number; // 2π / λ
  a: number; // amplitude mm
  ph: number;
  ph2: number;
}

function bandWaves(rng: Rng, band: Band, scale: number, n = 4): Wave[] {
  const out: Wave[] = [];
  const target = (band.deg * Math.PI) / 180 / Math.sqrt(n); // RMS angle per wave
  for (let i = 0; i < n; i++) {
    // log-uniform wavelength across the band
    const lam = band.lo * Math.pow(band.hi / band.lo, (i + rng.next()) / n);
    const k = (2 * Math.PI) / lam;
    // a sinusoid of amplitude A has tangent-angle RMS A k / √2
    const a = ((target * Math.SQRT2) / k) * scale * (0.7 + 0.6 * rng.next());
    out.push({ k, a, ph: rng.next() * 2 * Math.PI, ph2: rng.next() * 2 * Math.PI });
  }
  return out;
}

/**
 * Offsets for a vessel sampled at arc lengths `s` (mm, increasing). Deterministic for a seed.
 */
export function tortuosityOffsets(seed: string, s: ArrayLike<number>, o: TortuosityOptions): Offsets {
  const rng = new Rng("tort:" + seed);
  const n = s.length;
  const lat = new Float64Array(n);
  const hgt = new Float64Array(n);
  if (n < 2 || o.index <= 0) return { lat, hgt };
  const total = s[n - 1] - s[0];
  const lowF = o.lowOctave ?? 1;
  const highF = o.highOctave ?? 1;
  const octaves = BANDS.map((b, bi) => bandWaves(rng, b, o.index * (bi === 0 ? highF : bi === 2 ? lowF : 1)));
  const st = o.straightStartMm ?? 6;
  // envelope: straight at the ostium, full beyond; short vessels get less of the long octave
  const env = (x: number) => {
    const t = Math.min(1, Math.max(0, (x - st * 0.3) / Math.max(1, st)));
    return t * t * (3 - 2 * t);
  };
  // the shortest octave (and the helix) is kept apart: only it is reduced where the curvature limit bites
  const latHi = new Float64Array(n),
    hgtHi = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const x = s[i] - s[0];
    let l = 0,
      h = 0,
      lh = 0,
      hh = 0;
    for (let b = 0; b < octaves.length; b++) {
      const longW = b === 2 ? Math.min(1, total / 60) : 1;
      for (const w of octaves[b]) {
        const dl = longW * w.a * Math.sin(w.k * x + w.ph);
        const dh = longW * w.a * (b === 2 ? HEIGHT_RATIO_LOW : HEIGHT_RATIO) * Math.sin(w.k * x + w.ph2);
        if (b === 0) {
          lh += dl;
          hh += dh;
        } else {
          l += dl;
          h += dh;
        }
      }
    }
    const e = env(x);
    lat[i] = l * e;
    hgt[i] = h * e;
    latHi[i] = lh * e;
    hgtHi[i] = hh * e;
  }
  if (o.corkscrew) {
    // helix superimposed on the distal two thirds: radius and pitch are model parameters
    const lam = 6.5 + rng.next() * 3,
      A = 0.7 + rng.next() * 0.5,
      ph = rng.next() * 2 * Math.PI;
    for (let i = 0; i < n; i++) {
      const x = s[i] - s[0];
      const e = Math.min(1, Math.max(0, (x / Math.max(1, total) - 0.25) / 0.15));
      latHi[i] += A * e * Math.cos((2 * Math.PI * x) / lam + ph);
      hgtHi[i] += A * e * Math.sin((2 * Math.PI * x) / lam + ph);
    }
  }
  limitCurvature(s, lat, hgt, latHi, hgtHi);
  if (o.courseDeg && o.courseDeg > 0 && total > COURSE_BAND.lo) {
    // its own random stream, so the other octaves stay as they were; full only on vessels long enough to hold a wave
    const crs = new Rng("course:" + seed);
    const waves = bandWaves(crs, { ...COURSE_BAND, deg: o.courseDeg }, o.index * Math.min(1, total / COURSE_BAND.hi), 3);
    for (let i = 0; i < n; i++) {
      const x = s[i] - s[0];
      let l = 0,
        h = 0;
      for (const w of waves) {
        l += w.a * Math.sin(w.k * x + w.ph);
        h += w.a * (o.courseHeight ?? HEIGHT_RATIO_LOW * 0.5) * Math.sin(w.k * x + w.ph2);
      }
      const e = env(x);
      lat[i] += l * e;
      hgt[i] += h * e;
    }
  }
  for (let i = 0; i < n; i++) {
    lat[i] += latHi[i];
    hgt[i] += hgtHi[i];
  }
  return { lat, hgt };
}

/**
 * Where the total undulation bends more tightly than MIN_RADIUS_MM, scale down the short-wavelength part
 * (latHi, hgtHi) there, smoothly; the longer octaves are left alone.
 */
function limitCurvature(s: ArrayLike<number>, lat: Float64Array, hgt: Float64Array, latHi: Float64Array, hgtHi: Float64Array): void {
  const n = s.length;
  if (n < 3) return;
  const kmax = 1 / MIN_RADIUS_MM;
  const d2 = (a: Float64Array, i: number, h1: number, h2: number) => (2 * ((a[i + 1] - a[i]) / h2 - (a[i] - a[i - 1]) / h1)) / (h1 + h2);
  const f = new Float64Array(n).fill(1);
  for (let i = 1; i < n - 1; i++) {
    const h1 = s[i] - s[i - 1],
      h2 = s[i + 1] - s[i];
    if (h1 <= 0 || h2 <= 0) continue;
    const lo = [d2(lat, i, h1, h2), d2(hgt, i, h1, h2)];
    const hi = [d2(latHi, i, h1, h2), d2(hgtHi, i, h1, h2)];
    if (Math.hypot(lo[0] + hi[0], lo[1] + hi[1]) <= kmax) continue;
    // largest factor t in [0, 1] with |lo + t hi| ≤ kmax (bisection)
    let a = 0,
      b = 1;
    for (let it = 0; it < 12; it++) {
      const m = (a + b) / 2;
      if (Math.hypot(lo[0] + m * hi[0], lo[1] + m * hi[1]) <= kmax) a = m;
      else b = m;
    }
    f[i] = a;
  }
  // smooth the factor (local minimum, then a moving average) so the correction does not itself kink
  const g = smoothFactor(f, 3);
  for (let i = 0; i < n; i++) {
    latHi[i] *= g[i];
    hgtHi[i] *= g[i];
  }
  // where the longer octaves alone still bend too tightly, scale everything down locally (two passes)
  for (let pass = 0; pass < 2; pass++) {
    const f2 = new Float64Array(n).fill(1);
    for (let i = 1; i < n - 1; i++) {
      const h1 = s[i] - s[i - 1],
        h2 = s[i + 1] - s[i];
      if (h1 <= 0 || h2 <= 0) continue;
      const k = Math.hypot(d2(lat, i, h1, h2) + d2(latHi, i, h1, h2), d2(hgt, i, h1, h2) + d2(hgtHi, i, h1, h2));
      if (k > kmax) f2[i] = kmax / k;
    }
    const m = smoothFactor(f2, 5);
    for (let i = 0; i < n; i++) {
      lat[i] *= m[i];
      hgt[i] *= m[i];
      latHi[i] *= m[i];
      hgtHi[i] *= m[i];
    }
  }
}

/** Local minimum over ±r samples followed by a ±r moving average (smooth, never above the minimum by much). */
function smoothFactor(f: Float64Array, r: number): Float64Array {
  const n = f.length;
  const lo = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let m = 1;
    for (let j = Math.max(0, i - 2 * r); j <= Math.min(n - 1, i + 2 * r); j++) m = Math.min(m, f[j]);
    lo[i] = m;
  }
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0,
      c = 0;
    for (let j = Math.max(0, i - r); j <= Math.min(n - 1, i + r); j++) {
      s += lo[j];
      c++;
    }
    out[i] = s / c;
  }
  return out;
}

/**
 * Band RMS of the projected tangent angle (degrees), identical to the library measurement
 * (scripts/anatomy_validation/spectrum.mjs): 1 mm resampling, tangent from a 2 mm chord, unwrapped;
 * bands are differences of moving averages with half-widths 1, 4, 10 and 30 samples; the first and
 * last 30 samples are excluded.
 */
export function tangentBandRms(pts: [number, number][]): { n: number; b3_8: number | null; b8_20: number | null; b20_60: number | null } {
  const R: [number, number][] = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    let [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    let seg = Math.hypot(x1 - x0, y1 - y0);
    while (acc + seg >= 1) {
      const t = (1 - acc) / seg;
      x0 += (x1 - x0) * t;
      y0 += (y1 - y0) * t;
      R.push([x0, y0]);
      seg = Math.hypot(x1 - x0, y1 - y0);
      acc = 0;
    }
    acc += seg;
  }
  const th: number[] = [];
  let prev: number | null = null;
  for (let i = 1; i < R.length - 1; i++) {
    let a = Math.atan2(R[i + 1][1] - R[i - 1][1], R[i + 1][0] - R[i - 1][0]);
    if (prev !== null) {
      while (a - prev > Math.PI) a -= 2 * Math.PI;
      while (a - prev < -Math.PI) a += 2 * Math.PI;
    }
    th.push(a);
    prev = a;
  }
  const ma = (x: number[], w: number) =>
    x.map((_, i) => {
      let s = 0,
        c = 0;
      for (let k = -w; k <= w; k++)
        if (x[i + k] !== undefined) {
          s += x[i + k];
          c++;
        }
      return s / c;
    });
  const a1 = ma(th, 1),
    a4 = ma(th, 4),
    a10 = ma(th, 10),
    a30 = ma(th, 30);
  const rms = (a: number[], b: number[]) => {
    let s = 0,
      n = 0;
    for (let i = 30; i < th.length - 30; i++) {
      s += (a[i] - b[i]) ** 2;
      n++;
    }
    return n ? (Math.sqrt(s / n) * 180) / Math.PI : null;
  };
  return { n: th.length, b3_8: rms(a1, a4), b8_20: rms(a4, a10), b20_60: rms(a10, a30) };
}
