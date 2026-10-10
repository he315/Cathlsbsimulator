// ---------------------------------------------------------------------------
// Main-thread client for the device physics. Runs the solver in a Web Worker
// when one is available, otherwise in-thread (tests, Node). The API is the
// same either way:
//
//   const phys = PhysicsClient.create();
//   phys.init({ model, route, t0: clock.state().t, config: "auto" });   // "auto": bench, then a validated config
//   phys.loadCatheter("JL4", { facing: [0.71, 0, -0.71] });
//   phys.loadWire("J", { advance: 30 });
//   phys.command({ kind: "push", device: "catheter", mm: 2 });   // from the hands (S8)
//   phys.step(clock.state().t, { resp, coronaries });            // once per rendered frame
//   const f = phys.latest();        // nodes, hub reactions, engagement, stamped with f.t
//
// Frames arrive asynchronously in worker mode (one frame behind the request);
// latest() always returns the newest complete frame, so the renderer must
// evaluate the beating heart at frame.t, not at the current clock time.
// ---------------------------------------------------------------------------

import type { HandCommand, HubReaction, DeviceSlot } from "../simulation/session/types";
import type { EngineSnapshot } from "./engine";
import { PhysicsHost } from "./host";
import type { ConfigInfo, FromWorker, LoadOpts, MotionMsg, PhysicsFrame, SceneInit, ToWorker } from "./protocol";

type Listener = (f: PhysicsFrame) => void;

export class PhysicsClient {
  private worker: Worker | null;
  private host: PhysicsHost | null;
  private frame: PhysicsFrame | null = null;
  private listeners: Listener[] = [];
  private pendingCmds: HandCommand[] = [];
  private inFlight = 0;
  private reqId = 0;
  private snapWaiters = new Map<number, (s: EngineSnapshot) => void>();
  /** last error reported by the solver */
  lastError: string | null = null;
  /** solver configuration the worker settled on (after "ready") */
  config: ConfigInfo | null = null;

  private constructor(worker: Worker | null) {
    this.worker = worker;
    this.host = worker ? null : new PhysicsHost();
    if (worker) worker.onmessage = (ev: MessageEvent<FromWorker>) => this.receive(ev.data);
  }

  /** A client backed by a module worker when possible (useWorker defaults to true). */
  static create(opts: { useWorker?: boolean } = {}): PhysicsClient {
    const want = opts.useWorker ?? true;
    if (want && typeof Worker !== "undefined") {
      try {
        const w = new Worker(new URL("./physicsWorker.ts", import.meta.url), { type: "module" });
        return new PhysicsClient(w);
      } catch {
        // fall through to in-thread
      }
    }
    return new PhysicsClient(null);
  }

  get usesWorker(): boolean {
    return this.worker !== null;
  }

  init(scene: SceneInit): void {
    this.frame = null;
    this.send({ type: "init", scene });
  }

  loadCatheter(id: string, opts?: LoadOpts): void {
    this.send({ type: "load", device: "catheter", id, opts });
  }

  loadWire(id: string, opts?: LoadOpts): void {
    this.send({ type: "load", device: "wire", id, opts });
  }

  remove(device: "catheter" | "wire"): void {
    this.send({ type: "remove", device });
  }

  /** Queue a hand command; it is delivered with the next step. */
  command(cmd: HandCommand): void {
    this.pendingCmds.push(cmd);
  }

  /**
   * Advance the physics to patient time tClock. In worker mode at most two steps are in flight;
   * if the worker is behind, this call only forwards the queued commands (the next step catches up).
   */
  step(tClock: number, motion?: MotionMsg): void {
    if (this.pendingCmds.length) {
      this.send({ type: "commands", cmds: this.pendingCmds });
      this.pendingCmds = [];
    }
    if (this.worker && this.inFlight >= 2) return;
    this.inFlight++;
    this.send({ type: "step", tClock, motion });
  }

  /** Newest complete frame (null before the first step). */
  latest(): PhysicsFrame | null {
    return this.frame;
  }

  /** Newest centre-line nodes of a device (aortic frame, hub → tip), or null. */
  latestNodes(slot: DeviceSlot): Float32Array | null {
    const f = this.frame;
    if (!f) return null;
    if (f.catheter && (f.catheter.slot === slot || (slot === "catheter" && f.catheter.slot === "pigtail"))) return f.catheter.nodes;
    if (f.wire && f.wire.slot === slot) return f.wire.nodes;
    return null;
  }

  /** Hub reactions of the newest frame (for haptics, audio and hazards). */
  reactions(): HubReaction[] {
    // wedged is set by the engine from the classifier
    return this.frame ? this.frame.reactions : [];
  }

  onFrame(cb: Listener): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  snapshot(): Promise<EngineSnapshot> {
    const reqId = ++this.reqId;
    return new Promise((resolve) => {
      this.snapWaiters.set(reqId, resolve);
      this.send({ type: "snapshot", reqId });
    });
  }

  restore(snap: EngineSnapshot): void {
    this.send({ type: "restore", snap });
  }

  dispose(): void {
    this.worker?.terminate();
    this.worker = null;
    this.host = null;
    this.listeners = [];
  }

  private send(msg: ToWorker): void {
    if (this.worker) {
      this.worker.postMessage(msg);
      return;
    }
    if (!this.host) return;
    for (const r of this.host.handle(msg)) this.receive(r);
  }

  private receive(msg: FromWorker): void {
    switch (msg.type) {
      case "frame":
        this.inFlight = Math.max(0, this.inFlight - 1);
        this.frame = msg.frame;
        for (const l of this.listeners) l(msg.frame);
        break;
      case "snapshot": {
        const w = this.snapWaiters.get(msg.reqId);
        this.snapWaiters.delete(msg.reqId);
        w?.(msg.snap);
        break;
      }
      case "error":
        this.lastError = msg.message;
        this.inFlight = Math.max(0, this.inFlight - 1);
        break;
      case "ready":
        this.config = msg.config ?? null;
        break;
    }
  }
}
