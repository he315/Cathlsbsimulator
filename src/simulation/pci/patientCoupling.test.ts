// pci-patient-coupling: the patient responds to the vessel actually treated, opacification follows coronary flow,
// hypotension has a hidden cause from the shared cause model, and arrhythmias come with a working defibrillator,
// CPR and a compression device. Driven through the PCI lab session (headless), as the lab runs it.
//   npx vitest run src/simulation/pci/patientCoupling.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { PciLabSession, pciFlowModsFor, policyForMode, deviceSizeFor, MP_PCI_ARREST, DEFIB_NO_PADS_TEXT } from "../../ui/pci/PciLabSession";
import { resolvePciLaunch } from "../../ui/pci/launch";
import { useSeriesStore } from "../../state/useSeriesStore";
import { contrastField, transportNet, type TransportMods } from "../../render/xray/contrastTransport";
import type { InjectionTrace } from "../injection";
import { setValve } from "./actions/devices";
import { seatGuide } from "./actions/guide";
import type { PciState } from "./state";
import type { LaunchMode } from "../../content/schema";
import { PCI_CAUSES, PCI_CASE_CAUSES, causeForVariant, pciHypotensionCause, timeToFirstAction } from "./hypotension";
import { engineLesionKey, injectionVfHazard, newCoronarySync, syncEngineCoronary, MP_PATIENT_COUPLING } from "./actions/patient";
import { pciTipContext } from "../../ui/lab/pciTips";
import { withRecognition } from "../../ui/lab/pciEvents/recognition";
import { liveLog } from "./actions/assessment";
import { MP_CPR_DEVICE } from "../../ui/pci/render/cpr";
import { engineFlowScale, MP_FLOW_SCALE_ENTER, MP_FLOW_SCALE_START_S } from "./patientBridge";
import { treeCentre } from "../../render/xray/sceneBuilder";
import type { CoronaryTree } from "../../render/xray/coronaryTree";
import type { Lesion } from "../../types";
import { classifyRightHeart, hypotensionCause } from "../patient/hypotensionCauses";
import { cprDevicePrims } from "../../ui/pci/render/cpr";
import type { LabEvent } from "../../content/lab/tips";
import { PRACTICE_INDEX, practiceForLesson } from "../../ui/content/practiceIndex";
import { launch as COUPLING_LAUNCH } from "../../content/practice/pci-patient-coupling.launch";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function lab(scenario: string, o: { start?: string; variant?: string; mode?: LaunchMode } = {}): PciLabSession {
  const mode = o.mode ?? "supervised";
  const r = resolvePciLaunch({ scenario, start: o.start ?? "wire-across", mode, ...(o.variant ? { variant: o.variant } : {}) });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true, mode, policy: policyForMode(mode) });
  sessions.push(x);
  return x;
}

function run(x: PciLabSession, seconds: number, dt = 0.1) {
  for (let t = 0; t < seconds - 1e-9; t += dt) x.step(dt);
}

/** An operator action through the session's gate (the consoles' path). */
function act(x: PciLabSession, name: string, f: (st: PciState) => PciState): boolean {
  return (x as unknown as { act(a: string, fn: (st: PciState) => PciState): boolean }).act(name, f);
}

/** The events the live tip drawer reads now (PciLab.tsx: the snapshot with the learner's recognitions). */
function liveEvents(x: PciLabSession): readonly LabEvent[] {
  return pciTipContext(withRecognition(x.snapshot())).events ?? [];
}

/** Run until one of the events is live (checked each second), up to `limitS`; the lab seconds it took, or null. */
function runUntilEvent(x: PciLabSession, events: readonly LabEvent[], limitS: number): number | null {
  for (let t = 1; t <= limitS; t++) {
    run(x, 1);
    if (liveEvents(x).some((e) => events.includes(e))) return t;
  }
  return null;
}

/** Supply of a territory now: the share of its regions' resting demand that their flow meets (0..1). */
function territorySupply(x: PciLabSession, territory: string): number {
  const regions = x.engine.flow.regions;
  const sup = x.engine.regionSupply();
  let need = 0;
  let met = 0;
  regions.forEach((r, i) => {
    if (r.territory !== territory || r.rv) return;
    need += r.demand;
    met += r.demand * (1 - (sup[i]?.deficit ?? 0));
  });
  return need > 0 ? met / need : 1;
}

/** Stent the target as the assisted console does: size, place, deploy at 14 atm, deflate. */
function stentTarget(x: PciLabSession) {
  const L = x.g.lesion;
  const { diameter, lengthMm } = deviceSizeFor(L.refDiameter, L.endMm - L.startMm);
  expect(x.loadDevice("stent", "semi-compliant", diameter, lengthMm)).toBe(true);
  x.advanceDevice(L.centreMm - x.st.device!.centreMm);
  x.setIndeflatorAtm(14);
  x.inflate();
  run(x, 1);
  x.deflate();
  run(x, 0.5);
  x.removeDevice();
}

