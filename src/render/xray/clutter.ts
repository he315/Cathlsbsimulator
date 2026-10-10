// ---------------------------------------------------------------------------
// GPU side of the thorax background.
//
// 1. CLUTTER_GLSL: anatomical background texture ("clutter") for the anatomy
//    pass. The anatomy pass solves the large organs exactly; real thoraces also
//    carry fine structure (lung parenchyma and small vessels, interstitium,
//    fat planes, muscle) that gives a fluoroscopy frame its texture. ANAT_FS
//    calls, once per detector ray:
//
//      float clutter(vec3 ro, vec3 rd, vec2 bodyIv, float lungPath)
//
//      ro, rd     ray origin (focal spot) and unit direction, patient frame (mm)
//      bodyIv     (tIn, tOut) of the ray through the body
//      lungPath   aerated lung path length on this ray (mm, after carving)
//
//    and adds the returned line-integral increment. The texture is a 3D
//    random field fixed to the anatomy: a six-octave gradient-noise field
//    (1.25-40 mm) with a power-law spectrum, integrated by ray marching
//    inside each lung in lung-local coordinates,
//    so it stretches and slides with the lungs as they breathe. Its amplitude
//    is weighted by the aerated fraction of the lung chord. One constant,
//    CLUTTER_AMPLITUDE, scales it so it can be refitted whenever the image
//    chain changes (see scripts/thorax/README in docs/realism/wave1/S4.md).
//
//    Optional uniforms (default zero = fallback without integration):
//      uClutLungC[2]   lung centres (xyz) and enable flag (w = 1)
//      uClutLungInv[2] lung inverse frames (local = inv * (p - c), unit ball)
//      uClutParams     x: amplitude multiplier (0 = 1), y: patient seed,
//                      z: soft-tissue multiplier (0 = 1), w: tilt multiplier (0 = 1)
//    Without them the lung term is marched over the body interval in patient
//    coordinates and weighted by lungPath / body chord (static, no breathing).
//    applyClutterUniforms() sets them from the thorax shapes.
//
// 2. ThoraxSegmentPass: an AccumulationPass (passes.ts) that draws the static
//    thorax segments (ribs as hollow elliptic cortical shells, clavicles,
//    costal cartilage, pulmonary arteries, veins and bronchi) and per-frame
//    hardware segments as exact cone/slab intersections, GPU-projected from
//    instance data uploaded once per patient. Breathing is applied in the
//    vertex shader from per-endpoint displacements, so the per-frame CPU cost
//    is a few uniforms.
// ---------------------------------------------------------------------------

import type { AccumulationPass, PassContext } from "./passes";
import { MU, SEG_FLOATS, type AnatShape, type SegmentBuffer, type ThoraxSegments } from "./thorax";

/**
 * Overall clutter amplitude (line-integral units). Model parameter fitted through the full
 * simulated image chain to the measured lung texture (S4.md "Clutter amplitude refit"). Refit
 * after any change of the display processing (edge enhancement, harmonisation, scatter).
 */
export const CLUTTER_AMPLITUDE = 7.0;
/**
 * Spectral tilt of the clutter: each finer octave (factor 2 in frequency) is weighted by this
 * factor relative to the fitted octave weights. Model parameter, refitted with the amplitude
 * (raises or lowers the high-band slope without changing the coarse texture).
 */
export const CLUTTER_TILT = 0.825;

/**
 * Weight of the coarse clutter octaves (40 and 20 mm; 10 mm at its square root) relative to the fitted
 * octave weights. Model parameter (C1, wave 2): at full weight a lung texture strong enough for the
 * library's fine-scale texture rows drew cloud-like blotches that real lung fields do not show.
 */
export const CLUTTER_COARSE = 0.3;

const f = (x: number) => x.toFixed(6);

