// Crossing the aortic valve in the rod model (diag-lv-aorta-task): the valve's systolic opening
// (lumen.ts VALVE_OPENING, driven by the patient engine's aortic valve flow) lets a pigtail led by a J
// wire drop into the ventricle; the difficult valve's small eccentric opening does not, and a straight
// wire aimed at that opening does. With no valve setting the closed floor is unchanged (rod.test.ts).
//   npx vitest run src/physics/valveCrossing.test.ts
import { describe, expect, it } from "vitest";
import * as S from "./scenarios";
import { Rod } from "./rod";
import { RodWorkspace, solveRodIteration } from "./xpbd";
import { wireSpec } from "./catheterShapes";
import { LumenSet, VALVE_OPENING, valveControlInput } from "./lumen";
import { RodContacts, DEFAULT_FRICTION } from "./contact";
import { fixtureAnatomy, fixtureCourse } from "./fixtures";
import { PatientEngine } from "../simulation/patient/engine";

const FACINGS: [number, number, number][] = [S.LAO_LEFT, S.PATIENT_LEFT, [0, 0, 1], [0, 0, -1], [-1, 0, 0]];

/**
 * One start: a pigtail over a J wire (leading by 25 mm) brought to the root, then advanced gently for up to
 * 20 s of patient time, the catheter 12 mm/s and the wire fed half as fast again so that it leads into a
 * shallow loop on the valve (the scripted hand). The valve opens with the patient engine's aortic flow.
 * Returns the seconds to a crossing (the catheter flagged across and its tip 3 mm below the valve), or -1.
 */
function pigtailStart(k: number, difficult: boolean): number {
  const eng = S.makeEngine("femoral", "normal");
  const pat = new PatientEngine({ seed: "cross-" + k });
  pat.advance(2 + k * 0.17);
  S.parkOverWire(eng, "PIG", { tipBack: 90, facing: FACINGS[k % 5], wireLead: 25 });
  S.advanceToRoot(eng, 30);
  for (let i = 0; i < 20 * 60; i++) {
    pat.advance(1 / 60);
    if (i % 6 === 0) {
      eng.command({ kind: "push", device: "catheter", mm: 1.2 });
      if (eng.wire) eng.command({ kind: "push", device: eng.wire.slot, mm: 1.8 });
    }
    eng.step(1 / 60, { valve: { open: pat.aorticValveOpening(), difficult } });
    const c = eng.catheter!;
    if (c.contacts.flags.crossedValve && eng.readDevice(c).tip[1] < -3) return i / 60;
  }
  return -1;
}

/** A wire held 40 mm above the valve's opening and pushed down at it (the operator aims the catheter at the opening), the valve opening each systole. */
function aimedWire(id: string, difficult: boolean): { crossed: boolean; tipY: number } {
  const H = 1 / 120;
  const L = new LumenSet({ route: "femoral", model: fixtureAnatomy("normal"), aorticCourse: fixtureCourse });
  L.setValve({ open: 0, difficult });
  const v = L.valve!;
  const spec = { ...wireSpec(id), length: 120 };
  const rod = new Rod(spec, { h: H, dragLat: 2e-6, dragSpin: 2e-7 });
  rod.placeAlong([v.cx, 160, v.cz, v.cx, 0, v.cz], 120 + 40 + 2);
  rod.kin[0] = 1;
  const ws = new RodWorkspace(rod.n);
  const ct = new RodContacts(rod.n);
  // as the engine sets it with a valve: pressing does not open a valve wider than its opening
  ct.crossRadius = Math.min(L.root.rOrifice * 1.2, v.fullR);
  const rr = 60 / 70;
  for (let s = 0; s < 1080; s++) {
    const ph = ((s * H) % rr) / rr;
    L.setValve({ open: ph < 0.35 ? Math.sin((Math.PI * ph) / 0.35) : 0, difficult });
    if (s < 360) rod.pos[1] -= 0.25; // the hand advances 30 mm/s for 3 s
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
    // what the engine does after each substep (engine.ts crossThroughOpening)
    if (!ct.flags.crossedValve && L.rodThroughOpening(rod.pos, rod.n, rod.n - 10)) ct.flags.crossedValve = true;
    ct.updateValveFlag(rod, L, 0);
  }
  const tip = new Float64Array(3);
  rod.endPoint(rod.n - 1, 1, tip, 0);
  return { crossed: ct.flags.crossedValve, tipY: tip[1] };
}

describe("the valve's systolic opening", () => {
  it("is off by default and carried through the coronary motion (valveControlInput)", () => {
    const L = new LumenSet({ route: "femoral", model: fixtureAnatomy("normal"), aorticCourse: fixtureCourse });
    expect(L.valve).toBeNull();
    expect(L.valveOpenRadius()).toBe(0);
    L.moveCoronaries([valveControlInput({ open: 0.5, areaCm2: null, difficult: false })]);
    expect(L.valve).not.toBeNull();
    expect(L.valveOpenRadius()).toBeCloseTo(0.5 * L.valve!.fullR, 9);
    // a stenotic valve opens to the radius of its area, off the axis
    L.setValve({ open: 1, areaCm2: 0.7 });
    expect(L.valve!.fullR).toBeCloseTo(Math.sqrt(70 / Math.PI), 6);
    expect(Math.hypot(L.valve!.cx, L.valve!.cz)).toBeGreaterThan(0);
    L.setValve(null);
    expect(L.valve).toBeNull();
    // the difficult valve's full opening is the share VALVE_OPENING gives of the normal one
    L.setValve({ open: 1, difficult: true });
    const d = L.valve!.fullR;
    L.setValve({ open: 1 });
    expect(d / L.valve!.fullR).toBeCloseTo(VALVE_OPENING.difficultRadiusShare, 6);
  });

  it("a pigtail over a J wire crosses a normal valve in at least 3 of 5 starts within 20 s; with the difficult-valve opening it does not", () => {
    const normal = [0, 1, 2, 3, 4].map((k) => pigtailStart(k, false));
    const crossed = normal.filter((t) => t >= 0 && t <= 20);
    expect(crossed.length, `normal valve: ${normal.map((t) => t.toFixed(1)).join(", ")}`).toBeGreaterThanOrEqual(3);
    const difficult = [0, 1, 2, 3, 4].map((k) => pigtailStart(k, true));
    expect(difficult.filter((t) => t >= 0), `difficult valve: ${difficult.join(", ")}`).toEqual([]);
  }, 120_000);

  it("a straight wire aimed at the difficult valve's opening crosses it; a J wire aimed the same way does not", () => {
    const straight = aimedWire("STRAIGHT", true);
    expect(straight.crossed).toBe(true);
    expect(straight.tipY).toBeLessThan(-3);
    const j = aimedWire("J", true);
    expect(j.crossed).toBe(false);
  }, 60_000);
});
