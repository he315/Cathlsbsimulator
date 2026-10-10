// pci-equipment-tray: the table workflow in the PCI lab. The engine's steps (requestDevice from the cart,
// checkLabel, the prep station, backloadDevice, setValve, the introduction, aspirateGuide), the balloon's
// iodine by mixture, the expired box flagged at the label check and recorded in the debrief, the wire's
// table set-up (tip damage and torque lag), the scrub nurse, the consoles by mode, the rule group and the
// practice links.
//   npx vitest run src/ui/pci/tray.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PciLabSession } from "./PciLabSession";
import { resolvePciLaunch } from "./launch";
import { consolesFor, pciConsoles } from "./consoles/registry";
import { PRACTICE_INDEX, practiceForLesson } from "../content/practiceIndex";
import { launch as TRAY_LAUNCH } from "../../content/practice/pci-equipment-tray.launch";
import { useSeriesStore } from "../../state/useSeriesStore";
import { trayOf, type PciState } from "../../simulation/pci/state";
import {
  advanceDevice,
  applySuction,
  aspirateGuide,
  assistStep,
  backloadDevice,
  checkLabel,
  connectIndeflator,
  fillPrepSyringe,
  nextAssistStep,
  prepareDevice,
  removeDevice,
  requestDevice,
  returnBox,
  setUpWire,
  setValve,
} from "../../simulation/pci/actions/devices";
import { injectPci } from "../../simulation/pci/actions/imaging";
import { moveWire, torqueWire } from "../../simulation/pci/actions/wire";
import { torqueLag, MP_TIP_DAMAGE_TORQUE } from "../../simulation/pci/coronaryWire";
import {
  MP_BALLOON_VISIBLE_MG_PER_ML,
  MP_CASE_DATE,
  MP_UNPREPARED_GUIDE_AIR_ML,
  balloonIodineMgPerMl,
  balloonVisible,
  buildCart,
  cartCheckDue,
  cartCheckList,
  cartOf,
  cartProblems,
  deviceBoxLabel,
  syringeView,
  trayDebrief,
} from "../../simulation/pci/cart";
import { RULES } from "../../mentor/rules";
import { trayMentorInput } from "../../mentor/rules/pciTray";
import type { MentorCtx } from "../../mentor/context";

const sessions: PciLabSession[] = [];
afterEach(() => {
  for (const x of sessions.splice(0)) x.dispose();
  useSeriesStore.getState().clear();
});

function lab(scenario = "lad-focal", start = "wire-across", mode: "guided" | "supervised" | "independent" | "exam" = "guided"): PciLabSession {
  const r = resolvePciLaunch({ scenario, start, mode });
  expect(r.problems).toEqual([]);
  const x = new PciLabSession({ launch: r.launch, team: false, headlessFrames: true });
  sessions.push(x);
  return x;
}

/** An injection through the guide (the syringe's push, as the session books it). */
const injectNow = (x: PciLabSession, st: PciState) => injectPci(x.s, x.g, st, { ml: 8, psi: 60, forceful: false });
const airCx = (st: PciState) => st.cx.list.filter((c) => c.kind === "air");

