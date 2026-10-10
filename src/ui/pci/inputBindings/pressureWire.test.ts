// pci-pressure-wire-console: the pressure wire's hand actions are bound by src/ui/pci/inputBindings/pressureWire.ts
// and reachable through the PCI input target with no console open: once the working wire is exchanged for the
// pressure wire the hands advance it (the sensor 3 cm behind the tip) and pull it back, and a pullback being
// recorded draws its curve from the hands' moves. For any other wire the built-in route moves it as before. The
// console offers settings and read-outs only, and is in the registry. The case's set-up faults come from the
// launch's 'pwFault' param and are armed on the wire by the session-level action path, once per case: the
// aortic line is kept across a wire exchange. A stored run's image is where co-registration draws the pullback:
// the route is placed on it by the camera the live monitor rendered the run with.
//   npx vitest run src/ui/pci/inputBindings/pressureWire.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { PciLabSession } from "../PciLabSession";
import { PciInputTarget } from "../pciInputTarget";
import { resolvePciLaunch } from "../launch";
import { createInputSystem } from "../../../input/system";
import { defaultSettings, pciGripOrder, pciSettings } from "../../../input/settings";
import { STORE_PX, useSeriesStore, type StoredSeries } from "../../../state/useSeriesStore";
import { moveWire, setWireKind } from "../../../simulation/pci/actions/wire";
import { pwCheckConnections, pwCoregistered, pwFlushGuide, pwRemoveIntroducer, pwRouteFrame, pwSetupOf, pwStartIvAdenosine, setPullbackRecording } from "../../../simulation/pci/actions/pressure";
import { sensorMm } from "../../../simulation/pci/coronaryWire";
import { IV_ADENOSINE_UG_KG_MIN, MP_AIR_ML } from "../../../simulation/pci/pwSession";
import { XrayRenderer } from "../../../render/xray/XrayRenderer";
import { PCI_INPUT_BINDINGS, bindingFor } from "./index";
import {
  aorticLineOf,
  applyPressureAction,
  applyPressureFollowUp,
  binding,
  equaliseInSession,
  flushAorticLineInSession,
  sessionPwFaults,
  storedFrameIndex,
  storedRunCamera,
  storedRunFor,
  storedRunPlace,
  zeroTransducerInSession,
} from "./pressureWire";
import { MP_FAULT_AIR_ML } from "../../../simulation/patient/transducer";
import { MP_LOOSE_TRANSDUCER_DRIFT_MMHG_S } from "../../../simulation/pci/pressureWire";
import { meta as consoleMeta } from "../consoles/PressureWireConsole";
import { pciConsoles } from "../consoles/registry";

