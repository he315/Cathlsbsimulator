// ---------------------------------------------------------------------------
// The lab's exposure loop: dose-rate controller, dose tracker and run
// bookkeeping, without a clock of its own.
//
// sceneBuilder's LabImaging owns a CardiacClock. The diagnostic lab shell has
// one patient (S9 PatientEngine) that owns the clock and drives the pressure
// traces, the ECG and the image together, so this loop takes the patient time
// from the caller instead. Breathing is the patient's too: the operator asks for
// a breath-hold (a command), cine does not hold the breath by itself.
// The run and meter bookkeeping mirrors LabImaging (wave2/I1.md, step 1).
// ---------------------------------------------------------------------------

import { Adrc, type AdrcSettings, type AdrcState } from "../../render/xray/adrc";
import { MU } from "../../render/xray/thorax";
import type { MeterReading } from "../../render/xray/XrayRenderer";
import type { SceneResult } from "../../render/xray/sceneBuilder";
import { DoseTracker, bodyFromAnat, DEFAULT_OPERATOR, type OperatorSetup } from "../dose";
import type { CArm } from "../../types";

/** Longest beam-on step booked for one frame (s); a stalled tab must not book seconds of dose at once. Model parameter (as LabImaging). */
const MAX_EXPOSE_STEP_S = 0.2;
/** Longest idle step (s). Model parameter (as LabImaging). */
const MAX_IDLE_STEP_S = 2;

export interface ExposureFrame {
  framesSinceStart: number;
  adrc: Adrc;
  exposure: Partial<AdrcSettings>;
  meter: { waterCm: number } | null;
  meteredWaterCm: number | null;
}

export class ExposureLoop {
  readonly adrc = new Adrc();
  readonly dose = new DoseTracker();
  /** exposure settings (fluoroscopy level, pulse rates, grid) */
  exposure: Partial<AdrcSettings> = { fluoroLevel: "normal", fluoroPps: 15, cinePps: 15, grid: true };
  operator: OperatorSetup = { ...DEFAULT_OPERATOR };
  /** latest controller state (technique, dose rates) for display */
  lastExposure: AdrcState | null = null;
  private run: { mode: "fluoro" | "cine"; frames: number } | null = null;
  private lastReading: MeterReading | null = null;
  private meteredCm: number | null = null;
  private lastExposeWall: number | null = null;

  /** Exposed frames in the current run (-1 with the beam off). */
  get runFrames(): number {
    return this.run ? this.run.frames : -1;
  }

  get runMode(): "fluoro" | "cine" | null {
    return this.run?.mode ?? null;
  }

  /** Inputs for an exposed frame in `mode`: run frame, controller, a new meter reading if any. */
  frame(mode: "fluoro" | "cine", xr: { lastMeter: MeterReading | null } | null): ExposureFrame {
    if (!this.run || this.run.mode !== mode) this.run = { mode, frames: 0 };
    else this.run.frames++;
    const r = xr?.lastMeter ?? null;
    if (this.run.frames === 0) this.meteredCm = null;
    const fresh = !!r && r !== this.lastReading && this.run.frames > 0;
    if (fresh) this.meteredCm = -Math.log(Math.max(1e-6, r!.primaryTransmission)) / (MU.soft * 10);
    const meter = fresh && this.meteredCm !== null ? { waterCm: this.meteredCm } : null;
    this.lastReading = r;
    return { framesSinceStart: this.run.frames, adrc: this.adrc, exposure: this.exposure, meter, meteredWaterCm: this.meteredCm };
  }

  /** Book an exposed frame's dose (after buildXrayScene and render). */
  expose(res: Pick<SceneResult, "exposure" | "iso" | "params" | "scene">, cArm: CArm, fieldMm: number, nowMs: number, tPatient: number) {
    const pps = res.exposure.pps || 15;
    const dt = this.lastExposeWall === null ? 1 / pps : Math.min(MAX_EXPOSE_STEP_S, Math.max(0, (nowMs - this.lastExposeWall) / 1000));
    this.lastExposeWall = nowMs;
    this.lastExposure = res.exposure;
    this.dose.expose({
      adrc: res.exposure,
      dtS: dt,
      geometry: { cArm, iso: res.iso, fieldMm, shutters: res.params.shutters },
      body: bodyFromAnat(res.scene.anat[0]),
      operator: this.operator,
      tPatient,
    });
  }

  /** The beam is off (pedal released): the next exposure starts a new run. */
  beamOff(nowMs: number) {
    this.run = null;
    if (this.lastExposeWall !== null) {
      this.dose.idle(Math.min(MAX_IDLE_STEP_S, Math.max(0, (nowMs - this.lastExposeWall) / 1000)));
      this.lastExposeWall = null;
    }
  }
}
