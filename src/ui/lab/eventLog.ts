// ---------------------------------------------------------------------------
// The lab event log (found-lab-session-plumbing): one place where a lab keeps
// the tip events it has raised, so that a transient event (a damped trace, a
// burst of hypotension, a balloon that would not cross) stays in the lab's tip
// context long enough for the learner to read the tip, and then drops out.
// It replaces the diagnostic lab's LabEventLog, the PCI lab's EventLatch and
// the full case's own latch, which each did the same thing differently.
//
//   raise(event, holdS?)  the event is active from now for holdS seconds of lab
//                         time (TRANSIENT_HOLD_S unless the event has its own
//                         hold); raising an active event again extends it
//   hold(events)          case and scenario properties (cto, stemi, prior-cabg):
//                         active for the whole run until cleared
//   active(now)           the events active at lab time `now`, for LabContext.events
//   history()             every onset, in order, for the debrief
//
// Every onset is also written to the run's telemetry as a "lab.event" event
// (the sink, usually RecordedSession.event), so the debrief can show when each
// tip became relevant. Times are lab time in seconds, never wall-clock time,
// so a paused or hand-stepped lab (window.__lab[name].step) holds as it should.
// ---------------------------------------------------------------------------

import type { LabEvent } from "../../content/lab/tips";

/**
 * How long a transient event stays active after it was last raised, s.
 * MODEL PARAMETER: long enough to read a tip of 1-4 sentences and act on it; not from a source.
 */
export const TRANSIENT_HOLD_S = 30;

/**
 * Per-event holds, s, where the default does not suit (the event's own raiser may also pass holdS).
 * MODEL PARAMETERS. VF stays active only while the lab keeps raising it (the rhythm is on the
 * monitor), so its tips go as soon as the rhythm is treated.
 */
export const EVENT_HOLD_S: Partial<Record<LabEvent, number>> = {
  vf: 2,
  vt: 2,
};

/** Where onsets are written for the debrief: (kind, data, lab time). RecordedSession.event fits. */
export type TelemetrySink = (kind: string, data: Record<string, unknown>, t: number) => void;

/** Telemetry kind of an event onset. */
export const LAB_EVENT_TELEMETRY = "lab.event";

export interface EventLogOptions {
  /** default hold for transient events, s (TRANSIENT_HOLD_S) */
  holdS?: number;
  /** per-event holds, s, merged over EVENT_HOLD_S */
  holds?: Partial<Record<LabEvent, number>>;
  /** telemetry for each onset */
  sink?: TelemetrySink;
  /** lab time, s; when absent the log uses the latest time it was given */
  clock?: () => number;
}

/** One onset of an event. */
export interface EventOnset {
  event: LabEvent;
  /** lab time of the onset, s */
  t: number;
  /** hold at the onset, s (Infinity for a held case property) */
  holdS: number;
  /** who raised it (a module name), when the raiser says */
  source?: string;
}

/** An event active now, with the time it lapses (Infinity for a held case property). */
export interface ActiveEvent {
  event: LabEvent;
  since: number;
  until: number;
  source?: string;
}

type Listener = () => void;

export class EventLog {
  private readonly defaultHold: number;
  private readonly holds: Partial<Record<LabEvent, number>>;
  private readonly sink?: TelemetrySink;
  private readonly clock?: () => number;
  private readonly live = new Map<LabEvent, ActiveEvent>();
  private readonly onsets: EventOnset[] = [];
  private readonly listeners = new Set<Listener>();
  private lastT = 0;
  /** increases on every change of the active set or the history (for React subscriptions) */
  version = 0;

  constructor(opts: EventLogOptions = {}) {
    this.defaultHold = opts.holdS ?? TRANSIENT_HOLD_S;
    this.holds = { ...EVENT_HOLD_S, ...(opts.holds ?? {}) };
    this.sink = opts.sink;
    this.clock = opts.clock;
  }

  /** Lab time now: the clock, or the latest time the log was given. */
  now(): number {
    const t = this.clock ? this.clock() : this.lastT;
    return this.seen(t);
  }

