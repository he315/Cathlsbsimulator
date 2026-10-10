// ---------------------------------------------------------------------------
// Detector stage of the X-ray image chain (GLSL ES 3.00 sources + CPU references).
//
// Pass order (all full resolution, one fragment per detector pixel):
//   PRIM_FS  line integral -> primary transmission, times the fluence map
//            (collimator shutters with an erfc penumbra, semi-transparent wedge
//            filters with a soft edge). Writes (Phi*Tp, Phi, P, shutter mask) to a
//            mip-mapped target; the mips feed scatter and metering.
//   DET_FS   scatter by kernel superposition on mip levels of Phi*Tp (so closing
//            the shutters removes scatter), AEC metering, detected quanta
//            N = Nm * (Phi*Tp + S) / M, quantum noise sqrt(N)*z and a
//            grey-independent floor N*sigma_f*z2, both from an integer PCG3D hash
//            of (pixel, frame): white, no lattice, no fixed pattern.
//   MTF_FS   separable 7-tap Gaussian detector MTF applied to signal and noise
//            together (run twice: x then y). The y pass adds white electronic
//            noise after the MTF and converts to log: L = -ln(s), relative to the
//            metered level (L = 0 at the meter).
//
// Output channels of the final MTF pass (level 0 of the processing pyramid):
//   R = L (log signal, relative to the meter), G = expected white-noise variance in
//   the log domain before the MTF (1/N + sigma_f^2), B = shutter mask, A = expected
//   noise-free normalised signal.
// The floor sigma_f is set per pixel from the previous frame's display slope so that
// it is constant in display grey levels, as measured on real cine (noise2.py).
// ---------------------------------------------------------------------------

/** PCG3D integer hash (Jarzynski and Olano 2020, "Hash functions for GPU rendering") and Gaussian pairs. */
export const HASH_GLSL = `
uvec3 pcg3d(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
// two independent standard normal deviates per (pixel, frame, stream)
vec2 gauss2(uvec2 px, uint frame, uint stream) {
  uvec3 h = pcg3d(uvec3(px.x, px.y, frame ^ (stream * 0x9E3779B9u)));
  vec2 u = vec2(h.xy >> 8u) * (1.0 / 16777216.0);
  float r = sqrt(-2.0 * log(max(u.x, 1e-7)));
  float a = 6.2831853 * u.y;
  return r * vec2(cos(a), sin(a));
}
`;

/** Complementary error function, Abramowitz and Stegun 7.1.26 (|error| < 1.5e-7). */
export const ERFC_GLSL = `
float erfcA(float x) {
  float z = abs(x);
  float t = 1.0 / (1.0 + 0.3275911 * z);
  float y = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * exp(-z * z);
  return x >= 0.0 ? y : 2.0 - y;
}
// fraction of the beam passing an edge at signed distance s (px, positive = open side), Gaussian penumbra sigma
float edgePass(float s, float sigma) { return 0.5 * erfcA(-s / (1.41421356 * max(sigma, 1e-3))); }
`;

export const MAX_WEDGES = 4;

export const PRIM_FS = (header: string) => `${header}
${ERFC_GLSL}
in vec2 vTex;
out vec4 frag;
uniform sampler2D uAcc;
uniform float uIodine, uMetal;
uniform vec2 uRes;
// shutters: fraction of the field covered from the left, right, top and bottom edge
uniform vec4 uShutters;
uniform float uPenSigma;   // shutter penumbra sigma (render px)
uniform float uBladeT;     // residual transmission of a shutter blade
uniform int uNWedge;
uniform vec4 uWedge[${MAX_WEDGES}];  // (nx, ny, offset in uv -1..1, transmission)
uniform float uWedgeSigma[${MAX_WEDGES}];
void main() {
  ivec2 ip = ivec2(gl_FragCoord.xy);
  vec4 a = texelFetch(uAcc, ip, 0);
  float P = max(0.0, a.r + uIodine * a.g + uMetal * a.b);
  vec2 px = gl_FragCoord.xy;
  float sh = 1.0;
  if (uShutters.x > 0.0) sh *= edgePass(px.x - uShutters.x * uRes.x, uPenSigma);
  if (uShutters.y > 0.0) sh *= edgePass((1.0 - uShutters.y) * uRes.x - px.x, uPenSigma);
  if (uShutters.z > 0.0) sh *= edgePass((1.0 - uShutters.z) * uRes.y - px.y, uPenSigma);
  if (uShutters.w > 0.0) sh *= edgePass(px.y - uShutters.w * uRes.y, uPenSigma);
  float phi = uBladeT + (1.0 - uBladeT) * sh;
  vec2 c = vTex * 2.0 - 1.0;
  for (int i = 0; i < ${MAX_WEDGES}; i++) {
    if (i >= uNWedge) break;
    // signed distance into the wedge (px): the wedge covers dot(c, n) > offset
    float s = (dot(c, uWedge[i].xy) - uWedge[i].z) * 0.5 * uRes.x;
    float cover = edgePass(s, uWedgeSigma[i]);
    phi *= mix(1.0, uWedge[i].w, cover);
  }
  frag = vec4(phi * exp(-P), phi, P, sh);
}
`;

