// ---------------------------------------------------------------------------
// Procedure recorder.
//
// Records a case at 10 Hz into quantised columns (FrameTable), plus the
// discrete events, the full command log, the dt sequence of every simulation
// step (run-length encoded) and host snapshots at decision points. With a
// deterministic ReplayHost, the commands plus the dt sequence plus the first
// snapshot reproduce the case exactly (see replay.ts).
//
// Storage: tip pose and catheter travel are Int16 at 0.01 mm (error <= 0.005 mm),
// angles at 0.001 rad or 0.01 degrees, times and dose as Float32. One frame is
// 73 bytes; a 10-minute case at 10 Hz is about 440 kB of frames. The last
// MAX_STORED attempts are kept in IndexedDB through src/utils/idb.ts.
//
// Wall time and patient time are both kept: wall time orders what the learner
// did (beam-off time included); patient time aligns with the cardiac clock.
// ---------------------------------------------------------------------------

import { idbStore, trimStore } from "../utils/idb";
import type {
  FrameKey,
  FrameSample,
  HostCommand,
  RecordedCommand,
  RecordedEvent,
  RecordingMeta,
  ReplayHost,
  SnapshotRecord,
} from "./types";

// --- Column layout -------------------------------------------------------------

type ColKind = "f32" | "i16" | "u8" | "u32";
interface ColSpec {
  kind: ColKind;
  /** physical value = stored integer × scale (integer kinds) */
  scale?: number;
  /** NaN is stored as the Int16 minimum (i16 only) */
  nan?: boolean;
}

const I16_MIN = -32768;
const I16_MAX = 32767;

/** Layout of a frame. Resolutions are recording choices, not physical constants. */
export const FRAME_COLUMNS: Record<FrameKey, ColSpec> = {
  tWall: { kind: "f32" },
  tPatient: { kind: "f32" },
  tFluoro: { kind: "f32" },
  step: { kind: "u32" },
  cmdInsertion: { kind: "i16", scale: 0.01 },
  insertion: { kind: "i16", scale: 0.01 },
  cmdTorque: { kind: "i16", scale: 0.002 },
  torque: { kind: "i16", scale: 0.002 },
  wireInsertion: { kind: "i16", scale: 0.01 },
  tipX: { kind: "i16", scale: 0.01 },
  tipY: { kind: "i16", scale: 0.01 },
  tipZ: { kind: "i16", scale: 0.01 },
  tipHeight: { kind: "i16", scale: 0.01 },
  tipAz: { kind: "i16", scale: 0.001 },
  depth: { kind: "i16", scale: 0.01 },
  eng: { kind: "u8" },
  press: { kind: "u8" },
  sys: { kind: "i16", scale: 0.1 },
  dia: { kind: "i16", scale: 0.1 },
  resistance: { kind: "i16", scale: 0.001 },
  laoRao: { kind: "i16", scale: 0.01 },
  cranCaud: { kind: "i16", scale: 0.01 },
  field: { kind: "i16", scale: 0.1 },
  pps: { kind: "i16", scale: 0.1 },
  beam: { kind: "u8" },
  syringe: { kind: "i16", scale: 0.001 },
  contrastMl: { kind: "i16", scale: 0.1 },
  karMGy: { kind: "f32" },
  kapGyCm2: { kind: "f32" },
  hr: { kind: "i16", scale: 0.1 },
  wireTipMm: { kind: "i16", scale: 0.01, nan: true },
  deviceMm: { kind: "i16", scale: 0.01, nan: true },
};

export const FRAME_KEYS = Object.keys(FRAME_COLUMNS) as FrameKey[];

const BYTES: Record<ColKind, number> = { f32: 4, i16: 2, u8: 1, u32: 4 };
export const BYTES_PER_FRAME = FRAME_KEYS.reduce((a, k) => a + BYTES[FRAME_COLUMNS[k].kind], 0);

type Col = Float32Array | Int16Array | Uint8Array | Uint32Array;

