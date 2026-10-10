// Frozen copy of the wave-0 renderer (src/render/xray/XrayRenderer.ts at the start of wave 1), used
// by the S4 harness to compare thorax versions on one fixed image chain. Development only.
// ---------------------------------------------------------------------------
// Physically based fluoroscopy renderer (WebGL2).
//
// For every detector pixel the renderer computes the X-ray line integral
// P = Σ μ·L along the ray from the focal spot to that pixel:
//   1. anatomy pass – body, lungs (carved around the heart), mediastinum,
//      liver, stomach gas, trachea and bronchi solved exactly with interval
//      arithmetic per ray;
//   2. bone pass – vertebrae, pedicles, processes, sternum, scapulae as
//      analytic solids, added on top;
//   3. tube pass – ribs, clavicles, iodine-filled vessels, catheter and wire
//      as ribbons whose chord length through a cylinder is exact across the
//      ribbon and corrected for obliquity.
// The image chain then follows a flat-panel system: transmission exp(−P),
// scatter (a heavily blurred fraction of the primary), automatic exposure
// control, Poisson (quantum) noise, log conversion, edge enhancement,
// windowing with dense structures displayed dark, recursive temporal
// filtering (fluoroscopy lag) and the collimated field.
// ---------------------------------------------------------------------------

import type { Vec3 } from "../../../src/types";
import { MAX_ANAT, type AnatShape, type BonePrim, type Shape, type TubeSpec } from "../../../src/render/xray/thorax";
import { CLUTTER_GLSL as CLUTTER_W0 } from "./clutterW0";
import type { AccumulationPass } from "../../../src/render/xray/passes";

export interface XrayCamera {
  src: Vec3;
  detC: Vec3;
  /** detector half-extent vectors (mm) along image right / up */
  detU: Vec3;
  detV: Vec3;
}

export interface ImageParams {
  /** photons per pixel the AEC aims for (fluoro ~300, cine ~2500) */
  counts: number;
  /** recursive filter weight on the previous frame (fluoro 0.5, cine 0.1) */
  recursive: number;
  /** unsharp-mask strength */
  edge: number;
  /** scatter-to-primary ratio */
  spr: number;
  /** iodine and metal effectiveness at the current kV (1 ≈ 75 kV) */
  iodineGain: number;
  metalGain: number;
  /** dynamic range compression strength (0 none … 0.8 strong) */
  drc?: number;
  /** display window width in log units, and brightness offset */
  window: number;
  level: number;
  seed: number;
  field: "circle" | "square";
  /** collimator shutters 0..1 from each edge (left, right, top, bottom) */
  shutters?: [number, number, number, number];
}

