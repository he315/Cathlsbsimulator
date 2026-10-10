import { useSyncExternalStore, type CSSProperties } from "react";
import type { DiagnosticLabSession } from "../sim/labSession";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { useSeriesStore, type SeriesStore } from "../../state/useSeriesStore";

type SimState = ReturnType<typeof useSimulatorStore.getState>;

/**
 * Store selectors for the lab screens. The selector must return a value held in the store (no new
 * objects). Server rendering reads the live state too (zustand's own hook renders the initial state on
 * the server), so render tests see what the lab would show.
 */
export function useSim<T>(sel: (s: SimState) => T): T {
  return useSyncExternalStore(useSimulatorStore.subscribe, () => sel(useSimulatorStore.getState()), () => sel(useSimulatorStore.getState()));
}

export function useSeries<T>(sel: (s: SeriesStore) => T): T {
  return useSyncExternalStore(useSeriesStore.subscribe, () => sel(useSeriesStore.getState()), () => sel(useSeriesStore.getState()));
}

/** Re-render when the lab session publishes (about 5 Hz, and on pedal, injection and memory changes). */
export function useSessionVersion(session: DiagnosticLabSession | null): number {
  return useSyncExternalStore(
    (fn) => (session ? session.subscribe(fn) : () => undefined),
    () => session?.version ?? 0,
    () => session?.version ?? 0
  );
}

/** mm:ss for a duration in seconds. */
export function mmss(s: number): string {
  const t = Math.max(0, Math.floor(s));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** C-arm angles as a lab monitor shows them: LAO/RAO and CRA/CAU, whole degrees. */
export function angleText(a: { laoRao: number; cranialCaudal: number }): string {
  const lr = Math.round(a.laoRao);
  const cc = Math.round(a.cranialCaudal);
  return `${lr >= 0 ? "LAO" : "RAO"} ${Math.abs(lr)}  ${cc >= 0 ? "CRA" : "CAU"} ${Math.abs(cc)}`;
}

/** Frame or pulse rate as text: whole rates as integers, others with the decimals they have, up to two (7.5, 3.75). */
export function rateText(r: number): string {
  return Number.isInteger(r) ? String(r) : String(Number(r.toFixed(2)));
}

/** The largest square that fits the parent (the parent sets container-type: size): monitors keep a square image. */
export const SQUARE: CSSProperties = { width: "min(100cqw, 100cqh)", height: "min(100cqw, 100cqh)" };
