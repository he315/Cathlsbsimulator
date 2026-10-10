// Two rails (pci-two-rail-engine): a second wire in the same guide, jailing under the main-vessel stent,
// rewiring the side branch through a chosen strut cell, kissing balloons, the POT and a wire passed outside
// a stent's struts. The anatomy is the core pack's lad-focal: the mid-LAD lesion (61.4-73.4 mm) with the second
// diagonal (D2) leaving the LAD 3 mm beyond it, so a 20 mm stent across the lesion covers D2's origin.
import { describe, expect, it } from "vitest";
import { samplePos } from "../../render/xray/coronaryTree";
import { cloneCx, initialCx } from "../complications/engine";
import { newComplication } from "../complications/common";
import { MP_PROXIMAL_CELL_RESIDUAL, carinaShiftMm, sideBranchRisk, type SideBranchExposure } from "../complications/sideBranch";
import { pciFlowMods } from "../../ui/pci/pciDevicesRender";
import { draw as drawRails, railFlowMods } from "../../ui/pci/render/rails";
import type { PciDrawContext } from "../../ui/pci/pciDevicesRender";
import { advanceDevice, applyStartSetup, deflate, inflate, initialPci, loadDevice, moveDevice, moveWire, removeDevice, type PciState } from "../angioPci";
import { takeOff, wrap } from "./geometry";
import { activeRailOf, railsOf, syncRail, twoWires as hasTwoWires } from "./state";
import { setup, start, turnTipTo, wireToTarget, type Setup } from "./testSetup";
import { cellOf, cellScaffoldsOstium, underStrutChance, loadSecondWire, ostiaUnderStents, railBranchCompromiseSeen, removeRailWire, setActiveRail } from "./actions/wire";
import { MP_EDGE_FORCE_BITES, MP_EDGE_STOP_MM, railEdge } from "./actions/devices";
import { deflateKiss, kissBalloons, kissing } from "./actions/inflation";
import { kissEffectiveDiameter, ostiumSpan, ringCentreMm } from "./stentGeometry";

const su: Setup = setup("lad-focal");
const { s, g } = su;
const SB = "D2";

/** Steer the active rail's wire into `branch` and `beyondMm` along it (as testSetup's operator does for the lesion). */
function wireToBranch(st0: PciState, branch: string, beyondMm = 12): PciState {
  let st = st0;
  const child = g.byName.get(branch)!;
  const parent = child.parent!.name;
  const at = g.byName.get(parent)!.pathMm[child.parent!.index];
  for (let guard = 0; guard < 400; guard++) {
    const cur = st.route[st.route.length - 1];
    if (cur === branch && st.tipMm >= at + beyondMm) break;
    if (cur !== branch && cur !== parent && cur !== "LM") {
      st = moveWire(s, g, st, -4);
      continue;
    }
    if (cur === "LM") st = turnTipTo(st, takeOff(g, g.byName.get(parent)!).azimuth);
    else if (cur === parent) {
      // past the origin without entering: pull back behind it
      if (st.tipMm > at + 0.5) {
        st = moveWire(s, g, st, -Math.min(6, st.tipMm - at + 2));
        continue;
      }
      if (st.tipMm < at - 8) {
        // face away from the branches before it
        const v = g.byName.get(parent)!;
        const ahead = (g.children.get(parent) ?? []).filter((c) => v.pathMm[c.parent!.index] > st.tipMm && c.name !== branch).sort((a, b) => a.parent!.index - b.parent!.index)[0];
        if (ahead && v.pathMm[ahead.parent!.index] < at) st = turnTipTo(st, takeOff(g, ahead).azimuth + Math.PI);
        else st = turnTipTo(st, takeOff(g, child).azimuth);
      } else st = turnTipTo(st, takeOff(g, child).azimuth);
    }
    st = moveWire(s, g, st, 1.5);
  }
  return st;
}

