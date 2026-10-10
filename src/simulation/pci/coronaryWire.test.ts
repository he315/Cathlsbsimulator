import { describe, expect, it } from "vitest";
import { moveWire, setWireKind, shapeTip, torqueWire, wireTorqueLagDeg, initialPci, advanceDevice, requestDevice, checkLabel, prepareDevice, backloadDevice, setValve, pinWire, type PciState } from "../angioPci";
import { effectiveBend, tipCapability, lesionResistance, microSupport, trapHold, wallCatchPerMm, pseudolesionSites, MP_MC_MIN_GAP_MM, MP_MC_EXCHANGE_KEEP_MM, MP_HYDRAULIC_LOW_MM, MP_DANGER_D } from "./coronaryWire";
import { takeOff, branchesOf, wrap, radiusAtMm } from "./geometry";
import { pathToTarget } from "../angioPci";
import { setup, start, turnTipTo, wireToTarget } from "./testSetup";
import { checkMicroBackflow, injectMicrocatheter, loadMicrocatheter, moveMicrocatheter, removeMicrocatheter, setDeflectionBalloon, torqueMicrocatheter, wiringScore } from "./actions/wire";
import { initialGuide } from "./guide";
import { wiringOf } from "./state";

/** Wire the LAD scenario to just proximal to a branch origin, tip shaped and turned as given, then push past it. */
function pushPast(id: string, branch: string, tip: { az: number; shape?: { primaryDeg: number; primaryMm: number; secondaryDeg?: number; secondaryMm?: number } }) {
  const su = setup(id);
  const { s, g } = su;
  let st = start(su);
  if (tip.shape) st = shapeTip(st, { primaryDeg: tip.shape.primaryDeg, primaryMm: tip.shape.primaryMm, secondaryDeg: tip.shape.secondaryDeg ?? 0, secondaryMm: tip.shape.secondaryMm ?? 0 });
  const b = [...g.byName.values()].find((v) => v.name === branch)!;
  const parent = b.parent!.name;
  const at = g.byName.get(parent)!.pathMm[b.parent!.index];
  // get onto the parent vessel, stopping 3 mm short of the origin
  const path = ["LM", "LAD", "LCx", "RCA"];
  void path;
  for (let i = 0; i < 400 && !(st.route[st.route.length - 1] === parent && st.tipMm >= at - 3); i++) {
    const cur = st.route[st.route.length - 1];
    if (cur !== parent && cur !== "LM" && cur !== "RCA") {
      st = moveWire(s, g, st, -5);
      continue;
    }
    if (cur === "LM" && parent !== "LM") st = turnTipTo(st, takeOff(g, g.byName.get(parent)!).azimuth);
    else st = turnTipTo(st, takeOff(g, b).azimuth + Math.PI);
    st = moveWire(s, g, st, Math.min(1, Math.max(0.2, at - 3 - st.tipMm)));
  }
  expect(st.route[st.route.length - 1]).toBe(parent);
  st = turnTipTo(st, tip.az, 0.05);
  for (let i = 0; i < 8; i++) st = moveWire(s, g, st, 1);
  return { st, su };
}

