// pci-intravascular-imaging: enhanced stent visualisation on synthetic frames. A faint stent between two
// dark balloon markers moves (translation and rotation) from frame to frame under heavy noise; registering
// the frames on the markers and averaging them gives a sharper, less noisy stent profile than any one frame,
// and a sharper one than averaging the frames without registration.
//   npx vitest run src/simulation/imaging/stentEnhance.test.ts
import { describe, expect, it } from "vitest";
import { MP_MAX_FRAMES, detectMarkers, enhanceSeries, enhanceStent, similarityFrom, type GrayImage, type Pt } from "./stentEnhance";

const W = 128;
const H = 128;
const BG = 150;
const MARKER = 40;
const STENT_DROP = 14;
const NOISE = 14;
const HALF_SEP = 22;
const STENT_HALF_W = 2;

/** A seeded normal deviate (Box-Muller on a small LCG). */
function rng(seed: number) {
  let s = seed >>> 0;
  const u = () => ((s = (1664525 * s + 1013904223) >>> 0) + 0.5) / 4294967296;
  return () => Math.sqrt(-2 * Math.log(u())) * Math.cos(2 * Math.PI * u());
}

/** One frame: markers at centre ± HALF_SEP along angle `ang`, the stent between them, noise and a drifting dark band (the heart border). */
function frame(cx: number, cy: number, ang: number, k: number, noise: () => number): { img: GrayImage; a: Pt; b: Pt } {
  const ux = Math.cos(ang),
    uy = Math.sin(ang);
  const a: Pt = [cx - HALF_SEP * ux, cy - HALF_SEP * uy];
  const b: Pt = [cx + HALF_SEP * ux, cy + HALF_SEP * uy];
  const data = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let v = BG;
      // a broad dark band that moves differently from the stent
      v -= 20 * Math.exp(-(((x - 20 - 3 * k) / 12) ** 2));
      // the stent: a faint bar between the markers
      const along = (x - cx) * ux + (y - cy) * uy;
      const across = -(x - cx) * uy + (y - cy) * ux;
      if (Math.abs(along) < HALF_SEP - 3 && Math.abs(across) <= STENT_HALF_W) v -= STENT_DROP;
      // the markers: small dark discs
      if (Math.hypot(x - a[0], y - a[1]) <= 2 || Math.hypot(x - b[0], y - b[1]) <= 2) v = MARKER;
      data[y * W + x] = Math.max(0, Math.min(255, Math.round(v + NOISE * noise())));
    }
  return { img: { w: W, h: H, data }, a, b };
}

/** The mean profile across the stent (perpendicular to the marker axis) over its middle half, in an image's own marker frame. */
function profile(img: GrayImage, a: Pt, b: Pt): number[] {
  const cx = (a[0] + b[0]) / 2,
    cy = (a[1] + b[1]) / 2;
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ux = (b[0] - a[0]) / L,
    uy = (b[1] - a[1]) / L;
  const out: number[] = [];
  for (let off = -10; off <= 10; off++) {
    let sum = 0,
      n = 0;
    for (let t = -L / 4; t <= L / 4; t += 1) {
      const x = Math.round(cx + t * ux - off * uy);
      const y = Math.round(cy + t * uy + off * ux);
      if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue;
      sum += img.data[y * img.w + x];
      n++;
    }
    out.push(sum / Math.max(1, n));
  }
  return out;
}

/** Contrast-to-noise of the stent on a profile: the dip at the centre against the spread of the shoulders. */
function cnr(p: number[]): number {
  const mid = Math.floor(p.length / 2);
  const centre = (p[mid - 1] + p[mid] + p[mid + 1]) / 3;
  const shoulders = [...p.slice(0, mid - 5), ...p.slice(mid + 6)];
  const m = shoulders.reduce((s, x) => s + x, 0) / shoulders.length;
  const sd = Math.sqrt(shoulders.reduce((s, x) => s + (x - m) ** 2, 0) / shoulders.length);
  return (m - centre) / Math.max(1e-6, sd);
}

/** Sharpness: the dip's depth relative to its full width (a blurred stent is shallower and wider). */
function dipDepth(p: number[]): number {
  const mid = Math.floor(p.length / 2);
  const shoulders = [...p.slice(0, mid - 5), ...p.slice(mid + 6)];
  const m = shoulders.reduce((s, x) => s + x, 0) / shoulders.length;
  return m - Math.min(...p.slice(mid - 2, mid + 3));
}

function makeRun(n = 24, seed = 7) {
  const noise = rng(seed);
  const move = rng(seed + 1);
  const frames: { img: GrayImage; a: Pt; b: Pt }[] = [];
  for (let k = 0; k < n; k++) frames.push(frame(64 + 6 * move(), 64 + 6 * move(), 0.35 + 0.12 * move(), k, noise));
  return frames;
}

