import { describe, it, expect } from "vitest";
import { newCaseSession, MP_PCI_GATE, SOURCED_DOSES, SOURCED_PCI_HEPARIN } from "./caseSession";
import { SeededRng } from "../patient/rng";
// the helpers these tests drive the case with live in the autopilot (proc-foundation-scenarios-ledger)
import { aimedPose, prepare, advanceToFlash, gainAccess, navigate, exchange } from "./autopilot";

describe("case session: arrival, time-out and puncture", () => {
  it("skin puncture before the time-out is a critical error; supervised mode blocks it", () => {
    const { session: s } = newCaseSession({ seed: "c5-timeout", access: "radial-right" });
    expect(s.placeNeedle(aimedPose(s))).toBe(true);
    s.advanceNeedle(1);
    expect(s.criticalErrors).toBe(1);
    expect(s.complications.some((c) => c.id === "no-time-out")).toBe(true);

    const { session: sup } = newCaseSession({ seed: "c5-timeout", access: "radial-right", mode: "supervised" });
    expect(sup.placeNeedle(aimedPose(sup))).toBe(false);
    expect(sup.attending.some((a) => a.stop)).toBe(true);
  });

  it("time-out items not backed by the chart are flagged", () => {
    const { session: s } = newCaseSession({ seed: "c5-false", access: "radial-right" });
    for (const i of s.timeOutItems()) s.confirmTimeOutItem(i.id);
    expect(s.timeOutDone).toBe(true);
    expect(s.timeOut.falseConfirmations.length).toBeGreaterThan(0);
  });

  it("each step takes time on the session clock", () => {
    const { session: s } = newCaseSession({ seed: "c5-clock", access: "radial-right" });
    const t0 = s.tS;
    prepare(s);
    expect(s.tS - t0).toBeGreaterThan(7 * 15 + 180 + 60);
  });

  it("a front-wall puncture with pulsatile flashback lets the wire advance freely", () => {
    const { session: s } = newCaseSession({ seed: "c5-front", access: "radial-right" });
    prepare(s);
    s.placeNeedle(aimedPose(s));
    expect(advanceToFlash(s)).toBe(true);
    expect(s.pm.st.arterialPunctures).toBe(1);
    s.advanceNeedle(0.6);
    const ev = s.advanceAccessWire(10);
    expect(ev.some((e) => e.kind === "wire-free")).toBe(true);
    expect(s.pm.st.wire?.resistance).toBeLessThan(0.2);
  });

  it("a back-wall puncture loses the flashback, the wire meets resistance and the patient reports pain", () => {
    const { session: s, engine } = newCaseSession({ seed: "c5-back", access: "radial-right" });
    prepare(s);
    s.placeNeedle(aimedPose(s));
    expect(advanceToFlash(s)).toBe(true);
    engine.drainEvents();
    // keep going through the back wall
    let through = false;
    for (let i = 0; i < 60 && !through; i++) through = s.advanceNeedle(0.2).some((e) => e.kind === "back-wall");
    expect(through).toBe(true);
    s.advanceNeedle(1.5);
    expect(s.flashback().kind).toBe("none");
    const ev = s.advanceAccessWire(3);
    expect(ev.some((e) => e.kind === "wire-resistance")).toBe(true);
    expect(s.log.some((l) => l.kind === "patient" && /deep/.test(l.text))).toBe(true);
    expect(engine.drainEvents().some((e) => e.kind === "patient.stimulus")).toBe(true);
    // withdrawing slowly brings the pulsatile flashback back (counter-puncture technique)
    let back = false;
    for (let i = 0; i < 40 && !back; i++) {
      s.advanceNeedle(-0.2);
      back = s.flashback().kind === "arterial";
    }
    expect(back).toBe(true);
  });

  it("forcing a wire from a bevel half in the wall makes it subintimal", () => {
    const { session: s } = newCaseSession({ seed: "c5-sub", access: "radial-right" });
    prepare(s);
    s.placeNeedle(aimedPose(s));
    expect(advanceToFlash(s)).toBe(true);
    let through = false;
    for (let i = 0; i < 60 && !through; i++) through = s.advanceNeedle(0.2).some((e) => e.kind === "back-wall");
    s.advanceNeedle(1.5);
    // withdraw until the first trace of blood: the bevel straddles the back wall
    let f = s.flashback();
    for (let i = 0; i < 200 && f.kind === "none"; i++) {
      s.advanceNeedle(-0.05);
      f = s.flashback();
    }
    expect(f.kind).not.toBe("none");
    expect(f.lumenFraction).toBeLessThan(0.8);
    for (let i = 0; i < 6; i++) s.advanceAccessWire(2);
    expect(s.pm.st.wire?.state).toBe("subintimal");
    expect(s.complications.some((c) => c.id === "subintimal")).toBe(true);
  });
});

