import { describe, it, expect } from "vitest";
import { cameraBasis, coneBeamCamera, projectPersp, elongation } from "./projection";
import { buildAnatomy, toWorld } from "./anatomy";
import { generateCase } from "./caseGenerator";

const model = () => buildAnatomy(generateCase("proj", { rootSize: "normal", focus: "both" }, "rand"));

function ladWorld(m: ReturnType<typeof buildAnatomy>) {
  const lad = m.vessels.find((v) => v.id === "LAD")!;
  return lad.points.map((p) => toWorld(m, p));
}

describe("cone-beam projection", () => {
  it("projectPersp returns finite coords with positive depth and magnification", () => {
    const cam = coneBeamCamera({ laoRao: 30, cranialCaudal: 20 });
    const q = projectPersp({ x: 5, y: -10, z: 3 }, cam);
    for (const v of [q.x, q.y, q.depth, q.mag]) expect(Number.isFinite(v)).toBe(true);
    expect(q.depth).toBeGreaterThan(0);
    expect(q.mag).toBeGreaterThan(0);
  });

  it("a point closer to the source is magnified more (divergent beam)", () => {
    const cam = coneBeamCamera({ laoRao: 0, cranialCaudal: 0 });
    // forward is -z for AP; source sits on +z. A larger +z is nearer the source.
    const near = projectPersp({ x: 0, y: 0, z: 20 }, cam);
    const far = projectPersp({ x: 0, y: 0, z: -20 }, cam);
    expect(near.depth).toBeLessThan(far.depth);
    expect(near.mag).toBeGreaterThan(far.mag);
  });
});

describe("C-arm convention", () => {
  it("cranial tilts the detector towards the head and puts the tube under the feet", () => {
    const b = cameraBasis({ laoRao: 0, cranialCaudal: 30 });
    // forward points from the tube through the patient to the detector's opposite side
    expect(-b.forward.y).toBeGreaterThan(0.4); // detector direction has +y (cranial)
    const c = cameraBasis({ laoRao: 0, cranialCaudal: -30 });
    expect(-c.forward.y).toBeLessThan(-0.4); // caudal: detector towards the feet
  });
  it("LAO puts the detector on the patient's left", () => {
    expect(-cameraBasis({ laoRao: 30, cranialCaudal: 0 }).forward.x).toBeGreaterThan(0.4);
    expect(-cameraBasis({ laoRao: -30, cranialCaudal: 0 }).forward.x).toBeLessThan(-0.4);
  });
  it("in a cranial view, structures lower in the body project lower on the image, and the image up stays head-wards", () => {
    const b = cameraBasis({ laoRao: 0, cranialCaudal: 30 });
    expect(b.up.y).toBeGreaterThan(0.8);
  });
});

describe("foreshortening (elongation)", () => {
  it("is between 0 and 1 and changes with C-arm angle", () => {
    const m = model();
    const lad = ladWorld(m);
    const e1 = elongation(lad, cameraBasis({ laoRao: 30, cranialCaudal: 30 })); // LAO cranial
    const e2 = elongation(lad, cameraBasis({ laoRao: -30, cranialCaudal: -30 })); // RAO caudal
    for (const e of [e1, e2]) {
      expect(e).toBeGreaterThan(0);
      expect(e).toBeLessThanOrEqual(1.0001);
    }
    expect(Math.abs(e1 - e2)).toBeGreaterThan(0.02); // the projection genuinely differs
  });
});
