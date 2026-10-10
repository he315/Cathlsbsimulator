// ---------------------------------------------------------------------------
// Hand bindings of the microcatheter (pci-wire-microcatheter).
//
// The microcatheter rides the coronary wire. The hands advance and withdraw
// it (mm at the hub), rotate it (rad), inject contrast through it from a
// syringe on its hub (plunger force 0..1) and check for backflow by pulling
// on that syringe (pull 0..1). The coronary wire's own hand actions (advance,
// withdraw, torque) stay on the input target's built-in route for 'wire014',
// which calls the same engine actions (moveWire, torqueWire in
// src/simulation/pci/actions/wire.ts).
//
// The PCI session exposes no general action entry yet, so applyWireAction
// uses the session's own operator-action path: a public applyWireAction when
// the session offers one, else PciLabSession's act(), which asks the
// attending (beforeAction) first exactly as its named actions do. The
// package report names the public entry this wants on PciLabSession.
// ---------------------------------------------------------------------------

import type { PciInputBinding } from "./index";
import type { PciInputSession } from "../pciInputTarget";
import type { PciGeom, PciScenario, PciState } from "../../../simulation/pci/state";
import { checkMicroBackflow, injectMicrocatheter, moveMicrocatheter, torqueMicrocatheter } from "../../../simulation/pci/actions/wire";

/** The attending's action names the wire and microcatheter actions are asked under (PciLabSession PciAction). */
export type WireActionName = "advance-wire" | "torque-wire" | "wire-kind" | "inject" | "remove-device" | "load-device";

/** What a session needs for the wire actions: the scenario, the geometry, the state and an action entry. */
export interface WireActionSession {
  readonly s: PciScenario | PciInputSession["s"];
  readonly g: PciGeom;
  readonly st: PciState;
  /** a public entry for an engine change asked of the attending (preferred when present) */
  applyWireAction?(action: WireActionName, f: (x: PciState) => PciState): boolean;
}

/** Plunger force or pull above which the syringe on the microcatheter hub acts (the PCI target's PCI_PLUNGER_ON). */
export const MC_PLUNGER_ON = 0.08;

/**
 * Apply an engine change to the session as an operator action. Returns false when the session has no
 * action entry, or the attending stopped it.
 */
export function applyWireAction(session: WireActionSession, action: WireActionName, f: (x: PciState) => PciState): boolean {
  if (typeof session.applyWireAction === "function") return session.applyWireAction(action, f);
  const act = (session as unknown as { act?: (a: string, fn: (x: PciState) => PciState) => boolean }).act;
  if (typeof act === "function") return act.call(session, action, f);
  // no action entry: a renamed or removed session act() would otherwise silence every microcatheter hand action
  if (import.meta.env?.DEV) throw new Error("applyWireAction: the PCI session offers neither applyWireAction() nor act(); the microcatheter's hand actions cannot reach the engine.");
  return false;
}

/** The syringe on the microcatheter hub: one injection or one backflow check per press (per session). */
const latches = new WeakMap<object, { inject: boolean; aspirate: boolean }>();
function latch(session: object) {
  let l = latches.get(session);
  if (!l) latches.set(session, (l = { inject: false, aspirate: false }));
  return l;
}

const scen = (x: WireActionSession) => x.s as PciScenario;

export const binding: PciInputBinding = {
  device: "microcatheter",
  actions: {
    advance: ({ session }, mm) => {
      const x = session as unknown as WireActionSession;
      if (!x.st.wire.micro) return false;
      return applyWireAction(x, "advance-wire", (st) => moveMicrocatheter(scen(x), x.g, st, Math.abs(mm)));
    },
    withdraw: ({ session }, mm) => {
      const x = session as unknown as WireActionSession;
      if (!x.st.wire.micro) return false;
      return applyWireAction(x, "advance-wire", (st) => moveMicrocatheter(scen(x), x.g, st, -Math.abs(mm)));
    },
    torque: ({ session }, rad) => {
      const x = session as unknown as WireActionSession;
      if (!x.st.wire.micro) return false;
      return applyWireAction(x, "torque-wire", (st) => torqueMicrocatheter(st, rad));
    },
    inject: ({ session }, force) => {
      const x = session as unknown as WireActionSession;
      if (!x.st.wire.micro) return false;
      const l = latch(session);
      if (force > MC_PLUNGER_ON && !l.inject) {
        l.inject = true;
        return applyWireAction(x, "inject", (st) => injectMicrocatheter(scen(x), x.g, st));
      }
      if (force <= MC_PLUNGER_ON) l.inject = false;
      return true;
    },
    aspirate: ({ session }, pull) => {
      const x = session as unknown as WireActionSession;
      if (!x.st.wire.micro) return false;
      const l = latch(session);
      if (pull > MC_PLUNGER_ON && !l.aspirate) {
        l.aspirate = true;
        return applyWireAction(x, "inject", (st) => checkMicroBackflow(st));
      }
      if (pull <= MC_PLUNGER_ON) l.aspirate = false;
      return true;
    },
  },
};
