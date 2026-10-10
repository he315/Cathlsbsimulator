// ---------------------------------------------------------------------------
// Hand bindings of device delivery (pci-device-delivery).
//
// 'delivery' is the hand-operated part the right hand works at the valve: the
// shaft of the balloon or stent on the rail, or the push rod of a guide
// extension. Its hand actions:
//   advance, withdraw   mm of hub travel on what the right hand holds (the support
//                       console's hand setting): the device, through the delivery
//                       physics (actions/devices.ts advanceDevice: the shaft runs
//                       down the guide from the valve, leaves the guide tip screened
//                       or not, meets the rail and the lesion, backs the guide out,
//                       drags or leaves the wire); the extension (moveExtension:
//                       over the bare wire, over a device, inchworming); or both
//                       together (balloon-assisted tracking)
//   pin                 1 the left hand pins the wire at the Y-connector (the
//                       two-hand technique), 0 it lets go
// The input target (src/ui/pci/pciInputTarget.ts) sends the hands' pushes on the
// device slot here for every device on the rail, whether taken through the
// equipment workflow or loaded by the assisted console, and for the extension's
// push rod, whenever the session has an action entry (hasDeliveryEntry); and the
// left hand's wire pin when the session has no pin of its own. It puts the
// delivery forces on the bus as the hub reaction. The left hand holding the guide (the
// independent-hand technique) is holdGuideByHand, which the target uses for a
// pin on the guide.
//
// The PCI session exposes no general action entry, so applyDeliveryAction uses
// the session's operator-action path: a public applyDeliveryAction when the
// session offers one, else PciLabSession's act(), which asks the attending
// (beforeAction) first, as applyWireAction does (./wire.ts). The action names
// are chosen against the attending's pre-action map (src/mentor/bridge/pciSession.ts
// pciPreActionFor), which turns 'advance-device' and 'advance-wire' into the
// stops of its device and wire rules: a device push is asked as 'advance-device'
// (guide-backout-ignored and withdraw-before-deflate may stop it); a device
// pull as 'advance-device' only while the balloon is not empty
// (withdraw-before-deflate), otherwise as 'remove-device', so bringing the
// device back after a back-out, which guide-backout-ignored itself advises, is
// not stopped; the extension's push rod as 'load-device', since inchworming and
// balloon-assisted tracking are done with the balloon still full; the left
// hand's pins as 'engage-guide'.
// ---------------------------------------------------------------------------

import type { PciInputBinding } from "./index";
import type { PciGeom, PciScenario, PciState } from "../../../simulation/pci/state";
import { advanceDevice, deepBreath, holdGuide, moveExtension } from "../../../simulation/pci/actions/devices";
import { pinWire } from "../../../simulation/pci/actions/wire";

/** The attending's action names the delivery actions are asked under (PciLabSession PciAction). */
export type DeliveryActionName = "advance-device" | "remove-device" | "load-device" | "advance-wire" | "engage-guide" | "drug";

/** The session can take the delivery hand actions: it offers applyDeliveryAction() or act(). */
export function hasDeliveryEntry(session: object): boolean {
  return typeof (session as DeliverySession).applyDeliveryAction === "function" || typeof (session as { act?: unknown }).act === "function";
}

/** What a session needs for delivery: the scenario, the geometry, the state, and optionally the mode and the beam. */
export interface DeliverySession {
  readonly s: PciScenario | { side: "left" | "right"; calcium: 0 | 1 | 2 };
  readonly g: PciGeom;
  readonly st: PciState;
  readonly policy?: { mode: string };
  /** the beam now (PciLabSession.beamMode): null when off */
  beamMode?(): "fluoro" | "cine" | null;
  /** a public entry for an engine change asked of the attending (preferred when present) */
  applyDeliveryAction?(action: DeliveryActionName, f: (x: PciState) => PciState): boolean;
}

/**
 * Apply an engine change to the session as an operator action. Returns false when the session has no
 * action entry, or the attending stopped it.
 */
export function applyDeliveryAction(session: object, action: DeliveryActionName, f: (x: PciState) => PciState): boolean {
  const pub = (session as DeliverySession).applyDeliveryAction;
  if (typeof pub === "function") return pub.call(session, action, f);
  const act = (session as { act?: (a: string, fn: (x: PciState) => PciState) => boolean }).act;
  if (typeof act === "function") return act.call(session, action, f);
  if (import.meta.env?.DEV) throw new Error("applyDeliveryAction: the PCI session offers neither applyDeliveryAction() nor act(); the delivery hand actions cannot reach the engine.");
  return false;
}

/** What the right hand moves on a push at the valve: the device, the extension's push rod, or both together (balloon-assisted tracking). */
export type DeliveryHand = "device" | "extension" | "together";
export const DELIVERY_HANDS: readonly { id: DeliveryHand; label: string }[] = [
  { id: "device", label: "Device shaft" },
  { id: "extension", label: "Extension push rod" },
  { id: "together", label: "Both together" },
];

