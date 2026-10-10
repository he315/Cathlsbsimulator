// ---------------------------------------------------------------------------
// Lumped-parameter model of the circulation with mechanical support devices.
//
// Compartments: LV and RV (time-varying elastance with an exponential
// end-diastolic pressure–volume relation), aortic root, systemic arteries,
// systemic veins + RA, pulmonary arteries, pulmonary veins + LA. The aortic
// root connects to the systemic arteries through a characteristic resistance
// and an inertance, which produces the dicrotic notch when the valve closes.
// Valves are ideal diodes with a small resistance.
//
// Devices act physically:
//   IABP     – a 30–50 mL balloon in the descending aorta that displaces
//              volume (adds pressure) in diastole and removes it before systole.
//   Impella  – an axial pump from LV to aortic root whose flow falls as the
//              aorta–LV pressure difference rises (pump curve), with position
//              effects and suction when the LV empties.
//   VA-ECMO  – a centrifugal pump draining the venous side and returning to
//              the descending aorta; flow depends on speed and the pressure it
//              pumps against. Retrograde flow raises LV afterload.
// The aim is correct direction and interaction of effects for teaching; the
// constants are typical adult values tuned to give normal resting numbers.
// ---------------------------------------------------------------------------

export interface Chamber {
  ees: number; // end-systolic elastance, mmHg/mL
  v0: number; // unstressed volume, mL
  p0: number; // EDPVR scale, mmHg
  lambda: number; // EDPVR stiffness, 1/mL
}

export interface Patient {
  hr: number;
  lv: Chamber;
  rv: Chamber;
  /** systemic and pulmonary vascular resistance, mmHg·s/mL */
  rsys: number;
  rpul: number;
  /** total stressed blood volume, mL (filling) */
  stressed: number;
  /** fraction of pulmonary blood flow that is not oxygenated (0 healthy lungs … 0.6 severe oedema/ARDS) */
  shunt: number;
  rhythm: "sinus" | "vf";
  /**
   * Pressure applied to the outside of both ventricles, mmHg (optional, default 0): pericardial
   * pressure from an effusion, or chest compressions. Added to both ventricular pressures, so it
   * impairs filling and raises intracavitary pressure. Used by the patient engine (patient/engine.ts).
   */
  pericardial?: number;
  /**
   * Systemic arterial compliance, mL/mmHg (optional, default C_SA = 1.35). Lower in stiff arteries,
   * which widens the pulse pressure; the patient engine sets it per patient.
   */
  cSa?: number;
  /**
   * Aortic root compliance (mL/mmHg) and root-to-arteries inertance (mmHg·s²/mL), optional
   * (defaults C_ROOT = 0.12 and L_AO = 0.0006). The patient engine raises the inertance so the
   * incisura (dicrotic notch) at valve closure is visible on a transduced trace.
   */
  cRoot?: number;
  lAo?: number;
  /**
   * Aortic valve inertance (mmHg·s²/mL), optional. When set, flow through the aortic valve has
   * inertia: at the end of ejection it decelerates, briefly reverses and the valve closes after a
   * small regurgitant volume (avCloseMl), which produces the incisura on the root pressure. Unset,
   * the valve is the original ideal diode.
   */
  lAv?: number;
  avCloseMl?: number;
  /**
   * Effective aortic valve orifice area, cm² (optional; unset, the valve opens fully as before). A
   * fixed orifice adds the Bernoulli loss ΔP = (ρ/2)·v² with v = Q/A to the valve resistance, so a
   * small area gives a slow-rising, low-amplitude aortic pulse (parvus et tardus) and a high LV
   * systolic pressure (diag-pressure-transducer). Normal areas (about 3 cm²) leave the trace
   * unchanged in practice.
   */
  avaCm2?: number;
  /**
   * Left heart task (diag-lv-aorta-task), each optional and off when unset, so every lab that does not
   * set them is unchanged:
   * - mrConductance: mitral regurgitant conductance, mL/s per mmHg of LV-to-LA pressure difference
   *   (catheter-induced when a pigtail lies on the mitral apparatus, or a scenario's chronic MR);
   * - arConductance: aortic regurgitant conductance, mL/s per mmHg of root-to-LV difference (a catheter
   *   on the leaflets, or a scenario's AR);
   * - atrialKickMmHg: atrial contraction, the peak pressure it adds to the left atrium in late diastole
   *   (the a wave on the LV diastolic trace, after which the LVEDP is read). Timing in ATRIAL_CONTRACTION.
   */
  mrConductance?: number;
  arConductance?: number;
  atrialKickMmHg?: number;
}

