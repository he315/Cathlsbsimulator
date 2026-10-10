// access-cx-endovascular-control, after review: the branch blush on the bleeding groin's own sheath injection, the
// live hazards read from the learner's own records (a wrong sheath flush, a buckle in a long case's capped log),
// the physical note on a refused device, and the crossover image kept between frames.
//   npx vitest run src/simulation/session/modules/endovascular.review.test.ts
import { describe, expect, it } from "vitest";
import { newCaseSession, type CaseSession } from "../caseSession";
import { crossover } from "../autopilot";
import { MP_ENDO } from "../../access/endovascular";
import { endovascularOf, type EndovascularModule } from "./endovascular";

function run(s: CaseSession, sec: number): void {
  s.wait(sec);
  s.runPending();
}
function untilOnset(s: CaseSession, m: EndovascularModule): void {
  for (let t = 0; t <= 240 && !m.state.bleed && !m.state.leg; t += 5) run(s, 5);
  expect(!!m.state.bleed || !!m.state.leg).toBe(true);
}
function crossTo(m: EndovascularModule, toS: number): void {
  const c = m.state.cross!;
  const j = c.route.junction!;
  for (let i = 0; i < 4000 && c.wire.pos < j.atS - 4; i++) {
    m.actions.crossWire(1, 0);
    m.actions.crossCatheter(1);
  }
  for (let i = 0; i < 200; i++) m.actions.crossCatheter(1);
  for (let i = 0; i < 600 && Math.abs(m.state.cross!.wire.heading - j.targetHeading) > 0.05; i++) {
    const d = j.targetHeading - m.state.cross!.wire.cmdHeading;
    m.actions.crossWire(0, Math.sign(d) * Math.min(0.03, Math.abs(d)));
  }
  for (let i = 0; i < 6000 && m.state.cross!.wire.pos < toS; i++) m.actions.crossWire(1, 0);
  for (let i = 0; i < 4000 && m.state.cross!.catheterPos < c.route3d.bifurcationS + 20; i++) m.actions.crossCatheter(1);
}
function balloonOnHole(s: CaseSession, m: EndovascularModule): number {
  crossover(s, "left");
  s.runPending();
  expect(m.actions.startCrossover("j").ok).toBe(true);
  const hole = m.actions.holeS()!;
  crossTo(m, Math.min(hole + 80, m.state.cross!.route.totalLength - 2));
  expect(m.actions.angiogram().ok).toBe(true);
  m.actions.deviceTo(hole);
  expect(m.actions.inflate("low").ok).toBe(true);
  return hole;
}

describe("the branch blush on the bleeding groin's own injection", () => {
  for (const id of ["bleed-iea-branch", "bleed-lcia-branch", "bleed-distal-pinhole"])
    it(`${id}: the sheath puff and femoral angiogram of the right groin show the blush until the balloon is up`, () => {
      const { session: s } = newCaseSession({ scenario: id });
      const m = endovascularOf(s)!;
      untilOnset(s, m);
      const right = s.sites.find((x) => x.side === "right")!;
      const leak = m.actions.branchExtravasation(right.id);
      expect(leak).not.toBeNull();
      expect(Number.isFinite(leak!.p.x) && Number.isFinite(leak!.p.y) && Number.isFinite(leak!.p.z)).toBe(true);
      expect(Math.hypot(leak!.t.x, leak!.t.y, leak!.t.z)).toBeCloseTo(1, 5);
      // a branch hole is not on the route's centre line nor in the common femoral artery
      expect(m.actions.extravasationOnRoute(right.id)).toBeNull();
      expect(m.actions.groinExtravasation(right.id)).toBeNull();
      balloonOnHole(s, m);
      const left = s.sites.find((x) => x.side === "left")!;
      expect(m.actions.branchExtravasation(left.id)).toBeNull();
      expect(m.actions.branchExtravasation(right.id)).toBeNull();
    });
});

