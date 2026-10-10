// ===========================================================================
// Left atrial appendage occlusion (LAAO) teaching engine.
//
// Deterministic and qualitative, for education only. Two GENERIC device
// types are modelled with illustrative geometry; neither reproduces a
// commercial device or its instructions for use:
//   "plug"      single-lobe occluder that sits at the ostium, sized by
//               compression against the maximum ostium width; needs usable
//               depth of about half its diameter
//   "lobe-disc" a short anchoring lobe in the landing zone (about 10–12 mm
//               inside the orifice) plus a covering disc at the ostium; sized
//               by the maximum landing-zone diameter; the disc must be wider
//               than the orifice
// These principles follow docs/SIM_FACTS.md item 7.
//
// Release criteria follow the PASS mnemonic: Position, Anchor (tug test),
// Size (compression), Seal. structural-laao-device-mechanics replaced the
// general teaching figures with the module's numbers where the module is
// specific (lesson hb-mitral-tricuspid-laa-laao-implant, the 2020 EHRA/EAPCI
// consensus as the module gives it): for the plug, Position is more than half
// the device beyond the ostium and Size at least 8% shoulder compression in
// every plane (the earlier-generation device the consensus describes); Seal is
// a minimal leak under 3 mm in all four planes, and the lobe-and-disc device is
// released with no device leak. The 10–30% window that remains (the lobe's
// compression, and the plug's upper bound) is a teaching range, not an IFU
// figure (MODEL PARAMETER, docs/realism/facts/pkg-structural-laao-device-mechanics.md).
//
// structural-laao-device-mechanics also adds, below the scoring: filling and
// the modality offsets on sizing, the puncture site against the CT morphology,
// a deployment state machine per device family (pigtail, sheath markers,
// fluid-to-fluid connection, unsheathing against pushing, ball then push,
// recapture, tug, the release checks) and the follow-up visit.
//
// positionMm: distance from the ostium plane to the device's proximal face
// (plug shoulder or proximal edge of the lobe), positive inside the appendage,
// negative protruding into the left atrium.
// ===========================================================================

import type { LabEvent } from "../content/lab/tips";
import { assessTransseptal, type FossaPoint, type TransseptalResult } from "./transseptal";

export type RiskLevel = "low" | "moderate" | "high";
export type LaaMorphology = "chicken-wing" | "windsock" | "cactus" | "cauliflower";
export type LaaoDeviceType = "plug" | "lobe-disc";
export type ToeAngle = 0 | 45 | 90 | 135;
export type PassStatus = "pass" | "borderline" | "fail";

export const TOE_ANGLES: ToeAngle[] = [0, 45, 90, 135];

export const MORPHOLOGY_LABEL: Record<LaaMorphology, string> = {
  "chicken-wing": "Chicken wing",
  windsock: "Windsock",
  cactus: "Cactus",
  cauliflower: "Cauliflower",
};

export const DEVICE_LABEL: Record<LaaoDeviceType, string> = {
  plug: "Single-lobe plug",
  "lobe-disc": "Lobe-and-disc",
};

export interface AngleMeasurement {
  angle: ToeAngle;
  ostiumMm: number;
  landingZoneMm: number;
  /** usable depth along the device axis from the ostium plane */
  depthMm: number;
}

export interface LaaoScenario {
  id: string;
  title: string;
  vignette: string;
  morphology: LaaMorphology;
  measurements: AngleMeasurement[];
  focus: string;
  teachingPoints: string[];
  // ---- structural-laao-device-mechanics (all optional; the defaults reproduce the earlier cases) ----
  /** direction of the proximal appendage on the planning CT (puncture planning); default superior-anterior */
  axis?: LaaAxis;
  /** filling after crossing: mean LA pressure (mmHg), LV function and the dimension gain on loading; default loaded */
  filling?: LaaoFilling;
  /** how far the access sheath sits across the septum on arrival, cm (default 2.5) */
  sheathAcrossCm?: number;
  /** the device family a preset practises (the size step opens on it); the learner may still change it */
  device?: LaaoDeviceType;
  /** CT over 2D TOE (at the TOE's own filling) and over fluoroscopy, mm; default MODEL mid-range values */
  modalityOffsetMm?: { ctOverToe: number; ctOverFluoro: number };
  /** the finding at the 6–12 week imaging visit (device-related thrombus; the leak defaults to the released device's) */
  followUp?: { drt: boolean; drtMm?: number; leakMm?: number };
  /** a device already released: the follow-up preset opens at the follow-up visit with it */
  deployed?: LaaoPlan;
}

// ---------------------------------------------------------------------------
// Illustrative device geometry and teaching criteria
// ---------------------------------------------------------------------------

export const PLUG_SIZES = [21, 24, 27, 30, 33, 36];
export const LOBE_SIZES = [16, 19, 22, 25, 28, 31, 34];
/** illustrative: disc diameter = lobe diameter + this margin */
export const DISC_MARGIN_MM = 6;
/** illustrative: usable depth a plug needs, as a fraction of its nominal diameter (about half) */
export const PLUG_LENGTH_RATIO = 0.5;
/** illustrative lobe length */
export const LOBE_LENGTH_MM = 8;

/** MODEL PARAMETER: teaching compression window for the lobe (and the plug's upper bound), not an IFU figure. */
export const COMPRESSION_WINDOW = { min: 10, max: 30 };
export const COMPRESSION_LABEL = "teaching range from published practice, not an IFU figure; follow the IFU";
/**
 * Plug occluder: at least 8% shoulder compression in every plane (lesson hb-mitral-tricuspid-laa-laao-implant,
 * PASS, for the earlier-generation device the 2020 consensus describes; current devices have their own IFU).
 * The 30% upper bound is the teaching window's (MODEL PARAMETER).
 */
export const PLUG_MIN_COMPRESSION_PCT = 8;
export const PLUG_COMPRESSION_WINDOW = { min: PLUG_MIN_COMPRESSION_PCT, max: COMPRESSION_WINDOW.max };
export const PLUG_COMPRESSION_LABEL = "at least 8% in every plane for the earlier-generation device the consensus describes; follow the IFU of current devices";
/** The compression window each family is judged against. */
export function compressionWindow(type: LaaoDeviceType): { min: number; max: number } {
  return type === "plug" ? PLUG_COMPRESSION_WINDOW : COMPRESSION_WINDOW;
}
export function compressionLabel(type: LaaoDeviceType): string {
  return type === "plug" ? PLUG_COMPRESSION_LABEL : COMPRESSION_LABEL;
}
/** Procedural seal target: a minimal peri-device leak under 3 mm in all four planes (laao-implant, PASS Seal; consensus imaging chapter). */
export const LEAK_LIMIT_MM = 3;
export const LEAK_LABEL = "under 3 mm in all four planes: the consensus procedural target";
/** Follow-up: a persistent leak of 5 mm or more is managed by anticoagulation or leak closure (laao-implant, antithrombotic table). */
export const FOLLOWUP_LEAK_MM = 5;

export const POSITION_BANDS: Record<LaaoDeviceType, { ideal: [number, number]; acceptable: [number, number] }> = {
  plug: { ideal: [0, 4], acceptable: [-3, 6] },
  "lobe-disc": { ideal: [4, 10], acceptable: [2, 12] },
};

export function deviceSizes(type: LaaoDeviceType): number[] {
  return type === "plug" ? PLUG_SIZES : LOBE_SIZES;
}

export function deviceLengthMm(type: LaaoDeviceType, sizeMm: number): number {
  return type === "plug" ? PLUG_LENGTH_RATIO * sizeMm : LOBE_LENGTH_MM;
}

export function discDiameter(lobeMm: number): number {
  return lobeMm + DISC_MARGIN_MM;
}

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

/** The dimension each device is sized against: ostium for the plug, landing zone for the lobe. */
export function sizingDimension(type: LaaoDeviceType, m: AngleMeasurement): number {
  return type === "plug" ? m.ostiumMm : m.landingZoneMm;
}

export const SIZING_LABEL: Record<LaaoDeviceType, string> = {
  plug: "ostium width",
  "lobe-disc": "landing zone (10–12 mm inside)",
};

export const maxSizing = (s: LaaoScenario, type: LaaoDeviceType) => Math.max(...s.measurements.map((m) => sizingDimension(type, m)));
export const minSizing = (s: LaaoScenario, type: LaaoDeviceType) => Math.min(...s.measurements.map((m) => sizingDimension(type, m)));
export const maxLandingZone = (s: LaaoScenario) => Math.max(...s.measurements.map((m) => m.landingZoneMm));
export const minLandingZone = (s: LaaoScenario) => Math.min(...s.measurements.map((m) => m.landingZoneMm));
export const maxOstium = (s: LaaoScenario) => Math.max(...s.measurements.map((m) => m.ostiumMm));
export const minDepth = (s: LaaoScenario) => Math.min(...s.measurements.map((m) => m.depthMm));

/** Compression = (nominal − measured diameter) / nominal × 100. Negative means the device is smaller than the zone. */
export function compressionPct(nominalMm: number, measuredMm: number): number {
  return ((nominalMm - measuredMm) / nominalMm) * 100;
}

export interface AngleCompression {
  angle: ToeAngle;
  /** the measured dimension the device is compressed against at this angle */
  referenceMm: number;
  pct: number;
}

export function compressionByAngle(s: LaaoScenario, type: LaaoDeviceType, sizeMm: number): AngleCompression[] {
  return s.measurements.map((m) => {
    const ref = sizingDimension(type, m);
    return { angle: m.angle, referenceMm: ref, pct: compressionPct(sizeMm, ref) };
  });
}

/**
 * Sizes for which compression stays inside the teaching window at every
 * angle (minimum at the widest dimension, maximum at the narrowest).
 */
export function suggestedLaaoSizes(s: LaaoScenario, type: LaaoDeviceType): number[] {
  return sizesForMeasurements(type, s.measurements);
}

/** Sizes whose compression stays inside the family's window at every one of these measurements. */
export function sizesForMeasurements(type: LaaoDeviceType, ms: readonly AngleMeasurement[]): number[] {
  const w = compressionWindow(type);
  const dims = ms.map((m) => sizingDimension(type, m));
  const hi = Math.max(...dims);
  const lo = Math.min(...dims);
  return deviceSizes(type).filter((d) => compressionPct(d, hi) >= w.min && compressionPct(d, lo) <= w.max);
}

/**
 * The device these measurements select: the smallest size inside the window at every plane, else the
 * smallest that reaches the minimum compression at the largest measurement (size to the largest, check
 * compression at the smallest), else the largest size.
 */
export function sizeForMeasurements(type: LaaoDeviceType, ms: readonly AngleMeasurement[]): number {
  const ok = sizesForMeasurements(type, ms);
  if (ok.length) return ok[0];
  const hi = Math.max(...ms.map((m) => sizingDimension(type, m)));
  return sizeForMaxDimension(type, hi);
}