describe("backload without preparation (seeded)", () => {
  it("increments counters.unpreparedDevices, the device carries air into the guide, and the next injection without aspiration is an air embolism", () => {
    const x = lab();
    let st = requestDevice(x.st, "sc", 2.5, 15);
    st = checkLabel(st);
    const before = st.counters.unpreparedDevices;
    st = backloadDevice(st);
    expect(st.device!.stage).toBe("backloaded");
    expect(st.counters.unpreparedDevices).toBe(before + 1);
    expect(st.device!.carriedAirMl).toBe(MP_UNPREPARED_GUIDE_AIR_ML);
    // the valve opened and the guide aspirated before the device goes in: only the device's own air enters
    st = aspirateGuide(setValve(st, true));
    const air0 = st.cx.guideAirMl;
    st = advanceDevice(x.s, x.g, st, 1);
    expect(st.device!.stage).toBe("in-guide");
    // exactly the device's own air: the engine's valve air is not drawn as well (the guide was aspirated)
    expect(st.cx.guideAirMl).toBeCloseTo(air0 + MP_UNPREPARED_GUIDE_AIR_ML, 9);
    expect(st.cx.aspirated).toBe(true);
    const hit = injectNow(x, setValve(st, false));
    expect(airCx(hit)).toHaveLength(1);
    expect(hit.cx.guideAirMl).toBe(0);
    // the same sequence is the same draw (seeded)
    const again = injectNow(x, setValve(advanceDevice(x.s, x.g, aspirateGuide(setValve(backloadDevice(checkLabel(requestDevice(x.st, "sc", 2.5, 15))), true)), 1), false));
    expect(airCx(again)[0].data.ml).toBeCloseTo(airCx(hit)[0].data.ml as number, 12);
  });

  it("a prepared device introduced, then the guide aspirated, gives no air on the next injection", () => {
    const x = lab();
    let st = backloadDevice(prepareDevice(checkLabel(requestDevice(x.st, "sc", 2.5, 15))));
    expect(st.device!.carriedAirMl ?? 0).toBe(0);
    st = advanceDevice(x.s, x.g, setValve(st, true), 1);
    st = aspirateGuide(setValve(st, false));
    expect(airCx(injectNow(x, st))).toHaveLength(0);
    // without the aspiration, the air drawn in through the open valve goes down the artery
    const dirty = advanceDevice(x.s, x.g, setValve(backloadDevice(prepareDevice(checkLabel(requestDevice(x.st, "sc", 2.5, 15)))), true), 1);
    expect(dirty.cx.guideAirMl).toBeGreaterThan(0);
    expect(airCx(injectNow(x, setValve(dirty, false)))).toHaveLength(1);
  });

  it("the wire tip must be at least 20 mm into the coronary for a backload", () => {
    const x = lab("lad-focal", "guide-engaged");
    expect(x.st.tipMm).toBeLessThan(20);
    const st = backloadDevice(prepareDevice(requestDevice(x.st, "sc", 2.5, 15)));
    expect(st.device!.stage).not.toBe("backloaded");
  });
});

describe("the prep station", () => {
  it("balloon iodine with mixture 'saline' is below the visibility threshold and with '1:1' above it", () => {
    const x = lab();
    const prep = (mix: "1:1" | "1:2" | "saline" | "none", cycles = 3) => {
      let st = fillPrepSyringe(requestDevice(x.st, "sc", 2.5, 15), mix);
      for (let i = 0; i < cycles; i++) st = applySuction(st);
      return connectIndeflator(st).device!;
    };
    const one = prep("1:1");
    const saline = prep("saline");
    expect(one.prepared).toBe(true);
    expect(balloonIodineMgPerMl(one)).toBeGreaterThan(MP_BALLOON_VISIBLE_MG_PER_ML);
    expect(balloonVisible(one)).toBe(true);
    expect(saline.prepared).toBe(true);
    expect(balloonIodineMgPerMl(saline)).toBeLessThan(MP_BALLOON_VISIBLE_MG_PER_ML);
    expect(balloonVisible(saline)).toBe(false);
    // a weaker mixture is fainter; an unprepared balloon (air) is invisible; one suction cycle leaves air and it is not prepared
    expect(balloonIodineMgPerMl(prep("1:2"))).toBeLessThan(balloonIodineMgPerMl(one));
    expect(balloonVisible(requestDevice(x.st, "sc", 2.5, 15).device!)).toBe(false);
    const once = prep("1:1", 1);
    expect(once.prepared).toBe(false);
    expect(once.airFraction!).toBeGreaterThan(0.1);
    expect(balloonIodineMgPerMl(once)).toBeLessThan(balloonIodineMgPerMl(one));
    expect(prep("none").prepared).toBe(false);
  });

  it("the headless prepareDevice keeps its meaning (1:1, air purged, prepared)", () => {
    const x = lab();
    const dev = prepareDevice(requestDevice(x.st, "nc", 3.0, 12)).device!;
    expect(dev).toMatchObject({ prepared: true, mixture: "1:1", stage: "prepared", indeflatorConnected: true });
    expect(dev.airFraction!).toBeLessThanOrEqual(0.1);
  });
});

/** The cart's planted out-of-date predilatation box (buildCart always plants one). */
function expiredBalloon(st: PciState) {
  const cart = cartOf(st);
  const b = cart.boxes.find((b) => (b.specId === "sc" || b.specId === "nc") && b.expiredFront)!;
  expect(b).toBeTruthy();
  return b;
}

