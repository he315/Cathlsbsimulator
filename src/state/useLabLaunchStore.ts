// ===========================================================================
// Pending lab launches (found-launch-links).
//
// A lesson, case, case library or progress screen asks for a lab at a named
// scenario, start state and mode with useUiStore.openSim(sim, params), which
// stores the request here. The receiving lab takes it once, on mount and
// whenever a new request for it arrives (useLabLaunch), and applies it to its
// own session. Requests live in memory only: they are never written to
// NavMemory or any other storage, so a reload opens the lab as it was left.
//
// Lifetime rules (labs that adopt useLabLaunch rely on these):
//   1. Latest link wins. At most one request is pending: a new request with
//      params replaces any request still pending for any lab.
//   2. A plain open clears. request(sim) with no params (openSim(sim) without
//      params) drops the request pending for that lab.
//   3. Leaving the section drops it. When useUiStore.section changes by any
//      route (sidebar, tab bar, launch, openCase, openSim to another lab), a
//      request whose lab lives in a different section is dropped. openSim sets
//      the request and the section together, so its own request survives.
//   4. take() consumes. The lab that takes a request clears it.
// So a request can only fire in the lab it names, during the visit that the
// link started; an old lesson link never fires on a later, unrelated visit.
// ===========================================================================

import { useEffect, useRef } from "react";
import { create } from "zustand";
import type { LaunchParams, LaunchSim } from "../content/schema";

export interface PendingLaunch {
  params: LaunchParams;
  /** increases with every request, so a lab can tell a new request from one it has seen */
  seq: number;
}

interface LabLaunchStore {
  pending: Partial<Record<LaunchSim, PendingLaunch>>;
  seq: number;
  /**
   * Ask for a lab at these params. A request with params replaces every pending request (latest
   * link wins); no params (or empty params) clears any request for that lab.
   */
  request: (sim: LaunchSim, params?: LaunchParams) => void;
  /** The pending params for a lab, cleared as they are returned; null when there is none. */
  take: (sim: LaunchSim) => LaunchParams | null;
  /** The pending params without clearing them (safe in a render that may run twice). */
  peek: (sim: LaunchSim) => LaunchParams | null;
  /** Drop the pending requests for which `drop(sim)` is true (used when the section changes). */
  dropWhere: (drop: (sim: LaunchSim) => boolean) => void;
  /** Drop every pending request. */
  clear: () => void;
}

export const useLabLaunchStore = create<LabLaunchStore>((set, get) => ({
  pending: {},
  seq: 0,
  request: (sim, params) =>
    set((st) => {
      const pending = { ...st.pending };
      if (!params || Object.keys(params).length === 0) {
        delete pending[sim];
        return { pending };
      }
      const seq = st.seq + 1;
      return { pending: { [sim]: { params: { ...params }, seq } }, seq };
    }),
  take: (sim) => {
    const p = get().pending[sim];
    if (!p) return null;
    set((st) => {
      const pending = { ...st.pending };
      delete pending[sim];
      return { pending };
    });
    return { ...p.params };
  },
  peek: (sim) => {
    const p = get().pending[sim];
    return p ? { ...p.params } : null;
  },
  dropWhere: (drop) =>
    set((st) => {
      const keys = Object.keys(st.pending) as LaunchSim[];
      if (!keys.some(drop)) return st;
      const pending = { ...st.pending };
      for (const k of keys) if (drop(k)) delete pending[k];
      return { pending };
    }),
  clear: () => set({ pending: {} }),
}));

/** Take the pending launch for a lab (once). */
export function takeLaunch(sim: LaunchSim): LaunchParams | null {
  return useLabLaunchStore.getState().take(sim);
}

/** Read the pending launch for a lab without consuming it. */
export function peekLaunch(sim: LaunchSim): LaunchParams | null {
  return useLabLaunchStore.getState().peek(sim);
}

/**
 * Deliver launches for a lab: calls `onLaunch` at once with any pending request for `sim`, then
 * once for every new request that arrives, taking each so nothing is left pending. Returns the
 * unsubscribe function. useLabLaunch wraps this in an effect; it is exported for tests.
 */
export function subscribeLabLaunch(sim: LaunchSim, onLaunch: (params: LaunchParams) => void): () => void {
  const run = () => {
    if (!useLabLaunchStore.getState().pending[sim]) return;
    const p = takeLaunch(sim);
    if (p) onLaunch(p);
  };
  run();
  return useLabLaunchStore.subscribe((st, prev) => {
    if (st.pending[sim] && st.pending[sim] !== prev.pending[sim]) run();
  });
}

/**
 * For a lab component: calls `onLaunch` with the pending params for `sim` on mount and every
 * time a new request for it arrives while mounted (for example a tab change inside a section
 * that stays mounted). Pass `enabled: false` while the lab is not the visible tab, so the
 * request waits for the lab it names.
 */
export function useLabLaunch(sim: LaunchSim, onLaunch: (params: LaunchParams) => void, enabled = true): void {
  const cb = useRef(onLaunch);
  cb.current = onLaunch;
  useEffect(() => {
    if (!enabled) return;
    return subscribeLabLaunch(sim, (p) => cb.current(p));
  }, [sim, enabled]);
}
