// ---------------------------------------------------------------------------
// Physically based fluoroscopy renderer (WebGL2).
//
// For every detector pixel the renderer computes the X-ray line integral
// P = Σ μ·L along the ray from the focal spot to that pixel:
//   1. anatomy pass – body, lungs (carved around the heart), mediastinum,
//      liver, stomach gas, trachea and bronchi solved exactly with interval
//      arithmetic per ray; the shapes come from thorax.ts (data-driven) and
//      the fine background texture from clutter() in clutter.ts;
//   2. bone pass – vertebrae, pedicles, processes, sternum, scapulae as
//      analytic solids, added on top;
//   3. tube pass – ribs, clavicles, iodine-filled vessels, catheter and wire
//      as ribbons whose chord length through a cylinder is exact across the
//      ribbon and corrected for obliquity;
//   3b. registered extra passes (addPass, see passes.ts), additive.
//
// The image chain then follows a flat-panel system (detector.ts, pyramid.ts,
// systemProfiles.ts):
//   4. primary  – transmission exp(−P) times the fluence map: collimator
//                 shutters with an erfc penumbra and semi-transparent wedges;
//   5. detector – scatter by kernel superposition on the collimated primary,
//                 AEC metering, detected quanta with Poisson noise and a
//                 grey-independent floor from an integer hash (no lattice),
//                 run-start settling;
//   6. MTF      – separable Gaussian detector blur on signal and noise
//                 together, white electronic noise, log conversion;
//   7. pyramid  – Laplacian band processing of the log image: harmonisation
//                 (residual gain < 1), mid-band halo, fine-band edge boost and
//                 noise-adaptive coring;
//   8. meter    – low-resolution readback (asynchronous, one frame late; or
//                 synchronous in capture mode) for the auto-window and for
//                 dose-rate control (getMeter());
//   9. display  – window from the grey histogram, S-shaped LUT, motion-
//                 adaptive (and, with a velocity buffer, motion-compensated)
//                 recursive filter, field edge model and shutter display.
//
// Resolution: resize(res) renders at res and presents at the canvas size (plain copy when
// equal, separable Lanczos-3 otherwise). fitCanvas(devicePx) picks the render size itself
// (devicePx rounded up to a multiple of 32, at most 1024) and falls back to 768 when a periodic
// frame-time probe exceeds 25 ms twice. Noise and band gains are calibrated at REFERENCE_RES
// (768) and scaled so the image per unit detector area does not depend on the render size.
//
// Extension slots: addPass() for line-integral passes (passes.ts),
// getVelocityTarget() for a screen-velocity buffer (RG16F, px per frame, cleared
// to zero every frame before the extra passes) that the recursive filter uses
// for motion compensation.
// ---------------------------------------------------------------------------

import type { Vec3 } from "../../types";
import { MAX_ANAT, MAX_CARVE_SHAPES, type AnatShape, type BonePrim, type Shape, type TubeSpec } from "./thorax";
import { CLUTTER_GLSL, CLUTTER_KEY, CLUTTER_TUNE, TRABECULAR_GLSL, ThoraxSegmentPass, applyClutterUniforms, type ClutterState } from "./clutter";
import { SEGMENTS_KEY, createSegmentPass, createThinPass } from "./segments";
import type { AccumulationPass } from "./passes";
import {
  BLADE_TRANSMISSION,
  DEFAULT_PENUMBRA_PX,
  DEFAULT_WEDGE_TRANSMISSION,
  DET_FS,
  EDGE_10_90_PER_SIGMA,
  GRID_OUT_SPR_FACTOR,
  MAX_WEDGES,
  METER1_FS,
  MTF_FS,
  PRIM_FS,
  SCATTER_GLSL,
  gaussTaps,
  type Wedge,
} from "./detector";
import { DOWN_FS, METER_FS, PYR_LEVELS, TONE_GLSL, meterStride, RECON_FS, buildLut, gainsAtRes, lagWindow, linearWindow, noiseFactors, toneSlopeAt, readbackPercentiles, solveWindowBand, type NoiseFactors, type WindowState } from "./pyramid";
import { getProfile, settleFactor, type SystemProfile, type SystemProfileId } from "./systemProfiles";
import { RendererPerf, hardSync } from "./renderer.perf";

export type { Wedge } from "./detector";
export type { SystemProfileId } from "./systemProfiles";

export interface XrayCamera {
  src: Vec3;
  detC: Vec3;
  /** detector half-extent vectors (mm) along image right / up */
  detU: Vec3;
  detV: Vec3;
}

export interface ImageParams {
  /** quanta per pixel the AEC aims for at the meter (fluoro ~400, cine ~1500); scaled by the profile's efficiency */
  counts: number;
  /** recursive filter weight on the previous frame for cine (fluoro uses the profile's value) */
  recursive: number;
  /** edge-enhancement strength; 0.75 = the profile's nominal fine/mid band gains, 0 = none */
  edge: number;
  /** scatter-to-primary ratio (open field, grid in) */
  spr: number;
  /** iodine and metal effectiveness at the current kV (1 ≈ 75 kV) */
  iodineGain: number;
  metalGain: number;
  /** harmonisation strength; 0.7 = the profile's nominal residual gain, 0 = none */
  drc?: number;
  /** fallback display window width in log units, and brightness offset (used when autoWindow is false) */
  window: number;
  level: number;
  seed: number;
  field: "circle" | "square";
  /** collimator shutters 0..1 from each edge (left, right, top, bottom) */
  shutters?: [number, number, number, number];
  // ---- optional additions (S2); defaults keep older callers working ----
  /** imaging-system profile (default "A") */
  profile?: SystemProfileId;
  /** acquisition mode; inferred from `recursive` (> 0.3 = fluoro) when absent */
  mode?: "fluoro" | "cine";
  /** frames since the start of this run (pedal-down or cine start); inferred from timing when absent */
  framesSinceStart?: number;
  /** shutter penumbra, 10-90% width in render px (default 6) */
  shutterPenumbraPx?: number;
  /** semi-transparent wedge filters */
  wedges?: Wedge[];
  /** anti-scatter grid in place (default true) */
  gridIn?: boolean;
  /** exposure pulse width (ms), carried for motion-blur passes; not used by the chain itself */
  pulseWidthMs?: number;
  /** true (default): exposure normalised so the meter receives `counts`; false: `counts` are entrance quanta */
  aec?: boolean;
  /** window from the grey histogram (default true) */
  autoWindow?: boolean;
}

export interface XrayScene {
  cam: XrayCamera;
  anat: AnatShape[];
  bones: BonePrim[];
  tubes: TubeSpec[];
  /** inputs for registered extra passes, keyed by pass (see passes.ts) */
  extra?: Record<string, unknown>;
}

/** Metering and histogram result of one frame (from the low-resolution readback). */
export interface MeterReading {
  /** renderer frame number the reading belongs to */
  frame: number;
  /** metered detector signal relative to an unattenuated beam (primary + scatter), 0..1 */
  transmission: number;
  /**
   * metered primary transmission alone (no scatter), 0..1: the dose-rate controller's
   * water-equivalent path is -ln(primaryTransmission) / (MU.soft x 10) cm
   */
  primaryTransmission: number;
  /** percentiles and mean of the processed log signal over the central field (high = dark) */
  p5: number;
  p50: number;
  p95: number;
  mean: number;
  /** fraction of the analysed region left open by the shutters */
  openFraction: number;
  /** display window in force after this reading */
  window: WindowState;
  /** frame index within the current run, and the run-start noise factor applied */
  runFrame: number;
  settle: number;
}

/**
 * Run detection when the caller gives neither framesSinceStart nor capture mode: a frame starts a
 * new run after a gap longer than max(RUN_GAP_MS, RUN_GAP_FACTOR x the median of the recent frame
 * intervals). The adaptive part keeps on-demand rendering (dev hooks rendering a frame every
 * second or so) inside one run, while a pedal release of a few frames at 15 frames/s still
 * starts a new one. Model parameters.
 */
const RUN_GAP_MS = 400;
const RUN_GAP_FACTOR = 3;

/** Reference render resolution of the profile calibration (noise per pixel, band gains). */
export const REFERENCE_RES = 768;

/** Automatic render resolution (fitCanvas). Defaults follow the plan's frame-budget task. */
export interface ResolutionPolicy {
  /** largest render resolution, px (default 1024) */
  maxRes?: number;
  /** render resolution after a budget overrun, px (default 768) */
  fallbackRes?: number;
  /** per-frame allowance for render(), ms (default 25) */
  budgetMs?: number;
  /** probe the frame time every this many frames (default 90; 0 = never) */
  probeEvery?: number;
}

/** Resolution state (getResolution()). */
export interface ResolutionState {
  /** render resolution, px */
  res: number;
  /** canvas size the frame is presented at (fitCanvas), or the render resolution */
  presentPx: number;
  /** the frame-time probe dropped the cap to the fallback resolution */
  fellBack: boolean;
  /** last probed render() time between hard syncs (CPU issue + GPU), ms; 0 before the first probe */
  lastProbeMs: number;
}

const roundUp32 = (n: number) => Math.max(32, Math.ceil(n / 32) * 32);
/** Floats per ribbon vertex: position (2), across (1), chord (1), mu (3), iodine core share (1). */
const TUBE_FLOATS = 8;

// ---------------------------------------------------------------------------
const HEADER = `#version 300 es
precision highp float;
precision highp int;
`;

const CAMERA_GLSL = `
uniform vec3 uSrc;
uniform vec3 uDetC;
uniform vec3 uDetU;
uniform vec3 uDetV;
vec3 rayDir(vec2 uv) {
  vec3 p = uDetC + uv.x * uDetU + uv.y * uDetV;
  return normalize(p - uSrc);
}
`;

