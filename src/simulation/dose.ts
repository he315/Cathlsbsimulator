// ---------------------------------------------------------------------------
// Patient and operator dose bookkeeping for the cath lab.
//
// Per exposure step (one rendered frame of fluoroscopy or cine) this module adds:
//   - reference air kerma Ka,r at the interventional reference point (IRP), from
//     the ADRC's air kerma per pulse (adrc.ts) times the pulses delivered;
//   - kerma-area product KAP = Ka,r x collimated beam area at the IRP;
//   - fluoroscopy time, cine frames and runs, fluoro and cine kept separate;
//   - a skin-dose map on the patient's body surface, indexed by beam entrance
//     position, with inverse square to each skin point, table and mattress
//     attenuation (with the oblique-incidence factor), backscatter and the
//     air-to-tissue f-factor (Jones and Pasciak 2011 method);
//   - a relative operator scatter dose for the eyes and the legs, scaled by C-arm
//     angulation (Kuon et al. 2004), table height and operator position (inverse
//     square) and shielding (ceiling shield, table skirt).
// It also raises the regulatory and follow-up signals: the audible 5-minute
// fluoroscopy signal (21 CFR 1020.32(h)(2)(ii)) and the substantial radiation dose
// levels in docs/SIM_FACTS.md item 23 (Ka,r 5 Gy, KAP 500 Gy cm2, peak skin dose
// 3 Gy, fluoroscopy time 60 min). Sources: docs/realism/facts/S6.md.
//
// Coordinates follow sceneBuilder: x = patient left, y = head, z = anterior (mm).
// ---------------------------------------------------------------------------

import type { CArm, Vec3 } from "../types";
import type { Snapshotable, TelemetryEvent } from "./session/types";
import { cameraBasis } from "./projection";
import {
  BODY_CENTRE_Z_MM,
  BODY_HALF_X_MM,
  BODY_HALF_Z_MM,
  IRP_FROM_ISO_MM,
  PATH_MODEL,
  SID_MM,
  SOD_MM,
  steadyState,
  tableTransmission,
  type AdrcLimit,
  type AdrcMode,
  type AdrcState,
} from "../render/xray/adrc";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Substantial radiation dose levels (SIM_FACTS item 23; NCRP 168 as adapted, Jaschke 2017 Table 2). */
export const DOSE_TRIGGERS = {
  karMGy: 5000,
  kapGyCm2: 500,
  fluoroMin: 60,
  peakSkinMGy: 3000,
} as const;

/** 21 CFR 1020.32(h)(2)(ii): an audible signal for each 5 minutes of fluoroscopy. */
export const FLUORO_SIGNAL_INTERVAL_S = 300;

/** 21 CFR 1020.32(k)(1): the air kerma rate display updates at least once per second. */
export const AKR_WINDOW_S = 1;

/**
 * Air-to-soft-tissue f-factor by kVp, fluoroscopy and acquisition columns
 * (Jones and Pasciak 2011, Table 4).
 */
const F_KV = [60, 65, 70, 75, 85, 95];
const F_FLUORO = [1.061, 1.063, 1.065, 1.066, 1.068, 1.069];
const F_ACQ = [1.056, 1.058, 1.059, 1.061, 1.063, 1.066];

/**
 * Model parameter: backscatter factor for skin dose. Jones and Pasciak 2011 give the method
 * (PSD = ESAK x BSF x f) and plot BSF against beam quality and field size; the plotted values
 * could not be read as numbers, so a single representative 1.35 is used.
 */
export const BACKSCATTER_FACTOR = 1.35;

/**
 * Operator scatter per unit KAP against LAO/RAO angle, relative to PA, from Kuon et al.
 * (JACC 2004): toward LAO 100 the patient's DAP rate rose 3.7x and the operator's dose 10.6x;
 * toward RAO 100, 3.7x and 2.4x. Per unit KAP: 2.86 at LAO 100 and 0.65 at RAO 100.
 * Cranio-caudal angulation raised both by about 2.5x, so it carries no extra operator factor.
 * The exponential-in-sine shape between PA and the 100 degree end points is a model choice.
 */
export const OPERATOR_SIDE = {
  laoAt100: 10.6 / 3.7,
  raoAt100: 2.4 / 3.7,
};

