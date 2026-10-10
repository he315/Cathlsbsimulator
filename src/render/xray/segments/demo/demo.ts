// ---------------------------------------------------------------------------
// Development-only A/B page for the segment integrator (stream S2b).
// Served by the dev server at /src/render/xray/segments/demo/index.html.
//
// It builds the PCI-lab scene exactly as AngioPci does (scenario, wire,
// balloon or stent, catheter, contrast bolus), then renders it twice:
//   A  the current renderer (CPU ribbon tubes),
//   B  the same scene with every tube moved onto the "segments" pass.
// It shows the difference, checks the GPU pass against the CPU reference
// integrator on sampled pixels, times both paths and posts PNG captures to
// POST /__capture/<name>.png. Everything is scriptable through window.__s2b.
// ---------------------------------------------------------------------------

import "../../../../styles/index.css";
import { buildAnatomy } from "../../../../simulation/anatomy";
import { buildCoronaryTree } from "../../coronaryTree";
import { buildXrayScene } from "../../sceneBuilder";
import { XrayRenderer, type ImageParams, type XrayScene } from "../../XrayRenderer";
import { catheterById } from "../../../../data/catheters";
import { viewById } from "../../../../data/viewPresets";
import { catheterPath } from "../../../../ui/sim/helpers";
import { pciDevices } from "../../../../ui/sections/AngioPci";
import {
  PCI_SCENARIOS,
  initialPci,
  moveWire,
  loadDevice,
  moveDevice,
  inflate,
  deflate,
  removeDevice,
  lumenFor,
  pciGeom,
  scenarioCase,
  type PciState,
} from "../../../../simulation/angioPci";
import type { VesselId } from "../../../../types";
import type { TubeSpec } from "../types";
import { tubesToSegments, type SegmentBatch } from "../segmentPack";
import { SegmentPass } from "../segmentPass";
import { camInfo, rayThroughPixel, withDefaults } from "../config";
import { buildThinLut, thinSigmaPx } from "../thinLut";
import { integratePixel, integrateRay, thinValue, type RayContext } from "../integrator";
import { ThinPass, packThin, type ThinPrim } from "../thinPass";

const RES = 768;

export interface DemoOptions {
  scenario: string;
  view: string;
  /** seconds into a cine bolus; null = fluoroscopy without contrast */
  bt: number | null;
  /** devices: wire only, wire + balloon on the lesion, or a deployed stent with the wire */
  devices: "wire" | "balloon" | "stent" | "none";
  /** model time (s): sets the heart phase */
  t: number;
  /** very high counts: removes quantum noise so A and B differ only in geometry */
  noiseFree: boolean;
  /** intra-pulse motion blur from the previous frame's positions (segments only) */
  motion: boolean;
  /** detector field, cm */
  field: number;
  /**
   * Which tubes B moves onto the segment pass: all of them, or only those with iodine or metal
   * (vessels, catheter, wires, devices); the thorax (ribs, cartilage, lung vessels, calcium)
   * then stays on ribbons, as when the thorax stream draws it on its own pass.
   */
  scope: "all" | "vessels";
}

const DEFAULTS: DemoOptions = { scenario: "lad-focal", view: "raocranial", bt: 2.2, devices: "stent", t: 0.35, noiseFree: true, motion: false, field: 20, scope: "all" };

/** Tube carries iodine or metal (any sample)? */
const isVesselOrDevice = (t: TubeSpec) => {
  const per = Array.isArray(t.mu[0]);
  const list = per ? (t.mu as [number, number, number][]) : [t.mu as [number, number, number]];
  return list.some((m) => m[1] !== 0 || m[2] !== 0);
};

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
const app = document.getElementById("app")!;
app.innerHTML = `
<div class="p-4 space-y-3 text-[13px]">
  <div class="panel p-3">
    <div class="panel-head">Segment integrator A/B</div>
    <p class="text-ink-soft mt-1">A is the current ribbon renderer. B moves every tube onto the analytic segment pass. Development page; not part of the app.</p>
    <div class="flex flex-wrap gap-2 items-center mt-2">
      <select id="scn" class="field"></select>
      <select id="view" class="field"></select>
      <select id="dev" class="field">
        <option value="none">no devices</option><option value="wire">wire</option><option value="balloon">wire and balloon</option><option value="stent" selected>stent deployed</option>
      </select>
      <label class="text-ink-soft">bolus s <input id="bt" class="field w-20" value="2.2" /></label>
      <label class="text-ink-soft">time s <input id="t" class="field w-20" value="0.35" /></label>
      <label class="text-ink-soft"><input id="nf" type="checkbox" checked /> noise-free</label>
      <label class="text-ink-soft"><input id="mo" type="checkbox" /> motion blur</label>
      <button id="go" class="btn btn-accent">Render</button>
      <button id="chk" class="btn">GPU vs CPU</button>
      <button id="perf" class="btn">Timing</button>
      <button id="cap" class="btn">Capture</button>
    </div>
  </div>
  <div class="grid gap-3" style="grid-template-columns: repeat(3, minmax(0, 1fr));">
    <div class="panel p-2"><div class="panel-head">A: ribbons</div><canvas id="ca" width="${RES}" height="${RES}" style="width:100%"></canvas></div>
    <div class="panel p-2"><div class="panel-head">B: segments</div><canvas id="cb" width="${RES}" height="${RES}" style="width:100%"></canvas></div>
    <div class="panel p-2"><div class="panel-head">|A - B| x 4</div><canvas id="cd" width="${RES}" height="${RES}" style="width:100%"></canvas></div>
  </div>
  <pre id="out" class="panel p-3 font-mono text-[12px] whitespace-pre-wrap text-ink-soft"></pre>
</div>`;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const out = $("out");
const log = (o: unknown) => (out.textContent = typeof o === "string" ? o : JSON.stringify(o, null, 2));
for (const s of PCI_SCENARIOS) $("scn").insertAdjacentHTML("beforeend", `<option value="${s.id}">${s.title}</option>`);
for (const id of ["raocranial", "laocranial", "apcranial", "raocaudal", "spider", "rcalao", "rcarao", "rcacranial", "ap", "lao30", "rao30"]) {
  const v = viewById(id);
  if (v) $("view").insertAdjacentHTML("beforeend", `<option value="${id}">${v.name}</option>`);
}