export const CLUTTER_GLSL = `
uniform float uClutCoarse;
uniform vec4 uClutLungC[2];
uniform mat3 uClutLungInv[2];
uniform vec4 uClutParams;

// integer hash (lowbias32) and 3D gradient noise with quintic fade, range about [-1, 1]
uint clutHash(uint x) { x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16; return x; }
float clutGr(ivec3 c, vec3 f, uint s) {
  uint h = clutHash(uint(c.x) * 73856093u ^ uint(c.y) * 19349663u ^ uint(c.z) * 83492791u ^ s);
  // 12 cube-edge gradients (improved Perlin noise)
  uint k = h % 12u;
  float u = k < 8u ? f.x : f.y;
  float v = k < 4u ? f.y : f.z;
  return ((k & 1u) == 0u ? u : -u) + ((k & 2u) == 0u ? v : -v);
}
float clutNoise(vec3 x, uint s) {
  vec3 fl = floor(x);
  ivec3 i = ivec3(fl);
  vec3 f = x - fl;
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n000 = clutGr(i, f, s), n100 = clutGr(i + ivec3(1, 0, 0), f - vec3(1, 0, 0), s);
  float n010 = clutGr(i + ivec3(0, 1, 0), f - vec3(0, 1, 0), s), n110 = clutGr(i + ivec3(1, 1, 0), f - vec3(1, 1, 0), s);
  float n001 = clutGr(i + ivec3(0, 0, 1), f - vec3(0, 0, 1), s), n101 = clutGr(i + ivec3(1, 0, 1), f - vec3(1, 0, 1), s);
  float n011 = clutGr(i + ivec3(0, 1, 1), f - vec3(0, 1, 1), s), n111 = clutGr(i + ivec3(1, 1, 1), f - vec3(1, 1, 1), s);
  return mix(mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y), mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y), u.z);
}
// lung parenchyma at a point (mm, lung-local): power-law field (the line-like markings are the explicit vessel trees)
float clutLungField(vec3 p, uint s, float tilt) {
  // octave wavelengths 40, 20, 10, 5, 2.5, 1.25 mm; amplitudes fitted to the measured slope (model parameters).
  // The coarse octaves (40, 20 mm, and 10 mm at the square root) carry CLUTTER_COARSE: lung parenchyma
  // has no cloud-like density variation at those scales on real frames (C1, wave 2)
  float coarse = ${f(CLUTTER_COARSE)} * (uClutCoarse > 0.0 ? uClutCoarse : 1.0);
  float a = 0.0, w = 1.0;
  a += 1.00 * coarse * clutNoise(p * 0.025, s);
  w *= tilt; a += 0.86 * coarse * w * clutNoise(p * 0.05 + 11.3, s + 1u);
  w *= tilt; a += 0.74 * sqrt(coarse) * w * clutNoise(p * 0.1 + 23.7, s + 2u);
  w *= tilt; a += 0.62 * w * clutNoise(p * 0.2 + 37.1, s + 3u);
  w *= tilt; a += 0.48 * w * clutNoise(p * 0.4 + 51.9, s + 4u);
  w *= tilt; a += 0.40 * w * clutNoise(p * 0.8 + 67.3, s + 7u);
  return a;
}
vec2 clutEll(vec3 c, mat3 inv, vec3 ro, vec3 rd) {
  vec3 o = inv * (ro - c), d = inv * rd;
  float A = dot(d, d), B = 2.0 * dot(o, d), C = dot(o, o) - 1.0;
  float disc = B * B - 4.0 * A * C;
  if (disc <= 0.0 || A <= 0.0) return vec2(1.0, 0.0);
  float q = sqrt(disc);
  return vec2((-B - q) / (2.0 * A), (-B + q) / (2.0 * A));
}
// mean of the field over 5 stratified taps on [t0, t1], scaled like the projection of a stationary field (sqrt of chord)
float clutMarch(vec3 ro, vec3 rd, vec2 iv, vec3 c, mat3 inv, bool local, uint s, float tilt) {
  float L = iv.y - iv.x;
  if (L <= 0.5) return 0.0;
  float acc = 0.0;
  for (int k = 0; k < 5; k++) {
    vec3 p = ro + rd * (iv.x + L * (float(k) + 0.5) / 5.0);
    // lung-local coordinates in nominal mm (so the texture moves and stretches with the lung)
    vec3 q = local ? (inv * (p - c)) * vec3(60.0, 140.0, 85.0) : p;
    acc += clutLungField(q, s, tilt);
  }
  return acc / 5.0 * sqrt(L * 12.0);
}
float clutter(vec3 ro, vec3 rd, vec2 bodyIv, float lungPath) {
  if (bodyIv.y <= bodyIv.x) return 0.0;
  float amp = ${f(CLUTTER_AMPLITUDE)} * (uClutParams.x > 0.0 ? uClutParams.x : 1.0);
  float softAmp = uClutParams.z > 0.0 ? uClutParams.z : 1.0;
  uint seed = uint(uClutParams.y) * 2654435761u + 1013904223u;
  float tilt = ${f(CLUTTER_TILT)} * (uClutParams.w > 0.0 ? uClutParams.w : 1.0);
  float lung = 0.0;
  if (lungPath > 0.5) {
    if (uClutLungC[0].w > 0.5) {
      // lung-anchored: march each lung's interval, weight by the aerated fraction of the chords
      vec2 i0 = clutEll(uClutLungC[0].xyz, uClutLungInv[0], ro, rd);
      vec2 i1 = clutEll(uClutLungC[1].xyz, uClutLungInv[1], ro, rd);
      i0 = vec2(max(i0.x, bodyIv.x), min(i0.y, bodyIv.y));
      i1 = vec2(max(i1.x, bodyIv.x), min(i1.y, bodyIv.y));
      // the two lungs may overlap at the midline: their union's length
      float chord = max(0.0, i0.y - i0.x) + max(0.0, i1.y - i1.x) - max(0.0, min(i0.y, i1.y) - max(i0.x, i1.x));
      float frac = chord > 0.5 ? clamp(lungPath / chord, 0.0, 1.0) : 0.0;
      lung = frac * (clutMarch(ro, rd, i0, uClutLungC[0].xyz, uClutLungInv[0], true, seed, tilt) + clutMarch(ro, rd, i1, uClutLungC[1].xyz, uClutLungInv[1], true, seed + 17u, tilt));
    } else {
      // fallback without lung uniforms: patient-fixed field over the body chord
      float chord = bodyIv.y - bodyIv.x;
      lung = clamp(lungPath / chord, 0.0, 1.0) * clutMarch(ro, rd, bodyIv, vec3(0.0), mat3(1.0), false, seed, tilt);
    }
  }
  // soft-tissue heterogeneity (fat planes, muscle) over the whole body chord, large scale and weak
  vec3 mid = ro + rd * (0.5 * (bodyIv.x + bodyIv.y));
  float soft = 0.6 * clutNoise(mid * 0.03, seed + 40u) + 0.35 * clutNoise(mid * 0.08, seed + 41u);
  return amp * (0.0042 * lung) + softAmp * 0.022 * soft;
}
`;

