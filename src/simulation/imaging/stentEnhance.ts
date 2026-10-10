// ---------------------------------------------------------------------------
// Enhanced stent visualisation (pci-intravascular-imaging): the X-ray stent
// enhancement mode the module names (pm-imaging-optimisation: "When the X-ray
// stent-enhancement mode or imaging shows a poor result ..."), done the way
// such modes work on stored cine frames: find the two radiopaque balloon
// markers in every frame, map each frame onto the reference frame by the
// similarity transform that carries its markers onto the reference markers,
// and average the registered frames. The stent, which moves with its markers,
// adds up; the noise and everything moving differently (the heart border, the
// ribs, the background) blur out.
//
// Engine-free and pure: it reads grey frames (0 black … 255 white, contrast and
// metal dark, as src/simulation/imaging/qca.ts GrayFrame) and returns one.
// Nothing here knows where the markers truly are: they are found on the image.
// Every number below is a MODEL PARAMETER of the image processing
// (docs/realism/facts/pkg-pci-intravascular-imaging.md).
// ---------------------------------------------------------------------------

export interface GrayImage {
  w: number;
  h: number;
  /** 0 = black … 255 = white, row-major, y down; markers and metal are dark */
  data: Uint8Array | Uint8ClampedArray | Float32Array;
}

export type Pt = [number, number];

/** The two markers found on a frame (a is the one nearer the top-left), with the detector's response. */
export interface MarkerPair {
  a: Pt;
  b: Pt;
  score: number;
}

export interface MarkerOptions {
  /** marker radius in pixels (the detector's inner box half-width) */
  radiusPx?: number;
  /** allowed marker separation, pixels */
  minSepPx?: number;
  maxSepPx?: number;
  /** candidates kept per frame */
  candidates?: number;
  /** the previous frame's pair: candidates near it are preferred (tracking) */
  near?: MarkerPair | null;
  /** how far a marker may move between frames when tracking, pixels */
  trackPx?: number;
}

/** Marker radius in stored pixels — MODEL PARAMETER (a balloon marker band is about 1 mm; stored frames are about 0.3-0.4 mm per pixel). */
export const MP_MARKER_RADIUS_PX = 2;
/** Candidate blobs kept per frame — MODEL PARAMETER. */
export const MP_MARKER_CANDIDATES = 10;
/** Blobs weaker than this share of the frame's strongest are not candidates — MODEL PARAMETER. */
export const MP_CANDIDATE_FLOOR = 0.25;
/** Largest marker movement between two frames when tracking, pixels — MODEL PARAMETER. */
export const MP_MARKER_TRACK_PX = 24;
/** Contrast stretch of the result: the darkest and lightest share of the pixels clipped — MODEL PARAMETER. */
export const MP_STRETCH_CLIP = 0.01;

/** Summed-area table of an image (w+1 × h+1). */
function integral(img: GrayImage): Float64Array {
  const { w, h, data } = img;
  const S = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += data[y * w + x];
      S[(y + 1) * (w + 1) + x + 1] = S[y * (w + 1) + x + 1] + row;
    }
  }
  return S;
}

/** Mean of the box [x0, x1) × [y0, y1), clipped to the image. */
function boxMean(S: Float64Array, w: number, h: number, x0: number, y0: number, x1: number, y1: number): number {
  x0 = Math.max(0, x0);
  y0 = Math.max(0, y0);
  x1 = Math.min(w, x1);
  y1 = Math.min(h, y1);
  const n = (x1 - x0) * (y1 - y0);
  if (n <= 0) return 0;
  const W = w + 1;
  return (S[y1 * W + x1] - S[y0 * W + x1] - S[y1 * W + x0] + S[y0 * W + x0]) / n;
}

/**
 * Dark compact blobs: at each pixel the mean of the surrounding box (3r) minus the mean of the inner box (r),
 * so a small dark disc scores high and a long dark line much less (its own ring is dark too). Returns the
 * strongest local maxima, strongest first.
 */