describe("the cart and the label", () => {
  it("an expired box is flagged at the label check, and its use is recorded in the debrief", () => {
    const x = lab();
    const b = expiredBalloon(x.st);
    let st = requestDevice(x.st, b.specId, b.diameter, b.lengthMm, { fromCart: true });
    expect(st.device!.box).toEqual({ useBy: b.useBy, expired: true });
    // the label shows the use-by date and the case's date; the engine flags it when it is read back
    expect(deviceBoxLabel(st.device!, MP_CASE_DATE).useBy).toBe(b.useBy);
    const events0 = st.events.length;
    st = checkLabel(st);
    expect(st.events.slice(events0).some((e) => e.tone === "warn" && e.text.includes(b.useBy) && /out of date/.test(e.text))).toBe(true);
    expect(trayOf(st).labelChecks).toHaveLength(1);
    expect(trayOf(st).labelChecks[0]).toMatchObject({ expired: true, useBy: b.useBy });
    // used anyway: recorded when it goes into the guide, and the debrief says so
    st = advanceDevice(x.s, x.g, setValve(backloadDevice(prepareDevice(st)), true), 1);
    expect(trayOf(st).expiredUsed).toHaveLength(1);
    expect(st.log.some((r) => r.kind === "device" && r.data.action === "expired-used")).toBe(true);
    const lines = trayDebrief(st, x.s).map((l) => l.text);
    expect(lines.some((l) => /out-of-date device was used/.test(l) && l.includes(b.useBy))).toBe(true);
  });

  it("sent back, the next box of that size is in date and nothing is recorded as used", () => {
    const x = lab();
    const b = expiredBalloon(x.st);
    let st = checkLabel(requestDevice(x.st, b.specId, b.diameter, b.lengthMm, { fromCart: true }));
    st = returnBox(st);
    expect(st.device).toBeNull();
    st = checkLabel(requestDevice(st, b.specId, b.diameter, b.lengthMm, { fromCart: true }));
    expect(st.device!.box!.expired).toBe(false);
    st = advanceDevice(x.s, x.g, setValve(backloadDevice(prepareDevice(st)), true), 1);
    expect(trayOf(st).expiredUsed).toEqual([]);
    expect(trayDebrief(st, x.s).find((l) => /found at the label check/.test(l.text))).toMatchObject({ ok: true });
  });

  it("the cart is seeded, the check is due in CTO and calcified cases, and it lists missing or out-of-date bail-out items", () => {
    expect(buildCart(undefined, "a")).toEqual(buildCart(undefined, "a"));
    expect(buildCart(undefined, "a")).not.toEqual(buildCart(undefined, "b"));
    expect(cartCheckDue(lab("rca-cto", "guide-engaged").s)).toBe(true);
    expect(cartCheckDue(lab("rca-calcified", "guide-engaged").s)).toBe(true);
    expect(cartCheckDue(lab().s)).toBe(false);
    // over a few seeds the check list has problems to find, and every listed item has sizes
    const problems = ["s1", "s2", "s3", "s4"].map((s) => cartProblems(buildCart(undefined, s)).length);
    expect(problems.some((n) => n > 0)).toBe(true);
    for (const item of cartCheckList(buildCart(undefined, "s1"))) expect(item.sizes.length).toBeGreaterThan(0);
  });
});

