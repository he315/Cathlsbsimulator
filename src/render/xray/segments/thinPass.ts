// ---------------------------------------------------------------------------
// The "thin" accumulation pass: sub-pixel primitives (stent struts, marker
// bands, wire coils, sternal wires, clips, ECG leads) drawn as camera-facing
// quads whose fragments evaluate the PSF-consistent thin profile (thinLut.ts):
// the cylinder chord convolved with the PSF across, erf windows along, so
// each primitive adds exactly mu c pi r^2 L to the image integral, with no
// beading at any sub-pixel position or orientation.
//
// Thin primitives add; they are not united with each other or with segments
// (use the segment pass for solids that must not double count).
//
// Input: XrayScene.extra.thin, a ThinBatch (or ThinPrim[]).
// ---------------------------------------------------------------------------

import type { AccumulationPass, PassContext } from "../passes";
import type { Vec3 } from "../../../types";
import { THIN_GLSL, DEFAULT_PSF, type PsfParams } from "./thinLut";
import { camInfo } from "./config";
import { linkProgram, thinLutTexture } from "./segmentPass";

export const THIN_KEY = "thin";

export interface ThinPrim {
  p0: Vec3;
  p1: Vec3;
  /** radius, mm */
  r: number;
  /** attenuation per mm: R bone/soft, G iodine, B metal */
  mu: [number, number, number];
  /** extra blur in pixels (unresolved motion), default 0 */
  blurPx?: number;
}

/** Packed primitives: 12 floats each (p0.xyz, r, p1.xyz, blurPx, mu.rgb, 0). */
export interface ThinBatch {
  count: number;
  data: Float32Array;
}

export const THIN_FLOATS = 12;

export function packThin(prims: ThinPrim[]): ThinBatch {
  const d = new Float32Array(Math.max(1, prims.length) * THIN_FLOATS);
  prims.forEach((p, i) => {
    d.set([p.p0.x, p.p0.y, p.p0.z, p.r, p.p1.x, p.p1.y, p.p1.z, p.blurPx ?? 0, p.mu[0], p.mu[1], p.mu[2], 0], i * THIN_FLOATS);
  });
  return { count: prims.length, data: d };
}