describe("case session: navigation, exchanges and handover", () => {
  it("radial route reaches the root on fluoroscopy; blind advancing is challenged", () => {
    const { session: s } = newCaseSession({ seed: "c5-nav", access: "radial-right", variants: ["tortuous-subclavian"] });
    prepare(s);
    gainAccess(s);
    s.order("heparin-radial");
    s.runPending();
    s.prepCatheter("TIG");
    s.runPending();
    expect(s.loadCatheter("TIG")).toBe(true);
    // beam off: the attending objects
    s.beamOn = false;
    for (let i = 0; i < 30; i++) s.commandWire(1, 0);
    expect(s.attending.some((a) => /cannot see/.test(a.text))).toBe(true);
    navigate(s);
    expect(s.wire.reachedRoot).toBe(true);
    expect(s.catheterInAorta).toBe(true);
  });

  it("skipping the line flush leaves air in the line and raises the air-embolism hazard", () => {
    const { session: s, engine } = newCaseSession({ seed: "c5-air", access: "radial-right" });
    // the table left as it is: the line and transducer steps under test are the exchange's
    prepare(s, { tablePrep: false });
    gainAccess(s);
    s.order("heparin-radial");
    s.runPending();
    s.prepCatheter("TIG");
    s.runPending();
    s.loadCatheter("TIG");
    navigate(s);
    exchange(s, { flushLine: false });
    expect(s.hazards.airEmbolism).toBeGreaterThanOrEqual(0.7);
    expect(engine.vitals().transducer.verdict).toBe("overdamped");
    const h = s.handover("diagnostic")!;
    expect(h.line.lineAir).toBe(true);
    expect(s.criticalErrors).toBeGreaterThan(0);
  });

  it("pulling the wire without back-bleeding and flushing without aspirating sends air into the coronary", () => {
    const { session: s, engine } = newCaseSession({ seed: "c5-airemb", access: "radial-right" });
    prepare(s);
    gainAccess(s);
    s.order("heparin-radial");
    s.runPending();
    s.prepCatheter("TIG");
    s.runPending();
    s.loadCatheter("TIG");
    navigate(s);
    const before = engine.vitals().ischaemia.RCA ?? 0;
    exchange(s, { backBleed: false, aspirate: false });
    expect(s.complications.some((c) => c.id === "air-embolism" && c.critical)).toBe(true);
    s.wait(20);
    s.runPending();
    const during = engine.vitals().ischaemia.RCA ?? 0;
    expect(during).toBeGreaterThan(before + 0.05);
  });

  it("not zeroing or levelling gives offset pressures; zeroing and levelling removes the offset", () => {
    const { session: s } = newCaseSession({ seed: "c5-zero", access: "radial-right" });
    // the table left as it is: the line and transducer steps under test are the exchange's
    prepare(s, { tablePrep: false });
    gainAccess(s);
    s.order("heparin-radial");
    s.runPending();
    s.prepCatheter("TIG");
    s.runPending();
    s.loadCatheter("TIG");
    navigate(s);
    exchange(s, { zero: false, level: false });
    const off = Math.abs(s.pressureOffset());
    expect(off).toBeGreaterThan(3);
    s.zero();
    s.runPending();
    s.level();
    s.runPending();
    s.tick(4);
    expect(Math.abs(s.pressureOffset())).toBeLessThan(2.5);
  });

  it("diagnostic angiography continues into ad hoc PCI with the same access, heparin, contrast and dose", () => {
    const { session: s } = newCaseSession({ seed: "c5-pci", access: "radial-right" });
    prepare(s);
    gainAccess(s);
    s.order("heparin-radial");
    s.runPending();
    s.prepCatheter("TIG");
    s.runPending();
    s.loadCatheter("TIG");
    navigate(s);
    exchange(s);
    s.checkTrace();
    s.setOwnDose({ fluoroS: 95, karMGy: 21, kapGyCm2: 3.1 });
    const h1 = s.handover("diagnostic")!;
    expect(h1.access).toBe("radial-right");
    expect(h1.heparinU).toBe(SOURCED_DOSES.radialHeparinU);
    expect(h1.line.lumenAir).toBe(false);
    s.returnFromLab("diagnostic", { contrastMl: 48, fluoroS: 180, karMGy: 160, kapGyCm2: 14 });
    const h2 = s.toPci()!;
    expect(h2.lab).toBe("pci");
    expect(h2.access).toBe(h1.access);
    expect(h2.sheath).toBe(h1.sheath);
    expect(h2.heparinU).toBe(h1.heparinU);
    expect(h2.contrastMl).toBeGreaterThanOrEqual(48);
    expect(h2.fluoroS).toBeCloseTo(95 + 180, 5);
    expect(h2.karMGy).toBeCloseTo(21 + 160, 5);
    expect(h2.pciReady?.heparinTopUpU).toBe(s.pciTopUpU());
    expect(h2.pciReady?.actTargetS).toEqual([250, 300]);
  });
});

