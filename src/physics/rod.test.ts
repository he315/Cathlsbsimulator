// ---------------------------------------------------------------------------
// Rod solver tests: statics against beam theory, energy, stiffness scaling,
// torque transmission, containment in the lumens, valve crossing, nesting and
// exchange, hub reactions, coronary motion, determinism and snapshots.
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { Rod, type RodSpec } from "./rod";
import { RodWorkspace, baseMobility, solveRodIteration, jointForceOnBody } from "./xpbd";
import { makeCatheter, makeWire, catheterSpec, wireSpec, CATHETER_IDS, WIRE_IDS, freeShape } from "./catheterShapes";
import { LumenSet, Region } from "./lumen";
import { RodContacts, DEFAULT_FRICTION } from "./contact";
import { coronaryInputsFromTree, type TreeLike } from "./coronaryLumens";
import { fixtureAnatomy, fixtureCourse } from "./fixtures";
import { qrot } from "./math3";
import * as S from "./scenarios";
import type { PhysicsEngine } from "./engine";
import { innerDeviceSpec } from "./catheterShapes";
import { chooseConfig, VALIDATED_CONFIGS, type BenchReport } from "./bench";

const H = 1 / 120;

function beam(EI: number, L: number, seg: number): Rod {
  const spec: RodSpec = {
    id: "beam",
    length: L + seg,
    radius: 0.5,
    innerRadius: 0,
    EI: () => EI,
    GJ: () => EI / 1.3,
    EA: 1e5,
    rest: (_u, o) => {
      o[0] = 0;
      o[1] = 0;
      o[2] = 0;
    },
    muStatic: 0,
    muKinetic: 0,
    segFine: seg,
    segFineZone: 1e9,
    segCoarse: seg,
  };
  const rod = new Rod(spec, { h: H, dragLat: 2e-6, dragSpin: 2e-7 });
  rod.placeAlong([0, 0, 0, L + seg, 0, 0], L + seg);
  rod.kin[0] = 1;
  return rod;
}

/** Quasi-static solve with a dead load P (−y) at the tip end. */
function loadTip(rod: Rod, P: number, steps = 200): number {
  const ws = new RodWorkspace(rod.n);
  const pred = new Float64Array(6 * rod.n);
  const i = rod.n - 1;
  const t = new Float64Array(3);
  for (let s = 0; s < steps; s++) {
    rod.lambda.fill(0);
    for (let it = 0; it < 2; it++) {
      for (let b = 0; b < rod.n; b++) baseMobility(rod, ws, b);
      pred.fill(0);
      if (it === 0) {
        // force at the tip end = force at the centre plus the moment of the half segment
        qrot(rod.quat, 4 * i, 0, 0, rod.len[i] / 2, t, 0);
        const f = [0, -P, 0, t[1] * 0 - t[2] * -P, t[2] * 0 - t[0] * 0, t[0] * -P - t[1] * 0];
        for (let a = 0; a < 6; a++) {
          let sum = 0;
          for (let b = 0; b < 6; b++) sum += ws.Wp[36 * i + 6 * a + b] * f[b];
          pred[6 * i + a] = H * H * sum;
        }
      }
      solveRodIteration(rod, ws, { h: H, maxMove: 2, maxRot: 0.3 }, pred);
    }
  }
  rod.endPoint(i, 1, t, 0);
  return -t[1];
}

describe("statics", () => {
  it("cantilever tip deflection is within 5% of beam theory (P L³ / 3 EI)", () => {
    for (const seg of [2.5, 5]) {
      const EI = 500, L = 100, P = 0.01;
      const d = loadTip(beam(EI, L, seg), P);
      const analytic = (P * L ** 3) / (3 * EI);
      expect(Math.abs(d / analytic - 1)).toBeLessThan(0.05);
    }
  });

  it("deflection scales inversely with bending stiffness", () => {
    const d1 = loadTip(beam(400, 80, 2.5), 0.01);
    const d2 = loadTip(beam(800, 80, 2.5), 0.01);
    expect(d1 / d2).toBeGreaterThan(1.9);
    expect(d1 / d2).toBeLessThan(2.1);
  });
});

