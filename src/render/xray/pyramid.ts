// ---------------------------------------------------------------------------
// Multi-scale processing of the log image (GLSL ES 3.00 sources + CPU maths).
//
// A Laplacian pyramid (Burt and Adelson) of the log signal L:
//   G0 = L (from the detector stage), G(k+1) = decimate(binomial6 * Gk), k = 0..6
//   band k = Gk - up(G(k+1)), with up = cubic B-spline interpolation
//   R7 = residualGain * G7 (harmonisation: compresses large-area differences about the
//        metered level, which is L = 0)
//   Rk = up(R(k+1)) + gain_k * core_k(band k)
// The same up() is used for analysis and synthesis, so with all gains 1 and no coring the
// reconstruction is exact. Mid-band gains above the residual gain produce the large-border
// shoulder (halo) of flat-panel harmonisation; the fine bands give edge enhancement. Coring is
// a noise-adaptive soft attenuation of small band values, with the noise SD of each band known
// from the detected quanta (G channel) and the analytic band noise factors below.
//
// Texture channels through the pyramid: R = log signal, G = white-noise variance (log domain),
// B = shutter mask, A = expected noise-free normalised signal.
// ---------------------------------------------------------------------------

/**
 * G0..G7. Eight levels (C1, wave 2; six before): at 768 px band k holds detail of about 2^k px, so
 * bands 5 and 6 hold the 8-35 mm scales of the heart border, the diaphragm and the spine edges,
 * which the six-level pyramid left in the residual and compressed with the whole-field range.
 */
export const PYR_LEVELS = 8;
/**
 * Levels used for the analytic output-noise gain: bands beyond this carry a negligible share of the
 * per-pixel noise variance, and the phase-averaged computation grows as 4^levels, so the coarser
 * bands are folded into the residual of the computation (their band alphas are still exact).
 */
const NOISE_GAIN_LEVELS = 5;

/** 6-tap binomial low-pass for 2:1 decimation (centre between two fine texels). */
export const BINOMIAL6 = [1, 5, 10, 10, 5, 1].map((w) => w / 32);

export const DOWN_FS = (header: string) => `${header}
in vec2 vTex;
out vec4 frag;
uniform sampler2D uSrc;
const float W6[6] = float[6](${BINOMIAL6.map((w) => w.toFixed(6)).join(", ")});
void main() {
  ivec2 ip = ivec2(gl_FragCoord.xy);
  ivec2 sz = textureSize(uSrc, 0);
  ivec2 o = ip * 2 - 2;
  vec4 acc = vec4(0.0);
  for (int j = 0; j < 6; j++) {
    vec4 row = vec4(0.0);
    int y = clamp(o.y + j, 0, sz.y - 1);
    for (int i = 0; i < 6; i++) {
      int x = clamp(o.x + i, 0, sz.x - 1);
      row += W6[i] * texelFetch(uSrc, ivec2(x, y), 0);
    }
    acc += W6[j] * row;
  }
  frag = acc;
}
`;

/**
 * Cubic B-spline interpolation from 4 bilinear taps (needs LINEAR filtering on the source).
 * upsampleTexel takes the position in the coarse texture's texel-centre coordinates. The
 * synthesis passes use st = gl_FragCoord.xy / 2 - 0.5, the exact 2:1 mapping that DOWN_FS
 * assumes (coarse texel i is centred on fine position 2i + 1), so analysis and synthesis stay
 * registered for any render size, including sizes that are not a multiple of 32 (a fine level of
 * odd width has a coarse level of ceil(w / 2) texels; normalised uv would misregister them by up
 * to half a fine pixel). upsample(t, uv) is kept for callers that work in normalised uv.
 */
export const UPSAMPLE_GLSL = `
vec4 upsampleTexel(sampler2D t, vec2 st) {
  vec2 size = vec2(textureSize(t, 0));
  vec2 i = floor(st);
  vec2 f = st - i;
  vec2 f2 = f * f, f3 = f2 * f;
  vec2 w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0;
  vec2 w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0;
  vec2 w2 = (1.0 + 3.0 * f + 3.0 * f2 - 3.0 * f3) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1, g1 = w2 + w3;
  vec2 h0 = (i - 1.0 + w1 / g0 + 0.5) / size;
  vec2 h1 = (i + 1.0 + w3 / g1 + 0.5) / size;
  vec4 t00 = texture(t, vec2(h0.x, h0.y));
  vec4 t10 = texture(t, vec2(h1.x, h0.y));
  vec4 t01 = texture(t, vec2(h0.x, h1.y));
  vec4 t11 = texture(t, vec2(h1.x, h1.y));
  return g0.y * (g0.x * t00 + g1.x * t10) + g1.y * (g0.x * t01 + g1.x * t11);
}
vec4 upsample(sampler2D t, vec2 uv) {
  return upsampleTexel(t, uv * vec2(textureSize(t, 0)) - 0.5);
}
`;

