// ---------------------------------------------------------------------------
// Vendor-neutral imaging-system profiles for the detector and processing chain.
//
// Each profile is named by behaviour, not by product. The numbers are fitted to
// statistics measured on public cine libraries in the project (scripts in
// docs/realism/research; see docs/realism/facts/S2.md for the method behind
// every target). Values marked "model parameter" are tuning constants of the
// simulation, not measurements; they were adjusted until the measured
// statistics of captured frames matched the targets quoted beside them.
//
//   Profile A  fine, slightly sharpened grain; nearly flat noise versus grey;
//              no dark border (outer 2 px about 8 grey levels darker).
//              Fitted to the CoronaryDominance domain-shift set (lossless npz).
//   Profile B  smooth, strongly correlated grain; soft dark frame about 16 px
//              wide with rounded corners. Fitted to the CADICA PNG set.
//   Profile C  coarse, nearly white grain at a higher level; thin bright-edge
//              rim. Fitted to the CoronaryDominance "main" JPEG set.
//
// All pixel distances are in 512-equivalent pixels (the library frame size);
// the renderer converts them to its own resolution.
// ---------------------------------------------------------------------------

export type SystemProfileId = "A" | "B" | "C";

export interface SystemProfile {
  id: SystemProfileId;
  /** short neutral label for any UI */
  label: string;
  description: string;
  detector: {
    /**
     * Gaussian detector MTF sigma (x, y) in 512-equivalent px, applied to signal and quantum
     * noise together. Fitted so the lag-1/lag-2 noise autocorrelation of captures resampled to
     * 512 px matches the profile's source library (noise2.py). Not a vendor specification.
     */
    mtfSigma512: [number, number];
    /** detected quanta per entrance quantum (scales ImageParams.counts); model parameter */
    quantumEfficiency: number;
    /** additive electronic noise SD in detected quanta per pixel, white, after the MTF; model parameter */
    electronicSigma: number;
    /**
     * Grey-independent noise floor: SD in display grey levels (768 px render), shaped by the
     * same MTF and processing as the quantum noise. Model parameter tuned so the dark/bright
     * noise SD ratio on captures matches the source library.
     */
    floorGrey: number;
    /**
     * The floor scales with exposure as (floorRefCounts / counts)^0.5, so lower-dose frames
     * (fluoroscopy, or a dose-rate controller at its limit) are noisier at the same grey level.
     * floorRefCounts is the cine AEC target used by the scene builder (model parameter).
     */
    floorRefCounts: number;
    /**
     * Optional dark-side weighting of the floor: the floor SD at display grey g is multiplied by
     * exp(floorDarkSlope x (floorG0 - g) / 0.25), clamped to 0.5..2, so its ratio between greys a
     * quarter of the range apart is exp(floorDarkSlope). 0 or absent = a floor constant in grey.
     * Model parameter, tuned so the dark/bright temporal noise SD ratio (grey 96-127 against
     * 160-191, noise2.py) stays at or above 1.1 in every view family.
     */
    floorDarkSlope?: number;
    /** display grey (0..1) at which the dark weighting is 1 (default 0.55, about grey 140) */
    floorG0?: number;
  };
  processing: {
    /**
     * Laplacian band gains at the nominal edge strength (ImageParams.edge 0.75), one per pyramid
     * band (PYR_LEVELS - 1 = 7). Band 0 holds detail of about 1-2 render px, band k about 2^k to
     * 2^(k+1) px (at 768 px; band 6 is 64-128 px, about 17-35 mm at the detector). Gains above the
     * residual gain in the middle bands make the large-border halo (edge2.py).
     */
    bandGains: number[];
    /** gain of the coarsest (residual) level at the nominal harmonisation (ImageParams.drc 0.7) */
    residualGain: number;
    /**
     * noise-adaptive soft coring per band: band values well below k x the band's noise SD are
     * attenuated by up to depth[b] (0..1); large values (edges, vessels) pass unchanged
     */
    coring: { k: number; depth: number[] };
    /** S-shaped display LUT: logistic slope, midpoint (0..1 of the window) and output gamma */
    lut: { slope: number; mid: number; gamma: number };
    /**
     * auto-window targets: display grey of the 5th, 50th and 95th grey percentiles over the
     * central 76% of the field, and the smoothing lag in frames. toneRatioMax bounds how much
     * the tone slopes either side of the median may differ to bring the median to its target
     * (1 = a plain two-parameter window). p50Band, when given, replaces the p50 point target: the
     * median is pulled only into the band (solveWindowBand), which keeps more tone slope in the
     * darker half.
     */
    window: {
      p5: number;
      p50?: number;
      p95: number;
      lagFrames: number;
      toneRatioMax?: number;
      p50Band?: [number, number];
      /**
       * Narrowest equivalent linear window (log units; default 0.25): a frame whose p5-p95 range is narrow
       * (a projection filled by the heart) is not stretched beyond this, so its p95 stays below the target
       * as on the library frames of such views.
       */
      minWidth?: number;
    };
  };
  temporal: {
    /** recursive weight on the previous frame during fluoroscopy (cine uses ImageParams.recursive) */
    fluoroRecursion: number;
    /** motion-adaptive recursion: weight falls as exp(-(diff / (c x noise SD))^2) */
    motionC: number;
    /** run-start settling: noise SD x (1 + amp x exp(-k / tau)) for frame k of a run */
    settleAmp: number;
    settleTau: number;
  };
  field: {
    /** edge falloff model: multiplicative darkening 1 - amp x exp(-(d / lambda)^power), d from the edge */
    amp: number;
    lambda512: number;
    power: number;
    /** rounded field corners, radius in 512-equivalent px (0 = square corners) */
    cornerRadius512: number;
    /** radial falloff 1 - vignette x r^2 (r = 1 at the edge middle) */
    vignette: number;
  };
}

