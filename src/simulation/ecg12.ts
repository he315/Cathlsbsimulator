// ---------------------------------------------------------------------------
// 12-lead ECG from a synthetic vectorcardiogram.
//
// The heart's electrical activity is a time-varying dipole in Frank lead axes
// (x towards the patient's left, y towards the feet, z towards the back). Each
// surface lead is the dot product of that dipole with the lead's vector. The
// lead vectors are Dower's coefficients for deriving the 12 standard leads
// from Frank X, Y, Z (table reproduced in Vondrak and Penhaker, Front Physiol 2022,
// doi:10.3389/fphys.2022.856590, Table 3; see docs/realism/facts/S9.md).
// Two entries of that printed table are typographical errors: V4 Z is printed
// -0.604 and V5 X 2.125. The same paper's Table 4 (inverse Dower matrix) is the
// pseudo-inverse of the 8 independent leads only with V4 Z = -0.601 and
// V5 X = 1.125 (max |error| 0.0005, against 0.097 with the printed values).
// The corrected values are used here; patient.test.ts checks the cross-check.
//
// The dipole itself (P, QRS loop, T, ventricular ectopy, VT, VF, AF f-waves)
// is a MODEL: sums of Gaussian pulses whose timing and vectors were set so the
// normal ECG has the textbook pattern (rS in V1, qR in V5-V6, transition at
// V3-V4, upright T in I, II and V2-V6, inverted aVR). Ischaemia enters as an
// ST injury vector and a T-wave vector added through the ST segment and T
// wave; the patient engine builds them from the anatomy of the ischaemic
// myocardium (patient/coronaryFlow.ts), so the lead pattern emerges from where
// the ischaemic territory lies.
//
// Units: mV. 1 mm on standard paper = 0.1 mV.
// ---------------------------------------------------------------------------

export const LEADS = ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"] as const;
export type Lead = (typeof LEADS)[number];
export type Vec3f = [number, number, number];

/**
 * Dower lead vectors: lead = a·X + b·Y + c·Z (Frank). Vondrak and Penhaker 2022, Table 3, with the
 * V4 Z and V5 X typographical errors corrected against the paper's Table 4 (see header).
 */
export const DOWER: Record<Lead, Vec3f> = {
  I: [0.632, -0.235, 0.059],
  II: [0.235, 1.066, -0.132],
  III: [-0.397, 1.301, -0.191],
  aVR: [-0.434, -0.415, 0.037],
  aVL: [0.515, -0.768, 0.125],
  aVF: [-0.081, 1.184, -0.162],
  V1: [-0.515, 0.157, -0.917],
  V2: [0.044, 0.164, -1.387],
  V3: [0.882, 0.098, -1.277],
  V4: [1.213, 0.127, -0.601],
  V5: [1.125, 0.127, -0.086],
  V6: [0.831, 0.076, 0.23],
};

const LEAD_MAT = new Float32Array(LEADS.flatMap((l) => DOWER[l]));

export function project(v: Vec3f, lead: Lead): number {
  const d = DOWER[lead];
  return v[0] * d[0] + v[1] * d[1] + v[2] * d[2];
}

/** All 12 leads for one dipole, in LEADS order. */
export function leadsFromVcg(v: Vec3f, out: Float32Array = new Float32Array(12)): Float32Array {
  for (let i = 0; i < 12; i++) out[i] = v[0] * LEAD_MAT[i * 3] + v[1] * LEAD_MAT[i * 3 + 1] + v[2] * LEAD_MAT[i * 3 + 2];
  return out;
}

export const leadIndex = (l: Lead): number => LEADS.indexOf(l);

/**
 * Inverse Dower transformation (Frank X, Y, Z from I, II, V1-V6) as printed in Vondrak and Penhaker
 * 2022, Table 4. Rows X, Y, Z; columns I, II, V1, V2, V3, V4, V5, V6. Used to cross-check DOWER.
 */
export const INVERSE_DOWER_LEADS: Lead[] = ["I", "II", "V1", "V2", "V3", "V4", "V5", "V6"];
export const INVERSE_DOWER: [number[], number[], number[]] = [
  [0.156, -0.01, -0.172, -0.074, 0.122, 0.231, 0.239, 0.194],
  [-0.227, 0.887, 0.057, -0.019, -0.106, -0.022, 0.041, 0.048],
  [0.022, 0.102, -0.229, -0.31, -0.246, -0.063, 0.055, 0.108],
];

