// ---------------------------------------------------------------------------
// Catheter rest shapes against real catheter silhouettes traced in the
// pre-contrast first frames of the CoronaryDominance library (traces.json,
// built by trace.ts and select.ts after visual QC). The comparison method is
// in shapeError.ts; the numbers are in docs/realism/wave2/I3.md.
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import qc from "./qc-decisions.json";
import { HAVE_TRACES, TRACES, FITTED_ORIENTATION, LEFT_FAMILY, RIGHT_FAMILY, evaluate, familyShapes, heldOutOrientation, splitByPatient, studyOf } from "./calibrate";
import { alignShapes, project, NO_ORIENTATION, type P2 } from "./shapeError";
import { MM_PER_PX } from "./select";

const T = 600_000;

// traces.json comes from real frames and is not in the repository: without it these groups are skipped
describe.skipIf(!HAVE_TRACES)("real catheter silhouettes (traces.json)", () => {
  it("holds exactly the visually accepted traces, tip first, in mm at the library 6F scale", () => {
    const acc = new Set([...qc.LCA.accepted, ...qc.RCA.accepted]);
    expect(TRACES.length).toBe(acc.size);
    expect(TRACES.filter((t) => t.artery === "LCA").length).toBe(qc.LCA.accepted.length);
    expect(TRACES.filter((t) => t.artery === "RCA").length).toBe(qc.RCA.accepted.length);
    expect(MM_PER_PX).toBeCloseTo(2 / 6.5, 6);
    for (const t of TRACES) {
      expect(acc.has(t.id)).toBe(true);
      expect(t.mm.length).toBeGreaterThanOrEqual(61); // at least the 60 mm compared, 1 mm spacing
      for (let i = 1; i < t.mm.length; i++) {
        const d = Math.hypot(t.mm[i][0] - t.mm[i - 1][0], t.mm[i][1] - t.mm[i - 1][1]);
        // 1 mm along the traced path; the chord across a corner of the path is a little shorter
        expect(d).toBeGreaterThan(0.8);
        expect(d).toBeLessThan(1.05);
      }
    }
    // the per-run catheter width agrees with the 6F scale (median 6.5 px over the library, S0 facts)
    const w = TRACES.map((t) => t.widthPx).filter((x): x is number => x !== null).sort((a, b) => a - b);
    const med = w[Math.floor(w.length / 2)];
    expect(med).toBeGreaterThan(5.5);
    expect(med).toBeLessThan(7.5);
  });
});

describe.skipIf(!HAVE_TRACES)("shape error method", () => {
  // the left trace whose distal 25 mm turns most (a Judkins left tip hooked into the left main)
  const turn = (m: P2[]) => {
    const a = Math.atan2(m[1][1] - m[0][1], m[1][0] - m[0][0]), b = Math.atan2(m[26][1] - m[25][1], m[26][0] - m[25][0]);
    return Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a)));
  };
  const real = TRACES.filter((t) => t.artery === "LCA")
    .map((t) => t.mm as P2[])
    .sort((x, y) => turn(y) - turn(x))[0];
  it("recovers an in-plane rotation and a shift exactly; it sees a straightened tip clearly and a 20% size change only weakly", () => {
    const th = (17 * Math.PI) / 180;
    const moved: P2[] = real.map(([x, y]) => [x * Math.cos(th) - y * Math.sin(th) + 12, x * Math.sin(th) + y * Math.cos(th) - 7]);
    const rigid = alignShapes(real, moved).error;
    expect(rigid).toBeLessThan(0.1);
    // a 20% larger copy of the same curve: with free rotation and shift this costs only 0.5-0.9 mm over
    // 60 mm on the library traces (a known weakness of the metric, docs/realism/wave2/I3.md)
    const big: P2[] = real.map(([x, y]) => [1.2 * x, 1.2 * y]);
    const e = alignShapes(real, big).error;
    expect(e).toBeGreaterThan(0.4);
    expect(e).toBeGreaterThan(5 * rigid);
    // the curve with its distal 25 mm straightened is far off
    const straight: P2[] = real.map((p, i) => (i < 25 ? [real[25][0] + (real[25][0] - real[26][0]) * (25 - i), real[25][1] + (real[25][1] - real[26][1]) * (25 - i)] : p));
    expect(alignShapes(real, straight).error).toBeGreaterThan(1);
  });

  it("projects with the renderer's C-arm convention: the patient's left is image right in AP and points at the viewer in LAO 90; cranial angulation foreshortens the vertical", () => {
    // a point on the patient's left (+x) is on the image right in AP, and less so in LAO 90 (it points at the viewer)
    const p = [[10, 0, 0]] as [number, number, number][];
    expect(project(p, 0, 0, 0)[0][0]).toBeCloseTo(10, 6);
    expect(Math.abs(project(p, 0, 90, 0)[0][0])).toBeLessThan(1e-6);
    // a superior point moves up the image in AP and less in a 30 degree cranial view
    const q = [[0, 10, 0]] as [number, number, number][];
    expect(project(q, 0, 0, 0)[0][1]).toBeCloseTo(10, 6);
    expect(project(q, 0, 0, 30)[0][1]).toBeCloseTo(10 * Math.cos(Math.PI / 6), 6);
  });
});

