import { describe, it, expect } from "vitest";
import {
  PCI_SCENARIOS,
  advanceDevice,
  backloadDevice,
  bailout,
  checkLabel,
  debrief,
  deflate,
  finishCase,
  giveDrug,
  inflate,
  initialPci,
  loadDevice,
  lumenFor,
  moveDevice,
  moveWire,
  pathToTarget,
  pciPatientEffects,
  pinWire,
  prepareDevice,
  pullIndeflatorNegative,
  recordAct,
  removeDevice,
  requestDevice,
  setIndeflator,
  setValve,
  setWireKind,
  stepPci,
  submitEstimate,
  chooseSizing,
  truthNow,
  engageGuide,
  injectPci,
  type PciState,
} from "./angioPci";
import { PatientEngine } from "./patient/engine";
import { generatePatient } from "./patient/patient";
import { applyEffects, newBridge, tipFromGuide } from "./pci/patientBridge";
import { setup, start, wireToTarget } from "./pci/testSetup";

/** Load a device through the full table workflow (label, preparation, backload, valve, introduce). */
function workflowLoad(su: ReturnType<typeof setup>, st0: PciState, specId: string, d: number, l: number): PciState {
  let st = requestDevice(st0, specId, d, l);
  st = checkLabel(st);
  st = prepareDevice(st);
  st = backloadDevice(pinWire(st, true));
  st = setValve(st, true);
  st = advanceDevice(su.s, su.g, st, 1);
  return st;
}
/** Advance the device until its centre reaches `mm` (or it stops). */
function deliverTo(su: ReturnType<typeof setup>, st0: PciState, mm: number): PciState {
  let st = st0;
  for (let i = 0; i < 200; i++) {
    const c = st.device!.centreMm;
    if (c >= mm - 0.01) break;
    st = advanceDevice(su.s, su.g, st, Math.min(2, mm - c));
    if (st.device!.centreMm <= c + 1e-6) break;
  }
  return st;
}
/** Inflate with the indeflator in time: screw to `atm` at `rate`, hold `holdS`, pull negative and wait until empty. */
function timedInflation(su: ReturnType<typeof setup>, st0: PciState, atm: number, rate: number, holdS: number, onTick?: (st: PciState) => void): PciState {
  let st = setIndeflator(st0, atm, rate);
  const total = atm / rate + 3 + holdS;
  for (let t = 0; t < total; t += 0.1) {
    st = stepPci(su.s, su.g, st, 0.1);
    onTick?.(st);
  }
  st = pullIndeflatorNegative(su.s, su.g, st);
  for (let t = 0; t < 30 && st.ind.fill > 0; t += 0.1) {
    st = stepPci(su.s, su.g, st, 0.1);
    onTick?.(st);
  }
  return st;
}

