// ---------------------------------------------------------------------------
// From the sheath to the root in the diagnostic lab (diag-route-wire-led-radial): the scenarios of
// src/simulation/diagnosticScenarios/route.ts through the lab session with the rod mechanics and the route
// session module (src/ui/sim/modules/route.ts): the sheath start, the wire that must lead (wire-not-leading
// and the dissection accumulator), the wire through the valve (lvContact and ectopic beats), the wet
// connection, the exchange that keeps or loses the route, and the radial loop's resistance algorithm with
// balloon-assisted tracking, the pseudolesions and a forearm perforation sealed by the catheter.
//   npx vitest run src/ui/physics/physicsDevices.route.test.ts
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, it } from "vitest";
import { useSimulatorStore } from "../../state/useSimulatorStore";
import { CASE_LIBRARY, DEFAULT_SCENARIO_SEED, scenarioCase } from "../../simulation/caseGenerator";
import { DiagnosticLabSession, labScenarioById, type SessionPhysicsOptions } from "../sim/labSession";
import { Region } from "../../physics/lumen";
import { MP_ROUTE_LED, ROUTE_START, START_TIP_BACK_MM, usePhysicsSettings } from "./physicsDevices";
import { MP_ROUTE_MODULE, routeDrawing, type RouteControl } from "../sim/modules/route";
import { tab as routeTab } from "../lab/controls/tabs/RouteTab";
import { tableHub } from "../lab/TableView";
import { MP_DISSECTION_DRAW } from "../../simulation/access/route";
import { tipsFor } from "../../content/lab/tips";

const g = () => useSimulatorStore.getState();
const T = 120_000;
const PHYS: SessionPhysicsOptions = { force: true, useWorker: false, config: {}, autoFallback: false };

const sessions: DiagnosticLabSession[] = [];
afterEach(() => {
  for (const s of sessions.splice(0)) s.dispose();
  g().loadCase(CASE_LIBRARY[0], "free", "beginner");
});

function open(id: string, catheterId = "JL4", physics: SessionPhysicsOptions | null = PHYS): DiagnosticLabSession {
  const c = scenarioCase(id, DEFAULT_SCENARIO_SEED, labScenarioById)!;
  g().loadCase(c, "free", "beginner");
  g().setCatheter(catheterId);
  const s = new DiagnosticLabSession(useSimulatorStore, null, null, { team: false, ...(physics ? { physics } : {}) });
  s.setTimeOutDone(true);
  sessions.push(s);
  return s;
}
const stepper = (s: DiagnosticLabSession) => (sec: number) => {
  for (let t = 0; t < sec - 1e-9; t += 1 / 60) s.step(1 / 60);
};
const route = (s: DiagnosticLabSession): RouteControl => s.capability("route")!;
const mech = (s: DiagnosticLabSession) => s.physics!.routeMechanics()!;
const routeRaised = (s: DiagnosticLabSession, e: string) => s.events.history().some((x) => x.event === e && x.source === "route");
const fluoro = (s: DiagnosticLabSession, on: boolean) => s.setPedal({ fluoro: on, cine: false });
/** What the image showed of the puffs (the step log's 'image' entries). */
const imaged = (rc: RouteControl) => rc.steps.filter((x) => x.step === "image").map((x) => x.observed);

/** Push the catheter in steps of `mm` every 0.1 s until `until` holds (at most `max` pushes); returns the pushes made. */
function pushUntil(s: DiagnosticLabSession, until: () => boolean, mm = 4, max = 400): number {
  const adv = stepper(s);
  let i = 0;
  for (; i < max && !until(); i++) {
    s.physics!.command({ kind: "push", device: "catheter", mm });
    adv(0.1);
  }
  return i;
}

/** From the femoral sheath to the root, over the leading J wire. */
function toRoot(s: DiagnosticLabSession, yStop = 15): void {
  pushUntil(s, () => {
    const r = mech(s);
    return !r.catheterInRoute && !!r.catheterTip && r.catheterTip[1] < yStop;
  }, 5);
}

