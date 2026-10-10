// ---------------------------------------------------------------------------
// Thin-object profile: a cylinder's chord convolved with the detector PSF.
//
// A sub-pixel cylinder (guidewire, coil, marker band, stent strut, small
// branch) cannot be point-sampled at pixel centres without beading. Its image
// is instead drawn as the exact cylinder line integral convolved with a
// Gaussian point spread function, which conserves the integral (the volume)
// and fixes the footprint to the blur.
//
// In units of the Gaussian sigma (x = distance from the axis / sigma,
// rho = radius / sigma) the cross profile is
//
//   g(x, rho) = integral over |u| <= rho of 2 sqrt(rho^2 - u^2) phi(x - u) du
//
// with phi the standard normal density; integral of g over x is pi rho^2.
// The table stores h = g / (pi rho^2), which tends to phi(x) as rho -> 0 and
// integrates to 1 for every rho. Real profile (mm, path length across the
// cylinder for a ray perpendicular to it): pi r^2 / sigma * h(d / sigma, r / sigma).
//
// Layout: THIN_LUT_W columns (x) by THIN_LUT_H rows (rho), R32F.
//   row j:    rho_j = THIN_RHO_MAX * (j / (H - 1))^2      (dense at small rho)
//   column i: x_i   = (rho_j + THIN_X_PAD) * i / (W - 1)   (per-row extent)
// Lookup interpolates linearly in x within the two bracketing rows, then
// linearly between rows in sqrt(rho). The same arithmetic is used by the CPU
// reference (thinLookup) and the shaders (THIN_GLSL), so they agree.
// ---------------------------------------------------------------------------

export const THIN_LUT_W = 64;
export const THIN_LUT_H = 32;
/** largest tabulated radius in sigma units; larger radii fall back to the unblurred chord */
export const THIN_RHO_MAX = 8;
/** profile extent beyond the radius, in sigma units (phi(4) = 1.3e-4 of the peak) */
export const THIN_X_PAD = 4;

/** Standard normal density. */
function phi(x: number) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * g(x, rho) by quadrature, with u = rho sin(theta): the integrand
 * 2 rho^2 cos^2(theta) phi(x - rho sin(theta)) is smooth on [-pi/2, pi/2].
 */
export function thinProfileExact(x: number, rho: number, n = 400): number {
  if (rho <= 0) return 0;
  let s = 0;
  const h = Math.PI / n;
  for (let k = 0; k < n; k++) {
    const th = -Math.PI / 2 + (k + 0.5) * h;
    const c = Math.cos(th);
    s += 2 * rho * rho * c * c * phi(x - rho * Math.sin(th));
  }
  return s * h;
}

let lutCache: Float32Array | null = null;

/** The normalised profile table h(x, rho) (row-major, THIN_LUT_W x THIN_LUT_H). Built once. */
export function buildThinLut(): Float32Array {
  if (lutCache) return lutCache;
  const t = new Float32Array(THIN_LUT_W * THIN_LUT_H);
  for (let j = 0; j < THIN_LUT_H; j++) {
    const q = j / (THIN_LUT_H - 1);
    const rho = THIN_RHO_MAX * q * q;
    for (let i = 0; i < THIN_LUT_W; i++) {
      const x = ((rho + THIN_X_PAD) * i) / (THIN_LUT_W - 1);
      t[j * THIN_LUT_W + i] = rho < 1e-6 ? phi(x) : thinProfileExact(x, rho, 256) / (Math.PI * rho * rho);
    }
  }
  lutCache = t;
  return t;
}

/** Linear interpolation along x within one row (mirrors THIN_GLSL thinRow). */
function thinRow(lut: Float32Array, j: number, x: number): number {
  const q = j / (THIN_LUT_H - 1);
  const rho = THIN_RHO_MAX * q * q;
  const u = (x / (rho + THIN_X_PAD)) * (THIN_LUT_W - 1);
  if (u >= THIN_LUT_W - 1) return 0;
  const i = Math.floor(u);
  const f = u - i;
  const a = lut[j * THIN_LUT_W + i];
  const b = lut[j * THIN_LUT_W + i + 1];
  return a + (b - a) * f;
}

/**
 * Normalised profile h(x, rho) from the table (x = |d| / sigma, rho = r / sigma).
 * Beyond THIN_RHO_MAX the blur is negligible and the unblurred chord is used.
 */
export function thinLookup(lut: Float32Array, x: number, rho: number): number {
  x = Math.abs(x);
  if (rho >= THIN_RHO_MAX) {
    const c2 = rho * rho - x * x;
    return c2 > 0 ? (2 * Math.sqrt(c2)) / (Math.PI * rho * rho) : 0;
  }
  const v = Math.sqrt(Math.max(rho, 0) / THIN_RHO_MAX) * (THIN_LUT_H - 1);
  const j = Math.min(THIN_LUT_H - 2, Math.floor(v));
  const f = v - j;
  return thinRow(lut, j, x) * (1 - f) + thinRow(lut, j + 1, x) * f;
}

/**
 * erf by Abramowitz and Stegun 7.1.26 (|error| <= 1.5e-7). The same polynomial
 * is in THIN_GLSL; segments.test.ts checks it against direct integration.
 */