describe("the wire's table set-up", () => {
  it("a wire introduced without the introducer gets tipDamaged and a measurably larger torque lag", () => {
    const x = lab("lad-focal", "guide-engaged");
    expect(x.st.tipMm).toBeLessThanOrEqual(0);
    const good = setUpWire(x.st, { yConnector: "rotating", introducer: true, tipHidden: true, throughValve: true, torqueDeviceCm: 90 });
    const bad = setUpWire(x.st, { yConnector: "rotating", introducer: false, tipHidden: false, throughValve: false, torqueDeviceCm: 90 });
    expect(good.wire.tipDamaged ?? null).toBeNull();
    expect(bad.wire.tipDamaged).toMatchObject({ cause: "no-introducer" });
    // the same moves on both wires: out into the coronary, then the lag at the same position
    const drive = (st: PciState) => {
      let n = st;
      for (let i = 0; i < 12; i++) n = moveWire(x.s, x.g, n, 5);
      return torqueWire(n, 0.2);
    };
    const g2 = drive(good);
    const b2 = drive(bad);
    expect(b2.tipMm).toBeGreaterThan(0);
    expect(torqueLag(b2.wire)).toBeGreaterThan(torqueLag(g2.wire) * 1.2);
    expect(torqueLag(b2.wire)).toBeCloseTo(torqueLag({ ...b2.wire, tipDamaged: null }) * MP_TIP_DAMAGE_TORQUE - (MP_TIP_DAMAGE_TORQUE - 1) * b2.wire.grip / b2.wire.kT, 9);
    // the tip not hidden, or the introducer short of the valve, damage it too; the record says why
    expect(setUpWire(x.st, { yConnector: "automated", introducer: true, tipHidden: false, throughValve: true, torqueDeviceCm: null }).wire.tipDamaged?.cause).toBe("tip-not-hidden");
    expect(setUpWire(x.st, { yConnector: "automated", introducer: true, tipHidden: true, throughValve: false, torqueDeviceCm: null }).wire.tipDamaged?.cause).toBe("introducer-short");
    expect(trayDebrief(bad).some((l) => /tip was damaged on loading \(no introducer\)/.test(l.text))).toBe(true);
    // a wire already in the artery is not set up again
    expect(setUpWire(lab().st, { yConnector: "rotating", introducer: false, tipHidden: false, throughValve: false, torqueDeviceCm: null }).wire.tipDamaged ?? null).toBeNull();
  });
});

describe("the pre-device checklist and the scrub nurse", () => {
  it("records the wire check and the guide before each device, and after a removal the guide must be cleared again", () => {
    const x = lab();
    let st = injectNow(x, x.st);
    st = advanceDevice(x.s, x.g, setValve(backloadDevice(prepareDevice(checkLabel(requestDevice(st, "sc", 2.5, 15)))), true), 1);
    expect(trayOf(st).checklist[0]).toMatchObject({ wireChecked: true, guideClear: true });
    st = removeDevice(st);
    expect(trayOf(st).guideClear).toBe(false);
    // second device with no injection and no aspiration since the removal
    st = advanceDevice(x.s, x.g, backloadDevice(prepareDevice(checkLabel(requestDevice(st, "nc", 3.0, 12)))), 1);
    expect(trayOf(st).checklist[1]).toMatchObject({ wireChecked: false, guideClear: false });
    expect(trayMentorInput(st)).toEqual({ guideNotCleared: true, expiredDevice: false });
    expect(trayDebrief(st).some((l) => /without the wire tip checked/.test(l.text))).toBe(true);
    expect(trayMentorInput(aspirateGuide(st)).guideNotCleared).toBe(false);
  });

  it("the scrub nurse does the next step on request, marked assisted and listed in the debrief", () => {
    const x = lab();
    let st = requestDevice(x.st, "sc", 2.5, 15);
    const steps: string[] = [];
    for (let i = 0; i < 4 && nextAssistStep(st); i++) {
      steps.push(nextAssistStep(st)!);
      st = assistStep(st);
    }
    expect(steps).toEqual(["label", "prepare", "backload"]);
    expect(st.device).toMatchObject({ assisted: true, stage: "backloaded", prepared: true, labelChecked: true });
    expect(trayOf(st).assisted.map((a) => a.step)).toEqual(steps);
    expect(trayDebrief(st).some((l) => /scrub nurse did 3 steps/.test(l.text))).toBe(true);
  });
});