describe("a scenario with startAt 'sheath' opens at the sheath", () => {
  it("diag-wire-leads-to-root: the catheter just out of the sheath tip with the J wire leading it, in the advance phase; a root-start scenario opens at the root as before", () => {
    const s = open("diag-wire-leads-to-root");
    const p = s.physics!;
    expect(p.startAt).toBe("sheath");
    stepper(s)(0.5);
    const r = mech(s);
    const sheath = p.devices.regionSpan(Region.Sheath)!;
    expect(r.catheterTipS!).toBeGreaterThan(sheath[1]);
    expect(r.catheterTipS!).toBeLessThan(sheath[1] + ROUTE_START.catheterBeyondSheathMm + 10);
    expect(r.wireId).toBe("J");
    expect(r.wireLeadMm!).toBeGreaterThan(ROUTE_START.wireLeadMm - 5);
    expect(r.catheterInRoute).toBe(true);
    const ctx = s.tipContext();
    expect(ctx.phase).toBe("advance");
    expect(ctx.route).toBe("femoral");
    // the table strip shows the wire in the hub and the manifold off
    expect(tableHub()).toEqual({ connected: false, wireInHub: true, bat: false });
    s.dispose();
    const k = open("diag-kink-tortuous-iliac", "JR4");
    expect(k.physics!.startAt).toBe("root");
    stepper(k)(0.3);
    expect(Math.abs(mech(k).catheterTipS! - (k.physics!.devices.routeLength() - START_TIP_BACK_MM))).toBeLessThan(15);
    expect(tableHub()).toBeNull();
  }, T);
});

describe("the wire leads", () => {
  /** Into the iliac over the leading wire: the tip 15 mm into the common iliac. */
  const intoIliac = (s: DiagnosticLabSession) => {
    const span = s.physics!.devices.regionSpan(Region.Iliac)!;
    pushUntil(s, () => (mech(s).catheterTipS ?? 0) > span[0] + 15, 3);
    expect(mech(s).catheterRegion).toBe(Region.Iliac);
  };

  it("advancing the catheter 20 mm beyond the wire tip in the iliac segment raises wire-not-leading and the dissection accumulator; with the wire leading it stays zero", () => {
    // with the wire leading: to the iliac and 20 mm on
    const a = open("diag-wire-leads-to-root");
    const adv = stepper(a);
    adv(0.3);
    intoIliac(a);
    const s0 = mech(a).catheterTipS!;
    pushUntil(a, () => mech(a).catheterTipS! >= s0 + 20, 2, 30);
    adv(0.5);
    const ra = mech(a);
    expect(ra.catheterRegion).toBe(Region.Iliac);
    expect(ra.wireLeadMm!).toBeGreaterThan(10);
    expect(ra.dissectionRisk).toBe(0);
    expect(ra.notLeadingAdvanceMm).toBe(0);
    expect(a.events.history().some((x) => x.event === "wire-not-leading")).toBe(false);
    a.dispose();

    // the wire drawn back to the catheter tip and held, the catheter advanced 20 mm beyond it
    const b = open("diag-wire-leads-to-root");
    const bdv = stepper(b);
    bdv(0.3);
    intoIliac(b);
    const p = b.physics!;
    p.command({ kind: "push", device: "wire035", mm: -(mech(b).wireLeadMm ?? 0) });
    bdv(1.5);
    p.command({ kind: "pin", device: "wire035", on: true });
    for (let i = 0; i < 10; i++) {
      p.command({ kind: "push", device: "catheter", mm: 2 });
      bdv(0.1);
    }
    bdv(0.5);
    const rb = mech(b);
    expect(rb.catheterRegion).toBe(Region.Iliac);
    expect(rb.wireLeadMm!).toBeLessThan(-15);
    expect(rb.notLeadingAdvanceMm).toBeGreaterThanOrEqual(18);
    expect(rb.dissectionRisk).toBeGreaterThan(0);
    expect(rb.dissectionRisk).toBeLessThan(MP_ROUTE_LED.dissectionNs);
    expect(b.tipContext().events).toContain("wire-not-leading");
    expect(route(b).score().notLeadingAdvanceMm).toBeGreaterThanOrEqual(18);
  }, T);
});