export interface XrayScene {
  cam: XrayCamera;
  anat: AnatShape[];
  bones: BonePrim[];
  tubes: TubeSpec[];
  /** inputs for registered extra passes, keyed by pass (see passes.ts) */
  extra?: Record<string, unknown>;
}

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
const MAX_CARVE = 16;
const anatFs = (CLUTTER_GLSL: string) => `${HEADER}
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
  // lungs minus the union of the carve shapes, solved exactly per ray:
  // clip each carve interval to the lung interval, sort by entry, merge, measure
  float lungs = 0.0;
  for (int k = 0; k < ${MAX_ANAT}; k++) {
    if (k >= uCount) break;
    if ((uTF[k].y & 1) == 0) continue;
    vec2 L = iv[k];
    float a = ilen(L);
    if (a <= 0.0) continue;
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
    float aer = max(0.0, a - covered);
    lungs += aer;
    P += uCM[k].w * aer;
  }
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
// S4 harness: the bone shader optionally carries TRABECULAR_GLSL (clutter.ts), exactly as the
// BONE_FS diff for XrayRenderer.ts in docs/realism/wave1/S4.md
const boneFs = (TRAB = "") => `${HEADER}
${CAMERA_GLSL}
${INTERVAL_GLSL}
${TRAB}
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
  float tb = ${TRAB ? "trabecular(uSrc, rd, i, fMu, fMuI)" : "0.0"};
  frag = vec4(fMu * l + tb, fMuI * l, 0.0, 0.0);
}
`;

// --- tubes (ribbons) -------------------------------------------------------
const TUBE_VS = `${HEADER}
in vec2 aPos;
in float aAcross;
in float aChord;
in vec3 aMu;
out float vAcross;
out float vChord;
out vec3 vMu;
void main() {
  vAcross = aAcross;
  vChord = aChord;
  vMu = aMu;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;
const TUBE_FS = `${HEADER}
in float vAcross;
in float vChord;
in vec3 vMu;
out vec4 frag;
void main() {
  float prof = sqrt(max(0.0, 1.0 - vAcross * vAcross));
  frag = vec4(vMu * vChord * prof, 0.0);
}
`;

// --- image chain -----------------------------------------------------------
const QUAD_VS = `${HEADER}
in vec2 aPos;
out vec2 vTex;
void main() { vTex = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;
const TRANS_FS = `${HEADER}
in vec2 vTex;
out vec4 frag;
uniform sampler2D uAcc;
uniform float uIodine, uMetal;
void main() {
  vec4 a = texture(uAcc, vTex);
  float P = a.r + uIodine * a.g + uMetal * a.b;
  frag = vec4(exp(-P), P, 0.0, 1.0);
}
`;
const DISPLAY_FS = `${HEADER}
in vec2 vTex;
out vec4 frag;
uniform sampler2D uTrans;
uniform sampler2D uPrev;
uniform float uCounts, uRecursive, uEdge, uSpr, uWindow, uLevel, uSeed, uMaxLod, uCircle, uDrc;
uniform vec4 uShutters;
uniform vec2 uRes;
float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423) + uSeed);
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}
float gauss(vec2 p) {
  // Box–Muller from two hashes
  float u1 = max(1e-6, hash(p));
  float u2 = hash(p + 17.3);
  return sqrt(-2.0 * log(u1)) * cos(6.2831853 * u2);
}
float vnoise(vec2 p) {
  // slightly correlated noise, like a real detector after its MTF
  vec2 i = floor(p), f = fract(p);
  vec2 w = f * f * (3.0 - 2.0 * f);
  float a = gauss(i), b = gauss(i + vec2(1.0, 0.0)), c = gauss(i + vec2(0.0, 1.0)), d = gauss(i + vec2(1.0, 1.0));
  return mix(mix(a, b, w.x), mix(c, d, w.x), w.y) * 1.25;
}
void main() {
  vec2 uv = vTex;
  float T = textureLod(uTrans, uv, 0.85).r;
  float Ts = textureLod(uTrans, uv, 5.5).r;
  // automatic exposure control meters the central field (where the heart is)
  float lodC = max(0.0, uMaxLod - 4.0);
  float Tref = 0.2 * (textureLod(uTrans, vec2(0.5, 0.5), lodC).r + textureLod(uTrans, vec2(0.38, 0.5), lodC).r +
                      textureLod(uTrans, vec2(0.62, 0.5), lodC).r + textureLod(uTrans, vec2(0.5, 0.38), lodC).r +
                      textureLod(uTrans, vec2(0.5, 0.62), lodC).r);
  float Tdet = T + uSpr * Ts;
  float N0 = uCounts / max(Tref * (1.0 + uSpr), 1e-5);
  float N = N0 * Tdet;
  float Nn = max(1.0, N + sqrt(N) * vnoise(uv * uRes * 0.75));
  float L = -log(Nn / N0);
  // unsharp mask against a blurred, noise-free version
  float Tb = textureLod(uTrans, uv, 2.2).r + uSpr * Ts;
  float Lb = -log(max(Tb, 1e-6));
  float Le = L + uEdge * (L - Lb);
  float ref = -log(max(Tref * (1.0 + uSpr), 1e-6));
  // dynamic range compression (flat-panel "harmonisation"): flatten large-area differences
  // between lung, heart, spine and diaphragm while keeping vessels and edges at full contrast
  float Llow = -log(max(textureLod(uTrans, uv, 5.2).r + uSpr * Ts, 1e-6));
  Le -= uDrc * (Llow - ref);
  float vv = clamp((Le - (ref - uWindow * 0.36) - uLevel) / uWindow, 0.0, 1.0);
  float g = 1.0 - vv;
  g = pow(g, 1.08);
  // temporal recursion
  float prev = texture(uPrev, uv).g;
  g = mix(g, prev, uRecursive);
  // field: circular or square, with collimator shutters
  vec2 c = uv * 2.0 - 1.0;
  float inField = uCircle > 0.5 ? step(length(c), 0.985) : step(max(abs(c.x), abs(c.y)), 0.985);
  inField *= step(uShutters.x, uv.x) * step(uv.x, 1.0 - uShutters.y) * step(uShutters.w, uv.y) * step(uv.y, 1.0 - uShutters.z);
  float vig = 1.0 - 0.10 * dot(c, c);
  frag = vec4(vec3(g * vig * inField), 1.0);
  // keep the un-vignetted value in green for the recursion
  frag.g = g;
}
`;
const BLIT_FS = `${HEADER}
in vec2 vTex;
out vec4 frag;
uniform sampler2D uTex;
void main() { float v = texture(uTex, vTex).r; frag = vec4(v, v, v, 1.0); }
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

