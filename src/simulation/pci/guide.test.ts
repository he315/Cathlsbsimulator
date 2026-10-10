import { describe, expect, it } from "vitest";
import { advanceDevice, backloadDevice, checkLabel, pinWire, prepareDevice, requestDevice, setExtension, setValve, type PciState } from "../angioPci";
import { backupForce, initialGuide, seat } from "./guide";
import { setup, start, wireToTarget } from "./testSetup";

/** Deliver a 3.0 × 28 mm stent towards the lesion and report how far it got and what the guide did. */
function deliverStent(id: string, guide: string, coaxial: number, severity: number, over: Record<string, unknown> = {}, extension: number | null = null) {
  const su = setup(id, over as never);
  let st: PciState = start(su, { guide });
  st = { ...st, guide: { ...st.guide, coaxial }, severity, resistance: su.s.calcium === 2 ? 0.62 : st.resistance };
  st = pinWire(wireToTarget(su, st, 30), true);
  if (extension !== null) st = setExtension(st, extension);
  st = requestDevice(st, "des", 3.0, 28);
  st = checkLabel(st);
  st = prepareDevice(st);
  st = backloadDevice(st);
  st = setValve(st, true);
  st = advanceDevice(su.s, su.g, st, 1);
  for (let i = 0; i < 70 && st.guide.engaged; i++) st = advanceDevice(su.s, su.g, st, 2);
  const distal = st.device!.centreMm + st.device!.lengthMm / 2;
  return { st, su, distal, crossed: distal > su.g.lesion.endMm };
}

describe("guide support and device delivery", () => {
  it("back-up follows the published ordering: bigger guides, extra-backup curves and deep seating hold more", () => {
    expect(backupForce(initialGuide("EBU3.5"))).toBeGreaterThan(backupForce(initialGuide("JL4")));
    expect(backupForce(initialGuide("JL4", true, 7))).toBeGreaterThan(backupForce(initialGuide("JL4", true, 6)));
    expect(backupForce(seat(initialGuide("JL4"), 4))).toBeGreaterThan(backupForce(initialGuide("JL4")));
    expect(backupForce({ ...initialGuide("JR4"), coaxial: 0.3 })).toBeLessThan(backupForce(initialGuide("JR4")));
    expect(backupForce({ ...initialGuide("JL4"), extensionMm: 20 })).toBeGreaterThan(backupForce(initialGuide("EBU3.5")));
    expect(backupForce(initialGuide("JL4", false))).toBeLessThan(0.05);
  });

  it("a stiff stent through a calcified RCA backs a poorly seated Judkins right out; an extra-backup (Amplatz) guide holds", () => {
    const jr = deliverStent("rca-calcified", "JR4", 0.4, 50);
    expect(jr.st.guide.engaged).toBe(false);
    expect(jr.st.counters.guideBackouts).toBeGreaterThan(0);
    expect(jr.crossed).toBe(false);
    expect(jr.st.events.some((e) => /guide is pushed back/.test(e.text))).toBe(true);
    const al = deliverStent("rca-calcified", "AL1", 0.85, 50);
    expect(al.st.guide.engaged).toBe(true);
    expect(al.crossed).toBe(true);
  });

  it("the same in a calcified LAD: a poorly seated Judkins left backs out, an extra-backup guide holds", () => {
    const over = { calcium: 2 };
    const jl = deliverStent("lad-focal", "JL4", 0.4, 50, over);
    expect(jl.st.guide.engaged).toBe(false);
    const ebu = deliverStent("lad-focal", "EBU3.5", 0.85, 50, over);
    expect(ebu.st.guide.engaged).toBe(true);
    expect(ebu.crossed).toBe(true);
  });

  it("an unprepared tight calcified lesion stops a stent even with good back-up; a guide extension adds back-up", () => {
    const tight = deliverStent("rca-calcified", "AL1", 0.85, 80);
    expect(tight.crossed).toBe(false);
    const ext = deliverStent("rca-calcified", "JR4", 0.85, 50, {}, 25);
    expect(ext.st.guide.extensionMm).toBe(25);
    expect(ext.distal).toBeGreaterThan(deliverStent("rca-calcified", "JR4", 0.85, 50).distal);
  });

  it("a device cannot leave a guide that has backed out until it is re-engaged", () => {
    const jr = deliverStent("rca-calcified", "JR4", 0.4, 50);
    const before = jr.distal;
    const st = advanceDevice(jr.su.s, jr.su.g, jr.st, 4);
    expect(st.device!.centreMm + st.device!.lengthMm / 2).toBeLessThanOrEqual(before + 1e-9);
  });
});