// ---------------------------------------------------------------------------
// Beat morphology (MODEL PARAMETERS)
// ---------------------------------------------------------------------------

/**
 * Beat morphology. 'lbbb' and 'rbbb' are the bundle-branch templates of the pre-brief ECG
 * (diag-acs-scenarios, conductionPulses below); the patient engine does not draw them yet.
 */
export type BeatMorph = "normal" | "ectopic" | "vt" | "aivr" | "paced" | "lbbb" | "rbbb";

export interface EcgBeat {
  morph: BeatMorph;
  /** end of the T wave after the R peak (s); the clock's end-systole */
  qt: number;
  /** ST injury vector (mV, Frank) */
  st: Vec3f;
  /** additive T-wave vector (mV, Frank): hyperacute T when ischaemia is fresh, inverted after reperfusion */
  tExtra: Vec3f;
  /** QRS amplitude scale (habitus, electrode contact) */
  qrsScale?: number;
}

interface Pulse {
  t: number; // centre relative to R (s)
  sl: number; // sigma before the centre
  sr: number; // sigma after the centre
  v: Vec3f;
}

const NARROW: Pulse[] = [
  { t: -0.026, sl: 0.007, sr: 0.007, v: [-0.17, 0.02, -0.28] }, // septal: rightward, anterior
  { t: 0.0, sl: 0.009, sr: 0.01, v: [0.92, 0.72, 0.36] }, // main LV free wall: left, inferior, posterior
  { t: 0.024, sl: 0.008, sr: 0.008, v: [-0.2, -0.12, 0.5] }, // terminal basal: posterior, superior
];
const NARROW_T: Vec3f = [0.27, 0.22, -0.12];

// ventricular origin (LV apical focus): wide, superior and anterior, with a discordant T
const WIDE: Pulse[] = [
  { t: -0.03, sl: 0.025, sr: 0.03, v: [-0.55, -0.95, -1.05] },
  { t: 0.04, sl: 0.03, sr: 0.03, v: [0.35, -0.25, 0.4] },
];
const WIDE_T: Vec3f = [0.25, 0.45, 0.4];

// right-ventricular apical pacing: wide, left-bundle-branch-like, superior axis
const PACED: Pulse[] = [
  { t: -0.02, sl: 0.03, sr: 0.03, v: [0.7, -1.2, 0.75] },
  { t: 0.05, sl: 0.025, sr: 0.03, v: [0.25, -0.2, 0.5] },
];
const PACED_T: Vec3f = [-0.25, 0.3, -0.35];

// Bundle-branch templates (diag-acs-scenarios; MODEL PARAMETERS, docs/realism/facts/pkg-diag-acs-scenarios.md).
// Set so that the leads show the features the 2023 ESC supplementary figure lists, as the module text
// gives them (cp-acs-thrombus-ecg, src/content/manual/complex-pci/07-acs-thrombus.ts): LBBB a QRS over
// 120 ms, no Q wave and a monomorphic R in I, V5 and V6, ST and T opposite to the main QRS deflection;
// RBBB a QRS over 120 ms, an rsR' in V1-V3 and slurred S waves in I, aVL and V5-V6.

// left bundle branch block: the septum activates from the right, then the free wall leftward and posterior
const LBBB: Pulse[] = [
  { t: -0.035, sl: 0.022, sr: 0.024, v: [0.42, 0.08, 0.55] },
  { t: 0.025, sl: 0.026, sr: 0.03, v: [0.88, 0.22, 0.62] },
];
const LBBB_T: Vec3f = [-0.24, -0.06, -0.28];

// right bundle branch block: the normal left-sided activation, then a late rightward and anterior force
const RBBB: Pulse[] = [
  ...NARROW,
  { t: 0.055, sl: 0.016, sr: 0.022, v: [-0.42, 0.06, -0.5] },
];
const RBBB_T: Vec3f = [0.27, 0.22, 0.06];

/**
 * The secondary ST displacement of a bundle-branch block or a paced beat: opposite to the main QRS
 * deflection (mV, Frank; MODEL PARAMETER). Not an injury vector: stMm of an EcgBeat's st does not
 * include it, so a block does not count as ST elevation by itself.
 */
export const SECONDARY_ST: Partial<Record<BeatMorph, Vec3f>> = {
  lbbb: [-0.07, -0.015, -0.1],
  paced: [-0.06, 0.08, -0.06],
};