describe("the wire out of the ventricle", () => {
  it("a straight wire through the valve gives lvContact and ectopic beats; withdrawal stops them", () => {
    const s = open("diag-wire-leads-to-root", "JR4");
    const p = s.physics!;
    const adv = stepper(s);
    adv(0.3);
    toRoot(s);
    expect(s.tipContext().phase).not.toBe("advance");
    expect(route(s).chooseWire("STRAIGHT")).toBe(true);
    adv(0.3);
    // the hand turns the catheter until the straight wire, pushed, crosses the valve
    let crossed = false;
    for (let a = 0; a < 12 && !crossed; a++) {
      p.command({ kind: "torque", device: "catheter", rad: Math.PI / 6 });
      adv(0.6);
      for (let k = 0; k < 30 && !crossed; k++) {
        p.command({ kind: "push", device: "wire035", mm: 3 });
        adv(0.1);
        crossed = mech(s).wireInLv;
      }
      if (!crossed) {
        p.command({ kind: "push", device: "wire035", mm: -(Math.max(0, mech(s).wireLeadMm ?? 0) + 3) });
        adv(1.5);
      }
    }
    expect(crossed).toBe(true);
    const countEctopics = (seconds: number) => {
      let n = 0;
      let last = s.engine.lvWallState().ectopic;
      for (let k = 0; k < seconds * 20; k++) {
        adv(0.05);
        const e = s.engine.lvWallState().ectopic;
        if (e && !last) n++;
        last = e;
      }
      return n;
    };
    const inLv = countEctopics(12);
    expect(mech(s).lvContact).toBe(true);
    expect(s.tipContext().events).toContain("wire-in-lv");
    expect(inLv).toBeGreaterThan(0);
    // withdrawn into the root: no more ventricular contact, no more ectopy from it
    p.command({ kind: "push", device: "wire035", mm: -(Math.max(0, mech(s).wireLeadMm ?? 0) - 10) });
    adv(2);
    expect(mech(s).wireInLv).toBe(false);
    expect(mech(s).lvContact).toBe(false);
    expect(countEctopics(12)).toBe(0);
    expect(route(s).score().wireInLvS).toBeGreaterThan(5);
  }, T);
});

describe("the wet connection after the wire comes out", () => {
  it("open hub: no injection; aspirate, connect dry (air in the line, 'air'), draw back and discard (the air goes), fill to the tip; then the syringe pushes", () => {
    const s = open("diag-wire-leads-to-root");
    const adv = stepper(s);
    adv(0.3);
    const rc = route(s);
    expect(rc.allowInjection()).toBe(false);
    rc.removeWire();
    adv(0.5);
    expect(rc.connection).toBe("open");
    expect(tableHub()).toEqual({ connected: false, wireInHub: false, bat: false });
    expect(s.startInjection()).toBe(false);
    rc.aspirate();
    expect(rc.connection).toBe("aspirated");
    const air0 = s.engine.transducer.st.airMl;
    rc.connect(false);
    expect(s.engine.transducer.st.airMl).toBeCloseTo(air0 + MP_ROUTE_MODULE.dryConnectionAirMl, 6);
    expect(s.activeEvents()).toContain("air");
    adv(0.3);
    expect(tableHub()?.connected).toBe(true);
    rc.drawBack();
    expect(s.engine.transducer.st.airMl).toBeCloseTo(air0, 6);
    rc.fillToTip();
    expect(s.injector.primed).toBe(1);
    expect(rc.allowInjection()).toBe(true);
    const sc = rc.score();
    expect(sc.connectedWithoutAspiration).toBe(0);
    expect(sc.dryConnections).toBe(1);
    expect(sc.filledBeforeInjection).toBe(true);
    s.dispose();
    // connected straight away, without aspirating: scored
    const t = open("diag-wire-leads-to-root");
    stepper(t)(0.3);
    route(t).removeWire();
    stepper(t)(0.3);
    route(t).connect(true);
    expect(route(t).score().connectedWithoutAspiration).toBe(1);
    expect(t.engine.transducer.st.airMl).toBe(0);
  }, T);
});

describe("the exchange from a sheath start", () => {
  it("over the standard J wire the route is lost (the new catheter starts at the sheath); over the 300 cm wire the wire tip stays in the aorta and the new catheter comes up over it", () => {
    for (const wire of ["J", "J300"]) {
      const s = open("diag-wire-leads-to-root", "JL4");
      const adv = stepper(s);
      adv(0.3);
      if (wire !== "J") {
        route(s).chooseWire(wire);
        adv(0.3);
        s.physics!.command({ kind: "push", device: "wire035", mm: ROUTE_START.wireLeadMm + 5 });
        adv(1);
      }
      toRoot(s, 30);
      g().setCatheter("JR4");
      adv(0.1);
      expect(s.physics!.exchanging).toBe(true);
      for (let k = 0; k < 400 && s.physics!.exchanging; k++) adv(0.1);
      expect(s.physics!.exchanging).toBe(false);
      adv(0.5);
      const r = mech(s);
      const sheath = s.physics!.devices.regionSpan(Region.Sheath)!;
      if (wire === "J") {
        expect(s.physics!.routeLostExchanges).toBe(1);
        expect(r.catheterTipS!).toBeLessThan(sheath[1] + 20);
        expect(r.wireId).toBe("J");
      } else {
        expect(s.physics!.routeLostExchanges).toBe(0);
        expect(r.wireId).toBe("J300");
        expect(r.catheterTipS!).toBeGreaterThan(s.physics!.devices.routeLength() - 300);
        expect(s.physics!.lastExchangeMinWireTipHeight!).toBeGreaterThan(0);
      }
    }
  }, T);
});

