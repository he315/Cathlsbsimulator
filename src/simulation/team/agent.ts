// ---------------------------------------------------------------------------
// Agent core: the shared machinery every team member and the patient use.
//
// - One deterministic timeline. Everything an agent will do later (finish a
//   sentence, come back with a catheter, report an ACT) is a Timer in plain
//   data, so the whole team snapshots to JSON and replays exactly (S11 rewind).
// - A speech queue per role: an agent says one thing at a time. A sentence
//   starts after a response latency, never before the agent's previous
//   sentence has ended, and lasts words / speaking rate (model parameters).
// - Memory per role (plain key-value data) for perception state such as
//   "damped trace seen since t" or "last time this topic was mentioned".
// - Telemetry in the S1 TelemetryEvent shape for S11 (recorder, debrief).
// ---------------------------------------------------------------------------

import { createBus, type Bus } from "../../input/bus";
import { SeededRng } from "../patient/rng";
import type { PatientEngine } from "../patient/engine";
import type { TelemetryEvent } from "../session/types";
import { TEAM_PARAMS } from "./params";
import type {
  CArmPort,
  ImagingView,
  InputPort,
  Order,
  PreparedSyringe,
  RoleId,
  TableItem,
  TablePort,
  TeamAction,
  Utterance,
  UtteranceKind,
  WarnTopic,
} from "./types";

/** The S9 engine calls the team uses (PatientEngine satisfies it). */
export type PatientPort = Pick<
  PatientEngine,
  | "give"
  | "startInfusion"
  | "stopInfusion"
  | "fluid"
  | "measureAct"
  | "startNibp"
  | "setNibpInterval"
  | "silenceAlarms"
  | "holdBreath"
  | "charge"
  | "clearForShock"
  | "shock"
  | "setCpr"
  | "vitals"
  | "profile"
  | "transducer"
  | "clockState"
>;

export type TeamParams = { -readonly [K in keyof typeof TEAM_PARAMS]: (typeof TEAM_PARAMS)[K] extends readonly [number, number] ? [number, number] : number };

export interface TeamOptions {
  seed?: string | number;
  /** time of day at session start, for read-backs ("given at 10:32"); default now */
  startClock?: Date;
  patient?: PatientPort | null;
  input?: InputPort | null;
  carm?: CArmPort | null;
  table?: TablePort | null;
  /** imaging state for the radiographer's answers */
  imaging?: (() => ImagingView) | null;
  /** coronary side the catheter is in, for intracoronary doses given without a side */
  catheterSide?: (() => "left" | "right" | null) | null;
  /** who looks after sedation and the airway: a sedation nurse (default) or an anaesthetist */
  sedationRole?: "sedation-nurse" | "anaesthetist";
  /** team members call out alarms, damping, sats and thresholds unprompted (default true) */
  callouts?: boolean;
  /** the physiologist waits for the operator to open the manifold to air before zeroing (default false: the physiologist does it) */
  zeroNeedsTap?: boolean;
  /** the radiographer resets the five-minute screening signal unprompted (default true) */
  autoTimerReset?: boolean;
  params?: Partial<TeamParams>;
}

export interface Timer {
  at: number;
  seq: number;
  kind: string;
  role: RoleId;
  data: Record<string, unknown>;
}

/** An event the operator should have warned the patient about. */
export interface WarnableEvent {
  t: number;
  event: "adenosine" | "inflation" | "contrast-warmth" | "puncture" | "cocktail";
  warned: boolean;
  topic?: WarnTopic;
  warnedAt?: number;
}

export interface Finding {
  t: number;
  severity: "safety" | "technique" | "communication";
  code: string;
  text: string;
}

export interface TeamState {
  t: number;
  seq: number;
  rng: number;
  nextId: number;
  utterances: Utterance[];
  orders: Order[];
  timers: Timer[];
  busyUntil: Record<RoleId, number>;
  items: TableItem[];
  syringes: PreparedSyringe[];
  warnings: { t: number; topic: WarnTopic }[];
  warnable: WarnableEvent[];
  findings: Finding[];
  /** per-role perception memory */
  memory: Record<string, number | string | boolean | null>;
  lastRole: RoleId | null;
  events: TelemetryEvent[];
}

export interface TeamEvents {
  utterance: Utterance;
  action: TeamAction;
  order: Order;
  telemetry: TelemetryEvent;
}

const ROLES: RoleId[] = ["operator", "scrub", "radiographer", "physiologist", "sedation", "patient"];