function alloc(kind: ColKind, n: number): Col {
  switch (kind) {
    case "f32":
      return new Float32Array(n);
    case "i16":
      return new Int16Array(n);
    case "u8":
      return new Uint8Array(n);
    case "u32":
      return new Uint32Array(n);
  }
}

function encode(spec: ColSpec, v: number): number {
  if (spec.kind === "f32") return v;
  if (!Number.isFinite(v)) return spec.nan ? I16_MIN : 0;
  const q = Math.round(v / (spec.scale ?? 1));
  if (spec.kind === "i16") return Math.max(spec.nan ? I16_MIN + 1 : I16_MIN, Math.min(I16_MAX, q));
  if (spec.kind === "u8") return Math.max(0, Math.min(255, q));
  return Math.max(0, Math.min(0xffffffff, q));
}

function decode(spec: ColSpec, raw: number): number {
  if (spec.kind === "f32") return raw;
  if (spec.nan && raw === I16_MIN) return NaN;
  return raw * (spec.scale ?? 1);
}

/** A blank sample (all zeros, NaN for optional PCI positions). */
export function emptyFrame(): FrameSample {
  const f = {} as FrameSample;
  for (const k of FRAME_KEYS) (f as unknown as Record<string, number>)[k] = FRAME_COLUMNS[k].nan ? NaN : 0;
  return f;
}

export interface SerializedFrames {
  n: number;
  cols: Record<string, Col>;
}

/** Growable, quantised, column-oriented frame store. */
export class FrameTable {
  private n = 0;
  private cap: number;
  private cols: Record<FrameKey, Col>;

  constructor(capacity = 1024) {
    this.cap = Math.max(16, capacity);
    this.cols = {} as Record<FrameKey, Col>;
    for (const k of FRAME_KEYS) this.cols[k] = alloc(FRAME_COLUMNS[k].kind, this.cap);
  }

  get length(): number {
    return this.n;
  }

  private grow() {
    this.cap *= 2;
    for (const k of FRAME_KEYS) {
      const next = alloc(FRAME_COLUMNS[k].kind, this.cap);
      next.set(this.cols[k] as never);
      this.cols[k] = next;
    }
  }

  push(f: FrameSample): void {
    if (this.n >= this.cap) this.grow();
    for (const k of FRAME_KEYS) this.cols[k][this.n] = encode(FRAME_COLUMNS[k], f[k]);
    this.n++;
  }

  get(i: number): FrameSample {
    const out = {} as FrameSample;
    for (const k of FRAME_KEYS) (out as unknown as Record<string, number>)[k] = decode(FRAME_COLUMNS[k], this.cols[k][i]);
    return out;
  }

  /** One decoded value. */
  value(i: number, k: FrameKey): number {
    return decode(FRAME_COLUMNS[k], this.cols[k][i]);
  }

  /** A decoded column (copy). */
  column(k: FrameKey): Float64Array {
    const out = new Float64Array(this.n);
    const spec = FRAME_COLUMNS[k];
    const c = this.cols[k];
    for (let i = 0; i < this.n; i++) out[i] = decode(spec, c[i]);
    return out;
  }

