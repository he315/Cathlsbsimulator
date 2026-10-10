// pci-device-delivery: device delivery against the guide's back-up, guide back-out and wire migration, the
// guide extension delivered stepwise, screening, guide suck-in, stent deformation, the support options and
// the stuck-stent start.
//   npx vitest run src/simulation/pci/delivery.test.ts
import { describe, expect, it } from "vitest";
import {
  advanceDevice,
  applyStartSetup,
  backloadDevice,
  checkLabel,
  deepBreath,
  deliveryInput,
  deviceShaftMm,
  engageGuide,
  holdGuide,
  moveExtension,
  pinWire,
  prepareDevice,
  pullIndeflatorNegative,
  removeDevice,
  removeExtension,
  requestDevice,
  setAnchorBalloon,
  setExtension,
  setExtensionRod,
  setIndeflator,
  setSupportCatheter,
  setValve,
  shaftMarksIn,
  startPci,
  stepPci,
  takeExtension,
  type PciState,
} from "../angioPci";
import { setup } from "./testSetup";
import { pciScenarioDef, startOf, PCI_REGISTRY_PROBLEMS } from "./scenarios/registry";
import { GUIDE_NON_COAXIAL, backupForce, deliver, extensionCollarMm, initialGuide, railFriction } from "./guide";
import { DEVICE_BY_ID } from "./equipment";
import { DEFAULT_GUIDE_LENGTH_CM, MP_HELD_SEAT_DEPTH_MAX, SHAFT_MARKS_CM, SUPPORT_LANDING_MM, guideLengthMm } from "./actions/devices";
import { GUIDE_TOO_DEEP_MM } from "./guide";
import { deliveryOf } from "./state";
import { pciTipContext } from "../../ui/lab/pciTips";
import type { PciScenarioDef } from "./scenarios/types";

const STUCK = "rca-stuck-stent";

/** A registered scenario at a start, with the guide given (default the scenario's own). */
function at(id: string, startId: string, guide?: string) {
  const def = pciScenarioDef(id)!;
  expect(def, id).toBeDefined();
  const su = setup(id, guide ? { guide } : undefined);
  const d: PciScenarioDef = guide ? { ...def, setup: { ...def.setup, guideDefault: guide } } : def;
  const start = startOf(d, startId)!;
  const st = applyStartSetup(su.s, su.g, startPci({ def: d, scenario: su.s }, su.g, startId), start);
  return { su, def: d, start, st };
}

/** Take a device box and bring it to the valve: label checked, prepared, backloaded, valve open. */
function ready(st0: PciState, specId: string, diameter: number, lengthMm: number): PciState {
  return setValve(backloadDevice(prepareDevice(checkLabel(requestDevice(st0, specId, diameter, lengthMm)))), true);
}

const distalOf = (st: PciState) => st.device!.centreMm + st.device!.lengthMm / 2;

/** Push the device in `step` mm bites, `n` times, stopping early once the guide has left the ostium. */
function push(su: ReturnType<typeof setup>, st0: PciState, n: number, step = 1): PciState {
  let st = st0;
  for (let i = 0; i < n && st.guide.engaged; i++) st = advanceDevice(su.s, su.g, st, step);
  return st;
}

describe("the delivery pack (pci-device-delivery)", () => {
  it("registers rca-stuck-stent and rca-calcified-uncrossable without problems", () => {
    expect(PCI_REGISTRY_PROBLEMS).toEqual([]);
    expect(pciScenarioDef(STUCK)?.starts.map((s) => s.id)).toEqual(["stent-stuck-bend2", "wire-across"]);
    expect(pciScenarioDef("rca-calcified-uncrossable")?.starts.map((s) => s.id)).toEqual(["balloon-at-edge", "wire-across"]);
    expect(pciScenarioDef(STUCK)?.setup.guideDefault).toBe("AL1");
  });
});

/** The uncrossable calcified RCA with the wire across and its lesion predilated (a test state), through its 6 Fr Judkins right. */
const UNX = "rca-calcified-uncrossable";
function predilated() {
  const r = at(UNX, "wire-across");
  expect(r.st.guide.id).toBe("JR4");
  expect(r.st.guide.french).toBe(6);
  return { ...r, st: { ...r.st, severity: 60, predilated: true } };
}

