// ---------------------------------------------------------------------------
// Manoeuvre regression tests on the frozen fixture geometry (fixtures.ts, arch
// branches left out) at the default solver settings. The same suite runs on
// the live geometry, with the arch branches, at every configuration that
// bench.chooseConfig can return: manoeuvres.live-1.0/1.2/1.4.test.ts.
//
// Only manoeuvres supported by the local references are encoded (facts/S7.md):
// - JL4: the standard left catheter from the femoral route; it "allows entry
//   into the left coronary ostium with minimal manipulation in 80%-90% of
//   patients" (Cureus 2024) and is the standard femoral choice (Oxford notes).
// - JR4: "the ostium is engaged by applying gentle clockwise torque while
//   slowly withdrawing the catheter" (Oxford handbook notes).
// - Over-torque stores twist that is released suddenly (whip).
// - Pushing a catheter caught in the sinus buckles it into a loop on the
//   valve (prolapse); pushing an engaged catheter seats it deeper.
// - A guide is pushed out of the ostium when equipment is advanced out of it
//   (Medmastery handbook, back-wall support).
// Clinician review of each signature is pending.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { defineManoeuvreSuite } from "./manoeuvreSuite";
import { DEFAULT_CONFIG } from "./engine";
import * as M from "./manoeuvres";
import { ENGAGEMENT_SET_IDS } from "../data/catheters";

defineManoeuvreSuite(
  { geometry: "fixture", archBranches: false, segmentScale: DEFAULT_CONFIG.segmentScale, substepHz: DEFAULT_CONFIG.substepHz },
  { deepRca: true }
);

// ---------------------------------------------------------------------------
// The engagement technique set (diag-engagement-technique-set), on the live
// app geometry (anatomy.ts and thorax.ts, as the lab builds it) and, for the
// looped wire, on the frozen fixture too. Module text: pm-engaging-left
// (src/content/manual/pci-manual/07-engaging.ts:484-497, :551-560, :605) and
// pm-to-the-root-choice (06-to-the-root.ts:350). Measured on 10 October 2026
// at the default solver settings: the JL3.5 from the right radial engaged in
// 3 of 5 starts (normal root) and 4 of 5 (small root); over the looped wire
// the parked JL4 folded left in 4 of 5 (live) and 5 of 5 (fixture) and then
// engaged in 5 of 5, against 0 of 5 from the floor of the right cusp; in the
// short left main a seated JL4 entered the LAD in 7 of 12 starts and a JL4.5
// in 2 of 12.
//   npx vitest run src/physics/manoeuvres.test.ts -t "engagement technique set"
// ---------------------------------------------------------------------------

const T = 600_000;

describe("the engagement technique set (rod physics)", () => {
  it("a JL3.5 from the right radial artery engages the left main in at least 3 of 5 starts, never through the ventricle (live geometry, normal and small roots)", () => {
    const normal = M.radialLeftEngagement("JL3.5", { live: true, root: "normal" });
    expect(normal.reachedRoot).toBeGreaterThanOrEqual(4);
    expect(normal.engaged).toBeGreaterThanOrEqual(3);
    expect(normal.enteredLv).toBe(0);
    const small = M.radialLeftEngagement("JL3.5", { live: true, root: "small" });
    expect(small.engaged).toBeGreaterThanOrEqual(3);
    expect(small.enteredLv).toBe(0);
    // the live normal-root figure sits at the acceptance boundary (3 of 5), so a solver retune can flip it; the
    // frozen fixture's figure (1 of 5 when measured) is pinned as well, so that a regression there is seen too
    const fixture = M.radialLeftEngagement("JL3.5", { root: "normal" });
    expect(fixture.engaged).toBeGreaterThanOrEqual(1);
    expect(fixture.enteredLv).toBe(0);
  }, T);

  it("a JL parked 2 cm above the floor of the right cusp folds into the left cusp when the looped J wire is withdrawn in at least 3 of 5 starts, and then engages the left main", () => {
    for (const live of [true, false]) {
      const r = M.foldOverJWire("JL4", M.FOLD_PARK.aboveMm, { live });
      const at = live ? "live" : "fixture";
      expect(r.reachedRoot, at).toBe(5);
      expect(r.foldedLeft, at).toBeGreaterThanOrEqual(3);
      expect(r.engagedAfter, at).toBeGreaterThanOrEqual(3);
    }
  }, T);

  it("a JL pushed down onto the floor of the right cusp before the wire is withdrawn engages the left main in fewer starts than one parked 2 cm above it (live geometry)", () => {
    const parked = M.foldOverJWire("JL4", M.FOLD_PARK.aboveMm, { live: true });
    const floor = M.foldOverJWire("JL4", M.FOLD_PARK.floorMm, { live: true });
    expect(floor.engagedAfter).toBeLessThan(parked.engagedAfter);
  }, T);

  it("each shape the set adds to the catalogue goes over the J wire into the root and forms its curve there, with a finite tip and out of the ventricle (femoral, fixture)", () => {
    for (const id of ENGAGEMENT_SET_IDS) {
      const eng = M.femoralInRoot(id, 70, id === "JL6" || id === "AL3" ? "dilated" : "normal");
      expect(eng, id).not.toBeNull();
      const r = eng!.classify()!;
      const tip = eng!.readDevice(eng!.catheter!).tip;
      expect(tip.every(Number.isFinite), id).toBe(true);
      expect(r.inLV, id).toBe(false);
      expect(r.tipHeight, id).toBeGreaterThan(0);
    }
  }, T);

  it("in a short left main a seated JL4 enters the LAD in more starts than a JL4.5 does (femoral, live geometry, 12 starts)", () => {
    const jl4 = M.shortLmEntry("JL4");
    const jl45 = M.shortLmEntry("JL4.5");
    expect(jl4.engaged).toBeGreaterThanOrEqual(6);
    expect(jl45.engaged).toBeGreaterThanOrEqual(6);
    expect(jl4.lad).toBeGreaterThan(jl45.lad);
    // the gap the analytic model closes (src/simulation/engagement.ts shortLmBranch): the rod's larger curve stays at
    // the left main bifurcation rather than entering the circumflex
    expect(jl45.lad + jl45.lcx).toBeLessThan(jl45.engaged);
  }, T);
});