/** One segment's contribution along a ray (CPU reference). */
function integrateRayOne(batch: SegmentBatch, i: number, o: ArrayLike<number>, d: ArrayLike<number>, ctx: RayContext) {
  return integrateRay(batch, [i], 0, 1, o, d, d, ctx).P;
}

// ---------------------------------------------------------------------------
// Scene construction (mirrors AngioPci's draw)
// ---------------------------------------------------------------------------
function buildScene(o: DemoOptions, tOffset = 0): { scene: XrayScene; params: ImageParams } {
  const s = PCI_SCENARIOS.find((x) => x.id === o.scenario) ?? PCI_SCENARIOS[0];
  const c = scenarioCase(s);
  const model = buildAnatomy(c);
  const refTree = buildCoronaryTree(model, { ...c, lesions: [] });
  const baseTree = buildCoronaryTree(model, c);
  const g = pciGeom(s, baseTree, refTree);
  let st: PciState = initialPci(s);
  if (o.devices !== "none") {
    for (let k = 0; k < 400; k++) {
      const n = moveWire(s, g, st, 2);
      if (n.tipMm <= st.tipMm + 0.01) break;
      st = n;
    }
  }
  if (o.devices === "balloon" || o.devices === "stent") {
    st = loadDevice(st, o.devices === "stent" ? "stent" : "balloon", "semi-compliant", 3.0, 15);
    for (let k = 0; k < 400 && st.device && st.device.centreMm < g.lesion.centreMm; k++) st = moveDevice(st, 1);
    if (o.devices === "stent") {
      st = inflate(s, g, st, 12);
      st = deflate(st);
      st = removeDevice(st);
    }
  }
  const lumen = lumenFor(s, g, st);
  const tree = buildCoronaryTree(model, { ...c, lesions: lumen.lesions }, lumen.scaffolds);
  const cath = catheterById(s.guide);
  const os = s.side === "left" ? model.lm : model.rca;
  const tip = { pos: os.pos, dir: os.dir, height: os.height, az: os.az, radius: model.sinusRadius, cram: 0, gap: 0 };
  const root = catheterPath(model, tip, cath);
  const filled = [...new Set(tree.vessels.filter((v) => v.side === s.side).map((v) => v.fillId))] as VesselId[];
  const view = viewById(o.view) ?? viewById(s.views[0])!;
  const cine = o.bt !== null;
  const { scene, params } = buildXrayScene({
    model,
    caseData: { accessRoute: "radial-right", lesions: [{ vessel: s.target.vessel, position: s.target.position, severity: st.severity, kind: s.target.kind, lengthMm: s.target.lengthMm }], dominance: "right" },
    tree,
    catheterRoot: root,
    french: 6,
    wire: null,
    bolus: cine ? { filled, plume: "none", side: s.side, t: o.bt! + tOffset, injectDur: 1.8, peak: 1 } : null,
    catheter2: null,
    t: o.t + tOffset,
    cArm: view.cArm,
    field: o.field * 10,
    centreOn: s.side,
    mode: cine ? "cine" : "fluoro",
    breathHold: cine ? 0.7 : null,
    frame: 7,
    flowScale: 1,
    extras: (place, ctx) => pciDevices(s, st, g, tree, place, ctx, 10),
  });
  if (o.noiseFree) params.counts = 4e7;
  return { scene, params };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
const ca = $<HTMLCanvasElement>("ca"),
  cb = $<HTMLCanvasElement>("cb"),
  cd = $<HTMLCanvasElement>("cd");
const xa = XrayRenderer.create(ca)!;
const xb = XrayRenderer.create(cb)!;
xa.resize(RES);
xb.resize(RES);
const pass = new SegmentPass();
pass.timing = true;
xb.addPass(pass);

let last: { opts: DemoOptions; scene: XrayScene; params: ImageParams; batch: SegmentBatch } | null = null;

function toSegments(o: DemoOptions, scene: XrayScene, params: ImageParams, topologyFrom: SegmentBatch | null = null): { sceneB: XrayScene; batch: SegmentBatch; convertMs: number } {
  const keep = (t: TubeSpec) => o.scope === "vessels" && !isVesselOrDevice(t);
  const moved = scene.tubes.filter((t) => !keep(t));
  const kept = scene.tubes.filter(keep);
  const t0 = performance.now();
  let prevTubes = null;
  if (o.motion) prevTubes = buildScene(o, -1 / 15).scene.tubes.filter((t) => !keep(t));
  const batch = tubesToSegments(moved, {
    prevTubes,
    // pulse width 8 ms: MODEL PARAMETER until the dose stream supplies it (plan S2b task 4)
    motion: o.motion ? { dtS: 1 / 15, pulseS: 0.008 } : null,
    gains: [1, params.iodineGain, params.metalGain],
    topologyFrom,
  });
  const convertMs = performance.now() - t0;
  return { sceneB: { ...scene, tubes: kept, extra: { ...(scene.extra ?? {}), segments: batch } }, batch, convertMs };
}

function diffImages() {
  const w = RES;
  const a = document.createElement("canvas"),
    b = document.createElement("canvas");
  a.width = b.width = w;
  a.height = b.height = w;
  const ga = a.getContext("2d")!,
    gb = b.getContext("2d")!;
  ga.drawImage(ca, 0, 0);
  gb.drawImage(cb, 0, 0);
  const A = ga.getImageData(0, 0, w, w).data,
    B = gb.getImageData(0, 0, w, w).data;
  const gd = cd.getContext("2d")!;
  const D = gd.createImageData(w, w);
  let sum = 0,
    max = 0,
    over8 = 0;
  for (let i = 0; i < A.length; i += 4) {
    const d = Math.abs(A[i] - B[i]);
    sum += d;
    if (d > max) max = d;
    if (d > 8) over8++;
    const v = Math.min(255, d * 4);
    D.data[i] = D.data[i + 1] = D.data[i + 2] = v;
    D.data[i + 3] = 255;
  }
  gd.putImageData(D, 0, 0);
  return { meanAbsDiff: +(sum / (w * w)).toFixed(3), maxAbsDiff: max, pixelsOver8Levels: over8 };
}

function render(opts: Partial<DemoOptions> = {}) {
  const o: DemoOptions = { ...DEFAULTS, ...opts };
  const tb = performance.now();
  const { scene, params } = buildScene(o);
  const buildMs = performance.now() - tb;
  // A: ribbons (time the renderer's CPU side with a finish)
  const gla = xa.gl;
  gla.finish();
  const t0 = performance.now();
  xa.render(scene, params);
  gla.finish();
  const aMs = performance.now() - t0;
  // B: segments
  const { sceneB, batch, convertMs } = toSegments(o, scene, params);
  const glb = xb.gl;
  glb.finish();
  const t1 = performance.now();
  xb.render(sceneB, params);
  glb.finish();
  const bMs = performance.now() - t1;
  last = { opts: o, scene, params, batch };
  const st = pass.lastStats;
  const r = {
    opts: o,
    tubes: scene.tubes.length,
    segments: batch.count,
    groups: batch.groups.length,
    unresolvedOverlaps: batch.unresolvedOverlaps ?? null,
    hostExtTexels: batch.hostExtra ? batch.hostExtra.length / 4 : 0,
    sceneBuildMs: +buildMs.toFixed(2),
    convertMs: +convertMs.toFixed(2),
    binMs: st ? +st.ms.toFixed(2) : null,
    uploadMs: st ? +st.uploadMs.toFixed(2) : null,
    renderA_ms_finish: +aMs.toFixed(2),
    renderB_ms_finish: +bMs.toFixed(2),
    gpuSegmentsMs: st?.gpuMs ?? null,
    bins: st ? { onScreen: st.onScreen, entries: st.entries, coveredTiles: st.coveredTiles, meanPerCoveredTile: +st.meanPerCoveredTile.toFixed(1), p95PerTile: st.p95PerTile, maxPerTile: st.maxPerTile, ssTiles: st.ssTiles, motionTiles: st.motionTiles, dropped: st.dropped } : null,
    diff: diffImages(),
  };
  log(r);
  return r;
}

/**
 * One offscreen WebGL2 context for every GPU-only check: browsers cap live contexts (about 16)
 * and drop the oldest, which would be the two display canvases.
 */
let offGl: WebGL2RenderingContext | null = null;
function offscreenGl(): WebGL2RenderingContext {
  if (offGl && !offGl.isContextLost()) return offGl;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 4;
  const gl = cv.getContext("webgl2");
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) throw new Error("WebGL2 with EXT_color_buffer_float is needed");
  offGl = gl;
  return gl;
}

