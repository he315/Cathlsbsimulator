// ---------------------------------------------------------------------------
// The "segments" accumulation pass: exact GPU line integrals through unions
// of round cones (vessels, catheters, wires, devices, shells), plus the
// PSF-consistent thin path for sub-pixel segments.
//
// Input: XrayScene.extra.segments, a SegmentBatch (segmentPack.ts). Each frame
// the pass bins the batch into 16 px tiles on the CPU (tileBinner.ts), uploads
// six textures (seven with host extension lists) and draws one full-screen triangle whose fragment shader
// (segmentGlsl.ts) integrates every pixel's ray over its tile's list. Output
// is added (blend ONE, ONE) into the renderer's accumulation target:
// R bone/soft, G iodine, B metal, A untouched (0).
//
// Optional: screen velocity into a pass-owned RGBA16F texture (MRT attachment
// 1) as (vx w, vy w, w, 0) in pixels per frame, where w is the attenuation
// weight; velocity = rg / b. Needs SegmentBatch.prev and config.velocity.
// With velocityTarget set (the renderer's RG16F buffer) the pass also writes
// rg / b there for the pixels it covers.
// ---------------------------------------------------------------------------

import type { AccumulationPass, PassContext } from "../passes";
import { PREV_FLOATS, SEG_FLOATS, type SegmentBatch } from "./segmentPack";
import { binSegments, type BinStats, type TileBins } from "./tileBinner";
import { withDefaults, type SegmentConfig } from "./config";
import { GRP_TEX_W, IDX_TEX_W, SEG_TEX_W, SEG_VS, segFragmentSource } from "./segmentGlsl";
import { THIN_LUT_H, THIN_LUT_W, buildThinLut } from "./thinLut";

/** Key on XrayScene.extra the pass reads. */
export const SEGMENTS_KEY = "segments";

interface Tex {
  tex: WebGLTexture;
  w: number;
  h: number;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error("segment pass shader: " + (gl.getShaderInfoLog(s) ?? "compile error"));
  return s;
}

export function linkProgram(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  const a = compile(gl, gl.VERTEX_SHADER, vs);
  const b = compile(gl, gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, a);
  gl.attachShader(p, b);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("segment pass link: " + (gl.getProgramInfoLog(p) ?? "link error"));
  gl.deleteShader(a);
  gl.deleteShader(b);
  return p;
}

/** The shared thin-profile LUT texture for a context (R32F, sampled with texelFetch). */
const lutTextures = new WeakMap<WebGL2RenderingContext, WebGLTexture>();
export function thinLutTexture(gl: WebGL2RenderingContext): WebGLTexture {
  let t = lutTextures.get(gl);
  if (t) return t;
  t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, THIN_LUT_W, THIN_LUT_H);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, THIN_LUT_W, THIN_LUT_H, gl.RED, gl.FLOAT, buildThinLut());
  for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST);
  lutTextures.set(gl, t);
  return t;
}

export interface SegmentPassStats extends BinStats {
  /** CPU time of upload and draw submission (ms), excluding binning */
  uploadMs: number;
  /** GPU time of the last measured frame (ms), when timing is enabled and supported */
  gpuMs: number | null;
}