/** Push until the device stops (two pushes without moving it) or the guide leaves the ostium; returns the state at the stop. */
function pushToStall(su: ReturnType<typeof setup>, st0: PciState, step = 1): PciState {
  let st = st0;
  let still = 0;
  for (let i = 0; i < 300 && st.guide.engaged && still < 2; i++) {
    const d0 = distalOf(st);
    st = advanceDevice(su.s, su.g, st, step);
    still = distalOf(st) - d0 < 0.05 ? still + 1 : 0;
  }
  return st;
}

describe("a 3.0 x 22 mm stent at the calcified bend with a 6 Fr Judkins right (pci-device-delivery)", () => {
  it("backs the guide out and an unpinned wire migrates; a pinned wire does not; with an extension 40 mm in, it crosses", () => {
    const { su, st: st0 } = predilated();
    const L = su.g.lesion;
    // unpinned
    let un = advanceDevice(su.s, su.g, ready(st0, "des", 3.0, 22), 1);
    un = push(su, un, 160);
    console.info(`JR4 unpinned: stopped at ${distalOf(un).toFixed(1)} mm (lesion ${L.startMm.toFixed(1)}-${L.endMm.toFixed(1)}), back-outs ${un.counters.guideBackouts}, wire migration ${un.counters.wireMigrationMm.toFixed(1)} mm`);
    expect(un.counters.guideBackouts).toBeGreaterThanOrEqual(1);
    expect(un.counters.wireMigrationMm).toBeGreaterThan(0);
    expect(un.log.some((r) => r.kind === "wire-retreat")).toBe(true);
    expect(distalOf(un)).toBeLessThan(L.endMm);
    expect(distalOf(un)).toBeGreaterThanOrEqual(L.startMm - 2);
    // pinned: the same stall, the wire stays where it was
    let pin = advanceDevice(su.s, su.g, ready(pinWire(st0, true), "des", 3.0, 22), 1);
    const tip0 = pin.tipMm;
    pin = push(su, pin, 160);
    expect(pin.counters.guideBackouts).toBeGreaterThanOrEqual(1);
    expect(pin.counters.wireMigrationMm).toBe(0);
    expect(pin.tipMm).toBeCloseTo(tip0, 6);
    // a guide extension 40 mm into the vessel: the stent crosses
    let ext = setExtension(pinWire(st0, true), 40);
    expect(ext.guide.extensionMm).toBe(40);
    ext = advanceDevice(su.s, su.g, ready(ext, "des", 3.0, 22), 1);
    ext = push(su, ext, 160);
    console.info(`JR4 + extension 40 mm: distal ${distalOf(ext).toFixed(1)} mm, back-outs ${ext.counters.guideBackouts}`);
    expect(ext.counters.guideBackouts).toBe(0);
    expect(distalOf(ext)).toBeGreaterThan(L.endMm);
  });

  it("the independent-hand technique (guide held) backs the guide out less and seats it a little; the deep breath lowers the bend load", () => {
    const { su, st: st0 } = predilated();
    const base = pinWire(st0, true);
    const held = holdGuide(base, true);
    expect(backupForce(held.guide)).toBeGreaterThan(backupForce(base.guide));
    let a = advanceDevice(su.s, su.g, ready(held, "des", 3.0, 22), 1);
    const d0 = a.guide.depthMm;
    // inside the guide shaft the left hand seats nothing
    a = advanceDevice(su.s, su.g, a, 2);
    expect(a.guide.depthMm).toBe(d0);
    // the part of a push beyond the guide tip seats it a little
    a = advanceDevice(su.s, su.g, a, 2 - distalOf(a));
    expect(distalOf(a)).toBeGreaterThan(0);
    expect(a.guide.depthMm).toBeGreaterThan(d0);
    // at the stall, one more push with and without the left hand on the guide
    let stall = advanceDevice(su.s, su.g, ready(base, "des", 3.0, 22), 1);
    for (let i = 0; i < 200 && stall.counters.guideBackouts === 0; i++) stall = advanceDevice(su.s, su.g, stall, 0.5);
    expect(stall.guide.engaged).toBe(true);
    const free = advanceDevice(su.s, su.g, stall, 1);
    const hand = advanceDevice(su.s, su.g, holdGuide(stall, true), 1);
    expect(hand.guide.depthMm).toBeGreaterThan(free.guide.depthMm);
    // the left hand pushing the guide forward through the lesion, against more than the guide alone holds, is
    // the forward push of the support menu: recorded once for the series of bites, and never without the hand
    expect(deliveryOf(free).support.map((x) => x.option)).not.toContain("forward-push");
    let fwd = hand;
    for (let i = 0; i < 80; i++) fwd = advanceDevice(su.s, su.g, fwd, 1);
    expect(distalOf(fwd)).toBeGreaterThan(su.g.lesion.endMm);
    expect(deliveryOf(fwd).support.filter((x) => x.option === "forward-push")).toHaveLength(1);
    let unheld = free;
    for (let i = 0; i < 80 && unheld.guide.engaged; i++) unheld = advanceDevice(su.s, su.g, unheld, 1);
    expect(deliveryOf(unheld).support.map((x) => x.option)).not.toContain("forward-push");
    // a deep breath straightens the bends: less rail friction at the same place
    const br = deepBreath(stall);
    const inp = deliveryInput(su.s, su.g, stall, distalOf(stall), distalOf(stall));
    const inpB = deliveryInput(su.s, su.g, br, distalOf(br), distalOf(br));
    expect(inpB.bendScale).toBeLessThan(1);
    expect(railFriction(su.g, br.guide, inpB)).toBeLessThan(railFriction(su.g, stall.guide, inp));
    expect(deliveryOf(br).support.map((x) => x.option)).toContain("deep-breath");
  });
});

