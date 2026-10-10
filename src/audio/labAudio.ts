// ---------------------------------------------------------------------------
// LabAudio: everything a lab hears, driven by events.
//
//   S8 input bus   pedal   -> exposure tone (fluoroscopy / cine)
//                  syringe -> syringe hiss and plunger squeak
//   S9 engine      clock R waves + SpO2 -> pulse tone (monitorTone.ts)
//                  vitals().alarms      -> alarm bursts by priority (alarms.ts)
//                  defib.charge / defib.shock telemetry -> defibrillator sounds
//   S6 dose        dose.fluoro-5min     -> five-minute screening signal
//   C4 team        utterances -> voices; timer-reset -> signal off
//   lab calls      setInjection / setPowerInjector / setIndeflator / click
//
// Nothing plays until AudioEngine.unlock() has run inside a user gesture.
// Per frame the lab calls frame() after engine.advance(). The pedal release
// reaches the exposure tone inside the input event, so the tone starts to
// fall before the next frame.
// ---------------------------------------------------------------------------

import type { InputBus } from "../input/bus";
import type { Bus } from "../input/bus";
import type { PatientEngine } from "../simulation/patient/engine";
import { MP_DEFIB } from "../simulation/patient/rhythm";
import type { TelemetryEvent } from "../simulation/session/types";
import type { TeamEvents } from "../simulation/team/agent";
import { AlarmPlayer } from "./alarms";
import type { AudioEngine } from "./engine";
import { PulseToneScheduler } from "./monitorTone";
import { TeamVoices } from "./speech";
import { click, DefibSound, ExposureTone, FiveMinuteSignal, IndeflatorSound, PowerInjectorSound, SyringeSound, type ClickKind, type ExposureMode } from "./sounds";

export type AudioPatientPort = Pick<PatientEngine, "clockState" | "vitals">;

export interface LabAudioOptions {
  /** speech for team utterances (default: local voices when the browser has them; null: none) */
  voices?: TeamVoices | null;
}

export class LabAudio {
  readonly pulse: PulseToneScheduler;
  readonly alarms: AlarmPlayer;
  readonly exposure: ExposureTone;
  readonly fiveMin: FiveMinuteSignal;
  readonly syringe: SyringeSound;
  readonly injector: PowerInjectorSound;
  readonly indeflator: IndeflatorSound;
  readonly defib: DefibSound;
  readonly voices: TeamVoices | null;
  private patient: AudioPatientPort | null = null;
  private hostExposure = false;
  private hostInjection = false;
  private imaging = { highLevel: false, fluoroPps: 15, cinePps: 15 };
  private pedal = { fluoro: false, cine: false };
  private offs: (() => void)[] = [];

  constructor(
    readonly engine: AudioEngine,
    o: LabAudioOptions = {}
  ) {
    this.pulse = new PulseToneScheduler(engine);
    this.alarms = new AlarmPlayer(engine);
    this.exposure = new ExposureTone(engine);
    this.fiveMin = new FiveMinuteSignal(engine);
    this.syringe = new SyringeSound(engine);
    this.injector = new PowerInjectorSound(engine);
    this.indeflator = new IndeflatorSound(engine);
    this.defib = new DefibSound(engine);
    this.voices =
      o.voices === undefined
        ? new TeamVoices(
            () => engine.gainOf("voices") ** 0.5,
            () => engine.getSettings().voiceName,
            () => (this.patient as { profile?: { sex?: "M" | "F" } } | null)?.profile?.sex ?? null
          )
        : o.voices;
    this.pulse.source = engine.getSettings().pulseSource;
    this.offs.push(engine.onChange((s) => (this.pulse.source = s.pulseSource)));
  }

  setPatient(p: AudioPatientPort | null) {
    this.patient = p;
    this.pulse.reset();
  }

  // --- S8 input bus -------------------------------------------------------------------

  attachInput(bus: InputBus): () => void {
    const a = bus.on("pedal", (p) => {
      this.pedal = { fluoro: p.fluoro, cine: p.cine };
      if (!this.hostExposure) this.applyPedals();
    });
    const b = bus.on("syringe", (s) => {
      if (!this.hostInjection) this.syringe.update({ force: s.force, aspirate: s.port === "aspirate" });
    });
    const off = () => {
      a();
      b();
    };
    this.offs.push(off);
    return off;
  }