  /** Index of the last frame with tWall <= t (0 if t is before the first frame). */
  indexAt(t: number): number {
    const c = this.cols.tWall;
    let lo = 0;
    let hi = this.n - 1;
    if (hi < 0) return -1;
    if (t <= c[0]) return 0;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (c[mid] <= t) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  /** The first `n` frames as a new table. */
  slice(n: number): FrameTable {
    const t = new FrameTable(Math.max(16, n));
    for (const k of FRAME_KEYS) t.cols[k].set(this.cols[k].subarray(0, n) as never);
    t.n = Math.min(n, this.n);
    return t;
  }

  serialize(): SerializedFrames {
    const cols: Record<string, Col> = {};
    for (const k of FRAME_KEYS) cols[k] = this.cols[k].slice(0, this.n) as Col;
    return { n: this.n, cols };
  }

  static from(s: SerializedFrames): FrameTable {
    const t = new FrameTable(Math.max(16, s.n));
    for (const k of FRAME_KEYS) {
      const src = s.cols[k];
      if (src) t.cols[k].set(src as never);
      else if (FRAME_COLUMNS[k].nan) t.cols[k].fill(I16_MIN as never, 0, s.n);
    }
    t.n = s.n;
    return t;
  }

  bytes(): number {
    return this.n * BYTES_PER_FRAME;
  }
}

// --- The dt sequence, run-length encoded ------------------------------------------

export interface SerializedSteps {
  dt: Float64Array;
  count: Uint32Array;
}

/** Run-length encoded dt list with random access by step index. */
export class StepLog {
  private dts: number[] = [];
  private counts: number[] = [];
  private cum: number[] = []; // steps before run i
  private total = 0;

  get length(): number {
    return this.total;
  }

  push(dt: number): void {
    const n = this.dts.length;
    if (n && this.dts[n - 1] === dt) this.counts[n - 1]++;
    else {
      this.dts.push(dt);
      this.counts.push(1);
      this.cum.push(this.total);
    }
    this.total++;
  }

  /** dt of step i (0-based). */
  at(i: number): number {
    let lo = 0;
    let hi = this.cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.cum[mid] <= i) lo = mid;
      else hi = mid - 1;
    }
    return this.dts[lo];
  }

  /** Iterate dts for steps [from, to). */
  *range(from: number, to: number): Generator<number> {
    if (from >= to) return;
    let r = 0;
    while (r + 1 < this.cum.length && this.cum[r + 1] <= from) r++;
    let i = from;
    while (i < to && r < this.dts.length) {
      const end = Math.min(to, this.cum[r] + this.counts[r]);
      for (; i < end; i++) yield this.dts[r];
      r++;
    }
  }

  runs(): number {
    return this.dts.length;
  }

  slice(n: number): StepLog {
    const s = new StepLog();
    for (const dt of this.range(0, Math.min(n, this.total))) s.push(dt);
    return s;
  }

  serialize(): SerializedSteps {
    return { dt: Float64Array.from(this.dts), count: Uint32Array.from(this.counts) };
  }

  static from(s: SerializedSteps): StepLog {
    const l = new StepLog();
    for (let i = 0; i < s.dt.length; i++) {
      l.dts.push(s.dt[i]);
      l.counts.push(s.count[i]);
      l.cum.push(l.total);
      l.total += s.count[i];
    }
    return l;
  }
}

// --- The record ----------------------------------------------------------------

export interface ProcedureRecord<S = unknown> {
  version: 1;
  meta: RecordingMeta;
  frames: SerializedFrames;
  events: RecordedEvent[];
  commands: RecordedCommand[];
  steps: SerializedSteps;
  snapshots: SnapshotRecord<S>[];
  /** set when the case ends */
  endedAt?: number;
}

export interface RecorderOptions {
  /** sampling rate of the frame columns (Hz); default 10 */
  hz?: number;
  /** keyframe snapshot interval (s of wall time) when a host is attached; default 10 */
  keyframeS?: number;
}

type Listener = (e: RecordedEvent) => void;

/**
 * Low-level recorder. Use it directly when the live simulation is not a
 * ReplayHost (frames and events only: the timeline and metrics work, replay
 * does not), or through RecordedSession, which also logs commands, dts and
 * snapshots.
 */
export class ProcedureRecorder<S = unknown> {
  readonly meta: RecordingMeta;
  readonly frames: FrameTable;
  readonly events: RecordedEvent[] = [];
  readonly commands: RecordedCommand[] = [];
  readonly steps: StepLog;
  readonly snapshots: SnapshotRecord<S>[] = [];
  private nextSampleT = -Infinity;
  private readonly period: number;
  private listeners = new Set<Listener>();
  endedAt?: number;