describe("the guide extension delivered stepwise (pci-device-delivery)", () => {
  /** The extension in the guide with its rod parked, advanced from the valve to `tipMm` along the route. */
  function extensionAt(su: ReturnType<typeof setup>, st0: PciState, tipMm: number, cylinderCm = 25): PciState {
    let st = setExtensionRod(takeExtension(setValve(st0, true), { french: 6, cylinderCm }), true);
    expect(st.guide.ext?.tipMm).toBe(-guideLengthMm(st.guide));
    st = moveExtension(su.s, su.g, st, guideLengthMm(st.guide) + tipMm);
    return st;
  }

  /** A 2.0 mm balloon straddling the extension's tip 10 mm into the vessel (the extension taken there over the balloon), inflated to `atm`. */
  function straddling(su: ReturnType<typeof setup>, st0: PciState, atm: number): PciState {
    let st = extensionAt(su, st0, 0);
    st = advanceDevice(su.s, su.g, ready(st, "sc", 2.0, 15), 1);
    st = advanceDevice(su.s, su.g, st, 20 - distalOf(st));
    st = moveExtension(su.s, su.g, st, 10);
    expect(st.guide.ext!.tipMm).toBeCloseTo(10, 6);
    st = advanceDevice(su.s, su.g, st, 17.5 - distalOf(st));
    expect(distalOf(st)).toBeGreaterThan(st.guide.ext!.tipMm + 2);
    expect(distalOf(st) - 15).toBeLessThan(st.guide.ext!.tipMm - 2);
    st = setIndeflator(st, atm, 4);
    for (let i = 0; i < 40; i++) st = stepPci(su.s, su.g, st, 0.1);
    expect(st.ind.atm).toBeGreaterThan(atm - 1);
    return st;
  }

  it("balloon-assisted tracking advances the extension past the bend where it stops over the bare wire", () => {
    const { su, st: st0 } = at(UNX, "wire-across");
    const base = pinWire(st0, true);
    // over the bare wire, from the guide tip: it stops at a bend and backs the guide out
    let bare = extensionAt(su, base, 0);
    expect(bare.guide.ext!.tipMm).toBeCloseTo(0, 6);
    for (let i = 0; i < 80 && bare.guide.engaged && bare.counters.guideBackouts === 0; i++) bare = moveExtension(su.s, su.g, bare, 1);
    const bareTip = bare.guide.ext!.tipMm;
    console.info(`extension over the bare wire stopped at ${bareTip.toFixed(1)} mm (lesion at ${su.g.lesion.startMm.toFixed(1)}), bare travel ${deliveryOf(bare).extensionBareMm.toFixed(1)} mm`);
    expect(bare.counters.guideBackouts).toBeGreaterThanOrEqual(1);
    expect(deliveryOf(bare).extensionBareMm).toBeGreaterThan(0);
    expect(bareTip).toBeLessThan(su.g.lesion.startMm - 10);
    // balloon-assisted tracking: the balloon protruding from the extension at nominal pressure, both advanced together
    let bat = straddling(su, base, DEVICE_BY_ID.sc.nominalAtm(2.0));
    const c0 = bat.device!.centreMm;
    for (let i = 0; i < 60 && bat.guide.ext!.tipMm < bareTip + 10; i++) bat = moveExtension(su.s, su.g, bat, 1, { together: true });
    console.info(`balloon-assisted tracking took the extension to ${bat.guide.ext!.tipMm.toFixed(1)} mm (back-outs ${bat.counters.guideBackouts})`);
    expect(bat.guide.ext!.tipMm).toBeGreaterThanOrEqual(bareTip + 10);
    expect(bat.counters.guideBackouts).toBe(0);
    // the balloon went with it
    expect(bat.device!.centreMm - c0).toBeCloseTo(bat.guide.ext!.tipMm - 10, 6);
  });

  it("inchworming: the extension slides over the straddling balloon as it deflates; pushed before deflating (skipping the deflation), it does not move", () => {
    const { su, st: st0 } = at(UNX, "wire-across");
    let st = straddling(su, pinWire(st0, true), 7);
    const tip = st.guide.ext!.tipMm;
    const blocked = moveExtension(su.s, su.g, st, 3);
    expect(blocked.guide.ext!.tipMm).toBeCloseTo(tip, 6);
    expect(deliveryOf(blocked).extensionBlocked).toBe(1);
    // deflating: the extension goes on over the balloon
    st = pullIndeflatorNegative(su.s, su.g, blocked);
    st = stepPci(su.s, su.g, st, 0.2);
    st = moveExtension(su.s, su.g, st, 3);
    expect(st.guide.ext!.tipMm).toBeGreaterThan(tip + 2.5);
    expect(deliveryOf(st).extensionBlocked).toBe(1);
  });

  it("a loose push rod wraps the wire at the collar until the extension is taken out and reinserted; the collar leaving the guide is recorded", () => {
    const { su, st: st0 } = at(UNX, "wire-across");
    // the push rod left loose: a balloon stops where it enters the extension
    let loose = moveExtension(su.s, su.g, takeExtension(setValve(pinWire(st0, true), true), { cylinderCm: 25 }), 1000);
    expect(loose.guide.ext!.rodParked).toBe(false);
    loose = advanceDevice(su.s, su.g, ready(loose, "sc", 2.0, 15), 1, { fromValve: true });
    loose = push(su, loose, 250, 5);
    const c = extensionCollarMm(loose.guide.ext!);
    expect(distalOf(loose)).toBeLessThan(c);
    expect(loose.guide.ext!.wrapped).toBe(true);
    expect(deliveryOf(loose).collarStalls).toBeGreaterThan(0);
    // out and in again with the rod under the towel: the balloon goes through
    loose = removeExtension(loose);
    expect(loose.guide.ext ?? null).toBeNull();
    let again = setExtensionRod(takeExtension(loose, { cylinderCm: 25 }), true);
    again = moveExtension(su.s, su.g, again, 1000);
    again = push(su, again, 250, 5);
    expect(distalOf(again)).toBeGreaterThan(extensionCollarMm(again.guide.ext!));
    // a short cylinder (a test double of 4 mm) pushed 12 mm on takes its collar out of the guide
    const al = at(STUCK, "wire-across");
    let out = setExtensionRod(takeExtension(setValve(pinWire(al.st, true), true), { cylinderCm: 25 }), true);
    out = { ...out, guide: { ...out.guide, ext: { ...out.guide.ext!, tipMm: -2, cylinderMm: 4 } } };
    out = moveExtension(al.su.s, al.su.g, out, 12);
    expect(extensionCollarMm(out.guide.ext!)).toBeGreaterThan(0);
    expect(deliveryOf(out).collarOut).toBe(1);
  });
});