/** A full-strength push of 3 mL/s for 1.5 s, sampled at 20 ms. */
function pushTrace(): InjectionTrace {
  const dt = 0.02;
  const n = Math.round(1.5 / dt);
  return { dt, q: Array(n).fill(3), c: Array(n).fill(1), pushStart: 0, pushEnd: 1.5, volumeMl: 4.5, contrastMl: 4.5, peakPsi: 40, side: "left", kind: "standard" } as unknown as InjectionTrace;
}

describe("physiology follows the treated lumen", () => {
  it("stenting the lcx-stemi culprit restores LCx territory supply within 60 s; without stenting it does not", () => {
    const untreated = lab("lcx-stemi");
    const treated = lab("lcx-stemi");
    run(untreated, 3);
    run(treated, 3);
    const before = territorySupply(treated, "LCx");
    expect(before).toBeLessThan(0.5);
    stentTarget(treated);
    expect(treated.st.stents.length).toBe(1);
    expect(treated.st.severity).toBeLessThan(30);
    // within 60 s the engine has taken the treated network and the territory is supplied again
    let restoredAt: number | null = null;
    for (let t = 0; t < 60; t += 1) {
      run(treated, 1);
      run(untreated, 1);
      // a reperfusion arrhythmia would stop all flow: shock it as an operator would
      if (treated.engine.rhythm.st.base === "vf") {
        treated.charge();
        run(treated, 6);
        treated.clearForShock();
        treated.shock();
      }
      if (restoredAt === null && treated.engine.rhythm.st.base !== "vf" && territorySupply(treated, "LCx") > 0.8) restoredAt = t + 1;
    }
    expect(restoredAt).not.toBeNull();
    expect(restoredAt!).toBeLessThanOrEqual(60);
    expect(treated.st.log.some((r) => r.kind === "engine-network")).toBe(true);
    // the engine's own lesion follows the treated lumen
    expect(treated.engine.lesions.find((l) => l.vessel === "LCx")!.severity).toBeLessThan(30);
    // without a stent the territory stays starved
    expect(territorySupply(untreated, "LCx")).toBeLessThan(0.5);
    expect(untreated.engine.lesions.find((l) => l.vessel === "LCx")!.severity).toBeGreaterThanOrEqual(99);
  });

  it("nothing is pushed into the engine while the stent balloon is inflated", () => {
    const x = lab("lcx-stemi");
    const L = x.g.lesion;
    const { diameter, lengthMm } = deviceSizeFor(L.refDiameter, L.endMm - L.startMm);
    x.loadDevice("stent", "semi-compliant", diameter, lengthMm);
    x.advanceDevice(L.centreMm - x.st.device!.centreMm);
    x.setIndeflatorAtm(14);
    x.inflate();
    run(x, 3);
    expect(x.st.device?.inflated).toBe(true);
    expect(x.st.log.some((r) => r.kind === "engine-network")).toBe(false);
    x.deflate();
    run(x, 3);
    expect(x.st.log.some((r) => r.kind === "engine-network")).toBe(true);
  });
});