describe("case session: closure and delayed complications", () => {
  it("closure is required to finish; patent haemostasis is documented with the pleth", () => {
    const { session: s } = newCaseSession({ seed: "c5-close", access: "radial-right" });
    prepare(s);
    gainAccess(s);
    s.order("heparin-radial");
    s.runPending();
    s.prepCatheter("TIG");
    s.runPending();
    s.loadCatheter("TIG");
    navigate(s);
    exchange(s);
    s.handover("diagnostic");
    s.returnFromLab("diagnostic", { contrastMl: 40, fluoroS: 150 });
    expect(s.finish()).toBeNull();
    s.removeCatheter();
    s.runPending();
    s.applyBand(18);
    s.runPending();
    s.pullRadialSheath();
    // a full band occludes the radial artery: the pleth is lost with ulnar compression
    expect(s.plethCheck()!.cls).toBe("D");
    s.runPending();
    expect(s.radial!.patentDocumented).toBe(false);
    // deflate until the pleth returns without bleeding
    let ok = false;
    for (let ml = 17; ml >= 4 && !ok; ml -= 1) {
      s.setBandVolume(ml);
      const r = s.plethCheck()!;
      s.runPending();
      ok = r.cls !== "D" && !r.bleeding;
    }
    expect(ok).toBe(true);
    expect(s.radial!.patentDocumented).toBe(true);
    s.finishRadialClosure(2);
    const sum = s.finish();
    expect(sum).not.toBeNull();
    expect(sum!.raoProbability).toBeGreaterThan(0);
    expect(sum!.raoProbability).toBeLessThan(0.2);
    // documented patency lowers it against the same case without
    const occl = s.raoFactors(2);
    expect(sum!.raoTerms.some((t) => /Patency/.test(t.factor))).toBe(false);
    expect(occl.patentHaemostasis).toBe(true);
  });

  it("a femoral sheath pulled early with a short, misplaced compression presents a delayed bleed in recovery", () => {
    let presented = false;
    for (let k = 0; k < 4 && !presented; k++) {
      const { session: s, engine } = newCaseSession({ seed: `c5-fem-${k}`, access: "femoral" });
      prepare(s);
      gainAccess(s);
      s.order("heparin-weight");
      s.runPending();
      s.wait(120);
      s.runPending();
      s.femoralManual(2, 30);
      s.runPending();
      expect(s.femoral!.risk.largeHaematoma).toBeGreaterThan(0.5);
      const map0 = engine.vitals().aortaTrue.mean;
      for (let m = 0; m < 6 && s.presented.length === 0; m++) {
        s.observe(10);
        s.runPending();
      }
      if (s.presented.length) {
        presented = true;
        expect(s.complications.some((c) => c.id === "groin-haematoma" || c.id === "retroperitoneal-bleed")).toBe(true);
        expect(s.log.some((l) => l.kind === "nurse")).toBe(true);
        s.observe(20);
        s.runPending();
        expect(engine.vitals().aortaTrue.mean).toBeLessThan(map0 + 2);
      }
    }
    expect(presented).toBe(true);
  });

  it("the handover note is graded against the case", () => {
    const { session: s } = newCaseSession({ seed: "c5-note", access: "radial-right" });
    prepare(s);
    gainAccess(s);
    s.order("heparin-radial");
    s.runPending();
    const act = s.measureAct();
    s.runPending();
    const t = s.truth();
    const g = s.submitHandover({ ...t, lastActS: act });
    expect(g.correct).toBe(g.total);
    const bad = s.submitHandover({ ...t, heparinU: 2000, complications: ["radial-occlusion"] });
    expect(bad.correct).toBe(bad.total - 2);
  });
});

