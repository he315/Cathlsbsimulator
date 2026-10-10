// ---------------------------------------------------------------------------
// A small typed, synchronous event bus.
//
// Dispatch is synchronous: a listener runs inside the DOM event (or gamepad
// poll) that produced the command, so a command reaches whatever the physics
// client queues for its next step in the same frame. That is how the input
// layer meets the "input to physics in at most one frame" target and how a
// pedal release stops the beam within one frame.
//
// One listener throwing does not stop the others (the error is reported once
// per listener to the console).
// ---------------------------------------------------------------------------

import type { InputEvents } from "./types";

export type Listener<P> = (payload: P) => void;

export interface Bus<E extends object> {
  on<K extends keyof E>(type: K, fn: Listener<E[K]>): () => void;
  once<K extends keyof E>(type: K, fn: Listener<E[K]>): () => void;
  emit<K extends keyof E>(type: K, payload: E[K]): void;
  /** every event, in emission order (telemetry, replay recording) */
  onAny(fn: <K extends keyof E>(type: K, payload: E[K]) => void): () => void;
  /** number of listeners for a type (tests, diagnostics) */
  count<K extends keyof E>(type: K): number;
  clear(): void;
}

export function createBus<E extends object>(): Bus<E> {
  const map = new Map<keyof E, Set<Listener<unknown>>>();
  const any = new Set<(type: keyof E, payload: unknown) => void>();
  const reported = new WeakSet<object>();

  const safe = (fn: object, call: () => void) => {
    try {
      call();
    } catch (err) {
      if (!reported.has(fn)) {
        reported.add(fn);
        // eslint-disable-next-line no-console
        console.error("[input bus] listener failed", err);
      }
    }
  };

  const bus: Bus<E> = {
    on(type, fn) {
      let set = map.get(type);
      if (!set) {
        set = new Set();
        map.set(type, set);
      }
      set.add(fn as Listener<unknown>);
      return () => {
        set!.delete(fn as Listener<unknown>);
      };
    },
    once(type, fn) {
      const off = bus.on(type, (p) => {
        off();
        fn(p);
      });
      return off;
    },
    emit(type, payload) {
      const set = map.get(type);
      if (set) {
        // copy so listeners may unsubscribe while being called
        for (const fn of Array.from(set)) safe(fn, () => fn(payload));
      }
      for (const fn of Array.from(any)) safe(fn, () => fn(type, payload));
    },
    onAny(fn) {
      const f = fn as (type: keyof E, payload: unknown) => void;
      any.add(f);
      return () => {
        any.delete(f);
      };
    },
    count(type) {
      return map.get(type)?.size ?? 0;
    },
    clear() {
      map.clear();
      any.clear();
    },
  };
  return bus;
}

export type InputBus = Bus<InputEvents>;

export function createInputBus(): InputBus {
  return createBus<InputEvents>();
}
