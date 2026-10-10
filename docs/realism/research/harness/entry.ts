// Research harness (scratch only): renders CathMaster X-ray frames and analyses
// real library frames with identical statistics. Nothing here touches the project.
const P = "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src";
// @ts-ignore
import { buildAnatomy } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/anatomy";
// @ts-ignore
import { CASE_LIBRARY } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/simulation/caseGenerator";
// @ts-ignore
import { buildCoronaryTree } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/coronaryTree";
// @ts-ignore
import { buildXrayScene } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/sceneBuilder";
// @ts-ignore
import { XrayRenderer } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/render/xray/XrayRenderer";
// @ts-ignore
import { catheterPath } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/ui/sim/helpers";
// @ts-ignore
import { catheterById } from "/Users/qc25212/Downloads/Misc/Games and apps/Cath Simulator/src/data/catheters";
void P;

const RES = 768;
const canvas = document.createElement("canvas");
canvas.width = RES;
canvas.height = RES;
document.body.appendChild(canvas);
const xr = XrayRenderer.create(canvas)!;
xr.resize(RES);
const gl = xr.gl as WebGL2RenderingContext;

const c = CASE_LIBRARY[0];
const model = buildAnatomy(c);
const tree = buildCoronaryTree(model, c);
const left = [...new Set(tree.vessels.filter((v: any) => v.side === "left").map((v: any) => v.fillId))];
const right = [...new Set(tree.vessels.filter((v: any) => v.side === "right").map((v: any) => v.fillId))];

export interface Opt {
  lao: number;
  cran: number;
  side?: "left" | "right";
  bt?: number | null; // seconds since injection, null = no contrast
  t?: number;
  frame?: number;
  mode?: "cine" | "fluoro";
  field?: number;
  hold?: number | null;
  tune?: Record<string, number>;
}
let lastScene: any = null;
function sceneFor(o: Opt) {
  const side = o.side ?? "left";
  const cath = catheterById(side === "left" ? "JL4" : "JR4");
  const os = side === "left" ? model.lm : model.rca;
  const tip = { pos: os.pos, dir: os.dir, height: os.height, az: os.az, radius: model.sinusRadius, cram: 0, gap: 0 };
  const root = catheterPath(model, tip, cath);
  const bt = o.bt ?? null;
  const r = buildXrayScene({
    model,
    caseData: c,
    tree,
    catheterRoot: root,
    french: 6,
    wire: null,
    bolus: bt !== null ? { filled: side === "left" ? left : right, plume: "none", side, t: bt, injectDur: 1.8, peak: 1 } : null,
    t: o.t ?? 0,
    cArm: { laoRao: o.lao, cranialCaudal: o.cran },
    field: o.field ?? 230,
    centreOn: side,
    mode: o.mode ?? "cine",
    breathHold: o.hold === undefined ? 0.7 : o.hold,
    frame: o.frame ?? 1,
  });
  if (o.tune) Object.assign(r.params, o.tune);
  lastScene = r.scene;
  return r;
}
function render(o: Opt): Uint8Array {
  const { scene, params } = sceneFor(o);
  xr.render(scene, params);
  const px = new Uint8Array(RES * RES * 4);
  gl.readPixels(0, 0, RES, RES, gl.RGBA, gl.UNSIGNED_BYTE, px);
  // flip to top-down grey
  const g = new Uint8Array(RES * RES);
  for (let y = 0; y < RES; y++) for (let x = 0; x < RES; x++) g[y * RES + x] = px[((RES - 1 - y) * RES + x) * 4];
  return g;
}
/** area-weighted resample of a square grey image */
function resample(src: Uint8Array | Float32Array, n: number, m: number): Float32Array {
  const out = new Float32Array(m * m);
  const s = n / m;
  for (let y = 0; y < m; y++)
    for (let x = 0; x < m; x++) {
      let acc = 0,
        w = 0;
      const x0 = x * s,
        x1 = (x + 1) * s,
        y0 = y * s,
        y1 = (y + 1) * s;
      for (let yy = Math.floor(y0); yy < Math.ceil(y1); yy++)
        for (let xx = Math.floor(x0); xx < Math.ceil(x1); xx++) {
          const wx = Math.min(x1, xx + 1) - Math.max(x0, xx);
          const wy = Math.min(y1, yy + 1) - Math.max(y0, yy);
          const ww = wx * wy;
          acc += src[yy * n + xx] * ww;
          w += ww;
        }
      out[y * m + x] = acc / w;
    }
  return out;
}
async function jpegRoundTrip(img: Float32Array, n: number, q = 0.72): Promise<Float32Array> {
  const cv = document.createElement("canvas");
  cv.width = n;
  cv.height = n;
  const ctx = cv.getContext("2d")!;
  const id = ctx.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const v = Math.max(0, Math.min(255, Math.round(img[i])));
    id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v;
    id.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  const blob: Blob = await new Promise((res) => cv.toBlob((b) => res(b!), "image/jpeg", q));
  const bmp = await createImageBitmap(blob);
  ctx.drawImage(bmp, 0, 0);
  const d = ctx.getImageData(0, 0, n, n).data;
  const out = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) out[i] = d[i * 4];
  return out;
}
/** sim frame matched to the library format: 512 px, JPEG q72 */
async function simLib(o: Opt): Promise<Float32Array> {
  const g = render(o);
  return jpegRoundTrip(resample(g, RES, 512), 512);
}
async function loadGray(url: string): Promise<{ w: number; h: number; d: Float32Array }> {
  const r = await fetch(url);
  if (!r.ok) throw new Error("fetch " + url + " " + r.status);
  const bmp = await createImageBitmap(await r.blob());
  const cv = document.createElement("canvas");
  cv.width = bmp.width;
  cv.height = bmp.height;
  const ctx = cv.getContext("2d")!;
  ctx.drawImage(bmp, 0, 0);
  const d = ctx.getImageData(0, 0, bmp.width, bmp.height).data;
  const out = new Float32Array(bmp.width * bmp.height);
  for (let i = 0; i < out.length; i++) out[i] = d[i * 4];
  return { w: bmp.width, h: bmp.height, d: out };
}