// ---------------------------------------------------------------------------
// pci-guide-engagement: seating, the wedge and the trace, engagement by hand from the root, turning off
// the ostium, twist and kink, the guide exchange.
//   npx vitest run src/simulation/pci/guide.test.ts
// ---------------------------------------------------------------------------
import { PatientEngine } from "../patient/engine";
import { generatePatient } from "../patient/patient";
import { tipFromGuide } from "./patientBridge";
import {
  GUIDE_NON_COAXIAL,
  MP_DAMPING_GAP,
  MP_KINK_TWIST_RAD,
  classifyGuide,
  engageRng,
  guideDamps,
  guideGap,
  guideShapeId,
  guideSite,
  guideSpecId,
  guideWedgeFraction,
  settleOnEngage,
  torqueNotTransmitted,
  twistGuide,
  type GuideState,
} from "./guide";
import { exchangeGuideOverWire, handGuide, seatGuide, selectGuide } from "./actions/guide";
import { moveWire as moveWireAction } from "./actions/wire";

/** The trace the patient engine shows for a guide seated like this (5 s after it settles). */
function traceOf(gs: GuideState, side: "left" | "right", tree: ReturnType<typeof setup>["refTree"]): string {
  const eng = new PatientEngine({ profile: generatePatient(21, { indication: "SA" }), tree, lesions: [] });
  eng.setTip(tipFromGuide(gs, side, false));
  eng.advance(5);
  return eng.vitals().tipState;
}

/** Engage a guide out of the root by hand: push in 1 mm steps (half a second apart) until it engages. */
function engageByHand(su: ReturnType<typeof setup>, st0: PciState): PciState {
  let st = st0;
  for (let i = 0; i < 60 && !st.guide.engaged; i++) st = handGuide(su.s, su.g, su.model, { ...st, t: st.t + 0.5 }, { mm: 1 });
  return st;
}

