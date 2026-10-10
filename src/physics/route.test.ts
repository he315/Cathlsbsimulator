// ---------------------------------------------------------------------------
// The radial loop in the rod model (diag-route-wire-led-radial).
//   npx vitest run src/physics/route.test.ts
//
// The loop of the 'radial-loop' variant is in the physics lumen (lumen.ts RADIAL_LOOP), on the same
// circle the access route draws (src/simulation/access/route.ts), lifted out of its plane so that its
// two crossings are separate lumens. A J wire pushed 60 mm stalls in it; a hydrophilic wire passes. A
// 6 Fr catheter catches at it until the loop is straightened (balloon-assisted tracking in the lab),
// which the lab sends to the solver with the coronary motion (loopControlInput) and which shortens the
// route. The engine, which builds its lumen from the model and its own flags, gets the loop from the
// model (withRouteVariants). Every threshold is a MODEL PARAMETER
// (docs/realism/facts/pkg-diag-route-wire-led-radial.md).
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import * as S from "./scenarios";
import { PhysicsEngine } from "./engine";
import { LOOP_CONTROL, LumenSet, RADIAL_LOOP, Region, loopControlInput, queryTube, radialLoopFrame, radialLoopPoints, routeVariantsOf, withRouteVariants, type LumenHit } from "./lumen";
import { wireSpec } from "./catheterShapes";
import { buildAnatomy } from "../simulation/anatomy";
import { MP_ROUTE, buildRoute3D } from "../simulation/access/route";
import type { AnatomyVariant, Vec3 } from "../types";

const T = 120_000;
const hit: LumenHit = { slack: 0, nx: 0, ny: 0, nz: 0, region: 0, lumen: 0, s: 0, floor: false };
/** The five starts: the wire tip this far short of the loop's first sample (mm), the catheter 4 mm behind it. */
const STARTS = [0, 2, 4, 6, 8];

const caseOf = (variants: AnatomyVariant[]) => S.caseFor("radial-right", "normal", variants);

function engine(variants: AnatomyVariant[] = ["radial-loop"], viaModel = true): PhysicsEngine {
  const c = caseOf(variants);
  const model = viaModel ? withRouteVariants(buildAnatomy(c), variants) : buildAnatomy(c);
  return new PhysicsEngine({ model, route: "radial-right", variants, archBranches: true }, {});
}

/** The wire tip's route arclength, followed from the last answer (so the loop's crossing is not mistaken). */
function wireTracker(e: PhysicsEngine) {
  let seg = -1;
  return () => {
    const w = e.readWire()!;
    seg = queryTube(e.lumens.access, w.tip[0], w.tip[1], w.tip[2], 0, seg, hit);
    return hit.s;
  };
}

/** The catheter over a wire short of the loop, the wire pushed 60 mm (3 mm per 0.1 s) and let settle: the wire tip's place relative to the loop's last sample (mm). */
function pushThroughLoop(wire: string, shortMm: number): { pastExit: number; e: PhysicsEngine } {
  const e = engine();
  const span = e.lumens.radialLoopSpan!.slice() as [number, number];
  e.loadCatheter("JR4", { tipS: span[0] - shortMm - 4 });
  e.loadWire(wire, { advance: 4 });
  e.step(0.3);
  const tip = wireTracker(e);
  tip();
  for (let i = 0; i < 20; i++) {
    e.command({ kind: "push", device: wire === "WORKHORSE" ? "wire014" : "wire035", mm: 3 });
    e.step(0.1);
    tip();
  }
  e.step(1);
  return { pastExit: tip() - span[1], e };
}

