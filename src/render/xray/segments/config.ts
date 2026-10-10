// ---------------------------------------------------------------------------
// Configuration and camera helpers shared by the binner, the CPU reference
// integrator and the GPU pass.
// ---------------------------------------------------------------------------

import { DEFAULT_PSF, type PsfParams } from "./thinLut";
import type { XrayCamera } from "./types";

export interface SegmentConfig {
  /** screen tile size in pixels (square) */
  tile: number;
  /**
   * Thin-path blend band, in projected radius pixels. Segments thinner than thinLoPx use only the
   * PSF-consistent thin path, thicker than thinHiPx only the exact union path, and in between a
   * linear-in-smoothstep blend of the two. MODEL PARAMETERS (1.0, 1.5 px): chosen so that the
   * 0.014 inch wire (about 0.8 px radius at the PCI field) is thin and the smallest visible
   * branches (2.0-3.2 px FWHM in the library, measurementTargets) are exact.
   */
  thinLoPx: number;
  thinHiPx: number;
  /**
   * Tiles containing an exact-path feature (radius or shell wall) smaller than this in pixels get
   * four rotated-grid rays per pixel instead of one. MODEL PARAMETER (2.5 px).
   */
  ssFeaturePx: number;
  /**
   * Smallest feature contrast that gets anti-aliasing: |mu| x c x 2 r, a peak line integral.
   * MODEL PARAMETER (0.05, about 5 % transmission): point-sampling errors at an edge are a
   * fraction of this, under one grey level after the image chain, so faint structures (lung
   * vessels) take one ray per pixel.
   */
  ssMinContrast: number;
  /**
   * Taper slope (|r0 - r1| / L summed over the two segments of a joint) above which the gap the
   * joint plane leaves is back-filled. MODEL PARAMETER (0.05): the gap is second order in the
   * taper; below this it is under 0.1 % of the chord (segments.test.ts, real tree).
   */
  backfillSlope: number;
  /** tiles where a segment moves more than this (px) within one pulse get four time sub-samples */
  ssMotionPx: number;
  psf: PsfParams;
  /**
   * With several sub-samples, average transmission exp(-gain * P) per channel (what the detector
   * integrates) rather than path length. True by default.
   */
  transmissionAverage: boolean;
  /** maximum tile index entries per frame; beyond it entries are dropped and counted */
  capacity: number;
  /** write screen velocity into the pass's velocity attachment (needs prev positions) */
  velocity: boolean;
}

export const DEFAULT_CONFIG: SegmentConfig = {
  tile: 16,
  thinLoPx: 1.0,
  thinHiPx: 1.5,
  ssFeaturePx: 2.5,
  ssMinContrast: 0.05,
  backfillSlope: 0.05,
  ssMotionPx: 0.5,
  psf: DEFAULT_PSF,
  transmissionAverage: true,
  capacity: 2048 * 2048,
  velocity: false,
};

export function withDefaults(c?: Partial<SegmentConfig>): SegmentConfig {
  return { ...DEFAULT_CONFIG, ...(c ?? {}), psf: { ...DEFAULT_CONFIG.psf, ...(c?.psf ?? {}) } };
}

/**
 * Anti-aliasing weight band (pixels from a silhouette): full below EDGE_FULL_PX, none above
 * EDGE_NONE_PX. A silhouette farther than about 0.71 px (half the pixel diagonal) from the centre
 * does not cross the pixel. MODEL PARAMETERS, used by the CPU reference and SEG_FS alike.
 */
export const EDGE_FULL_PX = 0.35;
export const EDGE_NONE_PX = 0.75;
/** Edge segments remembered per pixel for the anti-aliasing sub-samples (shader array length). */
export const EDGE_LIST_MAX = 8;

/** Rotated-grid sub-sample offsets (pixels) and the pulse time fraction paired with each. */
export const SUBSAMPLES: [number, number, number][] = [
  [0.125, 0.375, -0.375],
  [0.375, -0.125, -0.125],
  [-0.125, -0.375, 0.125],
  [-0.375, 0.125, 0.375],
];

