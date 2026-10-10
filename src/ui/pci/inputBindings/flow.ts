// ---------------------------------------------------------------------------
// Hand bindings of the intracoronary drug syringe and the manifold (pci-flow-closure).
//
// The hands reach the drug through the manifold syringe they already hold
// (device 'syringe', the table-side Inject, Flush and Aspirate): the flow
// console (src/ui/pci/consoles/FlowConsole.tsx) only draws a dose up and says
// where the drug syringe is connected (the guide's manifold, or the hub of the
// microcatheter in the vessel). This binding adds to the target's built-in
// syringe route (src/ui/pci/pciInputTarget.ts), which it replaces only where it
// takes a press:
//   inject     with a dose drawn up, a fresh push gives it by the route set:
//              into the guide, or distally through the microcatheter
//              (actions/drugs.ts giveIcDrug), and the same dose to the patient
//              engine (its formulary, route 'ic'). The syringe is then empty, so
//              the next push is contrast again. A push the engine refuses (no
//              microcatheter out, the guide not engaged) is still taken, so no
//              contrast goes in instead; the log says why nothing was given.
//              With nothing drawn up the push is the contrast injection
//              (returns false: the built-in route).
//   flush      the built-in saline flush always runs (returns false); a hard push
//              (force MP_FORCEFUL_FLUSH or more) with air in the vessel is also
//              the forceful saline injection that breaks the bubbles up and
//              drives them on (the 'forceful-saline' bail-out)
//   aspirate   the built-in aspiration always runs (returns false); drawing back
//              also aspirates the guide (air comes back through it, the
//              'aspirate-guide' bail-out, when air is in the vessel) and checks
//              the manifold and its connections (bailouts.ts checkManifold) when
//              there is air in the guide or an air event since the last check
// Each engine change goes through the session's operator-action path, asked of
// the attending as 'drug' (applyDeliveryAction, ./support.ts). A session
// without that path (a bare input-target test double) gets the built-in route
// only.
// ---------------------------------------------------------------------------

import type { PciInputBinding } from "./index";
import type { PciGeom, PciScenario, PciState } from "../../../simulation/pci/state";
import { bailout, giveIcDrug, icFormularyDose, type IcAgent, type IcRoute } from "../../../simulation/pci/actions/drugs";
import { checkManifold, manifoldCheckedSinceAir } from "../../../simulation/pci/actions/bailouts";
import { applyDeliveryAction } from "./support";

/** Plunger force or pull above which the syringe acts (the PCI target's PCI_PLUNGER_ON). */
export const IC_PLUNGER_ON = 0.08;
/** Plunger force (0..1) at or above which a saline flush is a forceful injection. MODEL PARAMETER (docs/realism/facts/pkg-pci-flow-closure.md). */
export const MP_FORCEFUL_FLUSH = 0.6;

/** What the syringe holds and where it is connected (the flow console's settings). */
export interface IcSyringe {
  agent: IcAgent | null;
  /** the dose drawn up (µg) */
  doseUg: number;
  route: IcRoute;
}

const DEFAULT_SYRINGE: IcSyringe = { agent: null, doseUg: 0, route: "guide" };
const syringes = new WeakMap<object, IcSyringe>();

/** The syringe of this session (nothing drawn up until the console sets it). */
export function icSyringe(session: object): IcSyringe {
  return { ...(syringes.get(session) ?? DEFAULT_SYRINGE) };
}

/** Draw up an agent and dose, or connect the syringe to the guide or the microcatheter (a console setting). */
export function setIcSyringe(session: object, s: Partial<IcSyringe>): void {
  const cur = icSyringe(session);
  const next: IcSyringe = { ...cur, ...s };
  next.doseUg = Number.isFinite(next.doseUg) ? Math.max(0, next.doseUg) : 0;
  syringes.set(session, next);
}

/** What a session needs here: the scenario, the geometry, the state, and the patient engine when it has one. */
interface FlowSession {
  readonly s: PciScenario | { side: "left" | "right" };
  readonly g: PciGeom;
  readonly st: PciState;
  readonly engine?: { giveDrug(drug: string, dose: number, route: string, opts?: { side?: "left" | "right"; vessel?: string }): unknown };
}

/** Each control's press (per session): down while held; mine when this binding took the press (flush: gave the forceful injection in it). */
interface Press {
  down: boolean;
  mine: boolean;
}
const presses = new WeakMap<object, Record<"inject" | "flush" | "aspirate", Press>>();
function pressOf(session: object, key: "inject" | "flush" | "aspirate"): Press {
  let p = presses.get(session);
  if (!p) presses.set(session, (p = { inject: { down: false, mine: false }, flush: { down: false, mine: false }, aspirate: { down: false, mine: false } }));
  return p[key];
}