/** The smallest device reaching the family's minimum compression at a single largest dimension (CT or fluoroscopy). */
export function sizeForMaxDimension(type: LaaoDeviceType, maxMm: number): number {
  const w = compressionWindow(type);
  const sizes = deviceSizes(type);
  return sizes.find((d) => compressionPct(d, maxMm) >= w.min) ?? sizes[sizes.length - 1];
}

// ---------------------------------------------------------------------------
// Assessment
// ---------------------------------------------------------------------------

export interface LaaoPlan {
  type: LaaoDeviceType;
  sizeMm: number;
  positionMm: number;
  /** sheath coaxial with the appendage (from the transseptal site) */
  coaxial: boolean;
  /** full recaptures and redeployments so far */
  recaptures: number;
  /** transseptal crossing was in a danger zone */
  transseptalDanger?: boolean;
  /** structural-laao-device-mechanics: the anchors of this device were pulled into the sheath and it was redeployed */
  anchorsDamaged?: boolean;
  /** structural-laao-device-mechanics: traumatic movements in the appendage (sheath against the wall, a device pushed forward) */
  traumaticMoves?: number;
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

const LEVEL_VALUE: Record<RiskLevel, number> = { low: 0, moderate: 1, high: 2 };

export type Anchor = "stable" | "marginal" | "unstable";

export interface PassItem {
  status: PassStatus;
  text: string;
}

export interface LaaoOutcome {
  compression: { byAngle: AngleCompression[]; min: number; max: number };
  /** how far the device's distal end extends beyond the usable depth (0 if it fits) */
  overshootMm: number;
  leakMm: number;
  anchor: Anchor;
  pass: { position: PassItem; anchor: PassItem; size: PassItem; seal: PassItem };
  allPass: boolean;
  embolisation: RiskItem;
  effusion: RiskItem;
  drtNotes: string[];
}

const roundHalf = (v: number) => Math.round(v * 2) / 2;

export function assessLaao(s: LaaoScenario, plan: LaaoPlan): LaaoOutcome {
  const byAngle = compressionByAngle(s, plan.type, plan.sizeMm);
  const cMin = Math.min(...byAngle.map((a) => a.pct));
  const cMax = Math.max(...byAngle.map((a) => a.pct));
  const len = deviceLengthMm(plan.type, plan.sizeMm);
  const depth = minDepth(s);
  const overshoot = Math.max(0, plan.positionMm + len - depth);
  const band = POSITION_BANDS[plan.type];
  const pos = plan.positionMm;
  const tooProximal = pos < band.acceptable[0];
  const tooDeep = pos > band.acceptable[1];
  const plug = plan.type === "plug";
  const chickenWing = s.morphology === "chicken-wing";
  const win = compressionWindow(plan.type);
  // the plug's Position criterion: more than half the device beyond the ostium (laao-implant, PASS)
  const plugHalfOut = plug && pos <= -len / 2;

  // ---- Anchor ----
  let anchorRank = cMin >= win.min ? 2 : cMin >= Math.min(5, win.min - 1) ? 1 : 0;
  if (tooProximal) anchorRank -= 1;
  if (plan.anchorsDamaged) anchorRank -= 1;
  anchorRank = Math.max(0, anchorRank);
  const anchor: Anchor = anchorRank === 2 ? "stable" : anchorRank === 1 ? "marginal" : "unstable";

  // ---- Leak ----
  let leak = 0;
  if (plug) {
    for (const a of byAngle) {
      let gap = 0;
      if (a.pct <= 0) gap = a.referenceMm - plan.sizeMm + 3; // no compression: no seal at this angle
      else if (a.pct < win.min) gap = ((win.min - a.pct) / win.min) * 2.5;
      leak = Math.max(leak, gap);
    }
    if (s.morphology === "cauliflower") leak += 1.5;
    if (pos > band.ideal[1]) leak += (pos - band.ideal[1]) * 0.6;
    if (tooProximal) leak += 1;
    if (!plan.coaxial) leak += 1.5;
  } else {
    const disc = discDiameter(plan.sizeMm);
    leak = Math.max(0, maxOstium(s) + 2 - disc) * 0.8;
    if (pos > band.acceptable[1]) leak += 3;
    else if (pos > band.ideal[1]) leak += 1;
    if (cMin < COMPRESSION_WINDOW.min) leak += (Math.max(0, COMPRESSION_WINDOW.min - cMin) / COMPRESSION_WINDOW.min) * 1.5;
    if (!plan.coaxial) leak += 1;
  }
  if (overshoot > 0) leak += plug ? 1 : 0.5;
  const leakMm = roundHalf(leak);

  // ---- PASS ----
  let position: PassItem;
  if (overshoot > 0)
    position = { status: "fail", text: `Device extends ${overshoot.toFixed(1)} mm beyond the usable depth, into the distal appendage.` };
  else if (plugHalfOut)
    position = {
      status: "fail",
      text: `Shoulder protrudes ${Math.abs(pos).toFixed(1)} mm into the left atrium: no more than half the ${len.toFixed(1)} mm device lies beyond the ostium (more than half is required).`,
    };
  else if (plug && tooProximal)
    position = {
      status: "borderline",
      text: `Shoulder protrudes ${Math.abs(pos).toFixed(1)} mm into the left atrium: more than half the device is beyond the ostium, but it sits proud.`,
    };
  else if (tooProximal)
    position = { status: "fail", text: `Lobe only ${pos.toFixed(1)} mm inside the ostium: not in the neck.` };
  else if (tooDeep) position = { status: "fail", text: `Device ${pos.toFixed(1)} mm inside the ostium: too deep, leaving an uncovered pocket.` };
  else if (pos < band.ideal[0] || pos > band.ideal[1])
    position = { status: "borderline", text: `Position ${pos.toFixed(1)} mm: acceptable but outside the ideal ${band.ideal[0]}–${band.ideal[1]} mm.` };
  else position = { status: "pass", text: `Position ${pos.toFixed(1)} mm from the ostium: at the ostium and coaxial with the neck.` };

  const anchorItem: PassItem =
    anchor === "stable"
      ? { status: "pass", text: "Tug test: device and appendage wall move together." }
      : anchor === "marginal"
      ? { status: "borderline", text: "Tug test: the device shifts slightly before the wall follows." }
      : { status: "fail", text: "Tug test: the device slips proximally; it is not anchored." };

  const inWin = cMin >= win.min && cMax <= win.max;
  // the plug's minimum is the module's figure: below it the size criterion fails
  const nearWin = (plug ? cMin >= win.min : cMin >= win.min - 5) && cMax <= win.max + 5;
  const sizeItem: PassItem = {
    status: inWin ? "pass" : nearWin ? "borderline" : "fail",
    text: plug
      ? `Shoulder compression ${cMin.toFixed(0)}% to ${cMax.toFixed(0)}% across planes (${PLUG_COMPRESSION_LABEL}; above ${win.max}% is the teaching window's upper bound).`
      : `Compression ${cMin.toFixed(0)}% to ${cMax.toFixed(0)}% across angles (window ${win.min}–${win.max}%, ${COMPRESSION_LABEL}).`,
  };

  const seal: PassItem =
    leakMm === 0
      ? { status: "pass", text: "No peri-device leak on colour Doppler." }
      : leakMm < LEAK_LIMIT_MM
      ? plug
        ? { status: "pass", text: `Peri-device leak ${leakMm.toFixed(1)} mm (${LEAK_LABEL}).` }
        : { status: "borderline", text: `Peri-device leak ${leakMm.toFixed(1)} mm: within the general procedural target, but the consensus releases this device with no device leak.` }
      : { status: "fail", text: `Peri-device leak ${leakMm.toFixed(1)} mm, not under ${LEAK_LIMIT_MM} mm.` };

  const pass = { position, anchor: anchorItem, size: sizeItem, seal };
  const allPass = Object.values(pass).every((p) => p.status !== "fail");

  // ---- Embolisation ----
  const er: string[] = [];
  let es = 0;
  if (anchor === "unstable") {
    es += 4;
    er.push("Device not anchored on the tug test.");
  } else if (anchor === "marginal") {
    es += 2;
    er.push("Marginal anchoring on the tug test.");
  }
  if (cMin <= 0) {
    es += 1;
    er.push(`No compression at the widest ${SIZING_LABEL[plan.type]} (${maxSizing(s, plan.type)} mm vs device ${plan.sizeMm} mm).`);
  } else if (cMin < win.min) {
    er.push(`Minimum compression ${cMin.toFixed(0)}%, below ${win.min}%.`);
  }
  if (tooProximal) {
    es += 1;
    er.push(plug ? "Shoulder protruding into the left atrium." : "Lobe too proximal to grip the neck.");
  }
  if (plan.anchorsDamaged) {
    es += 1;
    er.push("The anchors entered the sheath and the same device was redeployed: fixation is unreliable.");
  }
  const embolisation: RiskItem = { key: "embolisation", label: "Device embolisation", level: levelFromScore(es), score: es, reasons: er };

  // ---- Pericardial effusion ----
  const fr: string[] = [];
  let fs = 0;
  if (cMax > win.max) {
    fs += 2;
    fr.push(`Over-compression (${cMax.toFixed(0)}% at the narrowest angle): oversized device stresses the thin appendage wall.`);
  } else if (cMax > 25) {
    fs += 1;
    fr.push(`Compression ${cMax.toFixed(0)}% at the narrowest angle, near the top of the window.`);
  }
  if (overshoot > 0) {
    fs += overshoot >= 5 ? 3 : 2;
    fr.push(`Device pushed ${overshoot.toFixed(1)} mm into the distal appendage beyond the usable depth.`);
    if (chickenWing) {
      fs += 1;
      fr.push("Chicken wing: the device or sheath is driven into the thin-walled bend.");
    }
  }
  if (chickenWing && pos > band.ideal[1]) {
    fs += 1;
    fr.push("Deep position in a chicken wing.");
  }
  if (plan.recaptures >= 2) {
    fs += 1;
    fr.push(`${plan.recaptures} recaptures: repeated sheath and device manipulation in the appendage.`);
  }
  if (plan.transseptalDanger) {
    fs += 2;
    fr.push("Transseptal crossing in a danger zone.");
  }
  if (plan.traumaticMoves && plan.traumaticMoves > 0) {
    fs += LAAO_MECH.traumaEffusionScore * plan.traumaticMoves;
    fr.push(
      `${plan.traumaticMoves} traumatic movement${plan.traumaticMoves > 1 ? "s" : ""} in the appendage (sheath against the wall, or a device pushed forward without a leading pigtail or wire).`
    );
  }
  const effusion: RiskItem = { key: "effusion", label: "Pericardial effusion", level: levelFromScore(fs), score: fs, reasons: fr };

  // ---- Device-related thrombus counselling ----
  const drtNotes: string[] = [
    "Device-related thrombus is often silent: image the device at follow-up (TOE or CT) according to local protocol.",
    "Post-implant antithrombotic therapy follows the device instructions and local protocol, weighed against the bleeding risk that led to LAAO.",
  ];
  if (pos > band.ideal[1])
    drtNotes.push("Deep implantation leaves an uncovered pocket at the ostium; this has been associated with device-related thrombus.");
  if (plug && pos < 0) drtNotes.push("A protruding shoulder exposes more device surface to left atrial blood.");
  if (leakMm > 0) drtNotes.push("Record the residual leak size so follow-up imaging can reassess it.");

  return {
    compression: { byAngle, min: cMin, max: cMax },
    overshootMm: overshoot,
    leakMm,
    anchor,
    pass,
    allPass,
    embolisation,
    effusion,
    drtNotes,
  };
}

// ---------------------------------------------------------------------------
// Best plan and scoring
// ---------------------------------------------------------------------------

const PASS_VALUE: Record<PassStatus, number> = { pass: 0, borderline: 1, fail: 3 };

function burden(o: LaaoOutcome): number[] {
  const passCost = Object.values(o.pass).reduce((a, p) => a + PASS_VALUE[p.status], 0);
  return [passCost + LEVEL_VALUE[o.embolisation.level] * 2 + LEVEL_VALUE[o.effusion.level] * 2, o.leakMm, o.embolisation.score + o.effusion.score];
}

function lexLess(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i] - 1e-9) return true;
    if (a[i] > b[i] + 1e-9) return false;
  }
  return false;
}