describe("contrast follows the engine's flow", () => {
  it("with engine.forceRhythm('vf') pciFlowMods flowScale < 0.2 and the contrast front advances slower", () => {
    const x = lab("lad-focal");
    run(x, 2);
    const rest = pciFlowModsFor(x);
    // at rest nothing is added: the transport runs on resting flows, as before
    expect(rest.flowScale).toBeUndefined();
    x.engine.forceRhythm("vf", "test");
    run(x, 2);
    const vf: TransportMods = pciFlowModsFor(x);
    expect(vf.flowScale).toBeDefined();
    const scales = Object.values(vf.flowScale!);
    expect(scales.length).toBeGreaterThan(0);
    for (const v of scales) expect(v).toBeLessThan(0.2);
    // the front: the distal LAD's transit time is longer and less contrast has reached it 3 s after the press
    const lesions = [{ vessel: x.s.target.vessel, position: x.s.target.position, severity: x.st.severity, kind: x.s.target.kind, lengthMm: x.s.target.lengthMm }];
    const netRest = transportNet(x.drawTree, lesions, rest);
    const netVf = transportNet(x.drawTree, lesions, vf);
    const lad = (n: typeof netRest) => n.vessels.get("LAD")!.theta;
    const iDist = lad(netRest).length - 1;
    expect(lad(netVf)[iDist]).toBeGreaterThan(3 * lad(netRest)[iDist]);
    // the time the front (half strength) reaches a sample 60% down the LAD at rest's transit, after the press
    const mid = Math.floor(iDist * 0.6);
    const arrival = (net: typeof netRest) => {
      const th = lad(net)[mid];
      for (let t = 0.1; t <= 6; t += 0.1) if (contrastField({ net, side: "left", trace: pushTrace(), t, phase: 0.3, rr: 0.85 }).at(th) >= 0.5) return t;
      return Infinity;
    };
    const tRest = arrival(netRest);
    expect(tRest).toBeLessThan(3);
    expect(arrival(netVf)).toBeGreaterThan(tRest + 0.5);
    // compressions bring flow back
    x.startCpr();
    run(x, 3);
    const cpr = pciFlowModsFor(x);
    const back = cpr.flowScale ? Math.min(...Object.values(cpr.flowScale)) : 1;
    expect(back).toBeGreaterThan(0.5);
  });

  it("no flow scale while the guide settles at the start of lad-focal wire-across (its brief wedge is not passed)", () => {
    const x = lab("lad-focal");
    for (let t = 0; t < 2 - 1e-9; t += 0.1) {
      x.step(0.1);
      expect(pciFlowModsFor(x).flowScale, `t ${t.toFixed(1)} s`).toBeUndefined();
    }
    expect(MP_FLOW_SCALE_START_S).toBeLessThan(2);
  });

  it("lcx-stemi in steady sinus rhythm: the flow scale record changes at most once over 20 s", () => {
    const x = lab("lcx-stemi");
    run(x, 2);
    let last = JSON.stringify(pciFlowModsFor(x).flowScale ?? null);
    let changes = 0;
    for (let t = 0; t < 20 - 1e-9; t += 0.1) {
      x.step(0.1);
      expect(x.engine.rhythm.st.base).toBe("sinus");
      const now = JSON.stringify(pciFlowModsFor(x).flowScale ?? null);
      if (now !== last) changes++;
      last = now;
    }
    expect(changes).toBeLessThanOrEqual(1);
  });

  it("engineFlowScale: a trunk enters at the deadband and one step, holds its value within a step, and leaves below the deadband", () => {
    const tree = { vessels: [{ name: "LM", parent: null }, { name: "LAD", parent: { name: "LM" } }] };
    const port = (v: number) => ({ coronaryFlowScale: () => v });
    // at the deadband's edge nothing is passed
    expect(engineFlowScale(port(1.13), tree)).toBeUndefined();
    expect(engineFlowScale(port(0.87), tree)).toBeUndefined();
    const a = engineFlowScale(port(1 + MP_FLOW_SCALE_ENTER), tree)!;
    expect(a).toEqual({ LM: 1.15, LAD: 1.15 });
    // a wander within a step keeps the held value
    expect(engineFlowScale(port(1.11), tree, a)).toEqual(a);
    // a whole step from the held value is re-quantised
    expect(engineFlowScale(port(1.25), tree, a)).toEqual({ LM: 1.25, LAD: 1.25 });
    // below the deadband the trunk is dropped
    expect(engineFlowScale(port(1.08), tree, a)).toBeUndefined();
    // a large change passes at once
    expect(engineFlowScale(port(0.05), tree)).toEqual({ LM: 0.05, LAD: 0.05 });
  });
});

