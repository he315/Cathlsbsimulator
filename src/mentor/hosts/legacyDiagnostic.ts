// ---------------------------------------------------------------------------
// A ReplayHost over the current (legacy) diagnostic engagement model:
// engagement.ts dynamics, pressure.ts, contrast.ts and the CardiacClock. It
// mirrors the event logic of useSimulatorStore (LV entry, damping, air
// embolism, conus VF, wall trauma and dissection) in a deterministic,
// snapshotable form, so a diagnostic case can be recorded, replayed, scrubbed
// and branched before the S7 rod worker lands. When S7 delivers its
// Snapshotable worker, a composite host replaces this one; the mentor code
// depends only on the ReplayHost contract.
//
// Trauma rates and thresholds are the store's own model parameters, copied so
// the two agree; they are not literature values.
// ---------------------------------------------------------------------------

import type { AnatomyCase, CArm, Difficulty, EngagementState, PressureState } from "../../types";
import { buildAnatomy, type AnatomyModel } from "../../simulation/anatomy";
import { catheterById } from "../../data/catheters";
import { computeEngagement, computeTip, initialControls, stepDynamics, type ControlState, type TipState } from "../../simulation/engagement";
import { computePressure } from "../../simulation/pressure";
import { injectContrast } from "../../simulation/contrast";
import { CardiacClock } from "../../simulation/clock/cardiacClock";
import { DAMPED_KINDS, ENGAGEMENT_KINDS, PRESSURE_KINDS, type FrameSample, type HostCommand, type HostEvent, type ReplayHost } from "../types";

export interface LegacyHostOptions {
  caseData: AnatomyCase;
  difficulty?: Difficulty;
  catheterId?: string;
  /** cardiac clock seed and heart rate */
  seed?: number;
  hr?: number;
}

export interface LegacyHostState {
  catheterId: string;
  controls: ControlState;
  cArm: CArm;
  field: number;
  pps: number;
  fluoro: boolean;
  cine: boolean;
  cineStartT: number;
  injectT: number;
  contrastMl: number;
  fluoroS: number;
  aspirated: "unknown" | "clean" | "no-return";
  trauma: number;
  dissection: boolean;
  vf: boolean;
  syringe: number;
  clock: ReturnType<CardiacClock["snapshot"]>;
  engKind: string;
  pressKind: string;
  wasOverPush: boolean;
}

const MOTION_EPS = 1e-3;

export class LegacyDiagnosticHost implements ReplayHost<LegacyHostState> {
  readonly caseData: AnatomyCase;
  readonly model: AnatomyModel;
  readonly difficulty: Difficulty;
  private s: LegacyHostState;
  private clock: CardiacClock;
  private events: HostEvent[] = [];
  private tip!: TipState;
  private eng!: EngagementState;
  private press!: PressureState;

  constructor(o: LegacyHostOptions) {
    this.caseData = o.caseData;
    this.model = buildAnatomy(o.caseData);
    this.difficulty = o.difficulty ?? "intermediate";
    this.clock = new CardiacClock({ hr: o.hr ?? 72, seed: o.seed ?? 1 });
    this.s = {
      catheterId: o.catheterId ?? o.caseData.recommendedCatheters[0] ?? "JL4",
      controls: initialControls(),
      cArm: { laoRao: 0, cranialCaudal: 0 },
      field: 25,
      pps: 15,
      fluoro: false,
      cine: false,
      cineStartT: 0,
      injectT: -1,
      contrastMl: 0,
      fluoroS: 0,
      aspirated: "unknown",
      trauma: 0,
      dissection: false,
      vf: false,
      syringe: 0,
      clock: this.clock.snapshot(),
      engKind: "",
      pressKind: "",
      wasOverPush: false,
    };
    this.derive();
    this.s.engKind = this.eng.kind;
    this.s.pressKind = this.press.kind;
  }

  private cath() {
    const c = catheterById(this.s.catheterId);
    if (!c) throw new Error(`unknown catheter ${this.s.catheterId}`);
    return c;
  }

  private derive() {
    const cath = this.cath();
    this.tip = computeTip(this.model, cath, this.s.controls);
    this.eng = computeEngagement(this.model, cath, this.s.controls, this.difficulty);
    const p = computePressure(this.eng, this.tip, this.s.controls, cath);
    this.press = this.s.dissection ? { kind: "dissected", systolic: Math.min(p.systolic, 88), diastolic: Math.max(p.diastolic, 60), quality: 0.4, warning: "danger", label: "Dissection" } : p;
  }

  private emit(kind: string, data?: Record<string, unknown>) {
    this.events.push({ kind, data });
  }