/** The case at the point every test starts from: wire 1 across the lesion, wire 2 in D2. */
function twoWires(): PciState {
  let st = wireToTarget(su, start(su));
  st = loadSecondWire(st);
  st = setActiveRail(st, 1);
  st = wireToBranch(st, SB);
  return setActiveRail(st, 0);
}

/** Deploy a 2.5 x 20 mm stent over the lesion and D2's origin on the active rail (58-78 mm), and take the balloon out. */
function stentMv(st0: PciState): PciState {
  let st = loadDevice(st0, "stent", "semi-compliant", 2.5, 20);
  st = moveDevice(st, 68 - st.device!.centreMm);
  st = inflate(s, g, st, 12);
  st = deflate(st);
  return removeDevice({ ...st, valveOpen: true });
}

const ostium = () => {
  const child = g.byName.get(SB)!;
  const to = takeOff(g, child);
  return ostiumSpan(to.atMm, 2 * to.childRadius, to.polar);
};

describe("two rails: the state", () => {
  it("a single-wire case has no rails (railsOf gives the one rail and an empty one) and moves exactly as before", () => {
    const st = initialPci(s);
    expect(st.rails).toBeUndefined();
    const [a, b] = railsOf(st);
    expect(a.wire).toBe(st.wire);
    expect(b.wire).toBeNull();
    const w = wireToTarget(su, start(su));
    expect(w.rails).toBeUndefined();
    expect(stentMv(w).rails).toBeUndefined();
  });

  it("a second wire is loaded on rail 1; setActiveRail moves the legacy fields between the rails and syncRail keeps them", () => {
    const st0 = wireToTarget(su, start(su));
    let st = loadSecondWire(st0);
    expect(st.rails![1].wire!.tipMm).toBeLessThan(0);
    expect(activeRailOf(st)).toBe(0);
    st = setActiveRail(st, 1);
    expect(activeRailOf(st)).toBe(1);
    expect(st.tipMm).toBeLessThan(0);
    // the first wire is kept on its rail
    expect(st.rails![0].wire!.tipMm).toBeCloseTo(st0.tipMm, 6);
    st = moveWire(s, g, st, 30);
    expect(syncRail(st).rails![1].wire!.tipMm).toBeCloseTo(st.tipMm, 6);
    st = setActiveRail(st, 0);
    expect(st.tipMm).toBeCloseTo(st0.tipMm, 6);
    expect(st.log.filter((r) => r.kind === "rail-active").map((r) => r.data.rail)).toEqual([1, 0]);
  });
});

