// ---------------------------------------------------------------------------
// ECG engine.
//
// A single-lead surface ECG (think lead II on the hemodynamic monitor). The
// morphology is synthesised from Gaussian P/Q/R/S/T deflections so it looks
// like a real trace, and it RESPONDS to the simulated state:
//
//   • Heart rate rises with instability / ischaemia (reflex tachycardia).
//   • The ST segment shifts as the catheter provokes ischaemia — deep or
//     damped engagement of a vessel that already carries a critical lesion
//     drives ST ELEVATION (acute injury current); milder demand ischaemia
//     drives ST DEPRESSION.
//   • A dissection or an LV-seated tip pushes it toward marked injury.
//
// Everything here is pure. The waveform component keeps a small "dwell" timer
// (how long the trace has been abnormal) and feeds it in, so ischaemia builds
// and recovers over seconds rather than snapping.
// ---------------------------------------------------------------------------

import type {
  AnatomyCase,
  EngagementState,
  PressureState,
  PathologyKind,
} from "../types";

export const ECG_BASE_PERIOD = 0.84; // s → ~71 bpm at rest (matches aortic trace)

export interface EcgState {
  /** heart rate, bpm */
  hr: number;
  /** ST deviation in "mm" (+ elevation, − depression) */
  st: number;
  /** overall ischaemia 0..1 (drives ST magnitude + T-wave changes) */
  ischaemia: number;
  /** beat period in seconds */
  period: number;
  /** short human label for the monitor */
  label: string;
  warning: "none" | "caution" | "danger";
}

// How vulnerable the currently-engaged territory is to catheter-induced
// ischaemia. A tight proximal lesion ischaemias fast and hard when the ostium
// is damped; a normal vessel tolerates it far better.
function territoryVulnerability(caseData: AnatomyCase, eng: EngagementState): number {
  const sideLeft = eng.target === "left";
  const sideRight = eng.target === "right";
  let v = 0.25; // baseline — even a normal ostium won't love being occluded
  const bump = (k: PathologyKind, amt: number) => {
    if (caseData.pathology === k) v = Math.max(v, amt);
  };
  bump("left-main", 0.95);
  bump("critical-lad", 0.85);
  bump("ostial-rca", 0.85);
  bump("cto", 0.7);
  bump("thrombotic", 0.9);
  bump("severe-stenosis", 0.7);
  bump("mid-rca", 0.55);
  bump("moderate-stenosis", 0.45);
  // Only count the lesion if we're in its territory.
  for (const l of caseData.lesions) {
    const left = l.vessel === "LM" || l.vessel.startsWith("LA") || l.vessel.startsWith("LC") ||
      l.vessel.startsWith("OM") || l.vessel.startsWith("D") || l.vessel === "RAMUS";
    const inTerritory = (sideLeft && left) || (sideRight && !left);
    if (inTerritory) v = Math.max(v, 0.35 + (l.severity / 100) * 0.6);
  }
  return Math.min(1, v);
}

/**
 * Derive the live ECG state. `dwell` is seconds spent in the current abnormal
 * pressure state (0 when the trace is clean) — the waveform component tracks it.
 */
export function ecgFromSim(
  eng: EngagementState,
  pressure: PressureState,
  caseData: AnatomyCase,
  dwell: number
): EcgState {
  const vuln = territoryVulnerability(caseData, eng);

  // Acute injury: tip is obstructing an ostium/vessel (damped/wedged/ventric.
  // or deep/LV). Injury current → ST elevation that grows with dwell × vuln.
  const obstructing =
    pressure.kind === "damped" ||
    pressure.kind === "wedged" ||
    pressure.kind === "ventricularised" ||
    pressure.kind === "dissected" ||
    eng.isDeep ||
    eng.kind === "in-lv";

  // ischaemia builds over ~6 s of obstruction, scaled by vulnerability.
  const dwellFrac = Math.min(1, dwell / 6);
  let ischaemia = obstructing ? Math.min(1, dwellFrac * (0.35 + 0.65 * vuln)) : 0;

  // A dissection leaves a persistent ischaemic insult.
  if (pressure.kind === "dissected") ischaemia = Math.max(ischaemia, 0.7);

  // ST sign: acute occlusion of a vulnerable bed → elevation; milder / demand
  // ischaemia (non-obstructing but engaged tight lesion) → depression.
  let st = 0;
  if (obstructing) {
    st = ischaemia * (0.6 + 1.4 * vuln) * 3.2; // up to ~+5 mm elevation
  } else if (eng.isSelective && vuln > 0.5) {
    st = -Math.min(2.2, (vuln - 0.4) * 2.6); // subendocardial depression
  }

  // Rate: resting, up with instability / ischaemia / noise.
  let hr = 71;
  if (pressure.kind === "noisy") hr += 8;
  hr += ischaemia * 34; // ischaemia → tachycardia
  if (eng.kind === "in-lv") hr += 10;
  hr = Math.round(Math.max(48, Math.min(150, hr)));

  const warning: EcgState["warning"] =
    ischaemia > 0.5 || Math.abs(st) > 2.5 ? "danger" : ischaemia > 0.15 || Math.abs(st) > 1 ? "caution" : "none";
  const label =
    pressure.kind === "dissected"
      ? "Acute injury pattern — dissection"
      : st > 2.5
      ? "ST elevation — acute injury"
      : st > 1
      ? "ST elevation — ischaemia"
      : st < -1
      ? "ST depression — ischaemia"
      : hr > 100
      ? "Sinus tachycardia"
      : "Sinus rhythm";

  return { hr, st, ischaemia, period: 60 / hr, label, warning };
}

const gauss = (x: number, mu: number, sigma: number, amp: number): number =>
  amp * Math.exp(-((x - mu) * (x - mu)) / (2 * sigma * sigma));

/**
 * ECG amplitude (in "mV", baseline 0) for a phase 0..1 through one beat.
 * `st` shifts the ST segment and shapes the T wave (hyperacute when elevated).
 */
export function ecgShape(phase: number, st: number): number {
  const p = ((phase % 1) + 1) % 1;
  // Landmark positions across the cardiac cycle (fraction of RR).
  // P (0.16) · Q (0.30) · R (0.33) · S (0.36) · T (0.58)
  let v = 0;
  v += gauss(p, 0.16, 0.022, 0.14); // P wave
  v += gauss(p, 0.30, 0.008, -0.16); // Q
  v += gauss(p, 0.33, 0.009, 1.0); // R
  v += gauss(p, 0.365, 0.009, -0.26); // S

  // ST segment (between S end ~0.38 and T start ~0.5): shift by st.
  const stLevel = st * 0.06; // mm → mV-ish
  if (p > 0.38 && p < 0.52) {
    const w = Math.min(1, (p - 0.38) / 0.04) * Math.min(1, (0.52 - p) / 0.04);
    v += stLevel * w;
  }

  // T wave — taller/peaked when injured (hyperacute), inverted-ish handled by st<0.
  const tAmp = 0.22 + Math.max(0, st) * 0.05;
  v += gauss(p, 0.58, 0.03, tAmp) + stLevel * gauss(p, 0.58, 0.05, 1);

  return v;
}
