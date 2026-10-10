// ---------------------------------------------------------------------------
// Deterministic replay, scrubbing and rewind-and-branch.
//
// A record holds the dt of every simulation step, every command with the step
// boundary at which it was applied, and host snapshots (one at the start, one
// before every decision, keyframes every ~10 s). Seeking to step k restores
// the newest snapshot at or before k and fast-forwards the host through the
// logged commands and dts. A branch restores a decision point and returns a
// live RecordedSession that carries the record prefix, so the learner can try
// the decision again and the new continuation is itself replayable.
//
// Ordering contract (shared with RecordedSession):
//   state at boundary k = after k steps, before the commands logged at step k.
//   A snapshot stores (step, cmd): replay applies commands from index cmd on.
// ---------------------------------------------------------------------------

import { FrameTable, ProcedureRecorder, RecordedSession, StepLog, type ProcedureRecord, type SessionOptions } from "./telemetry";
import type { FrameSample, HostEvent, RecordedEvent, RecordingMeta, ReplayHost, SnapshotRecord } from "./types";

export interface SeekResult {
  /** the boundary the host now sits at */
  step: number;
  /** commands applied (index of the next command) */
  cmd: number;
  sample: Omit<FrameSample, "tWall" | "step">;
  /** host steps executed to get here (cost measure) */
  stepsRun: number;
}

export interface ReplayEvent extends HostEvent {
  step: number;
  cmd: number;
}

export class ReplayController<S = unknown> {
  readonly record: ProcedureRecord<S>;
  readonly frames: FrameTable;
  readonly steps: StepLog;
  private host: ReplayHost<S>;
  /** commands applied so far and the boundary reached, for incremental forward seeks */
  private at = { step: -1, cmd: 0 };

  constructor(record: ProcedureRecord<S>, makeHost: () => ReplayHost<S>) {
    if (!record.snapshots.length) throw new Error("replay needs at least the start snapshot");
    this.record = record;
    this.frames = FrameTable.from(record.frames);
    this.steps = StepLog.from(record.steps);
    this.host = makeHost();
  }

  get totalSteps(): number {
    return this.steps.length;
  }

  get duration(): number {
    const n = this.frames.length;
    return n ? this.frames.value(n - 1, "tWall") : 0;
  }

  /** Decision points (every snapshot except the start and keyframes). */
  decisionPoints(): SnapshotRecord<S>[] {
    return this.record.snapshots.filter((s) => s.reason !== "keyframe" && s.reason !== "start");
  }

  /** Step boundary for a wall time, from the recorded frames. */
  stepAt(tWall: number): number {
    const i = this.frames.indexAt(tWall);
    return i < 0 ? 0 : this.frames.value(i, "step");
  }

  private snapshotBefore(step: number, cmdLimit = Infinity): SnapshotRecord<S> {
    let best = this.record.snapshots[0];
    for (const s of this.record.snapshots) if (s.step <= step && s.cmd <= cmdLimit && (s.step > best.step || (s.step === best.step && s.cmd >= best.cmd))) best = s;
    return best;
  }

  private applyCommandsAt(boundary: number, cmdLimit = Infinity): number {
    const cmds = this.record.commands;
    let n = 0;
    while (this.at.cmd < cmds.length && this.at.cmd < cmdLimit && cmds[this.at.cmd].step === boundary) {
      this.host.apply(cmds[this.at.cmd].cmd);
      this.at.cmd++;
      n++;
    }
    return n;
  }

  /**
   * Put the host at boundary `step` (before that boundary's commands), or, when
   * `cmd` is given, after exactly `cmd` commands at that boundary.
   */
  seekStep(step: number, cmd?: number): SeekResult {
    step = Math.max(0, Math.min(this.totalSteps, Math.floor(step)));
    const cmds = this.record.commands;
    const cmdTarget = cmd ?? cmds.findIndex((c) => c.step >= step);
    const target = cmdTarget < 0 ? cmds.length : cmdTarget;
    let stepsRun = 0;
    // forward incremental seek when possible, else restore the nearest snapshot
    const canContinue = this.at.step >= 0 && (this.at.step < step || (this.at.step === step && this.at.cmd <= target));
    const snap = this.snapshotBefore(step, target);
    if (!canContinue || snap.step > this.at.step) {
      this.host.restore(structuredCloneSafe(snap.state));
      this.host.drainEvents();
      this.at = { step: snap.step, cmd: snap.cmd };
    }
    while (this.at.step < step) {
      this.applyCommandsAt(this.at.step);
      this.host.step(this.steps.at(this.at.step));
      this.host.drainEvents();
      this.at.step++;
      stepsRun++;
    }
    this.applyCommandsAt(step, target);
    this.host.drainEvents();
    return { step, cmd: this.at.cmd, sample: this.host.sample(), stepsRun };
  }

  /** Seek to a wall time (the recorded frame at or before it). */
  seekTime(tWall: number): SeekResult {
    return this.seekStep(this.stepAt(tWall));
  }