describe("screening, withdrawal and the shaft marks (pci-device-delivery)", () => {
  it("counters.unscreened increments when a device passes the guide tip with fluoroscopy off, not when screened", () => {
    const { su, st: st0 } = at(STUCK, "wire-across", "AL1");
    let st = advanceDevice(su.s, su.g, ready(pinWire(st0, true), "sc", 2.0, 15), 1);
    expect(distalOf(st)).toBeLessThan(0);
    st = advanceDevice(su.s, su.g, st, 60, { screened: false });
    expect(distalOf(st)).toBeGreaterThan(0);
    expect(st.counters.unscreened).toBe(1);
    // back into the guide and out again under fluoroscopy
    st = advanceDevice(su.s, su.g, st, -40);
    expect(distalOf(st)).toBeLessThan(0);
    st = advanceDevice(su.s, su.g, st, 60, { screened: true });
    expect(distalOf(st)).toBeGreaterThan(0);
    expect(st.counters.unscreened).toBe(1);
    // the whole travel in the guide unscreened is not counted until the tip leaves it
    let v = advanceDevice(su.s, su.g, ready(pinWire(st0, true), "sc", 2.0, 15), 1, { fromValve: true });
    v = advanceDevice(su.s, su.g, v, 500, { screened: false });
    expect(v.counters.unscreened).toBe(0);
  });

  it("from the valve the shaft runs down the guide: the 90 cm mark reaches the Y-connector before the 100 cm mark, at the tip of a 100 cm guide", () => {
    const { su, st: st0 } = at(STUCK, "wire-across", "AL1");
    expect(guideLengthMm(st0.guide)).toBe(DEFAULT_GUIDE_LENGTH_CM * 10);
    let st = advanceDevice(su.s, su.g, ready(pinWire(st0, true), "sc", 2.0, 15), 1, { fromValve: true });
    expect(deviceShaftMm(st)).toBeCloseTo(0, 6);
    st = advanceDevice(su.s, su.g, st, 900);
    expect(deviceShaftMm(st)).toBeCloseTo(900, 6);
    expect(shaftMarksIn(st)).toEqual([SHAFT_MARKS_CM[0]]);
    expect(distalOf(st)).toBeLessThan(0);
    st = advanceDevice(su.s, su.g, st, 100);
    expect(shaftMarksIn(st)).toEqual([...SHAFT_MARKS_CM]);
    expect(distalOf(st)).toBeCloseTo(0, 6);
  });

  it("a stent pulled back into a guide that is not coaxial is deformed and seen on the table; a coaxial guide takes it back intact", () => {
    const { su, st: stuck } = at(STUCK, "stent-stuck-bend2");
    expect(stuck.guide.coaxial).toBeLessThan(GUIDE_NON_COAXIAL);
    const pulled = advanceDevice(su.s, su.g, stuck, -(distalOf(stuck) + 5));
    expect(pulled.device!.deformed?.at).toBe("guide-tip");
    expect(deliveryOf(pulled).deformedStents).toBe(1);
    const out = removeDevice(pulled);
    expect(out.events[out.events.length - 1].text).toMatch(/deformed/);
    // re-engaged coaxially first
    const coax = engageGuide(su.s, stuck, su.g);
    expect(coax.guide.coaxial).toBeGreaterThanOrEqual(GUIDE_NON_COAXIAL);
    const back = advanceDevice(su.s, su.g, coax, -(distalOf(coax) + 5));
    expect(back.device!.deformed ?? null).toBeNull();
  });

  it("withdrawing against friction draws an unheld guide in; the left hand on the guide stops it", () => {
    const { su, st: st0 } = at(STUCK, "wire-across", "AL1");
    let st = advanceDevice(su.s, su.g, ready(pinWire(st0, true), "des", 3.0, 22), 1);
    for (let i = 0; i < 400 && st.counters.guideBackouts === 0; i++) st = advanceDevice(su.s, su.g, st, 0.5);
    // re-seated over the wire with the stent in the calcified segment
    st = engageGuide(su.s, st, su.g);
    expect(distalOf(st)).toBeGreaterThan(su.g.lesion.startMm - 2);
    const depth = st.guide.depthMm;
    const pulled = advanceDevice(su.s, su.g, st, -4);
    expect(pulled.guide.depthMm).toBeGreaterThan(depth);
    expect(deliveryOf(pulled).suckInMm).toBeGreaterThan(0);
    const held = advanceDevice(su.s, su.g, holdGuide(st, true), -4);
    expect(held.guide.depthMm).toBeCloseTo(depth, 6);
  });
});