  constructor(meta: RecordingMeta, opts: RecorderOptions = {}, prefix?: { frames: FrameTable; events: RecordedEvent[]; commands: RecordedCommand[]; steps: StepLog; snapshots: SnapshotRecord<S>[] }) {
    this.meta = meta;
    this.period = 1 / (opts.hz ?? 10);
    this.frames = prefix?.frames ?? new FrameTable(2048);
    this.steps = prefix?.steps ?? new StepLog();
    if (prefix) {
      this.events.push(...prefix.events);
      this.commands.push(...prefix.commands);
      this.snapshots.push(...prefix.snapshots);
      const n = this.frames.length;
      if (n) this.nextSampleT = this.frames.value(n - 1, "tWall") + this.period;
    }
  }

  /** Is a sample due at this wall time? */
  due(tWall: number): boolean {
    return tWall + 1e-9 >= this.nextSampleT;
  }

  /** Record a sample if one is due at this wall time (decimates to `hz`). Returns true when stored. */
  sample(f: FrameSample, force = false): boolean {
    if (!force && f.tWall + 1e-9 < this.nextSampleT) return false;
    this.frames.push(f);
    // keep the grid anchored so jitter does not accumulate
    this.nextSampleT = Math.max(this.nextSampleT + this.period, f.tWall + this.period * 0.5);
    return true;
  }

  event(e: RecordedEvent): RecordedEvent {
    this.events.push(e);
    for (const l of this.listeners) l(e);
    return e;
  }

  onEvent(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  command(c: RecordedCommand): void {
    this.commands.push(c);
  }

  step(dt: number): void {
    this.steps.push(dt);
  }

  snapshot(s: SnapshotRecord<S>): void {
    this.snapshots.push(s);
  }

  finish(endedAt?: number): ProcedureRecord<S> {
    this.endedAt = endedAt ?? this.endedAt ?? Date.now();
    return this.toRecord();
  }

  toRecord(): ProcedureRecord<S> {
    return {
      version: 1,
      meta: this.meta,
      frames: this.frames.serialize(),
      events: this.events.slice(),
      commands: this.commands.slice(),
      steps: this.steps.serialize(),
      snapshots: this.snapshots.slice(),
      endedAt: this.endedAt,
    };
  }

  /** Approximate stored size (bytes): frames + steps + a JSON estimate of the rest. */
  bytes(): number {
    return recordBytes(this.toRecord());
  }
}

export function recordBytes(r: ProcedureRecord): number {
  const frameBytes = r.frames.n * BYTES_PER_FRAME;
  const stepBytes = r.steps.dt.byteLength + r.steps.count.byteLength;
  let json = 0;
  try {
    json = JSON.stringify({ e: r.events, c: r.commands, s: r.snapshots, m: r.meta }).length;
  } catch {
    json = 0;
  }
  return frameBytes + stepBytes + json;
}

// --- Recorded session: a host plus a recorder ------------------------------------------

export interface SessionOptions extends RecorderOptions {
  /** commands that are decision points (a snapshot is taken just before them) */
  isDecision?: (cmd: HostCommand, host: ReplayHost) => string | null;
}

/** Default decision points: injections, catheter and device exchanges, inflations, cine starts. */
export function defaultDecision(cmd: HostCommand): string | null {
  switch (cmd.kind) {
    case "syringe":
      return cmd.syringe.port === "contrast" && cmd.syringe.force > 0 ? "inject" : null;
    case "device":
      return `device:${cmd.slot}`;
    case "pedal":
      return cmd.pedal.cine ? "cine" : null;
    case "action":
      return ["inflate", "deploy", "load", "exchange", "remove", "bailout"].includes(cmd.name) ? cmd.name : null;
    default:
      return null;
  }
}

/**
 * Drives a ReplayHost and records everything needed for deterministic replay.
 * The integrator calls apply() for every operator command and step(dt) for
 * every simulation step, passing the wall clock (seconds since session start).
 */
export class RecordedSession<S = unknown> {
  readonly host: ReplayHost<S>;
  readonly rec: ProcedureRecorder<S>;
  private stepCount: number;
  private cmdCount: number;
  private lastKeyframe = -Infinity;
  private readonly keyframeS: number;
  private readonly isDecision: (cmd: HostCommand, host: ReplayHost) => string | null;
  private tWall = 0;