const HEADER = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
`;

const UNIFORMS = `
uniform vec3 uSrc;
uniform vec3 uDetC;
uniform vec3 uDetU;
uniform vec3 uDetV;
uniform vec3 uN;
uniform float uSid;
uniform float uMmPx;
uniform float uRes;
uniform float uSigmaAaPx;
uniform float uFocalSigmaMm;
uniform float uExtraPx;
uniform sampler2D uThinLut;
`;

const THIN_VS = `${HEADER}
${UNIFORMS}
${THIN_GLSL}
in vec2 aCorner;
in vec4 iA;   // p0, r
in vec4 iB;   // p1, blurPx
in vec4 iM;   // mu
flat out vec4 fA;
flat out vec4 fB;
flat out vec3 fMu;
flat out float fSigO;
vec3 proj(vec3 p) {
  vec3 d = p - uSrc;
  float al = max(dot(d, uN), 1.0);
  float mag = uSid / al;
  vec3 q = d * mag - (uDetC - uSrc);
  return vec3((vec2(dot(q, uDetU) / dot(uDetU, uDetU), dot(q, uDetV) / dot(uDetV, uDetV)) + 1.0) * 0.5 * uRes, al);
}
void main() {
  vec3 a = proj(iA.xyz), b = proj(iB.xyz);
  float al = 0.5 * (a.z + b.z);
  float mag = uSid / al;
  float sg = sqrt(thinSigmaPx(al) * thinSigmaPx(al) + iB.w * iB.w);
  float rpx = iA.w * mag / uMmPx;
  // quad: the projected axis extended by the radius plus 4 sigma plus a pixel on every side
  float e = rpx + 4.0 * sg + 1.0;
  vec2 ax = b.xy - a.xy;
  float l = length(ax);
  vec2 t = l > 1e-4 ? ax / l : vec2(1.0, 0.0);
  vec2 n = vec2(-t.y, t.x);
  vec2 c = 0.5 * (a.xy + b.xy);
  vec2 p = c + t * (0.5 * l + e) * aCorner.x + n * e * aCorner.y;
  gl_Position = vec4(p / uRes * 2.0 - 1.0, 0.0, 1.0);
  fA = iA;
  fB = iB;
  fMu = iM.xyz;
  fSigO = sg * uMmPx / mag;
}
`;

const THIN_FS = `${HEADER}
${UNIFORMS}
${THIN_GLSL}
flat in vec4 fA;
flat in vec4 fB;
flat in vec3 fMu;
flat in float fSigO;
out vec4 frag;
void main() {
  vec2 uv = gl_FragCoord.xy / uRes * 2.0 - 1.0;
  vec3 d = normalize(uDetC + uv.x * uDetU + uv.y * uDetV - uSrc);
  vec3 p0 = fA.xyz;
  vec3 b = fB.xyz - p0;
  float L = length(b);
  vec3 mid = p0 + 0.5 * b;
  float tc = dot(mid - uSrc, d);
  vec3 w = uSrc + tc * d - p0;
  float v = 0.0;
  if (L > 1e-6) {
    vec3 a = b / L;
    float bb = dot(d, a);
    float sin2 = max(1.0 - bb * bb, 1e-4);
    float wa = dot(w, a), wd = dot(w, d);
    float t = (bb * wa - wd) / sin2;
    float s = (wa - bb * wd) / sin2;
    float dp = length(w + t * d - s * a);
    float sinT = sqrt(sin2);
    float r = fA.w;
    float h = thinLookup(dp / fSigO, r / fSigO);
    float prof = 3.14159265 * r * r / fSigO * h;
    float q = sinT / (1.41421356 * fSigO);
    v = prof / sinT * 0.5 * (erfA(s * q) - erfA((s - L) * q));
  } else {
    // a point-like bead: a blurred sphere, integral 4/3 pi r^3
    float dp = length(w);
    float r = fA.w;
    v = 4.18879 * r * r * r / (6.2831853 * fSigO * fSigO) * exp(-0.5 * dp * dp / (fSigO * fSigO));
  }
  frag = vec4(fMu * v, 0.0);
}
`;

export class ThinPass implements AccumulationPass {
  readonly name: string;
  psf: PsfParams;
  private gl: WebGL2RenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private corner: WebGLBuffer | null = null;
  private inst: WebGLBuffer | null = null;
  private uni = new Map<string, WebGLUniformLocation | null>();

  constructor(psf: Partial<PsfParams> = {}, name = THIN_KEY) {
    this.psf = { ...DEFAULT_PSF, ...psf };
    this.name = name;
  }

  private u(n: string) {
    if (!this.uni.has(n)) this.uni.set(n, this.gl!.getUniformLocation(this.prog!, n));
    return this.uni.get(n)!;
  }

  private init(gl: WebGL2RenderingContext) {
    if (this.gl === gl && this.prog) return;
    this.gl = gl;
    this.prog = linkProgram(gl, THIN_VS, THIN_FS);
    this.uni.clear();
    thinLutTexture(gl);
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    this.corner = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.corner);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const cl = gl.getAttribLocation(this.prog, "aCorner");
    gl.enableVertexAttribArray(cl);
    gl.vertexAttribPointer(cl, 2, gl.FLOAT, false, 0, 0);
    this.inst = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.inst);
    const names: [string, number][] = [
      ["iA", 0],
      ["iB", 4],
      ["iM", 8],
    ];
    for (const [n, off] of names) {
      const loc = gl.getAttribLocation(this.prog, n);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, THIN_FLOATS * 4, off * 4);
      gl.vertexAttribDivisor(loc, 1);
    }
    gl.bindVertexArray(null);
  }

  draw(ctx: PassContext) {
    const raw = ctx.extra[this.name] as ThinBatch | ThinPrim[] | undefined;
    if (!raw) return;
    const batch = Array.isArray(raw) ? packThin(raw) : raw;
    if (!batch.count) return;
    const gl = ctx.gl;
    this.init(gl);
    const ci = camInfo(ctx.cam, ctx.res);
    gl.useProgram(this.prog);
    gl.uniform3fv(this.u("uSrc"), ci.src);
    gl.uniform3fv(this.u("uDetC"), ci.detC);
    gl.uniform3fv(this.u("uDetU"), ci.detU);
    gl.uniform3fv(this.u("uDetV"), ci.detV);
    gl.uniform3fv(this.u("uN"), ci.n);
    gl.uniform1f(this.u("uSid"), ci.sid);
    gl.uniform1f(this.u("uMmPx"), ci.mmPerPx);
    gl.uniform1f(this.u("uRes"), ctx.res);
    gl.uniform1f(this.u("uSigmaAaPx"), this.psf.sigmaAaPx);
    gl.uniform1f(this.u("uFocalSigmaMm"), this.psf.focalSigmaMm);
    gl.uniform1f(this.u("uExtraPx"), this.psf.extraPx);
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, thinLutTexture(gl));
    gl.uniform1i(this.u("uThinLut"), 5);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.inst);
    gl.bufferData(gl.ARRAY_BUFFER, batch.data.subarray(0, batch.count * THIN_FLOATS), gl.DYNAMIC_DRAW);
    gl.viewport(0, 0, ctx.res, ctx.res);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, batch.count);
    gl.bindVertexArray(null);
  }

  dispose(gl: WebGL2RenderingContext) {
    if (this.prog) gl.deleteProgram(this.prog);
    if (this.vao) gl.deleteVertexArray(this.vao);
    if (this.corner) gl.deleteBuffer(this.corner);
    if (this.inst) gl.deleteBuffer(this.inst);
    this.prog = null;
    this.gl = null;
  }
}

export function createThinPass(psf?: Partial<PsfParams>): ThinPass {
  return new ThinPass(psf);
}