export function markerCandidates(img: GrayImage, o: MarkerOptions = {}): { p: Pt; r: number }[] {
  const r = o.radiusPx ?? MP_MARKER_RADIUS_PX;
  const R = 3 * r;
  const { w, h } = img;
  const S = integral(img);
  const resp = new Float32Array(w * h);
  for (let y = R; y < h - R; y++)
    for (let x = R; x < w - R; x++) {
      const inner = boxMean(S, w, h, x - r, y - r, x + r + 1, y + r + 1);
      const outer = boxMean(S, w, h, x - R, y - R, x + R + 1, y + R + 1);
      // the darker side of the ring: a line through the blob leaves one side of the ring bright
      const left = boxMean(S, w, h, x - R, y - R, x - r, y + R + 1);
      const right = boxMean(S, w, h, x + r + 1, y - R, x + R + 1, y + R + 1);
      const top = boxMean(S, w, h, x - R, y - R, x + R + 1, y - r);
      const bottom = boxMean(S, w, h, x - R, y + r + 1, x + R + 1, y + R + 1);
      const ring = Math.max(outer, Math.min(Math.max(left, right), Math.max(top, bottom)));
      resp[y * w + x] = Math.max(0, ring - inner);
    }
  const out: { p: Pt; r: number }[] = [];
  const keep = o.candidates ?? MP_MARKER_CANDIDATES;
  const sup = 2 * r + 1;
  let peak = 0;
  for (let k = 0; k < resp.length; k++) if (resp[k] > peak) peak = resp[k];
  const floor = MP_CANDIDATE_FLOOR * peak;
  for (let y = R; y < h - R; y++)
    for (let x = R; x < w - R; x++) {
      const v = resp[y * w + x];
      if (v <= 0 || v < floor) continue;
      let max = true;
      for (let dy = -sup; dy <= sup && max; dy++)
        for (let dx = -sup; dx <= sup; dx++) {
          if (!dx && !dy) continue;
          const yy = y + dy,
            xx = x + dx;
          if (yy < 0 || yy >= h || xx < 0 || xx >= w) continue;
          const u = resp[yy * w + xx];
          if (u > v || (u === v && (dy < 0 || (dy === 0 && dx < 0)))) {
            max = false;
            break;
          }
        }
      if (max) out.push({ p: subPixel(resp, w, h, x, y), r: v });
    }
  out.sort((a, b) => b.r - a.r);
  return out.slice(0, keep);
}

/** Parabolic sub-pixel peak. */
function subPixel(resp: Float32Array, w: number, h: number, x: number, y: number): Pt {
  const at = (xx: number, yy: number) => resp[Math.max(0, Math.min(h - 1, yy)) * w + Math.max(0, Math.min(w - 1, xx))];
  const c = at(x, y);
  const dx = (at(x + 1, y) - at(x - 1, y)) / (2 * (2 * c - at(x + 1, y) - at(x - 1, y)) || 1);
  const dy = (at(x, y + 1) - at(x, y - 1)) / (2 * (2 * c - at(x, y + 1) - at(x, y - 1)) || 1);
  return [x + Math.max(-0.5, Math.min(0.5, dx)), y + Math.max(-0.5, Math.min(0.5, dy))];
}

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Order a pair consistently (a nearer the top-left) unless tracking says otherwise. */
function ordered(a: Pt, b: Pt, near?: MarkerPair | null): [Pt, Pt] {
  if (near) return dist(a, near.a) + dist(b, near.b) <= dist(b, near.a) + dist(a, near.b) ? [a, b] : [b, a];
  return a[0] + a[1] <= b[0] + b[1] ? [a, b] : [b, a];
}

/** The two balloon markers of a frame, or null when no pair fits the separation (and, when tracking, the previous pair). */
export function detectMarkers(img: GrayImage, o: MarkerOptions = {}): MarkerPair | null {
  const cands = markerCandidates(img, o);
  const minSep = o.minSepPx ?? 6;
  const maxSep = o.maxSepPx ?? Math.max(img.w, img.h);
  const track = o.trackPx ?? MP_MARKER_TRACK_PX;
  let best: MarkerPair | null = null;
  let bestScore = -Infinity;
  for (let i = 0; i < cands.length; i++)
    for (let j = i + 1; j < cands.length; j++) {
      const d = dist(cands[i].p, cands[j].p);
      if (d < minSep || d > maxSep) continue;
      const [a, b] = ordered(cands[i].p, cands[j].p, o.near);
      let score = cands[i].r + cands[j].r;
      if (o.near) {
        const move = Math.max(dist(a, o.near.a), dist(b, o.near.b));
        if (move > track) continue;
        // prefer the pair that kept its separation and moved least
        score -= 0.05 * score * (move / track) + 0.5 * Math.abs(d - dist(o.near.a, o.near.b));
      }
      if (score > bestScore) {
        bestScore = score;
        best = { a, b, score };
      }
    }
  return best;
}