  constructor(host: ReplayHost<S>, meta: RecordingMeta, opts: SessionOptions = {}, prefix?: ProcedureRecorder<S>) {
    this.host = host;
    this.keyframeS = opts.keyframeS ?? 10;
    this.isDecision = opts.isDecision ?? ((c) => defaultDecision(c));
    this.rec = prefix ?? new ProcedureRecorder<S>(meta, opts);
    this.stepCount = this.rec.steps.length;
    this.cmdCount = this.rec.commands.length;
    if (!prefix) {
      this.takeSnapshot("start", 0);
      this.sampleNow(0, true);
    } else {
      const n = this.rec.frames.length;
      this.tWall = n ? this.rec.frames.value(n - 1, "tWall") : 0;
      this.lastKeyframe = this.tWall;
    }
  }

  get steps(): number {
    return this.stepCount;
  }

  get wallTime(): number {
    return this.tWall;
  }

  private stamp(e: { kind: string; data?: Record<string, unknown> }, tWall: number, ext = false): RecordedEvent {
    const s = this.host.sample();
    return this.rec.event({ kind: e.kind, data: e.data, tWall, tPatient: s.tPatient, step: this.stepCount, cmd: this.cmdCount, ...(ext ? { ext: true } : {}) });
  }

  private drain(tWall: number) {
    for (const e of this.host.drainEvents()) this.stamp(e, tWall);
  }

  private takeSnapshot(reason: string, tWall: number) {
    const s = this.host.sample();
    this.rec.snapshot({
      step: this.stepCount,
      cmd: this.cmdCount,
      ev: this.rec.events.length,
      frame: this.rec.frames.length,
      tWall,
      tPatient: s.tPatient,
      reason,
      state: this.host.snapshot(),
    });
  }

  private sampleNow(tWall: number, force = false) {
    if (!force && !this.rec.due(tWall)) return;
    const s = this.host.sample();
    this.rec.sample({ ...s, tWall, step: this.stepCount }, force);
  }

  /** Apply an operator command at wall time tWall. */
  apply(cmd: HostCommand, tWall: number = this.tWall): void {
    this.tWall = Math.max(this.tWall, tWall);
    const reason = this.isDecision(cmd, this.host as ReplayHost);
    if (reason) this.takeSnapshot(reason, this.tWall);
    this.rec.command({ step: this.stepCount, tWall: this.tWall, cmd });
    this.host.apply(cmd);
    this.cmdCount++;
    this.drain(this.tWall);
  }

  /** Advance the simulation by dt at wall time tWall (end of the step). */
  step(dt: number, tWall?: number): void {
    this.tWall = tWall ?? this.tWall + dt;
    this.rec.step(dt);
    this.host.step(dt);
    this.stepCount++;
    this.drain(this.tWall);
    this.sampleNow(this.tWall);
    if (this.tWall - this.lastKeyframe >= this.keyframeS) {
      this.takeSnapshot("keyframe", this.tWall);
      this.lastKeyframe = this.tWall;
    }
  }

  /** An event from outside the host (mentor, plan, UI). Not reproduced by replay. */
  event(kind: string, data?: Record<string, unknown>, tWall: number = this.tWall): RecordedEvent {
    return this.stamp({ kind, data }, tWall, true);
  }

  /** Mark a decision point that is not a command (e.g. the mentor's time-out). */
  mark(reason: string, tWall: number = this.tWall): void {
    this.takeSnapshot(reason, tWall);
  }

