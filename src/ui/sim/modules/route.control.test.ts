// ---------------------------------------------------------------------------
// The route controls against frames that arrive late (diag-route-wire-led-radial): with the worker, the
// physics frame the module polls can be from before the newest wire action. A stale frame must not undo
// the hub's state (removeWire then a frame with the wire still in it), and a refused injection is logged
// as such, not as a fill to the tip.
//   npx vitest run src/ui/sim/modules/route.control.test.ts
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { RouteControl, type RouteHost } from "./route";

/** A host whose physics frame is set by the test (the worker's late frame). */
function fakeHost(frame: { wireId: string | null }) {
  let t = 0;
  const physics = {
    active: true,
    startAt: "sheath" as const,
    bat: null,
    radialLoopStraighten: 0,
    routeMechanics: () => ({ wireId: frame.wireId, wireInLv: false }),
    removeWireFromCatheter: () => undefined,
    chooseWire: () => true,
  };
  const host = {
    physics,
    injector: { flush: () => undefined, primed: 0 },
    engine: { vitals: () => ({ hr: 70 }) },
    store: { getState: () => ({ caseData: { id: "x", scenarioId: "diag-wire-leads-to-root" } }), setState: () => undefined },
    wall: () => t,
    aspirate: () => undefined,
  };
  return { host: host as unknown as RouteHost, tick: (dt: number) => (t += dt) };
}

describe("the route controls with late frames", () => {
  it("a wire taken out before the first poll stays out while the frames still show it in", () => {
    const frame = { wireId: "J" as string | null };
    const { host } = fakeHost(frame);
    const rc = new RouteControl(host);
    rc.removeWire();
    expect(rc.connection).toBe("open");
    rc.poll(0.25); // the worker's frame from before the action
    expect(rc.connection).toBe("open");
    rc.aspirate();
    expect(rc.connection).toBe("aspirated");
    frame.wireId = null; // the frame catches up
    rc.poll(0.25);
    rc.connect(true);
    expect(rc.connection).toBe("connected");
    expect(rc.score().connectedWithoutAspiration).toBe(0);
  });

  it("a wire put in is not taken out by a frame from before it went in; a real change after the frames catch up still counts", () => {
    const frame = { wireId: null as string | null };
    const { host } = fakeHost(frame);
    const rc = new RouteControl(host);
    rc.poll(0.25);
    expect(rc.chooseWire("J")).toBe(true);
    rc.poll(0.25); // stale: no wire yet
    expect(rc.connection).toBe("wire-in");
    frame.wireId = "J";
    rc.poll(0.25);
    expect(rc.connection).toBe("wire-in");
    frame.wireId = null; // the physics takes the wire out itself (an exchange)
    rc.poll(0.25);
    expect(rc.connection).toBe("open");
  });

  it("a frame that never shows the action is taken as it comes after the wait", () => {
    const frame = { wireId: "J" as string | null };
    const { host } = fakeHost(frame);
    const rc = new RouteControl(host);
    rc.removeWire();
    for (let i = 0; i < 8; i++) rc.poll(0.25);
    expect(rc.connection).toBe("wire-in");
  });

  it("a refused injection is logged as a refusal, not as a fill to the tip", () => {
    const { host } = fakeHost({ wireId: "J" });
    const rc = new RouteControl(host);
    expect(rc.allowInjection()).toBe(false);
    const last = rc.steps[rc.steps.length - 1];
    expect(last.step).toBe("inject-refused");
    expect(rc.steps.some((s) => s.step === "fill")).toBe(false);
  });
});