const INTERVAL_GLSL = `
// returns (tIn, tOut); empty when tIn >= tOut
vec2 interval(int type, vec3 c, mat3 inv, vec3 ro, vec3 rd) {
  vec3 o = inv * (ro - c);
  vec3 d = inv * rd;
  if (type == 0) {
    float a = dot(d, d);
    float b = 2.0 * dot(o, d);
    float cc = dot(o, o) - 1.0;
    float disc = b * b - 4.0 * a * cc;
    if (disc <= 0.0) return vec2(1.0, 0.0);
    float s = sqrt(disc);
    return vec2((-b - s) / (2.0 * a), (-b + s) / (2.0 * a));
  }
  if (type == 1) {
    float a = d.x * d.x + d.z * d.z;
    float b = 2.0 * (o.x * d.x + o.z * d.z);
    float cc = o.x * o.x + o.z * o.z - 1.0;
    vec2 tc;
    if (a < 1e-10) {
      if (cc > 0.0) return vec2(1.0, 0.0);
      tc = vec2(-1e9, 1e9);
    } else {
      float disc = b * b - 4.0 * a * cc;
      if (disc <= 0.0) return vec2(1.0, 0.0);
      float s = sqrt(disc);
      tc = vec2((-b - s) / (2.0 * a), (-b + s) / (2.0 * a));
    }
    vec2 ty;
    if (abs(d.y) < 1e-10) {
      if (abs(o.y) > 1.0) return vec2(1.0, 0.0);
      ty = vec2(-1e9, 1e9);
    } else {
      float t1 = (-1.0 - o.y) / d.y;
      float t2 = (1.0 - o.y) / d.y;
      ty = vec2(min(t1, t2), max(t1, t2));
    }
    return vec2(max(tc.x, ty.x), min(tc.y, ty.y));
  }
  // box
  vec3 inv_d = 1.0 / d;
  vec3 t1 = (-1.0 - o) * inv_d;
  vec3 t2 = (1.0 - o) * inv_d;
  vec3 tmin = min(t1, t2);
  vec3 tmax = max(t1, t2);
  return vec2(max(max(tmin.x, tmin.y), tmin.z), min(min(tmax.x, tmax.y), tmax.z));
}
float ilen(vec2 i) { return max(0.0, i.y - i.x); }
float iand(vec2 a, vec2 b) { return max(0.0, min(a.y, b.y) - max(a.x, b.x)); }
float iand3(vec2 a, vec2 b, vec2 c) { return max(0.0, min(min(a.y, b.y), c.y) - max(max(a.x, b.x), c.x)); }
`;

// --- anatomy (full-screen) -------------------------------------------------
const ANAT_VS = `${HEADER}
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos; gl_Position = vec4(aPos, 0.0, 1.0); }
`;
const MAX_CARVE = MAX_CARVE_SHAPES;
/** Most lung shapes the anatomy pass merges per ray. */
const MAX_LUNG = 4;
const ANAT_FS = `${HEADER}
${CAMERA_GLSL}
${INTERVAL_GLSL}
${CLUTTER_GLSL}
in vec2 vUv;
out vec4 frag;
// per shape: centre and material mu (xyz, w), type and flags (bit 1 lung, bit 2 carve), inverse frame
uniform int uCount;
uniform vec4 uCM[${MAX_ANAT}];
uniform ivec2 uTF[${MAX_ANAT}];
uniform mat3 uInv[${MAX_ANAT}];
void main() {
  vec3 rd = rayDir(vUv);
  vec2 iv[${MAX_ANAT}];
  float P = 0.0;
  for (int i = 0; i < ${MAX_ANAT}; i++) {
    if (i >= uCount) break;
    iv[i] = interval(uTF[i].x, uCM[i].xyz, uInv[i], uSrc, rd);
    if ((uTF[i].y & 1) == 0) P += uCM[i].w * ilen(iv[i]);
  }
  // aerated lung = (union of the lung shapes) minus (union of the carve shapes), solved exactly per
  // ray: merge the lung intervals (the two lungs may overlap where both reach the midline, so they are
  // counted once), then clip each carve interval to each merged lung interval, sort, merge, measure
  vec2 lv[${MAX_LUNG}];
  int nl = 0;
  float muLung = 0.0;
  for (int k = 0; k < ${MAX_ANAT}; k++) {
    if (k >= uCount || nl >= ${MAX_LUNG}) break;
    if ((uTF[k].y & 1) == 0 || ilen(iv[k]) <= 0.0) continue;
    lv[nl] = iv[k];
    muLung = uCM[k].w;
    nl++;
  }
  for (int i = 1; i < ${MAX_LUNG}; i++) {
    if (i >= nl) break;
    vec2 key = lv[i];
    int j = i - 1;
    for (int q = 0; q < ${MAX_LUNG}; q++) {
      if (j < 0 || lv[j].x <= key.x) break;
      lv[j + 1] = lv[j];
      j--;
    }
    lv[j + 1] = key;
  }
  int nm = 0;
  for (int i = 0; i < ${MAX_LUNG}; i++) {
    if (i >= nl) break;
    if (nm > 0 && lv[i].x <= lv[nm - 1].y) lv[nm - 1].y = max(lv[nm - 1].y, lv[i].y);
    else { lv[nm] = lv[i]; nm++; }
  }
  float lungs = 0.0;
  for (int k = 0; k < ${MAX_LUNG}; k++) {
    if (k >= nm) break;
    vec2 L = lv[k];
    float a = ilen(L);
    vec2 cv[${MAX_CARVE}];
    int m = 0;
    for (int j = 0; j < ${MAX_ANAT}; j++) {
      if (j >= uCount || m >= ${MAX_CARVE}) break;
      if ((uTF[j].y & 2) == 0) continue;
      vec2 c = vec2(max(iv[j].x, L.x), min(iv[j].y, L.y));
      if (c.y > c.x) { cv[m] = c; m++; }
    }
    for (int i = 1; i < ${MAX_CARVE}; i++) {
      if (i >= m) break;
      vec2 key = cv[i];
      int j = i - 1;
      for (int q = 0; q < ${MAX_CARVE}; q++) {
        if (j < 0 || cv[j].x <= key.x) break;
        cv[j + 1] = cv[j];
        j--;
      }
      cv[j + 1] = key;
    }
    float covered = 0.0, cs = -1e9, ce = -1e9;
    for (int i = 0; i < ${MAX_CARVE}; i++) {
      if (i >= m) break;
      if (cv[i].x > ce) { covered += max(0.0, ce - cs); cs = cv[i].x; ce = cv[i].y; }
      else ce = max(ce, cv[i].y);
    }
    covered += max(0.0, ce - cs);
    lungs += max(0.0, a - covered);
  }
  P += muLung * lungs;
  P += clutter(uSrc, rd, uCount > 0 ? iv[0] : vec2(1.0, 0.0), lungs);
  frag = vec4(P, 0.0, 0.0, 0.0);
}
`;

// --- bones (instanced quads) -----------------------------------------------
const BONE_VS = `${HEADER}
${CAMERA_GLSL}
in vec2 aCorner;
in vec3 iC;
in vec3 iR0;
in vec3 iR1;
in vec3 iR2;
in float iType;
in float iMu;
in float iRad;
in float iMuI;
out vec2 vUv;
flat out vec3 fC;
flat out mat3 fInv;
flat out int fType;
flat out float fMu;
flat out float fMuI;
uniform float uDetHalf;
void main() {
  vec3 N = normalize(uDetC - uSrc);
  float sid = dot(uDetC - uSrc, N);
  vec3 d = iC - uSrc;
  float along = dot(d, N);
  float mag = sid / max(along, 1.0);
  vec3 p = uSrc + d * mag;
  vec2 uv = vec2(dot(p - uDetC, normalize(uDetU)), dot(p - uDetC, normalize(uDetV))) / uDetHalf;
  float r = iRad * mag / uDetHalf * 1.25 + 0.01;
  vUv = uv + aCorner * r;
  fC = iC;
  fInv = mat3(iR0, iR1, iR2);
  fType = int(iType + 0.5);
  fMu = iMu;
  fMuI = iMuI;
  gl_Position = vec4(vUv, 0.0, 1.0);
}
`;
const BONE_FS = `${HEADER}
${CAMERA_GLSL}
${INTERVAL_GLSL}
${TRABECULAR_GLSL}
in vec2 vUv;
flat in vec3 fC;
flat in mat3 fInv;
flat in int fType;
flat in float fMu;
flat in float fMuI;
out vec4 frag;
void main() {
  vec3 rd = rayDir(vUv);
  vec2 i = interval(fType, fC, fInv, uSrc, rd);
  float l = ilen(i);
  // cancellous cores carry the trabecular texture (clutter.ts TRABECULAR_GLSL; zero elsewhere)
  frag = vec4(fMu * l + (l > 0.0 ? trabecular(uSrc, rd, i, fMu, fMuI) : 0.0), fMuI * l, 0.0, 0.0);
}
`;