describe("fix pass: the scrub nurse, the wire set-up and the syringe", () => {
  it("a device already on the wire or in the guide is not labelled or prepared after the fact, and nothing is marked assisted", () => {
    const x = lab();
    // asked for, backloaded with no label check and no preparation, introduced through the open valve
    let st = setValve(backloadDevice(requestDevice(x.st, "sc", 2.5, 15)), true);
    st = advanceDevice(x.s, x.g, st, 1);
    expect(st.device!.stage).toBe("in-guide");
    for (let i = 0; i < 2; i++) {
      const step = nextAssistStep(st);
      expect(step === null || step === "aspirate").toBe(true);
      if (step === "aspirate") st = aspirateGuide(st);
      st = assistStep(st);
    }
    expect(st.device).toMatchObject({ labelChecked: false, prepared: false });
    expect(st.device!.assisted ?? false).toBe(false);
    expect(trayOf(st).assisted).toEqual([]);
    // a backloaded device: only the guide is left for the nurse, and the label is not read back on the wire
    const back = backloadDevice(requestDevice(x.st, "sc", 2.5, 15));
    expect(nextAssistStep(back) === null || nextAssistStep(back) === "aspirate").toBe(true);
    expect(checkLabel(back).device!.labelChecked).toBe(false);
    // a refused step (the backload with the wire tip still in the guide) is not booked as assisted
    const y = lab("lad-focal", "guide-engaged");
    let z = prepareDevice(checkLabel(requestDevice(y.st, "sc", 2.5, 15)));
    expect(nextAssistStep(z)).toBe("backload");
    const before = trayOf(z).assisted.length;
    z = assistStep(z);
    expect(z.device!.stage).not.toBe("backloaded");
    expect(trayOf(z).assisted).toHaveLength(before);
    expect(z.device!.assisted ?? false).toBe(false);
  });

  it("a second set-up of the same wire changes neither the load records nor the tip damage, and the form is not offered again", () => {
    const tray = pciConsoles().find((c) => c.id === "equipment-tray")!;
    const x = lab("lad-focal", "guide-engaged");
    const act = (x as unknown as { act: (a: string, f: (s: PciState) => PciState) => boolean }).act.bind(x);
    act("advance-wire", (s) => setUpWire(s, { yConnector: "rotating", introducer: false, tipHidden: false, throughValve: false, torqueDeviceCm: null }));
    expect(x.st.tipMm).toBeLessThanOrEqual(0);
    const loads = trayOf(x.st).wireLoads;
    expect(loads).toHaveLength(1);
    const again = setUpWire(x.st, { yConnector: "rotating", introducer: true, tipHidden: true, throughValve: true, torqueDeviceCm: 90 });
    expect(trayOf(again).wireLoads).toEqual(loads);
    expect(trayOf(again).wireSetup).toEqual(trayOf(x.st).wireSetup);
    expect(again.wire.tipDamaged).toMatchObject({ cause: "no-introducer" });
    expect(again.events[again.events.length - 1].text).toBe("This wire is already loaded.");
    const html = renderToStaticMarkup(createElement(tray.Component, { session: x }));
    expect(html).toContain("Loaded through the rotating valve.");
    expect(html).not.toContain("Load the wire");
  });

  it("every syringe message is reached over 0 to 3 suction cycles: large bubbles, then a few small ones, then none", () => {
    const x = lab();
    let st = fillPrepSyringe(requestDevice(x.st, "sc", 2.5, 15), "1:1");
    const seen = [syringeView(st.device!)];
    for (let i = 0; i < 3; i++) {
      st = applySuction(st);
      seen.push(syringeView(st.device!));
    }
    expect(seen).toEqual(["Filled, not yet put on negative", "Large bubbles rise into the syringe", "A few small bubbles still rise", "No more bubbles rise"]);
  });
});