/** Searches device type, size and position (coaxial access, no recaptures) for the lowest-burden plan. */
export function bestLaaoPlan(s: LaaoScenario): { plan: LaaoPlan; outcome: LaaoOutcome } {
  let best: { plan: LaaoPlan; outcome: LaaoOutcome; key: number[] } | null = null;
  for (const type of ["plug", "lobe-disc"] as LaaoDeviceType[]) {
    const band = POSITION_BANDS[type];
    const mid = (band.ideal[0] + band.ideal[1]) / 2;
    for (const sizeMm of deviceSizes(type)) {
      for (let p = -8; p <= 16; p += 0.5) {
        const plan: LaaoPlan = { type, sizeMm, positionMm: p, coaxial: true, recaptures: 0 };
        const outcome = assessLaao(s, plan);
        const key = [...burden(outcome), Math.abs(p - mid)];
        if (!best || lexLess(key, best.key)) best = { plan, outcome, key };
      }
    }
  }
  return { plan: best!.plan, outcome: best!.outcome };
}

export interface Deduction {
  points: number;
  reason: string;
}

export interface LaaoScoreInput {
  plan: LaaoPlan;
  anglesMeasured: ToeAngle[];
  transseptalQuality: "ideal" | "acceptable" | "poor";
  transseptalDanger: boolean;
  released: boolean;
  /** structural-laao-device-mechanics: the hands-on record; absent, the score is the earlier one */
  mechanics?: LaaoMechanicsInput;
}

export interface LaaoMechanicsInput {
  /** the deployment record */
  deploy: LaaoDeployState;
  /** mean LA pressure (mmHg) at which each plane used for sizing was measured */
  laAtMeasureMmHg: number[];
  /** fluid given before sizing, mL */
  fluidMl: number;
  /** the sheath was coaxial from the puncture site (scored against the CT morphology) */
  coaxial: boolean;
  /** the follow-up decision, when the follow-up visit was reached */
  followUp?: FollowUpAction | null;
}

export function scoreLaao(s: LaaoScenario, inp: LaaoScoreInput): { score: number; deductions: Deduction[] } {
  const d: Deduction[] = [];
  const missing = TOE_ANGLES.filter((a) => !inp.anglesMeasured.includes(a));
  if (missing.length > 0) d.push({ points: 8, reason: `Sized without measuring at ${missing.map((a) => `${a}°`).join(", ")}.` });
  const usualAxis = (s.axis ?? "superior-anterior") === "superior-anterior";
  if (inp.transseptalDanger) d.push({ points: 20, reason: "Transseptal puncture in a danger zone." });
  else if (usualAxis) {
    if (inp.transseptalQuality === "acceptable") d.push({ points: 4, reason: "Transseptal site not inferior and posterior: less coaxial with the appendage." });
    else if (inp.transseptalQuality === "poor") d.push({ points: 8, reason: "Superior transseptal site: poor coaxial alignment with the appendage." });
  } else if (!(inp.mechanics && !inp.mechanics.coaxial)) {
    // a reverse (posterior) appendage: inferior-posterior is the wrong site here, so the reasons name the site it
    // needs; a non-coaxial site in the hands-on run is mechanicsDeductions' "not chosen from the CT" instead
    if (inp.transseptalQuality === "acceptable") d.push({ points: 4, reason: "Transseptal site acceptable, but this appendage is most coaxial from an inferior central or anterior site." });
    else if (inp.transseptalQuality === "poor") d.push({ points: 8, reason: "Transseptal site not coaxial with this appendage: it needs an inferior central or anterior site." });
  }
  const o = assessLaao(s, { ...inp.plan, transseptalDanger: inp.transseptalDanger });
  const names: Record<keyof LaaoOutcome["pass"], string> = { position: "Position", anchor: "Anchor", size: "Size", seal: "Seal" };
  for (const k of Object.keys(o.pass) as (keyof LaaoOutcome["pass"])[]) {
    const st = o.pass[k].status;
    if (st === "fail") d.push({ points: 12, reason: `${names[k]} criterion failed.` });
    else if (st === "borderline") d.push({ points: 5, reason: `${names[k]} criterion borderline.` });
  }
  if (inp.mechanics) d.push(...mechanicsDeductions(s, inp.plan, inp.mechanics));
  else if (inp.released && !o.allPass) d.push({ points: 15, reason: "Device released despite a failed release criterion." });
  if (!inp.released) d.push({ points: 30, reason: "Device not released." });
  for (const r of [o.embolisation, o.effusion]) {
    if (r.level === "high") d.push({ points: 15, reason: `${r.label} risk high.` });
    else if (r.level === "moderate") d.push({ points: 6, reason: `${r.label} risk moderate.` });
  }
  if (inp.plan.recaptures > 2) d.push({ points: Math.min(9, (inp.plan.recaptures - 2) * 3), reason: `${inp.plan.recaptures} recaptures.` });
  const total = d.reduce((a, b) => a + b.points, 0);
  return { score: Math.max(0, Math.min(100, Math.round(100 - total))), deductions: d };
}

// ---------------------------------------------------------------------------
// structural-laao-device-mechanics
//
// Sourced numbers (module text, cited at each constant): lesson hb-mitral-tricuspid-laa-laao-plan
// (filling, modality offsets, puncture site, follow-up imaging) and hb-mitral-tricuspid-laa-laao-implant
// (the two families' movements, the sheath markers, PASS, the lobe-and-disc criteria, recapture, the
// antithrombotic table). Everything else is a MODEL PARAMETER in LAAO_MECH, listed with what it rests
// on in docs/realism/facts/pkg-structural-laao-device-mechanics.md.
// ---------------------------------------------------------------------------

/** Sheath distal marker band 5 mm behind the tip, kept at least 5 mm from the appendage wall (laao-implant, plug). */
export const SHEATH_MARKER_BEHIND_TIP_MM = 5;
export const MARKER_WALL_MIN_MM = 5;
/** The three proximal sheath bands match the proximal end of the loaded 21, 27 and 33 mm plugs (laao-implant, equipment). */
export const PLUG_SHEATH_MARKER_SIZES = [21, 27, 33] as const;
/** Access sheath tip 2–3 cm across the septum; the pigtail cannot be steered from further in (laao-implant, plug). */
export const SHEATH_ACROSS_CM: [number, number] = [2, 3];
/** Plug tug with the catheter tip 2–4 cm back from the hub (laao-implant, PASS Anchor). */
export const PLUG_TUG_TIP_BACK_CM: [number, number] = [2, 4];
/** Lobe-and-disc tug with the sheath tip about 2 cm from the device (laao-implant, tug and check). */
export const LOBE_TUG_TIP_BACK_CM = 2;
/** Lobe-and-disc landing zone about 10 mm inside the ostium for devices of 25 mm or less, about 12 mm for 28 mm or more (laao-implant). */
export function landingZoneDepthMm(lobeMm: number): number {
  return lobeMm <= 25 ? 10 : 12;
}
/** A half to two-thirds or more of the lobe distal to the circumflex artery (laao-implant, lobe-and-disc check). */
export const LOBE_BEYOND_CX = { min: 0.5, good: 2 / 3 };
/** Measure with a mean LA pressure above 12 mmHg; fluid challenge when below 11–12 mmHg (laao-plan). */
export const LA_LOADED_MMHG = 12;
export const LA_FLUID_TRIGGER_MMHG = 11;
/** Fluid challenge 250–1,000 mL, by LV function and any history of heart failure (laao-plan). */
export const FLUID_CHALLENGE_ML: [number, number] = [250, 1000];
/** A 500–1,000 mL bolus makes the ostium and depth about 2 mm larger (laao-plan, table). */
export const FILL_GAIN_MM = 2;
/** CT reads 1–3 mm above 2D TOE and 2–4 mm above fluoroscopy (laao-plan, table). */
export const CT_OVER_TOE_MM: [number, number] = [1, 3];
export const CT_OVER_FLUORO_MM: [number, number] = [2, 4];
/** TOE or CT at 6–12 weeks for device-related thrombus and leak (laao-plan, imaging after the implant). */
export const FOLLOWUP_WEEKS: [number, number] = [6, 12];

