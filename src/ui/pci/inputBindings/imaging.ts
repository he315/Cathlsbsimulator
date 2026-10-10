// ---------------------------------------------------------------------------
// Hand bindings of the imaging catheter (pci-intravascular-imaging).
//
// The imaging catheter (rotational IVUS, phased-array IVUS or OCT) rides the
// coronary wire in the input layer's 'ivus' slot. The hands:
//   advance, withdraw  move it along the wire (mm of hub travel); it stops at a
//                      lesion too tight for it, and kinks if pushed on against it
//                      (src/simulation/pci/actions/imaging.ts advanceImaging)
//   pin                the left hand holds the catheter and the wire together
//                      (a forceful OCT flush does not then drive them distally)
//   flush              the OCT flush through the guide (plunger force 0..1, one
//                      flush per press) at the rate and for the time set in the
//                      imaging console; by hand the rate is limited by the guide
// The console (src/ui/pci/consoles/ImagingConsole.tsx) holds the settings and
// the read-outs only. These bindings replace the input target's built-in route
// for the 'ivus' slot (the assisted moveDevice), so the catheter meets the
// lesion as the engine models it.
//
// The flush's contrast reaches the case total two ways at once: the engine adds
// it to the procedure's contrast (st.contrastMl), and the binding books it on the
// guide's syringe, whose measured volume is the session's contrast total
// (PciLabSession.contrastPushed, booked to the patient at the end of the next
// run). The session has no public entry for contrast that does not come from a
// syringe push; the package report names the one this wants.
// ---------------------------------------------------------------------------

import type { PciInputBinding } from "./index";
import type { PciGeom, PciScenario, PciState } from "../../../simulation/pci/state";
import { acqOf, advanceImaging, holdImaging, octFlush } from "../../../simulation/pci/actions/imaging";
import { OCT_FLUSH_TYPICAL, octFlushOutcome } from "../../../simulation/pci/ivus";
import type { WireActionSession } from "./wire";

/** What the imaging bindings need of a session (PciLabSession satisfies it). */
export interface ImagingSession extends WireActionSession {
  readonly s: PciScenario | WireActionSession["s"];
  readonly g: PciGeom;
  readonly st: PciState;
  /** the guide's syringe, whose booked volume is the session's contrast total */
  readonly syringes?: { guide: { stats: { totalMl: number } } };
  /** the team's telemetry (a nitrate given through the team) */
  readonly crew?: { log: readonly { kind: string; data?: unknown }[] } | null;
  notify?(): void;
}

/** The OCT flush the console sets (per session). */
export interface FlushSettings {
  injector: boolean;
  rateMlS: number;
  durationS: number;
  /** trigger the pullback by hand when the lumen does not clear */
  manualTrigger: boolean;
}

const settings = new WeakMap<object, FlushSettings>();

/** The flush settings of a session (the typical injector setting for the scenario's side until changed). */
export function flushSettings(session: object & { s: { side: "left" | "right" } }): FlushSettings {
  let f = settings.get(session);
  if (!f) {
    const t = OCT_FLUSH_TYPICAL[session.s.side];
    settings.set(session, (f = { injector: true, rateMlS: t.rateMlS, durationS: t.durationS, manualTrigger: false }));
  }
  return f;
}

export function setFlushSettings(session: object & { s: { side: "left" | "right" } }, p: Partial<FlushSettings>) {
  settings.set(session, { ...flushSettings(session), ...p });
}

/** The team has given intracoronary nitrate during the case (their telemetry). */
export function nitrateGiven(session: ImagingSession): boolean {
  const log = session.crew?.log ?? [];
  return log.some((e) => {
    if (e.kind !== "team.drug-given") return false;
    const d = (e.data ?? {}) as Record<string, unknown>;
    return d.drug === "gtn" || /nitr/i.test(String(d.drug ?? ""));
  });
}