describe("hypotension with a hidden cause", () => {
  it("the PCI causes are in the shared cause model, each with its signature, waveform and last manoeuvre", () => {
    for (const c of PCI_CAUSES) {
      expect(hypotensionCause(c.id), c.id).toBe(c);
      expect(c.waveform.length, c.id).toBeGreaterThan(0);
      expect(c.lastManoeuvre.length, c.id).toBeGreaterThan(0);
      expect(c.signature.rate, c.id).toBeDefined();
    }
    expect(pciHypotensionCause("cusp-open")!.guides).toEqual(["AL", "EBU"]);
    expect(causeForVariant("hypotension-valve-open")).toBe("valve-open");
    expect(causeForVariant("hypotension-tamponade")).toBe("tamponade");
    expect(causeForVariant("pci-lad-focal~L3")).toBeNull();
    // the hidden one is drawn from the run's generator, the same draw giving the same cause
    expect(causeForVariant("hypotension-unknown", () => 0.0)).toBe(causeForVariant("hypotension-unknown", () => 0.0));
  });

  it("a 'valve-open' cause resolves on setValve(false), with the onset and the first action recorded", () => {
    const x = lab("lad-focal", { variant: "hypotension-valve-open" });
    expect(x.pendingHiddenCause()).toBe("valve-open");
    run(x, MP_PCI_ARREST.causeOnsetS + 2);
    expect(x.hiddenCause()).toBe("valve-open");
    expect(x.st.valveOpen).toBe(true);
    run(x, 3);
    // the line reads the open valve: no arterial pressure on the monitor while the patient's own is unchanged
    const v = x.engine.vitals();
    expect(v.tipState).toBe("open");
    expect(v.art).toBeNull();
    expect(v.aortaTrue.mean).toBeGreaterThan(65);
    expect(x.episodes).toHaveLength(1);
    expect(x.episodes[0].firstAction).toBeNull();
    // the learner closes the valve
    expect(act(x, "load-device", (st) => setValve(st, false))).toBe(true);
    run(x, 1);
    expect(x.hiddenCause()).toBeNull();
    const ep = x.episodes[0];
    expect(ep.resolvedT).not.toBeNull();
    expect(ep.firstAction?.action).toBe("load-device");
    expect(timeToFirstAction(ep)!).toBeGreaterThan(0);
    run(x, 3);
    expect(x.engine.vitals().art).not.toBeNull();
    expect(x.engine.vitals().art!.mean).toBeGreaterThan(x.engine.vitals().aortaTrue.mean - 15);
    expect(x.st.log.some((r) => r.kind === "hypotension-resolved" && r.data.cause === "valve-open")).toBe(true);
    // the cause is never named on the live log
    expect(x.st.events.some((e) => /valve/i.test(e.text) && /cause|hypotension/i.test(e.text))).toBe(false);
  });

  it("a 'tamponade' cause shows pulsus paradoxus > 10 mmHg and responds to pericardiocentesis", () => {
    const x = lab("lad-focal", { variant: "hypotension-tamponade" });
    const map0 = x.engine.vitals().aortaTrue.mean;
    const pp0 = x.pulsusParadoxus();
    expect(pp0).toBeLessThan(10);
    let pulsus = 0;
    for (let t = 0; t < 320 && x.engine.vitals().aortaTrue.mean > map0 - 30; t += 5) {
      run(x, 5);
      pulsus = Math.max(pulsus, x.pulsusParadoxus());
    }
    expect(x.hiddenCause()).toBe("tamponade");
    expect(pulsus).toBeGreaterThan(10);
    const low = x.engine.vitals().aortaTrue.mean;
    expect(low).toBeLessThan(map0 - 20);
    const drained = x.pericardiocentesis();
    expect(drained).toBeGreaterThan(20);
    run(x, 60);
    expect(x.engine.vitals().pericardialMl).toBeLessThan(20);
    expect(x.engine.vitals().aortaTrue.mean).toBeGreaterThan(low + 15);
    expect(x.hiddenCause()).toBeNull();
    expect(x.episodes[0].firstAction?.action).toBe("pericardiocentesis");
  });

  it("a 'vasovagal' cause shows HR < 50", () => {
    const x = lab("lad-focal", { variant: "hypotension-vagal" });
    run(x, MP_PCI_ARREST.causeOnsetS + 1);
    expect(x.hiddenCause()).toBe("vagal");
    let minHr = Infinity;
    for (let t = 0; t < 70; t += 2) {
      run(x, 2);
      minHr = Math.min(minHr, x.engine.vitals().hr!);
    }
    expect(minHr).toBeLessThan(50);
  });

  it("a guide holding the cusp open lowers the pressure, which recovers when the guide is pulled back", () => {
    const x = lab("lad-focal", { variant: "hypotension-cusp-open" });
    run(x, 6);
    const map0 = x.engine.vitals().aortaTrue.mean;
    run(x, MP_PCI_ARREST.causeOnsetS);
    expect(x.hiddenCause()).toBe("cusp-open");
    run(x, 20);
    const low = x.engine.vitals().aortaTrue.mean;
    expect(low).toBeLessThan(map0 - 10);
    act(x, "engage-guide", (st) => seatGuide(st, -(st.guide.depthMm - 0.5), x.s, x.g));
    run(x, 20);
    expect(x.hiddenCause()).toBeNull();
    expect(x.engine.vitals().aortaTrue.mean).toBeGreaterThan(low + 8);
  });

  it("contrast in the guide damps the trace until the guide is flushed", () => {
    const x = lab("lad-focal", { variant: "hypotension-contrast-in-guide" });
    run(x, MP_PCI_ARREST.causeOnsetS + 3);
    expect(x.hiddenCause()).toBe("contrast-in-guide");
    expect(x.flushGuide()).toBe(true);
    run(x, 1);
    expect(x.hiddenCause()).toBeNull();
    expect(x.episodes[0].firstAction?.action).toBe("flush-guide");
  });
});