describe("trust region", () => {
  it("multipliers stay matched to the motion taken when the step is clamped (forces are not inflated)", () => {
    // a cantilever bent far from its straight rest shape, relaxed with a tight trust region (default
    // mode "rod": one scale for the step and the multipliers)
    const rod = beam(500, 60, 3);
    for (let i = 1; i < rod.n; i++) rod.pos[3 * i + 1] = 3 * i * Math.sin(0.04 * i);
    const ws = new RodWorkspace(rod.n);
    for (let b = 0; b < rod.n; b++) baseMobility(rod, ws, b);
    const before = rod.pos.slice();
    rod.lambda.fill(0);
    solveRodIteration(rod, ws, { h: H, maxMove: 0.01, maxRot: 0.001 });
    expect(ws.stepScale).toBeLessThan(0.1);
    // displacement of every free body = W (Jᵀ λ) for the multipliers accumulated in this iteration
    const F = new Float64Array(6);
    let worst = 0, largest = 0;
    for (let i = 1; i < rod.n; i++) {
      jointForceOnBody(rod, ws, i, H, F, 0);
      for (let k = 0; k < 3; k++) {
        const moved = rod.pos[3 * i + k] - before[3 * i + k];
        const implied = rod.w[i] * F[k] * H * H;
        largest = Math.max(largest, Math.abs(moved));
        worst = Math.max(worst, Math.abs(moved - implied));
      }
    }
    expect(largest).toBeGreaterThan(0);
    expect(worst).toBeLessThan(1e-9 + 1e-6 * largest);
  });

  it("under a slow push the hub axial force equals the summed wall friction, and a tight trust region does not inflate it", () => {
    const run = (cfg: Record<string, number>) => {
      const eng = S.makeEngine("femoral", "normal", cfg);
      eng.loadCatheter(makeCatheter({ id: "STRAIGHT6F", name: "straight", arcs: [] }), { tipS: eng.lumens.routeLength - 350 });
      eng.step(0.5);
      let ax = 0, fr = 0, n = 0, minScale = 1;
      for (let k = 0; k < 20; k++) {
        eng.command({ kind: "push", device: "catheter", mm: 1 });
        eng.step(0.1);
        minScale = Math.min(minScale, eng.catheter!.ws.stepScale);
        if (k >= 5) {
          ax += eng.catheter!.axial;
          fr += eng.catheter!.contacts.totalFriction;
          n++;
        }
      }
      return { ax: ax / n, fr: fr / n, minScale };
    };
    const base = run({});
    // quasi-static: the hand pushes against wall friction only (the shaft is straight in a straight run)
    expect(base.ax).toBeGreaterThan(0);
    expect(Math.abs(base.ax / base.fr - 1)).toBeLessThan(0.15);
    const tight = run({ maxMove: 0.05, maxRot: 0.01 });
    expect(tight.minScale).toBeLessThan(0.1);
    expect(tight.ax).toBeLessThanOrEqual(base.ax * 1.2);
  }, 60_000);
});