describe("diag-radial-loop-algorithm: the radial loop and the resistance algorithm", () => {
  it("the J-led catheter stalls at the loop (radial-loop from the route module); transduce, image, a hydrophilic wire across; the catheter catches until balloon-assisted tracking straightens the loop; the puff shows pseudolesions", () => {
    const s = open("diag-radial-loop-algorithm", "JR4");
    const p = s.physics!;
    const adv = stepper(s);
    adv(0.3);
    const rc = route(s);
    // the table follows the wire in the forearm
    expect(["forearm", "elbow"]).toContain(rc.stationNow()?.id);
    const span = p.devices.lumenSet().radialLoopSpan!;
    expect(span).not.toBeNull();
    // 1. the catheter over the J wire to the loop, where both stop
    pushUntil(s, () => mech(s).loop?.stalled === "catheter", 3, 80);
    expect(mech(s).loop!.stalled).toBe("catheter");
    adv(0.3);
    expect(routeRaised(s, "radial-loop")).toBe(true);
    expect(mech(s).wireTipS!).toBeLessThan(span[1]);
    // 2. back off, transduce the side arm, the wire out, a puff from just below
    for (let i = 0; i < 5; i++) {
      p.command({ kind: "push", device: "catheter", mm: -3 });
      adv(0.1);
    }
    expect(rc.transduceSideArm()).toMatch(/arterial waveform/);
    rc.removeWire();
    adv(0.3);
    fluoro(s, true);
    expect(rc.puff("catheter")).toBe(true);
    adv(1);
    expect(imaged(rc).some((x) => /full loop/.test(x))).toBe(true);
    // 3. a hydrophilic wire across the loop, the catheter close behind
    expect(rc.chooseWire("HYDRO")).toBe(true);
    adv(0.3);
    for (let i = 0; i < 40 && !mech(s).loop!.wireAcross; i++) {
      p.command({ kind: "push", device: "wire035", mm: 3 });
      adv(0.1);
    }
    for (let i = 0; i < 10; i++) {
      p.command({ kind: "push", device: "wire035", mm: 3 });
      adv(0.1);
    }
    expect(mech(s).loop!.wireAcross).toBe(true);
    // 4. the catheter catches at the loop
    for (let i = 0; i < 15; i++) {
      p.command({ kind: "push", device: "catheter", mm: 3 });
      adv(0.1);
    }
    expect(mech(s).loop!.catheterAcross).toBe(false);
    // 5. balloon-assisted tracking: the assembly straightens the loop and crosses
    expect(rc.setBat(4)).toBe(true);
    expect(p.batEffective).toBe(true);
    adv(0.3);
    expect(tableHub()?.bat).toBe(true);
    for (let i = 0; i < 25; i++) {
      p.command({ kind: "push", device: "catheter", mm: 3 });
      adv(0.1);
    }
    expect(p.radialLoopStraighten).toBeGreaterThan(0.9);
    expect(mech(s).loop!.catheterAcross).toBe(true);
    rc.setBat(null);
    // 6. the puff through the catheter shows the straightened artery's narrowings: the pseudolesion question
    rc.removeWire();
    adv(0.3);
    expect(rc.puff("catheter")).toBe(true);
    adv(1);
    expect(rc.pseudolesionAsked).toBe(true);
    expect(imaged(rc).some((x) => /narrowings along it/.test(x))).toBe(true);
    expect(s.activeEvents()).toEqual(expect.arrayContaining(["new-narrowing", "new-narrowing-tortuous"]));
    rc.answerPseudolesion("pseudolesion");
    const sc = rc.score();
    expect(sc).toMatchObject({ startAt: "sheath", transducedFirst: true, imagedBeforeRewire: true, bat: true, pseudolesionAnswer: "pseudolesion", perforation: null });
    expect(sc.contrastMl).toBe(2 * MP_ROUTE_MODULE.puffMl);
  }, T);

  it("balloon-assisted tracking outside 3–6 atm does not straighten the loop; it needs a wire beyond the tip", () => {
    const s = open("diag-radial-loop-algorithm", "JR4");
    const p = s.physics!;
    const adv = stepper(s);
    adv(0.3);
    const rc = route(s);
    rc.removeWire();
    adv(0.3);
    expect(rc.setBat(4)).toBe(false);
    rc.chooseWire("HYDRO");
    adv(0.3);
    pushUntil(s, () => (mech(s).catheterTipS ?? 0) > p.devices.lumenSet().radialLoopSpan![0] - 12, 4, 80);
    for (let i = 0; i < 25; i++) {
      p.command({ kind: "push", device: "wire035", mm: 3 });
      adv(0.1);
    }
    expect(mech(s).loop!.wireAcross).toBe(true);
    expect(rc.setBat(2)).toBe(true);
    expect(p.batEffective).toBe(false);
    for (let i = 0; i < 25; i++) {
      p.command({ kind: "push", device: "catheter", mm: 3 });
      adv(0.1);
    }
    expect(p.radialLoopStraighten).toBe(0);
    expect(mech(s).loop!.catheterAcross).toBe(false);
  }, T);

  it("forcing against the loop perforates a forearm branch (perforation, haematoma, extravasation on the puff); a catheter advanced across it seals it", () => {
    const s = open("diag-radial-loop-algorithm", "JR4");
    const p = s.physics!;
    const adv = stepper(s);
    adv(0.3);
    const rc = route(s);
    pushUntil(s, () => !!mech(s).perforation, 3, 200);
    const pf = mech(s).perforation!;
    expect(pf).not.toBeNull();
    expect(pf.sealed).toBe(false);
    adv(0.3);
    // the swelling shows at once; the perforation is named once a puff under the beam has shown the extravasation
    expect(s.activeEvents()).toContain("haematoma");
    expect(s.activeEvents()).not.toContain("perforation");
    expect(rc.drawnS("perforation")).not.toBeNull();
    rc.puff("sheath");
    adv(1.5);
    expect(s.activeEvents()).not.toContain("perforation");
    fluoro(s, true);
    rc.puff("sheath");
    adv(0.9);
    expect(routeDrawing(rc, rc.host.model)!.tubes.length).toBeGreaterThan(1);
    expect(s.activeEvents()).toEqual(expect.arrayContaining(["perforation", "haematoma"]));
    expect(imaged(rc).some((x) => /out of the artery/.test(x))).toBe(true);
    fluoro(s, false);
    // across it: a hydrophilic wire, then the catheter with balloon-assisted tracking
    for (let i = 0; i < 5; i++) {
      p.command({ kind: "push", device: "catheter", mm: -3 });
      adv(0.1);
    }
    rc.chooseWire("HYDRO");
    adv(0.3);
    for (let i = 0; i < 30; i++) {
      p.command({ kind: "push", device: "wire035", mm: 3 });
      adv(0.1);
    }
    rc.setBat(5);
    for (let i = 0; i < 35; i++) {
      p.command({ kind: "push", device: "catheter", mm: 3 });
      adv(0.1);
    }
    expect(mech(s).perforation!.sealed).toBe(true);
    expect(rc.drawnS("perforation")).toBeNull();
    expect(rc.score().perforation).toEqual({ sealed: true });
  }, T);
});