export const RECON_FS = (header: string) => `${header}
${UPSAMPLE_GLSL}
in vec2 vTex;
out vec4 frag;
uniform sampler2D uG;      // Gaussian level k
uniform sampler2D uGc;     // Gaussian level k+1
uniform sampler2D uRc;     // reconstruction at level k+1 (unused at the top level)
uniform float uTop;        // 1 when level k+1 is the residual
uniform float uResGain;
uniform float uGain;
uniform float uCoreK, uCoreDepth, uAlpha;
void main() {
  ivec2 ip = ivec2(gl_FragCoord.xy);
  vec4 G = texelFetch(uG, ip, 0);
  // exact 2:1 registration with DOWN_FS (see UPSAMPLE_GLSL)
  vec2 st = gl_FragCoord.xy * 0.5 - 0.5;
  vec4 upG = upsampleTexel(uGc, st);
  float base = uTop > 0.5 ? uResGain * upG.r : upsampleTexel(uRc, st).r;
  float b = G.r - upG.r;
  float sig = uAlpha * sqrt(max(G.g, 0.0));
  float t = uCoreK * sig;
  float core = 1.0 - uCoreDepth * exp(-(b * b) / (t * t + 1e-12));
  frag = vec4(base + uGain * core * b, G.g, G.b, G.a);
}
`;

/**
 * Low-resolution readback for the auto-window and dose-rate metering: a regular point subsample
 * (every uStride-th pixel) of the full-resolution processed log image, so its percentiles are
 * those of the displayed image (thin dark vessels included), plus the shutter mask, the
 * unprocessed log value and, in texels (0, 0) and (1, 0), the AEC meter signal (primary plus
 * scatter) and the primary transmission alone.
 */
export const METER_FS = (header: string, scatterGlsl: string) => `${header}
${scatterGlsl}
in vec2 vTex;
out vec4 frag;
uniform sampler2D uR0;     // processed log at level 0
uniform sampler2D uG0;     // level 0 of the pyramid (unprocessed log, shutter mask)
uniform int uStride;
void main() {
  ivec2 ip = ivec2(gl_FragCoord.xy);
  ivec2 sz = textureSize(uR0, 0);
  ivec2 q = min(ip * uStride + uStride / 2, sz - 1);
  vec4 r = texelFetch(uR0, q, 0);
  vec4 g = texelFetch(uG0, q, 0);
  frag = vec4(r.r, g.b, g.r, ip == ivec2(0) ? meterSignal() : ip == ivec2(1, 0) ? meterPrimary() : 0.0);
}
`;

/** Display tone curve (pivot-anchored two-slope window into the LUT), shared by passes. */
export const TONE_GLSL = `
uniform sampler2D uLut;
uniform float uPivot, uXPivot, uSlopeA, uSlopeB, uEps;
float lut(float d) { return texture(uLut, vec2(clamp(d, 0.0, 1.0) * (255.0 / 256.0) + 0.5 / 256.0, 0.5)).r; }
float tone(float L) {
  float u = uPivot - L;
  return lut(uXPivot + uSlopeA * u + uSlopeB * (sqrt(u * u + uEps * uEps) - uEps));
}
// |d tone / d L| (display units per log unit)
float toneSlope(float L) {
  float h = 0.02 / uSlopeA;
  return abs(tone(L - h) - tone(L + h)) / (2.0 * h);
}
`;

/** Meter subsample size: about 128 x 128 points whatever the render resolution. */
export function meterStride(res: number): number {
  return Math.max(1, Math.round(res / 128));
}

// ---------------------------------------------------------------------------
// Analytic noise propagation through MTF + pyramid (white input, phase-averaged)
// ---------------------------------------------------------------------------

type K1 = Map<number, number>;