interface Target {
  tex: WebGLTexture;
  fbo: WebGLFramebuffer;
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

export class XrayRenderer {
  readonly gl: WebGL2RenderingContext;
  private res = 0;
  private passes: AccumulationPass[] = [];
  private passFrame = 0;

  /** Register an additional additive line-integral pass (see passes.ts). */
  addPass(pass: AccumulationPass) {
    if (!this.passes.some((p) => p.name === pass.name)) this.passes.push(pass);
  }

  removePass(name: string) {
    const p = this.passes.find((x) => x.name === name);
    if (p) p.dispose?.(this.gl);
    this.passes = this.passes.filter((x) => x.name !== name);
  }
  private acc!: Target;
  private trans!: Target;
  private disp: Target[] = [];
  private flip = 0;
  private pAnat: WebGLProgram;
  private pBone: WebGLProgram;
  private pTube: WebGLProgram;
  private pTrans: WebGLProgram;
  private pDisp: WebGLProgram;
  private pBlit: WebGLProgram;
  private quad: WebGLBuffer;
  private vaoQuad: WebGLVertexArrayObject;
  private boneVao: WebGLVertexArrayObject;
  private boneInst: WebGLBuffer;
  private cornerBuf: WebGLBuffer;
  private tubeVao: WebGLVertexArrayObject;
  private tubeBuf: WebGLBuffer;
  private tubeIdx: WebGLBuffer;
  private uniCache = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();

  static create(canvas: HTMLCanvasElement, clutterGlsl: string = CLUTTER_W0, trabecularGlsl = ""): XrayRenderer | null {
    try {
      const gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
      if (!gl) return null;
      if (!gl.getExtension("EXT_color_buffer_float")) return null;
      gl.getExtension("OES_texture_float_linear");
      return new XrayRenderer(gl, clutterGlsl, trabecularGlsl);
    } catch {
      return null;
    }
  }

  private constructor(gl: WebGL2RenderingContext, clutterGlsl: string, trabecularGlsl = "") {
    this.gl = gl;
    this.pAnat = program(gl, ANAT_VS, anatFs(clutterGlsl));
    this.pBone = program(gl, BONE_VS, boneFs(trabecularGlsl));
    this.pTube = program(gl, TUBE_VS, TUBE_FS);
    this.pTrans = program(gl, QUAD_VS, TRANS_FS);
    this.pDisp = program(gl, QUAD_VS, DISPLAY_FS);
    this.pBlit = program(gl, QUAD_VS, BLIT_FS);

    // full-screen triangle pair
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    this.vaoQuad = gl.createVertexArray()!;
    gl.bindVertexArray(this.vaoQuad);
    for (const p of [this.pAnat, this.pTrans, this.pDisp, this.pBlit]) {
      const loc = gl.getAttribLocation(p, "aPos");
      if (loc >= 0) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      }
    }

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
    const ts = 7 * 4;
    const tattrs: [string, number, number][] = [
      ["aPos", 2, 0],
      ["aAcross", 1, 2],
      ["aChord", 1, 3],
      ["aMu", 3, 4],
    ];
    for (const [name, size, off] of tattrs) {
      const loc = gl.getAttribLocation(this.pTube, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, ts, off * 4);
    }
    gl.bindVertexArray(null);
  }

  private u(p: WebGLProgram, name: string) {
    let m = this.uniCache.get(p);
    if (!m) this.uniCache.set(p, (m = new Map()));
    if (!m.has(name)) m.set(name, this.gl.getUniformLocation(p, name));
    return m.get(name)!;
  }