describe("the support options (pci-device-delivery)", () => {
  it("an anchor balloon adds back-up; sized above 1:1 or inflated above 8 atm it is a breach", () => {
    const { su, st: st0 } = at(STUCK, "wire-across", "JR4");
    const ok = setAnchorBalloon(su.g, st0, { diameter: 1.25, atm: 6, branch: "RV" });
    expect(ok.guide.anchor).toBeTruthy();
    expect(backupForce(ok.guide)).toBeGreaterThan(backupForce(st0.guide));
    expect(deliveryOf(ok).anchorBreaches).toBe(0);
    const high = setAnchorBalloon(su.g, st0, { diameter: 1.25, atm: 14, branch: "RV" });
    expect(deliveryOf(high).anchorBreaches).toBe(1);
    const big = setAnchorBalloon(su.g, st0, { diameter: 4.0, atm: 6, branch: "RV" });
    expect(deliveryOf(big).anchorBreaches).toBe(1);
    expect(setAnchorBalloon(su.g, ok, null).guide.anchor).toBeNull();
  });

  it("holding the guide while the device runs 900 mm down the guide shaft from the valve leaves the guide where it was; beyond the tip the seat stays short of too deep", () => {
    const { su, st: st0 } = predilated();
    let st = holdGuide(pinWire(st0, true), true);
    const depth0 = st.guide.depthMm;
    st = advanceDevice(su.s, su.g, ready(st, "sc", 2.0, 15), 1, { fromValve: true });
    expect(deviceShaftMm(st)).toBeCloseTo(0, 6);
    for (let i = 0; i < 90; i++) st = advanceDevice(su.s, su.g, st, 10, { fromValve: true });
    expect(deviceShaftMm(st)).toBeCloseTo(900, 6);
    expect(distalOf(st)).toBeLessThan(0);
    expect(st.guide.depthMm).toBe(depth0);
    // out of the guide and on, in small bites: the left hand's seat is capped below the too-deep threshold
    for (let i = 0; i < 200; i++) st = advanceDevice(su.s, su.g, st, 1);
    expect(distalOf(st)).toBeGreaterThan(0);
    expect(MP_HELD_SEAT_DEPTH_MAX).toBeLessThan(GUIDE_TOO_DEEP_MM);
    expect(st.guide.depthMm).toBeLessThanOrEqual(Math.max(depth0, MP_HELD_SEAT_DEPTH_MAX) + 1e-9);
  });

  it("the strut and anchoring-balloon support catheters have neither of the scaffold type's limits", () => {
    const { su, st: st0 } = at(STUCK, "wire-across", "JR4");
    // a lesion closer to the ostium than the scaffold's landing zone
    const g = { ...su.g, lesion: { ...su.g.lesion, startMm: SUPPORT_LANDING_MM - 4 } };
    expect(deliveryOf(setSupportCatheter(g, st0, "scaffold")).shortLandings).toBe(1);
    for (const kind of ["strut", "anchoring-balloon"] as const) {
      const sc = setSupportCatheter(g, st0, kind);
      expect(sc.guide.supportCatheter).toBe(kind);
      expect(deliveryOf(sc).shortLandings).toBe(0);
      // taken out over the short working wire
      const out = setSupportCatheter(g, sc, null);
      expect(out.guide.supportCatheter).toBeNull();
      expect(deliveryOf(out).supportTrapAttempts).toBe(0);
    }
  });

  it("a scaffold support catheter adds back-up, needs its landing zone and cannot be taken out over a short wire", () => {
    const { su, st: st0 } = at(STUCK, "wire-across", "JR4");
    expect(su.g.lesion.startMm).toBeGreaterThanOrEqual(SUPPORT_LANDING_MM);
    const sc = setSupportCatheter(su.g, st0, "scaffold");
    expect(backupForce(sc.guide)).toBeGreaterThan(backupForce(st0.guide));
    expect(deliveryOf(sc).shortLandings).toBe(0);
    const stay = setSupportCatheter(su.g, sc, null);
    expect(stay.guide.supportCatheter).toBe("scaffold");
    expect(deliveryOf(stay).supportTrapAttempts).toBe(1);
    const long = setSupportCatheter(su.g, { ...sc, wire: { ...sc.wire, lengthCm: 300 } }, null);
    expect(long.guide.supportCatheter).toBeNull();
  });

  it("deliver() with an extension in the vessel: a device inside it meets only the guide's curves", () => {
    const su = setup(STUCK);
    const gs = { ...initialGuide("JR4"), extensionMm: 40 };
    const inp = deliveryInput(su.s, su.g, { ...at(STUCK, "wire-across", "JR4").st, guide: gs, device: requestDevice(at(STUCK, "wire-across").st, "des", 3, 22).device! }, 20, 30);
    expect(inp.extensionTipMm).toBe(40);
    const inside = deliver(su.g, gs, inp).r;
    const bareInp = { ...inp, extensionTipMm: null };
    const bare = deliver(su.g, initialGuide("JR4"), bareInp).r;
    expect(inside.frictionN).toBeLessThan(bare.frictionN);
  });
});