// ---------------------------------------------------------------------------
// Trabecular (cancellous) bone texture for the renderer's bone pass
// ---------------------------------------------------------------------------

/**
 * Trabecular texture strength: the SD of the local cancellous density, relative to its mean, is
 * about TRABECULAR_AMPLITUDE x 0.18 (0.18 = SD of the noise field). Model parameter (no measured
 * target yet). Wave 1 had 3.0 (54 % at the 1.5-6 mm scales; the projected cancellous signal of a
 * 30 mm vertebral chord varied by about 14 %). Wave 2 (C1): 7.5 (the projected signal varies by about
 * 35 %; the local field is then an excess-density texture that can locally cancel the cancellous
 * excess, which stands in for the marrow spaces between trabeculae), fitted on contact sheets of the
 * spine against library LAO cranial and RCA LAO frames: at 3.0 the vertebral bodies read as uniform
 * tubes after the stronger harmonisation (docs/realism/wave2/C1.md).
 */
export const TRABECULAR_AMPLITUDE = 7.5;
/** Cancellous excess over soft tissue per mm. */
const MU_CANCELLOUS = MU.cancellous;

/**
 * GLSL for BONE_FS: `float trabecular(vec3 ro, vec3 rd, vec2 iv, float mu, float muI)` returns the
 * line-integral increment of the trabecular texture along the ray's interval iv through one bone
 * primitive. It acts only on core primitives, recognised by a negative soft/bone excess and no
 * iodine (mu < 0, muI == 0): thorax.ts builds every cancellous interior (vertebral bodies,
 * pedicles, rims, sternum, scapulae) as a negative core inside a cortical shell, and no other
 * primitive in the scene has negative mu. The field is anisotropic 3D gradient noise in patient
 * coordinates, stretched 2.5 times along the body axis (vertical trabeculae of the vertebral
 * bodies dominate their radiographic texture), octaves at 1.5, 3 and 6 mm, sampled at 6 stratified
 * taps and scaled like the projection of a stationary field. Self-contained (own hash and noise),
 * so BONE_FS does not need CLUTTER_GLSL. Optional uniform uTrabAmp multiplies the amplitude
 * (0 = 1). Cost: 6 taps x 3 octaves of noise per covered pixel of each core primitive.
 */
