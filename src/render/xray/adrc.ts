// ---------------------------------------------------------------------------
// Automatic dose-rate control (ADRC) for the cath-lab imaging chain.
//
// A closed loop from the metered detector signal to the X-ray technique:
//
//   metered signal (or path length) -> equivalent patient thickness D
//   D -> program curve -> kVp, tube current, pulse width, Cu filter
//   technique -> air kerma at the reference point, detector dose, quanta,
//                iodine / metal contrast factors for the renderer
//
// The controller follows the structure AAPM TG-125 describes (Rauch et al. 2012,
// sections V-VII): a comparator holds the detector signal at a calibrated
// reference by moving along a pre-programmed trajectory; tube current changes
// first, then pulse width, then kVp, and the Cu spectral filter steps down as the
// patient gets thicker. Separate programs exist for fluoroscopy (low, normal, high
// dose levels) and cine acquisition, at 7.5, 15 or 30 pulses per second.
//
// Physics:
// - Tube output, patient transmission, detected quanta and the spectral weighting
//   of iodine, steel, bone and water come from SpekPy (Poludniowski et al. 2021,
//   doi 10.1002/mp.14945) spectra, fitted per (kVp, Cu) node. The script and the
//   fit errors are in docs/realism/facts/S6.md.
// - Regulatory limits: 21 CFR 1020.32(d) air kerma rate limits (88 mGy/min, or
//   176 mGy/min with high-level control), measured for a C-arm 30 cm in front of
//   the image receptor; recording (cine) is exempt under (d)(2)(iii)(B).
// - Every other constant is either quoted in docs/realism/facts/S6.md or named
//   here as a model parameter.
//
// Units: lengths in mm unless named *Cm; air kerma in mGy (per pulse) or mGy/min;
// detector dose in nGy per pulse; tube current in mA during the pulse.
// ---------------------------------------------------------------------------

import type { CArm } from "../../types";
import type { Snapshotable } from "../../simulation/session/types";

// ---------------------------------------------------------------------------
// Settings and outputs
// ---------------------------------------------------------------------------

export type AdrcMode = "fluoro" | "cine";
export type FluoroLevel = "low" | "normal" | "high";
/**
 * Fluoroscopy pulse and cine frame rates (per s). 3.75 is the lowest fluoroscopy rate the PCI lab
 * offers (hb-lab-and-radiation request 1: 3.75, 7.5 and 15 fps; Brilakis 28.2: 7.5 fps gives half the
 * dose of 15 fps). The dose per pulse does not depend on the rate here, so the dose rate scales with it.
 */
export type PulseRate = 3.75 | 7.5 | 15 | 30;

export interface AdrcSettings {
  mode: AdrcMode;
  /** fluoroscopy dose level (ignored for cine) */
  fluoroLevel: FluoroLevel;
  /** fluoroscopy pulse rate */
  fluoroPps: PulseRate;
  /** cine frame rate */
  cinePps: PulseRate;
  /** detector field, full width (mm): 250, 230, 200, 170, 150 ... */
  fieldMm: number;
  /** anti-scatter grid in (true) or air-gap technique without grid (false) */
  grid: boolean;
  /** source-to-image distance (mm); default 1060 as in sceneBuilder */
  sidMm?: number;
  /** source-to-isocentre distance (mm); default 760 as in sceneBuilder */
  sodMm?: number;
}

export const DEFAULT_SETTINGS: AdrcSettings = {
  mode: "fluoro",
  fluoroLevel: "normal",
  fluoroPps: 15,
  cinePps: 15,
  fieldMm: 230,
  grid: true,
};

export interface Technique {
  kvp: number;
  /** tube current during the pulse (mA) */
  mA: number;
  /** pulse width (ms) */
  pulseMs: number;
  /** added copper filter (mm) */
  cuMm: number;
  /** tube loading per pulse (mAs) */
  mAs: number;
  focus: "small" | "large";
}

export type AdrcLimit =
  | "none"
  /** the 88 mGy/min regulatory air kerma rate limit binds (normal fluoroscopy) */
  | "akr"
  /** the 176 mGy/min high-level control limit binds */
  | "akr-high"
  /** tube current, power or pulse-width limits bind at maximum kVp */
  | "tube";

/** What the renderer needs from the exposure (feeds ImageParams; see docs/realism/wave1/S6.md). */
export interface AdrcImage {
  /** detected quanta per pixel at the meter (renderer calibration: reference cine = COUNTS_AT_REFERENCE) */
  counts: number;
  /** iodine effectiveness relative to the reference beam (75 kVp, 0.1 mm Cu, 20 cm water) */
  iodineGain: number;
  /** stainless-steel effectiveness relative to the reference beam */
  metalGain: number;
  /** cortical-bone effectiveness relative to the reference beam */
  boneGain: number;
  /** water / soft-tissue effectiveness relative to the reference beam */
  softGain: number;
  /** scatter-to-primary ratio with the grid in, scaled by thickness (model; see sprFor) */
  spr: number;
  /** grid in or out (the detector stage applies its own grid-out scatter factor) */
  grid: boolean;
  /** pulse width (ms), for motion blur */
  pulseWidthMs: number;
  /** quantum noise SD relative to reference cine, 1/sqrt(counts / reference) */
  noiseRel: number;
}

export interface AdrcState {
  frame: number;
  settings: AdrcSettings;
  technique: Technique;
  /** controller's equivalent water thickness (cm), the position on the program curve */
  equivCm: number;
  /** water-equivalent thickness of the patient on this frame (cm) */
  patientCm: number;
  /** calibrated detector dose target (nGy per pulse) */
  targetNGy: number;
  /** detector air kerma achieved on this frame (nGy per pulse, behind the grid) */
  detectorNGy: number;
  /** detectorNGy / targetNGy */
  signalRel: number;
  limit: AdrcLimit;
  /** pulses per second */
  pps: number;
  /** air kerma per pulse at the interventional reference point, free in air (mGy) */
  kermaIrpPerPulseMGy: number;
  /** air kerma rate at the reference point (mGy/min) */
  kermaRateIrpMGyMin: number;
  /** air kerma rate at the 21 CFR 1020.32 measurement point (mGy/min) */
  akrFdaMGyMin: number;
  /** applicable regulatory limit (mGy/min), Infinity for cine */
  akrLimitMGyMin: number;
  /** first half-value layer of the beam (mm Al) */
  hvlMmAl: number;
  image: AdrcImage;
  /**
   * Where this frame's thickness estimate came from: the renderer's meter reading, the analytic
   * patient path (no meter wired, or a meter reading that could not be matched to an exposure this
   * controller made), or none (first frame, nothing metered yet).
   */
  meterSource?: AdrcMeterSource;
  /** running count of meter readings that could not be matched and fell back to the analytic path */
  meterMisses?: number;
}

export type AdrcMeterSource = "meter" | "analytic" | "analytic-fallback" | "none";

// ---------------------------------------------------------------------------
// Constants (sources in docs/realism/facts/S6.md)
// ---------------------------------------------------------------------------

export const SID_MM = 1060;
export const SOD_MM = 760;
/** 21 CFR 1020.32(k)(4)(ii): reference location 15 cm from the isocentre toward the source */
export const IRP_FROM_ISO_MM = 150;
/** 21 CFR 1020.32(d) via TG-125 III.C.2(iii): C-arm AKR measured 30 cm from the image receptor input */
export const FDA_POINT_FROM_DETECTOR_MM = 300;
/** 21 CFR 1020.32(d)(2)(ii) and (iii)(C) */
export const AKR_LIMIT_MGY_MIN = 88;
export const AKR_LIMIT_HIGH_MGY_MIN = 176;

/**
 * Detector dose per pulse for normal-level fluoroscopy at a 30 cm field: TG-125 III.A gives
 * 30 uR/s (263 nGy/s) at 30 frames/s for an image intensifier and says flat panels need 2-4x
 * that; the lower end (2x) is used: 2 * 263 / 30 = 17.5 nGy per pulse.
 */
export const FLUORO_NORMAL_NGY_AT_30CM = (2 * 263) / 30;
/** AAPM Report 70: each dose-level step doubles or halves the detector input (low / normal / high) */
export const FLUORO_LEVEL_FACTOR: Record<FluoroLevel, number> = { low: 0.5, normal: 1, high: 2 };
/**
 * Detector dose per cine frame at a 23 cm field: AAPM Report 70 gives 10-20 uR/frame for image
 * intensifier cine at 23 cm; TG-125 III.A says flat panels acquire at slightly lower detector
 * dose than intensifiers, so the lower end is used: 10 uR = 87.5 nGy (TG-125's own conversion,
 * 20 uR/s = 175 nGy/s).
 */
export const CINE_NGY_AT_23CM = 87.5;
/** Nickoloff 2011: flat-panel systems raise the detector dose at about 1/FOV as the field shrinks */
export const FOV_DOSE_EXPONENT = 1;

/** Renderer calibration (not physics): detected quanta at the meter for reference cine at 230 mm. */
export const COUNTS_AT_REFERENCE = 1500;
export const REFERENCE_FIELD_MM = 230;
/** reference beam for the contrast gains (matches the ImageParams doc "1 = 75 kV") */
export const REFERENCE_BEAM = { kvp: 75, cuMm: 0.1, waterCm: 20 } as const;

/**
 * Grid signal factor: detector signal per unit primary in front of the grid, grid in vs out.
 * Model parameter: grid in = 0.65 (out = 1). Through the program this lowers the steady-state
 * patient dose rate by 27% for a 20 cm patient at equal field, inside the 23-39% DAP reductions
 * Partridge et al. (Heart 2006) measured clinically for gridless air-gap angiography.
 */
export const GRID_SIGNAL_FACTOR = { in: 0.65, out: 1 } as const;

/** Model parameter: scatter-to-primary ratio with the grid in for the reference 20 cm patient (the renderer's current calibrated value). */
export const SPR_GRID_REFERENCE = 0.75;

/**
 * Table plus mattress transmission at normal incidence, 10 x 10 cm field, from Krajinovic et al.
 * (J Appl Clin Med Phys 2021, Table 4): rows kVp 60..120 step 10, columns Cu 0, 0.1, 0.2, 0.3, 0.6, 0.9 mm.
 */
const TAF_KV = [60, 70, 80, 90, 100, 110, 120];
const TAF_TABLE = [
  [0.694, 0.745, 0.769, 0.783, 0.808, 0.825],
  [0.713, 0.762, 0.785, 0.798, 0.822, 0.833],
  [0.724, 0.772, 0.793, 0.806, 0.827, 0.836],
  [0.734, 0.779, 0.799, 0.81, 0.829, 0.836],
  [0.743, 0.785, 0.805, 0.814, 0.831, 0.836],
  [0.75, 0.79, 0.808, 0.817, 0.832, 0.838],
  [0.756, 0.794, 0.811, 0.823, 0.834, 0.839],
];

// ---------------------------------------------------------------------------
// Program curves
// ---------------------------------------------------------------------------

interface Stage {
  cu: number;
  /** highest kVp this filter is used to before the next (thinner) filter */
  kvCeil: number;
  /** pulse width cap inside this stage (ms) */
  pwCapMs: number;
}

interface Program {
  kvFloor: number;
  kvMax: number;
  maMin: number;
  maMax: number;
  pwMinMs: number;
  powerKw: number;
  focus: "small" | "large";
  stages: Stage[];
}