/**
 * Scatter kernels: mip level (at 768 px; offset by log2(res/768)) and weight. A mip level L
 * averages about 2^L px, so the three kernels span roughly 32, 90 and 180 px (about 10, 27 and
 * 54 mm at the detector for a 230 mm field). Model parameters: broad enough that collimation
 * visibly lowers the scatter reaching the open field.
 */
export const SCATTER_KERNELS = [
  { lod: 5.0, w: 0.3 },
  { lod: 6.5, w: 0.4 },
  { lod: 7.5, w: 0.3 },
];

/** Shared scatter and metering functions on the mip-mapped primary target. */
export const SCATTER_GLSL = `
uniform sampler2D uPrim;
uniform float uSpr;
uniform float uLodBase;   // log2(res / 768): keeps the kernels a fixed size in mm
uniform float uMaxLod;
// scatter-kernel superposition: three broad low-pass kernels of the collimated primary
// (kernel widths about 32, 90 and 180 px at 768: SCATTER_KERNELS; weights are model parameters)
float scatterAt(vec2 uv) {
  float s = ${SCATTER_KERNELS.map((k) => `${k.w.toFixed(3)} * textureLod(uPrim, uv, uLodBase + ${k.lod.toFixed(2)}).r`).join(" + ")};
  return uSpr * s;
}
// AEC metering: mean detector signal over five central points, within the open field
float meterSignal() {
  float lod = max(0.0, uMaxLod - 4.0);
  vec2 pts[5] = vec2[5](vec2(0.5, 0.5), vec2(0.38, 0.5), vec2(0.62, 0.5), vec2(0.5, 0.38), vec2(0.5, 0.62));
  float num = 0.0, den = 0.0;
  for (int i = 0; i < 5; i++) {
    vec4 p = textureLod(uPrim, pts[i], lod);
    num += p.r + scatterAt(pts[i]) * p.g;
    den += p.g;
  }
  return max(num / max(den, 1e-3), 1e-5);
}
// primary transmission alone at the same metering points (for dose-rate control: water-equivalent path)
float meterPrimary() {
  float lod = max(0.0, uMaxLod - 4.0);
  vec2 pts[5] = vec2[5](vec2(0.5, 0.5), vec2(0.38, 0.5), vec2(0.62, 0.5), vec2(0.5, 0.38), vec2(0.5, 0.62));
  float num = 0.0, den = 0.0;
  for (int i = 0; i < 5; i++) {
    vec4 p = textureLod(uPrim, pts[i], lod);
    num += p.r;
    den += p.g;
  }
  return max(num / max(den, 1e-3), 1e-7);
}
`;

/**
 * AEC meter value of the frame, computed once into a 1 x 1 target (R = meter signal, G = primary
 * transmission at the metering points) so the detector pass reads one texel instead of
 * re-evaluating about 20 texture reads per pixel.
 */
export const METER1_FS = (header: string) => `${header}
${SCATTER_GLSL}
out vec4 frag;
void main() { frag = vec4(meterSignal(), meterPrimary(), 0.0, 1.0); }
`;

