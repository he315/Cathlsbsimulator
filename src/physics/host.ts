// ---------------------------------------------------------------------------
// Message handling around a PhysicsEngine, shared by the Web Worker
// (physicsWorker.ts) and the in-thread fallback of physicsClient.ts (tests,
// Node, browsers without module workers). Deterministic: the same message
// sequence gives the same frames.
// ---------------------------------------------------------------------------

import { PhysicsEngine, type EngineConfig } from "./engine";
import type { CourseFn } from "./lumen";
import { MAX_CATCH_UP, type ConfigInfo, type FromWorker, type PhysicsFrame, type SceneInit, type ToWorker } from "./protocol";
import { autoConfig } from "./bench";

export class PhysicsHost {
  engine: PhysicsEngine | null = null;
  /** per-frame budget (ms per 1/15 s of patient time) the frames are checked against */
  budgetMs = 2;
  private costs: number[] = [];

  /** Handle one message; returns the replies (frames are produced by "step"). */
  handle(msg: ToWorker): FromWorker[] {
    try {
      switch (msg.type) {
        case "init": {
          const { engine, config } = makeEngineWithConfig(msg.scene);
          this.engine = engine;
          this.budgetMs = msg.scene.budgetMs ?? 2;
          this.costs.length = 0;
          return [{ type: "ready", config }];
        }
        case "load": {
          const e = this.need();
          if (msg.device === "catheter") e.loadCatheter(msg.id, { tipS: msg.opts?.tipS, roll: msg.opts?.roll, facing: msg.opts?.facing, slot: msg.opts?.slot });
          else e.loadWire(msg.id, { advance: msg.opts?.advance, slot: msg.opts?.slot });
          return [];
        }
        case "remove": {
          const e = this.need();
          if (msg.device === "catheter") e.removeCatheter();
          else e.removeWire();
          return [];
        }
        case "commands": {
          const e = this.need();
          for (const c of msg.cmds) e.command(c);
          return [];
        }
        case "step":
          return [{ type: "frame", frame: this.step(msg.tClock, msg.motion) }];
        case "snapshot":
          return [{ type: "snapshot", reqId: msg.reqId, snap: this.need().snapshot() }];
        case "restore":
          this.need().restore(msg.snap);
          return [];
      }
    } catch (err) {
      return [{ type: "error", message: err instanceof Error ? err.message : String(err) }];
    }
    return [];
  }

  /** Advance to the patient clock time tClock and read the state out. */
  step(tClock: number, motion?: { resp?: number; coronaries?: import("./lumen").CoronaryInput[] }): PhysicsFrame {
    const e = this.need();
    const t0 = now();
    // after a stall (hidden tab, breakpoint) do not try to simulate the gap: skip the clock ahead
    if (tClock - e.t > MAX_CATCH_UP) e.setTime(tClock - MAX_CATCH_UP);
    const substeps = e.stepTo(tClock, motion);
    const catheter = e.catheter ? e.readDevice(e.catheter) : null;
    const wire = e.readWire();
    const frame: PhysicsFrame = {
      t: e.t,
      steps: e.steps,
      catheter,
      wire,
      engagement: e.classify(),
      stepMs: 0,
      substeps,
      reactions: [...(catheter ? [catheter.reaction] : []), ...(wire ? [wire.reaction] : [])],
    };
    frame.stepMs = now() - t0;
    if (substeps > 0) {
      // cost of one 15 frames/s frame at this substep rate, from this frame's time per substep
      this.costs.push((frame.stepMs / substeps) * (e.config.substepHz / 15));
      if (this.costs.length > 15) this.costs.shift();
    }
    if (this.costs.length) {
      const c = this.costs.slice().sort((a, b) => a - b);
      frame.costMs = c[Math.floor(c.length / 2)];
      frame.overBudget = this.costs.length >= 15 && frame.costMs > this.budgetMs;
    }
    return frame;
  }

  private need(): PhysicsEngine {
    if (!this.engine) throw new Error("physics: init must come first");
    return this.engine;
  }
}

export function makeEngine(scene: SceneInit): PhysicsEngine {
  return makeEngineWithConfig(scene).engine;
}

/**
 * Build the engine for a scene; with config "auto" a short bench first measures the validated
 * configurations on this scene's own geometry (bench.autoConfig) and picks one.
 */
export function makeEngineWithConfig(scene: SceneInit): { engine: PhysicsEngine; config: ConfigInfo } {
  let courseFn: CourseFn | undefined;
  if (scene.course) {
    const course = scene.course;
    courseFn = (route, yTop) => [...course[route].map((p) => ({ ...p })), { x: 0, y: yTop, z: 0 }];
  }
  const build = (cfg: Partial<EngineConfig>) =>
    new PhysicsEngine(
      { model: scene.model, route: scene.route, variants: scene.variants, coronaries: scene.coronaries, resp: scene.resp, aorticCourse: courseFn, archBranches: scene.archBranches },
      cfg
    );
  let cfg: Partial<EngineConfig> = {};
  let info: ConfigInfo | null = null;
  if (scene.config === "auto") {
    let c: ReturnType<typeof autoConfig>;
    try {
      c = autoConfig(scene.budgetMs ?? 2, 15, build);
    } catch {
      // the bench loads could not be placed in this scene: measure on the default app geometry instead
      c = autoConfig(scene.budgetMs ?? 2);
    }
    cfg = { substepHz: c.substepHz, segmentScale: c.segmentScale };
    info = { substepHz: c.substepHz, segmentScale: c.segmentScale, predictedMs: c.predictedMs, overBudget: c.overBudget, initMs: c.initMs };
  } else if (scene.config) cfg = scene.config;
  const e = build(cfg);
  if (scene.t0) e.setTime(scene.t0);
  return { engine: e, config: info ?? { substepHz: e.config.substepHz, segmentScale: e.config.segmentScale } };
}

/** Transferable buffers of a frame (node arrays). */
export function frameTransfers(f: PhysicsFrame): ArrayBuffer[] {
  const out: ArrayBuffer[] = [];
  if (f.catheter) out.push(f.catheter.nodes.buffer as ArrayBuffer);
  if (f.wire) out.push(f.wire.nodes.buffer as ArrayBuffer);
  return out;
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