/** The attending's action names the imaging actions are asked under (PciLabSession PciAction). */
export type ImagingActionName = "load-device" | "advance-device" | "remove-device" | "inject";

/**
 * Apply an engine change to the session as an operator action, asked of the attending first (the session's
 * own action path, as src/ui/pci/inputBindings/wire.ts applyWireAction). False when the session has no
 * action entry or the attending stopped it.
 */
export function applyImagingAction(session: object, action: ImagingActionName, f: (x: PciState) => PciState): boolean {
  const pub = (session as { applyImagingAction?: (a: ImagingActionName, fn: (x: PciState) => PciState) => boolean }).applyImagingAction;
  if (typeof pub === "function") return pub.call(session, action, f);
  const act = (session as { act?: (a: string, fn: (x: PciState) => PciState) => boolean }).act;
  if (typeof act === "function") return act.call(session, action, f);
  return false;
}

/** Plunger force above which the flush is pressed (the input target's PCI_PLUNGER_ON). */
export const FLUSH_PRESS_ON = 0.08;

/**
 * The OCT flush through the guide with the console's settings: the engine records the flush (and triggers the
 * run when the lumen clears), and its volume is booked on the guide's syringe so it counts in the session's
 * contrast total. False when there is no OCT catheter, or the attending stopped it.
 */
export function octFlushThroughGuide(session: ImagingSession, o: Partial<FlushSettings> = {}): boolean {
  const acq = acqOf(session.st);
  if (!acq || acq.tech !== "oct") return false;
  const set = { ...flushSettings(session as ImagingSession & { s: { side: "left" | "right" } }), ...o };
  const s = session.s as PciScenario;
  const out = octFlushOutcome({ rateMlS: set.rateMlS, durationS: set.durationS, injector: set.injector, french: session.st.guide.french, side: s.side }, acq.octMode);
  const before = session.st.log.length;
  const ok = applyImagingAction(session, "inject", (st) => octFlush(s, session.g, st, { rateMlS: set.rateMlS, durationS: set.durationS, injector: set.injector, manualTrigger: set.manualTrigger, nitrate: nitrateGiven(session) }));
  if (!ok) return false;
  const flushed = session.st.log.slice(before).some((r) => r.kind === "imaging-flush");
  if (flushed && session.syringes) {
    session.syringes.guide.stats.totalMl += out.volumeMl;
    session.notify?.();
  }
  return true;
}

/** One flush per press (per session). */
const pressed = new WeakMap<object, boolean>();

const scen = (x: ImagingSession) => x.s as PciScenario;
const onWire = (x: ImagingSession) => !!acqOf(x.st);

export const binding: PciInputBinding = {
  device: "ivus",
  actions: {
    advance: ({ session }, mm) => {
      const x = session as unknown as ImagingSession;
      if (!onWire(x)) return false;
      if (x.st.ivus?.active) return true;
      return applyImagingAction(x, "advance-device", (st) => advanceImaging(scen(x), x.g, st, Math.abs(mm)));
    },
    withdraw: ({ session }, mm) => {
      const x = session as unknown as ImagingSession;
      if (!onWire(x)) return false;
      if (x.st.ivus?.active) return true;
      return applyImagingAction(x, "advance-device", (st) => advanceImaging(scen(x), x.g, st, -Math.abs(mm)));
    },
    pin: ({ session }, v) => {
      const x = session as unknown as ImagingSession;
      if (!onWire(x)) return false;
      return applyImagingAction(x, "advance-device", (st) => holdImaging(st, v > 0));
    },
    flush: ({ session }, force) => {
      const x = session as unknown as ImagingSession;
      const acq = acqOf(x.st);
      if (!acq || acq.tech !== "oct") return false;
      if (force > FLUSH_PRESS_ON && !pressed.get(session)) {
        pressed.set(session, true);
        return octFlushThroughGuide(x);
      }
      if (force <= FLUSH_PRESS_ON) pressed.set(session, false);
      return true;
    },
  },
};