// constant lookups, so that the per-sample dipole allocates nothing
const PULSES_OF: Record<BeatMorph, Pulse[]> = { normal: NARROW, paced: PACED, lbbb: LBBB, rbbb: RBBB, ectopic: WIDE, vt: WIDE, aivr: WIDE };
const T_OF: Record<BeatMorph, Vec3f> = { normal: NARROW_T, paced: PACED_T, lbbb: LBBB_T, rbbb: RBBB_T, ectopic: WIDE_T, vt: WIDE_T, aivr: WIDE_T };

/** An asymmetric Gaussian centred on c, with widths sl before it and sr after it. */
function gauss(t: number, c: number, sl: number, sr: number): number {
  const d = t - c;
  const s = d < 0 ? sl : sr;
  return Math.exp(-(d * d) / (2 * s * s));
}

function g(t: number, p: Pulse): number {
  return gauss(t, p.t, p.sl, p.sr);
}

function smooth01(x: number): number {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
}

/** QRS onset and J point relative to the R peak for a morphology (s). */
const QRS_NARROW = { onset: -0.045, j: 0.042 } as const;
const QRS_RBBB = { onset: -0.045, j: 0.09 } as const;
const QRS_WIDE = { onset: -0.09, j: 0.1 } as const;
const QRS_OF: Record<BeatMorph, { readonly onset: number; readonly j: number }> = { normal: QRS_NARROW, rbbb: QRS_RBBB, paced: QRS_WIDE, lbbb: QRS_WIDE, ectopic: QRS_WIDE, vt: QRS_WIDE, aivr: QRS_WIDE };

export function qrsWindow(morph: BeatMorph): { onset: number; j: number } {
  const w = QRS_OF[morph];
  return { onset: w.onset, j: w.j };
}

/**
 * Ventricular dipole (QRS, ST segment and T wave) at time t after the R peak of a beat.
 * Valid for t in about [-0.12, qt + 0.1].
 */
export function ventricularVcg(t: number, b: EcgBeat, out: Vec3f = [0, 0, 0]): Vec3f {
  const pulses = PULSES_OF[b.morph];
  const T = T_OF[b.morph];
  const k = b.qrsScale ?? 1;
  let x = 0,
    y = 0,
    z = 0;
  if (t > -0.16 && t < 0.2) {
    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      const w = g(t, p) * k;
      x += p.v[0] * w;
      y += p.v[1] * w;
      z += p.v[2] * w;
    }
    if (b.morph === "paced" && Math.abs(t + 0.075) < 0.0015) {
      // pacing spike (2-3 ms)
      x += 1.6;
      y += 1.6;
    }
  }
  // T wave: asymmetric, peaking ~90 ms before its end; ST injury held from the J point through the T wave
  const j = QRS_OF[b.morph].j;
  const tEnd = Math.max(j + 0.12, b.qt + (b.morph === "normal" ? 0 : 0.04));
  const tPeak = tEnd - 0.09;
  if (t > j - 0.02 && t < tEnd + 0.12) {
    const wT = gauss(t, tPeak, 0.065, 0.038);
    x += (T[0] + b.tExtra[0]) * wT;
    y += (T[1] + b.tExtra[1]) * wT;
    z += (T[2] + b.tExtra[2]) * wT;
    const wS = smooth01((t - j) / 0.02) * (t < tPeak ? 1 : smooth01((tEnd + 0.02 - t) / (tEnd + 0.02 - tPeak)));
    x += b.st[0] * wS;
    y += b.st[1] * wS;
    z += b.st[2] * wS;
  }
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/** Sinus P wave dipole at time t relative to the P peak (left, inferior, slightly anterior). */
const P_VEC: Vec3f = [0.075, 0.105, -0.015];
export function pWaveVcg(t: number, out: Vec3f = [0, 0, 0], scale = 1): Vec3f {
  const w = scale * Math.exp(-(t * t) / (2 * 0.021 * 0.021));
  out[0] += P_VEC[0] * w;
  out[1] += P_VEC[1] * w;
  out[2] += P_VEC[2] * w;
  return out;
}

/** P peak relative to the R peak for a PR interval (PR measured from P onset to QRS onset). */
export function pPeakBeforeR(pr: number): number {
  return pr + 0.045 - 0.05;
}