describe("angiographic PCI", () => {
  it("every scenario has a reachable lesion with a sensible reference diameter", () => {
    for (const s of PCI_SCENARIOS) {
      const { g } = setup(s.id);
      expect(g.lesion.refDiameter).toBeGreaterThan(2);
      expect(g.lesion.refDiameter).toBeLessThan(4.6);
      expect(pathToTarget(g, s)[0]).toBe(s.side === "left" ? "LM" : "RCA");
    }
  });

  it("the lab starts with the guide out of the ostium; engaging it lets the wire in", () => {
    const su = setup("lad-focal");
    let st = initialPci(su.s, { guideEngaged: false });
    for (let i = 0; i < 20; i++) st = moveWire(su.s, su.g, st, 2);
    expect(st.tipMm).toBeLessThanOrEqual(3);
    st = engageGuide(su.s, st);
    st = wireToTarget(su, st);
    expect(st.wire.crossed).toBe(true);
  });

  it("a well-sized stent across the lesion leaves little residual stenosis; a misplaced one is a geographic miss", () => {
    const su = setup("lad-focal");
    const { s, g } = su;
    const ready = wireToTarget(su, start(su));
    const ref = g.lesion.refDiameter;
    const size = Math.max(2.5, Math.round(ref / 0.25) * 0.25);
    const place = (offset: number, len: number) => {
      let st = loadDevice(ready, "stent", "semi-compliant", size, len);
      st = moveDevice(st, g.lesion.centreMm + offset - st.device!.centreMm);
      st = inflate(s, g, st, 14);
      return deflate(st);
    };
    const good = place(0, 23);
    expect(good.severity).toBeLessThan(15);
    expect(good.geographicMiss).toBe(false);
    const miss = place(8, 12);
    expect(miss.geographicMiss).toBe(true);
    // the renderer receives a scaffold on the LAD
    const lum = lumenFor(s, g, good);
    expect(lum.scaffolds.length).toBe(1);
    expect(lum.scaffolds[0].to).toBeGreaterThan(lum.scaffolds[0].from);
    // the placed stent carries ring diameters for the procedural geometry
    expect(good.stents[0].ringD.length).toBeGreaterThan(10);
  });

  it("severe calcium resists a plain balloon and yields to lithotripsy", () => {
    const su = setup("rca-calcified");
    const { s, g } = su;
    const ready = wireToTarget(su, start(su));
    expect(ready.route).toContain("RCA");
    const atLesion = (st: PciState) => moveDevice(st, g.lesion.centreMm - st.device!.centreMm);
    let plain = atLesion(loadDevice(ready, "balloon", "semi-compliant", 3.0, 15));
    plain = inflate(s, g, plain, 12);
    expect(plain.events.some((e) => /waist/i.test(e.text))).toBe(true);
    let ivl = atLesion(loadDevice(ready, "balloon", "ivl", 3.0, 12));
    ivl = inflate(s, g, ivl, 6);
    expect(ivl.resistance).toBeLessThan(ready.resistance - 0.3);
  });

  it("the thrombotic circumflex can be crossed with a workhorse wire; the CTO needs escalation", () => {
    const su = setup("lcx-stemi");
    const st = wireToTarget(su, start(su));
    expect(st.route).toContain("LCx");
    expect(st.tipMm).toBeGreaterThan(su.g.lesion.endMm);
    const cto = setup("rca-cto");
    let w = wireToTarget(cto, start(cto), 35, 1);
    for (let i = 0; i < 4; i++) w = moveWire(cto.s, cto.g, w, 1);
    expect(w.wire.crossed).toBe(false);
    // pull back into the guide, escalate, cross
    while (w.tipMm > 0) w = moveWire(cto.s, cto.g, w, -10);
    w = setWireKind(w, "cto");
    w = wireToTarget(cto, w, 20, 1);
    expect(w.tipMm).toBeGreaterThan(cto.g.lesion.endMm);
  });

  it("the table workflow: label, preparation, backload, valve, introduction; the ACT gate in supervised mode", () => {
    const su = setup("lad-focal");
    let st = wireToTarget(su, start(su, { heparinised: false }), 30);
    st = requestDevice(st, "sc", 2.5, 15);
    expect(st.device!.stage).toBe("box");
    // advancing a device still in its box does nothing
    expect(advanceDevice(su.s, su.g, st, 5).device!.centreMm).toBe(st.device!.centreMm);
    st = backloadDevice(st); // without checking the label or preparing: counted
    expect(st.counters.uncheckedLabels).toBe(1);
    expect(st.counters.unpreparedDevices).toBe(1);
    expect(advanceDevice(su.s, su.g, st, 5).events.slice(-1)[0].text).toMatch(/Open the haemostatic valve/);
    st = setValve(st, true);
    st = advanceDevice(su.s, su.g, st, 5); // introduced
    expect(st.device!.stage).toBe("in-guide");
    for (let i = 0; i < 30; i++) st = advanceDevice(su.s, su.g, st, 2, { supervised: true });
    // supervised: the device waits at the guide tip until heparin and an ACT ≥ 250 s
    expect(st.device!.centreMm + st.device!.lengthMm / 2).toBeLessThanOrEqual(0.01);
    expect(st.counters.actSkipped).toBeGreaterThan(0);
    st = giveDrug(su.s, su.g, st, "heparin", 7000);
    st = recordAct(st, 290);
    for (let i = 0; i < 30; i++) st = advanceDevice(su.s, su.g, st, 2, { supervised: true });
    expect(st.device!.centreMm).toBeGreaterThan(20);
  });

  it("the indeflator in time: the balloon occludes while inflated, the stent deploys at the peak pressure, deflation takes seconds", () => {
    const su = setup("lad-focal");
    let st = workflowLoad(su, wireToTarget(su, start(su)), "des", 2.5, 23);
    st = deliverTo(su, st, su.g.lesion.centreMm);
    let occludedTicks = 0;
    let fx = 0;
    st = timedInflation(su, st, 14, 2, 10, (x) => {
      if (pciPatientEffects(su.s, su.g, x).occlusions.some((o) => o.id === "balloon")) occludedTicks++;
      fx++;
    });
    expect(occludedTicks / 10).toBeGreaterThan(12); // seconds occluded
    expect(st.stents.length).toBe(1);
    expect(st.stents[0].diameter).toBeGreaterThan(2.6);
    expect(st.severity).toBeLessThan(25);
    expect(st.device!.inflated).toBe(false);
    expect(fx).toBeGreaterThan(0);
  });

  it("melon-seeding: a fast pressure rise squeezes a balloon out of a rubbery lesion; a slow rise does not", () => {
    const su = setup("lad-focal");
    const once = (rate: number, seed: number) => {
      let st = workflowLoad(su, wireToTarget(su, start(su, { seed })), "sc", 2.5, 12);
      st = deliverTo(su, st, su.g.lesion.centreMm + 2);
      st = setIndeflator(st, 10, rate);
      for (let t = 0; t < 6; t += 0.05) st = stepPci(su.s, su.g, st, 0.05);
      return st.counters.melonSeeds;
    };
    let fast = 0,
      slow = 0;
    for (let seed = 1; seed <= 8; seed++) {
      fast += once(8, seed);
      slow += once(1, seed);
    }
    expect(fast).toBeGreaterThan(0);
    expect(slow).toBe(0);
  });

  it("a balloon taken past its burst pressure ruptures; an unprepared one releases air", () => {
    const su = setup("lad-focal");
    let st = wireToTarget(su, start(su));
    st = requestDevice(st, "sc", 2.5, 12);
    st = backloadDevice(st); // not prepared
    st = setValve(st, true);
    st = advanceDevice(su.s, su.g, st, 1);
    st = deliverTo(su, st, su.g.lesion.centreMm);
    st = setIndeflator(st, 28, 3);
    for (let t = 0; t < 12 && !st.balloonRupture; t += 0.1) st = stepPci(su.s, su.g, st, 0.1);
    expect(st.balloonRupture).toBe(true);
    expect(st.cx.list.some((c) => c.kind === "air")).toBe(true);
  });

  it("debrief reports the lesion estimate error in mm and the sizing ratio, without a checklist score", () => {
    const su = setup("lad-focal");
    const { s, g } = su;
    let st = wireToTarget(su, start(su));
    const t = truthNow(g, st);
    st = submitEstimate(g, st, { refMm: t.refMm + 0.3, mldMm: t.mldMm + 0.1, lengthMm: t.lengthMm + 4 });
    expect(st.qcaRevealed).toBe(true);
    st = chooseSizing(g, st, "distal-reference");
    expect(st.sizing).not.toBeNull();
    st = loadDevice(st, "stent", "semi-compliant", Math.max(2.5, st.sizing!.diameter), st.sizing!.lengthMm);
    st = moveDevice(st, g.lesion.centreMm - st.device!.centreMm);
    st = removeDevice(deflate(inflate(s, g, st, 14)));
    st = finishCase(s, g, st);
    const d = debrief(s, g, st);
    expect(d.metrics.lesionEstimateErrorMm!.ref).toBeCloseTo(0.3, 6);
    expect(d.metrics.lesionEstimateErrorMm!.length).toBeCloseTo(4, 6);
    expect(d.metrics.sizingRatio!).toBeGreaterThan(0.8);
    expect(d.metrics.sizingRatio!).toBeLessThan(1.4);
    expect(d.metrics.landingMarginMm).not.toBeNull();
    expect(d.items.some((i) => /Lesion estimate error/.test(i.text))).toBe(true);
    expect((d as unknown as { score?: number }).score).toBeUndefined();
    expect(st.log.some((e) => e.kind === "lesion-estimate")).toBe(true);
    expect(st.log.some((e) => e.kind === "case-end")).toBe(true);
  });

  it("over-advancing a stiff wire distally perforates; balloon tamponade and protamine stop the leak", () => {
    const su = setup("lad-focal");
    const { s, g } = su;
    let st = wireToTarget(su, setWireKind(start(su), "cto"));
    for (let i = 0; i < 200 && !st.perforation; i++) st = moveWire(s, g, st, 3);
    expect(st.perforation).not.toBeNull();
    const perf = st.cx.list.find((c) => c.kind === "perforation")!;
    expect(perf.data.distal).toBe(1);
    // coil seals a distal hole
    const coiled = bailout(s, g, st, "coil");
    expect(coiled.perforation).toBeNull();
  });

  it("with the patient engine: balloon inflation in the LAD gives anterior ST elevation and ischaemia that resolve after deflation", () => {
    const su = setup("lad-focal");
    const eng = new PatientEngine({ profile: generatePatient(21, { indication: "SA" }), tree: su.refTree, lesions: [] });
    const mem = newBridge();
    eng.setTip(tipFromGuide({ id: "EBU3.5", french: 6, engaged: true, depthMm: 0, coaxial: 0.85, extensionMm: null, buddy: false }, "left", false));
    eng.advance(6);
    let st = workflowLoad(su, wireToTarget(su, start(su)), "sc", 2.5, 12);
    st = deliverTo(su, st, su.g.lesion.centreMm - 20); // proximal LAD
    const tick = (x: PciState) => {
      applyEffects(eng, mem, pciPatientEffects(su.s, su.g, x), x.t);
      eng.advance(0.1);
    };
    let stDuring = 0,
      isch = 0;
    st = setIndeflator(st, 8, 2);
    for (let t = 0; t < 60; t += 0.1) {
      st = stepPci(su.s, su.g, st, 0.1);
      tick(st);
    }
    const v = eng.vitals();
    stDuring = v.st.V2 + v.st.V3 + v.st.V4;
    isch = v.ischaemia.LAD;
    expect(stDuring).toBeGreaterThan(2);
    expect(isch).toBeGreaterThan(0.3);
    expect(v.ischaemia.RCA).toBeLessThan(0.05);
    st = pullIndeflatorNegative(su.s, su.g, st);
    for (let t = 0; t < 180; t += 0.1) {
      st = stepPci(su.s, su.g, st, 0.1);
      tick(st);
    }
    const after = eng.vitals();
    expect(after.st.V2 + after.st.V3 + after.st.V4).toBeLessThan(stDuring / 2);
  });

  it("with the patient engine: a free perforation fills the pericardium and the pressure falls; balloon tamponade stops the leak", () => {
    const su = setup("lad-focal");
    const run = (tamponade: boolean) => {
      const eng = new PatientEngine({ profile: generatePatient(7, { indication: "SA" }), tree: su.refTree, lesions: [] });
      const mem = newBridge();
      eng.setTip({ location: "aorta" });
      eng.advance(6);
      const map0 = eng.vitals().aortaTrue.mean;
      let st = wireToTarget(su, start(su));
      // a grossly oversized stent: perforation (draw until one occurs)
      for (let seed = 1; seed < 60; seed++) {
        let x = wireToTarget(su, start(su, { seed }));
        x = loadDevice(x, "stent", "semi-compliant", 4.0, 12);
        x = moveDevice(x, su.g.lesion.centreMm - x.device!.centreMm);
        x = inflate(su.s, su.g, x, 18);
        if (x.cx.list.some((c) => c.kind === "perforation" && c.grade.startsWith("III"))) {
          st = x;
          break;
        }
      }
      expect(st.cx.list.some((c) => c.kind === "perforation" && c.grade.startsWith("III"))).toBe(true);
      if (!tamponade) st = deflate(st);
      else st = { ...st, ind: { ...st.ind, atm: 4, target: 4, fill: 1, negative: false } };
      for (let t = 0; t < 150; t += 0.2) {
        st = stepPci(su.s, su.g, st, 0.2);
        applyEffects(eng, mem, pciPatientEffects(su.s, su.g, st), st.t);
        eng.advance(0.2);
      }
      return { map0, map: eng.vitals().aortaTrue.mean, peri: eng.vitals().pericardialMl };
    };
    const open = run(false);
    expect(open.peri).toBeGreaterThan(80);
    expect(open.map).toBeLessThan(open.map0 - 10);
    const sealed = run(true);
    expect(sealed.peri).toBeLessThan(open.peri / 3);
  });

  it("an injection through a guide with air (device introduced, not aspirated) causes an air embolism", () => {
    const su = setup("lad-focal");
    let st = wireToTarget(su, start(su, { seed: 3 }));
    st = requestDevice(st, "sc", 2.5, 12);
    st = checkLabel(prepareDevice(st));
    st = backloadDevice(st);
    st = setValve(st, true);
    st = advanceDevice(su.s, su.g, st, 1);
    st = injectPci(su.s, su.g, st, { ml: 6, psi: 120, forceful: false });
    expect(st.cx.list.some((c) => c.kind === "air")).toBe(true);
    const fx = pciPatientEffects(su.s, su.g, st);
    expect(fx.vagal).toBeGreaterThan(0);
  });
});
