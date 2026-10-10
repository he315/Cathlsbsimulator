// ---------------------------------------------------------------------------
// Foot switches.
//
// Every source (keyboard F/C, gamepad triggers, MIDI pedals, HID foot switches,
// the torquer, an on-screen pedal) reports its own pedal state. The merged
// state is the OR across sources, emitted synchronously on every change, so the
// imaging chain sees one PedalState whatever the hardware.
//
// Dead-man: a pedal is only "down" while some source actively holds it. A
// source that disconnects, loses focus or stops reporting is released at once
// (releaseSource), so the beam can never stay on after the foot comes off.
// ---------------------------------------------------------------------------

import type { PedalName, PedalState, SourceId } from "./types";

export class PedalMerger {
  private bySource = new Map<SourceId, PedalState>();
  private merged: PedalState = { fluoro: false, cine: false };

  /** Set one pedal for one source. Returns the new merged state if it changed, else null. */
  set(source: SourceId, pedal: PedalName, on: boolean): PedalState | null {
    const cur = this.bySource.get(source) ?? { fluoro: false, cine: false };
    if (cur[pedal] === on) return null;
    const next = { ...cur, [pedal]: on };
    if (!next.fluoro && !next.cine) this.bySource.delete(source);
    else this.bySource.set(source, next);
    return this.recompute();
  }

  /** Release every pedal held by a source. */
  releaseSource(source: SourceId): PedalState | null {
    if (!this.bySource.delete(source)) return null;
    return this.recompute();
  }

  releaseAll(): PedalState | null {
    if (this.bySource.size === 0) return null;
    this.bySource.clear();
    return this.recompute();
  }

  state(): PedalState {
    return { ...this.merged };
  }

  /** Which sources currently hold a pedal (calibration screen). */
  holders(pedal: PedalName): SourceId[] {
    const out: SourceId[] = [];
    for (const [id, st] of this.bySource) if (st[pedal]) out.push(id);
    return out;
  }

  private recompute(): PedalState | null {
    let fluoro = false;
    let cine = false;
    for (const st of this.bySource.values()) {
      fluoro ||= st.fluoro;
      cine ||= st.cine;
    }
    if (fluoro === this.merged.fluoro && cine === this.merged.cine) return null;
    this.merged = { fluoro, cine };
    return { ...this.merged };
  }
}

/** Analog trigger to switch with hysteresis (gamepad triggers, expression pedals). */
export function hysteresis(prev: boolean, value: number, on: number, off: number): boolean {
  if (!Number.isFinite(value)) return false;
  return prev ? value > off : value >= on;
}