export const TRABECULAR_GLSL = `
uniform float uTrabAmp;
uint trabHash(uint x) { x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16; return x; }
float trabGr(ivec3 c, vec3 f) {
  uint h = trabHash(uint(c.x) * 73856093u ^ uint(c.y) * 19349663u ^ uint(c.z) * 83492791u ^ 0x5bd1e995u);
  uint k = h % 12u;
  float u = k < 8u ? f.x : f.y;
  float v = k < 4u ? f.y : f.z;
  return ((k & 1u) == 0u ? u : -u) + ((k & 2u) == 0u ? v : -v);
}
float trabNoise(vec3 x) {
  vec3 fl = floor(x);
  ivec3 i = ivec3(fl);
  vec3 f = x - fl;
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(mix(mix(trabGr(i, f), trabGr(i + ivec3(1, 0, 0), f - vec3(1, 0, 0)), u.x),
                 mix(trabGr(i + ivec3(0, 1, 0), f - vec3(0, 1, 0)), trabGr(i + ivec3(1, 1, 0), f - vec3(1, 1, 0)), u.x), u.y),
             mix(mix(trabGr(i + ivec3(0, 0, 1), f - vec3(0, 0, 1)), trabGr(i + ivec3(1, 0, 1), f - vec3(1, 0, 1)), u.x),
                 mix(trabGr(i + ivec3(0, 1, 1), f - vec3(0, 1, 1)), trabGr(i + ivec3(1, 1, 1), f - vec3(1, 1, 1)), u.x), u.y), u.z);
}
float trabField(vec3 p) {
  vec3 q = p * vec3(1.0, 0.4, 1.0); // stretched along the body axis (model parameter)
  return 0.55 * trabNoise(q / 1.5) + 0.3 * trabNoise(q / 3.0 + 17.1) + 0.15 * trabNoise(q / 6.0 + 41.3);
}
float trabecular(vec3 ro, vec3 rd, vec2 iv, float mu, float muI) {
  float L = iv.y - iv.x;
  if (mu >= 0.0 || muI != 0.0 || L <= 0.2) return 0.0;
  float acc = 0.0;
  for (int k = 0; k < 6; k++) acc += trabField(ro + rd * (iv.x + L * (float(k) + 0.5) / 6.0));
  float amp = ${f(TRABECULAR_AMPLITUDE)} * (uTrabAmp > 0.0 ? uTrabAmp : 1.0);
  // mean of 6 taps x sqrt(6 L lambda): the SD of the integral of a field with 2 mm correlation length
  return amp * ${f(MU_CANCELLOUS)} * (acc / 6.0) * sqrt(6.0 * L * 2.0);
}
`;

/** XrayScene.extra key for the clutter uniforms (value: ClutterState). */
export const CLUTTER_KEY = "clutter";