/** MODEL PARAMETERS of the deployment and filling model (docs/realism/facts/pkg-structural-laao-device-mechanics.md). */
export const LAAO_MECH = {
  /** mean LA pressure a scenario starts at when it names none: loaded already */
  defaultLaMeanMmHg: 14,
  /** rise in mean LA pressure per 250 mL of fluid */
  fluidMmHgPer250: { normal: 2.5, impaired: 3.5 },
  /** the largest challenge the LV allows (the module's upper end, 1,000 mL, for a normal LV) */
  fluidMaxMl: { normal: 1000, impaired: 500 },
  /** mid-range offsets inside the module's 1–3 mm and 2–4 mm */
  ctOverToeMm: 2,
  ctOverFluoroMm: 3,
  /** sheath tip relative to the ostium once the pigtail is in the lobe (in the atrium, in front of the ostium) */
  sheathStartMm: -10,
  /** a plug pushed out of its sheath travels this far forward */
  plugPushMm: 4,
  /** a lobe opened by pulling the sheath slips this far proximally */
  lobeSlipMm: 5,
  /** the sheath creeps this far deeper when the pigtail is removed without holding it */
  sheathCreepMm: 5,
  /** plug: the sheath tip sits this far behind the shoulder once the plug is unsheathed */
  sheathBehindPlugMm: 5,
  /** lobe-and-disc: the delivery sheath tip this close to the measured wall (or beyond it) is against the wall */
  lobeSheathWallMarginMm: 1,
  /** depth of the circumflex artery relative to the ostium plane, at the inferior edge of the ostium */
  circumflexMm: 1,
  /** the lobe-and-disc tug is accepted with the sheath tip 1–3 cm from the device ("about 2 cm") */
  lobeTugRangeCm: [1, 3] as [number, number],
  /** "a few minutes" before releasing the lobe-and-disc device */
  lobeWaitMin: 3,
  /** lobe proximal edge at least this far inside the ostium for a visible separation from the disc */
  separationMinMm: 2,
  /** effusion risk score per traumatic movement */
  traumaEffusionScore: 2,
  /** fossa ap coordinates: posterior at or below -0.05 (assessTransseptal); central up to 0.2; anterior above */
  centralApMax: 0.2,
  /** fossa si: a mid-fossa site lies above -0.1 (inferior) and at or below 0.3 (assessTransseptal's LAAO 'acceptable' height) */
  midFossaSiMax: 0.3,
  /** deductions (points) of the mechanics score */
  points: { minor: 3, major: 8, critical: 15, releaseEarly: 15, sizing: 8, puncture: 8, followUp: 15 },
} as const;

// ---- filling and the modality offsets ------------------------------------

export type LaaAxis = "superior-anterior" | "reverse-posterior";
export type LvFunction = "normal" | "impaired";

export interface LaaoFilling {
  /** mean LA pressure on crossing, mmHg */
  laMeanMmHg: number;
  lv: LvFunction;
  /** what loading adds to the ostium, landing zone and depth, mm (default FILL_GAIN_MM) */
  gainMm?: number;
}

export function laaoFilling(s: LaaoScenario): Required<LaaoFilling> {
  const f = s.filling;
  return { laMeanMmHg: f?.laMeanMmHg ?? LAAO_MECH.defaultLaMeanMmHg, lv: f?.lv ?? "normal", gainMm: f?.gainMm ?? FILL_GAIN_MM };
}

/** Mean LA pressure after a total of `ml` of fluid. */
export function laPressureAfterFluid(s: LaaoScenario, ml: number): number {
  const f = laaoFilling(s);
  return Math.round((f.laMeanMmHg + (Math.max(0, ml) / 250) * LAAO_MECH.fluidMmHgPer250[f.lv]) * 10) / 10;
}

export function maxFluidMl(s: LaaoScenario): number {
  return LAAO_MECH.fluidMaxMl[laaoFilling(s).lv];
}

const half = (v: number) => Math.round(v * 2) / 2;

/**
 * What 2D TOE measures at a mean LA pressure. The scenario's measurements are the loaded appendage; a
 * dry one measures smaller, by the scenario's gain at its starting pressure and proportionally less as
 * the pressure rises to 12 mmHg (MODEL PARAMETER: linear between the two).
 */
export function toeMeasurementsAt(s: LaaoScenario, laMeanMmHg: number): AngleMeasurement[] {
  const f = laaoFilling(s);
  if (f.laMeanMmHg >= LA_LOADED_MMHG) return s.measurements.map((m) => ({ ...m }));
  const frac = Math.max(0, Math.min(1, (LA_LOADED_MMHG - laMeanMmHg) / (LA_LOADED_MMHG - f.laMeanMmHg)));
  const d = f.gainMm * frac;
  return s.measurements.map((m) => ({ angle: m.angle, ostiumMm: half(m.ostiumMm - d), landingZoneMm: half(m.landingZoneMm - d), depthMm: half(m.depthMm - d) }));
}

export type Modality = "ct" | "toe" | "fluoro";
export const MODALITY_LABEL: Record<Modality, string> = { ct: "CT (the day before)", toe: "2D TOE", fluoro: "Fluoroscopy" };

export interface ModalityReading {
  modality: Modality;
  ostiumMm: number;
  landingZoneMm: number;
  depthMm: number;
}

/**
 * The maximal diameters each modality reads: CT 1–3 mm above 2D TOE at the TOE's own (starting)
 * filling, fluoroscopy 2–4 mm below CT (laao-plan); TOE at the given LA pressure.
 */
export function modalityReading(s: LaaoScenario, modality: Modality, laMeanMmHg = laaoFilling(s).laMeanMmHg): ModalityReading {
  const off = s.modalityOffsetMm ?? { ctOverToe: LAAO_MECH.ctOverToeMm, ctOverFluoro: LAAO_MECH.ctOverFluoroMm };
  const maxOf = (ms: AngleMeasurement[]) => ({
    ostiumMm: Math.max(...ms.map((m) => m.ostiumMm)),
    landingZoneMm: Math.max(...ms.map((m) => m.landingZoneMm)),
    depthMm: Math.max(...ms.map((m) => m.depthMm)),
  });
  if (modality === "toe") return { modality, ...maxOf(toeMeasurementsAt(s, laMeanMmHg)) };
  const base = maxOf(toeMeasurementsAt(s, laaoFilling(s).laMeanMmHg));
  const ct = { ostiumMm: base.ostiumMm + off.ctOverToe, landingZoneMm: base.landingZoneMm + off.ctOverToe, depthMm: base.depthMm + off.ctOverToe };
  if (modality === "ct") return { modality, ...ct };
  return { modality, ostiumMm: ct.ostiumMm - off.ctOverFluoro, landingZoneMm: ct.landingZoneMm - off.ctOverFluoro, depthMm: ct.depthMm - off.ctOverFluoro };
}

/** The device the loaded appendage's largest valid (TOE) measurements select: the reference for the sizing decision. */
export function loadedSizeMm(s: LaaoScenario, type: LaaoDeviceType): number {
  return sizeForMeasurements(type, s.measurements);
}

export interface SizingVerdict {
  /** at least one plane was measured, and every plane used with the mean LA pressure above 12 mmHg */
  loaded: boolean;
  /** the chosen size is at least what the largest valid loaded measurement selects */
  largeEnough: boolean;
  correct: boolean;
  referenceMm: number;
  text: string;
}

export function assessSizing(s: LaaoScenario, type: LaaoDeviceType, sizeMm: number, laAtMeasureMmHg: readonly number[]): SizingVerdict {
  // missing planes are the anglesMeasured deduction in scoreLaao, not a filling error
  const loaded = laAtMeasureMmHg.length > 0 && laAtMeasureMmHg.every((p) => p > LA_LOADED_MMHG);
  const referenceMm = loadedSizeMm(s, type);
  const largeEnough = sizeMm >= referenceMm;
  const text = !loaded
    ? `Measured with the mean left atrial pressure at or below ${LA_LOADED_MMHG} mmHg: a dry appendage measures small.`
    : largeEnough
      ? `Measured loaded; ${sizeMm} mm is sized from the largest valid measurement.`
      : `Measured loaded, but ${sizeMm} mm is smaller than the ${referenceMm} mm the largest valid measurement selects.`;
  return { loaded, largeEnough, correct: loaded && largeEnough, referenceMm, text };
}

// ---- puncture site against the CT morphology -------------------------------

export type PunctureSite = "inferior-posterior" | "inferior-central" | "inferior-anterior" | "mid-or-superior";
export const PUNCTURE_SITE_LABEL: Record<PunctureSite, string> = {
  "inferior-posterior": "inferior-posterior",
  "inferior-central": "inferior-central",
  "inferior-anterior": "inferior-anterior",
  "mid-or-superior": "mid-fossa or superior",
};

/** The fossa quadrant of a puncture (inferior and posterior as assessTransseptal defines them). */
export function punctureSite(p: FossaPoint): PunctureSite {
  if (p.si > -0.1) return "mid-or-superior";
  if (p.ap <= -0.05) return "inferior-posterior";
  return p.ap <= LAAO_MECH.centralApMax ? "inferior-central" : "inferior-anterior";
}

/**
 * Whether the sheath is coaxial with this appendage from a puncture. Most appendages point superior and
 * anterior: an inferior-posterior site (assessTransseptal, unchanged). A reverse chicken-wing or a
 * posteriorly bent proximal appendage needs an inferior but central or anterior site (laao-plan:
 * Fukutomi's CT study and the consensus), so there an inferior-posterior puncture is not coaxial.
 */
export function laaoCoaxial(s: LaaoScenario, p: FossaPoint, baseCm: number): boolean {
  const ts = assessTransseptal("laao", p, baseCm);
  if ((s.axis ?? "superior-anterior") === "superior-anterior") return ts.coaxialForLaa;
  const site = punctureSite(p);
  return !ts.danger && (site === "inferior-central" || site === "inferior-anterior" || midFossaAnterior(p));
}

/**
 * A mid-fossa site, central or anterior. The planning list gives "mid-fossa to anterior for a lateral or
 * posterior appendage such as a reverse chicken-wing" (laao-plan, consensus), so it is coaxial here; the
 * check's best answer (Fukutomi) is still inferior, so it grades acceptable. The height band is
 * assessTransseptal's: inferior at or below -0.1, LAAO acceptable up to 0.3.
 */
function midFossaAnterior(p: FossaPoint): boolean {
  return p.si > -0.1 && p.si <= LAAO_MECH.midFossaSiMax && p.ap > -0.05;
}

/** The site's quality as scoreLaao reads it, against the CT morphology (unchanged for the usual appendage). */
export function laaoPunctureQuality(s: LaaoScenario, p: FossaPoint, baseCm: number): TransseptalResult["quality"] {
  const ts = assessTransseptal("laao", p, baseCm);
  if ((s.axis ?? "superior-anterior") === "superior-anterior" || ts.danger) return ts.quality;
  const site = punctureSite(p);
  if (site === "inferior-central" || site === "inferior-anterior") return "ideal";
  // inferior-posterior is right for most appendages, not this one (the reverse-wing case grades it acceptable);
  // mid-fossa central or anterior is the consensus's range for this appendage, below the inferior best answer
  return site === "inferior-posterior" || midFossaAnterior(p) ? "acceptable" : "poor";
}

// ---- deployment state machine ----------------------------------------------

export type DeployStage =
  /** sheath in the atrium or the appendage, device not yet in it */
  | "sheath"
  /** device in the sheath, connected */
  | "loaded"
  /** lobe-and-disc: the lobe has formed its ball */
  | "ball"
  /** lobe-and-disc: the lobe is open and anchored, the disc not yet */
  | "lobe-open"
  /** plug unsheathed, or the lobe-and-disc disc open */
  | "deployed"
  | "released"
  /** the device has been removed (anchors in the sheath, sheath past the barbs) */
  | "removed";

