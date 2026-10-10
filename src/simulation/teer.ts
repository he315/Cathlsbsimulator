// ===========================================================================
// Mitral TEER (transcatheter edge-to-edge repair) teaching engine.
//
// Deterministic and qualitative, for education only. Geometry is expressed in
// a normalised en-face ("surgical") view of the mitral valve seen from the
// left atrium, aorta at 12 o'clock:
//   x  −1 … +1   lateral (A1P1, near the appendage) … medial (A3P3)
//   y  −1 … +1   posterior … anterior
// The line of coaptation is a "smile": most posterior centrally, curving
// anteriorly towards both commissures. Clip arms must lie perpendicular to the
// local line of coaptation, so the correct arm angle changes along the valve.
//
// The residual MR model removes jet components that the device covers; the
// gradient model follows the orifice relation ΔP ∝ (flow / area)², so each
// device, a wider device and a smaller baseline valve all raise the gradient.
// Displayed numbers are model outputs for teaching, not predictions.
// ===========================================================================

import { TEER_HEIGHT_TARGET, type TransseptalResult } from "./transseptal";

export type RiskLevel = "low" | "moderate" | "high";
export type MrEtiology = "degenerative" | "functional";
export type DeviceWidth = "narrow" | "wide";
export type Segment = "A1P1" | "A2P2" | "A3P3";

export interface JetComponent {
  /** position along the line of coaptation (−1 lateral … +1 medial) */
  x: number;
  /** contribution to the MR grade; components sum to the baseline grade */
  severity: number;
  label: string;
}

export interface TeerScenario {
  id: string;
  title: string;
  vignette: string;
  etiology: MrEtiology;
  mechanism: string;
  baselineMr: number;
  jets: JetComponent[];
  mvaCm2: number;
  /** relative forward transmitral flow (1 = typical resting output) */
  flowIndex: number;
  /** fraction of clip-arm length the leaflet can fill when perfectly aligned (0–1) */
  anteriorGraspable: number;
  posteriorGraspable: number;
  coaptationDepthMm?: number;
  flailGapMm?: number;
  flailWidthMm?: number;
  lvefPct: number;
  /** transseptal height (cm) at the centre of the fossa for this atrium */
  septalHeightBaseCm: number;
  /** teaching height band for this anatomy (cm above the mitral annular plane) */
  heightTargetCm: [number, number];
  focus: string;
  teachingPoints: string[];
}

// ---------------------------------------------------------------------------
// Transseptal puncture (shared with LAAO): moved to transseptal.ts with the hands-on puncture
// (structural-transseptal-hands-on) and re-exported here unchanged for compatibility.
// ---------------------------------------------------------------------------

export {
  TEER_HEIGHT_TARGET,
  TEER_HEIGHT_TEXT,
  assessTransseptal,
  septalHeightCm,
  type FossaPoint,
  type TransseptalProcedure,
  type TransseptalResult,
} from "./transseptal";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------------
// Valve geometry
// ---------------------------------------------------------------------------

/** y of the line of coaptation at x (anterior positive). */
export function coaptationY(x: number): number {
  return -0.15 + 0.35 * x * x;
}

/** Tangent of the coaptation line at x, in degrees from the lateral–medial axis. */
export function coaptationTangentDeg(x: number): number {
  return (Math.atan(0.7 * x) * 180) / Math.PI;
}

/** Arm angle perpendicular to the coaptation line at x (90° = anterior–posterior at the centre). */
export function targetArmAngle(x: number): number {
  return 90 + coaptationTangentDeg(x);
}

/** Smallest difference between two axes (0–90°), since arms are symmetric. */
export function rotationError(armAngleDeg: number, x: number): number {
  let d = Math.abs(armAngleDeg - targetArmAngle(x)) % 180;
  if (d > 90) d = 180 - d;
  return d;
}

export function segmentAt(x: number): Segment {
  if (x < -1 / 3) return "A1P1";
  if (x > 1 / 3) return "A3P3";
  return "A2P2";
}

export const DEVICE_REACH: Record<DeviceWidth, number> = { narrow: 0.15, wide: 0.22 };
const COVER_FALLOFF = 0.3;

/** Fraction of a jet at distance d that a device covers. */
export function coverage(d: number, width: DeviceWidth): number {
  const reach = DEVICE_REACH[width];
  if (d <= reach) return 1;
  return Math.max(0, 1 - (d - reach) / COVER_FALLOFF);
}