/*
 * Measured targets (512 px library frames; noise2.py, noisebin.py, field.py, settle.py):
 *   A  temporal noise SD median 3.28 (2.51-3.87); dark/bright ratio 1.13 (0.75-1.49);
 *      lag-1 0.30 (0.16-0.54), lag-2 -0.05; frame-to-frame correlation 0.08;
 *      edge bands 0-2/2-4/4-8/8-16/16-32 px 137.4/140.8/143.9/145.4/145.1.
 *   B  noise SD median 2.0 (1.24-3.47); lag-1 0.575, lag-2 0.22;
 *      edge bands 77.7/85.7/98.5/117.6/132.5, 32-64 px 134.4; corner blocks 45-99.
 *   C  noise SD 4.83-5.28; lag-1 0.02-0.11; edge bands 137.2/144.4/146.0/145.1/144.6.
 *   Settling (A, 20 runs): sigma_k = sigma_inf (1 + 0.58 exp(-k/3)).
 *   Grey percentiles mid-run (A-type library, pct.py): p5 93-98, p50 129-145, p95 196-219.
 */
export const SYSTEM_PROFILES: Record<SystemProfileId, SystemProfile> = {
  A: {
    id: "A",
    label: "Profile A",
    description: "Fine, slightly sharpened grain; flat noise versus grey; no dark border.",
    detector: {
      mtfSigma512: [0.38, 0.47],
      // quantumEfficiency, floorGrey and floorDarkSlope were fitted together on six view families
      // (noise2.py, contrast runs): the higher efficiency gives the grey-dependent quantum part
      // less weight, which narrows the view-to-view spread of the dark/bright ratio (1.07-1.31
      // with 1.1 / 4.4 / 0.09; 1.13-1.22 with 2.2 / 4.6 / 0.13; 1.03-1.17 with no dark weighting)
      // wave 2 (C1): with the stronger harmonisation the window stretches the log signal more, so the
      // quantum part was refitted (2.2 -> 2.7) to keep the temporal noise SD in band, and the dark
      // weighting lowered (0.13 -> 0.05) to bring the bright-grey noise rows (200-239) into band while
      // the dark/bright ratio stays inside its band (docs/realism/wave2/C1.md)
      quantumEfficiency: 2.7,
      electronicSigma: 2.0,
      floorGrey: 4.6,
      floorRefCounts: 1500,
      floorDarkSlope: 0.05,
      floorG0: 0.55,
    },
    processing: {
      // Bands 5 and 6 (8-35 mm at the detector: heart borders, domes, spine edges) and the residual
      // were refitted in wave 2 (C1) together with the thorax anatomy (lungs reaching the heart and the
      // spine, domes over the lower heart): strong harmonisation of the whole-field range (residual
      // 0.25) with the border scales kept above it (0.6, 0.4) and the mid bands (2-4) stepping down
      // gradually (1.3, 1.1, 0.9; a steep step drew a large-border overshoot and lengthened the
      // contrast plateau), so the window spends its grey levels on the lung markings, ribs, bone and
      // vessels. Fitted on the lung texture rows, thin dark lines and
      // the pre-contrast local contrast of the six reference views (docs/realism/wave2/C1.md).
      // Model parameters. (Wave 1 had 0.42 for bands 5, 6 and the residual, on the old anatomy.)
      bandGains: [1.7, 1.35, 1.3, 1.1, 0.9, 0.6, 0.4],
      residualGain: 0.25,
      coring: { k: 1.2, depth: [0, 0.15, 0.3, 0.2, 0, 0, 0] },
      lut: { slope: 3.2, mid: 0.5, gamma: 1.0 },
      window: { p5: 95, p50: 137, p95: 206, lagFrames: 3, toneRatioMax: 2.5 },
    },
    temporal: { fluoroRecursion: 0.4, motionC: 2.5, settleAmp: 0.58, settleTau: 3 },
    field: { amp: 0.07, lambda512: 3.0, power: 1, cornerRadius512: 0, vignette: 0.02 },
  },
  B: {
    id: "B",
    label: "Profile B",
    description: "Smooth, correlated grain at a lower level; soft dark frame with rounded corners.",
    detector: {
      mtfSigma512: [0.6, 0.6],
      quantumEfficiency: 2.0,
      electronicSigma: 2.0,
      floorGrey: 2.6,
      floorRefCounts: 1500,
    },
    processing: {
      // bands 5 and 6 at the residual gain: the six-level processing of wave 1 exactly
      bandGains: [0.85, 1.15, 1.35, 1.25, 1.1, 0.45, 0.45],
      residualGain: 0.45,
      coring: { k: 1.0, depth: [0, 0, 0, 0, 0, 0, 0] },
      lut: { slope: 3.0, mid: 0.5, gamma: 1.0 },
      window: { p5: 92, p50: 137, p95: 200, lagFrames: 3, toneRatioMax: 2.5 },
    },
    temporal: { fluoroRecursion: 0.4, motionC: 2.5, settleAmp: 0.58, settleTau: 3 },
    field: { amp: 0.44, lambda512: 10.2, power: 1.35, cornerRadius512: 24, vignette: 0.0 },
  },
  C: {
    id: "C",
    label: "Profile C",
    description: "Coarse, nearly white grain at a higher level; thin edge rim.",
    detector: {
      mtfSigma512: [0.25, 0.28],
      quantumEfficiency: 0.5,
      electronicSigma: 2.0,
      floorGrey: 7.9,
      floorRefCounts: 1500,
    },
    processing: {
      // bands 5 and 6 at the residual gain: the six-level processing of wave 1 exactly
      bandGains: [1.15, 1.3, 1.3, 1.2, 1.06, 0.42, 0.42],
      residualGain: 0.42,
      coring: { k: 1.0, depth: [0, 0, 0, 0, 0, 0, 0] },
      lut: { slope: 3.2, mid: 0.5, gamma: 1.0 },
      window: { p5: 95, p50: 137, p95: 206, lagFrames: 3, toneRatioMax: 2.5 },
    },
    temporal: { fluoroRecursion: 0.4, motionC: 2.5, settleAmp: 0.58, settleTau: 3 },
    field: { amp: 0.11, lambda512: 1.02, power: 1, cornerRadius512: 0, vignette: 0.02 },
  },
};