/** Uniform values for CLUTTER_GLSL. */
export interface ClutterState {
  lungs: { c: [number, number, number]; inv: number[] }[];
  seed: number;
  /** amplitude multiplier on CLUTTER_AMPLITUDE (1 = as fitted) */
  gain?: number;
  /** soft-tissue term multiplier */
  softGain?: number;
  /** spectral tilt multiplier on CLUTTER_TILT */
  tilt?: number;
}

/**
 * Calibration multipliers on the fitted constants (CLUTTER_AMPLITUDE, the soft-tissue term, CLUTTER_TILT,
 * TRABECULAR_AMPLITUDE), all 1 as committed. Exported mutable for calibration sweeps only (the capture
 * harness's sweep sets and restores them); the labs never write it.
 */
export const CLUTTER_TUNE = { gain: 1, softGain: 1, tilt: 1, trabecular: 1, coarse: 1 };

/** Clutter uniforms from the frame's anatomy shapes (the two lung shapes) and the patient seed. */
export function clutterStateFromAnat(anat: AnatShape[], seed = 0): ClutterState {
  const lungs = anat.filter((s) => s.lung).slice(0, 2);
  const T = CLUTTER_TUNE;
  return {
    seed,
    ...(T.gain !== 1 ? { gain: T.gain } : {}),
    ...(T.softGain !== 1 ? { softGain: T.softGain } : {}),
    ...(T.tilt !== 1 ? { tilt: T.tilt } : {}),
    lungs: lungs.map((s) => {
      const [a, b, c] = s.ax;
      const [h0, h1, h2] = s.half;
      // column-major mat3 of the inverse frame (rows a/h0, b/h1, c/h2), as XrayRenderer.invMat
      return { c: [s.c.x, s.c.y, s.c.z], inv: [a.x / h0, b.x / h1, c.x / h2, a.y / h0, b.y / h1, c.y / h2, a.z / h0, b.z / h1, c.z / h2] };
    }),
  };
}

/**
 * Set the clutter uniforms on the anatomy program (which must be current). `loc` looks up a
 * uniform location by name, e.g. (n) => gl.getUniformLocation(prog, n).
 */
export function applyClutterUniforms(gl: WebGL2RenderingContext, loc: (name: string) => WebGLUniformLocation | null, s: ClutterState | null | undefined) {
  const c = new Float32Array(8);
  const m = new Float32Array(18);
  if (s && s.lungs.length === 2) {
    s.lungs.forEach((l, i) => {
      c.set([l.c[0], l.c[1], l.c[2], 1], i * 4);
      m.set(l.inv, i * 9);
    });
  }
  gl.uniform4fv(loc("uClutLungC"), c);
  gl.uniformMatrix3fv(loc("uClutLungInv"), false, m);
  gl.uniform4f(loc("uClutParams"), s?.gain ?? 0, (s?.seed ?? 0) % 65536, s?.softGain ?? 0, s?.tilt ?? 0);
  gl.uniform1f(loc("uClutCoarse"), CLUTTER_TUNE.coarse);
}

// ---------------------------------------------------------------------------
// Thorax segment pass
// ---------------------------------------------------------------------------

/** XrayScene.extra key for the thorax segments (value: ThoraxSegments). */
export const THORAX_SEGMENTS_KEY = "thoraxSegments";

const HEADER = `#version 300 es
precision highp float;
precision highp int;
`;