// ---------------- analysis ----------------
function fft1(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang),
      wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1,
        ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k],
          ai = im[i + k];
        const br = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const bi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ar + br;
        im[i + k] = ai + bi;
        re[i + k + len / 2] = ar - br;
        im[i + k + len / 2] = ai - bi;
        const t = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = t;
      }
    }
  }
}
/** 2D power spectrum |F|^2 / N^2 of an N×N block (row-major) */
function power2(block: Float64Array, N: number): Float64Array {
  const re = new Float64Array(block),
    im = new Float64Array(N * N);
  const rr = new Float64Array(N),
    ri = new Float64Array(N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      rr[x] = re[y * N + x];
      ri[x] = im[y * N + x];
    }
    fft1(rr, ri);
    for (let x = 0; x < N; x++) {
      re[y * N + x] = rr[x];
      im[y * N + x] = ri[x];
    }
  }
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      rr[y] = re[y * N + x];
      ri[y] = im[y * N + x];
    }
    fft1(rr, ri);
    for (let y = 0; y < N; y++) {
      re[y * N + x] = rr[y];
      im[y * N + x] = ri[y];
    }
  }
  const p = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) p[i] = (re[i] * re[i] + im[i] * im[i]) / (N * N);
  return p;
}
function radial(p: Float64Array, N: number, nb = 16, excludeAxes = false): { f: number[]; v: number[] } {
  const acc = new Float64Array(nb),
    cnt = new Float64Array(nb);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const fx = (x < N / 2 ? x : x - N) / N,
        fy = (y < N / 2 ? y : y - N) / N;
      if (excludeAxes && (fx === 0 || fy === 0)) continue;
      const f = Math.hypot(fx, fy);
      if (f === 0 || f > 0.5) continue;
      const b = Math.min(nb - 1, Math.floor((f / 0.5) * nb));
      acc[b] += p[y * N + x];
      cnt[b]++;
    }
  const f: number[] = [],
    v: number[] = [];
  for (let b = 0; b < nb; b++) {
    f.push(((b + 0.5) / nb) * 0.5);
    v.push(cnt[b] ? acc[b] / cnt[b] : 0);
  }
  return { f, v };
}
function block(img: Float32Array, W: number, x0: number, y0: number, N: number, detrend = true, hann = false): Float64Array {
  const b = new Float64Array(N * N);
  // plane fit
  let sx = 0,
    sy = 0,
    s = 0,
    sxx = 0,
    syy = 0,
    sxv = 0,
    syv = 0;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const v = img[(y0 + y) * W + x0 + x];
      b[y * N + x] = v;
      s += v;
    }
  const mean = s / (N * N);
  const c = (N - 1) / 2;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const v = b[y * N + x] - mean;
      sxv += (x - c) * v;
      syv += (y - c) * v;
      sxx += (x - c) * (x - c);
      syy += (y - c) * (y - c);
    }
  const ax = detrend ? sxv / sxx : 0,
    ay = detrend ? syv / syy : 0;
  void sx;
  void sy;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let v = b[y * N + x] - mean - ax * (x - c) - ay * (y - c);
      if (hann) v *= (0.5 - 0.5 * Math.cos((2 * Math.PI * (x + 0.5)) / N)) * (0.5 - 0.5 * Math.cos((2 * Math.PI * (y + 0.5)) / N));
      b[y * N + x] = v;
    }
  return b;
}
const variance = (b: Float64Array) => {
  let s = 0;
  for (const v of b) s += v * v;
  return s / b.length;
};
function stats(a: Float32Array) {
  const s = Array.from(a).sort((x, y) => x - y);
  const q = (p: number) => s[Math.floor(p * (s.length - 1))];
  let m = 0;
  for (const v of a) m += v;
  return { mean: m / a.length, p5: q(0.05), p25: q(0.25), p50: q(0.5), p75: q(0.75), p95: q(0.95) };
}