describe("energy", () => {
  it("a rod placed in its rest shape stores no elastic energy", () => {
    const spec = catheterSpec("JL4");
    const rod = new Rod(spec, { h: H, dragLat: 2e-6, dragSpin: 2e-7 });
    rod.placeRest(0, 0, 0, [0, 0, 0, 1]);
    expect(rod.elasticEnergy()).toBeLessThan(1e-6);
  });

  it("released from a straightened shape, a free preformed rod only loses energy and recovers its curve", () => {
    // quasi-static gradient flow: the stored energy can only fall
    const spec = { ...catheterSpec("JR4"), length: 160 };
    const rod = new Rod(spec, { h: H, dragLat: 2e-6, dragSpin: 2e-7 });
    rod.placeAlong([0, 0, 0, 0, -200, 0], 200);
    rod.kin[0] = 1;
    const ws = new RodWorkspace(rod.n);
    // bending and torsion energy (the stretch rows close transient joint gaps opened by the trust region)
    let E = rod.elasticEnergy(false);
    const E0 = E;
    for (let s = 0; s < 240; s++) {
      rod.lambda.fill(0);
      for (let it = 0; it < 2; it++) {
        for (let b = 0; b < rod.n; b++) baseMobility(rod, ws, b);
        solveRodIteration(rod, ws, { h: H, maxMove: 1.5, maxRot: 0.3 });
      }
      const e = rod.elasticEnergy(false);
      expect(e).toBeLessThanOrEqual(E * 1.001 + 1e-9);
      E = e;
    }
    expect(E).toBeLessThan(0.01 * E0);
    // and the joints are closed again: total energy, stretch included, is back near zero
    expect(rod.elasticEnergy(true)).toBeLessThan(0.01 * E0);
  });

  it("every catalogued device has a finite, positive stiffness profile and a drawable free shape", () => {
    for (const id of CATHETER_IDS) {
      const s = catheterSpec(id);
      for (const u of [0, 2, 10, 50, 200, 800]) {
        expect(s.EI(u)).toBeGreaterThan(0);
        expect(s.GJ(u)).toBeGreaterThan(0);
      }
      const pts = freeShape(s.arcs);
      expect(pts.every((p) => Number.isFinite(p.x + p.y + p.z))).toBe(true);
    }
    for (const id of WIRE_IDS) expect(wireSpec(id).EI(500)).toBeGreaterThan(wireSpec(id).EI(1));
  });
});

/** Roll angle of a body's director d1 about the tangent, relative to a reference d1 (rad). */
function rollOf(rod: Rod, i: number, ref: Float64Array): number {
  const t = new Float64Array(3), d1 = new Float64Array(3);
  rod.tangent(i, t, 0);
  qrot(rod.quat, 4 * i, 1, 0, 0, d1, 0);
  const proj = (v: Float64Array) => {
    const k = v[0] * t[0] + v[1] * t[1] + v[2] * t[2];
    const x = v[0] - k * t[0], y = v[1] - k * t[1], z = v[2] - k * t[2];
    const l = Math.hypot(x, y, z) || 1;
    return [x / l, y / l, z / l];
  };
  const a = proj(ref), b = proj(d1);
  const c = a[1] * b[2] - a[2] * b[1], c2 = a[2] * b[0] - a[0] * b[2], c3 = a[0] * b[1] - a[1] * b[0];
  const sin = c * t[0] + c2 * t[1] + c3 * t[2];
  const cos = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return Math.atan2(sin, cos);
}

describe("torque transmission", () => {
  it("hub rotation reaches the tip through the curved femoral route with a measurable lag", () => {
    const eng = S.makeEngine("femoral", "normal");
    const straight = makeCatheter({ id: "STRAIGHT6F", name: "straight 6 F", arcs: [] });
    eng.loadCatheter(straight, { tipS: eng.lumens.routeLength - 60 });
    eng.step(0.5);
    const rod = eng.catheter!.rod;
    const ref = new Float64Array(3);
    qrot(rod.quat, 4 * (rod.n - 1), 1, 0, 0, ref, 0);
    const hub0 = eng.catheter!.hubRoll;
    eng.command({ kind: "torque", device: "catheter", rad: 1.5 });
    const samples: { t: number; hub: number; tip: number }[] = [];
    for (let k = 0; k < 40; k++) {
      eng.step(0.05);
      samples.push({ t: eng.t, hub: eng.catheter!.hubRoll - hub0, tip: rollOf(rod, rod.n - 1, ref) });
    }
    // while the hand turns (1.5 rad at 2π rad/s takes 0.24 s), the tip trails the hub
    const during = samples[3];
    expect(during.tip).toBeLessThan(during.hub);
    // the tip catches up: at the end it has turned most of the way
    const end = samples[samples.length - 1];
    expect(end.tip).toBeGreaterThan(0.8 * 1.5);
    expect(end.tip).toBeLessThan(1.05 * 1.5);
    // lag: time for the tip to reach 63% of the hub rotation after the hand started
    const t63 = samples.find((s) => s.tip > 0.63 * 1.5)!.t - samples[0].t + 0.05;
    expect(t63).toBeGreaterThan(0.05);
  }, 60_000);

  it("a released wound catheter turns its hub back (spin-back) and unloads", () => {
    const eng = S.makeEngine("femoral", "normal");
    S.parkOverWire(eng, "JL4", { tipBack: 90 });
    S.advanceToRoot(eng);
    S.withdrawWire(eng);
    for (let i = 0; i < 10; i++) {
      eng.command({ kind: "torque", device: "catheter", rad: 0.4 });
      eng.step(0.2);
    }
    const wound = eng.catheter!.torsion;
    const hub = eng.catheter!.hubRoll;
    expect(Math.abs(wound)).toBeGreaterThan(0.3);
    eng.command({ kind: "grip", hand: "right", device: null });
    eng.command({ kind: "grip", hand: "left", device: null });
    eng.step(3);
    expect(Math.sign(eng.catheter!.hubRoll - hub)).toBe(-Math.sign(wound));
    expect(Math.abs(eng.catheter!.torsion)).toBeLessThan(0.5 * Math.abs(wound));
  }, 60_000);
});

