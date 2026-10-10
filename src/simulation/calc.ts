// ---------------------------------------------------------------------------
// Haemodynamic and peri-procedural formulas. Pure functions, SI-ish units as
// used in the cath lab (pressures mmHg, flows L/min, Hb g/dL, saturations as
// fractions 0–1). Each formula is the standard textbook form.
// ---------------------------------------------------------------------------

/** Body surface area, DuBois & DuBois (m²). */
export function bsaDuBois(heightCm: number, weightKg: number): number {
  return 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725);
}

/** Body surface area, Mosteller (m²). */
export function bsaMosteller(heightCm: number, weightKg: number): number {
  return Math.sqrt((heightCm * weightKg) / 3600);
}

/** Mean arterial pressure from cuff/line systolic and diastolic. */
export function meanPressure(sys: number, dia: number): number {
  return dia + (sys - dia) / 3;
}

/**
 * Oxygen content (mL O₂ per L blood): 1.36 mL O₂ per g Hb, ×10 to convert
 * g/dL → g/L. Dissolved O₂ (0.003 mL/dL/mmHg) is added if PO₂ is given.
 */
export function o2Content(hb: number, sat: number, po2 = 0): number {
  return 13.6 * hb * sat + 0.03 * po2;
}

/** Assumed oxygen consumption (mL/min). 125 mL/min/m² is the common assumption. */
export function assumedVO2(bsa: number, perM2 = 125): number {
  return perM2 * bsa;
}

/** Fick cardiac output (L/min). */
export function fickCO(vo2: number, hb: number, arterialSat: number, mixedVenousSat: number): number {
  const diff = o2Content(hb, arterialSat) - o2Content(hb, mixedVenousSat);
  if (diff <= 0) return NaN;
  return vo2 / diff;
}

/** Mixed venous saturation proximal to an atrial shunt (Flamm): (3·SVC + IVC) / 4. */
export function flammMixedVenous(svc: number, ivc: number): number {
  return (3 * svc + ivc) / 4;
}

/** Pulmonary-to-systemic flow ratio from saturations. */
export function qpQs(arterial: number, mixedVenous: number, pulmonaryVenous: number, pulmonaryArterial: number): number {
  const den = pulmonaryVenous - pulmonaryArterial;
  if (den <= 0) return NaN;
  return (arterial - mixedVenous) / den;
}

/** Systemic vascular resistance in Wood units ((MAP − RAP) / CO). ×80 for dyn·s·cm⁻⁵. */
export function svrWU(map: number, rap: number, co: number): number {
  return (map - rap) / co;
}

/** Pulmonary vascular resistance in Wood units ((mPAP − PAWP) / CO). */
export function pvrWU(mpap: number, pawp: number, co: number): number {
  return (mpap - pawp) / co;
}

export const WU_TO_DYN = 80;

/** Gorlin aortic valve area (cm²). CO L/min, SEP s/beat, mean gradient mmHg. */
export function gorlinAVA(co: number, hr: number, sep: number, meanGrad: number): number {
  return (co * 1000) / (hr * sep * 44.3 * Math.sqrt(meanGrad));
}

/** Gorlin mitral valve area (cm²). DFP s/beat. Constant 44.3 × 0.85 = 37.7. */
export function gorlinMVA(co: number, hr: number, dfp: number, meanGrad: number): number {
  return (co * 1000) / (hr * dfp * 37.7 * Math.sqrt(meanGrad));
}

/** Hakki simplification: valve area ≈ CO / √(gradient). */
export function hakki(co: number, grad: number): number {
  return co / Math.sqrt(grad);
}

/** Cardiac power output (W): MAP × CO / 451. */
export function cardiacPower(map: number, co: number): number {
  return (map * co) / 451;
}

/** Pulmonary artery pulsatility index: (PASP − PADP) / RAP. */
export function papi(pasp: number, padp: number, rap: number): number {
  return (pasp - padp) / rap;
}

/** Stroke volume index (mL/m²). */
export function strokeVolumeIndex(co: number, hr: number, bsa: number): number {
  return (co * 1000) / hr / bsa;
}

// ---------------------------------------------------------------------------
// Renal / contrast
// ---------------------------------------------------------------------------

export const UMOL_PER_MGDL = 88.4;

/** eGFR, CKD-EPI 2021 (race-free). Creatinine in µmol/L. mL/min/1.73 m². */
export function egfrCkdEpi2021(creatUmol: number, age: number, female: boolean): number {
  const scr = creatUmol / UMOL_PER_MGDL;
  const k = female ? 0.7 : 0.9;
  const a = female ? -0.241 : -0.302;
  return 142 * Math.pow(Math.min(scr / k, 1), a) * Math.pow(Math.max(scr / k, 1), -1.2) * Math.pow(0.9938, age) * (female ? 1.012 : 1);
}

/** Maximum acceptable contrast dose (Cigarroa): 5 mL × kg / creatinine (mg/dL), capped at 300 mL. */
export function maxContrastCigarroa(weightKg: number, creatUmol: number): number {
  return Math.min(300, (5 * weightKg) / (creatUmol / UMOL_PER_MGDL));
}

export interface MehranInput {
  hypotension: boolean;
  iabp: boolean;
  heartFailure: boolean;
  age: number;
  anaemia: boolean;
  diabetes: boolean;
  contrastMl: number;
  egfr: number;
}

/** Mehran contrast-induced nephropathy risk score (eGFR version). */
export function mehranScore(m: MehranInput): number {
  let s = 0;
  if (m.hypotension) s += 5;
  if (m.iabp) s += 5;
  if (m.heartFailure) s += 5;
  if (m.age > 75) s += 4;
  if (m.anaemia) s += 3;
  if (m.diabetes) s += 3;
  s += Math.floor(m.contrastMl / 100);
  if (m.egfr < 20) s += 6;
  else if (m.egfr < 40) s += 4;
  else if (m.egfr < 60) s += 2;
  return s;
}

/** Published risk bands for the Mehran score (risk of CIN and of dialysis). */
export function mehranBand(score: number): { band: string; cin: string; dialysis: string } {
  if (score <= 5) return { band: "low", cin: "7.5%", dialysis: "0.04%" };
  if (score <= 10) return { band: "moderate", cin: "14.0%", dialysis: "0.12%" };
  if (score <= 15) return { band: "high", cin: "26.1%", dialysis: "1.09%" };
  return { band: "very high", cin: "57.3%", dialysis: "12.6%" };
}