// proc-heparin-act-handover: the hand-over gate before ad hoc PCI (scenarios/heparin.ts)
describe("case session: heparin, ACT and contrast at the hand-over to ad hoc PCI", () => {
  const settle = (s: ReturnType<typeof newCaseSession>["session"]) => s.runPending();
  const measure = (s: ReturnType<typeof newCaseSession>["session"]) => {
    const a = s.measureAct();
    settle(s);
    return a!;
  };

  it("'tissued-cannula' gives an ACT within 20 s of baseline after an IV 5000 U bolus; an IA redose reaches target", () => {
    const { session: s } = newCaseSession({ scenario: "tissued-cannula" });
    expect(s.pciGateOpen).toBe(true);
    const baseline = measure(s);
    const [lo] = s.pciActRange();
    expect(baseline).toBeLessThan(lo);
    expect(s.givePciHeparin(5000, "iv")).toMatchObject({ u: 5000, route: "iv", delivered: false });
    settle(s);
    const after = measure(s);
    expect(Math.abs(after - baseline)).toBeLessThanOrEqual(20);
    // the dose is charted as given (the operator does not know it never arrived)
    expect(s.heparinDoses[s.heparinDoses.length - 1]).toMatchObject({ u: 5000, route: "iv", delivered: false });
    // the cannula is swollen when looked at
    expect(s.inspectIvCannula()).toBe("tissued");
    settle(s);
    expect(s.log.some((l) => /swollen/.test(l.text))).toBe(true);
    // the redose through the sheath side arm reaches the blood and the target
    expect(s.givePciHeparin(5000, "ia")).toMatchObject({ route: "ia", delivered: true });
    settle(s);
    expect(measure(s)).toBeGreaterThanOrEqual(lo);
    expect(s.decisions().find((d) => d.id === "low-act-line-checked")!.correct).toBe(true);
    const h = s.toPci()!;
    expect(h).not.toBeNull();
    expect(h.anticoag!.doses.filter((d) => !d.delivered).map((d) => d.u)).toEqual([5000]);
    expect(s.decisions().find((d) => d.id === "pci-act-before-wiring")!.correct).toBe(true);
  });

  it("a redose IV into the same tissued cannula, unchecked, is scored as not checking the line", () => {
    const { session: s } = newCaseSession({ scenario: "tissued-cannula" });
    s.givePciHeparin(5000, "iv");
    settle(s);
    measure(s);
    s.givePciHeparin(3000, "iv");
    settle(s);
    expect(s.decisions().find((d) => d.id === "low-act-line-checked")!.correct).toBe(false);
  });

  it("a PCI dose of 100 U/kg minus the access dose is correct; 100 U/kg on top of a planned GP IIb/IIIa is wrong", () => {
    const { session: s } = newCaseSession({ scenario: "adhoc-heparin" });
    const w = s.profile.weightKg;
    const access = s.heparinU;
    expect(access).toBeGreaterThan(0);
    expect(s.pciDoseRangeUPerKg()).toEqual(SOURCED_PCI_HEPARIN.uPerKg);
    s.givePciHeparin(100 * w - access, "iv");
    settle(s);
    expect(s.decisions().find((d) => d.id === "pci-heparin-dose")!.correct).toBe(true);

    const { session: g } = newCaseSession({ scenario: "adhoc-gpi-planned" });
    expect(g.ivAntiplateletPlanned()).toBe(true);
    expect(g.pciDoseRangeUPerKg()).toEqual(SOURCED_PCI_HEPARIN.uPerKgWithIvAntiplatelet);
    expect(g.pciActRange()).toEqual([200, 250]);
    g.givePciHeparin(100 * g.profile.weightKg, "iv");
    settle(g);
    const d = g.decisions().find((x) => x.id === "pci-heparin-dose")!;
    expect(d.correct).toBe(false);
    expect(d.expected).toMatch(/50-70 U\/kg/);

    // with the plan, the access dose already within 50-70 U/kg needs nothing more: proceeding on an ACT at target is right
    const { session: n } = newCaseSession({ scenario: "adhoc-gpi-planned" });
    expect(measure(n)).toBeGreaterThanOrEqual(200);
    expect(n.toPci()).not.toBeNull();
    expect(n.decisions().find((x) => x.id === "pci-heparin-dose")!.correct).toBe(true);
    expect(n.decisions().find((x) => x.id === "pci-act-before-wiring")!.correct).toBe(true);
  });

  it("SessionHandover.contrast.remainingMl equals budget minus used", () => {
    const { session: s } = newCaseSession({ scenario: "ckd-budget-adhoc" });
    s.wait(2);
    settle(s);
    const c = s.contrastNow();
    expect(c.budgetMl).not.toBeNull();
    expect(c.usedMl).toBeGreaterThanOrEqual(48);
    // the budget is the stricter rule's, counting the CT two days before
    expect(c.budgetMl!).toBeLessThan(s.profile.renal.macdMl);
    s.givePciHeparin(Math.max(500, s.pciTopUpU()), "iv");
    settle(s);
    measure(s);
    let h = s.toPci();
    for (let k = 0; k < 6 && !h; k++) {
      s.givePciHeparin(1000, "ia");
      settle(s);
      measure(s);
      h = s.toPci();
    }
    expect(h).not.toBeNull();
    expect(h!.contrast!.budgetMl).toBe(s.contrastBudgetMl);
    expect(h!.contrast!.remainingMl).toBe(Math.max(0, h!.contrast!.budgetMl! - h!.contrast!.usedMl));
    expect(h!.contrast!.usedMl).toBe(h!.contrastMl);
  });

  it("in supervised mode the hand-over waits for an ACT at target measured after the last dose; independent runs go on and are scored", () => {
    const { session: s } = newCaseSession({ scenario: "adhoc-heparin", mode: "supervised" });
    expect(s.pciGateHolds()).toBe(true);
    expect(s.pciGateHint()).toBeNull();
    expect(s.toPci()).toBeNull();
    const low = measure(s);
    expect(low).toBeLessThan(250);
    expect(s.toPci()).toBeNull();
    expect(s.attending.some((a) => a.stop)).toBe(true);
    s.givePciHeparin(100 * s.profile.weightKg - s.heparinU, "iv");
    settle(s);
    // the ACT before the dose no longer stands
    expect(s.toPci()).toBeNull();
    expect(measure(s)).toBeGreaterThanOrEqual(250);
    const h = s.toPci()!;
    expect(h).not.toBeNull();
    expect(h.pciReady!.actTargetS).toEqual([250, 300]);
    expect(s.pciGateOpen).toBe(false);

    const { session: i } = newCaseSession({ scenario: "adhoc-heparin", mode: "independent" });
    measure(i);
    expect(i.toPci()).not.toBeNull();
    expect(i.decisions().find((d) => d.id === "pci-act-before-wiring")!.correct).toBe(false);
    expect(i.decisions().find((d) => d.id === "pci-heparin-dose")!.correct).toBe(false);
  });

  it("an independent run that goes on below target does not carry 'low-act' past the gate, or back from the PCI", () => {
    const { session: s } = newCaseSession({ scenario: "adhoc-heparin", mode: "independent" });
    expect(measure(s)).toBeLessThan(s.pciActRange()[0]);
    expect(s.activeEvents()).toContain("low-act");
    expect(s.toPci()).not.toBeNull();
    expect(s.activeEvents()).not.toContain("low-act");
    s.returnFromLab("pci", { contrastMl: 0, fluoroS: 0, durationS: 0 });
    expect(s.activeEvents()).not.toContain("low-act");
  });

  it("an IV redose after looking at the tissued cannula and putting in a new one is scored as checking the line, and reaches the blood", () => {
    const { session: s } = newCaseSession({ scenario: "tissued-cannula" });
    s.givePciHeparin(5000, "iv");
    settle(s);
    measure(s);
    expect(s.inspectIvCannula()).toBe("tissued");
    settle(s);
    s.resiteIvCannula();
    settle(s);
    expect(s.givePciHeparin(5000, "iv")).toMatchObject({ route: "iv", delivered: true });
    settle(s);
    expect(s.decisions().find((d) => d.id === "low-act-line-checked")!.correct).toBe(true);
  });

  it("the rare tissued cannula is drawn from the case's seed at the gate, the same whether a bolus or a look comes first; no draw before the gate", () => {
    // a seed whose own stream draws the tissued line (found from the draw itself, so no case need be run per seed)
    let seed = "";
    for (let i = 0; i < 2000 && !seed; i++) if (new SeededRng(`iv-line:iv-draw-${i}`).chance(MP_PCI_GATE.tissuedChance)) seed = `iv-draw-${i}`;
    expect(seed, "no seed in range drew a tissued line").not.toBe("");
    const atGate = () => {
      const { session: s } = newCaseSession({ seed, access: "radial-right", start: "post-diagnostic" });
      // before the gate a look finds the line running and does not use up the draw
      expect(s.inspectIvCannula()).toBe("patent");
      settle(s);
      expect(s.openPciGate()).not.toBeNull();
      return s;
    };
    const a = atGate();
    expect(a.givePciHeparin(5000, "iv")).toMatchObject({ delivered: false });
    // a rerun with the same seed draws the same line, and a look first finds it
    const b = atGate();
    expect(b.inspectIvCannula()).toBe("tissued");
    settle(b);
    expect(b.givePciHeparin(5000, "iv")).toMatchObject({ delivered: false });
    // a case that never opens the gate keeps a running line
    const { session: c } = newCaseSession({ seed, access: "radial-right", start: "post-diagnostic" });
    expect(c.inspectIvCannula()).toBe("patent");
    settle(c);
    const h = c.toPci();
    expect(h).not.toBeNull();
    expect(c.heparinDoses.every((d) => d.delivered !== false)).toBe(true);
  });

  it("guided mode alone shows the heparin still to give and the target; a direct toPci without the gate behaves as before", () => {
    const { session: g } = newCaseSession({ scenario: "adhoc-heparin" });
    const hint = g.pciGateHint()!;
    expect(hint.stillToGiveU).toBe(g.pciTopUpU());
    expect(hint.actS).toEqual(SOURCED_DOSES.pciActS);
    const { session: e } = newCaseSession({ scenario: "adhoc-heparin", mode: "exam" });
    expect(e.pciGateHint()).toBeNull();
    expect(e.pciGateHolds()).toBe(false);
    // closing the gate returns the old direct hand-over
    g.closePciGate();
    expect(g.pciGateOpen).toBe(false);
    expect(g.toPci()).not.toBeNull();
  });

  it("ckd-budget-adhoc: the stricter rule's budget is pinned, the same on every path (3.7 x eGFR 25 less the CT's 40 mL, rounded down)", () => {
    for (const mode of ["guided", "supervised", "independent", "exam"] as const) {
      const { session: s } = newCaseSession({ scenario: "ckd-budget-adhoc", mode });
      s.wait(2);
      settle(s);
      expect(s.profile.renal.egfr, mode).toBe(25);
      expect(s.contrastBudgetMl, mode).toBe(52);
      expect(s.contrastNow(), mode).toEqual({ usedMl: 48, budgetMl: 52, remainingMl: 4 });
    }
  });

  it("the guided top-up is rounded up, so the total it names reaches the lower U/kg bound", () => {
    for (const id of ["adhoc-heparin", "adhoc-gpi-planned", "tissued-cannula", "ckd-budget-adhoc"]) {
      const { session: s } = newCaseSession({ scenario: id });
      const lo = s.pciDoseRangeUPerKg()[0] * s.profile.weightKg;
      const top = s.pciTopUpU();
      expect(top % 500, id).toBe(0);
      expect(s.heparinU + top, id).toBeGreaterThanOrEqual(lo);
      expect(s.heparinU + top - 500, id).toBeLessThan(lo);
    }
    // 95 kg with the 5000 U access dose: 6650 U is 70 U/kg, so 2000 U more (not 1500 U, which leaves 68 U/kg)
    const { session: a } = newCaseSession({ scenario: "adhoc-heparin" });
    expect(a.profile.weightKg).toBe(95);
    expect(a.heparinU).toBe(5000);
    expect(a.pciTopUpU()).toBe(2000);
  });

  it("an ACT above the target range passes the gate and is scored correct, with the overshoot named (and said in guided mode)", () => {
    for (const mode of ["guided", "independent"] as const) {
      const { session: s } = newCaseSession({ scenario: "adhoc-heparin", mode });
      const [lo, hi] = s.pciActRange();
      s.givePciHeparin(100 * s.profile.weightKg - s.heparinU, "iv");
      settle(s);
      const act = measure(s);
      expect(act, mode).toBeGreaterThan(hi);
      const said = s.attending.some((l) => l.text.includes(`above the ${lo}-${hi} s target range`));
      expect(said, mode).toBe(mode === "guided");
      expect(s.toPci(), mode).not.toBeNull();
      const d = s.decisions().find((x) => x.id === "pci-act-before-wiring")!;
      expect(d.correct, mode).toBe(true);
      expect(d.given, mode).toBe(`ACT ${act} s, above the ${lo}-${hi} s target range`);
    }
    // within the range nothing more is said
    const { session: w } = newCaseSession({ scenario: "adhoc-gpi-planned" });
    const act = measure(w);
    const [, hi] = w.pciActRange();
    expect(act).toBeLessThanOrEqual(hi);
    expect(w.attending.some((l) => /above the .* target range/.test(l.text))).toBe(false);
  });
});