export const DET_FS = (header: string, toneGlsl: string) => `${header}
${HASH_GLSL}
${SCATTER_GLSL}
${toneGlsl}
in vec2 vTex;
out vec4 frag;
uniform float uCounts;     // AEC target quanta per pixel at the meter (or entrance quanta with AEC off)
uniform float uEta;        // detected quanta per entrance quantum (profile)
uniform float uAec;        // 1 = exposure normalised to the meter, 0 = fixed entrance quanta
uniform float uSettle;     // run-start noise factor (1 at steady state)
uniform float uFloorL;     // grey-independent floor SD in log units at the median grey (before the MTF)
uniform float uFloorDisp;  // the floor as a display SD (0..1) divided by the chain's noise gain
uniform sampler2D uPrevRec;// previous frame's processed log image (for the local display slope)
uniform float uUsePrev;
uniform float uFloorDark;  // floor SD ratio exp(uFloorDark) between greys uFloorG0 - 0.125 and uFloorG0 + 0.125 (dark heavier)
uniform float uFloorG0;    // display grey (0..1) at which the dark weighting is 1
uniform uint uFrameSeed;
uniform sampler2D uMeterTex; // 1 x 1: R = meter signal of this frame (METER1_FS)
void main() {
  ivec2 ip = ivec2(gl_FragCoord.xy);
  vec4 p = texelFetch(uPrim, ip, 0);
  float M = texelFetch(uMeterTex, ivec2(0), 0).r;
  float Tdet = p.r + scatterAt(vTex) * p.g;
  float sExp = Tdet / M;
  float Nm = uCounts * uEta * (uAec > 0.5 ? 1.0 : M) / (uSettle * uSettle);
  float N = max(Nm * sExp, 1e-6);
  // the floor is constant in display grey: scale it by the local slope of the tone curve
  float fl = uFloorL;
  if (uUsePrev > 0.5) {
    float Lp = texelFetch(uPrevRec, ip, 0).r;
    fl = clamp(uFloorDisp / max(toneSlope(Lp), 1e-4), 0.33 * uFloorL, 3.0 * uFloorL);
    // optional mild dark-side weighting of the floor (profile floorDarkSlope; model parameter)
    if (uFloorDark != 0.0) fl *= clamp(exp(uFloorDark * (uFloorG0 - tone(Lp)) * 4.0), 0.5, 2.0);
  }
  fl *= uSettle;
  vec2 z = gauss2(uvec2(ip), uFrameSeed, 1u);
  float Nn = N + sqrt(N) * z.x + N * fl * z.y;
  // G: expected white-noise variance in the log domain (quantum + floor)
  frag = vec4(Nn / Nm, 1.0 / N + fl * fl, p.a, sExp);
}
`;

export const MTF_FS = (header: string) => `${header}
${HASH_GLSL}
in vec2 vTex;
out vec4 frag;
uniform sampler2D uSrc;
uniform ivec2 uDir;
uniform float uTap[4];     // Gaussian MTF taps: centre, 1, 2, 3 px
uniform float uFinal;      // 1 on the second (y) pass: add electronic noise and take the log
uniform float uElec;       // electronic noise SD, normalised to the meter quanta
uniform float uLmin, uLmax;
uniform float uBladeT;
uniform uint uFrameSeed;
void main() {
  ivec2 ip = ivec2(gl_FragCoord.xy);
  ivec2 sz = textureSize(uSrc, 0);
  vec4 c = texelFetch(uSrc, ip, 0);
  float s = c.r * uTap[0];
  for (int k = 1; k <= 3; k++) {
    ivec2 a = clamp(ip + uDir * k, ivec2(0), sz - 1);
    ivec2 b = clamp(ip - uDir * k, ivec2(0), sz - 1);
    s += (texelFetch(uSrc, a, 0).r + texelFetch(uSrc, b, 0).r) * uTap[k];
  }
  if (uFinal < 0.5) {
    frag = vec4(s, c.g, c.b, c.a);
    return;
  }
  s += uElec * gauss2(uvec2(ip), uFrameSeed, 2u).x;
  // processing sees the field as if unshuttered (the display puts the blade attenuation back),
  // so closed shutters do not ring through the band filters
  float L = clamp(-log(max(s, 1e-4)) + log(uBladeT + (1.0 - uBladeT) * clamp(c.b, 0.0, 1.0)), uLmin, uLmax);
  frag = vec4(L, c.g, c.b, c.a);
}
`;

// ---------------------------------------------------------------------------
// CPU helpers and references (used by the renderer for uniforms, and by tests)
// ---------------------------------------------------------------------------

/** Normalised Gaussian MTF taps for offsets 0..3 px (7-tap kernel). */
export function gaussTaps(sigmaPx: number): [number, number, number, number] {
  if (!(sigmaPx > 0.05)) return [1, 0, 0, 0];
  const w = [0, 1, 2, 3].map((k) => Math.exp(-(k * k) / (2 * sigmaPx * sigmaPx)));
  const sum = w[0] + 2 * (w[1] + w[2] + w[3]);
  return [w[0] / sum, w[1] / sum, w[2] / sum, w[3] / sum];
}