describe("two rails: jailing, the cell and the kiss", () => {
  const st2 = twoWires();
  const stented = stentMv(st2);

  it("rail 2 reaches D2 (the setting of the tests)", () => {
    expect(railsOf(st2)[1].wire!.route).toContain(SB);
    expect(st2.route[st2.route.length - 1]).toBe("LAD");
    // a second wire into a branch at the target is not counted off the route
    expect(st2.counters.offRouteBranches).toBe(0);
  });

  it("deploying the main-vessel stent with rail B in the diagonal sets rails[1].jailed", () => {
    expect(stented.rails![1].jailed).toMatchObject({ stentIdx: 0, branch: SB });
    expect(stented.rails![1].jailed!.jailedMm).toBeGreaterThan(10);
    expect(stented.rails![0].jailed).toBeNull();
    expect(stented.log.some((r) => r.kind === "wire-jailed" && r.data.branch === SB)).toBe(true);
    // the exposure follows the carina shift with two rails
    expect(ostiaUnderStents(g, stented.stents).map((o) => o.branch)).toContain(SB);
  });

  /** Rewire rail B: pull the jailed wire out, a new second wire into the LAD beyond the carina, aim it at D2, pull back to `fallTo`, push in. */
  function rewire(fallTo: number, base: PciState = stented): PciState {
    let st = removeRailWire(base, 1);
    expect(railsOf(st)[1].wire).toBeNull();
    st = setActiveRail(loadSecondWire(st), 1);
    st = wireToTarget(su, st, 7);
    expect(st.route[st.route.length - 1]).toBe("LAD");
    expect(st.tipMm).toBeGreaterThan(ostium().carinaMm);
    expect(railsOf(st)[1].underStrut).toBeNull();
    st = turnTipTo(st, takeOff(g, g.byName.get(SB)!).azimuth, 0.05);
    st = moveWire(s, g, st, -(st.tipMm - (ostium().carinaMm + 0.2)));
    st = moveWire(s, g, st, -(st.tipMm - fallTo));
    expect(railsOf(st)[1].fallIn?.branch).toBe(SB);
    for (let i = 0; i < 10 && !st.route.includes(SB); i++) st = moveWire(s, g, st, 1);
    for (let i = 0; i < 8; i++) st = moveWire(s, g, st, 1.5);
    return st;
  }

  it("rewiring rail B at the distal stent position reports cell 'distal'", () => {
    const o = ostium();
    const st = rewire(o.proxMm + 0.7 * (o.carinaMm - o.proxMm));
    expect(st.route).toContain(SB);
    const r = railsOf(st)[1];
    expect(r.cell).toBe("distal");
    expect(r.crossing).toMatchObject({ branch: SB, approach: "withdraw", cell: "distal" });
    expect(cellScaffoldsOstium(r.cell)).toBe(true);
    expect(st.log.some((x) => x.kind === "wire-cell" && x.data.cell === "distal")).toBe(true);
    // the live log names what is seen, not the cell
    expect(st.events.some((e) => /cell/i.test(e.text))).toBe(false);
  });

  it("only the first wire's first crossing gets the support advice; the second wire and a rewire through the stent are tagged", () => {
    const advice = /Take it well into the distal vessel/;
    const crossings = (st: PciState) => st.log.filter((x) => x.kind === "wire-crossed");
    // the case start: wire 1 across the lesion, then wire 2 past it into D2
    const base = twoWires();
    expect(base.events.filter((e) => advice.test(e.text)).length).toBe(1);
    const first = crossings(base);
    expect(first.length).toBeGreaterThanOrEqual(1);
    expect(first[0].data).toEqual({});
    for (const x of first.slice(1)) expect(x.data).toMatchObject({ rail: 2 });
    // after the main-vessel stent, the new second wire passes the stented lesion
    const o = ostium();
    const st = rewire(o.proxMm + 0.7 * (o.carinaMm - o.proxMm));
    expect(st.events.filter((e) => advice.test(e.text)).length).toBe(1);
    const later = crossings(st).slice(crossings(stented).length);
    expect(later.length).toBeGreaterThanOrEqual(1);
    for (const x of later) expect(x.data).toMatchObject({ rail: 2, stented: true });
  });

  it("a wire that goes forward into the ostium crosses a proximal cell; the cells follow the fraction of the ostium", () => {
    expect(cellOf(0.1)).toBe("proximal");
    expect(cellOf(0.6)).toBe("distal");
    expect(cellOf(0.95)).toBe("carina");
    let st = removeRailWire(stented, 1);
    st = setActiveRail(loadSecondWire(st), 1);
    st = wireToBranch(st, SB);
    const r = railsOf(st)[1];
    expect(st.route).toContain(SB);
    expect(r.underStrut).toBeNull();
    expect(r.crossing).toMatchObject({ branch: SB, approach: "advance", cell: "proximal" });
    expect(cellScaffoldsOstium(r.cell)).toBe(false);
  });

  /** A balloon on each rail: 2.5 x 12 mm in the LAD across the carina (rail A), 2.0 x 12 mm in D2's ostium (rail B). */
  function balloons(st0: PciState): PciState {
    const o = ostium();
    let st = loadDevice(setActiveRail(st0, 1), "balloon", "non-compliant", 2.0, 12);
    st = moveDevice(st, o.proxMm - 1 + 6 - st.device!.centreMm);
    st = loadDevice(setActiveRail(st, 0), "balloon", "non-compliant", 2.5, 12);
    return moveDevice(st, o.carinaMm - 4 - st.device!.centreMm);
  }

  it("kissing gives two occlusions in pciFlowMods (with the second rail's balloon, railFlowMods)", () => {
    const o = ostium();
    let st = balloons(rewire(o.proxMm + 0.7 * (o.carinaMm - o.proxMm)));
    const before = railFlowMods(st, g, su.tree, pciFlowMods(s, st, g, su.tree));
    expect(before.occlusions ?? []).toHaveLength(0);
    st = kissBalloons(s, g, st, 10);
    expect(kissing(st)).toBe(true);
    const base = pciFlowMods(s, st, g, su.tree);
    expect(base.occlusions).toHaveLength(1);
    const mods = railFlowMods(st, g, su.tree, base);
    expect(mods.occlusions).toHaveLength(2);
    expect(new Set(mods.occlusions!.map((x) => x.vessel))).toEqual(new Set(["LAD", SB]));
    const k = st.log.find((r) => r.kind === "kissing")!;
    expect(k.data.effectiveMm).toBeCloseTo(kissEffectiveDiameter(Number(k.data.dMv), Number(k.data.dSb)), 6);
    expect(st.stents[0].oval).toBeTruthy();
    st = deflateKiss(st);
    expect(kissing(st)).toBe(false);
    expect(railFlowMods(st, g, su.tree, pciFlowMods(s, st, g, su.tree)).occlusions ?? []).toHaveLength(0);
  });

  it("the second rail is drawn (its wire and its inflated balloon) only when there are two rails", () => {
    const x: PciDrawContext = { s, tree: su.tree, place: (sm) => samplePos(su.tree.heart, sm), ctx: { bolusT: null, injecting: false }, atm: 0 };
    expect(drawRails(stentMv(wireToTarget(su, start(su))), g, x).tubes).toHaveLength(0);
    expect(drawRails(stented, g, x).tubes.length).toBeGreaterThanOrEqual(2);
  });

  it("a compromised branch rewired through a distal cell is treated by the kiss; through a proximal cell struts stay across the ostium", () => {
    const o = ostium();
    const cx = cloneCx(stented.cx);
    cx.list.push(newComplication(cx, stented.t, "side-branch", { route: ["LM", "LAD", SB], vessel: SB, atMm: o.proxMm + 1, lengthMm: 3, severity: 0.7, grade: "TIMI 2", cause: "carina shift after main-vessel stenting", stage: "prodrome" }));
    const withSb: PciState = { ...stented, cx };
    // what an event source raises: the jailed branch's compromise once an injection has shown it
    expect(railBranchCompromiseSeen(withSb)).toBe(false);
    expect(railBranchCompromiseSeen({ ...withSb, lastInjectionT: withSb.t })).toBe(true);
    // rewired through a distal cell (the rewire bail-out), then kissed
    const distal = rewire(o.proxMm + 0.7 * (o.carinaMm - o.proxMm), withSb);
    expect(distal.cx.list.find((x) => x.kind === "side-branch")!.data.rewired).toBe(1);
    const kd = kissBalloons(s, g, balloons(distal), 10);
    const c = kd.cx.list.find((x) => x.kind === "side-branch")!;
    expect(c.bailouts).toEqual(["rewire-side-branch", "kissing-balloon"]);
    expect(c.severity).toBeLessThan(MP_PROXIMAL_CELL_RESIDUAL);
    expect(c.data.strutsAcrossOstium).toBeUndefined();
    // the same kiss after a proximal-cell crossing leaves struts across the ostium and a residual narrowing
    const prox: PciState = { ...distal, rails: [distal.rails![0], { ...distal.rails![1], cell: "proximal" }] };
    const kp = kissBalloons(s, g, balloons(prox), 10);
    const cp = kp.cx.list.find((x) => x.kind === "side-branch")!;
    expect(cp.severity).toBeGreaterThanOrEqual(MP_PROXIMAL_CELL_RESIDUAL);
    expect(cp.data.strutsAcrossOstium).toBe(1);
  });

  it("rewiring a compromised branch through the struts applies the rewire bail-out", () => {
    const o = ostium();
    const cx = cloneCx(stented.cx);
    cx.list.push(newComplication(cx, stented.t, "side-branch", { route: ["LM", "LAD", SB], vessel: SB, atMm: o.proxMm + 1, lengthMm: 3, severity: 0.95, grade: "TIMI 0-1", cause: "carina shift after main-vessel stenting", stage: "overt" }));
    let st: PciState = { ...stented, cx };
    st = removeRailWire(st, 1);
    st = setActiveRail(loadSecondWire(st), 1);
    st = wireToTarget(su, st, 7);
    st = turnTipTo(st, takeOff(g, g.byName.get(SB)!).azimuth, 0.05);
    st = moveWire(s, g, st, -(st.tipMm - (o.carinaMm + 0.2)));
    st = moveWire(s, g, st, -(st.tipMm - (o.proxMm + 0.7 * (o.carinaMm - o.proxMm))));
    for (let i = 0; i < 10 && !st.route.includes(SB); i++) st = moveWire(s, g, st, 1);
    const c = st.cx.list.find((x) => x.kind === "side-branch")!;
    expect(c.bailouts).toContain("rewire-side-branch");
    expect(c.severity).toBeLessThan(0.9);
  });

  /** balloons() with a main-vessel balloon of the given size. */
  function balloonsMv(st0: PciState, mvD: number): PciState {
    const o = ostium();
    let st = loadDevice(setActiveRail(st0, 1), "balloon", "non-compliant", 2.0, 12);
    st = moveDevice(st, o.proxMm - 1 + 6 - st.device!.centreMm);
    st = loadDevice(setActiveRail(st, 0), "balloon", "non-compliant", mvD, 12);
    return moveDevice(st, o.carinaMm - 4 - st.device!.centreMm);
  }

  it("the kiss keeps what the main-vessel balloon did to the stent (3.0 mm non-compliant at 14 atm in the 2.5 mm stent)", () => {
    const o = ostium();
    const st = balloonsMv(rewire(o.proxMm + 0.7 * (o.carinaMm - o.proxMm)), 3.0);
    const mvDistal = st.device!.centreMm + st.device!.lengthMm / 2;
    const plain = inflate(s, g, st, 14);
    const k = kissBalloons(s, g, st, 14);
    expect(kissing(k)).toBe(true);
    const p0 = st.stents[0];
    const p1 = plain.stents[0];
    const pk = k.stents[0];
    let grew = 0;
    p0.ringD.forEach((d, i) => {
      if (p1.ringD[i] > d + 1e-6) grew++;
      if (ringCentreMm(p0, i) <= mvDistal) expect(pk.ringD[i], `ring ${i}`).toBeGreaterThanOrEqual(p1.ringD[i] - 1e-9);
    });
    // the plain inflation enlarged the stent, so the comparison bites
    expect(grew).toBeGreaterThan(0);
    expect(pk.diameter).toBeGreaterThanOrEqual(p1.diameter);
    // the branch balloon was inflated as a balloon through the struts
    expect(k.log.some((r) => r.kind === "sb-dilatation" && r.data.branch === SB)).toBe(true);
  });

  it("the kiss is at the main-vessel stent over the branch origin, not the last stent placed", () => {
    const o = ostium();
    const st0 = balloonsMv(rewire(o.proxMm + 0.7 * (o.carinaMm - o.proxMm)), 2.5);
    const p = st0.stents[0];
    // a later short stent further down the LAD (beyond the main-vessel balloon)
    const distal = { ...p, fromMm: p.toMm + 4, toMm: p.toMm + 12, ringD: p.ringD.slice(0, 6), oval: null };
    const st: PciState = { ...st0, stents: [...st0.stents, distal] };
    const k = kissBalloons(s, g, st, 10);
    expect(kissing(k)).toBe(true);
    const rec = k.log.find((r) => r.kind === "kissing")!;
    expect(rec.data).toMatchObject({ stentIdx: 0, branch: SB, sbRail: 1, mvRail: 0 });
    expect(k.stents[0].oval).toBeTruthy();
    expect(k.stents[1].oval ?? null).toBeNull();
    expect(k.stents[1].ringD).toEqual(distal.ringD);
  });

  it("the hands stay on a rail while its balloon is up", () => {
    let st = loadDevice(stented, "balloon", "non-compliant", 2.5, 12);
    st = moveDevice(st, 68 - st.device!.centreMm);
    st = inflate(s, g, st, 10);
    const r = setActiveRail(st, 1);
    expect(activeRailOf(r)).toBe(0);
    expect(r.events[r.events.length - 1].text).toMatch(/Deflate the balloon before working on the other wire/);
    expect(activeRailOf(setActiveRail(deflate(st), 1))).toBe(1);
  });
});