/**
 * Temporal noise analysis on three consecutive frames (W×W grey). Picks the flattest
 * N×N blocks of the mean image (low structure: motion contributes little to differences),
 * avoiding near-black/near-white and the outer margin.
 */
function noiseAnalysis(f1: Float32Array, f2: Float32Array, f3: Float32Array, W: number, N = 32, frac = 0.15, margin = 24) {
  const blocks: { x: number; y: number; struct: number; mean: number }[] = [];
  const mean = new Float32Array(W * W);
  for (let i = 0; i < W * W; i++) mean[i] = (f1[i] + f2[i] + f3[i]) / 3;
  for (let y = margin; y + N <= W - margin; y += N / 2)
    for (let x = margin; x + N <= W - margin; x += N / 2) {
      const b = block(mean, W, x, y, N, true);
      let m = 0;
      for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) m += mean[(y + yy) * W + x + xx];
      m /= N * N;
      if (m < 25 || m > 230) continue;
      blocks.push({ x, y, struct: variance(b), mean: m });
    }
  blocks.sort((a, b) => a.struct - b.struct);
  const sel = blocks.slice(0, Math.max(4, Math.floor(blocks.length * frac)));
  const d1 = new Float32Array(W * W),
    d2 = new Float32Array(W * W);
  for (let i = 0; i < W * W; i++) {
    d1[i] = f2[i] - f1[i];
    d2[i] = f3[i] - f2[i];
  }
  let sig = 0,
    c12 = 0,
    v1 = 0,
    v2 = 0,
    ax1 = 0,
    ay1 = 0,
    ax2 = 0,
    ay2 = 0,
    vv = 0;
  const npsAcc = new Float64Array(16);
  const perMean: [number, number][] = [];
  for (const s of sel) {
    const b1 = block(d1, W, s.x, s.y, N, true),
      b2 = block(d2, W, s.x, s.y, N, true);
    const var1 = variance(b1);
    sig += var1 / 2;
    perMean.push([s.mean, Math.sqrt(var1 / 2)]);
    for (let i = 0; i < N * N; i++) {
      c12 += b1[i] * b2[i];
      v1 += b1[i] * b1[i];
      v2 += b2[i] * b2[i];
    }
    // spatial autocorrelation of the noise (d1) at lags 1, 2
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const v = b1[y * N + x];
        vv += v * v;
        if (x + 1 < N) ax1 += v * b1[y * N + x + 1];
        if (y + 1 < N) ay1 += v * b1[(y + 1) * N + x];
        if (x + 2 < N) ax2 += v * b1[y * N + x + 2];
        if (y + 2 < N) ay2 += v * b1[(y + 2) * N + x];
      }
    const r = radial(power2(b1, N), N, 16);
    for (let k = 0; k < 16; k++) npsAcc[k] += r.v[k] / 2 / sel.length;
  }
  const n = sel.length;
  const nf = (N - 1) / N,
    nf2 = (N - 2) / N;
  const tot = npsAcc.reduce((a, b) => a + b, 0);
  return {
    blocks: n,
    meanGrey: sel.reduce((a, s) => a + s.mean, 0) / n,
    sigma: Math.sqrt(sig / n),
    tempCorrD: c12 / Math.sqrt(v1 * v2),
    recursionEstimate: 1 + 2 * (c12 / Math.sqrt(v1 * v2)),
    rho_x1: ax1 / vv / nf,
    rho_y1: ay1 / vv / nf,
    rho_x2: ax2 / vv / nf2,
    rho_y2: ay2 / vv / nf2,
    npsShape: Array.from(npsAcc).map((v) => +(v / (tot / 16)).toFixed(3)),
    hiLoRatio: (npsAcc[13] + npsAcc[14] + npsAcc[15]) / (npsAcc[1] + npsAcc[2] + npsAcc[3]),
    perMean,
  };
}
/** anatomical (whole image) power spectrum slope: Hann-windowed central block, log-log fit over [f0,f1] cycles/px */
function anatSpectrum(img: Float32Array, W: number, N = 256, f0 = 0.008, f1 = 0.08) {
  const x0 = Math.floor((W - N) / 2);
  const b = block(img, W, x0, x0, N, true, true);
  const r = radial(power2(b, N), N, 64, true);
  const xs: number[] = [],
    ys: number[] = [];
  for (let k = 0; k < r.f.length; k++)
    if (r.f[k] >= f0 && r.f[k] <= f1 && r.v[k] > 0) {
      xs.push(Math.log(r.f[k]));
      ys.push(Math.log(r.v[k]));
    }
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length,
    my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let sxy = 0,
    sxx = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  return { beta: -sxy / sxx, f: r.f, v: r.v };
}
function bilinear(img: Float32Array, W: number, x: number, y: number) {
  const x0 = Math.floor(x),
    y0 = Math.floor(y);
  const fx = x - x0,
    fy = y - y0;
  const g = (xx: number, yy: number) => img[Math.max(0, Math.min(W - 1, yy)) * W + Math.max(0, Math.min(W - 1, xx))];
  return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy;
}
/** mean perpendicular profile across a straight dark line segment (catheter), each profile re-centred on its minimum */
function lineProfile(img: Float32Array, W: number, ax: number, ay: number, bx: number, by: number, half = 14, step = 0.25) {
  const L = Math.hypot(bx - ax, by - ay);
  const tx = (bx - ax) / L,
    ty = (by - ay) / L;
  const nx = -ty,
    ny = tx;
  const K = Math.round((2 * half) / step) + 1;
  const acc = new Float64Array(K);
  let cnt = 0;
  for (let s = 0; s <= L; s += 1) {
    const cx = ax + tx * s,
      cy = ay + ty * s;
    // find min near the centre line
    let best = 1e9,
      bo = 0;
    for (let o = -4; o <= 4; o += 0.25) {
      const v = bilinear(img, W, cx + nx * o, cy + ny * o);
      if (v < best) {
        best = v;
        bo = o;
      }
    }
    for (let k = 0; k < K; k++) {
      const o = -half + k * step + bo;
      acc[k] += bilinear(img, W, cx + nx * o, cy + ny * o);
    }
    cnt++;
  }
  const prof = Array.from(acc).map((v) => v / cnt);
  const xs = prof.map((_, k) => -half + k * step);
  // background = mean of outer 3 px each side
  const outer = prof.filter((_, k) => Math.abs(xs[k]) >= half - 3);
  const bg = outer.reduce((a, b) => a + b, 0) / outer.length;
  const mn = Math.min(...prof);
  const halfLvl = (bg + mn) / 2;
  let l = 0,
    r = 0;
  const ci = prof.indexOf(mn);
  for (let k = ci; k >= 0; k--)
    if (prof[k] >= halfLvl) {
      l = xs[k];
      break;
    }
  for (let k = ci; k < K; k++)
    if (prof[k] >= halfLvl) {
      r = xs[k];
      break;
    }
  // overshoot: max within 2..8 px outside the half-max points, relative to bg, in units of depth
  let ov = -1e9;
  for (let k = 0; k < K; k++) if ((xs[k] < l - 0.5 && xs[k] > l - 8) || (xs[k] > r + 0.5 && xs[k] < r + 8)) ov = Math.max(ov, prof[k]);
  // 10-90 edge width on the left edge
  const lv10 = mn + 0.1 * (bg - mn),
    lv90 = mn + 0.9 * (bg - mn);
  let e10 = 0,
    e90 = 0;
  for (let k = ci; k >= 0; k--) {
    if (!e10 && prof[k] >= lv10) e10 = xs[k];
    if (prof[k] >= lv90) {
      e90 = xs[k];
      break;
    }
  }
  return { fwhm: r - l, depth: bg - mn, bg, overshootFrac: (ov - bg) / (bg - mn), edge10_90: e10 - e90, samples: cnt, prof: prof.filter((_, k) => k % 4 === 0).map((v) => +v.toFixed(1)) };
}
/** block-matching displacement (px) of the highest-variance blocks between two frames */
function motion(fa: Float32Array, fb: Float32Array, W: number, N = 24, search = 14, top = 12, margin = 40) {
  const cands: { x: number; y: number; v: number }[] = [];
  for (let y = margin; y + N <= W - margin; y += N)
    for (let x = margin; x + N <= W - margin; x += N) {
      const b = block(fa, W, x, y, N, true);
      cands.push({ x, y, v: variance(b) });
    }
  cands.sort((a, b) => b.v - a.v);
  const out: number[] = [];
  for (const c of cands.slice(0, top)) {
    let best = 1e18,
      bd = [0, 0];
    for (let dy = -search; dy <= search; dy++)
      for (let dx = -search; dx <= search; dx++) {
        let s = 0;
        for (let y = 0; y < N; y++)
          for (let x = 0; x < N; x++) {
            const d = fa[(c.y + y) * W + c.x + x] - fb[(c.y + y + dy) * W + c.x + x + dx];
            s += d * d;
          }
        if (s < best) {
          best = s;
          bd = [dx, dy];
        }
      }
    out.push(Math.hypot(bd[0], bd[1]));
  }
  out.sort((a, b) => a - b);
  return { median: out[Math.floor(out.length / 2)], max: out[out.length - 1], all: out };
}
function timing(o: Opt, n = 30) {
  // warm
  render(o);
  const tScene: number[] = [],
    tAll: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = performance.now();
    const { scene, params } = sceneFor({ ...o, frame: i + 2, t: i / 15 });
    const b = performance.now();
    xr.render(scene, params);
    const px = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const e = performance.now();
    tScene.push(b - a);
    tAll.push(e - a);
  }
  const med = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const tubes = lastScene.tubes.length;
  let pts = 0;
  for (const t of lastScene.tubes) pts += t.pts.length;
  return { sceneMs: med(tScene), totalMs: med(tAll), tubes, tubePts: pts, bones: lastScene.bones.length, renderer: gl.getParameter(gl.RENDERER), ext: !!gl.getExtension("EXT_disjoint_timer_query_webgl2") };
}
function gpuTiming(o: Opt, n = 20) {
  const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
  if (!ext) return null;
  return new Promise((res) => {
    const qs: WebGLQuery[] = [];
    for (let i = 0; i < n; i++) {
      const { scene, params } = sceneFor({ ...o, frame: i + 2, t: i / 15 });
      const q = gl.createQuery()!;
      gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
      xr.render(scene, params);
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      qs.push(q);
    }
    const poll = () => {
      const last = qs[qs.length - 1];
      if (!gl.getQueryParameter(last, gl.QUERY_RESULT_AVAILABLE)) return setTimeout(poll, 50);
      const ms = qs.map((q) => gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6).sort((a, b) => a - b);
      res({ medianMs: ms[Math.floor(ms.length / 2)], minMs: ms[0], maxMs: ms[ms.length - 1] });
    };
    poll();
  });
}
function project(p: any) {
  return XrayRenderer.project(lastScene.cam, p);
}
(window as any).H = {
  render,
  renderScene: (scene: any, params: any) => xr.render(scene, params),
  xr,
  sceneFor,
  simLib,
  resample,
  jpegRoundTrip,
  loadGray,
  noiseAnalysis,
  anatSpectrum,
  lineProfile,
  motion,
  stats,
  timing,
  gpuTiming,
  project,
  get scene() {
    return lastScene;
  },
  model,
  tree,
  canvas,
};
document.title = "harness ready";