export class SegmentPass implements AccumulationPass {
  readonly name: string;
  cfg: SegmentConfig;
  /** measure GPU time with EXT_disjoint_timer_query_webgl2 (results arrive a few frames late) */
  timing = false;
  /** development: 1 writes (tile count, offset, flags) instead of path integrals */
  debug = 0;
  /**
   * Optional renderer velocity buffer (XrayRenderer.getVelocityTarget(): RG16F, px per frame).
   * When set and velocity is on, the weighted velocity is resolved into it (rg / b where this
   * pass covered the pixel; other pixels are left as they are).
   */
  velocityTarget: (() => { fbo: WebGLFramebuffer; tex: WebGLTexture; res: number } | null) | null = null;
  private resolveProg: WebGLProgram | null = null;
  lastStats: SegmentPassStats | null = null;
  lastBins: TileBins | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private seg: Tex | null = null;
  private prev: Tex | null = null;
  private idx: Tex | null = null;
  private tiles: Tex | null = null;
  private grp: Tex | null = null;
  private hostX: Tex | null = null;
  private dummy: WebGLTexture | null = null;
  private velTex: Tex | null = null;
  private mrt: { fbo: WebGLFramebuffer; acc: WebGLTexture } | null = null;
  private uni = new Map<string, WebGLUniformLocation | null>();
  private reuse: Uint32Array | undefined;
  private timer: { ext: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number }; pending: WebGLQuery[]; last: number | null } | null = null;

  constructor(config?: Partial<SegmentConfig>, name = SEGMENTS_KEY) {
    this.cfg = withDefaults(config);
    this.name = name;
  }

  /** The velocity attachment (RGBA16F, res x res), or null when velocity is off. */
  get velocityTexture(): WebGLTexture | null {
    return this.velTex?.tex ?? null;
  }

  private u(name: string) {
    if (!this.uni.has(name)) this.uni.set(name, this.gl!.getUniformLocation(this.prog!, name));
    return this.uni.get(name)!;
  }

  private init(gl: WebGL2RenderingContext) {
    if (this.gl === gl && this.prog) return;
    this.gl = gl;
    this.prog = linkProgram(gl, SEG_VS, segFragmentSource());
    this.vao = gl.createVertexArray();
    this.uni.clear();
    this.dummy = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.dummy);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, 1, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    // created here, not lazily inside draw(): creating it binds it to the active unit
    thinLutTexture(gl);
    const tq = gl.getExtension("EXT_disjoint_timer_query_webgl2") as { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
    this.timer = tq ? { ext: tq, pending: [], last: null } : null;
  }

  /** (Re)allocate a texture with at least the given rows. */
  private ensure(t: Tex | null, w: number, rows: number, fmt: number): Tex {
    const gl = this.gl!;
    if (t && t.w === w && t.h >= rows) return t;
    if (t) gl.deleteTexture(t.tex);
    let h = 1;
    while (h < rows) h *= 2;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, fmt, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return { tex, w, h };
  }

  /** Upload `texels` texels of `data` (row-major, `comps` per texel) into a W-wide texture. */
  private upload(t: Tex, data: ArrayBufferView & ArrayLike<number>, texels: number, comps: number, format: number, type: number) {
    const gl = this.gl!;
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    const full = Math.floor(texels / t.w);
    const rest = texels - full * t.w;
    const sub = (data as Float32Array | Uint32Array).subarray.bind(data);
    if (full > 0) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, t.w, full, format, type, sub(0, full * t.w * comps) as ArrayBufferView);
    if (rest > 0) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, full, rest, 1, format, type, sub(full * t.w * comps, texels * comps) as ArrayBufferView);
  }

  draw(ctx: PassContext) {
    const batch = ctx.extra[this.name] as SegmentBatch | undefined;
    const gl = ctx.gl;
    if (!batch || batch.count === 0) {
      this.lastStats = null;
      return;
    }
    this.init(gl);
    const res = ctx.res;
    const bins = binSegments(batch, ctx.cam, res, this.cfg, this.reuse);
    this.reuse = bins.index;
    this.lastBins = bins;
    const t0 = performance.now();
    const prevFbo = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    // segment data
    const segTexels = batch.count * (SEG_FLOATS / 4);
    this.seg = this.ensure(this.seg, SEG_TEX_W, Math.ceil(segTexels / SEG_TEX_W), gl.RGBA32F);
    this.upload(this.seg, batch.data, segTexels, 4, gl.RGBA, gl.FLOAT);
    const motion = !!(batch.prev && batch.motion);
    if (motion) {
      const pt = batch.count * (PREV_FLOATS / 4);
      this.prev = this.ensure(this.prev, SEG_TEX_W, Math.ceil(pt / SEG_TEX_W), gl.RGBA32F);
      this.upload(this.prev, batch.prev!, pt, 4, gl.RGBA, gl.FLOAT);
    }
    // host extension lists (rare: segments overlapping several members of a vessel family)
    const hx = batch.hostExtra;
    if (hx && hx.length >= 4) {
      const texels = Math.floor(hx.length / 4);
      this.hostX = this.ensure(this.hostX, SEG_TEX_W, Math.ceil(texels / SEG_TEX_W), gl.RGBA32F);
      this.upload(this.hostX, hx, texels, 4, gl.RGBA, gl.FLOAT);
    }
    // groups
    const G = batch.groups.length;
    const gd = new Float32Array(Math.max(1, Math.ceil(G / GRP_TEX_W)) * GRP_TEX_W * 4);
    batch.groups.forEach((g, i) => gd.set([g.mu[0], g.mu[1], g.mu[2], isFinite(g.featureMm) ? g.featureMm : 1e30], i * 4));
    this.grp = this.ensure(this.grp, GRP_TEX_W, Math.ceil(Math.max(1, G) / GRP_TEX_W), gl.RGBA32F);
    this.upload(this.grp, gd, Math.max(1, G), 4, gl.RGBA, gl.FLOAT);
    // tiles and index
    if (!this.tiles || this.tiles.w !== bins.tilesX || this.tiles.h !== bins.tilesY) {
      if (this.tiles) gl.deleteTexture(this.tiles.tex);
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RG32UI, bins.tilesX, bins.tilesY);
      // integer and float textures are incomplete under the default mipmap filter
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      this.tiles = { tex, w: bins.tilesX, h: bins.tilesY };
    }
    gl.bindTexture(gl.TEXTURE_2D, this.tiles.tex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, bins.tilesX, bins.tilesY, gl.RG_INTEGER, gl.UNSIGNED_INT, bins.header);
    const entries = Math.max(1, bins.stats.entries);
    this.idx = this.ensure(this.idx, IDX_TEX_W, Math.ceil(entries / IDX_TEX_W), gl.R32UI);
    if (bins.stats.entries > 0) this.upload(this.idx, bins.index, bins.stats.entries, 1, gl.RED_INTEGER, gl.UNSIGNED_INT);

    // velocity: draw into [acc, velocity] through our own framebuffer
    const wantVel = this.cfg.velocity && motion;
    if (wantVel) this.bindMrt(gl, res, prevFbo);

    // draw
    const p = this.prog!;
    gl.useProgram(p);
    const ci = bins.cam;
    gl.uniform3fv(this.u("uSrc"), ci.src);
    gl.uniform3fv(this.u("uDetC"), ci.detC);
    gl.uniform3fv(this.u("uDetU"), ci.detU);
    gl.uniform3fv(this.u("uDetV"), ci.detV);
    gl.uniform3fv(this.u("uN"), ci.n);
    gl.uniform1f(this.u("uSid"), ci.sid);
    gl.uniform1f(this.u("uMmPx"), ci.mmPerPx);
    gl.uniform1f(this.u("uRes"), res);
    gl.uniform1i(this.u("uTile"), bins.tile);
    gl.uniform1f(this.u("uThinLo"), this.cfg.thinLoPx);
    gl.uniform1f(this.u("uThinHi"), this.cfg.thinHiPx);
    gl.uniform1f(this.u("uSigmaAaPx"), this.cfg.psf.sigmaAaPx);
    gl.uniform1f(this.u("uFocalSigmaMm"), this.cfg.psf.focalSigmaMm);
    gl.uniform1f(this.u("uExtraPx"), this.cfg.psf.extraPx);
    gl.uniform1i(this.u("uMotion"), motion ? 1 : 0);
    gl.uniform1f(this.u("uMotionScale"), motion ? batch.motion!.pulseS / Math.max(1e-6, batch.motion!.dtS) : 0);
    const gains = batch.gains ?? [1, 1, 1];
    gl.uniform3f(this.u("uGains"), gains[0], gains[1], gains[2]);
    gl.uniform1i(this.u("uTransAvg"), this.cfg.transmissionAverage ? 1 : 0);
    gl.uniform1i(this.u("uVelocity"), wantVel ? 1 : 0);
    gl.uniform1i(this.u("uDebug"), this.debug);
    gl.uniform1f(this.u("uSsFeaturePx"), this.cfg.ssFeaturePx);
    gl.uniform1f(this.u("uSsMinContrast"), this.cfg.ssMinContrast);
    gl.uniform1f(this.u("uBackfillSlope"), this.cfg.backfillSlope);
    gl.uniform1f(this.u("uSsMotionPx"), this.cfg.ssMotionPx);
    gl.uniform1i(this.u("uSegCount"), batch.count);
    const bind = (unit: number, name: string, tex: WebGLTexture) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(this.u(name), unit);
    };
    bind(0, "uTiles", this.tiles.tex);
    bind(1, "uIndex", this.idx.tex);
    bind(2, "uSeg", this.seg.tex);
    bind(3, "uPrev", motion ? this.prev!.tex : this.dummy!);
    bind(4, "uGroup", this.grp.tex);
    bind(5, "uThinLut", thinLutTexture(gl));
    bind(6, "uHostX", hx && hx.length >= 4 && this.hostX ? this.hostX.tex : this.dummy!);
    gl.bindVertexArray(this.vao);
    gl.viewport(0, 0, res, res);
    let q: WebGLQuery | null = null;
    if (this.timing && this.timer && this.timer.pending.length < 4) {
      q = gl.createQuery();
      gl.beginQuery(this.timer.ext.TIME_ELAPSED_EXT, q!);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (q && this.timer) {
      gl.endQuery(this.timer.ext.TIME_ELAPSED_EXT);
      this.timer.pending.push(q);
    }
    this.pollTimer(gl);
    gl.bindVertexArray(null);
    gl.activeTexture(gl.TEXTURE0);
    if (wantVel) {
      const vt = this.velocityTarget?.();
      if (vt && vt.res === res && this.velTex) this.resolveVelocity(gl, vt.fbo, res);
      gl.bindFramebuffer(gl.FRAMEBUFFER, prevFbo);
    }
    this.lastStats = { ...bins.stats, uploadMs: performance.now() - t0, gpuMs: this.timer?.last ?? null };
  }

  private pollTimer(gl: WebGL2RenderingContext) {
    const t = this.timer;
    if (!t || !t.pending.length) return;
    const q = t.pending[0];
    if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) return;
    const disjoint = gl.getParameter(t.ext.GPU_DISJOINT_EXT);
    const ns = gl.getQueryParameter(q, gl.QUERY_RESULT) as number;
    if (!disjoint) t.last = ns / 1e6;
    gl.deleteQuery(q);
    t.pending.shift();
  }

  /** Write rg / b of the weighted velocity into the renderer's velocity target (no blending). */
  private resolveVelocity(gl: WebGL2RenderingContext, fbo: WebGLFramebuffer, res: number) {
    if (!this.resolveProg) {
      this.resolveProg = linkProgram(
        gl,
        SEG_VS,
        `#version 300 es
precision highp float;
uniform sampler2D uVel;
out vec4 frag;
void main() {
  vec4 v = texelFetch(uVel, ivec2(gl_FragCoord.xy), 0);
  if (v.b <= 1e-6) discard;
  frag = vec4(v.rg / v.b, 0.0, 0.0);
}
`
      );
    }
    const blend = gl.isEnabled(gl.BLEND);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, res, res);
    gl.useProgram(this.resolveProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.velTex!.tex);
    gl.uniform1i(gl.getUniformLocation(this.resolveProg, "uVel"), 0);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    if (blend) gl.enable(gl.BLEND);
  }

  private bindMrt(gl: WebGL2RenderingContext, res: number, accFbo: WebGLFramebuffer | null) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, accFbo);
    const acc = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME) as WebGLTexture | null;
    if (!acc) return;
    if (!this.velTex || this.velTex.w !== res) {
      if (this.velTex) gl.deleteTexture(this.velTex.tex);
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, res, res);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      this.velTex = { tex, w: res, h: res };
      if (this.mrt) {
        gl.deleteFramebuffer(this.mrt.fbo);
        this.mrt = null;
      }
    }
    if (!this.mrt || this.mrt.acc !== acc) {
      if (this.mrt) gl.deleteFramebuffer(this.mrt.fbo);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, acc, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.velTex.tex, 0);
      this.mrt = { fbo, acc };
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.mrt.fbo);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]);
  }

  dispose(gl: WebGL2RenderingContext) {
    if (this.prog) gl.deleteProgram(this.prog);
    if (this.resolveProg) gl.deleteProgram(this.resolveProg);
    this.resolveProg = null;
    if (this.vao) gl.deleteVertexArray(this.vao);
    for (const t of [this.seg, this.prev, this.idx, this.tiles, this.grp, this.velTex, this.hostX]) if (t) gl.deleteTexture(t.tex);
    if (this.dummy) gl.deleteTexture(this.dummy);
    if (this.mrt) gl.deleteFramebuffer(this.mrt.fbo);
    this.prog = null;
    this.vao = null;
    this.seg = this.prev = this.idx = this.tiles = this.grp = this.velTex = this.hostX = null;
    this.mrt = null;
    this.gl = null;
  }
}

/** Convenience: `renderer.addPass(createSegmentPass())`. */
export function createSegmentPass(config?: Partial<SegmentConfig>): SegmentPass {
  return new SegmentPass(config);
}