describe("POT", () => {
  it("POT increases proximal ring diameters only", () => {
    const st0 = stentMv(twoWires());
    const p0 = st0.stents[0];
    const o = ostium();
    // a short non-compliant balloon proximal to the take-off (its distal end at the ostium's proximal edge)
    let st = loadDevice(st0, "balloon", "non-compliant", 3.0, 8);
    st = moveDevice(st, o.proxMm - 4 - st.device!.centreMm);
    const to = st.device!.centreMm + 4;
    st = deflate(inflate(s, g, st, 16));
    const p1 = st.stents[0];
    let grew = 0;
    p0.ringD.forEach((d, i) => {
      const mm = ringCentreMm(p0, i);
      if (mm > to) expect(p1.ringD[i], `ring ${i} at ${mm.toFixed(1)} mm`).toBe(d);
      else if (p1.ringD[i] > d + 1e-6) grew++;
      expect(p1.ringD[i]).toBeGreaterThanOrEqual(d);
    });
    expect(grew).toBeGreaterThan(0);
    // the rings beyond the carina are untouched
    p0.ringD.forEach((d, i) => {
      if (ringCentreMm(p0, i) > o.carinaMm) expect(p1.ringD[i]).toBe(d);
    });
  });
});

describe("a wire outside a stent's struts", () => {
  /** The in-stent start: an old 2.5 x 16 mm stent on the lesion with the wire across it outside its proximal struts. */
  function isr(): PciState {
    return applyStartSetup(s, g, wireToTarget(su, start(su)), { id: "wire-under-strut", setup: { underStrut: { diameter: 2.5, lengthMm: 16 } } });
  }

  it("an under-strut wire makes a balloon stall at the stent edge", () => {
    let st = isr();
    const edge = railEdge(loadDevice(st, "balloon", "semi-compliant", 2.0, 12));
    expect(edge).toMatchObject({ cause: "under-strut", stentIdx: 0 });
    const edgeMm = st.stents[0].fromMm;
    st = loadDevice(st, "balloon", "semi-compliant", 2.0, 12);
    const distal = () => st.device!.centreMm + st.device!.lengthMm / 2;
    for (let i = 0; i < 120 && !st.log.some((r) => r.kind === "device-stent-edge-stall"); i++) st = advanceDevice(s, g, st, 1);
    expect(distal()).toBeCloseTo(edgeMm - MP_EDGE_STOP_MM, 3);
    expect(st.events.some((e) => /stops exactly at the edge of the stent/.test(e.text))).toBe(true);
    // pushed again up to the threshold: it stays at the edge and the old stent is unchanged
    for (let i = 0; i < MP_EDGE_FORCE_BITES; i++) st = advanceDevice(s, g, st, 1);
    expect(distal()).toBeCloseTo(edgeMm - MP_EDGE_STOP_MM, 3);
    expect(st.stents[0].compressionMm).toBe(0);
    // forced on beyond it: the old stent shortens from its proximal end (longitudinal deformation)
    for (let i = 0; i < 4; i++) st = advanceDevice(s, g, st, 1);
    expect(st.stents[0].compressionMm).toBeGreaterThan(0);
    expect(st.stents[0].fromMm).toBeGreaterThan(edgeMm);
    expect(st.log.some((r) => r.kind === "stent-longitudinal-deformation")).toBe(true);
    expect(st.log.filter((r) => r.kind === "device-stent-edge-stall")).toHaveLength(1);
  });

  it("without the wire under the struts the same balloon goes through; pulling the wire back out of the stent frees it", () => {
    const st0 = isr();
    const free: PciState = { ...st0, rails: [{ ...st0.rails![0], underStrut: null }, st0.rails![1]] };
    let st = loadDevice(free, "balloon", "semi-compliant", 2.0, 12);
    for (let i = 0; i < 80; i++) st = advanceDevice(s, g, st, 1);
    expect(st.device!.centreMm + st.device!.lengthMm / 2).toBeGreaterThan(free.stents[0].fromMm + 5);
    // the under-strut wire withdrawn behind the edge
    const w = moveWire(s, g, st0, -(st0.tipMm - (st0.stents[0].fromMm - 3)));
    expect(railsOf(w)[0].underStrut).toBeNull();
    expect(w.log.some((r) => r.kind === "wire-under-strut-cleared")).toBe(true);
  });

  it("the in-stent start keeps the single-wire models, and a balloon on the restenosis dilates the lesion", () => {
    const st0 = isr();
    expect(st0.rails).toBeTruthy();
    expect(hasTwoWires(st0)).toBe(false);
    expect(st0.stents[0].restenosed).toBe(true);
    // the wire freed from under the struts, so the balloon reaches the lesion
    const free: PciState = { ...st0, rails: [{ ...st0.rails![0], underStrut: null }, st0.rails![1]] };
    let st = loadDevice(free, "balloon", "non-compliant", 2.5, 12);
    st = moveDevice(st, g.lesion.centreMm - st.device!.centreMm);
    st = inflate(s, g, st, 14);
    const rec = st.log.filter((r) => r.kind === "inflate").pop()!;
    expect(rec.data).toMatchObject({ inLesion: true, inStent: false });
    expect(st.predilated).toBe(true);
    expect(st.counters.postdilatedInStent).toBeFalsy();
    expect(st.stents[0].ringD).toEqual(st0.stents[0].ringD);
  });

  it("an under-strut course is likelier at a malapposed edge, and a single-wire recrossing never draws one", () => {
    expect(underStrutChance(0.4)).toBeGreaterThan(underStrutChance(0));
    expect(underStrutChance(5)).toBeLessThanOrEqual(0.6);
    // one wire: pulled back behind the old stent and advanced across its edge again, no rails appear
    const single = stentMv(wireToTarget(su, start(su)));
    let w = moveWire(s, g, single, -(single.tipMm - (single.stents[0].fromMm - 4)));
    for (let i = 0; i < 20; i++) w = moveWire(s, g, w, 2);
    expect(w.tipMm).toBeGreaterThan(single.stents[0].fromMm);
    expect(w.rails).toBeUndefined();
  });

  it("with two rails the side-branch exposure follows the carina shift; one wire keeps the stent-ratio term", () => {
    const e: SideBranchExposure = { branch: SB, parentRoute: ["LM", "LAD"], atMm: 76, sbD: 1.5, mvD: 2.6, angle: 1.1, trueBifurcation: false, stentRatio: 1.15, thrombus: false };
    // carina shift: absent, the earlier stent-ratio term; present, it takes its place
    expect(sideBranchRisk(e)).toBeCloseTo(sideBranchRisk({ ...e }), 12);
    expect(sideBranchRisk({ ...e, carinaShiftMm: carinaShiftMm(3.5, 2.5, true) })).toBeGreaterThan(sideBranchRisk({ ...e, carinaShiftMm: carinaShiftMm(2.5, 2.5, true) }));
    expect(carinaShiftMm(3.0, 2.5, false)).toBeGreaterThan(carinaShiftMm(2.5, 2.5, false));
  });
});