const SEG_VS = `${HEADER}
layout(location = 0) in vec4 a0; // p0, r0
layout(location = 1) in vec4 a1; // p1, r1
layout(location = 2) in vec4 a2; // d0, inner
layout(location = 3) in vec4 a3; // d1, flat
layout(location = 4) in vec4 a4; // muOut, sub
layout(location = 5) in vec4 a5; // muIn
layout(location = 6) in vec4 a6; // thin dir
layout(location = 7) in vec4 a7; // n0
layout(location = 8) in vec4 a8; // n1
uniform vec3 uSrc, uDetC, uDetU, uDetV;
uniform float uRes, uResp;
flat out vec4 vP0;    // p0, r0 (widened)
flat out vec4 vP1;    // p1, r1 (widened)
flat out vec4 vMat;   // muOut * scale, inner
flat out vec4 vMatIn; // muIn * scale, flat
flat out vec3 vThin;
flat out vec3 vN0;
flat out vec3 vN1;
vec2 proj(vec3 p, out float mag) {
  vec3 N = normalize(uDetC - uSrc);
  float sid = dot(uDetC - uSrc, N);
  float along = max(dot(p - uSrc, N), 1.0);
  mag = sid / along;
  vec3 q = uSrc + (p - uSrc) * mag - uDetC;
  return vec2(dot(q, uDetU) / dot(uDetU, uDetU), dot(q, uDetV) / dot(uDetV, uDetV));
}
void main() {
  vec3 p0 = a0.xyz + uResp * a2.xyz;
  vec3 p1 = a1.xyz + uResp * a3.xyz;
  float m0, m1;
  vec2 u0 = proj(p0, m0), u1 = proj(p1, m1);
  float hu = length(uDetU);
  float pix = 2.0 * hu / uRes; // detector mm per pixel
  float rm = 0.5 * (a0.w + a1.w);
  float scale = 1.0, k = 1.0;
  if (a4.w > 0.5) {
    // sub-pixel vessels: widen to about 1.3 px across and keep the integral (mu x (r/rEff)^2)
    float rmin = 0.65 * pix / max(m0, m1);
    if (rm < rmin && rm > 0.0) { k = rmin / rm; scale = 1.0 / (k * k); }
  }
  float r0 = a0.w * k, r1 = a1.w * k;
  vP0 = vec4(p0, r0);
  vP1 = vec4(p1, r1);
  vMat = vec4(a4.xyz * scale, a2.w);
  vMatIn = vec4(a5.xyz * scale, a3.w);
  vThin = a6.xyz;
  vN0 = a7.xyz;
  vN1 = a8.xyz;
  // screen quad: the projected segment widened by its radius plus a 2 px margin. Along the axis
  // it extends only as far as the end discs and mitre planes can reach: the disc of radius r
  // projects to r |cos(axis, ray)| along the axis, a mitre adds r tan(half bend angle)
  float hw = max(r0, r1) * max(m0, m1) / hu + 4.0 / uRes;
  vec3 ax3 = p1 - p0;
  float l3 = length(ax3);
  vec3 axn = l3 > 1e-6 ? ax3 / l3 : vec3(0.0, 0.0, 1.0);
  float ca = abs(dot(axn, normalize(0.5 * (p0 + p1) - uSrc)));
  float c0 = max(abs(dot(a7.xyz, axn)), 0.3), c1 = max(abs(dot(a8.xyz, axn)), 0.3);
  float tanH = max(sqrt(1.0 - c0 * c0) / c0, sqrt(1.0 - c1 * c1) / c1);
  float ext = hw * min(1.0, ca + tanH) + 4.0 / uRes;
  vec2 d = u1 - u0;
  float L = length(d);
  vec2 dir = L > 1e-6 ? d / L : vec2(1.0, 0.0);
  vec2 nr = vec2(-dir.y, dir.x);
  int id = gl_VertexID;
  float sa = (id == 1 || id == 3) ? 1.0 : 0.0;
  float sx = (id >= 2) ? 1.0 : -1.0;
  vec2 pos = mix(u0 - dir * ext, u1 + dir * ext, sa) + nr * hw * sx;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const SEG_FS = `${HEADER}