function addTo(dst: K1, src: K1, w: number, shift = 0) {
  for (const [i, v] of src) dst.set(i + shift, (dst.get(i + shift) ?? 0) + v * w);
}
function dotK(a: K1, b: K1) {
  let s = 0;
  for (const [i, v] of a) {
    const u = b.get(i);
    if (u !== undefined) s += v * u;
  }
  return s;
}
function mtfKernel(sigma: number): K1 {
  const t = gaussTaps7(sigma);
  const m: K1 = new Map();
  for (let k = -3; k <= 3; k++) if (t[Math.abs(k)]) m.set(k, t[Math.abs(k)]);
  return m;
}
function gaussTaps7(s: number) {
  if (!(s > 0.05)) return [1, 0, 0, 0];
  const w = [0, 1, 2, 3].map((k) => Math.exp(-(k * k) / (2 * s * s)));
  const sum = w[0] + 2 * (w[1] + w[2] + w[3]);
  return w.map((x) => x / sum);
}
/** B-spline weights for fine pixel j of level k from level k+1: [coarse index, weight][]. */
function upWeights(j: number): [number, number][] {
  const x = j / 2 - 0.25;
  const i = Math.floor(x);
  const f = x - i;
  const f2 = f * f,
    f3 = f2 * f;
  return [
    [i - 1, (1 - 3 * f + 3 * f2 - f3) / 6],
    [i, (4 - 6 * f2 + 3 * f3) / 6],
    [i + 1, (1 + 3 * f + 3 * f2 - 3 * f3) / 6],
    [i + 2, f3 / 6],
  ];
}

/** 1-D kernels over input samples for one axis. */
class Axis {
  private c0: K1[] = []; // c_k(0): kernel of G_k at index 0
  constructor(sigma: number, levels: number) {
    this.c0.push(mtfKernel(sigma));
    for (let k = 0; k < levels; k++) {
      const prev = this.c0[k];
      const next: K1 = new Map();
      const step = 2 ** k;
      // G_{k+1}(0) = sum_t w6[t] G_k(-2 + t)
      for (let t = 0; t < 6; t++) addTo(next, prev, BINOMIAL6[t], (t - 2) * step);
      this.c0.push(next);
    }
  }
  /** kernel of G_k at level-k index l */
  c(k: number, l: number): K1 {
    const out: K1 = new Map();
    addTo(out, this.c0[k], 1, l * 2 ** k);
    return out;
  }
  /** kernel of up(G_{k+1}) at level-k index j */
  upc(k: number, j: number): K1 {
    const out: K1 = new Map();
    for (const [i, w] of upWeights(j)) addTo(out, this.c0[k + 1], w, i * 2 ** (k + 1));
    return out;
  }
  /** kernel of up^k (signal at level k given by fn(l)) at level-0 index j */
  toLevel0(k: number, j: number, fn: (l: number) => K1): K1 {
    // weights over level-k indices for fine index j
    let w: Map<number, number> = new Map([[j, 1]]);
    for (let lev = 0; lev < k; lev++) {
      const nw: Map<number, number> = new Map();
      for (const [idx, a] of w) for (const [ci, b] of upWeights(idx)) nw.set(ci, (nw.get(ci) ?? 0) + a * b);
      w = nw;
    }
    const out: K1 = new Map();
    for (const [l, a] of w) addTo(out, fn(l), a);
    return out;
  }
}

export interface NoiseFactors {
  /** SD of band k at its own level, per unit white-input SD (k = 0..levels-1) */
  bandAlpha: number[];
  /** SD of the processed level-0 output per unit white-input SD, for the given gains */
  outputGain: number;
  /** SD of the MTF-filtered input per unit white SD */
  mtfGain: number;
}

/**
 * Noise propagation of white input through the MTF and the pyramid, averaged over pixel phase.
 * gains: band gains (length levels = PYR_LEVELS - 1), residual gain applies to the last level.
 * Band alphas are exact for every band; the output gain uses the first NOISE_GAIN_LEVELS bands with
 * the gain of the next band standing in for everything coarser (relative error below 1e-3 for the
 * profiles' gains: the coarse bands hold almost none of the white-noise variance).
 */
