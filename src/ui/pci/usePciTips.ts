// ---------------------------------------------------------------------------
// The PCI lab's tips (pci-tip-context): the tip context from the session's
// snapshot (pciTipContext, src/ui/lab/pciTips.ts), the tips through the shared
// hook (useContextTips: guided shows them as they become relevant, supervised
// and independent after the learner asks for help, exams none), and every
// change of the context written to the run's recorder as a 'tip-context'
// event, so the debrief can show when each tip became relevant.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { LabContext, LabTip } from "../../content/lab/tips";
import type { RecordedEvent } from "../../mentor/types";
import { DEFAULT_TIP_LIMIT, useContextTips, type TipPolicy } from "../lab/useLabTips";
import { pciTipContext, tipContextKey, type PciTipSnapshot } from "../lab/pciTips";
import type { PciLabSession } from "./PciLabSession";

/** The recorder event kind of a tip context change. */
export const TIP_CONTEXT_EVENT = "tip-context";

/** What the context recorder writes to: the session's recorder, its lab clock and the patient clock. */
export interface TipContextSink {
  recorder: { event(e: RecordedEvent): unknown };
  wall(): number;
  engine: { time: number };
}

/**
 * A recorder of tip contexts for one session: each call with a context that differs from the last
 * one recorded writes a 'tip-context' event (phase, events and the other fields) and returns true.
 */
export function tipContextRecorder(sink: TipContextSink): (ctx: LabContext | null) => boolean {
  let last = "";
  return (ctx) => {
    const key = tipContextKey(ctx);
    if (!ctx || key === last) return false;
    last = key;
    sink.recorder.event({ kind: TIP_CONTEXT_EVENT, tWall: sink.wall(), tPatient: sink.engine.time, step: 0, cmd: 0, ext: true, data: { ...ctx, events: [...(ctx.events ?? [])] } });
    return true;
  };
}

/** The session as the hook reads it (PciLabSession fits). */
type TipSession = Pick<PciLabSession, "subscribe" | "version" | "events" | "recorder" | "wall" | "engine"> & { snapshot(): PciTipSnapshot };

export interface PciTips {
  tips: LabTip[];
  context: LabContext | null;
  /** whether the policy lets the learner see tips now */
  visible: boolean;
}

/**
 * The PCI lab's tips for the session now. The context is recomputed when the session publishes a
 * change or its event log changes, and each new context is recorded as a 'tip-context' event.
 */
export function usePciTips(session: TipSession | null, policy: TipPolicy, limit = DEFAULT_TIP_LIMIT): PciTips {
  const version = useSyncExternalStore(
    (fn) => (session ? session.subscribe(fn) : () => undefined),
    () => session?.version ?? 0,
    () => session?.version ?? 0
  );
  const logVersion = useSyncExternalStore(
    (fn) => (session ? session.events.subscribe(fn) : () => undefined),
    () => session?.events.version ?? 0,
    () => session?.events.version ?? 0
  );
  const context = useMemo(
    () => (session ? pciTipContext(session.snapshot()) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the session is read inside; these say when it changed
    [session, version, logVersion]
  );
  // one recorder per session; it writes only when the context's content changes
  const rec = useRef<{ session: TipSession | null; record: ((ctx: LabContext | null) => boolean) | null }>({ session: null, record: null });
  if (rec.current.session !== session) rec.current = { session, record: session ? tipContextRecorder(session) : null };
  useEffect(() => {
    rec.current.record?.(context);
  }, [context]);
  const { tips, visible } = useContextTips(context, policy, limit);
  return { tips, context, visible };
}