/** Distance from a point to a polyline of `count` nodes (mm). */
function distanceToPolyline(nodes: ArrayLike<number>, count: number, p: ArrayLike<number>): number {
  let best = Infinity;
  for (let i = 0; i + 1 < count; i++) {
    const ax = nodes[3 * i], ay = nodes[3 * i + 1], az = nodes[3 * i + 2];
    const bx = nodes[3 * i + 3] - ax, by = nodes[3 * i + 4] - ay, bz = nodes[3 * i + 5] - az;
    const ll = bx * bx + by * by + bz * bz;
    let t = ll > 0 ? ((p[0] - ax) * bx + (p[1] - ay) * by + (p[2] - az) * bz) / ll : 0;
    t = Math.max(0, Math.min(1, t));
    best = Math.min(best, Math.hypot(ax + bx * t - p[0], ay + by * t - p[1], az + bz * t - p[2]));
  }
  return best;
}

/** Largest wall penetration seen by any segment before projection (mm). */
function maxEscape(eng: PhysicsEngine): number {
  let m = 0;
  for (const d of [eng.catheter, eng.wire]) {
    if (!d) continue;
    for (let i = d.start; i < d.rod.n; i++) if (!d.rod.kin[i]) m = Math.max(m, -d.contacts.slack[i]);
  }
  return m;
}