export function noiseFactors(sigmaX: number, sigmaY: number, gains: number[], residualGain: number, levelsAll = PYR_LEVELS - 1): NoiseFactors {
  const axAll = new Axis(sigmaX, levelsAll);
  const ayAll = new Axis(sigmaY, levelsAll);
  const levels = Math.min(levelsAll, NOISE_GAIN_LEVELS);
  const ax = new Axis(sigmaX, levels);
  const ay = new Axis(sigmaY, levels);
  // band alphas: terms c_k(j) and -up c_{k+1}(j), phases j = 0, 1
  const bandAlpha: number[] = [];
  for (let k = 0; k < levelsAll; k++) {
    const stat = (a: Axis) => {
      let A = 0,
        B = 0,
        AB = 0;
      for (const j of [0, 1]) {
        const c = a.c(k, j);
        const u = a.upc(k, j);
        A += dotK(c, c) / 2;
        B += dotK(u, u) / 2;
        AB += dotK(c, u) / 2;
      }
      return { A, B, AB };
    };
    const sx = stat(axAll),
      sy = stat(ayAll);
    bandAlpha.push(Math.sqrt(Math.max(0, sx.A * sy.A - 2 * sx.AB * sy.AB + sx.B * sy.B)));
  }
  // output: sum of separable terms s_n (p_n x q_n), phase-averaged dot products per axis
  const phases = 2 ** levels;
  const termsFor = (a: Axis, j: number): K1[] => {
    const t: K1[] = [];
    for (let k = 0; k < levels; k++) {
      t.push(a.toLevel0(k, j, (l) => a.c(k, l)));
      t.push(a.toLevel0(k, j, (l) => a.upc(k, l)));
    }
    t.push(a.toLevel0(levels, j, (l) => a.c(levels, l)));
    return t;
  };
  const coef: number[] = [];
  for (let k = 0; k < levels; k++) coef.push(gains[k] ?? 1, -(gains[k] ?? 1));
  coef.push(levels < levelsAll ? (gains[levels] ?? residualGain) : residualGain);
  const nT = coef.length;
  const meanDots = (a: Axis) => {
    const D = Array.from({ length: nT }, () => new Array<number>(nT).fill(0));
    for (let j = 0; j < phases; j++) {
      const t = termsFor(a, j);
      for (let p = 0; p < nT; p++) for (let q = p; q < nT; q++) {
        const v = dotK(t[p], t[q]) / phases;
        D[p][q] += v;
        if (q !== p) D[q][p] += v;
      }
    }
    return D;
  };
  const Dx = meanDots(ax),
    Dy = meanDots(ay);
  let v = 0;
  for (let p = 0; p < nT; p++) for (let q = 0; q < nT; q++) v += coef[p] * coef[q] * Dx[p][q] * Dy[p][q];
  const mx = mtfKernel(sigmaX),
    my = mtfKernel(sigmaY);
  return { bandAlpha, outputGain: Math.sqrt(Math.max(0, v)), mtfGain: Math.sqrt(dotK(mx, mx) * dotK(my, my)) };
}

// ---------------------------------------------------------------------------
// Display LUT and auto-window
// ---------------------------------------------------------------------------

export interface LutShape {
  slope: number;
  mid: number;
  gamma: number;
}

/** 256-entry S-shaped LUT on 0..1 (logistic, normalised to span 0..1, then gamma). */
export function buildLut(s: LutShape, n = 256): Float32Array {
  const out = new Float32Array(n);
  const sig = (x: number) => 1 / (1 + Math.exp(-s.slope * (x - s.mid) * 2));
  const a = sig(0),
    b = sig(1);
  for (let i = 0; i < n; i++) {
    const d = i / (n - 1);
    const y = (sig(d) - a) / (b - a);
    out[i] = Math.pow(Math.min(1, Math.max(0, y)), s.gamma);
  }
  return out;
}

export function lutAt(t: Float32Array, d: number): number {
  const x = Math.min(1, Math.max(0, d)) * (t.length - 1);
  const i = Math.min(t.length - 2, Math.floor(x));
  const f = x - i;
  return t[i] * (1 - f) + t[i + 1] * f;
}