describe("the stuck-stent start (pci-device-delivery)", () => {
  it("opens with the stent at the bend, the guide backed out (depthMm < 0) and the events stent-uncrossable and poor-guide-support", () => {
    const { su, st, start } = at(STUCK, "stent-stuck-bend2");
    expect(start.id).toBe("stent-stuck-bend2");
    const L = su.g.lesion;
    const d = distalOf(st);
    console.info(`stuck stent: distal ${d.toFixed(1)} mm (lesion ${L.startMm.toFixed(1)}-${L.endMm.toFixed(1)}), guide ${st.guide.depthMm} mm coaxial ${st.guide.coaxial}`);
    expect(st.device?.kind).toBe("stent");
    expect(st.device?.diameter).toBe(3.0);
    expect(st.device?.lengthMm).toBe(22);
    expect(d).toBeGreaterThanOrEqual(L.startMm - 2);
    expect(d).toBeLessThan(L.endMm);
    expect(st.guide.engaged).toBe(true);
    expect(st.guide.depthMm).toBeLessThan(0);
    const ctx = pciTipContext(st, L);
    expect(ctx.phase).toBe("stent");
    expect(ctx.events).toContain("stent-uncrossable");
    expect(ctx.events).toContain("poor-guide-support");
    // the stall is the engine's: one more push does not move the stent
    const again = advanceDevice(su.s, su.g, st, 1);
    expect(distalOf(again)).toBeLessThan(d + 0.6);
  });

  it("the balloon-at-edge start opens with a 2.0 mm balloon stopped at the lesion and balloon-uncrossable", () => {
    const { su, st } = at("rca-calcified-uncrossable", "balloon-at-edge");
    const L = su.g.lesion;
    expect(st.device?.kind).toBe("balloon");
    expect(st.device?.diameter).toBe(2.0);
    expect(distalOf(st)).toBeGreaterThanOrEqual(L.startMm - 2);
    expect(distalOf(st)).toBeLessThan(L.endMm);
    expect(st.guide.engaged).toBe(true);
    const ctx = pciTipContext(st, L);
    expect(ctx.phase).toBe("lesion-prep");
    expect(ctx.events).toContain("balloon-uncrossable");
  });
});