/** Atrial fibrillation f-waves: low-amplitude irregular 5-7 Hz activity, best seen in V1 (MODEL). */
export function fWaveVcg(t: number, seed: number, out: Vec3f = [0, 0, 0]): Vec3f {
  const s = seed * 0.001;
  const a = 0.045 * (Math.sin(2 * Math.PI * 6.1 * t + s) + 0.6 * Math.sin(2 * Math.PI * 4.7 * t + 2.1 * s) + 0.4 * Math.sin(2 * Math.PI * 7.9 * t + 3.3 * s));
  out[0] += -0.35 * a;
  out[1] += 0.3 * a;
  out[2] += -0.6 * a;
  return out;
}

/**
 * Ventricular fibrillation: chaotic 4-7 Hz activity whose amplitude decays from coarse to fine
 * over minutes (MODEL: amplitude 0.6 mV at onset halving every 3 minutes).
 */
export function vfVcg(t: number, sinceOnset: number, seed: number, out: Vec3f = [0, 0, 0]): Vec3f {
  const amp = 0.6 * Math.pow(0.5, sinceOnset / 180) + 0.06;
  const s = seed * 0.0007;
  // frequencies wander slowly: f(t) = f0 + a·sin(ωt), integrated so the phase is continuous
  const ph = (f0: number, a: number, w: number, p0: number) => 2 * Math.PI * (f0 * t - (a / w) * Math.cos(w * t + p0)) + p0;
  const env = 0.65 + 0.35 * Math.sin(2 * Math.PI * 0.45 * t + s);
  const a = Math.sin(ph(4.6, 0.8, 0.31, s));
  const b = Math.sin(ph(5.9, 0.7, 0.23, 2 * s));
  const c = Math.sin(ph(3.8, 0.5, 0.17, 3 * s));
  out[0] += amp * env * (0.7 * a + 0.3 * b);
  out[1] += amp * env * (0.5 * b + 0.4 * c);
  out[2] += amp * env * (0.6 * c - 0.3 * a);
  return out;
}

// ---------------------------------------------------------------------------
// ST measurement and STEMI criteria
// ---------------------------------------------------------------------------

/** ST deviation per lead in mm (0.1 mV = 1 mm) for an ST injury vector. */
export function stMm(st: Vec3f): Record<Lead, number> {
  const out = {} as Record<Lead, number>;
  for (const l of LEADS) out[l] = project(st, l) * 10;
  return out;
}

const GROUPS: { name: string; leads: Lead[] }[] = [
  { name: "inferior", leads: ["II", "III", "aVF"] },
  { name: "lateral", leads: ["I", "aVL", "V5", "V6"] },
  { name: "anterior", leads: ["V1", "V2", "V3", "V4"] },
];

/**
 * ST-elevation criteria (J point): ≥ 1 mm in two contiguous leads, except V2-V3 where ≥ 2 mm in men,
 * ≥ 2.5 mm in young men and ≥ 1.5 mm in women (Fourth Universal Definition, as summarised in facts
 * S9 §ECG). "Young" is taken as < 40 y: a MODEL PARAMETER (the source gives no age). Contiguity is
 * approximated by the three anatomical lead groups.
 */
export const MP_YOUNG_MAN_AGE = 40;
export function stemiCriteria(st: Record<Lead, number>, sex: "M" | "F", ageY: number): { met: boolean; groups: string[]; leads: Lead[] } {
  const thr = (l: Lead) => (l === "V2" || l === "V3" ? (sex === "F" ? 1.5 : ageY < MP_YOUNG_MAN_AGE ? 2.5 : 2) : 1);
  const leads: Lead[] = [];
  const groups: string[] = [];
  for (const gp of GROUPS) {
    const hit = gp.leads.filter((l) => st[l] >= thr(l));
    if (hit.length >= 2) {
      groups.push(gp.name);
      leads.push(...hit);
    }
  }
  return { met: groups.length > 0, groups, leads };
}

