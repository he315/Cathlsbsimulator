// pci-guide-engagement: the guide's position sets the wire's first direction (pm-wiring-guide-seat,
// pci-guide-wire-direction). A large left curve seated in a wide-angled left main sends the first advance
// into the circumflex although the tip is turned to the LAD; re-seated, the same advance enters the LAD. A
// shallow Judkins right at a separate conus ostium sends it into the conus until the guide is seated
// further. coronaryWire.test.ts runs unchanged beside it (with no aim nothing is drawn from the wire's
// generator).
//   npx vitest run src/simulation/pci/guideWireAim.test.ts src/simulation/pci/coronaryWire.test.ts
import { describe, expect, it } from "vitest";
import { moveWire, type PciState } from "../angioPci";
import { handGuide, selectGuide } from "./actions/guide";
import { takeOff } from "./geometry";
import { MP_AIM_DEPTH_MM, MP_SHALLOW_JR_MM, MP_WIDE_LM_DEG, guideSite, guideWireAim } from "./guide";
import { initialWire } from "./coronaryWire";
import { setup, start, turnTipTo, type Setup } from "./testSetup";

const SEEDS = 50;

/** Engage the guide out of the root by hand: 1 mm pushes half a second apart. */
function engageByHand(su: Setup, st0: PciState): PciState {
  let st = st0;
  for (let i = 0; i < 60 && !st.guide.engaged; i++) st = handGuide(su.s, su.g, su.model, { ...st, t: st.t + 0.5 }, { mm: 1 });
  return st;
}

/** The operator turns the tip to a branch's take-off and advances out of the guide; the branch the wire enters first. */
function firstBranch(su: Setup, st0: PciState, towards: string): { st: PciState; vessel: string } {
  let st = st0;
  st = turnTipTo(st, takeOff(su.g, su.g.byName.get(towards)!).azimuth);
  const root = st.route[0];
  for (let i = 0; i < 40 && st.route.length < 2 && (st.route[0] === root || st.tipMm < 3); i++) st = moveWire(su.s, su.g, st, 2);
  return { st, vessel: st.route.length >= 2 ? st.route[1] : st.route[0] };
}

/** Pull the wire back inside the guide. */
function wireBack(su: Setup, st0: PciState): PciState {
  let st = st0;
  for (let i = 0; i < 60 && st.tipMm > -2; i++) st = moveWire(su.s, su.g, st, -3);
  return st;
}