describe("guide seating, the wedge and the trace (pci-guide-engagement)", () => {
  it("a 3 mm deep seat raises backupN and the damping wedge fraction", () => {
    const at = initialGuide("EBU3.5");
    const deep: GuideState = { ...at, depthMm: 3 };
    expect(backupForce(deep)).toBeGreaterThan(backupForce(at));
    expect(guideWedgeFraction(deep)).toBeGreaterThan(guideWedgeFraction(at));
    // the same through the seat action, and on the engine's tip input
    const su = setup("lad-focal");
    let st = start(su, { guide: "EBU3.5" });
    const before = { b: backupForce(st.guide), w: guideWedgeFraction(st.guide), gap: tipFromGuide(st.guide, "left", false).gap! };
    st = seatGuide(st, 3 / (0.5 + 0.35), su.s, su.g);
    expect(st.guide.depthMm).toBeCloseTo(3, 6);
    expect(backupForce(st.guide)).toBeGreaterThan(before.b);
    expect(guideWedgeFraction(st.guide)).toBeGreaterThan(before.w);
    expect(tipFromGuide(st.guide, "left", false).gap!).toBeLessThan(before.gap);
    expect(tipFromGuide(st.guide, "left", false).location).toBe("coronary");
    // out of the ostium the guide blocks nothing
    expect(guideWedgeFraction(initialGuide("EBU3.5", false))).toBe(0);
  });

  it("a 7 Fr Amplatz in an ostial RCA damps more often than a 6 Fr Judkins right (seeded), and the engine's trace agrees", () => {
    const su = setup("rca-calcified");
    const site = guideSite(su.g, "right");
    expect(site.ostiumMm).toBeGreaterThan(2.5);
    const ostial = { ostiumMm: site.ostiumMm, ostialStenosis: 0.5 };
    const damps = (id: string, french: 6 | 7) => {
      const runs: GuideState[] = [];
      for (let seed = 0; seed < 50; seed++) {
        const gs = { ...initialGuide(id, false, french, { side: "right" }), ...ostial };
        runs.push(settleOnEngage(gs, { depthMm: 0, coaxial: 0.9 }, engageRng(gs, `seed-${seed}`)));
      }
      return { n: runs.filter(guideDamps).length, runs };
    };
    const al = damps("AL1", 7);
    const jr = damps("JR4", 6);
    console.info(`ostial RCA (lumen ${site.ostiumMm.toFixed(2)} mm, 50% stenosis): 7 Fr AL1 damps in ${al.n}/50 seeds, 6 Fr JR4 in ${jr.n}/50`);
    expect(al.n).toBeGreaterThan(jr.n);
    expect(al.n).toBeGreaterThan(0);
    // the patient engine reads the same: a damping seat gives an abnormal trace, a free one a normal trace
    const dampedSeat = al.runs.find(guideDamps)!;
    const freeSeat = jr.runs.find((g) => !guideDamps(g) && guideGap(g) > MP_DAMPING_GAP + 0.1)!;
    expect(["damped", "ventricularised", "wedged"]).toContain(traceOf(dampedSeat, "right", su.refTree));
    expect(traceOf(freeSeat, "right", su.refTree)).toBe("aortic");
    // side holes keep the trace normal although the ostium is just as obstructed
    const holed = { ...dampedSeat, sideHoles: true };
    expect(guideWedgeFraction(holed)).toBe(guideWedgeFraction(dampedSeat));
    expect(guideDamps(holed)).toBe(false);
    expect(traceOf(holed, "right", su.refTree)).toBe("aortic");
    // a disengaged guide is free
    expect(traceOf({ ...dampedSeat, engaged: false, depthMm: -1 }, "right", su.refTree)).toBe("aortic");
  });

  it("the hands engage a guide out of the aortic root with the analytic model, at the case's coronary", () => {
    const su = setup("lad-focal");
    let st = selectGuide(start(su, { guide: "EBU3.5", guideEngaged: false }), "EBU3.5");
    expect(st.guide.engaged).toBe(false);
    expect(classifyGuide(su.model, st.guide).kind).toBe("ascending-aorta");
    st = engageByHand(su, st);
    expect(st.guide.engaged).toBe(true);
    expect(st.guide.depthMm).toBeGreaterThanOrEqual(0);
    expect(st.guide.ostiumMm).toBeGreaterThan(2.5);
    expect(st.log.some((r) => r.kind === "guide-engage")).toBe(true);
    // the guide shapes the solver knows
    expect(guideShapeId("JL4")).toBe("JL4G");
    expect(guideShapeId("EBU3.5")).toBe("EBU3.5");
    expect(guideShapeId("JR4")).toBe("JR4G");
    expect(guideSpecId("JL4G")).toBe("JL4");
  });

  it("turning an engaged guide takes it off the coaxial position and off the ostium; the wire stays in the vessel", () => {
    const su = setup("lad-focal");
    let st = wireToTarget(su, start(su, { guide: "EBU3.5" }), 20);
    const tip = st.tipMm;
    st = handGuide(su.s, su.g, su.model, st, { rad: 0.4 });
    expect(st.guide.engaged).toBe(true);
    expect(st.guide.coaxial).toBeLessThan(0.85);
    for (let i = 0; i < 6 && st.guide.engaged; i++) st = handGuide(su.s, su.g, su.model, st, { rad: 0.3 });
    expect(st.guide.engaged).toBe(false);
    expect(st.tipMm).toBe(tip);
    expect(st.wire.guideEngaged).toBe(true);
    // a push over the wire takes the guide back in
    st = handGuide(su.s, su.g, su.model, st, { mm: 1 });
    expect(st.guide.engaged).toBe(true);
    expect(st.tipMm).toBe(tip);
  });

  it("pulling the guide back out of the ostium drags an unpinned wire; a pinned wire stays", () => {
    const su = setup("lad-focal");
    const wired = wireToTarget(su, start(su, { guide: "EBU3.5" }), 20);
    const pull = (st0: PciState) => {
      let st = st0;
      for (let i = 0; i < 10 && st.guide.engaged; i++) st = handGuide(su.s, su.g, su.model, st, { mm: -1.5 });
      return st;
    };
    const free = pull(wired);
    expect(free.guide.engaged).toBe(false);
    expect(free.tipMm).toBeLessThan(wired.tipMm);
    const held = pull(pinWire(wired, true));
    expect(held.guide.engaged).toBe(false);
    expect(held.tipMm).toBe(wired.tipMm);
  });

  it("a non-coaxial guide stops the wire at its tip; re-seated coaxially, the wire leaves it", () => {
    const su = setup("lad-focal");
    let st = start(su, { guide: "EBU3.5" });
    st = handGuide(su.s, su.g, su.model, st, { rad: 0.6 });
    expect(st.guide.engaged).toBe(true);
    expect(st.guide.coaxial).toBeLessThan(GUIDE_NON_COAXIAL);
    expect(st.wire.exitBlocked).toBe(true);
    for (let i = 0; i < 10; i++) st = moveWireAction(su.s, su.g, st, 2);
    expect(st.tipMm).toBeLessThanOrEqual(1);
    st = handGuide(su.s, su.g, su.model, st, { rad: -0.6 });
    expect(st.guide.coaxial).toBeGreaterThanOrEqual(GUIDE_NON_COAXIAL);
    expect(st.wire.exitBlocked).toBe(false);
    for (let i = 0; i < 10; i++) st = moveWireAction(su.s, su.g, st, 2);
    expect(st.tipMm).toBeGreaterThan(10);
  });

  it("rotation the shaft stores stops reaching the tip, and enough of it kinks the guide; untwisting frees it", () => {
    let gs = initialGuide("JR4", false);
    let tip = 0;
    for (let i = 0; i < 4; i++) {
      const r = twistGuide(gs, Math.PI);
      gs = r.gs;
      tip += r.tipRad;
    }
    expect(tip).toBeLessThan(4 * Math.PI);
    expect(torqueNotTransmitted(gs)).toBe(true);
    expect(gs.kinked).toBeFalsy();
    for (let i = 0; i < 40 && !gs.kinked; i++) gs = twistGuide(gs, Math.PI).gs;
    expect(gs.kinked).toBe(true);
    expect(Math.abs(gs.twistRad!)).toBeGreaterThan(MP_KINK_TWIST_RAD);
    expect(twistGuide(gs, Math.PI).tipRad).toBe(0);
    for (let i = 0; i < 40 && gs.kinked; i++) gs = twistGuide(gs, -Math.PI).gs;
    expect(gs.kinked).toBe(false);
  });

  it("a guide exchange keeps the wire distal only over an exchange-length wire (or a trapped one)", () => {
    const su = setup("rca-calcified");
    const wired = wireToTarget(su, start(su, { guide: "JR4" }), 20);
    const short = exchangeGuideOverWire(su.s, wired, "AL1", { french: 7 }, su.g);
    expect(short.tipMm).toBeLessThan(0);
    expect(short.guide.id).toBe("AL1");
    expect(short.guide.engaged).toBe(false);
    const long = { ...wired, wire: { ...wired.wire, lengthCm: 300 } };
    const kept = exchangeGuideOverWire(su.s, long, "AL1", { french: 7 }, su.g);
    expect(kept.guide.id).toBe("AL1");
    expect(kept.guide.french).toBe(7);
    expect(kept.guide.engaged).toBe(true);
    expect(kept.tipMm).toBe(wired.tipMm);
    const trapped = exchangeGuideOverWire(su.s, wired, "AL1", { hold: "trap" }, su.g);
    expect(trapped.tipMm).toBe(wired.tipMm);
    // the settle of the new guide is seeded: the same state gives the same seat, another moment another one
    const again = exchangeGuideOverWire(su.s, long, "AL1", { french: 7 }, su.g);
    expect(again.guide.depthMm).toBe(kept.guide.depthMm);
    expect(again.guide.coaxial).toBe(kept.guide.coaxial);
    const depths = new Set([0.5, 1, 1.5, 2, 2.5].map((dt) => exchangeGuideOverWire(su.s, { ...long, t: long.t + dt }, "AL1", { french: 7 }, su.g).guide.depthMm));
    expect(depths.size).toBeGreaterThan(1);
  });

  it("a guide exchange over the wire refuses a guide for the other coronary, and a guide with an extension or a buddy wire in it", () => {
    const su = setup("lad-focal");
    const wired = wireToTarget(su, start(su, { guide: "EBU3.5" }), 40);
    const long = { ...wired, wire: { ...wired.wire, lengthCm: 300 } };
    const jr = exchangeGuideOverWire(su.s, long, "JR4", {}, su.g);
    expect(jr.guide).toBe(long.guide);
    expect(jr.tipMm).toBe(long.tipMm);
    expect(jr.events[jr.events.length - 1].text).toMatch(/does not suit the left coronary/);
    const ext = exchangeGuideOverWire(su.s, setExtension(long, 20), "EBU4.0", {}, su.g);
    expect(ext.guide.id).toBe("EBU3.5");
    expect(ext.guide.extensionMm).toBe(20);
    expect(ext.events[ext.events.length - 1].text).toMatch(/guide extension/);
    const buddy = exchangeGuideOverWire(su.s, { ...long, guide: { ...long.guide, buddy: true } }, "EBU4.0", {}, su.g);
    expect(buddy.guide.id).toBe("EBU3.5");
    expect(buddy.events[buddy.events.length - 1].text).toMatch(/buddy wire/);
  });

  it("a short wire comes out with the old guide with nothing held, caught or stored, in the case's own coronary", () => {
    const su = setup("lad-focal");
    const wired = wireToTarget(su, start(su, { guide: "EBU3.5" }), 20);
    const messy = { ...wired, wire: { ...wired.wire, pinned: true, stallMm: 2, tipForceGf: 3, axialN: 0.4, wallCaught: { atMm: 10 }, deflector: { vessel: "LAD", atMm: 12, branch: "D1" }, route: ["CONUS"] } };
    const out = exchangeGuideOverWire(su.s, messy, "EBU4.0", {}, su.g);
    expect(out.tipMm).toBeLessThan(0);
    expect(out.route).toEqual(["LM"]);
    expect(out.wire).toMatchObject({ pinned: false, stallMm: 0, tipForceGf: 0, axialN: 0, wallCaught: null, deflector: null, crossed: false });
    expect(out.wire.hub - out.wire.offset - out.wire.tip).toBeCloseTo(0, 9);
    expect(out.guide).toMatchObject({ id: "EBU4.0", engaged: false });
  });

  it("twist stored in the shaft reaches the tip of an engaged guide when it is pushed, and turns it off the coaxial position", () => {
    const su = setup("lad-focal");
    const st0 = start(su, { guide: "EBU3.5" });
    const wound = { ...st0, guide: { ...st0.guide, twistRad: 0.5 } };
    const pushed = handGuide(su.s, su.g, su.model, wound, { mm: 1 });
    expect(pushed.guide.engaged).toBe(true);
    expect(Math.abs(pushed.guide.twistRad!)).toBeLessThan(0.5);
    expect(pushed.guide.offAxisRad).toBeGreaterThan(0);
    expect(pushed.guide.coaxial).toBeLessThan(st0.guide.coaxial);
    // without stored twist the same push leaves the coaxiality alone
    expect(handGuide(su.s, su.g, su.model, st0, { mm: 1 }).guide.coaxial).toBe(st0.guide.coaxial);
    // enough stored twist turns the guide off the ostium on a push
    const far = handGuide(su.s, su.g, su.model, { ...st0, guide: { ...st0.guide, twistRad: 3 } }, { mm: 6 });
    expect(far.guide.engaged).toBe(false);
    expect(far.guide.zone).toBe("near");
    expect(far.guide.root).toBeDefined();
  });

  it("a guide that starts engaged learns its ostium (and an aorto-ostial lesion) on its first seat, and the wire its aim", () => {
    const su = setup("lad-focal");
    const st0 = start(su, { guide: "EBU3.75" });
    expect(st0.guide.engaged).toBe(true);
    expect(st0.guide.ostiumMm).toBeUndefined();
    const site = guideSite(su.g, "left");
    const seated = seatGuide(st0, 1, su.s, su.g);
    expect(seated.guide.ostiumMm).toBe(site.ostiumMm);
    expect(seated.wire.home).toBe("LM");
    const hand = handGuide(su.s, su.g, su.model, st0, { mm: 1 });
    expect(hand.guide.ostiumMm).toBe(site.ostiumMm);
    expect(site.lmBifurcationDeg).toBeGreaterThanOrEqual(80);
    expect(hand.guide.depthMm).toBeGreaterThanOrEqual(0.5);
    expect(hand.wire.aim).toBe("LCx");
  });

  it("the drag of the wire on a pull is in the debrief record, not the live log", () => {
    const su = setup("lad-focal");
    let st = wireToTarget(su, start(su, { guide: "EBU3.5" }), 20);
    for (let i = 0; i < 10 && st.guide.engaged; i++) st = handGuide(su.s, su.g, su.model, st, { mm: -1.5 });
    const line = st.events.find((e) => /drawn the wire back/.test(e.text));
    expect(line).toBeDefined();
    expect(line!.text).not.toMatch(/\d/);
    expect(st.log.some((r) => r.kind === "guide-drag-wire")).toBe(true);
  });
});