describe("live hazards from the learner's own records", () => {
  /** The planned femoral sheath made un-aspirated, as a sheath never aspirated since it went in. */
  const dirty = (s: CaseSession) => {
    const sh = s.activeSite.sheath!;
    sh.aspirated = false;
    sh.aspiratedForNext = false;
  };

  it("a side arm flushed before aspirating can send a clot down the leg; a clot flag alone (a catheter through a dirty sheath, the team's) never does", () => {
    let hits = 0;
    for (let k = 0; k < 12; k++) {
      const { session: s } = newCaseSession({ seed: `endo-flush-${k}`, access: "femoral", start: "closure" });
      const m = endovascularOf(s)!;
      dirty(s);
      expect(s.flushSheathSide("fresh")).toBe(true);
      expect(s.decisions().find((d) => d.id === "sheath-aspirate-then-flush")).toMatchObject({ correct: false });
      run(s, 5);
      // a second wrong flush at the same sheath is the same record: no second draw
      const pending = !!m.state.pendingLeg;
      s.flushSheathSide("fresh");
      run(s, MP_ENDO.legOnsetS + 10);
      if (m.state.leg) {
        hits++;
        expect(pending).toBe(true);
        expect(m.state.leg.lesion.cause).toBe("embolus");
        expect(m.state.leg.source).toBe("technique");
      }
    }
    expect(hits).toBeGreaterThan(0);
    expect(hits).toBeLessThan(12);
    for (let k = 0; k < 12; k++) {
      const { session: s } = newCaseSession({ seed: `endo-flush-${k}`, access: "femoral", start: "closure" });
      s.activeSite.sheath!.clot = true;
      run(s, MP_ENDO.legOnsetS + 20);
      expect(endovascularOf(s)!.state.leg, `seed ${k}`).toBeNull();
    }
  });

  it("a buckle is still read after the case log has passed its cap", () => {
    let hits = 0;
    for (let k = 0; k < 6; k++) {
      const { session: s } = newCaseSession({ seed: `endo-buckle-${k}`, access: "femoral", start: "closure" });
      const m = endovascularOf(s)!;
      // the wire in the common iliac artery of the femoral route, where it buckles
      s.wire = { ...s.wire, pos: 60 };
      for (let i = 0; i < 400; i++) s.logEntry("event", `Filler line ${i}.`);
      run(s, 5);
      expect(s.log.length).toBeLessThanOrEqual(300);
      for (let i = 0; i < 120; i++) {
        s.logEntry("event", "The wire buckled.");
        s.logEntry("event", `Between ${i}.`);
      }
      run(s, 5);
      if (m.state.pendingLeg || m.state.leg) hits++;
    }
    expect(hits).toBeGreaterThan(0);
  });
});

describe("the panel's note and the crossover image", () => {
  it("a stent refused by the 6 Fr sheath says so physically; the ledger keeps the reason", () => {
    const { session: s } = newCaseSession({ scenario: "bleed-external-iliac" });
    const m = endovascularOf(s)!;
    untilOnset(s, m);
    const hole = balloonOnHole(s, m);
    m.actions.deviceTo(hole + 10);
    const r = m.actions.deploy("covered-be", "main");
    expect(r.verdict?.refusedBy).toBe("sheath");
    expect(m.state.note).toBe("The stent will not pass the 6 Fr sheath.");
  });

  it("draw() is the same object while nothing it shows changes, and a new one after the wire moves", () => {
    const { session: s } = newCaseSession({ scenario: "bleed-external-iliac" });
    const m = endovascularOf(s)!;
    untilOnset(s, m);
    balloonOnHole(s, m);
    const a = m.actions.draw();
    expect(m.actions.draw()).toBe(a);
    m.actions.crossWire(-1, 0);
    const b = m.actions.draw();
    expect(b).not.toBe(a);
    expect(b!.wire.pos).toBeLessThan(a!.wire.pos);
    m.actions.deflate();
    expect(m.actions.draw()!.balloon.inflated).toBe(false);
  });
});