/** Build the scene and its segment batch without rendering (for the GPU-only checks). */
function prepare(opts: Partial<DemoOptions> = {}) {
  const o: DemoOptions = { ...DEFAULTS, ...opts };
  const { scene, params } = buildScene(o);
  const { batch, convertMs } = toSegments(o, scene, params);
  last = { opts: o, scene, params, batch };
  return { segments: batch.count, tubes: scene.tubes.length, convertMs: +convertMs.toFixed(2) };
}

/** Render the current scene's segments alone into a float target and compare with the CPU reference. */
function gpuCheck(samples = 3000, cfg: Partial<import("../config").SegmentConfig> = {}, only?: { batch: SegmentBatch; cam: XrayScene["cam"] }) {
  if (!only && !last) prepare();
  const batch = only ? only.batch : last!.batch;
  const scene = only ? { cam: only.cam } : last!.scene;
  const gl = offscreenGl();
  gl.getExtension("EXT_float_blend");
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, RES, RES);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.viewport(0, 0, RES, RES);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  // no blending needed for a single pass into a cleared target
  const p = new SegmentPass(cfg);
  p.draw({ gl, cam: scene.cam, res: RES, extra: { segments: batch }, frame: 1 });
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  const px = new Float32Array(RES * RES * 4);
  gl.readPixels(0, 0, RES, RES, gl.RGBA, gl.FLOAT, px);
  const bins = p.lastBins!;
  const ctx = { ci: camInfo(scene.cam, RES), cfg: withDefaults(cfg), lut: buildThinLut() };
  // sample pixels in covered tiles, preferring non-zero output
  let n = 0,
    maxAbs = 0,
    sumAbs = 0,
    maxRel = 0,
    peak = 0,
    over1pct = 0;
  let seed = 12345;
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
  const worst: unknown[] = [];
  for (let k = 0; k < samples * 20 && n < samples; k++) {
    const x = Math.floor(rnd() * RES),
      y = Math.floor(rnd() * RES);
    const t = Math.floor(y / bins.tile) * bins.tilesX + Math.floor(x / bins.tile);
    if ((bins.header[t * 2 + 1] & 0xffffff) === 0) continue;
    const gpu = [px[(y * RES + x) * 4], px[(y * RES + x) * 4 + 1], px[(y * RES + x) * 4 + 2]];
    const cpu = integratePixel(batch, bins, x, y, ctx);
    const tot = Math.abs(cpu[0]) + Math.abs(cpu[1]) + Math.abs(cpu[2]);
    if (tot < 1e-4 && rnd() < 0.8) continue;
    n++;
    const err = Math.abs(gpu[0] - cpu[0]) + Math.abs(gpu[1] - cpu[1]) + Math.abs(gpu[2] - cpu[2]);
    peak = Math.max(peak, tot);
    sumAbs += err;
    if (err > maxAbs) {
      maxAbs = err;
      worst.unshift({ x, y, gpu, cpu });
      worst.length = Math.min(worst.length, 3);
    }
    if (tot > 0.05) {
      const rel = err / tot;
      maxRel = Math.max(maxRel, rel);
      if (rel > 0.01) over1pct++;
    }
  }
  p.dispose(gl);
  gl.deleteFramebuffer(fbo);
  gl.deleteTexture(tex);
  const r = { sampled: n, segments: batch.count, hostExtTexels: batch.hostExtra ? batch.hostExtra.length / 4 : 0, peakIntegral: +peak.toFixed(4), meanAbsErr: +(sumAbs / Math.max(1, n)).toExponential(2), maxAbsErr: +maxAbs.toExponential(2), maxRelErrAbove005: +maxRel.toExponential(2), samplesOver1pct: over1pct, worst };
  log(r);
  return r;
}