describe("stentEnhance (pci-intravascular-imaging)", () => {
  it("finds the two balloon markers on a noisy frame", () => {
    const [f] = makeRun(1, 3);
    const m = detectMarkers(f.img, { minSepPx: 20, maxSepPx: 80 })!;
    expect(m).not.toBeNull();
    const err = Math.min(
      Math.hypot(m.a[0] - f.a[0], m.a[1] - f.a[1]) + Math.hypot(m.b[0] - f.b[0], m.b[1] - f.b[1]),
      Math.hypot(m.a[0] - f.b[0], m.a[1] - f.b[1]) + Math.hypot(m.b[0] - f.a[0], m.b[1] - f.a[1])
    );
    expect(err).toBeLessThan(3);
  });

  it("the similarity transform carries one marker pair onto another", () => {
    const T = similarityFrom({ a: [10, 10], b: [30, 10], score: 1 }, { a: [50, 60], b: [50, 100], score: 1 });
    const map = (p: Pt): Pt => [T.c * p[0] - T.s * p[1] + T.tx, T.s * p[0] + T.c * p[1] + T.ty];
    expect(map([10, 10])[0]).toBeCloseTo(50, 6);
    expect(map([10, 10])[1]).toBeCloseTo(60, 6);
    expect(map([30, 10])[0]).toBeCloseTo(50, 6);
    expect(map([30, 10])[1]).toBeCloseTo(100, 6);
  });

  it("synthetic frames with moving markers give a sharper stent profile than one frame (and than unregistered averaging)", () => {
    const run = makeRun();
    const res = enhanceStent(run.map((f) => f.img), { minSepPx: 20, maxSepPx: 80, stretch: false })!;
    expect(res).not.toBeNull();
    expect(res.used.length).toBeGreaterThanOrEqual(run.length - 2);
    const ref = run[res.referenceIndex];
    const enhanced = profile(res.image, ref.a, ref.b);
    const single = profile(ref.img, ref.a, ref.b);
    // the stent stands out of the noise far better than on one frame
    expect(cnr(enhanced)).toBeGreaterThan(2 * cnr(single));
    // averaging without registration smears the moving stent: its dip is shallower than the registered one
    const naive = new Uint8Array(W * H);
    for (let k = 0; k < naive.length; k++) naive[k] = Math.round(run.reduce((s, f) => s + f.img.data[k], 0) / run.length);
    const naiveProfile = profile({ w: W, h: H, data: naive }, ref.a, ref.b);
    expect(dipDepth(enhanced)).toBeGreaterThan(1.5 * dipDepth(naiveProfile));
    expect(dipDepth(enhanced)).toBeGreaterThan(0.6 * STENT_DROP);
  });

  it("returns null when no frame has markers, and the stretched result spans the grey range about the stent", () => {
    const blank: GrayImage = { w: 64, h: 64, data: new Uint8Array(64 * 64).fill(150) };
    expect(enhanceStent([blank, blank])).toBeNull();
    const res = enhanceStent(makeRun(12, 11).map((f) => f.img), { minSepPx: 20, maxSepPx: 80 })!;
    const d = res.image.data;
    expect(Math.max(...d)).toBe(255);
    expect(Math.min(...d)).toBe(0);
    // away from the stent the stretch fades out: the image corner keeps close to its own grey level, unsaturated
    const raw = enhanceStent(makeRun(12, 11).map((f) => f.img), { minSepPx: 20, maxSepPx: 80, stretch: false })!.image.data;
    for (const k of [0, W - 1, (H - 1) * W, H * W - 1]) {
      expect(d[k], `pixel ${k}`).toBeGreaterThan(0);
      expect(d[k], `pixel ${k}`).toBeLessThan(255);
      expect(Math.abs(d[k] - raw[k]), `pixel ${k}`).toBeLessThan(20);
    }
  });

  it("enhances a stored run (the reference monitor's series), spreading the frames it registers over a long run", () => {
    const run = makeRun(60, 5);
    // markers 44 px apart at 0.3 mm per pixel: 13 mm, inside the balloon marker range
    const r = enhanceSeries({ frames: run.map((f) => f.img.data as Uint8Array), w: W, h: H, mmPerPxIso: 0.3 })!;
    expect(r).not.toBeNull();
    expect(r.used.length).toBeLessThanOrEqual(MP_MAX_FRAMES);
    expect(r.used[r.used.length - 1]).toBeGreaterThan(40);
    // at 0.05 mm per pixel the same markers are 2.2 mm apart: too close for balloon markers
    expect(enhanceSeries({ frames: run.slice(0, 4).map((f) => f.img.data as Uint8Array), w: W, h: H, mmPerPxIso: 0.05 })).toBeNull();
  });
});