export type DeployFlagSeverity = "minor" | "major" | "critical";

export interface DeployFlag {
  id: string;
  severity: DeployFlagSeverity;
  text: string;
  tipId?: string;
}

export interface LaaoDeployState {
  family: LaaoDeviceType;
  sizeMm: number;
  stage: DeployStage;
  /** plug: the marker pigtail ("in-lobe" leads the sheath and stays until the device is ready) */
  pigtail: "none" | "in-lobe" | "removed";
  /** sheath tip across the septum, cm (the pigtail is steered from 2–3 cm) */
  sheathAcrossCm: number;
  /** sheath tip relative to the ostium plane, mm (negative: in the atrium) */
  sheathTipMm: number;
  connection: "none" | "wet" | "dry";
  ventilationHeld: boolean;
  /** device proximal face relative to the ostium (plug shoulder, lobe proximal edge), mm */
  positionMm: number;
  /** checks after deployment */
  measured: boolean;
  tug: { tipBackCm: number; inRange: boolean } | null;
  colourPlanes: ToeAngle[];
  shapeChecked: boolean;
  waitedMin: number;
  recaptures: number;
  devicesUsed: number;
  /** the current device's anchors entered the sheath */
  anchorsInSheath: boolean;
  /** that device was redeployed anyway */
  anchorsDamaged: boolean;
  traumaticMoves: number;
  flags: DeployFlag[];
  log: string[];
  release: ReleaseVerdict | null;
}

export type DeployAction =
  | { kind: "sheath-across"; cm: number }
  | { kind: "pigtail" }
  | { kind: "advance-sheath"; mm: number }
  | { kind: "remove-pigtail"; holdSheath: boolean }
  | { kind: "connect"; wet: boolean }
  | { kind: "ventilation"; held: boolean }
  /** hold the cable, withdraw the sheath */
  | { kind: "unsheathe" }
  /** fix the sheath, push the cable */
  | { kind: "push-cable" }
  | { kind: "move-ball"; toMm: number }
  | { kind: "measure-device" }
  | { kind: "tug"; tipBackCm: number }
  | { kind: "colour"; angle: ToeAngle }
  | { kind: "check-shape" }
  | { kind: "wait"; min: number }
  /** plug: re-advance over the device and move it by advanceMm (negative pulls back); pastBarbs: the sheath goes past the barbs.
   *  lobe-and-disc: re-sheath to the lobe marker, or (anchorsIn) further, so the anchors enter the sheath. */
  | { kind: "partial-recapture"; advanceMm?: number; pastBarbs?: boolean; anchorsIn?: boolean }
  | { kind: "full-recapture" }
  | { kind: "new-device"; sizeMm?: number }
  | { kind: "redeploy-same" }
  | { kind: "release" };

export const DEPLOY_TIPS = {
  pigtail: "structural-laao-pigtail-leads",
  unsheathe: "structural-laao-plug-unsheathe",
  plugPass: "structural-laao-plug-pass",
  ballPush: "structural-laao-disc-ball-push",
  discCriteria: "structural-laao-disc-criteria",
  anchors: "structural-laao-anchors-in-sheath",
} as const;

/** The wall the sheath meets: the deepest measured usable depth (MODEL PARAMETER: the deepest lobe along the axis). */
export function appendageWallMm(s: LaaoScenario): number {
  return Math.max(...s.measurements.map((m) => m.depthMm));
}

/** Distance from the sheath's distal marker to the wall, mm. */
export function markerToWallMm(s: LaaoScenario, sheathTipMm: number): number {
  return appendageWallMm(s) - (sheathTipMm - SHEATH_MARKER_BEHIND_TIP_MM);
}

/** Plug: its distal end sits at the delivery catheter's distal marker, aligned with the sheath's, so the shoulder lands at the marker minus the device length. */
export function plugPositionFromSheath(sheathTipMm: number, sizeMm: number): number {
  return sheathTipMm - SHEATH_MARKER_BEHIND_TIP_MM - deviceLengthMm("plug", sizeMm);
}

/** Where each proximal sheath band sits relative to the ostium (the proximal end of the loaded 21, 27 and 33 mm plugs). */
export function plugSheathBands(sheathTipMm: number): { sizeMm: number; atMm: number }[] {
  return PLUG_SHEATH_MARKER_SIZES.map((sizeMm) => ({ sizeMm, atMm: plugPositionFromSheath(sheathTipMm, sizeMm) }));
}

export function createLaaoDeploy(s: LaaoScenario, family: LaaoDeviceType, sizeMm: number): LaaoDeployState {
  return {
    family,
    sizeMm,
    stage: "sheath",
    pigtail: "none",
    sheathAcrossCm: s.sheathAcrossCm ?? 2.5,
    sheathTipMm: LAAO_MECH.sheathStartMm,
    connection: "none",
    ventilationHeld: false,
    positionMm: LAAO_MECH.sheathStartMm,
    measured: false,
    tug: null,
    colourPlanes: [],
    shapeChecked: false,
    waitedMin: 0,
    recaptures: 0,
    devicesUsed: 1,
    anchorsInSheath: false,
    anchorsDamaged: false,
    traumaticMoves: 0,
    flags: [],
    log: [],
    release: null,
  };
}

const resetChecks = (x: LaaoDeployState): LaaoDeployState => ({ ...x, measured: false, tug: null, colourPlanes: [], shapeChecked: false, waitedMin: 0 });

function flag(x: LaaoDeployState, f: DeployFlag, trauma = false): LaaoDeployState {
  return { ...x, flags: [...x.flags, f], traumaticMoves: x.traumaticMoves + (trauma ? 1 : 0) };
}
const say = (x: LaaoDeployState, text: string): LaaoDeployState => ({ ...x, log: [...x.log, text] });

