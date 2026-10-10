// ---------------------------------------------------------------------------
// React glue for the input system: create one system per screen, subscribe to
// bus values. Kept separate from system.ts so the core stays framework-free.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import type { InputBus } from "./bus";
import { createInputSystem, type InputSystem, type InputSystemOptions } from "./system";
import type { HandView, InputEvents, PedalState, SourceStatus } from "./types";

/**
 * One InputSystem for the lifetime of the component. `loop` drives frame() from
 * requestAnimationFrame (standalone screens); labs that already have a frame
 * loop call system.frame(dt) themselves and pass loop=false.
 */
export function useInputSystem(opts: InputSystemOptions & { loop?: boolean } = {}): InputSystem {
  const ref = useRef<InputSystem | null>(null);
  if (ref.current === null) ref.current = createInputSystem(opts);
  const sys = ref.current;
  const loop = opts.loop ?? true;
  const pendingDispose = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // StrictMode mounts, unmounts and remounts synchronously: cancel a pending dispose
    if (pendingDispose.current) {
      clearTimeout(pendingDispose.current);
      pendingDispose.current = null;
    }
    if (loop) sys.startLoop();
    return () => {
      sys.stopLoop();
      sys.releaseAll(); // dead-man: nothing stays held when the screen goes
      pendingDispose.current = setTimeout(() => sys.dispose(), 0);
    };
  }, [sys, loop]);
  return sys;
}

/** Latest payload of a bus event (re-renders on every emission). */
export function useBusValue<K extends keyof InputEvents>(bus: InputBus | null | undefined, type: K, initial: InputEvents[K]): InputEvents[K] {
  const [v, setV] = useState(initial);
  useEffect(() => {
    if (!bus) return;
    return bus.on(type, setV as (p: InputEvents[K]) => void);
  }, [bus, type]);
  return v;
}

export function useHandView(sys: InputSystem | null | undefined): HandView | null {
  const [v, setV] = useState<HandView | null>(() => sys?.view() ?? null);
  useEffect(() => {
    if (!sys) return;
    setV(sys.view());
    return sys.bus.on("hands", setV);
  }, [sys]);
  return v;
}

export function usePedals(sys: InputSystem | null | undefined): PedalState {
  return useBusValue(sys?.bus, "pedal", sys?.pedalState() ?? { fluoro: false, cine: false });
}

export function useSources(sys: InputSystem | null | undefined): SourceStatus[] {
  const [v, setV] = useState<SourceStatus[]>(() => sys?.statuses() ?? []);
  useEffect(() => {
    if (!sys) return;
    setV(sys.statuses());
    return sys.bus.on("sources", setV);
  }, [sys]);
  return v;
}
