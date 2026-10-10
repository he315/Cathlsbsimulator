// ---------------------------------------------------------------------------
// Equipment workflow: device boxes from the tray, label check, preparation,
// backloading, the haemostatic valve, delivery against the guide's back-up
// with wire drag, and removal. loadDevice and moveDevice are the assisted
// compatibility path kept for headless tests.
//
// Delivery (pci-device-delivery). advanceDevice is the delivery path: inside
// the guide the device runs freely (its shaft length beyond the valve is
// deviceShaftMm, the 90 and 100 cm shaft marks on the table read it); a
// device that leaves the guide tip with the beam off counts in
// counters.unscreened; beyond the tip it meets the rail and the lesion
// (guide.ts deliver). The pins choose the technique: the wire pinned
// (two-hand technique) is not dragged; the guide held as well (the
// independent-hand technique) adds back-up, takes part of a stalled push's
// back-out (a push needing more than the guide alone holds is recorded as
// the forward push) and seats the guide a little with
// each push beyond the guide tip. A back-out pulls an
// unpinned wire back; a withdrawal against friction draws an unheld guide
// in; a stent pulled back into a guide that is not coaxial is deformed. The
// support menu (forward push, deep seat, guide exchange, buddy wire,
// support-wire exchange, partial wire withdrawal, anchor balloon, deep
// breath, guide extension, support catheters) is recorded with
// recordSupport, the hand-performed ones once per series of bites with
// noteSupport; the guide extension is delivered stepwise (moveExtension:
// over the bare wire, over a device, by inchworming with a straddling
// balloon deflating, or by balloon-assisted tracking with the balloon and
// the extension advanced together), its push rod parked under a towel, its
// collar kept inside the guide. applyStartSetup opens a start state with a
// device already stopped at the lesion edge (the stuck-stent start). Every
// force and share here is a MODEL PARAMETER
// (docs/realism/facts/pkg-pci-device-delivery.md) unless it cites the module
// text.
//
// The table workflow (pci-equipment-tray). requestDevice takes a box (from
// the cart with fromCart: its stock and use-by dates, src/simulation/pci/
// cart.ts); checkLabel reads the label back and flags an out-of-date box,
// which returnBox sends back; the prep station fills the syringe with a
// mixture (fillPrepSyringe), pulls negative with the plunger up
// (applySuction: each cycle leaves less air) and connects the indeflator
// (connectIndeflator), and prepareDevice does all three with the usual 1:1;
// backloadDevice needs the wire tip at least 20 mm distal; an unprepared
// device carries air into the guide when it is introduced, and every
// introduction records the pre-device checklist (wire tip checked by an
// injection and out of a small branch, guide back-bled and aspirated since
// the last removal) and an out-of-date device; aspirateGuide clears the
// guide. setUpWire records the Y-connector, introducer and torque device of a
// wire still in the guide: a tip not hidden in the introducer, or an
// introducer not through the valve, damages it (coronaryWire.ts
// tipDamaged). assistStep has the scrub nurse do the next step (marked
// Device.assisted). checkCart and restockCart are the cart check and the
// restock. The truth (expired use, checklist misses) is in st.tray for the
// debrief (cart.ts trayDebrief), never shown live. Values are MODEL
// PARAMETERS (docs/realism/facts/pkg-pci-equipment-tray.md) or cite the module.
// ---------------------------------------------------------------------------

import { DEVICE_BY_ID, MP_WIRE_DRAG, WIRE_SPEC as WIRE_SPECS, chartDiameter, deviceFor, type BalloonKind, type DeviceSpec } from "../equipment";
import { EXCHANGE_LENGTH_CM, cloneWire, dragWire, type TipDamageCause } from "../coronaryWire";
import { MP_UNPREPARED_GUIDE_AIR_ML, airAfterSuction, cartOf, preparedNow, restocked, takeBox } from "../cart";
import { cloneCx } from "../../complications/engine";
import {
  GUIDE_NON_COAXIAL,
  MP_BREATH_BEND_SCALE,
  MP_DISENGAGE_MM,
  MP_SHAFT_SLACK_MM,
  backupForce,
  deliver,
  extensionCollarMm,
  lesionLoad,
  railFriction,
  withExtension,
  type DeliveryInput,
  type DeliveryResult,
  type GuideExtension,
  type GuideState,
  type SupportCatheterKind,
} from "../guide";
import { branchesOf, pathTo, radiusAtMm } from "../geometry";
import { drawBurst, initialIndeflator } from "../indeflator";
import { actGate } from "../lesionAssessment";
import { onAspirate, onDeviceIntroduced, onDeviceThrough, onValveOpened } from "../../complications/engine";
import { THIN_STRUT_DES, ringCount } from "../stentGeometry";
import {
  activeRailOf,
  deliveryOf,
  ensureRails,
  lesionNow,
  log,
  railsOf,
  withRail,
  type Placed,
  specOf,
  syncWire,
  tele,
  trayOf,
  wireOf,
  withNotes,
  type BalloonMixture,
  type TrayRecord,
  type WireSetup,
  type DeliveryRecord,
  type Device,
  type DeviceKind,
  type PciGeom,
  type PciScenario,
  type PciStartSetup,
  type PciState,
  type SupportOption,
} from "../state";
import wireInternal from "./wire";

// --- model parameters (docs/realism/facts/pkg-pci-device-delivery.md) -----------------------------

/** A guide whose length is not set is the usual 100 cm (guide.ts GuideState.lengthCm). */
export const DEFAULT_GUIDE_LENGTH_CM = 100;
/**
 * The device's shaft marks (cm from its distal tip): with the first at the Y-connector of a 90 cm guide, or
 * the second at that of a 100 cm guide, the device is close to the guide tip (pm-prep-and-stent-delivery,
 * 'Step 7', Brilakis 9.7.7). That the marks sit exactly at the guide lengths (the Y-connector's own length
 * ignored) is a MODEL PARAMETER.
 */
export const SHAFT_MARKS_CM: readonly number[] = [90, 100];
/** A guide pushed back more than this (mm) by a push counts as a back-out (the engine's long-standing threshold). MODEL PARAMETER. */
export const MP_BACKOUT_MM = 0.3;
/** Share of a guide back-out that pulls an unpinned wire's tip back with it. MODEL PARAMETER. */
export const MP_WIRE_RETREAT_SHARE = 0.5;
/** Share of a withdrawal in the vessel that draws an unheld guide in, times the friction over the back-up (0..1). MODEL PARAMETER. */
export const MP_SUCK_SHARE = 0.4;
/** Largest suck-in of one pull (mm), and the suck-in worth a line in the log (mm). MODEL PARAMETERS. */
export const MP_SUCK_MAX_MM = 1.5;
export const MP_SUCK_LOG_MM = 0.3;
/**
 * The guide held by the left hand is seated this share of the part of each device push beyond the guide tip
 * (travel inside the guide shaft seats nothing), up to this much per push (mm) and this depth (mm). The depth
 * cap stays below GUIDE_TOO_DEEP_MM (3 mm), inside the 2-3 mm seat pm-wiring-guide-seat calls optimal, so the
 * left hand alone never makes the guide too deep. MODEL PARAMETERS.
 */
export const MP_HELD_SEAT_SHARE = 0.1;
export const MP_HELD_SEAT_MAX_MM = 0.5;
export const MP_HELD_SEAT_DEPTH_MAX = 2.5;
/** Contact length of a guide extension's tip on the rail (mm). MODEL PARAMETER. */
export const MP_EXT_TIP_CONTACT_MM = 20;
/**
 * Rail friction of a guide extension advanced beyond the guide tip, by how it is delivered, as a share of
 * the bare-wire friction: over the bare wire; over a balloon or microcatheter shaft; inchworming over a
 * straddling balloon as it deflates; balloon-assisted tracking with the inflated balloon and the
 * extension advanced together. The ordering (bare wire worst, a balloon centring the tip best) follows
 * cp-uncrossable-extension-combined (Brilakis 30.3.3); the values are MODEL PARAMETERS.
 */
export const MP_EXT_MODE_SCALE = { bare: 1, "over-device": 0.6, inchworm: 0.2, bat: 0.3 } as const;
export type ExtensionMode = keyof typeof MP_EXT_MODE_SCALE | "blocked";
/** Load of the extension's edge riding the bare wire, per unit of the curvature at its tip (N per 1/mm), before the calcium factor (1 + calcium x resistance). MODEL PARAMETER. */
export const MP_EXT_EDGE_CATCH_N = 0.3;
/** A balloon straddles the extension's tip when it reaches at least this far on each side of it (mm). MODEL PARAMETER. */
export const MP_STRADDLE_MM = 2;
/** The extension stops this far short of the balloon or microcatheter tip it rides over, and of the wire tip (mm). MODEL PARAMETERS. */
export const MP_EXT_MARGIN_MM = 2;
export const MP_EXT_WIRE_MARGIN_MM = 15;
/** A straddling balloon still holds the extension above this pressure (atm). MODEL PARAMETER. */
export const MP_ANCHOR_HOLD_ATM = 0.5;
/** A device parked this close behind the collar (mm) and pushed again is forced against it. MODEL PARAMETER. */
export const MP_COLLAR_STOP_MM = 0.5;
/**
 * Side-branch anchor balloon: sized 1:1 to the branch and inflated at low pressure, 4-8 atm in chapter 9
 * and 6-8 atm in chapter 23 (cp-uncrossable-first-line, 'Side-branch anchor'). A balloon more than this
 * fraction above the branch's reference diameter counts as oversized (the tolerance is a MODEL PARAMETER).
 */