describe("arrhythmias, the defibrillator and arrest", () => {
  it("vf-reperfusion: opening the occluded circumflex brings VF, which an unsynchronised high-energy shock ends", () => {
    const x = lab("lcx-stemi", { variant: "vf-reperfusion" });
    expect(x.defib.pads).toBe(true);
    run(x, 2);
    stentTarget(x);
    for (let t = 0; t < 10 && x.engine.rhythm.st.base !== "vf"; t++) run(x, 1);
    expect(x.engine.rhythm.st.base).toBe("vf");
    expect(x.arrhythmias[x.arrhythmias.length - 1]?.trigger).toMatch(/reperfusion/);
    // synchronised mode does not discharge in VF and keeps the charge
    x.setDefibSync(true);
    x.charge();
    run(x, 6);
    expect(x.defibReadout().charged).toBe(200);
    expect(x.shock()).toBe("no-change");
    expect(x.defibReadout().charged).toBe(200);
    // unsynchronised at 200 J
    x.setDefibSync(false);
    x.clearForShock();
    expect(x.shock()).toBe("converted");
    expect(x.engine.rhythm.st.base).not.toBe("vf");
  });

  it("vf-refractory: the first shocks fail whatever their energy", () => {
    const x = lab("lcx-stemi", { variant: "vf-refractory" });
    run(x, 2);
    stentTarget(x);
    for (let t = 0; t < 10 && x.engine.rhythm.st.base !== "vf"; t++) run(x, 1);
    expect(x.engine.rhythm.st.base).toBe("vf");
    for (let i = 0; i < MP_PCI_ARREST.refractoryShocks; i++) {
      x.charge();
      run(x, 6);
      x.clearForShock();
      expect(x.shock()).toBe("still-vf");
    }
    run(x, 0.1);
    expect(x.defibReadout().shocks).toBe(MP_PCI_ARREST.refractoryShocks);
  });

  it("without pads nothing is delivered; pads take a few seconds to apply", () => {
    const x = lab("lad-focal");
    expect(x.defib.pads).toBe(false);
    x.engine.forceRhythm("vf", "test");
    x.charge();
    run(x, 6);
    expect(liveLog(x.st).some((e) => e.text === DEFIB_NO_PADS_TEXT)).toBe(false);
    expect(x.shock()).toBe("no-pads");
    // the defibrillator says so on the live log, whichever control pressed Shock
    expect(liveLog(x.st).some((e) => e.text === DEFIB_NO_PADS_TEXT)).toBe(true);
    expect(x.defibReadout().charged).toBeGreaterThan(0);
    x.setPads(true);
    expect(x.defib.pads).toBe(false);
    run(x, MP_PCI_ARREST.padsApplyS + 0.5);
    expect(x.defib.pads).toBe(true);
    x.clearForShock();
    expect(["converted", "still-vf", "asystole"]).toContain(x.shock());
  });

  it("arrest-wire-across: VF early, compressions, then the device with a short pause; the piston is drawn and moves", () => {
    const x = lab("lcx-stemi", { variant: "arrest-wire-across" });
    run(x, MP_PCI_ARREST.arrestOnsetS + 1);
    expect(x.engine.rhythm.st.base).toBe("vf");
    expect(x.tipContext().phase).toBe("complication");
    x.startCpr();
    expect(x.engine.rhythm.st.cpr).toBe(true);
    expect(x.cprDrawState(0)).toBeNull();
    x.fitCompressionDevice();
    expect(x.cpr).toBe("fitting");
    expect(x.engine.rhythm.st.cpr).toBe(false);
    run(x, MP_PCI_ARREST.deviceFitPauseS + 0.5);
    expect(x.cpr).toBe("mechanical");
    expect(x.engine.rhythm.st.cpr).toBe(true);
    // the device is drawn over the lower sternum, and the pad moves with the compressions
    const depths = [0, 0.1, 0.2, 0.3, 0.4, 0.5].map((dt) => x.cprDrawState(x.engine.time + dt)!.depthMm);
    expect(Math.max(...depths) - Math.min(...depths)).toBeGreaterThan(20);
    const c = x.cprDrawState(x.engine.time)!;
    expect(Math.abs(c.skin.x)).toBeLessThan(1);
    // ... over the heart (the lower sternum over the cardiac silhouette), not at the top edge of the field
    expect(Math.abs(c.skin.y - treeCentre(x.drawTree, "both").y)).toBeLessThan(40);
    const prims = cprDevicePrims(c);
    expect(prims.tubes.length).toBeGreaterThan(0);
    expect(prims.bones.length).toBeGreaterThan(0);
    // the scene of a PA frame carries the device's primitives: the piston (its own attenuation) among the bones
    const piston = (y: PciLabSession) => y.sceneFor("fluoro", { frame: 1 }, null).scene.bones.filter((b) => b.mu === MP_CPR_DEVICE.pistonMu);
    expect(piston(x).length).toBeGreaterThan(0);
    // ... and its support arch crosses the field
    expect(x.sceneFor("fluoro", { frame: 2 }, null).scene.tubes.some((t) => t.mu[0] === MP_CPR_DEVICE.archMu)).toBe(true);
    // with compressions stopped the device comes off: nothing of it is drawn
    x.stopCpr();
    expect(x.cpr).toBe("off");
    expect(piston(x)).toHaveLength(0);
  });

  it("an injection through a damped left guide can bring VF (seeded hazard), recorded with its trigger", () => {
    let fired = 0;
    for (let k = 0; k < 40 && fired === 0; k++) {
      const x = lab("lad-focal", { variant: `pci-hazard-${k}` });
      act(x, "advance-device", (st) => seatGuide(st, 5.6 - st.guide.depthMm, x.s, x.g));
      run(x, 2);
      if (!["damped", "ventricularised", "wedged"].includes(x.engine.vitals().tipState)) continue;
      x.inject({ kind: "puff" });
      run(x, 1);
      if (x.arrhythmias.some((a) => /damped/.test(a.trigger))) fired++;
    }
    expect(fired).toBeGreaterThan(0);
  });
});

