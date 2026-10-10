// ---------------------------------------------------------------------------
// Lesion assessment, sizing rationale and the ACT check.
//
// Calipers are placed on a frozen end-diastolic frame after calibrating on
// the guide catheter (6 F = 2.0 mm outer diameter: one French is a third of a
// millimetre). Estimates are scored against ground truth from the geometry;
// QCA is revealed only after the learner commits an estimate.
// Sizing basis: distal reference, mean reference, IVUS EEM (mean EEM rounded
// down to the nearest 0.25 mm, EAPCI 2018) or IVUS lumen. ACT before devices:
// heparin to an ACT of 250-300 s (2011 ACCF/AHA/SCAI table via S9 facts).
//
// Device- and regimen-specific ACT targets and the recheck clock
// (pci-antithrombotic-orders), from the goal table of lesson
// pm-antithrombotics-heparin (src/content/manual/pci-manual/03-antithrombotics.ts):
//   heparin alone, Hemochron: 300-350 s (Brilakis 2.8 and 3.4, line 119);
//   heparin alone, HemoTec: 250-300 s (Brilakis 3.4, line 120);
//   with a GP IIb/IIIa inhibitor or cangrelor: 200-250 s (line 121: a Hemochron
//     figure; neither manual gives a HemoTec one, so the lab applies it to the
//     HemoTec setting too and flags the target as not specified);
//   antegrade CTO above 300 s, retrograde above 350 s, Hemochron (lines 122-123);
//   bivalirudin uses the heparin goals (lines 321 and 476).
// The ACT is checked about 5 minutes after a bolus (line 93) and rechecked
// every 20-30 minutes (line 101). The legacy two-argument actGate keeps the
// single 250 s gate (the HemoTec heparin-alone floor) for callers that pass
// no regimen.
// ---------------------------------------------------------------------------

import { radiusAtMm, type PciGeom } from "./geometry";

/** Outer diameter of a 6 F guide (mm): French = outer diameter in thirds of a millimetre. */
export const GUIDE_6F_MM = 2.0;
/** ACT target before advancing devices with heparin alone (s). */
export const ACT_TARGET_S = 250;
/** Normal-to-normal margin added at each end when choosing a stent length (mm) — MODEL PARAMETER (a common teaching rule). */
export const MP_LANDING_MARGIN_MM = 2;

export interface LesionTruth {
  refProxMm: number;
  refDistMm: number;
  /** mean of proximal and distal reference */
  refMm: number;
  mldMm: number;
  dsPct: number;
  lengthMm: number;
}

/** Ground truth for the target lesion now (reference from the healthy tree, MLD from the current severity). */
export function lesionTruth(g: PciGeom, severityPct: number, route: string[] = [g.lesion.vessel]): LesionTruth {
  const L = g.lesion;
  const r = route.includes(L.vessel) ? route : [L.vessel];
  const refProx = 2 * radiusAtMm(g, r, Math.max(0, L.startMm - 2), true);
  const refDist = 2 * radiusAtMm(g, r, L.endMm + 2, true);
  const mld = L.refDiameter * (1 - severityPct / 100);
  return { refProxMm: refProx, refDistMm: refDist, refMm: (refProx + refDist) / 2, mldMm: mld, dsPct: severityPct, lengthMm: L.endMm - L.startMm };
}

export interface CaliperEstimate {
  refMm: number;
  mldMm: number;
  lengthMm: number;
}

export interface EstimateScore {
  refErrMm: number;
  mldErrMm: number;
  lengthErrMm: number;
  estDsPct: number;
  dsErrPct: number;
}

export function scoreEstimate(e: CaliperEstimate, t: LesionTruth): EstimateScore {
  const estDs = e.refMm > 0 ? 100 * (1 - e.mldMm / e.refMm) : 0;
  return {
    refErrMm: Math.abs(e.refMm - t.refMm),
    mldErrMm: Math.abs(e.mldMm - t.mldMm),
    lengthErrMm: Math.abs(e.lengthMm - t.lengthMm),
    estDsPct: estDs,
    dsErrPct: Math.abs(estDs - t.dsPct),
  };
}

/** Pixel distance to mm using the guide calibration (pixels across the 6 F guide). */
export function pxToMm(px: number, guidePx: number, guideMm = GUIDE_6F_MM): number {
  return guidePx > 0 ? (px * guideMm) / guidePx : 0;
}

export type SizingBasis = "distal-reference" | "mean-reference" | "ivus-eem" | "ivus-lumen";

export const SIZING_LABEL: Record<SizingBasis, string> = {
  "distal-reference": "Distal reference diameter",
  "mean-reference": "Mean of proximal and distal reference",
  "ivus-eem": "IVUS: mean EEM of the distal reference, rounded down to 0.25 mm",
  "ivus-lumen": "IVUS: distal reference lumen, rounded up to 0.25 mm",
};

const DIAMS = [2.5, 2.75, 3.0, 3.5, 4.0];
const LENGTHS = [8, 12, 15, 18, 23, 28];