/** One step of the deployment. Pure; an action that does not apply at this stage is logged and changes nothing else. */
export function laaoDeployStep(s: LaaoScenario, x0: LaaoDeployState, a: DeployAction, coaxial = true): LaaoDeployState {
  let x = x0;
  const plug = x.family === "plug";
  const done = x.stage === "released" || (x.stage === "removed" && a.kind !== "new-device" && a.kind !== "redeploy-same");
  if (done) return say(x, "No device to move.");
  switch (a.kind) {
    case "sheath-across": {
      if (x.stage !== "sheath" || x.pigtail === "in-lobe") return say(x, "The sheath is already committed to the appendage.");
      return say({ ...x, sheathAcrossCm: Math.max(0.5, Math.min(6, a.cm)) }, `Sheath tip ${Math.max(0.5, Math.min(6, a.cm)).toFixed(1)} cm across the septum.`);
    }
    case "pigtail": {
      if (x.stage !== "sheath") return say(x, "The device is already in the sheath.");
      if (x.pigtail === "in-lobe") return say(x, "The pigtail is already in the lobe.");
      if (x.sheathAcrossCm > SHEATH_ACROSS_CM[1])
        return say(x, `The pigtail cannot be turned into the appendage: the sheath tip is ${x.sheathAcrossCm.toFixed(1)} cm across the septum.`);
      return say({ ...x, pigtail: "in-lobe" }, "Marker pigtail turned into the deepest lobe.");
    }
    case "advance-sheath": {
      if (x.stage !== "sheath" && x.stage !== "loaded") return say(x, "The device is out of the sheath.");
      if (x.stage === "loaded" && x.connection !== "none") return say(x, "Sheath and delivery catheter are locked together: the markers no longer guide depth.");
      const tip = x.sheathTipMm + a.mm;
      x = { ...x, sheathTipMm: tip, positionMm: tip };
      if (a.mm > 0 && plug && x.pigtail !== "in-lobe" && tip > 0 && !x.flags.some((f) => f.id === "plug-no-pigtail"))
        x = flag(x, { id: "plug-no-pigtail", severity: "major", text: "Plug access sheath advanced into the appendage without a leading pigtail.", tipId: DEPLOY_TIPS.pigtail }, true);
      x = say(x, `Sheath tip ${tip >= 0 ? `${tip.toFixed(0)} mm inside the ostium` : `${Math.abs(tip).toFixed(0)} mm in front of the ostium`}.`);
      return wallCheck(s, x);
    }
    case "remove-pigtail": {
      if (x.pigtail !== "in-lobe") return say(x, "No pigtail in the appendage.");
      x = { ...x, pigtail: "removed" };
      if (!a.holdSheath) {
        x = { ...x, sheathTipMm: x.sheathTipMm + LAAO_MECH.sheathCreepMm, positionMm: x.sheathTipMm + LAAO_MECH.sheathCreepMm };
        x = flag(x, { id: "sheath-creep", severity: "major", text: `The sheath slid ${LAAO_MECH.sheathCreepMm} mm deeper as the pigtail came out.`, tipId: DEPLOY_TIPS.pigtail });
        x = wallCheck(s, x);
      }
      return say(x, "Pigtail removed.");
    }
    case "connect": {
      if (x.stage !== "sheath") return say(x, "The device is already connected.");
      if (plug && x.pigtail === "in-lobe") return say(x, "Remove the pigtail before the device goes in.");
      x = { ...x, stage: "loaded", connection: a.wet ? "wet" : "dry", positionMm: x.sheathTipMm };
      if (!a.wet) x = flag(x, { id: "dry-connection", severity: "critical", text: "Dry connection: air entered the sheath with the device." });
      return say(x, a.wet ? "Valve held low, back-bleeding; delivery system connected fluid to fluid." : "Delivery system connected without back-bleeding or flushing.");
    }
    case "ventilation":
      return say({ ...x, ventilationHeld: a.held }, a.held ? "Ventilation held." : "Ventilation resumed.");
    case "unsheathe": {
      if (x.stage === "loaded" && plug) {
        if (!x.ventilationHeld)
          x = flag(x, { id: "ventilation", severity: "minor", text: "Plug unsheathed without ventilation held.", tipId: DEPLOY_TIPS.unsheathe });
        const at = plugPositionFromSheath(x.sheathTipMm, x.sizeMm);
        x = { ...x, stage: "deployed", positionMm: at, sheathTipMm: at - LAAO_MECH.sheathBehindPlugMm };
        return say(x, "Cable held, sheath and catheter withdrawn: the plug opens in the appendage.");
      }
      if (x.stage === "loaded") return say({ ...x, stage: "ball", positionMm: x.sheathTipMm }, "Cable held, sheath pulled back: the lobe forms a ball at the sheath tip.");
      if (x.stage === "ball") {
        x = flag(x, { id: "lobe-pull-sheath", severity: "major", text: "Lobe opened by holding the cable and pulling the sheath (the plug's movement): the device slipped proximally.", tipId: DEPLOY_TIPS.ballPush });
        return say({ ...x, stage: "lobe-open", positionMm: x.positionMm - LAAO_MECH.lobeSlipMm }, "The lobe opens as it slides back towards the ostium.");
      }
      if (x.stage === "lobe-open") return say({ ...x, stage: "deployed" }, "Sheath pulled back with slight tension on the cable: the disc opens.");
      return say(x, "Nothing left in the sheath to unsheathe.");
    }
    case "push-cable": {
      if (plug && (x.stage === "loaded" || x.stage === "deployed")) {
        const from = x.stage === "loaded" ? plugPositionFromSheath(x.sheathTipMm, x.sizeMm) : x.positionMm;
        x = flag(
          x,
          { id: "plug-push", severity: "major", text: "Push movement on the plug device (the lobe-and-disc movement): the plug was driven forward into the appendage.", tipId: DEPLOY_TIPS.unsheathe },
          true
        );
        return say({ ...x, stage: "deployed", positionMm: from + LAAO_MECH.plugPushMm }, "Cable pushed: the plug is driven forward.");
      }
      if (x.stage === "loaded") {
        x = flag(x, { id: "lobe-push-before-ball", severity: "major", text: "Lobe-and-disc device pushed out before forming the ball in the sheath tip.", tipId: DEPLOY_TIPS.ballPush });
        return say({ ...x, stage: "ball", positionMm: x.sheathTipMm + LAAO_MECH.plugPushMm }, "Cable pushed: the lobe is extruded forward.");
      }
      if (x.stage === "ball") return say({ ...x, stage: "lobe-open" }, "Sheath fixed, cable pushed: the lobe opens laterally, triangle to tyre, and its anchors engage.");
      return say(x, "Pushing the cable changes nothing now.");
    }
    case "move-ball": {
      if (x.stage !== "ball") return say(x, "Only the ball is moved with the sheath.");
      return wallCheck(s, say({ ...x, positionMm: a.toMm, sheathTipMm: a.toMm }, `Sheath and ball moved together to ${a.toMm.toFixed(1)} mm inside the ostium.`));
    }
    case "measure-device": {
      if (x.stage !== "deployed") return say(x, "Deploy the device first.");
      return say({ ...x, measured: true }, "Device position and shoulder diameters measured in the four TOE planes.");
    }
    case "tug": {
      if (x.stage !== "deployed") return say(x, "Deploy the device first.");
      const range = plug ? PLUG_TUG_TIP_BACK_CM : LAAO_MECH.lobeTugRangeCm;
      const inRange = a.tipBackCm >= range[0] && a.tipBackCm <= range[1];
      if (!inRange)
        x = flag(x, {
          id: "tug-range",
          severity: "minor",
          text: plug
            ? `Tug with the catheter tip ${a.tipBackCm} cm from the hub (2–4 cm back).`
            : `Tug with the sheath tip ${a.tipBackCm} cm from the device (about 2 cm).`,
          tipId: plug ? DEPLOY_TIPS.plugPass : DEPLOY_TIPS.discCriteria,
        });
      return say({ ...x, tug: { tipBackCm: a.tipBackCm, inRange } }, plug ? "Tug test on the cable." : "Cable pulled until the disc became football-shaped, then released.");
    }
    case "colour": {
      if (x.stage !== "deployed") return say(x, "Deploy the device first.");
      if (x.colourPlanes.includes(a.angle)) return x;
      return { ...x, colourPlanes: [...x.colourPlanes, a.angle].sort((p, q) => p - q) as ToeAngle[] };
    }
    case "check-shape": {
      if (plug || x.stage !== "deployed") return say(x, "No lobe-and-disc device to check.");
      return say({ ...x, shapeChecked: true }, "Lobe, disc and their relation to the circumflex checked.");
    }
    case "wait": {
      if (x.stage !== "deployed") return x;
      return say({ ...x, waitedMin: x.waitedMin + a.min }, `Waited ${a.min} min with the device attached.`);
    }
    case "partial-recapture": {
      if (x.stage !== "deployed" && x.stage !== "lobe-open") return say(x, "Nothing deployed to recapture.");
      if (plug) {
        if (a.pastBarbs) {
          x = flag(x, { id: "plug-past-barbs", severity: "critical", text: "Sheath advanced past the fixation barbs on recapture: the device must be removed." }, true);
          return say(resetChecks({ ...x, stage: "removed", recaptures: x.recaptures + 1 }), "Plug removed after the sheath passed the barbs.");
        }
        const mv = a.advanceMm ?? 0;
        if (mv > 0)
          x = flag(x, { id: "plug-forward-recapture", severity: "critical", text: "Partly recaptured plug pushed forward: advancing without a leading pigtail or wire is traumatic." }, true);
        return say(resetChecks({ ...x, stage: "deployed", positionMm: x.positionMm + mv, recaptures: x.recaptures + 1 }), mv > 0 ? "Partly recaptured and pushed forward." : `Partly recaptured up to the barbs, pulled back ${Math.abs(mv).toFixed(1)} mm and redeployed.`);
      }
      if (a.anchorsIn) {
        x = flag(x, { id: "anchors-in-sheath", severity: "critical", text: "Anchors pulled into the sheath on recapture.", tipId: DEPLOY_TIPS.anchors });
        return say(resetChecks({ ...x, stage: "removed", anchorsInSheath: true, recaptures: x.recaptures + 1 }), "The whole lobe is back in the sheath, anchors included.");
      }
      return say(resetChecks({ ...x, stage: "ball", recaptures: x.recaptures + 1 }), "Re-sheathed over the disc and part of the lobe to the lobe marker: the anchors are free of the wall.");
    }
    case "full-recapture": {
      if (x.stage !== "deployed" && x.stage !== "lobe-open" && x.stage !== "ball") return say(x, "Nothing deployed to recapture.");
      if (!plug && (x.stage === "deployed" || x.stage === "lobe-open")) {
        x = flag(x, { id: "anchors-in-sheath", severity: "critical", text: "Anchors pulled into the sheath on a full recapture.", tipId: DEPLOY_TIPS.anchors });
        return say(resetChecks({ ...x, stage: "removed", anchorsInSheath: true, recaptures: x.recaptures + 1 }), "Device fully recaptured, anchors included.");
      }
      if (plug) {
        // the sheath is re-advanced over the whole plug: its distal end back at the distal marker, so an unsheathe in place redeploys it where it was
        const tip = x.positionMm + SHEATH_MARKER_BEHIND_TIP_MM + deviceLengthMm("plug", x.sizeMm);
        return say(resetChecks({ ...x, stage: "loaded", recaptures: x.recaptures + 1, sheathTipMm: tip, positionMm: tip }), "Device fully recaptured into the sheath.");
      }
      return say(resetChecks({ ...x, stage: "loaded", recaptures: x.recaptures + 1, positionMm: x.sheathTipMm }), "Device fully recaptured into the sheath.");
    }
    case "new-device": {
      if (x.stage !== "removed" && x.stage !== "loaded") return say(x, "Recapture or remove the device first.");
      const sizeMm = a.sizeMm ?? x.sizeMm;
      return say(
        resetChecks({ ...x, stage: "sheath", sizeMm, devicesUsed: x.devicesUsed + 1, anchorsInSheath: false, anchorsDamaged: false, connection: "none", positionMm: x.sheathTipMm }),
        `A new ${sizeMm} mm device is prepared.`
      );
    }
    case "redeploy-same": {
      if (x.stage !== "removed") return say(x, "The device is still attached.");
      if (x.anchorsInSheath)
        x = flag(x, { id: "redeploy-damaged", severity: "critical", text: "The device whose anchors entered the sheath was redeployed instead of removed and reloaded.", tipId: DEPLOY_TIPS.anchors });
      return say({ ...x, stage: "loaded", anchorsDamaged: x.anchorsInSheath || x.anchorsDamaged, positionMm: x.sheathTipMm }, "The same device is advanced again.");
    }
    case "release": {
      if (x.stage !== "deployed") return say(x, "Only a deployed device is released.");
      const v = releaseCheck(s, x, coaxial);
      x = { ...x, stage: "released", release: v };
      if (!v.checksDone || !v.criteriaMet)
        x = flag(x, {
          id: "release-early",
          severity: "major",
          text: !v.checksDone ? `Released before the release checks: ${v.missing.join("; ")}.` : `Released with release criteria not met: ${v.unmet.join("; ")}.`,
          tipId: plug ? DEPLOY_TIPS.plugPass : DEPLOY_TIPS.discCriteria,
        });
      return say(x, plug ? "Cable turned counter-clockwise without forward tension: the plug is released." : "Released by counter-clockwise rotation with slight backward tension.");
    }
  }
}

function wallCheck(s: LaaoScenario, x: LaaoDeployState): LaaoDeployState {
  if (x.family === "lobe-disc") {
    const wall = appendageWallMm(s);
    if (x.sheathTipMm > wall - LAAO_MECH.lobeSheathWallMarginMm && !x.flags.some((f) => f.id === "sheath-wall" && f.text.endsWith(`${x.sheathTipMm.toFixed(0)} mm.`)))
      return flag(
        x,
        {
          id: "sheath-wall",
          severity: "major",
          text: `Delivery sheath advanced against the appendage wall (measured depth ${wall} mm): the sheath tip is at ${x.sheathTipMm.toFixed(0)} mm.`,
        },
        true
      );
    return x;
  }
  if (markerToWallMm(s, x.sheathTipMm) < MARKER_WALL_MIN_MM && x.family === "plug" && !x.flags.some((f) => f.id === "marker-wall" && f.text.endsWith(`${x.sheathTipMm.toFixed(0)} mm.`)))
    return flag(
      x,
      {
        id: "marker-wall",
        severity: "major",
        text: `Distal marker less than ${MARKER_WALL_MIN_MM} mm from the appendage wall: the sheath tip is against the wall at ${x.sheathTipMm.toFixed(0)} mm.`,
        tipId: DEPLOY_TIPS.pigtail,
      },
      true
    );
  return x;
}

export function laaoDeployRun(s: LaaoScenario, x: LaaoDeployState, actions: readonly DeployAction[], coaxial = true): LaaoDeployState {
  return actions.reduce((acc, a) => laaoDeployStep(s, acc, a, coaxial), x);
}

/**
 * Unsheathing has started: the tip context stops reporting position (laaoTipContext's `unsheathed`).
 * A device just removed (anchors in the sheath, sheath past the barbs) counts too, so the bailout leads;
 * a new device in the sheath is positioned again.
 */
export function deployUnsheathed(x: LaaoDeployState): boolean {
  return x.stage === "ball" || x.stage === "lobe-open" || x.stage === "deployed" || x.stage === "released" || x.stage === "removed";
}