export const DEFAULT_PROFILE: SystemProfileId = "A";

export function getProfile(id?: SystemProfileId | string | null): SystemProfile {
  return SYSTEM_PROFILES[(id as SystemProfileId) ?? DEFAULT_PROFILE] ?? SYSTEM_PROFILES[DEFAULT_PROFILE];
}

/** Noise SD multiplier for frame k (0 = first frame) of an acquisition run. */
export function settleFactor(k: number, p: SystemProfile = SYSTEM_PROFILES.A): number {
  if (!(k >= 0)) return 1;
  return 1 + p.temporal.settleAmp * Math.exp(-k / p.temporal.settleTau);
}

/**
 * Display-domain field falloff at a point (CPU reference of the shader, for tests).
 * u, v in 0..1 across the image; res512 is the image width in 512-equivalent px (512).
 */
export function fieldGain(u: number, v: number, p: SystemProfile, circle = false): number {
  const f = p.field;
  const W = 512;
  const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  let d: number;
  let inside = 1;
  if (circle) {
    const r = Math.hypot(u - 0.5, v - 0.5) * 2;
    d = (0.985 - r) * (W / 2);
    inside = smooth(-0.015 * W, 0.015 * W, d);
  } else {
    const x = Math.min(u, 1 - u) * W;
    const y = Math.min(v, 1 - v) * W;
    const R = f.cornerRadius512;
    if (R > 0 && x < R && y < R) {
      d = R - Math.hypot(R - x, R - y);
      inside = smooth(-0.7, 0.7, d);
    } else d = Math.min(x, y);
  }
  const fall = 1 - f.amp * Math.exp(-Math.pow(Math.max(0, d) / f.lambda512, f.power));
  const r2 = ((u - 0.5) * 2) ** 2 + ((v - 0.5) * 2) ** 2;
  return fall * (1 - f.vignette * r2) * inside;
}