describe("lumens and contact", () => {
  it("a catheter pushed up from the femoral artery reaches the root without leaving the lumen", () => {
    const eng = S.makeEngine("femoral", "normal");
    const straight = makeCatheter({ id: "STRAIGHT6F", name: "straight 6 F", arcs: [] });
    eng.loadCatheter(straight, { tipS: eng.lumens.skinS + 150 });
    let transient = 0;
    let residual = 0;
    let reached = false;
    const hit = { slack: 0, nx: 0, ny: 0, nz: 0, region: 0, lumen: 0, s: 0, floor: false };
    for (let k = 0; k < 400 && !reached; k++) {
      eng.command({ kind: "push", device: "catheter", mm: 6 });
      eng.step(0.1);
      // within a substep a segment may cross the wall before it is projected back
      transient = Math.max(transient, maxEscape(eng));
      // after the substep every segment centre is inside a lumen
      const c = eng.catheter!;
      for (let i = 1; i < c.rod.n; i++) {
        eng.lumens.query(c.rod.pos[3 * i], c.rod.pos[3 * i + 1], c.rod.pos[3 * i + 2], c.rod.radius[i], c.contacts.flags, null, 0, hit);
        residual = Math.max(residual, -hit.slack);
      }
      reached = eng.classify()!.regionCode === Region.Root;
    }
    expect(reached).toBe(true);
    expect(residual).toBeLessThan(0.05);
    expect(transient).toBeLessThan(2);
  }, 120_000);

  it("the sinuses accept a pigtail: the loop sits in the root above the closed valve", () => {
    const eng = S.makeEngine("femoral", "normal");
    S.parkOverWire(eng, "PIG", { tipBack: 90 });
    S.advanceToRoot(eng, 26);
    S.withdrawWire(eng);
    eng.step(1);
    const r = eng.classify()!;
    expect(r.inLV).toBe(false);
    expect([Region.Root, Region.Ascending]).toContain(r.regionCode);
    // every distal node of the loop lies above the valve and inside the root radius
    const nodes = eng.readDevice(eng.catheter!).nodes;
    const n = nodes.length / 3;
    for (let i = n - 12; i < n; i++) {
      expect(nodes[3 * i + 1]).toBeGreaterThan(-1);
      expect(Math.hypot(nodes[3 * i], nodes[3 * i + 2])).toBeLessThan(eng.lumens.root.R + 1);
    }
  }, 120_000);

  it("the closed valve stops a J tip but a straight wire pushed at its centre crosses into the ventricle", () => {
    const crosses = (id: string) => {
      // a wire held 40 mm above the valve on the root axis, pushed straight down
      const L = new LumenSet({ route: "femoral", model: fixtureAnatomy("normal"), aorticCourse: fixtureCourse });
      const spec = { ...wireSpec(id), length: 120 };
      const rod = new Rod(spec, { h: H, dragLat: 2e-6, dragSpin: 2e-7 });
      rod.placeAlong([0, 160, 0, 0, 0, 0], 120 + 40 + 2);
      rod.kin[0] = 1;
      const ws = new RodWorkspace(rod.n);
      const ct = new RodContacts(rod.n);
      ct.crossRadius = L.root.rOrifice * 1.2;
      for (let s = 0; s < 360; s++) {
        rod.pos[1] -= 0.25; // the hand advances 30 mm/s
        rod.prevPos.set(rod.pos);
        rod.prevQuat.set(rod.quat);
        rod.lambda.fill(0);
        ct.detect(rod, L, 0);
        for (let it = 0; it < 2; it++) {
          ct.mobility(rod, ws, H, 0);
          solveRodIteration(rod, ws, { h: H, maxMove: 1.5, maxRot: 0.3 }, null, 0);
          ct.detect(rod, L, 0);
          if (it === 0) ct.after(rod, ws, H, 0, DEFAULT_FRICTION, false);
        }
        ct.after(rod, ws, H, 0, DEFAULT_FRICTION);
      }
      const tip = new Float64Array(3);
      rod.endPoint(rod.n - 1, 1, tip, 0);
      return ct.flags.crossedValve && tip[1] < -3;
    };
    expect(crosses("STRAIGHT")).toBe(true);
    expect(crosses("J")).toBe(false);
  }, 60_000);
});

describe("radial route and breathing", () => {
  it("a radial universal catheter over a J wire reaches the root from the right radial artery", () => {
    const eng = S.makeEngine("radial-right", "normal");
    eng.loadCatheter("TIG", { tipS: eng.lumens.skinS + 120 });
    eng.loadWire("J", { advance: 40 });
    let reached = false;
    const seen = new Set<number>();
    for (let k = 0; k < 200 && !reached; k++) {
      eng.command({ kind: "push", device: "catheter", mm: 6 });
      eng.step(0.1);
      const r = eng.classify()!;
      seen.add(r.regionCode);
      reached = r.regionCode === Region.Root;
    }
    expect(reached).toBe(true);
    // by way of the arm: radial, brachial, subclavian, then the ascending aorta
    for (const reg of [Region.Radial, Region.Brachial, Region.Subclavian]) expect(seen.has(reg)).toBe(true);
    // the narrow arm route resists more than the femoral route does
    expect(eng.catheter!.axial).toBeGreaterThan(0.2);
  }, 120_000);

  it("deep inspiration straightens subclavian tortuosity in the arm route", () => {
    const L = new LumenSet({ route: "radial-right", model: fixtureAnatomy("normal"), aorticCourse: fixtureCourse, tortuousSubclavian: true, resp: 0 });
    const wiggle = () => {
      // deviation of the subclavian/innominate centre line from its chord
      const t = L.access;
      const idx: number[] = [];
      for (let i = 0; i < t.n; i++) if (t.region[i] === Region.Subclavian || t.region[i] === Region.Innominate) idx.push(i);
      const a = idx[0], b = idx[idx.length - 1];
      let dev = 0;
      for (const i of idx) {
        const f = (t.cum[i] - t.cum[a]) / (t.cum[b] - t.cum[a]);
        const cx = t.pts[3 * a] + (t.pts[3 * b] - t.pts[3 * a]) * f;
        const cy = t.pts[3 * a + 1] + (t.pts[3 * b + 1] - t.pts[3 * a + 1]) * f;
        const cz = t.pts[3 * a + 2] + (t.pts[3 * b + 2] - t.pts[3 * a + 2]) * f;
        dev += Math.hypot(t.pts[3 * i] - cx, t.pts[3 * i + 1] - cy, t.pts[3 * i + 2] - cz);
      }
      return dev / idx.length;
    };
    const expiration = wiggle();
    L.updateResp(1);
    const inspiration = wiggle();
    expect(inspiration).toBeLessThan(expiration);
  });
});