// ---------------------------------------------------------------------------
// Right-sided and posterior leads, the culprit's injury vector and the
// pre-brief strip (diag-acs-scenarios)
//
// The 2023 ESC supplementary data, as cp-acs-thrombus-ecg quotes them
// (src/content/manual/complex-pci/07-acs-thrombus.ts, "Job 1: the activation
// ECG"), count V3R and V4R among the contiguous leads, ask for ST elevation of
// at least 0.5 mm in V7-V9 for a posterior STEMI, and use 1 mm in every lead
// other than V2-V3. Dower's table has no right-sided or posterior leads, so
// their lead vectors here are MODEL PARAMETERS (docs/realism/facts/
// pkg-diag-acs-scenarios.md): V3R and V4R are V3 and V4 mirrored across the
// sagittal plane (x negated); V7, V8 and V9 lie on V6's horizontal plane,
// rotated from V6 towards the back (posterior axillary, mid-scapular and
// paraspinal lines) at V6's horizontal magnitude. The PCI RV-infarct case
// (pci-acs-thrombus) uses the same leads.
// ---------------------------------------------------------------------------

export const RIGHT_LEADS = ["V3R", "V4R"] as const;
export const POSTERIOR_LEADS = ["V7", "V8", "V9"] as const;
export type RightLead = (typeof RIGHT_LEADS)[number];
export type PosteriorLead = (typeof POSTERIOR_LEADS)[number];
export type ExtraLead = RightLead | PosteriorLead;
export type AnyLead = Lead | ExtraLead;
/** The 12 standard leads, then V3R, V4R, V7, V8 and V9. */
export const ALL_LEADS: readonly AnyLead[] = [...LEADS, ...RIGHT_LEADS, ...POSTERIOR_LEADS];

const mirror = (v: Vec3f): Vec3f => [-v[0], v[1], v[2]];
/** V6's horizontal (x, z) magnitude; V6 itself lies about 15 degrees behind the x axis. */
const V6_H = Math.hypot(DOWER.V6[0], DOWER.V6[2]);
/** Angles behind the patient's left (x) axis of V7, V8 and V9 on V6's horizontal plane (MODEL PARAMETERS), continuing V6's sweep. */
export const MP_POSTERIOR_LEAD_DEG: Record<PosteriorLead, number> = { V7: 45, V8: 65, V9: 85 };
const posterior = (deg: number): Vec3f => {
  const a = (deg * Math.PI) / 180;
  return [V6_H * Math.cos(a), DOWER.V6[1], V6_H * Math.sin(a)];
};

/** Lead vectors of the right-sided and posterior leads (MODEL PARAMETERS; see the header above). */
export const EXTRA_LEAD_VECTORS: Record<ExtraLead, Vec3f> = {
  V3R: mirror(DOWER.V3),
  V4R: mirror(DOWER.V4),
  V7: posterior(MP_POSTERIOR_LEAD_DEG.V7),
  V8: posterior(MP_POSTERIOR_LEAD_DEG.V8),
  V9: posterior(MP_POSTERIOR_LEAD_DEG.V9),
};
export function leadVector(l: AnyLead): Vec3f {
  return (DOWER as Record<string, Vec3f>)[l] ?? EXTRA_LEAD_VECTORS[l as ExtraLead];
}

export function projectAny(v: Vec3f, l: AnyLead): number {
  const d = leadVector(l);
  return v[0] * d[0] + v[1] * d[1] + v[2] * d[2];
}

/** ST deviation in mm in the 12 standard leads and V3R, V4R, V7, V8 and V9 for an ST injury vector. */
export function stMmAll(st: Vec3f): Record<AnyLead, number> {
  const out = {} as Record<AnyLead, number>;
  for (const l of ALL_LEADS) out[l] = projectAny(st, l) * 10;
  return out;
}

/** Posterior STEMI threshold in V7-V9 (mm): 2023 ESC supplementary data, Figure S2, as cp-acs-thrombus-ecg quotes it. */
export const POSTERIOR_ST_MM = 0.5;
/** Threshold in every lead other than V2-V3 (mm), V3R and V4R included: the same figure. */
export const OTHER_LEADS_ST_MM = 1;

/**
 * The ESC supplementary patterns on the 17 leads: classic ST elevation (stemiCriteria), right
 * ventricular involvement (at least 1 mm in V3R and V4R), and the posterior pattern (ST depression
 * in V1-V3 with at least 0.5 mm of elevation in two of V7-V9).
 */
export function extendedStemi(st: Record<AnyLead, number>, sex: "M" | "F", ageY: number): { standard: ReturnType<typeof stemiCriteria>; rv: boolean; posterior: boolean; met: boolean } {
  const standard = stemiCriteria(st, sex, ageY);
  const rv = RIGHT_LEADS.every((l) => st[l] >= OTHER_LEADS_ST_MM);
  const posteriorUp = POSTERIOR_LEADS.filter((l) => st[l] >= POSTERIOR_ST_MM).length >= 2;
  const anteriorDown = (["V1", "V2", "V3"] as const).filter((l) => st[l] < 0).length >= 2;
  const posterior = posteriorUp && anteriorDown;
  return { standard, rv, posterior, met: standard.met || rv || posterior };
}

