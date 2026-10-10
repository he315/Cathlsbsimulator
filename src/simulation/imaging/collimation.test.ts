import { describe, expect, it } from "vitest";
import { openShare, shuttersFromPairs, wedgesFor } from "./collimation";
import { DoseTracker, bodyFromHabitus } from "../dose";
import { steadyState } from "../../render/xray/adrc";

describe("collimation", () => {
  it("maps the controls to ImageParams", () => {
    expect(shuttersFromPairs(0.2, 0.6)).toEqual([0.2, 0.2, 0.45, 0.45]);
    expect(wedgesFor({ insertion: 0, angleDeg: 30 })).toEqual([]);
    const w = wedgesFor({ insertion: 0.25, angleDeg: 90 })[0];
    expect(w.offset).toBeCloseTo(0.5, 9);
    expect(w.angle).toBeCloseTo(Math.PI / 2, 9);
    expect(openShare([0.1, 0.1, 0.2, 0.2])).toBeCloseTo(0.8 * 0.6, 9);
  });

  it("closing the shutters lowers KAP in proportion to the open area, Ka,r unchanged", () => {
    const st = steadyState({ mode: "fluoro", fieldMm: 250 }, 21);
    const run = (sh: [number, number, number, number]) => {
      const d = new DoseTracker();
      for (let i = 0; i < 150; i++)
        d.expose({ adrc: st, dtS: 1 / 15, geometry: { cArm: { laoRao: 0, cranialCaudal: 0 }, iso: { x: 0, y: 0, z: 0 }, fieldMm: 250, shutters: sh }, body: bodyFromHabitus(1) });
      return d.totals;
    };
    const open = run([0, 0, 0, 0]);
    const sh = shuttersFromPairs(0.2, 0.15);
    const closed = run(sh);
    expect(closed.kapGyCm2.total).toBeLessThan(open.kapGyCm2.total);
    expect(closed.kapGyCm2.total / open.kapGyCm2.total).toBeCloseTo(openShare(sh), 3);
    expect(closed.karMGy.total).toBeCloseTo(open.karMGy.total, 9);
  });
});