  private transitions() {
    if (this.eng.kind !== this.s.engKind) {
      this.emit("engagement", { from: this.s.engKind, to: this.eng.kind, side: this.eng.target ?? undefined, conus: this.eng.conus || undefined });
      this.s.engKind = this.eng.kind;
    }
    if (this.press.kind !== this.s.pressKind) {
      this.emit("pressure", { from: this.s.pressKind, to: this.press.kind, sys: this.press.systolic, dia: this.press.diastolic });
      this.s.pressKind = this.press.kind;
    }
  }

  // --- commands ---------------------------------------------------------------

  apply(cmd: HostCommand): void {
    const s = this.s;
    switch (cmd.kind) {
      case "push":
        if (cmd.device === "catheter") s.controls = { ...s.controls, cmdInsertion: s.controls.cmdInsertion + cmd.mm };
        else if (cmd.device === "wire035") s.controls = { ...s.controls, wireInsertion: Math.max(0, s.controls.wireInsertion + cmd.mm) };
        break;
      case "torque":
        if (cmd.device === "catheter") s.controls = { ...s.controls, cmdTorque: s.controls.cmdTorque + cmd.rad };
        break;
      case "pedal": {
        if (cmd.pedal.fluoro !== s.fluoro) this.emit(cmd.pedal.fluoro ? "fluoro-on" : "fluoro-off");
        if (cmd.pedal.cine && !s.cine) {
          s.cineStartT = this.clock.state().t;
          s.injectT = -1;
          this.emit("cine-start", { laoRao: s.cArm.laoRao, cranCaud: s.cArm.cranialCaudal });
        } else if (!cmd.pedal.cine && s.cine) {
          const t = this.clock.state().t;
          this.emit("cine-end", {
            laoRao: s.cArm.laoRao,
            cranCaud: s.cArm.cranialCaudal,
            durationS: round3(t - s.cineStartT),
            injectStartS: s.injectT >= 0 ? round3(s.injectT - s.cineStartT) : undefined,
            rr: round3(this.clock.state().rr),
          });
        }
        s.fluoro = cmd.pedal.fluoro;
        s.cine = cmd.pedal.cine;
        break;
      }
      case "syringe": {
        s.syringe = cmd.syringe.port === "aspirate" ? -1 : cmd.syringe.force;
        if (cmd.syringe.port === "aspirate") this.aspirate();
        else if (cmd.syringe.port === "contrast" && cmd.syringe.force > 0) this.inject(cmd.ml ?? 7);
        break;
      }
      case "carm":
        s.cArm = { ...cmd.cArm };
        this.emit("view", { laoRao: s.cArm.laoRao, cranCaud: s.cArm.cranialCaudal });
        break;
      case "imaging":
        if (cmd.field !== undefined) s.field = cmd.field;
        if (cmd.pps !== undefined) s.pps = cmd.pps;
        break;
      case "device":
        if (cmd.slot === "catheter" && cmd.id !== s.catheterId && catheterById(cmd.id)) {
          const prev = s.catheterId;
          s.catheterId = cmd.id;
          s.controls = initialControls();
          s.aspirated = "unknown";
          this.emit("catheter", { id: cmd.id, previous: prev, side: catheterById(cmd.id)?.target });
        }
        break;
      case "action":
        if (cmd.name === "pressure-check") this.emit("pressure-check", { kind: this.press.kind });
        else if (cmd.name === "defibrillate" && s.vf) {
          s.vf = false;
          this.clock.setRhythm("sinus");
          this.emit("bailout", { action: "defibrillate" });
        } else if (cmd.name === "relax") s.controls = { ...s.controls, cmdTorque: s.controls.torque, cmdInsertion: s.controls.insertion, windup: 0, forwardPressure: 0 };
        break;
      default:
        break;
    }
    this.derive();
    this.transitions();
  }

  private aspirate() {
    const p = this.press;
    const e = this.eng;
    const clean = !e.isDeep && !e.conus && e.kind !== "in-lv" && this.tip.cram < 4 && !DAMPED_KINDS.includes(p.kind) && p.kind !== "lv";
    this.s.aspirated = clean ? "clean" : "no-return";
    this.emit("aspirate", { result: this.s.aspirated });
  }

  private inject(ml: number) {
    const s = this.s;
    const e = this.eng;
    const p = this.press;
    const base = { ml, pressure: p.kind, engagement: e.kind, aspirated: s.aspirated, side: e.target ?? undefined };
    s.contrastMl += ml;
    s.injectT = this.clock.state().t;
    if (e.conus) {
      s.vf = true;
      this.clock.setRhythm("vf");
      this.emit("inject", { ...base, outcome: "conus", diagnostic: false });
      this.emit("complication", { kind: "vf" });
    } else {
      const risky = e.isDeep || this.tip.cram > 4 || DAMPED_KINDS.includes(p.kind);
      if (s.aspirated !== "clean" && risky) {
        this.emit("inject", { ...base, outcome: "air", diagnostic: false });
        this.emit("complication", { kind: "air-embolism" });
      } else {
        const r = injectContrast(e, p, this.model, { volume: ml });
        this.emit("inject", { ...base, outcome: r.outcome, diagnostic: r.diagnostic, fill: round3(r.fillOpacity), filledVessels: r.filledVessels });
      }
    }
    s.aspirated = "unknown";
  }