const hands = new WeakMap<object, DeliveryHand>();

/** What the right hand moves in this session (default the device). */
export function deliveryHand(session: object): DeliveryHand {
  return hands.get(session) ?? "device";
}

/** Set what the right hand moves (a console setting). */
export function setDeliveryHand(session: object, h: DeliveryHand): void {
  hands.set(session, h);
}

/** A balloon, stent or imaging catheter is on the rail (in the guide or the vessel). */
export function deviceOnRail(st: PciState): boolean {
  return !!st.device && st.device.stage === "in-guide";
}

/** The beam is on (fluoroscopy or cine), or undefined when the session does not say. */
function screened(x: DeliverySession): boolean | undefined {
  return typeof x.beamMode === "function" ? x.beamMode() !== null : undefined;
}

const scen = (x: DeliverySession) => x.s as PciScenario;

/** Push (+) or pull (−) the device on the rail by `mm` through the delivery physics. */
export function deliverByHand(session: object, mm: number): boolean {
  const x = session as DeliverySession;
  if (!x.st.device || !mm) return false;
  const supervised = x.policy?.mode === "supervised";
  const dev = x.st.device;
  // not empty as the engine (advanceDevice) and the attending (balloonInflated) both judge it: above 5% fill
  const full = dev.inflated || x.st.ind.fill > 0.05;
  return applyDeliveryAction(x, mm > 0 || full ? "advance-device" : "remove-device", (st) => advanceDevice(scen(x), x.g, st, mm, { screened: screened(x), fromValve: true, supervised, byHand: true }));
}

/** Push (+) or pull (−) the guide extension by its push rod; `together` takes a straddling inflated balloon with it. */
export function moveExtensionByHand(session: object, mm: number, together = false): boolean {
  const x = session as DeliverySession;
  if (!x.st.guide.ext || !mm) return false;
  return applyDeliveryAction(x, "load-device", (st) => moveExtension(scen(x), x.g, st, mm, { together, screened: screened(x), byHand: true }));
}

/** The left hand pins the wire at the Y-connector (true) or lets it go. */
export function pinWireByHand(session: object, on: boolean): boolean {
  const x = session as DeliverySession;
  if (!!x.st.wire.pinned === on) return true;
  return applyDeliveryAction(x, "engage-guide", (st) => pinWire(st, on));
}

/** The left hand holds and gently pushes the guide (true), the independent-hand technique with the wire pinned, or lets it go. */
export function holdGuideByHand(session: object, on: boolean): boolean {
  const x = session as DeliverySession;
  if (!!x.st.guide.pinned === on) return true;
  return applyDeliveryAction(x, "engage-guide", (st) => holdGuide(st, on));
}

/**
 * The team asks the patient for a deep breath (the support console's button). Asked of the attending as
 * 'load-device', which no rule stops: it is wanted exactly when a balloon is up or the guide has just backed out.
 */
export function deepBreathByTeam(session: object): boolean {
  const x = session as DeliverySession;
  return applyDeliveryAction(x, "load-device", (st) => deepBreath(st));
}

/** A tree branch id as the console names it ('RV2' is 'Right ventricular branch 2'). */
export function anchorBranchName(id: string): string {
  const twig = /^(.+)-twig\d+$/.exec(id);
  if (twig) return `Small branch of the ${anchorBranchName(twig[1]).replace(/^./, (c) => c.toLowerCase())}`;
  const fixed: Record<string, string> = { CONUS: "Conus branch", AM: "Acute marginal", RV: "Right ventricular branch 1", PLV: "Posterolateral branch 1", RAMUS: "Ramus intermedius" };
  if (fixed[id]) return fixed[id];
  const m = /^(RV|PL|AM|OM|D|S)(\d+)$/.exec(id);
  if (m) {
    const stem: Record<string, string> = { RV: "Right ventricular branch", PL: "Posterolateral branch", AM: "Acute marginal", OM: "Obtuse marginal", D: "Diagonal", S: "Septal perforator" };
    return `${stem[m[1]]} ${m[2]}`;
  }
  return id;
}

/** A push on the delivery part: the extension when the hand is on it (or there is no device to push), else the device. */
function handPush(session: object, mm: number): boolean {
  const x = session as DeliverySession;
  const hand = deliveryHand(session);
  if (x.st.guide.ext && (hand !== "device" || !deviceOnRail(x.st))) return moveExtensionByHand(session, mm, hand === "together");
  return deliverByHand(session, mm);
}

export const binding: PciInputBinding = {
  device: "delivery",
  actions: {
    advance: ({ session }, mm) => handPush(session, Math.abs(mm)),
    withdraw: ({ session }, mm) => handPush(session, -Math.abs(mm)),
    pin: ({ session }, on) => pinWireByHand(session, on > 0),
  },
};
