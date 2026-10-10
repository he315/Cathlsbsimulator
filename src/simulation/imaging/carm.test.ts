import { describe, expect, it } from "vitest";
import { CArmDrive, CARM_PARAMS, TableDrive, travelTime } from "./carm";

const run = (d: CArmDrive, seconds: number, dt = 1 / 60) => {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) d.step(dt);
};

describe("C-arm dynamics", () => {
  it("accelerates, is capped at the speed limit and stops on release (dead-man)", () => {
    const d = new CArmDrive();
    d.setCommandedVelocity(100, 0);
    d.step(0.1);
    // after 0.1 s the speed is limited by the acceleration, not the command
    expect(d.state.vLao).toBeCloseTo(CARM_PARAMS.accel * 0.1, 6);
    run(d, 2);
    expect(d.state.vLao).toBeCloseTo(CARM_PARAMS.maxSpeed, 6);
    d.setCommandedVelocity(0, 0);
    const at = d.state.laoRao;
    run(d, 1);
    expect(d.state.vLao).toBe(0);
    // braking distance v^2 / 2a
    expect(Math.abs(d.state.laoRao - at - (CARM_PARAMS.maxSpeed ** 2) / (2 * CARM_PARAMS.accel))).toBeLessThan(0.15);
  });

  it("a view change takes physical time (AP to LAO 45 / CRA 25 is not instant)", () => {
    const d = new CArmDrive();
    d.driveTo({ laoRao: 45, cranialCaudal: 25 });
    d.step(0.5);
    expect(d.state.laoRao).toBeLessThan(10);
    let t = 0.5;
    while ((Math.abs(d.state.laoRao - 45) > 1e-9 || Math.abs(d.state.cranialCaudal - 25) > 1e-9) && t < 20) {
      d.step(1 / 60);
      t += 1 / 60;
    }
    expect(d.state.laoRao).toBeCloseTo(45, 9);
    expect(d.state.cranialCaudal).toBeCloseTo(25, 9);
    // the slower axis (45 deg) sets the time; within a frame of the rest-to-rest kinematics
    expect(Math.abs(t - travelTime(45))).toBeLessThan(0.1);
    expect(t).toBeGreaterThan(3);
  });

  it("releasing a memory key stops the arm part-way (drive only while held)", () => {
    const d = new CArmDrive();
    d.driveTo({ laoRao: -30, cranialCaudal: 0 });
    run(d, 1);
    d.driveTo(null);
    run(d, 2);
    expect(d.state.vLao).toBe(0);
    expect(d.state.laoRao).toBeLessThan(-2);
    expect(d.state.laoRao).toBeGreaterThan(-30);
  });

  it("angles off the 5 degree grid are reachable", () => {
    const d = new CArmDrive();
    d.setCommandedVelocity(8, -8);
    run(d, 0.9);
    d.setCommandedVelocity(0, 0);
    run(d, 1);
    const a = d.angles;
    expect(a.laoRao % 5).not.toBeCloseTo(0, 1);
    expect(Math.abs(a.cranialCaudal) % 5).not.toBeCloseTo(0, 1);
  });

  it("stops at the mechanical limits", () => {
    const d = new CArmDrive({ laoRao: 85, cranialCaudal: 40 });
    d.setCommandedVelocity(15, 15);
    run(d, 3);
    expect(d.state.laoRao).toBe(90);
    expect(d.state.cranialCaudal).toBe(45);
    expect(d.state.vLao).toBe(0);
  });

  it("is frame-rate independent", () => {
    const a = new CArmDrive();
    const b = new CArmDrive();
    a.driveTo({ laoRao: 37.3, cranialCaudal: -21.7 });
    b.driveTo({ laoRao: 37.3, cranialCaudal: -21.7 });
    run(a, 1.6, 1 / 120);
    run(b, 1.6, 1 / 15);
    expect(Math.abs(a.state.laoRao - b.state.laoRao)).toBeLessThan(0.05);
  });
});

describe("table", () => {
  it("pans with inertia and brakes when released, height moves at its speed", () => {
    const t = new TableDrive();
    t.setCommandedVelocity(40, 0);
    t.step(0.1);
    expect(t.state.vx).toBeCloseTo(15, 6); // accel 150 mm/s^2
    for (let i = 0; i < 60; i++) t.step(1 / 60);
    expect(t.state.vx).toBeCloseTo(40, 6);
    t.setCommandedVelocity(0, 0);
    const x = t.state.x;
    for (let i = 0; i < 60; i++) t.step(1 / 60);
    expect(t.state.vx).toBe(0);
    expect(t.state.x).toBeGreaterThan(x);
    t.setHeightCommand(1);
    for (let i = 0; i < 60; i++) t.step(1 / 60);
    expect(t.state.height).toBeCloseTo(25, 6);
  });
});