/** Events the deployment raises: air from a dry connection while the device is still in the sheath or just out of it. */
export function deployEvents(x: LaaoDeployState): LabEvent[] {
  return x.connection === "dry" && (x.stage === "loaded" || x.stage === "ball" || x.stage === "lobe-open") ? ["air"] : [];
}

/** A complication has declared itself (the context adds 'complication'): air, anchors in the sheath, a device to remove. */
export function deployComplication(x: LaaoDeployState): boolean {
  return deployEvents(x).length > 0 || x.anchorsInSheath || x.stage === "removed";
}

/** The plan the deployment has produced, for assessLaao. */
export function deployPlan(x: LaaoDeployState, base: { coaxial: boolean; transseptalDanger?: boolean }): LaaoPlan {
  return {
    type: x.family,
    sizeMm: x.sizeMm,
    positionMm: x.positionMm,
    coaxial: base.coaxial,
    recaptures: x.recaptures,
    transseptalDanger: base.transseptalDanger,
    anchorsDamaged: x.anchorsDamaged,
    traumaticMoves: x.traumaticMoves,
  };
}

// ---- release criteria per family --------------------------------------------

export interface ReleaseCriterion {
  id: string;
  label: string;
  met: boolean;
  text: string;
}

/** Fraction of the lobe distal to the circumflex artery. */
export function lobeBeyondCircumflex(positionMm: number): number {
  return Math.max(0, Math.min(1, (positionMm + LOBE_LENGTH_MM - LAAO_MECH.circumflexMm) / LOBE_LENGTH_MM));
}

/**
 * The family's own release criteria with the module's numbers. Plug: PASS (more than half beyond the
 * ostium and within the usable depth; device and appendage move together; at least 8% compression in
 * every plane; leak under 3 mm in all four planes). Lobe-and-disc: tyre-shaped lobe perpendicular to the
 * landing zone; half to two-thirds or more beyond the circumflex; lobe and disc separated; concave disc
 * under tension; stable on the tug; no device leak.
 */
export function releaseCriteria(s: LaaoScenario, plan: LaaoPlan): ReleaseCriterion[] {
  const o = assessLaao(s, plan);
  if (plan.type === "plug") {
    const len = deviceLengthMm("plug", plan.sizeMm);
    const beyond = Math.max(0, Math.min(len, plan.positionMm + len)) / len;
    return [
      { id: "position", label: "Position", met: beyond > 0.5 && o.overshootMm === 0, text: o.pass.position.text },
      { id: "anchor", label: "Anchor", met: o.anchor === "stable", text: o.pass.anchor.text },
      { id: "size", label: "Size", met: o.compression.min >= PLUG_MIN_COMPRESSION_PCT, text: `Minimum shoulder compression ${o.compression.min.toFixed(0)}% (at least ${PLUG_MIN_COMPRESSION_PCT}% in every plane).` },
      { id: "seal", label: "Seal", met: o.leakMm < LEAK_LIMIT_MM, text: o.leakMm === 0 ? "No leak in any plane." : `Leak ${o.leakMm.toFixed(1)} mm (under ${LEAK_LIMIT_MM} mm in all four planes).` },
    ];
  }
  const frac = lobeBeyondCircumflex(plan.positionMm);
  const over = o.overshootMm > 0;
  const tyre = o.compression.min >= COMPRESSION_WINDOW.min && plan.coaxial && !over;
  const sep = plan.positionMm >= LAAO_MECH.separationMinMm;
  const concave = discDiameter(plan.sizeMm) >= maxOstium(s) && plan.positionMm >= LAAO_MECH.separationMinMm && plan.positionMm <= POSITION_BANDS["lobe-disc"].acceptable[1] && o.overshootMm === 0;
  return [
    {
      id: "tyre",
      label: "Lobe tyre-shaped and perpendicular",
      met: tyre,
      text: tyre
        ? "Lobe slightly compressed, tyre-shaped and perpendicular to the landing zone."
        : over
          ? `Lobe extends ${o.overshootMm.toFixed(1)} mm beyond the usable depth of the appendage: set too deep.`
          : !plan.coaxial
            ? "Lobe tilted against the landing-zone axis."
            : "Lobe barely compressed: square rather than tyre-shaped.",
    },
    {
      id: "circumflex",
      label: "Lobe beyond the circumflex",
      met: frac >= LOBE_BEYOND_CX.min,
      text: `${Math.round(frac * 100)}% of the lobe lies distal to the circumflex artery (a half to two-thirds or more).`,
    },
    { id: "separation", label: "Lobe and disc separated", met: sep, text: sep ? "Slight separation between lobe and disc." : "Lobe and disc not separated: the lobe sits at the ostium." },
    { id: "disc", label: "Disc concave", met: concave, text: concave ? "Disc slightly concave, under tension at the ostium." : over ? "Disc pulled out of shape by a lobe set beyond the usable depth." : "Disc flat or pulled out of shape: not under tension at the ostium." },
    { id: "anchor", label: "Stable on the tug", met: o.anchor === "stable", text: o.pass.anchor.text },
    { id: "seal", label: "No device leak", met: o.leakMm === 0, text: o.leakMm === 0 ? "No device leak in any plane." : `Leak ${o.leakMm.toFixed(1)} mm (this device is released with no device leak).` },
  ];
}

export interface ReleaseVerdict {
  /** every check the family needs was done */
  checksDone: boolean;
  missing: string[];
  /** every release criterion was met */
  criteriaMet: boolean;
  unmet: string[];
}

export function releaseCheck(s: LaaoScenario, x: LaaoDeployState, coaxial: boolean): ReleaseVerdict {
  const missing: string[] = [];
  if (!x.measured) missing.push("position and size not measured in the four planes");
  if (!x.tug) missing.push("no tug test");
  else if (!x.tug.inRange) missing.push("tug not done with the tip at the right distance");
  const planes = TOE_ANGLES.filter((a) => !x.colourPlanes.includes(a));
  if (planes.length) missing.push(`no colour Doppler at ${planes.map((a) => `${a}°`).join(", ")}`);
  if (x.family === "lobe-disc") {
    if (!x.shapeChecked) missing.push("shape criteria not checked");
    if (x.waitedMin < LAAO_MECH.lobeWaitMin) missing.push("no wait before release");
  }
  const crit = releaseCriteria(s, deployPlan(x, { coaxial }));
  const unmet = crit.filter((c) => !c.met).map((c) => c.label.toLowerCase());
  return { checksDone: missing.length === 0, missing, criteriaMet: unmet.length === 0, unmet };
}

/** The release decision: right only after every check, with every criterion met. */
export function releaseDecisionCorrect(v: ReleaseVerdict | null): boolean {
  return !!v && v.checksDone && v.criteriaMet;
}

// ---- follow-up ------------------------------------------------------------------

export type FollowUpAction = "anticoagulate-until-resolved" | "continue-plan" | "reimage-leak" | "anticoagulate-or-close-leak" | "stop-antithrombotics";

export const FOLLOWUP_ACTIONS: FollowUpAction[] = ["continue-plan", "reimage-leak", "anticoagulate-or-close-leak", "anticoagulate-until-resolved", "stop-antithrombotics"];

export const FOLLOWUP_ACTION_LABEL: Record<FollowUpAction, string> = {
  "continue-plan": "Continue the planned antithrombotic step-down",
  "reimage-leak": "Continue the plan and image the leak again",
  "anticoagulate-or-close-leak": "Long-term anticoagulation or leak closure (operator's discretion)",
  "anticoagulate-until-resolved": "Anticoagulate and re-image until it has resolved",
  "stop-antithrombotics": "Stop all antithrombotic therapy",
};

export interface FollowUpFinding {
  weeks: number;
  drt: boolean;
  drtMm: number;
  leakMm: number;
}

/** The finding at the follow-up TOE: the scenario's thrombus, and the released device's leak unless the scenario names one. */
export function followUpFinding(s: LaaoScenario, leakMm: number): FollowUpFinding {
  return { weeks: 8, drt: s.followUp?.drt ?? false, drtMm: s.followUp?.drtMm ?? 0, leakMm: s.followUp?.leakMm ?? leakMm };
}

/**
 * Device-related thrombus: anticoagulation in every patient until imaging shows resolution; no
 * antithrombotic at all is not appropriate. A residual leak of 5 mm or more: long-term anticoagulation
 * or leak closure; a smaller one is imaged again; none: the planned step-down (laao-implant, antithrombotic table).
 */
export function expectedFollowUp(f: FollowUpFinding): FollowUpAction {
  if (f.drt) return "anticoagulate-until-resolved";
  if (f.leakMm >= FOLLOWUP_LEAK_MM) return "anticoagulate-or-close-leak";
  if (f.leakMm > 0) return "reimage-leak";
  return "continue-plan";
}

export function assessFollowUp(f: FollowUpFinding, action: FollowUpAction): { correct: boolean; expected: FollowUpAction; text: string } {
  const expected = expectedFollowUp(f);
  const correct = action === expected;
  const text = f.drt
    ? correct
      ? "Device-related thrombus anticoagulated until follow-up imaging shows it has resolved."
      : "Device-related thrombus needs anticoagulation, symptomatic or not, until TOE or CT shows resolution."
    : action === "stop-antithrombotics"
      ? "No antithrombotic therapy at all is not appropriate after an endocardial device."
      : correct
        ? "Follow-up managed as the consensus table advises."
        : `Expected: ${FOLLOWUP_ACTION_LABEL[expected].toLowerCase()}.`;
  return { correct, expected, text };
}

export function scoreLaaoFollowUp(f: FollowUpFinding, action: FollowUpAction | null): { score: number; deductions: Deduction[] } {
  if (!action) return { score: 0, deductions: [{ points: 100, reason: "No follow-up decision." }] };
  const v = assessFollowUp(f, action);
  const d: Deduction[] = v.correct ? [] : [{ points: f.drt ? 60 : 40, reason: v.text }];
  return { score: Math.max(0, 100 - d.reduce((a, b) => a + b.points, 0)), deductions: d };
}

// ---- the mechanics part of the score ----------------------------------------------