/** Inverse of a monotonic LUT. */
export function lutInverse(t: Float32Array, y: number): number {
  let lo = 0,
    hi = 1;
  for (let k = 0; k < 40; k++) {
    const m = (lo + hi) / 2;
    if (lutAt(t, m) < y) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export function lutSlope(t: Float32Array, d: number): number {
  return (lutAt(t, d + 0.01) - lutAt(t, d - 0.01)) / 0.02;
}

/**
 * Display window: a pivot-anchored tone curve on the processed log signal L (high L = dark).
 * The LUT input is x(L) = xPivot + a u + b (sqrt(u^2 + eps^2) - eps), u = pivot - L, with
 * a = (slopeBright + slopeDark) / 2 and b = (slopeBright - slopeDark) / 2: a smooth curve with
 * slope slopeBright on the bright side of the pivot and slopeDark on the dark side. With equal
 * slopes it is an ordinary linear window. white/width give the equivalent linear window.
 */
export interface WindowState {
  /** log value displayed at the white end of the equivalent linear window */
  white: number;
  /** equivalent linear window width in log units */
  width: number;
  /** processed log value of the pivot (the median) */
  pivot: number;
  /** LUT input at the pivot */
  xPivot: number;
  /** LUT-input change per log unit, bright side (L < pivot) and dark side */
  slopeBright: number;
  slopeDark: number;
  /** smoothing half-width of the slope change, log units */
  eps: number;
}

/** A plain linear window (white end, width in log units). */
export function linearWindow(white: number, width: number): WindowState {
  const w = Math.max(1e-3, width);
  return { white, width: w, pivot: 0, xPivot: white / w, slopeBright: 1 / w, slopeDark: 1 / w, eps: 0.1 * w };
}

/** LUT input (0..1) of processed log value L (as in the display shader). */
export function windowX(w: WindowState, L: number): number {
  const u = w.pivot - L;
  const a = (w.slopeBright + w.slopeDark) / 2;
  const b = (w.slopeBright - w.slopeDark) / 2;
  return Math.min(1, Math.max(0, w.xPivot + a * u + b * (Math.sqrt(u * u + w.eps * w.eps) - w.eps)));
}

/** Display value (0..1) of processed log value L under a window. */
export function toneAt(t: Float32Array, w: WindowState, L: number): number {
  return lutAt(t, windowX(w, L));
}

/** |d display / d L| at L (display units per log unit). */
export function toneSlopeAt(t: Float32Array, w: WindowState, L: number): number {
  const h = 0.01 * w.width;
  return Math.abs(toneAt(t, w, L - h) - toneAt(t, w, L + h)) / (2 * h);
}

/** Blend two windows (first-order lag step a, 0..1). */
export function lagWindow(w: WindowState, target: WindowState, a: number): WindowState {
  const m = (x: number, y: number) => x + a * (y - x);
  return {
    white: m(w.white, target.white),
    width: m(w.width, target.width),
    pivot: m(w.pivot, target.pivot),
    xPivot: m(w.xPivot, target.xPivot),
    slopeBright: m(w.slopeBright, target.slopeBright),
    slopeDark: m(w.slopeDark, target.slopeDark),
    eps: m(w.eps, target.eps),
  };
}

/**
 * Window that puts the 5th and 95th display-grey percentiles at the profile targets and, when a
 * p50 target and the median are given, the median at its target too, by letting the slopes on
 * the two sides of the median differ up to ratioMax (beyond that the median is left where the
 * ratio limit puts it). lp5 / lp50 / lp95 are percentiles of the processed log signal (high L =
 * dark; the 95th log percentile becomes the 5th grey percentile).
 */
export function solveWindow(
  lp5: number,
  lp95: number,
  lut: Float32Array,
  target: { p5: number; p95: number; p50?: number },
  minWidth = 0.25,
  lp50?: number,
  ratioMax = 2.5
): WindowState {
  const dDark = lutInverse(lut, target.p5 / 255);
  const dBright = lutInverse(lut, target.p95 / 255);
  const span = Math.max(minWidth * Math.max(1e-3, dBright - dDark), lp95 - lp5);
  // when the floor binds (a frame with a narrow range), the extra span is shared equally by the two ends, so
  // the frame sits in the middle of the window (p5 above and p95 below their targets) rather than being
  // pinned to the bright target (C1 review round)
  const lo = lp5 - Math.max(0, span - (lp95 - lp5)) / 2;
  if (target.p50 === undefined || lp50 === undefined) {
    const width = span / Math.max(1e-3, dBright - dDark);
    return linearWindow(lo + width * dBright, width);
  }
  const dMid = lutInverse(lut, target.p50 / 255);
  const r = Math.min(0.95, Math.max(0.05, (lp50 - lo) / span)); // median position from the bright end
  const pivot = lo + r * span;
  const eps = 0.1 * span;
  const uB = r * span,
    uD = -(1 - r) * span;
  const fB = Math.sqrt(uB * uB + eps * eps) - eps,
    fD = Math.sqrt(uD * uD + eps * eps) - eps;
  // exact through (p5, p50, p95): [uB fB; uD fD] [a; b] = [dB - dM; dD - dM]
  const det = uB * fD - uD * fB;
  let xP = dMid;
  let A = ((dBright - dMid) * fD - (dDark - dMid) * fB) / det;
  let B = (uB * (dDark - dMid) - uD * (dBright - dMid)) / det;
  const rm = Math.max(1, ratioMax);
  const ok = A - B > 0 && A + B > 0 && (A + B) / (A - B) <= rm && (A - B) / (A + B) <= rm;
  if (!ok) {
    const q = A + B > 0 && A - B > 0 && (A + B) / (A - B) < 1 ? 1 / rm : rm;
    const k = (q - 1) / (q + 1);
    A = (dBright - dDark) / (uB - uD + k * (fB - fD));
    B = k * A;
    xP = dBright - A * uB - B * fB;
  }
  const width = 1 / A;
  return { white: pivot + xP * width, width, pivot, xPivot: xP, slopeBright: A + B, slopeDark: A - B, eps };
}

/**
 * Window solve with an optional band for the median: when the plain two-point window (p5 and
 * p95 on target, equal tone slopes) already puts the median grey inside p50Band, it is used as
 * it is; otherwise the median is pulled to the nearer band edge (or to p50 when no band is
 * given) with the two-slope curve of solveWindow. Pulling the median only as far as needed keeps
 * the tone slope of the darker half (where the heart shadow and the vessels are) as high as the
 * percentile targets allow.
 */
export function solveWindowBand(
  lp5: number,
  lp50: number,
  lp95: number,
  lut: Float32Array,
  target: { p5: number; p95: number; p50?: number; p50Band?: [number, number] },
  ratioMax = 2.5,
  minWidth = 0.25
): WindowState {
  if (target.p50Band) {
    const [lo, hi] = target.p50Band;
    const plain = solveWindow(lp5, lp95, lut, { p5: target.p5, p95: target.p95 }, minWidth);
    const g = 255 * toneAt(lut, plain, lp50);
    if (g >= lo && g <= hi) return plain;
    return solveWindow(lp5, lp95, lut, { p5: target.p5, p95: target.p95, p50: Math.min(hi, Math.max(lo, g)) }, minWidth, lp50, ratioMax);
  }
  return solveWindow(lp5, lp95, lut, target, minWidth, lp50, ratioMax);
}

/**
 * Band gains for a render resolution. Profile gains are defined at the 768 px reference, where
 * band k holds detail of about 2^k px. At another resolution band k holds 2^k render px =
 * 2^k x 768 / res reference px, so its gain is read from the reference curve at the fractional
 * index k + log2(768 / res) (linear interpolation, clamped at the ends). At 768 the gains are
 * returned unchanged. Used for the coring depths too.
 */
export function gainsAtRes(gains: readonly number[], res: number, refRes = 768): number[] {
  const shift = Math.log2(refRes / Math.max(1, res));
  const n = gains.length;
  if (Math.abs(shift) < 1e-9) return [...gains];
  return gains.map((_, k) => {
    const x = Math.min(n - 1, Math.max(0, k + shift));
    const i = Math.min(n - 2, Math.floor(x));
    const f = x - i;
    return gains[i] * (1 - f) + gains[i + 1] * f;
  });
}

export interface Percentiles {
  p5: number;
  p50: number;
  p95: number;
  mean: number;
  /** fraction of the analysed region inside the open (unshuttered) field */
  openFraction: number;
  n: number;
}

/**
 * Percentiles of the processed log signal from a meter readback (RGBA float, w x h), over the
 * central 76% of the field (the crop the library grey-percentile targets were measured on),
 * open-field pixels only.
 */
export function readbackPercentiles(data: Float32Array, w: number, h: number, circle: boolean, margin = 0.12): Percentiles | null {
  const buf = new Float32Array(w * h);
  let nv = 0;
  let tot = 0;
  let sum = 0;
  for (let y = 0; y < h; y++) {
    const v = (y + 0.5) / h;
    if (v < margin || v > 1 - margin) continue;
    for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w;
      if (u < margin || u > 1 - margin) continue;
      if (circle && Math.hypot(u - 0.5, v - 0.5) > 0.45) continue;
      tot++;
      const o = (y * w + x) * 4;
      if (data[o + 1] < 0.5) continue;
      const L = data[o];
      if (!Number.isFinite(L)) continue;
      buf[nv++] = L;
      sum += L;
    }
  }
  if (nv < 16) return null;
  const vals = buf.subarray(0, nv).sort();
  const q = (p: number) => vals[Math.min(vals.length - 1, Math.max(0, Math.round(p * (vals.length - 1))))];
  return { p5: q(0.05), p50: q(0.5), p95: q(0.95), mean: sum / vals.length, openFraction: vals.length / Math.max(1, tot), n: vals.length };
}
