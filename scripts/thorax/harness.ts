// ---------------------------------------------------------------------------
// S4 thorax harness (development only, served by the Vite dev server at
// /scripts/thorax/harness.html). Renders pre-contrast frames through the real
// scene builder and a renderer, with the thorax either as the app builds it
// today, as it was at the start of wave 1, or with the S4 integration
// emulated (seeded genome, segment pass, clutter uniforms, hardware); measures
// them with metrics.ts and can POST captures to /__capture for the Python
// scripts. Nothing here is imported by the app.
//
// Console API (window.__s4):
//   await __s4.measure({ tag, chain, thorax, seed, views, save, ... })
//   __s4.timing(view, opts, n)   -> CPU / GPU cost per frame
// chain:  "cur" = src/render/xray/XrayRenderer.ts as it is now (changes while
//         the image-chain stream works); "w0" = frozen wave-0 renderer copy.
// thorax: "app" = sceneBuilder's scene unchanged; "w0" = the wave-0 thorax and
//         clutter (w0 chain only); "s4" = S4 thorax with segments and uniforms.
// ---------------------------------------------------------------------------

import { buildAnatomy } from "../../src/simulation/anatomy";
import { CASE_LIBRARY } from "../../src/simulation/caseGenerator";
import { buildCoronaryTree } from "../../src/render/xray/coronaryTree";
import { buildXrayScene } from "../../src/render/xray/sceneBuilder";
import { XrayRenderer } from "../../src/render/xray/XrayRenderer";
import * as TH from "../../src/render/xray/thorax";
import * as CL from "../../src/render/xray/clutter";
import * as HW from "../../src/render/xray/hardware";
import * as HS from "../../src/render/xray/heartShape";
import { XrayRenderer as XrayRendererW0 } from "./w0/XrayRendererW0";
import { buildThorax as buildThoraxW0 } from "./w0/thoraxW0";
import { allMetrics, toLib512, type BackgroundMetrics } from "./metrics";

/* eslint-disable @typescript-eslint/no-explicit-any */
const RES = 768;
const logEl = document.getElementById("log")!;
const log = (s: string) => {
  logEl.textContent += s + "\n";
};

type Chain = "cur" | "w0";
type ThoraxMode = "app" | "w0" | "s4";
interface R {
  xr: any;
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  pass: boolean;
}
const renderers = new Map<string, R>();
function getR(chain: Chain, thorax: ThoraxMode, trab = false): R {
  const key = chain === "cur" ? "cur" : thorax === "w0" ? "w0old" : trab ? "w0newT" : "w0new";
  let r = renderers.get(key);
  if (!r) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = RES;
    document.getElementById("cv")!.appendChild(canvas);
    const xr: any =
      chain === "cur" ? XrayRenderer.create(canvas) : key === "w0old" ? XrayRendererW0.create(canvas) : XrayRendererW0.create(canvas, CL.CLUTTER_GLSL, key === "w0newT" ? CL.TRABECULAR_GLSL : "");
    if (!xr) throw new Error("renderer " + key);
    xr.resize(RES);
    r = { xr, gl: xr.gl, canvas, pass: false };
    renderers.set(key, r);
  }
  return r;
}

const c = CASE_LIBRARY[0];
const model = buildAnatomy(c);
const tree = buildCoronaryTree(model, c);

export const VIEWS: Record<string, { lao: number; cran: number; side: "left" | "right" }> = {
  // medians of the library's view families (critique item 26)
  RAO_CRA: { lao: -26, cran: 23, side: "left" },
  RAO_CAU: { lao: -18, cran: -15, side: "left" },
  LAO_CRA: { lao: 20, cran: 21, side: "left" },
  LAO_CAU: { lao: 25, cran: -26, side: "left" },
  AP_CRA: { lao: 1, cran: 29, side: "left" },
  RCA_LAO: { lao: 25, cran: -1, side: "right" },
};

export interface Opts {
  chain?: Chain;
  thorax?: ThoraxMode;
  seed?: number;
  t?: number;
  frame?: number;
  hold?: number | null;
  cine?: boolean;
  hardware?: HW.HardwareSpec | null;
  clutterGain?: number;
  softGain?: number;
  tilt?: number;
  /** S4 thorax without the clutter uniforms (the clutter's fallback path) */
  noLungUniforms?: boolean;
  /** S4 thorax drawn through the legacy tube path instead of the segment pass */
  legacyTubes?: boolean;
  cArm?: { laoRao: number; cranialCaudal: number };
  /** w0 chain only: bone pass with TRABECULAR_GLSL (the BONE_FS diff in S4.md) */
  trab?: boolean;
  /** S4 segments without the sub-pixel widening of thin vessels (thin-line investigation) */
  noSubWiden?: boolean;
  /** S4 thorax with the heart-shape stream's fitted silhouette merged by name */
  heartShapes?: boolean;
  /** overrides merged into the image parameters (e.g. { window: 1.2 }) */
  tune?: Record<string, number>;
}