/**
 * Shield transmissions for operator scatter.
 * ceiling: Jia et al. (phantom), cited by Crowhurst et al. (J Med Radiat Sci 2026): a ceiling
 *   suspended shield cut operator exposure by 76.8-93.5%; the midpoint (85%) is used.
 * tableSkirt: model parameter (0.5 mm Pb-equivalent material transmits about 5% of scatter per
 *   Miller et al. 2026; 10% allows for gaps in coverage).
 * apron: 0.5 mm garments transmit 5% of fluoroscopic scatter (Miller et al. 2026), used for the
 *   under-apron body index.
 */
export const SHIELD_TRANSMISSION = { ceiling: 0.15, tableSkirt: 0.1, apron: 0.05 } as const;

/**
 * Model parameters: operator reference points relative to the isocentre in the room frame
 * (x toward the patient's left, y toward the head, z up = anterior for a supine patient), mm.
 * The operator stands on the patient's right; eye level 55 cm above the isocentre; legs
 * 60 cm below it. Femoral access stands further toward the feet than radial access.
 */
export const OPERATOR_POINTS = {
  femoral: { eye: { x: -550, y: -500, z: 550 }, legs: { x: -450, y: -500, z: -600 } },
  radial: { eye: { x: -550, y: -300, z: 550 }, legs: { x: -450, y: -300, z: -600 } },
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PatientBody {
  /** body cylinder axis position (x, z) and long-axis extent, world mm */
  cx: number;
  cz: number;
  /** half axes of the cross-section (mm) */
  a: number;
  b: number;
}

/**
 * Body cross-section from the habitus scale used by thorax.ts (bodyFrame: centre z -46,
 * half 176k x 126k), with the genome's optional lateral (width) and AP (depth) scales.
 * With a built thorax, prefer bodyFromAnat(thorax.anat[0]).
 */
export function bodyFromHabitus(habitus = 1, width = 1, depth = 1): PatientBody {
  return { cx: 0, cz: BODY_CENTRE_Z_MM, a: BODY_HALF_X_MM * habitus * width, b: BODY_HALF_Z_MM * habitus * depth };
}

/** Body cross-section from the thorax BODY shape ({ c, half } of thorax.anat[0]). */
export function bodyFromAnat(body: { c: Vec3; half: [number, number, number] }): PatientBody {
  return { cx: body.c.x, cz: body.c.z, a: body.half[0], b: body.half[2] };
}

export interface BeamGeometry {
  cArm: CArm;
  /** isocentre in patient (world) coordinates, mm (sceneBuilder's iso: tree centre + table pan) */
  iso: Vec3;
  /** detector field, full width (mm) */
  fieldMm: number;
  /** collimator shutters, fractions of the field from each edge (left, right, top, bottom), as ImageParams */
  shutters?: [number, number, number, number];
  sidMm?: number;
  sodMm?: number;
}

export interface OperatorSetup {
  access: "femoral" | "radial";
  ceilingShield: boolean;
  tableSkirt: boolean;
}

export const DEFAULT_OPERATOR: OperatorSetup = { access: "femoral", ceilingShield: true, tableSkirt: true };

export interface ExposureStep {
  /** the ADRC result for this frame (technique, air kerma per pulse, limit) */
  adrc: Pick<AdrcState, "kermaIrpPerPulseMGy" | "pps" | "technique" | "limit" | "akrFdaMGyMin" | "akrLimitMGyMin"> & {
    settings: { mode: AdrcMode };
  };
  /** seconds of beam-on time represented by this step */
  dtS: number;
  geometry: BeamGeometry;
  body?: PatientBody;
  operator?: OperatorSetup;
  /** patient clock (s), for telemetry */
  tPatient?: number;
}

export interface Split {
  fluoro: number;
  cine: number;
  total: number;
}

export interface DoseTotals {
  /** reference air kerma at the IRP (mGy) */
  karMGy: Split;
  /** kerma-area product (Gy cm2) */
  kapGyCm2: Split;
  fluoroTimeS: number;
  cineTimeS: number;
  fluoroPulses: number;
  cineFrames: number;
  cineRuns: number;
  /** highest cell of the skin-dose map (mGy) */
  peakSkinMGy: number;
  /** operator eye scatter, relative units (1 = unshielded PA reference eye dose per Gy cm2) */
  operatorEye: Split;
  /** operator leg scatter, relative units */
  operatorLegs: Split;
  /** operator trunk under a 0.5 mm apron, relative units */
  operatorBody: Split;
}

export interface DoseLive {
  beamOn: boolean;
  mode: AdrcMode | null;
  /** reference air kerma rate over the last second (mGy/min) */
  akrMGyMin: number;
  /** KAP rate over the last second (Gy cm2/min) */
  kapRateGyCm2Min: number;
  /** operator eye scatter rate relative to PA normal fluoroscopy of a standard patient, unshielded */
  operatorRateRel: number;
  /** beam area at the IRP (cm2) */
  areaIrpCm2: number;
  limit: AdrcLimit;
}

export interface SkinMap {
  /** columns around the body: angle psi from the posterior midline (0) toward the patient's left (+) */
  cols: number;
  rows: number;
  psi0Deg: number;
  dPsiDeg: number;
  y0Mm: number;
  dyMm: number;
  /** dose (mGy) row-major [row][col] */
  dose: Float32Array;
}

export interface DoseSnapshot {
  clock: number;
  totals: DoseTotals;
  map: number[];
  window: [number, number, number, number, number][];
  fluoroSignals: number;
  triggered: string[];
  run: RunState | null;
  limitAnnounced: boolean;
  lastBeamT: number;
  live: DoseLive;
  pending: TelemetryEvent[];
  /** patient-clock time of the last exposure (s), stamped on events; optional for older snapshots */
  tPatient?: number;
}

interface RunState {
  start: number;
  frames: number;
  kar: number;
  kap: number;
  kvSum: number;
  cArm: CArm;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Collimated beam area at the IRP (cm2). */
export function fieldAreaAtIrpCm2(fieldMm: number, shutters?: [number, number, number, number], sidMm = SID_MM, sodMm = SOD_MM): number {
  const [l, r, t, b] = shutters ?? [0, 0, 0, 0];
  const w = Math.max(0, 1 - l - r) * fieldMm;
  const h = Math.max(0, 1 - t - b) * fieldMm;
  const scale = (sodMm - IRP_FROM_ISO_MM) / sidMm;
  return (w * scale * (h * scale)) / 100;
}

/** f-factor (air kerma to soft-tissue dose) at a kVp (Jones and Pasciak 2011 Table 4). */
export function fFactor(kvp: number, mode: AdrcMode): number {
  const col = mode === "cine" ? F_ACQ : F_FLUORO;
  if (kvp <= F_KV[0]) return col[0];
  for (let i = 0; i < F_KV.length - 1; i++) {
    if (kvp <= F_KV[i + 1]) {
      const f = (kvp - F_KV[i]) / (F_KV[i + 1] - F_KV[i]);
      return col[i] + f * (col[i + 1] - col[i]);
    }
  }
  return col[col.length - 1];
}

/** Operator scatter per unit KAP relative to PA, by LAO (+) / RAO (-) angle (Kuon 2004 end points). */
export function operatorSideFactor(laoRaoDeg: number): number {
  const s = Math.sin((Math.min(100, Math.abs(laoRaoDeg)) * Math.PI) / 180) * Math.sign(laoRaoDeg);
  const s100 = Math.sin((100 * Math.PI) / 180);
  if (s >= 0) return Math.exp((Math.log(OPERATOR_SIDE.laoAt100) * s) / s100);
  return Math.exp((Math.log(OPERATOR_SIDE.raoAt100) * -s) / s100);
}

function dist2(a: Vec3, b: Vec3): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
}

/**
 * Inverse-square factors from the beam's entrance on the patient's back (for the current table
 * height and pan) to the operator's eye and legs, relative to the reference set-up: isocentre at
 * the body centre line with the back 15 cm below it (the IRP on the skin).
 */
export function operatorDistanceFactors(iso: Vec3, body: PatientBody, access: OperatorSetup["access"]): { eye: number; legs: number } {
  const pts = OPERATOR_POINTS[access];
  const back = body.cz - body.b;
  const entry = { x: iso.x, y: iso.y, z: back };
  const at = (o: Vec3) => ({ x: iso.x + o.x, y: iso.y + o.y, z: iso.z + o.z });
  const refIso = { x: iso.x, y: iso.y, z: back + IRP_FROM_ISO_MM };
  const refEntry = { x: iso.x, y: iso.y, z: back };
  const refAt = (o: Vec3) => ({ x: refIso.x + o.x, y: refIso.y + o.y, z: refIso.z + o.z });
  return {
    eye: dist2(refEntry, refAt(pts.eye)) / Math.max(1, dist2(entry, at(pts.eye))),
    legs: dist2(refEntry, refAt(pts.legs)) / Math.max(1, dist2(entry, at(pts.legs))),
  };
}

// ---------------------------------------------------------------------------
// Skin map
// ---------------------------------------------------------------------------

export const SKIN_COLS = 72; // 5 degrees
export const SKIN_ROWS = 54; // 10 mm
export const SKIN_Y0 = -290; // world y of the first row centre (mm)
export const SKIN_DY = 10;

function newMap(): SkinMap {
  return {
    cols: SKIN_COLS,
    rows: SKIN_ROWS,
    psi0Deg: -180 + 2.5,
    dPsiDeg: 360 / SKIN_COLS,
    y0Mm: SKIN_Y0,
    dyMm: SKIN_DY,
    dose: new Float32Array(SKIN_COLS * SKIN_ROWS),
  };
}

/**
 * Deposit skin dose for an exposure: kIrpMGy is the free-in-air air kerma at the IRP delivered in
 * this step. Returns the highest skin dose added to a cell (mGy).
 */
export function depositSkinDose(
  map: SkinMap,
  geo: BeamGeometry,
  body: PatientBody,
  kIrpMGy: number,
  kvp: number,
  cuMm: number,
  mode: AdrcMode,
): number {
  if (kIrpMGy <= 0) return 0;
  const sid = geo.sidMm ?? SID_MM;
  const sod = geo.sodMm ?? SOD_MM;
  const dIrp = sod - IRP_FROM_ISO_MM;
  const B = cameraBasis(geo.cArm);
  // source behind the patient along the viewing direction (as sceneBuilder.makeCamera)
  const S = { x: geo.iso.x + B.forward.x * sod, y: geo.iso.y + B.forward.y * sod, z: geo.iso.z + B.forward.z * sod };
  const d = { x: -B.forward.x, y: -B.forward.y, z: -B.forward.z };
  const half = geo.fieldMm / 2;
  const [sl, sr, stp, sb] = geo.shutters ?? [0, 0, 0, 0];
  const uMin = (2 * sl - 1) * half;
  const uMax = (1 - 2 * sr) * half;
  const vMin = (2 * sb - 1) * half;
  const vMax = (1 - 2 * stp) * half;
  const tableZ = body.cz - body.b;
  const scale = kIrpMGy * BACKSCATTER_FACTOR * fFactor(kvp, mode);
  let peak = 0;
  for (let c = 0; c < map.cols; c++) {
    const psi = ((map.psi0Deg + c * map.dPsiDeg) * Math.PI) / 180;
    const sp = Math.sin(psi);
    const cp = Math.cos(psi);
    const px = body.cx + body.a * sp;
    const pz = body.cz - body.b * cp;
    // outward normal of the elliptic cross-section
    const nx = sp / body.a;
    const nz = -cp / body.b;
    // facing the source?
    if (nx * (S.x - px) + nz * (S.z - pz) <= 0) continue;
    for (let r = 0; r < map.rows; r++) {
      const py = map.y0Mm + r * map.dyMm;
      const vx = px - S.x;
      const vy = py - S.y;
      const vz = pz - S.z;
      const w = vx * d.x + vy * d.y + vz * d.z;
      if (w <= 1) continue;
      const u = ((vx * B.right.x + vy * B.right.y + vz * B.right.z) / w) * sid;
      const v = ((vx * B.up.x + vy * B.up.y + vz * B.up.z) / w) * sid;
      if (u < uMin || u > uMax || v < vMin || v > vMax) continue;
      const r2 = vx * vx + vy * vy + vz * vz;
      let k = (scale * dIrp * dIrp) / r2;
      // table and mattress: the ray rises through the table plane inside its width
      if (S.z < tableZ - 1 && vz > 0) {
        const f = (tableZ - S.z) / vz;
        const xAt = S.x + vx * f;
        if (f <= 1.0001 && Math.abs(xAt - body.cx) < PATH_MODEL.TABLE_HALF_WIDTH_MM) {
          const sec = Math.sqrt(r2) / vz;
          k *= tableTransmission(kvp, cuMm, sec);
        }
      }
      const i = r * map.cols + c;
      map.dose[i] += k;
      if (k > peak) peak = k;
    }
  }
  return peak;
}

// ---------------------------------------------------------------------------
// Reference operator scatter rate (PA, standard patient, normal fluoroscopy 15 pps, 230 mm field)
// ---------------------------------------------------------------------------

let refOpRate: number | null = null;
function referenceOperatorKapRate(): number {
  if (refOpRate == null) {
    const st = steadyState({ mode: "fluoro", fluoroLevel: "normal", fluoroPps: 15, fieldMm: 230, grid: true }, 20);
    refOpRate = (st.kermaRateIrpMGyMin / 1000) * fieldAreaAtIrpCm2(230);
  }
  return refOpRate;
}

function zeroSplit(): Split {
  return { fluoro: 0, cine: 0, total: 0 };
}

function addSplit(s: Split, mode: AdrcMode, v: number) {
  s[mode] += v;
  s.total += v;
}

function zeroTotals(): DoseTotals {
  return {
    karMGy: zeroSplit(),
    kapGyCm2: zeroSplit(),
    fluoroTimeS: 0,
    cineTimeS: 0,
    fluoroPulses: 0,
    cineFrames: 0,
    cineRuns: 0,
    peakSkinMGy: 0,
    operatorEye: zeroSplit(),
    operatorLegs: zeroSplit(),
    operatorBody: zeroSplit(),
  };
}

function idleLive(): DoseLive {
  return { beamOn: false, mode: null, akrMGyMin: 0, kapRateGyCm2Min: 0, operatorRateRel: 0, areaIrpCm2: 0, limit: "none" };
}

// ---------------------------------------------------------------------------
// The tracker
// ---------------------------------------------------------------------------

export class DoseTracker implements Snapshotable<DoseSnapshot> {
  private clock = 0;
  private t = zeroTotals();
  private map = newMap();
  /** (start, end, kar, kap, operator eye) samples for the 1 s rate window */
  private win: [number, number, number, number, number][] = [];
  private fluoroSignals = 0;
  private triggered = new Set<string>();
  private run: RunState | null = null;
  private limitAnnounced = false;
  private lastBeamT = -1;
  private liveState: DoseLive = idleLive();
  private pending: TelemetryEvent[] = [];
  private tPatient = 0;

  get totals(): DoseTotals {
    return this.t;
  }

  get live(): DoseLive {
    return this.liveState;
  }

  get skinMap(): SkinMap {
    return this.map;
  }

  /** seconds since the tracker started (beam-on and idle time) */
  get time(): number {
    return this.clock;
  }

  /** Remove and return the telemetry events raised since the last call. */
  drainEvents(): TelemetryEvent[] {
    const e = this.pending;
    this.pending = [];
    return e;
  }

  /** Add one exposure step (a rendered frame with the pedal down). */
  expose(step: ExposureStep): void {
    const dt = Math.max(0, step.dtS);
    if (dt <= 0) return;
    const mode = step.adrc.settings.mode;
    const body = step.body ?? bodyFromHabitus(1);
    const op = step.operator ?? DEFAULT_OPERATOR;
    if (step.tPatient != null) this.tPatient = step.tPatient;
    this.clock += dt;

    // a cine run ends when the beam stops or the mode changes
    if (this.run && (mode !== "cine" || this.clock - dt - this.lastBeamT > 0.25)) this.endRun();
    if (this.clock - dt - this.lastBeamT > 0.25) this.limitAnnounced = false;
    this.lastBeamT = this.clock;

    const pulses = step.adrc.pps * dt;
    const kar = step.adrc.kermaIrpPerPulseMGy * pulses;
    const area = fieldAreaAtIrpCm2(step.geometry.fieldMm, step.geometry.shutters, step.geometry.sidMm, step.geometry.sodMm);
    const kap = (kar / 1000) * area;
    addSplit(this.t.karMGy, mode, kar);
    addSplit(this.t.kapGyCm2, mode, kap);
    if (mode === "fluoro") {
      const before = this.t.fluoroTimeS;
      this.t.fluoroTimeS += dt;
      this.t.fluoroPulses += pulses;
      const n = Math.floor(this.t.fluoroTimeS / FLUORO_SIGNAL_INTERVAL_S);
      if (n > this.fluoroSignals && before < n * FLUORO_SIGNAL_INTERVAL_S) {
        this.fluoroSignals = n;
        this.emit("dose.fluoro-5min", { fluoroMin: (n * FLUORO_SIGNAL_INTERVAL_S) / 60 });
      }
    } else {
      this.t.cineTimeS += dt;
      this.t.cineFrames += pulses;
      if (!this.run) {
        this.run = { start: this.clock - dt, frames: 0, kar: 0, kap: 0, kvSum: 0, cArm: { ...step.geometry.cArm } };
        this.t.cineRuns++;
      }
      this.run.frames += pulses;
      this.run.kar += kar;
      this.run.kap += kap;
      this.run.kvSum += step.adrc.technique.kvp * pulses;
    }

    // skin dose
    depositSkinDose(this.map, step.geometry, body, kar, step.adrc.technique.kvp, step.adrc.technique.cuMm, mode);
    let peak = 0;
    for (let i = 0; i < this.map.dose.length; i++) if (this.map.dose[i] > peak) peak = this.map.dose[i];
    this.t.peakSkinMGy = peak;

    // operator scatter
    const side = operatorSideFactor(step.geometry.cArm.laoRao);
    const dist = operatorDistanceFactors(step.geometry.iso, body, op.access);
    const eyeUnshielded = kap * side * dist.eye;
    const eye = eyeUnshielded * (op.ceilingShield ? SHIELD_TRANSMISSION.ceiling : 1);
    const legs = kap * side * dist.legs * (op.tableSkirt ? SHIELD_TRANSMISSION.tableSkirt : 1);
    // trunk: between eye and leg geometry, under the apron (always worn)
    const body0 = kap * side * Math.sqrt(dist.eye * dist.legs) * SHIELD_TRANSMISSION.apron;
    addSplit(this.t.operatorEye, mode, eye);
    addSplit(this.t.operatorLegs, mode, legs);
    addSplit(this.t.operatorBody, mode, body0);

    // live rates over the last second
    this.win.push([this.clock - dt, this.clock, kar, kap, eye]);
    while (this.win.length && this.win[0][1] <= this.clock - AKR_WINDOW_S + 1e-9) this.win.shift();
    // the samples kept cover [first start, now] exactly
    const span = Math.max(dt, this.clock - this.win[0][0]);
    let sk = 0;
    let sa = 0;
    let se = 0;
    for (const w of this.win) {
      sk += w[2];
      sa += w[3];
      se += w[4];
    }
    this.liveState = {
      beamOn: true,
      mode,
      akrMGyMin: (sk / span) * 60,
      kapRateGyCm2Min: (sa / span) * 60,
      operatorRateRel: (se / span) * 60 / referenceOperatorKapRate(),
      areaIrpCm2: area,
      limit: step.adrc.limit,
    };

    if ((step.adrc.limit === "akr" || step.adrc.limit === "akr-high") && !this.limitAnnounced) {
      this.limitAnnounced = true;
      this.emit("dose.akr-limit", { akrFdaMGyMin: step.adrc.akrFdaMGyMin, limitMGyMin: step.adrc.akrLimitMGyMin, mode });
    }
    this.checkTriggers();
  }

  /** Beam off for dt seconds (keeps the clock, closes runs and decays the live rate). */
  idle(dtS: number): void {
    const dt = Math.max(0, dtS);
    this.clock += dt;
    if (this.run && this.clock - this.lastBeamT > 0.25) this.endRun();
    if (this.clock - this.lastBeamT > 0.25) this.limitAnnounced = false;
    while (this.win.length && this.win[0][1] <= this.clock - AKR_WINDOW_S + 1e-9) this.win.shift();
    if (!this.win.length) this.liveState = { ...idleLive(), areaIrpCm2: this.liveState.areaIrpCm2 };
    else this.liveState = { ...this.liveState, beamOn: false };
  }

  reset(): void {
    this.clock = 0;
    this.t = zeroTotals();
    this.map = newMap();
    this.win = [];
    this.fluoroSignals = 0;
    this.triggered.clear();
    this.run = null;
    this.limitAnnounced = false;
    this.lastBeamT = -1;
    this.liveState = idleLive();
    this.pending = [];
    this.tPatient = 0;
  }

  snapshot(): DoseSnapshot {
    return {
      clock: this.clock,
      totals: JSON.parse(JSON.stringify(this.t)),
      map: Array.from(this.map.dose),
      window: this.win.map((w) => [...w] as [number, number, number, number, number]),
      fluoroSignals: this.fluoroSignals,
      triggered: [...this.triggered],
      run: this.run ? { ...this.run, cArm: { ...this.run.cArm } } : null,
      limitAnnounced: this.limitAnnounced,
      lastBeamT: this.lastBeamT,
      live: { ...this.liveState },
      pending: this.pending.map((e) => ({ ...e, data: e.data ? { ...e.data } : undefined })),
      tPatient: this.tPatient,
    };
  }

  restore(s: DoseSnapshot): void {
    this.clock = s.clock;
    this.t = JSON.parse(JSON.stringify(s.totals));
    this.map = newMap();
    this.map.dose.set(s.map);
    this.win = s.window.map((w) => [...w] as [number, number, number, number, number]);
    this.fluoroSignals = s.fluoroSignals;
    this.triggered = new Set(s.triggered);
    this.run = s.run ? { ...s.run, cArm: { ...s.run.cArm } } : null;
    this.limitAnnounced = s.limitAnnounced;
    this.lastBeamT = s.lastBeamT;
    this.liveState = { ...s.live };
    this.pending = s.pending.map((e) => ({ ...e, data: e.data ? { ...e.data } : undefined }));
    this.tPatient = s.tPatient ?? 0;
  }

  // -------------------------------------------------------------------------

  private emit(kind: string, data: Record<string, unknown>) {
    this.pending.push({ tWall: this.clock, tPatient: this.tPatient, kind, data });
  }

  private endRun() {
    const r = this.run;
    if (!r) return;
    this.run = null;
    this.emit("dose.cine-run", {
      frames: Math.round(r.frames),
      durationS: Math.max(0, this.lastBeamT - r.start),
      karMGy: r.kar,
      kapGyCm2: r.kap,
      meanKvp: r.frames > 0 ? r.kvSum / r.frames : 0,
      cArm: r.cArm,
    });
  }

  private checkTriggers() {
    const check = (id: string, value: number, threshold: number) => {
      if (value >= threshold && !this.triggered.has(id)) {
        this.triggered.add(id);
        this.emit("dose.trigger", { metric: id, value, threshold });
      }
    };
    check("kar", this.t.karMGy.total, DOSE_TRIGGERS.karMGy);
    check("kap", this.t.kapGyCm2.total, DOSE_TRIGGERS.kapGyCm2);
    check("fluoroTime", this.t.fluoroTimeS / 60, DOSE_TRIGGERS.fluoroMin);
    check("peakSkin", this.t.peakSkinMGy, DOSE_TRIGGERS.peakSkinMGy);
  }
}

/** Fractions of the follow-up trigger levels reached (for progress bars and debrief). */
export function triggerFractions(t: DoseTotals): { kar: number; kap: number; fluoroTime: number; peakSkin: number } {
  return {
    kar: t.karMGy.total / DOSE_TRIGGERS.karMGy,
    kap: t.kapGyCm2.total / DOSE_TRIGGERS.kapGyCm2,
    fluoroTime: t.fluoroTimeS / 60 / DOSE_TRIGGERS.fluoroMin,
    peakSkin: t.peakSkinMGy / DOSE_TRIGGERS.peakSkinMGy,
  };
}