  /** Restore a snapshot exactly (a decision point). */
  seekSnapshot(s: SnapshotRecord<S>): SeekResult {
    this.host.restore(structuredCloneSafe(s.state));
    this.host.drainEvents();
    this.at = { step: s.step, cmd: s.cmd };
    return { step: s.step, cmd: s.cmd, sample: this.host.sample(), stepsRun: 0 };
  }

  /**
   * Re-run the whole record from the start snapshot. Returns the host events
   * (in order, with their step and command alignment) and a sample at every
   * recorded frame's step.
   */
  replayAll(): { events: ReplayEvent[]; samples: Omit<FrameSample, "tWall" | "step">[] } {
    const start = this.record.snapshots[0];
    this.host.restore(structuredCloneSafe(start.state));
    this.host.drainEvents();
    this.at = { step: start.step, cmd: start.cmd };
    const events: ReplayEvent[] = [];
    const samples: Omit<FrameSample, "tWall" | "step">[] = [];
    const frameSteps = this.frames.column("step");
    let fi = 0;
    const cmds = this.record.commands;
    const pushEvents = () => {
      for (const e of this.host.drainEvents()) events.push({ ...e, step: this.at.step, cmd: this.at.cmd });
    };
    const sampleFrames = () => {
      while (fi < frameSteps.length && frameSteps[fi] === this.at.step) {
        samples.push(this.host.sample());
        fi++;
      }
    };
    // frames recorded at boundary 0 come before any command
    sampleFrames();
    while (this.at.step <= this.totalSteps) {
      while (this.at.cmd < cmds.length && cmds[this.at.cmd].step === this.at.step) {
        this.host.apply(cmds[this.at.cmd].cmd);
        this.at.cmd++;
        pushEvents();
      }
      if (this.at.step === this.totalSteps) break;
      this.host.step(this.steps.at(this.at.step));
      this.at.step++;
      pushEvents();
      sampleFrames();
    }
    return { events, samples };
  }

  /**
   * Rewind to a decision point (or any wall time) and continue live from there.
   * The returned session carries the record prefix up to that point.
   */
  branch(at: SnapshotRecord<S> | number, makeHost: () => ReplayHost<S>, meta?: Partial<RecordingMeta>, opts: SessionOptions = {}): RecordedSession<S> {
    const host = makeHost();
    let step: number;
    let cmd: number;
    if (typeof at === "number") {
      const r = this.seekTime(at);
      step = r.step;
      cmd = r.cmd;
      host.restore(structuredCloneSafe(this.host.snapshot()));
    } else {
      step = at.step;
      cmd = at.cmd;
      host.restore(structuredCloneSafe(at.state));
    }
    host.drainEvents();
    const inPrefix = (e: RecordedEvent) => e.step < step || (e.step === step && e.cmd <= cmd);
    const fr = this.frames;
    let nf = 0;
    while (nf < fr.length && fr.value(nf, "step") <= step) nf++;
    const branchMeta: RecordingMeta = {
      ...this.record.meta,
      ...meta,
      id: meta?.id ?? `${this.record.meta.id}~b${step}`,
      context: { ...(this.record.meta.context ?? {}), branchOf: this.record.meta.id, branchStep: step, ...(meta?.context ?? {}) },
    };
    const prefix = new ProcedureRecorder<S>(branchMeta, opts, {
      frames: fr.slice(nf),
      events: this.record.events.filter(inPrefix),
      commands: this.record.commands.slice(0, cmd),
      steps: this.steps.slice(step),
      snapshots: this.record.snapshots.filter((s) => s.step < step || (s.step === step && s.cmd <= cmd)),
    });
    const session = new RecordedSession<S>(host, branchMeta, opts, prefix);
    session.event("branch", { from: this.record.meta.id, step });
    return session;
  }
}

function structuredCloneSafe<T>(v: T): T {
  try {
    const sc = (globalThis as unknown as { structuredClone?: <X>(x: X) => X }).structuredClone;
    if (sc) return sc(v);
  } catch {
    /* fall back */
  }
  return JSON.parse(JSON.stringify(v)) as T;
}

/** Host events of a record (the ones replay must reproduce), in order. */
export function hostEvents(r: ProcedureRecord): ReplayEvent[] {
  return r.events.filter((e) => !e.ext).map((e) => ({ kind: e.kind, data: e.data, step: e.step, cmd: e.cmd }));
}

/** Compare two event lists; returns the first mismatch index or -1. */
export function firstEventMismatch(a: ReplayEvent[], b: ReplayEvent[]): number {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i];
    const y = b[i];
    if (!x || !y) return i;
    if (x.kind !== y.kind || x.step !== y.step || x.cmd !== y.cmd || JSON.stringify(x.data ?? null) !== JSON.stringify(y.data ?? null)) return i;
  }
  return -1;
}