export const ANCHOR_ATM_RANGE: readonly [number, number] = [4, 8];
export const MP_ANCHOR_OVERSIZE = 1.1;
/** How long a deep breath is held (s). MODEL PARAMETER. */
export const MP_BREATH_HOLD_S = 10;
/**
 * The scaffold support catheters need at least 10 mm of vessel before the lesion to land in, and cannot be
 * removed by trapping: 300 cm wires are needed (eq-sheaths-guides-extension-device, Brilakis 30.4). The text
 * gives these limits to the scaffold type only; setSupportCatheter applies them to it alone.
 */
export const SUPPORT_LANDING_MM = 10;

/** The wire tip must be at least this far into the coronary before a device is backloaded (mm; the plan's "tip at least 20 mm distal"). */
export const BACKLOAD_MIN_TIP_MM = 20;

const inflatableKind = (k: DeviceKind) => k === "balloon" || k === "stent" || k === "covered-stent";

function withTray(st: PciState, f: (t: TrayRecord) => Partial<TrayRecord>): PciState {
  const t = trayOf(st);
  return { ...st, tray: { ...t, ...f(t) } };
}

export interface RequestOptions {
  /** take the box from the cart (its stock and use-by dates); absent: a fresh box from the team (headless scripts) */
  fromCart?: boolean;
  /** the scenario's stock id (PciScenarioDef.stock), used when the cart is first opened */
  stockId?: string;
}

/** Take a device box from the tray. */
export function requestDevice(st: PciState, specId: string, diameter: number, lengthMm: number, opts: RequestOptions = {}): PciState {
  if (st.device) return log(st, "warn", "Remove the current device first.");
  const spec = DEVICE_BY_ID[specId];
  if (!spec) return st;
  let n: PciState = st;
  let box: Device["box"] = null;
  if (opts.fromCart) {
    const cart = cartOf(st, opts.stockId);
    const got = takeBox(cart, specId, diameter, lengthMm);
    if (!got) return log(withTray(st, () => ({ cart })), "warn", `No ${spec.label.toLowerCase()} of that size is left on the cart.`);
    n = withTray(st, () => ({ cart: got.cart }));
    box = { useBy: got.useBy, expired: got.expired };
  }
  const rng = { ...n.rng };
  const kind: DeviceKind = spec.cls === "stent" ? "stent" : spec.cls === "covered-stent" ? "covered-stent" : spec.cls === "ivus" ? "ivus" : spec.cls === "extension" ? "extension" : "balloon";
  const dev: Device = {
    kind,
    specId,
    balloon: spec.balloon ?? "semi-compliant",
    diameter,
    lengthMm: kind === "ivus" ? 6 : lengthMm,
    centreMm: -400,
    atm: 0,
    inflated: false,
    stage: "box",
    labelChecked: false,
    prepared: kind === "ivus" || kind === "extension",
    assisted: false,
    burstAtm: spec.rbpAtm(diameter) > 0 ? drawBurst(rng, spec.rbpAtm(diameter)) : 99,
    ruptured: false,
    deployed: false,
    appliedAtm: 0,
  };
  if (inflatableKind(kind)) Object.assign(dev, { mixture: null, airFraction: 1, suctionCycles: 0, indeflatorConnected: false });
  if (box) dev.box = box;
  return log({ ...n, rng, device: dev, ind: initialIndeflator() }, "info", `${spec.label}${diameter ? ` ${diameter.toFixed(2)} × ${lengthMm} mm` : ""} opened onto the table.`);
}

/** Read the box label back (type, size, pressures, use-by date): an out-of-date box is flagged here. */
export function checkLabel(st: PciState): PciState {
  const dev = st.device;
  if (!dev) return st;
  // the label is read before the box is opened: a device already on the wire keeps its record (label not checked)
  if (!dev.labelChecked && (dev.stage === "backloaded" || dev.stage === "in-guide")) return log(st, "warn", "The device is already on the wire: the label is read back before the box is opened.");
  let n: PciState = { ...st, device: { ...dev, labelChecked: true, stage: dev.stage === "box" ? "checked" : dev.stage } };
  if (dev.labelChecked) return n;
  const expired = !!dev.box?.expired;
  const useBy = dev.box?.useBy ?? "";
  n = withTray(n, (t) => ({ labelChecks: [...t.labelChecks, { t: st.t, specId: dev.specId, diameter: dev.diameter, lengthMm: dev.lengthMm, useBy, expired }] }));
  n = tele(n, "device", { action: "label-check", specId: dev.specId, diameter: dev.diameter, lengthMm: dev.lengthMm, expired });
  return expired ? log(n, "warn", `Label read back: use by ${useBy}. The box is out of date: send it back and ask for another.`) : n;
}

/** Send the box back unopened (an out-of-date box, or the wrong device), before it goes on the wire. */
export function returnBox(st: PciState): PciState {
  const dev = st.device;
  if (!dev) return st;
  if (dev.stage === "backloaded" || dev.stage === "in-guide") return log(st, "warn", "The device is already on the wire.");
  const n = withTray({ ...st, device: null, ind: initialIndeflator() }, (t) => ({ returned: [...t.returned, { t: st.t, specId: dev.specId, expired: !!dev.box?.expired }] }));
  return tele(log(n, "info", "Box sent back."), "device", { action: "return", specId: dev.specId, expired: !!dev.box?.expired });
}

function prepStep(st: PciState, f: (d: Device) => Partial<Device>, text: string): PciState {
  const dev = st.device;
  if (!dev) return st;
  if (!inflatableKind(dev.kind)) return log(st, "warn", "This device has no balloon to prepare.");
  if (dev.stage === "in-guide") return log(st, "warn", "The device is already in the guide.");
  const d: Device = { ...dev, ...f(dev) };
  d.airFraction = airAfterSuction(d.suctionCycles ?? 0, d.mixture);
  const was = dev.prepared;
  d.prepared = preparedNow(d);
  if (d.prepared && (d.stage === "box" || d.stage === "checked")) d.stage = "prepared";
  return log({ ...st, device: d }, "info", d.prepared && !was ? `${text} The balloon is prepared.` : text);
}

/** Fill the Luer-lock syringe with a mixture and attach it to the balloon's hub (pm-prep-and-stent, Step 4). */
export function fillPrepSyringe(st: PciState, mixture: BalloonMixture): PciState {
  const what = mixture === "1:1" ? "half contrast and half saline" : mixture === "1:2" ? "one part contrast to two of saline" : mixture === "saline" ? "saline" : "nothing (air)";
  return prepStep(st, () => ({ mixture, suctionCycles: 0 }), `Prep syringe filled with ${what}.`);
}

/** One negative suction cycle with the plunger pointing up: the air rises into the syringe. */
export function applySuction(st: PciState): PciState {
  return prepStep(st, (d) => ({ suctionCycles: (d.suctionCycles ?? 0) + 1 }), "Negative pressure with the plunger up.");
}

/** Attach the inflation device and apply negative pressure. */
export function connectIndeflator(st: PciState): PciState {
  return prepStep(st, () => ({ indeflatorConnected: true }), "Indeflator connected, on negative.");
}

export interface PrepareOptions {
  mixture?: BalloonMixture;
  /** negative suction cycles (default 3) */
  cycles?: number;
}

/** Prepare the balloon: the syringe filled (default 1:1), negative pressure with the plunger up, the indeflator connected. */
export function prepareDevice(st: PciState, opts: PrepareOptions = {}): PciState {
  if (!st.device) return st;
  if (st.device.stage === "in-guide") return log(st, "warn", "The device is already in the guide.");
  if (!inflatableKind(st.device.kind)) return { ...st, device: { ...st.device, prepared: true } };
  const cycles = opts.cycles ?? 3;
  const mixture = opts.mixture ?? "1:1";
  const d: Device = { ...st.device, mixture, suctionCycles: cycles, indeflatorConnected: true };
  d.airFraction = airAfterSuction(cycles, mixture);
  d.prepared = preparedNow(d);
  if (d.prepared && (d.stage === "box" || d.stage === "checked")) d.stage = "prepared";
  return log({ ...st, device: d }, "info", d.prepared ? "Balloon prepared: negative pressure, air purged, contrast mixture in the inflation device." : "Balloon prepared, but air is left in it.");
}

/** Backload the device onto the wire (the wire held still, its tip at least BACKLOAD_MIN_TIP_MM into the coronary). */
export function backloadDevice(st: PciState): PciState {
  const dev = st.device;
  if (!dev) return st;
  if (dev.stage === "backloaded" || dev.stage === "in-guide") return st;
  if (st.tipMm < BACKLOAD_MIN_TIP_MM && dev.kind !== "extension") return log(st, "warn", "Take the wire well into the distal vessel before loading a device.");
  const unprepared = !dev.prepared && inflatableKind(dev.kind);
  let n: PciState = { ...st, device: { ...dev, stage: "backloaded", centreMm: -dev.lengthMm / 2 - 60, ...(unprepared ? { carriedAirMl: MP_UNPREPARED_GUIDE_AIR_ML } : {}) } };
  if (!dev.labelChecked) n = { ...n, counters: { ...n.counters, uncheckedLabels: n.counters.uncheckedLabels + 1 } };
  if (unprepared) n = { ...n, counters: { ...n.counters, unpreparedDevices: n.counters.unpreparedDevices + 1 } };
  n = tele(n, "device", { action: "backload", kind: dev.kind, prepared: dev.prepared, labelChecked: dev.labelChecked });
  if (!st.wire.pinned) n = log(n, "info", "Device backloaded. Pin the wire before advancing.");
  return n;
}

export function setValve(st: PciState, open: boolean): PciState {
  if (open === st.valveOpen) return st;
  let n: PciState = { ...st, valveOpen: open };
  if (open) n = { ...n, cx: onValveOpened(n.cx) };
  return log(n, "info", open ? "Haemostatic valve opened: the guide pressure trace drops out." : "Haemostatic valve closed.");
}