  private applyPedals() {
    const mode: ExposureMode = this.pedal.cine ? "cine" : this.pedal.fluoro ? "fluoro" : "off";
    this.exposure.set(mode, { highLevel: this.imaging.highLevel, pps: mode === "cine" ? this.imaging.cinePps : this.imaging.fluoroPps });
  }

  // --- team ------------------------------------------------------------------------------

  attachTeam(team: { bus: Bus<TeamEvents> }): () => void {
    const a = team.bus.on("utterance", (u) => {
      if (u.speaker !== "operator") this.voices?.speak({ speaker: u.speaker, text: u.text, urgent: u.urgent });
    });
    const b = team.bus.on("action", (x) => {
      if (x.a === "timer-reset") this.fiveMin.reset();
      else if (x.a === "item-delivered" || x.a === "item-replaced") click(this.engine, "device");
      else if (x.a === "protocol" && x.fluoroLevel) this.setImaging({ fluoroLevel: x.fluoroLevel });
    });
    const c = team.bus.on("telemetry", (ev) => {
      if (ev.kind === "team.defib-disarm") this.defib.disarm();
    });
    const off = () => {
      a();
      b();
      c();
    };
    this.offs.push(off);
    return off;
  }

  // --- lab calls --------------------------------------------------------------------------

  /** Engine and dose telemetry (the same array the lab passes to the team and the recorder). */
  onTelemetry(events: readonly TelemetryEvent[]) {
    for (const ev of events) {
      if (ev.kind === "dose.fluoro-5min") this.fiveMin.start();
      else if (ev.kind === "defib.charge") this.defib.charging(MP_DEFIB.chargeTimeS);
      else if (ev.kind === "defib.shock") {
        if (ev.data?.outcome !== "not-charged") this.defib.shock();
      }
    }
  }

  /** The imaging chain's actual state. Once called, the exposure tone follows it instead of the raw pedals. */
  setExposure(mode: ExposureMode, o: { highLevel?: boolean; pps?: number } = {}) {
    this.hostExposure = true;
    this.exposure.set(mode, { highLevel: o.highLevel ?? this.imaging.highLevel, pps: o.pps });
  }

  /** Acquisition settings the pedal-driven tone needs (high-level signal, cine frame clicks). */
  setImaging(o: { fluoroLevel?: "low" | "normal" | "high"; fluoroPps?: number; cinePps?: number }) {
    if (o.fluoroLevel) this.imaging.highLevel = o.fluoroLevel === "high";
    if (o.fluoroPps) this.imaging.fluoroPps = o.fluoroPps;
    if (o.cinePps) this.imaging.cinePps = o.cinePps;
    if (!this.hostExposure) this.applyPedals();
  }

  /** Hand injection from the I1 Injector (force 0..1, flow mL/s, pressure psi). Takes over from the bus. */
  setInjection(o: { force: number; flowMlS: number; psi: number; aspirate?: boolean }) {
    this.hostInjection = true;
    this.syringe.update(o);
  }

  setPowerInjector(o: { flowMlS: number; armed?: boolean }) {
    this.injector.update(o);
  }

  /** Inflation device pressure (atm), every frame while it is in use. */
  setIndeflator(atm: number) {
    this.indeflator.update(atm);
  }
  indeflatorLock() {
    this.indeflator.lock();
  }
  indeflatorRelease() {
    this.indeflator.release();
  }

  click(kind: ClickKind) {
    click(this.engine, kind);
  }

  /** Per frame, after engine.advance(). */
  frame() {
    if (!this.engine.ctx) return;
    const p = this.patient;
    if (p) {
      const v = p.vitals();
      this.pulse.frame({ clock: p.clockState(), spo2: v.spo2, arrested: v.hr === null });
      this.alarms.frame({ alarms: v.alarms, tPatient: v.t, silencedUntil: v.alarmsSilencedUntil });
    }
    this.exposure.frame();
    this.defib.frame();
  }

  dispose() {
    for (const off of this.offs) off();
    this.offs = [];
    this.alarms.stop();
    this.exposure.dispose();
    this.fiveMin.dispose();
    this.syringe.dispose();
    this.injector.dispose();
    this.defib.dispose();
    this.voices?.dispose();
  }
}