// --- the culprit's injury vector -------------------------------------------------------------

/** What injuryVectorFor reads of a coronary region (FlowRegion in patient/coronaryFlow.ts). */
export interface InjuryRegion {
  vessel: string;
  /** right-ventricular myocardium */
  rv?: boolean;
  p0: number;
  p1: number;
  demand: number;
  /** unit vector from the heart centre to the region (Frank) */
  dir: readonly [number, number, number];
  /** the vessels from the ostium to the region, with the param where the path leaves each */
  path: readonly { vessel: string; param: number }[];
}

/**
 * Weight of the right-ventricular regions in the pre-brief injury vector (MODEL PARAMETER). The
 * patient engine counts the RV at half weight (responses.ts vectors); the pre-brief counts it in
 * full, because the right-sided chest leads lie over the RV free wall and a single dipole would
 * otherwise hide the RV injury that V4R shows in a proximal RCA occlusion.
 */
export const MP_PREBRIEF_RV_WEIGHT = 1;
/**
 * ST injury gain of the pre-brief ECG, mV per unit of (myocardial share × transmural injury)
 * (MODEL PARAMETER). The engine's resting gain (MP_RESP.stGain) is 1.0 with transmural injury
 * growing over minutes; the pre-brief shows an established occlusion at 1.5.
 */
export const MP_PREBRIEF_ST_GAIN = 1.5;

/** The share (0..1) of a region beyond an occlusion at (vessel, param): 0 upstream or on another branch. */
export function shareBeyond(r: InjuryRegion, vessel: string, param: number): number {
  if (r.vessel === vessel) {
    if (r.p0 >= param) return 1;
    if (r.p1 <= param) return 0;
    return (r.p1 - param) / Math.max(1e-6, r.p1 - r.p0);
  }
  // a branch beyond the occlusion: its path leaves the occluded vessel at or after the occlusion
  for (const p of r.path) if (p.vessel === vessel) return p.param >= param ? 1 : 0;
  return 0;
}

/**
 * The ST injury vector of transmural ischaemia beyond one or more occlusions (mV, Frank), the way
 * the patient engine sums it (responses.ts vectors: each region's direction weighted by its share
 * of the myocardium), with the pre-brief's RV weight and gain. Regions are the engine's
 * (engine.flow.regions, or defaultFlowMap().regions for the textbook network).
 */
export function injuryVectorFor(
  regions: readonly InjuryRegion[],
  occlusions: readonly { vessel: string; param: number }[],
  opts: { rvWeight?: number; gain?: number } = {}
): Vec3f {
  const rvW = opts.rvWeight ?? MP_PREBRIEF_RV_WEIGHT;
  const gain = opts.gain ?? MP_PREBRIEF_ST_GAIN;
  const w = (r: InjuryRegion) => r.demand * (r.rv ? rvW : 1);
  const total = regions.reduce((a, r) => a + w(r), 0) || 1;
  const out: Vec3f = [0, 0, 0];
  for (const r of regions) {
    let share = 0;
    for (const o of occlusions) share = Math.max(share, shareBeyond(r, o.vessel, o.param));
    if (share <= 0) continue;
    const k = (gain * share * w(r)) / total;
    out[0] += k * r.dir[0];
    out[1] += k * r.dir[1];
    out[2] += k * r.dir[2];
  }
  return out;
}

/**
 * Diffuse subendocardial ischaemia (left main or multivessel): ST depression in most leads with
 * elevation in aVR (MODEL PARAMETER: the injury vector points away from the apex, towards aVR, so
 * that the leads show the module's pattern of depression in six or more leads with elevation in
 * aVR and V1).
 */
export const MP_DIFFUSE_SUBENDOCARDIAL_ST: Vec3f = [-0.12, -0.145, -0.045];

// --- the pre-brief strip -------------------------------------------------------------------------