describe("nested rods and exchange", () => {
  it("a wire inside the catheter straightens its preformed curve; the curve re-forms when the wire is pulled", () => {
    const eng = S.makeEngine("femoral", "normal");
    // in the wide, straight descending aorta, where the curve is free to take its shape
    eng.loadCatheter("JR4", { tipS: eng.lumens.routeLength - 380 });
    // the wire leads by 40 mm, so its stiff part lies through the catheter's curve
    eng.loadWire("J", { advance: 40 });
    eng.step(1);
    const rod = eng.catheter!.rod;
    const bend = () => {
      // turn between the shaft 60 mm from the tip and the tip
      const t1 = new Float64Array(3), t2 = new Float64Array(3);
      let j = rod.n - 1;
      while (j > 0 && rod.u[j] < 60) j--;
      rod.tangent(j, t1, 0);
      rod.tangent(rod.n - 1, t2, 0);
      return Math.acos(Math.max(-1, Math.min(1, t1[0] * t2[0] + t1[1] * t2[1] + t1[2] * t2[2])));
    };
    const withWire = bend();
    S.withdrawWire(eng);
    const without = bend();
    expect(without).toBeGreaterThan(withWire + 0.3);
    // the free JR4 curve turns the tip about 90° from the shaft
    expect(without).toBeGreaterThan(1.0);
  }, 60_000);

  it("exchange over an exchange-length wire left in the root: the new catheter tracks the wire", () => {
    const eng = S.makeEngine("femoral", "normal");
    // the wire is led well into the root, where it curls and is held by the walls
    S.parkOverWire(eng, "JR4", { tipBack: 60, wireLead: 70, wire: "J260" });
    S.advanceToRoot(eng, 30);
    // hold the wire and withdraw the catheter out of the patient. Taking the slack out of the catheter
    // shaft feeds wire out of its tip (the wire follows the catheter's path, which gets shorter), so the
    // operator watches the wire tip and pulls the wire back when it starts to advance
    eng.command({ kind: "pin", device: "wire035", on: true });
    const y0 = eng.readWire()!.tip[1];
    for (let k = 0; k < 70; k++) {
      eng.command({ kind: "push", device: "catheter", mm: -15 });
      const y = eng.readWire()!.tip[1];
      if (y > y0 + 4) eng.command({ kind: "push", device: "wire035", mm: -Math.min(10, y - y0) });
      eng.step(0.25);
    }
    eng.removeCatheter();
    eng.step(0.2);
    const kept = eng.readWire()!.tip;
    // the wire tip has stayed in the root or low ascending aorta
    expect(kept[1]).toBeLessThan(60);
    expect(Math.hypot(kept[0], kept[2])).toBeLessThan(eng.lumens.root.R + 2);
    // thread a new catheter on the wire at the sheath and advance it over the held wire
    eng.loadCatheter("JL4", { tipS: eng.lumens.skinS - 25 });
    eng.command({ kind: "pin", device: "wire035", on: true });
    let tracked = 0, samples = 0, reached = false;
    for (let k = 0; k < 220 && !reached; k++) {
      eng.command({ kind: "push", device: "catheter", mm: 6 });
      eng.step(0.1);
      const tip = eng.readDevice(eng.catheter!).tip;
      const w = eng.readWire()!;
      samples++;
      if (distanceToPolyline(w.nodes, w.count, tip) < 3) tracked++;
      reached = tip[1] < 50 && Math.hypot(tip[0], tip[2]) < 20;
    }
    expect(reached).toBe(true);
    expect(tracked / samples).toBeGreaterThan(0.9);
  }, 120_000);
});