const pt = (a: ArrayLike<number>, i: number): Vec3 => ({ x: a[3 * i], y: a[3 * i + 1], z: a[3 * i + 2] });
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe("the radial loop in the physics lumen", () => {
  it("exists only on an arm route with the variant (from the options or the model), on the route's circle, lifted out of its plane", () => {
    const c = caseOf(["radial-loop"]);
    const model = buildAnatomy(c);
    expect(new LumenSet({ route: "radial-right", model }).radialLoopSpan).toBeNull();
    expect(new LumenSet({ route: "femoral", model, radialLoop: true }).radialLoopSpan).toBeNull();
    const L = new LumenSet({ route: "radial-right", model, radialLoop: true });
    const span = L.radialLoopSpan!;
    expect(span).not.toBeNull();
    // one turn of the shared circle, a little longer for its rise
    expect(span[1] - span[0]).toBeGreaterThan(2 * Math.PI * RADIAL_LOOP.loopR);
    expect(span[1] - span[0]).toBeLessThan(2 * Math.PI * RADIAL_LOOP.loopR + 12);
    // the side channel: an ordinary model carries no route variant; the copy carries the loop and nothing else
    expect(routeVariantsOf(model)).toEqual([]);
    const m2 = withRouteVariants(model, ["radial-loop", "tortuous-subclavian"]);
    expect(routeVariantsOf(m2)).toEqual(["radial-loop"]);
    expect(withRouteVariants(model, ["tortuous-subclavian"])).toBe(model);
    expect(new LumenSet({ route: "radial-right", model: m2 }).radialLoopSpan).toEqual(span);

    // the plain route's junction (its first brachial sample) and direction: where both loops start
    const plain = new LumenSet({ route: "radial-right", model }).access;
    let jb = -1;
    for (let i = 0; i < plain.n && jb < 0; i++) if (plain.region[i] === Region.Brachial) jb = i;
    const q0 = pt(plain.pts, jb);
    const a = pt(plain.pts, jb - 1), b = pt(plain.pts, jb + 1);
    const l = dist(a, b);
    const tan = { x: (b.x - a.x) / l, y: (b.y - a.y) / l, z: (b.z - a.z) / l };
    const { side, up } = radialLoopFrame(tan);
    const planar = radialLoopPoints(q0, tan, side);
    // the access route draws the same circle: its radius is the lumen's, and its loop samples are the planar circle's
    expect(MP_ROUTE.loopR).toBe(RADIAL_LOOP.loopR);
    const r3 = buildRoute3D("radial-right", c, model);
    const drawn = r3.path.pts.filter((_, i) => r3.path.region[i] === -10);
    expect(drawn.length).toBe(RADIAL_LOOP.n - 1);
    drawn.forEach((p, k) => expect(dist(p, planar[k])).toBeLessThan(1e-9));
    // the physics samples are the same circle, risen by liftMm over the turn
    const t = L.access;
    const loopIdx: number[] = [];
    for (let i = 0; i < t.n; i++) if (t.region[i] === Region.RadialLoop) loopIdx.push(i);
    expect(loopIdx.length).toBe(RADIAL_LOOP.n - 1);
    loopIdx.forEach((i, k) => {
      const h = (RADIAL_LOOP.liftMm * (k + 1)) / RADIAL_LOOP.n;
      const p = pt(t.pts, i);
      expect(dist({ x: p.x - up.x * h, y: p.y - up.y * h, z: p.z - up.z * h }, planar[k])).toBeLessThan(1e-9);
      expect(t.rad[i]).toBe(RADIAL_LOOP.lumenR);
    });
  });

  it("its two crossings are separate lumens: their walls stay more than a 0.035 in wire's width apart", () => {
    const L = new LumenSet({ route: "radial-right", model: buildAnatomy(caseOf(["radial-loop"])), radialLoop: true });
    const t = L.access;
    const span = L.radialLoopSpan!;
    let minGap = Infinity;
    for (let i = 0; i < t.n; i++) {
      if (t.cum[i] < span[0] - 12 || t.cum[i] > span[0] + 4) continue;
      for (let k = 0; k < t.n; k++) {
        if (t.cum[k] < span[1] - 4 || t.cum[k] > span[1] + 12) continue;
        minGap = Math.min(minGap, dist(pt(t.pts, i), pt(t.pts, k)) - t.rad[i] - t.rad[k]);
      }
    }
    expect(minGap).toBeGreaterThan(2 * wireSpec("J").radius);
  });

  it("straightening shortens the route and rides with the coronary motion and the snapshot; a route without the loop ignores it", () => {
    const model = buildAnatomy(caseOf(["radial-loop"]));
    const L = new LumenSet({ route: "radial-right", model, radialLoop: true });
    const L0 = L.routeLength;
    L.moveCoronaries([loopControlInput(1)]);
    expect(L.loopStraighten).toBe(1);
    expect(L0 - L.routeLength).toBeGreaterThan(20);
    const st = L.coronaryState();
    expect(st.some((x) => x.vessel === LOOP_CONTROL)).toBe(true);
    L.setLoopStraighten(0);
    expect(L.routeLength).toBeCloseTo(L0, 6);
    L.restoreCoronaryState(st);
    expect(L.loopStraighten).toBe(1);
    const plain = new LumenSet({ route: "radial-right", model });
    const P0 = plain.routeLength;
    expect(plain.setLoopStraighten(1)).toBe(false);
    expect(plain.routeLength).toBe(P0);
  });

  it("the engine gets the loop from the model it is given (withRouteVariants), and not without it", () => {
    expect(engine(["radial-loop"], true).lumens.radialLoopSpan).not.toBeNull();
    expect(engine(["radial-loop"], false).lumens.radialLoopSpan).toBeNull();
  });
});