function nearest(list: number[], x: number): number {
  return list.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a));
}

/** Stent size from a sizing basis and the learner's (or imaging) measurements. */
export function sizeFor(basis: SizingBasis, m: { refProxMm: number; refDistMm: number; lengthMm: number; ivusDistEem?: number; ivusDistLumen?: number }): { diameter: number; lengthMm: number; rawMm: number } {
  let raw: number;
  if (basis === "distal-reference") raw = m.refDistMm;
  else if (basis === "mean-reference") raw = (m.refProxMm + m.refDistMm) / 2;
  else if (basis === "ivus-eem") raw = Math.floor(((m.ivusDistEem ?? m.refDistMm * 1.2) / 0.25) + 1e-9) * 0.25;
  else raw = Math.ceil(((m.ivusDistLumen ?? m.refDistMm) / 0.25) - 1e-9) * 0.25;
  const diameter = basis === "ivus-eem" ? DIAMS.filter((d) => d <= raw + 1e-9).pop() ?? DIAMS[0] : nearest(DIAMS, raw);
  const want = m.lengthMm + 2 * MP_LANDING_MARGIN_MM;
  const lengthMm = LENGTHS.find((l) => l >= want) ?? LENGTHS[LENGTHS.length - 1];
  return { diameter, lengthMm, rawMm: raw };
}

export interface ActGate {
  ok: boolean;
  reason: string;
  /** the target the ACT was read against (the regimen form only) */
  target?: ActTarget;
  /** the last ACT is older than the recheck interval (the regimen form only) */
  stale?: boolean;
}

/** The point-of-care ACT machine a lab or case declares (the same blood reads higher on a Hemochron: Brilakis 25.2, line 129). */
export type ActDevice = "hemochron" | "hemotec";

/** What is anticoagulating the patient, and whether an IV antiplatelet agent is running. */
export interface ActRegimen {
  anticoagulant: "heparin" | "bivalirudin" | "none";
  /** a GP IIb/IIIa inhibitor or cangrelor is being given */
  ivAntiplatelet: boolean;
  /** a CTO case and its crossing strategy (absent or null: not a CTO) */
  cto?: "antegrade" | "retrograde" | null;
}

/** An ACT target: the lower bound gates the devices; the upper bound (null: none stated) is the top of the goal range. */
export interface ActTarget {
  minS: number;
  maxS: number | null;
  /** false when the manuals give no figure for this device and situation and the lab applies the nearest one */
  specified: boolean;
  /** where the figure comes from (module text location) */
  source: string;
  note?: string;
}

const AT_FILE = "pci-manual/03-antithrombotics.ts";

/** The goal table of lesson pm-antithrombotics-heparin (03-antithrombotics.ts:119-124), s. */
export const ACT_TARGETS_S = {
  heparinHemochron: { minS: 300, maxS: 350, source: `Brilakis 2.8 and 3.4 (${AT_FILE}:119)` },
  heparinHemotec: { minS: 250, maxS: 300, source: `Brilakis 3.4 (${AT_FILE}:120)` },
  ivAntiplatelet: { minS: 200, maxS: 250, source: `Brilakis 3.4 and 3.5; a Hemochron figure in 2.8 and 20.3 (${AT_FILE}:121)` },
  ctoAntegradeHemochron: { minS: 300, maxS: null, source: `Brilakis 21.3 (${AT_FILE}:122)` },
  ctoRetrogradeHemochron: { minS: 350, maxS: null, source: `Brilakis 2.8, 3.4 and 21.3 (${AT_FILE}:123)` },
} as const;

/** Check the ACT about this long after a bolus, s (Brilakis: 5 minutes, 03-antithrombotics.ts:93). */
export const ACT_CHECK_AFTER_BOLUS_S = 5 * 60;
/** Recheck the ACT every 20-30 minutes, s (Brilakis 3.4, 03-antithrombotics.ts:101). */
export const ACT_RECHECK_S: readonly [number, number] = [20 * 60, 30 * 60];

/** The ACT target for a regimen on a device. */
export function actTarget(regimen: ActRegimen, device: ActDevice): ActTarget {
  const T = ACT_TARGETS_S;
  const bival = regimen.anticoagulant === "bivalirudin" ? " Bivalirudin uses the heparin goals (Brilakis 3.4, 03-antithrombotics.ts:321)." : "";
  if (regimen.ivAntiplatelet) {
    const hemotec = device === "hemotec";
    return {
      minS: T.ivAntiplatelet.minS,
      maxS: T.ivAntiplatelet.maxS,
      specified: !hemotec,
      source: T.ivAntiplatelet.source,
      ...(hemotec || bival ? { note: `${hemotec ? "Neither manual gives a HemoTec figure with an IV antiplatelet agent: the Hemochron figure is applied and flagged as not specified." : ""}${bival}`.trim() } : {}),
    };
  }
  if (regimen.cto && device === "hemochron") {
    const c = regimen.cto === "retrograde" ? T.ctoRetrogradeHemochron : T.ctoAntegradeHemochron;
    return { minS: c.minS, maxS: c.maxS, specified: true, source: c.source, ...(bival ? { note: bival.trim() } : {}) };
  }
  const base = device === "hemochron" ? T.heparinHemochron : T.heparinHemotec;
  const ctoHemotec = !!regimen.cto && device === "hemotec";
  return {
    minS: base.minS,
    maxS: base.maxS,
    specified: !ctoHemotec,
    source: base.source,
    ...(ctoHemotec || bival ? { note: `${ctoHemotec ? "The CTO goals are given for a Hemochron only: the HemoTec heparin-alone range is applied and flagged as not specified." : ""}${bival}`.trim() } : {}),
  };
}

