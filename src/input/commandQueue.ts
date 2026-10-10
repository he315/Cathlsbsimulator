// ---------------------------------------------------------------------------
// CommandQueue: hand commands buffered for the next physics step.
//
// Pointer events can arrive several times per frame. The physics client takes
// everything queued since its last step with drain(). Consecutive push or
// torque commands for the same device are summed (totals are preserved
// exactly); grips, regrips and pins are kept in order and break the run, so
// "push, pin wire, push" stays three steps and the pin lands between them.
// ---------------------------------------------------------------------------

import type { InputBus } from "./bus";
import type { HandCommand } from "./types";

export class CommandQueue {
  private q: HandCommand[] = [];
  private off: (() => void) | null = null;

  constructor(bus?: InputBus) {
    if (bus) this.off = bus.on("hand", (c) => this.push(c));
  }

  push(c: HandCommand) {
    const last = this.q[this.q.length - 1];
    if (last && (c.kind === "push" || c.kind === "torque")) {
      // merge with the most recent motion of the same kind and device, as long as no
      // grip/pin event sits between them
      for (let i = this.q.length - 1; i >= 0; i--) {
        const e = this.q[i];
        if (e.kind !== "push" && e.kind !== "torque") break;
        if (e.kind === c.kind && e.device === c.device) {
          if (e.kind === "push" && c.kind === "push") this.q[i] = { ...e, mm: e.mm + c.mm };
          else if (e.kind === "torque" && c.kind === "torque") this.q[i] = { ...e, rad: e.rad + c.rad };
          return;
        }
      }
    }
    this.q.push(c);
  }

  /** Everything since the last drain, coalesced. */
  drain(): HandCommand[] {
    const out = this.q;
    this.q = [];
    return out;
  }

  get length() {
    return this.q.length;
  }

  dispose() {
    this.off?.();
    this.off = null;
    this.q = [];
  }
}
