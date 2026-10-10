// pci-lab-shell-session: the PCI lab session, headless (no renderer, no React). Pedal-gated imaging and
// dose, stored cine runs, a fresh patient for a repeated case, the console and modal interruptions the
// recorder counts, and every core scenario completed through the session in guided and in independent
// mode, loading devices through the AssistedDeviceConsole's path (the session's assisted actions).
//   npx vitest run src/ui/pci/PciLabSession.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { PCI_FLUORO_RATES, PciLabSession, deviceSizeFor, policyForMode, type PciLabSessionOptions } from "./PciLabSession";
import { useSeriesStore } from "../../state/useSeriesStore";
import { pathToTarget } from "../../simulation/angioPci";
import { takeOff, wrap } from "../../simulation/pci/geometry";
import type { LaunchMode } from "../../content/schema";

const sessions: PciLabSession[] = [];
function lab(o: PciLabSessionOptions = {}): PciLabSession {
  const x = new PciLabSession({ team: false, headlessFrames: true, ...o });
  sessions.push(x);
  return x;
}
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

/** Step the lab for `seconds` of lab time. */
function run(x: PciLabSession, seconds: number, dt = 1 / 30) {
  for (let t = 0; t < seconds - 1e-9; t += dt) x.step(dt);
}

/** Turn the torque device until the tip azimuth is within `tol` of `target` (an operator watching the tip). */
function turnTipTo(x: PciLabSession, target: number, tol = 0.12) {
  for (let i = 0; i < 80; i++) {
    const e = wrap(target - x.st.wire.tip);
    if (Math.abs(e) < tol) break;
    x.torqueWire(Math.sign(e) * Math.min(0.35, Math.abs(e) + 0.05));
  }
}

/** Steer the wire to `beyondMm` past the lesion under fluoroscopy (src/simulation/pci/testSetup.ts wireToTarget, through the session). */
function wireToTarget(x: PciLabSession, beyondMm = 35, step = 2) {
  const { g, s } = x;
  const path = pathToTarget(g, s);
  x.setPedal({ fluoro: true, cine: false });
  for (let guard = 0; guard < 600; guard++) {
    const st = x.st;
    const cur = st.route[st.route.length - 1];
    const k = path.indexOf(cur);
    if (k < 0 || st.wire.fold) {
      x.moveWire(-6);
      continue;
    }
    const next = path[k + 1];
    if (next) turnTipTo(x, takeOff(g, g.byName.get(next)!).azimuth);
    else {
      const v = g.byName.get(cur)!;
      const ahead = (g.children.get(cur) ?? []).filter((c) => c.parent!.index < v.samples.length - 2 && v.pathMm[c.parent!.index] > x.st.tipMm).sort((a, b) => a.parent!.index - b.parent!.index)[0];
      if (ahead) turnTipTo(x, takeOff(g, ahead).azimuth + Math.PI);
    }
    if (cur === g.lesion.vessel && x.st.tipMm >= g.lesion.endMm + beyondMm) break;
    const before = x.st.tipMm;
    x.moveWire(step);
    x.step(1 / 15);
    if (x.st.tipMm <= before + 1e-6 && !x.st.wire.fold && x.st.route[x.st.route.length - 1] === cur) break;
  }
  x.setPedal({ fluoro: false, cine: false });
}

/** A cine injection (Space) and the run filmed to its end. */
function cineRun(x: PciLabSession) {
  expect(x.inject({ autoCine: true })).toBe(true);
  run(x, 0.4);
  x.releaseInjection();
  run(x, 4);
}

/** Bring the loaded device's centre to the lesion centre (the console's move buttons). */
function toLesion(x: PciLabSession) {
  const d = x.g.lesion.centreMm - x.st.device!.centreMm;
  x.advanceDevice(d);
}