describe("coronary lumens", () => {
  it("track the beating heart: lumens move with the contraction supplied at each clock time", () => {
    // a two-sample vessel whose distal sample rides the heart (w = 1)
    const tree: TreeLike = {
      heart: {},
      vessels: [{ name: "LAD", side: "left", samples: [{ w: 0 }, { w: 1 }, { w: 1 }], radii: [1.8, 1.7, 1.6], pathMm: [0, 10, 20] }],
    };
    const samplePos = (_h: never, s: never, m?: { contraction: number }) => {
      const smp = s as unknown as { w: number };
      const e = m?.contraction ?? 0;
      return { x: 20 + 10 * smp.w, y: 10 - 8 * smp.w * e, z: -10 };
    };
    const L = new LumenSet({ route: "femoral", model: fixtureAnatomy("normal"), aorticCourse: fixtureCourse, coronaries: coronaryInputsFromTree(tree, samplePos, { contraction: 0 }) });
    const hit = { slack: 0, nx: 0, ny: 0, nz: 0, region: 0, lumen: 0, s: 0, floor: false };
    L.query(30, 10, -10, 0.1, { crossedValve: false }, null, 0, hit);
    expect(hit.slack).toBeGreaterThan(0);
    L.moveCoronaries(coronaryInputsFromTree(tree, samplePos, { contraction: 1, heartShift: { x: 0, y: -10, z: 0 } }));
    L.query(30, 10, -10, 0.1, { crossedValve: false }, null, 0, hit);
    expect(hit.slack).toBeLessThan(0);
    // the distal sample moved by contraction (−8) plus the heart's breathing shift beyond the root ((1 − 0.45)·−10)
    L.query(30, 10 - 8 - 5.5, -10, 0.1, { crossedValve: false }, null, 0, hit);
    expect(hit.slack).toBeGreaterThan(0);
  });
});

describe("determinism and snapshots", () => {
  function run(eng: PhysicsEngine) {
    for (let k = 0; k < 20; k++) {
      eng.command({ kind: "push", device: "catheter", mm: k % 3 === 0 ? -2 : 3 });
      eng.command({ kind: "torque", device: "catheter", rad: k % 2 ? 0.2 : -0.1 });
      eng.step(0.1);
    }
  }
  function start() {
    const eng = S.makeEngine("femoral", "normal");
    eng.loadCatheter("JL4", { tipS: eng.lumens.routeLength - 50 });
    return eng;
  }

  it("identical command logs give identical node buffers", () => {
    const a = start(), b = start();
    run(a);
    run(b);
    expect(Array.from(a.readDevice(a.catheter!).nodes)).toEqual(Array.from(b.readDevice(b.catheter!).nodes));
  }, 60_000);

  it("restoring a snapshot and replaying the same commands reproduces the same state", () => {
    const a = start();
    a.step(0.3);
    const snap = a.snapshot();
    run(a);
    const first = Array.from(a.readDevice(a.catheter!).nodes);
    a.restore(snap);
    run(a);
    expect(Array.from(a.readDevice(a.catheter!).nodes)).toEqual(first);
  }, 60_000);

  it("snapshots carry the hand state: replay after a released hub is exact", () => {
    const a = start();
    run(a);
    // let go of the catheter: its hub turns back and slides out
    a.command({ kind: "grip", hand: "right", device: null });
    a.step(0.2);
    const snap = a.snapshot();
    a.step(1);
    const first = Array.from(a.readDevice(a.catheter!).nodes);
    a.restore(snap);
    a.step(1);
    expect(Array.from(a.readDevice(a.catheter!).nodes)).toEqual(first);
  }, 60_000);

  it("snapshots restore a non-catalogue catheter and an inner device with its free part, exactly", () => {
    const eng = S.makeEngine("femoral", "normal");
    eng.loadCatheter(makeCatheter({ id: "STRAIGHT6F", name: "straight", arcs: [] }), { tipS: eng.lumens.routeLength - 80 });
    eng.loadWire(innerDeviceSpec(), { advance: 10, slot: "balloon" });
    eng.step(0.3);
    const replay = () => {
      for (let k = 0; k < 10; k++) {
        eng.command({ kind: "push", device: "balloon", mm: 3 });
        eng.command({ kind: "push", device: "catheter", mm: k % 2 ? 1 : -1 });
        eng.step(0.1);
      }
      return [...Array.from(eng.readDevice(eng.catheter!).nodes), ...Array.from(eng.readWire()!.nodes)];
    };
    const snap = eng.snapshot();
    const first = replay();
    eng.restore(snap);
    expect(replay()).toEqual(first);
    // the snapshot survives a structured clone (as through the worker) and restores in a fresh engine
    // once the custom spec is registered there
    const other = S.makeEngine("femoral", "normal");
    expect(() => other.restore(structuredClone(snap))).toThrow(/registerSpec/);
    other.registerSpec(makeCatheter({ id: "STRAIGHT6F", name: "straight", arcs: [] }));
    other.restore(structuredClone(snap));
    eng.restore(snap);
    expect(Array.from(other.readDevice(other.catheter!).nodes)).toEqual(Array.from(eng.readDevice(eng.catheter!).nodes));
  }, 60_000);

  it("wire properties change behaviour: a stiff wire straightens the curve more than a standard J", () => {
    const bend = (id: string) => {
      const eng = S.makeEngine("femoral", "normal");
      eng.loadCatheter("JL4", { tipS: eng.lumens.routeLength - 40 });
      eng.loadWire(id, { advance: -2 });
      eng.step(0.5);
      return eng.catheter!.rod.elasticEnergy();
    };
    // a stiffer wire holds the catheter further from its preformed shape (more stored energy)
    expect(bend("SUPPORT")).toBeGreaterThan(bend("J"));
    void makeWire;
  }, 60_000);
});