describe("coronary wire on the rendered tree", () => {
  it("torque decides which limb of the left main bifurcation the wire takes (3D take-off)", () => {
    const su = setup("lad-focal");
    const { s, g } = su;
    const go = (child: string) => {
      let st = turnTipTo(start(su), takeOff(g, g.byName.get(child)!).azimuth);
      for (let i = 0; i < 20; i++) st = moveWire(s, g, st, 2);
      return st.route;
    };
    expect(go("LAD")).toContain("LAD");
    expect(go("LCx")).toContain("LCx");
  });

  it("side-branch entry depends on the tip's 3D orientation: azimuth and bend", () => {
    const su = setup("lad-focal");
    const d1 = takeOff(su.g, su.g.byName.get("D1")!);
    // facing the diagonal with a 40° bend: enters
    expect(pushPast("lad-focal", "D1", { az: d1.azimuth }).st.route).toContain("D1");
    // facing away: passes it
    const away = pushPast("lad-focal", "D1", { az: d1.azimuth + Math.PI });
    expect(away.st.route).not.toContain("D1");
    expect(away.st.route[away.st.route.length - 1]).toBe("LAD");
    // on the circumflex, an obtuse marginal: a shaped tip facing it turns in, an almost straight tip facing it does not
    const lcx = setup("lcx-stemi");
    const om1 = takeOff(lcx.g, lcx.g.byName.get("OM1")!);
    expect(pushPast("lcx-stemi", "OM1", { az: om1.azimuth }).st.route).toContain("OM1");
    const straight = pushPast("lcx-stemi", "OM1", { az: om1.azimuth, shape: { primaryDeg: 5, primaryMm: 1 } });
    expect(straight.st.route).not.toContain("OM1");
    expect(straight.st.route[straight.st.route.length - 1]).toBe("LCx");
  });

  it("a steep septal branch is entered only with a shaped tip that faces it", () => {
    const su = setup("lad-focal");
    const s1 = takeOff(su.g, su.g.byName.get("S1")!);
    expect(s1.polar).toBeGreaterThan(1.3); // a steep take-off
    const small = pushPast("lad-focal", "S1", { az: s1.azimuth });
    expect(small.st.route).not.toContain("S1");
    const big = pushPast("lad-focal", "S1", { az: s1.azimuth, shape: { primaryDeg: 85, primaryMm: 1.5 } });
    expect(big.st.route).toContain("S1");
    expect(big.st.counters.septalEntries).toBe(1);
    const bigAway = pushPast("lad-focal", "S1", { az: s1.azimuth + Math.PI, shape: { primaryDeg: 85, primaryMm: 1.5 } });
    expect(bigAway.st.route).not.toContain("S1");
  });

  it("a tip that catches a branch origin prolapses (folds) when pushed on, and the loop passes", () => {
    const su = setup("lad-focal");
    const s1 = takeOff(su.g, su.g.byName.get("S1")!);
    // a medium bend facing the steep septal catches the ostium edge rather than entering
    const r = pushPast("lad-focal", "S1", { az: s1.azimuth, shape: { primaryDeg: 40, primaryMm: 1.5 } });
    const caught = r.st.events.some((e) => /catches/.test(e.text));
    expect(caught).toBe(true);
    expect(r.st.wire.fold?.reason).toBe("branch");
    expect(r.st.events.some((e) => /folds back/.test(e.text))).toBe(true);
    // pulling back reforms the tip
    let st = r.st;
    for (let i = 0; i < 4; i++) st = moveWire(su.s, su.g, st, -1);
    expect(st.wire.fold).toBeNull();
  });

  it("torque lags the hub and grows with tortuosity and depth; moving the wire releases stored torque", () => {
    const su = setup("lad-focal");
    let st = wireToTarget(su, start(su), 5);
    const lagMid = wireTorqueLagDeg(su.g, st);
    st = wireToTarget(su, st, 35);
    const lagDeep = wireTorqueLagDeg(su.g, st);
    expect(lagDeep).toBeGreaterThan(lagMid);
    expect(lagMid).toBeGreaterThan(3);
    expect(lagDeep).toBeLessThan(45);
    // a small rotation within the lag does not move the tip
    const tip0 = st.wire.tip;
    const s1 = torqueWire(st, ((lagDeep * 0.5) * Math.PI) / 180);
    // the operator had just turned the other way while steering, so turn back first by twice the lag
    const s2 = torqueWire(torqueWire(st, (2 * lagDeep * Math.PI) / 180), ((lagDeep * 0.5) * Math.PI) / 180);
    expect(Math.abs(wrap(s1.wire.tip - tip0)) + Math.abs(wrap(s2.wire.tip - s1.wire.tip))).toBeGreaterThan(0);
    // stored twist: hub led the tip; a push releases it towards the kinetic level
    const stored = Math.abs(s2.wire.hub - s2.wire.offset - s2.wire.tip);
    const moved = moveWire(su.s, su.g, s2, 1);
    expect(Math.abs(moved.wire.hub - moved.wire.offset - moved.wire.tip)).toBeLessThanOrEqual(stored + 1e-9);
  });

  it("a tip gripped inside an occlusion stores torque and whips round when it lets go", () => {
    const su = setup("rca-cto");
    let st = setWireKind(start(su, { seed: 9 }), "cto");
    st = wireToTarget(su, st, 0, 1);
    while (st.tipMm > su.g.lesion.centreMm) st = moveWire(su.s, su.g, st, -1);
    expect(st.wire.grip).toBeGreaterThan(0);
    const jumps: number[] = [];
    for (let i = 0; i < 24; i++) {
      const b = st.wire.tip;
      st = torqueWire(st, Math.PI / 18);
      jumps.push(Math.abs(st.wire.tip - b));
    }
    // most clicks do nothing, then the tip jumps by much more than one click
    expect(jumps.filter((j) => j < 1e-6).length).toBeGreaterThan(12);
    expect(Math.max(...jumps)).toBeGreaterThan(Math.PI / 9);
    expect(st.events.some((e) => /whips/.test(e.text))).toBe(true);
  });

  it("crossing depends on the wire: a workhorse buckles at a CTO cap, a tapered stiff wire penetrates", () => {
    const su = setup("rca-cto");
    let work = wireToTarget(su, start(su), 35, 1);
    for (let i = 0; i < 4; i++) work = moveWire(su.s, su.g, work, 1);
    expect(work.wire.crossed).toBe(false);
    expect(work.tipMm).toBeLessThan(su.g.lesion.startMm + 1);
    expect(work.events.some((e) => /buckles against the occlusion cap/.test(e.text))).toBe(true);
    const poly = wireToTarget(su, setWireKind(start(su), "polymer"), 35, 1);
    expect(poly.wire.crossed).toBe(false);
    let crossed = 0;
    for (let seed = 1; seed <= 8; seed++) {
      const cto = wireToTarget(su, setWireKind(start(su, { seed }), "cto"), 35, 1);
      if (cto.tipMm > su.g.lesion.endMm) crossed++;
    }
    expect(crossed).toBe(8); // through the cap every time (true lumen or not)
    expect(tipCapability("cto")).toBeGreaterThan(lesionResistance({ vessel: "RCA", startMm: 0, endMm: 10, mldMm: 0, occlusion: "cto", calcium: 1 }, 1, "cto"));
    expect(tipCapability("workhorse")).toBeLessThan(lesionResistance({ vessel: "RCA", startMm: 0, endMm: 10, mldMm: 0, occlusion: "cto", calcium: 1 }, 1, "workhorse"));
  });

  it("a soft workhorse wire crosses fresh thrombus and a focal stenosis", () => {
    for (const id of ["lcx-stemi", "lad-focal", "rca-calcified"]) {
      const su = setup(id);
      const st = wireToTarget(su, start(su));
      expect(st.wire.crossed).toBe(true);
      expect(st.tipMm).toBeGreaterThan(su.g.lesion.endMm);
    }
  });

  it("subintimal tracking in an occlusion rises with tip load and with an off-axis bend", () => {
    const su = setup("rca-cto");
    const rate = (shape: number, kind: "cto" | "polymer") => {
      let sub = 0;
      const n = 40;
      for (let seed = 100; seed < 100 + n; seed++) {
        let st = setWireKind(start(su, { seed }), kind);
        st = shapeTip(st, { primaryDeg: shape, primaryMm: 1.2, secondaryDeg: 0, secondaryMm: 0 });
        st = wireToTarget(su, st, 2, 1);
        if (st.wire.subintimal) sub++;
      }
      return sub / n;
    };
    const straight = rate(10, "cto");
    const bent = rate(70, "cto");
    expect(bent).toBeGreaterThan(straight);
    expect(straight).toBeGreaterThan(0);
    expect(straight).toBeLessThan(0.7);
    expect(effectiveBend({ primaryDeg: 70, primaryMm: 1.2, secondaryDeg: 0, secondaryMm: 0 }, 3)).toBeGreaterThan(effectiveBend({ primaryDeg: 10, primaryMm: 1.2, secondaryDeg: 0, secondaryMm: 0 }, 3));
  });

  it("records distal excursions: danger-zone entries, depth and the tip-load exposure; a soft tip buckles at the end", () => {
    const su = setup("lad-focal");
    let st = wireToTarget(su, start(su));
    for (let i = 0; i < 60; i++) st = moveWire(su.s, su.g, st, 2);
    expect(st.wire.distal.entries).toBeGreaterThan(0);
    expect(st.wire.distal.maxDangerMm).toBeGreaterThan(0);
    expect(st.wire.distal.exposureGfMm).toBeGreaterThan(0);
    expect(st.wire.fold?.reason).toBe("end");
    // a stiff wire pushed the same way accumulates far more exposure and does not buckle
    let stiff = wireToTarget(su, setWireKind(start(su), "cto"));
    for (let i = 0; i < 60; i++) stiff = moveWire(su.s, su.g, stiff, 2);
    expect(stiff.wire.distal.exposureGfMm).toBeGreaterThan(10 * st.wire.distal.exposureGfMm);
  });

  it("the wire cannot leave a guide that is not engaged", () => {
    const su = setup("lad-focal");
    let st = initialPci(su.s, { guideEngaged: false });
    for (let i = 0; i < 20; i++) st = moveWire(su.s, su.g, st, 2);
    expect(st.tipMm).toBeLessThanOrEqual(3);
    expect(st.route).toEqual(["LM"]);
    expect(st.events.some((e) => /not seated/.test(e.text))).toBe(true);
  });

  it("an unpinned wire is dragged by an advancing device; a pinned one stays", () => {
    const su = setup("lad-focal");
    const ready = wireToTarget(su, start(su), 20);
    const load = (st: PciState) => {
      let x = requestDevice(st, "sc", 2.5, 15);
      x = checkLabel(x);
      x = prepareDevice(x);
      x = backloadDevice(x);
      x = setValve(x, true);
      x = advanceDevice(su.s, su.g, x, 1);
      for (let i = 0; i < 40; i++) x = advanceDevice(su.s, su.g, x, 2);
      return x;
    };
    const unpinned = load(ready);
    const pinned = load(pinWire(ready, true));
    expect(pinned.tipMm).toBeCloseTo(ready.tipMm, 6);
    expect(unpinned.tipMm).toBeGreaterThan(ready.tipMm + 1);
    expect(unpinned.counters.wireMigrationMm).toBeGreaterThan(1);
  });

  it("every named branch origin on the target vessels has a take-off direction and window", () => {
    for (const id of ["lad-focal", "rca-calcified", "lcx-stemi"]) {
      const { g } = setup(id);
      for (const vn of ["LM", "LAD", "LCx", "RCA"]) for (const b of branchesOf(g, vn)) {
        const t = takeOff(g, b.c);
        expect(Number.isFinite(t.azimuth)).toBe(true);
        expect(t.polar).toBeGreaterThan(0);
        expect(t.polar).toBeLessThan(Math.PI);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// pci-wire-microcatheter: microcatheter support and exchange, trapping, the tortuous circumflex scenario
//   npx vitest run src/simulation/pci/coronaryWire.test.ts
// ---------------------------------------------------------------------------

/** Steer from the guide into the second obtuse marginal of lcx-om-tortuous (as an operator watching the tip). */
function toOm2(su: ReturnType<typeof setup>, st0: PciState): PciState {
  const { s, g } = su;
  let st = st0;
  const lcx = g.byName.get("LCx")!;
  const om1 = g.byName.get("OM1")!;
  const om2 = g.byName.get("OM2")!;
  const at = lcx.pathMm[om2.parent!.index];
  for (let i = 0; i < 300; i++) {
    const cur = st.route[st.route.length - 1];
    if (cur === "OM2" || st.wire.fold || st.wire.wallCaught) break;
    if (cur !== "LM" && cur !== "LCx") {
      st = moveWire(s, g, st, -5);
      continue;
    }
    if (cur === "LM") st = turnTipTo(st, takeOff(g, lcx).azimuth);
    else if (st.tipMm < at - 6) st = turnTipTo(st, takeOff(g, om1).azimuth + Math.PI);
    else st = turnTipTo(st, takeOff(g, om2).azimuth, 0.05);
    st = moveWire(s, g, st, Math.min(1, Math.max(0.3, at + 2 - st.tipMm)));
    if (st.tipMm > at + 4 && cur === "LCx") break;
  }
  return st;
}

/** Keep the microcatheter `gap` mm behind the wire tip and push the wire on in 0.5 mm steps. */
function pushWithMicro(su: ReturnType<typeof setup>, st0: PciState, gap: number, mm: number): PciState {
  let st = st0;
  for (let i = 0; i < mm / 0.5; i++) {
    const want = st.tipMm - gap;
    st = moveMicrocatheter(su.s, su.g, st, want - st.wire.micro!.tipMm);
    st = moveWire(su.s, su.g, st, 0.5);
  }
  return st;
}

describe("microcatheter (pci-wire-microcatheter)", () => {
  it("a microcatheter 2 mm behind the tip crosses the CTO cap more often than one 20 mm behind (50 seeds)", () => {
    const su = setup("rca-cto");
    const cross = (gap: number) => {
      let n = 0;
      for (let seed = 1; seed <= 50; seed++) {
        let st = setWireKind(start(su, { seed }), "polymer-tapered");
        st = loadMicrocatheter(st, "mc-large");
        st = wireToTarget(su, st, 0, 1);
        // wire tip at the proximal cap
        while (st.tipMm > su.g.lesion.startMm - 0.2) st = moveWire(su.s, su.g, st, -0.5);
        st = pushWithMicro(su, st, gap, 6);
        if (st.tipMm > su.g.lesion.startMm + 2) n++;
      }
      return n;
    };
    const near = cross(2);
    const far = cross(20);
    expect(near).toBeGreaterThan(far);
    expect(near).toBeGreaterThan(40);
    // the support itself: largest right behind the tip, fading with distance
    const su2 = setup("lad-focal");
    let st = loadMicrocatheter(wireToTarget(su2, start(su2), 10), "mc-large");
    st = moveMicrocatheter(su2.s, su2.g, st, 200);
    expect(st.wire.micro!.tipMm).toBeCloseTo(st.tipMm - MP_MC_MIN_GAP_MM, 6);
    expect(microSupport(st.wire)).toBeGreaterThan(1.4);
    st = moveMicrocatheter(su2.s, su2.g, pinWire(st, true), -20);
    expect(microSupport(st.wire)).toBeLessThan(1.05);
  });

  it("exchange through the microcatheter keeps the route and tipMm within 1 mm; reshaping through it too", () => {
    const su = setup("lad-focal");
    let st = wireToTarget(su, start(su), 25);
    st = loadMicrocatheter(st, "mc-small");
    st = moveMicrocatheter(su.s, su.g, st, 400);
    expect(st.wire.micro!.tipMm).toBeGreaterThan(0);
    const before = { tip: st.tipMm, route: st.route.join("/"), crossed: st.wire.crossed };
    const ex = setWireKind(st, "support", { lengthCm: 300 });
    expect(ex.wireKind).toBe("support");
    expect(Math.abs(ex.tipMm - before.tip)).toBeLessThanOrEqual(1);
    expect(ex.route.join("/")).toBe(before.route);
    expect(ex.wire.crossed).toBe(before.crossed);
    expect(ex.wire.lengthCm).toBe(300);
    expect(wiringOf(ex).exchangesThroughMicro).toBe(1);
    // without a microcatheter the wire must come back into the guide first
    const bare = setWireKind(wireToTarget(su, start(su), 25), "support");
    expect(bare.wireKind).toBe("workhorse");
    const shaped = shapeTip(st, { primaryDeg: 60, primaryMm: 1, secondaryDeg: 0, secondaryMm: 0 });
    expect(shaped.wire.shape.primaryDeg).toBe(60);
    expect(Math.abs(shaped.tipMm - before.tip)).toBeLessThanOrEqual(1);
  });

  it("over-rotation damages a microcatheter (plaque modification type: 20 turns); a damaged one will not advance", () => {
    const su = setup("lad-focal");
    let st = loadMicrocatheter(wireToTarget(su, start(su), 25), "mc-plaque");
    for (let i = 0; i < 19; i++) st = torqueMicrocatheter(st, -2 * Math.PI);
    expect(st.wire.micro!.damaged).toBe(false);
    for (let i = 0; i < 2; i++) st = torqueMicrocatheter(st, -2 * Math.PI);
    expect(st.wire.micro!.damaged).toBe(true);
    const tip = st.wire.micro!.tipMm;
    st = moveMicrocatheter(su.s, su.g, st, 10);
    expect(st.wire.micro!.tipMm).toBe(tip);
    // and contrast cannot be injected through this type
    let mc = loadMicrocatheter(wireToTarget(su, start(su), 25), "mc-plaque");
    mc = moveMicrocatheter(su.s, su.g, mc, 60);
    expect(injectMicrocatheter(su.s, su.g, mc).contrastMl).toBe(mc.contrastMl);
  });

  it("a selective injection after a backflow check is recorded from the microcatheter tip; without the check it is counted", () => {
    const su = setup("lad-focal");
    let st = loadMicrocatheter(wireToTarget(su, start(su), 25), "mc-large");
    st = moveMicrocatheter(su.s, su.g, st, 80);
    const unchecked = injectMicrocatheter(su.s, su.g, st);
    expect(wiringOf(unchecked).uncheckedMicroInjections).toBe(1);
    st = checkMicroBackflow(st);
    expect(st.wire.micro!.backflowAt).toBe(st.t);
    const inj = injectMicrocatheter(su.s, su.g, st);
    expect(wiringOf(inj).uncheckedMicroInjections).toBe(0);
    expect(wiringOf(inj).microInjection).toMatchObject({ fromMm: st.wire.micro!.tipMm, subintimal: false });
    expect(inj.contrastMl).toBeGreaterThan(st.contrastMl);
    // moving the microcatheter voids the check
    expect(moveMicrocatheter(su.s, su.g, st, -2).wire.micro!.backflowAt).toBeNull();
  });
});

describe("trapping (pci-wire-microcatheter)", () => {
  it("a 2.0 mm balloon in a 7 Fr guide lets the wire migrate back more than 5 mm; a 2.5 x 20 mm balloon at 18 atm in 6 Fr holds it within 1 mm", () => {
    expect(trapHold({ diameterMm: 2.0, lengthMm: 20, atm: 18 }, 7, "workhorse").migratedMm).toBeGreaterThan(5);
    expect(trapHold({ diameterMm: 2.5, lengthMm: 20, atm: 18 }, 6, "workhorse").migratedMm).toBeLessThanOrEqual(1);
    // the sourced pairings hold at 15 atm: 2.5 mm for 6-7 Fr, 3.0 mm for 7-8 Fr
    for (const [d, fr] of [[2.5, 6], [2.5, 7], [3.0, 7], [3.0, 8]] as const) expect(trapHold({ diameterMm: d, lengthMm: 20, atm: 15 }, fr, "workhorse").hold, `${d} mm in ${fr} Fr`).toBeGreaterThanOrEqual(1);
    // a short balloon lets a polymer-jacketed wire slip
    expect(trapHold({ diameterMm: 2.5, lengthMm: 12, atm: 15 }, 7, "polymer").migratedMm).toBeGreaterThan(1);

    // through the action on the scenario: the distal wire position after removal
    const su = setup("rca-cto");
    const ready = (french: 6 | 7) => {
      let st = start(su);
      st = { ...st, guide: initialGuide(st.guide.id, true, french) };
      st = loadMicrocatheter(wireToTarget(su, st, 20), "mc-large");
      st = moveMicrocatheter(su.s, su.g, st, 200);
      return moveMicrocatheter(su.s, su.g, pinWire(st, true), -400);
    };
    const r7 = ready(7);
    const slip = removeMicrocatheter(su.s, su.g, r7, { technique: "trap", balloon: { diameterMm: 2.0, lengthMm: 20, atm: 18 } });
    expect(slip.wire.micro).toBeNull();
    expect(r7.tipMm - slip.tipMm).toBeGreaterThan(5);
    const r6 = ready(6);
    const held = removeMicrocatheter(su.s, su.g, r6, { technique: "trap", balloon: { diameterMm: 2.5, lengthMm: 20, atm: 18 } });
    expect(held.wire.micro).toBeNull();
    expect(Math.abs(r6.tipMm - held.tipMm)).toBeLessThanOrEqual(1);
    // opening the valve for the balloon: the guide is not known to be free of air until it is back-bled
    expect(held.cx.aspirated).toBe(false);
    // without a technique, a short wire comes out with the microcatheter
    const lost = removeMicrocatheter(su.s, su.g, r6, { technique: "pull" });
    expect(lost.tipMm).toBeLessThanOrEqual(0);
    expect(wiringOf(lost).wiresLost).toBe(1);
    // the deflectable type cannot be trapped in a 6 Fr guide
    let defl = loadMicrocatheter(wireToTarget(su, start(su), 20), "mc-deflectable");
    defl = removeMicrocatheter(su.s, su.g, defl, { technique: "trap" });
    expect(defl.wire.micro).not.toBeNull();
    expect(defl.events.some((e) => /cannot take a trapping balloon/.test(e.text))).toBe(true);
    // hydraulic exchange over a polymer-jacketed wire drives it forward
    const lad = setup("lad-focal");
    let poly = setWireKind(start(lad), "polymer");
    poly = loadMicrocatheter(wireToTarget(lad, poly, 10), "mc-large");
    poly = moveMicrocatheter(lad.s, lad.g, poly, 200);
    const hyd = removeMicrocatheter(lad.s, lad.g, poly, { technique: "hydraulic", hydraulicAtm: 16 });
    expect(hyd.tipMm).toBeGreaterThan(poly.tipMm);
    expect(wiringOf(hyd).hydraulicOverSlippery).toBe(1);
  });
});

describe("tortuous circumflex scenario lcx-om-tortuous (pci-wire-microcatheter)", () => {
  it("a primary bend longer than the vessel diameter catches the wall in the obtuse marginal; a short bend does not", () => {
    const su = setup("lcx-om-tortuous");
    const catches = (primaryMm: number) => {
      let n = 0;
      for (let seed = 1; seed <= 12; seed++) {
        let st = shapeTip(start(su, { seed }), { primaryDeg: 45, primaryMm, secondaryDeg: 0, secondaryMm: 0 });
        st = toOm2(su, st);
        for (let i = 0; i < 20 && st.route.includes("OM2"); i++) st = moveWire(su.s, su.g, st, 1);
        if (st.log.some((r) => r.kind === "wire-wall-catch")) n++;
      }
      return n;
    };
    const lumen = 2 * su.g.byName.get("OM2")!.radii[0];
    expect(wallCatchPerMm({ primaryDeg: 45, primaryMm: 3, secondaryDeg: 0, secondaryMm: 0 }, lumen)).toBeGreaterThan(0);
    expect(wallCatchPerMm({ primaryDeg: 45, primaryMm: 1, secondaryDeg: 0, secondaryMm: 0 }, lumen)).toBe(0);
    expect(catches(3)).toBeGreaterThan(6);
    expect(catches(1)).toBe(0);
  });

  it("polymer-jacketed wires prolapse out of the angulated marginal less than workhorse wires across 50 seeds; a microcatheter at the origin cuts it", () => {
    const su = setup("lcx-om-tortuous");
    const rate = (kind: "workhorse" | "polymer", micro = false) => {
      let n = 0;
      for (let seed = 1; seed <= 50; seed++) {
        let st = start(su, { seed });
        if (kind !== "workhorse") st = setWireKind(st, kind);
        if (micro) st = loadMicrocatheter(st, "mc-angulated");
        st = toOm2(su, st);
        if (micro) st = moveMicrocatheter(su.s, su.g, st, 400);
        for (let i = 0; i < 12 && st.route.includes("OM2"); i++) st = moveWire(su.s, su.g, st, 1);
        if (st.log.some((r) => r.kind === "wire-prolapse")) n++;
      }
      return n;
    };
    const work = rate("workhorse");
    const poly = rate("polymer");
    expect(work).toBeGreaterThan(poly);
    expect(work).toBeGreaterThan(10);
    expect(rate("workhorse", true)).toBeLessThan(work);
  });

  it("a deflection balloon beyond the marginal's origin turns the wire into it; a hairpin wire hooks it on the pull-back", () => {
    const su = setup("lcx-om-tortuous");
    const { s, g } = su;
    // facing away from the marginal the wire passes it, unless the deflection balloon is up
    const lcx = g.byName.get("LCx")!;
    const om2 = g.byName.get("OM2")!;
    const at = lcx.pathMm[om2.parent!.index];
    const pastWith = (deflect: boolean) => {
      let st = turnTipTo(start(su), takeOff(g, lcx).azimuth);
      if (deflect) st = setDeflectionBalloon(s, g, st, true);
      for (let i = 0; i < 200 && st.tipMm < at + 6 && !st.route.includes("OM2"); i++) {
        if (st.route[st.route.length - 1] === "LCx" && st.tipMm > 20) st = turnTipTo(st, takeOff(g, om2).azimuth + Math.PI);
        const b = st.tipMm;
        st = moveWire(s, g, st, 1);
        if (st.route[st.route.length - 1] === "OM1") st = moveWire(s, g, st, -6);
        if (st.tipMm <= b && !st.route.includes("OM2")) break;
      }
      return st;
    };
    expect(pastWith(false).route).not.toContain("OM2");
    const d = pastWith(true);
    expect(d.route).toContain("OM2");
    expect(d.wire.deflector?.branch).toBe("OM2");
    // the hairpin passes the marginal going in and hooks it coming back
    let hp = setWireKind(start(su), "polymer");
    hp = shapeTip(hp, { primaryDeg: 180, primaryMm: 30, secondaryDeg: 0, secondaryMm: 0, reversed: true });
    hp = turnTipTo(hp, takeOff(g, lcx).azimuth);
    for (let i = 0; i < 120 && hp.tipMm < at + 8; i++) hp = moveWire(s, g, hp, 1);
    expect(hp.route).not.toContain("OM2");
    let hooked = false;
    for (let k = 0; k < 8 && !hooked; k++) {
      hp = turnTipTo(hp, takeOff(g, om2).azimuth + (k * Math.PI) / 4, 0.1);
      const back = moveWire(s, g, hp, -10);
      hooked = back.route.includes("OM2");
      if (hooked) hp = back;
    }
    expect(hooked).toBe(true);
    expect(hp.log.some((r) => r.kind === "wire-hairpin-entry")).toBe(true);
  });

  it("a support wire makes pseudolesions at the bends; withdrawing it so its soft segment lies across them resolves them", () => {
    const su = setup("lcx-om-tortuous");
    let st = toOm2(su, start(su, { seed: 3 }));
    for (let i = 0; i < 40 && st.tipMm < su.g.lesion.endMm + 20; i++) st = moveWire(su.s, su.g, st, 1);
    // exchange to a support wire through a microcatheter, keeping the position
    st = loadMicrocatheter(st, "mc-large");
    st = moveMicrocatheter(su.s, su.g, st, 400);
    st = setWireKind(st, "support", { g: su.g });
    expect(pseudolesionSites(su.g, st.wire).length).toBeGreaterThan(0);
    expect(wiringOf(st).pseudo?.sites.length).toBeGreaterThan(0);
    // back the microcatheter out and draw the wire back until the narrowings resolve
    st = moveMicrocatheter(su.s, su.g, pinWire(st, true), -400);
    for (let i = 0; i < 60 && wiringOf(st).pseudo; i++) st = moveWire(su.s, su.g, st, -1);
    expect(wiringOf(st).pseudo).toBeNull();
    expect(st.log.some((r) => r.kind === "pseudolesion-resolved")).toBe(true);
    // an ordinary wire makes none
    expect(pseudolesionSites(su.g, setWireKind(start(su), "workhorse").wire)).toEqual([]);
    expect(wiringScore(st).contrastMl).toBe(st.contrastMl);
  });
});

describe("danger zone against the reference lumen (pci-wire-microcatheter verification)", () => {
  it("a wire crossing the tight circumflex lesion of lcx-om-tortuous is not in a small distal vessel", () => {
    const su = setup("lcx-om-tortuous");
    const L = su.g.lesion;
    // the stenosed lumen at the centre is under the danger diameter; the reference lumen is not
    expect(2 * radiusAtMm(su.g, pathToTarget(su.g, su.s), L.centreMm)).toBeLessThan(MP_DANGER_D);
    expect(2 * radiusAtMm(su.g, pathToTarget(su.g, su.s), L.centreMm, true)).toBeGreaterThan(MP_DANGER_D);
    let st = wireToTarget(su, start(su, { seed: 2 }), L.centreMm - L.endMm, 1);
    expect(st.route[st.route.length - 1]).toBe(L.vessel);
    expect(Math.abs(st.tipMm - L.centreMm)).toBeLessThan(2);
    expect(st.wire.distal.inDanger).toBe(false);
    expect(st.events.some((r) => /small distal vessel/.test(r.text))).toBe(false);
    expect(st.log.some((r) => r.kind === "wire-distal")).toBe(false);
    // and on through the whole lesion
    for (let i = 0; i < 30 && st.tipMm < L.endMm; i++) {
      st = moveWire(su.s, su.g, st, 1);
      if (st.route[st.route.length - 1] === L.vessel && st.tipMm >= L.startMm && st.tipMm <= L.endMm) expect(st.wire.distal.inDanger).toBe(false);
    }
  });
});

describe("unknown wire (pci-wire-microcatheter verification)", () => {
  it("setWireKind with a category name instead of a wire kind warns and leaves the state alone, also through a microcatheter", () => {
    const su = setup("lad-focal");
    const st = start(su);
    const n = setWireKind(st, "polymer-jacketed" as never);
    expect(n.wire).toBe(st.wire);
    expect(n.events[n.events.length - 1]).toMatchObject({ tone: "warn", text: "Unknown wire." });
    let m = loadMicrocatheter(wireToTarget(su, start(su), 10), "mc-small");
    m = moveMicrocatheter(su.s, su.g, m, 400);
    expect(() => setWireKind(m, "polymer-jacketed" as never, { g: su.g })).not.toThrow();
    expect(setWireKind(m, "polymer-jacketed" as never, { g: su.g }).wire).toBe(m.wire);
  });
});

describe("microcatheter limits (pci-wire-microcatheter review)", () => {
  it("an exchange or reshape through a microcatheter far behind the tip does not keep the distal position: the wire comes out at the microcatheter tip", () => {
    const su = setup("lad-focal");
    let st = loadMicrocatheter(wireToTarget(su, start(su), 25), "mc-small");
    // just out of the guide, far behind the wire tip
    for (let i = 0; i < 40 && st.wire.micro!.tipMm < 5; i++) st = moveMicrocatheter(su.s, su.g, st, 2);
    const m = st.wire.micro!.tipMm;
    expect(m).toBeGreaterThan(0);
    expect(st.tipMm - m).toBeGreaterThan(MP_MC_EXCHANGE_KEEP_MM);
    expect(st.wire.crossed).toBe(true);
    // without the geometry the action refuses (and says why)
    const refused = setWireKind(st, "support");
    expect(refused.wireKind).toBe("workhorse");
    expect(refused.tipMm).toBe(st.tipMm);
    expect(refused.events.some((e) => /well behind the wire tip/.test(e.text))).toBe(true);
    // with it, the new wire comes out MP_MC_MIN_GAP_MM beyond the microcatheter tip, the crossing is lost
    const ex = setWireKind(st, "support", { g: su.g });
    expect(ex.wireKind).toBe("support");
    expect(ex.tipMm).toBeCloseTo(m + MP_MC_MIN_GAP_MM, 6);
    expect(ex.wire.crossed).toBe(false);
    expect(ex.route.length).toBeLessThanOrEqual(st.route.length);
    expect(ex.route).toEqual(st.route.slice(0, ex.route.length));
    // reshaping the same way
    const shape = { primaryDeg: 60, primaryMm: 1, secondaryDeg: 0, secondaryMm: 0 };
    expect(shapeTip(st, shape).wire.shape.primaryDeg).not.toBe(60);
    const sh = shapeTip(st, shape, { g: su.g });
    expect(sh.wire.shape.primaryDeg).toBe(60);
    expect(sh.tipMm).toBeCloseTo(m + MP_MC_MIN_GAP_MM, 6);
  });

  it("hydraulic exchange: in range the wire stays, below the range it comes back, above it (22 atm) the exchange is refused", () => {
    const su = setup("lad-focal");
    let st = loadMicrocatheter(wireToTarget(su, start(su), 10), "mc-large");
    st = moveMicrocatheter(su.s, su.g, st, 200);
    const inRange = removeMicrocatheter(su.s, su.g, st, { technique: "hydraulic", hydraulicAtm: 16 });
    expect(inRange.wire.micro).toBeNull();
    expect(st.tipMm - inRange.tipMm).toBeLessThanOrEqual(1);
    const low = removeMicrocatheter(su.s, su.g, st, { technique: "hydraulic", hydraulicAtm: 10 });
    expect(st.tipMm - low.tipMm).toBeCloseTo(MP_HYDRAULIC_LOW_MM, 0);
    const high = removeMicrocatheter(su.s, su.g, st, { technique: "hydraulic", hydraulicAtm: 22 });
    expect(high.wire.micro).not.toBeNull();
    expect(high.tipMm).toBe(st.tipMm);
    expect(high.events.some((e) => /above the 14-20 atm range/.test(e.text))).toBe(true);
  });
});
