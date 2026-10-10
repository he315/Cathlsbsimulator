// ---------------------------------------------------------------------------
// Hand bindings of the indeflator (pci-indeflator).
//
// The indeflator is a hand-operated part with no slot of its own on the
// hands' table: the input target reaches it by name (PciInputTarget.perform
// ('indeflator', action, value)), and so does the indeflator console's
// on-screen screw. Its hand actions:
//   inflate    atm turned on the screw (+ in, - out): the screw's target moves by
//              that much and the pressure follows at the screw rate (the
//              console's setting, kept here per session), over seconds, as the
//              procedure clock steps the indeflator (stepPci)
//   aspirate   pull 0..1 on the plunger: pulling past the threshold pulls
//              negative (the balloon empties over seconds); one pull per press
//   pin        1 locks the plunger (the pressure holds), 0 unlocks it; while it
//              is locked the screw and the negative pull are refused (false)
// Each goes to the engine through the session's operator-action path, asked of
// the attending first ('inflate' for the screw and the lock, 'deflate' for the
// negative pull), exactly as the session's named actions are. The PCI session
// exposes no public action entry yet: a public applyIndeflatorAction when the
// session offers one, else its act(), as the other binding files do.
// ---------------------------------------------------------------------------

import type { PciInputBinding } from "./index";
import type { PciGeom, PciScenario, PciState } from "../../../simulation/pci/state";
import { INDEFLATOR_MAX_ATM } from "../../../simulation/pci/indeflator";
import { lockIndeflator, pullIndeflatorNegative, setIndeflator } from "../../../simulation/pci/actions/inflation";

/** The attending's action names the indeflator's actions are asked under (PciLabSession PciAction). */
export type IndeflatorActionName = "inflate" | "deflate";

/** What a session needs for the indeflator: the scenario, the geometry, the state and an action entry. */
export interface IndeflatorActionSession {
  readonly s: PciScenario | { side: "left" | "right"; calcium: 0 | 1 | 2 };
  readonly g: PciGeom;
  readonly st: PciState;
  applyIndeflatorAction?(action: IndeflatorActionName, f: (x: PciState) => PciState): boolean;
}

/** Plunger pull above which the negative pull acts (the input target's PCI_PLUNGER_ON). */
export const INDEFLATOR_PULL_ON = 0.08;
/**
 * Screw rate when none has been set (atm/s): 12 atm in 3-5 s, the module's speed of inflation for
 * standard balloons (pm-prep-and-stent, 'Step 9: inflating the balloon', Brilakis 9.7.9).
 */
export const DEFAULT_SCREW_RATE = 3;
/** The rates the console offers (atm/s): from the cutting balloon's 1 atm per 5 s to a fast turn. */
export const SCREW_RATES: readonly number[] = [0.2, 0.5, 1, 2, 3, 4, 6];

/**
 * Apply an engine change to the session as an operator action. Returns false when the session has no
 * action entry, or the attending stopped it.
 */
export function applyIndeflatorAction(session: object, action: IndeflatorActionName, f: (x: PciState) => PciState): boolean {
  const pub = (session as IndeflatorActionSession).applyIndeflatorAction;
  if (typeof pub === "function") return pub.call(session, action, f);
  const act = (session as { act?: (a: string, fn: (x: PciState) => PciState) => boolean }).act;
  if (typeof act === "function") return act.call(session, action, f);
  if (import.meta.env?.DEV) throw new Error("applyIndeflatorAction: the PCI session offers neither applyIndeflatorAction() nor act(); the indeflator's hand actions cannot reach the engine.");
  return false;
}

/** Per session: the screw rate and the plunger latch. */
const perSession = new WeakMap<object, { rate: number; pulling: boolean }>();
function stateOf(session: object) {
  let v = perSession.get(session);
  if (!v) perSession.set(session, (v = { rate: DEFAULT_SCREW_RATE, pulling: false }));
  return v;
}

/** The screw rate the hands turn at for this session (atm/s). */
export function screwRate(session: object): number {
  return stateOf(session).rate;
}

/** Set the screw rate (a console setting, atm/s). */
export function setScrewRate(session: object, rate: number): void {
  stateOf(session).rate = Math.max(0.1, Math.min(10, rate));
}

/** An inflatable device (balloon or stent) is on the wire in the artery. */
function inflatable(st: PciState): boolean {
  const k = st.device?.kind;
  return k === "balloon" || k === "stent" || k === "covered-stent";
}

/** Turn the screw by `atm` (+ in, - out) at the session's rate. Returns false when nothing took it. */
export function turnScrew(session: object, atm: number): boolean {
  const x = session as IndeflatorActionSession;
  if (!inflatable(x.st) || !atm) return false;
  // a locked plunger does not turn: refuse, so the input layer can show that nothing happened
  if (x.st.ind.locked) return false;
  const ind = x.st.ind;
  const from = ind.negative ? 0 : ind.target;
  const target = Math.max(0, Math.min(INDEFLATOR_MAX_ATM, from + atm));
  const rate = screwRate(session);
  return applyIndeflatorAction(session, "inflate", (st) => setIndeflator(st, target, rate));
}

/** Pull negative on the plunger. */
export function pullNegativeNow(session: object): boolean {
  const x = session as IndeflatorActionSession;
  if (!inflatable(x.st)) return false;
  // a locked plunger cannot be pulled back: refuse rather than report a pull that did nothing
  if (x.st.ind.locked) return false;
  return applyIndeflatorAction(session, "deflate", (st) => pullIndeflatorNegative(x.s as PciScenario, x.g, st));
}

/** Lock (true) or unlock the plunger. */
export function setPlungerLock(session: object, locked: boolean): boolean {
  const x = session as IndeflatorActionSession;
  if (!inflatable(x.st)) return false;
  return applyIndeflatorAction(session, "inflate", (st) => lockIndeflator(st, locked));
}

export const binding: PciInputBinding = {
  device: "indeflator",
  actions: {
    inflate: ({ session }, atm) => turnScrew(session, atm),
    aspirate: ({ session }, pull) => {
      const l = stateOf(session);
      if (pull > INDEFLATOR_PULL_ON && !l.pulling) {
        l.pulling = true;
        return pullNegativeNow(session);
      }
      if (pull <= INDEFLATOR_PULL_ON) l.pulling = false;
      return inflatable((session as IndeflatorActionSession).st);
    },
    pin: ({ session }, on) => setPlungerLock(session, on > 0),
  },
};