  finish(endedAt?: number): ProcedureRecord<S> {
    this.sampleNow(this.tWall, true);
    return this.rec.finish(endedAt);
  }
}

// --- Persistence ---------------------------------------------------------------

/** How many attempts are kept locally. */
export const MAX_STORED = 50;

const recordings = () => idbStore<ProcedureRecord>("recordings");
/**
 * One small summary per stored recording (about 100 bytes). Listing and trimming
 * read only this index; a full record (about 600 kB for 10 minutes) is loaded
 * only by loadRecording.
 */
const recordingIndex = () => idbStore<RecordingSummary>("recording-index");

export interface RecordingSummary {
  id: string;
  caseId: string;
  lab: string;
  mode: string;
  startedAt: number;
  durationS: number;
  bytes: number;
}

/** The index entry for a record. Computed once, when the record is saved. */
export function summariseRecording(r: ProcedureRecord): RecordingSummary {
  const f = FrameTable.from(r.frames);
  return {
    id: r.meta.id,
    caseId: r.meta.caseId,
    lab: r.meta.lab,
    mode: r.meta.mode,
    startedAt: r.meta.startedAt,
    durationS: f.length ? f.value(f.length - 1, "tWall") : 0,
    bytes: recordBytes(r),
  };
}

/**
 * Index entries for every stored recording. Recordings saved before the index
 * existed (schema v1) are summarised once here and added to the index; after
 * that this reads only the index and the key list.
 */
async function indexEntries(): Promise<RecordingSummary[]> {
  const idx = recordingIndex();
  const entries = (await idx.getAll()).map((e) => e.value);
  const have = new Set(entries.map((e) => e.id));
  const keys = await recordings().keys();
  const keySet = new Set(keys);
  for (const k of keys) {
    if (have.has(k)) continue;
    const r = await recordings().get(k);
    if (!r) continue;
    const sum = summariseRecording(r);
    await idx.put(k, sum);
    entries.push(sum);
  }
  // drop index entries whose record has gone
  const live: RecordingSummary[] = [];
  for (const e of entries) {
    if (keySet.has(e.id)) live.push(e);
    else await idx.delete(e.id);
  }
  return live;
}

/** Save a finished record and trim to the newest MAX_STORED. Never throws. */
export async function saveRecording(r: ProcedureRecord): Promise<boolean> {
  try {
    const ok = await recordings().put(r.meta.id, r);
    await recordingIndex().put(r.meta.id, summariseRecording(r));
    const all = await indexEntries();
    if (all.length > MAX_STORED) {
      all.sort((a, b) => b.startedAt - a.startedAt);
      for (const e of all.slice(MAX_STORED)) {
        await recordings().delete(e.id);
        await recordingIndex().delete(e.id);
      }
    }
    return ok;
  } catch {
    return false;
  }
}

export async function loadRecording(id: string): Promise<ProcedureRecord | undefined> {
  try {
    return await recordings().get(id);
  } catch {
    return undefined;
  }
}

/** Newest first. Reads the index only. */
export async function listRecordings(): Promise<RecordingSummary[]> {
  try {
    return (await indexEntries()).sort((a, b) => b.startedAt - a.startedAt);
  } catch {
    return [];
  }
}

export async function deleteRecording(id: string): Promise<boolean> {
  try {
    await recordingIndex().delete(id);
    return await recordings().delete(id);
  } catch {
    return false;
  }
}

// --- Notes that carry between cases (the "next time I will..." line) ----------------

export interface MentorNote {
  caseId: string;
  at: number;
  takeHome: string;
}

const notes = () => idbStore<MentorNote>("mentor-notes");

export async function saveTakeHome(n: MentorNote): Promise<void> {
  try {
    await notes().put(`${n.at}`, n);
    await trimStore(notes(), 200, (v) => v.at);
  } catch {
    /* non-critical */
  }
}

/** The most recent take-home line, for the next pre-brief. */
export async function lastTakeHome(): Promise<MentorNote | undefined> {
  try {
    const all = await notes().getAll();
    all.sort((a, b) => b.value.at - a.value.at);
    return all[0]?.value;
  } catch {
    return undefined;
  }
}