/**
 * Timing of atrial contraction (diag-lv-aorta-task), MODEL PARAMETERS: it starts leadS before the next R
 * wave and lasts durS (a half-sine), so it ends just before the R wave and the LVEDP read there follows
 * the a wave. Not from the module text.
 */
export const ATRIAL_CONTRACTION = { leadS: 0.17, durS: 0.13 };

/** Atrial activation 0..1 at beatT (s since the R wave) of a beat of length rr (s). */
export function atrialActivation(beatT: number, rr: number): number {
  const t0 = rr - ATRIAL_CONTRACTION.leadS;
  const x = (beatT - t0) / ATRIAL_CONTRACTION.durS;
  if (!(x > 0) || x >= 1) return 0;
  return Math.sin(Math.PI * x);
}

/** Blood density, kg/m³ (physics; used for the Bernoulli loss across a narrowed orifice). */
export const BLOOD_DENSITY = 1060;

/**
 * Bernoulli coefficient of an orifice: ΔP (mmHg) = k·Q² with Q in mL/s. From ΔP = (ρ/2)v², v = Q/A:
 * Q mL/s through A cm² is Q/A cm/s, i.e. Q/(100·A) m/s, and 133.322 Pa per mmHg.
 */
export function orificeCoefficient(areaCm2: number): number {
  const a = Math.max(0.05, areaCm2);
  return (0.5 * BLOOD_DENSITY) / 133.322 / (100 * a) ** 2;
}

/** Flow through a resistance r in series with an orifice of coefficient k under a pressure difference dp (≥ 0): r·q + k·q² = dp. */
function orificeFlow(dp: number, r: number, k: number): number {
  if (dp <= 0) return 0;
  if (k <= 0) return dp / r;
  return (-r + Math.sqrt(r * r + 4 * k * dp)) / (2 * k);
}

export interface IabpDevice {
  on: boolean;
  ratio: 1 | 2 | 3;
  /** inflation and deflation, as a fraction of the R–R interval from the R wave (deflate may exceed 1) */
  inflate: number;
  deflate: number;
  volume: number; // mL
}

export interface ImpellaDevice {
  on: boolean;
  pLevel: number; // 0–9
  /** depth of the inlet below the aortic annulus, cm (target ≈ 3.5 for CP) */
  depth: number;
}

export interface EcmoDevice {
  on: boolean;
  rpm: number;
  sweep: number; // L/min
  fdo2: number; // 0.21–1
  distalPerfusion: boolean;
}

export interface Devices {
  iabp?: IabpDevice;
  impella?: ImpellaDevice;
  ecmo?: EcmoDevice;
}

// Compliances (mL/mmHg) and resistances (mmHg·s/mL)
const C_ROOT = 0.12;
const C_SA = 1.35;
const C_SV = 90;
const C_PA = 4.2;
const C_PV = 14;
const R_C = 0.04; // aortic characteristic resistance
const L_AO = 0.0006; // aortic inertance, mmHg·s²/mL
const R_AV = 0.006;
const R_MV = 0.006;
const R_TV = 0.005;
const R_PV = 0.004;
/** small physiological leaks that matter when the LV cannot eject (VA-ECMO, arrest) */
const R_AR_LEAK = 25; // aortic root → LV when the valve is closed
const R_MR_LEAK = 12; // LV → LA when LV pressure exceeds LA pressure
const R_BRONCH = 40; // bronchial circulation: systemic arteries → pulmonary veins

export interface SimState {
  t: number;
  vLV: number;
  vRV: number;
  vRoot: number;
  vSA: number;
  vSV: number;
  vPA: number;
  vPV: number;
  qRoot: number; // root → systemic arteries (inertial)
  /** inertial aortic-valve flow and the volume regurgitated since it began to close (only with Patient.lAv) */
  qAv?: number;
  avBack?: number;
  beat: number;
  beatT: number; // time since this beat's R wave
}

export interface Pressures {
  lv: number;
  rv: number;
  root: number;
  sa: number;
  sv: number;
  pa: number;
  pv: number;
}