/** Abramowitz and Stegun 7.1.26, as in the shader. */
export function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const y = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-z * z);
  return x >= 0 ? y : 2 - y;
}

export interface Wedge {
  /** edge normal angle in radians (0 = the wedge covers the right side of the image) */
  angle: number;
  /** edge position along the normal, in image half-widths from the centre (-1..1) */
  offset: number;
  /** primary transmission inside the wedge, 0..1 (default 0.4; model parameter) */
  transmission?: number;
  /** 10-90% edge width in render px (default 3) */
  edgePx?: number;
}

/** 10-90% width of a Gaussian edge in units of its sigma (2 x 1.2816). */
export const EDGE_10_90_PER_SIGMA = 2.5631;

/**
 * Fluence map at pixel (x, y) of a res x res detector (CPU reference of PRIM_FS).
 * shutters: [left, right, top, bottom] covered fractions; y grows upwards like gl_FragCoord.
 */
export function fluenceAt(
  x: number,
  y: number,
  res: number,
  shutters: [number, number, number, number] = [0, 0, 0, 0],
  penumbraPx = 6,
  wedges: Wedge[] = [],
  bladeT = BLADE_TRANSMISSION
): number {
  const sig = penumbraPx / EDGE_10_90_PER_SIGMA;
  const pass = (s: number, sg: number) => 0.5 * erfc(-s / (Math.SQRT2 * Math.max(sg, 1e-3)));
  let sh = 1;
  if (shutters[0] > 0) sh *= pass(x - shutters[0] * res, sig);
  if (shutters[1] > 0) sh *= pass((1 - shutters[1]) * res - x, sig);
  if (shutters[2] > 0) sh *= pass((1 - shutters[2]) * res - y, sig);
  if (shutters[3] > 0) sh *= pass(y - shutters[3] * res, sig);
  let phi = bladeT + (1 - bladeT) * sh;
  const cx = (x / res) * 2 - 1;
  const cy = (y / res) * 2 - 1;
  for (const w of wedges.slice(0, MAX_WEDGES)) {
    const s = (cx * Math.cos(w.angle) + cy * Math.sin(w.angle) - w.offset) * 0.5 * res;
    const cover = pass(s, (w.edgePx ?? 3) / EDGE_10_90_PER_SIGMA);
    phi *= 1 + ((w.transmission ?? DEFAULT_WEDGE_TRANSMISSION) - 1) * cover;
  }
  return phi;
}

/** residual transmission of a collimator blade (model parameter: blades are near-opaque) */
export const BLADE_TRANSMISSION = 0.03;
/** default wedge transmission (model parameter) */
export const DEFAULT_WEDGE_TRANSMISSION = 0.4;
/** default shutter penumbra, 10-90% in render px at 768 (plan target 4-8 px; model parameter) */
export const DEFAULT_PENUMBRA_PX = 6;
/** scatter-to-primary multiplier with the anti-scatter grid removed (model parameter) */
export const GRID_OUT_SPR_FACTOR = 2.5;

/**
 * Mean scatter over the open field relative to the open-field primary, for a uniform phantom
 * (CPU reference of the scatter model): the kernel input is the collimated primary, so closing
 * the shutters lowers the scatter reaching the open field.
 */
export function meanScatterUniform(res: number, shutters: [number, number, number, number], spr: number): number {
  // box approximation of each mip kernel on a coarse grid
  const n = 96;
  const phi: number[] = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) phi.push(fluenceAt(((i + 0.5) * res) / n, ((j + 0.5) * res) / n, res, shutters, DEFAULT_PENUMBRA_PX));
  const scale = res / 768;
  const kern = SCATTER_KERNELS.map((k) => ({ w: k.w, r: Math.max(1, Math.round(((2 ** k.lod * scale) / 2 / res) * n)) }));
  let sNum = 0,
    sDen = 0;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      if (phi[j * n + i] < 0.5) continue;
      let s = 0;
      for (const { w, r } of kern) {
        let acc = 0,
          cnt = 0;
        for (let dj = -r; dj <= r; dj++)
          for (let di = -r; di <= r; di++) {
            const ii = Math.min(n - 1, Math.max(0, i + di));
            const jj = Math.min(n - 1, Math.max(0, j + dj));
            acc += phi[jj * n + ii];
            cnt++;
          }
        s += (w * acc) / cnt;
      }
      sNum += spr * s;
      sDen += 1;
    }
  return sDen ? sNum / sDen : 0;
}