/** Complete a core scenario as an operator would, through the session and the assisted console path. */
function complete(id: string, mode: LaunchMode) {
  const x = lab({ scenarioId: id, mode, policy: policyForMode(mode) });
  expect(x.st.guide.engaged).toBe(false);
  expect(x.engageGuide()).toBe(true);
  cineRun(x);
  if (x.s.target.kind === "cto") {
    // a workhorse wire buckles at the cap: escalate to a CTO wire
    x.setWireKind("cto");
    wireToTarget(x, 20, 1);
  } else wireToTarget(x);
  expect(x.st.tipMm).toBeGreaterThan(x.g.lesion.endMm);
  // calcium is prepared before stenting (lithotripsy balloon)
  if (x.s.calcium === 2) {
    expect(x.loadDevice("balloon", "ivl", 3.0, 12)).toBe(true);
    toLesion(x);
    x.inflate(6);
    run(x, 1);
    x.deflate();
    x.removeDevice();
  }
  const { diameter, lengthMm } = deviceSizeFor(x.g.lesion.refDiameter, x.g.lesion.endMm - x.g.lesion.startMm);
  expect(x.loadDevice("stent", "semi-compliant", diameter, lengthMm)).toBe(true);
  expect(x.st.device!.assisted).toBe(true);
  toLesion(x);
  // a positioning run, then deploy
  cineRun(x);
  x.setIndeflatorAtm(14);
  x.inflate();
  run(x, 1);
  x.deflate();
  x.removeDevice();
  // complications the team treats as an operator would (intracoronary vasodilator for slow flow)
  if (x.st.slowFlow) {
    x.giveVasodilator();
    run(x, 10);
  }
  cineRun(x);
  const r = x.finish();
  return { x, r: r! };
}

describe("pedal-gated imaging and dose (headless)", () => {
  it("5 s of pedal fluoroscopy raises the fluoroscopy time by about 5 s", () => {
    const x = lab();
    const t0 = x.lab.dose.totals.fluoroTimeS;
    x.setPedal({ fluoro: true, cine: false });
    run(x, 5);
    x.setPedal({ fluoro: false, cine: false });
    run(x, 1);
    expect(x.lab.dose.totals.fluoroTimeS - t0).toBeGreaterThan(4.8);
    expect(x.lab.dose.totals.fluoroTimeS - t0).toBeLessThan(5.2);
    // the procedure's own fluoroscopy clock agrees
    expect(x.st.fluoroS).toBeCloseTo(5, 0);
  });

  it("advancing the wire and a device with the pedal up adds no fluoroscopy time (no automatic fluoroscopy)", () => {
    const x = lab({ scenarioId: "lad-focal" });
    x.engageGuide();
    wireToTarget(x);
    const f0 = x.lab.dose.totals.fluoroTimeS;
    const s0 = x.st.fluoroS;
    x.loadDevice("balloon", "semi-compliant", 2.5, 15);
    for (let i = 0; i < 10; i++) {
      x.advanceDevice(5);
      x.moveWire(1);
      run(x, 0.3);
    }
    expect(x.st.device!.centreMm).toBeGreaterThan(0);
    expect(x.lab.dose.totals.fluoroTimeS).toBe(f0);
    expect(x.st.fluoroS).toBe(s0);
    expect(x.beamMode()).toBeNull();
  });

  it("one cine run adds one series with frames to the reference monitor's store", () => {
    const x = lab();
    useSeriesStore.getState().clear();
    x.setPedal({ fluoro: false, cine: true });
    run(x, 1.5);
    x.setPedal({ fluoro: false, cine: false });
    const series = useSeriesStore.getState().series;
    expect(series).toHaveLength(1);
    expect(series[0].kind).toBe("cine");
    expect(series[0].frames.length).toBeGreaterThan(0);
    expect(x.lab.dose.totals.cineRuns).toBe(1);
    // cine is not fluoroscopy time
    expect(x.lab.dose.totals.fluoroTimeS).toBe(0);
  });

  it("a cine injection films its run and stores it; store fluoro keeps the last fluoroscopy", () => {
    const x = lab();
    x.engageGuide();
    cineRun(x);
    expect(useSeriesStore.getState().series.filter((s) => s.kind === "cine")).toHaveLength(1);
    expect(useSeriesStore.getState().series[0].injected).toBe(true);
    expect(x.contrastUsed).toBeGreaterThan(0);
    expect(x.st.contrastMl).toBe(Math.round(x.contrastUsed));
    x.setPedal({ fluoro: true, cine: false });
    run(x, 1);
    x.setPedal({ fluoro: false, cine: false });
    expect(x.canStoreFluoro()).toBe(true);
    const f = x.storeFluoro();
    expect(f?.kind).toBe("fluoro");
    expect(useSeriesStore.getState().series).toHaveLength(2);
  });

  it("the X-ray release and the attending's beam gate keep the beam off", () => {
    const x = lab();
    x.toggleXray();
    x.setPedal({ fluoro: true, cine: false });
    run(x, 1);
    expect(x.lab.dose.totals.fluoroTimeS).toBe(0);
    x.toggleXray();
    x.beamGate = () => false;
    run(x, 1);
    expect(x.lab.dose.totals.fluoroTimeS).toBe(0);
    x.beamGate = null;
    run(x, 1);
    expect(x.lab.dose.totals.fluoroTimeS).toBeGreaterThan(0.8);
  });
});