const sessions: PciLabSession[] = [];
const targets: PciInputTarget[] = [];
afterEach(() => {
  for (const t of targets.splice(0)) t.dispose();
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

/** lad-focal opened at 'guide engaged' (the working wire still in the guide), with an input target. */
function rig(params: Record<string, string> = {}) {
  const r = resolvePciLaunch({ scenario: "lad-focal", start: "guide-engaged", mode: "supervised", ...params });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
  sessions.push(x);
  const sys = createInputSystem({ storage: null, settings: pciSettings(defaultSettings()), gripOrder: pciGripOrder(null), initialGrip: "wire014", getPads: () => [] });
  const t = new PciInputTarget(x, sys);
  targets.push(t);
  return { x, t };
}

describe("pressure-wire hand bindings (pci-pressure-wire-console)", () => {
  it("the binding file declares the wire's advance and withdraw, and the console is registered", () => {
    expect(binding.device).toBe("wire014");
    for (const a of ["advance", "withdraw"] as const) expect(bindingFor(PCI_INPUT_BINDINGS, "wire014", a)?.file).toBe("./pressureWire.ts");
    // torque and pin stay on the target's built-in route
    expect(bindingFor(PCI_INPUT_BINDINGS, "wire014", "torque")).toBeNull();
    expect(pciConsoles().some((c) => c.id === consoleMeta.id)).toBe(true);
  });

  it("for a workhorse wire the binding passes: the built-in route moves the wire through the session", () => {
    const { x, t } = rig();
    expect(x.st.wireKind).not.toBe("pressure");
    const move = vi.spyOn(x, "moveWire");
    expect(t.hand({ kind: "push", device: "wire014", mm: 3 })).toBe(true);
    expect(move).toHaveBeenCalledWith(3);
  });

  it("drives the pressure wire through the input target with the console closed: out to the guide tip, down the vessel, and a recorded pullback by hand", () => {
    const { x, t } = rig();
    expect(x.openConsoleId()).toBeNull();
    expect(applyPressureAction(x, "wire-kind", (st) => setWireKind(st, "pressure", { g: x.g }))).toBe(true);
    expect(x.st.wireKind).toBe("pressure");
    // the hands: advance until the sensor is just beyond the guide tip
    const move = vi.spyOn(x, "moveWire");
    for (let i = 0; i < 80 && (sensorMm(x.st.wire) ?? -99) < 1; i++) expect(t.hand({ kind: "push", device: "wire014", mm: 1 })).toBe(true);
    // the binding took the pushes (not the built-in route)
    expect(move).not.toHaveBeenCalled();
    expect(sensorMm(x.st.wire)!).toBeGreaterThanOrEqual(1);
    expect(sensorMm(x.st.wire)!).toBeLessThan(5);
    // set up and equalise (console steps through the same session path), then on down the vessel
    expect(applyPressureAction(x, "wire-kind", (st) => pwRemoveIntroducer(st))).toBe(true);
    expect(x.flushGuide()).toBe(true);
    expect(zeroTransducerInSession(x)).toBe(true);
    expect(equaliseInSession(x)).toBe(true);
    expect(x.st.pressure!.equalised).toBe(true);
    for (let i = 0; i < 40; i++) t.perform("wire014", "advance", 2);
    const far = sensorMm(x.st.wire)!;
    expect(far).toBeGreaterThan(40);
    // record a pullback, and pull back by hand
    expect(applyPressureAction(x, "wire-kind", (st) => setPullbackRecording(st, true))).toBe(true);
    for (let i = 0; i < 40 && sensorMm(x.st.wire)! > 1; i++) expect(t.hand({ kind: "push", device: "wire014", mm: -2 })).toBe(true);
    const pb = x.st.pressure!.pullback;
    expect(pb.samples.length).toBeGreaterThan(10);
    expect(pb.samples[0].mm).toBeLessThan(far);
    expect(pb.samples[pb.samples.length - 1].mm).toBeLessThan(pb.samples[0].mm);
  });

  it("the launch's pwFault param arms the case's set-up faults on the loaded wire", () => {
    const { x } = rig({ pwFault: "line-air" });
    expect(sessionPwFaults(x)).toEqual(["line-air"]);
    expect(applyPressureAction(x, "wire-kind", (st) => setWireKind(st, "pressure", { g: x.g }))).toBe(true);
    // the air is in the patient's arterial line, the one the monitor shows, and the wire's set-up reads it
    expect(x.engine.transducer.st.airMl).toBeGreaterThanOrEqual(MP_AIR_ML);
    expect(pwSetupOf(x.st)!.airMl).toBe(x.engine.transducer.st.airMl);
    expect(pwSetupOf(x.st)!.faults).toEqual(["line-air"]);
  });

  it("exchanging the pressure wire out and back in keeps the aortic line as it was put right, and the infusion on the record", () => {
    const { x } = rig({ pwFault: "line-air" });
    expect(applyPressureAction(x, "wire-kind", (st) => setWireKind(st, "pressure", { g: x.g }))).toBe(true);
    expect(flushAorticLineInSession(x)).toBe(true);
    expect(x.engine.transducer.st.airMl).toBe(0);
    expect(applyPressureAction(x, "drug", (st) => pwStartIvAdenosine(st, IV_ADENOSINE_UG_KG_MIN.low, "central"))).toBe(true);
    expect(applyPressureAction(x, "wire-kind", (st) => setWireKind(st, "workhorse", { g: x.g }))).toBe(true);
    expect(x.st.pressure).toBeNull();
    expect(applyPressureAction(x, "wire-kind", (st) => setWireKind(st, "pressure", { g: x.g }))).toBe(true);
    const set = pwSetupOf(x.st)!;
    expect(set.faults).toEqual([]);
    expect(set.airMl).toBe(0);
    expect(set.hyper.mode).toBe("iv");
    // equalisation now takes, with no line-air failure
    for (let i = 0; i < 80 && (sensorMm(x.st.wire) ?? -99) < 1; i++) applyPressureAction(x, "advance-wire", (st) => moveWire(x.s, x.g, st, 1));
    applyPressureAction(x, "wire-kind", (st) => pwRemoveIntroducer(st));
    expect(x.flushGuide()).toBe(true);
    expect(zeroTransducerInSession(x)).toBe(true);
    expect(equaliseInSession(x)).toBe(true);
    expect(x.st.pressure!.equalised).toBe(true);
    expect(pwSetupOf(x.st)!.eq).toMatchObject({ ok: true });
  });

  it("the state side of the guide flush follows session.flushGuide() without asking the attending a second time", () => {
    const { x } = rig();
    applyPressureAction(x, "wire-kind", (st) => setWireKind(st, "pressure", { g: x.g }));
    const ask = vi.fn(() => true);
    x.beforeAction = ask;
    expect(x.flushGuide()).toBe(true);
    expect(applyPressureFollowUp(x, "flush-guide", (st) => pwFlushGuide(st))).toBe(true);
    expect(ask).toHaveBeenCalledTimes(1);
    expect(pwSetupOf(x.st)!.flushedAt).toBe(x.st.t);
  });

  it("co-registration uses the run the pullback was recorded against, and places the route on its image with the camera that rendered it", () => {
    const { x } = rig();
    applyPressureAction(x, "wire-kind", (st) => setWireKind(st, "pressure", { g: x.g }));
    for (let i = 0; i < 120 && (sensorMm(x.st.wire) ?? -99) < 30; i++) applyPressureAction(x, "advance-wire", (st) => moveWire(x.s, x.g, st, 1));
    const smm = sensorMm(x.st.wire)!;
    expect(smm).toBeGreaterThan(20);
    // the run was filmed at the projection the C-arm stands at now
    const cArm = { ...x.carm.angles };
    const mk = (id: string, number: number, frames: Uint8Array[] = []) =>
      ({ id, number, kind: "cine", caseId: x.caseId, cArm, cArmEnd: cArm, fieldCm: x.field, w: STORE_PX, h: STORE_PX, frames, mmPerPxIso: 0.35 }) as unknown as StoredSeries;
    const dark = new Uint8Array(STORE_PX * STORE_PX).fill(40);
    const light = new Uint8Array(STORE_PX * STORE_PX).fill(200);
    useSeriesStore.setState({ series: [mk("a", 1, [light, dark, light]), mk("b", 2)] });
    expect(storedRunFor(x)?.id).toBe("b");
    expect(storedRunFor(x, 1)?.id).toBe("a");
    expect(storedRunFor(x, 9)?.id).toBe("b");
    // the most opacified frame, unless the trainee has marked a reference frame
    expect(storedFrameIndex(storedRunFor(x, 1)!)).toBe(1);
    useSeriesStore.getState().markReference("a", 2);
    expect(storedFrameIndex(storedRunFor(x, 1)!)).toBe(2);
    expect(storedFrameIndex(storedRunFor(x)!)).toBe(-1);
    // the camera and iso-centre are the live monitor's for the run's projection and field
    const run = storedRunFor(x, 1)!;
    const scene = x.sceneFor("cine", { frame: 1 }, null);
    const { cam, iso } = storedRunCamera(x, run);
    for (const k of ["src", "detC", "detU", "detV"] as const) for (const a of ["x", "y", "z"] as const) expect(cam[k][a]).toBeCloseTo(scene.scene.cam[k][a], 6);
    for (const a of ["x", "y", "z"] as const) expect(iso[a]).toBeCloseTo(scene.iso[a], 6);
    // the sensor lies on the route's placement, inside the image, and on the wire the scene drew (heart motion aside)
    const frame = pwRouteFrame(x.g, x.st.route, storedRunPlace(x, run), run.number);
    const co = pwCoregistered(frame, x.st.pressure!, smm);
    const p = co.sensor!;
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(run.w);
    expect(p.y).toBeGreaterThan(0);
    expect(p.y).toBeLessThan(run.h);
    const near = Math.min(...frame.xy.map((q) => Math.hypot(q.x - p.x, q.y - p.y)));
    expect(near).toBeLessThan(1);
    const wirePx = scene.scene.tubes
      .filter((t) => t.r.length && Math.max(...t.r) < 0.25)
      .flatMap((t) => t.pts.map((q) => XrayRenderer.project(scene.scene.cam, q)))
      .map((q) => ({ x: ((q.u + 1) / 2) * run.w, y: ((1 - q.v) / 2) * run.h }));
    expect(wirePx.length).toBeGreaterThan(10);
    // placed with that frame's own heart motion, the route lies on the wire the scene drew
    const moving = pwRouteFrame(x.g, x.st.route, storedRunPlace(x, run, { motion: scene.motion }), run.number);
    const onWire = moving.xy.filter((_, i) => moving.mm[i] > 5 && moving.mm[i] < x.st.tipMm - 5).map((q) => Math.min(...wirePx.map((w) => Math.hypot(w.x - q.x, w.y - q.y))));
    expect(onWire.length).toBeGreaterThan(10);
    // the wire runs inside the lumen, off the centre line by up to about the lumen's radius (a few pixels)
    expect(onWire.reduce((a, b) => a + b, 0) / onWire.length).toBeLessThan(2);
    expect(Math.max(...onWire)).toBeLessThan(6);
  });
  /** The pressure wire loaded, its sensor just beyond the guide tip, the introducer out and the guide flushed with saline. */
  function atTheTip(params: Record<string, string> = {}) {
    const { x } = rig(params);
    expect(applyPressureAction(x, "wire-kind", (st) => setWireKind(st, "pressure", { g: x.g }))).toBe(true);
    for (let i = 0; i < 80 && (sensorMm(x.st.wire) ?? -99) < 1; i++) applyPressureAction(x, "advance-wire", (st) => moveWire(x.s, x.g, st, 1));
    applyPressureAction(x, "wire-kind", (st) => pwRemoveIntroducer(st));
    expect(x.flushGuide()).toBe(true);
    return x;
  }

  it("the aortic channel is the patient's arterial line: equalisation fails while the monitor's line is not zeroed, and zeroing it on the monitor lets it through", () => {
    const x = atTheTip();
    // the lab opens with the arterial line not yet zeroed (the monitor asks for it)
    expect(x.engine.transducer.st.zeroed).toBe(false);
    equaliseInSession(x);
    expect(x.st.pressure!.equalised).toBe(false);
    expect(pwSetupOf(x.st)!.eq).toMatchObject({ ok: false, reason: "transducer-unzeroed", refused: false });
    expect(pwSetupOf(x.st)!.eq!.text).toMatch(/^Equalisation failed/);
    // the monitor's Zero ART and Level (not the console) put the line right for the wire as well
    x.engine.transducer.level();
    x.engine.transducer.zero();
    expect(aorticLineOf(x)).toMatchObject({ zeroed: true, levelled: true });
    equaliseInSession(x);
    expect(x.st.pressure!.equalised).toBe(true);
    expect(pwSetupOf(x.st)!.eq).toMatchObject({ ok: true });
    expect(pwSetupOf(x.st)!.paLineOffsetMmHg).toBeCloseTo(0, 6);
  });

  it("the console's team steps act on the monitor's line: zero and level clear its 'zero required', flushing re-primes the air the case put in", () => {
    const x = atTheTip({ pwFault: "line-air" });
    expect(x.engine.transducer.st.airMl).toBe(MP_FAULT_AIR_ML);
    expect(x.engine.transducer.dynamic().verdict).toBe("overdamped");
    expect(zeroTransducerInSession(x)).toBe(true);
    expect(x.engine.transducer.st.zeroed).toBe(true);
    expect(Math.abs(x.engine.transducer.st.heightCm)).toBe(0);
    // still air in the line: the trace is damped
    equaliseInSession(x);
    expect(pwSetupOf(x.st)!.eq).toMatchObject({ ok: false, reason: "line-air" });
    expect(flushAorticLineInSession(x)).toBe(true);
    expect(x.engine.transducer.st.airMl).toBe(0);
    expect(pwSetupOf(x.st)!.faults).toEqual([]);
    equaliseInSession(x);
    expect(x.st.pressure!.equalised).toBe(true);
  });

  it("an unzeroed-transducer case un-zeroes the monitor's line too; a loose transducer's drift reaches the monitor's line as the lab runs", () => {
    const u = atTheTip({ pwFault: "transducer-unzeroed" });
    expect(u.engine.transducer.faults()).toContain("unzeroed");
    expect(pwSetupOf(u.st)!.transducerZeroed).toBe(false);
    const x = atTheTip({ pwFault: "transducer-loose" });
    expect(zeroTransducerInSession(x)).toBe(true);
    const tr = x.engine.transducer;
    const off0 = tr.st.drift - tr.st.zeroRef;
    expect(off0).toBeCloseTo(0, 6);
    for (let i = 0; i < 300; i++) x.step(0.1);
    const set = pwSetupOf(x.st)!;
    expect(set.paDriftMmHg).toBeGreaterThan(MP_LOOSE_TRANSDUCER_DRIFT_MMHG_S * 20);
    // the monitor's line carries the drift the wire's aortic channel carries, counted once on the wire
    expect(tr.st.drift - tr.st.zeroRef).toBeCloseTo(set.paDriftMmHg, 1);
    expect(aorticLineOf(x)!.offsetMmHg).toBeCloseTo(0, 1);
    // tightened and zeroed again: both lines read true
    expect(applyPressureAction(x, "wire-kind", (st) => pwCheckConnections(st))).toBe(true);
    expect(zeroTransducerInSession(x)).toBe(true);
    expect(tr.st.drift - tr.st.zeroRef).toBeCloseTo(0, 6);
    expect(pwSetupOf(x.st)!.paDriftMmHg).toBe(0);
  });

  it("co-registration shows the frame on which the route is opacified, not the frame darkest on average", () => {
    const w = 64;
    // a route across the image, and two frames: before the contrast (darker on average, no vessel) and with it
    const route = Array.from({ length: 40 }, (_, i) => ({ x: 12 + i, y: 20 + i * 0.5 }));
    const before = new Uint8Array(w * w).fill(100);
    const peak = new Uint8Array(w * w).fill(160);
    for (const p of route) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) peak[(Math.round(p.y) + dy) * w + Math.round(p.x) + dx] = 60;
    const run = { id: "op", frames: [before, peak, before], w, h: w, mmPerPxIso: 1 };
    // by the image's mean the pre-contrast frame wins; along the route the opacified frame does
    expect(storedFrameIndex(run)).toBe(0);
    expect(storedFrameIndex(run, route)).toBe(1);
    // the frame the trainee marks still wins
    useSeriesStore.getState().markReference("op", 2);
    expect(storedFrameIndex(run, route)).toBe(2);
  });
});