describe("the guide sets the wire's first direction (pci-guide-engagement)", () => {
  it("EBU3.75 in a wide-angled left main: the first advance enters the LCx in more than half of 50 seeds, and the LAD after re-seating", () => {
    const su = setup("lad-focal");
    const site = guideSite(su.g, "left");
    expect(site.lmBifurcationDeg!).toBeGreaterThanOrEqual(MP_WIDE_LM_DEG);
    let lcxFirst = 0;
    let ladAfter = 0;
    let aimed = 0;
    for (let seed = 0; seed < SEEDS; seed++) {
      let st = selectGuide(start(su, { guide: "EBU3.75", guideEngaged: false, seed: `aim-${seed}` }), "EBU3.75");
      st = engageByHand(su, st);
      expect(st.guide.engaged).toBe(true);
      if (st.wire.aim === "LCx") aimed++;
      const first = firstBranch(su, st, "LAD");
      if (first.vessel === "LCx") lcxFirst++;
      // re-seat: draw the guide back to a shallow, coaxial seat (still engaged), then the same advance
      st = wireBack(su, first.st);
      for (let i = 0; i < 20 && st.guide.depthMm >= MP_AIM_DEPTH_MM; i++) st = handGuide(su.s, su.g, su.model, st, { mm: -0.5 });
      expect(st.guide.engaged).toBe(true);
      expect(st.wire.aim ?? null).toBeNull();
      if (firstBranch(su, st, "LAD").vessel === "LAD") ladAfter++;
    }
    console.info(`EBU3.75, wide left main (${site.lmBifurcationDeg!.toFixed(0)} deg): aimed at the LCx in ${aimed}/${SEEDS}, first advance into the LCx ${lcxFirst}/${SEEDS}, into the LAD after re-seating ${ladAfter}/${SEEDS}`);
    expect(lcxFirst).toBeGreaterThan(SEEDS / 2);
    expect(ladAfter).toBe(SEEDS);
  });

  it("the same advance with a smaller curve (EBU3.5) is the tip's own choice: the LAD", () => {
    const su = setup("lad-focal");
    let lad = 0;
    for (let seed = 0; seed < 10; seed++) {
      const st = engageByHand(su, selectGuide(start(su, { guide: "EBU3.5", guideEngaged: false, seed: `small-${seed}` }), "EBU3.5"));
      expect(st.wire.aim ?? null).toBeNull();
      if (firstBranch(su, st, "LAD").vessel === "LAD") lad++;
    }
    expect(lad).toBe(10);
  });

  it("a shallow Judkins right sends the wire into a separate conus ostium; seated further, into the RCA", () => {
    const su = setup("rca-calcified");
    expect(guideSite(su.g, "right").separateConus).toBe(true);
    let conus = 0;
    let rcaAfter = 0;
    for (let seed = 0; seed < SEEDS; seed++) {
      let st = engageByHand(su, selectGuide(start(su, { guide: "JR4", guideEngaged: false, seed: `conus-${seed}` }), "JR4"));
      expect(st.guide.engaged).toBe(true);
      // drawn back to a shallow seat at the ostium
      for (let i = 0; i < 20 && st.guide.depthMm >= MP_SHALLOW_JR_MM; i++) st = handGuide(su.s, su.g, su.model, st, { mm: -0.4 });
      expect(st.guide.engaged).toBe(true);
      expect(st.wire.aim).toBe("CONUS");
      for (let i = 0; i < 30 && st.tipMm < 6; i++) st = moveWire(su.s, su.g, st, 2);
      if (st.route[0] === "CONUS") conus++;
      // seated a little further and the wire advanced again
      st = wireBack(su, st);
      for (let i = 0; i < 6 && st.guide.depthMm < MP_SHALLOW_JR_MM; i++) st = handGuide(su.s, su.g, su.model, st, { mm: 0.5 });
      expect(st.wire.aim ?? null).toBeNull();
      for (let i = 0; i < 30 && st.tipMm < 6; i++) st = moveWire(su.s, su.g, st, 2);
      if (st.route[0] === "RCA" && st.tipMm > 5) rcaAfter++;
    }
    console.info(`JR4 shallow: wire into the conus ${conus}/${SEEDS}, into the RCA after seating ${rcaAfter}/${SEEDS}`);
    expect(conus).toBeGreaterThan(SEEDS / 2);
    expect(rcaAfter).toBe(SEEDS);
  });

  it("the aim is a pure function of the guide and the site, and initialWire takes it", () => {
    const site = { lmBifurcationDeg: 95, separateConus: true };
    const ebu = { id: "EBU3.75", french: 6 as const, engaged: true, depthMm: 1, coaxial: 0.9, extensionMm: null, buddy: false };
    expect(guideWireAim(ebu, "left", site)).toBe("LCx");
    expect(guideWireAim({ ...ebu, depthMm: 0 }, "left", site)).toBeNull();
    expect(guideWireAim(ebu, "left", { ...site, lmBifurcationDeg: 50 })).toBeNull();
    expect(guideWireAim({ ...ebu, id: "EBU3.5" }, "left", site)).toBeNull();
    expect(guideWireAim({ ...ebu, engaged: false }, "left", site)).toBeNull();
    const jr = { ...ebu, id: "JR4", depthMm: 0 };
    expect(guideWireAim(jr, "right", site)).toBe("CONUS");
    expect(guideWireAim(jr, "right", { ...site, separateConus: false })).toBeNull();
    const w = initialWire("workhorse", "left", { aimVessel: "LCx" });
    expect(w.aim).toBe("LCx");
    expect(w.home).toBe("LM");
    expect("aim" in initialWire("workhorse", "left")).toBe(false);
  });
});