export interface Flows {
  av: number;
  mv: number;
  tv: number;
  pv: number;
  impella: number;
  ecmo: number;
  balloon: number; // balloon volume (mL) at this instant
  /** regurgitant flows through Patient.mrConductance and arConductance (mL/s); absent when neither is set */
  mr?: number;
  ar?: number;
}

export function activation(beatT: number, hr: number): number {
  const rr = 60 / hr;
  const ts = 0.3 * Math.sqrt(rr / 0.8); // contraction
  const tr = 0.15 * Math.sqrt(rr / 0.8); // relaxation
  if (beatT < ts) return 0.5 * (1 - Math.cos((Math.PI * beatT) / ts));
  if (beatT < ts + tr) return 0.5 * (1 + Math.cos((Math.PI * (beatT - ts)) / tr));
  return 0;
}

function ventP(c: Chamber, v: number, e: number): number {
  const ed = c.p0 * (Math.exp(c.lambda * (v - c.v0)) - 1);
  const es = c.ees * (v - c.v0);
  return e * es + (1 - e) * ed;
}

/** Balloon volume at a point in the beat. Inflation and deflation take ~40 ms. */
export function balloonVolume(d: IabpDevice | undefined, beat: number, beatT: number, hr: number): number {
  if (!d || !d.on) return 0;
  const rr = 60 / hr;
  const ramp = 0.04;
  const phase = beatT / rr;
  const vol = (b: number, ph: number) => {
    if (((b % d.ratio) + d.ratio) % d.ratio !== 0) return 0;
    const ti = d.inflate * rr;
    const td = d.deflate * rr;
    const tt = ph * rr;
    if (tt < ti || tt > td + ramp) return 0;
    const up = Math.min(1, (tt - ti) / ramp);
    const down = tt > td ? 1 - (tt - td) / ramp : 1;
    return d.volume * Math.max(0, Math.min(up, down));
  };
  // a late deflation from the previous beat spills into this one
  return Math.max(vol(beat, phase), vol(beat - 1, phase + 1));
}

// --- Impella ----------------------------------------------------------------
export type ImpellaPosition = "aorta" | "shallow" | "correct" | "deep" | "ventricle";

export function impellaPosition(depth: number): ImpellaPosition {
  if (depth < 0.5) return "aorta"; // inlet above the valve: recirculates in the aorta
  if (depth < 2.5) return "shallow";
  if (depth <= 4.5) return "correct";
  if (depth <= 5.5) return "deep";
  return "ventricle"; // outlet has fallen below the valve: recirculates in the LV
}

/** Pump curve (teaching model): flow in mL/s for a P-level and a pressure difference. */
export function impellaPumpFlow(pLevel: number, dp: number): number {
  const lpm = 0.4 + 0.5 * pLevel - 0.016 * dp;
  return (Math.max(-0.5, lpm) * 1000) / 60;
}

// --- ECMO ---------------------------------------------------------------------
const ECMO_A = 22; // pressure head per (krpm)²
const ECMO_R = 3.3; // circuit resistance (cannulae + oxygenator)

export function ecmoPumpFlow(rpm: number, dpOut: number): number {
  const head = ECMO_A * (rpm / 1000) ** 2;
  return (head - dpOut) / ECMO_R;
}

// ---------------------------------------------------------------------------
export function pressures(p: Patient, s: SimState): Pressures {
  const e = p.rhythm === "vf" ? 0.03 : activation(s.beatT, p.hr);
  const ext = p.pericardial ?? 0;
  return {
    lv: ventP(p.lv, s.vLV, e) + ext,
    rv: ventP(p.rv, s.vRV, e) + ext,
    root: s.vRoot / (p.cRoot ?? C_ROOT),
    sa: s.vSA / (p.cSa ?? C_SA),
    sv: s.vSV / C_SV,
    pa: s.vPA / C_PA,
    pv: s.vPV / C_PV,
  };
}

export interface StepInfo {
  P: Pressures;
  F: Flows;
  suction: boolean;
  chatter: boolean;
}