describe("a repeated case starts afresh", () => {
  it("contrast 0, a new patient engine and fresh syringes", () => {
    const a = lab({ scenarioId: "lad-focal" });
    a.engageGuide();
    cineRun(a);
    expect(a.st.contrastMl).toBeGreaterThan(0);
    const b = a.repeat();
    sessions.push(b);
    expect(a.disposed).toBe(true);
    expect(b.s.id).toBe("lad-focal");
    expect(b.st.contrastMl).toBe(0);
    expect(b.contrastPushed()).toBe(0);
    expect(b.engine).not.toBe(a.engine);
    expect(b.engine.vitals().contrast.totalMl).toBe(0);
    expect(b.syringes.guide).not.toBe(a.syringes.guide);
    expect(b.syringes.contra).not.toBe(a.syringes.contra);
    expect(b.syringes.guide.stats.totalMl).toBe(0);
    expect(b.lab.dose.totals.karMGy.total).toBe(0);
  });
});

describe("the recorder counts interruptions", () => {
  it("opening a console and opening a modal each add one 'ui' event with its id", () => {
    const x = lab();
    const n0 = x.uiEvents().length;
    x.openConsole("assisted-devices");
    expect(x.uiEvents()).toHaveLength(n0 + 1);
    expect(x.uiEvents()[x.uiEvents().length - 1].data).toMatchObject({ action: "console-open", console: "assisted-devices" });
    // the same console again is not a new interruption
    x.openConsole("assisted-devices");
    expect(x.uiEvents()).toHaveLength(n0 + 1);
    x.openModal("prebrief");
    expect(x.uiEvents()).toHaveLength(n0 + 2);
    expect(x.uiEvents()[x.uiEvents().length - 1].data).toMatchObject({ action: "modal-open", modal: "prebrief" });
    x.closeModal("prebrief");
    x.closeConsole();
    expect(x.uiEvents()).toHaveLength(n0 + 2);
  });
});

describe("the attending drawer and the finish step", () => {
  it("the attending drawer is a modal: opening it adds one 'ui' event, closing it none", () => {
    const x = lab();
    const n0 = x.uiEvents().length;
    x.openModal("attending");
    expect(x.openModals()).toContain("attending");
    expect(x.uiEvents()).toHaveLength(n0 + 1);
    expect(x.uiEvents()[x.uiEvents().length - 1].data).toMatchObject({ action: "modal-open", modal: "attending" });
    x.closeModal("attending");
    expect(x.openModals()).not.toContain("attending");
    expect(x.uiEvents()).toHaveLength(n0 + 1);
  });

  it("the finish step asks first: the case goes on until it is confirmed, and can be cancelled", () => {
    const x = lab();
    x.setFinishStep(true);
    expect(x.finished).toBe(false);
    expect(x.tipContext().phase).toBe("finish");
    x.setFinishStep(false);
    expect(x.finished).toBe(false);
    expect(x.tipContext().phase).not.toBe("finish");
    x.setFinishStep(true);
    expect(x.finish()).not.toBeNull();
    expect(x.finished).toBe(true);
    expect(x.finishing).toBe(false);
  });
});

