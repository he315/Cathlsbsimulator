// ---------------------------------------------------------------------------
// Development timing harness for the X-ray renderer, and the frame-time probe
// used by the renderer's automatic resolution fallback.
//
// Two methods:
//  - "timer-query": each pass is wrapped in an EXT_disjoint_timer_query_webgl2
//    query. Results arrive a few frames later; a disjoint event discards them.
//    Every 8th frame the harness also measures the frame's wall time between two
//    hard syncs, so it can flag timer results that cannot be true (per-pass sum
//    above 1.5 x the frame wall time), as seen on a WebKit/ANGLE-Metal build.
//  - "finish": each pass is bracketed by a hard sync and timed with
//    performance.now(). The sync is a 1-pixel readPixels from the framebuffer
//    that was just drawn: on ANGLE-Metal gl.finish() alone, or a read from the
//    default framebuffer, returns before work queued to offscreen targets has run,
//    which put the whole frame's GPU time on the final blit. A read from the
//    target that was just written must wait for the render pass that writes it,
//    and so for everything queued before it. The cost of a timed section with no
//    real work (clear a 1 x 1 target and sync on it: the "sync floor") is measured
//    every frame and subtracted from each pass; the raw medians are reported too.
//    Serialising the pipeline overstates GPU time (the CPU cost of issuing the
//    pass is included, and on the test machine the GPU clock drops while it idles
//    between syncs, which inflates the first pass of each frame most), so use the
//    table to rank passes and a pipelined throughput loop for the frame total.
//
// Usage (dev): renderer.perf.enable(true, "finish"); render frames;
// renderer.perf.table(). window.__xrayPerf() in the dev build returns the same table.
// ---------------------------------------------------------------------------

interface TimerExt {
  TIME_ELAPSED_EXT: number;
  GPU_DISJOINT_EXT: number;
}

export interface PassTiming {
  pass: string;
  /** median and 90th centile of GPU (or sync-bounded) time, ms; net of the sync floor in "finish" mode */
  medianMs: number;
  p90Ms: number;
  /** raw median before subtracting the sync floor ("finish" mode; equals medianMs otherwise) */
  rawMedianMs: number;
  n: number;
}

export interface PerfReport {
  method: "timer-query" | "finish";
  res: number;
  frames: number;
  passes: PassTiming[];
  /** sum of the per-pass medians (GPU, net of the sync floor) */
  totalGpuMs: number;
  /** median cost of a hard sync with no work queued, ms ("finish" mode) */
  syncFloorMs: number;
  /** median wall time of a whole render() between two hard syncs, ms (0 when not measured) */
  frameWallMs: number;
  /** median CPU time of render() (scene upload, tube build, readback handling), ms */
  cpuMs: number;
  /** extrapolated GPU time on a GPU `slower` times slower */
  budget: (slower: number) => number;
  /** timer results exceed the measured wall time per frame: treat as unreliable */
  timerSuspect: boolean;
}

const median = (a: number[]) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
};
const p90 = (a: number[]) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(s.length * 0.9))];
};

/**
 * Block until the GPU has executed everything issued so far, by reading one pixel of the
 * framebuffer currently bound for drawing (float targets are read as RGBA/FLOAT, the default
 * framebuffer as RGBA/UNSIGNED_BYTE). Bindings are restored. Exported for the renderer's
 * frame-time probe.
 */
export function hardSync(gl: WebGL2RenderingContext, scratch: { f: Float32Array; u: Uint8Array } = { f: new Float32Array(4), u: new Uint8Array(4) }): void {
  const draw = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
  const read = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
  const pack = gl.getParameter(gl.PIXEL_PACK_BUFFER_BINDING) as WebGLBuffer | null;
  if (pack) gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, draw);
  let float = false;
  if (draw) {
    const objType = gl.getFramebufferAttachmentParameter(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE) as number;
    if (objType === gl.NONE) {
      // nothing attached: fall back to the default framebuffer
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    } else {
      float = (gl.getFramebufferAttachmentParameter(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE) as number) === gl.FLOAT;
    }
  }
  if (float) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, scratch.f);
  else gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, scratch.u);
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, read);
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, draw);
  if (pack) gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pack);
}