  private target(res: number, mip = false): Target {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    const levels = mip ? Math.floor(Math.log2(res)) + 1 : 1;
    gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA16F, res, res);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo };
  }

  resize(res: number) {
    if (res === this.res) return;
    this.res = res;
    this.acc = this.target(res);
    this.trans = this.target(res, true);
    this.disp = [this.target(res), this.target(res)];
    const gl = this.gl;
    for (const d of this.disp) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, d.fbo);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
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
    const vb = new Float32Array(nv * 7);
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
    const res = this.res;
    if (!res) return;
    gl.viewport(0, 0, res, res);
    gl.disable(gl.DEPTH_TEST);

    // ---- 1. anatomy (writes, no blending) ----
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
    gl.bindVertexArray(this.vaoQuad);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // ---- 2. bones (additive) ----
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
      gl.bindVertexArray(this.boneVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.boneInst);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, scene.bones.length);
    }

    // ---- 3. tubes (additive) ----
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
    if (this.passes.length) {
      this.passFrame++;
      for (const p of this.passes) p.draw({ gl, cam: scene.cam, res, extra: scene.extra ?? {}, frame: this.passFrame });
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.acc.fbo);
      gl.viewport(0, 0, res, res);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
    }
    gl.disable(gl.BLEND);

    // ---- 4. transmission + mipmaps ----
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.trans.fbo);
    gl.useProgram(this.pTrans);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.acc.tex);
    gl.uniform1i(this.u(this.pTrans, "uAcc"), 0);
    gl.uniform1f(this.u(this.pTrans, "uIodine"), params.iodineGain);
    gl.uniform1f(this.u(this.pTrans, "uMetal"), params.metalGain);
    gl.bindVertexArray(this.vaoQuad);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindTexture(gl.TEXTURE_2D, this.trans.tex);
    gl.generateMipmap(gl.TEXTURE_2D);

    // ---- 5. display (with recursion) ----
    const prev = this.disp[this.flip];
    const next = this.disp[1 - this.flip];
    gl.bindFramebuffer(gl.FRAMEBUFFER, next.fbo);
    gl.useProgram(this.pDisp);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.trans.tex);
    gl.uniform1i(this.u(this.pDisp, "uTrans"), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, prev.tex);
    gl.uniform1i(this.u(this.pDisp, "uPrev"), 1);
    gl.uniform1f(this.u(this.pDisp, "uCounts"), params.counts);
    gl.uniform1f(this.u(this.pDisp, "uRecursive"), params.recursive);
    gl.uniform1f(this.u(this.pDisp, "uEdge"), params.edge);
    gl.uniform1f(this.u(this.pDisp, "uSpr"), params.spr);
    gl.uniform1f(this.u(this.pDisp, "uWindow"), params.window);
    gl.uniform1f(this.u(this.pDisp, "uDrc"), params.drc ?? 0.6);
    gl.uniform1f(this.u(this.pDisp, "uLevel"), params.level);
    gl.uniform1f(this.u(this.pDisp, "uSeed"), params.seed % 97.13);
    gl.uniform1f(this.u(this.pDisp, "uMaxLod"), Math.floor(Math.log2(res)));
    gl.uniform1f(this.u(this.pDisp, "uCircle"), params.field === "circle" ? 1 : 0);
    const sh = params.shutters ?? [0, 0, 0, 0];
    gl.uniform4f(this.u(this.pDisp, "uShutters"), sh[0], sh[1], sh[2], sh[3]);
    gl.uniform2f(this.u(this.pDisp, "uRes"), res, res);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    this.flip = 1 - this.flip;

    // ---- 6. present ----
    if (target === "canvas") {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.useProgram(this.pBlit);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, next.tex);
      gl.uniform1i(this.u(this.pBlit, "uTex"), 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  /** Re-present the last frame (last-image hold) without exposing. */
  present() {
    const gl = this.gl;
    if (!this.res) return;
    const last = this.disp[this.flip];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.disable(gl.BLEND);
    gl.useProgram(this.pBlit);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, last.tex);
    gl.uniform1i(this.u(this.pBlit, "uTex"), 0);
    gl.bindVertexArray(this.vaoQuad);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /** Release GPU resources. The context itself is left alive so a remount can reuse the canvas. */
  dispose() {
    const gl = this.gl;
    for (const p of this.passes) p.dispose?.(gl);
    this.passes = [];
    for (const p of [this.pAnat, this.pBone, this.pTube, this.pTrans, this.pDisp, this.pBlit]) gl.deleteProgram(p);
    for (const b of [this.quad, this.boneInst, this.cornerBuf, this.tubeBuf, this.tubeIdx]) gl.deleteBuffer(b);
    for (const t of [this.acc, this.trans, ...this.disp]) {
      if (!t) continue;
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fbo);
    }
    this.res = 0;
  }
}