/** The recheck clock: time since the last anticoagulant dose and the last ACT, and whether a recheck is due or overdue. */
export interface ActClock {
  /** s since the last anticoagulant bolus (null: none recorded) */
  sinceDoseS: number | null;
  /** s since the last measured ACT (null: none) */
  sinceActS: number | null;
  /** an ACT has been measured since the last bolus */
  actSinceDose: boolean;
  /** the recheck interval's lower bound has passed since the last ACT (the team's reminder) */
  due: boolean;
  /** the interval's upper bound has passed without an ACT */
  overdue: boolean;
}

export function actClock(o: { t: number; lastDoseT: number | null; lastActT: number | null }): ActClock {
  const sinceDoseS = o.lastDoseT === null ? null : Math.max(0, o.t - o.lastDoseT);
  const sinceActS = o.lastActT === null ? null : Math.max(0, o.t - o.lastActT);
  const actSinceDose = o.lastActT !== null && (o.lastDoseT === null || o.lastActT >= o.lastDoseT);
  // with no ACT yet the clock runs from the last dose
  const since = sinceActS ?? sinceDoseS;
  return {
    sinceDoseS,
    sinceActS,
    actSinceDose,
    due: since !== null && since >= ACT_RECHECK_S[0],
    overdue: since !== null && since > ACT_RECHECK_S[1],
  };
}

/**
 * Devices may advance once an ACT at or above target has been measured since the last heparin dose.
 * Two forms: the legacy (lastAct, heparinGiven) against the single 250 s gate, and
 * (lastAct, regimen, device, clock?) against the device- and regimen-specific target, which also
 * refuses an ACT older than the recheck interval (30 minutes) when a clock is given.
 */
export function actGate(lastAct: number | null, heparinGiven: boolean): ActGate;
export function actGate(lastAct: number | null, regimen: ActRegimen, device: ActDevice, clock?: Pick<ActClock, "sinceActS"> | null): ActGate;
export function actGate(lastAct: number | null, r: boolean | ActRegimen, device?: ActDevice, clock?: Pick<ActClock, "sinceActS"> | null): ActGate {
  if (typeof r === "boolean") {
    if (!r) return { ok: false, reason: "No heparin has been given." };
    if (lastAct === null) return { ok: false, reason: "Check the ACT before advancing devices." };
    if (lastAct < ACT_TARGET_S) return { ok: false, reason: `ACT ${Math.round(lastAct)} s is below ${ACT_TARGET_S} s: give more heparin and re-check.` };
    return { ok: true, reason: `ACT ${Math.round(lastAct)} s.` };
  }
  const target = actTarget(r, device ?? "hemotec");
  if (r.anticoagulant === "none") return { ok: false, reason: "No anticoagulant has been given.", target };
  if (lastAct === null) return { ok: false, reason: "Check the ACT before advancing devices.", target };
  const since = clock?.sinceActS ?? null;
  if (since !== null && since > ACT_RECHECK_S[1]) {
    return { ok: false, reason: `The last ACT was ${Math.round(since / 60)} minutes ago: recheck it before devices go further.`, target, stale: true };
  }
  const drug = r.anticoagulant === "bivalirudin" ? "bivalirudin" : "heparin";
  if (lastAct < target.minS) return { ok: false, reason: `ACT ${Math.round(lastAct)} s is below the ${target.minS} s target: give more ${drug} and re-check.`, target, stale: false };
  return { ok: true, reason: `ACT ${Math.round(lastAct)} s.`, target, stale: false };
}

/**
 * Whether the lab should raise 'low-act' (pci-antithrombotic-orders' tip integration): an
 * anticoagulant has been given and the measured ACT, or the engine's true ACT when given, is below
 * the active target, or the recheck interval has passed without an ACT.
 */
export function lowActNow(o: { lastAct: number | null; actTrue?: number | null; regimen: ActRegimen; device: ActDevice; clock: Pick<ActClock, "overdue"> }): boolean {
  if (o.regimen.anticoagulant === "none") return false;
  const min = actTarget(o.regimen, o.device).minS;
  if (o.lastAct !== null && o.lastAct < min) return true;
  if (typeof o.actTrue === "number" && o.actTrue < min) return true;
  return o.clock.overdue;
}