uniform vec3 uSrc, uDetC, uDetU, uDetV;
uniform float uRes;
flat in vec4 vP0;
flat in vec4 vP1;
flat in vec4 vMat;
flat in vec4 vMatIn;
flat in vec3 vThin;
flat in vec3 vN0;
flat in vec3 vN1;
out vec4 frag;
// length of a ray inside an elliptic truncated cone (radius r0 at z = 0 to r1 at z = L in the
// local frame, the thin axis already scaled to a circle) within the slab [s.x, s.y]
float coneLen(vec3 O, vec3 D, float r0, float r1, float L, vec2 s) {
  if (s.y <= s.x) return 0.0;
  float k = (r1 - r0) / L;
  float A = D.x * D.x + D.y * D.y - k * k * D.z * D.z;
  if (A < 1e-4 * dot(D, D)) {
    // nearly along a tapered axis: treat as a cylinder of the mean radius
    k = 0.0;
    r0 = 0.5 * (r0 + r1);
    A = D.x * D.x + D.y * D.y;
    if (A < 1e-9) return (O.x * O.x + O.y * O.y < r0 * r0) ? s.y - s.x : 0.0;
  }
  float R0 = r0 + k * O.z;
  float B = 2.0 * (O.x * D.x + O.y * D.y - k * D.z * R0);
  float C = O.x * O.x + O.y * O.y - R0 * R0;
  float disc = B * B - 4.0 * A * C;
  if (disc <= 0.0) return 0.0;
  float q = sqrt(disc);
  float t0 = (-B - q) / (2.0 * A), t1 = (-B + q) / (2.0 * A);
  return max(0.0, min(t1, s.y) - max(t0, s.x));
}
vec4 sampleRay(vec2 fc) {
  vec2 uv = fc / uRes * 2.0 - 1.0;
  vec3 rd = normalize(uDetC + uv.x * uDetU + uv.y * uDetV - uSrc);
  vec3 p0 = vP0.xyz, p1 = vP1.xyz;
  vec3 ax = p1 - p0;
  float L = length(ax);
  if (L < 1e-4) return vec4(0.0);
  ax /= L;
  // slab between the mitred end planes
  vec2 s = vec2(-1e9, 1e9);
  float a = dot(rd, vN0), b = dot(uSrc - p0, vN0);
  if (abs(a) < 1e-9) { if (b < 0.0) return vec4(0.0); }
  else if (a > 0.0) s.x = max(s.x, -b / a); else s.y = min(s.y, -b / a);
  a = dot(rd, vN1); b = dot(uSrc - p1, vN1);
  if (abs(a) < 1e-9) { if (b > 0.0) return vec4(0.0); }
  else if (a > 0.0) s.y = min(s.y, -b / a); else s.x = max(s.x, -b / a);
  if (s.y <= s.x) return vec4(0.0);
  // cross-section frame: e2 along the thin axis (orthogonalised), e1 completes it
  vec3 t = vThin - ax * dot(vThin, ax);
  float tl = length(t);
  vec3 e2 = tl > 1e-5 ? t / tl : normalize(cross(ax, abs(ax.y) < 0.9 ? vec3(0, 1, 0) : vec3(1, 0, 0)));
  vec3 e1 = cross(e2, ax);
  float fl = tl > 1e-5 ? max(0.05, vMatIn.w) : 1.0;
  vec3 o = uSrc - p0;
  vec3 O = vec3(dot(o, e1), dot(o, e2) / fl, dot(o, ax));
  vec3 D = vec3(dot(rd, e1), dot(rd, e2) / fl, dot(rd, ax));
  float lo = coneLen(O, D, vP0.w, vP1.w, L, s);
  if (lo <= 0.0) return vec4(0.0);
  float li = vMat.w > 0.0 ? coneLen(O, D, vP0.w * vMat.w, vP1.w * vMat.w, L, s) : 0.0;
  return vec4(vMat.xyz * (lo - li) + vMatIn.xyz * li, 0.0);
}
void main() {
  if (vMat.w > 0.0) {
    // hollow shells (rib cortex, bronchial walls, lead coils) are thin: 2 samples per pixel
    frag = 0.5 * (sampleRay(gl_FragCoord.xy + vec2(-0.25, -0.25)) + sampleRay(gl_FragCoord.xy + vec2(0.25, 0.25)));
  } else {
    frag = sampleRay(gl_FragCoord.xy);
  }
}
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error("thorax segment shader: " + (gl.getShaderInfoLog(s) ?? ""));
  return s;
}