export function mechanicsDeductions(s: LaaoScenario, plan: LaaoPlan, m: LaaoMechanicsInput): Deduction[] {
  const P = LAAO_MECH.points;
  const d: Deduction[] = [];
  const sizing = assessSizing(s, plan.type, plan.sizeMm, m.laAtMeasureMmHg);
  if (!sizing.loaded) d.push({ points: P.sizing, reason: sizing.text });
  else if (!sizing.largeEnough) d.push({ points: P.sizing, reason: sizing.text });
  if (m.fluidMl > maxFluidMl(s)) d.push({ points: P.minor, reason: `${m.fluidMl} mL of fluid: more than this LV function allows (up to ${maxFluidMl(s)} mL).` });
  if (!m.coaxial && (s.axis ?? "superior-anterior") === "reverse-posterior")
    d.push({ points: P.puncture, reason: "Puncture site not chosen from the CT: this appendage needs an inferior but central or anterior site." });
  for (const f of m.deploy.flags) {
    if (f.id === "release-early") continue;
    d.push({ points: P[f.severity], reason: f.text });
  }
  const v = m.deploy.release;
  if (v && !releaseDecisionCorrect(v))
    d.push({ points: P.releaseEarly, reason: !v.checksDone ? `Released before the release checks (${v.missing.join("; ")}).` : `Released with criteria unmet (${v.unmet.join("; ")}).` });
  if (m.followUp !== undefined && m.followUp !== null) {
    const f = followUpFinding(s, assessLaao(s, plan).leakMm);
    const a = assessFollowUp(f, m.followUp);
    if (!a.correct) d.push({ points: P.followUp, reason: a.text });
  }
  return d;
}

// ---------------------------------------------------------------------------
// Teaching cases (synthetic)
// ---------------------------------------------------------------------------

const m = (angle: ToeAngle, ostiumMm: number, landingZoneMm: number, depthMm: number): AngleMeasurement => ({
  angle,
  ostiumMm,
  landingZoneMm,
  depthMm,
});

export const LAAO_SCENARIOS: LaaoScenario[] = [
  {
    id: "laao-windsock",
    title: "Windsock appendage",
    vignette:
      "Synthetic teaching case. 77-year-old man with non-valvular AF and recurrent gastrointestinal bleeding on anticoagulation. Single dominant lobe with good depth.",
    morphology: "windsock",
    measurements: [m(0, 24, 21, 28), m(45, 25, 22, 27), m(90, 22, 19, 26), m(135, 23, 20, 27)],
    focus: "Size to the widest dimension across all four angles.",
    teachingPoints: [
      "The appendage is oval: one angle underestimates the ostium and landing zone.",
      "Check compression at every angle; the narrowest angle gives the highest compression.",
      "A windsock with good depth suits a plug.",
    ],
  },
  {
    id: "laao-chicken-wing",
    title: "Chicken wing with an early bend",
    vignette:
      "Synthetic teaching case. 82-year-old woman with AF, prior intracranial haemorrhage. The appendage bends sharply about 13 mm beyond the ostium.",
    morphology: "chicken-wing",
    measurements: [m(0, 22, 19, 15), m(45, 23, 20, 14), m(90, 21, 18, 13), m(135, 21, 18, 14)],
    focus: "Short usable depth: which device fits, and why pushing deeper is dangerous.",
    teachingPoints: [
      "Usable depth is limited by the bend; a plug needs about half its diameter in depth, so it sits proud or is driven into the bend.",
      "The thin-walled distal chicken wing is where perforation happens.",
      "A short lobe with a covering disc suits a short neck.",
    ],
  },
  {
    id: "laao-cactus",
    title: "Cactus appendage",
    vignette:
      "Synthetic teaching case. 74-year-old man with AF and a high bleeding risk. Central lobe with secondary side lobes; adequate depth.",
    morphology: "cactus",
    measurements: [m(0, 26, 23, 23), m(45, 27, 24, 22), m(90, 24, 22, 21), m(135, 25, 22, 22)],
    focus: "Two reasonable sizes: anchoring margin against over-compression.",
    teachingPoints: [
      "When two sizes are possible, the larger anchors more firmly but compresses the narrowest angle more and needs more depth.",
      "Side lobes beyond the landing zone are excluded by sealing the ostium, not by filling them.",
    ],
  },
  {
    id: "laao-cauliflower",
    title: "Cauliflower appendage",
    vignette:
      "Synthetic teaching case. 80-year-old woman with AF and recurrent bleeding. Short, wide appendage with several small lobes and an oval ostium.",
    morphology: "cauliflower",
    measurements: [m(0, 28, 24, 13), m(45, 30, 25, 12), m(90, 25, 21, 12), m(135, 27, 23, 13)],
    focus: "Short, wide and irregular: sealing with a disc rather than a long plug.",
    teachingPoints: [
      "Irregular, multi-lobed orifices leak around a plug.",
      "The disc must be wider than the largest ostium diameter to seal.",
      "Oval ostia over-compress a device on the short axis.",
    ],
  },
  // ---- structural-laao-device-mechanics presets (src/content/lab/presets/structural/laao.launch.ts) ----
  {
    id: "laao-plug",
    title: "Large windsock for a plug occluder",
    vignette:
      "Synthetic teaching case. 79-year-old woman with AF and recurrent epistaxis needing transfusion on anticoagulation. A large single-lobed appendage with good depth; the plug occluder is planned.",
    morphology: "windsock",
    measurements: [m(0, 27, 24, 30), m(45, 28, 25, 29), m(90, 25, 22, 28), m(135, 26, 23, 29)],
    focus: "Plug technique: the pigtail leads the sheath, the markers set the depth, hold the cable and withdraw the sheath, then PASS with numbers.",
    teachingPoints: [
      "The pigtail is steered from 2–3 cm across the septum; from further in it cannot be turned into the appendage.",
      "The sheath's distal marker sits 5 mm behind the tip: keep it at least 5 mm from the wall, and leave the pigtail in until the device is ready.",
      "Deploy by holding the cable and withdrawing the sheath with ventilation held; never push the plug out.",
      "Release only after PASS: more than half the device beyond the ostium, a tug with the catheter tip 2–4 cm back, at least 8% compression in every plane, and any leak under 3 mm in all four planes.",
    ],
    sheathAcrossCm: 4.5,
    device: "plug",
  },
  {
    id: "laao-lobe-disc",
    title: "Short neck for a lobe-and-disc occluder",
    vignette:
      "Synthetic teaching case. 76-year-old man with AF and cerebral amyloid angiopathy. The appendage bends about 14 mm beyond the ostium; a lobe-and-disc occluder is planned.",
    morphology: "chicken-wing",
    measurements: [m(0, 24, 20, 14), m(45, 25, 21, 13), m(90, 23, 19, 13), m(135, 22, 19, 14)],
    focus: "Lobe-and-disc technique: ball, then push the cable to open the lobe, pull the sheath for the disc; four shape criteria, no leak, a short wait.",
    teachingPoints: [
      "Pull the sheath only until the lobe forms a ball; move the ball into the landing zone with the sheath.",
      "Open the lobe by fixing the sheath and pushing the cable; pulling the sheath instead lets the device slip towards the atrium.",
      "Partial recapture goes only to the lobe marker; if the anchors enter the sheath, remove and reload the device or use a new one.",
    ],
    device: "lobe-disc",
  },
  {
    id: "laao-underfilled",
    title: "Fasted patient under general anaesthesia",
    vignette:
      "Synthetic teaching case. 81-year-old man with AF and recurrent gastrointestinal bleeding, fasted since the evening before and under general anaesthesia. LVEF 55%, no history of heart failure. Single dominant lobe.",
    morphology: "windsock",
    measurements: [m(0, 25, 22, 27), m(45, 26, 23, 28), m(90, 23, 20, 25), m(135, 24, 21, 26)],
    focus: "Read the mean left atrial pressure after crossing; load before the final measurements and size from the largest valid one.",
    teachingPoints: [
      "A dry appendage measures small: with a mean left atrial pressure below 11–12 mmHg, give a fluid challenge (250–1,000 mL by LV function) and measure above 12 mmHg.",
      "Filling adds about 2 mm to the ostium and depth, enough to move the device up a size.",
      "CT reads 1–3 mm above 2D TOE and 2–4 mm above fluoroscopy: rely on the largest valid measurement.",
    ],
    filling: { laMeanMmHg: 7, lv: "normal" },
  },
  {
    id: "laao-reverse-chicken-wing",
    title: "Recurrent bleeding, a reverse chicken-wing",
    vignette:
      "Synthetic teaching case (as in the reverse chicken-wing case of this module). 78-year-old man with permanent AF, previous stroke and transfusion-dependent small-bowel bleeding; long-term anticoagulation is contraindicated. LVEF 50%. CT: reverse chicken-wing with posterior bending of the proximal segment, no thrombus.",
    morphology: "chicken-wing",
    measurements: [m(0, 25, 21, 16), m(45, 26, 22, 15), m(90, 24, 19, 15), m(135, 24, 20, 16)],
    focus: "Plan the puncture from the CT morphology, load before sizing, and deploy the lobe-and-disc device with its own movements.",
    teachingPoints: [
      "A reverse chicken-wing or a posteriorly bent proximal appendage needs an inferior but central or anterior puncture; inferior-posterior leaves the sheath off-axis.",
      "Load to a mean left atrial pressure above 12 mmHg before the final measurements.",
      "Every device-related thrombus at follow-up is anticoagulated until it has resolved.",
    ],
    axis: "reverse-posterior",
    // the case: mean LA pressure 8 mmHg; TOE landing zone 18 mm dry, 22 mm after loading; CT 21 mm
    filling: { laMeanMmHg: 8, lv: "normal", gainMm: 4 },
    modalityOffsetMm: { ctOverToe: 3, ctOverFluoro: 3 },
    device: "lobe-disc",
    followUp: { drt: true, drtMm: 5 },
  },
  {
    id: "laao-drt-followup",
    title: "Eight-week imaging after a plug occluder",
    vignette:
      "Synthetic teaching case. 77-year-old woman eight weeks after a 30 mm plug occluder for AF with recurrent gastrointestinal bleeding, on dual antiplatelet therapy. No symptoms. Follow-up TOE today.",
    morphology: "windsock",
    measurements: [m(0, 24, 21, 28), m(45, 25, 22, 27), m(90, 22, 19, 26), m(135, 23, 20, 27)],
    focus: "Read the follow-up TOE and choose the management of what it shows.",
    teachingPoints: [
      "Device-related thrombus is anticoagulated in every patient, symptomatic or not, until TOE or CT shows resolution; no antithrombotic at all is not appropriate.",
      "Deep implantation and incomplete occlusion are implant factors for device-related thrombus.",
      "Small leaks are imaged again; persistent leaks of 5 mm or more get long-term anticoagulation or leak closure at the operator's discretion.",
    ],
    deployed: { type: "plug", sizeMm: 30, positionMm: 5, coaxial: true, recaptures: 0 },
    followUp: { drt: true, drtMm: 6 },
  },
];

/** The presets of structural-laao-device-mechanics (src/content/lab/presets/structural/laao.launch.ts); the rest are core.launch.ts's. */
export const LAAO_PRESET_IDS = ["laao-plug", "laao-lobe-disc", "laao-underfilled", "laao-reverse-chicken-wing", "laao-drt-followup"] as const;

export function laaoScenarioById(id: string): LaaoScenario | undefined {
  return LAAO_SCENARIOS.find((s) => s.id === id);
}