const smoothstep = (v: number, e0: number, e1: number) => {
  const t = clamp((v - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Multiplier on mitral orifice area from one attached device. */
export function areaFactor(x: number, width: DeviceWidth): number {
  const central = width === "narrow" ? 0.74 : 0.66;
  const commissural = width === "narrow" ? 0.88 : 0.83;
  return central + (commissural - central) * smoothstep(Math.abs(x), 0.3, 0.75);
}

// ---------------------------------------------------------------------------
// Grasp
// ---------------------------------------------------------------------------

export interface DevicePlacement {
  x: number;
  y: number;
  armAngleDeg: number;
  width: DeviceWidth;
}

export type Adequacy = "adequate" | "partial" | "poor";

export function adequacy(insertion: number): Adequacy {
  if (insertion >= 0.67) return "adequate";
  if (insertion >= 0.4) return "partial";
  return "poor";
}

export interface GraspResult {
  anterior: number;
  posterior: number;
  anteriorAdequacy: Adequacy;
  posteriorAdequacy: Adequacy;
  rotationErrorDeg: number;
  /** device offset from the line of coaptation (positive = anterior) */
  apOffset: number;
  /** 0–1: how much of the covered jet this device abolishes */
  effectiveness: number;
  slda: boolean;
  notes: string[];
}

export function grasp(s: TeerScenario, p: DevicePlacement, heightCm: number): GraspResult {
  const err = rotationError(p.armAngleDeg, p.x);
  const rot = Math.cos((err * Math.PI) / 180) ** 2;
  const dy = p.y - coaptationY(p.x);
  const antAp = clamp(1 - Math.max(0, -dy - 0.04) / 0.2, 0, 1);
  const postAp = clamp(1 - Math.max(0, dy - 0.04) / 0.2, 0, 1);
  const [lo, hi] = s.heightTargetCm;
  let hAdj = 0;
  const notes: string[] = [];
  if (heightCm < lo) {
    // Prolapse or flail sits above the annulus, so a low puncture leaves little
    // working height; a tethered functional valve coapts below it.
    hAdj = -(lo - heightCm) * (s.etiology === "degenerative" ? 0.35 : 0.2);
    notes.push("Low puncture: too little height to steer down and grasp cleanly.");
  } else if (heightCm > hi + 0.5) {
    hAdj = -(heightCm - hi - 0.5) * 0.2;
    notes.push("Very high puncture: control at the valve is harder.");
  }
  const comm = Math.abs(p.x) > 0.8 ? 1 - (Math.abs(p.x) - 0.8) * 1.5 : 1;
  if (comm < 1) notes.push("Very close to the commissure: short leaflets and dense chords.");
  const anterior = clamp(s.anteriorGraspable * rot * antAp * comm + hAdj, 0, 1);
  const posterior = clamp(s.posteriorGraspable * rot * postAp * comm + hAdj, 0, 1);
  const minIns = Math.min(anterior, posterior);
  const slda = minIns < 0.4;
  const effectiveness = slda ? 0 : clamp(minIns / 0.67, 0, 1) * (0.6 + 0.4 * rot);
  if (err > 20) notes.push(`Arms ${err.toFixed(0)}° from perpendicular to the coaptation line.`);
  if (dy > 0.12) notes.push("Device sits anterior to the coaptation line: posterior leaflet insertion suffers.");
  if (dy < -0.12) notes.push("Device sits posterior to the coaptation line: anterior leaflet insertion suffers.");
  return {
    anterior,
    posterior,
    anteriorAdequacy: adequacy(anterior),
    posteriorAdequacy: adequacy(posterior),
    rotationErrorDeg: err,
    apOffset: dy,
    effectiveness,
    slda,
    notes,
  };
}

// ---------------------------------------------------------------------------
// Outcome
// ---------------------------------------------------------------------------

export interface PlacedDevice {
  placement: DevicePlacement;
  grasp: GraspResult;
}

export interface RiskItem {
  key: string;
  label: string;
  level: RiskLevel;
  score: number;
  reasons: string[];
}

export function levelFromScore(score: number): RiskLevel {
  if (score >= 4) return "high";
  if (score >= 2) return "moderate";
  return "low";
}

/** Cohort-derived threshold of concern (docs/SIM_FACTS.md item 8); not a guideline value. */
export const GRADIENT_FLAG_MMHG = 5;
/** Anatomical criterion listed in the device IFU (docs/SIM_FACTS.md item 8). */
export const SMALL_MVA_CM2 = 4.0;

export interface TeerOutcome {
  residualMr: number;
  mrGrade: number;
  remainingJets: JetComponent[];
  mvaCm2: number;
  gradientMmHg: number;
  gradientFlag: boolean;
  slda: RiskItem;
  stenosis: RiskItem;
  iasdNote: string;
}

export function remainingJets(s: TeerScenario, devices: PlacedDevice[]): JetComponent[] {
  return s.jets.map((j) => {
    let sev = j.severity;
    for (const d of devices) sev *= 1 - d.grasp.effectiveness * coverage(Math.abs(j.x - d.placement.x), d.placement.width);
    return { ...j, severity: sev };
  });
}

export function mrGrade(residual: number): number {
  return clamp(Math.round(residual), 0, 4);
}

export function postMva(s: TeerScenario, devices: PlacedDevice[]): number {
  let mva = s.mvaCm2;
  for (const d of devices) if (!d.grasp.slda) mva *= areaFactor(d.placement.x, d.placement.width);
  return mva;
}

/**
 * Extra diastolic flow per MR grade. Kept small enough that (1 + 4f)² is less
 * than the gradient rise from the most generous device (1 / 0.88²), so the
 * gradient rises with every attached device as it does in practice.
 */
const FLOW_PER_GRADE = 0.03;

/** Calibrates a 5.2 cm² valve with 4+ MR and typical flow to about 1.8 mmHg. */
export const GRADIENT_K = 39;

/**
 * Mean transmitral gradient from the orifice relation ΔP ∝ (flow / area)².
 * Regurgitant volume returns across the valve in diastole, so diastolic flow
 * rises with the MR grade; the area lost to each device outweighs the flow
 * saved by reducing MR, so the gradient still rises with every device.
 */
export function transmitralGradient(s: TeerScenario, mvaCm2: number, residualMr: number): number {
  const flow = s.flowIndex * (1 + FLOW_PER_GRADE * residualMr);
  return GRADIENT_K * (flow / mvaCm2) ** 2;
}

export function baselineGradient(s: TeerScenario): number {
  return transmitralGradient(s, s.mvaCm2, s.baselineMr);
}

export function teerOutcome(s: TeerScenario, devices: PlacedDevice[]): TeerOutcome {
  const jets = remainingJets(s, devices);
  const residualMr = jets.reduce((a, j) => a + j.severity, 0);
  const mva = postMva(s, devices);
  const gradient = transmitralGradient(s, mva, residualMr);

  // Single-leaflet device attachment
  let worst = 0;
  const reasons: string[] = [];
  devices.forEach((d, i) => {
    const g = d.grasp;
    let sc = 0;
    const tag = devices.length > 1 ? `Device ${i + 1}: ` : "";
    const minIns = Math.min(g.anterior, g.posterior);
    const leaflet = g.anterior < g.posterior ? "anterior" : "posterior";
    if (minIns < 0.4) {
      sc += 4;
      reasons.push(`${tag}poor ${leaflet} leaflet insertion: the device is attached to one leaflet only.`);
    } else if (minIns < 0.67) {
      sc += 2;
      reasons.push(`${tag}partial ${leaflet} leaflet insertion.`);
    }
    if (g.rotationErrorDeg > 30) {
      sc += 1;
      reasons.push(`${tag}arms ${g.rotationErrorDeg.toFixed(0)}° off perpendicular.`);
    }
    if (Math.abs(g.apOffset) > 0.12) {
      sc += 1;
      reasons.push(`${tag}device off the coaptation line.`);
    }
    worst = Math.max(worst, sc);
  });
  let sldaScore = worst;
  if (devices.length > 0 && s.posteriorGraspable < 0.7) {
    sldaScore += 1;
    reasons.push("Short or tethered posterior leaflet.");
  }
  if (devices.length >= 2) {
    sldaScore += 1;
    reasons.push("Each additional device adds tension on the leaflets already grasped.");
  }
  const slda: RiskItem = {
    key: "slda",
    label: "Single-leaflet device attachment",
    level: levelFromScore(sldaScore),
    score: sldaScore,
    reasons,
  };

  // Iatrogenic mitral stenosis
  const sr: string[] = [];
  let st = 0;
  if (s.mvaCm2 < SMALL_MVA_CM2) {
    st += 1;
    sr.push(`Baseline MVA ${s.mvaCm2.toFixed(1)} cm², below the 4.0 cm² anatomical criterion in the device IFU.`);
  }
  if (devices.length >= 2) {
    st += 1;
    sr.push(`${devices.length} devices: each one narrows the orifice further.`);
  }
  if (devices.some((d) => d.placement.width === "wide")) {
    st += 1;
    sr.push("Wide device: larger tissue bridge, smaller orifice.");
  }
  if (gradient > GRADIENT_FLAG_MMHG) {
    st += 2;
    sr.push(`Mean gradient ${gradient.toFixed(1)} mmHg, above ${GRADIENT_FLAG_MMHG} mmHg (a cohort-derived threshold of concern, not a guideline value).`);
  } else if (gradient > 4) {
    st += 1;
    sr.push(`Mean gradient ${gradient.toFixed(1)} mmHg, approaching ${GRADIENT_FLAG_MMHG} mmHg.`);
  }
  const stenosis: RiskItem = { key: "stenosis", label: "Iatrogenic mitral stenosis", level: levelFromScore(st), score: st, reasons: sr };

  return {
    residualMr,
    mrGrade: mrGrade(residualMr),
    remainingJets: jets,
    mvaCm2: mva,
    gradientMmHg: gradient,
    gradientFlag: gradient > GRADIENT_FLAG_MMHG,
    slda,
    stenosis,
    iasdNote:
      "The large steerable guide leaves an iatrogenic ASD. It is usually small with left-to-right flow. Check size and shunt direction on TOE after guide removal; closure is considered for right-to-left shunting with hypoxaemia or significant right heart volume load.",
  };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export interface Deduction {
  points: number;
  reason: string;
}

export interface TeerScoreInput {
  transseptal: TransseptalResult;
  devices: PlacedDevice[];
  /** residual MR grade seen before each device after the first was added */
  gradeBeforeEachExtraDevice: number[];
  regrasps: number;
}

export function scoreTeer(s: TeerScenario, inp: TeerScoreInput): { score: number; deductions: Deduction[] } {
  const d: Deduction[] = [];
  const ts = inp.transseptal;
  if (ts.danger) d.push({ points: 20, reason: "Transseptal puncture in a danger zone." });
  else if (ts.quality === "acceptable") d.push({ points: 5, reason: "Transseptal site acceptable but not ideal for TEER." });
  else if (ts.quality === "poor") d.push({ points: 10, reason: "Transseptal site poorly suited to TEER." });
  inp.devices.forEach((dev, i) => {
    const e = dev.grasp.rotationErrorDeg;
    if (e > 35) d.push({ points: 8, reason: `Device ${i + 1}: arms ${e.toFixed(0)}° from perpendicular.` });
    else if (e > 20) d.push({ points: 4, reason: `Device ${i + 1}: arms ${e.toFixed(0)}° from perpendicular.` });
    if (dev.grasp.slda) d.push({ points: 20, reason: `Device ${i + 1}: released with single-leaflet attachment.` });
  });
  const o = teerOutcome(s, inp.devices);
  if (inp.devices.length === 0) d.push({ points: 40, reason: "No device implanted." });
  if (o.mrGrade >= 4) d.push({ points: 35, reason: "Residual MR 4+." });
  else if (o.mrGrade === 3) d.push({ points: 25, reason: "Residual MR 3+." });
  else if (o.mrGrade === 2) d.push({ points: 12, reason: "Residual MR 2+." });
  if (o.gradientFlag) d.push({ points: 15, reason: `Mean gradient ${o.gradientMmHg.toFixed(1)} mmHg (above ${GRADIENT_FLAG_MMHG}).` });
  for (const g of inp.gradeBeforeEachExtraDevice)
    if (g <= 1) d.push({ points: 8, reason: `Extra device added when residual MR was already ${g}+.` });
  if (inp.regrasps > 2) d.push({ points: Math.min(8, (inp.regrasps - 2) * 2), reason: `${inp.regrasps} re-grasps: each one manipulates the leaflets again.` });
  const total = d.reduce((a, b) => a + b.points, 0);
  return { score: Math.max(0, Math.min(100, Math.round(100 - total))), deductions: d };
}

// ---------------------------------------------------------------------------
// Teaching cases (synthetic)
// ---------------------------------------------------------------------------

export const TEER_SCENARIOS: TeerScenario[] = [
  {
    id: "teer-p2-flail",
    title: "Degenerative MR: P2 flail",
    vignette:
      "Synthetic teaching case. 79-year-old man, severe primary MR from a flail P2 segment with a lateral extension towards P1. High surgical risk; Heart Team recommends TEER.",
    etiology: "degenerative",
    mechanism: "Flail P2 with ruptured chords; the jet is directed anteriorly and extends laterally.",
    baselineMr: 4,
    jets: [
      { x: 0.02, severity: 2.3, label: "P2 flail origin" },
      { x: -0.42, severity: 1.7, label: "Lateral extension (P1–P2)" },
    ],
    mvaCm2: 5.2,
    flowIndex: 1.0,
    anteriorGraspable: 0.92,
    posteriorGraspable: 0.78,
    flailGapMm: 6,
    flailWidthMm: 13,
    lvefPct: 62,
    septalHeightBaseCm: 3.4,
    heightTargetCm: TEER_HEIGHT_TARGET.degenerative,
    focus: "Grasp at the jet origin, then decide whether a second device is worth the gradient.",
    teachingPoints: [
      "Place the first device at the origin of the largest jet component.",
      "A wide flail may need a second device; check the gradient before adding it.",
      "A flail segment rises above the annulus, so degenerative MR needs at least 4 cm of height.",
    ],
  },
  {
    id: "teer-fmr",
    title: "Secondary MR: tethered leaflets",
    vignette:
      "Synthetic teaching case. 68-year-old woman with ischaemic cardiomyopathy, LVEF 30%, severe secondary MR despite optimised medical therapy and CRT. Deep coaptation point.",
    etiology: "functional",
    mechanism: "Symmetric tethering from LV dilatation; central jet with smaller medial and lateral components.",
    baselineMr: 4,
    jets: [
      { x: 0, severity: 2.8, label: "Central A2–P2 jet" },
      { x: -0.4, severity: 0.6, label: "Lateral component" },
      { x: 0.4, severity: 0.6, label: "Medial component" },
    ],
    mvaCm2: 4.6,
    flowIndex: 0.95,
    anteriorGraspable: 0.8,
    posteriorGraspable: 0.7,
    coaptationDepthMm: 9,
    lvefPct: 30,
    septalHeightBaseCm: 3.7,
    heightTargetCm: TEER_HEIGHT_TARGET.functional,
    focus: "Insertion: a short, tethered posterior leaflet leaves no margin for misalignment.",
    teachingPoints: [
      "Tethered leaflets coapt below the annulus, so a lower puncture than in degenerative MR is acceptable.",
      "The posterior leaflet is short; insertion is the limiting step and small rotation errors cost it.",
      "Centre the device on the line of coaptation to avoid single-leaflet attachment.",
    ],
  },
  {
    id: "teer-commissural",
    title: "Medial commissural jet",
    vignette:
      "Synthetic teaching case. 83-year-old woman, severe primary MR from an A3–P3 prolapse with a jet arising close to the medial commissure.",
    etiology: "degenerative",
    mechanism: "A3–P3 prolapse; jet originates near the medial commissure.",
    baselineMr: 4,
    jets: [
      { x: 0.74, severity: 3.3, label: "Medial commissural jet (A3–P3)" },
      { x: 0.45, severity: 0.7, label: "Extension towards A2–P2" },
    ],
    mvaCm2: 5.0,
    flowIndex: 0.9,
    anteriorGraspable: 0.88,
    posteriorGraspable: 0.82,
    lvefPct: 58,
    septalHeightBaseCm: 3.4,
    heightTargetCm: TEER_HEIGHT_TARGET.degenerative,
    focus: "Rotation: the coaptation line curves near the commissure, so the arms must rotate with it.",
    teachingPoints: [
      "Perpendicular to the coaptation line is not the same angle at A3–P3 as at A2–P2.",
      "Commissural grasps have shorter leaflets and denser chords.",
      "A device away from the jet origin barely changes the MR.",
    ],
  },
  {
    id: "teer-small-mva",
    title: "Small baseline mitral valve area",
    vignette:
      "Synthetic teaching case. 86-year-old woman, severe primary MR from P2 prolapse. Baseline MVA is small and the baseline gradient is already raised.",
    etiology: "degenerative",
    mechanism: "P2 prolapse in a small valve with annular calcium.",
    baselineMr: 4,
    jets: [
      { x: 0, severity: 3.4, label: "P2 prolapse jet" },
      { x: 0.3, severity: 0.6, label: "Medial extension" },
    ],
    mvaCm2: 3.6,
    flowIndex: 0.9,
    anteriorGraspable: 0.9,
    posteriorGraspable: 0.82,
    lvefPct: 60,
    septalHeightBaseCm: 3.4,
    heightTargetCm: TEER_HEIGHT_TARGET.degenerative,
    focus: "Stenosis: every device and every millimetre of device width costs orifice area.",
    teachingPoints: [
      "Measure baseline MVA and gradient before choosing a device.",
      "Prefer the narrower device and the fewest devices in a small valve.",
      "Check the mean gradient before release; above 5 mmHg is a cohort-derived threshold of concern.",
    ],
  },
];

export function teerScenarioById(id: string): TeerScenario | undefined {
  return TEER_SCENARIOS.find((s) => s.id === id);
}

/** A perfectly aligned placement at x (for tests and the debrief). */
export function idealPlacement(x: number, width: DeviceWidth = "narrow"): DevicePlacement {
  return { x, y: coaptationY(x), armAngleDeg: targetArmAngle(x), width };
}