/** Aspirate and flush the guide through the manifold (back-bleed): the air goes, and the guide is clear for the next injection. */
export function aspirateGuide(st: PciState): PciState {
  return log(withTray({ ...st, cx: onAspirate(st.cx) }, () => ({ guideClear: true })), "info", "Guide aspirated and flushed.");
}

/** An injection (the engine's 'inject' record) since the last device removal, or since the case started: the wire tip has been seen. */
export function wireSeenSinceRemoval(st: Pick<PciState, "log">): boolean {
  for (let i = st.log.length - 1; i >= 0; i--) {
    const r = st.log[i];
    if (r.kind === "inject") return true;
    if (r.kind === "device" && r.data.action === "remove" && r.data.stage === undefined) return false;
  }
  return false;
}

/** The device on the wire is being introduced at the valve: the checklist, the air it carries and an out-of-date box. */
function onIntroduce(st0: PciState, dev: Device): PciState {
  let st = st0;
  const t = trayOf(st);
  const wireChecked = wireSeenSinceRemoval(st);
  const entry = { t: st.t, wireChecked, wireInSmallBranch: !!st.wire.distal?.inDanger, guideClear: t.guideClear };
  st = withTray(st, (r) => ({ checklist: [...r.checklist, entry], guideClear: false }));
  if (dev.carriedAirMl && dev.carriedAirMl > 0) {
    const cx = cloneCx(st.cx);
    // the device's own air only: the valve air stays the engine's (airEmbolism.deviceIntroduced, drawn
    // only when the guide was not aspirated after the valve was opened), so the two are not counted twice
    cx.guideAirMl += dev.carriedAirMl;
    st = { ...st, cx };
  }
  if (dev.box?.expired) {
    st = withTray(st, (r) => ({ expiredUsed: [...r.expiredUsed, { t: st.t, specId: dev.specId, diameter: dev.diameter, lengthMm: dev.lengthMm, useBy: dev.box!.useBy }] }));
    st = tele(st, "device", { action: "expired-used", specId: dev.specId, useBy: dev.box.useBy });
  }
  return st;
}

/** The step the scrub nurse would do next for the device on the table (null when none is left for them). */
export function nextAssistStep(st: PciState): "label" | "prepare" | "backload" | "aspirate" | null {
  const dev = st.device;
  if (!dev) return trayOf(st).guideClear ? null : "aspirate";
  // on the wire or in the guide, the label and the preparation can no longer be done: only the guide is left
  if (dev.stage === "backloaded" || dev.stage === "in-guide") return trayOf(st).guideClear ? null : "aspirate";
  if (!dev.labelChecked) return "label";
  if (!dev.prepared && inflatableKind(dev.kind)) return "prepare";
  return "backload";
}

/** The scrub nurse does the next step on request (label, preparation, backload, aspiration): marked assisted for the debrief. */
export function assistStep(st: PciState): PciState {
  const step = nextAssistStep(st);
  if (!step) return log(st, "info", "Nothing for the scrub nurse to do on the table now.");
  let n = step === "label" ? checkLabel(st) : step === "prepare" ? prepareDevice(st) : step === "backload" ? backloadDevice(st) : aspirateGuide(st);
  // assisted only when the step's own effect happened (a refusal only logs, and leaves the device as it was)
  if (n === st || (step !== "aspirate" && n.device === st.device)) return n;
  if (n.device && step !== "aspirate") n = { ...n, device: { ...n.device, assisted: true } };
  n = withTray(n, (r) => ({ assisted: [...r.assisted, { t: st.t, step }] }));
  return tele(n, "device", { action: "assisted", step });
}

/**
 * Set up the coronary wire at the table and load it through the valve (pm-wiring-shape-load, Brilakis wiring
 * steps 3 to 5): the Y-connector's valve, the tip hidden in the introducer, the introducer pushed all the
 * way through the valve, and the torque device about 90 cm from the tip as a stop. Only for a wire still in
 * the guide. A wire preloaded in a microcatheter needs no introducer. A tip not hidden, or an introducer not
 * through the valve (the tip into the side arm), damages the tip (coronaryWire.ts tipDamaged).
 */
export function setUpWire(st: PciState, setup: WireSetup): PciState {
  if (st.tipMm > 0) return log(st, "warn", "The wire is already in the artery: set up the next wire before it goes in.");
  // one set-up per wire: a second one would add a load record that contradicts the first (and its tip damage)
  if (wireLoadedAtTable(st)) return log(st, "warn", "This wire is already loaded.");
  const preloaded = !!st.wire.micro;
  const cause: TipDamageCause | null = preloaded ? null : !setup.introducer ? "no-introducer" : !setup.tipHidden ? "tip-not-hidden" : !setup.throughValve ? "introducer-short" : null;
  let n: PciState = withTray(st, (r) => ({ wireSetup: { ...setup }, wireLoads: [...r.wireLoads, { t: st.t, kind: st.wireKind, damaged: !!cause, cause }] }));
  if (cause) n = syncWire(n, { ...cloneWire(n.wire), tipDamaged: { cause, t: st.t } });
  n = tele(n, "wire", { action: "load", yConnector: setup.yConnector, introducer: setup.introducer, tipHidden: setup.tipHidden, throughValve: setup.throughValve, torqueDeviceCm: setup.torqueDeviceCm, damaged: cause });
  return log(n, "info", `Wire loaded through the ${setup.yConnector === "automated" ? "automated" : "rotating"} haemostatic valve${setup.torqueDeviceCm ? `, torque device at ${setup.torqueDeviceCm} cm` : ""}.`);
}

/**
 * The wire on the table has been set up and loaded (setUpWire) since it was put on: the last wire record in
 * the log is the set-up's load, not a newer wire (setWireKind's 'wire-loaded', an exchange through a
 * microcatheter) or a new case.
 */
export function wireLoadedAtTable(st: Pick<PciState, "log">): boolean {
  for (let i = st.log.length - 1; i >= 0; i--) {
    const r = st.log[i];
    if (r.kind === "wire" && r.data.action === "load") return true;
    if (r.kind === "wire-loaded" || r.kind === "wire-exchange" || r.kind === "case-start") return false;
  }
  return false;
}

/** The cart check (before the first wire in a complex or CTO case): the cart opened and read, with the items the learner flagged. */
export function checkCart(st: PciState, flagged: readonly string[] = [], stockId?: string): PciState {
  const cart = cartOf(st, stockId);
  const n = withTray(st, (r) => ({ cart, cartCheckedT: r.cartCheckedT ?? st.t, cartFlags: [...new Set([...r.cartFlags, ...flagged])] }));
  return tele(n, "tray", { action: "cart-check", flagged: [...flagged] });
}

/** Restock the cart at the end of the case. */
export function restockCart(st: PciState, stockId?: string): PciState {
  const cart = restocked(cartOf(st, stockId));
  return tele(log(withTray(st, () => ({ cart, restocked: true })), "info", "Cart restocked."), "tray", { action: "restock" });
}

/**
 * Compatibility: load a balloon or stent with the team doing the steps (label checked, prepared,
 * backloaded, valve opened, guide aspirated). The device sits inside the guide just short of its tip.
 *
 * @deprecated Use requestDevice, checkLabel, prepareDevice, backloadDevice, setValve and advanceDevice.
 * Kept for headless tests and the assisted UI path until pci-lab-shell-session removes its UI callers.
 */
export function loadDevice(st: PciState, kind: "balloon" | "stent", balloon: BalloonKind, diameter: number, lengthMm: number): PciState {
  if (st.device) return log(st, "warn", "Remove the current device first.");
  if (st.tipMm < 30) return log(st, "warn", "Take the wire well into the distal vessel before loading a device.");
  const spec = deviceFor(kind, balloon);
  const rng = { ...st.rng };
  const dev: Device = {
    kind,
    specId: spec.id,
    balloon: spec.balloon ?? "semi-compliant",
    diameter,
    lengthMm,
    centreMm: -lengthMm / 2 - 2,
    atm: 0,
    inflated: false,
    stage: "in-guide",
    labelChecked: true,
    prepared: true,
    assisted: true,
    burstAtm: drawBurst(rng, spec.rbpAtm(diameter)),
    ruptured: false,
    deployed: false,
    appliedAtm: 0,
  };
  const cx = onAspirate(onValveOpened(st.cx));
  return log(
    tele({ ...st, rng, cx, valveOpen: true, device: dev, ind: initialIndeflator() }, "device", { action: "load", kind, diameter, lengthMm, centreMm: dev.centreMm }),
    "info",
    kind === "stent" ? `Stent ${diameter.toFixed(2)} × ${lengthMm} mm loaded on the wire.` : `${spec.label} ${diameter.toFixed(2)} × ${lengthMm} mm loaded.`
  );
}

/**
 * Compatibility: move a device along the wire without the delivery physics.
 *
 * @deprecated Use advanceDevice (delivery physics, back-up, wire drag). Kept for headless tests and the
 * assisted UI path until pci-lab-shell-session removes its UI callers.
 */
export function moveDevice(st0: PciState, d: number): PciState {
  let st = st0;
  const dev = st.device;
  if (!dev) return st;
  if (dev.inflated || st.ind.fill > 0.05) return log(st, "warn", "Deflate before moving the device.");
  const max = st.tipMm - dev.lengthMm / 2 - 6;
  let c = Math.max(-dev.lengthMm / 2 - 30, Math.min(max, dev.centreMm + d));
  // a wire outside a stent's struts (pci-two-rail-engine): the device stops at that stent's edge
  const distal0 = dev.centreMm + dev.lengthMm / 2;
  const edge = d > 0 ? railEdgeStop(st, distal0, c + dev.lengthMm / 2) : null;
  if (edge) {
    st = edge.st;
    c = edge.stopMm - dev.lengthMm / 2;
  }
  const out = tele({ ...st, device: { ...dev, centreMm: c }, injectedSinceDeviceMove: false }, "device", { action: "move", kind: dev.kind, centreMm: c });
  return c >= max - 0.01 && d > 0 ? log(out, "warn", "The device has reached the distal wire. Advance the wire first.") : out;
}