describe("the snapshot's counters", () => {
  it("whole cine frames and contrast to 0.1 mL", () => {
    const x = lab();
    x.engageGuide();
    cineRun(x);
    const snap = x.snapshot();
    expect(Number.isInteger(snap.dose.cineFrames)).toBe(true);
    expect(snap.dose.cineFrames).toBe(Math.round(x.lab.dose.totals.cineFrames));
    expect(snap.contrastMl).toBe(Math.round(x.contrastPushed() * 10) / 10);
    expect(Math.round(snap.contrastMl * 10)).toBe(snap.contrastMl * 10);
  });
});

describe("the core scenarios can be completed headlessly through the session", () => {
  for (const id of ["lad-focal", "rca-calcified", "lcx-stemi", "rca-cto"]) {
    for (const mode of ["guided", "independent"] as const) {
      it(`${id} in ${mode} mode`, () => {
        const { x, r } = complete(id, mode);
        expect(x.policy.mode).toBe(mode);
        expect(r.items.filter((i) => !i.ok).map((i) => i.text)).not.toContain("No stent covers the lesion.");
        expect(r.passed, r.items.map((i) => `${i.ok ? "ok" : "NO"} ${i.text}`).join("\n")).toBe(true);
        expect(x.finished).toBe(true);
        // the beam is off once the case is finished
        x.setPedal({ fluoro: true, cine: false });
        expect(x.beamMode()).toBeNull();
      });
    }
  }
});

describe("pulse rates", () => {
  it("3.75 p/s is selectable and the dose rate follows the pulse rate", () => {
    expect(PCI_FLUORO_RATES).toContain(3.75);
    const kar = (pps: number) => {
      const x = lab();
      x.setFluoroRate(pps);
      expect(x.imagingControls().pulseRate).toBe(pps);
      x.setPedal({ fluoro: true, cine: false });
      run(x, 4);
      // the fluoroscopy time is the time the pedal was held, at any pulse rate (frames are taken at the
      // pulse rate; the beam time between frames is booked too)
      expect(x.lab.dose.totals.fluoroTimeS).toBeGreaterThan(3.8);
      expect(x.lab.dose.totals.fluoroTimeS).toBeLessThan(4.2);
      return x.lab.dose.totals.karMGy.total;
    };
    const k15 = kar(15);
    const k75 = kar(7.5);
    const k375 = kar(3.75);
    expect(k75 / k15).toBeGreaterThan(0.45);
    expect(k75 / k15).toBeLessThan(0.55);
    expect(k375 / k15).toBeGreaterThan(0.2);
    expect(k375 / k15).toBeLessThan(0.3);
  });

  it("frames are acquired at the rate in force, so a stored run's frames / fps is its real duration", () => {
    const x = lab();
    useSeriesStore.getState().clear();
    x.setCineRate(7.5);
    x.setFluoroRate(3.75);
    // 2 s of cine at 7.5 f/s
    x.setPedal({ fluoro: false, cine: true });
    run(x, 2);
    x.setPedal({ fluoro: false, cine: false });
    run(x, 1.5);
    const cine = useSeriesStore.getState().series.find((s) => s.kind === "cine")!;
    expect(cine.fps).toBe(7.5);
    expect(Math.abs(cine.frames.length / cine.fps - 2)).toBeLessThanOrEqual(1 / 7.5 + 1e-9);
    // 2 s of fluoroscopy at 3.75 p/s
    x.setPedal({ fluoro: true, cine: false });
    run(x, 2);
    x.setPedal({ fluoro: false, cine: false });
    const fl = x.storeFluoro()!;
    expect(fl.fps).toBe(3.75);
    expect(Math.abs(fl.frames.length / fl.fps - 2)).toBeLessThanOrEqual(1 / 3.75 + 1e-9);
    // a faster rate takes proportionally more frames over the same time
    const y = lab();
    y.setFluoroRate(15);
    y.setPedal({ fluoro: true, cine: false });
    run(y, 2);
    y.setPedal({ fluoro: false, cine: false });
    const f15 = y.storeFluoro()!;
    expect(Math.abs(f15.frames.length / 15 - 2)).toBeLessThanOrEqual(1 / 15 + 1e-9);
    expect(f15.frames.length).toBeGreaterThan(3 * fl.frames.length);
  });
});