describe("practice links", () => {
  it("practiceIndex lists lad-focal and lcx-stemi under the hypotension, arrhythmia and lab-arrest lessons", () => {
    const FILE = /pci-patient-coupling\.launch\.ts$/;
    const under = (lesson: string) => practiceForLesson(lesson, PRACTICE_INDEX).filter((e) => e.sim === "angio-pci" && FILE.test(e.source));
    expect(under("cm-patient-complications-hypotension").map((e) => e.scenario)).toEqual(["lad-focal"]);
    expect(under("cm-patient-complications-hypotension")[0].params).toMatchObject({ scenario: "lad-focal", variant: "hypotension-unknown", mode: "supervised" });
    expect(under("cm-patient-complications-arrhythmia").map((e) => e.scenario)).toEqual(["lcx-stemi"]);
    expect(under("cp-complex-patients-lab-arrest").map((e) => e.scenario)).toEqual(["lcx-stemi", "lcx-stemi"]);
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("pci-patient-coupling"))).toEqual([]);
    for (const l of COUPLING_LAUNCH.links ?? []) {
      const r = resolvePciLaunch({ scenario: l.scenario!, start: l.start!, variant: l.variant!, mode: l.mode ?? "guided" });
      expect(r.problems).toEqual([]);
      expect(r.launch!.start.id).toBe("wire-across");
    }
  });
});