/** Advance the model by dt seconds (explicit Euler, call with dt ≤ 0.5 ms). */
export function step(p: Patient, d: Devices, s: SimState, dt: number): StepInfo {
  const rr = 60 / p.hr;
  const P = pressures(p, s);
  const bal = balloonVolume(d.iabp, s.beat, s.beatT, p.hr);
  const pSA = (s.vSA + bal) / (p.cSa ?? C_SA);

  // valves
  const kAv = p.avaCm2 ? orificeCoefficient(p.avaCm2) : 0;
  let av = kAv > 0 ? orificeFlow(P.lv - P.root, R_AV, kAv) : Math.max(0, (P.lv - P.root) / R_AV);
  let qAv = s.qAv ?? 0;
  let avBack = s.avBack ?? 0;
  if (p.lAv) {
    // inertial valve: opens when LV exceeds root pressure, closes after a small backflow volume
    const closeMl = p.avCloseMl ?? 1.5;
    const open = qAv > 0 || avBack < closeMl;
    if (open && (qAv !== 0 || P.lv > P.root)) {
      qAv += (dt * (P.lv - P.root - R_AV * qAv - kAv * qAv * Math.abs(qAv))) / p.lAv;
      if (qAv < 0) avBack -= qAv * dt;
      else avBack = 0;
      if (avBack >= closeMl) qAv = 0;
    } else {
      qAv = 0;
      if (P.lv > P.root) avBack = 0;
    }
    av = qAv;
  }
  // the left atrium with its contraction (Patient.atrialKickMmHg; none when unset)
  const pLa = p.atrialKickMmHg ? P.pv + p.atrialKickMmHg * atrialActivation(s.beatT, rr) : P.pv;
  const mv = Math.max(0, (pLa - P.lv) / R_MV);
  const arLeak = Math.max(0, (P.root - P.lv) / R_AR_LEAK);
  const mrLeak = Math.max(0, (P.lv - P.pv) / R_MR_LEAK);
  // regurgitation through the left heart task's conductances (zero when unset)
  const mrReg = p.mrConductance ? p.mrConductance * Math.max(0, P.lv - pLa) : 0;
  const arReg = p.arConductance ? p.arConductance * Math.max(0, P.root - P.lv) : 0;
  const bronch = Math.max(0, (pSA - P.pv) / R_BRONCH);
  const tv = Math.max(0, (P.sv - P.rv) / R_TV);
  const pvf = Math.max(0, (P.rv - P.pa) / R_PV);

  // Impella
  let imp = 0;
  let suction = false;
  if (d.impella?.on) {
    const pos = impellaPosition(d.impella.depth);
    if (pos === "correct" || pos === "shallow" || pos === "deep") {
      imp = impellaPumpFlow(d.impella.pLevel, P.root - P.lv);
      if (pos === "shallow") imp *= 0.75; // inlet near the valve leaflets
      // suction: an underfilled LV collapses onto the inlet (more readily when the pump sits deep)
      const lim = pos === "deep" ? 6 : 3;
      if (imp > 0 && P.lv < lim) {
        suction = true;
        imp *= Math.max(0.15, P.lv / lim);
      }
    }
  }

  // ECMO
  let ecmo = 0;
  let chatter = false;
  if (d.ecmo?.on) {
    ecmo = ecmoPumpFlow(d.ecmo.rpm, pSA - P.sv);
    if (ecmo > 0 && P.sv < 2) {
      chatter = true;
      ecmo *= Math.max(0.2, P.sv / 2);
    }
  }

  // inertial root → systemic flow
  const dq = (P.root - pSA - R_C * s.qRoot) / (p.lAo ?? L_AO);
  const qRoot = s.qRoot + dq * dt;

  const qSys = (pSA - P.sv) / p.rsys;
  const qPul = (P.pa - P.pv) / p.rpul;

  const ns: SimState = {
    t: s.t + dt,
    vLV: s.vLV + (mv + arLeak + arReg - av - imp - mrLeak - mrReg) * dt,
    vRV: s.vRV + (tv - pvf) * dt,
    vRoot: s.vRoot + (av + imp - qRoot - arLeak - arReg) * dt,
    vSA: s.vSA + (qRoot - qSys + ecmo - bronch) * dt,
    vSV: s.vSV + (qSys - tv - ecmo) * dt,
    vPA: s.vPA + (pvf - qPul) * dt,
    vPV: s.vPV + (qPul - mv + mrLeak + mrReg + bronch) * dt,
    qRoot,
    beat: s.beat,
    beatT: s.beatT + dt,
  };
  if (p.lAv) {
    ns.qAv = qAv;
    ns.avBack = avBack;
  }
  if (ns.beatT >= rr) {
    ns.beatT -= rr;
    ns.beat += 1;
  }
  Object.assign(s, ns);
  const F: Flows = { av, mv, tv, pv: pvf, impella: imp, ecmo, balloon: bal };
  if (p.mrConductance || p.arConductance) {
    F.mr = mrReg;
    F.ar = arReg;
  }
  return { P: { ...P, sa: pSA }, F, suction, chatter };
}