export interface EcgStripSpec {
  /** the conducted beat: narrow, a bundle-branch block or a paced rhythm */
  morph: "normal" | "lbbb" | "rbbb" | "paced";
  /** heart rate, beats/min */
  hr: number;
  /** ST injury vector (mV, Frank) */
  st: Vec3f;
  /** additive T-wave vector (mV, Frank); default none */
  tExtra?: Vec3f;
  /** PR interval (s); default 0.16 */
  pr?: number;
}

/** Sample rate of the pre-brief strips (Hz), as the engine's trace. */
export const STRIP_HZ = 250;

/**
 * One strip per lead (mV, `seconds` long at STRIP_HZ) of a regular rhythm built from the engine's
 * dipole (ventricularVcg and pWaveVcg) with the strip's ST vector, plus the secondary ST
 * displacement of a block or a paced beat. Deterministic: the same spec gives the same strip.
 */
export function ecgStrip(spec: EcgStripSpec, leads: readonly AnyLead[] = ALL_LEADS, seconds = 2.5): Record<AnyLead, Float32Array> {
  const n = Math.max(1, Math.round(seconds * STRIP_HZ));
  const rr = 60 / Math.max(20, spec.hr);
  // QT by Bazett from a corrected 0.40 s (MODEL PARAMETER, as the engine's clock uses)
  const qt = 0.4 * Math.sqrt(rr);
  const morph: BeatMorph = spec.morph;
  const secondary = SECONDARY_ST[morph] ?? [0, 0, 0];
  const beat: EcgBeat = { morph, qt, st: [spec.st[0] + secondary[0], spec.st[1] + secondary[1], spec.st[2] + secondary[2]], tExtra: spec.tExtra ?? [0, 0, 0] };
  const pp = pPeakBeforeR(spec.pr ?? 0.16);
  const out = {} as Record<AnyLead, Float32Array>;
  for (const l of leads) out[l] = new Float32Array(n);
  const v: Vec3f = [0, 0, 0];
  const first = 0.35;
  for (let i = 0; i < n; i++) {
    const t = i / STRIP_HZ;
    v[0] = v[1] = v[2] = 0;
    // the nearest R peak at or before t + half a beat
    const k = Math.round((t - first) / rr);
    for (const kk of [k - 1, k, k + 1]) {
      const tr = first + kk * rr;
      const dt = t - tr;
      if (dt < -0.5 || dt > rr + 0.1) continue;
      const vv = ventricularVcg(dt, beat, [0, 0, 0]);
      v[0] += vv[0];
      v[1] += vv[1];
      v[2] += vv[2];
      if (morph !== "paced") pWaveVcg(dt + pp, v);
    }
    for (const l of leads) out[l][i] = projectAny(v, l);
  }
  return out;
}

/** A pre-brief ECG pattern (the ECG of an ACS scenario, src/simulation/diagnosticScenarios/acs.ts AcsEcg). */
export interface EcgPatternSpec {
  morph: EcgStripSpec["morph"];
  hr: number;
  /** culprit occlusions on the coronary network passed to stripSpecFor */
  occlusions?: readonly { vessel: string; param: number }[];
  /** diffuse subendocardial ischaemia */
  diffuse?: boolean;
  /** T-wave inversion over a territory, without ST elevation */
  tInversion?: "lateral" | "anterior";
}

/**
 * T-wave vectors of the inverted T waves of an NSTE-ACS without ST elevation (mV, Frank; MODEL
 * PARAMETERS): pointing away from the lateral wall (negative T in I, aVL, V5 and V6) or the anterior
 * wall (negative T in V1-V4).
 */
export const MP_T_INVERSION: Record<NonNullable<EcgPatternSpec["tInversion"]>, Vec3f> = {
  lateral: [-0.36, -0.08, -0.12],
  anterior: [-0.04, -0.02, 0.38],
};

/** The strip of a pattern on a coronary network (the engine's regions; the pre-brief passes defaultFlowMap's). */
export function stripSpecFor(p: EcgPatternSpec, regions: readonly InjuryRegion[]): EcgStripSpec {
  const st: Vec3f = p.occlusions?.length ? injuryVectorFor(regions, p.occlusions) : [0, 0, 0];
  if (p.diffuse) for (let i = 0; i < 3; i++) st[i] += MP_DIFFUSE_SUBENDOCARDIAL_ST[i];
  const tExtra: Vec3f = p.tInversion ? [...MP_T_INVERSION[p.tInversion]] : [0, 0, 0];
  return { morph: p.morph, hr: p.hr, st, tExtra };
}