export class RendererPerf {
  private ext: TimerExt | null;
  private on = false;
  private pending: { name: string; q: WebGLQuery }[] = [];
  private open: { name: string; q: WebGLQuery | null; t0: number } | null = null;
  private samples = new Map<string, number[]>();
  private cpu: number[] = [];
  private wall: number[] = [];
  private extWall: number[] = [];
  private floor: number[] = [];
  private tiny: { fbo: WebGLFramebuffer; tex: WebGLTexture } | null = null;
  private frameT0 = 0;
  private frameWallT0 = -1;
  private frames = 0;
  /** the last end() synced, so the next begin() need not sync again */
  private justSynced = false;
  private scratch = { f: new Float32Array(4), u: new Uint8Array(4) };
  res = 0;
  readonly maxSamples = 240;

  constructor(private gl: WebGL2RenderingContext) {
    this.ext = gl.getExtension("EXT_disjoint_timer_query_webgl2") as TimerExt | null;
  }

  private forceFinish = false;

  get method(): "timer-query" | "finish" {
    return this.ext && !this.forceFinish ? "timer-query" : "finish";
  }

  get enabled() {
    return this.on;
  }

  /**
   * Turn timing on or off. method "finish" forces the hard-sync fallback: some implementations
   * (seen on a WebKit/Metal build) expose the timer extension but return per-pass times that sum
   * to more than the frame's wall time, so the report flags that case (timerSuspect).
   */
  enable(on = true, method?: "timer-query" | "finish") {
    this.on = on;
    this.forceFinish = method === "finish";
    if (!on) this.reset();
  }

  reset() {
    for (const p of this.pending) this.gl.deleteQuery(p.q);
    this.pending = [];
    this.open = null;
    this.samples.clear();
    this.cpu = [];
    this.wall = [];
    this.extWall = [];
    this.floor = [];
    this.frames = 0;
    this.frameWallT0 = -1;
    this.justSynced = false;
  }

  /** Block until the GPU has finished all issued work (see hardSync). */
  sync() {
    hardSync(this.gl, this.scratch);
  }

  private keep(a: number[], v: number) {
    a.push(v);
    if (a.length > this.maxSamples) a.shift();
  }

  frameStart() {
    if (!this.on) return;
    this.collect();
    const finish = this.method === "finish";
    // wall time of the whole frame between hard syncs: every frame in "finish" mode (the passes
    // sync anyway), every 8th frame in timer-query mode (for the plausibility check)
    if (finish || this.frames % 8 === 0) {
      this.sync();
      this.keep(this.floor, this.measureFloor());
      this.frameWallT0 = performance.now();
      this.justSynced = true;
    } else {
      this.frameWallT0 = -1;
      this.justSynced = false;
    }
    this.frameT0 = performance.now();
  }

  /** Record a measured wall time per frame (ms) from outside, for the sanity check. */
  noteWall(ms: number) {
    this.keep(this.extWall, ms);
  }