/**
 * Fluoroscopy program. The filter sequence and kVp break points follow the trajectory TG-125
 * measured on one representative variable-filter system (section VII.C.1): 0.9 mm Cu at 60-63 kVp,
 * 0.6 at 63-75, 0.3 at 75-81, 0.2 at 81-91, 0.1 above. kVp never below 60 (TG-125). Pulse width
 * 6 ms in the heaviest filter, then 6-12.5 ms (TG-125). Tube current 33-107 mA during the pulse
 * (TG-125's 3-20 mA rms at 15 pps over 6-12.5 ms pulses). Maximum kVp 125 (Anthony et al. 2022).
 * Small focal spot power 40 kW (AAPM Report 70: 40-50 kW single exposure).
 */
const FLUORO_PROGRAM: Program = {
  kvFloor: 60,
  kvMax: 125,
  maMin: 33,
  maMax: 107,
  pwMinMs: 6,
  powerKw: 40,
  focus: "small",
  stages: [
    { cu: 0.9, kvCeil: 63, pwCapMs: 6 },
    { cu: 0.6, kvCeil: 75, pwCapMs: 12.5 },
    { cu: 0.3, kvCeil: 81, pwCapMs: 12.5 },
    { cu: 0.2, kvCeil: 91, pwCapMs: 12.5 },
    { cu: 0.1, kvCeil: 125, pwCapMs: 12.5 },
  ],
};

/**
 * Cine program. TG-125 does not cover acquisition, so the filter steps are a model parameter
 * chosen to keep kVp in the 65-80 range AAPM Report 70 recommends for iodine. Pulse width
 * 3-8 ms, up to 800 mA (Report 70's 6 mAs example, 800 mA x 7 ms), large focal spot 80 kW
 * (Report 70: 80-110 kW).
 */
const CINE_PROGRAM: Program = {
  kvFloor: 65,
  kvMax: 125,
  maMin: 100,
  maMax: 800,
  pwMinMs: 3,
  powerKw: 80,
  focus: "large",
  stages: [
    { cu: 0.2, kvCeil: 72, pwCapMs: 8 },
    { cu: 0.1, kvCeil: 80, pwCapMs: 8 },
    { cu: 0.0, kvCeil: 125, pwCapMs: 8 },
  ],
};

// ---------------------------------------------------------------------------
// Spectral physics (fitted SpekPy tables, appended at the end of this file)
// ---------------------------------------------------------------------------

const T_MIN_SEC = 5; // secondary quantities were fitted over 5-45 cm
const T_MAX = 45;

function nodeIndex(arr: readonly number[], v: number): [number, number] {
  if (v <= arr[0]) return [0, 0];
  const n = arr.length - 1;
  if (v >= arr[n]) return [n - 1, 1];
  let i = 0;
  while (i < n - 1 && arr[i + 1] < v) i++;
  return [i, (v - arr[i]) / (arr[i + 1] - arr[i])];
}

function node(ki: number, ci: number): number[] {
  return SPEC_NODES[ki * SPEC_CU.length + ci];
}

function evalNode(n: number[], what: "Y" | "lnT" | "lnq" | "I" | "S" | "B" | "W" | "hvl", tCm: number): number {
  switch (what) {
    case "Y":
      return n[0];
    case "hvl":
      return n[25];
    case "lnT": {
      // fitted over 0-45 cm; beyond, continue with the slope at 45 cm
      const t = Math.min(tCm, T_MAX);
      let v = n[1] * t + n[2] * t * t + n[3] * t * t * t + n[4] * t * t * t * t;
      if (tCm > T_MAX) {
        const s = n[1] + 2 * n[2] * t + 3 * n[3] * t * t + 4 * n[4] * t * t * t;
        v += s * (tCm - T_MAX);
      }
      return v;
    }
    default: {
      const off = what === "lnq" ? 5 : what === "I" ? 9 : what === "S" ? 13 : what === "B" ? 17 : 21;
      const t = Math.min(Math.max(tCm, T_MIN_SEC), T_MAX);
      return n[off] + n[off + 1] * t + n[off + 2] * t * t + n[off + 3] * t * t * t;
    }
  }
}

/** Bilinear interpolation over (kVp, Cu); quantities that vary geometrically are interpolated in log. */
function spec(what: "Y" | "lnT" | "lnq" | "I" | "S" | "B" | "W" | "hvl", kv: number, cu: number, tCm = 0): number {
  const [ki, kf] = nodeIndex(SPEC_KV, kv);
  const [ci, cf] = nodeIndex(SPEC_CU, cu);
  const logIt = what === "Y";
  const g = (a: number, b: number) => {
    const v = evalNode(node(a, b), what, tCm);
    return logIt ? Math.log(v) : v;
  };
  const v00 = g(ki, ci);
  const v01 = g(ki, ci + 1);
  const v10 = g(ki + 1, ci);
  const v11 = g(ki + 1, ci + 1);
  const v = (1 - kf) * ((1 - cf) * v00 + cf * v01) + kf * ((1 - cf) * v10 + cf * v11);
  return logIt ? Math.exp(v) : v;
}

/** Tube output: air kerma per mAs at 1 m, free in air (uGy/mAs). */
export function tubeOutput(kvp: number, cuMm: number): number {
  return spec("Y", kvp, cuMm);
}

/** Primary air-kerma transmission through a water slab (narrow beam). */
export function waterTransmission(kvp: number, cuMm: number, waterCm: number): number {
  return Math.exp(spec("lnT", kvp, cuMm, Math.max(0, waterCm)));
}

/** First half-value layer (mm Al) of the unattenuated beam. */
export function beamHvl(kvp: number, cuMm: number): number {
  return spec("hvl", kvp, cuMm);
}

/** Effective detected quanta per uGy behind the patient (arbitrary area unit; use as a ratio). */
export function quantaPerUGy(kvp: number, cuMm: number, waterCm: number): number {
  return Math.exp(spec("lnq", kvp, cuMm, waterCm));
}

/** Detector-signal-weighted mean mass attenuation coefficients (cm^2/g) behind the patient. */
export function effectiveMu(material: "iodine" | "steel" | "bone" | "water", kvp: number, cuMm: number, waterCm: number): number {
  const k = material === "iodine" ? "I" : material === "steel" ? "S" : material === "bone" ? "B" : "W";
  return spec(k, kvp, cuMm, waterCm);
}

/** Table plus mattress transmission (Krajinovic 2021 Table 4), with the oblique factor TAF^(sec - 1) from the same paper. */
export function tableTransmission(kvp: number, cuMm: number, secIncidence = 1): number {
  const [ki, kf] = nodeIndex(TAF_KV, kvp);
  const [ci, cf] = nodeIndex(SPEC_CU, cuMm);
  const r0 = TAF_TABLE[ki];
  const r1 = TAF_TABLE[ki + 1];
  const t0 = (1 - cf) * r0[ci] + cf * r0[ci + 1];
  const t1 = (1 - cf) * r1[ci] + cf * r1[ci + 1];
  const taf = (1 - kf) * t0 + kf * t1;
  return Math.pow(taf, Math.max(1, secIncidence));
}

// ---------------------------------------------------------------------------
// Patient path
// ---------------------------------------------------------------------------

export interface PatientPathOptions {
  /** body habitus scale as in thorax.ts (1 average, 0.85 slim, 1.25 large) */
  habitus?: number;
  /** thorax genome lateral and antero-posterior chest scales on top of habitus (default 1) */
  width?: number;
  depth?: number;
  /** distance from the isocentre down to the table top (mm); default: iso at the body centre line */
  isoAboveTableMm?: number;
  /** explicit body half axes (mm), e.g. thorax.anat[0].half[0] and [2]; overrides habitus/width/depth */
  body?: { a: number; b: number };
}

export interface PatientPath {
  /** water-equivalent thickness along the central ray (cm) */
  waterCm: number;
  /** the beam passes through the table and mattress before the patient */
  tableInBeam: boolean;
  /** secant of the beam's incidence on the table plane */
  tableSec: number;
}

/**
 * Body cross-section at habitus 1, as in thorax.ts bodyFrame (BODY shape: centre z -46 mm,
 * half axes 176 x 126 mm). Callers with a patient-specific thorax should pass PatientPathOptions.body.
 */
export const BODY_HALF_X_MM = 176;
export const BODY_HALF_Z_MM = 126;
export const BODY_CENTRE_Z_MM = -46;
/**
 * Path model parameters. AP_DENSITY sets the standard (habitus 1) AP water-equivalent thickness
 * to 20 cm, the standard adult thickness used for cardiac dose reference measurements (model).
 * LAT_DENSITY (lungs fill more of a lateral path) and CC_EXTRA_CM (an oblique craniocaudal ray
 * crosses the diaphragm and upper abdomen or the shoulder girdle) were fitted so that the
 * normal-fluoroscopy air kerma rate rises 3.7x from PA to LAO 100 and about 2.5x from PA to
 * 30 degrees cranial or caudal, the ratios Kuon et al. (JACC 2004) measured on an
 * anthropomorphic phantom. The fit is in dose.test.ts ("matches Kuon 2004 angulation ratios").
 */
export const PATH_MODEL = {
  AP_DENSITY: 200 / (2 * BODY_HALF_Z_MM),
  LAT_DENSITY: 0.767,
  CC_EXTRA_CM: 1.15,
  /** model: half width of the cath table (mm) */
  TABLE_HALF_WIDTH_MM: 250,
};

/**
 * Water-equivalent path length along the central ray for a C-arm angle (the analytic stand-in
 * for the renderer's metered transmission until the meter read-back is wired).
 */
export function patientPath(cArm: CArm, opts: PatientPathOptions = {}): PatientPath {
  const k = opts.habitus ?? 1;
  const a = opts.body?.a ?? BODY_HALF_X_MM * k * (opts.width ?? 1);
  const b = opts.body?.b ?? BODY_HALF_Z_MM * k * (opts.depth ?? 1);
  const kc = Math.sqrt((a * b) / (BODY_HALF_X_MM * BODY_HALF_Z_MM)); // size scale for the cranio-caudal term
  const th = (cArm.laoRao * Math.PI) / 180;
  const ph = (cArm.cranialCaudal * Math.PI) / 180;
  // beam direction in the transverse plane (x patient left, z anterior); the chord through the centre
  const dx = Math.sin(th);
  const dz = Math.cos(th);
  const chord = 2 / Math.sqrt((dx / a) ** 2 + (dz / b) ** 2); // mm
  const s2 = dx * dx;
  const rho = PATH_MODEL.AP_DENSITY + (PATH_MODEL.LAT_DENSITY - PATH_MODEL.AP_DENSITY) * s2;
  const cosP = Math.max(0.5, Math.cos(ph));
  const waterCm = (chord * rho) / 10 / cosP + PATH_MODEL.CC_EXTRA_CM * kc * Math.abs(Math.sin(ph));
  // table: the tube is below the table when the beam travels upward (towards anterior)
  const up = Math.cos(th) * Math.cos(ph);
  const h = opts.isoAboveTableMm ?? b; // default: iso at the body centre, table at the back
  let tableInBeam = false;
  let tableSec = 1;
  if (up > 0.05) {
    const lateralAtTable = h * Math.abs(Math.tan(th));
    tableInBeam = lateralAtTable < PATH_MODEL.TABLE_HALF_WIDTH_MM;
    tableSec = 1 / up;
  }
  return { waterCm, tableInBeam, tableSec };
}

