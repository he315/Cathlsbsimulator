import { describe, it, expect } from "vitest";
import { buildRoute, stepWire, stepCatheter, initialWire, segmentAt, type WireState, type Route } from "./procedure";
import { generateCase } from "./caseGenerator";

const radialCase = (variants: string[] = []) => generateCase("wtest", { access: "radial-right", forceVariants: variants as never }, "rand");
const femoralCase = (variants: string[] = []) => generateCase("wtest-f", { access: "femoral", forceVariants: variants as never }, "rand");

const step = (w: WireState, r: Route, advance: number, o: Partial<Parameters<typeof stepWire>[2]> = {}) => {
  const { events: _e, ...n } = stepWire(w, r, { advance, torque: 0, breath: false, hydrophilic: false, ...o }, 0.033);
  return n;
};

function advanceTo(route: Route, w: WireState, segId: string, o: Partial<Parameters<typeof stepWire>[2]> = {}): WireState {
  let guard = 0;
  while (segmentAt(route, w.pos).id !== segId && guard++ < 3000) w = step(w, route, 0.8, o);
  return w;
}

describe("buildRoute", () => {
  it("radial route runs from the radial artery to the root with real lengths", () => {
    const route = buildRoute("radial-right", radialCase());
    const ids = route.segments.map((s) => s.id);
    expect(ids[0]).toBe("radial");
    expect(ids).toContain("brachial");
    expect(ids).toContain("subclavian");
    expect(ids[ids.length - 1]).toBe("root");
    const radial = route.segments.find((s) => s.id === "radial")!;
    // the forearm radial artery is centimetres long, not millimetres
    expect(radial.end - radial.start).toBeGreaterThan(120);
    expect(route.totalLength).toBeGreaterThan(550);
    expect(route.aortaStart).toBeLessThan(route.totalLength);
    expect(route.junction?.label).toBe("descending aorta");
  });

  it("a radial-loop case inserts a loop segment that needs the tip aimed", () => {
    const plain = buildRoute("radial-right", radialCase());
    const route = buildRoute("radial-right", radialCase(["radial-loop"]));
    const loop = route.segments.find((s) => s.id === "loop");
    expect(loop?.maneuver).toBe("torque");
    expect(typeof loop?.targetHeading).toBe("number");
    expect(route.totalLength - plain.totalLength).toBeGreaterThan(20);
  });

  it("the femoral route goes through the iliacs and the arch, with the left subclavian as its wrong turn", () => {
    const route = buildRoute("femoral", femoralCase(["tortuous-iliac"]));
    const ids = route.segments.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(["iliac", "abd", "desc", "arch", "asc", "root"]));
    expect(route.junction?.label).toBe("left subclavian artery");
    expect(route.segments.find((s) => s.id === "iliac")?.maneuver).toBe("torque");
  });
});