let lastThorax: any = null;

function scene(viewName: string, o: Opts) {
  const v = VIEWS[viewName];
  const chain = o.chain ?? "cur";
  const thorax = o.thorax ?? "app";
  const R = getR(chain, thorax, !!o.trab);
  const root = [{ x: 0, y: 54, z: 0 }, { x: 8, y: 30, z: -4 }, v.side === "left" ? model.lm.pos : model.rca.pos];
  const r = buildXrayScene({
    model,
    caseData: c,
    tree,
    catheterRoot: root,
    french: 6,
    wire: null,
    bolus: null,
    t: o.t ?? 0,
    cArm: o.cArm ?? { laoRao: v.lao, cranialCaudal: v.cran },
    field: 230,
    centreOn: v.side,
    mode: o.cine === false ? "fluoro" : "cine",
    breathHold: o.hold === undefined ? 0.7 : o.hold,
    frame: o.frame ?? 1,
  });
  const H = tree.heart;
  const heartShift = { x: 0, y: -0.85 * TH.DIAPHRAGM_DESCENT * r.resp, z: 3 * r.resp };
  if (thorax !== "app") {
    // replace sceneBuilder's thorax (the first tubes and bones, and the anatomy shapes)
    const legacy = TH.buildThorax({ resp: r.resp, heart: H, heartShift });
    const th: any =
      thorax === "w0"
        ? buildThoraxW0({ resp: r.resp, heart: H, heartShift })
        : TH.buildThorax({
            resp: r.resp,
            heart: H,
            heartShift,
            seed: o.seed ?? 1,
            contraction: r.contraction,
            segments: !o.legacyTubes,
            hardware: o.hardware ?? null,
            heartShapes: o.heartShapes ? HS.heartShapes(H, { contraction: r.contraction }).map((sh) => ({ ...sh, c: { x: sh.c.x + heartShift.x, y: sh.c.y + heartShift.y, z: sh.c.z + heartShift.z } })) : undefined,
          });
    lastThorax = th;
    r.scene.anat = th.anat;
    r.scene.tubes = [...th.tubes, ...r.scene.tubes.slice(legacy.tubes.length)];
    r.scene.bones = [...th.bones, ...r.scene.bones.slice(legacy.bones.length)];
    if (th.segments) {
      if (!R.pass) {
        R.xr.addPass(new CL.ThoraxSegmentPass());
        R.pass = true;
      }
      let segs = th.segments;
      if (o.noSubWiden) {
        const d = segs.stat.data.slice();
        for (let i = 0; i < segs.stat.count; i++) d[i * TH.SEG_FLOATS + 19] = 0;
        segs = { ...segs, stat: { ...segs.stat, data: d, key: segs.stat.key + ":nosub" } };
      }
      r.scene.extra = { ...(r.scene.extra ?? {}), [CL.THORAX_SEGMENTS_KEY]: segs };
    }
  }
  // clutter uniforms (the renderer does not set them yet): set on its anatomy program directly
  if (!(chain === "w0" && thorax === "w0")) {
    const prog = R.xr.pAnat as WebGLProgram;
    R.gl.useProgram(prog);
    const st =
      thorax === "s4" && !o.noLungUniforms
        ? { ...CL.clutterStateFromAnat(r.scene.anat, lastThorax?.clutterSeed ?? 0), gain: o.clutterGain ?? 0, softGain: o.softGain ?? 0, tilt: o.tilt ?? 0 }
        : null;
    CL.applyClutterUniforms(R.gl, (n: string) => R.gl.getUniformLocation(prog, n), st);
  }
  if (o.tune) Object.assign(r.params, o.tune);
  return { ...r, R };
}

function readGrey(R: R): Float32Array {
  const gl = R.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const px = new Uint8Array(RES * RES * 4);
  gl.readPixels(0, 0, RES, RES, gl.RGBA, gl.UNSIGNED_BYTE, px);
  const g = new Float32Array(RES * RES);
  for (let y = 0; y < RES; y++) for (let x = 0; x < RES; x++) g[y * RES + x] = px[((RES - 1 - y) * RES + x) * 4];
  return g;
}

/** Render a settled frame (recursive filter, auto-window) and return it top-down at 768 px. */
export function render(viewName: string, o: Opts = {}): { g: Float32Array; R: R } {
  const f0 = o.frame ?? 1;
  let R: R | null = null;
  for (let k = 0; k < 10; k++) {
    const s = scene(viewName, { ...o, frame: f0 + k });
    R = s.R;
    s.R.xr.render(s.scene, s.params);
  }
  return { g: readGrey(R!), R: R! };
}