/** Initial state distributing the stressed volume at plausible pressures. */
export function initialState(p: Patient): SimState {
  const s: SimState = {
    t: 0,
    vLV: p.lv.v0 + 110,
    vRV: p.rv.v0 + 120,
    vRoot: 0,
    vSA: 0,
    vSV: 0,
    vPA: 0,
    vPV: 0,
    qRoot: 0,
    beat: 0,
    beatT: 0,
  };
  const rest = p.stressed - 110 - 120;
  // proportions of the remaining stressed volume
  s.vRoot = rest * 0.012;
  s.vSA = rest * 0.17;
  s.vSV = rest * 0.6;
  s.vPA = rest * 0.08;
  s.vPV = rest * 0.138;
  return s;
}

// ---------------------------------------------------------------------------
// Beat statistics
// ---------------------------------------------------------------------------
export interface BeatStats {
  sys: number;
  dia: number;
  map: number;
  lvSys: number;
  lvedp: number;
  edv: number;
  esv: number;
  /** forward flow through the aortic valve (L/min) */
  nativeCO: number;
  impellaFlow: number;
  ecmoFlow: number;
  totalFlow: number;
  cvp: number;
  paSys: number;
  paDia: number;
  paMean: number;
  pcwp: number;
  /** did the aortic valve open this beat? */
  avOpen: boolean;
  pulsePressure: number;
  cpo: number;
  papi: number;
  suction: boolean;
  chatter: boolean;
  /** IABP-specific */
  augDiastolic?: number;
  assistedEdp?: number;
}

export class BeatAccumulator {
  private reset() {
    this.n = 0;
    this.sumSA = 0;
    this.maxSA = -Infinity;
    this.minSA = Infinity;
    this.maxLV = -Infinity;
    this.maxV = -Infinity;
    this.minV = Infinity;
    this.sumAV = 0;
    this.sumImp = 0;
    this.sumEcmo = 0;
    this.sumSV = 0;
    this.maxPA = -Infinity;
    this.minPA = Infinity;
    this.sumPA = 0;
    this.sumPV = 0;
    this.lvedp = 0;
    this.suction = false;
    this.chatter = false;
    this.maxBalloonP = -Infinity;
  }
  n = 0;
  sumSA = 0;
  maxSA = -Infinity;
  minSA = Infinity;
  maxLV = -Infinity;
  maxV = -Infinity;
  minV = Infinity;
  sumAV = 0;
  sumImp = 0;
  sumEcmo = 0;
  sumSV = 0;
  maxPA = -Infinity;
  minPA = Infinity;
  sumPA = 0;
  sumPV = 0;
  lvedp = 0;
  suction = false;
  chatter = false;
  maxBalloonP = -Infinity;
  last: BeatStats | null = null;

  add(info: StepInfo, s: SimState, dt: number) {
    const { P, F } = info;
    this.n++;
    this.sumSA += P.sa;
    this.maxSA = Math.max(this.maxSA, P.sa);
    this.minSA = Math.min(this.minSA, P.sa);
    this.maxLV = Math.max(this.maxLV, P.lv);
    this.maxV = Math.max(this.maxV, s.vLV);
    this.minV = Math.min(this.minV, s.vLV);
    this.sumAV += F.av * dt;
    this.sumImp += F.impella * dt;
    this.sumEcmo += F.ecmo * dt;
    this.sumSV += P.sv;
    this.maxPA = Math.max(this.maxPA, P.pa);
    this.minPA = Math.min(this.minPA, P.pa);
    this.sumPA += P.pa;
    this.sumPV += P.pv;
    this.lvedp = P.lv; // overwritten until end of beat → pressure just before the next R wave
    if (F.balloon > 0) this.maxBalloonP = Math.max(this.maxBalloonP, P.sa);
    this.suction ||= info.suction;
    this.chatter ||= info.chatter;
  }