describe("stepWire: torque, manoeuvres and hazards", () => {
  it("pushing blind into the loop buckles and makes no progress; aiming crosses it", () => {
    const route = buildRoute("radial-right", radialCase(["radial-loop"]));
    let w = advanceTo(route, initialWire(), "loop", { vasodilator: 1 });
    const before = w.pos;
    for (let i = 0; i < 40; i++) w = step(w, route, 0.6, { vasodilator: 1 });
    expect(w.pos - before).toBeLessThan(2);
    expect(w.buckle).toBeGreaterThan(0.3);
    expect(w.aimed).toBe(false);
    // back off, aim, then advance
    w = step(w, route, -6, { vasodilator: 1 });
    const target = route.segments.find((s) => s.id === "loop")!.targetHeading!;
    for (let i = 0; i < 300 && Math.abs(w.heading - target) > 0.25; i++) {
      const { events: _e, ...n } = stepWire(w, route, { advance: 0, torque: 0.04, breath: false, hydrophilic: false, vasodilator: 1 }, 0.033);
      w = n;
    }
    for (let i = 0; i < 30; i++) w = step(w, route, 0, { vasodilator: 1 });
    w = advanceTo(route, w, "brachial", { vasodilator: 1 });
    expect(segmentAt(route, w.pos).id).toBe("brachial");
  });

  it("a tortuous subclavian will not pass without a deep breath", () => {
    const route = buildRoute("radial-right", radialCase(["tortuous-subclavian"]));
    let w = advanceTo(route, initialWire(), "subclavian", { vasodilator: 1 });
    const stuck = w.pos;
    for (let i = 0; i < 60; i++) w = step(w, route, 0.6, { vasodilator: 1 });
    expect(w.pos - stuck).toBeLessThan(3);
    for (let i = 0; i < 20; i++) w = step(w, route, -0.5, { vasodilator: 1 }); // relieve the buckle
    for (let i = 0; i < 200 && segmentAt(route, w.pos).id === "subclavian"; i++) w = step(w, route, 0.6, { breath: true, vasodilator: 1 });
    expect(segmentAt(route, w.pos).id).not.toBe("subclavian");
  });

  it("an unaimed arm wire turns down the descending aorta in AP; in LAO it finds the ascending aorta", () => {
    const route = buildRoute("radial-right", radialCase());
    let w = advanceTo(route, initialWire(), "innom", { vasodilator: 1 });
    for (let i = 0; i < 300 && w.branch === "main" && !w.reachedAorta; i++) w = step(w, route, 0.8, { vasodilator: 1, laoDeg: 0 });
    expect(w.branch).toBe("wrong");
    expect(w.reachedAorta).toBe(false);
    // withdraw above the junction: back on the route
    for (let i = 0; i < 100 && w.branch === "wrong"; i++) w = step(w, route, -2, { vasodilator: 1 });
    expect(w.branch).toBe("main");
    for (let i = 0; i < 400 && !w.reachedAorta && w.branch === "main"; i++) w = step(w, route, 0.8, { vasodilator: 1, laoDeg: 30 });
    expect(w.reachedAorta).toBe(true);
  });

  it("a femoral J wire rounds the arch; a hydrophilic wire pointed away enters the left subclavian", () => {
    const route = buildRoute("femoral", femoralCase());
    let w = initialWire();
    for (let i = 0; i < 2000 && !w.reachedRoot; i++) w = step(w, route, 0.8);
    expect(w.reachedRoot).toBe(true);
    let h = initialWire();
    h = { ...h, heading: 1.2, cmdHeading: 1.2 };
    for (let i = 0; i < 2000 && h.branch === "main" && !h.reachedAorta; i++) h = step(h, route, 0.8, { hydrophilic: true });
    expect(h.branch).toBe("wrong");
  });

  it("rough handling raises radial spasm; an intra-arterial vasodilator relaxes it", () => {
    const route = buildRoute("radial-right", radialCase(["radial-loop"]));
    let w = advanceTo(route, initialWire(), "loop", { vasodilator: 1 });
    for (let i = 0; i < 80; i++) w = step(w, route, 1.0, { anxiety: 0.8 });
    expect(w.spasm).toBeGreaterThan(0.4);
    let a = w,
      b = w;
    for (let i = 0; i < 900; i++) {
      a = step(a, route, 0, { anxiety: 0.8 });
      b = step(b, route, 0, { anxiety: 0.8, vasodilator: 1 });
    }
    expect(b.spasm).toBeLessThan(a.spasm * 0.5);
  });

  it("a hydrophilic wire forced against resistance can perforate a branch", () => {
    const route = buildRoute("radial-right", radialCase(["radial-loop"]));
    let w = advanceTo(route, initialWire(), "loop", { vasodilator: 1 });
    w = { ...w, heading: -2, cmdHeading: -2 };
    // block the loop even for a hydrophilic wire by spasm, then push with a certain draw
    w = { ...w, spasm: 1 };
    const r = stepWire(w, route, { advance: 2, torque: 0, breath: false, hydrophilic: true, rand: 0 }, 0.033);
    expect(r.perforation).toBe(true);
    expect(r.events.some((e) => e.kind === "perforation")).toBe(true);
  });

  it("withdrawing is free and reduces position", () => {
    const route = buildRoute("radial-right", radialCase());
    let w = advanceTo(route, initialWire(), "brachial", { vasodilator: 1 });
    const before = w.pos;
    w = step(w, route, -5);
    expect(w.pos).toBeLessThan(before);
  });
});

describe("stepCatheter", () => {
  it("the catheter cannot lead the wire through the arm", () => {
    const route = buildRoute("radial-right", radialCase());
    let w = initialWire();
    for (let i = 0; i < 100; i++) w = step(w, route, 0.8, { vasodilator: 1 });
    const c = stepCatheter({ pos: 0, resistance: 0, message: "" }, w, route, 500, 2.0, 2.6);
    expect(c.pos).toBeLessThanOrEqual(w.pos - 14.9);
    expect(c.message).toMatch(/Lead with the wire/);
  });

  it("a catheter bigger than a spastic radial artery is gripped", () => {
    const route = buildRoute("radial-right", radialCase());
    let w = initialWire();
    for (let i = 0; i < 200; i++) w = step(w, route, 0.8, { vasodilator: 1 });
    const c = stepCatheter({ pos: 20, resistance: 0, message: "" }, { ...w, spasm: 0.8 }, route, 5, 2.0, 2.4);
    expect(c.resistance).toBeGreaterThan(0.85);
    expect(c.pos).toBe(20);
  });
});
