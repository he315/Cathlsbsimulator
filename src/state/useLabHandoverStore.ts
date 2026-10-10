// ===========================================================================
// Stand-alone patient transfers between labs (found-handover-contract).
//
// A lab that sends its patient on (perforation in the PCI lab to
// pericardiocentesis, stenting to post-PCI physiology, biopsy perforation to
// drainage) puts a transfer here and then opens the receiving lab
// (useUiStore.openSim). The receiving lab takes the transfer once, on mount
// and whenever a new one arrives (useLabHandover), builds its own engine from
// the snapshot (engineFromHandover in src/simulation/session/handover.ts) and
// keeps the transfer's events active in its tip context for the whole run.
// The full case's continuous hand-over (caseSession.handover()) does not use
// this store: the case passes its own engine.
//
// Rules (labs that adopt useLabHandover rely on these):
//   1. Memory only. Transfers, and the engine snapshots in them, are never
//      written to localStorage, NavMemory or any other storage; a reload
//      starts every lab fresh.
//   2. A copy, not a reference. put() deep-copies the snapshot, profile,
//      params, events and payload, so the sending lab cannot change the
//      patient after it has left; the receiving lab owns what it takes. The
//      sending lab stops its own engine after put() (the patient has gone).
//      The rendered coronary tree is passed by reference: it is geometry that
//      no lab mutates.
//   3. One per lab, latest wins. A new transfer to a lab replaces the one
//      still pending for it; transfers to other labs are kept.
//   4. take() consumes. The lab that takes a transfer clears it, so it is
//      returned once.
//   5. A snapshot that cannot be restored is refused at put() (wrong profile,
//      or a tree-built snapshot without its tree), so the failure is the
//      sender's, not a blank receiving lab.
//   6. Dropped on leaving. When the section changes to one that is not a
//      lab's, the transfer pending for that lab is dropped, so a patient the
//      learner walked away from (by the sidebar rather than the sender's
//      openSim) does not reappear on a later, unrelated visit. Senders put and
//      then call openSim(to), which moves to the receiving lab's section, so
//      their own transfer survives. As useLabLaunchStore's rule 3.
// ===========================================================================

import { useEffect, useRef } from "react";
import { create } from "zustand";
import type { LaunchParams, LaunchSim } from "../content/schema";
import type { LabEvent } from "../content/lab/tips";
import type { EngineSnapshot } from "../simulation/patient/engine";
import type { PatientProfile } from "../simulation/patient/patient";
import type { CoronaryTree } from "../render/xray/coronaryTree";
import { cloneData, patientHandoverProblem, type HandoverExtensions, type LabReport, type PatientHandover } from "../simulation/session/handover";
import { SIM_SECTION, useUiStore } from "./useUiStore";

/** What a sending lab puts. */
export interface LabTransferInput {
  /** the receiving lab */
  to: LaunchSim;
  /** the sending lab */
  from: LaunchSim;
  /** launch parameters for the receiving lab (scenario, start, mode and the lab's own keys) */
  params?: LaunchParams;
  /** vocabulary events the receiving lab keeps active for the run (for example 'perforation', 'tamponade') */
  events?: LabEvent[];
  /** the patient's engine state; requires `profile`, and `tree` when the snapshot was taken on one */
  patient?: EngineSnapshot;
  profile?: PatientProfile;
  tree?: CoronaryTree | null;
  /** the sending lab's report of its run so far */
  report?: LabReport;
  /** case context the receiving lab may honour (anticoagulation, antithrombotics, contrast, consent, sheath) */
  context?: HandoverExtensions;
  /** anything else the receiving lab reads (plain data; copied) */
  payload?: Record<string, unknown>;
}

/** What a receiving lab takes. */
export interface LabTransfer {
  to: LaunchSim;
  from: LaunchSim;
  params: LaunchParams;
  /** unique, in the order given */
  events: LabEvent[];
  /** the patient, ready for engineFromHandover(); null when the transfer carries none */
  patient: PatientHandover | null;
  report: LabReport | null;
  context: HandoverExtensions | null;
  payload: Record<string, unknown> | null;
  /** increases with every put, so a lab can tell a new transfer from one it has seen */
  seq: number;
}

/** A pending transfer without its patient state (safe to read in a render). */
export interface LabTransferSummary {
  to: LaunchSim;
  from: LaunchSim;
  params: LaunchParams;
  events: LabEvent[];
  hasPatient: boolean;
  seq: number;
}

