// ---------------------------------------------------------------------------
// Lab technique tips: the same tips the manual lessons teach
// (src/content/lab/tips.ts), chosen from what is happening now in a lab.
//
// useContextTips(ctx | ctxs, policy) is the one tip hook every lab uses
// (found-lab-session-plumbing): the tip registry is loaded lazily with the
// curriculum chunk, so a lab bundle stays small, and the visibility follows
// the assessment mode: guided shows tips as they become relevant; supervised
// and independent show them after the learner asks for help (useLabRun's
// askHelp, counted against entrustment as a hint); exams show none. A lab that
// spans several labs (the full case) passes one context per lab and gets each
// tip once (tipsForAll).
//
// useDiagnosticTips reads the diagnostic lab's context from diagnosticContext
// (src/ui/lab/diagnosticContext.ts: phase, events, catheter, engagement,
// pressure, vessel and route, from the store, the lab session and its event
// log) and delegates to useContextTips.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import type { AssessmentMode } from "../../mentor/types";
import type { LabContext, LabTip } from "../../content/lab/tips";
import type { DiagnosticLabSession } from "../sim/labSession";
import { useSessionVersion } from "./useLab";
import { IDLE_SESSION_VIEW, diagnosticContext, diagnosticStoreSlice } from "./diagnosticContext";

export type TipsModule = typeof import("../../content/lab/tips");
let tipsCache: TipsModule | null = null;
let tipsPending: Promise<TipsModule> | null = null;
export function loadTips(): Promise<TipsModule> {
  if (tipsCache) return Promise.resolve(tipsCache);
  if (!tipsPending) tipsPending = import("../../content/lab/tips").then((m) => (tipsCache = m));
  return tipsPending;
}

/** The tip module if it has loaded already, else null (module scope: survives session remounts). */
export function loadedTips(): TipsModule | null {
  return tipsCache;
}

/** Seconds near an ostium without a selective position before "engage-fail" is raised (now in diagnosticContext.ts). */
export { ENGAGE_FAIL_S } from "./diagnosticContext";

/** What the visibility rule needs: the session mode and when the learner asked for help (useLabRun returns both). */
export interface TipPolicy {
  mode: AssessmentMode;
  helpAskedAt: number | null;
}

/** May the learner see tips now? Guided: yes; supervised and independent: after asking for help; exam: never. */
export function tipsVisible(p: TipPolicy): boolean {
  if (p.mode === "exam") return false;
  if (p.mode === "guided") return true;
  return p.helpAskedAt !== null;
}

/** How many tips a lab shows at once unless it asks for another number. */
export const DEFAULT_TIP_LIMIT = 5;

/**
 * The tips for one context or several (tipsForAll), under the visibility rule; none until the tip
 * module is loaded. Pure, so a lab without React (and the tests) can use it.
 */
export function selectTips(mod: TipsModule | null, ctx: LabContext | readonly LabContext[] | null, p: TipPolicy, limit = DEFAULT_TIP_LIMIT): LabTip[] {
  if (!mod || !ctx || !tipsVisible(p)) return [];
  if (Array.isArray(ctx)) return ctx.length ? mod.tipsForAll(ctx as readonly LabContext[], limit) : [];
  return mod.tipsFor(ctx as LabContext, limit);
}

/** The tip module, once loaded (null until then). */
export function useTipsModule(): TipsModule | null {
  const [mod, setMod] = useState<TipsModule | null>(tipsCache);
  useEffect(() => {
    let alive = true;
    if (!tipsCache) loadTips().then((m) => alive && setMod(m));
    return () => {
      alive = false;
    };
  }, []);
  return mod;
}

export interface ContextTips {
  tips: LabTip[];
  /** whether the policy lets the learner see tips now */
  visible: boolean;
  /** whether the tip registry has loaded */
  loaded: boolean;
}

/**
 * The tips for what the lab reports now. Pass one context, or one per lab for a lab that spans
 * several (each tip once, best score first), and the session's mode and help request.
 */
export function useContextTips(ctx: LabContext | readonly LabContext[] | null, policy: TipPolicy, limit = DEFAULT_TIP_LIMIT): ContextTips {
  const mod = useTipsModule();
  const visible = tipsVisible(policy);
  // Recompute only when the context's content changes. A memoised context (the same object as last
  // render) reuses its key without serialising; a new object every render is serialised once.
  const last = useRef<{ ctx: LabContext | readonly LabContext[] | null; key: string }>({ ctx: null, key: "" });
  if (last.current.ctx !== ctx) last.current = { ctx, key: ctx ? JSON.stringify(ctx) : "" };
  const key = last.current.key;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- ctx is tracked by its content key
  const tips = useMemo(() => selectTips(mod, ctx, policy, limit), [mod, key, visible, limit]);
  return { tips, visible, loaded: !!mod };
}

export interface DiagnosticTips {
  tips: LabTip[];
  context: LabContext;
  /** whether the policy lets the learner see tips now */
  visible: boolean;
}

/**
 * The diagnostic lab's tips: the context from diagnosticContext (src/ui/lab/diagnosticContext.ts)
 * with the session's view and event log (the shell passes its session), delegated to
 * useContextTips. Without a session (a screen that shows the drawer outside the lab) the context
 * is read from the store alone.
 */
export function useDiagnosticTips(session: DiagnosticLabSession | null, mode: AssessmentMode, helpAskedAt: number | null): DiagnosticTips {
  // the store slices the context reads, the session's publications (about 5 Hz) and the event log
  const engagement = useSimulatorStore((s) => s.engagement);
  const pressure = useSimulatorStore((s) => s.pressure);
  const catheterId = useSimulatorStore((s) => s.catheterId);
  const caseData = useSimulatorStore((s) => s.caseData);
  const finished = useSimulatorStore((s) => s.finished);
  const version = useSessionVersion(session);
  const logVersion = useSyncExternalStore(
    (fn) => (session ? session.events.subscribe(fn) : () => undefined),
    () => session?.events.version ?? 0,
    () => session?.events.version ?? 0
  );

  const context: LabContext = useMemo(
    () => (session ? session.tipContext() : diagnosticContext({ store: diagnosticStoreSlice(useSimulatorStore.getState()), session: IDLE_SESSION_VIEW })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the session and the store are read inside; these say when they changed
    [session, version, logVersion, engagement, pressure, catheterId, caseData, finished]
  );

  const { tips, visible } = useContextTips(context, { mode, helpAskedAt }, DEFAULT_TIP_LIMIT);
  return { tips, context, visible };
}