  /** Close the beat; rr in seconds. */
  close(rr: number): BeatStats {
    const n = Math.max(1, this.n);
    const map = this.sumSA / n;
    const nativeCO = (this.sumAV / rr) * 0.06;
    const impellaFlow = (this.sumImp / rr) * 0.06;
    const ecmoFlow = (this.sumEcmo / rr) * 0.06;
    const cvp = this.sumSV / n;
    const paMean = this.sumPA / n;
    const total = nativeCO + impellaFlow + ecmoFlow;
    const stats: BeatStats = {
      sys: this.maxSA,
      dia: this.minSA,
      map,
      lvSys: this.maxLV,
      lvedp: this.lvedp,
      edv: this.maxV,
      esv: this.minV,
      nativeCO,
      impellaFlow,
      ecmoFlow,
      totalFlow: total,
      cvp,
      paSys: this.maxPA,
      paDia: this.minPA,
      paMean,
      pcwp: this.sumPV / n,
      avOpen: this.sumAV > 1,
      pulsePressure: this.maxSA - this.minSA,
      cpo: (map * total) / 451,
      papi: (this.maxPA - this.minPA) / Math.max(1, cvp),
      suction: this.suction,
      chatter: this.chatter,
      augDiastolic: Number.isFinite(this.maxBalloonP) ? this.maxBalloonP : undefined,
    };
    this.last = stats;
    this.reset();
    return stats;
  }
}

// ---------------------------------------------------------------------------
// Simulation runner
// ---------------------------------------------------------------------------
export const DT = 0.0004;

export class Circulation {
  s: SimState;
  acc = new BeatAccumulator();
  stats: BeatStats | null = null;
  history: BeatStats[] = [];
  lastInfo: StepInfo | null = null;
  constructor(
    public patient: Patient,
    public devices: Devices = {}
  ) {
    this.s = initialState(patient);
  }

  /** Run for `seconds` of model time, calling `sample` at ~250 Hz. */
  run(seconds: number, sample?: (t: number, info: StepInfo, s: SimState) => void) {
    const n = Math.round(seconds / DT);
    let nextSample = this.s.t;
    for (let i = 0; i < n; i++) {
      const beatBefore = this.s.beat;
      const info = step(this.patient, this.devices, this.s, DT);
      this.lastInfo = info;
      this.acc.add(info, this.s, DT);
      if (this.s.beat !== beatBefore) {
        this.stats = this.acc.close(60 / this.patient.hr);
        this.history.push(this.stats);
        if (this.history.length > 60) this.history.shift();
      }
      if (sample && this.s.t >= nextSample) {
        sample(this.s.t, info, this.s);
        nextSample += 0.004;
      }
    }
  }

  /** Average of the last k beats (smooths 1:2 / 1:3 assist and respiration-free noise). */
  average(k = 3): BeatStats | null {
    const h = this.history.slice(-k);
    if (h.length === 0) return null;
    const avg = (f: (b: BeatStats) => number) => h.reduce((a, b) => a + f(b), 0) / h.length;
    const last = h[h.length - 1];
    return {
      ...last,
      sys: avg((b) => b.sys),
      dia: avg((b) => b.dia),
      map: avg((b) => b.map),
      lvSys: avg((b) => b.lvSys),
      lvedp: avg((b) => b.lvedp),
      edv: avg((b) => b.edv),
      esv: avg((b) => b.esv),
      nativeCO: avg((b) => b.nativeCO),
      impellaFlow: avg((b) => b.impellaFlow),
      ecmoFlow: avg((b) => b.ecmoFlow),
      totalFlow: avg((b) => b.totalFlow),
      cvp: avg((b) => b.cvp),
      paSys: avg((b) => b.paSys),
      paDia: avg((b) => b.paDia),
      paMean: avg((b) => b.paMean),
      pcwp: avg((b) => b.pcwp),
      pulsePressure: avg((b) => b.pulsePressure),
      cpo: avg((b) => b.cpo),
      papi: avg((b) => b.papi),
      avOpen: h.some((b) => b.avOpen),
      suction: h.some((b) => b.suction),
      chatter: h.some((b) => b.chatter),
    };
  }
}

// ---------------------------------------------------------------------------
// Oxygenation with VA-ECMO: where does native and circuit blood go?
// ---------------------------------------------------------------------------
export interface Oxygenation {
  nativeSat: number; // blood leaving the lungs
  circuitSat: number; // blood leaving the oxygenator
  rightRadialSat: number; // reflects coronary and cerebral supply
  lowerBodySat: number;
  /** where native and circuit flows meet */
  mixingZone: "aortic root" | "arch" | "descending aorta" | "no native ejection";
  paco2: number;
}