export type TimerHandler = (core: TeamCore, timer: Timer) => void;

export class TeamCore {
  readonly bus: Bus<TeamEvents> = createBus<TeamEvents>();
  readonly opts: TeamOptions;
  readonly P: TeamParams;
  st: TeamState;
  protected rngObj: SeededRng;
  private handlers = new Map<string, TimerHandler>();
  private startMs: number;

  constructor(o: TeamOptions = {}) {
    this.opts = o;
    this.P = { ...(TEAM_PARAMS as unknown as TeamParams), ...(o.params ?? {}) };
    this.rngObj = new SeededRng(o.seed ?? 1);
    this.startMs = (o.startClock ?? new Date()).getTime();
    this.st = {
      t: 0,
      seq: 0,
      rng: this.rngObj.state,
      nextId: 1,
      utterances: [],
      orders: [],
      timers: [],
      busyUntil: Object.fromEntries(ROLES.map((r) => [r, 0])) as Record<RoleId, number>,
      items: [],
      syringes: [],
      warnings: [],
      warnable: [],
      findings: [],
      memory: {},
      lastRole: null,
      events: [],
    };
    this.handle("say", (core, tm) => core.deliver(tm));
  }

  // --- ports ------------------------------------------------------------------------
  get patient(): PatientPort | null {
    return this.opts.patient ?? null;
  }

  // --- randomness (state lives in st.rng so snapshots replay) ------------------------
  rand(lo: number, hi: number): number {
    this.rngObj.state = this.st.rng;
    const v = this.rngObj.range(lo, hi);
    this.st.rng = this.rngObj.state;
    return v;
  }
  chance(p: number): boolean {
    return p > 0 && this.rand(0, 1) < p;
  }
  pick<T>(a: readonly T[]): T {
    return a[Math.min(a.length - 1, Math.floor(this.rand(0, a.length)))];
  }
  id(): number {
    return this.st.nextId++;
  }