/**
 * GPU against CPU on a synthetic family whose segments need host ranges and extension lists:
 * a parent with a fan of children that all cross one late child (which then names several
 * tubes), around the scene's iso centre.
 */
function extCheck(samples = 3000) {
  const cam = last ? last.scene.cam : buildScene(DEFAULTS).scene.cam;
  const ci = camInfo(cam, RES);
  const iso = [ci.src[0] + ci.n[0] * 760, ci.src[1] + ci.n[1] * 760, ci.src[2] + ci.n[2] * 760];
  const U = ci.detU.map((x) => x / Math.hypot(...ci.detU)),
    W = ci.detV.map((x) => x / Math.hypot(...ci.detV));
  const P = (a: number, b: number, c = 0) => ({ x: iso[0] + U[0] * a + W[0] * b + ci.n[0] * c, y: iso[1] + U[1] * a + W[1] * b + ci.n[1] * c, z: iso[2] + U[2] * a + W[2] * b + ci.n[2] * c });
  const tubes: TubeSpec[] = [{ pts: Array.from({ length: 41 }, (_, i) => P(-20 + i, -12, 0)), r: Array(41).fill(1.4), mu: [0, 0.25, 0] }];
  const parentOf: ({ tube: number; at: number } | null)[] = [null];
  // five children leaving upwards and converging on one point (each later one overlaps all the
  // earlier ones there: extension lists), and one late child crossing through that point
  for (let k = 0; k < 5; k++) {
    const x0 = -16 + 5 * k;
    tubes.push({ pts: Array.from({ length: 22 }, (_, i) => P(x0 + ((0 - x0) * i) / 18, -12 + i, 0.15 * k)), r: Array(22).fill(0.8), mu: [0, 0.25, 0] });
    parentOf.push({ tube: 0, at: x0 + 20 });
  }
  tubes.push({ pts: Array.from({ length: 30 }, (_, i) => P(14 - 1.0 * i, -12 + 0.75 * i, 0.3)), r: Array(30).fill(0.9), mu: [0, 0.25, 0] });
  parentOf.push({ tube: 0, at: 34 });
  const batch = tubesToSegments(tubes, { parentOf: (_t, i) => parentOf[i] });
  const r = gpuCheck(samples, {}, { batch, cam });
  const out = { ...r, unresolvedOverlaps: batch.unresolvedOverlaps };
  log(out);
  return out;
}

/**
 * Velocity buffer against a CPU reference: at sampled pixels, the attenuation-weighted screen
 * velocity of the segments the pixel-centre ray crosses (weights from the CPU integrator per
 * segment). Pixels the shader sub-samples use one sub-sample for the segments it redoes, so the
 * two differ there by the sub-sample's offset; they must not jump (the earlier shader dropped
 * the other segments at those pixels).
 */