export interface AdvanceOptions {
  /** supervised mode: the ACT must have been checked before a device leaves the guide */
  supervised?: boolean;
  /**
   * the beam is on (fluoroscopy or cine) during the push: false counts a device whose distal end leaves the
   * guide tip in counters.unscreened. Absent: not judged (headless scripts)
   */
  screened?: boolean;
  /**
   * introduce a backloaded device at the Y-connector, its shaft at 0 (the lab's hands, which then push it down
   * the guide to the shaft mark). Absent: introduced just short of the guide tip (the headless default)
   */
  fromValve?: boolean;
  /**
   * the push is the lab's hands: a stalled bite backs the guide out by at most the travel not taken up plus
   * the shaft's slack (guide.ts MP_SHAFT_SLACK_MM). Absent: the engine's unbounded back-out (headless scripts)
   */
  byHand?: boolean;
}

/** The guide's length (mm). */
export function guideLengthMm(gs: Pick<GuideState, "lengthCm">): number {
  return 10 * (gs.lengthCm ?? DEFAULT_GUIDE_LENGTH_CM);
}

/** How much of the device's shaft is beyond the Y-connector (mm): its distal end's distance from the valve, 0 before it goes in. */
export function deviceShaftMm(st: Pick<PciState, "device" | "guide">): number {
  const d = st.device;
  if (!d || d.stage !== "in-guide") return 0;
  return Math.max(0, guideLengthMm(st.guide) + d.centreMm + d.lengthMm / 2);
}