/** The similarity transform (rotation, scale, translation) that carries `from` markers onto `to` markers. */
export interface Similarity {
  /** x' = c x - s y + tx; y' = s x + c y + ty */
  c: number;
  s: number;
  tx: number;
  ty: number;
}

export function similarityFrom(from: MarkerPair, to: MarkerPair): Similarity {
  const fx = from.b[0] - from.a[0],
    fy = from.b[1] - from.a[1];
  const gx = to.b[0] - to.a[0],
    gy = to.b[1] - to.a[1];
  const den = fx * fx + fy * fy || 1;
  // complex division (g / f) gives scale x rotation
  const c = (gx * fx + gy * fy) / den;
  const s = (gy * fx - gx * fy) / den;
  const tx = to.a[0] - (c * from.a[0] - s * from.a[1]);
  const ty = to.a[1] - (s * from.a[0] + c * from.a[1]);
  return { c, s, tx, ty };
}

/** Bilinear sample (NaN outside). */
function sample(img: GrayImage, x: number, y: number): number {
  if (x < 0 || y < 0 || x > img.w - 1 || y > img.h - 1) return NaN;
  const x0 = Math.floor(x),
    y0 = Math.floor(y);
  const x1 = Math.min(img.w - 1, x0 + 1),
    y1 = Math.min(img.h - 1, y0 + 1);
  const fx = x - x0,
    fy = y - y0;
  const d = img.data;
  const w = img.w;
  return (d[y0 * w + x0] * (1 - fx) + d[y0 * w + x1] * fx) * (1 - fy) + (d[y1 * w + x0] * (1 - fx) + d[y1 * w + x1] * fx) * fy;
}

/** Warp a frame into the reference frame's coordinates (out(x) = frame(T⁻¹ x), T carrying frame markers onto the reference's). */
export function warp(img: GrayImage, T: Similarity): Float32Array {
  const out = new Float32Array(img.w * img.h);
  // inverse of the similarity: x = (c (x' - tx) + s (y' - ty)) / k, y = (-s (x' - tx) + c (y' - ty)) / k
  const k = T.c * T.c + T.s * T.s || 1;
  for (let y = 0; y < img.h; y++)
    for (let x = 0; x < img.w; x++) {
      const u = x - T.tx,
        v = y - T.ty;
      out[y * img.w + x] = sample(img, (T.c * u + T.s * v) / k, (-T.s * u + T.c * v) / k);
    }
  return out;
}

export interface EnhanceOptions extends Omit<MarkerOptions, "near"> {
  /** the reference frame (default: the first frame whose markers are found) */
  referenceIndex?: number;
  /** stretch the result's grey levels (default true) */
  stretch?: boolean;
}

export interface EnhanceResult {
  image: GrayImage;
  /** the markers on the reference frame */
  reference: MarkerPair;
  referenceIndex: number;
  /** the frames registered and averaged (indices), and the markers found on each frame (null: none) */
  used: number[];
  markers: (MarkerPair | null)[];
}

/**
 * Register every frame on its balloon markers and average them. Frames whose markers are not found, or whose
 * marker separation differs from the reference's by more than a quarter (a foreshortened or wrong pair), are
 * left out. Null when no frame has a pair of markers.
 */