function velCheck(samples = 1500) {
  const o: DemoOptions = { ...(last?.opts ?? DEFAULTS), motion: true, t: 0.12 };
  const { scene, params } = buildScene(o);
  const { batch } = toSegments(o, scene, params);
  const gl = offscreenGl();
  gl.getExtension("EXT_float_blend");
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, RES, RES);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.viewport(0, 0, RES, RES);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  const p = new SegmentPass({ velocity: true });
  p.draw({ gl, cam: scene.cam, res: RES, extra: { segments: batch }, frame: 1 });
  const vfbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, vfbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, p.velocityTexture!, 0);
  const vel = new Float32Array(RES * RES * 4);
  gl.readPixels(0, 0, RES, RES, gl.RGBA, gl.FLOAT, vel);
  const bins = p.lastBins!;
  const ci = camInfo(scene.cam, RES);
  const ctx = { ci, cfg: withDefaults({ velocity: true }), lut: buildThinLut() };
  const proj = (x: number, y: number, z: number) => {
    const dx = x - ci.src[0],
      dy = y - ci.src[1],
      dz = z - ci.src[2];
    const mag = ci.sid / Math.max(1, dx * ci.n[0] + dy * ci.n[1] + dz * ci.n[2]);
    return [((mag * (dx * ci.pu[0] + dy * ci.pu[1] + dz * ci.pu[2]) - ci.ku + 1) / 2) * RES, ((mag * (dx * ci.pv[0] + dy * ci.pv[1] + dz * ci.pv[2]) - ci.kv + 1) / 2) * RES];
  };
  const D = batch.data,
    Q = batch.prev!;
  const errs = { plain: [] as number[], sub: [] as number[] };
  const speeds: number[] = [];
  let seed = 99;
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
  for (let k = 0; k < samples * 40 && errs.plain.length + errs.sub.length < samples; k++) {
    const x = Math.floor(rnd() * RES),
      y = Math.floor(rnd() * RES);
    const t = Math.floor(y / bins.tile) * bins.tilesX + Math.floor(x / bins.tile);
    const off = bins.header[t * 2],
      cnt = bins.header[t * 2 + 1] & 0xffffff,
      flags = bins.header[t * 2 + 1] >>> 24;
    if (!cnt) continue;
    const g = vel.subarray((y * RES + x) * 4, (y * RES + x) * 4 + 4);
    if (g[2] <= 1e-6) continue;
    const d = rayThroughPixel(ci, x + 0.5, y + 0.5, [0, 0, 0]);
    let sx = 0,
      sy = 0,
      sw = 0;
    for (let e = 0; e < cnt; e++) {
      const i = bins.index[off + e];
      const Pi = integrateRayOne(batch, i, ci.src, d, ctx);
      const w = Math.abs(Pi[0]) + Math.abs(Pi[1]) + Math.abs(Pi[2]);
      if (w <= 0) continue;
      const o24 = i * 24,
        q8 = i * 8;
      const a = proj(0.5 * (D[o24] + D[o24 + 4]), 0.5 * (D[o24 + 1] + D[o24 + 5]), 0.5 * (D[o24 + 2] + D[o24 + 6]));
      const b = proj(0.5 * (Q[q8] + Q[q8 + 4]), 0.5 * (Q[q8 + 1] + Q[q8 + 5]), 0.5 * (Q[q8 + 2] + Q[q8 + 6]));
      sx += (a[0] - b[0]) * w;
      sy += (a[1] - b[1]) * w;
      sw += w;
    }
    if (sw <= 1e-6) continue;
    const err = Math.hypot(g[0] / g[2] - sx / sw, g[1] / g[2] - sy / sw);
    (flags ? errs.sub : errs.plain).push(err);
    speeds.push(Math.hypot(sx / sw, sy / sw));
  }
  p.dispose(gl);
  gl.deleteFramebuffer(fbo);
  gl.deleteFramebuffer(vfbo);
  gl.deleteTexture(tex);
  const q = (a: number[], f: number) => (a.length ? +[...a].sort((u, v) => u - v)[Math.min(a.length - 1, Math.floor(a.length * f))].toFixed(3) : null);
  const r = {
    medianMovingSpeedPxPerFrame: q(speeds.filter((x) => x > 0.1), 0.5),
    plainPixels: errs.plain.length,
    plainMedianPx: q(errs.plain, 0.5),
    plainP95Px: q(errs.plain, 0.95),
    flaggedTilePixels: errs.sub.length,
    flaggedMedianPx: q(errs.sub, 0.5),
    flaggedP95Px: q(errs.sub, 0.95),
    flaggedP99Px: q(errs.sub, 0.99),
  };
  log(r);
  return r;
}