// --- tubes (ribbons) -------------------------------------------------------
const TUBE_VS = `${HEADER}
in vec2 aPos;
in float aAcross;
in float aChord;
in vec3 aMu;
in float aCore;
out float vAcross;
out float vChord;
out vec3 vMu;
out float vCore;
void main() {
  vAcross = aAcross;
  vChord = aChord;
  vMu = aMu;
  vCore = aCore;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;
// Chord profile across a ribbon: a uniform cylinder gives sqrt(1 - a^2); the iodine channel can carry
// a share (vCore) of its iodine in a parabolic radial profile c(r) = 2 (1 - r^2 / R^2), whose projection
// is (4/3) (1 - a^2)^1.5 (the same iodine per unit length, peaked on the axis): TubeSpec.core.
const TUBE_FS = `${HEADER}
in float vAcross;
in float vChord;
in vec3 vMu;
in float vCore;
out vec4 frag;
void main() {
  float q = max(0.0, 1.0 - vAcross * vAcross);
  float prof = sqrt(q);
  float profI = mix(prof, 1.3333333 * q * prof, clamp(vCore, 0.0, 1.0));
  frag = vec4(vMu.r * vChord * prof, vMu.g * vChord * profI, vMu.b * vChord * prof, 0.0);
}
`;

// --- image chain -----------------------------------------------------------
const QUAD_VS = `${HEADER}
in vec2 aPos;
out vec2 vTex;
void main() { vTex = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;
const DISPLAY_FS = `${HEADER}
in vec2 vTex;
out vec4 frag;
uniform sampler2D uRec;    // processed log (R), white-noise variance (G), shutter mask (B)
uniform sampler2D uPrev;   // previous output: G = grey before the field model
uniform sampler2D uVel;    // screen velocity, px per frame
uniform float uRecW, uMotionC, uNoiseGain, uFirst;
uniform float uBladeT;
uniform float uCircle;
uniform vec2 uRes;
uniform float uFAmp, uFLam, uFPow, uFCorner, uVig;
${TONE_GLSL}
void main() {
  ivec2 ip = ivec2(gl_FragCoord.xy);
  vec4 R = texelFetch(uRec, ip, 0);
  // the blade attenuation was taken out before processing (no halo at shutter edges); put it back
  float L = R.r - log(uBladeT + (1.0 - uBladeT) * clamp(R.b, 0.0, 1.0));
  float g = tone(L);
  // expected noise SD of g (display units) for the motion detector
  float slope = max(toneSlope(L), 0.05 * uSlopeA);
  float sig = sqrt(max(R.g, 0.0)) * uNoiseGain * slope;
  vec2 vel = texelFetch(uVel, ip, 0).rg;
  vec2 back = vel / uRes;
  float prev = texture(uPrev, vTex - back).g;
  // motion detector on the 3x3 mean frame difference, so single-pixel noise extremes do not
  // switch the filter off (which would leave isolated unfiltered specks)
  float dsum = 0.0;
  ivec2 sz = textureSize(uRec, 0);
  for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
      ivec2 q = clamp(ip + ivec2(i, j), ivec2(0), sz - 1);
      vec4 Rq = texelFetch(uRec, q, 0);
      float gq = tone(Rq.r - log(uBladeT + (1.0 - uBladeT) * clamp(Rq.b, 0.0, 1.0)));
      dsum += gq - texture(uPrev, (vec2(q) + 0.5) / uRes - back).g;
    }
  // SD of a 3x3 mean of frame differences of noise with lag-1 correlation about 0.3: ~0.5 x sqrt(2) sigma
  float z = (dsum / 9.0) / (uMotionC * 0.5 * 1.41421356 * sig + 1e-4);
  float k = uRecW * exp(-z * z) * (1.0 - uFirst);
  g = mix(g, prev, k);
  // field geometry in 512-equivalent px
  float W = 512.0;
  float dist, inside;
  if (uCircle > 0.5) {
    float r = length(vTex - 0.5) * 2.0;
    dist = (0.985 - r) * W * 0.5;
    inside = smoothstep(-0.015 * W, 0.015 * W, dist);
  } else {
    // the image fills the square detector: no edge mask except outside rounded corners
    vec2 e = min(vTex, 1.0 - vTex) * W;
    inside = 1.0;
    if (uFCorner > 0.0 && e.x < uFCorner && e.y < uFCorner) {
      dist = uFCorner - length(vec2(uFCorner) - e);
      inside = smoothstep(-0.7, 0.7, dist);
    } else dist = min(e.x, e.y);
  }
  float fall = 1.0 - uFAmp * exp(-pow(max(dist, 0.0) / uFLam, uFPow));
  vec2 c = vTex * 2.0 - 1.0;
  float vig = 1.0 - uVig * dot(c, c);
  frag = vec4(g * fall * vig * inside, g, 0.0, 1.0);
}
`;
const BLIT_FS = `${HEADER}
in vec2 vTex;
out vec4 frag;
uniform sampler2D uTex;
void main() { float v = texture(uTex, vTex).r; frag = vec4(v, v, v, 1.0); }
`;
/**
 * Separable Lanczos-3 resampling for presenting the render at a different canvas size: run once
 * along x (into a dst-width x src-height target) and once along y (into the canvas). Downscaling
 * widens the kernel by the scale factor (anti-aliased); upscaling interpolates with the unit
 * kernel. Weights are normalised per output pixel.
 */
const LANCZOS_FS = `${HEADER}
out vec4 frag;
uniform sampler2D uSrc;
uniform ivec2 uDir;      // (1, 0) or (0, 1)
uniform float uScale;    // source px per output px along uDir
void main() {
  ivec2 op = ivec2(gl_FragCoord.xy);
  ivec2 sz = textureSize(uSrc, 0);
  int o = uDir.x == 1 ? op.x : op.y;
  int n = uDir.x == 1 ? sz.x : sz.y;
  float c = (float(o) + 0.5) * uScale - 0.5;
  float s = max(uScale, 1.0);
  float R = 3.0 * s;
  int i0 = int(ceil(c - R));
  int i1 = int(floor(c + R));
  float acc = 0.0, wsum = 0.0;
  for (int k = 0; k < 40; k++) {
    int i = i0 + k;
    if (i > i1) break;
    float x = (float(i) - c) / s;
    float w = abs(x) < 1e-4 ? 1.0 : (abs(x) >= 3.0 ? 0.0 : 3.0 * sin(3.14159265 * x) * sin(3.14159265 * x / 3.0) / (9.8696044 * x * x));
    int ic = clamp(i, 0, n - 1);
    ivec2 q = uDir.x == 1 ? ivec2(ic, op.y) : ivec2(op.x, ic);
    acc += w * texelFetch(uSrc, q, 0).r;
    wsum += w;
  }
  float v = acc / max(wsum, 1e-6);
  frag = vec4(v, v, v, 1.0);
}
`;

// ---------------------------------------------------------------------------
function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader error");
  return s;
}
function program(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  // keep the full-screen quad attribute at location 0 in every program that has it
  gl.bindAttribLocation(p, 0, "aPos");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link error");
  return p;
}

const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, k) => a + k);
/** The samples of a tube at the given indices. */
function pick(t: TubeSpec, idx: number[]): TubeSpec {
  return {
    pts: idx.map((i) => t.pts[i]),
    r: idx.map((i) => t.r[i]),
    mu: Array.isArray(t.mu[0]) ? idx.map((i) => (t.mu as [number, number, number][])[i]) : t.mu,
    thin: t.thin ? { dir: idx.map((i) => t.thin!.dir[i]), r: idx.map((i) => t.thin!.r[i]) } : undefined,
    core: t.core,
  };
}
const cross3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const len = (a: Vec3) => Math.hypot(a.x, a.y, a.z);

/** Inverse local transform rows (column-major mat3 for GLSL: columns are the rows here, so pass transposed). */
function invMat(s: Shape): number[] {
  const [a, b, c] = s.ax;
  const [h0, h1, h2] = s.half;
  // local = M (p - c), with rows a/h0, b/h1, c/h2. GLSL mat3 is column-major, so supply M's columns.
  return [a.x / h0, b.x / h1, c.x / h2, a.y / h0, b.y / h1, c.y / h2, a.z / h0, b.z / h1, c.z / h2];
}

interface Target {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
  w: number;
  h: number;
}

/** 32-bit float bits of a seed value, mixed, as an unsigned frame seed for the hash. */
function seedBits(seed: number): number {
  const f = new Float32Array([seed]);
  let h = new Uint32Array(f.buffer)[0] ^ 0x85ebca6b;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return (h ^ (h >>> 16)) >>> 0;
}