describe("each hidden cause gives a fall the lab recognises (the live drawer's events)", () => {
  // false readings change the guide's trace ('pressure-damped'); true causes bring the displayed pressure down
  // ('hypotension'); each within a bounded time of the run's start (the cause starts at MP_PCI_ARREST.causeOnsetS)
  const CASES: [cause: string, events: LabEvent[], limitS: number][] = [
    ["guide-damping", ["pressure-damped"], 30],
    ["deep-engagement", ["pressure-damped", "pressure-ventricularised"], 30],
    ["contrast-in-guide", ["pressure-damped"], 30],
    ["thrombus-in-guide", ["pressure-damped"], 30],
    ["cusp-open", ["hypotension"], 60],
    ["vagal", ["hypotension"], 90],
    ["gtn-pde5", ["hypotension"], 60],
    ["verapamil", ["hypotension"], 60],
    ["tamponade", ["hypotension"], 300],
    ["bleeding", ["hypotension"], 420],
  ];
  for (const [cause, events, limitS] of CASES) {
    it(`'${cause}' raises ${events.join(" or ")} within ${limitS} s`, () => {
      const x = lab("lad-focal", { variant: `hypotension-${cause}` });
      run(x, MP_PCI_ARREST.causeOnsetS - 1);
      // before the cause, the trace is aortic and the pressure normal
      expect(liveEvents(x).filter((e) => e === "hypotension" || e === "pressure-damped")).toEqual([]);
      const at = runUntilEvent(x, events, limitS);
      expect(x.hiddenCause()).toBe(cause);
      expect(at, `${cause}: no ${events.join("/")} within ${limitS} s`).not.toBeNull();
      // the cause is never named among the events (tamponade is a patient event the monitor and echo show)
      if (cause !== "tamponade") expect(liveEvents(x)).not.toContain(cause as LabEvent);
    });
  }

  it("'valve-open' flattens the trace: the line shows no pressure and the drawer's context reads 'noisy' (no pressure signal)", () => {
    const x = lab("lad-focal", { variant: "hypotension-valve-open" });
    run(x, MP_PCI_ARREST.causeOnsetS - 1);
    expect(pciTipContext(withRecognition(x.snapshot())).pressure).toBe("aortic");
    run(x, 5);
    expect(x.hiddenCause()).toBe("valve-open");
    expect(x.engine.vitals().art).toBeNull();
    expect(pciTipContext(withRecognition(x.snapshot())).pressure).toBe("noisy");
  });

  it("a false reading leaves the patient's own pressure as it was: the damped trace classes as damped, the patient's mean is unchanged", () => {
    for (const cause of ["contrast-in-guide", "thrombus-in-guide"]) {
      const x = lab("lad-focal", { variant: `hypotension-${cause}` });
      run(x, MP_PCI_ARREST.causeOnsetS - 1);
      const true0 = x.engine.vitals().aortaTrue.mean;
      const pulse0 = x.engine.vitals().art!.sys - x.engine.vitals().art!.dia;
      run(x, 20);
      const v = x.engine.vitals();
      expect(v.tipState, cause).toBe("damped");
      expect(v.art!.sys - v.art!.dia, cause).toBeLessThan(0.5 * pulse0);
      expect(Math.abs(v.aortaTrue.mean - true0), cause).toBeLessThan(5);
      // the injection hazard follows the tip itself, which is free: the physical class is still aortic
      expect(x.engine.physicalTipState(), cause).toBe("aortic");
    }
    // flushing clears the contrast and the trace comes back
    const y = lab("lad-focal", { variant: "hypotension-contrast-in-guide" });
    run(y, MP_PCI_ARREST.causeOnsetS + 20);
    expect(liveEvents(y)).toContain("pressure-damped");
    y.flushGuide();
    run(y, 5);
    expect(y.engine.vitals().tipState).toBe("aortic");
    expect(liveEvents(y)).not.toContain("pressure-damped");
  });

  it("a low pressure whose right heart numbers show pump failure (cardiac, low output) raises 'cardiogenic-shock'", () => {
    // the vagal reaction's slow heart: the shared right heart read-out classes its low output as cardiac
    // (read through the session's tip context: the drawer's pciTipContext has no source for this lab event yet,
    // pci-tip-context's pciEvents/base.ts; reported out of scope)
    const x = lab("lad-focal", { variant: "hypotension-vagal" });
    const events = () => x.tipContext().events ?? [];
    let seenPattern = false;
    for (let t = 0; t < 180 && !events().includes("cardiogenic-shock"); t++) {
      run(x, 1);
      const p = classifyRightHeart(x.engine.rightHeart(), x.engine.profile, x.engine.vitals().hr ?? null);
      if (p.mechanism === "cardiac" && p.output === "low") seenPattern = true;
      // never before the pressure is low
      if (!events().includes("hypotension")) expect(events()).not.toContain("cardiogenic-shock");
    }
    expect(seenPattern).toBe(true);
    expect(events()).toContain("cardiogenic-shock");
    expect(events()).toContain("hypotension");
  });

  it("the cusp cause needs an Amplatz or an EBU: on another guide it waits, and an 'unknown' draw leaves it out", () => {
    // every draw on a JL guide is a cause that can start on it
    for (let k = 0; k < 40; k++) {
      const c = causeForVariant("hypotension-unknown", () => k / 40, "JL");
      expect(c).not.toBe("cusp-open");
      expect(PCI_CASE_CAUSES).toContain(c);
    }
    expect(causeForVariant("hypotension-unknown", () => PCI_CASE_CAUSES.indexOf("cusp-open") / PCI_CASE_CAUSES.length + 1e-6, "EBU")).toBe("cusp-open");
    // the cause's own start: an engaged JL is not an Amplatz or an EBU
    const cusp = pciHypotensionCause("cusp-open")!;
    let ar: number | null | undefined;
    const port = {
      lab: { guideEngaged: () => true, guideDepthMm: () => 2, seatGuide: () => undefined, guideFamily: () => "JL" },
      setAorticRegurgitation: (s: number | null) => (ar = s),
    };
    expect(cusp.start(port as never)).toBeNull();
    expect(ar).toBeUndefined();
    port.lab.guideFamily = () => "AL";
    expect(cusp.start(port as never)).not.toBeNull();
    expect(ar).toBeGreaterThan(0);
  });
});