/** Time n renders of B (GPU time from the timer query when available) and A. */
async function perf(n = 30) {
  if (!last) prepare();
  const { scene, params, opts } = last!;
  const { sceneB } = toSegments(opts, scene, params);
  const gpu: number[] = [];
  const cpuB: number[] = [];
  const cpuA: number[] = [];
  const bin: number[] = [];
  const conv: number[] = [];
  const convReuse: number[] = [];
  let prevBatch: SegmentBatch | null = null;
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    xa.render(scene, params, null);
    cpuA.push(performance.now() - t0);
    const t1 = performance.now();
    const b = toSegments(opts, scene, params).batch;
    conv.push(performance.now() - t1);
    const t1b = performance.now();
    prevBatch = toSegments(opts, scene, params, prevBatch).batch;
    convReuse.push(performance.now() - t1b);
    const t2 = performance.now();
    xb.render({ ...sceneB, extra: { segments: b } }, params, null);
    cpuB.push(performance.now() - t2);
    if (pass.lastStats) bin.push(pass.lastStats.ms);
    await new Promise((r) => setTimeout(r, 30));
    if (pass.lastStats?.gpuMs != null) gpu.push(pass.lastStats.gpuMs);
  }
  // segments pass alone, GPU, by finish timing (fallback when no timer query)
  const glb = xb.gl;
  const fin: number[] = [];
  for (let i = 0; i < 10; i++) {
    const px = new Uint8Array(4);
    const sync = () => glb.readPixels(0, 0, 1, 1, glb.RGBA, glb.UNSIGNED_BYTE, px);
    sync();
    const t = performance.now();
    xb.render(sceneB, params);
    sync();
    const withSeg = performance.now() - t;
    const t2 = performance.now();
    xb.render({ ...sceneB, extra: {} }, params);
    sync();
    fin.push(withSeg - (performance.now() - t2));
  }
  const med = (a: number[]) => (a.length ? +[...a].sort((x, y) => x - y)[Math.floor(a.length / 2)].toFixed(3) : null);
  const r = {
    segments: last!.batch.count,
    ribbonRenderCpuMs: med(cpuA),
    tubesToSegmentsMs: med(conv),
    tubesToSegmentsReuseMs: med(convReuse),
    binMs: med(bin),
    segmentRenderCpuMs: med(cpuB),
    segmentPassGpuMs_timer: med(gpu),
    segmentFrameDeltaMs_readback: med(fin),
    timerQuery: !!xb.gl.getExtension("EXT_disjoint_timer_query_webgl2"),
  };
  log(r);
  return r;
}

/**
 * GPU cost of the segment pass alone, in its own context: each iteration draws once and waits
 * with finish(); the CPU part (binning, upload, submission) is timed without the wait and
 * subtracted. Returns medians in ms.
 */
function benchGpu(n = 30, res = RES, cfg: Partial<import("../config").SegmentConfig> = {}, debug = 0) {
  if (!last) prepare();
  const { scene, batch } = last!;
  const gl = offscreenGl();
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, res, res);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  const p = new SegmentPass(cfg);
  p.debug = debug;
  const ctx = { gl, cam: scene.cam, res, extra: { segments: batch }, frame: 1 };
  // finish() does not block in Chrome; a one-pixel readPixels does
  const one = new Float32Array(4);
  const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, one);
  p.draw(ctx);
  sync();
  const tot: number[] = [],
    cpu: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    for (let k = 0; k < 5; k++) p.draw(ctx);
    const t1 = performance.now();
    sync();
    const t2 = performance.now();
    cpu.push((t1 - t0) / 5);
    tot.push((t2 - t0) / 5);
  }
  // an empty frame's round trip, to remove the sync overhead itself
  const idle: number[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = performance.now();
    gl.clear(gl.COLOR_BUFFER_BIT);
    sync();
    idle.push((performance.now() - t0) / 5);
  }
  const med = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const st = p.lastStats!;
  // (cleanup of the shared context follows the statistics)
  // per-pixel statistics of the debug output (mode 2: surviving segments per pixel)
  let dbgMean = 0,
    dbgMax = 0,
    dbgFrac = 0;
  if (debug) {
    const all = new Float32Array(res * res * 4);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);
    p.draw(ctx);
    gl.readPixels(0, 0, res, res, gl.RGBA, gl.FLOAT, all);
    let cov = 0;
    for (let i = 0; i < res * res; i++) {
      const v = all[i * 4];
      if (v > 0) cov++;
      dbgMean += v;
      dbgMax = Math.max(dbgMax, v);
    }
    dbgMean /= Math.max(1, cov);
    const tl = p.lastBins?.tile ?? 16;
    dbgFrac = cov / Math.max(1, st.coveredTiles * tl * tl);
  }
  p.dispose(gl);
  gl.disable(gl.BLEND);
  gl.deleteFramebuffer(fbo);
  gl.deleteTexture(tex);
  const r = {
    res,
    segments: batch.count,
    entries: st.entries,
    ssTiles: st.ssTiles,
    coveredTiles: st.coveredTiles,
    cpuMs: +med(cpu).toFixed(3),
    totalMs: +med(tot).toFixed(3),
    finishOverheadMs: +med(idle).toFixed(3),
    gpuMs: +Math.max(0, med(tot) - med(cpu) - med(idle)).toFixed(3),
    // the least-disturbed iteration (the machine is shared): min total minus median CPU and idle
    gpuMsMin: +Math.max(0, Math.min(...tot) - med(cpu) - med(idle)).toFixed(3),
    debugMeanOverNonZero: +dbgMean.toFixed(2),
    debugMax: dbgMax,
    debugNonZeroFractionOfCoveredTiles: +dbgFrac.toFixed(4),
  };
  log(r);
  return r;
}