/** Camera quantities derived once per frame. */
export interface CamInfo {
  src: [number, number, number];
  detC: [number, number, number];
  detU: [number, number, number];
  detV: [number, number, number];
  /** unit central ray */
  n: [number, number, number];
  sid: number;
  /** detector pixel pitch (mm) */
  mmPerPx: number;
  res: number;
  /** projection: u = mag * (d . pu) - ku, v likewise, with d = p - src */
  pu: [number, number, number];
  pv: [number, number, number];
  ku: number;
  kv: number;
}

export function camInfo(cam: XrayCamera, res: number): CamInfo {
  const src: [number, number, number] = [cam.src.x, cam.src.y, cam.src.z];
  const detC: [number, number, number] = [cam.detC.x, cam.detC.y, cam.detC.z];
  const detU: [number, number, number] = [cam.detU.x, cam.detU.y, cam.detU.z];
  const detV: [number, number, number] = [cam.detV.x, cam.detV.y, cam.detV.z];
  const N = [detC[0] - src[0], detC[1] - src[1], detC[2] - src[2]];
  const sid = Math.hypot(N[0], N[1], N[2]);
  const n: [number, number, number] = [N[0] / sid, N[1] / sid, N[2] / sid];
  const hu2 = detU[0] ** 2 + detU[1] ** 2 + detU[2] ** 2;
  const hv2 = detV[0] ** 2 + detV[1] ** 2 + detV[2] ** 2;
  const pu: [number, number, number] = [detU[0] / hu2, detU[1] / hu2, detU[2] / hu2];
  const pv: [number, number, number] = [detV[0] / hv2, detV[1] / hv2, detV[2] / hv2];
  const ku = N[0] * pu[0] + N[1] * pu[1] + N[2] * pu[2];
  const kv = N[0] * pv[0] + N[1] * pv[1] + N[2] * pv[2];
  return { src, detC, detU, detV, n, sid, mmPerPx: (2 * Math.sqrt(hu2)) / res, res, pu, pv, ku, kv };
}

/** Unit ray direction through detector pixel coordinates (px, py), origin bottom-left (as gl_FragCoord). */
export function rayThroughPixel(ci: CamInfo, px: number, py: number, out: number[] = [0, 0, 0]): number[] {
  const u = (px / ci.res) * 2 - 1;
  const v = (py / ci.res) * 2 - 1;
  const x = ci.detC[0] + u * ci.detU[0] + v * ci.detV[0] - ci.src[0];
  const y = ci.detC[1] + u * ci.detU[1] + v * ci.detV[1] - ci.src[1];
  const z = ci.detC[2] + u * ci.detU[2] + v * ci.detV[2] - ci.src[2];
  const l = Math.hypot(x, y, z);
  out[0] = x / l;
  out[1] = y / l;
  out[2] = z / l;
  return out;
}

/** localStorage key and URL parameter of the segment-pass feature flag. */
export const SEGMENTS_FLAG = "cathmaster.xraySegments";

/**
 * Feature flag for switching the renderer from ribbon tubes to the segment pass: true when the
 * URL has `?segments=1` or localStorage[SEGMENTS_FLAG] is "1"; `?segments=0` forces it off.
 * Defaults to `fallback` (false until the integrator turns it on). Safe outside a browser.
 */
export function segmentsEnabled(fallback = false): boolean {
  try {
    if (typeof location !== "undefined") {
      const q = new URLSearchParams(location.search).get("segments");
      if (q === "1") return true;
      if (q === "0") return false;
    }
    if (typeof localStorage !== "undefined") {
      const v = localStorage.getItem(SEGMENTS_FLAG);
      if (v === "1") return true;
      if (v === "0") return false;
    }
  } catch {
    // storage blocked: fall through
  }
  return fallback;
}