describe("wires and the catheter at the loop", () => {
  it("in 'radial-loop' a J wire pushed 60 mm stalls at the loop; a hydrophilic wire passes in at least 3 of 5 starts", () => {
    const j = STARTS.map((d) => pushThroughLoop("J", d).pastExit);
    const h = STARTS.map((d) => pushThroughLoop("HYDRO", d).pastExit);
    // the J tip stays inside the loop (short of its exit) in every start
    for (const x of j) expect(x).toBeLessThan(0);
    expect(h.filter((x) => x > 0).length).toBeGreaterThanOrEqual(3);
  }, T);

  it("a 0.014 in coronary wire, which the module text gives to negotiate loops, passes in at least 3 of 5 starts where the J stalls in all 5 (RADIAL_LOOP.frictionFine)", () => {
    const j = STARTS.map((d) => pushThroughLoop("J", d).pastExit);
    const fine = STARTS.map((d) => pushThroughLoop("WORKHORSE", d).pastExit);
    for (const x of j) expect(x).toBeLessThan(0);
    expect(fine.filter((x) => x > 0).length).toBeGreaterThanOrEqual(3);
    // the fine wire's contact in the loop is reported with the loop's fine region, a 0.035 in wire's with the loop's own
    const L = new LumenSet({ route: "radial-right", model: buildAnatomy(caseOf(["radial-loop"])), radialLoop: true });
    const t = L.access;
    let i = 0;
    while (t.region[i] !== Region.RadialLoop) i++;
    const at = (r: number) => {
      L.query(t.pts[3 * i], t.pts[3 * i + 1], t.pts[3 * i + 2], r, { crossedValve: false }, null, 0, hit);
      return hit.region;
    };
    expect(at(wireSpec("WORKHORSE").radius)).toBe(Region.RadialLoopFine);
    expect(at(wireSpec("J").radius)).toBe(Region.RadialLoop);
    expect(at(0)).toBe(Region.RadialLoop);
  }, T);

  it("a 6 Fr catheter over the hydrophilic wire catches at the loop; with the loop straightened it passes", () => {
    const run = (straighten: boolean) => {
      const { e, pastExit } = pushThroughLoop("HYDRO", 2);
      expect(pastExit).toBeGreaterThan(0);
      for (let i = 0; i < 15; i++) {
        e.command({ kind: "push", device: "wire035", mm: 3 });
        e.step(0.1);
      }
      let seg = -1;
      const ctip = () => {
        const c = e.readDevice(e.catheter!);
        seg = queryTube(e.lumens.access, c.tip[0], c.tip[1], c.tip[2], 0, seg, hit);
        return hit.s;
      };
      ctip();
      for (let i = 0; i < 30; i++) {
        e.command({ kind: "push", device: "catheter", mm: 3 });
        e.step(0.1, straighten ? { coronaries: [loopControlInput(Math.min(1, i / 20))] } : undefined);
        ctip();
      }
      e.step(0.5);
      return ctip() - e.lumens.radialLoopSpan![1];
    };
    expect(run(false)).toBeLessThan(0);
    expect(run(true)).toBeGreaterThan(10);
  }, T);

  it("the narrow-J has a 1.5 mm J (the standard 3 mm); the 300 cm wire is 3000 mm long", () => {
    const jr = (id: string) => {
      const a = wireSpec(id).arcs[0];
      return a.len / ((a.turn * Math.PI) / 180);
    };
    expect(jr("NARROWJ")).toBeCloseTo(1.5, 6);
    expect(jr("J")).toBeCloseTo(3, 6);
    expect(wireSpec("J300").length).toBe(3000);
  });
});