interface LabHandoverStore {
  pending: Partial<Record<LaunchSim, LabTransfer>>;
  seq: number;
  /** Hand a patient to a lab. Returns the transfer's seq. Throws when the patient cannot be restored. */
  put: (t: LabTransferInput) => number;
  /** The pending transfer for a lab, cleared as it is returned; null when there is none. */
  take: (to: LaunchSim) => LabTransfer | null;
  /** The pending transfer for a lab without its patient state and without clearing it. */
  peek: (to: LaunchSim) => LabTransferSummary | null;
  /** Drop the pending transfers for which `drop(to)` is true. */
  dropWhere: (drop: (to: LaunchSim) => boolean) => void;
  /** Drop every pending transfer. */
  clear: () => void;
}

function uniq<T>(xs: readonly T[]): T[] {
  return [...new Set(xs)];
}

/** Build the stored transfer from what the sender put (deep copies; validates the patient). */
export function makeTransfer(t: LabTransferInput, seq: number): LabTransfer {
  let patient: PatientHandover | null = null;
  if (t.patient) {
    if (!t.profile) throw new Error(`hand-over to ${t.to}: a patient snapshot needs the patient's profile`);
    const p: PatientHandover = { snapshot: t.patient, profile: t.profile, tree: t.tree ?? null };
    const problem = patientHandoverProblem(p);
    if (problem) throw new Error(`hand-over to ${t.to}: ${problem}`);
    patient = { snapshot: cloneData(t.patient), profile: cloneData(t.profile), tree: t.tree ?? null };
  } else if (t.profile || t.tree) {
    throw new Error(`hand-over to ${t.to}: a profile or tree was given without a patient snapshot`);
  }
  return {
    to: t.to,
    from: t.from,
    params: { ...(t.params ?? {}) },
    events: uniq(t.events ?? []),
    patient,
    report: t.report ? cloneData(t.report) : null,
    context: t.context ? cloneData(t.context) : null,
    payload: t.payload ? cloneData(t.payload) : null,
    seq,
  };
}

export const useLabHandoverStore = create<LabHandoverStore>((set, get) => ({
  pending: {},
  seq: 0,
  put: (t) => {
    const seq = get().seq + 1;
    const transfer = makeTransfer(t, seq);
    set((st) => ({ pending: { ...st.pending, [t.to]: transfer }, seq }));
    return seq;
  },
  take: (to) => {
    const t = get().pending[to];
    if (!t) return null;
    set((st) => {
      const pending = { ...st.pending };
      delete pending[to];
      return { pending };
    });
    return t;
  },
  peek: (to) => {
    const t = get().pending[to];
    return t ? { to: t.to, from: t.from, params: { ...t.params }, events: [...t.events], hasPatient: !!t.patient, seq: t.seq } : null;
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

// Rule 6: leaving a lab's section by any route drops the transfer pending for that lab.
useUiStore.subscribe((s, prev) => {
  if (s.section === prev.section) return;
  useLabHandoverStore.getState().dropWhere((to) => SIM_SECTION[to].section !== s.section);
});

/** Hand a patient to a lab (see the rules at the top of this file). */
export function putHandover(t: LabTransferInput): number {
  return useLabHandoverStore.getState().put(t);
}

/** Take the pending transfer for a lab (once). */
export function takeHandover(to: LaunchSim): LabTransfer | null {
  return useLabHandoverStore.getState().take(to);
}

/** Read the pending transfer for a lab without consuming it (no patient state). */
export function peekHandover(to: LaunchSim): LabTransferSummary | null {
  return useLabHandoverStore.getState().peek(to);
}

/**
 * Deliver transfers to a lab: calls `onTransfer` at once with any pending transfer for `to`, then
 * once for every new transfer that arrives, taking each. Returns the unsubscribe function.
 * useLabHandover wraps this in an effect; it is exported for tests.
 */
export function subscribeLabHandover(to: LaunchSim, onTransfer: (t: LabTransfer) => void): () => void {
  const run = () => {
    const t = takeHandover(to);
    if (t) onTransfer(t);
  };
  run();
  return useLabHandoverStore.subscribe((st, prev) => {
    if (st.pending[to] && st.pending[to] !== prev.pending[to]) run();
  });
}

/**
 * For a lab component: calls `onTransfer` with the pending transfer for `to` on mount and every time
 * a new one arrives while mounted. Pass `enabled: false` while the lab is not the visible tab, so the
 * transfer waits for the lab it names.
 */
export function useLabHandover(to: LaunchSim, onTransfer: (t: LabTransfer) => void, enabled = true): void {
  const cb = useRef(onTransfer);
  cb.current = onTransfer;
  useEffect(() => {
    if (!enabled) return;
    return subscribeLabHandover(to, (t) => cb.current(t));
  }, [to, enabled]);
}