async function save(R: R, name: string) {
  const blob: Blob = await new Promise((res) => R.canvas.toBlob((b) => res(b!), "image/png"));
  const r = await fetch(`/__capture/${name}.png`, { method: "POST", body: blob });
  if (!r.ok) throw new Error("capture failed " + r.status);
}

export async function measure(a: { tag?: string; views?: string[]; save?: boolean } & Opts = {}) {
  const out: Record<string, BackgroundMetrics> = {};
  for (const v of a.views ?? Object.keys(VIEWS)) {
    const { g, R } = render(v, a);
    if (a.save) await save(R, `s4_${a.tag ?? "x"}_${v}`);
    out[v] = allMetrics(toLib512(g, RES));
    log(`${a.tag ?? ""} ${v} ${JSON.stringify(out[v])}`);
  }
  return out;
}

/** CPU (scene build incl. thorax) and GPU (render) cost per frame, medians over n frames. */
export function timing(viewName = "RAO_CAU", o: Opts = {}, n = 20) {
  const R = getR(o.chain ?? "cur", o.thorax ?? "app", !!o.trab);
  const gl = R.gl;
  const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2") as any;
  const cpu: number[] = [],
    gpu: number[] = [],
    wall: number[] = [];
  const queries: WebGLQuery[] = [];
  for (let k = 0; k < n; k++) {
    const t0 = performance.now();
    const s = scene(viewName, { ...o, frame: k + 1, t: k / 15, hold: null });
    const t1 = performance.now();
    let q: WebGLQuery | null = null;
    if (ext) {
      q = gl.createQuery()!;
      gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
    }
    R.xr.render(s.scene, s.params);
    if (ext && q) {
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      queries.push(q);
    }
    const px = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    cpu.push(t1 - t0);
    wall.push(performance.now() - t0);
  }
  const med = (a: number[]) => (a.length ? [...a].sort((p, q) => p - q)[Math.floor(a.length / 2)] : NaN);
  return new Promise((resolve) => {
    setTimeout(() => {
      for (const q of queries) {
        if (gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) gpu.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
        gl.deleteQuery(q);
      }
      const r = { sceneCpuMs: med(cpu), gpuMs: med(gpu), wallMs: med(wall), gpuSamples: gpu.length };
      log(`timing ${viewName} ${JSON.stringify(o)} ${JSON.stringify(r)}`);
      resolve(r);
    }, 400);
  });
}

/** Render the accumulated line integral (R channel) of a filtered scene as a capture, for debugging. */
export async function dumpAcc(viewName: string, name: string, o: Opts, filter: (s: any) => any) {
  const s = scene(viewName, o);
  const gl = s.R.gl;
  s.R.xr.render(filter(s.scene), s.params);
  gl.bindFramebuffer(gl.FRAMEBUFFER, s.R.xr.acc.fbo);
  const px = new Float32Array(RES * RES * 4);
  gl.readPixels(0, 0, RES, RES, gl.RGBA, gl.FLOAT, px);
  const vals: number[] = [];
  for (let i = 0; i < RES * RES; i += 7) vals.push(px[i * 4]);
  vals.sort((a, b) => a - b);
  const p99 = vals[Math.floor(vals.length * 0.995)] || 1e-6;
  const cv = document.createElement("canvas");
  cv.width = cv.height = RES;
  const ctx = cv.getContext("2d")!;
  const id = ctx.createImageData(RES, RES);
  for (let y = 0; y < RES; y++)
    for (let x = 0; x < RES; x++) {
      const val = px[((RES - 1 - y) * RES + x) * 4];
      const g = 255 - Math.min(255, (255 * val) / p99);
      const k = (y * RES + x) * 4;
      id.data[k] = id.data[k + 1] = id.data[k + 2] = g;
      id.data[k + 3] = 255;
    }
  ctx.putImageData(id, 0, 0);
  const blob: Blob = await new Promise((res) => cv.toBlob((b) => res(b!), "image/png"));
  await fetch(`/__capture/${name}.png`, { method: "POST", body: blob });
  return { p99 };
}

(window as any).__s4 = { measure, render, timing, save, dumpAcc, VIEWS, scene, last: () => lastThorax, TH, CL, HW, getR };
log("ready");

// Accept hot updates here so edits elsewhere in the tree (other streams work concurrently) do not
// reload the page in the middle of a measurement; a running measurement keeps its module instances.
if (import.meta.hot) import.meta.hot.accept(() => {});