/**
 * Thin pass on the GPU: a 0.014 inch wire (straight and curved), two marker bands and a field of
 * stent-strut-sized primitives, rendered alone into a float target. Reports the wire's integral
 * per image column (beading), the image integral against pi r^2 L mu, the GPU/CPU agreement and
 * the GPU time for the number of primitives drawn.
 */
function thinCheck(nStruts = 2000) {
  const cam = last ? last.scene.cam : buildScene(DEFAULTS).scene.cam;
  const ci = camInfo(cam, RES);
  const gl = offscreenGl();
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, RES, RES);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.viewport(0, 0, RES, RES);
  // work in the iso plane: iso = point on the central ray 760 mm from the source
  const n = ci.n,
    src = ci.src;
  const iso: [number, number, number] = [src[0] + n[0] * 760, src[1] + n[1] * 760, src[2] + n[2] * 760];
  const U = ci.detU.map((x) => x / Math.hypot(...ci.detU)),
    W = ci.detV.map((x) => x / Math.hypot(...ci.detV));
  const P = (a: number, b: number, depth = 0) => ({ x: iso[0] + U[0] * a + W[0] * b + n[0] * depth, y: iso[1] + U[1] * a + W[1] * b + n[1] * depth, z: iso[2] + U[2] * a + W[2] * b + n[2] * depth });
  const prims: ThinPrim[] = [];
  const ang = 0.37;
  // straight wire across the field, 1.2 mm steps like the PCI wire
  for (let s0 = -60; s0 < 60; s0 += 1.2) prims.push({ p0: P(s0 * Math.cos(ang), s0 * Math.sin(ang) - 20), p1: P((s0 + 1.2) * Math.cos(ang), (s0 + 1.2) * Math.sin(ang) - 20), r: 0.178, mu: [0, 0, 1.9] });
  const wireCount = prims.length;
  // a curved wire
  for (let k = 0; k < 60; k++) {
    const a0 = k * 0.05,
      a1 = (k + 1) * 0.05;
    prims.push({ p0: P(30 * Math.cos(a0), 30 * Math.sin(a0) + 20), p1: P(30 * Math.cos(a1), 30 * Math.sin(a1) + 20), r: 0.178, mu: [0, 0, 1.9] });
  }
  // marker bands (short and thick)
  prims.push({ p0: P(-30, 40), p1: P(-29, 40), r: 0.42, mu: [0, 0, 3.2] });
  prims.push({ p0: P(-10, 40), p1: P(-9, 40), r: 0.42, mu: [0, 0, 3.2] });
  // stent-strut-sized primitives scattered in a patch (radius 0.045 mm, 1.5 mm long)
  let seed = 7;
  const rnd = () => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 4294967296);
  for (let k = 0; k < nStruts; k++) {
    const a = 20 + rnd() * 40,
      b = -60 + rnd() * 30,
      th = rnd() * Math.PI;
    prims.push({ p0: P(a, b, (rnd() - 0.5) * 6), p1: P(a + 1.5 * Math.cos(th), b + 1.5 * Math.sin(th), (rnd() - 0.5) * 6), r: 0.045, mu: [0, 0, 0.9] });
  }
  const pass = new ThinPass();
  const batch = packThin(prims);
  const ctx = { gl, cam, res: RES, extra: { thin: batch }, frame: 1 };
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  pass.draw(ctx);
  const img = new Float32Array(RES * RES * 4);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.readPixels(0, 0, RES, RES, gl.RGBA, gl.FLOAT, img);
  // wire integral per column across the straight wire (middle of the field), and the image integral
  const mag = ci.sid / 760;
  const colObj = ci.mmPerPx / mag;
  const sums: number[] = [];
  for (let px = RES / 2 - 120; px < RES / 2 + 120; px++) {
    const xmm = ((px + 0.5) / RES - 0.5) * 2 * Math.hypot(...ci.detU); // detector mm
    const ymm = (xmm / mag) * Math.tan(ang) - 20; // object mm
    const yc = RES / 2 + ((ymm * mag) / (2 * Math.hypot(...ci.detV))) * RES;
    let sum = 0;
    for (let py = Math.floor(yc) - 12; py <= Math.floor(yc) + 12; py++) sum += img[(py * RES + px) * 4 + 2];
    sums.push(sum);
  }
  const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
  const beading = Math.max(...sums.map((x) => Math.abs(x / mean - 1)));
  const expectPerCol = (1.9 * Math.PI * 0.178 * 0.178) / Math.cos(ang) / colObj;
  // CPU agreement on wire pixels
  const lut = buildThinLut();
  const cfg = withDefaults({});
  let maxRel = 0;
  for (let k = 0; k < 400; k++) {
    const px = Math.floor(RES / 2 - 100 + rnd() * 200);
    const xmm = ((px + 0.5) / RES - 0.5) * 2 * Math.hypot(...ci.detU);
    const ymm = (xmm / mag) * Math.tan(ang) - 20;
    const py = Math.floor(RES / 2 + ((ymm * mag) / (2 * Math.hypot(...ci.detV))) * RES + (rnd() - 0.5) * 6);
    const d = rayThroughPixel(ci, px + 0.5, py + 0.5, [0, 0, 0]);
    let cpu = 0;
    for (let q = 0; q < wireCount; q++) {
      const pr = prims[q];
      const b = [pr.p1.x - pr.p0.x, pr.p1.y - pr.p0.y, pr.p1.z - pr.p0.z];
      const L = Math.hypot(b[0], b[1], b[2]);
      const mid = [pr.p0.x + b[0] / 2 - src[0], pr.p0.y + b[1] / 2 - src[1], pr.p0.z + b[2] / 2 - src[2]];
      const al = mid[0] * n[0] + mid[1] * n[1] + mid[2] * n[2];
      const sigO = (thinSigmaPx(cfg.psf, al, ci.sid, ci.mmPerPx) * ci.mmPerPx) / (ci.sid / al);
      const tc = mid[0] * d[0] + mid[1] * d[1] + mid[2] * d[2];
      const w = [src[0] + tc * d[0] - pr.p0.x, src[1] + tc * d[1] - pr.p0.y, src[2] + tc * d[2] - pr.p0.z];
      cpu += 1.9 * thinValue(w, d, b, L, pr.r, pr.r, 1, 1, 0, sigO, lut);
    }
    const gpu = img[(py * RES + px) * 4 + 2];
    if (cpu > 0.02) maxRel = Math.max(maxRel, Math.abs(gpu - cpu) / cpu);
  }
  // GPU time: 5 draws per sync
  const one = new Float32Array(4);
  const t: number[] = [];
  for (let k = 0; k < 15; k++) {
    const t0 = performance.now();
    for (let q = 0; q < 5; q++) pass.draw(ctx);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, one);
    t.push((performance.now() - t0) / 5);
  }
  pass.dispose(gl);
  gl.disable(gl.BLEND);
  gl.deleteFramebuffer(fbo);
  gl.deleteTexture(tex);
  const r = {
    prims: prims.length,
    wireRadiusPx: +((0.178 * mag) / ci.mmPerPx).toFixed(3),
    wireBeadingMaxDev: +beading.toFixed(4),
    wireIntegralPerColumn: +mean.toFixed(4),
    expectedPerColumn: +expectPerCol.toFixed(4),
    gpuVsCpuMaxRel: +maxRel.toExponential(2),
    msPerDrawMin: +Math.min(...t).toFixed(3),
    msPerDrawMedian: +[...t].sort((a, b) => a - b)[7].toFixed(3),
  };
  log(r);
  return r;
}