  // --- time --------------------------------------------------------------------

  step(dt: number): void {
    const s = this.s;
    const cath = this.cath();
    const c = s.controls;
    const motion =
      Math.abs(c.cmdTorque - c.torque) > MOTION_EPS ||
      Math.abs(c.cmdInsertion - c.insertion) > MOTION_EPS ||
      Math.abs(c.vTorque) > MOTION_EPS ||
      Math.abs(c.vInsertion) > MOTION_EPS ||
      c.whip > MOTION_EPS;
    if (motion) {
      const r = stepDynamics(c, cath, this.model, dt);
      s.controls = r.controls;
      if (r.whipReleased) this.emit("whip", { magnitude: round3(r.controls.whip) });
      const over = r.controls.forwardPressure > 3;
      if (over && !s.wasOverPush) this.emit("mistake", { code: "too-much-pushing" });
      s.wasOverPush = over;
      s.aspirated = "unknown";
    }
    this.derive();
    // wall trauma and dissection (store model parameters)
    if (!s.dissection) {
      const contact = Math.max(0, Math.min(1, this.tip.cram / 6));
      const push = s.controls.forwardPressure;
      const aggro = 0.6 + cath.behaviour.deepEngagementRisk;
      let rate = 0;
      if (push > 0.6 && contact > 0.2) rate += contact * push * 0.16 * aggro;
      if (this.eng.isDeep) rate += 0.06 * aggro;
      if (this.eng.kind === "in-lv" && push > 0.6) rate += push * 0.05 * aggro;
      rate += s.controls.whip * contact * 0.5;
      s.trauma = rate > 0 ? Math.min(1.4, s.trauma + rate * dt) : Math.max(0, s.trauma - 0.06 * dt);
      if (s.trauma >= 1) {
        s.dissection = true;
        this.derive();
        this.emit("complication", { kind: "dissection" });
      }
    }
    this.transitions();
    this.clock.advance(dt);
    if (s.fluoro || s.cine) s.fluoroS += dt;
    if (s.syringe > 0) s.syringe = 0;
  }

  sample(): Omit<FrameSample, "tWall" | "step"> {
    const s = this.s;
    const cs = this.clock.state();
    const e = this.eng;
    return {
      tPatient: cs.t,
      tFluoro: s.fluoroS,
      cmdInsertion: s.controls.cmdInsertion,
      insertion: s.controls.insertion,
      cmdTorque: s.controls.cmdTorque,
      torque: s.controls.torque,
      wireInsertion: s.controls.wireInsertion,
      tipX: this.tip.pos.x,
      tipY: this.tip.pos.y,
      tipZ: this.tip.pos.z,
      tipHeight: this.tip.height,
      tipAz: this.tip.az,
      depth: e.depth,
      eng: Math.max(0, ENGAGEMENT_KINDS.indexOf(e.kind)),
      press: Math.max(0, PRESSURE_KINDS.indexOf(this.press.kind)),
      sys: this.press.systolic,
      dia: this.press.diastolic,
      resistance: s.controls.resistance,
      laoRao: s.cArm.laoRao,
      cranCaud: s.cArm.cranialCaudal,
      field: s.field,
      pps: s.pps,
      beam: s.cine ? 2 : s.fluoro ? 1 : 0,
      syringe: s.syringe,
      contrastMl: s.contrastMl,
      karMGy: 0,
      kapGyCm2: 0,
      hr: cs.hr,
      wireTipMm: NaN,
      deviceMm: NaN,
    };
  }

  drainEvents(): HostEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  snapshot(): LegacyHostState {
    return JSON.parse(JSON.stringify({ ...this.s, clock: this.clock.snapshot() })) as LegacyHostState;
  }

  restore(st: LegacyHostState): void {
    this.s = JSON.parse(JSON.stringify(st)) as LegacyHostState;
    this.clock.restore(this.s.clock);
    this.events = [];
    this.derive();
  }

  /** Live state for mentor context building. */
  get engagement(): EngagementState {
    return this.eng;
  }
  get pressure(): PressureState {
    return this.press;
  }
  get tipState(): TipState {
    return this.tip;
  }
  get state(): Readonly<LegacyHostState> {
    return this.s;
  }
}

function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}