  /**
   * Overhead of one timed section that does no real work: clear a 1 x 1 target and hard-sync on
   * it. This is the submission and readback round trip that every "finish"-mode pass pays on top
   * of its GPU time (about 0.1-0.4 ms on the test machine), so it is subtracted per pass.
   */
  private measureFloor(): number {
    const gl = this.gl;
    if (!this.tiny) {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 1, 1);
      const fbo = gl.createFramebuffer()!;
      const prev = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, prev);
      this.tiny = { fbo, tex };
    }
    const prev = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING) as WebGLFramebuffer | null;
    const vp = gl.getParameter(gl.VIEWPORT) as Int32Array;
    const cc = gl.getParameter(gl.COLOR_CLEAR_VALUE) as Float32Array;
    const t = performance.now();
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.tiny.fbo);
    gl.viewport(0, 0, 1, 1);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.sync();
    const ms = performance.now() - t;
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, prev);
    gl.viewport(vp[0], vp[1], vp[2], vp[3]);
    gl.clearColor(cc[0], cc[1], cc[2], cc[3]);
    return ms;
  }

  frameEnd() {
    if (!this.on) return;
    if (this.open) this.end();
    this.keep(this.cpu, performance.now() - this.frameT0);
    if (this.frameWallT0 >= 0) {
      if (!this.justSynced) this.sync();
      this.keep(this.wall, performance.now() - this.frameWallT0);
      this.frameWallT0 = -1;
    }
    this.justSynced = false;
    this.frames++;
  }

  /** Start timing a pass (sections must not nest; begin() closes the open one). */
  begin(name: string) {
    if (!this.on) return;
    const gl = this.gl;
    if (this.open) this.end();
    if (this.ext && !this.forceFinish) {
      const q = gl.createQuery();
      if (q) gl.beginQuery(this.ext.TIME_ELAPSED_EXT, q);
      this.open = { name, q, t0: 0 };
      this.justSynced = false;
    } else {
      if (!this.justSynced) this.sync();
      this.open = { name, q: null, t0: performance.now() };
      this.justSynced = false;
    }
  }

  end() {
    if (!this.on || !this.open) return;
    const gl = this.gl;
    const o = this.open;
    this.open = null;
    if (this.ext && o.q) {
      gl.endQuery((this.ext as TimerExt).TIME_ELAPSED_EXT);
      this.pending.push({ name: o.name, q: o.q });
      this.justSynced = false;
    } else {
      this.sync();
      this.push(o.name, performance.now() - o.t0);
      this.justSynced = true;
    }
  }

  private push(name: string, ms: number) {
    let a = this.samples.get(name);
    if (!a) this.samples.set(name, (a = []));
    this.keep(a, ms);
  }

  /** Gather finished timer queries (called at frame start and by report()). */
  collect() {
    if (!this.ext || !this.pending.length) return;
    const gl = this.gl;
    const disjoint = gl.getParameter(this.ext.GPU_DISJOINT_EXT) as boolean;
    const still: typeof this.pending = [];
    for (const p of this.pending) {
      const avail = gl.getQueryParameter(p.q, gl.QUERY_RESULT_AVAILABLE) as boolean;
      if (!avail) {
        still.push(p);
        continue;
      }
      if (!disjoint) this.push(p.name, (gl.getQueryParameter(p.q, gl.QUERY_RESULT) as number) / 1e6);
      gl.deleteQuery(p.q);
    }
    this.pending = still;
  }

  report(): PerfReport {
    this.collect();
    const finish = this.method === "finish";
    const floor = finish ? median(this.floor) : 0;
    const passes: PassTiming[] = [];
    let total = 0;
    for (const [pass, a] of this.samples) {
      const raw = median(a);
      const m = Math.max(0, raw - floor);
      total += m;
      passes.push({ pass, medianMs: +m.toFixed(3), p90Ms: +Math.max(0, p90(a) - floor).toFixed(3), rawMedianMs: +raw.toFixed(3), n: a.length });
    }
    const wall = median(this.wall.length ? this.wall : this.extWall);
    return {
      method: this.method,
      res: this.res,
      frames: this.frames,
      passes,
      totalGpuMs: +total.toFixed(3),
      syncFloorMs: +floor.toFixed(3),
      frameWallMs: +wall.toFixed(3),
      cpuMs: +median(this.cpu).toFixed(3),
      budget: (slower: number) => +(total * slower).toFixed(2),
      timerSuspect: !finish && wall > 0 && total > 1.5 * wall,
    };
  }

  /** Plain-text budget table. */
  table(): string {
    const r = this.report();
    const rows = r.passes.map(
      (p) => `${p.pass.padEnd(14)} ${p.medianMs.toFixed(3).padStart(8)} ${p.p90Ms.toFixed(3).padStart(8)} ${p.rawMedianMs.toFixed(3).padStart(8)} ${String(p.n).padStart(5)}`
    );
    return [
      `X-ray renderer timing (${r.method}, ${r.res}x${r.res}, ${r.frames} frames${r.method === "finish" ? `, sync floor ${r.syncFloorMs.toFixed(3)} ms subtracted` : ""})`,
      `${"pass".padEnd(14)} ${"median".padStart(8)} ${"p90".padStart(8)} ${"raw".padStart(8)} ${"n".padStart(5)}`,
      ...rows,
      `GPU total ${r.totalGpuMs.toFixed(2)} ms; frame wall ${r.frameWallMs.toFixed(2)} ms; render() CPU ${r.cpuMs.toFixed(2)} ms; x4 slower GPU ${r.budget(4)} ms (25 ms allowance, 66.7 ms at 15 fps)`,
      ...(r.timerSuspect ? ['WARNING: timer-query sum exceeds 1.5 x the measured frame wall time; rerun with enable(true, "finish")'] : []),
    ].join("\n");
  }

  dispose() {
    this.reset();
    if (this.tiny) {
      this.gl.deleteFramebuffer(this.tiny.fbo);
      this.gl.deleteTexture(this.tiny.tex);
      this.tiny = null;
    }
  }
}

/**
 * Suggested render resolution for a measured GPU frame time: drop from 1024 to 768 when the
 * frame exceeds the 25 ms per-frame allowance (the renderer must hold 15 frames/s), and to 512
 * when even that is 1.6 x over.
 */
export function recommendResolution(current: number, gpuMs: number, limitMs = 25): number {
  if (gpuMs > limitMs && current > 768) return 768;
  if (gpuMs > limitMs * 1.6 && current > 512) return 512;
  return current;
}