describe("feedback channels", () => {
  it("the read-out carries per-node wall loads, stick-slip events and the wedged flag", () => {
    const eng = S.makeEngine("femoral", "normal");
    eng.loadCatheter("JR4", { tipS: eng.lumens.routeLength - 40, facing: S.LAO_LEFT });
    eng.step(0.5);
    const r0 = eng.readDevice(eng.catheter!);
    expect(r0.contactForce.length).toBe(r0.count);
    let sum = 0;
    for (let i = 0; i < r0.count; i++) sum += r0.contactForce[i];
    expect(Math.abs(sum - eng.catheter!.contacts.totalNormal)).toBeLessThan(1e-3 + 1e-3 * sum);
    // turning a loaded catheter in the root: contacts stick, then break free
    eng.command({ kind: "push", device: "catheter", mm: 6 });
    eng.step(0.3);
    for (let k = 0; k < 40; k++) {
      eng.command({ kind: "torque", device: "catheter", rad: 0.06 });
      eng.step(0.05);
    }
    const r1 = eng.readDevice(eng.catheter!);
    expect(r1.slipEvents).toBeGreaterThan(r0.slipEvents);
    expect(r1.stuckContacts + r1.slidingContacts).toBeGreaterThan(0);
    expect(r1.reaction.wedged).toBe((eng.classify()!.dampingRisk) > 0.6);
  }, 60_000);
});

describe("bench configuration", () => {
  const report = (ms: number): BenchReport => ({ substepHz: 120, segmentScale: 1, fps: 15, cases: [{ name: "x", bodies: 90, substeps: 240, msPerSubstep: ms / 8, msPerFrame: ms }] });
  it("chooses only validated configurations, the finest that fits the budget", () => {
    expect(chooseConfig(report(1.5))).toMatchObject({ segmentScale: 1, substepHz: 120, overBudget: false });
    expect(chooseConfig(report(2.3))).toMatchObject({ segmentScale: 1.2, overBudget: false });
    expect(chooseConfig(report(2.6))).toMatchObject({ segmentScale: 1.4, overBudget: false });
    const c = chooseConfig(report(5));
    expect(c.overBudget).toBe(true);
    expect(VALIDATED_CONFIGS.some((v) => v.segmentScale === c.segmentScale && v.substepHz === c.substepHz)).toBe(true);
  });
});