export function erfApprox(x: number): number {
  const s = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}

// ---------------------------------------------------------------------------
// Point spread function used by the thin path.
// ---------------------------------------------------------------------------

export interface PsfParams {
  /**
   * Anti-aliasing floor, detector pixels. MODEL PARAMETER (0.5): the smallest
   * blur that keeps a point-sampled sub-pixel line free of beading. By Poisson
   * summation the per-row integral of a Gaussian line sampled at unit spacing
   * varies by about 2 exp(-2 pi^2 sigma^2); at 0.5 px that is 1.4 % for a bare
   * line and under 0.2 % for a 1.6 px wire (segments.test.ts measures it).
   * It stands for the pixel aperture plus a margin; when the detector MTF stage
   * (S2) is in place the two blurs add in quadrature.
   */
  sigmaAaPx: number;
  /**
   * Focal spot Gaussian sigma, mm, in the focal plane. Default 0.6 / 3.896 = 0.154 mm:
   * a 0.6 nominal focal spot (cardiac system, DOI 10.1117/1.JMI.11.4.045502), read as a
   * Gaussian whose width at 15 % of the peak (the IEC 60336 clause 8.2 definition of the
   * focal spot dimension) equals the nominal value; for a Gaussian that width is
   * 2 sqrt(2 ln(1/0.15)) sigma = 3.896 sigma. See docs/realism/facts/S2b.md.
   */
  focalSigmaMm: number;
  /** extra isotropic blur in pixels (motion not resolved by sub-samples), default 0 */
  extraPx: number;
}

/** Nominal focal spot value (mm) behind the default focal sigma (see PsfParams.focalSigmaMm). */
export const FOCAL_NOMINAL_MM = 0.6;
/** Full width at 15 % of the peak of a Gaussian, in sigmas: 2 sqrt(2 ln(1/0.15)). */
export const GAUSS_W15_PER_SIGMA = 2 * Math.sqrt(2 * Math.log(1 / 0.15));

export const DEFAULT_PSF: PsfParams = {
  sigmaAaPx: 0.5,
  focalSigmaMm: FOCAL_NOMINAL_MM / GAUSS_W15_PER_SIGMA,
  extraPx: 0,
};

/**
 * Total thin-path sigma in detector pixels for an object at source distance `z` (mm, along
 * the central ray) with source-image distance `sid` and detector pixel pitch `mmPerPx`.
 * Focal blur at the detector is sigma_f (SID - z) / z (geometric unsharpness).
 */
export function thinSigmaPx(psf: PsfParams, z: number, sid: number, mmPerPx: number): number {
  const zz = Math.max(z, 1);
  const fpx = (psf.focalSigmaMm * Math.max(0, sid - zz)) / zz / mmPerPx;
  return Math.sqrt(psf.sigmaAaPx * psf.sigmaAaPx + fpx * fpx + psf.extraPx * psf.extraPx);
}

/** GLSL: LUT lookup, erf and the thin-path sigma (uniforms are declared by the includer). */
export const THIN_GLSL = `
#define THIN_LUT_W ${THIN_LUT_W}
#define THIN_LUT_H ${THIN_LUT_H}
#define THIN_RHO_MAX ${THIN_RHO_MAX.toFixed(1)}
#define THIN_X_PAD ${THIN_X_PAD.toFixed(1)}
float thinRow(int j, float x) {
  float q = float(j) / float(THIN_LUT_H - 1);
  float rho = THIN_RHO_MAX * q * q;
  float u = x / (rho + THIN_X_PAD) * float(THIN_LUT_W - 1);
  if (u >= float(THIN_LUT_W - 1)) return 0.0;
  int i = int(floor(u));
  float f = u - float(i);
  float a = texelFetch(uThinLut, ivec2(i, j), 0).r;
  float b = texelFetch(uThinLut, ivec2(i + 1, j), 0).r;
  return a + (b - a) * f;
}
float thinLookup(float x, float rho) {
  x = abs(x);
  if (rho >= THIN_RHO_MAX) {
    float c2 = rho * rho - x * x;
    return c2 > 0.0 ? 2.0 * sqrt(c2) / (3.14159265 * rho * rho) : 0.0;
  }
  float v = sqrt(max(rho, 0.0) / THIN_RHO_MAX) * float(THIN_LUT_H - 1);
  int j = min(THIN_LUT_H - 2, int(floor(v)));
  float f = v - float(j);
  return thinRow(j, x) * (1.0 - f) + thinRow(j + 1, x) * f;
}
float erfA(float x) {
  float s = x < 0.0 ? -1.0 : 1.0;
  float a = abs(x);
  float t = 1.0 / (1.0 + 0.3275911 * a);
  float y = 1.0 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-a * a);
  return s * y;
}
float thinSigmaPx(float z) {
  float zz = max(z, 1.0);
  float fpx = uFocalSigmaMm * max(0.0, uSid - zz) / zz / uMmPx;
  return sqrt(uSigmaAaPx * uSigmaAaPx + fpx * fpx + uExtraPx * uExtraPx);
}
`;