async function post(name: string, canvas: HTMLCanvasElement) {
  const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/png"));
  const res = await fetch(`/__capture/${name}.png`, { method: "POST", body: blob });
  return res.ok;
}

/** Crop (x, y, size in canvas pixels, origin top-left) magnified to `out` px, nearest neighbour. */
function crop(src: HTMLCanvasElement, x: number, y: number, size: number, outPx = 384) {
  const c = document.createElement("canvas");
  c.width = c.height = outPx;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  g.drawImage(src, x, y, size, size, 0, 0, outPx, outPx);
  return c;
}

async function capture(prefix = "s2b", crops: [number, number, number][] = []) {
  const ok: Record<string, boolean> = {};
  ok[`${prefix}-A`] = await post(`${prefix}-A`, ca);
  ok[`${prefix}-B`] = await post(`${prefix}-B`, cb);
  ok[`${prefix}-diff`] = await post(`${prefix}-diff`, cd);
  for (let i = 0; i < crops.length; i++) {
    const [x, y, s] = crops[i];
    ok[`${prefix}-crop${i}-A`] = await post(`${prefix}-crop${i}-A`, crop(ca, x, y, s));
    ok[`${prefix}-crop${i}-B`] = await post(`${prefix}-crop${i}-B`, crop(cb, x, y, s));
  }
  log(ok);
  return ok;
}

/** Profile of channel values of canvas B (or A) along a row or column segment, for vessel and catheter checks. */
function profile(which: "A" | "B", x0: number, y0: number, x1: number, y1: number, n = 64) {
  const c = which === "A" ? ca : cb;
  const t = document.createElement("canvas");
  t.width = t.height = RES;
  const g = t.getContext("2d")!;
  g.drawImage(c, 0, 0);
  const d = g.getImageData(0, 0, RES, RES).data;
  const v: number[] = [];
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n),
      y = Math.round(y0 + ((y1 - y0) * i) / n);
    v.push(d[(y * RES + x) * 4]);
  }
  return v;
}

declare global {
  interface Window {
    __s2b?: unknown;
  }
}
window.__s2b = { render, prepare, gpuCheck, extCheck, velCheck, perf, benchGpu, thinCheck, capture, profile, pass, get last() { return last; } };

const readOpts = (): Partial<DemoOptions> => ({
  scenario: ($("scn") as HTMLSelectElement).value,
  view: ($("view") as HTMLSelectElement).value,
  devices: ($("dev") as HTMLSelectElement).value as DemoOptions["devices"],
  bt: ($("bt") as HTMLInputElement).value.trim() === "" ? null : Number(($("bt") as HTMLInputElement).value),
  t: Number(($("t") as HTMLInputElement).value),
  noiseFree: ($("nf") as HTMLInputElement).checked,
  motion: ($("mo") as HTMLInputElement).checked,
});
$("go").onclick = () => render(readOpts());
// the renderer may be mid-edit in the shared tree: keep the page scriptable if a frame throws
const safeRender = () => {
  try {
    render();
  } catch (e) {
    log(`render failed (renderer being edited?): ${String(e)}`);
    prepare();
  }
};
$("chk").onclick = () => gpuCheck();
$("perf").onclick = () => void perf();
$("cap").onclick = () => void capture();
safeRender();