describe("the second rail's wire and devices", () => {
  it("a jailed wire is removed with gentle traction; removing it before the branch is rewired is recorded", () => {
    const st = stentMv(twoWires());
    const r = removeRailWire(st, 1);
    expect(railsOf(r)[1].wire).toBeNull();
    expect(r.log.find((x) => x.kind === "jailed-wire-removed")).toMatchObject({ data: { rail: 1, branch: SB, rewired: false } });
    // the only wire stays
    expect(removeRailWire(r, 0).rails![0].wire).not.toBeNull();
  });

  it("a balloon larger than the jailed-wire limit stops at the stent edge on the jailed wire; the tip azimuth wraps", () => {
    let st = setActiveRail(stentMv(twoWires()), 1);
    st = loadDevice(st, "balloon", "semi-compliant", 2.0, 12);
    for (let i = 0; i < 100; i++) st = advanceDevice(s, g, st, 1);
    expect(st.device!.centreMm + st.device!.lengthMm / 2).toBeCloseTo(st.stents[0].fromMm - MP_EDGE_STOP_MM, 3);
    expect(MP_EDGE_FORCE_BITES).toBeGreaterThan(0);
    expect(Math.abs(wrap(st.wire.tip))).toBeLessThanOrEqual(Math.PI);
  });

  it("initialCx seeds stay independent of the rails (the jail adds no complication draw)", () => {
    const a = stentMv(twoWires());
    const b = stentMv({ ...twoWires(), cx: initialCx("other:cx") });
    expect(a.rails![1].jailed).toEqual(b.rails![1].jailed);
  });
});