const isDev = (() => {
  try {
    return !!(import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
  } catch {
    return false;
  }
})();

export class XrayRenderer {
  readonly gl: WebGL2RenderingContext;
  /** dev timing harness: perf.enable(true), then perf.table() */
  readonly perf: RendererPerf;
  private res = 0;
  private passes: AccumulationPass[] = [];
  private passFrame = 0;

  /**
   * The analytic vessel and device integrator (segments/, S2b) and its thin-object pass, registered on
   * the first scene that carries a segment batch (XrayScene.extra[SEGMENTS_KEY]); the segment pass
   * writes the screen-velocity target the recursive filter uses.
   */
  private ensureSegmentPasses(extra: Record<string, unknown> | undefined) {
    if (!extra || !extra[SEGMENTS_KEY] || this.hasPass(SEGMENTS_KEY)) return;
    const seg = createSegmentPass({ velocity: true });
    seg.velocityTarget = () => this.getVelocityTarget();
    this.addPass(seg);
    this.addPass(createThinPass());
  }

  /** Register an additional additive line-integral pass (see passes.ts). */
  addPass(pass: AccumulationPass) {
    if (!this.passes.some((p) => p.name === pass.name)) this.passes.push(pass);
  }

  /** Whether a pass of this name is registered. */
  hasPass(name: string): boolean {
    return this.passes.some((p) => p.name === name);
  }

  removePass(name: string) {
    const p = this.passes.find((x) => x.name === name);
    if (p) p.dispose?.(this.gl);
    this.passes = this.passes.filter((x) => x.name !== name);
  }
  private acc!: Target;
  private vel!: Target;
  private prim!: Target;
  private det!: Target;
  private mtfTmp!: Target;
  private G: Target[] = [];
  private rec: Target[] = [];
  private meter!: Target;
  private meter1!: Target;
  private disp: Target[] = [];
  private flip = 0;
  private accFormat: number;
  private pAnat: WebGLProgram;
  private pBone: WebGLProgram;
  private pTube: WebGLProgram;
  private pPrim: WebGLProgram;
  private pDet: WebGLProgram;
  private pMtf: WebGLProgram;
  private pDown: WebGLProgram;
  private pRecon: WebGLProgram;
  private pMeter: WebGLProgram;
  private pMeter1: WebGLProgram;
  private pDisp: WebGLProgram;
  private pBlit: WebGLProgram;
  private pLanczos: WebGLProgram;
  /** intermediate target of the separable present resample (dst width x src height) */
  private lzTmp: Target | null = null;
  private quad: WebGLBuffer;
  private vaoQuad: WebGLVertexArrayObject;
  private boneVao: WebGLVertexArrayObject;
  private boneInst: WebGLBuffer;
  private cornerBuf: WebGLBuffer;
  private tubeVao: WebGLVertexArrayObject;
  private tubeBuf: WebGLBuffer;
  private tubeIdx: WebGLBuffer;
  private lutTex: WebGLTexture;
  private pbo: WebGLBuffer;
  private uniCache = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();

  // ---- chain state ----
  private frameNo = 0;
  private runFrame = 0;
  private lastRenderT = -1e9;
  /** recent frame intervals (ms), for the adaptive run-gap threshold */
  private intervals: number[] = [];
  private lastMode: "fluoro" | "cine" | null = null;
  // ---- resolution policy (fitCanvas) ----
  private policy: Required<ResolutionPolicy> | null = null;
  private presentPx = 0;
  private resCap = 1024;
  private fellBack = false;
  private overruns = 0;
  private lastProbeMs = 0;
  private pendingRes = 0;
  private syncScratch = { f: new Float32Array(4), u: new Uint8Array(4) };
  private forceNewRun = false;
  private captureMode = false;
  private profileOverride: SystemProfileId | null = null;
  private lutKey = "";
  private lut = new Float32Array(256);
  /** noise propagation factors by MTF/gain key (about 50 ms to compute; cached, e.g. one per mode) */
  private nfCache = new Map<string, NoiseFactors>();
  private win: WindowState | null = null;
  private fence: WebGLSync | null = null;
  private fenceFrame = 0;
  private fenceRunFrame = 0;
  private fenceSettle = 1;
  private meterData = new Float32Array(0);
  private meterWaiters: ((m: MeterReading) => void)[] = [];
  private lastProfile: SystemProfile = getProfile();
  private lastCircle = false;
  /** the processed-image target holds no previous frame yet (after resize) */
  private freshTargets = true;
  /** latest metering result (one frame late unless capture mode is on) */
  lastMeter: MeterReading | null = null;

  static create(canvas: HTMLCanvasElement | OffscreenCanvas): XrayRenderer | null {
    try {
      const gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false }) as WebGL2RenderingContext | null;
      if (!gl) return null;
      if (!gl.getExtension("EXT_color_buffer_float")) return null;
      gl.getExtension("OES_texture_float_linear");
      return new XrayRenderer(gl);
    } catch {
      return null;
    }
  }

  private constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    // 32-bit accumulation where float blending exists (line integrals of dense paths lose
    // precision in half floats), else 16-bit
    this.accFormat = gl.getExtension("EXT_float_blend") ? gl.RGBA32F : gl.RGBA16F;
    this.perf = new RendererPerf(gl);
    this.pAnat = program(gl, ANAT_VS, ANAT_FS);
    this.pBone = program(gl, BONE_VS, BONE_FS);
    this.pTube = program(gl, TUBE_VS, TUBE_FS);
    this.pPrim = program(gl, QUAD_VS, PRIM_FS(HEADER));
    this.pDet = program(gl, QUAD_VS, DET_FS(HEADER, TONE_GLSL));
    this.pMtf = program(gl, QUAD_VS, MTF_FS(HEADER));
    this.pDown = program(gl, QUAD_VS, DOWN_FS(HEADER));
    this.pRecon = program(gl, QUAD_VS, RECON_FS(HEADER));
    this.pMeter = program(gl, QUAD_VS, METER_FS(HEADER, SCATTER_GLSL));
    this.pMeter1 = program(gl, QUAD_VS, METER1_FS(HEADER));
    this.pDisp = program(gl, QUAD_VS, DISPLAY_FS);
    this.pBlit = program(gl, QUAD_VS, BLIT_FS);
    this.pLanczos = program(gl, QUAD_VS, LANCZOS_FS);

    // full-screen triangle pair (attribute location 0 in every program, see program())
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    this.vaoQuad = gl.createVertexArray()!;
    gl.bindVertexArray(this.vaoQuad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // bone instancing
    this.boneVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.boneVao);
    this.cornerBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.cornerBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const cl = gl.getAttribLocation(this.pBone, "aCorner");
    gl.enableVertexAttribArray(cl);
    gl.vertexAttribPointer(cl, 2, gl.FLOAT, false, 0, 0);
    this.boneInst = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.boneInst);
    const stride = 16 * 4;
    const attrs: [string, number, number][] = [
      ["iC", 3, 0],
      ["iR0", 3, 3],
      ["iR1", 3, 6],
      ["iR2", 3, 9],
      ["iType", 1, 12],
      ["iMu", 1, 13],
      ["iRad", 1, 14],
      ["iMuI", 1, 15],
    ];
    for (const [name, size, off] of attrs) {
      const loc = gl.getAttribLocation(this.pBone, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off * 4);
      gl.vertexAttribDivisor(loc, 1);
    }

    // tubes
    this.tubeVao = gl.createVertexArray()!;
    gl.bindVertexArray(this.tubeVao);
    this.tubeBuf = gl.createBuffer()!;
    this.tubeIdx = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tubeBuf);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tubeIdx);
    const ts = TUBE_FLOATS * 4;
    const tattrs: [string, number, number][] = [
      ["aPos", 2, 0],
      ["aAcross", 1, 2],
      ["aChord", 1, 3],
      ["aMu", 3, 4],
      ["aCore", 1, 7],
    ];
    for (const [name, size, off] of tattrs) {
      const loc = gl.getAttribLocation(this.pTube, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, ts, off * 4);
    }
    gl.bindVertexArray(null);

    // display LUT (256 x 1)
    this.lutTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.lutTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.pbo = gl.createBuffer()!;

    // exact thorax segments (ribs, cartilage, pulmonary trees, hardware); draws only when the scene
    // carries them (XrayScene.extra[THORAX_SEGMENTS_KEY], clutter.ts)
    this.addPass(new ThoraxSegmentPass());

    if (isDev && typeof window !== "undefined") {
      const w = window as unknown as { __xray?: XrayRenderer; __xrayPerf?: () => string };
      w.__xray = this;
      w.__xrayPerf = () => this.perf.table();
    }
  }

  private u(p: WebGLProgram, name: string) {
    let m = this.uniCache.get(p);
    if (!m) this.uniCache.set(p, (m = new Map()));
    if (!m.has(name)) m.set(name, this.gl.getUniformLocation(p, name));
    return m.get(name)!;
  }

  private target(w: number, h: number, opts: { mip?: boolean; format?: number; filter?: number } = {}): Target {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const levels = opts.mip ? Math.floor(Math.log2(Math.max(w, h))) + 1 : 1;
    gl.texStorage2D(gl.TEXTURE_2D, levels, opts.format ?? gl.RGBA16F, w, h);
    const lin = opts.filter ?? gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, opts.mip ? gl.LINEAR_MIPMAP_LINEAR : lin);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, lin);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo, w, h };
  }

  private freeTargets() {
    const gl = this.gl;
    for (const t of [this.acc, this.vel, this.prim, this.det, this.mtfTmp, this.meter, this.meter1, ...this.G, ...this.rec, ...this.disp, this.lzTmp]) {
      if (!t) continue;
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fbo);
    }
    this.lzTmp = null;
    this.G = [];
    this.rec = [];
    this.disp = [];
  }

  resize(res: number) {
    if (res === this.res) return;
    const gl = this.gl;
    if (this.res) this.freeTargets();
    this.res = res;
    this.perf.res = res;
    this.acc = this.target(res, res, { format: this.accFormat, filter: gl.NEAREST });
    this.vel = this.target(res, res, { format: gl.RG16F });
    this.prim = this.target(res, res, { mip: true });
    this.det = this.target(res, res, { filter: gl.NEAREST });
    this.mtfTmp = this.target(res, res, { filter: gl.NEAREST });
    for (let k = 0; k < PYR_LEVELS; k++) {
      const s = Math.max(1, Math.ceil(res / 2 ** k));
      this.G.push(this.target(s, s));
      if (k < PYR_LEVELS - 1) this.rec.push(this.target(s, s));
    }
    const ms = Math.ceil(res / meterStride(res));
    this.meter = this.target(ms, ms, { format: gl.RGBA32F, filter: gl.NEAREST });
    this.meterData = new Float32Array(ms * ms * 4);
    this.meter1 = this.target(1, 1, { format: gl.RGBA32F, filter: gl.NEAREST });
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.pbo);
    gl.bufferData(gl.PIXEL_PACK_BUFFER, this.meterData.byteLength, gl.STREAM_READ);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    if (this.fence) {
      gl.deleteSync(this.fence);
      this.fence = null;
    }
    this.disp = [this.target(res, res), this.target(res, res)];
    for (const d of this.disp) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, d.fbo);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    this.forceNewRun = true;
    this.freshTargets = true;
    // warm the noise-factor cache for the default profile at the scene builder's cine and fluoro
    // edge strengths, so the first frame of each mode does not pay the ~50 ms computation
    const base = { counts: 1, recursive: 0, spr: 0, iodineGain: 1, metalGain: 1, window: 1, level: 0, seed: 0, field: "square" as const, drc: 0.7 };
    for (const edge of [0.75, 0.55]) {
      this.noise(getProfile(), { ...base, edge });
      if (res !== REFERENCE_RES) this.noise(getProfile(), { ...base, edge }, REFERENCE_RES);
    }
  }

  // ---- public controls ------------------------------------------------------

  /** Force a profile regardless of ImageParams.profile (null = follow the params). */
  setProfile(id: SystemProfileId | null) {
    this.profileOverride = id;
  }

  /**
   * Capture mode: the auto-window uses a synchronous readback of the current frame, run
   * frames are counted per render (not from wall-clock gaps) and a run starts with a cleared
   * recursion buffer, so a capture sequence is reproducible.
   */
  setCaptureMode(on: boolean) {
    this.captureMode = on;
    this.forceNewRun = true;
  }

  /** Start a new acquisition run with the next frame (settling restarts, recursion cleared). */
  beginRun() {
    this.forceNewRun = true;
  }

  /** The screen-velocity target (RG16F, px per frame, cleared to 0 each frame) for motion compensation. */
  getVelocityTarget(): { fbo: WebGLFramebuffer; tex: WebGLTexture; res: number } | null {
    return this.vel ? { fbo: this.vel.fbo, tex: this.vel.tex, res: this.res } : null;
  }

  /** Display window in force (log units), or null before the first metered frame. */
  getWindow(): WindowState | null {
    return this.win ? { ...this.win } : null;
  }

  /** Resolves with the next metering reading (for dose-rate control). */
  getMeter(): Promise<MeterReading> {
    return new Promise((resolve) => this.meterWaiters.push(resolve));
  }

  /**
   * Automatic render resolution for a canvas of devicePx x devicePx device pixels (the caller
   * sizes the canvas): the render resolution is devicePx rounded up to a multiple of 32, capped at
   * policy.maxRes (1024), and the frame is presented at the canvas size with a Lanczos-3 resample
   * (a downscale when the render is larger, e.g. 1024 into a 900 px canvas). Every probeEvery
   * frames render() is timed between two hard syncs; two consecutive probes over budgetMs (25 ms)
   * drop the cap to fallbackRes (768) for the rest of the session. Returns the render resolution.
   * Callers that size the render themselves keep using resize().
   */
  fitCanvas(devicePx: number, policy: ResolutionPolicy = {}): number {
    this.policy = {
      maxRes: policy.maxRes ?? this.policy?.maxRes ?? 1024,
      fallbackRes: policy.fallbackRes ?? this.policy?.fallbackRes ?? 768,
      budgetMs: policy.budgetMs ?? this.policy?.budgetMs ?? 25,
      probeEvery: policy.probeEvery ?? this.policy?.probeEvery ?? 90,
    };
    if (!this.fellBack) this.resCap = this.policy.maxRes;
    this.presentPx = Math.max(1, Math.round(devicePx));
    const res = Math.min(this.resCap, roundUp32(this.presentPx));
    this.resize(res);
    return res;
  }

  /** Render resolution, presentation size and the state of the automatic fallback. */
  getResolution(): ResolutionState {
    return { res: this.res, presentPx: this.presentPx || this.res, fellBack: this.fellBack, lastProbeMs: this.lastProbeMs };
  }

  private setCamera(p: WebGLProgram, cam: XrayCamera) {
    const gl = this.gl;
    gl.uniform3f(this.u(p, "uSrc"), cam.src.x, cam.src.y, cam.src.z);
    gl.uniform3f(this.u(p, "uDetC"), cam.detC.x, cam.detC.y, cam.detC.z);
    gl.uniform3f(this.u(p, "uDetU"), cam.detU.x, cam.detU.y, cam.detU.z);
    gl.uniform3f(this.u(p, "uDetV"), cam.detV.x, cam.detV.y, cam.detV.z);
  }

  /** Project a world point to detector uv (−1..1) and magnification. */
  static project(cam: XrayCamera, p: Vec3): { u: number; v: number; mag: number; along: number } {
    const N0 = { x: cam.detC.x - cam.src.x, y: cam.detC.y - cam.src.y, z: cam.detC.z - cam.src.z };
    const sid = len(N0);
    const N = { x: N0.x / sid, y: N0.y / sid, z: N0.z / sid };
    const d = { x: p.x - cam.src.x, y: p.y - cam.src.y, z: p.z - cam.src.z };
    const along = Math.max(1, dot(d, N));
    const mag = sid / along;
    const q = { x: cam.src.x + d.x * mag - cam.detC.x, y: cam.src.y + d.y * mag - cam.detC.y, z: cam.src.z + d.z * mag - cam.detC.z };
    const hu = len(cam.detU);
    const hv = len(cam.detV);
    return { u: dot(q, cam.detU) / (hu * hu), v: dot(q, cam.detV) / (hv * hv), mag, along };
  }

  private buildTubes(cam: XrayCamera, tubesIn: TubeSpec[]) {
    const res = this.res;
    const half = len(cam.detU);
    const mmPerPx = (2 * half) / res;
    // Where a tube runs almost straight at the detector its projected samples bunch up closer
    // than the ribbon is wide, and consecutive quads fold into spikes. Drop those samples: the
    // obliquity factor on the neighbours still carries the end-on path length.
    // Shells (outer tube plus a negative inner tube: ribs, stents, calcium) share one points
    // array and must be sampled identically or the uncancelled core shows, so the first tube
    // drawn on a points array decides the samples for all of them.
    const keepFor = new Map<Vec3[], number[]>();
    const decimated = tubesIn.map((t) => {
      const n = t.pts.length;
      if (n < 3) return t;
      let keep = keepFor.get(t.pts);
      if (!keep) {
        const pr = t.pts.map((p) => XrayRenderer.project(cam, p));
        keep = [0];
        for (let i = 1; i < n - 1; i++) {
          const q = pr[keep[keep.length - 1]];
          const hwUv = (Math.max((t.r[i] * pr[i].mag) / mmPerPx, 1.25) / res) * 2;
          if (Math.hypot(pr[i].u - q.u, pr[i].v - q.v) >= 0.5 * hwUv) keep.push(i);
        }
        keep.push(n - 1);
        keepFor.set(t.pts, keep);
      }
      if (keep.length === n) return t;
      return pick(t, keep);
    });
    // A tube that turns back on itself in projection (a lateral rib seen at the chest wall) cannot
    // be one ribbon: the quad across the hairpin twists. Split it there; both limbs end on the
    // turning sample, where the ray runs along the tube and the obliquity factor makes it dense.
    const tubes: TubeSpec[] = [];
    for (const t of decimated) {
      const n = t.pts.length;
      if (n < 3) {
        tubes.push(t);
        continue;
      }
      const pr = t.pts.map((p) => XrayRenderer.project(cam, p));
      let start = 0;
      for (let i = 1; i < n - 1; i++) {
        const ax = pr[i].u - pr[i - 1].u,
          ay = pr[i].v - pr[i - 1].v,
          bx = pr[i + 1].u - pr[i].u,
          by = pr[i + 1].v - pr[i].v;
        if (ax * bx + ay * by < 0) {
          tubes.push(pick(t, range(start, i)));
          start = i;
        }
      }
      tubes.push(start === 0 ? t : pick(t, range(start, n - 1)));
    }
    let nv = 0,
      ni = 0;
    for (const t of tubes) if (t.pts.length >= 2) {
      nv += t.pts.length * 2;
      ni += (t.pts.length - 1) * 6;
    }
    const vb = new Float32Array(nv * TUBE_FLOATS);
    const ib = new Uint32Array(ni);
    let vo = 0,
      io = 0,
      base = 0;
    for (const t of tubes) {
      const n = t.pts.length;
      if (n < 2) continue;
      const pr = t.pts.map((p) => XrayRenderer.project(cam, p));
      const muArr = Array.isArray(t.mu[0]) ? (t.mu as [number, number, number][]) : null;
      let lnx = 0,
        lny = 1;
      for (let i = 0; i < n; i++) {
        const a = pr[Math.max(0, i - 1)],
          b = pr[Math.min(n - 1, i + 1)];
        // screen tangent and normal (uv space is isotropic: square detector); where the tube points
        // almost straight at the detector the projected tangent vanishes, so keep the last normal
        // rather than letting the ribbon twist into spikes
        let tx = b.u - a.u,
          ty = b.v - a.v;
        const tl = Math.hypot(tx, ty);
        let nx = lnx,
          ny = lny;
        if (tl > 1e-4) {
          tx /= tl;
          ty /= tl;
          nx = -ty;
          ny = tx;
          // keep a consistent side so consecutive quads never fold over each other
          if (i > 0 && nx * lnx + ny * lny < 0) {
            nx = -nx;
            ny = -ny;
          }
          lnx = nx;
          lny = ny;
        }
        // obliquity: angle between the ray and the 3D tangent
        const P = t.pts[i];
        const P0 = t.pts[Math.max(0, i - 1)],
          P1 = t.pts[Math.min(n - 1, i + 1)];
        const T = { x: P1.x - P0.x, y: P1.y - P0.y, z: P1.z - P0.z };
        const R = { x: P.x - cam.src.x, y: P.y - cam.src.y, z: P.z - cam.src.z };
        const lt = len(T) || 1,
          lr = len(R) || 1;
        const cosA = Math.abs(dot(T, R)) / (lt * lr);
        const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
        // end-on path length: capped lower for flat bones, whose tangential margins are lines, not blocks
        const invSin = 1 / Math.max(sinA, t.thin ? 0.35 : 0.14);
        // half-width across the ray and the chord through the centre: a circle of radius r,
        // or an ellipse (wide semi-axis r, thin semi-axis along thin.dir) seen from this ray
        let r = t.r[i];
        let c0 = 2 * r;
        // flattened tubes: blend to the equal-area circle as the tube turns end-on, where the
        // ellipse orientation is undefined (an abrupt switch draws wedges at rib ends)
        const req = t.thin ? Math.sqrt(t.r[i] * Math.max(0.2, t.thin.r[i])) : r;
        const wEll = t.thin ? Math.min(1, Math.max(0, (sinA - 0.12) / 0.25)) : 0;
        if (t.thin) {
          r = req;
          c0 = 2 * req;
        }
        if (t.thin && wEll > 0) {
          const Tn = { x: T.x / lt, y: T.y / lt, z: T.z / lt };
          const Rn = { x: R.x / lr, y: R.y / lr, z: R.z / lr };
          const nn = cross3(Tn, Rn);
          const nl = len(nn);
          const d = t.thin.dir[i];
          const dd = dot(d, Tn);
          const e2r = { x: d.x - dd * Tn.x, y: d.y - dd * Tn.y, z: d.z - dd * Tn.z };
          const el = len(e2r);
          if (nl > 1e-6 && el > 1e-6) {
            const n = { x: nn.x / nl, y: nn.y / nl, z: nn.z / nl };
            const e2 = { x: e2r.x / el, y: e2r.y / el, z: e2r.z / el };
            const e1 = cross3(Tn, e2);
            const u = cross3(n, Tn);
            const a = t.r[i],
              b = Math.max(0.2, t.thin.r[i]);
            const rE = Math.sqrt(a * a * dot(n, e1) ** 2 + b * b * dot(n, e2) ** 2);
            const cE = 2 / Math.sqrt(dot(u, e1) ** 2 / (a * a) + dot(u, e2) ** 2 / (b * b));
            r = req + (rE - req) * wEll;
            c0 = 2 * req + (cE - 2 * req) * wEll;
          }
        }
        const rPx = (r * pr[i].mag) / mmPerPx;
        // sub-pixel tubes (wires, small branches) are spread over ~2.5 px with their integral kept,
        // which avoids the beaded look of aliased hairlines
        const hw = Math.max(rPx, 1.25);
        const k = Math.min(1, rPx / hw);
        const hwUv = (hw / res) * 2;
        const chord = c0 * k * invSin;
        const mu = muArr ? muArr[i] : (t.mu as [number, number, number]);
        for (const side of [-1, 1]) {
          vb[vo++] = pr[i].u + nx * hwUv * side;
          vb[vo++] = pr[i].v + ny * hwUv * side;
          vb[vo++] = side;
          vb[vo++] = chord;
          vb[vo++] = mu[0];
          vb[vo++] = mu[1];
          vb[vo++] = mu[2];
          vb[vo++] = t.core ?? 0;
        }
        if (i < n - 1) {
          const q = base + i * 2;
          ib[io++] = q;
          ib[io++] = q + 1;
          ib[io++] = q + 2;
          ib[io++] = q + 1;
          ib[io++] = q + 3;
          ib[io++] = q + 2;
        }
      }
      base += n * 2;
    }
    return { vb, ib, count: io };
  }

  render(scene: XrayScene, params: ImageParams, target: "canvas" | null = "canvas") {
    const gl = this.gl;
    if (this.pendingRes && this.pendingRes !== this.res) this.resize(this.pendingRes);
    this.pendingRes = 0;
    const res = this.res;
    if (!res) return;
    const perf = this.perf;
    perf.frameStart();
    this.frameNo++;
    // frame-time probe for the automatic resolution fallback (fitCanvas): one stall every
    // probeEvery frames
    const probe = !!this.policy && this.policy.probeEvery > 0 && !perf.enabled && this.frameNo % this.policy.probeEvery === 0;
    let probeT0 = 0;
    if (probe) {
      hardSync(gl, this.syncScratch);
      probeT0 = performance.now();
    }
    const prof = getProfile(this.profileOverride ?? params.profile);
    this.lastProfile = prof;
    this.ensureSegmentPasses(scene.extra);
    const circle = params.field === "circle";
    this.lastCircle = circle;

    // ---- run bookkeeping: settling restarts and recursion is cleared at each run start ----
    const now = typeof performance !== "undefined" ? performance.now() : 0;
    const mode = params.mode ?? (params.recursive > 0.3 ? "fluoro" : "cine");
    let k: number;
    if (params.framesSinceStart !== undefined) {
      k = Math.max(0, params.framesSinceStart);
      this.runFrame = k;
    } else {
      const dt = now - this.lastRenderT;
      const iv = this.intervals;
      const typical = iv.length ? [...iv].sort((a, b) => a - b)[iv.length >> 1] : 0;
      const gap = !this.captureMode && dt > Math.max(RUN_GAP_MS, RUN_GAP_FACTOR * typical);
      const newRun = this.forceNewRun || this.lastMode !== mode || gap;
      this.runFrame = newRun ? 0 : this.runFrame + 1;
      k = this.runFrame;
    }
    {
      const dt = now - this.lastRenderT;
      if (dt > 0 && dt < 10000) {
        this.intervals.push(dt);
        if (this.intervals.length > 8) this.intervals.shift();
      }
    }
    this.forceNewRun = false;
    this.lastMode = mode;
    this.lastRenderT = now;
    const settle = settleFactor(k, prof);
    const firstOfRun = k === 0;

    // collect the previous frame's asynchronous readback (one frame of latency)
    this.pollReadback(prof, circle, false);

    gl.viewport(0, 0, res, res);
    gl.disable(gl.DEPTH_TEST);

    // ---- 1. anatomy (writes, no blending) ----
    perf.begin("anatomy");
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.acc.fbo);
    gl.disable(gl.BLEND);
    gl.useProgram(this.pAnat);
    this.setCamera(this.pAnat, scene.cam);
    const n = Math.min(MAX_ANAT, scene.anat.length);
    const cm = new Float32Array(MAX_ANAT * 4);
    const tf = new Int32Array(MAX_ANAT * 2);
    const invs = new Float32Array(MAX_ANAT * 9);
    scene.anat.slice(0, n).forEach((s, i) => {
      cm.set([s.c.x, s.c.y, s.c.z, s.mu], i * 4);
      tf.set([s.type, (s.lung ? 1 : 0) | (s.carve ? 2 : 0)], i * 2);
      invs.set(invMat(s), i * 9);
    });
    gl.uniform1i(this.u(this.pAnat, "uCount"), n);
    gl.uniform4fv(this.u(this.pAnat, "uCM"), cm);
    gl.uniform2iv(this.u(this.pAnat, "uTF"), tf);
    gl.uniformMatrix3fv(this.u(this.pAnat, "uInv"), false, invs);
    // lung-anchored clutter: lung frames and patient seed (clutter.ts); without them the clutter
    // falls back to a patient-fixed field
    applyClutterUniforms(gl, (name) => this.u(this.pAnat, name), (scene.extra?.[CLUTTER_KEY] as ClutterState | undefined) ?? null);
    gl.bindVertexArray(this.vaoQuad);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // ---- 2. bones (additive) ----
    perf.begin("bones");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.blendEquation(gl.FUNC_ADD);
    if (scene.bones.length) {
      const data = new Float32Array(scene.bones.length * 16);
      scene.bones.forEach((b, i) => {
        const m = invMat(b);
        const rad = Math.max(...b.half) * (b.type === 2 ? 1.75 : b.type === 1 ? 1.45 : 1.0);
        data.set([b.c.x, b.c.y, b.c.z, m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], b.type, b.mu, rad, b.muI ?? 0], i * 16);
      });
      gl.useProgram(this.pBone);
      this.setCamera(this.pBone, scene.cam);
      gl.uniform1f(this.u(this.pBone, "uDetHalf"), len(scene.cam.detU));
      gl.uniform1f(this.u(this.pBone, "uTrabAmp"), CLUTTER_TUNE.trabecular);
      gl.bindVertexArray(this.boneVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.boneInst);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, scene.bones.length);
    }

    // ---- 3. tubes (additive) ----
    perf.begin("tubes");
    const tb = this.buildTubes(scene.cam, scene.tubes);
    if (tb.count) {
      gl.useProgram(this.pTube);
      gl.bindVertexArray(this.tubeVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tubeBuf);
      gl.bufferData(gl.ARRAY_BUFFER, tb.vb, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tubeIdx);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tb.ib, gl.DYNAMIC_DRAW);
      gl.drawElements(gl.TRIANGLES, tb.count, gl.UNSIGNED_INT, 0);
    }
    // ---- 3b. registered extra passes (additive into the same target) ----
    // the velocity buffer is cleared every frame; passes that know screen motion write it
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.vel.fbo);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.acc.fbo);
    if (this.passes.length) {
      perf.begin("extra");
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      this.passFrame++;
      for (const p of this.passes) p.draw({ gl, cam: scene.cam, res, extra: scene.extra ?? {}, frame: this.passFrame });
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.acc.fbo);
      gl.viewport(0, 0, res, res);
    }
    gl.disable(gl.BLEND);
    gl.bindVertexArray(this.vaoQuad);

    // ---- 4. primary transmission x fluence (shutters, wedges) + mips ----
    perf.begin("primary");
    const pen = (params.shutterPenumbraPx ?? DEFAULT_PENUMBRA_PX) * (res / 768);
    this.pass(this.pPrim, this.prim, { uAcc: this.acc.tex }, (p) => {
      gl.uniform1f(this.u(p, "uIodine"), params.iodineGain);
      gl.uniform1f(this.u(p, "uMetal"), params.metalGain);
      gl.uniform2f(this.u(p, "uRes"), res, res);
      const sh = params.shutters ?? [0, 0, 0, 0];
      gl.uniform4f(this.u(p, "uShutters"), sh[0], sh[1], sh[2], sh[3]);
      gl.uniform1f(this.u(p, "uPenSigma"), pen / EDGE_10_90_PER_SIGMA);
      gl.uniform1f(this.u(p, "uBladeT"), BLADE_TRANSMISSION);
      const wd = (params.wedges ?? []).slice(0, MAX_WEDGES);
      const wv = new Float32Array(MAX_WEDGES * 4);
      const ws = new Float32Array(MAX_WEDGES);
      wd.forEach((w, i) => {
        wv.set([Math.cos(w.angle), Math.sin(w.angle), w.offset, Math.min(1, Math.max(0, w.transmission ?? DEFAULT_WEDGE_TRANSMISSION))], i * 4);
        ws[i] = ((w.edgePx ?? 3) * (res / 768)) / EDGE_10_90_PER_SIGMA;
      });
      gl.uniform1i(this.u(p, "uNWedge"), wd.length);
      gl.uniform4fv(this.u(p, "uWedge"), wv);
      gl.uniform1fv(this.u(p, "uWedgeSigma"), ws);
    });
    gl.bindTexture(gl.TEXTURE_2D, this.prim.tex);
    gl.generateMipmap(gl.TEXTURE_2D);

    // ---- 5. detector: scatter, AEC, quanta, quantum noise and floor ----
    perf.begin("detector");
    const nf = this.noise(prof, params);
    const lut = this.ensureLut(prof);
    const winForFloor = this.win ?? this.fallbackWindow(params);
    // grey-independent floor: SD floorGrey display levels after the whole chain, evaluated at the
    // display slope of the median grey
    const slopeMid = toneSlopeAt(lut, winForFloor, this.lastMeter?.p50 ?? 0);
    const doseScale = Math.min(4, Math.max(0.5, Math.sqrt(prof.detector.floorRefCounts / Math.max(1, params.counts))));
    // Resolution invariance: the profiles are calibrated at REFERENCE_RES. A render pixel covers
    // pixArea reference pixels, so it receives pixArea times the quanta, and the per-pixel floor
    // and electronic noise scale so that the noise per unit detector area is unchanged (identity
    // at 768).
    const pixArea = (REFERENCE_RES / res) ** 2;
    // The floor is specified as a display SD after the whole chain at REFERENCE_RES. It is injected
    // as white noise before the MTF, so convert with the reference chain's noise gain and scale
    // the white SD by res / REFERENCE_RES (white noise per unit area unchanged); converting with
    // this resolution's gain instead would keep the per-pixel output SD fixed, which over-states
    // the noise per unit area at higher resolutions.
    const nfRef = res === REFERENCE_RES ? nf : this.noise(prof, params, REFERENCE_RES);
    const floorWhite = ((prof.detector.floorGrey * doseScale) / 255 / Math.max(1e-3, nfRef.outputGain)) / Math.sqrt(pixArea);
    const floorL = floorWhite / Math.max(1e-3, slopeMid);
    const eta = prof.detector.quantumEfficiency;
    const Nm = (Math.max(1, params.counts) * pixArea * eta * (params.aec === false ? (this.lastMeter?.transmission ?? 1) : 1)) / (settle * settle);
    const frameSeed = seedBits(params.seed);
    const spr = params.spr * (params.gridIn === false ? GRID_OUT_SPR_FACTOR : 1);
    const maxLod = Math.floor(Math.log2(res));
    const lodBase = Math.log2(res / 768);
    const usePrev = !!this.win && this.frameNo > 1 && !this.freshTargets;
    this.pass(this.pMeter1, this.meter1, { uPrim: this.prim.tex }, (p) => {
      gl.uniform1f(this.u(p, "uSpr"), spr);
      gl.uniform1f(this.u(p, "uLodBase"), lodBase);
      gl.uniform1f(this.u(p, "uMaxLod"), maxLod);
    });
    this.pass(this.pDet, this.det, { uPrim: this.prim.tex, uPrevRec: this.rec[0].tex, uLut: this.lutTex, uMeterTex: this.meter1.tex }, (p) => {
      this.setTone(p, winForFloor);
      gl.uniform1f(this.u(p, "uUsePrev"), usePrev ? 1 : 0);
      gl.uniform1f(this.u(p, "uFloorDisp"), floorWhite);
      gl.uniform1f(this.u(p, "uSpr"), spr);
      gl.uniform1f(this.u(p, "uLodBase"), lodBase);
      gl.uniform1f(this.u(p, "uMaxLod"), maxLod);
      gl.uniform1f(this.u(p, "uCounts"), Math.max(1, params.counts) * pixArea);
      gl.uniform1f(this.u(p, "uEta"), eta);
      gl.uniform1f(this.u(p, "uAec"), params.aec === false ? 0 : 1);
      gl.uniform1f(this.u(p, "uSettle"), settle);
      gl.uniform1f(this.u(p, "uFloorL"), floorL);
      gl.uniform1f(this.u(p, "uFloorDark"), prof.detector.floorDarkSlope ?? 0);
      gl.uniform1f(this.u(p, "uFloorG0"), prof.detector.floorG0 ?? 0.55);
      gl.uniform1ui(this.u(p, "uFrameSeed"), frameSeed);
    });

    // ---- 6. MTF (x then y), electronic noise, log ----
    perf.begin("mtf");
    const sx = prof.detector.mtfSigma512[0] * (res / 512);
    const sy = prof.detector.mtfSigma512[1] * (res / 512);
    const mtf = (src: Target, dst: Target, dir: [number, number], sigma: number, final: boolean) =>
      this.pass(this.pMtf, dst, { uSrc: src.tex }, (p) => {
        gl.uniform2i(this.u(p, "uDir"), dir[0], dir[1]);
        gl.uniform1fv(this.u(p, "uTap"), new Float32Array(gaussTaps(sigma)));
        gl.uniform1f(this.u(p, "uFinal"), final ? 1 : 0);
        // electronic noise per pixel scales with sqrt(pixel area): constant per unit area
        gl.uniform1f(this.u(p, "uElec"), (prof.detector.electronicSigma * Math.sqrt(pixArea)) / Nm);
        gl.uniform1f(this.u(p, "uLmin"), -6);
        gl.uniform1f(this.u(p, "uLmax"), 7);
        gl.uniform1f(this.u(p, "uBladeT"), BLADE_TRANSMISSION);
        gl.uniform1ui(this.u(p, "uFrameSeed"), frameSeed);
      });
    mtf(this.det, this.mtfTmp, [1, 0], sx, false);
    mtf(this.mtfTmp, this.G[0], [0, 1], sy, true);

    // ---- 7. Laplacian pyramid: analysis ----
    perf.begin("pyr-down");
    for (let l = 1; l < PYR_LEVELS; l++) this.pass(this.pDown, this.G[l], { uSrc: this.G[l - 1].tex }, () => {});

    // ---- 7b. synthesis with band gains, coring and harmonisation ----
    perf.begin("pyr-up");
    const edgeScale = Math.max(0, params.edge) / 0.75;
    const drcScale = Math.max(0, params.drc ?? 0.7) / 0.7;
    const gains = gainsAtRes(prof.processing.bandGains, res, REFERENCE_RES).map((g) => Math.max(0, 1 + (g - 1) * edgeScale));
    const coreDepth = gainsAtRes(prof.processing.coring.depth, res, REFERENCE_RES);
    const resGain = Math.min(1.5, Math.max(0, 1 - (1 - prof.processing.residualGain) * drcScale));
    for (let l = PYR_LEVELS - 2; l >= 0; l--) {
      const top = l === PYR_LEVELS - 2;
      this.pass(this.pRecon, this.rec[l], { uG: this.G[l].tex, uGc: this.G[l + 1].tex, uRc: top ? this.G[l + 1].tex : this.rec[l + 1].tex }, (p) => {
        gl.uniform1f(this.u(p, "uTop"), top ? 1 : 0);
        gl.uniform1f(this.u(p, "uResGain"), resGain);
        gl.uniform1f(this.u(p, "uGain"), gains[l] ?? 1);
        gl.uniform1f(this.u(p, "uCoreK"), prof.processing.coring.k);
        gl.uniform1f(this.u(p, "uCoreDepth"), edgeScale > 0 ? Math.min(1, Math.max(0, coreDepth[l] ?? 0)) : 0);
        gl.uniform1f(this.u(p, "uAlpha"), nf.bandAlpha[l] ?? 0);
      });
    }

    // ---- 8. meter / histogram readback ----
    perf.begin("meter");
    this.pass(this.pMeter, this.meter, { uR0: this.rec[0].tex, uG0: this.G[0].tex, uPrim: this.prim.tex }, (p) => {
      gl.uniform1i(this.u(p, "uStride"), meterStride(res));
      gl.uniform1f(this.u(p, "uSpr"), spr);
      gl.uniform1f(this.u(p, "uLodBase"), lodBase);
      gl.uniform1f(this.u(p, "uMaxLod"), maxLod);
    });
    const auto = params.autoWindow !== false;
    if (auto && (this.captureMode || !this.win)) {
      // synchronous: the current frame's histogram sets the current frame's window
      this.readMeterSync(prof, circle, firstOfRun, k, settle);
    } else {
      this.issueReadback(k, settle);
    }
    const win = auto && this.win ? this.win : this.fallbackWindow(params);

    // ---- 9. display: window, LUT, recursion, field ----
    perf.begin("display");
    const prev = this.disp[this.flip];
    const next = this.disp[1 - this.flip];
    const recW = mode === "fluoro" ? prof.temporal.fluoroRecursion : params.recursive;
    this.pass(this.pDisp, next, { uRec: this.rec[0].tex, uPrev: prev.tex, uVel: this.vel.tex, uLut: this.lutTex }, (p) => {
      this.setTone(p, win);
      gl.uniform1f(this.u(p, "uRecW"), Math.min(0.95, Math.max(0, recW)));
      gl.uniform1f(this.u(p, "uMotionC"), prof.temporal.motionC);
      gl.uniform1f(this.u(p, "uNoiseGain"), nf.outputGain);
      gl.uniform1f(this.u(p, "uFirst"), firstOfRun ? 1 : 0);
      gl.uniform1f(this.u(p, "uBladeT"), BLADE_TRANSMISSION);
      gl.uniform1f(this.u(p, "uCircle"), circle ? 1 : 0);
      gl.uniform2f(this.u(p, "uRes"), res, res);
      gl.uniform1f(this.u(p, "uFAmp"), prof.field.amp);
      gl.uniform1f(this.u(p, "uFLam"), prof.field.lambda512);
      gl.uniform1f(this.u(p, "uFPow"), prof.field.power);
      gl.uniform1f(this.u(p, "uFCorner"), circle ? 0 : prof.field.cornerRadius512);
      gl.uniform1f(this.u(p, "uVig"), prof.field.vignette);
    });
    this.flip = 1 - this.flip;
    this.freshTargets = false;

    // ---- 10. present ----
    if (target === "canvas") {
      perf.begin("present");
      this.presentTex(next);
    }
    perf.end();
    perf.frameEnd();
    if (probe) this.probeEnd(probeT0);
  }

  /** Close a frame-time probe and apply the automatic fallback (fitCanvas). */
  private probeEnd(t0: number) {
    const gl = this.gl;
    hardSync(gl, this.syncScratch);
    // cost of a sync with nothing queued, subtracted
    const t1 = performance.now();
    hardSync(gl, this.syncScratch);
    const floor = performance.now() - t1;
    const ms = Math.max(0, t1 - t0 - floor);
    this.lastProbeMs = ms;
    const pol = this.policy;
    if (!pol) return;
    this.overruns = ms > pol.budgetMs ? this.overruns + 1 : 0;
    if (this.overruns >= 2 && this.res > pol.fallbackRes) {
      this.fellBack = true;
      this.resCap = pol.fallbackRes;
      this.overruns = 0;
      this.pendingRes = Math.min(this.resCap, roundUp32(this.presentPx || this.res));
    }
  }

  /** Draw a display target into the canvas: a plain copy at equal size, else a Lanczos-3 resample. */
  private presentTex(src: Target) {
    const gl = this.gl;
    const W = gl.drawingBufferWidth;
    const H = gl.drawingBufferHeight;
    gl.disable(gl.BLEND);
    gl.bindVertexArray(this.vaoQuad);
    if (W === src.w && H === src.h) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.useProgram(this.pBlit);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform1i(this.u(this.pBlit, "uTex"), 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      return;
    }
    if (!this.lzTmp || this.lzTmp.w !== W || this.lzTmp.h !== src.h) {
      if (this.lzTmp) {
        gl.deleteTexture(this.lzTmp.tex);
        gl.deleteFramebuffer(this.lzTmp.fbo);
      }
      this.lzTmp = this.target(W, src.h, { filter: gl.NEAREST });
    }
    const p = this.pLanczos;
    gl.useProgram(p);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(this.u(p, "uSrc"), 0);
    // along x into the intermediate target
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.lzTmp.fbo);
    gl.viewport(0, 0, W, src.h);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.uniform2i(this.u(p, "uDir"), 1, 0);
    gl.uniform1f(this.u(p, "uScale"), src.w / W);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    // along y into the canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.bindTexture(gl.TEXTURE_2D, this.lzTmp.tex);
    gl.uniform2i(this.u(p, "uDir"), 0, 1);
    gl.uniform1f(this.u(p, "uScale"), src.h / H);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /** Draw one full-screen pass into dst with the given textures bound to units 0.. in order. */
  private pass(p: WebGLProgram, dst: Target, tex: Record<string, WebGLTexture>, set: (p: WebGLProgram) => void) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
    gl.viewport(0, 0, dst.w, dst.h);
    gl.useProgram(p);
    let unit = 0;
    for (const [name, t] of Object.entries(tex)) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.uniform1i(this.u(p, name), unit);
      unit++;
    }
    set(p);
    gl.bindVertexArray(this.vaoQuad);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private setTone(p: WebGLProgram, win: WindowState) {
    const gl = this.gl;
    gl.uniform1f(this.u(p, "uPivot"), win.pivot);
    gl.uniform1f(this.u(p, "uXPivot"), win.xPivot);
    gl.uniform1f(this.u(p, "uSlopeA"), (win.slopeBright + win.slopeDark) / 2);
    gl.uniform1f(this.u(p, "uSlopeB"), (win.slopeBright - win.slopeDark) / 2);
    gl.uniform1f(this.u(p, "uEps"), win.eps);
  }

  private ensureLut(prof: SystemProfile): Float32Array {
    const key = JSON.stringify(prof.processing.lut);
    if (key !== this.lutKey) {
      this.lutKey = key;
      this.lut = buildLut(prof.processing.lut, 256);
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.lutTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, 256, 1, 0, gl.RED, gl.FLOAT, this.lut);
    }
    return this.lut;
  }

  private noise(prof: SystemProfile, params: ImageParams, res = this.res): NoiseFactors {
    const edgeScale = Math.max(0, params.edge) / 0.75;
    const drcScale = Math.max(0, params.drc ?? 0.7) / 0.7;
    const gains = gainsAtRes(prof.processing.bandGains, res, REFERENCE_RES).map((g) => Math.max(0, 1 + (g - 1) * edgeScale));
    const resGain = Math.min(1.5, Math.max(0, 1 - (1 - prof.processing.residualGain) * drcScale));
    const sx = prof.detector.mtfSigma512[0] * (res / 512);
    const sy = prof.detector.mtfSigma512[1] * (res / 512);
    const key = [sx, sy, resGain, ...gains].map((v) => v.toFixed(4)).join(",");
    let nf = this.nfCache.get(key);
    if (!nf) {
      nf = noiseFactors(sx, sy, gains, resGain);
      if (this.nfCache.size > 16) this.nfCache.clear();
      this.nfCache.set(key, nf);
    }
    return nf;
  }

  private fallbackWindow(params: ImageParams): WindowState {
    return linearWindow(0.64 * params.window + params.level, Math.max(0.25, params.window));
  }

  private readMeterSync(prof: SystemProfile, circle: boolean, reset: boolean, runFrame: number, settle: number) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.meter.fbo);
    gl.readPixels(0, 0, this.meter.w, this.meter.h, gl.RGBA, gl.FLOAT, this.meterData);
    this.consumeMeter(prof, circle, reset, this.frameNo, runFrame, settle);
  }

  private issueReadback(runFrame: number, settle: number) {
    const gl = this.gl;
    if (this.fence) return; // the previous readback is still in flight
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.meter.fbo);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.pbo);
    gl.readPixels(0, 0, this.meter.w, this.meter.h, gl.RGBA, gl.FLOAT, 0);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    this.fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    this.fenceFrame = this.frameNo;
    this.fenceRunFrame = runFrame;
    this.fenceSettle = settle;
    gl.flush();
  }

  private pollReadback(prof: SystemProfile, circle: boolean, block: boolean) {
    const gl = this.gl;
    if (!this.fence) return;
    const st = gl.clientWaitSync(this.fence, 0, 0);
    if (!block && st !== gl.ALREADY_SIGNALED && st !== gl.CONDITION_SATISFIED) return;
    gl.deleteSync(this.fence);
    this.fence = null;
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, this.pbo);
    gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, this.meterData);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    this.consumeMeter(prof, circle, this.fenceRunFrame === 0, this.fenceFrame, this.fenceRunFrame, this.fenceSettle);
  }

  private consumeMeter(prof: SystemProfile, circle: boolean, reset: boolean, frame: number, runFrame: number, settle: number) {
    const m = this.meter;
    const pct = readbackPercentiles(this.meterData, m.w, m.h, circle);
    if (!pct) return;
    const pw = prof.processing.window;
    const target = solveWindowBand(pct.p5, pct.p50, pct.p95, this.ensureLut(prof), pw, pw.toneRatioMax ?? 1, pw.minWidth ?? 0.25);
    if (!this.win || reset) this.win = target;
    else this.win = lagWindow(this.win, target, 1 - Math.exp(-1 / Math.max(0.01, pw.lagFrames)));
    const reading: MeterReading = {
      frame,
      transmission: this.meterData[3],
      primaryTransmission: this.meterData[7],
      p5: pct.p5,
      p50: pct.p50,
      p95: pct.p95,
      mean: pct.mean,
      openFraction: pct.openFraction,
      window: { ...this.win },
      runFrame,
      settle,
    };
    this.lastMeter = reading;
    const w = this.meterWaiters;
    this.meterWaiters = [];
    for (const f of w) f(reading);
  }

  /**
   * Development and calibration read-back of the last frame's line integrals before the image chain:
   * RGBA float per render pixel, rows bottom-up (R soft tissue and bone, G iodine, B metal, as
   * accumulated; the chain applies the iodine and metal gains later). Synchronous and slow (a full
   * float read-back); never call it in the lab loop.
   */
  readLineIntegrals(): { w: number; h: number; data: Float32Array } | null {
    if (!this.res) return null;
    const gl = this.gl;
    const data = new Float32Array(this.res * this.res * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.acc.fbo);
    gl.readPixels(0, 0, this.res, this.res, gl.RGBA, gl.FLOAT, data);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { w: this.res, h: this.res, data };
  }

  /** Re-present the last frame (last-image hold) without exposing. */
  present() {
    if (!this.res) return;
    this.presentTex(this.disp[this.flip]);
  }

  /** Release GPU resources. The context itself is left alive so a remount can reuse the canvas. */
  dispose() {
    const gl = this.gl;
    for (const p of this.passes) p.dispose?.(gl);
    this.passes = [];
    for (const p of [this.pAnat, this.pBone, this.pTube, this.pPrim, this.pDet, this.pMtf, this.pDown, this.pRecon, this.pMeter, this.pMeter1, this.pDisp, this.pBlit, this.pLanczos]) gl.deleteProgram(p);
    for (const b of [this.quad, this.boneInst, this.cornerBuf, this.tubeBuf, this.tubeIdx, this.pbo]) gl.deleteBuffer(b);
    gl.deleteTexture(this.lutTex);
    if (this.fence) gl.deleteSync(this.fence);
    this.fence = null;
    this.freeTargets();
    this.perf.dispose();
    this.res = 0;
    if (isDev && typeof window !== "undefined") {
      const w = window as unknown as { __xray?: XrayRenderer };
      if (w.__xray === this) delete w.__xray;
    }
  }
}