interface GpuBuf {
  vao: WebGLVertexArrayObject;
  buf: WebGLBuffer;
  key: string;
  count: number;
}

/**
 * Additive pass drawing ThoraxSegments (XrayScene.extra[THORAX_SEGMENTS_KEY]). Register once
 * with XrayRenderer.addPass(new ThoraxSegmentPass()).
 */
export class ThoraxSegmentPass implements AccumulationPass {
  readonly name = "thorax-segments";
  private prog: WebGLProgram | null = null;
  private stat: GpuBuf | null = null;
  private dyn: GpuBuf | null = null;
  private loc = new Map<string, WebGLUniformLocation | null>();

  private init(gl: WebGL2RenderingContext) {
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, SEG_VS));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, SEG_FS));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("thorax segment program: " + (gl.getProgramInfoLog(p) ?? ""));
    this.prog = p;
  }

  private u(gl: WebGL2RenderingContext, n: string) {
    if (!this.loc.has(n)) this.loc.set(n, gl.getUniformLocation(this.prog!, n));
    return this.loc.get(n)!;
  }

  private upload(gl: WebGL2RenderingContext, cur: GpuBuf | null, b: SegmentBuffer): GpuBuf {
    let g = cur;
    if (!g) {
      const vao = gl.createVertexArray()!;
      const buf = gl.createBuffer()!;
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      for (let i = 0; i < SEG_FLOATS / 4; i++) {
        gl.enableVertexAttribArray(i);
        gl.vertexAttribPointer(i, 4, gl.FLOAT, false, SEG_FLOATS * 4, i * 16);
        gl.vertexAttribDivisor(i, 1);
      }
      gl.bindVertexArray(null);
      g = { vao, buf, key: "", count: 0 };
    }
    if (g.key !== b.key) {
      gl.bindBuffer(gl.ARRAY_BUFFER, g.buf);
      gl.bufferData(gl.ARRAY_BUFFER, b.data, gl.DYNAMIC_DRAW);
      g.key = b.key;
      g.count = b.count;
    }
    return g;
  }

  draw(ctx: PassContext) {
    const segs = ctx.extra[THORAX_SEGMENTS_KEY] as ThoraxSegments | undefined;
    if (!segs || (!segs.stat?.count && !segs.dyn?.count)) return;
    const gl = ctx.gl;
    if (!this.prog) this.init(gl);
    gl.useProgram(this.prog);
    const c = ctx.cam;
    gl.uniform3f(this.u(gl, "uSrc"), c.src.x, c.src.y, c.src.z);
    gl.uniform3f(this.u(gl, "uDetC"), c.detC.x, c.detC.y, c.detC.z);
    gl.uniform3f(this.u(gl, "uDetU"), c.detU.x, c.detU.y, c.detU.z);
    gl.uniform3f(this.u(gl, "uDetV"), c.detV.x, c.detV.y, c.detV.z);
    gl.uniform1f(this.u(gl, "uRes"), ctx.res);
    if (segs.stat?.count) {
      this.stat = this.upload(gl, this.stat, segs.stat);
      gl.uniform1f(this.u(gl, "uResp"), segs.resp);
      gl.bindVertexArray(this.stat.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.stat.count);
    }
    if (segs.dyn?.count) {
      this.dyn = this.upload(gl, this.dyn, segs.dyn);
      gl.uniform1f(this.u(gl, "uResp"), 0);
      gl.bindVertexArray(this.dyn.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.dyn.count);
    }
    gl.bindVertexArray(null);
  }

  dispose(gl: WebGL2RenderingContext) {
    for (const g of [this.stat, this.dyn]) {
      if (!g) continue;
      gl.deleteBuffer(g.buf);
      gl.deleteVertexArray(g.vao);
    }
    if (this.prog) gl.deleteProgram(this.prog);
    this.prog = null;
    this.stat = this.dyn = null;
    this.loc.clear();
  }
}