/** Compatibility helper for sceneBuilder: water-equivalent thickness (cm) for a C-arm angle. */
export function patientWaterEquivalentCm(cArm: CArm, habitus = 1): number {
  return patientPath(cArm, { habitus }).waterCm;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function geom(s: AdrcSettings) {
  const sid = s.sidMm ?? SID_MM;
  const sod = s.sodMm ?? SOD_MM;
  const dIrp = sod - IRP_FROM_ISO_MM;
  const dFda = sid - FDA_POINT_FROM_DETECTOR_MM;
  return { sid, sod, dIrp, dFda };
}

export function targetDetectorNGy(s: AdrcSettings): number {
  const field = Math.max(50, s.fieldMm);
  if (s.mode === "cine") return CINE_NGY_AT_23CM * Math.pow(230 / field, FOV_DOSE_EXPONENT);
  return FLUORO_NORMAL_NGY_AT_30CM * FLUORO_LEVEL_FACTOR[s.fluoroLevel] * Math.pow(300 / field, FOV_DOSE_EXPONENT);
}

export function ppsOf(s: AdrcSettings): number {
  return s.mode === "cine" ? s.cinePps : s.fluoroPps;
}

export function akrLimitOf(s: AdrcSettings): number {
  if (s.mode === "cine") return Infinity; // recording exemption, 21 CFR 1020.32(d)(2)(iii)(B)
  return s.fluoroLevel === "high" ? AKR_LIMIT_HIGH_MGY_MIN : AKR_LIMIT_MGY_MIN;
}

/** Air kerma per pulse at the reference point, free in air (mGy). */
export function kermaIrpPerPulse(t: Technique, s: AdrcSettings): number {
  const { dIrp } = geom(s);
  return (tubeOutput(t.kvp, t.cuMm) * t.mAs * (1000 / dIrp) ** 2) / 1000;
}

/** Detector air kerma per pulse (nGy) behind a water patient, through table (if in beam) and grid. */
export function detectorDose(t: Technique, s: AdrcSettings, waterCm: number, tableSec: number | null): number {
  const { sid } = geom(s);
  const taf = tableSec == null ? 1 : tableTransmission(t.kvp, t.cuMm, tableSec);
  const grid = s.grid ? GRID_SIGNAL_FACTOR.in : GRID_SIGNAL_FACTOR.out;
  return tubeOutput(t.kvp, t.cuMm) * t.mAs * (1000 / sid) ** 2 * waterTransmission(t.kvp, t.cuMm, waterCm) * taf * grid * 1000;
}

function programOf(s: AdrcSettings): Program {
  return s.mode === "cine" ? CINE_PROGRAM : FLUORO_PROGRAM;
}

function mkTech(p: Program, kvp: number, mA: number, pulseMs: number, cuMm: number): Technique {
  return { kvp, mA, pulseMs, cuMm, mAs: (mA * pulseMs) / 1000, focus: p.focus };
}

// ---------------------------------------------------------------------------
// Trajectory: the technique the program selects for a nominal water thickness
// ---------------------------------------------------------------------------

interface TrajPoint {
  tech: Technique;
  limit: AdrcLimit;
}

/** maximum tube current at kVp under the program's current and power limits */
function maMaxAt(p: Program, kv: number): number {
  return Math.min(p.maMax, (p.powerKw * 1000) / kv);
}

/** Program solution for a nominal water thickness, before regulatory limits. */
function solveNominal(p: Program, s: AdrcSettings, tCm: number, target: number): { tech: Technique; met: boolean } {
  const perMas = (kv: number, cu: number) => detectorDose(mkTech(p, kv, 1000, 1, cu), s, tCm, 1); // nGy per mAs
  let kvLo = p.kvFloor;
  let last: { tech: Technique; met: boolean } | null = null;
  for (let i = 0; i < p.stages.length; i++) {
    const st = p.stages[i];
    const kvCeil = Math.min(st.kvCeil, p.kvMax);
    const lo = Math.min(kvLo, kvCeil);
    const need = (kv: number) => target / perMas(kv, st.cu); // mAs
    const cap = (kv: number) => (maMaxAt(p, kv) * st.pwCapMs) / 1000; // mAs
    const m0 = need(lo);
    if (m0 <= cap(lo)) {
      // tube current first, then pulse width (TG-125 step 8)
      const maTop = maMaxAt(p, lo);
      let mA = (m0 * 1000) / p.pwMinMs;
      let pw = p.pwMinMs;
      if (mA > maTop) {
        mA = maTop;
        pw = (m0 * 1000) / maTop;
      }
      mA = Math.max(p.maMin, mA);
      return { tech: mkTech(p, lo, mA, pw, st.cu), met: true };
    }
    // then kVp, inside this filter's range
    if (need(kvCeil) <= cap(kvCeil)) {
      let a = lo;
      let b = kvCeil;
      for (let it = 0; it < 40; it++) {
        const mid = 0.5 * (a + b);
        if (need(mid) <= cap(mid)) b = mid;
        else a = mid;
      }
      const kv = b;
      return { tech: mkTech(p, kv, maMaxAt(p, kv), st.pwCapMs, st.cu), met: true };
    }
    last = { tech: mkTech(p, kvCeil, maMaxAt(p, kvCeil), st.pwCapMs, st.cu), met: false };
    kvLo = kvCeil;
  }
  return last!;
}

/** Apply the regulatory air kerma rate limit: at the limit the program trades current for kVp. */
function applyLimits(p: Program, s: AdrcSettings, tCm: number, target: number, nom: { tech: Technique; met: boolean }): TrajPoint {
  const lim = akrLimitOf(s);
  const pps = ppsOf(s);
  const { dIrp, dFda } = geom(s);
  const toFda = (dIrp / dFda) ** 2;
  const akr = (t: Technique) => kermaIrpPerPulse(t, s) * pps * 60 * toFda;
  let tech = nom.tech;
  if (akr(tech) <= lim) return { tech, limit: nom.met ? "none" : "tube" };
  const limitTag: AdrcLimit = s.fluoroLevel === "high" ? "akr-high" : "akr";
  const cu = tech.cuMm;
  const pwCap = p.stages.find((x) => x.cu === cu)?.pwCapMs ?? tech.pulseMs;
  // mAs that puts the AKR exactly at the limit for a kVp
  const mAsAtLimit = (kv: number) => {
    const y = tubeOutput(kv, cu) * (1000 / dIrp) ** 2 / 1000; // mGy per mAs at IRP
    return lim / (y * pps * 60 * toFda);
  };
  const det = (kv: number) => {
    const mAs = Math.min(mAsAtLimit(kv), (maMaxAt(p, kv) * pwCap) / 1000);
    return { mAs, d: detectorDose(mkTech(p, kv, 1000, mAs, cu), s, tCm, 1) };
  };
  const build = (kv: number) => {
    const { mAs } = det(kv);
    let pw = pwCap;
    let mA = (mAs * 1000) / pw;
    if (mA < p.maMin) {
      mA = p.maMin;
      pw = Math.max(0.5, (mAs * 1000) / mA);
    }
    return mkTech(p, kv, mA, pw, cu);
  };
  const kv0 = tech.kvp;
  if (det(kv0).d >= target) {
    // the nominal solution only overshoots the limit because the target is high: hold the AKR
    tech = build(kv0);
    return { tech, limit: limitTag };
  }
  if (det(p.kvMax).d < target) return { tech: build(p.kvMax), limit: limitTag };
  let a = kv0;
  let b = p.kvMax;
  for (let it = 0; it < 40; it++) {
    const mid = 0.5 * (a + b);
    if (det(mid).d >= target) b = mid;
    else a = mid;
  }
  // at the limit the detector dose sits at (or below) the target: report the limit
  return { tech: build(b), limit: limitTag };
}

const TRAJ_STEP = 0.25;
const TRAJ_MAX = T_MAX;

function settingsKey(s: AdrcSettings): string {
  return [s.mode, s.fluoroLevel, s.fluoroPps, s.cinePps, s.fieldMm, s.grid ? 1 : 0, s.sidMm ?? SID_MM, s.sodMm ?? SOD_MM].join("|");
}

const trajCache = new Map<string, TrajPoint[]>();

function trajectory(s: AdrcSettings): TrajPoint[] {
  const key = settingsKey(s);
  const hit = trajCache.get(key);
  if (hit) return hit;
  const p = programOf(s);
  const target = targetDetectorNGy(s);
  const pts: TrajPoint[] = [];
  for (let t = 0; t <= TRAJ_MAX + 1e-9; t += TRAJ_STEP) {
    const nom = solveNominal(p, s, t, target);
    pts.push(applyLimits(p, s, t, target, nom));
  }
  if (trajCache.size > 64) trajCache.clear();
  trajCache.set(key, pts);
  return pts;
}

/** The program's technique for an equivalent thickness (cm). */
export function techniqueFor(s: AdrcSettings, equivCm: number): { tech: Technique; limit: AdrcLimit } {
  const pts = trajectory(s);
  const x = Math.min(Math.max(equivCm, 0), TRAJ_MAX) / TRAJ_STEP;
  const i = Math.min(Math.floor(x), pts.length - 2);
  const f = x - i;
  const A = pts[i];
  const B = pts[i + 1];
  if (A.tech.cuMm !== B.tech.cuMm) {
    const P = f < 0.5 ? A : B;
    return { tech: { ...P.tech }, limit: P.limit };
  }
  const p = programOf(s);
  const lerp = (u: number, v: number) => u + (v - u) * f;
  const tech = mkTech(p, lerp(A.tech.kvp, B.tech.kvp), lerp(A.tech.mA, B.tech.mA), lerp(A.tech.pulseMs, B.tech.pulseMs), A.tech.cuMm);
  return clampToAkrLimit(p, s, tech, f < 0.5 ? A.limit : B.limit);
}

/**
 * Linear interpolation between two trajectory nodes that both sit on the AKR limit can land a
 * little above it (kVp and mA do not scale linearly together). Fluoroscopy is never allowed over
 * the 21 CFR 1020.32(d) limit, so the tube loading is scaled down to exactly the limit: current
 * first, then pulse width once the current reaches the program minimum.
 */
function clampToAkrLimit(p: Program, s: AdrcSettings, tech: Technique, limit: AdrcLimit): { tech: Technique; limit: AdrcLimit } {
  const lim = akrLimitOf(s);
  if (!Number.isFinite(lim)) return { tech, limit };
  const { dIrp, dFda } = geom(s);
  const akr = kermaIrpPerPulse(tech, s) * ppsOf(s) * 60 * (dIrp / dFda) ** 2;
  if (akr <= lim) return { tech, limit };
  const mAs = (tech.mAs * lim) / akr;
  let mA = (mAs * 1000) / tech.pulseMs;
  let pw = tech.pulseMs;
  if (mA < p.maMin) {
    mA = p.maMin;
    pw = (mAs * 1000) / mA;
  }
  const out = mkTech(p, tech.kvp, mA, pw, tech.cuMm);
  out.mAs = mAs; // exact, avoids a rounding step back over the limit
  return { tech: out, limit: limit === "none" || limit === "tube" ? (s.fluoroLevel === "high" ? "akr-high" : "akr") : limit };
}

// ---------------------------------------------------------------------------
// Scatter and image outputs
// ---------------------------------------------------------------------------

/** Model parameter: SPR grows with thickness; (t/20)^0.8, clamped. */
export function sprFor(waterCm: number): number {
  return SPR_GRID_REFERENCE * Math.min(1.8, Math.max(0.6, Math.pow(Math.max(1, waterCm) / 20, 0.8)));
}

let refCache: { q: number; I: number; S: number; B: number; W: number } | null = null;
function reference() {
  if (!refCache) {
    const { kvp, cuMm, waterCm } = REFERENCE_BEAM;
    refCache = {
      q: quantaPerUGy(kvp, cuMm, waterCm),
      I: effectiveMu("iodine", kvp, cuMm, waterCm),
      S: effectiveMu("steel", kvp, cuMm, waterCm),
      B: effectiveMu("bone", kvp, cuMm, waterCm),
      W: effectiveMu("water", kvp, cuMm, waterCm),
    };
  }
  return refCache;
}

export function imageFor(t: Technique, s: AdrcSettings, detNGy: number, waterCm: number): AdrcImage {
  const r = reference();
  const q = quantaPerUGy(t.kvp, t.cuMm, waterCm);
  const field = Math.max(50, s.fieldMm);
  // quanta per rendered pixel: detector dose x quanta per dose x detector area per rendered pixel
  const counts = COUNTS_AT_REFERENCE * (detNGy / CINE_NGY_AT_23CM) * (q / r.q) * (field / REFERENCE_FIELD_MM) ** 2;
  return {
    counts,
    iodineGain: effectiveMu("iodine", t.kvp, t.cuMm, waterCm) / r.I,
    metalGain: effectiveMu("steel", t.kvp, t.cuMm, waterCm) / r.S,
    boneGain: effectiveMu("bone", t.kvp, t.cuMm, waterCm) / r.B,
    softGain: effectiveMu("water", t.kvp, t.cuMm, waterCm) / r.W,
    spr: sprFor(waterCm),
    grid: s.grid,
    pulseWidthMs: t.pulseMs,
    noiseRel: Math.sqrt(COUNTS_AT_REFERENCE / Math.max(1e-6, counts)),
  };
}

// ---------------------------------------------------------------------------
// The controller
// ---------------------------------------------------------------------------

export interface AdrcConfig {
  /** first-order lag of the loop, in frames (TG-125: the generator responds over a few frames; plan: 2-3) */
  lagFrames: number;
  /** frames between an exposure and its meter reading being available (1 = the previous frame) */
  meterLatency: number;
  /** equivalent thickness the loop starts from before any reading (cm) */
  startCm: number;
}

export const DEFAULT_ADRC_CONFIG: AdrcConfig = { lagFrames: 2.5, meterLatency: 1, startCm: 20 };

export interface AdrcInput {
  settings: AdrcSettings;
  /** water-equivalent thickness of the patient along the central ray this frame (cm) */
  waterCm: number;
  /** table in the beam: secant of incidence on the table, or null when the table is not crossed */
  tableSec?: number | null;
  /**
   * Meter read-back from the renderer, when wired: either the detector signal of a frame relative
   * to the calibrated target (1 = on target), or the metered transmission of that frame converted
   * to water-equivalent thickness (waterCm = -ln(T_meter) / (mu_soft_per_mm * 10)).
   *
   * `frame` is the AdrcState.frame of the exposure that produced the metered image (NOT the
   * renderer's own frame counter). When it is omitted the reading is taken to belong to the
   * exposure `meterLatency` steps back. A reading whose frame is not among the last 16 exposures
   * this controller made (wrong counter, stale, or after reset) is ignored and the loop meters the
   * analytic patient model instead (meterSource "analytic-fallback"), so the loop never freezes.
   * Without a meter the loop meters the analytic patient model (waterCm) with the same latency.
   */
  meter?: { frame?: number; signalRel: number } | { frame?: number; waterCm: number } | null;
}

interface HistEntry {
  frame: number;
  equivCm: number;
  tech: Technique;
  key: string;
  settings: AdrcSettings;
  signalRel: number;
}

export interface AdrcSnapshot {
  frame: number;
  equivCm: number;
  hist: HistEntry[];
  last: AdrcState | null;
  meterMisses?: number;
}

/** Equivalent thickness that would give this signal for a technique (nominal table at normal incidence). */
function invertThickness(t: Technique, s: AdrcSettings, detNGy: number): number {
  let a = 0;
  let b = 60;
  if (detectorDose(t, s, b, 1) >= detNGy) return b;
  if (detectorDose(t, s, a, 1) <= detNGy) return a;
  for (let it = 0; it < 40; it++) {
    const mid = 0.5 * (a + b);
    if (detectorDose(t, s, mid, 1) > detNGy) a = mid;
    else b = mid;
  }
  return 0.5 * (a + b);
}

/** Deep copy of a state; keeps Infinity (cine AKR limit), which a JSON round trip would turn into null. */
function cloneState(st: AdrcState): AdrcState {
  return { ...st, settings: { ...st.settings }, technique: { ...st.technique }, image: { ...st.image } };
}

export class Adrc implements Snapshotable<AdrcSnapshot> {
  readonly config: AdrcConfig;
  private frame = 0;
  private equivCm: number;
  private hist: HistEntry[] = [];
  private last: AdrcState | null = null;
  private meterMisses = 0;

  constructor(config: Partial<AdrcConfig> = {}) {
    this.config = { ...DEFAULT_ADRC_CONFIG, ...config };
    this.equivCm = this.config.startCm;
  }

  get state(): AdrcState | null {
    return this.last;
  }

  /** Equivalent thickness the loop currently believes in (cm). */
  get equivalentCm(): number {
    return this.equivCm;
  }

  /** One exposure pulse batch (one rendered frame). */
  step(input: AdrcInput): AdrcState {
    const s = { ...DEFAULT_SETTINGS, ...input.settings };
    const key = settingsKey(s);
    const tableSec = input.tableSec === undefined ? 1 : input.tableSec;
    this.frame++;

    // 1) meter: the reading of an earlier frame, interpreted with the technique that made it
    let estimate: number | null = null;
    let source: AdrcMeterSource = "none";
    const want = this.frame - this.config.meterLatency;
    const latest = (): HistEntry | undefined => {
      for (let i = this.hist.length - 1; i >= 0; i--) if (this.hist[i].frame <= want) return this.hist[i];
      return undefined;
    };
    const entryFor = (frame: number | undefined): HistEntry | undefined =>
      frame == null ? latest() : this.hist.find((e) => e.frame === frame);
    const m = input.meter;
    let metered = false;
    if (m && "signalRel" in m && Number.isFinite(m.signalRel) && m.signalRel > 0) {
      const h = entryFor(m.frame);
      if (h) {
        estimate = invertThickness(h.tech, h.settings, m.signalRel * targetDetectorNGy(h.settings));
        metered = true;
      }
    } else if (m && "waterCm" in m && Number.isFinite(m.waterCm) && m.waterCm >= 0) {
      // metered transmission already converted to water-equivalent thickness by the caller
      const h = entryFor(m.frame);
      if (h) {
        estimate = invertThickness(h.tech, h.settings, detectorDose(h.tech, h.settings, m.waterCm, tableSec));
        metered = true;
      }
    }
    if (metered) source = "meter";
    else {
      // no usable reading: meter the analytic patient model through the latest exposure
      const unmatched = m != null;
      if (unmatched) this.meterMisses++;
      const h = latest();
      if (h) {
        const det = detectorDose(h.tech, h.settings, input.waterCm, tableSec);
        estimate = invertThickness(h.tech, h.settings, det);
        source = unmatched ? "analytic-fallback" : "analytic";
      }
    }

    // 2) first-order lag along the program curve
    if (estimate != null) {
      const alpha = 1 - Math.exp(-1 / Math.max(0.01, this.config.lagFrames));
      this.equivCm += alpha * (Math.min(TRAJ_MAX, Math.max(0, estimate)) - this.equivCm);
    }

    // 3) technique and its result through the actual patient
    const { tech, limit } = techniqueFor(s, this.equivCm);
    const target = targetDetectorNGy(s);
    const det = detectorDose(tech, s, input.waterCm, tableSec);
    const signalRel = det / target;
    const pps = ppsOf(s);
    const kIrp = kermaIrpPerPulse(tech, s);
    const { dIrp, dFda } = geom(s);
    const rate = kIrp * pps * 60;
    const state: AdrcState = {
      frame: this.frame,
      settings: s,
      technique: tech,
      equivCm: this.equivCm,
      patientCm: input.waterCm,
      targetNGy: target,
      detectorNGy: det,
      signalRel,
      limit,
      pps,
      kermaIrpPerPulseMGy: kIrp,
      kermaRateIrpMGyMin: rate,
      akrFdaMGyMin: rate * (dIrp / dFda) ** 2,
      akrLimitMGyMin: akrLimitOf(s),
      hvlMmAl: beamHvl(tech.kvp, tech.cuMm),
      image: imageFor(tech, s, det, input.waterCm),
      meterSource: source,
      meterMisses: this.meterMisses,
    };
    this.hist.push({ frame: this.frame, equivCm: this.equivCm, tech, key, settings: s, signalRel });
    if (this.hist.length > 16) this.hist.shift();
    this.last = state;
    return state;
  }

  /** Run the loop to steady state for a fixed geometry (previews, tests, dose estimates). */
  settle(input: AdrcInput, maxFrames = 200): AdrcState {
    let st = this.step(input);
    for (let i = 0; i < maxFrames; i++) {
      const before = this.equivCm;
      st = this.step(input);
      if (Math.abs(this.equivCm - before) < 1e-5) break;
    }
    return st;
  }

  reset(): void {
    this.frame = 0;
    this.equivCm = this.config.startCm;
    this.hist = [];
    this.last = null;
    this.meterMisses = 0;
  }

  snapshot(): AdrcSnapshot {
    return {
      frame: this.frame,
      equivCm: this.equivCm,
      hist: this.hist.map((h) => ({ ...h, tech: { ...h.tech }, settings: { ...h.settings } })),
      last: this.last ? cloneState(this.last) : null,
      meterMisses: this.meterMisses,
    };
  }

  restore(snap: AdrcSnapshot): void {
    this.frame = snap.frame;
    this.equivCm = snap.equivCm;
    this.hist = snap.hist.map((h) => ({ ...h, tech: { ...h.tech }, settings: { ...h.settings } }));
    this.last = snap.last ? cloneState(snap.last) : null;
    this.meterMisses = snap.meterMisses ?? 0;
  }
}

/** Steady-state exposure for a geometry, without keeping a controller. */
export function steadyState(settings: Partial<AdrcSettings>, path: PatientPath | number): AdrcState {
  const p = typeof path === "number" ? { waterCm: path, tableInBeam: true, tableSec: 1 } : path;
  const a = new Adrc({ startCm: p.waterCm });
  return a.settle({ settings: { ...DEFAULT_SETTINGS, ...settings }, waterCm: p.waterCm, tableSec: p.tableInBeam ? p.tableSec : null });
}

/**
 * The renderer was calibrated (grey percentiles, vessel contrast) against the pre-ADRC formula in
 * sceneBuilder: kv = clamp(62 + (path - 220) * 0.12, 65, 105), iodineGain = (75/kv)^2.2,
 * metalGain = (75/kv)^1.4. For the standard AP patient that clamps at 65 kV, giving the values
 * below. These are calibration constants of the old renderer, not physics.
 */
export const LEGACY_AP_IODINE_GAIN = Math.pow(75 / 65, 2.2);
export const LEGACY_AP_METAL_GAIN = Math.pow(75 / 65, 1.4);

export type AdrcCalibration = "physical" | "legacy-ap";

const apGainCache = new Map<string, { I: number; S: number }>();
/** ADRC iodine and steel gains for the standard AP patient (20 cm water, table in beam) in a mode. */
export function standardApGains(mode: AdrcMode): { I: number; S: number } {
  const hit = apGainCache.get(mode);
  if (hit) return hit;
  const st = steadyState({ ...DEFAULT_SETTINGS, mode }, 20);
  const g = { I: st.image.iodineGain, S: st.image.metalGain };
  apGainCache.set(mode, g);
  return g;
}

/** The ImageParams fields the exposure sets (see docs/realism/wave1/S6.md for the sceneBuilder change). */
export interface AdrcImageParams {
  counts: number;
  iodineGain: number;
  metalGain: number;
  spr: number;
  gridIn: boolean;
  pulseWidthMs: number;
}

/**
 * ImageParams fields from an exposure. With calibration "legacy-ap" the iodine and metal gains are
 * rescaled so that the standard AP patient keeps the renderer's existing calibrated contrast
 * (LEGACY_AP_*), while every change with thickness, kVp, filter and mode still follows the ADRC.
 * Use "legacy-ap" until the grey-percentile and vessel-contrast scorecard has been re-run against
 * the physical gains; then switch to "physical" (the default).
 */
export function imageParamsFromAdrc(s: AdrcState, opts: { calibration?: AdrcCalibration } = {}): AdrcImageParams {
  let iodineGain = s.image.iodineGain;
  let metalGain = s.image.metalGain;
  if (opts.calibration === "legacy-ap") {
    const ap = standardApGains(s.settings.mode);
    iodineGain *= LEGACY_AP_IODINE_GAIN / ap.I;
    metalGain *= LEGACY_AP_METAL_GAIN / ap.S;
  }
  return { counts: s.image.counts, iodineGain, metalGain, spr: s.image.spr, gridIn: s.image.grid, pulseWidthMs: s.image.pulseWidthMs };
}

// ---- generated by the SpekPy script in docs/realism/facts/S6.md (do not edit by hand) ----
const SPEC_KV = [55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125];
const SPEC_CU = [0.0, 0.1, 0.2, 0.3, 0.6, 0.9];
/** per (kVp, Cu) node, row-major [kv][cu]: Y, T1..T4, q0..q3, I0..I3, S0..S3, B0..B3, W0..W3, HVL (see the fact file) */
const SPEC_NODES: number[][] = [
  [39.903, -0.41438, 0.0077028, -0.00017228, 1.4756e-06, 14.914, 0.037117, -0.00092523, 8.5706e-06, 18.441, 0.045047, -0.0057067, 6.8836e-05, 5.7104, -0.21273, 0.0056203, -5.4242e-05, 0.86057, -0.027228, 0.00072297, -6.9951e-06, 0.31041, -0.0047876, 0.00012607, -1.2167e-06, 1.952], // 55 kVp, 0.0 mm Cu
  [14.35, -0.33106, 0.0032441, -6.2765e-05, 4.9945e-07, 15.112, 0.022618, -0.00051254, 4.5091e-06, 18.818, -0.055739, -0.0022754, 3.414e-05, 4.5347, -0.11772, 0.0027406, -2.4796e-05, 0.7097, -0.014954, 0.00034968, -3.1708e-06, 0.28394, -0.0026518, 6.1264e-05, -5.5322e-07, 3.062], // 55 kVp, 0.1 mm Cu
  [7.2457, -0.29798, 0.0018013, -3.073e-05, 2.2927e-07, 15.228, 0.015139, -0.00031504, 2.6488e-06, 18.66, -0.10491, -0.00034339, 1.3643e-05, 3.9174, -0.075586, 0.0015677, -1.3345e-05, 0.63116, -0.009563, 0.00019916, -1.699e-06, 0.27004, -0.0017105, 3.5092e-05, -2.9772e-07, 3.778], // 55 kVp, 0.2 mm Cu
  [4.2023, -0.28018, 0.0011498, -1.7528e-05, 1.2336e-07, 15.305, 0.010772, -0.00020693, 1.6676e-06, 18.226, -0.12277, 0.00061781, 2.7285e-06, 3.5343, -0.053215, 0.00099481, -8.0015e-06, 0.58265, -0.0067147, 0.00012601, -1.0157e-06, 0.26138, -0.0012106, 2.2332e-05, -1.7882e-07, 4.288], // 55 kVp, 0.3 mm Cu
  [1.1745, -0.25575, 0.00045406, -5.2119e-06, 3.1519e-08, 15.427, 0.0049037, -7.5549e-05, 5.387e-07, 16.574, -0.10712, 0.0011257, -5.6186e-06, 2.9265, -0.025093, 0.00036463, -2.5408e-06, 0.50604, -0.0031523, 4.5944e-05, -3.2076e-07, 0.24751, -0.00057932, 8.2676e-06, -5.7216e-08, 5.231], // 55 kVp, 0.6 mm Cu
  [0.4193, -0.24529, 0.00024534, -2.241e-06, 1.1903e-08, 15.486, 0.0027808, -3.5474e-05, 2.2506e-07, 15.227, -0.076158, 0.00080387, -4.429e-06, 2.6257, -0.014891, 0.00017819, -1.1077e-06, 0.46826, -0.0018667, 2.2388e-05, -1.394e-07, 0.24054, -0.00034799, 4.0776e-06, -2.5127e-08, 5.769], // 55 kVp, 0.9 mm Cu
  [47.418, -0.39707, 0.0073518, -0.00016423, 1.4058e-06, 14.977, 0.036663, -0.00092764, 8.6344e-06, 17.7, -0.067801, -0.0027824, 4.3336e-05, 5.0403, -0.19234, 0.0050482, -4.8568e-05, 0.77527, -0.02455, 0.00064741, -6.2439e-06, 0.29513, -0.0043496, 0.00011343, -1.0902e-06, 2.123], // 60 kVp, 0.0 mm Cu
  [18.47, -0.31764, 0.0031038, -5.9963e-05, 4.7685e-07, 15.172, 0.022047, -0.00050892, 4.5006e-06, 17.541, -0.13207, -0.00018873, 1.5265e-05, 3.9837, -0.1074, 0.0024804, -2.2343e-05, 0.64006, -0.013612, 0.00031565, -2.8494e-06, 0.27124, -0.0024391, 5.5672e-05, -4.9986e-07, 3.353], // 60 kVp, 0.1 mm Cu
  [9.9399, -0.28608, 0.0017271, -2.9408e-05, 2.1927e-07, 15.286, 0.014586, -0.00031023, 2.6207e-06, 17.015, -0.15345, 0.0010458, 7.7719e-07, 3.4253, -0.069558, 0.0014318, -1.2131e-05, 0.5692, -0.0087827, 0.00018144, -1.5405e-06, 0.25858, -0.0015911, 3.2236e-05, -2.7178e-07, 4.154], // 60 kVp, 0.2 mm Cu
  [6.1028, -0.2691, 0.0011049, -1.6797e-05, 1.1813e-07, 15.359, 0.010275, -0.0002026, 1.6392e-06, 16.348, -0.15227, 0.0015071, -5.683e-06, 3.0765, -0.049315, 0.00091622, -7.3391e-06, 0.52512, -0.0062118, 0.00011579, -9.2929e-07, 0.25061, -0.0011367, 2.0718e-05, -1.649e-07, 4.729], // 60 kVp, 0.3 mm Cu
  [1.9861, -0.24578, 0.00043977, -5.0205e-06, 3.0286e-08, 15.474, 0.004554, -7.3634e-05, 5.2793e-07, 14.441, -0.11162, 0.0013191, -7.6133e-06, 2.5186, -0.023544, 0.00034118, -2.374e-06, 0.4549, -0.0029547, 4.2905e-05, -2.9902e-07, 0.2377, -0.0005539, 7.8204e-06, -5.3889e-08, 5.798], // 60 kVp, 0.6 mm Cu
  [0.8145, -0.23578, 0.0002398, -2.1757e-06, 1.1506e-08, 15.527, 0.0025019, -3.4623e-05, 2.2327e-07, 13.084, -0.075462, 0.00082933, -4.7848e-06, 2.2408, -0.014075, 0.00016796, -1.0429e-06, 0.42005, -0.0017638, 2.1069e-05, -1.3097e-07, 0.23114, -0.00033683, 3.8981e-06, -2.3903e-08, 6.412], // 60 kVp, 0.9 mm Cu
  [55.011, -0.38251, 0.0070348, -0.00015695, 1.3426e-06, 15.027, 0.035708, -0.00091891, 8.5916e-06, 16.852, -0.14395, -0.00060598, 2.3103e-05, 4.5202, -0.17591, 0.0045896, -4.4026e-05, 0.70919, -0.022407, 0.00058721, -5.6462e-06, 0.28312, -0.004002, 0.0001034, -9.8979e-07, 2.29], // 65 kVp, 0.0 mm Cu
  [22.896, -0.30663, 0.0029785, -5.7452e-05, 4.5657e-07, 15.217, 0.021174, -0.00050015, 4.4468e-06, 16.323, -0.1785, 0.0012118, 1.8887e-06, 3.5604, -0.099107, 0.0022739, -2.0407e-05, 0.58664, -0.012542, 0.00028879, -2.5972e-06, 0.26132, -0.0022719, 5.1282e-05, -4.5814e-07, 3.631], // 65 kVp, 0.1 mm Cu
  [12.973, -0.27646, 0.0016616, -2.8234e-05, 2.1036e-07, 15.326, 0.013823, -0.00030291, 2.5745e-06, 15.573, -0.17999, 0.0018986, -7.5613e-06, 3.05, -0.064684, 0.0013235, -1.1174e-05, 0.52195, -0.0081577, 0.00016743, -1.4162e-06, 0.24965, -0.0014976, 2.9993e-05, -2.5153e-07, 4.51], // 65 kVp, 0.2 mm Cu
  [8.3335, -0.26022, 0.0010657, -1.6157e-05, 1.1351e-07, 15.395, 0.0096102, -0.00019687, 1.6042e-06, 14.78, -0.16645, 0.0020068, -1.0702e-05, 2.7293, -0.046134, 0.00085299, -6.8117e-06, 0.48147, -0.0058062, 0.00010762, -8.6093e-07, 0.24224, -0.0010788, 1.9441e-05, -1.5395e-07, 5.143], // 65 kVp, 0.3 mm Cu
  [3.0531, -0.23791, 0.00042786, -4.8608e-06, 2.9257e-08, 15.501, 0.0040797, -7.0914e-05, 5.1584e-07, 12.779, -0.11196, 0.0013938, -8.5097e-06, 2.2131, -0.022273, 0.00032182, -2.2356e-06, 0.41655, -0.0027953, 4.0422e-05, -2.8115e-07, 0.23011, -0.00053495, 7.4623e-06, -5.1176e-08, 6.323], // 65 kVp, 0.6 mm Cu
  [1.392, -0.22831, 0.00023542, -2.1238e-06, 1.1197e-08, 15.547, 0.0021213, -3.2976e-05, 2.1864e-07, 11.454, -0.074007, 0.00082659, -4.8589e-06, 1.9549, -0.01342, 0.00015966, -9.8934e-07, 0.38415, -0.0016831, 2.0013e-05, -1.241e-07, 0.22387, -0.00032961, 3.7615e-06, -2.2923e-08, 7.005], // 65 kVp, 0.9 mm Cu
  [62.672, -0.36994, 0.0067461, -0.00015032, 1.285e-06, 15.065, 0.034369, -0.00090296, 8.4807e-06, 16.01, -0.19515, 0.00097182, 7.8069e-06, 4.1077, -0.16245, 0.0042154, -4.0325e-05, 0.65683, -0.020663, 0.00053834, -5.1615e-06, 0.27348, -0.0037214, 9.5276e-05, -9.0854e-07, 2.455], // 70 kVp, 0.0 mm Cu
  [27.604, -0.29733, 0.0028657, -5.5179e-05, 4.3819e-07, 15.249, 0.020051, -0.00048812, 4.3658e-06, 15.232, -0.20691, 0.0021489, -7.4366e-06, 3.2279, -0.092328, 0.0021062, -1.8842e-05, 0.54466, -0.011673, 0.0002671, -2.3942e-06, 0.25337, -0.0021382, 4.7751e-05, -4.2462e-07, 3.9], // 70 kVp, 0.1 mm Cu
  [16.325, -0.26843, 0.0016034, -2.7182e-05, 2.0233e-07, 15.352, 0.012867, -0.00029396, 2.5174e-06, 14.345, -0.19446, 0.0024267, -1.2971e-05, 2.7569, -0.060685, 0.0012354, -1.0397e-05, 0.48504, -0.0076493, 0.00015608, -1.3159e-06, 0.24251, -0.0014233, 2.8187e-05, -2.3524e-07, 4.851], // 70 kVp, 0.2 mm Cu
  [10.883, -0.25286, 0.0010314, -1.5591e-05, 1.094e-07, 15.416, 0.0087806, -0.00019015, 1.5647e-06, 13.487, -0.17292, 0.0022906, -1.3729e-05, 2.4596, -0.043516, 0.00080117, -6.381e-06, 0.44754, -0.0054758, 0.00010097, -8.0539e-07, 0.23556, -0.0010334, 1.841e-05, -1.4508e-07, 5.535], // 70 kVp, 0.3 mm Cu
  [4.3856, -0.23145, 0.00041795, -4.7257e-06, 2.8377e-08, 15.511, 0.0034719, -6.7619e-05, 5.0234e-07, 11.469, -0.1108, 0.0014172, -8.8966e-06, 1.9786, -0.021235, 0.00030592, -2.1209e-06, 0.38703, -0.0026673, 3.8401e-05, -2.6644e-07, 0.22407, -0.00052129, 7.1784e-06, -4.896e-08, 6.814], // 70 kVp, 0.6 mm Cu
  [2.1743, -0.22221, 0.00023211, -2.0825e-06, 1.0945e-08, 15.549, 0.0016245, -3.0854e-05, 2.1255e-07, 10.189, -0.072522, 0.0008157, -4.8337e-06, 1.737, -0.012898, 0.00015304, -9.4588e-07, 0.35668, -0.0016205, 1.9181e-05, -1.1856e-07, 0.21811, -0.00032555, 3.6613e-06, -2.2151e-08, 7.553], // 70 kVp, 0.9 mm Cu
  [70.613, -0.35834, 0.006476, -0.00014421, 1.2322e-06, 15.097, 0.032736, -0.00088213, 8.3316e-06, 15.166, -0.23095, 0.0021983, -4.5533e-06, 3.7535, -0.15055, 0.0038927, -3.7152e-05, 0.61189, -0.019129, 0.00049637, -4.7476e-06, 0.26508, -0.0034753, 8.8335e-05, -8.3949e-07, 2.628], // 75 kVp, 0.0 mm Cu
  [32.752, -0.28881, 0.0027583, -5.31e-05, 4.2147e-07, 15.272, 0.018716, -0.00047338, 4.2675e-06, 14.211, -0.22425, 0.0028268, -1.4509e-05, 2.9444, -0.086197, 0.0019613, -1.7507e-05, 0.50886, -0.010892, 0.00024843, -2.2215e-06, 0.24647, -0.0020181, 4.4737e-05, -3.9635e-07, 4.179], // 75 kVp, 0.1 mm Cu
  [20.131, -0.26113, 0.0015465, -2.6226e-05, 1.9515e-07, 15.368, 0.011741, -0.00028319, 2.4512e-06, 13.243, -0.20134, 0.0027789, -1.6831e-05, 2.5091, -0.056958, 0.0011584, -9.7349e-06, 0.45378, -0.0071787, 0.00014621, -1.2306e-06, 0.23633, -0.0013542, 2.6635e-05, -2.2155e-07, 5.199], // 75 kVp, 0.2 mm Cu
  [13.869, -0.24622, 0.00099659, -1.5077e-05, 1.0578e-07, 15.427, 0.007806, -0.00018203, 1.5193e-06, 12.357, -0.17425, 0.0024599, -1.5746e-05, 2.2333, -0.040993, 0.0007552, -6.0114e-06, 0.41901, -0.0051597, 9.5103e-05, -7.5795e-07, 0.22981, -0.00098921, 1.7513e-05, -1.3763e-07, 5.932], // 75 kVp, 0.3 mm Cu
  [6.0725, -0.22575, 0.00040578, -4.5989e-06, 2.7642e-08, 15.509, 0.0027601, -6.3356e-05, 4.8489e-07, 10.375, -0.1078, 0.0014111, -9.0518e-06, 1.7862, -0.020125, 0.00029089, -2.0203e-06, 0.36273, -0.0025312, 3.651e-05, -2.5365e-07, 0.21895, -0.00050517, 6.9133e-06, -4.7091e-08, 7.296], // 75 kVp, 0.6 mm Cu
  [3.2318, -0.21694, 0.00022638, -2.0366e-06, 1.0733e-08, 15.539, 0.0010496, -2.8017e-05, 2.0334e-07, 9.1583, -0.07004, 0.00079514, -4.7602e-06, 1.5617, -0.012275, 0.00014616, -9.0625e-07, 0.33449, -0.0015457, 1.8327e-05, -1.1356e-07, 0.21329, -0.0003185, 3.5528e-06, -2.1475e-08, 8.079], // 75 kVp, 0.9 mm Cu
  [78.856, -0.34749, 0.0062048, -0.00013821, 1.1807e-06, 15.124, 0.030815, -0.00085488, 8.1248e-06, 14.375, -0.25299, 0.0030827, -1.3987e-05, 3.4531, -0.13962, 0.0036021, -3.4329e-05, 0.57379, -0.017727, 0.00045874, -4.3809e-06, 0.25787, -0.0032484, 8.2095e-05, -7.7834e-07, 2.811], // 80 kVp, 0.0 mm Cu
  [38.361, -0.28103, 0.0026468, -5.1017e-05, 4.0507e-07, 15.289, 0.017197, -0.00045504, 4.1385e-06, 13.31, -0.23225, 0.0032658, -1.9501e-05, 2.7081, -0.08042, 0.001828, -1.6305e-05, 0.479, -0.01016, 0.00023134, -2.0668e-06, 0.24063, -0.0019034, 4.1954e-05, -3.71e-07, 4.464], // 80 kVp, 0.1 mm Cu
  [24.408, -0.2546, 0.0014853, -2.5241e-05, 1.8801e-07, 15.378, 0.010484, -0.00027015, 2.3663e-06, 12.304, -0.20207, 0.0029717, -1.9304e-05, 2.3057, -0.053349, 0.0010853, -9.1246e-06, 0.42811, -0.0067253, 0.0001369, -1.1524e-06, 0.23116, -0.0012855, 2.5144e-05, -2.0895e-07, 5.545], // 80 kVp, 0.2 mm Cu
  [17.307, -0.24039, 0.0009577, -1.4528e-05, 1.0211e-07, 15.43, 0.0067297, -0.00017236, 1.4611e-06, 11.419, -0.17158, 0.0025242, -1.6862e-05, 2.0503, -0.038493, 0.00070993, -5.6604e-06, 0.39588, -0.0048479, 8.9363e-05, -7.1319e-07, 0.22505, -0.0009435, 1.6605e-05, -1.3052e-07, 6.318], // 80 kVp, 0.3 mm Cu
  [8.1266, -0.22093, 0.00039087, -4.4364e-06, 2.6782e-08, 15.5, 0.001989, -5.8496e-05, 4.6178e-07, 9.5081, -0.10367, 0.0013724, -8.9545e-06, 1.6358, -0.018989, 0.00027436, -1.9133e-06, 0.34368, -0.0023922, 3.4438e-05, -2.4014e-07, 0.21482, -0.0004871, 6.5934e-06, -4.4997e-08, 7.742], // 80 kVp, 0.6 mm Cu
  [4.5804, -0.2126, 0.0002191, -1.9626e-06, 1.0403e-08, 15.52, 0.00043098, -2.4999e-05, 1.916e-07, 8.3621, -0.06722, 0.00076023, -4.5887e-06, 1.4277, -0.011646, 0.00013784, -8.5806e-07, 0.31746, -0.0014702, 1.7293e-05, -1.0752e-07, 0.20946, -0.00031047, 3.3946e-06, -2.0533e-08, 8.55], // 80 kVp, 0.9 mm Cu
  [87.389, -0.33743, 0.0059372, -0.00013234, 1.1309e-06, 15.145, 0.028713, -0.00082289, 7.8695e-06, 13.658, -0.26496, 0.0036781, -2.0801e-05, 3.2, -0.12972, 0.0033397, -3.1807e-05, 0.54167, -0.016462, 0.00042492, -4.0546e-06, 0.25172, -0.0030416, 7.6436e-05, -7.2366e-07, 3.002], // 85 kVp, 0.0 mm Cu
  [44.405, -0.27398, 0.0025337, -4.8914e-05, 3.8879e-07, 15.3, 0.015576, -0.00043435, 3.9844e-06, 12.531, -0.23406, 0.0035161, -2.2757e-05, 2.5125, -0.075103, 0.0017044, -1.5207e-05, 0.45425, -0.0094888, 0.00021557, -1.9261e-06, 0.2357, -0.0017965, 3.9339e-05, -3.4768e-07, 4.75], // 85 kVp, 0.1 mm Cu
  [29.133, -0.2488, 0.0014219, -2.4209e-05, 1.8069e-07, 15.381, 0.0091622, -0.00025591, 2.2671e-06, 11.518, -0.1992, 0.0030447, -2.0669e-05, 2.1399, -0.049992, 0.0010155, -8.5493e-06, 0.40712, -0.0063053, 0.00012804, -1.0791e-06, 0.22686, -0.0012204, 2.3681e-05, -1.9689e-07, 5.882], // 85 kVp, 0.2 mm Cu
  [21.18, -0.23529, 0.00091711, -1.3929e-05, 9.8191e-08, 15.427, 0.0056084, -0.00016209, 1.3945e-06, 10.65, -0.16692, 0.002513, -1.7278e-05, 1.9029, -0.036162, 0.00066541, -5.3178e-06, 0.37722, -0.0045584, 8.3734e-05, -6.6969e-07, 0.22112, -0.00090003, 1.5676e-05, -1.2338e-07, 6.686], // 85 kVp, 0.3 mm Cu
  [10.545, -0.21687, 0.00037576, -4.2399e-06, 2.5713e-08, 15.484, 0.001191, -5.379e-05, 4.3757e-07, 8.8233, -0.099511, 0.0013132, -8.6619e-06, 1.518, -0.017965, 0.00025711, -1.798e-06, 0.3287, -0.0022677, 3.2274e-05, -2.2561e-07, 0.21148, -0.00047093, 6.2304e-06, -4.2558e-08, 8.148], // 85 kVp, 0.6 mm Cu
  [6.2261, -0.20898, 0.0002126, -1.8685e-06, 9.9285e-09, 15.495, -0.00021616, -2.2332e-05, 1.8134e-07, 7.7433, -0.064827, 0.00071808, -4.3384e-06, 1.3244, -0.011127, 0.00012898, -8.0212e-07, 0.30426, -0.0014089, 1.6186e-05, -1.0049e-07, 0.20638, -0.00030487, 3.2057e-06, -1.9296e-08, 8.968], // 85 kVp, 0.9 mm Cu
  [95.909, -0.32857, 0.0056867, -0.00012676, 1.0835e-06, 15.16, 0.026568, -0.00078939, 7.5904e-06, 13.061, -0.27113, 0.0040398, -2.5201e-05, 2.9994, -0.12155, 0.0031177, -2.9665e-05, 0.51619, -0.015422, 0.00039639, -3.7784e-06, 0.24678, -0.0028718, 7.1612e-05, -6.7695e-07, 3.189], // 90 kVp, 0.0 mm Cu
  [50.612, -0.26795, 0.0024296, -4.6886e-05, 3.7297e-07, 15.304, 0.013952, -0.00041385, 3.8255e-06, 11.902, -0.23356, 0.0036375, -2.4609e-05, 2.3594, -0.070791, 0.0015993, -1.4262e-05, 0.43485, -0.0089467, 0.00020218, -1.8054e-06, 0.23177, -0.0017109, 3.7083e-05, -3.2735e-07, 5.018], // 90 kVp, 0.1 mm Cu
  [34.072, -0.24391, 0.0013655, -2.321e-05, 1.7345e-07, 15.378, 0.007847, -0.00024242, 2.1702e-06, 10.893, -0.19598, 0.0030519, -2.1247e-05, 2.0112, -0.047336, 0.00095595, -8.0474e-06, 0.39079, -0.0059746, 0.00012049, -1.0152e-06, 0.22343, -0.0011704, 2.2406e-05, -1.8612e-07, 6.191], // 90 kVp, 0.2 mm Cu
  [25.285, -0.23104, 0.0008825, -1.3352e-05, 9.4261e-08, 15.418, 0.0044912, -0.00015275, 1.3328e-06, 10.046, -0.16296, 0.0024718, -1.7267e-05, 1.7891, -0.034373, 0.00062752, -5.0151e-06, 0.36275, -0.0043378, 7.8949e-05, -6.3132e-07, 0.218, -0.00086858, 1.4865e-05, -1.1686e-07, 7.017], // 90 kVp, 0.3 mm Cu
  [13.199, -0.21348, 0.00036528, -4.0595e-06, 2.4613e-08, 15.463, 0.00037682, -4.9893e-05, 4.1967e-07, 8.2881, -0.096824, 0.0012597, -8.3213e-06, 1.427, -0.017276, 0.00024301, -1.6947e-06, 0.31706, -0.0021858, 3.0504e-05, -2.1257e-07, 0.20879, -0.00046286, 5.9241e-06, -4.0231e-08, 8.507], // 90 kVp, 0.6 mm Cu
  [8.0892, -0.20593, 0.00020984, -1.7909e-06, 9.4499e-09, 15.466, -0.00089715, -2.0215e-05, 1.7658e-07, 7.255, -0.063701, 0.00068567, -4.1009e-06, 1.2437, -0.010846, 0.0001223, -7.5286e-07, 0.29386, -0.0013781, 1.535e-05, -9.4262e-08, 0.20386, -0.0003055, 3.0601e-06, -1.8113e-08, 9.339], // 90 kVp, 0.9 mm Cu
  [104.75, -0.32025, 0.0054425, -0.00012132, 1.0375e-06, 15.172, 0.024375, -0.00075473, 7.295e-06, 12.52, -0.27315, 0.0042671, -2.8286e-05, 2.8251, -0.11411, 0.0029151, -2.7718e-05, 0.49404, -0.014477, 0.00037039, -3.5278e-06, 0.24244, -0.0027164, 6.7175e-05, -6.3428e-07, 3.384], // 95 kVp, 0.0 mm Cu
  [57.25, -0.26237, 0.0023271, -4.4871e-05, 3.573e-07, 15.305, 0.012311, -0.0003933, 3.6623e-06, 11.35, -0.23085, 0.0036805, -2.5676e-05, 2.2281, -0.06683, 0.0015018, -1.3388e-05, 0.41818, -0.0084498, 0.00018976, -1.6938e-06, 0.22835, -0.0016319, 3.4956e-05, -3.0831e-07, 5.288], // 95 kVp, 0.1 mm Cu
  [39.454, -0.23946, 0.0013099, -2.2201e-05, 1.6614e-07, 15.371, 0.0065219, -0.00022932, 2.074e-06, 10.355, -0.19169, 0.0030142, -2.1366e-05, 1.902, -0.044887, 0.00089975, -7.5732e-06, 0.37691, -0.0056705, 0.00011337, -9.5502e-07, 0.22047, -0.0011241, 2.1176e-05, -1.7573e-07, 6.493], // 95 kVp, 0.2 mm Cu
  [29.821, -0.2272, 0.00084858, -1.2762e-05, 9.0212e-08, 15.406, 0.0033651, -0.00014396, 1.2742e-06, 9.5324, -0.15857, 0.0024053, -1.6985e-05, 1.6934, -0.032727, 0.00059131, -4.7235e-06, 0.35056, -0.0041356, 7.4376e-05, -5.9438e-07, 0.21531, -0.00083961, 1.4064e-05, -1.1039e-07, 7.334], // 95 kVp, 0.3 mm Cu
  [16.223, -0.21048, 0.00035563, -3.8726e-06, 2.3423e-08, 15.438, -0.00045557, -4.6578e-05, 4.0681e-07, 7.8452, -0.094315, 0.0012018, -7.9159e-06, 1.3521, -0.016664, 0.00022928, -1.5905e-06, 0.30742, -0.0021137, 2.8775e-05, -1.9938e-07, 0.2065, -0.00045634, 5.6101e-06, -3.7754e-08, 8.84], // 95 kVp, 0.6 mm Cu
  [10.262, -0.20324, 0.00020797, -1.7122e-06, 8.9191e-09, 15.433, -0.0016071, -1.8516e-05, 1.7658e-07, 6.855, -0.062816, 0.00065287, -3.8388e-06, 1.1779, -0.010621, 0.00011584, -7.018e-07, 0.28532, -0.0013545, 1.4536e-05, -8.777e-08, 0.20172, -0.00030754, 2.9097e-06, -1.6795e-08, 9.68], // 95 kVp, 0.9 mm Cu
  [113.63, -0.31281, 0.0052177, -0.00011621, 9.9403e-07, 15.178, 0.022224, -0.00072151, 7.0079e-06, 12.061, -0.27351, 0.0043974, -3.0242e-05, 2.6823, -0.10793, 0.0027429, -2.6051e-05, 0.47587, -0.013695, 0.00034833, -3.3137e-06, 0.23882, -0.0025887, 6.3379e-05, -5.9748e-07, 3.576], // 100 kVp, 0.0 mm Cu
  [64.056, -0.25747, 0.0022355, -4.2992e-05, 3.4246e-07, 15.302, 0.010705, -0.00037443, 3.5123e-06, 10.889, -0.22812, 0.0036818, -2.6178e-05, 2.1212, -0.06361, 0.0014191, -1.2636e-05, 0.40457, -0.0080474, 0.00017926, -1.598e-06, 0.22551, -0.0015692, 3.3134e-05, -2.917e-07, 5.543], // 100 kVp, 0.1 mm Cu
  [45.046, -0.23558, 0.0012621, -2.1274e-05, 1.5922e-07, 15.36, 0.0052202, -0.00021773, 1.991e-06, 9.9117, -0.18816, 0.002964, -2.1225e-05, 1.8133, -0.042948, 0.0008525, -7.1641e-06, 0.36559, -0.0054312, 0.00010739, -9.0307e-07, 0.21801, -0.0010893, 2.0125e-05, -1.6658e-07, 6.774], // 100 kVp, 0.2 mm Cu
  [34.585, -0.22386, 0.0008208, -1.2229e-05, 8.6399e-08, 15.39, 0.0022487, -0.00013645, 1.2277e-06, 9.1104, -0.15524, 0.0023405, -1.6604e-05, 1.6158, -0.031465, 0.0005612, -4.4716e-06, 0.34062, -0.0039819, 7.0572e-05, -5.6244e-07, 0.21306, -0.00081957, 1.3387e-05, -1.0463e-07, 7.627], // 100 kVp, 0.3 mm Cu
  [19.484, -0.20783, 0.00034965, -3.718e-06, 2.2333e-08, 15.41, -0.0013071, -4.3916e-05, 4.0211e-07, 7.4791, -0.092802, 0.0011555, -7.545e-06, 1.2907, -0.016258, 0.0002185, -1.5015e-06, 0.29947, -0.002068, 2.7415e-05, -1.8807e-07, 0.20455, -0.00045507, 5.359e-06, -3.5526e-08, 9.147], // 100 kVp, 0.6 mm Cu
  [12.663, -0.20083, 0.00020848, -1.6567e-06, 8.4593e-09, 15.397, -0.00235, -1.7065e-05, 1.8186e-07, 6.5202, -0.062613, 0.00062992, -3.617e-06, 1.1233, -0.010522, 0.00011126, -6.5958e-07, 0.27817, -0.0013472, 1.3958e-05, -8.2351e-08, 0.19986, -0.00031304, 2.8027e-06, -1.5627e-08, 9.996], // 100 kVp, 0.9 mm Cu
  [122.92, -0.30558, 0.0049914, -0.00011108, 9.5047e-07, 15.183, 0.020055, -0.00068784, 6.712e-06, 11.634, -0.27138, 0.0044545, -3.1502e-05, 2.5523, -0.10199, 0.0025778, -2.446e-05, 0.45931, -0.012943, 0.00032721, -3.1098e-06, 0.23551, -0.0024644, 5.9702e-05, -5.6213e-07, 3.78], // 105 kVp, 0.0 mm Cu
  [71.389, -0.25278, 0.0021422, -4.1075e-05, 3.2736e-07, 15.296, 0.0091021, -0.0003559, 3.3624e-06, 10.472, -0.22391, 0.0036388, -2.626e-05, 2.0254, -0.060466, 0.0013384, -1.1905e-05, 0.39236, -0.007655, 0.00016901, -1.505e-06, 0.22293, -0.0015068, 3.1323e-05, -2.7534e-07, 5.804], // 105 kVp, 0.1 mm Cu
  [51.166, -0.23192, 0.0012131, -2.0316e-05, 1.5208e-07, 15.348, 0.0039235, -0.00020676, 1.9118e-06, 9.5175, -0.18374, 0.0028866, -2.0829e-05, 1.735, -0.041033, 0.00080551, -6.7584e-06, 0.35558, -0.005195, 0.00010143, -8.5158e-07, 0.2158, -0.001054, 1.9054e-05, -1.5731e-07, 7.053], // 105 kVp, 0.2 mm Cu
  [39.855, -0.22075, 0.00079226, -1.1673e-05, 8.2401e-08, 15.372, 0.0011357, -0.00012963, 1.1864e-06, 8.7413, -0.15136, 0.0022587, -1.6061e-05, 1.5481, -0.030208, 0.0005308, -4.2172e-06, 0.33193, -0.003829, 6.6725e-05, -5.3017e-07, 0.21108, -0.00079881, 1.268e-05, -9.8647e-08, 7.912], // 105 kVp, 0.3 mm Cu
  [23.169, -0.20542, 0.00034355, -3.5534e-06, 2.1149e-08, 15.382, -0.0021672, -4.1851e-05, 4.0337e-07, 7.1691, -0.091144, 0.0011034, -7.1182e-06, 1.2389, -0.015851, 0.00020722, -1.4074e-06, 0.29272, -0.002022, 2.5987e-05, -1.7606e-07, 0.20286, -0.00045338, 5.0815e-06, -3.3064e-08, 9.435], // 105 kVp, 0.6 mm Cu
  [15.418, -0.19866, 0.00020912, -1.5975e-06, 7.9504e-09, 15.361, -0.0031123, -1.6001e-05, 1.9212e-07, 6.2415, -0.062371, 0.0006042, -3.3654e-06, 1.0779, -0.010425, 0.00010634, -6.1344e-07, 0.2722, -0.0013402, 1.3334e-05, -7.6397e-08, 0.19826, -0.00031851, 2.6783e-06, -1.428e-08, 10.288], // 105 kVp, 0.9 mm Cu
  [132.22, -0.29905, 0.0047834, -0.00010627, 9.0939e-07, 15.185, 0.01796, -0.00065668, 6.438e-06, 11.269, -0.26902, 0.0044695, -3.219e-05, 2.4436, -0.096999, 0.0024361, -2.3084e-05, 0.44545, -0.012314, 0.00030909, -2.9334e-06, 0.2327, -0.0023614, 5.6524e-05, -5.3127e-07, 3.982], // 110 kVp, 0.0 mm Cu
  [78.862, -0.2486, 0.0020594, -3.9308e-05, 3.1321e-07, 15.288, 0.0075478, -0.00033944, 3.2322e-06, 10.12, -0.22031, 0.003585, -2.6105e-05, 1.9457, -0.057883, 0.0012696, -1.1272e-05, 0.38216, -0.0073337, 0.00016026, -1.4244e-06, 0.22074, -0.0014571, 2.9762e-05, -2.6095e-07, 6.052], // 110 kVp, 0.1 mm Cu
  [57.473, -0.22866, 0.0011713, -1.945e-05, 1.4544e-07, 15.333, 0.0026547, -0.00019739, 1.8488e-06, 9.1856, -0.18024, 0.0028131, -2.0362e-05, 1.6699, -0.0395, 0.00076586, -6.4072e-06, 0.34722, -0.0050072, 9.6407e-05, -8.0695e-07, 0.21391, -0.0010276, 1.8136e-05, -1.4911e-07, 7.314], // 110 kVp, 0.2 mm Cu
  [45.334, -0.21797, 0.00076919, -1.1183e-05, 7.8729e-08, 15.352, 3.4136e-05, -0.00012403, 1.1585e-06, 8.4308, -0.14846, 0.0021867, -1.5525e-05, 1.4917, -0.029234, 0.00050547, -3.9972e-06, 0.32465, -0.0037119, 6.3515e-05, -5.0221e-07, 0.20936, -0.00078476, 1.208e-05, -9.3321e-08, 8.177], // 110 kVp, 0.3 mm Cu
  [27.083, -0.20323, 0.0003403, -3.4228e-06, 2.0108e-08, 15.351, -0.0030434, -4.0234e-05, 4.1209e-07, 6.9058, -0.090193, 0.0010625, -6.7438e-06, 1.1951, -0.015584, 0.00019838, -1.3273e-06, 0.28699, -0.001994, 2.4862e-05, -1.6579e-07, 0.20138, -0.00045534, 4.8585e-06, -3.0861e-08, 9.705], // 110 kVp, 0.6 mm Cu
  [18.399, -0.19665, 0.00021137, -1.5605e-06, 7.5364e-09, 15.323, -0.0039002, -1.4987e-05, 2.0634e-07, 6.0015, -0.062549, 0.00058663, -3.1566e-06, 1.0391, -0.010405, 0.00010291, -5.756e-07, 0.26703, -0.0013431, 1.2895e-05, -7.1457e-08, 0.19683, -0.00032615, 2.5899e-06, -1.3095e-08, 10.565], // 110 kVp, 0.9 mm Cu
  [141.54, -0.29309, 0.0045925, -0.00010179, 8.7086e-07, 15.183, 0.015932, -0.00062798, 6.1881e-06, 10.952, -0.26669, 0.0044602, -3.2516e-05, 2.351, -0.092753, 0.0023133, -2.1881e-05, 0.43361, -0.011779, 0.00029339, -2.7794e-06, 0.23027, -0.0022748, 5.3751e-05, -5.041e-07, 4.181], // 115 kVp, 0.0 mm Cu
  [86.473, -0.24481, 0.0019856, -3.7687e-05, 3.0004e-07, 15.277, 0.0060336, -0.00032478, 3.121e-06, 9.8159, -0.21725, 0.0035279, -2.5818e-05, 1.8779, -0.055726, 0.0012104, -1.0719e-05, 0.37347, -0.0070665, 0.00015273, -1.3539e-06, 0.21884, -0.001417, 2.8402e-05, -2.4819e-07, 6.291], // 115 kVp, 0.1 mm Cu
  [63.964, -0.22571, 0.0011356, -1.8671e-05, 1.3933e-07, 15.316, 0.0014058, -0.00018931, 1.8007e-06, 8.9005, -0.17744, 0.0027455, -1.9872e-05, 1.6145, -0.038251, 0.00073204, -6.1003e-06, 0.34008, -0.0048552, 9.2112e-05, -7.6789e-07, 0.21227, -0.0010077, 1.7341e-05, -1.4178e-07, 7.563], // 115 kVp, 0.2 mm Cu
  [51.019, -0.21545, 0.00075043, -1.0752e-05, 7.5383e-08, 15.33, -0.0010616, -0.00011933, 1.1423e-06, 8.164, -0.14627, 0.0021241, -1.5014e-05, 1.4436, -0.028464, 0.00048414, -3.8055e-06, 0.31842, -0.0036206, 6.0806e-05, -4.7776e-07, 0.20786, -0.00077559, 1.1566e-05, -8.8539e-08, 8.429], // 115 kVp, 0.3 mm Cu
  [31.225, -0.20121, 0.00033907, -3.3212e-06, 1.9207e-08, 15.32, -0.0039348, -3.8854e-05, 4.2661e-07, 6.6777, -0.089706, 0.0010304, -6.4157e-06, 1.1574, -0.015411, 0.00019139, -1.2587e-06, 0.28201, -0.001978, 2.3968e-05, -1.5691e-07, 0.20005, -0.00045972, 4.6775e-06, -2.8873e-08, 9.961], // 115 kVp, 0.6 mm Cu
  [21.609, -0.19476, 0.00021461, -1.5416e-06, 7.2128e-09, 15.284, -0.0047089, -1.3892e-05, 2.2315e-07, 5.7915, -0.062973, 0.00057512, -2.9836e-06, 1.0052, -0.010431, 0.00010057, -5.4452e-07, 0.2625, -0.0013521, 1.2594e-05, -6.7341e-08, 0.19553, -0.00033511, 2.5286e-06, -1.2046e-08, 10.829], // 115 kVp, 0.9 mm Cu
  [150.91, -0.2876, 0.0044168, -9.7609e-05, 8.3475e-07, 15.179, 0.013965, -0.00060151, 5.9618e-06, 10.672, -0.26446, 0.0044367, -3.2607e-05, 2.2708, -0.08909, 0.0022056, -2.082e-05, 0.42334, -0.011319, 0.00027963, -2.6435e-06, 0.22814, -0.0022013, 5.1305e-05, -4.7992e-07, 4.379], // 120 kVp, 0.0 mm Cu
  [94.241, -0.24133, 0.0019195, -3.6199e-05, 2.8781e-07, 15.264, 0.0045531, -0.00031164, 3.0271e-06, 9.55, -0.21464, 0.0034711, -2.5459e-05, 1.8192, -0.053897, 0.0011588, -1.0231e-05, 0.36593, -0.0068409, 0.00014617, -1.2916e-06, 0.21717, -0.0013844, 2.7207e-05, -2.3676e-07, 6.521], // 120 kVp, 0.1 mm Cu
  [70.651, -0.22299, 0.0011047, -1.7971e-05, 1.337e-07, 15.297, 0.00017259, -0.00018223, 1.7656e-06, 8.6516, -0.17519, 0.0026842, -1.9383e-05, 1.5665, -0.037215, 0.00070287, -5.8297e-06, 0.33388, -0.0047305, 8.8404e-05, -7.3337e-07, 0.21081, -0.00099273, 1.6647e-05, -1.3517e-07, 7.8], // 120 kVp, 0.2 mm Cu
  [56.919, -0.21311, 0.00073508, -1.0374e-05, 7.2343e-08, 15.307, -0.0021535, -0.00011528, 1.1358e-06, 7.931, -0.1446, 0.0020697, -1.4534e-05, 1.4019, -0.027846, 0.00046599, -3.6368e-06, 0.31299, -0.0035486, 5.8495e-05, -4.5618e-07, 0.20652, -0.00077001, 1.112e-05, -8.4206e-08, 8.668], // 120 kVp, 0.3 mm Cu
  [35.602, -0.19931, 0.00033926, -3.2444e-06, 1.8438e-08, 15.287, -0.0048382, -3.7539e-05, 4.4537e-07, 6.4771, -0.089533, 0.0010052, -6.1285e-06, 1.1243, -0.015304, 0.00018584, -1.1996e-06, 0.27762, -0.0019702, 2.3254e-05, -1.492e-07, 0.19884, -0.00046578, 4.5298e-06, -2.7069e-08, 10.206], // 120 kVp, 0.6 mm Cu
  [25.053, -0.19298, 0.00021845, -1.5375e-06, 6.9741e-09, 15.244, -0.005532, -1.2618e-05, 2.4133e-07, 5.6055, -0.063539, 0.00056824, -2.8411e-06, 0.97532, -0.010486, 9.9069e-05, -5.1906e-07, 0.25846, -0.0013648, 1.2397e-05, -6.3913e-08, 0.19434, -0.00034488, 2.488e-06, -1.1115e-08, 11.084], // 120 kVp, 0.9 mm Cu
  [160.34, -0.2825, 0.0042548, -9.3723e-05, 8.0099e-07, 15.173, 0.012054, -0.00057704, 5.7579e-06, 10.423, -0.26238, 0.0044051, -3.2543e-05, 2.2004, -0.085897, 0.0021106, -1.9876e-05, 0.41431, -0.010918, 0.00026748, -2.5226e-06, 0.22623, -0.0021383, 4.9131e-05, -4.5824e-07, 4.575], // 125 kVp, 0.0 mm Cu
  [102.16, -0.23811, 0.0018601, -3.4835e-05, 2.7645e-07, 15.25, 0.0031026, -0.00029973, 2.9486e-06, 9.3144, -0.21241, 0.0034164, -2.5062e-05, 1.7678, -0.052327, 0.0011135, -9.7964e-06, 0.3593, -0.0066482, 0.0001404, -1.2362e-06, 0.21567, -0.0013576, 2.6147e-05, -2.2644e-07, 6.744], // 125 kVp, 0.1 mm Cu
  [77.529, -0.22047, 0.0010778, -1.7341e-05, 1.2854e-07, 15.277, -0.0010468, -0.00017592, 1.7414e-06, 8.4315, -0.17336, 0.0026289, -1.8909e-05, 1.5245, -0.036346, 0.0006775, -5.5892e-06, 0.32842, -0.0046267, 8.5172e-05, -7.0263e-07, 0.2095, -0.00098161, 1.6034e-05, -1.2917e-07, 8.029], // 125 kVp, 0.2 mm Cu
  [63.03, -0.21093, 0.00072244, -1.0044e-05, 6.9592e-08, 15.283, -0.0032416, -0.00011168, 1.1373e-06, 7.725, -0.14332, 0.0020224, -1.4088e-05, 1.3653, -0.027342, 0.0004504, -3.4873e-06, 0.30819, -0.003491, 5.6505e-05, -4.3698e-07, 0.20531, -0.00076713, 1.073e-05, -8.0249e-08, 8.899], // 125 kVp, 0.3 mm Cu
  [40.21, -0.19751, 0.00034044, -3.1886e-06, 1.7793e-08, 15.253, -0.0057494, -3.617e-05, 4.6695e-07, 6.2988, -0.089571, 0.00098561, -5.8769e-06, 1.0951, -0.015241, 0.00018142, -1.1484e-06, 0.27371, -0.0019682, 2.2681e-05, -1.4246e-07, 0.19774, -0.00047298, 4.4084e-06, -2.5421e-08, 10.443], // 125 kVp, 0.6 mm Cu
  [28.73, -0.19128, 0.00022262, -1.5452e-06, 6.8129e-09, 15.204, -0.0063637, -1.1113e-05, 2.5991e-07, 5.4392, -0.064184, 0.00056487, -2.7244e-06, 0.9487, -0.010558, 9.819e-05, -4.9827e-07, 0.25483, -0.0013796, 1.2278e-05, -6.1059e-08, 0.19324, -0.00035511, 2.4633e-06, -1.0284e-08, 11.33], // 125 kVp, 0.9 mm Cu
];