describe.skipIf(!HAVE_TRACES)("engaged Judkins shapes against the real silhouettes (live anatomy with the arch branches)", () => {
  it("Judkins right 4 engaged in the RCA: median shape error at most 1.5 mm over the distal 60 mm", () => {
    const shapes = familyShapes("right");
    expect(shapes.length).toBeGreaterThanOrEqual(3);
    const r = evaluate("right", 60, FITTED_ORIENTATION, TRACES, shapes);
    expect(r.sum.n).toBe(qc.RCA.accepted.length);
    expect(r.sum.median).toBeLessThanOrEqual(1.5);
    expect(r.sum.within2).toBeGreaterThanOrEqual(0.6);
    expect(RIGHT_FAMILY.map((f) => f.catheter)).toEqual(["JR4"]);
  }, T);

  it("Judkins left family engaged in the left main, with the aortic root tilted as the silhouettes call for (FITTED_ORIENTATION, not yet applied by the renderer): median shape error at most 2.5 mm over the distal 60 mm, and the tilt explains most of the mismatch", () => {
    const shapes = familyShapes("left");
    expect(shapes.length).toBeGreaterThanOrEqual(8);
    const fitted = evaluate("left", 60, FITTED_ORIENTATION, TRACES, shapes);
    const vertical = evaluate("left", 60, NO_ORIENTATION, TRACES, shapes);
    expect(fitted.sum.n).toBe(qc.LCA.accepted.length);
    expect(fitted.sum.median).toBeLessThanOrEqual(2.5);
    expect(fitted.sum.median).toBeLessThan(vertical.sum.median - 1);
    expect(LEFT_FAMILY.map((f) => f.catheter)).toEqual(["JL3.5", "JL4", "JL5"]);
  }, T);

  it("the app's current state: with the vertical root the renderer draws, the Judkins left family is NOT within 2 mm (median 3.74 mm, 14% of runs within 2 mm); only the Judkins right 4 is", () => {
    // Documents the gap until the anatomy owners (S3/S4) tilt the root: if this starts failing because the
    // vertical-root error dropped, the root has been re-oriented and the notes and this test need updating.
    const left = evaluate("left", 60, NO_ORIENTATION, TRACES, familyShapes("left")).sum;
    expect(left.median).toBeGreaterThan(3.2);
    expect(left.median).toBeLessThan(4.3);
    expect(left.within2).toBeLessThan(0.25);
    const right = evaluate("right", 60, NO_ORIENTATION, TRACES, familyShapes("right")).sum;
    expect(right.median).toBeLessThanOrEqual(1.5);
    expect(right.within2).toBeGreaterThanOrEqual(0.6);
  }, T);

  it("the fitted root orientation holds on held-out patients: fitted on one half of the patients and scored on the other (two folds), the left median stays at most 3.0 mm and at least 0.7 mm better than the vertical root", () => {
    // coarse grid for test time (z 0/10/20, x 0/20/40/60 degrees); the 5 degree grid (CALIBRATE=holdout)
    // gives a pooled held-out left median of 2.32 mm (docs/realism/wave2/I3.md)
    const [a, b] = splitByPatient(TRACES);
    const sa = new Set(a.map((t) => studyOf(t.id)));
    expect(b.some((t) => sa.has(studyOf(t.id)))).toBe(false);
    expect(a.length + b.length).toBe(TRACES.length);
    const r = heldOutOrientation(familyShapes("left"), familyShapes("right"), { zDeg: [0, 10, 20], xDeg: [0, 20, 40, 60] });
    expect(r.heldOut.left.n).toBe(qc.LCA.accepted.length);
    expect(r.heldOut.right.n).toBe(qc.RCA.accepted.length);
    for (const f of r.folds) expect(f.fitted.xDeg).toBeGreaterThanOrEqual(20);
    expect(r.heldOut.left.median).toBeLessThanOrEqual(3.0);
    expect(r.heldOut.left.median).toBeLessThan(r.vertical.left.median - 0.7);
    expect(r.heldOut.right.median).toBeLessThanOrEqual(1.5);
  }, T);
});