describe("the consoles by mode", () => {
  it("the equipment tray is offered in every mode; the assisted device path only in guided practice, its injection controls in every mode", () => {
    expect(pciConsoles().map((c) => c.id)).toContain("equipment-tray");
    const assisted = pciConsoles().find((c) => c.id === "assisted-devices")!;
    for (const mode of ["guided", "supervised", "independent", "exam"] as const) {
      const ids = consolesFor(mode).map((c) => c.id);
      expect(ids, mode).toContain("equipment-tray");
      expect(ids, mode).toContain("assisted-devices");
      const html = renderToStaticMarkup(createElement(assisted.Component, { session: lab("lad-focal", "wire-across", mode) }));
      expect(html.includes("Load on the wire"), mode).toBe(mode === "guided");
      for (const k of ["Test puff", "Forceful", "Flush guide"]) expect(html, `${mode} ${k}`).toContain(k);
      // a thrombus scenario keeps the intracoronary vasodilator in every mode
      const stemi = lab("lcx-stemi", "wire-across", mode);
      expect(stemi.s.thrombus).toBeTruthy();
      expect(renderToStaticMarkup(createElement(assisted.Component, { session: stemi })), mode).toContain("Intracoronary vasodilator");
    }
  });

  it("outside guided practice the scrub nurse is asked for the next step without the step named", () => {
    const tray = pciConsoles().find((c) => c.id === "equipment-tray")!;
    for (const mode of ["guided", "independent", "exam"] as const) {
      const x = lab("lad-focal", "wire-across", mode);
      const act = (x as unknown as { act: (a: string, f: (s: PciState) => PciState) => boolean }).act.bind(x);
      act("load-device", (s) => checkLabel(requestDevice(s, "sc", 2.5, 15, { fromCart: true })));
      const html = renderToStaticMarkup(createElement(tray.Component, { session: x }));
      expect(html.includes("Ask the scrub nurse to prepare the balloon"), mode).toBe(mode === "guided");
      expect(html.includes("Ask the scrub nurse for the next step"), mode).toBe(mode !== "guided");
      if (mode !== "guided") expect(html, mode).not.toContain("Ask the scrub nurse to ");
    }
  });

  it("the label shows every line of the box, its notes included, and a backloaded device can be taken off the wire", () => {
    const tray = pciConsoles().find((c) => c.id === "equipment-tray")!;
    const x = lab();
    const act = (x as unknown as { act: (a: string, f: (s: PciState) => PciState) => boolean }).act.bind(x);
    act("load-device", (s) => checkLabel(requestDevice(s, "sc", 2.5, 15, { fromCart: true })));
    const label = deviceBoxLabel(x.st.device!, MP_CASE_DATE);
    const notes = label.lines.filter((l) => l.k === "Note");
    expect(notes.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(createElement(tray.Component, { session: x }));
    for (const n of notes) expect(html).toContain(n.v);
    act("load-device", (s) => backloadDevice(prepareDevice(s)));
    expect(x.st.device!.stage).toBe("backloaded");
    expect(renderToStaticMarkup(createElement(tray.Component, { session: x }))).toContain("Take it off the wire");
    act("remove-device", removeDevice);
    expect(x.st.device).toBeNull();
  });

  it("the wire set-up starts with nothing chosen, and once the wire is in it shows the set-up it was loaded with", () => {
    const tray = pciConsoles().find((c) => c.id === "equipment-tray")!;
    const x = lab("lad-focal", "guide-engaged");
    const html = renderToStaticMarkup(createElement(tray.Component, { session: x }));
    const setUp = html.slice(html.indexOf("Wire set-up"));
    expect(setUp).toContain("Introducer");
    expect(setUp).not.toMatch(/checked=""/);
    expect(setUp).toMatch(/<option value="0" selected="">No torque device stop<\/option>/);
    const act = (x as unknown as { act: (a: string, f: (s: PciState) => PciState) => boolean }).act.bind(x);
    act("advance-wire", (s) => setUpWire(s, { yConnector: "rotating", introducer: true, tipHidden: true, throughValve: true, torqueDeviceCm: 90 }));
    for (let i = 0; i < 12; i++) act("advance-wire", (s) => moveWire(x.s, x.g, s, 5));
    expect(x.st.tipMm).toBeGreaterThan(0);
    expect(trayOf(x.st).wireLoads[0].kind).toBe(x.st.wireKind);
    expect(renderToStaticMarkup(createElement(tray.Component, { session: x }))).toContain("Loaded through the rotating valve, torque device at 90 cm.");
  });

  it("renders the request, then the box, the label, the prep station and the valve as the steps go", () => {
    const tray = pciConsoles().find((c) => c.id === "equipment-tray")!;
    const x = lab();
    const html0 = renderToStaticMarkup(createElement(tray.Component, { session: x }));
    for (const k of ["Ask for a device", "Ask for the box", "Back-bleed and aspirate the guide", "Wire set-up"]) expect(html0).toContain(k);
    // guided practice shows the checklist as a teaching aid; independent practice does not
    expect(html0).toContain("Inject to see the wire tip before the device goes in");
    const ind = lab("lad-focal", "wire-across", "independent");
    expect(renderToStaticMarkup(createElement(tray.Component, { session: ind }))).not.toContain("Inject to see the wire tip");
    const act = (x as unknown as { act: (a: string, f: (s: PciState) => PciState) => boolean }).act.bind(x);
    act("load-device", (s) => requestDevice(s, "sc", 2.5, 15, { fromCart: true }));
    const html1 = renderToStaticMarkup(createElement(tray.Component, { session: x }));
    for (const k of ["Read the label back", "Send the box back", "Prep station", "Fill the syringe", "Pull negative, plunger up", "Syringe not filled"]) expect(html1).toContain(k);
    act("load-device", checkLabel);
    const html2 = renderToStaticMarkup(createElement(tray.Component, { session: x }));
    for (const k of ["Use by", "Today", MP_CASE_DATE, "Rated burst pressure"]) expect(html2).toContain(k);
    act("load-device", (s) => backloadDevice(prepareDevice(s)));
    const html3 = renderToStaticMarkup(createElement(tray.Component, { session: x }));
    for (const k of ["Open the valve", "Introduce through the valve"]) expect(html3).toContain(k);
    expect(html3).not.toContain("Prep station");
  });
});

describe("the tray's rules", () => {
  const ctx = (pci: Record<string, unknown>, pending?: string) => ({ pci, pending }) as unknown as MentorCtx;
  const rule = (id: string) => RULES.find((r) => r.id === id)!;

  it("are registered, and stop the device or the injection in the situations they name", () => {
    for (const id of ["device-wire-in-branch", "inject-guide-not-cleared", "expired-device"]) expect(rule(id), id).toBeTruthy();
    expect(rule("device-wire-in-branch").stopOn!("advance-device", ctx({ deviceAtGuideTip: true, wireTipDistal: true }))).toBe(true);
    expect(rule("device-wire-in-branch").stopOn!("advance-device", ctx({ deviceAtGuideTip: true, wireTipDistal: false }))).toBe(false);
    expect(rule("inject-guide-not-cleared").stopOn!("inject", ctx({ guideNotCleared: true }, "inject"))).toBe(true);
    expect(rule("inject-guide-not-cleared").stopOn!("inject", ctx({}, "inject"))).toBe(false);
    expect(rule("expired-device").when(ctx({ expiredDevice: true }))).toBe(true);
    for (const id of ["device-wire-in-branch", "inject-guide-not-cleared", "expired-device"]) for (const lv of [1, 2, 3, 4, 5] as const) expect(rule(id).lines[lv]!(ctx({}))).not.toMatch(/score|point|%/);
  });
});

describe("practice links (pci-equipment-tray)", () => {
  const FILE = /pci-equipment-tray\.launch\.ts$/;
  it("practiceIndex lists lad-focal under pm-prep-and-stent-balloon-choose, pm-prep-and-stent-balloon-inflate and pm-prep-and-stent-prep-why", () => {
    expect(TRAY_LAUNCH.sim).toBe("angio-pci");
    for (const lesson of ["pm-prep-and-stent-balloon-choose", "pm-prep-and-stent-balloon-inflate", "pm-prep-and-stent-prep-why"]) {
      const mine = practiceForLesson(lesson, PRACTICE_INDEX).filter((e) => e.sim === "angio-pci" && FILE.test(e.source));
      expect(mine.map((e) => e.scenario), lesson).toEqual(["lad-focal"]);
      expect(mine[0].params).toMatchObject({ scenario: "lad-focal", start: "wire-across", mode: "guided" });
    }
    const cart = practiceForLesson("eq-balloons-stents-cart-cart", PRACTICE_INDEX).filter((e) => FILE.test(e.source));
    expect(cart.map((e) => e.scenario).sort()).toEqual(["rca-calcified", "rca-cto"]);
    expect(practiceForLesson("pm-wiring-shape-load", PRACTICE_INDEX).filter((e) => FILE.test(e.source)).map((e) => e.scenario)).toEqual(["lad-focal"]);
    expect(PRACTICE_INDEX.known.problems.filter((p) => p.includes("pci-equipment-tray"))).toEqual([]);
  });

  it("every link opens the PCI lab at its start", () => {
    for (const l of TRAY_LAUNCH.links ?? []) {
      const x = lab(l.scenario!, l.start!);
      expect(x.startDef.id).toBe(l.start);
    }
  });
});