describe("practice links (src/content/practice/pci-two-rail-engine.launch.ts)", () => {
  it("lists no two-rail link until the lab's hands can load the second wire and kiss; the file reads without problems", async () => {
    const { PRACTICE_INDEX, practiceForLesson } = await import("../../ui/content/practiceIndex");
    const { launch } = await import("../../content/practice/pci-two-rail-engine.launch");
    expect(launch.links ?? []).toEqual([]);
    for (const lesson of ["cp-bifurcation-provisional-sb", "cp-bifurcation-provisional-pot", "pm-prep-and-stent-delivery"]) {
      expect(practiceForLesson(lesson).find((x) => x.source.endsWith("/pci-two-rail-engine.launch.ts")), lesson).toBeUndefined();
    }
    expect(PRACTICE_INDEX.known.problems).toEqual([]);
  });
});

describe("kissing needs both wires inside the stent", () => {
  it("a kiss with a balloon on the jailed wire is refused", () => {
    const stented = stentMv(twoWires());
    let st = loadDevice(setActiveRail(stented, 1), "balloon", "non-compliant", 1.5, 12);
    st = moveDevice(st, 70 - st.device!.centreMm);
    st = loadDevice(setActiveRail(st, 0), "balloon", "non-compliant", 2.5, 12);
    st = moveDevice(st, 72 - st.device!.centreMm);
    const k = kissBalloons(s, g, st, 10);
    expect(kissing(k)).toBe(false);
    expect(k.events[k.events.length - 1].text).toMatch(/Rewire the side branch through the stent struts before kissing/);
  });
});

describe("the empty rail", () => {
  it("with the first wire taken out (hands on rail 2), a new wire goes onto rail 1", () => {
    let st = setActiveRail(loadSecondWire(wireToTarget(su, start(su))), 1);
    st = removeRailWire(st, 0);
    expect(railsOf(st)[0].wire).toBeNull();
    expect(activeRailOf(st)).toBe(1);
    st = loadSecondWire(st);
    expect(railsOf(st)[0].wire).not.toBeNull();
    expect(st.log.filter((r) => r.kind === "wire-loaded").map((r) => r.data.rail)).toEqual([1, 0]);
    const again = loadSecondWire(st);
    expect(again.events[again.events.length - 1].text).toMatch(/already in the guide/);
  });
});