const scen = (x: FlowSession) => x.s as PciScenario;

/** The session offers the engine path and a procedure state (a real lab session, not a bare test double). */
function engineSession(session: object): boolean {
  const x = session as FlowSession & { applyDeliveryAction?: unknown; act?: unknown };
  return (typeof x.applyDeliveryAction === "function" || typeof x.act === "function") && !!x.st?.cx && Array.isArray(x.st.log) && !!x.g;
}

/** Air is in the coronary now (an unresolved air complication). */
const airInVessel = (st: PciState) => st.cx.list.some((c) => c.kind === "air" && c.stage !== "resolved");

/** A dose is drawn up. */
const drawnUp = (session: object) => {
  const sy = icSyringe(session);
  return !!sy.agent && sy.doseUg > 0;
};

/**
 * Give the drawn-up dose by the route set: to the procedure record and to the patient engine. True only when
 * it was given (an 'ic-drug' record); false when nothing is drawn up, the attending stopped it or the engine
 * refused it (no microcatheter out, the guide not engaged: the log says which). A given dose empties the syringe.
 */
export function injectIcDrug(session: object): boolean {
  const x = session as FlowSession;
  const sy = icSyringe(session);
  if (!sy.agent || !(sy.doseUg > 0)) return false;
  const agent = sy.agent;
  const n0 = x.st.log.length;
  const ok = applyDeliveryAction(session, "drug", (st) => giveIcDrug(scen(x), x.g, st, { agent, doseUg: sy.doseUg, route: sy.route }));
  if (!ok) return false;
  const given = x.st.log.slice(n0).some((r) => r.kind === "ic-drug");
  if (!given) return false;
  setIcSyringe(session, { doseUg: 0 });
  const f = icFormularyDose(agent, sy.doseUg);
  if (f && x.engine) x.engine.giveDrug(f.drug, f.dose, f.route, { side: x.s.side, vessel: x.g.lesion.vessel });
  return true;
}

/** A forceful saline injection through the guide (the air bail-out). */
export function forcefulSaline(session: object): boolean {
  const x = session as FlowSession;
  return applyDeliveryAction(session, "drug", (st) => bailout(scen(x), x.g, st, "forceful-saline"));
}

/** Draw back on the manifold: aspirate the guide and check the manifold and connections. */
export function aspirateAndCheck(session: object): boolean {
  const x = session as FlowSession;
  return applyDeliveryAction(session, "drug", (st) => checkManifold(bailout(scen(x), x.g, st, "aspirate-guide")));
}

/** Drawing back on the manifold, as far as the engine needs it: the guide aspirated with air in the vessel, the system checked after air. */
function onDrawBack(session: object): void {
  const x = session as FlowSession;
  const st = x.st;
  if (airInVessel(st)) {
    aspirateAndCheck(session);
    return;
  }
  if (st.cx.guideAirMl > 0.01 || !manifoldCheckedSinceAir(st)) applyDeliveryAction(session, "drug", (s) => checkManifold(s));
}

/**
 * A fresh press (from released) runs `f` once. `take` says whether this binding took the press (the target's
 * built-in route then does not see it, nor its release); otherwise the press and its release go to the built-in.
 */
function handle(session: object, key: "inject" | "flush" | "aspirate", v: number, take: () => boolean): boolean {
  const p = pressOf(session, key);
  if (v > IC_PLUNGER_ON) {
    if (p.down) return p.mine;
    p.down = true;
    p.mine = take();
    return p.mine;
  }
  const mine = p.mine;
  p.down = false;
  p.mine = false;
  return mine;
}

export const binding: PciInputBinding = {
  device: "syringe",
  actions: {
    inject: ({ session }, force) =>
      handle(session, "inject", force, () => {
        if (!engineSession(session) || !drawnUp(session)) return false;
        injectIcDrug(session);
        return true;
      }),
    // the built-in flush sees every command; the forceful injection is given once per press, when the push first reaches MP_FORCEFUL_FLUSH
    flush: ({ session }, force) => {
      const p = pressOf(session, "flush");
      if (force <= IC_PLUNGER_ON) {
        p.down = p.mine = false;
        return false;
      }
      p.down = true;
      if (!p.mine && force >= MP_FORCEFUL_FLUSH && engineSession(session) && airInVessel((session as FlowSession).st)) {
        p.mine = true;
        forcefulSaline(session);
      }
      return false;
    },
    aspirate: ({ session }, pull) =>
      handle(session, "aspirate", pull, () => {
        if (engineSession(session)) onDrawBack(session);
        return false;
      }),
  },
};