export function enhanceStent(frames: readonly GrayImage[], o: EnhanceOptions = {}): EnhanceResult | null {
  if (!frames.length) return null;
  const markers: (MarkerPair | null)[] = [];
  let prev: MarkerPair | null = null;
  for (const f of frames) {
    let m = detectMarkers(f, { ...o, near: prev });
    if (!m && prev) m = detectMarkers(f, o);
    markers.push(m);
    if (m) prev = m;
  }
  let refIdx = o.referenceIndex ?? markers.findIndex((m) => !!m);
  if (refIdx < 0 || !markers[refIdx]) refIdx = markers.findIndex((m) => !!m);
  if (refIdx < 0) return null;
  const ref = markers[refIdx]!;
  const refSep = dist(ref.a, ref.b);
  const { w, h } = frames[refIdx];
  const sum = new Float64Array(w * h);
  const n = new Uint16Array(w * h);
  const used: number[] = [];
  frames.forEach((f, i) => {
    const m = markers[i];
    if (!m || f.w !== w || f.h !== h) return;
    if (Math.abs(dist(m.a, m.b) / refSep - 1) > 0.25) return;
    const img = warp(f, similarityFrom(m, ref));
    for (let k = 0; k < img.length; k++)
      if (!Number.isNaN(img[k])) {
        sum[k] += img[k];
        n[k]++;
      }
    used.push(i);
  });
  const avg = new Float32Array(w * h);
  for (let k = 0; k < avg.length; k++) avg[k] = n[k] ? sum[k] / n[k] : frames[refIdx].data[k];
  const out = o.stretch === false ? avg : stretch(avg, ref, w, h);
  const data = new Uint8Array(w * h);
  for (let k = 0; k < data.length; k++) data[k] = Math.max(0, Math.min(255, Math.round(out[k])));
  return { image: { w, h, data }, reference: ref, referenceIndex: refIdx, used, markers };
}

/**
 * Stretch the grey levels to 0..255 on the region about the markers (the stent), clipping the extremes. The
 * stretch applies in full inside that region and fades out over the same distance beyond it, so the background
 * keeps its own grey levels instead of saturating.
 */
function stretch(img: Float32Array, ref: MarkerPair, w: number, h: number): Float32Array {
  const cx = (ref.a[0] + ref.b[0]) / 2,
    cy = (ref.a[1] + ref.b[1]) / 2;
  const half = Math.max(8, dist(ref.a, ref.b) * 0.75);
  const vals: number[] = [];
  for (let y = Math.max(0, Math.floor(cy - half)); y < Math.min(h, Math.ceil(cy + half)); y++)
    for (let x = Math.max(0, Math.floor(cx - half)); x < Math.min(w, Math.ceil(cx + half)); x++) vals.push(img[y * w + x]);
  if (vals.length < 16) return img;
  vals.sort((a, b) => a - b);
  const lo = vals[Math.floor(MP_STRETCH_CLIP * (vals.length - 1))];
  const hi = vals[Math.ceil((1 - MP_STRETCH_CLIP) * (vals.length - 1))];
  if (!(hi > lo)) return img;
  const out = new Float32Array(img.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const k = y * w + x;
      // Chebyshev distance beyond the region's square, as a fraction of its half-width: 0 inside, 1 a half-width out
      const d = Math.max(0, Math.abs(x - cx) - half, Math.abs(y - cy) - half) / half;
      const f = Math.max(0, 1 - d);
      const v = ((img[k] - lo) / (hi - lo)) * 255;
      out[k] = f >= 1 ? v : f * Math.max(0, Math.min(255, v)) + (1 - f) * img[k];
    }
  return out;
}

/** Balloon marker separation looked for on a stored run, mm at the isocentre — MODEL PARAMETER (the catalogue's balloons are 8 to 38 mm long; foreshortening shortens them). */
export const MP_MARKER_SEP_MM: readonly [number, number] = [4, 45];
/** At most this many frames of a run are registered (evenly spread) — MODEL PARAMETER (keeps the reference monitor responsive: about 1.7 s for 20 frames of 512 × 512 in the app). */
export const MP_MAX_FRAMES = 20;

/** Enhance a stored run (the reference monitor's series: frames, size and the stored scale). */
export function enhanceSeries(run: { frames: readonly Uint8Array[]; w: number; h: number; mmPerPxIso: number }, o: EnhanceOptions = {}): EnhanceResult | null {
  const n = run.frames.length;
  if (!n) return null;
  const step = Math.max(1, Math.ceil(n / MP_MAX_FRAMES));
  const frames: GrayImage[] = [];
  for (let i = 0; i < n; i += step) frames.push({ w: run.w, h: run.h, data: run.frames[i] });
  const mmPerPx = run.mmPerPxIso > 0 ? run.mmPerPxIso : 0.35;
  const r = enhanceStent(frames, { minSepPx: MP_MARKER_SEP_MM[0] / mmPerPx, maxSepPx: MP_MARKER_SEP_MM[1] / mmPerPx, ...o });
  return r ? { ...r, used: r.used.map((i) => i * step), referenceIndex: r.referenceIndex * step } : null;
}