describe("the coupling's hazards and the network sync", () => {
  it("contrast held up at an aorto-ostial stenosis can bring VF; a guide out of the ostium cannot", () => {
    const P = MP_PATIENT_COUPLING;
    expect(injectionVfHazard({ side: "left", tipState: "aortic", engaged: true, ostialStenosis: 0.6 }, () => 0)).toBe("contrast held up at an ostial lesion");
    expect(injectionVfHazard({ side: "right", tipState: "aortic", engaged: true, ostialStenosis: P.ostialHoldUpStenosis }, () => 0)).toBe("contrast held up at an ostial lesion");
    expect(injectionVfHazard({ side: "left", tipState: "aortic", engaged: false, ostialStenosis: 0.6 }, () => 0)).toBeNull();
    expect(injectionVfHazard({ side: "left", tipState: "aortic", engaged: true, ostialStenosis: 0.3 }, () => 0)).toBeNull();
    expect(injectionVfHazard({ side: "left", tipState: "aortic", engaged: true, ostialStenosis: 0.6 }, () => 0.99)).toBeNull();
    expect(injectionVfHazard({ side: "left", tipState: "damped", engaged: true, ostialStenosis: 0 }, () => 0)).toBe("injection through a damped guide");
  });

  it("the sync starts from the engine's own network: a start whose lumen differs from the case's lesions is pushed within 2 s", () => {
    const x = lab("lcx-stemi");
    const caseSev = x.engine.lesions.find((l) => l.vessel === "LCx")!.severity;
    expect(caseSev).toBeGreaterThanOrEqual(99);
    // a predilated start: the lab's lumen already open before its first step
    (x as unknown as { _st: PciState })._st = { ...x.st, severity: 40 };
    let at: number | null = null;
    for (let t = 0.5; t <= 2 + 1e-9 && at === null; t += 0.5) {
      run(x, 0.5);
      if (x.engine.lesions.find((l) => l.vessel === "LCx")!.severity <= 40) at = t;
    }
    expect(at).not.toBeNull();
    // the unit: the sync's key is the engine's network, not the start's lumen; a start that is already open is
    // not a reperfusion by the lab (the target severity it starts from is the start's)
    const ls: Lesion[] = [...x.engine.lesions];
    const caseLs: Lesion[] = ls.map((l) => (l.vessel === "LCx" ? { ...l, severity: 99 } : l));
    const m0 = newCoronarySync(caseLs, 40);
    expect(m0.key).toBe(engineLesionKey(caseLs));
    const port = { setCoronaryTree: () => undefined };
    const st40 = { ...x.st, severity: 40 };
    const m1 = syncEngineCoronary(port, m0, caseLs, x.s, x.g, st40, x.drawTree, 0).mem;
    const r = syncEngineCoronary(port, m1, caseLs, x.s, x.g, st40, x.drawTree, 1.1);
    expect(r.applied).toBe(true);
    expect(r.reperfused).toBe(false);
  });

  it("the rebuilt network keeps the occlusions other callers set", () => {
    const x = lab("lcx-stemi");
    run(x, 1);
    x.engine.setOcclusion("air-embolism", { vessel: "LAD", param: 0.5, fraction: 0.6 });
    const calls: { keep: boolean }[] = [];
    const port = { setCoronaryTree: (_t: CoronaryTree | null, _l?: Lesion[], o?: { keepOcclusions?: boolean }) => calls.push({ keep: !!o?.keepOcclusions }) };
    const st = { ...x.st, severity: 20 };
    let mem = newCoronarySync(x.engine.lesions, x.st.severity);
    mem = syncEngineCoronary(port, mem, x.engine.lesions, x.s, x.g, st, x.drawTree, 0).mem;
    const r = syncEngineCoronary(port, mem, x.engine.lesions, x.s, x.g, st, x.drawTree, 1.1);
    expect(r.applied).toBe(true);
    expect(calls).toEqual([{ keep: true }]);
    // through the session: stenting rebuilds the engine's network and the air embolus is still there
    stentTarget(x);
    for (let t = 0; t < 5 && !x.st.log.some((q) => q.kind === "engine-network"); t++) run(x, 1);
    expect(x.st.log.some((q) => q.kind === "engine-network")).toBe(true);
    const occ = (x.engine as unknown as { occlusions: Record<string, unknown> }).occlusions;
    expect(Object.keys(occ)).toContain("air-embolism");
  });

  it("the transport's flow conditions are read once per supply update and kept as the same object", () => {
    const x = lab("lad-focal");
    run(x, 2);
    const a = pciFlowModsFor(x);
    expect(pciFlowModsFor(x)).toBe(a);
    x.engine.forceRhythm("vf", "test");
    run(x, 2);
    const b = pciFlowModsFor(x);
    expect(b).not.toBe(a);
    expect(b.flowScale).toBeDefined();
    expect(pciFlowModsFor(x)).toBe(b);
    // the engine's own read-out is cached per supply update too
    const v = Object.keys(b.flowScale!)[0];
    const s1 = x.engine.coronaryFlowScale(v);
    expect(x.engine.coronaryFlowScale(v)).toBe(s1);
  });

  it("intracoronary adenosine into the RCA in the PCI lab: AV block, then atrial fibrillation (the lab's adenosine hazards)", () => {
    const x = lab("rca-calcified");
    // the lab turns the hazard model on
    expect(x.engine.adenosineHazards()).not.toBeNull();
    x.engine.setAdenosineHazards({ force: "af" });
    expect(x.engine.giveDrug("adenosine", 200, "ic", { side: "right", vessel: "RCA" }).ok).toBe(true);
    let block = -1;
    let af = -1;
    for (let i = 1; i <= 300 && af < 0; i++) {
      run(x, 0.1);
      const v = x.engine.vitals();
      if (block < 0 && (v.av ?? 0) >= 1) block = i;
      if (v.rhythmKind === "af") af = i;
    }
    expect(block).toBeGreaterThan(0);
    expect(af).toBeGreaterThan(0);
    expect(block).toBeLessThanOrEqual(af);
  });
});
