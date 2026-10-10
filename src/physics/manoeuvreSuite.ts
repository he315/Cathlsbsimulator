// ---------------------------------------------------------------------------
// The manoeuvre acceptance suite, defined once and registered by
// manoeuvres.test.ts (frozen fixture, default solver settings) and by the
// matrix test files (live geometry with the arch branches, at every solver
// configuration bench.chooseConfig can return). Test-only module (imports
// vitest); the app never imports it.
//
// Each check runs a scripted procedure from manoeuvres.ts several times from
// different starting positions and asserts how often it succeeds, plus the
// outcomes that must never happen. The procedures only issue hand commands;
// outcomes are read by the engagement classifier.
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as M from "./manoeuvres";
import { useCell, type MatrixCell } from "./robustness";

const T = 600_000;

export function defineManoeuvreSuite(cell: MatrixCell, opts: { size?: boolean; deepRca?: boolean; dilated?: boolean } = {}): void {
  const label = `${cell.geometry} geometry${cell.archBranches ? " with arch branches" : ""}, segment scale ${cell.segmentScale}, ${cell.substepHz} Hz`;
  describe(`manoeuvres on the ${label}`, () => {
    let restore: () => void = () => {};
    beforeAll(() => {
      restore = useCell(cell);
    });
    afterAll(() => restore());

    it("JL4 from the femoral route engages the left main with minimal manipulation in most starts, never the RCA or the ventricle", () => {
      const r = M.jl4Engagement();
      expect(r.reachedRoot).toBe(5);
      expect(r.engaged).toBeGreaterThanOrEqual(3);
      expect(r.enteredRca).toBe(0);
      expect(r.enteredLv).toBe(0);
    }, T);

    it("pushing on an engaged JL4 seats it deep in the left coronary, and it stays there", () => {
      const r = M.deepSeat("JL4", "lm");
      expect(r.start).not.toBeNull();
      expect(r.deep || r.depth0 > 6.5).toBe(true);
      expect(r.stayed).toBe(true);
      expect(r.inLv).toBe(false);
    }, T);

    it("JR4 engages the RCA with gentle clockwise torque, never without torque, and less often turning anticlockwise", () => {
      const r = M.jr4Torque();
      expect(r.clockwise).toBeGreaterThanOrEqual(3);
      expect(r.still).toBe(0);
      expect(r.anticlockwise).toBeLessThan(r.clockwise);
    }, T);

    it("over-torque winds up the shaft and releases it as whip", () => {
      const r = M.overTorque();
      expect(r.peakTorsion).toBeGreaterThan(0.5);
      expect(r.whip).toBe(true);
    }, T);

    it("a right catheter pushed on in the left sinus buckles and prolapses into a loop on the valve", () => {
      const r = M.prolapse();
      expect(r.prolapsedAtStart).toBe(0);
      expect(r.prolapsed).toBeGreaterThanOrEqual(2);
    }, T);

    it("an engaged guide backs out when a device is pushed out of it against resistance, and stays when it is not", () => {
      const r = M.guideBackup();
      expect(r.engaged).toBeGreaterThanOrEqual(2);
      expect(r.backedOut).toBe(r.engaged);
      expect(r.controlStayed).toBe(r.engaged);
    }, T);

    it("an extra-backup 3.75 guide from the femoral route engages the left main with the same technique in at least 2 of 5 starts, never the RCA or the ventricle", () => {
      const r = M.jl4Engagement("EBU3.75");
      expect(r.engaged).toBeGreaterThanOrEqual(2);
      expect(r.enteredRca).toBe(0);
      expect(r.enteredLv).toBe(0);
    }, T);

    it("a radial universal catheter from the right radial artery engages the left main in every start that reaches the root", () => {
      const r = M.tigerLeft();
      expect(r.reachedRoot).toBeGreaterThanOrEqual(3);
      expect(r.engaged).toBe(r.reachedRoot);
    }, T);

    if (opts.size !== false) {
      it("Judkins left size against root size: a JL3.5 suits a small root at least as well as a JL4 and better than a JL5; a JL4 suits a normal root", () => {
        const small35 = M.jl4Engagement("JL3.5", "small").engaged;
        const small4 = M.jl4Engagement("JL4", "small").engaged;
        const small5 = M.jl4Engagement("JL5", "small").engaged;
        const normal4 = M.jl4Engagement("JL4", "normal").engaged;
        const normal5 = M.jl4Engagement("JL5", "normal").engaged;
        expect(small35).toBeGreaterThanOrEqual(small4);
        expect(small35).toBeGreaterThan(small5);
        expect(normal4).toBeGreaterThanOrEqual(3);
        expect(normal4).toBeGreaterThan(normal5);
      }, T);
    }

    it("an Amplatz left 1 with the Amplatz technique engages the left main in most starts that reach the root, never the RCA, is never called prolapsed while seated or engaged, and is not pulled out by a withdrawal", () => {
      const r = M.amplatzEngagement("AL1", "normal");
      // measured (docs/realism/wave2/I3.md): 4-5 of 5 at segment scales 1.0 and 1.2; at 1.4 the AL1 reaches
      // the root in only 3 of 5 starts and engages in 2-3 of those
      expect(r.reachedRoot).toBeGreaterThanOrEqual(3);
      expect(r.engaged).toBeGreaterThanOrEqual(r.reachedRoot - 1);
      expect(r.engaged).toBeGreaterThanOrEqual(cell.segmentScale < 1.3 ? 4 : 2);
      expect(r.enteredRca).toBe(0);
      expect(r.prolapsedSeated).toBe(0);
      expect(r.prolapsedWhileEngaged).toBe(0);
      // "pulling the catheter will cause deeper engagement" (facts I3): a 3 mm withdrawal of a seated
      // Amplatz (at least 1 mm in) leaves it in the vessel, no more than 1 mm shallower
      for (const p of r.paradox) if (p.depth0 >= 1) expect(p.afterPull).toBeGreaterThanOrEqual(p.depth0 - 1);
    }, T);

    if (opts.dilated ?? (cell.geometry === "live" && cell.archBranches)) {
      it("dilated root (app geometry): a JL5 engages the left main at least as reliably as a JL4 does in a normal root, and an undersized JL4 in the dilated root does no better than the JL5 (12 starts each)", () => {
        const starts = M.STARTS12;
        const jl5 = M.jl4Engagement("JL5", "dilated", starts);
        const jl4 = M.jl4Engagement("JL4", "normal", starts);
        expect(jl5.engaged).toBeGreaterThanOrEqual(jl4.engaged);
        expect(jl5.enteredRca).toBe(0);
        expect(jl5.enteredLv).toBe(0);
        // guard against size discrimination getting worse; clinically the JL4 should do clearly worse
        // here, which the model does not yet reproduce (docs/realism/wave2/I3.md, remaining issues)
        const jl4Dilated = M.jl4Engagement("JL4", "dilated", starts);
        expect(jl4Dilated.engaged).toBeLessThanOrEqual(jl5.engaged);
      }, T);
    } else if (cell.geometry === "fixture") {
      it("dilated root on the frozen fixture (known gap, regenerate the fixture when the root is re-oriented): a JL5 in the dilated root engages within 3 of 12 starts of a JL4 in a normal root", () => {
        const starts = M.STARTS12;
        const jl5 = M.jl4Engagement("JL5", "dilated", starts);
        const jl4 = M.jl4Engagement("JL4", "normal", starts);
        // measured: 10 vs 11 (scale 1.0), 12 vs 11 (1.2), 9 vs 12 (1.4)
        expect(jl5.engaged).toBeGreaterThanOrEqual(jl4.engaged - 3);
        expect(jl5.enteredRca).toBe(0);
        expect(jl5.enteredLv).toBe(0);
      }, T);
    }

    if (opts.deepRca) {
      it("pushing on an engaged JR4 advances it further into the RCA without leaving it or reaching the ventricle", () => {
        const r = M.deepSeat("JR4", "rca");
        expect(r.start).not.toBeNull();
        expect(r.deepest).toBeGreaterThan(r.depth0 + 0.5);
        expect(r.stayed).toBe(true);
        expect(r.inLv).toBe(false);
      }, T);
    }
  });
}