export function oxygenation(p: Patient, stats: BeatStats, d: Devices): Oxygenation {
  // pulmonary oedema worsens gas exchange as the left atrial pressure climbs
  const oedema = Math.max(0, (stats.pcwp - 22) / 20);
  const shunt = Math.min(0.75, p.shunt + 0.3 * oedema);
  const nativeSat = Math.max(0.55, 0.98 - 0.45 * shunt);
  const e = d.ecmo?.on ? d.ecmo : undefined;
  const ecmoFlow = Math.max(0, stats.ecmoFlow);
  const circuitSat = e ? (e.fdo2 >= 0.5 ? 1.0 : 0.88 + 0.24 * (e.fdo2 - 0.21)) : nativeSat;
  const native = stats.nativeCO + stats.impellaFlow;
  let mixingZone: Oxygenation["mixingZone"];
  let rightRadialSat: number;
  if (!e || ecmoFlow < 0.2) {
    mixingZone = "aortic root";
    rightRadialSat = nativeSat;
  } else if (native < 0.3) {
    mixingZone = "no native ejection";
    rightRadialSat = circuitSat;
  } else {
    const f = native / (native + ecmoFlow);
    mixingZone = f > 0.5 ? "descending aorta" : f > 0.3 ? "arch" : "aortic root";
    const nativeShare = f > 0.5 ? 1 : f > 0.3 ? 0.5 + (f - 0.3) * 2.5 : f;
    rightRadialSat = nativeShare * nativeSat + (1 - nativeShare) * circuitSat;
  }
  const total = native + ecmoFlow;
  const lowerBodySat = total > 0 ? (native * nativeSat * 0.3 + ecmoFlow * circuitSat + native * 0.7 * nativeSat) / total : nativeSat;
  const paco2 = e ? Math.max(22, Math.min(80, 80 / (1 + 0.6 * e.sweep))) : 40 + 25 * shunt;
  return { nativeSat, circuitSat, rightRadialSat, lowerBodySat, mixingZone, paco2 };
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------
export const NORMAL_PATIENT: Patient = {
  hr: 70,
  lv: { ees: 2.0, v0: 10, p0: 0.17, lambda: 0.028 },
  rv: { ees: 0.6, v0: 10, p0: 0.25, lambda: 0.02 },
  rsys: 1.0,
  rpul: 0.07,
  stressed: 860,
  shunt: 0.02,
  rhythm: "sinus",
};

export const PATIENTS = {
  normal: NORMAL_PATIENT,
  /** large anterior infarct: poor LV contractility, vasoconstricted, volume-loaded */
  lvShock: {
    ...NORMAL_PATIENT,
    hr: 105,
    lv: { ees: 0.4, v0: 15, p0: 0.17, lambda: 0.027 },
    rv: { ees: 0.3, v0: 10, p0: 0.25, lambda: 0.02 },
    rsys: 1.25,
    stressed: 1350,
    shunt: 0.08,
  } as Patient,
  /** biventricular failure */
  biv: {
    ...NORMAL_PATIENT,
    hr: 110,
    lv: { ees: 0.4, v0: 15, p0: 0.17, lambda: 0.027 },
    rv: { ees: 0.13, v0: 15, p0: 0.25, lambda: 0.02 },
    rsys: 1.2,
    stressed: 1700,
    shunt: 0.1,
  } as Patient,
  /** cardiac arrest (VF) */
  arrest: {
    ...NORMAL_PATIENT,
    hr: 75,
    lv: { ees: 0.4, v0: 15, p0: 0.17, lambda: 0.027 },
    rhythm: "vf",
    stressed: 1500,
    shunt: 0.15,
  } as Patient,
  /** LV recovering on VA-ECMO, lungs still poor (oedema/ARDS) */
  recovering: {
    ...NORMAL_PATIENT,
    hr: 95,
    lv: { ees: 1.1, v0: 15, p0: 0.17, lambda: 0.027 },
    rv: { ees: 0.45, v0: 10, p0: 0.25, lambda: 0.02 },
    rsys: 1.1,
    stressed: 1500,
    shunt: 0.55,
  } as Patient,
};