  private seen(t: number): number {
    if (Number.isFinite(t) && t > this.lastT) this.lastT = t;
    return t;
  }

  /** The hold an event gets when its raiser does not pass one, s. */
  holdFor(event: LabEvent): number {
    return this.holds[event] ?? this.defaultHold;
  }

  /**
   * Raise a transient event at lab time t (default now) for holdS seconds (default holdFor(event)).
   * Raising an event that is still active extends it (never shortens it) without a new onset.
   * Returns true when this raise is an onset.
   */
  raise(event: LabEvent, holdS?: number, t?: number, source?: string): boolean {
    const at = t === undefined ? this.now() : this.seen(t);
    const hold = Math.max(0, holdS ?? this.holdFor(event));
    const until = at + hold;
    const cur = this.live.get(event);
    if (cur && cur.until >= at) {
      if (until > cur.until) {
        cur.until = until;
        this.changed();
      }
      return false;
    }
    this.live.set(event, { event, since: at, until, source });
    this.onset({ event, t: at, holdS: hold, source });
    return true;
  }

  /** Raise several events at once (same hold and time). Returns the events that were onsets. */
  raiseAll(events: readonly LabEvent[], holdS?: number, t?: number, source?: string): LabEvent[] {
    const at = t === undefined ? this.now() : this.seen(t);
    return events.filter((e) => this.raise(e, holdS, at, source));
  }

  /** Hold case and scenario properties for the whole run (until cleared). */
  hold(events: readonly LabEvent[], t?: number, source?: string): void {
    const at = t === undefined ? this.now() : this.seen(t);
    for (const event of events) {
      const cur = this.live.get(event);
      if (cur && cur.until === Infinity) continue;
      const wasActive = !!cur && cur.until >= at;
      this.live.set(event, { event, since: wasActive ? cur!.since : at, until: Infinity, source: cur?.source ?? source });
      if (!wasActive) this.onset({ event, t: at, holdS: Infinity, source });
      else this.changed();
    }
  }

  /** End an event now (a treated rhythm, a cleared case property). */
  clear(event: LabEvent): void {
    if (this.live.delete(event)) this.changed();
  }

  /** Is the event active at lab time `now` (default: the log's time)? Active through until, inclusive. */
  isActive(event: LabEvent, now?: number): boolean {
    const at = now === undefined ? this.now() : this.seen(now);
    const cur = this.live.get(event);
    return !!cur && cur.since <= at && at <= cur.until;
  }

  /** Events active at lab time `now` (default: the log's time), in onset order. */
  active(now?: number): LabEvent[] {
    return this.activeEntries(now).map((a) => a.event);
  }

  /**
   * Active events with their onset and lapse times (the DEV row of the tips panel shows them).
   * Reading never changes the log, so it is safe during a render; lapsed entries are replaced by
   * the next onset of the same event.
   */
  activeEntries(now?: number): ActiveEvent[] {
    const at = now === undefined ? this.now() : this.seen(now);
    const out: ActiveEvent[] = [];
    for (const a of this.live.values()) if (a.since <= at && at <= a.until) out.push({ ...a });
    return out.sort((x, y) => x.since - y.since);
  }

  /** Every onset so far, in order. */
  history(): readonly EventOnset[] {
    return this.onsets.slice();
  }

  /** Forget everything (a new run). */
  reset(): void {
    this.live.clear();
    this.onsets.length = 0;
    this.lastT = 0;
    this.changed();
  }

  /** Called after every change (for useSyncExternalStore and the dev hooks). Returns the unsubscribe function. */
  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  private onset(o: EventOnset): void {
    this.onsets.push(o);
    this.sink?.(LAB_EVENT_TELEMETRY, { event: o.event, holdS: Number.isFinite(o.holdS) ? o.holdS : null, ...(o.source ? { source: o.source } : {}) }, o.t);
    this.changed();
  }

  private changed(): void {
    this.version++;
    for (const l of this.listeners) l();
  }
}
