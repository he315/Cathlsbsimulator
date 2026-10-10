// ---------------------------------------------------------------------------
// Client, worker host and legacy bridge: the main-thread API in its in-thread
// mode (Node has no module Worker), frame stamping with the patient clock,
// hub reaction channels, and the values the store reads today.
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { PhysicsClient } from "./physicsClient";
import { legacyView } from "./legacyBridge";
import { fixtureAnatomy, fixtureCourse } from "./fixtures";
import type { PhysicsFrame } from "./protocol";
import { VALIDATED_CONFIGS } from "./bench";

const course = {
  femoral: fixtureCourse("femoral", 0).slice(0, -1),
  "radial-right": fixtureCourse("radial-right", 0).slice(0, -1),
  "radial-left": fixtureCourse("radial-left", 0).slice(0, -1),
};

describe("physics client (in-thread)", () => {
  it("steps to the patient clock, stamps frames with it and reports reactions and engagement", () => {
    const model = fixtureAnatomy("normal");
    const phys = PhysicsClient.create({ useWorker: false });
    expect(phys.usesWorker).toBe(false);
    phys.init({ model, route: "femoral", course, archBranches: false, t0: 12.5 });
    phys.loadCatheter("JL4", { facing: [Math.SQRT1_2, 0, -Math.SQRT1_2] });
    const frames: PhysicsFrame[] = [];
    phys.onFrame((f) => frames.push(f));
    let t = 12.5;
    for (let k = 0; k < 30; k++) {
      t += 1 / 15;
      if (k % 5 === 0) phys.command({ kind: "torque", device: "catheter", rad: 0.3 });
      phys.step(t);
    }
    expect(phys.lastError).toBeNull();
    const f = phys.latest()!;
    expect(f.t).toBeCloseTo(t, 2);
    expect(frames.length).toBe(30);
    expect(f.substeps).toBeGreaterThan(0);
    const nodes = phys.latestNodes("catheter")!;
    expect(nodes.length).toBe(3 * f.catheter!.count);
    expect(phys.reactions()[0].device).toBe("catheter");
    expect(f.engagement).not.toBeNull();
    // a stall: the clock jumps 10 s; the solver skips ahead rather than simulating the gap
    phys.step(t + 10);
    expect(phys.latest()!.t).toBeCloseTo(t + 10, 2);
    expect(phys.latest()!.substeps).toBeLessThanOrEqual(31);
  }, 60_000);

  it("with config \"auto\" the host benches at init and reports a validated configuration", () => {
    const phys = PhysicsClient.create({ useWorker: false });
    phys.init({ model: fixtureAnatomy("normal"), route: "femoral", course, archBranches: false, config: "auto" });
    expect(phys.lastError).toBeNull();
    const c = phys.config!;
    expect(VALIDATED_CONFIGS.some((v) => v.segmentScale === c.segmentScale && v.substepHz === c.substepHz)).toBe(true);
    expect(c.predictedMs).toBeGreaterThan(0);
    phys.loadCatheter("JL4");
    phys.step(0.5);
    const f = phys.latest()!;
    expect(f.reactions.length).toBe(1);
    expect(f.catheter!.contactForce.length).toBe(f.catheter!.count);
  }, 60_000);

  it("snapshots round-trip through the client", async () => {
    const model = fixtureAnatomy("normal");
    const phys = PhysicsClient.create({ useWorker: false });
    phys.init({ model, route: "femoral", course, archBranches: false });
    phys.loadCatheter("JR4");
    phys.step(0.5);
    const snap = await phys.snapshot();
    phys.command({ kind: "push", device: "catheter", mm: 10 });
    phys.step(1.5);
    const after = Array.from(phys.latestNodes("catheter")!);
    phys.restore(snap);
    phys.command({ kind: "push", device: "catheter", mm: 10 });
    phys.step(1.5);
    expect(Array.from(phys.latestNodes("catheter")!)).toEqual(after);
  }, 60_000);
});

describe("legacy bridge", () => {
  it("exposes the tip, engagement, control read-outs and polylines the store and renderer use", () => {
    const model = fixtureAnatomy("normal");
    const phys = PhysicsClient.create({ useWorker: false });
    phys.init({ model, route: "femoral", course, archBranches: false });
    phys.loadCatheter("JL4");
    phys.loadWire("J", { advance: 20 });
    phys.step(0.5);
    const v = legacyView(phys.latest()!, model)!;
    expect(v.tip.pos.y).toBeCloseTo(v.tip.height, 6);
    expect(Number.isFinite(v.tip.az)).toBe(true);
    expect(typeof v.engagement.kind).toBe("string");
    expect(v.engagement.message.length).toBeGreaterThan(0);
    expect(v.catheterInBody.length).toBeGreaterThan(10);
    expect(v.catheterRoot.length).toBeGreaterThan(2);
    expect(v.catheterRoot[v.catheterRoot.length - 1]).toEqual(v.catheterInBody[v.catheterInBody.length - 1]);
    expect(v.wire?.kind).toBe("035");
    expect(v.openFraction).toBeGreaterThan(0);
    expect(v.controls.resistance).toBeGreaterThanOrEqual(0);
    expect(v.controls.resistance).toBeLessThanOrEqual(1);
  }, 60_000);
});