describe("what a puff shows needs the beam", () => {
  it("a side-arm puff with the pedals up shows nothing (no loop in the log, no 'radial-loop'); under fluoroscopy it shows the loop", () => {
    const s = open("diag-radial-loop-algorithm", "JR4");
    const adv = stepper(s);
    adv(0.3);
    const rc = route(s);
    expect(rc.puff("sheath")).toBe(true);
    adv(2);
    expect(imaged(rc)).toEqual([]);
    expect(rc.steps.some((x) => /loop/.test(x.observed))).toBe(false);
    expect(routeRaised(s, "radial-loop")).toBe(false);
    fluoro(s, true);
    expect(rc.puff("sheath")).toBe(true);
    adv(1);
    expect(imaged(rc).some((x) => /full loop/.test(x))).toBe(true);
    expect(routeRaised(s, "radial-loop")).toBe(true);
    expect(rc.score().puffs).toBe(2);
  }, T);

  it("a dissection from the unled catheter is named only once a puff under the beam covers it, and the puff draws its stain", () => {
    const s = open("diag-wire-leads-to-root");
    const adv = stepper(s);
    adv(0.3);
    const p = s.physics!;
    const span = p.devices.regionSpan(Region.Iliac)!;
    pushUntil(s, () => (mech(s).catheterTipS ?? 0) > span[0] + 15, 3);
    p.command({ kind: "push", device: "wire035", mm: -(mech(s).wireLeadMm ?? 0) });
    adv(1.5);
    p.command({ kind: "pin", device: "wire035", on: true });
    pushUntil(s, () => !!mech(s).dissection, 2, 300);
    expect(mech(s).dissection).not.toBeNull();
    expect(mech(s).dissectionRisk).toBeGreaterThanOrEqual(MP_ROUTE_LED.dissectionNs);
    adv(0.5);
    expect(s.tipContext().events).not.toContain("dissection");
    const rc = route(s);
    rc.removeWire();
    adv(0.3);
    // with the pedals up the puff shows nothing
    expect(rc.puff("catheter")).toBe(true);
    adv(2);
    expect(s.tipContext().events).not.toContain("dissection");
    fluoro(s, true);
    expect(rc.puff("catheter")).toBe(true);
    adv(0.9);
    const d = routeDrawing(rc, rc.host.model)!;
    expect(d.tubes.length).toBeGreaterThanOrEqual(2);
    expect(d.tubes.some((x) => x.r.every((r) => r === MP_DISSECTION_DRAW.rMm))).toBe(true);
    expect(s.tipContext().events).toContain("dissection");
    expect(rc.score().dissection).toBe(true);
  }, T);

  it("a study from the root draws nothing of the route (FluoroView unchanged for other cases)", () => {
    const k = open("diag-kink-tortuous-iliac", "JR4");
    stepper(k)(0.3);
    expect(routeDrawing(route(k), route(k).host.model)).toBeNull();
  }, T);
});