/** The shaft marks (cm) already at or past the Y-connector. */
export function shaftMarksIn(st: Pick<PciState, "device" | "guide">): number[] {
  const mm = deviceShaftMm(st);
  return SHAFT_MARKS_CM.filter((cm) => mm >= cm * 10 - 1e-6);
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function withDelivery(st: PciState, f: (r: DeliveryRecord) => Partial<DeliveryRecord>): PciState {
  const r = deliveryOf(st);
  return { ...st, delivery: { ...r, ...f(r) } };
}

/**
 * The delivery inputs for the device on the wire with its distal end going from `fromMm` to `toMm`: the
 * lesion as it is now, the wire's support, and what the guide brings (an extension in the vessel, a held
 * deep breath, the left hand on the guide). advanceDevice and the input target's force probe both use it.
 */
export function deliveryInput(s: Pick<PciScenario, "calcium">, g: PciGeom, st: PciState, fromMm: number, toMm: number): DeliveryInput {
  const dev = st.device!;
  const ext = st.guide.ext;
  const inp: DeliveryInput = {
    spec: specOf(dev),
    diameter: dev.diameter,
    lengthMm: dev.lengthMm,
    fromMm,
    toMm,
    route: st.route,
    lesion: { vessel: g.lesion.vessel, startMm: g.lesion.startMm, endMm: g.lesion.endMm, mldMm: g.lesion.refDiameter * (1 - st.severity / 100), calcium: s.calcium, resistance: st.resistance },
    wireSupport: WIRE_SPECS[st.wireKind].support,
  };
  const extTip = ext ? ext.tipMm : st.guide.extensionMm;
  if (extTip !== null && extTip > 0) inp.extensionTipMm = extTip;
  if (breathHeld(st)) inp.bendScale = MP_BREATH_BEND_SCALE;
  if (st.guide.pinned) inp.guideHeld = true;
  return inp;
}

/** The patient is holding a deep breath now. */
export function breathHeld(st: Pick<PciState, "guide" | "t">): boolean {
  const u = st.guide.breathUntil;
  return u !== undefined && u !== null && st.t < u;
}

/** The technique the pins give: the independent-hand technique (guide and wire held), the two-hand technique (wire held), or neither. */
export function deliveryTechnique(st: Pick<PciState, "wire" | "guide">): "independent-hand" | "two-hand" | "unpinned" {
  if (st.wire.pinned && st.guide.pinned) return "independent-hand";
  return st.wire.pinned ? "two-hand" : "unpinned";
}

/** Advance (+) or withdraw (−) the device with the delivery physics: back-up, wire drag, workflow checks. */
export function advanceDevice(s: PciScenario, g: PciGeom, st0: PciState, d: number, opts: AdvanceOptions = {}): PciState {
  const dev0 = st0.device;
  if (!dev0) return st0;
  let st = st0;
  if (dev0.inflated || st.ind.fill > 0.05) return log(st, "warn", "Deflate fully before moving the device.");
  if (dev0.stage !== "in-guide") {
    if (d < 0) return st;
    if (dev0.stage !== "backloaded") return log(st, "warn", "Backload the device onto the wire first.");
    if (!st.valveOpen) return log(st, "warn", "Open the haemostatic valve to introduce the device.");
    st = onIntroduce(st, dev0);
    const ci = onDeviceIntroduced(st.cx, st.t, dev0.prepared);
    const centre = opts.fromValve ? -guideLengthMm(st.guide) - dev0.lengthMm / 2 : -dev0.lengthMm / 2 - 40;
    st = withNotes({ ...st, cx: ci.cx, device: { ...dev0, stage: "in-guide", centreMm: centre } }, ci.notes);
    st = tele(st, "device", { action: "introduce", kind: dev0.kind, prepared: dev0.prepared, fromValve: !!opts.fromValve });
    return st;
  }
  const dev = st.device!;
  const spec = specOf(dev);
  const distal = dev.centreMm + dev.lengthMm / 2;
  const maxDistal = st.tipMm - 6;
  let target = Math.min(distal + d, maxDistal);
  if (d > 0 && distal + d > maxDistal + 1e-6 && distal >= maxDistal - 0.01) return log(st, "warn", "The device has reached the distal wire. Advance the wire first.");
  // leaving the guide: ACT gate in supervised mode
  if (d > 0 && distal <= 0 && target > 0 && opts.supervised) {
    const gate = actGate(st.act?.value ?? null, st.heparinGiven);
    if (!gate.ok) {
      st = { ...st, counters: { ...st.counters, actSkipped: st.counters.actSkipped + 1 } };
      return log(st, "warn", gate.reason);
    }
  }
  if (d > 0 && distal < 0 && !st.guide.engaged && target > 0) return log(st, "warn", "The guide is out of the ostium: re-engage it over the wire before the device leaves it.");
  let advanced = 0;
  let guide = st.guide;
  let deformed = dev.deformed ?? null;
  let backMm = 0;
  if (d > 0) {
    // a guide extension's collar on the way: the wire wrapped round a loose push rod, or a stent catching
    const collar = collarStop(st, dev, distal, target);
    if (collar) {
      st = collar.st;
      guide = st.guide;
      target = Math.min(target, collar.stopMm);
      if (collar.deform) deformed = { at: "collar", t: st.t };
    }
    // a wire outside a stent's struts (pci-two-rail-engine): the device stops at that stent's edge
    const edge = railEdgeStop(st, distal, target);
    if (edge) {
      st = edge.st;
      target = edge.stopMm;
    }
    // the independent-hand technique: the left hand seats the guide a little with the part of the push
    // beyond the guide tip (none while the device is still running down the guide shaft)
    const outMm = Math.max(0, target - Math.max(distal, 0));
    if (guide.pinned && guide.engaged && outMm > 0 && guide.depthMm < MP_HELD_SEAT_DEPTH_MAX) {
      guide = { ...guide, depthMm: Math.min(MP_HELD_SEAT_DEPTH_MAX, guide.depthMm + Math.min(MP_HELD_SEAT_MAX_MM, MP_HELD_SEAT_SHARE * outMm)) };
    }
    // inside the guide the device runs freely; beyond its tip, against the back-up
    const inGuide = Math.max(0, Math.min(target, 0) - distal);
    advanced = inGuide;
    const from = Math.max(distal, 0);
    if (target > from) {
      // the back-up the guide would give without the left hand on it
      const unheld = guide.pinned ? backupForce({ ...guide, pinned: false }) : Infinity;
      const inp = deliveryInput(s, g, { ...st, guide }, from, target);
      if (opts.byHand) inp.slackMm = MP_SHAFT_SLACK_MM;
      const r = deliver(g, guide, inp);
      advanced += r.r.advancedMm;
      guide = r.gs;
      backMm = r.r.guideBackMm;
      // the left hand pushing the guide forward against a load the guide alone would not hold: the forward push of the support menu
      if (r.r.requiredN > unheld) st = noteSupport(st, "forward-push");
      if (r.r.guideBackMm > MP_BACKOUT_MM) {
        st = { ...st, counters: { ...st.counters, guideBackouts: st.counters.guideBackouts + 1 } };
        st = log(st, "warn", `Resistance: the device stops and the guide is pushed back out of the ostium (${r.r.guideBackMm.toFixed(1)} mm).`);
        st = tele(st, "guide-backout", { mm: r.r.guideBackMm, requiredN: r.r.requiredN, backupN: r.r.backupN });
      }
      if (r.r.disengaged) st = log(st, "danger", "The guide has backed out of the ostium. Re-engage it over the wire.");
    }
    target = distal + advanced;
    if (opts.screened === false && distal <= 0 && target > 0) {
      st = { ...st, counters: { ...st.counters, unscreened: st.counters.unscreened + 1 } };
      st = log(tele(st, "device-unscreened", { kind: dev.kind }), "warn", "The device has left the guide tip without fluoroscopy.");
    }
  } else {
    target = Math.max(-guideLengthMm(st.guide), distal + d);
    advanced = target - distal;
    if (advanced < 0 && distal > 0) {
      const w = withdrawEffects(s, g, { ...st, guide }, dev, distal, target);
      st = w.st;
      guide = w.guide;
      if (w.deformed) deformed = { at: "guide-tip", t: st.t };
    }
  }
  const newCentre = target - dev.lengthMm / 2;
  st = { ...st, guide, device: { ...dev, centreMm: newCentre, ...(deformed ? { deformed } : {}) }, injectedSinceDeviceMove: false };
  st = syncWire(st, { ...cloneWire(st.wire), guideEngaged: guide.engaged || st.tipMm > 3 });
  // the device drags an unpinned wire with it
  if (Math.abs(advanced) > 1e-6 && target > 0) {
    const dr = dragWire(g, wireOf(st), advanced, MP_WIRE_DRAG[spec.shaft], lesionNow(s, g, st));
    if (Math.abs(dr.migratedMm) > 0.2) {
      st = { ...st, counters: { ...st.counters, wireMigrationMm: st.counters.wireMigrationMm + Math.abs(dr.migratedMm) } };
      st = log(st, "warn", dr.migratedMm > 0 ? `The wire was not pinned: it has moved ${dr.migratedMm.toFixed(1)} mm further distal.` : `The wire was not pinned: it has been pulled back ${(-dr.migratedMm).toFixed(1)} mm.`);
      st = wireInternal.handleWireEvents(s, g, st, dr.w, dr.events);
    }
    if (advanced > 0) {
      const dt = onDeviceThrough(st.cx, st.t, { route: st.route, fromMm: target - dev.lengthMm, toMm: target });
      st = withNotes({ ...st, cx: dt.cx }, dt.notes);
    }
  }
  // a guide pushed back out of the ostium takes an unpinned wire back with it
  if (backMm > MP_BACKOUT_MM) st = wireRetreat(s, g, st, backMm);
  st = tele(st, "device", { action: "move", kind: dev.kind, diameter: dev.diameter, lengthMm: dev.lengthMm, centreMm: newCentre, beyondWire: target >= st.tipMm - 6, technique: deliveryTechnique(st) });
  return st;
}

/** The guide backed out by `backMm`: an unpinned wire in the vessel slips back by MP_WIRE_RETREAT_SHARE of it. */
function wireRetreat(s: PciScenario, g: PciGeom, st0: PciState, backMm: number): PciState {
  if (st0.wire.pinned || st0.tipMm <= 0) return st0;
  const dr = dragWire(g, wireOf(st0), -backMm * MP_WIRE_RETREAT_SHARE, 1, lesionNow(s, g, st0));
  if (Math.abs(dr.migratedMm) < 0.05) return st0;
  let st: PciState = { ...st0, counters: { ...st0.counters, wireMigrationMm: st0.counters.wireMigrationMm + Math.abs(dr.migratedMm) } };
  st = withDelivery(st, (r) => ({ wireRetreatMm: r.wireRetreatMm + Math.abs(dr.migratedMm) }));
  st = log(tele(st, "wire-retreat", { mm: -dr.migratedMm }), "warn", `The wire tip slips back ${(-dr.migratedMm).toFixed(1)} mm with the guide.`);
  return wireInternal.handleWireEvents(s, g, st, dr.w, dr.events);
}

/**
 * A device whose distal end reaches a guide extension's collar on this push: with the push rod not parked
 * under the towel the wire wraps round it and every device stops there; a stent meets a collar outside the
 * guide or in a guide that is not coaxial and catches, and pushed on against it is forced through, deformed.
 */
function collarStop(st0: PciState, dev: Device, distal: number, target: number): { st: PciState; stopMm: number; deform: boolean } | null {
  const ext0 = st0.guide.ext;
  if (!ext0) return null;
  const c = extensionCollarMm(ext0);
  if (!(target >= c && distal < c + 1e-9)) return null;
  const parked = distal >= c - MP_COLLAR_STOP_MM - 0.05;
  let st = st0;
  if (ext0.wrapped || !ext0.rodParked) {
    const ext: GuideExtension = { ...ext0, wrapped: true };
    st = { ...st, guide: withExtension(st.guide, ext) };
    st = withDelivery(st, (r) => ({ collarStalls: r.collarStalls + 1 }));
    st = log(tele(st, "collar-stall", { cause: "wire-wrap" }), "warn", "Resistance where the device enters the guide extension: the wire may have wrapped round the push rod. Take the extension out and reinsert it.");
    return { st, stopMm: c - MP_COLLAR_STOP_MM, deform: false };
  }
  const isStent = dev.kind === "stent" || dev.kind === "covered-stent";
  if (!isStent || dev.deployed) return null;
  if (!(c > 0 || st.guide.coaxial < GUIDE_NON_COAXIAL || !st.guide.engaged)) return null;
  if (parked) {
    st = withDelivery(st, (r) => ({ deformedStents: r.deformedStents + 1 }));
    st = log(tele(st, "stent-deformed", { at: "collar" }), "danger", "The stent was forced on against the extension's collar and has gone through it.");
    return { st, stopMm: target, deform: true };
  }
  st = withDelivery(st, (r) => ({ collarStalls: r.collarStalls + 1 }));
  st = log(tele(st, "collar-stall", { cause: "stent-catch" }), "warn", "The stent catches at the guide extension's collar.");
  return { st, stopMm: c - MP_COLLAR_STOP_MM, deform: false };
}

/**
 * A device pulled back in the vessel: friction on the way back draws a guide the left hand is not holding
 * deeper in; a stent pulled back into a guide that is not coaxial (or out of the ostium) catches on the
 * guide tip and is deformed. Pulled back into a guide extension in the vessel it enters the extension's
 * tip instead, which sits coaxially in the vessel.
 */
function withdrawEffects(s: PciScenario, g: PciGeom, st0: PciState, dev: Device, distal: number, target: number): { st: PciState; guide: GuideState; deformed: boolean } {
  let st = st0;
  let guide = st.guide;
  const inp = deliveryInput(s, g, st, distal, distal);
  const fric = railFriction(g, guide, inp) + lesionLoad(inp, distal);
  if (!guide.pinned && guide.engaged) {
    const share = clamp01(fric / Math.max(0.05, backupForce(guide)));
    const suck = Math.min(MP_SUCK_MAX_MM, (distal - target) * MP_SUCK_SHARE * share);
    if (suck > 0.05) {
      guide = { ...guide, depthMm: Math.min(8, guide.depthMm + suck) };
      st = withDelivery(st, (r) => ({ suckIns: r.suckIns + (suck > MP_SUCK_LOG_MM ? 1 : 0), suckInMm: r.suckInMm + suck }));
      if (suck > MP_SUCK_LOG_MM) st = log(tele(st, "guide-suck-in", { mm: suck, frictionN: fric }), "warn", "The guide is drawn deeper into the vessel as the device comes back.");
    }
  }
  let deformed = false;
  const isStent = dev.kind === "stent" || dev.kind === "covered-stent";
  if (isStent && !dev.deployed && !dev.deformed) {
    const ext = guide.ext;
    const entry = ext && ext.tipMm > 0 ? ext.tipMm : 0;
    const outside = (dEnd: number) => Math.max(0, dEnd - entry) - Math.max(0, dEnd - dev.lengthMm - entry);
    const reentered = outside(distal) - outside(target) > 1e-6 && target - dev.lengthMm < entry;
    if (reentered && entry === 0 && (!guide.engaged || guide.coaxial < GUIDE_NON_COAXIAL)) {
      deformed = true;
      st = withDelivery(st, (r) => ({ deformedStents: r.deformedStents + 1 }));
      st = log(tele(st, "stent-deformed", { at: "guide-tip", coaxial: guide.coaxial }), "danger", "The stent catches on the guide tip as it is pulled back into a guide that is not coaxial.");
    }
  }
  return { st, guide, deformed };
}

export function removeDevice(st: PciState): PciState {
  if (!st.device) return st;
  // a device not yet in the guide comes off the table without the valve
  if (st.device.stage !== "in-guide") return tele({ ...st, device: null, ind: initialIndeflator() }, "device", { action: "remove", stage: st.device.stage });
  if (st.device.inflated || st.ind.fill > 0.05) return log(st, "warn", "Deflate before withdrawing.");
  if (!st.valveOpen) return log(st, "warn", "Open the haemostatic valve to withdraw the device.");
  const deformed = st.device.deformed;
  let n = tele(withTray({ ...st, device: null, ind: initialIndeflator() }, () => ({ guideClear: false, lastRemovalT: st.t })), "device", { action: "remove", ...(deformed ? { deformed: deformed.at } : {}) });
  // inspected on the table: a deformed stent is seen once it is out
  if (deformed) n = log(n, "warn", "On the table the stent is deformed on its balloon: it is not used again.");
  return n;
}

// ---------------------------------------------------------------------------
// Hands and support (pci-device-delivery)
// ---------------------------------------------------------------------------

/** The left hand holds (true) or lets go of (false) the guide at the Y-connector: with the wire pinned, the independent-hand technique. */
export function holdGuide(st: PciState, on: boolean): PciState {
  if (!!st.guide.pinned === on) return st;
  return tele({ ...st, guide: { ...st.guide, pinned: on } }, "guide-hold", { on });
}

/** Record a support option the operator has chosen (for the debrief and the attending). */
export function recordSupport(st: PciState, option: SupportOption): PciState {
  return tele(
    withDelivery(st, (r) => ({ support: [...r.support, { option, t: st.t }] })),
    "support",
    { option }
  );
}

/**
 * Record a support option the hands perform (forward push, deep seat, partial wire withdrawal) once per
 * series of bites: not again while it is the last option recorded.
 */
export function noteSupport(st: PciState, option: SupportOption): PciState {
  return supportNoted(st, option) ? st : recordSupport(st, option);
}

/** The last support option recorded is `option` (a hand action already noted for this series of bites). */
export function supportNoted(st: Pick<PciState, "delivery">, option: SupportOption): boolean {
  const list = deliveryOf(st).support;
  return list.length > 0 && list[list.length - 1].option === option;
}

/** The patient takes and holds a deep breath (the team asks): the bends straighten for MP_BREATH_HOLD_S. */
export function deepBreath(st: PciState): PciState {
  const n = recordSupport({ ...st, guide: { ...st.guide, breathUntil: st.t + MP_BREATH_HOLD_S } }, "deep-breath");
  return log(n, "info", "The patient takes a deep breath and holds it.");
}

/**
 * The nodal branches (sinoatrial, atrioventricular) are not offered as anchors: the module text names the
 * conus or an acute marginal for the RCA and a diagonal for the LAD (complex-pci/13-uncrossable, 'Side-branch
 * anchor'), never a nodal branch. Leaving them out is a MODEL PARAMETER (a modelling rule).
 */
export const NODAL_BRANCH = /^(SAN\d*|AVN\d*)$/;

/** The side branches off the target vessel proximal to the lesion that an anchor balloon can use (nodal branches left out), with their reference diameters. */
export function anchorBranches(g: PciGeom): { branch: string; atMm: number; refMm: number }[] {
  return branchesOf(g, g.lesion.vessel)
    .filter((b) => !b.terminal && b.atMm < g.lesion.startMm && !NODAL_BRANCH.test(b.c.name))
    .map((b) => ({ branch: b.c.name, atMm: b.atMm, refMm: 2 * radiusAtMm(g, pathTo(g, b.c.name), b.atMm + 3, true) }));
}

/**
 * Inflate (or, with null, deflate and take out) a side-branch anchor balloon beside the working wire: a
 * back-up multiplier (MP_ANCHOR_BACKUP) while it is up. Sized above 1:1 to its branch or inflated outside
 * ANCHOR_ATM_RANGE it counts as a breach (the branch injury it risks is for a later package to model).
 */
export function setAnchorBalloon(g: PciGeom, st: PciState, o: { diameter: number; atm: number; branch?: string } | null): PciState {
  if (o === null) {
    if (!st.guide.anchor) return st;
    return log({ ...st, guide: { ...st.guide, anchor: null } }, "info", "Anchor balloon deflated and withdrawn.");
  }
  if (!st.guide.engaged) return log(st, "warn", "Engage the guide before placing an anchor balloon.");
  if (st.tipMm < 30) return log(st, "warn", "Wire the vessel first; the anchor goes into a branch proximal to the lesion.");
  const list = anchorBranches(g);
  // the branch named, else the largest one proximal to the lesion
  const b = (o.branch ? list.find((x) => x.branch === o.branch) : undefined) ?? [...list].sort((x, y) => y.refMm - x.refMm)[0];
  if (!b) return log(st, "warn", "No side branch proximal to the lesion to anchor in.");
  let n = recordSupport({ ...st, guide: { ...st.guide, anchor: { diameter: o.diameter, atm: o.atm, branch: b.branch } } }, "anchor-balloon");
  const oversized = o.diameter > b.refMm * MP_ANCHOR_OVERSIZE;
  const highAtm = o.atm < ANCHOR_ATM_RANGE[0] || o.atm > ANCHOR_ATM_RANGE[1];
  if (oversized || highAtm) n = withDelivery(n, (r) => ({ anchorBreaches: r.anchorBreaches + 1 }));
  n = tele(n, "anchor", { branch: b.branch, diameter: o.diameter, atm: o.atm, refMm: b.refMm, oversized, highAtm });
  return log(n, "info", `Anchor balloon ${o.diameter.toFixed(2)} mm inflated at ${o.atm} atm in the ${b.branch}.`);
}

/**
 * Land a support catheter in the proximal vessel (or, with null, take it out). The scaffold type needs
 * SUPPORT_LANDING_MM of vessel before the lesion; a shorter landing counts. It cannot be removed by
 * trapping: taking it out over a short wire is refused and counted. The module text gives both limits to the
 * scaffold catheters only, so the strut and anchoring-balloon types have neither.
 */
export function setSupportCatheter(g: PciGeom, st: PciState, kind: SupportCatheterKind | null): PciState {
  const cur = st.guide.supportCatheter ?? null;
  if (kind === null) {
    if (!cur) return st;
    if (cur === "scaffold" && (st.wire.lengthCm ?? 0) < EXCHANGE_LENGTH_CM) {
      return log(withDelivery(st, (r) => ({ supportTrapAttempts: r.supportTrapAttempts + 1 })), "warn", "The support catheter is too bulky to trap: exchange to a 300 cm wire to take it out.");
    }
    return log({ ...st, guide: { ...st.guide, supportCatheter: null } }, "info", "Support catheter withdrawn.");
  }
  if (cur) return log(st, "warn", "A support catheter is already in place.");
  if (!st.guide.engaged || st.tipMm < 30) return log(st, "warn", "Engage the guide and wire the vessel before a support catheter.");
  let n = recordSupport({ ...st, guide: { ...st.guide, supportCatheter: kind } }, "support-catheter");
  if (kind === "scaffold" && g.lesion.startMm < SUPPORT_LANDING_MM) n = withDelivery(n, (r) => ({ shortLandings: r.shortLandings + 1 }));
  return log(tele(n, "support-catheter", { kind, landingMm: g.lesion.startMm }), "info", "Support catheter anchored in the proximal vessel.");
}

// ---------------------------------------------------------------------------
// The guide extension (pci-device-delivery): stepwise delivery
// ---------------------------------------------------------------------------

/**
 * Take a guide extension and put it into the guide at the Y-connector (the valve open). Its size must fit
 * the guide (the catalogue's minFrench); a smaller one leaves room for a second wire outside it. The push
 * rod is loose until it is parked under the towel (setExtensionRod).
 */
export function takeExtension(st: PciState, o: { specId?: string; french?: number; cylinderCm?: number } = {}): PciState {
  if (st.guide.ext) return log(st, "warn", "A guide extension is already in the guide.");
  const spec = DEVICE_BY_ID[o.specId ?? "extension"];
  if (!spec || spec.cls !== "extension") return log(st, "warn", "Unknown guide extension.");
  if (!st.valveOpen) return log(st, "warn", "Open the haemostatic valve to introduce the guide extension.");
  const french = o.french ?? st.guide.french;
  if (!spec.diameters.includes(french)) return log(st, "warn", `No ${french} Fr size of this extension.`);
  const need = spec.minFrench(french);
  if (need === null || need > st.guide.french) return log(st, "warn", `A ${french} Fr extension does not fit a ${st.guide.french} Fr guide.`);
  const cylinderCm = o.cylinderCm ?? spec.lengths[spec.lengths.length - 1];
  if (!spec.lengths.includes(cylinderCm)) return log(st, "warn", `No ${cylinderCm} cm cylinder of this extension.`);
  const ext: GuideExtension = { specId: spec.id, french, cylinderMm: cylinderCm * 10, tipMm: -guideLengthMm(st.guide), rodParked: false, wrapped: false };
  let n: PciState = { ...st, guide: withExtension(st.guide, ext) };
  n = recordSupport(n, "guide-extension");
  n = tele(n, "extension", { action: "introduce", specId: spec.id, french, cylinderCm });
  return log(n, "info", `${spec.label} ${french} Fr with a ${cylinderCm} cm cylinder introduced into the guide.`);
}

/** Park the extension's push rod under the towel beside the Y-connector (true), or leave it loose (false). */
export function setExtensionRod(st: PciState, parked: boolean): PciState {
  const ext = st.guide.ext;
  if (!ext || ext.rodParked === parked) return st;
  return tele({ ...st, guide: withExtension(st.guide, { ...ext, rodParked: parked }) }, "extension", { action: parked ? "rod-parked" : "rod-loose" });
}

/** Take the extension out (its tip back inside the guide; no device inside it). Reinserting it clears a wrapped wire. */
export function removeExtension(st: PciState): PciState {
  const ext = st.guide.ext;
  if (!ext) return st;
  if (ext.tipMm > 0) return log(st, "warn", "Withdraw the guide extension into the guide first.");
  const dev = st.device;
  if (dev && dev.stage === "in-guide" && dev.centreMm + dev.lengthMm / 2 > extensionCollarMm(ext)) return log(st, "warn", "Withdraw the device behind the extension's collar first.");
  return log(tele({ ...st, guide: withExtension(st.guide, null) }, "extension", { action: "remove", wrapped: ext.wrapped }), "info", "Guide extension removed.");
}

/** The delivery mode of a push on the extension: what the extension's tip rides on, and how far it can go. */
export function extensionMode(st: PciState, together = false): { mode: ExtensionMode; limitMm: number; stentEdge?: boolean } {
  const ext = st.guide.ext!;
  const from = Math.max(ext.tipMm, 0);
  const wireLimit = st.tipMm - MP_EXT_WIRE_MARGIN_MM;
  const dev = st.device && st.device.stage === "in-guide" ? st.device : null;
  if (dev && (dev.kind === "balloon" || dev.kind === "stent" || dev.kind === "covered-stent")) {
    const dDist = dev.centreMm + dev.lengthMm / 2;
    const dProx = dDist - dev.lengthMm;
    const straddle = dDist >= from + MP_STRADDLE_MM && dProx <= from - MP_STRADDLE_MM;
    const inflated = dev.inflated || st.ind.atm > MP_ANCHOR_HOLD_ATM;
    if (straddle && inflated) {
      if (together && dev.kind === "balloon") return { mode: "bat", limitMm: wireLimit };
      const deflating = st.ind.negative || st.ind.target < st.ind.atm - 0.25;
      if (!deflating) return { mode: "blocked", limitMm: from };
      return { mode: "inchworm", limitMm: Math.min(wireLimit, dDist - MP_EXT_MARGIN_MM) };
    }
    // over a crimped stent the extension goes no further than the stent's proximal edge: its edge would catch
    // or strip the stent (complication-management/04-equipment-loss); over a balloon, to near its tip
    const crimped = dev.kind !== "balloon" && !dev.deployed;
    if (crimped && dDist > from + 1) return { mode: "over-device", limitMm: Math.min(wireLimit, dProx - MP_EXT_MARGIN_MM), stentEdge: true };
    if (dDist > from + 1) return { mode: "over-device", limitMm: Math.min(wireLimit, dDist - MP_EXT_MARGIN_MM) };
  }
  const micro = st.wire.micro;
  if (micro && micro.tipMm > from + 1) return { mode: "over-device", limitMm: Math.min(wireLimit, micro.tipMm - MP_EXT_MARGIN_MM) };
  return { mode: "bare", limitMm: wireLimit };
}

/**
 * Advance (+) or withdraw (−) the guide extension by its push rod. Inside the guide it runs freely; beyond
 * the guide tip its rail depends on what it rides over (extensionMode): over the bare wire it meets the
 * full friction of the bends and can back the guide out; over a balloon or microcatheter less; inchworming,
 * it slides over a straddling balloon as the balloon deflates (and is stopped while the balloon is still
 * inflated); with `together` (balloon-assisted tracking) the inflated balloon and the extension go forward
 * as one. The collar leaving the guide is recorded.
 */
export function moveExtension(s: PciScenario, g: PciGeom, st0: PciState, mm: number, opts: { together?: boolean; screened?: boolean; byHand?: boolean } = {}): PciState {
  const ext0 = st0.guide.ext;
  if (!ext0) return log(st0, "warn", "There is no guide extension in the guide.");
  if (!mm) return st0;
  let st = st0;
  if (mm < 0) {
    const tip = Math.max(-guideLengthMm(st.guide), ext0.tipMm + mm);
    st = { ...st, guide: withExtension(st.guide, { ...ext0, tipMm: tip }) };
    return tele(st, "extension", { action: "move", tipMm: tip, mode: "withdraw" });
  }
  let target = ext0.tipMm + mm;
  if (target > 0 && st.tipMm < 30) return log(st, "warn", "Take the wire well into the distal vessel before advancing a guide extension.");
  if (target > 0 && !st.guide.engaged) {
    if (ext0.tipMm >= 0) return log(st, "warn", "The guide is out of the ostium: re-engage it before the extension leaves it.");
    target = 0;
  }
  const inGuide = Math.max(0, Math.min(target, 0) - ext0.tipMm);
  let advanced = inGuide;
  let guide = st.guide;
  let mode: ExtensionMode = "bare";
  let backMm = 0;
  let forces: DeliveryResult | null = null;
  const from = Math.max(ext0.tipMm, 0);
  if (target > from) {
    const m = extensionMode(st, !!opts.together);
    mode = m.mode;
    if (mode === "blocked") {
      st = withDelivery(st, (r) => ({ extensionBlocked: r.extensionBlocked + 1 }));
      return log(tele(st, "extension", { action: "blocked", tipMm: ext0.tipMm }), "warn", "The extension will not go on over the inflated balloon: deflate it and advance the extension as it goes down.");
    }
    const to = Math.min(target, Math.max(from, m.limitMm));
    if (m.stentEdge && to < target - 1e-9 && to <= from + 1e-9) {
      st = withDelivery(st, (r) => ({ extensionBlocked: r.extensionBlocked + 1 }));
      return log(tele(st, "extension", { action: "blocked", tipMm: ext0.tipMm, at: "stent-edge" }), "warn", "The extension has reached the stent's proximal edge: taking it on over the crimped stent would catch or strip the stent.");
    }
    if (to > from) {
      const spec = DEVICE_BY_ID[ext0.specId] ?? DEVICE_BY_ID.extension;
      const inp: DeliveryInput = {
        spec,
        diameter: ext0.french,
        lengthMm: MP_EXT_TIP_CONTACT_MM,
        fromMm: from,
        toMm: to,
        route: st.route,
        lesion: { vessel: g.lesion.vessel, startMm: g.lesion.startMm, endMm: g.lesion.endMm, mldMm: g.lesion.refDiameter * (1 - st.severity / 100), calcium: s.calcium, resistance: st.resistance },
        wireSupport: WIRE_SPECS[st.wireKind].support,
        loadScale: MP_EXT_MODE_SCALE[mode],
      };
      // over the bare wire the extension's edge catches at the bends, the more so in a calcified vessel
      if (mode === "bare") inp.edgeCatchN = MP_EXT_EDGE_CATCH_N * (1 + s.calcium * st.resistance);
      if (breathHeld(st)) inp.bendScale = MP_BREATH_BEND_SCALE;
      if (guide.pinned) inp.guideHeld = true;
      if (opts.byHand) inp.slackMm = MP_SHAFT_SLACK_MM;
      // the extension's own push is not supported by itself
      const r = deliver(g, { ...guide, extensionMm: null }, inp);
      guide = { ...r.gs, extensionMm: guide.extensionMm };
      forces = r.r;
      advanced += r.r.advancedMm;
      backMm = r.r.guideBackMm;
      if (r.r.guideBackMm > MP_BACKOUT_MM) {
        st = { ...st, counters: { ...st.counters, guideBackouts: st.counters.guideBackouts + 1 } };
        st = log(st, "warn", `Resistance: the extension stops and the guide is pushed back (${r.r.guideBackMm.toFixed(1)} mm).`);
        st = tele(st, "guide-backout", { mm: r.r.guideBackMm, requiredN: r.r.requiredN, backupN: r.r.backupN, by: "extension" });
      }
      if (r.r.disengaged) st = log(st, "danger", "The guide has backed out of the ostium. Re-engage it over the wire.");
      if (mode === "bare" && r.r.advancedMm > 0) st = withDelivery(st, (rec) => ({ extensionBareMm: rec.extensionBareMm + r.r.advancedMm }));
    }
  }
  const tip = ext0.tipMm + advanced;
  const ext: GuideExtension = { ...ext0, tipMm: tip };
  st = { ...st, guide: withExtension(guide, ext) };
  // balloon-assisted tracking: the inflated balloon goes forward with the extension
  if (mode === "bat" && advanced > 0 && st.device) st = { ...st, device: { ...st.device, centreMm: st.device.centreMm + advanced } };
  if (extensionCollarMm(ext) > 0 && extensionCollarMm(ext0) <= 0) {
    st = withDelivery(st, (r) => ({ collarOut: r.collarOut + 1 }));
    st = log(tele(st, "extension-collar-out", { collarMm: extensionCollarMm(ext) }), "danger", "The extension's collar has left the guide: pull it back so the collar stays inside the guide.");
  }
  if (opts.screened === false && ext0.tipMm <= 0 && tip > 0) {
    st = { ...st, counters: { ...st.counters, unscreened: st.counters.unscreened + 1 } };
    st = log(tele(st, "device-unscreened", { kind: "extension" }), "warn", "The extension has left the guide tip without fluoroscopy.");
  }
  // the extension in the vessel drags an unpinned wire with it
  const beyond = tip - Math.max(ext0.tipMm, 0);
  if (beyond > 1e-6 && tip > 0 && !st.wire.pinned) {
    const dr = dragWire(g, wireOf(st), beyond, MP_WIRE_DRAG.rx, lesionNow(s, g, st));
    if (Math.abs(dr.migratedMm) > 0.2) {
      st = { ...st, counters: { ...st.counters, wireMigrationMm: st.counters.wireMigrationMm + Math.abs(dr.migratedMm) } };
      st = wireInternal.handleWireEvents(s, g, st, dr.w, dr.events);
    }
  }
  if (backMm > MP_BACKOUT_MM) st = wireRetreat(s, g, st, backMm);
  // the forces of the push beyond the guide tip ride on the record (the input target's hub reaction reads them)
  const f = forces ? { requiredN: forces.requiredN, frictionN: forces.frictionN, lesionN: forces.lesionN, backupN: forces.backupN, railAdvancedMm: forces.advancedMm, guideBackMm: forces.guideBackMm, disengaged: forces.disengaged } : {};
  return tele(st, "extension", { action: "move", tipMm: tip, mode, advancedMm: advanced, ...f });
}

// ---------------------------------------------------------------------------
// Start states (pci-device-delivery)
// ---------------------------------------------------------------------------

/** The log lines of a push that backs the guide out (advanceDevice), which a start setup rewrites with the guide's final position. */
const GUIDE_PUSHED_BACK = /^Resistance: the device stops and the guide is pushed back out of the ostium \(/;
const GUIDE_OUT_OF_OSTIUM = /^The guide has backed out of the ostium\./;

/** Largest number of half-millimetre bites the team takes to bring a start's device to where it stops. MODEL PARAMETER (a guard, not a value of the case). */
export const MP_START_PUSH_STEPS = 800;

/**
 * Open a start state's equipment (PciStartSetup) on a state whose wire startPci has parked across: the
 * device taken, checked, prepared, backloaded and introduced by the team, then pushed in half-millimetre
 * bites with the wire held and the guide at the setup's pushCoaxial until the delivery physics stops it
 * (the push that backs the guide out, or one that no longer moves it); then the guide is put at the
 * setup's depth and coaxiality. The record is the engine's own (the back-out with its forces, the 'move'
 * records), so the tip context reads the stall as it would in the lab. A start without a setup is returned
 * unchanged.
 */
export function applyStartSetup(s: PciScenario, g: PciGeom, st0: PciState, start: { readonly id: string; setup?: PciStartSetup } | null | undefined): PciState {
  const su = start?.setup;
  if (!su) return st0;
  let st = st0;
  if (su.underStrut) st = oldStentWireUnder(g, st, su.underStrut);
  let pushEvents0 = -1;
  if (su.device) {
    const D = su.device;
    if (!DEVICE_BY_ID[D.specId]) throw new Error(`applyStartSetup: unknown device ${D.specId}`);
    const pinned = st.wire.pinned;
    st = requestDevice(st, D.specId, D.diameter, D.lengthMm);
    st = setValve(backloadDevice(prepareDevice(checkLabel(st))), true);
    st = advanceDevice(s, g, st, 1);
    if (su.pushCoaxial !== undefined) st = { ...st, guide: { ...st.guide, coaxial: clamp01(su.pushCoaxial) } };
    st = syncWire(st, { ...cloneWire(st.wire), pinned: true });
    pushEvents0 = st.events.length;
    const backouts0 = st.counters.guideBackouts;
    for (let i = 0; i < MP_START_PUSH_STEPS && st.device; i++) {
      const d0 = st.device.centreMm;
      st = advanceDevice(s, g, st, 0.5);
      if (st.counters.guideBackouts > backouts0 || !st.guide.engaged) break;
      if (Math.abs(st.device!.centreMm - d0) < 1e-6) break;
    }
    st = syncWire(st, { ...cloneWire(st.wire), pinned });
  }
  if (su.guide) {
    const engaged = st.guide.engaged || su.guide.depthMm >= MP_DISENGAGE_MM;
    st = { ...st, guide: { ...st.guide, engaged: engaged && su.guide.depthMm >= MP_DISENGAGE_MM, depthMm: su.guide.depthMm, coaxial: clamp01(su.guide.coaxial) } };
    st = syncWire(st, { ...cloneWire(st.wire), guideEngaged: st.guide.engaged || st.tipMm > 3 });
    // the scripted push's back-out lines gave the depth before the setup placed the guide: one line with where it ends instead
    if (pushEvents0 >= 0) {
      const pushed = st.events.slice(pushEvents0);
      const backed = pushed.some((e) => GUIDE_PUSHED_BACK.test(e.text));
      st = { ...st, events: [...st.events.slice(0, pushEvents0), ...pushed.filter((e) => !GUIDE_PUSHED_BACK.test(e.text) && !GUIDE_OUT_OF_OSTIUM.test(e.text))] };
      if (backed || su.guide.depthMm < 0) {
        const where = !st.guide.engaged ? "it has come out of the ostium" : st.guide.depthMm < 0 ? `its tip is ${(-st.guide.depthMm).toFixed(1)} mm back from the ostium` : "it is still seated";
        st = log(st, st.guide.engaged ? "warn" : "danger", `Resistance: the device stops and the guide is pushed back; ${where}.`);
      }
    }
  }
  return tele(st, "start-setup", { device: su.device?.specId ?? null, guideDepthMm: st.guide.depthMm });
}

// ---------------------------------------------------------------------------
// A wire outside a stent's struts (pci-two-rail-engine)
// ---------------------------------------------------------------------------

/** A device stops this short of the stent edge its wire passes outside of (mm) — MODEL PARAMETER. */
export const MP_EDGE_STOP_MM = 0.2;
/**
 * A balloon this small or smaller follows a jailed wire under the stent (cp-bifurcation-provisional: a small
 * balloon advanced over the jailed wire, the rescue of an occluded branch); a larger device stops at the
 * stent's edge (mm) — MODEL PARAMETER.
 */
export const MP_JAILED_DEVICE_MAX_MM = 1.5;
/** Bites forced on against the edge before the old stent starts to deform, and what each further bite shortens it (mm, capped) — MODEL PARAMETERS (pm-prep-and-stent#5: forcing it deforms the old stent longitudinally). */
export const MP_EDGE_FORCE_BITES = 3;
export const MP_EDGE_DEFORM_MM = 0.4;
export const MP_EDGE_DEFORM_MAX_MM = 3;

/** The stent edge the active rail's devices stop at: a wire passed outside the struts, or a jailed wire with a device larger than MP_JAILED_DEVICE_MAX_MM. */
export function railEdge(st: PciState): { stentIdx: number; edgeMm: number; cause: "under-strut" | "jailed" } | null {
  if (!st.rails) return null;
  const r = railsOf(st)[activeRailOf(st)];
  if (r.underStrut && st.stents[r.underStrut.stentIdx]) return { stentIdx: r.underStrut.stentIdx, edgeMm: st.stents[r.underStrut.stentIdx].fromMm, cause: "under-strut" };
  if (r.jailed && st.device && st.device.diameter > MP_JAILED_DEVICE_MAX_MM && st.stents[r.jailed.stentIdx])
    return { stentIdx: r.jailed.stentIdx, edgeMm: st.stents[r.jailed.stentIdx].fromMm, cause: "jailed" };
  return null;
}

/**
 * A push of the device's distal end from `distal` to `target` on a rail whose wire is outside a stent's
 * struts: it stops MP_EDGE_STOP_MM short of the edge ('device-stent-edge-stall', logged once per stall: what
 * the operator sees is the device stopping exactly at the old stent's edge). Bites forced on against it beyond
 * MP_EDGE_FORCE_BITES shorten the old stent from its proximal end ('stent-longitudinal-deformation'). Null
 * when the push does not reach the edge.
 */
function railEdgeStop(st0: PciState, distal: number, target: number): { st: PciState; stopMm: number } | null {
  const e = railEdge(st0);
  if (!e) return null;
  const stop = e.edgeMm - MP_EDGE_STOP_MM;
  if (target <= stop || distal > e.edgeMm) return null;
  let st = st0;
  const i = activeRailOf(st);
  if (distal < stop - 0.01) {
    st = tele(st, "device-stent-edge-stall", { rail: i, stentIdx: e.stentIdx, edgeMm: e.edgeMm, cause: e.cause });
    st = log(st, "warn", "The device stops exactly at the edge of the stent.");
    return { st: withRail(st, i, () => ({ edgeForcing: 0 })), stopMm: stop };
  }
  // forced on against the edge
  const n = railsOf(st)[i].edgeForcing + 1;
  st = withRail(st, i, () => ({ edgeForcing: n }));
  if (n > MP_EDGE_FORCE_BITES && e.cause === "under-strut") {
    const p = st.stents[e.stentIdx];
    const room = MP_EDGE_DEFORM_MAX_MM - p.compressionMm;
    if (room > 1e-6) {
      const mm = Math.min(room, MP_EDGE_DEFORM_MM);
      const stents = st.stents.slice();
      stents[e.stentIdx] = { ...p, fromMm: p.fromMm + mm, compressionMm: p.compressionMm + mm };
      st = { ...st, stents };
      if (p.compressionMm === 0) st = log(st, "danger", "The proximal end of the old stent shortens and bunches as the device is forced against it.");
      st = tele(st, "stent-longitudinal-deformation", { stentIdx: e.stentIdx, compressionMm: p.compressionMm + mm });
      // the edge moved: so does where the device stops
      const ns = st.stents[e.stentIdx].fromMm - MP_EDGE_STOP_MM;
      st = withRail(st, i, (r) => (r.underStrut ? { underStrut: { ...r.underStrut, edgeMm: st.stents[e.stentIdx].fromMm } } : {}));
      return { st, stopMm: Math.max(distal, Math.min(target, ns)) };
    }
  }
  return { st, stopMm: Math.max(distal, stop) };
}

/**
 * The in-stent variant's start (PciStartSetup.underStrut): an old stent of the given size centred on the
 * target lesion along the wire's route, fully expanded, and the wire across it passed outside its proximal
 * struts (rail 0 underStrut, cause 'start'). The restenosis is the lesion inside it.
 */
function oldStentWireUnder(g: PciGeom, st0: PciState, o: { diameter: number; lengthMm: number }): PciState {
  const route = st0.route.includes(g.lesion.vessel) ? st0.route.slice() : [...st0.route, g.lesion.vessel];
  const from = Math.max(0.5, g.lesion.centreMm - o.lengthMm / 2);
  const to = from + o.lengthMm;
  const n = ringCount(THIN_STRUT_DES, o.lengthMm);
  const placed: Placed = {
    vessel: g.lesion.vessel as Placed["vessel"],
    fromMm: from,
    toMm: to,
    diameter: o.diameter,
    atLesion: o.diameter,
    route,
    nominal: o.diameter,
    labelLengthMm: o.lengthMm,
    ringD: new Array(n).fill(o.diameter),
    compressionMm: 0,
    covered: false,
    restenosed: true,
  };
  let st: PciState = ensureRails({ ...st0, stents: [...st0.stents, placed] });
  const stentIdx = st.stents.length - 1;
  st = withRail(st, 0, () => ({ underStrut: { stentIdx, edgeMm: from, cause: "start", t: st.t } }));
  return tele(st, "wire-under-strut", { rail: 0, stentIdx, edgeMm: from, cause: "start" });
}

/** The device's diameter at the indeflator's current pressure (from its chart). */
export function deviceDiameterNow(st: PciState): number {
  const dev = st.device;
  if (!dev) return 0;
  return chartDiameter(specOf(dev), dev.diameter, Math.max(0, st.ind.atm));
}

/** The device's spec (box information). */
export function deviceSpecOf(dev: Device): DeviceSpec {
  return specOf(dev);
}