  // --- time ---------------------------------------------------------------------------
  get t(): number {
    return this.st.t;
  }
  /** Time of day at session time t, "10:32". */
  clock(t = this.st.t): string {
    const d = new Date(this.startMs + t * 1000);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  latency(role: RoleId): number {
    const r = role === "patient" ? this.P.patientRespondS : this.P.respondS;
    return this.rand(r[0], r[1]);
  }
  durationOf(text: string): number {
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(0.4, words / this.P.wordsPerS);
  }

  // --- timers ---------------------------------------------------------------------------
  handle(kind: string, fn: TimerHandler) {
    this.handlers.set(kind, fn);
  }
  schedule(at: number, kind: string, role: RoleId, data: Record<string, unknown> = {}): Timer {
    const tm: Timer = { at: Math.max(at, this.st.t), seq: this.st.seq++, kind, role, data };
    this.st.timers.push(tm);
    return tm;
  }
  cancelTimers(pred: (tm: Timer) => boolean) {
    this.st.timers = this.st.timers.filter((tm) => !pred(tm));
  }

  /** Run every timer due by the current time, in time order (timers added while running are included). */
  protected runTimers() {
    for (let guard = 0; guard < 10000; guard++) {
      let best = -1;
      for (let i = 0; i < this.st.timers.length; i++) {
        const tm = this.st.timers[i];
        if (tm.at > this.st.t + 1e-9) continue;
        if (best < 0) best = i;
        else {
          const b = this.st.timers[best];
          if (tm.at < b.at || (tm.at === b.at && tm.seq < b.seq)) best = i;
        }
      }
      if (best < 0) return;
      const tm = this.st.timers.splice(best, 1)[0];
      const fn = this.handlers.get(tm.kind);
      if (fn) fn(this, tm);
    }
  }

  // --- speech ----------------------------------------------------------------------------

  /**
   * Queue a sentence for a role. Returns the time it will have finished, so follow-on actions
   * can be scheduled after it. The operator's own speech is logged immediately.
   */
  say(
    role: RoleId,
    text: string,
    kind: UtteranceKind,
    o: { to?: RoleId | "team"; orderId?: number; urgent?: boolean; delay?: number; after?: number } = {}
  ): number {
    const dur = this.durationOf(text);
    if (role === "operator") {
      this.deliver({ at: this.st.t, seq: this.st.seq++, kind: "say", role, data: { text, kind, to: o.to, orderId: o.orderId, dur } });
      return this.st.t;
    }
    const lat = o.delay ?? (o.urgent ? this.latency(role) * 0.5 : this.latency(role));
    const start = Math.max(this.st.t + lat, this.st.busyUntil[role], o.after ?? 0);
    this.st.busyUntil[role] = start + dur;
    this.schedule(start, "say", role, { text, kind, to: o.to, orderId: o.orderId, urgent: o.urgent, dur });
    return start + dur;
  }

  private deliver(tm: Timer) {
    const d = tm.data as { text: string; kind: UtteranceKind; to?: RoleId | "team"; orderId?: number; urgent?: boolean; dur: number };
    const u: Utterance = {
      id: this.id(),
      t: tm.at,
      clock: this.clock(tm.at),
      speaker: tm.role,
      to: d.to,
      kind: d.kind,
      text: d.text,
      durS: d.dur,
      orderId: d.orderId,
      urgent: d.urgent || undefined,
    };
    this.st.utterances.push(u);
    if (this.st.utterances.length > 600) this.st.utterances.splice(0, this.st.utterances.length - 600);
    if (d.kind === "readback" && d.orderId !== undefined) {
      const o = this.order(d.orderId);
      if (o) {
        o.readbackAt = tm.at;
        o.readbackText = d.text;
        this.bus.emit("order", o);
      }
    }
    this.telemetry("team.utterance", { id: u.id, speaker: u.speaker, to: u.to ?? null, kind: u.kind, text: u.text, orderId: u.orderId ?? null });
    this.bus.emit("utterance", u);
  }

  // --- orders -----------------------------------------------------------------------------
  order(id: number): Order | undefined {
    return this.st.orders.find((o) => o.id === id);
  }
  updateOrder(o: Order, patch: Partial<Order>) {
    Object.assign(o, patch);
    this.telemetry("team.order", { id: o.id, role: o.role, status: o.status, intent: o.heard.k, raw: o.raw });
    this.bus.emit("order", o);
  }

  // --- world --------------------------------------------------------------------------------
  act(a: TeamAction) {
    this.bus.emit("action", a);
  }
  mem(key: string, fallback: number): number;
  mem(key: string, fallback: boolean): boolean;
  mem(key: string, fallback: string): string;
  mem<T extends number | string | boolean | null>(key: string, fallback: T): T;
  mem(key: string, fallback: number | string | boolean | null): number | string | boolean | null {
    return key in this.st.memory ? this.st.memory[key] : fallback;
  }
  setMem(key: string, v: number | string | boolean | null) {
    this.st.memory[key] = v;
  }
  finding(severity: Finding["severity"], code: string, text: string) {
    this.st.findings.push({ t: this.st.t, severity, code, text });
    this.telemetry("team.finding", { severity, code, text });
  }

  telemetry(kind: string, data: Record<string, unknown> = {}) {
    let tPatient = this.st.t;
    try {
      tPatient = this.patient?.clockState().t ?? this.st.t;
    } catch {
      tPatient = this.st.t;
    }
    const ev: TelemetryEvent = { tWall: this.st.t, tPatient, kind, data };
    this.st.events.push(ev);
    if (this.st.events.length > 2000) this.st.events.splice(0, this.st.events.length - 2000);
    this.bus.emit("telemetry", ev);
  }

  /** Team telemetry since the last call (S11 recorder). */
  drainEvents(): TelemetryEvent[] {
    const e = this.st.events;
    this.st.events = [];
    return e;
  }

  /** Words for the patient's sex. */
  pronoun(): { he: string; him: string; his: string } {
    const sex = this.patient?.profile.sex;
    return sex === "F" ? { he: "she", him: "her", his: "her" } : sex === "M" ? { he: "he", him: "him", his: "his" } : { he: "they", him: "them", his: "their" };
  }

  sedationTitle(): string {
    return this.opts.sedationRole === "anaesthetist" ? "anaesthetist" : "sedation nurse";
  }
}

/** Label for a role in captions. */
export function roleLabel(role: RoleId, sedationRole: "sedation-nurse" | "anaesthetist" = "sedation-nurse"): string {
  switch (role) {
    case "operator":
      return "You";
    case "scrub":
      return "Scrub nurse";
    case "radiographer":
      return "Radiographer";
    case "physiologist":
      return "Physiologist";
    case "sedation":
      return sedationRole === "anaesthetist" ? "Anaesthetist" : "Sedation nurse";
    case "patient":
      return "Patient";
  }
}