describe("the dry connection's tip", () => {
  it("after a dry connection the drawer shows diag-root-air-in-line", () => {
    const s = open("diag-wire-leads-to-root");
    const adv = stepper(s);
    adv(0.3);
    const rc = route(s);
    rc.removeWire();
    adv(0.3);
    rc.aspirate();
    rc.connect(false);
    adv(0.3);
    expect(tipsFor(s.tipContext(), 20).map((x) => x.id)).toContain("diag-root-air-in-line");
  }, T);
});

describe("the Route tab", () => {
  it("is shown in a case that opens at the sheath with the rod mechanics, and hidden in a study from the root", () => {
    const s = open("diag-radial-loop-algorithm", "JR4");
    expect(routeTab.visible!(s, g().policy)).toBe(true);
    expect(route(s).mechanicsOff()).toBeNull();
    s.dispose();
    const k = open("diag-kink-tortuous-iliac", "JR4");
    expect(k.physics!.startAt).toBe("root");
    expect(routeTab.visible!(k, g().policy)).toBe(false);
    k.dispose();
    const f = open("diag-kink-tortuous-iliac", "JR4", null);
    expect(f.physics).toBeNull();
    expect(route(f).mechanicsOff()).toBeNull();
    expect(routeTab.visible!(f, g().policy)).toBe(false);
  }, T);

  it("in a sheath-start case with the rod mechanics off, stays to say why the case opened at the root and offers the switch, which reloads the case with the rod chosen and the policy kept", () => {
    const before = usePhysicsSettings.getState().choice;
    try {
      usePhysicsSettings.getState().setChoice("simple");
      const t = open("diag-radial-loop-algorithm", "JR4", { useWorker: false, config: {}, autoFallback: false });
      expect(t.physics).toBeNull();
      expect(t.physicsMode.on).toBe(false);
      const rc = route(t);
      expect(rc.available()).toBe(false);
      expect(rc.scenarioStartAt()).toBe("sheath");
      expect(rc.mechanicsOff()).toEqual({ reason: null, canSwitch: true });
      expect(routeTab.visible!(t, g().policy)).toBe(true);
      const caseId = g().caseData.id;
      const policy = g().policy;
      const started = g().sessionStart;
      expect(rc.useRodMechanics()).toBe(true);
      expect(usePhysicsSettings.getState().choice).toBe("rod");
      expect(g().caseData.id).toBe(caseId);
      expect(g().policy).toBe(policy);
      expect(g().sessionStart).toBeGreaterThan(started);
      // the lab builds a new session for the reloaded case; this one, with the rod already chosen, has nothing to switch
      expect(rc.mechanicsOff()?.canSwitch).toBe(false);
      expect(rc.useRodMechanics()).toBe(false);
    } finally {
      usePhysicsSettings.getState().setChoice(before);
    }
  }, T);
});
